import { z } from "zod";
import { listConceptCandidates, listConceptCards } from "./concepts";
import {
  canonicalTermPreservationRatio,
  detectHelixAskTermHits,
  findCanonicalTermsInText,
  normalizeLanguageTag,
} from "./multilang";

export const HELIX_INTERPRETER_SCHEMA_VERSION = "helix.interpreter.v1" as const;
export type HelixInterpreterSchemaVersion = typeof HELIX_INTERPRETER_SCHEMA_VERSION;

export type HelixAskInterpreterDispatchState = "auto" | "confirm" | "blocked";
export type HelixAskInterpreterStatus =
  | "ok"
  | "timeout"
  | "parse_error"
  | "provider_error"
  | "disabled"
  | "skipped";

export const HelixAskInterpreterPivotCandidateSchema = z.object({
  text: z.string().trim().min(1).max(600),
  confidence: z.number().min(0).max(1),
});

export const HelixAskInterpreterConceptCandidateSchema = z.object({
  concept_id: z.string().trim().min(1).max(160),
  concept_label: z.string().trim().min(1).max(240).optional(),
  confidence: z.number().min(0).max(1),
  source: z.enum(["concept_card", "term_directory"]),
});

export const HelixAskInterpreterTermPreservationSchema = z.object({
  ratio: z.number().min(0).max(1),
  missing_terms: z.array(z.string().trim().min(1).max(120)).max(24),
});

export const HelixAskInterpreterAmbiguitySchema = z.object({
  top2_gap: z.number().min(0).max(1),
  ambiguous: z.boolean(),
});

export const HelixAskInterpreterArtifactSchema = z.object({
  schema_version: z.literal(HELIX_INTERPRETER_SCHEMA_VERSION),
  source_text: z.string().trim().min(1).max(4000),
  source_language: z.string().trim().min(1).max(32),
  code_mixed: z.boolean(),
  pivot_candidates: z.array(HelixAskInterpreterPivotCandidateSchema).min(1).max(5),
  selected_pivot: HelixAskInterpreterPivotCandidateSchema,
  concept_candidates: z.array(HelixAskInterpreterConceptCandidateSchema).max(16),
  term_preservation: HelixAskInterpreterTermPreservationSchema,
  ambiguity: HelixAskInterpreterAmbiguitySchema,
  term_ids: z.array(z.string().trim().min(1).max(120)).max(32),
  concept_ids: z.array(z.string().trim().min(1).max(160)).max(32),
  confirm_prompt: z.string().trim().min(1).max(240).nullable(),
  dispatch_state: z.enum(["auto", "confirm", "blocked"]),
});

export type HelixAskInterpreterArtifact = z.infer<typeof HelixAskInterpreterArtifactSchema>;

type HelixAskInterpreterModelHint = {
  term: string;
  confidence: number;
};

const HelixAskInterpreterModelOutputSchema = z.object({
  pivot_candidates: z.array(HelixAskInterpreterPivotCandidateSchema).min(1).max(5),
  selected_pivot: z.string().trim().min(1).max(600),
  concept_hints: z
    .array(
      z.object({
        term: z.string().trim().min(1).max(200),
        confidence: z.number().min(0).max(1),
      }),
    )
    .max(8)
    .default([]),
});

type HelixAskInterpreterModelOutput = z.infer<typeof HelixAskInterpreterModelOutputSchema>;

export type HelixAskInterpreterConfig = {
  enabled: boolean;
  logOnly: boolean;
  model: string;
  timeoutMs: number;
  nBest: number;
  top2GapMin: number;
  pivotAutoMin: number;
  pivotBlockMin: number;
  apiKey: string | null;
  baseUrl: string;
};

export type HelixAskInterpreterRunInput = {
  sourceText: string;
  sourceLanguage?: string | null;
  codeMixed?: boolean;
  pivotText?: string | null;
  responseLanguage?: string | null;
  config?: Partial<HelixAskInterpreterConfig>;
};

