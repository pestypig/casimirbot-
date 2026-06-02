import type {
  LiveAnswerEnvironment,
  LiveAnswerEnvironmentDelta,
  LiveAnswerLineState,
} from "@shared/helix-live-answer-environment";
import type {
  StagePlayBadgeGraphRecommendedActionV1,
  StagePlayBadgeGraphV1,
  StagePlayBadgeKindV1,
  StagePlayBadgeV1,
} from "@shared/contracts/stage-play-badge-graph.v1";
import { updateLiveAnswerEnvironment } from "../situation-room/live-answer-environment-store";

export type StagePlayOutputLaneV1 = {
  laneId:
    | "live_answer"
    | "feedback"
    | "next_check"
    | "prediction"
    | "validation"
    | "rehearsal"
    | "debug_basis";
  label: string;
  status: "ready" | "candidate" | "blocked" | "missing_evidence" | "stale";
  text: string;
  confidence: number;
  supportingBadgeIds: string[];
  supportingActionIds: string[];
  evidenceRefs: string[];
  admission: "auto" | "ask_user" | "blocked";
  assistant_answer: false;
};

export type StagePlayLiveAnswerLineKey =
  | "situation"
  | "actor_state"
  | "resources"
  | "affordances"
  | "risk"
  | "possibilities"
  | "rehearsal"
  | "recommendation"
  | "unknowns"
  | "next_check"
  | "debug_basis";

export type StagePlayOutputLineProjectionV1 = StagePlayOutputLaneV1 & {
  lineKey: StagePlayLiveAnswerLineKey;
  lineUpdateAllowed: boolean;
  modelReviewRequired?: boolean;
};

export type StagePlayOutputLaneProjectionV1 = {
  artifactId: "stage_play_output_lane_projection";
  schemaVersion: "stage_play_output_lane_projection/v1";
  graphId: string;
  generatedAt: string;
  lanes: StagePlayOutputLineProjectionV1[];
  evidenceRefs: string[];
  context_role: "tool_evidence";
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  post_tool_model_step_required: true;
};

type LineValue = {
  value: string;
  confidence?: number | null;
  evidence_refs?: string[];
  source_event_ids?: string[];
  source?: LiveAnswerLineState["source"];
  model_invoked?: boolean;
  deterministic?: boolean;
};

type LaneBuildInput = {
  graph: StagePlayBadgeGraphV1;
  generatedAt?: string;
};

type LaneSpec = Omit<
  StagePlayOutputLineProjectionV1,
  "confidence" | "supportingBadgeIds" | "supportingActionIds" | "evidenceRefs" | "assistant_answer"
> & {
  badges?: StagePlayBadgeV1[];
  actions?: StagePlayBadgeGraphRecommendedActionV1[];
  fallbackConfidence?: number;
};

const LANE_TEXT_LIMIT = 360;

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((value): value is string =>
    typeof value === "string" && value.trim().length > 0
  ).map((value) => value.trim())));

const clampConfidence = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;

const compactText = (value: string): string => {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= LANE_TEXT_LIMIT) return trimmed;
  return `${trimmed.slice(0, LANE_TEXT_LIMIT - 1).trimEnd()}...`;
};

const badgesOfKind = (
  graph: StagePlayBadgeGraphV1,
  kinds: StagePlayBadgeKindV1[],
): StagePlayBadgeV1[] =>
  graph.badges.filter((badge) => kinds.includes(badge.kind));

const badgeTitles = (
  badges: StagePlayBadgeV1[],
  fallback: string,
  limit = 5,
): string =>
  badges.length > 0
    ? badges.slice(0, limit).map((badge) => badge.title).join(", ")
    : fallback;

const bindingText = (badge: StagePlayBadgeV1): string | null => {
  const compactBindings = badge.liveBindings
    .map((binding) => {
      const value = binding.compactValue;
      if (value === null || value === undefined || value === "") return null;
      return `${binding.bindingKind}=${String(value)}`;
    })
    .filter((value): value is string => Boolean(value))
    .slice(0, 3);
  return compactBindings.length > 0
    ? `${badge.title} (${compactBindings.join(", ")})`
    : badge.title;
};

