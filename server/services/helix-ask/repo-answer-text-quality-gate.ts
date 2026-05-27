export type HelixRepoAnswerTextQualityGate = {
  schema: "helix.repo_answer_text_quality_gate.v1";
  turn_id: string;
  answer_ref: string;
  ok: boolean;
  violations: Array<
    | "missing_model_synthesis"
    | "empty_answer"
    | "excerpt_like_answer"
    | "file_list_only"
    | "canned_fallback_text"
    | "renderer_hostile_text"
    | "missing_support_refs"
    | "unsupported_repo_claim"
  >;
  repair_allowed: boolean;
  terminal_allowed: boolean;
  assistant_answer: false;
  raw_content_included: false;
};

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const hasRendererHostileText = (text: string): boolean =>
  /[\u200B-\u200D\uFEFF]/u.test(text) ||
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(text) ||
  /[\u{1D400}-\u{1D7FF}]/u.test(text);

const isCannedFallbackText = (text: string): boolean =>
  /^\s*I found current repo evidence\b/i.test(text) ||
  /\n\s*Key evidence:\s*\n/i.test(text) ||
  /\brepo_code_evidence_unavailable\b/i.test(text);

const isMissingRepoEvidenceRefusalText = (text: string): boolean =>
  /\b(?:could not|couldn't|cannot|can't)\s+(?:answer|provide|complete)\b[\s\S]{0,220}\b(?:no|without|missing)\s+(?:current-turn\s+)?(?:repo|repository|code)\s+evidence/i.test(text) ||
  /\bno\s+(?:current-turn\s+)?(?:repo|repository|code)\s+evidence\s+observations?\s+(?:proved|were|are|exist|found|provided)/i.test(text);

const countPathLikeLines = (text: string): number =>
  text
    .split(/\r?\n/)
    .filter((line) =>
      /^\s*[-*]?\s*(?:client|server|shared|docs|scripts|tools|packages|src)\//i.test(line) ||
      /\b(?:client|server|shared|docs|scripts|tools|packages|src)\/[^\s:]+:\d+\b/i.test(line),
    ).length;

const isExcerptLikeAnswer = (text: string): boolean => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const pathLines = countPathLikeLines(text);
  if (pathLines >= 2 && pathLines >= Math.max(1, Math.floor(lines.length * 0.45))) return true;
  if (/\b(?:export|const|function|type|interface|class)\s+\w+[\s\S]{0,80}\{/.test(text) && pathLines > 0) return true;
  return false;
};

const isFileListOnly = (text: string): boolean => {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return false;
  return lines.every((line) => /^[-*]?\s*(?:client|server|shared|docs|scripts|tools|packages|src)\//i.test(line));
};

const collectSupportRefs = (payload: RecordLike): string[] => {
  const answer = readRecord(payload.repo_code_evidence_answer);
  const directRefs = readArray(answer?.support_refs).map(readString).filter(Boolean);
  const draft = readRecord(payload.final_answer_draft);
  const draftRefs = readArray(draft?.artifact_refs).map(readString).filter((ref) => /repo|server|client|shared|docs|artifact/i.test(ref));
  const ledgerRefs = readArray(payload.current_turn_artifact_ledger).flatMap((entry) => {
    const artifact = readRecord(entry);
    const artifactPayload = readRecord(artifact?.payload);
    const searchable = [readString(artifact?.kind), readString(artifactPayload?.schema)].join(" ");
    if (!/repo_code_evidence_observation/i.test(searchable)) return [];
    return [
      ...readArray(artifactPayload?.evidence_refs).map(readString),
      ...readArray(artifactPayload?.spans)
        .map(readRecord)
        .map((span) => readString(span?.ref) || readString(span?.path))
    ].filter(Boolean);
  });
  return unique([...directRefs, ...draftRefs, ...ledgerRefs]).slice(0, 12);
};

const hasModelSynthesis = (payload: RecordLike): boolean => {
  const answer = readRecord(payload.repo_code_evidence_answer);
  if (answer?.model_authored === true && readString(answer.synthesis_attempt_ref)) return true;
  const draft = readRecord(payload.final_answer_draft);
  return readString(draft?.authority) === "llm_post_observation_composer";
};

export function evaluateRepoAnswerTextQualityGate(input: {
  turnId: string;
  answerRef?: string | null;
  answerText: string;
  payload: RecordLike;
}): HelixRepoAnswerTextQualityGate {
  const text = String(input.answerText ?? "").trim();
  const violations: HelixRepoAnswerTextQualityGate["violations"] = [];
  if (!hasModelSynthesis(input.payload)) violations.push("missing_model_synthesis");
  if (!text) violations.push("empty_answer");
  if (isCannedFallbackText(text)) violations.push("canned_fallback_text");
  if (isMissingRepoEvidenceRefusalText(text)) violations.push("unsupported_repo_claim");
  if (isExcerptLikeAnswer(text)) violations.push("excerpt_like_answer");
  if (isFileListOnly(text)) violations.push("file_list_only");
  if (hasRendererHostileText(text)) violations.push("renderer_hostile_text");
  if (collectSupportRefs(input.payload).length === 0) violations.push("missing_support_refs");
  const uniqueViolations = unique(violations);
  return {
    schema: "helix.repo_answer_text_quality_gate.v1",
    turn_id: input.turnId,
    answer_ref: input.answerRef || "repo_code_evidence_answer:candidate",
    ok: uniqueViolations.length === 0,
    violations: uniqueViolations,
    repair_allowed: uniqueViolations.length > 0,
    terminal_allowed: uniqueViolations.length === 0,
    assistant_answer: false,
    raw_content_included: false,
  };
}
