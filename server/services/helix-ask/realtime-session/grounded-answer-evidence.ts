import { resolveHelixRuntimeObservationReentry } from "../runtime/turn-lifecycle";

type RecordLike = Record<string, unknown>;

export type RealtimeGroundingEvidenceResult = {
  satisfied: boolean;
  evidenceRefs: string[];
  proofSource: "gateway_call_results" | "canonical_solver_trace" | null;
  reentryAuthority: "runtime_event_log" | "compatibility_projection" | null;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as RecordLike : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(readString).filter((entry): entry is string => Boolean(entry))
    : [];

const readRecordArray = (value: unknown): RecordLike[] =>
  Array.isArray(value)
    ? value.map(readRecord).filter((entry): entry is RecordLike => Boolean(entry))
    : [];

const unique = (values: Array<string | null | undefined>, limit = 48): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))).slice(0, limit);

const collectGatewayResults = (payload: RecordLike, debug: RecordLike | null): RecordLike[] => [
  ...readRecordArray(payload.workstation_gateway_call_results),
  ...readRecordArray(debug?.workstation_gateway_call_results),
];

const gatewayResultEvidenceRefs = (result: RecordLike): string[] => {
  const observationPacket = readRecord(result.observation_packet);
  return unique([
    ...readStringArray(result.artifact_refs),
    ...readStringArray(observationPacket?.produced_artifact_refs),
    readString(observationPacket?.call_id),
  ]);
};

const evaluateGatewayProof = (input: {
  turnId: string;
  requiredCapabilityIds: string[];
  payload: RecordLike;
  debug: RecordLike | null;
  compatibilityProjected: boolean;
}): RealtimeGroundingEvidenceResult | null => {
  const gatewayResults = collectGatewayResults(input.payload, input.debug);
  const selectedResults = input.requiredCapabilityIds.map((capabilityId) =>
    gatewayResults.find((result) => {
      const observationPacket = readRecord(result.observation_packet);
      return (
        readString(result.capability_id ?? result.capabilityId) === capabilityId &&
        result.ok === true &&
        observationPacket?.status === "succeeded"
      );
    }) ?? null);
  if (selectedResults.some((result) => !result)) return null;
  const resultProofs = selectedResults.map((result) => {
    const refs = gatewayResultEvidenceRefs(result!);
    return {
      refs,
      reentry: resolveHelixRuntimeObservationReentry({
        payload: input.payload,
        turnId: input.turnId,
        candidateRefs: refs,
        compatibilityProjected: input.compatibilityProjected,
      }),
    };
  });
  if (resultProofs.some((proof) => !proof.reentry.reentered)) return null;
  return {
    satisfied: true,
    evidenceRefs: unique(resultProofs.flatMap((proof) => proof.refs)),
    proofSource: "gateway_call_results",
    reentryAuthority: resultProofs.some((proof) => proof.reentry.runtime_lifecycle_verified)
      ? "runtime_event_log"
      : "compatibility_projection",
  };
};

