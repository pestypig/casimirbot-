import {
  inferToolFamilyFromToolName,
  resolveToolFamilyContract,
  TOOL_FAMILY_DEFAULT_CONTRACTS,
  type ToolFamilyContract,
} from "./tool-family-contract";
import {
  explicitCapabilityContractForCapability,
  explicitCapabilityMatches,
} from "./explicit-capability-contract";

type RecordLike = Record<string, unknown>;

type RailFailureCode =
  | "explicit_capability_not_selected"
  | "wrong_capability_executed"
  | "route_family_mismatch"
  | "tool_admission_drift"
  | "tool_execution_rejected"
  | "required_observation_missing"
  | "observation_missing"
  | "observation_not_reentered"
  | "reentry_step_not_executed"
  | "weak_evidence_repair_loop"
  | "support_refs_missing"
  | "terminal_product_mismatch"
  | "terminal_not_materialized"
  | "terminal_projection_mismatch"
  | "config_missing";

type RailStatus = "complete" | "broken" | "fail_closed";

type FirstBrokenRail =
  | "route_admission"
  | "capability_execution"
  | "observation_artifact"
  | "evidence_reentry"
  | "support_backed_draft"
  | "terminal_materialization"
  | "terminal_authority"
  | "visible_projection"
  | "config";

type FailureBucket =
  | "A_tool_did_not_execute"
  | "B_tool_executed_observation_missing"
  | "C_observation_not_reentered"
  | "D_support_backed_draft_missing"
  | "E_terminal_materializer_gap"
  | "F_terminal_projection_mismatch"
  | "G_config_missing"
  | "H_route_tool_family_contract_mismatch";

type RepairTarget =
  | "tool_admission"
  | "tool_execution"
  | "tool_family_contract"
  | "observation_materializer"
  | "reentry_gate"
  | "draft_builder"
  | "terminal_materializer"
  | "terminal_authority"
  | "presenter_boundary"
  | "operator_config"
  | "intent_arbitration"
  | "agent_step_selection"
  | "repo_retrieval_repair_policy";

const TOOL_TURN_CHAIN_FAILURE_CODES: RailFailureCode[] = [
  "explicit_capability_not_selected",
  "wrong_capability_executed",
  "route_family_mismatch",
  "tool_admission_drift",
  "tool_execution_rejected",
  "required_observation_missing",
  "observation_missing",
  "observation_not_reentered",
  "reentry_step_not_executed",
  "weak_evidence_repair_loop",
  "support_refs_missing",
  "terminal_product_mismatch",
  "terminal_not_materialized",
  "terminal_projection_mismatch",
  "config_missing",
];

const TOOL_TURN_CHAIN_MATRIX_FAMILIES = [
  "docs_viewer",
  "repo_code",
  "live_env",
  "workspace_directory",
  "calculator",
  "internet_search",
  "image_lens / visual_capture",
] as const;

const TERMINAL_RECEIPT_KINDS = new Set([
  "tool_receipt",
  "workspace_action_receipt",
  "workstation_tool_evaluation",
  "live_pipeline_receipt",
  "doc_open_receipt",
  "docs_viewer_receipt",
]);

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readNullableString = (value: unknown): string | null => {
  const stringValue = readString(value);
  return stringValue || null;
};

