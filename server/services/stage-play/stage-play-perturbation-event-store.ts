import crypto from "node:crypto";
import {
  buildStagePlayPerturbationEventV1,
  type StagePlayPerturbationEventV1,
  type StagePlayPerturbationMaterialityV1,
  type StagePlayPerturbationReasonV1,
} from "@shared/contracts/stage-play-perturbation-event.v1";
import type { StagePlayBadgeGraphV1, StagePlayBadgeV1 } from "@shared/contracts/stage-play-badge-graph.v1";
import { stagePlayCurrentSourceWindowRefs } from "./stage-play-checkpoint-freshness";

type StagePlayPerturbationJobState = {
  graphId: string;
  sourceRefs: string[];
  sourceRouteSignature: string;
  visualActive: boolean;
  audioActive: boolean;
  hazardSignature: string;
  actorObjectSignature: string;
  missingEvidenceCount: number;
  badgeIds: string[];
  updatedAt: string;
};

export type RecordStagePlayPerturbationFromGraphResult = {
  event: StagePlayPerturbationEventV1 | null;
  latestEvents: StagePlayPerturbationEventV1[];
};

const eventsByJob = new Map<string, StagePlayPerturbationEventV1[]>();
const stateByJob = new Map<string, StagePlayPerturbationJobState>();
const MAX_EVENTS_PER_JOB = 40;

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const sameStrings = (left: string[], right: string[]): boolean => {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
};

const signature = (values: string[]): string => uniqueStrings(values).sort().join("|");

const badgesByKind = (
  graph: StagePlayBadgeGraphV1,
  kinds: StagePlayBadgeV1["kind"][],
): StagePlayBadgeV1[] => graph.badges.filter((badge) => kinds.includes(badge.kind));

const currentStateForGraph = (
  graph: StagePlayBadgeGraphV1,
  updatedAt: string,
): StagePlayPerturbationJobState => {
  const sourceRefs = stagePlayCurrentSourceWindowRefs(graph);
  const sourceRouteSignature = signature((graph.sourceWindow.sourceRoutes ?? []).map((route) =>
    `${route.sourceId}:${route.modality}:${route.routeTo}:${route.selected}`
  ));
  const visualActive = graph.sourceWindow.sources.some((source) =>
    source.selectedForStagePlay &&
    source.status === "active" &&
    /visual|screen|frame/i.test(source.modality)
  );
  const audioActive = graph.sourceWindow.sources.some((source) =>
    source.selectedForStagePlay &&
    source.status === "active" &&
    /audio|transcript/i.test(source.modality)
  );
  const hazardSignature = signature(badgesByKind(graph, ["hazard", "blocked_affordance"]).map((badge) =>
    `${badge.id}:${badge.status}:${badge.reasonCodes.join(",")}`
  ));
  const actorObjectSignature = signature(badgesByKind(graph, ["actor", "prop", "resource", "world_state", "setting"]).map((badge) =>
    `${badge.id}:${badge.status}:${badge.reasonCodes.join(",")}`
  ));
  return {
    graphId: graph.graphId,
    sourceRefs,
    sourceRouteSignature,
    visualActive,
    audioActive,
    hazardSignature,
    actorObjectSignature,
    missingEvidenceCount: graph.summary.missingEvidenceCount,
    badgeIds: graph.badges.map((badge) => badge.id),
    updatedAt,
  };
};

const materialityForReason = (
  reason: StagePlayPerturbationReasonV1,
): StagePlayPerturbationMaterialityV1 => {
  if (reason === "new_visual_frame") return "minor";
  if (reason === "hazard_change" || reason === "prediction_contradicted") return "critical";
  return "meaningful";
};

const affectedBadgeIdsForReason = (
  graph: StagePlayBadgeGraphV1,
  reason: StagePlayPerturbationReasonV1,
  materiality: StagePlayPerturbationMaterialityV1 = materialityForReason(reason),
): string[] => {
  const kindsByReason: Partial<Record<StagePlayPerturbationReasonV1, StagePlayBadgeV1["kind"][]>> = {
    first_usable_observation: ["observer", "source", "compact_observation", "interpreter", "stage_interpretation"],
    new_visual_frame: ["observer", "source", "compact_observation", "interpreter", "stage_interpretation", "fusion"],
    audio_segment_arrived: ["observer", "source", "compact_observation", "interpreter", "fusion"],
    scene_change: ["compact_observation", "stage_interpretation", "setting", "actor", "prop", "world_state"],
    actor_or_object_change: ["actor", "prop", "resource", "world_state", "stage_interpretation"],
    hazard_change: ["hazard", "blocked_affordance", "affordance", "recommended_check"],
    source_route_change: ["observer", "source", "interpreter"],
    missing_evidence_resolved: ["missing_evidence", "recommended_check", "ask_checkpoint", "helix_ask_checkpoint"],
    prediction_horizon_expired: ["recommended_check", "ask_checkpoint", "helix_ask_checkpoint"],
    prediction_contradicted: ["recommended_check", "ask_checkpoint", "helix_ask_checkpoint", "answer_snapshot"],
    user_objective_changed: ["goal", "interpreter", "ask_checkpoint", "helix_ask_checkpoint", "answer_snapshot"],
  };
  const kinds = kindsByReason[reason] ?? [];
  const affected = graph.badges
    .filter((badge) => kinds.includes(badge.kind))
    .map((badge) => badge.id);
  return uniqueStrings([
    ...affected,
    ...(materiality === "minor" ? [] : ["helix_ask.checkpoint.latest", "answer_snapshot.latest", "live_output.current"]),
  ]).filter((badgeId) => graph.badges.some((badge) => badge.id === badgeId));
};

