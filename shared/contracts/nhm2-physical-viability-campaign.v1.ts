import type { Nhm2TimeDependentSourceCampaignArtifactV1 } from "./nhm2-time-dependent-source-campaign.v1";

export const NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT_VERSION =
  "nhm2_physical_viability_campaign/v1";

export const NHM2_PHYSICAL_VIABILITY_STAGE_IDS = [
  "stage0_prediction_freeze",
  "stage1_tile_metrology",
  "stage2_array_scaling",
  "stage3_vacuum_weight",
  "stage4_metric_response",
  "stage5_bounded_physical_prototype",
  "stage6_transport_precursor",
] as const;

export const NHM2_PHYSICAL_VIABILITY_STAGE_STATUSES = [
  "unattempted",
  "planned",
  "engineering",
  "commissioned",
  "null",
  "positive_unreplicated",
  "replicated",
  "falsified",
] as const;

export type Nhm2PhysicalViabilityStageId =
  (typeof NHM2_PHYSICAL_VIABILITY_STAGE_IDS)[number];
export type Nhm2PhysicalViabilityStageStatus =
  (typeof NHM2_PHYSICAL_VIABILITY_STAGE_STATUSES)[number];

export type Nhm2PhysicalViabilityStageV1 = {
  stageId: Nhm2PhysicalViabilityStageId;
  title: string;
  status: Nhm2PhysicalViabilityStageStatus;
  artifactRefs: string[];
  requiredForPhysicalViability: boolean;
  requiredForTransport: boolean;
  blockers: string[];
  warnings: string[];
};

export type Nhm2PhysicalViabilityCampaignArtifactRefsV1 = {
  diagnosticCampaign: string | null;
  leanCampaignCertificate: string | null;
  profileFrontier: string | null;
  predictionFreeze: string | null;
  tileMetrologyReceipt: string | null;
  tileCycleEnergyBalance: string | null;
  arrayScalingReceipt: string | null;
  fullApparatusTensor: string | null;
  vacuumWeightReceipt: string | null;
  metricResponseReceipt: string | null;
  boundedPrototypeReceipt: string | null;
  transportPrecursorReceipt: string | null;
  independentReplicationReceipt: string | null;
};

export type Nhm2PhysicalViabilityCampaignV1 = {
  contractVersion: typeof NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  diagnosticCampaignRef: string | null;
  diagnosticCampaignHash: string | null;
  leanCertificateRef: string | null;
  artifactRefs: Nhm2PhysicalViabilityCampaignArtifactRefsV1;
  diagnosticCampaign: {
    campaignPass: boolean | null;
    diagnosticAdmissionOnly: true;
    cannotSubstituteForPhysicalEvidence: true;
  };
  predictionFreeze: {
    deltaTmunuPredicted: boolean;
    observablesPredicted: boolean;
    falsifiersFrozenBeforeData: boolean;
    uncertaintyBudgetPresent: boolean;
  };
  tileMetrology: {
    forceGapCurveMeasured: boolean;
    dielectricResponseMeasured: boolean;
    roughnessMeasured: boolean;
    patchPotentialMapped: boolean;
    energyCycleClosed: boolean;
  };
  arrayScaling: {
    scalingLawMeasured: boolean;
    crossCouplingBounded: boolean;
    heatElasticStressBounded: boolean;
    fullApparatusTensorAvailable: boolean;
  };
  vacuumWeight: {
    deltaEMeasured: boolean;
    deltaFMeasured: boolean;
    phaseAndSignMatch: boolean;
    dummyRejected: boolean;
    independentlyReplicated: boolean;
  };
  metricResponse: {
    opticalPhaseMeasured: boolean;
    clockOrAtomResponseMeasured: boolean;
    mechanicalFreeMassResponseMeasured: boolean;
    invariantMetricModelFit: boolean;
    nonMetricSystematicsBounded: boolean;
  };
  boundedPrototype: {
    measuredTmunuToMeasuredGeometryAgreement: boolean;
    covariantConservationMeasured: boolean;
    qeiAndObserverReceiptsRemainPass: boolean;
    stabilityReceiptsRemainPass: boolean;
    independentLabReplication: boolean;
  };
  transportPrecursor: {
    neutralTestBodyResponseMeasured: boolean;
    clockOrAtomWorldlineResponseMeasured: boolean;
    compositionIndependenceChecked: boolean;
    recoilMomentumAccounted: boolean;
    reversibleControllableResponse: boolean;
  };
  stages: Nhm2PhysicalViabilityStageV1[];
  summary: {
    physicalEvidenceCampaignPass: boolean;
    transportPrecursorPass: boolean;
    firstBlocker: string;
    blockerCount: number;
    replicatedStageCount: number;
    falsifiedStageIds: Nhm2PhysicalViabilityStageId[];
  };
  claimBoundary: {
    diagnosticOnly: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    routeEtaClaimAllowed: false;
    propulsionClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
    diagnosticCampaignCannotSubstituteForExperimentalReceipts: true;
    leanCertificateCannotSubstituteForExperimentalReceipts: true;
  };
};

