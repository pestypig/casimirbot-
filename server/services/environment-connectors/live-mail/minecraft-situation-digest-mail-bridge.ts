import crypto from "node:crypto";
import type { HelixEnvironmentSituationDigest } from "@shared/helix-environment-event-stream";
import type { HelixEnvironmentAdapterAdmissionProjection } from "@shared/helix-environment-adapter-profile";
import {
  matchesHelixRoomSourceAdmission,
  type HelixRoomSourceAdmission,
} from "@shared/helix-room-source-ingress";
import type { StagePlayLiveSourceMailItemV1 } from "@shared/contracts/stage-play-live-source-mail.v1";
import type { EnvironmentActionConnectorClaim } from "../actions";
import { enqueueStagePlayLiveSourceMailItem } from "../../stage-play/stage-play-live-source-mailbox-store";
import { readSharedRealtimeRoomDatabase } from "../../helix-ask/realtime-room/room-store/database";

export type MinecraftSemanticWakeSubjectIdentity = {
  participantId: string;
  subjectBindingId: string;
  selectedPlayerRef: string;
  selectedPlayerNativeId: string;
};

export type MinecraftSituationDigestMailBridgeReason =
  | "semantic_change_enqueued"
  | "routine_baseline_recorded"
  | "equivalent_semantic_state_coalesced"
  | "duplicate_digest_coalesced"
  | "environment_wake_source_unbound"
  | "environment_wake_wrong_environment"
  | "environment_wake_wrong_epoch"
  | "environment_wake_subject_unbound"
  | "environment_wake_digest_stale"
  | "environment_wake_provenance_invalid"
  | "environment_wake_revision_regressed";

export type MinecraftSituationDigestMailBridgeResult = {
  schema: "helix.minecraft_situation_digest_mail_bridge.v1";
  status: "enqueued" | "suppressed" | "blocked";
  reason: MinecraftSituationDigestMailBridgeReason;
  digest_id: string;
  mail_id: string | null;
  wake_expected: boolean;
  semantic_fingerprint: string | null;
  identity: {
    thread_id: string;
    producer_plane: "world_authority" | "player_embodiment";
    room_source_binding_id: string;
    room_id: string;
    source_id: string;
    world_id: string;
    producer_epoch_ref: string;
    subject_ref: string | null;
    participant_id: string | null;
    selected_player_ref: string | null;
    selected_player_native_id: string | null;
    observation_revision: number;
  };
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

type SemanticBaseline = {
  digestId: string;
  revision: number;
  fingerprint: string;
};

const semanticBaselineByIdentity = new Map<string, SemanticBaseline>();
const MAX_SEMANTIC_BASELINES = 2_048;

const recordSemanticBaseline = (key: string, baseline: SemanticBaseline): void => {
  semanticBaselineByIdentity.delete(key);
  semanticBaselineByIdentity.set(key, baseline);
  while (semanticBaselineByIdentity.size > MAX_SEMANTIC_BASELINES) {
    const oldest = semanticBaselineByIdentity.keys().next().value;
    if (typeof oldest !== "string") break;
    semanticBaselineByIdentity.delete(oldest);
  }
};

export const resolveMinecraftSemanticWakeSubjectIdentity = async (input: {
  roomSourceBindingId: string;
  digest: HelixEnvironmentSituationDigest;
}): Promise<MinecraftSemanticWakeSubjectIdentity | null> => {
  if (!input.digest.subject_ref) return null;
  const db = await readSharedRealtimeRoomDatabase();
  const result = await db.query<{
    participant_id: string;
    subject_binding_id: string;
    subject_ref: string;
    subject_native_id: string;
  }>(
    `SELECT s.participant_id, s.subject_binding_id, s.subject_ref,
            s.subject_native_id
       FROM helix_room_environment_subject_bindings s
       INNER JOIN helix_environment_connector_bindings e
         ON e.environment_binding_id = s.environment_binding_id
      WHERE s.subject_binding_id = $1
        AND s.room_id = $2 AND s.source_id = $3 AND s.world_id = $4
        AND s.producer_epoch_ref = $5 AND s.status = 'active'
        AND e.room_source_binding_id = $6 AND e.status = 'active'
      LIMIT 1;`,
    [
      input.digest.subject_ref,
      input.digest.room_id,
      input.digest.source_id,
      input.digest.world_id,
      input.digest.producer_epoch_ref,
      input.roomSourceBindingId,
    ],
  );
  const row = result.rows[0];
  return row
    ? {
        participantId: row.participant_id,
        subjectBindingId: row.subject_binding_id,
        selectedPlayerRef: row.subject_ref,
        selectedPlayerNativeId: row.subject_native_id,
      }
    : null;
};

const ROUTINE_EVENT_TYPES = new Set([
  "environment_state_snapshot",
  "location_sample",
  "player_location_sample",
  "minecraft_compact_event",
  "source_tick",
]);

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, stableValue(nested)]),
  );
};

