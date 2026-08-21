import crypto from "node:crypto";
import type { PoolClient } from "pg";
import {
  buildHelixAccountCapabilityPolicy,
  type HelixAccountCapabilityPolicy,
} from "@shared/helix-account-session";
import {
  HELIX_ENVIRONMENT_INTERACTION_CONFIG_SCHEMA,
  type HelixEnvironmentInteractionRequest,
  type HelixEnvironmentInteractionConfig,
} from "@shared/helix-environment-interaction";
import type { HelixWorkstationGatewayAccountContext } from "../../helix-ask/workstation-tool-gateway/account-policy";
import { getAccountSessionById } from "../../helix-account/account-session-store";
import {
  readSharedRealtimeRoomDatabase,
  withSharedRealtimeRoomTransaction,
} from "../../helix-ask/realtime-room/room-store/database";
import { updateSharedRealtimeRoomPresence } from "../../helix-ask/realtime-room/room-store";

const hash = (value: string): string =>
  `sha256:${crypto.createHash("sha256").update(value, "utf8").digest("hex")}`;

const iso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

export class EnvironmentInteractionError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string,
    readonly retryable = false,
  ) {
    super(message);
    this.name = "EnvironmentInteractionError";
  }
}

type InteractionRow = {
  interaction_credential_id: string;
  action_authority_id: string;
  environment_binding_id: string;
  owner_profile_id: string;
  room_id: string;
  participant_id: string;
  subject_binding_id: string;
  subject_native_id: string;
  source_id: string;
  world_id: string;
  connector_installation_id: string;
  scopes: unknown;
  status: string;
  expires_at: Date | string;
  account_type: string;
  participant_profile_id: string;
  participant_presence: string;
  authority_status: string;
  authority_expires_at: Date | string | null;
  manifest_id: string | null;
  producer_epoch_ref: string | null;
};

export type AuthenticatedEnvironmentInteraction = {
  credentialId: string;
  actionAuthorityId: string;
  environmentBindingId: string;
  ownerProfileId: string;
  participantProfileId: string;
  roomId: string;
  participantId: string;
  subjectBindingId: string;
  subjectNativeId: string;
  sourceId: string;
  worldId: string;
  connectorInstallationId: string;
  producerEpochRef: string;
  scopes: string[];
  accountPolicy: HelixAccountCapabilityPolicy;
  accountContext: HelixWorkstationGatewayAccountContext;
};