export type BuildNhm2PhysicalViabilityCampaignInput = {
  generatedAt?: string | null;
  selectedProfileId?: string | null;
  diagnosticCampaignRef?: string | null;
  diagnosticCampaignHash?: string | null;
  leanCertificateRef?: string | null;
  artifactRefs?: Partial<Nhm2PhysicalViabilityCampaignArtifactRefsV1> | null;
  diagnosticCampaign?: Nhm2TimeDependentSourceCampaignArtifactV1 | null;
  stageStatuses?: Partial<Record<Nhm2PhysicalViabilityStageId, Nhm2PhysicalViabilityStageStatus>> | null;
  predictionFreeze?: Partial<Nhm2PhysicalViabilityCampaignV1["predictionFreeze"]> | null;
  tileMetrology?: Partial<Nhm2PhysicalViabilityCampaignV1["tileMetrology"]> | null;
  arrayScaling?: Partial<Nhm2PhysicalViabilityCampaignV1["arrayScaling"]> | null;
  vacuumWeight?: Partial<Nhm2PhysicalViabilityCampaignV1["vacuumWeight"]> | null;
  metricResponse?: Partial<Nhm2PhysicalViabilityCampaignV1["metricResponse"]> | null;
  boundedPrototype?: Partial<Nhm2PhysicalViabilityCampaignV1["boundedPrototype"]> | null;
  transportPrecursor?: Partial<Nhm2PhysicalViabilityCampaignV1["transportPrecursor"]> | null;
};

const DEFAULT_PROFILE_ID =
  "stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1";

const emptyRefs = (): Nhm2PhysicalViabilityCampaignArtifactRefsV1 => ({
  diagnosticCampaign: null,
  leanCampaignCertificate: null,
  profileFrontier: null,
  predictionFreeze: null,
  tileMetrologyReceipt: null,
  tileCycleEnergyBalance: null,
  arrayScalingReceipt: null,
  fullApparatusTensor: null,
  vacuumWeightReceipt: null,
  metricResponseReceipt: null,
  boundedPrototypeReceipt: null,
  transportPrecursorReceipt: null,
  independentReplicationReceipt: null,
});

const defaultPredictionFreeze = (): Nhm2PhysicalViabilityCampaignV1["predictionFreeze"] => ({
  deltaTmunuPredicted: false,
  observablesPredicted: false,
  falsifiersFrozenBeforeData: false,
  uncertaintyBudgetPresent: false,
});

const defaultTileMetrology = (): Nhm2PhysicalViabilityCampaignV1["tileMetrology"] => ({
  forceGapCurveMeasured: false,
  dielectricResponseMeasured: false,
  roughnessMeasured: false,
  patchPotentialMapped: false,
  energyCycleClosed: false,
});

