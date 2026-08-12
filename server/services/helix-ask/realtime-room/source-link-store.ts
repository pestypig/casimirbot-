import crypto from "node:crypto";
import {
  HELIX_ROOM_SOURCE_BINDING_SCHEMA,
  HELIX_ROOM_SOURCE_INGRESS_SCOPES,
  type HelixRoomSourceBinding,
  type HelixRoomSourceIngressReceipt,
  type HelixRoomSourceIngressScope,
} from "@shared/helix-room-source-ingress";
import { HELIX_DEVELOPER_ACCOUNT_POLICY } from "@shared/helix-account-session";
import { resolveCasimirPublicBaseUrl } from "../../public-base-url";
import {
  isGuestSharedRealtimeRoomSourceIngressEnabled,
  isPublicSharedRealtimeRoomSourceIngressEnabled,
  resolveEffectiveAccountPolicyFromStoredRow,
} from "../../helix-account/account-session-store";
import { invalidateRoomSourceRuntimeState } from "../../situation-room/room-source-runtime-state";
import {
  containsProtectedRoomSourceSecret,
  projectRoomSourceRequestId,
  redactProtectedRoomSourceSecrets,
  replaceRoomSourceRequestIdInProjection,
} from "../../situation-room/room-source-ingress-security";
import {
  readSharedRealtimeRoomDatabase,
  withSharedRealtimeRoomTransaction,
} from "./room-store/database";
import type { Queryable } from "./room-store/types";
import {
  isEnvironmentAdapterRegistryError,
  resolveEnvironmentAdapterProfile,
} from "../../situation-room/environment-adapter-registry";

const DEFAULT_CREDENTIAL_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CREDENTIAL_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_REQUEST_FRESHNESS_MS = 5 * 60 * 1000;
const DEFAULT_REQUESTS_PER_MINUTE = 120;
const DEFAULT_REQUEST_PROCESSING_LEASE_MS = 2 * 60 * 1000;
const REQUEST_RETENTION_MS = 24 * 60 * 60 * 1000;
const MAX_TIMER_DELAY_MS = 2_147_000_000;
const bindingClaimTails = new Map<string, Promise<void>>();
const bindingExpiryTimers = new Map<string, ReturnType<typeof setTimeout>>();

const clearBindingExpiryTimer = (bindingId: string): void => {
  const timer = bindingExpiryTimers.get(bindingId);
  if (timer !== undefined) clearTimeout(timer);
  bindingExpiryTimers.delete(bindingId);
};

const invalidateBindingRuntimeState = (input: {
  bindingId: string;
  sourceId: string;
  roomId: string;
}): void => {
  clearBindingExpiryTimer(input.bindingId);
  invalidateRoomSourceRuntimeState({
    sourceId: input.sourceId,
    roomId: input.roomId,
  });
};

const scheduleBindingRuntimeExpiry = (
  binding: HelixRoomSourceBinding,
): void => {
  clearBindingExpiryTimer(binding.binding_id);
  if (binding.status !== "active" || !binding.expires_at) return;
  const expireOrReschedule = (): void => {
    const remainingMs = Date.parse(binding.expires_at!) - Date.now();
    if (remainingMs <= 0) {
      invalidateBindingRuntimeState({
        bindingId: binding.binding_id,
        sourceId: binding.source_id,
        roomId: binding.room_id,
      });
      return;
    }
    const timer = setTimeout(
      expireOrReschedule,
      Math.min(remainingMs, MAX_TIMER_DELAY_MS),
    );
    (
      timer as ReturnType<typeof setTimeout> & {
        unref?: () => void;
      }
    ).unref?.();
    bindingExpiryTimers.set(binding.binding_id, timer);
  };
  expireOrReschedule();
};

const withBindingClaimLock = async <T>(
  bindingId: string,
  run: () => Promise<T>,
): Promise<T> => {
  const previous = bindingClaimTails.get(bindingId) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve: () => void) => {
    release = resolve;
  });
  const tail = previous.catch(() => undefined).then(() => gate);
  bindingClaimTails.set(bindingId, tail);
  await previous.catch(() => undefined);
  try {
    return await run();
  } finally {
    release();
    if (bindingClaimTails.get(bindingId) === tail) {
      bindingClaimTails.delete(bindingId);
    }
  }
};

type BindingRow = {
  binding_id: string;
  room_id: string;
  owner_profile_id: string;
  source_id: string;
  world_id: string;
  domain_adapter: string;
  source_label: string;
  scopes: unknown;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
  revoked_at: Date | string | null;
  room_status: string;
  credential_id: string | null;
  token_prefix: string | null;
  credential_status: string | null;
  expires_at: Date | string | null;
  last_used_at: Date | string | null;
  request_count: number | string;
};

type CredentialRow = {
  credential_id: string;
  binding_id: string;
  token_hash: string;
  token_prefix: string;
  status: string;
  created_at: Date | string;
  expires_at: Date | string;
  revoked_at: Date | string | null;
};

type RequestRow = {
  binding_id: string;
  credential_id: string;
  request_id: string;
  producer_epoch: string;
  sequence_number: number | string;
  route_key: string;
  body_digest: string;
  sent_at: Date | string;
  received_at: Date | string;
  response_status: number | string | null;
  response_receipt: unknown;
};