const fingerprint = (value: unknown): string =>
  `sha256:${crypto
    .createHash("sha256")
    .update(JSON.stringify(stableValue(value)), "utf8")
    .digest("hex")}`;

const identityKey = (input: {
  roomSourceBindingId: string;
  digest: HelixEnvironmentSituationDigest;
}): string => [
  input.roomSourceBindingId,
  input.digest.room_id,
  input.digest.source_id,
  input.digest.world_id,
  input.digest.producer_plane,
  input.digest.producer_epoch_ref,
  input.digest.subject_ref ?? "world",
].join("|");

const actorViabilityState = (
  actor: Record<string, unknown> | null,
): Record<string, unknown> | null => {
  if (!actor) return null;
  const entries = Object.entries(actor).filter(([key]) =>
    /health|air|food|fire|lava|fall|velocity|submerg|breath|dead|alive|damage/i.test(key),
  );
  return entries.length > 0 ? Object.fromEntries(entries) : null;
};

const containsActiveSignal = (value: unknown): boolean => {
  if (value === true) return true;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  if (typeof value === "string") {
    return /^(?:active|true|yes|danger|hazard|burning|on_fire|in_lava|falling|submerged)$/i.test(
      value.trim(),
    );
  }
  if (Array.isArray(value)) return value.some(containsActiveSignal);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(containsActiveSignal);
  }
  return false;
};

const containsActorRiskSignal = (
  actorViability: Record<string, unknown> | null,
): boolean => {
  if (!actorViability) return false;
  return Object.entries(actorViability).some(([key, value]) => {
    if (/health/i.test(key) && typeof value === "number") {
      return Number.isFinite(value) && value <= 8;
    }
    if (/(?:air|breath)/i.test(key) && typeof value === "number") {
      return Number.isFinite(value) && value <= 40;
    }
    if (/food/i.test(key) && typeof value === "number") {
      return Number.isFinite(value) && value <= 4;
    }
    if (/damage/i.test(key) && typeof value === "number") {
      return Number.isFinite(value) && value > 0;
    }
    if (/velocity/i.test(key)) return false;
    return containsActiveSignal(value);
  });
};

const semanticState = (digest: HelixEnvironmentSituationDigest) => {
  const semanticEventTypes = Object.keys(digest.event_counts)
    .filter((eventType) => !ROUTINE_EVENT_TYPES.has(eventType))
    .sort();
  return {
    semantic_event_types: semanticEventTypes,
    actor_viability: actorViabilityState(digest.situation.actor),
    hazards: digest.situation.hazards,
    inventory: digest.situation.inventory,
    focus: digest.situation.focus,
    active_workflow: digest.situation.active_workflow,
  };
};

