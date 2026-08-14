import { createHash } from "node:crypto";

import {
  canonicalNhm2ConformallyFlatNeedleMeanRsetAnomalyReductionJson,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_SIZE_BYTES,
} from "../../../shared/contracts/nhm2-conformally-flat-needle-mean-rset-anomaly-reduction.v1";
import { NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE } from "../../../shared/contracts/nhm2-conformally-flat-needle-scalar-reference.v1";

const EXPECTED_ANOMALY_REDUCTION_SHA256 =
  "23407c8531145652f7ffd7100612268570f3f67d9f3a1897bb5de07ba48563ce" as const;
const EXPECTED_ANOMALY_REDUCTION_SIZE_BYTES = 11125 as const;

const anomalyCanonicalJson =
  canonicalNhm2ConformallyFlatNeedleMeanRsetAnomalyReductionJson(
    NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION,
  );
const anomalyCanonicalBytes = Buffer.from(anomalyCanonicalJson, "utf8");
const anomalyActualSha256 = createHash("sha256")
  .update(anomalyCanonicalBytes)
  .digest("hex");

if (
  anomalyActualSha256 !== EXPECTED_ANOMALY_REDUCTION_SHA256 ||
  anomalyCanonicalBytes.byteLength !== EXPECTED_ANOMALY_REDUCTION_SIZE_BYTES ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_SHA256 !==
    EXPECTED_ANOMALY_REDUCTION_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_SIZE_BYTES !==
    EXPECTED_ANOMALY_REDUCTION_SIZE_BYTES
) {
  throw new Error(
    "nhm2_mean_rset_pointwise_kernel_anomaly_reduction_literal_pin_mismatch",
  );
}

const REDUCTION =
  NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION.content;
const scalarCanonicalJson =
  canonicalNhm2ConformallyFlatNeedleMeanRsetAnomalyReductionJson(
    NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE,
  );
const scalarCanonicalBytes = Buffer.from(scalarCanonicalJson, "utf8");
const scalarActualSha256 = createHash("sha256")
  .update(scalarCanonicalBytes)
  .digest("hex");

if (
  scalarActualSha256 !== REDUCTION.upstreamBindings.scalarReference.sha256 ||
  scalarCanonicalBytes.byteLength !==
    REDUCTION.upstreamBindings.scalarReference.sizeBytes ||
  REDUCTION.status !==
    "blocked_exact_anomaly_reduction_frozen_execution_unavailable" ||
  REDUCTION.reducedMeanRset.formula !==
    "<T_AB>_ren=(conformalAnomalyK_AB-(1/6)*H1_AB)/(2880*pi^2)" ||
  REDUCTION.conformalAnomalyTensor.tensorName !== "conformalAnomalyK" ||
  REDUCTION.conformalAnomalyTensor
    .mechanicallyDistinctFromMeanConventionFiniteWaldH3 !== true ||
  Object.values(REDUCTION.authority.locks).some((value) => value !== false) ||
  Object.values(REDUCTION.claimLocks).some((value) => value !== false)
) {
  throw new Error(
    "nhm2_mean_rset_pointwise_kernel_upstream_blocked_state_drift",
  );
}

export const NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_DIAGNOSTIC_KERNEL_SCHEMA_VERSION =
  "nhm2_conformally_flat_needle_mean_rset_pointwise_diagnostic_kernel/v1" as const;

export type Nhm2ConformallyFlatNeedleMeanRsetDiagnosticKernelErrorCode =
  | "unexpected_arguments"
  | "hard_resource_cap_exceeded"
  | "fixture_integrity_failure"
  | "numeric_failure"
  | "algebra_identity_failure";

export class Nhm2ConformallyFlatNeedleMeanRsetDiagnosticKernelError extends Error {
  readonly code: Nhm2ConformallyFlatNeedleMeanRsetDiagnosticKernelErrorCode;
  readonly partialResult: null;

