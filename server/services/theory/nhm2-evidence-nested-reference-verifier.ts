import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS } from "../../../shared/contracts/nhm2-full-apparatus-source-tensor.v1";
import type { Nhm2ExperimentReadyTheoryClosureEvidenceId } from "../../../shared/contracts/nhm2-experiment-ready-theory-closure.v1";
import {
  NHM2_NUMERICAL_OBSERVABLE_PREDICTION_CONTRACT_VERSION,
  isNhm2NumericalObservablePrediction,
  type Nhm2NumericalObservablePredictionHashedRefV1,
  type Nhm2NumericalObservablePredictionV1,
} from "../../../shared/contracts/nhm2-numerical-observable-prediction.v1";
import {
  isNhm2PredictionFalsifierFreeze,
  type Nhm2PredictionFalsifierFreezeV1,
} from "../../../shared/contracts/nhm2-prediction-falsifier-freeze.v1";
import type { TheoryRuntimeOutputManifestEntryV1 } from "../../../shared/contracts/theory-runtime-receipt.v1";

const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const MAX_DEPTH = 256;
const MAX_VISITED_NODES = 100_000;
const MAX_REFERENCES = 10_000;
const DUMMY_PATH_TOKENS = new Set([
  "dummy",
  "placeholder",
  "unresolved",
  "todo",
  "tbd",
]);

export type Nhm2EvidenceNestedReferenceReceiptManifestEntry = Pick<
  TheoryRuntimeOutputManifestEntryV1,
  "path" | "sha256" | "sizeBytes" | "freshness"
>;

type ReceiptManifestEntry = Nhm2EvidenceNestedReferenceReceiptManifestEntry;

export type Nhm2EvidenceNestedReferenceRunIdentity = {
  receiptId: string;
  runId: string;
  runtimeId: string;
};

export type Nhm2EvidenceNestedReferenceVerifiedPriorRunOutput =
  ReceiptManifestEntry & Nhm2EvidenceNestedReferenceRunIdentity;

export type Nhm2EvidenceNestedReferenceScope =
  "run_output" | "verified_prior_run_output" | "immutable_input";

export type Nhm2EvidenceNestedReferenceProvenanceClass =
  | "computed_output"
  | "prior_computed_output"
  | "frozen_configuration"
  | "frozen_solver"
  | "frozen_cad"
  | "frozen_material"
  | "frozen_prediction";

export type Nhm2EvidenceNestedReferenceProvenanceRule = {
  provenanceClass: Nhm2EvidenceNestedReferenceProvenanceClass;
  requiredScope:
    "owning_run_output" | "verified_prior_run_output" | "immutable_input";
};

export type Nhm2EvidenceNestedReferenceVerificationItem = {
  /** RFC 6901-style location in the parsed evidence object. */
  location: string;
  referenceKey: "path" | "ref" | "ambiguous";
  rawPath: string | null;
  path: string | null;
  sha256: string | null;
  scope: Nhm2EvidenceNestedReferenceScope | null;
  provenanceClass: Nhm2EvidenceNestedReferenceProvenanceClass;
  requiredScope: Nhm2EvidenceNestedReferenceProvenanceRule["requiredScope"];
  sizeBytes: number | null;
  declaredSizeBytes: number | null;
  expectedFloat64Bytes: number | null;
  verified: boolean;
  blockers: string[];
};

export type Nhm2EvidenceNestedReferenceVerification = {
  status: "pass" | "fail";
  verified: boolean;
  referenceCount: number;
  references: Nhm2EvidenceNestedReferenceVerificationItem[];
  blockers: string[];
};

export type VerifyNhm2EvidenceNestedReferencesInput = {
  projectRoot: string;
  /** Closure evidence role selects the field-level provenance policy. */
  evidenceId: Nhm2ExperimentReadyTheoryClosureEvidenceId;
  /** Absolute or project-relative directory assigned to this runtime plan. */
  planOutputDirectory: string;
  /** Exact, project-relative files frozen before the run. Directories are not allowlisted. */
  allowedImmutableInputPaths: readonly string[];
  /** Entries bound to the executor receipt/output manifest for this plan. */
  receiptManifestEntries: readonly ReceiptManifestEntry[];
  /** Exact identity of the receipt that owns this evidence and output directory. */
  owningRunIdentity?: Nhm2EvidenceNestedReferenceRunIdentity;
  /** Exact prior run named by cross-run evidence; required only for independent replication. */
  expectedPriorRunIdentity?: Nhm2EvidenceNestedReferenceRunIdentity;
  /**
   * Exact files from successfully filesystem-verified prior receipts. No
   * directory or prefix grants authority, and freshness must be `new`.
   */
  verifiedPriorRunOutputs?: readonly Nhm2EvidenceNestedReferenceVerifiedPriorRunOutput[];
  /** Parsed raw evidence. Scientific summaries are deliberately not interpreted. */
  evidence: unknown;
};

type DiscoveredReference = {
  location: string;
  referenceKey: Nhm2EvidenceNestedReferenceVerificationItem["referenceKey"];
  rawPath: unknown;
  rawSha256: unknown;
  dtype: unknown;
  hasShape: boolean;
  shape: unknown;
  hasSizeBytes: boolean;
  declaredSizeBytes: unknown;
  binaryEncoding: unknown;
  endianness: unknown;
  storageOrder: unknown;
  hasComponentOrder: boolean;
  componentOrder: unknown;
  unit: unknown;
};

type ResolvedVerifierRoots = {
  projectRoot: string;
  realProjectRoot: string;
  outputDirectory: string;
  realOutputDirectory: string;
};

const HISTORICAL_ALPHA_07_PROFILE_RUN =
  /(?:^|\/)artifacts\/research\/full-solve\/profile-campaign-runs\/[^/]*alpha_0p7000(?:_|\/|$)/i;

const FULL_APPARATUS_CLOSURE_ARRAY_REFERENCE =
  /^\/(?:sourceTensor\/(?:rawTotalTensorArray|components\/\d+\/rawArray|terms\/\d+\/(?:rawTensorArray|couplingCoefficientArray))|metricComparison\/(?:rawMetricTensorArray|rawRequiredSourceTensorArray|rawAbsoluteResidualArray|rawRelativeResidualArray)|evolutionCoupling\/(?:coupledStateArray|couplingResidualArray))$/;

const FULL_APPARATUS_TENSOR_COMPONENT_ARRAY_REFERENCE =
  /^\/(?:sourceTensor\/(?:rawTotalTensorArray|terms\/\d+\/(?:rawTensorArray|couplingCoefficientArray))|metricComparison\/(?:rawMetricTensorArray|rawRequiredSourceTensorArray|rawAbsoluteResidualArray|rawRelativeResidualArray)|evolutionCoupling\/(?:coupledStateArray|couplingResidualArray))$/;

const SEMICLASSICAL_NUMERICAL_ARRAY_REFERENCE =
  /^\/(?:fieldState\/stateArtifact|admissibility\/twoPointFunction|stressTensor\/(?:tensor|components\/\d+\/evidence)|wardIdentity\/divergenceSamples|preparationSwitching\/dynamicSolution|uncertaintyBudget\/bounds\/\d+\/rawSamples|backreaction\/(?:geometry|sourceTensor))$/;

const WORLDLINE_QEI_NUMERICAL_ARRAY_REFERENCE =
  /^\/(?:stateBinding\/(?:stateArtifact|renormalizedStressTensor)|worldlines\/\d+\/(?:trajectory|properTimeGrid|fourVelocityArray|accelerationArray|curvatureInvariantArray|renormalizedTmunuUuSamples|samplingFunctionSamples|quadratureSamples)|uncertainty\/covariance)$/;

