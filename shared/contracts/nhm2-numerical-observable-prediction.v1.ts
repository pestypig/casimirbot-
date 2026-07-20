import {
  NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS,
  type Nhm2PredictionFreezeObservableId,
} from "./nhm2-prediction-falsifier-freeze.v1";

export const NHM2_NUMERICAL_OBSERVABLE_PREDICTION_ARTIFACT_ID_PREFIX =
  "nhm2.numerical_observable_prediction";
export const NHM2_NUMERICAL_OBSERVABLE_PREDICTION_CONTRACT_VERSION =
  "nhm2_numerical_observable_prediction/v1";

export const NHM2_NUMERICAL_OBSERVABLE_PREDICTION_OBSERVABLE_IDS =
  NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS;

export const NHM2_NUMERICAL_OBSERVABLE_PREDICTION_REF_CONTRACT_VERSIONS = {
  runReceipt: "theory_runtime_receipt/v1",
  source: "nhm2_prediction_source_snapshot/v1",
  derivation: "nhm2_numerical_observable_derivation/v1",
  uncertainty: "nhm2_numerical_observable_uncertainty/v1",
} as const;

export type Nhm2NumericalObservablePredictionHashedRefV1 = {
  artifactId: string;
  path: string;
  schemaVersion: string;
  sha256: string;
};

export type Nhm2NumericalObservablePredictionSignOrPhaseV1 =
  | {
      kind: "negative" | "zero" | "positive";
      statement: string;
      expectedPhaseRadians: null;
    }
  | {
      kind: "phase";
      statement: string;
      expectedPhaseRadians: number;
    };

export type Nhm2NumericalObservablePredictionV1 = {
  artifactId: `${typeof NHM2_NUMERICAL_OBSERVABLE_PREDICTION_ARTIFACT_ID_PREFIX}.${Nhm2PredictionFreezeObservableId}`;
  contractVersion: typeof NHM2_NUMERICAL_OBSERVABLE_PREDICTION_CONTRACT_VERSION;
  generatedAt: string;
  frozenAt: string;
  dataCollectionOpensAt: string;
  binding: {
    candidateId: string;
    selectedProfileId: string;
    freezeId: string;
    modelId: string;
    parameterSetId: string;
    uncertaintyBudgetId: string;
  };
  observable: {
    observableId: Nhm2PredictionFreezeObservableId;
    definition: string;
    unit: string;
    centralValue: number;
    coverageInterval: {
      lower: number;
      upper: number;
      coverageProbability: number;
      unit: string;
    };
    signOrPhase: Nhm2NumericalObservablePredictionSignOrPhaseV1;
    scalingLaw: {
      expression: string;
      independentVariables: string[];
      validityDomain: string;
    };
    analysisWindow: string;
  };
  derivation: {
    runId: string;
    runtimeId: string;
    solverId: string;
    solverVersion: string;
    sourceCommitSha: string;
    runReceiptRef: Nhm2NumericalObservablePredictionHashedRefV1;
    sourceRef: Nhm2NumericalObservablePredictionHashedRefV1;
    derivationRef: Nhm2NumericalObservablePredictionHashedRefV1;
  };
  uncertainty: {
    uncertaintyBudgetId: string;
    method: string;
    sourceIds: string[];
    derivationRef: Nhm2NumericalObservablePredictionHashedRefV1;
  };
  provenanceBoundary: {
    theoryOnly: true;
    dataBoundary: "pre_data";
    empiricalDataUsed: false;
    diagnosticSeed: false;
  };
  claimBoundary: {
    numericalPredictionOnly: true;
    physicalPredictionAuthority: false;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
    routeEtaClaimAllowed: false;
    speedAuthorityClaimAllowed: false;
  };
};

const SHA256_HEX = /^[a-f0-9]{64}$/;
const COMMIT_SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const DUMMY_PATH_TOKEN =
  /(?:^|[._/-])(?:dummy|placeholder|unresolved|todo|tbd)(?:[._/-]|$)/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const hasOnlyKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean =>
  Object.keys(value).length === keys.length &&
  Object.keys(value).every((key) => keys.includes(key));

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim() === value && value.length > 0;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isIsoTimestamp = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const milliseconds = Date.parse(value);
  return (
    Number.isFinite(milliseconds) &&
    new Date(milliseconds).toISOString() === value
  );
};

const isObservableId = (
  value: unknown,
): value is Nhm2PredictionFreezeObservableId =>
  typeof value === "string" &&
  (
    NHM2_NUMERICAL_OBSERVABLE_PREDICTION_OBSERVABLE_IDS as readonly string[]
  ).includes(value);

