import {
  NHM2_NUMERICAL_OBSERVABLE_PREDICTION_CONTRACT_VERSION,
  isNhm2NumericalObservablePrediction,
  type Nhm2NumericalObservablePredictionHashedRefV1,
  type Nhm2NumericalObservablePredictionV1,
} from "./nhm2-numerical-observable-prediction.v1";
import {
  NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS,
  type Nhm2PredictionFreezeObservableId,
} from "./nhm2-prediction-falsifier-freeze.v1";
import { sha256Nhm2CanonicalText } from "./nhm2-experiment-ready-theory-candidate-manifest.v1";
import {
  THEORY_RUNTIME_RECEIPT_ARTIFACT_ID,
  THEORY_RUNTIME_RECEIPT_SCHEMA_VERSION,
  isTheoryRuntimeReceiptV1,
  type TheoryRuntimeReceiptV1,
} from "./theory-runtime-receipt.v1";

export const NHM2_PREDICTION_BOOTSTRAP_FREEZE_ARTIFACT_ID =
  "nhm2_prediction_bootstrap_freeze" as const;
export const NHM2_PREDICTION_BOOTSTRAP_FREEZE_CONTRACT_VERSION =
  "nhm2_prediction_bootstrap_freeze/v1" as const;
export const NHM2_PREDICTION_GENERATION_CANDIDATE_CONTRACT_VERSION =
  "nhm2_prediction_generation_candidate/v1" as const;
export const NHM2_PREDICTION_GENERATION_RUN_CONTRACT_VERSION =
  "nhm2_prediction_generation_run/v1" as const;
export const NHM2_PREDICTION_CONTENT_REPLAY_CONTRACT_VERSION =
  "nhm2_prediction_content_replay/v1" as const;
export const NHM2_PREDICTION_REPRODUCTION_CANDIDATE_CONTRACT_VERSION =
  "nhm2_prediction_reproduction_candidate/v1" as const;
export const NHM2_PREDICTION_BOOTSTRAP_SET_DIGEST_DOMAIN =
  "nhm2_prediction_bootstrap_set_sha256/v1" as const;

const SOURCE_SNAPSHOT_VERSION = "nhm2_prediction_source_snapshot/v1";
const DERIVATION_VERSION = "nhm2_numerical_observable_derivation/v1";
const UNCERTAINTY_VERSION = "nhm2_numerical_observable_uncertainty/v1";
const SOURCE_CANDIDATE_ARTIFACT_ID = "nhm2_prediction_generation_candidate";
const SOURCE_RUN_ARTIFACT_ID = "nhm2_prediction_generation_run";
const REPLAY_ARTIFACT_ID = "nhm2_prediction_content_replay";
const TARGET_CANDIDATE_ARTIFACT_ID = "nhm2_prediction_reproduction_candidate";

export type Nhm2PredictionBootstrapArtifactRefV1 = {
  artifactId: string;
  path: string;
  schemaVersion: string;
  sha256: string;
  sizeBytes: number;
  mediaType: "application/json";
};

export type Nhm2PredictionBootstrapClaimBoundaryV1 = {
  theoryOnlyBootstrapEvidence: true;
  experimentReadyTheoryClosureClaimAllowed: false;
  physicalViabilityClaimAllowed: false;
  transportClaimAllowed: false;
  propulsionClaimAllowed: false;
  routeEtaClaimAllowed: false;
  speedAuthorityClaimAllowed: false;
  empiricalReceiptsRequired: true;
};

export type Nhm2PredictionBootstrapObservableTargetV1 = {
  observableId: Nhm2PredictionFreezeObservableId;
  definition: string;
  unit: string;
  analysisWindow: string;
  targetTime: string;
};

export type Nhm2PredictionGenerationCandidateV1 = {
  artifactId: typeof SOURCE_CANDIDATE_ARTIFACT_ID;
  contractVersion: typeof NHM2_PREDICTION_GENERATION_CANDIDATE_CONTRACT_VERSION;
  generatedAt: string;
  frozenAt: string;
  dataCollectionOpensAt: string;
  candidateId: string;
  manifestId: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  freezeId: string;
  sourceCommitSha: string;
  model: {
    modelId: string;
    parameterSetId: string;
    uncertaintyBudgetId: string;
    uncertaintyMethod: string;
    uncertaintySourceIds: string[];
  };
  targetReservation: {
    candidateId: string;
    manifestId: string;
    requestId: string;
    runId: string;
    receiptId: string;
    runtimeId: string;
  };
  plannedGenerationRun: {
    requestId: string;
    runId: string;
    receiptId: string;
    runtimeId: string;
    solverId: string;
    solverVersion: string;
    outputDirectory: string;
  };
  observableTargets: Nhm2PredictionBootstrapObservableTargetV1[];
  provenanceBoundary: {
    sourceKind: "fresh_prediction_generation";
    historicalImport: false;
    legacyAlpha07ArtifactUsed: false;
    diagnosticSeed: false;
  };
  claimBoundary: Nhm2PredictionBootstrapClaimBoundaryV1;
};

export type Nhm2PredictionGenerationRunV1 = {
  artifactId: typeof SOURCE_RUN_ARTIFACT_ID;
  contractVersion: typeof NHM2_PREDICTION_GENERATION_RUN_CONTRACT_VERSION;
  generatedAt: string;
  candidateRef: Nhm2PredictionBootstrapArtifactRefV1;
  identity: {
    candidateId: string;
    selectedProfileId: string;
    requestId: string;
    runId: string;
    receiptId: string;
    runtimeId: string;
  };
  solver: {
    solverId: string;
    solverVersion: string;
    sourceCommitSha: string;
  };
  execution: {
    outputDirectory: string;
    startedAt: string;
    completedAt: string;
    durationMs: number;
    exitCode: 0;
  };
  sourceSnapshotRefs: Nhm2PredictionBootstrapArtifactRefV1[];
  claimBoundary: Nhm2PredictionBootstrapClaimBoundaryV1;
};

export type Nhm2PredictionContentReplayEntryV1 = {
  observableId: Nhm2PredictionFreezeObservableId;
  targetTime: string;
  analysisWindow: string;
  unit: string;
  centralValue: number;
  intervalLower: number;
  intervalUpper: number;
  coverageProbability: number;
  predictionRef: Nhm2PredictionBootstrapArtifactRefV1;
  sourceSnapshotRef: Nhm2PredictionBootstrapArtifactRefV1;
  derivationRef: Nhm2PredictionBootstrapArtifactRefV1;
  uncertaintyRef: Nhm2PredictionBootstrapArtifactRefV1;
};

export type Nhm2PredictionContentReplayV1 = {
  artifactId: typeof REPLAY_ARTIFACT_ID;
  contractVersion: typeof NHM2_PREDICTION_CONTENT_REPLAY_CONTRACT_VERSION;
  generatedAt: string;
  candidateRef: Nhm2PredictionBootstrapArtifactRefV1;
  runRef: Nhm2PredictionBootstrapArtifactRefV1;
  receiptRef: Nhm2PredictionBootstrapArtifactRefV1;
  identity: {
    candidateId: string;
    selectedProfileId: string;
    requestId: string;
    runId: string;
    receiptId: string;
    runtimeId: string;
    freezeId: string;
  };
  algorithm: "reopen_hash_and_recompute_prediction_payload/v1";
  predictionSetSha256: string;
  entries: Nhm2PredictionContentReplayEntryV1[];
  result: "verified";
  claimBoundary: Nhm2PredictionBootstrapClaimBoundaryV1;
};

