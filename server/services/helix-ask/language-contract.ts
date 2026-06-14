export type HelixAskResponseLanguage = "en" | "es" | "zh";

export type HelixAskLanguageContractV1 = {
  schema: "helix.ask_language_contract.v1";
  input_modality: "typed" | "voice";
  source_text: string;
  source_language: HelixAskResponseLanguage | "mixed" | "unknown";
  dominant_language: HelixAskResponseLanguage | "mixed" | "unknown";
  requested_response_language: HelixAskResponseLanguage | null;
  explicit_response_language: HelixAskResponseLanguage | null;
  response_language: HelixAskResponseLanguage;
  language_detected: HelixAskResponseLanguage | "mixed" | "unknown";
  language_confidence: number | null;
  code_mixed: boolean;
  explicit_language_instruction: boolean;
  pivot_language: "en" | null;
  pivot_text: string | null;
  pivot_confidence: number | null;
  translated: boolean;
  reason_codes: string[];
};

type BuildLanguageContractInput = {
  inputModality?: "typed" | "voice";
  sourceText: string;
  pivotText?: string | null;
  sourceLanguage?: string | null;
  languageDetected?: string | null;
  languageConfidence?: number | null;
  responseLanguage?: string | null;
  preferredResponseLanguage?: string | null;
  codeMixed?: boolean | null;
  translated?: boolean | null;
  pivotConfidence?: number | null;
  normalizeLanguageTag: (value: unknown) => string | null;
};

const SPANISH_RESPONSE_RE =
  /\b(?:responde|contesta|respuesta|explica|expl[i\u00ed]calo)\s+(?:en\s+)?espa(?:\u00f1|n)ol\b|\ben\s+espa(?:\u00f1|n)ol\b/i;
const CHINESE_RESPONSE_RE =
  /(?:\u8bf7\u7528\u4e2d\u6587|\u7528\u4e2d\u6587|\u4e2d\u6587\u56de\u7b54|\u8bf7\u4ee5\u4e2d\u6587|\u4ee5\u4e2d\u6587|\u56de\u7b54.*\u4e2d\u6587|\u7528\u6c49\u8bed|\u4ee5\u6c49\u8bed)/u;
const ENGLISH_RESPONSE_RE =
  /\b(?:answer|respond|reply|explain|summari[sz]e)\s+in\s+english\b/i;

const SPANISH_CUE_RE =
  /\b(?:responde|contesta|explica|explicar|busca|buscar|c[o\u00f3]digo|repositorio|archivo|archivos|rutas?|fuentes?|evidencia|l[i\u00ed]neas?|implementaci[o\u00f3]n|cita|citar|s[i\u00ed]mbolos?|m[o\u00f3]dulos?|contrato|idioma|lenguaje|depuraci[o\u00f3]n|c[o\u00f3]mo|d[o\u00f3]nde|qu[e\u00e9])\b/i;
const CHINESE_CUE_RE =
  /(?:\u4ed3\u5e93|\u4ee3\u7801|\u6e90\u7801|\u6587\u4ef6|\u8def\u5f84|\u5b9e\u73b0|\u8bc1\u636e|\u5f15\u7528|\u884c\u53f7|\u6a21\u5757|\u5951\u7ea6|\u4e2d\u6587|\u56de\u7b54|\u8bed\u8a00|\u9009\u62e9|\u6700\u7ec8|\u67e5\u627e|\u4ee3\u7801\u4ed3\u5e93|\u6700\u7ec8\u56de\u7b54\u8bed\u8a00)/u;
const ENGLISH_CUE_RE =
  /\b(?:explain|find|search|use|using|answer|respond|reply|summari[sz]e|repo|repository|code|source|implementation|evidence|cite|file\s+paths?|line(?:s| numbers)?|logic|language|debug|export|final answer)\b/i;
const HAN_RE = /[\u3400-\u9fff]/u;
const LATIN_WORD_RE = /\b[A-Za-z][A-Za-z0-9_-]*\b/g;

const clamp01 = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.min(1, Math.max(0, value));
};

const countMatches = (text: string, pattern: RegExp): number => {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  return Array.from(text.matchAll(new RegExp(pattern.source, flags))).length;
};

const normalizeContractLanguage = (
  value: unknown,
  normalizeLanguageTag: (value: unknown) => string | null,
): HelixAskResponseLanguage | null => {
  const normalized = normalizeLanguageTag(value);
  if (!normalized) return null;
  if (normalized === "en" || normalized.startsWith("en-")) return "en";
  if (normalized === "es" || normalized.startsWith("es-")) return "es";
  if (normalized === "zh" || normalized.startsWith("zh-")) return "zh";
  return null;
};

