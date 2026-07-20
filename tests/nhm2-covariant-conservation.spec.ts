import { describe, expect, it } from "vitest";

import { NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS } from "../shared/contracts/nhm2-experiment-ready-theory-closure.v1";
import {
  NHM2_COVARIANT_CONSERVATION_CHECK_IDS,
  NHM2_COVARIANT_CONSERVATION_DIVERGENCE_COMPONENTS,
  NHM2_COVARIANT_CONSERVATION_SOURCE_TERM_IDS,
  NHM2_COVARIANT_CONSERVATION_UNCERTAINTY_QUANTITIES,
  buildNhm2CovariantConservation,
  isNhm2CovariantConservation,
  type BuildNhm2CovariantConservationInput,
  type Nhm2CovariantConservationCheckId,
} from "../shared/contracts/nhm2-covariant-conservation.v1";

const hash = (digit: string): string => digit.repeat(64);
const artifact = (path: string, digit = "a") => ({
  path,
  sha256: hash(digit),
});
const array = (path: string, shape: number[], unit: string, digit = "a") => ({
  ...artifact(path, digit),
  dtype: "float64" as const,
  shape,
  unit,
});

const validInput = (): BuildNhm2CovariantConservationInput => ({
  generatedAt: "2026-07-19T12:02:00.000Z",
  binding: {
    candidateId: "nhm2:alpha07:theory-candidate:001",
    candidateManifestPath: "run/candidate-manifest.json",
    candidateManifestSha256: hash("a"),
    preRunManifestPath: "run/pre-run-manifest.json",
    preRunManifestSha256: hash("b"),
    runId: "nhm2-conservation-run-001",
    requestId: "nhm2-conservation-request-001",
    receiptId: "nhm2-conservation-receipt-001",
    runtimeId: "nhm2.shift_lapse.alpha_sweep",
    plannedOutputDirectory: "run/nhm2-conservation-run-001",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "stage1_centerline_alpha_0p7000_v1",
    chartId: "comoving_cartesian",
    atlasPath: "run/atlas.json",
    atlasSha256: hash("d"),
    unitsPath: "run/units.json",
    unitsSha256: hash("e"),
    normalizationPath: "run/normalization.json",
    normalizationSha256: hash("f"),
    gitSha: "abcdef1234567890abcdef1234567890abcdef12",
  },
  sourceBinding: {
    sourceContractVersion: "nhm2_full_apparatus_source_tensor/v1",
    sourceEvidence: artifact("run/full-apparatus-source-tensor.json", "7"),
    rawTotalSourceTensor: artifact("run/full-source-tensor.f64", "8"),
    candidateId: "nhm2:alpha07:theory-candidate:001",
    candidateManifestSha256: hash("a"),
    runId: "nhm2-conservation-run-001",
    chartId: "comoving_cartesian",
  },
  divergence: {
    derivativeDefinition: artifact("run/covariant-derivative.json"),
    connectionCoefficients: array(
      "run/connection-coefficients.f64",
      [8, 4, 4, 4],
      "1/m",
      "b",
    ),
    volumeMask: array("run/volume-mask.f64", [8], "1", "c"),
    sampleCount: 8,
    components: NHM2_COVARIANT_CONSERVATION_DIVERGENCE_COMPONENTS.map(
      (component, index) => ({
        component,
        residualArray: array(
          `run/divergence-${component}.f64`,
          [8],
          "W/m^3",
          String(index + 1),
        ),
        maxAbsSI: 0.01,
        absoluteUncertainty95SI: 0.005,
        toleranceSI: 0.1,
      }),
    ),
  },
  sourceTerms: NHM2_COVARIANT_CONSERVATION_SOURCE_TERM_IDS.map(
    (termId, termIndex) => ({
      termId,
      constitutiveDefinition: artifact(
        `run/${termId}-constitutive.json`,
        String(termIndex + 5),
      ),
      includedInDiscreteDivergence: true,
      sampleCount: 8,
      components: NHM2_COVARIANT_CONSERVATION_DIVERGENCE_COMPONENTS.map(
        (component, componentIndex) => ({
          component,
          values: array(
            `run/${termId}-${component}.f64`,
            [8],
            "W/m^3",
            String(((termIndex + componentIndex) % 9) + 1),
          ),
        }),
      ),
    }),
  ),
  discreteGlobalBalance: {
    evidence: artifact("run/discrete-global-balance.json"),
    energyDerivative: array("run/global-energy-derivative.f64", [8], "W"),
    sourcePower: array("run/global-source-power.f64", [8], "W", "b"),
    outwardBoundaryFlux: array("run/global-boundary-flux.f64", [8], "W", "c"),
    sampleCount: 8,
    energyDerivativeW: 10,
    sourcePowerW: 12,
    outwardBoundaryFluxW: 2,
    absoluteUncertainty95W: 0.01,
    normalizationPowerW: 100,
    toleranceRelative: 0.1,
  },
  cycleEnergyLedger: {
    evidence: artifact("run/cycle-energy-ledger.json"),
    timeSeries: array("run/cycle-energy-time-series.f64", [3, 8], "mixed"),
    normalizationEnergyJ: 100,
    toleranceRelative: 0.1,
    samples: [
      {
        timeS: 0,
        geometryEnergyJ: 60,
        matterEnergyJ: 40,
        switchingWorkJ: 0,
        supportWorkJ: 0,
        controlWorkJ: 0,
        outwardBoundaryEnergyJ: 0,
        absoluteUncertainty95J: 0.01,
      },
      {
        timeS: 0.5,
        geometryEnergyJ: 61,
        matterEnergyJ: 40.5,
        switchingWorkJ: 1,
        supportWorkJ: 0.2,
        controlWorkJ: 0.5,
        outwardBoundaryEnergyJ: 0.2,
        absoluteUncertainty95J: 0.01,
      },
      {
        timeS: 1,
        geometryEnergyJ: 60,
        matterEnergyJ: 40,
        switchingWorkJ: 2,
        supportWorkJ: 0.4,
        controlWorkJ: 1,
        outwardBoundaryEnergyJ: 3.4,
        absoluteUncertainty95J: 0.01,
      },
    ],
  },
  convergence: {
    evidence: artifact("run/conservation-convergence.json"),
    minimumAcceptedOrder: 1,
    orderUncertainty95: 0.1,
    spatialResiduals: array("run/spatial-residuals.f64", [3], "relative"),
    temporalResiduals: array(
      "run/temporal-residuals.f64",
      [3],
      "relative",
      "b",
    ),
    spatialSeries: [4, 2, 1].map((scale, index) => ({
      discretizationScaleM: scale,
      residualRelative: [0.04, 0.01, 0.0025][index],
      uncertainty95Relative: 0,
    })),
    temporalSeries: [0.04, 0.02, 0.01].map((scale, index) => ({
      discretizationScaleS: scale,
      residualRelative: [0.04, 0.01, 0.0025][index],
      uncertainty95Relative: 0,
    })),
  },
  uncertaintyBudget: {
    evidence: artifact("run/conservation-uncertainty-budget.json"),
    confidenceLevel: 0.95,
    bounds: NHM2_COVARIANT_CONSERVATION_UNCERTAINTY_QUANTITIES.map(
      (quantity, index) => ({
        quantity,
        estimate: quantity.includes("convergence") ? 2 : 0.15,
        lower95: quantity.includes("convergence") ? 1.8 : 0.1,
        upper95: quantity.includes("convergence") ? 2.2 : 0.2,
        unit: quantity.includes("convergence")
          ? "observed_order"
          : "tolerance_fraction",
        method: artifact(
          `run/uncertainty-${quantity}.json`,
          String((index % 9) + 1),
        ),
      }),
    ),
  },
  provenance: {
    producerId: "nhm2-covariant-conservation-solver",
    producerVersion: "1.0.0",
    solverId: "covariant-fv-bssn",
    solverVersion: "1.0.0",
    solver: artifact("run/solver.json"),
    environment: artifact("run/environment.json", "d"),
    invocation: artifact("run/invocation.json", "e"),
    inputManifest: artifact("run/pre-run-manifest.json", "b"),
    startedAt: "2026-07-19T12:00:00.000Z",
    completedAt: "2026-07-19T12:01:00.000Z",
    runSpecificOutput: true,
  },
});