export type Nhm2PredictionReproductionCandidateV1 = {
  artifactId: typeof TARGET_CANDIDATE_ARTIFACT_ID;
  contractVersion: typeof NHM2_PREDICTION_REPRODUCTION_CANDIDATE_CONTRACT_VERSION;
  generatedAt: string;
  frozenAt: string;
  dataCollectionOpensAt: string;
  candidateId: string;
  manifestId: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  freezeId: string;
  supersession: {
    predecessorCandidateId: string;
    predecessorManifestId: string;
    predecessorRef: Nhm2PredictionBootstrapArtifactRefV1;
    originalImmutable: true;
    inPlaceMutationForbidden: true;
  };
  contentReplayRef: Nhm2PredictionBootstrapArtifactRefV1;
  predictionSetSha256: string;
  predictionRefs: Nhm2PredictionBootstrapArtifactRefV1[];
  reproductionRun: {
    requestId: string;
    runId: string;
    receiptId: string;
    runtimeId: string;
    plannedStartAt: string;
  };
  claimBoundary: Nhm2PredictionBootstrapClaimBoundaryV1;
};

export type Nhm2PredictionBootstrapFreezeV1 = {
  artifactId: typeof NHM2_PREDICTION_BOOTSTRAP_FREEZE_ARTIFACT_ID;
  contractVersion: typeof NHM2_PREDICTION_BOOTSTRAP_FREEZE_CONTRACT_VERSION;
  generatedAt: string;
  frozenAt: string;
  freezePath: string;
  freezeId: string;
  source: {
    candidateRef: Nhm2PredictionBootstrapArtifactRefV1;
    runRef: Nhm2PredictionBootstrapArtifactRefV1;
    receiptRef: Nhm2PredictionBootstrapArtifactRefV1;
    contentReplayRef: Nhm2PredictionBootstrapArtifactRefV1;
  };
  targetCandidateRef: Nhm2PredictionBootstrapArtifactRefV1;
  predictionSetSha256: string;
  predictionRefs: Nhm2PredictionBootstrapArtifactRefV1[];
  artifactClosure: {
    algorithm: "sha256_raw_utf8_json/v1";
    ordering: "path_code_unit_ascending/v1";
    entries: Nhm2PredictionBootstrapArtifactRefV1[];
  };
  claimBoundary: Nhm2PredictionBootstrapClaimBoundaryV1;
};

export type Nhm2PredictionBootstrapByteReader = (
  path: string,
) => Uint8Array | Promise<Uint8Array>;

export type Nhm2PredictionBootstrapVerificationV1 = {
  valid: boolean;
  freezeParsed: boolean;
  allReferencedBytesVerified: boolean;
  predictionCount: number;
  blockers: string[];
  artifact: Nhm2PredictionBootstrapFreezeV1 | null;
};

const SHA256 = /^[a-f0-9]{64}$/;
const GIT_SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const CONTRACT_VERSION = /^[a-z0-9][a-z0-9_.-]*\/v[1-9][0-9]*$/;
const NONREAL_TOKEN =
  /(?:^|[._/ -])(?:dummy|placeholder|todo|tbd|unresolved)(?:$|[._/ -])/i;