export type RoomSourceIngressErrorCode =
  | "room_source_binding_invalid"
  | "room_source_binding_not_found"
  | "room_source_binding_forbidden"
  | "room_source_binding_closed"
  | "room_source_binding_revoked"
  | "room_source_owner_policy_revoked"
  | "room_source_credential_invalid"
  | "room_source_credential_expired"
  | "room_source_scope_denied"
  | "room_source_request_headers_invalid"
  | "room_source_request_stale"
  | "room_source_digest_mismatch"
  | "room_source_idempotency_conflict"
  | "room_source_sequence_out_of_order"
  | "room_source_request_in_progress"
  | "room_source_request_outcome_unknown"
  | "room_source_rate_limited"
  | "room_source_identity_mismatch"
  | "room_source_payload_invalid"
  | "room_source_payload_too_large"
  | "room_source_secret_exposure_rejected"
  | "room_source_execution_denied"
  | "room_source_probe_not_pending"
  | "environment_adapter_unknown"
  | "environment_adapter_disabled"
  | "environment_adapter_identity_mismatch"
  | "environment_adapter_protocol_unsupported"
  | "environment_adapter_manifest_incompatible"
  | "environment_adapter_admission_required"
  | "environment_adapter_contract_changed"
  | "environment_adapter_observation_schema_invalid"
  | "environment_adapter_mechanics_incompatible"
  | "room_source_unavailable";

export class RoomSourceIngressError extends Error {
  constructor(
    public readonly code: RoomSourceIngressErrorCode,
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "RoomSourceIngressError";
  }
}

export const isRoomSourceIngressError = (
  error: unknown,
): error is RoomSourceIngressError => error instanceof RoomSourceIngressError;

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const sha256Hex = (value: string): string =>
  crypto.createHash("sha256").update(value, "utf8").digest("hex");

const iso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const isoOrNull = (value: Date | string | null): string | null =>
  value === null ? null : iso(value);

const positiveInteger = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const requestFreshnessMs = (): number =>
  positiveInteger(
    process.env.HELIX_ROOM_INGRESS_FRESHNESS_MS,
    DEFAULT_REQUEST_FRESHNESS_MS,
  );

const requestRateLimit = (): number =>
  positiveInteger(
    process.env.HELIX_ROOM_INGRESS_REQUESTS_PER_MINUTE,
    DEFAULT_REQUESTS_PER_MINUTE,
  );

const requestProcessingLeaseMs = (): number =>
  positiveInteger(
    process.env.HELIX_ROOM_INGRESS_PROCESSING_LEASE_MS,
    DEFAULT_REQUEST_PROCESSING_LEASE_MS,
  );

const parseScopes = (value: unknown): HelixRoomSourceIngressScope[] => {
  const parsed =
    typeof value === "string"
      ? (() => {
          try {
            return JSON.parse(value) as unknown;
          } catch {
            return [];
          }
        })()
      : value;
  if (!Array.isArray(parsed)) return [];
  const allowed = new Set<string>(HELIX_ROOM_SOURCE_INGRESS_SCOPES);
  return Array.from(
    new Set(
      parsed.filter(
        (scope: unknown): scope is HelixRoomSourceIngressScope =>
          typeof scope === "string" && allowed.has(scope),
      ),
    ),
  );
};

const parseReceipt = (value: unknown): HelixRoomSourceIngressReceipt | null => {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as HelixRoomSourceIngressReceipt;
    } catch {
      return null;
    }
  }
  return value as HelixRoomSourceIngressReceipt;
};

const policyAllowsRoomSourceIngress = (
  value: unknown,
  options: { guestAccount: boolean; activeSession: boolean },
): boolean => {
  const policy =
    value && typeof value === "object"
      ? (value as {
          account_type?: unknown;
          feature_flags?: unknown;
          locked_features?: unknown;
        })
      : null;
  const featureAllowed = Boolean(
    Array.isArray(policy?.feature_flags) &&
      policy.feature_flags.includes("room_source_ingress") &&
      Array.isArray(policy?.locked_features) &&
      !policy.locked_features.includes("room_source_ingress"),
  );
  if (!featureAllowed) return false;
  if (policy?.account_type === "developer") return true;
  if (!options.activeSession) return false;
  return options.guestAccount
    ? isGuestSharedRealtimeRoomSourceIngressEnabled()
    : isPublicSharedRealtimeRoomSourceIngressEnabled();
};

const bindingOwnerPolicyAllowsIngress = async (
  db: Queryable,
  ownerProfileId: string,
): Promise<boolean> => {
  const { rows: accountRows } = await db.query<{
    account_type: string;
    provider: string | null;
  }>(
    `
      SELECT account_type, provider
      FROM helix_accounts
      WHERE profile_id = $1 AND deleted_at IS NULL
      LIMIT 1;
    `,
    [ownerProfileId],
  );

  const { rows: sessionRows } = await db.query<{ account_policy: unknown }>(
    `
      SELECT account_policy
      FROM helix_account_sessions
      WHERE profile_id = $1
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > now())
      ORDER BY updated_at DESC;
    `,
    [ownerProfileId],
  );
  const accountType = accountRows[0]?.account_type ?? "user";
  const provider = accountRows[0]?.provider ?? null;
  const guestAccount = provider === "guest";
  if (sessionRows.length === 0) {
    const effectivePolicy = resolveEffectiveAccountPolicyFromStoredRow({
      account_type: accountType,
      account_policy: HELIX_DEVELOPER_ACCOUNT_POLICY,
      provider,
    });
    return policyAllowsRoomSourceIngress(effectivePolicy, {
      guestAccount,
      activeSession: false,
    });
  }
  return sessionRows.some((row) => {
    const effectivePolicy = resolveEffectiveAccountPolicyFromStoredRow({
      account_type: accountType,
      account_policy: row.account_policy,
      provider,
    });
    return policyAllowsRoomSourceIngress(effectivePolicy, {
      guestAccount,
      activeSession: true,
    });
  });
};

const bindingUrl = (bindingId: string): string =>
  `${resolveCasimirPublicBaseUrl()}/api/room-ingress/v1/bindings/${encodeURIComponent(bindingId)}`;

