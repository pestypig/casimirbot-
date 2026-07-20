import { NHM2_EXPERIMENT_FACING_THEORY_ROADMAP_CONTRACT_VERSION } from "./nhm2-experiment-facing-theory-roadmap.v1";
import {
  nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest,
  sha256Nhm2CanonicalText,
} from "./nhm2-experiment-ready-theory-candidate-manifest.v1";

export const NHM2_PREDICTION_FALSIFIER_FREEZE_ARTIFACT_ID =
  "nhm2_prediction_falsifier_freeze";
export const NHM2_PREDICTION_FALSIFIER_FREEZE_CONTRACT_VERSION =
  "nhm2_prediction_falsifier_freeze/v1";

export const NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS = [
  "DeltaTmunu_xt",
  "delta_phi_f",
  "delta_tau",
  "delta_F",
  "h00_proxy",
  "R_0i0j",
] as const;

export const NHM2_PREDICTION_FREEZE_REQUIRED_RECEIPT_IDS = [
  "pre_registered_prediction_receipt",
  "uncertainty_budget_receipt",
  "null_control_plan_receipt",
] as const;

export const NHM2_PREDICTION_FREEZE_REQUIRED_FALSIFIER_IDS = [
  "prediction_changed_after_data_collection",
  "observable_sign_or_phase_not_pre_registered",
  "null_controls_missing",
] as const;

export type Nhm2PredictionFreezeObservableId =
  (typeof NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS)[number];
export type Nhm2PredictionFreezeRequiredFalsifierId =
  (typeof NHM2_PREDICTION_FREEZE_REQUIRED_FALSIFIER_IDS)[number];

export type Nhm2PredictionFreezeHashedArtifactRefV1 = {
  artifactId: string;
  path: string;
  schemaVersion: string;
  sha256: string;
};

export type Nhm2PredictionFreezeObservableV1 = {
  observableId: Nhm2PredictionFreezeObservableId;
  definition: string;
  unit: string;
  expectedSignOrPhase: string;
  analysisWindow: string;
  uncertaintyBudgetId: string;
  predictionRef: Nhm2PredictionFreezeHashedArtifactRefV1 | null;
};

export type Nhm2PredictionFreezeNullControlV1 = {
  controlId: string;
  targetObservableIds: Nhm2PredictionFreezeObservableId[];
  intervention: string;
  expectedOutcome: string;
  rejectionRule: string;
};

export type Nhm2PredictionFreezeDecisionRuleV1 = {
  ruleId: string;
  targetObservableIds: Nhm2PredictionFreezeObservableId[];
  statistic: string;
  comparator: "lt" | "lte" | "gt" | "gte" | "inside" | "outside";
  thresholdLower: number | null;
  thresholdUpper: number | null;
  unit: string;
  falsifierId: string;
  nullDisposition: string;
  signalDisposition: string;
};

export type Nhm2PredictionFreezeFalsifierV1 = {
  falsifierId: string;
  frozenModelId: string;
  targetObservableIds: Nhm2PredictionFreezeObservableId[];
  trigger: string;
  consequence: string;
};

export type Nhm2PredictionFreezeRegistrationReceiptV1 = {
  receiptId: (typeof NHM2_PREDICTION_FREEZE_REQUIRED_RECEIPT_IDS)[number];
  freezeId: string;
  selectedProfileId: string;
  modelId: string;
  registeredAt: string;
  issuerId: string;
  appendOnlyRegistryId: string;
  dataBoundary: "pre_data";
  subjectRef: Nhm2PredictionFreezeHashedArtifactRefV1 | null;
  registryEntryRef: Nhm2PredictionFreezeHashedArtifactRefV1 | null;
  signatureRef: Nhm2PredictionFreezeHashedArtifactRefV1 | null;
  timestampAuthorityRef: Nhm2PredictionFreezeHashedArtifactRefV1 | null;
};

export type Nhm2PredictionFreezeCandidateRegistrationBindingV1 = {
  candidateId: string;
  candidateManifestPath: string;
  candidateManifestSha256: string;
  runId: string;
  requestId: string;
  receiptId: string;
  runtimeId: string;
  plannedOutputDirectory: string;
};

