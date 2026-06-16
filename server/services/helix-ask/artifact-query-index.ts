import {
  inferToolFamilyFromToolName,
  resolveToolFamilyContract,
  TOOL_FAMILY_DEFAULT_CONTRACTS,
  type ToolFamilyContract,
} from "./tool-family-contract";

type RecordLike = Record<string, unknown>;

type RailFailureCode =
  | "route_family_mismatch"
  | "tool_admission_drift"
  | "observation_missing"
  | "observation_not_reentered"
  | "reentry_step_not_executed"
  | "support_refs_missing"
  | "terminal_product_mismatch"
  | "terminal_not_materialized"
  | "terminal_projection_mismatch"
  | "config_missing";

type RailStatus = "complete" | "broken" | "fail_closed";

const TOOL_TURN_CHAIN_FAILURE_CODES: RailFailureCode[] = [
  "route_family_mismatch",
  "tool_admission_drift",
  "observation_missing",
  "observation_not_reentered",
  "reentry_step_not_executed",
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

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

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
    !normalizedFamily ||
    normalizedFamily === "none" ||
    normalizedFamily === "unknown" ||
    normalizedFamily === "workstation_action" ||
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
  const normalized = normalize(family) || normalize(capability);
  if (!normalized) return null;
  if (normalized.includes("live_source") || normalized.includes("live_env") || normalized.includes("micro_reasoner")) {
    return "live_env";
  }
  if (normalized.includes("image_lens") || normalized.includes("visual_capture") || normalized.includes("visual")) {
    return "image_lens / visual_capture";
  }
  return normalized;
};

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
  const draftSelection = readRecord(payload.final_answer_draft_selection);
  return firstString(
    draftSelection?.materialized_terminal_artifact_kind,
    terminalAuthority?.integrity && readRecord(terminalAuthority.integrity)?.materialized_terminal_artifact_kind,
    terminalAuthority?.materialized_terminal_artifact_kind,
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
  const selectedCapability =
    firstString(input.lifecycleTrace?.admitted_capability, input.lifecycleTrace?.requested_capability) ?? input.capability;
  const executedCapability = firstString(input.lifecycleTrace?.executed_capability, input.capability);
  const routeFamily = firstString(input.toolFamily, input.contract?.toolFamily, inferToolFamilyFromToolName(selectedCapability));
  const selectedFamily = inferToolFamilyFromToolName(selectedCapability);
  const executedFamily = inferToolFamilyFromToolName(executedCapability);
  const observationCoverage = input.requiredObservationCoverage.find((entry) => readBoolean(entry.present));
  const observationArtifactKind =
    readString(observationCoverage?.kind) ||
    input.artifacts
      .map((artifact) => readString(artifact.kind) || readString(artifact.schema))
      .find((kind) => /(?:observation|result|receipt|context|validation|trace|packet|resolution|reflection)/i.test(kind)) ||
    null;
  const observationRef =
    readStringArray(observationCoverage?.artifact_refs)[0] ||
    (observationArtifactKind ? artifactRef(artifactForKind(input.artifacts, observationArtifactKind) ?? {}) : null);
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
  const draftNeedsSupport =
    Boolean(finalDraftRef) &&
    Boolean(materializedTerminal) &&
    !["typed_failure", "direct_answer_text", "tool_receipt"].some((kind) => normalizedEqual(kind, materializedTerminal));
  const railFailureCode: RailFailureCode | null =
    configMissing
      ? "config_missing"
      : routeFamilyMismatch
        ? "route_family_mismatch"
        : toolAdmissionDrift
          ? "tool_admission_drift"
          : !input.requiredObservationsSatisfied
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
    route_family: routeFamily,
    selected_capability: selectedCapability,
    executed_capability: executedCapability,
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
    toolFamily,
    contract,
    requiredObservationCoverage,
    requiredObservationsSatisfied,
  });

  return {
    schema: "helix.artifact_query_index.v1",
    turn_id: input.turnId,
    source: "debug_export_current_turn_ledger",
    artifact_count: artifactRefs.length,
    artifact_refs: artifactRefs,
    queryable_artifact_keys: unique(artifactRefs.flatMap((entry) => readStringArray(entry.query_keys))),
    tool_family: toolFamily,
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
    tool_turn_chain_family_matrix: buildToolTurnChainFamilyMatrix(toolTurnChainAudit),
    assistant_answer: false,
    raw_content_included: false,
  };
};
