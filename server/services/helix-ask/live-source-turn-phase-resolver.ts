import type {
  LiveSourceTurnPhaseResolutionV1,
  LiveSourceTurnPhaseV1,
  LiveSourceWakeRouteMetadataV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";

type RecordLike = Record<string, unknown>;

export type LiveSourceTurnPhaseTableEntry = {
  allowedTools: string[];
  fallbackTools: string[];
  forbiddenTools: string[];
  requiredEvidence: string[];
  completionEvidence: string[];
  next: LiveSourceTurnPhaseV1 | LiveSourceTurnPhaseV1[] | null;
  terminalAllowed: boolean;
};

export const LIVE_SOURCE_TURN_PHASE_TABLE: Record<LiveSourceTurnPhaseV1, LiveSourceTurnPhaseTableEntry> = {
  configure_interpreter_profile: {
    allowedTools: ["live_env.configure_interpreter_profile"],
    fallbackTools: [],
    forbiddenTools: [
      "live_env.read_processed_live_source_mail",
      "live_env.process_live_source_mail",
      "live_env.read_live_source_mail",
      "live_env.record_live_source_mail_decision",
      "live_env.request_interim_voice_callout",
    ],
    requiredEvidence: ["live_env.configure_interpreter_profile"],
    completionEvidence: ["stage_play_live_source_interpreter_profile"],
    next: "terminal_checkpoint",
    terminalAllowed: false,
  },
  configure_watch_job: {
    allowedTools: ["live_env.configure_live_source_watch_job"],
    fallbackTools: [],
    forbiddenTools: [
      "live_env.read_processed_live_source_mail",
      "live_env.process_live_source_mail",
      "live_env.read_live_source_mail",
      "live_env.record_live_source_mail_decision",
      "live_env.request_interim_voice_callout",
    ],
    requiredEvidence: ["live_env.configure_live_source_watch_job"],
    completionEvidence: ["stage_play_live_source_watch_job_policy"],
    next: "terminal_checkpoint",
    terminalAllowed: false,
  },
  apply_visual_observer_profile: {
    allowedTools: [
      "live_env.configure_visual_observer_profile",
      "live_env.apply_visual_observer_profile",
      "live_env.query_visual_observer_profiles",
      "live_env.test_visual_observer_profile",
      "live_env.compare_visual_observer_profiles",
    ],
    fallbackTools: [],
    forbiddenTools: [
      "live_env.read_processed_live_source_mail",
      "live_env.process_live_source_mail",
      "live_env.read_live_source_mail",
      "live_env.record_live_source_mail_decision",
      "live_env.request_interim_voice_callout",
    ],
    requiredEvidence: ["stage_play_visual_observer_profile"],
    completionEvidence: ["stage_play_visual_observer_profile"],
    next: "terminal_checkpoint",
    terminalAllowed: false,
  },
  query_micro_reasoner_deck: {
    allowedTools: ["live_env.query_micro_reasoner_presets"],
    fallbackTools: [],
    forbiddenTools: [
      "live_env.read_processed_live_source_mail",
      "live_env.process_live_source_mail",
      "live_env.read_live_source_mail",
      "live_env.record_live_source_mail_decision",
      "live_env.request_interim_voice_callout",
    ],
    requiredEvidence: ["stage_play_micro_reasoner_prompt_preset_query_result"],
    completionEvidence: ["stage_play_micro_reasoner_prompt_preset_query_result"],
    next: "terminal_checkpoint",
    terminalAllowed: false,
  },
  read_processed_mail: {
    allowedTools: ["live_env.read_processed_live_source_mail"],
    fallbackTools: ["live_env.process_live_source_mail"],
    forbiddenTools: ["live_env.request_interim_voice_callout"],
    requiredEvidence: ["stage_play_processed_mail_packet"],
    completionEvidence: ["stage_play_processed_mail_packet"],
    next: "record_decision",
    terminalAllowed: false,
  },
  process_mail_fallback: {
    allowedTools: ["live_env.process_live_source_mail"],
    fallbackTools: [],
    forbiddenTools: ["live_env.record_live_source_mail_decision", "live_env.request_interim_voice_callout"],
    requiredEvidence: ["stage_play_live_source_mail_read_result"],
    completionEvidence: ["stage_play_processed_mail_packet"],
    next: "read_processed_mail",
    terminalAllowed: false,
  },
  record_decision: {
    allowedTools: ["live_env.record_live_source_mail_decision"],
    fallbackTools: [],
    forbiddenTools: [
      "live_env.read_processed_live_source_mail",
      "live_env.process_live_source_mail",
      "live_env.read_live_source_mail",
      "live_env.request_interim_voice_callout",
      "final_answer",
    ],
    requiredEvidence: ["stage_play_processed_mail_packet"],
    completionEvidence: ["stage_play_live_source_mail_decision"],
    next: ["request_voice_after_decision", "terminal_checkpoint", "queue_continuation"],
    terminalAllowed: false,
  },
  request_voice_after_decision: {
    allowedTools: ["live_env.request_interim_voice_callout"],
    fallbackTools: [],
    forbiddenTools: [
      "live_env.read_processed_live_source_mail",
      "live_env.process_live_source_mail",
      "live_env.read_live_source_mail",
      "live_env.record_live_source_mail_decision",
      "final_answer",
    ],
    requiredEvidence: ["stage_play_live_source_mail_decision"],
    completionEvidence: [
      "live_source_interim_voice_callout_receipt",
      "voice_hold_receipt",
      "voice_block_receipt",
      "voice_receipt",
    ],
    next: "terminal_checkpoint",
    terminalAllowed: false,
  },
  terminal_checkpoint: {
    allowedTools: [],
    fallbackTools: [],
    forbiddenTools: [
      "live_env.read_processed_live_source_mail",
      "live_env.process_live_source_mail",
      "live_env.read_live_source_mail",
      "live_env.record_live_source_mail_decision",
      "live_env.request_interim_voice_callout",
    ],
    requiredEvidence: ["model_synthesized_answer"],
    completionEvidence: ["model_synthesized_answer"],
    next: null,
    terminalAllowed: true,
  },
  queue_continuation: {
    allowedTools: [],
    fallbackTools: [],
    forbiddenTools: ["live_env.request_interim_voice_callout", "final_answer"],
    requiredEvidence: ["stage_play_live_source_mail_wake_request"],
    completionEvidence: ["stage_play_live_source_mail_wake_request"],
    next: "terminal_checkpoint",
    terminalAllowed: false,
  },
  blocked_or_missing_args: {
    allowedTools: [],
    fallbackTools: [],
    forbiddenTools: [],
    requiredEvidence: [],
    completionEvidence: [],
    next: null,
    terminalAllowed: false,
  },
};

const tableNextPhase = (entry: LiveSourceTurnPhaseTableEntry): LiveSourceTurnPhaseV1 | null =>
  Array.isArray(entry.next) ? entry.next[0] ?? null : entry.next;

export type ResolveLiveSourceTurnPhaseInput = {
  prompt: string;
  selectedTargetSource?: string | null;
  selectedCapability?: string | null;
  latestToolReceipts?: unknown[];
  activePolicyRef?: string | null;
  activeInterpreterProfileRef?: string | null;
  processedPackets?: unknown[];
  voicePolicy?: unknown;
  routeMetadata?: LiveSourceWakeRouteMetadataV1 | null;
};

export const LIVE_SOURCE_TURN_PHASE_NO_MATCH_REASON = "No live-source turn phase was selected.";

export const isLockedExecutableLiveSourcePhase = (
  resolution: LiveSourceTurnPhaseResolutionV1 | null | undefined,
): boolean =>
  resolution?.phaseLock.locked === true &&
  resolution.allowedTools.length === 1 &&
  Boolean(resolution.allowedTools[0]?.startsWith("live_env.")) &&
  resolution.phase !== "terminal_checkpoint";

export const mandatoryToolForPhase = (
  resolution: LiveSourceTurnPhaseResolutionV1 | null | undefined,
): string | null =>
  isLockedExecutableLiveSourcePhase(resolution)
    ? resolution?.allowedTools[0] ?? null
    : null;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const readStringList = (value: unknown): string[] =>
  readArray(value).map(readString).filter((entry): entry is string => Boolean(entry));

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((entry): entry is string => Boolean(entry))));