export type HelixAskInterpreterRunResult = {
  status: HelixAskInterpreterStatus;
  artifact: HelixAskInterpreterArtifact | null;
  error: string | null;
  latencyMs: number;
};

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_TIMEOUT_MS = 3500;
const DEFAULT_NBEST = 3;
const DEFAULT_TOP2_GAP_MIN = 0.12;
const DEFAULT_PIVOT_AUTO_MIN = 0.82;
const DEFAULT_PIVOT_BLOCK_MIN = 0.68;
const NON_ENGLISH_SCRIPT_RE =
  /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\u0400-\u052f\u0600-\u06ff\u0590-\u05ff\u0e00-\u0e7f]/u;

const INTERPRETER_OUTPUT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["pivot_candidates", "selected_pivot", "concept_hints"],
  properties: {
    pivot_candidates: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "confidence"],
        properties: {
          text: { type: "string", minLength: 1, maxLength: 600 },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
      },
    },
    selected_pivot: { type: "string", minLength: 1, maxLength: 600 },
    concept_hints: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["term", "confidence"],
        properties: {
          term: { type: "string", minLength: 1, maxLength: 200 },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
      },
    },
  },
} as const;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const clampInt = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, Math.floor(value)));

const readBool = (value: string | undefined, fallback: boolean): boolean => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return fallback;
  if (normalized === "1" || normalized === "true") return true;
  if (normalized === "0" || normalized === "false") return false;
  return fallback;
};

const readNum = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeConceptScore = (score: number | undefined): number => {
  if (typeof score !== "number" || !Number.isFinite(score) || score <= 0) return 0;
  return clamp01(score / 64);
};

const toResponsesEndpoint = (baseUrl: string): string =>
  `${baseUrl.replace(/\/+$/, "")}/responses`;

const resolveFallbackPivot = (sourceText: string, pivotText?: string | null): string => {
  const pivot = typeof pivotText === "string" ? pivotText.trim() : "";
  if (pivot) return pivot.slice(0, 600);
  return sourceText.trim().slice(0, 600);
};

const resolvePromptLanguage = (responseLanguage?: string | null, sourceLanguage?: string | null): string => {
  const normalized =
    normalizeLanguageTag(responseLanguage ?? null) ??
    normalizeLanguageTag(sourceLanguage ?? null) ??
    "en";
  if (normalized.startsWith("zh-hant")) return "zh-hant";
  if (normalized.startsWith("zh")) return "zh-hans";
  if (normalized.startsWith("es")) return "es";
  return "en";
};

const buildConfirmPrompt = (
  responseLanguage: string | null | undefined,
  sourceLanguage: string | null | undefined,
  pivotCandidate: string,
): string => {
  const language = resolvePromptLanguage(responseLanguage, sourceLanguage);
  const candidate = pivotCandidate.trim() || "this concept";
  if (language === "zh-hant") {
    return `你是指「${candidate}」嗎？`;
  }
  if (language === "zh-hans") {
    return `你是指“${candidate}”吗？`;
  }
  if (language === "es") {
    return `¿Te refieres a "${candidate}"?`;
  }
  return `Did you mean "${candidate}"?`;
};

const parseResponsesText = (payload: unknown): string => {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const output = Array.isArray(root.output) ? root.output : [];
  for (const entry of output) {
    const content = Array.isArray((entry as { content?: unknown }).content)
      ? ((entry as { content?: unknown }).content as Array<Record<string, unknown>>)
      : [];
    for (const chunk of content) {
      const textValue = typeof chunk.text === "string" ? chunk.text : null;
      if (textValue && textValue.trim()) return textValue;
      const outputText =
        typeof chunk.output_text === "string" ? chunk.output_text : null;
      if (outputText && outputText.trim()) return outputText;
    }
  }
  const fallback = typeof (root.output_text as unknown) === "string" ? (root.output_text as string) : "";
  return fallback.trim();
};

const dispatchStateFromConfidence = (args: {
  selectedConfidence: number;
  top2Gap: number;
  pivotAutoMin: number;
  pivotBlockMin: number;
  top2GapMin: number;
}): HelixAskInterpreterDispatchState => {
  if (args.selectedConfidence < args.pivotBlockMin) return "confirm";
  if (args.selectedConfidence < args.pivotAutoMin) return "confirm";
  return "auto";
};