export type Nhm2PredictionFalsifierFreezeV1 = {
  artifactId: typeof NHM2_PREDICTION_FALSIFIER_FREEZE_ARTIFACT_ID;
  contractVersion: typeof NHM2_PREDICTION_FALSIFIER_FREEZE_CONTRACT_VERSION;
  generatedAt: string;
  frozenAt: string;
  dataCollectionOpensAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  freezeId: string;
  semanticSha256: string;
  registrationBinding: Nhm2PredictionFreezeCandidateRegistrationBindingV1;
  roadmapBinding: {
    contractVersion: typeof NHM2_EXPERIMENT_FACING_THEORY_ROADMAP_CONTRACT_VERSION;
    stageId: "prediction_freeze";
    requiredObservableIds: Nhm2PredictionFreezeObservableId[];
    requiredReceiptIds: string[];
    requiredFalsifierIds: Nhm2PredictionFreezeRequiredFalsifierId[];
  };
  model: {
    modelId: string;
    modelVersion: string;
    solverId: string;
    solverVersion: string;
    sourceCommitSha: string;
    definitionRef: Nhm2PredictionFreezeHashedArtifactRefV1 | null;
    inputManifestRef: Nhm2PredictionFreezeHashedArtifactRefV1 | null;
  };
  parameterSet: {
    parameterSetId: string;
    parameterCount: number;
    manifestRef: Nhm2PredictionFreezeHashedArtifactRefV1 | null;
  };
  observables: Nhm2PredictionFreezeObservableV1[];
  uncertaintyBudget: {
    uncertaintyBudgetId: string;
    method: string;
    coverageProbability: number;
    sourceIds: string[];
    observableIds: Nhm2PredictionFreezeObservableId[];
    budgetRef: Nhm2PredictionFreezeHashedArtifactRefV1 | null;
    covarianceRef: Nhm2PredictionFreezeHashedArtifactRefV1 | null;
  };
  nullControlPlan: {
    controls: Nhm2PredictionFreezeNullControlV1[];
    planRef: Nhm2PredictionFreezeHashedArtifactRefV1 | null;
  };
  blindingPlan: {
    blindedFieldIds: string[];
    unblindingTrigger: string;
    keyCustodianRole: string;
    analysisRole: string;
    experimentRole: string;
    planRef: Nhm2PredictionFreezeHashedArtifactRefV1 | null;
  };
  decisionPlan: {
    multiplicityMethod: string;
    familywiseAlpha: number;
    rules: Nhm2PredictionFreezeDecisionRuleV1[];
    planRef: Nhm2PredictionFreezeHashedArtifactRefV1 | null;
  };
  falsifierRegistry: {
    falsifiers: Nhm2PredictionFreezeFalsifierV1[];
    registryRef: Nhm2PredictionFreezeHashedArtifactRefV1 | null;
  };
  registrationReceipts: Nhm2PredictionFreezeRegistrationReceiptV1[];
  analysisCode: {
    repository: string;
    sourceCommitSha: string;
    entrypoint: string;
    deterministicSeedPolicy: string;
    sourceTreeRef: Nhm2PredictionFreezeHashedArtifactRefV1 | null;
    dependencyLockRef: Nhm2PredictionFreezeHashedArtifactRefV1 | null;
    environmentRef: Nhm2PredictionFreezeHashedArtifactRefV1 | null;
    protocolRef: Nhm2PredictionFreezeHashedArtifactRefV1 | null;
  };
  supersessionPolicy: {
    policyId: string;
    policyRef: Nhm2PredictionFreezeHashedArtifactRefV1 | null;
    originalFreezeImmutable: true;
    supersedingFreezeRequiresNewFreezeId: true;
    postDataChangesExploratoryOnly: true;
  };
  freezeManifestRef: Nhm2PredictionFreezeHashedArtifactRefV1 | null;
  readiness: {
    predictionFreezeReady: boolean;
    blockerCount: number;
    firstBlocker: string;
    blockers: string[];
  };
  claimBoundary: {
    diagnosticOnly: true;
    predictionFreezeOnly: true;
    predictionFreezeCannotAloneEstablishTheoryClosure: true;
    predictionFreezeCannotSubstituteForExperimentalEvidence: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

export type Nhm2PredictionFreezeScientificPayloadV1 = Pick<
  Nhm2PredictionFalsifierFreezeV1,
  | "artifactId"
  | "contractVersion"
  | "frozenAt"
  | "dataCollectionOpensAt"
  | "laneId"
  | "selectedProfileId"
  | "freezeId"
  | "roadmapBinding"
  | "model"
  | "parameterSet"
  | "observables"
  | "uncertaintyBudget"
  | "nullControlPlan"
  | "blindingPlan"
  | "decisionPlan"
  | "falsifierRegistry"
  | "analysisCode"
  | "supersessionPolicy"
>;

export type BuildNhm2PredictionFalsifierFreezeInput = {
  generatedAt?: string | null;
  frozenAt: string;
  dataCollectionOpensAt: string;
  selectedProfileId: string;
  freezeId: string;
  registrationBinding: Nhm2PredictionFreezeCandidateRegistrationBindingV1;
  model: Nhm2PredictionFalsifierFreezeV1["model"];
  parameterSet: Nhm2PredictionFalsifierFreezeV1["parameterSet"];
  observables: Nhm2PredictionFreezeObservableV1[];
  uncertaintyBudget: Nhm2PredictionFalsifierFreezeV1["uncertaintyBudget"];
  nullControlPlan: Nhm2PredictionFalsifierFreezeV1["nullControlPlan"];
  blindingPlan: Nhm2PredictionFalsifierFreezeV1["blindingPlan"];
  decisionPlan: Nhm2PredictionFalsifierFreezeV1["decisionPlan"];
  falsifierRegistry: Nhm2PredictionFalsifierFreezeV1["falsifierRegistry"];
  registrationReceipts: Nhm2PredictionFalsifierFreezeV1["registrationReceipts"];
  analysisCode: Nhm2PredictionFalsifierFreezeV1["analysisCode"];
  supersessionPolicy: Pick<
    Nhm2PredictionFalsifierFreezeV1["supersessionPolicy"],
    "policyId" | "policyRef"
  >;
  freezeManifestRef: Nhm2PredictionFreezeHashedArtifactRefV1 | null;
};

const SHA256_HEX = /^[a-f0-9]{64}$/;
const COMMIT_SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const hasOnlyKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean =>
  Object.keys(value).length === keys.length &&
  Object.keys(value).every((key) => keys.includes(key));

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const hasLatestAlias = (path: string): boolean =>
  /(^|[-/\\])latest(\.|[-/\\]|$)/i.test(path);

const isPinnedRelativePath = (value: unknown): value is string => {
  if (!isText(value)) return false;
  const path = value.trim();
  if (
    path.includes("\\") ||
    path.startsWith("/") ||
    /^[a-z]:/i.test(path) ||
    /^[a-z][a-z0-9+.-]*:/i.test(path) ||
    /[?#*{}\[\]]/.test(path)
  ) {
    return false;
  }
  const segments = path.split("/");
  return (
    segments.every(
      (segment) => segment !== "" && segment !== "." && segment !== "..",
    ) && !segments.some((segment) => segment.toLowerCase() === "latest")
  );
};

const isImmutableHashedRef = (
  value: Nhm2PredictionFreezeHashedArtifactRefV1 | null,
): value is Nhm2PredictionFreezeHashedArtifactRefV1 =>
  value != null &&
  isText(value.artifactId) &&
  isText(value.path) &&
  isText(value.schemaVersion) &&
  SHA256_HEX.test(value.sha256) &&
  !hasLatestAlias(value.path);

const isHashedRefShape = (
  value: unknown,
): value is Nhm2PredictionFreezeHashedArtifactRefV1 => {
  if (!isRecord(value)) return false;
  return (
    hasOnlyKeys(value, ["artifactId", "path", "schemaVersion", "sha256"]) &&
    isText(value.artifactId) &&
    isText(value.path) &&
    isText(value.schemaVersion) &&
    isText(value.sha256)
  );
};

const isNullableHashedRefShape = (
  value: unknown,
): value is Nhm2PredictionFreezeHashedArtifactRefV1 | null =>
  value === null || isHashedRefShape(value);

const isIsoTimestamp = (value: string): boolean => {
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
};

const distinct = (values: readonly string[]): boolean =>
  new Set(values).size === values.length;

const sameStringSet = (
  left: readonly string[],
  right: readonly string[],
): boolean =>
  left.length === right.length &&
  distinct(left) &&
  distinct(right) &&
  left.every((entry) => right.includes(entry));

const isObservableId = (
  value: unknown,
): value is Nhm2PredictionFreezeObservableId =>
  typeof value === "string" &&
  (
    NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS as readonly string[]
  ).includes(value);

const isObservableIdArray = (
  value: unknown,
): value is Nhm2PredictionFreezeObservableId[] =>
  Array.isArray(value) && value.every(isObservableId);

const allRequiredObservablesCovered = (ids: readonly string[]): boolean =>
  NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS.every((id) =>
    ids.includes(id),
  );

const pushIf = (
  blockers: string[],
  condition: boolean,
  blocker: string,
): void => {
  if (condition) blockers.push(blocker);
};

/**
 * Selects only the scientific prediction payload. Deliberately excluded are
 * generatedAt, semanticSha256, registrationBinding, registrationReceipts,
 * freezeManifestRef, readiness, and claimBoundary. Those fields register or
 * evaluate the already-frozen science and may bind a candidate-manifest hash
 * without creating a digest fixed point.
 */
export const toNhm2PredictionFreezeScientificPayload = (
  artifact: Nhm2PredictionFreezeScientificPayloadV1,
): Nhm2PredictionFreezeScientificPayloadV1 => ({
  artifactId: artifact.artifactId,
  contractVersion: artifact.contractVersion,
  frozenAt: artifact.frozenAt,
  dataCollectionOpensAt: artifact.dataCollectionOpensAt,
  laneId: artifact.laneId,
  selectedProfileId: artifact.selectedProfileId,
  freezeId: artifact.freezeId,
  roadmapBinding: artifact.roadmapBinding,
  model: artifact.model,
  parameterSet: artifact.parameterSet,
  observables: artifact.observables,
  uncertaintyBudget: artifact.uncertaintyBudget,
  nullControlPlan: artifact.nullControlPlan,
  blindingPlan: artifact.blindingPlan,
  decisionPlan: artifact.decisionPlan,
  falsifierRegistry: artifact.falsifierRegistry,
  analysisCode: artifact.analysisCode,
  supersessionPolicy: artifact.supersessionPolicy,
});

const canonicalizeScientificValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalizeScientificValue);
  if (!isRecord(value)) return Object.is(value, -0) ? 0 : value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalizeScientificValue(value[key])]),
  );
};