const LIVE_SOURCE_TURN_PHASES = new Set<string>(Object.keys(LIVE_SOURCE_TURN_PHASE_TABLE));

const normalizeMetadataPhase = (phase: unknown): LiveSourceTurnPhaseV1 | null => {
  const normalized = readString(phase);
  if (!normalized) return null;
  if (normalized === "read_mailbox") return "read_processed_mail";
  return LIVE_SOURCE_TURN_PHASES.has(normalized) ? (normalized as LiveSourceTurnPhaseV1) : null;
};

const normalizeMetadataCanonicalGoal = (
  goal: unknown,
): LiveSourceTurnPhaseResolutionV1["canonicalGoal"] | null => {
  const normalized = readString(goal);
  if (
    normalized === "processed_mail_interpretation" ||
    normalized === "processed_mail_voice_decision" ||
    normalized === "processed_mail_checkpoint"
  ) {
    return normalized;
  }
  return null;
};

const normalizeReceipt = (value: unknown): RecordLike | null => {
  const record = readRecord(value);
  if (!record) return null;
  const payload = readRecord(record.payload);
  const observation = readRecord(record.observation) ?? readRecord(payload?.observation);
  return {
    ...record,
    ...(payload ? { payload } : {}),
    ...(observation ? { observation } : {}),
    toolName:
      readString(record.toolName) ??
      readString(record.tool_name) ??
      readString(payload?.toolName) ??
      readString(payload?.tool_name),
  };
};

const receiptToolName = (receipt: RecordLike): string | null =>
  readString(receipt.toolName) ?? readString(receipt.tool_name);

const receiptObservation = (receipt: RecordLike): RecordLike | null =>
  readRecord(receipt.observation) ?? readRecord(readRecord(receipt.payload)?.observation) ?? receipt;

const receiptHasTool = (receipts: RecordLike[], toolName: string): boolean =>
  receipts.some((receipt) => receiptToolName(receipt) === toolName);

const receiptHasAnyTool = (receipts: RecordLike[], toolNames: string[]): boolean =>
  receipts.some((receipt) => {
    const toolName = receiptToolName(receipt);
    return Boolean(toolName && toolNames.includes(toolName));
  });

const collectPacketsFromReceipt = (receipt: RecordLike): RecordLike[] => {
  const observation = receiptObservation(receipt);
  return [
    ...readArray(receipt.packets),
    ...readArray(readRecord(receipt.payload)?.packets),
    ...readArray(observation?.packets),
  ].map(readRecord).filter((entry): entry is RecordLike => Boolean(entry));
};

const collectProcessedPackets = (input: ResolveLiveSourceTurnPhaseInput, receipts: RecordLike[]): RecordLike[] => [
  ...readArray(input.processedPackets).map(readRecord).filter((entry): entry is RecordLike => Boolean(entry)),
  ...receipts.flatMap(collectPacketsFromReceipt),
];

const receiptIndex = (receipts: RecordLike[], toolName: string): number => {
  let index = -1;
  receipts.forEach((receipt, receiptIndex) => {
    if (receiptToolName(receipt) === toolName) index = receiptIndex;
  });
  return index;
};

const receiptToolProducedPackets = (receipts: RecordLike[], toolName: string): boolean =>
  receipts.some((receipt) => receiptToolName(receipt) === toolName && collectPacketsFromReceipt(receipt).length > 0);

const packetId = (packet: RecordLike | null): string | null =>
  readString(packet?.packetId) ?? readString(packet?.packet_id);

const packetRecommendedNext = (packet: RecordLike | null): string | null =>
  readString(packet?.recommendedNext ?? packet?.recommended_next);

const packetRequiresDecision = (packet: RecordLike | null): boolean => {
  const recommendedNext = packetRecommendedNext(packet);
  if (!recommendedNext) return false;
  return [
    "record_interpretation",
    "request_voice_callout",
    "request_more_evidence",
    "request_stage_play_checkpoint",
  ].includes(recommendedNext);
};

const packetIsVoiceCandidate = (packet: RecordLike | null): boolean => {
  if (!packet) return false;
  const salience = readRecord(packet.salience);
  const salienceLevel = readString(salience?.level);
  return (
    packetRecommendedNext(packet) === "request_voice_callout" ||
    readBoolean(salience?.voiceCandidate ?? salience?.voice_candidate) === true ||
    salienceLevel === "high" ||
    salienceLevel === "urgent" ||
    Boolean(readString(salience?.calloutDraft ?? salience?.callout_draft))
  );
};

const hasInterpreterProfileReceipt = (receipts: RecordLike[]): boolean =>
  receipts.some((receipt) => {
    const observation = receiptObservation(receipt);
    return (
      receiptToolName(receipt) === "live_env.configure_interpreter_profile" ||
      readString(observation?.artifactId) === "stage_play_live_source_interpreter_profile" ||
      readString(observation?.schemaVersion) === "stage_play_live_source_interpreter_profile/v1" ||
      Boolean(readString(observation?.interpreterProfileRef ?? observation?.profileId ?? observation?.profile_id))
    );
  });

const hasWatchPolicyReceipt = (receipts: RecordLike[]): boolean =>
  receipts.some((receipt) => {
    const observation = receiptObservation(receipt);
    return (
      receiptToolName(receipt) === "live_env.configure_live_source_watch_job" ||
      readString(observation?.artifactId) === "stage_play_live_source_watch_job_policy" ||
      readString(observation?.schema) === "stage_play_live_source_watch_job_policy_config_result/v1" ||
      Boolean(readString(observation?.watchJobPolicyRef ?? observation?.watch_job_policy_ref ?? observation?.policyId))
    );
  });

