import { describe, expect, it } from "vitest";

import {
  NHM2_SEMICLASSICAL_TENSOR_COMPONENTS,
  NHM2_SEMICLASSICAL_UNCERTAINTY_QUANTITIES,
  buildNhm2SemiclassicalStateRealizability,
  isNhm2SemiclassicalStateRealizability,
  type BuildNhm2SemiclassicalStateRealizabilityInput,
  type Nhm2SemiclassicalRealizabilityGateId,
} from "../shared/contracts/nhm2-semiclassical-state-realizability.v1";

const hash = (digit: string): string => `sha256:${digit.repeat(64)}`;
const artifact = (ref: string, digit = "a") => ({ ref, sha256: hash(digit) });
const numericalArtifact = (input: {
  ref: string;
  digit?: string;
  shape: number[];
  componentOrder: string[];
  unit: string;
}) => ({
  ...artifact(input.ref, input.digit ?? "a"),
  dtype: "float64" as const,
  binaryEncoding: "raw_ieee754" as const,
  endianness: "little" as const,
  shape: input.shape,
  sizeBytes: input.shape.reduce((product, extent) => product * extent, 8),
  storageOrder: "row-major" as const,
  componentOrder: input.componentOrder,
  unit: input.unit,
});

const validInput = (): BuildNhm2SemiclassicalStateRealizabilityInput => {
  const stateHash = hash("a");
  const tensor = numericalArtifact({
    ref: "run/t-renormalized.f64",
    digit: "b",
    shape: [64, NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length],
    componentOrder: [...NHM2_SEMICLASSICAL_TENSOR_COMPONENTS],
    unit: "J/m^3",
  });
  const worldlineHash = hash("c");
  return {
    generatedAt: "2026-07-19T12:01:00.000Z",
    laneId: "nhm2_shift_lapse",
    selectedProfileId: "stage1_centerline_alpha_0p7000_v1",
    runId: "semiclassical-state-test",
    fieldState: {
      fieldModelId: "free_scalar_curved_spacetime",
      fieldModelClass: "real_scalar_qft",
      stateId: "state:alpha07:hadamard",
      stateSha256: stateHash,
      stateArtifact: {
        ...numericalArtifact({
          ref: "run/state.f64",
          shape: [64, 2],
          componentOrder: ["real", "imaginary"],
          unit: "field_mode",
        }),
        sha256: stateHash,
      },
      lagrangian: artifact("run/lagrangian.json"),
      equationsOfMotion: artifact("run/field-equations.json"),
      stateConstruction: artifact("run/state-construction.json", "d"),
      backgroundGeometry: artifact("run/background-geometry.json"),
      fieldEquationResidualLInf: 1e-8,
      fieldEquationToleranceLInf: 1e-6,
      sampleCount: 64,
    },
    admissibility: {
      stateId: "state:alpha07:hadamard",
      stateSha256: stateHash,
      criterion: "hadamard",
      analysis: artifact("run/hadamard-analysis.json"),
      twoPointFunction: numericalArtifact({
        ref: "run/two-point-function.f64",
        shape: [64, 64, 2],
        componentOrder: ["real", "imaginary"],
        unit: "field^2",
      }),
      criterionSatisfied: true,
    },
    renormalization: {
      stateId: "state:alpha07:hadamard",
      stateSha256: stateHash,
      scheme: "hadamard_subtraction",
      prescription: artifact("run/renormalization-prescription.json"),
      counterterms: artifact("run/counterterms.json"),
      finiteRenormalization: artifact("run/finite-renormalization.json"),
      countertermsFixed: true,
      finiteFreedomResolved: true,
    },
    stressTensor: {
      stateId: "state:alpha07:hadamard",
      stateSha256: stateHash,
      tensor,
      chartId: "comoving_cartesian",
      basis: "chart_covariant_symmetric",
      unit: "J/m^3",
      symmetryVerified: true,
      components: NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.map((component) => ({
        component,
        evidence: numericalArtifact({
          ref: `run/t-renormalized-${component}.f64`,
          digit: "b",
          shape: [64],
          componentOrder: [component],
          unit: "J/m^3",
        }),
        sampleCount: 64,
        renormalized: true,
        finite: true,
      })),
    },
    wardIdentity: {
      stateId: "state:alpha07:hadamard",
      stateSha256: stateHash,
      evidence: artifact("run/ward-identity.json"),
      divergenceSamples: numericalArtifact({
        ref: "run/ward-divergence.f64",
        shape: [64, 4],
        componentOrder: [
          "nabla_mu_T_mu0",
          "nabla_mu_T_mu1",
          "nabla_mu_T_mu2",
          "nabla_mu_T_mu3",
        ],
        unit: "J/m^4",
      }),
      sampleCount: 64,
      covariantDerivativeDefined: true,
      divergenceResidualLInf: 0.01,
      toleranceLInf: 0.1,
    },
    qeiBinding: {
      stateId: "state:alpha07:hadamard",
      stateSha256: stateHash,
      dossier: artifact("run/qei-worldline-dossier.json"),
      boundReceipt: artifact("run/qei-bound-receipt.json"),
      worldlineSet: artifact("run/qei-worldlines.json", "c"),
      sampledWorldlineSetSha256: worldlineHash,
      boundWorldlineSetSha256: worldlineHash,
      worldlineCount: 24,
      allWorldlinesEvaluated: true,
      minimumMarginSI: 0.2,
      marginAbsoluteUncertaintySI: 0.01,
    },
    preparationSwitching: {
      stateId: "state:alpha07:hadamard",
      stateSha256: stateHash,
      protocol: artifact("run/preparation-protocol.json"),
      switchingFunction: artifact("run/switching-function.json"),
      dynamicSolution: numericalArtifact({
        ref: "run/preparation-dynamic-solution.f64",
        shape: [64, 2],
        componentOrder: ["field", "conjugate_momentum"],
        unit: "mixed_si",
      }),
      smoothness: "C_infinity",
      compatibleWithStateConstruction: true,
      boundaryConditionsSatisfied: true,
      fieldEquationResidualLInf: 0.01,
      fieldEquationToleranceLInf: 0.1,
      conservationResidualLInf: 0.01,
      conservationToleranceLInf: 0.1,
    },
    uncertaintyBudget: {
      budget: artifact("run/uncertainty-budget.json"),
      bounds: NHM2_SEMICLASSICAL_UNCERTAINTY_QUANTITIES.map((quantity) => ({
        quantity,
        unit:
          quantity === "qei_margin" || quantity === "renormalized_stress_tensor"
            ? "J/m^3"
            : "1",
        estimateSI: 0.5,
        intervalLowerSI: 0.4,
        intervalUpperSI: 0.6,
        acceptanceLowerSI: 0,
        acceptanceUpperSI: 1,
        confidenceLevel: 0.95,
        method: artifact(`run/uncertainty-${quantity}.json`),
        rawSamples: numericalArtifact({
          ref: `run/uncertainty-${quantity}.f64`,
          shape: [64],
          componentOrder: [quantity],
          unit:
            quantity === "qei_margin" ||
            quantity === "renormalized_stress_tensor"
              ? "J/m^3"
              : "1",
        }),
        normalizationScaleSI: 1,
      })),
    },
    backreaction: {
      stateId: "state:alpha07:hadamard",
      stateSha256: stateHash,
      evidence: artifact("run/semiclassical-backreaction.json"),
      geometry: numericalArtifact({
        ref: "run/backreacted-geometry.f64",
        shape: [64, 10],
        componentOrder: [
          "g00",
          "g01",
          "g02",
          "g03",
          "g11",
          "g12",
          "g13",
          "g22",
          "g23",
          "g33",
        ],
        unit: "1",
      }),
      sourceTensor: tensor,
      sampleCount: 64,
      selfConsistentIterations: 8,
      converged: true,
      einsteinResidualLInf: 0.01,
      einsteinToleranceLInf: 0.1,
      constraintResidualLInf: 0.005,
      constraintToleranceLInf: 0.1,
    },
    provenance: {
      producer: "tools/nhm2/build-semiclassical-state-realizability.ts",
      producerVersion: "1.0.0",
      implementationId: "nhm2-semiclassical-primary-v1",
      solverId: "nhm2-semiclassical-state-solver",
      solverVersion: "1.0.0",
      gitSha: "abcdef1234567890abcdef1234567890abcdef12",
      solver: artifact("run/solver-manifest.json"),
      environment: artifact("run/environment-lock.json"),
      invocation: artifact("run/invocation.json"),
      inputManifest: artifact("run/input-manifest.json"),
      command: "node",
      argv: [
        "nhm2-semiclassical-solver.mjs",
        "--candidate-manifest",
        "candidate.json",
      ],
      workingDirectory: ".",
      outputDirectory: "run/semiclassical-state-test",
      requestId: "semiclassical-request-test",
      runId: "semiclassical-state-test",
      receiptId: "semiclassical-receipt-test",
      runtimeId: "nhm2.experiment_ready_theory.primary",
      deterministicSeed: "semiclassical-seed-test",
      startedAt: "2026-07-19T12:00:00.000Z",
      completedAt: "2026-07-19T12:01:00.000Z",
      runSpecificOutput: true,
    },
  };
};

