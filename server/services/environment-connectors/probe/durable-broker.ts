import crypto from "node:crypto";
import {
  HELIX_ENVIRONMENT_PROBE_REQUEST_SCHEMA,
  helixEnvironmentProbeResultSchema,
  type HelixEnvironmentProbeRequest,
  type HelixEnvironmentProbeResult,
} from "@shared/helix-environment-probe";
import {
  HELIX_ENVIRONMENT_PROBE_REQUEST_V1_SCHEMA,
  HELIX_ENVIRONMENT_PROBE_OBSERVATION_SCHEMA,
  type HelixEnvironmentCapabilityDescriptor,
  type HelixEnvironmentConnectorProbeRequest,
  type HelixEnvironmentProbeObservation,
  type HelixEnvironmentProbeOutcome,
  type HelixEnvironmentProbeSubmission,
  helixEnvironmentConnectorProbeResultSchema,
  helixEnvironmentCatalogSnapshotSchema,
  helixEnvironmentProbeObservationSchema,
} from "@shared/helix-environment-connector";
import type { HelixEnvironmentAdapterAdmissionProjection } from "@shared/helix-environment-adapter-profile";
import type { RoomSourceIngressRequestClaim } from "../../helix-ask/realtime-room/source-link-store";
import {
  readSharedRealtimeRoomDatabase,
  withSharedRealtimeRoomTransaction,
} from "../../helix-ask/realtime-room/room-store/database";
import type { Queryable } from "../../helix-ask/realtime-room/room-store/types";
import {
  environmentConnectorSha256,
  legacyProbeTypeForEnvironmentCapability,
} from "../catalog";
import { validateEnvironmentConnectorSchemaValue } from "../conformance";
import type { MaterializedEnvironmentConnectorBinding } from "../bindings";

const MAX_ATTEMPTS = 3;
const DEFAULT_LEASE_MS = 8_000;
const MAX_LEASE_MS = 30_000;
const WAIT_POLL_MS = 100;

export type DurableEnvironmentProbeExecutionAuthorityKind =
  "external_agent_run" | "first_party_shared_room";

export type DurableEnvironmentProbeErrorCode =
  | "capability_unavailable"
  | "capability_version_changed"
  | "schema_validation_failed"
  | "binding_revoked"
  | "permission_revoked"
  | "producer_epoch_mismatch"
  | "environment_adapter_contract_changed"
  | "request_canceled"
  | "request_superseded"
  | "probe_timeout"
  | "probe_result_conflict"
  | "probe_lease_invalid"
  | "probe_request_not_found";

export class DurableEnvironmentProbeError extends Error {
  constructor(
    readonly code: DurableEnvironmentProbeErrorCode,
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "DurableEnvironmentProbeError";
  }
}

type ProbeRequestRow = {
  probe_request_id: string;
  tenant_id: string;
  owner_subject_id: string;
  owner_profile_id: string;
  execution_authority_kind: DurableEnvironmentProbeExecutionAuthorityKind;
  run_id: string;
  turn_id: string;
  provider_execution_id: string;
  tool_call_id: string;
  catalog_snapshot_id: string;
  room_id: string;
  environment_binding_id: string;
  source_id: string;
  device_id: string;
  connector_installation_id: string;
  adapter_profile_id: string;
  adapter_profile_version: number | string;
  adapter_contract_hash: string;
  manifest_hash: string;
  producer_epoch_ref: string;
  requesting_participant_id: string | null;
  resolved_subject_binding_id: string | null;
  resolved_subject_native_id: string | null;
  capability_id: string;
  capability_version: number | string;
  input_schema_hash: string;
  output_schema_hash: string;
  arguments: unknown;
  arguments_hash: string;
  idempotency_key: string;
  freshness_requirement_ms: number | string;
  deadline_at: Date | string;
  status: string;
  cancellation_reason: string | null;
  superseded_by_request_id: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  completed_at: Date | string | null;
};

type ProbeAttemptRow = {
  probe_attempt_id: string;
  probe_request_id: string;
  attempt_number: number | string;
  leased_device_id: string;
  lease_token_hash: string;
  lease_expires_at: Date | string;
  status: string;
  raw_submission_hash: string | null;
  canonical_result_hash: string | null;
  late_result_disposition: string | null;
  leased_at: Date | string;
  submitted_at: Date | string | null;
  completed_at: Date | string | null;
};

type CatalogRow = {
  catalog_snapshot_id: string;
  environment_binding_id: string;
  catalog_hash: string;
  adapter_profile_id: string;
  adapter_profile_version: number | string;
  adapter_contract_hash: string;
  manifest_hash: string;
  capability_descriptors: unknown;
  frozen_at: Date | string;
  expires_at: Date | string | null;
};

type ObservationRow = {
  normalized_observation: unknown;
};

