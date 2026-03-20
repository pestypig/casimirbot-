import { createHash } from "node:crypto";
import { z } from "zod";

export const HELIX_VOICE_COMMAND_LANE_VERSION = "helix.voice.command_lane.v1" as const;

export type VoiceCommandLaneAction = "send" | "cancel" | "retry";
export type VoiceCommandLaneDecision = "accepted" | "suppressed" | "none";
export type VoiceCommandLaneSource = "parser" | "evaluator" | "none";
export type VoiceCommandLaneStrictPrefixMode = "adaptive" | "off" | "always";
export type VoiceCommandLaneSuppressionReason =
  | "disabled"
  | "kill_switch"
  | "rollout_inactive"
  | "audio_quality_low"
  | "strict_prefix_required"
  | "log_only";

export type VoiceCommandLaneResult = {
  version: typeof HELIX_VOICE_COMMAND_LANE_VERSION;
  decision: VoiceCommandLaneDecision;
  action: VoiceCommandLaneAction | null;
  confidence: number | null;
  source: VoiceCommandLaneSource;
  suppression_reason: VoiceCommandLaneSuppressionReason | null;
  strict_prefix_applied: boolean;
  confirm_required: boolean;
  utterance_id: string;
};

export type VoiceCommandArbiterInput = {
  transcript: string;
  traceId?: string | null;
  utteranceId?: string | null;
  speechProbability?: number | null;
  snrDb?: number | null;
};

type VoiceCommandArbiterConfig = {
  enabled: boolean;
  logOnly: boolean;
  activePercent: number;
  strictPrefixMode: VoiceCommandLaneStrictPrefixMode;
  killSwitch: boolean;
  noiseRiskSpeechProbabilityMax: number;
  noiseRiskSnrDbMax: number;
  hardMinSpeechProbability: number;
  hardMinSnrDb: number;
  evaluatorModel: string;
  evaluatorMinConfidence: number;
  evaluatorTimeoutMs: number;
  evaluatorApiKey: string | null;
  evaluatorBaseUrl: string;
};

type ParserDecision = {
  decision: "accepted" | "uncertain" | "none";
  action: VoiceCommandLaneAction | null;
  confidence: number | null;
  hasHelixPrefix: boolean;
  keywordDetected: boolean;
  highLikelihood: boolean;
};

const SEND_COMMAND_PHRASES = new Set([
  "send",
  "send it",
  "send now",
  "send this",
  "dispatch",
  "submit",
]);
const RETRY_COMMAND_PHRASES = new Set([
  "retry",
  "retry that",
  "retry this",
  "retry it",
  "try again",
  "again",
  "redo",
  "rerun",
]);
const CANCEL_COMMAND_PHRASES = new Set([
  "cancel",
  "cancel that",
  "cancel this",
  "cancel it",
  "stop",
  "abort",
  "dismiss",
  "never mind",
  "nevermind",
]);
const COMMAND_KEYWORDS = new Set([
  "send",
  "dispatch",
  "submit",
  "retry",
  "again",
  "redo",
  "rerun",
  "cancel",
  "stop",
  "abort",
  "dismiss",
]);
const LEADING_FILLER_WORDS = new Set(["please", "ok", "okay", "hey", "just", "actually"]);

const EVALUATOR_OUTPUT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["intent", "action", "confidence"],
  properties: {
    intent: {
      type: "string",
      enum: ["command", "dictation", "none"],
    },
    action: {
      type: "string",
      enum: ["send", "cancel", "retry", "none"],
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
    },
  },
} as const;

const EvaluatorOutputSchema = z.object({
  intent: z.enum(["command", "dictation", "none"]),
  action: z.enum(["send", "cancel", "retry", "none"]),
  confidence: z.number().min(0).max(1),
});

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return fallback;
  if (normalized === "1" || normalized === "true") return true;
  if (normalized === "0" || normalized === "false") return false;
  return fallback;
};

const parsePercent = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return Math.max(0, Math.min(100, fallback));
  return Math.max(0, Math.min(100, Math.round(parsed)));
};

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeStrictPrefixMode = (value: string | undefined): VoiceCommandLaneStrictPrefixMode => {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "off") return "off";
  if (normalized === "always") return "always";
  return "adaptive";
};

