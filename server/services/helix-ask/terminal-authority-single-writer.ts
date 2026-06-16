import type {
  HelixTerminalAuthoritySingleWriterResult,
  HelixTerminalCandidate,
  TerminalAuthoritySingleWriterAuditRejectionReason,
} from "@shared/helix-terminal-authority";
import {
  HELIX_COMMITTED_ASK_ROUTE_SCHEMA,
  type HelixCommittedAskRoute,
} from "@shared/helix-committed-ask-route";
import {
  applyTerminalAnswerEnvelope,
  resolveTerminalAnswerEnvelope,
} from "./terminal-answer-envelope";
import { committedRouteAllowsTerminalKind } from "./committed-ask-route";
import {
  findLatestFinalAnswerDraftCandidate,
  latestDirectAnswerSequence,
  materializeFinalAnswerDraftTerminal,
} from "./final-answer-draft-terminal-materializer";
import { attachHelixCapabilityItineraryExecutionState } from "./capability-itinerary-execution";
import {
  buildHelixLocalizedTypedFailureTextForPayload,
  isHelixGenericTypedFailureText,
} from "./language-contract";
import { liveSourceModelSynthesisMissingFailure } from "./live-source-terminal-failure-repair";
import { hashHelixTerminalText } from "./turn-terminal-authority";

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

const typedFailureAuthorityApplies = (authority: Record<string, unknown> | null): boolean =>
  readString(authority?.terminal_artifact_kind) === "typed_failure" ||
  readString(authority?.final_answer_source) === "typed_failure" ||
  readString(authority?.terminal_kind) === "failure";