const badgeBindingTitles = (
  badges: StagePlayBadgeV1[],
  fallback: string,
  limit = 5,
): string => {
  const labels = badges
    .map(bindingText)
    .filter((value): value is string => Boolean(value))
    .slice(0, limit);
  return labels.length > 0 ? labels.join(", ") : fallback;
};

const averageConfidence = (
  badges: StagePlayBadgeV1[],
  actions: StagePlayBadgeGraphRecommendedActionV1[],
  fallback = 0.5,
): number => {
  const values = [
    ...badges.map((badge) => badge.confidence),
    ...actions.map((action) =>
      action.admission === "blocked" ? 0.9 : action.admission === "ask_user" ? 0.72 : 0.64
    ),
  ].filter((value) => Number.isFinite(value));
  if (values.length === 0) return clampConfidence(fallback);
  return clampConfidence(values.reduce((sum, value) => sum + value, 0) / values.length);
};

const sourceWindowEvidenceRefs = (graph: StagePlayBadgeGraphV1): string[] =>
  uniqueStrings([
    graph.graphId,
    ...(graph.sourceWindow.latestSourceDescriptorRefs ?? []),
    ...(graph.sourceWindow.latestSourceProducerRefs ?? []),
    ...(graph.sourceWindow.latestRawSessionBufferRefs ?? []),
    ...graph.sourceWindow.latestObservationRefs,
    ...graph.sourceWindow.latestSnapshotRefs,
    ...graph.sourceWindow.latestDeltaOverlayRefs,
    ...graph.sourceWindow.latestNavigationRefs,
    ...graph.sourceWindow.sources.flatMap((source) => source.evidenceRefs),
  ]);

const evidenceRefsFor = (
  graph: StagePlayBadgeGraphV1,
  badges: StagePlayBadgeV1[],
  actions: StagePlayBadgeGraphRecommendedActionV1[],
): string[] =>
  uniqueStrings([
    ...sourceWindowEvidenceRefs(graph),
    ...badges.flatMap((badge) => badge.evidenceRefs),
    ...badges.flatMap((badge) => badge.sourceRefs.map((ref) => ref.id)),
    ...actions.flatMap((action) => action.evidenceRefs),
  ]).slice(-32);

const admissionFor = (
  actions: StagePlayBadgeGraphRecommendedActionV1[],
  fallback: StagePlayOutputLaneV1["admission"] = "auto",
): StagePlayOutputLaneV1["admission"] => {
  if (actions.some((action) => action.admission === "blocked")) return "blocked";
  if (actions.some((action) => action.admission === "ask_user")) return "ask_user";
  return fallback;
};

const staleStatusFor = (graph: StagePlayBadgeGraphV1): StagePlayOutputLaneV1["status"] =>
  graph.sourceWindow.freshness === "stale" || graph.sourceWindow.freshness === "missing"
    ? "stale"
    : "ready";

const makeLane = (
  graph: StagePlayBadgeGraphV1,
  spec: LaneSpec,
): StagePlayOutputLineProjectionV1 => {
  const badges = spec.badges ?? [];
  const actions = spec.actions ?? [];
  return {
    ...spec,
    text: compactText(spec.text),
    confidence: averageConfidence(badges, actions, spec.fallbackConfidence ?? 0.5),
    supportingBadgeIds: badges.map((badge) => badge.id),
    supportingActionIds: actions.map((action) => action.id),
    evidenceRefs: evidenceRefsFor(graph, badges, actions),
    admission: spec.admission ?? admissionFor(actions),
    assistant_answer: false,
  };
};

const actionText = (
  actions: StagePlayBadgeGraphRecommendedActionV1[],
  fallback: string,
  limit = 4,
): string =>
  actions.length > 0
    ? actions.slice(0, limit).map((action) => action.label).join(" ")
    : fallback;