const REQUIRED_IDS = [...NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS];
const CLAIM_KEYS = [
  "theoryOnlyBootstrapEvidence",
  "experimentReadyTheoryClosureClaimAllowed",
  "physicalViabilityClaimAllowed",
  "transportClaimAllowed",
  "propulsionClaimAllowed",
  "routeEtaClaimAllowed",
  "speedAuthorityClaimAllowed",
  "empiricalReceiptsRequired",
] as const;
const PHYSICAL_CLAIM_LOCK_KEYS = new Set([
  "physicalViabilityClaimAllowed",
  "transportClaimAllowed",
  "propulsionClaimAllowed",
  "routeEtaClaimAllowed",
  "speedAuthorityClaimAllowed",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const hasOnlyKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean => {
  const actual = Object.keys(value);
  return (
    actual.length === keys.length && actual.every((key) => keys.includes(key))
  );
};

const isText = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.trim() === value &&
  !NONREAL_TOKEN.test(value);

const isIso = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const milliseconds = Date.parse(value);
  return (
    Number.isFinite(milliseconds) &&
    new Date(milliseconds).toISOString() === value
  );
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isPinnedPath = (value: unknown): value is string => {
  if (!isText(value)) return false;
  if (
    value.includes("\\") ||
    value.startsWith("/") ||
    /^[a-z]:/i.test(value) ||
    /^[a-z][a-z0-9+.-]*:/i.test(value) ||
    /[?#*{}\[\]]/.test(value)
  ) {
    return false;
  }
  const parts = value.split("/");
  return (
    parts.every((part) => part !== "" && part !== "." && part !== "..") &&
    !parts.some((part) => part.toLowerCase() === "latest")
  );
};

const pathCompare = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const isClaimBoundary = (
  value: unknown,
): value is Nhm2PredictionBootstrapClaimBoundaryV1 =>
  isRecord(value) &&
  hasOnlyKeys(value, CLAIM_KEYS) &&
  value.theoryOnlyBootstrapEvidence === true &&
  value.experimentReadyTheoryClosureClaimAllowed === false &&
  value.physicalViabilityClaimAllowed === false &&
  value.transportClaimAllowed === false &&
  value.propulsionClaimAllowed === false &&
  value.routeEtaClaimAllowed === false &&
  value.speedAuthorityClaimAllowed === false &&
  value.empiricalReceiptsRequired === true;

const isArtifactRef = (
  value: unknown,
  schemaVersion?: string,
): value is Nhm2PredictionBootstrapArtifactRefV1 =>
  isRecord(value) &&
  hasOnlyKeys(value, [
    "artifactId",
    "path",
    "schemaVersion",
    "sha256",
    "sizeBytes",
    "mediaType",
  ]) &&
  isText(value.artifactId) &&
  isPinnedPath(value.path) &&
  typeof value.schemaVersion === "string" &&
  CONTRACT_VERSION.test(value.schemaVersion) &&
  (schemaVersion == null || value.schemaVersion === schemaVersion) &&
  typeof value.sha256 === "string" &&
  SHA256.test(value.sha256) &&
  !/^0{64}$/.test(value.sha256) &&
  Number.isSafeInteger(value.sizeBytes) &&
  (value.sizeBytes as number) > 1 &&
  value.mediaType === "application/json";

const exactObservableIds = (values: readonly string[]): boolean =>
  values.length === REQUIRED_IDS.length &&
  values.every((value, index) => value === REQUIRED_IDS[index]);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(isText) &&
  new Set(value).size === value.length;

const refEquals = (
  left: Nhm2PredictionBootstrapArtifactRefV1,
  right: Nhm2PredictionBootstrapArtifactRefV1,
): boolean =>
  left.artifactId === right.artifactId &&
  left.path === right.path &&
  left.schemaVersion === right.schemaVersion &&
  left.sha256 === right.sha256 &&
  left.sizeBytes === right.sizeBytes &&
  left.mediaType === right.mediaType;

const thinRefEquals = (
  left: Nhm2NumericalObservablePredictionHashedRefV1,
  right: Nhm2PredictionBootstrapArtifactRefV1,
): boolean =>
  left.artifactId === right.artifactId &&
  left.path === right.path &&
  left.schemaVersion === right.schemaVersion &&
  left.sha256 === right.sha256;

const artifactRefArray = (
  value: unknown,
): value is Nhm2PredictionBootstrapArtifactRefV1[] =>
  Array.isArray(value) && value.every((entry) => isArtifactRef(entry));

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
};

const nestedViolation = (
  value: unknown,
  predicate: (key: string | null, value: unknown) => boolean,
  key: string | null = null,
): boolean => {
  if (predicate(key, value)) return true;
  if (Array.isArray(value)) {
    return value.some((entry) => nestedViolation(entry, predicate));
  }
  return (
    isRecord(value) &&
    Object.entries(value).some(([entryKey, entry]) =>
      nestedViolation(entry, predicate, entryKey),
    )
  );
};

const rawText = (bytes: Uint8Array): string | null => {
  try {
    const text = new TextDecoder("utf-8", {
      fatal: true,
      ignoreBOM: true,
    }).decode(bytes);
    const encoded = new TextEncoder().encode(text);
    if (encoded.length !== bytes.length) return null;
    for (let index = 0; index < bytes.length; index += 1) {
      if (encoded[index] !== bytes[index]) return null;
    }
    return text;
  } catch {
    return null;
  }
};

const sha256RawJsonBytes = (bytes: Uint8Array): string | null => {
  const text = rawText(bytes);
  return text == null ? null : sha256Nhm2CanonicalText(text);
};

const tupleSetDigest = (
  entries: readonly {
    observableId: Nhm2PredictionFreezeObservableId;
    ref: Nhm2PredictionBootstrapArtifactRefV1;
    prediction: Nhm2NumericalObservablePredictionV1;
  }[],
): string =>
  sha256Nhm2CanonicalText(
    `${NHM2_PREDICTION_BOOTSTRAP_SET_DIGEST_DOMAIN}\u0000${JSON.stringify(
      entries.map(({ observableId, ref, prediction }) => [
        observableId,
        ref.path,
        ref.sha256,
        prediction.binding.candidateId,
        prediction.binding.selectedProfileId,
        prediction.binding.freezeId,
        prediction.binding.modelId,
        prediction.binding.parameterSetId,
        prediction.binding.uncertaintyBudgetId,
        prediction.generatedAt,
        prediction.frozenAt,
        prediction.dataCollectionOpensAt,
        prediction.observable.analysisWindow,
        prediction.observable.unit,
        prediction.observable.centralValue,
        prediction.observable.coverageInterval.lower,
        prediction.observable.coverageInterval.upper,
        prediction.observable.coverageInterval.coverageProbability,
        prediction.derivation.runId,
        prediction.derivation.runtimeId,
        prediction.derivation.sourceCommitSha,
      ]),
    )}`,
  );

export const computeNhm2PredictionBootstrapSetSha256 = (
  entries: readonly {
    observableId: Nhm2PredictionFreezeObservableId;
    ref: Nhm2PredictionBootstrapArtifactRefV1;
    prediction: Nhm2NumericalObservablePredictionV1;
  }[],
): string => tupleSetDigest(entries);

const candidateShape = (
  value: unknown,
): value is Nhm2PredictionGenerationCandidateV1 => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "artifactId",
      "contractVersion",
      "generatedAt",
      "frozenAt",
      "dataCollectionOpensAt",
      "candidateId",
      "manifestId",
      "laneId",
      "selectedProfileId",
      "freezeId",
      "sourceCommitSha",
      "model",
      "targetReservation",
      "plannedGenerationRun",
      "observableTargets",
      "provenanceBoundary",
      "claimBoundary",
    ]) ||
    value.artifactId !== SOURCE_CANDIDATE_ARTIFACT_ID ||
    value.contractVersion !==
      NHM2_PREDICTION_GENERATION_CANDIDATE_CONTRACT_VERSION ||
    !isIso(value.generatedAt) ||
    !isIso(value.frozenAt) ||
    !isIso(value.dataCollectionOpensAt) ||
    Date.parse(value.generatedAt) > Date.parse(value.frozenAt) ||
    Date.parse(value.frozenAt) >= Date.parse(value.dataCollectionOpensAt) ||
    !isText(value.candidateId) ||
    !isText(value.manifestId) ||
    value.laneId !== "nhm2_shift_lapse" ||
    !isText(value.selectedProfileId) ||
    !isText(value.freezeId) ||
    typeof value.sourceCommitSha !== "string" ||
    !GIT_SHA.test(value.sourceCommitSha) ||
    !isClaimBoundary(value.claimBoundary)
  )
    return false;

  const model = value.model;
  const target = value.targetReservation;
  const plan = value.plannedGenerationRun;
  const provenance = value.provenanceBoundary;
  if (
    !isRecord(model) ||
    !hasOnlyKeys(model, [
      "modelId",
      "parameterSetId",
      "uncertaintyBudgetId",
      "uncertaintyMethod",
      "uncertaintySourceIds",
    ]) ||
    !isText(model.modelId) ||
    !isText(model.parameterSetId) ||
    !isText(model.uncertaintyBudgetId) ||
    !isText(model.uncertaintyMethod) ||
    !isStringArray(model.uncertaintySourceIds) ||
    !isRecord(target) ||
    !hasOnlyKeys(target, [
      "candidateId",
      "manifestId",
      "requestId",
      "runId",
      "receiptId",
      "runtimeId",
    ]) ||
    !Object.values(target).every(isText) ||
    !isRecord(plan) ||
    !hasOnlyKeys(plan, [
      "requestId",
      "runId",
      "receiptId",
      "runtimeId",
      "solverId",
      "solverVersion",
      "outputDirectory",
    ]) ||
    !Object.values(plan).every(isText) ||
    target.candidateId === value.candidateId ||
    target.manifestId === value.manifestId ||
    target.requestId === plan.requestId ||
    target.runId === plan.runId ||
    target.receiptId === plan.receiptId ||
    target.runtimeId === plan.runtimeId ||
    !isRecord(provenance) ||
    !hasOnlyKeys(provenance, [
      "sourceKind",
      "historicalImport",
      "legacyAlpha07ArtifactUsed",
      "diagnosticSeed",
    ]) ||
    provenance.sourceKind !== "fresh_prediction_generation" ||
    provenance.historicalImport !== false ||
    provenance.legacyAlpha07ArtifactUsed !== false ||
    provenance.diagnosticSeed !== false
  )
    return false;

  if (!Array.isArray(value.observableTargets)) return false;
  const targets = value.observableTargets;
  if (
    !exactObservableIds(
      targets.map((entry) =>
        isRecord(entry) && typeof entry.observableId === "string"
          ? entry.observableId
          : "",
      ),
    )
  )
    return false;
  return targets.every(
    (entry) =>
      isRecord(entry) &&
      hasOnlyKeys(entry, [
        "observableId",
        "definition",
        "unit",
        "analysisWindow",
        "targetTime",
      ]) &&
      REQUIRED_IDS.includes(
        entry.observableId as Nhm2PredictionFreezeObservableId,
      ) &&
      isText(entry.definition) &&
      isText(entry.unit) &&
      isText(entry.analysisWindow) &&
      isIso(entry.targetTime) &&
      Date.parse(entry.targetTime) >=
        Date.parse(value.dataCollectionOpensAt as string),
  );
};