const check = (
  result: ReturnType<typeof buildNhm2CovariantConservation>,
  checkId: Nhm2CovariantConservationCheckId,
) => result.checks.find((entry) => entry.checkId === checkId);

describe("nhm2_covariant_conservation/v1", () => {
  it("uses exactly the meta-contract checks and blocks empty evidence", () => {
    expect(NHM2_COVARIANT_CONSERVATION_CHECK_IDS).toEqual(
      NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS.covariant_conservation,
    );

    const result = buildNhm2CovariantConservation();
    expect(result.status).toBe("blocked");
    expect(result.covariantConservationReady).toBe(false);
    expect(result.checks).toHaveLength(7);
    expect(result.checks.every((entry) => !entry.pass)).toBe(true);
    expect(result.claimBoundary).toEqual({
      diagnosticOnly: true,
      theoryClosureEvidenceOnly: true,
      physicalViability: false,
      transport: false,
      propulsion: false,
      routeEta: false,
      certifiedSpeed: false,
    });
    expect(isNhm2CovariantConservation(result)).toBe(true);
  });

  it("passes only the complete run-bound, uncertainty-aware raw ledger", () => {
    const result = buildNhm2CovariantConservation(validInput());

    expect(result.status, result.blockers.join("\n")).toBe("pass");
    expect(result.covariantConservationReady).toBe(true);
    expect(result.checks.map((entry) => entry.checkId)).toEqual(
      NHM2_COVARIANT_CONSERVATION_CHECK_IDS,
    );
    expect(result.checks.every((entry) => entry.pass)).toBe(true);
    expect(result.blockers).toEqual([]);
    expect(isNhm2CovariantConservation(result)).toBe(true);
  });

  it("derives each required check independently from primitive evidence", () => {
    const cases: Array<{
      checkId: Nhm2CovariantConservationCheckId;
      blocker: string;
      mutate: (input: BuildNhm2CovariantConservationInput) => void;
    }> = [
      {
        checkId: "local_covariant_divergence_all_four_components_computed",
        blocker: "divergence_D3_missing",
        mutate: (input) => input.divergence?.components?.pop(),
      },
      {
        checkId: "spacetime_switching_transition_terms_included",
        blocker: "source_term_spacetime_switching_not_included",
        mutate: (input) => {
          const term = input.sourceTerms?.find(
            (entry) => entry?.termId === "spacetime_switching",
          );
          if (term) term.includedInDiscreteDivergence = false;
        },
      },
      {
        checkId: "supports_controls_and_boundary_flux_included",
        blocker: "source_term_boundary_flux_missing",
        mutate: (input) => {
          input.sourceTerms = input.sourceTerms?.filter(
            (entry) => entry?.termId !== "boundary_flux",
          );
        },
      },
      {
        checkId: "discrete_global_balance_pass",
        blocker: "global_balance_exceeds_tolerance",
        mutate: (input) => {
          if (input.discreteGlobalBalance)
            input.discreteGlobalBalance.energyDerivativeW = 100;
        },
      },
      {
        checkId: "time_resolved_cycle_energy_ledger_closed",
        blocker: "cycle_energy_ledger_exceeds_tolerance",
        mutate: (input) => {
          const final = input.cycleEnergyLedger?.samples?.at(-1);
          if (final) final.geometryEnergyJ = 100;
        },
      },
      {
        checkId: "residual_within_frozen_uncertainty_tolerance",
        blocker: "uncertainty_adjusted_residual_exceeds_frozen_tolerance",
        mutate: (input) => {
          const bound = input.uncertaintyBudget?.bounds?.[0];
          if (bound) bound.upper95 = 2;
        },
      },
      {
        checkId: "spatial_temporal_convergence_observed",
        blocker: "spatial_convergence_not_monotonically_convergent",
        mutate: (input) => {
          const point = input.convergence?.spatialSeries?.[1];
          if (point) point.residualRelative = 0.08;
        },
      },
    ];

    for (const testCase of cases) {
      const input = validInput();
      testCase.mutate(input);
      const result = buildNhm2CovariantConservation(input);
      const selected = check(result, testCase.checkId);
      expect(selected?.pass, testCase.checkId).toBe(false);
      expect(selected?.blockers, testCase.checkId).toContain(testCase.blocker);
      expect(result.covariantConservationReady, testCase.checkId).toBe(false);
    }
  });

  it("fails every check when pre-run provenance is not congruent", () => {
    const input = validInput();
    if (input.provenance?.inputManifest)
      input.provenance.inputManifest.sha256 = hash("9");
    const result = buildNhm2CovariantConservation(input);

    expect(result.status).toBe("fail");
    expect(result.checks.every((entry) => entry.status === "fail")).toBe(true);
    expect(result.blockers).toContain(
      "local_covariant_divergence_all_four_components_computed:pre_run_manifest_provenance_mismatch",
    );
  });

  it("omits cyclic forward hashes and rejects them as shadow fields", () => {
    const ready = buildNhm2CovariantConservation(validInput());
    expect("receiptPath" in ready.binding).toBe(false);
    expect("receiptSha256" in ready.binding).toBe(false);
    expect("outputManifest" in ready.provenance).toBe(false);
    expect("receipt" in ready.provenance).toBe(false);

    const shadow = structuredClone(ready) as unknown as {
      binding: Record<string, unknown>;
      provenance: Record<string, unknown>;
    };
    shadow.binding.receiptPath = "receipts/forward.json";
    shadow.binding.receiptSha256 = hash("9");
    shadow.provenance.outputManifest = artifact("run/forward-manifest.json");
    shadow.provenance.receipt = artifact("receipts/forward.json", "9");

    expect(isNhm2CovariantConservation(shadow)).toBe(false);
  });

  it("rejects aggregate forgery, extra authority fields, and claim promotion", () => {
    const ready = buildNhm2CovariantConservation(validInput());
    const forged = structuredClone(ready) as unknown as Record<string, unknown>;
    forged.status = "blocked";
    const extra = structuredClone(ready) as unknown as Record<string, unknown>;
    extra.physicalAuthority = "certified";
    const promoted = structuredClone(ready) as unknown as {
      claimBoundary: { physicalViability: boolean };
    };
    promoted.claimBoundary.physicalViability = true;

    expect(isNhm2CovariantConservation(forged)).toBe(false);
    expect(isNhm2CovariantConservation(extra)).toBe(false);
    expect(isNhm2CovariantConservation(promoted)).toBe(false);
  });
});