  constructor(
    code: Nhm2ConformallyFlatNeedleMeanRsetDiagnosticKernelErrorCode,
    message: string,
    options: { cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "Nhm2ConformallyFlatNeedleMeanRsetDiagnosticKernelError";
    this.code = code;
    this.partialResult = null;
  }
}

const fail = (
  code: Nhm2ConformallyFlatNeedleMeanRsetDiagnosticKernelErrorCode,
  message: string,
): never => {
  throw new Nhm2ConformallyFlatNeedleMeanRsetDiagnosticKernelError(
    code,
    message,
  );
};

const COMPONENT_ORDER = Object.freeze([
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
] as const);
const COMPONENT_PAIRS = Object.freeze([
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 1],
  [1, 2],
  [1, 3],
  [2, 2],
  [2, 3],
  [3, 3],
] as const);

type Tensor10 = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

type FrozenFixture = {
  readonly id:
    | "flat_constant_omega"
    | "constant_curvature"
    | "sympy_direct_off_axis_conformal";
  readonly omegaSquared: number;
  readonly ricciCovariant: Tensor10;
  readonly scalarCurvature: number;
  readonly covariantScalarHessian: Tensor10;
  readonly boxScalarCurvature: number;
};

const ETA = Object.freeze([-1, 1, 1, 1] as const);
const POINTWISE_FIXTURE_COUNT = 3;
const MAXIMUM_POINTWISE_FIXTURE_COUNT = 3;
const MAXIMUM_TENSOR_COMPONENT_EVALUATIONS = 500;
const PLANNED_TENSOR_COMPONENT_EVALUATIONS = 210;
const SCALED_IDENTITY_LIMIT = 2e-12;
const MEAN_NORMALIZATION = 1 / (2880 * Math.PI * Math.PI);
const H_EXACT_J_S = 6.62607015e-34;
const C_EXACT_M_PER_S = 299792458;
const HBAR_C_J_M = (H_EXACT_J_S * C_EXACT_M_PER_S) / (2 * Math.PI);

const canonicalFinite = (value: number, label: string): number => {
  if (!Number.isFinite(value)) {
    return fail(
      "numeric_failure",
      `nhm2_mean_rset_pointwise_kernel_nonfinite:${label}`,
    );
  }
  return Object.is(value, -0) ? 0 : value;
};

const tensor10 = (values: readonly number[], label: string): Tensor10 => {
  if (values.length !== COMPONENT_ORDER.length) {
    return fail(
      "fixture_integrity_failure",
      `nhm2_mean_rset_pointwise_kernel_tensor_shape:${label}`,
    );
  }
  return Object.freeze(
    values.map((value, index) => canonicalFinite(value, `${label}_${index}`)),
  ) as unknown as Tensor10;
};

const fraction = (literal: string): number => {
  const match = /^(-?\d+)(?:\/(\d+))?$/.exec(literal);
  if (match == null) {
    return fail(
      "fixture_integrity_failure",
      "nhm2_mean_rset_pointwise_kernel_fraction_literal_invalid",
    );
  }
  const numerator = BigInt(match[1]);
  const denominator = BigInt(match[2] ?? "1");
  if (denominator <= 0n) {
    return fail(
      "fixture_integrity_failure",
      "nhm2_mean_rset_pointwise_kernel_fraction_denominator_invalid",
    );
  }
  return canonicalFinite(
    Number(numerator) / Number(denominator),
    "fraction_value",
  );
};

