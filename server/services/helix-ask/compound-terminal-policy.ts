type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const unique = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const payloadArtifactPayloadByKind = (
  payload: RecordLike | null | undefined,
  kind: string,
): RecordLike | null => {
  const artifact = readArray(payload?.current_turn_artifact_ledger)
    .map(readRecord)
    .find((entry) => readString(entry?.kind) === kind);
  return readRecord(artifact?.payload);
};

const COMPOUND_SYNTHESIS_TERMINAL_KINDS = [
  "final_answer_draft",
  "compound_evidence_synthesis_answer",
  "model_synthesized_answer",
] as const;

const COMPOUND_FORBIDDEN_RECEIPT_TERMINAL_KINDS = [
  "tool_receipt",
  "calculator_receipt",
  "docs_viewer_receipt",
  "doc_open_receipt",
  "workspace_action_receipt",
  "live_environment_tool_observation",
  "live_pipeline_receipt",
  "live_pipeline_turn_receipt",
  "live_source_pipeline_receipt",
] as const;

const forbiddenCompoundReceiptTerminalKindSet = new Set<string>([
  ...COMPOUND_FORBIDDEN_RECEIPT_TERMINAL_KINDS,
]);

export type HelixCompoundTerminalPolicy = {
  active: boolean;
  allowed_terminal_artifact_kinds: string[];
  forbidden_terminal_artifact_kinds: string[];
  required_terminal_kind: string | null;
  source:
    | "capability_itinerary.terminal_success_criteria"
    | "compound_capability_contract_or_execution_state"
    | "compound_capability_synthesis_readiness"
    | null;
};

