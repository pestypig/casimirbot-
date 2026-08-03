import crypto from "node:crypto";
import {
  resolveHelixWorkstationCapabilityAccess,
  type HelixAccountCapabilityPolicy,
} from "@shared/helix-account-session";
import { HELIX_SHARED_LIVE_ROOM_READ_SCOPE } from "@shared/contracts/helix-shared-live-room-agent.v1";
import {
  HELIX_ENVIRONMENT_ADAPTER_ADMISSION_SCHEMA,
  helixEnvironmentAdapterAdmissionProjectionSchema,
  type HelixEnvironmentAdapterAdmissionProjection,
} from "@shared/helix-environment-adapter-profile";
import type {
  EnvironmentContainerSummary,
  EnvironmentHazardSummary,
  EnvironmentObjectSummary,
  EnvironmentResourceSummary,
  HelixEnvironmentStateSnapshot,
} from "@shared/helix-environment-state-snapshot";
import type { HelixEventJournalRecord } from "@shared/helix-event-journal-query";
import {
  HELIX_ROOM_SOURCE_ADMISSION_SCHEMA,
  HELIX_ROOM_SOURCE_INGRESS_RECEIPT_SCHEMA,
  isHelixRoomSourceIngressSourceId,
  matchesHelixRoomSourceAdmission,
  type HelixRoomSourceAdmission,
  type HelixRoomSourceIngressReceipt,
} from "@shared/helix-room-source-ingress";
import type {
  HelixSharedRealtimeRoom,
  HelixSharedRealtimeRoomParticipant,
} from "@shared/helix-shared-realtime-room";
import {
  SharedLiveRoomBindingStore,
  type SharedLiveRoomRunRoomBinding,
} from "../../shared-live-room-control/binding-store";
import { getLatestEnvironmentStateSnapshot } from "../../situation-room/environment-state-snapshot-window";
import { queryEventJournal } from "../../situation-room/event-journal-store";
import {
  validatePersistedEnvironmentAdapterAdmission,
} from "../../situation-room/environment-adapter-admission-store";
import {
  resolveEnvironmentAdapterProfile,
} from "../../situation-room/environment-adapter-registry";
import {
  buildRoomSourceRequestEvidenceRef,
  buildRoomSourceRequestEvidenceRefFromProjection,
  projectRoomSourceRequestId,
  redactProtectedRoomSourceSecrets,
} from "../../situation-room/room-source-ingress-security";
import {
  readSharedRealtimeRoom,
  readSharedRealtimeRoomMembership,
  type SharedRealtimeRoomMembership,
} from "../realtime-room/room-store";
import { readSharedRealtimeRoomDatabase } from "../realtime-room/room-store/database";
import {
  currentHelixExternalCapabilityPolicy,
  type HelixExternalCapabilityPolicy,
} from "../runtime/external-capability-policy";
import type { HelixWorkstationCapabilityManifest } from "./types";

export const HELIX_BOUND_ROOM_EVIDENCE_CAPABILITY =
  "room.evidence.read_bound" as const;
export const HELIX_BOUND_ROOM_EVIDENCE_OBSERVATION_SCHEMA =
  "helix.shared_live_room.bound_room_evidence_observation.v1" as const;
export const HELIX_BOUND_ROOM_EVIDENCE_ERROR_SCHEMA =
  "helix.shared_live_room.bound_room_evidence_error.v1" as const;
export const HELIX_BOUND_ROOM_EVIDENCE_REQUIREMENT =
  "shared_live_room_evidence" as const;
export const HELIX_BOUND_ROOM_DATABASE_SCOPE = "bound_room_evidence" as const;

const DEFAULT_FRESHNESS_MS = 2 * 60 * 1_000;
const MIN_FRESHNESS_MS = 5_000;
const MAX_FRESHNESS_MS = 10 * 60 * 1_000;
const MAX_EVENTS = 8;
const MAX_EVIDENCE_REFS = 32;

export type BoundRoomEvidenceErrorCode =
  | "bound_room_external_policy_required"
  | "bound_room_identity_unavailable"
  | "bound_room_scope_not_admitted"
  | "bound_room_account_policy_blocked"
  | "bound_room_binding_required"
  | "bound_room_membership_required"
  | "bound_room_membership_changed"
  | "bound_room_consent_changed"
  | "bound_room_closed"
  | "bound_room_source_unavailable"
  | "bound_room_evidence_unavailable"
  | "bound_room_evidence_stale"
  | "bound_room_evidence_identity_mismatch";

export type BoundRoomEvidenceSourceCandidate = {
  bindingId: string;
  /** Server-owned source owner. It is routing authority, not model context. */
  ownerProfileId?: string;
  /** Server-owned credential identity only; never projected into observations. */
  credentialId?: string;
  roomId: string;
  sourceId: string;
  worldId: string;
  domainAdapter: string;
  requestProjectionId: string;
  requestSentAt: string;
  requestReceivedAt: string;
  adapterAdmission: HelixEnvironmentAdapterAdmissionProjection;
  sourceFamily: string;
  domain: string;
  requestFreshnessMaxAgeMs: number;
  freshnessMaxAgeMs: number;
  mechanicsCollectionIds: string[];
  admission: HelixRoomSourceAdmission;
};