const DISPATCH_STATE_RANK: Record<HelixAskInterpreterDispatchState, number> = {
  blocked: 0,
  confirm: 1,
  auto: 2,
};

const dispatchStateWithSemanticAnchors = (args: {
  baseState: HelixAskInterpreterDispatchState;
  selectedConfidence: number;
  top2Gap: number;
  pivotAutoMin: number;
  pivotBlockMin: number;
  top2GapMin: number;
  termHits: Array<{
    matched_in: "source" | "pivot" | "both";
    term_hit_confidence: number;
  }>;
  conceptCandidates: Array<z.infer<typeof HelixAskInterpreterConceptCandidateSchema>>;
}): HelixAskInterpreterDispatchState => {
  if (args.baseState === "auto") return "auto";
  const maxTermConfidence = args.termHits.reduce(
    (best, hit) => Math.max(best, clamp01(hit.term_hit_confidence)),
    0,
  );
  const maxSourceTermConfidence = args.termHits.reduce((best, hit) => {
    if (hit.matched_in === "source" || hit.matched_in === "both") {
      return Math.max(best, clamp01(hit.term_hit_confidence));
    }
    return best;
  }, 0);
  const maxConceptConfidence = args.conceptCandidates.reduce(
    (best, candidate) => Math.max(best, clamp01(candidate.confidence)),
    0,
  );
  const anchorConfidence = Math.max(maxTermConfidence, maxConceptConfidence);
  if (anchorConfidence < 0.82) {
    return args.baseState;
  }

  // Blend model-reported confidence with semantic anchor confidence to reduce
  // false hard blocks on multilingual transliteration/typo variants.
  const blendedConfidence = clamp01(args.selectedConfidence * 0.65 + anchorConfidence * 0.35);
  let candidateState = dispatchStateFromConfidence({
    selectedConfidence: blendedConfidence,
    top2Gap: args.top2Gap,
    pivotAutoMin: args.pivotAutoMin,
    pivotBlockMin: args.pivotBlockMin,
    top2GapMin: args.top2GapMin,
  });

  // Avoid promoting to auto solely from pivot-lane anchors when source evidence
  // is weak; keep confirm in that case.
  if (
    candidateState === "auto" &&
    maxSourceTermConfidence < 0.86 &&
    args.selectedConfidence < args.pivotAutoMin
  ) {
    candidateState = "confirm";
  }

  // Allow blocked -> auto when semantic anchors are very strong even if source
  // alias matching is imperfect (common with transliteration variants).
  if (
    args.baseState === "blocked" &&
    anchorConfidence >= 0.9 &&
    args.selectedConfidence >= args.pivotBlockMin - 0.1 &&
    args.top2Gap >= args.top2GapMin * 0.75
  ) {
    candidateState = "auto";
  }

  // Strong source-lane term evidence can safely lift blocked -> auto.
  if (
    args.baseState === "blocked" &&
    maxSourceTermConfidence >= 0.9 &&
    args.selectedConfidence >= args.pivotBlockMin - 0.12 &&
    args.top2Gap >= args.top2GapMin * 0.75
  ) {
    candidateState = "auto";
  }

  return DISPATCH_STATE_RANK[candidateState] > DISPATCH_STATE_RANK[args.baseState]
    ? candidateState
    : args.baseState;
};

const buildMissingTerms = (sourceText: string, targetText: string): string[] => {
  const canonicalTerms = findCanonicalTermsInText(sourceText);
  return canonicalTerms.filter((term) => !new RegExp(`\\b${escapeRegex(term)}\\b`, "i").test(targetText));
};

