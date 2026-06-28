import type { HelixAskLanguageContractV1 } from "./language-contract";
import { normalizeLanguageTag } from "./multilang";
import {
  readStagePlayMailWakeRouteMetadataFromRequest,
  type StagePlayMailWakeRouteMetadata,
} from "./live-source/stage-play-mail-wake-route-metadata";

export type HelixAskRequestMetadata = {
  seed: number | null;
  episode: string | null;
  replay: {
    index: number | null;
    isReplay: boolean;
  };
  turn_id: string | null;
  trace_id: string | null;
  session_id: string | null;
  source_language?: string | null;
  language_detected?: string | null;
  language_confidence?: number | null;
  code_mixed?: boolean | null;
  pivot_confidence?: number | null;
  translated?: boolean | null;
  response_language?: string | null;
  preferred_response_language?: string | null;
  lang_schema_version?: string | null;
  route_metadata?: StagePlayMailWakeRouteMetadata | null;
  language_contract?: HelixAskLanguageContractV1 | null;
};

export type HelixAskRequestMetadataInput = {
  seed?: unknown;
  traceId?: unknown;
  turnId?: unknown;
  sessionId?: unknown;
  sourceLanguage?: string | null;
  languageDetected?: string | null;
  languageConfidence?: unknown;
  codeMixed?: unknown;
  pivotConfidence?: unknown;
  translated?: unknown;
  responseLanguage?: string | null;
  preferredResponseLanguage?: string | null;
  lang_schema_version?: unknown;
  language_contract?: unknown;
  route_metadata?: unknown;
  routeMetadata?: unknown;
  source_target_intent?: unknown;
};

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const deriveHelixAskReplayIndex = (traceId: string | null): number | null => {
  if (!traceId) return null;
  const match = traceId.match(/(?:^|[-_:])r(\d+)(?:$|[-_:])/i);
  if (!match) return null;
  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) && value >= 0 ? value : null;
};

export const buildHelixAskRequestMetadata = (
  request: HelixAskRequestMetadataInput,
): HelixAskRequestMetadata => {
  const traceId = typeof request.traceId === "string" && request.traceId.trim() ? request.traceId.trim() : null;
  const turnId = typeof request.turnId === "string" && request.turnId.trim() ? request.turnId.trim() : traceId;
  const replayIndex = deriveHelixAskReplayIndex(traceId);
  const requestLanguageContract =
    request.language_contract &&
    typeof request.language_contract === "object" &&
    !Array.isArray(request.language_contract)
      ? (request.language_contract as HelixAskLanguageContractV1)
      : null;
  const contractSourceLanguage =
    requestLanguageContract?.source_language &&
    requestLanguageContract.source_language !== "mixed" &&
    requestLanguageContract.source_language !== "unknown"
      ? requestLanguageContract.source_language
      : null;
  const contractDetectedLanguage =
    requestLanguageContract?.language_detected &&
    requestLanguageContract.language_detected !== "mixed" &&
    requestLanguageContract.language_detected !== "unknown"
      ? requestLanguageContract.language_detected
      : null;
  const sourceLanguage = normalizeLanguageTag(request.sourceLanguage ?? null) ?? contractSourceLanguage;
  const languageDetected =
    normalizeLanguageTag(request.languageDetected ?? null) ??
    contractDetectedLanguage ??
    sourceLanguage;
  const responseLanguageOverride = normalizeLanguageTag(request.responseLanguage ?? null);
  const preferredResponseLanguage = normalizeLanguageTag(request.preferredResponseLanguage ?? null);
  const responseLanguage =
    responseLanguageOverride ??
    preferredResponseLanguage ??
    normalizeLanguageTag(requestLanguageContract?.response_language ?? null) ??
    languageDetected ??
    sourceLanguage;
  return {
    seed: Number.isInteger(request.seed) ? Number(request.seed) : null,
    episode: traceId,
    replay: {
      index: replayIndex,
      isReplay: Boolean(replayIndex && replayIndex > 1),
    },
    turn_id: turnId,
    trace_id: traceId,
    session_id: typeof request.sessionId === "string" && request.sessionId.trim() ? request.sessionId.trim() : null,
    source_language: sourceLanguage,
    language_detected: languageDetected ?? null,
    language_confidence:
      typeof request.languageConfidence === "number" && Number.isFinite(request.languageConfidence)
        ? clampNumber(request.languageConfidence, 0, 1)
        : typeof requestLanguageContract?.language_confidence === "number"
          ? clampNumber(requestLanguageContract.language_confidence, 0, 1)
          : null,
    code_mixed:
      typeof request.codeMixed === "boolean"
        ? request.codeMixed
        : typeof requestLanguageContract?.code_mixed === "boolean"
          ? requestLanguageContract.code_mixed
          : null,
    pivot_confidence:
      typeof request.pivotConfidence === "number" && Number.isFinite(request.pivotConfidence)
        ? clampNumber(request.pivotConfidence, 0, 1)
        : typeof requestLanguageContract?.pivot_confidence === "number"
          ? clampNumber(requestLanguageContract.pivot_confidence, 0, 1)
          : null,
    translated:
      typeof request.translated === "boolean"
        ? request.translated
        : typeof requestLanguageContract?.translated === "boolean"
          ? requestLanguageContract.translated
          : null,
    response_language: responseLanguage ?? null,
    preferred_response_language: preferredResponseLanguage ?? null,
    lang_schema_version:
      typeof request.lang_schema_version === "string" && request.lang_schema_version.trim()
        ? request.lang_schema_version.trim()
        : null,
    route_metadata: readStagePlayMailWakeRouteMetadataFromRequest(request as Record<string, unknown>),
    language_contract: requestLanguageContract,
  };
};
