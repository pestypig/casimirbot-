import crypto from "node:crypto";
import {
  HELIX_ENVIRONMENT_COMMAND_OBSERVATION_SCHEMA,
  HELIX_ENVIRONMENT_COMMAND_REQUEST_SCHEMA,
  helixEnvironmentCommandCatalogPageSchema,
  helixMinecraftCommandCatalogNodeSchema,
  helixEnvironmentCommandResultSchema,
  type HelixEnvironmentCommandCategory,
  type HelixEnvironmentCommandEffectClass,
  type HelixEnvironmentCommandObservation,
  type HelixEnvironmentCommandRequest,
  type HelixEnvironmentCommandResult,
  type HelixEnvironmentCommandConnectorConfig,
  type HelixMinecraftCommandCatalogNode,
} from "@shared/helix-environment-command";
import {
  readSharedRealtimeRoomDatabase,
  withSharedRealtimeRoomTransaction,
} from "../../helix-ask/realtime-room/room-store/database";
import {
  readSharedRealtimeRoomMembership,
} from "../../helix-ask/realtime-room/room-store";
import {
  projectEnvironmentAdapterProducerEpoch,
} from "../../situation-room/environment-adapter-admission-store";
import {
  isRoomEnvironmentSubjectError,
  resolveRoomEnvironmentSubjectForProbe,
} from "../subjects";
import type { Queryable } from "../../helix-ask/realtime-room/room-store/types";
import {
  evaluateEnvironmentCommandPreflightAdmission,
} from "./authority-policy";
import { readEnvironmentCommandAuthority } from "./authority-store";
import { commandRequiresSelectedSubjectSource } from "./command-subject-policy";
import { createCredentialUseTouchThrottle } from "../credential-use-throttle";

const DEFAULT_COMMAND_CREDENTIAL_TTL_MS = 24 * 60 * 60 * 1_000;
const MAX_COMMAND_CREDENTIAL_TTL_MS = 7 * 24 * 60 * 60 * 1_000;
const DEFAULT_COMMAND_DEADLINE_MS = 15_000;
const MAX_COMMAND_DEADLINE_MS = 5 * 60_000;
const DEFAULT_LEASE_MS = 10_000;
const WAIT_POLL_MS = 40;
const touchCommandCredentialUse = createCredentialUseTouchThrottle();

export type EnvironmentCommandBrokerErrorCode =
  | "command_authority_not_found"
  | "command_authority_inactive"
  | "command_credential_invalid"
  | "command_credential_expired"
  | "command_scope_denied"
  | "command_catalog_required"
  | "command_catalog_invalid"
  | "command_request_invalid"
  | "command_request_not_found"
  | "command_request_not_leased"
  | "command_request_expired"
  | "command_request_conflict"
  | "command_policy_denied"
  | "command_result_invalid"
  | "command_result_conflict";

export class EnvironmentCommandBrokerError extends Error {
  constructor(
    public readonly code: EnvironmentCommandBrokerErrorCode,
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "EnvironmentCommandBrokerError";
  }
}

export const isEnvironmentCommandBrokerError = (
  error: unknown,
): error is EnvironmentCommandBrokerError =>
  error instanceof EnvironmentCommandBrokerError;

type AuthorityConnectorRow = {
  command_authority_id: string;
  environment_binding_id: string;
  room_source_binding_id: string;
  room_id: string;
  source_id: string;
  world_id: string;
  adapter_profile_id: string;
  authority_profile: string;
  autonomy_mode: string;
  approved_categories: unknown;
  policy_version: number | string;
  authority_status: string;
  authority_expires_at: Date | string | null;
  domain_adapter: string;
  environment_status: string;
  room_status: string;
  source_status: string;
  credential_id: string | null;
  token_hash: string | null;
  scopes: unknown;
  credential_status: string | null;
  credential_expires_at: Date | string | null;
};

type CatalogRow = {
  command_catalog_id: string;
  command_authority_id: string;
  environment_binding_id: string;
  source_id: string;
  world_id: string;
  adapter_profile_id: string;
  domain_adapter: string;
  game_version: string;
  producer_epoch_ref: string;
  command_tree_hash: string;
  root_command_count: number | string;
  catalog_summary: unknown;
  frozen_at: Date | string;
  expires_at: Date | string | null;
};

type RequestRow = {
  command_request_id: string;
  command_authority_id: string;
  command_grant_id: string;
  command_catalog_id: string;
  environment_binding_id: string;
  room_id: string;
  source_id: string;
  world_id: string;
  participant_id: string;
  subject_binding_id: string | null;
  subject_native_id: string | null;
  run_id: string;
  turn_id: string;
  provider_execution_id: string;
  tool_call_id: string;
  authority_profile: string;
  autonomy_mode: string;
  approved_categories: unknown;
  policy_version: number | string;
  command_text: string;
  command_hash: string;
  command_root_hint: string;
  requested_category: string;
  expected_effect: string;
  idempotency_key: string;
  confirmation_state: string;
  approval_ref: string | null;
  status: string;
  attempt_count: number | string;
  deadline_at: Date | string;
  created_at: Date | string;
  leased_at: Date | string | null;
  lease_expires_at: Date | string | null;
  completed_at: Date | string | null;
};

type ResultRow = {
  command_result_id: string;
  command_request_id: string;
  command_execution_id: string;
  command_hash: string;
  command_root: string;
  parsed_category: string;
  effect_class: string;
  outcome: string;
  result_code: number | string;
  result_payload: unknown;
  result_hash: string;
  side_effects_performed: boolean;
  environment_mutation_performed: boolean;
  server_administration_performed: boolean;
  provenance_valid: boolean;
  eligible_for_current_turn_reentry: boolean;
  received_at: Date | string;
};