const missingEvidenceText = (
  badges: StagePlayBadgeV1[],
  actions: StagePlayBadgeGraphRecommendedActionV1[],
): string => {
  const missing = uniqueStrings([
    ...badges.flatMap((badge) => badge.missingEvidence),
    ...actions.flatMap((action) => action.missingEvidence),
  ]).slice(0, 6);
  return missing.length > 0
    ? `Missing evidence: ${missing.join("; ")}.`
    : "No explicit missing-evidence badge is projected by Stage Play.";
};

export function buildStagePlayOutputLaneProjectionV1(
  input: LaneBuildInput,
): StagePlayOutputLaneProjectionV1 {
  const graph = input.graph;
  const settings = badgesOfKind(graph, ["setting"]);
  const actors = badgesOfKind(graph, ["actor"]);
  const goals = badgesOfKind(graph, ["goal"]);
  const resources = badgesOfKind(graph, ["resource", "prop"]);
  const affordances = badgesOfKind(graph, ["affordance"]);
  const risks = badgesOfKind(graph, ["hazard", "blocked_affordance"]);
  const proceduralBindings = badgesOfKind(graph, ["procedural_binding"]);
  const predictionBadges = graph.badges.filter((badge) =>
    badge.sourceRefs.some((ref) =>
      ref.kind === "stage_play_prediction_hypothesis" ||
      ref.kind === "stage_play_prediction_validation"
    ) ||
    badge.tags.some((tag) => /prediction|rehearsal|validation/i.test(tag))
  );
  const missingEvidenceBadges = graph.badges.filter((badge) =>
    badge.kind === "missing_evidence" || badge.missingEvidence.length > 0
  );
  const recommendedCheckBadges = badgesOfKind(graph, ["recommended_check"]);
  const nextCheckActions = graph.recommendedActions.filter((action) =>
    action.actionType === "observe_more" ||
    action.actionType === "ask_user" ||
    action.actionType === "explain_candidate" ||
    action.actionType === "safe_diagnostic_overlay"
  );
  const missingEvidenceActions = graph.recommendedActions.filter((action) =>
    action.missingEvidence.length > 0
  );
  const sourceSummary = graph.sourceWindow.sources.length > 0
    ? graph.sourceWindow.sources
        .slice(0, 5)
        .map((source) =>
          `${source.modality}:${source.status}:${source.selectedForStagePlay ? "selected" : "not_selected"}`
        )
        .join(", ")
    : `source_window=${graph.sourceWindow.freshness}`;

  const lanes: StagePlayOutputLineProjectionV1[] = [
    makeLane(graph, {
      laneId: "debug_basis",
      lineKey: "situation",
      label: "Situation",
      status: staleStatusFor(graph),
      text: [
        `Stage bounds: ${badgeTitles(settings, "no setting badge yet")}.`,
        `Actors: ${badgeTitles(actors, "no actor badge yet")}.`,
        `Objective bounds: ${badgeTitles(goals, graph.title || graph.description || "no objective badge yet")}.`,
      ].join(" "),
      admission: "auto",
      lineUpdateAllowed: true,
      badges: [...settings, ...actors, ...goals],
      fallbackConfidence: 0.58,
    }),
    makeLane(graph, {
      laneId: "debug_basis",
      lineKey: "actor_state",
      label: "Actor state",
      status: actors.length > 0 ? staleStatusFor(graph) : "missing_evidence",
      text: badgeBindingTitles(actors, "No actor badge or actor live binding is projected yet."),
      admission: "auto",
      lineUpdateAllowed: true,
      badges: actors,
      fallbackConfidence: 0.45,
    }),
    makeLane(graph, {
      laneId: "debug_basis",
      lineKey: "resources",
      label: "Resources",
      status: resources.length > 0 ? staleStatusFor(graph) : "missing_evidence",
      text: badgeBindingTitles(resources, "No resource or prop badge is projected yet."),
      admission: "auto",
      lineUpdateAllowed: true,
      badges: resources,
      fallbackConfidence: 0.44,
    }),
    makeLane(graph, {
      laneId: "debug_basis",
      lineKey: "affordances",
      label: "Affordances",
      status: affordances.length > 0 ? staleStatusFor(graph) : "missing_evidence",
      text: badgeTitles(affordances, "No available affordance badge is projected yet.", 8),
      admission: "auto",
      lineUpdateAllowed: true,
      badges: affordances,
      fallbackConfidence: 0.44,
    }),
    makeLane(graph, {
      laneId: "feedback",
      lineKey: "risk",
      label: "Risk",
      status: risks.some((badge) => badge.kind === "blocked_affordance") ? "blocked" : risks.length > 0 ? staleStatusFor(graph) : "ready",
      text: badgeTitles(risks, "No hazard or blocked-move badge is projected above threshold.", 8),
      admission: "auto",
      lineUpdateAllowed: true,
      badges: risks,
      fallbackConfidence: risks.length > 0 ? 0.78 : 0.48,
    }),
    makeLane(graph, {
      laneId: "live_answer",
      lineKey: "possibilities",
      label: "Possibilities",
      status: proceduralBindings.length > 0 ? "candidate" : "missing_evidence",
      text: badgeTitles(proceduralBindings, "No procedural binding has been composed from the current stage yet.", 6),
      admission: "auto",
      lineUpdateAllowed: true,
      badges: proceduralBindings,
      fallbackConfidence: proceduralBindings.length > 0 ? 0.68 : 0.42,
    }),
    makeLane(graph, {
      laneId: predictionBadges.some((badge) => badge.sourceRefs.some((ref) => ref.kind === "stage_play_prediction_validation"))
        ? "validation"
        : "rehearsal",
      lineKey: "rehearsal",
      label: "Rehearsal",
      status: predictionBadges.length > 0 ? "candidate" : "missing_evidence",
      text: badgeTitles(predictionBadges, "No prediction or dry-run validation has been attached to this graph yet.", 5),
      admission: "auto",
      lineUpdateAllowed: true,
      badges: predictionBadges,
      fallbackConfidence: predictionBadges.length > 0 ? 0.64 : 0.36,
    }),
    makeLane(graph, {
      laneId: "next_check",
      lineKey: "unknowns",
      label: "Unknowns",
      status: missingEvidenceBadges.length > 0 || missingEvidenceActions.length > 0 ? "missing_evidence" : "ready",
      text: missingEvidenceText(missingEvidenceBadges, missingEvidenceActions),
      admission: admissionFor(missingEvidenceActions, "auto"),
      lineUpdateAllowed: true,
      badges: missingEvidenceBadges,
      actions: missingEvidenceActions,
      fallbackConfidence: missingEvidenceBadges.length > 0 || missingEvidenceActions.length > 0 ? 0.7 : 0.5,
    }),
    makeLane(graph, {
      laneId: "next_check",
      lineKey: "next_check",
      label: "Next check",
      status: recommendedCheckBadges.length > 0 || nextCheckActions.length > 0 ? "candidate" : "ready",
      text: [
        badgeTitles(recommendedCheckBadges, ""),
        actionText(nextCheckActions, "Continue observing source cadence and rebuild the graph at the next checkpoint."),
      ].filter((value) => value.trim()).join(" "),
      admission: admissionFor(nextCheckActions, "auto"),
      lineUpdateAllowed: true,
      badges: recommendedCheckBadges,
      actions: nextCheckActions,
      fallbackConfidence: nextCheckActions.length > 0 ? 0.68 : 0.52,
    }),
    makeLane(graph, {
      laneId: "debug_basis",
      lineKey: "debug_basis",
      label: "Debug basis",
      status: staleStatusFor(graph),
      text: `Stage Play used ${graph.summary.badgeCount} badge(s), ${graph.summary.affordanceCount} affordance(s), ${graph.summary.blockedAffordanceCount} blocked move(s), ${graph.summary.proceduralBindingCount} procedural binding(s). Sources: ${sourceSummary}.`,
      admission: "auto",
      lineUpdateAllowed: true,
      badges: graph.badges.filter((badge) => badge.kind === "observer" || badge.kind === "source" || badge.kind === "interpreter"),
      fallbackConfidence: 0.66,
    }),
    makeLane(graph, {
      laneId: "live_answer",
      lineKey: "recommendation",
      label: "Recommendation",
      status: "blocked",
      text: "Stage Play did not produce a final recommendation. A post-tool model-reviewed answer is required before this line can become assistant guidance.",
      admission: "blocked",
      lineUpdateAllowed: false,
      modelReviewRequired: true,
      actions: graph.recommendedActions.filter((action) => action.admission === "blocked"),
      fallbackConfidence: 1,
    }),
  ];

  return {
    artifactId: "stage_play_output_lane_projection",
    schemaVersion: "stage_play_output_lane_projection/v1",
    graphId: graph.graphId,
    generatedAt: input.generatedAt ?? graph.generatedAt,
    lanes,
    evidenceRefs: uniqueStrings(lanes.flatMap((lane) => lane.evidenceRefs)).slice(-48),
    context_role: "tool_evidence",
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    post_tool_model_step_required: true,
  };
}

