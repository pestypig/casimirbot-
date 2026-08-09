import {
  NHM2_SEMICLASSICAL_DIAGNOSTIC_COVERAGE_POLICY,
  NHM2_SEMICLASSICAL_TENSOR_COMPONENTS,
  buildNhm2SemiclassicalStateRealizability,
  type BuildNhm2SemiclassicalStateRealizabilityInput,
  type Nhm2SemiclassicalArtifactIdentityV1,
  type Nhm2SemiclassicalNumericalArtifactV1,
  type Nhm2SemiclassicalRealizabilityGateId,
  type Nhm2SemiclassicalRenormalizationScheme,
  type Nhm2SemiclassicalStateIdentityV1,
  type Nhm2SemiclassicalStateRealizabilityV1,
} from "./nhm2-semiclassical-state-realizability.v1";

export const NHM2_SEMICLASSICAL_STATE_REALIZABILITY_V2_CONTRACT_VERSION =
  "nhm2_semiclassical_state_realizability/v2" as const;

export const NHM2_SEMICLASSICAL_STATE_REALIZABILITY_V2_GATE_IDS = [
  "stress_fluctuation_noise_kernel",
  "constraint_formulation_consistency",
] as const;

export const NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS = [
  "H_H",
  "H_Hi",
  "Hi_Hj",
] as const;

export const NHM2_SEMICLASSICAL_CONSTRAINT_COMPONENT_ORDER = [
  "hamiltonian",
  "momentum_x",
  "momentum_y",
  "momentum_z",
] as const;

export const NHM2_SEMICLASSICAL_FLUCTUATION_RATIO_FORMULA =
  "sqrt_max_bilocal_noise_eigenvalue_upper95_over_max_smeared_mean_rset_frobenius_floor" as const;

export const NHM2_SEMICLASSICAL_MEAN_NORMALIZATION_METHOD =
  "frozen_sampling_basis_smeared_rset_frobenius_with_positive_floor" as const;

export const NHM2_SEMICLASSICAL_NOISE_KERNEL_EXCHANGE_SYMMETRY =
  "N_abcd(x,y)=N_cdab(y,x)" as const;

export const NHM2_SEMICLASSICAL_CONSTRAINT_NORMALIZATION_SCALE_UNIT =
  "constraint_density_SI" as const;

/**
 * The rank-four bitensor's ten symmetric components at each point are stored
 * as a rank-three sample x sample x 100 ordered-component-pair array. Keeping
 * the uncompressed pair order explicit prevents a producer from silently
 * changing pair symmetries or dropping covariance channels.
 */
export const NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER =
  NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.flatMap((left) =>
    NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.map((right) => `${left}:${right}`),
  );

export type Nhm2SemiclassicalStateRealizabilityV2GateId =
  | Nhm2SemiclassicalRealizabilityGateId
  | (typeof NHM2_SEMICLASSICAL_STATE_REALIZABILITY_V2_GATE_IDS)[number];
export type Nhm2SemiclassicalConstraintBracketId =
  (typeof NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS)[number];
export type Nhm2SemiclassicalStateRealizabilityV2Status =
  "pass" | "blocked" | "fail";

export type Nhm2SemiclassicalStressFluctuationsV2 =
  Nhm2SemiclassicalStateIdentityV1 & {
    renormalizationScheme: Nhm2SemiclassicalRenormalizationScheme;
    renormalizationPrescription: Nhm2SemiclassicalArtifactIdentityV1;
    renormalizationCounterterms: Nhm2SemiclassicalArtifactIdentityV1;
    finiteRenormalization: Nhm2SemiclassicalArtifactIdentityV1;
    sourceKind: "connected_symmetrized_stress_noise_kernel" | null;
    operatorOrdering: "symmetrized_anticommutator" | null;
    connected: boolean | null;
    symmetrized: boolean | null;
    smeared: boolean | null;
    smearingFunction: Nhm2SemiclassicalArtifactIdentityV1;
    samplingBasisId: string | null;
    samplingBasis: Nhm2SemiclassicalArtifactIdentityV1;
    samplingBasisFrozenBeforeExecution: boolean | null;
    samplingWindow: {
      definition: Nhm2SemiclassicalArtifactIdentityV1;
      shape: string | null;
      spatialSupportRadiusM: number | null;
      temporalSupportSeconds: number | null;
    };
    noiseKernel: Nhm2SemiclassicalNumericalArtifactV1;
    sampleCount: number | null;
    allSamplesFinite: boolean | null;
    psdAnalysis: Nhm2SemiclassicalArtifactIdentityV1;
    covariancePositiveSemidefinite: boolean | null;
    minimumEigenvalueSI: number | null;
    psdToleranceSI: number | null;
    pointComponentExchangeSymmetry:
      typeof NHM2_SEMICLASSICAL_NOISE_KERNEL_EXCHANGE_SYMMETRY | null;
    pointComponentExchangeSymmetryVerified: boolean | null;
    pointComponentExchangeSymmetryEvidence: Nhm2SemiclassicalArtifactIdentityV1;
    pointComponentExchangeResidualUpper95: number | null;
    pointComponentExchangeTolerance: number | null;
    semiclassicalityCriterion: Nhm2SemiclassicalArtifactIdentityV1;
    meanStressTensor: Nhm2SemiclassicalArtifactIdentityV1;
    fluctuationRatioFormula:
      typeof NHM2_SEMICLASSICAL_FLUCTUATION_RATIO_FORMULA | null;
    meanNormalizationMethodId:
      typeof NHM2_SEMICLASSICAL_MEAN_NORMALIZATION_METHOD | null;
    meanNormalizationScaleSI: number | null;
    meanNormalizationFloorSI: number | null;
    fluctuationToMeanRatioUpper95: number | null;
    fluctuationToMeanRatioTolerance: number | null;
    uncertaintyBudget: Nhm2SemiclassicalArtifactIdentityV1;
    metricResponseEvidence: Nhm2SemiclassicalArtifactIdentityV1;
    stabilityEvidence: Nhm2SemiclassicalArtifactIdentityV1;
    proxySubstitutionUsed: boolean | null;
    booleanOnlyAssertion: boolean | null;
  };