const FINITE_GEOMETRY_NUMERICAL_ARRAY_REFERENCE =
  /^\/(?:thermodynamics\/(?:matsubaraFrequencies|matsubaraTermContributions|temperatureSweep)|dielectricResponse\/(?:datasets\/\d+\/(?:frequencyHz|epsilonReal|epsilonImaginary)|kramersKronig\/residuals|sensitivity\/\d+\/(?:forceField|pressureField))|finiteGeometry\/(?:electricField|magneticField|maxwellStressTensor|surfaceNormals|tractionField|pressureField|integratedForceVector)|convergence\/(?:matsubaraResiduals|meshResiduals)|forceGapGradient\/(?:gapCoordinates|integratedForce|forceGradient|localPressureFields)|uncertainty\/(?:covariance|components\/\d+\/samples)|crossChecks\/independentSolver\/output)$/;

const MECHANICAL_NUMERICAL_ARRAY_REFERENCE =
  /^\/(?:forceGradientImport\/(?:forceGapCoordinates|integratedForce|forceGradient|anchorTractionField)|nonlinearFea\/(?:displacementField|strainField|stressField|temperatureField|contactPressureField|modalSpectrum)|supportRetention\/jointSamples|(?:instabilityMargins|structuralMargins)\/\d+\/rawSamples|fabricationEnvelope\/(?:jointSamples|parameters\/\d+\/samples)|activeControl\/(?:transferFunction|commandTrace|responseTrace|noiseSpectrum|heatTrace|timingTrace)|periodicCycleEnergy\/timeSeries|apparatusStressEnergy\/(?:fullSourceTensor|terms\/\d+\/tensor)|uncertainty\/covariance)$/;

const COMMON_IDENTITY_CONFIGURATION_INPUT =
  /^\/identity\/(?:preRunManifest|selectedProfile|candidateManifest|numericPolicySet|profile|chart|atlas|units|normalization)$/;
const COMMON_IDENTITY_SOLVER_INPUT =
  /^\/identity\/(?:independentPlan|formalPlan)\/(?:solver|environmentLock)$/;
const COMMON_PROVENANCE_SOLVER_INPUT =
  /^\/provenance\/(?:solver|environment|inputManifest)$/;

const immutableRule = (
  provenanceClass: Exclude<
    Nhm2EvidenceNestedReferenceProvenanceClass,
    "computed_output" | "prior_computed_output"
  >,
): Nhm2EvidenceNestedReferenceProvenanceRule => ({
  provenanceClass,
  requiredScope: "immutable_input",
});

const COMPUTED_OUTPUT_RULE: Nhm2EvidenceNestedReferenceProvenanceRule = {
  provenanceClass: "computed_output",
  requiredScope: "owning_run_output",
};

const VERIFIED_PRIOR_RUN_OUTPUT_RULE: Nhm2EvidenceNestedReferenceProvenanceRule =
  {
    provenanceClass: "prior_computed_output",
    requiredScope: "verified_prior_run_output",
  };

/**
 * Classifies every hashed evidence field before filesystem scope is resolved.
 * The default is deliberately fail-closed: fields not named here are computed
 * outputs and must be newly emitted beneath the owning execution plan.
 */
