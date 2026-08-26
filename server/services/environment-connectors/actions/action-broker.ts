import crypto from "node:crypto";
import {
  HELIX_ENVIRONMENT_ACTION_CONNECTOR_CONFIG_SCHEMA,
  HELIX_ENVIRONMENT_ACTION_CONTROL_OBSERVATION_SCHEMA,
  HELIX_ENVIRONMENT_ACTION_OBSERVATION_SCHEMA,
  helixEnvironmentActionConnectorConfigSchema,
  helixEnvironmentActionConnectorHeartbeatSchema,
  helixEnvironmentActionConnectorManifestSchema,
  helixEnvironmentActionControlObservationSchema,
  helixEnvironmentActionControlRequestSchema,
  helixEnvironmentActionControlResultSchema,
  helixEnvironmentActionObservationSchema,
  helixEnvironmentActionRequestSchema,
  helixEnvironmentActionResultSchema,
  helixEnvironmentActionWorkflowEventSchema,
  type HelixEnvironmentActionConnectorConfig,
  type HelixEnvironmentActionConnectorHeartbeat,
  type HelixEnvironmentActionConnectorManifest,
  type HelixEnvironmentActionControlObservation,
  type HelixEnvironmentActionControlRequest,
  type HelixEnvironmentActionControlResult,
  type HelixEnvironmentActionObservation,
  type HelixEnvironmentActionOutcome,
  type HelixEnvironmentActionRequest,
  type HelixEnvironmentActionResult,
  type HelixEnvironmentActionWorkflowEvent,
} from "@shared/helix-environment-action";
import {
  HELIX_MINECRAFT_FLUID_CONDITION_OBSERVATION_LIMIT,
  helixMinecraftFluidConditionObservationSchema,
  helixMinecraftFluidSequenceArgumentsSchema,
  type HelixMinecraftFluidSequenceArguments,
} from "@shared/helix-minecraft-fluid-sequence";
import {
  helixMinecraftReactiveProgramArgumentsSchema,
  helixMinecraftReactiveProgramObservationSchema,
  type HelixMinecraftReactiveProgramArguments,
} from "@shared/helix-minecraft-reactive-program";
import {
  helixMinecraftArmViabilityGuardianArgumentsSchema,
  helixMinecraftDisarmViabilityGuardianArgumentsSchema,
} from "@shared/helix-minecraft-viability-guardian";
import {
  environmentConnectorSha256,
  listEnvironmentConnectorCapabilityDescriptors,
} from "../catalog";
import { resolveEnvironmentActionAdapterProfile } from "../../situation-room/environment-action-adapter-registry";
import {
  readSharedRealtimeRoomDatabase,
  withSharedRealtimeRoomTransaction,
} from "../../helix-ask/realtime-room/room-store/database";
import { readSharedRealtimeRoomMembership } from "../../helix-ask/realtime-room/room-store";
import type { Queryable } from "../../helix-ask/realtime-room/room-store/types";
import { createCredentialUseTouchThrottle } from "../credential-use-throttle";

const DEFAULT_CREDENTIAL_TTL_MS = 24 * 60 * 60_000;
const MAX_CREDENTIAL_TTL_MS = 7 * 24 * 60 * 60_000;
const DEFAULT_LEASE_MS = 10_000;
const WAIT_POLL_MS = 40;
const touchActionCredentialUse = createCredentialUseTouchThrottle();

export type EnvironmentActionBrokerErrorCode =
  | "action_authority_not_found"
  | "action_authority_inactive"
  | "action_credential_invalid"
  | "action_credential_expired"
  | "action_scope_denied"
  | "action_manifest_invalid"
  | "action_manifest_required"
  | "action_heartbeat_invalid"
  | "action_connector_stale"
  | "action_event_stream_resync_required"
  | "action_request_invalid"
  | "action_request_conflict"
  | "action_request_not_found"
  | "action_request_not_leased"
  | "action_request_expired"
  | "action_policy_denied"
  | "action_event_invalid"
  | "action_event_conflict"
  | "action_result_invalid"
  | "action_result_conflict"
  | "action_control_invalid"
  | "action_control_conflict";

export class EnvironmentActionBrokerError extends Error {
  constructor(
    readonly code: EnvironmentActionBrokerErrorCode,
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "EnvironmentActionBrokerError";
  }
}

export const isEnvironmentActionBrokerError = (
  error: unknown,
): error is EnvironmentActionBrokerError =>
  error instanceof EnvironmentActionBrokerError;

export const environmentActionEventCursorMatches = (
  connectorLatestSequence: number | null,
  serverLatestSequence: number | null,
): boolean => connectorLatestSequence === serverLatestSequence;

type AuthorityConnectorRow = {
  action_authority_id: string;
  environment_binding_id: string;
  room_source_binding_id: string;
  owner_profile_id: string;
  room_id: string;
  source_id: string;
  world_id: string;
  adapter_profile_id: string;
  domain_adapter: string;
  participant_id: string;
  subject_binding_id: string;
  subject_native_id: string;
  allowed_capability_ids: unknown;
  autonomy_mode: string;
  manual_override_policy: string;
  policy_version: number | string;
  authority_status: string;
  authority_expires_at: Date | string | null;
  environment_status: string;
  source_status: string;
  room_status: string;
  source_adapter_profile_id: string;
  credential_id: string | null;
  connector_installation_id: string | null;
  token_hash: string | null;
  scopes: unknown;
  credential_status: string | null;
  credential_expires_at: Date | string | null;
};

type ManifestRow = {
  manifest_id: string;
  action_authority_id: string;
  environment_binding_id: string;
  connector_installation_id: string;
  producer_epoch_ref: string;
  manifest_hash: string;
  capabilities: unknown;
  status: string;
  received_at: Date | string;
  expires_at: Date | string | null;
};

type ExistingManifestReplayRow = ManifestRow & {
  room_id: string;
  source_id: string;
  world_id: string;
  participant_id: string;
  subject_binding_id: string;
  subject_native_id: string;
  domain: string;
  domain_adapter: string;
  adapter_profile_id: string;
  adapter_version: string;
  protocol_version: string;
  available_control_engines: unknown;
  safety_policy: unknown;
};

type ActionRequestRow = {
  action_request_id: string;
  workflow_id: string;
  action_authority_id: string;
  connector_manifest_id: string;
  catalog_snapshot_id: string;
  environment_binding_id: string;
  room_id: string;
  source_id: string;
  world_id: string;
  participant_id: string;
  subject_binding_id: string;
  subject_native_id: string;
  run_id: string;
  turn_id: string;
  provider_execution_id: string;
  tool_call_id: string;
  capability_id: string;
  capability_version: number | string;
  action_kind: string;
  effect_class: string;
  workflow_mode: string;
  requested_control_engine: string;
  request_payload: unknown;
  request_hash: string;
  idempotency_key: string;
  confirmation_state: string;
  approval_ref: string | null;
  policy_version: number | string;
  status: string;
  attempt_count: number | string;
  deadline_at: Date | string;
  created_at: Date | string;
  leased_at: Date | string | null;
  lease_expires_at: Date | string | null;
  completed_at: Date | string | null;
};

type ResultRow = {
  action_result_id: string;
  action_request_id: string;
  action_execution_id: string;
  result_payload: unknown;
  submitted_result_hash: string;
  result_hash: string;
  provenance_valid: boolean;
  eligible_for_current_turn_reentry: boolean;
  completed_at: Date | string;
  received_at: Date | string;
};

type ControlRequestRow = {
  control_request_id: string;
  action_authority_id: string;
  workflow_id: string | null;
  control_kind: string;
  request_payload: unknown;
  request_hash: string;
  status: string;
  deadline_at: Date | string;
  created_at: Date | string;
  leased_at: Date | string | null;
  lease_expires_at: Date | string | null;
  completed_at: Date | string | null;
};

type ControlResultRow = {
  control_result_id: string;
  control_request_id: string;
  result_payload: unknown;
  submitted_result_hash: string;
  result_hash: string;
  controls_released: boolean;
  provenance_valid: boolean;
  eligible_for_current_turn_reentry: boolean;
  received_at: Date | string;
};

const iso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();
const parseJson = <T>(value: unknown, fallback: T): T => {
  if (typeof value !== "string") return (value as T) ?? fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};
const sha256Secret = (secret: string): string =>
  `sha256:${crypto.createHash("sha256").update(secret, "utf8").digest("hex")}`;
const parseStringArray = (value: unknown): string[] => {
  const parsed = parseJson<unknown>(value, []);
  return Array.isArray(parsed)
    ? parsed.filter((entry): entry is string => typeof entry === "string")
    : [];
};

export const environmentActionManifestReplayCompatible = (input: {
  existing: ExistingManifestReplayRow;
  manifest: HelixEnvironmentActionConnectorManifest;
}): boolean => {
  const { existing, manifest } = input;
  const jsonMatches = (stored: unknown, submitted: unknown): boolean =>
    environmentConnectorSha256(parseJson(stored, null)) ===
    environmentConnectorSha256(submitted);
  return (
    existing.status === "active" &&
    existing.manifest_id === manifest.manifest_id &&
    existing.action_authority_id === manifest.action_authority_id &&
    existing.environment_binding_id === manifest.environment_binding_id &&
    existing.connector_installation_id === manifest.connector_installation_id &&
    existing.producer_epoch_ref === manifest.producer_epoch_ref &&
    existing.room_id === manifest.room_id &&
    existing.source_id === manifest.source_id &&
    existing.world_id === manifest.world_id &&
    existing.participant_id === manifest.participant_id &&
    existing.subject_binding_id === manifest.subject_binding_id &&
    existing.subject_native_id === manifest.subject_native_id &&
    existing.domain === manifest.domain &&
    existing.domain_adapter === manifest.domain_adapter &&
    existing.adapter_profile_id === manifest.adapter_profile_id &&
    existing.adapter_version === manifest.adapter_version &&
    existing.protocol_version === manifest.protocol_version &&
    jsonMatches(existing.capabilities, manifest.capabilities) &&
    jsonMatches(
      existing.available_control_engines,
      manifest.available_control_engines,
    ) &&
    jsonMatches(existing.safety_policy, manifest.safety_policy)
  );
};

/**
 * Projects an action request onto the operator-visible meaning of the action.
 *
 * Provider/tool invocation ids, workflow ids, condition ids, and timestamps are
 * delivery metadata. They are intentionally excluded so a bounded provider
 * retry of the same current-turn action resolves to the original admitted
 * request instead of becoming a false idempotency conflict. Identity, policy,
 * capability, arguments, conditions, and approval remain part of the hash.
 */
export const projectEnvironmentActionIdempotencyContent = (
  request: HelixEnvironmentActionRequest,
) => ({
  schema: request.schema,
  action_authority_id: request.action_authority_id,
  environment_binding_id: request.environment_binding_id,
  room_id: request.room_id,
  source_id: request.source_id,
  world_id: request.world_id,
  participant_id: request.participant_id,
  subject_binding_id: request.subject_binding_id,
  subject_native_id: request.subject_native_id,
  run_id: request.run_id,
  turn_id: request.turn_id,
  catalog_snapshot_id: request.catalog_snapshot_id,
  capability_id: request.capability_id,
  capability_version: request.capability_version,
  action_kind: request.action_kind,
  effect_class: request.effect_class,
  workflow_mode: request.workflow_mode,
  requested_control_engine: request.requested_control_engine,
  arguments: request.arguments,
  preconditions: request.preconditions.map((condition) => ({
    condition_kind: condition.condition_kind,
    required: condition.required,
    parameters: condition.parameters,
  })),
  postconditions: request.postconditions.map((condition) => ({
    condition_kind: condition.condition_kind,
    required: condition.required,
    parameters: condition.parameters,
  })),
  confirmation_state: request.confirmation_state,
  approval_ref: request.approval_ref,
  constraints: request.constraints,
  answer_authority: request.answer_authority,
  assistant_answer: request.assistant_answer,
  terminal_eligible: request.terminal_eligible,
  raw_content_included: request.raw_content_included,
});

export const hashEnvironmentActionIdempotencyContent = (
  request: HelixEnvironmentActionRequest,
): `sha256:${string}` =>
  environmentConnectorSha256(
    projectEnvironmentActionIdempotencyContent(request),
  );

export const storedEnvironmentActionMatchesIdempotencyContent = (input: {
  storedPayload: unknown;
  storedRequestHash: string;
  request: HelixEnvironmentActionRequest;
}): boolean => {
  const storedRequest = helixEnvironmentActionRequestSchema.safeParse(
    parseJson<unknown>(input.storedPayload, null),
  );
  const storedRequestHash = storedRequest.success
    ? hashEnvironmentActionIdempotencyContent(storedRequest.data)
    : input.storedRequestHash;
  return (
    storedRequestHash === hashEnvironmentActionIdempotencyContent(input.request)
  );
};

const readAuthorityConnectorRow = async (
  db: Queryable,
  authorityId: string,
): Promise<AuthorityConnectorRow | null> => {
  const result = await db.query<AuthorityConnectorRow>(
    `
      SELECT
        a.action_authority_id, a.environment_binding_id,
        a.room_source_binding_id, a.owner_profile_id, a.room_id,
        a.source_id, a.world_id, a.adapter_profile_id, a.domain_adapter,
        a.participant_id, a.subject_binding_id, a.subject_native_id,
        a.allowed_capability_ids, a.autonomy_mode,
        a.manual_override_policy, a.policy_version,
        a.status AS authority_status, a.expires_at AS authority_expires_at,
        eb.status AS environment_status, sb.status AS source_status,
        room.status AS room_status,
        admission.adapter_profile_id AS source_adapter_profile_id,
        credential.action_credential_id AS credential_id,
        credential.connector_installation_id,
        credential.token_hash, credential.scopes,
        credential.status AS credential_status,
        credential.expires_at AS credential_expires_at
      FROM helix_environment_action_authorities a
      JOIN helix_environment_connector_bindings eb
        ON eb.environment_binding_id = a.environment_binding_id
      JOIN helix_environment_adapter_admissions admission
        ON admission.admission_id = eb.adapter_admission_id
      JOIN helix_room_source_bindings sb
        ON sb.binding_id = a.room_source_binding_id
      JOIN helix_shared_realtime_rooms room ON room.room_id = a.room_id
      LEFT JOIN helix_environment_action_connector_credentials credential
        ON credential.action_authority_id = a.action_authority_id
       AND credential.status = 'active'
      WHERE a.action_authority_id = $1
      LIMIT 1;
    `,
    [authorityId],
  );
  return result.rows[0] ?? null;
};

const assertAuthorityUsable = (
  row: AuthorityConnectorRow | null,
  allowSuspendedControl = false,
): AuthorityConnectorRow => {
  if (!row) {
    throw new EnvironmentActionBrokerError(
      "action_authority_not_found",
      404,
      "Player-action authority was not found.",
    );
  }
  const expired =
    row.authority_expires_at !== null &&
    Date.parse(iso(row.authority_expires_at)) <= Date.now();
  const authorityStatusValid =
    row.authority_status === "active" ||
    (allowSuspendedControl && row.authority_status === "suspended");
  if (
    !authorityStatusValid ||
    row.environment_status !== "active" ||
    row.source_status !== "active" ||
    row.room_status === "closed" ||
    expired
  ) {
    throw new EnvironmentActionBrokerError(
      "action_authority_inactive",
      409,
      "Player-action authority is not active for ordinary execution.",
    );
  }
  return row;
};

export type EnvironmentActionConnectorScope =
  | "action.manifest.write"
  | "action.heartbeat.write"
  | "action.poll"
  | "action.event.write"
  | "environment.event.write"
  | "action.result.write"
  | "action.control.poll"
  | "action.control.write";

export type EnvironmentActionConnectorClaim = {
  authorityId: string;
  credentialId: string;
  connectorInstallationId: string;
  environmentBindingId: string;
  roomSourceBindingId: string;
  roomId: string;
  sourceId: string;
  worldId: string;
  actionAdapterProfileId: string;
  actionDomainAdapter: string;
  sourceAdapterProfileId: string;
  participantId: string;
  subjectBindingId: string;
  subjectNativeId: string;
  policyVersion: number;
};