const ensurePivotCanonicalAnchors = (
  pivotText: string,
  termHits: Array<{
    category: "eponym" | "framework";
    canonical: string;
    concept_expansions: string[];
  }>,
): string => {
  let next = pivotText.trim();
  if (!next) return next;
  for (const hit of termHits) {
    if (hit.category !== "eponym") continue;
    const canonical = hit.canonical.trim();
    if (!canonical) continue;
    if (new RegExp(`\\b${escapeRegex(canonical)}\\b`, "i").test(next)) continue;
    const warpExpansion = hit.concept_expansions.find((entry) => /\bwarp\s+bubble\b/i.test(entry));
    const suffix = warpExpansion ? `${canonical} ${warpExpansion}` : canonical;
    next = `${next} (${suffix})`.slice(0, 600).trim();
  }
  return next;
};

const sanitizePivotCandidates = (
  candidates: Array<{ text: string; confidence: number }>,
  fallbackPivot: string,
): Array<{ text: string; confidence: number }> => {
  const seen = new Set<string>();
  const out: Array<{ text: string; confidence: number }> = [];
  for (const candidate of candidates) {
    const text = candidate.text.trim().slice(0, 600);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      text,
      confidence: clamp01(candidate.confidence),
    });
  }
  if (!out.length) {
    out.push({
      text: fallbackPivot,
      confidence: 0.5,
    });
  }
  out.sort((a, b) => b.confidence - a.confidence);
  return out;
};

const selectPivotCandidate = (
  candidates: Array<{ text: string; confidence: number }>,
  selectedText: string,
): { text: string; confidence: number } => {
  const normalizedSelected = selectedText.trim().toLowerCase();
  if (!normalizedSelected) return candidates[0];
  const exact = candidates.find((entry) => entry.text.toLowerCase() === normalizedSelected);
  if (exact) return exact;
  const includes = candidates.find((entry) => entry.text.toLowerCase().includes(normalizedSelected));
  return includes ?? candidates[0];
};

const runInterpreterModel = async (args: {
  sourceText: string;
  sourceLanguage: string;
  codeMixed: boolean;
  fallbackPivot: string;
  config: HelixAskInterpreterConfig;
}): Promise<HelixAskInterpreterModelOutput> => {
  if (!args.config.apiKey) {
    throw new Error("interpreter_api_key_missing");
  }
  const endpoint = toResponsesEndpoint(args.config.baseUrl);
  const canonicalTerms = findCanonicalTermsInText(args.sourceText).slice(0, 8);
  const body = {
    model: args.config.model,
    input: [
      {
        role: "system",
        content:
          "You are a multilingual query interpreter. Return strict JSON only that matches the provided JSON schema. Do not add prose.",
      },
      {
        role: "user",
        content: [
          "Task:",
          "- Interpret the source question and produce English pivot candidates for retrieval.",
          "- Preserve canonical terms and scientist names exactly when possible.",
          "- Avoid semantic drift from homophones/typos.",
          "",
          `Source language: ${args.sourceLanguage}`,
          `Code mixed: ${args.codeMixed ? "true" : "false"}`,
          `Canonical terms to preserve: ${canonicalTerms.join(", ") || "none"}`,
          `Fallback pivot: ${args.fallbackPivot}`,
          "",
          "Source text:",
          args.sourceText,
        ].join("\n"),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "helix_interpreter",
        schema: INTERPRETER_OUTPUT_JSON_SCHEMA,
        strict: true,
      },
    },
    max_output_tokens: 420,
  };

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), args.config.timeoutMs);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${args.config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: abortController.signal,
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(`interpreter_http_${response.status}:${message || response.statusText}`);
    }
    const payload = await response.json();
    const rawText = parseResponsesText(payload);
    if (!rawText) {
      throw new Error("interpreter_empty_output");
    }
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      throw new Error("interpreter_json_parse_failed");
    }
    const parsed = HelixAskInterpreterModelOutputSchema.safeParse(parsedJson);
    if (!parsed.success) {
      throw new Error("interpreter_schema_parse_failed");
    }
    return parsed.data;
  } finally {
    clearTimeout(timeoutId);
  }
};

