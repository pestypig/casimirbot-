import crypto from "node:crypto";
import {
  HELIX_ROOM_CAPABILITY_NON_AUTHORITATIVE_FIELDS,
  HELIX_ROOM_SHARED_CAPABILITY_CONNECTION_SCHEMA,
  HELIX_ROOM_SHARED_CAPABILITY_LIST_SCHEMA,
  HELIX_ROOM_SHARED_CAPABILITY_SCHEMA,
  helixRoomSharedCapabilityConnectionSchema,
  helixRoomSharedCapabilityListSchema,
  helixRoomSharedCapabilitySchema,
  type HelixRoomSharedCapability,
  type HelixRoomSharedCapabilityConnection,
  type HelixRoomSharedCapabilityList,
} from "@shared/helix-room-capability-grant";
import {
  readSharedRealtimeRoomDatabase,
  withSharedRealtimeRoomTransaction,
} from "../../helix-ask/realtime-room/room-store/database";
import type { Queryable } from
  "../../helix-ask/realtime-room/room-store/types";
import { installedDeviceRef } from "../../helix-account/installed-security-store";

const MAX_GRANT_MINUTES = 24 * 60;
const DEFAULT_STALE_AFTER_MS = 120_000;

export type RoomReadGrantStoreErrorCode =
  | "room_read_connection_not_found"
  | "room_read_connection_inactive"
  | "room_read_capability_not_granted"
  | "room_read_grant_conflict"
  | "room_read_grant_not_found"
  | "room_read_grant_inactive"
  | "room_read_grant_expired"
  | "room_read_grant_identity_mismatch";

export class RoomReadGrantStoreError extends Error {
  constructor(
    readonly code: RoomReadGrantStoreErrorCode,
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "RoomReadGrantStoreError";
  }
}

type ConnectionRow = {
  environment_binding_id: string;
  owner_profile_id: string;
  owner_label: string;
  installation_id: string;
  installed_device_id: string | null;
  installed_device_status: string | null;
  installed_device_recovery_generation: number | string | null;
  device_id: string;
  package_id: string;
  room_id: string;
  source_id: string;
  world_id: string;
  producer_epoch_ref: string | null;
  consent_capability_ids: unknown;
  installation_status: string;
  binding_status: string;
  device_status: string;
  device_health: string;
  last_contact_at: Date | string | null;
  admission_status: string;
  credential_status: string | null;
  credential_expires_at: Date | string | null;
};

type GrantRow = ConnectionRow & {
  grant_id: string;
  grant_status: string;
  policy_revision: number | string;
  grant_producer_epoch_ref: string;
  grant_installed_node_ref: string;
  capability_ids: unknown;
  created_at: Date | string;
  expires_at: Date | string;
  revoked_at: Date | string | null;
  member_count: number | string;
};

const iso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const isoOrNull = (value: Date | string | null): string | null =>
  value === null ? null : iso(value);

const stringArray = (value: unknown): string[] => {
  const parsed = typeof value === "string"
    ? (() => {
        try {
          return JSON.parse(value) as unknown;
        } catch {
          return [];
        }
      })()
    : value;
  return Array.isArray(parsed)
    ? Array.from(new Set(parsed.filter((item): item is string =>
        typeof item === "string" && item.trim().length > 0))).sort()
    : [];
};

const installedNodeProjection = (row: ConnectionRow): string =>
  row.installed_device_id
    ? installedDeviceRef(row.installed_device_id)
    : "installed_node:unbound";