export const authenticateEnvironmentActionConnector = async (input: {
  authorityId: string;
  authorization: string | undefined;
  requiredScope: EnvironmentActionConnectorScope;
}): Promise<EnvironmentActionConnectorClaim> => {
  const match = /^Bearer\s+(.+)$/iu.exec(input.authorization?.trim() ?? "");
  const secret = match?.[1]?.trim() ?? "";
  if (!secret) {
    throw new EnvironmentActionBrokerError(
      "action_credential_invalid",
      401,
      "A separate player-action connector credential is required.",
    );
  }
  const db = await readSharedRealtimeRoomDatabase();
  const controlScope =
    input.requiredScope.startsWith("action.control.") ||
    input.requiredScope === "action.heartbeat.write" ||
    input.requiredScope === "action.event.write" ||
    input.requiredScope === "environment.event.write" ||
    input.requiredScope === "action.result.write";
  const row = assertAuthorityUsable(
    await readAuthorityConnectorRow(db, input.authorityId),
    controlScope,
  );
  if (!row.credential_id || row.token_hash !== sha256Secret(secret)) {
    throw new EnvironmentActionBrokerError(
      "action_credential_invalid",
      401,
      "The player-action connector credential is invalid.",
    );
  }
  if (
    row.credential_status !== "active" ||
    !row.credential_expires_at ||
    Date.parse(iso(row.credential_expires_at)) <= Date.now()
  ) {
    throw new EnvironmentActionBrokerError(
      "action_credential_expired",
      401,
      "The player-action connector credential expired.",
    );
  }
  if (!parseStringArray(row.scopes).includes(input.requiredScope)) {
    throw new EnvironmentActionBrokerError(
      "action_scope_denied",
      403,
      "The player-action credential does not allow this connector operation.",
    );
  }
  await touchActionCredentialUse(row.credential_id, async () => {
    await db.query(
      `UPDATE helix_environment_action_connector_credentials
       SET last_used_at = now() WHERE action_credential_id = $1;`,
      [row.credential_id],
    );
  });
  return {
    authorityId: row.action_authority_id,
    credentialId: row.credential_id,
    connectorInstallationId: row.connector_installation_id!,
    environmentBindingId: row.environment_binding_id,
    roomSourceBindingId: row.room_source_binding_id,
    roomId: row.room_id,
    sourceId: row.source_id,
    worldId: row.world_id,
    actionAdapterProfileId: row.adapter_profile_id,
    actionDomainAdapter: row.domain_adapter,
    sourceAdapterProfileId: row.source_adapter_profile_id,
    participantId: row.participant_id,
    subjectBindingId: row.subject_binding_id,
    subjectNativeId: row.subject_native_id,
    policyVersion: Number(row.policy_version),
  };
};

export const buildEnvironmentActionConnectorEndpoint = (
  publicBaseUrl: string,
  actionAuthorityId: string,
): string =>
  `${publicBaseUrl.replace(/\/$/u, "")}/api/environment-action/v1/authorities/${actionAuthorityId}`;

const connectorConfig = (input: {
  authority: AuthorityConnectorRow;
  connectorInstallationId: string;
  publicBaseUrl: string;
  secret: string;
  expiresAt: string;
}): HelixEnvironmentActionConnectorConfig =>
  helixEnvironmentActionConnectorConfigSchema.parse({
    schema: HELIX_ENVIRONMENT_ACTION_CONNECTOR_CONFIG_SCHEMA,
    endpoint: buildEnvironmentActionConnectorEndpoint(
      input.publicBaseUrl,
      input.authority.action_authority_id,
    ),
    bearer_token: input.secret,
    action_authority_id: input.authority.action_authority_id,
    connector_installation_id: input.connectorInstallationId,
    environment_binding_id: input.authority.environment_binding_id,
    room_id: input.authority.room_id,
    source_id: input.authority.source_id,
    world_id: input.authority.world_id,
    adapter_profile_id: input.authority.adapter_profile_id,
    domain_adapter: input.authority.domain_adapter,
    participant_id: input.authority.participant_id,
    subject_binding_id: input.authority.subject_binding_id,
    subject_native_id: input.authority.subject_native_id,
    policy_version: Number(input.authority.policy_version),
    action_execution_enabled: true,
    host_access_enabled: false,
    automatic_replay_enabled: false,
    emergency_stop_required: true,
    expires_at: input.expiresAt,
  });

const issueCredentialWithSecret = async (input: {
  roomId: string;
  ownerProfileId: string;
  actionAuthorityId: string;
  publicBaseUrl: string;
  secret: string;
  connectorInstallationId?: string | null;
  bootstrapPairingId?: string | null;
  ttlMs?: number | null;
}): Promise<HelixEnvironmentActionConnectorConfig> =>
  withSharedRealtimeRoomTransaction(async (db) => {
    const authority = assertAuthorityUsable(
      await readAuthorityConnectorRow(db, input.actionAuthorityId),
    );
    if (
      authority.room_id !== input.roomId ||
      authority.owner_profile_id !== input.ownerProfileId
    ) {
      throw new EnvironmentActionBrokerError(
        "action_authority_not_found",
        404,
        "Player-action authority was not found.",
      );
    }
    const installationId =
      input.connectorInstallationId?.trim() ||
      `environment_action_connector_installation:${crypto.randomUUID()}`;
    const bootstrapPairingId = input.bootstrapPairingId?.trim() || null;
    if (bootstrapPairingId) {
      const replay = await db.query<{
        token_hash: string;
        status: string;
        expires_at: Date | string;
        connector_installation_id: string;
      }>(
        `SELECT token_hash, status, expires_at, connector_installation_id
         FROM helix_environment_action_connector_credentials
         WHERE bootstrap_pairing_id = $1 AND action_authority_id = $2
         LIMIT 1;`,
        [bootstrapPairingId, authority.action_authority_id],
      );
      if (replay.rows[0]) {
        const expiresAt = iso(replay.rows[0].expires_at);
        if (
          replay.rows[0].token_hash !== sha256Secret(input.secret) ||
          replay.rows[0].status !== "active" ||
          Date.parse(expiresAt) <= Date.now()
        ) {
          throw new EnvironmentActionBrokerError(
            "action_credential_expired",
            409,
            "The paired player-action credential is no longer active.",
          );
        }
        return connectorConfig({
          authority,
          connectorInstallationId: replay.rows[0].connector_installation_id,
          publicBaseUrl: input.publicBaseUrl,
          secret: input.secret,
          expiresAt,
        });
      }
    }
    await db.query(
      `UPDATE helix_environment_action_connector_credentials
       SET status = 'revoked', revoked_at = now()
       WHERE action_authority_id = $1 AND status = 'active';`,
      [authority.action_authority_id],
    );
    const ttlMs = Math.min(
      Math.max(60_000, Math.floor(input.ttlMs ?? DEFAULT_CREDENTIAL_TTL_MS)),
      MAX_CREDENTIAL_TTL_MS,
    );
    const authorityExpiry = authority.authority_expires_at
      ? Date.parse(iso(authority.authority_expires_at))
      : Number.POSITIVE_INFINITY;
    const expiresAt = new Date(
      Math.min(Date.now() + ttlMs, authorityExpiry),
    ).toISOString();
    await db.query(
      `
        INSERT INTO helix_environment_action_connector_credentials (
          action_credential_id, action_authority_id, environment_binding_id,
          connector_installation_id, bootstrap_pairing_id, token_hash,
          token_prefix, scopes, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9);
      `,
      [
        `environment_action_credential:${crypto.randomUUID()}`,
        authority.action_authority_id,
        authority.environment_binding_id,
        installationId,
        bootstrapPairingId,
        sha256Secret(input.secret),
        input.secret.slice(0, 24),
        JSON.stringify([
          "action.manifest.write",
          "action.heartbeat.write",
          "action.poll",
          "action.event.write",
          "environment.event.write",
          "action.result.write",
          "action.control.poll",
          "action.control.write",
        ]),
        expiresAt,
      ],
    );
    return connectorConfig({
      authority,
      connectorInstallationId: installationId,
      publicBaseUrl: input.publicBaseUrl,
      secret: input.secret,
      expiresAt,
    });
  });

export const issueEnvironmentActionConnectorCredential = async (input: {
  roomId: string;
  ownerProfileId: string;
  actionAuthorityId: string;
  publicBaseUrl: string;
  ttlMs?: number | null;
}): Promise<HelixEnvironmentActionConnectorConfig> =>
  issueCredentialWithSecret({
    ...input,
    secret: `helix_env_action_${crypto.randomBytes(32).toString("base64url")}`,
  });

export const issueEnvironmentActionConnectorCredentialForPairing =
  async (input: {
    roomId: string;
    ownerProfileId: string;
    actionAuthorityId: string;
    publicBaseUrl: string;
    pairingId: string;
    connectorInstallationId: string;
    trustedCredentialSecret: string;
    ttlMs?: number | null;
  }): Promise<HelixEnvironmentActionConnectorConfig> =>
    issueCredentialWithSecret({
      ...input,
      secret: input.trustedCredentialSecret,
      bootstrapPairingId: input.pairingId,
    });

const latestManifest = async (
  db: Queryable,
  authorityId: string,
): Promise<ManifestRow | null> => {
  const result = await db.query<ManifestRow>(
    `SELECT * FROM helix_environment_action_connector_manifests
     WHERE action_authority_id = $1 AND status = 'active'
       AND (expires_at IS NULL OR expires_at > now())
     ORDER BY received_at DESC LIMIT 1;`,
    [authorityId],
  );
  return result.rows[0] ?? null;
};

export const renewEnvironmentActionAdmissionLease = async (input: {
  db: Queryable;
  catalogSnapshotId: string;
  manifestId: string;
  leaseExpiresAt: string;
}): Promise<void> => {
  await input.db.query(
    `UPDATE helix_environment_capability_catalog_snapshots
     SET frozen_at = now(), expires_at = $2
     WHERE catalog_snapshot_id = $1;`,
    [input.catalogSnapshotId, input.leaseExpiresAt],
  );
  await input.db.query(
    `UPDATE helix_environment_action_connector_manifests
     SET received_at = now(), expires_at = $2
     WHERE manifest_id = $1 AND status = 'active';`,
    [input.manifestId, input.leaseExpiresAt],
  );
};

export const assertEnvironmentActionCatalogAvailable = async (input: {
  db: Queryable;
  environmentBindingId: string;
  adapterProfileId: string;
  manifestHash: string;
}): Promise<string> => {
  const catalog = await input.db.query<{ catalog_snapshot_id: string }>(
    `SELECT catalog_snapshot_id
     FROM helix_environment_capability_catalog_snapshots
     WHERE environment_binding_id = $1 AND adapter_profile_id = $2
       AND manifest_hash = $3
       AND (expires_at IS NULL OR expires_at > now())
     ORDER BY frozen_at DESC LIMIT 1;`,
    [input.environmentBindingId, input.adapterProfileId, input.manifestHash],
  );
  if (!catalog.rows[0]) {
    throw new EnvironmentActionBrokerError(
      "action_manifest_required",
      409,
      "The live player-action catalog is unavailable for this manifest.",
    );
  }
  return catalog.rows[0].catalog_snapshot_id;
};

const validateManifestIdentity = (
  claim: EnvironmentActionConnectorClaim,
  manifest: HelixEnvironmentActionConnectorManifest,
): void => {
  if (
    manifest.action_authority_id !== claim.authorityId ||
    manifest.connector_installation_id !== claim.connectorInstallationId ||
    manifest.environment_binding_id !== claim.environmentBindingId ||
    manifest.room_id !== claim.roomId ||
    manifest.source_id !== claim.sourceId ||
    manifest.world_id !== claim.worldId ||
    manifest.participant_id !== claim.participantId ||
    manifest.subject_binding_id !== claim.subjectBindingId ||
    manifest.subject_native_id !== claim.subjectNativeId ||
    manifest.adapter_profile_id !== claim.actionAdapterProfileId ||
    manifest.domain_adapter !== claim.actionDomainAdapter
  ) {
    throw new EnvironmentActionBrokerError(
      "action_manifest_invalid",
      403,
      "The player-action manifest belongs to a different room, world, player, or credential installation.",
    );
  }
};

type RegisteredActionCapability = {
  capability_id: string;
  capability_version: number;
  action_kind: string;
  effect_class: string;
  workflow_modes: readonly string[];
  allowed_control_engines: readonly string[];
};

export const resolveEnvironmentActionManifestCapabilityIntersection = (input: {
  manifestCapabilities: HelixEnvironmentActionConnectorManifest["capabilities"];
  registeredCapabilities: readonly RegisteredActionCapability[];
  allowedCapabilityIds: ReadonlySet<string>;
}): HelixEnvironmentActionConnectorManifest["capabilities"] => {
  const registered = new Map(
    input.registeredCapabilities.map((capability) => [
      `${capability.capability_id}@${capability.capability_version}`,
      capability,
    ]),
  );
  const admitted: HelixEnvironmentActionConnectorManifest["capabilities"] = [];
  for (const capability of input.manifestCapabilities) {
    const trusted = registered.get(
      `${capability.capability_id}@${capability.capability_version}`,
    );
    if (
      !trusted ||
      trusted.action_kind !== capability.action_kind ||
      trusted.effect_class !== capability.effect_class ||
      capability.workflow_modes.some(
        (mode) => !trusted.workflow_modes.includes(mode),
      ) ||
      capability.control_engines.some(
        (engine) => !trusted.allowed_control_engines.includes(engine),
      )
    ) {
      throw new EnvironmentActionBrokerError(
        "action_manifest_invalid",
        403,
        "The connector claimed a capability outside the registered adapter contract.",
      );
    }
    if (input.allowedCapabilityIds.has(capability.capability_id)) {
      admitted.push(capability);
    }
  }
  if (admitted.length === 0) {
    throw new EnvironmentActionBrokerError(
      "action_manifest_invalid",
      403,
      "The connector manifest has no capability in the owner-approved intersection.",
    );
  }
  return admitted;
};

