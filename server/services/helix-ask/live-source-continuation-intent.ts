export type HelixLiveSourceContinuationIntentKind =
  | "live_source_continuation"
  | "live_pipeline_control"
  | "live_pipeline_inspect"
  | "live_pipeline_repair"
  | "live_runtime_repair"
  | "live_answer_environment_setup";

export type HelixLiveSourceContinuationIntent = {
  schema: "helix.live_source_continuation_intent.v1";
  kind: HelixLiveSourceContinuationIntentKind;
  confidence: "high" | "medium";
  reason: string;
  requested_rate_ms?: number | null;
  assistant_answer: false;
  raw_content_included: false;
};

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^\w\s/-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const readRequestedRateMs = (text: string): number | null => {
  const every = /\bevery\s+(\d{1,3})\s*(second|seconds|sec|secs|s|minute|minutes|min|mins|m)\b/i.exec(text);
  if (!every) return null;
  const count = Number(every[1]);
  if (!Number.isFinite(count) || count <= 0) return null;
  const unit = every[2].toLowerCase();
  return unit.startsWith("m") && unit !== "ms" ? count * 60_000 : count * 1_000;
};

export function classifyLiveSourceContinuationIntent(prompt: string): HelixLiveSourceContinuationIntent | null {
  const text = normalize(prompt);
  if (!text) return null;

  const mentionsLiveSurface =
    /\b(?:screen|screenshare|screen share|tab|window|visual|camera|frame|frames|source|live answer|live source|pipeline|share)\b/.test(text);
  const continuation =
    /\b(?:keep|continue|watch|checking|check|monitor|track|look at|observe|process|analyze|analyse|describe|use)\b/.test(text);
  const setup =
    /\b(?:start|setup|set up|create|make|turn on|enable)\b/.test(text) &&
    /\b(?:live answer|live source|pipeline|visual source|screen|tab|window)\b/.test(text);
  const rate =
    /\b(?:every\s+\d+|cadence|interval|rate|10 seconds|30 seconds)\b/.test(text);
  const inspect =
    /\b(?:inspect|status|why|what happened|not updating|stuck|blocked|ready|readiness|still updating|attached|bound)\b/.test(text) &&
    /\b(?:pipeline|visual source|screen|live answer|analysis|frame|minecraft events|world events|minehut|world event)\b/.test(text);
  const repair =
    /\b(?:repair|fix|recover|run due|run analysis|analyze latest|analyse latest|capture now|capture frame|not updating|stale|attach)\b/.test(text) &&
    /\b(?:pipeline|visual|frame|source|analysis|live answer|minecraft events|world events|minehut)\b/.test(text);

  if (repair) {
    return {
      schema: "helix.live_source_continuation_intent.v1",
      kind: "live_runtime_repair",
      confidence: "high",
      reason: "Prompt requests repair or due analysis for live source pipeline.",
      requested_rate_ms: readRequestedRateMs(prompt),
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  if (inspect) {
    return {
      schema: "helix.live_source_continuation_intent.v1",
      kind: "live_pipeline_inspect",
      confidence: "high",
      reason: "Prompt asks for live source or pipeline status.",
      requested_rate_ms: readRequestedRateMs(prompt),
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  if (setup) {
    return {
      schema: "helix.live_source_continuation_intent.v1",
      kind: "live_answer_environment_setup",
      confidence: "high",
      reason: "Prompt asks to set up a live answer/source workflow.",
      requested_rate_ms: readRequestedRateMs(prompt),
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  if (mentionsLiveSurface && (continuation || rate)) {
    return {
      schema: "helix.live_source_continuation_intent.v1",
      kind: rate ? "live_pipeline_control" : "live_source_continuation",
      confidence: "high",
      reason: "Prompt asks to keep using an active live source instead of answering model-only.",
      requested_rate_ms: readRequestedRateMs(prompt),
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  return null;
}

export function buildLiveSourceContinuationCanonicalGoalFrame(input: {
  turnId: string;
  intent: HelixLiveSourceContinuationIntent;
}) {
  return {
    turn_id: input.turnId,
    goal_kind: input.intent.kind,
    answer_scope: "workspace_state",
    required_terminal_kind: "live_pipeline_receipt",
    allows_workspace_context: true,
    allows_prior_artifacts: true,
    corpus_anchors: [],
    numeric_tokens: [],
    concept_tokens: ["live_source", "pipeline"],
    confidence: input.intent.confidence,
    classifier_reasons: [input.intent.reason],
  };
}
