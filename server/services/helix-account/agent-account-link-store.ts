import crypto from "node:crypto";
import type { Pool, PoolClient } from "pg";
import {
  ensureDatabase,
  getPool,
  persistLocalDatabaseSnapshotIfEnabled,
} from "../../db/client";

type RecordLike = Record<string, unknown>;

export type HelixAgentAccountLinkSession = {
  sessionId: string;
  profileId: string;
};

/**
 * This value must be constructed only after an authorization-server adapter
 * has verified the external identity. It is deliberately not accepted by a
 * public JSON route.
 */
export type VerifiedExternalAgentIdentity = {
  issuer: string;
  audience: string;
  tenantId: string;
  providerAlias: string;
  subject: string;
};

export type HelixAgentAccountBindingProjection = {
  binding_ref: string;
  issuer: string;
  tenant_ref: string;
  provider: string;
  status: "active" | "revoked";
  created_at: string;
  updated_at: string;
  revoked_at: string | null;
  subject_included: false;
  bearer_included: false;
};

export class HelixAgentAccountLinkError extends Error {
  constructor(
    readonly status: number,
    readonly code:
      | "invalid_request"
      | "session_required"
      | "link_intent_not_found"
      | "link_intent_mismatch"
      | "link_intent_expired"
      | "link_intent_consumed"
      | "provider_subject_conflict"
      | "binding_conflict"
      | "binding_revoked"
      | "binding_not_found",
    message: string,
    readonly details?: RecordLike,
  ) {
    super(message);
    this.name = "HelixAgentAccountLinkError";
  }
}

type LinkIntentRow = {
  intent_id: string;
  state_hash: string;
  profile_id: string;
  session_id: string;
  expected_issuer: string;
  expected_audience: string;
  expected_provider: string;
  status: string;
  created_at: unknown;
  expires_at: unknown;
  completed_at: unknown;
  cancelled_at: unknown;
};

type BindingRow = {
  issuer: string;
  tenant_id: string;
  provider: string;
  provider_subject: string;
  profile_id: string;
  created_at: unknown;
  updated_at: unknown;
  revoked_at: unknown;
  revoked_reason: string | null;
};

type StoreDependencies = {
  pool?: Pool;
  now?: () => Date;
  randomBytes?: (size: number) => Buffer;
  randomId?: () => string;
  persist?: () => Promise<void>;
};

const clean = (value: string, field: string, maxLength = 512): string => {
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new HelixAgentAccountLinkError(
      400,
      "invalid_request",
      `${field} is required and must not exceed ${maxLength} characters.`,
      { field },
    );
  }
  return normalized;
};

const exactHttpsUrl = (value: string, field: string): string => {
  const normalized = clean(value, field, 2_048);
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new HelixAgentAccountLinkError(
      400,
      "invalid_request",
      `${field} must be an absolute HTTPS URL.`,
      { field },
    );
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.hash
  ) {
    throw new HelixAgentAccountLinkError(
      400,
      "invalid_request",
      `${field} must be an absolute HTTPS URL without credentials or fragments.`,
      { field },
    );
  }
  return normalized;
};

const providerAlias = (value: string): string => {
  const normalized = clean(value, "provider", 64).toLowerCase();
  if (!/^[a-z][a-z0-9._-]*$/u.test(normalized)) {
    throw new HelixAgentAccountLinkError(
      400,
      "invalid_request",
      "provider must be a stable lowercase provider alias.",
      { field: "provider" },
    );
  }
  return normalized;
};

const iso = (value: unknown): string => {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(String(value));
  return Number.isFinite(parsed.getTime())
    ? parsed.toISOString()
    : String(value);
};

const nullableIso = (value: unknown): string | null =>
  value === null || value === undefined ? null : iso(value);

const sha256 = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex");

const stateHash = (state: string): string => `sha256:${sha256(state)}`;

const tenantRef = (tenantId: string): string =>
  `tenant:sha256:${sha256(tenantId).slice(0, 24)}`;

const bindingRef = (
  row: Pick<
    BindingRow,
    "issuer" | "tenant_id" | "provider" | "provider_subject"
  >,
): string =>
  `agent-binding:sha256:${sha256(
    [row.issuer, row.tenant_id, row.provider, row.provider_subject].join("\n"),
  ).slice(0, 32)}`;