type BoundRoomEvidenceErrorObservation = {
  schema: typeof HELIX_BOUND_ROOM_EVIDENCE_ERROR_SCHEMA;
  capability_key: typeof HELIX_BOUND_ROOM_EVIDENCE_CAPABILITY;
  status: "blocked" | "unavailable" | "stale";
  error: BoundRoomEvidenceErrorCode;
  message: string;
  retryable: boolean;
  current_turn_id: string;
  execution_enabled: false;
  may_execute_live_actions: false;
  content_role: "typed_failure_not_assistant_answer";
  reentry_required: true;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type BoundRoomEvidenceGatewayExecution = {
  ok: boolean;
  status: "completed" | "blocked" | "failed";
  summary: string;
  observation: Record<string, unknown>;
  error?: BoundRoomEvidenceErrorCode;
};

export type BoundRoomEvidenceDependencies = {
  bindingStore: Pick<SharedLiveRoomBindingStore, "getActiveRunRoomBinding">;
  readMembership: typeof readSharedRealtimeRoomMembership;
  readRoom: typeof readSharedRealtimeRoom;
  readSourceCandidate: (
    roomId: string,
  ) => Promise<BoundRoomEvidenceSourceCandidate | null>;
  queryEvents: typeof queryEventJournal;
  readLatestSnapshot: typeof getLatestEnvironmentStateSnapshot;
  now: () => Date;
  freshnessMs: () => number;
};

type SourceCandidateRow = {
  binding_id: string;
  owner_profile_id: string;
  room_id: string;
  source_id: string;
  world_id: string;
  domain_adapter: string;
  request_id: string;
  sent_at: Date | string;
  received_at: Date | string;
  response_receipt: unknown;
  credential_id: string;
  producer_epoch: string;
  adapter_admission_id: string;
  adapter_profile_id: string;
  adapter_profile_version: number | string;
  adapter_contract_hash: string;
  manifest_id: string;
  manifest_hash: string;
  adapter_source_family: string;
  mechanics_collection_ids: unknown;
  adapter_admitted_at: Date | string;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asIso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const parseJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

const uniqueStrings = (
  values: unknown[],
  limit = MAX_EVIDENCE_REFS,
): string[] =>
  Array.from(
    new Set(
      values
        .map((value: unknown) =>
          typeof value === "string" ? value.trim() : "",
        )
        .filter(Boolean),
    ),
  ).slice(0, limit);

const configuredFreshnessMs = (): number => {
  const parsed = Number(process.env.HELIX_BOUND_ROOM_EVIDENCE_MAX_AGE_MS);
  if (!Number.isFinite(parsed)) return DEFAULT_FRESHNESS_MS;
  return Math.max(
    MIN_FRESHNESS_MS,
    Math.min(MAX_FRESHNESS_MS, Math.floor(parsed)),
  );
};

const adapterAdmissionFromRow = (
  row: SourceCandidateRow,
): HelixEnvironmentAdapterAdmissionProjection =>
  helixEnvironmentAdapterAdmissionProjectionSchema.parse({
    schema: HELIX_ENVIRONMENT_ADAPTER_ADMISSION_SCHEMA,
    admission_id: row.adapter_admission_id,
    adapter_profile_id: row.adapter_profile_id,
    adapter_profile_version: Number(row.adapter_profile_version),
    adapter_contract_hash: row.adapter_contract_hash,
    manifest_id: row.manifest_id,
    manifest_hash: row.manifest_hash,
    producer_epoch_ref: `adapter_epoch:${crypto
      .createHash("sha256")
      .update(`${row.binding_id}\n${row.producer_epoch}`, "utf8")
      .digest("hex")
      .slice(0, 40)}`,
    source_family: row.adapter_source_family,
    mechanics_collection_ids: Array.isArray(row.mechanics_collection_ids)
      ? row.mechanics_collection_ids
      : [],
    admitted_at: asIso(row.adapter_admitted_at),
    content_role: "adapter_admission_not_assistant_answer",
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });

const buildAdmission = (row: SourceCandidateRow): HelixRoomSourceAdmission => {
  const requestProjectionId = projectRoomSourceRequestId({
    bindingId: row.binding_id,
    requestId: row.request_id,
  });
  const adapterAdmission = adapterAdmissionFromRow(row);
  return {
    schema: HELIX_ROOM_SOURCE_ADMISSION_SCHEMA,
    transport: "room_source_ingress",
    binding_id: row.binding_id,
    request_id: requestProjectionId,
    room_id: row.room_id,
    source_id: row.source_id,
    world_id: row.world_id,
    domain_adapter: row.domain_adapter,
    adapter_admission: adapterAdmission,
    evidence_refs: [
      row.binding_id,
      buildRoomSourceRequestEvidenceRef({
        bindingId: row.binding_id,
        requestId: row.request_id,
      }),
      adapterAdmission.admission_id,
      adapterAdmission.adapter_contract_hash,
      adapterAdmission.manifest_id,
      adapterAdmission.manifest_hash,
      adapterAdmission.producer_epoch_ref,
      ...adapterAdmission.mechanics_collection_ids,
    ],
    content_role: "source_admission_not_assistant_answer",
    reentry_required: true,
    model_invoked: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

const receiptMatchesCandidate = (
  row: SourceCandidateRow,
  receipt: unknown,
): receipt is HelixRoomSourceIngressReceipt => {
  const value = asRecord(parseJson(receipt));
  const admission = buildAdmission(row);
  const observation = asRecord(value?.observation_ref);
  const receiptAdmission = asRecord(observation?.source_admission);
  return Boolean(
    value &&
    value.schema === HELIX_ROOM_SOURCE_INGRESS_RECEIPT_SCHEMA &&
    value.ok === true &&
    value.accepted === true &&
    value.kind === "world_event_batch" &&
    value.binding_id === row.binding_id &&
    value.room_id === row.room_id &&
    value.source_id === row.source_id &&
    value.world_id === row.world_id &&
    value.request_id === admission.request_id &&
    receiptAdmission &&
    receiptAdmission.request_id === admission.request_id &&
    receiptAdmission.binding_id === admission.binding_id &&
    receiptAdmission.room_id === admission.room_id &&
    receiptAdmission.source_id === admission.source_id &&
    receiptAdmission.world_id === admission.world_id &&
    receiptAdmission.domain_adapter === admission.domain_adapter &&
    asRecord(receiptAdmission.adapter_admission)?.admission_id ===
      admission.adapter_admission?.admission_id &&
    asRecord(receiptAdmission.adapter_admission)?.adapter_contract_hash ===
      admission.adapter_admission?.adapter_contract_hash &&
    asRecord(receiptAdmission.adapter_admission)?.manifest_hash ===
      admission.adapter_admission?.manifest_hash &&
    asRecord(receiptAdmission.adapter_admission)?.producer_epoch_ref ===
      admission.adapter_admission?.producer_epoch_ref &&
    Array.isArray(receiptAdmission.evidence_refs) &&
    receiptAdmission.evidence_refs.includes(
      buildRoomSourceRequestEvidenceRef({
        bindingId: row.binding_id,
        requestId: row.request_id,
      }),
    ) &&
    value.answer_authority === false &&
    value.assistant_answer === false &&
    value.terminal_eligible === false &&
    value.raw_content_included === false,
  );
};

/**
 * Reads only the newest currently credentialed, registry-admitted ingress
 * request.
 * The returned admission is reconstructed from durable server-owned identity;
 * no source payload may select a run, account, room, or Ask turn.
 */
export const listLatestBoundRoomSourceCandidates = async (
  roomId: string,
): Promise<BoundRoomEvidenceSourceCandidate[]> => {
  const db = await readSharedRealtimeRoomDatabase();
  const { rows } = await db.query<SourceCandidateRow>(
    `
      SELECT
        b.binding_id,
        b.owner_profile_id,
        b.room_id,
        b.source_id,
        b.world_id,
        b.domain_adapter,
        q.request_id,
        q.credential_id,
        q.producer_epoch,
        q.sent_at,
        q.received_at,
        q.response_receipt,
        a.admission_id AS adapter_admission_id,
        a.adapter_profile_id,
        a.adapter_profile_version,
        a.adapter_contract_hash,
        a.manifest_id,
        a.manifest_hash,
        a.source_family AS adapter_source_family,
        a.mechanics_collection_ids,
        a.admitted_at AS adapter_admitted_at
      FROM helix_room_source_bindings b
      JOIN helix_shared_realtime_rooms r
        ON r.room_id = b.room_id
      JOIN helix_shared_realtime_room_members owner_member
        ON owner_member.room_id = b.room_id
        AND owner_member.profile_id = b.owner_profile_id
        AND owner_member.member_role = 'owner'
        AND owner_member.presence <> 'left'
      JOIN helix_room_source_credentials c
        ON c.binding_id = b.binding_id
        AND c.status = 'active'
        AND c.expires_at > now()
      JOIN helix_room_source_ingress_requests q
        ON q.binding_id = b.binding_id
        AND q.credential_id = c.credential_id
        AND q.route_key = 'world-events/batch'
        AND q.response_status BETWEEN 200 AND 299
        AND q.response_receipt IS NOT NULL
      JOIN helix_environment_adapter_admissions a
        ON a.binding_id = q.binding_id
        AND a.credential_id = q.credential_id
        AND a.producer_epoch = q.producer_epoch
        AND a.status = 'active'
      WHERE b.room_id = $1
        AND b.status = 'active'
        AND r.status <> 'closed'
      ORDER BY q.received_at DESC
      LIMIT 256;
    `,
    [roomId],
  );
  const newestRequestSeenByBinding = new Set<string>();
  const candidates: BoundRoomEvidenceSourceCandidate[] = [];
  for (const row of rows) {
    if (newestRequestSeenByBinding.has(row.binding_id)) continue;
    newestRequestSeenByBinding.add(row.binding_id);
    if (
      !isHelixRoomSourceIngressSourceId(row.source_id) ||
      !receiptMatchesCandidate(row, row.response_receipt)
    ) {
      continue;
    }
    const admission = buildAdmission(row);
    const adapterAdmission = adapterAdmissionFromRow(row);
    if (!validatePersistedEnvironmentAdapterAdmission(adapterAdmission)) {
      continue;
    }
    let profileRecord;
    try {
      profileRecord = resolveEnvironmentAdapterProfile({
        domainAdapter: row.domain_adapter,
        worldId: row.world_id,
      });
    } catch {
      continue;
    }
    if (
      profileRecord.profile.profile_id !==
        adapterAdmission.adapter_profile_id ||
      profileRecord.profile.profile_version !==
        adapterAdmission.adapter_profile_version ||
      profileRecord.contract_hash !== adapterAdmission.adapter_contract_hash ||
      profileRecord.profile.source_family !== adapterAdmission.source_family
    ) {
      continue;
    }
    if (
      !matchesHelixRoomSourceAdmission(
        {
          source_id: row.source_id,
          room_id: row.room_id,
          world_id: row.world_id,
          domain_adapter: row.domain_adapter,
        },
        admission,
      )
    ) {
      continue;
    }
    candidates.push({
      bindingId: row.binding_id,
      ownerProfileId: row.owner_profile_id,
      credentialId: row.credential_id,
      roomId: row.room_id,
      sourceId: row.source_id,
      worldId: row.world_id,
      domainAdapter: row.domain_adapter,
      requestProjectionId: admission.request_id,
      requestSentAt: asIso(row.sent_at),
      requestReceivedAt: asIso(row.received_at),
      adapterAdmission,
      sourceFamily: profileRecord.profile.source_family,
      domain: profileRecord.profile.domain,
      requestFreshnessMaxAgeMs:
        profileRecord.profile.freshness.ingress_request_max_age_ms,
      freshnessMaxAgeMs:
        profileRecord.profile.freshness.observation_max_age_ms,
      mechanicsCollectionIds:
        adapterAdmission.mechanics_collection_ids,
      admission,
    });
  }
  return candidates;
};

export const readLatestBoundRoomSourceCandidate = async (
  roomId: string,
): Promise<BoundRoomEvidenceSourceCandidate | null> =>
  (await listLatestBoundRoomSourceCandidates(roomId))[0] ?? null;

const dependencies = (
  overrides: Partial<BoundRoomEvidenceDependencies> = {},
): BoundRoomEvidenceDependencies => ({
  bindingStore: overrides.bindingStore ?? new SharedLiveRoomBindingStore(),
  readMembership: overrides.readMembership ?? readSharedRealtimeRoomMembership,
  readRoom: overrides.readRoom ?? readSharedRealtimeRoom,
  readSourceCandidate:
    overrides.readSourceCandidate ?? readLatestBoundRoomSourceCandidate,
  queryEvents: overrides.queryEvents ?? queryEventJournal,
  readLatestSnapshot:
    overrides.readLatestSnapshot ?? getLatestEnvironmentStateSnapshot,
  now: overrides.now ?? (() => new Date()),
  freshnessMs: overrides.freshnessMs ?? configuredFreshnessMs,
});

const externalOwner = (
  policy: HelixExternalCapabilityPolicy,
): {
  tenantId: string;
  issuer: string;
  subjectId: string;
  accountProfileId: string;
} | null => {
  const issuer = policy.issuer?.trim() ?? "";
  const subjectId = policy.subjectId?.trim() ?? "";
  if (
    !policy.runId.trim() ||
    !policy.tenantId.trim() ||
    !policy.accountProfileId.trim() ||
    !issuer ||
    !subjectId
  ) {
    return null;
  }
  return {
    tenantId: policy.tenantId,
    issuer,
    subjectId,
    accountProfileId: policy.accountProfileId,
  };
};

const policyAllowsBoundEvidence = (
  policy: HelixExternalCapabilityPolicy,
  accountPolicy: HelixAccountCapabilityPolicy,
): boolean => {
  const capabilityAccess = resolveHelixWorkstationCapabilityAccess(
    accountPolicy,
    {
      capability_id: HELIX_BOUND_ROOM_EVIDENCE_CAPABILITY,
      permission_profile_required: "read",
    },
  );
  return (
    accountPolicy.feature_flags.includes("shared_realtime_rooms") &&
    !accountPolicy.locked_features.includes("shared_realtime_rooms") &&
    capabilityAccess.state === "available" &&
    policy.accountType === accountPolicy.account_type
  );
};

const errorResult = (input: {
  turnId: string;
  code: BoundRoomEvidenceErrorCode;
  message: string;
  status: BoundRoomEvidenceErrorObservation["status"];
  retryable?: boolean;
}): BoundRoomEvidenceGatewayExecution => {
  const observation: BoundRoomEvidenceErrorObservation = {
    schema: HELIX_BOUND_ROOM_EVIDENCE_ERROR_SCHEMA,
    capability_key: HELIX_BOUND_ROOM_EVIDENCE_CAPABILITY,
    status: input.status,
    error: input.code,
    message: input.message,
    retryable: input.retryable ?? false,
    current_turn_id: input.turnId,
    execution_enabled: false,
    may_execute_live_actions: false,
    content_role: "typed_failure_not_assistant_answer",
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  return {
    ok: false,
    status: input.status === "blocked" ? "blocked" : "failed",
    summary: input.message,
    observation,
    error: input.code,
  };
};

const compactItem = (value: unknown): Record<string, unknown> | null => {
  const item = asRecord(value);
  if (!item) return null;
  const itemType =
    typeof item.item_type === "string" ? item.item_type.trim() : "";
  if (!itemType) return null;
  return {
    item_type: itemType,
    count:
      typeof item.count === "number" && Number.isFinite(item.count)
        ? item.count
        : 1,
    slot:
      typeof item.slot === "string" || typeof item.slot === "number"
        ? item.slot
        : null,
    display_name:
      typeof item.display_name === "string"
        ? item.display_name.slice(0, 120)
        : null,
    durability: asRecord(item.durability),
    sensor_scope:
      typeof item.sensor_scope === "string" ? item.sensor_scope : "unknown",
  };
};

const compactSnapshot = (
  snapshot: HelixEnvironmentStateSnapshot,
): Record<string, unknown> => ({
  schema: snapshot.schema,
  snapshot_id: snapshot.snapshot_id,
  domain: snapshot.domain,
  domain_adapter: snapshot.domain_adapter,
  room_id: snapshot.room_id,
  world_id: snapshot.world_id ?? null,
  source_id: snapshot.source_id,
  actor_id: snapshot.actor_id ?? null,
  actor_label: snapshot.actor_label?.slice(0, 120) ?? null,
  ts: snapshot.ts,
  source_tick: snapshot.source_tick ?? null,
  coordinate_frame: snapshot.coordinate_frame ?? null,
  actor_state: snapshot.actor_state
    ? {
        sensor_scope: snapshot.actor_state.sensor_scope ?? "unknown",
        pose: snapshot.actor_state.pose ?? null,
        health: snapshot.actor_state.health ?? null,
        food_level: snapshot.actor_state.food_level ?? null,
        saturation: snapshot.actor_state.saturation ?? null,
        mode: snapshot.actor_state.mode ?? null,
        status_flags: (snapshot.actor_state.status_flags ?? []).slice(0, 16),
      }
    : null,
  inventory_state: snapshot.inventory_state
    ? {
        sensor_scope: snapshot.inventory_state.sensor_scope ?? "unknown",
        selected_item: compactItem(snapshot.inventory_state.selected_item),
        carried_items: (snapshot.inventory_state.carried_items ?? [])
          .slice(0, 16)
          .map(compactItem)
          .filter(Boolean),
        equipped_items: (snapshot.inventory_state.equipped_items ?? [])
          .slice(0, 8)
          .map(compactItem)
          .filter(Boolean),
        inventory_hash: snapshot.inventory_state.inventory_hash ?? null,
        changed_since_last_snapshot:
          snapshot.inventory_state.changed_since_last_snapshot ?? false,
      }
    : null,
  object_state: snapshot.object_state
    ? {
        sensor_scope: snapshot.object_state.sensor_scope ?? "unknown",
        nearby_entities: (snapshot.object_state.nearby_entities ?? [])
          .slice(0, 20)
          .map((entry: EnvironmentObjectSummary) => ({
            object_ref: entry.object_ref,
            object_type: entry.object_type,
            position: entry.position ?? null,
            distance: entry.distance ?? null,
            relative_direction: entry.relative_direction ?? null,
            classification: (entry.classification ?? []).slice(0, 8),
            threat: entry.threat ?? null,
            sensor_scope: entry.sensor_scope ?? "unknown",
          })),
        nearby_containers: (snapshot.object_state.nearby_containers ?? [])
          .slice(0, 10)
          .map((entry: EnvironmentContainerSummary) => ({
            container_ref: entry.container_ref,
            container_type: entry.container_type,
            position: entry.position ?? null,
            contents_known: entry.contents_known,
            contents_summary: (entry.contents_summary ?? [])
              .slice(0, 12)
              .map(compactItem)
              .filter(Boolean),
            last_verified_at: entry.last_verified_at ?? null,
            sensor_scope: entry.sensor_scope ?? "unknown",
            requires_caveat: entry.requires_caveat ?? false,
          })),
        resources: (snapshot.object_state.resources ?? [])
          .slice(0, 20)
          .map((entry: EnvironmentResourceSummary) => ({
            resource_ref: entry.resource_ref,
            resource_type: entry.resource_type,
            position: entry.position ?? null,
            state: entry.state ?? "unknown",
            amount: entry.amount ?? null,
            sensor_scope: entry.sensor_scope ?? "unknown",
          })),
        hazards: (snapshot.object_state.hazards ?? [])
          .slice(0, 20)
          .map((entry: EnvironmentHazardSummary) => ({
            hazard_ref: entry.hazard_ref,
            hazard_type: entry.hazard_type,
            severity: entry.severity,
            position: entry.position ?? null,
            evidence_refs: entry.evidence_refs.slice(0, 8),
            sensor_scope: entry.sensor_scope ?? "unknown",
          })),
      }
    : null,
  focus: snapshot.focus ?? null,
  route_state: snapshot.route_state
    ? {
        ...snapshot.route_state,
        evidence_refs: (snapshot.route_state.evidence_refs ?? []).slice(0, 16),
        instruction_authority: "none",
        ask_context_policy: "evidence_only",
        raw_content_included: false,
      }
    : null,
  changed_sections: snapshot.changed_sections.slice(0, 24),
  evidence_refs: snapshot.evidence_refs.slice(0, MAX_EVIDENCE_REFS),
  deterministic: true,
  model_invoked: false,
  assistant_answer: false,
  raw_payload_included: false,
  context_policy: "compact_context_pack_only",
});

const compactEvents = (
  events: HelixEventJournalRecord[],
): Array<Record<string, unknown>> =>
  events.slice(-MAX_EVENTS).map((event: HelixEventJournalRecord) => ({
    schema: event.schema,
    journal_event_id: event.journal_event_id,
    source_family: event.source_family,
    room_id: event.room_id,
    source_id: event.source_id ?? null,
    world_id: event.world_id ?? null,
    event_type: event.event_type,
    actor_id: event.actor_id ?? null,
    actor_label: event.actor_label?.slice(0, 120) ?? null,
    ts: event.ts,
    evidence_refs: event.evidence_refs.slice(0, 16),
    compact_summary: event.compact_summary.slice(0, 500),
    raw_content_included: false,
    assistant_answer: false,
  }));

const compactRoom = (
  room: HelixSharedRealtimeRoom,
): Record<string, unknown> => ({
  schema: room.schema,
  room_id: room.room_id,
  title: room.title.slice(0, 120),
  status: room.status,
  self_participant_id: room.self_participant_id,
  participant_count: room.participants.length,
  participants: room.participants
    .slice(0, 2)
    .map((participant: HelixSharedRealtimeRoomParticipant) => ({
      participant_id: participant.participant_id,
      role: participant.role,
      presence: participant.presence,
      consent: {
        consent_version: participant.consent.consent_version,
        consent_receipt_ref: participant.consent.consent_receipt_ref,
        updated_at: participant.consent.updated_at,
      },
    })),
  readiness: room.readiness,
  updated_at: room.updated_at,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const observationTimestamp = (input: {
  events: HelixEventJournalRecord[];
  snapshot: HelixEnvironmentStateSnapshot | null;
}): string | null => {
  const candidates = [
    ...input.events.map((event: HelixEventJournalRecord) => event.ts),
    input.snapshot?.ts ?? "",
  ]
    .filter(Boolean)
    .map((value) => ({ value, ms: Date.parse(value) }))
    .filter((entry) => Number.isFinite(entry.ms))
    .sort((left, right) => right.ms - left.ms);
  return candidates[0]?.value ?? null;
};

const bindingIdentityMatches = (input: {
  binding: SharedLiveRoomRunRoomBinding;
  membership: SharedRealtimeRoomMembership;
}): boolean =>
  input.binding.authorizedByProfileId === input.membership.profileId &&
  input.binding.participantIdAtBind === input.membership.participantId &&
  input.binding.memberRoleAtBind === input.membership.role;

const bindingConsentMatches = (input: {
  binding: SharedLiveRoomRunRoomBinding;
  membership: SharedRealtimeRoomMembership;
}): boolean =>
  Number.isSafeInteger(input.binding.consentVersionAtBind) &&
  input.binding.consentVersionAtBind >= 0 &&
  input.binding.consentVersionAtBind ===
    input.membership.consent.consent_version &&
  input.binding.consentReceiptRefAtBind ===
    input.membership.consent.consent_receipt_ref;

export const boundRoomEvidenceManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: HELIX_BOUND_ROOM_EVIDENCE_CAPABILITY,
  label: "Read fresh evidence from this run's bound room",
  description:
    "Reads a bounded current room projection and fresh registry-admitted environment observations. Run, owner, room, source, adapter, and membership identity are derived only from the authenticated external continuation policy.",
  panel_id: null,
  action_id: "read_bound_room_evidence",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {},
  },
  output_observation_schema: HELIX_BOUND_ROOM_EVIDENCE_OBSERVATION_SCHEMA,
  observation_schema: HELIX_BOUND_ROOM_EVIDENCE_OBSERVATION_SCHEMA,
  safety_tags: [
    "read_only",
    "authenticated_run_derived_identity",
    "exact_run_room_binding_required",
    "current_membership_rechecked",
    "fresh_registry_admitted_observation_required",
    "current_turn_reentry_required",
    "command_execution_disabled",
    "no_shell",
    "no_code_mutation",
    "non_terminal",
  ],
  assistant_answer: false,
  raw_content_included: false,
};

export const executeBoundRoomEvidenceCapability = async (input: {
  turnId: string;
  dependencies?: Partial<BoundRoomEvidenceDependencies>;
  policy?: HelixExternalCapabilityPolicy | null;
}): Promise<BoundRoomEvidenceGatewayExecution> => {
  const turnId = input.turnId.trim() || "unknown-turn";
  const policy = input.policy ?? currentHelixExternalCapabilityPolicy();
  if (!policy) {
    return errorResult({
      turnId,
      code: "bound_room_external_policy_required",
      status: "blocked",
      message:
        "Bound-room evidence is available only inside an authenticated external Agent API continuation.",
    });
  }
  const owner = externalOwner(policy);
  if (!owner) {
    return errorResult({
      turnId,
      code: "bound_room_identity_unavailable",
      status: "blocked",
      message:
        "The authenticated continuation policy did not contain an exact run owner identity.",
    });
  }
  if (
    !policy.oauthScopes?.has(HELIX_SHARED_LIVE_ROOM_READ_SCOPE) ||
    !policy.allowedCapabilities.some(
      (capability: string) =>
        capability.trim().toLowerCase() ===
        HELIX_BOUND_ROOM_EVIDENCE_CAPABILITY,
    )
  ) {
    return errorResult({
      turnId,
      code: "bound_room_scope_not_admitted",
      status: "blocked",
      message:
        "The current Agent API continuation is not admitted to bound-room evidence.",
    });
  }
  const accountPolicy = policy.accountPolicy;
  if (!accountPolicy || !policyAllowsBoundEvidence(policy, accountPolicy)) {
    return errorResult({
      turnId,
      code: "bound_room_account_policy_blocked",
      status: "blocked",
      message:
        "The current Helix account policy does not admit Shared Live Room evidence.",
    });
  }

  const deps = dependencies(input.dependencies);
  try {
    const binding = await deps.bindingStore.getActiveRunRoomBinding({
      owner,
      runId: policy.runId,
    });
    if (!binding) {
      return errorResult({
        turnId,
        code: "bound_room_binding_required",
        status: "blocked",
        message:
          "This exact Agent API run does not have an active Shared Live Room binding.",
      });
    }
    const membership = await deps.readMembership({
      roomId: binding.roomId,
      profileId: policy.accountProfileId,
    });
    if (!membership) {
      return errorResult({
        turnId,
        code: "bound_room_membership_required",
        status: "blocked",
        message:
          "The authenticated account is no longer a current member of the run's bound room.",
      });
    }
    if (!bindingIdentityMatches({ binding, membership })) {
      return errorResult({
        turnId,
        code: "bound_room_membership_changed",
        status: "blocked",
        message:
          "The current room membership identity no longer matches the membership that authorized this run binding.",
      });
    }
    if (!bindingConsentMatches({ binding, membership })) {
      return errorResult({
        turnId,
        code: "bound_room_consent_changed",
        status: "blocked",
        message:
          "The current room consent identity no longer matches the consent that authorized this run binding.",
      });
    }
    if (membership.roomStatus === "closed") {
      return errorResult({
        turnId,
        code: "bound_room_closed",
        status: "blocked",
        message: "The run's bound Shared Live Room is closed.",
      });
    }

    const room = await deps.readRoom({
      roomId: binding.roomId,
      profileId: policy.accountProfileId,
    });
    const roomSelf = room.participants.find(
      (participant: HelixSharedRealtimeRoomParticipant) =>
        participant.participant_id === room.self_participant_id,
    );
    if (
      room.status === "closed" ||
      room.self_participant_id !== membership.participantId ||
      !roomSelf ||
      roomSelf.role !== binding.memberRoleAtBind
    ) {
      return errorResult({
        turnId,
        code:
          room.status === "closed"
            ? "bound_room_closed"
            : "bound_room_membership_changed",
        status: "blocked",
        message:
          room.status === "closed"
            ? "The run's bound Shared Live Room is closed."
            : "The current room projection does not match the authorizing participant identity.",
      });
    }
    if (
      roomSelf.consent.consent_version !== binding.consentVersionAtBind ||
      roomSelf.consent.consent_receipt_ref !== binding.consentReceiptRefAtBind
    ) {
      return errorResult({
        turnId,
        code: "bound_room_consent_changed",
        status: "blocked",
        message:
          "The current room projection no longer carries the consent identity that authorized this run binding.",
      });
    }

    const source = await deps.readSourceCandidate(binding.roomId);
    if (!source) {
      return errorResult({
        turnId,
        code: "bound_room_source_unavailable",
        status: "unavailable",
        retryable: true,
        message:
          "No active, currently credentialed registry-admitted observation source has a verified accepted world-event request for this room.",
      });
    }
    if (
      source.roomId !== binding.roomId ||
      !matchesHelixRoomSourceAdmission(
        {
          source_id: source.sourceId,
          room_id: source.roomId,
          world_id: source.worldId,
          domain_adapter: source.domainAdapter,
        },
        source.admission,
      )
    ) {
      return errorResult({
        turnId,
        code: "bound_room_evidence_identity_mismatch",
        status: "blocked",
        message:
          "The durable source admission does not match the exact bound room/source/world identity.",
      });
    }

    const requestEvidenceRef = buildRoomSourceRequestEvidenceRefFromProjection({
      bindingId: source.bindingId,
      requestProjectionId: source.requestProjectionId,
    });
    const eventResult = deps.queryEvents({
      room_id: binding.roomId,
      source_id: source.sourceId,
      world_id: source.worldId,
      source_family: source.sourceFamily,
      include_raw_events: false,
      limit: MAX_EVENTS * 4,
      sourceAdmission: source.admission,
    });
    const events = eventResult.events
      .filter(
        (event: HelixEventJournalRecord) =>
          event.room_id === source.roomId &&
          event.source_id === source.sourceId &&
          event.world_id === source.worldId &&
          event.evidence_refs.includes(requestEvidenceRef) &&
          event.raw_content_included === false,
      )
      .slice(-MAX_EVENTS);
    const candidateSnapshot = deps.readLatestSnapshot(binding.roomId, {
      sourceAdmission: source.admission,
    });
    const snapshot =
      candidateSnapshot &&
      candidateSnapshot.room_id === source.roomId &&
      candidateSnapshot.source_id === source.sourceId &&
      candidateSnapshot.world_id === source.worldId &&
      candidateSnapshot.domain_adapter === source.domainAdapter &&
      candidateSnapshot.evidence_refs.includes(requestEvidenceRef) &&
      candidateSnapshot.raw_payload_included === false
        ? candidateSnapshot
        : null;
    const observedAt = observationTimestamp({ events, snapshot });
    const now = deps.now();
    const freshnessMs = Math.min(
      deps.freshnessMs(),
      source.freshnessMaxAgeMs,
    );
    const requestFreshnessMs = Math.min(
      deps.freshnessMs(),
      source.requestFreshnessMaxAgeMs,
    );
    const requestReceivedMs = Date.parse(source.requestReceivedAt);
    const observedMs = observedAt ? Date.parse(observedAt) : Number.NaN;
    const requestAgeMs = now.getTime() - requestReceivedMs;
    const observationAgeMs = now.getTime() - observedMs;
    if (
      !Number.isFinite(requestAgeMs) ||
      requestAgeMs < -30_000 ||
      requestAgeMs > requestFreshnessMs
    ) {
      return errorResult({
        turnId,
        code: "bound_room_evidence_stale",
        status: "stale",
        retryable: true,
        message:
          "The newest verified adapter ingress request for the bound room is stale.",
      });
    }
    if (!observedAt || (events.length === 0 && !snapshot)) {
      return errorResult({
        turnId,
        code: "bound_room_evidence_unavailable",
        status: "unavailable",
        retryable: true,
        message:
          "The source request is verified, but no bounded process-local observation with the exact request provenance is currently available.",
      });
    }
    if (
      !Number.isFinite(observationAgeMs) ||
      observationAgeMs < -30_000 ||
      observationAgeMs > freshnessMs
    ) {
      return errorResult({
        turnId,
        code: "bound_room_evidence_stale",
        status: "stale",
        retryable: true,
        message:
          "The newest exact-provenance environment observation for the bound room is stale.",
      });
    }

    const finalMembership = await deps.readMembership({
      roomId: binding.roomId,
      profileId: policy.accountProfileId,
    });
    if (!finalMembership) {
      return errorResult({
        turnId,
        code: "bound_room_membership_required",
        status: "blocked",
        message:
          "The authenticated account left the run's bound room while evidence was being selected.",
      });
    }
    if (!bindingIdentityMatches({ binding, membership: finalMembership })) {
      return errorResult({
        turnId,
        code: "bound_room_membership_changed",
        status: "blocked",
        message:
          "The authorizing room membership changed while evidence was being selected.",
      });
    }
    if (!bindingConsentMatches({ binding, membership: finalMembership })) {
      return errorResult({
        turnId,
        code: "bound_room_consent_changed",
        status: "blocked",
        message:
          "The authorizing room consent changed while evidence was being selected.",
      });
    }
    if (finalMembership.roomStatus === "closed") {
      return errorResult({
        turnId,
        code: "bound_room_closed",
        status: "blocked",
        message:
          "The run's bound Shared Live Room closed while evidence was being selected.",
      });
    }

    const evidenceRefs = uniqueStrings([
      ...source.admission.evidence_refs,
      ...events.flatMap(
        (event: HelixEventJournalRecord) => event.evidence_refs,
      ),
      ...(snapshot?.evidence_refs ?? []),
      binding.bindingId,
    ]);
    const environmentObservations = {
      event_count: events.length,
      events: compactEvents(events),
      latest_environment_state: snapshot ? compactSnapshot(snapshot) : null,
    };
    const observation = {
      schema: HELIX_BOUND_ROOM_EVIDENCE_OBSERVATION_SCHEMA,
      capability_key: HELIX_BOUND_ROOM_EVIDENCE_CAPABILITY,
      status: "succeeded",
      current_turn_id: turnId,
      current_turn_evidence: true,
      identity: {
        run_id: policy.runId,
        run_room_binding_ref: binding.bindingId,
        room_id: binding.roomId,
        source_binding_ref: source.bindingId,
        source_request_ref: requestEvidenceRef,
        source_id: source.sourceId,
        world_id: source.worldId,
        domain_adapter: source.domainAdapter,
      },
      adapter: {
        domain: source.domain,
        source_family: source.sourceFamily,
        profile_id: source.adapterAdmission.adapter_profile_id,
        profile_version:
          source.adapterAdmission.adapter_profile_version,
        contract_hash: source.adapterAdmission.adapter_contract_hash,
        admission_ref: source.adapterAdmission.admission_id,
        manifest_ref: source.adapterAdmission.manifest_id,
        manifest_hash: source.adapterAdmission.manifest_hash,
        producer_epoch_ref:
          source.adapterAdmission.producer_epoch_ref,
        mechanics_collection_ids: source.mechanicsCollectionIds,
      },
      authorization: {
        run_owner_verified: true,
        active_run_room_binding_verified: true,
        current_account_policy_rechecked: true,
        current_room_membership_rechecked: true,
        binding_consent_identity_rechecked: true,
        final_membership_rechecked_after_evidence_selection: true,
        participant_id: finalMembership.participantId,
        member_role: finalMembership.role,
        member_presence: finalMembership.presence,
        binding_authorized_at: binding.createdAt,
        binding_authorized_by_participant_id: binding.participantIdAtBind,
        binding_consent_version: binding.consentVersionAtBind,
        binding_consent_receipt_ref: binding.consentReceiptRefAtBind,
        source_owner_binding_authorized: true,
        room_member_consent_version: finalMembership.consent.consent_version,
        room_member_consent_receipt_ref:
          finalMembership.consent.consent_receipt_ref,
        consent_basis:
          "explicit_run_room_binding_plus_current_membership_and_owner_source_binding",
      },
      freshness: {
        status: "fresh",
        evaluated_at: now.toISOString(),
        max_age_ms: freshnessMs,
        request_max_age_ms: requestFreshnessMs,
        request_sent_at: source.requestSentAt,
        request_received_at: source.requestReceivedAt,
        observed_at: observedAt,
        request_age_ms: Math.max(0, Math.floor(requestAgeMs)),
        observation_age_ms: Math.max(0, Math.floor(observationAgeMs)),
      },
      room: compactRoom(room),
      environment_observations: environmentObservations,
      ...(source.domain === "minecraft"
        ? { minecraft_observations: environmentObservations }
        : {}),
      provenance: {
        transport: "room_source_ingress",
        source_admission_schema: source.admission.schema,
        source_admission_verified: true,
        adapter_admission_schema:
          source.adapterAdmission.schema,
        adapter_admission_verified: true,
        adapter_contract_hash:
          source.adapterAdmission.adapter_contract_hash,
        manifest_hash: source.adapterAdmission.manifest_hash,
        exact_request_provenance_verified: true,
        evidence_refs: evidenceRefs,
        raw_source_payload_included: false,
        raw_world_events_included: false,
        current_turn_reentry_required: true,
      },
      execution_enabled: false,
      may_execute_live_actions: false,
      may_perform_read_only_probes: false,
      content_role: "bound_room_observation_not_assistant_answer",
      reentry_required: true,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    return {
      ok: true,
      status: "completed",
      summary:
        `Read ${events.length} fresh exact-provenance ${source.sourceFamily} event(s)` +
        `${snapshot ? " and one bounded environment snapshot" : ""} from the current run's bound room.`,
      observation: redactProtectedRoomSourceSecrets(observation),
    };
  } catch {
    return errorResult({
      turnId,
      code: "bound_room_evidence_unavailable",
      status: "unavailable",
      retryable: true,
      message:
        "The bound-room evidence stores could not produce a verified current observation.",
    });
  }
};