export type Nhm2SemiclassicalConstraintConsistencyV2 =
  Nhm2SemiclassicalStateIdentityV1 & {
    renormalizationScheme: Nhm2SemiclassicalRenormalizationScheme;
    renormalizationPrescription: Nhm2SemiclassicalArtifactIdentityV1;
    renormalizationCounterterms: Nhm2SemiclassicalArtifactIdentityV1;
    finiteRenormalization: Nhm2SemiclassicalArtifactIdentityV1;
    formulationId: string | null;
    formulation: Nhm2SemiclassicalArtifactIdentityV1;
    regulatorId: string | null;
    regulator: Nhm2SemiclassicalArtifactIdentityV1;
    operatorOrderingId: string | null;
    operatorOrdering: Nhm2SemiclassicalArtifactIdentityV1;
    constraintsSmeared: boolean | null;
    smearingFunctions: Nhm2SemiclassicalArtifactIdentityV1;
    bracketResiduals: Array<{
      bracketId: Nhm2SemiclassicalConstraintBracketId | null;
      computedBracket: Nhm2SemiclassicalNumericalArtifactV1;
      classicalStructureFunctionTarget: Nhm2SemiclassicalNumericalArtifactV1;
      residual: Nhm2SemiclassicalNumericalArtifactV1;
      normalizationDefinition: Nhm2SemiclassicalArtifactIdentityV1;
      normalizationMethodId: string | null;
      normalizationMethod: Nhm2SemiclassicalArtifactIdentityV1;
      normalizationScaleSI: number | null;
      normalizationScaleUnit:
        typeof NHM2_SEMICLASSICAL_CONSTRAINT_NORMALIZATION_SCALE_UNIT | null;
      sampleCount: number | null;
      allSamplesFinite: boolean | null;
      residualLInf: number | null;
      absoluteUncertainty95: number | null;
      tolerance: number | null;
    }>;
    classicalStructureFunctionsIncluded: boolean | null;
    anomalyDisposition:
      | "no_anomaly_within_frozen_tolerance"
      | "counterterms_included_and_replayed"
      | "anomaly_detected"
      | null;
    anomalyEvidence: Nhm2SemiclassicalArtifactIdentityV1;
    countertermEvidence: Nhm2SemiclassicalArtifactIdentityV1;
    refinementLevelCount: number | null;
    regulatorRemovalConverged: boolean | null;
    observedRegulatorRemovalConvergenceOrder: number | null;
    regulatorRemovalConvergenceEvidence: Nhm2SemiclassicalArtifactIdentityV1;
    antisymmetryResidual: Nhm2SemiclassicalConstraintIdentityResidualV2;
    jacobiIdentityResidual: Nhm2SemiclassicalConstraintIdentityResidualV2;
    maximumAlgebraResidualUpper95: number | null;
    algebraTolerance: number | null;
    uncertaintyBudget: Nhm2SemiclassicalArtifactIdentityV1;
    targetEchoUsedAsComputedBracket: boolean | null;
    proxySubstitutionUsed: boolean | null;
    booleanOnlyAssertion: boolean | null;
  };

export type Nhm2SemiclassicalConstraintIdentityResidualV2 = {
  definition: Nhm2SemiclassicalArtifactIdentityV1;
  residual: Nhm2SemiclassicalNumericalArtifactV1;
  sampleCount: number | null;
  allSamplesFinite: boolean | null;
  residualLInf: number | null;
  absoluteUncertainty95: number | null;
  tolerance: number | null;
};

type BasePrimitive = Omit<
  Nhm2SemiclassicalStateRealizabilityV1,
  | "contractVersion"
  | "gates"
  | "status"
  | "semiclassicalStateRealizabilityReady"
  | "blockers"
  | "claimBoundary"
>;

export type Nhm2SemiclassicalStateRealizabilityV2 = BasePrimitive & {
  contractVersion: typeof NHM2_SEMICLASSICAL_STATE_REALIZABILITY_V2_CONTRACT_VERSION;
  stressFluctuations: Nhm2SemiclassicalStressFluctuationsV2;
  constraintConsistency: Nhm2SemiclassicalConstraintConsistencyV2;
  gates: Array<{
    gateId: Nhm2SemiclassicalStateRealizabilityV2GateId;
    status: Nhm2SemiclassicalStateRealizabilityV2Status;
    blockers: string[];
  }>;
  status: Nhm2SemiclassicalStateRealizabilityV2Status;
  semiclassicalStateRealizabilityReady: boolean;
  blockers: string[];
  claimBoundary: Nhm2SemiclassicalStateRealizabilityV1["claimBoundary"];
};

type DeepPartial<T> =
  T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> | null }
      : T;

export type BuildNhm2SemiclassicalStateRealizabilityV2Input =
  BuildNhm2SemiclassicalStateRealizabilityInput & {
    stressFluctuations?: DeepPartial<Nhm2SemiclassicalStressFluctuationsV2> | null;
    constraintConsistency?: DeepPartial<Nhm2SemiclassicalConstraintConsistencyV2> | null;
  };

type GateDraft = {
  gateId: (typeof NHM2_SEMICLASSICAL_STATE_REALIZABILITY_V2_GATE_IDS)[number];
  missing: string[];
  failures: string[];
};

const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);
const recordOf = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};
const textValue = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
const finiteValue = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
const booleanValue = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const artifact = (value: unknown): Nhm2SemiclassicalArtifactIdentityV1 => {
  const record = recordOf(value);
  return { ref: textValue(record.ref), sha256: textValue(record.sha256) };
};

const numericalArtifact = (
  value: unknown,
): Nhm2SemiclassicalNumericalArtifactV1 => {
  const record = recordOf(value);
  return {
    ref: textValue(record.ref),
    sha256: textValue(record.sha256),
    dtype: record.dtype === "float64" ? "float64" : null,
    binaryEncoding:
      record.binaryEncoding === "raw_ieee754" ? "raw_ieee754" : null,
    endianness: record.endianness === "little" ? "little" : null,
    shape: Array.isArray(record.shape)
      ? record.shape.filter(
          (entry): entry is number =>
            typeof entry === "number" && Number.isFinite(entry),
        )
      : [],
    sizeBytes: finiteValue(record.sizeBytes),
    storageOrder:
      record.storageOrder === "row-major" ||
      record.storageOrder === "column-major"
        ? record.storageOrder
        : null,
    componentOrder: Array.isArray(record.componentOrder)
      ? record.componentOrder.filter(
          (entry): entry is string => typeof entry === "string",
        )
      : [],
    unit: textValue(record.unit),
  };
};