const activeSession = async (
  client: PoolClient,
  input: HelixAgentAccountLinkSession,
  at: Date,
): Promise<void> => {
  const sessionId = clean(input.sessionId, "session_id", 512);
  const profileId = clean(input.profileId, "profile_id", 512);
  const { rows } = await client.query<{ session_id: string }>(
    `
      SELECT s.session_id
      FROM helix_account_sessions s
      JOIN helix_accounts a ON a.profile_id = s.profile_id
      WHERE s.session_id = $1
        AND s.profile_id = $2
        AND s.status = 'active'
        AND a.deleted_at IS NULL
        AND (s.expires_at IS NULL OR s.expires_at > $3)
      LIMIT 1
      FOR UPDATE;
    `,
    [sessionId, profileId, at.toISOString()],
  );
  if (!rows[0]) {
    throw new HelixAgentAccountLinkError(
      401,
      "session_required",
      "An active Helix account session for the same profile is required.",
    );
  }
};

const bindingProjection = (
  row: BindingRow,
): HelixAgentAccountBindingProjection => ({
  binding_ref: bindingRef(row),
  issuer: row.issuer,
  tenant_ref: tenantRef(row.tenant_id),
  provider: row.provider,
  status: row.revoked_at ? "revoked" : "active",
  created_at: iso(row.created_at),
  updated_at: iso(row.updated_at),
  revoked_at: nullableIso(row.revoked_at),
  subject_included: false,
  bearer_included: false,
});

export class HelixAgentAccountLinkStore {
  private readonly injectedPool?: Pool;
  private readonly now: () => Date;
  private readonly randomBytes: (size: number) => Buffer;
  private readonly randomId: () => string;
  private readonly persist: () => Promise<void>;

  constructor(dependencies: StoreDependencies = {}) {
    this.injectedPool = dependencies.pool;
    this.now = dependencies.now ?? (() => new Date());
    this.randomBytes = dependencies.randomBytes ?? crypto.randomBytes;
    this.randomId = dependencies.randomId ?? crypto.randomUUID;
    this.persist =
      dependencies.persist ?? persistLocalDatabaseSnapshotIfEnabled;
  }

  private async pool(): Promise<Pool> {
    if (this.injectedPool) return this.injectedPool;
    await ensureDatabase();
    return getPool();
  }

