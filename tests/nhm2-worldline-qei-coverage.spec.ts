import { describe, expect, it } from "vitest";

import { NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS } from "../shared/contracts/nhm2-experiment-ready-theory-closure.v1";
import {
  NHM2_WORLDLINE_QEI_REGIONS,
  NHM2_WORLDLINE_QEI_REQUIRED_CHECK_IDS,
  buildNhm2WorldlineQeiCoverage,
  isNhm2WorldlineQeiCoverage,
  type BuildNhm2WorldlineQeiCoverageInput,
} from "../shared/contracts/nhm2-worldline-qei-coverage.v1";

const hash = (character: string): string => `sha256:${character.repeat(64)}`;

let artifactIndex = 0;
const artifact = () => {
  artifactIndex += 1;
  const character = (artifactIndex % 10).toString();
  return {
    path: `artifacts/qei/${artifactIndex}.json`,
    sha256: hash(character),
  };
};

const numericalArtifact = (input: {
  shape: number[];
  componentOrder: string[];
  unit: string;
}) => {
  const base = artifact();
  return {
    ...base,
    path: base.path.replace(/\.json$/, ".f64"),
    dtype: "float64" as const,
    binaryEncoding: "raw_ieee754" as const,
    endianness: "little" as const,
    shape: input.shape,
    sizeBytes: input.shape.reduce((product, extent) => product * extent, 8),
    storageOrder: "row-major" as const,
    componentOrder: input.componentOrder,
    unit: input.unit,
  };
};