const normalizeScheme = (
  value: unknown,
): Nhm2SemiclassicalRenormalizationScheme =>
  value === "point_splitting" ||
  value === "hadamard_subtraction" ||
  value === "adiabatic_subtraction" ||
  value === "other_covariant"
    ? value
    : null;

const normalizeStressFluctuations = (
  value: unknown,
): Nhm2SemiclassicalStressFluctuationsV2 => {
  const record = recordOf(value);
  const window = recordOf(record.samplingWindow);
  return {
    stateId: textValue(record.stateId),
    stateSha256: textValue(record.stateSha256),
    renormalizationScheme: normalizeScheme(record.renormalizationScheme),
    renormalizationPrescription: artifact(record.renormalizationPrescription),
    renormalizationCounterterms: artifact(record.renormalizationCounterterms),
    finiteRenormalization: artifact(record.finiteRenormalization),
    sourceKind:
      record.sourceKind === "connected_symmetrized_stress_noise_kernel"
        ? record.sourceKind
        : null,
    operatorOrdering:
      record.operatorOrdering === "symmetrized_anticommutator"
        ? record.operatorOrdering
        : null,
    connected: booleanValue(record.connected),
    symmetrized: booleanValue(record.symmetrized),
    smeared: booleanValue(record.smeared),
    smearingFunction: artifact(record.smearingFunction),
    samplingBasisId: textValue(record.samplingBasisId),
    samplingBasis: artifact(record.samplingBasis),
    samplingBasisFrozenBeforeExecution: booleanValue(
      record.samplingBasisFrozenBeforeExecution,
    ),
    samplingWindow: {
      definition: artifact(window.definition),
      shape: textValue(window.shape),
      spatialSupportRadiusM: finiteValue(window.spatialSupportRadiusM),
      temporalSupportSeconds: finiteValue(window.temporalSupportSeconds),
    },
    noiseKernel: numericalArtifact(record.noiseKernel),
    sampleCount: finiteValue(record.sampleCount),
    allSamplesFinite: booleanValue(record.allSamplesFinite),
    psdAnalysis: artifact(record.psdAnalysis),
    covariancePositiveSemidefinite: booleanValue(
      record.covariancePositiveSemidefinite,
    ),
    minimumEigenvalueSI: finiteValue(record.minimumEigenvalueSI),
    psdToleranceSI: finiteValue(record.psdToleranceSI),
    pointComponentExchangeSymmetry:
      record.pointComponentExchangeSymmetry ===
      NHM2_SEMICLASSICAL_NOISE_KERNEL_EXCHANGE_SYMMETRY
        ? record.pointComponentExchangeSymmetry
        : null,
    pointComponentExchangeSymmetryVerified: booleanValue(
      record.pointComponentExchangeSymmetryVerified,
    ),
    pointComponentExchangeSymmetryEvidence: artifact(
      record.pointComponentExchangeSymmetryEvidence,
    ),
    pointComponentExchangeResidualUpper95: finiteValue(
      record.pointComponentExchangeResidualUpper95,
    ),
    pointComponentExchangeTolerance: finiteValue(
      record.pointComponentExchangeTolerance,
    ),
    semiclassicalityCriterion: artifact(record.semiclassicalityCriterion),
    meanStressTensor: artifact(record.meanStressTensor),
    fluctuationRatioFormula:
      record.fluctuationRatioFormula ===
      NHM2_SEMICLASSICAL_FLUCTUATION_RATIO_FORMULA
        ? record.fluctuationRatioFormula
        : null,
    meanNormalizationMethodId:
      record.meanNormalizationMethodId ===
      NHM2_SEMICLASSICAL_MEAN_NORMALIZATION_METHOD
        ? record.meanNormalizationMethodId
        : null,
    meanNormalizationScaleSI: finiteValue(record.meanNormalizationScaleSI),
    meanNormalizationFloorSI: finiteValue(record.meanNormalizationFloorSI),
    fluctuationToMeanRatioUpper95: finiteValue(
      record.fluctuationToMeanRatioUpper95,
    ),
    fluctuationToMeanRatioTolerance: finiteValue(
      record.fluctuationToMeanRatioTolerance,
    ),
    uncertaintyBudget: artifact(record.uncertaintyBudget),
    metricResponseEvidence: artifact(record.metricResponseEvidence),
    stabilityEvidence: artifact(record.stabilityEvidence),
    proxySubstitutionUsed: booleanValue(record.proxySubstitutionUsed),
    booleanOnlyAssertion: booleanValue(record.booleanOnlyAssertion),
  };
};

const normalizeConstraintIdentityResidual = (
  value: unknown,
): Nhm2SemiclassicalConstraintIdentityResidualV2 => {
  const record = recordOf(value);
  return {
    definition: artifact(record.definition),
    residual: numericalArtifact(record.residual),
    sampleCount: finiteValue(record.sampleCount),
    allSamplesFinite: booleanValue(record.allSamplesFinite),
    residualLInf: finiteValue(record.residualLInf),
    absoluteUncertainty95: finiteValue(record.absoluteUncertainty95),
    tolerance: finiteValue(record.tolerance),
  };
};