  private async transaction<T>(
    operation: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await (await this.pool()).connect();
    let committed = false;
    try {
      await client.query("BEGIN");
      const result = await operation(client);
      await client.query("COMMIT");
      committed = true;
      await this.persist();
      return result;
    } catch (error) {
      if (!committed) {
        await client.query("ROLLBACK").catch(() => undefined);
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async createLinkIntent(input: {
    session: HelixAgentAccountLinkSession;
    expectedIssuer: string;
    expectedAudience: string;
    expectedProvider: string;
    ttlSeconds?: number;
  }): Promise<{
    schema: "helix.agent_account_link_intent.v1";
    intent_id: string;
    state: string;
    expected_issuer: string;
    expected_audience: string;
    expected_provider: string;
    expires_at: string;
    state_persisted_raw: false;
  }> {
    const expectedIssuer = exactHttpsUrl(
      input.expectedIssuer,
      "expected_issuer",
    );
    const expectedAudience = exactHttpsUrl(
      input.expectedAudience,
      "expected_audience",
    );
    const expectedProvider = providerAlias(input.expectedProvider);
    const ttlSeconds = Math.max(
      60,
      Math.min(30 * 60, Math.floor(input.ttlSeconds ?? 10 * 60)),
    );
    const now = this.now();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1_000);
    const intentId = `agent_link_intent_${this.randomId()}`;
    const state = this.randomBytes(32).toString("base64url");
    const hashedState = stateHash(state);

    await this.transaction(async (client: PoolClient) => {
      await activeSession(client, input.session, now);
      await client.query(
        `
          INSERT INTO helix_agent_account_link_intents (
            intent_id,
            state_hash,
            profile_id,
            session_id,
            expected_issuer,
            expected_audience,
            expected_provider,
            status,
            created_at,
            expires_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9);
        `,
        [
          intentId,
          hashedState,
          input.session.profileId,
          input.session.sessionId,
          expectedIssuer,
          expectedAudience,
          expectedProvider,
          now.toISOString(),
          expiresAt.toISOString(),
        ],
      );
      await client.query(
        `
          INSERT INTO helix_account_events (
            event_id,
            profile_id,
            session_id,
            event_type,
            payload,
            created_at
          )
          VALUES ($1, $2, $3, 'agent_oauth_link_intent_created', $4::jsonb, $5);
        `,
        [
          `acct_evt_${this.randomId()}`,
          input.session.profileId,
          input.session.sessionId,
          JSON.stringify({
            schema: "helix.agent_account_link_event.v1",
            intent_id: intentId,
            expected_issuer: expectedIssuer,
            expected_audience: expectedAudience,
            expected_provider: expectedProvider,
            state_included: false,
            bearer_included: false,
          }),
          now.toISOString(),
        ],
      );
    });

    return {
      schema: "helix.agent_account_link_intent.v1",
      intent_id: intentId,
      state,
      expected_issuer: expectedIssuer,
      expected_audience: expectedAudience,
      expected_provider: expectedProvider,
      expires_at: expiresAt.toISOString(),
      state_persisted_raw: false,
    };
  }

  async completeLinkIntent(input: {
    session: HelixAgentAccountLinkSession;
    state: string;
    identity: VerifiedExternalAgentIdentity;
    reactivate?: boolean;
  }): Promise<{
    schema: "helix.agent_account_binding_receipt.v1";
    operation: "agent_account_binding.complete";
    binding: HelixAgentAccountBindingProjection;
    reactivated: boolean;
    reused_binding: boolean;
    answer_authority: false;
    assistant_answer: false;
    raw_identity_included: false;
    bearer_included: false;
  }> {
    const state = clean(input.state, "state", 512);
    if (!/^[A-Za-z0-9_-]{32,512}$/u.test(state)) {
      throw new HelixAgentAccountLinkError(
        400,
        "invalid_request",
        "The OAuth link state is malformed.",
        { field: "state" },
      );
    }
    const identity = {
      issuer: exactHttpsUrl(input.identity.issuer, "issuer"),
      audience: exactHttpsUrl(input.identity.audience, "audience"),
      tenantId: clean(input.identity.tenantId, "tenant_id"),
      providerAlias: providerAlias(input.identity.providerAlias),
      subject: clean(input.identity.subject, "subject", 2_048),
    };
    const now = this.now();

    return this.transaction(async (client: PoolClient) => {
      await activeSession(client, input.session, now);
      const { rows: intentRows } = await client.query<LinkIntentRow>(
        `
          SELECT *
          FROM helix_agent_account_link_intents
          WHERE state_hash = $1
          LIMIT 1
          FOR UPDATE;
        `,
        [stateHash(state)],
      );
      const intent = intentRows[0];
      if (!intent) {
        throw new HelixAgentAccountLinkError(
          404,
          "link_intent_not_found",
          "The OAuth account-link intent was not found.",
        );
      }
      if (
        intent.profile_id !== input.session.profileId ||
        intent.session_id !== input.session.sessionId
      ) {
        throw new HelixAgentAccountLinkError(
          403,
          "link_intent_mismatch",
          "The OAuth account-link intent belongs to another session or profile.",
        );
      }
      if (intent.status !== "pending") {
        throw new HelixAgentAccountLinkError(
          409,
          "link_intent_consumed",
          "The OAuth account-link intent has already been consumed.",
          { status: intent.status },
        );
      }
      if (Date.parse(iso(intent.expires_at)) <= now.getTime()) {
        throw new HelixAgentAccountLinkError(
          410,
          "link_intent_expired",
          "The OAuth account-link intent has expired.",
        );
      }
      if (
        intent.expected_issuer !== identity.issuer ||
        intent.expected_audience !== identity.audience ||
        intent.expected_provider !== identity.providerAlias
      ) {
        throw new HelixAgentAccountLinkError(
          403,
          "link_intent_mismatch",
          "The verified external identity does not match the OAuth link intent.",
        );
      }

      const { rows: linkRows } = await client.query<{
        profile_id: string;
      }>(
        `
          SELECT profile_id
          FROM helix_account_linked_providers
          WHERE provider = $1
            AND provider_subject = $2
          LIMIT 1
          FOR UPDATE;
        `,
        [identity.providerAlias, identity.subject],
      );
      const linkedProfile = linkRows[0]?.profile_id;
      if (linkedProfile && linkedProfile !== input.session.profileId) {
        throw new HelixAgentAccountLinkError(
          409,
          "provider_subject_conflict",
          "That verified provider identity is linked to another Helix profile.",
        );
      }
      if (!linkedProfile) {
        await client.query(
          `
            INSERT INTO helix_account_linked_providers (
              provider,
              provider_subject,
              profile_id,
              created_at,
              updated_at
            )
            VALUES ($1, $2, $3, $4, $4);
          `,
          [
            identity.providerAlias,
            identity.subject,
            input.session.profileId,
            now.toISOString(),
          ],
        );
      } else {
        await client.query(
          `
            UPDATE helix_account_linked_providers
            SET updated_at = $1
            WHERE provider = $2
              AND provider_subject = $3
              AND profile_id = $4;
          `,
          [
            now.toISOString(),
            identity.providerAlias,
            identity.subject,
            input.session.profileId,
          ],
        );
      }

      const { rows: bindingRows } = await client.query<BindingRow>(
        `
          SELECT *
          FROM helix_agent_account_bindings
          WHERE issuer = $1
            AND tenant_id = $2
            AND provider = $3
            AND provider_subject = $4
          LIMIT 1
          FOR UPDATE;
        `,
        [
          identity.issuer,
          identity.tenantId,
          identity.providerAlias,
          identity.subject,
        ],
      );
      const existing = bindingRows[0];
      if (existing && existing.profile_id !== input.session.profileId) {
        throw new HelixAgentAccountLinkError(
          409,
          "binding_conflict",
          "That verified agent binding belongs to another Helix profile.",
        );
      }
      if (existing?.revoked_at && input.reactivate !== true) {
        throw new HelixAgentAccountLinkError(
          409,
          "binding_revoked",
          "That agent binding is revoked and requires explicit reactivation.",
        );
      }

      let reactivated = false;
      let reusedBinding = false;
      let binding: BindingRow;
      if (!existing) {
        const { rows } = await client.query<BindingRow>(
          `
            INSERT INTO helix_agent_account_bindings (
              issuer,
              tenant_id,
              provider,
              provider_subject,
              profile_id,
              created_at,
              updated_at,
              revoked_at,
              revoked_reason
            )
            VALUES ($1, $2, $3, $4, $5, $6, $6, NULL, NULL)
            RETURNING *;
          `,
          [
            identity.issuer,
            identity.tenantId,
            identity.providerAlias,
            identity.subject,
            input.session.profileId,
            now.toISOString(),
          ],
        );
        binding = rows[0];
      } else if (existing.revoked_at) {
        const { rows } = await client.query<BindingRow>(
          `
            UPDATE helix_agent_account_bindings
            SET revoked_at = NULL,
                revoked_reason = NULL,
                updated_at = $1
            WHERE issuer = $2
              AND tenant_id = $3
              AND provider = $4
              AND provider_subject = $5
              AND profile_id = $6
            RETURNING *;
          `,
          [
            now.toISOString(),
            identity.issuer,
            identity.tenantId,
            identity.providerAlias,
            identity.subject,
            input.session.profileId,
          ],
        );
        binding = rows[0];
        reactivated = true;
      } else {
        binding = existing;
        reusedBinding = true;
      }

      await client.query(
        `
          UPDATE helix_agent_account_link_intents
          SET status = 'completed',
              completed_at = $1
          WHERE intent_id = $2
            AND status = 'pending';
        `,
        [now.toISOString(), intent.intent_id],
      );
      const projected = bindingProjection(binding);
      await client.query(
        `
          INSERT INTO helix_account_events (
            event_id,
            profile_id,
            session_id,
            event_type,
            payload,
            created_at
          )
          VALUES ($1, $2, $3, 'agent_oauth_binding_linked', $4::jsonb, $5);
        `,
        [
          `acct_evt_${this.randomId()}`,
          input.session.profileId,
          input.session.sessionId,
          JSON.stringify({
            schema: "helix.agent_account_link_event.v1",
            intent_id: intent.intent_id,
            binding_ref: projected.binding_ref,
            issuer: projected.issuer,
            tenant_ref: projected.tenant_ref,
            provider: projected.provider,
            reactivated,
            reused_binding: reusedBinding,
            subject_included: false,
            bearer_included: false,
          }),
          now.toISOString(),
        ],
      );

      return {
        schema: "helix.agent_account_binding_receipt.v1",
        operation: "agent_account_binding.complete",
        binding: projected,
        reactivated,
        reused_binding: reusedBinding,
        answer_authority: false,
        assistant_answer: false,
        raw_identity_included: false,
        bearer_included: false,
      };
    });
  }

  async listBindings(input: {
    session: HelixAgentAccountLinkSession;
  }): Promise<{
    schema: "helix.agent_account_bindings.v1";
    oauth_ready: boolean;
    bindings: HelixAgentAccountBindingProjection[];
  }> {
    const pool = await this.pool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await activeSession(client, input.session, this.now());
      const { rows } = await client.query<BindingRow>(
        `
          SELECT *
          FROM helix_agent_account_bindings
          WHERE profile_id = $1
          ORDER BY updated_at DESC, created_at DESC;
        `,
        [input.session.profileId],
      );
      await client.query("COMMIT");
      const bindings = rows.map(bindingProjection);
      return {
        schema: "helix.agent_account_bindings.v1",
        oauth_ready: bindings.some(
          (binding: HelixAgentAccountBindingProjection) =>
            binding.status === "active",
        ),
        bindings,
      };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async revokeBinding(input: {
    session: HelixAgentAccountLinkSession;
    bindingRef: string;
    reason?: string;
  }): Promise<{
    schema: "helix.agent_account_binding_receipt.v1";
    operation: "agent_account_binding.revoke";
    binding: HelixAgentAccountBindingProjection;
    already_revoked: boolean;
    answer_authority: false;
    assistant_answer: false;
  }> {
    const requestedRef = clean(input.bindingRef, "binding_ref", 512);
    const reason = input.reason?.trim().slice(0, 512) || "user_revoked";
    const now = this.now();

    return this.transaction(async (client: PoolClient) => {
      await activeSession(client, input.session, now);
      const { rows } = await client.query<BindingRow>(
        `
          SELECT *
          FROM helix_agent_account_bindings
          WHERE profile_id = $1
          FOR UPDATE;
        `,
        [input.session.profileId],
      );
      const existing = rows.find(
        (row: BindingRow) => bindingRef(row) === requestedRef,
      );
      if (!existing) {
        throw new HelixAgentAccountLinkError(
          404,
          "binding_not_found",
          "The agent account binding was not found.",
        );
      }
      const alreadyRevoked = Boolean(existing.revoked_at);
      let binding = existing;
      if (!alreadyRevoked) {
        const { rows: updated } = await client.query<BindingRow>(
          `
            UPDATE helix_agent_account_bindings
            SET revoked_at = $1,
                revoked_reason = $2,
                updated_at = $1
            WHERE issuer = $3
              AND tenant_id = $4
              AND provider = $5
              AND provider_subject = $6
              AND profile_id = $7
            RETURNING *;
          `,
          [
            now.toISOString(),
            reason,
            existing.issuer,
            existing.tenant_id,
            existing.provider,
            existing.provider_subject,
            input.session.profileId,
          ],
        );
        binding = updated[0];
      }
      const projected = bindingProjection(binding);
      await client.query(
        `
          INSERT INTO helix_account_events (
            event_id,
            profile_id,
            session_id,
            event_type,
            payload,
            created_at
          )
          VALUES ($1, $2, $3, 'agent_oauth_binding_revoked', $4::jsonb, $5);
        `,
        [
          `acct_evt_${this.randomId()}`,
          input.session.profileId,
          input.session.sessionId,
          JSON.stringify({
            schema: "helix.agent_account_link_event.v1",
            binding_ref: projected.binding_ref,
            issuer: projected.issuer,
            tenant_ref: projected.tenant_ref,
            provider: projected.provider,
            already_revoked: alreadyRevoked,
            subject_included: false,
            bearer_included: false,
          }),
          now.toISOString(),
        ],
      );
      return {
        schema: "helix.agent_account_binding_receipt.v1",
        operation: "agent_account_binding.revoke",
        binding: projected,
        already_revoked: alreadyRevoked,
        answer_authority: false,
        assistant_answer: false,
      };
    });
  }
}

export const helixAgentAccountLinkStore = new HelixAgentAccountLinkStore();
