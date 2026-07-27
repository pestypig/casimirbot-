import { newDb } from "pg-mem";
import type { Pool } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { migration026 } from "../../../db/migrations/026_helix_accounts";
import { migration032 } from "../../../db/migrations/032_helix_agent_api";
import { migration035 } from "../../../db/migrations/035_helix_agent_account_links";
import {
  HelixAgentAccountLinkError,
  HelixAgentAccountLinkStore,
  type HelixAgentAccountLinkSession,
  type VerifiedExternalAgentIdentity,
} from "../agent-account-link-store";

const ISSUER = "https://auth.example";
const AUDIENCE = "https://casimirbot.com/mcp";
const PROVIDER = "test-oauth";

const identity = (
  overrides: Partial<VerifiedExternalAgentIdentity> = {},
): VerifiedExternalAgentIdentity => ({
  issuer: ISSUER,
  audience: AUDIENCE,
  tenantId: "tenant-alpha",
  providerAlias: PROVIDER,
  subject: "external-subject-alpha",
  ...overrides,
});

const session = (
  suffix = "alpha",
): HelixAgentAccountLinkSession => ({
  sessionId: `session-${suffix}`,
  profileId: `profile-${suffix}`,
});

describe("Helix agent OAuth account-link store", () => {
  let pool: Pool;
  let store: HelixAgentAccountLinkStore;
  let now: Date;
  let randomCounter: number;

  const insertSession = async (
    linkSession: HelixAgentAccountLinkSession,
  ): Promise<void> => {
    await pool.query(
      `
        INSERT INTO helix_accounts (
          profile_id,
          display_name,
          account_type,
          provider,
          provider_subject,
          created_at,
          updated_at
        )
        VALUES ($1, $2, 'developer', 'local', $1, $3, $3);
      `,
      [
        linkSession.profileId,
        linkSession.profileId,
        now.toISOString(),
      ],
    );
    await pool.query(
      `
        INSERT INTO helix_account_sessions (
          session_id,
          profile_id,
          status,
          memory_scope,
          account_policy,
          created_at,
          updated_at,
          expires_at
        )
        VALUES ($1, $2, 'active', 'profile', $3::jsonb, $4, $4, $5);
      `,
      [
        linkSession.sessionId,
        linkSession.profileId,
        JSON.stringify({ account_type: "developer" }),
        now.toISOString(),
        new Date(now.getTime() + 60 * 60_000).toISOString(),
      ],
    );
  };

  const createIntent = async (
    linkSession = session(),
  ) =>
    store.createLinkIntent({
      session: linkSession,
      expectedIssuer: ISSUER,
      expectedAudience: AUDIENCE,
      expectedProvider: PROVIDER,
      ttlSeconds: 120,
    });

  beforeEach(async () => {
    const db = newDb({ autoCreateForeignKeyIndices: true });
    const adapter = db.adapters.createPg();
    pool = new adapter.Pool() as unknown as Pool;
    const client = await pool.connect();
    try {
      const context = { enablePgvector: false };
      await migration026.run(client, context);
      await migration032.run(client, context);
      await migration035.run(client, context);
    } finally {
      client.release();
    }
    now = new Date("2026-07-26T18:00:00.000Z");
    randomCounter = 0;
    store = new HelixAgentAccountLinkStore({
      pool,
      now: () => new Date(now),
      randomId: () => `test_${++randomCounter}`,
      randomBytes: (size) => Buffer.alloc(size, ++randomCounter),
      persist: vi.fn().mockResolvedValue(undefined),
    });
    await insertSession(session());
  });

  it("stores only a state hash and emits no raw state or bearer material", async () => {
    const intent = await createIntent();
    const { rows } = await pool.query<{
      state_hash: string;
    }>(
      `SELECT state_hash FROM helix_agent_account_link_intents WHERE intent_id = $1`,
      [intent.intent_id],
    );
    const { rows: eventRows } = await pool.query<{ payload: unknown }>(
      `SELECT payload FROM helix_account_events WHERE event_type = 'agent_oauth_link_intent_created'`,
    );

    expect(intent.state).toMatch(/^[A-Za-z0-9_-]{32,}$/);
    expect(rows[0].state_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(rows[0].state_hash).not.toContain(intent.state);
    expect(JSON.stringify(eventRows)).not.toContain(intent.state);
    expect(JSON.stringify(eventRows).toLowerCase()).not.toContain(
      "bearer ",
    );
  });

  it("atomically links the provider and binding while returning a sanitized receipt", async () => {
    const intent = await createIntent();
    const receipt = await store.completeLinkIntent({
      session: session(),
      state: intent.state,
      identity: identity(),
    });
    const { rows: providerRows } = await pool.query(
      `SELECT provider, provider_subject, profile_id FROM helix_account_linked_providers WHERE provider = $1`,
      [PROVIDER],
    );
    const { rows: bindingRows } = await pool.query(
      `SELECT issuer, tenant_id, provider, provider_subject, profile_id, revoked_at FROM helix_agent_account_bindings`,
    );
    const listed = await store.listBindings({ session: session() });

    expect(providerRows).toEqual([
      {
        provider: PROVIDER,
        provider_subject: identity().subject,
        profile_id: session().profileId,
      },
    ]);
    expect(bindingRows).toEqual([
      {
        issuer: ISSUER,
        tenant_id: identity().tenantId,
        provider: PROVIDER,
        provider_subject: identity().subject,
        profile_id: session().profileId,
        revoked_at: null,
      },
    ]);
    expect(receipt).toMatchObject({
      operation: "agent_account_binding.complete",
      reactivated: false,
      reused_binding: false,
      raw_identity_included: false,
      bearer_included: false,
      binding: {
        provider: PROVIDER,
        status: "active",
        subject_included: false,
        bearer_included: false,
      },
    });
    expect(listed.oauth_ready).toBe(true);
    expect(JSON.stringify({ receipt, listed })).not.toContain(
      identity().subject,
    );
    expect(JSON.stringify({ receipt, listed }).toLowerCase()).not.toContain(
      "access_token",
    );

    await expect(
      store.completeLinkIntent({
        session: session(),
        state: intent.state,
        identity: identity(),
      }),
    ).rejects.toMatchObject({
      code: "link_intent_consumed",
    });
  });

  it("rejects an agent binding without the exact linked-provider owner tuple", async () => {
    await expect(
      pool.query(
        `
          INSERT INTO helix_agent_account_bindings (
            issuer,
            tenant_id,
            provider,
            provider_subject,
            profile_id,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $6);
        `,
        [
          ISSUER,
          identity().tenantId,
          PROVIDER,
          identity().subject,
          session().profileId,
          now.toISOString(),
        ],
      ),
    ).rejects.toThrow();
  });

  it("rolls back all link writes when the verified identity mismatches the intent", async () => {
    const intent = await createIntent();

    await expect(
      store.completeLinkIntent({
        session: session(),
        state: intent.state,
        identity: identity({ audience: "https://other.example/mcp" }),
      }),
    ).rejects.toMatchObject({
      code: "link_intent_mismatch",
    });

    const providerCount = await pool.query<{ count: number }>(
      `SELECT count(*)::int AS count FROM helix_account_linked_providers WHERE provider = $1`,
      [PROVIDER],
    );
    const bindingCount = await pool.query<{ count: number }>(
      `SELECT count(*)::int AS count FROM helix_agent_account_bindings`,
    );
    const intentStatus = await pool.query<{ status: string }>(
      `SELECT status FROM helix_agent_account_link_intents WHERE intent_id = $1`,
      [intent.intent_id],
    );
    expect(providerCount.rows[0].count).toBe(0);
    expect(bindingCount.rows[0].count).toBe(0);
    expect(intentStatus.rows[0].status).toBe("pending");
  });

  it("rejects cross-profile provider takeover without partial binding writes", async () => {
    await insertSession(session("beta"));
    await pool.query(
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
        PROVIDER,
        identity().subject,
        session("beta").profileId,
        now.toISOString(),
      ],
    );
    const intent = await createIntent();

    await expect(
      store.completeLinkIntent({
        session: session(),
        state: intent.state,
        identity: identity(),
      }),
    ).rejects.toMatchObject({
      code: "provider_subject_conflict",
    });
    const bindingCount = await pool.query<{ count: number }>(
      `SELECT count(*)::int AS count FROM helix_agent_account_bindings`,
    );
    expect(bindingCount.rows[0].count).toBe(0);
  });

  it("requires explicit reactivation after revocation", async () => {
    const firstIntent = await createIntent();
    const completed = await store.completeLinkIntent({
      session: session(),
      state: firstIntent.state,
      identity: identity(),
    });
    const revoked = await store.revokeBinding({
      session: session(),
      bindingRef: completed.binding.binding_ref,
      reason: "test revocation",
    });
    expect(revoked.binding.status).toBe("revoked");
    expect((await store.listBindings({ session: session() })).oauth_ready)
      .toBe(false);

    const secondIntent = await createIntent();
    await expect(
      store.completeLinkIntent({
        session: session(),
        state: secondIntent.state,
        identity: identity(),
      }),
    ).rejects.toMatchObject({
      code: "binding_revoked",
    });

    const reactivated = await store.completeLinkIntent({
      session: session(),
      state: secondIntent.state,
      identity: identity(),
      reactivate: true,
    });
    expect(reactivated).toMatchObject({
      reactivated: true,
      reused_binding: false,
      binding: { status: "active" },
    });
  });

  it("isolates binding listings by the active Helix profile", async () => {
    const intent = await createIntent();
    await store.completeLinkIntent({
      session: session(),
      state: intent.state,
      identity: identity(),
    });
    await insertSession(session("beta"));

    const alpha = await store.listBindings({ session: session() });
    const beta = await store.listBindings({ session: session("beta") });

    expect(alpha.bindings).toHaveLength(1);
    expect(beta).toEqual({
      schema: "helix.agent_account_bindings.v1",
      oauth_ready: false,
      bindings: [],
    });
  });

  it("rejects expired intents before any link write", async () => {
    const intent = await createIntent();
    now = new Date(now.getTime() + 121_000);

    await expect(
      store.completeLinkIntent({
        session: session(),
        state: intent.state,
        identity: identity(),
      }),
    ).rejects.toBeInstanceOf(HelixAgentAccountLinkError);
    await expect(
      store.completeLinkIntent({
        session: session(),
        state: intent.state,
        identity: identity(),
      }),
    ).rejects.toMatchObject({
      code: "link_intent_expired",
    });
    const bindingCount = await pool.query<{ count: number }>(
      `SELECT count(*)::int AS count FROM helix_agent_account_bindings`,
    );
    expect(bindingCount.rows[0].count).toBe(0);
  });
});
