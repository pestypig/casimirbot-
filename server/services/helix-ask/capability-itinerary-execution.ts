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
  admitted_tool_families: string[];
  observed_families: string[];
  missing_observation_families: string[];
  next_missing_family: string | null;
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
  return [payload, observation, result].filter((entry): entry is Record<string, unknown> => Boolean(entry));
};

const artifactMatchesObservationKind = (artifact: HelixCapabilityItineraryArtifactLike, pattern: RegExp): boolean => {
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

const escapedFamilyPattern = (family: string): RegExp =>
  new RegExp(family.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

export const isHelixCapabilityItineraryFamilyObserved = (
  family: string,
  artifacts: HelixCapabilityItineraryArtifactLike[],
): boolean => {
  if (family === "scholarly_research") {
    return artifacts.some((artifact) =>
      /scholarly_research_observation|scholarly_full_text_observation/i.test([
        artifactKind(artifact),
        artifactSchema(artifact),
      ].join(" ")),
    );
  }
  if (family === "internet_search") {
    return artifacts.some((artifact) =>
      /internet_search_observation/i.test([
        artifactKind(artifact),
        artifactSchema(artifact),
        artifactId(artifact),
      ].join(" ")),
    );
  }
  if (family === "theory_locator") {
    return artifacts.some((artifact) =>
      artifactMatchesObservationKind(artifact, /helix_theory_context_reflection_tool_receipt|theory_context_reflection/i),
    );
  }
  if (family === "repo_code") {
    return artifacts.some((artifact) =>
      /repo_code_evidence_observation/i.test([artifactKind(artifact), artifactSchema(artifact)].join(" ")),
    );
  }
  if (family === "docs_viewer") {
    return artifacts.some((artifact) =>
      /doc_|docs_viewer/i.test([artifactKind(artifact), artifactSchema(artifact)].join(" ")),
    );
  }
  if (family === "live_environment") {
    return artifacts.some((artifact) => artifactKind(artifact) === "live_environment_tool_observation");
  }
  if (family === "workstation_action" || family === "notes") {
    return artifacts.some((artifact) =>
      /workspace_action_receipt|note_update_receipt|workstation_tool_evaluation/i.test([
        artifactKind(artifact),
        artifactSchema(artifact),
      ].join(" ")),
    );
  }
  return artifacts.some((artifact) => artifactMatchesObservationKind(artifact, escapedFamilyPattern(family)));
};

export const buildHelixCapabilityItineraryExecutionState = (args: {
  capabilityItinerary?: unknown;
  artifacts?: HelixCapabilityItineraryArtifactLike[] | null;
}): HelixCapabilityItineraryExecutionState => {
  const itinerary = readRecord(args.capabilityItinerary);
  const terminalCriteria = readRecord(itinerary?.terminal_success_criteria);
  const applies = terminalCriteria?.requires_post_observation_synthesis === true;
  const requiredFamilies = applies
    ? readArray(terminalCriteria?.required_observation_families)
        .map(readString)
        .filter((entry): entry is string => Boolean(entry))
    : [];
  const admittedFamilies = readArray(itinerary?.admitted_tool_families)
    .map(readString)
    .filter((entry): entry is string => Boolean(entry));
  const artifacts = args.artifacts ?? [];
  const observedFamilies = requiredFamilies.filter((family) =>
    isHelixCapabilityItineraryFamilyObserved(family, artifacts),
  );
  const missingFamilies = requiredFamilies.filter((family) => !observedFamilies.includes(family));
  return {
    schema: "helix.capability_itinerary_execution_state.v1",
    applies,
    required_observation_families: requiredFamilies,
    admitted_tool_families: admittedFamilies,
    observed_families: observedFamilies,
    missing_observation_families: missingFamilies,
    next_missing_family: missingFamilies[0] ?? null,
    complete: !applies || missingFamilies.length === 0,
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
      admitted_tool_families: executionState.admitted_tool_families,
      observed_families: executionState.observed_families,
      missing_observation_families: executionState.missing_observation_families,
      next_missing_family: executionState.next_missing_family,
      complete: executionState.complete,
    };
  }
  const debug = readRecord(payload.debug);
  if (debug) {
    debug.capability_itinerary_execution_state = executionState;
    if (itinerary) debug.capability_itinerary = itinerary;
  }
  return executionState.missing_observation_families;
};