export function syncHelixTypedFailureAuthorityPublicMirrors(
  payload: Record<string, unknown>,
): boolean {
  const authority = readRecord(payload.terminal_answer_authority);
  if (!typedFailureAuthorityApplies(authority)) return false;
  const compoundCoverageGate = readRecord(payload.compound_prompt_coverage_gate);
  const compoundCoverageFailedClosed = readString(compoundCoverageGate?.decision) === "FAIL_CLOSED";
  const typedFailure = readRecord(payload.typed_failure);
  const localizedFailureText = buildHelixLocalizedTypedFailureTextForPayload(payload);
  const candidateFailureText =
    readString(authority?.terminal_text_preview) ??
    readString(typedFailure?.text) ??
    readString(typedFailure?.answer_text) ??
    readString(payload.terminal_failure_text) ??
    readString(payload.selected_final_answer) ??
    localizedFailureText;
  const liveSourceFailureRepair = liveSourceModelSynthesisMissingFailure(payload, candidateFailureText);
  const failureText = liveSourceFailureRepair?.text ?? (localizedFailureText !== "I could not produce a terminal answer for this turn."
    ? localizedFailureText
    : isHelixGenericTypedFailureText(candidateFailureText)
    ? localizedFailureText
    : candidateFailureText);
  const existingErrorCode = readString(typedFailure?.error_code) ?? readString(payload.terminal_error_code);
  const errorCode =
    liveSourceFailureRepair?.code ?? (
      compoundCoverageFailedClosed && (!existingErrorCode || existingErrorCode === "terminal_consistency_violation")
      ? "compound_prompt_coverage_incomplete"
      : existingErrorCode === "terminal_consistency_violation"
        ? "typed_failure"
      : existingErrorCode ?? "typed_failure"
    );

  payload.ok = false;
  payload.response_type = "final_failure";
  payload.final_status = "final_failure";
  payload.status = "final_failure";
  payload.final_answer_source = "typed_failure";
  payload.terminal_artifact_kind = "typed_failure";
  payload.terminal_error_code = errorCode;
  payload.terminal_failure_text = failureText;
  payload.selected_final_answer = failureText;
  payload.answer = failureText;
  payload.text = failureText;
  payload.assistant_answer = failureText;
  payload.typed_failure = {
    ...(typedFailure ?? {}),
    schema: "helix.typed_failure.v1",
    error_code: errorCode,
    message: liveSourceFailureRepair ? failureText : readString(typedFailure?.message) ?? failureText,
    text: failureText,
    answer_text: failureText,
    assistant_answer: false,
    raw_content_included: false,
  };
  payload.terminal_answer_authority = {
    ...(authority ?? {}),
    terminal_kind: "failure",
    final_answer_source: "typed_failure",
    terminal_artifact_kind: "typed_failure",
    terminal_text_preview: failureText,
    terminal_text_hash: hashHelixTerminalText(failureText),
    server_authoritative: authority?.server_authoritative !== false,
  };

  const resolvedTurnSummary = readRecord(payload.resolved_turn_summary);
  if (resolvedTurnSummary) {
    payload.resolved_turn_summary = {
      ...resolvedTurnSummary,
      final_status: "final_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_error_code: errorCode,
      final_answer_source: "typed_failure",
    };
  }

  const presentation = readRecord(payload.terminal_presentation);
  if (presentation) {
    payload.terminal_presentation = {
      ...presentation,
      terminal_artifact_kind: "typed_failure",
      concise_text: failureText,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  const artifacts = Array.isArray(payload.current_turn_artifact_ledger)
    ? payload.current_turn_artifact_ledger
    : [];
  for (const artifact of artifacts) {
    const record = readRecord(artifact);
    if (!record || readString(record.kind) !== "typed_failure") continue;
    const artifactPayload = readRecord(record.payload);
    if (!artifactPayload) continue;
    if (readString(artifactPayload.error_code) !== "terminal_consistency_violation" && !compoundCoverageFailedClosed) continue;
    record.payload = {
      ...artifactPayload,
      error_code: errorCode,
      text: failureText,
      answer_text: failureText,
      terminal_consistency_repaired_by_authority_sync: true,
    };
  }

  const debug = readRecord(payload.debug);
  if (debug) {
    debug.ok = false;
    debug.response_type = "final_failure";
    debug.final_status = "final_failure";
    debug.status = "final_failure";
    debug.final_answer_source = "typed_failure";
    debug.terminal_artifact_kind = "typed_failure";
    debug.terminal_error_code = errorCode;
    debug.terminal_failure_text = failureText;
    debug.selected_final_answer = failureText;
    debug.answer = failureText;
    debug.text = failureText;
    debug.assistant_answer = failureText;
    debug.typed_failure = payload.typed_failure;
    debug.terminal_answer_authority = payload.terminal_answer_authority;
    if (payload.terminal_presentation) debug.terminal_presentation = payload.terminal_presentation;
    if (Array.isArray(payload.current_turn_artifact_ledger)) {
      debug.current_turn_artifact_ledger = payload.current_turn_artifact_ledger;
    }
  }
  return true;
}

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

const VISIBLE_ANSWER_FIELDS = [
  "payload.text",
  "payload.answer",
  "payload.assistant_answer",
  "payload.selected_final_answer",
  "terminal_presentation.concise_text",
] as const;

const isStaleModelOnlyNoObservationText = (value: unknown): boolean =>
  /\b(?:no\s+(?:accepted\s+)?observations?|no\s+(?:live[-\s]?source\s+)?context|no\s+context\s+(?:is\s+)?available|unable\s+to\s+provide\s+(?:the\s+)?context|unable\s+to\s+provide\s+(?:an\s+)?answer\s+from\s+(?:observations|context)|could\s+not\s+provide\s+(?:the\s+)?context|can't\s+provide\s+(?:the\s+)?context|cannot\s+provide\s+(?:the\s+)?context|without\s+(?:any\s+)?observations?|no\s+receipts?\s+(?:exist|available|were\s+found))\b/i.test(
    readString(value) ?? "",
  );

const isStagePlayPostObservationSynthesisText = (value: unknown): boolean =>
  /^(?:Stage Play reflected\b|Stage Play tool receipt:\s*live_env\.reflect_stage_play_context\b|Stage Play checkpoint request (?:queued|running|completed):)/i.test(
    readString(value) ?? "",
  );

const routeContractAllowedTerminalKinds = (payload: Record<string, unknown>): string[] =>
  readArray(
    readRecord(payload.committed_ask_route)?.schema === HELIX_COMMITTED_ASK_ROUTE_SCHEMA
      ? readRecord(readRecord(payload.committed_ask_route)?.canonical_goal)?.allowed_terminal_artifact_kinds
      : readRecord(payload.route_product_contract)?.allowed_terminal_artifact_kinds,
  )
    .map(readString)
    .filter((entry): entry is string => Boolean(entry));

const routeContractAllowsTerminalKind = (
  payload: Record<string, unknown>,
  kind: string,
): boolean => {
  const committedRoute = readRecord(payload.committed_ask_route);
  if (committedRoute?.schema === HELIX_COMMITTED_ASK_ROUTE_SCHEMA) {
    return committedRouteAllowsTerminalKind({
      committedRoute: committedRoute as unknown as HelixCommittedAskRoute,
      terminalArtifactKind: kind,
      finalAnswerSource: kind === "model_synthesized_answer" ? "final_answer_draft" : null,
    });
  }
  const allowed = routeContractAllowedTerminalKinds(payload);
  return allowed.length === 0 || allowed.includes(kind);
};

const routeContractRequiresScholarlyResearchAnswer = (payload: Record<string, unknown>): boolean =>
  readString(readRecord(payload.canonical_goal_frame)?.required_terminal_kind) === "scholarly_research_answer" ||
  routeContractAllowedTerminalKinds(payload).includes("scholarly_research_answer");

const routeContractRequiresInternetSearchAnswer = (payload: Record<string, unknown>): boolean =>
  readString(readRecord(payload.canonical_goal_frame)?.required_terminal_kind) === "internet_search_answer" ||
  routeContractAllowedTerminalKinds(payload).includes("internet_search_answer");

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

const nestedObservationPayloads = (artifact: ArtifactLike): Array<Record<string, unknown>> => {
  const payload = artifactPayload(artifact);
  const observation = readRecord(payload?.observation);
  const result = readRecord(payload?.result);
  return [payload, observation, result].filter((entry): entry is Record<string, unknown> => Boolean(entry));
};

const artifactMatchesObservationKind = (artifact: ArtifactLike, pattern: RegExp): boolean => {
  const values = [
    artifactKind(artifact),
    artifactSchema(artifact),
    artifactId(artifact),
    ...nestedObservationPayloads(artifact).flatMap((payload) => [
      readString(payload.schema),
      readString(payload.schemaVersion),
      readString(payload.artifactId),
      readString(payload.kind),
      readString(payload.tool_name),
      readString(payload.toolName),
      readString(payload.receipt_id),
      readString(payload.receiptId),
    ]),
  ].filter((entry): entry is string => Boolean(entry));
  return values.some((value) => pattern.test(value));
};

const normalizeSingleWriterAuditRejectionReason = (
  reason: HelixTerminalAuthoritySingleWriterResult["rejected_candidates"][number]["reason"],
): TerminalAuthoritySingleWriterAuditRejectionReason => {
  if (
    reason === "receipt_not_terminal_eligible" ||
    reason === "not_terminal_eligible" ||
    reason === "receipt_or_projection" ||
    reason === "deterministic_receipt_fallback_nonterminal"
  ) {
    return "receipt_not_terminal_eligible";
  }
  if (
    reason === "stale_model_only_after_observation" ||
    reason === "composer_claimed_no_observations_but_receipts_exist" ||
    reason === "stale_failure_candidate" ||
    reason === "legacy_direct_writer_quarantined"
  ) {
    return "stale_model_only_after_observation";
  }
  if (reason === "terminal_forbidden_by_phase_lock") return "terminal_forbidden_by_phase_lock";
  if (reason === "missing_required_observation") return "missing_required_observation";
  if (reason === "missing_evidence_reentry" || reason === "missing_post_tool_model_step") {
    return "missing_evidence_reentry";
  }
  if (
    reason === "route_contract_disallowed" ||
    reason === "route_contract_forbidden" ||
    reason === "route_contract_forbids_model_synthesized_answer" ||
    reason === "route_requires_synthesis"
  ) {
    return "route_contract_disallowed";
  }
  return "missing_required_observation";
};

const isAcceptedObservationPacket = (artifact: ArtifactLike): boolean => {
  const sourceScope = readString((artifact as Record<string, unknown>).source_scope);
  if (sourceScope === "prior_context" || sourceScope === "prior_turn_context" || sourceScope === "prior_artifact") {
    return false;
  }
  if (isPostToolObservation(artifact)) return true;
  const kind = artifactKind(artifact);
  const payload = artifactPayload(artifact);
  const ok = payload?.ok;
  if (kind === "live_environment_tool_observation" && ok !== false) return true;
  return (
    artifactMatchesObservationKind(artifact, /stage_play_processed_mail_packet/i) ||
    artifactMatchesObservationKind(artifact, /stage_play_live_source_mail_decision/i) ||
    artifactMatchesObservationKind(artifact, /helix_interim_voice_callout_receipt|live_source_interim_voice_callout_receipt|voice_hold_receipt|voice_block_receipt|voice_receipt/i)
  );
};

const isFinalAnswerDraft = (artifact: ArtifactLike): boolean =>
  artifactKind(artifact) === "final_answer_draft" ||
  artifactSchema(artifact) === "helix.final_answer_draft.v1";

const isDirectAnswerText = (artifact: ArtifactLike): boolean =>
  artifactKind(artifact) === "direct_answer_text" ||
  artifactSchema(artifact) === "helix.direct_answer_text.v1";

const committedModelOnlyDirectAnswerRoute = (payload: Record<string, unknown>): boolean => {
  const committedRoute = readRecord(payload.committed_ask_route);
  if (committedRoute?.schema !== HELIX_COMMITTED_ASK_ROUTE_SCHEMA) return false;
  const route = readRecord(committedRoute.route);
  const goal = readRecord(committedRoute.canonical_goal);
  return (
    readString(route?.source_target) === "model_only" &&
    readString(goal?.goal_kind) === "model_only_concept" &&
    readString(goal?.required_terminal_kind) === "direct_answer_text"
  );
};

const findLatestDirectAnswerTerminal = (
  payload: Record<string, unknown>,
  artifacts: ArtifactLike[],
): { artifact: ArtifactLike; text: string; ref: string | null } | null => {
  if (!committedModelOnlyDirectAnswerRoute(payload)) return null;
  if (!routeContractAllowsTerminalKind(payload, "direct_answer_text")) return null;
  for (let index = artifacts.length - 1; index >= 0; index -= 1) {
    const artifact = artifacts[index];
    if (!artifact || !isDirectAnswerText(artifact)) continue;
    const text = artifactText(artifact);
    if (!text || isStaleWorkspaceFailureText(text)) continue;
    return { artifact, text, ref: artifactId(artifact) };
  }
  const directAnswer = readRecord(payload.direct_answer_text);
  const text = readString(directAnswer?.answer_text) ?? readString(directAnswer?.text);
  if (!text || isStaleWorkspaceFailureText(text)) return null;
  return {
    artifact: {
      kind: "direct_answer_text",
      artifact_id: readString(directAnswer?.artifact_id) ?? undefined,
      payload: directAnswer,
    },
    text,
    ref: readString(directAnswer?.artifact_id),
  };
};

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
    : /^Stage Play job planned\b/i.test(text ?? "")
      ? text!
    : /^Stage Play/i.test(text ?? "")
      ? stagePlayReceiptPendingText
      : text || stagePlayReceiptPendingText;
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

const attachItineraryExecutionState = (
  payload: Record<string, unknown>,
  artifacts: ArtifactLike[],
): string[] => {
  return attachHelixCapabilityItineraryExecutionState(payload, artifacts);
};

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

const findLiveEnvironmentBindingDiagnosisTerminal = (
  payload: Record<string, unknown>,
): { kind: "live_environment_binding_diagnosis"; text: string; ref: string | null } | null => {
  if (readString(payload.terminal_artifact_kind) !== "live_environment_binding_diagnosis") return null;
  if (readString(payload.final_answer_source) !== "live_environment_binding_diagnosis") return null;
  if (!routeContractAllowsTerminalKind(payload, "live_environment_binding_diagnosis")) return null;
  const goal = readRecord(payload.canonical_goal_frame);
  const requiredTerminalKind = readString(goal?.required_terminal_kind);
  if (readString(goal?.goal_kind) !== "live_environment_binding_diagnosis") return null;
  if (requiredTerminalKind && requiredTerminalKind !== "live_environment_binding_diagnosis") return null;
  const diagnosis = readRecord(payload.live_environment_binding_diagnosis);
  if (!/^helix\.live_environment_binding_diagnosis\.v\d+$/i.test(readString(diagnosis?.schema) ?? "")) return null;
  if (diagnosis?.assistant_answer !== false || diagnosis?.raw_content_included !== false) return null;
  const text =
    readString(payload.selected_final_answer) ??
    readString(payload.answer) ??
    readString(payload.text) ??
    readString(readRecord(payload.terminal_presentation)?.concise_text);
  if (!text || isStaleWorkspaceFailureText(text) || isStaleModelOnlyNoObservationText(text)) return null;
  return {
    kind: "live_environment_binding_diagnosis",
    text,
    ref: readString(payload.terminal_artifact_id) ?? readString(diagnosis?.diagnosis_id),
  };
};

const findGoalSatisfyingDocumentArtifact = (
  payload: Record<string, unknown>,
  artifacts: ArtifactLike[],
): { artifact: ArtifactLike; kind: "doc_summary"; text: string; ref: string | null } | null => {
  const goal = readRecord(payload.canonical_goal_frame);
  if (readString(goal?.required_terminal_kind) !== "doc_summary") return null;
  if (!routeContractAllowsTerminalKind(payload, "doc_summary")) return null;
  for (let index = artifacts.length - 1; index >= 0; index -= 1) {
    const artifact = artifacts[index];
    if (!artifact || artifactKind(artifact) !== "doc_summary") continue;
    const text = artifactText(artifact);
    if (!text || isStaleWorkspaceFailureText(text)) continue;
    return { artifact, kind: "doc_summary", text, ref: artifactId(artifact) };
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
    isAcceptedObservationPacket(artifact) ? index : latest, -1);
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
    isAcceptedObservationPacket(artifact) ? index : latest, -1);
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
  const priorTerminalPresentation = readRecord(input.payload.terminal_presentation);
  const forbiddenPreAuthorityVisibleFields = [
    priorPayloadFields.text ? "payload.text" : null,
    priorPayloadFields.answer ? "payload.answer" : null,
    priorPayloadFields.assistant_answer ? "payload.assistant_answer" : null,
    priorPayloadFields.selected_final_answer ? "payload.selected_final_answer" : null,
    readString(priorTerminalPresentation?.concise_text) ? "terminal_presentation.concise_text" : null,
  ].filter((entry): entry is typeof VISIBLE_ANSWER_FIELDS[number] => Boolean(entry));

  const rejectedCandidates: HelixTerminalAuthoritySingleWriterResult["rejected_candidates"] = [];
  const rawSolverContinuationPending =
    readRecord(input.payload.solver_continuation_observation)?.schema === "helix.solver_continuation_observation.v1" &&
    readString(readRecord(input.payload.solver_continuation_observation)?.required_next_step) !== "typed_failure";
  const compoundCoverageGate = readRecord(input.payload.compound_prompt_coverage_gate);
  const compoundCoverageFailedClosed =
    readString(compoundCoverageGate?.decision) === "FAIL_CLOSED";
  const draftMaterialization = compoundCoverageFailedClosed
    ? null
    : materializeFinalAnswerDraftTerminal({
        turnId: input.turnId,
        payload: input.payload,
        artifactLedger: artifacts,
        routeProductContract: readRecord(input.payload.route_product_contract),
      });
  const missingItineraryFamilies = attachItineraryExecutionState(input.payload, artifacts);
  const itineraryObservationCriteriaSatisfied = missingItineraryFamilies.length === 0;
  const acceptedObservationArtifacts = artifacts.filter(isAcceptedObservationPacket);
  const hasAcceptedObservation = acceptedObservationArtifacts.length > 0;
  const latestDraftCandidateForStaleCheck = findLatestFinalAnswerDraftCandidate(artifacts);
  const materializedDraftRejectedForStaleObservation =
    draftMaterialization?.ok === true &&
    hasAcceptedObservation &&
    isStaleModelOnlyNoObservationText(latestDraftCandidateForStaleCheck?.text);
  const usableDraftMaterialization =
    draftMaterialization?.ok === true &&
    !materializedDraftRejectedForStaleObservation &&
    itineraryObservationCriteriaSatisfied;
  if (draftMaterialization) {
    input.payload.final_answer_draft_selection = {
      candidate_count: artifacts.filter(isFinalAnswerDraft).length,
      latest_final_answer_draft_ref: draftMaterialization.final_answer_draft_ref,
      latest_final_answer_draft_sequence: findLatestFinalAnswerDraftCandidate(artifacts)?.sequence ?? null,
      latest_final_answer_draft_quality_ok: draftMaterialization.final_answer_draft_quality_gate.ok,
      latest_final_answer_draft_quality_violations: draftMaterialization.final_answer_draft_quality_gate.violations,
      materialized_terminal_artifact_kind: draftMaterialization.materialized_terminal_artifact_kind ?? null,
      materialized_terminal_artifact_ref: draftMaterialization.materialized_terminal_artifact_ref ?? null,
      selected_over_direct_answer_text: usableDraftMaterialization && latestDirectAnswerSequence(artifacts) >= 0,
      rejected_direct_answer_text_reason:
        usableDraftMaterialization && latestDirectAnswerSequence(artifacts) >= 0
          ? "later_valid_final_answer_draft"
          : null,
      blocked_reason: materializedDraftRejectedForStaleObservation
        ? "composer_claimed_no_observations_but_receipts_exist"
        : !itineraryObservationCriteriaSatisfied
          ? "capability_itinerary_observations_missing"
        : draftMaterialization.blocked_reason ?? null,
    };
    input.payload.route_terminal_materialization = {
      route_family: draftMaterialization.final_answer_draft_quality_gate.route_family,
      source_target: readString(readRecord(input.payload.route_product_contract)?.source_target),
      required_terminal_kind: readString(readRecord(input.payload.canonical_goal_frame)?.required_terminal_kind),
      allowed_terminal_artifact_kinds: draftMaterialization.route_allowed_terminal_artifact_kinds,
      materialization_attempted: true,
      materialization_ok: usableDraftMaterialization,
      materialization_blocked_reason: draftMaterialization.blocked_reason ?? null,
      capability_itinerary_observation_missing_families: missingItineraryFamilies,
      stale_model_only_blocked_reason: materializedDraftRejectedForStaleObservation
        ? "composer_claimed_no_observations_but_receipts_exist"
        : null,
    };
  }
  if (materializedDraftRejectedForStaleObservation) {
    rejectedCandidates.push({
      ref: latestDraftCandidateForStaleCheck?.ref ?? undefined,
      kind: draftMaterialization?.materialized_terminal_artifact_kind ?? "model_synthesized_answer",
      source: "final_answer_draft",
      reason: "composer_claimed_no_observations_but_receipts_exist",
    });
  }
  const goalEvaluation = readRecord(input.payload.goal_satisfaction_evaluation);
  const goalAllowsTerminal =
    readString(goalEvaluation?.satisfaction) === "satisfied" ||
    readString(goalEvaluation?.next_decision) === "allow_terminal";
  const selectedDirectAnswerTerminal =
    goalAllowsTerminal
      ? findLatestDirectAnswerTerminal(input.payload, artifacts)
      : null;
  const repoTerminalMaterialized =
    usableDraftMaterialization &&
    draftMaterialization.materialized_terminal_artifact_kind === "repo_code_evidence_answer";
  const scholarlyTerminalMaterialized =
    usableDraftMaterialization &&
    draftMaterialization.materialized_terminal_artifact_kind === "scholarly_research_answer";
  const docsTerminalMaterialized =
    usableDraftMaterialization &&
    draftMaterialization.materialized_terminal_artifact_kind === "doc_evidence_synthesis_answer";
  const latestDraftForContinuation = findLatestFinalAnswerDraftCandidate(artifacts);
  const stagePlayTerminalMaterialized =
    usableDraftMaterialization &&
    isStagePlayPostObservationSynthesisText(latestDraftForContinuation?.text);
  const solverContinuationPending =
    rawSolverContinuationPending &&
    !(
      (repoTerminalMaterialized && goalAllowsTerminal) ||
      (docsTerminalMaterialized && goalAllowsTerminal) ||
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
  } else if (rawSolverContinuationPending && docsTerminalMaterialized && goalAllowsTerminal) {
    rejectedCandidates.push({
      kind: "typed_failure",
      reason: "stale_solver_continuation_superseded_by_docs_terminal",
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
  const selectedDraftCandidate = compoundCoverageFailedClosed ? null : findSelectedDraftAfterRequiredObservation(artifacts);
  const selectedDraftRejectedForStaleObservation =
    Boolean(selectedDraftCandidate && hasAcceptedObservation && isStaleModelOnlyNoObservationText(artifactText(selectedDraftCandidate.artifact)));
  if (selectedDraftCandidate && !itineraryObservationCriteriaSatisfied) {
    rejectedCandidates.push({
      ref: artifactId(selectedDraftCandidate.artifact) ?? undefined,
      kind: "model_synthesized_answer",
      source: "final_answer_draft",
      reason: "missing_required_observation",
    });
  } else if (selectedDraftCandidate && selectedDraftRejectedForStaleObservation && !materializedDraftRejectedForStaleObservation) {
    rejectedCandidates.push({
      ref: artifactId(selectedDraftCandidate.artifact) ?? undefined,
      kind: "model_synthesized_answer",
      source: "final_answer_draft",
      reason: "composer_claimed_no_observations_but_receipts_exist",
    });
  }
  const selectedDraft =
    selectedDraftRejectedForStaleObservation || !itineraryObservationCriteriaSatisfied
      ? null
      : selectedDraftCandidate;
  const deterministicReceiptFallbackDraft = selectedDraft
    ? null
    : findDeterministicReceiptFallbackDraftAfterRequiredObservation(artifacts);
  const selectedGoalArtifact =
    findGoalSatisfyingDocumentArtifact(input.payload, artifacts) ??
    findGoalSatisfyingVisualSituationArtifact(input.payload, artifacts);
  const selectedLiveEnvironmentBindingDiagnosis = findLiveEnvironmentBindingDiagnosisTerminal(input.payload);
  const latestRequiredObservationSequence = selectedDraft?.latestObservationSequence ??
    artifacts.reduce((latest, artifact, index) => isAcceptedObservationPacket(artifact) ? index : latest, -1);
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
  const internetSearchAnswerSynthesisMissing =
    routeContractRequiresInternetSearchAnswer(input.payload) &&
    artifacts.some((artifact) => /internet_search_observation/i.test([artifactKind(artifact), artifactSchema(artifact)].join(" ")));

  if (draftMaterialization?.ok === true && !itineraryObservationCriteriaSatisfied) {
    rejectedCandidates.push({
      ref: draftMaterialization.materialized_terminal_artifact_ref ?? draftMaterialization.final_answer_draft_ref ?? undefined,
      kind: draftMaterialization.materialized_terminal_artifact_kind ?? "model_synthesized_answer",
      source: "final_answer_draft",
      reason: "missing_required_observation",
    });
  }
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
    if (hasAcceptedObservation && isStaleModelOnlyNoObservationText(value)) {
      rejectedCandidates.push({
        kind: readString(input.payload.terminal_artifact_kind) ?? "direct_answer_text",
        source: readString(input.payload.final_answer_source) ?? "legacy_fallback",
        reason: "stale_model_only_after_observation",
      });
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

  if (compoundCoverageFailedClosed) {
    const unresolved = readArray(compoundCoverageGate?.unresolved_requirement_ids)
      .map(readString)
      .filter((entry): entry is string => Boolean(entry));
    const failedClosed = readArray(compoundCoverageGate?.resolutions)
      .map(readRecord)
      .filter((entry): entry is Record<string, unknown> => Boolean(entry))
      .filter((entry) => readString(entry.status) === "failed_closed")
      .map((entry) => readString(entry.requirement_id))
      .filter((entry): entry is string => Boolean(entry));
    const missingRequirements = unresolved.length > 0 ? unresolved : failedClosed;
    const terminalErrorCode = "compound_prompt_coverage_incomplete";
    const terminalErrorText = missingRequirements.length > 0
      ? `I could not complete this compound turn because required prompt items failed closed or remain unresolved: ${missingRequirements.join(", ")}.`
      : "I could not complete this compound turn because required prompt coverage failed closed.";
    const latestDraft = findLatestFinalAnswerDraftCandidate(artifacts);
    if (latestDraft) {
      rejectedCandidates.push({
        ref: latestDraft.ref ?? undefined,
        kind: "model_synthesized_answer",
        source: "final_answer_draft",
        reason: "missing_required_observation",
      });
    }
    input.payload.ok = false;
    input.payload.response_type = "final_failure";
    input.payload.final_status = "final_failure";
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
      unresolved_requirement_ids: unresolved,
      failed_closed_requirement_ids: failedClosed,
      assistant_answer: false,
      raw_content_included: false,
    };
    selectedArtifactKind = "typed_failure";
    selectedSource = "typed_failure";
  } else if (!solverContinuationPending && !itineraryObservationCriteriaSatisfied) {
    const terminalErrorCode = "capability_itinerary_observations_missing";
    const terminalErrorText = `I could not complete this turn because required itinerary observations are missing: ${missingItineraryFamilies.join(", ")}.`;
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
      missing_itinerary_observation_families: missingItineraryFamilies,
      assistant_answer: false,
      raw_content_included: false,
    };
    selectedArtifactKind = "typed_failure";
    selectedSource = "typed_failure";
  } else if (!solverContinuationPending && selectedDirectAnswerTerminal) {
    selectedArtifactRef = selectedDirectAnswerTerminal.ref;
    selectedArtifactKind = "direct_answer_text";
    selectedSource = "direct_answer_text";
    quarantineStaleRequestUserInput(input.payload);
    input.payload.ok = true;
    input.payload.response_type = "final_answer";
    input.payload.final_status = "final_answer";
    input.payload.terminal_artifact_kind = "direct_answer_text";
    input.payload.final_answer_source = "model_direct_answer";
    input.payload.selected_final_answer = selectedDirectAnswerTerminal.text;
    input.payload.answer = selectedDirectAnswerTerminal.text;
    input.payload.text = selectedDirectAnswerTerminal.text;
    input.payload.assistant_answer = selectedDirectAnswerTerminal.text;
    input.payload.terminal_artifact_id = selectedDirectAnswerTerminal.ref ?? undefined;
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: "direct_answer_text",
      concise_text: selectedDirectAnswerTerminal.text,
      assistant_answer: false,
      raw_content_included: false,
    };
    delete input.payload.terminal_error_code;
  } else if (!solverContinuationPending && selectedLiveEnvironmentBindingDiagnosis) {
    selectedArtifactRef = selectedLiveEnvironmentBindingDiagnosis.ref;
    selectedArtifactKind = selectedLiveEnvironmentBindingDiagnosis.kind;
    selectedSource = "live_environment_binding_diagnosis";
    quarantineStaleRequestUserInput(input.payload);
    input.payload.ok = true;
    input.payload.response_type = "final_answer";
    input.payload.final_status = "final_answer";
    input.payload.terminal_artifact_kind = selectedLiveEnvironmentBindingDiagnosis.kind;
    input.payload.final_answer_source = selectedLiveEnvironmentBindingDiagnosis.kind;
    input.payload.selected_final_answer = selectedLiveEnvironmentBindingDiagnosis.text;
    input.payload.answer = selectedLiveEnvironmentBindingDiagnosis.text;
    input.payload.text = selectedLiveEnvironmentBindingDiagnosis.text;
    input.payload.assistant_answer = selectedLiveEnvironmentBindingDiagnosis.text;
    input.payload.terminal_artifact_id = selectedLiveEnvironmentBindingDiagnosis.ref ?? undefined;
    input.payload.terminal_presentation = {
      ...(readRecord(input.payload.terminal_presentation) ?? {}),
      schema: "helix.terminal_presentation.v1",
      turn_id: input.turnId,
      terminal_artifact_kind: selectedLiveEnvironmentBindingDiagnosis.kind,
      concise_text: selectedLiveEnvironmentBindingDiagnosis.text,
      assistant_answer: false,
      raw_content_included: false,
    };
    delete input.payload.terminal_error_code;
  } else if (!solverContinuationPending && selectedGoalArtifact) {
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
  } else if (!solverContinuationPending && usableDraftMaterialization) {
    const latestDraft = findLatestFinalAnswerDraftCandidate(artifacts);
    selectedArtifactRef = draftMaterialization.materialized_terminal_artifact_ref ?? latestDraft?.ref ?? null;
    selectedArtifactKind = draftMaterialization.materialized_terminal_artifact_kind ?? "model_synthesized_answer";
    const materializedScholarlyAnswer =
      selectedArtifactKind === "scholarly_research_answer"
        ? readRecord(input.payload.scholarly_research_answer)
        : null;
    const materializedInternetSearchAnswer =
      selectedArtifactKind === "internet_search_answer"
        ? readRecord(input.payload.internet_search_answer)
        : null;
    const materializedDocEvidenceSynthesisAnswer =
      selectedArtifactKind === "doc_evidence_synthesis_answer"
        ? readRecord(input.payload.doc_evidence_synthesis_answer)
        : null;
    const materializedCompoundResearchLocatorAnswer =
      selectedArtifactKind === "compound_research_locator_answer"
        ? readRecord(input.payload.compound_research_locator_answer)
        : null;
    const baseText =
      readString(materializedCompoundResearchLocatorAnswer?.answer_text) ??
      readString(materializedCompoundResearchLocatorAnswer?.text) ??
      readString(materializedDocEvidenceSynthesisAnswer?.answer_text) ??
      readString(materializedDocEvidenceSynthesisAnswer?.text) ??
      readString(materializedScholarlyAnswer?.answer_text) ??
      readString(materializedScholarlyAnswer?.text) ??
      readString(materializedInternetSearchAnswer?.answer_text) ??
      readString(materializedInternetSearchAnswer?.text) ??
      latestDraft?.text ??
      readString(input.payload.selected_final_answer) ??
      "I could not produce a terminal answer for this turn.";
    const citationFooter =
      selectedArtifactKind === "scholarly_research_answer" ||
      selectedArtifactKind === "compound_research_locator_answer"
        ? appendScholarlyCitationFooter(baseText, artifacts)
        : { text: baseText, citations: [] as ScholarlyCitation[], footer: null };
    const text = citationFooter.text;
    if (materializedCompoundResearchLocatorAnswer) {
      materializedCompoundResearchLocatorAnswer.text = text;
      materializedCompoundResearchLocatorAnswer.answer_text = text;
      materializedCompoundResearchLocatorAnswer.citations = citationFooter.citations;
      materializedCompoundResearchLocatorAnswer.citation_footer = citationFooter.footer;
    }
    if (materializedScholarlyAnswer) {
      materializedScholarlyAnswer.text = text;
      materializedScholarlyAnswer.answer_text = text;
      materializedScholarlyAnswer.citations = citationFooter.citations;
      materializedScholarlyAnswer.citation_footer = citationFooter.footer;
    }
    if (materializedInternetSearchAnswer) {
      materializedInternetSearchAnswer.text = text;
      materializedInternetSearchAnswer.answer_text = text;
    }
    if (materializedDocEvidenceSynthesisAnswer) {
      materializedDocEvidenceSynthesisAnswer.text = text;
      materializedDocEvidenceSynthesisAnswer.answer_text = text;
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
      : internetSearchAnswerSynthesisMissing
      ? "internet_search_answer_synthesis_failed_after_observation"
      : "post_tool_model_step_missing";
    const terminalErrorText = scholarlyAnswerSynthesisMissing
      ? "I could not complete this scholarly research turn because PDF/full-text evidence was observed, but no valid model-authored scholarly answer passed terminal authority."
      : internetSearchAnswerSynthesisMissing
      ? "I could not complete this internet search turn because web evidence was observed, but no valid model-authored internet search answer passed terminal authority."
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
    readString(readRecord(input.payload.compound_research_locator_answer)?.answer_text) ??
    readString(readRecord(input.payload.doc_evidence_synthesis_answer)?.answer_text) ??
    readString(readRecord(input.payload.scholarly_research_answer)?.answer_text) ??
    readString(readRecord(input.payload.internet_search_answer)?.answer_text) ??
    readString(readRecord(input.payload.repo_code_evidence_answer)?.answer_text);
  const selectedArtifactTextForIntegrity = selectedMaterializedAnswerText ?? draftText;
  const receiptVisibleAsAnswer = artifacts.some((artifact) => {
    if (!isForbiddenReceiptOrProjection(artifact)) return false;
    const text = artifactText(artifact);
    return Boolean(text && text === visibleText);
  });
  const wroteVisibleFields = [...VISIBLE_ANSWER_FIELDS];
  const envelopeTerminalKind =
    appliedEnvelope.terminal_artifact_kind === "typed_failure" ||
    appliedEnvelope.final_answer_source === "typed_failure" ||
    appliedEnvelope.terminal_artifact_kind === "request_user_input" ||
    appliedEnvelope.terminal_artifact_kind === "direct_answer_text"
      ? appliedEnvelope.terminal_artifact_kind
      : null;
  const selectedTerminalArtifactKind = envelopeTerminalKind ?? selectedArtifactKind ?? null;
  const resultSource =
    appliedEnvelope.terminal_artifact_kind === "typed_failure" ||
    appliedEnvelope.final_answer_source === "typed_failure"
      ? "typed_failure"
      : appliedEnvelope.terminal_artifact_kind === "request_user_input"
        ? "request_user_input"
        : appliedEnvelope.terminal_artifact_kind === "direct_answer_text"
          ? "direct_answer_text"
          : selectedSource === "terminal_authority_repair_failure"
            ? selectedSource
            : selectedSource;
  const selectedArtifactRefForResult =
    selectedTerminalArtifactKind &&
    selectedTerminalArtifactKind !== "typed_failure" &&
    /^typed_failure:/i.test(selectedArtifactRef ?? "")
      ? `${selectedTerminalArtifactKind}:${textHash(`${input.turnId}:${visibleText}`)}`
      : selectedArtifactRef;
  const auditRejectedCandidates = rejectedCandidates.map((candidate) => ({
    artifactKind: candidate.kind,
    artifactRef: candidate.ref,
    reason: normalizeSingleWriterAuditRejectionReason(candidate.reason),
  }));
  const terminalAuthoritySingleWriterAudit = {
    artifactId: "terminal_authority_single_writer" as const,
    schemaVersion: "helix.terminal_authority_single_writer.v1" as const,
    selectedArtifactKind: selectedTerminalArtifactKind,
    selectedArtifactRef: selectedArtifactRefForResult,
    rejectedCandidates: auditRejectedCandidates,
    wroteVisibleFields,
    forbiddenPreAuthorityVisibleFields,
  };
  const result: HelixTerminalAuthoritySingleWriterResult = {
    schema: "helix.terminal_authority_single_writer_result.v1",
    artifactId: "terminal_authority_single_writer",
    schemaVersion: "helix.terminal_authority_single_writer.v1",
    turn_id: input.turnId,
    selectedArtifactKind: selectedTerminalArtifactKind,
    selectedArtifactRef: selectedArtifactRefForResult,
    selected_terminal_artifact_ref: selectedArtifactRefForResult,
    selected_terminal_artifact_kind: selectedTerminalArtifactKind,
    visible_text: visibleText,
    assistant_answer: false,
    source: resultSource,
    rejected_candidates: rejectedCandidates,
    writes: {
      payload_text: visibleText,
      payload_answer: visibleText,
      payload_assistant_answer: visibleText,
      payload_selected_final_answer: visibleText,
      terminal_presentation_concise_text: visibleText,
      debug_selected_final_answer: visibleText,
    },
    wroteVisibleFields,
    forbiddenPreAuthorityVisibleFields,
    audit: terminalAuthoritySingleWriterAudit,
    integrity: {
      single_writer_applied: true,
      terminal_authority_single_writer_audit: terminalAuthoritySingleWriterAudit,
      forbidden_pre_authority_visible_fields: forbiddenPreAuthorityVisibleFields,
      visible_matches_selected_artifact: !selectedArtifactTextForIntegrity || visibleText === selectedArtifactTextForIntegrity,
      visible_matches_draft: !draftText || visibleText === draftText || Boolean(selectedMaterializedAnswerText?.startsWith(draftText)),
      stale_failure_visible: isStaleWorkspaceFailureText(visibleText),
      receipt_visible_as_answer: receiptVisibleAsAnswer,
      post_tool_model_step_satisfied: latestRequiredObservationSequence < 0 || Boolean(
        usableDraftMaterialization ||
        selectedGoalArtifact ||
        (selectedDraft && routeAllowsModelSynthesizedAnswer)
      ),
      legacy_terminal_candidate_count: legacyCandidates.length,
      forbidden_terminal_candidate_count: rejectedCandidates.filter((entry) =>
        entry.reason === "receipt_or_projection" || entry.reason === "route_contract_forbidden"
      ).length,
      payload_mirror_written_after_terminal_selection: true,
      selected_over_direct_answer_text: usableDraftMaterialization && latestDirectAnswerSequence(artifacts) >= 0,
      final_answer_draft_quality_ok: draftMaterialization?.final_answer_draft_quality_gate.ok,
      final_answer_draft_quality_violations: draftMaterialization?.final_answer_draft_quality_gate.violations,
      materialized_terminal_artifact_kind: draftMaterialization?.materialized_terminal_artifact_kind ?? null,
      materialized_terminal_artifact_ref: draftMaterialization?.materialized_terminal_artifact_ref ?? null,
      materialization_blocked_reason: draftMaterialization?.blocked_reason ?? null,
    },
  };

  input.payload.terminal_authority_single_writer = result;
  input.payload.terminal_candidate_rejections = auditRejectedCandidates;
  input.payload.legacy_terminal_candidates = legacyCandidates;
  const debug = readRecord(input.payload.debug);
  if (debug) {
    debug.terminal_authority_single_writer = result;
    debug.terminal_candidate_rejections = auditRejectedCandidates;
    debug.legacy_terminal_candidates = legacyCandidates;
  }

  return result;
}