const gate = (
  artifactValue: ReturnType<typeof buildNhm2SemiclassicalStateRealizability>,
  gateId: Nhm2SemiclassicalRealizabilityGateId,
) => artifactValue.gates.find((entry) => entry.gateId === gateId);

describe("nhm2_semiclassical_state_realizability/v1", () => {
  it("blocks an empty artifact and keeps all operational claims false", () => {
    const result = buildNhm2SemiclassicalStateRealizability();

    expect(result.status).toBe("blocked");
    expect(result.semiclassicalStateRealizabilityReady).toBe(false);
    expect(result.gates.every((entry) => entry.status === "blocked")).toBe(
      true,
    );
    expect(result.blockers).toContain(
      "renormalized_stress_tensor:renormalized_stress_tensor_components_missing",
    );
    expect(result.claimBoundary).toEqual({
      diagnosticOnly: true,
      physicalViability: false,
      transport: false,
      propulsion: false,
      routeEta: false,
      certifiedSpeed: false,
    });
    expect(isNhm2SemiclassicalStateRealizability(result)).toBe(true);
  });

  it("passes only when every primitive evidence gate is explicitly closed", () => {
    const result = buildNhm2SemiclassicalStateRealizability(validInput());

    expect(result.status).toBe("pass");
    expect(result.semiclassicalStateRealizabilityReady).toBe(true);
    expect(result.gates).toHaveLength(10);
    expect(result.gates.every((entry) => entry.status === "pass")).toBe(true);
    expect(result.blockers).toEqual([]);
    expect(
      result.stressTensor.components.map((entry) => entry.component),
    ).toEqual(NHM2_SEMICLASSICAL_TENSOR_COMPONENTS);
    expect(result.uncertaintyBudget.maximumRelativeHalfWidth95).toBeCloseTo(
      0.1,
    );
    expect(isNhm2SemiclassicalStateRealizability(result)).toBe(true);
  });

  it("ignores caller-supplied aggregate pass fields", () => {
    const result = buildNhm2SemiclassicalStateRealizability({
      status: "pass",
      semiclassicalStateRealizabilityReady: true,
      gates: [],
      blockers: [],
      claimBoundary: {
        diagnosticOnly: false,
        physicalViability: true,
        transport: true,
        propulsion: true,
        routeEta: true,
        certifiedSpeed: true,
      },
    } as unknown as BuildNhm2SemiclassicalStateRealizabilityInput);

    expect(result.status).toBe("blocked");
    expect(result.semiclassicalStateRealizabilityReady).toBe(false);
    expect(result.claimBoundary.physicalViability).toBe(false);
  });

  it("blocks a tensor ledger that omits any of the ten symmetric components", () => {
    const input = validInput();
    input.stressTensor?.components?.pop();
    const result = buildNhm2SemiclassicalStateRealizability(input);

    expect(gate(result, "renormalized_stress_tensor")?.status).toBe("blocked");
    expect(gate(result, "renormalized_stress_tensor")?.blockers).toContain(
      "stress_tensor_T33_missing",
    );
    expect(result.semiclassicalStateRealizabilityReady).toBe(false);
  });

  it("requires an equivalence theorem when admissibility uses an equivalent criterion", () => {
    const input = validInput();
    if (input.admissibility) input.admissibility.criterion = "equivalent";
    const result = buildNhm2SemiclassicalStateRealizability(input);

    expect(gate(result, "state_admissibility")?.status).toBe("blocked");
    expect(gate(result, "state_admissibility")?.blockers).toContain(
      "state_admissibility_equivalence_theorem_ref_missing",
    );
  });

  it("derives failures independently for every falsifiable evidence family", () => {
    const cases: Array<{
      gateId: Nhm2SemiclassicalRealizabilityGateId;
      blocker: string;
      mutate: (input: BuildNhm2SemiclassicalStateRealizabilityInput) => void;
    }> = [
      {
        gateId: "field_state_construction",
        blocker: "field_equation_residual_exceeds_tolerance",
        mutate: (input) => {
          if (input.fieldState) input.fieldState.fieldEquationResidualLInf = 2;
        },
      },
      {
        gateId: "state_admissibility",
        blocker: "state_admissibility_criterion_failed",
        mutate: (input) => {
          if (input.admissibility)
            input.admissibility.criterionSatisfied = false;
        },
      },
      {
        gateId: "renormalization_counterterms",
        blocker: "renormalization_counterterms_fixed_failed",
        mutate: (input) => {
          if (input.renormalization)
            input.renormalization.countertermsFixed = false;
        },
      },
      {
        gateId: "renormalized_stress_tensor",
        blocker: "stress_tensor_component_0_renormalized_failed",
        mutate: (input) => {
          const component = input.stressTensor?.components?.[0];
          if (component) component.renormalized = false;
        },
      },
      {
        gateId: "ward_identity_conservation",
        blocker: "ward_identity_divergence_residual_exceeds_tolerance",
        mutate: (input) => {
          if (input.wardIdentity) input.wardIdentity.divergenceResidualLInf = 1;
        },
      },
      {
        gateId: "qei_same_state_worldline_binding",
        blocker: "qei_uncertainty_adjusted_margin_negative",
        mutate: (input) => {
          if (input.qeiBinding)
            input.qeiBinding.marginAbsoluteUncertaintySI = 0.3;
        },
      },
      {
        gateId: "preparation_switching_compatibility",
        blocker: "preparation_state_construction_compatibility_failed",
        mutate: (input) => {
          if (input.preparationSwitching) {
            input.preparationSwitching.compatibleWithStateConstruction = false;
          }
        },
      },
      {
        gateId: "uncertainty_bounds",
        blocker: "uncertainty_bound_0_interval_outside_acceptance",
        mutate: (input) => {
          const bound = input.uncertaintyBudget?.bounds?.[0];
          if (bound) bound.intervalUpperSI = 2;
        },
      },
      {
        gateId: "semiclassical_backreaction_consistency",
        blocker: "backreaction_convergence_failed",
        mutate: (input) => {
          if (input.backreaction) input.backreaction.converged = false;
        },
      },
      {
        gateId: "provenance_integrity",
        blocker: "generated_at_invalid",
        mutate: (input) => {
          input.generatedAt = "not-an-iso-timestamp";
        },
      },
    ];

    for (const testCase of cases) {
      const input = validInput();
      testCase.mutate(input);
      const result = buildNhm2SemiclassicalStateRealizability(input);
      const selectedGate = gate(result, testCase.gateId);
      expect(selectedGate?.status, testCase.gateId).toBe("fail");
      expect(selectedGate?.blockers, testCase.gateId).toContain(
        testCase.blocker,
      );
      expect(result.status, testCase.gateId).toBe("fail");
      expect(result.semiclassicalStateRealizabilityReady, testCase.gateId).toBe(
        false,
      );
    }
  });

  it("fails closed on malformed raw tensor metadata and degenerate coverage", () => {
    const wrongBytes = validInput();
    if (wrongBytes.stressTensor?.tensor) {
      wrongBytes.stressTensor.tensor.sizeBytes = 8;
    }
    const wrongBytesResult =
      buildNhm2SemiclassicalStateRealizability(wrongBytes);
    expect(
      gate(wrongBytesResult, "renormalized_stress_tensor")?.blockers,
    ).toContain("renormalized_stress_tensor_size_bytes_shape_mismatch");

    const onePoint = validInput();
    if (onePoint.fieldState) {
      onePoint.fieldState.sampleCount = 1;
      if (onePoint.fieldState.stateArtifact) {
        onePoint.fieldState.stateArtifact.shape = [1, 2];
        onePoint.fieldState.stateArtifact.sizeBytes = 16;
      }
    }
    const onePointResult = buildNhm2SemiclassicalStateRealizability(onePoint);
    expect(gate(onePointResult, "field_state_construction")?.blockers).toEqual(
      expect.arrayContaining([
        "field_state_sample_count_below_minimum",
        "field_state_artifact_first_axis_below_minimum",
      ]),
    );
    expect(onePointResult.semiclassicalStateRealizabilityReady).toBe(false);
  });

  it("requires nonvacuous QEI and backreaction coverage", () => {
    const input = validInput();
    if (input.qeiBinding) input.qeiBinding.worldlineCount = 1;
    if (input.backreaction) input.backreaction.selfConsistentIterations = 1;
    const result = buildNhm2SemiclassicalStateRealizability(input);

    expect(
      gate(result, "qei_same_state_worldline_binding")?.blockers,
    ).toContain("qei_worldline_count_below_minimum");
    expect(
      gate(result, "semiclassical_backreaction_consistency")?.blockers,
    ).toContain("backreaction_self_consistent_iterations_below_minimum");
    expect(result.status).toBe("fail");
  });

  it("does not improve uncertainty width by widening acceptance ranges", () => {
    const input = validInput();
    for (const bound of input.uncertaintyBudget?.bounds ?? []) {
      bound.acceptanceLowerSI = -1e12;
      bound.acceptanceUpperSI = 1e12;
    }
    const result = buildNhm2SemiclassicalStateRealizability(input);

    expect(result.uncertaintyBudget.maximumRelativeHalfWidth95).toBeCloseTo(
      0.1,
    );
    expect(gate(result, "uncertainty_bounds")?.status).toBe("pass");
  });

  it("requires exact run-bound solver and execution provenance", () => {
    const input = validInput();
    if (input.provenance) {
      input.provenance.solverId = null;
      input.provenance.runId = "another-run";
    }
    const result = buildNhm2SemiclassicalStateRealizability(input);

    expect(gate(result, "provenance_integrity")?.blockers).toEqual(
      expect.arrayContaining([
        "solver_id_missing",
        "provenance_run_id_mismatch",
      ]),
    );
    expect(result.semiclassicalStateRealizabilityReady).toBe(false);
  });

  it("rejects artifacts whose derived readiness or immutable claim boundary is forged", () => {
    const ready = buildNhm2SemiclassicalStateRealizability(validInput());
    const forgedReadiness = structuredClone(ready) as unknown as Record<
      string,
      unknown
    >;
    forgedReadiness.semiclassicalStateRealizabilityReady = false;
    const forgedClaims = structuredClone(ready) as unknown as {
      claimBoundary: { physicalViability: boolean };
    };
    forgedClaims.claimBoundary.physicalViability = true;

    expect(isNhm2SemiclassicalStateRealizability(forgedReadiness)).toBe(false);
    expect(isNhm2SemiclassicalStateRealizability(forgedClaims)).toBe(false);
  });

  it("keeps post-run receipt and output-manifest hashes out of raw evidence", () => {
    const ready = buildNhm2SemiclassicalStateRealizability(validInput());

    expect(ready.provenance.outputDirectory).toBe(
      "run/semiclassical-state-test",
    );
    expect(ready.provenance).not.toHaveProperty("outputManifest");

    const forged = structuredClone(ready) as unknown as {
      provenance: Record<string, unknown>;
    };
    forged.provenance.outputManifest = {
      ref: "run/output-manifest.json",
      sha256: hash("f"),
    };
    forged.provenance.receiptSha256 = "f".repeat(64);
    expect(isNhm2SemiclassicalStateRealizability(forged)).toBe(false);
  });
});
