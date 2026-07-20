export const NHM2_SEMICLASSICAL_STATE_REALIZABILITY_CONTRACT_VERSION =
  "nhm2_semiclassical_state_realizability/v1";

export const NHM2_SEMICLASSICAL_TENSOR_COMPONENTS = [
  "T00",
  "T01",
  "T02",
  "T03",
  "T11",
  "T12",
  "T13",
  "T22",
  "T23",
  "T33",
] as const;

export const NHM2_SEMICLASSICAL_UNCERTAINTY_QUANTITIES = [
  "field_state_construction",
  "state_admissibility",
  "renormalization",
  "renormalized_stress_tensor",
  "ward_identity",
  "qei_margin",
  "preparation_switching",
  "semiclassical_backreaction",
] as const;

export const NHM2_SEMICLASSICAL_REALIZABILITY_GATE_IDS = [
  "field_state_construction",
  "state_admissibility",
  "renormalization_counterterms",
  "renormalized_stress_tensor",
  "ward_identity_conservation",
  "qei_same_state_worldline_binding",
  "preparation_switching_compatibility",
  "uncertainty_bounds",
  "semiclassical_backreaction_consistency",
  "provenance_integrity",
] as const;

export const NHM2_SEMICLASSICAL_DIAGNOSTIC_COVERAGE_POLICY = {
  minimumSpatialSampleCount: 64,
  minimumWorldlineCount: 24,
  minimumBackreactionIterationCount: 3,
  minimumUncertaintySampleCount: 64,
} as const;

export const NHM2_SEMICLASSICAL_WARD_COMPONENTS = [
  "nabla_mu_T_mu0",
  "nabla_mu_T_mu1",
  "nabla_mu_T_mu2",
  "nabla_mu_T_mu3",
] as const;

export type Nhm2SemiclassicalTensorComponent =
  (typeof NHM2_SEMICLASSICAL_TENSOR_COMPONENTS)[number];
export type Nhm2SemiclassicalUncertaintyQuantity =
  (typeof NHM2_SEMICLASSICAL_UNCERTAINTY_QUANTITIES)[number];
export type Nhm2SemiclassicalRealizabilityGateId =
  (typeof NHM2_SEMICLASSICAL_REALIZABILITY_GATE_IDS)[number];
export type Nhm2SemiclassicalRealizabilityStatus = "pass" | "fail" | "blocked";
export type Nhm2SemiclassicalAdmissibilityCriterion =
  | "hadamard"
  | "microlocal_spectrum"
  | "adiabatic_order_4_or_higher"
  | "equivalent"
  | null;
export type Nhm2SemiclassicalRenormalizationScheme =
  | "point_splitting"
  | "hadamard_subtraction"
  | "adiabatic_subtraction"
  | "other_covariant"
  | null;
export type Nhm2SemiclassicalSwitchingSmoothness =
  "C2_or_better" | "C_infinity" | "smooth_compact_support" | "adiabatic" | null;

export type Nhm2SemiclassicalArtifactIdentityV1 = {
  ref: string | null;
  sha256: string | null;
};

export type Nhm2SemiclassicalNumericalArtifactV1 =
  Nhm2SemiclassicalArtifactIdentityV1 & {
    dtype: "float64" | null;
    binaryEncoding: "raw_ieee754" | null;
    endianness: "little" | null;
    shape: number[];
    sizeBytes: number | null;
    storageOrder: "row-major" | "column-major" | null;
    componentOrder: string[];
    unit: string | null;
  };

export type Nhm2SemiclassicalStateIdentityV1 = {
  stateId: string | null;
  stateSha256: string | null;
};

export type Nhm2SemiclassicalStateRealizabilityV1 = {
  contractVersion: typeof NHM2_SEMICLASSICAL_STATE_REALIZABILITY_CONTRACT_VERSION;
  generatedAt: string | null;
  laneId: string | null;
  selectedProfileId: string | null;
  runId: string | null;
  fieldState: Nhm2SemiclassicalStateIdentityV1 & {
    fieldModelId: string | null;
    fieldModelClass: string | null;
    stateArtifact: Nhm2SemiclassicalNumericalArtifactV1;
    lagrangian: Nhm2SemiclassicalArtifactIdentityV1;
    equationsOfMotion: Nhm2SemiclassicalArtifactIdentityV1;
    stateConstruction: Nhm2SemiclassicalArtifactIdentityV1;
    backgroundGeometry: Nhm2SemiclassicalArtifactIdentityV1;
    fieldEquationResidualLInf: number | null;
    fieldEquationToleranceLInf: number | null;
    sampleCount: number | null;
  };
  admissibility: Nhm2SemiclassicalStateIdentityV1 & {
    criterion: Nhm2SemiclassicalAdmissibilityCriterion;
    analysis: Nhm2SemiclassicalArtifactIdentityV1;
    twoPointFunction: Nhm2SemiclassicalNumericalArtifactV1;
    equivalenceTheorem: Nhm2SemiclassicalArtifactIdentityV1;
    criterionSatisfied: boolean | null;
  };
  renormalization: Nhm2SemiclassicalStateIdentityV1 & {
    scheme: Nhm2SemiclassicalRenormalizationScheme;
    prescription: Nhm2SemiclassicalArtifactIdentityV1;
    counterterms: Nhm2SemiclassicalArtifactIdentityV1;
    finiteRenormalization: Nhm2SemiclassicalArtifactIdentityV1;
    countertermsFixed: boolean | null;
    finiteFreedomResolved: boolean | null;
  };
  stressTensor: Nhm2SemiclassicalStateIdentityV1 & {
    tensor: Nhm2SemiclassicalNumericalArtifactV1;
    chartId: string | null;
    basis: string | null;
    unit: "J/m^3" | null;
    symmetryVerified: boolean | null;
    components: Array<{
      component: Nhm2SemiclassicalTensorComponent | null;
      evidence: Nhm2SemiclassicalNumericalArtifactV1;
      sampleCount: number | null;
      renormalized: boolean | null;
      finite: boolean | null;
    }>;
  };
  wardIdentity: Nhm2SemiclassicalStateIdentityV1 & {
    evidence: Nhm2SemiclassicalArtifactIdentityV1;
    divergenceSamples: Nhm2SemiclassicalNumericalArtifactV1;
    sampleCount: number | null;
    covariantDerivativeDefined: boolean | null;
    divergenceResidualLInf: number | null;
    toleranceLInf: number | null;
  };
  qeiBinding: Nhm2SemiclassicalStateIdentityV1 & {
    dossier: Nhm2SemiclassicalArtifactIdentityV1;
    boundReceipt: Nhm2SemiclassicalArtifactIdentityV1;
    worldlineSet: Nhm2SemiclassicalArtifactIdentityV1;
    sampledWorldlineSetSha256: string | null;
    boundWorldlineSetSha256: string | null;
    worldlineCount: number | null;
    allWorldlinesEvaluated: boolean | null;
    minimumMarginSI: number | null;
    marginAbsoluteUncertaintySI: number | null;
  };
  preparationSwitching: Nhm2SemiclassicalStateIdentityV1 & {
    protocol: Nhm2SemiclassicalArtifactIdentityV1;
    switchingFunction: Nhm2SemiclassicalArtifactIdentityV1;
    dynamicSolution: Nhm2SemiclassicalNumericalArtifactV1;
    smoothness: Nhm2SemiclassicalSwitchingSmoothness;
    compatibleWithStateConstruction: boolean | null;
    boundaryConditionsSatisfied: boolean | null;
    fieldEquationResidualLInf: number | null;
    fieldEquationToleranceLInf: number | null;
    conservationResidualLInf: number | null;
    conservationToleranceLInf: number | null;
  };
  uncertaintyBudget: {
    budget: Nhm2SemiclassicalArtifactIdentityV1;
    maximumRelativeHalfWidth95: number | null;
    bounds: Array<{
      quantity: Nhm2SemiclassicalUncertaintyQuantity | null;
      unit: string | null;
      estimateSI: number | null;
      intervalLowerSI: number | null;
      intervalUpperSI: number | null;
      acceptanceLowerSI: number | null;
      acceptanceUpperSI: number | null;
      confidenceLevel: number | null;
      method: Nhm2SemiclassicalArtifactIdentityV1;
      rawSamples: Nhm2SemiclassicalNumericalArtifactV1;
      normalizationScaleSI: number | null;
    }>;
  };
  backreaction: Nhm2SemiclassicalStateIdentityV1 & {
    evidence: Nhm2SemiclassicalArtifactIdentityV1;
    geometry: Nhm2SemiclassicalNumericalArtifactV1;
    sourceTensor: Nhm2SemiclassicalNumericalArtifactV1;
    sampleCount: number | null;
    selfConsistentIterations: number | null;
    converged: boolean | null;
    einsteinResidualLInf: number | null;
    einsteinToleranceLInf: number | null;
    constraintResidualLInf: number | null;
    constraintToleranceLInf: number | null;
  };
  provenance: {
    producer: string | null;
    producerVersion: string | null;
    implementationId: string | null;
    solverId: string | null;
    solverVersion: string | null;
    gitSha: string | null;
    solver: Nhm2SemiclassicalArtifactIdentityV1;
    environment: Nhm2SemiclassicalArtifactIdentityV1;
    invocation: Nhm2SemiclassicalArtifactIdentityV1;
    inputManifest: Nhm2SemiclassicalArtifactIdentityV1;
    command: string | null;
    argv: string[];
    workingDirectory: string | null;
    outputDirectory: string | null;
    requestId: string | null;
    runId: string | null;
    receiptId: string | null;
    runtimeId: string | null;
    deterministicSeed: string | null;
    startedAt: string | null;
    completedAt: string | null;
    runSpecificOutput: boolean | null;
  };
  gates: Array<{
    gateId: Nhm2SemiclassicalRealizabilityGateId;
    status: Nhm2SemiclassicalRealizabilityStatus;
    blockers: string[];
  }>;
  status: Nhm2SemiclassicalRealizabilityStatus;
  semiclassicalStateRealizabilityReady: boolean;
  blockers: string[];
  claimBoundary: {
    diagnosticOnly: true;
    physicalViability: false;
    transport: false;
    propulsion: false;
    routeEta: false;
    certifiedSpeed: false;
  };
};

