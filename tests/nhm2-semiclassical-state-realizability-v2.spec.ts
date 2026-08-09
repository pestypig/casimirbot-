import { describe, expect, it } from "vitest";

import {
  NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS,
  NHM2_SEMICLASSICAL_CONSTRAINT_COMPONENT_ORDER,
  NHM2_SEMICLASSICAL_CONSTRAINT_NORMALIZATION_SCALE_UNIT,
  NHM2_SEMICLASSICAL_FLUCTUATION_RATIO_FORMULA,
  NHM2_SEMICLASSICAL_MEAN_NORMALIZATION_METHOD,
  NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER,
  NHM2_SEMICLASSICAL_NOISE_KERNEL_EXCHANGE_SYMMETRY,
  NHM2_SEMICLASSICAL_STATE_REALIZABILITY_V2_CONTRACT_VERSION,
  buildNhm2SemiclassicalStateRealizabilityV2,
  isNhm2SemiclassicalStateRealizabilityV2,
  type BuildNhm2SemiclassicalStateRealizabilityV2Input,
  type Nhm2SemiclassicalStateRealizabilityV2GateId,
} from "../shared/contracts/nhm2-semiclassical-state-realizability.v2";

const sha = (index: number): string =>
  `sha256:${index.toString(16).padStart(64, "0")}`;

const artifact = (name: string, index: number) => ({
  ref: `run/${name}`,
  sha256: sha(index),
});

const array = (
  name: string,
  index: number,
  componentOrder: readonly string[],
  unit: string,
  sampleCount = 64,
) => ({
  ...artifact(`${name}.f64`, index),
  dtype: "float64" as const,
  binaryEncoding: "raw_ieee754" as const,
  endianness: "little" as const,
  shape: [sampleCount, componentOrder.length],
  sizeBytes: sampleCount * componentOrder.length * 8,
  storageOrder: "row-major" as const,
  componentOrder: [...componentOrder],
  unit,
});

const bilocalArray = (
  name: string,
  index: number,
  componentOrder: readonly string[],
  unit: string,
  sampleCount = 64,
) => ({
  ...artifact(`${name}.f64`, index),
  dtype: "float64" as const,
  binaryEncoding: "raw_ieee754" as const,
  endianness: "little" as const,
  shape: [sampleCount, sampleCount, componentOrder.length],
  sizeBytes: sampleCount * sampleCount * componentOrder.length * 8,
  storageOrder: "row-major" as const,
  componentOrder: [...componentOrder],
  unit,
});

