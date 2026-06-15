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
    | "wrong_model_step_identity"
    | "policy_claim_inversion"
    | "missing_repo_relevance_gate"
    | "weak_repo_evidence"
    | "exact_evidence_not_selected"
    | "codebase_anchor_ignored"
    | "alias_not_normalized"
    | "exact_section_evidence_missing"
    | "missing_exact_section_terms"
    | "unsupported_exact_section_terms"
    | "shallow_broad_concept_answer"
    | "missing_broad_concept_coverage"
    | "insufficient_evidence_role_coverage"
    | "response_language_contract_violated"
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

const snakeTerms = (text: string): string[] =>
  unique(text.match(/\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g) ?? [])
    .filter((term) => term.length >= 5);

const wordCount = (text: string): number =>
  text.replace(/[^\w\s'-]/g, " ").split(/\s+/).filter(Boolean).length;

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

const stripTrailingSourceList = (text: string): string => {
  const lines = text.split(/\r?\n/);
  const sourceIndex = lines.findIndex((line) => /^\s*(?:Sources?|Refs?|References?)\s*:\s*$/i.test(line.trim()));
  if (sourceIndex < 0) return text.trim();
  return lines.slice(0, sourceIndex).join("\n").trim();
};

const hasSubstantiveProse = (text: string): boolean => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  return wordCount >= 18 && /[.!?]/.test(normalized);
};

const isExcerptLikeAnswer = (text: string): boolean => {
  const proseWithoutTrailingSources = stripTrailingSourceList(text);
  const analysisText = hasSubstantiveProse(proseWithoutTrailingSources)
    ? proseWithoutTrailingSources
    : text;
  const lines = analysisText.split(/\r?\n/).filter((line) => line.trim());
  const pathLines = countPathLikeLines(analysisText);
  if (pathLines >= 2 && pathLines >= Math.max(1, Math.floor(lines.length * 0.45))) return true;
  if (/\b(?:export|const|function|type|interface|class)\s+\w+[\s\S]{0,80}\{/.test(analysisText) && pathLines > 0) return true;
  return false;
};

const isFileListOnly = (text: string): boolean => {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return false;
  return lines.every((line) => /^[-*]?\s*(?:client|server|shared|docs|scripts|tools|packages|src)\//i.test(line));
};

const countMatches = (text: string, pattern: RegExp): number =>
  Array.from(text.matchAll(pattern)).length;

const countCjkChars = (text: string): number =>
  countMatches(text, /[\u3400-\u9fff]/gu);

const countLatinLetters = (text: string): number =>
  countMatches(text, /[A-Za-z]/g);

const looksMostlyChinese = (text: string): boolean => {
  const cjk = countCjkChars(text);
  if (cjk < 8) return false;
  const latin = countLatinLetters(text);
  return cjk >= Math.max(8, Math.floor(latin * 0.18));
};

const looksSpanishEnough = (text: string): boolean =>
  /\b(?:el|la|los|las|un|una|de|del|que|con|para|seg[uú]n|respuesta|idioma|lenguaje|c[oó]digo|evidencia|archivo|l[ií]nea|fuente|muestra|usa|utiliza|decide|final)\b/i.test(text);

const isMostlyCodeOrFileReferences = (text: string): boolean => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return false;
  const fileRefLines = lines.filter((line) =>
    /\b(?:client|server|shared|docs|scripts|tools|packages|src)\/[^\s:]+(?::\d+)?\b/i.test(line) ||
    /`[^`]*(?:client|server|shared|docs|scripts|tools|packages|src)\/[^`]+`/.test(line),
  ).length;
  return fileRefLines >= Math.max(2, Math.ceil(lines.length * 0.6));
};

const readLanguageContract = (payload: RecordLike): RecordLike | null => {
  const debug = readRecord(payload.debug);
  const requestMetadata = readRecord(payload.request_metadata);
  const packet = readRecord(payload.repo_docs_synthesis_packet);
  const candidates = [
    payload.language_contract,
    payload.languageContract,
    payload.ask_language_contract,
    debug?.language_contract,
    requestMetadata?.language_contract,
    packet?.language_contract,
  ];
  return candidates.map(readRecord).find((record) => readString(record?.schema) === "helix.ask_language_contract.v1") ?? null;
};

const responseLanguageViolations = (input: {
  text: string;
  payload: RecordLike;
}): Array<"response_language_contract_violated"> => {
  const contract = readLanguageContract(input.payload);
  const responseLanguage = readString(contract?.response_language) || readString(input.payload.response_language);
  if (responseLanguage === "zh" && !looksMostlyChinese(input.text)) {
    return ["response_language_contract_violated"];
  }
  if (
    responseLanguage === "es" &&
    !looksSpanishEnough(input.text) &&
    !isMostlyCodeOrFileReferences(input.text)
  ) {
    return ["response_language_contract_violated"];
  }
  return [];
};

const isPolicyClaimInversion = (text: string): boolean => {
  const normalized = text.replace(/\s+/g, " ").trim();
  const mentionsReceipts = /\breceipts?\b/i.test(normalized);
  const mentionsFinalAnswers = /\bfinal answers?\b|\bterminal answers?\b|\bvisible answers?\b/i.test(normalized);
  if (!mentionsReceipts || !mentionsFinalAnswers) return false;
  return (
    /\bfinal answers?\s+(?:must\s+be\s+)?(?:are\s+)?(?:derived|generated|created|validated|confirmed)\s+from\s+(?:validated\s+)?receipts?\b/i.test(normalized) ||
    /\breceipts?\s+(?:validate|confirm|authorize|prove|determine)\s+(?:the\s+)?(?:final|terminal|visible)\s+answers?\b/i.test(normalized) ||
    /\b(?:final|terminal|visible)\s+answers?\s+(?:are|must be)\s+based\s+on\s+(?:validated\s+)?receipts?\b/i.test(normalized)
  );
};

const compactEvidenceRoles = (packet: RecordLike | null): string[] =>
  unique(
    readArray(packet?.compact_evidence)
      .map(readRecord)
      .map((entry) => readString(entry?.role))
      .filter(Boolean),
  );

const conceptMentioned = (text: string, concept: string): boolean => {
  const normalized = text.toLowerCase();
  const terms = unique([
    concept,
    ...concept.split(/\s+/).filter((part) => part.length >= 4),
  ])
    .map((term) => term.toLowerCase().replace(/[^\w]+/g, " ").trim())
    .filter((term) => term.length >= 4);
  return terms.some((term) => normalized.includes(term));
};

const coveragePointPresent = (point: string, text: string, concept: string): boolean => {
  const normalized = text.replace(/\s+/g, " ").trim();
  switch (point) {
    case "identity":
      return conceptMentioned(normalized, concept) || /\b(?:is|refers to|means|represents)\b/i.test(normalized);
    case "responsibilities":
      return /\b(?:responsib|manages?|coordinates?|provides?|exposes?|creates?|sets?\s+up|handles?|watches?|observes?|tracks?|connects?|routes?|supports?|used\s+to)\b/i.test(normalized);
    case "workflow_or_surfaces":
      return /\b(?:workflow|flow|step|panel|ui|surface|tool|capabilit|runtime|store|route|source|evidence|packet|preset|observer|environment)\b/i.test(normalized);
    case "evidence_or_authority_boundary":
      return /\b(?:authority|terminal|boundary|receipt|observation|evidence|support|not\s+(?:the|an)?\s*(?:answer|authority)|cannot|doesn't|does\s+not|uncertain|partial)\b/i.test(normalized);
    default:
      return false;
  }
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

const REPO_SYNTHESIS_MODEL_STEP_CAPABILITY = "model.synthesize_from_repo_evidence";

const hasRepoSynthesisStepIdentity = (payload: RecordLike): boolean => {
  const answer = readRecord(payload.repo_code_evidence_answer);
  const draft = readRecord(payload.final_answer_draft);
  const attempts = readArray(payload.current_turn_artifact_ledger)
    .map(readRecord)
    .map((entry) => readRecord(entry?.payload))
    .filter((entry): entry is RecordLike => Boolean(entry));
  return (
    readString(answer?.model_step_capability) === REPO_SYNTHESIS_MODEL_STEP_CAPABILITY ||
    readString(draft?.model_step_capability) === REPO_SYNTHESIS_MODEL_STEP_CAPABILITY ||
    attempts.some((entry) =>
      readString(entry.schema) === "helix.repo_evidence_synthesis_attempt.v1" &&
      readString(entry.model_step_capability) === REPO_SYNTHESIS_MODEL_STEP_CAPABILITY
    )
  );
};

const hasModelSynthesis = (payload: RecordLike): boolean => {
  const answer = readRecord(payload.repo_code_evidence_answer);
  if (answer?.model_authored === true && readString(answer.synthesis_attempt_ref) && hasRepoSynthesisStepIdentity(payload)) return true;
  const draft = readRecord(payload.final_answer_draft);
  return readString(draft?.authority) === "llm_post_observation_composer" && hasRepoSynthesisStepIdentity(payload);
};

const exactSectionTermCoverage = (input: {
  text: string;
  payload: RecordLike;
}): Array<
  | "exact_section_evidence_missing"
  | "missing_exact_section_terms"
  | "unsupported_exact_section_terms"
> => {
  const packet = readRecord(input.payload.repo_docs_synthesis_packet);
  const exactSourceContract =
    readRecord(packet?.source_target_exact_contract) ??
    readRecord(input.payload.source_target_exact_contract);
  const sectionContract = readRecord(packet?.exact_section_contract);
  const contract = exactSourceContract ?? sectionContract;
  if (!exactSourceContract && readString(sectionContract?.contract_kind) !== "field_list") return [];
  const requiredTerms = unique(readArray(contract?.required_terms).map(readString).filter(Boolean));
  if (
    contract?.terminal_allowed === false ||
    contract?.evidence_missing === true ||
    readString(contract?.extraction_status) !== "" && readString(contract?.extraction_status) !== "found" ||
    requiredTerms.length === 0
  ) {
    return ["exact_section_evidence_missing"];
  }
  const normalizedText = input.text.toLowerCase();
  const missing = requiredTerms.filter((term) => !normalizedText.includes(term.toLowerCase()));
  const allowed = new Set(requiredTerms.map((term) => term.toLowerCase()));
  const unsupported = snakeTerms(input.text)
    .map((term) => term.toLowerCase())
    .filter((term) => !allowed.has(term));
  const violations: Array<
    | "exact_section_evidence_missing"
    | "missing_exact_section_terms"
    | "unsupported_exact_section_terms"
  > = [];
  if (missing.length > 0) violations.push("missing_exact_section_terms");
  if (unsupported.length > 0) violations.push("unsupported_exact_section_terms");
  return violations;
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
  if (!hasRepoSynthesisStepIdentity(input.payload)) violations.push("wrong_model_step_identity");
  if (!text) violations.push("empty_answer");
  if (isCannedFallbackText(text)) violations.push("canned_fallback_text");
  if (isMissingRepoEvidenceRefusalText(text)) violations.push("unsupported_repo_claim");
  if (isExcerptLikeAnswer(text)) violations.push("excerpt_like_answer");
  if (isFileListOnly(text)) violations.push("file_list_only");
  if (isPolicyClaimInversion(text)) violations.push("policy_claim_inversion");
  if (hasRendererHostileText(text)) violations.push("renderer_hostile_text");
  violations.push(...responseLanguageViolations({ text, payload: input.payload }));
  const supportRefs = collectSupportRefs(input.payload);
  if (supportRefs.length === 0) violations.push("missing_support_refs");
  violations.push(...exactSectionTermCoverage({ text, payload: input.payload }));
  const synthesisPacket = readRecord(input.payload.repo_docs_synthesis_packet);
  const depthContract = readRecord(synthesisPacket?.answer_depth_contract);
  if (readString(depthContract?.depth_mode) === "internal_concept_overview") {
    const minWords = typeof depthContract?.min_word_count === "number" ? depthContract.min_word_count : 90;
    const minRoles = typeof depthContract?.min_distinct_evidence_roles === "number"
      ? depthContract.min_distinct_evidence_roles
      : 2;
    const roles = compactEvidenceRoles(synthesisPacket);
    const concept = readString(synthesisPacket?.concept) || readString(readRecord(input.payload.repo_code_evidence_answer)?.concept) || "repo concept";
    const missingCoverage = readArray(depthContract?.required_coverage_points)
      .map(readString)
      .filter((point) => point && !coveragePointPresent(point, text, concept));
    const conciseSourceCitedDefinition =
      hasSubstantiveProse(text) &&
      conceptMentioned(text, concept) &&
      /\bSources?\s*:/i.test(text) &&
      supportRefs.length >= 2 &&
      roles.length >= minRoles;
    if (wordCount(text) < minWords && !conciseSourceCitedDefinition) violations.push("shallow_broad_concept_answer");
    if (roles.length < minRoles) violations.push("insufficient_evidence_role_coverage");
    if (missingCoverage.length > 0 && !conciseSourceCitedDefinition) violations.push("missing_broad_concept_coverage");
  }
  const relevanceGate = readRecord(input.payload.repo_evidence_relevance_gate);
  const repoConceptDetection = readRecord(input.payload.repo_concept_detection);
  const conceptRequiresRepoEvidence = repoConceptDetection?.require_repo_evidence === true;
  if (conceptRequiresRepoEvidence && !relevanceGate) violations.push("missing_repo_relevance_gate");
  if (relevanceGate) {
    if (relevanceGate.terminal_allowed !== true) violations.push("weak_repo_evidence");
    const gateViolations = readArray(relevanceGate.violations).map(readString);
    if (gateViolations.includes("exact_match_files_found_but_not_selected")) violations.push("exact_evidence_not_selected");
    if (gateViolations.includes("exact_source_contract_failed")) violations.push("exact_section_evidence_missing");
    if (gateViolations.includes("codebase_anchor_ignored")) violations.push("codebase_anchor_ignored");
    if (gateViolations.includes("alias_not_normalized")) violations.push("alias_not_normalized");
  }
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