export const issueEnvironmentInteractionCredentialForPairing = async (input: {
  actionAuthorityId: string;
  ownerProfileId: string;
  roomId: string;
  pairingId: string;
  connectorInstallationId: string;
  publicBaseUrl: string;
  trustedCredentialSecret: string;
  ttlMs: number;
}): Promise<HelixEnvironmentInteractionConfig> => {
  const db = await readSharedRealtimeRoomDatabase();
  const authority = await db.query<{
    environment_binding_id: string;
    room_id: string;
    participant_id: string;
    subject_binding_id: string;
    subject_native_id: string;
    source_id: string;
    world_id: string;
  }>(
    `SELECT environment_binding_id, room_id, participant_id, subject_binding_id,
            subject_native_id, source_id, world_id
       FROM helix_environment_action_authorities
      WHERE action_authority_id = $1 AND owner_profile_id = $2
        AND room_id = $3 AND status = 'active'
      LIMIT 1;`,
    [input.actionAuthorityId, input.ownerProfileId, input.roomId],
  );
  const row = authority.rows[0];
  if (!row) {
    throw new EnvironmentInteractionError(
      "interaction_authority_unavailable",
      409,
      "The exact player-action authority is not active.",
    );
  }
  const expiresAt = new Date(Date.now() + input.ttlMs).toISOString();
  const credentialId = `environment_interaction_credential:${crypto.randomUUID()}`;
  const existing = await db.query<{
    interaction_credential_id: string;
    expires_at: Date | string;
  }>(
    `SELECT interaction_credential_id, expires_at
       FROM helix_environment_interaction_credentials
      WHERE bootstrap_pairing_id=$1 AND token_hash=$2 LIMIT 1;`,
    [input.pairingId, hash(input.trustedCredentialSecret)],
  );
  const effectiveCredentialId =
    existing.rows[0]?.interaction_credential_id ?? credentialId;
  const effectiveExpiresAt = existing.rows[0]
    ? iso(existing.rows[0].expires_at)
    : expiresAt;
  if (!existing.rows[0]) {
    await withSharedRealtimeRoomTransaction(async (client: PoolClient) => {
      await client.query(
      `UPDATE helix_environment_interaction_credentials
          SET status = 'revoked', revoked_at = now()
        WHERE action_authority_id = $1 AND status = 'active';`,
      [input.actionAuthorityId],
      );
      await client.query(
      `INSERT INTO helix_environment_interaction_credentials (
         interaction_credential_id, action_authority_id, environment_binding_id,
         owner_profile_id, room_id, participant_id, subject_binding_id,
         subject_native_id, source_id, world_id, connector_installation_id,
         bootstrap_pairing_id, token_hash, token_prefix, scopes, expires_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16);`,
      [
        credentialId,
        input.actionAuthorityId,
        row.environment_binding_id,
        input.ownerProfileId,
        row.room_id,
        row.participant_id,
        row.subject_binding_id,
        row.subject_native_id,
        row.source_id,
        row.world_id,
        input.connectorInstallationId,
        input.pairingId,
        hash(input.trustedCredentialSecret),
        input.trustedCredentialSecret.slice(0, 24),
        JSON.stringify(["ask.submit", "ask.cancel", "ask.status"]),
        expiresAt,
      ],
      );
    });
  }
  return {
    schema: HELIX_ENVIRONMENT_INTERACTION_CONFIG_SCHEMA,
    endpoint: `${input.publicBaseUrl.replace(/\/+$/, "")}/api/agi/ask/turn`,
    bearer_token: input.trustedCredentialSecret,
    interaction_credential_id: effectiveCredentialId,
    action_authority_id: input.actionAuthorityId,
    environment_binding_id: row.environment_binding_id,
    room_id: row.room_id,
    participant_id: row.participant_id,
    subject_binding_id: row.subject_binding_id,
    subject_native_id: row.subject_native_id,
    source_id: row.source_id,
    world_id: row.world_id,
    connector_installation_id: input.connectorInstallationId,
    expires_at: effectiveExpiresAt,
    scopes: ["ask.submit", "ask.cancel", "ask.status"],
  };
};

const parseScopes = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((entry: unknown): entry is string => typeof entry === "string");
  if (typeof value === "string") {
    try {
      return parseScopes(JSON.parse(value));
    } catch {
      return [];
    }
  }
  return [];
};

