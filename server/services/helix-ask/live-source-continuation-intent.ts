export type HelixLiveSourceContinuationIntentKind =
  | "live_source_continuation"
  | "live_pipeline_control"
  | "live_pipeline_inspect"
  | "live_environment_binding_diagnosis"
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

const extractLiveSourceRequestedRateMs = (text: string): number | null => {
  const requestedRate =
    /\bevery\s+(\d{1,3})\s*(second|seconds|sec|secs|s|minute|minutes|min|mins|m)\b/i.exec(text) ??
    /\b(?:interval|cadence|rate)\s+(?:to\s+|of\s+|at\s+)?(\d{1,3})\s*(second|seconds|sec|secs|s|minute|minutes|min|mins|m)\b/i.exec(text) ??
    /\b(?:set|change|update)\b[\s\S]{0,40}\b(?:interval|cadence|rate)\b[\s\S]{0,20}\b(\d{1,3})\s*(second|seconds|sec|secs|s|minute|minutes|min|mins|m)\b/i.exec(text) ??
    /\b(\d{1,3})\s*(second|seconds|sec|secs|s|minute|minutes|min|mins|m)\s+(?:interval|cadence|rate)\b/i.exec(text);
  if (!requestedRate) return null;
  const count = Number(requestedRate[1]);
  if (!Number.isFinite(count) || count <= 0) return null;
  const unit = requestedRate[2].toLowerCase();
  return unit.startsWith("m") && unit !== "ms" ? count * 60_000 : count * 1_000;
};

const hasExplicitLiveOrVisualCue = (text: string): boolean =>
  /\b(?:live\s+(?:source|answer|capture|screen|visual|pipeline|environment)|visual\s+(?:source|capture|frame|screen|context|evidence)|screen\s+(?:capture|share|frame)|current\s+(?:screen|frame|visual)|describe\s+(?:the\s+)?screen|use\s+(?:the\s+)?live\s+source|look\s+at\s+(?:the\s+)?screen|capture\s+(?:frame|screen)|camera|frames?)\b/i.test(text);

const isBackendReasoningPromptWithoutLiveAsk = (text: string): boolean =>
  /\b(?:backend|code|patch(?:es)?|route|runtime|terminal\s+authority|source-targeted|source\s+targeted|audit|controller|boundary|projection|debug|repo|grep|implementation|function|file|server|client)\b/i.test(text) &&
  !hasExplicitLiveOrVisualCue(text);

export const isNegatedLiveSourceCadenceMention = (prompt: string): boolean => {
  const text = normalize(prompt);
  if (!text) return false;
  const cadenceCue = String.raw`(?:interval|cadence|rate|every\s+\d{1,3}\s*(?:seconds?|sec|secs|s|minutes?|min|mins|m)|\d{1,3}\s*(?:seconds?|sec|secs|s|minutes?|min|mins|m)\s+(?:interval|cadence|rate))`;
  const negationCue = String.raw`(?:haven\s+t|have\s+not|hasn\s+t|has\s+not|hadn\s+t|had\s+not|didn\s+t|did\s+not|don\s+t|do\s+not|not|never|without)`;
  const activationCue = String.raw`(?:start(?:ed|ing)?|set(?:ting)?|enable(?:d|ing)?|activat(?:e|ed|ing)|turn(?:ed)?\s+on|run(?:ning)?|adopt(?:ed|ing)?)`;
  return (
    new RegExp(String.raw`\b${negationCue}\b[\s\S]{0,90}\b(?:${activationCue}\b[\s\S]{0,50})?${cadenceCue}\b`).test(text) ||
    new RegExp(String.raw`\b${cadenceCue}\b[\s\S]{0,80}\b${negationCue}\b[\s\S]{0,40}\b(?:yet|active|running|started|enabled|adopted)\b`).test(text)
  );
};