const detectExplicitResponseLanguage = (
  text: string,
  normalizeLanguageTag: (value: unknown) => string | null,
): { language: HelixAskResponseLanguage | null; reason: string | null } => {
  if (SPANISH_RESPONSE_RE.test(text)) {
    return { language: "es", reason: "explicit_spanish_response_instruction" };
  }
  if (CHINESE_RESPONSE_RE.test(text)) {
    return { language: "zh", reason: "explicit_chinese_response_instruction" };
  }
  if (ENGLISH_RESPONSE_RE.test(text)) {
    return { language: "en", reason: "explicit_english_response_instruction" };
  }
  return { language: normalizeContractLanguage(null, normalizeLanguageTag), reason: null };
};

export const buildHelixAskLanguageContract = (
  input: BuildLanguageContractInput,
): HelixAskLanguageContractV1 => {
  const sourceText = input.sourceText.trim();
  const responseOverride =
    normalizeContractLanguage(input.responseLanguage ?? null, input.normalizeLanguageTag) ??
    normalizeContractLanguage(input.preferredResponseLanguage ?? null, input.normalizeLanguageTag);
  const explicit = detectExplicitResponseLanguage(sourceText, input.normalizeLanguageTag);
  const requestedResponseLanguage = responseOverride ?? explicit.language;
  const normalizedSource = normalizeContractLanguage(input.sourceLanguage ?? null, input.normalizeLanguageTag);
  const normalizedDetected = normalizeContractLanguage(input.languageDetected ?? null, input.normalizeLanguageTag);
  const spanishCueCount = countMatches(sourceText, SPANISH_CUE_RE);
  const chineseCueCount = countMatches(sourceText, CHINESE_CUE_RE);
  const englishCueCount = countMatches(sourceText, ENGLISH_CUE_RE);
  const hanCount = Array.from(sourceText).filter((char) => HAN_RE.test(char)).length;
  const latinWordCount = (sourceText.match(LATIN_WORD_RE) ?? []).length;
  const hasEnglish = englishCueCount > 0;
  const hasSpanish = spanishCueCount > 0;
  const hasChinese = chineseCueCount > 0 || hanCount > 0;
  const languageFamilies = [hasEnglish, hasSpanish, hasChinese].filter(Boolean).length;
  const codeMixed =
    input.codeMixed === true ||
    (hasChinese && latinWordCount > 0) ||
    languageFamilies > 1;
  const reasonCodes: string[] = [];

  if (explicit.reason) reasonCodes.push(explicit.reason);
  if (responseOverride) reasonCodes.push("request_response_language_override");
  if (hasSpanish) reasonCodes.push("spanish_language_cues");
  if (hasChinese) reasonCodes.push("chinese_language_cues");
  if (hasEnglish) reasonCodes.push("english_language_cues");
  if (codeMixed) reasonCodes.push("mixed_prompt");

  let detected: HelixAskLanguageContractV1["language_detected"] =
    normalizedDetected ?? normalizedSource ?? "unknown";
  if (detected === "unknown") {
    detected = hasChinese && hasEnglish ? "mixed" : hasChinese ? "zh" : hasSpanish && hasEnglish ? "mixed" : hasSpanish ? "es" : hasEnglish ? "en" : "unknown";
  }

  const dominant: HelixAskLanguageContractV1["dominant_language"] =
    codeMixed ? "mixed" : detected;

  const inferredConfidence =
    clamp01(input.languageConfidence) ??
    (requestedResponseLanguage || hasSpanish || hasChinese ? 0.82 : detected !== "unknown" ? 0.66 : null);

  const responseLanguage =
    requestedResponseLanguage ??
    (detected === "zh" ? "zh" : null) ??
    (detected === "es" ? "es" : null) ??
    (hasChinese && latinWordCount <= 4 ? "zh" : null) ??
    (hasSpanish ? "es" : null) ??
    "en";

  return {
    schema: "helix.ask_language_contract.v1",
    input_modality: input.inputModality ?? "typed",
    source_text: sourceText,
    source_language: dominant,
    dominant_language: dominant,
    requested_response_language: requestedResponseLanguage,
    explicit_response_language: explicit.language ?? responseOverride ?? null,
    response_language: responseLanguage,
    language_detected: detected,
    language_confidence: inferredConfidence,
    code_mixed: codeMixed,
    explicit_language_instruction: Boolean(explicit.reason || responseOverride),
    pivot_language: input.translated === true ? "en" : null,
    pivot_text: input.translated === true ? input.pivotText?.trim() || null : null,
    pivot_confidence: clamp01(input.pivotConfidence),
    translated: input.translated === true,
    reason_codes: reasonCodes.length > 0 ? reasonCodes : ["language_contract_inferred"],
  };
};