const runShape = (value: unknown): value is Nhm2PredictionGenerationRunV1 => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "artifactId",
      "contractVersion",
      "generatedAt",
      "candidateRef",
      "identity",
      "solver",
      "execution",
      "sourceSnapshotRefs",
      "claimBoundary",
    ]) ||
    value.artifactId !== SOURCE_RUN_ARTIFACT_ID ||
    value.contractVersion !== NHM2_PREDICTION_GENERATION_RUN_CONTRACT_VERSION ||
    !isIso(value.generatedAt) ||
    !isArtifactRef(
      value.candidateRef,
      NHM2_PREDICTION_GENERATION_CANDIDATE_CONTRACT_VERSION,
    ) ||
    !isClaimBoundary(value.claimBoundary) ||
    !artifactRefArray(value.sourceSnapshotRefs)
  )
    return false;
  const identity = value.identity;
  const solver = value.solver;
  const execution = value.execution;
  return (
    isRecord(identity) &&
    hasOnlyKeys(identity, [
      "candidateId",
      "selectedProfileId",
      "requestId",
      "runId",
      "receiptId",
      "runtimeId",
    ]) &&
    Object.values(identity).every(isText) &&
    isRecord(solver) &&
    hasOnlyKeys(solver, ["solverId", "solverVersion", "sourceCommitSha"]) &&
    isText(solver.solverId) &&
    isText(solver.solverVersion) &&
    typeof solver.sourceCommitSha === "string" &&
    GIT_SHA.test(solver.sourceCommitSha) &&
    isRecord(execution) &&
    hasOnlyKeys(execution, [
      "outputDirectory",
      "startedAt",
      "completedAt",
      "durationMs",
      "exitCode",
    ]) &&
    isText(execution.outputDirectory) &&
    isIso(execution.startedAt) &&
    isIso(execution.completedAt) &&
    Date.parse(execution.startedAt) < Date.parse(execution.completedAt) &&
    execution.durationMs ===
      Date.parse(execution.completedAt) - Date.parse(execution.startedAt) &&
    execution.exitCode === 0 &&
    isIso(value.generatedAt) &&
    Date.parse(value.generatedAt) >= Date.parse(execution.completedAt) &&
    exactObservableIds(
      value.sourceSnapshotRefs.map(
        (ref) => ref.artifactId.split(".").at(-1) ?? "",
      ),
    ) &&
    value.sourceSnapshotRefs.every(
      (ref) => ref.schemaVersion === SOURCE_SNAPSHOT_VERSION,
    )
  );
};

const replayShape = (value: unknown): value is Nhm2PredictionContentReplayV1 =>
  isRecord(value) &&
  hasOnlyKeys(value, [
    "artifactId",
    "contractVersion",
    "generatedAt",
    "candidateRef",
    "runRef",
    "receiptRef",
    "identity",
    "algorithm",
    "predictionSetSha256",
    "entries",
    "result",
    "claimBoundary",
  ]) &&
  value.artifactId === REPLAY_ARTIFACT_ID &&
  value.contractVersion === NHM2_PREDICTION_CONTENT_REPLAY_CONTRACT_VERSION &&
  isIso(value.generatedAt) &&
  isArtifactRef(
    value.candidateRef,
    NHM2_PREDICTION_GENERATION_CANDIDATE_CONTRACT_VERSION,
  ) &&
  isArtifactRef(
    value.runRef,
    NHM2_PREDICTION_GENERATION_RUN_CONTRACT_VERSION,
  ) &&
  isArtifactRef(value.receiptRef, THEORY_RUNTIME_RECEIPT_SCHEMA_VERSION) &&
  isRecord(value.identity) &&
  hasOnlyKeys(value.identity, [
    "candidateId",
    "selectedProfileId",
    "requestId",
    "runId",
    "receiptId",
    "runtimeId",
    "freezeId",
  ]) &&
  Object.values(value.identity).every(isText) &&
  value.algorithm === "reopen_hash_and_recompute_prediction_payload/v1" &&
  typeof value.predictionSetSha256 === "string" &&
  SHA256.test(value.predictionSetSha256) &&
  Array.isArray(value.entries) &&
  exactObservableIds(
    value.entries.map((entry) =>
      isRecord(entry) && typeof entry.observableId === "string"
        ? entry.observableId
        : "",
    ),
  ) &&
  value.entries.every(
    (entry) =>
      isRecord(entry) &&
      hasOnlyKeys(entry, [
        "observableId",
        "targetTime",
        "analysisWindow",
        "unit",
        "centralValue",
        "intervalLower",
        "intervalUpper",
        "coverageProbability",
        "predictionRef",
        "sourceSnapshotRef",
        "derivationRef",
        "uncertaintyRef",
      ]) &&
      isIso(entry.targetTime) &&
      isText(entry.analysisWindow) &&
      isText(entry.unit) &&
      isFiniteNumber(entry.centralValue) &&
      isFiniteNumber(entry.intervalLower) &&
      isFiniteNumber(entry.intervalUpper) &&
      isFiniteNumber(entry.coverageProbability) &&
      isArtifactRef(
        entry.predictionRef,
        NHM2_NUMERICAL_OBSERVABLE_PREDICTION_CONTRACT_VERSION,
      ) &&
      isArtifactRef(entry.sourceSnapshotRef, SOURCE_SNAPSHOT_VERSION) &&
      isArtifactRef(entry.derivationRef, DERIVATION_VERSION) &&
      isArtifactRef(entry.uncertaintyRef, UNCERTAINTY_VERSION),
  ) &&
  value.result === "verified" &&
  isClaimBoundary(value.claimBoundary);

const targetShape = (
  value: unknown,
): value is Nhm2PredictionReproductionCandidateV1 => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "artifactId",
      "contractVersion",
      "generatedAt",
      "frozenAt",
      "dataCollectionOpensAt",
      "candidateId",
      "manifestId",
      "laneId",
      "selectedProfileId",
      "freezeId",
      "supersession",
      "contentReplayRef",
      "predictionSetSha256",
      "predictionRefs",
      "reproductionRun",
      "claimBoundary",
    ]) ||
    value.artifactId !== TARGET_CANDIDATE_ARTIFACT_ID ||
    value.contractVersion !==
      NHM2_PREDICTION_REPRODUCTION_CANDIDATE_CONTRACT_VERSION ||
    !isIso(value.generatedAt) ||
    !isIso(value.frozenAt) ||
    !isIso(value.dataCollectionOpensAt) ||
    Date.parse(value.generatedAt) > Date.parse(value.frozenAt) ||
    Date.parse(value.frozenAt) >= Date.parse(value.dataCollectionOpensAt) ||
    !isText(value.candidateId) ||
    !isText(value.manifestId) ||
    value.laneId !== "nhm2_shift_lapse" ||
    !isText(value.selectedProfileId) ||
    !isText(value.freezeId) ||
    !isArtifactRef(
      value.contentReplayRef,
      NHM2_PREDICTION_CONTENT_REPLAY_CONTRACT_VERSION,
    ) ||
    typeof value.predictionSetSha256 !== "string" ||
    !SHA256.test(value.predictionSetSha256) ||
    !artifactRefArray(value.predictionRefs) ||
    !exactObservableIds(
      value.predictionRefs.map((ref) => ref.artifactId.split(".").at(-1) ?? ""),
    ) ||
    !value.predictionRefs.every(
      (ref) =>
        ref.schemaVersion ===
        NHM2_NUMERICAL_OBSERVABLE_PREDICTION_CONTRACT_VERSION,
    ) ||
    !isClaimBoundary(value.claimBoundary)
  )
    return false;
  const supersession = value.supersession;
  const run = value.reproductionRun;
  return (
    isRecord(supersession) &&
    hasOnlyKeys(supersession, [
      "predecessorCandidateId",
      "predecessorManifestId",
      "predecessorRef",
      "originalImmutable",
      "inPlaceMutationForbidden",
    ]) &&
    isText(supersession.predecessorCandidateId) &&
    isText(supersession.predecessorManifestId) &&
    isArtifactRef(
      supersession.predecessorRef,
      NHM2_PREDICTION_GENERATION_CANDIDATE_CONTRACT_VERSION,
    ) &&
    supersession.originalImmutable === true &&
    supersession.inPlaceMutationForbidden === true &&
    isRecord(run) &&
    hasOnlyKeys(run, [
      "requestId",
      "runId",
      "receiptId",
      "runtimeId",
      "plannedStartAt",
    ]) &&
    isText(run.requestId) &&
    isText(run.runId) &&
    isText(run.receiptId) &&
    isText(run.runtimeId) &&
    isIso(run.plannedStartAt) &&
    Date.parse(value.frozenAt) < Date.parse(run.plannedStartAt) &&
    Date.parse(run.plannedStartAt) < Date.parse(value.dataCollectionOpensAt)
  );
};