const healthProjection = (row: ConnectionRow, now: Date) => {
  const lastObservedAt = isoOrNull(row.last_contact_at);
  const ageMs = lastObservedAt
    ? Math.max(0, now.getTime() - Date.parse(lastObservedAt))
    : null;
  const freshness = ageMs === null
    ? "never_observed" as const
    : ageMs <= DEFAULT_STALE_AFTER_MS
      ? "fresh" as const
      : "stale" as const;
  const blockers: string[] = [];
  if (row.installation_status !== "active") blockers.push("installation_inactive");
  if (!row.installed_device_id) blockers.push("installed_node_unbound");
  else if (row.installed_device_status !== "active") {
    blockers.push("installed_node_inactive");
  }
  if (row.binding_status !== "active") blockers.push("binding_inactive");
  if (row.device_status !== "active") blockers.push("device_inactive");
  if (row.admission_status !== "active") blockers.push("adapter_admission_inactive");
  if (!row.credential_status) blockers.push("credential_missing");
  else if (row.credential_status !== "active") blockers.push("credential_inactive");
  if (
    row.credential_expires_at &&
    Date.parse(iso(row.credential_expires_at)) <= now.getTime()
  ) blockers.push("credential_expired");
  if (!row.producer_epoch_ref) blockers.push("producer_epoch_missing");
  if (freshness === "never_observed") blockers.push("contact_never_observed");
  if (freshness === "stale") blockers.push("contact_stale");
  if (row.device_health !== "online") {
    blockers.push(`connector_health_${row.device_health}`);
  }
  const health = blockers.some((item) =>
    item === "device_inactive" || item === "contact_stale")
    ? "offline" as const
    : ["online", "degraded", "offline", "unknown"].includes(row.device_health)
      ? row.device_health as "online" | "degraded" | "offline" | "unknown"
      : "unknown" as const;
  return { lastObservedAt, freshness, blockers, health };
};

const connectionProjection = (
  row: ConnectionRow,
  now: Date,
): HelixRoomSharedCapabilityConnection => {
  const state = healthProjection(row, now);
  return helixRoomSharedCapabilityConnectionSchema.parse({
    schema: HELIX_ROOM_SHARED_CAPABILITY_CONNECTION_SCHEMA,
    owner_profile_ref: row.owner_profile_id,
    owner_label: row.owner_label,
    installed_node_ref: installedNodeProjection(row),
    connection_ref: row.environment_binding_id,
    environment_ref: row.environment_binding_id,
    environment_label: row.package_id,
    source_ref: row.source_id,
    world_or_site_ref: row.world_id,
    producer_epoch_ref: row.producer_epoch_ref ?? "producer_epoch:missing",
    capability_ids: stringArray(row.consent_capability_ids),
    grant_mode: "read",
    action_class: "none",
    health: state.health,
    freshness: state.freshness,
    last_observed_at: state.lastObservedAt,
    blocking_reasons: state.blockers,
    ready: state.blockers.length === 0,
    owner_controls_visible: true,
    ...HELIX_ROOM_CAPABILITY_NON_AUTHORITATIVE_FIELDS,
  });
};

const grantProjection = (input: {
  row: GrantRow;
  requestingProfileId: string;
  now: Date;
}): HelixRoomSharedCapability => {
  const { row, now } = input;
  const state = healthProjection(row, now);
  const expired = Date.parse(iso(row.expires_at)) <= now.getTime();
  const epochChanged = row.producer_epoch_ref !== row.grant_producer_epoch_ref;
  const blockers = [...state.blockers];
  if (row.grant_status === "revoked") blockers.push("grant_revoked");
  if (expired) blockers.push("grant_expired");
  if (epochChanged) blockers.push("producer_epoch_changed");
  const status = row.grant_status === "revoked"
    ? "revoked" as const
    : expired
      ? "expired" as const
      : "active" as const;
  return helixRoomSharedCapabilitySchema.parse({
    schema: HELIX_ROOM_SHARED_CAPABILITY_SCHEMA,
    grant_ref: row.grant_id,
    room_id: row.room_id,
    owner_profile_ref: row.owner_profile_id,
    owner_label: row.owner_label,
    installed_node_ref: row.grant_installed_node_ref,
    connection_ref: row.environment_binding_id,
    environment_ref: row.environment_binding_id,
    environment_label: row.package_id,
    source_ref: row.source_id,
    world_or_site_ref: row.world_id,
    producer_epoch_ref: row.grant_producer_epoch_ref,
    capability_ids: stringArray(row.capability_ids),
    grant_mode: "read",
    action_class: "none",
    status,
    policy_revision: Number(row.policy_revision),
    member_count: Number(row.member_count),
    health: state.health,
    freshness: state.freshness,
    last_observed_at: state.lastObservedAt,
    blocking_reasons: Array.from(new Set(blockers)).sort(),
    ready: status === "active" && blockers.length === 0,
    created_at: iso(row.created_at),
    expires_at: iso(row.expires_at),
    revoked_at: isoOrNull(row.revoked_at),
    owner_controls_visible: input.requestingProfileId === row.owner_profile_id,
    ...HELIX_ROOM_CAPABILITY_NON_AUTHORITATIVE_FIELDS,
  });
};