const buildConceptCandidates = (args: {
  sourceText: string;
  selectedPivot: string;
  conceptHints: HelixAskInterpreterModelHint[];
}): Array<z.infer<typeof HelixAskInterpreterConceptCandidateSchema>> => {
  const conceptMap = new Map<
    string,
    {
      concept_id: string;
      concept_label?: string;
      confidence: number;
      source: "concept_card" | "term_directory";
    }
  >();
  const cardsById = new Map(listConceptCards().map((card) => [card.id, card]));

  const upsert = (
    conceptId: string,
    conceptLabel: string | undefined,
    confidence: number,
    source: "concept_card" | "term_directory",
  ) => {
    const clamped = clamp01(confidence);
    if (!conceptId || clamped <= 0) return;
    const existing = conceptMap.get(conceptId);
    if (!existing || clamped > existing.confidence) {
      conceptMap.set(conceptId, {
        concept_id: conceptId,
        concept_label: conceptLabel?.trim() || undefined,
        confidence: clamped,
        source,
      });
    }
  };

  const pushFromConceptTerm = (term: string, confidence: number) => {
    const candidate = listConceptCandidates(term, 1)[0];
    if (!candidate) return false;
    upsert(
      candidate.card.id,
      candidate.card.label ?? candidate.card.id,
      Math.max(clamp01(confidence), normalizeConceptScore(candidate.score)),
      "concept_card",
    );
    return true;
  };

  for (const hint of args.conceptHints) {
    pushFromConceptTerm(hint.term, hint.confidence);
  }

  const termDetection = detectHelixAskTermHits({
    sourceText: args.sourceText,
    pivotText: args.selectedPivot,
  });
  for (const hit of termDetection.term_hits) {
    let linked = false;
    const expansionTerms = [hit.canonical, ...hit.concept_expansions];
    for (const term of expansionTerms) {
      if (!term.trim()) continue;
      if (pushFromConceptTerm(term, hit.term_hit_confidence * 0.92)) {
        linked = true;
      }
    }
    if (!linked) {
      const anchorId = `term.${hit.term_id}`;
      upsert(anchorId, hit.canonical, hit.term_hit_confidence, "term_directory");
    }
  }

  for (const candidate of conceptMap.values()) {
    if (candidate.source !== "concept_card") continue;
    const card = cardsById.get(candidate.concept_id);
    if (!card?.label) continue;
    candidate.concept_label = card.label;
  }

  return Array.from(conceptMap.values())
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 16);
};

const buildFallbackArtifact = (args: {
  sourceText: string;
  sourceLanguage: string;
  codeMixed: boolean;
  fallbackPivot: string;
  responseLanguage?: string | null;
  dispatchState: HelixAskInterpreterDispatchState;
  errorPrompt?: string | null;
}): HelixAskInterpreterArtifact => {
  const pivotText = args.fallbackPivot.trim() || args.sourceText.trim();
  const ratio = canonicalTermPreservationRatio(args.sourceText, pivotText);
  const missingTerms = buildMissingTerms(args.sourceText, pivotText);
  const confirmPrompt =
    args.dispatchState === "auto"
      ? null
      : (args.errorPrompt?.trim() ||
        buildConfirmPrompt(args.responseLanguage, args.sourceLanguage, pivotText));
  return {
    schema_version: HELIX_INTERPRETER_SCHEMA_VERSION,
    source_text: args.sourceText,
    source_language: args.sourceLanguage,
    code_mixed: args.codeMixed,
    pivot_candidates: [{ text: pivotText, confidence: args.dispatchState === "blocked" ? 0.45 : 0.72 }],
    selected_pivot: { text: pivotText, confidence: args.dispatchState === "blocked" ? 0.45 : 0.72 },
    concept_candidates: [],
    term_preservation: {
      ratio: Number(ratio.toFixed(4)),
      missing_terms: missingTerms.slice(0, 24),
    },
    ambiguity: {
      top2_gap: 0,
      ambiguous: args.dispatchState !== "auto",
    },
    term_ids: [],
    concept_ids: [],
    confirm_prompt: confirmPrompt,
    dispatch_state: args.dispatchState,
  };
};