export const nhm2PredictionBootstrapFreezeViolations = (
  value: unknown,
): string[] => {
  const blockers: string[] = [];
  if (!isRecord(value)) return ["prediction_bootstrap_freeze_not_object"];
  if (
    !hasOnlyKeys(value, [
      "artifactId",
      "contractVersion",
      "generatedAt",
      "frozenAt",
      "freezePath",
      "freezeId",
      "source",
      "targetCandidateRef",
      "predictionSetSha256",
      "predictionRefs",
      "artifactClosure",
      "claimBoundary",
    ])
  ) {
    blockers.push("prediction_bootstrap_freeze_shape_invalid");
    return blockers;
  }
  if (value.artifactId !== NHM2_PREDICTION_BOOTSTRAP_FREEZE_ARTIFACT_ID)
    blockers.push("prediction_bootstrap_artifact_id_invalid");
  if (
    value.contractVersion !== NHM2_PREDICTION_BOOTSTRAP_FREEZE_CONTRACT_VERSION
  )
    blockers.push("prediction_bootstrap_contract_version_invalid");
  if (
    !isIso(value.generatedAt) ||
    !isIso(value.frozenAt) ||
    (isIso(value.generatedAt) &&
      isIso(value.frozenAt) &&
      Date.parse(value.generatedAt) > Date.parse(value.frozenAt))
  )
    blockers.push("prediction_bootstrap_freeze_timing_invalid");
  if (!isPinnedPath(value.freezePath) || !isText(value.freezeId))
    blockers.push("prediction_bootstrap_identity_invalid");
  if (
    !isRecord(value.source) ||
    !hasOnlyKeys(value.source, [
      "candidateRef",
      "runRef",
      "receiptRef",
      "contentReplayRef",
    ]) ||
    !isArtifactRef(
      value.source.candidateRef,
      NHM2_PREDICTION_GENERATION_CANDIDATE_CONTRACT_VERSION,
    ) ||
    !isArtifactRef(
      value.source.runRef,
      NHM2_PREDICTION_GENERATION_RUN_CONTRACT_VERSION,
    ) ||
    !isArtifactRef(
      value.source.receiptRef,
      THEORY_RUNTIME_RECEIPT_SCHEMA_VERSION,
    ) ||
    !isArtifactRef(
      value.source.contentReplayRef,
      NHM2_PREDICTION_CONTENT_REPLAY_CONTRACT_VERSION,
    )
  )
    blockers.push("prediction_bootstrap_source_refs_invalid");
  if (
    !isArtifactRef(
      value.targetCandidateRef,
      NHM2_PREDICTION_REPRODUCTION_CANDIDATE_CONTRACT_VERSION,
    )
  )
    blockers.push("prediction_bootstrap_target_ref_invalid");
  if (
    typeof value.predictionSetSha256 !== "string" ||
    !SHA256.test(value.predictionSetSha256)
  )
    blockers.push("prediction_bootstrap_set_digest_invalid");
  if (
    !artifactRefArray(value.predictionRefs) ||
    !exactObservableIds(
      value.predictionRefs.map((ref) => ref.artifactId.split(".").at(-1) ?? ""),
    ) ||
    !value.predictionRefs.every(
      (ref) =>
        ref.schemaVersion ===
        NHM2_NUMERICAL_OBSERVABLE_PREDICTION_CONTRACT_VERSION,
    )
  )
    blockers.push("prediction_bootstrap_prediction_ref_set_invalid");
  if (
    !isRecord(value.artifactClosure) ||
    !hasOnlyKeys(value.artifactClosure, ["algorithm", "ordering", "entries"]) ||
    value.artifactClosure.algorithm !== "sha256_raw_utf8_json/v1" ||
    value.artifactClosure.ordering !== "path_code_unit_ascending/v1" ||
    !artifactRefArray(value.artifactClosure.entries)
  )
    blockers.push("prediction_bootstrap_artifact_closure_invalid");
  if (!isClaimBoundary(value.claimBoundary))
    blockers.push("prediction_bootstrap_claim_lock_opened");
  return blockers;
};

export const isNhm2PredictionBootstrapFreeze = (
  value: unknown,
): value is Nhm2PredictionBootstrapFreezeV1 =>
  nhm2PredictionBootstrapFreezeViolations(value).length === 0;

const expectedReplayEntry = (
  prediction: Nhm2NumericalObservablePredictionV1,
  predictionRef: Nhm2PredictionBootstrapArtifactRefV1,
  target: Nhm2PredictionBootstrapObservableTargetV1,
  sourceRef: Nhm2PredictionBootstrapArtifactRefV1,
  derivationRef: Nhm2PredictionBootstrapArtifactRefV1,
  uncertaintyRef: Nhm2PredictionBootstrapArtifactRefV1,
): Nhm2PredictionContentReplayEntryV1 => ({
  observableId: prediction.observable.observableId,
  targetTime: target.targetTime,
  analysisWindow: prediction.observable.analysisWindow,
  unit: prediction.observable.unit,
  centralValue: prediction.observable.centralValue,
  intervalLower: prediction.observable.coverageInterval.lower,
  intervalUpper: prediction.observable.coverageInterval.upper,
  coverageProbability:
    prediction.observable.coverageInterval.coverageProbability,
  predictionRef,
  sourceSnapshotRef: sourceRef,
  derivationRef,
  uncertaintyRef,
});

const sameJson = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

const refForThin = (
  thin: Nhm2NumericalObservablePredictionHashedRefV1,
  closure: readonly Nhm2PredictionBootstrapArtifactRefV1[],
): Nhm2PredictionBootstrapArtifactRefV1 | null =>
  closure.find((entry) => thinRefEquals(thin, entry)) ?? null;

const sourceSnapshotMatches = (
  value: unknown,
  ref: Nhm2PredictionBootstrapArtifactRefV1,
  candidate: Nhm2PredictionGenerationCandidateV1,
  run: Nhm2PredictionGenerationRunV1,
  observableId: Nhm2PredictionFreezeObservableId,
): boolean =>
  isRecord(value) &&
  hasOnlyKeys(value, [
    "artifactId",
    "contractVersion",
    "generatedAt",
    "observableId",
    "candidateId",
    "runId",
    "sourceCommitSha",
    "sourceArraySha256",
  ]) &&
  value.artifactId === ref.artifactId &&
  value.contractVersion === SOURCE_SNAPSHOT_VERSION &&
  value.observableId === observableId &&
  value.candidateId === candidate.candidateId &&
  value.runId === run.identity.runId &&
  value.sourceCommitSha === run.solver.sourceCommitSha &&
  typeof value.sourceArraySha256 === "string" &&
  SHA256.test(value.sourceArraySha256) &&
  !/^0{64}$/.test(value.sourceArraySha256) &&
  isIso(value.generatedAt) &&
  Date.parse(value.generatedAt) >= Date.parse(run.execution.startedAt) &&
  Date.parse(value.generatedAt) <= Date.parse(run.execution.completedAt);

