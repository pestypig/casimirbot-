import { describe, expect, it } from "vitest";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BINDING_PINS,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_VALIDATOR_LIMITS,
  cloneNhm2SphericalBosonStarV2OperatorOrdering,
  isNhm2SphericalBosonStarV2OperatorOrderingV1,
  nhm2SphericalBosonStarV2OperatorOrderingViolations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-operator-ordering.v1";

const clone = (): any => cloneNhm2SphericalBosonStarV2OperatorOrdering();

describe("spherical boson-star v2 operator ordering", () => {
  it("exact-binds every candidate-specific scientific dependency", () => {
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BINDING_PINS).toEqual(
      {
        candidateFreezeSha256:
          "628092507b7dc1be76722f06a7b591efc59d1799bed0d4b7d1999d852d92f28f",
        candidateFreezeCanonicalSizeBytes: 55_997,
        constraintFormulationSha256:
          "736ce86009ef09e4e7222bebc12638b8889f7129db6443160b1856585aae45ff",
        constraintFormulationCanonicalSizeBytes: 11_571,
        renormalizationPrescriptionSha256:
          "0c9e38c5dec82db015ccb8eeac23c55257b3fd667c774a34f68cf5ee0fc8ae89",
        renormalizationPrescriptionCanonicalSizeBytes: 10_670,
        renormalizationCountertermsSha256:
          "ce189a901d951d839cba823e32b8b5e56b532bc7cad5b5ae5b1ad372d76afcfa",
        renormalizationCountertermsCanonicalSizeBytes: 10_182,
        regulatorDefinitionSha256:
          "d3b42d5483abde3db51b2755bbf58e0b35f78abd4980da56a750963362d46ade",
        regulatorDefinitionCanonicalSizeBytes: 62_592,
        classicalStructureFunctionsSha256:
          "d6f12f0703f5b756c8c08c424f3af8c06990b59005f404691b5b20f6e71ce700",
        classicalStructureFunctionsCanonicalSizeBytes: 8_870,
      },
    );
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING.exactUpstreamBindings,
      ).every(
        (binding) =>
          binding.sha256.length === 64 && binding.canonicalSizeBytes > 0,
      ),
    ).toBe(true);
  });

  it("freezes point-split mean and connected-noise operator chronology", () => {
    const pointSplit =
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING.pointSplitRenormalizedInsertion;
    expect(pointSplit.selectedMeanRoute).toBe("improved_moretti_eta_one_third");
    expect(pointSplit.smoothRemainder).toBe("K_C=S_C-2*H_S");
    expect(pointSplit.symmetricOperator).toBe("D^(1/3)_ab");
    expect(pointSplit.orderedSteps[3]).toContain("while_points_remain_split");
    expect(pointSplit.derivativesBeforeCoincidenceRequired).toBe(true);
    expect(pointSplit.explicitV1AddedToImprovedRoute).toBe(false);
    expect(pointSplit.completeEffectiveActionOperatorRealization).toBeNull();

    const noise =
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING.connectedNoiseOrdering;
    expect(noise.orderedSteps[1]).toContain("center_each_operator");
    expect(noise.orderedSteps[2]).toContain("ordered_sum");
    expect(noise.cNumberCountertermsCancelOnlyAfterExplicitCentering).toBe(
      true,
    );
    expect(noise.countertermArraysInjectedIntoNoise).toBe(false);
  });

  it("freezes the signed gravity-plus-state total Poisson bracket", () => {
    const bracket =
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING.totalPoissonBracketOrdering;
    expect(bracket.definition).toContain(
      "Poissonbar_ADM(F,G)+inverse(Omegabar_state)(d_state_F,d_state_G)",
    );
    expect(bracket.gravityContribution).toContain(
      "(delta_F/delta_qbar_ab)*(delta_G/delta_pibar^ab)",
    );
    expect(bracket.gravityContribution).toContain(
      "-(delta_F/delta_pibar^ab)*(delta_G/delta_qbar_ab)",
    );
    expect(bracket.orderedContributionEvaluation).toEqual([
      "01_evaluate_first_gravity_q_then_pi_product",
      "02_evaluate_second_gravity_pi_then_q_product",
      "03_subtract_second_gravity_product_from_first",
      "04_evaluate_state_inverse_symplectic_contraction_with_F_as_first_argument_and_G_as_second",
      "05_add_gravity_contribution_then_state_contribution",
    ]);
    expect(bracket.fixedStateDuringGravityVariationAllowed).toBe(false);
    expect(bracket.producerSelectedContributionReorderAllowed).toBe(false);
    expect(bracket.executableBracketComplete).toBe(false);
  });

  it("freezes computed H_H, H_Hi, and Hi_Hj call order without target reads", () => {
    const computed =
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING.computedBracketFamilies;
    expect(computed.familyOrder).toEqual(["H_H", "H_Hi", "Hi_Hj"]);
    expect(computed.componentOrder).toEqual([
      "hamiltonian",
      "momentum_x",
      "momentum_y",
      "momentum_z",
    ]);
    expect(computed.H_H.expression).toBe(
      "Poissonbar_total(Hbar_total[N],Hbar_total[M])",
    );
    expect(computed.H_Hi.expression).toBe(
      "Poissonbar_total(Hbar_total[N],Dbar_total[X])",
    );
    expect(computed.Hi_Hj.expression).toBe(
      "Poissonbar_total(Dbar_total[X],Dbar_total[Y])",
    );
    expect(
      computed.expectedStructuralZerosMustBeSeparatelyDerivedNotFilledOrCopied,
    ).toBe(true);
    expect(computed.targetArraysMayBeRead).toBe(false);
    expect(computed.residualArraysMayBeRead).toBe(false);
    expect(computed.reverseOrSymmetryReuseAllowed).toBe(false);
  });

  it("requires independently evaluated forward and reverse antisymmetry operands", () => {
    const antisymmetry =
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING.antisymmetryOrdering;
    expect(antisymmetry.forward.expression).toBe(
      "Poissonbar_total(Cbar[xi],Cbar[eta])",
    );
    expect(antisymmetry.reverse.expression).toBe(
      "Poissonbar_total(Cbar[eta],Cbar[xi])",
    );
    expect(antisymmetry.forward.evaluatedFresh).toBe(true);
    expect(antisymmetry.reverse.evaluatedFresh).toBe(true);
    expect(antisymmetry.reverse.mayBeSynthesizedByNegatingForward).toBe(false);
    expect(antisymmetry.reverse.mayReuseForwardDerivativeTapeOrArray).toBe(
      false,
    );
    expect(antisymmetry.residual.expression).toBe(
      "server_residual=forward+reverse",
    );
  });

  it("freezes all three nested Jacobi terms and forbids cyclic reuse", () => {
    const jacobi =
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING.jacobiOrdering;
    expect(jacobi.term_1.outer).toBe(
      "Poissonbar_total(Cbar[xi],Poissonbar_total(Cbar[eta],Cbar[zeta]))",
    );
    expect(jacobi.term_2.outer).toBe(
      "Poissonbar_total(Cbar[eta],Poissonbar_total(Cbar[zeta],Cbar[xi]))",
    );
    expect(jacobi.term_3.outer).toBe(
      "Poissonbar_total(Cbar[zeta],Poissonbar_total(Cbar[xi],Cbar[eta]))",
    );
    expect(jacobi.everyInnerAndOuterBracketEvaluatedFresh).toBe(true);
    expect(jacobi.innerBracketReuseAcrossTermsOrFromAntisymmetryAllowed).toBe(
      false,
    );
    expect(jacobi.cyclicPermutationMayBeSynthesizedFromAnotherTerm).toBe(false);
    expect(jacobi.residual.additionOrder).toBe(
      "left_associated_term_1_plus_term_2_then_plus_term_3",
    );
  });

  it("freezes coarse-to-fine regulator chronology and primitive replay order", () => {
    const regulator =
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING.regulatorChronology;
    expect(regulator.levelOrder).toEqual([
      { ordinal: 0, levelId: "level_0", hExact: "1/16" },
      { ordinal: 1, levelId: "level_1", hExact: "1/32" },
      { ordinal: 2, levelId: "level_2", hExact: "1/64" },
    ]);
    expect(regulator.familyOrder).toEqual([
      "H_H",
      "H_Hi",
      "Hi_Hj",
      "antisymmetry",
      "jacobi",
    ]);
    expect(regulator.levelsEvaluatedCoarseToFine).toBe(true);
    expect(regulator.parallelOrProducerSelectedLevelOrderAllowed).toBe(false);
    expect(
      regulator.crossLevelOperandSymmetryDerivativeTapeOrArrayReuseAllowed,
    ).toBe(false);
    expect(regulator.postObservationRegulatorOrOrderingRetuneAllowed).toBe(
      false,
    );
  });

  it("keeps targets and residuals outside computed and identity authority", () => {
    const separation =
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING.classicalTargetAndResidualSeparation;
    expect(separation.targetMayReadComputedOrResidualArrays).toBe(false);
    expect(separation.computedMayReadTargetOrResidualArrays).toBe(false);
    expect(separation.identityOperandsMayReadTargetOrResidualArrays).toBe(
      false,
    );
    expect(separation.serverReplayOrder).toHaveLength(6);
    expect(separation.serverReplayOrder[5]).toContain(
      "only_for_mismatch_rejection",
    );
    expect(separation.producerTargetOrResidualSummaryAuthority).toBe(false);
  });

  it("fails closed on the underdetermined scientific choices", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING;
    expect(
      contract.totalPoissonBracketOrdering
        .stateInverseSymplecticCoordinateRealization,
    ).toBeNull();
    expect(
      contract.totalPoissonBracketOrdering
        .spatialQuadratureAndBinary64ReductionOrder,
    ).toBeNull();
    expect(contract.derivationAuthority.complete).toBe(false);
    expect(contract.completion.sourceAndDerivationClosureComplete).toBe(false);
    expect(contract.completion.executableNumericalOrderingComplete).toBe(false);
    expect(contract.completion.anomalyAnalysisComplete).toBe(false);
    expect(contract.completion.scientificInputComplete).toBe(false);
    expect(contract.completion.candidateExecutionMayStart).toBe(false);
    expect(contract.blockers).toContain(
      "state_inverse_symplectic_coordinate_chart_and_discretization_derivation_not_bound",
    );
    expect(contract.blockers).toContain(
      "equal_time_contact_term_and_boundary_distribution_prescription_not_derived",
    );
  });

  it("has no implementation, runtime, arrays, replay, lamps, or claim authority", () => {
    const materialization =
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING.materialization;
    expect(materialization.implementationPresent).toBe(false);
    expect(materialization.implementationBinding).toBeNull();
    expect(materialization.runtimeBound).toBe(false);
    expect(materialization.runtimeManifest).toBeNull();
    expect(materialization.scientificPresealComplete).toBe(false);
    expect(materialization.scientificPresealReceipt).toBeNull();
    expect(materialization.arraysPresent).toBe(false);
    expect(materialization.arrayManifest).toBeNull();
    expect(materialization.replayPerformed).toBe(false);
    expect(materialization.replayReceipt).toBeNull();
    expect(materialization.lampsPromoted).toBe(false);
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_AUTHORITY_LOCKS,
      ).every((value) => value === false),
    ).toBe(true);
  });

  it("is recursively frozen and sealed to literal canonical bytes", () => {
    expect(
      Object.isFrozen(NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING),
    ).toBe(true);
    expect(
      Object.isFrozen(
        NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING.jacobiOrdering.term_1,
      ),
    ).toBe(true);
    expect(
      Object.isFrozen(
        NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING.regulatorChronology
          .levelOrder,
      ),
    ).toBe(true);
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_SHA256).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_EXPECTED_SHA256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_BINDING.sha256).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_SHA256,
    );
  });

  it("accepts only the exact canonical plain-data descriptor", () => {
    expect(isNhm2SphericalBosonStarV2OperatorOrderingV1(clone())).toBe(true);
    const changed = clone();
    changed.computedBracketFamilies.reverseOrSymmetryReuseAllowed = true;
    expect(isNhm2SphericalBosonStarV2OperatorOrderingV1(changed)).toBe(false);
    expect(nhm2SphericalBosonStarV2OperatorOrderingViolations(changed)).toEqual(
      ["spherical_v2_operator_ordering_semantic_drift"],
    );
  });

  it("rejects proxies, accessors, cycles, symbols, non-plain objects, and hostile arrays", () => {
    expect(
      nhm2SphericalBosonStarV2OperatorOrderingViolations(new Proxy({}, {}))[0],
    ).toContain("proxy_forbidden");

    const accessor = clone();
    Object.defineProperty(accessor, "maturity", {
      enumerable: true,
      get: () => "spoofed",
    });
    expect(
      nhm2SphericalBosonStarV2OperatorOrderingViolations(accessor)[0],
    ).toContain("object_entry_surface");

    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(
      nhm2SphericalBosonStarV2OperatorOrderingViolations(cyclic)[0],
    ).toContain("cycle_forbidden");

    const symbolKey = clone();
    symbolKey[Symbol("hidden")] = true;
    expect(
      nhm2SphericalBosonStarV2OperatorOrderingViolations(symbolKey)[0],
    ).toContain("object_surface");

    expect(
      nhm2SphericalBosonStarV2OperatorOrderingViolations(
        Object.create(null),
      )[0],
    ).toContain("non_plain_object");

    const sparse = new Array(2);
    sparse[1] = 1;
    expect(
      nhm2SphericalBosonStarV2OperatorOrderingViolations(sparse)[0],
    ).toContain("array_surface");

    const extraArray = [1];
    Object.defineProperty(extraArray, "extra", {
      value: true,
      enumerable: true,
    });
    expect(
      nhm2SphericalBosonStarV2OperatorOrderingViolations(extraArray)[0],
    ).toContain("array_surface");
  });

  it("rejects non-JSON numbers and bounded-resource attacks", () => {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, -0, 1n]) {
      expect(
        nhm2SphericalBosonStarV2OperatorOrderingViolations(value).length,
      ).toBeGreaterThan(0);
    }
    expect(
      nhm2SphericalBosonStarV2OperatorOrderingViolations(
        "x".repeat(
          NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_VALIDATOR_LIMITS.maximumStringUtf8Bytes +
            1,
        ),
      )[0],
    ).toContain("string_byte_limit");

    let deep: Record<string, unknown> = {};
    const root = deep;
    for (
      let index = 0;
      index <
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_VALIDATOR_LIMITS.maximumDepth +
        2;
      index += 1
    ) {
      const next: Record<string, unknown> = {};
      deep.next = next;
      deep = next;
    }
    expect(
      nhm2SphericalBosonStarV2OperatorOrderingViolations(root)[0],
    ).toContain("snapshot_depth_limit");
  });
});