export const isContextualLiveSourceCadenceMention = (prompt: string): boolean => {
  const text = normalize(prompt);
  if (!text) return false;
  const cadenceCue = String.raw`(?:interval|cadence|rate|every\s+\d{1,3}\s*(?:seconds?|sec|secs|s|minutes?|min|mins|m)|\d{1,3}\s*(?:seconds?|sec|secs|s|minutes?|min|mins|m)\s+(?:interval|cadence|rate))`;
  const activationCue = String.raw`(?:start|set|enable|activate|turn\s+on|run|use|adopt)`;
  return (
    isNegatedLiveSourceCadenceMention(prompt) ||
    new RegExp(String.raw`\b(?:before|after)\b[\s\S]{0,80}\b(?:${activationCue}\b[\s\S]{0,60})?${cadenceCue}\b`).test(text) ||
    new RegExp(String.raw`\b(?:if|when)\b[\s\S]{0,100}\b(?:later\s+)?(?:${activationCue}\b[\s\S]{0,60})?${cadenceCue}\b`).test(text) ||
    new RegExp(String.raw`\b(?:whether|was|were|had)\b[\s\S]{0,80}\b${cadenceCue}\b[\s\S]{0,60}\b(?:running|active|enabled|started|set)\b`).test(text) ||
    new RegExp(String.raw`\b${cadenceCue}\b[\s\S]{0,80}\b(?:was|were|running|active|enabled|started)\b`).test(text)
  );
};

export const isLiveSourceCadenceControlPrompt = (prompt: string): boolean => {
  const text = normalize(prompt);
  if (!text || isContextualLiveSourceCadenceMention(prompt)) return false;
  const hasRateValue = extractLiveSourceRequestedRateMs(prompt) !== null;
  const hasCadenceMention = hasRateValue || /\b(?:interval|cadence|rate)\b/.test(text);
  if (!hasCadenceMention) return false;
  return (
    /\b(?:set|change|update|make|start|enable|turn\s+on|activate|use|run)\b[\s\S]{0,100}\b(?:interval|cadence|rate|every\s+\d{1,3}|\d{1,3}\s*(?:seconds?|sec|secs|s|minutes?|min|mins|m)\s+(?:interval|cadence|rate))\b/.test(text) ||
    /\b(?:keep|continue|watch|monitor|track|check|checking)\b[\s\S]{0,100}\b(?:screen|visual|capture|frame|live\s+answer|live\s+source)\b[\s\S]{0,100}\bevery\s+\d{1,3}\b/.test(text) ||
    /\b(?:screen|visual|capture|frame|live\s+answer|live\s+source)\b[\s\S]{0,100}\b(?:keep|continue|watch|monitor|track|check|checking)\b[\s\S]{0,100}\bevery\s+\d{1,3}\b/.test(text)
  );
};

export const readLiveSourceRequestedRateMs = (text: string): number | null =>
  isContextualLiveSourceCadenceMention(text) ? null : extractLiveSourceRequestedRateMs(text);