export const canonicalNhm2PredictionFreezeScientificPayload = (
  payload: Nhm2PredictionFreezeScientificPayloadV1,
): string => JSON.stringify(canonicalizeScientificValue(payload));

export const computeNhm2PredictionFreezeScientificSemanticSha256 = (
  payload: Nhm2PredictionFreezeScientificPayloadV1,
): string =>
  sha256Nhm2CanonicalText(
    canonicalNhm2PredictionFreezeScientificPayload(payload),
  );

const deriveReadiness = (
  artifact: Omit<
    Nhm2PredictionFalsifierFreezeV1,
    "readiness" | "claimBoundary"
  >,
): Nhm2PredictionFalsifierFreezeV1["readiness"] => {
  const blockers: string[] = [];
  const generatedTime = Date.parse(artifact.generatedAt);
  const frozenTime = Date.parse(artifact.frozenAt);
  const opensTime = Date.parse(artifact.dataCollectionOpensAt);

  pushIf(
    blockers,
    !isIsoTimestamp(artifact.generatedAt),
    "generated_at_invalid",
  );
  pushIf(blockers, !isIsoTimestamp(artifact.frozenAt), "frozen_at_invalid");
  pushIf(
    blockers,
    !isIsoTimestamp(artifact.dataCollectionOpensAt),
    "data_collection_opens_at_invalid",
  );
  pushIf(
    blockers,
    Number.isFinite(generatedTime) &&
      Number.isFinite(frozenTime) &&
      generatedTime < frozenTime,
    "generated_before_freeze",
  );
  pushIf(
    blockers,
    Number.isFinite(generatedTime) &&
      Number.isFinite(opensTime) &&
      generatedTime >= opensTime,
    "freeze_artifact_generated_after_data_collection_opened",
  );
  pushIf(
    blockers,
    Number.isFinite(frozenTime) &&
      Number.isFinite(opensTime) &&
      frozenTime >= opensTime,
    "prediction_not_frozen_before_data_collection",
  );

  pushIf(
    blockers,
    !isText(artifact.selectedProfileId),
    "selected_profile_id_missing",
  );
  pushIf(blockers, !isText(artifact.freezeId), "freeze_id_missing");
  const expectedSemanticSha256 =
    computeNhm2PredictionFreezeScientificSemanticSha256(
      toNhm2PredictionFreezeScientificPayload(artifact),
    );
  pushIf(
    blockers,
    !SHA256_HEX.test(artifact.semanticSha256),
    "scientific_semantic_sha256_invalid",
  );
  pushIf(
    blockers,
    artifact.semanticSha256 !== expectedSemanticSha256,
    "scientific_semantic_sha256_mismatch",
  );

  const registration = artifact.registrationBinding;
  for (const [label, value] of [
    ["candidate_id", registration.candidateId],
    ["run_id", registration.runId],
    ["request_id", registration.requestId],
    ["receipt_id", registration.receiptId],
    ["runtime_id", registration.runtimeId],
  ] as const) {
    pushIf(blockers, !isText(value), `registration_${label}_missing`);
  }
  pushIf(
    blockers,
    !isPinnedRelativePath(registration.candidateManifestPath),
    "registration_candidate_manifest_path_not_pinned",
  );
  pushIf(
    blockers,
    !SHA256_HEX.test(registration.candidateManifestSha256),
    "registration_candidate_manifest_sha256_invalid",
  );
  pushIf(
    blockers,
    !isPinnedRelativePath(registration.plannedOutputDirectory),
    "registration_planned_output_directory_not_pinned",
  );
  pushIf(
    blockers,
    isText(registration.runtimeId) &&
      isText(registration.requestId) &&
      registration.receiptId !==
        nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest(
          registration.runtimeId,
          registration.requestId,
        ),
    "registration_receipt_id_not_deterministic",
  );
  for (const [label, value] of [
    ["model_id", artifact.model.modelId],
    ["model_version", artifact.model.modelVersion],
    ["solver_id", artifact.model.solverId],
    ["solver_version", artifact.model.solverVersion],
    ["parameter_set_id", artifact.parameterSet.parameterSetId],
  ] as const) {
    pushIf(blockers, !isText(value), `${label}_missing`);
  }

  pushIf(
    blockers,
    !COMMIT_SHA.test(artifact.model.sourceCommitSha),
    "model_commit_unpinned",
  );
  pushIf(
    blockers,
    !isImmutableHashedRef(artifact.model.definitionRef),
    "model_definition_unhashed_or_mutable",
  );
  pushIf(
    blockers,
    !isImmutableHashedRef(artifact.model.inputManifestRef),
    "model_input_manifest_unhashed_or_mutable",
  );
  pushIf(
    blockers,
    artifact.parameterSet.parameterCount <= 0 ||
      !Number.isInteger(artifact.parameterSet.parameterCount),
    "parameter_set_empty",
  );
  pushIf(
    blockers,
    !isImmutableHashedRef(artifact.parameterSet.manifestRef),
    "parameter_manifest_unhashed_or_mutable",
  );

  const observableIds = artifact.observables.map((entry) => entry.observableId);
  pushIf(
    blockers,
    !sameStringSet(
      observableIds,
      NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS,
    ),
    "required_observable_set_incomplete_or_duplicated",
  );
  for (const observable of artifact.observables) {
    for (const [label, value] of [
      ["definition", observable.definition],
      ["unit", observable.unit],
      ["expected_sign_or_phase", observable.expectedSignOrPhase],
      ["analysis_window", observable.analysisWindow],
    ] as const) {
      pushIf(
        blockers,
        !isText(value),
        `observable_${label}_missing:${observable.observableId}`,
      );
    }
    pushIf(
      blockers,
      observable.uncertaintyBudgetId !==
        artifact.uncertaintyBudget.uncertaintyBudgetId,
      `observable_uncertainty_budget_mismatch:${observable.observableId}`,
    );
    pushIf(
      blockers,
      !isImmutableHashedRef(observable.predictionRef),
      `observable_prediction_unhashed_or_mutable:${observable.observableId}`,
    );
  }

  pushIf(
    blockers,
    !sameStringSet(
      artifact.uncertaintyBudget.observableIds,
      NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS,
    ),
    "uncertainty_budget_observable_coverage_incomplete",
  );
  pushIf(
    blockers,
    artifact.uncertaintyBudget.coverageProbability <= 0 ||
      artifact.uncertaintyBudget.coverageProbability >= 1,
    "uncertainty_coverage_probability_invalid",
  );
  pushIf(
    blockers,
    artifact.uncertaintyBudget.sourceIds.length === 0 ||
      !distinct(artifact.uncertaintyBudget.sourceIds) ||
      artifact.uncertaintyBudget.sourceIds.some((entry) => !isText(entry)),
    "uncertainty_sources_missing_or_duplicated",
  );
  pushIf(
    blockers,
    !isText(artifact.uncertaintyBudget.method),
    "uncertainty_method_missing",
  );
  pushIf(
    blockers,
    !isImmutableHashedRef(artifact.uncertaintyBudget.budgetRef),
    "uncertainty_budget_unhashed_or_mutable",
  );
  pushIf(
    blockers,
    !isImmutableHashedRef(artifact.uncertaintyBudget.covarianceRef),
    "uncertainty_covariance_unhashed_or_mutable",
  );

  const controlIds = artifact.nullControlPlan.controls.map(
    (entry) => entry.controlId,
  );
  const controlledObservables = artifact.nullControlPlan.controls.flatMap(
    (entry) => entry.targetObservableIds,
  );
  pushIf(
    blockers,
    !isImmutableHashedRef(artifact.nullControlPlan.planRef),
    "null_control_plan_unhashed_or_mutable",
  );
  pushIf(
    blockers,
    controlIds.length === 0 || !distinct(controlIds),
    "null_controls_missing_or_duplicated",
  );
  for (const control of artifact.nullControlPlan.controls) {
    pushIf(
      blockers,
      !isText(control.intervention) ||
        !isText(control.expectedOutcome) ||
        !isText(control.rejectionRule),
      `null_control_definition_incomplete:${control.controlId}`,
    );
  }
  pushIf(
    blockers,
    !allRequiredObservablesCovered(controlledObservables),
    "null_control_observable_coverage_incomplete",
  );

  const blindRoles = [
    artifact.blindingPlan.keyCustodianRole,
    artifact.blindingPlan.analysisRole,
    artifact.blindingPlan.experimentRole,
  ];
  pushIf(
    blockers,
    !isImmutableHashedRef(artifact.blindingPlan.planRef),
    "blinding_plan_unhashed_or_mutable",
  );
  pushIf(
    blockers,
    artifact.blindingPlan.blindedFieldIds.length === 0 ||
      !distinct(artifact.blindingPlan.blindedFieldIds),
    "blinded_fields_missing_or_duplicated",
  );
  pushIf(blockers, !distinct(blindRoles), "blinding_role_separation_missing");
  pushIf(
    blockers,
    !isText(artifact.blindingPlan.unblindingTrigger),
    "unblinding_trigger_missing",
  );

  const ruleIds = artifact.decisionPlan.rules.map((entry) => entry.ruleId);
  const decidedObservables = artifact.decisionPlan.rules.flatMap(
    (entry) => entry.targetObservableIds,
  );
  const falsifierIds = artifact.falsifierRegistry.falsifiers.map(
    (entry) => entry.falsifierId,
  );
  pushIf(
    blockers,
    !isImmutableHashedRef(artifact.decisionPlan.planRef),
    "decision_plan_unhashed_or_mutable",
  );
  pushIf(
    blockers,
    artifact.decisionPlan.familywiseAlpha <= 0 ||
      artifact.decisionPlan.familywiseAlpha >= 1,
    "decision_familywise_alpha_invalid",
  );
  pushIf(
    blockers,
    ruleIds.length === 0 || !distinct(ruleIds),
    "decision_rules_missing_or_duplicated",
  );
  pushIf(
    blockers,
    !allRequiredObservablesCovered(decidedObservables),
    "decision_rule_observable_coverage_incomplete",
  );
  for (const rule of artifact.decisionPlan.rules) {
    const lowerValid =
      rule.thresholdLower != null && Number.isFinite(rule.thresholdLower);
    const upperValid =
      rule.thresholdUpper != null && Number.isFinite(rule.thresholdUpper);
    const thresholdValid =
      rule.comparator === "lt" || rule.comparator === "lte"
        ? !lowerValid && upperValid
        : rule.comparator === "gt" || rule.comparator === "gte"
          ? lowerValid && !upperValid
          : lowerValid &&
            upperValid &&
            rule.thresholdLower! < rule.thresholdUpper!;
    pushIf(
      blockers,
      !thresholdValid,
      `decision_rule_threshold_invalid:${rule.ruleId}`,
    );
    pushIf(
      blockers,
      !isText(rule.statistic) ||
        !isText(rule.unit) ||
        !isText(rule.nullDisposition) ||
        !isText(rule.signalDisposition),
      `decision_rule_definition_incomplete:${rule.ruleId}`,
    );
    pushIf(
      blockers,
      !falsifierIds.includes(rule.falsifierId),
      `decision_rule_falsifier_unbound:${rule.ruleId}`,
    );
    const matchingFalsifier = artifact.falsifierRegistry.falsifiers.find(
      (entry) => entry.falsifierId === rule.falsifierId,
    );
    pushIf(
      blockers,
      matchingFalsifier != null &&
        !sameStringSet(
          rule.targetObservableIds,
          matchingFalsifier.targetObservableIds,
        ),
      `decision_rule_falsifier_observable_mismatch:${rule.ruleId}`,
    );
  }

  const falsifiedObservables = artifact.falsifierRegistry.falsifiers.flatMap(
    (entry) => entry.targetObservableIds,
  );
  pushIf(
    blockers,
    !isImmutableHashedRef(artifact.falsifierRegistry.registryRef),
    "falsifier_registry_unhashed_or_mutable",
  );
  pushIf(
    blockers,
    falsifierIds.length === 0 || !distinct(falsifierIds),
    "falsifiers_missing_or_duplicated",
  );
  for (const falsifierId of NHM2_PREDICTION_FREEZE_REQUIRED_FALSIFIER_IDS) {
    pushIf(
      blockers,
      !falsifierIds.includes(falsifierId),
      `roadmap_falsifier_missing:${falsifierId}`,
    );
  }
  pushIf(
    blockers,
    !allRequiredObservablesCovered(falsifiedObservables),
    "falsifier_observable_coverage_incomplete",
  );
  for (const falsifier of artifact.falsifierRegistry.falsifiers) {
    pushIf(
      blockers,
      falsifier.frozenModelId !== artifact.model.modelId,
      `falsifier_model_mismatch:${falsifier.falsifierId}`,
    );
    pushIf(
      blockers,
      !isText(falsifier.trigger) || !isText(falsifier.consequence),
      `falsifier_definition_incomplete:${falsifier.falsifierId}`,
    );
  }

  const predictionRefKeys = artifact.observables
    .map((entry) => entry.predictionRef)
    .filter(isImmutableHashedRef)
    .map((entry) => `${entry.path}\u0000${entry.sha256}`);
  pushIf(
    blockers,
    predictionRefKeys.length !== artifact.observables.length ||
      !distinct(predictionRefKeys),
    "observable_prediction_refs_missing_or_reused",
  );

  const receipts = artifact.registrationReceipts;
  const receiptIds = receipts.map((entry) => entry.receiptId);
  pushIf(
    blockers,
    !sameStringSet(receiptIds, NHM2_PREDICTION_FREEZE_REQUIRED_RECEIPT_IDS),
    "required_registration_receipts_missing_or_duplicated",
  );
  const expectedReceiptSubject = new Map<
    Nhm2PredictionFreezeRegistrationReceiptV1["receiptId"],
    Nhm2PredictionFreezeHashedArtifactRefV1 | null
  >([
    ["pre_registered_prediction_receipt", artifact.freezeManifestRef],
    ["uncertainty_budget_receipt", artifact.uncertaintyBudget.budgetRef],
    ["null_control_plan_receipt", artifact.nullControlPlan.planRef],
  ]);
  for (const receipt of receipts) {
    pushIf(
      blockers,
      receipt.freezeId !== artifact.freezeId ||
        receipt.selectedProfileId !== artifact.selectedProfileId ||
        receipt.modelId !== artifact.model.modelId,
      `registration_receipt_identity_mismatch:${receipt.receiptId}`,
    );
    const registeredTime = Date.parse(receipt.registeredAt);
    pushIf(
      blockers,
      !isIsoTimestamp(receipt.registeredAt) ||
        !Number.isFinite(registeredTime) ||
        registeredTime < frozenTime ||
        registeredTime >= opensTime,
      `registration_receipt_time_invalid:${receipt.receiptId}`,
    );
    pushIf(
      blockers,
      !isText(receipt.issuerId) || !isText(receipt.appendOnlyRegistryId),
      `registration_receipt_authority_missing:${receipt.receiptId}`,
    );
    const expectedSubject = expectedReceiptSubject.get(receipt.receiptId);
    pushIf(
      blockers,
      !isImmutableHashedRef(receipt.subjectRef) ||
        expectedSubject == null ||
        receipt.subjectRef?.path !== expectedSubject.path ||
        receipt.subjectRef?.sha256 !== expectedSubject.sha256,
      `registration_receipt_subject_mismatch:${receipt.receiptId}`,
    );
    for (const [label, ref] of [
      ["registry_entry", receipt.registryEntryRef],
      ["signature", receipt.signatureRef],
      ["timestamp_authority", receipt.timestampAuthorityRef],
    ] as const) {
      pushIf(
        blockers,
        !isImmutableHashedRef(ref),
        `registration_receipt_${label}_unhashed_or_mutable:${receipt.receiptId}`,
      );
    }
  }

  pushIf(
    blockers,
    !COMMIT_SHA.test(artifact.analysisCode.sourceCommitSha),
    "analysis_code_commit_unpinned",
  );
  for (const [label, ref] of [
    ["source_tree", artifact.analysisCode.sourceTreeRef],
    ["dependency_lock", artifact.analysisCode.dependencyLockRef],
    ["environment", artifact.analysisCode.environmentRef],
    ["protocol", artifact.analysisCode.protocolRef],
  ] as const) {
    pushIf(
      blockers,
      !isImmutableHashedRef(ref),
      `analysis_${label}_unhashed_or_mutable`,
    );
  }

  pushIf(
    blockers,
    !isImmutableHashedRef(artifact.supersessionPolicy.policyRef),
    "supersession_policy_unhashed_or_mutable",
  );
  pushIf(
    blockers,
    !isImmutableHashedRef(artifact.freezeManifestRef),
    "freeze_manifest_unhashed_or_mutable",
  );

  return {
    predictionFreezeReady: blockers.length === 0,
    blockerCount: blockers.length,
    firstBlocker: blockers[0] ?? "none",
    blockers,
  };
};

