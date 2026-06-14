export type HelixAskLanguageContractV1 = {
  schema: "helix.ask_language_contract.v1";
  input_modality: "typed" | "voice";
  source_text: string;
  dominant_language: "en" | "es" | "zh" | "mixed" | "unknown";
  requested_response_language: string | null;
  response_language: string;
  language_detected: string | null;
  language_confidence: number | null;
  code_mixed: boolean;
  explicit_language_instruction: boolean;
  pivot_language: "en" | null;
  pivot_text: string | null;
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
  normalizeLanguageTag: (value: unknown) => string | null;
};

const SPANISH_RESPONSE_RE =
  /\b(?:responde|contesta|respuesta|explica|expl[ií]calo)\s+(?:en\s+)?espa(?:ñ|n)ol\b|\ben\s+espa(?:ñ|n)ol\b/i;
const CHINESE_RESPONSE_RE =
  /(?:请用中文|用中文|中文回答|请以中文|以中文|回答中文|用汉语|以汉语)/u;
const ENGLISH_RESPONSE_RE =
  /\b(?:answer|respond|reply|explain|summari[sz]e)\s+in\s+english\b/i;

const SPANISH_CUE_RE =
  /\b(?:responde|contesta|explica|explicar|busca|buscar|c[oó]digo|repositorio|archivo|archivos|rutas?|fuentes?|evidencia|l[ií]neas?|implementaci[oó]n|cita|citar|s[ií]mbolos?|m[oó]dulos?|contrato|c[oó]mo|d[oó]nde|qu[eé])\b/i;
const CHINESE_CUE_RE =
  /(?:仓库|代码|源码|文件|路径|实现|证据|引用|行号|模块|契约|中文|回答|语言|选择|最终|查找|代码库)/u;
const ENGLISH_CUE_RE =
  /\b(?:explain|find|search|use|using|answer|respond|reply|summari[sz]e|repo|repository|code|source|implementation|evidence|cite|file\s+paths?|line(?:s| numbers)?|logic|language)\b/i;
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

const detectExplicitResponseLanguage = (
  text: string,
  normalizeLanguageTag: (value: unknown) => string | null,
): { language: string | null; reason: string | null } => {
  if (SPANISH_RESPONSE_RE.test(text)) return { language: "es", reason: "explicit_spanish_response_instruction" };
  if (CHINESE_RESPONSE_RE.test(text)) return { language: "zh", reason: "explicit_chinese_response_instruction" };
  if (ENGLISH_RESPONSE_RE.test(text)) return { language: "en", reason: "explicit_english_response_instruction" };
  return { language: normalizeLanguageTag(null), reason: null };
};

export const buildHelixAskLanguageContract = (
  input: BuildLanguageContractInput,
): HelixAskLanguageContractV1 => {
  const sourceText = input.sourceText.trim();
  const responseOverride =
    input.normalizeLanguageTag(input.responseLanguage ?? null) ??
    input.normalizeLanguageTag(input.preferredResponseLanguage ?? null);
  const explicit = detectExplicitResponseLanguage(sourceText, input.normalizeLanguageTag);
  const requestedResponseLanguage = responseOverride ?? explicit.language;
  const normalizedSource = input.normalizeLanguageTag(input.sourceLanguage ?? null);
  const normalizedDetected = input.normalizeLanguageTag(input.languageDetected ?? null);
  const spanishCueCount = countMatches(sourceText, SPANISH_CUE_RE);
  const chineseCueCount = countMatches(sourceText, CHINESE_CUE_RE);
  const englishCueCount = countMatches(sourceText, ENGLISH_CUE_RE);
  const hanCount = Array.from(sourceText).filter((char) => HAN_RE.test(char)).length;
  const latinWordCount = (sourceText.match(LATIN_WORD_RE) ?? []).length;
  const hasEnglish = englishCueCount > 0;
  const hasSpanish = spanishCueCount > 0;
  const hasChinese = chineseCueCount > 0 || hanCount > 0;
  const codeMixed =
    input.codeMixed === true ||
    (hasChinese && latinWordCount > 0) ||
    [hasEnglish, hasSpanish, hasChinese].filter(Boolean).length > 1;
  const reasonCodes: string[] = [];

  if (explicit.reason) reasonCodes.push(explicit.reason);
  if (responseOverride) reasonCodes.push("request_response_language_override");
  if (hasSpanish) reasonCodes.push("spanish_language_cues");
  if (hasChinese) reasonCodes.push("chinese_language_cues");
  if (codeMixed) reasonCodes.push("mixed_prompt");

  let dominant: HelixAskLanguageContractV1["dominant_language"] = "unknown";
  if (codeMixed) {
    dominant = "mixed";
  } else if (normalizedDetected || normalizedSource) {
    const detected = normalizedDetected ?? normalizedSource;
    dominant = detected?.startsWith("es") ? "es" : detected?.startsWith("zh") ? "zh" : detected?.startsWith("en") ? "en" : "unknown";
  } else if (hasChinese) {
    dominant = "zh";
  } else if (hasSpanish) {
    dominant = "es";
  } else if (hasEnglish) {
    dominant = "en";
  }

  const inferredDetected =
    normalizedDetected ??
    normalizedSource ??
    (hasChinese ? "zh" : null) ??
    (hasSpanish ? "es" : null) ??
    (hasEnglish ? "en" : null);

  const inferredConfidence =
    clamp01(input.languageConfidence) ??
    (requestedResponseLanguage || hasSpanish || hasChinese ? 0.82 : inferredDetected ? 0.66 : null);

  const responseLanguage =
    requestedResponseLanguage ??
    (hasChinese && latinWordCount <= 4 ? "zh" : null) ??
    (hasSpanish ? "es" : null) ??
    (normalizedDetected ?? normalizedSource ?? "en");

  return {
    schema: "helix.ask_language_contract.v1",
    input_modality: input.inputModality ?? "typed",
    source_text: sourceText,
    dominant_language: dominant,
    requested_response_language: requestedResponseLanguage,
    response_language: responseLanguage,
    language_detected: inferredDetected,
    language_confidence: inferredConfidence,
    code_mixed: codeMixed,
    explicit_language_instruction: Boolean(explicit.reason || responseOverride),
    pivot_language: input.translated === true ? "en" : null,
    pivot_text: input.translated === true ? input.pivotText?.trim() || null : null,
    translated: input.translated === true,
    reason_codes: reasonCodes.length > 0 ? reasonCodes : ["language_contract_inferred"],
  };
};