const completeInput = (): BuildNhm2WorldlineQeiCoverageInput => {
  artifactIndex = 0;
  const candidateSha = hash("a");
  const stateSha = hash("b");
  const gitSha = "c".repeat(40);
  const samplingFamilies = [
    "smooth_compact_support",
    "gaussian_stationary",
  ] as const;
  const makeWorldline = (
    region: (typeof NHM2_WORLDLINE_QEI_REGIONS)[number],
    index: number,
    family: (typeof samplingFamilies)[number],
    ordinal: number,
    preserveLegacyId = false,
  ) => ({
    worldlineId: preserveLegacyId
      ? `${region}-worldline-1`
      : `${region}-${family}-worldline-${ordinal}`,
    region,
    stateId: "state-alpha-0.7",
    stateSha256: stateSha,
    trajectory: numericalArtifact({
      shape: [256, 4],
      componentOrder: ["t", "x", "y", "z"],
      unit: "m",
    }),
    properTimeGrid: numericalArtifact({
      shape: [256],
      componentOrder: ["tau"],
      unit: "s",
    }),
    fourVelocityArray: numericalArtifact({
      shape: [256, 4],
      componentOrder: ["u0", "u1", "u2", "u3"],
      unit: "1",
    }),
    accelerationArray: numericalArtifact({
      shape: [256, 4],
      componentOrder: ["a0", "a1", "a2", "a3"],
      unit: "m/s^2",
    }),
    curvatureInvariantArray: numericalArtifact({
      shape: [256, 4],
      componentOrder: [
        "proper_acceleration",
        "ricci_scalar",
        "ricci_uu",
        "kretschmann",
      ],
      unit: "mixed_si",
    }),
    renormalizedTmunuUuSamples: numericalArtifact({
      shape: [256],
      componentOrder: ["Tmunu_u_mu_u_nu"],
      unit: "J/m^3",
    }),
    samplingFunctionSamples: numericalArtifact({
      shape: [256],
      componentOrder: ["g_squared"],
      unit: "1/s",
    }),
    quadratureSamples: numericalArtifact({
      shape: [256, 2],
      componentOrder: ["integrand", "weight"],
      unit: "mixed_si",
    }),
    sampleCount: 256,
    properTimeStartSI: 0,
    properTimeEndSI: 1e-6 + index * 1e-7,
    fourVelocity: {
      normalizationConvention: "g_uu_minus_one" as const,
      normalizationResidualMax: 1e-10,
      normalizationTolerance: 1e-8,
      timelikeMarginMin: 0.5,
    },
    invariants: {
      properAccelerationMaxSI: 1e3,
      ricciScalarAbsMaxSI: 1e-4,
      ricciUuAbsMaxSI: 2e-4,
      kretschmannMaxSI: 3e-4,
      method: artifact(),
    },
    samplingFunction: {
      functionId:
        family === "smooth_compact_support"
          ? "compact-smooth-g2"
          : "gaussian-stationary-g2",
      family,
      definition: artifact(),
      normalizedIntegral: 1,
      normalizationAbsoluteUncertainty: 1e-8,
      normalizationTolerance: 1e-6,
      tauSI: 1e-9,
      dutyFraction: 1e-3,
      lightCrossingTimeSI: 1e-8,
      modulationPeriodSI: 1e-6,
      maxTauToLightCrossingRatio: 0.2,
      maxTauToModulationPeriodRatio: 0.01,
      dutyConsistencyTolerance: 1e-8,
      timingPolicy: artifact(),
    },
    theorem: {
      theoremId: "stationary-worldline-qei",
      citation: "Fewster-Thompson stationary-worldline QEI",
      boundExpression: artifact(),
      applicabilityAnalysis: artifact(),
      applicabilityConditions: artifact(),
      applicable: true,
    },
    integral: {
      renormalized: true,
      integrationMethod: "gauss-kronrod-with-refinement",
      integratedEnergyDensitySI: -4,
      theoremLowerBoundSI: -5,
      marginSI: 1,
      marginAbsoluteUncertaintySI: 0.1,
      confidenceLevel: 0.95,
      minimumRequiredLowerMarginSI: 0,
      marginClosureToleranceSI: 1e-12,
      quadratureErrorBoundSI: 1e-5,
      interpolationErrorBoundSI: 1e-5,
      combinedNumericalToleranceSI: 1e-4,
      refinementLevels: [64, 128, 256],
      observedConvergenceOrder: 2.1,
      minimumConvergenceOrder: 1.5,
      convergenceStudy: artifact(),
      uncertaintyBudget: artifact(),
      integralReceipt: artifact(),
    },
  });
  const worldlines = [
    ...NHM2_WORLDLINE_QEI_REGIONS.map((region, index) =>
      makeWorldline(region, index, samplingFamilies[0], 1, true),
    ),
    ...NHM2_WORLDLINE_QEI_REGIONS.flatMap((region, regionIndex) => [
      ...[2, 3, 4].map((ordinal) =>
        makeWorldline(
          region,
          regionIndex * 10 + ordinal,
          samplingFamilies[0],
          ordinal,
        ),
      ),
      ...[1, 2, 3, 4].map((ordinal) =>
        makeWorldline(
          region,
          regionIndex * 10 + ordinal + 4,
          samplingFamilies[1],
          ordinal,
        ),
      ),
    ]),
  ];

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
      runId: "qei-run-1",
      requestId: "qei-request-1",
      receiptId: "qei-receipt-1",
      selectedProfileId: "alpha-0.7",
      chartId: "nhm2-cartesian-v1",
      atlas: artifact(),
      units: artifact(),
      normalization: artifact(),
      gitSha,
    },
    stateBinding: {
      stateId: "state-alpha-0.7",
      stateSha256: stateSha,
      stateArtifact: {
        ...numericalArtifact({
          shape: [256, 2],
          componentOrder: ["real", "imaginary"],
          unit: "field_mode",
        }),
        sha256: stateSha,
      },
      renormalizedStressTensor: numericalArtifact({
        shape: [256, 10],
        componentOrder: [
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
        ],
        unit: "J/m^3",
      }),
      semiclassicalReceipt: artifact(),
      renormalizationPrescription: artifact(),
    },
    coverage: {
      admittedWorldlineCount: 24,
      evaluatedWorldlineCount: 24,
      worldlineSet: artifact(),
      coverageManifest: artifact(),
      regionCounts: NHM2_WORLDLINE_QEI_REGIONS.map((region) => ({
        region,
        admittedCount: 8,
        evaluatedCount: 8,
      })),
    },
    worldlines,
    uncertainty: {
      confidenceLevel: 0.95,
      method: "correlated-quadrature-and-state-envelope",
      correlatedBudget: artifact(),
      covariance: numericalArtifact({
        shape: [2, 2],
        componentOrder: ["quadrature_error", "state_uncertainty"],
        unit: "mixed_si^2",
      }),
    },
    provenance: {
      producerId: "nhm2-qei-producer",
      implementationId: "qei-implementation-a",
      solverId: "worldline-qei-solver",
      solverVersion: "1.0.0",
      solver: artifact(),
      environment: artifact(),
      invocation: artifact(),
      command: "node tools/nhm2/run-worldline-qei.js",
      argv: ["--candidate", "nhm2-alpha-0.7-theory-candidate"],
      workingDirectory: "/workspace/casimirbot",
      inputManifest: artifact(),
      outputDirectory: "artifacts/runs/qei-run-1",
      runId: "qei-run-1",
      requestId: "qei-request-1",
      receiptId: "qei-receipt-1",
      gitSha,
      startedAt: "2026-07-19T00:00:00.000Z",
      completedAt: "2026-07-19T00:00:01.000Z",
      durationMs: 1000,
      deterministicSeed: "qei-seed-1",
      runSpecificOutput: true,
    },
  };
};

const clone = <T>(value: T): T => structuredClone(value);