export const authenticateEnvironmentInteraction = async (input: {
  bearerToken: string;
  requiredScope: "ask.submit" | "ask.cancel" | "ask.status";
}): Promise<AuthenticatedEnvironmentInteraction> => {
  const token = input.bearerToken.trim();
  if (!/^helix_env_interact_[a-zA-Z0-9_-]{43,96}$/.test(token)) {
    throw new EnvironmentInteractionError(
      "interaction_credential_invalid",
      401,
      "The environment interaction credential is invalid.",
    );
  }
  const db = await readSharedRealtimeRoomDatabase();
  const result = await db.query<InteractionRow>(
    `SELECT c.*, a.account_type,
            m.presence AS participant_presence,
            m.profile_id AS participant_profile_id,
            au.status AS authority_status,
            au.expires_at AS authority_expires_at,
            mf.manifest_id,
            mf.producer_epoch_ref
       FROM helix_environment_interaction_credentials c
       JOIN helix_shared_realtime_room_members m
         ON m.participant_id = c.participant_id AND m.room_id = c.room_id
       JOIN helix_accounts a ON a.profile_id = m.profile_id
       JOIN helix_environment_action_authorities au
         ON au.action_authority_id = c.action_authority_id
       LEFT JOIN helix_environment_action_connector_manifests mf
         ON mf.action_authority_id = c.action_authority_id
        AND mf.environment_binding_id = c.environment_binding_id
        AND mf.connector_installation_id = c.connector_installation_id
        AND mf.room_id = c.room_id
        AND mf.source_id = c.source_id
        AND mf.world_id = c.world_id
        AND mf.participant_id = c.participant_id
        AND mf.subject_binding_id = c.subject_binding_id
        AND mf.subject_native_id = c.subject_native_id
        AND mf.status = 'active'
      WHERE c.token_hash = $1
      ORDER BY mf.received_at DESC
      LIMIT 1;`,
    [hash(token)],
  );
  const row = result.rows[0];
  if (!row || row.status !== "active") {
    throw new EnvironmentInteractionError(
      "interaction_credential_invalid",
      401,
      "The environment interaction credential is invalid or revoked.",
    );
  }
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await db.query(
      `UPDATE helix_environment_interaction_credentials SET status='expired'
        WHERE interaction_credential_id=$1 AND status='active';`,
      [row.interaction_credential_id],
    );
    throw new EnvironmentInteractionError(
      "interaction_credential_expired",
      401,
      "The environment interaction credential expired; pair the client again.",
    );
  }
  const scopes = parseScopes(row.scopes);
  if (!scopes.includes(input.requiredScope)) {
    throw new EnvironmentInteractionError(
      "interaction_scope_missing",
      403,
      `The credential does not grant ${input.requiredScope}.`,
    );
  }
  if (
    row.participant_presence !== "present" ||
    row.authority_status !== "active" ||
    (row.authority_expires_at && new Date(row.authority_expires_at).getTime() <= Date.now()) ||
    !row.manifest_id ||
    !row.producer_epoch_ref
  ) {
    throw new EnvironmentInteractionError(
      "interaction_binding_stale",
      409,
      "The paired room participant, player authority, or connector epoch is no longer active.",
      true,
    );
  }
  const accountType = row.account_type === "developer" ? "developer" : "user";
  const activeSessionResult = await db.query<{ session_id: string }>(
    `SELECT session_id
       FROM helix_account_sessions
      WHERE profile_id=$1 AND status='active'
        AND (expires_at IS NULL OR expires_at > now())
      ORDER BY updated_at DESC
      LIMIT 1;`,
    [row.participant_profile_id],
  );
  const accountSession = activeSessionResult.rows[0]?.session_id
    ? await getAccountSessionById(activeSessionResult.rows[0].session_id)
    : null;
  const accountPolicy =
    accountSession?.account_policy ?? buildHelixAccountCapabilityPolicy(accountType);
  try {
    await updateSharedRealtimeRoomPresence({
      roomId: row.room_id,
      profileId: row.participant_profile_id,
      presence: "present",
    });
  } catch {
    throw new EnvironmentInteractionError(
      "interaction_binding_stale",
      409,
      "The paired room participant is no longer eligible to interact in this room.",
      true,
    );
  }
  await db.query(
    `UPDATE helix_environment_interaction_credentials SET last_used_at=now()
      WHERE interaction_credential_id=$1;`,
    [row.interaction_credential_id],
  );
  const accountContext: HelixWorkstationGatewayAccountContext = {
    session_id: accountSession?.session_id ?? null,
    profile_id: row.participant_profile_id,
    trusted_account_session:
      accountSession?.profile.profile_id === row.participant_profile_id,
    account_session: accountSession,
    account_policy: accountPolicy,
    trusted_turn_actor_context: {
      schema: "helix.realtime_room.turn_actor_context.v1",
      origin: "environment_interaction",
      room_id: row.room_id,
      requester_profile_id: row.participant_profile_id,
      realtime_session_id: `environment-interaction:${row.interaction_credential_id}`,
      participant_id: row.participant_id,
      resolution: "resolved",
      resolution_source: "paired_environment_participant",
      captured_at_ms: Date.now(),
    },
  };
  return {
    credentialId: row.interaction_credential_id,
    actionAuthorityId: row.action_authority_id,
    environmentBindingId: row.environment_binding_id,
    ownerProfileId: row.owner_profile_id,
    participantProfileId: row.participant_profile_id,
    roomId: row.room_id,
    participantId: row.participant_id,
    subjectBindingId: row.subject_binding_id,
    subjectNativeId: row.subject_native_id,
    sourceId: row.source_id,
    worldId: row.world_id,
    connectorInstallationId: row.connector_installation_id,
    producerEpochRef: row.producer_epoch_ref,
    scopes,
    accountPolicy,
    accountContext,
  };
};