const iso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();
const isoOrNull = (value: Date | string | null): string | null =>
  value === null ? null : iso(value);
const sha256 = (value: string): string =>
  `sha256:${crypto.createHash("sha256").update(value, "utf8").digest("hex")}`;
const parseJson = <T>(value: unknown, fallback: T): T => {
  if (typeof value !== "string") return (value as T) ?? fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};
const normalizedCommand = (value: string): string =>
  value.trim().replace(/^\/+/, "").trim();
const commandRoot = (command: string): string =>
  command.split(/\s+/u)[0]?.toLowerCase() || "unknown";
const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stableValue(entry)]),
  );
};
const resultHash = (value: unknown): string =>
  sha256(JSON.stringify(stableValue(value)));

const readAuthorityConnectorRow = async (
  db: Queryable,
  authorityId: string,
): Promise<AuthorityConnectorRow | null> => {
  const result = await db.query<AuthorityConnectorRow>(
    `
      SELECT
        a.command_authority_id, a.environment_binding_id,
        a.room_source_binding_id, a.room_id, a.source_id, a.world_id,
        a.adapter_profile_id, a.authority_profile, a.autonomy_mode,
        a.approved_categories, a.policy_version,
        a.status AS authority_status, a.expires_at AS authority_expires_at,
        sb.domain_adapter, eb.status AS environment_status,
        room.status AS room_status, sb.status AS source_status,
        c.command_credential_id AS credential_id, c.token_hash, c.scopes,
        c.status AS credential_status, c.expires_at AS credential_expires_at
      FROM helix_environment_command_authorities a
      JOIN helix_environment_connector_bindings eb
        ON eb.environment_binding_id = a.environment_binding_id
      JOIN helix_room_source_bindings sb
        ON sb.binding_id = a.room_source_binding_id
      JOIN helix_shared_realtime_rooms room ON room.room_id = a.room_id
      LEFT JOIN helix_environment_command_connector_credentials c
        ON c.command_authority_id = a.command_authority_id
       AND c.status = 'active'
      WHERE a.command_authority_id = $1
      LIMIT 1;
    `,
    [authorityId],
  );
  return result.rows[0] ?? null;
};

const assertAuthorityActive = (row: AuthorityConnectorRow | null): AuthorityConnectorRow => {
  if (!row) {
    throw new EnvironmentCommandBrokerError(
      "command_authority_not_found",
      404,
      "Environment command authority was not found.",
    );
  }
  const expired =
    row.authority_expires_at !== null &&
    Date.parse(iso(row.authority_expires_at)) <= Date.now();
  if (
    row.authority_status !== "active" ||
    row.environment_status !== "active" ||
    row.source_status !== "active" ||
    row.room_status === "closed" ||
    expired
  ) {
    throw new EnvironmentCommandBrokerError(
      "command_authority_inactive",
      409,
      "Environment command authority is no longer active.",
    );
  }
  return row;
};

const parseScopes = (value: unknown): string[] => {
  const parsed = parseJson<unknown>(value, []);
  return Array.isArray(parsed)
    ? parsed.filter((entry): entry is string => typeof entry === "string")
    : [];
};

export type EnvironmentCommandConnectorClaim = {
  authorityId: string;
  credentialId: string;
  environmentBindingId: string;
  roomSourceBindingId: string;
  roomId: string;
  sourceId: string;
  worldId: string;
  adapterProfileId: string;
  domainAdapter: string;
  policyVersion: number;
};

export const authenticateEnvironmentCommandConnector = async (input: {
  authorityId: string;
  authorization: string | undefined;
  requiredScope: "command.catalog.write" | "command.poll" | "command.result.write";
}): Promise<EnvironmentCommandConnectorClaim> => {
  const match = /^Bearer\s+(.+)$/iu.exec(input.authorization?.trim() ?? "");
  const secret = match?.[1]?.trim() ?? "";
  if (!secret) {
    throw new EnvironmentCommandBrokerError(
      "command_credential_invalid",
      401,
      "A separate environment command credential is required.",
    );
  }
  const db = await readSharedRealtimeRoomDatabase();
  const row = assertAuthorityActive(
    await readAuthorityConnectorRow(db, input.authorityId),
  );
  if (!row.credential_id || row.token_hash !== sha256(secret)) {
    throw new EnvironmentCommandBrokerError(
      "command_credential_invalid",
      401,
      "The environment command credential is invalid.",
    );
  }
  if (
    row.credential_status !== "active" ||
    !row.credential_expires_at ||
    Date.parse(iso(row.credential_expires_at)) <= Date.now()
  ) {
    throw new EnvironmentCommandBrokerError(
      "command_credential_expired",
      401,
      "The environment command credential expired.",
    );
  }
  if (!parseScopes(row.scopes).includes(input.requiredScope)) {
    throw new EnvironmentCommandBrokerError(
      "command_scope_denied",
      403,
      "The command credential does not allow this connector operation.",
    );
  }
  await touchCommandCredentialUse(row.credential_id, async () => {
    await db.query(
      `UPDATE helix_environment_command_connector_credentials
       SET last_used_at = now() WHERE command_credential_id = $1;`,
      [row.credential_id],
    );
  });
  return {
    authorityId: row.command_authority_id,
    credentialId: row.credential_id,
    environmentBindingId: row.environment_binding_id,
    roomSourceBindingId: row.room_source_binding_id,
    roomId: row.room_id,
    sourceId: row.source_id,
    worldId: row.world_id,
    adapterProfileId: row.adapter_profile_id,
    domainAdapter: row.domain_adapter,
    policyVersion: Number(row.policy_version),
  };
};