const cloneRef = (
  ref: Nhm2PredictionFreezeHashedArtifactRefV1 | null,
): Nhm2PredictionFreezeHashedArtifactRefV1 | null =>
  ref == null ? null : { ...ref };

export const buildNhm2PredictionFalsifierFreeze = (
  input: BuildNhm2PredictionFalsifierFreezeInput,
): Nhm2PredictionFalsifierFreezeV1 => {
  const core: Omit<
    Nhm2PredictionFalsifierFreezeV1,
    "readiness" | "claimBoundary"
  > = {
    artifactId: NHM2_PREDICTION_FALSIFIER_FREEZE_ARTIFACT_ID,
    contractVersion: NHM2_PREDICTION_FALSIFIER_FREEZE_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    frozenAt: input.frozenAt,
    dataCollectionOpensAt: input.dataCollectionOpensAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: input.selectedProfileId,
    freezeId: input.freezeId,
    semanticSha256: "",
    registrationBinding: {
      candidateId: input.registrationBinding.candidateId,
      candidateManifestPath: input.registrationBinding.candidateManifestPath,
      candidateManifestSha256:
        input.registrationBinding.candidateManifestSha256,
      runId: input.registrationBinding.runId,
      requestId: input.registrationBinding.requestId,
      receiptId: input.registrationBinding.receiptId,
      runtimeId: input.registrationBinding.runtimeId,
      plannedOutputDirectory: input.registrationBinding.plannedOutputDirectory,
    },
    roadmapBinding: {
      contractVersion: NHM2_EXPERIMENT_FACING_THEORY_ROADMAP_CONTRACT_VERSION,
      stageId: "prediction_freeze",
      requiredObservableIds: [
        ...NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS,
      ],
      requiredReceiptIds: [...NHM2_PREDICTION_FREEZE_REQUIRED_RECEIPT_IDS],
      requiredFalsifierIds: [...NHM2_PREDICTION_FREEZE_REQUIRED_FALSIFIER_IDS],
    },
    model: {
      modelId: input.model.modelId,
      modelVersion: input.model.modelVersion,
      solverId: input.model.solverId,
      solverVersion: input.model.solverVersion,
      sourceCommitSha: input.model.sourceCommitSha,
      definitionRef: cloneRef(input.model.definitionRef),
      inputManifestRef: cloneRef(input.model.inputManifestRef),
    },
    parameterSet: {
      parameterSetId: input.parameterSet.parameterSetId,
      parameterCount: input.parameterSet.parameterCount,
      manifestRef: cloneRef(input.parameterSet.manifestRef),
    },
    observables: input.observables.map((entry) => ({
      observableId: entry.observableId,
      definition: entry.definition,
      unit: entry.unit,
      expectedSignOrPhase: entry.expectedSignOrPhase,
      analysisWindow: entry.analysisWindow,
      uncertaintyBudgetId: entry.uncertaintyBudgetId,
      predictionRef: cloneRef(entry.predictionRef),
    })),
    uncertaintyBudget: {
      uncertaintyBudgetId: input.uncertaintyBudget.uncertaintyBudgetId,
      method: input.uncertaintyBudget.method,
      coverageProbability: input.uncertaintyBudget.coverageProbability,
      sourceIds: [...input.uncertaintyBudget.sourceIds],
      observableIds: [...input.uncertaintyBudget.observableIds],
      budgetRef: cloneRef(input.uncertaintyBudget.budgetRef),
      covarianceRef: cloneRef(input.uncertaintyBudget.covarianceRef),
    },
    nullControlPlan: {
      controls: input.nullControlPlan.controls.map((entry) => ({
        controlId: entry.controlId,
        targetObservableIds: [...entry.targetObservableIds],
        intervention: entry.intervention,
        expectedOutcome: entry.expectedOutcome,
        rejectionRule: entry.rejectionRule,
      })),
      planRef: cloneRef(input.nullControlPlan.planRef),
    },
    blindingPlan: {
      blindedFieldIds: [...input.blindingPlan.blindedFieldIds],
      unblindingTrigger: input.blindingPlan.unblindingTrigger,
      keyCustodianRole: input.blindingPlan.keyCustodianRole,
      analysisRole: input.blindingPlan.analysisRole,
      experimentRole: input.blindingPlan.experimentRole,
      planRef: cloneRef(input.blindingPlan.planRef),
    },
    decisionPlan: {
      multiplicityMethod: input.decisionPlan.multiplicityMethod,
      familywiseAlpha: input.decisionPlan.familywiseAlpha,
      rules: input.decisionPlan.rules.map((entry) => ({
        ruleId: entry.ruleId,
        targetObservableIds: [...entry.targetObservableIds],
        statistic: entry.statistic,
        comparator: entry.comparator,
        thresholdLower: entry.thresholdLower,
        thresholdUpper: entry.thresholdUpper,
        unit: entry.unit,
        falsifierId: entry.falsifierId,
        nullDisposition: entry.nullDisposition,
        signalDisposition: entry.signalDisposition,
      })),
      planRef: cloneRef(input.decisionPlan.planRef),
    },
    falsifierRegistry: {
      falsifiers: input.falsifierRegistry.falsifiers.map((entry) => ({
        falsifierId: entry.falsifierId,
        frozenModelId: entry.frozenModelId,
        targetObservableIds: [...entry.targetObservableIds],
        trigger: entry.trigger,
        consequence: entry.consequence,
      })),
      registryRef: cloneRef(input.falsifierRegistry.registryRef),
    },
    registrationReceipts: input.registrationReceipts.map((entry) => ({
      receiptId: entry.receiptId,
      freezeId: entry.freezeId,
      selectedProfileId: entry.selectedProfileId,
      modelId: entry.modelId,
      registeredAt: entry.registeredAt,
      issuerId: entry.issuerId,
      appendOnlyRegistryId: entry.appendOnlyRegistryId,
      dataBoundary: "pre_data",
      subjectRef: cloneRef(entry.subjectRef),
      registryEntryRef: cloneRef(entry.registryEntryRef),
      signatureRef: cloneRef(entry.signatureRef),
      timestampAuthorityRef: cloneRef(entry.timestampAuthorityRef),
    })),
    analysisCode: {
      repository: input.analysisCode.repository,
      sourceCommitSha: input.analysisCode.sourceCommitSha,
      entrypoint: input.analysisCode.entrypoint,
      deterministicSeedPolicy: input.analysisCode.deterministicSeedPolicy,
      sourceTreeRef: cloneRef(input.analysisCode.sourceTreeRef),
      dependencyLockRef: cloneRef(input.analysisCode.dependencyLockRef),
      environmentRef: cloneRef(input.analysisCode.environmentRef),
      protocolRef: cloneRef(input.analysisCode.protocolRef),
    },
    supersessionPolicy: {
      policyId: input.supersessionPolicy.policyId,
      policyRef: cloneRef(input.supersessionPolicy.policyRef),
      originalFreezeImmutable: true,
      supersedingFreezeRequiresNewFreezeId: true,
      postDataChangesExploratoryOnly: true,
    },
    freezeManifestRef: cloneRef(input.freezeManifestRef),
  };

  core.semanticSha256 = computeNhm2PredictionFreezeScientificSemanticSha256(
    toNhm2PredictionFreezeScientificPayload(core),
  );

  return {
    ...core,
    readiness: deriveReadiness(core),
    claimBoundary: {
      diagnosticOnly: true,
      predictionFreezeOnly: true,
      predictionFreezeCannotAloneEstablishTheoryClosure: true,
      predictionFreezeCannotSubstituteForExperimentalEvidence: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    },
  };
};

