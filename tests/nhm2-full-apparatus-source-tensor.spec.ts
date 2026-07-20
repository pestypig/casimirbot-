import { describe, expect, it } from "vitest";

import {
  NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS,
  NHM2_FULL_APPARATUS_SOURCE_TENSOR_REGIONS,
  NHM2_FULL_APPARATUS_SOURCE_TENSOR_REQUIRED_CHECK_IDS,
  NHM2_FULL_APPARATUS_SOURCE_TENSOR_TERMS,
  buildNhm2FullApparatusSourceTensor,
  isNhm2FullApparatusSourceTensor,
  type BuildNhm2FullApparatusSourceTensorInput,
} from "../shared/contracts/nhm2-full-apparatus-source-tensor.v1";
import { NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS } from "../shared/contracts/nhm2-experiment-ready-theory-closure.v1";

const hash = (character: string): string => character.repeat(64);

let artifactIndex = 0;
const artifact = () => {
  artifactIndex += 1;
  const character = (artifactIndex % 10).toString();
  return {
    path: `artifacts/full-source/${artifactIndex}.bin`,
    sha256: hash(character),
  };
};

const float64Array = (
  shape: number[],
  componentOrder: (typeof NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS)[number][],
) => ({
  ...artifact(),
  dtype: "float64" as const,
  shape,
  sizeBytes: shape.reduce((product, dimension) => product * dimension, 1) * 8,
  storageOrder: "row-major" as const,
  componentOrder,
});