export type EnvironmentCommandConnectorConfig =
  HelixEnvironmentCommandConnectorConfig;

const commandConnectorConfig = (input: {
  authority: AuthorityConnectorRow;
  publicBaseUrl: string;
  secret: string;
  expiresAt: string;
}): EnvironmentCommandConnectorConfig => ({
  schema: "helix.environment_command.connector_config.v1",
  endpoint: `${input.publicBaseUrl.replace(/\/$/u, "")}/api/environment-command/v1/authorities/${encodeURIComponent(input.authority.command_authority_id)}`,
  bearer_token: input.secret,
  command_authority_id: input.authority.command_authority_id,
  environment_binding_id: input.authority.environment_binding_id,
  room_id: input.authority.room_id,
  source_id: input.authority.source_id,
  world_id: input.authority.world_id,
  adapter_profile_id: input.authority.adapter_profile_id,
  domain_adapter: input.authority.domain_adapter,
  policy_version: Number(input.authority.policy_version),
  command_execution_enabled: true,
  host_access_enabled: false,
  automatic_retry_enabled: false,
  expires_at: input.expiresAt,
});

const issueEnvironmentCommandConnectorCredentialWithSecret = async (input: {
  roomId: string;
  ownerProfileId: string;
  environmentBindingId: string;
  publicBaseUrl: string;
  ttlMs?: number | null;
  secret: string;
  bootstrapPairingId?: string | null;
}): Promise<EnvironmentCommandConnectorConfig> =>
  withSharedRealtimeRoomTransaction(async (db) => {
    const authority = assertAuthorityActive(
      await readAuthorityConnectorRowByEnvironment(
        db,
        input.roomId,
        input.environmentBindingId,
      ),
    );
    const owner = await db.query<{ owner_profile_id: string }>(
      `SELECT owner_profile_id FROM helix_shared_realtime_rooms WHERE room_id = $1 LIMIT 1;`,
      [input.roomId],
    );
    if (owner.rows[0]?.owner_profile_id !== input.ownerProfileId) {
      throw new EnvironmentCommandBrokerError(
        "command_authority_not_found",
        404,
        "Environment command authority was not found.",
      );
    }

    const bootstrapPairingId = input.bootstrapPairingId?.trim() || null;
    if (bootstrapPairingId) {
      const existing = await db.query<{
        command_credential_id: string;
        token_hash: string;
        status: string;
        expires_at: Date | string;
      }>(
        `SELECT command_credential_id, token_hash, status, expires_at
         FROM helix_environment_command_connector_credentials
         WHERE bootstrap_pairing_id = $1 AND command_authority_id = $2
         LIMIT 1;`,
        [bootstrapPairingId, authority.command_authority_id],
      );
      const replay = existing.rows[0];
      if (replay) {
        const expiresAt = iso(replay.expires_at);
        if (
          replay.token_hash !== sha256(input.secret) ||
          replay.status !== "active" ||
          Date.parse(expiresAt) <= Date.now()
        ) {
          throw new EnvironmentCommandBrokerError(
            "command_credential_expired",
            409,
            "The paired command credential is no longer active.",
          );
        }
        return commandConnectorConfig({
          authority,
          publicBaseUrl: input.publicBaseUrl,
          secret: input.secret,
          expiresAt,
        });
      }
    }

    await db.query(
      `UPDATE helix_environment_command_connector_credentials
       SET status = 'revoked', revoked_at = now()
       WHERE command_authority_id = $1 AND status = 'active';`,
      [authority.command_authority_id],
    );
    const requested = input.ttlMs ?? DEFAULT_COMMAND_CREDENTIAL_TTL_MS;
    const ttlMs = Math.min(
      Math.max(60_000, Math.floor(requested)),
      MAX_COMMAND_CREDENTIAL_TTL_MS,
    );
    const leaseExpiryMs = authority.authority_expires_at
      ? Date.parse(iso(authority.authority_expires_at))
      : Number.POSITIVE_INFINITY;
    const expiresAt = new Date(
      Math.min(Date.now() + ttlMs, leaseExpiryMs),
    ).toISOString();
    const credentialId = `command_credential:${crypto.randomUUID()}`;
    await db.query(
      `
        INSERT INTO helix_environment_command_connector_credentials (
          command_credential_id, command_authority_id,
          environment_binding_id, token_hash, token_prefix, scopes, expires_at,
          bootstrap_pairing_id
        ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8);
      `,
      [
        credentialId,
        authority.command_authority_id,
        authority.environment_binding_id,
        sha256(input.secret),
        input.secret.slice(0, 20),
        JSON.stringify([
          "command.catalog.write",
          "command.poll",
          "command.result.write",
        ]),
        expiresAt,
        bootstrapPairingId,
      ],
    );
    await db.query(
      `INSERT INTO helix_environment_command_events (
         event_id, command_authority_id, event_type, payload
       ) VALUES ($1, $2, 'connector_credential_rotated', $3::jsonb);`,
      [
        `command_event:${crypto.randomUUID()}`,
        authority.command_authority_id,
        JSON.stringify({
          credential_id: credentialId,
          actor_profile_id: input.ownerProfileId,
          bootstrap_pairing: bootstrapPairingId !== null,
        }),
      ],
    );
    return commandConnectorConfig({
      authority,
      publicBaseUrl: input.publicBaseUrl,
      secret: input.secret,
      expiresAt,
    });
  });

