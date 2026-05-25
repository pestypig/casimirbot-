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
  recommended_capability_hint?: HelixDomainContinuationCapabilityHint;
  expected_artifacts?: string[];
  typed_failure_code?: string;
  repair_candidate?: Record<string, unknown>;
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

const readValidation = (payload: Record<string, unknown>): Record<string, unknown> | null =>
  findArtifactPayload(payload, ["doc_candidate_validation"]);

const readOpenReceipt = (payload: Record<string, unknown>): Record<string, unknown> | null =>
  findArtifactPayload(payload, ["doc_open_receipt"]);

const hasLocationResult = (payload: Record<string, unknown>): boolean => {
  const location = findArtifactPayload(payload, ["doc_location_result", "doc_location_matches", "doc_evidence_location"]);
  if (!location) return false;
  const matches = readArray(location.matches);
  const snippets = readArray(location.snippets);
  return matches.length > 0 || snippets.length > 0 || readString(location.status) === "located";
};

const activeDocPath = (payload: Record<string, unknown>): string | null => {
  const snapshot = asRecord(payload.workspace_context_snapshot) ?? asRecord(asRecord(payload.ask_turn_preflight_context)?.workspace_snapshot);
  return (
    normalizePath(snapshot?.activeDocPath) ??
    normalizePath(snapshot?.docContextPath) ??
    normalizePath(asRecord(payload.canonical_goal_frame)?.source_doc_path)
  );
};

const locateQuery = (payload: Record<string, unknown>, prompt: string): string | null => {
  const target = asRecord(payload.evidence_target_request);
  const targetQuery = readString(target?.query);
  if (targetQuery) return targetQuery;
  const conceptTokens = readArray(asRecord(payload.canonical_goal_frame)?.concept_tokens).map(String).filter(Boolean);
  if (conceptTokens[0]) return conceptTokens[0];
  const quoted = prompt.match(/"(.+?)"/)?.[1]?.trim();
  if (quoted) return quoted;
  const afterFind = prompt.match(/\b(?:find|where|locate)\b\s+(?:where\s+)?(.+?)(?:\s+in\s+the\b|\s+from\s+the\b|[?.!]|$)/i)?.[1]?.trim();
  return afterFind && afterFind.length > 2 ? afterFind : null;
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