const SYMPY_EXACT_FIXTURE = Object.freeze({
  generator: "SymPy_1.14_direct_metric_christoffel_ricci" as const,
  metric: "g_AB=Omega^2*diag(-1,1,1,1)" as const,
  omega: "Omega=1+x+2*y-z+x*y+y*z+x^2+2*y^2+3*z^2" as const,
  point: Object.freeze({
    t: "0" as const,
    x: "1/10" as const,
    y: "1/20" as const,
    z: "-1/30" as const,
  }),
  omegaSquared: "63001/40000" as const,
  scalarCurvature: "-576000000/15813251" as const,
  boxScalarCurvature: "-2724864000000000000/62764785704439251" as const,
  componentOrder: COMPONENT_ORDER,
  ricciCovariant: Object.freeze([
    "8309800/567009",
    "0",
    "0",
    "0",
    "-7867000/567009",
    "1058800/189003",
    "-230000/63001",
    "-1508600/189003",
    "-1552400/189003",
    "-11827000/567009",
  ] as const),
  covariantScalarHessian: Object.freeze([
    "-554534400000000/996250626251",
    "0",
    "0",
    "0",
    "80025600000000/996250626251",
    "-1088294400000000/996250626251",
    "596160000000000/996250626251",
    "-1229222400000000/996250626251",
    "1167782400000000/996250626251",
    "526540800000000/996250626251",
  ] as const),
});

const FIXTURES = Object.freeze([
  Object.freeze({
    id: "flat_constant_omega" as const,
    omegaSquared: 4,
    ricciCovariant: tensor10(Array<number>(10).fill(0), "flat_ricci"),
    scalarCurvature: 0,
    covariantScalarHessian: tensor10(Array<number>(10).fill(0), "flat_hessian"),
    boxScalarCurvature: 0,
  }),
  Object.freeze({
    id: "constant_curvature" as const,
    omegaSquared: 1,
    ricciCovariant: tensor10(
      [-3, 0, 0, 0, 3, 0, 0, 3, 0, 3],
      "constant_curvature_ricci",
    ),
    scalarCurvature: 12,
    covariantScalarHessian: tensor10(
      Array<number>(10).fill(0),
      "constant_curvature_hessian",
    ),
    boxScalarCurvature: 0,
  }),
  Object.freeze({
    id: "sympy_direct_off_axis_conformal" as const,
    omegaSquared: fraction(SYMPY_EXACT_FIXTURE.omegaSquared),
    ricciCovariant: tensor10(
      SYMPY_EXACT_FIXTURE.ricciCovariant.map(fraction),
      "sympy_ricci",
    ),
    scalarCurvature: fraction(SYMPY_EXACT_FIXTURE.scalarCurvature),
    covariantScalarHessian: tensor10(
      SYMPY_EXACT_FIXTURE.covariantScalarHessian.map(fraction),
      "sympy_hessian",
    ),
    boxScalarCurvature: fraction(SYMPY_EXACT_FIXTURE.boxScalarCurvature),
  }),
] satisfies readonly FrozenFixture[]);

const matrixFromTensor10 = (tensor: Tensor10): number[][] => {
  const matrix = Array.from({ length: 4 }, () => Array<number>(4).fill(0));
  COMPONENT_PAIRS.forEach(([a, b], index) => {
    matrix[a][b] = tensor[index];
    matrix[b][a] = tensor[index];
  });
  return matrix;
};

const scaledResidual = (left: number, right: number): number =>
  canonicalFinite(
    Math.abs(left - right) / (1 + Math.max(Math.abs(left), Math.abs(right))),
    "scaled_residual",
  );

