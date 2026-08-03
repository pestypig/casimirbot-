import crypto from "node:crypto";
import {
  HELIX_CONNECTOR_PAIRING_CODE_PATTERN,
  HELIX_CONNECTOR_PAIRING_CODE_TTL_MS,
  HELIX_CONNECTOR_PAIRING_REPLAY_TTL_MS,
  HELIX_CONNECTOR_PAIRING_SCHEMA,
  type HelixConnectorPairing,
  type HelixConnectorPairingPurpose,
} from "@shared/helix-connector-pairing";
import type {
  HelixRoomSourceBinding,
  HelixRoomSourcePluginConfig,
} from "@shared/helix-room-source-ingress";
import type { HelixEnvironmentCommandConnectorConfig } from "@shared/helix-environment-command";
import {
  createSharedRealtimeRoomSourceBindingWithoutCredential,
  listSharedRealtimeRoomSourceBindings,
  persistSharedRealtimeRoomSourceCredentialForTrustedClaim,
  revokeSharedRealtimeRoomSourceBinding,
  revokeSharedRealtimeRoomSourceBindingByCredential,
} from "../../helix-ask/realtime-room/source-link-store";
import {
  readSharedRealtimeRoomDatabase,
  withSharedRealtimeRoomTransaction,
} from "../../helix-ask/realtime-room/room-store/database";
import type { Queryable } from "../../helix-ask/realtime-room/room-store/types";
import { listEnvironmentAdapterProfiles } from "../../situation-room/environment-adapter-registry";
import { issueEnvironmentCommandConnectorCredentialForPairing } from "../commands";

const DEFAULT_CREDENTIAL_TTL_MS = 7 * 24 * 60 * 60 * 1_000;
const MAX_REDEEM_ATTEMPTS = 8;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type ConnectorBootstrapPairingErrorCode =
  | "connector_pairing_invalid"
  | "connector_pairing_not_found"
  | "connector_pairing_forbidden"
  | "connector_pairing_expired"
  | "connector_pairing_revoked"
  | "connector_pairing_already_redeemed"
  | "connector_pairing_identity_mismatch"
  | "connector_pairing_rate_limited"
  | "connector_pairing_unavailable";

export class ConnectorBootstrapPairingError extends Error {
  constructor(
    readonly code: ConnectorBootstrapPairingErrorCode,
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ConnectorBootstrapPairingError";
  }
}

