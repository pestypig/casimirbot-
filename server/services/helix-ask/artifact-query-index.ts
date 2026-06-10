import {
  inferToolFamilyFromToolName,
  resolveToolFamilyContract,
  TOOL_FAMILY_DEFAULT_CONTRACTS,
  type ToolFamilyContract,
} from "./tool-family-contract";

type RecordLike = Record<string, unknown>;

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
  const capability = capabilityFromPayload(input.payload, lifecycleTrace);
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
    assistant_answer: false,
    raw_content_included: false,
  };
};