export function buildStagePlayOutputLanesV1(
  input: LaneBuildInput,
): StagePlayOutputLineProjectionV1[] {
  return buildStagePlayOutputLaneProjectionV1(input).lanes;
}

export function buildStagePlayLiveAnswerLineValuesV1(
  projection: StagePlayOutputLaneProjectionV1,
  environment?: LiveAnswerEnvironment | null,
): Record<string, LineValue> {
  const availableLines = environment
    ? new Set(environment.lines.map((line) => line.key))
    : null;
  const lineValues: Record<string, LineValue> = {};
  for (const lane of projection.lanes) {
    if (!lane.lineUpdateAllowed || lane.lineKey === "recommendation") continue;
    if (availableLines && !availableLines.has(lane.lineKey)) continue;
    lineValues[lane.lineKey] = {
      value: lane.text,
      confidence: lane.confidence,
      evidence_refs: lane.evidenceRefs,
      source_event_ids: projection.evidenceRefs.filter((ref) =>
        /live_source_observation|world_event|source_event/i.test(ref)
      ).slice(-12),
      source: "deterministic_reducer",
      model_invoked: false,
      deterministic: true,
    };
  }
  return lineValues;
}

export function reduceLiveAnswerEnvironmentFromStagePlayGraph(input: {
  environment: LiveAnswerEnvironment | null;
  graph: StagePlayBadgeGraphV1;
  now?: string;
}): {
  environment: LiveAnswerEnvironment;
  delta: LiveAnswerEnvironmentDelta;
  projection: StagePlayOutputLaneProjectionV1;
} | null {
  const environment = input.environment;
  if (!environment || environment.status !== "active") return null;
  const now = input.now ?? input.graph.generatedAt;
  const projection = buildStagePlayOutputLaneProjectionV1({
    graph: input.graph,
    generatedAt: now,
  });
  const lineValues = buildStagePlayLiveAnswerLineValuesV1(projection, environment);
  if (Object.keys(lineValues).length === 0) return null;
  const riskLane = projection.lanes.find((lane) => lane.lineKey === "risk");
  const possibilitiesLane = projection.lanes.find((lane) => lane.lineKey === "possibilities");
  const summary = riskLane?.status === "blocked"
    ? riskLane.text
    : possibilitiesLane?.text ?? `Stage Play projected ${input.graph.summary.badgeCount} badge(s).`;
  const delta = updateLiveAnswerEnvironment({
    environment_id: environment.environment_id,
    reason: "line_reasoning_update",
    line_values: lineValues,
    latest_summary: summary,
    evidence_refs: projection.evidenceRefs,
    source_event_count: input.graph.sourceWindow.latestObservationRefs.length || null,
    window_id: input.graph.graphId,
    window_count: 1,
    now,
  });
  return delta
    ? {
        environment: delta.environment,
        delta: delta.delta,
        projection,
      }
    : null;
}