const readBoolean = (value: unknown): boolean => value === true;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((entry) => readString(entry))
        .filter(Boolean)
    : [];

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const unique = (values: string[]): string[] =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const normalize = (value: unknown): string =>
  readString(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

const ledgerEntries = (payload: RecordLike): RecordLike[] =>
  Array.isArray(payload.current_turn_artifact_ledger)
    ? payload.current_turn_artifact_ledger
        .map((entry) => readRecord(entry))
        .filter((entry): entry is RecordLike => Boolean(entry))
    : [];

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : value ? [value] : [];

const supplementalPayloadArtifacts = (payload: RecordLike): RecordLike[] => {
  const entries: RecordLike[] = [];
  for (const validation of readArray(payload.calculator_result_validations)) {
    const record = readRecord(validation);
    if (!record) continue;
    entries.push({
      artifact_id: readString(record.validation_id) || `${readString(record.turn_id) || "turn"}:calculator_result_validation`,
      kind: "calculator_result_validation",
      schema: readString(record.schema) || "helix.calculator_result_validation.v1",
      source_scope: "debug_payload",
      payload: record,
    });
  }
  for (const receipt of readArray(payload.calculator_subgoal_receipts)) {
    const record = readRecord(receipt);
    if (!record) continue;
    entries.push({
      artifact_id: readString(record.receipt_id) || `${readString(record.turn_id) || "turn"}:calculator_subgoal_receipt`,
      kind: "calculator_subgoal_receipt",
      schema: readString(record.schema) || "helix.calculator_subgoal_receipt.v1",
      source_scope: "debug_payload",
      payload: record,
    });
  }
  return entries;
};

const artifactsForPayload = (payload: RecordLike): RecordLike[] => {
  const byRef = new Map<string, RecordLike>();
  for (const artifact of [...ledgerEntries(payload), ...supplementalPayloadArtifacts(payload)]) {
    byRef.set(artifactRef(artifact), artifact);
  }
  return Array.from(byRef.values());
};

const artifactPayload = (artifact: RecordLike): RecordLike | null => readRecord(artifact.payload);

const artifactRef = (artifact: RecordLike): string =>
  readString(artifact.artifact_id) ||
  readString(artifact.id) ||
  readString(artifact.ref) ||
  readString(artifact.kind) ||
  "artifact:unknown";

const artifactKindTokens = (artifact: RecordLike): string[] => {
  const payload = artifactPayload(artifact);
  return unique([
    readString(artifact.kind),
    readString(artifact.schema),
    readString(payload?.kind),
    readString(payload?.schema),
    readString(payload?.type),
  ]);
};

const observationKindMatches = (artifact: RecordLike, requiredKind: string): boolean => {
  const required = normalize(requiredKind);
  if (!required) return false;
  return artifactKindTokens(artifact).some((token) => {
    const normalized = normalize(token);
    return normalized === required || normalized.includes(required) || required.includes(normalized);
  });
};

const firstString = (...values: unknown[]): string | null => {
  for (const value of values) {
    const stringValue = readString(value);
    if (stringValue) return stringValue;
  }
  return null;
};

const normalizedEqual = (left: unknown, right: unknown): boolean => {
  const normalizedLeft = normalize(left);
  const normalizedRight = normalize(right);
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
};

const isGenericAuditFamily = (family: unknown): boolean => {
  const normalized = normalize(family);
  return (
    !normalized ||
    normalized === "none" ||
    normalized === "unknown" ||
    normalized === "debug_export" ||
    normalized === "workstation_action"
  );
};

const capabilityFromPayload = (payload: RecordLike, lifecycleTrace: RecordLike | null): string | null => {
  const operationalTrace = readRecord(payload.operational_capability_trace);
  const plan = readRecord(payload.capability_plan);
  const runtimeToolCall = readRecord(payload.runtime_tool_call);
  return (
    readString(lifecycleTrace?.executed_capability) ||
    readString(lifecycleTrace?.admitted_capability) ||
    readString(lifecycleTrace?.requested_capability) ||
    readString(operationalTrace?.executed_capability) ||
    readString(runtimeToolCall?.capability_key) ||
    readString(plan?.requested_action) ||
    null
  );
};

const familyFromPayload = (payload: RecordLike, lifecycleTrace: RecordLike | null): string | null => {
  const plan = readRecord(payload.capability_plan);
  return (
    readString(lifecycleTrace?.tool_family) ||
    readString(plan?.capability_family) ||
    inferToolFamilyFromToolName(capabilityFromPayload(payload, lifecycleTrace)) ||
    null
  );
};

const artifactInferredFamily = (artifacts: RecordLike[]): string | null => {
  let best: { family: string; score: number } | null = null;
  for (const contract of Object.values(TOOL_FAMILY_DEFAULT_CONTRACTS)) {
    const score = contract.requiredObservationKinds.reduce(
      (count, kind) => count + (artifacts.some((artifact) => observationKindMatches(artifact, kind)) ? 1 : 0),
      0,
    );
    if (score > 0 && (!best || score > best.score)) {
      best = { family: contract.toolFamily, score };
    }
  }
  return best?.family ?? null;
};

const capabilityFromArtifacts = (artifacts: RecordLike[]): string | null => {
  const haystack = artifacts
    .flatMap((artifact) => [
      artifactRef(artifact),
      readString(artifact.kind),
      readString(artifact.schema),
      readString(artifact.producer_item_id),
      readString(artifact.source_scope),
      readString(artifactPayload(artifact)?.tool_name),
      readString(artifactPayload(artifact)?.capability),
      readString(artifactPayload(artifact)?.capability_key),
    ])
    .join("\n")
    .toLowerCase();
  if (/scientific[-_]calculator[-_.:]solve[-_]expression|calculator_result|calculator_receipt/.test(haystack)) {
    return "scientific-calculator.solve_expression";
  }
  if (/docs[-_]viewer[-_.:]summarize[-_]doc|doc_summary/.test(haystack)) return "docs-viewer.summarize_doc";
  if (/docs[-_]viewer[-_.:]locate[-_]in[-_]doc|doc_location|doc_evidence_location/.test(haystack)) {
    return "docs-viewer.locate_in_doc";
  }
  if (/docs[-_]viewer[-_.:]doc[-_]equation[-_]context|doc_equation_context/.test(haystack)) {
    return "docs-viewer.doc_equation_context";
  }
  if (/repo[-_]code[-_.:]search[-_]concept|repo_code_search|repo_code_evidence/.test(haystack)) {
    return "repo-code.search_concept";
  }
  if (/internet[-_]search[-_.:]web[-_]research|web_research_observation|internet_search_observation/.test(haystack)) {
    return "internet_search.web_research";
  }
  if (/workspace[-_]directory[-_.:]resolve|workspace_directory_resolution/.test(haystack)) {
    return "workspace-directory.resolve";
  }
  if (/live_env[-_.:]process_live_source_mail|stage_play_live_source_mail_read_result/.test(haystack)) {
    return "live_env.process_live_source_mail";
  }
  if (/live_env[-_.:]read_processed_live_source_mail|stage_play_processed_mail_packet/.test(haystack)) {
    return "live_env.read_processed_live_source_mail";
  }
  if (/live_env[-_.:]reflect_live_source_mail_loop|stage_play_live_source_mail_loop_reflection/.test(haystack)) {
    return "live_env.reflect_live_source_mail_loop";
  }
  return null;
};

const shouldPreferArtifactFamily = (family: string | null, capability: string | null): boolean => {
  const normalizedFamily = normalize(family);
  const normalizedCapability = normalize(capability);
  return (
    isGenericAuditFamily(normalizedFamily) ||
    normalizedCapability === "model_direct_answer" ||
    normalizedCapability === "model_answer"
  );
};

const shouldPreferArtifactCapability = (capability: string | null): boolean => {
  const normalizedCapability = normalize(capability);
  return (
    !normalizedCapability ||
    normalizedCapability === "model_direct_answer" ||
    normalizedCapability === "model_answer" ||
    normalizedCapability === "direct_answer"
  );
};

const contractSummary = (contract: ToolFamilyContract | null): RecordLike | null =>
  contract
    ? {
        tool_name: contract.toolName,
        tool_family: contract.toolFamily,
        authority: contract.authority,
        mutating: contract.mutating,
        required_observation_kinds: contract.requiredObservationKinds,
        allowed_terminal_kinds: contract.allowedTerminalKinds,
        required_reentry: contract.requiredReentry,
        requires_goal_satisfaction: contract.requiresGoalSatisfaction,
      }
    : null;

const canonicalAuditFamily = (family: unknown, capability?: unknown): string | null => {
  const capabilityFamily = inferToolFamilyFromToolName(readString(capability));
  const normalized = isGenericAuditFamily(family) && capabilityFamily ? normalize(capabilityFamily) : normalize(family) || normalize(capability);
  if (!normalized) return null;
  if (normalized.includes("live_source") || normalized.includes("live_env") || normalized.includes("micro_reasoner")) {
    return "live_env";
  }
  if (normalized.includes("image_lens") || normalized.includes("visual_capture") || normalized.includes("visual")) {
    return "image_lens / visual_capture";
  }
  return normalized;
};

const rejectedToolExecutionTexts = (payload: RecordLike, artifacts: RecordLike[]): string[] => {
  const payloadCandidates = [
    payload.runtime_tool_observation,
    payload.runtime_tool_call_validation,
    payload.runtime_tool_rejection,
    payload.tool_call_admission_decision,
    payload.capability_result,
  ];
  const artifactCandidates = artifacts.filter((artifact) =>
    /runtime_tool_observation|runtime_tool_call_validation|tool_rejection|tool_admission/i.test(
      [
        readString(artifact.kind),
        readString(artifact.schema),
        readString(artifactPayload(artifact)?.schema),
        readString(artifact.producer_item_id),
      ].join(" "),
    ),
  );
  return [
    ...payloadCandidates.map(readRecord).filter((entry): entry is RecordLike => Boolean(entry)),
    ...artifactCandidates.flatMap((artifact) => [artifact, artifactPayload(artifact)].filter(Boolean) as RecordLike[]),
  ].map((entry) =>
    [
      readString(entry.status),
      readString(entry.decision),
      readString(entry.reason),
      readString(entry.failure_reason),
      readString(entry.error_code),
      readString(entry.message),
      readString(entry.summary),
      readString(entry.text),
    ].join("\n"),
  );
};

const runtimeToolExecutionRejected = (payload: RecordLike, artifacts: RecordLike[]): boolean =>
  rejectedToolExecutionTexts(payload, artifacts).some((text) =>
    /\b(?:rejected\s+before\s+execution|forbidden(?:\s+by\s+tool\s+policy)?|not[_\s-]?admitted|blocked\s+before\s+execution|runtime_capability_not_admitted_by_tool_policy|runtime_tool_forbidden_by_tool_policy|tool_call_rejected|tool_execution_rejected)\b/i.test(text),
  );

const runtimeToolPolicyRejectionArtifact = (artifacts: RecordLike[]): RecordLike | null =>
  artifacts.find((artifact) =>
    /\b(?:runtime_tool_observation|runtime_tool_call_validation|tool_rejection|tool_admission)\b/i.test(
      [
        readString(artifact.kind),
        readString(artifact.schema),
        readString(artifactPayload(artifact)?.schema),
        readString(artifact.producer_item_id),
      ].join(" "),
    ) &&
      /\b(?:rejected\s+before\s+execution|forbidden|not[_\s-]?admitted|runtime_capability_not_admitted_by_tool_policy|runtime_tool_forbidden_by_tool_policy)\b/i.test(
        [
          readString(artifactPayload(artifact)?.summary),
          readString(artifactPayload(artifact)?.message),
          readString(artifactPayload(artifact)?.failure_reason),
          readString(artifactPayload(artifact)?.error_code),
          readString(artifactPayload(artifact)?.text),
        ].join("\n"),
      ),
  ) ?? null;

const likelyInternetSearchConfigMissing = (payload: RecordLike, routeFamily: string | null): boolean => {
  if (canonicalAuditFamily(routeFamily) !== "internet_search") return false;
  const terminalError = readString(payload.terminal_error_code);
  const finalAnswer = readString(payload.selected_final_answer);
  const typedFailure = readRecord(payload.typed_failure);
  const text = [
    terminalError,
    finalAnswer,
    readString(typedFailure?.code),
    readString(typedFailure?.reason),
    readString(typedFailure?.message),
  ].join("\n");
  return /\b(?:config|configuration|api[-_\s]?key|provider|credential|tavily|exa|google\s+cse|search\s+key|missing\s+key)\b/i.test(text);
};

const artifactForKind = (artifacts: RecordLike[], kind: string): RecordLike | null =>
  artifacts.find((artifact) => observationKindMatches(artifact, kind)) ?? null;

const finalAnswerDraftRef = (payload: RecordLike, artifacts: RecordLike[]): string | null => {
  const draftArtifact = [...artifacts].reverse().find((artifact) => normalize(artifact.kind) === "final_answer_draft");
  return (
    readString(draftArtifact?.artifact_id) ||
    readString(draftArtifact?.id) ||
    readString(readRecord(payload.final_answer_draft)?.draft_id) ||
    readString(readRecord(payload.final_answer_draft)?.artifact_id) ||
    null
  );
};

const supportRefsCount = (payload: RecordLike, artifacts: RecordLike[]): number => {
  const draftArtifact = [...artifacts].reverse().find((artifact) => normalize(artifact.kind) === "final_answer_draft");
  const draftPayload = readRecord(draftArtifact?.payload);
  const payloadDraft = readRecord(payload.final_answer_draft);
  const terminalAuthority = readRecord(payload.terminal_authority_single_writer);
  const terminalAnswerAuthority = readRecord(payload.terminal_answer_authority);
  const draftSelection = readRecord(payload.final_answer_draft_selection);
  const refs = unique([
    ...readStringArray(payloadDraft?.support_refs),
    ...readStringArray(payloadDraft?.artifact_refs),
    ...readStringArray(draftPayload?.support_refs),
    ...readStringArray(draftPayload?.artifact_refs),
    ...readStringArray(terminalAuthority?.support_refs),
    ...readStringArray(terminalAnswerAuthority?.support_refs),
    ...readStringArray(draftSelection?.support_refs),
  ]);
  return (
    refs.length ||
    readNumber(payloadDraft?.support_refs_count) ||
    readNumber(draftPayload?.support_refs_count) ||
    readNumber(terminalAuthority?.support_refs_count) ||
    readNumber(terminalAnswerAuthority?.support_refs_count) ||
    readNumber(draftSelection?.support_refs_count) ||
    0
  );
};

const requiredTerminalKind = (payload: RecordLike, contract: ToolFamilyContract | null): string | null => {
  const canonicalGoal = readRecord(payload.canonical_goal_frame);
  const routeProductContract = readRecord(payload.route_product_contract);
  return (
    firstString(
      canonicalGoal?.required_terminal_kind,
      routeProductContract?.required_terminal_artifact_kind,
      routeProductContract?.required_terminal_kind,
    ) ||
    readStringArray(routeProductContract?.allowed_terminal_artifact_kinds)[0] ||
    contract?.allowedTerminalKinds[0] ||
    null
  );
};

const materializedTerminalKind = (payload: RecordLike): string | null => {
  const terminalAuthority = readRecord(payload.terminal_authority_single_writer);
  const terminalAnswerAuthority = readRecord(payload.terminal_answer_authority);
  const draftSelection = readRecord(payload.final_answer_draft_selection);
  return firstString(
    terminalAuthority?.selected_terminal_artifact_kind,
    terminalAnswerAuthority?.terminal_artifact_kind,
    terminalAuthority?.terminal_artifact_kind,
    terminalAuthority?.integrity && readRecord(terminalAuthority.integrity)?.materialized_terminal_artifact_kind,
    terminalAuthority?.materialized_terminal_artifact_kind,
    draftSelection?.materialized_terminal_artifact_kind,
    payload.terminal_artifact_kind,
  );
};

const terminalAuthorityKind = (payload: RecordLike): string | null => {
  const terminalAuthority = readRecord(payload.terminal_authority_single_writer);
  const terminalAnswerAuthority = readRecord(payload.terminal_answer_authority);
  const resolvedSummary = readRecord(payload.resolved_turn_summary);
  return firstString(
    terminalAuthority?.selected_terminal_artifact_kind,
    terminalAnswerAuthority?.terminal_artifact_kind,
    terminalAuthority?.terminal_artifact_kind,
    resolvedSummary?.terminal_artifact_kind,
    payload.terminal_artifact_kind,
  );
};

const visibleTerminalKind = (payload: RecordLike): string | null => {
  const presentation = readRecord(payload.terminal_presentation);
  const resolvedSummary = readRecord(payload.resolved_turn_summary);
  return firstString(presentation?.terminal_artifact_kind, resolvedSummary?.terminal_artifact_kind, payload.terminal_artifact_kind);
};

const expectedReentryCapability = (
  contract: ToolFamilyContract | null,
  artifacts: RecordLike[],
  followupDecision: RecordLike | null,
  observationRef: string | null,
): string | null => {
  const explicit = firstString(followupDecision?.required_next_capability, followupDecision?.next_tool);
  if (explicit) return explicit;
  for (const rule of contract?.requiredNextWhen ?? []) {
    const hasTrigger = artifacts.some((artifact) => observationKindMatches(artifact, rule.observationKind));
    const hasForbidUntil = rule.forbidTerminalUntil.some((kind) =>
      artifacts.some((artifact) => observationKindMatches(artifact, kind)),
    );
    if (hasTrigger && !hasForbidUntil) return rule.nextTool;
  }
  return contract?.requiredReentry && observationRef ? "model.direct_answer" : null;
};

const buildToolTurnChainAudit = (input: {
  payload: RecordLike;
  artifacts: RecordLike[];
  lifecycleTrace: RecordLike | null;
  followupDecision: RecordLike | null;
  capability: string | null;
  toolFamily: string | null;
  contract: ToolFamilyContract | null;
  requiredObservationCoverage: RecordLike[];
  requiredObservationsSatisfied: boolean;
}): RecordLike => {
  const admission = readRecord(input.payload.tool_call_admission_decision);
  const capabilityPlan = readRecord(input.payload.capability_plan);
  const requestedCapability = firstString(
    admission?.requested_capability,
    capabilityPlan?.requested_capability,
  );
  const requestedCapabilityContract = explicitCapabilityContractForCapability(requestedCapability);
  const selectedCapability =
    firstString(
      capabilityPlan?.selected_capability,
      input.lifecycleTrace?.admitted_capability,
      input.lifecycleTrace?.requested_capability,
    ) ?? input.capability;
  const operationalTrace = readRecord(input.payload.operational_capability_trace);
  const runtimeToolCall = readRecord(input.payload.runtime_tool_call);
  const toolExecutionRejected = runtimeToolExecutionRejected(input.payload, input.artifacts);
  const rawExecutedCapability = firstString(
    input.lifecycleTrace?.executed_capability,
    operationalTrace?.executed_capability,
    runtimeToolCall?.capability_key,
  );
  const executedCapability = toolExecutionRejected ? null : rawExecutedCapability;
  const requestedSelectedMatch =
    requestedCapability && selectedCapability
      ? explicitCapabilityMatches(requestedCapability, selectedCapability)
      : requestedCapability
        ? false
        : null;
  const selectedExecutedMatch =
    selectedCapability && executedCapability
      ? normalizedEqual(selectedCapability, executedCapability)
      : selectedCapability
        ? false
        : null;
  const requestedExecutedMatch =
    requestedCapability && executedCapability
      ? explicitCapabilityMatches(requestedCapability, executedCapability)
      : requestedCapability
        ? false
        : null;
  const selectedFamily = inferToolFamilyFromToolName(selectedCapability);
  const rawRouteFamily = firstString(input.toolFamily, input.contract?.toolFamily, selectedFamily);
  const routeFamily = isGenericAuditFamily(rawRouteFamily) && selectedFamily ? selectedFamily : rawRouteFamily;
  const executedFamily = inferToolFamilyFromToolName(executedCapability);
  const observationCoverage = input.requiredObservationCoverage.find((entry) => readBoolean(entry.present));
  const policyRejectionArtifact = runtimeToolPolicyRejectionArtifact(input.artifacts);
  const observationArtifactKind =
    toolExecutionRejected
      ? null
      : readString(observationCoverage?.kind) ||
        input.artifacts
          .map((artifact) => readString(artifact.kind) || readString(artifact.schema))
          .find((kind) => /(?:observation|result|receipt|context|validation|trace|packet|resolution|reflection)/i.test(kind)) ||
        null;
  const observationRef =
    toolExecutionRejected
      ? null
      : readStringArray(observationCoverage?.artifact_refs)[0] ||
        (observationArtifactKind ? artifactRef(artifactForKind(input.artifacts, observationArtifactKind) ?? {}) : null);
  const requestedObservationKinds = unique([
    ...readStringArray(admission?.required_observation_kinds_for_requested_capability),
    ...(requestedCapabilityContract?.required_observation_kinds ?? []),
  ]);
  const observedArtifactSupportsRequestedCapability =
    requestedObservationKinds.length === 0 ||
    input.artifacts.some((artifact) =>
      requestedObservationKinds.some((kind) => observationKindMatches(artifact, kind)),
    );
  const requiredTerminal = requiredTerminalKind(input.payload, input.contract);
  const supportCount = supportRefsCount(input.payload, input.artifacts);
  const materializedTerminal = materializedTerminalKind(input.payload);
  const authorityTerminal = terminalAuthorityKind(input.payload);
  const visibleTerminal = visibleTerminalKind(input.payload);
  const finalDraftRef = finalAnswerDraftRef(input.payload, input.artifacts);
  const reentryExecuted =
    readString(input.lifecycleTrace?.lifecycle_stage) === "reentered_solver" ||
    readBoolean(input.followupDecision?.evidence_reentered) ||
    Boolean(observationRef && supportCount > 0 && finalDraftRef);
  const expectedReentry = expectedReentryCapability(
    input.contract,
    input.artifacts,
    input.followupDecision,
    observationRef,
  );
  const terminalProjectionMismatch = Boolean(authorityTerminal && visibleTerminal && !normalizedEqual(authorityTerminal, visibleTerminal));
  const terminalProductMismatch = Boolean(
    requiredTerminal &&
      materializedTerminal &&
      materializedTerminal !== "typed_failure" &&
      !normalizedEqual(requiredTerminal, materializedTerminal) &&
      !(input.contract?.allowedTerminalKinds ?? []).some((kind) => normalizedEqual(kind, materializedTerminal)),
  );
  const terminalProductAllowed = Boolean(
    materializedTerminal &&
      !terminalProductMismatch &&
      (!requiredTerminal ||
        normalizedEqual(requiredTerminal, materializedTerminal) ||
        (input.contract?.allowedTerminalKinds ?? []).some((kind) => normalizedEqual(kind, materializedTerminal))),
  );
  const concreteTurnChainComplete = Boolean(
    executedCapability &&
      observationRef &&
      reentryExecuted &&
      terminalProductAllowed &&
      authorityTerminal &&
      visibleTerminal &&
      normalizedEqual(authorityTerminal, visibleTerminal),
  );
  const routeFamilyMismatch = Boolean(
    selectedFamily && executedFamily && selectedFamily !== executedFamily,
  );
  const toolAdmissionDrift = Boolean(
    selectedCapability &&
      executedCapability &&
      !normalizedEqual(selectedCapability, executedCapability) &&
      !routeFamilyMismatch,
  );
  const configMissing = likelyInternetSearchConfigMissing(input.payload, routeFamily);
  const repoWeakEvidenceRepairLoop =
    readString(input.payload.terminal_error_code) === "repo_evidence_weak_after_repair" ||
    input.artifacts.some((artifact) => {
      if (normalize(artifact.kind) !== "typed_failure") return false;
      const payload = artifactPayload(artifact);
      return readString(payload?.error_code) === "repo_evidence_weak_after_repair";
    });
  const draftNeedsSupport =
    Boolean(finalDraftRef) &&
    Boolean(materializedTerminal) &&
    !["typed_failure", "direct_answer_text", "tool_receipt"].some((kind) => normalizedEqual(kind, materializedTerminal));
  const railFailureCode: RailFailureCode | null =
    configMissing
      ? "config_missing"
      : requestedCapability && requestedSelectedMatch === false
        ? "explicit_capability_not_selected"
        : requestedCapability && executedCapability && requestedExecutedMatch === false
          ? "wrong_capability_executed"
          : routeFamilyMismatch
            ? "route_family_mismatch"
            : toolAdmissionDrift
              ? "tool_admission_drift"
              : toolExecutionRejected
                ? "tool_execution_rejected"
                : requestedCapability && observationRef && !observedArtifactSupportsRequestedCapability
                  ? "required_observation_missing"
                  : repoWeakEvidenceRepairLoop
                    ? "weak_evidence_repair_loop"
                    : !input.requiredObservationsSatisfied && !concreteTurnChainComplete
                      ? "observation_missing"
                      : observationRef && !reentryExecuted
                        ? "observation_not_reentered"
                        : expectedReentry && !reentryExecuted
                          ? "reentry_step_not_executed"
                          : draftNeedsSupport && supportCount === 0
                            ? "support_refs_missing"
                            : terminalProductMismatch
                              ? "terminal_product_mismatch"
                              : !materializedTerminal
                                ? "terminal_not_materialized"
                                : terminalProjectionMismatch
                                  ? "terminal_projection_mismatch"
                                  : null;
  const railStatus: RailStatus =
    railFailureCode === null ? "complete" : materializedTerminal === "typed_failure" ? "fail_closed" : "broken";

  return {
    schema: "helix.tool_turn_chain_audit.v1",
    capability_contract_guard_version: requestedCapability ? "E82" : null,
    route_family: routeFamily,
    requested_capability: requestedCapability,
    requested_capability_family:
      readNullableString(admission?.requested_capability_family) ??
      requestedCapabilityContract?.capability_family ??
      null,
    requested_capability_source:
      readNullableString(admission?.requested_capability_source) ??
      readNullableString(capabilityPlan?.requested_capability_source) ??
      null,
    requested_capability_confidence: readNumber(admission?.requested_capability_confidence),
    selected_capability: selectedCapability,
    executed_capability: executedCapability,
    requested_selected_match: requestedSelectedMatch,
    selected_executed_match: selectedExecutedMatch,
    substitution_rule_applied: false,
    substitution_rule_id: null,
    required_observation_kinds_for_requested_capability: requestedObservationKinds,
    observed_artifact_supports_requested_capability: requestedCapability
      ? observedArtifactSupportsRequestedCapability
      : null,
    policy_rejection_ref: toolExecutionRejected && policyRejectionArtifact ? artifactRef(policyRejectionArtifact) : null,
    policy_rejection_reason: toolExecutionRejected ? rejectedToolExecutionTexts(input.payload, input.artifacts).find(Boolean) ?? null : null,
    observation_artifact_kind: observationArtifactKind,
    observation_ref: observationRef,
    required_terminal_kind: requiredTerminal,
    expected_reentry_capability: expectedReentry,
    reentry_executed: reentryExecuted,
    final_answer_draft_ref: finalDraftRef,
    support_refs_count: supportCount,
    materialized_terminal_artifact_kind: materializedTerminal,
    terminal_authority_kind: authorityTerminal,
    visible_terminal_kind: visibleTerminal,
    rail_status: railStatus,
    rail_failure_code: railFailureCode,
    normalized_failure_codes: TOOL_TURN_CHAIN_FAILURE_CODES,
    assistant_answer: false,
    raw_content_included: false,
  };
};

const buildToolTurnChainFamilyMatrix = (audit: RecordLike): RecordLike[] => {
  const family = canonicalAuditFamily(audit.route_family, audit.executed_capability);
  return TOOL_TURN_CHAIN_MATRIX_FAMILIES.map((matrixFamily) => {
    const observed = family === matrixFamily;
    const authority = readString(audit.terminal_authority_kind);
    const visible = readString(audit.visible_terminal_kind);
    return {
      route_family: matrixFamily,
      observed,
      requested_capability: observed ? audit.requested_capability ?? null : null,
      requested_selected_match: observed ? audit.requested_selected_match ?? null : null,
      selected_executed_match: observed ? audit.selected_executed_match ?? null : null,
      did_tool_run: observed ? Boolean(readString(audit.executed_capability)) : null,
      artifact_produced: observed ? Boolean(readString(audit.observation_ref)) : null,
      observation_artifact_kind: observed ? audit.observation_artifact_kind ?? null : null,
      observation_ref: observed ? audit.observation_ref ?? null : null,
      artifact_reentered: observed ? audit.reentry_executed === true : null,
      required_terminal_kind: observed ? audit.required_terminal_kind ?? null : null,
      materialized: observed ? Boolean(readString(audit.materialized_terminal_artifact_kind)) : null,
      materialized_terminal_artifact_kind: observed ? audit.materialized_terminal_artifact_kind ?? null : null,
      terminal_authority_selected: observed ? Boolean(authority) : null,
      visible_projection_matches: observed && authority && visible ? normalizedEqual(authority, visible) : observed ? null : null,
      rail_status: observed ? audit.rail_status ?? "broken" : "not_applicable",
      rail_failure_code: observed ? audit.rail_failure_code ?? null : null,
    };
  });
};

const hasTerminalProduct = (audit: RecordLike): boolean => Boolean(readString(audit.materialized_terminal_artifact_kind));

const terminalKindRequiresSupportBackedDraft = (audit: RecordLike): boolean => {
  const terminalKind = normalize(audit.materialized_terminal_artifact_kind) || normalize(audit.required_terminal_kind);
  if (!terminalKind) return false;
  if (terminalKind === "typed_failure" || terminalKind === "request_user_input") return false;
  if (TERMINAL_RECEIPT_KINDS.has(terminalKind)) return false;
  return terminalKind.includes("model_synthesized") || terminalKind.includes("answer") || terminalKind.includes("summary");
};

const triageFromAudit = (audit: RecordLike): {
  first_broken_rail: FirstBrokenRail | null;
  failure_bucket: FailureBucket | null;
  repair_target: RepairTarget | null;
} => {
  const railFailureCode = readString(audit.rail_failure_code);
  const routeFamily = readString(audit.route_family);
  const selectedCapability = readString(audit.selected_capability);
  const executedCapability = readString(audit.executed_capability);
  const observationRef = readString(audit.observation_ref);
  const reentryExecuted = audit.reentry_executed === true;
  const finalDraftRef = readString(audit.final_answer_draft_ref);
  const supportCount = readNumber(audit.support_refs_count) ?? 0;
  const materializedTerminal = readString(audit.materialized_terminal_artifact_kind);
  const terminalAuthority = readString(audit.terminal_authority_kind);
  const visibleTerminal = readString(audit.visible_terminal_kind);

  if (railFailureCode === "config_missing") {
    return { first_broken_rail: "config", failure_bucket: "G_config_missing", repair_target: "operator_config" };
  }
  if (railFailureCode === "explicit_capability_not_selected") {
    return {
      first_broken_rail: "route_admission",
      failure_bucket: "H_route_tool_family_contract_mismatch",
      repair_target: "intent_arbitration",
    };
  }
  if (railFailureCode === "wrong_capability_executed") {
    return {
      first_broken_rail: "capability_execution",
      failure_bucket: "H_route_tool_family_contract_mismatch",
      repair_target: "agent_step_selection",
    };
  }
  if (!routeFamily || railFailureCode === "route_family_mismatch") {
    return {
      first_broken_rail: "route_admission",
      failure_bucket: "H_route_tool_family_contract_mismatch",
      repair_target: "tool_admission",
    };
  }
  if (railFailureCode === "tool_admission_drift") {
    return {
      first_broken_rail: "capability_execution",
      failure_bucket: "H_route_tool_family_contract_mismatch",
      repair_target: "tool_admission",
    };
  }
  if (railFailureCode === "tool_execution_rejected") {
    return {
      first_broken_rail: "capability_execution",
      failure_bucket: "A_tool_did_not_execute",
      repair_target: "tool_admission",
    };
  }
  if (selectedCapability && !executedCapability) {
    return {
      first_broken_rail: "capability_execution",
      failure_bucket: "A_tool_did_not_execute",
      repair_target: "tool_execution",
    };
  }
  if (railFailureCode === "weak_evidence_repair_loop") {
    return {
      first_broken_rail: "evidence_reentry",
      failure_bucket: "C_observation_not_reentered",
      repair_target: "repo_retrieval_repair_policy",
    };
  }
  if (!observationRef || railFailureCode === "observation_missing") {
    return {
      first_broken_rail: "observation_artifact",
      failure_bucket: "B_tool_executed_observation_missing",
      repair_target: "observation_materializer",
    };
  }
  if (railFailureCode === "required_observation_missing") {
    return {
      first_broken_rail: "observation_artifact",
      failure_bucket: "B_tool_executed_observation_missing",
      repair_target: "observation_materializer",
    };
  }
  if (!reentryExecuted || railFailureCode === "observation_not_reentered" || railFailureCode === "reentry_step_not_executed") {
    return {
      first_broken_rail: "evidence_reentry",
      failure_bucket: "C_observation_not_reentered",
      repair_target: "reentry_gate",
    };
  }
  if (!finalDraftRef && !hasTerminalProduct(audit)) {
    return {
      first_broken_rail: "support_backed_draft",
      failure_bucket: "D_support_backed_draft_missing",
      repair_target: "draft_builder",
    };
  }
  if (terminalKindRequiresSupportBackedDraft(audit) && finalDraftRef && supportCount === 0) {
    return {
      first_broken_rail: "support_backed_draft",
      failure_bucket: "D_support_backed_draft_missing",
      repair_target: "draft_builder",
    };
  }
  if (!materializedTerminal || railFailureCode === "terminal_not_materialized" || railFailureCode === "terminal_product_mismatch") {
    return {
      first_broken_rail: "terminal_materialization",
      failure_bucket: "E_terminal_materializer_gap",
      repair_target: "terminal_materializer",
    };
  }
  if (!terminalAuthority) {
    return {
      first_broken_rail: "terminal_authority",
      failure_bucket: "E_terminal_materializer_gap",
      repair_target: "terminal_authority",
    };
  }
  if (!visibleTerminal || railFailureCode === "terminal_projection_mismatch" || !normalizedEqual(terminalAuthority, visibleTerminal)) {
    return {
      first_broken_rail: "visible_projection",
      failure_bucket: "F_terminal_projection_mismatch",
      repair_target: "presenter_boundary",
    };
  }
  return { first_broken_rail: null, failure_bucket: null, repair_target: null };
};

const buildToolRailFailureTriage = (input: {
  turnId: string;
  audit: RecordLike;
}): RecordLike => {
  const triage = triageFromAudit(input.audit);
  const executedCapability = readString(input.audit.executed_capability);
  const observationRef = readString(input.audit.observation_ref);
  return {
    schema: "helix.tool_rail_failure_triage.v1",
    turn_id: input.turnId,
    route_family: readNullableString(input.audit.route_family),
    capability_contract_guard_version: readNullableString(input.audit.capability_contract_guard_version),
    requested_capability: readNullableString(input.audit.requested_capability),
    requested_capability_family: readNullableString(input.audit.requested_capability_family),
    requested_capability_source: readNullableString(input.audit.requested_capability_source),
    requested_capability_confidence: readNumber(input.audit.requested_capability_confidence),
    selected_capability: readNullableString(input.audit.selected_capability),
    executed_capability: executedCapability || null,
    requested_selected_match:
      typeof input.audit.requested_selected_match === "boolean" ? input.audit.requested_selected_match : null,
    selected_executed_match:
      typeof input.audit.selected_executed_match === "boolean" ? input.audit.selected_executed_match : null,
    substitution_rule_applied: input.audit.substitution_rule_applied === true,
    substitution_rule_id: readNullableString(input.audit.substitution_rule_id),
    required_observation_kinds_for_requested_capability:
      readStringArray(input.audit.required_observation_kinds_for_requested_capability),
    observed_artifact_supports_requested_capability:
      typeof input.audit.observed_artifact_supports_requested_capability === "boolean"
        ? input.audit.observed_artifact_supports_requested_capability
        : null,
    did_tool_run: Boolean(executedCapability),
    policy_rejection_ref: readNullableString(input.audit.policy_rejection_ref),
    policy_rejection_reason: readNullableString(input.audit.policy_rejection_reason),
    observation_artifact_kind: readNullableString(input.audit.observation_artifact_kind),
    observation_ref: observationRef || null,
    reentry_executed: input.audit.reentry_executed === true,
    required_terminal_kind: readNullableString(input.audit.required_terminal_kind),
    final_answer_draft_ref: readNullableString(input.audit.final_answer_draft_ref),
    support_refs_count: readNumber(input.audit.support_refs_count) ?? 0,
    materialized_terminal_artifact_kind: readNullableString(input.audit.materialized_terminal_artifact_kind),
    terminal_authority_kind: readNullableString(input.audit.terminal_authority_kind),
    visible_terminal_kind: readNullableString(input.audit.visible_terminal_kind),
    first_broken_rail: triage.first_broken_rail,
    failure_bucket: triage.failure_bucket,
    rail_status: readString(input.audit.rail_status) || "broken",
    rail_failure_code: readNullableString(input.audit.rail_failure_code),
    repair_target: triage.repair_target,
    assistant_answer: false,
    raw_content_included: false,
  };
};

const buildArtifactEntry = (artifact: RecordLike): RecordLike => {
  const payload = artifactPayload(artifact);
  const ref = artifactRef(artifact);
  const kind = readString(artifact.kind);
  const schema = readString(artifact.schema);
  const payloadKind = readString(payload?.kind);
  const payloadSchema = readString(payload?.schema);
  const queryKeys = unique([
    ref,
    kind,
    schema,
    payloadKind,
    payloadSchema,
    readString(artifact.producer_item_id),
    readString(artifact.source_scope),
  ]);
  return {
    ref,
    kind: kind || null,
    schema: schema || null,
    payload_kind: payloadKind || null,
    payload_schema: payloadSchema || null,
    source_scope: readString(artifact.source_scope) || null,
    producer_item_id: readString(artifact.producer_item_id) || null,
    query_keys: queryKeys,
    assistant_answer: readBoolean(payload?.assistant_answer),
    terminal_eligible: readBoolean(payload?.terminal_eligible),
    raw_content_included: readBoolean(payload?.raw_content_included),
  };
};

export const buildArtifactQueryIndex = (input: {
  turnId: string;
  payload: RecordLike;
}): RecordLike => {
  const lifecycleTrace = readRecord(input.payload.tool_lifecycle_trace);
  const followupDecision = readRecord(input.payload.tool_followup_decision);
  const artifacts = artifactsForPayload(input.payload);
  const lifecycleCapability = capabilityFromPayload(input.payload, lifecycleTrace);
  const artifactCapability = capabilityFromArtifacts(artifacts);
  const capability =
    artifactCapability && shouldPreferArtifactCapability(lifecycleCapability)
      ? artifactCapability
      : lifecycleCapability ?? artifactCapability;
  const lifecycleFamily = familyFromPayload(input.payload, lifecycleTrace);
  const inferredArtifactFamily = artifactInferredFamily(artifacts);
  const toolFamily =
    inferredArtifactFamily && shouldPreferArtifactFamily(lifecycleFamily, capability)
      ? inferredArtifactFamily
      : lifecycleFamily ?? inferredArtifactFamily;
  const contract = resolveToolFamilyContract({
    toolName: capability,
    toolFamily,
  });
  const resolvedToolFamily = isGenericAuditFamily(toolFamily) && contract?.toolFamily ? contract.toolFamily : toolFamily;
  const artifactRefs = artifacts.map(buildArtifactEntry);
  const requiredObservationCoverage = (contract?.requiredObservationKinds ?? []).map((kind) => {
    const matches = artifacts.filter((artifact) => observationKindMatches(artifact, kind)).map(artifactRef);
    return {
      kind,
      present: matches.length > 0,
      artifact_refs: unique(matches),
    };
  });
  const requiredObservationsSatisfied = requiredObservationCoverage.every((entry) => entry.present === true);
  const lifecycleObservationRefs = readStringArray(lifecycleTrace?.observation_refs);
  const lifecycleReceiptRefs = readStringArray(lifecycleTrace?.receipt_refs);
  const lifecycleEvidenceRefs = readStringArray(lifecycleTrace?.evidence_refs);
  const toolTurnChainAudit = buildToolTurnChainAudit({
    payload: input.payload,
    artifacts,
    lifecycleTrace,
    followupDecision,
    capability,
    toolFamily: resolvedToolFamily,
    contract,
    requiredObservationCoverage,
    requiredObservationsSatisfied,
  });
  const toolRailFailureTriage = buildToolRailFailureTriage({
    turnId: input.turnId,
    audit: toolTurnChainAudit,
  });

  return {
    schema: "helix.artifact_query_index.v1",
    turn_id: input.turnId,
    source: "debug_export_current_turn_ledger",
    artifact_count: artifactRefs.length,
    artifact_refs: artifactRefs,
    queryable_artifact_keys: unique(artifactRefs.flatMap((entry) => readStringArray(entry.query_keys))),
    tool_family: resolvedToolFamily,
    capability,
    tool_family_contract: contractSummary(contract),
    required_observation_coverage: requiredObservationCoverage,
    missing_required_observation_kinds: requiredObservationCoverage
      .filter((entry) => entry.present !== true)
      .map((entry) => entry.kind),
    lifecycle_refs: {
      observation_refs: lifecycleObservationRefs,
      receipt_refs: lifecycleReceiptRefs,
      evidence_refs: lifecycleEvidenceRefs,
    },
    reentry_status: {
      evidence_reentered:
        readString(lifecycleTrace?.lifecycle_stage) === "reentered_solver" ||
        readBoolean(followupDecision?.evidence_reentered),
      followup_next_action: readString(followupDecision?.next_action) || null,
      terminal_use_allowed:
        readBoolean(lifecycleTrace?.terminal_eligible) &&
        readString(followupDecision?.next_action) === "terminal_answer" &&
        requiredObservationsSatisfied,
    },
    tool_turn_chain_audit: toolTurnChainAudit,
    tool_rail_failure_triage: toolRailFailureTriage,
    tool_turn_chain_family_matrix: buildToolTurnChainFamilyMatrix(toolTurnChainAudit),
    assistant_answer: false,
    raw_content_included: false,
  };
};