const isObservable = (
  value: unknown,
): value is Nhm2PredictionFreezeObservableV1 => {
  if (!isRecord(value)) return false;
  return (
    hasOnlyKeys(value, [
      "observableId",
      "definition",
      "unit",
      "expectedSignOrPhase",
      "analysisWindow",
      "uncertaintyBudgetId",
      "predictionRef",
    ]) &&
    isObservableId(value.observableId) &&
    isText(value.definition) &&
    isText(value.unit) &&
    isText(value.expectedSignOrPhase) &&
    isText(value.analysisWindow) &&
    isText(value.uncertaintyBudgetId) &&
    isNullableHashedRefShape(value.predictionRef)
  );
};

const isNullControl = (
  value: unknown,
): value is Nhm2PredictionFreezeNullControlV1 => {
  if (!isRecord(value)) return false;
  return (
    hasOnlyKeys(value, [
      "controlId",
      "targetObservableIds",
      "intervention",
      "expectedOutcome",
      "rejectionRule",
    ]) &&
    isText(value.controlId) &&
    isObservableIdArray(value.targetObservableIds) &&
    value.targetObservableIds.length > 0 &&
    isText(value.intervention) &&
    isText(value.expectedOutcome) &&
    isText(value.rejectionRule)
  );
};

const isDecisionRule = (
  value: unknown,
): value is Nhm2PredictionFreezeDecisionRuleV1 => {
  if (!isRecord(value)) return false;
  return (
    hasOnlyKeys(value, [
      "ruleId",
      "targetObservableIds",
      "statistic",
      "comparator",
      "thresholdLower",
      "thresholdUpper",
      "unit",
      "falsifierId",
      "nullDisposition",
      "signalDisposition",
    ]) &&
    isText(value.ruleId) &&
    isObservableIdArray(value.targetObservableIds) &&
    value.targetObservableIds.length > 0 &&
    isText(value.statistic) &&
    ["lt", "lte", "gt", "gte", "inside", "outside"].includes(
      String(value.comparator),
    ) &&
    (value.thresholdLower === null || isFiniteNumber(value.thresholdLower)) &&
    (value.thresholdUpper === null || isFiniteNumber(value.thresholdUpper)) &&
    isText(value.unit) &&
    isText(value.falsifierId) &&
    isText(value.nullDisposition) &&
    isText(value.signalDisposition)
  );
};