export function nhm2EvidenceNestedReferenceProvenanceRule(input: {
  evidenceId: Nhm2ExperimentReadyTheoryClosureEvidenceId;
  location: string;
}): Nhm2EvidenceNestedReferenceProvenanceRule {
  const { evidenceId, location } = input;

  if (COMMON_IDENTITY_SOLVER_INPUT.test(location)) {
    return immutableRule("frozen_solver");
  }
  if (COMMON_IDENTITY_CONFIGURATION_INPUT.test(location)) {
    return immutableRule("frozen_configuration");
  }
  if (COMMON_PROVENANCE_SOLVER_INPUT.test(location)) {
    return immutableRule(
      location.endsWith("/solver") || location.endsWith("/environment")
        ? "frozen_solver"
        : "frozen_configuration",
    );
  }

  switch (evidenceId) {
    case "full_apparatus_source_tensor":
      if (
        /^\/frozenFrame\/(?:sampleIndex|regionMasks\/\d+\/mask)$/.test(
          location,
        ) ||
        /^\/sourceTensor\/(?:constitutiveRegistry|constitutiveEquationSet)$/.test(
          location,
        )
      ) {
        return immutableRule("frozen_configuration");
      }
      if (
        /^\/(?:metricComparison\/(?:metricSolver|metricEnvironment)|evolutionCoupling\/(?:evolutionSolver|evolutionEnvironment))$/.test(
          location,
        )
      ) {
        return immutableRule("frozen_solver");
      }
      break;
    case "semiclassical_state":
      if (
        /^\/fieldState\/(?:lagrangian|equationsOfMotion|backgroundGeometry)$/.test(
          location,
        ) ||
        /^\/admissibility\/equivalenceTheorem$/.test(location) ||
        /^\/renormalization\/(?:prescription|counterterms|finiteRenormalization)$/.test(
          location,
        ) ||
        /^\/preparationSwitching\/(?:protocol|switchingFunction)$/.test(
          location,
        )
      ) {
        return immutableRule("frozen_configuration");
      }
      break;
    case "covariant_conservation":
      if (
        /^\/divergence\/(?:derivativeDefinition|volumeMask)$/.test(location) ||
        /^\/sourceTerms\/\d+\/constitutiveDefinition$/.test(location)
      ) {
        return immutableRule("frozen_configuration");
      }
      break;
    case "continuous_observer_optimizer":
      if (
        /^\/domain\/(?:timelikeManifold|nullManifold)\/atlas$/.test(location) ||
        /^\/optimizer\/objectiveDefinition$/.test(location)
      ) {
        return immutableRule("frozen_configuration");
      }
      break;
    case "worldline_qei":
      if (
        /^\/coverage\/(?:worldlineSet|coverageManifest)$/.test(location) ||
        /^\/worldlines\/\d+\/invariants\/method$/.test(location) ||
        /^\/worldlines\/\d+\/samplingFunction\/(?:definition|timingPolicy)$/.test(
          location,
        ) ||
        /^\/worldlines\/\d+\/theorem\/(?:boundExpression|applicabilityConditions)$/.test(
          location,
        ) ||
        /^\/stateBinding\/renormalizationPrescription$/.test(location)
      ) {
        return immutableRule("frozen_configuration");
      }
      break;
    case "dynamic_backreaction_stability_causality":
      if (
        /^\/initialCoupling\/(?:couplingOperator|constitutiveState)$/.test(
          location,
        ) ||
        /^\/evolution\/integrator$/.test(location)
      ) {
        return immutableRule("frozen_solver");
      }
      break;
    case "finite_temperature_finite_geometry_maxwell_stress":
      if (/^\/thermodynamics\/lifshitzKernel$/.test(location)) {
        return immutableRule("frozen_solver");
      }
      if (
        /^\/dielectricResponse\/datasets\/\d+\/(?:sourceReceipt|frequencyHz|epsilonReal|epsilonImaginary)$/.test(
          location,
        ) ||
        /^\/dielectricResponse\/sensitivity\/\d+\/constitutiveModel$/.test(
          location,
        )
      ) {
        return immutableRule("frozen_material");
      }
      if (
        /^\/finiteGeometry\/(?:cadModel|mesh|materialMap|boundaryConditions|integrationSurface)$/.test(
          location,
        )
      ) {
        return immutableRule(
          location.endsWith("/materialMap") ? "frozen_material" : "frozen_cad",
        );
      }
      if (/^\/uncertainty\/components\/\d+\/model$/.test(location)) {
        return immutableRule("frozen_material");
      }
      if (
        /^\/crossChecks\/independentSolver\/(?:solver|environment)$/.test(
          location,
        )
      ) {
        return immutableRule("frozen_solver");
      }
      break;
    case "mechanical_support_control_margin":
      if (/^\/nonlinearFea\/(?:solver|contactModel)$/.test(location)) {
        return immutableRule("frozen_solver");
      }
      if (
        /^\/nonlinearFea\/(?:geometry|mesh|boundaryConditions)$/.test(location)
      ) {
        return immutableRule("frozen_cad");
      }
      if (/^\/nonlinearFea\/materialModels$/.test(location)) {
        return immutableRule("frozen_material");
      }
      if (
        /^\/fabricationEnvelope\/parameters\/\d+\/distribution$/.test(
          location,
        ) ||
        /^\/apparatusStressEnergy\/terms\/\d+\/constitutiveModel$/.test(
          location,
        )
      ) {
        return immutableRule("frozen_material");
      }
      if (
        /^\/activeControl\/(?:controller|actuatorModel|sensorModel)$/.test(
          location,
        ) ||
        /^\/apparatusStressEnergy\/aggregationOperator$/.test(location)
      ) {
        return immutableRule("frozen_configuration");
      }
      break;
    case "independent_numerical_replication":
      if (/^\/comparison\/fields\/\d+\/primaryRawOutput$/.test(location)) {
        return VERIFIED_PRIOR_RUN_OUTPUT_RULE;
      }
      if (
        /^\/frozenReplay\/(?:candidateInputs|candidateMesh|candidateEnvironment)$/.test(
          location,
        ) ||
        /^\/comparison\/(?:frozenFieldSet|fields\/\d+\/sampleDomain)$/.test(
          location,
        )
      ) {
        return immutableRule("frozen_configuration");
      }
      if (
        /^\/reproducibilityPins\/(?:candidateContainer|independentContainer|candidateToolchain|independentToolchain)$/.test(
          location,
        )
      ) {
        return immutableRule("frozen_solver");
      }
      break;
    case "formal_manifest_certificate":
      if (
        /^\/formalKernelReplay\/preRunSourceArtifacts\/\d+$/.test(location) ||
        /^\/sourceHashRecomputation\/sources\/\d+$/.test(location) ||
        /^\/assumptions\/entries\/\d+\/evidence$/.test(location)
      ) {
        return immutableRule("frozen_configuration");
      }
      if (/^\/formalKernelReplay\/kernelBinary$/.test(location)) {
        return immutableRule("frozen_solver");
      }
      if (/^\/theoremScope\/(?:scopeManifest|theoremSource)$/.test(location)) {
        return immutableRule("frozen_configuration");
      }
      if (/^\/kernelReplay\/(?:kernelBinary|theoremBundle)$/.test(location)) {
        return immutableRule("frozen_solver");
      }
      break;
    case "prediction_falsifier_freeze":
      if (
        /^\/observables\/\d+\/predictionRef$/.test(location) ||
        /^\/registrationReceipts\/\d+\/(?:subjectRef|registryEntryRef|signatureRef|timestampAuthorityRef)$/.test(
          location,
        ) ||
        /^\/freezeManifestRef$/.test(location)
      ) {
        return immutableRule("frozen_prediction");
      }
      if (
        /^\/model\/(?:definitionRef|inputManifestRef)$/.test(location) ||
        /^\/parameterSet\/manifestRef$/.test(location) ||
        /^\/uncertaintyBudget\/(?:budgetRef|covarianceRef)$/.test(location) ||
        /^\/(?:nullControlPlan|blindingPlan|decisionPlan)\/planRef$/.test(
          location,
        ) ||
        /^\/falsifierRegistry\/registryRef$/.test(location) ||
        /^\/analysisCode\/(?:sourceTreeRef|dependencyLockRef|environmentRef|protocolRef)$/.test(
          location,
        ) ||
        /^\/supersessionPolicy\/policyRef$/.test(location)
      ) {
        return immutableRule("frozen_configuration");
      }
      break;
  }

  return COMPUTED_OUTPUT_RULE;
}

const hasOwn = (value: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

const unique = (values: readonly string[]): string[] =>
  Array.from(new Set(values));

const asRecord = (value: unknown): Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const exactRunIdentityMatches = (
  actual: Record<string, unknown>,
  expected: Nhm2EvidenceNestedReferenceRunIdentity,
): boolean =>
  actual.receiptId === expected.receiptId &&
  actual.runId === expected.runId &&
  actual.runtimeId === expected.runtimeId;

const independentRunIdentityBlockers = (input: {
  evidence: unknown;
  owningRunIdentity?: Nhm2EvidenceNestedReferenceRunIdentity;
  expectedPriorRunIdentity?: Nhm2EvidenceNestedReferenceRunIdentity;
}): string[] => {
  const blockers: string[] = [];
  if (input.owningRunIdentity == null) {
    blockers.push("independent_owning_run_identity_missing");
  }
  if (input.expectedPriorRunIdentity == null) {
    blockers.push("independent_expected_prior_run_identity_missing");
  }
  if (
    input.owningRunIdentity != null &&
    input.expectedPriorRunIdentity != null
  ) {
    if (
      input.owningRunIdentity.receiptId ===
      input.expectedPriorRunIdentity.receiptId
    ) {
      blockers.push("independent_prior_receipt_same_as_owning_receipt");
    }
    const identity = asRecord(asRecord(input.evidence).identity);
    if (
      !exactRunIdentityMatches(
        asRecord(identity.primaryExecution),
        input.expectedPriorRunIdentity,
      )
    ) {
      blockers.push("independent_primary_execution_identity_mismatch");
    }
    if (
      !exactRunIdentityMatches(
        asRecord(identity.independentPlan),
        input.owningRunIdentity,
      )
    ) {
      blockers.push("independent_owning_execution_identity_mismatch");
    }
  }
  return blockers;
};

const normalizeSha256 = (value: string): string =>
  value.toLowerCase().replace(/^sha256:/, "");

const isInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length === 0 ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
};