export const recordEnvironmentActionConnectorManifest = async (input: {
  claim: EnvironmentActionConnectorClaim;
  manifest: unknown;
}): Promise<{
  manifestId: string;
  catalogSnapshotId: string;
  manifestHash: string;
  replayed: boolean;
}> => {
  const parsed = helixEnvironmentActionConnectorManifestSchema.safeParse(
    input.manifest,
  );
  if (!parsed.success) {
    throw new EnvironmentActionBrokerError(
      "action_manifest_invalid",
      400,
      "The player-action connector manifest is invalid.",
    );
  }
  const manifest = parsed.data;
  validateManifestIdentity(input.claim, manifest);
  const registry = resolveEnvironmentActionAdapterProfile({
    domainAdapter: manifest.domain_adapter,
    worldId: manifest.world_id,
    sourceAdapterProfileId: input.claim.sourceAdapterProfileId,
  });
  if (registry.profile.profile_id !== manifest.adapter_profile_id) {
    throw new EnvironmentActionBrokerError(
      "action_manifest_invalid",
      403,
      "The manifest action profile does not match the registered adapter.",
    );
  }
  const db = await readSharedRealtimeRoomDatabase();
  const authority = assertAuthorityUsable(
    await readAuthorityConnectorRow(db, input.claim.authorityId),
  );
  const allowed = new Set(parseStringArray(authority.allowed_capability_ids));
  const admittedCapabilities =
    resolveEnvironmentActionManifestCapabilityIntersection({
      manifestCapabilities: manifest.capabilities,
      registeredCapabilities: registry.profile.capabilities,
      allowedCapabilityIds: allowed,
    });
  const submittedManifestHash = environmentConnectorSha256(manifest);
  const existing = await db.query<ExistingManifestReplayRow>(
    `SELECT * FROM helix_environment_action_connector_manifests
     WHERE manifest_id = $1 LIMIT 1;`,
    [manifest.manifest_id],
  );
  if (
    existing.rows[0] &&
    !environmentActionManifestReplayCompatible({
      existing: existing.rows[0],
      manifest,
    })
  ) {
    throw new EnvironmentActionBrokerError(
      "action_manifest_invalid",
      409,
      existing.rows[0].status === "active"
        ? "The stable player-action manifest identity changed its declared contract. Publish a fresh producer epoch."
        : "The player-action manifest producer epoch has already been superseded.",
    );
  }
  // `created_at` is a delivery timestamp and changes on an authenticated
  // re-publication. Preserve the originally admitted content hash after the
  // stable manifest identity and every contract-bearing field match above.
  const manifestHash = existing.rows[0]?.manifest_hash ?? submittedManifestHash;
  const descriptors = listEnvironmentConnectorCapabilityDescriptors({
    adapterProfileId: registry.profile.profile_id,
  }).filter((descriptor) =>
    admittedCapabilities.some(
      (capability) =>
        capability.capability_id === descriptor.capability_id &&
        capability.capability_version === descriptor.capability_version,
    ),
  );
  if (descriptors.length !== admittedCapabilities.length) {
    throw new EnvironmentActionBrokerError(
      "action_manifest_invalid",
      409,
      "The server-owned action descriptor catalog is incomplete for this manifest.",
    );
  }
  const catalogHash = environmentConnectorSha256({
    adapter_contract_hash: registry.contract_hash,
    manifest_hash: manifestHash,
    capability_descriptors: descriptors,
  });
  const catalogExisting = await db.query<{ catalog_snapshot_id: string }>(
    `SELECT catalog_snapshot_id
     FROM helix_environment_capability_catalog_snapshots
     WHERE environment_binding_id = $1 AND catalog_hash = $2 LIMIT 1;`,
    [input.claim.environmentBindingId, catalogHash],
  );
  const catalogSnapshotId =
    catalogExisting.rows[0]?.catalog_snapshot_id ??
    `environment_catalog:${crypto.randomUUID()}`;
  const leaseExpiresAt = new Date(
    Date.now() + registry.profile.freshness.manifest_max_age_ms,
  ).toISOString();
  if (catalogExisting.rows[0] && existing.rows[0]) {
    // A connector can remain alive while the keyed API is restarted. Its
    // immutable manifest and catalog hashes are still valid, but their
    // freshness leases may have expired while the server was unavailable.
    // Re-admitting the exact authenticated manifest renews only the temporal
    // lease; identity, capability intersection, descriptors, and hashes have
    // all been revalidated above.
    await renewEnvironmentActionAdmissionLease({
      db,
      catalogSnapshotId,
      manifestId: existing.rows[0].manifest_id,
      leaseExpiresAt,
    });
    return {
      manifestId: existing.rows[0].manifest_id,
      catalogSnapshotId,
      manifestHash,
      replayed: true,
    };
  }
  if (!catalogExisting.rows[0]) {
    await db.query(
      `INSERT INTO helix_environment_capability_catalog_snapshots (
         catalog_snapshot_id, environment_binding_id, catalog_hash,
         adapter_profile_id, adapter_profile_version, adapter_contract_hash,
         manifest_hash, capability_descriptors, frozen_at, expires_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, now(), $9);`,
      [
        catalogSnapshotId,
        input.claim.environmentBindingId,
        catalogHash,
        registry.profile.profile_id,
        registry.profile.profile_version,
        registry.contract_hash,
        manifestHash,
        JSON.stringify(descriptors),
        leaseExpiresAt,
      ],
    );
  }
  if (existing.rows[0]) {
    await renewEnvironmentActionAdmissionLease({
      db,
      catalogSnapshotId,
      manifestId: existing.rows[0].manifest_id,
      leaseExpiresAt,
    });
    return {
      manifestId: existing.rows[0].manifest_id,
      catalogSnapshotId,
      manifestHash,
      replayed: true,
    };
  }
  await withSharedRealtimeRoomTransaction(async (tx) => {
    await tx.query(
      `UPDATE helix_environment_action_connector_manifests
       SET status = 'superseded'
       WHERE action_authority_id = $1 AND status = 'active';`,
      [input.claim.authorityId],
    );
    await tx.query(
      `INSERT INTO helix_environment_action_connector_manifests (
         manifest_id, action_authority_id, environment_binding_id,
         connector_installation_id, producer_epoch_ref, room_id, source_id,
         world_id, participant_id, subject_binding_id, subject_native_id,
         domain, domain_adapter, adapter_profile_id, adapter_version,
         protocol_version, manifest_hash, capabilities,
         available_control_engines, safety_policy, received_at, expires_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
         $14, $15, $16, $17, $18::jsonb, $19::jsonb, $20::jsonb, now(), $21
       );`,
      [
        manifest.manifest_id,
        input.claim.authorityId,
        input.claim.environmentBindingId,
        manifest.connector_installation_id,
        manifest.producer_epoch_ref,
        manifest.room_id,
        manifest.source_id,
        manifest.world_id,
        manifest.participant_id,
        manifest.subject_binding_id,
        manifest.subject_native_id,
        manifest.domain,
        manifest.domain_adapter,
        manifest.adapter_profile_id,
        manifest.adapter_version,
        manifest.protocol_version,
        manifestHash,
        JSON.stringify(manifest.capabilities),
        JSON.stringify(manifest.available_control_engines),
        JSON.stringify(manifest.safety_policy),
        leaseExpiresAt,
      ],
    );
  });
  return {
    manifestId: manifest.manifest_id,
    catalogSnapshotId,
    manifestHash,
    replayed: false,
  };
};

export const recordEnvironmentActionConnectorHeartbeat = async (input: {
  claim: EnvironmentActionConnectorClaim;
  heartbeat: unknown;
}): Promise<{ heartbeatId: string; replayed: boolean }> => {
  const parsed = helixEnvironmentActionConnectorHeartbeatSchema.safeParse(
    input.heartbeat,
  );
  if (!parsed.success) {
    throw new EnvironmentActionBrokerError(
      "action_heartbeat_invalid",
      400,
      "The player-action connector heartbeat is invalid.",
    );
  }
  const heartbeat = parsed.data;
  const db = await readSharedRealtimeRoomDatabase();
  const manifest = await latestManifest(db, input.claim.authorityId);
  if (
    !manifest ||
    heartbeat.manifest_id !== manifest.manifest_id ||
    heartbeat.connector_installation_id !==
      input.claim.connectorInstallationId ||
    heartbeat.producer_epoch_ref !== manifest.producer_epoch_ref ||
    heartbeat.action_authority_id !== input.claim.authorityId ||
    heartbeat.environment_binding_id !== input.claim.environmentBindingId ||
    heartbeat.room_id !== input.claim.roomId ||
    heartbeat.source_id !== input.claim.sourceId ||
    heartbeat.world_id !== input.claim.worldId ||
    heartbeat.participant_id !== input.claim.participantId ||
    heartbeat.subject_binding_id !== input.claim.subjectBindingId
  ) {
    throw new EnvironmentActionBrokerError(
      "action_heartbeat_invalid",
      403,
      "The heartbeat does not match the current paired manifest identity.",
    );
  }
  await assertEnvironmentActionCatalogAvailable({
    db,
    environmentBindingId: input.claim.environmentBindingId,
    adapterProfileId: input.claim.actionAdapterProfileId,
    manifestHash: manifest.manifest_hash,
  });
  const latestStoredEvent = await db.query<{ sequence: number | string }>(
    `SELECT sequence
     FROM helix_environment_events
     WHERE environment_binding_id = $1 AND producer_epoch_ref = $2
     ORDER BY sequence DESC LIMIT 1;`,
    [input.claim.environmentBindingId, heartbeat.producer_epoch_ref],
  );
  const serverLatestEventSequence = latestStoredEvent.rows[0]
    ? Number(latestStoredEvent.rows[0].sequence)
    : null;
  if (
    !environmentActionEventCursorMatches(
      heartbeat.latest_event_sequence,
      serverLatestEventSequence,
    )
  ) {
    throw new EnvironmentActionBrokerError(
      "action_event_stream_resync_required",
      409,
      "The connector and server evidence cursors differ. Publish a fresh producer epoch before polling another action.",
    );
  }
  const hash = environmentConnectorSha256(heartbeat);
  const existing = await db.query<{ heartbeat_id: string }>(
    `SELECT heartbeat_id FROM helix_environment_action_connector_heartbeats
     WHERE heartbeat_id = $1 LIMIT 1;`,
    [heartbeat.heartbeat_id],
  );
  if (existing.rows[0]) {
    return { heartbeatId: existing.rows[0].heartbeat_id, replayed: true };
  }
  await db.query(
    `INSERT INTO helix_environment_action_connector_heartbeats (
       heartbeat_id, manifest_id, action_authority_id,
       connector_installation_id, producer_epoch_ref, status,
       active_workflow_ids, controls_asserted, manual_input_detected,
       emergency_stop_latched, control_engines, latest_event_sequence,
       payload_hash, created_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10,
       $11::jsonb, $12, $13, $14
     );`,
    [
      heartbeat.heartbeat_id,
      heartbeat.manifest_id,
      input.claim.authorityId,
      heartbeat.connector_installation_id,
      heartbeat.producer_epoch_ref,
      heartbeat.status,
      JSON.stringify(heartbeat.active_workflow_ids),
      heartbeat.controls_asserted,
      heartbeat.manual_input_detected,
      heartbeat.emergency_stop_latched,
      JSON.stringify(heartbeat.control_engines),
      heartbeat.latest_event_sequence,
      hash,
      heartbeat.created_at,
    ],
  );
  return { heartbeatId: heartbeat.heartbeat_id, replayed: false };
};

const assertFreshConnector = async (
  db: Queryable,
  claim: EnvironmentActionConnectorClaim,
): Promise<ManifestRow> => {
  const manifest = await latestManifest(db, claim.authorityId);
  if (!manifest) {
    throw new EnvironmentActionBrokerError(
      "action_manifest_required",
      409,
      "The player-action connector has not published a current manifest.",
    );
  }
  const registry = resolveEnvironmentActionAdapterProfile({
    domainAdapter: claim.actionDomainAdapter,
    worldId: claim.worldId,
    sourceAdapterProfileId: claim.sourceAdapterProfileId,
  });
  const heartbeat = await db.query<{
    status: string;
    received_at: Date | string;
    emergency_stop_latched: boolean;
    control_engines: unknown;
  }>(
    `SELECT status, received_at, emergency_stop_latched, control_engines
     FROM helix_environment_action_connector_heartbeats
     WHERE action_authority_id = $1 AND manifest_id = $2
     ORDER BY received_at DESC LIMIT 1;`,
    [claim.authorityId, manifest.manifest_id],
  );
  const row = heartbeat.rows[0];
  const controlEngines = parseJson<Array<Record<string, unknown>>>(
    row?.control_engines,
    [],
  );
  const eventStreamResyncRequired = controlEngines.some(
    (engine) =>
      engine?.last_error ===
      "action_delivery_environment_event_batch_http_409_action_event_conflict",
  );
  if (eventStreamResyncRequired) {
    throw new EnvironmentActionBrokerError(
      "action_event_stream_resync_required",
      409,
      "The player client released controls because its evidence stream no longer matches the server epoch. Publish a fresh producer epoch before requesting another action.",
    );
  }
  if (
    !row ||
    row.status !== "active" ||
    row.emergency_stop_latched ||
    Date.now() - Date.parse(iso(row.received_at)) >
      registry.profile.freshness.heartbeat_max_age_ms
  ) {
    throw new EnvironmentActionBrokerError(
      "action_connector_stale",
      409,
      "The player-action connector does not have a fresh active heartbeat.",
    );
  }
  return manifest;
};

const requestProjection = (
  row: ActionRequestRow,
): HelixEnvironmentActionRequest => {
  const parsed = helixEnvironmentActionRequestSchema.safeParse(
    parseJson(row.request_payload, null),
  );
  if (!parsed.success) {
    throw new EnvironmentActionBrokerError(
      "action_request_invalid",
      500,
      "A durable player-action request failed contract validation.",
    );
  }
  return parsed.data;
};

const requiredPostconditionsVerified = (input: {
  request: HelixEnvironmentActionRequest;
  result: HelixEnvironmentActionResult;
}): boolean => {
  const required = input.request.postconditions.filter(
    (condition) => condition.required,
  );
  const byId = new Map<
    string,
    HelixEnvironmentActionResult["postconditions"][number]
  >();
  for (const condition of input.result.postconditions) {
    if (byId.has(condition.condition_id)) return false;
    byId.set(condition.condition_id, condition);
  }
  const startedAt = input.result.started_at
    ? Date.parse(input.result.started_at)
    : Number.NaN;
  const completedAt = Date.parse(input.result.completed_at);
  return required.every((expected) => {
    const observed = byId.get(expected.condition_id);
    if (
      !observed ||
      observed.condition_kind !== expected.condition_kind ||
      !observed.required ||
      observed.status !== "satisfied" ||
      observed.evidence_refs.length === 0
    ) {
      return false;
    }
    const checkedAt = Date.parse(observed.checked_at);
    return (
      Number.isFinite(startedAt) &&
      Number.isFinite(completedAt) &&
      Number.isFinite(checkedAt) &&
      checkedAt >= startedAt &&
      checkedAt <= completedAt
    );
  });
};