const connectionSelect = `
  SELECT
    b.environment_binding_id,
    b.owner_profile_id,
    account.display_name AS owner_label,
    b.installation_id,
    installation.installed_device_id,
    installed_device.status AS installed_device_status,
    installed_device.recovery_generation AS installed_device_recovery_generation,
    b.device_id,
    connector_package.package_id,
    b.room_id,
    b.source_id,
    b.world_id,
    device.producer_epoch_ref,
    b.consent_capability_ids,
    installation.status AS installation_status,
    b.status AS binding_status,
    device.status AS device_status,
    device.health_status AS device_health,
    device.last_contact_at,
    admission.status AS admission_status,
    COALESCE(device_credential.status, source_credential.status) AS credential_status,
    COALESCE(device_credential.expires_at, source_credential.expires_at) AS credential_expires_at
  FROM helix_environment_connector_bindings b
  JOIN helix_accounts account ON account.profile_id = b.owner_profile_id
  JOIN helix_environment_connector_installations installation
    ON installation.installation_id = b.installation_id
  JOIN helix_environment_connector_packages connector_package
    ON connector_package.package_version_id = installation.package_version_id
  LEFT JOIN helix_installed_devices installed_device
    ON installed_device.profile_id = installation.owner_profile_id
   AND installed_device.device_id = installation.installed_device_id
  JOIN helix_environment_connector_devices device ON device.device_id = b.device_id
  JOIN helix_environment_adapter_admissions admission
    ON admission.admission_id = b.adapter_admission_id
  LEFT JOIN helix_environment_connector_device_credentials device_credential
    ON device_credential.device_credential_id = device.credential_ref
  LEFT JOIN helix_room_source_credentials source_credential
    ON source_credential.credential_id = device.credential_ref
   AND source_credential.binding_id = b.room_source_binding_id
`;

const listConnectionRows = async (input: {
  db: Queryable;
  roomId: string;
  ownerProfileId: string;
}): Promise<ConnectionRow[]> => (await input.db.query<ConnectionRow>(
  `${connectionSelect}
   WHERE b.room_id = $1 AND b.owner_profile_id = $2
   ORDER BY b.created_at DESC;`,
  [input.roomId, input.ownerProfileId],
)).rows;

const grantSelect = `
  SELECT
    binding.environment_binding_id,
    binding.owner_profile_id,
    account.display_name AS owner_label,
    binding.installation_id,
    installation.installed_device_id,
    installed_device.status AS installed_device_status,
    installed_device.recovery_generation AS installed_device_recovery_generation,
    binding.device_id,
    connector_package.package_id,
    binding.room_id,
    binding.source_id,
    binding.world_id,
    device.producer_epoch_ref,
    binding.consent_capability_ids,
    installation.status AS installation_status,
    binding.status AS binding_status,
    device.status AS device_status,
    device.health_status AS device_health,
    device.last_contact_at,
    admission.status AS admission_status,
    COALESCE(device_credential.status, source_credential.status) AS credential_status,
    COALESCE(device_credential.expires_at, source_credential.expires_at) AS credential_expires_at,
    room_grant.grant_id, room_grant.status AS grant_status,
    room_grant.policy_revision,
    room_grant.producer_epoch_ref AS grant_producer_epoch_ref,
    room_grant.installed_node_ref AS grant_installed_node_ref,
    room_grant.capability_ids, room_grant.created_at, room_grant.expires_at,
    room_grant.revoked_at
  FROM helix_room_environment_capability_grants room_grant
  JOIN helix_environment_connector_bindings binding
    ON binding.environment_binding_id = room_grant.environment_binding_id
  JOIN helix_accounts account ON account.profile_id = binding.owner_profile_id
  JOIN helix_environment_connector_installations installation
    ON installation.installation_id = binding.installation_id
  JOIN helix_environment_connector_packages connector_package
    ON connector_package.package_version_id = installation.package_version_id
  LEFT JOIN helix_installed_devices installed_device
    ON installed_device.profile_id = installation.owner_profile_id
   AND installed_device.device_id = installation.installed_device_id
  JOIN helix_environment_connector_devices device
    ON device.device_id = binding.device_id
  JOIN helix_environment_adapter_admissions admission
    ON admission.admission_id = binding.adapter_admission_id
  LEFT JOIN helix_environment_connector_device_credentials device_credential
    ON device_credential.device_credential_id = device.credential_ref
  LEFT JOIN helix_room_source_credentials source_credential
    ON source_credential.credential_id = device.credential_ref
   AND source_credential.binding_id = binding.room_source_binding_id
`;