const normalizeTranscript = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9'\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const parseResponsesText = (payload: unknown): string => {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const output = Array.isArray(root.output) ? root.output : [];
  for (const entry of output) {
    const content = Array.isArray((entry as { content?: unknown }).content)
      ? ((entry as { content?: unknown }).content as Array<Record<string, unknown>>)
      : [];
    for (const chunk of content) {
      const textValue = typeof chunk.text === "string" ? chunk.text : null;
      if (textValue && textValue.trim()) return textValue.trim();
      const outputText = typeof chunk.output_text === "string" ? chunk.output_text : null;
      if (outputText && outputText.trim()) return outputText.trim();
    }
  }
  const fallback = typeof root.output_text === "string" ? root.output_text.trim() : "";
  return fallback;
};

const toResponsesEndpoint = (baseUrl: string): string => `${baseUrl.replace(/\/+$/, "")}/responses`;

const hashPercent = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 100;
};

const shouldEnableRollout = (args: {
  enabled: boolean;
  killSwitch: boolean;
  activePercent: number;
  key: string;
}): boolean => {
  if (!args.enabled || args.killSwitch) return false;
  const percent = Math.max(0, Math.min(100, Math.round(args.activePercent)));
  if (percent <= 0) return false;
  if (percent >= 100) return true;
  return hashPercent(args.key) < percent;
};

const readVoiceCommandArbiterConfigFromEnv = (): VoiceCommandArbiterConfig => {
  const evaluatorApiKeyRaw =
    process.env.HELIX_VOICE_COMMAND_LANE_EVALUATOR_API_KEY ??
    process.env.OPENAI_API_KEY ??
    "";
  return {
    enabled: parseBoolean(process.env.HELIX_VOICE_COMMAND_LANE_ENABLED, false),
    logOnly: parseBoolean(process.env.HELIX_VOICE_COMMAND_LANE_LOG_ONLY, false),
    activePercent: parsePercent(process.env.HELIX_VOICE_COMMAND_LANE_ACTIVE_PERCENT, 0),
    strictPrefixMode: normalizeStrictPrefixMode(process.env.HELIX_VOICE_COMMAND_LANE_STRICT_PREFIX_MODE),
    killSwitch: parseBoolean(process.env.HELIX_VOICE_COMMAND_LANE_KILL_SWITCH, false),
    noiseRiskSpeechProbabilityMax: clamp01(
      parseNumber(process.env.HELIX_VOICE_COMMAND_LANE_NOISE_RISK_SPEECH_PROB_MAX, 0.62),
    ),
    noiseRiskSnrDbMax: parseNumber(process.env.HELIX_VOICE_COMMAND_LANE_NOISE_RISK_SNR_DB_MAX, 12),
    hardMinSpeechProbability: clamp01(parseNumber(process.env.HELIX_VOICE_COMMAND_LANE_HARD_MIN_SPEECH_PROB, 0.22)),
    hardMinSnrDb: parseNumber(process.env.HELIX_VOICE_COMMAND_LANE_HARD_MIN_SNR_DB, -2),
    evaluatorModel:
      (process.env.HELIX_VOICE_COMMAND_LANE_EVALUATOR_MODEL ?? "gpt-4o-mini").trim() ||
      "gpt-4o-mini",
    evaluatorMinConfidence: clamp01(
      parseNumber(process.env.HELIX_VOICE_COMMAND_LANE_EVALUATOR_MIN_CONFIDENCE, 0.78),
    ),
    evaluatorTimeoutMs: Math.max(
      350,
      Math.min(10_000, Math.round(parseNumber(process.env.HELIX_VOICE_COMMAND_LANE_EVALUATOR_TIMEOUT_MS, 1200))),
    ),
    evaluatorApiKey: evaluatorApiKeyRaw.trim() || null,
    evaluatorBaseUrl:
      (process.env.HELIX_VOICE_COMMAND_LANE_EVALUATOR_BASE_URL ??
        process.env.HELIX_ASK_INTERPRETER_BASE_URL ??
        "https://api.openai.com/v1")
        .trim() || "https://api.openai.com/v1",
  };
};

