import { describe, expect, it } from "vitest";
import {
  CASIMIR_DIELECTRIC_SENSITIVITY_MODELS,
  CASIMIR_FINITE_TEMPERATURE_FINITE_GEOMETRY_MAXWELL_STRESS_CHECK_IDS,
  CASIMIR_MATERIAL_UNCERTAINTY_COMPONENTS,
  buildCasimirFiniteTemperatureFiniteGeometryMaxwellStress,
  isCasimirFiniteTemperatureFiniteGeometryMaxwellStress,
  type BuildCasimirFiniteTemperatureFiniteGeometryMaxwellStressInput,
} from "../shared/contracts/casimir-finite-temperature-finite-geometry-maxwell-stress.v1";
import { NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS } from "../shared/contracts/nhm2-experiment-ready-theory-closure.v1";

const H = "a".repeat(64);
const H2 = "b".repeat(64);
const GIT = "c".repeat(40);

const artifact = (path: string, sha256 = H) => ({ path, sha256 });
const MAXWELL_COMPONENT_ORDER = [
  "xx",
  "xy",
  "xz",
  "yx",
  "yy",
  "yz",
  "zx",
  "zy",
  "zz",
];
const componentOrderFor = (path: string): string[] => {
  if (path.includes("matsubara-frequency")) return ["angular_frequency"];
  if (path.includes("matsubara-terms")) return ["force_contribution"];
  if (path.includes("temperature-sweep"))
    return ["temperature", "integrated_force"];
  if (path.endsWith("-frequency.f64")) return ["frequency"];
  if (path.includes("epsilon-real")) return ["epsilon_real"];
  if (path.includes("epsilon-imaginary")) return ["epsilon_imaginary"];
  if (path.includes("kramers-kronig")) return ["relative_residual"];
  if (/\/(?:measured_dispersion|drude|plasma)-force\.f64$/.test(path))
    return ["x", "y", "z"];
  if (/\/(?:measured_dispersion|drude|plasma)-pressure\.f64$/.test(path))
    return ["pressure"];
  if (
    path.includes("e-field") ||
    path.includes("h-field") ||
    path.includes("surface-normals") ||
    path.includes("traction") ||
    path.includes("integrated-force-vector")
  )
    return ["x", "y", "z"];
  if (path.includes("maxwell-stress") || path.includes("independent-output"))
    return MAXWELL_COMPONENT_ORDER;
  if (path.includes("pressure")) return ["pressure"];
  if (
    path.includes("matsubara-convergence") ||
    path.includes("mesh-convergence")
  )
    return ["force_residual"];
  if (path.endsWith("/gaps.f64")) return ["gap"];
  if (path.includes("force-gap")) return ["force"];
  if (path.includes("force-gradient")) return ["gradient"];
  if (path.includes("uncertainty-covariance"))
    return [...CASIMIR_MATERIAL_UNCERTAINTY_COMPONENTS];
  const uncertainty = CASIMIR_MATERIAL_UNCERTAINTY_COMPONENTS.find(
    (component) => path.endsWith(`/${component}-samples.f64`),
  );
  if (uncertainty != null) return [uncertainty];
  throw new Error(`Unhandled synthetic array component order: ${path}`);
};
const array = (path: string, shape: number[], unit: string, sha256 = H) => ({
  ...artifact(path, sha256),
  dtype: "float64" as const,
  shape,
  sizeBytes: shape.reduce((product, dimension) => product * dimension, 1) * 8,
  storageOrder: "row-major" as const,
  componentOrder: componentOrderFor(path),
  unit,
});