const isRegistrationReceipt = (
  value: unknown,
): value is Nhm2PredictionFreezeRegistrationReceiptV1 => {
  if (!isRecord(value)) return false;
  return (
    hasOnlyKeys(value, [
      "receiptId",
      "freezeId",
      "selectedProfileId",
      "modelId",
      "registeredAt",
      "issuerId",
      "appendOnlyRegistryId",
      "dataBoundary",
      "subjectRef",
      "registryEntryRef",
      "signatureRef",
      "timestampAuthorityRef",
    ]) &&
    typeof value.receiptId === "string" &&
    (NHM2_PREDICTION_FREEZE_REQUIRED_RECEIPT_IDS as readonly string[]).includes(
      value.receiptId,
    ) &&
    isText(value.freezeId) &&
    isText(value.selectedProfileId) &&
    isText(value.modelId) &&
    isText(value.registeredAt) &&
    isText(value.issuerId) &&
    isText(value.appendOnlyRegistryId) &&
    value.dataBoundary === "pre_data" &&
    isNullableHashedRefShape(value.subjectRef) &&
    isNullableHashedRefShape(value.registryEntryRef) &&
    isNullableHashedRefShape(value.signatureRef) &&
    isNullableHashedRefShape(value.timestampAuthorityRef)
  );
};