export const readCompoundTerminalPolicy = (
  payload: RecordLike | null | undefined,
): HelixCompoundTerminalPolicy => {
  const itinerary =
    readRecord(payload?.capability_itinerary) ??
    payloadArtifactPayloadByKind(payload, "capability_itinerary");
  const criteria = readRecord(itinerary?.terminal_success_criteria);
  const contract =
    readRecord(payload?.compound_capability_contract) ??
    readRecord(itinerary?.compound_capability_contract) ??
    payloadArtifactPayloadByKind(payload, "compound_capability_contract");
  const executionState =
    readRecord(payload?.capability_itinerary_execution_state) ??
    readRecord(itinerary?.execution_state) ??
    payloadArtifactPayloadByKind(payload, "capability_itinerary_execution_state");
  const synthesisReadiness = readRecord(payload?.compound_capability_synthesis_readiness);
  const subgoalCount = Math.max(
    readArray(contract?.subgoals).length,
    readArray(executionState?.compound_subgoal_ledger).length,
  );
  const compoundShapeSignalCount = Math.max(
    subgoalCount,
    readArray(synthesisReadiness?.subgoal_terminal_kinds).length,
    readArray(synthesisReadiness?.terminal_contribution_kinds).length,
    readArray(synthesisReadiness?.missing_compound_subgoal_ids).length,
    readArray(synthesisReadiness?.missing_required_capabilities).length,
    readArray(synthesisReadiness?.incomplete_compound_subgoal_ids).length,
    readArray(executionState?.required_observation_families).length,
  );
  const subgoalRecords = [
    ...readArray(contract?.subgoals),
    ...readArray(executionState?.compound_subgoal_ledger),
  ].map(readRecord).filter((entry): entry is RecordLike => Boolean(entry));
  const hasDocsSubgoal = subgoalRecords.some((subgoal) =>
    readString(subgoal.capability_family) === "docs_viewer" ||
    readString(subgoal.requested_capability).startsWith("docs-viewer.") ||
    readString(subgoal.runtime_capability).startsWith("docs-viewer."),
  );
  const hasCalculatorSubgoal = subgoalRecords.some((subgoal) =>
    readString(subgoal.capability_family) === "calculator" ||
    readString(subgoal.requested_capability) === "scientific-calculator.solve_expression" ||
    readString(subgoal.runtime_capability) === "scientific-calculator.solve_expression",
  );
  const hasTheoryLocatorSubgoal = subgoalRecords.some((subgoal) =>
    readString(subgoal.capability_family) === "theory_locator" ||
    readString(subgoal.requested_capability) === "helix_ask.reflect_theory_context" ||
    readString(subgoal.runtime_capability) === "helix_ask.reflect_theory_context",
  );
  const hasResearchSourceSubgoal = subgoalRecords.some((subgoal) =>
    ["internet_search", "scholarly_research"].includes(readString(subgoal.capability_family)) ||
    ["internet_search.web_research", "scholarly-research.lookup_papers", "scholarly-research.fetch_full_text"]
      .includes(readString(subgoal.requested_capability)) ||
    ["internet_search.web_research", "scholarly-research.lookup_papers", "scholarly-research.fetch_full_text"]
      .includes(readString(subgoal.runtime_capability)),
  );
  const hasResearchLocatorSubgoal =
    hasResearchSourceSubgoal &&
    hasTheoryLocatorSubgoal &&
    !hasDocsSubgoal &&
    !hasCalculatorSubgoal;
  const hasCompoundSubgoalShape = compoundShapeSignalCount > 1;
  const hasCompoundPolicySignal =
    criteria?.compound_terminal_policy === "synthesize_from_satisfied_subgoal_observations" ||
    synthesisReadiness?.applies === true;
  const active = hasCompoundSubgoalShape && (subgoalCount > 1 || hasCompoundPolicySignal);

  if (!active) {
    return {
      active: false,
      allowed_terminal_artifact_kinds: [],
      forbidden_terminal_artifact_kinds: [],
      required_terminal_kind: null,
      source: null,
    };
  }

  const fallbackAllowed = unique([
    ...COMPOUND_SYNTHESIS_TERMINAL_KINDS,
    hasDocsSubgoal ? "doc_evidence_synthesis_answer" : "",
    hasResearchLocatorSubgoal ? "compound_research_locator_answer" : "",
  ]);
  const shapeAllowedTerminalKindSet = new Set<string>(fallbackAllowed);
  const declaredAllowed = unique([
    ...readArray(criteria?.allowed_terminal_artifact_kinds).map(readString),
    readString(synthesisReadiness?.required_terminal_kind),
    readString(synthesisReadiness?.synthesis_terminal_kind),
  ]).filter((kind) =>
    shapeAllowedTerminalKindSet.has(kind) &&
    !forbiddenCompoundReceiptTerminalKindSet.has(kind)
  );
  const allowed = unique([...fallbackAllowed, ...declaredAllowed])
    .filter((kind) => !forbiddenCompoundReceiptTerminalKindSet.has(kind));
  const forbidden = unique([
    ...COMPOUND_FORBIDDEN_RECEIPT_TERMINAL_KINDS,
    ...readArray(criteria?.forbidden_terminal_artifact_kinds).map(readString),
  ]);
  const rawRequiredTerminalKind =
    readString(criteria?.required_terminal_kind) ||
    readString(synthesisReadiness?.required_terminal_kind) ||
    readString(synthesisReadiness?.synthesis_terminal_kind) ||
    (allowed.includes("doc_evidence_synthesis_answer")
      ? "doc_evidence_synthesis_answer"
      : allowed.includes("compound_evidence_synthesis_answer")
        ? "compound_evidence_synthesis_answer"
      : allowed.includes("model_synthesized_answer")
        ? "model_synthesized_answer"
        : allowed[0] ?? null);
  const requiredTerminalKind =
    hasDocsSubgoal && allowed.includes("doc_evidence_synthesis_answer")
      ? "doc_evidence_synthesis_answer"
      : hasResearchLocatorSubgoal && allowed.includes("compound_research_locator_answer")
        ? "compound_research_locator_answer"
      : allowed.includes("compound_evidence_synthesis_answer")
        ? "compound_evidence_synthesis_answer"
      : rawRequiredTerminalKind &&
          allowed.includes(rawRequiredTerminalKind) &&
          !forbidden.includes(rawRequiredTerminalKind)
        ? rawRequiredTerminalKind
        : allowed.includes("doc_evidence_synthesis_answer")
          ? "doc_evidence_synthesis_answer"
          : allowed.includes("compound_evidence_synthesis_answer")
            ? "compound_evidence_synthesis_answer"
            : allowed.includes("model_synthesized_answer")
              ? "model_synthesized_answer"
              : allowed[0] ?? null;

  return {
    active: true,
    allowed_terminal_artifact_kinds: allowed,
    forbidden_terminal_artifact_kinds: forbidden,
    required_terminal_kind: requiredTerminalKind,
    source:
      criteria?.compound_terminal_policy === "synthesize_from_satisfied_subgoal_observations"
        ? "capability_itinerary.terminal_success_criteria"
        : synthesisReadiness?.applies === true
          ? "compound_capability_synthesis_readiness"
          : "compound_capability_contract_or_execution_state",
  };
};

export const applyCompoundTerminalPolicy = (
  payload: RecordLike | null | undefined,
  terminalKinds: {
    allowed: string[];
    forbidden: string[];
    requiredTerminalKind?: string | null;
  },
): {
  allowed: string[];
  forbidden: string[];
  requiredTerminalKind: string | null;
  policy: HelixCompoundTerminalPolicy;
} => {
  const policy = readCompoundTerminalPolicy(payload);
  if (!policy.active) {
    return {
      allowed: unique(terminalKinds.allowed),
      forbidden: unique(terminalKinds.forbidden),
      requiredTerminalKind: terminalKinds.requiredTerminalKind ?? null,
      policy,
    };
  }

  return {
    allowed: policy.allowed_terminal_artifact_kinds.length > 0
      ? policy.allowed_terminal_artifact_kinds
      : unique(terminalKinds.allowed),
    forbidden: unique([...terminalKinds.forbidden, ...policy.forbidden_terminal_artifact_kinds]),
    requiredTerminalKind: policy.required_terminal_kind ?? terminalKinds.requiredTerminalKind ?? null,
    policy,
  };
};