const evaluatePointwiseFixture = (fixture: FrozenFixture) => {
  const inverseMetricDiagonal = ETA.map(
    (signature) => signature / fixture.omegaSquared,
  );
  const metricDiagonal = ETA.map(
    (signature) => signature * fixture.omegaSquared,
  );
  const ricci = matrixFromTensor10(fixture.ricciCovariant);
  const hessian = matrixFromTensor10(fixture.covariantScalarHessian);
  const scalarFromRicci = inverseMetricDiagonal.reduce(
    (sum, inverseMetric, axis) => sum + inverseMetric * ricci[axis][axis],
    0,
  );
  const boxFromHessian = inverseMetricDiagonal.reduce(
    (sum, inverseMetric, axis) => sum + inverseMetric * hessian[axis][axis],
    0,
  );
  const inputScalarContractionScaledResidual = scaledResidual(
    scalarFromRicci,
    fixture.scalarCurvature,
  );
  const inputBoxContractionScaledResidual = scaledResidual(
    boxFromHessian,
    fixture.boxScalarCurvature,
  );
  if (
    inputScalarContractionScaledResidual > SCALED_IDENTITY_LIMIT ||
    inputBoxContractionScaledResidual > SCALED_IDENTITY_LIMIT
  ) {
    fail(
      "fixture_integrity_failure",
      `nhm2_mean_rset_pointwise_kernel_fixture_contraction:${fixture.id}`,
    );
  }

  let ricciSquared = 0;
  for (let a = 0; a < 4; a += 1) {
    for (let b = 0; b < 4; b += 1) {
      ricciSquared +=
        inverseMetricDiagonal[a] *
        inverseMetricDiagonal[b] *
        ricci[a][b] *
        ricci[a][b];
    }
  }

  const h1Values: number[] = [];
  const kValues: number[] = [];
  const meanValues: number[] = [];
  for (const [a, b] of COMPONENT_PAIRS) {
    let mixedRicciProduct = 0;
    for (let c = 0; c < 4; c += 1) {
      mixedRicciProduct += inverseMetricDiagonal[c] * ricci[a][c] * ricci[b][c];
    }
    const metric = a === b ? metricDiagonal[a] : 0;
    const h1 =
      2 * hessian[a][b] -
      2 * fixture.scalarCurvature * ricci[a][b] +
      metric *
        (-2 * fixture.boxScalarCurvature +
          0.5 * fixture.scalarCurvature * fixture.scalarCurvature);
    const conformalAnomalyK =
      -mixedRicciProduct +
      (2 / 3) * fixture.scalarCurvature * ricci[a][b] +
      0.5 * metric * ricciSquared -
      0.25 * metric * fixture.scalarCurvature * fixture.scalarCurvature;
    h1Values.push(canonicalFinite(h1, `${fixture.id}_H1_${a}${b}`));
    kValues.push(
      canonicalFinite(
        conformalAnomalyK,
        `${fixture.id}_conformalAnomalyK_${a}${b}`,
      ),
    );
    meanValues.push(
      canonicalFinite(
        MEAN_NORMALIZATION * (conformalAnomalyK - h1 / 6),
        `${fixture.id}_mean_${a}${b}`,
      ),
    );
  }

  const h1 = tensor10(h1Values, `${fixture.id}_H1`);
  const conformalAnomalyK = tensor10(
    kValues,
    `${fixture.id}_conformalAnomalyK`,
  );
  const meanRsetGeometric = tensor10(meanValues, `${fixture.id}_mean`);
  const meanRsetSi = tensor10(
    meanValues.map((value) => value * HBAR_C_J_M),
    `${fixture.id}_mean_si`,
  );
  const trace = (tensor: Tensor10): number =>
    inverseMetricDiagonal[0] * tensor[0] +
    inverseMetricDiagonal[1] * tensor[4] +
    inverseMetricDiagonal[2] * tensor[7] +
    inverseMetricDiagonal[3] * tensor[9];
  const kTrace = canonicalFinite(trace(conformalAnomalyK), "K_trace");
  const h1Trace = canonicalFinite(trace(h1), "H1_trace");
  const meanTrace = canonicalFinite(trace(meanRsetGeometric), "mean_trace");
  const expectedKTrace = ricciSquared - fixture.scalarCurvature ** 2 / 3;
  const expectedH1Trace = -6 * fixture.boxScalarCurvature;
  const expectedMeanTrace =
    MEAN_NORMALIZATION *
    (fixture.boxScalarCurvature +
      ricciSquared -
      fixture.scalarCurvature ** 2 / 3);
  const identityResiduals = Object.freeze({
    conformalAnomalyKTrace: scaledResidual(kTrace, expectedKTrace),
    H1Trace: scaledResidual(h1Trace, expectedH1Trace),
    meanRsetTrace: scaledResidual(meanTrace, expectedMeanTrace),
  });
  if (
    Object.values(identityResiduals).some(
      (residual) => residual > SCALED_IDENTITY_LIMIT,
    )
  ) {
    fail(
      "algebra_identity_failure",
      `nhm2_mean_rset_pointwise_kernel_trace_identity:${fixture.id}`,
    );
  }

  return Object.freeze({
    fixtureId: fixture.id,
    input: Object.freeze({
      omegaSquared: fixture.omegaSquared,
      ricciCovariant: tensor10(
        [...fixture.ricciCovariant],
        `${fixture.id}_input_ricci_copy`,
      ),
      scalarCurvature: fixture.scalarCurvature,
      covariantScalarHessian: tensor10(
        [...fixture.covariantScalarHessian],
        `${fixture.id}_input_hessian_copy`,
      ),
      boxScalarCurvature: fixture.boxScalarCurvature,
      inputScalarContractionScaledResidual,
      inputBoxContractionScaledResidual,
    }),
    output: Object.freeze({
      ricciSquared: canonicalFinite(ricciSquared, "ricci_squared"),
      conformalAnomalyK,
      H1: h1,
      meanRsetGeometric,
      meanRsetSi,
      traces: Object.freeze({
        conformalAnomalyK: kTrace,
        expectedConformalAnomalyK: canonicalFinite(
          expectedKTrace,
          "expected_K_trace",
        ),
        H1: h1Trace,
        expectedH1: canonicalFinite(expectedH1Trace, "expected_H1_trace"),
        meanRsetGeometric: meanTrace,
        expectedMeanRsetGeometric: canonicalFinite(
          expectedMeanTrace,
          "expected_mean_trace",
        ),
      }),
      identityResiduals,
    }),
  });
};