const isCandidateRegistrationBinding = (
  value: unknown,
): value is Nhm2PredictionFreezeCandidateRegistrationBindingV1 =>
  isRecord(value) &&
  hasOnlyKeys(value, [
    "candidateId",
    "candidateManifestPath",
    "candidateManifestSha256",
    "runId",
    "requestId",
    "receiptId",
    "runtimeId",
    "plannedOutputDirectory",
  ]) &&
  isText(value.candidateId) &&
  isPinnedRelativePath(value.candidateManifestPath) &&
  typeof value.candidateManifestSha256 === "string" &&
  SHA256_HEX.test(value.candidateManifestSha256) &&
  isText(value.runId) &&
  isText(value.requestId) &&
  isText(value.receiptId) &&
  isText(value.runtimeId) &&
  isPinnedRelativePath(value.plannedOutputDirectory) &&
  value.receiptId ===
    nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest(
      value.runtimeId,
      value.requestId,
    );

const isFalsifier = (
  value: unknown,
): value is Nhm2PredictionFreezeFalsifierV1 => {
  if (!isRecord(value)) return false;
  return (
    hasOnlyKeys(value, [
      "falsifierId",
      "frozenModelId",
      "targetObservableIds",
      "trigger",
      "consequence",
    ]) &&
    isText(value.falsifierId) &&
    isText(value.frozenModelId) &&
    isObservableIdArray(value.targetObservableIds) &&
    value.targetObservableIds.length > 0 &&
    isText(value.trigger) &&
    isText(value.consequence)
  );
};

const containsAuthoritySpoof = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(containsAuthoritySpoof);
  if (!isRecord(value)) return false;
  const forbidden = new Set([
    "status",
    "pass",
    "ready",
    "readiness",
    "predictionFreezeReady",
    "physicalViabilityClaimAllowed",
    "transportClaimAllowed",
    "propulsionClaimAllowed",
    "routeEtaClaimAllowed",
    "speedAuthorityClaimAllowed",
  ]);
  return Object.entries(value).some(
    ([key, entry]) => forbidden.has(key) || containsAuthoritySpoof(entry),
  );
};

const sameReadiness = (
  left: Nhm2PredictionFalsifierFreezeV1["readiness"],
  right: Nhm2PredictionFalsifierFreezeV1["readiness"],
): boolean =>
  left.predictionFreezeReady === right.predictionFreezeReady &&
  left.blockerCount === right.blockerCount &&
  left.firstBlocker === right.firstBlocker &&
  left.blockers.length === right.blockers.length &&
  left.blockers.every((entry, index) => entry === right.blockers[index]);

