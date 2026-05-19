export type HelixAskVoiceMode =
  | "off"
  | "observant"
  | "dot"
  | "companion"
  | "translate"
  | "critical"
  | "debug";

export type HelixVoiceOutputReason =
  | "dot_direct_address"
  | "dot_stop_command"
  | "dot_observant_mode"
  | "ambient_context"
  | "voice_output_disabled"
  | "untrusted_speaker"
  | "critical_commentary"
  | "silent_policy";

export type LiveVoiceSpeakerRole = "owner" | "trusted_guest" | "guest" | "unknown" | "device_audio";

export type LiveVoiceSpeakerAuthority =
  | "command_allowed"
  | "command_confirm"
  | "transcribe_only"
  | "ignored";

export type LiveVoiceTranscriptKind =
  | "ambient"
  | "direct_address"
  | "command_candidate"
  | "translation_context";

export type HelixAskDotModePolicy = {
  schema: "helix.ask_dot_mode_policy.v1";
  mode: "dot";
  direct_address_names: ["dot"];
  live_listening_enabled: boolean;
  voice_logs_to_live_environment: boolean;
  screen_summaries_to_live_environment: boolean;
  predictions_to_live_environment: boolean;
  ambient_voice_policy: "journal_only";
  direct_address_policy: "authorized_speaker_only";
  stop_command_policy: "stop_output_return_observant";
  voice_output_enabled: boolean;
  unprompted_voice_policy: "critical_only" | "never";
  raw_audio_included: false;
  raw_transcript_included: false;
  context_policy: "compact_context_pack_only";
};

export type LiveVoiceSituationObservation = {
  schema: "helix.live_voice_situation_observation.v1";
  observation_id: string;
  thread_id: string;
  room_id: string;
  source_id: string;
  speaker_id?: string | null;
  speaker_role: LiveVoiceSpeakerRole;
  speaker_authority: LiveVoiceSpeakerAuthority;
  transcript_text: string;
  transcript_kind: LiveVoiceTranscriptKind;
  interpreted_context: {
    summary: string;
    possible_intent?: string | null;
    topic_tags: string[];
    salience: "routine" | "milestone" | "risk" | "action";
  };
  observed_at: string;
  available_at: string;
  evidence_refs: string[];
  assistant_answer: false;
  raw_audio_included: false;
  raw_transcript_included: false;
  context_policy: "compact_context_pack_only";
};

export type DotModeUtteranceKind =
  | "ambient"
  | "direct_address"
  | "stop_output"
  | "stop_listening"
  | "stand_by"
  | "resume"
  | "procedure_activation_request";

export type DotModeUtteranceDecision = {
  schema: "helix.dot_utterance_decision.v1";
  kind: DotModeUtteranceKind;
  transcript_kind: LiveVoiceTranscriptKind;
  wake_name: "dot" | null;
  addressed_text: string | null;
  creates_user_turn: boolean;
  cancels_active_answer: boolean;
  cancels_voice_output: boolean;
  disables_voice_capture: boolean;
  next_voice_mode: HelixAskVoiceMode | null;
  voice_output_reason: HelixVoiceOutputReason;
  speakable: boolean;
  temporal_context_window?: {
    anchor_observed_at: string;
    include_observed_before_or_at: string;
    exclude_post_anchor: true;
  };
};

const DEFAULT_TOPIC_TAGS = ["voice", "situation_room"];

export const DEFAULT_HELIX_DOT_MODE_POLICY: HelixAskDotModePolicy = {
  schema: "helix.ask_dot_mode_policy.v1",
  mode: "dot",
  direct_address_names: ["dot"],
  live_listening_enabled: true,
  voice_logs_to_live_environment: true,
  screen_summaries_to_live_environment: true,
  predictions_to_live_environment: true,
  ambient_voice_policy: "journal_only",
  direct_address_policy: "authorized_speaker_only",
  stop_command_policy: "stop_output_return_observant",
  voice_output_enabled: true,
  unprompted_voice_policy: "critical_only",
  raw_audio_included: false,
  raw_transcript_included: false,
  context_policy: "compact_context_pack_only",
};

const normalizeTranscript = (value: string): string =>
  value
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .trim();

const isCommandAllowed = (authority: LiveVoiceSpeakerAuthority): boolean =>
  authority === "command_allowed" || authority === "command_confirm";

function parseDotAddress(text: string): { wake: "dot"; rest: string } | null {
  const normalized = normalizeTranscript(text);
  const match = normalized.match(/^(?:(?:hey|ok|okay)\s+)?dot(?:\s*[,.:;-]\s*|\s+)(.*)$/i);
  if (!match) return null;
  return {
    wake: "dot",
    rest: normalizeTranscript(match[1] ?? ""),
  };
}

function inferDirectAddressKind(addressedText: string): DotModeUtteranceKind {
  if (/^(?:please\s+)?stop\s+listening\b/i.test(addressedText)) return "stop_listening";
  if (/^(?:please\s+)?(?:stop|cancel|quiet|silence)\b/i.test(addressedText)) return "stop_output";
  if (/^(?:stand\s*by|standby|hold)\b/i.test(addressedText)) return "stand_by";
  if (/^(?:resume|continue|come\s+back)\b/i.test(addressedText)) return "resume";
  if (/\b(?:translate|translation|relay|summarize|summary|action\s+items?)\b/i.test(addressedText)) {
    return "procedure_activation_request";
  }
  return "direct_address";
}