const completeInput = (): BuildNhm2FullApparatusSourceTensorInput => {
  artifactIndex = 0;
  const candidateSha = hash("a");
  const gitSha = "b".repeat(40);
  const atlas = artifact();
  const units = artifact();
  const normalization = artifact();
  const tensorShape = [1, 60, 10];
  const componentShape = [1, 60];
  const totalTensor = float64Array(tensorShape, [
    ...NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS,
  ]);
  const frame = {
    chartId: "nhm2-cartesian-v1",
    basis: "coordinate" as const,
    tensorIndexPosition: "covariant" as const,
    unit: "J/m^3" as const,
    atlasSha256: atlas.sha256,
    unitsSha256: units.sha256,
    normalizationSha256: normalization.sha256,
  };
  return {
    generatedAt: "2026-07-19T00:00:02.000Z",
    identity: {
      candidateId: "nhm2-alpha-0.7-theory-candidate",
      candidateManifestSha256: candidateSha,
      preRunManifest: {
        path: "artifacts/candidate/pre-run-manifest.json",
        sha256: candidateSha,
      },
      laneId: "nhm2_shift_lapse",
      runId: "full-source-run-1",
      requestId: "full-source-request-1",
      receiptId: "full-source-receipt-1",
      runtimeId: "nhm2.shift_lapse.alpha_sweep",
      selectedProfileId: "alpha-0.7",
      selectedProfile: artifact(),
      chartId: "nhm2-cartesian-v1",
      atlas,
      units,
      normalization,
      gitSha,
    },
    frozenFrame: {
      sourceFrame: frame,
      metricFrame: frame,
      componentOrder: [...NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS],
      tensorSymmetry: "symmetric",
      dtype: "float64",
      endianness: "little",
      arrayShape: tensorShape,
      spatialSampleCount: 60,
      timeSampleCount: 1,
      sampleIndex: artifact(),
      regionsFormDisjointPartition: true,
      regionMasks: NHM2_FULL_APPARATUS_SOURCE_TENSOR_REGIONS.map(
        (region, index) => ({
          region,
          mask: artifact(),
          admittedSampleCount: [10, 30, 20][index],
          evaluatedSampleCount: [10, 30, 20][index],
        }),
      ),
    },
    sourceTensor: {
      rawTotalTensorArray: totalTensor,
      componentLedger: artifact(),
      components: NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS.map(
        (component, index) => ({
          component,
          rawArray: float64Array(componentShape, [component]),
          sampleCount: 60,
          minSI: -100 - index,
          maxSI: 100 + index,
          l2NormSI: 1000 + index,
        }),
      ),
      constitutiveRegistry: artifact(),
      constitutiveEquationSet: artifact(),
      decompositionLedger: artifact(),
      terms: NHM2_FULL_APPARATUS_SOURCE_TENSOR_TERMS.map((term) => ({
        term,
        producerFieldId: `${term}-constitutive-source`,
        sourceField: artifact(),
        constitutiveDerivation: artifact(),
        rawTensorArray: float64Array(tensorShape, [
          ...NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS,
        ]),
        couplingCoefficientArray: float64Array(tensorShape, [
          ...NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS,
        ]),
        sampleCount: 60,
        returnedToSourceTensor: true,
      })),
    },
    sourceProvenanceDag: {
      graph: artifact(),
      nodeIndex: artifact(),
      edgeIndex: artifact(),
      independentEchoAudit: artifact(),
      auditMethod: "typed-source-to-sink-taint-audit-v1",
      sourceRootCount: NHM2_FULL_APPARATUS_SOURCE_TENSOR_TERMS.length,
      metricTargetDependencyCount: 0,
      forbiddenTargetEchoCount: 0,
      metricTargetInputsUsed: [],
    },
    metricComparison: {
      metricRouteId: "independent-einstein-tensor-route",
      metricImplementationId: "metric-route-implementation-b",
      metricSolver: artifact(),
      metricEnvironment: artifact(),
      metricInvocation: artifact(),
      rawMetricTensorArray: float64Array(tensorShape, [
        ...NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS,
      ]),
      rawRequiredSourceTensorArray: float64Array(tensorShape, [
        ...NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS,
      ]),
      metricSignalNormSI: 1e9,
      metricSignalNumericalFloorSI: 1e-4,
      gridResolutions: [32, 64, 128],
      observedConvergenceOrder: 2.1,
      minimumConvergenceOrder: 1.5,
      crossGridRelativeDifferenceUpper95: 0.002,
      crossGridRelativeDifferenceTolerance: 0.01,
      gridConvergenceStudy: artifact(),
      confidenceLevel: 0.95,
      absoluteResidualUpper95SI: 1e5,
      absoluteResidualToleranceSI: 1e6,
      relativeResidualUpper95: 0.03,
      relativeResidualTolerance: 0.1,
      rawAbsoluteResidualArray: float64Array(tensorShape, [
        ...NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS,
      ]),
      rawRelativeResidualArray: float64Array(tensorShape, [
        ...NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS,
      ]),
      uncertaintyBudget: artifact(),
    },
    evolutionCoupling: {
      evolutionSolver: artifact(),
      evolutionEnvironment: artifact(),
      evolutionInvocation: artifact(),
      sourceTensorInputSha256: totalTensor.sha256,
      coupledStateArray: float64Array(
        [16, 60, 10],
        [...NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS],
      ),
      couplingResidualArray: float64Array(
        [16, 60, 10],
        [...NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS],
      ),
      backreactionIterationCount: 4,
      evolvedTimestepCount: 16,
      evolvedDurationSeconds: 0.01,
      feedbackEnabled: true,
      couplingResidualMax: 1e-7,
      couplingResidualTolerance: 1e-5,
    },
    provenance: {
      producerId: "nhm2-full-apparatus-source-producer",
      implementationId: "source-route-implementation-a",
      solverId: "full-apparatus-source-solver",
      solverVersion: "1.0.0",
      solver: artifact(),
      environment: artifact(),
      invocation: artifact(),
      command: "node tools/nhm2/run-full-apparatus-source.js",
      argv: ["--candidate", "nhm2-alpha-0.7-theory-candidate"],
      workingDirectory: "/workspace/casimirbot",
      inputManifest: artifact(),
      runId: "full-source-run-1",
      requestId: "full-source-request-1",
      receiptId: "full-source-receipt-1",
      runtimeId: "nhm2.shift_lapse.alpha_sweep",
      gitSha,
      startedAt: "2026-07-19T00:00:00.000Z",
      completedAt: "2026-07-19T00:00:01.000Z",
      durationMs: 1000,
      deterministicSeed: "full-source-seed-1",
      runSpecificOutput: true,
    },
  };
};

const clone = <T>(value: T): T => structuredClone(value);