export const listRoomSharedCapabilities = async (input: {
  roomId: string;
  requestingProfileId: string;
  requestingIsOwner: boolean;
  now?: Date;
}): Promise<HelixRoomSharedCapabilityList> => {
  const db = await readSharedRealtimeRoomDatabase();
  const now = input.now ?? new Date();
  const memberCount = Number((await db.query<{ member_count: number | string }>(
    `SELECT count(*) AS member_count
     FROM helix_shared_realtime_room_members
     WHERE room_id = $1 AND presence <> 'left';`,
    [input.roomId],
  )).rows[0]?.member_count ?? 0);
  const grants = (await db.query<Omit<GrantRow, "member_count">>(
    `${grantSelect}
     WHERE room_grant.room_id = $1
     ORDER BY room_grant.created_at DESC;`,
    [input.roomId],
  )).rows.map((row) => grantProjection({
    row: { ...row, member_count: memberCount },
    requestingProfileId: input.requestingProfileId,
    now,
  }));
  const available = input.requestingIsOwner
    ? (await listConnectionRows({
        db,
        roomId: input.roomId,
        ownerProfileId: input.requestingProfileId,
      })).map((row) => connectionProjection(row, now))
    : [];
  return helixRoomSharedCapabilityListSchema.parse({
    schema: HELIX_ROOM_SHARED_CAPABILITY_LIST_SCHEMA,
    room_id: input.roomId,
    grants,
    available_connections: available,
    generated_at: now.toISOString(),
    ...HELIX_ROOM_CAPABILITY_NON_AUTHORITATIVE_FIELDS,
  });
};