export function classifyLiveSourceContinuationIntent(prompt: string): HelixLiveSourceContinuationIntent | null {
  const text = normalize(prompt);
  if (!text) return null;
  if (isBackendReasoningPromptWithoutLiveAsk(text)) return null;
  const contextualCadence = isContextualLiveSourceCadenceMention(prompt);
  const cadenceControl = isLiveSourceCadenceControlPrompt(prompt);
  const requestedRateMs = readLiveSourceRequestedRateMs(prompt);

  const procedureEpochComparison =
    /\b(?:what\s+changed|changed\s+since|compare|compared|difference|different)\b/.test(text) &&
    /\b(?:last|previous|prior)\s+(?:seen\s+)?(?:scene|epoch|frame|visual|screen|capture)|\bscene\s+epoch\b|\bvisual\s+epoch\b/.test(text);
  const explicitBindingDiagnosis =
    /\b(?:worker\s+lanes?|lanes?|field\s+evaluations?|interpretations?|live\s+cognition|live\s+answer\s+(?:panel|environment|card)|no\s+active\s+live\s+answer\s+environment|producer\s+stale|capture\s+(?:health|bound|binding|adopted|adoption)|client\s+adoption|scene_procedure_ready|live_card_ready)\b/.test(text) &&
    /\b(?:visual|screen|capture|live\s+answer|live\s+source|scene|frame|updating|bound|binding|attach|environment|producer|adopted|adoption|ready|readiness|stale)\b/.test(text);
  const mentionsLiveSurface =
    /\b(?:live\s+(?:source|answer|pipeline|capture)|visual\s+(?:source|capture|frame)|screen\s+(?:capture|share)|current\s+(?:screen|frame|visual)|screenshare|screen share|camera|frames?)\b/.test(text);
  const continuation =
    /\b(?:keep|continue|watch|checking|check|monitor|track|look at|observe|process|analyze|analyse|use)\b/.test(text);
  const screenVisibleControlText =
    /\b(?:text|label|button|page|screen|ui)\b[\s\S]{0,80}\b(?:says|shows|reads|contains|labeled|labelled|called|named|start(?:\s+capture)?|click|press|open|run)\b/.test(text) ||
    /\b(?:says|shows|reads|contains|labeled|labelled|called|named)\b[\s\S]{0,80}\b(?:start(?:\s+capture)?|click|press|open|run)\b/.test(text);
  const explicitlyNonAction =
    /\b(?:without|do\s+not|don\s+t|not|never)\b[\s\S]{0,60}\b(?:press|click|start|open|run|change|execute)\b/.test(text) ||
    /\b(?:what\s+does\s+that\s+imply|what\s+it\s+implies|describe|explain)\b/.test(text);
  if (screenVisibleControlText && explicitlyNonAction && !cadenceControl) return null;
  const contentQuestion =
    /\b(?:review|describe|explain|summari[sz]e|what)\b[\s\S]{0,100}\b(?:happening|see|seeing|visuals?|screen|capture|frame|image|picture|window)\b/.test(text) &&
    !cadenceControl &&
    !/\b(?:keep|continue|watch|checking|check|monitor|track|set\s+up|setup|create|pipeline|live answer)\b/.test(text);
  const setup =
    !contextualCadence &&
    !contentQuestion &&
    /\b(?:start|setup|set up|create|make|turn on|enable)\b/.test(text) &&
    /\b(?:live answer|live source|pipeline|visual source|screen|tab|window)\b/.test(text);
  const workstationCalculatorLiveSource =
    /\bcalculator\b/.test(text) &&
    /\b(?:live\s+source|equation\s+stream|first\s+tick|ticks?)\b/.test(text) &&
    !/\blive\s+answer\s+environment\b/.test(text);
  if (workstationCalculatorLiveSource) return null;
  const inspect =
    /\b(?:inspect|status|why|what happened|not updating|stuck|blocked|ready|readiness|still updating|attached|bound)\b/.test(text) &&
    /\b(?:live\s+(?:source|answer|pipeline)|visual\s+source|screen\s+capture|frame|producer|capture\s+binding|minecraft events|world events|minehut|world event)\b/.test(text);
  const bindingDiagnosis = explicitBindingDiagnosis && !procedureEpochComparison;
  const repair =
    /\b(?:repair|fix|recover|run due|run analysis|analyze latest|analyse latest|capture now|capture frame|not updating|stale|attach)\b/.test(text) &&
    /\b(?:live\s+(?:source|answer|pipeline)|visual|frame|screen\s+capture|capture\s+binding|minecraft events|world events|minehut)\b/.test(text);

  if (bindingDiagnosis) {
    return {
      schema: "helix.live_source_continuation_intent.v1",
      kind: "live_environment_binding_diagnosis",
      confidence: "high",
      reason: "Prompt asks whether visual capture is bound into Live Answer/SituationRun cognition.",
      requested_rate_ms: requestedRateMs,
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  if (repair) {
    return {
      schema: "helix.live_source_continuation_intent.v1",
      kind: "live_runtime_repair",
      confidence: "high",
      reason: "Prompt requests repair or due analysis for live source pipeline.",
      requested_rate_ms: requestedRateMs,
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
      requested_rate_ms: requestedRateMs,
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
      requested_rate_ms: requestedRateMs,
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  if (!contentQuestion && mentionsLiveSurface && (continuation || cadenceControl)) {
    return {
      schema: "helix.live_source_continuation_intent.v1",
      kind: cadenceControl ? "live_pipeline_control" : "live_source_continuation",
      confidence: "high",
      reason: "Prompt asks to keep using an active live source instead of answering model-only.",
      requested_rate_ms: requestedRateMs,
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
  const diagnosis = input.intent.kind === "live_environment_binding_diagnosis";
  return {
    turn_id: input.turnId,
    goal_kind: input.intent.kind,
    answer_scope: "workspace_state",
    required_terminal_kind: diagnosis ? "live_environment_binding_diagnosis" : "live_pipeline_receipt",
    allows_workspace_context: true,
    allows_prior_artifacts: true,
    corpus_anchors: diagnosis ? ["visual_capture", "live_answer_environment", "situation_run"] : [],
    numeric_tokens: [],
    concept_tokens: diagnosis
      ? ["live_source", "live_answer_environment", "situation_run", "field_evaluations", "interpretations"]
      : ["live_source", "pipeline"],
    confidence: input.intent.confidence,
    classifier_reasons: [input.intent.reason],
  };
}