export const readHelixAskInterpreterConfigFromEnv = (): HelixAskInterpreterConfig => {
  const apiKeyRaw =
    process.env.HELIX_ASK_INTERPRETER_API_KEY ??
    process.env.OPENAI_API_KEY ??
    "";
  return {
    enabled: readBool(process.env.HELIX_ASK_INTERPRETER_ENABLED, false),
    logOnly: readBool(process.env.HELIX_ASK_INTERPRETER_LOG_ONLY, true),
    model: (process.env.HELIX_ASK_INTERPRETER_MODEL ?? DEFAULT_MODEL).trim() || DEFAULT_MODEL,
    timeoutMs: clampInt(readNum(process.env.HELIX_ASK_INTERPRETER_TIMEOUT_MS, DEFAULT_TIMEOUT_MS), 800, 12000),
    nBest: clampInt(readNum(process.env.HELIX_ASK_INTERPRETER_NBEST, DEFAULT_NBEST), 1, 5),
    top2GapMin: clamp01(readNum(process.env.HELIX_ASK_INTERPRETER_TOP2_GAP_MIN, DEFAULT_TOP2_GAP_MIN)),
    pivotAutoMin: clamp01(readNum(process.env.HELIX_ASK_INTERPRETER_PIVOT_AUTO_MIN, DEFAULT_PIVOT_AUTO_MIN)),
    pivotBlockMin: clamp01(readNum(process.env.HELIX_ASK_INTERPRETER_PIVOT_BLOCK_MIN, DEFAULT_PIVOT_BLOCK_MIN)),
    apiKey: apiKeyRaw.trim() ? apiKeyRaw.trim() : null,
    baseUrl: (process.env.HELIX_ASK_INTERPRETER_BASE_URL ?? "https://api.openai.com/v1").trim(),
  };
};

export const shouldRunHelixAskInterpreter = (args: {
  sourceLanguage?: string | null;
  codeMixed?: boolean;
  sourceText?: string | null;
}): boolean => {
  if (args.codeMixed === true) return true;
  const sourceLanguage = normalizeLanguageTag(args.sourceLanguage ?? null) ?? null;
  if (sourceLanguage && sourceLanguage !== "en" && !sourceLanguage.startsWith("en-")) {
    return true;
  }
  const sourceText = String(args.sourceText ?? "").trim();
  if (sourceText && NON_ENGLISH_SCRIPT_RE.test(sourceText)) {
    return true;
  }
  return false;
};