export const issueEnvironmentCommandConnectorCredential = async (input: {
  roomId: string;
  ownerProfileId: string;
  environmentBindingId: string;
  publicBaseUrl: string;
  ttlMs?: number | null;
}): Promise<EnvironmentCommandConnectorConfig> =>
  issueEnvironmentCommandConnectorCredentialWithSecret({
    ...input,
    secret: `helix_env_cmd_${crypto.randomBytes(32).toString("base64url")}`,
  });

/**
 * Used only by the one-time in-game pairing exchange. The secret is derived
 * from the code and connector-held nonce, allowing a bounded redemption replay
 * without storing the raw command credential on Helix.
 */
export const issueEnvironmentCommandConnectorCredentialForPairing = async (
  input: {
    roomId: string;
    ownerProfileId: string;
    environmentBindingId: string;
    publicBaseUrl: string;
    pairingId: string;
    trustedCredentialSecret: string;
    ttlMs?: number | null;
  },
): Promise<EnvironmentCommandConnectorConfig> =>
  issueEnvironmentCommandConnectorCredentialWithSecret({
    roomId: input.roomId,
    ownerProfileId: input.ownerProfileId,
    environmentBindingId: input.environmentBindingId,
    publicBaseUrl: input.publicBaseUrl,
    ttlMs: input.ttlMs,
    secret: input.trustedCredentialSecret,
    bootstrapPairingId: input.pairingId,
  });

const readAuthorityConnectorRowByEnvironment = async (
  db: Queryable,
  roomId: string,
  environmentBindingId: string,
): Promise<AuthorityConnectorRow | null> => {
  const authority = await db.query<{ command_authority_id: string }>(
    `SELECT command_authority_id
     FROM helix_environment_command_authorities
     WHERE room_id = $1 AND environment_binding_id = $2 AND status = 'active'
     ORDER BY policy_version DESC LIMIT 1;`,
    [roomId, environmentBindingId],
  );
  return authority.rows[0]
    ? readAuthorityConnectorRow(db, authority.rows[0].command_authority_id)
    : null;
};

export const recordEnvironmentCommandCatalog = async (input: {
  claim: EnvironmentCommandConnectorClaim;
  page: unknown;
}): Promise<{ commandCatalogId: string; commandTreeHash: string; replayed: boolean }> => {
  const parsed = helixEnvironmentCommandCatalogPageSchema.safeParse(input.page);
  if (!parsed.success) {
    throw new EnvironmentCommandBrokerError(
      "command_catalog_invalid",
      400,
      "The live Minecraft command catalog page is invalid.",
    );
  }
  const page = parsed.data;
  if (
    page.environment_binding_id !== input.claim.environmentBindingId ||
    page.source_id !== input.claim.sourceId ||
    page.world_id !== input.claim.worldId ||
    page.adapter_profile_id !== input.claim.adapterProfileId ||
    page.domain_adapter !== input.claim.domainAdapter
  ) {
    throw new EnvironmentCommandBrokerError(
      "command_catalog_invalid",
      403,
      "The command catalog belongs to a different environment identity.",
    );
  }
  const db = await readSharedRealtimeRoomDatabase();
  const producerEpochRef = projectEnvironmentAdapterProducerEpoch({
    bindingId: input.claim.roomSourceBindingId,
    producerEpoch: page.producer_epoch_ref,
  });
  const existing = await db.query<{ command_catalog_id: string }>(
    `SELECT command_catalog_id
     FROM helix_environment_command_catalog_snapshots
     WHERE environment_binding_id = $1 AND producer_epoch_ref = $2
       AND command_tree_hash = $3 LIMIT 1;`,
    [page.environment_binding_id, producerEpochRef, page.command_tree_hash],
  );
  if (existing.rows[0]) {
    return {
      commandCatalogId: existing.rows[0].command_catalog_id,
      commandTreeHash: page.command_tree_hash,
      replayed: true,
    };
  }
  await db.query(
    `
      INSERT INTO helix_environment_command_catalog_snapshots (
        command_catalog_id, command_authority_id, environment_binding_id,
        source_id, world_id, adapter_profile_id, domain_adapter, game_version,
        producer_epoch_ref, command_tree_hash, root_command_count,
        catalog_summary, frozen_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14);
    `,
    [
      page.command_catalog_id,
      input.claim.authorityId,
      page.environment_binding_id,
      page.source_id,
      page.world_id,
      page.adapter_profile_id,
      page.domain_adapter,
      page.game_version,
      producerEpochRef,
      page.command_tree_hash,
      page.root_command_count,
      JSON.stringify({
        path_prefix: page.path_prefix,
        nodes: page.nodes,
        next_cursor: page.next_cursor,
        generated_at: page.generated_at,
        raw_dispatcher_tree_included: false,
      }),
      page.generated_at,
      page.expires_at,
    ],
  );
  return {
    commandCatalogId: page.command_catalog_id,
    commandTreeHash: page.command_tree_hash,
    replayed: false,
  };
};

const latestCatalog = async (
  db: Queryable,
  authorityId: string,
): Promise<CatalogRow | null> => {
  const result = await db.query<CatalogRow>(
    `SELECT * FROM helix_environment_command_catalog_snapshots
     WHERE command_authority_id = $1
       AND (expires_at IS NULL OR expires_at > now())
     ORDER BY frozen_at DESC LIMIT 1;`,
    [authorityId],
  );
  return result.rows[0] ?? null;
};

