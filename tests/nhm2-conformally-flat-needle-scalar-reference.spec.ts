import { describe, expect, it } from "vitest";

import * as referenceModule from "../shared/contracts/nhm2-conformally-flat-needle-scalar-reference.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE,
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CLAIM_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION,
  isNhm2ConformallyFlatNeedleScalarReferenceV1,
  nhm2ConformallyFlatNeedleScalarReferenceViolations,
} from "../shared/contracts/nhm2-conformally-flat-needle-scalar-reference.v1";

const clone = (): any =>
  structuredClone(NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE);

const isDeepFrozen = (value: unknown, seen = new Set<object>()): boolean => {
  if (value == null || typeof value !== "object") return true;
  if (seen.has(value)) return true;
  seen.add(value);
  return (
    Object.isFrozen(value) &&
    Object.values(value as Record<string, unknown>).every((entry) =>
      isDeepFrozen(entry, seen),
    )
  );
};

describe("NHM2 conformally-flat needle scalar frozen semantic reference", () => {
  it("accepts only the exact deeply frozen diagnostic reference and exports no pass builder", () => {
    expect(NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.artifactId).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID,
    );
    expect(NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.contractVersion).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION,
    );
    expect(
      nhm2ConformallyFlatNeedleScalarReferenceViolations(
        NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE,
      ),
    ).toEqual([]);
    expect(
      isNhm2ConformallyFlatNeedleScalarReferenceV1(
        NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE,
      ),
    ).toBe(true);
    expect(isDeepFrozen(NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE)).toBe(
      true,
    );
    expect(
      Object.keys(referenceModule).filter((name) =>
        /^(?:build|create)/i.test(name),
      ),
    ).toEqual([]);
  });

  it("freezes the exact conformal surrogate geometry and pure coordinate flow boundary", () => {
    const reference = NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE;
    expect(reference.surrogate).toMatchObject({
      surrogateId: "conformally_flat_needle_reference",
      relationshipToCurrentNhm2:
        "not_the_current_nhm2_shift_lapse_metric_or_source_model",
      semanticRelabelingAllowed: false,
      physicalNeedleHullInterpretationAllowed: false,
    });
    expect(reference.geometry.ellipsoidalCompactCoordinate).toEqual({
      symbol: "s",
      expression:
        "s=(X/(0.25*m))^2+(Y/(0.05*m))^2+(Z/(0.05*m))^2",
      axesM: { x: 0.25, y: 0.05, z: 0.05 },
      domain: "s>=0",
    });
    expect(reference.geometry.compactBump.interiorExpression).toBe(
      "b(s)=exp(-s/(1-s)) for 0<=s<1",
    );
    expect(reference.geometry.compactBump.exteriorExpression).toBe(
      "b(s)=0 for s>=1",
    );
    expect(reference.geometry.conformalFactor).toMatchObject({
      expression: "Omega=1+1e-6*b(s)",
      amplitude: 1e-6,
    });
    expect(reference.geometry.coordinateFlow).toMatchObject({
      generatorExpression: "V=0.01*c*b(s)*d/dY",
      speedFractionC: 0.01,
      spacetimeMap: "F(T,x)=(T,Phi_T(x))",
      shiftOrLapsePhysics: false,
      materialMotion: false,
      actuation: false,
    });
    expect(reference.geometry.metric).toMatchObject({
      pulledBackMetric: "g=F^*(Omega^2*eta)",
      currentNhm2ShiftLapseMetric: false,
    });
    expect(reference.geometry.tetrad).toMatchObject({
      tetradId: "global_pulled_back_conformal_inertial_tetrad",
      coverage: "global",
    });
    expect(reference.geometry.boundaryAndAsymptotics).toEqual({
      manifold: "R^4",
      materialBoundary: "none",
      boundaryCondition: "no_material_boundary",
      asymptoticCondition: "Omega_to_1_and_V_to_0_so_g_to_eta",
      asymptoticallyMinkowski: true,
    });
  });

  it("freezes all 64 sample points in explicit z-then-y-then-x order", () => {
    const sampling = NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.sampling;
    expect(sampling.sampleCount).toBe(64);
    expect(sampling.samplePoints).toHaveLength(64);
    expect(sampling.enumerationOrder).toEqual([
      "z_outer",
      "y_middle",
      "x_inner",
    ]);
    expect(sampling.samplePoints[0]).toEqual({
      ordinal: 0,
      multiplier: { x: "-0.5", y: "-0.5", z: "-0.5" },
      inertialConformalCoordinatesM: {
        X0: "0",
        X: "-0.125",
        Y: "-0.025",
        Z: "-0.025",
      },
    });
    expect(sampling.samplePoints[1].multiplier).toEqual({
      x: "-0.2",
      y: "-0.5",
      z: "-0.5",
    });
    expect(sampling.samplePoints[4].multiplier).toEqual({
      x: "-0.5",
      y: "-0.2",
      z: "-0.5",
    });
    expect(sampling.samplePoints[16].multiplier).toEqual({
      x: "-0.5",
      y: "-0.5",
      z: "-0.2",
    });
    expect(sampling.samplePoints[63]).toEqual({
      ordinal: 63,
      multiplier: { x: "0.5", y: "0.5", z: "0.5" },
      inertialConformalCoordinatesM: {
        X0: "0",
        X: "0.125",
        Y: "0.025",
        Z: "0.025",
      },
    });
    expect(sampling.smearing.halfWidthsM).toEqual({
      cTau: 0.002,
      dx: 0.01,
      dy: 0.002,
      dz: 0.002,
    });
    expect(sampling.smearing.physicalTestFunction).toBe("f_n=F^*(bar_f_n)");
    expect(sampling.smearing.pullbackNormalizationIdentity).toContain(
      "sqrt(-bar_g)*bar_f_n",
    );
    expect(sampling.smearing.supportProof).toEqual({
      maximumAxisNormalizedMagnitude: 0.54,
      maximumEllipsoidalS: 0.8748,
      minimumOneMinusS: 0.1252,
      entireSupportStrictlyInsideConformalBump: true,
      formula: "s_max=3*(0.5+0.04)^2=2187/2500",
    });
    expect(sampling.smearing.staticReduction).toMatchObject({
      conformalFactorTimeIndependent: true,
      timeIntegralCancelsFromNormalizedDemandSmear: true,
    });
    expect(sampling.sampleWeights).toEqual({
      value: "1/64",
      count: 64,
      sum: 1,
      interpretation: "equal_diagnostic_sample_weights",
    });
  });

  it("freezes the real conformal scalar state, named Wald basis, and unresolved conservation correction", () => {
    const reference = NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE;
    expect(reference.fieldTheory).toMatchObject({
      fieldKind: "real_scalar",
      mass: { value: 0, convention: "massless" },
      curvatureCoupling: { symbol: "xi", numerator: 1, denominator: 6 },
      fieldEquation: "(Box_g-(1/6)*R)*phi=0",
    });
    expect(reference.state).toMatchObject({
      stateId: "conformal_minkowski_vacuum",
      stateClass: "quasifree_hadamard",
      unitConventionForTwoPointFunction: "hbar=c=1",
      curvedTwoPointFunction:
        "Wg(x,y)=Omega(Fx)^-1*Omega(Fy)^-1*W0(Fx,Fy)",
      preparationClaim: false,
      empiricalStateReceipt: false,
    });
    expect(
      reference.renormalization.waldCountertermBasis.map((entry) => entry.name),
    ).toEqual(["g_ab", "G_ab", "I_ab", "J_ab"]);
    expect(
      reference.renormalization.waldCountertermBasis.every(
        (entry) =>
          entry.coefficient === 0 &&
          entry.coefficientDisposition === "fixed_zero_named_convention",
      ),
    ).toBe(true);
    expect(reference.renormalization.countertermPolicy.zeroMeaning).toBe(
      "chosen_finite_renormalization_convention_not_absence_of_wald_ambiguity",
    );
    expect(reference.renormalization.conservationCorrection).toEqual({
      name: "wald_conservation_restoring_local_term",
      required: true,
      omissionAllowed: false,
      coefficient: null,
      coefficientDisposition:
        "must_be_derived_from_the_frozen_point_split_operator_and_hadamard_recursion_before_execution",
      status: "required_uncomputed_blocker",
      blocker: "wald_conservation_correction_coefficient_not_derived",
    });
  });

  it("freezes exact tensor order, multiplicities, and raw derivation duties without evaluated arrays", () => {
    const reference = NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE;
    expect(reference.tensorConvention.symmetricTensorComponentOrder).toEqual([
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
    ]);
    expect(reference.tensorConvention.symmetricTensorMultiplicities).toEqual([
      1, 2, 2, 2, 1, 2, 2, 1, 2, 1,
    ]);
    expect(reference.tensorConvention.noiseKernelComponentPairOrder).toHaveLength(
      100,
    );
    expect(reference.tensorConvention.noiseKernelComponentPairOrder[0]).toBe(
      "T00:T00",
    );
    expect(reference.tensorConvention.noiseKernelComponentPairOrder[99]).toBe(
      "T33:T33",
    );
    expect(reference.derivationObligations.metricDemand).toMatchObject({
      status: "blocked_not_derived",
      inertialConformalFormula:
        "G_AB=-2*omega_,AB+2*omega_,A*omega_,B+2*eta_AB*box_eta(omega)+eta_AB*(partial_omega)^2",
      siFormula:
        "D_hat_A_hat_B=(c^4/(8*pi*G))*smeared_G_hat_A_hat_B",
      output: { role: "metric_demand_tensor", shape: [64, 10] },
      deterministicErrorBoundOutput: {
        role: "metric_demand_absolute_error_bound",
        shape: [64, 10],
        coverage: "all_64_samples_all_10_components",
        perComponentStrictlyPositiveUntilExactZeroProofReplayed: true,
      },
      derivationReceiptOutput: {
        role: "metric_demand_derivation_receipt",
        executorObservedProvenanceRequired: true,
        producerSelfAssertionSufficient: false,
      },
      numericalAuthority: {
        requiredMethod:
          "directed_rounding_interval_or_ball_arithmetic_with_positive_denominator_proof",
        refinementDeltaAloneIsErrorProof: false,
        centerPointSubstitutionAllowed: false,
        frozenRelativeDemandEnclosureTarget: 0.01,
      },
      evaluated: false,
    });
    expect(reference.derivationObligations.meanRset).toMatchObject({
      status: "blocked_not_derived",
      output: { role: "mean_rset", shape: [64, 10] },
      evaluated: false,
    });
    expect(reference.derivationObligations.connectedNoiseKernel).toMatchObject({
      status: "blocked_not_derived",
      operatorOrdering: "connected_symmetrized_anticommutator",
      output: { role: "noise_kernel", shape: [64, 64, 100] },
      evaluated: false,
    });
    expect(reference.executionBoundary).toEqual({
      semanticContractOnly: true,
      candidateManifestProduced: false,
      scientificPresealProduced: false,
      rawArraysProduced: false,
      implementationsExecuted: false,
      replayExecuted: false,
      pairComparisonExecuted: false,
      empiricalReceiptPresent: false,
    });
  });

  it("keeps fixed-background matter Ward scope distinct from full gravity-plus-matter constraints", () => {
    const reference = NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE;
    expect(reference.constraintScope).toEqual({
      computedScope: "fixed_background_matter_stress_tensor_ward_identity_only",
      wardIdentityTarget: "nabla^a<T_ab>_ren=0_on_the_frozen_background",
      isFullGravityMatterHamiltonianMomentumAlgebra: false,
      equivalenceStatement:
        "fixed_background_matter_ward_algebra_is_not_equal_to_the_full_gravity_plus_matter_H_and_H_i_constraint_algebra",
      fullHamiltonianGeneratorDerived: false,
      fullMomentumGeneratorsDerived: false,
      fullPoissonBracketStructureFunctionsDerived: false,
      constraintArrayProductionAuthorized: false,
      status: "blocked",
      blocker:
        "full_gravity_plus_matter_H_Hi_generators_and_poisson_brackets_not_derived",
    });
    expect(reference.implementationPlans).toHaveLength(2);
    expect(reference.implementationPlans.map((plan) => plan.role)).toEqual([
      "primary",
      "independent",
    ]);
    expect(
      reference.implementationPlans.every(
        (plan) =>
          plan.executionStatus === "planned_not_executed" &&
          plan.establishesIndependentImplementation === false,
      ),
    ).toBe(true);
  });

  it("rejects extra keys, formula drift, and semantic relabeling", () => {
    const extraRoot = clone();
    extraRoot.promoted = true;
    expect(
      nhm2ConformallyFlatNeedleScalarReferenceViolations(extraRoot),
    ).toEqual(
      expect.arrayContaining(["root_keys_not_exact", "extra_key:/promoted"]),
    );

    const formulaDrift = clone();
    formulaDrift.geometry.compactBump.interiorExpression =
      "b(s)=exp(-1/(1-s))";
    expect(
      nhm2ConformallyFlatNeedleScalarReferenceViolations(formulaDrift),
    ).toContain("value_drift:/geometry/compactBump/interiorExpression");

    const relabeled = clone();
    relabeled.surrogate.relationshipToCurrentNhm2 =
      "current_nhm2_shift_lapse_metric";
    relabeled.surrogate.semanticRelabelingAllowed = true;
    expect(
      nhm2ConformallyFlatNeedleScalarReferenceViolations(relabeled),
    ).toEqual(
      expect.arrayContaining([
        "surrogate_semantic_relabeling_forbidden",
        expect.stringContaining("value_drift:/surrogate/relationshipToCurrentNhm2"),
      ]),
    );
  });

  it("rejects unnamed or changed zero counterterms and any conservation-correction shortcut", () => {
    const unnamed = clone();
    unnamed.renormalization.waldCountertermBasis[2].name = "";
    expect(
      nhm2ConformallyFlatNeedleScalarReferenceViolations(unnamed),
    ).toContain("wald_counterterm_named_zero_basis_invalid");

    const changedZero = clone();
    changedZero.renormalization.waldCountertermBasis[0].coefficient = 1;
    expect(
      nhm2ConformallyFlatNeedleScalarReferenceViolations(changedZero),
    ).toContain("wald_counterterm_named_zero_basis_invalid");

    const correctionShortcut = clone();
    correctionShortcut.renormalization.conservationCorrection.required = false;
    correctionShortcut.renormalization.conservationCorrection.status =
      "omitted_as_zero";
    expect(
      nhm2ConformallyFlatNeedleScalarReferenceViolations(correctionShortcut),
    ).toContain("wald_conservation_correction_contract_invalid");
  });

  it.each([
    ["metric demand", "metricDemand"],
    ["mean RSET", "meanRset"],
    ["noise kernel", "connectedNoiseKernel"],
    ["provenance", "provenance"],
  ])("rejects missing %s derivation duties", (_label, key) => {
    const value = clone();
    delete value.derivationObligations[key];
    const violations = nhm2ConformallyFlatNeedleScalarReferenceViolations(value);
    expect(violations).toContain("derivation_obligations_incomplete_or_drifted");
    expect(violations).toContain(`missing_key:/derivationObligations/${key}`);
  });

  it("rejects execution relabeling and full-constraint scope inflation", () => {
    const executed = clone();
    executed.implementationPlans[0].executionStatus = "executed";
    executed.implementationPlans[0].establishesIndependentImplementation = true;
    expect(
      nhm2ConformallyFlatNeedleScalarReferenceViolations(executed),
    ).toContain("distinct_unexecuted_implementation_plans_invalid");

    const scopeInflation = clone();
    scopeInflation.constraintScope.isFullGravityMatterHamiltonianMomentumAlgebra =
      true;
    scopeInflation.constraintScope.constraintArrayProductionAuthorized = true;
    expect(
      nhm2ConformallyFlatNeedleScalarReferenceViolations(scopeInflation),
    ).toEqual(
      expect.arrayContaining([
        "value_drift:/constraintScope/isFullGravityMatterHamiltonianMomentumAlgebra",
        "value_drift:/constraintScope/constraintArrayProductionAuthorized",
      ]),
    );
  });

  it("rejects every attempt to unlock a diagnostic, theory, empirical, physical, or transport claim", () => {
    expect(
      Object.values(NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CLAIM_LOCKS),
    ).not.toContain(true);
    for (const key of Object.keys(
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CLAIM_LOCKS,
    )) {
      const value = clone();
      value.claimLocks[key] = true;
      expect(
        nhm2ConformallyFlatNeedleScalarReferenceViolations(value),
        key,
      ).toContain(`claim_lock_must_remain_false:${key}`);
    }
  });

  it("rejects accessors, symbol keys, non-plain prototypes, and non-finite values", () => {
    const accessor = clone();
    Object.defineProperty(accessor.geometry, "metric", {
      enumerable: true,
      get: () => NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.geometry.metric,
    });
    expect(
      nhm2ConformallyFlatNeedleScalarReferenceViolations(accessor),
    ).toEqual(["accessor_property_forbidden:/geometry/metric"]);

    const symbol = clone();
    symbol[Symbol("hidden-promotion")] = true;
    expect(
      nhm2ConformallyFlatNeedleScalarReferenceViolations(symbol),
    ).toEqual(["symbol_key_forbidden:/"]);

    const nonPlain = Object.assign(Object.create({ inherited: true }), clone());
    expect(
      nhm2ConformallyFlatNeedleScalarReferenceViolations(nonPlain),
    ).toEqual(["non_plain_object:/"]);

    const nonfinite = clone();
    nonfinite.geometry.conformalFactor.amplitude = Number.NaN;
    expect(
      nhm2ConformallyFlatNeedleScalarReferenceViolations(nonfinite),
    ).toEqual(["nonfinite_number:/geometry/conformalFactor/amplitude"]);
  });
});