const derivationMatches = (
  value: unknown,
  ref: Nhm2PredictionBootstrapArtifactRefV1,
  sourceRef: Nhm2PredictionBootstrapArtifactRefV1,
  run: Nhm2PredictionGenerationRunV1,
  prediction: Nhm2NumericalObservablePredictionV1,
): boolean =>
  isRecord(value) &&
  hasOnlyKeys(value, [
    "artifactId",
    "contractVersion",
    "generatedAt",
    "observableId",
    "runId",
    "sourceRef",
    "equationId",
  ]) &&
  value.artifactId === ref.artifactId &&
  value.contractVersion === DERIVATION_VERSION &&
  value.observableId === prediction.observable.observableId &&
  value.runId === run.identity.runId &&
  isArtifactRef(value.sourceRef, SOURCE_SNAPSHOT_VERSION) &&
  refEquals(value.sourceRef, sourceRef) &&
  isText(value.equationId) &&
  isIso(value.generatedAt) &&
  Date.parse(value.generatedAt) >= Date.parse(run.execution.completedAt) &&
  Date.parse(value.generatedAt) <= Date.parse(prediction.generatedAt);

const uncertaintyMatches = (
  value: unknown,
  ref: Nhm2PredictionBootstrapArtifactRefV1,
  derivationRef: Nhm2PredictionBootstrapArtifactRefV1,
  candidate: Nhm2PredictionGenerationCandidateV1,
  prediction: Nhm2NumericalObservablePredictionV1,
): boolean =>
  isRecord(value) &&
  hasOnlyKeys(value, [
    "artifactId",
    "contractVersion",
    "generatedAt",
    "observableId",
    "uncertaintyBudgetId",
    "method",
    "sourceIds",
    "derivationRef",
  ]) &&
  value.artifactId === ref.artifactId &&
  value.contractVersion === UNCERTAINTY_VERSION &&
  value.observableId === prediction.observable.observableId &&
  value.uncertaintyBudgetId === candidate.model.uncertaintyBudgetId &&
  value.method === candidate.model.uncertaintyMethod &&
  sameJson(value.sourceIds, candidate.model.uncertaintySourceIds) &&
  isArtifactRef(value.derivationRef, DERIVATION_VERSION) &&
  refEquals(value.derivationRef, derivationRef) &&
  isIso(value.generatedAt) &&
  Date.parse(value.generatedAt) <= Date.parse(prediction.generatedAt);