const defaultArrayScaling = (): Nhm2PhysicalViabilityCampaignV1["arrayScaling"] => ({
  scalingLawMeasured: false,
  crossCouplingBounded: false,
  heatElasticStressBounded: false,
  fullApparatusTensorAvailable: false,
});

const defaultVacuumWeight = (): Nhm2PhysicalViabilityCampaignV1["vacuumWeight"] => ({
  deltaEMeasured: false,
  deltaFMeasured: false,
  phaseAndSignMatch: false,
  dummyRejected: false,
  independentlyReplicated: false,
});

const defaultMetricResponse = (): Nhm2PhysicalViabilityCampaignV1["metricResponse"] => ({
  opticalPhaseMeasured: false,
  clockOrAtomResponseMeasured: false,
  mechanicalFreeMassResponseMeasured: false,
  invariantMetricModelFit: false,
  nonMetricSystematicsBounded: false,
});

const defaultBoundedPrototype = (): Nhm2PhysicalViabilityCampaignV1["boundedPrototype"] => ({
  measuredTmunuToMeasuredGeometryAgreement: false,
  covariantConservationMeasured: false,
  qeiAndObserverReceiptsRemainPass: false,
  stabilityReceiptsRemainPass: false,
  independentLabReplication: false,
});

const defaultTransportPrecursor = (): Nhm2PhysicalViabilityCampaignV1["transportPrecursor"] => ({
  neutralTestBodyResponseMeasured: false,
  clockOrAtomWorldlineResponseMeasured: false,
  compositionIndependenceChecked: false,
  recoilMomentumAccounted: false,
  reversibleControllableResponse: false,
});

const stageTitle = (stageId: Nhm2PhysicalViabilityStageId): string => {
  switch (stageId) {
    case "stage0_prediction_freeze":
      return "Prediction Freeze";
    case "stage1_tile_metrology":
      return "Tile Metrology";
    case "stage2_array_scaling":
      return "Array Scaling";
    case "stage3_vacuum_weight":
      return "Vacuum Weight";
    case "stage4_metric_response":
      return "Metric Response";
    case "stage5_bounded_physical_prototype":
      return "Bounded Physical Prototype";
    case "stage6_transport_precursor":
      return "Transport Precursor";
  }
};

const stageBlocker = (stageId: Nhm2PhysicalViabilityStageId): string => {
  switch (stageId) {
    case "stage0_prediction_freeze":
      return "prediction_freeze_missing";
    case "stage1_tile_metrology":
      return "tile_metrology_receipt_missing";
    case "stage2_array_scaling":
      return "array_scaling_receipt_missing";
    case "stage3_vacuum_weight":
      return "vacuum_weight_receipt_missing";
    case "stage4_metric_response":
      return "metric_response_receipt_missing";
    case "stage5_bounded_physical_prototype":
      return "bounded_physical_prototype_receipt_missing";
    case "stage6_transport_precursor":
      return "transport_precursor_receipt_missing";
  }
};

const isStageComplete = (status: Nhm2PhysicalViabilityStageStatus): boolean =>
  status === "replicated";

const isPhysicalStage = (stageId: Nhm2PhysicalViabilityStageId): boolean =>
  stageId !== "stage6_transport_precursor";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";
const isStringOrNull = (value: unknown): value is string | null =>
  value === null || (typeof value === "string" && value.trim().length > 0);

const isStageStatus = (value: unknown): value is Nhm2PhysicalViabilityStageStatus =>
  typeof value === "string" &&
  (NHM2_PHYSICAL_VIABILITY_STAGE_STATUSES as readonly string[]).includes(value);

const buildStage = (
  stageId: Nhm2PhysicalViabilityStageId,
  status: Nhm2PhysicalViabilityStageStatus,
  artifactRefs: string[],
): Nhm2PhysicalViabilityStageV1 => ({
  stageId,
  title: stageTitle(stageId),
  status,
  artifactRefs,
  requiredForPhysicalViability: isPhysicalStage(stageId),
  requiredForTransport: true,
  blockers: isStageComplete(status) ? [] : [stageBlocker(stageId)],
  warnings:
    status === "positive_unreplicated"
      ? ["positive_result_requires_independent_replication"]
      : status === "null"
        ? ["null_result_must_be_mapped_to_falsified_model_or_bound"]
        : [],
});