function buildTemporalWindow(observedAt: string): DotModeUtteranceDecision["temporal_context_window"] {
  return {
    anchor_observed_at: observedAt,
    include_observed_before_or_at: observedAt,
    exclude_post_anchor: true,
  };
}

export function classifyDotModeUtterance(args: {
  text: string;
  observedAt?: string;
  speakerAuthority?: LiveVoiceSpeakerAuthority;
  policy?: HelixAskDotModePolicy;
}): DotModeUtteranceDecision {
  const policy = args.policy ?? DEFAULT_HELIX_DOT_MODE_POLICY;
  const observedAt = args.observedAt ?? new Date().toISOString();
  const speakerAuthority = args.speakerAuthority ?? "transcribe_only";
  const addressed = parseDotAddress(args.text);
  if (!addressed) {
    return {
      schema: "helix.dot_utterance_decision.v1",
      kind: "ambient",
      transcript_kind: "ambient",
      wake_name: null,
      addressed_text: null,
      creates_user_turn: false,
      cancels_active_answer: false,
      cancels_voice_output: false,
      disables_voice_capture: false,
      next_voice_mode: null,
      voice_output_reason: "ambient_context",
      speakable: false,
    };
  }

  const kind = inferDirectAddressKind(addressed.rest);
  const allowed = isCommandAllowed(speakerAuthority);
  const stopOutput = kind === "stop_output" || kind === "stand_by";
  const stopListening = kind === "stop_listening";
  const createsUserTurn = allowed && !stopOutput && !stopListening;
  const outputEnabled = policy.voice_output_enabled;

  return {
    schema: "helix.dot_utterance_decision.v1",
    kind,
    transcript_kind: stopOutput || stopListening ? "command_candidate" : "direct_address",
    wake_name: addressed.wake,
    addressed_text: addressed.rest,
    creates_user_turn: createsUserTurn,
    cancels_active_answer: stopOutput || stopListening,
    cancels_voice_output: stopOutput || stopListening,
    disables_voice_capture: stopListening,
    next_voice_mode: stopListening ? "off" : stopOutput ? "observant" : kind === "resume" && allowed ? "dot" : null,
    voice_output_reason: !allowed
      ? "untrusted_speaker"
      : stopOutput || stopListening
        ? "dot_stop_command"
      : outputEnabled
        ? "dot_direct_address"
        : "voice_output_disabled",
    speakable: createsUserTurn && outputEnabled,
    ...(createsUserTurn ? { temporal_context_window: buildTemporalWindow(observedAt) } : {}),
  };
}

function classifySalience(kind: DotModeUtteranceKind): LiveVoiceSituationObservation["interpreted_context"]["salience"] {
  if (kind === "stop_output" || kind === "stop_listening" || kind === "procedure_activation_request") return "action";
  if (kind === "direct_address" || kind === "resume" || kind === "stand_by") return "milestone";
  return "routine";
}

function summarizeObservation(text: string, decision: DotModeUtteranceDecision): string {
  if (decision.kind === "ambient") return normalizeTranscript(text).slice(0, 240);
  const addressed = decision.addressed_text || normalizeTranscript(text);
  return `Dot ${decision.kind.replace(/_/g, " ")}: ${addressed}`.slice(0, 240);
}

export function buildLiveVoiceSituationObservation(args: {
  observationId: string;
  threadId: string;
  roomId: string;
  sourceId: string;
  transcriptText: string;
  decision?: DotModeUtteranceDecision;
  speakerId?: string | null;
  speakerRole?: LiveVoiceSpeakerRole;
  speakerAuthority?: LiveVoiceSpeakerAuthority;
  observedAt?: string;
  availableAt?: string;
  evidenceRefs?: string[];
  topicTags?: string[];
}): LiveVoiceSituationObservation {
  const decision =
    args.decision ??
    classifyDotModeUtterance({
      text: args.transcriptText,
      observedAt: args.observedAt,
      speakerAuthority: args.speakerAuthority,
    });
  const observedAt = args.observedAt ?? new Date().toISOString();
  return {
    schema: "helix.live_voice_situation_observation.v1",
    observation_id: args.observationId,
    thread_id: args.threadId,
    room_id: args.roomId,
    source_id: args.sourceId,
    speaker_id: args.speakerId ?? null,
    speaker_role: args.speakerRole ?? "unknown",
    speaker_authority: args.speakerAuthority ?? "transcribe_only",
    transcript_text: normalizeTranscript(args.transcriptText),
    transcript_kind: decision.transcript_kind,
    interpreted_context: {
      summary: summarizeObservation(args.transcriptText, decision),
      possible_intent: decision.addressed_text,
      topic_tags: args.topicTags ?? DEFAULT_TOPIC_TAGS,
      salience: classifySalience(decision.kind),
    },
    observed_at: observedAt,
    available_at: args.availableAt ?? observedAt,
    evidence_refs: args.evidenceRefs ?? [`live_voice:${args.observationId}`],
    assistant_answer: false,
    raw_audio_included: false,
    raw_transcript_included: false,
    context_policy: "compact_context_pack_only",
  };
}
