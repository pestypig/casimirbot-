export type HelixCapabilityItineraryArtifactLike = {
  artifact_id?: unknown;
  kind?: unknown;
  payload?: unknown;
  source_scope?: unknown;
};

export type HelixCapabilityItineraryExecutionState = {
  schema: "helix.capability_itinerary_execution_state.v1";
  applies: boolean;
  required_observation_families: string[];
  required_observation_kinds: string[];
  required_capabilities: string[];
  admitted_tool_families: string[];
  observed_families: string[];
  missing_observation_families: string[];
  next_missing_family: string | null;
  missing_required_observation_kinds: string[];
  next_missing_required_observation_kind: string | null;
  missing_compound_subgoal_ids: string[];
  missing_required_capabilities: string[];
  compound_subgoal_ledger: Array<Record<string, unknown>>;
  next_missing_subgoal_id: string | null;
  complete: boolean;
  assistant_answer: false;
  raw_content_included: false;
};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)));

const subgoalFirstBrokenRailFor = (failureCode: string | null, satisfaction: string): string | null => {
  if (satisfaction === "satisfied" || !failureCode) return null;
  if (failureCode.startsWith("invalid_arg:")) return "capability_execution";
  if (failureCode === "input_binding_missing") return "evidence_reentry";
  if (failureCode === "subgoal_observation_missing") return "observation_artifact";
  return "capability_execution";
};

const subgoalRepairTargetFor = (failureCode: string | null, satisfaction: string): string | null => {
  if (satisfaction === "satisfied" || !failureCode) return null;
  if (failureCode.startsWith("invalid_arg:")) return "tool_execution";
  if (failureCode === "input_binding_missing") return "reentry_gate";
  if (failureCode === "subgoal_observation_missing") return "observation_materializer";
  return "tool_execution";
};

const normalizeCalculatorExpression = (value: string | null): string | null => {
  if (!value) return null;
  return value.replace(/\s+/g, "").trim().toLowerCase() || null;
};

const artifactPayload = (artifact: HelixCapabilityItineraryArtifactLike): Record<string, unknown> | null =>
  readRecord(artifact.payload);

const artifactSchema = (artifact: HelixCapabilityItineraryArtifactLike): string | null =>
  readString(artifactPayload(artifact)?.schema);

const artifactKind = (artifact: HelixCapabilityItineraryArtifactLike): string =>
  readString(artifact.kind) ?? readString(artifactPayload(artifact)?.kind) ?? "unknown";

const artifactId = (artifact: HelixCapabilityItineraryArtifactLike): string | null =>
  readString(artifact.artifact_id) ??
  readString((artifact as Record<string, unknown>).artifact_ref) ??
  readString(artifactPayload(artifact)?.artifact_id);

const nestedObservationPayloads = (artifact: HelixCapabilityItineraryArtifactLike): Array<Record<string, unknown>> => {
  const payload = artifactPayload(artifact);
  const observation = readRecord(payload?.observation);
  const result = readRecord(payload?.result);
  return [payload, observation, result].filter((entry: Record<string, unknown> | null): entry is Record<string, unknown> => Boolean(entry));
};