describe("NHM2 full-apparatus source tensor contract", () => {
  it("derives exactly the closure-required checks", () => {
    expect(NHM2_FULL_APPARATUS_SOURCE_TENSOR_REQUIRED_CHECK_IDS).toEqual(
      NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS.full_apparatus_source_tensor,
    );
  });

  it("allows a contract-only synthetic pass without unlocking physical claims", () => {
    const result = buildNhm2FullApparatusSourceTensor(completeInput());

    expect(result.status).toBe("pass");
    expect(result.fullApparatusSourceTensorReady).toBe(true);
    expect(result.checks.every((check) => check.status === "pass")).toBe(true);
    expect(result.claimBoundary).toEqual({
      diagnosticOnly: true,
      contractPassIsNotPhysicalValidation: true,
      fullApparatusSourceTensorEvidenceOnly: true,
      physicalViability: false,
      transport: false,
      propulsion: false,
      routeEta: false,
      certifiedSpeed: false,
    });
    expect(isNhm2FullApparatusSourceTensor(result)).toBe(true);
  });

  it("binds every closure-bearing tensor, component, coefficient, state, and residual array", () => {
    const result = buildNhm2FullApparatusSourceTensor(completeInput());
    const arrays = [
      result.sourceTensor.rawTotalTensorArray,
      ...result.sourceTensor.components.map((entry) => entry.rawArray),
      ...result.sourceTensor.terms.flatMap((entry) => [
        entry.rawTensorArray,
        entry.couplingCoefficientArray,
      ]),
      result.metricComparison.rawMetricTensorArray,
      result.metricComparison.rawRequiredSourceTensorArray,
      result.metricComparison.rawAbsoluteResidualArray,
      result.metricComparison.rawRelativeResidualArray,
      result.evolutionCoupling.coupledStateArray,
      result.evolutionCoupling.couplingResidualArray,
    ];

    expect(arrays).toHaveLength(35);
    for (const array of arrays) {
      expect(array.dtype).toBe("float64");
      expect(array.shape.length).toBeGreaterThan(0);
      expect(array.shape.every((dimension) => (dimension ?? 0) > 0)).toBe(true);
      expect(array.sizeBytes).toBe(
        array.shape.reduce<number>(
          (product, dimension) => product * (dimension ?? 0),
          8,
        ),
      );
      expect(array.storageOrder).toBe("row-major");
      expect(array.componentOrder.length).toBeGreaterThan(0);
    }
  });

  it("fails zero shapes, byte-count mismatches, missing storage order, and reordered components", () => {
    const input = completeInput();
    input.sourceTensor!.rawTotalTensorArray!.shape = [1, 0, 10];
    input.sourceTensor!.rawTotalTensorArray!.sizeBytes = 0;
    input.metricComparison!.rawAbsoluteResidualArray!.sizeBytes = 8;
    input.metricComparison!.rawRelativeResidualArray!.componentOrder = [
      ...NHM2_FULL_APPARATUS_SOURCE_TENSOR_COMPONENTS,
    ].reverse();
    input.evolutionCoupling!.couplingResidualArray!.storageOrder = null;
    const result = buildNhm2FullApparatusSourceTensor(input);

    expect(result.status).toBe("fail");
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        "raw_tensor_arrays_published:raw_total_tensor_array_shape_invalid",
        "raw_tensor_arrays_published:raw_total_tensor_array_size_bytes_invalid",
        "uncertainty_aware_absolute_relative_residuals_pass:raw_absolute_residual_array_size_bytes_shape_mismatch",
        "uncertainty_aware_absolute_relative_residuals_pass:raw_relative_residual_array_component_order_invalid",
        "source_tensor_coupled_to_evolution:coupling_residual_array_storage_order_missing",
      ]),
    );
  });

  it("fails a degenerate frozen tensor shape before any closure pass", () => {
    const input = completeInput();
    input.frozenFrame!.arrayShape = [1, 60, 0];
    const result = buildNhm2FullApparatusSourceTensor(input);

    expect(result.status).toBe("fail");
    expect(result.blockers).toContain(
      "same_chart_basis_units_normalization:frozen_array_shape_invalid",
    );
  });

  it("blocks empty and missing/unbound raw evidence", () => {
    const empty = buildNhm2FullApparatusSourceTensor();
    expect(empty.status).toBe("blocked");
    expect(empty.checks.map((check) => check.checkId)).toEqual(
      NHM2_FULL_APPARATUS_SOURCE_TENSOR_REQUIRED_CHECK_IDS,
    );
    expect(empty.blockers).toContain(
      "identity_or_provenance:candidate_id_missing",
    );

    const input = completeInput();
    input.sourceTensor!.terms = input.sourceTensor!.terms!.filter(
      (term) => term.term !== "supports",
    );
    const missingSupport = buildNhm2FullApparatusSourceTensor(input);
    expect(missingSupport.status).toBe("blocked");
    expect(missingSupport.blockers).toContain(
      "all_apparatus_terms_included:apparatus_term_supports_missing",
    );
  });

  it("fails domain evidence that reveals target echo or source-route reuse", () => {
    const input = completeInput();
    input.sourceProvenanceDag!.metricTargetDependencyCount = 1;
    input.sourceProvenanceDag!.metricTargetInputsUsed = [
      "required_tmunu_from_metric",
    ];
    input.metricComparison!.metricImplementationId =
      input.provenance!.implementationId;
    const result = buildNhm2FullApparatusSourceTensor(input);

    expect(result.status).toBe("fail");
    expect(result.blockers).toContain(
      "metric_target_echo_excluded_by_provenance_dag:metric_target_dependency_present",
    );
    expect(result.blockers).toContain(
      "independent_metric_route_and_grid_convergence:metric_and_source_implementations_not_independent",
    );
  });

  it("fails a degenerate metric signal and uncertainty-aware residual breach", () => {
    const input = completeInput();
    input.metricComparison!.metricSignalNormSI = 1e-5;
    input.metricComparison!.absoluteResidualUpper95SI = 2e6;
    const result = buildNhm2FullApparatusSourceTensor(input);

    expect(result.status).toBe("fail");
    expect(result.blockers).toContain(
      "nondegenerate_metric_signal_above_numerical_floor:metric_signal_not_above_numerical_floor",
    );
    expect(result.blockers).toContain(
      "uncertainty_aware_absolute_relative_residuals_pass:absolute_residual_upper95_exceeds_tolerance",
    );
    expect(
      result.checks.find(
        (check) =>
          check.checkId ===
          "uncertainty_aware_absolute_relative_residuals_pass",
      )?.metrics,
    ).toEqual([
      {
        metricId: "absolute_residual_upper95_si",
        value: 2e6,
        tolerance: 1e6,
        comparator: "lte",
        unit: "J/m^3",
      },
      {
        metricId: "relative_residual_upper95",
        value: 0.03,
        tolerance: 0.1,
        comparator: "lte",
        unit: "relative_L_inf",
      },
    ]);
  });

  it("blocks pre-run/execution identity mismatches", () => {
    const input = completeInput();
    input.provenance!.receiptId = "different-receipt";
    input.provenance!.runtimeId = "different-runtime";
    const result = buildNhm2FullApparatusSourceTensor(input);

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContain(
      "identity_or_provenance:provenance_receipt_id_mismatch",
    );
    expect(result.blockers).toContain(
      "identity_or_provenance:provenance_runtime_id_mismatch",
    );
  });

  it("contains no forward receipt/output hashes and rejects attempts to add them", () => {
    const valid = buildNhm2FullApparatusSourceTensor(completeInput());
    expect(valid.identity).not.toHaveProperty("receiptArtifact");
    expect(valid.provenance).not.toHaveProperty("outputManifest");

    const cyclic = clone(valid) as unknown as Record<string, unknown>;
    (cyclic.identity as Record<string, unknown>).receiptArtifact = artifact();
    (cyclic.provenance as Record<string, unknown>).outputManifest = artifact();
    expect(isNhm2FullApparatusSourceTensor(cyclic)).toBe(false);
  });

  it("rejects derived-authority tampering and nested shadow fields", () => {
    const valid = buildNhm2FullApparatusSourceTensor(completeInput());
    const tampered = clone(valid) as unknown as Record<string, unknown>;
    tampered.status = "blocked";
    expect(isNhm2FullApparatusSourceTensor(tampered)).toBe(false);

    const shadow = clone(valid) as unknown as Record<string, unknown>;
    (shadow.metricComparison as Record<string, unknown>).pass = true;
    expect(isNhm2FullApparatusSourceTensor(shadow)).toBe(false);

    const missingArrayMetadata = clone(valid) as unknown as {
      sourceTensor: {
        rawTotalTensorArray: Record<string, unknown>;
      };
    };
    delete missingArrayMetadata.sourceTensor.rawTotalTensorArray.sizeBytes;
    expect(isNhm2FullApparatusSourceTensor(missingArrayMetadata)).toBe(false);
  });
});