const evaluateCanonicalSolverProof = (input: {
  turnId: string;
  requiredCapabilityIds: string[];
  payload: RecordLike;
  debug: RecordLike | null;
  solverTrace: RecordLike | null;
}): RealtimeGroundingEvidenceResult | null => {
  const procedureTrace =
    readRecord(input.payload.ask_turn_procedure_trace) ??
    readRecord(input.debug?.ask_turn_procedure_trace);
  const terminalPresentation =
    readRecord(input.payload.terminal_presentation) ??
    readRecord(input.debug?.terminal_presentation);
  const evidenceReentryGate = readRecord(input.solverTrace?.evidence_reentry_gate);
  const routeEvidenceAuthority = readRecord(input.solverTrace?.route_evidence_authority);
  const selectedTerminalProduct = readRecord(procedureTrace?.selected_terminal_product);
  const turnId = readString(procedureTrace?.turn_id);
  if (
    !turnId ||
    readString(input.solverTrace?.turn_id) !== turnId ||
    readString(terminalPresentation?.turn_id) !== turnId ||
    procedureTrace?.evidence_reentry_status !== "reentered" ||
    selectedTerminalProduct?.allowed_by_route !== true ||
    evidenceReentryGate?.completed !== true ||
    routeEvidenceAuthority?.current_turn_only !== true
  ) {
    return null;
  }

  const observedArtifacts = readRecordArray(procedureTrace.observed_artifacts);
  const observedArtifactRefs = observedArtifacts
    .map((artifact) => readString(artifact.artifact_id))
    .filter((ref): ref is string => Boolean(ref));
  const projectedReentryRefs = readStringArray(evidenceReentryGate.selected_evidence_refs);
  const reentry = resolveHelixRuntimeObservationReentry({
    payload: input.payload,
    turnId: input.turnId,
    candidateRefs: observedArtifactRefs,
    compatibilityProjected: evidenceReentryGate?.completed === true,
  });
  const reenteredRefs = new Set(
    reentry.runtime_lifecycle_verified ? reentry.matched_reentry_refs : projectedReentryRefs,
  );
  const terminalSupportRefs = new Set(unique([
    ...readStringArray(terminalPresentation?.selected_observation_refs),
    ...readStringArray(terminalPresentation?.support_refs),
  ]));
  const routeSupportRefs = new Set(readStringArray(routeEvidenceAuthority.supporting_evidence_refs));
  const admittedCapabilityIds = new Set(
    readRecordArray(routeEvidenceAuthority.admitted_tools)
      .map((entry) => readString(entry.capability_id))
      .filter((entry): entry is string => Boolean(entry)),
  );
  const capabilityResults = [
    readRecord(input.solverTrace?.capability_result),
    ...readRecordArray(input.solverTrace?.capability_results),
  ].filter((entry): entry is RecordLike => Boolean(entry));

  const selectedEvidenceRefs: string[] = [];
  for (const capabilityId of input.requiredCapabilityIds) {
    if (!admittedCapabilityIds.has(capabilityId)) return null;
    const capabilityResult = capabilityResults.find((result) =>
      readString(
        result.capability_key ??
        result.requested_capability ??
        result.executed_capability,
      ) === capabilityId &&
      readString(result.executed_capability) === capabilityId &&
      result.status === "succeeded" &&
      (reentry.runtime_lifecycle_verified || result.reentered_solver === true) &&
      result.selected_for_answer === true);
    if (!capabilityResult) return null;
    const capabilityResultRefs = new Set(unique([
      ...readStringArray(capabilityResult.observation_refs),
      ...readStringArray(capabilityResult.evidence_refs),
    ]));
    const selectedArtifact = observedArtifacts.find((artifact) => {
      const artifactId = readString(artifact.artifact_id);
      return (
        readString(artifact.capability) === capabilityId &&
        artifact.status === "succeeded" &&
        Boolean(artifactId?.startsWith(`${turnId}:`)) &&
        reenteredRefs.has(artifactId as string) &&
        terminalSupportRefs.has(artifactId as string) &&
        routeSupportRefs.has(artifactId as string) &&
        capabilityResultRefs.has(artifactId as string)
      );
    });
    const artifactId = readString(selectedArtifact?.artifact_id);
    if (!artifactId) return null;
    selectedEvidenceRefs.push(artifactId);
  }
  return {
    satisfied: true,
    evidenceRefs: unique(selectedEvidenceRefs),
    proofSource: "canonical_solver_trace",
    reentryAuthority: reentry.authority,
  };
};

export const evaluateRealtimeGroundingEvidence = (input: {
  turnId: string;
  requiredCapabilityIds: string[];
  payload: RecordLike;
  debug: RecordLike | null;
  solverTrace: RecordLike | null;
  evidenceContinuationCompleted: boolean;
}): RealtimeGroundingEvidenceResult => {
  if (input.requiredCapabilityIds.length === 0) {
    return { satisfied: true, evidenceRefs: [], proofSource: null, reentryAuthority: null };
  }
  if (!input.evidenceContinuationCompleted) {
    return { satisfied: false, evidenceRefs: [], proofSource: null, reentryAuthority: null };
  }
  return evaluateGatewayProof({ ...input, compatibilityProjected: true }) ??
    evaluateCanonicalSolverProof(input) ?? {
      satisfied: false,
      evidenceRefs: [],
      proofSource: null,
      reentryAuthority: null,
    };
};