describe("nhm2 worldline QEI coverage contract", () => {
  it("derives a contract-only pass from complete synthetic worldlines", () => {
    const result = buildNhm2WorldlineQeiCoverage(completeInput());

    expect(result.status).toBe("pass");
    expect(result.worldlineQeiCoverageReady).toBe(true);
    expect(result.checks.map((entry) => entry.checkId)).toEqual(
      NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS.worldline_qei,
    );
    expect(result.checks.every((entry) => entry.status === "pass")).toBe(true);
    expect(
      result.worldlines[0]?.integral.combinedNumericalErrorRelative,
    ).toBeCloseTo(4e-6);
    expect(result.claimBoundary).toMatchObject({
      diagnosticOnly: true,
      negativeEnergyInventoryClaimAllowed: false,
      physicalViability: false,
      transport: false,
      propulsion: false,
      routeEta: false,
      certifiedSpeed: false,
    });
    expect(isNhm2WorldlineQeiCoverage(result)).toBe(true);
  });

  it("fails closed and derives every required check without evidence", () => {
    const result = buildNhm2WorldlineQeiCoverage();

    expect(result.status).toBe("blocked");
    expect(result.checks.map((entry) => entry.checkId)).toEqual(
      NHM2_WORLDLINE_QEI_REQUIRED_CHECK_IDS,
    );
    expect(result.blockers).toContain(
      "identity_or_provenance:candidate_id_missing",
    );
    expect(isNhm2WorldlineQeiCoverage(result)).toBe(true);
  });

  it("rejects a two-sample worldline despite its positive proper-time interval", () => {
    const input = completeInput();
    input.worldlines![0]!.sampleCount = 2;
    const result = buildNhm2WorldlineQeiCoverage(input);

    expect(result.status).toBe("fail");
    expect(result.blockers).toContain(
      "qei_worldline_sample_count_meets_frozen_minimum:worldline_hull-worldline-1_sample_count_below_frozen_minimum",
    );
  });

  it("rejects malformed or semantically reordered raw worldline arrays", () => {
    const input = completeInput();
    input.worldlines![0]!.properTimeGrid!.sizeBytes = 8;
    input.worldlines![0]!.fourVelocityArray!.componentOrder = [
      "u1",
      "u0",
      "u2",
      "u3",
    ];
    const result = buildNhm2WorldlineQeiCoverage(input);

    expect(result.status).toBe("fail");
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        "explicit_timelike_worldlines_published:worldline_hull-worldline-1_proper_time_grid_size_bytes_shape_mismatch",
        "explicit_timelike_worldlines_published:worldline_hull-worldline-1_four_velocity_array_component_order_mismatch",
      ]),
    );
    expect(result.worldlineQeiCoverageReady).toBe(false);
  });

  it("rejects sparse sampling-function families and sub-policy convergence", () => {
    const input = completeInput();
    for (const worldline of input.worldlines ?? []) {
      worldline!.samplingFunction!.family = "smooth_compact_support";
    }
    input.worldlines![0]!.integral!.observedConvergenceOrder = 0.5;
    input.worldlines![0]!.integral!.minimumConvergenceOrder = 0.25;
    const result = buildNhm2WorldlineQeiCoverage(input);

    expect(result.status).toBe("fail");
    expect(result.blockers).toContain(
      "qei_sampling_family_count_meets_frozen_minimum:sampling_function_family_count_below_frozen_minimum",
    );
    expect(result.blockers).toContain(
      "qei_worldline_convergence_meets_frozen_minimum:worldline_hull-worldline-1_observed_convergence_order_below_frozen_minimum",
    );
  });

  it("rejects a region-family cell below the frozen density", () => {
    const input = completeInput();
    const removedIndex = input.worldlines!.findIndex(
      (worldline) =>
        worldline!.region === "hull" &&
        worldline!.samplingFunction!.family === "gaussian_stationary",
    );
    input.worldlines!.splice(removedIndex, 1);
    input.coverage!.admittedWorldlineCount = 23;
    input.coverage!.evaluatedWorldlineCount = 23;
    const hull = input.coverage!.regionCounts!.find(
      (entry) => entry!.region === "hull",
    )!;
    hull!.admittedCount = 7;
    hull!.evaluatedCount = 7;
    const result = buildNhm2WorldlineQeiCoverage(input);

    expect(result.status).toBe("fail");
    expect(result.blockers).toContain(
      "qei_worldlines_per_region_family_meet_frozen_minimum:region_family_worldline_density_below_frozen_minimum",
    );
  });

  it("blocks a worldline that is not bound to the semiclassical state", () => {
    const input = completeInput();
    input.worldlines![0]!.stateSha256 = hash("d");
    const result = buildNhm2WorldlineQeiCoverage(input);

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContain(
      "explicit_timelike_worldlines_published:worldline_hull-worldline-1_state_binding_mismatch",
    );
  });

  it("fails a non-timelike or improperly normalized worldline", () => {
    const input = completeInput();
    input.worldlines![0]!.fourVelocity!.normalizationResidualMax = 1e-3;
    input.worldlines![0]!.fourVelocity!.timelikeMarginMin = 0;
    const result = buildNhm2WorldlineQeiCoverage(input);

    expect(result.status).toBe("fail");
    expect(result.blockers).toContain(
      "four_velocity_normalization_verified:worldline_hull-worldline-1_four_velocity_not_normalized",
    );
    expect(result.blockers).toContain(
      "four_velocity_normalization_verified:worldline_hull-worldline-1_worldline_not_strictly_timelike",
    );
  });

  it("fails an inapplicable theorem and a margin that closes below uncertainty", () => {
    const input = completeInput();
    input.worldlines![1]!.theorem!.applicable = false;
    input.worldlines![1]!.integral!.marginSI = 0.05;
    input.worldlines![1]!.integral!.integratedEnergyDensitySI = -4.95;
    const result = buildNhm2WorldlineQeiCoverage(input);

    expect(result.status).toBe("fail");
    expect(result.blockers).toContain(
      "applicable_theorem_bound_computed:worldline_wall-worldline-1_theorem_not_applicable",
    );
    expect(result.blockers).toContain(
      "all_margins_pass_with_uncertainty:worldline_wall-worldline-1_qei_margin_fails_with_uncertainty",
    );
  });

  it("fails missing regional coverage and incomplete quadrature convergence", () => {
    const input = completeInput();
    input.coverage!.regionCounts = input.coverage!.regionCounts!.filter(
      (entry) => entry!.region !== "exterior",
    );
    input.worldlines![2]!.integral!.refinementLevels = [64, 128];
    const result = buildNhm2WorldlineQeiCoverage(input);

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContain(
      "hull_wall_exterior_worldlines_covered:exterior_coverage_missing",
    );
    expect(result.blockers).toContain(
      "quadrature_and_interpolation_error_bounded:worldline_exterior-worldline-1_three_refinement_levels_required",
    );
  });

  it("blocks mismatched pre-run, receipt, and Git identities", () => {
    const input = completeInput();
    input.identity!.preRunManifest!.sha256 = hash("d");
    input.provenance!.receiptId = "different-receipt";
    input.provenance!.gitSha = "e".repeat(40);
    const result = buildNhm2WorldlineQeiCoverage(input);

    expect(result.status).toBe("blocked");
    expect(result.blockers).toContain(
      "identity_or_provenance:pre_run_manifest_candidate_sha_mismatch",
    );
    expect(result.blockers).toContain(
      "identity_or_provenance:provenance_receipt_id_mismatch",
    );
    expect(result.blockers).toContain(
      "identity_or_provenance:provenance_git_sha_mismatch",
    );
  });

  it("rejects derived-authority tampering and nested shadow fields", () => {
    const valid = buildNhm2WorldlineQeiCoverage(completeInput());
    const tampered = clone(valid) as unknown as Record<string, unknown>;
    tampered.worldlineQeiCoverageReady = false;
    expect(isNhm2WorldlineQeiCoverage(tampered)).toBe(false);

    const shadow = clone(valid) as unknown as Record<string, unknown>;
    const firstWorldline = (
      shadow.worldlines as Array<Record<string, unknown>>
    )[0];
    firstWorldline.pass = true;
    expect(isNhm2WorldlineQeiCoverage(shadow)).toBe(false);

    const forgedMetric = clone(valid) as unknown as Record<string, unknown>;
    const forgedIntegral = (
      forgedMetric.worldlines as Array<Record<string, unknown>>
    )[0]?.integral as Record<string, unknown>;
    forgedIntegral.combinedNumericalErrorRelative = 0;
    expect(isNhm2WorldlineQeiCoverage(forgedMetric)).toBe(false);
  });

  it("contains no forward receipt/output-manifest hashes and rejects shadows", () => {
    const valid = buildNhm2WorldlineQeiCoverage(completeInput());
    expect(valid.identity).not.toHaveProperty("receiptArtifact");
    expect(valid.provenance).not.toHaveProperty("outputManifest");
    expect(valid.provenance.outputDirectory).toBe("artifacts/runs/qei-run-1");

    const receiptShadow = clone(valid) as unknown as Record<string, unknown>;
    (receiptShadow.identity as Record<string, unknown>).receiptArtifact =
      artifact();
    expect(isNhm2WorldlineQeiCoverage(receiptShadow)).toBe(false);

    const manifestShadow = clone(valid) as unknown as Record<string, unknown>;
    (manifestShadow.provenance as Record<string, unknown>).outputManifest =
      artifact();
    expect(isNhm2WorldlineQeiCoverage(manifestShadow)).toBe(false);
  });
});