export type EnvironmentCommandCatalogRead = {
  gameVersion: string;
  commandTreeHash: string;
  rootCommandCount: number;
  nodes: HelixMinecraftCommandCatalogNode[];
  matchedCount: number;
  truncated: boolean;
  generatedAt: string;
};

export const readEnvironmentCommandCatalog = async (input: {
  roomId: string;
  profileId: string;
  environmentBindingId: string;
  query?: string | null;
  pathPrefix?: string | null;
  limit?: number | null;
}): Promise<EnvironmentCommandCatalogRead> => {
  const current = await readEnvironmentCommandAuthority({
    roomId: input.roomId,
    profileId: input.profileId,
    environmentBindingId: input.environmentBindingId,
  });
  if (!current.authority || !current.memberGrant) {
    throw new EnvironmentCommandBrokerError(
      "command_policy_denied",
      403,
      "The room member has no active command grant for this environment.",
    );
  }
  const db = await readSharedRealtimeRoomDatabase();
  const catalog = await latestCatalog(db, current.authority.command_authority_id);
  if (!catalog) {
    throw new EnvironmentCommandBrokerError(
      "command_catalog_required",
      409,
      "The bound Minecraft server has not published its live command catalog yet.",
    );
  }
  const summary = parseJson<Record<string, unknown>>(catalog.catalog_summary, {});
  const parsedNodes = Array.isArray(summary.nodes)
    ? summary.nodes.flatMap((candidate) => {
        const parsed = helixMinecraftCommandCatalogNodeSchema.safeParse(candidate);
        return parsed.success ? [parsed.data] : [];
      })
    : [];
  const query = (input.query ?? "").trim().toLowerCase();
  const queryTerms = query.split(/\s+/u).filter(Boolean);
  const pathPrefix = (input.pathPrefix ?? "").trim().toLowerCase();
  const matching = parsedNodes.filter((node) => {
    const path = node.path.toLowerCase();
    return (
      (!pathPrefix || path.startsWith(pathPrefix)) &&
      queryTerms.every((term) => path.includes(term))
    );
  });
  const limit = Math.min(128, Math.max(1, Math.floor(input.limit ?? 64)));
  const nodes = matching.slice(0, limit);
  return {
    gameVersion: catalog.game_version,
    commandTreeHash: catalog.command_tree_hash,
    rootCommandCount: Number(catalog.root_command_count),
    nodes,
    matchedCount: matching.length,
    truncated:
      nodes.length < matching.length ||
      (typeof summary.next_cursor === "string" && summary.next_cursor.length > 0),
    generatedAt: iso(catalog.frozen_at),
  };
};