const buildUtteranceId = (input: VoiceCommandArbiterInput, normalizedTranscript: string): string => {
  const provided = input.utteranceId?.trim();
  if (provided) return provided.slice(0, 120);
  const key = `${input.traceId?.trim() || "voice"}|${normalizedTranscript}`;
  const digest = createHash("sha1").update(key).digest("hex").slice(0, 16);
  return `vcmd:${digest}`;
};

const extractCommandActionFromPhrase = (phrase: string): VoiceCommandLaneAction | null => {
  if (SEND_COMMAND_PHRASES.has(phrase)) return "send";
  if (RETRY_COMMAND_PHRASES.has(phrase)) return "retry";
  if (CANCEL_COMMAND_PHRASES.has(phrase)) return "cancel";
  return null;
};

const tokenToAction = (token: string): VoiceCommandLaneAction | null => {
  if (token === "send" || token === "dispatch" || token === "submit") return "send";
  if (token === "retry" || token === "again" || token === "redo" || token === "rerun") return "retry";
  if (token === "cancel" || token === "stop" || token === "abort" || token === "dismiss") return "cancel";
  return null;
};

const hasInlineHelixPrefix = (rawTranscript: string): boolean =>
  /(^|[\s.!?;,:])helix\s+/i.test(rawTranscript.trim());

const stripLeadingFillerAndPrefixTokens = (rawTokens: string[]): { tokens: string[]; hasHelixPrefix: boolean } => {
  const tokens = [...rawTokens];
  while (tokens.length > 1 && LEADING_FILLER_WORDS.has(tokens[0])) {
    tokens.shift();
  }
  let hasHelixPrefix = false;
  if (tokens[0] === "helix") {
    hasHelixPrefix = true;
    tokens.shift();
  }
  return { tokens, hasHelixPrefix };
};

const normalizeClauseCommandPhrase = (rawClause: string): string => {
  const normalizedTokens = normalizeTranscript(rawClause).split(" ").filter(Boolean);
  const { tokens } = stripLeadingFillerAndPrefixTokens(normalizedTokens);
  return tokens.join(" ").trim();
};