const artifactMatchesObservationKind = (artifact: HelixCapabilityItineraryArtifactLike, pattern: RegExp): boolean => {
  const values = [
    artifactKind(artifact),
    artifactSchema(artifact),
    artifactId(artifact),
    ...nestedObservationPayloads(artifact).flatMap((payload: Record<string, unknown>) => [
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
  return values.some((value: string) => pattern.test(value));
};

const escapedFamilyPattern = (family: string): RegExp =>
  new RegExp(family.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

const artifactCapability = (artifact: HelixCapabilityItineraryArtifactLike): string | null => {
  const payload = artifactPayload(artifact);
  const observation = readRecord(payload?.observation);
  const result = readRecord(payload?.result);
  const action = readRecord(payload?.action);
  return (
    readString(payload?.capability_key) ??
    readString(payload?.selected_capability) ??
    readString(payload?.requested_capability) ??
    readString(payload?.tool_key) ??
    readString(payload?.tool_name) ??
    readString(payload?.trace_source) ??
    readString(observation?.capability_key) ??
    readString(observation?.tool_key) ??
    readString(result?.capability_key) ??
    readString(result?.tool_key) ??
    readString(action?.capability_key) ??
    null
  );
};

const artifactCompoundSubgoalId = (artifact: HelixCapabilityItineraryArtifactLike): string | null => {
  const payload = artifactPayload(artifact);
  const observation = readRecord(payload?.observation);
  const result = readRecord(payload?.result);
  const action = readRecord(payload?.action);
  return (
    readString(payload?.compound_subgoal_id) ??
    readString(payload?.subgoal_id) ??
    readString(observation?.compound_subgoal_id) ??
    readString(observation?.subgoal_id) ??
    readString(result?.compound_subgoal_id) ??
    readString(result?.subgoal_id) ??
    readString(action?.compound_subgoal_id) ??
    readString(action?.subgoal_id) ??
    null
  );
};

const artifactMatchesCapability = (
  artifact: HelixCapabilityItineraryArtifactLike,
  capability: string,
  runtimeCapability: string,
  substitutions: string[],
): boolean => {
  const actual = artifactCapability(artifact);
  if (!actual) return false;
  return actual === capability || actual === runtimeCapability || substitutions.includes(actual);
};

const artifactCapabilityHaystack = (artifact: HelixCapabilityItineraryArtifactLike): string => {
  const payload = artifactPayload(artifact);
  const observation = readRecord(payload?.observation);
  const result = readRecord(payload?.result);
  const action = readRecord(payload?.action);
  return [
    artifactId(artifact),
    artifactKind(artifact),
    artifactSchema(artifact),
    readString(payload?.evaluation_id),
    readString(payload?.receipt_id),
    readString(payload?.result_ref),
    readString(payload?.source_ref),
    readString(payload?.source_kind),
    readString(payload?.trace_source),
    ...readArray(payload?.tool_receipt_ids).map(readString),
    ...readArray(payload?.evidence_refs).map(readString),
    ...readArray(payload?.support_refs).map(readString),
    ...readArray(payload?.observation_refs).map(readString),
    readString(observation?.evaluation_id),
    readString(observation?.receipt_id),
    readString(result?.evaluation_id),
    readString(result?.receipt_id),
    readString(action?.evaluation_id),
  ].filter((entry: string | null): entry is string => Boolean(entry)).join(" ");
};

const observationKindBelongsToCapability = (
  artifact: HelixCapabilityItineraryArtifactLike,
  capability: string,
  runtimeCapability: string,
): boolean => {
  const text = artifactCapabilityHaystack(artifact);
  const kind = artifactKind(artifact);
  if (capability === "scientific-calculator.solve_expression" || runtimeCapability === "scientific-calculator.solve_expression") {
    return /calculator_receipt|calculator_result|scientific[-_.:]calculator[-_.:]solve[-_.:]expression/i.test(text) ||
      /^(?:calculator_receipt|calculator_result)$/i.test(kind);
  }
  if (capability === "workspace_os.status" || runtimeCapability === "workspace_os.status") {
    return /workspace_os\.status|workspace[-_]os[-_]status|workspace_status/i.test(text) ||
      /^workspace_os_status_observation$/i.test(kind);
  }
  if (capability === "docs-viewer.locate_in_doc" || runtimeCapability === "docs-viewer.locate_in_doc") {
    return /docs[-_]viewer[-_.:]locate[-_]in[-_]doc|doc_location|doc_evidence_location/i.test(text) ||
      /^doc_(?:location|evidence)/i.test(kind);
  }
  if (capability === "repo-code.search_concept" || runtimeCapability === "repo-code.search_concept") {
    return /repo[-_]code[-_.:]search[-_]concept|repo_code_evidence/i.test(text) ||
      /^repo_code_evidence_observation$/i.test(kind);
  }
  if (capability === "helix_ask.inspect_capability_catalog" || runtimeCapability === "helix_ask.inspect_capability_catalog") {
    return /capability_catalog|capability_registry|capability_help_summary/i.test(text) ||
      /capability_(?:registry|help_summary)/i.test(kind);
  }
  if (capability === "image_lens.inspect" || runtimeCapability === "situation-room.describe_visual_capture") {
    return /image_lens\.inspect|situation[-_]room[-_.:]describe[-_]visual[-_]capture|visual_frame|visual_capture|situation_context_pack/i.test(text) ||
      /visual_frame_evidence|visual_capture_coverage|situation_context_pack/i.test(kind);
  }
  return true;
};

const calculatorExpressionFromRecord = (record: Record<string, unknown> | null): string | null => {
  if (!record) return null;
  const calculatorSetup = readRecord(record.calculator_setup);
  return (
    readString(record.latex) ??
    readString(record.expression) ??
    readString(record.display_latex) ??
    readString(calculatorSetup?.latex) ??
    readString(calculatorSetup?.expression) ??
    readString(calculatorSetup?.display_latex) ??
    readString(calculatorSetup?.equation) ??
    null
  );
};

const artifactCalculatorExpression = (artifact: HelixCapabilityItineraryArtifactLike): string | null => {
  const payload = artifactPayload(artifact);
  const observation = readRecord(payload?.observation);
  const result = readRecord(payload?.result);
  const action = readRecord(payload?.action);
  return (
    calculatorExpressionFromRecord(payload) ??
    calculatorExpressionFromRecord(observation) ??
    calculatorExpressionFromRecord(result) ??
    calculatorExpressionFromRecord(action) ??
    null
  );
};

const subgoalCalculatorExpression = (argsHint: Record<string, unknown> | null): string | null =>
  calculatorExpressionFromRecord(argsHint);

const calculatorSubgoalIdMismatchIsExpressionMatch = (
  artifact: HelixCapabilityItineraryArtifactLike,
  capability: string,
  runtimeCapability: string,
  argsHint: Record<string, unknown> | null,
): boolean => {
  if (capability !== "scientific-calculator.solve_expression" && runtimeCapability !== "scientific-calculator.solve_expression") {
    return false;
  }
  const artifactExpression = normalizeCalculatorExpression(artifactCalculatorExpression(artifact));
  const expectedExpression = normalizeCalculatorExpression(subgoalCalculatorExpression(argsHint));
  return Boolean(artifactExpression && expectedExpression && artifactExpression === expectedExpression);
};

const artifactMatchesRequiredObservationKind = (
  artifact: HelixCapabilityItineraryArtifactLike,
  requiredObservationKinds: string[],
  capability: string,
  runtimeCapability: string,
): boolean => {
  if (requiredObservationKinds.some((kind: string) => artifactMatchesObservationKind(artifact, escapedFamilyPattern(kind)))) {
    return true;
  }
  if (
    (capability === "scientific-calculator.solve_expression" || runtimeCapability === "scientific-calculator.solve_expression") &&
    requiredObservationKinds.includes("calculator_receipt") &&
    artifactMatchesObservationKind(artifact, /calculator_subgoal_receipt/i)
  ) {
    return true;
  }
  return false;
};

const artifactSupportsSubgoalObservation = (
  artifact: HelixCapabilityItineraryArtifactLike,
  subgoalId: string | null,
  capability: string,
  runtimeCapability: string,
  substitutions: string[],
  requiredObservationKinds: string[],
  argsHint: Record<string, unknown> | null,
): boolean => {
  if (!artifactMatchesRequiredObservationKind(artifact, requiredObservationKinds, capability, runtimeCapability)) {
    return false;
  }
  const artifactSubgoalId = artifactCompoundSubgoalId(artifact);
  if (
    artifactSubgoalId &&
    subgoalId &&
    artifactSubgoalId !== subgoalId &&
    !calculatorSubgoalIdMismatchIsExpressionMatch(artifact, capability, runtimeCapability, argsHint)
  ) return false;
  const actualCapability = artifactCapability(artifact);
  if (actualCapability) return artifactMatchesCapability(artifact, capability, runtimeCapability, substitutions);
  return observationKindBelongsToCapability(artifact, capability, runtimeCapability);
};

const artifactValidationErrors = (artifact: HelixCapabilityItineraryArtifactLike): string[] => {
  const payload = artifactPayload(artifact);
  return readArray(payload?.errors)
    .map(readString)
    .filter((entry: string | null): entry is string => Boolean(entry));
};

const artifactArgs = (artifact: HelixCapabilityItineraryArtifactLike): Record<string, unknown> | null => {
  const payload = artifactPayload(artifact);
  return readRecord(payload?.args);
};

const artifactSupportRefs = (artifact: HelixCapabilityItineraryArtifactLike | null): string[] => {
  if (!artifact) return [];
  const payload = artifactPayload(artifact);
  const observation = readRecord(payload?.observation);
  const result = readRecord(payload?.result);
  const refs = [
    artifactId(artifact),
    readString(payload?.source_ref),
    readString(payload?.target_ref),
    readString(payload?.result_ref),
    readString(payload?.receipt_id),
    readString(payload?.evaluation_id),
    readString(observation?.source_ref),
    readString(observation?.receipt_id),
    readString(result?.source_ref),
    readString(result?.receipt_id),
    ...readArray(payload?.support_refs).map(readString),
    ...readArray(payload?.evidence_refs).map(readString),
    ...readArray(payload?.observation_refs).map(readString),
    ...readArray(payload?.receipt_refs).map(readString),
    ...readArray(payload?.tool_receipt_ids).map(readString),
  ];
  return uniqueStrings(refs);
};

const artifactCompletedRuntimeObservation = (
  artifact: HelixCapabilityItineraryArtifactLike,
  capability: string,
  runtimeCapability: string,
  substitutions: string[],
): boolean => {
  if (artifactKind(artifact) !== "runtime_tool_observation") return false;
  const payload = artifactPayload(artifact);
  return readString(payload?.status) === "completed" &&
    artifactMatchesCapability(artifact, capability, runtimeCapability, substitutions);
};

const artifactProvesCompletedCapability = (
  artifact: HelixCapabilityItineraryArtifactLike,
  capability: string,
  runtimeCapability: string,
  substitutions: string[],
): boolean => {
  if (artifactCompletedRuntimeObservation(artifact, capability, runtimeCapability, substitutions)) return true;
  if (capability !== "scientific-calculator.solve_expression" && runtimeCapability !== "scientific-calculator.solve_expression") {
    return false;
  }
  const payload = artifactPayload(artifact);
  const actionAuthorization = readRecord(payload?.action_authorization);
  const kind = artifactKind(artifact);
  if (kind === "calculator_subgoal_receipt") {
    return readString(payload?.status) === "completed" &&
      artifactMatchesCapability(artifact, capability, runtimeCapability, substitutions) &&
      (
        payload?.authorized_by_agent_step_decision === true ||
        actionAuthorization?.authorizes_tool_execution === true
      );
  }
  if (kind === "workstation_tool_evaluation") {
    return artifactMatchesCapability(artifact, capability, runtimeCapability, substitutions) &&
      (payload?.supports_goal === true || readString(payload?.authority) === "agent_runtime_loop");
  }
  return false;
};

export const isHelixCapabilityItineraryFamilyObserved = (
  family: string,
  artifacts: HelixCapabilityItineraryArtifactLike[],
): boolean => {
  if (family === "scholarly_research") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      /scholarly_research_observation|scholarly_full_text_observation|theory_frontier_literature_map/i.test([
        artifactKind(artifact),
        artifactSchema(artifact),
        artifactId(artifact),
      ].join(" ")),
    );
  }
  if (family === "internet_search") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      /internet_search_observation/i.test([
        artifactKind(artifact),
        artifactSchema(artifact),
        artifactId(artifact),
      ].join(" ")),
    );
  }
  if (family === "theory_locator") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      artifactMatchesObservationKind(
        artifact,
        /helix_theory_context_reflection_tool_receipt|theory_context_reflection|theory_frontier_search|theory_frontier_candidate|theory_frontier_exact_contract_verification/i,
      ),
    );
  }
  if (family === "repo_code") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      /repo_code_evidence_observation/i.test([artifactKind(artifact), artifactSchema(artifact)].join(" ")),
    );
  }
  if (family === "docs_viewer") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      /doc_|docs_viewer/i.test([artifactKind(artifact), artifactSchema(artifact)].join(" ")),
    );
  }
  if (family === "calculator") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      /calculator_receipt|calculator_subgoal_receipt|calculator_result|workstation_tool_evaluation/i.test([
        artifactKind(artifact),
        artifactSchema(artifact),
        artifactId(artifact),
      ].join(" ")),
    );
  }
  if (family === "workspace_diagnostic") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      /workspace_os_status_observation|workspace_status/i.test([
        artifactKind(artifact),
        artifactSchema(artifact),
        artifactId(artifact),
      ].join(" ")),
    );
  }
  if (family === "capability_catalog") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      /capability_registry|capability_help_summary/i.test([
        artifactKind(artifact),
        artifactSchema(artifact),
        artifactId(artifact),
      ].join(" ")),
    );
  }
  if (family === "visual_capture" || family === "situation_run") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      /visual_frame_evidence|situation_context_pack|visual_capture_coverage/i.test([
        artifactKind(artifact),
        artifactSchema(artifact),
        artifactId(artifact),
      ].join(" ")),
    );
  }
  if (family === "workspace_directory") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      /workspace_directory_resolution/i.test([
        artifactKind(artifact),
        artifactSchema(artifact),
        artifactId(artifact),
      ].join(" ")),
    );
  }
  if (family === "live_environment") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) => artifactKind(artifact) === "live_environment_tool_observation");
  }
  if (family === "workstation_action" || family === "notes") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      /workspace_action_receipt|note_update_receipt|workstation_tool_evaluation/i.test([
        artifactKind(artifact),
        artifactSchema(artifact),
      ].join(" ")),
    );
  }
  return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) => artifactMatchesObservationKind(artifact, escapedFamilyPattern(family)));
};

