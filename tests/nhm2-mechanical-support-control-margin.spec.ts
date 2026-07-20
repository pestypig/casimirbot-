import { describe, expect, it } from "vitest";
import {
  NHM2_MECHANICAL_CONTROL_BUDGET_IDS,
  NHM2_MECHANICAL_FABRICATION_PARAMETER_IDS,
  NHM2_MECHANICAL_INSTABILITY_MARGIN_IDS,
  NHM2_MECHANICAL_SOURCE_TERM_IDS,
  NHM2_MECHANICAL_STRUCTURAL_MARGIN_IDS,
  NHM2_MECHANICAL_SUPPORT_CONTROL_MARGIN_CHECK_IDS,
  buildNhm2MechanicalSupportControlMargin,
  isNhm2MechanicalSupportControlMargin,
  type BuildNhm2MechanicalSupportControlMarginInput,
} from "../shared/contracts/nhm2-mechanical-support-control-margin.v1";
import { NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS } from "../shared/contracts/nhm2-experiment-ready-theory-closure.v1";

const H = "d".repeat(64);
const H2 = "e".repeat(64);
const GIT = "f".repeat(40);

const artifact = (path: string, sha256 = H) => ({ path, sha256 });
const CARTESIAN_TENSOR_COMPONENT_ORDER = [
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
const SPACETIME_TENSOR_COMPONENT_ORDER = Array.from(
  { length: 16 },
  (_, index) => `T${Math.floor(index / 4)}${index % 4}`,
);
const MECHANICAL_MARGIN_COMPONENT_ORDER = [
  ...NHM2_MECHANICAL_INSTABILITY_MARGIN_IDS,
  ...NHM2_MECHANICAL_STRUCTURAL_MARGIN_IDS,
];
const componentOrderFor = (path: string): string[] => {
  if (path.endsWith("/gaps.f64")) return ["gap"];
  if (path.endsWith("/force.f64")) return ["force"];
  if (path.includes("force-gradient")) return ["gradient"];
  if (path.includes("anchor-traction") || path.includes("displacement"))
    return ["x", "y", "z"];
  if (path.includes("strain.f64") || path.includes("stress.f64"))
    return CARTESIAN_TENSOR_COMPONENT_ORDER;
  if (path.includes("temperature.f64")) return ["temperature"];
  if (path.includes("contact-pressure")) return ["contact_pressure"];
  if (path.includes("modal-spectrum")) return ["frequency", "damping_rate"];
  if (path.includes("support-retention-samples"))
    return ["support_fraction", "source_retention"];
  const margin = MECHANICAL_MARGIN_COMPONENT_ORDER.find((marginId) =>
    path.endsWith(`/${marginId}-margin.f64`),
  );
  if (margin != null) return [margin];
  if (path.includes("fabrication-joint-samples"))
    return [...NHM2_MECHANICAL_FABRICATION_PARAMETER_IDS];
  const fabrication = NHM2_MECHANICAL_FABRICATION_PARAMETER_IDS.find(
    (parameterId) => path.endsWith(`/${parameterId}-samples.f64`),
  );
  if (fabrication != null) return [fabrication];
  if (path.includes("transfer-function")) return ["frequency", "gain"];
  if (path.includes("command-trace")) return ["command"];
  if (path.includes("response-trace")) return ["response"];
  if (path.includes("noise-spectrum"))
    return ["frequency", "amplitude_spectral_density"];
  if (path.includes("heat-trace")) return ["heat_load"];
  if (path.includes("timing-trace")) return ["timing_error"];
  if (path.includes("cycle-energy"))
    return ["time", "input", "recovered", "heat", "stored", "mechanical_work"];
  if (path.includes("tmunu")) return SPACETIME_TENSOR_COMPONENT_ORDER;
  if (path.includes("mechanical-covariance"))
    return MECHANICAL_MARGIN_COMPONENT_ORDER;
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

const positiveInput = (): BuildNhm2MechanicalSupportControlMarginInput => ({
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
    runId: "run-mechanical-synthetic",
    requestId: "request-mechanical-synthetic",
    receiptId: "runtime:casimir.verify:request:mechanical-synthetic",
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
  forceGradientImport: {
    sourceContractVersion:
      "casimir_finite_temperature_finite_geometry_maxwell_stress/v1",
    sourceEvidence: artifact("inputs/material-maxwell-stress.v1.json"),
    sourceCandidateId: "nhm2-candidate-synthetic",
    sourceCandidateManifestSha256: H,
    sourceRunId: "run-mechanical-synthetic",
    forceGapCoordinates: array("raw/gaps.f64", [5], "m"),
    integratedForce: array("raw/force.f64", [5], "N"),
    forceGradient: array("raw/force-gradient.f64", [5], "N/m"),
    anchorTractionField: array("raw/anchor-traction.f64", [4, 3], "Pa"),
    targetGapM: 8e-9,
    forceAtTargetN: -31,
    forceUncertainty95N: 0.2,
    forceGradientAtTargetNPerM: 7e12,
    forceGradientUncertainty95NPerM: 1e10,
    idealParallelPlateFallbackUsed: false,
  },
  nonlinearFea: {
    formulation: "coupled_nonlinear_thermomechanical_electrostatic",
    solver: artifact("inputs/nonlinear-fea-solver.bin"),
    geometry: artifact("inputs/apparatus.step"),
    mesh: artifact("inputs/apparatus.mesh"),
    materialModels: artifact("inputs/material-models.json"),
    contactModel: artifact("inputs/contact-model.json"),
    boundaryConditions: artifact("inputs/mechanical-boundary.json"),
    loadMap: artifact("inputs/maxwell-load-map.json"),
    sampleCount: 8,
    cellCount: 1000,
    nonlinearIterationCount: 12,
    converged: true,
    residualNorm: 1e-5,
    residualUncertainty95: 1e-5,
    residualTolerance: 1e-3,
    displacementField: array("raw/displacement.f64", [8, 3], "m"),
    strainField: array("raw/strain.f64", [8, 3, 3], "1"),
    stressField: array("raw/stress.f64", [8, 3, 3], "Pa"),
    temperatureField: array("raw/temperature.f64", [8], "K"),
    contactPressureField: array("raw/contact-pressure.f64", [8], "Pa"),
    modalSpectrum: array("raw/modal-spectrum.f64", [8, 2], "Hz,1/s"),
    supportsIncluded: true,
    controlsIncluded: true,
    materialNonlinearityIncluded: true,
    geometricNonlinearityIncluded: true,
  },
  supportRetention: {
    evidence: artifact("evidence/support-retention.json"),
    jointSamples: array("raw/support-retention-samples.f64", [1024, 2], "1"),
    confidenceLevel: 0.95,
    structuralMinimumSupportFractionUpper95: 0.2,
    retentionCompatibleMaximumSupportFractionLower95: 0.3,
    overlapRatioLower95: 1.5,
    overlapRatioConsistencyTolerance: 1e-12,
    requiredStrictLowerBound: 1,
  },
  instabilityMargins: NHM2_MECHANICAL_INSTABILITY_MARGIN_IDS.map(
    (marginId) => ({
      marginId,
      evidence: artifact(`evidence/${marginId}-margin.json`),
      rawSamples: array(`raw/${marginId}-margin.f64`, [64], "1"),
      nominalMargin: 2,
      absoluteUncertainty95: 0.1,
      minimumAllowedMargin: 0,
      unit: "1",
    }),
  ),
  structuralMargins: NHM2_MECHANICAL_STRUCTURAL_MARGIN_IDS.map((marginId) => ({
    marginId,
    evidence: artifact(`evidence/${marginId}-margin.json`),
    rawSamples: array(`raw/${marginId}-margin.f64`, [64], "1"),
    nominalMargin: 2,
    absoluteUncertainty95: 0.1,
    minimumAllowedMargin: 0,
    unit: "1",
  })),
  fabricationEnvelope: {
    evidence: artifact("evidence/fabrication-envelope.json"),
    jointSamples: array("raw/fabrication-joint-samples.f64", [100, 4], "1"),
    confidenceLevel: 0.95,
    requiredCoverageFraction: 0.95,
    parameters: NHM2_MECHANICAL_FABRICATION_PARAMETER_IDS.map(
      (parameterId) => ({
        parameterId,
        distribution: artifact(`inputs/${parameterId}-distribution.json`),
        samples: array(`raw/${parameterId}-samples.f64`, [100], "m"),
        allowedMinimum: 0,
        allowedMaximum: 10,
        manufacturedLower95: 2,
        manufacturedUpper95: 8,
        unit: "m",
      }),
    ),
    passingSampleCount: 99,
    totalSampleCount: 100,
  },
  activeControl: {
    controller: artifact("inputs/controller.bin"),
    actuatorModel: artifact("inputs/actuator-model.json"),
    sensorModel: artifact("inputs/sensor-model.json"),
    transferFunction: array("raw/transfer-function.f64", [64, 2], "Hz,1"),
    commandTrace: array("raw/command-trace.f64", [64], "V"),
    responseTrace: array("raw/response-trace.f64", [64], "m"),
    noiseSpectrum: array("raw/noise-spectrum.f64", [64, 2], "Hz,m/sqrt(Hz)"),
    heatTrace: array("raw/heat-trace.f64", [64], "W"),
    timingTrace: array("raw/timing-trace.f64", [64], "s"),
    cyclePeriodS: 1e-3,
    dutyFraction: 0.1,
    budgets: NHM2_MECHANICAL_CONTROL_BUDGET_IDS.map((budgetId) => ({
      budgetId,
      evidence: artifact(`evidence/${budgetId}-budget.json`),
      measuredUpper95: 0.5,
      maximumAllowed: 1,
      unit: "normalized_budget",
    })),
  },
  periodicCycleEnergy: {
    evidence: artifact("evidence/cycle-energy.json"),
    timeSeries: array("raw/cycle-energy.f64", [64, 6], "s,J"),
    cycleCount: 8,
    inputEnergyJ: 10,
    recoveredEnergyJ: 2,
    dissipatedHeatJ: 3,
    storedEnergyChangeJ: 1,
    exportedMechanicalWorkJ: 4,
    absoluteUncertainty95J: 0.01,
    normalizationEnergyJ: 10,
    toleranceRelative: 0.01,
  },
  apparatusStressEnergy: {
    evidence: artifact("evidence/apparatus-stress-energy.json"),
    aggregationOperator: artifact("inputs/stress-energy-aggregation.json"),
    fullSourceTensor: array("raw/apparatus-tmunu.f64", [8, 4, 4], "J/m^3"),
    chartId: "nhm2-cartesian-v1",
    sampleCount: 8,
    includedInCandidateSourceTensor: true,
    candidateSourceTensor: artifact("inputs/candidate-source-tensor.f64"),
    terms: NHM2_MECHANICAL_SOURCE_TERM_IDS.map((termId) => ({
      termId,
      constitutiveModel: artifact(`inputs/${termId}-constitutive.json`),
      tensor: array(`raw/${termId}-tmunu.f64`, [8, 4, 4], "J/m^3"),
      sampleCount: 8,
    })),
  },
  uncertainty: {
    evidence: artifact("evidence/mechanical-uncertainty.json"),
    covariance: array("raw/mechanical-covariance.f64", [8, 8], "1"),
    confidenceLevel: 0.95,
    method: artifact("inputs/uncertainty-method.json"),
  },
  provenance: {
    producerId: "synthetic-contract-fixture",
    implementationId: "coupled-fea-implementation",
    solverId: "coupled-fea-solver",
    solverVersion: "1.0.0",
    solver: artifact("inputs/coupled-fea-solver.bin"),
    environment: artifact("inputs/environment.lock"),
    invocation: artifact("inputs/invocation.json"),
    command: "mechanical-solver",
    argv: ["--input", "inputs/candidate.v1.json"],
    workingDirectory: "run/mechanical",
    inputManifest: artifact("inputs/input-manifest.json"),
    runId: "run-mechanical-synthetic",
    requestId: "request-mechanical-synthetic",
    receiptId: "runtime:casimir.verify:request:mechanical-synthetic",
    runtimeId: "casimir.verify",
    gitSha: GIT,
    startedAt: "2026-07-19T00:00:00.000Z",
    completedAt: "2026-07-19T00:00:01.000Z",
    durationMs: 1000,
    deterministicSeed: "mechanical-seed",
    runSpecificOutput: true,
  },
});

describe("NHM2 mechanical support/control margin contract", () => {
  it("uses exactly the closure meta-contract check IDs", () => {
    expect(NHM2_MECHANICAL_SUPPORT_CONTROL_MARGIN_CHECK_IDS).toEqual(
      NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS.mechanical_support_control_margin,
    );
  });

  it("accepts a complete synthetic contract-only fixture while retaining hard claim locks", () => {
    const result = buildNhm2MechanicalSupportControlMargin(positiveInput());
    expect(result.status).toBe("pass");
    expect(result.checks).toHaveLength(
      NHM2_MECHANICAL_SUPPORT_CONTROL_MARGIN_CHECK_IDS.length,
    );
    expect(result.checks.every((check) => check.pass)).toBe(true);
    expect(
      Object.fromEntries(
        result.checks.map((check) => [check.checkId, check.unit]),
      ),
    ).toMatchObject({
      support_retention_overlap_lower95_gt_one: "1",
      pull_in_buckling_contact_stiction_margins_positive:
        "dimensionless_margin",
      stress_thermal_fatigue_modal_margins_positive: "dimensionless_margin",
      fabrication_tolerance_envelope_pass: "coverage_fraction",
      active_control_energy_noise_heat_timing_bounded: "budget_fraction",
      periodic_cycle_energy_balance_closed: "relative_energy_closure",
    });
    expect(result.mechanicalSupportControlMarginReady).toBe(true);
    expect(result.claimBoundary).toMatchObject({
      diagnosticOnly: true,
      apparatusTheoryEvidenceOnly: true,
      physicalViability: false,
      transport: false,
      propulsion: false,
      routeEta: false,
      certifiedSpeed: false,
    });
    expect(isNhm2MechanicalSupportControlMargin(result)).toBe(true);
  });

  it("reports missing evidence as blocked rather than a numerical failure", () => {
    const result = buildNhm2MechanicalSupportControlMargin();
    expect(result.status).toBe("blocked");
    expect(result.checks.every((check) => check.status === "blocked")).toBe(
      true,
    );
  });

  it("fails the observed 0.459 support-retention anomaly", () => {
    const input = positiveInput();
    input.supportRetention!.structuralMinimumSupportFractionUpper95 = 0.18507;
    input.supportRetention!.retentionCompatibleMaximumSupportFractionLower95 = 0.08497;
    input.supportRetention!.overlapRatioLower95 = 0.08497 / 0.18507;
    const result = buildNhm2MechanicalSupportControlMargin(input);
    const check = result.checks.find(
      (entry) => entry.checkId === "support_retention_overlap_lower95_gt_one",
    );
    expect(check?.status).toBe("fail");
    expect(check?.metricValue).toBeCloseTo(0.459, 3);
    expect(check?.blockers).toContain(
      "support_retention_overlap_lower95_not_gt_one",
    );
  });

  it("enforces a strict lower-95 overlap greater than one, not equality", () => {
    const input = positiveInput();
    input.supportRetention!.structuralMinimumSupportFractionUpper95 = 0.2;
    input.supportRetention!.retentionCompatibleMaximumSupportFractionLower95 = 0.2;
    input.supportRetention!.overlapRatioLower95 = 1;
    const result = buildNhm2MechanicalSupportControlMargin(input);
    expect(
      result.checks.find(
        (entry) => entry.checkId === "support_retention_overlap_lower95_gt_one",
      )?.status,
    ).toBe("fail");
  });

  it("fails a non-positive pull-in margin after uncertainty", () => {
    const input = positiveInput();
    const pullIn = input.instabilityMargins!.find(
      (entry) => entry?.marginId === "pull_in",
    )!;
    pullIn.nominalMargin = 0.05;
    pullIn.absoluteUncertainty95 = 0.1;
    const result = buildNhm2MechanicalSupportControlMargin(input);
    const check = result.checks.find(
      (entry) =>
        entry.checkId === "pull_in_buckling_contact_stiction_margins_positive",
    );
    expect(check?.status).toBe("fail");
    expect(check?.blockers).toContain(
      "instability_pull_in_margin_not_positive",
    );
  });

  it("fails an over-budget control channel and an open cycle-energy ledger", () => {
    const input = positiveInput();
    const noise = input.activeControl!.budgets!.find(
      (entry) => entry?.budgetId === "displacement_noise",
    )!;
    noise.measuredUpper95 = 2;
    input.periodicCycleEnergy!.exportedMechanicalWorkJ = 3;
    const result = buildNhm2MechanicalSupportControlMargin(input);
    expect(
      result.checks.find(
        (entry) =>
          entry.checkId === "active_control_energy_noise_heat_timing_bounded",
      )?.status,
    ).toBe("fail");
    expect(
      result.checks.find(
        (entry) => entry.checkId === "periodic_cycle_energy_balance_closed",
      )?.status,
    ).toBe("fail");
  });

  it("fails when apparatus stress-energy is omitted from the candidate tensor", () => {
    const input = positiveInput();
    input.apparatusStressEnergy!.includedInCandidateSourceTensor = false;
    const result = buildNhm2MechanicalSupportControlMargin(input);
    const check = result.checks.find(
      (entry) =>
        entry.checkId ===
        "mechanical_control_stress_energy_returned_to_source_tensor",
    );
    expect(check?.status).toBe("fail");
    expect(check?.blockers).toContain(
      "apparatus_stress_energy_not_returned_to_candidate_source_tensor",
    );
  });

  it("binds pre-run identity but contains no forward receipt or output-manifest hashes", () => {
    const result = buildNhm2MechanicalSupportControlMargin(positiveInput());
    expect(result.binding.receiptId).toBeTruthy();
    expect(result.binding.numericPolicySetSemanticSha256).toBe(H2);
    expect("receiptPath" in result.binding).toBe(false);
    expect("receiptSha256" in result.binding).toBe(false);
    expect("outputManifest" in result.provenance).toBe(false);

    const withForwardHash = structuredClone(result) as unknown as Record<
      string,
      unknown
    >;
    (withForwardHash.provenance as Record<string, unknown>).outputManifest =
      artifact("post-run/output-manifest.json");
    expect(isNhm2MechanicalSupportControlMargin(withForwardHash)).toBe(false);
  });

  it("rejects forged derived gates and shadow physical authority", () => {
    const result = buildNhm2MechanicalSupportControlMargin(positiveInput());
    const forged = structuredClone(result);
    forged.checks[0].pass = false;
    expect(isNhm2MechanicalSupportControlMargin(forged)).toBe(false);

    const shadow = structuredClone(result) as unknown as Record<
      string,
      unknown
    >;
    shadow.physicalViability = true;
    expect(isNhm2MechanicalSupportControlMargin(shadow)).toBe(false);
  });

  it("fails a provenance run mismatch rather than accepting detached evidence", () => {
    const input = positiveInput();
    input.provenance!.runId = "different-run";
    const result = buildNhm2MechanicalSupportControlMargin(input);
    expect(result.status).toBe("fail");
    expect(
      result.blockers.some((blocker) =>
        blocker.endsWith("provenance_run_id_mismatch"),
      ),
    ).toBe(true);
  });

  it("fails closed on degenerate, mis-sized, or unlabelled mechanical arrays", () => {
    const input = positiveInput();
    const stress = input.nonlinearFea!.stressField!;
    stress.shape = [8, 3, 0];
    stress.componentOrder = [];
    stress.storageOrder = undefined;
    input.nonlinearFea!.displacementField!.sizeBytes = 8;
    const result = buildNhm2MechanicalSupportControlMargin(input);
    const check = result.checks.find(
      (entry) => entry.checkId === "coupled_nonlinear_fea_completed",
    );
    expect(check?.status).toBe("fail");
    expect(check?.blockers).toEqual(
      expect.arrayContaining([
        "stress_field_shape_invalid",
        "stress_field_component_order_missing",
        "stress_field_storage_order_missing",
        "displacement_field_size_bytes_invalid",
      ]),
    );
  });

  it("rejects one-sample mechanical, fabrication, control, and source ledgers", () => {
    const input = positiveInput();
    input.forceGradientImport!.forceGapCoordinates = array(
      "raw/gaps.f64",
      [1],
      "m",
    );
    input.forceGradientImport!.integratedForce = array(
      "raw/force.f64",
      [1],
      "N",
    );
    input.forceGradientImport!.forceGradient = array(
      "raw/force-gradient.f64",
      [1],
      "N/m",
    );

    input.nonlinearFea!.sampleCount = 1;
    input.nonlinearFea!.cellCount = 1;
    input.nonlinearFea!.nonlinearIterationCount = 1;
    input.nonlinearFea!.displacementField = array(
      "raw/displacement.f64",
      [1, 3],
      "m",
    );
    input.nonlinearFea!.strainField = array("raw/strain.f64", [1, 3, 3], "1");
    input.nonlinearFea!.stressField = array("raw/stress.f64", [1, 3, 3], "Pa");
    input.nonlinearFea!.temperatureField = array(
      "raw/temperature.f64",
      [1],
      "K",
    );
    input.nonlinearFea!.contactPressureField = array(
      "raw/contact-pressure.f64",
      [1],
      "Pa",
    );
    input.nonlinearFea!.modalSpectrum = array(
      "raw/modal-spectrum.f64",
      [1, 2],
      "Hz,1/s",
    );
    input.supportRetention!.jointSamples = array(
      "raw/support-retention-samples.f64",
      [1, 2],
      "1",
    );
    input.instabilityMargins![0]!.rawSamples = array(
      "raw/pull_in-margin.f64",
      [1],
      "1",
    );

    input.fabricationEnvelope!.totalSampleCount = 1;
    input.fabricationEnvelope!.passingSampleCount = 1;
    input.fabricationEnvelope!.jointSamples = array(
      "raw/fabrication-joint-samples.f64",
      [1, 4],
      "1",
    );
    input.fabricationEnvelope!.parameters!.forEach((parameter) => {
      if (parameter?.parameterId != null)
        parameter.samples = array(
          `raw/${parameter.parameterId}-samples.f64`,
          [1],
          "m",
        );
    });
    input.activeControl!.commandTrace = array(
      "raw/command-trace.f64",
      [1],
      "V",
    );
    input.periodicCycleEnergy!.cycleCount = 1;
    input.periodicCycleEnergy!.timeSeries = array(
      "raw/cycle-energy.f64",
      [1, 6],
      "s,J",
    );
    input.apparatusStressEnergy!.sampleCount = 1;
    input.apparatusStressEnergy!.fullSourceTensor = array(
      "raw/apparatus-tmunu.f64",
      [1, 4, 4],
      "J/m^3",
    );
    input.apparatusStressEnergy!.terms!.forEach((term) => {
      if (term?.termId != null) {
        term.sampleCount = 1;
        term.tensor = array(`raw/${term.termId}-tmunu.f64`, [1, 4, 4], "J/m^3");
      }
    });

    const result = buildNhm2MechanicalSupportControlMargin(input);
    expect(
      result.checks.find(
        (entry) =>
          entry.checkId === "force_gradient_imported_from_realistic_solver",
      )?.blockers,
    ).toContain("force_gap_samples_below_frozen_minimum");
    expect(
      result.checks.find(
        (entry) => entry.checkId === "coupled_nonlinear_fea_completed",
      )?.blockers,
    ).toEqual(
      expect.arrayContaining([
        "fea_sample_count_below_frozen_minimum",
        "fea_cell_count_below_frozen_minimum",
        "fea_nonlinear_iterations_below_frozen_minimum",
        "modal_spectrum_samples_below_frozen_minimum",
      ]),
    );
    expect(
      result.checks.find(
        (entry) => entry.checkId === "support_retention_overlap_lower95_gt_one",
      )?.blockers,
    ).toContain("support_retention_samples_below_frozen_minimum");
    expect(
      result.checks.find(
        (entry) => entry.checkId === "fabrication_tolerance_envelope_pass",
      )?.blockers,
    ).toContain("fabrication_total_sample_count_below_frozen_minimum");
    expect(
      result.checks.find(
        (entry) =>
          entry.checkId === "active_control_energy_noise_heat_timing_bounded",
      )?.blockers,
    ).toContain("command_trace_samples_below_frozen_minimum");
    expect(
      result.checks.find(
        (entry) => entry.checkId === "periodic_cycle_energy_balance_closed",
      )?.blockers,
    ).toEqual(
      expect.arrayContaining([
        "cycle_count_below_frozen_minimum",
        "cycle_energy_samples_per_cycle_below_frozen_minimum",
      ]),
    );
    expect(
      result.checks.find(
        (entry) =>
          entry.checkId ===
          "mechanical_control_stress_energy_returned_to_source_tensor",
      )?.blockers,
    ).toContain("apparatus_stress_energy_samples_below_frozen_minimum");
  });
});