const finiteMeasurement = (
  measurements: Record<string, unknown>,
  key: string,
): number | null => {
  const value = measurements[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const finiteArgument = (
  argumentsRecord: Record<string, unknown>,
  key: string,
): number | null => {
  const value = argumentsRecord[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const stringMeasurementMatches = (
  measurements: Record<string, unknown>,
  measurementKey: string,
  argumentsRecord: Record<string, unknown>,
  argumentKey: string,
): boolean => {
  const measurement = measurements[measurementKey];
  const argument = argumentsRecord[argumentKey];
  return (
    typeof measurement === "string" &&
    typeof argument === "string" &&
    measurement === argument
  );
};

const wholeNonnegative = (value: number | null): value is number =>
  value !== null && Number.isInteger(value) && value >= 0;

const recordMeasurement = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const blockPositionKey = (value: unknown): string | null => {
  const position = recordMeasurement(value);
  if (!position) return null;
  const x = finiteMeasurement(position, "x");
  const y = finiteMeasurement(position, "y");
  const z = finiteMeasurement(position, "z");
  return x !== null &&
    y !== null &&
    z !== null &&
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    Number.isInteger(z)
    ? `${x}:${y}:${z}`
    : null;
};

type PredictedCollisionPlacementBinding = {
  binding_kind: "predicted_collision_cell";
  horizon_ticks: number;
  max_distance_blocks: number;
  require_replaceable: true;
};

const predictedCollisionPlacementBinding = (
  value: unknown,
): PredictedCollisionPlacementBinding | null => {
  const binding = recordMeasurement(value);
  const horizon = binding ? finiteMeasurement(binding, "horizon_ticks") : null;
  const maximumDistance = binding
    ? finiteMeasurement(binding, "max_distance_blocks")
    : null;
  return binding?.binding_kind === "predicted_collision_cell" &&
    wholeNonnegative(horizon) &&
    horizon >= 1 &&
    horizon <= 20 &&
    maximumDistance !== null &&
    maximumDistance > 0 &&
    maximumDistance <= 6 &&
    binding.require_replaceable === true
    ? {
        binding_kind: "predicted_collision_cell",
        horizon_ticks: horizon,
        max_distance_blocks: maximumDistance,
        require_replaceable: true,
      }
    : null;
};

const positionInsideRegion = (position: unknown, region: unknown): boolean => {
  const target = recordMeasurement(position);
  const admitted = recordMeasurement(region);
  const minimum = recordMeasurement(admitted?.min);
  const maximum = recordMeasurement(admitted?.max);
  if (!target || !minimum || !maximum) return false;
  return (["x", "y", "z"] as const).every((axis) => {
    const value = finiteMeasurement(target, axis);
    const low = finiteMeasurement(minimum, axis);
    const high = finiteMeasurement(maximum, axis);
    return (
      value !== null &&
      low !== null &&
      high !== null &&
      Number.isInteger(value) &&
      Number.isInteger(low) &&
      Number.isInteger(high) &&
      value >= low &&
      value <= high
    );
  });
};

const predictedCollisionBindingValid = (input: {
  prediction: Record<string, unknown>;
  binding: PredictedCollisionPlacementBinding;
  allowedRegions: readonly unknown[];
}): boolean => {
  const actor = recordMeasurement(
    input.prediction.actor_position_at_resolution,
  );
  const target = recordMeasurement(input.prediction.target_position);
  const collisionTick = finiteMeasurement(
    input.prediction,
    "first_collision_tick",
  );
  if (
    !actor ||
    !target ||
    !wholeNonnegative(collisionTick) ||
    collisionTick < 1
  ) {
    return false;
  }
  const coordinates = (["x", "y", "z"] as const).map((axis) => ({
    actor: finiteMeasurement(actor, axis),
    target: finiteMeasurement(target, axis),
  }));
  if (
    coordinates.some(({ actor, target }) => actor === null || target === null)
  ) {
    return false;
  }
  const distance = Math.sqrt(
    coordinates.reduce(
      (sum, pair) =>
        sum + ((pair.target as number) - (pair.actor as number)) ** 2,
      0,
    ),
  );
  return (
    input.prediction.position_binding_kind === input.binding.binding_kind &&
    input.prediction.require_replaceable === true &&
    finiteMeasurement(input.prediction, "horizon_ticks") ===
      input.binding.horizon_ticks &&
    collisionTick <= input.binding.horizon_ticks &&
    distance <= input.binding.max_distance_blocks + 1e-6 &&
    (input.allowedRegions.length === 0 ||
      input.allowedRegions.some((region) =>
        positionInsideRegion(input.prediction.target_position, region),
      ))
  );
};

const placementPredictionValid = (input: {
  candidate: unknown;
  admittedPositionKeys: ReadonlySet<string>;
  admittedBindings?: readonly PredictedCollisionPlacementBinding[];
  allowedRegions?: readonly unknown[];
}): boolean => {
  const prediction = recordMeasurement(input.candidate);
  if (!prediction) return false;
  const horizon = finiteMeasurement(prediction, "horizon_ticks");
  const supportCount = finiteMeasurement(prediction, "support_candidate_count");
  const firstReachable = finiteMeasurement(prediction, "first_reachable_tick");
  const initialDistance = finiteMeasurement(prediction, "initial_distance");
  const minimumDistance = finiteMeasurement(
    prediction,
    "minimum_predicted_distance",
  );
  const targetKey = blockPositionKey(prediction.target_position);
  const exactTargetAdmitted =
    targetKey !== null && input.admittedPositionKeys.has(targetKey);
  const boundTargetAdmitted = (input.admittedBindings ?? []).some((binding) =>
    predictedCollisionBindingValid({
      prediction,
      binding,
      allowedRegions: input.allowedRegions ?? [],
    }),
  );
  return (
    prediction.model_schema === "helix.minecraft.short_horizon_trajectory.v1" &&
    prediction.applicable === true &&
    typeof prediction.reason === "string" &&
    prediction.reason.length > 0 &&
    prediction.predicted_reachable === true &&
    wholeNonnegative(horizon) &&
    horizon >= 1 &&
    horizon <= 20 &&
    wholeNonnegative(supportCount) &&
    supportCount >= 1 &&
    supportCount <= 6 &&
    wholeNonnegative(firstReachable) &&
    firstReachable <= horizon &&
    initialDistance !== null &&
    initialDistance >= 0 &&
    minimumDistance !== null &&
    minimumDistance >= 0 &&
    minimumDistance <= initialDistance + 1e-6 &&
    (exactTargetAdmitted || boundTargetAdmitted)
  );
};

const sequenceConditionObservationsValid = (input: {
  sequence: HelixMinecraftFluidSequenceArguments;
  measurements: Record<string, unknown>;
}): boolean => {
  const raw = input.measurements.condition_observations;
  const declaredCount = finiteMeasurement(
    input.measurements,
    "condition_observation_count",
  );
  if (
    !Array.isArray(raw) ||
    !wholeNonnegative(declaredCount) ||
    raw.length !== declaredCount ||
    raw.length > HELIX_MINECRAFT_FLUID_CONDITION_OBSERVATION_LIMIT
  )
    return false;
  const conditionalNodes = new Map(
    input.sequence.nodes.flatMap((node) =>
      node.node_kind === "checkpoint" || node.node_kind === "branch"
        ? [[node.node_id, node] as const]
        : [],
    ),
  );
  const lastValues = new Map<string, boolean>();
  let previousTick = -1;
  for (const candidate of raw) {
    const parsed =
      helixMinecraftFluidConditionObservationSchema.safeParse(candidate);
    if (!parsed.success) return false;
    const observation = parsed.data;
    const node = conditionalNodes.get(observation.node_id);
    if (
      !node ||
      observation.condition_kind !== node.condition.condition_kind ||
      observation.tick_index < previousTick ||
      observation.tick_index > input.sequence.max_total_ticks ||
      lastValues.get(observation.node_id) === observation.satisfied
    )
      return false;
    previousTick = observation.tick_index;
    lastValues.set(observation.node_id, observation.satisfied);
  }
  return true;
};

const reactiveProgramMeasurementsValid = (input: {
  program: HelixMinecraftReactiveProgramArguments;
  measurements: Record<string, unknown>;
}): boolean => {
  const parsedObservation =
    helixMinecraftReactiveProgramObservationSchema.safeParse({
      program_schema: input.measurements.program_schema,
      program_id: input.measurements.program_id,
      tick_index: input.measurements.tick_index,
      active_lane_count: input.measurements.active_lane_count,
      lanes: input.measurements.lanes,
      condition_observations: input.measurements.condition_observations,
      resource_conflict_count: input.measurements.resource_conflict_count,
      interrupt_count: input.measurements.interrupt_count,
      controls_released: input.measurements.controls_released,
    });
  if (!parsedObservation.success) return false;
  const observation = parsedObservation.data;
  const maxConcurrentLaneCount = finiteMeasurement(
    input.measurements,
    "max_concurrent_lane_count",
  );
  const parallelTickCount = finiteMeasurement(
    input.measurements,
    "parallel_tick_count",
  );
  if (
    observation.program_id !== input.program.program_id ||
    observation.tick_index > input.program.max_total_ticks ||
    observation.controls_released !== true ||
    observation.active_lane_count !== 0 ||
    observation.lanes.length !== input.program.lanes.length ||
    observation.condition_observations.length !==
      finiteMeasurement(input.measurements, "condition_observation_count") ||
    !wholeNonnegative(maxConcurrentLaneCount) ||
    maxConcurrentLaneCount > input.program.lanes.length ||
    !wholeNonnegative(parallelTickCount) ||
    parallelTickCount > observation.tick_index + 1 ||
    (parallelTickCount > 0 && maxConcurrentLaneCount < 2)
  )
    return false;

  const admittedLanes = new Map(
    input.program.lanes.map((lane) => [lane.lane_id, lane] as const),
  );
  for (const lane of observation.lanes) {
    const admitted = admittedLanes.get(lane.lane_id);
    if (
      !admitted ||
      lane.lane_kind !== admitted.lane_kind ||
      lane.tick_index !== observation.tick_index ||
      lane.held_resources.length !== 0 ||
      lane.controls_released !== true
    )
      return false;
  }
  if (input.program.completion_policy.mode === "all_required") {
    const requiredLanes = input.program.lanes.filter((entry) => entry.required);
    const everyRequiredSucceeded = requiredLanes.every(
      (lane) =>
        observation.lanes.find((entry) => entry.lane_id === lane.lane_id)
          ?.state === "succeeded",
    );
    const settledInterruptId =
      typeof input.measurements.settled_interrupt_id === "string"
        ? input.measurements.settled_interrupt_id
        : null;
    const settledInterrupt = settledInterruptId
      ? input.program.interrupts.find(
          (interrupt) => interrupt.interrupt_id === settledInterruptId,
        )
      : null;
    const interruptTarget = settledInterrupt
      ? input.program.lanes.find(
          (lane) => lane.lane_id === settledInterrupt.activate_lane_id,
        )
      : null;
    const interruptTargetObservation = interruptTarget
      ? observation.lanes.find(
          (lane) => lane.lane_id === interruptTarget.lane_id,
        )
      : null;
    const interruptTargetNode = interruptTarget && interruptTargetObservation
      ? interruptTarget.nodes.find(
          (node) => node.node_id === interruptTargetObservation.node_id,
        )
      : null;
    const triggerObservation = settledInterrupt
      ? [...observation.condition_observations]
          .reverse()
          .find(
            (entry) => entry.node_id === settledInterrupt.interrupt_id,
          )
      : null;
    const triggerObserved = Boolean(
      settledInterrupt &&
        triggerObservation &&
        (settledInterrupt.trigger_when === "satisfied"
          ? triggerObservation.satisfied === true
          : triggerObservation.satisfied === false),
    );
    const interruptedRequiredLanes = settledInterrupt
      ? requiredLanes.filter((lane) =>
          settledInterrupt.cancel_lane_ids.includes(lane.lane_id),
        )
      : [];
    const handledInterruptValid = Boolean(
      settledInterrupt &&
        input.measurements.reason_code === "reactive_program_interrupted" &&
        observation.interrupt_count >= 1 &&
        triggerObserved &&
        interruptTarget?.activation === "interrupt_only" &&
        interruptTargetNode?.node_kind === "terminal" &&
        (interruptTargetNode?.terminal_outcome === "succeeded" ||
          interruptTargetNode?.terminal_outcome === "canceled") &&
        (interruptTargetObservation?.state === "succeeded" ||
          interruptTargetObservation?.state === "canceled") &&
        interruptedRequiredLanes.length >= 1 &&
        requiredLanes.every((lane) => {
          const state = observation.lanes.find(
            (entry) => entry.lane_id === lane.lane_id,
          )?.state;
          return (
            state === "succeeded" ||
            (state === "canceled" &&
              settledInterrupt.cancel_lane_ids.includes(lane.lane_id))
          );
        }),
    );
    if (!everyRequiredSucceeded && !handledInterruptValid) return false;
  } else if (!observation.lanes.some((lane) => lane.state === "succeeded")) {
    return false;
  }

  const conditionKindsByObservationId = new Map<string, string>();
  for (const lane of input.program.lanes) {
    for (const node of lane.nodes) {
      if (
        node.node_kind === "branch" ||
        node.node_kind === "event" ||
        node.node_kind === "checkpoint"
      ) {
        conditionKindsByObservationId.set(
          node.node_id,
          node.condition.condition_kind,
        );
      } else if (node.node_kind === "repeat" && node.until_condition) {
        conditionKindsByObservationId.set(
          node.node_id,
          node.until_condition.condition_kind,
        );
      } else if (node.node_kind === "maintain") {
        conditionKindsByObservationId.set(
          node.node_id,
          node.while_condition.condition_kind,
        );
      }
    }
  }
  for (const interrupt of input.program.interrupts) {
    conditionKindsByObservationId.set(
      interrupt.interrupt_id,
      interrupt.condition.condition_kind,
    );
  }
  if (
    !observation.condition_observations.every(
      (entry) =>
        conditionKindsByObservationId.get(entry.node_id) ===
        entry.condition_kind,
    )
  )
    return false;

  const raceOutcomes = input.measurements.race_outcomes;
  const raceOutcomeCount = finiteMeasurement(
    input.measurements,
    "race_outcome_count",
  );
  if (
    !Array.isArray(raceOutcomes) ||
    !wholeNonnegative(raceOutcomeCount) ||
    raceOutcomes.length !== raceOutcomeCount ||
    raceOutcomes.length > input.program.races.length
  )
    return false;
  const admittedRaces = new Map(
    input.program.races.map((race) => [race.race_id, race] as const),
  );
  const seenRaces = new Set<string>();
  for (const candidate of raceOutcomes) {
    const outcome = recordMeasurement(candidate);
    const raceId = outcome?.race_id;
    const winnerLaneId = outcome?.winner_lane_id;
    const settledTick = outcome
      ? finiteMeasurement(outcome, "settled_tick")
      : null;
    const canceledLaneIds = outcome?.canceled_lane_ids;
    const admitted =
      typeof raceId === "string" ? admittedRaces.get(raceId) : null;
    if (
      !outcome ||
      !admitted ||
      seenRaces.has(raceId as string) ||
      outcome.settle_on !== admitted.settle_on ||
      typeof winnerLaneId !== "string" ||
      !admitted.lane_ids.includes(winnerLaneId) ||
      !wholeNonnegative(settledTick) ||
      settledTick > observation.tick_index ||
      !Array.isArray(canceledLaneIds) ||
      canceledLaneIds.some(
        (laneId) =>
          typeof laneId !== "string" ||
          laneId === winnerLaneId ||
          !admitted.lane_ids.includes(laneId),
      )
    )
      return false;
    seenRaces.add(raceId as string);
  }

  const placementPredictions = input.measurements.placement_predictions;
  const placementPredictionCount = finiteMeasurement(
    input.measurements,
    "placement_prediction_count",
  );
  const placementActionSuccessCount = finiteMeasurement(
    input.measurements,
    "placement_action_success_count",
  );
  const placementMutationSuccessCount = finiteMeasurement(
    input.measurements,
    "placement_mutation_success_count",
  );
  if (
    !Array.isArray(placementPredictions) ||
    !wholeNonnegative(placementPredictionCount) ||
    !wholeNonnegative(placementActionSuccessCount) ||
    !wholeNonnegative(placementMutationSuccessCount) ||
    placementPredictions.length !== placementPredictionCount ||
    placementPredictionCount > placementActionSuccessCount ||
    placementPredictionCount < placementMutationSuccessCount ||
    placementMutationSuccessCount > placementActionSuccessCount ||
    placementPredictions.length > 256
  )
    return false;
  const placePositionsByLane = new Map<string, Set<string>>();
  const placeBindingsByLane = new Map<
    string,
    PredictedCollisionPlacementBinding[]
  >();
  for (const lane of input.program.lanes) {
    const positions = new Set<string>();
    const bindings: PredictedCollisionPlacementBinding[] = [];
    for (const node of lane.nodes) {
      if (
        (node.node_kind === "action" ||
          node.node_kind === "repeat" ||
          node.node_kind === "maintain") &&
        node.action.action_kind === "place"
      ) {
        for (const position of node.action.positions ?? []) {
          const key = blockPositionKey(position);
          if (key) positions.add(key);
        }
        const binding = predictedCollisionPlacementBinding(
          node.action.position_binding,
        );
        if (binding) bindings.push(binding);
      }
    }
    placePositionsByLane.set(lane.lane_id, positions);
    placeBindingsByLane.set(lane.lane_id, bindings);
  }
  return placementPredictions.every((candidate) => {
    const prediction = recordMeasurement(candidate);
    const laneId = prediction?.lane_id;
    return (
      prediction?.action_kind === "place" &&
      typeof laneId === "string" &&
      placementPredictionValid({
        candidate,
        admittedPositionKeys: placePositionsByLane.get(laneId) ?? new Set(),
        admittedBindings: placeBindingsByLane.get(laneId) ?? [],
        allowedRegions: input.program.mutation_scope.allowed_regions,
      })
    );
  });
};

/**
 * Domain proof over a connector's terminal measurements. This is policy-side
 * evidence validation only: it does not choose actions, retry them, or compose
 * an answer.
 */
export const environmentActionWorkflowMeasurementsValid = (input: {
  request: HelixEnvironmentActionRequest;
  result: HelixEnvironmentActionResult;
  measurements: Record<string, unknown>;
}): boolean => {
  if (input.result.outcome !== "succeeded") return true;
  const { request, result, measurements } = input;
  const args = request.arguments;
  const actionKind = request.action_kind;

  const motionKinds = new Set([
    "navigate_to",
    "look_at",
    "track_target",
    "walk",
    "jump",
    "follow",
    "collect",
    "mine",
    "place",
    "execute_sequence",
    "execute_reactive_program",
  ]);
  const interactionKinds = new Set([
    "interact",
    "attack",
    "mine",
    "place",
    "craft",
    "inventory_transfer",
    "execute_sequence",
    "execute_reactive_program",
  ]);
  const inventoryKinds = new Set([
    "hotbar_select",
    "equip",
    "collect",
    "mine",
    "place",
    "craft",
    "inventory_transfer",
    "execute_sequence",
    "execute_reactive_program",
  ]);
  const worldMutationKinds = new Set([
    "mine",
    "place",
    "execute_sequence",
    "execute_reactive_program",
  ]);
  if (
    (result.player_motion_performed && !motionKinds.has(actionKind)) ||
    (result.player_interaction_performed &&
      !interactionKinds.has(actionKind)) ||
    (result.inventory_mutation_performed && !inventoryKinds.has(actionKind)) ||
    (result.world_mutation_performed && !worldMutationKinds.has(actionKind)) ||
    result.side_effects_performed !==
      (result.player_motion_performed ||
        result.player_interaction_performed ||
        result.inventory_mutation_performed ||
        result.world_mutation_performed)
  )
    return false;

  const worldMutations = finiteMeasurement(
    measurements,
    "world_mutations_performed",
  );
  if (worldMutations !== null) {
    if (
      !wholeNonnegative(worldMutations) ||
      worldMutations > request.constraints.max_block_mutations ||
      result.world_mutation_performed !== worldMutations > 0
    )
      return false;
  }
  if (
    result.world_mutation_performed &&
    (!request.constraints.world_mutation_allowed ||
      request.constraints.max_block_mutations < 1)
  )
    return false;

  for (const key of [
    "collected_count",
    "produced_count",
    "transferred_count",
  ]) {
    const count = finiteMeasurement(measurements, key);
    if (
      count !== null &&
      (!wholeNonnegative(count) ||
        count > request.constraints.max_inventory_transfers ||
        (count > 0 && !result.inventory_mutation_performed))
    )
      return false;
  }

  switch (actionKind) {
    case "navigate_to": {
      const distance = finiteMeasurement(measurements, "distance_blocks");
      const admittedRadius = finiteArgument(args, "arrival_radius");
      const measuredRadius = finiteMeasurement(measurements, "arrival_radius");
      return (
        distance !== null &&
        admittedRadius !== null &&
        measuredRadius !== null &&
        Math.abs(measuredRadius - admittedRadius) <= 1e-6 &&
        distance <= admittedRadius + 1e-6
      );
    }
    case "look_at": {
      const target = args.target;
      if (!target || typeof target !== "object" || Array.isArray(target))
        return false;
      const targetRecord = target as Record<string, unknown>;
      const targetKind = targetRecord.target_kind;
      const finalYaw = finiteMeasurement(measurements, "final_yaw");
      const finalPitch = finiteMeasurement(measurements, "final_pitch");
      if (
        finalYaw === null ||
        finalPitch === null ||
        finalPitch < -90 ||
        finalPitch > 90
      ) {
        return false;
      }
      if (targetKind === "current_focus") {
        return (
          measurements.target_kind === "current_focus" &&
          measurements.view_retained === true
        );
      }
      const yawError = finiteMeasurement(measurements, "yaw_error_degrees");
      const pitchError = finiteMeasurement(measurements, "pitch_error_degrees");
      if (yawError === null || pitchError === null) return false;
      if (targetKind === "position") {
        return (
          measurements.target_kind === "position" &&
          yawError <= 2 &&
          pitchError <= 2
        );
      }
      if (targetKind !== "relative_rotation") return false;
      const requestedYaw = finiteArgument(targetRecord, "yaw_delta_degrees");
      const requestedPitch = finiteArgument(
        targetRecord,
        "pitch_delta_degrees",
      );
      const measuredRequestedYaw = finiteMeasurement(
        measurements,
        "requested_yaw_delta_degrees",
      );
      const measuredRequestedPitch = finiteMeasurement(
        measurements,
        "requested_pitch_delta_degrees",
      );
      const appliedYaw = finiteMeasurement(
        measurements,
        "applied_yaw_delta_degrees",
      );
      const appliedPitch = finiteMeasurement(
        measurements,
        "applied_pitch_delta_degrees",
      );
      const initialPitch = finiteMeasurement(measurements, "initial_pitch");
      if (
        requestedYaw === null ||
        requestedPitch === null ||
        measuredRequestedYaw === null ||
        measuredRequestedPitch === null ||
        appliedYaw === null ||
        appliedPitch === null ||
        initialPitch === null
      )
        return false;
      const expectedAppliedPitch =
        Math.max(-90, Math.min(90, initialPitch + requestedPitch)) -
        initialPitch;
      return (
        measurements.target_kind === "relative_rotation" &&
        Math.abs(measuredRequestedYaw - requestedYaw) <= 1e-6 &&
        Math.abs(measuredRequestedPitch - requestedPitch) <= 1e-6 &&
        Math.abs(appliedYaw - requestedYaw) <= 0.5 &&
        Math.abs(appliedPitch - expectedAppliedPitch) <= 0.5 &&
        yawError <= 0.5 &&
        pitchError <= 0.5
      );
    }
    case "track_target": {
      const target = args.target;
      if (!target || typeof target !== "object" || Array.isArray(target))
        return false;
      const targetRecord = target as Record<string, unknown>;
      const targetKind = targetRecord.target_kind;
      if (
        (targetKind !== "entity_type" &&
          targetKind !== "current_focus_entity" &&
          targetKind !== "particle_type") ||
        measurements.target_kind !== targetKind ||
        measurements.tracking_completed !== true
      )
        return false;
      if (
        targetKind === "entity_type" &&
        !stringMeasurementMatches(
          measurements,
          "target_entity_type_id",
          targetRecord,
          "entity_type_id",
        )
      )
        return false;
      if (
        targetKind === "particle_type" &&
        !stringMeasurementMatches(
          measurements,
          "target_particle_type_id",
          targetRecord,
          "particle_type_id",
        )
      )
        return false;
      if (targetKind === "particle_type") {
        const continuity = targetRecord.continuity;
        const handoffRadius = finiteArgument(targetRecord, "handoff_radius");
        const maxHandoffs = finiteArgument(targetRecord, "max_handoffs");
        const measuredHandoffs = finiteMeasurement(
          measurements,
          "particle_handoff_count",
        );
        const measuredMaxHandoffs = finiteMeasurement(
          measurements,
          "particle_max_handoffs",
        );
        if (
          (continuity !== "single_instance" &&
            continuity !== "same_type_stream") ||
          handoffRadius === null ||
          handoffRadius < 0 ||
          handoffRadius > 8 ||
          !wholeNonnegative(maxHandoffs) ||
          maxHandoffs > 1_000 ||
          !wholeNonnegative(measuredHandoffs) ||
          measuredHandoffs > maxHandoffs ||
          measuredMaxHandoffs !== maxHandoffs ||
          measurements.particle_continuity !== continuity ||
          (continuity === "single_instance" &&
            (handoffRadius !== 0 ||
              maxHandoffs !== 0 ||
              measuredHandoffs !== 0)) ||
          (continuity === "same_type_stream" &&
            (handoffRadius <= 0 || maxHandoffs < 1))
        )
          return false;
      }
      const targetRef = measurements.target_ref;
      if (
        typeof targetRef !== "string" ||
        !/^target:[a-f0-9]{32,64}$/.test(targetRef)
      )
        return false;
      const durationTicks = finiteMeasurement(measurements, "duration_ticks");
      const requestedDurationMs = finiteArgument(args, "max_duration_ms");
      const sampleCount = finiteMeasurement(measurements, "sample_count");
      const retainedTicks = finiteMeasurement(measurements, "retained_ticks");
      const targetLossTicks = finiteMeasurement(
        measurements,
        "target_loss_ticks",
      );
      const reacquisitions = finiteMeasurement(
        measurements,
        "reacquisition_count",
      );
      const meanError = finiteMeasurement(
        measurements,
        "mean_angular_error_degrees",
      );
      const p95Error = finiteMeasurement(
        measurements,
        "p95_angular_error_degrees",
      );
      const maxError = finiteMeasurement(
        measurements,
        "max_angular_error_degrees",
      );
      const finalYawError = finiteMeasurement(
        measurements,
        "final_yaw_error_degrees",
      );
      const finalPitchError = finiteMeasurement(
        measurements,
        "final_pitch_error_degrees",
      );
      const lineOfSightTicks = finiteMeasurement(
        measurements,
        "line_of_sight_retained_ticks",
      );
      if (
        requestedDurationMs === null ||
        !wholeNonnegative(durationTicks) ||
        durationTicks !== Math.ceil(requestedDurationMs / 50) ||
        !wholeNonnegative(sampleCount) ||
        sampleCount !== durationTicks ||
        !wholeNonnegative(retainedTicks) ||
        retainedTicks < 1 ||
        !wholeNonnegative(targetLossTicks) ||
        retainedTicks + targetLossTicks !== sampleCount ||
        !wholeNonnegative(reacquisitions) ||
        !wholeNonnegative(lineOfSightTicks) ||
        lineOfSightTicks > retainedTicks ||
        meanError === null ||
        p95Error === null ||
        maxError === null ||
        finalYawError === null ||
        finalPitchError === null ||
        meanError < 0 ||
        p95Error < 0 ||
        maxError < 0 ||
        finalYawError < 0 ||
        finalPitchError < 0 ||
        meanError > maxError + 1e-6 ||
        p95Error > maxError + 1e-6 ||
        maxError > 180 ||
        finalYawError > 180 ||
        finalPitchError > 180 ||
        measurements.line_of_sight_required !== args.require_line_of_sight
      )
        return false;
      return (
        args.require_line_of_sight !== true ||
        lineOfSightTicks === retainedTicks
      );
    }
    case "walk": {
      const distance = finiteMeasurement(measurements, "distance_blocks");
      return (
        distance !== null &&
        distance > 0 &&
        distance <= request.constraints.max_distance_blocks
      );
    }
    case "jump": {
      const confirmed = finiteMeasurement(measurements, "confirmed_jumps");
      const requested = finiteArgument(args, "count");
      return (
        wholeNonnegative(confirmed) &&
        wholeNonnegative(requested) &&
        confirmed >= requested
      );
    }
    case "interact":
      return (
        measurements.interaction_accepted === true &&
        stringMeasurementMatches(measurements, "target", args, "target") &&
        stringMeasurementMatches(measurements, "hand", args, "hand") &&
        stringMeasurementMatches(
          measurements,
          "interaction",
          args,
          "interaction",
        )
      );
    case "attack": {
      const pulses = finiteMeasurement(measurements, "attack_pulses");
      const transitions = finiteMeasurement(
        measurements,
        "confirmed_hurt_or_health_transitions",
      );
      return (
        measurements.target_defeated === true &&
        measurements.safety_interrupted === false &&
        measurements.friendly_fire === false &&
        measurements.target_classification === "hostile" &&
        stringMeasurementMatches(
          measurements,
          "target_ref",
          args,
          "target_ref",
        ) &&
        stringMeasurementMatches(
          measurements,
          "target_entity_type_id",
          args,
          "target_entity_type_id",
        ) &&
        wholeNonnegative(pulses) &&
        pulses >= 1 &&
        wholeNonnegative(transitions) &&
        transitions >= 1 &&
        finiteMeasurement(measurements, "rejected_attack_pulses") === 0
      );
    }
    case "hotbar_select":
      return (
        measurements.selection_matches === true &&
        finiteMeasurement(measurements, "selected_slot") ===
          finiteArgument(args, "slot")
      );
    case "equip":
      return (
        measurements.equipment_matches === true &&
        stringMeasurementMatches(measurements, "item_id", args, "item_id") &&
        stringMeasurementMatches(
          measurements,
          "destination",
          args,
          "destination",
        )
      );
    case "follow": {
      const durationTicks = finiteMeasurement(measurements, "duration_ticks");
      const durationMs = finiteArgument(args, "max_duration_ms");
      return (
        measurements.target_present === true &&
        wholeNonnegative(durationTicks) &&
        durationMs !== null &&
        durationTicks >= Math.ceil(durationMs / 50)
      );
    }
    case "collect": {
      const collected = finiteMeasurement(measurements, "collected_count");
      const requested = finiteArgument(args, "count");
      return (
        stringMeasurementMatches(
          measurements,
          "item_id",
          args,
          "item_or_block_id",
        ) &&
        wholeNonnegative(collected) &&
        wholeNonnegative(requested) &&
        collected >= requested
      );
    }
    case "mine": {
      const removed = finiteMeasurement(measurements, "removed_count");
      const requested = finiteArgument(args, "count");
      const requestedTarget = blockPositionKey(args.target_position);
      const measuredTarget = blockPositionKey(measurements.target_position);
      return (
        stringMeasurementMatches(measurements, "block_id", args, "block_id") &&
        (requestedTarget === null || requestedTarget === measuredTarget) &&
        wholeNonnegative(removed) &&
        wholeNonnegative(requested) &&
        wholeNonnegative(worldMutations) &&
        removed >= requested &&
        worldMutations >= requested
      );
    }
    case "place": {
      const verified = finiteMeasurement(measurements, "verified_positions");
      const binding = predictedCollisionPlacementBinding(args.position_binding);
      const requestedPositions = Array.isArray(args.positions)
        ? args.positions.length
        : binding
          ? 1
          : -1;
      const admittedPositionKeys = new Set(
        Array.isArray(args.positions)
          ? args.positions
              .map(blockPositionKey)
              .filter((key): key is string => key !== null)
          : [],
      );
      const predictionRequired =
        binding !== null &&
        wholeNonnegative(worldMutations) &&
        worldMutations > 0;
      const predictionValid = placementPredictionValid({
        candidate: measurements.placement_prediction,
        admittedPositionKeys,
        admittedBindings: binding ? [binding] : [],
      });
      return (
        stringMeasurementMatches(measurements, "block_id", args, "block_id") &&
        wholeNonnegative(verified) &&
        wholeNonnegative(worldMutations) &&
        requestedPositions > 0 &&
        (binding
          ? admittedPositionKeys.size === 0
          : admittedPositionKeys.size === requestedPositions) &&
        verified >= requestedPositions &&
        (!predictionRequired || predictionValid)
      );
    }
    case "craft": {
      const produced = finiteMeasurement(measurements, "produced_count");
      const requested = finiteArgument(args, "count");
      return (
        stringMeasurementMatches(
          measurements,
          "output_item_id",
          args,
          "output_item_id",
        ) &&
        wholeNonnegative(produced) &&
        wholeNonnegative(requested) &&
        produced >= requested
      );
    }
    case "inventory_transfer": {
      const transferred = finiteMeasurement(measurements, "transferred_count");
      const requested = finiteArgument(args, "count");
      return (
        stringMeasurementMatches(measurements, "item_id", args, "item_id") &&
        stringMeasurementMatches(
          measurements,
          "direction",
          args,
          "direction",
        ) &&
        wholeNonnegative(transferred) &&
        wholeNonnegative(requested) &&
        transferred >= requested
      );
    }
    case "execute_sequence": {
      const parsed = helixMinecraftFluidSequenceArgumentsSchema.safeParse(args);
      if (!parsed.success) return false;
      const executedNodes = finiteMeasurement(
        measurements,
        "executed_node_count",
      );
      const satisfiedCheckpoints = finiteMeasurement(
        measurements,
        "required_checkpoints_satisfied",
      );
      const measuredDuration = result.duration_ticks ?? null;
      return (
        measurements.sequence_completed === true &&
        stringMeasurementMatches(
          measurements,
          "sequence_id",
          args,
          "sequence_id",
        ) &&
        stringMeasurementMatches(measurements, "ruleset", args, "ruleset") &&
        wholeNonnegative(executedNodes) &&
        executedNodes > 0 &&
        wholeNonnegative(satisfiedCheckpoints) &&
        satisfiedCheckpoints >= parsed.data.required_checkpoint_ids.length &&
        sequenceConditionObservationsValid({
          sequence: parsed.data,
          measurements,
        }) &&
        wholeNonnegative(measuredDuration) &&
        measuredDuration <= parsed.data.max_total_ticks
      );
    }
    case "execute_reactive_program": {
      const parsed =
        helixMinecraftReactiveProgramArgumentsSchema.safeParse(args);
      if (!parsed.success) return false;
      const executedActions = finiteMeasurement(
        measurements,
        "executed_action_count",
      );
      const measuredDuration = result.duration_ticks ?? null;
      return (
        measurements.reactive_program_completed === true &&
        stringMeasurementMatches(
          measurements,
          "program_id",
          args,
          "program_id",
        ) &&
        wholeNonnegative(executedActions) &&
        reactiveProgramMeasurementsValid({
          program: parsed.data,
          measurements,
        }) &&
        wholeNonnegative(measuredDuration) &&
        measuredDuration <= parsed.data.max_total_ticks
      );
    }
    case "arm_viability_guardian": {
      const parsed =
        helixMinecraftArmViabilityGuardianArgumentsSchema.safeParse(args);
      if (!parsed.success) return false;
      const measuredDuration = finiteMeasurement(
        measurements,
        "guardian_duration_ticks",
      );
      return (
        measurements.guardian_armed === true &&
        stringMeasurementMatches(
          measurements,
          "guardian_profile_id",
          args,
          "profile_id",
        ) &&
        wholeNonnegative(measuredDuration) &&
        measuredDuration === parsed.data.duration_ticks &&
        measurements.controls_released === true
      );
    }
    case "disarm_viability_guardian": {
      const parsed =
        helixMinecraftDisarmViabilityGuardianArgumentsSchema.safeParse(args);
      return (
        parsed.success &&
        measurements.guardian_armed === false &&
        stringMeasurementMatches(
          measurements,
          "guardian_profile_id",
          args,
          "profile_id",
        ) &&
        measurements.controls_released === true
      );
    }
    default:
      return false;
  }
};

export const canonicalizeEnvironmentActionResult = (input: {
  request: HelixEnvironmentActionRequest;
  result: HelixEnvironmentActionResult;
  identityValid: boolean;
  envelopeValid: boolean;
  currentTurn: boolean;
  workflowEvidenceValid: boolean;
  verifiedTerminalMeasurements?: Record<string, unknown>;
}): HelixEnvironmentActionResult => {
  let outcome: HelixEnvironmentActionOutcome = input.result.outcome;
  let summary = input.result.summary;
  if (!input.identityValid) {
    outcome = "authority_stale";
    summary =
      "The player-action result no longer matches the admitted room, player, world, authority, or connector manifest.";
  } else if (!input.envelopeValid) {
    outcome = "capability_version_changed";
    summary =
      "The player-action result does not match the admitted capability identity, version, or action kind.";
  } else if (!input.currentTurn && input.result.outcome === "succeeded") {
    outcome = "action_outcome_unknown";
    summary =
      "The connector reported success after current-turn eligibility expired; the late result remains provenance but cannot prove the original turn succeeded.";
  } else if (
    input.result.outcome === "succeeded" &&
    !input.workflowEvidenceValid
  ) {
    outcome = "postcondition_failed";
    summary =
      "The connector reported success, but the matching terminal workflow event and its current execution-window measurements were not recorded consistently.";
  } else if (
    input.result.outcome === "succeeded" &&
    !requiredPostconditionsVerified({
      request: input.request,
      result: input.result,
    })
  ) {
    outcome = "postcondition_failed";
    summary =
      "The connector reported success, but its terminal measurements did not prove every required action postcondition.";
  }
  return helixEnvironmentActionResultSchema.parse({
    ...input.result,
    outcome,
    summary,
    verified_terminal_measurements: input.verifiedTerminalMeasurements ?? {},
  });
};

export const readRecordedWorkflowEvidence = async (input: {
  db: Queryable;
  request: HelixEnvironmentActionRequest;
  result: HelixEnvironmentActionResult;
}): Promise<{
  valid: boolean;
  terminalMeasurements: Record<string, unknown>;
}> => {
  const expectedTerminal = (() => {
    switch (input.result.outcome) {
      case "succeeded":
        return { eventType: "workflow.succeeded", state: "succeeded" } as const;
      case "failed":
        return { eventType: "workflow.failed", state: "failed" } as const;
      case "workflow_timeout":
        return { eventType: "workflow.timed_out", state: "timed_out" } as const;
      case "request_canceled":
      case "manual_override":
        return { eventType: "workflow.canceled", state: "canceled" } as const;
      case "emergency_stopped":
        return {
          eventType: "workflow.emergency_stopped",
          state: "emergency_stopped",
        } as const;
      default:
        return null;
    }
  })();
  if (!expectedTerminal) return { valid: true, terminalMeasurements: {} };
  const selected = await input.db.query<{
    event_id: string;
    event_payload: unknown;
  }>(
    `SELECT event_id, event_payload
     FROM helix_environment_action_workflow_events
     WHERE action_request_id = $1 AND workflow_id = $2
     ORDER BY sequence;`,
    [input.request.action_request_id, input.request.workflow_id],
  );
  const events = selected.rows.flatMap((row) => {
    const parsed = helixEnvironmentActionWorkflowEventSchema.safeParse(
      parseJson(row.event_payload, null),
    );
    return parsed.success
      ? [{ eventId: row.event_id, event: parsed.data }]
      : [];
  });
  const byId = new Map(events.map((entry) => [entry.eventId, entry.event]));
  const referenced = new Set([
    ...input.result.progress_event_refs,
    ...input.result.postconditions.flatMap(
      (condition) => condition.evidence_refs,
    ),
  ]);
  if (referenced.size === 0 || [...referenced].some((ref) => !byId.has(ref))) {
    return {
      valid: input.result.outcome !== "succeeded",
      terminalMeasurements: {},
    };
  }
  const startedAt = input.result.started_at
    ? Date.parse(input.result.started_at)
    : Number.NaN;
  const completedAt = Date.parse(input.result.completed_at);
  const terminal = events.find(({ eventId, event }) => {
    const createdAt = Date.parse(event.created_at);
    return (
      referenced.has(eventId) &&
      event.event_type === expectedTerminal.eventType &&
      event.workflow_state === expectedTerminal.state &&
      event.controls_released &&
      event.workflow_id === input.request.workflow_id &&
      event.action_request_id === input.request.action_request_id &&
      Number.isFinite(startedAt) &&
      Number.isFinite(completedAt) &&
      Number.isFinite(createdAt) &&
      createdAt >= startedAt &&
      createdAt <= completedAt
    );
  });
  if (!terminal) {
    return {
      valid: input.result.outcome !== "succeeded",
      terminalMeasurements: {},
    };
  }
  return {
    valid:
      input.result.outcome === "succeeded"
        ? environmentActionWorkflowMeasurementsValid({
            request: input.request,
            result: input.result,
            measurements: terminal.event.measurements,
          })
        : true,
    terminalMeasurements: terminal.event.measurements,
  };
};

export type EnvironmentActionExecutionContext = {
  actionAuthorityId: string;
  environmentBindingId: string;
  roomId: string;
  sourceId: string;
  worldId: string;
  participantId: string;
  subjectBindingId: string;
  subjectNativeId: string;
  actionAdapterProfileId: string;
  actionDomainAdapter: string;
  policyVersion: number;
  autonomyMode: "approve_each" | "approved_capabilities" | "autonomous";
  manualOverridePolicy: "pause" | "cancel";
  catalogSnapshotId: string;
  manifestId: string;
  capability: {
    capabilityId: string;
    capabilityVersion: number;
    actionKind: string;
    effectClass:
      | "player_motion"
      | "player_interaction"
      | "player_inventory"
      | "world_mutation"
      | "continuous_control";
    workflowModes: Array<"single_action" | "long_running">;
    controlEngines: Array<"native_fabric" | "baritone">;
  };
};

export type EnvironmentActionAuthorityContext = Omit<
  EnvironmentActionExecutionContext,
  "capability"
>;

type EnvironmentActionManifestCapability = {
  capability_id: string;
  capability_version: number;
  action_kind: string;
  effect_class: EnvironmentActionExecutionContext["capability"]["effectClass"];
  workflow_modes: Array<"single_action" | "long_running">;
  control_engines: Array<"native_fabric" | "baritone">;
};

const resolveEnvironmentActionAuthorityBase = async (input: {
  roomId: string;
  profileId: string;
  environmentBindingId: string;
  participantId: string;
}): Promise<{
  context: EnvironmentActionAuthorityContext;
  allowedCapabilityIds: string[];
  manifestCapabilities: EnvironmentActionManifestCapability[];
}> => {
  const membership = await readSharedRealtimeRoomMembership({
    roomId: input.roomId,
    profileId: input.profileId,
  });
  if (
    !membership ||
    (membership.role !== "owner" &&
      membership.participantId !== input.participantId)
  ) {
    throw new EnvironmentActionBrokerError(
      "action_policy_denied",
      403,
      "The current room turn cannot control this paired player identity.",
    );
  }
  const db = await readSharedRealtimeRoomDatabase();
  const selected = await db.query<{ action_authority_id: string }>(
    `SELECT action_authority_id
     FROM helix_environment_action_authorities
     WHERE room_id = $1 AND environment_binding_id = $2
       AND participant_id = $3 AND status = 'active'
       AND (expires_at IS NULL OR expires_at > now())
     ORDER BY policy_version DESC, created_at DESC
     LIMIT 1;`,
    [input.roomId, input.environmentBindingId, input.participantId],
  );
  const authority = assertAuthorityUsable(
    selected.rows[0]
      ? await readAuthorityConnectorRow(
          db,
          selected.rows[0].action_authority_id,
        )
      : null,
  );
  const manifest = await assertFreshConnector(db, {
    authorityId: authority.action_authority_id,
    credentialId: authority.credential_id!,
    connectorInstallationId: authority.connector_installation_id!,
    environmentBindingId: authority.environment_binding_id,
    roomSourceBindingId: authority.room_source_binding_id,
    roomId: authority.room_id,
    sourceId: authority.source_id,
    worldId: authority.world_id,
    actionAdapterProfileId: authority.adapter_profile_id,
    actionDomainAdapter: authority.domain_adapter,
    sourceAdapterProfileId: authority.source_adapter_profile_id,
    participantId: authority.participant_id,
    subjectBindingId: authority.subject_binding_id,
    subjectNativeId: authority.subject_native_id,
    policyVersion: Number(authority.policy_version),
  });
  const catalogSnapshotId = await assertEnvironmentActionCatalogAvailable({
    db,
    environmentBindingId: authority.environment_binding_id,
    adapterProfileId: authority.adapter_profile_id,
    manifestHash: manifest.manifest_hash,
  });
  return {
    context: {
      actionAuthorityId: authority.action_authority_id,
      environmentBindingId: authority.environment_binding_id,
      roomId: authority.room_id,
      sourceId: authority.source_id,
      worldId: authority.world_id,
      participantId: authority.participant_id,
      subjectBindingId: authority.subject_binding_id,
      subjectNativeId: authority.subject_native_id,
      actionAdapterProfileId: authority.adapter_profile_id,
      actionDomainAdapter: authority.domain_adapter,
      policyVersion: Number(authority.policy_version),
      autonomyMode:
        authority.autonomy_mode as EnvironmentActionAuthorityContext["autonomyMode"],
      manualOverridePolicy:
        authority.manual_override_policy as EnvironmentActionAuthorityContext["manualOverridePolicy"],
      catalogSnapshotId,
      manifestId: manifest.manifest_id,
    },
    allowedCapabilityIds: parseStringArray(authority.allowed_capability_ids),
    manifestCapabilities: parseJson<EnvironmentActionManifestCapability[]>(
      manifest.capabilities,
      [],
    ),
  };
};

/**
 * Resolves the exact, fresh Player Embodiment identity and authority without
 * pretending that persistence itself executes a Fabric capability.
 */
export const resolveEnvironmentActionAuthorityContext = async (input: {
  roomId: string;
  profileId: string;
  environmentBindingId: string;
  participantId: string;
}): Promise<EnvironmentActionAuthorityContext> =>
  (await resolveEnvironmentActionAuthorityBase(input)).context;

export type EnvironmentActionWorkflowControlContext = {
  actionAuthorityId: string;
  environmentBindingId: string;
  roomId: string;
  participantId: string;
  workflowId: string;
};

export const resolveEnvironmentActionWorkflowControlContext = async (input: {
  roomId: string;
  profileId: string;
  workflowId: string;
  requestingParticipantId?: string | null;
}): Promise<EnvironmentActionWorkflowControlContext> => {
  const membership = await readSharedRealtimeRoomMembership({
    roomId: input.roomId,
    profileId: input.profileId,
  });
  if (!membership || membership.roomStatus === "closed") {
    throw new EnvironmentActionBrokerError(
      "action_policy_denied",
      403,
      "The current account is not an active member of this room.",
    );
  }
  const participantId =
    input.requestingParticipantId?.trim() || membership.participantId;
  if (
    membership.role !== "owner" &&
    participantId !== membership.participantId
  ) {
    throw new EnvironmentActionBrokerError(
      "action_policy_denied",
      403,
      "A room member may control only its own paired player workflow.",
    );
  }
  const db = await readSharedRealtimeRoomDatabase();
  const selected = await db.query<{
    action_authority_id: string;
    environment_binding_id: string;
    room_id: string;
    participant_id: string;
    workflow_id: string;
  }>(
    `SELECT request.workflow_id, request.environment_binding_id,
            request.room_id, request.participant_id,
            request.action_authority_id
     FROM helix_environment_action_requests request
     JOIN helix_environment_action_authorities authority
       ON authority.action_authority_id = request.action_authority_id
     WHERE request.room_id = $1 AND request.workflow_id = $2
       AND request.participant_id = $3
       AND authority.status = 'active'
       AND (authority.expires_at IS NULL OR authority.expires_at > now())
     LIMIT 1;`,
    [input.roomId, input.workflowId, participantId],
  );
  const row = selected.rows[0];
  if (!row) {
    throw new EnvironmentActionBrokerError(
      "action_request_not_found",
      404,
      "The exact active player workflow was not found for this room participant.",
    );
  }
  return {
    actionAuthorityId: row.action_authority_id,
    environmentBindingId: row.environment_binding_id,
    roomId: row.room_id,
    participantId: row.participant_id,
    workflowId: row.workflow_id,
  };
};

export const resolveEnvironmentActionExecutionContext = async (input: {
  roomId: string;
  profileId: string;
  environmentBindingId: string;
  participantId: string;
  capabilityId: string;
}): Promise<EnvironmentActionExecutionContext> => {
  const authority = await resolveEnvironmentActionAuthorityBase(input);
  if (
    !authority.allowedCapabilityIds.includes(input.capabilityId)
  ) {
    throw new EnvironmentActionBrokerError(
      "action_policy_denied",
      403,
      "The player-action authority does not admit this capability.",
    );
  }
  const manifestCapability = authority.manifestCapabilities.find(
    (capability) => capability.capability_id === input.capabilityId,
  );
  if (!manifestCapability) {
    throw new EnvironmentActionBrokerError(
      "action_policy_denied",
      409,
      "The live player connector does not advertise this capability.",
    );
  }
  return {
    ...authority.context,
    capability: {
      capabilityId: manifestCapability.capability_id,
      capabilityVersion: manifestCapability.capability_version,
      actionKind: manifestCapability.action_kind,
      effectClass: manifestCapability.effect_class,
      workflowModes: manifestCapability.workflow_modes,
      controlEngines: manifestCapability.control_engines,
    },
  };
};

export const enqueueEnvironmentAction = async (input: {
  profileId: string;
  requestingParticipantId?: string | null;
  request: unknown;
}): Promise<HelixEnvironmentActionRequest> => {
  const parsed = helixEnvironmentActionRequestSchema.safeParse(input.request);
  if (!parsed.success) {
    throw new EnvironmentActionBrokerError(
      "action_request_invalid",
      400,
      "The player-action request is invalid.",
    );
  }
  const request = parsed.data;
  if (
    request.action_kind === "execute_sequence" &&
    !helixMinecraftFluidSequenceArgumentsSchema.safeParse(request.arguments)
      .success
  ) {
    throw new EnvironmentActionBrokerError(
      "action_request_invalid",
      400,
      "The bounded Minecraft sequence violates its trusted graph, ruleset, or mutation-scope contract.",
    );
  }
  if (
    request.action_kind === "execute_reactive_program" &&
    !helixMinecraftReactiveProgramArgumentsSchema.safeParse(request.arguments)
      .success
  ) {
    throw new EnvironmentActionBrokerError(
      "action_request_invalid",
      400,
      "The concurrent Minecraft guardian program violates its trusted lanes, resource locks, graph, ruleset, interrupt, or mutation-scope contract.",
    );
  }
  if (
    request.action_kind === "arm_viability_guardian" &&
    !helixMinecraftArmViabilityGuardianArgumentsSchema.safeParse(
      request.arguments,
    ).success
  ) {
    throw new EnvironmentActionBrokerError(
      "action_request_invalid",
      400,
      "The resident Minecraft guardian violates its trusted profile, lease, observation-age, or bounded-response contract.",
    );
  }
  if (
    request.action_kind === "disarm_viability_guardian" &&
    !helixMinecraftDisarmViabilityGuardianArgumentsSchema.safeParse(
      request.arguments,
    ).success
  ) {
    throw new EnvironmentActionBrokerError(
      "action_request_invalid",
      400,
      "The resident Minecraft guardian disarm request does not match the trusted profile contract.",
    );
  }
  const membership = await readSharedRealtimeRoomMembership({
    roomId: request.room_id,
    profileId: input.profileId,
  });
  const requestingParticipantId =
    input.requestingParticipantId?.trim() || membership?.participantId || "";
  if (
    !membership ||
    requestingParticipantId !== request.participant_id ||
    (membership.role !== "owner" &&
      membership.participantId !== request.participant_id)
  ) {
    throw new EnvironmentActionBrokerError(
      "action_policy_denied",
      403,
      "A participant may enqueue player actions only for its exact paired identity.",
    );
  }
  const db = await readSharedRealtimeRoomDatabase();
  const authority = assertAuthorityUsable(
    await readAuthorityConnectorRow(db, request.action_authority_id),
  );
  if (
    authority.room_id !== request.room_id ||
    authority.environment_binding_id !== request.environment_binding_id ||
    authority.source_id !== request.source_id ||
    authority.world_id !== request.world_id ||
    authority.participant_id !== request.participant_id ||
    authority.subject_binding_id !== request.subject_binding_id ||
    authority.subject_native_id !== request.subject_native_id ||
    Number(authority.policy_version) <= 0 ||
    !parseStringArray(authority.allowed_capability_ids).includes(
      request.capability_id,
    )
  ) {
    throw new EnvironmentActionBrokerError(
      "action_policy_denied",
      403,
      "The requested action does not match the current room, world, player, or capability authority.",
    );
  }
  if (
    authority.autonomy_mode === "approve_each" &&
    request.confirmation_state !== "approved"
  ) {
    throw new EnvironmentActionBrokerError(
      "action_policy_denied",
      409,
      "This player-action authority requires current approval.",
    );
  }
  const manifest = await assertFreshConnector(db, {
    authorityId: authority.action_authority_id,
    credentialId: authority.credential_id!,
    connectorInstallationId: authority.connector_installation_id!,
    environmentBindingId: authority.environment_binding_id,
    roomSourceBindingId: authority.room_source_binding_id,
    roomId: authority.room_id,
    sourceId: authority.source_id,
    worldId: authority.world_id,
    actionAdapterProfileId: authority.adapter_profile_id,
    actionDomainAdapter: authority.domain_adapter,
    sourceAdapterProfileId: authority.source_adapter_profile_id,
    participantId: authority.participant_id,
    subjectBindingId: authority.subject_binding_id,
    subjectNativeId: authority.subject_native_id,
    policyVersion: Number(authority.policy_version),
  });
  const manifestCapabilities = parseJson<
    Array<{
      capability_id: string;
      capability_version: number;
      action_kind: string;
      effect_class: string;
      workflow_modes: string[];
      control_engines: string[];
    }>
  >(manifest.capabilities, []);
  const capability = manifestCapabilities.find(
    (candidate) =>
      candidate.capability_id === request.capability_id &&
      candidate.capability_version === request.capability_version &&
      candidate.action_kind === request.action_kind &&
      candidate.effect_class === request.effect_class &&
      candidate.workflow_modes.includes(request.workflow_mode),
  );
  if (
    !capability ||
    (request.requested_control_engine !== "adapter_selected" &&
      !capability.control_engines.includes(request.requested_control_engine))
  ) {
    throw new EnvironmentActionBrokerError(
      "action_policy_denied",
      409,
      "The current player connector manifest does not advertise this exact action version and control engine.",
    );
  }
  const catalog = await db.query<{
    catalog_snapshot_id: string;
    manifest_hash: string;
  }>(
    `SELECT catalog_snapshot_id, manifest_hash
     FROM helix_environment_capability_catalog_snapshots
     WHERE catalog_snapshot_id = $1 AND environment_binding_id = $2
       AND adapter_profile_id = $3
       AND (expires_at IS NULL OR expires_at > now())
     LIMIT 1;`,
    [
      request.catalog_snapshot_id,
      request.environment_binding_id,
      authority.adapter_profile_id,
    ],
  );
  if (
    !catalog.rows[0] ||
    catalog.rows[0].manifest_hash !== manifest.manifest_hash
  ) {
    throw new EnvironmentActionBrokerError(
      "action_manifest_required",
      409,
      "The action catalog changed; compose a current-turn request from the latest connector manifest.",
    );
  }
  const requestHash = hashEnvironmentActionIdempotencyContent(request);
  return withSharedRealtimeRoomTransaction(async (tx) => {
    const duplicate = await tx.query<ActionRequestRow>(
      `SELECT * FROM helix_environment_action_requests
       WHERE action_authority_id = $1 AND idempotency_key = $2 LIMIT 1;`,
      [request.action_authority_id, request.idempotency_key],
    );
    if (duplicate.rows[0]) {
      if (
        !storedEnvironmentActionMatchesIdempotencyContent({
          storedPayload: duplicate.rows[0].request_payload,
          storedRequestHash: duplicate.rows[0].request_hash,
          request,
        })
      ) {
        throw new EnvironmentActionBrokerError(
          "action_request_conflict",
          409,
          "The player-action idempotency key was already used for different content.",
        );
      }
      return requestProjection(duplicate.rows[0]);
    }
    await tx.query(
      `INSERT INTO helix_environment_action_requests (
         action_request_id, workflow_id, action_authority_id,
         connector_manifest_id, catalog_snapshot_id, environment_binding_id,
         room_id, source_id, world_id, participant_id, subject_binding_id,
         subject_native_id, run_id, turn_id, provider_execution_id,
         tool_call_id, capability_id, capability_version, action_kind,
         effect_class, workflow_mode, requested_control_engine,
         request_payload, request_hash, idempotency_key, confirmation_state,
         approval_ref, policy_version, status, deadline_at, created_at, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
         $15, $16, $17, $18, $19, $20, $21, $22, $23::jsonb, $24, $25,
         $26, $27, $28, 'admitted', $29, $30, $30
       );`,
      [
        request.action_request_id,
        request.workflow_id,
        request.action_authority_id,
        manifest.manifest_id,
        request.catalog_snapshot_id,
        request.environment_binding_id,
        request.room_id,
        request.source_id,
        request.world_id,
        request.participant_id,
        request.subject_binding_id,
        request.subject_native_id,
        request.run_id,
        request.turn_id,
        request.provider_execution_id,
        request.tool_call_id,
        request.capability_id,
        request.capability_version,
        request.action_kind,
        request.effect_class,
        request.workflow_mode,
        request.requested_control_engine,
        JSON.stringify(request),
        requestHash,
        request.idempotency_key,
        request.confirmation_state,
        request.approval_ref,
        Number(authority.policy_version),
        request.deadline_at,
        request.created_at,
      ],
    );
    const inserted = await tx.query<ActionRequestRow>(
      `SELECT * FROM helix_environment_action_requests
       WHERE action_request_id = $1 LIMIT 1;`,
      [request.action_request_id],
    );
    return requestProjection(inserted.rows[0]!);
  });
};

export const leasePendingEnvironmentActions = async (input: {
  claim: EnvironmentActionConnectorClaim;
  limit?: number;
}): Promise<HelixEnvironmentActionRequest[]> => {
  const readDb = await readSharedRealtimeRoomDatabase();
  await assertFreshConnector(readDb, input.claim);
  const work = await readDb.query<{ present: number }>(
    `SELECT 1 AS present
     FROM helix_environment_action_requests
     WHERE action_authority_id = $1
       AND (
         status = 'admitted'
         OR (status = 'leased' AND lease_expires_at <= now())
       )
     LIMIT 1;`,
    [input.claim.authorityId],
  );
  if (!work.rows[0]) return [];

  return withSharedRealtimeRoomTransaction(async (db) => {
    await assertFreshConnector(db, input.claim);
    const limit = Math.min(8, Math.max(1, Math.floor(input.limit ?? 4)));
    const now = new Date();
    await db.query(
      `UPDATE helix_environment_action_requests
       SET status = 'failed', cancellation_reason = 'lease_expired_action_outcome_unknown',
           completed_at = now(), updated_at = now()
       WHERE action_authority_id = $1 AND status = 'leased'
         AND lease_expires_at <= now();`,
      [input.claim.authorityId],
    );
    await db.query(
      `UPDATE helix_environment_action_requests
       SET status = 'timed_out', cancellation_reason = 'deadline_expired',
           completed_at = now(), updated_at = now()
       WHERE action_authority_id = $1 AND status = 'admitted'
         AND deadline_at <= now();`,
      [input.claim.authorityId],
    );
    const candidates = await db.query<ActionRequestRow>(
      `SELECT * FROM helix_environment_action_requests
       WHERE action_authority_id = $1 AND connector_manifest_id = $2
         AND status = 'admitted' AND deadline_at > now()
       ORDER BY created_at LIMIT $3 FOR UPDATE;`,
      [
        input.claim.authorityId,
        (await latestManifest(db, input.claim.authorityId))!.manifest_id,
        limit,
      ],
    );
    const leased: HelixEnvironmentActionRequest[] = [];
    for (const candidate of candidates.rows) {
      const leaseExpiresAt = new Date(
        Math.min(
          Date.parse(iso(candidate.deadline_at)),
          now.getTime() + DEFAULT_LEASE_MS,
        ),
      ).toISOString();
      const updated = await db.query<ActionRequestRow>(
        `UPDATE helix_environment_action_requests
         SET status = 'leased', attempt_count = attempt_count + 1,
             leased_at = $2, lease_expires_at = $3, updated_at = $2
         WHERE action_request_id = $1 AND status = 'admitted'
         RETURNING *;`,
        [candidate.action_request_id, now.toISOString(), leaseExpiresAt],
      );
      if (updated.rows[0]) leased.push(requestProjection(updated.rows[0]));
    }
    return leased;
  });
};

export const leasePendingEnvironmentActionControls = async (input: {
  claim: EnvironmentActionConnectorClaim;
  limit?: number;
}): Promise<HelixEnvironmentActionControlRequest[]> => {
  const readDb = await readSharedRealtimeRoomDatabase();
  const work = await readDb.query<{ present: number }>(
    `SELECT 1 AS present
     FROM helix_environment_action_control_requests
     WHERE action_authority_id = $1
       AND (
         status = 'pending'
         OR (status = 'leased' AND deadline_at <= now())
       )
     LIMIT 1;`,
    [input.claim.authorityId],
  );
  if (!work.rows[0]) return [];

  return withSharedRealtimeRoomTransaction(async (db) => {
    const limit = Math.min(8, Math.max(1, Math.floor(input.limit ?? 4)));
    const now = new Date();
    await db.query(
      `UPDATE helix_environment_action_control_requests
       SET status = 'expired', completed_at = now()
       WHERE action_authority_id = $1 AND status IN ('pending', 'leased')
         AND deadline_at <= now();`,
      [input.claim.authorityId],
    );
    const selected = await db.query<{
      control_request_id: string;
      request_payload: unknown;
    }>(
      `SELECT control_request_id, request_payload
       FROM helix_environment_action_control_requests
       WHERE action_authority_id = $1 AND status = 'pending'
       ORDER BY CASE WHEN control_kind = 'emergency_stop' THEN 0 ELSE 1 END,
                created_at
       LIMIT $2 FOR UPDATE;`,
      [input.claim.authorityId, limit],
    );
    const controls: HelixEnvironmentActionControlRequest[] = [];
    for (const row of selected.rows) {
      const parsed = parseJson<unknown>(row.request_payload, null);
      const control =
        helixEnvironmentActionControlRequestSchema.safeParse(parsed);
      if (!control.success) continue;
      await db.query(
        `UPDATE helix_environment_action_control_requests
         SET status = 'leased', leased_at = $2, lease_expires_at = $3
         WHERE control_request_id = $1 AND status = 'pending';`,
        [
          row.control_request_id,
          now.toISOString(),
          new Date(
            Math.min(
              Date.parse(control.data.deadline_at),
              now.getTime() + DEFAULT_LEASE_MS,
            ),
          ).toISOString(),
        ],
      );
      controls.push(control.data);
    }
    return controls;
  });
};

export const submitEnvironmentActionWorkflowEvent = async (input: {
  claim: EnvironmentActionConnectorClaim;
  event: unknown;
}): Promise<{
  event: HelixEnvironmentActionWorkflowEvent;
  replayed: boolean;
}> => {
  const parsed = helixEnvironmentActionWorkflowEventSchema.safeParse(
    input.event,
  );
  if (!parsed.success) {
    throw new EnvironmentActionBrokerError(
      "action_event_invalid",
      400,
      "The player workflow event is invalid.",
    );
  }
  const event = parsed.data;
  return withSharedRealtimeRoomTransaction(async (db) => {
    const requestResult = await db.query<ActionRequestRow>(
      `SELECT * FROM helix_environment_action_requests
       WHERE action_request_id = $1 AND action_authority_id = $2
       LIMIT 1 FOR UPDATE;`,
      [event.action_request_id, input.claim.authorityId],
    );
    const request = requestResult.rows[0];
    if (!request || request.workflow_id !== event.workflow_id) {
      throw new EnvironmentActionBrokerError(
        "action_request_not_found",
        404,
        "The player workflow request was not found.",
      );
    }
    const hash = environmentConnectorSha256(event);
    const existing = await db.query<{ event_hash: string }>(
      `SELECT event_hash FROM helix_environment_action_workflow_events
       WHERE workflow_id = $1 AND sequence = $2 LIMIT 1;`,
      [event.workflow_id, event.sequence],
    );
    if (existing.rows[0]) {
      if (existing.rows[0].event_hash !== hash) {
        throw new EnvironmentActionBrokerError(
          "action_event_conflict",
          409,
          "A different workflow event is already recorded at this sequence.",
        );
      }
      return { event, replayed: true };
    }
    const latest = await db.query<{ sequence: number | string }>(
      `SELECT sequence FROM helix_environment_action_workflow_events
       WHERE workflow_id = $1 ORDER BY sequence DESC LIMIT 1;`,
      [event.workflow_id],
    );
    const expected = latest.rows[0] ? Number(latest.rows[0].sequence) + 1 : 0;
    if (event.sequence !== expected) {
      throw new EnvironmentActionBrokerError(
        "action_event_invalid",
        409,
        `Expected workflow event sequence ${expected}.`,
      );
    }
    if (
      ![
        "leased",
        "running",
        "paused_manual_override",
        "cancel_requested",
      ].includes(request.status)
    ) {
      throw new EnvironmentActionBrokerError(
        "action_request_not_leased",
        409,
        "The workflow event is outside its one-shot execution lifecycle.",
      );
    }
    const manifest = await latestManifest(db, input.claim.authorityId);
    if (!manifest || request.connector_manifest_id !== manifest.manifest_id) {
      throw new EnvironmentActionBrokerError(
        "action_manifest_required",
        409,
        "The workflow belongs to a superseded connector manifest.",
      );
    }
    await db.query(
      `INSERT INTO helix_environment_action_workflow_events (
         event_id, action_request_id, workflow_id, sequence, event_type,
         workflow_state, event_payload, event_hash, producer_epoch_ref, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10);`,
      [
        event.event_id,
        event.action_request_id,
        event.workflow_id,
        event.sequence,
        event.event_type,
        event.workflow_state,
        JSON.stringify(event),
        hash,
        manifest.producer_epoch_ref,
        event.created_at,
      ],
    );
    await db.query(
      `UPDATE helix_environment_action_requests
       SET status = $2, updated_at = now(),
           completed_at = CASE WHEN $2 IN (
             'canceled', 'succeeded', 'failed', 'timed_out',
             'emergency_stopped', 'connector_offline', 'authority_stale'
           ) THEN now() ELSE completed_at END
       WHERE action_request_id = $1;`,
      [event.action_request_id, event.workflow_state],
    );
    return { event, replayed: false };
  });
};

const observationFromRows = (
  request: ActionRequestRow,
  resultRow: ResultRow,
): HelixEnvironmentActionObservation => {
  const result = helixEnvironmentActionResultSchema.parse(
    parseJson(resultRow.result_payload, null),
  );
  return helixEnvironmentActionObservationSchema.parse({
    schema: HELIX_ENVIRONMENT_ACTION_OBSERVATION_SCHEMA,
    action_request_ref: request.action_request_id,
    workflow_ref: request.workflow_id,
    action_execution_ref: result.action_execution_id,
    capability_id: result.capability_id,
    capability_version: result.capability_version,
    action_kind: result.action_kind,
    outcome: result.outcome,
    summary: result.summary,
    result: {
      control_engine: result.control_engine,
      started_clock: result.started_clock ?? null,
      completed_clock: result.completed_clock ?? null,
      duration_ticks: result.duration_ticks ?? null,
      postconditions: result.postconditions,
      verified_terminal_measurements: result.verified_terminal_measurements,
      side_effects_performed: result.side_effects_performed,
      player_motion_performed: result.player_motion_performed,
      player_interaction_performed: result.player_interaction_performed,
      inventory_mutation_performed: result.inventory_mutation_performed,
      world_mutation_performed: result.world_mutation_performed,
      manual_override_detected: result.manual_override_detected,
      manual_override_reason: result.manual_override_reason ?? null,
      controls_released: result.controls_released,
      host_access_performed: false,
      automatic_replay_performed: false,
      model_invoked: false,
    },
    progress_observation_refs: result.progress_event_refs,
    postcondition_evidence_refs: result.postconditions.flatMap(
      (condition) => condition.evidence_refs,
    ),
    evidence_ref: `environment_action_evidence:${resultRow.result_hash.slice("sha256:".length, 48)}`,
    observed_at: iso(resultRow.received_at),
    provenance_valid: resultRow.provenance_valid,
    eligible_for_current_turn_reentry:
      resultRow.eligible_for_current_turn_reentry,
    content_role: "environment_action_observation_not_assistant_answer",
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });
};

const terminalRequestStatusForOutcome = (outcome: string): string => {
  switch (outcome) {
    case "succeeded":
      return "succeeded";
    case "request_canceled":
    case "manual_override":
      return "canceled";
    case "emergency_stopped":
      return "emergency_stopped";
    case "workflow_timeout":
      return "timed_out";
    case "connector_offline":
      return "connector_offline";
    case "authority_stale":
    case "permission_revoked":
      return "authority_stale";
    default:
      return "failed";
  }
};

export const submitEnvironmentActionResult = async (input: {
  claim: EnvironmentActionConnectorClaim;
  result: unknown;
}): Promise<{
  observation: HelixEnvironmentActionObservation;
  replayed: boolean;
}> => {
  const parsed = helixEnvironmentActionResultSchema.safeParse(input.result);
  if (!parsed.success) {
    throw new EnvironmentActionBrokerError(
      "action_result_invalid",
      400,
      "The player-action result envelope is invalid.",
    );
  }
  const raw = parsed.data;
  return withSharedRealtimeRoomTransaction(async (db) => {
    const selected = await db.query<ActionRequestRow>(
      `SELECT * FROM helix_environment_action_requests
       WHERE action_request_id = $1 AND action_authority_id = $2
       LIMIT 1 FOR UPDATE;`,
      [raw.action_request_id, input.claim.authorityId],
    );
    const request = selected.rows[0];
    if (!request || request.workflow_id !== raw.workflow_id) {
      throw new EnvironmentActionBrokerError(
        "action_request_not_found",
        404,
        "The player-action request was not found for this authority.",
      );
    }
    const submittedHash = environmentConnectorSha256(raw);
    const existing = await db.query<ResultRow>(
      `SELECT * FROM helix_environment_action_results
       WHERE action_request_id = $1 LIMIT 1;`,
      [request.action_request_id],
    );
    if (existing.rows[0]) {
      if (existing.rows[0].submitted_result_hash !== submittedHash) {
        throw new EnvironmentActionBrokerError(
          "action_result_conflict",
          409,
          "A different result is already recorded for this player workflow.",
        );
      }
      return {
        observation: observationFromRows(request, existing.rows[0]),
        replayed: true,
      };
    }
    const lifecycleAllowsResult = [
      "leased",
      "running",
      "paused_manual_override",
      "cancel_requested",
      "canceled",
      "succeeded",
      "failed",
      "timed_out",
      "emergency_stopped",
      "connector_offline",
      "authority_stale",
    ].includes(request.status);
    if (!lifecycleAllowsResult) {
      throw new EnvironmentActionBrokerError(
        "action_request_not_leased",
        409,
        "The player-action request is outside its one-shot execution lifecycle.",
      );
    }
    const manifest = await latestManifest(db, input.claim.authorityId);
    const now = new Date();
    const identityValid =
      request.environment_binding_id === input.claim.environmentBindingId &&
      request.room_id === input.claim.roomId &&
      request.source_id === input.claim.sourceId &&
      request.world_id === input.claim.worldId &&
      request.participant_id === input.claim.participantId &&
      request.subject_binding_id === input.claim.subjectBindingId &&
      request.subject_native_id === input.claim.subjectNativeId &&
      Number(request.policy_version) === input.claim.policyVersion &&
      request.connector_manifest_id === manifest?.manifest_id;
    const envelopeValid =
      request.capability_id === raw.capability_id &&
      Number(request.capability_version) === raw.capability_version &&
      request.action_kind === raw.action_kind;
    const currentTurn =
      Date.parse(iso(request.deadline_at)) >= now.getTime() &&
      !["timed_out", "authority_stale"].includes(request.status);
    const provenanceValid = identityValid && envelopeValid;
    const eligibleForReentry = provenanceValid && currentTurn;
    const recordedWorkflowEvidence = await readRecordedWorkflowEvidence({
      db,
      request: requestProjection(request),
      result: raw,
    });
    const canonical = canonicalizeEnvironmentActionResult({
      request: requestProjection(request),
      result: raw,
      identityValid,
      envelopeValid,
      currentTurn,
      workflowEvidenceValid: recordedWorkflowEvidence.valid,
      verifiedTerminalMeasurements: provenanceValid
        ? recordedWorkflowEvidence.terminalMeasurements
        : {},
    });
    const canonicalHash = environmentConnectorSha256(canonical);
    const resultId = `environment_action_result:${crypto.randomUUID()}`;
    await db.query(
      `INSERT INTO helix_environment_action_results (
         action_result_id, action_request_id, workflow_id,
         action_execution_id, capability_id, capability_version,
         action_kind, outcome, result_payload, submitted_result_hash, result_hash,
         controls_released, host_access_performed,
         automatic_replay_performed, provenance_valid,
         eligible_for_current_turn_reentry, completed_at, received_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11,
         $12, false, false, $13, $14, $15, $16
       );`,
      [
        resultId,
        request.action_request_id,
        request.workflow_id,
        canonical.action_execution_id,
        canonical.capability_id,
        canonical.capability_version,
        canonical.action_kind,
        canonical.outcome,
        JSON.stringify(canonical),
        submittedHash,
        canonicalHash,
        canonical.controls_released,
        provenanceValid,
        eligibleForReentry,
        canonical.completed_at,
        now.toISOString(),
      ],
    );
    await db.query(
      `UPDATE helix_environment_action_requests
       SET status = $2, completed_at = $3, updated_at = $3
       WHERE action_request_id = $1;`,
      [
        request.action_request_id,
        terminalRequestStatusForOutcome(canonical.outcome),
        now.toISOString(),
      ],
    );
    const stored = await db.query<ResultRow>(
      `SELECT * FROM helix_environment_action_results
       WHERE action_result_id = $1 LIMIT 1;`,
      [resultId],
    );
    return {
      observation: observationFromRows(request, stored.rows[0]!),
      replayed: false,
    };
  });
};

const controlObservationFromRows = (
  requestRow: ControlRequestRow,
  resultRow: ControlResultRow,
): HelixEnvironmentActionControlObservation => {
  const request = helixEnvironmentActionControlRequestSchema.parse(
    parseJson(requestRow.request_payload, null),
  );
  const result = helixEnvironmentActionControlResultSchema.parse(
    parseJson(resultRow.result_payload, null),
  );
  return helixEnvironmentActionControlObservationSchema.parse({
    schema: HELIX_ENVIRONMENT_ACTION_CONTROL_OBSERVATION_SCHEMA,
    control_request_ref: request.control_request_id,
    workflow_ref: request.workflow_id,
    control_kind: result.control_kind,
    outcome: result.outcome,
    summary: result.summary,
    affected_workflow_refs: result.affected_workflow_ids,
    workflow_state: result.workflow_state,
    controls_released: result.controls_released,
    evidence_refs: result.evidence_refs,
    evidence_ref: `environment_action_control_evidence:${resultRow.result_hash.slice("sha256:".length, 48)}`,
    observed_at: iso(resultRow.received_at),
    provenance_valid: resultRow.provenance_valid,
    eligible_for_current_turn_reentry:
      resultRow.eligible_for_current_turn_reentry,
    content_role: "environment_action_control_observation_not_assistant_answer",
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });
};

export const submitEnvironmentActionControlResult = async (input: {
  claim: EnvironmentActionConnectorClaim;
  result: unknown;
}): Promise<{
  replayed: boolean;
  controlsReleased: boolean;
  observation: HelixEnvironmentActionControlObservation;
}> => {
  const parsed = helixEnvironmentActionControlResultSchema.safeParse(
    input.result,
  );
  if (!parsed.success) {
    throw new EnvironmentActionBrokerError(
      "action_control_invalid",
      400,
      "The player-action control result is invalid.",
    );
  }
  const result = parsed.data;
  return withSharedRealtimeRoomTransaction(async (db) => {
    const selected = await db.query<ControlRequestRow>(
      `SELECT *
       FROM helix_environment_action_control_requests
       WHERE control_request_id = $1 AND action_authority_id = $2
       LIMIT 1 FOR UPDATE;`,
      [result.control_request_id, input.claim.authorityId],
    );
    const request = selected.rows[0];
    if (!request || request.control_kind !== result.control_kind) {
      throw new EnvironmentActionBrokerError(
        "action_control_invalid",
        404,
        "The player-action control request was not found.",
      );
    }
    const submittedHash = environmentConnectorSha256(result);
    const existing = await db.query<ControlResultRow>(
      `SELECT *
       FROM helix_environment_action_control_results
       WHERE control_request_id = $1 LIMIT 1;`,
      [result.control_request_id],
    );
    if (existing.rows[0]) {
      if (existing.rows[0].submitted_result_hash !== submittedHash) {
        throw new EnvironmentActionBrokerError(
          "action_control_conflict",
          409,
          "A different result is already recorded for this control request.",
        );
      }
      return {
        replayed: true,
        controlsReleased: existing.rows[0].controls_released,
        observation: controlObservationFromRows(request, existing.rows[0]),
      };
    }
    if (request.status !== "leased") {
      throw new EnvironmentActionBrokerError(
        "action_control_invalid",
        409,
        "The player-action control request is not leased.",
      );
    }
    const requestEnvelope = helixEnvironmentActionControlRequestSchema.parse(
      parseJson(request.request_payload, null),
    );
    const exactIdentity =
      requestEnvelope.action_authority_id === input.claim.authorityId &&
      requestEnvelope.environment_binding_id ===
        input.claim.environmentBindingId &&
      requestEnvelope.room_id === input.claim.roomId &&
      requestEnvelope.source_id === input.claim.sourceId &&
      requestEnvelope.world_id === input.claim.worldId &&
      requestEnvelope.participant_id === input.claim.participantId &&
      requestEnvelope.subject_binding_id === input.claim.subjectBindingId;
    const exactWorkflowResult =
      requestEnvelope.workflow_id === null ||
      result.outcome !== "completed" ||
      result.affected_workflow_ids.includes(requestEnvelope.workflow_id);
    const provenanceValid = exactIdentity && exactWorkflowResult;
    const currentTurn = Date.parse(requestEnvelope.deadline_at) >= Date.now();
    const canonical: HelixEnvironmentActionControlResult =
      provenanceValid && (currentTurn || result.outcome !== "completed")
        ? result
        : helixEnvironmentActionControlResultSchema.parse({
            ...result,
            outcome: "stale",
            summary: provenanceValid
              ? "The connector completed this control after its current-turn deadline; it remains provenance but cannot settle the original turn."
              : "The control result did not match the exact admitted room, player, world, or workflow identity.",
          });
    const canonicalHash = environmentConnectorSha256(canonical);
    const resultId = `environment_action_control_result:${crypto.randomUUID()}`;
    await db.query(
      `INSERT INTO helix_environment_action_control_results (
         control_result_id, control_request_id, result_payload,
         submitted_result_hash, result_hash, controls_released,
         provenance_valid, eligible_for_current_turn_reentry
       ) VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8);`,
      [
        resultId,
        result.control_request_id,
        JSON.stringify(canonical),
        submittedHash,
        canonicalHash,
        canonical.controls_released,
        provenanceValid,
        provenanceValid && currentTurn,
      ],
    );
    await db.query(
      `UPDATE helix_environment_action_control_requests
       SET status = $2, completed_at = now()
       WHERE control_request_id = $1;`,
      [
        result.control_request_id,
        canonical.outcome === "failed" ? "failed" : "completed",
      ],
    );
    const stored = await db.query<ControlResultRow>(
      `SELECT * FROM helix_environment_action_control_results
       WHERE control_result_id = $1 LIMIT 1;`,
      [resultId],
    );
    return {
      replayed: false,
      controlsReleased: canonical.controls_released,
      observation: controlObservationFromRows(request, stored.rows[0]!),
    };
  });
};

export const readEnvironmentActionControlObservation = async (
  controlRequestId: string,
): Promise<HelixEnvironmentActionControlObservation | null> => {
  const db = await readSharedRealtimeRoomDatabase();
  const selected = await db.query<ControlRequestRow & ControlResultRow>(
    `SELECT request.*, result.*
     FROM helix_environment_action_control_requests request
     JOIN helix_environment_action_control_results result
       ON result.control_request_id = request.control_request_id
     WHERE request.control_request_id = $1 LIMIT 1;`,
    [controlRequestId],
  );
  const row = selected.rows[0];
  return row ? controlObservationFromRows(row, row) : null;
};

export const awaitEnvironmentActionControlObservation = async (input: {
  controlRequestId: string;
  deadlineAt: string;
  signal?: AbortSignal;
}): Promise<HelixEnvironmentActionControlObservation> => {
  for (;;) {
    if (input.signal?.aborted) {
      throw new EnvironmentActionBrokerError(
        "action_control_invalid",
        499,
        "The control wait was canceled; no control was replayed.",
      );
    }
    const observation = await readEnvironmentActionControlObservation(
      input.controlRequestId,
    );
    if (observation) return observation;
    if (Date.now() >= Date.parse(input.deadlineAt)) {
      const db = await readSharedRealtimeRoomDatabase();
      await db.query(
        `UPDATE helix_environment_action_control_requests
         SET status = 'expired', completed_at = now()
         WHERE control_request_id = $1 AND status IN ('pending', 'leased');`,
        [input.controlRequestId],
      );
      throw new EnvironmentActionBrokerError(
        "action_control_invalid",
        504,
        "The player workflow control did not return before its deadline and was not replayed.",
      );
    }
    await new Promise<void>((resolve) => setTimeout(resolve, WAIT_POLL_MS));
  }
};

export const readEnvironmentActionObservation = async (
  requestId: string,
): Promise<HelixEnvironmentActionObservation | null> => {
  const db = await readSharedRealtimeRoomDatabase();
  const selected = await db.query<ActionRequestRow & ResultRow>(
    `SELECT request.*, result.*
     FROM helix_environment_action_requests request
     JOIN helix_environment_action_results result
       ON result.action_request_id = request.action_request_id
     WHERE request.action_request_id = $1 LIMIT 1;`,
    [requestId],
  );
  const row = selected.rows[0];
  return row ? observationFromRows(row, row) : null;
};

export const awaitEnvironmentActionObservation = async (input: {
  requestId: string;
  deadlineAt: string;
  signal?: AbortSignal;
}): Promise<HelixEnvironmentActionObservation> => {
  for (;;) {
    if (input.signal?.aborted) {
      throw new EnvironmentActionBrokerError(
        "action_request_expired",
        499,
        "The action wait was canceled; the workflow was not replayed.",
      );
    }
    const observation = await readEnvironmentActionObservation(input.requestId);
    if (observation) return observation;
    if (Date.now() >= Date.parse(input.deadlineAt)) {
      const db = await readSharedRealtimeRoomDatabase();
      await db.query(
        `UPDATE helix_environment_action_requests
         SET status = CASE
           WHEN status IN ('leased', 'running') THEN 'failed'
           ELSE 'timed_out' END,
           cancellation_reason = 'deadline_expired_no_automatic_replay',
           completed_at = now(), updated_at = now()
         WHERE action_request_id = $1
           AND status IN ('admitted', 'leased', 'running',
             'paused_manual_override', 'cancel_requested');`,
        [input.requestId],
      );
      throw new EnvironmentActionBrokerError(
        "action_request_expired",
        504,
        "The player workflow did not return before its deadline; its outcome is unknown and it was not replayed.",
      );
    }
    await new Promise<void>((resolve) => setTimeout(resolve, WAIT_POLL_MS));
  }
};