export const buildHelixCapabilityItineraryExecutionState = (args: {
  capabilityItinerary?: unknown;
  artifacts?: HelixCapabilityItineraryArtifactLike[] | null;
}): HelixCapabilityItineraryExecutionState => {
  const itinerary = readRecord(args.capabilityItinerary);
  const terminalCriteria = readRecord(itinerary?.terminal_success_criteria);
  const compoundContract = readRecord(itinerary?.compound_capability_contract);
  const compoundSubgoals = readArray(compoundContract?.subgoals)
    .map(readRecord)
    .filter((entry: Record<string, unknown> | null): entry is Record<string, unknown> => Boolean(entry));
  const applies = terminalCriteria?.requires_post_observation_synthesis === true;
  const requiredFamilies = applies
    ? readArray(terminalCriteria?.required_observation_families)
        .map(readString)
        .filter((entry: string | null): entry is string => Boolean(entry))
    : [];
  const requiredCapabilities = readArray(terminalCriteria?.required_capabilities)
    .map(readString)
    .filter((entry: string | null): entry is string => Boolean(entry));
  const admittedFamilies = readArray(itinerary?.admitted_tool_families)
    .map(readString)
    .filter((entry: string | null): entry is string => Boolean(entry));
  const plannedSteps = readArray(itinerary?.planned_steps)
    .map(readRecord)
    .filter((entry: Record<string, unknown> | null): entry is Record<string, unknown> => Boolean(entry));
  const artifacts = args.artifacts ?? [];
  const observedFamilies = requiredFamilies.filter((family: string) =>
    isHelixCapabilityItineraryFamilyObserved(family, artifacts),
  );
  const requiredObservationKinds = Array.from(new Set(
    plannedSteps
      .map((step: Record<string, unknown>) => readArray(step.required_observation_kinds)
        .map(readString)
        .filter((entry: string | null): entry is string => Boolean(entry)))
      .filter((kinds: string[]) => kinds.some((kind: string) => /^theory_frontier_/i.test(kind)))
      .flat()
      .filter((kind: string) =>
        /^theory_frontier_/i.test(kind) ||
        kind === "scholarly_research_observation" ||
        kind === "scholarly_full_text_observation"
      )
  )).sort();
  const missingRequiredObservationKinds = requiredObservationKinds.filter((kind: string) =>
    !artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      artifactMatchesObservationKind(artifact, escapedFamilyPattern(kind))
    )
  );
  const rawCompoundSubgoalLedger: Array<Record<string, unknown>> = compoundSubgoals.map((subgoal: Record<string, unknown>) => {
    const subgoalId = readString(subgoal.subgoal_id);
    const requestedCapability = readString(subgoal.requested_capability) ?? "";
    const runtimeCapability = readString(subgoal.runtime_capability) ?? requestedCapability;
    const substitutions = readArray(subgoal.allowed_substitutions)
      .map(readString)
      .filter((entry: string | null): entry is string => Boolean(entry));
    const requiredObservationKinds = readArray(subgoal.required_observation_kinds)
      .map(readString)
      .filter((entry: string | null): entry is string => Boolean(entry));
    const requiredArgs = readArray(subgoal.required_args)
      .map(readString)
      .filter((entry: string | null): entry is string => Boolean(entry));
    const optionalArgs = readArray(subgoal.optional_args)
      .map(readString)
      .filter((entry: string | null): entry is string => Boolean(entry));
    const argsHint = readRecord(subgoal.args_hint);
    const runtimeCalls = artifacts.filter((artifact: HelixCapabilityItineraryArtifactLike) =>
      artifactKind(artifact) === "runtime_tool_call" &&
      artifactMatchesCapability(artifact, requestedCapability, runtimeCapability, substitutions)
    );
    const validations = artifacts.filter((artifact: HelixCapabilityItineraryArtifactLike) =>
      artifactKind(artifact) === "runtime_tool_call_validation" &&
      artifactMatchesCapability(artifact, requestedCapability, runtimeCapability, substitutions)
    );
    const validationErrors = validations.flatMap(artifactValidationErrors);
    const observationArtifact = artifacts.find((artifact: HelixCapabilityItineraryArtifactLike) =>
      artifactSupportsSubgoalObservation(
        artifact,
        subgoalId,
        requestedCapability,
        runtimeCapability,
        substitutions,
        requiredObservationKinds,
        argsHint,
      )
    ) ?? null;
    const executedArtifact = artifacts.find((artifact: HelixCapabilityItineraryArtifactLike) =>
      artifactProvesCompletedCapability(artifact, requestedCapability, runtimeCapability, substitutions)
    ) ?? (observationArtifact && artifactProvesCompletedCapability(observationArtifact, requestedCapability, runtimeCapability, substitutions)
      ? observationArtifact
      : null);
    const executed = Boolean(executedArtifact);
    const selectedCapability = runtimeCalls.length > 0
      ? artifactCapability(runtimeCalls[0] as HelixCapabilityItineraryArtifactLike)
      : executedArtifact
        ? artifactCapability(executedArtifact as HelixCapabilityItineraryArtifactLike) ?? runtimeCapability
        : null;
    const executedCapability = executed ? artifactCapability(executedArtifact as HelixCapabilityItineraryArtifactLike) ?? runtimeCapability : null;
    const satisfaction = executed && observationArtifact
      ? "satisfied"
      : validationErrors.length > 0
        ? "failed"
        : "pending";
    const railFailureCode = validationErrors[0] ?? (satisfaction === "pending" ? "subgoal_observation_missing" : null);
    const supportRefs = artifactSupportRefs(observationArtifact);
    return {
      subgoal_id: subgoalId,
      order: Number(subgoal.order) || 0,
      requested_capability: requestedCapability,
      selected_capability: selectedCapability,
      executed_capability: executedCapability,
      args: runtimeCalls.length > 0 ? artifactArgs(runtimeCalls[0] as HelixCapabilityItineraryArtifactLike) : argsHint ?? {},
      required_args: requiredArgs,
      optional_args: optionalArgs,
      input_bindings: readArray(subgoal.input_bindings),
      observation_kind: observationArtifact ? artifactKind(observationArtifact) : null,
      observation_ref: observationArtifact ? artifactId(observationArtifact) : null,
      support_refs: supportRefs,
      satisfaction,
      rail_status: satisfaction === "satisfied" ? "complete" : satisfaction === "failed" ? "fail_closed" : "pending",
      first_broken_rail: subgoalFirstBrokenRailFor(railFailureCode, satisfaction),
      rail_failure_code: railFailureCode,
      repair_target: subgoalRepairTargetFor(railFailureCode, satisfaction),
      required_observation_kinds: requiredObservationKinds,
      contribution_role: readString(subgoal.contribution_role),
      terminal_contribution_kind: readString(subgoal.terminal_contribution_kind) ?? readString(subgoal.required_terminal_kind),
      assistant_answer: false,
      raw_content_included: false,
    };
  });
  const compoundSubgoalLedger: Array<Record<string, unknown>> = rawCompoundSubgoalLedger.map((entry: Record<string, unknown>) => {
    const bindings = readArray(entry.input_bindings)
      .map(readRecord)
      .filter((binding: Record<string, unknown> | null): binding is Record<string, unknown> => Boolean(binding));
    if (bindings.length === 0) return entry;
    const boundInputRefs = bindings.flatMap((binding: Record<string, unknown>) => {
      const sourceEntry = rawCompoundSubgoalLedger.find((candidate: Record<string, unknown>) =>
        readString(candidate.subgoal_id) === readString(binding.from_subgoal_id)
      );
      if (readString(sourceEntry?.satisfaction) !== "satisfied") return [];
      const refs = uniqueStrings([
        readString(sourceEntry?.observation_ref),
        ...readArray(sourceEntry?.support_refs).map(readString),
      ]);
      return refs.map((ref: string) => ({
        binding_id: readString(binding.binding_id),
        arg_name: readString(binding.arg_name),
        binding_kind: readString(binding.binding_kind),
        from_subgoal_id: readString(binding.from_subgoal_id),
        from_capability: readString(binding.from_capability),
        ref,
      }));
    });
    const unresolvedInputBindings = bindings.filter((binding: Record<string, unknown>) =>
      binding.required === true &&
      !boundInputRefs.some((bound: Record<string, unknown>) =>
        readString(bound.binding_id) === readString(binding.binding_id)
      )
    );
    if (readString(entry.satisfaction) === "satisfied" && unresolvedInputBindings.length > 0) {
      const railFailureCode = "input_binding_missing";
      const satisfaction = "failed";
      return {
        ...entry,
        bound_input_refs: boundInputRefs,
        unresolved_input_bindings: unresolvedInputBindings,
        satisfaction,
        rail_status: "fail_closed",
        first_broken_rail: subgoalFirstBrokenRailFor(railFailureCode, satisfaction),
        rail_failure_code: railFailureCode,
        repair_target: subgoalRepairTargetFor(railFailureCode, satisfaction),
      };
    }
    return {
      ...entry,
      bound_input_refs: boundInputRefs,
      unresolved_input_bindings: unresolvedInputBindings,
    };
  });
  const missingSubgoals = compoundSubgoalLedger.filter((entry: Record<string, unknown>) => readString(entry.satisfaction) !== "satisfied");
  const missingFamilies = requiredFamilies.filter((family: string) => !observedFamilies.includes(family));
  const missingSubgoalIds = missingSubgoals
    .map((entry: Record<string, unknown>) => readString(entry.subgoal_id))
    .filter((entry: string | null): entry is string => Boolean(entry));
  const missingRequiredCapabilities = missingSubgoals
    .map((entry: Record<string, unknown>) => readString(entry.requested_capability))
    .filter((entry: string | null): entry is string => Boolean(entry));
  const complete = (!applies || missingFamilies.length === 0) &&
    missingRequiredObservationKinds.length === 0 &&
    missingSubgoals.length === 0;
  return {
    schema: "helix.capability_itinerary_execution_state.v1",
    applies,
    required_observation_families: requiredFamilies,
    required_observation_kinds: requiredObservationKinds,
    required_capabilities: requiredCapabilities,
    admitted_tool_families: admittedFamilies,
    observed_families: observedFamilies,
    missing_observation_families: missingFamilies,
    next_missing_family: missingFamilies[0] ?? null,
    missing_required_observation_kinds: missingRequiredObservationKinds,
    next_missing_required_observation_kind: missingRequiredObservationKinds[0] ?? null,
    missing_compound_subgoal_ids: missingSubgoalIds,
    missing_required_capabilities: missingRequiredCapabilities,
    compound_subgoal_ledger: compoundSubgoalLedger,
    next_missing_subgoal_id: readString(missingSubgoals[0]?.subgoal_id),
    complete,
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const attachHelixCapabilityItineraryExecutionState = (
  payload: Record<string, unknown>,
  artifacts: HelixCapabilityItineraryArtifactLike[],
): string[] => {
  const executionState = buildHelixCapabilityItineraryExecutionState({
    capabilityItinerary: payload.capability_itinerary,
    artifacts,
  });
  if (!executionState.applies) return [];
  payload.capability_itinerary_execution_state = executionState;
  const itinerary = readRecord(payload.capability_itinerary);
  if (itinerary) {
    itinerary.execution_state = {
      required_observation_families: executionState.required_observation_families,
      required_observation_kinds: executionState.required_observation_kinds,
      required_capabilities: executionState.required_capabilities,
      admitted_tool_families: executionState.admitted_tool_families,
      observed_families: executionState.observed_families,
      missing_observation_families: executionState.missing_observation_families,
      next_missing_family: executionState.next_missing_family,
      missing_required_observation_kinds: executionState.missing_required_observation_kinds,
      next_missing_required_observation_kind: executionState.next_missing_required_observation_kind,
      missing_compound_subgoal_ids: executionState.missing_compound_subgoal_ids,
      missing_required_capabilities: executionState.missing_required_capabilities,
      compound_subgoal_ledger: executionState.compound_subgoal_ledger,
      next_missing_subgoal_id: executionState.next_missing_subgoal_id,
      complete: executionState.complete,
    };
  }
  const debug = readRecord(payload.debug);
  if (debug) {
    debug.capability_itinerary_execution_state = executionState;
    if (itinerary) debug.capability_itinerary = itinerary;
  }
  return Array.from(new Set([
    ...executionState.missing_observation_families,
    ...executionState.missing_required_capabilities,
  ]));
};