const normalizeConstraintConsistency = (
  value: unknown,
): Nhm2SemiclassicalConstraintConsistencyV2 => {
  const record = recordOf(value);
  const bracketResiduals = Array.isArray(record.bracketResiduals)
    ? record.bracketResiduals
    : [];
  return {
    stateId: textValue(record.stateId),
    stateSha256: textValue(record.stateSha256),
    renormalizationScheme: normalizeScheme(record.renormalizationScheme),
    renormalizationPrescription: artifact(record.renormalizationPrescription),
    renormalizationCounterterms: artifact(record.renormalizationCounterterms),
    finiteRenormalization: artifact(record.finiteRenormalization),
    formulationId: textValue(record.formulationId),
    formulation: artifact(record.formulation),
    regulatorId: textValue(record.regulatorId),
    regulator: artifact(record.regulator),
    operatorOrderingId: textValue(record.operatorOrderingId),
    operatorOrdering: artifact(record.operatorOrdering),
    constraintsSmeared: booleanValue(record.constraintsSmeared),
    smearingFunctions: artifact(record.smearingFunctions),
    bracketResiduals: bracketResiduals.map((value) => {
      const entry = recordOf(value);
      return {
        bracketId: NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS.includes(
          entry.bracketId as Nhm2SemiclassicalConstraintBracketId,
        )
          ? (entry.bracketId as Nhm2SemiclassicalConstraintBracketId)
          : null,
        computedBracket: numericalArtifact(entry.computedBracket),
        classicalStructureFunctionTarget: numericalArtifact(
          entry.classicalStructureFunctionTarget,
        ),
        residual: numericalArtifact(entry.residual),
        normalizationDefinition: artifact(entry.normalizationDefinition),
        normalizationMethodId: textValue(entry.normalizationMethodId),
        normalizationMethod: artifact(entry.normalizationMethod),
        normalizationScaleSI: finiteValue(entry.normalizationScaleSI),
        normalizationScaleUnit:
          entry.normalizationScaleUnit ===
          NHM2_SEMICLASSICAL_CONSTRAINT_NORMALIZATION_SCALE_UNIT
            ? entry.normalizationScaleUnit
            : null,
        sampleCount: finiteValue(entry.sampleCount),
        allSamplesFinite: booleanValue(entry.allSamplesFinite),
        residualLInf: finiteValue(entry.residualLInf),
        absoluteUncertainty95: finiteValue(entry.absoluteUncertainty95),
        tolerance: finiteValue(entry.tolerance),
      };
    }),
    classicalStructureFunctionsIncluded: booleanValue(
      record.classicalStructureFunctionsIncluded,
    ),
    anomalyDisposition:
      record.anomalyDisposition === "no_anomaly_within_frozen_tolerance" ||
      record.anomalyDisposition === "counterterms_included_and_replayed" ||
      record.anomalyDisposition === "anomaly_detected"
        ? record.anomalyDisposition
        : null,
    anomalyEvidence: artifact(record.anomalyEvidence),
    countertermEvidence: artifact(record.countertermEvidence),
    refinementLevelCount: finiteValue(record.refinementLevelCount),
    regulatorRemovalConverged: booleanValue(record.regulatorRemovalConverged),
    observedRegulatorRemovalConvergenceOrder: finiteValue(
      record.observedRegulatorRemovalConvergenceOrder,
    ),
    regulatorRemovalConvergenceEvidence: artifact(
      record.regulatorRemovalConvergenceEvidence,
    ),
    antisymmetryResidual: normalizeConstraintIdentityResidual(
      record.antisymmetryResidual,
    ),
    jacobiIdentityResidual: normalizeConstraintIdentityResidual(
      record.jacobiIdentityResidual,
    ),
    maximumAlgebraResidualUpper95: finiteValue(
      record.maximumAlgebraResidualUpper95,
    ),
    algebraTolerance: finiteValue(record.algebraTolerance),
    uncertaintyBudget: artifact(record.uncertaintyBudget),
    targetEchoUsedAsComputedBracket: booleanValue(
      record.targetEchoUsedAsComputedBracket,
    ),
    proxySubstitutionUsed: booleanValue(record.proxySubstitutionUsed),
    booleanOnlyAssertion: booleanValue(record.booleanOnlyAssertion),
  };
};

const draft = (gateId: GateDraft["gateId"]): GateDraft => ({
  gateId,
  missing: [],
  failures: [],
});

const requireText = (
  value: string | null,
  label: string,
  gate: GateDraft,
): void => {
  if (value == null) gate.missing.push(`${label}_missing`);
};
const requireHash = (
  value: string | null,
  label: string,
  gate: GateDraft,
): void => {
  if (value == null) gate.missing.push(`${label}_sha256_missing`);
  else if (!SHA256_PATTERN.test(value))
    gate.failures.push(`${label}_sha256_invalid`);
};
const requireArtifact = (
  value: Nhm2SemiclassicalArtifactIdentityV1,
  label: string,
  gate: GateDraft,
): void => {
  requireText(value.ref, `${label}_ref`, gate);
  requireHash(value.sha256, label, gate);
};

const requireExactArtifactBinding = (
  value: Nhm2SemiclassicalArtifactIdentityV1,
  expected: Nhm2SemiclassicalArtifactIdentityV1,
  label: string,
  gate: GateDraft,
): void => {
  requireArtifact(value, label, gate);
  if (value.ref != null && value.ref !== expected.ref)
    gate.failures.push(`${label}_ref_mismatch`);
  if (value.sha256 != null && value.sha256 !== expected.sha256)
    gate.failures.push(`${label}_sha256_mismatch`);
};
const requireTrue = (
  value: boolean | null,
  label: string,
  gate: GateDraft,
): void => {
  if (value == null) gate.missing.push(`${label}_missing`);
  else if (!value) gate.failures.push(`${label}_failed`);
};
const requireFalse = (
  value: boolean | null,
  label: string,
  gate: GateDraft,
): void => {
  if (value == null) gate.missing.push(`${label}_missing`);
  else if (value) gate.failures.push(`${label}_forbidden`);
};
const requireMinimumInteger = (
  value: number | null,
  minimum: number,
  label: string,
  gate: GateDraft,
): void => {
  if (value == null) gate.missing.push(`${label}_missing`);
  else if (!Number.isSafeInteger(value) || value < minimum)
    gate.failures.push(`${label}_below_minimum`);
};

const expectedFloat64SizeBytes = (shape: readonly number[]): number | null => {
  if (
    shape.length === 0 ||
    shape.some((extent) => !Number.isSafeInteger(extent) || extent <= 0)
  ) {
    return null;
  }
  let elements = 1;
  for (const extent of shape) {
    if (elements > Number.MAX_SAFE_INTEGER / extent) return null;
    elements *= extent;
  }
  return elements <= Number.MAX_SAFE_INTEGER / 8 ? elements * 8 : null;
};

