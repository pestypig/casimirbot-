import {
  isStagePlayCheckpointRequestPrompt,
  isStagePlayJobPlanningPrompt,
  isStagePlayReflectionPrompt,
} from "./stage-play-prompt-intent";

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

const liveSourceMailLoopReflectionCuePattern =
  /\b(?:live\s+mail\s+loop|processed\s+mail\s+loop|active\s+mail\s+loop|live\s+answer\s+retrieval|active\s+live\s+answer\s+retrieval|temporary\s+retrieval\s+network|synthetic\s+scene\s+retrieval|microdex|micro[-\s]?deck\s+loop|observer\s+deck\s+loop|mailbox\s+causal(?:ity)?|live_env\.reflect_live_source_mail_loop|stage\s*play\s+badge\s+graph[\s\S]{0,140}(?:mailbox|mail|causal|causality|loop|microdex|micro[-\s]?deck)|(?:mailbox|mail|causal|causality|loop|microdex|micro[-\s]?deck)[\s\S]{0,140}stage\s*play\s+badge\s+graph)\b/i;

const hasContextualLiveSourceMailLoopReflectionCue = (text: string): boolean =>
  /["'`][^"'`]*(?:live\s+mail\s+loop|processed\s+mail\s+loop|active\s+mail\s+loop|live\s+answer\s+retrieval|temporary\s+retrieval\s+network|synthetic\s+scene\s+retrieval|microdex|micro[-\s]?deck\s+loop|observer\s+deck\s+loop|mailbox\s+causal(?:ity)?|live_env\.reflect_live_source_mail_loop)[^"'`]*["'`]/i.test(text) ||
  /\b(?:in\s+the\s+future|future|later|eventually|if|when|before|after|would|could|might|hypothetically)\b[\s\S]{0,140}\b(?:live\s+mail\s+loop|processed\s+mail\s+loop|active\s+mail\s+loop|live\s+answer\s+retrieval|temporary\s+retrieval\s+network|synthetic\s+scene\s+retrieval|microdex|micro[-\s]?deck\s+loop|observer\s+deck\s+loop|mailbox\s+causal(?:ity)?|live_env\.reflect_live_source_mail_loop)\b/i.test(text) ||
  /\b(?:screen|page|button|label|ui|text)\b[\s\S]{0,90}\b(?:says|shows|reads|contains|labeled|labelled|called|named)\b[\s\S]{0,120}\b(?:live\s+mail\s+loop|processed\s+mail\s+loop|active\s+mail\s+loop|live\s+answer\s+retrieval|temporary\s+retrieval\s+network|synthetic\s+scene\s+retrieval|microdex|micro[-\s]?deck\s+loop|observer\s+deck\s+loop|mailbox\s+causal(?:ity)?|live_env\.reflect_live_source_mail_loop)\b/i.test(text) ||
  /\b(?:do\s+not|don't|dont|without|not\s+asking\s+to|for\s+now)\b[\s\S]{0,120}\b(?:reflect|inspect|read|check|use)\b[\s\S]{0,120}\b(?:live\s+mail\s+loop|processed\s+mail\s+loop|active\s+mail\s+loop|live\s+answer\s+retrieval|temporary\s+retrieval\s+network|synthetic\s+scene\s+retrieval|microdex|micro[-\s]?deck\s+loop|observer\s+deck\s+loop|mailbox\s+causal(?:ity)?|live_env\.reflect_live_source_mail_loop)\b/i.test(text);

const isBackendReasoningPromptWithoutLiveAsk = (text: string): boolean =>
  /\b(?:backend|code|patch(?:es)?|route|runtime|terminal\s+authority|source-targeted|source\s+targeted|audit|controller|boundary|projection|debug|repo|grep|implementation|function|file|server|client)\b/i.test(text) &&
  !hasExplicitLiveOrVisualCue(text);

const hasExplicitLiveSourceMailCue = (text: string): boolean =>
  /\bstage_play_live_source_mail(?:_wake)?\s*:/i.test(text) ||
  /\bstage_play_live_source_mail_wake_request_id\b/i.test(text) ||
  /\blive_env\.(?:read_live_source_mail|read_processed_live_source_mail|process_live_source_mail|record_live_source_mail_decision|reflect_live_source_mail_loop|configure_interpreter_profile|compare_mail_to_interpreter_profile|configure_visual_observer_profile|apply_visual_observer_profile|query_visual_observer_profiles|test_visual_observer_profile|compare_visual_observer_profiles)\b/i.test(text) ||
  /\b(?:visual\s+observer|observer\s+profile|observer\s+shades|visual\s+shades|shades\s+profile|minecraft\s+gameplay\s+observer|browser\s+workflow\s+observer|video\s+scene\s+observer|debug\s+ui\s+observer)\b/i.test(text) ||
  /\b(?:put|use|apply|configure|set\s+up|setup|create|make|test|compare)\b[\s\S]{0,120}\b(?:minecraft\s+shades|minecraft\s+gameplay\s+observer|visual\s+observer\s+profile|observer\s+shades|visual\s+shades|shades\s+prompt|capture\s+prompt)\b/i.test(text) ||
  /\b(?:make|have)\b[\s\S]{0,120}\b(?:visual\s+capture|observer|vision|image\s+model)\b[\s\S]{0,120}\b(?:focus|look\s+for|watch)\b[\s\S]{0,120}\b(?:hud|hotbar|mobs?|health|hunger|fire|damage|minecraft|ui)\b/i.test(text) ||
  /\b(?:create|make|save|configure|set\s+up|setup)\b[\s\S]{0,120}\b(?:interpreter\s+profile|interpreter\s+skill|profile\s+for\s+(?:this|the)\s+(?:source|live\s+source|visual\s+source)|guidelines\s+for\s+interpreting\s+(?:the\s+)?live\s+source)\b/i.test(text) ||
  /\b(?:act\s+like|be|become|use)\b[\s\S]{0,100}\b(?:survival\s+coach|browser\s+workflow\s+watcher|video\s+scene\s+interpreter|code\s+log\s+failure\s+watcher)\b/i.test(text) ||
  /\b(?:use|apply|pause|archive|open|compile)\b[\s\S]{0,120}\b(?:interpreter\s+profile|profile\s+note|minecraft\s+survival\s+coach|browser\s+workflow\s+watcher)\b/i.test(text) ||
  /\b(?:interpret|compare)\b[\s\S]{0,120}\b(?:mail|mailbox|summaries|observations?)\b[\s\S]{0,120}\b(?:active\s+profile|interpreter\s+profile|profile)\b/i.test(text) ||
  /\b(?:why\s+did\s+you)\b[\s\S]{0,80}\b(?:call\s+this\s+out|suppress\s+this|suppress|callout)\b/i.test(text) ||
  /\b(?:wake\s+request|mail\s+refs?|source\s+mail|new\s+source\s+mail|live\s+source\s+mail|live-source\s+mail|observer\s+mailbox|active\s+visual\s+live-source\s+mailbox|latest\s+visual\s+summary\s+mail|stage\s+play\s+mail|visual\s+mail|visual\s+summary\s+mail|latest\s+visual\s+update|visual\s+update|source\s+update|mailbox|wait\s+for\s+next\s+summary)\b/i.test(text) ||
  /\b(?:read|check|watch|monitor|observe|use|process)\b[\s\S]{0,160}\b(?:live-source\s+mailbox|live\s+source\s+mailbox|observer\s+mailbox|stage\s+play\s+mail|latest\s+visual\s+summary\s+mail|visual\s+mail|visual\s+summary\s+mail|latest\s+visual\s+update|visual\s+update|source\s+update|new\s+source\s+mail)\b/i.test(text) ||
  /\b(?:live-source\s+mailbox|live\s+source\s+mailbox|observer\s+mailbox|stage\s+play\s+mail|latest\s+visual\s+summary\s+mail|visual\s+mail|visual\s+summary\s+mail|latest\s+visual\s+update|visual\s+update|source\s+update|new\s+source\s+mail)\b[\s\S]{0,160}\b(?:read|check|watch|monitor|observe|process|decision|decide|record|show|shows|showing|contains?|reports?|changed|interpret)\b/i.test(text);

const hasLiveSourceMailInterpretationCue = (text: string): boolean => {
  const interpretationCue =
    /\b(?:interpret(?:ation)?|what\s+is\s+happening|what's\s+happening|what\s+happened|what\s+changed|changed|changes|compare|comparison|what\s+should\s+(?:be\s+)?watched\s+next|watch\s+next|what\s+to\s+watch\s+next|story\s+so\s+far|observations?\s+mean|predict(?:ion)?|might\s+happen\s+next|record\s+an?\s+interpretation|summari[sz]e\s+the\s+story)\b/i;
  const sourceCue =
    /\b(?:mail|mailbox|summary|summaries|observation|observations|live\s+source|live-source|visual\s+source|visual\s+summary|visual\s+update|latest\s+visual\s+update|screen\s+summary|source\s+update|watch\s+next|story\s+so\s+far)\b/i;
  return interpretationCue.test(text) && sourceCue.test(text);
};

const hasLiveSourceStandingWatchCue = (text: string): boolean =>
  /\b(?:watch|monitor|track|keep\s+watching|keep\s+an\s+eye\s+on|keep\s+watch|observe)\b[\s\S]{0,180}\b(?:describe|tell\s+me|summari[sz]e|announce|notify|speak|call\s*out|callout|report)\b[\s\S]{0,180}\b(?:mail\s+batch|new\s+mail|summary|summaries|observed|observation|changes?|happens?|important|source|visual|screen|this)\b/i.test(text) ||
  /\b(?:watch|monitor|track|keep\s+watching|keep\s+an\s+eye\s+on|keep\s+watch|observe)\b[\s\S]{0,180}\b(?:mail\s+batch|new\s+mail|summary|summaries|observed|observation|changes?|happens?|important|source|visual|screen|this)\b[\s\S]{0,180}\b(?:describe|tell\s+me|summari[sz]e|announce|notify|speak|call\s*out|callout|report)\b/i.test(text) ||
  /\b(?:watch|monitor|track|keep\s+watching|keep\s+an\s+eye\s+on|observe)\b[\s\S]{0,180}\b(?:interpret|compare|what\s+changed|what\s+is\s+happening|watch\s+next|predict|story\s+so\s+far)\b[\s\S]{0,180}\b(?:mail|summary|summaries|observation|source|visual|screen|this)\b/i.test(text) ||
  /\b(?:interpret|compare|what\s+changed|what\s+is\s+happening|watch\s+next|predict|story\s+so\s+far)\b[\s\S]{0,180}\b(?:mail|summary|summaries|observation|source|visual|screen|this)\b[\s\S]{0,180}\b(?:watch|monitor|track|keep\s+watching|observe)\b/i.test(text) ||
  /\b(?:every\s+time|whenever|when)\b[\s\S]{0,120}\b(?:summary|summaries|mail|mail\s+batch|update|observation|visual|source|it)\b[\s\S]{0,120}\b(?:comes?\s+in|arrives?|changes?|updates?|happens?|describe|tell\s+me|announce|notify|speak|report)\b/i.test(text) ||
  /\b(?:summary|summaries|mail|mail\s+batch|update|observation)\b[\s\S]{0,120}\b(?:comes?\s+in|arrives?|changes?|updates?)\b[\s\S]{0,120}\b(?:describe|tell\s+me|announce|notify|speak|report)\b/i.test(text) ||
  /\b(?:announce|notify|speak|call\s*out|callout|tell\s+me)\b[\s\S]{0,60}\bif\b[\s\S]{0,140}\b(?:anything\s+important|something\s+important|something\s+changes?|it\s+changes?|source\s+changes?|visual\s+changes?|screen\s+changes?|happens?)\b/i.test(text) ||
  /\bkeep\s+an\s+eye\s+on\s+(?:this|the\s+(?:visual|screen|source|capture|mailbox))\b/i.test(text);

const hasContextualLiveSourceMailCue = (text: string): boolean =>
  /["'`][^"'`]*(?:live_env\.(?:read_live_source_mail|read_processed_live_source_mail|process_live_source_mail|record_live_source_mail_decision|reflect_live_source_mail_loop|configure_interpreter_profile|compare_mail_to_interpreter_profile|configure_visual_observer_profile|apply_visual_observer_profile|query_visual_observer_profiles|test_visual_observer_profile|compare_visual_observer_profiles)|read\s+live\s+source\s+mail|live[-\s]?source\s+mailbox|observer\s+mailbox|stage\s+play\s+mail|interpreter\s+profile|profile\s+note|visual\s+observer|observer\s+shades|visual\s+shades)[^"'`]*["'`]/i.test(text) ||
  /\b(?:in\s+the\s+future|future|later|eventually|if|when|before|after|would|could|might|hypothetically)\b[\s\S]{0,140}\b(?:live_env\.(?:read_live_source_mail|read_processed_live_source_mail|process_live_source_mail|record_live_source_mail_decision|reflect_live_source_mail_loop|configure_interpreter_profile|compare_mail_to_interpreter_profile|configure_visual_observer_profile|apply_visual_observer_profile|query_visual_observer_profiles|test_visual_observer_profile|compare_visual_observer_profiles)|read\s+live\s+source\s+mail|live[-\s]?source\s+mailbox|observer\s+mailbox|stage\s+play\s+mail|visual\s+summary\s+mail|interpreter\s+profile|profile\s+note|visual\s+observer|observer\s+shades|visual\s+shades)\b/i.test(text) ||
  /\b(?:screen|page|button|label|ui|text)\b[\s\S]{0,90}\b(?:says|shows|reads|contains|labeled|labelled|called|named)\b[\s\S]{0,120}\b(?:live_env\.(?:read_live_source_mail|read_processed_live_source_mail|process_live_source_mail|record_live_source_mail_decision|reflect_live_source_mail_loop|configure_interpreter_profile|compare_mail_to_interpreter_profile|configure_visual_observer_profile|apply_visual_observer_profile|query_visual_observer_profiles|test_visual_observer_profile|compare_visual_observer_profiles)|read\s+live\s+source\s+mail|live[-\s]?source\s+mailbox|observer\s+mailbox|stage\s+play\s+mail|visual\s+summary\s+mail|interpreter\s+profile|profile\s+note|visual\s+observer|observer\s+shades|visual\s+shades)\b/i.test(text) ||
  /\b(?:do\s+not|don't|dont|without|not\s+asking\s+to|for\s+now)\b[\s\S]{0,120}\b(?:run|execute|use|read|check|process|create|configure|apply|pause|open|compile|test|compare)?\b[\s\S]{0,120}\b(?:live_env\.(?:read_live_source_mail|read_processed_live_source_mail|process_live_source_mail|record_live_source_mail_decision|reflect_live_source_mail_loop|configure_interpreter_profile|compare_mail_to_interpreter_profile|configure_visual_observer_profile|apply_visual_observer_profile|query_visual_observer_profiles|test_visual_observer_profile|compare_visual_observer_profiles)|read\s+live\s+source\s+mail|live[-\s]?source\s+mailbox|observer\s+mailbox|stage\s+play\s+mail|visual\s+summary\s+mail|interpreter\s+profile|profile\s+note|visual\s+observer|observer\s+shades|visual\s+shades)\b/i.test(text) ||
  /\b(?:explain|describe|what\s+does|what\s+is|what\s+are)\b[\s\S]{0,120}\b(?:live_env\.(?:read_live_source_mail|read_processed_live_source_mail|process_live_source_mail|record_live_source_mail_decision|reflect_live_source_mail_loop|configure_interpreter_profile|compare_mail_to_interpreter_profile|configure_visual_observer_profile|apply_visual_observer_profile|query_visual_observer_profiles|test_visual_observer_profile|compare_visual_observer_profiles)|read\s+live\s+source\s+mail|live[-\s]?source\s+mailbox|observer\s+mailbox|stage\s+play\s+mail|visual\s+summary\s+mail|interpreter\s+profile|profile\s+note|visual\s+observer|observer\s+shades|visual\s+shades)\b[\s\S]{0,80}\b(?:mean|means|for|do|does|is|are)\b/i.test(text);

export const isLiveSourceMailLoopReflectionPrompt = (text: string): boolean =>
  !hasContextualLiveSourceMailLoopReflectionCue(text) &&
  liveSourceMailLoopReflectionCuePattern.test(text);

export const isLiveSourceMailLoopPrompt = (text: string): boolean =>
  isLiveSourceMailLoopReflectionPrompt(text) ||
  (!hasContextualLiveSourceMailCue(text) && (
  hasExplicitLiveSourceMailCue(text) ||
  hasLiveSourceMailInterpretationCue(text) ||
  hasLiveSourceStandingWatchCue(text) ||
  (
    !isStagePlayJobPlanningPrompt(text) &&
    (
  /\b(?:watch|monitor|track|observe|read|keep\s+an\s+eye\s+on|tell\s+me\s+if|announce\s+if)\b[\s\S]{0,140}\b(?:live\s+source|visual\s+(?:source|capture|summary|frame)|screen\s+(?:source|summary)|latest\s+visual\s+capture)\b/i.test(text) ||
      /\b(?:live\s+source|visual\s+(?:source|capture|summary|frame)|screen\s+(?:source|summary)|latest\s+visual\s+capture)\b[\s\S]{0,140}\b(?:watch|monitor|track|observe|read|changes?|happens?|announce|important)\b/i.test(text)
    )
  )));

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

const isStagePlayCaptureCadenceControlPrompt = (prompt: string): boolean => {
  const text = normalize(prompt);
  if (!text || !isStagePlayReflectionPrompt(prompt)) return false;
  const captureControl =
    /\b(?:start|enable|turn\s+on|set|change|update|pause|resume|stop|keep|continue|maintain)\b/.test(text) &&
    /\b(?:visual\s+interval|capture\s+(?:cadence|interval|source)|screen\s+capture|tab\s+capture|frame\s+capture|visual\s+capture|visual\s+source|capture\s+every|every\s+\d{1,3})\b/.test(text);
  return captureControl && isLiveSourceCadenceControlPrompt(prompt);
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
  const stagePlayReflection = isStagePlayReflectionPrompt(prompt);
  const stagePlayJobPlanning = isStagePlayJobPlanningPrompt(prompt);
  const stagePlayCheckpointRequest = isStagePlayCheckpointRequestPrompt(prompt);
  const stagePlayCaptureControl = isStagePlayCaptureCadenceControlPrompt(prompt);
  if (isLiveSourceMailLoopPrompt(prompt)) return null;
  if (stagePlayCheckpointRequest) return null;
  if (stagePlayJobPlanning && !stagePlayCaptureControl) return null;
  if (stagePlayReflection && !stagePlayCaptureControl) return null;

  const procedureEpochComparison =
    /\b(?:what\s+changed|changed\s+since|compare|compared|difference|different)\b/.test(text) &&
    /\b(?:last|previous|prior)\s+(?:seen\s+)?(?:scene|epoch|frame|visual|screen|capture)|\bscene\s+epoch\b|\bvisual\s+epoch\b/.test(text);
  const liveAnswerStateRead =
    /\b(?:live\s+answer\s+(?:panel|environment|card)|live\s+card|active\s+live\s+(?:answer\s+)?(?:environment|source|job)|calculator\s+live\s+(?:source|job|environment))\b/.test(text) &&
    /\b(?:latest|current|result|value|equation|line|threshold|cross(?:ed|es|ing)?|changed|state|status)\b/.test(text);
  const explicitBindingDiagnosis =
    !liveAnswerStateRead &&
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
    /\b(?:live\s+(?:source|answer|pipeline|screen\s+source)|visual\s+source|screen\s+(?:source|capture)|frame|producer|capture\s+binding|minecraft events|world events|minehut|world event)\b/.test(text);
  const bindingDiagnosis = explicitBindingDiagnosis && !procedureEpochComparison;
  const repair =
    /\b(?:repair|fix|recover|run due|run analysis|analyze latest|analyse latest|capture now|capture frame|not updating|stale|attach)\b/.test(text) &&
    /\b(?:live\s+(?:source|answer|pipeline|screen\s+source)|visual|frame|screen\s+(?:source|capture)|capture\s+binding|minecraft events|world events|minehut)\b/.test(text);

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