const hasMailDecisionReceipt = (receipts: RecordLike[]): boolean =>
  receipts.some((receipt) => {
    const observation = receiptObservation(receipt);
    return (
      receiptToolName(receipt) === "live_env.record_live_source_mail_decision" ||
      readString(observation?.artifactId) === "stage_play_live_source_mail_decision" ||
      readString(observation?.schemaVersion) === "stage_play_live_source_mail_decision/v1" ||
      Boolean(readString(observation?.decisionId ?? observation?.decision_id))
    );
  });

const hasVoiceCalloutDecisionReceipt = (receipts: RecordLike[]): boolean =>
  receipts.some((receipt) => {
    const observation = receiptObservation(receipt);
    const isDecisionReceipt =
      receiptToolName(receipt) === "live_env.record_live_source_mail_decision" ||
      readString(receipt.kind) === "stage_play_live_source_mail_decision" ||
      readString(observation?.artifactId) === "stage_play_live_source_mail_decision" ||
      readString(observation?.schemaVersion) === "stage_play_live_source_mail_decision/v1";
    return (
      isDecisionReceipt &&
      readString(observation?.decision) === "request_voice_callout"
    );
  });

const hasVoiceCalloutCompletionReceipt = (receipts: RecordLike[]): boolean =>
  receipts.some((receipt) => {
    const observation = receiptObservation(receipt);
    const receiptRecord = readRecord(observation?.receipt);
    const receiptStatus = readString(receiptRecord?.status);
    const artifactId = readString(observation?.artifactId ?? observation?.artifact_id);
    const schema = readString(observation?.schema ?? observation?.schemaVersion);
    const kind = readString(observation?.kind);
    return (
      schema === "helix.interim_voice_callout_tool_result.v1" ||
      artifactId === "live_source_interim_voice_callout_receipt" ||
      artifactId === "voice_hold_receipt" ||
      artifactId === "voice_block_receipt" ||
      kind === "live_source_interim_voice_callout_receipt" ||
      kind === "voice_hold_receipt" ||
      kind === "voice_block_receipt" ||
      Boolean(receiptStatus && [
        "awaiting_client_playback",
        "queued",
        "queued_for_retry",
        "delivered",
        "expired",
        "blocked_capacity",
        "blocked_policy",
        "blocked_missing_text",
      ].includes(receiptStatus))
    );
  });

const hasInterpreterProfileConfigCue = (prompt: string): boolean => {
  const setupVerb = /\b(?:create|make|save|configure|set\s+up|setup|store|define|compile)\b/i;
  const profileObject =
    /\b(?:interpreter\s+profile|interpreter\s+skill|interpreter\s+lens|interpretation\s+lens|interpreter\s+contract|interpretation\s+contract|survival\s+coach\s+profile|minecraft\s+survival\s+coach\s+profile|profile\s+for\s+(?:this|the)\s+(?:source|live\s+source|visual\s+source)|guidelines?\s+for\s+interpreting(?:\s+(?:the\s+)?(?:mail|live\s+source|visual\s+source|source))?)\b/i;
  const contractCriteria =
    /\b(?:call\s*out|callout|danger|rare\s+resources?|strategic\s+decisions?|ignore\s+routine\s+walking|suppress\s+routine\s+walking|voice\s+callout\s+criteria|salience\s+criteria|suppress\s+criteria)\b/i;

  return (
    /\blive_env\.configure_interpreter_profile\b/i.test(prompt) ||
    /\b(?:create|make|save|configure|set\s+up|setup|store)\b[\s\S]{0,180}\b(?:interpreter\s+profile|interpreter\s+skill|interpreter\s+lens|interpretation\s+lens|interpreter\s+contract|interpretation\s+contract|profile\s+for\s+(?:this|the)\s+(?:source|live\s+source|visual\s+source)|guidelines?\s+for\s+interpreting\s+(?:the\s+)?(?:mail|live\s+source|visual\s+source|source))\b/i.test(prompt) ||
    /\b(?:create|make|save|configure|set\s+up|setup|store|define|compile)\b[\s\S]{0,180}\b(?:minecraft\s+)?survival\s+coach\b[\s\S]{0,80}\b(?:profile|lens|contract|guidelines?)\b/i.test(prompt) ||
    /\b(?:use|save|store|define|compile)\b[\s\S]{0,120}\b(?:these|this|the\s+following)\s+(?:guidelines?|contract|lens)\b[\s\S]{0,160}\b(?:interpreting|interpret|live\s+source|visual\s+source|mail|source)\b/i.test(prompt) ||
    /\b(?:act\s+like|be|become)\b[\s\S]{0,120}\b(?:minecraft\s+survival\s+coach|survival\s+coach|browser\s+workflow\s+watcher|video\s+scene\s+interpreter|code\s+log\s+failure\s+watcher)\b/i.test(prompt) ||
    /\bsave\s+this\s+as\s+an?\s+interpreter\s+skill\b/i.test(prompt) ||
    (setupVerb.test(prompt) && profileObject.test(prompt)) ||
    (
      setupVerb.test(prompt) &&
      /\b(?:profile|lens|contract|guidelines?)\b/i.test(prompt) &&
      /\b(?:interpreting|interpretation|interpret|source|mail|live\s+source|visual\s+source|survival\s+coach)\b/i.test(prompt) &&
      contractCriteria.test(prompt)
    )
  );
};

const hasVisualObserverProfileCue = (prompt: string): boolean =>
  /\blive_env\.(?:configure_visual_observer_profile|apply_visual_observer_profile|query_visual_observer_profiles|test_visual_observer_profile|compare_visual_observer_profiles)\b/i.test(prompt) ||
  /\b(?:visual\s+observer|observer\s+profile|observer\s+shades|visual\s+shades|shades\s+profile|minecraft\s+gameplay\s+observer|browser\s+workflow\s+observer|video\s+scene\s+observer|debug\s+ui\s+observer)\b/i.test(prompt) ||
  /\b(?:put|use|apply|configure|set\s+up|setup|create|make|test|compare)\b[\s\S]{0,120}\b(?:minecraft\s+shades|minecraft\s+gameplay\s+observer|visual\s+observer\s+profile|observer\s+shades|visual\s+shades|shades\s+prompt|capture\s+prompt)\b/i.test(prompt) ||
  /\b(?:make|have)\b[\s\S]{0,120}\b(?:visual\s+capture|observer|vision|image\s+model)\b[\s\S]{0,120}\b(?:focus|look\s+for|watch)\b[\s\S]{0,120}\b(?:hud|hotbar|mobs?|health|hunger|fire|damage|minecraft|ui)\b/i.test(prompt);