const escapeJsonPointer = (value: string): string =>
  value.replace(/~/g, "~0").replace(/\//g, "~1");

function parsePortableArtifactPath(
  rawPath: unknown,
  options: { allowFragment: boolean },
): { path: string | null; blocker: string | null } {
  if (typeof rawPath !== "string" || rawPath.length === 0) {
    return { path: null, blocker: "reference_path_missing_or_invalid" };
  }
  if (rawPath.trim() !== rawPath || /[\u0000-\u001f\u007f]/.test(rawPath)) {
    return { path: null, blocker: "reference_path_not_portable" };
  }
  if (rawPath.includes("\\") || rawPath.includes("?")) {
    return { path: null, blocker: "reference_path_not_portable" };
  }

  const fragmentIndex = rawPath.indexOf("#");
  if (!options.allowFragment && fragmentIndex >= 0) {
    return { path: null, blocker: "reference_path_fragment_forbidden" };
  }
  if (fragmentIndex >= 0 && rawPath.indexOf("#", fragmentIndex + 1) >= 0) {
    return { path: null, blocker: "reference_path_fragment_invalid" };
  }
  if (fragmentIndex >= 0 && fragmentIndex === rawPath.length - 1) {
    return { path: null, blocker: "reference_path_fragment_invalid" };
  }
  const filePath =
    fragmentIndex >= 0 ? rawPath.slice(0, fragmentIndex) : rawPath;
  if (
    filePath.length === 0 ||
    filePath.startsWith("./") ||
    path.posix.isAbsolute(filePath) ||
    path.win32.isAbsolute(filePath) ||
    /^[A-Za-z]:/.test(filePath) ||
    filePath.includes(":")
  ) {
    return { path: null, blocker: "reference_path_not_portable" };
  }
  const segments = filePath.split("/");
  if (
    segments.some(
      (segment) => segment.length === 0 || segment === "." || segment === "..",
    ) ||
    path.posix.normalize(filePath) !== filePath
  ) {
    return { path: null, blocker: "reference_path_not_portable" };
  }
  if (
    segments
      .flatMap((segment) => segment.toLowerCase().split(/[._-]+/))
      .some((token) => DUMMY_PATH_TOKENS.has(token))
  ) {
    return { path: null, blocker: "reference_path_dummy_or_unresolved" };
  }
  return { path: filePath, blocker: null };
}

function parseSha256(rawSha256: unknown): {
  sha256: string | null;
  blocker: string | null;
} {
  if (typeof rawSha256 !== "string") {
    return { sha256: null, blocker: "reference_sha256_missing_or_invalid" };
  }
  const sha256 = normalizeSha256(rawSha256);
  if (!SHA256_PATTERN.test(sha256) || /^0{64}$/.test(sha256)) {
    return { sha256: null, blocker: "reference_sha256_missing_or_invalid" };
  }
  return { sha256, blocker: null };
}

function discoverReferences(evidence: unknown): {
  references: DiscoveredReference[];
  blockers: string[];
} {
  const references: DiscoveredReference[] = [];
  const blockers: string[] = [];
  const visited = new WeakSet<object>();
  let visitedNodes = 0;

  const visit = (value: unknown, location: string, depth: number): void => {
    if (depth > MAX_DEPTH) {
      blockers.push("nested_reference_depth_limit_exceeded");
      return;
    }
    if (value == null || typeof value !== "object") return;
    if (visited.has(value)) {
      blockers.push(`nested_reference_cycle_detected:${location}`);
      return;
    }
    visited.add(value);
    visitedNodes += 1;
    if (visitedNodes > MAX_VISITED_NODES) {
      blockers.push("nested_reference_node_limit_exceeded");
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry, index) =>
        visit(entry, `${location}/${index}`, depth + 1),
      );
      return;
    }

    const record = value as Record<string, unknown>;
    const hasPath = hasOwn(record, "path");
    const hasRef = hasOwn(record, "ref");
    const hasSha256 = hasOwn(record, "sha256");
    if ((hasPath || hasRef) && hasSha256) {
      if (references.length >= MAX_REFERENCES) {
        blockers.push("nested_reference_count_limit_exceeded");
      } else {
        const referenceKey =
          hasPath && hasRef ? "ambiguous" : hasPath ? "path" : "ref";
        references.push({
          location,
          referenceKey,
          rawPath: hasPath ? record.path : record.ref,
          rawSha256: record.sha256,
          dtype: record.dtype,
          hasShape: hasOwn(record, "shape"),
          shape: record.shape,
          hasSizeBytes: hasOwn(record, "sizeBytes"),
          declaredSizeBytes: record.sizeBytes,
          binaryEncoding: record.binaryEncoding,
          endianness: record.endianness,
          storageOrder: record.storageOrder,
          hasComponentOrder: hasOwn(record, "componentOrder"),
          componentOrder: record.componentOrder,
          unit: record.unit,
        });
      }
    }

    Object.entries(record).forEach(([key, entry]) =>
      visit(entry, `${location}/${escapeJsonPointer(key)}`, depth + 1),
    );
  };

  visit(evidence, "", 0);
  return { references, blockers: unique(blockers) };
}

async function assertNoSymlinkComponents(
  projectRoot: string,
  absolutePath: string,
): Promise<string | null> {
  const relative = path.relative(projectRoot, absolutePath);
  if (!isInside(projectRoot, absolutePath))
    return "reference_path_outside_project";
  let cursor = projectRoot;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    try {
      const stat = await fs.lstat(cursor);
      if (stat.isSymbolicLink()) return "reference_symlink_forbidden";
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code ?? "unknown";
      return `reference_unresolvable:${code}`;
    }
  }
  return null;
}