const requireNumericalArtifact = (
  value: Nhm2SemiclassicalNumericalArtifactV1,
  label: string,
  gate: GateDraft,
  expectedOrder: readonly string[],
  expectedUnit: string,
  sampleCount: number | null,
  layout: "sample_components" | "bilocal_component_pairs" = "sample_components",
): void => {
  requireArtifact(value, label, gate);
  if (value.dtype == null) gate.missing.push(`${label}_dtype_missing`);
  if (value.binaryEncoding == null)
    gate.missing.push(`${label}_binary_encoding_missing`);
  if (value.endianness == null)
    gate.missing.push(`${label}_endianness_missing`);
  if (value.storageOrder == null)
    gate.missing.push(`${label}_storage_order_missing`);
  else if (value.storageOrder !== "row-major")
    gate.failures.push(`${label}_storage_order_invalid`);
  if (value.unit == null) gate.missing.push(`${label}_unit_missing`);
  else if (value.unit !== expectedUnit)
    gate.failures.push(`${label}_unit_invalid`);
  if (value.componentOrder.length === 0)
    gate.missing.push(`${label}_component_order_missing`);
  else if (
    value.componentOrder.length !== expectedOrder.length ||
    value.componentOrder.some((entry, index) => entry !== expectedOrder[index])
  ) {
    gate.failures.push(`${label}_component_order_invalid`);
  }
  const expectedRank = layout === "bilocal_component_pairs" ? 3 : 2;
  const shapeValid =
    value.shape.length === expectedRank &&
    expectedFloat64SizeBytes(value.shape) != null;
  if (value.shape.length === 0) gate.missing.push(`${label}_shape_missing`);
  else if (!shapeValid) gate.failures.push(`${label}_shape_invalid`);
  else {
    if (sampleCount != null && value.shape[0] !== sampleCount)
      gate.failures.push(`${label}_sample_count_mismatch`);
    if (
      layout === "bilocal_component_pairs" &&
      value.shape[1] !== value.shape[0]
    ) {
      gate.failures.push(`${label}_second_sample_axis_mismatch`);
    }
    const componentAxis = layout === "bilocal_component_pairs" ? 2 : 1;
    if (value.shape[componentAxis] !== expectedOrder.length)
      gate.failures.push(`${label}_component_axis_invalid`);
    const expectedBytes = expectedFloat64SizeBytes(value.shape);
    if (value.sizeBytes == null)
      gate.missing.push(`${label}_size_bytes_missing`);
    else if (expectedBytes == null || value.sizeBytes !== expectedBytes)
      gate.failures.push(`${label}_size_bytes_shape_mismatch`);
  }
};

const requireStateAndRenormalizationBinding = (
  value: Nhm2SemiclassicalStateIdentityV1 & {
    renormalizationScheme: Nhm2SemiclassicalRenormalizationScheme;
    renormalizationPrescription: Nhm2SemiclassicalArtifactIdentityV1;
    renormalizationCounterterms: Nhm2SemiclassicalArtifactIdentityV1;
    finiteRenormalization: Nhm2SemiclassicalArtifactIdentityV1;
  },
  base: Nhm2SemiclassicalStateRealizabilityV1,
  label: string,
  gate: GateDraft,
): void => {
  requireText(value.stateId, `${label}_state_id`, gate);
  requireHash(value.stateSha256, `${label}_state`, gate);
  if (value.stateId != null && value.stateId !== base.fieldState.stateId)
    gate.failures.push(`${label}_state_id_mismatch`);
  if (
    value.stateSha256 != null &&
    value.stateSha256 !== base.fieldState.stateSha256
  )
    gate.failures.push(`${label}_state_sha256_mismatch`);
  if (value.renormalizationScheme == null)
    gate.missing.push(`${label}_renormalization_scheme_missing`);
  else if (value.renormalizationScheme !== base.renormalization.scheme)
    gate.failures.push(`${label}_renormalization_scheme_mismatch`);
  requireExactArtifactBinding(
    value.renormalizationPrescription,
    base.renormalization.prescription,
    `${label}_renormalization_prescription`,
    gate,
  );
  requireExactArtifactBinding(
    value.renormalizationCounterterms,
    base.renormalization.counterterms,
    `${label}_renormalization_counterterms`,
    gate,
  );
  requireExactArtifactBinding(
    value.finiteRenormalization,
    base.renormalization.finiteRenormalization,
    `${label}_finite_renormalization`,
    gate,
  );
};