export const runHelixAskInterpreter = async (
  input: HelixAskInterpreterRunInput,
): Promise<HelixAskInterpreterRunResult> => {
  const startedAt = Date.now();
  const sourceText = input.sourceText.trim();
  const sourceLanguage =
    normalizeLanguageTag(input.sourceLanguage ?? null) ?? "unknown";
  const fallbackPivot = resolveFallbackPivot(sourceText, input.pivotText);
  const codeMixed = input.codeMixed === true;
  const config = {
    ...readHelixAskInterpreterConfigFromEnv(),
    ...(input.config ?? {}),
  };
  const finalize = (payload: Omit<HelixAskInterpreterRunResult, "latencyMs">): HelixAskInterpreterRunResult => ({
    ...payload,
    latencyMs: Math.max(0, Date.now() - startedAt),
  });

  if (!sourceText) {
    return finalize({
      status: "skipped",
      artifact: null,
      error: null,
    });
  }

  if (!config.enabled && !config.logOnly) {
    return finalize({
      status: "disabled",
      artifact: null,
      error: null,
    });
  }

  if (!shouldRunHelixAskInterpreter({ sourceLanguage, codeMixed, sourceText })) {
    return finalize({
      status: "skipped",
      artifact: null,
      error: null,
    });
  }

  if (!config.apiKey) {
    return finalize({
      status: "provider_error",
      artifact: buildFallbackArtifact({
        sourceText,
        sourceLanguage,
        codeMixed,
        fallbackPivot,
        responseLanguage: input.responseLanguage,
        dispatchState: "confirm",
        errorPrompt: buildConfirmPrompt(input.responseLanguage, sourceLanguage, fallbackPivot),
      }),
      error: "interpreter_api_key_missing",
    });
  }

  try {
    const modelOutput = await runInterpreterModel({
      sourceText,
      sourceLanguage,
      codeMixed,
      fallbackPivot,
      config,
    });
    const sanitizedCandidates = sanitizePivotCandidates(
      modelOutput.pivot_candidates.slice(0, config.nBest),
      fallbackPivot,
    );
    let selectedPivot = selectPivotCandidate(sanitizedCandidates, modelOutput.selected_pivot);
    const top2Gap =
      sanitizedCandidates.length >= 2
        ? clamp01(sanitizedCandidates[0].confidence - sanitizedCandidates[1].confidence)
        : 1;
    const conceptCandidates = buildConceptCandidates({
      sourceText,
      selectedPivot: selectedPivot.text,
      conceptHints: modelOutput.concept_hints,
    });
    const termDetection = detectHelixAskTermHits({
      sourceText,
      pivotText: selectedPivot.text,
    });
    const anchoredPivotText = ensurePivotCanonicalAnchors(selectedPivot.text, termDetection.term_hits);
    if (anchoredPivotText && anchoredPivotText !== selectedPivot.text) {
      selectedPivot = { ...selectedPivot, text: anchoredPivotText };
      const replacementIndex = sanitizedCandidates.findIndex(
        (entry) => entry.text.toLowerCase() === modelOutput.selected_pivot.trim().toLowerCase(),
      );
      if (replacementIndex >= 0) {
        sanitizedCandidates[replacementIndex] = { ...sanitizedCandidates[replacementIndex], text: anchoredPivotText };
      } else {
        sanitizedCandidates.unshift({ text: anchoredPivotText, confidence: selectedPivot.confidence });
      }
    }
    const baseDispatchState = dispatchStateFromConfidence({
      selectedConfidence: selectedPivot.confidence,
      top2Gap,
      pivotAutoMin: config.pivotAutoMin,
      pivotBlockMin: config.pivotBlockMin,
      top2GapMin: config.top2GapMin,
    });
    const dispatchState = dispatchStateWithSemanticAnchors({
      baseState: baseDispatchState,
      selectedConfidence: selectedPivot.confidence,
      top2Gap,
      pivotAutoMin: config.pivotAutoMin,
      pivotBlockMin: config.pivotBlockMin,
      top2GapMin: config.top2GapMin,
      termHits: termDetection.term_hits,
      conceptCandidates,
    });
    const missingTerms = buildMissingTerms(sourceText, selectedPivot.text);
    const artifact: HelixAskInterpreterArtifact = {
      schema_version: HELIX_INTERPRETER_SCHEMA_VERSION,
      source_text: sourceText,
      source_language: sourceLanguage,
      code_mixed: codeMixed,
      pivot_candidates: sanitizedCandidates,
      selected_pivot: selectedPivot,
      concept_candidates: conceptCandidates,
      term_preservation: {
        ratio: Number(canonicalTermPreservationRatio(sourceText, selectedPivot.text).toFixed(4)),
        missing_terms: missingTerms.slice(0, 24),
      },
      ambiguity: {
        top2_gap: Number(top2Gap.toFixed(4)),
        ambiguous: top2Gap < config.top2GapMin,
      },
      term_ids: termDetection.term_hits.map((entry) => entry.term_id).slice(0, 32),
      concept_ids: conceptCandidates.map((entry) => entry.concept_id).slice(0, 32),
      confirm_prompt:
        dispatchState === "auto"
          ? null
          : buildConfirmPrompt(input.responseLanguage, sourceLanguage, selectedPivot.text),
      dispatch_state: dispatchState,
    };
    return finalize({
      status: "ok",
      artifact,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status: HelixAskInterpreterStatus =
      /abort|timeout/i.test(message) ? "timeout" : /parse|schema/i.test(message) ? "parse_error" : "provider_error";
    return finalize({
      status,
      artifact: buildFallbackArtifact({
        sourceText,
        sourceLanguage,
        codeMixed,
        fallbackPivot,
        responseLanguage: input.responseLanguage,
        dispatchState: "confirm",
      }),
      error: message.slice(0, 200),
    });
  }
};