export const environmentInteractionTokenHash = hash;
export const environmentInteractionDateIso = iso;

export type EnvironmentInteractionRequestReservation =
  | { kind: "reserved" }
  | { kind: "replay"; response: Record<string, unknown> };

const interactionRequestHash = (
  request: HelixEnvironmentInteractionRequest,
): string =>
  hash(JSON.stringify({
    prompt: request.prompt,
    connector_installation_id: request.connector_installation_id,
    subject_native_id: request.subject_native_id,
    world_id: request.world_id,
  }));

export const reserveEnvironmentInteractionRequest = async (input: {
  interaction: AuthenticatedEnvironmentInteraction;
  request: HelixEnvironmentInteractionRequest;
  turnId: string;
}): Promise<EnvironmentInteractionRequestReservation> => {
  const db = await readSharedRealtimeRoomDatabase();
  const idempotencyKeyHash = hash(input.request.idempotency_key);
  const requestHash = interactionRequestHash(input.request);
  const inserted = await db.query<{ request_id: string }>(
    `INSERT INTO helix_environment_interaction_requests (
       request_id, interaction_credential_id, idempotency_key_hash,
       request_hash, turn_id
     ) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT DO NOTHING
     RETURNING request_id;`,
    [
      input.request.request_id,
      input.interaction.credentialId,
      idempotencyKeyHash,
      requestHash,
      input.turnId,
    ],
  );
  const result = await db.query<{
    request_id: string;
    request_hash: string;
    turn_id: string;
    status: string;
    response_json: unknown;
  }>(
    `SELECT request_id, request_hash, turn_id, status, response_json
       FROM helix_environment_interaction_requests
      WHERE interaction_credential_id=$1 AND idempotency_key_hash=$2
      LIMIT 1;`,
    [input.interaction.credentialId, idempotencyKeyHash],
  );
  const row = result.rows[0];
  if (!row || row.request_hash !== requestHash || row.turn_id !== input.turnId) {
    throw new EnvironmentInteractionError(
      "interaction_idempotency_conflict",
      409,
      "That in-game request key was already used for a different request.",
    );
  }
  if (row.request_id !== input.request.request_id) {
    throw new EnvironmentInteractionError(
      "interaction_idempotency_conflict",
      409,
      "That in-game request key was already used with a different request identity.",
    );
  }
  if (row.status === "running") {
    const justInserted = inserted.rows[0]?.request_id === input.request.request_id;
    if (justInserted) return { kind: "reserved" };
  }
  if (
    ["completed", "failed", "canceled"].includes(row.status) &&
    row.response_json &&
    typeof row.response_json === "object" &&
    !Array.isArray(row.response_json)
  ) {
    return {
      kind: "replay",
      response: row.response_json as Record<string, unknown>,
    };
  }
  throw new EnvironmentInteractionError(
    "interaction_request_in_progress",
    409,
    "That in-game request is already running.",
    true,
  );
};

export const completeEnvironmentInteractionRequest = async (input: {
  interaction: AuthenticatedEnvironmentInteraction;
  requestId: string;
  response: Record<string, unknown>;
  terminalArtifactKind: string | null;
  terminalAuthorityOk: boolean;
  status: "completed" | "failed" | "canceled";
}): Promise<void> => {
  const db = await readSharedRealtimeRoomDatabase();
  await db.query(
    `UPDATE helix_environment_interaction_requests
        SET status=$3, terminal_artifact_kind=$4,
            terminal_authority_ok=$5, response_json=$6::jsonb,
            updated_at=now(), completed_at=now()
      WHERE request_id=$1 AND interaction_credential_id=$2
        AND status='running';`,
    [
      input.requestId,
      input.interaction.credentialId,
      input.status,
      input.terminalArtifactKind,
      input.terminalAuthorityOk,
      JSON.stringify(input.response),
    ],
  );
};