const extractTrailingClauseCommand = (
  rawTranscript: string,
): { action: VoiceCommandLaneAction; confidence: number } | null => {
  const clauses = rawTranscript
    .split(/[.!?;]+/)
    .map((entry) => normalizeClauseCommandPhrase(entry))
    .filter(Boolean);
  if (clauses.length === 0) return null;

  const lastClause = clauses[clauses.length - 1] ?? "";
  const priorClause = clauses.length > 1 ? clauses[clauses.length - 2] ?? "" : "";
  const lastAction = extractCommandActionFromPhrase(lastClause);
  if (lastAction) {
    return {
      action: lastAction,
      confidence: 0.95,
    };
  }

  const keepListeningTail =
    lastClause === "keep listening" ||
    lastClause === "continue listening" ||
    lastClause === "stay listening";
  const priorAction = priorClause ? extractCommandActionFromPhrase(priorClause) : null;
  if (keepListeningTail && (priorAction === "cancel" || priorAction === "send")) {
    return {
      action: priorAction,
      confidence: 0.95,
    };
  }

  const normalizedWhole = normalizeTranscript(rawTranscript);
  if (/^(?:do not|don t|dont|don't)\s+send(?:\s+(?:that|this|it))?(?:\s+yet)?$/.test(lastClause)) {
    return {
      action: "cancel",
      confidence: 0.95,
    };
  }
  if (
    /\bcancel(?: that| this| it)?\b/.test(normalizedWhole) &&
    /\b(keep|continue|stay) listening\b/.test(normalizedWhole)
  ) {
    return {
      action: "cancel",
      confidence: 0.9,
    };
  }
  if (
    /\bsend(?: that| this| it)?(?: part)?\b/.test(normalizedWhole) &&
    /\b(keep|continue|stay) listening\b/.test(normalizedWhole) &&
    !/\b(?:do not|don t|dont|don't)\s+send\b/.test(normalizedWhole)
  ) {
    return {
      action: "send",
      confidence: 0.9,
    };
  }
  return null;
};

const isLikelyImperativeShape = (rawTranscript: string, normalizedTranscript: string): boolean => {
  if (!normalizedTranscript) return false;
  if (/[?]$/.test(rawTranscript.trim())) return false;
  if (extractTrailingClauseCommand(rawTranscript)) return true;
  if (/^(what|why|how|where|when|who)\b/i.test(normalizedTranscript)) return false;
  const tokens = normalizedTranscript.split(" ").filter(Boolean);
  if (tokens.length === 0 || tokens.length > 10) return false;
  const firstKeywordIndex = tokens.findIndex((token) => COMMAND_KEYWORDS.has(token));
  if (firstKeywordIndex < 0) return false;
  return firstKeywordIndex <= 2;
};

export const parseVoiceCommandCandidate = (rawTranscript: string): ParserDecision => {
  const normalized = normalizeTranscript(rawTranscript);
  if (!normalized) {
    return {
      decision: "none",
      action: null,
      confidence: null,
      hasHelixPrefix: false,
      keywordDetected: false,
      highLikelihood: false,
    };
  }
  const hasHelixPrefixFromPunctuation = hasInlineHelixPrefix(rawTranscript);
  const trailingClauseCommand = extractTrailingClauseCommand(rawTranscript);
  if (trailingClauseCommand) {
    return {
      decision: "accepted",
      action: trailingClauseCommand.action,
      confidence: trailingClauseCommand.confidence,
      hasHelixPrefix: hasHelixPrefixFromPunctuation,
      keywordDetected: true,
      highLikelihood: true,
    };
  }
  const normalizedTokens = normalized.split(" ").filter(Boolean);
  const stripped = stripLeadingFillerAndPrefixTokens(normalizedTokens);
  const phraseTokens = stripped.tokens;
  const hasHelixPrefix = hasHelixPrefixFromPunctuation || stripped.hasHelixPrefix;
  const phrase = phraseTokens.join(" ").trim();
  const keywordDetected = phraseTokens.some((token) => COMMAND_KEYWORDS.has(token));
  if (!keywordDetected) {
    return {
      decision: "none",
      action: null,
      confidence: null,
      hasHelixPrefix,
      keywordDetected,
      highLikelihood: false,
    };
  }

  const explicitNegativeSend = /^(?:do not|don t|dont|don't)\s+send(?:\s+(?:that|this|it))?(?:\s+yet)?$/.test(
    phrase,
  );
  if (explicitNegativeSend) {
    return {
      decision: "accepted",
      action: "cancel",
      confidence: 0.93,
      hasHelixPrefix,
      keywordDetected: true,
      highLikelihood: true,
    };
  }
  if (/^(?:not)\s+(?:cancel|stop|send|retry)\b/.test(phrase)) {
    return {
      decision: "none",
      action: null,
      confidence: null,
      hasHelixPrefix,
      keywordDetected: true,
      highLikelihood: false,
    };
  }
  const hasNegatedCommandContext = phraseTokens.some(
    (token, index) => index > 0 && COMMAND_KEYWORDS.has(token) && phraseTokens[index - 1] === "not",
  );
  if (hasNegatedCommandContext) {
    return {
      decision: "none",
      action: null,
      confidence: null,
      hasHelixPrefix,
      keywordDetected: true,
      highLikelihood: false,
    };
  }

  const exactAction = extractCommandActionFromPhrase(phrase);
  if (exactAction) {
    return {
      decision: "accepted",
      action: exactAction,
      confidence: 0.97,
      hasHelixPrefix,
      keywordDetected,
      highLikelihood: true,
    };
  }
  const firstTokenAction = phraseTokens.length > 0 ? tokenToAction(phraseTokens[0]) : null;
  if (firstTokenAction && phraseTokens.length <= 6) {
    return {
      decision: "uncertain",
      action: firstTokenAction,
      confidence: 0.64,
      hasHelixPrefix,
      keywordDetected,
      highLikelihood: true,
    };
  }
  const firstKeywordIndex = phraseTokens.findIndex((token) => COMMAND_KEYWORDS.has(token));
  const highLikelihood = firstKeywordIndex >= 0 && firstKeywordIndex <= 2 && phraseTokens.length <= 9;
  const fallbackAction =
    firstKeywordIndex >= 0 ? tokenToAction(phraseTokens[firstKeywordIndex]) : null;
  return {
    decision: "uncertain",
    action: fallbackAction,
    confidence: highLikelihood ? 0.55 : 0.42,
    hasHelixPrefix,
    keywordDetected,
    highLikelihood,
  };
};

const runEvaluator = async (args: {
  transcript: string;
  config: VoiceCommandArbiterConfig;
}): Promise<z.infer<typeof EvaluatorOutputSchema> | null> => {
  if (!args.config.evaluatorApiKey) return null;
  const endpoint = toResponsesEndpoint(args.config.evaluatorBaseUrl);
  const body = {
    model: args.config.evaluatorModel,
    input: [
      {
        role: "system",
        content:
          "Classify whether a transcript is a direct voice command. Return strict JSON only. Allowed commands: send, cancel, retry.",
      },
      {
        role: "user",
        content: [
          "Instructions:",
          "- Treat command words used in descriptive sentences as dictation, not commands.",
          "- Return action=none unless intent is an explicit command.",
          "",
          `Transcript: ${args.transcript}`,
        ].join("\n"),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "voice_command_lane_eval_v1",
        schema: EVALUATOR_OUTPUT_JSON_SCHEMA,
        strict: true,
      },
    },
    max_output_tokens: 160,
  };
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), args.config.evaluatorTimeoutMs);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${args.config.evaluatorApiKey}`,
      },
      body: JSON.stringify(body),
      signal: abortController.signal,
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const rawText = parseResponsesText(payload);
    if (!rawText) return null;
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      return null;
    }
    const parsed = EvaluatorOutputSchema.safeParse(parsedJson);
    if (!parsed.success) return null;
    return parsed.data;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};

const buildResult = (args: {
  input: VoiceCommandArbiterInput;
  normalizedTranscript: string;
  strictPrefixApplied: boolean;
  decision: VoiceCommandLaneDecision;
  action?: VoiceCommandLaneAction | null;
  confidence?: number | null;
  source?: VoiceCommandLaneSource;
  suppressionReason?: VoiceCommandLaneSuppressionReason | null;
}): VoiceCommandLaneResult => ({
  version: HELIX_VOICE_COMMAND_LANE_VERSION,
  decision: args.decision,
  action: args.action ?? null,
  confidence:
    typeof args.confidence === "number" && Number.isFinite(args.confidence)
      ? clamp01(args.confidence)
      : null,
  source: args.source ?? "none",
  suppression_reason: args.suppressionReason ?? null,
  strict_prefix_applied: args.strictPrefixApplied,
  confirm_required: args.decision === "accepted",
  utterance_id: buildUtteranceId(args.input, args.normalizedTranscript),
});

const requiresStrictPrefixForAction = (action: VoiceCommandLaneAction | null): boolean =>
  action === "send" || action === "retry";

const isNoiseRiskHigh = (args: {
  speechProbability?: number | null;
  snrDb?: number | null;
  config: VoiceCommandArbiterConfig;
}): boolean =>
  (typeof args.speechProbability === "number" &&
    args.speechProbability < args.config.noiseRiskSpeechProbabilityMax) ||
  (typeof args.snrDb === "number" && args.snrDb < args.config.noiseRiskSnrDbMax);

const isHardLowAudioQuality = (args: {
  speechProbability?: number | null;
  snrDb?: number | null;
  config: VoiceCommandArbiterConfig;
}): boolean =>
  (typeof args.speechProbability === "number" &&
    args.speechProbability < args.config.hardMinSpeechProbability) ||
  (typeof args.snrDb === "number" && args.snrDb < args.config.hardMinSnrDb);

export const runVoiceCommandArbiter = async (
  input: VoiceCommandArbiterInput,
): Promise<VoiceCommandLaneResult> => {
  const normalizedTranscript = normalizeTranscript(input.transcript ?? "");
  const config = readVoiceCommandArbiterConfigFromEnv();
  const rolloutKey = input.traceId?.trim() || normalizedTranscript || "voice_command_lane";
  const rolloutActive = shouldEnableRollout({
    enabled: config.enabled,
    killSwitch: config.killSwitch,
    activePercent: config.activePercent,
    key: rolloutKey,
  });

  if (config.killSwitch) {
    return buildResult({
      input,
      normalizedTranscript,
      strictPrefixApplied: false,
      decision: "suppressed",
      source: "none",
      suppressionReason: "kill_switch",
    });
  }
  if (!config.enabled) {
    return buildResult({
      input,
      normalizedTranscript,
      strictPrefixApplied: false,
      decision: "none",
      source: "none",
      suppressionReason: "disabled",
    });
  }
  if (!rolloutActive) {
    return buildResult({
      input,
      normalizedTranscript,
      strictPrefixApplied: false,
      decision: "none",
      source: "none",
      suppressionReason: "rollout_inactive",
    });
  }
  if (!normalizedTranscript) {
    return buildResult({
      input,
      normalizedTranscript,
      strictPrefixApplied: false,
      decision: "none",
      source: "none",
    });
  }

  const strictPrefixApplied =
    config.strictPrefixMode === "always" ||
    (config.strictPrefixMode === "adaptive" &&
      isNoiseRiskHigh({
        speechProbability: input.speechProbability,
        snrDb: input.snrDb,
        config,
      }));

  if (isHardLowAudioQuality({ speechProbability: input.speechProbability, snrDb: input.snrDb, config })) {
    return buildResult({
      input,
      normalizedTranscript,
      strictPrefixApplied,
      decision: "suppressed",
      source: "none",
      suppressionReason: "audio_quality_low",
    });
  }

  if (!isLikelyImperativeShape(input.transcript, normalizedTranscript)) {
    return buildResult({
      input,
      normalizedTranscript,
      strictPrefixApplied,
      decision: "none",
      source: "none",
    });
  }

  const parser = parseVoiceCommandCandidate(input.transcript);
  if (!parser.keywordDetected) {
    return buildResult({
      input,
      normalizedTranscript,
      strictPrefixApplied,
      decision: "none",
      source: "none",
    });
  }

  if (parser.decision === "accepted" && parser.action) {
    if (strictPrefixApplied && requiresStrictPrefixForAction(parser.action) && !parser.hasHelixPrefix) {
      return buildResult({
        input,
        normalizedTranscript,
        strictPrefixApplied,
        decision: "suppressed",
        action: parser.action,
        confidence: parser.confidence,
        source: "parser",
        suppressionReason: "strict_prefix_required",
      });
    }
    if (config.logOnly) {
      return buildResult({
        input,
        normalizedTranscript,
        strictPrefixApplied,
        decision: "suppressed",
        action: parser.action,
        confidence: parser.confidence,
        source: "parser",
        suppressionReason: "log_only",
      });
    }
    return buildResult({
      input,
      normalizedTranscript,
      strictPrefixApplied,
      decision: "accepted",
      action: parser.action,
      confidence: parser.confidence,
      source: "parser",
    });
  }

  if (!parser.highLikelihood) {
    return buildResult({
      input,
      normalizedTranscript,
      strictPrefixApplied,
      decision: "none",
      source: "parser",
      confidence: parser.confidence,
    });
  }

  const evaluator = await runEvaluator({
    transcript: input.transcript.trim(),
    config,
  });
  if (!evaluator || evaluator.intent !== "command" || evaluator.action === "none") {
    return buildResult({
      input,
      normalizedTranscript,
      strictPrefixApplied,
      decision: "none",
      source: "evaluator",
      confidence: evaluator?.confidence ?? parser.confidence,
    });
  }
  if (evaluator.confidence < config.evaluatorMinConfidence) {
    return buildResult({
      input,
      normalizedTranscript,
      strictPrefixApplied,
      decision: "none",
      source: "evaluator",
      confidence: evaluator.confidence,
    });
  }
  const hasHelixPrefix = hasInlineHelixPrefix(input.transcript);
  if (
    strictPrefixApplied &&
    requiresStrictPrefixForAction(evaluator.action) &&
    !hasHelixPrefix
  ) {
    return buildResult({
      input,
      normalizedTranscript,
      strictPrefixApplied,
      decision: "suppressed",
      action: evaluator.action,
      confidence: evaluator.confidence,
      source: "evaluator",
      suppressionReason: "strict_prefix_required",
    });
  }
  if (config.logOnly) {
    return buildResult({
      input,
      normalizedTranscript,
      strictPrefixApplied,
      decision: "suppressed",
      action: evaluator.action,
      confidence: evaluator.confidence,
      source: "evaluator",
      suppressionReason: "log_only",
    });
  }
  return buildResult({
    input,
    normalizedTranscript,
    strictPrefixApplied,
    decision: "accepted",
    action: evaluator.action,
    confidence: evaluator.confidence,
    source: "evaluator",
  });
};