type ContinuationEvidenceRow = ProbeRequestRow & {
  world_id: string;
  binding_status: string;
  normalized_observation: unknown;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const parseJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

const asStringArray = (value: unknown): string[] => {
  const parsed = parseJson(value);
  return Array.isArray(parsed)
    ? parsed.filter(
        (entry): entry is string =>
          typeof entry === "string" && entry.trim().length > 0,
      )
    : [];
};

const asIso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const randomId = (prefix: string): string => `${prefix}:${crypto.randomUUID()}`;

const hashLeaseToken = (value: string): `sha256:${string}` =>
  environmentConnectorSha256({
    namespace: "helix_environment_probe_lease_token.v1",
    token: value,
  });

const event = async (
  db: Queryable,
  requestId: string,
  eventType: string,
  payload: Record<string, unknown> = {},
): Promise<void> => {
  await db.query(
    `
      INSERT INTO helix_environment_probe_events (
        event_id, probe_request_id, event_type, payload
      ) VALUES ($1, $2, $3, $4::jsonb);
    `,
    [
      randomId("environment_probe_event"),
      requestId,
      eventType,
      JSON.stringify(payload),
    ],
  );
};

const recordBrokerOutcomeObservation = async (
  db: Queryable,
  input: {
    request: Pick<
      ProbeRequestRow,
      "probe_request_id" | "capability_id" | "capability_version"
    >;
    outcome: HelixEnvironmentProbeOutcome;
    summary: string;
    eligibleForCurrentTurnReentry: boolean;
    now: Date;
  },
): Promise<HelixEnvironmentProbeObservation> => {
  const existing = await db.query<ObservationRow>(
    `
      SELECT normalized_observation
      FROM helix_environment_probe_observations
      WHERE probe_request_id = $1
      ORDER BY created_at
      LIMIT 1;
    `,
    [input.request.probe_request_id],
  );
  if (existing.rows[0]) {
    return parseJson(
      existing.rows[0].normalized_observation,
    ) as HelixEnvironmentProbeObservation;
  }
  const evidenceRef = `environment_probe_evidence:${input.request.probe_request_id}:${input.outcome}`;
  const observation: HelixEnvironmentProbeObservation = {
    schema: HELIX_ENVIRONMENT_PROBE_OBSERVATION_SCHEMA,
    probe_request_ref: input.request.probe_request_id,
    probe_attempt_ref: null,
    capability_id: input.request.capability_id,
    capability_version: Number(input.request.capability_version),
    outcome: input.outcome,
    summary: input.summary,
    result: {},
    evidence_ref: evidenceRef,
    observation_revision: input.now.getTime(),
    observed_at: input.now.toISOString(),
    freshness_age_ms: null,
    provenance_valid: true,
    eligible_for_current_turn_reentry: input.eligibleForCurrentTurnReentry,
    late_result_disposition: null,
    content_role: "environment_probe_observation_not_assistant_answer",
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  await db.query(
    `
      INSERT INTO helix_environment_probe_observations (
        observation_id,
        probe_request_id,
        probe_result_id,
        evidence_ref,
        outcome,
        normalized_observation,
        created_at
      ) VALUES ($1, $2, NULL, $3, $4, $5::jsonb, $6);
    `,
    [
      randomId("environment_probe_observation"),
      input.request.probe_request_id,
      evidenceRef,
      input.outcome,
      JSON.stringify(observation),
      input.now.toISOString(),
    ],
  );
  return observation;
};

const descriptorFromCatalog = (
  row: CatalogRow,
  input: Pick<ProbeRequestRow, "capability_id" | "capability_version">,
): HelixEnvironmentCapabilityDescriptor => {
  const parsed = helixEnvironmentCatalogSnapshotSchema.parse({
    schema: "helix.environment_connector.catalog_snapshot.v1",
    catalog_snapshot_id: row.catalog_snapshot_id,
    catalog_hash: row.catalog_hash,
    environment_binding_ref: row.environment_binding_id,
    connector_installation_ref: "connector_installation:server_resolved",
    device_ref: "connector_device:server_resolved",
    adapter_profile_id: row.adapter_profile_id,
    adapter_profile_version: Number(row.adapter_profile_version),
    adapter_contract_hash: row.adapter_contract_hash,
    manifest_hash: row.manifest_hash,
    capability_descriptors: parseJson(row.capability_descriptors),
    frozen_at: asIso(row.frozen_at),
    expires_at: row.expires_at ? asIso(row.expires_at) : null,
    content_role: "server_owned_capability_catalog",
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });
  const descriptor = parsed.capability_descriptors.find(
    (entry) =>
      entry.capability_id === input.capability_id &&
      entry.capability_version === Number(input.capability_version),
  );
  if (!descriptor) {
    throw new DurableEnvironmentProbeError(
      "capability_version_changed",
      409,
      "The frozen catalog no longer contains the exact requested capability version.",
    );
  }
  return descriptor;
};

export const dispatchDurableEnvironmentProbe = async (input: {
  tenantId: string;
  ownerSubjectId: string;
  ownerProfileId: string;
  executionAuthorityKind: DurableEnvironmentProbeExecutionAuthorityKind;
  runId: string;
  turnId: string;
  providerExecutionId: string;
  toolCallId: string;
  roomId: string;
  sourceId: string;
  producerEpochRef: string;
  requestingParticipantId?: string | null;
  resolvedSubject?: {
    subjectBindingId: string;
    subjectNativeId: string;
  } | null;
  adapterAdmission: HelixEnvironmentAdapterAdmissionProjection;
  connector: MaterializedEnvironmentConnectorBinding;
  descriptor: HelixEnvironmentCapabilityDescriptor;
  arguments: Record<string, unknown>;
  freshnessRequirementMs: number;
  timeoutMs: number;
  idempotencyKey: string;
  now?: Date;
}): Promise<{ requestId: string; replayed: boolean }> => {
  const now = input.now ?? new Date();
  if (
    input.resolvedSubject &&
    !input.requestingParticipantId?.trim()
  ) {
    throw new DurableEnvironmentProbeError(
      "permission_revoked",
      403,
      "An exact environment subject requires authenticated room-participant identity.",
    );
  }
  const firstPartyIdentityValid =
    input.tenantId === "first_party_browser_session" &&
    input.ownerSubjectId.startsWith("first_party_subject:") &&
    input.runId.startsWith("first_party_shared_room:");
  if (
    (input.executionAuthorityKind === "first_party_shared_room" &&
      !firstPartyIdentityValid) ||
    (input.executionAuthorityKind === "external_agent_run" &&
      (input.tenantId === "first_party_browser_session" ||
        input.ownerSubjectId.startsWith("first_party_subject:") ||
        input.runId.startsWith("first_party_shared_room:")))
  ) {
    throw new DurableEnvironmentProbeError(
      "permission_revoked",
      403,
      "The durable probe execution authority does not match its server-owned identity.",
    );
  }
  const inputIssues = validateEnvironmentConnectorSchemaValue(
    input.descriptor.input_schema,
    input.arguments,
  );
  if (inputIssues.length > 0) {
    throw new DurableEnvironmentProbeError(
      "schema_validation_failed",
      400,
      `Probe arguments failed the frozen input schema at ${inputIssues[0].path}.`,
    );
  }
  if (
    input.descriptor.capability_class !== "probe" ||
    !input.descriptor.read_only ||
    input.descriptor.side_effects_allowed
  ) {
    throw new DurableEnvironmentProbeError(
      "permission_revoked",
      403,
      "The selected connector capability is not an admitted read-only probe.",
    );
  }
  if (
    input.connector.catalogSnapshot.adapter_contract_hash !==
      input.adapterAdmission.adapter_contract_hash ||
    input.connector.catalogSnapshot.manifest_hash !==
      input.adapterAdmission.manifest_hash ||
    input.connector.catalogSnapshot.adapter_profile_id !==
      input.adapterAdmission.adapter_profile_id
  ) {
    throw new DurableEnvironmentProbeError(
      "environment_adapter_contract_changed",
      409,
      "The frozen connector catalog does not match the active adapter admission.",
    );
  }
  const freshnessRequirementMs = Math.max(
    1_000,
    Math.min(
      Math.floor(input.freshnessRequirementMs),
      input.descriptor.freshness_ceiling_ms,
    ),
  );
  const timeoutMs = Math.max(
    1_000,
    Math.min(Math.floor(input.timeoutMs), input.descriptor.timeout_ceiling_ms),
  );
  const argumentsHash = environmentConnectorSha256(input.arguments);
  const requestId = randomId("environment_probe_request");
  const result = await withSharedRealtimeRoomTransaction(
    async (
      db: Queryable,
    ): Promise<{ requestId: string; replayed: boolean }> => {
      const existing = await db.query<ProbeRequestRow>(
        `
          SELECT *
          FROM helix_environment_probe_requests
          WHERE tenant_id = $1
            AND owner_subject_id = $2
            AND idempotency_key = $3
          LIMIT 1
          FOR UPDATE;
        `,
        [input.tenantId, input.ownerSubjectId, input.idempotencyKey],
      );
      if (existing.rows[0]) {
        const row = existing.rows[0];
        if (
          row.arguments_hash !== argumentsHash ||
          row.capability_id !== input.descriptor.capability_id ||
          row.execution_authority_kind !== input.executionAuthorityKind ||
          row.run_id !== input.runId ||
          row.turn_id !== input.turnId ||
          row.tool_call_id !== input.toolCallId ||
          row.requesting_participant_id !==
            (input.requestingParticipantId?.trim() || null) ||
          row.resolved_subject_binding_id !==
            (input.resolvedSubject?.subjectBindingId ?? null) ||
          row.resolved_subject_native_id !==
            (input.resolvedSubject?.subjectNativeId ?? null)
        ) {
          throw new DurableEnvironmentProbeError(
            "probe_result_conflict",
            409,
            "The idempotency key is already bound to a different probe request.",
          );
        }
        return { requestId: row.probe_request_id, replayed: true };
      }
      await db.query(
        `
          INSERT INTO helix_environment_probe_requests (
            probe_request_id,
            tenant_id,
            owner_subject_id,
            owner_profile_id,
            execution_authority_kind,
            run_id,
            turn_id,
            provider_execution_id,
            tool_call_id,
            catalog_snapshot_id,
            room_id,
            environment_binding_id,
            source_id,
            device_id,
            connector_installation_id,
            adapter_profile_id,
            adapter_profile_version,
            adapter_contract_hash,
            manifest_hash,
            producer_epoch_ref,
            requesting_participant_id,
            resolved_subject_binding_id,
            resolved_subject_native_id,
            capability_id,
            capability_version,
            input_schema_hash,
            output_schema_hash,
            arguments,
            arguments_hash,
            idempotency_key,
            freshness_requirement_ms,
            deadline_at,
            created_at,
            updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
            $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
            $27, $28::jsonb, $29, $30, $31, $32, $33, $33
          );
        `,
        [
          requestId,
          input.tenantId,
          input.ownerSubjectId,
          input.ownerProfileId,
          input.executionAuthorityKind,
          input.runId,
          input.turnId,
          input.providerExecutionId,
          input.toolCallId,
          input.connector.catalogSnapshot.catalog_snapshot_id,
          input.roomId,
          input.connector.environmentBindingId,
          input.sourceId,
          input.connector.deviceId,
          input.connector.installationId,
          input.adapterAdmission.adapter_profile_id,
          input.adapterAdmission.adapter_profile_version,
          input.adapterAdmission.adapter_contract_hash,
          input.adapterAdmission.manifest_hash,
          input.producerEpochRef,
          input.requestingParticipantId?.trim() || null,
          input.resolvedSubject?.subjectBindingId ?? null,
          input.resolvedSubject?.subjectNativeId ?? null,
          input.descriptor.capability_id,
          input.descriptor.capability_version,
          input.descriptor.input_schema_hash,
          input.descriptor.output_schema_hash,
          JSON.stringify(input.arguments),
          argumentsHash,
          input.idempotencyKey,
          freshnessRequirementMs,
          new Date(now.getTime() + timeoutMs).toISOString(),
          now.toISOString(),
        ],
      );
      await event(db, requestId, "probe_dispatched", {
        capability_id: input.descriptor.capability_id,
        catalog_snapshot_id:
          input.connector.catalogSnapshot.catalog_snapshot_id,
      });
      return { requestId, replayed: false };
    },
  );
  return result;
};

export type DurableEnvironmentProbeLease = {
  schema: "helix.environment_connector.probe_lease.v1";
  probe_attempt_id: string;
  lease_token: string;
  lease_expires_at: string;
  capability_id: string;
  capability_version: number;
  catalog_snapshot_id: string;
  capability_request: HelixEnvironmentConnectorProbeRequest;
  request: HelixEnvironmentProbeRequest | null;
};

export type EnvironmentProbePollWork = {
  sourceId: string;
  durableWorkPending: boolean;
};

/**
 * Cheap read-only preflight for connector queue polling. A false result may
 * delay a request that races this check until the next bounded poll, but it can
 * never admit or lease work; the authoritative lease transaction remains
 * below.
 */
export const inspectEnvironmentProbePollWork = async (input: {
  roomSourceBindingId: string;
  now?: Date;
}): Promise<EnvironmentProbePollWork | null> => {
  const db = await readSharedRealtimeRoomDatabase();
  const binding = await db.query<{ source_id: string }>(
    `SELECT source_id
     FROM helix_room_source_bindings
     WHERE binding_id = $1
     LIMIT 1;`,
    [input.roomSourceBindingId],
  );
  const sourceId = binding.rows[0]?.source_id;
  if (!sourceId) return null;

  const now = (input.now ?? new Date()).toISOString();
  const work = await db.query<{
    probe_request_id: string;
    status: string;
    deadline_at: Date | string;
  }>(
    `SELECT r.probe_request_id, r.status, r.deadline_at
     FROM helix_environment_probe_requests r
     JOIN helix_environment_connector_bindings b
       ON b.environment_binding_id = r.environment_binding_id
     WHERE b.room_source_binding_id = $1
       AND r.status IN ('pending', 'leased');`,
    [input.roomSourceBindingId],
  );
  let durableWorkPending = false;
  for (const request of work.rows) {
    if (
      request.status === "pending" ||
      new Date(request.deadline_at).getTime() <= Date.parse(now)
    ) {
      durableWorkPending = true;
      break;
    }
    const activeAttempt = await db.query<{ present: number }>(
      `SELECT 1 AS present
       FROM helix_environment_probe_attempts
       WHERE probe_request_id = $1
         AND status = 'leased'
         AND lease_expires_at > $2
       LIMIT 1;`,
      [request.probe_request_id, now],
    );
    if (!activeAttempt.rows[0]) {
      durableWorkPending = true;
      break;
    }
  }
  return {
    sourceId,
    durableWorkPending,
  };
};

export const leaseDurableEnvironmentProbesForClaim = async (input: {
  claim: RoomSourceIngressRequestClaim;
  adapterAdmission: HelixEnvironmentAdapterAdmissionProjection;
  expectedDeviceId?: string;
  expectedEnvironmentBindingId?: string;
  limit: number;
  leaseMs?: number;
  now?: Date;
}): Promise<DurableEnvironmentProbeLease[]> => {
  const now = input.now ?? new Date();
  const limit = Math.max(1, Math.min(16, Math.floor(input.limit)));
  const leaseMs = Math.max(
    1_000,
    Math.min(MAX_LEASE_MS, Math.floor(input.leaseMs ?? DEFAULT_LEASE_MS)),
  );
  return withSharedRealtimeRoomTransaction(
    async (db: Queryable): Promise<DurableEnvironmentProbeLease[]> => {
      const leasedIdentityValues: unknown[] = [input.claim.binding.binding_id];
      let leasedIdentityClause = "";
      if (input.expectedDeviceId !== undefined) {
        leasedIdentityValues.push(input.expectedDeviceId);
        leasedIdentityClause += ` AND r.device_id = $${leasedIdentityValues.length}`;
      }
      if (input.expectedEnvironmentBindingId !== undefined) {
        leasedIdentityValues.push(input.expectedEnvironmentBindingId);
        leasedIdentityClause += ` AND r.environment_binding_id = $${leasedIdentityValues.length}`;
      }
      const leasedRequests = await db.query<{
        probe_request_id: string;
        deadline_at: Date | string;
      }>(
        `
          SELECT r.probe_request_id, r.deadline_at
          FROM helix_environment_probe_requests r
          JOIN helix_environment_connector_bindings b
            ON b.environment_binding_id = r.environment_binding_id
          WHERE b.room_source_binding_id = $1
            ${leasedIdentityClause}
            AND r.status = 'leased'
          FOR UPDATE;
        `,
        leasedIdentityValues,
      );
      for (const request of leasedRequests.rows) {
        await db.query(
          `
            UPDATE helix_environment_probe_attempts
            SET status = 'expired', completed_at = $2
            WHERE probe_request_id = $1
              AND status = 'leased'
              AND lease_expires_at <= $2;
          `,
          [request.probe_request_id, now.toISOString()],
        );
        const activeLease = await db.query<{ probe_attempt_id: string }>(
          `
            SELECT probe_attempt_id
            FROM helix_environment_probe_attempts
            WHERE probe_request_id = $1
              AND status = 'leased'
              AND lease_expires_at > $2
            LIMIT 1;
          `,
          [request.probe_request_id, now.toISOString()],
        );
        if (activeLease.rows[0]) continue;
        const deadlinePassed =
          new Date(request.deadline_at).getTime() <= now.getTime();
        await db.query(
          `
            UPDATE helix_environment_probe_requests
            SET status = $2,
                updated_at = $3,
                completed_at = CASE
                  WHEN $2 = 'expired' THEN $3
                  ELSE completed_at
                END
            WHERE probe_request_id = $1
              AND status = 'leased';
          `,
          [
            request.probe_request_id,
            deadlinePassed ? "expired" : "pending",
            now.toISOString(),
          ],
        );
      }
      const pendingValues: unknown[] = [
        input.claim.binding.binding_id,
        input.adapterAdmission.admission_id,
        input.claim.binding.room_id,
        input.claim.binding.source_id,
        input.adapterAdmission.producer_epoch_ref,
        now.toISOString(),
        limit,
      ];
      let pendingIdentityClause = "";
      if (input.expectedDeviceId !== undefined) {
        pendingValues.push(input.expectedDeviceId);
        pendingIdentityClause += ` AND r.device_id = $${pendingValues.length}`;
      }
      if (input.expectedEnvironmentBindingId !== undefined) {
        pendingValues.push(input.expectedEnvironmentBindingId);
        pendingIdentityClause += ` AND r.environment_binding_id = $${pendingValues.length}`;
      }
      const pending = await db.query<
        ProbeRequestRow & {
          catalog_hash: string;
          capability_descriptors: unknown;
          catalog_frozen_at: Date | string;
          catalog_expires_at: Date | string | null;
          catalog_environment_binding_id: string;
        }
      >(
        `
          SELECT
            r.*,
            c.catalog_hash,
            c.capability_descriptors,
            c.frozen_at AS catalog_frozen_at,
            c.expires_at AS catalog_expires_at,
            c.environment_binding_id AS catalog_environment_binding_id
          FROM helix_environment_probe_requests r
          JOIN helix_environment_connector_bindings b
            ON b.environment_binding_id = r.environment_binding_id
            AND b.status = 'active'
          JOIN helix_environment_connector_devices d
            ON d.device_id = r.device_id
            AND d.status = 'active'
          JOIN helix_environment_capability_catalog_snapshots c
            ON c.catalog_snapshot_id = r.catalog_snapshot_id
          WHERE b.room_source_binding_id = $1
            AND b.adapter_admission_id = $2
            AND r.room_id = $3
            AND r.source_id = $4
            AND r.device_id = d.device_id
            AND r.producer_epoch_ref = $5
            AND r.status = 'pending'
            AND r.deadline_at > $6
            ${pendingIdentityClause}
          ORDER BY r.created_at
          LIMIT $7
          FOR UPDATE;
        `,
        pendingValues,
      );
      const leases: DurableEnvironmentProbeLease[] = [];
      for (const row of pending.rows) {
        const attemptCount = await db.query<{ count: number | string }>(
          `
            SELECT count(*) AS count
            FROM helix_environment_probe_attempts
            WHERE probe_request_id = $1;
          `,
          [row.probe_request_id],
        );
        const attemptNumber = Number(attemptCount.rows[0]?.count ?? 0) + 1;
        if (attemptNumber > MAX_ATTEMPTS) {
          await db.query(
            `
              UPDATE helix_environment_probe_requests
              SET status = 'failed', updated_at = $2, completed_at = $2
              WHERE probe_request_id = $1 AND status = 'pending';
            `,
            [row.probe_request_id, now.toISOString()],
          );
          await event(db, row.probe_request_id, "probe_attempts_exhausted", {
            max_attempts: MAX_ATTEMPTS,
          });
          await recordBrokerOutcomeObservation(db, {
            request: row,
            outcome: "connector_offline",
            summary:
              "The paired connector did not accept the probe after the bounded lease attempts.",
            eligibleForCurrentTurnReentry: true,
            now,
          });
          continue;
        }
        const probeAttemptId = randomId("environment_probe_attempt");
        const leaseToken = `helix_probe_lease_${crypto
          .randomBytes(32)
          .toString("base64url")}`;
        const leaseExpiresAt = new Date(
          Math.min(
            now.getTime() + leaseMs,
            new Date(row.deadline_at).getTime(),
          ),
        ).toISOString();
        await db.query(
          `
            INSERT INTO helix_environment_probe_attempts (
              probe_attempt_id,
              probe_request_id,
              attempt_number,
              leased_device_id,
              lease_token_hash,
              lease_expires_at,
              leased_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7);
          `,
          [
            probeAttemptId,
            row.probe_request_id,
            attemptNumber,
            row.device_id,
            hashLeaseToken(leaseToken),
            leaseExpiresAt,
            now.toISOString(),
          ],
        );
        await db.query(
          `
            UPDATE helix_environment_probe_requests
            SET status = 'leased', updated_at = $2
            WHERE probe_request_id = $1 AND status = 'pending';
          `,
          [row.probe_request_id, now.toISOString()],
        );
        await event(db, row.probe_request_id, "probe_leased", {
          probe_attempt_id: probeAttemptId,
          attempt_number: attemptNumber,
          lease_expires_at: leaseExpiresAt,
        });
        const args = asRecord(parseJson(row.arguments));
        const legacyProbeType = legacyProbeTypeForEnvironmentCapability(
          row.capability_id,
        );
        const expiresAt = asIso(row.deadline_at);
        const maxDurationMs = Math.max(
          1,
          new Date(expiresAt).getTime() - now.getTime(),
        );
        const capabilityRequest: HelixEnvironmentConnectorProbeRequest = {
          schema: HELIX_ENVIRONMENT_PROBE_REQUEST_V1_SCHEMA,
          probe_request_id: row.probe_request_id,
          capability_id: row.capability_id,
          capability_version: Number(row.capability_version),
          catalog_snapshot_id: row.catalog_snapshot_id,
          arguments: args,
          constraints: {
            read_only: true,
            side_effects_allowed: false,
            max_duration_ms: maxDurationMs,
          },
          created_at: asIso(row.created_at),
          deadline_at: expiresAt,
          assistant_answer: false,
          raw_content_included: false,
        };
        const request: HelixEnvironmentProbeRequest | null = legacyProbeType
          ? {
              schema: HELIX_ENVIRONMENT_PROBE_REQUEST_SCHEMA,
              probe_request_id: row.probe_request_id,
              source_id: row.source_id,
              room_id: row.room_id,
              domain:
                row.adapter_profile_id === "game.minecraft.readonly.v1"
                  ? "minecraft"
                  : "game",
              domain_adapter: input.claim.binding.domain_adapter,
              probe_type: legacyProbeType,
              reason: "live_answer_validation",
              objective: `Read-only ${row.capability_id} probe.`,
              target:
                legacyProbeType === "registry_fact"
                  ? {
                      registry_kind:
                        typeof args.registry_kind === "string"
                          ? (args.registry_kind as
                              | "block"
                              | "item"
                              | "entity_type"
                              | "mob_effect")
                          : null,
                      resource_id:
                        typeof args.resource_id === "string"
                          ? args.resource_id
                          : null,
                    }
                  : legacyProbeType === "recipe_fact"
                    ? {
                        query_kind:
                          typeof args.query_kind === "string"
                            ? (args.query_kind as
                                | "recipe_id"
                                | "output_item_id")
                            : null,
                        resource_id:
                          typeof args.resource_id === "string"
                            ? args.resource_id
                            : null,
                        max_results: Number.isInteger(args.max_results)
                          ? Number(args.max_results)
                          : null,
                      }
                  : args.target === "current_actor"
                  ? {
                      target_ref: "current_actor",
                      ...(Number.isInteger(args.horizontal_radius)
                        ? { horizontal_radius: Number(args.horizontal_radius) }
                        : {}),
                      ...(Number.isInteger(args.vertical_radius)
                        ? { vertical_radius: Number(args.vertical_radius) }
                        : {}),
                      ...(typeof args.purpose === "string"
                        ? { purpose: args.purpose }
                        : {}),
                      ...(Number.isInteger(args.requested_length)
                        ? { requested_length: Number(args.requested_length) }
                        : {}),
                      ...(Number.isInteger(args.requested_height)
                        ? { requested_height: Number(args.requested_height) }
                        : {}),
                      ...(typeof args.orientation === "string"
                        ? { orientation: args.orientation }
                        : {}),
                      ...(typeof args.relative_side === "string"
                        ? { relative_side: args.relative_side }
                        : {}),
                      ...(args.verification_from &&
                      typeof args.verification_from === "object" &&
                      !Array.isArray(args.verification_from)
                        ? {
                            verification_from: asRecord(
                              args.verification_from,
                            ) as { x: number; y: number; z: number },
                          }
                        : {}),
                      ...(args.verification_to &&
                      typeof args.verification_to === "object" &&
                      !Array.isArray(args.verification_to)
                        ? {
                            verification_to: asRecord(
                              args.verification_to,
                            ) as { x: number; y: number; z: number },
                          }
                        : {}),
                      ...(typeof args.expected_block === "string"
                        ? { expected_block: args.expected_block }
                        : {}),
                      ...(row.resolved_subject_native_id
                        ? { actor_id: row.resolved_subject_native_id }
                        : {}),
                    }
                  : args.target === "current_focus"
                    ? { target_ref: "current_focus" }
                  : args.target === "position"
                    ? {
                        target_ref: "position",
                        position: asRecord(args.position) as {
                          x: number;
                          y: number;
                          z?: number | null;
                        },
                      }
                    : undefined,
              constraints: {
                read_only: true,
                side_effects_allowed: false,
                max_duration_ms: maxDurationMs,
                ttl_ms: maxDurationMs,
              },
              evidence_refs: [
                row.environment_binding_id,
                row.catalog_snapshot_id,
                input.adapterAdmission.admission_id,
              ],
              assistant_answer: false,
              raw_content_included: false,
              context_policy: "compact_context_pack_only",
              created_at: asIso(row.created_at),
              expires_at: expiresAt,
            }
          : null;
        leases.push({
          schema: "helix.environment_connector.probe_lease.v1",
          probe_attempt_id: probeAttemptId,
          lease_token: leaseToken,
          lease_expires_at: leaseExpiresAt,
          capability_id: row.capability_id,
          capability_version: Number(row.capability_version),
          catalog_snapshot_id: row.catalog_snapshot_id,
          capability_request: capabilityRequest,
          request,
        });
      }
      return leases;
    },
  );
};

const normalizeLegacyResult = (
  result: HelixEnvironmentProbeResult,
): Record<string, unknown> => {
  const rawResult = asRecord(result.result);
  const details = asRecord(rawResult.details);
  const normalized: Record<string, unknown> = {
    result_summary: result.result_summary,
  };
  if (
    typeof details.game_version === "string" &&
    details.game_version.trim().length > 0 &&
    details.game_version.trim().length <= 80
  ) {
    normalized.game_version = details.game_version.trim();
  }
  if (
    ["block", "item", "entity_type", "mob_effect"].includes(
      String(details.registry_kind),
    ) &&
    typeof details.requested_resource_id === "string" &&
    details.requested_resource_id.trim().length > 0 &&
    details.requested_resource_id.trim().length <= 160 &&
    typeof details.registered === "boolean"
  ) {
    normalized.registry_kind = String(details.registry_kind);
    normalized.requested_resource_id =
      details.requested_resource_id.trim();
    normalized.registered = details.registered;
    if (
      typeof details.canonical_resource_id === "string" &&
      details.canonical_resource_id.trim().length > 0 &&
      details.canonical_resource_id.trim().length <= 160
    ) {
      normalized.canonical_resource_id =
        details.canonical_resource_id.trim();
    }
  }
  if (
    ["recipe_id", "output_item_id"].includes(
      String(details.query_kind),
    ) &&
    typeof details.requested_resource_id === "string" &&
    details.requested_resource_id.trim().length > 0 &&
    details.requested_resource_id.trim().length <= 160 &&
    Number.isInteger(details.match_count) &&
    Number(details.match_count) >= 0 &&
    Number(details.match_count) <= 100_000 &&
    typeof details.matches_complete === "boolean" &&
    Array.isArray(details.matches)
  ) {
    normalized.query_kind = String(details.query_kind);
    normalized.requested_resource_id =
      details.requested_resource_id.trim();
    normalized.match_count = Number(details.match_count);
    normalized.matches_complete = details.matches_complete;
    normalized.matches = details.matches
      .slice(0, 16)
      .map(asRecord)
      .filter((match) => {
        const resultItemIds = Array.isArray(match.result_item_ids)
          ? match.result_item_ids
          : null;
        return (
          typeof match.recipe_id === "string" &&
          match.recipe_id.trim().length > 0 &&
          match.recipe_id.trim().length <= 160 &&
          typeof match.recipe_type === "string" &&
          match.recipe_type.trim().length > 0 &&
          match.recipe_type.trim().length <= 160 &&
          typeof match.serializer_id === "string" &&
          match.serializer_id.trim().length > 0 &&
          match.serializer_id.trim().length <= 160 &&
          typeof match.group === "string" &&
          match.group.length <= 160 &&
          resultItemIds !== null &&
          resultItemIds.length <= 16 &&
          resultItemIds.every(
            (itemId) =>
              typeof itemId === "string" &&
              itemId.trim().length > 0 &&
              itemId.trim().length <= 160,
          ) &&
          typeof match.result_resolution_complete === "boolean"
        );
      })
      .map((match) => ({
        recipe_id: String(match.recipe_id).trim(),
        recipe_type: String(match.recipe_type).trim(),
        serializer_id: String(match.serializer_id).trim(),
        group: String(match.group),
        result_item_ids: (match.result_item_ids as unknown[]).map((itemId) =>
          String(itemId).trim(),
        ),
        result_resolution_complete: Boolean(
          match.result_resolution_complete,
        ),
      }));
  }
  if (Number.isInteger(details.stack_count)) {
    normalized.item_count = details.stack_count;
    normalized.slots = (Array.isArray(details.slots) ? details.slots : [])
      .slice(0, 256)
      .map(asRecord)
      .filter((slot): slot is Record<string, unknown> => {
        if (!slot) return false;
        const item = typeof slot.item === "string" ? slot.item.trim() : "";
        return (
          Number.isInteger(slot.slot) &&
          Number(slot.slot) >= 0 &&
          Number(slot.slot) <= 512 &&
          item.length > 0 &&
          item.length <= 160 &&
          Number.isInteger(slot.count) &&
          Number(slot.count) >= 0 &&
          Number(slot.count) <= 100_000
        );
      })
      .map((slot) => ({
        slot: Number(slot.slot),
        item: String(slot.item).trim(),
        count: Number(slot.count),
      }));
  }
  for (const key of [
    "health",
    "max_health",
    "saturation",
    "yaw",
    "pitch",
    "nearest_hostile_distance_blocks",
    "nearest_environmental_hazard_distance_blocks",
  ]) {
    if (typeof details[key] === "number" && Number.isFinite(details[key])) {
      normalized[key] = details[key];
    }
  }
  for (const key of [
    "food_level",
    "entity_count",
    "hostile_entity_count",
    "sampled_floor_blocks",
    "solid_floor_blocks",
    "open_floor_blocks",
    "environmental_hazard_block_count",
    "hazardous_floor_blocks",
    "liquid_floor_blocks",
  ]) {
    if (Number.isInteger(details[key])) {
      normalized[key] = details[key];
    }
  }
  for (const key of ["actor_label", "game_mode", "world"]) {
    if (typeof details[key] === "string" && details[key].trim()) {
      normalized[key] = details[key].trim().slice(0, 160);
    }
  }
  const position = asRecord(details.position);
  if (
    typeof position.x === "number" &&
    Number.isFinite(position.x) &&
    typeof position.y === "number" &&
    Number.isFinite(position.y) &&
    typeof position.z === "number" &&
    Number.isFinite(position.z)
  ) {
    normalized.position = {
      x: position.x,
      y: position.y,
      z: position.z,
    };
  }
  const lookedAtBlock = asRecord(details.looked_at_block);
  const lookedAtBlockPosition = asRecord(lookedAtBlock.position);
  const lookedAtBlockAim = asRecord(lookedAtBlock.aim_position);
  if (
    typeof lookedAtBlock.block_id === "string" &&
    lookedAtBlock.block_id.trim().length > 0 &&
    lookedAtBlock.block_id.trim().length <= 160 &&
    Number.isInteger(lookedAtBlockPosition.x) &&
    Number.isInteger(lookedAtBlockPosition.y) &&
    Number.isInteger(lookedAtBlockPosition.z) &&
    typeof lookedAtBlockAim.x === "number" &&
    Number.isFinite(lookedAtBlockAim.x) &&
    typeof lookedAtBlockAim.y === "number" &&
    Number.isFinite(lookedAtBlockAim.y) &&
    typeof lookedAtBlockAim.z === "number" &&
    Number.isFinite(lookedAtBlockAim.z) &&
    typeof lookedAtBlock.distance_blocks === "number" &&
    Number.isFinite(lookedAtBlock.distance_blocks) &&
    lookedAtBlock.distance_blocks >= 0 &&
    lookedAtBlock.distance_blocks <= 6 &&
    typeof lookedAtBlock.within_interaction_range === "boolean"
  ) {
    normalized.looked_at_block = {
      block_id: lookedAtBlock.block_id.trim(),
      position: {
        x: Number(lookedAtBlockPosition.x),
        y: Number(lookedAtBlockPosition.y),
        z: Number(lookedAtBlockPosition.z),
      },
      aim_position: {
        x: Number(lookedAtBlockAim.x),
        y: Number(lookedAtBlockAim.y),
        z: Number(lookedAtBlockAim.z),
      },
      distance_blocks: Number(lookedAtBlock.distance_blocks),
      within_interaction_range: lookedAtBlock.within_interaction_range,
    };
  }
  const spatialPurposes = new Set([
    "general",
    "structure_planning",
    "build_planning",
    "structure_verification",
    "fire_safety",
    "landing_safety",
    "movement_safety",
  ]);
  const spatialFlagOrder = [
    "air",
    "fluid",
    "solid",
    "flammable",
    "replaceable",
    "hazard",
    "block_entity",
  ] as const;
  const spatialFlags = new Set<string>(spatialFlagOrder);
  const anchorKinds = new Set([
    "door",
    "bed",
    "container",
    "workstation",
    "portal",
    "hearth_base",
  ]);
  const spatialPosition = (value: unknown): Record<string, number> | null => {
    const candidate = asRecord(value);
    if (
      !Number.isInteger(candidate.x) ||
      !Number.isInteger(candidate.y) ||
      !Number.isInteger(candidate.z)
    ) {
      return null;
    }
    return {
      x: Number(candidate.x),
      y: Number(candidate.y),
      z: Number(candidate.z),
    };
  };
  const spatialCenter = spatialPosition(details.center);
  const spatialBounds = asRecord(details.bounds);
  const spatialMin = spatialPosition(spatialBounds.min);
  const spatialMax = spatialPosition(spatialBounds.max);
  if (
    spatialPurposes.has(String(details.purpose)) &&
    spatialCenter &&
    spatialMin &&
    spatialMax &&
    Number.isInteger(details.horizontal_radius) &&
    Number.isInteger(details.vertical_radius) &&
    Number.isInteger(details.sample_count) &&
    Array.isArray(details.palette) &&
    Array.isArray(details.columns) &&
    Array.isArray(details.anchors) &&
    Array.isArray(details.fireplace_candidates)
  ) {
    normalized.purpose = String(details.purpose);
    normalized.center = spatialCenter;
    normalized.horizontal_radius = Number(details.horizontal_radius);
    normalized.vertical_radius = Number(details.vertical_radius);
    if (
      Number.isInteger(details.requested_length) &&
      Number(details.requested_length) >= 3 &&
      Number(details.requested_length) <= 15
    ) {
      normalized.requested_length = Number(details.requested_length);
    }
    if (
      Number.isInteger(details.requested_height) &&
      Number(details.requested_height) >= 3 &&
      Number(details.requested_height) <= 8
    ) {
      normalized.requested_height = Number(details.requested_height);
    }
    if (["north_south", "east_west"].includes(String(details.requested_orientation))) {
      normalized.requested_orientation = String(details.requested_orientation);
    }
    if (["north", "south", "east", "west"].includes(String(details.requested_relative_side))) {
      normalized.requested_relative_side = String(details.requested_relative_side);
    }
    normalized.sample_count = Number(details.sample_count);
    normalized.bounds = { min: spatialMin, max: spatialMax };
    normalized.palette = details.palette
      .slice(0, 128)
      .map(asRecord)
      .filter(
        (entry) =>
          typeof entry.block === "string" &&
          entry.block.trim().length > 0 &&
          entry.block.trim().length <= 160 &&
          Number.isInteger(entry.count) &&
          Number(entry.count) > 0,
      )
      .map((entry) => ({
        block: String(entry.block).trim(),
        count: Number(entry.count),
      }));
    const compactColumns =
      details.column_encoding ===
      "relative_xz_relative_y_palette_flags_v1";
    const normalizedSpatialColumns = compactColumns
      ? details.columns
          .map((column) => {
            if (Array.isArray(column)) return column;
            const encodedColumn = asRecord(column);
            const offset = encodedColumn.offset;
            const encodedRuns = encodedColumn.runs;
            if (!Array.isArray(offset) || !Array.isArray(encodedRuns)) {
              return [];
            }
            return [
              offset[0],
              offset[1],
              encodedRuns.map((run) => {
                const encodedRun = asRecord(run);
                const y = encodedRun.y;
                return Array.isArray(y)
                  ? [y[0], y[1], encodedRun.p, encodedRun.f]
                  : [];
              }),
            ];
          })
          .slice(0, 225)
          .filter(
            (column): column is unknown[] =>
              Array.isArray(column) &&
              column.length === 3 &&
              Number.isInteger(column[0]) &&
              Number.isInteger(column[1]) &&
              Math.abs(Number(column[0])) <= Number(details.horizontal_radius) &&
              Math.abs(Number(column[1])) <= Number(details.horizontal_radius) &&
              Array.isArray(column[2]),
          )
          .map((column) => ({
            x: spatialCenter.x + Number(column[0]),
            z: spatialCenter.z + Number(column[1]),
            runs: (column[2] as unknown[])
              .slice(0, 17)
              .filter(
                (run): run is unknown[] =>
                  Array.isArray(run) &&
                  run.length === 4 &&
                  run.every(Number.isInteger) &&
                  Number(run[0]) <= Number(run[1]) &&
                  Math.abs(Number(run[0])) <= Number(details.vertical_radius) &&
                  Math.abs(Number(run[1])) <= Number(details.vertical_radius) &&
                  Number(run[2]) >= 0 &&
                  Number(run[2]) <
                    (normalized.palette as Array<Record<string, unknown>>).length &&
                  Number(run[3]) >= 0 &&
                  Number(run[3]) <= 127,
              )
              .map((run) => ({
                y_start: spatialCenter.y + Number(run[0]),
                y_end: spatialCenter.y + Number(run[1]),
                block: String(
                  (normalized.palette as Array<Record<string, unknown>>)[
                    Number(run[2])
                  ].block,
                ),
                flags: spatialFlagOrder.filter(
                  (_flag, bit) => (Number(run[3]) & (1 << bit)) !== 0,
                ),
              })),
          }))
      : details.columns
          .slice(0, 225)
          .map(asRecord)
          .filter(
            (column) =>
              Number.isInteger(column.x) &&
              Number.isInteger(column.z) &&
              Array.isArray(column.runs),
          )
          .map((column) => ({
            x: Number(column.x),
            z: Number(column.z),
            runs: (column.runs as unknown[])
              .slice(0, 17)
              .map(asRecord)
              .filter(
                (run) =>
                  Number.isInteger(run.y_start) &&
                  Number.isInteger(run.y_end) &&
                  typeof run.block === "string" &&
                  run.block.trim().length > 0 &&
                  run.block.trim().length <= 160 &&
                  Array.isArray(run.flags),
              )
              .map((run) => ({
                y_start: Number(run.y_start),
                y_end: Number(run.y_end),
                block: String(run.block).trim(),
                flags: (run.flags as unknown[])
                  .filter(
                    (flag): flag is string =>
                      typeof flag === "string" && spatialFlags.has(flag),
                  )
                  .slice(0, 7),
              })),
          }));
    const paletteCounts = new Map(
      (normalized.palette as Array<Record<string, unknown>>).map((entry) => [
        String(entry.block),
        Number(entry.count),
      ]),
    );
    const blockPositionSamples = new Map<
      string,
      Array<Record<string, number>>
    >();
    for (const column of normalizedSpatialColumns) {
      for (const run of column.runs) {
        if (run.flags.includes("air")) continue;
        const positions = blockPositionSamples.get(run.block) ?? [];
        for (
          let y = run.y_start;
          y <= run.y_end && positions.length < 8;
          y += 1
        ) {
          positions.push({ x: column.x, y, z: column.z });
        }
        blockPositionSamples.set(run.block, positions);
      }
    }
    // Put this concise index before the potentially large column evidence in
    // the normalized object. It is a lossless sample projection over the same
    // trusted scan, not a target selector: Codex still decides which observed
    // block is relevant to the user's request.
    normalized.block_position_samples = Array.from(
      blockPositionSamples.entries(),
    )
      .map(([block, positions]) => ({
        block,
        total_count: paletteCounts.get(block) ?? positions.length,
        positions,
      }))
      .sort(
        (left, right) =>
          left.total_count - right.total_count ||
          left.block.localeCompare(right.block),
      )
      .slice(0, 32);
    normalized.columns = normalizedSpatialColumns;
    normalized.column_encoding = compactColumns
      ? "expanded_relative_xz_relative_y_palette_flags_v1"
      : "absolute_xyz_verbose_v1";
    normalized.columns_complete = details.columns_complete !== false;
    normalized.palette_complete = details.palette_complete !== false;
    normalized.anchors_complete = details.anchors_complete !== false;
    normalized.fireplace_candidates_complete =
      details.fireplace_candidates_complete !== false;
    const rawBuildLineCandidates = Array.isArray(
      details.build_line_candidates,
    )
      ? details.build_line_candidates
      : [];
    const rawWalkStepCandidates = Array.isArray(
      details.walk_step_candidates,
    )
      ? details.walk_step_candidates
      : [];
    normalized.build_line_candidates_complete =
      details.build_line_candidates_complete !== false;
    normalized.walk_step_candidates_complete =
      details.walk_step_candidates_complete === true;
    for (const countField of [
      "retained_column_count",
      "omitted_column_count",
      "omitted_run_count",
      "omitted_palette_block_types",
      "retained_anchor_count",
      "omitted_anchor_count",
      "retained_fireplace_candidate_count",
      "omitted_fireplace_candidate_count",
      "retained_build_line_candidate_count",
      "omitted_build_line_candidate_count",
      "retained_walk_step_candidate_count",
      "omitted_walk_step_candidate_count",
      "wire_details_json_bytes",
    ] as const) {
      if (Number.isInteger(details[countField]) && Number(details[countField]) >= 0) {
        normalized[countField] = Number(details[countField]);
      }
    }
    normalized.anchors = details.anchors
      .slice(0, 64)
      .map(asRecord)
      .map((anchor) => ({
        anchor,
        position: spatialPosition(anchor.position),
      }))
      .filter(
        ({ anchor, position }) =>
          position !== null &&
          anchorKinds.has(String(anchor.kind)) &&
          typeof anchor.block === "string" &&
          anchor.block.trim().length > 0 &&
          anchor.block.trim().length <= 160,
      )
      .map(({ anchor, position }) => ({
        kind: String(anchor.kind),
        block: String(anchor.block).trim(),
        position: position!,
      }));
    normalized.fireplace_candidates = details.fireplace_candidates
      .slice(0, 16)
      .map(asRecord)
      .map((candidate) => ({
        candidate,
        basePosition: spatialPosition(candidate.base_position),
        firePosition: spatialPosition(candidate.fire_position),
      }))
      .filter(
        ({ candidate, basePosition, firePosition }) =>
          basePosition !== null &&
          firePosition !== null &&
          typeof candidate.base_block === "string" &&
          candidate.base_block.trim().length > 0 &&
          candidate.base_block.trim().length <= 160 &&
          Number.isInteger(candidate.flammable_within_two) &&
          Number.isInteger(candidate.solid_nonflammable_enclosure) &&
          typeof candidate.replaceable_fire_cell === "boolean" &&
          typeof candidate.safe_candidate === "boolean",
      )
      .map(({ candidate, basePosition, firePosition }) => ({
        base_position: basePosition!,
        fire_position: firePosition!,
        base_block: String(candidate.base_block).trim(),
        flammable_within_two: Number(candidate.flammable_within_two),
        solid_nonflammable_enclosure: Number(
          candidate.solid_nonflammable_enclosure,
        ),
        replaceable_fire_cell: Boolean(candidate.replaceable_fire_cell),
        safe_candidate: Boolean(candidate.safe_candidate),
      }));
    normalized.build_line_candidates = rawBuildLineCandidates
      .slice(0, 16)
      .map(asRecord)
      .map((candidate) => ({
        candidate,
        from: spatialPosition(candidate.from),
        to: spatialPosition(candidate.to),
      }))
      .filter(({ candidate, from, to }) => {
        const groundBlocks = candidate.ground_blocks;
        return (
          from !== null &&
          to !== null &&
          (candidate.orientation === "north_south" ||
            candidate.orientation === "east_west") &&
          ["north", "south", "east", "west", "overlap"].includes(
            String(candidate.relative_side),
          ) &&
          Number.isInteger(candidate.length) &&
          Number(candidate.length) >= 3 &&
          Number(candidate.length) <= 15 &&
          Number.isInteger(candidate.minimum_clear_height) &&
          Number(candidate.minimum_clear_height) >= 3 &&
          Number.isInteger(candidate.minimum_actor_distance) &&
          Number(candidate.minimum_actor_distance) >= 2 &&
          Number.isInteger(candidate.nearest_anchor_distance) &&
          Number(candidate.nearest_anchor_distance) >= 2 &&
          Array.isArray(groundBlocks) &&
          groundBlocks.every(
            (block) =>
              typeof block === "string" &&
              block.trim().length > 0 &&
              block.trim().length <= 160,
          ) &&
          typeof candidate.target_cells_replaceable === "boolean" &&
          typeof candidate.target_cells_air === "boolean" &&
          typeof candidate.ground_solid_nonhazardous === "boolean" &&
          Number.isInteger(candidate.fluid_cells) &&
          Number.isInteger(candidate.flammable_cells) &&
          Number.isInteger(candidate.block_entity_cells) &&
          typeof candidate.safe_candidate === "boolean"
        );
      })
      .map(({ candidate, from, to }) => ({
        orientation: String(candidate.orientation),
        relative_side: String(candidate.relative_side),
        from: from!,
        to: to!,
        length: Number(candidate.length),
        minimum_clear_height: Number(candidate.minimum_clear_height),
        minimum_actor_distance: Number(candidate.minimum_actor_distance),
        nearest_anchor_distance: Number(candidate.nearest_anchor_distance),
        ground_blocks: (candidate.ground_blocks as unknown[]).map((block) =>
          String(block).trim(),
        ),
        target_cells_replaceable: Boolean(candidate.target_cells_replaceable),
        target_cells_air: Boolean(candidate.target_cells_air),
        ground_solid_nonhazardous: Boolean(
          candidate.ground_solid_nonhazardous,
        ),
        fluid_cells: Number(candidate.fluid_cells),
        flammable_cells: Number(candidate.flammable_cells),
        block_entity_cells: Number(candidate.block_entity_cells),
        safe_candidate: Boolean(candidate.safe_candidate),
      }));
    if (!Number.isInteger(details.retained_build_line_candidate_count)) {
      normalized.retained_build_line_candidate_count = (
        normalized.build_line_candidates as unknown[]
      ).length;
    }
    if (!Number.isInteger(details.omitted_build_line_candidate_count)) {
      normalized.omitted_build_line_candidate_count = 0;
    }
    normalized.walk_step_candidates = rawWalkStepCandidates
      .slice(0, 4)
      .map(asRecord)
      .map((candidate) => ({
        candidate,
        targetFeet: spatialPosition(candidate.target_feet_position),
        targetHead: spatialPosition(candidate.target_head_position),
        support: spatialPosition(candidate.support_position),
      }))
      .filter(({ candidate, targetFeet, targetHead, support }) =>
        targetFeet !== null &&
        targetHead !== null &&
        support !== null &&
        ["north", "south", "east", "west"].includes(
          String(candidate.cardinal_direction),
        ) &&
        ["forward", "back", "left", "right"].includes(
          String(candidate.relative_direction),
        ) &&
        typeof candidate.support_block === "string" &&
        candidate.support_block.trim().length > 0 &&
        candidate.support_block.trim().length <= 160 &&
        typeof candidate.evidence_complete === "boolean" &&
        typeof candidate.feet_clear === "boolean" &&
        typeof candidate.head_clear === "boolean" &&
        typeof candidate.support_solid_nonhazardous === "boolean" &&
        Number.isInteger(candidate.nearby_hazard_count) &&
        Number(candidate.nearby_hazard_count) >= 0 &&
        Number.isInteger(candidate.nearby_fluid_count) &&
        Number(candidate.nearby_fluid_count) >= 0 &&
        typeof candidate.safe_candidate === "boolean",
      )
      .map(({ candidate, targetFeet, targetHead, support }) => ({
        cardinal_direction: String(candidate.cardinal_direction),
        relative_direction: String(candidate.relative_direction),
        target_feet_position: targetFeet!,
        target_head_position: targetHead!,
        support_position: support!,
        support_block: String(candidate.support_block).trim(),
        evidence_complete: Boolean(candidate.evidence_complete),
        feet_clear: Boolean(candidate.feet_clear),
        head_clear: Boolean(candidate.head_clear),
        support_solid_nonhazardous: Boolean(
          candidate.support_solid_nonhazardous,
        ),
        nearby_hazard_count: Number(candidate.nearby_hazard_count),
        nearby_fluid_count: Number(candidate.nearby_fluid_count),
        safe_candidate: Boolean(candidate.safe_candidate),
      }));
    if (!Number.isInteger(details.retained_walk_step_candidate_count)) {
      normalized.retained_walk_step_candidate_count = (
        normalized.walk_step_candidates as unknown[]
      ).length;
    }
    if (!Number.isInteger(details.omitted_walk_step_candidate_count)) {
      normalized.omitted_walk_step_candidate_count = 0;
    }
    const rawTargetVerification = asRecord(
      details.target_geometry_verification,
    );
    const verificationFrom = spatialPosition(rawTargetVerification.from);
    const verificationTo = spatialPosition(rawTargetVerification.to);
    const expectedBlock =
      typeof rawTargetVerification.expected_block === "string"
        ? rawTargetVerification.expected_block.trim()
        : "";
    const totalCells = Number(rawTargetVerification.total_cells);
    const sampledCells = Number(rawTargetVerification.sampled_cells);
    const matchingCells = Number(rawTargetVerification.matching_cells);
    const mismatchedCells = Number(rawTargetVerification.mismatched_cells);
    const unobservedCells = Number(rawTargetVerification.unobserved_cells);
    const verificationCountsValid =
      Number.isInteger(totalCells) &&
      totalCells >= 1 &&
      totalCells <= 4_096 &&
      Number.isInteger(sampledCells) &&
      sampledCells >= 0 &&
      sampledCells <= totalCells &&
      Number.isInteger(matchingCells) &&
      matchingCells >= 0 &&
      Number.isInteger(mismatchedCells) &&
      mismatchedCells >= 0 &&
      matchingCells + mismatchedCells === sampledCells &&
      Number.isInteger(unobservedCells) &&
      unobservedCells === totalCells - sampledCells;
    if (
      verificationFrom &&
      verificationTo &&
      expectedBlock.length > 0 &&
      expectedBlock.length <= 160 &&
      verificationCountsValid &&
      typeof rawTargetVerification.within_survey_bounds === "boolean" &&
      typeof rawTargetVerification.complete === "boolean" &&
      typeof rawTargetVerification.all_match === "boolean" &&
      Array.isArray(rawTargetVerification.mismatch_samples)
    ) {
      const mismatchSamples = rawTargetVerification.mismatch_samples
        .slice(0, 32)
        .map(asRecord)
        .map((sample) => ({
          position: spatialPosition(sample.position),
          observedBlock:
            typeof sample.observed_block === "string"
              ? sample.observed_block.trim()
              : "",
        }))
        .filter(
          (sample) =>
            sample.position !== null &&
            sample.observedBlock.length > 0 &&
            sample.observedBlock.length <= 160,
        )
        .map((sample) => ({
          position: sample.position!,
          observed_block: sample.observedBlock,
        }));
      const complete =
        rawTargetVerification.within_survey_bounds === true &&
        rawTargetVerification.complete === true &&
        sampledCells === totalCells &&
        unobservedCells === 0;
      const allMatch =
        complete &&
        rawTargetVerification.all_match === true &&
        matchingCells === totalCells &&
        mismatchedCells === 0;
      normalized.target_geometry_verification = {
        from: verificationFrom,
        to: verificationTo,
        expected_block: expectedBlock,
        total_cells: totalCells,
        sampled_cells: sampledCells,
        matching_cells: matchingCells,
        mismatched_cells: mismatchedCells,
        unobserved_cells: unobservedCells,
        mismatch_samples: mismatchSamples,
        within_survey_bounds:
          rawTargetVerification.within_survey_bounds === true,
        complete,
        all_match: allMatch,
      };
    }
  }
  if (Array.isArray(details.status_flags)) {
    normalized.status_flags = details.status_flags
      .filter(
        (flag): flag is string =>
          typeof flag === "string" &&
          flag.trim().length > 0 &&
          flag.trim().length <= 80,
      )
      .slice(0, 32)
      .map((flag) => flag.trim());
  }
  if (Array.isArray(details.active_effects)) {
    normalized.active_effects = details.active_effects
      .slice(0, 32)
      .map(asRecord)
      .filter((effect) => {
        if (!effect) return false;
        return (
          typeof effect.effect === "string" &&
          effect.effect.trim().length > 0 &&
          effect.effect.trim().length <= 160 &&
          Number.isInteger(effect.amplifier) &&
          Number(effect.amplifier) >= 0 &&
          Number(effect.amplifier) <= 255 &&
          Number.isInteger(effect.duration_ticks) &&
          Number(effect.duration_ticks) >= 0 &&
          Number(effect.duration_ticks) <= 2_147_483_647
        );
      })
      .map((effect) => ({
        effect: String(effect.effect).trim(),
        amplifier: Number(effect.amplifier),
        duration_ticks: Number(effect.duration_ticks),
      }));
  }
  const mechanicsState = asRecord(details.mechanics_state);
  if (
    mechanicsState.mod_id === "mr_crimson_curse" &&
    mechanicsState.state_source === "allowlisted_scoreboard_observation" &&
    typeof mechanicsState.raw_command_output_included === "boolean" &&
    typeof mechanicsState.raw_nbt_included === "boolean" &&
    (mechanicsState.status === "not_initialized" ||
      mechanicsState.status === "observed")
  ) {
    const normalizedMechanicsState: Record<string, unknown> = {
      mod_id: mechanicsState.mod_id,
      state_source: mechanicsState.state_source,
      raw_command_output_included:
        mechanicsState.raw_command_output_included,
      raw_nbt_included: mechanicsState.raw_nbt_included,
      status: mechanicsState.status,
    };
    if (
      typeof mechanicsState.mod_version === "string" &&
      mechanicsState.mod_version.trim().length > 0 &&
      mechanicsState.mod_version.trim().length <= 40
    ) {
      normalizedMechanicsState.mod_version =
        mechanicsState.mod_version.trim();
    }
    for (const key of ["global_mass", "global_points"]) {
      if (
        Number.isInteger(mechanicsState[key]) &&
        Number(mechanicsState[key]) >= -2_147_483_648 &&
        Number(mechanicsState[key]) <= 2_147_483_647
      ) {
        normalizedMechanicsState[key] = Number(mechanicsState[key]);
      }
    }
    if (
      Number.isInteger(mechanicsState.infection_phase) &&
      Number(mechanicsState.infection_phase) >= -1 &&
      Number(mechanicsState.infection_phase) <= 5
    ) {
      normalizedMechanicsState.infection_phase = Number(
        mechanicsState.infection_phase,
      );
    }
    normalized.mechanics_state = normalizedMechanicsState;
  }
  if (Array.isArray(details.environmental_hazard_types)) {
    normalized.environmental_hazard_types =
      details.environmental_hazard_types
        .filter(
          (hazard): hazard is string =>
            typeof hazard === "string" &&
            hazard.trim().length > 0 &&
            hazard.trim().length <= 80,
        )
        .slice(0, 32)
        .map((hazard) => hazard.trim());
  }
  for (const key of ["actor_on_fire", "actor_freezing"]) {
    if (typeof details[key] === "boolean") {
      normalized[key] = details[key];
    }
  }
  if (Array.isArray(details.entities)) {
    normalized.entities = details.entities
      .slice(0, 128)
      .map(asRecord)
      .filter((entity) => {
        const classification =
          typeof entity.classification === "string"
            ? entity.classification.trim()
            : "";
        return (
          typeof entity.entity_type === "string" &&
          entity.entity_type.trim().length > 0 &&
          entity.entity_type.trim().length <= 160 &&
          ["hostile", "player", "passive", "projectile", "other"].includes(
            classification,
          ) &&
          typeof entity.distance_blocks === "number" &&
          Number.isFinite(entity.distance_blocks) &&
          entity.distance_blocks >= 0 &&
          typeof entity.targeting_actor === "boolean"
        );
      })
      .map((entity) => {
        const normalizedEntity: Record<string, unknown> = {
          entity_type: String(entity.entity_type).trim(),
          classification: String(entity.classification).trim(),
          distance_blocks: Number(entity.distance_blocks),
          targeting_actor: Boolean(entity.targeting_actor),
        };
        if (
          typeof entity.entity_label === "string" &&
          entity.entity_label.trim().length > 0 &&
          entity.entity_label.trim().length <= 160
        ) {
          normalizedEntity.entity_label = entity.entity_label.trim();
        }
        for (const key of ["health", "max_health"] as const) {
          const value = entity[key];
          if (
            typeof value === "number" &&
            Number.isFinite(value) &&
            value >= 0 &&
            value <= 2_147_483_647
          ) {
            normalizedEntity[key] = value;
          }
        }
        return normalizedEntity;
      });
  }
  if (typeof rawResult.reachable === "boolean") {
    if (result.domain === "minecraft") {
      normalized.within_interaction_range = rawResult.reachable;
    } else {
      normalized.reachable = rawResult.reachable;
    }
  }
  if (typeof rawResult.feasible === "boolean") {
    normalized.within_probe_radius = rawResult.feasible;
  }
  if (typeof rawResult.line_of_sight === "boolean") {
    normalized.line_of_sight = rawResult.line_of_sight;
  }
  if (typeof rawResult.crop_mature === "boolean") {
    normalized.crop_mature = rawResult.crop_mature;
  }
  if (
    typeof details.block_type === "string" &&
    details.block_type.trim().length > 0
  ) {
    normalized.crop_type = details.block_type.trim();
  }
  if (typeof rawResult.hazard_present === "boolean") {
    normalized.hazard_present = rawResult.hazard_present;
  }
  if (typeof rawResult.distance_blocks === "number") {
    normalized.distance_blocks = rawResult.distance_blocks;
    if (result.domain !== "minecraft") {
      normalized.distance = rawResult.distance_blocks;
    }
  }
  if (
    details.snapshot_schema === "helix.minecraft_perception_snapshot.v1"
  ) {
    for (const key of [
      "snapshot_schema",
      "observation_revision",
      "game_tick",
      "capture_duration_ms",
      "dimension",
      "actor",
      "focus",
      "entities",
      "projectiles",
      "hazards",
      "movement_candidates",
      "navigation_frontier",
      "inventory",
      "coverage",
      "ui_state",
      "world_rules",
      "semantic_fingerprint",
    ] as const) {
      if (details[key] !== undefined) normalized[key] = details[key];
    }
  }
  return normalized;
};

const outcomeForLegacyResult = (
  result: HelixEnvironmentProbeResult,
): HelixEnvironmentProbeOutcome => {
  const failureCode = asRecord(result.result.details).failure_code;
  if (
    failureCode === "target_unavailable" ||
    failureCode === "target_ambiguous"
  ) {
    return failureCode;
  }
  switch (result.status) {
    case "succeeded":
      return "succeeded";
    case "expired":
      return "probe_timeout";
    case "unsupported":
      return "capability_unavailable";
    case "blocked_by_policy":
      return "permission_revoked";
    default:
      return "probe_failed";
  }
};

export const normalizeLegacyEnvironmentProbeResultForTests =
  normalizeLegacyResult;
export const outcomeForLegacyEnvironmentProbeResultForTests =
  outcomeForLegacyResult;

export const submitDurableEnvironmentProbeResult = async (input: {
  claim: RoomSourceIngressRequestClaim;
  adapterAdmission: HelixEnvironmentAdapterAdmissionProjection;
  expectedDeviceId?: string;
  expectedEnvironmentBindingId?: string;
  submission: HelixEnvironmentProbeSubmission;
  now?: Date;
}): Promise<{
  observation: HelixEnvironmentProbeObservation;
  replayed: boolean;
}> => {
  const now = input.now ?? new Date();
  const parsedLegacyResult = helixEnvironmentProbeResultSchema.safeParse(
    input.submission.result,
  );
  const parsedConnectorResult =
    helixEnvironmentConnectorProbeResultSchema.safeParse(
      input.submission.result,
    );
  if (!parsedLegacyResult.success && !parsedConnectorResult.success) {
    throw new DurableEnvironmentProbeError(
      "schema_validation_failed",
      400,
      "Probe result does not match an admitted connector result envelope.",
    );
  }
  const legacyResult = parsedLegacyResult.success
    ? (parsedLegacyResult.data as HelixEnvironmentProbeResult)
    : null;
  const connectorResult = parsedConnectorResult.success
    ? parsedConnectorResult.data
    : null;
  const rawResult = legacyResult ?? connectorResult!;
  const recorded = await withSharedRealtimeRoomTransaction<
    | {
        conflict: false;
        observation: HelixEnvironmentProbeObservation;
        replayed: boolean;
      }
    | { conflict: true }
  >(async (db: Queryable) => {
    const rows = await db.query<
      ProbeAttemptRow &
        ProbeRequestRow & {
          binding_status: string;
          binding_room_source_id: string;
          binding_adapter_admission_id: string;
          device_status: string;
          device_producer_epoch_ref: string | null;
          catalog_hash: string;
          catalog_environment_binding_id: string;
          catalog_capability_descriptors: unknown;
          catalog_frozen_at: Date | string;
          catalog_expires_at: Date | string | null;
          run_lifecycle_status: string | null;
          run_completion_status: string | null;
          run_expires_at: Date | string | null;
          run_active_operation_id: string | null;
          run_tenant_id: string | null;
          run_subject_id: string | null;
          run_account_profile_id: string | null;
          installation_status: string | null;
          source_binding_status: string | null;
          source_credential_status: string | null;
          source_credential_expires_at: Date | string | null;
          adapter_admission_status: string | null;
          binding_consent_capability_ids: unknown;
          run_room_binding_status: string | null;
          run_room_binding_tenant_id: string | null;
          run_room_binding_subject_id: string | null;
          run_room_binding_account_profile_id: string | null;
          run_room_binding_room_id: string | null;
          participant_id_at_bind: string | null;
          member_role_at_bind: string | null;
          consent_version_at_bind: number | string | null;
          consent_receipt_ref_at_bind: string | null;
          room_status: string | null;
          member_participant_id: string | null;
          member_role: string | null;
          member_presence: string | null;
          member_consent_version: string | null;
          member_consent_receipt_ref: string | null;
          account_type: string | null;
          attempt_status: string;
          request_status: string;
        }
    >(
      `
        SELECT
          a.probe_attempt_id,
          a.probe_request_id,
          a.attempt_number,
          a.leased_device_id,
          a.lease_token_hash,
          a.lease_expires_at,
          a.status AS attempt_status,
          a.raw_submission_hash,
          a.canonical_result_hash,
          a.late_result_disposition,
          a.leased_at,
          a.submitted_at,
          a.completed_at,
          r.*,
          r.status AS request_status,
          b.status AS binding_status,
          b.room_source_binding_id AS binding_room_source_id,
          b.adapter_admission_id AS binding_adapter_admission_id,
          d.status AS device_status,
          d.producer_epoch_ref AS device_producer_epoch_ref,
          c.catalog_hash,
          c.environment_binding_id AS catalog_environment_binding_id,
          c.capability_descriptors AS catalog_capability_descriptors,
          c.frozen_at AS catalog_frozen_at,
          c.expires_at AS catalog_expires_at,
          ar.lifecycle_status AS run_lifecycle_status,
          ar.completion_status AS run_completion_status,
          ar.expires_at AS run_expires_at,
          ar.active_operation_id AS run_active_operation_id,
          ar.tenant_id AS run_tenant_id,
          ar.subject_id AS run_subject_id,
          ar.account_profile_id AS run_account_profile_id,
          i.status AS installation_status,
          rsb.status AS source_binding_status,
          rc.status AS source_credential_status,
          rc.expires_at AS source_credential_expires_at,
          aa.status AS adapter_admission_status,
          b.consent_capability_ids AS binding_consent_capability_ids,
          rb.status AS run_room_binding_status,
          rb.tenant_id AS run_room_binding_tenant_id,
          rb.subject_id AS run_room_binding_subject_id,
          rb.account_profile_id AS run_room_binding_account_profile_id,
          rb.room_id AS run_room_binding_room_id,
          rb.participant_id_at_bind,
          rb.member_role_at_bind,
          rb.consent_version_at_bind,
          rb.consent_receipt_ref_at_bind,
          room.status AS room_status,
          member.participant_id AS member_participant_id,
          member.member_role,
          member.presence AS member_presence,
          member.consent ->> 'consent_version' AS member_consent_version,
          member.consent ->> 'consent_receipt_ref'
            AS member_consent_receipt_ref,
          account.account_type
        FROM helix_environment_probe_attempts a
        JOIN helix_environment_probe_requests r
          ON r.probe_request_id = a.probe_request_id
        JOIN helix_environment_connector_bindings b
          ON b.environment_binding_id = r.environment_binding_id
        JOIN helix_environment_connector_devices d
          ON d.device_id = r.device_id
        JOIN helix_environment_connector_installations i
          ON i.installation_id = r.connector_installation_id
        JOIN helix_environment_capability_catalog_snapshots c
          ON c.catalog_snapshot_id = r.catalog_snapshot_id
        JOIN helix_room_source_bindings rsb
          ON rsb.binding_id = b.room_source_binding_id
        JOIN helix_environment_adapter_admissions aa
          ON aa.admission_id = b.adapter_admission_id
        LEFT JOIN helix_room_source_credentials rc
          ON rc.credential_id = aa.credential_id
        LEFT JOIN helix_agent_runs ar
          ON ar.run_id = r.run_id
        LEFT JOIN helix_agent_run_room_bindings rb
          ON rb.run_id = r.run_id
          AND rb.status = 'active'
        LEFT JOIN helix_shared_realtime_rooms room
          ON room.room_id = r.room_id
        LEFT JOIN helix_shared_realtime_room_members member
          ON member.room_id = r.room_id
          AND member.profile_id = r.owner_profile_id
        LEFT JOIN helix_accounts account
          ON account.profile_id = r.owner_profile_id
        WHERE a.probe_attempt_id = $1
        LIMIT 1
        FOR UPDATE;
      `,
      [input.submission.probe_attempt_id],
    );
    const row = rows.rows[0];
    if (!row) {
      throw new DurableEnvironmentProbeError(
        "probe_request_not_found",
        404,
        "The probe attempt is unknown.",
      );
    }
    if (row.lease_token_hash !== hashLeaseToken(input.submission.lease_token)) {
      throw new DurableEnvironmentProbeError(
        "probe_lease_invalid",
        401,
        "The probe lease is invalid.",
      );
    }
    if (
      row.binding_room_source_id !== input.claim.binding.binding_id ||
      row.room_id !== input.claim.binding.room_id ||
      row.source_id !== input.claim.binding.source_id ||
      row.binding_adapter_admission_id !==
        input.adapterAdmission.admission_id ||
      (input.expectedDeviceId !== undefined &&
        row.device_id !== input.expectedDeviceId) ||
      (input.expectedEnvironmentBindingId !== undefined &&
        row.environment_binding_id !== input.expectedEnvironmentBindingId)
    ) {
      throw new DurableEnvironmentProbeError(
        "binding_revoked",
        409,
        "The result does not match the exact active environment binding.",
      );
    }
    if (
      row.producer_epoch_ref !== input.adapterAdmission.producer_epoch_ref ||
      row.device_producer_epoch_ref !==
        input.adapterAdmission.producer_epoch_ref
    ) {
      throw new DurableEnvironmentProbeError(
        "producer_epoch_mismatch",
        409,
        "The result belongs to an old connector producer epoch.",
      );
    }
    if (
      row.adapter_contract_hash !==
        input.adapterAdmission.adapter_contract_hash ||
      row.manifest_hash !== input.adapterAdmission.manifest_hash
    ) {
      throw new DurableEnvironmentProbeError(
        "environment_adapter_contract_changed",
        409,
        "The result adapter identity does not match the dispatched contract.",
      );
    }
    const catalog: CatalogRow = {
      catalog_snapshot_id: row.catalog_snapshot_id,
      environment_binding_id: row.catalog_environment_binding_id,
      catalog_hash: row.catalog_hash,
      adapter_profile_id: row.adapter_profile_id,
      adapter_profile_version: row.adapter_profile_version,
      adapter_contract_hash: row.adapter_contract_hash,
      manifest_hash: row.manifest_hash,
      capability_descriptors: row.catalog_capability_descriptors,
      frozen_at: row.catalog_frozen_at,
      expires_at: row.catalog_expires_at,
    };
    const descriptor = descriptorFromCatalog(catalog, row);
    if (
      descriptor.input_schema_hash !== row.input_schema_hash ||
      descriptor.output_schema_hash !== row.output_schema_hash
    ) {
      throw new DurableEnvironmentProbeError(
        "capability_version_changed",
        409,
        "The request schema hashes do not match the frozen capability descriptor.",
      );
    }
    const expectedProbeType = legacyProbeTypeForEnvironmentCapability(
      row.capability_id,
    );
    const legacyIdentityValid =
      legacyResult !== null &&
      expectedProbeType !== null &&
      legacyResult.probe_request_id === row.probe_request_id &&
      legacyResult.room_id === row.room_id &&
      legacyResult.source_id === row.source_id &&
      legacyResult.probe_type === expectedProbeType &&
      legacyResult.side_effects_performed === false &&
      legacyResult.world_mutation_performed === false &&
      legacyResult.commands_executed.length === 0;
    const connectorIdentityValid =
      connectorResult !== null &&
      connectorResult.probe_request_id === row.probe_request_id &&
      connectorResult.capability_id === row.capability_id &&
      connectorResult.capability_version === Number(row.capability_version) &&
      connectorResult.side_effects_performed === false &&
      connectorResult.environment_mutation_performed === false &&
      connectorResult.commands_executed.length === 0;
    if (!legacyIdentityValid && !connectorIdentityValid) {
      throw new DurableEnvironmentProbeError(
        "schema_validation_failed",
        400,
        "The submitted result failed exact request, source, or read-only correlation.",
      );
    }
    const normalizedResult = legacyResult
      ? normalizeLegacyResult(legacyResult)
      : asRecord(connectorResult!.result);
    const outputIssues = validateEnvironmentConnectorSchemaValue(
      descriptor.output_schema,
      normalizedResult,
    );
    if (outputIssues.length > 0) {
      throw new DurableEnvironmentProbeError(
        "schema_validation_failed",
        400,
        `Probe result failed the frozen output schema at ${outputIssues[0].path}.`,
      );
    }
    const rawSubmissionHash = environmentConnectorSha256(rawResult);
    const canonicalResultHash = environmentConnectorSha256(normalizedResult);
    const existing = await db.query<{
      canonical_result_hash: string;
      normalized_observation: unknown;
    }>(
      `
        SELECT r.canonical_result_hash, o.normalized_observation
        FROM helix_environment_probe_results r
        JOIN helix_environment_probe_observations o
          ON o.probe_result_id = r.probe_result_id
        WHERE r.probe_request_id = $1
        ORDER BY r.received_at
        LIMIT 1;
      `,
      [row.probe_request_id],
    );
    if (existing.rows[0]) {
      if (existing.rows[0].canonical_result_hash !== canonicalResultHash) {
        await db.query(
          `
            UPDATE helix_environment_probe_attempts
            SET status = 'conflict',
                raw_submission_hash = $2,
                canonical_result_hash = $3,
                submitted_at = $4,
                completed_at = $4
            WHERE probe_attempt_id = $1;
          `,
          [
            row.probe_attempt_id,
            rawSubmissionHash,
            canonicalResultHash,
            now.toISOString(),
          ],
        );
        await event(db, row.probe_request_id, "probe_result_conflict", {
          probe_attempt_id: row.probe_attempt_id,
        });
        return { conflict: true as const };
      }
      return {
        conflict: false as const,
        observation: parseJson(
          existing.rows[0].normalized_observation,
        ) as HelixEnvironmentProbeObservation,
        replayed: true,
      };
    }
    const deadlinePassed = now.getTime() >= new Date(row.deadline_at).getTime();
    const externalRunExpired =
      row.run_expires_at === null ||
      now.getTime() >= new Date(row.run_expires_at).getTime();
    const externalRunActive =
      ["running", "waiting"].includes(row.run_lifecycle_status ?? "") &&
      !["completed", "failed", "budget_exhausted", "cancelled"].includes(
        row.run_completion_status ?? "",
      ) &&
      !externalRunExpired &&
      Boolean(row.run_active_operation_id);
    const firstPartyIdentityValid =
      row.execution_authority_kind === "first_party_shared_room" &&
      row.tenant_id === "first_party_browser_session" &&
      row.owner_subject_id.startsWith("first_party_subject:") &&
      row.run_id.startsWith("first_party_shared_room:");
    const firstPartyRoomAuthorityValid =
      firstPartyIdentityValid &&
      ["developer", "user"].includes(row.account_type ?? "") &&
      row.room_status !== null &&
      row.room_status !== "closed" &&
      row.member_participant_id !== null &&
      ["owner", "participant"].includes(row.member_role ?? "") &&
      row.member_presence === "present" &&
      row.member_consent_version !== null &&
      Number.isFinite(Number(row.member_consent_version)) &&
      Number(row.member_consent_version) >= 0;
    const executionActive =
      row.execution_authority_kind === "first_party_shared_room"
        ? firstPartyRoomAuthorityValid
        : externalRunActive;
    const lateDisposition =
      row.request_status === "canceled"
        ? "late_after_cancellation"
        : row.request_status === "superseded"
          ? "late_after_supersession"
          : deadlinePassed || row.request_status === "expired"
            ? "late_after_timeout"
            : !executionActive
              ? "late_after_turn_closed"
              : null;
    const provenanceValid = true;
    const freshnessAgeMs = Math.max(
      0,
      now.getTime() - new Date(rawResult.created_at).getTime(),
    );
    const resultStale = freshnessAgeMs > Number(row.freshness_requirement_ms);
    const bindingCapabilityConsent = asStringArray(
      row.binding_consent_capability_ids,
    ).includes(row.capability_id);
    const bindingAuthorityValid =
      row.binding_status === "active" &&
      row.device_status === "active" &&
      row.installation_status === "active" &&
      row.source_binding_status === "active" &&
      row.source_credential_status === "active" &&
      row.source_credential_expires_at !== null &&
      new Date(row.source_credential_expires_at).getTime() > now.getTime() &&
      row.adapter_admission_status === "active" &&
      bindingCapabilityConsent;
    const externalRunRoomAuthorityValid =
      row.account_type === "developer" &&
      row.run_tenant_id === row.tenant_id &&
      row.run_subject_id === row.owner_subject_id &&
      row.run_account_profile_id === row.owner_profile_id &&
      row.run_room_binding_status === "active" &&
      row.run_room_binding_tenant_id === row.tenant_id &&
      row.run_room_binding_subject_id === row.owner_subject_id &&
      row.run_room_binding_account_profile_id === row.owner_profile_id &&
      row.run_room_binding_room_id === row.room_id &&
      row.room_status !== null &&
      row.room_status !== "closed" &&
      row.member_presence !== null &&
      row.member_presence !== "left" &&
      row.participant_id_at_bind === row.member_participant_id &&
      row.member_role_at_bind === row.member_role &&
      Number(row.consent_version_at_bind) ===
        Number(row.member_consent_version) &&
      row.consent_receipt_ref_at_bind === row.member_consent_receipt_ref;
    const executionRoomAuthorityValid =
      row.execution_authority_kind === "first_party_shared_room"
        ? firstPartyRoomAuthorityValid
        : externalRunRoomAuthorityValid;
    const catalogStillCurrent =
      row.catalog_environment_binding_id === row.environment_binding_id &&
      (row.catalog_expires_at === null ||
        new Date(row.catalog_expires_at).getTime() > now.getTime());
    const eligibleForReentry =
      lateDisposition === null &&
      row.request_status === "leased" &&
      row.attempt_status === "leased" &&
      bindingAuthorityValid &&
      executionRoomAuthorityValid &&
      catalogStillCurrent &&
      asIso(row.lease_expires_at) > now.toISOString() &&
      !resultStale;
    const outcome = resultStale
      ? "result_stale"
      : !catalogStillCurrent
        ? "capability_version_changed"
        : !bindingAuthorityValid
          ? "binding_revoked"
          : !executionRoomAuthorityValid && lateDisposition === null
            ? "permission_revoked"
            : legacyResult
              ? outcomeForLegacyResult(legacyResult)
              : connectorResult!.outcome;
    const probeResultId = randomId("environment_probe_result");
    const evidenceRef = `environment_probe_evidence:${crypto
      .createHash("sha256")
      .update(`${row.probe_request_id}\n${canonicalResultHash}`, "utf8")
      .digest("hex")
      .slice(0, 40)}`;
    const observation: HelixEnvironmentProbeObservation = {
      schema: HELIX_ENVIRONMENT_PROBE_OBSERVATION_SCHEMA,
      probe_request_ref: row.probe_request_id,
      probe_attempt_ref: row.probe_attempt_id,
      capability_id: row.capability_id,
      capability_version: Number(row.capability_version),
      outcome,
      summary: legacyResult?.result_summary ?? connectorResult!.summary,
      result: normalizedResult,
      evidence_ref: evidenceRef,
      observation_revision: now.getTime(),
      observed_at: now.toISOString(),
      freshness_age_ms: freshnessAgeMs,
      provenance_valid: provenanceValid,
      eligible_for_current_turn_reentry: eligibleForReentry,
      late_result_disposition: lateDisposition,
      content_role: "environment_probe_observation_not_assistant_answer",
      reentry_required: true,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    await db.query(
      `
        INSERT INTO helix_environment_probe_results (
          probe_result_id,
          probe_request_id,
          probe_attempt_id,
          raw_submission_hash,
          canonical_result_hash,
          result_payload,
          provenance_valid,
          eligible_for_current_turn_reentry,
          late_result_disposition,
          received_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10
        );
      `,
      [
        probeResultId,
        row.probe_request_id,
        row.probe_attempt_id,
        rawSubmissionHash,
        canonicalResultHash,
        JSON.stringify(rawResult),
        provenanceValid,
        eligibleForReentry,
        lateDisposition,
        now.toISOString(),
      ],
    );
    await db.query(
      `
        INSERT INTO helix_environment_probe_observations (
          observation_id,
          probe_request_id,
          probe_result_id,
          evidence_ref,
          outcome,
          normalized_observation,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7);
      `,
      [
        randomId("environment_probe_observation"),
        row.probe_request_id,
        probeResultId,
        evidenceRef,
        outcome,
        JSON.stringify(observation),
        now.toISOString(),
      ],
    );
    await db.query(
      `
        UPDATE helix_environment_probe_attempts
        SET status = $2,
            raw_submission_hash = $3,
            canonical_result_hash = $4,
            late_result_disposition = $5,
            submitted_at = $6,
            completed_at = $6
        WHERE probe_attempt_id = $1;
      `,
      [
        row.probe_attempt_id,
        lateDisposition === "late_after_cancellation"
          ? "canceled"
          : lateDisposition === "late_after_supersession"
            ? "canceled"
            : lateDisposition === "late_after_timeout"
              ? "expired"
              : row.attempt_status === "leased"
                ? outcome === "succeeded"
                  ? "succeeded"
                  : "failed"
                : row.attempt_status,
        rawSubmissionHash,
        canonicalResultHash,
        lateDisposition,
        now.toISOString(),
      ],
    );
    await db.query(
      `
        UPDATE helix_environment_probe_requests
        SET status = $2,
            updated_at = $3,
            completed_at = $3
        WHERE probe_request_id = $1;
      `,
      [
        row.probe_request_id,
        lateDisposition === "late_after_cancellation"
          ? "canceled"
          : lateDisposition === "late_after_supersession"
            ? "superseded"
            : lateDisposition === "late_after_timeout"
              ? "expired"
              : outcome === "succeeded"
                ? "succeeded"
                : "failed",
        now.toISOString(),
      ],
    );
    await event(db, row.probe_request_id, "probe_result_recorded", {
      outcome,
      eligible_for_current_turn_reentry: eligibleForReentry,
      late_result_disposition: lateDisposition,
      evidence_ref: evidenceRef,
    });
    return { conflict: false as const, observation, replayed: false };
  });
  if (recorded.conflict) {
    throw new DurableEnvironmentProbeError(
      "probe_result_conflict",
      409,
      "A different result was already accepted for this probe request.",
    );
  }
  return {
    observation: recorded.observation,
    replayed: recorded.replayed,
  };
};

export const readDurableEnvironmentProbeObservation = async (
  requestId: string,
): Promise<HelixEnvironmentProbeObservation | null> => {
  const db = await readSharedRealtimeRoomDatabase();
  const result = await db.query<ObservationRow>(
    `
      SELECT normalized_observation
      FROM helix_environment_probe_observations
      WHERE probe_request_id = $1
      ORDER BY created_at
      LIMIT 1;
    `,
    [requestId],
  );
  const value = parseJson(result.rows[0]?.normalized_observation);
  return value as HelixEnvironmentProbeObservation | null;
};

export type DurableEnvironmentProbeContinuationEvidence = {
  schema: "helix.environment_connector.prior_probe_evidence.v1";
  probe_request_ref: string;
  prior_turn_id: string;
  room_id: string;
  source_id: string;
  world_id: string;
  environment_binding_ref: string;
  catalog_snapshot_ref: string;
  adapter_profile_id: string;
  adapter_profile_version: number;
  adapter_contract_hash: string;
  manifest_hash: string;
  producer_epoch_ref: string;
  capability_id: string;
  capability_version: number;
  semantic_arguments: Record<string, unknown>;
  observation: HelixEnvironmentProbeObservation;
  evidence_age_ms: number;
  content_role: "prior_environment_probe_evidence_not_assistant_answer";
  reentry_required: true;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

const boundedContinuationArguments = (
  value: unknown,
): Record<string, unknown> => {
  const source = asRecord(parseJson(value));
  const result: Record<string, unknown> = {};
  for (const key of [
    "target",
    "position",
    "radius",
    "radius_blocks",
    "max_distance",
    "max_distance_blocks",
    "max_results",
  ]) {
    const entry = source[key];
    if (
      typeof entry === "string" ||
      typeof entry === "number" ||
      typeof entry === "boolean"
    ) {
      result[key] = entry;
      continue;
    }
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      result[key] = Object.fromEntries(
        Object.entries(entry as Record<string, unknown>)
          .filter(
            ([field, fieldValue]) =>
              [
                "kind",
                "target_kind",
                "actor_id",
                "actor_label",
                "dimension",
                "x",
                "y",
                "z",
              ].includes(field) &&
              (typeof fieldValue === "string" ||
                typeof fieldValue === "number" ||
                typeof fieldValue === "boolean"),
          )
          .slice(0, 12),
      );
    }
  }
  return result;
};

export const readDurableEnvironmentProbeContinuationEvidence = async (input: {
  requestId: string;
  expectedPriorTurnId: string;
  expectedRoomId: string;
  expectedCapabilityId: string;
  maxAgeMs?: number;
  now?: Date;
}): Promise<DurableEnvironmentProbeContinuationEvidence | null> => {
  const requestId = input.requestId.trim();
  const expectedPriorTurnId = input.expectedPriorTurnId.trim();
  const expectedRoomId = input.expectedRoomId.trim();
  const expectedCapabilityId = input.expectedCapabilityId.trim();
  if (
    !requestId ||
    !expectedPriorTurnId ||
    !expectedRoomId ||
    !expectedCapabilityId
  ) {
    return null;
  }
  const db = await readSharedRealtimeRoomDatabase();
  const result = await db.query<ContinuationEvidenceRow>(
    `
      SELECT
        r.*,
        b.world_id,
        b.status AS binding_status,
        o.normalized_observation
      FROM helix_environment_probe_requests r
      INNER JOIN helix_environment_connector_bindings b
        ON b.environment_binding_id = r.environment_binding_id
      INNER JOIN helix_environment_probe_observations o
        ON o.probe_request_id = r.probe_request_id
      WHERE r.probe_request_id = $1
      LIMIT 1;
    `,
    [requestId],
  );
  const row = result.rows[0];
  if (
    !row ||
    row.turn_id !== expectedPriorTurnId ||
    row.room_id !== expectedRoomId ||
    row.capability_id !== expectedCapabilityId ||
    row.status !== "succeeded" ||
    row.binding_status !== "active"
  ) {
    return null;
  }
  const parsedObservation = helixEnvironmentProbeObservationSchema.safeParse(
    parseJson(row.normalized_observation),
  );
  if (
    !parsedObservation.success ||
    parsedObservation.data.probe_request_ref !== requestId ||
    parsedObservation.data.capability_id !== expectedCapabilityId ||
    parsedObservation.data.outcome !== "succeeded" ||
    parsedObservation.data.provenance_valid !== true ||
    parsedObservation.data.eligible_for_current_turn_reentry !== true
  ) {
    return null;
  }
  const now = input.now ?? new Date();
  const observedAtMs = Date.parse(parsedObservation.data.observed_at);
  const evidenceAgeMs = now.getTime() - observedAtMs;
  const maxAgeMs = Math.max(
    5_000,
    Math.min(input.maxAgeMs ?? 120_000, 10 * 60_000),
  );
  if (
    !Number.isFinite(observedAtMs) ||
    evidenceAgeMs < 0 ||
    evidenceAgeMs > maxAgeMs
  ) {
    return null;
  }
  return {
    schema: "helix.environment_connector.prior_probe_evidence.v1",
    probe_request_ref: requestId,
    prior_turn_id: row.turn_id,
    room_id: row.room_id,
    source_id: row.source_id,
    world_id: row.world_id,
    environment_binding_ref: row.environment_binding_id,
    catalog_snapshot_ref: row.catalog_snapshot_id,
    adapter_profile_id: row.adapter_profile_id,
    adapter_profile_version: Number(row.adapter_profile_version),
    adapter_contract_hash: row.adapter_contract_hash,
    manifest_hash: row.manifest_hash,
    producer_epoch_ref: row.producer_epoch_ref,
    capability_id: row.capability_id,
    capability_version: Number(row.capability_version),
    semantic_arguments: boundedContinuationArguments(row.arguments),
    observation: parsedObservation.data,
    evidence_age_ms: evidenceAgeMs,
    content_role: "prior_environment_probe_evidence_not_assistant_answer",
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export const awaitDurableEnvironmentProbeObservation = async (input: {
  requestId: string;
  signal?: AbortSignal;
  deadlineAt: string;
}): Promise<HelixEnvironmentProbeObservation> => {
  for (;;) {
    if (input.signal?.aborted) {
      await cancelDurableEnvironmentProbe({
        requestId: input.requestId,
        reason: "request_canceled",
      });
      throw new DurableEnvironmentProbeError(
        "request_canceled",
        499,
        "The waiting reasoning turn was canceled.",
      );
    }
    const observation = await readDurableEnvironmentProbeObservation(
      input.requestId,
    );
    if (observation) return observation;
    if (Date.now() >= new Date(input.deadlineAt).getTime()) {
      await expireDurableEnvironmentProbe(input.requestId);
      const expiredObservation = await readDurableEnvironmentProbeObservation(
        input.requestId,
      );
      if (expiredObservation) return expiredObservation;
      throw new DurableEnvironmentProbeError(
        "probe_timeout",
        504,
        "The connector did not return a result before the probe deadline.",
      );
    }
    await new Promise<void>((resolve) => setTimeout(resolve, WAIT_POLL_MS));
  }
};

export const cancelDurableEnvironmentProbe = async (input: {
  requestId: string;
  reason: string;
}): Promise<boolean> =>
  withSharedRealtimeRoomTransaction(async (db: Queryable) => {
    const result = await db.query<{ probe_request_id: string }>(
      `
        UPDATE helix_environment_probe_requests
        SET status = 'canceled',
            cancellation_reason = $2,
            updated_at = now(),
            completed_at = now()
        WHERE probe_request_id = $1
          AND status IN ('pending', 'leased')
        RETURNING probe_request_id;
      `,
      [input.requestId, input.reason],
    );
    if (!result.rows[0]) return false;
    await db.query(
      `
        UPDATE helix_environment_probe_attempts
        SET status = 'canceled', completed_at = now()
        WHERE probe_request_id = $1 AND status = 'leased';
      `,
      [input.requestId],
    );
    await event(db, input.requestId, "probe_canceled", {
      reason: input.reason,
    });
    const request = await db.query<ProbeRequestRow>(
      `
        SELECT *
        FROM helix_environment_probe_requests
        WHERE probe_request_id = $1
        LIMIT 1;
      `,
      [input.requestId],
    );
    if (request.rows[0]) {
      await recordBrokerOutcomeObservation(db, {
        request: request.rows[0],
        outcome: "request_canceled",
        summary: "The waiting environment probe was canceled.",
        eligibleForCurrentTurnReentry: false,
        now: new Date(),
      });
    }
    return true;
  });

export const supersedeDurableEnvironmentProbe = async (input: {
  requestId: string;
  supersededByRequestId: string;
  reason: string;
}): Promise<boolean> => {
  if (input.requestId === input.supersededByRequestId) {
    throw new DurableEnvironmentProbeError(
      "request_superseded",
      400,
      "An environment probe cannot supersede itself.",
    );
  }
  return withSharedRealtimeRoomTransaction(async (db: Queryable) => {
    const result = await db.query<{ probe_request_id: string }>(
      `
        UPDATE helix_environment_probe_requests
        SET status = 'superseded',
            superseded_by_request_id = $2,
            cancellation_reason = $3,
            updated_at = now(),
            completed_at = now()
        WHERE probe_request_id = $1
          AND status IN ('pending', 'leased')
        RETURNING probe_request_id;
      `,
      [input.requestId, input.supersededByRequestId, input.reason],
    );
    if (!result.rows[0]) return false;
    await db.query(
      `
        UPDATE helix_environment_probe_attempts
        SET status = 'canceled', completed_at = now()
        WHERE probe_request_id = $1 AND status = 'leased';
      `,
      [input.requestId],
    );
    await event(db, input.requestId, "probe_superseded", {
      superseded_by_request_id: input.supersededByRequestId,
      reason: input.reason,
    });
    const request = await db.query<ProbeRequestRow>(
      `
        SELECT *
        FROM helix_environment_probe_requests
        WHERE probe_request_id = $1
        LIMIT 1;
      `,
      [input.requestId],
    );
    if (request.rows[0]) {
      await recordBrokerOutcomeObservation(db, {
        request: request.rows[0],
        outcome: "request_superseded",
        summary: "The environment probe was replaced by a newer exact request.",
        eligibleForCurrentTurnReentry: false,
        now: new Date(),
      });
    }
    return true;
  });
};

export const expireDurableEnvironmentProbe = async (
  requestId: string,
): Promise<boolean> =>
  withSharedRealtimeRoomTransaction(async (db: Queryable) => {
    const result = await db.query<{ probe_request_id: string }>(
      `
        UPDATE helix_environment_probe_requests
        SET status = 'expired', updated_at = now(), completed_at = now()
        WHERE probe_request_id = $1
          AND status IN ('pending', 'leased')
        RETURNING probe_request_id;
      `,
      [requestId],
    );
    if (!result.rows[0]) return false;
    await db.query(
      `
        UPDATE helix_environment_probe_attempts
        SET status = 'expired', completed_at = now()
        WHERE probe_request_id = $1 AND status = 'leased';
      `,
      [requestId],
    );
    await event(db, requestId, "probe_expired");
    const request = await db.query<ProbeRequestRow>(
      `
        SELECT *
        FROM helix_environment_probe_requests
        WHERE probe_request_id = $1
        LIMIT 1;
      `,
      [requestId],
    );
    if (request.rows[0]) {
      await recordBrokerOutcomeObservation(db, {
        request: request.rows[0],
        outcome: "probe_timeout",
        summary:
          "The connector did not return the read-only probe before its deadline.",
        eligibleForCurrentTurnReentry: true,
        now: new Date(),
      });
    }
    return true;
  });