const stressFluctuationGate = (
  value: Nhm2SemiclassicalStressFluctuationsV2,
  base: Nhm2SemiclassicalStateRealizabilityV1,
): GateDraft => {
  const gate = draft("stress_fluctuation_noise_kernel");
  requireStateAndRenormalizationBinding(value, base, "noise_kernel", gate);
  if (value.sourceKind == null)
    gate.missing.push("noise_kernel_source_kind_missing");
  if (value.operatorOrdering == null)
    gate.missing.push("noise_kernel_operator_ordering_missing");
  requireTrue(value.connected, "noise_kernel_connected", gate);
  requireTrue(value.symmetrized, "noise_kernel_symmetrized", gate);
  requireTrue(value.smeared, "noise_kernel_smeared", gate);
  requireArtifact(
    value.smearingFunction,
    "noise_kernel_smearing_function",
    gate,
  );
  requireText(value.samplingBasisId, "noise_kernel_sampling_basis_id", gate);
  requireArtifact(value.samplingBasis, "noise_kernel_sampling_basis", gate);
  requireTrue(
    value.samplingBasisFrozenBeforeExecution,
    "noise_kernel_sampling_basis_frozen_before_execution",
    gate,
  );
  requireArtifact(
    value.samplingWindow.definition,
    "noise_kernel_sampling_window",
    gate,
  );
  requireText(value.samplingWindow.shape, "noise_kernel_sampling_shape", gate);
  for (const [label, number] of [
    [
      "noise_kernel_spatial_support_radius",
      value.samplingWindow.spatialSupportRadiusM,
    ],
    [
      "noise_kernel_temporal_support",
      value.samplingWindow.temporalSupportSeconds,
    ],
  ] as const) {
    if (number == null) gate.missing.push(`${label}_missing`);
    else if (!(number > 0)) gate.failures.push(`${label}_invalid`);
  }
  requireMinimumInteger(
    value.sampleCount,
    NHM2_SEMICLASSICAL_DIAGNOSTIC_COVERAGE_POLICY.minimumSpatialSampleCount,
    "noise_kernel_sample_count",
    gate,
  );
  requireNumericalArtifact(
    value.noiseKernel,
    "connected_stress_noise_kernel",
    gate,
    NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER,
    "(J/m^3)^2",
    value.sampleCount,
    "bilocal_component_pairs",
  );
  if (
    value.noiseKernel.sha256 != null &&
    value.noiseKernel.sha256 === base.stressTensor.tensor.sha256
  )
    gate.failures.push("mean_stress_tensor_substituted_for_noise_kernel");
  requireTrue(value.allSamplesFinite, "noise_kernel_samples_finite", gate);
  requireArtifact(value.psdAnalysis, "noise_kernel_psd_analysis", gate);
  requireTrue(
    value.covariancePositiveSemidefinite,
    "noise_kernel_covariance_psd",
    gate,
  );
  if (value.minimumEigenvalueSI == null)
    gate.missing.push("noise_kernel_minimum_eigenvalue_missing");
  if (value.psdToleranceSI == null)
    gate.missing.push("noise_kernel_psd_tolerance_missing");
  else if (value.psdToleranceSI < 0)
    gate.failures.push("noise_kernel_psd_tolerance_invalid");
  if (
    value.minimumEigenvalueSI != null &&
    value.psdToleranceSI != null &&
    value.minimumEigenvalueSI < -value.psdToleranceSI
  )
    gate.failures.push(
      "noise_kernel_covariance_minimum_eigenvalue_below_tolerance",
    );
  if (value.pointComponentExchangeSymmetry == null)
    gate.missing.push("noise_kernel_point_component_exchange_symmetry_missing");
  requireTrue(
    value.pointComponentExchangeSymmetryVerified,
    "noise_kernel_point_component_exchange_symmetry",
    gate,
  );
  requireArtifact(
    value.pointComponentExchangeSymmetryEvidence,
    "noise_kernel_point_component_exchange_symmetry_evidence",
    gate,
  );
  if (value.pointComponentExchangeResidualUpper95 == null)
    gate.missing.push(
      "noise_kernel_point_component_exchange_residual_upper95_missing",
    );
  else if (value.pointComponentExchangeResidualUpper95 < 0)
    gate.failures.push(
      "noise_kernel_point_component_exchange_residual_upper95_invalid",
    );
  if (value.pointComponentExchangeTolerance == null)
    gate.missing.push(
      "noise_kernel_point_component_exchange_tolerance_missing",
    );
  else if (!(value.pointComponentExchangeTolerance > 0))
    gate.failures.push(
      "noise_kernel_point_component_exchange_tolerance_invalid",
    );
  if (
    value.pointComponentExchangeResidualUpper95 != null &&
    value.pointComponentExchangeTolerance != null &&
    value.pointComponentExchangeResidualUpper95 >
      value.pointComponentExchangeTolerance
  ) {
    gate.failures.push(
      "noise_kernel_point_component_exchange_symmetry_exceeds_tolerance",
    );
  }
  requireArtifact(
    value.semiclassicalityCriterion,
    "noise_kernel_semiclassicality_criterion",
    gate,
  );
  requireExactArtifactBinding(
    value.meanStressTensor,
    base.stressTensor.tensor,
    "noise_kernel_mean_stress_tensor",
    gate,
  );
  if (value.fluctuationRatioFormula == null)
    gate.missing.push("noise_kernel_fluctuation_ratio_formula_missing");
  requireText(
    value.meanNormalizationMethodId,
    "noise_kernel_mean_normalization_method_id",
    gate,
  );
  if (value.meanNormalizationScaleSI == null)
    gate.missing.push("noise_kernel_mean_normalization_scale_missing");
  else if (!(value.meanNormalizationScaleSI > 0))
    gate.failures.push("noise_kernel_mean_normalization_scale_invalid");
  if (value.meanNormalizationFloorSI == null)
    gate.missing.push("noise_kernel_mean_normalization_floor_missing");
  else if (!(value.meanNormalizationFloorSI > 0))
    gate.failures.push("noise_kernel_mean_normalization_floor_invalid");
  if (
    value.meanNormalizationScaleSI != null &&
    value.meanNormalizationFloorSI != null &&
    value.meanNormalizationScaleSI < value.meanNormalizationFloorSI
  ) {
    gate.failures.push("noise_kernel_mean_normalization_scale_below_floor");
  }
  if (value.fluctuationToMeanRatioUpper95 == null)
    gate.missing.push("noise_kernel_fluctuation_ratio_upper95_missing");
  else if (value.fluctuationToMeanRatioUpper95 < 0)
    gate.failures.push("noise_kernel_fluctuation_ratio_upper95_invalid");
  if (value.fluctuationToMeanRatioTolerance == null)
    gate.missing.push("noise_kernel_fluctuation_ratio_tolerance_missing");
  else if (!(value.fluctuationToMeanRatioTolerance > 0))
    gate.failures.push("noise_kernel_fluctuation_ratio_tolerance_invalid");
  if (
    value.fluctuationToMeanRatioUpper95 != null &&
    value.fluctuationToMeanRatioTolerance != null &&
    value.fluctuationToMeanRatioUpper95 > value.fluctuationToMeanRatioTolerance
  )
    gate.failures.push("noise_kernel_fluctuation_ratio_exceeds_tolerance");
  requireArtifact(
    value.uncertaintyBudget,
    "noise_kernel_uncertainty_budget",
    gate,
  );
  requireArtifact(
    value.metricResponseEvidence,
    "noise_kernel_metric_response_evidence",
    gate,
  );
  requireArtifact(
    value.stabilityEvidence,
    "noise_kernel_stability_evidence",
    gate,
  );
  requireFalse(
    value.proxySubstitutionUsed,
    "noise_kernel_proxy_substitution",
    gate,
  );
  requireFalse(
    value.booleanOnlyAssertion,
    "noise_kernel_boolean_only_assertion",
    gate,
  );
  return gate;
};