type PrimitiveEvidence = Omit<
  Nhm2SemiclassicalStateRealizabilityV1,
  | "contractVersion"
  | "gates"
  | "status"
  | "semiclassicalStateRealizabilityReady"
  | "blockers"
  | "claimBoundary"
>;

type DeepPartial<T> =
  T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> | null }
      : T;

export type BuildNhm2SemiclassicalStateRealizabilityInput =
  DeepPartial<PrimitiveEvidence>;

type GateDraft = {
  gateId: Nhm2SemiclassicalRealizabilityGateId;
  missing: string[];
  failures: string[];
};

const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/i;
const GIT_SHA_PATTERN = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const asRecord = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const toFinite = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const toBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const uniqueText = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(values.filter((value): value is string => asText(value) != null)),
  );

const normalizeArtifact = (
  value: unknown,
): Nhm2SemiclassicalArtifactIdentityV1 => {
  const record = asRecord(value);
  return {
    ref: asText(record.ref),
    sha256: asText(record.sha256),
  };
};

const normalizeNumericalArtifact = (
  value: unknown,
): Nhm2SemiclassicalNumericalArtifactV1 => {
  const record = asRecord(value);
  return {
    ...normalizeArtifact(record),
    dtype: record.dtype === "float64" ? "float64" : null,
    binaryEncoding:
      record.binaryEncoding === "raw_ieee754" ? "raw_ieee754" : null,
    endianness: record.endianness === "little" ? "little" : null,
    shape: Array.isArray(record.shape)
      ? record.shape
          .map(toFinite)
          .filter((entry): entry is number => entry != null)
      : [],
    sizeBytes: toFinite(record.sizeBytes),
    storageOrder:
      record.storageOrder === "row-major" ||
      record.storageOrder === "column-major"
        ? record.storageOrder
        : null,
    componentOrder: Array.isArray(record.componentOrder)
      ? record.componentOrder
          .map(asText)
          .filter((entry): entry is string => entry != null)
      : [],
    unit: asText(record.unit),
  };
};

const normalizeStateIdentity = (
  record: Record<string, unknown>,
): Nhm2SemiclassicalStateIdentityV1 => ({
  stateId: asText(record.stateId),
  stateSha256: asText(record.stateSha256),
});

const normalizeCriterion = (
  value: unknown,
): Nhm2SemiclassicalAdmissibilityCriterion => {
  const text = asText(value);
  return text === "hadamard" ||
    text === "microlocal_spectrum" ||
    text === "adiabatic_order_4_or_higher" ||
    text === "equivalent"
    ? text
    : null;
};

const normalizeScheme = (
  value: unknown,
): Nhm2SemiclassicalRenormalizationScheme => {
  const text = asText(value);
  return text === "point_splitting" ||
    text === "hadamard_subtraction" ||
    text === "adiabatic_subtraction" ||
    text === "other_covariant"
    ? text
    : null;
};

const normalizeSmoothness = (
  value: unknown,
): Nhm2SemiclassicalSwitchingSmoothness => {
  const text = asText(value);
  return text === "C2_or_better" ||
    text === "C_infinity" ||
    text === "smooth_compact_support" ||
    text === "adiabatic"
    ? text
    : null;
};

const normalizeComponent = (
  value: unknown,
): Nhm2SemiclassicalTensorComponent | null => {
  const text = asText(value);
  return NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.includes(
    text as Nhm2SemiclassicalTensorComponent,
  )
    ? (text as Nhm2SemiclassicalTensorComponent)
    : null;
};

const normalizeUncertaintyQuantity = (
  value: unknown,
): Nhm2SemiclassicalUncertaintyQuantity | null => {
  const text = asText(value);
  return NHM2_SEMICLASSICAL_UNCERTAINTY_QUANTITIES.includes(
    text as Nhm2SemiclassicalUncertaintyQuantity,
  )
    ? (text as Nhm2SemiclassicalUncertaintyQuantity)
    : null;
};