export const isNhm2PredictionFalsifierFreeze = (
  value: unknown,
): value is Nhm2PredictionFalsifierFreezeV1 => {
  if (!isRecord(value)) return false;
  if (
    !hasOnlyKeys(value, [
      "artifactId",
      "contractVersion",
      "generatedAt",
      "frozenAt",
      "dataCollectionOpensAt",
      "laneId",
      "selectedProfileId",
      "freezeId",
      "semanticSha256",
      "registrationBinding",
      "roadmapBinding",
      "model",
      "parameterSet",
      "observables",
      "uncertaintyBudget",
      "nullControlPlan",
      "blindingPlan",
      "decisionPlan",
      "falsifierRegistry",
      "registrationReceipts",
      "analysisCode",
      "supersessionPolicy",
      "freezeManifestRef",
      "readiness",
      "claimBoundary",
    ])
  ) {
    return false;
  }
  if ("status" in value || "pass" in value || "ready" in value) return false;
  if (
    value.artifactId !== NHM2_PREDICTION_FALSIFIER_FREEZE_ARTIFACT_ID ||
    value.contractVersion !==
      NHM2_PREDICTION_FALSIFIER_FREEZE_CONTRACT_VERSION ||
    !isText(value.generatedAt) ||
    !isText(value.frozenAt) ||
    !isText(value.dataCollectionOpensAt) ||
    value.laneId !== "nhm2_shift_lapse" ||
    !isText(value.selectedProfileId) ||
    !isText(value.freezeId) ||
    typeof value.semanticSha256 !== "string" ||
    !SHA256_HEX.test(value.semanticSha256) ||
    !isCandidateRegistrationBinding(value.registrationBinding)
  ) {
    return false;
  }

  const roadmap = isRecord(value.roadmapBinding) ? value.roadmapBinding : null;
  if (
    roadmap == null ||
    !hasOnlyKeys(roadmap, [
      "contractVersion",
      "stageId",
      "requiredObservableIds",
      "requiredReceiptIds",
      "requiredFalsifierIds",
    ]) ||
    roadmap.contractVersion !==
      NHM2_EXPERIMENT_FACING_THEORY_ROADMAP_CONTRACT_VERSION ||
    roadmap.stageId !== "prediction_freeze" ||
    !Array.isArray(roadmap.requiredObservableIds) ||
    !roadmap.requiredObservableIds.every(isObservableId) ||
    !sameStringSet(
      roadmap.requiredObservableIds as string[],
      NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS,
    ) ||
    !Array.isArray(roadmap.requiredReceiptIds) ||
    !roadmap.requiredReceiptIds.every(isText) ||
    !sameStringSet(
      roadmap.requiredReceiptIds as string[],
      NHM2_PREDICTION_FREEZE_REQUIRED_RECEIPT_IDS,
    ) ||
    !Array.isArray(roadmap.requiredFalsifierIds) ||
    !roadmap.requiredFalsifierIds.every(isText) ||
    !sameStringSet(
      roadmap.requiredFalsifierIds as string[],
      NHM2_PREDICTION_FREEZE_REQUIRED_FALSIFIER_IDS,
    )
  ) {
    return false;
  }

  const model = isRecord(value.model) ? value.model : null;
  const parameterSet = isRecord(value.parameterSet) ? value.parameterSet : null;
  const uncertainty = isRecord(value.uncertaintyBudget)
    ? value.uncertaintyBudget
    : null;
  const nullPlan = isRecord(value.nullControlPlan)
    ? value.nullControlPlan
    : null;
  const blinding = isRecord(value.blindingPlan) ? value.blindingPlan : null;
  const decision = isRecord(value.decisionPlan) ? value.decisionPlan : null;
  const falsifiers = isRecord(value.falsifierRegistry)
    ? value.falsifierRegistry
    : null;
  const registrationReceipts = value.registrationReceipts;
  const analysis = isRecord(value.analysisCode) ? value.analysisCode : null;
  const supersession = isRecord(value.supersessionPolicy)
    ? value.supersessionPolicy
    : null;

  if (
    model == null ||
    !hasOnlyKeys(model, [
      "modelId",
      "modelVersion",
      "solverId",
      "solverVersion",
      "sourceCommitSha",
      "definitionRef",
      "inputManifestRef",
    ]) ||
    !isText(model.modelId) ||
    !isText(model.modelVersion) ||
    !isText(model.solverId) ||
    !isText(model.solverVersion) ||
    !isText(model.sourceCommitSha) ||
    !isNullableHashedRefShape(model.definitionRef) ||
    !isNullableHashedRefShape(model.inputManifestRef) ||
    parameterSet == null ||
    !hasOnlyKeys(parameterSet, [
      "parameterSetId",
      "parameterCount",
      "manifestRef",
    ]) ||
    !isText(parameterSet.parameterSetId) ||
    !isFiniteNumber(parameterSet.parameterCount) ||
    parameterSet.parameterCount < 0 ||
    !isNullableHashedRefShape(parameterSet.manifestRef) ||
    !Array.isArray(value.observables) ||
    !value.observables.every(isObservable) ||
    uncertainty == null ||
    !hasOnlyKeys(uncertainty, [
      "uncertaintyBudgetId",
      "method",
      "coverageProbability",
      "sourceIds",
      "observableIds",
      "budgetRef",
      "covarianceRef",
    ]) ||
    !isText(uncertainty.uncertaintyBudgetId) ||
    !isText(uncertainty.method) ||
    !isFiniteNumber(uncertainty.coverageProbability) ||
    !Array.isArray(uncertainty.sourceIds) ||
    !uncertainty.sourceIds.every(isText) ||
    !isObservableIdArray(uncertainty.observableIds) ||
    !isNullableHashedRefShape(uncertainty.budgetRef) ||
    !isNullableHashedRefShape(uncertainty.covarianceRef) ||
    nullPlan == null ||
    !hasOnlyKeys(nullPlan, ["controls", "planRef"]) ||
    !Array.isArray(nullPlan.controls) ||
    !nullPlan.controls.every(isNullControl) ||
    !isNullableHashedRefShape(nullPlan.planRef) ||
    blinding == null ||
    !hasOnlyKeys(blinding, [
      "blindedFieldIds",
      "unblindingTrigger",
      "keyCustodianRole",
      "analysisRole",
      "experimentRole",
      "planRef",
    ]) ||
    !Array.isArray(blinding.blindedFieldIds) ||
    !blinding.blindedFieldIds.every(isText) ||
    !isText(blinding.unblindingTrigger) ||
    !isText(blinding.keyCustodianRole) ||
    !isText(blinding.analysisRole) ||
    !isText(blinding.experimentRole) ||
    !isNullableHashedRefShape(blinding.planRef) ||
    decision == null ||
    !hasOnlyKeys(decision, [
      "multiplicityMethod",
      "familywiseAlpha",
      "rules",
      "planRef",
    ]) ||
    !isText(decision.multiplicityMethod) ||
    !isFiniteNumber(decision.familywiseAlpha) ||
    !Array.isArray(decision.rules) ||
    !decision.rules.every(isDecisionRule) ||
    !isNullableHashedRefShape(decision.planRef) ||
    falsifiers == null ||
    !hasOnlyKeys(falsifiers, ["falsifiers", "registryRef"]) ||
    !Array.isArray(falsifiers.falsifiers) ||
    !falsifiers.falsifiers.every(isFalsifier) ||
    !isNullableHashedRefShape(falsifiers.registryRef) ||
    !Array.isArray(registrationReceipts) ||
    !registrationReceipts.every(isRegistrationReceipt) ||
    analysis == null ||
    !hasOnlyKeys(analysis, [
      "repository",
      "sourceCommitSha",
      "entrypoint",
      "deterministicSeedPolicy",
      "sourceTreeRef",
      "dependencyLockRef",
      "environmentRef",
      "protocolRef",
    ]) ||
    !isText(analysis.repository) ||
    !isText(analysis.sourceCommitSha) ||
    !isText(analysis.entrypoint) ||
    !isText(analysis.deterministicSeedPolicy) ||
    !isNullableHashedRefShape(analysis.sourceTreeRef) ||
    !isNullableHashedRefShape(analysis.dependencyLockRef) ||
    !isNullableHashedRefShape(analysis.environmentRef) ||
    !isNullableHashedRefShape(analysis.protocolRef) ||
    supersession == null ||
    !hasOnlyKeys(supersession, [
      "policyId",
      "policyRef",
      "originalFreezeImmutable",
      "supersedingFreezeRequiresNewFreezeId",
      "postDataChangesExploratoryOnly",
    ]) ||
    !isText(supersession.policyId) ||
    !isNullableHashedRefShape(supersession.policyRef) ||
    supersession.originalFreezeImmutable !== true ||
    supersession.supersedingFreezeRequiresNewFreezeId !== true ||
    supersession.postDataChangesExploratoryOnly !== true ||
    !isNullableHashedRefShape(value.freezeManifestRef)
  ) {
    return false;
  }

  if (
    containsAuthoritySpoof(value.registrationBinding) ||
    containsAuthoritySpoof(model) ||
    containsAuthoritySpoof(parameterSet) ||
    containsAuthoritySpoof(value.observables) ||
    containsAuthoritySpoof(uncertainty) ||
    containsAuthoritySpoof(nullPlan) ||
    containsAuthoritySpoof(blinding) ||
    containsAuthoritySpoof(decision) ||
    containsAuthoritySpoof(falsifiers) ||
    containsAuthoritySpoof(registrationReceipts) ||
    containsAuthoritySpoof(analysis) ||
    containsAuthoritySpoof(supersession)
  ) {
    return false;
  }

  const readiness = isRecord(value.readiness) ? value.readiness : null;
  const claimBoundary = isRecord(value.claimBoundary)
    ? value.claimBoundary
    : null;
  if (
    readiness == null ||
    !hasOnlyKeys(readiness, [
      "predictionFreezeReady",
      "blockerCount",
      "firstBlocker",
      "blockers",
    ]) ||
    typeof readiness.predictionFreezeReady !== "boolean" ||
    !isFiniteNumber(readiness.blockerCount) ||
    !isText(readiness.firstBlocker) ||
    !Array.isArray(readiness.blockers) ||
    !readiness.blockers.every((entry) => typeof entry === "string") ||
    claimBoundary == null ||
    !hasOnlyKeys(claimBoundary, [
      "diagnosticOnly",
      "predictionFreezeOnly",
      "predictionFreezeCannotAloneEstablishTheoryClosure",
      "predictionFreezeCannotSubstituteForExperimentalEvidence",
      "physicalViabilityClaimAllowed",
      "transportClaimAllowed",
      "propulsionClaimAllowed",
      "routeEtaClaimAllowed",
      "speedAuthorityClaimAllowed",
    ]) ||
    claimBoundary.diagnosticOnly !== true ||
    claimBoundary.predictionFreezeOnly !== true ||
    claimBoundary.predictionFreezeCannotAloneEstablishTheoryClosure !== true ||
    claimBoundary.predictionFreezeCannotSubstituteForExperimentalEvidence !==
      true ||
    claimBoundary.physicalViabilityClaimAllowed !== false ||
    claimBoundary.transportClaimAllowed !== false ||
    claimBoundary.propulsionClaimAllowed !== false ||
    claimBoundary.routeEtaClaimAllowed !== false ||
    claimBoundary.speedAuthorityClaimAllowed !== false
  ) {
    return false;
  }

  const core = { ...value } as Record<string, unknown>;
  delete core.readiness;
  delete core.claimBoundary;
  const typedArtifact = value as unknown as Nhm2PredictionFalsifierFreezeV1;
  if (
    typedArtifact.semanticSha256 !==
    computeNhm2PredictionFreezeScientificSemanticSha256(
      toNhm2PredictionFreezeScientificPayload(typedArtifact),
    )
  ) {
    return false;
  }
  const expected = deriveReadiness(
    core as Omit<
      Nhm2PredictionFalsifierFreezeV1,
      "readiness" | "claimBoundary"
    >,
  );
  return sameReadiness(
    readiness as Nhm2PredictionFalsifierFreezeV1["readiness"],
    expected,
  );
};