const hasContextualMicroReasonerDeckCue = (prompt: string): boolean =>
  /["'`][^"'`]*(?:live_env\.query_micro_reasoner_presets|micro[-\s]?deck|micro[-\s]?reasoner(?:s)?|prompt\s+(?:preset|deck)|source\s+deck\s+assembly)[^"'`]*["'`]/i.test(prompt) ||
  /\b(?:if|in\s+the\s+future|future|later|eventually|hypothetically|tomorrow|next\s+time|would|could|might)\b[\s\S]{0,140}\b(?:live_env\.query_micro_reasoner_presets|micro[-\s]?deck|micro[-\s]?reasoner(?:s)?|prompt\s+(?:preset|deck)|source\s+deck\s+assembly)\b/i.test(prompt) ||
  /\b(?:previously|earlier|last\s+time|before|already|historically|was|were|had)\b[\s\S]{0,140}\b(?:ran|run|used|queried|viewed|inspected|showed|listed|checked|read|called)?\b[\s\S]{0,120}\b(?:live_env\.query_micro_reasoner_presets|micro[-\s]?deck|micro[-\s]?reasoner(?:s)?|prompt\s+(?:preset|deck)|source\s+deck\s+assembly)\b/i.test(prompt) ||
  /\b(?:screen|page|button|label|ui|text|menu|dropdown)\b[\s\S]{0,90}\b(?:says|shows|reads|contains|labeled|labelled|called|named)\b[\s\S]{0,120}\b(?:live_env\.query_micro_reasoner_presets|micro[-\s]?deck|micro[-\s]?reasoner(?:s)?|prompt\s+(?:preset|deck)|source\s+deck\s+assembly)\b/i.test(prompt) ||
  /\b(?:do\s+not|don't|dont|without|not\s+asking\s+to|for\s+now)\b[\s\S]{0,140}\b(?:run|execute|use|query|view|inspect|show|list|check|read)?\b[\s\S]{0,120}\b(?:live_env\.query_micro_reasoner_presets|micro[-\s]?deck|micro[-\s]?reasoner(?:s)?|prompt\s+(?:preset|deck)|source\s+deck\s+assembly)\b/i.test(prompt);

const hasMicroReasonerDeckQueryCue = (prompt: string): boolean => {
  if (hasContextualMicroReasonerDeckCue(prompt)) return false;
  return (
    /\blive_env\.query_micro_reasoner_presets\b/i.test(prompt) ||
    /\b(?:query|view|inspect|show|list|get|check|read)\b[\s\S]{0,120}\b(?:micro[-\s]?deck|micro[-\s]?reasoner(?:s)?|micro[-\s]?reasoner\s+(?:preset|prompt|deck)s?|prompt\s+(?:preset|deck)s?|active\s+(?:micro[-\s]?deck|preset|deck)|source\s+deck\s+assembly)\b/i.test(prompt) ||
    /\b(?:micro[-\s]?deck|micro[-\s]?reasoner(?:s)?|micro[-\s]?reasoner\s+(?:preset|prompt|deck)s?|prompt\s+(?:preset|deck)s?|source\s+deck\s+assembly)\b[\s\S]{0,120}\b(?:query|view|inspect|show|list|get|check|read|active|assembled|enabled|using)\b/i.test(prompt)
  );
};

const hasExplicitReadCue = (prompt: string): boolean =>
  /\blive_env\.(?:read_live_source_mail|read_processed_live_source_mail|process_live_source_mail|check_live_source_mail)\b/i.test(prompt) ||
  /\b(?:read|check|process|review)\b[\s\S]{0,110}\b(?:latest|current|active|unread|new)?[\s\S]{0,40}\b(?:mailbox|live\s+source\s+mail|source\s+mail|new\s+source\s+mail|visual\s+mail|visual\s+summary\s+mail|latest\s+visual\s+update|visual\s+update|source\s+update|latest\s+unread|unread\s+(?:mail|updates?))\b/i.test(prompt);

const hasStandingWatchCue = (prompt: string): boolean =>
  /\b(?:watch|monitor|track|observe)\s+(?:this|the|active|current)?\s*(?:live\s+source|visual\s+source|source|screen|capture)\b/i.test(prompt) ||
  /\bkeep\s+(?:watching|watch|monitoring|tracking|observing)\b/i.test(prompt) ||
  /\bevery\s+(?:new\s+)?(?:mail\s+batch|visual\s+mail|source\s+mail|summary|source\s+update|visual\s+update)\b/i.test(prompt) ||
  /\bdescribe\s+(?:each|every)\s+(?:new\s+)?(?:mail\s+batch|visual\s+mail|source\s+mail|summary|source\s+update|visual\s+update|batch)\b/i.test(prompt) ||
  /\bcommentate\s+while\s+i\s+(?:play|work|watch|use|navigate|browse)\b/i.test(prompt) ||
  /\b(?:watch|monitor|track|keep\s+watching|keep\s+an\s+eye\s+on|keep\s+watch|observe)\b[\s\S]{0,180}\b(?:describe|tell\s+me|summari[sz]e|announce|notify|speak|call\s*out|callout|report)\b[\s\S]{0,180}\b(?:mail\s+batch|new\s+mail|summary|summaries|observed|observation|changes?|happens?|important|source|visual|screen|this)\b/i.test(prompt) ||
  /\b(?:watch|monitor|track|keep\s+watching|keep\s+an\s+eye\s+on|keep\s+watch|observe)\b[\s\S]{0,180}\b(?:interpret|compare|what\s+changed|what\s+is\s+happening|watch\s+next|predict|story\s+so\s+far)\b[\s\S]{0,180}\b(?:mail|summary|summaries|observation|source|visual|screen|this)\b/i.test(prompt) ||
  /\b(?:watch|monitor|track|keep\s+watching|keep\s+an\s+eye\s+on|observe)\b[\s\S]{0,220}\b(?:minecraft\s+video\s+predictor|predictor\s+contract|prediction\s+watch|micro[-\s]?batch(?:es)?|chronological\s+micro[-\s]?batch(?:es)?|interpretation\s+contract)\b/i.test(prompt) ||
  /\b(?:every\s+time|whenever|when)\b[\s\S]{0,120}\b(?:summary|summaries|mail|mail\s+batch|update|observation|visual|source|it)\b[\s\S]{0,120}\b(?:comes?\s+in|arrives?|changes?|updates?|happens?|describe|tell\s+me|announce|notify|speak|report)\b/i.test(prompt) ||
  /\b(?:announce|notify|speak|call\s*out|callout|tell\s+me)\b[\s\S]{0,60}\bif\b[\s\S]{0,140}\b(?:anything\s+important|something\s+important|something\s+changes?|it\s+changes?|source\s+changes?|visual\s+changes?|screen\s+changes?|happens?)\b/i.test(prompt) ||
  /\b(?:watch|monitor|track|keep\s+watching|keep\s+an\s+eye\s+on)\b[\s\S]{0,160}\b(?:active\s+visual\s+source|visual\s+source|live\s+source|source)\b[\s\S]{0,180}\b(?:minecraft\s+video\s+predictor|predictor\s+contract|prediction\s+watch|chronological\s+micro[-\s]?batch(?:es)?|micro[-\s]?batch(?:es)?|short\s+text\s+checkpoints?)\b/i.test(prompt);

const hasWatchJobSetupCue = (prompt: string): boolean =>
  (
    hasStandingWatchCue(prompt) ||
    /\b(?:watch|monitor|track|keep\s+an\s+eye\s+on)\b[\s\S]{0,180}\bonly\s+(?:announce|tell|notify|call\s*out|callout|voice)\b[\s\S]{0,120}\b(?:if|when|unless)\b/i.test(prompt) ||
    /\bonly\s+(?:announce|tell|notify|call\s*out|callout|voice)\b[\s\S]{0,120}\b(?:if|when|unless)\b/i.test(prompt) ||
    /\b(?:announce|notify|call\s*out|callout|voice)\s+(?:only\s+)?(?:if|when|unless)\b/i.test(prompt)
  ) &&
  (!hasExplicitReadCue(prompt) || hasStandingWatchCue(prompt));

const hasProcessedMailCue = (prompt: string): boolean =>
  /\blive_env\.(?:read_processed_live_source_mail|process_live_source_mail|record_live_source_mail_decision)\b/i.test(prompt) ||
  /\bstage_play_processed_mail_packet\b/i.test(prompt) ||
  /\b(?:processed\s+(?:live[-\s]?source\s+)?mail|processed\s+packet|visual\s+mail|latest\s+visual\s+update|new\s+source\s+mail)\b/i.test(prompt) ||
  (
    /\b(?:interpret(?:ation)?|what\s+is\s+happening|what's\s+happening|what\s+happened|what\s+changed|changed|changes|compare|comparison|contract|observed\s+facts?|cautious\s+inferences?|separate\s+observed\s+facts|what\s+should\s+(?:be\s+)?watched\s+next|watch\s+next|what\s+to\s+watch\s+next|story\s+so\s+far|observations?\s+mean|predict(?:ion)?|might\s+happen\s+next|minecraft\s+video\s+predictor|record\s+an?\s+interpretation|summari[sz]e\s+the\s+story)\b/i.test(prompt) &&
    /\b(?:mail|mailbox|summary|summaries|observation|observations|live\s+source|live-source|visual\s+source|visual\s+summary|screen\s+summary|source\s+update|watch\s+next|story\s+so\s+far|minecraft\s+video\s+predictor|contract)\b/i.test(prompt)
  );

const hasStatusCue = (prompt: string): boolean =>
  /\b(?:status|state|health|current\s+state|what\s+do\s+you\s+know|mailbox\s+state|loop\s+health|source\s+quality|queued|running|deferred|pressure)\b/i.test(prompt);

const processedMailPacketAllowsTerminalCheckpoint = (packet: RecordLike | null): boolean =>
  Boolean(packet) && !packetRequiresDecision(packet) && !packetIsVoiceCandidate(packet);

const makeResolution = (input: {
  phase: LiveSourceTurnPhaseV1;
  reason: string;
  canonicalGoal: LiveSourceTurnPhaseResolutionV1["canonicalGoal"];
  allowedTools?: string[];
  fallbackTools?: string[];
  forbiddenTools?: string[];
  requiredEvidence?: string[];
  completionEvidence?: string[];
  nextPhase?: LiveSourceTurnPhaseV1 | null;
  locked?: boolean;
  lockReason?: string | null;
  evidenceRefs?: string[];
}): LiveSourceTurnPhaseResolutionV1 => {
  const tableEntry = LIVE_SOURCE_TURN_PHASE_TABLE[input.phase];
  return {
    artifactId: "live_source_turn_phase_resolution",
    schemaVersion: "live_source_turn_phase_resolution/v1",
    phase: input.phase,
    reason: input.reason,
    canonicalGoal: input.canonicalGoal,
    allowedTools: input.allowedTools ?? tableEntry.allowedTools,
    fallbackTools: input.fallbackTools ?? tableEntry.fallbackTools,
    forbiddenTools: input.forbiddenTools ?? tableEntry.forbiddenTools,
    requiredEvidence: input.requiredEvidence ?? tableEntry.requiredEvidence,
    completionEvidence: input.completionEvidence ?? tableEntry.completionEvidence,
    nextPhase: input.nextPhase === undefined ? tableNextPhase(tableEntry) : input.nextPhase,
    phaseLock: {
      locked: input.locked ?? false,
      reason: input.lockReason ?? null,
    },
    evidenceRefs: input.evidenceRefs ?? [],
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  };
};

export const resolveLiveSourceTurnPhase = (
  input: ResolveLiveSourceTurnPhaseInput,
): LiveSourceTurnPhaseResolutionV1 => {
  const prompt = input.prompt.trim();
  const receipts = (input.latestToolReceipts ?? []).map(normalizeReceipt).filter((entry): entry is RecordLike => Boolean(entry));
  const packets = collectProcessedPackets(input, receipts);
  const latestPacket = packets.at(-1) ?? null;
  const selectedCapability = readString(input.selectedCapability);
  const contextualMicroReasonerDeckCue = hasContextualMicroReasonerDeckCue(prompt);
  const routeMetadata = readRecord(input.routeMetadata);
  const routeMetadataTargetsMailbox =
    readString(routeMetadata?.invocationKind) === "stage_play_mail_wake" &&
    readString(routeMetadata?.sourceTarget) === "live_source_mailbox";
  const routeMetadataPhase = normalizeMetadataPhase(routeMetadata?.requiredPhase);
  const routeMetadataCanonicalGoal = normalizeMetadataCanonicalGoal(routeMetadata?.requiredCanonicalGoal);
  const selectedTargetSource =
    readString(input.selectedTargetSource) ?? (routeMetadataTargetsMailbox ? "live_source_mailbox" : null);
  const evidenceRefs = uniqueStrings([
    input.activePolicyRef,
    input.activeInterpreterProfileRef,
    ...readStringList(routeMetadata?.evidenceRefs),
    ...receipts.flatMap((receipt) => {
      const observation = receiptObservation(receipt);
      return [
        readString(receipt.artifact_id),
        readString(receipt.artifactId),
        readString(observation?.profileId ?? observation?.profile_id),
        readString(observation?.policyId ?? observation?.policy_id),
        readString(observation?.watchJobPolicyRef ?? observation?.watch_job_policy_ref),
        readString(observation?.decisionId ?? observation?.decision_id),
        readString(observation?.artifactId ?? observation?.artifact_id),
        readString(readRecord(observation?.receipt)?.receiptId ?? readRecord(observation?.receipt)?.receipt_id),
      ];
    }),
    ...packets.map(packetId),
  ]);

  if (routeMetadataTargetsMailbox) {
    if (hasVoiceCalloutDecisionReceipt(receipts) && !hasVoiceCalloutCompletionReceipt(receipts)) {
      return makeResolution({
        phase: "request_voice_after_decision",
        reason: "Stage Play mail wake metadata targets the live-source mailbox and an existing decision requests voice; voice/hold/block receipt is mandatory before terminal synthesis.",
        canonicalGoal: "processed_mail_voice_decision",
        allowedTools: ["live_env.request_interim_voice_callout"],
        forbiddenTools: [
          "live_env.read_processed_live_source_mail",
          "live_env.process_live_source_mail",
          "live_env.read_live_source_mail",
          "live_env.record_live_source_mail_decision",
          "final_answer",
        ],
        requiredEvidence: ["stage_play_live_source_mail_decision"],
        completionEvidence: [
          "live_source_interim_voice_callout_receipt",
          "voice_hold_receipt",
          "voice_block_receipt",
          "voice_receipt",
        ],
        nextPhase: "terminal_checkpoint",
        locked: true,
        lockReason: "Stage Play mail wake metadata forbids prompt-text drift between decision and voice receipt.",
        evidenceRefs,
      });
    }

    if (hasVoiceCalloutDecisionReceipt(receipts) && hasVoiceCalloutCompletionReceipt(receipts)) {
      return makeResolution({
        phase: "terminal_checkpoint",
        reason: "Stage Play mail wake metadata has mailbox decision and voice/hold/block evidence; terminal synthesis may proceed without more mailbox tools.",
        canonicalGoal: "processed_mail_voice_decision",
        allowedTools: [],
        forbiddenTools: [
          "live_env.read_processed_live_source_mail",
          "live_env.process_live_source_mail",
          "live_env.read_live_source_mail",
          "live_env.record_live_source_mail_decision",
          "live_env.request_interim_voice_callout",
        ],
        requiredEvidence: [
          ...(latestPacket || evidenceRefs.some((ref) => ref.includes("stage_play_processed_mail_packet"))
            ? ["stage_play_processed_mail_packet"]
            : []),
          "stage_play_live_source_mail_decision",
          "live_source_interim_voice_callout_receipt",
        ],
        completionEvidence: ["model_synthesized_answer"],
        nextPhase: null,
        locked: true,
        lockReason: "Stage Play mail wake metadata completed the mailbox voice route.",
        evidenceRefs,
      });
    }

    if (
      routeMetadataPhase === "record_decision" ||
      routeMetadataCanonicalGoal === "processed_mail_voice_decision"
    ) {
      return makeResolution({
        phase: "record_decision",
        reason: "Stage Play mail wake metadata requires a live-source mailbox voice decision; prompt phrasing cannot downgrade this to read/process/status.",
        canonicalGoal: "processed_mail_voice_decision",
        allowedTools: ["live_env.record_live_source_mail_decision"],
        forbiddenTools: [
          "live_env.read_processed_live_source_mail",
          "live_env.process_live_source_mail",
          "live_env.read_live_source_mail",
          "live_env.request_interim_voice_callout",
          "final_answer",
        ],
        requiredEvidence: ["stage_play_processed_mail_packet"],
        completionEvidence: ["stage_play_live_source_mail_decision"],
        nextPhase: "request_voice_after_decision",
        locked: true,
        lockReason: "Stage Play mail wake route metadata is authoritative for the mailbox decision phase.",
        evidenceRefs,
      });
    }

    if (routeMetadataPhase === "read_processed_mail") {
      return makeResolution({
        phase: "read_processed_mail",
        reason: "Stage Play mail wake metadata targets the live-source mailbox read phase; generic visual and situation routes are out of scope.",
        canonicalGoal: routeMetadataCanonicalGoal ?? "processed_mail_interpretation",
        allowedTools: ["live_env.read_processed_live_source_mail"],
        fallbackTools: ["live_env.process_live_source_mail"],
        forbiddenTools: ["live_env.request_interim_voice_callout"],
        requiredEvidence: ["stage_play_processed_mail_packet"],
        completionEvidence: ["stage_play_processed_mail_packet"],
        nextPhase: "record_decision",
        locked: true,
        lockReason: "Stage Play mail wake route metadata is authoritative for mailbox reads.",
        evidenceRefs,
      });
    }
  }

  if (hasInterpreterProfileConfigCue(prompt)) {
    if (hasInterpreterProfileReceipt(receipts)) {
      return makeResolution({
        phase: "terminal_checkpoint",
        reason: "Interpreter profile setup receipt exists; setup phase can terminalize without reading mail.",
        canonicalGoal: "configure_interpreter_profile",
        allowedTools: [],
        forbiddenTools: ["live_env.read_processed_live_source_mail", "live_env.process_live_source_mail", "live_env.read_live_source_mail"],
        requiredEvidence: ["stage_play_live_source_interpreter_profile"],
        completionEvidence: ["stage_play_live_source_interpreter_profile"],
        nextPhase: null,
        locked: true,
        lockReason: "Profile setup prompts are contract configuration, not mail-reading turns.",
        evidenceRefs,
      });
    }
    return makeResolution({
      phase: "configure_interpreter_profile",
      reason: "Prompt asks to create/configure an interpreter profile; configure the contract before any mail read.",
      canonicalGoal: "configure_interpreter_profile",
      allowedTools: ["live_env.configure_interpreter_profile"],
      forbiddenTools: [
        "live_env.read_processed_live_source_mail",
        "live_env.process_live_source_mail",
        "live_env.read_live_source_mail",
        "live_env.record_live_source_mail_decision",
        "live_env.request_interim_voice_callout",
      ],
      requiredEvidence: ["live_env.configure_interpreter_profile"],
      completionEvidence: ["stage_play_live_source_interpreter_profile"],
      nextPhase: "terminal_checkpoint",
      locked: true,
      lockReason: "A clear setup/configuration prompt must not be consumed as a mailbox interpretation prompt.",
      evidenceRefs,
    });
  }

  if (hasWatchJobSetupCue(prompt) && packets.length === 0) {
    if (hasWatchPolicyReceipt(receipts) || input.activePolicyRef) {
      return makeResolution({
        phase: "terminal_checkpoint",
        reason: "Watch job policy receipt exists; standing objective setup can terminalize.",
        canonicalGoal: "configure_watch_job",
        allowedTools: [],
        forbiddenTools: ["live_env.read_processed_live_source_mail", "live_env.process_live_source_mail", "live_env.read_live_source_mail"],
        requiredEvidence: ["stage_play_live_source_watch_job_policy"],
        completionEvidence: ["stage_play_live_source_watch_job_policy"],
        nextPhase: null,
        locked: true,
        lockReason: "Watch setup completion should not immediately read mailbox evidence.",
        evidenceRefs,
      });
    }
    return makeResolution({
      phase: "configure_watch_job",
      reason: "Prompt asks for a standing watch behavior; configure the watch job policy first.",
      canonicalGoal: "configure_watch_job",
      allowedTools: ["live_env.configure_live_source_watch_job"],
      forbiddenTools: [
        "live_env.read_processed_live_source_mail",
        "live_env.process_live_source_mail",
        "live_env.read_live_source_mail",
        "live_env.record_live_source_mail_decision",
        "live_env.request_interim_voice_callout",
      ],
      requiredEvidence: ["live_env.configure_live_source_watch_job"],
      completionEvidence: ["stage_play_live_source_watch_job_policy"],
      nextPhase: "terminal_checkpoint",
      locked: true,
      lockReason: "Standing watch prompts create policy; mail evidence is handled by later wake cycles.",
      evidenceRefs,
    });
  }

  if (hasVisualObserverProfileCue(prompt)) {
    return makeResolution({
      phase: "apply_visual_observer_profile",
      reason: "Prompt asks to configure/apply visual observer shades; visual source prompt setup precedes mail reads.",
      canonicalGoal: "apply_visual_observer_profile",
      allowedTools: [
        "live_env.configure_visual_observer_profile",
        "live_env.apply_visual_observer_profile",
        "live_env.query_visual_observer_profiles",
        "live_env.test_visual_observer_profile",
        "live_env.compare_visual_observer_profiles",
      ],
      forbiddenTools: [
        "live_env.read_processed_live_source_mail",
        "live_env.process_live_source_mail",
        "live_env.read_live_source_mail",
        "live_env.record_live_source_mail_decision",
        "live_env.request_interim_voice_callout",
      ],
      requiredEvidence: ["stage_play_visual_observer_profile"],
      completionEvidence: ["stage_play_visual_observer_profile"],
      nextPhase: "terminal_checkpoint",
      locked: true,
      lockReason: "Observer-shades setup is a source-configuration phase.",
      evidenceRefs,
    });
  }

  if (
    !contextualMicroReasonerDeckCue &&
    (hasMicroReasonerDeckQueryCue(prompt) || selectedCapability === "live_env.query_micro_reasoner_presets")
  ) {
    return makeResolution({
      phase: "query_micro_reasoner_deck",
      reason: "Prompt asks to query the MicroDeck preset/prompt assembly; read MicroDeck evidence without entering the processed-mail flow.",
      canonicalGoal: "live_source_status",
      allowedTools: ["live_env.query_micro_reasoner_presets"],
      fallbackTools: [],
      forbiddenTools: [
        "live_env.read_processed_live_source_mail",
        "live_env.process_live_source_mail",
        "live_env.read_live_source_mail",
        "live_env.record_live_source_mail_decision",
        "live_env.request_interim_voice_callout",
      ],
      requiredEvidence: ["stage_play_micro_reasoner_prompt_preset_query_result"],
      completionEvidence: ["stage_play_micro_reasoner_prompt_preset_query_result"],
      nextPhase: "terminal_checkpoint",
      locked: true,
      lockReason: "MicroDeck inspection is a read-only source-prompt query, not mailbox processing.",
      evidenceRefs,
    });
  }

  const hasProcessedMailRead = receiptHasTool(receipts, "live_env.read_processed_live_source_mail");
  const hasProcessFallback = receiptHasTool(receipts, "live_env.process_live_source_mail");
  const processedReadPacketExists = receiptToolProducedPackets(receipts, "live_env.read_processed_live_source_mail");
  const processFallbackPacketExists = receiptToolProducedPackets(receipts, "live_env.process_live_source_mail");
  const processedReadReceiptIndex = receiptIndex(receipts, "live_env.read_processed_live_source_mail");
  const processFallbackReceiptIndex = receiptIndex(receipts, "live_env.process_live_source_mail");
  const processedMailSelected =
    selectedTargetSource === "live_source_mailbox" ||
    selectedCapability === "live_env.read_processed_live_source_mail" ||
    selectedCapability === "live_env.process_live_source_mail" ||
    hasProcessedMailCue(prompt);

  if (hasVoiceCalloutDecisionReceipt(receipts) && !hasVoiceCalloutCompletionReceipt(receipts)) {
    return makeResolution({
      phase: "request_voice_after_decision",
      reason: "Recorded live-source mail decision requests a voice callout; request the voice/hold/block receipt before terminal synthesis.",
      canonicalGoal: "processed_mail_voice_decision",
      allowedTools: ["live_env.request_interim_voice_callout"],
      forbiddenTools: [
        "live_env.read_processed_live_source_mail",
        "live_env.process_live_source_mail",
        "live_env.read_live_source_mail",
        "live_env.record_live_source_mail_decision",
        "final_answer",
      ],
      requiredEvidence: ["stage_play_live_source_mail_decision"],
      completionEvidence: [
        "live_source_interim_voice_callout_receipt",
        "voice_hold_receipt",
        "voice_block_receipt",
        "voice_receipt",
      ],
      nextPhase: "terminal_checkpoint",
      locked: true,
      lockReason: "Recorded request_voice_callout decision requires live_env.request_interim_voice_callout before terminal output.",
      evidenceRefs,
    });
  }

  if (hasVoiceCalloutDecisionReceipt(receipts) && hasVoiceCalloutCompletionReceipt(receipts)) {
    return makeResolution({
      phase: "terminal_checkpoint",
      reason: "Voice callout decision and voice/hold/block receipt both exist; synthesize from mailbox evidence without repeating voice.",
      canonicalGoal: "processed_mail_voice_decision",
      allowedTools: [],
      forbiddenTools: [
        "live_env.read_processed_live_source_mail",
        "live_env.process_live_source_mail",
        "live_env.read_live_source_mail",
        "live_env.record_live_source_mail_decision",
        "live_env.request_interim_voice_callout",
      ],
      requiredEvidence: [
        ...(latestPacket ? ["stage_play_processed_mail_packet"] : []),
        "stage_play_live_source_mail_decision",
        "live_source_interim_voice_callout_receipt",
      ],
      completionEvidence: ["model_synthesized_answer"],
      nextPhase: null,
      evidenceRefs,
    });
  }

  if (
    processedMailSelected &&
    processFallbackPacketExists &&
    processFallbackReceiptIndex > processedReadReceiptIndex &&
    !hasMailDecisionReceipt(receipts)
  ) {
    return makeResolution({
      phase: "read_processed_mail",
      reason: "Raw mail was processed into packet evidence; read the canonical processed-mail packet before decision or terminal synthesis.",
      canonicalGoal: "processed_mail_interpretation",
      allowedTools: ["live_env.read_processed_live_source_mail"],
      fallbackTools: ["live_env.process_live_source_mail"],
      forbiddenTools: ["live_env.record_live_source_mail_decision", "live_env.request_interim_voice_callout"],
      requiredEvidence: ["stage_play_processed_mail_packet"],
      completionEvidence: ["stage_play_processed_mail_packet"],
      nextPhase: "record_decision",
      evidenceRefs,
    });
  }

  if (latestPacket && packetIsVoiceCandidate(latestPacket) && !hasMailDecisionReceipt(receipts) && (processedReadPacketExists || !hasProcessFallback)) {
    return makeResolution({
      phase: "record_decision",
      reason: "Processed packet recommends a voice callout; record the model decision before any voice tool or terminal answer.",
      canonicalGoal: "processed_mail_voice_decision",
      allowedTools: ["live_env.record_live_source_mail_decision"],
      forbiddenTools: [
        "live_env.read_processed_live_source_mail",
        "live_env.process_live_source_mail",
        "live_env.read_live_source_mail",
        "live_env.request_interim_voice_callout",
        "final_answer",
      ],
      requiredEvidence: ["stage_play_processed_mail_packet"],
      completionEvidence: ["stage_play_live_source_mail_decision"],
      nextPhase: "request_voice_after_decision",
      locked: true,
      lockReason: "Decision authority must be recorded before voice output.",
      evidenceRefs,
    });
  }

  if (latestPacket && packetIsVoiceCandidate(latestPacket) && hasVoiceCalloutDecisionReceipt(receipts) && (processedReadPacketExists || !hasProcessFallback)) {
    return makeResolution({
      phase: "request_voice_after_decision",
      reason: "Voice callout decision exists for the processed packet; voice tool may run after decision authority.",
      canonicalGoal: "processed_mail_voice_decision",
      allowedTools: ["live_env.request_interim_voice_callout"],
      forbiddenTools: [
        "live_env.read_processed_live_source_mail",
        "live_env.process_live_source_mail",
        "live_env.read_live_source_mail",
        "live_env.record_live_source_mail_decision",
        "final_answer",
      ],
      requiredEvidence: ["stage_play_live_source_mail_decision"],
      completionEvidence: [
        "live_source_interim_voice_callout_receipt",
        "voice_hold_receipt",
        "voice_block_receipt",
        "voice_receipt",
      ],
      nextPhase: "terminal_checkpoint",
      locked: true,
      lockReason: "Voice output is only allowed after a recorded request_voice_callout decision.",
      evidenceRefs,
    });
  }

  if (latestPacket && processedMailSelected && hasMailDecisionReceipt(receipts) && (processedReadPacketExists || !hasProcessFallback)) {
    return makeResolution({
      phase: "terminal_checkpoint",
      reason: "Processed-mail decision receipt exists; synthesize the checkpoint from packet and decision evidence.",
      canonicalGoal: "processed_mail_interpretation",
      allowedTools: [],
      forbiddenTools: [
        "live_env.read_processed_live_source_mail",
        "live_env.process_live_source_mail",
        "live_env.read_live_source_mail",
        "live_env.record_live_source_mail_decision",
        "live_env.request_interim_voice_callout",
      ],
      requiredEvidence: ["stage_play_processed_mail_packet", "stage_play_live_source_mail_decision"],
      completionEvidence: ["model_synthesized_answer"],
      nextPhase: null,
      evidenceRefs,
    });
  }

  if (latestPacket && packetRequiresDecision(latestPacket) && !hasMailDecisionReceipt(receipts) && (processedReadPacketExists || !hasProcessFallback)) {
    return makeResolution({
      phase: "record_decision",
      reason: "Processed packet recommends a model decision; record live-source mail decision before terminal synthesis.",
      canonicalGoal: "processed_mail_interpretation",
      allowedTools: ["live_env.record_live_source_mail_decision"],
      forbiddenTools: [
        "live_env.read_processed_live_source_mail",
        "live_env.process_live_source_mail",
        "live_env.read_live_source_mail",
        "live_env.request_interim_voice_callout",
        "final_answer",
      ],
      requiredEvidence: ["stage_play_processed_mail_packet"],
      completionEvidence: ["stage_play_live_source_mail_decision"],
      nextPhase: "terminal_checkpoint",
      locked: true,
      lockReason: "Decision authority must be recorded before output or repeated mail reads.",
      evidenceRefs,
    });
  }

  if (
    latestPacket &&
    processedMailSelected &&
    processedMailPacketAllowsTerminalCheckpoint(latestPacket) &&
    (processedReadPacketExists || !hasProcessFallback)
  ) {
    return makeResolution({
      phase: "terminal_checkpoint",
      reason: "Processed-mail packet allows a direct checkpoint summary without an additional decision.",
      canonicalGoal: "processed_mail_interpretation",
      allowedTools: [],
      forbiddenTools: [
        "live_env.read_processed_live_source_mail",
        "live_env.process_live_source_mail",
        "live_env.read_live_source_mail",
        "live_env.record_live_source_mail_decision",
        "live_env.request_interim_voice_callout",
      ],
      requiredEvidence: ["stage_play_processed_mail_packet"],
      completionEvidence: ["model_synthesized_answer"],
      nextPhase: null,
      evidenceRefs,
    });
  }

  if (processedMailSelected) {
    if (hasProcessedMailRead && packets.length === 0 && !hasProcessFallback) {
      return makeResolution({
        phase: "process_mail_fallback",
        reason: "Processed-mail read did not provide packet coverage; process raw mail into packets.",
        canonicalGoal: "processed_mail_interpretation",
        allowedTools: ["live_env.process_live_source_mail"],
        forbiddenTools: ["live_env.record_live_source_mail_decision", "live_env.request_interim_voice_callout"],
        requiredEvidence: ["stage_play_live_source_mail_read_result"],
        completionEvidence: ["stage_play_processed_mail_packet"],
        nextPhase: "read_processed_mail",
        evidenceRefs,
      });
    }
    return makeResolution({
      phase: "read_processed_mail",
        reason: "Prompt targets live-source processed mail interpretation/checkpoint evidence.",
        canonicalGoal: "processed_mail_interpretation",
        allowedTools: ["live_env.read_processed_live_source_mail"],
        fallbackTools: ["live_env.process_live_source_mail"],
        forbiddenTools: ["live_env.request_interim_voice_callout"],
        requiredEvidence: ["stage_play_processed_mail_packet"],
        completionEvidence: ["stage_play_processed_mail_packet"],
      nextPhase: "record_decision",
      evidenceRefs,
    });
  }

  if (
    hasStatusCue(prompt) ||
    selectedCapability === "live_env.query_source_health" ||
    receiptHasAnyTool(receipts, ["live_env.query_source_health", "live_env.check_live_source_mail"])
  ) {
    return makeResolution({
      phase: "terminal_checkpoint",
      reason: "Prompt asks for live-source status/query state.",
      canonicalGoal: "live_source_status",
      allowedTools: ["live_env.query_source_health", "live_env.check_live_source_mail"],
      forbiddenTools: ["live_env.request_interim_voice_callout"],
      requiredEvidence: ["live_source_status"],
      completionEvidence: ["live_source_status"],
      nextPhase: null,
      evidenceRefs,
    });
  }

  return makeResolution({
    phase: "blocked_or_missing_args",
    reason: LIVE_SOURCE_TURN_PHASE_NO_MATCH_REASON,
    canonicalGoal: "live_source_status",
    allowedTools: [],
    forbiddenTools: [],
    requiredEvidence: [],
    completionEvidence: [],
    nextPhase: null,
    evidenceRefs,
  });
};