const validInput = (): BuildNhm2SemiclassicalStateRealizabilityV2Input => {
  const stateId = "state:alpha07:hadamard:v2-test";
  const stateSha256 = sha(1);
  const prescription = artifact("renormalization-prescription.json", 2);
  const counterterms = artifact("renormalization-counterterms.json", 30);
  const finiteRenormalization = artifact("finite-renormalization.json", 31);
  const meanStressTensor = array(
    "renormalized-mean-stress-tensor",
    32,
    ["T00", "T01", "T02", "T03", "T11", "T12", "T13", "T22", "T23", "T33"],
    "J/m^3",
  );
  const bracketResiduals = NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS.map(
    (bracketId, index) => ({
      bracketId,
      computedBracket: array(
        `${bracketId}-computed`,
        20 + index * 3,
        NHM2_SEMICLASSICAL_CONSTRAINT_COMPONENT_ORDER,
        "dimensionless",
      ),
      classicalStructureFunctionTarget: array(
        `${bracketId}-target`,
        21 + index * 3,
        NHM2_SEMICLASSICAL_CONSTRAINT_COMPONENT_ORDER,
        "dimensionless",
      ),
      residual: array(
        `${bracketId}-residual`,
        22 + index * 3,
        NHM2_SEMICLASSICAL_CONSTRAINT_COMPONENT_ORDER,
        "dimensionless",
      ),
      normalizationDefinition: artifact(
        `${bracketId}-normalization-definition.json`,
        40 + index * 2,
      ),
      normalizationMethodId: "frozen_positive_scale_nondimensionalization_v1",
      normalizationMethod: artifact(
        `${bracketId}-normalization-method.json`,
        41 + index * 2,
      ),
      normalizationScaleSI: 1,
      normalizationScaleUnit:
        NHM2_SEMICLASSICAL_CONSTRAINT_NORMALIZATION_SCALE_UNIT,
      sampleCount: 64,
      allSamplesFinite: true,
      residualLInf: 0.01 + index * 0.001,
      absoluteUncertainty95: 0.005,
      tolerance: 0.1,
    }),
  );
  return {
    fieldState: { stateId, stateSha256 },
    renormalization: {
      stateId,
      stateSha256,
      scheme: "hadamard_subtraction",
      prescription,
      counterterms,
      finiteRenormalization,
    },
    stressTensor: { tensor: meanStressTensor },
    stressFluctuations: {
      stateId,
      stateSha256,
      renormalizationScheme: "hadamard_subtraction",
      renormalizationPrescription: prescription,
      renormalizationCounterterms: counterterms,
      finiteRenormalization,
      sourceKind: "connected_symmetrized_stress_noise_kernel",
      operatorOrdering: "symmetrized_anticommutator",
      connected: true,
      symmetrized: true,
      smeared: true,
      smearingFunction: artifact("noise-smearing-function.json", 3),
      samplingBasisId: "frozen-bilocal-sampling-basis-v1",
      samplingBasis: artifact("noise-sampling-basis.json", 33),
      samplingBasisFrozenBeforeExecution: true,
      samplingWindow: {
        definition: artifact("noise-sampling-window.json", 4),
        shape: "smooth_compact_support",
        spatialSupportRadiusM: 0.01,
        temporalSupportSeconds: 1e-9,
      },
      noiseKernel: bilocalArray(
        "connected-noise-kernel",
        5,
        NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER,
        "(J/m^3)^2",
      ),
      sampleCount: 64,
      allSamplesFinite: true,
      psdAnalysis: artifact("noise-kernel-psd.json", 6),
      covariancePositiveSemidefinite: true,
      minimumEigenvalueSI: -1e-12,
      psdToleranceSI: 1e-10,
      pointComponentExchangeSymmetry:
        NHM2_SEMICLASSICAL_NOISE_KERNEL_EXCHANGE_SYMMETRY,
      pointComponentExchangeSymmetryVerified: true,
      pointComponentExchangeSymmetryEvidence: artifact(
        "noise-kernel-exchange-symmetry.json",
        34,
      ),
      pointComponentExchangeResidualUpper95: 1e-12,
      pointComponentExchangeTolerance: 1e-10,
      semiclassicalityCriterion: artifact(
        "semiclassicality-criterion.json",
        16,
      ),
      meanStressTensor,
      fluctuationRatioFormula: NHM2_SEMICLASSICAL_FLUCTUATION_RATIO_FORMULA,
      meanNormalizationMethodId: NHM2_SEMICLASSICAL_MEAN_NORMALIZATION_METHOD,
      meanNormalizationScaleSI: 1,
      meanNormalizationFloorSI: 1e-12,
      fluctuationToMeanRatioUpper95: 0.2,
      fluctuationToMeanRatioTolerance: 0.25,
      uncertaintyBudget: artifact("noise-kernel-uncertainty.json", 7),
      metricResponseEvidence: artifact("einstein-langevin-response.json", 8),
      stabilityEvidence: artifact("stochastic-stability.json", 9),
      proxySubstitutionUsed: false,
      booleanOnlyAssertion: false,
    },
    constraintConsistency: {
      stateId,
      stateSha256,
      renormalizationScheme: "hadamard_subtraction",
      renormalizationPrescription: prescription,
      renormalizationCounterterms: counterterms,
      finiteRenormalization,
      formulationId: "canonical_semiclassical_adm_v1",
      formulation: artifact("constraint-formulation.json", 10),
      regulatorId: "covariant_point_split_v1",
      regulator: artifact("constraint-regulator.json", 11),
      operatorOrderingId: "symmetric_constraint_ordering_v1",
      operatorOrdering: artifact("constraint-operator-ordering.json", 12),
      constraintsSmeared: true,
      smearingFunctions: artifact("constraint-smearing-functions.json", 13),
      bracketResiduals,
      classicalStructureFunctionsIncluded: true,
      anomalyDisposition: "no_anomaly_within_frozen_tolerance",
      anomalyEvidence: artifact("constraint-anomaly-audit.json", 14),
      countertermEvidence: { ref: null, sha256: null },
      refinementLevelCount: 3,
      regulatorRemovalConverged: true,
      observedRegulatorRemovalConvergenceOrder: 2,
      regulatorRemovalConvergenceEvidence: artifact(
        "constraint-regulator-removal-convergence.json",
        35,
      ),
      antisymmetryResidual: {
        definition: artifact("constraint-antisymmetry-definition.json", 36),
        residual: array(
          "constraint-antisymmetry-residual",
          37,
          NHM2_SEMICLASSICAL_CONSTRAINT_COMPONENT_ORDER,
          "dimensionless",
        ),
        sampleCount: 64,
        allSamplesFinite: true,
        residualLInf: 0.003,
        absoluteUncertainty95: 0.002,
        tolerance: 0.1,
      },
      jacobiIdentityResidual: {
        definition: artifact("constraint-jacobi-definition.json", 38),
        residual: array(
          "constraint-jacobi-residual",
          39,
          NHM2_SEMICLASSICAL_CONSTRAINT_COMPONENT_ORDER,
          "dimensionless",
        ),
        sampleCount: 64,
        allSamplesFinite: true,
        residualLInf: 0.004,
        absoluteUncertainty95: 0.002,
        tolerance: 0.1,
      },
      maximumAlgebraResidualUpper95: 0.017,
      algebraTolerance: 0.1,
      uncertaintyBudget: artifact("constraint-uncertainty.json", 15),
      targetEchoUsedAsComputedBracket: false,
      proxySubstitutionUsed: false,
      booleanOnlyAssertion: false,
    },
  };
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const gate = (
  artifactValue: ReturnType<typeof buildNhm2SemiclassicalStateRealizabilityV2>,
  gateId: Nhm2SemiclassicalStateRealizabilityV2GateId,
) => artifactValue.gates.find((entry) => entry.gateId === gateId);

describe("nhm2_semiclassical_state_realizability/v2", () => {
  it("keeps an empty v2 artifact blocked rather than falsified", () => {
    const result = buildNhm2SemiclassicalStateRealizabilityV2();

    expect(result.status).toBe("blocked");
    expect(gate(result, "stress_fluctuation_noise_kernel")?.status).toBe(
      "blocked",
    );
    expect(gate(result, "constraint_formulation_consistency")?.status).toBe(
      "blocked",
    );
    expect(isNhm2SemiclassicalStateRealizabilityV2(result)).toBe(true);
  });

  it("retains the v1 gates and passes both new primitive-evidence gates", () => {
    const result = buildNhm2SemiclassicalStateRealizabilityV2(validInput());

    expect(result.contractVersion).toBe(
      NHM2_SEMICLASSICAL_STATE_REALIZABILITY_V2_CONTRACT_VERSION,
    );
    expect(gate(result, "stress_fluctuation_noise_kernel")?.status).toBe(
      "pass",
    );
    expect(gate(result, "constraint_formulation_consistency")?.status).toBe(
      "pass",
    );
    expect(gate(result, "field_state_construction")).toBeDefined();
    expect(result.status).toBe("blocked");
    expect(result.claimBoundary.physicalViability).toBe(false);
    expect(result.claimBoundary.transport).toBe(false);
    expect(isNhm2SemiclassicalStateRealizabilityV2(result)).toBe(true);
  });

  it("blocks absent fluctuation and constraint arrays instead of accepting booleans", () => {
    const input = validInput();
    input.stressFluctuations = {
      connected: true,
      symmetrized: true,
      smeared: true,
      covariancePositiveSemidefinite: true,
      booleanOnlyAssertion: true,
    };
    input.constraintConsistency = {
      classicalStructureFunctionsIncluded: true,
      constraintsSmeared: true,
      bracketResiduals: [],
      maximumAlgebraResidualUpper95: 0,
      algebraTolerance: 0.1,
      booleanOnlyAssertion: true,
    };

    const result = buildNhm2SemiclassicalStateRealizabilityV2(input);
    expect(gate(result, "stress_fluctuation_noise_kernel")?.status).toBe(
      "fail",
    );
    expect(gate(result, "stress_fluctuation_noise_kernel")?.blockers).toEqual(
      expect.arrayContaining([
        "connected_stress_noise_kernel_ref_missing",
        "noise_kernel_semiclassicality_criterion_ref_missing",
        "noise_kernel_boolean_only_assertion_forbidden",
      ]),
    );
    expect(gate(result, "constraint_formulation_consistency")?.status).toBe(
      "fail",
    );
    expect(
      gate(result, "constraint_formulation_consistency")?.blockers,
    ).toEqual(
      expect.arrayContaining([
        "constraint_bracket_H_H_missing",
        "constraint_boolean_only_assertion_forbidden",
      ]),
    );
  });

  it("rejects state, subtraction, proxy, unsmeared, and mean-tensor substitution", () => {
    const input = validInput();
    if (!input.stressFluctuations) throw new Error("fixture missing");
    input.stressTensor = {
      tensor: { sha256: sha(5) },
    };
    input.stressFluctuations.stateId = "different-state";
    input.stressFluctuations.renormalizationScheme = "adiabatic_subtraction";
    input.stressFluctuations.smeared = false;
    input.stressFluctuations.proxySubstitutionUsed = true;

    const result = buildNhm2SemiclassicalStateRealizabilityV2(input);
    const selected = gate(result, "stress_fluctuation_noise_kernel");
    expect(selected?.status).toBe("fail");
    expect(selected?.blockers).toEqual(
      expect.arrayContaining([
        "noise_kernel_state_id_mismatch",
        "noise_kernel_renormalization_scheme_mismatch",
        "noise_kernel_smeared_failed",
        "noise_kernel_proxy_substitution_forbidden",
        "mean_stress_tensor_substituted_for_noise_kernel",
      ]),
    );
  });

  it("fails a non-PSD or uncertainty-dominant connected noise kernel", () => {
    const input = validInput();
    if (!input.stressFluctuations) throw new Error("fixture missing");
    input.stressFluctuations.minimumEigenvalueSI = -1;
    input.stressFluctuations.fluctuationToMeanRatioUpper95 = 0.5;

    const result = buildNhm2SemiclassicalStateRealizabilityV2(input);
    expect(gate(result, "stress_fluctuation_noise_kernel")?.blockers).toEqual(
      expect.arrayContaining([
        "noise_kernel_covariance_minimum_eigenvalue_below_tolerance",
        "noise_kernel_fluctuation_ratio_exceeds_tolerance",
      ]),
    );
  });

  it("requires a hashed, nondegenerate fluctuation-to-mean normalization", () => {
    const input = validInput();
    if (!input.stressFluctuations) throw new Error("fixture missing");
    input.stressFluctuations.semiclassicalityCriterion = {
      ref: "run/untrusted-criterion.json",
      sha256: "not-a-sha256",
    };
    input.stressFluctuations.meanNormalizationScaleSI = 0;
    input.stressFluctuations.meanNormalizationFloorSI = 0;

    const result = buildNhm2SemiclassicalStateRealizabilityV2(input);
    expect(gate(result, "stress_fluctuation_noise_kernel")?.blockers).toEqual(
      expect.arrayContaining([
        "noise_kernel_semiclassicality_criterion_sha256_invalid",
        "noise_kernel_mean_normalization_scale_invalid",
        "noise_kernel_mean_normalization_floor_invalid",
      ]),
    );
  });

  it("does not treat BSSN-style scalar residuals as constraint-algebra closure", () => {
    const input = validInput();
    if (!input.constraintConsistency) throw new Error("fixture missing");
    input.constraintConsistency.bracketResiduals = [];
    input.constraintConsistency.maximumAlgebraResidualUpper95 = 0;

    const result = buildNhm2SemiclassicalStateRealizabilityV2(input);
    const selected = gate(result, "constraint_formulation_consistency");
    expect(selected?.status).toBe("blocked");
    expect(selected?.blockers).toEqual(
      expect.arrayContaining([
        "constraint_bracket_H_H_missing",
        "constraint_bracket_H_Hi_missing",
        "constraint_bracket_Hi_Hj_missing",
      ]),
    );
  });

  it("fails target echo, anomaly detection, and uncertainty-aware bracket breaches", () => {
    const input = validInput();
    if (!input.constraintConsistency) throw new Error("fixture missing");
    const first = input.constraintConsistency.bracketResiduals?.[0];
    if (!first) throw new Error("fixture bracket missing");
    first.computedBracket = clone(first.classicalStructureFunctionTarget!);
    first.residualLInf = 0.2;
    input.constraintConsistency.maximumAlgebraResidualUpper95 = 0.205;
    input.constraintConsistency.anomalyDisposition = "anomaly_detected";
    input.constraintConsistency.targetEchoUsedAsComputedBracket = true;

    const result = buildNhm2SemiclassicalStateRealizabilityV2(input);
    expect(
      gate(result, "constraint_formulation_consistency")?.blockers,
    ).toEqual(
      expect.arrayContaining([
        "constraint_bracket_H_H_target_echo_used_as_computed_bracket",
        "constraint_bracket_H_H_residual_upper95_exceeds_tolerance",
        "constraint_algebra_anomaly_detected",
        "constraint_target_echo_forbidden",
        "constraint_algebra_residual_exceeds_tolerance",
      ]),
    );
  });

  it("rejects a local-only kernel, unfrozen basis, broken exchange symmetry, and untyped mean binding", () => {
    const input = validInput();
    if (!input.stressFluctuations?.noiseKernel)
      throw new Error("fixture missing");
    input.stressFluctuations.noiseKernel.shape = [64, 100];
    input.stressFluctuations.noiseKernel.sizeBytes = 64 * 100 * 8;
    input.stressFluctuations.samplingBasisFrozenBeforeExecution = false;
    input.stressFluctuations.pointComponentExchangeSymmetryVerified = false;
    input.stressFluctuations.pointComponentExchangeResidualUpper95 = 0.2;
    input.stressFluctuations.pointComponentExchangeTolerance = 0.1;
    input.stressFluctuations.meanStressTensor = artifact(
      "different-mean-stress.f64",
      90,
    );
    input.stressFluctuations.fluctuationRatioFormula =
      "producer_selected_formula" as never;
    input.stressFluctuations.meanNormalizationMethodId =
      "producer_selected_normalization" as never;

    const result = buildNhm2SemiclassicalStateRealizabilityV2(input);
    expect(gate(result, "stress_fluctuation_noise_kernel")?.blockers).toEqual(
      expect.arrayContaining([
        "noise_kernel_sampling_basis_frozen_before_execution_failed",
        "connected_stress_noise_kernel_shape_invalid",
        "noise_kernel_point_component_exchange_symmetry_failed",
        "noise_kernel_point_component_exchange_symmetry_exceeds_tolerance",
        "noise_kernel_mean_stress_tensor_ref_mismatch",
        "noise_kernel_mean_stress_tensor_sha256_mismatch",
        "noise_kernel_fluctuation_ratio_formula_missing",
        "noise_kernel_mean_normalization_method_id_missing",
      ]),
    );
  });

  it("requires dimensionless bracket arrays and a hashed frozen normalization with an exact scale unit", () => {
    const input = validInput();
    const first = input.constraintConsistency?.bracketResiduals?.[0];
    if (!first?.computedBracket) throw new Error("fixture missing");
    first.computedBracket.unit = "constraint_density";
    first.normalizationDefinition = { ref: null, sha256: null };
    first.normalizationMethodId = null;
    first.normalizationMethod = { ref: null, sha256: null };
    first.normalizationScaleSI = 0;
    first.normalizationScaleUnit = "arbitrary_unit" as never;

    const result = buildNhm2SemiclassicalStateRealizabilityV2(input);
    expect(
      gate(result, "constraint_formulation_consistency")?.blockers,
    ).toEqual(
      expect.arrayContaining([
        "constraint_bracket_H_H_computed_unit_invalid",
        "constraint_bracket_H_H_normalization_definition_ref_missing",
        "constraint_bracket_H_H_normalization_method_id_missing",
        "constraint_bracket_H_H_normalization_method_ref_missing",
        "constraint_bracket_H_H_normalization_scale_invalid",
        "constraint_bracket_H_H_normalization_scale_unit_missing",
      ]),
    );
  });

  it("requires both extension lanes and replayed counterterms to bind the base renormalization artifacts exactly", () => {
    const input = validInput();
    if (!input.stressFluctuations || !input.constraintConsistency)
      throw new Error("fixture missing");
    input.stressFluctuations.renormalizationCounterterms = artifact(
      "wrong-noise-counterterms.json",
      91,
    );
    input.stressFluctuations.finiteRenormalization = artifact(
      "wrong-noise-finite-renormalization.json",
      92,
    );
    input.constraintConsistency.renormalizationCounterterms = artifact(
      "wrong-constraint-counterterms.json",
      93,
    );
    input.constraintConsistency.finiteRenormalization = artifact(
      "wrong-constraint-finite-renormalization.json",
      94,
    );

    const noAnomalyResult = buildNhm2SemiclassicalStateRealizabilityV2(input);
    expect(
      gate(noAnomalyResult, "stress_fluctuation_noise_kernel")?.blockers,
    ).toEqual(
      expect.arrayContaining([
        "noise_kernel_renormalization_counterterms_ref_mismatch",
        "noise_kernel_renormalization_counterterms_sha256_mismatch",
        "noise_kernel_finite_renormalization_ref_mismatch",
        "noise_kernel_finite_renormalization_sha256_mismatch",
      ]),
    );
    expect(
      gate(noAnomalyResult, "constraint_formulation_consistency")?.blockers,
    ).toEqual(
      expect.arrayContaining([
        "constraint_algebra_renormalization_counterterms_ref_mismatch",
        "constraint_algebra_finite_renormalization_sha256_mismatch",
      ]),
    );

    input.constraintConsistency.anomalyDisposition =
      "counterterms_included_and_replayed";
    input.constraintConsistency.countertermEvidence = artifact(
      "unbound-replayed-counterterms.json",
      95,
    );
    const replayedCountertermResult =
      buildNhm2SemiclassicalStateRealizabilityV2(input);
    expect(
      gate(replayedCountertermResult, "constraint_formulation_consistency")
        ?.blockers,
    ).toEqual(
      expect.arrayContaining([
        "constraint_counterterm_evidence_ref_mismatch",
        "constraint_counterterm_evidence_sha256_mismatch",
      ]),
    );
  });

  it("requires regulator removal and folds uncertainty-aware antisymmetry and Jacobi residuals into the algebra maximum", () => {
    const input = validInput();
    const consistency = input.constraintConsistency;
    if (
      !consistency?.antisymmetryResidual ||
      !consistency.jacobiIdentityResidual
    )
      throw new Error("fixture missing");
    consistency.refinementLevelCount = 2;
    consistency.regulatorRemovalConverged = false;
    consistency.observedRegulatorRemovalConvergenceOrder = 0;
    consistency.antisymmetryResidual.residualLInf = 0.15;
    consistency.antisymmetryResidual.absoluteUncertainty95 = 0.01;
    consistency.antisymmetryResidual.tolerance = 0.2;
    consistency.jacobiIdentityResidual.residualLInf = 0.2;
    consistency.jacobiIdentityResidual.absoluteUncertainty95 = 0.01;
    // Keep the producer maximum at the bracket-only value to exercise the
    // aggregate binding against both identity residuals.
    consistency.maximumAlgebraResidualUpper95 = 0.017;

    const result = buildNhm2SemiclassicalStateRealizabilityV2(input);
    expect(
      gate(result, "constraint_formulation_consistency")?.blockers,
    ).toEqual(
      expect.arrayContaining([
        "constraint_regulator_removal_refinement_level_count_below_minimum",
        "constraint_regulator_removal_converged_failed",
        "constraint_regulator_removal_convergence_order_invalid",
        "constraint_antisymmetry_tolerance_binding_mismatch",
        "constraint_jacobi_identity_residual_upper95_exceeds_tolerance",
        "constraint_algebra_maximum_residual_binding_mismatch",
      ]),
    );
  });

  it("rejects derived-status, claim-boundary, and shadow-field forgery", () => {
    const ready = buildNhm2SemiclassicalStateRealizabilityV2(validInput());
    const forgedStatus = clone(ready);
    forgedStatus.status = "pass";
    const forgedClaim = clone(ready) as unknown as {
      claimBoundary: { physicalViability: boolean };
    };
    forgedClaim.claimBoundary.physicalViability = true;
    const shadow = clone(ready) as typeof ready & { pass?: boolean };
    shadow.pass = true;

    expect(isNhm2SemiclassicalStateRealizabilityV2(forgedStatus)).toBe(false);
    expect(isNhm2SemiclassicalStateRealizabilityV2(forgedClaim)).toBe(false);
    expect(isNhm2SemiclassicalStateRealizabilityV2(shadow)).toBe(false);
  });
});