const bindingStatus = (row: BindingRow): HelixRoomSourceBinding["status"] => {
  if (row.room_status === "closed") return "room_closed";
  if (row.status !== "active") return "revoked";
  if (
    row.credential_status !== "active" ||
    !row.expires_at ||
    Date.parse(iso(row.expires_at)) <= Date.now()
  ) {
    return "expired";
  }
  return "active";
};

const projectBinding = (row: BindingRow): HelixRoomSourceBinding => ({
  schema: HELIX_ROOM_SOURCE_BINDING_SCHEMA,
  binding_id: row.binding_id,
  room_id: row.room_id,
  owner_profile_id: row.owner_profile_id,
  source_id: row.source_id,
  world_id: row.world_id,
  domain_adapter: row.domain_adapter,
  source_label: row.source_label,
  scopes: parseScopes(row.scopes),
  status: bindingStatus(row),
  public_ingress_base_url: bindingUrl(row.binding_id),
  credential_id: row.credential_id,
  token_prefix: row.token_prefix,
  created_at: iso(row.created_at),
  updated_at: iso(row.updated_at),
  expires_at: isoOrNull(row.expires_at),
  revoked_at: isoOrNull(row.revoked_at),
  last_used_at: isoOrNull(row.last_used_at),
  request_count: Number(row.request_count) || 0,
  execution_policy: {
    may_execute_live_actions: false,
    may_perform_read_only_probes: true,
  },
  content_role: "source_binding_not_assistant_answer",
  reentry_required: true,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const bindingProjectionQuery = `
  SELECT
    b.*,
    r.status AS room_status,
    c.credential_id,
    c.token_prefix,
    c.status AS credential_status,
    c.expires_at,
    q.last_used_at,
    COALESCE(q.request_count, 0) AS request_count
  FROM helix_room_source_bindings b
  JOIN helix_shared_realtime_rooms r ON r.room_id = b.room_id
  LEFT JOIN helix_room_source_credentials c
    ON c.binding_id = b.binding_id AND c.status = 'active'
  LEFT JOIN (
    SELECT
      binding_id,
      MAX(received_at) AS last_used_at,
      COUNT(*) AS request_count
    FROM helix_room_source_ingress_requests
    GROUP BY binding_id
  ) q ON q.binding_id = b.binding_id
`;

const readBindingProjection = async (
  db: Queryable,
  bindingId: string,
): Promise<BindingRow | null> => {
  const { rows } = await db.query<BindingRow>(
    `${bindingProjectionQuery} WHERE b.binding_id = $1 LIMIT 1;`,
    [bindingId],
  );
  return rows[0] ?? null;
};

const assertRoomOwner = async (
  db: Queryable,
  roomId: string,
  ownerProfileId: string,
  forUpdate = false,
): Promise<void> => {
  const { rows } = await db.query<{ owner_profile_id: string; status: string }>(
    `
      SELECT owner_profile_id, status
      FROM helix_shared_realtime_rooms
      WHERE room_id = $1
      ${forUpdate ? "FOR UPDATE" : ""};
    `,
    [roomId],
  );
  const room = rows[0];
  if (!room) {
    throw new RoomSourceIngressError(
      "room_source_binding_not_found",
      404,
      "Shared Realtime room not found.",
    );
  }
  if (room.owner_profile_id !== ownerProfileId) {
    throw new RoomSourceIngressError(
      "room_source_binding_forbidden",
      403,
      "Only the room owner can manage environment source links.",
    );
  }
  if (room.status === "closed") {
    throw new RoomSourceIngressError(
      "room_source_binding_closed",
      410,
      "The room is closed.",
    );
  }
};

const credentialTtlMs = (requested?: number | null): number => {
  if (!requested || !Number.isFinite(requested) || requested <= 0) {
    return DEFAULT_CREDENTIAL_TTL_MS;
  }
  return Math.min(Math.floor(requested), MAX_CREDENTIAL_TTL_MS);
};

const createCredential = async (
  db: Queryable,
  bindingId: string,
  requestedTtlMs?: number | null,
  suppliedSecret?: string | null,
): Promise<{ credentialId: string; secret: string; expiresAt: string }> => {
  const credentialId = `room_source_credential:${crypto.randomUUID()}`;
  const candidate = normalize(suppliedSecret);
  if (
    candidate &&
    !/^helix_room_src_[a-zA-Z0-9_-]{43,96}$/.test(candidate)
  ) {
    throw new RoomSourceIngressError(
      "room_source_credential_invalid",
      400,
      "The trusted source credential material is invalid.",
    );
  }
  const secret =
    candidate ||
    `helix_room_src_${crypto.randomBytes(32).toString("base64url")}`;
  const expiresAt = new Date(
    Date.now() + credentialTtlMs(requestedTtlMs),
  ).toISOString();
  await db.query(
    `
      INSERT INTO helix_room_source_credentials (
        credential_id, binding_id, token_hash, token_prefix, status, expires_at
      ) VALUES ($1, $2, $3, $4, 'active', $5);
    `,
    [
      credentialId,
      bindingId,
      sha256Hex(secret),
      secret.slice(0, 18),
      expiresAt,
    ],
  );
  return { credentialId, secret, expiresAt };
};

export const createSharedRealtimeRoomSourceBindingWithoutCredential =
  async (input: {
    roomId: string;
    ownerProfileId: string;
    worldId?: string | null;
    domainAdapter?: string | null;
    sourceLabel?: string | null;
    ttlMs?: number | null;
  }): Promise<HelixRoomSourceBinding> =>
    withSharedRealtimeRoomTransaction(async (db: Queryable) => {
      await assertRoomOwner(db, input.roomId, input.ownerProfileId, true);
      const bindingId = `room_source_binding:${crypto.randomUUID()}`;
      const suffix = crypto.randomUUID().slice(0, 12);
      const sourceId = `source:room-ingress:${crypto.randomUUID()}`;
      const worldId = normalize(input.worldId) || `minecraft:minehut:${suffix}`;
      const domainAdapter =
        normalize(input.domainAdapter) || "minecraft.paper_plugin.v1";
      let adapterRecord;
      try {
        adapterRecord = resolveEnvironmentAdapterProfile({
          domainAdapter,
          worldId,
        });
      } catch (error) {
        if (isEnvironmentAdapterRegistryError(error)) {
          throw new RoomSourceIngressError(
            error.code,
            error.code === "environment_adapter_disabled" ? 409 : 400,
            error.message,
          );
        }
        throw error;
      }
      const sourceLabel =
        normalize(input.sourceLabel) ||
        `${adapterRecord.profile.source_family} environment source`;
      await db.query(
        `
        INSERT INTO helix_room_source_bindings (
          binding_id,
          room_id,
          owner_profile_id,
          source_id,
          world_id,
          domain_adapter,
          source_label,
          scopes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb);
      `,
        [
          bindingId,
          input.roomId,
          input.ownerProfileId,
          sourceId,
          worldId,
          domainAdapter,
          sourceLabel,
          JSON.stringify(HELIX_ROOM_SOURCE_INGRESS_SCOPES),
        ],
      );
      const row = await readBindingProjection(db, bindingId);
      if (!row) {
        throw new RoomSourceIngressError(
          "room_source_binding_invalid",
          503,
          "The deferred source binding could not be projected.",
        );
      }
      return projectBinding(row);
    });

export const persistSharedRealtimeRoomSourceCredentialForTrustedClaim = async (
  input: {
    bindingId: string;
    roomId: string;
    sourceId: string;
    ownerProfileId: string;
    purpose: "create" | "rotate";
    credentialTtlMs: number;
    /**
     * Optional deterministic high-entropy secret for an authenticated,
     * idempotent connector-pairing exchange. This remains server-internal and
     * is never accepted by a browser or public source-binding route.
     */
    trustedCredentialSecret?: string | null;
  },
  db: Queryable,
): Promise<{
  binding: HelixRoomSourceBinding;
  tokenValue: string;
}> => {
  await assertRoomOwner(db, input.roomId, input.ownerProfileId, true);
  const existingResult = await db.query<{
    binding_id: string;
    room_id: string;
    owner_profile_id: string;
    source_id: string;
    status: string;
  }>(
    `
        SELECT binding_id, room_id, owner_profile_id, source_id, status
        FROM helix_room_source_bindings
        WHERE binding_id = $1
        LIMIT 1
        FOR UPDATE;
      `,
    [input.bindingId],
  );
  const existing = existingResult.rows[0];
  if (
    !existing ||
    existing.room_id !== input.roomId ||
    existing.owner_profile_id !== input.ownerProfileId ||
    existing.source_id !== input.sourceId
  ) {
    throw new RoomSourceIngressError(
      "room_source_binding_not_found",
      404,
      "Room source binding not found.",
    );
  }
  if (existing.status !== "active") {
    throw new RoomSourceIngressError(
      "room_source_binding_revoked",
      410,
      "Room source binding is not active.",
    );
  }
  if (input.purpose === "rotate") {
    await db.query(
      `
          UPDATE helix_environment_adapter_admissions
          SET status = 'revoked', revoked_at = now(), updated_at = now()
          WHERE binding_id = $1 AND status = 'active';
        `,
      [input.bindingId],
    );
    await db.query(
      `
          UPDATE helix_room_source_credentials
          SET status = 'revoked', revoked_at = now()
          WHERE binding_id = $1 AND status = 'active';
        `,
      [input.bindingId],
    );
  }
  const credential = await createCredential(
    db,
    input.bindingId,
    input.credentialTtlMs,
    input.trustedCredentialSecret,
  );
  await db.query(
    `
        UPDATE helix_room_source_bindings
        SET updated_at = now()
        WHERE binding_id = $1;
      `,
    [input.bindingId],
  );
  const row = await readBindingProjection(db, input.bindingId);
  if (!row) {
    throw new RoomSourceIngressError(
      "room_source_binding_invalid",
      503,
      "The claimed source credential could not be projected.",
    );
  }
  return {
    binding: projectBinding(row),
    tokenValue: credential.secret,
  };
};

export const listSharedRealtimeRoomSourceBindings = async (input: {
  roomId: string;
  ownerProfileId: string;
}): Promise<HelixRoomSourceBinding[]> => {
  const db = await readSharedRealtimeRoomDatabase();
  await assertRoomOwner(db, input.roomId, input.ownerProfileId);
  const { rows } = await db.query<BindingRow>(
    `${bindingProjectionQuery} WHERE b.room_id = $1 ORDER BY b.created_at DESC;`,
    [input.roomId],
  );
  return rows.map(projectBinding).map((binding: HelixRoomSourceBinding) => {
    if (binding.status === "active") {
      scheduleBindingRuntimeExpiry(binding);
    } else {
      invalidateBindingRuntimeState({
        bindingId: binding.binding_id,
        sourceId: binding.source_id,
        roomId: binding.room_id,
      });
    }
    return binding;
  });
};

export const revokeSharedRealtimeRoomSourceBinding = async (input: {
  roomId: string;
  bindingId: string;
  ownerProfileId: string;
}): Promise<HelixRoomSourceBinding> => {
  const revoked = await withSharedRealtimeRoomTransaction(
    async (db: Queryable) => {
      await assertRoomOwner(db, input.roomId, input.ownerProfileId, true);
      const { rows } = await db.query<{ room_id: string }>(
        `SELECT room_id FROM helix_room_source_bindings WHERE binding_id = $1 FOR UPDATE;`,
        [input.bindingId],
      );
      if (!rows[0] || rows[0].room_id !== input.roomId) {
        throw new RoomSourceIngressError(
          "room_source_binding_not_found",
          404,
          "Room source binding not found.",
        );
      }
      await db.query(
        `
        UPDATE helix_room_source_bindings
        SET status = 'revoked', revoked_at = now(), updated_at = now()
        WHERE binding_id = $1;
      `,
        [input.bindingId],
      );
      await db.query(
        `
        UPDATE helix_room_source_credentials
        SET status = 'revoked', revoked_at = now()
        WHERE binding_id = $1 AND status = 'active';
      `,
        [input.bindingId],
      );
      await db.query(
        `
        UPDATE helix_environment_adapter_admissions
        SET status = 'revoked', revoked_at = now(), updated_at = now()
        WHERE binding_id = $1 AND status = 'active';
      `,
        [input.bindingId],
      );
      const row = await readBindingProjection(db, input.bindingId);
      if (!row) {
        throw new RoomSourceIngressError(
          "room_source_binding_invalid",
          503,
          "The revoked source binding could not be projected.",
        );
      }
      return projectBinding(row);
    },
  );
  invalidateBindingRuntimeState({
    bindingId: revoked.binding_id,
    sourceId: revoked.source_id,
    roomId: revoked.room_id,
  });
  return revoked;
};

export const revokeSharedRealtimeRoomSourceBindingByCredential = async (input: {
  bindingId: string;
  bearerToken: string;
}): Promise<HelixRoomSourceBinding> => {
  const bearerToken = normalize(input.bearerToken);
  if (
    !/^helix_room_src_[a-zA-Z0-9_-]{43,96}$/.test(bearerToken) ||
    !normalize(input.bindingId)
  ) {
    throw new RoomSourceIngressError(
      "room_source_credential_invalid",
      401,
      "The source credential is invalid.",
    );
  }
  const revoked = await withSharedRealtimeRoomTransaction(
    async (db: Queryable) => {
      const { rows } = await db.query<{
        credential_id: string;
        status: string;
        expires_at: Date | string;
      }>(
        `
          SELECT c.credential_id, c.status, c.expires_at
          FROM helix_room_source_credentials c
          JOIN helix_room_source_bindings b ON b.binding_id = c.binding_id
          WHERE c.binding_id = $1 AND c.token_hash = $2
          LIMIT 1
          FOR UPDATE;
        `,
        [input.bindingId, sha256Hex(bearerToken)],
      );
      const credential = rows[0];
      if (!credential) {
        throw new RoomSourceIngressError(
          "room_source_credential_invalid",
          401,
          "The source credential is invalid.",
        );
      }
      if (
        credential.status !== "active" ||
        Date.parse(iso(credential.expires_at)) <= Date.now()
      ) {
        throw new RoomSourceIngressError(
          "room_source_credential_expired",
          410,
          "The source credential is no longer active.",
        );
      }
      await db.query(
        `
          UPDATE helix_room_source_bindings
          SET status = 'revoked', revoked_at = now(), updated_at = now()
          WHERE binding_id = $1 AND status = 'active';
        `,
        [input.bindingId],
      );
      await db.query(
        `
          UPDATE helix_room_source_credentials
          SET status = 'revoked', revoked_at = now()
          WHERE binding_id = $1 AND status = 'active';
        `,
        [input.bindingId],
      );
      await db.query(
        `
          UPDATE helix_environment_adapter_admissions
          SET status = 'revoked', revoked_at = now(), updated_at = now()
          WHERE binding_id = $1 AND status = 'active';
        `,
        [input.bindingId],
      );
      await db.query(
        `
          UPDATE helix_connector_pairing_codes
          SET status = 'revoked', revoked_at = now(), updated_at = now()
          WHERE binding_id = $1 AND status = 'pending';
        `,
        [input.bindingId],
      );
      const row = await readBindingProjection(db, input.bindingId);
      if (!row) {
        throw new RoomSourceIngressError(
          "room_source_binding_not_found",
          404,
          "Room source binding not found.",
        );
      }
      return projectBinding(row);
    },
  );
  invalidateBindingRuntimeState({
    bindingId: revoked.binding_id,
    sourceId: revoked.source_id,
    roomId: revoked.room_id,
  });
  return revoked;
};

const readBearer = (authorization: string | null | undefined): string => {
  const match = /^Bearer\s+(.+)$/i.exec(normalize(authorization));
  return match?.[1]?.trim() ?? "";
};

const assertOpaqueHeader = (
  value: string | null | undefined,
  name: string,
): string => {
  const normalized = normalize(value);
  if (!/^[a-zA-Z0-9:_-]{8,128}$/.test(normalized)) {
    throw new RoomSourceIngressError(
      "room_source_request_headers_invalid",
      400,
      `${name} is missing or invalid.`,
    );
  }
  return normalized;
};

const assertDigest = (
  provided: string | null | undefined,
  computed: string,
): string => {
  const normalized = normalize(provided);
  if (
    !/^sha-256=[a-zA-Z0-9+/]+={0,2}$/.test(normalized) ||
    normalized !== computed
  ) {
    throw new RoomSourceIngressError(
      "room_source_digest_mismatch",
      400,
      "The request body digest does not match the received body.",
    );
  }
  return normalized;
};

const readSequence = (value: string | null | undefined): number => {
  const normalized = normalize(value);
  const parsed = Number(normalized);
  if (
    !/^\d+$/.test(normalized) ||
    !Number.isSafeInteger(parsed) ||
    parsed < 1
  ) {
    throw new RoomSourceIngressError(
      "room_source_request_headers_invalid",
      400,
      "X-Helix-Sequence must be a positive integer.",
    );
  }
  return parsed;
};

const readSentAt = (value: string | null | undefined): string => {
  const normalized = normalize(value);
  const timestamp = Date.parse(normalized);
  if (!normalized || !Number.isFinite(timestamp)) {
    throw new RoomSourceIngressError(
      "room_source_request_headers_invalid",
      400,
      "X-Helix-Sent-At must be a UTC timestamp.",
    );
  }
  if (Math.abs(Date.now() - timestamp) > requestFreshnessMs()) {
    throw new RoomSourceIngressError(
      "room_source_request_stale",
      408,
      "The ingress request is outside the accepted freshness window.",
    );
  }
  return new Date(timestamp).toISOString();
};

export type RoomSourceIngressRequestClaim = {
  binding: HelixRoomSourceBinding;
  credentialId: string;
  /**
   * Binding-scoped projection safe for receipts, evidence, debug, and model
   * re-entry. The caller's durable idempotency key never leaves this store.
   */
  requestProjectionId: string;
  producerEpoch: string;
  sequence: number;
  routeKey: string;
  bodyDigest: string;
  /** Empty queue polls authenticate fully but do not create receipt rows. */
  durableReceipt?: boolean;
  replay: {
    statusCode: number;
    receipt: HelixRoomSourceIngressReceipt;
  } | null;
};

export const claimRoomSourceIngressRequest = async (input: {
  bindingId: string;
  requiredScope: HelixRoomSourceIngressScope;
  routeKey: string;
  authorization?: string | null;
  ingressVersion?: string | null;
  requestId?: string | null;
  producerEpoch?: string | null;
  sequence?: string | null;
  sentAt?: string | null;
  digest?: string | null;
  computedBodyDigest: string;
  payloadForSecretScan?: unknown;
  durableReceipt?: boolean;
}): Promise<RoomSourceIngressRequestClaim> => {
  if (normalize(input.ingressVersion) !== "1") {
    throw new RoomSourceIngressError(
      "room_source_request_headers_invalid",
      400,
      "X-Helix-Ingress-Version must be 1.",
    );
  }
  const requestId = assertOpaqueHeader(input.requestId, "X-Helix-Request-Id");
  const producerEpoch = assertOpaqueHeader(
    input.producerEpoch,
    "X-Helix-Producer-Epoch",
  );
  const sequence = readSequence(input.sequence);
  const sentAt = readSentAt(input.sentAt);
  const bodyDigest = assertDigest(input.digest, input.computedBodyDigest);
  const secret = readBearer(input.authorization);
  if (!secret) {
    throw new RoomSourceIngressError(
      "room_source_credential_invalid",
      401,
      "A valid room source credential is required.",
    );
  }

  let committedRejection: {
    code: "room_source_credential_expired" | "room_source_owner_policy_revoked";
    statusCode: number;
    message: string;
  } | null = null;
  let runtimeInvalidation: {
    bindingId: string;
    sourceId: string;
    roomId: string;
  } | null = null;
  const markRuntimeInvalidation = (binding: BindingRow): void => {
    runtimeInvalidation = {
      bindingId: binding.binding_id,
      sourceId: binding.source_id,
      roomId: binding.room_id,
    };
  };
  const applyRuntimeInvalidation = (): void => {
    if (runtimeInvalidation) {
      invalidateBindingRuntimeState(runtimeInvalidation);
      runtimeInvalidation = null;
    }
  };
  let outcome: RoomSourceIngressRequestClaim | null;
  const durableReceipt = input.durableReceipt !== false;
  try {
    outcome = await withBindingClaimLock(input.bindingId, () =>
      {
        const runClaim = async (
          db: Queryable,
        ): Promise<RoomSourceIngressRequestClaim | null> => {
          const { rows: lockRows } = await db.query<{ binding_id: string }>(
            `
            SELECT binding_id
            FROM helix_room_source_bindings
            WHERE binding_id = $1
            ${durableReceipt ? "FOR UPDATE" : ""};
          `,
            [input.bindingId],
          );
          if (!lockRows[0]) {
            throw new RoomSourceIngressError(
              "room_source_credential_invalid",
              401,
              "A valid room source credential is required.",
            );
          }
          const bindingRow = await readBindingProjection(db, input.bindingId);
          if (!bindingRow) {
            throw new RoomSourceIngressError(
              "room_source_credential_invalid",
              401,
              "A valid room source credential is required.",
            );
          }
          let adapterRecord;
          try {
            adapterRecord = resolveEnvironmentAdapterProfile({
              domainAdapter: bindingRow.domain_adapter,
              worldId: bindingRow.world_id,
            });
          } catch (error) {
            if (isEnvironmentAdapterRegistryError(error)) {
              throw new RoomSourceIngressError(
                error.code,
                error.code === "environment_adapter_disabled" ? 409 : 400,
                error.message,
              );
            }
            throw error;
          }
          if (
            Math.abs(Date.now() - Date.parse(sentAt)) >
            adapterRecord.profile.freshness.ingress_request_max_age_ms
          ) {
            throw new RoomSourceIngressError(
              "room_source_request_stale",
              408,
              "The ingress request is outside the active environment adapter freshness window.",
            );
          }
          if (bindingRow.room_status === "closed") {
            markRuntimeInvalidation(bindingRow);
            throw new RoomSourceIngressError(
              "room_source_binding_closed",
              410,
              "The room attached to this source binding is closed.",
            );
          }
          if (bindingRow.status !== "active") {
            markRuntimeInvalidation(bindingRow);
            throw new RoomSourceIngressError(
              "room_source_binding_revoked",
              410,
              "The room source binding is revoked.",
            );
          }
          if (!bindingRow.source_id.startsWith("source:room-ingress:")) {
            throw new RoomSourceIngressError(
              "room_source_binding_invalid",
              409,
              "This legacy source binding does not use the isolated room-ingress namespace. Revoke it and generate a new link.",
            );
          }
          if (
            !(await bindingOwnerPolicyAllowsIngress(
              db,
              bindingRow.owner_profile_id,
            ))
          ) {
            await db.query(
              `
              UPDATE helix_room_source_bindings
              SET status = 'revoked', revoked_at = now(), updated_at = now()
              WHERE binding_id = $1 AND status = 'active';
            `,
              [input.bindingId],
            );
            await db.query(
              `
              UPDATE helix_room_source_credentials
              SET status = 'revoked', revoked_at = now()
              WHERE binding_id = $1 AND status = 'active';
            `,
              [input.bindingId],
            );
            await db.query(
              `
              UPDATE helix_environment_adapter_admissions
              SET status = 'revoked', revoked_at = now(), updated_at = now()
              WHERE binding_id = $1 AND status = 'active';
            `,
              [input.bindingId],
            );
            markRuntimeInvalidation(bindingRow);
            committedRejection = {
              code: "room_source_owner_policy_revoked",
              statusCode: 403,
              message:
                "The room owner no longer has eligible room-source ingress access. The binding was revoked.",
            };
            return null;
          }
          const { rows: credentialRows } = await db.query<CredentialRow>(
            `
        SELECT *
        FROM helix_room_source_credentials
        WHERE binding_id = $1 AND token_hash = $2
        LIMIT 1;
      `,
            [input.bindingId, sha256Hex(secret)],
          );
          const credential = credentialRows[0];
          if (!credential || credential.status !== "active") {
            throw new RoomSourceIngressError(
              "room_source_credential_invalid",
              401,
              "A valid room source credential is required.",
            );
          }
          if (Date.parse(iso(credential.expires_at)) <= Date.now()) {
            await db.query(
              `
          UPDATE helix_room_source_credentials
          SET status = 'expired'
          WHERE credential_id = $1 AND status = 'active';
        `,
              [credential.credential_id],
            );
            await db.query(
              `
          UPDATE helix_environment_adapter_admissions
          SET status = 'expired', updated_at = now()
          WHERE credential_id = $1 AND status = 'active';
        `,
              [credential.credential_id],
            );
            markRuntimeInvalidation(bindingRow);
            committedRejection = {
              code: "room_source_credential_expired",
              statusCode: 401,
              message: "The room source credential expired.",
            };
            return null;
          }
          if (
            containsProtectedRoomSourceSecret(
              {
                request_id: requestId,
                producer_epoch: producerEpoch,
                payload: input.payloadForSecretScan,
              },
              { exactSecrets: [secret] },
            )
          ) {
            throw new RoomSourceIngressError(
              "room_source_secret_exposure_rejected",
              400,
              "Ingress content contains protected credential material and was rejected before persistence.",
            );
          }
          const requestProjectionId = projectRoomSourceRequestId({
            bindingId: input.bindingId,
            requestId,
          });
          const binding = projectBinding({
            ...bindingRow,
            credential_id: credential.credential_id,
            token_prefix: credential.token_prefix,
            credential_status: credential.status,
            expires_at: credential.expires_at,
          });
          if (!binding.scopes.includes(input.requiredScope)) {
            throw new RoomSourceIngressError(
              "room_source_scope_denied",
              403,
              "The source credential does not allow this ingress operation.",
            );
          }

          if (!durableReceipt) {
            return {
              binding,
              credentialId: credential.credential_id,
              requestProjectionId,
              producerEpoch,
              sequence,
              routeKey: input.routeKey,
              bodyDigest,
              durableReceipt: false,
              replay: null,
            };
          }

          const { rows: existingRows } = await db.query<RequestRow>(
            `
        SELECT *
        FROM helix_room_source_ingress_requests
        WHERE binding_id = $1 AND request_id = $2
        LIMIT 1;
      `,
            [input.bindingId, requestId],
          );
          const existing = existingRows[0];
          if (existing) {
            const same =
              existing.credential_id === credential.credential_id &&
              existing.producer_epoch === producerEpoch &&
              Number(existing.sequence_number) === sequence &&
              existing.route_key === input.routeKey &&
              existing.body_digest === bodyDigest;
            if (!same) {
              throw new RoomSourceIngressError(
                "room_source_idempotency_conflict",
                409,
                "The request ID was already used for different ingress content.",
              );
            }
            const receipt = parseReceipt(existing.response_receipt);
            if (!receipt || existing.response_status === null) {
              const receivedAt = Date.parse(iso(existing.received_at));
              const processingLeaseActive =
                existing.response_status === null &&
                Number.isFinite(receivedAt) &&
                Date.now() - receivedAt < requestProcessingLeaseMs();
              if (!processingLeaseActive) {
                throw new RoomSourceIngressError(
                  "room_source_request_outcome_unknown",
                  409,
                  "The prior ingress outcome cannot be proven. Do not assume it failed; send a fresh current-state observation with a new request ID and sequence.",
                );
              }
              throw new RoomSourceIngressError(
                "room_source_request_in_progress",
                409,
                "The matching ingress request is still being processed.",
              );
            }
            return {
              binding,
              credentialId: credential.credential_id,
              requestProjectionId,
              producerEpoch,
              sequence,
              routeKey: input.routeKey,
              bodyDigest,
              replay: {
                statusCode: Number(existing.response_status),
                receipt: redactProtectedRoomSourceSecrets(
                  replaceRoomSourceRequestIdInProjection(
                    redactProtectedRoomSourceSecrets(
                      { ...receipt, replayed: true },
                      { exactSecrets: [secret] },
                    ),
                    {
                      requestId,
                      requestProjectionId,
                    },
                  ),
                  { exactSecrets: [secret] },
                ),
              },
            };
          }

          const { rows: sequenceRows } = await db.query<RequestRow>(
            `
        SELECT *
        FROM helix_room_source_ingress_requests
        WHERE binding_id = $1 AND producer_epoch = $2 AND sequence_number = $3
        LIMIT 1;
      `,
            [input.bindingId, producerEpoch, sequence],
          );
          if (sequenceRows[0]) {
            throw new RoomSourceIngressError(
              "room_source_idempotency_conflict",
              409,
              "The producer sequence was already used by another ingress request.",
            );
          }
          const { rows: maxRows } = await db.query<{
            max_sequence: number | string | null;
          }>(
            `
        SELECT MAX(sequence_number) AS max_sequence
        FROM helix_room_source_ingress_requests
        WHERE binding_id = $1 AND producer_epoch = $2 AND route_key = $3;
      `,
            [input.bindingId, producerEpoch, input.routeKey],
          );
          const maxSequence = Number(maxRows[0]?.max_sequence ?? 0);
          if (maxSequence >= sequence) {
            throw new RoomSourceIngressError(
              "room_source_sequence_out_of_order",
              409,
              "The producer sequence is older than an already accepted request in this route lane.",
            );
          }
          const rateWindowStart = new Date(Date.now() - 60_000).toISOString();
          const { rows: rateRows } = await db.query<{
            request_count: number | string;
          }>(
            `
        SELECT COUNT(*) AS request_count
        FROM helix_room_source_ingress_requests
        WHERE binding_id = $1 AND received_at >= $2;
      `,
            [input.bindingId, rateWindowStart],
          );
          if (Number(rateRows[0]?.request_count ?? 0) >= requestRateLimit()) {
            throw new RoomSourceIngressError(
              "room_source_rate_limited",
              429,
              "The room source ingress rate limit was reached.",
            );
          }
          await db.query(
            `
        INSERT INTO helix_room_source_ingress_requests (
          binding_id,
          credential_id,
          request_id,
          producer_epoch,
          sequence_number,
          route_key,
          body_digest,
          sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `,
            [
              input.bindingId,
              credential.credential_id,
              requestId,
              producerEpoch,
              sequence,
              input.routeKey,
              bodyDigest,
              sentAt,
            ],
          );
          await db.query(
            `
        DELETE FROM helix_room_source_ingress_requests
        WHERE received_at < $1;
      `,
            [new Date(Date.now() - REQUEST_RETENTION_MS).toISOString()],
          );
          await db.query(
            `UPDATE helix_room_source_bindings SET updated_at = now() WHERE binding_id = $1;`,
            [input.bindingId],
          );
          return {
            binding,
            credentialId: credential.credential_id,
            requestProjectionId,
            producerEpoch,
            sequence,
            routeKey: input.routeKey,
            bodyDigest,
            replay: null,
          };
        };
        if (durableReceipt) {
          return withSharedRealtimeRoomTransaction(runClaim);
        }
        return readSharedRealtimeRoomDatabase().then(runClaim);
      },
    );
  } catch (error) {
    applyRuntimeInvalidation();
    throw error;
  }
  if (!outcome) {
    applyRuntimeInvalidation();
    const rejection = committedRejection as {
      code:
        "room_source_credential_expired" | "room_source_owner_policy_revoked";
      statusCode: number;
      message: string;
    } | null;
    if (rejection) {
      throw new RoomSourceIngressError(
        rejection.code,
        rejection.statusCode,
        rejection.message,
      );
    }
    throw new RoomSourceIngressError(
      "room_source_credential_expired",
      401,
      "The room source credential expired.",
    );
  }
  scheduleBindingRuntimeExpiry(outcome.binding);
  return outcome;
};

export const completeRoomSourceIngressRequest = async (input: {
  claim: RoomSourceIngressRequestClaim;
  statusCode: number;
  receipt: HelixRoomSourceIngressReceipt;
}): Promise<void> => {
  if (input.claim.replay || input.claim.durableReceipt === false) return;
  const db = await readSharedRealtimeRoomDatabase();
  const { rows } = await db.query<{ request_id: string }>(
    `
      UPDATE helix_room_source_ingress_requests
      SET response_status = $7, response_receipt = $8::jsonb
      WHERE binding_id = $1
        AND credential_id = $2
        AND producer_epoch = $3
        AND sequence_number = $4
        AND route_key = $5
        AND body_digest = $6
      RETURNING request_id;
    `,
    [
      input.claim.binding.binding_id,
      input.claim.credentialId,
      input.claim.producerEpoch,
      input.claim.sequence,
      input.claim.routeKey,
      input.claim.bodyDigest,
      input.statusCode,
      JSON.stringify(redactProtectedRoomSourceSecrets(input.receipt)),
    ],
  );
  if (!rows[0]) {
    throw new RoomSourceIngressError(
      "room_source_request_outcome_unknown",
      503,
      "The durable ingress receipt could not be confirmed.",
    );
  }
};

export const resetRoomSourceIngressStoreForTest = async (): Promise<void> => {
  bindingClaimTails.clear();
  for (const timer of bindingExpiryTimers.values()) clearTimeout(timer);
  bindingExpiryTimers.clear();
  const db = await readSharedRealtimeRoomDatabase();
  await db.query("DELETE FROM helix_room_source_ingress_requests;");
  await db.query("DELETE FROM helix_room_source_credentials;");
  await db.query("DELETE FROM helix_room_source_bindings;");
};
