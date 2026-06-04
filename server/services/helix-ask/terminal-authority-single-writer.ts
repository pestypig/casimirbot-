import type {
  HelixTerminalAuthoritySingleWriterResult,
  HelixTerminalCandidate,
} from "@shared/helix-terminal-authority";
import {
  applyTerminalAnswerEnvelope,
  resolveTerminalAnswerEnvelope,
} from "./terminal-answer-envelope";
import {
  findLatestFinalAnswerDraftCandidate,
  latestDirectAnswerSequence,
  materializeFinalAnswerDraftTerminal,
} from "./final-answer-draft-terminal-materializer";

type ArtifactLike = {
  artifact_id?: unknown;
  kind?: unknown;
  payload?: unknown;
};

type SingleWriterInput = {
  turnId: string;
  threadId?: string | null;
  payload: Record<string, unknown>;
  artifactLedger?: ArtifactLike[] | null;
  legacyCandidates?: HelixTerminalCandidate[];
};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const textHash = (value: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const isStaleWorkspaceFailureText = (value: unknown): boolean =>
  /(?:workspace_step_failed|Failed to execute)/i.test(readString(value) ?? "");

const isStagePlayPostObservationSynthesisText = (value: unknown): boolean =>
  /^(?:Stage Play reflected\b|Stage Play tool receipt:\s*live_env\.reflect_stage_play_context\b|Stage Play checkpoint request (?:queued|running|completed):)/i.test(
    readString(value) ?? "",
  );

const routeContractAllowedTerminalKinds = (payload: Record<string, unknown>): string[] =>
  readArray(readRecord(payload.route_product_contract)?.allowed_terminal_artifact_kinds)
    .map(readString)
    .filter((entry): entry is string => Boolean(entry));

const routeContractAllowsTerminalKind = (
  payload: Record<string, unknown>,
  kind: string,
): boolean => {
  const allowed = routeContractAllowedTerminalKinds(payload);
  return allowed.length === 0 || allowed.includes(kind);
};

const routeContractRequiresScholarlyResearchAnswer = (payload: Record<string, unknown>): boolean =>
  readString(readRecord(payload.canonical_goal_frame)?.required_terminal_kind) === "scholarly_research_answer" ||
  routeContractAllowedTerminalKinds(payload).includes("scholarly_research_answer");

const artifactPayload = (artifact: ArtifactLike): Record<string, unknown> | null =>
  readRecord(artifact.payload);

const artifactSchema = (artifact: ArtifactLike): string | null =>
  readString(artifactPayload(artifact)?.schema);

const artifactKind = (artifact: ArtifactLike): string =>
  readString(artifact.kind) ?? readString(artifactPayload(artifact)?.kind) ?? "unknown";

const artifactId = (artifact: ArtifactLike): string | null =>
  readString(artifact.artifact_id) ??
  readString((artifact as Record<string, unknown>).artifact_ref) ??
  readString(artifactPayload(artifact)?.artifact_id);

const artifactText = (artifact: ArtifactLike): string | null => {
  const payload = artifactPayload(artifact);
  return (
    readString(payload?.answer_text) ??
    readString(payload?.text) ??
    readString(payload?.visible_text) ??
    readString(artifactPayload(artifact)?.message)
  );
};

const isPostToolObservation = (artifact: ArtifactLike): boolean => {
  const payload = artifactPayload(artifact);
  if (!(
    artifactKind(artifact) === "agent_step_observation_packet" ||
    artifactSchema(artifact) === "helix.agent_step_observation_packet.v1"
  )) {
    return false;
  }
  return (
    payload?.post_tool_model_step_required === true ||
    payload?.terminal_eligible === false ||
    readString(payload?.status) === "succeeded"
  );
};

const isFinalAnswerDraft = (artifact: ArtifactLike): boolean =>
  artifactKind(artifact) === "final_answer_draft" ||
  artifactSchema(artifact) === "helix.final_answer_draft.v1";

const finalAnswerDraftAuthority = (artifact: ArtifactLike): string | null =>
  readString(artifactPayload(artifact)?.authority);

const isDeterministicStagePlayReceiptText = (value: unknown): boolean =>
  /^Stage Play tool receipt:\s*live_env\.reflect_stage_play_context\b/i.test(readString(value) ?? "");

const isDeterministicReceiptFallbackDraft = (artifact: ArtifactLike): boolean =>
  isFinalAnswerDraft(artifact) &&
  (
    finalAnswerDraftAuthority(artifact) === "deterministic_receipt_fallback" ||
    isDeterministicStagePlayReceiptText(artifactText(artifact))
  );

const stagePlayReceiptPendingText =
  "Stage Play reflected the active visual source and queued a checkpoint.\nNo model-reviewed answer snapshot exists yet.";

const stagePlayReceiptTextForDraft = (artifact: ArtifactLike): string => {
  const text = artifactText(artifact);
  return /^Stage Play checkpoint request (?:queued|running|completed):/i.test(text ?? "")
    ? text!
    : stagePlayReceiptPendingText;
};

const isScholarlyFullTextObservation = (artifact: ArtifactLike): boolean =>
  /scholarly_full_text_observation/i.test([artifactKind(artifact), artifactSchema(artifact)].join(" "));

const hasObservedScholarlyFullText = (artifacts: ArtifactLike[]): boolean =>
  artifacts.some((artifact) => {
    if (!isScholarlyFullTextObservation(artifact)) return false;
    const payload = artifactPayload(artifact);
    if (!payload) return false;
    const pagesParsed = typeof payload.pages_parsed === "number" ? payload.pages_parsed : 0;
    return (
      pagesParsed > 0 ||
      readArray(payload.selected_chunks).length > 0 ||
      readArray(payload.page_text_refs).length > 0 ||
      Boolean(readString(payload.source_url) ?? readString(payload.source_pdf_ref))
    );
  });

type ScholarlyCitation = {
  label: string;
  url: string;
  note: string | null;
};

const isScholarlyResearchObservation = (artifact: ArtifactLike): boolean =>
  /scholarly_research_observation/i.test([artifactKind(artifact), artifactSchema(artifact)].join(" "));

const firstReadableString = (...values: unknown[]): string | null => {
  for (const value of values) {
    const text = readString(value);
    if (text) return text;
  }
  return null;
};

const firstHttpUrl = (...values: unknown[]): string | null => {
  for (const value of values) {
    const text = readString(value);
    if (text && /^https?:\/\//i.test(text)) return text;
  }
  return null;
};

const doiUrl = (value: unknown): string | null => {
  const doi = readString(value);
  if (!doi) return null;
  if (/^https?:\/\/(?:dx\.)?doi\.org\//i.test(doi)) return doi.replace(/^https?:\/\/dx\.doi\.org\//i, "https://doi.org/");
  return `https://doi.org/${doi.replace(/^doi:\s*/i, "")}`;
};

const arxivUrl = (value: unknown): string | null => {
  const arxivId = readString(value);
  if (!arxivId) return null;
  if (/^https?:\/\/(?:www\.)?arxiv\.org\//i.test(arxivId)) return arxivId;
  return `https://arxiv.org/abs/${arxivId.replace(/^arxiv:\s*/i, "")}`;
};

const citationKey = (value: string | null): string | null =>
  value ? value.trim().toLowerCase() : null;

const paperCitationUrl = (paper: Record<string, unknown> | null): string | null => {
  const identifiers = readRecord(paper?.identifiers);
  return firstHttpUrl(
    paper?.pdf_url,
    paper?.full_text_url,
    paper?.url,
    identifiers?.pdf_url,
    identifiers?.full_text_url,
    identifiers?.url,
    doiUrl(firstReadableString(paper?.doi, identifiers?.doi)),
    arxivUrl(firstReadableString(paper?.arxiv_id, identifiers?.arxiv_id)),
  );
};

const collectScholarlyPaperRecordsByKey = (artifacts: ArtifactLike[]): Map<string, Record<string, unknown>> => {
  const papers = new Map<string, Record<string, unknown>>();
  const add = (key: string | null, paper: Record<string, unknown>): void => {
    if (key && !papers.has(key)) papers.set(key, paper);
  };
  for (const artifact of artifacts) {
    if (!isScholarlyResearchObservation(artifact)) continue;
    const payload = artifactPayload(artifact);
    for (const paperValue of readArray(payload?.papers)) {
      const paper = readRecord(paperValue);
      if (!paper) continue;
      const identifiers = readRecord(paper.identifiers);
      add(citationKey(readString(paper.result_id)), paper);
      add(citationKey(readString(identifiers?.openalex_id)), paper);
      add(citationKey(readString(identifiers?.doi)), paper);
      add(citationKey(readString(identifiers?.arxiv_id)), paper);
      add(citationKey(readString(paper.title)), paper);
    }
  }
  return papers;
};

const findPaperForFullTextObservation = (
  payload: Record<string, unknown>,
  papersByKey: Map<string, Record<string, unknown>>,
): Record<string, unknown> | null => {
  const keys = [
    citationKey(readString(payload.paper_result_id)),
    citationKey(readString(payload.result_id)),
    citationKey(readString(payload.title)),
  ].filter((entry): entry is string => Boolean(entry));
  for (const key of keys) {
    const paper = papersByKey.get(key);
    if (paper) return paper;
  }
  return null;
};

const markdownLinkLabel = (value: string): string =>
  value.replace(/\\/g, "\\\\").replace(/\[/g, "\\[").replace(/\]/g, "\\]").replace(/\s+/g, " ").trim();

const hasExistingCitationFooter = (text: string): boolean =>
  /(?:^|\n)\s*(?:#{1,6}\s*)?(?:citations|references|sources)\s*:?\s*(?:\n|$)/i.test(text);

const collectScholarlyCitations = (artifacts: ArtifactLike[]): ScholarlyCitation[] => {
  const papersByKey = collectScholarlyPaperRecordsByKey(artifacts);
  const citations: ScholarlyCitation[] = [];
  const seen = new Set<string>();
  const addCitation = (citation: ScholarlyCitation): void => {
    const key = `${citation.url.toLowerCase()}|${citation.label.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    citations.push(citation);
  };

  for (const artifact of artifacts) {
    if (!isScholarlyFullTextObservation(artifact)) continue;
    const payload = artifactPayload(artifact);
    if (!payload || payload.selected_for_answer === false) continue;
    const selectedChunks = readArray(payload.selected_chunks);
    const pageTextRefs = readArray(payload.page_text_refs);
    const pagesParsed = typeof payload.pages_parsed === "number" ? payload.pages_parsed : 0;
    if (selectedChunks.length === 0 && pageTextRefs.length === 0 && pagesParsed <= 0) continue;
    const paper = findPaperForFullTextObservation(payload, papersByKey);
    const url = firstHttpUrl(payload.source_url, paperCitationUrl(paper));
    if (!url) continue;
    const label = firstReadableString(payload.title, paper?.title, payload.paper_result_id, artifactId(artifact)) ?? "Scholarly source";
    const note = pagesParsed > 0 ? `PDF/full text; ${pagesParsed} parsed page${pagesParsed === 1 ? "" : "s"}` : "PDF/full text";
    addCitation({ label, url, note });
  }

  if (citations.length === 0) {
    for (const paper of papersByKey.values()) {
      if (paper.selected_for_answer === false) continue;
      const url = paperCitationUrl(paper);
      if (!url) continue;
      const label = firstReadableString(paper.title, paper.result_id, url) ?? "Scholarly source";
      addCitation({ label, url, note: null });
      if (citations.length >= 4) break;
    }
  }

  return citations.slice(0, 6);
};

const appendScholarlyCitationFooter = (
  text: string,
  artifacts: ArtifactLike[],
): { text: string; citations: ScholarlyCitation[]; footer: string | null } => {
  if (hasExistingCitationFooter(text)) return { text, citations: [], footer: null };
  const citations = collectScholarlyCitations(artifacts);
  if (citations.length === 0) return { text, citations, footer: null };
  const footer = [
    "Citations",
    ...citations.map((citation) =>
      `- [${markdownLinkLabel(citation.label)}](${citation.url})${citation.note ? ` (${citation.note})` : ""}`),
  ].join("\n");
  return { text: `${text.trimEnd()}\n\n${footer}`, citations, footer };
};

const isForbiddenReceiptOrProjection = (artifact: ArtifactLike): boolean => {
  const kind = artifactKind(artifact);
  return (
    kind === "workspace_action_receipt" ||
    kind === "note_update_receipt" ||
    kind === "note_action_receipt" ||
    kind === "note_create_receipt" ||
    kind === "agent_step_observation_packet" ||
    kind === "client_projection" ||
    kind === "live_pipeline_receipt" ||
    kind === "voice_delivery_proposal" ||
    kind === "legacy_terminal_candidate"
  );
};

const isVisualSituationTerminalKind = (kind: string): kind is
  | "situation_context_pack"
  | "visual_context_pack"
  | "visual_frame_evidence" =>
  kind === "situation_context_pack" ||
  kind === "visual_context_pack" ||
  kind === "visual_frame_evidence";

const findGoalSatisfyingVisualSituationArtifact = (
  payload: Record<string, unknown>,
  artifacts: ArtifactLike[],
): { artifact: ArtifactLike; kind: "situation_context_pack" | "visual_context_pack" | "visual_frame_evidence"; text: string; ref: string | null } | null => {
  const goal = readRecord(payload.goal_satisfaction_evaluation);
  if (readString(goal?.next_decision) !== "allow_terminal" || readString(goal?.satisfaction) !== "satisfied") {
    return null;
  }
  const supportedRefs = Array.isArray(goal?.observed_results)
    ? (goal.observed_results as unknown[])
      .map(readRecord)
      .filter((entry): entry is Record<string, unknown> =>
        Boolean(entry?.supports_goal === true && isVisualSituationTerminalKind(readString(entry.kind) ?? "")))
      .map((entry) => readString(entry.ref))
      .filter((entry): entry is string => Boolean(entry))
    : [];
  if (supportedRefs.length === 0) {
    const requiredEvidence = Array.isArray(goal?.required_evidence)
      ? (goal.required_evidence as unknown[]).map(readRecord).filter((entry): entry is Record<string, unknown> => Boolean(entry))
      : [];
    const visualObservationSatisfied = requiredEvidence.some((entry) =>
      readString(entry.kind) === "visual_observation" && entry.satisfied === true,
    );
    const fieldEvaluationSatisfied = requiredEvidence.some((entry) =>
      readString(entry.kind) === "field_evaluation" && entry.satisfied === true,
    );
    const situationContextPackSatisfied = requiredEvidence.some((entry) =>
      readString(entry.kind) === "situation_context_pack" && entry.satisfied === true,
    );
    if (!(visualObservationSatisfied && fieldEvaluationSatisfied) && !situationContextPackSatisfied) return null;
    for (const artifact of artifacts) {
      const kind = artifactKind(artifact);
      if (!isVisualSituationTerminalKind(kind)) continue;
      const text = artifactText(artifact);
      if (!text || isStaleWorkspaceFailureText(text)) continue;
      return { artifact, kind, text, ref: artifactId(artifact) };
    }
    return null;
  }
  for (const ref of supportedRefs) {
    const artifact = artifacts.find((entry) => artifactId(entry) === ref);
    if (!artifact) continue;
    const kind = artifactKind(artifact);
    if (!isVisualSituationTerminalKind(kind)) continue;
    const text = artifactText(artifact);
    if (!text || isStaleWorkspaceFailureText(text)) continue;
    return { artifact, kind, text, ref };
  }
  return null;
};

const quarantineStaleRequestUserInput = (payload: Record<string, unknown>): void => {
  const staleRequest =
    readRecord(payload.request_user_input) ??
    readRecord(payload.pending_server_request) ??
    readRecord(payload.pending_request);
  if (staleRequest && !readRecord(payload.stale_pending_server_request)) {
    payload.stale_pending_server_request = staleRequest;
  }
  delete payload.request_user_input;
  delete payload.pending_server_request;
  delete payload.pending_request;
};

const findSelectedDraftAfterRequiredObservation = (
  artifacts: ArtifactLike[],
): { artifact: ArtifactLike; sequence: number; latestObservationSequence: number } | null => {
  const latestObservationSequence = artifacts.reduce((latest, artifact, index) =>
    isPostToolObservation(artifact) ? index : latest, -1);
  if (latestObservationSequence < 0) return null;

  for (let index = artifacts.length - 1; index > latestObservationSequence; index -= 1) {
    const artifact = artifacts[index];
    if (!artifact || !isFinalAnswerDraft(artifact)) continue;
    if (isDeterministicReceiptFallbackDraft(artifact)) continue;
    const text = artifactText(artifact);
    if (!text || isStaleWorkspaceFailureText(text)) continue;
    return { artifact, sequence: index, latestObservationSequence };
  }
  return null;
};

const findDeterministicReceiptFallbackDraftAfterRequiredObservation = (
  artifacts: ArtifactLike[],
): { artifact: ArtifactLike; sequence: number; latestObservationSequence: number } | null => {
  const latestObservationSequence = artifacts.reduce((latest, artifact, index) =>
    isPostToolObservation(artifact) ? index : latest, -1);
  if (latestObservationSequence < 0) return null;

  for (let index = artifacts.length - 1; index > latestObservationSequence; index -= 1) {
    const artifact = artifacts[index];
    if (!artifact || !isDeterministicReceiptFallbackDraft(artifact)) continue;
    return { artifact, sequence: index, latestObservationSequence };
  }
  return null;
};

export function recordLegacyTerminalCandidate(input: {
  turn_id: string;
  source:
    | "legacy_workspace_failure"
    | "legacy_panel_open_receipt"
    | "legacy_note_receipt"
    | "legacy_doc_receipt"
    | "legacy_calculator_receipt"
    | "legacy_situation_room_receipt"
    | "legacy_voice_receipt"
    | "legacy_fallback";
  text: string;
  reason: string;
}): HelixTerminalCandidate {
  return {
    schema: "helix.terminal_candidate.v1",
    candidate_id: `${input.turn_id}:legacy_terminal_candidate:${textHash([
      input.source,
      input.reason,
      input.text,
    ].join("|"))}`,
    turn_id: input.turn_id,
    artifact_kind: input.source,
    text: input.text,
    terminal_eligible: false,
    assistant_answer: false,
    source: input.source === "legacy_workspace_failure" ? "legacy_workspace_failure" : "legacy_fallback",
    created_at_stage: "legacy_branch",
    failure_code: input.reason,
    freshness: {},
  };
}

export function applyHelixTerminalAuthoritySingleWriter(
  input: SingleWriterInput,
): HelixTerminalAuthoritySingleWriterResult {
  const artifacts = input.artifactLedger ?? (
    Array.isArray(input.payload.current_turn_artifact_ledger)
      ? (input.payload.current_turn_artifact_ledger as ArtifactLike[])
      : []
  );
  const priorPayloadFields = {
    text: readString(input.payload.text),
    answer: readString(input.payload.answer),
    assistant_answer: readString(input.payload.assistant_answer),
    selected_final_answer: readString(input.payload.selected_final_answer),
  };

  const rejectedCandidates: HelixTerminalAuthoritySingleWriterResult["rejected_candidates"] = [];
  const rawSolverContinuationPending =
    readRecord(input.payload.solver_continuation_observation)?.schema === "helix.solver_continuation_observation.v1" &&
    readString(readRecord(input.payload.solver_continuation_observation)?.required_next_step) !== "typed_failure";
  const draftMaterialization = materializeFinalAnswerDraftTerminal({
    turnId: input.turnId,
    payload: input.payload,
    artifactLedger: artifacts,
    routeProductContract: readRecord(input.payload.route_product_contract),
  });
  if (draftMaterialization) {
    input.payload.final_answer_draft_selection = {
      candidate_count: artifacts.filter(isFinalAnswerDraft).length,
      latest_final_answer_draft_ref: draftMaterialization.final_answer_draft_ref,
      latest_final_answer_draft_sequence: findLatestFinalAnswerDraftCandidate(artifacts)?.sequence ?? null,
      latest_final_answer_draft_quality_ok: draftMaterialization.final_answer_draft_quality_gate.ok,
      latest_final_answer_draft_quality_violations: draftMaterialization.final_answer_draft_quality_gate.violations,
      materialized_terminal_artifact_kind: draftMaterialization.materialized_terminal_artifact_kind ?? null,
      materialized_terminal_artifact_ref: draftMaterialization.materialized_terminal_artifact_ref ?? null,
      selected_over_direct_answer_text: draftMaterialization.ok && latestDirectAnswerSequence(artifacts) >= 0,
      rejected_direct_answer_text_reason:
        draftMaterialization.ok && latestDirectAnswerSequence(artifacts) >= 0
          ? "later_valid_final_answer_draft"
          : null,
      blocked_reason: draftMaterialization.blocked_reason ?? null,
    };
    input.payload.route_terminal_materialization = {
      route_family: draftMaterialization.final_answer_draft_quality_gate.route_family,
      source_target: readString(readRecord(input.payload.route_product_contract)?.source_target),
      required_terminal_kind: readString(readRecord(input.payload.canonical_goal_frame)?.required_terminal_kind),
      allowed_terminal_artifact_kinds: draftMaterialization.route_allowed_terminal_artifact_kinds,
      materialization_attempted: true,
      materialization_ok: draftMaterialization.ok,
      materialization_blocked_reason: draftMaterialization.blocked_reason ?? null,
    };
  }
  const goalEvaluation = readRecord(input.payload.goal_satisfaction_evaluation);
  const goalAllowsTerminal =
    readString(goalEvaluation?.satisfaction) === "satisfied" ||
    readString(goalEvaluation?.next_decision) === "allow_terminal";
  const repoTerminalMaterialized =
    draftMaterialization?.ok === true &&
    draftMaterialization.materialized_terminal_artifact_kind === "repo_code_evidence_answer";
  const scholarlyTerminalMaterialized =
    draftMaterialization?.ok === true &&
    draftMaterialization.materialized_terminal_artifact_kind === "scholarly_research_answer";
  const latestDraftForContinuation = findLatestFinalAnswerDraftCandidate(artifacts);
  const stagePlayTerminalMaterialized =
    draftMaterialization?.ok === true &&
    isStagePlayPostObservationSynthesisText(latestDraftForContinuation?.text);
  const solverContinuationPending =
    rawSolverContinuationPending &&
    !(
      (repoTerminalMaterialized && goalAllowsTerminal) ||
      (scholarlyTerminalMaterialized && goalAllowsTerminal) ||
      (stagePlayTerminalMaterialized && goalAllowsTerminal)
    );
  if (solverContinuationPending) {
    const pendingText =
      "I could not complete this turn yet because solver continuation is required before terminal answer selection.";
    rejectedCandidates.push({
      kind: readString(input.payload.terminal_artifact_kind) ?? "direct_answer_text",
      reason: "solver_continuation_pending",
    });
    input.payload.terminal_artifact_kind = "typed_failure";
    input.payload.final_answer_source = "typed_failure";
    input.payload.terminal_error_code = "solver_continuation_pending";
    input.payload.selected_final_answer = pendingText;
    input.payload.answer = pendingText;
    input.payload.text = pendingText;
    input.payload.assistant_answer = pendingText;
  } else if (rawSolverContinuationPending && repoTerminalMaterialized && goalAllowsTerminal) {
    rejectedCandidates.push({
      kind: "typed_failure",
      reason: "stale_solver_continuation_superseded_by_repo_terminal",
    });
  } else if (rawSolverContinuationPending && scholarlyTerminalMaterialized && goalAllowsTerminal) {
    rejectedCandidates.push({
      kind: "typed_failure",
      reason: "stale_solver_continuation_superseded_by_scholarly_terminal",
    });
  } else if (rawSolverContinuationPending && stagePlayTerminalMaterialized && goalAllowsTerminal) {
    rejectedCandidates.push({
      kind: "typed_failure",
      reason: "stale_solver_continuation_superseded_by_stage_play_terminal",
    });
  }
  const selectedDraft = findSelectedDraftAfterRequiredObservation(artifacts);
  const deterministicReceiptFallbackDraft = selectedDraft
    ? null
    : findDeterministicReceiptFallbackDraftAfterRequiredObservation(artifacts);
  const selectedGoalArtifact = findGoalSatisfyingVisualSituationArtifact(input.payload, artifacts);
  const latestRequiredObservationSequence = selectedDraft?.latestObservationSequence ??
    artifacts.reduce((latest, artifact, index) => isPostToolObservation(artifact) ? index : latest, -1);
  const routeAllowsModelSynthesizedAnswer = routeContractAllowsTerminalKind(input.payload, "model_synthesized_answer");
  const deterministicReceiptFallbackCanSurface =
    Boolean(deterministicReceiptFallbackDraft) &&
    (
      routeContractAllowedTerminalKinds(input.payload).includes("tool_receipt") ||
      isStagePlayPostObservationSynthesisText(artifactText(deterministicReceiptFallbackDraft!.artifact))
    );
  const scholarlyAnswerSynthesisMissing =
    routeContractRequiresScholarlyResearchAnswer(input.payload) &&
    hasObservedScholarlyFullText(artifacts);

  if (selectedDraft && !routeAllowsModelSynthesizedAnswer && draftMaterialization?.ok !== true) {
    rejectedCandidates.push({
      ref: artifactId(selectedDraft.artifact) ?? undefined,
      kind: "model_synthesized_answer",
      source: "final_answer_draft",
      reason: "route_contract_forbids_model_synthesized_answer",
    });
  }
  if (deterministicReceiptFallbackDraft && !deterministicReceiptFallbackCanSurface) {
    rejectedCandidates.push({
      ref: artifactId(deterministicReceiptFallbackDraft.artifact) ?? undefined,
      kind: "final_answer_draft",
      source: "final_answer_draft",
      reason: "deterministic_receipt_fallback_nonterminal",
    });
  }

  for (const artifact of artifacts) {
    if (!isForbiddenReceiptOrProjection(artifact)) continue;
    rejectedCandidates.push({
      ref: artifactId(artifact) ?? undefined,
      kind: artifactKind(artifact),
      reason: "receipt_or_projection",
    });
  }

  const legacyCandidates = [...(input.legacyCandidates ?? [])];
  for (const [field, value] of Object.entries(priorPayloadFields)) {
    if (isStaleWorkspaceFailureText(value)) {
      legacyCandidates.push(recordLegacyTerminalCandidate({
        turn_id: input.turnId,
        source: "legacy_workspace_failure",
        text: value ?? "",
        reason: `stale_${field}`,
      }));
    }
  }
  for (const candidate of legacyCandidates) {
    rejectedCandidates.push({
      ref: candidate.artifact_ref,
      kind: candidate.artifact_kind,
      source: candidate.source,
      reason: candidate.source === "legacy_workspace_failure"
        ? "stale_failure_candidate"
        : "legacy_direct_writer_quarantined",
    });
  }
  const modelOnlyCompoundCoverage = readRecord(input.payload.model_only_compound_coverage_from_answer);
  const coverageValidModelOnlyAnswerExists =
    modelOnlyCompoundCoverage?.schema === "helix.model_only_compound_coverage_from_answer.v1" &&
    modelOnlyCompoundCoverage?.passed === true &&
    modelOnlyCompoundCoverage?.route_scope === "model_only_allowed";
  if (
    coverageValidModelOnlyAnswerExists &&
    (readString(input.payload.terminal_artifact_kind) === "typed_failure" ||
      readString(input.payload.final_answer_source) === "typed_failure")
  ) {
    rejectedCandidates.push({
      kind: "typed_failure",
      reason: "coverage_valid_model_only_answer_exists",
    });
  }

  let selectedArtifactRef: string | null = null;
  let selectedArtifactKind: HelixTerminalAuthoritySingleWriterResult["selected_terminal_artifact_kind"] = null;
  let selectedSource: HelixTerminalAuthoritySingleWriterResult["source"] = "terminal_authority_repair_failure";

  if (!solverContinuationPending && selectedGoalArtifact) {
    selectedArtifactRef = selectedGoalArtifact.ref;
    selectedArtifactKind = selectedGoalArtifact.kind;
    selectedSource = selectedGoalArtifact.kind;
    quarantineStaleRequestUserInput(input.payload);
    input.payload.ok = true;
    input.payload.response_type = "final_answer";
    input.payload.final_status = "final_answer";
    input.payload.terminal_artifact_kind = selectedGoalArtifact.kind;
    input.payload.final_answer_source = selectedGoalArtifact.kind;
    input.payload.selected_final_answer = selectedGoalArtifact.text;
    input.payload.answer = selectedGoalArtifact.text;
    input.payload.text = selectedGoalArtifact.text;
    input.payload.assistant_answer = selectedGoalArtifact.text;
    input.payload.terminal_artifact_id = selectedGoalArtifact.ref ?? undefined;
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: selectedGoalArtifact.kind,
      concise_text: selectedGoalArtifact.text,
      assistant_answer: false,
      raw_content_included: false,
    };
    delete input.payload.terminal_error_code;
  } else if (!solverContinuationPending && draftMaterialization?.ok) {
    const latestDraft = findLatestFinalAnswerDraftCandidate(artifacts);
    selectedArtifactRef = draftMaterialization.materialized_terminal_artifact_ref ?? latestDraft?.ref ?? null;
    selectedArtifactKind = draftMaterialization.materialized_terminal_artifact_kind ?? "model_synthesized_answer";
    const materializedScholarlyAnswer =
      selectedArtifactKind === "scholarly_research_answer"
        ? readRecord(input.payload.scholarly_research_answer)
        : null;
    const baseText =
      readString(materializedScholarlyAnswer?.answer_text) ??
      readString(materializedScholarlyAnswer?.text) ??
      latestDraft?.text ??
      readString(input.payload.selected_final_answer) ??
      "I could not produce a terminal answer for this turn.";
    const citationFooter =
      selectedArtifactKind === "scholarly_research_answer"
        ? appendScholarlyCitationFooter(baseText, artifacts)
        : { text: baseText, citations: [] as ScholarlyCitation[], footer: null };
    const text = citationFooter.text;
    if (materializedScholarlyAnswer) {
      materializedScholarlyAnswer.text = text;
      materializedScholarlyAnswer.answer_text = text;
      materializedScholarlyAnswer.citations = citationFooter.citations;
      materializedScholarlyAnswer.citation_footer = citationFooter.footer;
    }
    selectedSource = "final_answer_draft";
    input.payload.terminal_artifact_kind = selectedArtifactKind;
    input.payload.final_answer_source = "final_answer_draft";
    input.payload.selected_final_answer = text;
    input.payload.answer = text;
    input.payload.text = text;
    input.payload.assistant_answer = text;
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: selectedArtifactKind,
      concise_text: text,
      assistant_answer: false,
      raw_content_included: false,
    };
    const directSequence = latestDirectAnswerSequence(artifacts);
    if (directSequence >= 0) {
      const direct = artifacts[directSequence];
      rejectedCandidates.push({
        ref: direct ? artifactId(direct) ?? undefined : undefined,
        kind: "direct_answer_text",
        reason: "later_valid_final_answer_draft",
      });
    }
  } else if (!solverContinuationPending && selectedDraft && routeAllowsModelSynthesizedAnswer) {
    const text = artifactText(selectedDraft.artifact) ?? "I could not produce a terminal answer for this turn.";
    selectedArtifactRef = artifactId(selectedDraft.artifact);
    selectedArtifactKind = "model_synthesized_answer";
    selectedSource = "final_answer_draft";
    input.payload.terminal_artifact_kind = "model_synthesized_answer";
    input.payload.final_answer_source = "final_answer_draft";
    input.payload.selected_final_answer = text;
    input.payload.answer = text;
    input.payload.text = text;
    input.payload.assistant_answer = text;
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: "model_synthesized_answer",
      concise_text: text,
      assistant_answer: false,
      raw_content_included: false,
    };
  } else if (!solverContinuationPending && deterministicReceiptFallbackDraft && deterministicReceiptFallbackCanSurface) {
    const draftRef = artifactId(deterministicReceiptFallbackDraft.artifact);
    const text = stagePlayReceiptTextForDraft(deterministicReceiptFallbackDraft.artifact);
    selectedArtifactRef = draftRef;
    selectedArtifactKind = "tool_receipt";
    selectedSource = "tool_receipt";
    input.payload.terminal_artifact_kind = "tool_receipt";
    input.payload.final_answer_source = "deterministic_receipt_fallback";
    input.payload.selected_final_answer = text;
    input.payload.answer = text;
    input.payload.text = text;
    input.payload.assistant_answer = false;
    input.payload.terminal_eligible = false;
    input.payload.terminal_artifact_id = draftRef ?? undefined;
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: "tool_receipt",
      concise_text: text,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    rejectedCandidates.push({
      ref: draftRef ?? undefined,
      kind: "final_answer_draft",
      source: "final_answer_draft",
      reason: "deterministic_receipt_fallback_nonterminal",
    });
  } else if (!solverContinuationPending && latestRequiredObservationSequence >= 0) {
    const terminalErrorCode = scholarlyAnswerSynthesisMissing
      ? "scholarly_answer_synthesis_failed_after_full_text_observed"
      : "post_tool_model_step_missing";
    const terminalErrorText = scholarlyAnswerSynthesisMissing
      ? "I could not complete this scholarly research turn because PDF/full-text evidence was observed, but no valid model-authored scholarly answer passed terminal authority."
      : "I could not complete this turn because a tool observation required a follow-up model answer step, but no later terminal answer artifact was available.";
    input.payload.terminal_artifact_kind = "typed_failure";
    input.payload.final_answer_source = "typed_failure";
    input.payload.terminal_error_code = terminalErrorCode;
    input.payload.selected_final_answer = terminalErrorText;
    input.payload.answer = terminalErrorText;
    input.payload.text = terminalErrorText;
    input.payload.assistant_answer = terminalErrorText;
    input.payload.typed_failure = {
      ...(readRecord(input.payload.typed_failure) ?? {}),
      schema: "helix.typed_failure.v1",
      error_code: terminalErrorCode,
      message: terminalErrorText,
      text: terminalErrorText,
      answer_text: terminalErrorText,
      assistant_answer: false,
      raw_content_included: false,
    };
    selectedArtifactKind = "typed_failure";
    selectedSource = "typed_failure";
    rejectedCandidates.push({
      kind: "normal_answer",
      reason: "missing_post_tool_model_step",
    });
  }

  const envelope = resolveTerminalAnswerEnvelope(input.payload, {
    threadId: input.threadId,
    turnId: input.turnId,
  });
  const appliedEnvelope = applyTerminalAnswerEnvelope(input.payload, envelope);
  const visibleText = appliedEnvelope.terminal_text;
  const latestDraftForIntegrity = findLatestFinalAnswerDraftCandidate(artifacts);
  const draftText = latestDraftForIntegrity?.text ?? (selectedDraft ? artifactText(selectedDraft.artifact) : null);
  const selectedMaterializedAnswerText =
    readString(readRecord(input.payload.scholarly_research_answer)?.answer_text) ??
    readString(readRecord(input.payload.repo_code_evidence_answer)?.answer_text);
  const selectedArtifactTextForIntegrity = selectedMaterializedAnswerText ?? draftText;
  const receiptVisibleAsAnswer = artifacts.some((artifact) => {
    if (!isForbiddenReceiptOrProjection(artifact)) return false;
    const text = artifactText(artifact);
    return Boolean(text && text === visibleText);
  });
  const result: HelixTerminalAuthoritySingleWriterResult = {
    schema: "helix.terminal_authority_single_writer_result.v1",
    turn_id: input.turnId,
    selected_terminal_artifact_ref: selectedArtifactRef,
    selected_terminal_artifact_kind: selectedArtifactKind ?? (
      appliedEnvelope.terminal_artifact_kind === "typed_failure"
        ? "typed_failure"
        : appliedEnvelope.terminal_artifact_kind === "request_user_input"
          ? "request_user_input"
          : appliedEnvelope.terminal_artifact_kind === "direct_answer_text"
            ? "direct_answer_text"
            : null
    ),
    visible_text: visibleText,
    assistant_answer: false,
    source: selectedSource === "terminal_authority_repair_failure"
      ? appliedEnvelope.final_answer_source === "typed_failure"
        ? "typed_failure"
        : appliedEnvelope.terminal_artifact_kind === "direct_answer_text"
          ? "direct_answer_text"
          : selectedSource
      : selectedSource,
    rejected_candidates: rejectedCandidates,
    writes: {
      payload_text: visibleText,
      payload_answer: visibleText,
      payload_assistant_answer: visibleText,
      payload_selected_final_answer: visibleText,
      terminal_presentation_concise_text: visibleText,
      debug_selected_final_answer: visibleText,
    },
    integrity: {
      single_writer_applied: true,
      visible_matches_selected_artifact: !selectedArtifactTextForIntegrity || visibleText === selectedArtifactTextForIntegrity,
      visible_matches_draft: !draftText || visibleText === draftText || Boolean(selectedMaterializedAnswerText?.startsWith(draftText)),
      stale_failure_visible: isStaleWorkspaceFailureText(visibleText),
      receipt_visible_as_answer: receiptVisibleAsAnswer,
      post_tool_model_step_satisfied: latestRequiredObservationSequence < 0 || Boolean(
        draftMaterialization?.ok ||
        selectedGoalArtifact ||
        (selectedDraft && routeAllowsModelSynthesizedAnswer)
      ),
      legacy_terminal_candidate_count: legacyCandidates.length,
      forbidden_terminal_candidate_count: rejectedCandidates.filter((entry) =>
        entry.reason === "receipt_or_projection" || entry.reason === "route_contract_forbidden"
      ).length,
      payload_mirror_written_after_terminal_selection: true,
      selected_over_direct_answer_text: draftMaterialization?.ok === true && latestDirectAnswerSequence(artifacts) >= 0,
      final_answer_draft_quality_ok: draftMaterialization?.final_answer_draft_quality_gate.ok,
      final_answer_draft_quality_violations: draftMaterialization?.final_answer_draft_quality_gate.violations,
      materialized_terminal_artifact_kind: draftMaterialization?.materialized_terminal_artifact_kind ?? null,
      materialized_terminal_artifact_ref: draftMaterialization?.materialized_terminal_artifact_ref ?? null,
      materialization_blocked_reason: draftMaterialization?.blocked_reason ?? null,
    },
  };

  input.payload.terminal_authority_single_writer = result;
  input.payload.legacy_terminal_candidates = legacyCandidates;
  const debug = readRecord(input.payload.debug);
  if (debug) {
    debug.terminal_authority_single_writer = result;
    debug.legacy_terminal_candidates = legacyCandidates;
  }

  return result;
}