export const verifyNhm2PredictionBootstrapFreezeFromBytes = async (input: {
  freezeBytes: Uint8Array;
  readBytes: Nhm2PredictionBootstrapByteReader;
}): Promise<Nhm2PredictionBootstrapVerificationV1> => {
  const blockers: string[] = [];
  const freezeText = rawText(input.freezeBytes);
  const parsed = freezeText == null ? null : parseJson(freezeText);
  const shapeBlockers = nhm2PredictionBootstrapFreezeViolations(parsed);
  if (shapeBlockers.length > 0 || !isNhm2PredictionBootstrapFreeze(parsed)) {
    return {
      valid: false,
      freezeParsed: freezeText != null && parsed != null,
      allReferencedBytesVerified: false,
      predictionCount: 0,
      blockers:
        shapeBlockers.length > 0
          ? shapeBlockers
          : ["prediction_bootstrap_freeze_invalid"],
      artifact: null,
    };
  }
  const artifact = parsed;
  const closure = artifact.artifactClosure.entries;
  const sorted = [...closure].sort((a, b) => pathCompare(a.path, b.path));
  if (!sameJson(sorted, closure))
    blockers.push("prediction_bootstrap_closure_order_invalid");
  if (new Set(closure.map((ref) => ref.path)).size !== closure.length)
    blockers.push("prediction_bootstrap_closure_duplicate_path");
  if (new Set(closure.map((ref) => ref.artifactId)).size !== closure.length)
    blockers.push("prediction_bootstrap_closure_duplicate_artifact_id");
  if (
    closure.some(
      (ref) =>
        ref.path === artifact.freezePath ||
        ref.artifactId === artifact.artifactId,
    )
  )
    blockers.push("prediction_bootstrap_self_reference_forbidden");

  const values = new Map<string, unknown>();
  let allBytes = true;
  for (const ref of closure) {
    try {
      const bytes = await input.readBytes(ref.path);
      if (!(bytes instanceof Uint8Array)) throw new Error("not bytes");
      const digest = sha256RawJsonBytes(bytes);
      if (digest !== ref.sha256) {
        blockers.push(`prediction_bootstrap_sha256_mismatch:${ref.path}`);
        allBytes = false;
        continue;
      }
      if (bytes.byteLength !== ref.sizeBytes) {
        blockers.push(`prediction_bootstrap_size_mismatch:${ref.path}`);
        allBytes = false;
        continue;
      }
      const text = rawText(bytes);
      const value = text == null ? null : parseJson(text);
      if (value == null) {
        blockers.push(`prediction_bootstrap_json_invalid:${ref.path}`);
        allBytes = false;
        continue;
      }
      values.set(ref.path, value);
      if (
        nestedViolation(
          value,
          (_key, entry) =>
            typeof entry === "string" && NONREAL_TOKEN.test(entry),
        )
      ) {
        blockers.push(`prediction_bootstrap_placeholder_content:${ref.path}`);
      }
      if (
        nestedViolation(
          value,
          (key, entry) =>
            key != null && PHYSICAL_CLAIM_LOCK_KEYS.has(key) && entry === true,
        )
      ) {
        blockers.push(`prediction_bootstrap_claim_lock_opened:${ref.path}`);
      }
    } catch {
      blockers.push(`prediction_bootstrap_artifact_unreadable:${ref.path}`);
      allBytes = false;
    }
  }

  const requireRef = (ref: Nhm2PredictionBootstrapArtifactRefV1): unknown => {
    const declared = closure.find((entry) => refEquals(entry, ref));
    if (declared == null) {
      blockers.push(`prediction_bootstrap_ref_outside_closure:${ref.path}`);
      return null;
    }
    return values.get(ref.path) ?? null;
  };

  const candidateValue = requireRef(artifact.source.candidateRef);
  const runValue = requireRef(artifact.source.runRef);
  const receiptValue = requireRef(artifact.source.receiptRef);
  const replayValue = requireRef(artifact.source.contentReplayRef);
  const targetValue = requireRef(artifact.targetCandidateRef);
  if (!candidateShape(candidateValue))
    blockers.push("prediction_bootstrap_source_candidate_invalid");
  if (!runShape(runValue))
    blockers.push("prediction_bootstrap_source_run_invalid");
  if (!isTheoryRuntimeReceiptV1(receiptValue))
    blockers.push("prediction_bootstrap_runtime_receipt_invalid");
  if (!replayShape(replayValue))
    blockers.push("prediction_bootstrap_content_replay_invalid");
  if (!targetShape(targetValue))
    blockers.push("prediction_bootstrap_target_candidate_invalid");

  const predictions: {
    observableId: Nhm2PredictionFreezeObservableId;
    ref: Nhm2PredictionBootstrapArtifactRefV1;
    prediction: Nhm2NumericalObservablePredictionV1;
  }[] = [];
  for (const ref of artifact.predictionRefs) {
    const value = requireRef(ref);
    if (!isNhm2NumericalObservablePrediction(value)) {
      blockers.push(`prediction_bootstrap_prediction_invalid:${ref.path}`);
      continue;
    }
    predictions.push({
      observableId: value.observable.observableId,
      ref,
      prediction: value,
    });
  }
  if (!exactObservableIds(predictions.map((entry) => entry.observableId)))
    blockers.push("prediction_bootstrap_exact_six_predictions_required");

  if (candidateShape(candidateValue) && runShape(runValue)) {
    const candidate = candidateValue;
    const run = runValue;
    if (!refEquals(run.candidateRef, artifact.source.candidateRef))
      blockers.push("prediction_bootstrap_run_candidate_ref_mismatch");
    if (
      run.identity.candidateId !== candidate.candidateId ||
      run.identity.selectedProfileId !== candidate.selectedProfileId ||
      run.identity.requestId !== candidate.plannedGenerationRun.requestId ||
      run.identity.runId !== candidate.plannedGenerationRun.runId ||
      run.identity.receiptId !== candidate.plannedGenerationRun.receiptId ||
      run.identity.runtimeId !== candidate.plannedGenerationRun.runtimeId ||
      run.solver.solverId !== candidate.plannedGenerationRun.solverId ||
      run.solver.solverVersion !==
        candidate.plannedGenerationRun.solverVersion ||
      run.solver.sourceCommitSha !== candidate.sourceCommitSha ||
      run.execution.outputDirectory !==
        candidate.plannedGenerationRun.outputDirectory ||
      Date.parse(candidate.frozenAt) >= Date.parse(run.execution.startedAt)
    )
      blockers.push("prediction_bootstrap_generation_run_binding_mismatch");
  }

  if (runShape(runValue) && isTheoryRuntimeReceiptV1(receiptValue)) {
    const run = runValue;
    const receipt = receiptValue as TheoryRuntimeReceiptV1;
    const manifest = receipt.outputs.artifactManifest;
    const evidence = receipt.outputs.artifactEvidence;
    const expectedOutputRefs = [
      artifact.source.runRef,
      ...run.sourceSnapshotRefs,
    ];
    const expectedPaths = expectedOutputRefs
      .map((ref) => ref.path)
      .sort(pathCompare);
    const manifestPaths =
      manifest?.entries.map((entry) => entry.path).sort(pathCompare) ?? [];
    const evidencePaths =
      evidence?.map((entry) => entry.path).sort(pathCompare) ?? [];
    const timingMatches =
      receipt.provenance.gitSha === run.solver.sourceCommitSha &&
      receipt.provenance.startedAt === run.execution.startedAt &&
      receipt.provenance.completedAt === run.execution.completedAt &&
      receipt.provenance.durationMs === run.execution.durationMs;
    if (
      receipt.artifactId !== THEORY_RUNTIME_RECEIPT_ARTIFACT_ID ||
      receipt.schemaVersion !== THEORY_RUNTIME_RECEIPT_SCHEMA_VERSION ||
      receipt.receiptId !== run.identity.receiptId ||
      receipt.runtimeId !== run.identity.runtimeId ||
      receipt.graphId !== "nhm2.prediction_generation" ||
      receipt.status !== "completed" ||
      !timingMatches ||
      Date.parse(receipt.generatedAt) < Date.parse(run.execution.completedAt) ||
      (predictions.length > 0 &&
        Date.parse(receipt.generatedAt) >
          Math.min(
            ...predictions.map((entry) =>
              Date.parse(entry.prediction.generatedAt),
            ),
          )) ||
      receipt.execution == null ||
      receipt.execution.exitCode !== 0 ||
      receipt.execution.timedOut !== false ||
      receipt.execution.error !== null ||
      receipt.execution.outputDirectoryBound !== true ||
      receipt.execution.outputDirectory !== run.execution.outputDirectory ||
      receipt.claimBoundary.currentTier !== "diagnostic" ||
      receipt.claimBoundary.maximumTier !== "diagnostic" ||
      receipt.claimBoundary.promotionAllowed !== false ||
      manifest == null ||
      manifest.boundToExecution !== true ||
      manifest.requestId !== run.identity.requestId ||
      manifest.runtimeId !== run.identity.runtimeId ||
      manifest.gitSha !== run.solver.sourceCommitSha ||
      manifest.startedAt !== run.execution.startedAt ||
      manifest.completedAt !== run.execution.completedAt ||
      manifest.outputDirectory !== run.execution.outputDirectory ||
      !sameJson(
        [...receipt.outputs.artifacts].sort(pathCompare),
        expectedPaths,
      ) ||
      !sameJson(manifestPaths, expectedPaths) ||
      !manifest.entries.every(
        (entry) =>
          entry.freshness === "new" &&
          expectedOutputRefs.some(
            (ref) =>
              ref.path === entry.path &&
              ref.sha256 === entry.sha256 &&
              ref.sizeBytes === entry.sizeBytes,
          ),
      ) ||
      evidence == null ||
      !sameJson(evidencePaths, expectedPaths) ||
      !evidence.every(
        (entry) =>
          entry.freshness === "new" &&
          entry.status === "pass" &&
          expectedOutputRefs.some(
            (ref) => ref.path === entry.path && ref.sha256 === entry.sha256,
          ),
      ) ||
      receipt.outputs.missingSignals.length !== 0
    )
      blockers.push("prediction_bootstrap_runtime_receipt_not_run_bound");
  }

  if (candidateShape(candidateValue) && runShape(runValue)) {
    const sourceRefs = runValue.sourceSnapshotRefs;
    for (let index = 0; index < predictions.length; index += 1) {
      const { prediction } = predictions[index];
      const observableId = REQUIRED_IDS[index];
      const target = candidateValue.observableTargets[index];
      const expectedSource = sourceRefs[index];
      if (
        prediction.observable.observableId !== observableId ||
        prediction.binding.candidateId !==
          candidateValue.targetReservation.candidateId ||
        prediction.binding.selectedProfileId !==
          candidateValue.selectedProfileId ||
        prediction.binding.freezeId !== candidateValue.freezeId ||
        prediction.binding.modelId !== candidateValue.model.modelId ||
        prediction.binding.parameterSetId !==
          candidateValue.model.parameterSetId ||
        prediction.binding.uncertaintyBudgetId !==
          candidateValue.model.uncertaintyBudgetId ||
        prediction.observable.definition !== target.definition ||
        prediction.observable.unit !== target.unit ||
        prediction.observable.analysisWindow !== target.analysisWindow ||
        prediction.uncertainty.method !==
          candidateValue.model.uncertaintyMethod ||
        !sameJson(
          prediction.uncertainty.sourceIds,
          candidateValue.model.uncertaintySourceIds,
        ) ||
        prediction.derivation.runId !== runValue.identity.runId ||
        prediction.derivation.runtimeId !== runValue.identity.runtimeId ||
        prediction.derivation.solverId !== runValue.solver.solverId ||
        prediction.derivation.solverVersion !== runValue.solver.solverVersion ||
        prediction.derivation.sourceCommitSha !==
          runValue.solver.sourceCommitSha ||
        !thinRefEquals(
          prediction.derivation.runReceiptRef,
          artifact.source.receiptRef,
        ) ||
        !thinRefEquals(prediction.derivation.sourceRef, expectedSource) ||
        prediction.generatedAt < runValue.execution.completedAt ||
        prediction.frozenAt !== artifact.frozenAt ||
        prediction.dataCollectionOpensAt !==
          candidateValue.dataCollectionOpensAt
      )
        blockers.push(
          `prediction_bootstrap_prediction_binding_mismatch:${observableId}`,
        );

      const derivationRef = refForThin(
        prediction.derivation.derivationRef,
        closure,
      );
      const uncertaintyRef = refForThin(
        prediction.uncertainty.derivationRef,
        closure,
      );
      if (derivationRef == null || uncertaintyRef == null) {
        blockers.push(
          `prediction_bootstrap_prediction_provenance_outside_closure:${observableId}`,
        );
      } else {
        if (
          !sourceSnapshotMatches(
            requireRef(expectedSource),
            expectedSource,
            candidateValue,
            runValue,
            observableId,
          )
        )
          blockers.push(
            `prediction_bootstrap_provenance_artifact_invalid:${expectedSource.path}`,
          );
        if (
          !derivationMatches(
            requireRef(derivationRef),
            derivationRef,
            expectedSource,
            runValue,
            prediction,
          )
        )
          blockers.push(
            `prediction_bootstrap_provenance_artifact_invalid:${derivationRef.path}`,
          );
        if (
          !uncertaintyMatches(
            requireRef(uncertaintyRef),
            uncertaintyRef,
            derivationRef,
            candidateValue,
            prediction,
          )
        )
          blockers.push(
            `prediction_bootstrap_provenance_artifact_invalid:${uncertaintyRef.path}`,
          );
      }
    }
  }

  const computedSetSha256 =
    predictions.length === REQUIRED_IDS.length
      ? tupleSetDigest(predictions)
      : null;
  if (
    computedSetSha256 == null ||
    computedSetSha256 !== artifact.predictionSetSha256
  )
    blockers.push("prediction_bootstrap_set_digest_mismatch");

  if (
    candidateShape(candidateValue) &&
    runShape(runValue) &&
    replayShape(replayValue)
  ) {
    const replay = replayValue;
    const expectedEntries = predictions.map((entry, index) => {
      const derivationRef = refForThin(
        entry.prediction.derivation.derivationRef,
        closure,
      )!;
      const uncertaintyRef = refForThin(
        entry.prediction.uncertainty.derivationRef,
        closure,
      )!;
      return expectedReplayEntry(
        entry.prediction,
        entry.ref,
        candidateValue.observableTargets[index],
        runValue.sourceSnapshotRefs[index],
        derivationRef,
        uncertaintyRef,
      );
    });
    if (
      !refEquals(replay.candidateRef, artifact.source.candidateRef) ||
      !refEquals(replay.runRef, artifact.source.runRef) ||
      !refEquals(replay.receiptRef, artifact.source.receiptRef) ||
      replay.identity.candidateId !== candidateValue.candidateId ||
      replay.identity.selectedProfileId !== candidateValue.selectedProfileId ||
      replay.identity.requestId !== runValue.identity.requestId ||
      replay.identity.runId !== runValue.identity.runId ||
      replay.identity.receiptId !== runValue.identity.receiptId ||
      replay.identity.runtimeId !== runValue.identity.runtimeId ||
      replay.identity.freezeId !== candidateValue.freezeId ||
      replay.predictionSetSha256 !== computedSetSha256 ||
      !sameJson(replay.entries, expectedEntries) ||
      Date.parse(replay.generatedAt) <
        Math.max(
          ...predictions.map((entry) =>
            Date.parse(entry.prediction.generatedAt),
          ),
        ) ||
      Date.parse(replay.generatedAt) > Date.parse(artifact.frozenAt)
    )
      blockers.push("prediction_bootstrap_content_replay_mismatch");
  }

  if (
    candidateShape(candidateValue) &&
    runShape(runValue) &&
    replayShape(replayValue) &&
    targetShape(targetValue)
  ) {
    const target = targetValue;
    const reserved = candidateValue.targetReservation;
    if (
      target.candidateId !== reserved.candidateId ||
      target.manifestId !== reserved.manifestId ||
      target.selectedProfileId !== candidateValue.selectedProfileId ||
      target.freezeId !== candidateValue.freezeId ||
      target.generatedAt < replayValue.generatedAt ||
      target.frozenAt !== artifact.frozenAt ||
      target.dataCollectionOpensAt !== candidateValue.dataCollectionOpensAt ||
      target.supersession.predecessorCandidateId !==
        candidateValue.candidateId ||
      target.supersession.predecessorManifestId !== candidateValue.manifestId ||
      !refEquals(
        target.supersession.predecessorRef,
        artifact.source.candidateRef,
      ) ||
      !refEquals(target.contentReplayRef, artifact.source.contentReplayRef) ||
      target.predictionSetSha256 !== computedSetSha256 ||
      !sameJson(target.predictionRefs, artifact.predictionRefs) ||
      target.reproductionRun.requestId !== reserved.requestId ||
      target.reproductionRun.runId !== reserved.runId ||
      target.reproductionRun.receiptId !== reserved.receiptId ||
      target.reproductionRun.runtimeId !== reserved.runtimeId ||
      target.reproductionRun.runId === runValue.identity.runId ||
      target.reproductionRun.requestId === runValue.identity.requestId ||
      target.reproductionRun.receiptId === runValue.identity.receiptId ||
      target.reproductionRun.runtimeId === runValue.identity.runtimeId
    )
      blockers.push("prediction_bootstrap_superseding_target_mismatch");
  }

  const expectedRefs = new Map<string, Nhm2PredictionBootstrapArtifactRefV1>();
  const addExpected = (ref: Nhm2PredictionBootstrapArtifactRefV1): void => {
    const prior = expectedRefs.get(ref.path);
    if (prior != null && !refEquals(prior, ref))
      blockers.push(`prediction_bootstrap_conflicting_ref:${ref.path}`);
    expectedRefs.set(ref.path, ref);
  };
  [
    artifact.source.candidateRef,
    artifact.source.runRef,
    artifact.source.receiptRef,
    artifact.source.contentReplayRef,
    artifact.targetCandidateRef,
    ...artifact.predictionRefs,
  ].forEach(addExpected);
  if (runShape(runValue)) runValue.sourceSnapshotRefs.forEach(addExpected);
  for (const entry of predictions) {
    for (const thin of [
      entry.prediction.derivation.runReceiptRef,
      entry.prediction.derivation.sourceRef,
      entry.prediction.derivation.derivationRef,
      entry.prediction.uncertainty.derivationRef,
    ]) {
      const full = refForThin(thin, closure);
      if (full == null)
        blockers.push(`prediction_bootstrap_nested_ref_missing:${thin.path}`);
      else addExpected(full);
    }
  }
  const expectedClosure = [...expectedRefs.values()].sort((a, b) =>
    pathCompare(a.path, b.path),
  );
  if (!sameJson(closure, expectedClosure))
    blockers.push("prediction_bootstrap_closure_not_exact");

  const uniqueBlockers = [...new Set(blockers)];
  return {
    valid: uniqueBlockers.length === 0,
    freezeParsed: true,
    allReferencedBytesVerified:
      allBytes &&
      !uniqueBlockers.some(
        (entry) =>
          entry.includes("unreadable") ||
          entry.includes("sha256_mismatch") ||
          entry.includes("size_mismatch") ||
          entry.includes("json_invalid"),
      ),
    predictionCount: predictions.length,
    blockers: uniqueBlockers,
    artifact,
  };
};