const requireConstraintIdentityResidual = (
  value: Nhm2SemiclassicalConstraintIdentityResidualV2,
  label: string,
  algebraTolerance: number | null,
  gate: GateDraft,
): number | null => {
  requireArtifact(value.definition, `${label}_definition`, gate);
  requireMinimumInteger(
    value.sampleCount,
    NHM2_SEMICLASSICAL_DIAGNOSTIC_COVERAGE_POLICY.minimumSpatialSampleCount,
    `${label}_sample_count`,
    gate,
  );
  requireNumericalArtifact(
    value.residual,
    `${label}_residual`,
    gate,
    NHM2_SEMICLASSICAL_CONSTRAINT_COMPONENT_ORDER,
    "dimensionless",
    value.sampleCount,
  );
  requireTrue(value.allSamplesFinite, `${label}_samples_finite`, gate);
  if (value.residualLInf == null)
    gate.missing.push(`${label}_residual_linf_missing`);
  else if (value.residualLInf < 0)
    gate.failures.push(`${label}_residual_linf_invalid`);
  if (value.absoluteUncertainty95 == null)
    gate.missing.push(`${label}_uncertainty95_missing`);
  else if (value.absoluteUncertainty95 < 0)
    gate.failures.push(`${label}_uncertainty95_invalid`);
  if (value.tolerance == null) gate.missing.push(`${label}_tolerance_missing`);
  else if (!(value.tolerance > 0))
    gate.failures.push(`${label}_tolerance_invalid`);
  if (
    value.tolerance != null &&
    algebraTolerance != null &&
    value.tolerance !== algebraTolerance
  ) {
    gate.failures.push(`${label}_tolerance_binding_mismatch`);
  }
  if (value.residualLInf == null || value.absoluteUncertainty95 == null)
    return null;
  const upper = value.residualLInf + value.absoluteUncertainty95;
  if (value.tolerance != null && upper > value.tolerance)
    gate.failures.push(`${label}_residual_upper95_exceeds_tolerance`);
  return upper;
};

const constraintConsistencyGate = (
  value: Nhm2SemiclassicalConstraintConsistencyV2,
  base: Nhm2SemiclassicalStateRealizabilityV1,
): GateDraft => {
  const gate = draft("constraint_formulation_consistency");
  requireStateAndRenormalizationBinding(
    value,
    base,
    "constraint_algebra",
    gate,
  );
  requireText(value.formulationId, "constraint_formulation_id", gate);
  requireArtifact(value.formulation, "constraint_formulation", gate);
  requireText(value.regulatorId, "constraint_regulator_id", gate);
  requireArtifact(value.regulator, "constraint_regulator", gate);
  requireText(
    value.operatorOrderingId,
    "constraint_operator_ordering_id",
    gate,
  );
  requireArtifact(value.operatorOrdering, "constraint_operator_ordering", gate);
  requireTrue(value.constraintsSmeared, "constraint_algebra_smeared", gate);
  requireArtifact(
    value.smearingFunctions,
    "constraint_smearing_functions",
    gate,
  );
  requireTrue(
    value.classicalStructureFunctionsIncluded,
    "constraint_classical_structure_functions",
    gate,
  );
  if (value.algebraTolerance == null)
    gate.missing.push("constraint_algebra_tolerance_missing");
  else if (!(value.algebraTolerance > 0))
    gate.failures.push("constraint_algebra_tolerance_invalid");

  for (const bracketId of NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS) {
    const matches = value.bracketResiduals.filter(
      (entry) => entry.bracketId === bracketId,
    );
    if (matches.length === 0)
      gate.missing.push(`constraint_bracket_${bracketId}_missing`);
    else if (matches.length !== 1)
      gate.failures.push(`constraint_bracket_${bracketId}_not_unique`);
  }
  if (value.bracketResiduals.some((entry) => entry.bracketId == null))
    gate.failures.push("constraint_bracket_unknown_id");
  if (
    value.bracketResiduals.length >
    NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS.length
  )
    gate.failures.push("constraint_bracket_cardinality_invalid");

  const computedUpperBounds: number[] = [];
  for (const entry of value.bracketResiduals) {
    const label = `constraint_bracket_${entry.bracketId ?? "unknown"}`;
    requireMinimumInteger(
      entry.sampleCount,
      NHM2_SEMICLASSICAL_DIAGNOSTIC_COVERAGE_POLICY.minimumSpatialSampleCount,
      `${label}_sample_count`,
      gate,
    );
    for (const [suffix, array] of [
      ["computed", entry.computedBracket],
      ["classical_target", entry.classicalStructureFunctionTarget],
      ["residual", entry.residual],
    ] as const) {
      requireNumericalArtifact(
        array,
        `${label}_${suffix}`,
        gate,
        NHM2_SEMICLASSICAL_CONSTRAINT_COMPONENT_ORDER,
        "dimensionless",
        entry.sampleCount,
      );
    }
    requireArtifact(
      entry.normalizationDefinition,
      `${label}_normalization_definition`,
      gate,
    );
    requireText(
      entry.normalizationMethodId,
      `${label}_normalization_method_id`,
      gate,
    );
    requireArtifact(
      entry.normalizationMethod,
      `${label}_normalization_method`,
      gate,
    );
    if (entry.normalizationScaleSI == null)
      gate.missing.push(`${label}_normalization_scale_missing`);
    else if (!(entry.normalizationScaleSI > 0))
      gate.failures.push(`${label}_normalization_scale_invalid`);
    requireText(
      entry.normalizationScaleUnit,
      `${label}_normalization_scale_unit`,
      gate,
    );
    if (
      entry.computedBracket.sha256 != null &&
      entry.computedBracket.sha256 ===
        entry.classicalStructureFunctionTarget.sha256
    )
      gate.failures.push(`${label}_target_echo_used_as_computed_bracket`);
    if (
      entry.residual.sha256 != null &&
      (entry.residual.sha256 === entry.computedBracket.sha256 ||
        entry.residual.sha256 === entry.classicalStructureFunctionTarget.sha256)
    )
      gate.failures.push(`${label}_residual_array_not_independent`);
    requireTrue(entry.allSamplesFinite, `${label}_samples_finite`, gate);
    if (entry.residualLInf == null)
      gate.missing.push(`${label}_residual_linf_missing`);
    else if (entry.residualLInf < 0)
      gate.failures.push(`${label}_residual_linf_invalid`);
    if (entry.absoluteUncertainty95 == null)
      gate.missing.push(`${label}_uncertainty95_missing`);
    else if (entry.absoluteUncertainty95 < 0)
      gate.failures.push(`${label}_uncertainty95_invalid`);
    if (entry.tolerance == null)
      gate.missing.push(`${label}_tolerance_missing`);
    else if (!(entry.tolerance > 0))
      gate.failures.push(`${label}_tolerance_invalid`);
    if (
      entry.tolerance != null &&
      value.algebraTolerance != null &&
      entry.tolerance !== value.algebraTolerance
    ) {
      gate.failures.push(`${label}_tolerance_binding_mismatch`);
    }
    if (
      entry.residualLInf != null &&
      entry.absoluteUncertainty95 != null &&
      entry.tolerance != null
    ) {
      const upper = entry.residualLInf + entry.absoluteUncertainty95;
      computedUpperBounds.push(upper);
      if (upper > entry.tolerance)
        gate.failures.push(`${label}_residual_upper95_exceeds_tolerance`);
    }
  }

  if (value.anomalyDisposition == null)
    gate.missing.push("constraint_anomaly_disposition_missing");
  else if (value.anomalyDisposition === "anomaly_detected")
    gate.failures.push("constraint_algebra_anomaly_detected");
  requireArtifact(value.anomalyEvidence, "constraint_anomaly_evidence", gate);
  if (value.anomalyDisposition === "counterterms_included_and_replayed") {
    requireExactArtifactBinding(
      value.countertermEvidence,
      base.renormalization.counterterms,
      "constraint_counterterm_evidence",
      gate,
    );
  }
  requireMinimumInteger(
    value.refinementLevelCount,
    3,
    "constraint_regulator_removal_refinement_level_count",
    gate,
  );
  requireTrue(
    value.regulatorRemovalConverged,
    "constraint_regulator_removal_converged",
    gate,
  );
  if (value.observedRegulatorRemovalConvergenceOrder == null)
    gate.missing.push("constraint_regulator_removal_convergence_order_missing");
  else if (!(value.observedRegulatorRemovalConvergenceOrder > 0))
    gate.failures.push(
      "constraint_regulator_removal_convergence_order_invalid",
    );
  requireArtifact(
    value.regulatorRemovalConvergenceEvidence,
    "constraint_regulator_removal_convergence_evidence",
    gate,
  );
  const antisymmetryUpper = requireConstraintIdentityResidual(
    value.antisymmetryResidual,
    "constraint_antisymmetry",
    value.algebraTolerance,
    gate,
  );
  const jacobiUpper = requireConstraintIdentityResidual(
    value.jacobiIdentityResidual,
    "constraint_jacobi_identity",
    value.algebraTolerance,
    gate,
  );
  requireArtifact(
    value.uncertaintyBudget,
    "constraint_algebra_uncertainty_budget",
    gate,
  );
  if (value.maximumAlgebraResidualUpper95 == null)
    gate.missing.push("constraint_algebra_maximum_residual_upper95_missing");
  else if (value.maximumAlgebraResidualUpper95 < 0)
    gate.failures.push("constraint_algebra_maximum_residual_upper95_invalid");
  if (
    value.bracketResiduals.length ===
      NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS.length &&
    computedUpperBounds.length === value.bracketResiduals.length &&
    antisymmetryUpper != null &&
    jacobiUpper != null
  ) {
    const expectedMaximum = Math.max(
      ...computedUpperBounds,
      antisymmetryUpper,
      jacobiUpper,
    );
    if (value.maximumAlgebraResidualUpper95 !== expectedMaximum)
      gate.failures.push(
        "constraint_algebra_maximum_residual_binding_mismatch",
      );
  }
  if (
    value.maximumAlgebraResidualUpper95 != null &&
    value.algebraTolerance != null &&
    value.maximumAlgebraResidualUpper95 > value.algebraTolerance
  )
    gate.failures.push("constraint_algebra_residual_exceeds_tolerance");
  requireFalse(
    value.targetEchoUsedAsComputedBracket,
    "constraint_target_echo",
    gate,
  );
  requireFalse(
    value.proxySubstitutionUsed,
    "constraint_proxy_substitution",
    gate,
  );
  requireFalse(
    value.booleanOnlyAssertion,
    "constraint_boolean_only_assertion",
    gate,
  );
  return gate;
};