export const buildNhm2PhysicalViabilityCampaign = (
  input: BuildNhm2PhysicalViabilityCampaignInput = {},
): Nhm2PhysicalViabilityCampaignV1 => {
  const refs = { ...emptyRefs(), ...(input.artifactRefs ?? {}) };
  refs.diagnosticCampaign = input.diagnosticCampaignRef ?? refs.diagnosticCampaign;
  refs.leanCampaignCertificate = input.leanCertificateRef ?? refs.leanCampaignCertificate;

  const stages = NHM2_PHYSICAL_VIABILITY_STAGE_IDS.map((stageId) =>
    buildStage(stageId, input.stageStatuses?.[stageId] ?? "unattempted", []),
  );
  const blockers = stages.flatMap((stage) => stage.blockers);
  const physicalEvidenceCampaignPass = stages
    .filter((stage) => stage.requiredForPhysicalViability)
    .every((stage) => isStageComplete(stage.status));
  const transportPrecursorPass = stages.every((stage) => isStageComplete(stage.status));
  const falsifiedStageIds = stages
    .filter((stage) => stage.status === "falsified")
    .map((stage) => stage.stageId);

  return {
    contractVersion: NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId:
      input.selectedProfileId ??
      input.diagnosticCampaign?.selectedProfileId ??
      DEFAULT_PROFILE_ID,
    diagnosticCampaignRef: input.diagnosticCampaignRef ?? refs.diagnosticCampaign,
    diagnosticCampaignHash: input.diagnosticCampaignHash ?? null,
    leanCertificateRef: input.leanCertificateRef ?? refs.leanCampaignCertificate,
    artifactRefs: refs,
    diagnosticCampaign: {
      campaignPass: input.diagnosticCampaign?.summary.campaignPass ?? null,
      diagnosticAdmissionOnly: true,
      cannotSubstituteForPhysicalEvidence: true,
    },
    predictionFreeze: { ...defaultPredictionFreeze(), ...(input.predictionFreeze ?? {}) },
    tileMetrology: { ...defaultTileMetrology(), ...(input.tileMetrology ?? {}) },
    arrayScaling: { ...defaultArrayScaling(), ...(input.arrayScaling ?? {}) },
    vacuumWeight: { ...defaultVacuumWeight(), ...(input.vacuumWeight ?? {}) },
    metricResponse: { ...defaultMetricResponse(), ...(input.metricResponse ?? {}) },
    boundedPrototype: { ...defaultBoundedPrototype(), ...(input.boundedPrototype ?? {}) },
    transportPrecursor: { ...defaultTransportPrecursor(), ...(input.transportPrecursor ?? {}) },
    stages,
    summary: {
      physicalEvidenceCampaignPass,
      transportPrecursorPass,
      firstBlocker: blockers[0] ?? "none",
      blockerCount: blockers.length,
      replicatedStageCount: stages.filter((stage) => isStageComplete(stage.status)).length,
      falsifiedStageIds,
    },
    claimBoundary: {
      diagnosticOnly: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      routeEtaClaimAllowed: false,
      propulsionClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
      diagnosticCampaignCannotSubstituteForExperimentalReceipts: true,
      leanCertificateCannotSubstituteForExperimentalReceipts: true,
    },
  };
};

const hasBooleanFields = (
  value: unknown,
  keys: readonly string[],
): value is Record<string, boolean> =>
  isRecord(value) && keys.every((key) => isBoolean(value[key]));