export const createRoomReadGrant = async (input: {
  roomId: string;
  ownerProfileId: string;
  ownerParticipantId: string;
  connectionRef: string;
  capabilityIds: readonly string[];
  expiresInMinutes: number;
  now?: Date;
}): Promise<HelixRoomSharedCapability> => {
  const now = input.now ?? new Date();
  const expiresInMinutes = Math.max(
    5,
    Math.min(MAX_GRANT_MINUTES, Math.floor(input.expiresInMinutes)),
  );
  const capabilityIds = Array.from(new Set(input.capabilityIds)).sort();
  if (capabilityIds.length === 0) {
    throw new RoomReadGrantStoreError(
      "room_read_capability_not_granted", 400,
      "Select at least one read capability.",
    );
  }
  const grantId = `room_capability_grant:${crypto.randomUUID()}`;
  await withSharedRealtimeRoomTransaction(async (db) => {
    const rows = await listConnectionRows({
      db,
      roomId: input.roomId,
      ownerProfileId: input.ownerProfileId,
    });
    const row = rows.find((item) => item.environment_binding_id === input.connectionRef);
    if (!row) {
      throw new RoomReadGrantStoreError(
        "room_read_connection_not_found", 404,
        "The selected profile connection is not attached to this room.",
      );
    }
    const state = healthProjection(row, now);
    if (state.blockers.length > 0 || !row.producer_epoch_ref) {
      throw new RoomReadGrantStoreError(
        "room_read_connection_inactive", 409,
        "The selected profile connection is not ready for a room grant.",
      );
    }
    const available = stringArray(row.consent_capability_ids);
    if (capabilityIds.some((id) => !available.includes(id))) {
      throw new RoomReadGrantStoreError(
        "room_read_capability_not_granted", 403,
        "The requested capability is outside the connection's read consent.",
      );
    }
    await db.query(
      `UPDATE helix_room_environment_capability_grants
       SET status = 'revoked', revoked_at = $3
       WHERE room_id = $1 AND environment_binding_id = $2
         AND status = 'active' AND expires_at <= $3;`,
      [input.roomId, row.environment_binding_id, now.toISOString()],
    );
    const active = await db.query<{ grant_id: string }>(
      `SELECT grant_id FROM helix_room_environment_capability_grants
       WHERE room_id = $1 AND environment_binding_id = $2
         AND status = 'active' AND expires_at > $3
       LIMIT 1 FOR UPDATE;`,
      [input.roomId, row.environment_binding_id, now.toISOString()],
    );
    if (active.rows[0]) {
      throw new RoomReadGrantStoreError(
        "room_read_grant_conflict", 409,
        "This connection already has an active room grant.",
      );
    }
    await db.query(
      `INSERT INTO helix_room_environment_capability_grants (
        grant_id, room_id, connection_owner_profile_id,
        environment_binding_id, installation_id, installed_node_ref, device_id, source_id,
        world_or_site_ref, producer_epoch_ref, capability_ids, grant_mode,
        status, policy_revision, created_by_participant_id, created_at,
        expires_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,'read','active',1,$12,$13,$14);`,
      [
        grantId, input.roomId, input.ownerProfileId,
        row.environment_binding_id, row.installation_id,
        installedNodeProjection(row), row.device_id, row.source_id,
        row.world_id, row.producer_epoch_ref, JSON.stringify(capabilityIds),
        input.ownerParticipantId,
        now.toISOString(),
        new Date(now.getTime() + expiresInMinutes * 60_000).toISOString(),
      ],
    );
  });
  const projection = await listRoomSharedCapabilities({
    roomId: input.roomId,
    requestingProfileId: input.ownerProfileId,
    requestingIsOwner: true,
    now,
  });
  const grant = projection.grants.find((item) => item.grant_ref === grantId);
  if (!grant) {
    throw new RoomReadGrantStoreError(
      "room_read_grant_not_found", 503,
      "The new room grant could not be projected.",
    );
  }
  return grant;
};

export const revokeRoomReadGrant = async (input: {
  roomId: string;
  ownerProfileId: string;
  grantRef: string;
  now?: Date;
}): Promise<HelixRoomSharedCapability> => {
  const now = input.now ?? new Date();
  const db = await readSharedRealtimeRoomDatabase();
  const updated = await db.query<{ grant_id: string }>(
    `UPDATE helix_room_environment_capability_grants
     SET status = 'revoked', revoked_at = $4
     WHERE grant_id = $1 AND room_id = $2
       AND connection_owner_profile_id = $3 AND status = 'active'
     RETURNING grant_id;`,
    [input.grantRef, input.roomId, input.ownerProfileId, now.toISOString()],
  );
  if (!updated.rows[0]) {
    throw new RoomReadGrantStoreError(
      "room_read_grant_not_found", 404,
      "No active owner-controlled room grant matched that reference.",
    );
  }
  const projection = await listRoomSharedCapabilities({
    roomId: input.roomId,
    requestingProfileId: input.ownerProfileId,
    requestingIsOwner: true,
    now,
  });
  return projection.grants.find((item) => item.grant_ref === input.grantRef)!;
};