const normalizePrimitiveEvidence = (
  input: BuildNhm2SemiclassicalStateRealizabilityInput,
): PrimitiveEvidence => {
  const root = asRecord(input);
  const fieldState = asRecord(root.fieldState);
  const admissibility = asRecord(root.admissibility);
  const renormalization = asRecord(root.renormalization);
  const stressTensor = asRecord(root.stressTensor);
  const wardIdentity = asRecord(root.wardIdentity);
  const qeiBinding = asRecord(root.qeiBinding);
  const preparationSwitching = asRecord(root.preparationSwitching);
  const uncertaintyBudget = asRecord(root.uncertaintyBudget);
  const backreaction = asRecord(root.backreaction);
  const provenance = asRecord(root.provenance);
  const components = Array.isArray(stressTensor.components)
    ? stressTensor.components
    : [];
  const uncertaintyBounds = Array.isArray(uncertaintyBudget.bounds)
    ? uncertaintyBudget.bounds
    : [];
  const normalizedUncertaintyBounds = uncertaintyBounds.map((value) => {
    const bound = asRecord(value);
    return {
      quantity: normalizeUncertaintyQuantity(bound.quantity),
      unit: asText(bound.unit),
      estimateSI: toFinite(bound.estimateSI),
      intervalLowerSI: toFinite(bound.intervalLowerSI),
      intervalUpperSI: toFinite(bound.intervalUpperSI),
      acceptanceLowerSI: toFinite(bound.acceptanceLowerSI),
      acceptanceUpperSI: toFinite(bound.acceptanceUpperSI),
      confidenceLevel: toFinite(bound.confidenceLevel),
      method: normalizeArtifact(bound.method),
      rawSamples: normalizeNumericalArtifact(bound.rawSamples),
      normalizationScaleSI: toFinite(bound.normalizationScaleSI),
    };
  });
  const relativeHalfWidths = normalizedUncertaintyBounds.map((bound) => {
    if (
      bound.estimateSI == null ||
      bound.intervalLowerSI == null ||
      bound.intervalUpperSI == null ||
      bound.normalizationScaleSI == null ||
      !(bound.normalizationScaleSI > 0)
    ) {
      return null;
    }
    return (
      Math.max(
        Math.abs(bound.intervalUpperSI - bound.estimateSI),
        Math.abs(bound.estimateSI - bound.intervalLowerSI),
      ) / bound.normalizationScaleSI
    );
  });
  const maximumRelativeHalfWidth95 =
    relativeHalfWidths.length > 0 &&
    relativeHalfWidths.every((value): value is number => value != null)
      ? Math.max(...relativeHalfWidths)
      : null;

  return {
    generatedAt: asText(root.generatedAt),
    laneId: asText(root.laneId),
    selectedProfileId: asText(root.selectedProfileId),
    runId: asText(root.runId),
    fieldState: {
      ...normalizeStateIdentity(fieldState),
      fieldModelId: asText(fieldState.fieldModelId),
      fieldModelClass: asText(fieldState.fieldModelClass),
      stateArtifact: normalizeNumericalArtifact(fieldState.stateArtifact),
      lagrangian: normalizeArtifact(fieldState.lagrangian),
      equationsOfMotion: normalizeArtifact(fieldState.equationsOfMotion),
      stateConstruction: normalizeArtifact(fieldState.stateConstruction),
      backgroundGeometry: normalizeArtifact(fieldState.backgroundGeometry),
      fieldEquationResidualLInf: toFinite(fieldState.fieldEquationResidualLInf),
      fieldEquationToleranceLInf: toFinite(
        fieldState.fieldEquationToleranceLInf,
      ),
      sampleCount: toFinite(fieldState.sampleCount),
    },
    admissibility: {
      ...normalizeStateIdentity(admissibility),
      criterion: normalizeCriterion(admissibility.criterion),
      analysis: normalizeArtifact(admissibility.analysis),
      twoPointFunction: normalizeNumericalArtifact(
        admissibility.twoPointFunction,
      ),
      equivalenceTheorem: normalizeArtifact(admissibility.equivalenceTheorem),
      criterionSatisfied: toBoolean(admissibility.criterionSatisfied),
    },
    renormalization: {
      ...normalizeStateIdentity(renormalization),
      scheme: normalizeScheme(renormalization.scheme),
      prescription: normalizeArtifact(renormalization.prescription),
      counterterms: normalizeArtifact(renormalization.counterterms),
      finiteRenormalization: normalizeArtifact(
        renormalization.finiteRenormalization,
      ),
      countertermsFixed: toBoolean(renormalization.countertermsFixed),
      finiteFreedomResolved: toBoolean(renormalization.finiteFreedomResolved),
    },
    stressTensor: {
      ...normalizeStateIdentity(stressTensor),
      tensor: normalizeNumericalArtifact(stressTensor.tensor),
      chartId: asText(stressTensor.chartId),
      basis: asText(stressTensor.basis),
      unit: stressTensor.unit === "J/m^3" ? "J/m^3" : null,
      symmetryVerified: toBoolean(stressTensor.symmetryVerified),
      components: components.map((value) => {
        const component = asRecord(value);
        return {
          component: normalizeComponent(component.component),
          evidence: normalizeNumericalArtifact(component.evidence),
          sampleCount: toFinite(component.sampleCount),
          renormalized: toBoolean(component.renormalized),
          finite: toBoolean(component.finite),
        };
      }),
    },
    wardIdentity: {
      ...normalizeStateIdentity(wardIdentity),
      evidence: normalizeArtifact(wardIdentity.evidence),
      divergenceSamples: normalizeNumericalArtifact(
        wardIdentity.divergenceSamples,
      ),
      sampleCount: toFinite(wardIdentity.sampleCount),
      covariantDerivativeDefined: toBoolean(
        wardIdentity.covariantDerivativeDefined,
      ),
      divergenceResidualLInf: toFinite(wardIdentity.divergenceResidualLInf),
      toleranceLInf: toFinite(wardIdentity.toleranceLInf),
    },
    qeiBinding: {
      ...normalizeStateIdentity(qeiBinding),
      dossier: normalizeArtifact(qeiBinding.dossier),
      boundReceipt: normalizeArtifact(qeiBinding.boundReceipt),
      worldlineSet: normalizeArtifact(qeiBinding.worldlineSet),
      sampledWorldlineSetSha256: asText(qeiBinding.sampledWorldlineSetSha256),
      boundWorldlineSetSha256: asText(qeiBinding.boundWorldlineSetSha256),
      worldlineCount: toFinite(qeiBinding.worldlineCount),
      allWorldlinesEvaluated: toBoolean(qeiBinding.allWorldlinesEvaluated),
      minimumMarginSI: toFinite(qeiBinding.minimumMarginSI),
      marginAbsoluteUncertaintySI: toFinite(
        qeiBinding.marginAbsoluteUncertaintySI,
      ),
    },
    preparationSwitching: {
      ...normalizeStateIdentity(preparationSwitching),
      protocol: normalizeArtifact(preparationSwitching.protocol),
      switchingFunction: normalizeArtifact(
        preparationSwitching.switchingFunction,
      ),
      dynamicSolution: normalizeNumericalArtifact(
        preparationSwitching.dynamicSolution,
      ),
      smoothness: normalizeSmoothness(preparationSwitching.smoothness),
      compatibleWithStateConstruction: toBoolean(
        preparationSwitching.compatibleWithStateConstruction,
      ),
      boundaryConditionsSatisfied: toBoolean(
        preparationSwitching.boundaryConditionsSatisfied,
      ),
      fieldEquationResidualLInf: toFinite(
        preparationSwitching.fieldEquationResidualLInf,
      ),
      fieldEquationToleranceLInf: toFinite(
        preparationSwitching.fieldEquationToleranceLInf,
      ),
      conservationResidualLInf: toFinite(
        preparationSwitching.conservationResidualLInf,
      ),
      conservationToleranceLInf: toFinite(
        preparationSwitching.conservationToleranceLInf,
      ),
    },
    uncertaintyBudget: {
      budget: normalizeArtifact(uncertaintyBudget.budget),
      maximumRelativeHalfWidth95,
      bounds: normalizedUncertaintyBounds,
    },
    backreaction: {
      ...normalizeStateIdentity(backreaction),
      evidence: normalizeArtifact(backreaction.evidence),
      geometry: normalizeNumericalArtifact(backreaction.geometry),
      sourceTensor: normalizeNumericalArtifact(backreaction.sourceTensor),
      sampleCount: toFinite(backreaction.sampleCount),
      selfConsistentIterations: toFinite(backreaction.selfConsistentIterations),
      converged: toBoolean(backreaction.converged),
      einsteinResidualLInf: toFinite(backreaction.einsteinResidualLInf),
      einsteinToleranceLInf: toFinite(backreaction.einsteinToleranceLInf),
      constraintResidualLInf: toFinite(backreaction.constraintResidualLInf),
      constraintToleranceLInf: toFinite(backreaction.constraintToleranceLInf),
    },
    provenance: {
      producer: asText(provenance.producer),
      producerVersion: asText(provenance.producerVersion),
      implementationId: asText(provenance.implementationId),
      solverId: asText(provenance.solverId),
      solverVersion: asText(provenance.solverVersion),
      gitSha: asText(provenance.gitSha),
      solver: normalizeArtifact(provenance.solver),
      environment: normalizeArtifact(provenance.environment),
      invocation: normalizeArtifact(provenance.invocation),
      inputManifest: normalizeArtifact(provenance.inputManifest),
      command: asText(provenance.command),
      argv: Array.isArray(provenance.argv)
        ? provenance.argv
            .map(asText)
            .filter((entry): entry is string => entry != null)
        : [],
      workingDirectory: asText(provenance.workingDirectory),
      outputDirectory: asText(provenance.outputDirectory),
      requestId: asText(provenance.requestId),
      runId: asText(provenance.runId),
      receiptId: asText(provenance.receiptId),
      runtimeId: asText(provenance.runtimeId),
      deterministicSeed: asText(provenance.deterministicSeed),
      startedAt: asText(provenance.startedAt),
      completedAt: asText(provenance.completedAt),
      runSpecificOutput: toBoolean(provenance.runSpecificOutput),
    },
  };
};

