import { describe, expect, it } from "vitest";

import { NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS } from "../shared/contracts/nhm2-experiment-ready-theory-closure.v1";
import {
  NHM2_DYNAMIC_BACKREACTION_STABILITY_CAUSALITY_CHECK_IDS,
  NHM2_DYNAMIC_BSSN_CONSTRAINT_IDS,
  NHM2_DYNAMIC_CONVERGENCE_AXES,
  NHM2_DYNAMIC_ROBUSTNESS_PARAMETER_IDS,
  buildNhm2DynamicBackreactionStabilityCausality,
  isNhm2DynamicBackreactionStabilityCausality,
  type BuildNhm2DynamicBackreactionStabilityCausalityInput,
  type Nhm2DynamicBackreactionCheckId,
} from "../shared/contracts/nhm2-dynamic-backreaction-stability-causality.v1";

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

const validInput = (): BuildNhm2DynamicBackreactionStabilityCausalityInput => {
  const neighborhoodSamples = [
    {
      sampleId: "baseline",
      parameterId: "baseline" as const,
      signedOffsetFraction: 0,
      sampleEvidence: artifact("run/neighborhood-baseline.json"),
      minimumGateMargin: 0.5,
      marginUncertainty95: 0.05,
    },
    ...NHM2_DYNAMIC_ROBUSTNESS_PARAMETER_IDS.flatMap((parameterId, index) =>
      [-0.05, 0.05].map((offset, offsetIndex) => ({
        sampleId: `${parameterId}:${offset < 0 ? "minus" : "plus"}`,
        parameterId,
        signedOffsetFraction: offset,
        sampleEvidence: artifact(
          `run/neighborhood-${parameterId}-${offsetIndex}.json`,
          String(((index * 2 + offsetIndex) % 9) + 1),
        ),
        minimumGateMargin: 0.5,
        marginUncertainty95: 0.05,
      })),
    ),
  ];
  return {
    generatedAt: "2026-07-19T12:02:00.000Z",
    binding: {
      candidateId: "nhm2:alpha07:theory-candidate:001",
      candidateManifestPath: "run/candidate-manifest.json",
      candidateManifestSha256: hash("a"),
      preRunManifestPath: "run/pre-run-manifest.json",
      preRunManifestSha256: hash("b"),
      runId: "nhm2-dynamic-run-001",
      requestId: "nhm2-dynamic-request-001",
      receiptId: "nhm2-dynamic-receipt-001",
      runtimeId: "nhm2.shift_lapse.alpha_sweep",
      plannedOutputDirectory: "run/nhm2-dynamic-run-001",
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
    initialCoupling: {
      initialData: artifact("run/initial-data.json"),
      geometryState: array("run/geometry-step-0.f64", [8, 10], "metric", "1"),
      sourceTensor: array("run/source-step-0.f64", [8, 10], "J/m^3", "4"),
      couplingOperator: artifact("run/coupling-operator.json", "b"),
      constitutiveState: artifact("run/constitutive-state.json", "c"),
      sourceReturnedToEvolution: true,
      sampleCount: 8,
      initialConstraintResidual: 0.01,
      initialConstraintUncertainty95: 0.005,
      initialConstraintTolerance: 0.1,
    },
    evolution: {
      evolutionSystem: "BSSN",
      integrator: artifact("run/bssn-integrator.json"),
      dtS: 4 / 15,
      durationS: 4,
      horizonNormalization: {
        timingDefinition: artifact("run/horizon-timing-definition.json", "8"),
        switchingPeriodS: 1,
        lightCrossingTimeS: 0.5,
        controlCyclePeriodS: 0.25,
      },
      metricChangeFloor: 0.001,
      sourceChangeFloor: 0.001,
      samples: Array.from({ length: 16 }, (_, step) => ({
        step,
        timeS: step * (4 / 15),
        geometryState: array(
          `run/geometry-step-${step}.f64`,
          [8, 10],
          "metric",
          String((step % 9) + 1),
        ),
        sourceTensor: array(
          `run/source-step-${step}.f64`,
          [8, 10],
          "J/m^3",
          String(((step + 3) % 9) + 1),
        ),
        metricDeltaL2: step * 0.02,
        sourceDeltaL2: step * 0.03,
        couplingResidual: 0.01,
        couplingUncertainty95: 0.005,
        couplingTolerance: 0.1,
      })),
    },
    bssnConstraints: {
      evidence: artifact("run/bssn-constraints.json"),
      constraints: NHM2_DYNAMIC_BSSN_CONSTRAINT_IDS.map(
        (constraintId, index) => ({
          constraintId,
          residuals: array(
            `run/${constraintId}-residuals.f64`,
            [16],
            "normalized_constraint",
            String(index + 1),
          ),
          maxAbs: 0.01,
          absoluteUncertainty95: 0.005,
          tolerance: 0.1,
        }),
      ),
    },
    convergence: {
      evidence: artifact("run/dynamic-convergence.json"),
      minimumAcceptedOrder: 1,
      orderUncertainty95: 0.1,
      studies: NHM2_DYNAMIC_CONVERGENCE_AXES.map((axis, axisIndex) => ({
        axis,
        residuals: array(
          `run/convergence-${axis}.f64`,
          [3],
          "relative",
          String(axisIndex + 1),
        ),
        points: [4, 2, 1].map((discretizationScale, index) => ({
          discretizationScale,
          residualRelative: [0.04, 0.01, 0.0025][index],
          uncertainty95Relative: 0,
        })),
      })),
    },
    semiclassicalBackreaction: {
      evidence: artifact("run/semiclassical-backreaction.json"),
      geometry: array("run/backreaction-geometry.f64", [8, 10], "metric"),
      renormalizedStressTensor: array(
        "run/backreaction-rset.f64",
        [8, 10],
        "J/m^3",
        "b",
      ),
      sourceTensor: array("run/backreaction-source.f64", [8, 10], "J/m^3", "c"),
      selfConsistentIterations: 8,
      converged: true,
      residualRelativeLInf: 0.01,
      absoluteUncertainty95: 0.005,
      toleranceRelativeLInf: 0.1,
    },
    horizonCharacteristicScreen: {
      evidence: artifact("run/horizon-characteristic-screen.json"),
      outgoingNullExpansion: array(
        "run/outgoing-null-expansion.f64",
        [8],
        "1/m",
      ),
      characteristicSpeeds: array(
        "run/characteristic-speeds.f64",
        [8, 4],
        "c",
        "b",
      ),
      minimumOutgoingExpansion: 0.5,
      expansionUncertainty95: 0.05,
      minimumAllowedExpansion: 0,
      minimumHyperbolicityMargin: 0.5,
      hyperbolicityUncertainty95: 0.05,
      minimumAllowedHyperbolicityMargin: 0,
    },
    rayParticleScreen: {
      evidence: artifact("run/ray-particle-screen.json"),
      nullRayBundle: array("run/null-ray-bundle.f64", [16, 8], "phase_space"),
      particleDistribution: array(
        "run/particle-distribution.f64",
        [32, 8],
        "phase_space",
        "b",
      ),
      rayCount: 16,
      particleSampleCount: 32,
      maximumBlueshiftGain: 0.5,
      blueshiftUncertainty95: 0.1,
      maximumAllowedBlueshiftGain: 1,
      maximumParticleAccumulationGain: 0.4,
      particleAccumulationUncertainty95: 0.1,
      maximumAllowedParticleAccumulationGain: 1,
    },
    perturbationSpectrum: {
      evidence: artifact("run/perturbation-spectrum.json"),
      spectrum: array("run/perturbation-spectrum.f64", [3, 3], "mixed"),
      maximumAllowedGrowthRatePerS: 0,
      modes: [1, 2, 3].map((waveNumberPerM, index) => ({
        modeId: `mode-${index}`,
        waveNumberPerM,
        growthRatePerS: -0.1 - index * 0.01,
        growthRateUncertainty95PerS: 0.01,
      })),
    },
    globalCausalityScreen: {
      evidence: artifact("run/global-causality-screen.json"),
      timeFunctionGradient: array(
        "run/time-function-gradient.f64",
        [8, 4],
        "1",
      ),
      causalIntervalSamples: array("run/causal-intervals.f64", [8], "m^2", "b"),
      geodesicSamples: array("run/geodesic-samples.f64", [8, 8], "mixed", "c"),
      minimumTimelikeGradientMargin: 0.5,
      timelikeGradientUncertainty95: 0.05,
      minimumAllowedTimelikeGradientMargin: 0,
      minimumCausalIntervalSquaredM2: 0.5,
      causalIntervalUncertainty95M2: 0.05,
      minimumAllowedCausalIntervalSquaredM2: 0,
      ctcCandidateCount: 0,
      minimumCompleteAffineParameterM: 10,
      affineParameterUncertainty95M: 0.1,
      minimumRequiredAffineParameterM: 1,
    },
    parameterNeighborhood: {
      evidence: artifact("run/parameter-neighborhood.json"),
      minimumRequiredPassFraction: 0.95,
      samples: neighborhoodSamples,
    },
    uncertainty: {
      evidence: artifact("run/dynamic-uncertainty.json"),
      covariance: array("run/dynamic-covariance.f64", [16, 16], "mixed"),
      method: artifact("run/dynamic-uncertainty-method.json", "b"),
      confidenceLevel: 0.95,
    },
    provenance: {
      producerId: "nhm2-coupled-bssn-solver",
      producerVersion: "1.0.0",
      solverId: "coupled-bssn-rset",
      solverVersion: "1.0.0",
      solver: artifact("run/solver.json"),
      environment: artifact("run/environment.json", "d"),
      invocation: artifact("run/invocation.json", "e"),
      inputManifest: artifact("run/pre-run-manifest.json", "b"),
      startedAt: "2026-07-19T12:00:00.000Z",
      completedAt: "2026-07-19T12:01:00.000Z",
      runSpecificOutput: true,
    },
  };
};

const check = (
  result: ReturnType<typeof buildNhm2DynamicBackreactionStabilityCausality>,
  checkId: Nhm2DynamicBackreactionCheckId,
) => result.checks.find((entry) => entry.checkId === checkId);

describe("nhm2_dynamic_backreaction_stability_causality/v1", () => {
  it("uses exactly the meta-contract checks and blocks empty/static evidence", () => {
    expect(NHM2_DYNAMIC_BACKREACTION_STABILITY_CAUSALITY_CHECK_IDS).toEqual(
      NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS.dynamic_backreaction_stability_causality,
    );

    const result = buildNhm2DynamicBackreactionStabilityCausality({
      status: "pass",
      dynamicBackreactionStabilityCausalityReady: true,
      evolution: { dtS: 0, durationS: 0, samples: [] },
    } as unknown as BuildNhm2DynamicBackreactionStabilityCausalityInput);

    expect(result.status).not.toBe("pass");
    expect(result.dynamicBackreactionStabilityCausalityReady).toBe(false);
    expect(result.checks).toHaveLength(13);
    expect(result.checks.every((entry) => !entry.pass)).toBe(true);
    expect(result.claimBoundary.physicalViability).toBe(false);
    expect(result.claimBoundary.transport).toBe(false);
    expect(isNhm2DynamicBackreactionStabilityCausality(result)).toBe(true);
  });

  it("passes only a nontrivial, coupled, converged, uncertainty-aware evolution", () => {
    const result = buildNhm2DynamicBackreactionStabilityCausality(validInput());

    expect(result.status, result.blockers.join("\n")).toBe("pass");
    expect(result.dynamicBackreactionStabilityCausalityReady).toBe(true);
    expect(result.checks.map((entry) => entry.checkId)).toEqual(
      NHM2_DYNAMIC_BACKREACTION_STABILITY_CAUSALITY_CHECK_IDS,
    );
    expect(result.checks.every((entry) => entry.pass)).toBe(true);
    expect(result.blockers).toEqual([]);
    expect(isNhm2DynamicBackreactionStabilityCausality(result)).toBe(true);
  });

  it("rejects two-sample and infinitesimal normalized-time evolutions", () => {
    const input = validInput();
    input.evolution!.samples = input.evolution!.samples!.slice(0, 2);
    input.evolution!.dtS = 1e-12;
    input.evolution!.durationS = 1e-12;
    input.evolution!.samples![1]!.timeS = 1e-12;
    input.evolution!.horizonNormalization!.switchingPeriodS = 1e-6;
    input.evolution!.horizonNormalization!.lightCrossingTimeS = 1e-6;
    input.evolution!.horizonNormalization!.controlCyclePeriodS = 1e-6;
    const result = buildNhm2DynamicBackreactionStabilityCausality(input);

    expect(result.status).toBe("fail");
    expect(result.blockers).toContain(
      "dynamics_sample_count_meets_frozen_minimum:evolution_sample_count_below_frozen_minimum",
    );
    expect(result.blockers).toContain(
      "normalized_positive_time_horizon_meets_frozen_minimum:switching_period_horizon_below_frozen_minimum",
    );
    expect(result.blockers).toContain(
      "normalized_positive_time_horizon_meets_frozen_minimum:light_crossing_time_horizon_below_frozen_minimum",
    );
    expect(result.blockers).toContain(
      "normalized_positive_time_horizon_meets_frozen_minimum:control_cycle_period_horizon_below_frozen_minimum",
    );
  });

  it("derives every required dynamics, stability, and causality check", () => {
    const cases: Array<{
      checkId: Nhm2DynamicBackreactionCheckId;
      blocker: string;
      mutate: (
        input: BuildNhm2DynamicBackreactionStabilityCausalityInput,
      ) => void;
    }> = [
      {
        checkId: "candidate_initial_data_and_source_coupled",
        blocker: "source_not_returned_to_evolution",
        mutate: (input) => {
          if (input.initialCoupling)
            input.initialCoupling.sourceReturnedToEvolution = false;
        },
      },
      {
        checkId: "positive_timestep_duration_and_multiple_samples",
        blocker: "timestep_not_positive",
        mutate: (input) => {
          if (input.evolution) input.evolution.dtS = 0;
        },
      },
      {
        checkId: "dynamics_sample_count_meets_frozen_minimum",
        blocker: "evolution_sample_count_below_frozen_minimum",
        mutate: (input) => {
          if (input.evolution)
            input.evolution.samples = input.evolution.samples?.slice(0, 2);
        },
      },
      {
        checkId: "normalized_positive_time_horizon_meets_frozen_minimum",
        blocker: "switching_period_horizon_below_frozen_minimum",
        mutate: (input) => {
          if (input.evolution?.horizonNormalization)
            input.evolution.horizonNormalization.switchingPeriodS = 10;
        },
      },
      {
        checkId: "dynamic_nontriviality_verified",
        blocker: "coupled_source_evolution_is_trivial",
        mutate: (input) => {
          for (const sample of input.evolution?.samples ?? []) {
            sample.metricDeltaL2 = 0;
            sample.sourceDeltaL2 = 0;
          }
        },
      },
      {
        checkId: "bssn_constraints_propagate_within_tolerance",
        blocker: "bssn_hamiltonian_exceeds_tolerance",
        mutate: (input) => {
          const constraint = input.bssnConstraints?.constraints?.[0];
          if (constraint) constraint.maxAbs = 1;
        },
      },
      {
        checkId: "resolution_boundary_and_frequency_convergence_observed",
        blocker: "frequency_convergence_not_monotonically_convergent",
        mutate: (input) => {
          const study = input.convergence?.studies?.find(
            (entry) => entry?.axis === "frequency",
          );
          const point = study?.points?.[1];
          if (point) point.residualRelative = 0.08;
        },
      },
      {
        checkId: "semiclassical_backreaction_residual_bounded",
        blocker: "backreaction_residual_exceeds_tolerance",
        mutate: (input) => {
          if (input.semiclassicalBackreaction)
            input.semiclassicalBackreaction.residualRelativeLInf = 1;
        },
      },
      {
        checkId: "horizon_and_characteristic_screen_pass",
        blocker: "horizon_expansion_screen_failed",
        mutate: (input) => {
          if (input.horizonCharacteristicScreen)
            input.horizonCharacteristicScreen.minimumOutgoingExpansion = 0.01;
        },
      },
      {
        checkId: "ray_blueshift_and_particle_accumulation_bounded",
        blocker: "blueshift_exceeds_frozen_maximum",
        mutate: (input) => {
          if (input.rayParticleScreen)
            input.rayParticleScreen.maximumBlueshiftGain = 2;
        },
      },
      {
        checkId: "perturbation_growth_spectrum_bounded",
        blocker: "mode_0_growth_rate_exceeds_maximum",
        mutate: (input) => {
          const mode = input.perturbationSpectrum?.modes?.[0];
          if (mode) mode.growthRatePerS = 0.1;
        },
      },
      {
        checkId: "global_hyperbolicity_ctc_and_geodesic_screen_pass",
        blocker: "ctc_candidates_detected",
        mutate: (input) => {
          if (input.globalCausalityScreen)
            input.globalCausalityScreen.ctcCandidateCount = 1;
        },
      },
      {
        checkId: "parameter_neighborhood_robustness_pass",
        blocker: "parameter_neighborhood_pass_fraction_too_low",
        mutate: (input) => {
          const sample = input.parameterNeighborhood?.samples?.[0];
          if (sample) sample.minimumGateMargin = 0;
        },
      },
    ];

    for (const testCase of cases) {
      const input = validInput();
      testCase.mutate(input);
      const result = buildNhm2DynamicBackreactionStabilityCausality(input);
      const selected = check(result, testCase.checkId);
      expect(selected?.status, testCase.checkId).toBe("fail");
      expect(selected?.blockers, testCase.checkId).toContain(testCase.blocker);
      expect(
        result.dynamicBackreactionStabilityCausalityReady,
        testCase.checkId,
      ).toBe(false);
    }
  });

  it("rejects pre-run binding drift and unchanged source/geometry state hashes", () => {
    const input = validInput();
    if (input.provenance?.inputManifest)
      input.provenance.inputManifest.sha256 = hash("9");
    const final = input.evolution?.samples?.at(-1);
    const first = input.evolution?.samples?.[0];
    if (final?.geometryState && first?.geometryState)
      final.geometryState.sha256 = first.geometryState.sha256;
    if (final?.sourceTensor && first?.sourceTensor)
      final.sourceTensor.sha256 = first.sourceTensor.sha256;
    const result = buildNhm2DynamicBackreactionStabilityCausality(input);

    expect(result.status).toBe("fail");
    expect(result.blockers).toContain(
      "dynamic_nontriviality_verified:pre_run_manifest_provenance_mismatch",
    );
    expect(result.blockers).toContain(
      "dynamic_nontriviality_verified:geometry_state_hash_unchanged",
    );
    expect(result.blockers).toContain(
      "dynamic_nontriviality_verified:source_tensor_hash_unchanged",
    );
  });

  it("omits cyclic forward hashes and rejects them as shadow fields", () => {
    const ready = buildNhm2DynamicBackreactionStabilityCausality(validInput());
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

    expect(isNhm2DynamicBackreactionStabilityCausality(shadow)).toBe(false);
  });

  it("rejects derived-field forgery, unknown fields, and physical promotion", () => {
    const ready = buildNhm2DynamicBackreactionStabilityCausality(validInput());
    const forged = structuredClone(ready) as unknown as Record<string, unknown>;
    forged.dynamicBackreactionStabilityCausalityReady = false;
    const extra = structuredClone(ready) as unknown as Record<string, unknown>;
    extra.staticDiagnosticPromotion = true;
    const promoted = structuredClone(ready) as unknown as {
      claimBoundary: { propulsion: boolean };
    };
    promoted.claimBoundary.propulsion = true;

    expect(isNhm2DynamicBackreactionStabilityCausality(forged)).toBe(false);
    expect(isNhm2DynamicBackreactionStabilityCausality(extra)).toBe(false);
    expect(isNhm2DynamicBackreactionStabilityCausality(promoted)).toBe(false);
  });
});