const staleAnswerSnapshotIdsForReason = (
  graph: StagePlayBadgeGraphV1,
  reason: StagePlayPerturbationReasonV1,
  materiality: StagePlayPerturbationMaterialityV1,
): string[] => {
  if (materiality === "minor") return [];
  if (reason === "missing_evidence_resolved" && hasModelReviewedAnswerSnapshot(graph)) return [];
  return graph.badges
    .filter((badge) => badge.kind === "answer_snapshot" && badge.output?.state === "model_reviewed")
    .map((badge) => badge.id);
};

const hasModelReviewedAnswerSnapshot = (graph: StagePlayBadgeGraphV1): boolean =>
  graph.badges.some((badge) =>
    badge.kind === "answer_snapshot" &&
    badge.output?.state === "model_reviewed" &&
    badge.status === "observed"
  );

const reasonForStateTransition = (
  previous: StagePlayPerturbationJobState | null,
  current: StagePlayPerturbationJobState,
): StagePlayPerturbationReasonV1 | null => {
  if (current.sourceRefs.length === 0) return null;
  if (!previous || previous.sourceRefs.length === 0) return "first_usable_observation";
  if (previous.sourceRouteSignature !== current.sourceRouteSignature) return "source_route_change";
  if (!previous.audioActive && current.audioActive) return "audio_segment_arrived";
  if (previous.hazardSignature !== current.hazardSignature) return "hazard_change";
  if (previous.actorObjectSignature !== current.actorObjectSignature) return "actor_or_object_change";
  if (current.missingEvidenceCount < previous.missingEvidenceCount) return "missing_evidence_resolved";
  if (!sameStrings(previous.sourceRefs, current.sourceRefs) && current.visualActive) return "new_visual_frame";
  if (!sameStrings(previous.sourceRefs, current.sourceRefs)) return "scene_change";
  return null;
};

export function recordStagePlayPerturbationFromGraph(input: {
  jobId: string;
  graph: StagePlayBadgeGraphV1;
  now?: string;
}): RecordStagePlayPerturbationFromGraphResult {
  const createdAt = input.now ?? input.graph.generatedAt ?? new Date().toISOString();
  const previous = stateByJob.get(input.jobId) ?? null;
  const current = currentStateForGraph(input.graph, createdAt);
  const reason = reasonForStateTransition(previous, current);
  stateByJob.set(input.jobId, current);

  if (!reason) {
    return {
      event: null,
      latestEvents: listStagePlayPerturbationEvents({ jobId: input.jobId, limit: 10 }),
    };
  }

  const checkpointResolvedMissingEvidence =
    reason === "missing_evidence_resolved" && hasModelReviewedAnswerSnapshot(input.graph);
  const materiality = checkpointResolvedMissingEvidence ? "minor" : materialityForReason(reason);
  const affectedBadgeIds = affectedBadgeIdsForReason(input.graph, reason, materiality);
  const checkpointSuggested = materiality !== "minor";
  const staleAnswerSnapshotIds = staleAnswerSnapshotIdsForReason(input.graph, reason, materiality);
  const event = buildStagePlayPerturbationEventV1({
    perturbationId: `stage_play_perturbation_event:${hashShort([
      input.jobId,
      input.graph.graphId,
      previous?.sourceRefs ?? [],
      current.sourceRefs,
      reason,
      createdAt,
    ])}`,
    jobId: input.jobId,
    graphId: input.graph.graphId,
    sourceWindowFromRefs: previous?.sourceRefs ?? [],
    sourceWindowToRefs: current.sourceRefs,
    reason,
    affectedBadgeIds,
    staleAnswerSnapshotIds,
    materiality,
    checkpointSuggested,
    evidenceRefs: uniqueStrings([
      ...current.sourceRefs,
      ...affectedBadgeIds,
      ...staleAnswerSnapshotIds,
    ]).slice(-80),
    createdAt,
  });

  const events = [
    ...(eventsByJob.get(input.jobId) ?? []).filter((entry) => entry.perturbationId !== event.perturbationId),
    event,
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  eventsByJob.set(input.jobId, events.slice(-MAX_EVENTS_PER_JOB));

  return {
    event,
    latestEvents: listStagePlayPerturbationEvents({ jobId: input.jobId, limit: 10 }),
  };
}

export function listStagePlayPerturbationEvents(input: {
  jobId?: string | null;
  graphId?: string | null;
  limit?: number;
} = {}): StagePlayPerturbationEventV1[] {
  const limit = Math.max(1, Math.min(40, Math.floor(input.limit ?? 10)));
  const events = input.jobId
    ? eventsByJob.get(input.jobId) ?? []
    : Array.from(eventsByJob.values()).flat();
  return events
    .filter((event) => !input.graphId || event.graphId === input.graphId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function getLatestStagePlayPerturbationEvent(input: {
  jobId?: string | null;
  graphId?: string | null;
} = {}): StagePlayPerturbationEventV1 | null {
  return listStagePlayPerturbationEvents({ ...input, limit: 1 })[0] ?? null;
}

export function resetStagePlayPerturbationEventsForTest(): void {
  eventsByJob.clear();
  stateByJob.clear();
}