const requestProjection = (row: RequestRow): HelixEnvironmentCommandRequest => ({
  schema: HELIX_ENVIRONMENT_COMMAND_REQUEST_SCHEMA,
  command_request_id: row.command_request_id,
  command_authority_id: row.command_authority_id,
  command_grant_id: row.command_grant_id,
  environment_binding_id: row.environment_binding_id,
  room_id: row.room_id,
  source_id: row.source_id,
  world_id: row.world_id,
  participant_id: row.participant_id,
  subject_binding_id: row.subject_binding_id,
  subject_native_id: row.subject_native_id,
  run_id: row.run_id,
  turn_id: row.turn_id,
  provider_execution_id: row.provider_execution_id,
  tool_call_id: row.tool_call_id,
  command_catalog_id: row.command_catalog_id,
  authority_profile: row.authority_profile as HelixEnvironmentCommandRequest["authority_profile"],
  autonomy_mode: row.autonomy_mode as HelixEnvironmentCommandRequest["autonomy_mode"],
  approved_categories: parseJson(row.approved_categories, []),
  policy_version: Number(row.policy_version),
  command_text: row.command_text,
  command_hash: row.command_hash,
  command_root_hint: row.command_root_hint,
  requested_category: row.requested_category as HelixEnvironmentCommandCategory,
  expected_effect: row.expected_effect as HelixEnvironmentCommandEffectClass,
  idempotency_key: row.idempotency_key,
  confirmation_state: row.confirmation_state as HelixEnvironmentCommandRequest["confirmation_state"],
  approval_ref: row.approval_ref,
  created_at: iso(row.created_at),
  deadline_at: iso(row.deadline_at),
  constraints: {
    max_duration_ms: Math.min(
      MAX_COMMAND_DEADLINE_MS,
      Math.max(1, Date.parse(iso(row.deadline_at)) - Date.parse(iso(row.created_at))),
    ),
    max_output_bytes: 64_000,
    automatic_retry_allowed: false,
    host_access_allowed: false,
  },
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

export const enqueueEnvironmentCommand = async (input: {
  roomId: string;
  profileId: string;
  environmentBindingId: string;
  runId: string;
  turnId: string;
  providerExecutionId: string;
  toolCallId: string;
  commandText: string;
  requestedCategory: HelixEnvironmentCommandCategory;
  expectedEffect: HelixEnvironmentCommandEffectClass;
  idempotencyKey: string;
  confirmationState: "not_required" | "pending" | "approved" | "rejected";
  approvalRef?: string | null;
  deadlineMs?: number;
}): Promise<HelixEnvironmentCommandRequest> => {
  const command = normalizedCommand(input.commandText);
  if (!command || command.length > 16_000 || input.idempotencyKey.trim().length < 8) {
    throw new EnvironmentCommandBrokerError(
      "command_request_invalid",
      400,
      "A bounded command and stable idempotency key are required.",
    );
  }
  const current = await readEnvironmentCommandAuthority({
    roomId: input.roomId,
    profileId: input.profileId,
    environmentBindingId: input.environmentBindingId,
  });
  if (!current.authority || !current.memberGrant) {
    throw new EnvironmentCommandBrokerError(
      "command_policy_denied",
      403,
      "The room member has no active command grant for this environment.",
    );
  }
  const admission = evaluateEnvironmentCommandPreflightAdmission({
    authority: current.authority,
    grant: current.memberGrant,
    category: input.requestedCategory,
    effect: input.expectedEffect,
    confirmationState: input.confirmationState,
    hostEscapeRequested: false,
  });
  if (!admission.ok) {
    throw new EnvironmentCommandBrokerError(
      "command_policy_denied",
      admission.code === "command_confirmation_required" ? 409 : 403,
      admission.message,
    );
  }
  const playerTargeted = [
    "player_state",
    "player_inventory",
    "player_movement",
  ].includes(input.requestedCategory);
  const selectedSubjectTargeted =
    playerTargeted || commandRequiresSelectedSubjectSource(command);
  const preflightDb = await readSharedRealtimeRoomDatabase();
  const preflightCatalog = await latestCatalog(
    preflightDb,
    current.authority.command_authority_id,
  );
  if (!preflightCatalog) {
    throw new EnvironmentCommandBrokerError(
      "command_catalog_required",
      409,
      "The bound Minecraft server has not published its live command catalog yet.",
    );
  }
  let subjectNativeId: string | null = null;
  if (selectedSubjectTargeted) {
    const membership = await readSharedRealtimeRoomMembership({
      roomId: input.roomId,
      profileId: input.profileId,
    });
    if (!membership || !current.memberGrant.subject_binding_id) {
      throw new EnvironmentCommandBrokerError(
        "command_policy_denied",
        409,
        "Select your online player identity in the room before using player-targeted or @s commands.",
      );
    }
    try {
      const subject = await resolveRoomEnvironmentSubjectForProbe({
        membership,
        participantId: current.memberGrant.participant_id,
        environmentBindingId: current.authority.environment_binding_id,
        sourceId: current.authority.source_id,
        worldId: current.authority.world_id,
        producerEpochRef: preflightCatalog.producer_epoch_ref,
      });
      if (
        !subject ||
        subject.subjectBindingId !== current.memberGrant.subject_binding_id
      ) {
        throw new EnvironmentCommandBrokerError(
          "command_policy_denied",
          409,
          "The selected player binding no longer matches the active command grant.",
        );
      }
      subjectNativeId = subject.subjectNativeId;
    } catch (error) {
      if (error instanceof EnvironmentCommandBrokerError) throw error;
      throw new EnvironmentCommandBrokerError(
        "command_policy_denied",
        409,
        isRoomEnvironmentSubjectError(error)
          ? error.message
          : "The selected player identity could not be verified as online and current.",
      );
    }
  }
  return withSharedRealtimeRoomTransaction(async (db) => {
    const catalog = await latestCatalog(
      db,
      current.authority!.command_authority_id,
    );
    if (
      !catalog ||
      catalog.command_catalog_id !== preflightCatalog.command_catalog_id
    ) {
      throw new EnvironmentCommandBrokerError(
        "command_catalog_required",
        409,
        "The live command catalog changed during admission; compose a new current-turn command request.",
      );
    }
    const duplicate = await db.query<RequestRow>(
      `SELECT * FROM helix_environment_command_requests
       WHERE command_authority_id = $1 AND idempotency_key = $2 LIMIT 1;`,
      [current.authority!.command_authority_id, input.idempotencyKey.trim()],
    );
    if (duplicate.rows[0]) {
      if (duplicate.rows[0].command_hash !== sha256(command)) {
        throw new EnvironmentCommandBrokerError(
          "command_request_conflict",
          409,
          "The command idempotency key was already used for different content.",
        );
      }
      return requestProjection(duplicate.rows[0]);
    }
    const deadlineMs = Math.min(
      Math.max(1_000, input.deadlineMs ?? DEFAULT_COMMAND_DEADLINE_MS),
      MAX_COMMAND_DEADLINE_MS,
    );
    const createdAt = new Date();
    const deadlineAt = new Date(createdAt.getTime() + deadlineMs);
    const requestId = `command_request:${crypto.randomUUID()}`;
    await db.query(
      `
        INSERT INTO helix_environment_command_requests (
          command_request_id, command_authority_id, command_grant_id,
          command_catalog_id, environment_binding_id, room_id, source_id,
          world_id, participant_id, subject_binding_id, subject_native_id,
          run_id, turn_id,
          provider_execution_id, tool_call_id, authority_profile, autonomy_mode,
          approved_categories, policy_version, command_text, command_hash,
          command_root_hint, requested_category, expected_effect,
          idempotency_key, confirmation_state, approval_ref,
          deadline_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18::jsonb, $19, $20, $21, $22, $23, $24, $25,
          $26, $27, $28, $29, $29
        );
      `,
      [
        requestId,
        current.authority!.command_authority_id,
        current.memberGrant!.command_grant_id,
        catalog.command_catalog_id,
        current.authority!.environment_binding_id,
        current.authority!.room_id,
        current.authority!.source_id,
        current.authority!.world_id,
        current.memberGrant!.participant_id,
        current.memberGrant!.subject_binding_id,
        subjectNativeId,
        input.runId,
        input.turnId,
        input.providerExecutionId,
        input.toolCallId,
        admission.effective_profile,
        admission.effective_autonomy,
        JSON.stringify(current.authority!.approved_categories),
        current.authority!.policy_version,
        command,
        sha256(command),
        commandRoot(command),
        input.requestedCategory,
        input.expectedEffect,
        input.idempotencyKey.trim(),
        input.confirmationState,
        input.approvalRef ?? null,
        deadlineAt.toISOString(),
        createdAt.toISOString(),
      ],
    );
    const inserted = await db.query<RequestRow>(
      `SELECT * FROM helix_environment_command_requests WHERE command_request_id = $1;`,
      [requestId],
    );
    return requestProjection(inserted.rows[0]);
  });
};

export const leasePendingEnvironmentCommands = async (input: {
  claim: EnvironmentCommandConnectorClaim;
  limit?: number;
}): Promise<HelixEnvironmentCommandRequest[]> => {
  const readDb = await readSharedRealtimeRoomDatabase();
  const work = await readDb.query<{ present: number }>(
    `SELECT 1 AS present
     FROM helix_environment_command_requests
     WHERE command_authority_id = $1
       AND (
         status = 'pending'
         OR (status = 'leased' AND lease_expires_at <= now())
       )
     LIMIT 1;`,
    [input.claim.authorityId],
  );
  if (!work.rows[0]) return [];

  return withSharedRealtimeRoomTransaction(async (db) => {
    const limit = Math.min(8, Math.max(1, Math.floor(input.limit ?? 4)));
    const now = new Date();
    await db.query(
      `UPDATE helix_environment_command_requests
       SET status = 'outcome_unknown', completed_at = now(), updated_at = now(),
           cancellation_reason = 'lease_expired_no_retry'
       WHERE command_authority_id = $1 AND status = 'leased'
         AND lease_expires_at <= now();`,
      [input.claim.authorityId],
    );
    await db.query(
      `UPDATE helix_environment_command_requests
       SET status = 'expired', completed_at = now(), updated_at = now(),
           cancellation_reason = 'deadline_expired'
       WHERE command_authority_id = $1 AND status = 'pending'
         AND deadline_at <= now();`,
      [input.claim.authorityId],
    );
    const candidates = await db.query<RequestRow>(
      `SELECT * FROM helix_environment_command_requests
       WHERE command_authority_id = $1 AND status = 'pending'
         AND deadline_at > now()
       ORDER BY created_at LIMIT $2 FOR UPDATE;`,
      [input.claim.authorityId, limit],
    );
    const leased: HelixEnvironmentCommandRequest[] = [];
    for (const row of candidates.rows) {
      const leaseExpiresAt = new Date(
        Math.min(
          Date.parse(iso(row.deadline_at)),
          now.getTime() + DEFAULT_LEASE_MS,
        ),
      ).toISOString();
      const result = await db.query<RequestRow>(
        `UPDATE helix_environment_command_requests
         SET status = 'leased', attempt_count = attempt_count + 1,
             leased_at = $2, lease_expires_at = $3, updated_at = $2
         WHERE command_request_id = $1 AND status = 'pending'
         RETURNING *;`,
        [row.command_request_id, now.toISOString(), leaseExpiresAt],
      );
      if (result.rows[0]) leased.push(requestProjection(result.rows[0]));
    }
    return leased;
  });
};

const observationFromRows = (
  request: RequestRow,
  result: ResultRow,
): HelixEnvironmentCommandObservation => {
  const payload = parseJson<HelixEnvironmentCommandResult | null>(
    result.result_payload,
    null,
  );
  return {
    schema: HELIX_ENVIRONMENT_COMMAND_OBSERVATION_SCHEMA,
    command_request_ref: request.command_request_id,
    command_execution_ref: result.command_execution_id,
    command_hash: request.command_hash,
    command_root: result.command_root,
    outcome: result.outcome as HelixEnvironmentCommandObservation["outcome"],
    summary: payload?.summary ?? "Minecraft command completed.",
    result: payload ? { ...payload, command_text: undefined } : {},
    evidence_ref: `environment_command_evidence:${result.result_hash.slice("sha256:".length, 48)}`,
    post_state_evidence_refs: [],
    observed_at: iso(result.received_at),
    provenance_valid: result.provenance_valid,
    eligible_for_current_turn_reentry: result.eligible_for_current_turn_reentry,
    content_role: "environment_command_observation_not_assistant_answer",
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export const submitEnvironmentCommandResult = async (input: {
  claim: EnvironmentCommandConnectorClaim;
  result: unknown;
}): Promise<{ observation: HelixEnvironmentCommandObservation; replayed: boolean }> => {
  const parsed = helixEnvironmentCommandResultSchema.safeParse(input.result);
  if (!parsed.success) {
    throw new EnvironmentCommandBrokerError(
      "command_result_invalid",
      400,
      "The Minecraft command result envelope is invalid.",
    );
  }
  const raw = parsed.data;
  return withSharedRealtimeRoomTransaction(async (db) => {
    const requestResult = await db.query<RequestRow>(
      `SELECT * FROM helix_environment_command_requests
       WHERE command_request_id = $1 AND command_authority_id = $2
       LIMIT 1 FOR UPDATE;`,
      [raw.command_request_id, input.claim.authorityId],
    );
    const request = requestResult.rows[0];
    if (!request) {
      throw new EnvironmentCommandBrokerError(
        "command_request_not_found",
        404,
        "The command request was not found for this authority.",
      );
    }
    const hash = resultHash(raw);
    const existing = await db.query<ResultRow>(
      `SELECT * FROM helix_environment_command_results
       WHERE command_request_id = $1 LIMIT 1;`,
      [request.command_request_id],
    );
    if (existing.rows[0]) {
      if (existing.rows[0].result_hash !== hash) {
        throw new EnvironmentCommandBrokerError(
          "command_result_conflict",
          409,
          "A different result is already recorded for this command request.",
        );
      }
      return {
        observation: observationFromRows(request, existing.rows[0]),
        replayed: true,
      };
    }
    if (request.status !== "leased") {
      throw new EnvironmentCommandBrokerError(
        "command_request_not_leased",
        409,
        "The command request is not in its one-shot execution lease.",
      );
    }
    const now = new Date();
    const leaseActive =
      request.lease_expires_at !== null &&
      Date.parse(iso(request.lease_expires_at)) > now.getTime() &&
      Date.parse(iso(request.deadline_at)) > now.getTime();
    const identityValid =
      request.environment_binding_id === input.claim.environmentBindingId &&
      request.room_id === input.claim.roomId &&
      request.source_id === input.claim.sourceId &&
      request.world_id === input.claim.worldId &&
      Number(request.policy_version) === input.claim.policyVersion;
    const envelopeMatches =
      raw.command_hash === request.command_hash &&
      raw.parsed_category === request.requested_category &&
      raw.effect_class === request.expected_effect;
    const eligible =
      leaseActive &&
      identityValid &&
      envelopeMatches &&
      raw.parsed_by_live_dispatcher;
    const outcome = !leaseActive
      ? "command_outcome_unknown"
      : !identityValid
        ? "authority_stale"
        : !envelopeMatches
          ? "command_category_mismatch"
          : raw.outcome;
    const canonical: HelixEnvironmentCommandResult = {
      ...raw,
      outcome,
      side_effects_performed: eligible && raw.side_effects_performed,
      environment_mutation_performed:
        eligible && raw.environment_mutation_performed,
      server_administration_performed:
        eligible && raw.server_administration_performed,
    };
    const canonicalHash = resultHash(canonical);
    const resultId = `command_result:${crypto.randomUUID()}`;
    await db.query(
      `
        INSERT INTO helix_environment_command_results (
          command_result_id, command_request_id, command_execution_id,
          command_hash, command_root, parsed_category, effect_class, outcome,
          result_code, result_payload, result_hash, side_effects_performed,
          environment_mutation_performed, server_administration_performed,
          provenance_valid, eligible_for_current_turn_reentry, received_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11,
          $12, $13, $14, true, $15, $16
        ) RETURNING *;
      `,
      [
        resultId,
        request.command_request_id,
        canonical.command_execution_id,
        canonical.command_hash,
        canonical.command_root,
        canonical.parsed_category,
        canonical.effect_class,
        canonical.outcome,
        canonical.result_code,
        JSON.stringify(canonical),
        canonicalHash,
        canonical.side_effects_performed,
        canonical.environment_mutation_performed,
        canonical.server_administration_performed,
        eligible,
        now.toISOString(),
      ],
    );
    await db.query(
      `UPDATE helix_environment_command_requests
       SET status = $2, completed_at = $3, updated_at = $3
       WHERE command_request_id = $1;`,
      [
        request.command_request_id,
        eligible && canonical.outcome === "succeeded" ? "succeeded" : "failed",
        now.toISOString(),
      ],
    );
    const stored = await db.query<ResultRow>(
      `SELECT * FROM helix_environment_command_results WHERE command_result_id = $1;`,
      [resultId],
    );
    return {
      observation: observationFromRows(request, stored.rows[0]),
      replayed: false,
    };
  });
};

export const readEnvironmentCommandObservation = async (
  requestId: string,
): Promise<HelixEnvironmentCommandObservation | null> => {
  const db = await readSharedRealtimeRoomDatabase();
  const result = await db.query<RequestRow & ResultRow>(
    `SELECT r.*, x.*
     FROM helix_environment_command_requests r
     JOIN helix_environment_command_results x
       ON x.command_request_id = r.command_request_id
     WHERE r.command_request_id = $1 LIMIT 1;`,
    [requestId],
  );
  const row = result.rows[0];
  return row ? observationFromRows(row, row) : null;
};

export const awaitEnvironmentCommandObservation = async (input: {
  requestId: string;
  deadlineAt: string;
  signal?: AbortSignal;
}): Promise<HelixEnvironmentCommandObservation> => {
  for (;;) {
    if (input.signal?.aborted) {
      throw new EnvironmentCommandBrokerError(
        "command_request_expired",
        499,
        "The command wait was canceled. Its outcome must not be retried automatically.",
      );
    }
    const observation = await readEnvironmentCommandObservation(input.requestId);
    if (observation) return observation;
    if (Date.now() >= Date.parse(input.deadlineAt)) {
      const db = await readSharedRealtimeRoomDatabase();
      await db.query(
        `UPDATE helix_environment_command_requests
         SET status = CASE WHEN status = 'leased' THEN 'outcome_unknown' ELSE 'expired' END,
             cancellation_reason = 'deadline_expired_no_retry',
             completed_at = now(), updated_at = now()
         WHERE command_request_id = $1 AND status IN ('pending', 'leased');`,
        [input.requestId],
      );
      throw new EnvironmentCommandBrokerError(
        "command_request_expired",
        504,
        "The Minecraft command did not return before its deadline. Its outcome is unknown and it was not retried.",
      );
    }
    await new Promise<void>((resolve) => setTimeout(resolve, WAIT_POLL_MS));
  }
};