const assertResourcePlan = (): void => {
  if (
    POINTWISE_FIXTURE_COUNT > MAXIMUM_POINTWISE_FIXTURE_COUNT ||
    PLANNED_TENSOR_COMPONENT_EVALUATIONS > MAXIMUM_TENSOR_COMPONENT_EVALUATIONS
  ) {
    fail(
      "hard_resource_cap_exceeded",
      "nhm2_mean_rset_pointwise_kernel_hard_resource_cap_exceeded",
    );
  }
};

export function calculateNhm2ConformallyFlatNeedleMeanRsetDiagnostic() {
  if (arguments.length !== 0) {
    fail(
      "unexpected_arguments",
      "nhm2_mean_rset_pointwise_kernel_accepts_no_arguments",
    );
  }
  assertResourcePlan();
  const pointwiseFixtures = FIXTURES.map(evaluatePointwiseFixture);
  const flat = pointwiseFixtures[0];
  const constantCurvature = pointwiseFixtures[1];
  const constantCurvatureR = constantCurvature.input.scalarCurvature;
  const constantCurvatureMetricCoefficient =
    -(constantCurvatureR * constantCurvatureR) / 48;
  const expectedConstantCurvatureK = tensor10(
    COMPONENT_PAIRS.map(([a, b]) =>
      a === b ? constantCurvatureMetricCoefficient * ETA[a] : 0,
    ),
    "constant_curvature_expected_K",
  );
  const constantCurvatureScaledResidual = Math.max(
    ...constantCurvature.output.conformalAnomalyK.map((value, index) =>
      scaledResidual(value, expectedConstantCurvatureK[index]),
    ),
  );
  const flatPass = [
    ...flat.output.conformalAnomalyK,
    ...flat.output.H1,
    ...flat.output.meanRsetGeometric,
  ].every((value) => value === 0);
  if (!flatPass || constantCurvatureScaledResidual > SCALED_IDENTITY_LIMIT) {
    fail(
      "algebra_identity_failure",
      "nhm2_mean_rset_pointwise_kernel_named_fixture_failure",
    );
  }

  const maximumTraceIdentityScaledResidual = Math.max(
    ...pointwiseFixtures.flatMap((fixture) =>
      Object.values(fixture.output.identityResiduals),
    ),
  );
  const maximumInputContractionScaledResidual = Math.max(
    ...pointwiseFixtures.flatMap((fixture) => [
      fixture.input.inputScalarContractionScaledResidual,
      fixture.input.inputBoxContractionScaledResidual,
    ]),
  );

  return Object.freeze({
    schemaVersion:
      NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_DIAGNOSTIC_KERNEL_SCHEMA_VERSION,
    status: "blocked_diagnostic_pointwise_algebra_only" as const,
    upstreamBinding: Object.freeze({
      artifactId:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_ARTIFACT_ID,
      contractVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_MEAN_RSET_ANOMALY_REDUCTION_CONTRACT_VERSION,
      canonicalSha256: EXPECTED_ANOMALY_REDUCTION_SHA256,
      canonicalSizeBytes: EXPECTED_ANOMALY_REDUCTION_SIZE_BYTES,
      exactIdentityVerifiedAtModuleInitialization: true as const,
      bindingGrantsAuthority: false as const,
    }),
    formula: Object.freeze({
      conformalAnomalyK:
        "K_AB=-R_A^C*R_BC+(2/3)*R*R_AB+(1/2)*g_AB*R_CD*R^CD-(1/4)*g_AB*R^2" as const,
      H1: "H1_AB=2*nabla_A*nabla_B(R)-2*R*R_AB+g_AB*(-2*box_g(R)+(1/2)*R^2)" as const,
      meanRset:
        "<T_AB>_ren=(conformalAnomalyK_AB-(1/6)*H1_AB)/(2880*pi^2)" as const,
      trace: "g^AB<T_AB>=(box_g(R)+R_AB*R^AB-(1/3)*R^2)/(2880*pi^2)" as const,
      siRestoration: "h*c/(2*pi)" as const,
      exactHDecimal: "6.62607015e-34" as const,
      exactCInteger: "299792458" as const,
    }),
    componentOrder: Object.freeze([...COMPONENT_ORDER]),
    pointwiseFixtures: Object.freeze(pointwiseFixtures),
    algebraChecks: Object.freeze({
      flatConstantOmegaPass: true as const,
      constantCurvaturePass: true as const,
      constantCurvatureScaledResidual: canonicalFinite(
        constantCurvatureScaledResidual,
        "constant_curvature_residual",
      ),
      maximumTraceIdentityScaledResidual: canonicalFinite(
        maximumTraceIdentityScaledResidual,
        "maximum_trace_identity_residual",
      ),
      maximumInputContractionScaledResidual: canonicalFinite(
        maximumInputContractionScaledResidual,
        "maximum_input_contraction_residual",
      ),
      scaledResidualLimit: SCALED_IDENTITY_LIMIT,
      diagnosticOnly: true as const,
      wardIdentityProof: false as const,
    }),
    frozenSympyFixtureAudit: Object.freeze({
      generator: SYMPY_EXACT_FIXTURE.generator,
      metric: SYMPY_EXACT_FIXTURE.metric,
      omega: SYMPY_EXACT_FIXTURE.omega,
      point: Object.freeze({ ...SYMPY_EXACT_FIXTURE.point }),
      omegaSquared: SYMPY_EXACT_FIXTURE.omegaSquared,
      scalarCurvature: SYMPY_EXACT_FIXTURE.scalarCurvature,
      boxScalarCurvature: SYMPY_EXACT_FIXTURE.boxScalarCurvature,
      componentOrder: Object.freeze([...SYMPY_EXACT_FIXTURE.componentOrder]),
      ricciCovariant: Object.freeze([...SYMPY_EXACT_FIXTURE.ricciCovariant]),
      covariantScalarHessian: Object.freeze([
        ...SYMPY_EXACT_FIXTURE.covariantScalarHessian,
      ]),
      generatedOutsideKernel: true as const,
      generatedFromMetricViaChristoffels: true as const,
      arbitraryNonAxisPoint: true as const,
      liveSympyExecutionByKernel: false as const,
      frozenFixtureAgreementIsRuntimeIndependentLineage: false as const,
      grantsAuthority: false as const,
    }),
    fixedCalculation: Object.freeze({
      zeroArgumentApi: true as const,
      callerInputAccepted: false as const,
      pathInputAccepted: false as const,
      processInputAccepted: false as const,
      writerCapabilityPresent: false as const,
      metricDemandAccepted: false as const,
      declaredLeverTensorAccepted: false as const,
      toleranceOverrideAccepted: false as const,
      workOverrideAccepted: false as const,
      authorityOverrideAccepted: false as const,
      pointwiseFixtureCount: POINTWISE_FIXTURE_COUNT,
      plannedTensorComponentEvaluations: PLANNED_TENSOR_COMPONENT_EVALUATIONS,
      maximumTensorComponentEvaluations: MAXIMUM_TENSOR_COMPONENT_EVALUATIONS,
      hardCapDisposition: "typed_abort_without_partial_result" as const,
    }),
    full64x10MeanRset: null,
    sampleWeights: null,
    smearing: null,
    diagnosticRefinementRadius: null,
    absoluteUncertainty95: null,
    coverage: null,
    deterministicEnclosure: null,
    wardIdentityProof: null,
    runReceipt: null,
    executionReceipt: null,
    replayReceipt: null,
    certificate: null,
    blockers: Object.freeze([
      "full_64x10_smearing_kernel_not_implemented",
      "fourth_order_conformal_geometry_not_retained_without_live_independent_crosscheck",
      "frozen_sympy_fixture_is_not_live_independent_runtime_agreement",
      "herzog_huang_source_artifact_bytes_not_vendored_and_locally_hash_verified",
      "binary64_pointwise_diagnostic_not_interval_enclosed",
      "uncertainty_and_coverage_not_computed",
      "fixed_background_matter_ward_identity_not_verified",
      "run_preseal_and_raw_output_receipts_absent",
      "full_gravity_matter_ADM_constraint_algebra_out_of_scope_and_unproved",
      "certificate_ineligible",
    ] as const),
    authority: Object.freeze({
      meanRsetAuthority: false as const,
      uncertaintyAuthority: false as const,
      coverageAuthority: false as const,
      u95Authority: false as const,
      intervalAuthority: false as const,
      wardAuthority: false as const,
      runAuthority: false as const,
      executionAuthority: false as const,
      replayAuthority: false as const,
      agreementAuthority: false as const,
      lampAuthority: false as const,
      admConstraintAuthority: false as const,
      physicalClaimAuthority: false as const,
      propulsionAuthority: false as const,
      transportAuthority: false as const,
      certificateAuthority: false as const,
    }),
    claimLocks: Object.freeze({
      diagnosticPass: false as const,
      fullMeanRsetAvailable: false as const,
      u95Coverage: false as const,
      deterministicEnclosure: false as const,
      fixedBackgroundWardPass: false as const,
      independentAgreement: false as const,
      fixedBackgroundMeanLamp: false as const,
      semiclassicalStressNoiseLamp: false as const,
      constraintClosureLamp: false as const,
      admConstraintClosure: false as const,
      theoryGraphPromotion: false as const,
      physicalViability: false as const,
      propulsion: false as const,
      transport: false as const,
      certificateEligibility: false as const,
      certificateIssued: false as const,
    }),
  });
}

export type Nhm2ConformallyFlatNeedleMeanRsetDiagnosticResult = ReturnType<
  typeof calculateNhm2ConformallyFlatNeedleMeanRsetDiagnostic
>;