const isPinnedRelativePath = (value: unknown): value is string => {
  if (!isText(value)) return false;
  if (
    value.includes("\\") ||
    value.startsWith("/") ||
    /^[a-z]:/i.test(value) ||
    /^[a-z][a-z0-9+.-]*:/i.test(value) ||
    /[?#*{}\[\]]/.test(value) ||
    DUMMY_PATH_TOKEN.test(value)
  ) {
    return false;
  }
  const segments = value.split("/");
  return (
    segments.every(
      (segment) => segment !== "" && segment !== "." && segment !== "..",
    ) && !segments.some((segment) => segment.toLowerCase() === "latest")
  );
};

const isHashedRef = (
  value: unknown,
  schemaVersion: string,
): value is Nhm2NumericalObservablePredictionHashedRefV1 => {
  if (!isRecord(value)) return false;
  return (
    hasOnlyKeys(value, ["artifactId", "path", "schemaVersion", "sha256"]) &&
    isText(value.artifactId) &&
    isPinnedRelativePath(value.path) &&
    value.schemaVersion === schemaVersion &&
    typeof value.sha256 === "string" &&
    SHA256_HEX.test(value.sha256) &&
    !/^0{64}$/.test(value.sha256)
  );
};

const distinctText = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(isText) &&
  new Set(value).size === value.length;

const signOrPhaseMatchesPrediction = (input: {
  centralValue: number;
  lower: number;
  upper: number;
  unit: string;
  signOrPhase: Record<string, unknown>;
}): boolean => {
  const { centralValue, lower, upper, unit, signOrPhase } = input;
  if (
    !hasOnlyKeys(signOrPhase, ["kind", "statement", "expectedPhaseRadians"]) ||
    !isText(signOrPhase.statement)
  ) {
    return false;
  }
  if (signOrPhase.kind === "negative") {
    return (
      signOrPhase.expectedPhaseRadians === null && centralValue < 0 && upper < 0
    );
  }
  if (signOrPhase.kind === "positive") {
    return (
      signOrPhase.expectedPhaseRadians === null && centralValue > 0 && lower > 0
    );
  }
  if (signOrPhase.kind === "zero") {
    return (
      signOrPhase.expectedPhaseRadians === null &&
      Object.is(centralValue, -0) === false &&
      centralValue === 0 &&
      lower <= 0 &&
      upper >= 0
    );
  }
  return (
    signOrPhase.kind === "phase" &&
    unit === "rad" &&
    isFiniteNumber(signOrPhase.expectedPhaseRadians) &&
    signOrPhase.expectedPhaseRadians === centralValue
  );
};

/**
 * Exact guard for one pre-data numerical prediction. The six-artifact set is
 * enforced by the enclosing prediction-freeze contract and filesystem
 * verifier; this guard makes each referenced member non-null and numerical.
 */
export const isNhm2NumericalObservablePrediction = (
  value: unknown,
): value is Nhm2NumericalObservablePredictionV1 => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "artifactId",
      "contractVersion",
      "generatedAt",
      "frozenAt",
      "dataCollectionOpensAt",
      "binding",
      "observable",
      "derivation",
      "uncertainty",
      "provenanceBoundary",
      "claimBoundary",
    ]) ||
    value.contractVersion !==
      NHM2_NUMERICAL_OBSERVABLE_PREDICTION_CONTRACT_VERSION ||
    !isIsoTimestamp(value.generatedAt) ||
    !isIsoTimestamp(value.frozenAt) ||
    !isIsoTimestamp(value.dataCollectionOpensAt) ||
    Date.parse(value.generatedAt) > Date.parse(value.frozenAt) ||
    Date.parse(value.frozenAt) >= Date.parse(value.dataCollectionOpensAt)
  ) {
    return false;
  }

  const binding = isRecord(value.binding) ? value.binding : null;
  const observable = isRecord(value.observable) ? value.observable : null;
  const derivation = isRecord(value.derivation) ? value.derivation : null;
  const uncertainty = isRecord(value.uncertainty) ? value.uncertainty : null;
  const provenanceBoundary = isRecord(value.provenanceBoundary)
    ? value.provenanceBoundary
    : null;
  const claimBoundary = isRecord(value.claimBoundary)
    ? value.claimBoundary
    : null;
  if (
    binding == null ||
    !hasOnlyKeys(binding, [
      "candidateId",
      "selectedProfileId",
      "freezeId",
      "modelId",
      "parameterSetId",
      "uncertaintyBudgetId",
    ]) ||
    !Object.values(binding).every(isText) ||
    observable == null ||
    !hasOnlyKeys(observable, [
      "observableId",
      "definition",
      "unit",
      "centralValue",
      "coverageInterval",
      "signOrPhase",
      "scalingLaw",
      "analysisWindow",
    ]) ||
    !isObservableId(observable.observableId) ||
    value.artifactId !==
      `${NHM2_NUMERICAL_OBSERVABLE_PREDICTION_ARTIFACT_ID_PREFIX}.${observable.observableId}` ||
    !isText(observable.definition) ||
    !isText(observable.unit) ||
    !isFiniteNumber(observable.centralValue) ||
    !isText(observable.analysisWindow)
  ) {
    return false;
  }

  const interval = isRecord(observable.coverageInterval)
    ? observable.coverageInterval
    : null;
  const scalingLaw = isRecord(observable.scalingLaw)
    ? observable.scalingLaw
    : null;
  const signOrPhase = isRecord(observable.signOrPhase)
    ? observable.signOrPhase
    : null;
  if (
    interval == null ||
    !hasOnlyKeys(interval, ["lower", "upper", "coverageProbability", "unit"]) ||
    !isFiniteNumber(interval.lower) ||
    !isFiniteNumber(interval.upper) ||
    !isFiniteNumber(interval.coverageProbability) ||
    interval.lower >= interval.upper ||
    observable.centralValue < interval.lower ||
    observable.centralValue > interval.upper ||
    interval.coverageProbability <= 0 ||
    interval.coverageProbability >= 1 ||
    interval.unit !== observable.unit ||
    signOrPhase == null ||
    !signOrPhaseMatchesPrediction({
      centralValue: observable.centralValue,
      lower: interval.lower,
      upper: interval.upper,
      unit: observable.unit,
      signOrPhase,
    }) ||
    scalingLaw == null ||
    !hasOnlyKeys(scalingLaw, [
      "expression",
      "independentVariables",
      "validityDomain",
    ]) ||
    !isText(scalingLaw.expression) ||
    !distinctText(scalingLaw.independentVariables) ||
    !isText(scalingLaw.validityDomain)
  ) {
    return false;
  }

  if (
    derivation == null ||
    !hasOnlyKeys(derivation, [
      "runId",
      "runtimeId",
      "solverId",
      "solverVersion",
      "sourceCommitSha",
      "runReceiptRef",
      "sourceRef",
      "derivationRef",
    ]) ||
    !isText(derivation.runId) ||
    !isText(derivation.runtimeId) ||
    !isText(derivation.solverId) ||
    !isText(derivation.solverVersion) ||
    typeof derivation.sourceCommitSha !== "string" ||
    !COMMIT_SHA.test(derivation.sourceCommitSha) ||
    !isHashedRef(
      derivation.runReceiptRef,
      NHM2_NUMERICAL_OBSERVABLE_PREDICTION_REF_CONTRACT_VERSIONS.runReceipt,
    ) ||
    !isHashedRef(
      derivation.sourceRef,
      NHM2_NUMERICAL_OBSERVABLE_PREDICTION_REF_CONTRACT_VERSIONS.source,
    ) ||
    !isHashedRef(
      derivation.derivationRef,
      NHM2_NUMERICAL_OBSERVABLE_PREDICTION_REF_CONTRACT_VERSIONS.derivation,
    ) ||
    uncertainty == null ||
    !hasOnlyKeys(uncertainty, [
      "uncertaintyBudgetId",
      "method",
      "sourceIds",
      "derivationRef",
    ]) ||
    uncertainty.uncertaintyBudgetId !== binding.uncertaintyBudgetId ||
    !isText(uncertainty.method) ||
    !distinctText(uncertainty.sourceIds) ||
    !isHashedRef(
      uncertainty.derivationRef,
      NHM2_NUMERICAL_OBSERVABLE_PREDICTION_REF_CONTRACT_VERSIONS.uncertainty,
    )
  ) {
    return false;
  }

  const provenanceRefs = [
    derivation.runReceiptRef,
    derivation.sourceRef,
    derivation.derivationRef,
    uncertainty.derivationRef,
  ] as Nhm2NumericalObservablePredictionHashedRefV1[];
  if (
    new Set(provenanceRefs.map((ref) => `${ref.path}\u0000${ref.sha256}`))
      .size !== provenanceRefs.length ||
    provenanceBoundary == null ||
    !hasOnlyKeys(provenanceBoundary, [
      "theoryOnly",
      "dataBoundary",
      "empiricalDataUsed",
      "diagnosticSeed",
    ]) ||
    provenanceBoundary.theoryOnly !== true ||
    provenanceBoundary.dataBoundary !== "pre_data" ||
    provenanceBoundary.empiricalDataUsed !== false ||
    provenanceBoundary.diagnosticSeed !== false ||
    claimBoundary == null ||
    !hasOnlyKeys(claimBoundary, [
      "numericalPredictionOnly",
      "physicalPredictionAuthority",
      "physicalViabilityClaimAllowed",
      "transportClaimAllowed",
      "propulsionClaimAllowed",
      "routeEtaClaimAllowed",
      "speedAuthorityClaimAllowed",
    ]) ||
    claimBoundary.numericalPredictionOnly !== true ||
    claimBoundary.physicalPredictionAuthority !== false ||
    claimBoundary.physicalViabilityClaimAllowed !== false ||
    claimBoundary.transportClaimAllowed !== false ||
    claimBoundary.propulsionClaimAllowed !== false ||
    claimBoundary.routeEtaClaimAllowed !== false ||
    claimBoundary.speedAuthorityClaimAllowed !== false
  ) {
    return false;
  }

  return true;
};