const draft = (gateId: Nhm2SemiclassicalRealizabilityGateId): GateDraft => ({
  gateId,
  missing: [],
  failures: [],
});

const requireText = (
  value: string | null,
  blocker: string,
  gate: GateDraft,
): void => {
  if (value == null) gate.missing.push(blocker);
};

const requireHash = (
  value: string | null,
  prefix: string,
  gate: GateDraft,
): void => {
  if (value == null) gate.missing.push(`${prefix}_sha256_missing`);
  else if (!SHA256_PATTERN.test(value))
    gate.failures.push(`${prefix}_sha256_invalid`);
};

const requireArtifact = (
  value: Nhm2SemiclassicalArtifactIdentityV1,
  prefix: string,
  gate: GateDraft,
): void => {
  requireText(value.ref, `${prefix}_ref_missing`, gate);
  requireHash(value.sha256, prefix, gate);
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
    elements *= extent;
    if (
      !Number.isSafeInteger(elements) ||
      elements > Number.MAX_SAFE_INTEGER / 8
    ) {
      return null;
    }
  }
  return elements * 8;
};

const requireNumericalArtifact = (
  value: Nhm2SemiclassicalNumericalArtifactV1,
  prefix: string,
  gate: GateDraft,
  expectedComponentOrder?: readonly string[],
): void => {
  requireArtifact(value, prefix, gate);
  if (value.dtype == null) gate.missing.push(`${prefix}_dtype_missing`);
  if (value.binaryEncoding == null)
    gate.missing.push(`${prefix}_binary_encoding_missing`);
  if (value.endianness == null)
    gate.missing.push(`${prefix}_endianness_missing`);
  if (value.storageOrder == null)
    gate.missing.push(`${prefix}_storage_order_missing`);
  const expectedBytes = expectedFloat64SizeBytes(value.shape);
  if (value.shape.length === 0) gate.missing.push(`${prefix}_shape_missing`);
  else if (expectedBytes == null) gate.failures.push(`${prefix}_shape_invalid`);
  if (value.sizeBytes == null)
    gate.missing.push(`${prefix}_size_bytes_missing`);
  else if (!Number.isSafeInteger(value.sizeBytes) || value.sizeBytes <= 0)
    gate.failures.push(`${prefix}_size_bytes_invalid`);
  else if (expectedBytes != null && value.sizeBytes !== expectedBytes)
    gate.failures.push(`${prefix}_size_bytes_shape_mismatch`);
  if (value.componentOrder.length === 0)
    gate.missing.push(`${prefix}_component_order_missing`);
  else if (new Set(value.componentOrder).size !== value.componentOrder.length)
    gate.failures.push(`${prefix}_component_order_duplicate`);
  if (
    expectedComponentOrder != null &&
    value.componentOrder.length > 0 &&
    (value.componentOrder.length !== expectedComponentOrder.length ||
      value.componentOrder.some(
        (component, index) => component !== expectedComponentOrder[index],
      ))
  ) {
    gate.failures.push(`${prefix}_component_order_mismatch`);
  }
  requireText(value.unit, `${prefix}_unit_missing`, gate);
};

const requireBooleanTrue = (
  value: boolean | null,
  prefix: string,
  gate: GateDraft,
): void => {
  if (value == null) gate.missing.push(`${prefix}_missing`);
  else if (!value) gate.failures.push(`${prefix}_failed`);
};

const requirePositiveInteger = (
  value: number | null,
  prefix: string,
  gate: GateDraft,
): void => {
  if (value == null) gate.missing.push(`${prefix}_missing`);
  else if (!Number.isInteger(value) || value <= 0)
    gate.failures.push(`${prefix}_invalid`);
};

const requireMinimumInteger = (
  value: number | null,
  minimum: number,
  prefix: string,
  gate: GateDraft,
): void => {
  requirePositiveInteger(value, prefix, gate);
  if (
    value != null &&
    Number.isInteger(value) &&
    value > 0 &&
    value < minimum
  ) {
    gate.failures.push(`${prefix}_below_minimum`);
  }
};

const requireArrayCoverage = (
  value: Nhm2SemiclassicalNumericalArtifactV1,
  prefix: string,
  gate: GateDraft,
  input: {
    minimumFirstAxis: number;
    rank?: number;
    finalAxis?: number;
  },
): void => {
  if (value.shape.length === 0) return;
  if (input.rank != null && value.shape.length !== input.rank) {
    gate.failures.push(`${prefix}_rank_mismatch`);
  }
  if (value.shape[0] < input.minimumFirstAxis) {
    gate.failures.push(`${prefix}_first_axis_below_minimum`);
  }
  if (
    input.finalAxis != null &&
    value.shape[value.shape.length - 1] !== input.finalAxis
  ) {
    gate.failures.push(`${prefix}_final_axis_mismatch`);
  }
};

const requireFirstAxisMatches = (
  value: Nhm2SemiclassicalNumericalArtifactV1,
  expected: number | null,
  prefix: string,
  gate: GateDraft,
): void => {
  if (
    expected != null &&
    value.shape.length > 0 &&
    value.shape[0] !== expected
  ) {
    gate.failures.push(`${prefix}_sample_count_mismatch`);
  }
};

const requireResidualWithinTolerance = (
  residual: number | null,
  tolerance: number | null,
  prefix: string,
  gate: GateDraft,
): void => {
  if (residual == null) gate.missing.push(`${prefix}_residual_missing`);
  else if (residual < 0) gate.failures.push(`${prefix}_residual_invalid`);
  if (tolerance == null) gate.missing.push(`${prefix}_tolerance_missing`);
  else if (tolerance <= 0) gate.failures.push(`${prefix}_tolerance_invalid`);
  if (
    residual != null &&
    residual >= 0 &&
    tolerance != null &&
    tolerance > 0 &&
    residual > tolerance
  ) {
    gate.failures.push(`${prefix}_residual_exceeds_tolerance`);
  }
};

