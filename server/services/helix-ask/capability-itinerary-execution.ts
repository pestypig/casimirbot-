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
  required_capabilities: string[];
  admitted_tool_families: string[];
  observed_families: string[];
  missing_observation_families: string[];
  next_missing_family: string | null;
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
    readString(observation?.capability_key) ??
    readString(observation?.tool_key) ??
    readString(result?.capability_key) ??
    readString(result?.tool_key) ??
    readString(action?.capability_key) ??
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

export const isHelixCapabilityItineraryFamilyObserved = (
  family: string,
  artifacts: HelixCapabilityItineraryArtifactLike[],
): boolean => {
  if (family === "scholarly_research") {
    return artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      /scholarly_research_observation|scholarly_full_text_observation/i.test([
        artifactKind(artifact),
        artifactSchema(artifact),
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
      artifactMatchesObservationKind(artifact, /helix_theory_context_reflection_tool_receipt|theory_context_reflection/i),
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
      /calculator_receipt|calculator_result|workstation_tool_evaluation/i.test([
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
  const artifacts = args.artifacts ?? [];
  const observedFamilies = requiredFamilies.filter((family: string) =>
    isHelixCapabilityItineraryFamilyObserved(family, artifacts),
  );
  const compoundSubgoalLedger: Array<Record<string, unknown>> = compoundSubgoals.map((subgoal: Record<string, unknown>) => {
    const requestedCapability = readString(subgoal.requested_capability) ?? "";
    const runtimeCapability = readString(subgoal.runtime_capability) ?? requestedCapability;
    const substitutions = readArray(subgoal.allowed_substitutions)
      .map(readString)
      .filter((entry: string | null): entry is string => Boolean(entry));
    const requiredObservationKinds = readArray(subgoal.required_observation_kinds)
      .map(readString)
      .filter((entry: string | null): entry is string => Boolean(entry));
    const runtimeCalls = artifacts.filter((artifact: HelixCapabilityItineraryArtifactLike) =>
      artifactKind(artifact) === "runtime_tool_call" &&
      artifactMatchesCapability(artifact, requestedCapability, runtimeCapability, substitutions)
    );
    const validations = artifacts.filter((artifact: HelixCapabilityItineraryArtifactLike) =>
      artifactKind(artifact) === "runtime_tool_call_validation" &&
      artifactMatchesCapability(artifact, requestedCapability, runtimeCapability, substitutions)
    );
    const validationErrors = validations.flatMap(artifactValidationErrors);
    const executed = artifacts.some((artifact: HelixCapabilityItineraryArtifactLike) =>
      artifactCompletedRuntimeObservation(artifact, requestedCapability, runtimeCapability, substitutions)
    );
    const observationArtifact = executed
      ? artifacts.find((artifact: HelixCapabilityItineraryArtifactLike) =>
          requiredObservationKinds.some((kind: string) => artifactMatchesObservationKind(artifact, escapedFamilyPattern(kind)))
        ) ?? null
      : null;
    const selectedCapability = runtimeCalls.length > 0
      ? artifactCapability(runtimeCalls[0] as HelixCapabilityItineraryArtifactLike)
      : null;
    const executedCapability = executed ? runtimeCapability : null;
    const satisfaction = observationArtifact
      ? "satisfied"
      : validationErrors.length > 0
        ? "failed"
        : "pending";
    return {
      subgoal_id: readString(subgoal.subgoal_id),
      order: Number(subgoal.order) || 0,
      requested_capability: requestedCapability,
      selected_capability: selectedCapability,
      executed_capability: executedCapability,
      args: runtimeCalls.length > 0 ? artifactArgs(runtimeCalls[0] as HelixCapabilityItineraryArtifactLike) : readRecord(subgoal.args_hint) ?? {},
      observation_kind: observationArtifact ? artifactKind(observationArtifact) : null,
      observation_ref: observationArtifact ? artifactId(observationArtifact) : null,
      satisfaction,
      rail_status: satisfaction === "satisfied" ? "complete" : satisfaction === "failed" ? "fail_closed" : "pending",
      rail_failure_code: validationErrors[0] ?? (satisfaction === "pending" ? "subgoal_observation_missing" : null),
      required_observation_kinds: requiredObservationKinds,
      assistant_answer: false,
      raw_content_included: false,
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
  const complete = (!applies || missingFamilies.length === 0) && missingSubgoals.length === 0;
  return {
    schema: "helix.capability_itinerary_execution_state.v1",
    applies,
    required_observation_families: requiredFamilies,
    required_capabilities: requiredCapabilities,
    admitted_tool_families: admittedFamilies,
    observed_families: observedFamilies,
    missing_observation_families: missingFamilies,
    next_missing_family: missingFamilies[0] ?? null,
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
      required_capabilities: executionState.required_capabilities,
      admitted_tool_families: executionState.admitted_tool_families,
      observed_families: executionState.observed_families,
      missing_observation_families: executionState.missing_observation_families,
      next_missing_family: executionState.next_missing_family,
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