async function resolveVerifierRoots(input: {
  projectRoot: string;
  planOutputDirectory: string;
}): Promise<{ roots: ResolvedVerifierRoots | null; blockers: string[] }> {
  const blockers: string[] = [];
  const projectRoot = path.resolve(input.projectRoot);
  const outputDirectory = path.resolve(projectRoot, input.planOutputDirectory);
  if (
    !isInside(projectRoot, outputDirectory) ||
    outputDirectory === projectRoot
  ) {
    return {
      roots: null,
      blockers: ["plan_output_directory_outside_or_equal_to_project_root"],
    };
  }
  try {
    const [projectStat, outputStat] = await Promise.all([
      fs.lstat(projectRoot),
      fs.lstat(outputDirectory),
    ]);
    if (!projectStat.isDirectory()) blockers.push("project_root_not_directory");
    if (projectStat.isSymbolicLink())
      blockers.push("project_root_symlink_forbidden");
    if (!outputStat.isDirectory())
      blockers.push("plan_output_directory_not_directory");
    if (outputStat.isSymbolicLink())
      blockers.push("plan_output_directory_symlink_forbidden");
    const componentBlocker = await assertNoSymlinkComponents(
      projectRoot,
      outputDirectory,
    );
    if (componentBlocker != null)
      blockers.push(`plan_output:${componentBlocker}`);
    const [realProjectRoot, realOutputDirectory] = await Promise.all([
      fs.realpath(projectRoot),
      fs.realpath(outputDirectory),
    ]);
    if (!isInside(realProjectRoot, realOutputDirectory)) {
      blockers.push("plan_output_directory_realpath_escape");
    }
    if (blockers.length > 0) return { roots: null, blockers: unique(blockers) };
    return {
      roots: {
        projectRoot,
        realProjectRoot,
        outputDirectory,
        realOutputDirectory,
      },
      blockers: [],
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code ?? "unknown";
    return { roots: null, blockers: [`verifier_root_unresolvable:${code}`] };
  }
}

function expectedFloat64ByteLength(reference: DiscoveredReference): {
  expectedBytes: number | null;
  blocker: string | null;
} {
  if (reference.dtype !== "float64" || !reference.hasShape) {
    return { expectedBytes: null, blocker: null };
  }
  if (
    !Array.isArray(reference.shape) ||
    reference.shape.length === 0 ||
    reference.shape.some(
      (dimension) => !Number.isSafeInteger(dimension) || dimension <= 0,
    )
  ) {
    return { expectedBytes: null, blocker: "float64_shape_invalid" };
  }
  let elementCount = 1;
  for (const dimension of reference.shape as number[]) {
    if (elementCount > Number.MAX_SAFE_INTEGER / dimension) {
      return {
        expectedBytes: null,
        blocker: "float64_shape_byte_length_overflow",
      };
    }
    elementCount *= dimension;
  }
  if (elementCount > Number.MAX_SAFE_INTEGER / 8) {
    return {
      expectedBytes: null,
      blocker: "float64_shape_byte_length_overflow",
    };
  }
  return { expectedBytes: elementCount * 8, blocker: null };
}

function resultFrom(
  references: Nhm2EvidenceNestedReferenceVerificationItem[],
  blockers: readonly string[],
): Nhm2EvidenceNestedReferenceVerification {
  const uniqueBlockers = unique(blockers);
  const verified =
    uniqueBlockers.length === 0 && references.every((entry) => entry.verified);
  return {
    status: verified ? "pass" : "fail",
    verified,
    referenceCount: references.length,
    references,
    blockers: uniqueBlockers,
  };
}

const PREDICTION_REFERENCE_LOCATION = /^\/observables\/(\d+)\/predictionRef$/;

function numericalPredictionMetadataBlockers(input: {
  evidence: unknown;
  location: string;
  prediction: Nhm2NumericalObservablePredictionV1;
}): string[] {
  const locationMatch = PREDICTION_REFERENCE_LOCATION.exec(input.location);
  if (locationMatch == null) return [];
  if (!isNhm2PredictionFalsifierFreeze(input.evidence)) {
    return ["numerical_prediction_freeze_context_invalid"];
  }
  const freeze: Nhm2PredictionFalsifierFreezeV1 = input.evidence;
  const index = Number(locationMatch[1]);
  const observable = freeze.observables[index];
  if (observable == null || observable.predictionRef == null) {
    return ["numerical_prediction_observable_index_unbound"];
  }

  const prediction = input.prediction;
  const comparisons: Array<[boolean, string]> = [
    [
      observable.predictionRef.artifactId === prediction.artifactId,
      "numerical_prediction_reference_artifact_id_mismatch",
    ],
    [
      observable.predictionRef.schemaVersion === prediction.contractVersion &&
        prediction.contractVersion ===
          NHM2_NUMERICAL_OBSERVABLE_PREDICTION_CONTRACT_VERSION,
      "numerical_prediction_reference_contract_version_mismatch",
    ],
    [
      prediction.binding.candidateId === freeze.registrationBinding.candidateId,
      "numerical_prediction_candidate_id_mismatch",
    ],
    [
      prediction.binding.selectedProfileId === freeze.selectedProfileId,
      "numerical_prediction_selected_profile_id_mismatch",
    ],
    [
      prediction.binding.freezeId === freeze.freezeId,
      "numerical_prediction_freeze_id_mismatch",
    ],
    [
      prediction.binding.modelId === freeze.model.modelId,
      "numerical_prediction_model_id_mismatch",
    ],
    [
      prediction.binding.parameterSetId === freeze.parameterSet.parameterSetId,
      "numerical_prediction_parameter_set_id_mismatch",
    ],
    [
      prediction.binding.uncertaintyBudgetId ===
        freeze.uncertaintyBudget.uncertaintyBudgetId &&
        prediction.uncertainty.uncertaintyBudgetId ===
          observable.uncertaintyBudgetId,
      "numerical_prediction_uncertainty_budget_id_mismatch",
    ],
    [
      prediction.observable.observableId === observable.observableId,
      "numerical_prediction_observable_id_mismatch",
    ],
    [
      prediction.observable.definition === observable.definition,
      "numerical_prediction_definition_mismatch",
    ],
    [
      prediction.observable.unit === observable.unit &&
        prediction.observable.coverageInterval.unit === observable.unit,
      "numerical_prediction_unit_mismatch",
    ],
    [
      prediction.observable.signOrPhase.statement ===
        observable.expectedSignOrPhase,
      "numerical_prediction_sign_or_phase_mismatch",
    ],
    [
      prediction.observable.analysisWindow === observable.analysisWindow,
      "numerical_prediction_analysis_window_mismatch",
    ],
    [
      prediction.observable.coverageInterval.coverageProbability ===
        freeze.uncertaintyBudget.coverageProbability,
      "numerical_prediction_coverage_probability_mismatch",
    ],
    [
      prediction.frozenAt === freeze.frozenAt,
      "numerical_prediction_frozen_at_mismatch",
    ],
    [
      prediction.dataCollectionOpensAt === freeze.dataCollectionOpensAt,
      "numerical_prediction_data_boundary_mismatch",
    ],
    [
      prediction.derivation.solverId === freeze.model.solverId &&
        prediction.derivation.solverVersion === freeze.model.solverVersion &&
        prediction.derivation.sourceCommitSha === freeze.model.sourceCommitSha,
      "numerical_prediction_source_derivation_mismatch",
    ],
  ];
  return comparisons
    .filter(([matches]) => !matches)
    .map(([, blocker]) => blocker);
}

function numericalPredictionProvenanceRefs(
  prediction: Nhm2NumericalObservablePredictionV1,
): Array<{
  label: string;
  ref: Nhm2NumericalObservablePredictionHashedRefV1;
}> {
  return [
    { label: "run_receipt", ref: prediction.derivation.runReceiptRef },
    { label: "source", ref: prediction.derivation.sourceRef },
    { label: "derivation", ref: prediction.derivation.derivationRef },
    { label: "uncertainty", ref: prediction.uncertainty.derivationRef },
  ];
}

async function verifyNumericalPredictionProvenanceRefs(input: {
  prediction: Nhm2NumericalObservablePredictionV1;
  predictionPath: string;
  roots: ResolvedVerifierRoots;
  allowedInputs: ReadonlySet<string>;
  fileCache: Map<string, { bytes: Buffer; sizeBytes: number }>;
}): Promise<string[]> {
  const blockers: string[] = [];
  for (const { label, ref } of numericalPredictionProvenanceRefs(
    input.prediction,
  )) {
    const parsedPath = parsePortableArtifactPath(ref.path, {
      allowFragment: false,
    });
    const parsedHash = parseSha256(ref.sha256);
    if (parsedPath.path == null || parsedPath.blocker != null) {
      blockers.push(
        `numerical_prediction_provenance_ref_invalid:${label}:${parsedPath.blocker ?? "path"}`,
      );
      continue;
    }
    if (parsedHash.sha256 == null || parsedHash.blocker != null) {
      blockers.push(
        `numerical_prediction_provenance_ref_invalid:${label}:${parsedHash.blocker ?? "sha256"}`,
      );
      continue;
    }
    if (parsedPath.path === input.predictionPath) {
      blockers.push(
        `numerical_prediction_provenance_ref_self_reference:${label}:${parsedPath.path}`,
      );
      continue;
    }
    if (HISTORICAL_ALPHA_07_PROFILE_RUN.test(parsedPath.path)) {
      blockers.push(
        `numerical_prediction_diagnostic_seed_reference_forbidden:${label}:${parsedPath.path}`,
      );
    }
    if (!input.allowedInputs.has(parsedPath.path)) {
      blockers.push(
        `numerical_prediction_provenance_ref_not_frozen:${label}:${parsedPath.path}`,
      );
      continue;
    }

    const absolutePath = path.resolve(input.roots.projectRoot, parsedPath.path);
    if (
      !isInside(input.roots.projectRoot, absolutePath) ||
      isInside(input.roots.outputDirectory, absolutePath)
    ) {
      blockers.push(
        `numerical_prediction_provenance_ref_scope_invalid:${label}:${parsedPath.path}`,
      );
      continue;
    }
    const componentBlocker = await assertNoSymlinkComponents(
      input.roots.projectRoot,
      absolutePath,
    );
    if (componentBlocker != null) {
      blockers.push(
        `numerical_prediction_provenance_ref_${componentBlocker}:${label}:${parsedPath.path}`,
      );
      continue;
    }
    try {
      const stat = await fs.lstat(absolutePath);
      if (!stat.isFile() || stat.isSymbolicLink()) {
        blockers.push(
          `numerical_prediction_provenance_ref_regular_file_required:${label}:${parsedPath.path}`,
        );
        continue;
      }
      const realPath = await fs.realpath(absolutePath);
      if (!isInside(input.roots.realProjectRoot, realPath)) {
        blockers.push(
          `numerical_prediction_provenance_ref_realpath_escape:${label}:${parsedPath.path}`,
        );
        continue;
      }
      let cached = input.fileCache.get(parsedPath.path);
      if (cached == null) {
        const handle = await fs.open(absolutePath, "r");
        try {
          const before = await handle.stat();
          const bytes = await handle.readFile();
          const after = await handle.stat();
          if (
            before.size !== after.size ||
            before.mtimeMs !== after.mtimeMs ||
            before.ctimeMs !== after.ctimeMs
          ) {
            blockers.push(
              `numerical_prediction_provenance_ref_changed_while_reading:${label}:${parsedPath.path}`,
            );
            continue;
          }
          cached = { bytes, sizeBytes: after.size };
          input.fileCache.set(parsedPath.path, cached);
        } finally {
          await handle.close();
        }
      }
      const actualSha256 = createHash("sha256")
        .update(cached.bytes)
        .digest("hex");
      if (actualSha256 !== parsedHash.sha256) {
        blockers.push(
          `numerical_prediction_provenance_ref_sha256_mismatch:${label}:${parsedPath.path}`,
        );
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code ?? "unknown";
      blockers.push(
        `numerical_prediction_provenance_ref_unresolvable:${label}:${parsedPath.path}:${code}`,
      );
    }
  }
  return unique(blockers);
}

/**
 * Verifies only the filesystem/provenance closure of hashed references nested
 * in one NHM2 evidence object. It deliberately does not recompute tensors,
 * extrema, residuals, confidence bounds, or any other scientific summary.
 */
export async function verifyNhm2EvidenceNestedReferences(
  input: VerifyNhm2EvidenceNestedReferencesInput,
): Promise<Nhm2EvidenceNestedReferenceVerification> {
  const discovered = discoverReferences(input.evidence);
  const rootsResult = await resolveVerifierRoots(input);
  const globalBlockers = [...discovered.blockers, ...rootsResult.blockers];
  if (rootsResult.roots == null) return resultFrom([], globalBlockers);
  const roots = rootsResult.roots;

  if (input.evidenceId === "independent_numerical_replication") {
    globalBlockers.push(
      ...independentRunIdentityBlockers({
        evidence: input.evidence,
        owningRunIdentity: input.owningRunIdentity,
        expectedPriorRunIdentity: input.expectedPriorRunIdentity,
      }),
    );
  }

  const verifiedPriorEntries = new Map<
    string,
    Nhm2EvidenceNestedReferenceVerifiedPriorRunOutput[]
  >();
  for (const entry of input.verifiedPriorRunOutputs ?? []) {
    const parsed = parsePortableArtifactPath(entry.path, {
      allowFragment: false,
    });
    if (parsed.path == null || parsed.blocker != null) {
      globalBlockers.push(
        `verified_prior_run_output:${entry.path}:${parsed.blocker ?? "invalid"}`,
      );
      continue;
    }
    const absolutePath = path.resolve(roots.projectRoot, parsed.path);
    if (!isInside(roots.projectRoot, absolutePath)) {
      globalBlockers.push(
        `verified_prior_run_output:${parsed.path}:outside_project`,
      );
      continue;
    }
    if (isInside(roots.outputDirectory, absolutePath)) {
      globalBlockers.push(
        `verified_prior_run_output:${parsed.path}:overlaps_owning_plan_output`,
      );
    }
    if (HISTORICAL_ALPHA_07_PROFILE_RUN.test(parsed.path)) {
      globalBlockers.push(
        `verified_prior_run_output:${parsed.path}:historical_alpha_07_forbidden`,
      );
    }
    const parsedHash = parseSha256(entry.sha256);
    if (parsedHash.sha256 == null || parsedHash.blocker != null) {
      globalBlockers.push(
        `verified_prior_run_output:${parsed.path}:sha256_invalid`,
      );
    }
    if (!Number.isSafeInteger(entry.sizeBytes) || entry.sizeBytes <= 0) {
      globalBlockers.push(
        `verified_prior_run_output:${parsed.path}:size_bytes_invalid`,
      );
    }
    if (entry.freshness !== "new") {
      globalBlockers.push(
        `verified_prior_run_output:${parsed.path}:freshness_not_new`,
      );
    }
    if (
      input.expectedPriorRunIdentity != null &&
      !exactRunIdentityMatches(
        entry as unknown as Record<string, unknown>,
        input.expectedPriorRunIdentity,
      )
    ) {
      globalBlockers.push(
        `verified_prior_run_output:${parsed.path}:run_identity_mismatch`,
      );
    }
    const existing = verifiedPriorEntries.get(parsed.path) ?? [];
    existing.push(entry);
    verifiedPriorEntries.set(parsed.path, existing);
  }

  const allowedInputs = new Set<string>();
  for (const rawPath of input.allowedImmutableInputPaths) {
    const parsed = parsePortableArtifactPath(rawPath, { allowFragment: false });
    if (parsed.blocker != null || parsed.path == null) {
      globalBlockers.push(
        `allowed_immutable_input:${rawPath}:${parsed.blocker ?? "invalid"}`,
      );
      continue;
    }
    const absolutePath = path.resolve(roots.projectRoot, parsed.path);
    if (!isInside(roots.projectRoot, absolutePath)) {
      globalBlockers.push(
        `allowed_immutable_input:${parsed.path}:outside_project`,
      );
      continue;
    }
    if (isInside(roots.outputDirectory, absolutePath)) {
      globalBlockers.push(
        `allowed_immutable_input:${parsed.path}:overlaps_plan_output`,
      );
      continue;
    }
    if (verifiedPriorEntries.has(parsed.path)) {
      globalBlockers.push(
        `allowed_immutable_input:${parsed.path}:overlaps_verified_prior_run_output`,
      );
      continue;
    }
    allowedInputs.add(parsed.path);
  }

  const manifestEntries = new Map<string, ReceiptManifestEntry[]>();
  for (const entry of input.receiptManifestEntries) {
    const parsed = parsePortableArtifactPath(entry.path, {
      allowFragment: false,
    });
    if (parsed.path == null || parsed.blocker != null) continue;
    const existing = manifestEntries.get(parsed.path) ?? [];
    existing.push(entry);
    manifestEntries.set(parsed.path, existing);
  }

  const hashByPath = new Map<string, string>();
  const fileCache = new Map<string, { bytes: Buffer; sizeBytes: number }>();
  const verifiedReferences: Nhm2EvidenceNestedReferenceVerificationItem[] = [];

  for (const reference of discovered.references) {
    const provenanceRule = nhm2EvidenceNestedReferenceProvenanceRule({
      evidenceId: input.evidenceId,
      location: reference.location,
    });
    const blockers: string[] = [];
    const addBlocker = (blocker: string): void => {
      blockers.push(blocker);
      globalBlockers.push(
        `nested_reference:${reference.location || "/"}:${blocker}`,
      );
    };
    if (reference.referenceKey === "ambiguous") {
      addBlocker("reference_path_and_ref_ambiguous");
    }
    const parsedPath = parsePortableArtifactPath(reference.rawPath, {
      allowFragment: true,
    });
    if (parsedPath.blocker != null) addBlocker(parsedPath.blocker);
    const parsedHash = parseSha256(reference.rawSha256);
    if (parsedHash.blocker != null) addBlocker(parsedHash.blocker);
    const float64Length = expectedFloat64ByteLength(reference);
    if (float64Length.blocker != null) addBlocker(float64Length.blocker);
    const strictFullApparatusArray =
      input.evidenceId === "full_apparatus_source_tensor" &&
      FULL_APPARATUS_CLOSURE_ARRAY_REFERENCE.test(reference.location);
    const strictIndependentComparisonArray =
      input.evidenceId === "independent_numerical_replication" &&
      /^\/comparison\/fields\/\d+\/(?:primaryRawOutput|independentRawOutput)$/.test(
        reference.location,
      );
    const strictSemiclassicalArray =
      input.evidenceId === "semiclassical_state" &&
      SEMICLASSICAL_NUMERICAL_ARRAY_REFERENCE.test(reference.location);
    const strictWorldlineQeiArray =
      input.evidenceId === "worldline_qei" &&
      WORLDLINE_QEI_NUMERICAL_ARRAY_REFERENCE.test(reference.location);
    const strictFiniteGeometryArray =
      input.evidenceId ===
        "finite_temperature_finite_geometry_maxwell_stress" &&
      FINITE_GEOMETRY_NUMERICAL_ARRAY_REFERENCE.test(reference.location);
    const strictMechanicalArray =
      input.evidenceId === "mechanical_support_control_margin" &&
      MECHANICAL_NUMERICAL_ARRAY_REFERENCE.test(reference.location);
    const strictNumericalArray =
      strictFullApparatusArray ||
      strictIndependentComparisonArray ||
      strictSemiclassicalArray ||
      strictWorldlineQeiArray ||
      strictFiniteGeometryArray ||
      strictMechanicalArray;
    let declaredSizeBytes: number | null = null;
    if (strictNumericalArray) {
      if (reference.dtype !== "float64") addBlocker("float64_dtype_required");
      if (!reference.hasShape) addBlocker("float64_shape_required");
      if (
        (strictSemiclassicalArray || strictWorldlineQeiArray) &&
        reference.binaryEncoding !== "raw_ieee754"
      ) {
        addBlocker("float64_raw_ieee754_encoding_required");
      }
      if (
        (strictSemiclassicalArray || strictWorldlineQeiArray) &&
        reference.endianness !== "little"
      ) {
        addBlocker("float64_little_endian_required");
      }
      if (
        reference.storageOrder !== "row-major" &&
        reference.storageOrder !== "column-major"
      ) {
        addBlocker("float64_storage_order_required");
      }
      if (!reference.hasSizeBytes) {
        addBlocker("float64_size_bytes_required");
      } else if (
        !Number.isSafeInteger(reference.declaredSizeBytes) ||
        (reference.declaredSizeBytes as number) <= 0
      ) {
        addBlocker("float64_size_bytes_invalid");
      } else {
        declaredSizeBytes = reference.declaredSizeBytes as number;
        if (
          float64Length.expectedBytes != null &&
          declaredSizeBytes !== float64Length.expectedBytes
        ) {
          addBlocker(
            `float64_declared_size_shape_mismatch:expected_${float64Length.expectedBytes}:declared_${declaredSizeBytes}`,
          );
        }
      }
      if (
        !reference.hasComponentOrder ||
        !Array.isArray(reference.componentOrder) ||
        reference.componentOrder.length === 0
      ) {
        addBlocker("float64_component_order_required");
      } else {
        if (
          reference.componentOrder.some(
            (component) =>
              typeof component !== "string" || component.trim().length === 0,
          ) ||
          new Set(reference.componentOrder).size !==
            reference.componentOrder.length
        ) {
          addBlocker("float64_component_order_invalid");
        }
      }
      if (
        FULL_APPARATUS_TENSOR_COMPONENT_ARRAY_REFERENCE.test(
          reference.location,
        ) &&
        (!Array.isArray(reference.componentOrder) ||
          reference.componentOrder.length !==
            NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS.length ||
          reference.componentOrder.some(
            (component, index) =>
              component !== NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS[index],
          ))
      ) {
        addBlocker("float64_tensor_component_order_invalid");
      }
      if (
        /^\/sourceTensor\/components\/\d+\/rawArray$/.test(
          reference.location,
        ) &&
        (!Array.isArray(reference.componentOrder) ||
          reference.componentOrder.length !== 1 ||
          !NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS.includes(
            reference
              .componentOrder[0] as (typeof NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS)[number],
          ))
      ) {
        addBlocker("float64_component_array_order_invalid");
      }
      if (
        (strictSemiclassicalArray ||
          strictWorldlineQeiArray ||
          strictFiniteGeometryArray ||
          strictMechanicalArray) &&
        (typeof reference.unit !== "string" || reference.unit.trim() === "")
      ) {
        addBlocker("float64_unit_required");
      }
    }

    let scope: Nhm2EvidenceNestedReferenceScope | null = null;
    let sizeBytes: number | null = null;
    if (parsedPath.path != null && parsedHash.sha256 != null) {
      const priorHash = hashByPath.get(parsedPath.path);
      if (priorHash != null && priorHash !== parsedHash.sha256) {
        addBlocker(`reference_hash_conflict:${parsedPath.path}`);
      } else {
        hashByPath.set(parsedPath.path, parsedHash.sha256);
      }

      const absolutePath = path.resolve(roots.projectRoot, parsedPath.path);
      if (!isInside(roots.projectRoot, absolutePath)) {
        addBlocker(`reference_path_outside_project:${parsedPath.path}`);
      } else if (isInside(roots.outputDirectory, absolutePath)) {
        scope = "run_output";
      } else if (verifiedPriorEntries.has(parsedPath.path)) {
        scope = "verified_prior_run_output";
      } else if (allowedInputs.has(parsedPath.path)) {
        scope = "immutable_input";
      } else {
        addBlocker(`reference_scope_unbound:${parsedPath.path}`);
      }

      if (
        (provenanceRule.requiredScope === "owning_run_output" ||
          provenanceRule.requiredScope === "verified_prior_run_output") &&
        HISTORICAL_ALPHA_07_PROFILE_RUN.test(parsedPath.path)
      ) {
        addBlocker(
          `historical_alpha_07_computed_reference_forbidden:${parsedPath.path}`,
        );
      }
      if (
        scope != null &&
        provenanceRule.requiredScope === "owning_run_output" &&
        scope !== "run_output"
      ) {
        addBlocker(
          `computed_reference_requires_owning_plan_output:${parsedPath.path}`,
        );
      }
      if (
        scope != null &&
        provenanceRule.requiredScope === "immutable_input" &&
        scope !== "immutable_input"
      ) {
        addBlocker(
          `frozen_reference_requires_pre_run_input:${provenanceRule.provenanceClass}:${parsedPath.path}`,
        );
      }
      if (
        scope != null &&
        provenanceRule.requiredScope === "verified_prior_run_output" &&
        scope !== "verified_prior_run_output"
      ) {
        addBlocker(
          `prior_computed_reference_requires_verified_prior_run_output:${parsedPath.path}`,
        );
      }

      const componentBlocker = await assertNoSymlinkComponents(
        roots.projectRoot,
        absolutePath,
      );
      if (componentBlocker != null)
        addBlocker(`${componentBlocker}:${parsedPath.path}`);

      if (componentBlocker == null && scope != null) {
        try {
          const stat = await fs.lstat(absolutePath);
          if (stat.isSymbolicLink()) {
            addBlocker(`reference_symlink_forbidden:${parsedPath.path}`);
          } else if (!stat.isFile()) {
            addBlocker(`reference_regular_file_required:${parsedPath.path}`);
          } else {
            const realPath = await fs.realpath(absolutePath);
            if (!isInside(roots.realProjectRoot, realPath)) {
              addBlocker(`reference_realpath_escape:${parsedPath.path}`);
            } else if (
              scope === "run_output" &&
              !isInside(roots.realOutputDirectory, realPath)
            ) {
              addBlocker(`reference_output_realpath_escape:${parsedPath.path}`);
            } else {
              let cached = fileCache.get(parsedPath.path);
              if (cached == null) {
                const handle = await fs.open(absolutePath, "r");
                try {
                  const before = await handle.stat();
                  const bytes = await handle.readFile();
                  const after = await handle.stat();
                  if (
                    before.size !== after.size ||
                    before.mtimeMs !== after.mtimeMs ||
                    before.ctimeMs !== after.ctimeMs
                  ) {
                    addBlocker(
                      `reference_changed_while_reading:${parsedPath.path}`,
                    );
                  } else {
                    cached = { bytes, sizeBytes: after.size };
                    fileCache.set(parsedPath.path, cached);
                  }
                } finally {
                  await handle.close();
                }
              }
              if (cached != null) {
                sizeBytes = cached.sizeBytes;
                const actualSha256 = createHash("sha256")
                  .update(cached.bytes)
                  .digest("hex");
                if (actualSha256 !== parsedHash.sha256) {
                  addBlocker(`reference_sha256_mismatch:${parsedPath.path}`);
                }
                if (
                  float64Length.expectedBytes != null &&
                  cached.sizeBytes !== float64Length.expectedBytes
                ) {
                  addBlocker(
                    `float64_shape_byte_length_mismatch:${parsedPath.path}:expected_${float64Length.expectedBytes}:actual_${cached.sizeBytes}`,
                  );
                }
                if (
                  declaredSizeBytes != null &&
                  cached.sizeBytes !== declaredSizeBytes
                ) {
                  addBlocker(
                    `float64_declared_size_byte_length_mismatch:${parsedPath.path}:declared_${declaredSizeBytes}:actual_${cached.sizeBytes}`,
                  );
                }
                if (PREDICTION_REFERENCE_LOCATION.test(reference.location)) {
                  let parsedPrediction: unknown;
                  try {
                    parsedPrediction = JSON.parse(
                      cached.bytes.toString("utf8"),
                    ) as unknown;
                  } catch {
                    addBlocker("numerical_prediction_json_invalid");
                    parsedPrediction = null;
                  }
                  if (
                    parsedPrediction != null &&
                    isNhm2NumericalObservablePrediction(parsedPrediction)
                  ) {
                    for (const blocker of numericalPredictionMetadataBlockers({
                      evidence: input.evidence,
                      location: reference.location,
                      prediction: parsedPrediction,
                    })) {
                      addBlocker(blocker);
                    }
                    for (const blocker of await verifyNumericalPredictionProvenanceRefs(
                      {
                        prediction: parsedPrediction,
                        predictionPath: parsedPath.path,
                        roots,
                        allowedInputs,
                        fileCache,
                      },
                    )) {
                      addBlocker(blocker);
                    }
                  } else if (parsedPrediction != null) {
                    addBlocker("numerical_prediction_schema_invalid");
                  }
                }
              }
            }
          }
        } catch (error) {
          const code = (error as NodeJS.ErrnoException).code ?? "unknown";
          addBlocker(`reference_unresolvable:${parsedPath.path}:${code}`);
        }
      }

      if (scope === "run_output") {
        const matchingEntries = manifestEntries.get(parsedPath.path) ?? [];
        if (matchingEntries.length === 0) {
          addBlocker(`receipt_manifest_entry_missing:${parsedPath.path}`);
        } else if (matchingEntries.length > 1) {
          addBlocker(`receipt_manifest_entry_ambiguous:${parsedPath.path}`);
        } else {
          const entry = matchingEntries[0];
          const entryHash = parseSha256(entry.sha256);
          if (entryHash.sha256 == null || entryHash.blocker != null) {
            addBlocker(`receipt_manifest_sha256_invalid:${parsedPath.path}`);
          } else if (entryHash.sha256 !== parsedHash.sha256) {
            addBlocker(`receipt_manifest_sha256_mismatch:${parsedPath.path}`);
          }
          if (!Number.isSafeInteger(entry.sizeBytes) || entry.sizeBytes < 0) {
            addBlocker(`receipt_manifest_size_invalid:${parsedPath.path}`);
          } else if (sizeBytes != null && entry.sizeBytes !== sizeBytes) {
            addBlocker(`receipt_manifest_size_mismatch:${parsedPath.path}`);
          }
          if (entry.freshness !== "new") {
            addBlocker(`receipt_manifest_freshness_not_new:${parsedPath.path}`);
          }
        }
      }
      if (scope === "verified_prior_run_output") {
        const matchingEntries = verifiedPriorEntries.get(parsedPath.path) ?? [];
        if (matchingEntries.length === 0) {
          addBlocker(
            `verified_prior_run_manifest_entry_missing:${parsedPath.path}`,
          );
        } else if (matchingEntries.length > 1) {
          addBlocker(
            `verified_prior_run_manifest_entry_ambiguous:${parsedPath.path}`,
          );
        } else {
          const entry = matchingEntries[0];
          const entryHash = parseSha256(entry.sha256);
          if (entryHash.sha256 == null || entryHash.blocker != null) {
            addBlocker(
              `verified_prior_run_manifest_sha256_invalid:${parsedPath.path}`,
            );
          } else if (entryHash.sha256 !== parsedHash.sha256) {
            addBlocker(
              `verified_prior_run_manifest_sha256_mismatch:${parsedPath.path}`,
            );
          }
          if (!Number.isSafeInteger(entry.sizeBytes) || entry.sizeBytes <= 0) {
            addBlocker(
              `verified_prior_run_manifest_size_invalid:${parsedPath.path}`,
            );
          } else if (sizeBytes != null && entry.sizeBytes !== sizeBytes) {
            addBlocker(
              `verified_prior_run_manifest_size_mismatch:${parsedPath.path}`,
            );
          }
          if (entry.freshness !== "new") {
            addBlocker(
              `verified_prior_run_manifest_freshness_not_new:${parsedPath.path}`,
            );
          }
          if (
            input.expectedPriorRunIdentity == null ||
            !exactRunIdentityMatches(
              entry as unknown as Record<string, unknown>,
              input.expectedPriorRunIdentity,
            )
          ) {
            addBlocker(
              `verified_prior_run_manifest_identity_mismatch:${parsedPath.path}`,
            );
          }
          if (
            input.owningRunIdentity != null &&
            entry.receiptId === input.owningRunIdentity.receiptId
          ) {
            addBlocker(
              `verified_prior_run_manifest_same_as_owning_receipt:${parsedPath.path}`,
            );
          }
        }
      }
    }

    verifiedReferences.push({
      location: reference.location,
      referenceKey: reference.referenceKey,
      rawPath: typeof reference.rawPath === "string" ? reference.rawPath : null,
      path: parsedPath.path,
      sha256: parsedHash.sha256,
      scope,
      provenanceClass: provenanceRule.provenanceClass,
      requiredScope: provenanceRule.requiredScope,
      sizeBytes,
      declaredSizeBytes,
      expectedFloat64Bytes: float64Length.expectedBytes,
      verified: blockers.length === 0,
      blockers: unique(blockers),
    });
  }

  return resultFrom(verifiedReferences, globalBlockers);
}