export const authorizeRoomReadGrant = async (input: {
  roomId: string;
  requestingProfileId: string;
  requestingParticipantId: string;
  connectionOwnerProfileId: string;
  connectionRef: string;
  installedNodeRef: string;
  sourceRef: string;
  producerEpochRef: string;
  capabilityId: string;
  turnId: string;
  toolCallId: string;
  now?: Date;
}): Promise<{ basis: "connection_owner" | "room_grant"; grantRef: string | null; policyRevision: number }> => {
  const now = input.now ?? new Date();
  const db = await readSharedRealtimeRoomDatabase();
  const connectionRows = await listConnectionRows({
    db,
    roomId: input.roomId,
    ownerProfileId: input.connectionOwnerProfileId,
  });
  const connection = connectionRows.find((row) =>
    row.environment_binding_id === input.connectionRef &&
    installedNodeProjection(row) === input.installedNodeRef &&
    row.source_id === input.sourceRef &&
    row.producer_epoch_ref === input.producerEpochRef &&
    stringArray(row.consent_capability_ids).includes(input.capabilityId)
  );
  if (!connection || healthProjection(connection, now).blockers.length > 0) {
    throw new RoomReadGrantStoreError(
      "room_read_grant_identity_mismatch", 403,
      "The requested read does not match one current installed-node connection.",
    );
  }
  const membership = await db.query<{ present: boolean }>(
    `SELECT true AS present
     FROM helix_shared_realtime_room_members
     WHERE room_id = $1 AND profile_id = $2 AND participant_id = $3
       AND presence <> 'left'
     LIMIT 1;`,
    [input.roomId, input.requestingProfileId, input.requestingParticipantId],
  );
  if (!membership.rows[0]?.present) {
    throw new RoomReadGrantStoreError(
      "room_read_grant_identity_mismatch", 403,
      "The requesting participant is not a current member of this room.",
    );
  }
  if (input.requestingProfileId === input.connectionOwnerProfileId) {
    return { basis: "connection_owner", grantRef: null, policyRevision: 1 };
  }
  const result = await db.query<{
    grant_id: string;
    policy_revision: number | string;
    expires_at: Date | string;
  }>(
    `SELECT room_grant.grant_id, room_grant.policy_revision,
       room_grant.expires_at
     FROM helix_room_environment_capability_grants room_grant
     JOIN helix_shared_realtime_room_members member
       ON member.room_id = room_grant.room_id
       AND member.profile_id = $2
       AND member.participant_id = $3
       AND member.presence <> 'left'
     WHERE room_grant.room_id = $1
       AND room_grant.connection_owner_profile_id = $4
       AND room_grant.environment_binding_id = $5
       AND room_grant.installed_node_ref = $6
       AND room_grant.source_id = $7
       AND room_grant.producer_epoch_ref = $8
       AND room_grant.capability_ids @> $9::jsonb
       AND room_grant.status = 'active'
     ORDER BY room_grant.created_at DESC
     LIMIT 1;`,
    [
      input.roomId, input.requestingProfileId,
      input.requestingParticipantId, input.connectionOwnerProfileId,
      input.connectionRef, input.installedNodeRef, input.sourceRef,
      input.producerEpochRef, JSON.stringify([input.capabilityId]),
    ],
  );
  const grant = result.rows[0];
  if (!grant) {
    throw new RoomReadGrantStoreError(
      "room_read_grant_not_found", 403,
      "This room member does not have the exact owner-granted read capability.",
    );
  }
  if (Date.parse(iso(grant.expires_at)) <= now.getTime()) {
    throw new RoomReadGrantStoreError(
      "room_read_grant_expired", 403,
      "The room read grant has expired.",
    );
  }
  const policyRevision = Number(grant.policy_revision);
  await db.query(
    `INSERT INTO helix_room_environment_capability_grant_audit (
      audit_id, grant_id, room_id, requesting_profile_id,
      requesting_participant_id, capability_id, turn_id, tool_call_id,
      policy_revision, outcome, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'admitted',$10);`,
    [
      `room_capability_grant_audit:${crypto.randomUUID()}`,
      grant.grant_id, input.roomId, input.requestingProfileId,
      input.requestingParticipantId, input.capabilityId,
      input.turnId, input.toolCallId, policyRevision, now.toISOString(),
    ],
  );
  return { basis: "room_grant", grantRef: grant.grant_id, policyRevision };
};
