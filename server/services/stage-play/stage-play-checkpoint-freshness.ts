import type { StagePlayBadgeGraphV1 } from "@shared/contracts/stage-play-badge-graph.v1";

export type StagePlayCheckpointFreshnessV1 = {
  schema: "stage_play_checkpoint_freshness/v1";
  graphId: string;
  checkpointId?: string | null;
  modelReviewed: boolean;
  fresh: boolean;
  reason:
    | "no_checkpoint"
    | "checkpoint_model_reviewed_and_source_window_matches"
    | "checkpoint_not_model_reviewed"
    | "graph_id_mismatch"
    | "source_window_ref_mismatch"
    | "source_window_stale"
    | "checkpoint_expired";
  currentSourceRefs: string[];
  checkpointSourceRefs: string[];
  staleBecause: string[];
  assistant_answer: false;
  context_role: "tool_evidence";
};

export type StagePlayCheckpointFreshnessCandidate = {
  checkpointId?: string | null;
  graphId?: string | null;
  createdAt?: string | null;
  modelReviewed?: boolean | null;
  sourceWindowRefs?: string[] | null;
  sourceArtifactRefs?: string[] | null;
  evidenceRefs?: string[] | null;
};

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const parseTime = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function stagePlayCurrentSourceWindowRefs(graph: StagePlayBadgeGraphV1): string[] {
  return uniqueStrings([
    ...(graph.sourceWindow.latestSourceDescriptorRefs ?? []),
    ...(graph.sourceWindow.latestSourceProducerRefs ?? []),
    ...(graph.sourceWindow.latestRawSessionBufferRefs ?? []),
    ...graph.sourceWindow.latestObservationRefs,
    ...graph.sourceWindow.latestSnapshotRefs,
    ...graph.sourceWindow.latestDeltaOverlayRefs,
    ...graph.sourceWindow.latestNavigationRefs,
    ...(graph.sourceWindow.sourceRoutes ?? []).map((route) => `source_route:${route.sourceId}:${route.routeTo}`),
    ...graph.sourceWindow.sources.flatMap((source) => [
      source.sourceId,
      `${source.sourceId}:${source.modality}`,
      ...source.evidenceRefs,
    ]),
  ]);
}

const sourceWindowEventTimes = (graph: StagePlayBadgeGraphV1): number[] =>
  graph.sourceWindow.sources
    .map((source) => parseTime(source.lastEventTs))
    .filter((value): value is number => value !== null);

const latestSourceEventTime = (graph: StagePlayBadgeGraphV1): number | null => {
  const times = sourceWindowEventTimes(graph);
  return times.length > 0 ? Math.max(...times) : null;
};

const hasStaleSelectedSource = (graph: StagePlayBadgeGraphV1): boolean =>
  graph.sourceWindow.sources.some((source) =>
    source.selectedForStagePlay && source.status === "stale"
  );

const refsOverlap = (currentRefs: string[], checkpointRefs: string[]): boolean => {
  if (currentRefs.length === 0 || checkpointRefs.length === 0) return false;
  const checkpointSet = new Set(checkpointRefs);
  return currentRefs.some((ref) => checkpointSet.has(ref));
};

const refsEqual = (left: string[], right: string[]): boolean => {
  if (left.length === 0 || right.length === 0 || left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((ref) => rightSet.has(ref));
};

export function evaluateStagePlayCheckpointFreshness(input: {
  graph: StagePlayBadgeGraphV1;
  checkpoint?: StagePlayCheckpointFreshnessCandidate | null;
}): StagePlayCheckpointFreshnessV1 {
  const currentSourceRefs = stagePlayCurrentSourceWindowRefs(input.graph);
  const checkpoint = input.checkpoint ?? null;
  const checkpointSourceRefs = uniqueStrings([
    ...(checkpoint?.sourceWindowRefs ?? []),
    ...(checkpoint?.sourceArtifactRefs ?? []),
    ...(checkpoint?.evidenceRefs ?? []),
  ]);
  const explicitCheckpointSourceWindowRefs = uniqueStrings(checkpoint?.sourceWindowRefs ?? []);
  const checkpointId = checkpoint?.checkpointId ?? null;
  const base = {
    schema: "stage_play_checkpoint_freshness/v1" as const,
    graphId: input.graph.graphId,
    checkpointId,
    modelReviewed: checkpoint?.modelReviewed === true,
    currentSourceRefs,
    checkpointSourceRefs,
    assistant_answer: false as const,
    context_role: "tool_evidence" as const,
  };

  if (!checkpoint) {
    return {
      ...base,
      fresh: false,
      reason: "no_checkpoint",
      staleBecause: ["No checkpoint candidate is available for the current Stage Play graph."],
    };
  }

  if (checkpoint.modelReviewed !== true) {
    return {
      ...base,
      fresh: false,
      reason: "checkpoint_not_model_reviewed",
      staleBecause: ["Checkpoint has not completed model-reviewed answer synthesis."],
    };
  }

  if (input.graph.sourceWindow.freshness === "stale" || hasStaleSelectedSource(input.graph)) {
    return {
      ...base,
      fresh: false,
      reason: "source_window_stale",
      staleBecause: [`Current source window freshness is ${input.graph.sourceWindow.freshness}.`],
    };
  }

  const checkpointCreatedAt = parseTime(checkpoint.createdAt ?? null);
  const sourceEventTime = latestSourceEventTime(input.graph);
  if (checkpointCreatedAt !== null && sourceEventTime !== null && checkpointCreatedAt < sourceEventTime) {
    return {
      ...base,
      fresh: false,
      reason: "checkpoint_expired",
      staleBecause: ["A source event occurred after the checkpoint was produced."],
    };
  }

  const graphIdMatches = Boolean(checkpoint.graphId && checkpoint.graphId === input.graph.graphId);
  const sourceRefsMatch = explicitCheckpointSourceWindowRefs.length > 0
    ? refsEqual(currentSourceRefs, explicitCheckpointSourceWindowRefs)
    : refsOverlap(currentSourceRefs, checkpointSourceRefs);
  if (!graphIdMatches && !sourceRefsMatch) {
    return {
      ...base,
      fresh: false,
      reason: checkpoint.graphId ? "graph_id_mismatch" : "source_window_ref_mismatch",
      staleBecause: checkpoint.graphId
        ? [`Checkpoint graphId ${checkpoint.graphId} does not match ${input.graph.graphId}.`]
        : ["Checkpoint source refs do not match the current Stage Play source window."],
    };
  }

  return {
    ...base,
    fresh: true,
    reason: "checkpoint_model_reviewed_and_source_window_matches",
    staleBecause: [],
  };
}
