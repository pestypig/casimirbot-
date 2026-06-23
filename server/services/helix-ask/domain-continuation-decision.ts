import {
  buildDocEvidenceSynthesisPlan,
  collectDocEvidenceForSynthesis,
  evaluateDocEvidenceSynthesisCoverage,
} from "./doc-evidence-synthesis";
import type { HelixCommittedAskRoute } from "@shared/helix-committed-ask-route";

export type HelixDomainContinuationAction = {
  schema_version: "helix.workstation.action/v1";
  action: "run_panel_action";
  panel_id: string;
  action_id: string;
  args: Record<string, unknown>;
};

export type HelixDomainContinuationCapabilityHint = {
  schema: "helix.domain_continuation_capability_hint.v1";
  authority: "hint_only_agent_must_decide";
  capability_key: string;
  suggested_action: HelixDomainContinuationAction;
  suggested_args: Record<string, unknown>;
  reason: string;
};

export type HelixDomainContinuationDecision = {
  schema: "helix.domain_continuation_hint.v1";
  turn_id: string;
  goal_kind: string;
  decision: "none" | "continue" | "retry" | "typed_failure" | "request_user_input";
  reason: string;
  docs_continuation_contract?: HelixDocsContinuationContract;
  recommended_capability_hint?: HelixDomainContinuationCapabilityHint;
  expected_artifacts?: string[];
  typed_failure_code?: string;
  repair_candidate?: Record<string, unknown>;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixDocsContinuationContract = {
  schema: "helix.docs_continuation_contract.v1";
  current_docs_phase:
    | "search_required"
    | "candidate_validation_required"
    | "open_validated_doc_required"
    | "summary_required"
    | "explicit_path_open_required"
    | "multi_doc_summary_required"
    | "location_required"
    | "synthesis_required"
    | "terminal_ready"
    | "blocked";
  prior_observation_kind: string | null;
  prior_observation_refs: string[];
  required_next_capability: string | null;
  forbidden_repeated_capabilities: string[];
  required_action_args?: Record<string, unknown> | null;
  expected_next_artifact: string | null;
  expected_next_artifacts: string[];
  done_condition: string;
  terminal_block_reason_if_missing: string | null;
  model_visible_instruction: string;
  assistant_answer: false;
  raw_content_included: false;
};

type DomainContinuationInput = {
  turnId: string;
  prompt: string;
  payload: Record<string, unknown>;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readString = (value: unknown): string | null => {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
};

const readArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const normalizePath = (value: unknown): string | null => {
  const text = readString(value)?.replace(/\\/g, "/");
  if (!text) return null;
  return text.startsWith("/") ? text : `/${text.replace(/^\/+/, "")}`;
};

const action = (panelId: string, actionId: string, args: Record<string, unknown> = {}): HelixDomainContinuationAction => ({
  schema_version: "helix.workstation.action/v1",
  action: "run_panel_action",
  panel_id: panelId,
  action_id: actionId,
  args,
});

const capabilityHint = (
  suggestedAction: HelixDomainContinuationAction,
  reason: string,
): HelixDomainContinuationCapabilityHint => ({
  schema: "helix.domain_continuation_capability_hint.v1",
  authority: "hint_only_agent_must_decide",
  capability_key: `${suggestedAction.panel_id}.${suggestedAction.action_id}`,
  suggested_action: suggestedAction,
  suggested_args: suggestedAction.args,
  reason,
});

const continuation = (
  input: DomainContinuationInput,
  goalKind: string,
  decision: HelixDomainContinuationDecision["decision"],
  reason: string,
  extra: Omit<Partial<HelixDomainContinuationDecision>, "schema" | "turn_id" | "goal_kind" | "decision" | "reason" | "assistant_answer" | "raw_content_included"> = {},
): HelixDomainContinuationDecision => ({
  schema: "helix.domain_continuation_hint.v1",
  turn_id: input.turnId,
  goal_kind: goalKind,
  decision,
  reason,
  assistant_answer: false,
  raw_content_included: false,
  ...extra,
});

const getLedger = (payload: Record<string, unknown>): Record<string, unknown>[] =>
  readArray(payload.current_turn_artifact_ledger).map(asRecord).filter((entry): entry is Record<string, unknown> => Boolean(entry));

const artifactPayload = (artifact: Record<string, unknown> | null): Record<string, unknown> | null =>
  asRecord(artifact?.payload) ?? artifact;

const findArtifactPayload = (
  payload: Record<string, unknown>,
  kinds: string[],
): Record<string, unknown> | null => {
  for (const artifact of getLedger(payload)) {
    if (kinds.includes(String(artifact.kind ?? ""))) return artifactPayload(artifact);
  }
  for (const kind of kinds) {
    const direct = asRecord(payload[kind]);
    if (direct) return direct;
  }
  return null;
};

const artifactRefsForKinds = (payload: Record<string, unknown>, kinds: string[]): string[] =>
  getLedger(payload)
    .filter((artifact) => kinds.includes(String(artifact.kind ?? "")))
    .map((artifact) => readString(artifact.artifact_id) ?? readString(artifact.id))
    .filter((ref): ref is string => Boolean(ref));

const runtimeCapabilityValidationCount = (payload: Record<string, unknown>, capability: string): number =>
  getLedger(payload).filter((artifact) => {
    if (String(artifact.kind ?? "") !== "runtime_tool_call_validation") return false;
    const record = artifactPayload(artifact);
    return readString(record?.capability_key) === capability;
  }).length;

const repairedDocEvidenceSearchQuery = (prompt: string): string => {
  const terms = [
    /\bNHM[-\s]?2\b/i.test(prompt) ? "NHM2" : null,
    /\bcasimir\b/i.test(prompt) ? "Casimir" : null,
    /\btile\b/i.test(prompt) ? "tile" : null,
    /\b(?:newtons?|N)\b/i.test(prompt) ? "newtons" : null,
    /\b(?:lbs?|pounds?)\b/i.test(prompt) ? "lbs" : null,
    /\bload[-\s]?bearing|capacity\b/i.test(prompt) ? "load bearing capacity" : null,
    /\bwhite\s*paper|whitepaper|paper\b/i.test(prompt) ? "whitepaper" : null,
  ].filter((entry): entry is string => Boolean(entry));
  return terms.length > 0 ? Array.from(new Set(terms)).join(" ") : prompt;
};

const docsContract = (args: {
  phase: HelixDocsContinuationContract["current_docs_phase"];
  priorKind: string | null;
  priorRefs: string[];
  requiredCapability: string | null;
  requiredActionArgs?: Record<string, unknown> | null;
  forbiddenRepeatedCapabilities?: string[];
  expectedArtifacts?: string[];
  doneCondition?: string;
  terminalBlockReason?: string | null;
  instruction: string;
}): HelixDocsContinuationContract => ({
  schema: "helix.docs_continuation_contract.v1",
  current_docs_phase: args.phase,
  prior_observation_kind: args.priorKind,
  prior_observation_refs: args.priorRefs,
  required_next_capability: args.requiredCapability,
  forbidden_repeated_capabilities: args.forbiddenRepeatedCapabilities ?? [],
  required_action_args: args.requiredActionArgs ?? null,
  expected_next_artifact: args.expectedArtifacts?.[0] ?? null,
  expected_next_artifacts: args.expectedArtifacts ?? [],
  done_condition: args.doneCondition ?? "terminal answer is allowed only after doc_summary satisfies the goal",
  terminal_block_reason_if_missing: args.terminalBlockReason ?? null,
  model_visible_instruction: args.instruction,
  assistant_answer: false,
  raw_content_included: false,
});

const hasAction = (payload: Record<string, unknown>, panelId: string, actionId: string): boolean => {
  const actionMatches = (value: unknown): boolean => {
    const record = asRecord(value);
    if (!record) return false;
    return record.panel_id === panelId && record.action_id === actionId;
  };
  if (actionMatches(payload.workspace_action)) return true;
  const envelope = asRecord(payload.action_envelope);
  if (readArray(envelope?.workstation_actions).some(actionMatches)) return true;
  return getLedger(payload).some((artifact) => {
    const candidate = artifactPayload(artifact);
    if (actionMatches(candidate)) return true;
    const nested = asRecord(candidate?.action) ?? asRecord(candidate?.workspace_action);
    return actionMatches(nested);
  });
};

const goalKindFromPayload = (payload: Record<string, unknown>, prompt: string): string => {
  const evaluation = asRecord(payload.goal_satisfaction_evaluation);
  const contract = asRecord(evaluation?.terminal_contract);
  const contractGoal = readString(contract?.goal_kind);
  if (contractGoal && contractGoal !== "panel_control") return contractGoal;
  const evaluationGoal = readString(evaluation?.canonical_goal_kind);
  const canonical = asRecord(payload.canonical_goal_frame);
  const canonicalGoal = readString(canonical?.goal_kind);
  const sourceIntent = asRecord(payload.source_target_intent);
  const cues = readArray(sourceIntent?.explicit_cues).map(String);
  if (
    canonicalGoal === "panel_control" &&
    (contractGoal === "docs_panel_open" ||
      cues.includes("docs_panel_open") ||
      /\b(open|show|switch to)\b[\s\S]{0,40}\bdocs?(?:\s+panel|\s+and\s+papers)?\b/i.test(prompt))
  ) {
    return "docs_panel_open";
  }
  if (
    /\b(?:describe|review|analy[sz]e|what\s+(?:do\s+you\s+)?see|what(?:'s|\s+is)\s+(?:happening|on|visible))\b[\s\S]{0,140}\b(?:live|screen|visual|display)\s+(?:capture|source|frame|screen)\b/i.test(prompt) ||
    /\b(?:live|screen|visual|display)\s+(?:capture|source|frame|screen)\b[\s\S]{0,140}\b(?:describe|review|analy[sz]e|see|happening|visible)\b/i.test(prompt)
  ) {
    return "visual_capture_describe";
  }
  return evaluationGoal ?? canonicalGoal ?? contractGoal ?? "unknown";
};

const hasDocSearchCandidates = (payload: Record<string, unknown>): boolean => {
  const search = findArtifactPayload(payload, ["doc_search_results"]);
  return readArray(search?.matches).length > 0;
};

const firstDocSearchCandidatePath = (payload: Record<string, unknown>): string | null => {
  const search = findArtifactPayload(payload, ["doc_search_results"]);
  const firstMatch = readArray(search?.matches).map(asRecord).find(Boolean) ?? null;
  return normalizePath(firstMatch?.path);
};

const readValidation = (payload: Record<string, unknown>): Record<string, unknown> | null =>
  findArtifactPayload(payload, ["doc_candidate_validation"]);

const readOpenReceipt = (payload: Record<string, unknown>): Record<string, unknown> | null =>
  findArtifactPayload(payload, ["doc_open_receipt"]);

const hasDocSummary = (payload: Record<string, unknown>): boolean =>
  Boolean(findArtifactPayload(payload, ["doc_summary", "focused_doc_answer"]));

const hasDocEvidenceSynthesisAnswer = (payload: Record<string, unknown>): boolean => {
  const answer = findArtifactPayload(payload, ["doc_evidence_synthesis_answer"]);
  if (!answer) return false;
  const sourceDocs = readArray(answer.source_docs);
  const supportRefs = readArray(answer.support_refs);
  return Boolean(
    readString(answer.answer_text) &&
      (
        sourceDocs.some((entry) => Boolean(asRecord(entry)?.path)) ||
        supportRefs.some((entry) => Boolean(readString(entry)))
      ),
  );
};

const hasLocationResult = (payload: Record<string, unknown>): boolean => {
  const location = findArtifactPayload(payload, ["doc_location_result", "doc_location_matches", "doc_evidence_location"]);
  if (!location) return false;
  const matches = readArray(location.matches);
  const snippets = readArray(location.snippets);
  return matches.length > 0 || snippets.length > 0 || readString(location.status) === "located";
};

const activeDocPath = (payload: Record<string, unknown>): string | null => {
  const snapshot = asRecord(payload.workspace_context_snapshot) ?? asRecord(asRecord(payload.ask_turn_preflight_context)?.workspace_snapshot);
  const activeDocPathArtifact = findArtifactPayload(payload, ["active_doc_path"]);
  return (
    normalizePath(activeDocPathArtifact?.path) ??
    normalizePath(activeDocPathArtifact?.active_doc_path) ??
    normalizePath(activeDocPathArtifact?.doc_path) ??
    normalizePath(activeDocPathArtifact?.selected_path) ??
    normalizePath(snapshot?.activeDocPath) ??
    normalizePath(snapshot?.docContextPath) ??
    normalizePath(asRecord(payload.canonical_goal_frame)?.source_doc_path)
  );
};

const activeDocPathForPrompt = (payload: Record<string, unknown>, prompt: string): string | null => {
  const path = activeDocPath(payload);
  if (!path) return null;
  if (/\b(?:this|current|open|opened|active|loaded)\s+(?:doc|document|paper|white\s*paper|whitepaper|file)\b/i.test(prompt)) {
    return path;
  }
  const normalizedPath = path.toLowerCase().replace(/[^a-z0-9]+/g, " ");
  if (/\bNHM[-\s]?2\b/i.test(prompt)) {
    return normalizedPath.includes("nhm2") ? path : null;
  }
  const requiredTokens = [
    /\bcasimir\b/i.test(prompt) ? "casimir" : null,
    /\btile\b/i.test(prompt) ? "tile" : null,
  ].filter((entry): entry is string => Boolean(entry));
  return requiredTokens.length === 0 || requiredTokens.every((token) => normalizedPath.includes(token))
    ? path
    : null;
};

const sameDocPath = (left: string, right: string): boolean =>
  left.replace(/^\//, "") === right.replace(/^\//, "");

const observedDocEvidencePaths = (payload: Record<string, unknown>): string[] => {
  const evidenceArtifacts = collectDocEvidenceForSynthesis({
    artifactLedger: getLedger(payload),
  });
  const paths = new Set<string>();
  for (const artifact of evidenceArtifacts) {
    const record = artifactPayload(artifact);
    for (const key of ["path", "source_path", "active_doc_path", "doc_path", "document_path"]) {
      const path = normalizePath(record?.[key]);
      if (path) paths.add(path);
    }
    for (const match of readArray(record?.matches)) {
      const matchRecord = asRecord(match);
      const path = normalizePath(matchRecord?.path) ?? normalizePath(matchRecord?.source_path);
      if (path) paths.add(path);
    }
    for (const doc of readArray(record?.source_docs)) {
      const docRecord = asRecord(doc);
      const path = normalizePath(docRecord?.path);
      if (path) paths.add(path);
    }
  }
  return Array.from(paths);
};

const locateQuery = (payload: Record<string, unknown>, prompt: string): string | null => {
  const usableQuery = (value: string | null | undefined): string | null => {
    const cleaned = typeof value === "string" ? value.trim() : "";
    if (!cleaned || cleaned.length <= 2) return null;
    if (/^(?:local_document_evidence|whitepaper|document|doc|docs|paper)$/i.test(cleaned)) return null;
    return cleaned;
  };
  const quoted = usableQuery(prompt.match(/"(.+?)"/)?.[1]);
  if (quoted) return quoted;
  const loadBearingQuestion = prompt.match(
    /\b(?:load[-\s]?bearing|load|bearing|capacity|newtons?|lbs?|pounds?)\b[\s\S]{0,180}\b(?:casimir|tile|NHM[-\s]?2)\b|\b(?:casimir|tile|NHM[-\s]?2)\b[\s\S]{0,180}\b(?:load[-\s]?bearing|load|bearing|capacity|newtons?|lbs?|pounds?)\b/i,
  );
  if (loadBearingQuestion) {
    return "Casimir tile load bearing capacity newtons lbs";
  }
  const afterFind = usableQuery(
    prompt.match(/\b(?:find|where|locate|check|look\s+(?:in|for))\b\s+(?:where\s+)?(.+?)(?:\s+in\s+the\b|\s+from\s+the\b|[?.!]|$)/i)?.[1],
  );
  if (afterFind) return afterFind;
  const target = asRecord(payload.evidence_target_request);
  const targetQuery = usableQuery(readString(target?.query));
  if (targetQuery) return targetQuery;
  const conceptTokens = readArray(asRecord(payload.canonical_goal_frame)?.concept_tokens).map(String).filter(Boolean);
  const conceptQuery = usableQuery(conceptTokens[0]);
  if (conceptQuery) return conceptQuery;
  return null;
};

const docSummaryFocusQuery = (prompt: string): string | null => {
  if (/\bremaining\s+parity\s+gap\b/i.test(prompt)) return "remaining parity gap";
  const afterSummarize = prompt.match(/\bsummari[sz]e\s+(?:the\s+)?(.+?)(?:\s+in\s+\d+\s+bullets?|\s+with\s+(?:the\s+)?(?:document\s+)?path|[?.!]|$)/i)?.[1]?.trim();
  if (afterSummarize && afterSummarize.length > 2 && afterSummarize.length < 120) return afterSummarize;
  return null;
};

const hasVisualSource = (payload: Record<string, unknown>): boolean => {
  const audit = asRecord(payload.live_source_identity_audit);
  if (readString(audit?.diagnosis) === "field_evaluations_missing") return true;
  const context =
    asRecord(payload.situationCaptureContext) ??
    asRecord(asRecord(payload.workspace_context_snapshot)?.situationCaptureContext) ??
    asRecord(asRecord(payload.ask_turn_preflight_context)?.workspace_snapshot)?.situationCaptureContext;
  const contextRecord = asRecord(context);
  return readArray(contextRecord?.sources).some((source) => {
    const record = asRecord(source);
    if (!record) return false;
    const captureSource = String(record.capture_source ?? record.source_kind ?? "").toLowerCase();
    const status = String(record.status ?? "").toLowerCase();
    const permission = asRecord(record.permission_state);
    return (
      (captureSource.includes("display") || captureSource.includes("screen") || captureSource.includes("visual")) &&
      (status === "active" || permission?.capture_granted === true)
    );
  });
};

const visualEvidencePayloads = (payload: Record<string, unknown>): Record<string, unknown>[] => {
  const kinds = ["visual_context_pack", "situation_context_pack", "visual_frame_evidence"];
  return [
    ...getLedger(payload)
      .filter((artifact) => kinds.includes(String(artifact.kind ?? "")))
      .map(artifactPayload)
      .filter((entry): entry is Record<string, unknown> => Boolean(entry)),
    ...kinds.map((kind) => asRecord(payload[kind])).filter((entry): entry is Record<string, unknown> => Boolean(entry)),
  ];
};

const hasVisualObservationEvidence = (payload: Record<string, unknown>): boolean =>
  visualEvidencePayloads(payload).some((entry) =>
    readArray(entry.selected_observation_refs).length > 0 ||
    readArray(entry.observation_refs).length > 0 ||
    readArray(entry.observations).length > 0 ||
    readArray(entry.visual_observations).length > 0 ||
    readArray(entry.selected_visual_evidence_refs).length > 0 ||
    readArray(entry.selected_current_refs).some((ref) => String(ref).startsWith("observation:")) ||
    Boolean(entry.visual_observation)
  );

const hasFieldEvaluationEvidence = (payload: Record<string, unknown>): boolean =>
  visualEvidencePayloads(payload).some((entry) =>
    readArray(entry.selected_field_evaluation_refs).length > 0 ||
    readArray(entry.field_evaluation_refs).length > 0 ||
    readArray(entry.field_evaluations).length > 0 ||
    readArray(entry.fields).length > 0 ||
    readArray(entry.selected_current_refs).some((ref) => String(ref).startsWith("field_eval:")) ||
    Boolean(entry.field_evaluation)
  );

export const buildHelixDomainContinuationDecision = (input: DomainContinuationInput): HelixDomainContinuationDecision => {
  const goalKind = goalKindFromPayload(input.payload, input.prompt);

  if (goalKind === "docs_panel_open") {
    if (!hasAction(input.payload, "docs-viewer", "open")) {
      return continuation(input, goalKind, "continue", "docs_panel_open_requires_docs_viewer_open_action", {
        recommended_capability_hint: capabilityHint(
          action("docs-viewer", "open"),
          "docs_panel_open_requires_docs_viewer_open_action",
        ),
        expected_artifacts: ["workspace_action_receipt"],
      });
    }
    return continuation(input, goalKind, "none", "docs_panel_open_already_has_open_action");
  }

  if (goalKind === "doc_open_best") {
    const validation = readValidation(input.payload);
    const selectedPath = normalizePath(validation?.selected_path);
    const selectedStatus = readString(validation?.selected_status);
    const openReceipt = readOpenReceipt(input.payload);
    const openedPath = normalizePath(openReceipt?.path);
    const search = findArtifactPayload(input.payload, ["doc_search_results"]);
    const query = readString(validation?.query) ?? readString(search?.query) ?? input.prompt;

    if (hasDocSearchCandidates(input.payload) && !validation) {
      return continuation(input, goalKind, "continue", "doc_search_candidates_require_validation", {
        recommended_capability_hint: capabilityHint(
          action("docs-viewer", "validate_doc_candidates", { query, transcript: input.prompt, limit: 8 }),
          "doc_search_candidates_require_validation",
        ),
        expected_artifacts: ["doc_candidate_validation"],
      });
    }
    if (selectedStatus === "strong" && selectedPath && !openReceipt) {
      return continuation(input, goalKind, "continue", "validated_doc_candidate_requires_open", {
        recommended_capability_hint: capabilityHint(
          action("docs-viewer", "open_doc_by_path", {
            path: selectedPath,
            query,
            selection_reason: "validated_topic_candidate",
            candidate_validation_status: selectedStatus,
          }),
          "validated_doc_candidate_requires_open",
        ),
        expected_artifacts: ["active_doc_path", "doc_open_receipt"],
      });
    }
    if (selectedPath && openedPath && selectedPath !== openedPath) {
      return continuation(input, goalKind, "retry", "doc_open_path_mismatch_retry_selected_path", {
        recommended_capability_hint: capabilityHint(
          action("docs-viewer", "open_doc_by_path", {
            path: selectedPath,
            query,
            selection_reason: "validated_topic_candidate_retry",
            previous_opened_path: openedPath,
          }),
          "doc_open_path_mismatch_retry_selected_path",
        ),
        expected_artifacts: ["active_doc_path", "doc_open_receipt"],
      });
    }
    return continuation(input, goalKind, "none", "doc_open_best_has_no_bounded_continuation");
  }

  if (goalKind === "doc_summary") {
    const validation = readValidation(input.payload);
    const selectedPath = normalizePath(validation?.selected_path) ?? firstDocSearchCandidatePath(input.payload) ?? activeDocPath(input.payload);
    const selectedStatus = readString(validation?.selected_status);
    const openReceipt = readOpenReceipt(input.payload);
    const openedPath = normalizePath(openReceipt?.path) ?? normalizePath(openReceipt?.active_doc_path) ?? activeDocPath(input.payload);
    const search = findArtifactPayload(input.payload, ["doc_search_results"]);
    const query = readString(validation?.query) ?? readString(search?.query) ?? locateQuery(input.payload, input.prompt) ?? input.prompt;
    const summaryQuery = docSummaryFocusQuery(input.prompt) ?? query;
    const hasSummary = hasDocSummary(input.payload);

    if (!hasDocSearchCandidates(input.payload) && !validation && !openedPath && !hasSummary) {
      return continuation(input, goalKind, "continue", "doc_summary_requires_initial_docs_search", {
        docs_continuation_contract: docsContract({
          phase: "search_required",
          priorKind: null,
          priorRefs: [],
          requiredCapability: "docs-viewer.search_docs",
          expectedArtifacts: ["doc_search_results"],
          terminalBlockReason: "doc_search_results missing",
          instruction:
            "You are in a docs_summary continuation workflow. No doc_search_results exist yet. Choose docs-viewer.search_docs and expect doc_search_results before validating, opening, summarizing, or answering.",
        }),
        recommended_capability_hint: capabilityHint(
          action("docs-viewer", "search_docs", { query, limit: 5 }),
          "doc_summary_requires_initial_docs_search",
        ),
        expected_artifacts: ["doc_search_results"],
      });
    }

    if (hasDocSearchCandidates(input.payload) && !validation) {
      return continuation(input, goalKind, "continue", "doc_summary_search_candidates_require_validation", {
        docs_continuation_contract: docsContract({
          phase: "candidate_validation_required",
          priorKind: "doc_search_results",
          priorRefs: artifactRefsForKinds(input.payload, ["doc_search_results"]),
          requiredCapability: "docs-viewer.validate_doc_candidates",
          forbiddenRepeatedCapabilities: ["docs-viewer.search_docs"],
          expectedArtifacts: ["doc_candidate_validation"],
          terminalBlockReason: "doc_candidate_validation missing",
          instruction:
            "You are in a docs_summary continuation workflow. The previous observation already satisfied doc_search_results. Do not call docs-viewer.search_docs again unless the prior search had no candidates or the query materially changed. Choose docs-viewer.validate_doc_candidates next and expect doc_candidate_validation.",
        }),
        recommended_capability_hint: capabilityHint(
          action("docs-viewer", "validate_doc_candidates", { query, transcript: input.prompt, limit: 8 }),
          "doc_summary_search_candidates_require_validation",
        ),
        expected_artifacts: ["doc_candidate_validation"],
      });
    }
    if (selectedPath && (!openedPath || openedPath !== selectedPath)) {
      return continuation(input, goalKind, "continue", "doc_summary_validated_candidate_requires_open", {
        docs_continuation_contract: docsContract({
          phase: "open_validated_doc_required",
          priorKind: validation ? "doc_candidate_validation" : "doc_search_results",
          priorRefs: artifactRefsForKinds(input.payload, ["doc_candidate_validation", "doc_search_results"]),
          requiredCapability: "docs-viewer.open_doc_by_path",
          forbiddenRepeatedCapabilities: ["docs-viewer.search_docs", "docs-viewer.validate_doc_candidates"],
          expectedArtifacts: ["active_doc_path", "doc_open_receipt"],
          terminalBlockReason: "active_doc_path/doc_open_receipt missing",
          instruction:
            "You are in a docs_summary continuation workflow. A selected document candidate exists. Do not repeat docs search or validation. Choose docs-viewer.open_doc_by_path for the selected path and expect active_doc_path plus doc_open_receipt.",
        }),
        recommended_capability_hint: capabilityHint(
          action("docs-viewer", "open_doc_by_path", {
            path: selectedPath,
            query,
            selection_reason: "validated_doc_summary_candidate",
            candidate_validation_status: selectedStatus ?? "candidate_selected",
          }),
          "doc_summary_validated_candidate_requires_open",
        ),
        expected_artifacts: ["active_doc_path", "doc_open_receipt"],
      });
    }
    if ((openedPath || selectedPath) && !hasSummary) {
      return continuation(input, goalKind, "continue", "doc_summary_open_doc_requires_summary", {
        docs_continuation_contract: docsContract({
          phase: "summary_required",
          priorKind: "active_doc_path",
          priorRefs: artifactRefsForKinds(input.payload, ["active_doc_path", "doc_open_receipt", "active_doc_identity"]),
          requiredCapability: "docs-viewer.summarize_doc",
          forbiddenRepeatedCapabilities: ["docs-viewer.search_docs", "docs-viewer.validate_doc_candidates", "docs-viewer.open_doc_by_path"],
          expectedArtifacts: ["doc_summary", "focused_doc_answer"],
          terminalBlockReason: "doc_summary missing",
          instruction:
            "You are in a docs_summary continuation workflow. The document is open. Do not repeat search, validation, or open. Choose docs-viewer.summarize_doc next and expect doc_summary before terminal answer.",
        }),
        recommended_capability_hint: capabilityHint(
          action("docs-viewer", "summarize_doc", {
            path: openedPath ?? selectedPath,
            query: summaryQuery,
          }),
          "doc_summary_open_doc_requires_summary",
        ),
        expected_artifacts: ["doc_summary", "focused_doc_answer"],
      });
    }
    if (hasSummary) {
      return continuation(input, goalKind, "none", "doc_summary_has_terminal_artifact", {
        docs_continuation_contract: docsContract({
          phase: "terminal_ready",
          priorKind: "doc_summary",
          priorRefs: artifactRefsForKinds(input.payload, ["doc_summary", "focused_doc_answer"]),
          requiredCapability: null,
          expectedArtifacts: [],
          terminalBlockReason: null,
          instruction:
            "The docs_summary workflow has a doc_summary artifact. Terminal answer may be allowed if goal satisfaction and terminal authority pass.",
        }),
      });
    }
    return continuation(input, goalKind, "none", "doc_summary_has_no_bounded_continuation", {
      docs_continuation_contract: docsContract({
        phase: "blocked",
        priorKind: null,
        priorRefs: artifactRefsForKinds(input.payload, ["doc_search_results", "doc_candidate_validation", "active_doc_path", "doc_open_receipt"]),
        requiredCapability: null,
        expectedArtifacts: [],
        terminalBlockReason: "docs_summary_continuation_state_unresolved",
        instruction:
          "The docs_summary workflow state is unresolved. Do not answer until doc_summary exists; ask for repair or fail closed if no admitted docs capability can advance.",
      }),
    });
  }

  if (goalKind === "doc_evidence_synthesis") {
    const plan = buildDocEvidenceSynthesisPlan({
      turnId: input.turnId,
      promptText: input.prompt,
      committedAskRoute: asRecord(input.payload.committed_ask_route) as HelixCommittedAskRoute | null,
    });
    const evidenceArtifacts = collectDocEvidenceForSynthesis({
      artifactLedger: getLedger(input.payload),
    });
    const coverage = evaluateDocEvidenceSynthesisCoverage({
      turnId: input.turnId,
      plan,
      evidenceArtifacts,
    });
    input.payload.doc_evidence_synthesis_plan = plan;
    input.payload.doc_evidence_synthesis_coverage = coverage;

    const validation = readValidation(input.payload);
    const selectedPath =
      normalizePath(validation?.selected_path) ??
      firstDocSearchCandidatePath(input.payload) ??
      activeDocPathForPrompt(input.payload, input.prompt);
    const selectedStatus = readString(validation?.selected_status);
    const search = findArtifactPayload(input.payload, ["doc_search_results"]);
    const query = readString(validation?.query) ?? readString(search?.query) ?? locateQuery(input.payload, input.prompt) ?? input.prompt;

    if (hasDocEvidenceSynthesisAnswer(input.payload)) {
      return continuation(input, goalKind, "none", "doc_evidence_synthesis_has_terminal_artifact", {
        docs_continuation_contract: docsContract({
          phase: "terminal_ready",
          priorKind: "doc_evidence_synthesis_answer",
          priorRefs: artifactRefsForKinds(input.payload, ["doc_evidence_synthesis_answer"]),
          requiredCapability: null,
          expectedArtifacts: [],
          terminalBlockReason: null,
          doneCondition: "terminal answer is allowed only after doc_evidence_synthesis_answer satisfies the goal",
          instruction:
            "The docs evidence synthesis workflow has a doc_evidence_synthesis_answer artifact. Terminal answer may be allowed if goal satisfaction and terminal authority pass.",
        }),
      });
    }

    if (hasDocSearchCandidates(input.payload) && !validation) {
      return continuation(input, goalKind, "continue", "doc_evidence_synthesis_search_candidates_require_validation", {
        docs_continuation_contract: docsContract({
          phase: "candidate_validation_required",
          priorKind: "doc_search_results",
          priorRefs: artifactRefsForKinds(input.payload, ["doc_search_results"]),
          requiredCapability: "docs-viewer.validate_doc_candidates",
          forbiddenRepeatedCapabilities: ["docs-viewer.search_docs"],
          requiredActionArgs: { query, transcript: input.prompt, limit: 8 },
          expectedArtifacts: ["doc_candidate_validation"],
          terminalBlockReason: "doc_candidate_validation missing",
          doneCondition: "doc search candidates are validated before location or synthesis",
          instruction:
            "The docs evidence synthesis workflow has doc_search_results. Do not repeat docs-viewer.search_docs. Validate the candidates next and expect doc_candidate_validation.",
        }),
        recommended_capability_hint: capabilityHint(
          action("docs-viewer", "validate_doc_candidates", { query, transcript: input.prompt, limit: 8 }),
          "doc_evidence_synthesis_search_candidates_require_validation",
        ),
        expected_artifacts: ["doc_candidate_validation"],
      });
    }

    if (
      selectedPath &&
      !hasLocationResult(input.payload) &&
      plan.synthesis_kind !== "compare" &&
      plan.synthesis_kind !== "multi_doc_summary"
    ) {
      const query = locateQuery(input.payload, input.prompt) ?? plan.required_anchors[0] ?? input.prompt;
      return continuation(input, goalKind, "continue", "doc_evidence_synthesis_requires_location", {
        docs_continuation_contract: docsContract({
          phase: "location_required",
          priorKind: validation ? "doc_candidate_validation" : "active_doc_path",
          priorRefs: artifactRefsForKinds(input.payload, ["doc_candidate_validation", "active_doc_path", "doc_open_receipt"]),
          requiredCapability: "docs-viewer.locate_in_doc",
          forbiddenRepeatedCapabilities: ["docs-viewer.search_docs", "docs-viewer.validate_doc_candidates"],
          requiredActionArgs: { path: selectedPath, query, locate_strategy: "variant" },
          expectedArtifacts: ["doc_location_matches", "doc_location_result", "doc_evidence_location"],
          terminalBlockReason: "doc_evidence_synthesis_answer missing",
          doneCondition: "requested document location evidence exists before synthesis",
          instruction:
            "You are in a docs evidence synthesis workflow and a document path is already selected or active. Do not repeat docs search or validation. Locate the requested section or numeric claim in the document; location evidence must re-enter synthesis first.",
        }),
        recommended_capability_hint: capabilityHint(
          action("docs-viewer", "locate_in_doc", { path: selectedPath, query, locate_strategy: "variant" }),
          "doc_evidence_synthesis_requires_location",
        ),
        expected_artifacts: ["doc_location_matches", "doc_location_result", "doc_evidence_location"],
      });
    }

    if (search && !hasDocSearchCandidates(input.payload) && !selectedPath) {
      const searchAttempts = runtimeCapabilityValidationCount(input.payload, "docs-viewer.search_docs");
      if (searchAttempts <= 1) {
        const repairedQuery = repairedDocEvidenceSearchQuery(input.prompt);
        return continuation(input, goalKind, "retry", "doc_evidence_synthesis_search_no_candidates_retry_repaired_query", {
          docs_continuation_contract: docsContract({
            phase: "search_required",
            priorKind: "doc_search_results",
            priorRefs: artifactRefsForKinds(input.payload, ["doc_search_results"]),
            requiredCapability: "docs-viewer.search_docs",
            forbiddenRepeatedCapabilities: [],
            requiredActionArgs: {
              query: repairedQuery,
              target_transcript: input.prompt,
              search_repair_reason: "previous_doc_search_returned_no_candidates",
            },
            expectedArtifacts: ["doc_search_results", "doc_candidate_validation", "doc_location_matches", "doc_evidence_location"],
            terminalBlockReason: "doc_search_results had no candidates",
            doneCondition: "a repaired document search produces candidates before synthesis",
            instruction:
              "The prior docs search returned no candidates. Retry once with the narrowed document-evidence query; do not synthesize from empty search results.",
          }),
          recommended_capability_hint: capabilityHint(
            action("docs-viewer", "search_docs", {
              query: repairedQuery,
              target_transcript: input.prompt,
              search_repair_reason: "previous_doc_search_returned_no_candidates",
            }),
            "doc_evidence_synthesis_search_no_candidates_retry_repaired_query",
          ),
          expected_artifacts: ["doc_search_results", "doc_candidate_validation", "doc_location_matches", "doc_evidence_location"],
        });
      }
      return continuation(input, goalKind, "typed_failure", "doc_evidence_synthesis_search_no_candidates_after_repair", {
        docs_continuation_contract: docsContract({
          phase: "blocked",
          priorKind: "doc_search_results",
          priorRefs: artifactRefsForKinds(input.payload, ["doc_search_results"]),
          requiredCapability: null,
          expectedArtifacts: ["doc_evidence_synthesis_answer"],
          terminalBlockReason: "doc_search_results had no candidates after repaired search",
          doneCondition: "document evidence must be found before synthesis",
          instruction:
            "The docs evidence synthesis workflow could not find document candidates after a repaired search. Fail closed with a typed document-evidence retrieval failure.",
        }),
        typed_failure_code: "doc_evidence_search_no_candidates",
        expected_artifacts: ["doc_evidence_synthesis_answer"],
      });
    }

    const observedPaths = observedDocEvidencePaths(input.payload);
    const missingPath = plan.required_doc_paths.find((path) =>
      !observedPaths.some((observed) => sameDocPath(observed, path)),
    );

    if ((plan.synthesis_kind === "compare" || plan.synthesis_kind === "multi_doc_summary") && missingPath) {
      return continuation(input, goalKind, "continue", "doc_evidence_synthesis_requires_missing_doc_summary", {
        docs_continuation_contract: docsContract({
          phase: "multi_doc_summary_required",
          priorKind: evidenceArtifacts.length > 0 ? "doc_summary" : null,
          priorRefs: artifactRefsForKinds(input.payload, ["doc_summary", "focused_doc_answer"]),
          requiredCapability: "docs-viewer.summarize_doc",
          requiredActionArgs: {
            path: missingPath,
            query: input.prompt,
            target_transcript: input.prompt,
          },
          expectedArtifacts: ["doc_summary"],
          terminalBlockReason: "doc_evidence_synthesis_answer missing",
          doneCondition: "each requested document path has doc_summary evidence before synthesis",
          instruction:
            "You are in a docs evidence synthesis workflow. Summarize the next missing requested document path. Do not terminalize a single doc_summary; summaries are evidence for the final synthesis answer.",
        }),
        recommended_capability_hint: capabilityHint(
          action("docs-viewer", "summarize_doc", {
            path: missingPath,
            query: input.prompt,
          }),
          "doc_evidence_synthesis_requires_missing_doc_summary",
        ),
        expected_artifacts: ["doc_summary"],
      });
    }

    if ((plan.synthesis_kind === "locate_then_explain" || plan.synthesis_kind === "runbook_answer") && !hasLocationResult(input.payload)) {
      const path = plan.required_doc_paths[0] ?? selectedPath ?? activeDocPathForPrompt(input.payload, input.prompt);
      const query = locateQuery(input.payload, input.prompt) ?? plan.required_anchors[0] ?? input.prompt;
      if (path && query) {
        return continuation(input, goalKind, "continue", "doc_evidence_synthesis_requires_location", {
          docs_continuation_contract: docsContract({
            phase: "location_required",
            priorKind: selectedPath ? "doc_candidate_validation" : null,
            priorRefs: artifactRefsForKinds(input.payload, ["doc_candidate_validation", "active_doc_path", "doc_open_receipt"]),
            requiredCapability: "docs-viewer.locate_in_doc",
            forbiddenRepeatedCapabilities: ["docs-viewer.search_docs", "docs-viewer.validate_doc_candidates"],
            requiredActionArgs: { path, query, locate_strategy: "variant" },
            expectedArtifacts: ["doc_location_matches", "doc_location_result", "doc_evidence_location"],
            terminalBlockReason: "doc_evidence_synthesis_answer missing",
            doneCondition: "requested document location evidence exists before synthesis",
            instruction:
              "You are in a docs evidence synthesis workflow. Locate the requested section or snippet in the document. Do not terminalize doc_summary; location evidence must re-enter synthesis first.",
          }),
          recommended_capability_hint: capabilityHint(
            action("docs-viewer", "locate_in_doc", { path, query, locate_strategy: "variant" }),
            "doc_evidence_synthesis_requires_location",
          ),
          expected_artifacts: ["doc_location_matches", "doc_location_result", "doc_evidence_location"],
        });
      }
    }

    if (coverage.sufficient) {
      const evidenceRefs = artifactRefsForKinds(input.payload, [
        "doc_summary",
        "focused_doc_answer",
        "doc_location_result",
        "doc_location_matches",
        "doc_evidence_location",
      ]);
      return continuation(input, goalKind, "continue", "doc_evidence_synthesis_requires_model_synthesis", {
        docs_continuation_contract: docsContract({
          phase: "synthesis_required",
          priorKind: "doc_evidence_observations",
          priorRefs: evidenceRefs,
          requiredCapability: "model.direct_answer",
          requiredActionArgs: {
            prompt: input.prompt,
            evidence_refs: evidenceRefs,
            required_terminal_kind: "doc_evidence_synthesis_answer",
          },
          expectedArtifacts: ["final_answer_draft", "doc_evidence_synthesis_answer"],
          terminalBlockReason: "doc_evidence_synthesis_answer missing",
          doneCondition: "final_answer_draft with doc evidence refs is materialized as doc_evidence_synthesis_answer",
          instruction:
            "Docs evidence is available. Choose model.direct_answer to synthesize from the cited doc artifacts, produce a final_answer_draft with doc artifact refs, then materialize doc_evidence_synthesis_answer. Do not terminalize intermediate doc_summary or location artifacts.",
        }),
        recommended_capability_hint: capabilityHint(
          action("model", "direct_answer", {
            prompt: input.prompt,
            evidence_refs: evidenceRefs,
            required_terminal_kind: "doc_evidence_synthesis_answer",
          }),
          "doc_evidence_synthesis_requires_model_synthesis",
        ),
        expected_artifacts: ["final_answer_draft", "doc_evidence_synthesis_answer"],
      });
    }

    return continuation(input, goalKind, "continue", "doc_evidence_synthesis_requires_doc_search", {
      docs_continuation_contract: docsContract({
        phase: "search_required",
        priorKind: evidenceArtifacts.length > 0 ? "doc_evidence_observations" : null,
        priorRefs: artifactRefsForKinds(input.payload, ["doc_summary", "doc_location_result", "doc_location_matches", "doc_evidence_location"]),
        requiredCapability: "docs-viewer.search_docs",
        requiredActionArgs: {
          query: input.prompt,
          target_transcript: input.prompt,
        },
        expectedArtifacts: ["doc_search_results", "doc_candidate_validation", "doc_location_matches", "doc_evidence_location"],
        terminalBlockReason: coverage.missing_requirements.join(", ") || "doc_evidence_synthesis_answer missing",
        doneCondition: "document search or location evidence exists before synthesis",
        instruction:
          "The docs evidence synthesis workflow is missing required coverage. Execute docs-viewer.search_docs or another admitted Docs evidence capability before synthesis; do not answer from partial evidence.",
      }),
      recommended_capability_hint: capabilityHint(
        action("docs-viewer", "search_docs", {
          query: input.prompt,
          target_transcript: input.prompt,
        }),
        "doc_evidence_synthesis_requires_doc_search",
      ),
      expected_artifacts: ["doc_search_results", "doc_candidate_validation", "doc_location_matches", "doc_evidence_location"],
    });
  }

  if (goalKind === "doc_evidence_location" || goalKind === "doc_location_result" || goalKind === "doc_equation_location") {
    const path = activeDocPath(input.payload);
    const query = locateQuery(input.payload, input.prompt);
    if (path && query && !hasLocationResult(input.payload)) {
      return continuation(input, goalKind, "continue", "active_doc_context_requires_locate_in_doc", {
        recommended_capability_hint: capabilityHint(
          action("docs-viewer", "locate_in_doc", { path, query, locate_strategy: "variant" }),
          "active_doc_context_requires_locate_in_doc",
        ),
        expected_artifacts: ["doc_location_matches"],
      });
    }
    if (path && !query) {
      return continuation(input, goalKind, "request_user_input", "doc_location_query_missing", {
        typed_failure_code: "doc_location_query_missing",
      });
    }
    if (!path) {
      return continuation(input, goalKind, "typed_failure", "doc_context_missing_for_location", {
        typed_failure_code: "doc_context_missing",
      });
    }
    return continuation(input, goalKind, "none", "doc_location_has_no_bounded_continuation");
  }

  if (goalKind === "visual_capture_describe") {
    const audit = asRecord(input.payload.live_source_identity_audit);
    if (hasVisualObservationEvidence(input.payload) && hasFieldEvaluationEvidence(input.payload)) {
      return continuation(input, goalKind, "none", "visual_evidence_already_satisfies_content_goal");
    }
    if (readString(audit?.diagnosis) === "field_evaluations_missing" || hasVisualSource(input.payload)) {
      return continuation(input, goalKind, "continue", "visual_source_requires_field_evaluations", {
        expected_artifacts: ["visual_context_pack", "field_evaluations"],
        repair_candidate: {
          capability: "situation-room.run_field_evaluations",
          reason: "visual source exists but field evaluations are missing",
        },
      });
    }
    return continuation(input, goalKind, "typed_failure", "visual_evidence_missing", {
      typed_failure_code: "visual_evidence_missing",
    });
  }

  return continuation(input, goalKind, "none", "no_domain_continuation_rule");
};