const requireStateBinding = (
  state: Nhm2SemiclassicalStateIdentityV1,
  fieldState: Nhm2SemiclassicalStateIdentityV1,
  prefix: string,
  gate: GateDraft,
): void => {
  requireText(state.stateId, `${prefix}_state_id_missing`, gate);
  requireHash(state.stateSha256, `${prefix}_state`, gate);
  if (
    state.stateId != null &&
    fieldState.stateId != null &&
    state.stateId !== fieldState.stateId
  ) {
    gate.failures.push(`${prefix}_state_id_mismatch`);
  }
  if (
    state.stateSha256 != null &&
    fieldState.stateSha256 != null &&
    state.stateSha256 !== fieldState.stateSha256
  ) {
    gate.failures.push(`${prefix}_state_sha256_mismatch`);
  }
};

const finalizeGate = (
  gate: GateDraft,
): Nhm2SemiclassicalStateRealizabilityV1["gates"][number] => {
  const blockers = uniqueText([...gate.failures, ...gate.missing]);
  return {
    gateId: gate.gateId,
    status:
      gate.failures.length > 0
        ? "fail"
        : gate.missing.length > 0
          ? "blocked"
          : "pass",
    blockers,
  };
};

const deriveGates = (
  evidence: PrimitiveEvidence,
): Nhm2SemiclassicalStateRealizabilityV1["gates"] => {
  const field = draft("field_state_construction");
  requireText(
    evidence.fieldState.fieldModelId,
    "field_model_id_missing",
    field,
  );
  requireText(
    evidence.fieldState.fieldModelClass,
    "field_model_class_missing",
    field,
  );
  requireText(evidence.fieldState.stateId, "field_state_id_missing", field);
  requireHash(evidence.fieldState.stateSha256, "field_state", field);
  requireNumericalArtifact(
    evidence.fieldState.stateArtifact,
    "field_state_artifact",
    field,
  );
  requireArrayCoverage(
    evidence.fieldState.stateArtifact,
    "field_state_artifact",
    field,
    {
      minimumFirstAxis:
        NHM2_SEMICLASSICAL_DIAGNOSTIC_COVERAGE_POLICY.minimumSpatialSampleCount,
    },
  );
  requireArtifact(evidence.fieldState.lagrangian, "field_lagrangian", field);
  requireArtifact(
    evidence.fieldState.equationsOfMotion,
    "field_equations_of_motion",
    field,
  );
  requireArtifact(
    evidence.fieldState.stateConstruction,
    "field_state_construction",
    field,
  );
  requireArtifact(
    evidence.fieldState.backgroundGeometry,
    "field_background_geometry",
    field,
  );
  requireMinimumInteger(
    evidence.fieldState.sampleCount,
    NHM2_SEMICLASSICAL_DIAGNOSTIC_COVERAGE_POLICY.minimumSpatialSampleCount,
    "field_state_sample_count",
    field,
  );
  requireFirstAxisMatches(
    evidence.fieldState.stateArtifact,
    evidence.fieldState.sampleCount,
    "field_state_artifact",
    field,
  );
  requireResidualWithinTolerance(
    evidence.fieldState.fieldEquationResidualLInf,
    evidence.fieldState.fieldEquationToleranceLInf,
    "field_equation",
    field,
  );
  if (
    evidence.fieldState.stateSha256 != null &&
    evidence.fieldState.stateArtifact.sha256 != null &&
    evidence.fieldState.stateSha256 !== evidence.fieldState.stateArtifact.sha256
  ) {
    field.failures.push("field_state_hash_not_state_artifact_hash");
  }

  const admissibility = draft("state_admissibility");
  requireStateBinding(
    evidence.admissibility,
    evidence.fieldState,
    "admissibility",
    admissibility,
  );
  if (evidence.admissibility.criterion == null) {
    admissibility.missing.push("state_admissibility_criterion_missing");
  }
  requireArtifact(
    evidence.admissibility.analysis,
    "state_admissibility_analysis",
    admissibility,
  );
  requireNumericalArtifact(
    evidence.admissibility.twoPointFunction,
    "state_two_point_function",
    admissibility,
    ["real", "imaginary"],
  );
  requireArrayCoverage(
    evidence.admissibility.twoPointFunction,
    "state_two_point_function",
    admissibility,
    {
      minimumFirstAxis:
        NHM2_SEMICLASSICAL_DIAGNOSTIC_COVERAGE_POLICY.minimumSpatialSampleCount,
      rank: 3,
      finalAxis: 2,
    },
  );
  if (
    evidence.fieldState.sampleCount != null &&
    evidence.admissibility.twoPointFunction.shape.length === 3 &&
    (evidence.admissibility.twoPointFunction.shape[0] !==
      evidence.fieldState.sampleCount ||
      evidence.admissibility.twoPointFunction.shape[1] !==
        evidence.fieldState.sampleCount)
  ) {
    admissibility.failures.push(
      "state_two_point_function_sample_count_mismatch",
    );
  }
  if (evidence.admissibility.criterion === "equivalent") {
    requireArtifact(
      evidence.admissibility.equivalenceTheorem,
      "state_admissibility_equivalence_theorem",
      admissibility,
    );
  }
  requireBooleanTrue(
    evidence.admissibility.criterionSatisfied,
    "state_admissibility_criterion",
    admissibility,
  );

  const renormalization = draft("renormalization_counterterms");
  requireStateBinding(
    evidence.renormalization,
    evidence.fieldState,
    "renormalization",
    renormalization,
  );
  if (evidence.renormalization.scheme == null) {
    renormalization.missing.push("renormalization_scheme_missing");
  }
  requireArtifact(
    evidence.renormalization.prescription,
    "renormalization_prescription",
    renormalization,
  );
  requireArtifact(
    evidence.renormalization.counterterms,
    "renormalization_counterterms",
    renormalization,
  );
  requireArtifact(
    evidence.renormalization.finiteRenormalization,
    "finite_renormalization",
    renormalization,
  );
  requireBooleanTrue(
    evidence.renormalization.countertermsFixed,
    "renormalization_counterterms_fixed",
    renormalization,
  );
  requireBooleanTrue(
    evidence.renormalization.finiteFreedomResolved,
    "finite_renormalization_freedom_resolved",
    renormalization,
  );

  const stressTensor = draft("renormalized_stress_tensor");
  requireStateBinding(
    evidence.stressTensor,
    evidence.fieldState,
    "stress_tensor",
    stressTensor,
  );
  requireNumericalArtifact(
    evidence.stressTensor.tensor,
    "renormalized_stress_tensor",
    stressTensor,
    NHM2_SEMICLASSICAL_TENSOR_COMPONENTS,
  );
  requireArrayCoverage(
    evidence.stressTensor.tensor,
    "renormalized_stress_tensor",
    stressTensor,
    {
      minimumFirstAxis:
        NHM2_SEMICLASSICAL_DIAGNOSTIC_COVERAGE_POLICY.minimumSpatialSampleCount,
      rank: 2,
      finalAxis: NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length,
    },
  );
  requireFirstAxisMatches(
    evidence.stressTensor.tensor,
    evidence.fieldState.sampleCount,
    "renormalized_stress_tensor",
    stressTensor,
  );
  requireText(
    evidence.stressTensor.chartId,
    "stress_tensor_chart_missing",
    stressTensor,
  );
  requireText(
    evidence.stressTensor.basis,
    "stress_tensor_basis_missing",
    stressTensor,
  );
  if (evidence.stressTensor.unit !== "J/m^3") {
    stressTensor.missing.push("stress_tensor_unit_missing");
  }
  requireBooleanTrue(
    evidence.stressTensor.symmetryVerified,
    "stress_tensor_symmetry",
    stressTensor,
  );
  if (evidence.stressTensor.components.length === 0) {
    stressTensor.missing.push("renormalized_stress_tensor_components_missing");
  }
  const componentCounts = new Map<Nhm2SemiclassicalTensorComponent, number>();
  evidence.stressTensor.components.forEach((component, index) => {
    const prefix = `stress_tensor_component_${index}`;
    if (component.component == null)
      stressTensor.missing.push(`${prefix}_id_missing`);
    else
      componentCounts.set(
        component.component,
        (componentCounts.get(component.component) ?? 0) + 1,
      );
    requireNumericalArtifact(
      component.evidence,
      `${prefix}_evidence`,
      stressTensor,
      component.component == null ? undefined : [component.component],
    );
    requireArrayCoverage(
      component.evidence,
      `${prefix}_evidence`,
      stressTensor,
      {
        minimumFirstAxis:
          NHM2_SEMICLASSICAL_DIAGNOSTIC_COVERAGE_POLICY.minimumSpatialSampleCount,
        rank: 1,
      },
    );
    requireMinimumInteger(
      component.sampleCount,
      NHM2_SEMICLASSICAL_DIAGNOSTIC_COVERAGE_POLICY.minimumSpatialSampleCount,
      `${prefix}_sample_count`,
      stressTensor,
    );
    requireFirstAxisMatches(
      component.evidence,
      component.sampleCount,
      `${prefix}_evidence`,
      stressTensor,
    );
    if (
      component.sampleCount != null &&
      evidence.fieldState.sampleCount != null &&
      component.sampleCount !== evidence.fieldState.sampleCount
    ) {
      stressTensor.failures.push(`${prefix}_field_sample_count_mismatch`);
    }
    requireBooleanTrue(
      component.renormalized,
      `${prefix}_renormalized`,
      stressTensor,
    );
    requireBooleanTrue(component.finite, `${prefix}_finite`, stressTensor);
  });
  for (const component of NHM2_SEMICLASSICAL_TENSOR_COMPONENTS) {
    const count = componentCounts.get(component) ?? 0;
    if (count === 0)
      stressTensor.missing.push(`stress_tensor_${component}_missing`);
    if (count > 1)
      stressTensor.failures.push(`stress_tensor_${component}_duplicate`);
  }

  const ward = draft("ward_identity_conservation");
  requireStateBinding(
    evidence.wardIdentity,
    evidence.fieldState,
    "ward_identity",
    ward,
  );
  requireArtifact(
    evidence.wardIdentity.evidence,
    "ward_identity_evidence",
    ward,
  );
  requireNumericalArtifact(
    evidence.wardIdentity.divergenceSamples,
    "ward_identity_divergence_samples",
    ward,
    NHM2_SEMICLASSICAL_WARD_COMPONENTS,
  );
  requireArrayCoverage(
    evidence.wardIdentity.divergenceSamples,
    "ward_identity_divergence_samples",
    ward,
    {
      minimumFirstAxis:
        NHM2_SEMICLASSICAL_DIAGNOSTIC_COVERAGE_POLICY.minimumSpatialSampleCount,
      rank: 2,
      finalAxis: NHM2_SEMICLASSICAL_WARD_COMPONENTS.length,
    },
  );
  requireMinimumInteger(
    evidence.wardIdentity.sampleCount,
    NHM2_SEMICLASSICAL_DIAGNOSTIC_COVERAGE_POLICY.minimumSpatialSampleCount,
    "ward_identity_sample_count",
    ward,
  );
  requireFirstAxisMatches(
    evidence.wardIdentity.divergenceSamples,
    evidence.wardIdentity.sampleCount,
    "ward_identity_divergence_samples",
    ward,
  );
  requireBooleanTrue(
    evidence.wardIdentity.covariantDerivativeDefined,
    "ward_identity_covariant_derivative",
    ward,
  );
  requireResidualWithinTolerance(
    evidence.wardIdentity.divergenceResidualLInf,
    evidence.wardIdentity.toleranceLInf,
    "ward_identity_divergence",
    ward,
  );

  const qei = draft("qei_same_state_worldline_binding");
  requireStateBinding(evidence.qeiBinding, evidence.fieldState, "qei", qei);
  requireArtifact(evidence.qeiBinding.dossier, "qei_dossier", qei);
  requireArtifact(evidence.qeiBinding.boundReceipt, "qei_bound_receipt", qei);
  requireArtifact(evidence.qeiBinding.worldlineSet, "qei_worldline_set", qei);
  requireHash(
    evidence.qeiBinding.sampledWorldlineSetSha256,
    "qei_sampled_worldline_set",
    qei,
  );
  requireHash(
    evidence.qeiBinding.boundWorldlineSetSha256,
    "qei_bound_worldline_set",
    qei,
  );
  if (
    evidence.qeiBinding.sampledWorldlineSetSha256 != null &&
    evidence.qeiBinding.boundWorldlineSetSha256 != null &&
    evidence.qeiBinding.sampledWorldlineSetSha256 !==
      evidence.qeiBinding.boundWorldlineSetSha256
  ) {
    qei.failures.push("qei_worldline_set_hash_mismatch");
  }
  requireMinimumInteger(
    evidence.qeiBinding.worldlineCount,
    NHM2_SEMICLASSICAL_DIAGNOSTIC_COVERAGE_POLICY.minimumWorldlineCount,
    "qei_worldline_count",
    qei,
  );
  requireBooleanTrue(
    evidence.qeiBinding.allWorldlinesEvaluated,
    "qei_all_worldlines_evaluated",
    qei,
  );
  if (evidence.qeiBinding.minimumMarginSI == null) {
    qei.missing.push("qei_minimum_margin_missing");
  }
  if (evidence.qeiBinding.marginAbsoluteUncertaintySI == null) {
    qei.missing.push("qei_margin_uncertainty_missing");
  } else if (evidence.qeiBinding.marginAbsoluteUncertaintySI < 0) {
    qei.failures.push("qei_margin_uncertainty_invalid");
  }
  if (
    evidence.qeiBinding.minimumMarginSI != null &&
    evidence.qeiBinding.marginAbsoluteUncertaintySI != null &&
    evidence.qeiBinding.marginAbsoluteUncertaintySI >= 0 &&
    evidence.qeiBinding.minimumMarginSI -
      evidence.qeiBinding.marginAbsoluteUncertaintySI <
      0
  ) {
    qei.failures.push("qei_uncertainty_adjusted_margin_negative");
  }

  const preparation = draft("preparation_switching_compatibility");
  requireStateBinding(
    evidence.preparationSwitching,
    evidence.fieldState,
    "preparation_switching",
    preparation,
  );
  requireArtifact(
    evidence.preparationSwitching.protocol,
    "preparation_protocol",
    preparation,
  );
  requireArtifact(
    evidence.preparationSwitching.switchingFunction,
    "preparation_switching_function",
    preparation,
  );
  requireNumericalArtifact(
    evidence.preparationSwitching.dynamicSolution,
    "preparation_dynamic_solution",
    preparation,
  );
  requireArrayCoverage(
    evidence.preparationSwitching.dynamicSolution,
    "preparation_dynamic_solution",
    preparation,
    {
      minimumFirstAxis:
        NHM2_SEMICLASSICAL_DIAGNOSTIC_COVERAGE_POLICY.minimumSpatialSampleCount,
    },
  );
  if (evidence.preparationSwitching.smoothness == null) {
    preparation.missing.push("preparation_switching_smoothness_missing");
  }
  requireBooleanTrue(
    evidence.preparationSwitching.compatibleWithStateConstruction,
    "preparation_state_construction_compatibility",
    preparation,
  );
  requireBooleanTrue(
    evidence.preparationSwitching.boundaryConditionsSatisfied,
    "preparation_boundary_conditions",
    preparation,
  );
  requireResidualWithinTolerance(
    evidence.preparationSwitching.fieldEquationResidualLInf,
    evidence.preparationSwitching.fieldEquationToleranceLInf,
    "preparation_field_equation",
    preparation,
  );
  requireResidualWithinTolerance(
    evidence.preparationSwitching.conservationResidualLInf,
    evidence.preparationSwitching.conservationToleranceLInf,
    "preparation_conservation",
    preparation,
  );

  const uncertainty = draft("uncertainty_bounds");
  requireArtifact(
    evidence.uncertaintyBudget.budget,
    "uncertainty_budget",
    uncertainty,
  );
  if (evidence.uncertaintyBudget.bounds.length === 0) {
    uncertainty.missing.push("uncertainty_bounds_missing");
  }
  if (evidence.uncertaintyBudget.maximumRelativeHalfWidth95 == null) {
    uncertainty.missing.push(
      "uncertainty_maximum_relative_half_width_95_missing",
    );
  }
  const uncertaintyCounts = new Map<
    Nhm2SemiclassicalUncertaintyQuantity,
    number
  >();
  evidence.uncertaintyBudget.bounds.forEach((bound, index) => {
    const prefix = `uncertainty_bound_${index}`;
    if (bound.quantity == null)
      uncertainty.missing.push(`${prefix}_quantity_missing`);
    else
      uncertaintyCounts.set(
        bound.quantity,
        (uncertaintyCounts.get(bound.quantity) ?? 0) + 1,
      );
    requireText(bound.unit, `${prefix}_unit_missing`, uncertainty);
    requireArtifact(bound.method, `${prefix}_method`, uncertainty);
    requireNumericalArtifact(
      bound.rawSamples,
      `${prefix}_raw_samples`,
      uncertainty,
      bound.quantity == null ? undefined : [bound.quantity],
    );
    const values = [
      [bound.estimateSI, "estimate"],
      [bound.intervalLowerSI, "interval_lower"],
      [bound.intervalUpperSI, "interval_upper"],
      [bound.acceptanceLowerSI, "acceptance_lower"],
      [bound.acceptanceUpperSI, "acceptance_upper"],
      [bound.confidenceLevel, "confidence_level"],
      [bound.normalizationScaleSI, "normalization_scale"],
    ] as const;
    for (const [value, label] of values) {
      if (value == null) uncertainty.missing.push(`${prefix}_${label}_missing`);
    }
    if (
      bound.intervalLowerSI != null &&
      bound.intervalUpperSI != null &&
      bound.intervalLowerSI > bound.intervalUpperSI
    ) {
      uncertainty.failures.push(`${prefix}_interval_invalid`);
    }
    if (
      bound.acceptanceLowerSI != null &&
      bound.acceptanceUpperSI != null &&
      bound.acceptanceLowerSI > bound.acceptanceUpperSI
    ) {
      uncertainty.failures.push(`${prefix}_acceptance_interval_invalid`);
    }
    if (
      bound.estimateSI != null &&
      bound.intervalLowerSI != null &&
      bound.intervalUpperSI != null &&
      (bound.estimateSI < bound.intervalLowerSI ||
        bound.estimateSI > bound.intervalUpperSI)
    ) {
      uncertainty.failures.push(`${prefix}_estimate_outside_interval`);
    }
    if (
      bound.intervalLowerSI != null &&
      bound.intervalUpperSI != null &&
      bound.acceptanceLowerSI != null &&
      bound.acceptanceUpperSI != null &&
      (bound.intervalLowerSI < bound.acceptanceLowerSI ||
        bound.intervalUpperSI > bound.acceptanceUpperSI)
    ) {
      uncertainty.failures.push(`${prefix}_interval_outside_acceptance`);
    }
    if (
      bound.confidenceLevel != null &&
      (bound.confidenceLevel < 0.95 || bound.confidenceLevel >= 1)
    ) {
      uncertainty.failures.push(`${prefix}_confidence_below_policy`);
    }
    if (
      bound.normalizationScaleSI != null &&
      !(bound.normalizationScaleSI > 0)
    ) {
      uncertainty.failures.push(`${prefix}_normalization_scale_invalid`);
    }
    const rawSampleCount =
      bound.rawSamples.shape.length > 0 ? bound.rawSamples.shape[0] : null;
    if (
      rawSampleCount != null &&
      rawSampleCount <
        NHM2_SEMICLASSICAL_DIAGNOSTIC_COVERAGE_POLICY.minimumUncertaintySampleCount
    ) {
      uncertainty.failures.push(`${prefix}_raw_sample_count_below_minimum`);
    }
  });
  for (const quantity of NHM2_SEMICLASSICAL_UNCERTAINTY_QUANTITIES) {
    const count = uncertaintyCounts.get(quantity) ?? 0;
    if (count === 0)
      uncertainty.missing.push(`uncertainty_${quantity}_missing`);
    if (count > 1)
      uncertainty.failures.push(`uncertainty_${quantity}_duplicate`);
  }

  const backreaction = draft("semiclassical_backreaction_consistency");
  requireStateBinding(
    evidence.backreaction,
    evidence.fieldState,
    "backreaction",
    backreaction,
  );
  requireFirstAxisMatches(
    evidence.backreaction.geometry,
    evidence.backreaction.sampleCount,
    "backreaction_geometry",
    backreaction,
  );
  requireFirstAxisMatches(
    evidence.backreaction.sourceTensor,
    evidence.backreaction.sampleCount,
    "backreaction_source_tensor",
    backreaction,
  );
  requireArtifact(
    evidence.backreaction.evidence,
    "backreaction_evidence",
    backreaction,
  );
  requireNumericalArtifact(
    evidence.backreaction.geometry,
    "backreaction_geometry",
    backreaction,
  );
  requireArrayCoverage(
    evidence.backreaction.geometry,
    "backreaction_geometry",
    backreaction,
    {
      minimumFirstAxis:
        NHM2_SEMICLASSICAL_DIAGNOSTIC_COVERAGE_POLICY.minimumSpatialSampleCount,
    },
  );
  requireNumericalArtifact(
    evidence.backreaction.sourceTensor,
    "backreaction_source_tensor",
    backreaction,
    NHM2_SEMICLASSICAL_TENSOR_COMPONENTS,
  );
  requireArrayCoverage(
    evidence.backreaction.sourceTensor,
    "backreaction_source_tensor",
    backreaction,
    {
      minimumFirstAxis:
        NHM2_SEMICLASSICAL_DIAGNOSTIC_COVERAGE_POLICY.minimumSpatialSampleCount,
      rank: 2,
      finalAxis: NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length,
    },
  );
  requireMinimumInteger(
    evidence.backreaction.sampleCount,
    NHM2_SEMICLASSICAL_DIAGNOSTIC_COVERAGE_POLICY.minimumSpatialSampleCount,
    "backreaction_sample_count",
    backreaction,
  );
  requireMinimumInteger(
    evidence.backreaction.selfConsistentIterations,
    NHM2_SEMICLASSICAL_DIAGNOSTIC_COVERAGE_POLICY.minimumBackreactionIterationCount,
    "backreaction_self_consistent_iterations",
    backreaction,
  );
  requireBooleanTrue(
    evidence.backreaction.converged,
    "backreaction_convergence",
    backreaction,
  );
  requireResidualWithinTolerance(
    evidence.backreaction.einsteinResidualLInf,
    evidence.backreaction.einsteinToleranceLInf,
    "semiclassical_einstein",
    backreaction,
  );
  requireResidualWithinTolerance(
    evidence.backreaction.constraintResidualLInf,
    evidence.backreaction.constraintToleranceLInf,
    "semiclassical_constraint",
    backreaction,
  );
  if (
    evidence.backreaction.sourceTensor.ref != null &&
    evidence.stressTensor.tensor.ref != null &&
    evidence.backreaction.sourceTensor.ref !== evidence.stressTensor.tensor.ref
  ) {
    backreaction.failures.push("backreaction_source_tensor_ref_mismatch");
  }
  if (
    evidence.backreaction.sourceTensor.sha256 != null &&
    evidence.stressTensor.tensor.sha256 != null &&
    evidence.backreaction.sourceTensor.sha256 !==
      evidence.stressTensor.tensor.sha256
  ) {
    backreaction.failures.push("backreaction_source_tensor_sha256_mismatch");
  }

  const provenance = draft("provenance_integrity");
  requireText(evidence.generatedAt, "generated_at_missing", provenance);
  requireText(evidence.laneId, "lane_id_missing", provenance);
  requireText(
    evidence.selectedProfileId,
    "selected_profile_id_missing",
    provenance,
  );
  requireText(evidence.runId, "run_id_missing", provenance);
  requireText(evidence.provenance.producer, "producer_missing", provenance);
  requireText(
    evidence.provenance.producerVersion,
    "producer_version_missing",
    provenance,
  );
  requireText(
    evidence.provenance.implementationId,
    "implementation_id_missing",
    provenance,
  );
  requireText(evidence.provenance.solverId, "solver_id_missing", provenance);
  requireText(
    evidence.provenance.solverVersion,
    "solver_version_missing",
    provenance,
  );
  if (evidence.provenance.gitSha == null)
    provenance.missing.push("git_sha_missing");
  else if (!GIT_SHA_PATTERN.test(evidence.provenance.gitSha))
    provenance.failures.push("git_sha_invalid");
  requireArtifact(evidence.provenance.solver, "solver", provenance);
  requireArtifact(evidence.provenance.environment, "environment", provenance);
  requireArtifact(evidence.provenance.invocation, "invocation", provenance);
  requireArtifact(
    evidence.provenance.inputManifest,
    "input_manifest",
    provenance,
  );
  requireText(evidence.provenance.command, "command_missing", provenance);
  if (evidence.provenance.argv.length === 0) {
    provenance.missing.push("argv_missing");
  }
  requireText(
    evidence.provenance.workingDirectory,
    "working_directory_missing",
    provenance,
  );
  requireText(
    evidence.provenance.outputDirectory,
    "output_directory_missing",
    provenance,
  );
  requireText(evidence.provenance.requestId, "request_id_missing", provenance);
  requireText(evidence.provenance.receiptId, "receipt_id_missing", provenance);
  requireText(evidence.provenance.runtimeId, "runtime_id_missing", provenance);
  requireText(
    evidence.provenance.deterministicSeed,
    "deterministic_seed_missing",
    provenance,
  );
  requireText(
    evidence.provenance.runId,
    "provenance_run_id_missing",
    provenance,
  );
  if (
    evidence.runId != null &&
    evidence.provenance.runId != null &&
    evidence.runId !== evidence.provenance.runId
  ) {
    provenance.failures.push("provenance_run_id_mismatch");
  }
  requireBooleanTrue(
    evidence.provenance.runSpecificOutput,
    "run_specific_output",
    provenance,
  );
  const generatedMs =
    evidence.generatedAt == null
      ? Number.NaN
      : Date.parse(evidence.generatedAt);
  const startedMs =
    evidence.provenance.startedAt == null
      ? Number.NaN
      : Date.parse(evidence.provenance.startedAt);
  const completedMs =
    evidence.provenance.completedAt == null
      ? Number.NaN
      : Date.parse(evidence.provenance.completedAt);
  if (
    evidence.generatedAt != null &&
    (!Number.isFinite(generatedMs) ||
      new Date(generatedMs).toISOString() !== evidence.generatedAt)
  ) {
    provenance.failures.push("generated_at_invalid");
  }
  if (evidence.provenance.startedAt == null)
    provenance.missing.push("started_at_missing");
  else if (!Number.isFinite(startedMs))
    provenance.failures.push("started_at_invalid");
  if (evidence.provenance.completedAt == null)
    provenance.missing.push("completed_at_missing");
  else if (!Number.isFinite(completedMs))
    provenance.failures.push("completed_at_invalid");
  if (
    Number.isFinite(startedMs) &&
    Number.isFinite(completedMs) &&
    completedMs < startedMs
  ) {
    provenance.failures.push("execution_interval_invalid");
  }
  if (
    Number.isFinite(completedMs) &&
    Number.isFinite(generatedMs) &&
    generatedMs < completedMs
  ) {
    provenance.failures.push("artifact_generated_before_execution_completed");
  }

  return [
    field,
    admissibility,
    renormalization,
    stressTensor,
    ward,
    qei,
    preparation,
    uncertainty,
    backreaction,
    provenance,
  ].map(finalizeGate);
};