type PairingRow = {
  pairing_id: string;
  room_id: string;
  owner_profile_id: string;
  binding_id: string;
  purpose: string;
  domain_adapter: string;
  world_id: string;
  source_label: string;
  command_credential_requested: boolean;
  code_hash: string;
  create_idempotency_key_hash: string;
  create_request_hash: string;
  redemption_nonce_hash: string | null;
  redeemed_credential_id: string | null;
  connector_kind: string | null;
  connector_version: string | null;
  status: string;
  attempt_count: number | string;
  credential_ttl_ms: number | string;
  expires_at: Date | string;
  replay_expires_at: Date | string | null;
  redeemed_at: Date | string | null;
  revoked_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const ingressEndpointForPairing = (input: {
  pairingEndpoint: string;
  bindingId: string;
}): string => {
  let endpoint: URL;
  try {
    endpoint = new URL(normalize(input.pairingEndpoint));
  } catch {
    throw new ConnectorBootstrapPairingError(
      "connector_pairing_invalid",
      400,
      "The connector pairing endpoint is invalid.",
    );
  }
  if (
    (endpoint.protocol !== "https:" && endpoint.protocol !== "http:") ||
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash
  ) {
    throw new ConnectorBootstrapPairingError(
      "connector_pairing_invalid",
      400,
      "The connector pairing endpoint is invalid.",
    );
  }
  return `${endpoint.origin}/api/room-ingress/v1/bindings/${encodeURIComponent(
    input.bindingId,
  )}`;
};

const iso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const isoOrNull = (value: Date | string | null): string | null =>
  value === null ? null : iso(value);

const secretHash = (namespace: string, value: string): `sha256:${string}` =>
  `sha256:${crypto
    .createHash("sha256")
    .update(`${namespace}\0${value}`, "utf8")
    .digest("hex")}`;

const pairingCodeHash = (code: string): `sha256:${string}` =>
  secretHash("helix.connector_pairing.code.v1", code.toUpperCase());

const redemptionNonceHash = (nonce: string): `sha256:${string}` =>
  secretHash("helix.connector_pairing.redemption_nonce.v1", nonce);

const deriveSourceCredential = (input: {
  pairingId: string;
  pairingCode: string;
  redemptionNonce: string;
}): string =>
  `helix_room_src_${crypto
    .createHash("sha256")
    .update("helix.connector_pairing.source_credential.v1\0", "utf8")
    .update(input.pairingId, "utf8")
    .update("\0", "utf8")
    .update(input.pairingCode.toUpperCase(), "utf8")
    .update("\0", "utf8")
    .update(input.redemptionNonce, "utf8")
    .digest("base64url")}`;

const deriveCommandCredential = (input: {
  pairingId: string;
  pairingCode: string;
  redemptionNonce: string;
}): string =>
  `helix_env_cmd_${crypto
    .createHash("sha256")
    .update("helix.connector_pairing.command_credential.v1\0", "utf8")
    .update(input.pairingId, "utf8")
    .update("\0", "utf8")
    .update(input.pairingCode.toUpperCase(), "utf8")
    .update("\0", "utf8")
    .update(input.redemptionNonce, "utf8")
    .digest("base64url")}`;

const publicBaseUrlForPairing = (pairingEndpoint: string): string => {
  try {
    const endpoint = new URL(normalize(pairingEndpoint));
    if (
      (endpoint.protocol !== "https:" && endpoint.protocol !== "http:") ||
      endpoint.username ||
      endpoint.password
    ) {
      throw new Error("unsafe");
    }
    return endpoint.origin;
  } catch {
    throw new ConnectorBootstrapPairingError(
      "connector_pairing_invalid",
      400,
      "The connector pairing endpoint is invalid.",
    );
  }
};

const generatePairingCode = (input: {
  pairingId: string;
  idempotencyKey: string;
}): string => {
  const bytes = crypto
    .createHash("sha256")
    .update("helix.connector_pairing.display_code.v1\0", "utf8")
    .update(input.pairingId, "utf8")
    .update("\0", "utf8")
    .update(input.idempotencyKey, "utf8")
    .digest()
    .subarray(0, 8);
  const text = Array.from(
    bytes,
    (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length],
  ).join("");
  return `${text.slice(0, 4)}-${text.slice(4)}`;
};

const projectPairing = (row: PairingRow): HelixConnectorPairing => ({
  schema: HELIX_CONNECTOR_PAIRING_SCHEMA,
  pairing_id: row.pairing_id,
  room_id: row.room_id,
  binding_id: row.binding_id,
  purpose: row.purpose as HelixConnectorPairingPurpose,
  domain_adapter: row.domain_adapter,
  world_id: row.world_id,
  source_label: row.source_label,
  command_credential_requested: row.command_credential_requested === true,
  status: row.status as HelixConnectorPairing["status"],
  expires_at: iso(row.expires_at),
  redeemed_at: isoOrNull(row.redeemed_at),
  revoked_at: isoOrNull(row.revoked_at),
  created_at: iso(row.created_at),
  updated_at: iso(row.updated_at),
  code_included: false,
  credential_included: false,
  content_role: "connector_pairing_control_not_assistant_answer",
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const defaultWorldId = (domainAdapter: string): string => {
  const profile = listEnvironmentAdapterProfiles().find((record) =>
    record.profile.accepted_domain_adapters.includes(domainAdapter),
  )?.profile;
  if (!profile) {
    throw new ConnectorBootstrapPairingError(
      "connector_pairing_invalid",
      400,
      "The environment adapter is not registered for connector pairing.",
    );
  }
  const prefix = profile.world_id_prefixes[0];
  if (!prefix) {
    throw new ConnectorBootstrapPairingError(
      "connector_pairing_invalid",
      400,
      "The adapter profile does not declare a world identity prefix.",
    );
  }
  return `${prefix}connector:${crypto.randomUUID().slice(0, 12)}`;
};

const expireStalePairings = async (db: Queryable, now: Date): Promise<void> => {
  const stale = await db.query<{ binding_id: string; purpose: string }>(
    `
      SELECT binding_id, purpose
      FROM helix_connector_pairing_codes
      WHERE status = 'pending' AND expires_at <= $1
      FOR UPDATE;
    `,
    [now.toISOString()],
  );
  if (stale.rows.length === 0) return;
  await db.query(
    `
      UPDATE helix_connector_pairing_codes
      SET status = 'expired', updated_at = $1
      WHERE status = 'pending' AND expires_at <= $1;
    `,
    [now.toISOString()],
  );
  const abandonedCreateBindings = stale.rows
    .filter((row) => row.purpose === "create")
    .map((row) => row.binding_id);
  for (const bindingId of abandonedCreateBindings) {
    await db.query(
      `
        UPDATE helix_room_source_bindings b
        SET status = 'revoked', revoked_at = $2, updated_at = $2
        WHERE b.binding_id = $1
          AND b.status = 'active'
          AND NOT EXISTS (
            SELECT 1 FROM helix_room_source_credentials c
            WHERE c.binding_id = b.binding_id AND c.status = 'active'
          );
      `,
      [bindingId, now.toISOString()],
    );
  }
};

const readOwnedBinding = async (input: {
  roomId: string;
  ownerProfileId: string;
  bindingId: string;
}): Promise<HelixRoomSourceBinding> => {
  const bindings = await listSharedRealtimeRoomSourceBindings({
    roomId: input.roomId,
    ownerProfileId: input.ownerProfileId,
  });
  const binding = bindings.find(
    (candidate) => candidate.binding_id === input.bindingId,
  );
  if (!binding) {
    throw new ConnectorBootstrapPairingError(
      "connector_pairing_not_found",
      404,
      "The room source binding was not found.",
    );
  }
  return binding;
};

export const createConnectorBootstrapPairing = async (input: {
  roomId: string;
  ownerProfileId: string;
  purpose: HelixConnectorPairingPurpose;
  bindingId?: string | null;
  worldId?: string | null;
  domainAdapter: string;
  sourceLabel?: string | null;
  credentialTtlMs?: number | null;
  commandCredentialRequested?: boolean;
  idempotencyKey: string;
  now?: Date;
}): Promise<{ pairing: HelixConnectorPairing; pairingCode: string }> => {
  const now = input.now ?? new Date();
  const idempotencyKey = normalize(input.idempotencyKey);
  if (idempotencyKey.length < 8 || idempotencyKey.length > 200) {
    throw new ConnectorBootstrapPairingError(
      "connector_pairing_invalid",
      400,
      "A caller-stable Idempotency-Key containing 8-200 characters is required.",
    );
  }
  const domainAdapter = normalize(input.domainAdapter);
  if (
    input.commandCredentialRequested === true &&
    (input.purpose !== "rotate" || domainAdapter !== "minecraft.fabric_mod.v1")
  ) {
    throw new ConnectorBootstrapPairingError(
      "connector_pairing_invalid",
      400,
      "Command access can be paired only to an existing Fabric source binding.",
    );
  }
  const credentialTtlMs = Math.min(
    Math.max(1, input.credentialTtlMs ?? DEFAULT_CREDENTIAL_TTL_MS),
    30 * 24 * 60 * 60 * 1_000,
  );
  const requestHash = secretHash(
    "helix.connector_pairing.create_request.v1",
    JSON.stringify({
      room_id: input.roomId,
      purpose: input.purpose,
      binding_id: normalize(input.bindingId) || null,
      world_id: normalize(input.worldId) || null,
      domain_adapter: domainAdapter,
      source_label: normalize(input.sourceLabel) || null,
      command_credential_requested: input.commandCredentialRequested === true,
      credential_ttl_ms: credentialTtlMs,
    }),
  );
  const idempotencyKeyHash = secretHash(
    "helix.connector_pairing.create_idempotency.v1",
    idempotencyKey,
  );
  const replayDb = await readSharedRealtimeRoomDatabase();
  const replay = await replayDb.query<PairingRow>(
    `
      SELECT * FROM helix_connector_pairing_codes
      WHERE owner_profile_id = $1 AND room_id = $2
        AND create_idempotency_key_hash = $3
      LIMIT 1;
    `,
    [input.ownerProfileId, input.roomId, idempotencyKeyHash],
  );
  if (replay.rows[0]) {
    const row = replay.rows[0];
    if (row.create_request_hash !== requestHash) {
      throw new ConnectorBootstrapPairingError(
        "connector_pairing_invalid",
        409,
        "The Idempotency-Key was already used for different pairing fields.",
      );
    }
    return {
      pairing: projectPairing(row),
      pairingCode: generatePairingCode({
        pairingId: row.pairing_id,
        idempotencyKey,
      }),
    };
  }
  let binding: HelixRoomSourceBinding;
  let createdBinding = false;
  if (input.purpose === "rotate") {
    binding = await readOwnedBinding({
      roomId: input.roomId,
      ownerProfileId: input.ownerProfileId,
      bindingId: normalize(input.bindingId),
    });
    if (
      binding.status !== "active" &&
      binding.status !== "expired"
    ) {
      throw new ConnectorBootstrapPairingError(
        "connector_pairing_revoked",
        410,
        "The source binding cannot be rotated because it is revoked or closed.",
      );
    }
    if (binding.domain_adapter !== domainAdapter) {
      throw new ConnectorBootstrapPairingError(
        "connector_pairing_identity_mismatch",
        409,
        "The requested adapter does not match the existing source binding.",
      );
    }
  } else {
    const worldId = normalize(input.worldId) || defaultWorldId(domainAdapter);
    binding = await createSharedRealtimeRoomSourceBindingWithoutCredential({
      roomId: input.roomId,
      ownerProfileId: input.ownerProfileId,
      worldId,
      domainAdapter,
      sourceLabel: input.sourceLabel,
      ttlMs: credentialTtlMs,
    });
    createdBinding = true;
  }

  const pairingId = `connector_pairing:${crypto.randomUUID()}`;
  const pairingCode = generatePairingCode({ pairingId, idempotencyKey });
  const expiresAt = new Date(
    now.getTime() + HELIX_CONNECTOR_PAIRING_CODE_TTL_MS,
  ).toISOString();
  try {
    const row = await withSharedRealtimeRoomTransaction(
      async (db: Queryable): Promise<PairingRow> => {
        await expireStalePairings(db, now);
        await db.query(
          `
            UPDATE helix_connector_pairing_codes
            SET status = 'revoked', revoked_at = $2, updated_at = $2
            WHERE binding_id = $1 AND status = 'pending';
          `,
          [binding.binding_id, now.toISOString()],
        );
        const inserted = await db.query<PairingRow>(
          `
            INSERT INTO helix_connector_pairing_codes (
              pairing_id, room_id, owner_profile_id, binding_id, purpose,
              domain_adapter, world_id, source_label, code_hash,
              create_idempotency_key_hash, create_request_hash,
              credential_ttl_ms, command_credential_requested,
              expires_at, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15
            )
            RETURNING *;
          `,
          [
            pairingId,
            input.roomId,
            input.ownerProfileId,
            binding.binding_id,
            input.purpose,
            binding.domain_adapter,
            binding.world_id,
            binding.source_label,
            pairingCodeHash(pairingCode),
            idempotencyKeyHash,
            requestHash,
            credentialTtlMs,
            input.commandCredentialRequested === true,
            expiresAt,
            now.toISOString(),
          ],
        );
        return inserted.rows[0]!;
      },
    );
    return { pairing: projectPairing(row), pairingCode };
  } catch (error) {
    if (createdBinding) {
      await revokeSharedRealtimeRoomSourceBinding({
        roomId: input.roomId,
        bindingId: binding.binding_id,
        ownerProfileId: input.ownerProfileId,
      }).catch(() => undefined);
    }
    throw error;
  }
};

export const listConnectorBootstrapPairings = async (input: {
  roomId: string;
  ownerProfileId: string;
  now?: Date;
}): Promise<HelixConnectorPairing[]> => {
  const now = input.now ?? new Date();
  await readOwnedBindingOwner(input.roomId, input.ownerProfileId);
  await withSharedRealtimeRoomTransaction((db: Queryable) =>
    expireStalePairings(db, now),
  );
  const db = await readSharedRealtimeRoomDatabase();
  const result = await db.query<PairingRow>(
    `
      SELECT * FROM helix_connector_pairing_codes
      WHERE room_id = $1 AND owner_profile_id = $2
      ORDER BY created_at DESC;
    `,
    [input.roomId, input.ownerProfileId],
  );
  return result.rows.map(projectPairing);
};

const readOwnedBindingOwner = async (
  roomId: string,
  ownerProfileId: string,
): Promise<void> => {
  const db = await readSharedRealtimeRoomDatabase();
  const result = await db.query<{ owner_profile_id: string; status: string }>(
    `
      SELECT owner_profile_id, status
      FROM helix_shared_realtime_rooms
      WHERE room_id = $1
      LIMIT 1;
    `,
    [roomId],
  );
  if (!result.rows[0] || result.rows[0].owner_profile_id !== ownerProfileId) {
    throw new ConnectorBootstrapPairingError(
      "connector_pairing_forbidden",
      403,
      "Only the room owner can manage connector pairing.",
    );
  }
  if (result.rows[0].status === "closed") {
    throw new ConnectorBootstrapPairingError(
      "connector_pairing_revoked",
      410,
      "The room is closed.",
    );
  }
};

export const revokeConnectorBootstrapPairing = async (input: {
  roomId: string;
  ownerProfileId: string;
  pairingId: string;
  now?: Date;
}): Promise<HelixConnectorPairing> => {
  const now = input.now ?? new Date();
  await readOwnedBindingOwner(input.roomId, input.ownerProfileId);
  const result = await withSharedRealtimeRoomTransaction(
    async (db: Queryable): Promise<{ row: PairingRow; revokeBinding: boolean }> => {
      const selected = await db.query<PairingRow>(
        `
          SELECT * FROM helix_connector_pairing_codes
          WHERE pairing_id = $1 AND room_id = $2 AND owner_profile_id = $3
          LIMIT 1 FOR UPDATE;
        `,
        [input.pairingId, input.roomId, input.ownerProfileId],
      );
      const row = selected.rows[0];
      if (!row) {
        throw new ConnectorBootstrapPairingError(
          "connector_pairing_not_found",
          404,
          "Connector pairing was not found.",
        );
      }
      if (row.status === "redeemed") {
        throw new ConnectorBootstrapPairingError(
          "connector_pairing_already_redeemed",
          409,
          "The pairing was already redeemed; revoke the source binding to disconnect it.",
        );
      }
      const updated = await db.query<PairingRow>(
        `
          UPDATE helix_connector_pairing_codes
          SET status = 'revoked', revoked_at = $2, updated_at = $2
          WHERE pairing_id = $1
          RETURNING *;
        `,
        [input.pairingId, now.toISOString()],
      );
      return {
        row: updated.rows[0]!,
        revokeBinding: row.purpose === "create",
      };
    },
  );
  if (result.revokeBinding) {
    await revokeSharedRealtimeRoomSourceBinding({
      roomId: input.roomId,
      bindingId: result.row.binding_id,
      ownerProfileId: input.ownerProfileId,
    });
  }
  return projectPairing(result.row);
};

export const redeemConnectorBootstrapPairing = async (input: {
  pairingCode: string;
  redemptionNonce: string;
  domainAdapter: string;
  connectorKind: string;
  connectorVersion: string;
  pairingEndpoint: string;
  now?: Date;
}): Promise<{
  pairingId: string;
  binding: HelixRoomSourceBinding;
  pluginConfig:
    | (HelixRoomSourcePluginConfig & { pairing_endpoint: string })
    | {
        pairing_mode: "command_only";
        pairing_endpoint: string;
        source_id: string;
        room_id: string;
        world_id: string;
        domain_adapter: string;
        command: HelixEnvironmentCommandConnectorConfig;
      };
  replayed: boolean;
}> => {
  const now = input.now ?? new Date();
  const pairingCode = normalize(input.pairingCode).toUpperCase();
  if (
    !HELIX_CONNECTOR_PAIRING_CODE_PATTERN.test(pairingCode) ||
    !/^[a-zA-Z0-9_-]{32,160}$/.test(normalize(input.redemptionNonce))
  ) {
    throw new ConnectorBootstrapPairingError(
      "connector_pairing_invalid",
      400,
      "The connector pairing request is invalid.",
    );
  }
  const nonceHash = redemptionNonceHash(input.redemptionNonce);
  const outcome = await withSharedRealtimeRoomTransaction(
    async (db: Queryable): Promise<{
      row: PairingRow;
      binding: HelixRoomSourceBinding | null;
      tokenValue: string;
      replayed: boolean;
    }> => {
      await expireStalePairings(db, now);
      const selected = await db.query<PairingRow>(
        `
          SELECT * FROM helix_connector_pairing_codes
          WHERE code_hash = $1
          LIMIT 1 FOR UPDATE;
        `,
        [pairingCodeHash(pairingCode)],
      );
      const row = selected.rows[0];
      if (!row) {
        throw new ConnectorBootstrapPairingError(
          "connector_pairing_not_found",
          404,
          "The pairing code is invalid or no longer available.",
        );
      }
      if (row.status === "expired" || Date.parse(iso(row.expires_at)) <= now.getTime()) {
        throw new ConnectorBootstrapPairingError(
          "connector_pairing_expired",
          410,
          "The pairing code expired. Create a new code in the room.",
        );
      }
      if (row.status === "revoked") {
        throw new ConnectorBootstrapPairingError(
          "connector_pairing_revoked",
          410,
          "The pairing code was revoked.",
        );
      }
      if (
        row.domain_adapter !== normalize(input.domainAdapter) ||
        normalize(input.connectorKind) !== row.domain_adapter
      ) {
        const nextAttempts = Number(row.attempt_count) + 1;
        await db.query(
          `
            UPDATE helix_connector_pairing_codes
            SET attempt_count = $2,
                status = CASE WHEN $2 >= $3 THEN 'revoked' ELSE status END,
                revoked_at = CASE WHEN $2 >= $3 THEN $4 ELSE revoked_at END,
                updated_at = $4
            WHERE pairing_id = $1;
          `,
          [row.pairing_id, nextAttempts, MAX_REDEEM_ATTEMPTS, now.toISOString()],
        );
        throw new ConnectorBootstrapPairingError(
          nextAttempts >= MAX_REDEEM_ATTEMPTS
            ? "connector_pairing_rate_limited"
            : "connector_pairing_identity_mismatch",
          nextAttempts >= MAX_REDEEM_ATTEMPTS ? 429 : 409,
          "The connector identity does not match this pairing code.",
        );
      }
      const tokenValue = deriveSourceCredential({
        pairingId: row.pairing_id,
        pairingCode,
        redemptionNonce: input.redemptionNonce,
      });
      if (row.status === "redeemed") {
        if (
          row.redemption_nonce_hash !== nonceHash ||
          row.connector_kind !== normalize(input.connectorKind) ||
          row.connector_version !== normalize(input.connectorVersion) ||
          !row.replay_expires_at ||
          Date.parse(iso(row.replay_expires_at)) <= now.getTime() ||
          (!row.command_credential_requested && !row.redeemed_credential_id)
        ) {
          throw new ConnectorBootstrapPairingError(
            "connector_pairing_already_redeemed",
            409,
            "The one-time pairing code was already redeemed.",
          );
        }
        if (row.command_credential_requested) {
          return { row, binding: null, tokenValue: "", replayed: true };
        }
        const credential = await db.query<{ credential_id: string }>(
          `
            SELECT credential_id
            FROM helix_room_source_credentials
            WHERE credential_id = $1 AND binding_id = $2
              AND token_hash = $3 AND status = 'active' AND expires_at > $4
            LIMIT 1;
          `,
          [
            row.redeemed_credential_id,
            row.binding_id,
            crypto.createHash("sha256").update(tokenValue, "utf8").digest("hex"),
            now.toISOString(),
          ],
        );
        if (!credential.rows[0]) {
          throw new ConnectorBootstrapPairingError(
            "connector_pairing_already_redeemed",
            409,
            "The redeemed credential is no longer active.",
          );
        }
        return { row, binding: null, tokenValue, replayed: true };
      }
      if (row.command_credential_requested) {
        const replayExpiresAt = new Date(
          now.getTime() + HELIX_CONNECTOR_PAIRING_REPLAY_TTL_MS,
        ).toISOString();
        const updated = await db.query<PairingRow>(
          `
            UPDATE helix_connector_pairing_codes
            SET status = 'redeemed', redemption_nonce_hash = $2,
                connector_kind = $3, connector_version = $4,
                replay_expires_at = $5, redeemed_at = $6, updated_at = $6
            WHERE pairing_id = $1
            RETURNING *;
          `,
          [
            row.pairing_id,
            nonceHash,
            normalize(input.connectorKind),
            normalize(input.connectorVersion),
            replayExpiresAt,
            now.toISOString(),
          ],
        );
        return {
          row: updated.rows[0]!,
          binding: null,
          tokenValue: "",
          replayed: false,
        };
      }
      const persisted =
        await persistSharedRealtimeRoomSourceCredentialForTrustedClaim(
          {
            bindingId: row.binding_id,
            roomId: row.room_id,
            sourceId: (
              await db.query<{ source_id: string }>(
                `SELECT source_id FROM helix_room_source_bindings WHERE binding_id = $1 LIMIT 1;`,
                [row.binding_id],
              )
            ).rows[0]?.source_id ?? "",
            ownerProfileId: row.owner_profile_id,
            purpose: row.purpose as HelixConnectorPairingPurpose,
            credentialTtlMs: Number(row.credential_ttl_ms),
            trustedCredentialSecret: tokenValue,
          },
          db,
        );
      const replayExpiresAt = new Date(
        now.getTime() + HELIX_CONNECTOR_PAIRING_REPLAY_TTL_MS,
      ).toISOString();
      const updated = await db.query<PairingRow>(
        `
          UPDATE helix_connector_pairing_codes
          SET status = 'redeemed', redemption_nonce_hash = $2,
              redeemed_credential_id = $3, connector_kind = $4,
              connector_version = $5, replay_expires_at = $6,
              redeemed_at = $7, updated_at = $7
          WHERE pairing_id = $1
          RETURNING *;
        `,
        [
          row.pairing_id,
          nonceHash,
          persisted.binding.credential_id,
          normalize(input.connectorKind),
          normalize(input.connectorVersion),
          replayExpiresAt,
          now.toISOString(),
        ],
      );
      return {
        row: updated.rows[0]!,
        binding: persisted.binding,
        tokenValue,
        replayed: false,
      };
    },
  );
  const binding =
    outcome.binding ??
    (await readOwnedBinding({
      roomId: outcome.row.room_id,
      ownerProfileId: outcome.row.owner_profile_id,
      bindingId: outcome.row.binding_id,
    }));
  let commandConfig;
  if (outcome.row.command_credential_requested === true) {
    const db = await readSharedRealtimeRoomDatabase();
    const environment = await db.query<{ environment_binding_id: string }>(
      `SELECT environment_binding_id
       FROM helix_environment_connector_bindings
       WHERE room_id = $1 AND room_source_binding_id = $2 AND status = 'active'
       ORDER BY updated_at DESC
       LIMIT 1;`,
      [binding.room_id, binding.binding_id],
    );
    const environmentBindingId = environment.rows[0]?.environment_binding_id;
    if (!environmentBindingId) {
      throw new ConnectorBootstrapPairingError(
        "connector_pairing_unavailable",
        409,
        "The paired source is not yet an admitted room environment. Wait for its manifest, then create a new command pairing code.",
      );
    }
    commandConfig = await issueEnvironmentCommandConnectorCredentialForPairing({
      roomId: binding.room_id,
      ownerProfileId: outcome.row.owner_profile_id,
      environmentBindingId,
      publicBaseUrl: publicBaseUrlForPairing(input.pairingEndpoint),
      pairingId: outcome.row.pairing_id,
      trustedCredentialSecret: deriveCommandCredential({
        pairingId: outcome.row.pairing_id,
        pairingCode,
        redemptionNonce: input.redemptionNonce,
      }),
      ttlMs: Number(outcome.row.credential_ttl_ms),
    });
  }
  if (commandConfig) {
    return {
      pairingId: outcome.row.pairing_id,
      binding,
      replayed: outcome.replayed,
      pluginConfig: {
        pairing_mode: "command_only",
        pairing_endpoint: input.pairingEndpoint,
        source_id: binding.source_id,
        room_id: binding.room_id,
        world_id: binding.world_id,
        domain_adapter: binding.domain_adapter,
        command: commandConfig,
      },
    };
  }
  return {
    pairingId: outcome.row.pairing_id,
    binding,
    replayed: outcome.replayed,
    pluginConfig: {
      // The connector has just proven that it can reach the pairing origin.
      // Reuse that same public origin for room ingress instead of projecting a
      // deployment-wide base URL that may name an internal dev/proxy port.
      endpoint: ingressEndpointForPairing({
        pairingEndpoint: input.pairingEndpoint,
        bindingId: binding.binding_id,
      }),
      pairing_endpoint: input.pairingEndpoint,
      bearer_token: outcome.tokenValue,
      source_id: binding.source_id,
      room_id: binding.room_id,
      world_id: binding.world_id,
      domain_adapter: binding.domain_adapter,
      execution_enabled: false,
    },
  };
};

export const unpairConnectorBootstrapBinding = async (input: {
  bindingId: string;
  bearerToken: string;
}): Promise<HelixRoomSourceBinding> =>
  revokeSharedRealtimeRoomSourceBindingByCredential(input);

export const resetConnectorBootstrapPairingStoreForTest = async (): Promise<void> => {
  const db = await readSharedRealtimeRoomDatabase();
  await db.query("DELETE FROM helix_connector_pairing_codes;");
};