const finalizeGate = (gate: GateDraft) => ({
  gateId: gate.gateId,
  status: (gate.failures.length > 0
    ? "fail"
    : gate.missing.length > 0
      ? "blocked"
      : "pass") as Nhm2SemiclassicalStateRealizabilityV2Status,
  blockers: [...new Set([...gate.missing, ...gate.failures])],
});

export const buildNhm2SemiclassicalStateRealizabilityV2 = (
  input: BuildNhm2SemiclassicalStateRealizabilityV2Input = {},
): Nhm2SemiclassicalStateRealizabilityV2 => {
  const base = buildNhm2SemiclassicalStateRealizability(input);
  const stressFluctuations = normalizeStressFluctuations(
    input.stressFluctuations,
  );
  const constraintConsistency = normalizeConstraintConsistency(
    input.constraintConsistency,
  );
  const extensionGates = [
    stressFluctuationGate(stressFluctuations, base),
    constraintConsistencyGate(constraintConsistency, base),
  ].map(finalizeGate);
  const gates: Nhm2SemiclassicalStateRealizabilityV2["gates"] = [
    ...base.gates,
    ...extensionGates,
  ];
  const status: Nhm2SemiclassicalStateRealizabilityV2Status = gates.some(
    (gate) => gate.status === "fail",
  )
    ? "fail"
    : gates.some((gate) => gate.status === "blocked")
      ? "blocked"
      : "pass";
  const blockers = gates.flatMap((gate) =>
    gate.blockers.map((blocker) => `${gate.gateId}:${blocker}`),
  );
  const {
    contractVersion: _contractVersion,
    gates: _gates,
    status: _status,
    semiclassicalStateRealizabilityReady: _ready,
    blockers: _blockers,
    claimBoundary: _claimBoundary,
    ...basePrimitive
  } = base;
  return {
    contractVersion: NHM2_SEMICLASSICAL_STATE_REALIZABILITY_V2_CONTRACT_VERSION,
    ...basePrimitive,
    stressFluctuations,
    constraintConsistency,
    gates,
    status,
    semiclassicalStateRealizabilityReady: status === "pass",
    blockers,
    claimBoundary: base.claimBoundary,
  };
};

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])]),
  );
};

export const isNhm2SemiclassicalStateRealizabilityV2 = (
  value: unknown,
): value is Nhm2SemiclassicalStateRealizabilityV2 => {
  if (
    !isRecord(value) ||
    value.contractVersion !==
      NHM2_SEMICLASSICAL_STATE_REALIZABILITY_V2_CONTRACT_VERSION
  )
    return false;
  const rebuilt = buildNhm2SemiclassicalStateRealizabilityV2(
    value as unknown as BuildNhm2SemiclassicalStateRealizabilityV2Input,
  );
  return (
    JSON.stringify(canonicalize(value)) ===
    JSON.stringify(canonicalize(rebuilt))
  );
};