export const isNhm2PhysicalViabilityCampaign = (
  value: unknown,
): value is Nhm2PhysicalViabilityCampaignV1 => {
  if (!isRecord(value)) return false;
  const stages = Array.isArray(value.stages) ? value.stages : null;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  const diagnosticCampaign = isRecord(value.diagnosticCampaign) ? value.diagnosticCampaign : null;
  return (
    value.contractVersion === NHM2_PHYSICAL_VIABILITY_CAMPAIGN_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    isStringOrNull(value.diagnosticCampaignRef) &&
    isStringOrNull(value.diagnosticCampaignHash) &&
    isStringOrNull(value.leanCertificateRef) &&
    diagnosticCampaign != null &&
    (diagnosticCampaign.campaignPass === null || isBoolean(diagnosticCampaign.campaignPass)) &&
    diagnosticCampaign.diagnosticAdmissionOnly === true &&
    diagnosticCampaign.cannotSubstituteForPhysicalEvidence === true &&
    hasBooleanFields(value.predictionFreeze, [
      "deltaTmunuPredicted",
      "observablesPredicted",
      "falsifiersFrozenBeforeData",
      "uncertaintyBudgetPresent",
    ]) &&
    hasBooleanFields(value.tileMetrology, [
      "forceGapCurveMeasured",
      "dielectricResponseMeasured",
      "roughnessMeasured",
      "patchPotentialMapped",
      "energyCycleClosed",
    ]) &&
    hasBooleanFields(value.arrayScaling, [
      "scalingLawMeasured",
      "crossCouplingBounded",
      "heatElasticStressBounded",
      "fullApparatusTensorAvailable",
    ]) &&
    hasBooleanFields(value.vacuumWeight, [
      "deltaEMeasured",
      "deltaFMeasured",
      "phaseAndSignMatch",
      "dummyRejected",
      "independentlyReplicated",
    ]) &&
    hasBooleanFields(value.metricResponse, [
      "opticalPhaseMeasured",
      "clockOrAtomResponseMeasured",
      "mechanicalFreeMassResponseMeasured",
      "invariantMetricModelFit",
      "nonMetricSystematicsBounded",
    ]) &&
    hasBooleanFields(value.boundedPrototype, [
      "measuredTmunuToMeasuredGeometryAgreement",
      "covariantConservationMeasured",
      "qeiAndObserverReceiptsRemainPass",
      "stabilityReceiptsRemainPass",
      "independentLabReplication",
    ]) &&
    hasBooleanFields(value.transportPrecursor, [
      "neutralTestBodyResponseMeasured",
      "clockOrAtomWorldlineResponseMeasured",
      "compositionIndependenceChecked",
      "recoilMomentumAccounted",
      "reversibleControllableResponse",
    ]) &&
    stages != null &&
    stages.length === NHM2_PHYSICAL_VIABILITY_STAGE_IDS.length &&
    stages.every(
      (stage) =>
        isRecord(stage) &&
        typeof stage.stageId === "string" &&
        (NHM2_PHYSICAL_VIABILITY_STAGE_IDS as readonly string[]).includes(stage.stageId) &&
        typeof stage.title === "string" &&
        isStageStatus(stage.status) &&
        Array.isArray(stage.artifactRefs) &&
        stage.artifactRefs.every((entry) => typeof entry === "string") &&
        isBoolean(stage.requiredForPhysicalViability) &&
        isBoolean(stage.requiredForTransport) &&
        Array.isArray(stage.blockers) &&
        stage.blockers.every((entry) => typeof entry === "string") &&
        Array.isArray(stage.warnings) &&
        stage.warnings.every((entry) => typeof entry === "string"),
    ) &&
    summary != null &&
    isBoolean(summary.physicalEvidenceCampaignPass) &&
    isBoolean(summary.transportPrecursorPass) &&
    typeof summary.firstBlocker === "string" &&
    typeof summary.blockerCount === "number" &&
    typeof summary.replicatedStageCount === "number" &&
    Array.isArray(summary.falsifiedStageIds) &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.routeEtaClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false &&
    boundary.speedAuthorityClaimAllowed === false &&
    boundary.diagnosticCampaignCannotSubstituteForExperimentalReceipts === true &&
    boundary.leanCertificateCannotSubstituteForExperimentalReceipts === true
  );
};
