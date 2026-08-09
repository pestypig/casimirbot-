export type HelixCapabilityItineraryArtifactLike = {
  artifact_id?: unknown;
  kind?: unknown;
  payload?: unknown;
  source_scope?: unknown;
  turn_id?: unknown;
  capability_key?: unknown;
  source_capability_id?: unknown;
  source_observation_schema?: unknown;
  source_observation_status?: unknown;
  status?: unknown;
  assistant_answer?: unknown;
  terminal_eligible?: unknown;
  raw_content_included?: unknown;
  executed_args?: unknown;
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

const artifactPayloadByKind = (
  artifacts: HelixCapabilityItineraryArtifactLike[],
  kind: string,
): Record<string, unknown> | null => {
  const artifact = artifacts.find((entry) => readString(entry.kind) === kind);
  return readRecord(artifact?.payload);
};

const subgoalHasSatisfiedObservation = (entry: Record<string, unknown> | null | undefined): boolean =>
  readString(entry?.satisfaction) === "satisfied" &&
  Boolean(readString(entry?.observation_ref));

const materializeBoundInputArgs = (
  baseArgs: Record<string, unknown>,
  boundInputRefs: Array<Record<string, unknown>>,
): Record<string, unknown> => {
  if (boundInputRefs.length === 0) return baseArgs;
  const nextArgs: Record<string, unknown> = { ...baseArgs };
  const refsByArg = new Map<string, string[]>();
  for (const bound of boundInputRefs) {
    const argName = readString(bound.arg_name);
    const ref = readString(bound.ref);
    if (!argName || !ref) continue;
    refsByArg.set(argName, uniqueStrings([...(refsByArg.get(argName) ?? []), ref]));
  }
  for (const [argName, refs] of refsByArg.entries()) {
    if (argName === "source_refs" || argName === "support_refs" || argName === "evidence_refs") {
      const existingScalar = readString(nextArgs[argName]);
      nextArgs[argName] = uniqueStrings([
        existingScalar,
        ...readArray(nextArgs[argName]).map(readString),
        ...refs,
      ]);
      continue;
    }
    nextArgs[argName] = readString(nextArgs[argName]) ?? refs[0] ?? nextArgs[argName];
  }
  return nextArgs;
};

const subgoalFirstBrokenRailFor = (failureCode: string | null, satisfaction: string): string | null => {
  if (satisfaction === "satisfied" || !failureCode) return null;
  if (failureCode === "config_missing") return "config";
  if (failureCode.startsWith("invalid_arg:") || failureCode.startsWith("missing_required_arg:")) return "capability_execution";
  if (failureCode === "input_binding_missing") return "evidence_reentry";
  if (failureCode === "weak_evidence_repair_loop") return "evidence_reentry";
  if (failureCode === "subgoal_observation_missing") return "observation_artifact";
  return "capability_execution";
};

const subgoalRepairTargetFor = (failureCode: string | null, satisfaction: string): string | null => {
  if (satisfaction === "satisfied" || !failureCode) return null;
  if (failureCode === "config_missing") return "operator_config";
  if (failureCode.startsWith("invalid_arg:")) return "subgoal_argument_extraction";
  if (failureCode.startsWith("missing_required_arg:")) return "subgoal_argument_extraction";
  if (failureCode === "input_binding_missing") return "reentry_gate";
  if (failureCode === "weak_evidence_repair_loop") return "repo_retrieval_repair_policy";
  if (failureCode === "subgoal_observation_missing") return "observation_materializer";
  return "tool_execution";
};

const normalizeCalculatorExpression = (value: string | null): string | null => {
  if (!value) return null;
  return value.replace(/\s+/g, "").trim().toLowerCase() || null;
};

const artifactPayload = (artifact: HelixCapabilityItineraryArtifactLike): Record<string, unknown> | null =>
  readRecord(artifact.payload);

type GuardedNoopSatisfaction = {
  artifact: HelixCapabilityItineraryArtifactLike;
  reason: "no_verified_safe_candidate";
};

const guardedNoopSatisfactionForSubgoal = (input: {
  turnId: string | null;
  subgoal: Record<string, unknown>;
  artifacts: HelixCapabilityItineraryArtifactLike[];
}): GuardedNoopSatisfaction | null => {
  const policy = readRecord(input.subgoal.guarded_noop_policy);
  if (
    readString(policy?.schema) !==
      "helix.compound_capability_guarded_noop.v1" ||
    readString(policy?.mode) !== "no_verified_safe_candidate" ||
    policy?.current_turn_only !== true ||
    policy.requires_successful_observation !== true ||
    policy.user_directed_noop_guard !== true
  ) {
    return null;
  }
  const guardCapability = readString(policy.guard_capability);
  const requiredPurpose = readString(policy.required_purpose);
  const acceptedObservationPurposes = readArray(
    policy.accepted_observation_purposes,
  )
    .map(readString)
    .filter((entry: string | null): entry is string => Boolean(entry));
  const candidateField = readString(policy.candidate_field);
  const completenessField = readString(policy.completeness_field);
  const omittedCountField = readString(policy.omitted_count_field);
  if (
    guardCapability !==
      "com.casimirbot.minecraft.spatial_region.inspect" ||
    !["structure_planning", "fire_safety"].includes(
      requiredPurpose ?? "",
    ) ||
    (requiredPurpose === "structure_planning"
      ? acceptedObservationPurposes.length !== 2 ||
        !acceptedObservationPurposes.includes("structure_planning") ||
        !acceptedObservationPurposes.includes("build_planning")
      : acceptedObservationPurposes.length !== 1 ||
        acceptedObservationPurposes[0] !== "fire_safety") ||
    !["build_line_candidates", "fireplace_candidates"].includes(
      candidateField ?? "",
    ) ||
    ![
      "build_line_candidates_complete",
      "fireplace_candidates_complete",
    ].includes(completenessField ?? "") ||
    ![
      "omitted_build_line_candidate_count",
      "omitted_fireplace_candidate_count",
    ].includes(omittedCountField ?? "")
  ) {
    return null;
  }
  const currentTurnObservations = input.artifacts.filter((artifact) => {
    const payload = artifactPayload(artifact);
    return (
      input.turnId !== null &&
      readString(artifact.turn_id) === input.turnId &&
      readString(artifact.source_scope) === "current_turn_context" &&
      artifactKind(artifact) === "live_environment_observation" &&
      artifactCapability(artifact) === guardCapability &&
      readString(artifact.source_observation_schema) ===
        "helix.environment_connector.probe_observation.v1" &&
      readString(artifact.status) === "succeeded" &&
      artifact.assistant_answer === false &&
      artifact.terminal_eligible === false &&
      artifact.raw_content_included === false &&
      readString(payload?.schema) === "helix.live_environment_observation.v1" &&
      readString(payload?.source_capability_id) === guardCapability &&
      readString(payload?.status) === "succeeded" &&
      readString(payload?.observation_role) ===
        "evidence_not_assistant_answer" &&
      payload?.assistant_answer === false &&
      payload.terminal_eligible === false &&
      payload.raw_content_included === false
    );
  });
  const latest = currentTurnObservations.at(-1);
  if (!latest) return null;
  const result = readRecord(artifactPayload(latest)?.result);
  if (
    !result ||
    !acceptedObservationPurposes.includes(readString(result.purpose) ?? "") ||
    result[completenessField as string] !== true ||
    result[omittedCountField as string] !== 0 ||
    !Array.isArray(result[candidateField as string])
  ) {
    return null;
  }
  const candidates = result[candidateField as string] as unknown[];
  if (
    candidates.some(
      (candidate) => readRecord(candidate)?.safe_candidate === true,
    )
  ) {
    return null;
  }
  return {
    artifact: latest,
    reason: "no_verified_safe_candidate",
  };
};

const docLocationArtifactHasConcreteEvidence = (artifact: HelixCapabilityItineraryArtifactLike): boolean => {
  const payload = artifactPayload(artifact);
  if (!payload) return false;
  const status = readString(payload.status);
  if (status === "located") return true;
  const matchCount = Number(payload.match_count);
  if (Number.isFinite(matchCount) && matchCount > 0) return true;
  if (
    /^doc_location_matches$/i.test(
      readString((artifact as Record<string, unknown>).kind) ??
      readString(payload.kind) ??
      "",
    ) &&
    /agent_runtime.*docs_viewer_locate_in_doc/i.test(
      readString((artifact as Record<string, unknown>).artifact_id) ??
      readString(payload.artifact_id) ??
      "",
    )
  ) {
    return true;
  }
  return [
    payload.matches,
    payload.snippets,
    payload.locations,
    payload.line_spans,
    payload.evidence_refs,
    payload.support_refs,
    payload.observation_refs,
  ].some((value) => readArray(value).length > 0);
};

const isDocsLocateCapability = (capability: string, runtimeCapability: string): boolean =>
  capability === "docs-viewer.locate_in_doc" || runtimeCapability === "docs-viewer.locate_in_doc";

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
    readString((artifact as Record<string, unknown>).capability_key) ??
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
  if (
    capability === "situation-room.live-source.set_rate" ||
    runtimeCapability === "situation-room.live-source.set_rate"
  ) {
    const payload = artifactPayload(artifact);
    const status = readString(payload?.status);
    const exactSuccessfulGatewayObservation =
      artifactCapability(artifact) === "situation-room.live-source.set_rate" &&
      /^(?:succeeded|completed|success|ok)$/i.test(status ?? "") &&
      /^(?:provider_gateway_observation_packet|runtime_tool_observation|visual_producer_cadence_receipt)$/i.test(kind);
    return exactSuccessfulGatewayObservation ||
      /live_pipeline_receipt|visual_producer_cadence_receipt/i.test(text) ||
      /^(?:live_pipeline_receipt|visual_producer_cadence_receipt)$/i.test(kind);
  }
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
  if (
    capability === "docs.search" ||
    runtimeCapability === "docs.search" ||
    capability === "docs-viewer.search_docs" ||
    runtimeCapability === "docs-viewer.search_docs"
  ) {
    return /docs[-_]?(?:viewer[-_.:]?)?search|doc_search_results|doc_location|doc_evidence_location/i.test(text) ||
      /^doc_(?:search_results|candidate_validation|location|evidence|summary)$/i.test(kind);
  }
  if (capability === "docs-viewer.open" || runtimeCapability === "docs-viewer.open") {
    return /docs[-_]viewer[-_.:]open|doc_open_receipt|docs_viewer_receipt/i.test(text) ||
      /^(?:doc_open_receipt|docs_viewer_receipt)$/i.test(kind);
  }
  if (capability === "docs-viewer.summarize_doc" || runtimeCapability === "docs-viewer.summarize_doc") {
    return /docs[-_]viewer[-_.:]summarize[-_]doc|doc_summary|observation_review|docs_viewer_receipt/i.test(text) ||
      /^(?:doc_summary|observation_review|docs_viewer_receipt)$/i.test(kind);
  }
  if (capability === "docs-viewer.doc_equation_context" || runtimeCapability === "docs-viewer.doc_equation_context") {
    return /docs[-_]viewer[-_.:]doc[-_]equation[-_]context|doc_equation_context/i.test(text) ||
      /^doc_equation_context$/i.test(kind);
  }
  if (capability === "repo-code.search_concept" || runtimeCapability === "repo-code.search_concept") {
    return /repo[-_]code[-_.:]search[-_]concept|repo_code_evidence|repo_evidence_relevance_gate/i.test(text) ||
      /^(?:repo_code_evidence_observation|repo_code_search_result|repo_evidence_relevance_gate)$/i.test(kind);
  }
  if (capability === "helix_ask.inspect_capability_catalog" || runtimeCapability === "helix_ask.inspect_capability_catalog") {
    return /capability_catalog|capability_registry|capability_help_summary/i.test(text) ||
      /capability_(?:registry|help_summary)/i.test(kind);
  }
  if (capability === "helix_ask.reflect_workstation_tool_alignment" || runtimeCapability === "helix_ask.reflect_workstation_tool_alignment") {
    return /workstation_tool_alignment|toolchain_matrix|capability_registry|capability_help_summary/i.test(text) ||
      /capability_(?:registry|help_summary)/i.test(kind);
  }
  if (capability === "workspace-directory.resolve" || runtimeCapability === "workspace-directory.resolve") {
    return /workspace[-_]directory[-_.:]resolve|workspace_directory_resolution/i.test(text) ||
      /^workspace_directory_resolution$/i.test(kind);
  }
  if (capability === "internet_search.web_research" || runtimeCapability === "internet_search.web_research" || runtimeCapability === "internet-search.search_web") {
    return /internet_search|web_research|internet-search\.search_web/i.test(text) ||
      /^(?:internet_search_observation|web_research_observation)$/i.test(kind);
  }
  if (capability === "scholarly-research.lookup_papers" || runtimeCapability === "scholarly-research.lookup_papers") {
    return /scholarly_research|lookup_papers/i.test(text) ||
      /^scholarly_research_observation$/i.test(kind);
  }
  if (capability === "scholarly-research.fetch_full_text" || runtimeCapability === "scholarly-research.fetch_full_text") {
    return /scholarly_full_text|fetch_full_text/i.test(text) ||
      /^scholarly_full_text_observation$/i.test(kind);
  }
  if (
    capability === "scholarly-research.extract_numeric_parameters" ||
    runtimeCapability === "scholarly-research.extract_numeric_parameters"
  ) {
    return /scholarly_numeric_parameter|extract_numeric_parameters|numeric_parameter_extraction/i.test(text) ||
      /^scholarly_numeric_parameter_observation$/i.test(kind);
  }
  if (capability === "helix_ask.reflect_theory_context" || runtimeCapability === "helix_ask.reflect_theory_context") {
    return /helix_theory_context_reflection_tool_receipt|theory_context_reflection/i.test(text) ||
      /^(?:helix_theory_context_reflection_tool_receipt|theory_context_reflection)$/i.test(kind);
  }
  if (capability === "helix.theory.frontierVectorFieldTrace" || runtimeCapability === "helix.theory.frontierVectorFieldTrace") {
    return /helix_theory_frontier_vector_field_tool_receipt|theory_frontier_vector_field|frontierVectorFieldTrace/i.test(text) ||
      /^(?:helix_theory_frontier_vector_field_tool_receipt|theory_frontier_vector_field)$/i.test(kind);
  }
  if (capability === "helix_ask.reflect_live_synthetic_data" || runtimeCapability === "helix_ask.reflect_live_synthetic_data") {
    return /helix_context_reflection_tool_receipt|bounded_context_reference|live_synthetic_data/i.test(text) ||
      /^(?:helix_context_reflection_tool_receipt\/v1|bounded_context_reference)$/i.test(kind);
  }
  if (capability === "helix_ask.reflect_context_attachments" || runtimeCapability === "helix_ask.reflect_context_attachments") {
    return /helix_context_reflection_tool_receipt|context_attachment|bounded_context_reference/i.test(text) ||
      /^(?:helix_context_reflection_tool_receipt\/v1|context_attachment|bounded_context_reference)$/i.test(kind);
  }
  if (capability === "helix_ask.reflect_ideology_context" || runtimeCapability === "helix_ask.reflect_ideology_context") {
    return /ideology_context_reflection|procedural_moral_classification|helix_moral_graph_reflection/i.test(text) ||
      /^(?:ideology_context_reflection\/v1|procedural_moral_classification\/v1|helix_moral_graph_reflection_tool_result|workstation_tool_evaluation)$/i.test(kind);
  }
  if (capability === "moral-graph.reflect_context" || runtimeCapability === "moral-graph.reflect_context") {
    return /moral_graph_reflection|ideology_context_reflection|procedural_moral_classification/i.test(text) ||
      /^(?:moral_graph_reflection|helix\.moral_graph_reflection_observation\.v1|ideology_context_reflection\/v1|procedural_moral_classification\/v1)$/i.test(kind);
  }
  if (capability === "helix_ask.bridge_theory_ideology_context" || runtimeCapability === "helix_ask.bridge_theory_ideology_context") {
    return /helix_theory_ideology_bridge_tool_result|theory_ideology_bridge/i.test(text) ||
      /^(?:helix_theory_ideology_bridge_tool_result|theory_ideology_bridge)$/i.test(kind);
  }
  if (capability === "helix_ask.build_civilization_scenario_frame" || runtimeCapability === "helix_ask.build_civilization_scenario_frame") {
    return /civilization_scenario_frame|helix_civilization_scenario_frame_tool_result/i.test(text) ||
      /^(?:civilization_scenario_frame\/v1|helix_civilization_scenario_frame_tool_result)$/i.test(kind);
  }
  if (capability === "helix_ask.reflect_civilization_bounds" || runtimeCapability === "helix_ask.reflect_civilization_bounds") {
    return /civilization_bounds_roadmap|helix_civilization_bounds_tool_result/i.test(text) ||
      /^(?:civilization_bounds_roadmap\/v1|helix_civilization_bounds_tool_result)$/i.test(kind);
  }
  if (capability === "image_lens.inspect" || runtimeCapability === "situation-room.describe_visual_capture") {
    return /image_lens\.inspect|situation[-_]room[-_.:]describe[-_]visual[-_]capture|visual_frame|visual_capture|situation_context_pack/i.test(text) ||
      /visual_frame_evidence|visual_capture_coverage|situation_context_pack/i.test(kind);
  }
  if (capability.startsWith("live_env.") || runtimeCapability.startsWith("live_env.")) {
    return /live_environment|stage_play|live_source|micro_reasoner|workstation_goal|agent_goal|narrator|voice_|route_watch|loop_state/i.test(text) ||
      /^(?:live_environment_tool_observation|stage_play_|helix\.|voice_|live_source_)/i.test(kind);
  }
  if (capability === "workstation-notes.append_to_note" || runtimeCapability === "workstation-notes.append_to_note") {
    return /workstation[-_]notes[-_.:]append[-_]to[-_]note|note_update_receipt|note_action_receipt|workspace_action_receipt/i.test(text) ||
      /^(?:note_update_receipt|note_action_receipt|workspace_action_receipt)$/i.test(kind);
  }
  if (capability === "workstation-notes.list_notes" || runtimeCapability === "workstation-notes.list_notes") {
    return /workstation[-_]notes[-_.:]list[-_]notes|workstation_notes_list_observation/i.test(text) ||
      /^(?:workstation_notes_list_observation|helix\.workstation_notes_list_observation\.v1)$/i.test(kind);
  }
  if (capability === "text_to_speech.speak_text" || runtimeCapability === "text_to_speech.speak_text") {
    return /text_to_speech[-_.:]speak_text|voice_receipt|capability_lane_observation_packet/i.test(text) ||
      /^(?:voice_receipt|capability_lane_observation_packet)$/i.test(kind);
  }
  return false;
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

const runtimeProvenDocsLocateObservation = (
  artifact: HelixCapabilityItineraryArtifactLike,
  capability: string,
  runtimeCapability: string,
): boolean => {
  if (!isDocsLocateCapability(capability, runtimeCapability)) {
    return false;
  }
  const kind = artifactKind(artifact);
  if (!/^doc_(?:location|evidence)/i.test(kind)) return false;
  const haystack = artifactCapabilityHaystack(artifact);
  return (
    docLocationArtifactHasConcreteEvidence(artifact) &&
    /docs[-_]viewer[-_.:]locate[-_]in[-_]doc|docs_viewer_locate_in_doc/i.test(haystack) &&
    /agent_runtime|runtime_tool_observation|agent_step_observation_packet/i.test(haystack) &&
    !/model_step/i.test(haystack)
  );
};

const artifactSubgoalObservationProvenance = (
  artifact: HelixCapabilityItineraryArtifactLike,
  subgoalId: string | null,
  capability: string,
  runtimeCapability: string,
  substitutions: string[],
  argsHint: Record<string, unknown> | null,
): string | null => {
  const actualCapability = artifactCapability(artifact);
  if (isDocsLocateCapability(capability, runtimeCapability) && !docLocationArtifactHasConcreteEvidence(artifact)) {
    return null;
  }
  if (actualCapability && !artifactMatchesCapability(artifact, capability, runtimeCapability, substitutions)) {
    return null;
  }
  const artifactSubgoalId = artifactCompoundSubgoalId(artifact);
  if (artifactSubgoalId && subgoalId) {
    if (artifactSubgoalId === subgoalId) return "compound_subgoal_id";
    return calculatorSubgoalIdMismatchIsExpressionMatch(artifact, capability, runtimeCapability, argsHint)
      ? "calculator_expression_match"
      : null;
  }
  if (actualCapability) return "capability_key";
  if (calculatorSubgoalIdMismatchIsExpressionMatch(artifact, capability, runtimeCapability, argsHint)) {
    return "calculator_expression_match";
  }
  if (runtimeProvenDocsLocateObservation(artifact, capability, runtimeCapability)) {
    return "runtime_docs_location_observation";
  }
  if (capability === "docs-viewer.locate_in_doc" || runtimeCapability === "docs-viewer.locate_in_doc") {
    return null;
  }
  return observationKindBelongsToCapability(artifact, capability, runtimeCapability)
    ? "observation_kind_inference"
    : null;
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
  return observationKindBelongsToCapability(artifact, capability, runtimeCapability);
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
  return Boolean(artifactSubgoalObservationProvenance(
    artifact,
    subgoalId,
    capability,
    runtimeCapability,
    substitutions,
    argsHint,
  ));
};

const artifactValidationErrors = (artifact: HelixCapabilityItineraryArtifactLike): string[] => {
  const payload = artifactPayload(artifact);
  return readArray(payload?.errors)
    .map(readString)
    .filter((entry: string | null): entry is string => Boolean(entry));
};

const artifactArgs = (artifact: HelixCapabilityItineraryArtifactLike): Record<string, unknown> | null => {
  const payload = artifactPayload(artifact);
  const observation = readRecord(payload?.observation);
  const result = readRecord(payload?.result);
  const action = readRecord(payload?.action);
  const structuredArgs =
    readRecord(artifact.executed_args) ??
    readRecord(payload?.executed_args) ??
    readRecord(payload?.arguments) ??
    readRecord(payload?.args) ??
    readRecord(observation?.executed_args) ??
    readRecord(observation?.arguments) ??
    readRecord(observation?.args) ??
    readRecord(result?.executed_args) ??
    readRecord(result?.arguments) ??
    readRecord(result?.args) ??
    readRecord(action?.executed_args) ??
    readRecord(action?.arguments) ??
    readRecord(action?.args);
  if (structuredArgs) return structuredArgs;
  const calculatorExpression = artifactCalculatorExpression(artifact);
  if (calculatorExpression) {
    return { expression: calculatorExpression };
  }
  return (
    null
  );
};

const argValuePresent = (value: unknown): boolean => {
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return false;
};

const argsHaveAny = (args: Record<string, unknown> | null, names: string[]): boolean =>
  Boolean(args && names.some((name) => argValuePresent(args[name])));

const requiredArgAliasesForCapability = (
  capability: string,
  runtimeCapability: string,
  requiredArg: string,
): string[] => {
  const keys = [requiredArg];
  if (requiredArg === "latex" && (
    capability === "scientific-calculator.solve_expression" ||
    runtimeCapability === "scientific-calculator.solve_expression"
  )) {
    keys.push("expression", "equation");
  }
  if (requiredArg === "query") {
    if (
      capability === "repo-code.search_concept" ||
      runtimeCapability === "repo-code.search_concept"
    ) keys.push("concept");
    if (
      capability === "workspace-directory.resolve" ||
      runtimeCapability === "workspace-directory.resolve"
    ) keys.push("uri", "path", "target");
    if (
      capability === "internet_search.web_research" ||
      runtimeCapability === "internet_search.web_research" ||
      runtimeCapability === "internet-search.search_web"
    ) keys.push("question", "prompt", "topic", "search_query");
    if (
      capability === "scholarly-research.lookup_papers" ||
      runtimeCapability === "scholarly-research.lookup_papers"
    ) keys.push("doi", "arxiv_id", "arxivId", "title", "journal", "reference", "citation");
  }
  if (requiredArg === "paper_result_or_source" && (
    capability === "scholarly-research.fetch_full_text" ||
    runtimeCapability === "scholarly-research.fetch_full_text"
  )) {
    keys.push("paper_result_id", "paper_id", "result_id", "doi", "arxiv_id", "arxivId", "source_url", "pdf_url", "full_text_url", "url");
  }
  if (requiredArg === "text" && (
    capability === "workstation-notes.append_to_note" ||
    runtimeCapability === "workstation-notes.append_to_note"
  )) {
    keys.push("body", "content");
  }
  return uniqueStrings(keys);
};

const missingRequiredArgsForSubgoal = (input: {
  capability: string;
  runtimeCapability: string;
  requiredArgs: string[];
  args: Record<string, unknown> | null;
}): string[] =>
  input.requiredArgs.filter((requiredArg) =>
    !argsHaveAny(
      input.args,
      requiredArgAliasesForCapability(input.capability, input.runtimeCapability, requiredArg),
    )
  );

const boundRequiredArgsForSubgoal = (
  subgoal: Record<string, unknown>,
): string[] => uniqueStrings(
  readArray(subgoal.input_bindings)
    .map(readRecord)
    .filter((entry: Record<string, unknown> | null): entry is Record<string, unknown> =>
      Boolean(entry && entry.required === true)
    )
    .map((entry: Record<string, unknown>) => readString(entry.arg_name)),
);

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
    readString(payload?.evaluation_id),
    readString(observation?.source_ref),
    readString(result?.source_ref),
    ...readArray(payload?.support_refs).map(readString),
    ...readArray(payload?.evidence_refs).map(readString),
    ...readArray(payload?.observation_refs).map(readString),
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
  requiredObservationKinds: string[] = [],
  subgoalId: string | null = null,
): boolean => {
  if (artifactCompletedRuntimeObservation(artifact, capability, runtimeCapability, substitutions)) return true;
  const artifactSubgoalId = artifactCompoundSubgoalId(artifact);
  const hasCapabilityProof =
    artifactMatchesCapability(artifact, capability, runtimeCapability, substitutions) ||
    Boolean(artifactSubgoalId && subgoalId && artifactSubgoalId === subgoalId);
  const status = readString(artifactPayload(artifact)?.status);
  if (
    isDocsLocateCapability(capability, runtimeCapability) &&
    artifactMatchesRequiredObservationKind(artifact, requiredObservationKinds, capability, runtimeCapability) &&
    !docLocationArtifactHasConcreteEvidence(artifact)
  ) {
    return false;
  }
  if (
    hasCapabilityProof &&
    requiredObservationKinds.length > 0 &&
    !/^(?:failed|rejected|error|blocked)$/i.test(status ?? "") &&
    artifactMatchesRequiredObservationKind(artifact, requiredObservationKinds, capability, runtimeCapability)
  ) {
    return true;
  }
  if (runtimeProvenDocsLocateObservation(artifact, capability, runtimeCapability)) {
    return true;
  }
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
  if (family === "live_pipeline") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) => {
      const payload = artifactPayload(artifact);
      const exactSuccessfulCadenceObservation =
        artifactCapability(artifact) === "situation-room.live-source.set_rate" &&
        /^(?:succeeded|completed|success|ok)$/i.test(readString(payload?.status) ?? "") &&
        /^(?:provider_gateway_observation_packet|runtime_tool_observation|visual_producer_cadence_receipt)$/i.test(
          artifactKind(artifact),
        );
      return exactSuccessfulCadenceObservation ||
        artifactMatchesObservationKind(
          artifact,
          /live_pipeline_receipt|visual_producer_cadence_receipt/i,
        );
    });
  }
  if (family === "scholarly_research") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) => {
      const payload = artifactPayload(artifact);
      const status = readString(payload?.status);
      const successfulScholarlyGatewayObservation =
        artifactCapability(artifact)?.startsWith("scholarly-research.") === true &&
        /^(?:succeeded|completed|success|ok)$/i.test(status ?? "");
      const usablePriorScholarlyEvidence =
        /scholarly_prior_evidence_observation/i.test([
          artifactKind(artifact),
          artifactSchema(artifact),
          artifactId(artifact),
        ].join(" ")) &&
        payload?.selected_for_answer === true &&
        readString(payload?.evidence_grade) === "answer_grade" &&
        /^(?:lookup_usable|full_text_usable|numeric_evidence_usable|answer_ready)$/i.test(
          readString(payload?.evidence_state) ?? "",
        );
      return successfulScholarlyGatewayObservation ||
        usablePriorScholarlyEvidence ||
        /scholarly_research_observation|scholarly_full_text_observation|theory_frontier_literature_map/i.test([
        artifactKind(artifact),
        artifactSchema(artifact),
        artifactId(artifact),
      ].join(" "));
    });
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
        /helix_theory_context_reflection_tool_receipt|theory_context_reflection|theory_experiment_procedure_observation|casimir\.theory_experiment_procedure\.observation\.v1|theory_experiment_execution_closure_observation|casimir\.theory_experiment_execution_closure\.observation\.v1|theory_formal_artifact_family_audit_observation|casimir\.theory_formal_artifact_family_audit\.observation\.v1|scientific_evidence_enrollment_observation|casimir\.scientific_evidence_enrollment\.observation\.v1|scientific_evidence_execution_plan_observation|casimir\.scientific_evidence_execution_plan\.observation\.v1|scientific_evidence_closure_observation|casimir\.scientific_evidence_closure\.observation\.v1|theory_frontier_search|theory_frontier_candidate|theory_frontier_conjecture_observation|theory_frontier_exact_contract_verification/i,
      ),
    );
  }
  if (family === "repo_code") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      /repo_code_evidence_observation/i.test([artifactKind(artifact), artifactSchema(artifact)].join(" ")),
    );
  }
  if (family === "docs_viewer") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) => {
      const status = readString(artifactPayload(artifact)?.status);
      const successfulDocsSearch =
        artifactCapability(artifact) === "docs.search" &&
        /^(?:succeeded|completed|success|ok)$/i.test(status ?? "");
      return successfulDocsSearch ||
        /doc_|docs_viewer/i.test([artifactKind(artifact), artifactSchema(artifact)].join(" "));
    });
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
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) => {
      const status = readString(artifactPayload(artifact)?.status);
      const successfulWorkspaceStatus =
        artifactCapability(artifact) === "workspace_os.status" &&
        /^(?:succeeded|completed|success|ok)$/i.test(status ?? "");
      return successfulWorkspaceStatus || /workspace_os_status_observation|workspace_status/i.test([
        artifactKind(artifact),
        artifactSchema(artifact),
        artifactId(artifact),
      ].join(" "));
    });
  }
  if (family === "capability_catalog") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      /capability_registry|capability_help_summary|agent_runtime_loop|debug_evidence_diagnosis/i.test([
        artifactKind(artifact),
        artifactSchema(artifact),
        artifactId(artifact),
      ].join(" ")),
    );
  }
  if (family === "visual_capture" || family === "situation_run") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) => {
      const status = readString(artifactPayload(artifact)?.status);
      const successfulImageLensObservation =
        artifactCapability(artifact) === "visual_analysis.inspect_image_region" &&
        /^(?:succeeded|completed|success|ok)$/i.test(status ?? "");
      return successfulImageLensObservation ||
        /visual_frame_evidence|situation_context_pack|visual_capture_coverage/i.test([
          artifactKind(artifact),
          artifactSchema(artifact),
          artifactId(artifact),
        ].join(" "));
    });
  }
  if (family === "live_source_mail") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      /stage_play_(?:processed_mail_packet|live_source_mail_read_result|live_source_mail_loop_reflection|micro_reasoner_prompt|live_source_current_state|live_source_quality)|processed_mail_packet/i.test([
        artifactKind(artifact),
        artifactSchema(artifact),
        artifactId(artifact),
      ].join(" ")),
    );
  }
  if (family === "live_source_decision") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      /stage_play_live_source_mail_decision|live_source_(?:mail_)?decision/i.test([
        artifactKind(artifact),
        artifactSchema(artifact),
        artifactId(artifact),
      ].join(" ")),
    );
  }
  if (family === "voice_delivery") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) => {
      const payload = artifactPayload(artifact);
      const successfulTextToSpeech =
        artifactCapability(artifact) === "text_to_speech.speak_text" &&
        /^(?:succeeded|completed|success|ok)$/i.test(readString(payload?.status) ?? "");
      return successfulTextToSpeech ||
      /voice_(?:hold|block|receipt)|live_source_interim_voice_callout_receipt|text_to_speech[-_.:]speak_text/i.test([
        artifactKind(artifact),
        artifactSchema(artifact),
        artifactId(artifact),
      ].join(" "));
    });
  }
  if (family === "moral_graph_reflection") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      /moral_graph_reflection|ideology_context_reflection|procedural_moral_classification|helix_moral_graph_reflection|theory_ideology_bridge/i.test([
        artifactKind(artifact),
        artifactSchema(artifact),
        artifactId(artifact),
      ].join(" ")),
    );
  }
  if (family === "context_reflection") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      /helix_context_reflection_tool_receipt|bounded_context_reference|context_attachment|live_synthetic_data/i.test([
        artifactKind(artifact),
        artifactSchema(artifact),
        artifactId(artifact),
      ].join(" ")),
    );
  }
  if (family === "civilization_bounds") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      /civilization_(?:scenario_frame|bounds)|helix_civilization_(?:scenario_frame|bounds)_tool_result/i.test([
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
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) => {
      if (artifactKind(artifact) === "live_environment_tool_observation") {
        return true;
      }
      const payload = artifactPayload(artifact);
      const priorEnvironmentObservation = readRecord(payload?.observation);
      if (
        artifactKind(artifact) === "prior_environment_probe_evidence" &&
        readString(payload?.schema) ===
          "helix.environment_connector.prior_probe_evidence.v1" &&
        readString(priorEnvironmentObservation?.schema) ===
          "helix.environment_connector.probe_observation.v1" &&
        readString(priorEnvironmentObservation?.outcome) === "succeeded" &&
        priorEnvironmentObservation?.provenance_valid === true &&
        priorEnvironmentObservation?.eligible_for_current_turn_reentry ===
          true &&
        priorEnvironmentObservation?.assistant_answer === false &&
        priorEnvironmentObservation?.terminal_eligible === false &&
        readString(payload?.content_role) ===
          "prior_environment_probe_evidence_not_assistant_answer" &&
        payload?.answer_authority === false &&
        payload?.reentry_required === true
      ) {
        return true;
      }
      const capability = artifactCapability(artifact);
      const status = readString(payload?.status);
      return Boolean(
        capability &&
        (
          capability.startsWith("live_env.") ||
          capability.startsWith("com.casimirbot.minecraft.")
        ) &&
        /^(?:succeeded|completed|success|ok)$/i.test(status ?? ""),
      );
    });
  }
  if (family === "workstation_action" || family === "notes") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      artifactCapability(artifact) === "workstation-notes.list_notes" ||
      /workspace_action_receipt|note_update_receipt|workstation_notes_list_observation|workstation_tool_evaluation/i.test([
        artifactKind(artifact),
        artifactSchema(artifact),
      ].join(" ")),
    );
  }
  if (family === "workstation") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      artifactCapability(artifact) === "workstation-notes.list_notes" ||
      /workspace_action_receipt|note_update_receipt|note_action_receipt|workstation_notes_list_observation|workstation_tool_evaluation/i.test([
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
  const turnId = readString(itinerary?.turn_id);
  const terminalCriteria = readRecord(itinerary?.terminal_success_criteria);
  const compoundContract = readRecord(itinerary?.compound_capability_contract);
  const occurrenceAwareSubgoals =
    readString(compoundContract?.subgoal_identity_policy) ===
    "provider_call_occurrence";
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
    const preboundObservationRef = readString(subgoal.observation_ref);
    const requestedCapability = readString(subgoal.requested_capability) ?? "";
    const runtimeCapability = readString(subgoal.runtime_capability) ?? requestedCapability;
    const substitutions = readArray(subgoal.allowed_substitutions)
      .map(readString)
      .filter((entry: string | null): entry is string => Boolean(entry));
    const forbiddenNearbyCapabilities = readArray(subgoal.forbidden_nearby_capabilities)
      .map(readString)
      .filter((entry: string | null): entry is string => Boolean(entry));
    const requiredObservationKinds = readArray(subgoal.required_observation_kinds)
      .map(readString)
      .filter((entry: string | null): entry is string => Boolean(entry));
    const producedAffordanceKinds = readArray(subgoal.produced_affordance_kinds)
      .map(readString)
      .filter((entry: string | null): entry is string => Boolean(entry));
    const consumedAffordanceKinds = readArray(subgoal.consumed_affordance_kinds)
      .map(readString)
      .filter((entry: string | null): entry is string => Boolean(entry));
    const missingAffordanceKinds = readArray(subgoal.missing_affordance_kinds)
      .map(readString)
      .filter((entry: string | null): entry is string => Boolean(entry));
    const requiredArgs = readArray(subgoal.required_args)
      .map(readString)
      .filter((entry: string | null): entry is string => Boolean(entry));
    const optionalArgs = readArray(subgoal.optional_args)
      .map(readString)
      .filter((entry: string | null): entry is string => Boolean(entry));
    const argsHint = readRecord(subgoal.args_hint);
    const guardedNoopCandidate = guardedNoopSatisfactionForSubgoal({
      turnId,
      subgoal,
      artifacts,
    });
    const runtimeCalls = artifacts.filter((artifact: HelixCapabilityItineraryArtifactLike) =>
      artifactKind(artifact) === "runtime_tool_call" &&
      artifactMatchesCapability(artifact, requestedCapability, runtimeCapability, substitutions)
    );
    const validations = artifacts.filter((artifact: HelixCapabilityItineraryArtifactLike) =>
      artifactKind(artifact) === "runtime_tool_call_validation" &&
      artifactMatchesCapability(artifact, requestedCapability, runtimeCapability, substitutions)
    );
    const preboundObservationArtifact = preboundObservationRef
      ? artifacts.find(
          (artifact: HelixCapabilityItineraryArtifactLike) =>
            artifactId(artifact) === preboundObservationRef,
        ) ?? null
      : null;
    const observationArtifact = preboundObservationRef
      ? preboundObservationArtifact &&
        artifactSupportsSubgoalObservation(
          preboundObservationArtifact,
          subgoalId,
          requestedCapability,
          runtimeCapability,
          substitutions,
          requiredObservationKinds,
          argsHint,
        )
        ? preboundObservationArtifact
        : null
      : occurrenceAwareSubgoals
        ? null
        : artifacts.find((artifact: HelixCapabilityItineraryArtifactLike) =>
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
    const runtimeArgs = runtimeCalls.length > 0
      ? artifactArgs(runtimeCalls[0] as HelixCapabilityItineraryArtifactLike)
      : null;
    const observedExecutedArgs = observationArtifact
      ? artifactArgs(observationArtifact)
      : null;
    const selectedArgs = {
      ...(argsHint ?? {}),
      ...(runtimeArgs ?? {}),
      ...(observedExecutedArgs ?? {}),
    };
    const argsSource = observedExecutedArgs
      ? runtimeArgs
        ? "runtime_tool_call_reconciled_with_observation"
        : "contract_hint_reconciled_with_observation"
      : runtimeArgs
        ? "runtime_tool_call"
        : "contract_args_hint";
    const bindingCoveredRequiredArgs = boundRequiredArgsForSubgoal(subgoal);
    const missingRequiredArgs = missingRequiredArgsForSubgoal({
      capability: requestedCapability,
      runtimeCapability,
      requiredArgs,
      args: selectedArgs,
    }).filter(
      (requiredArg: string) =>
        !bindingCoveredRequiredArgs.includes(requiredArg),
    );
    const validationErrors = validations.flatMap(artifactValidationErrors);
    const executionCandidateArtifacts =
      occurrenceAwareSubgoals && preboundObservationRef
        ? preboundObservationArtifact
          ? [preboundObservationArtifact]
          : []
        : artifacts;
    const executedArtifact =
      executionCandidateArtifacts.find((artifact: HelixCapabilityItineraryArtifactLike) =>
        artifactProvesCompletedCapability(
          artifact,
          requestedCapability,
          runtimeCapability,
          substitutions,
          requiredObservationKinds,
          subgoalId,
        )
      ) ??
      (observationArtifact && artifactProvesCompletedCapability(
        observationArtifact,
        requestedCapability,
        runtimeCapability,
        substitutions,
        requiredObservationKinds,
        subgoalId,
      )
        ? observationArtifact
        : null);
    const guardedNoopSatisfaction = executedArtifact
      ? null
      : guardedNoopCandidate;
    const attemptedRuntimeProgress =
      runtimeCalls.length > 0 ||
      validations.length > 0 ||
      Boolean(executedArtifact);
    const optionalNotSelected =
      subgoal.mandatory === false && !attemptedRuntimeProgress;
    const railErrors = guardedNoopSatisfaction || optionalNotSelected
      ? []
      : uniqueStrings([
          ...validationErrors,
          ...missingRequiredArgs.map((arg) => `missing_required_arg:${arg}`),
        ]);
    const missingRequiredArgsBlockExecution =
      missingRequiredArgs.length > 0 && !guardedNoopSatisfaction;
    const countedObservationArtifact = guardedNoopSatisfaction
      ? guardedNoopSatisfaction.artifact
      : missingRequiredArgsBlockExecution
        ? null
        : observationArtifact;
    const executed = Boolean(executedArtifact) && !missingRequiredArgsBlockExecution;
    const selectedCapability = readString(subgoal.selected_capability) ?? (runtimeCalls.length > 0
      ? artifactCapability(runtimeCalls[0] as HelixCapabilityItineraryArtifactLike)
      : executedArtifact
        ? artifactCapability(executedArtifact as HelixCapabilityItineraryArtifactLike) ?? runtimeCapability
        : null);
    const executedCapability = executed
      ? readString(subgoal.executed_capability) ??
        artifactCapability(executedArtifact as HelixCapabilityItineraryArtifactLike) ??
        runtimeCapability
      : null;
    const observationMissingAfterAttempt =
      attemptedRuntimeProgress &&
      railErrors.length === 0 &&
      !countedObservationArtifact;
    const satisfaction = guardedNoopSatisfaction
      ? "satisfied"
      : optionalNotSelected
        ? "optional_not_selected"
      : executed && countedObservationArtifact
        ? "satisfied"
      : observationMissingAfterAttempt
        ? "failed"
        : railErrors.length > 0
          ? "failed"
          : "pending";
    const railFailureCode = railErrors[0] ??
      (observationMissingAfterAttempt || satisfaction === "pending"
        ? "subgoal_observation_missing"
        : null);
    const supportRefs = uniqueStrings([
      ...artifactSupportRefs(countedObservationArtifact),
      ...readArray(subgoal.support_refs).map(readString),
      ...readArray(subgoal.provider_gateway_packet_refs).map(readString),
    ]);
    const observationProvenance = guardedNoopSatisfaction
      ? "current_turn_guarded_noop_observation"
      : countedObservationArtifact
        ? artifactSubgoalObservationProvenance(
          countedObservationArtifact,
          subgoalId,
          requestedCapability,
          runtimeCapability,
          substitutions,
          argsHint,
        )
        : null;
    return {
      subgoal_id: subgoalId,
      order: Number(subgoal.order) || 0,
      mandatory: subgoal.mandatory !== false,
      requested_capability: requestedCapability,
      runtime_capability: runtimeCapability,
      selected_capability: selectedCapability,
      executed_capability: executedCapability,
      args: selectedArgs,
      args_source: guardedNoopSatisfaction
        ? "guarded_noop_current_turn_observation"
        : argsSource,
      planned_args: argsHint ?? {},
      selected_args: selectedArgs,
      required_args: requiredArgs,
      optional_args: optionalArgs,
      required_observation_kinds: requiredObservationKinds,
      produced_affordance_kinds: producedAffordanceKinds,
      consumed_affordance_kinds: consumedAffordanceKinds,
      missing_affordance_kinds: missingAffordanceKinds,
      required_terminal_kind: readString(subgoal.required_terminal_kind),
      allowed_substitutions: substitutions,
      forbidden_nearby_capabilities: forbiddenNearbyCapabilities,
      input_bindings: readArray(subgoal.input_bindings),
      observation_kind: countedObservationArtifact ? artifactKind(countedObservationArtifact) : null,
      observation_ref: countedObservationArtifact ? artifactId(countedObservationArtifact) : null,
      subgoal_identity_policy:
        readString(subgoal.subgoal_identity_policy) ??
        (occurrenceAwareSubgoals ? "provider_call_occurrence" : null),
      provider_call_id: readString(subgoal.provider_call_id),
      capability_occurrence: Number(subgoal.capability_occurrence) || null,
      observation_provenance: observationProvenance,
      support_refs: supportRefs,
      satisfaction,
      ...(guardedNoopSatisfaction
        ? {
            satisfaction_reason: guardedNoopSatisfaction.reason,
            satisfied_without_execution: true,
            mutation_performed: false,
            guarded_noop_policy: subgoal.guarded_noop_policy,
          }
        : {}),
      rail_status:
        satisfaction === "satisfied"
          ? "complete"
          : satisfaction === "optional_not_selected"
            ? "not_required"
            : satisfaction === "failed"
              ? "fail_closed"
              : "pending",
      first_broken_rail: subgoalFirstBrokenRailFor(railFailureCode, satisfaction),
      rail_failure_code: railFailureCode,
      repair_target: subgoalRepairTargetFor(railFailureCode, satisfaction),
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
      if (!subgoalHasSatisfiedObservation(sourceEntry)) return [];
      const sourceProducedAffordances = readArray(sourceEntry?.produced_affordance_kinds)
        .map(readString)
        .filter((entry: string | null): entry is string => Boolean(entry));
      const requiredAffordanceKinds = readArray(binding.required_affordance_kinds)
        .map(readString)
        .filter((entry: string | null): entry is string => Boolean(entry));
      const missingAffordanceKinds = requiredAffordanceKinds.filter((kind: string) =>
        !sourceProducedAffordances.includes(kind)
      );
      if (missingAffordanceKinds.length > 0) return [];
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
        required_affordance_kinds: requiredAffordanceKinds,
        source_produced_affordance_kinds: sourceProducedAffordances,
        ref,
      }));
    });
    const unresolvedInputBindings = bindings.filter((binding: Record<string, unknown>) =>
      binding.required === true &&
      !boundInputRefs.some((bound: Record<string, unknown>) =>
        readString(bound.binding_id) === readString(binding.binding_id)
      )
    );
    const selectedArgs = readRecord(entry.selected_args) ?? readRecord(entry.args) ?? {};
    const boundArgs = materializeBoundInputArgs(selectedArgs, boundInputRefs);
    if (readString(entry.satisfaction) === "satisfied" && unresolvedInputBindings.length > 0) {
      const railFailureCode = "input_binding_missing";
      const satisfaction = "failed";
      return {
        ...entry,
        args: boundArgs,
        selected_args: boundArgs,
        bound_args: boundArgs,
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
      args: boundArgs,
      selected_args: boundArgs,
      bound_args: boundArgs,
      bound_input_refs: boundInputRefs,
      unresolved_input_bindings: unresolvedInputBindings,
    };
  });
  const missingSubgoals = compoundSubgoalLedger.filter(
    (entry: Record<string, unknown>) =>
      (entry.mandatory !== false && !subgoalHasSatisfiedObservation(entry)) ||
      (entry.mandatory === false && readString(entry.satisfaction) === "failed"),
  );
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
  const committedRoute = readRecord(payload.committed_ask_route);
  const committedCapabilityPolicy = readRecord(committedRoute?.capability_policy);
  const committedTerminalProduct = readRecord(committedRoute?.terminal_product);
  const committedRequiredFamilies = readArray(
    committedCapabilityPolicy?.required_capability_families,
  ).map(readString).filter((entry): entry is string => Boolean(entry));
  const committedRouteFallbackItinerary =
    committedTerminalProduct?.evidence_reentry_required === true &&
    committedRequiredFamilies.length > 0
      ? {
          schema: "helix.capability_itinerary.v1",
          prompt_shape: "source_backed",
          relevant_tool_families: committedRequiredFamilies,
          terminal_success_criteria: {
            required_observation_families: committedRequiredFamilies,
            requires_post_observation_synthesis: true,
          },
          source: "committed_ask_route_terminal_fallback",
          assistant_answer: false,
          raw_content_included: false,
        }
      : null;
  const baseItinerary =
    readRecord(payload.capability_itinerary) ??
    artifactPayloadByKind(artifacts, "capability_itinerary") ??
    committedRouteFallbackItinerary;
  const currentProviderContract = readRecord(
    payload.compound_capability_contract,
  );
  const preferCurrentProviderContract =
    readString(currentProviderContract?.subgoal_identity_policy) ===
      "provider_call_occurrence" ||
    readString(currentProviderContract?.source) ===
      "codex_provider_call_occurrence_normalization";
  const baseCompoundContract = readRecord(
    readRecord(baseItinerary)?.compound_capability_contract,
  );
  const baseSubgoals = readArray(baseCompoundContract?.subgoals)
    .map(readRecord)
    .filter((entry: Record<string, unknown> | null): entry is Record<string, unknown> => Boolean(entry));
  const currentSubgoals = readArray(currentProviderContract?.subgoals)
    .map(readRecord)
    .filter((entry: Record<string, unknown> | null): entry is Record<string, unknown> => Boolean(entry));
  const capabilityIdentities = (entry: Record<string, unknown>): string[] =>
    uniqueStrings([
      readString(entry.requested_capability),
      readString(entry.runtime_capability),
      ...readArray(entry.allowed_substitutions).map(readString),
    ]);
  const currentCapabilities = new Set(
    currentSubgoals.flatMap(capabilityIdentities),
  );
  const preservedUnrepresentedSubgoals = baseSubgoals.filter((entry) => {
    const identities = capabilityIdentities(entry);
    return identities.length > 0 && !identities.some((capability) => currentCapabilities.has(capability));
  });
  const mergedOccurrenceSubgoals = [
    ...currentSubgoals,
    ...preservedUnrepresentedSubgoals,
  ].sort((left, right) => (Number(left.order) || 0) - (Number(right.order) || 0));
  const mergedOccurrenceContract = currentProviderContract
    ? {
        ...currentProviderContract,
        ...(preservedUnrepresentedSubgoals.length > 0
          ? {
              subgoals: mergedOccurrenceSubgoals,
              subgoal_count: mergedOccurrenceSubgoals.length,
              satisfied_subgoal_count: mergedOccurrenceSubgoals.filter(
                (entry) => entry.satisfied === true,
              ).length,
              first_broken_rail:
                mergedOccurrenceSubgoals.find((entry) => entry.satisfied !== true) ?? null,
              rail_status: mergedOccurrenceSubgoals.some((entry) => entry.satisfied !== true)
                ? "missing_observation"
                : "satisfied",
              terminal_candidate_kind: mergedOccurrenceSubgoals.some(
                (entry) => entry.satisfied !== true,
              )
                ? "typed_failure"
                : "compound_evidence_synthesis_answer",
            }
          : {}),
      }
    : null;
  const itinerary = baseItinerary && preferCurrentProviderContract
    ? {
        ...baseItinerary,
        compound_capability_contract: mergedOccurrenceContract,
      }
    : baseItinerary;
  const executionState = buildHelixCapabilityItineraryExecutionState({
    capabilityItinerary: itinerary,
    artifacts,
  });
  if (!executionState.applies) return [];
  payload.capability_itinerary_execution_state = executionState;
  if (itinerary) {
    payload.capability_itinerary = itinerary;
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