const positiveInput =
  (): BuildCasimirFiniteTemperatureFiniteGeometryMaxwellStressInput => ({
    generatedAt: "2026-07-19T00:00:02.000Z",
    binding: {
      candidateId: "nhm2-candidate-synthetic",
      candidateManifestPath: "inputs/candidate.v1.json",
      candidateManifestSha256: H,
      preRunManifestPath: "inputs/candidate.v1.json",
      preRunManifestSha256: H,
      numericPolicySetPath: "inputs/policy.v1.json",
      numericPolicySetRawSha256: H,
      numericPolicySetSemanticSha256: H2,
      laneId: "nhm2_shift_lapse",
      runId: "run-material-synthetic",
      requestId: "request-material-synthetic",
      receiptId: "runtime:casimir.verify:request:synthetic",
      runtimeId: "casimir.verify",
      selectedProfileId: "alpha-0.7",
      chartId: "nhm2-cartesian-v1",
      atlasPath: "inputs/atlas.v1.json",
      atlasSha256: H,
      unitsPath: "inputs/units.v1.json",
      unitsSha256: H,
      normalizationPath: "inputs/normalization.v1.json",
      normalizationSha256: H,
      gitSha: GIT,
    },
    thermodynamics: {
      formulation: "finite_temperature_lifshitz_matsubara",
      temperatureK: 300,
      targetGapM: 8e-9,
      lifshitzKernel: artifact("inputs/lifshitz-kernel.json"),
      zeroFrequencyPrescription: "measured_response",
      matsubaraFrequencies: array("raw/matsubara-frequency.f64", [8], "rad/s"),
      matsubaraTermContributions: array("raw/matsubara-terms.f64", [8], "N"),
      temperatureSweep: array("raw/temperature-sweep.f64", [3, 2], "K,N"),
      matsubaraTermCount: 8,
      truncationRemainderRelative: 1e-5,
      truncationToleranceRelative: 1e-3,
    },
    dielectricResponse: {
      datasets: ["plate-a", "plate-b"].map((materialId, index) => ({
        materialId,
        specimenId: `coupon-${index}`,
        sourceReceipt: artifact(
          `inputs/${materialId}-measurement-receipt.json`,
        ),
        frequencyHz: array(`raw/${materialId}-frequency.f64`, [4], "Hz"),
        epsilonReal: array(`raw/${materialId}-epsilon-real.f64`, [4], "1"),
        epsilonImaginary: array(
          `raw/${materialId}-epsilon-imaginary.f64`,
          [4],
          "1",
        ),
        temperatureK: 300,
        frequencyMinimumHz: 1e9,
        frequencyMaximumHz: 1e16,
        measurementUncertaintyRelative95: 0.01,
      })),
      kramersKronig: {
        evidence: artifact("evidence/kramers-kronig.json"),
        residuals: array("raw/kramers-kronig-residuals.f64", [4], "1"),
        maximumResidualRelative: 0.002,
        absoluteUncertainty95: 0.001,
        toleranceRelative: 0.01,
      },
      sensitivity: CASIMIR_DIELECTRIC_SENSITIVITY_MODELS.map(
        (model, index) => ({
          model,
          constitutiveModel: artifact(`inputs/${model}.json`),
          forceField: array(`raw/${model}-force.f64`, [4, 3], "N"),
          pressureField: array(`raw/${model}-pressure.f64`, [4], "Pa"),
          integratedForceN: -30 - index,
          absoluteUncertainty95N: 0.1,
        }),
      ),
      maximumModelSpreadRelative: 0.03,
      modelSpreadUncertainty95: 0.01,
      modelSpreadToleranceRelative: 0.1,
      nonlocalResponse: {
        disposition: "computed",
        evidence: artifact("evidence/nonlocal-response.json"),
        targetGapM: 8e-9,
        correctionRelative: 0.01,
        absoluteUncertainty95: 0.005,
        toleranceRelative: 0.05,
      },
    },
    finiteGeometry: {
      authorityModel: "finite_cad_maxwell_stress",
      cadModel: artifact("inputs/tile-pocket.step"),
      mesh: artifact("inputs/tile-pocket.mesh"),
      materialMap: artifact("inputs/material-map.json"),
      boundaryConditions: artifact("inputs/boundary-conditions.json"),
      integrationSurface: artifact("inputs/integration-surface.json"),
      supportAnchorsIncluded: true,
      pocketIncluded: true,
      rimIncluded: true,
      supportLatticeIncluded: true,
      cellCount: 1000,
      sampleCount: 4,
      electricField: array("raw/e-field.f64", [4, 3], "V/m"),
      magneticField: array("raw/h-field.f64", [4, 3], "A/m"),
      maxwellStressTensor: array("raw/maxwell-stress.f64", [4, 3, 3], "Pa"),
      surfaceNormals: array("raw/surface-normals.f64", [4, 3], "1"),
      tractionField: array("raw/traction.f64", [4, 3], "Pa"),
      pressureField: array("raw/pressure.f64", [4], "Pa"),
      integratedForceVector: array("raw/integrated-force-vector.f64", [3], "N"),
    },
    convergence: {
      evidence: artifact("evidence/convergence.json"),
      minimumAcceptedOrder: 1.5,
      orderUncertainty95: 0.1,
      matsubaraSeries: [
        { termCount: 4, integratedForceN: -30, absoluteUncertainty95N: 0.2 },
        { termCount: 8, integratedForceN: -30.5, absoluteUncertainty95N: 0.1 },
        {
          termCount: 16,
          integratedForceN: -30.6,
          absoluteUncertainty95N: 0.05,
        },
      ],
      meshSeries: [
        {
          maximumElementSizeM: 2e-9,
          cellCount: 100,
          integratedForceN: -29,
          absoluteUncertainty95N: 0.2,
        },
        {
          maximumElementSizeM: 1e-9,
          cellCount: 400,
          integratedForceN: -30,
          absoluteUncertainty95N: 0.1,
        },
        {
          maximumElementSizeM: 5e-10,
          cellCount: 1600,
          integratedForceN: -30.2,
          absoluteUncertainty95N: 0.05,
        },
      ],
      matsubaraResiduals: array("raw/matsubara-convergence.f64", [3], "N"),
      meshResiduals: array("raw/mesh-convergence.f64", [3], "N"),
      matsubaraObservedOrder: 2.1,
      meshObservedOrder: 2,
    },
    forceGapGradient: {
      evidence: artifact("evidence/force-gap.json"),
      gapCoordinates: array("raw/gaps.f64", [5], "m"),
      integratedForce: array("raw/force-gap.f64", [5], "N"),
      forceGradient: array("raw/force-gradient.f64", [5], "N/m"),
      localPressureFields: array("raw/local-pressure.f64", [5, 4], "Pa"),
      sampleCount: 5,
      minimumGapM: 6e-9,
      maximumGapM: 10e-9,
      gradientDerivedFromFiniteGeometryField: true,
    },
    uncertainty: {
      evidence: artifact("evidence/uncertainty.json"),
      covariance: array("raw/uncertainty-covariance.f64", [3, 3], "1"),
      confidenceLevel: 0.95,
      components: CASIMIR_MATERIAL_UNCERTAINTY_COMPONENTS.map((component) => ({
        component,
        model: artifact(`inputs/${component}-model.json`),
        samples: array(`raw/${component}-samples.f64`, [32], "1"),
        contributionRelative95: 0.01,
      })),
      combinedRelative95: 0.04,
      maximumAllowedRelative95: 0.1,
    },
    crossChecks: {
      analyticLimit: {
        evidence: artifact("evidence/analytic-limit.json"),
        limitId: "parallel_plate_asymptote",
        residualRelative: 0.01,
        absoluteUncertainty95: 0.005,
        toleranceRelative: 0.05,
      },
      independentSolver: {
        implementationId: "independent-dg-implementation",
        solverId: "independent-dg-solver",
        solver: artifact("inputs/independent-solver.bin"),
        environment: artifact("inputs/independent-environment.lock"),
        output: array("raw/independent-output.f64", [4, 3, 3], "Pa"),
        relativeDifference: 0.02,
        absoluteUncertainty95: 0.01,
        toleranceRelative: 0.1,
      },
    },
    authority: {
      primaryAuthority: "finite_temperature_finite_geometry_maxwell_stress",
      idealParallelPlateUsedAsAuthority: false,
      idealParallelPlateRole: "analytic_limit_crosscheck_only",
    },
    provenance: {
      producerId: "synthetic-contract-fixture",
      implementationId: "primary-maxwell-implementation",
      solverId: "primary-maxwell-solver",
      solverVersion: "1.0.0",
      solver: artifact("inputs/primary-solver.bin"),
      environment: artifact("inputs/environment.lock"),
      invocation: artifact("inputs/invocation.json"),
      command: "maxwell-solver",
      argv: ["--input", "inputs/candidate.v1.json"],
      workingDirectory: "run/material",
      inputManifest: artifact("inputs/input-manifest.json"),
      runId: "run-material-synthetic",
      requestId: "request-material-synthetic",
      receiptId: "runtime:casimir.verify:request:synthetic",
      runtimeId: "casimir.verify",
      gitSha: GIT,
      startedAt: "2026-07-19T00:00:00.000Z",
      completedAt: "2026-07-19T00:00:01.000Z",
      durationMs: 1000,
      deterministicSeed: "material-seed",
      runSpecificOutput: true,
    },
  });

