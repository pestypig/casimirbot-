import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION,
  NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_LIMITS,
  NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_SHA256_DOMAIN,
  isNhm2SphericalBosonStarV2StaticGroundStateHadamardMeanNoiseRealizationV1,
  nhm2SphericalBosonStarV2StaticGroundStateHadamardMeanNoiseRealizationViolations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-static-ground-state-hadamard-mean-noise-realization.v1";

const contract =
  NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION;

describe("NHM2 spherical boson-star v2 static-ground-state Hadamard mean/noise realization", () => {
  it("literal-seals the exact canonical definition", () => {
    const digest = createHash("sha256")
      .update(
        NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_SHA256_DOMAIN,
        "utf8",
      )
      .update(
        NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_CANONICAL_JSON,
        "utf8",
      )
      .digest("hex");
    expect(digest).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_SHA256,
    );
    expect(digest).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_EXPECTED_SHA256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_BINDING,
    ).toMatchObject({ sha256: digest });
  });

  it("freezes the candidate isotropic static operator and full spectral duty", () => {
    expect(contract.candidateId).toBe(
      "nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1",
    );
    expect(contract.scopeBoundary.copiedArealGaugeRsetFormulaUsed).toBe(false);
    expect(contract.staticGroundStateOperator).toMatchObject({
      metric: "dsbar^2=-A(x)*dtau^2+B(x)*(dx^2+x^2*dOmega^2)",
      oneParticleConfigurationHilbertSpace: "L2(Sigma,N^(-1)*sqrt(h)*d^3x)",
      operator: "K=-N/sqrt(h)*partial_i(N*sqrt(h)*h^ij*partial_j)+A",
    });
    expect(contract.staticGroundStateOperator.radialSectors.operator).toBe(
      "K_ell=-N/(B^(3/2)*x^2)*d_dx[x^2*N*B^(1/2)*d_dx]+A*(1+ell*(ell+1)/(B*x^2))",
    );
    expect(
      contract.staticGroundStateOperator.exactSpectralObligations,
    ).toMatchObject({
      strictlyPositiveSelfAdjointKRequired: true,
      negativeOrZeroSpectrumDisposition: "fail_candidate",
      embeddedOrExceptionalSpectrumMayBeSilentlyDropped: false,
      coherent1sModeMayReplaceVacuumSpectrum: false,
      finiteModeTruncationDefinesTheGroundState: false,
    });
    expect(
      contract.staticGroundStateOperator.exactSpectralObligations
        .allDiscreteBoundPoles,
    ).toContain("every_normalizable_eigenmode");
    expect(
      contract.staticGroundStateOperator.exactSpectralObligations.fullContinuum,
    ).toContain("complete_delta_normalized_spectral_measure");
    expect(
      contract.staticGroundStateOperator.spectralGroundTwoPointFunction,
    ).toMatchObject({
      fixedContinuumParameter: "omega_in_[1,infinity)_not_lambda=omega^2",
      exactBoundWeight: "g/(2*omega_ell_b)",
      exactContinuumMeasureAndWeight: "g*domega/(2*omega)",
      spectralParameterOrNormalizationChangeAllowed: false,
    });
    expect(
      contract.staticGroundStateOperator.spectralGroundTwoPointFunction
        .exactFormula,
    ).toContain("Wbar0(X,Y)=g*sum_ell=0^infinity");
  });

  it("fixes the two-real-field normalization and retains the coherent phase data", () => {
    expect(contract.coherentTwoRealNormalization).toMatchObject({
      physicalToBarredFieldMap:
        "Phibar=sqrt(8*pi*G_nat)*Phi_and_g=8*pi*G_nat*mu_nat^2=2^-40",
      barredComplexFieldDefinition: "Phibar=(phibar_1+i*phibar_2)/sqrt(2)",
      canonicalMomentum:
        "pibar_A=g^(-1)*sqrt(h)*N^(-1)*partial_tau(phibar_A)_for_zero_shift",
      vacuumTwoPointNormalization:
        "Wbar_AB(X,Y)=delta_AB*Wbar0(X,Y)_so_<Phibar(X)Phibar_star(Y)>_0=Wbar0(X,Y)",
      physicalPhiMayBeIdentifiedWithBvpVarphi: false,
      unitNormalizedCcrMayBeAppliedDirectlyToPhibar: false,
      droppingTheSecondRealFieldOrItsTimeDerivativeAllowed: false,
    });
    expect(contract.coherentTwoRealNormalization.exactCoupling).toEqual({
      symbol: "g",
      exact: "2^-40",
      value: 2 ** -40,
    });
    expect(contract.coherentTwoRealNormalization.equalTimeCcr).toContain(
      "i*g*N(y)/sqrt(h(y))",
    );
    expect(contract.coherentTwoRealNormalization.frozenPhaseAtTauZero).toEqual({
      PhibarC: "varphi(x)_real_and_strictly_positive_at_the_origin",
      partialTauPhibarC: "-i*w*varphi(x)",
      phibarC1: "sqrt(2)*varphi(x)",
      phibarC2: "0",
      partialTauPhibarC1: "0",
      partialTauPhibarC2: "-sqrt(2)*w*varphi(x)",
    });
  });

  it("defines K_C and keeps the Moretti and DF routes exclusive", () => {
    expect(contract.meanRsetDefinition.smoothCoincidenceKernel).toBe(
      "K_C_bar(X,Y)=2*(Re(Wbar0(X,Y))-Hbar_S(X,Y))",
    );
    expect(contract.meanRsetDefinition.primaryRoute).toMatchObject({
      routeId: "Moretti_D_ab_one_third_plus_Theta",
      equation:
        "<Tbar_ab>_ren=Tbar_ab[Phibar_c]+coincidence(Dbar_ab^(1/3)*K_C_bar)+ThetaBar_ab",
      builtInConservationCorrection:
        "the_eta=1/3_improvement_inside_Dbar_ab^(1/3)_is_applied_exactly_once",
      thetaMayRepeatBuiltInEtaOneThirdOrGAbQCorrection: false,
      noDoubleCountCrosswalk: null,
    });
    expect(contract.meanRsetDefinition.exclusiveCrossCheckRoute).toEqual({
      routeId: "Decanini_Folacci_Hadamard_coefficient_whole_calculation",
      purpose: "independent_exclusive_cross_check_only",
      mayBeAddedToPrimaryResult: false,
      maySupplyASecondCopyOfLocalCounterterms: false,
      mayBeAveragedOrMixedWithPrimaryRoute: false,
    });
    expect(contract.meanRsetDefinition.countertermsAppliedExactlyOnce).toBe(
      true,
    );
    expect(
      contract.meanRsetDefinition
        .vacuumPolarizationMayBeDroppedFittedOrReplacedByClassicalStress,
    ).toBe(false);
  });

  it("defines every noise entry as a one-plus-two-particle Fock Gram", () => {
    expect(contract.coherentWickFockGramNoise).toMatchObject({
      coherentState: "Omega_alpha=W(Phibar_c)*Omega",
      pulledBackFockOperator:
        "Abar_pI=W(Phibar_c)^star*Bbar_pI*W(Phibar_c)_acting_in_the_ground_state_Fock_representation",
      anticommutatorIdentity:
        "Nbar_pI_qJ=(1/2)*<Omega,{Abar_pI,Abar_qJ}*Omega>=Re(<Abar_pI*Omega,Abar_qJ*Omega>)",
    });
    expect(contract.coherentWickFockGramNoise.exactSectorDefinition).toEqual({
      oneParticleVector: "Psi1_pI=P_1*Abar_pI*Omega",
      twoParticleVector: "Psi2_pI=P_2*Abar_pI*Omega",
      higherParticleVector: "P_n*Abar_pI*Omega=0_for_every_n_greater_than_2",
      projectionNormalization:
        "P_n_are_the_orthogonal_projections_of_the_standard_a_a_dagger_symmetric_Fock_space_whose_phibar_field_carries_the_frozen_sqrt(g)_mode_factor",
    });
    expect(contract.coherentWickFockGramNoise.uniformGramFormula).toBe(
      "Nbar_pI_qJ=Re(<Psi1_pI,Psi1_qJ>+<Psi2_pI,Psi2_qJ>)_for_every_p,q,I,J",
    );
    expect(
      contract.coherentWickFockGramNoise.coherentLinearSector.mustBeIncluded,
    ).toBe(true);
    expect(
      contract.coherentWickFockGramNoise.coherentLinearSector.tauZeroWarning,
    ).toContain("partial_tau(phibar_c2)");
    expect(contract.coherentWickFockGramNoise.diagonalDefinition).toContain(
      "norm(Psi1_pI)^2+norm(Psi2_pI)^2",
    );
    expect(
      contract.coherentWickFockGramNoise.diagonalWickProductDefinition,
    ).toContain("distributionally_defined_smeared_Wick_polynomial_product");
    expect(
      contract.coherentWickFockGramNoise.pointwiseCoincidenceEvaluationAllowed,
    ).toBe(false);
    expect(
      contract.coherentWickFockGramNoise.structuralPositiveSemidefiniteness,
    ).toContain(">=0");
  });

  it("fixes probe indices, raw shapes, and the exact global weight binding", () => {
    expect(contract.probeAndIndexSemantics.tensorComponentOrder).toHaveLength(
      10,
    );
    expect(
      contract.probeAndIndexSemantics.noiseComponentPairOrder,
    ).toHaveLength(100);
    expect(contract.probeAndIndexSemantics.noiseComponentPairOrder[0]).toBe(
      "T00:T00",
    );
    expect(contract.probeAndIndexSemantics.noiseComponentPairOrder[99]).toBe(
      "T33:T33",
    );
    expect(contract.probeAndIndexSemantics.outputShapes).toEqual({
      meanRset: [64, 10],
      meanRsetAbsoluteUncertainty95: [64, 10],
      connectedNoiseKernel: [64, 64, 100],
      connectedNoiseAbsoluteUncertainty95: [64, 64, 100],
    });
    expect(contract.exactBindings.smearingWeightFreeze).toMatchObject({
      sha256:
        "4cff97a0c1220dbef8c0df29e500d4c80d88320c97f8d16529c9e98ac290a446",
      canonicalSizeBytes: 6_764,
    });
    expect(contract.exactBindings.siOutputNormalization).toMatchObject({
      sha256:
        "16224114ce7bc790d1e5ceeaf8f75e31e5c37412856c5bea8b99284301bf3c24",
      canonicalSizeBytes: 23_822,
    });
    expect(contract.fixedGlobalSmearingWeightBinding).toMatchObject({
      exactRule: "w_p=1/64=2^-6_for_every_p=0,...,63",
      exactRawSha256:
        "25493ecc62734a68fad443881a595d122cb7a93ddf9d07e5ec2060baf84f03fd",
      exactRawSizeBytes: 512,
      mayAlterMeanOrNoiseProduction: false,
      mayBeChosenFromObservedOutputs: false,
    });
    expect(contract.dimensionlessToSiOutputMap).toMatchObject({
      stressScalePrimary: "stressScale_J_m3=c^4*mu_L^2/(8*pi*G_SI)",
      noiseScale: "noiseScale_(J_m3)^2=stressScale_J_m3^2",
      meanOutput: "mean_rset_SI[p,I]=stressScale_J_m3*mean_rset_bar[p,I]",
      noiseOutput:
        "noise_kernel_SI[p,q,10*I+J]=noiseScale_(J_m3)^2*Nbar[p,q,10*I+J]",
      normalizationReceipt: null,
      bindingAloneGrantsOutputOrExecutionAuthority: false,
    });
  });

  it("keeps every missing realization and numerical choice typed null", () => {
    expect(
      Object.values(contract.typedNullEvidence).every(
        (value) => value === null,
      ),
    ).toBe(true);
    expect(
      contract.jointGeometryStateAndEffectiveActionBoundary
        .jointSelfConsistentGeometryStateAlgorithm,
    ).toBeNull();
    expect(
      Object.values(
        contract.numericalRealizationBoundary
          .exactSelectorsCutoffsTailsAndJointU95,
      ).every((value) => value === null),
    ).toBe(true);
    expect(contract.blockers).toEqual(
      expect.arrayContaining([
        "hadamard_Zlambda3_candidate_coefficients_absent",
        "Moretti_Theta_no_double_count_crosswalk_absent",
        "exact_angular_frequency_radial_and_bound_selectors_absent",
        "certified_angular_frequency_radial_and_bound_tail_enclosures_absent",
        "joint_mean_noise_absolute_uncertainty95_construction_absent",
        "si_output_normalization_receipt_absent",
        "exact_source_derivation_crosswalk_and_implementation_bytes_absent",
        "effective_action_state_symplectic_contact_realization_absent",
      ]),
    );
    expect(
      contract.sourceAndDerivationProvenance.routingHintsOnlyNotEvidence.every(
        (source) =>
          source.exactSourceBytesSha256 === null &&
          source.exactSourceSizeBytes === null,
      ),
    ).toBe(true);
  });

  it("proposes seven additive DAG successors without approving them", () => {
    const proposal = contract.additiveScienceDagSuccessorProposal;
    expect(proposal.baseDagMutatedByThisArtifact).toBe(false);
    expect(proposal.proposalApproved).toBe(false);
    expect(proposal.proposalHasExecutionAuthority).toBe(false);
    expect(proposal.integrationReceipt).toBeNull();
    expect(proposal.proposedNodes.map((node) => node.nodeId)).toEqual([
      "joint_self_consistent_geometry_state_witness",
      "static_ground_state_spectral_realization",
      "hadamard_Zlambda3_realization",
      "coherent_wick_gram_noise_realization",
      "smeared_mean_noise_realization",
      "joint_numerical_enclosure_witness",
      "effective_action_state_symplectic_contact_realization",
    ]);
    expect(
      proposal.proposedNodes.every((node) => node.artifactBinding === null),
    ).toBe(true);
    expect(proposal.proposedEdges).toContainEqual({
      from: "joint_self_consistent_geometry_state_witness",
      to: "coherent_wick_gram_noise_realization",
      relation:
        "same_coherent_mean_Cauchy_data_define_the_mandatory_linear_sector",
    });
  });

  it("accepts only the in-module object and bounds hostile wire input", () => {
    expect(
      isNhm2SphericalBosonStarV2StaticGroundStateHadamardMeanNoiseRealizationV1(
        contract,
      ),
    ).toBe(true);
    expect(
      nhm2SphericalBosonStarV2StaticGroundStateHadamardMeanNoiseRealizationViolations(
        contract,
      ),
    ).toEqual([]);
    expect(
      nhm2SphericalBosonStarV2StaticGroundStateHadamardMeanNoiseRealizationViolations(
        NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_CANONICAL_JSON,
      ),
    ).toEqual([
      "static_ground_state_mean_noise_external_copy_not_authoritative",
    ]);
    let traps = 0;
    const hostile = new Proxy(
      {},
      {
        get() {
          traps += 1;
          throw new Error("must not execute");
        },
        ownKeys() {
          traps += 1;
          throw new Error("must not execute");
        },
      },
    );
    expect(
      nhm2SphericalBosonStarV2StaticGroundStateHadamardMeanNoiseRealizationViolations(
        hostile,
      ),
    ).toEqual(["static_ground_state_mean_noise_wire_required"]);
    expect(traps).toBe(0);
    expect(
      nhm2SphericalBosonStarV2StaticGroundStateHadamardMeanNoiseRealizationViolations(
        " ".repeat(
          NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_LIMITS.maximumWireUtf16CodeUnits +
            1,
        ),
      ),
    ).toEqual(["static_ground_state_mean_noise_wire_code_unit_limit"]);
    expect(
      nhm2SphericalBosonStarV2StaticGroundStateHadamardMeanNoiseRealizationViolations(
        '{"x":1 }',
      ),
    ).toEqual(["static_ground_state_mean_noise_wire_not_canonical"]);
  });

  it("is deeply immutable and keeps every authority and physical claim locked", () => {
    expect(Object.isFrozen(contract)).toBe(true);
    expect(Object.isFrozen(contract.staticGroundStateOperator)).toBe(true);
    expect(
      Object.isFrozen(contract.coherentWickFockGramNoise.exactSectorDefinition),
    ).toBe(true);
    expect(Object.isFrozen(contract.authorityLocks)).toBe(true);
    expect(() =>
      Reflect.set(contract.authorityLocks, "diagnosticPass", true),
    ).not.toThrow();
    expect(
      Object.values(contract.authorityLocks).every((value) => value === false),
    ).toBe(true);
    expect(contract.authorityLocks.physicalViability).toBe(false);
    expect(contract.authorityLocks.propulsion).toBe(false);
    expect(contract.authorityLocks.transport).toBe(false);
  });
});