const blockedResult = (input: {
  reason: MinecraftSituationDigestMailBridgeReason;
  roomSourceBindingId: string;
  digest: HelixEnvironmentSituationDigest;
}): MinecraftSituationDigestMailBridgeResult => ({
  schema: "helix.minecraft_situation_digest_mail_bridge.v1",
  status: "blocked",
  reason: input.reason,
  digest_id: input.digest.digest_id,
  mail_id: null,
  wake_expected: false,
  semantic_fingerprint: null,
  identity: {
    thread_id: `helix-ask:room:${input.digest.room_id}`,
    producer_plane: input.digest.producer_plane,
    room_source_binding_id: input.roomSourceBindingId,
    room_id: input.digest.room_id,
    source_id: input.digest.source_id,
    world_id: input.digest.world_id,
    producer_epoch_ref: input.digest.producer_epoch_ref,
    subject_ref: input.digest.subject_ref,
    participant_id: null,
    selected_player_ref: null,
    selected_player_native_id: null,
    observation_revision: input.digest.latest_event_sequence,
  },
  assistant_answer: false,
  terminal_eligible: false,
  context_role: "tool_evidence",
  raw_content_included: false,
});

const bridgeAdmittedMinecraftSituationDigestToLiveMail = (input: {
  digest: HelixEnvironmentSituationDigest;
  roomSourceBindingId: string;
  admissionEvidenceRefs: string[];
  subjectIdentity?: MinecraftSemanticWakeSubjectIdentity | null;
  freshnessCeilingMs: number;
  now?: Date;
}): MinecraftSituationDigestMailBridgeResult => {
  const { digest } = input;
  const threadId = `helix-ask:room:${digest.room_id}`;
  const identity = {
    thread_id: threadId,
    producer_plane: digest.producer_plane,
    room_source_binding_id: input.roomSourceBindingId,
    room_id: digest.room_id,
    source_id: digest.source_id,
    world_id: digest.world_id,
    producer_epoch_ref: digest.producer_epoch_ref,
    subject_ref: digest.subject_ref,
    participant_id: input.subjectIdentity?.participantId ?? null,
    selected_player_ref: input.subjectIdentity?.selectedPlayerRef ?? null,
    selected_player_native_id: input.subjectIdentity?.selectedPlayerNativeId ?? null,
    observation_revision: digest.latest_event_sequence,
  };
  if (!digest.provenance_valid) {
    return blockedResult({
      reason: "environment_wake_provenance_invalid",
      roomSourceBindingId: input.roomSourceBindingId,
      digest,
    });
  }
  if (
    digest.situation.actor &&
    (
      !digest.subject_ref ||
      !input.subjectIdentity ||
      input.subjectIdentity.subjectBindingId !== digest.subject_ref
    )
  ) {
    return blockedResult({
      reason: "environment_wake_subject_unbound",
      roomSourceBindingId: input.roomSourceBindingId,
      digest,
    });
  }
  const nowMs = (input.now ?? new Date()).getTime();
  const observedMs = Date.parse(digest.observed_at);
  const ageMs = nowMs - observedMs;
  if (
    !Number.isFinite(observedMs) ||
    ageMs > Math.max(1, input.freshnessCeilingMs) ||
    ageMs < -30_000
  ) {
    return blockedResult({
      reason: "environment_wake_digest_stale",
      roomSourceBindingId: input.roomSourceBindingId,
      digest,
    });
  }

  const key = identityKey({
    roomSourceBindingId: input.roomSourceBindingId,
    digest,
  });
  const state = semanticState(digest);
  const semanticFingerprint = fingerprint(state);
  const previous = semanticBaselineByIdentity.get(key) ?? null;
  if (previous && digest.latest_event_sequence < previous.revision) {
    return blockedResult({
      reason: "environment_wake_revision_regressed",
      roomSourceBindingId: input.roomSourceBindingId,
      digest,
    });
  }
  if (previous?.digestId === digest.digest_id) {
    return {
      ...blockedResult({
        reason: "duplicate_digest_coalesced",
        roomSourceBindingId: input.roomSourceBindingId,
        digest,
      }),
      status: "suppressed",
      semantic_fingerprint: semanticFingerprint,
      identity,
    };
  }
  if (previous?.fingerprint === semanticFingerprint) {
    recordSemanticBaseline(key, {
      digestId: digest.digest_id,
      revision: digest.latest_event_sequence,
      fingerprint: semanticFingerprint,
    });
    return {
      ...blockedResult({
        reason: "equivalent_semantic_state_coalesced",
        roomSourceBindingId: input.roomSourceBindingId,
        digest,
      }),
      status: "suppressed",
      semantic_fingerprint: semanticFingerprint,
      identity,
    };
  }

  const firstRoutineBaseline =
    !previous &&
    state.semantic_event_types.length === 0 &&
    !containsActiveSignal(state.hazards) &&
    !containsActorRiskSignal(state.actor_viability);
  recordSemanticBaseline(key, {
    digestId: digest.digest_id,
    revision: digest.latest_event_sequence,
    fingerprint: semanticFingerprint,
  });
  if (firstRoutineBaseline) {
    return {
      ...blockedResult({
        reason: "routine_baseline_recorded",
        roomSourceBindingId: input.roomSourceBindingId,
        digest,
      }),
      status: "suppressed",
      semantic_fingerprint: semanticFingerprint,
      identity,
    };
  }

  const environmentIdentity: NonNullable<StagePlayLiveSourceMailItemV1["environmentIdentity"]> = {
    producerPlane: digest.producer_plane,
    roomSourceBindingId: input.roomSourceBindingId,
    worldId: digest.world_id,
    producerEpochRef: digest.producer_epoch_ref,
    subjectRef: digest.subject_ref,
    participantId: input.subjectIdentity?.participantId ?? null,
    selectedPlayerRef: input.subjectIdentity?.selectedPlayerRef ?? null,
    selectedPlayerNativeId: input.subjectIdentity?.selectedPlayerNativeId ?? null,
    observationRevision: digest.latest_event_sequence,
    digestId: digest.digest_id,
    digestHash: digest.digest_hash,
    provenanceValid: true,
  };
  const summaryText = JSON.stringify({
    schema: "helix.minecraft_semantic_wake_evidence.v1",
    identity,
    semantic_state: state,
    changed_fields: digest.changed_fields,
    window_ended_at: digest.window_ended_at,
    answer_authority: false,
  });
  const mail = enqueueStagePlayLiveSourceMailItem({
    threadId,
    roomId: digest.room_id,
    environmentId: input.roomSourceBindingId,
    sourceId: digest.source_id,
    sourceKind: "minecraft_world_event",
    environmentIdentity,
    evidenceRef: digest.digest_id,
    observationRef: digest.digest_id,
    sourceHash: digest.digest_hash,
    sourceIdentityKey: key,
    latestSourceIdentityKey: key,
    sourceBindingKey: input.roomSourceBindingId,
    mailLoopObservationKey: `${key}|${digest.latest_event_sequence}`,
    dedupeKey: semanticFingerprint,
    sourceEventId: digest.latest_event_refs.at(-1) ?? digest.digest_id,
    sourceEventMs: Date.parse(digest.window_ended_at),
    summaryText,
    summaryPreview: `Minecraft semantic change: ${[
      ...state.semantic_event_types,
      ...digest.changed_fields,
    ].slice(0, 8).join(", ") || "resident state changed"}.`,
    confidence: 1,
    analysisState: "analysis_ready",
    objectiveText: "Interpret the current Minecraft semantic change and revise the next plan only if warranted.",
    deterministicChangeHint: previous ? "summary_changed" : "first_summary",
    sourceFreshness: "fresh",
    evidenceRefs: [
      digest.digest_id,
      digest.digest_hash,
      input.roomSourceBindingId,
      ...input.admissionEvidenceRefs,
      digest.producer_epoch_ref,
      ...(digest.subject_ref ? [digest.subject_ref] : []),
      ...digest.latest_event_refs,
    ],
    createdAt: digest.observed_at,
  });

  return {
    schema: "helix.minecraft_situation_digest_mail_bridge.v1",
    status: "enqueued",
    reason: "semantic_change_enqueued",
    digest_id: digest.digest_id,
    mail_id: mail.mailId,
    wake_expected: mail.status === "unread",
    semantic_fingerprint: semanticFingerprint,
    identity,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
};

export const bridgeMinecraftSituationDigestToLiveMail = (input: {
  digest: HelixEnvironmentSituationDigest;
  roomSourceBindingId: string;
  sourceAdmission: HelixRoomSourceAdmission | null;
  adapterAdmission: HelixEnvironmentAdapterAdmissionProjection;
  subjectIdentity?: MinecraftSemanticWakeSubjectIdentity | null;
  freshnessCeilingMs: number;
  now?: Date;
}): MinecraftSituationDigestMailBridgeResult => {
  if (!input.sourceAdmission) {
    return blockedResult({
      reason: "environment_wake_source_unbound",
      roomSourceBindingId: input.roomSourceBindingId,
      digest: input.digest,
    });
  }
  if (
    !input.sourceAdmission.domain_adapter.startsWith("minecraft.") ||
    !input.digest.world_id.startsWith("minecraft:") ||
    !matchesHelixRoomSourceAdmission({
      room_id: input.digest.room_id,
      source_id: input.digest.source_id,
      world_id: input.digest.world_id,
    }, input.sourceAdmission) ||
    input.sourceAdmission.binding_id !== input.roomSourceBindingId
  ) {
    return blockedResult({
      reason: "environment_wake_wrong_environment",
      roomSourceBindingId: input.roomSourceBindingId,
      digest: input.digest,
    });
  }
  if (input.digest.producer_epoch_ref !== input.adapterAdmission.producer_epoch_ref) {
    return blockedResult({
      reason: "environment_wake_wrong_epoch",
      roomSourceBindingId: input.roomSourceBindingId,
      digest: input.digest,
    });
  }
  return bridgeAdmittedMinecraftSituationDigestToLiveMail({
    digest: input.digest,
    roomSourceBindingId: input.roomSourceBindingId,
    admissionEvidenceRefs: [
      input.sourceAdmission.request_id,
      input.adapterAdmission.admission_id,
    ],
    subjectIdentity: input.subjectIdentity,
    freshnessCeilingMs: input.freshnessCeilingMs,
    now: input.now,
  });
};

export const bridgeMinecraftPlayerSituationDigestToLiveMail = (input: {
  digest: HelixEnvironmentSituationDigest;
  claim: EnvironmentActionConnectorClaim;
  subjectIdentity: MinecraftSemanticWakeSubjectIdentity | null;
  freshnessCeilingMs: number;
  now?: Date;
}): MinecraftSituationDigestMailBridgeResult => {
  const { claim, digest } = input;
  if (
    !claim.actionDomainAdapter.startsWith("minecraft.") ||
    !digest.world_id.startsWith("minecraft:") ||
    digest.producer_plane !== "player_embodiment" ||
    digest.room_id !== claim.roomId ||
    digest.source_id !== claim.sourceId ||
    digest.world_id !== claim.worldId ||
    digest.subject_ref !== claim.subjectBindingId ||
    input.subjectIdentity?.participantId !== claim.participantId ||
    input.subjectIdentity?.subjectBindingId !== claim.subjectBindingId ||
    input.subjectIdentity?.selectedPlayerNativeId !== claim.subjectNativeId
  ) {
    return blockedResult({
      reason: digest.subject_ref === claim.subjectBindingId
        ? "environment_wake_wrong_environment"
        : "environment_wake_subject_unbound",
      roomSourceBindingId: claim.roomSourceBindingId,
      digest,
    });
  }
  return bridgeAdmittedMinecraftSituationDigestToLiveMail({
    digest,
    roomSourceBindingId: claim.roomSourceBindingId,
    admissionEvidenceRefs: [
      claim.authorityId,
      claim.environmentBindingId,
      claim.actionAdapterProfileId,
      claim.subjectBindingId,
    ],
    subjectIdentity: input.subjectIdentity,
    freshnessCeilingMs: input.freshnessCeilingMs,
    now: input.now,
  });
};

export const resetMinecraftSituationDigestMailBridgeForTest = (): void => {
  semanticBaselineByIdentity.clear();
};