describe("casimir finite-temperature finite-geometry Maxwell-stress contract", () => {
  it("uses exactly the closure meta-contract check IDs", () => {
    expect(
      CASIMIR_FINITE_TEMPERATURE_FINITE_GEOMETRY_MAXWELL_STRESS_CHECK_IDS,
    ).toEqual(
      NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS.finite_temperature_finite_geometry_maxwell_stress,
    );
  });

  it("accepts a complete synthetic contract-only fixture while keeping every physical claim locked", () => {
    const result =
      buildCasimirFiniteTemperatureFiniteGeometryMaxwellStress(positiveInput());

    expect(result.status).toBe("pass");
    expect(result.checks).toHaveLength(
      CASIMIR_FINITE_TEMPERATURE_FINITE_GEOMETRY_MAXWELL_STRESS_CHECK_IDS.length,
    );
    expect(result.checks.every((check) => check.pass)).toBe(true);
    expect(
      Object.fromEntries(
        result.checks.map((check) => [check.checkId, check.unit]),
      ),
    ).toMatchObject({
      matsubara_frequency_and_mesh_convergence_observed: "observed_order",
      roughness_patch_temperature_uncertainty_bounded: "relative_fraction",
      analytic_limits_and_independent_solver_crosscheck_pass: "relative_L_inf",
    });
    expect(result.finiteTemperatureFiniteGeometryMaxwellStressReady).toBe(true);
    expect(result.claimBoundary).toMatchObject({
      diagnosticOnly: true,
      apparatusTheoryEvidenceOnly: true,
      idealScalarCannotEstablishMechanism: true,
      physicalViability: false,
      transport: false,
      propulsion: false,
      routeEta: false,
      certifiedSpeed: false,
    });
    expect(isCasimirFiniteTemperatureFiniteGeometryMaxwellStress(result)).toBe(
      true,
    );
  });

  it("reports absent evidence as blocked rather than a numerical failure", () => {
    const result = buildCasimirFiniteTemperatureFiniteGeometryMaxwellStress();
    expect(result.status).toBe("blocked");
    expect(result.checks.every((check) => check.status === "blocked")).toBe(
      true,
    );
  });

  it("reports an out-of-tolerance Matsubara result as fail", () => {
    const input = positiveInput();
    input.thermodynamics!.truncationRemainderRelative = 0.2;
    input.thermodynamics!.truncationToleranceRelative = 0.1;
    const result =
      buildCasimirFiniteTemperatureFiniteGeometryMaxwellStress(input);
    const check = result.checks.find(
      (entry) => entry.checkId === "finite_temperature_lifshitz_terms_computed",
    );
    expect(result.status).toBe("fail");
    expect(check?.status).toBe("fail");
    expect(check?.blockers).toContain("matsubara_truncation_not_converged");
  });

  it("fails closed when an ideal parallel-plate scalar is promoted to authority", () => {
    const input = positiveInput();
    input.authority!.idealParallelPlateUsedAsAuthority = true;
    const result =
      buildCasimirFiniteTemperatureFiniteGeometryMaxwellStress(input);
    const check = result.checks.find(
      (entry) =>
        entry.checkId === "ideal_parallel_plate_scalar_not_used_as_authority",
    );
    expect(check?.status).toBe("fail");
    expect(check?.blockers).toContain(
      "ideal_parallel_plate_scalar_used_as_authority",
    );
  });

  it("fails rather than passing an out-of-domain nonlocal response", () => {
    const input = positiveInput();
    input.dielectricResponse!.nonlocalResponse!.disposition = "out_of_domain";
    const result =
      buildCasimirFiniteTemperatureFiniteGeometryMaxwellStress(input);
    const check = result.checks.find(
      (entry) =>
        entry.checkId === "nonlocal_response_at_target_gap_dispositioned",
    );
    expect(check?.status).toBe("fail");
    expect(check?.blockers).toContain(
      "target_gap_outside_nonlocal_model_domain",
    );
  });

  it("binds pre-run identity but contains no forward receipt or output-manifest hashes", () => {
    const result =
      buildCasimirFiniteTemperatureFiniteGeometryMaxwellStress(positiveInput());
    expect(result.binding.receiptId).toBeTruthy();
    expect(result.binding.candidateManifestSha256).toBe(H);
    expect("receiptPath" in result.binding).toBe(false);
    expect("receiptSha256" in result.binding).toBe(false);
    expect("outputManifest" in result.provenance).toBe(false);

    const withForwardHash = structuredClone(result) as unknown as Record<
      string,
      unknown
    >;
    (withForwardHash.binding as Record<string, unknown>).receiptSha256 = H;
    expect(
      isCasimirFiniteTemperatureFiniteGeometryMaxwellStress(withForwardHash),
    ).toBe(false);
  });

  it("rejects forged derived gates and any shadow authority field", () => {
    const result =
      buildCasimirFiniteTemperatureFiniteGeometryMaxwellStress(positiveInput());
    const forged = structuredClone(result);
    forged.checks[0].status = "fail";
    expect(isCasimirFiniteTemperatureFiniteGeometryMaxwellStress(forged)).toBe(
      false,
    );

    const shadow = structuredClone(result) as unknown as Record<
      string,
      unknown
    >;
    (shadow.authority as Record<string, unknown>).physicalViability = true;
    expect(isCasimirFiniteTemperatureFiniteGeometryMaxwellStress(shadow)).toBe(
      false,
    );
  });

  it("fails an identity/provenance mismatch instead of accepting a detached run", () => {
    const input = positiveInput();
    input.provenance!.runId = "different-run";
    const result =
      buildCasimirFiniteTemperatureFiniteGeometryMaxwellStress(input);
    expect(result.status).toBe("fail");
    expect(
      result.blockers.some((blocker) =>
        blocker.endsWith("provenance_run_id_mismatch"),
      ),
    ).toBe(true);
  });

  it("fails closed on degenerate, mis-sized, or unlabelled numerical arrays", () => {
    const input = positiveInput();
    const tensor = input.finiteGeometry!.maxwellStressTensor!;
    tensor.shape = [0, 3, 3];
    tensor.sizeBytes = 8;
    tensor.componentOrder = [];
    tensor.storageOrder = undefined;
    input.finiteGeometry!.electricField!.sizeBytes = 8;
    const result =
      buildCasimirFiniteTemperatureFiniteGeometryMaxwellStress(input);
    const check = result.checks.find(
      (entry) =>
        entry.checkId === "finite_geometry_maxwell_stress_field_computed",
    );
    expect(check?.status).toBe("fail");
    expect(check?.blockers).toEqual(
      expect.arrayContaining([
        "maxwell_stress_tensor_shape_invalid",
        "electric_field_size_bytes_invalid",
        "maxwell_stress_tensor_component_order_missing",
        "maxwell_stress_tensor_storage_order_missing",
      ]),
    );
  });

  it("rejects one-sample gap, convergence, and uncertainty ledgers", () => {
    const input = positiveInput();
    input.convergence!.matsubaraSeries = [
      input.convergence!.matsubaraSeries![0],
    ];
    input.convergence!.meshSeries = [input.convergence!.meshSeries![0]];
    input.convergence!.matsubaraResiduals = array(
      "raw/matsubara-convergence.f64",
      [1],
      "N",
    );
    input.convergence!.meshResiduals = array(
      "raw/mesh-convergence.f64",
      [1],
      "N",
    );
    input.forceGapGradient!.sampleCount = 1;
    input.forceGapGradient!.gapCoordinates = array("raw/gaps.f64", [1], "m");
    input.forceGapGradient!.integratedForce = array(
      "raw/force-gap.f64",
      [1],
      "N",
    );
    input.forceGapGradient!.forceGradient = array(
      "raw/force-gradient.f64",
      [1],
      "N/m",
    );
    input.forceGapGradient!.localPressureFields = array(
      "raw/local-pressure.f64",
      [1, 4],
      "Pa",
    );
    input.uncertainty!.components!.forEach((component) => {
      if (component?.component != null)
        component.samples = array(
          `raw/${component.component}-samples.f64`,
          [1],
          "1",
        );
    });

    const result =
      buildCasimirFiniteTemperatureFiniteGeometryMaxwellStress(input);
    expect(
      result.checks.find(
        (entry) =>
          entry.checkId === "matsubara_frequency_and_mesh_convergence_observed",
      )?.blockers,
    ).toEqual(
      expect.arrayContaining([
        "matsubara_convergence_levels_below_minimum",
        "mesh_convergence_levels_below_minimum",
      ]),
    );
    expect(
      result.checks.find(
        (entry) => entry.checkId === "force_gap_and_gradient_fields_published",
      )?.blockers,
    ).toContain("force_gap_sample_count_insufficient");
    expect(
      result.checks.find(
        (entry) =>
          entry.checkId === "roughness_patch_temperature_uncertainty_bounded",
      )?.blockers,
    ).toEqual(
      expect.arrayContaining([
        "uncertainty_0_samples_below_frozen_minimum",
        "uncertainty_1_samples_below_frozen_minimum",
        "uncertainty_2_samples_below_frozen_minimum",
      ]),
    );
  });
});