export const buildNhm2SemiclassicalStateRealizability = (
  input: BuildNhm2SemiclassicalStateRealizabilityInput = {},
): Nhm2SemiclassicalStateRealizabilityV1 => {
  const evidence = normalizePrimitiveEvidence(input);
  const gates = deriveGates(evidence);
  const status: Nhm2SemiclassicalRealizabilityStatus = gates.some(
    (gate) => gate.status === "fail",
  )
    ? "fail"
    : gates.some((gate) => gate.status === "blocked")
      ? "blocked"
      : "pass";
  const blockers = gates.flatMap((gate) =>
    gate.blockers.map((blocker) => `${gate.gateId}:${blocker}`),
  );
  return {
    contractVersion: NHM2_SEMICLASSICAL_STATE_REALIZABILITY_CONTRACT_VERSION,
    ...evidence,
    gates,
    status,
    semiclassicalStateRealizabilityReady: status === "pass",
    blockers,
    claimBoundary: {
      diagnosticOnly: true,
      physicalViability: false,
      transport: false,
      propulsion: false,
      routeEta: false,
      certifiedSpeed: false,
    },
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

export const isNhm2SemiclassicalStateRealizability = (
  value: unknown,
): value is Nhm2SemiclassicalStateRealizabilityV1 => {
  const record = isRecord(value) ? value : null;
  if (
    record == null ||
    record.contractVersion !==
      NHM2_SEMICLASSICAL_STATE_REALIZABILITY_CONTRACT_VERSION
  ) {
    return false;
  }
  const primitive: BuildNhm2SemiclassicalStateRealizabilityInput = {
    generatedAt: record.generatedAt as string | null,
    laneId: record.laneId as string | null,
    selectedProfileId: record.selectedProfileId as string | null,
    runId: record.runId as string | null,
    fieldState: record.fieldState as PrimitiveEvidence["fieldState"],
    admissibility: record.admissibility as PrimitiveEvidence["admissibility"],
    renormalization:
      record.renormalization as PrimitiveEvidence["renormalization"],
    stressTensor: record.stressTensor as PrimitiveEvidence["stressTensor"],
    wardIdentity: record.wardIdentity as PrimitiveEvidence["wardIdentity"],
    qeiBinding: record.qeiBinding as PrimitiveEvidence["qeiBinding"],
    preparationSwitching:
      record.preparationSwitching as PrimitiveEvidence["preparationSwitching"],
    uncertaintyBudget:
      record.uncertaintyBudget as PrimitiveEvidence["uncertaintyBudget"],
    backreaction: record.backreaction as PrimitiveEvidence["backreaction"],
    provenance: record.provenance as PrimitiveEvidence["provenance"],
  };
  const rebuilt = buildNhm2SemiclassicalStateRealizability(primitive);
  return (
    JSON.stringify(canonicalize(rebuilt)) ===
    JSON.stringify(canonicalize(record))
  );
};
