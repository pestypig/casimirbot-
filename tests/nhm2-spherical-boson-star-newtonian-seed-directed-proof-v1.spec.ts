import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_PINS,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_VALIDATOR_LIMITS,
  isNhm2SphericalBosonStarNewtonianSeedDirectedProofV1,
  nhm2SphericalBosonStarNewtonianSeedDirectedProofV1Violations,
} from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed-directed-proof.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-newtonian-seed-operation-policy.v1";

const clone = (): Record<string, any> =>
  JSON.parse(
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_JSON,
  );

const principalMultiplierAudit = (
  n: number,
  sigma: number,
): Readonly<{ schrodinger: number; poisson: number }> => {
  // Independent highest-degree calculation in shifted y polynomials. For n>=1,
  // lead(T_n(2y-1))=2^(2n-1), while lead(C_m^2(2y-1))=2^(2m)(m+1).
  // Cancel powers symbolically before binary64 evaluation. The two leading
  // ratios are 1/32 and 1/512, avoiding irrelevant overflow at n=512.
  const sPolynomial =
    -0.5 * (n + 2) * (n + 1) + sigma * (n + 2) - 0.5 * sigma * (sigma + 1);
  const pPolynomial =
    (n + 2) * (n + 1) - 4 * sigma * (n + 2) + 2 * sigma * (2 * sigma + 1);
  return Object.freeze({
    schrodinger: sPolynomial / (32 * (n + 3)),
    poisson: pPolynomial / (512 * (n + 5)),
  });
};

describe("spherical Newtonian seed directed proof v1", () => {
  it("pins the exact canonical successor independently", () => {
    const expectedSha =
      "c8832ae77d1279d400f1fffbc587e413659c111ae90283cb34a016fb7e08ea99";
    const expectedSize = 42778;
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_SHA256,
    ).toBe(expectedSha);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_SIZE_BYTES,
    ).toBe(expectedSize);
    expect(
      createHash("sha256")
        .update(
          NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_SHA256_DOMAIN,
          "utf8",
        )
        .update(
          NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    ).toBe(expectedSha);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_EXPECTED_SHA256,
    ).toBe(expectedSha);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(expectedSize);
  });

  it("exact-binds the live semantic seed and incomplete operation prepolicy", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_PINS,
    ).toEqual({
      semanticSeed: {
        sha256:
          "b2a89c8065bd6865b26aa1c4365d0f48edbd40e9c4f43e0cfbaca49db29a6c2c",
        canonicalSizeBytes: 18894,
      },
      operationPrepolicy: {
        sha256:
          "3aaadad7b8bec8d7883c172c380e10d3100c9e4c64404740b963e5820762de24",
        canonicalSizeBytes: 32308,
      },
    });
    expect(NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_PINS
        .semanticSeed.sha256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_PINS
        .semanticSeed.canonicalSizeBytes,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_PINS
        .operationPrepolicy.sha256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_PINS
        .operationPrepolicy.canonicalSizeBytes,
    );
  });

  it("uses distinct domain and codomain weights and a bounded Y-to-X tail inverse", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1;
    expect(policy.coefficientSpaces.unknownSpace.coefficientWeight).toBe(
      "wX(n)=(n+1)^8",
    );
    expect(policy.coefficientSpaces.residualSpace.coefficientWeight).toBe(
      "wY(n)=(n+1)^7",
    );
    expect(policy.coefficientSpaces.boundednessBoundary).toMatchObject({
      derivativeIsNotClaimedBoundedFromXToX: true,
      secondDerivativeIsNotClaimedBoundedFromXToX: true,
    });
    expect(
      policy.coefficientSpaces.boundednessBoundary.D2MapsXToYBecause,
    ).toContain("8*n*wY(n-2)/wX(n)");
    expect(policy.preconditioner.AFromYToX.tailAlpha).toContain("/muS");
    expect(policy.preconditioner.AFromYToX.tailBeta).toContain("/muP");
    expect(policy.preconditioner.AFromYToX.boundedness).toContain(
      "wX(n)/(abs(muS_n)*wY(n))",
    );
  });

  it("records transform, projection, convolution, and K=512 tail architecture", () => {
    const operators =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1.exactCoefficientOperators;
    expect(operators.ChebyshevProduct).toContain(
      "indicator_(j+k=m)+indicator_(abs(j-k)=m)",
    );
    expect(operators.ChebyshevToC1.matrix).toContain("+1/2");
    expect(operators.C1ToC2.matrix).toContain("1/(n+1)");
    expect(operators.secondDerivativeToC2).toBe(
      "D202[m,n]=8*n_if_n>=2_and_m=n-2_else_zero",
    );
    expect(operators.ChebyshevProjection).toMatchObject({
      finiteModeMaximum: 512,
      gammaOrders: [0, 1, 2],
    });
    expect(operators.ChebyshevProjection.integrationByPartsTail).toContain(
      "2*L10Upper/(n*pi_lower)^10",
    );
    expect(operators.ChebyshevProjection.weightedTailBound).toContain(
      "(1/513+1/513^2)",
    );
  });

  it("records the fixed C fiber and gamma-derivative algebra through both lifts", () => {
    const fiber =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1.exteriorFiber;
    expect(fiber.fixedCScale).toContain("sC=max(Cbar,2^-256)");
    expect(fiber.gamma).toBe("C=Cbar+sC*gamma");
    expect(fiber.exactGammaDerivatives.sigma).toEqual([
      "sigma_gamma=sC/kappa",
      "sigma_gammagamma=0",
    ]);
    expect(fiber.exactGammaDerivatives.B[1]).toContain("log(y)^2*B");
    expect(fiber.exactGammaDerivatives.E[1]).toContain("log(y)^2*E");
    expect(fiber.joinsFromPrimaryCore.gammaDerivatives).toContain(
      "Qy1_gammagamma=4*(sC/kappa)*(sC/R)",
    );
    expect(fiber.affineFiberMap.mixedDerivatives).toContain(
      "product_composition",
    );
  });

  it("independently checks both exact principal tail multiplier formulas", () => {
    const multipliers =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1.preconditioner
        .principalTailMultipliers;
    expect(multipliers.schrodinger).toBe(
      "muS(n,sigma)=(-(n+1)*(n+2)+2*sigma*(n+2)-sigma*(sigma+1))/(64*(n+3))_for_n>=32",
    );
    expect(multipliers.poisson).toBe(
      "muP(n,sigma)=((n+1)*(n+2)-4*sigma*(n+2)+2*sigma*(2*sigma+1))/(512*(n+5))_for_n>=32",
    );
    for (const n of [32, 33, 127, 512]) {
      for (const sigma of [-1.25, 0, 0.75, 2.5]) {
        const audit = principalMultiplierAudit(n, sigma);
        const expectedS =
          (-(n + 1) * (n + 2) + 2 * sigma * (n + 2) - sigma * (sigma + 1)) /
          (64 * (n + 3));
        const expectedP =
          ((n + 1) * (n + 2) -
            4 * sigma * (n + 2) +
            2 * sigma * (2 * sigma + 1)) /
          (512 * (n + 5));
        expect(audit.schrodinger).toBeCloseTo(expectedS, 14);
        expect(audit.poisson).toBeCloseTo(expectedP, 14);
      }
    }
    expect(multipliers.resonanceFailure).toContain(
      "fail_with_principal_tail_resonance",
    );
  });

  it("records the proposed MPFR inverse and Y, Z0, Z1, p architecture", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1;
    expect(policy.preconditioner.MPFRInverseConstruction).toMatchObject({
      storage: "fresh_row_major_65_by_65_MPFR256_RNDN_matrix",
      inverseSymbol: "B32",
      noLibraryInverseOrFallback: true,
    });
    expect(
      policy.preconditioner.MPFRInverseConstruction.certification,
    ).toContain("eta=norm_l1_weighted(I-B32*[J32])");
    expect(policy.radiiPolynomialProof.Y.formula).toContain("normX(A*F(xbar))");
    expect(policy.radiiPolynomialProof.Z0.formula).toContain("I-A*DF(xbar)");
    expect(policy.radiiPolynomialProof.Z1.formula).toContain("D2F(x)");
    expect(policy.radiiPolynomialProof.Z).toBe(
      "ZUpper(r)=RNDU(Z0Upper+RNDU(Z1Upper*r))",
    );
    expect(policy.radiiPolynomialProof.p).toContain("YUpper+");
    expect(policy.radiiPolynomialProof.candidates).toContain("j=0..60");
    expect(policy.radiiPolynomialProof.selection).toContain(
      "evaluate_all_61_candidates_without_early_stop",
    );
  });

  it("does not overclaim the projected correction as a full PDE or global root", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1;
    expect(policy.scopeBoundary).toMatchObject({
      projectedExteriorOperatorZeroImpliesFullExteriorPde: false,
      omittedLowModesMustPassIndependentResidualDuties: true,
      coreModesIncludedInSameContraction: false,
      exactCoreRootAuthority: false,
      exactExteriorPdeRootAuthority: false,
      exactGlobalSchrodingerPoissonRootAuthority: false,
    });
    expect(
      policy.coefficientSpaces.residualSpace.deliberatelyOmittedRawModes,
    ).toEqual([
      "S_C2_mode_0",
      "S_C2_mode_1",
      "P_C2_mode_0",
      "P_C2_mode_1",
      "P_C2_mode_2",
      "P_C2_mode_3",
    ]);
    expect(policy.infiniteResidualOperator.lowRawModeDefect).toContain(
      "full_residual_duties",
    );
  });

  it("registers origin, core, tail, sign, mass, identity, and scaling duties", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1;
    expect(policy.originDirectedProof).toMatchObject({
      domain: "x_in_[0,2^-8]",
      explicitCount: 34,
    });
    expect(policy.coreCovers.nonoriginInitialBox).toBe("[2^-8,32]");
    expect(policy.intervalCoverEngine).toMatchObject({
      commonMaximumDepth: 56,
      commonMaximumPoppedBoxesPerDuty: 262144,
      noAdaptivePrecisionOrPredicateWeakening: true,
    });
    expect(policy.exteriorCovers.openEndpointCandidates).toContain("j=0..60");
    expect(policy.exteriorCovers.infinitySemantics).toContain(
      "strict_V_negativity_is_only_for_finite_x",
    );
    expect(policy.integralsAndIdentities.massCoulomb).toContain("C-N/(4*pi)");
    expect(policy.integralsAndIdentities.maximumPoppedBoxesPerIntegral).toBe(
      196000,
    );
    expect(policy.integralsAndIdentities.identityResiduals).toEqual({
      virial: "abs(2*T+W)/(2*T+abs(W))<=1e-9",
      eigenvalue: "abs(nu0*N-T-2*W)/(abs(nu0)*N+T+2*abs(W))<=1e-9",
      poissonEnergy:
        "abs(potentialGradient+2*W)/(potentialGradient+2*abs(W))<=1e-9",
      gaussFlux: "abs(gaussFlux-N)/N<=1e-9_with_N_lower>0",
    });
    expect(policy.scalingAndBvpPropagation.maximum).toContain(
      "max_(x>=0)|uStar|=uStar(0)=2^-10",
    );
    expect(policy.scalingAndBvpPropagation.establishesBranchAuthority).toBe(
      false,
    );
  });

  it("registers duty domains, counts, routes, and provisional receipt hashing", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1;
    expect(policy.dutyRegistry.exactDutyCount).toBe(16);
    expect(policy.dutyRegistry.dutyOrder).toHaveLength(16);
    expect(policy.dutyRegistry.dutyDefinitions).toHaveLength(16);
    expect(
      policy.dutyRegistry.dutyDefinitions.map((entry) => entry.ordinal),
    ).toEqual([...Array(16).keys()]);
    expect(
      policy.dutyRegistry.dutyDefinitions.find((entry) => entry.ordinal === 6)
        ?.count,
    ).toBe("exactly_61");
    expect(policy.receiptSchemas.commonExactKeys).toHaveLength(15);
    expect(policy.receiptSchemas.recordHashDomain).toBe(
      "nhm2-spherical-boson-star-newtonian-seed-directed-proof/record/v1\n",
    );
    expect(policy.receiptSchemas.routeStreamHashDomain).toBe(
      "nhm2-spherical-boson-star-newtonian-seed-directed-proof/route-stream/v1\n",
    );
    expect(policy.receiptSchemas.summaryAuthorityFalse).toBe(true);
    expect(policy.receiptSchemas.derivedMaximumTotalRecordCount).toBe(4189905);
    expect(
      policy.receiptSchemas.derivedMaximumTotalRecordCount,
    ).toBeLessThanOrEqual(policy.receiptSchemas.maximumTotalRecords);
    expect(policy.receiptSchemas.conclusionSemantics.forbiddenTags).toContain(
      "exterior_solution_exists",
    );
    expect(policy.receiptSchemas.conclusionSemantics.forbiddenTags).toContain(
      "seed_accepted",
    );
  });

  it("records an incomplete primary-to-verifier overlay that rejects producer metrics", () => {
    const abi =
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1.primaryToVerifierAbi;
    expect(abi.acceptedInputPayloadsInOrder).toEqual([
      "scalars.f64le",
      "coefficients/core_L2_u.f64le",
      "coefficients/core_L2_V.f64le",
      "coefficients/tail_H.f64le",
      "coefficients/tail_Q.f64le",
    ]);
    expect(abi.exactPayloadShapes).toHaveLength(5);
    expect(abi.descriptorRequiredBindings).toContain(
      "preexecutionPresealBinding",
    );
    expect(abi).toMatchObject({
      primaryNumericsPolicyBinding: null,
      primaryNumericsPolicyRequiredBeforeAbiCompletion: true,
    });
    expect(abi.verifierAdmissionOrder).toContain(
      "ignore_all_primary_pass_fail_proof_interval_and_metric_fields",
    );
    expect(abi.derivedOperandsNeverAcceptedFromPrimary).toContain(
      "Y_Z0_Z1_p_or_selected_radius",
    );
    expect(abi.outputMayModifyPrimaryRoot).toBe(false);
    expect(abi.forbiddenRoleIdsAndKeysAtAnyDepth).toContain(
      "declared_lever_tensor",
    );
    expect(abi.forbiddenRoleIdsAndKeysAtAnyDepth).toContain("tile");
    expect(abi.forbiddenRoleAdmission).toContain(
      "before_opening_or_decoding_any_numeric_payload",
    );
  });

  it("keeps implementation, runtime, execution, authority, lamps, and claims shut", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1;
    expect(policy.completionBoundary).toMatchObject({
      exactDirectedOperatorSemanticsComplete: false,
      exactNormAndBoundSemanticsComplete: false,
      exactReceiptSchemasComplete: false,
      exactPrimaryToVerifierAbiComplete: false,
      primaryNumericsPolicyBound: false,
      implementationComplete: false,
      runtimeClosureComplete: false,
      preexecutionPresealComplete: false,
      executionAuthorized: false,
      executionObserved: false,
      directedDutiesAccepted: false,
      seedAccepted: false,
    });
    expect(policy.blockers).toContain(
      "exact_origin_nonlinear_operator_representative_inverse_Y_Z0_Z1_and_q_definition_absent",
    );
    expect(policy.blockers).toContain(
      "exact_projection_initial_partition_depth_cell_evaluation_and_global_work_budget_absent",
    );
    expect(policy.blockers).toContain(
      "exact_Z0_infinite_column_formula_constants_monotonicity_proof_and_operation_graph_absent",
    );
    expect(policy.blockers).toContain(
      "exact_Z1_bilinear_block_tail_formulas_constants_and_operation_graph_absent",
    );
    expect(policy.blockers).toContain(
      "exact_signed_reciprocal_endpoint_operation_graph_absent",
    );
    expect(policy.blockers).toContain(
      "closed_receipt_common_summary_and_duty_specific_value_types_nested_shapes_field_order_endpoint_mantissa_normalization_conditional_null_semantics_and_parser_ABI_absent",
    );
    expect(policy.implementationAndRuntimeBoundary).toMatchObject({
      primaryImplementation: null,
      independentImplementation: null,
      primaryRuntime: null,
      independentRuntime: null,
      executionCommand: null,
      executionReceipt: null,
      implementationComplete: false,
      runtimeClosureComplete: false,
      executionAuthorized: false,
      executionObserved: false,
    });
    expect(Object.values(policy.authorityLocks).every((value) => !value)).toBe(
      true,
    );
    expect(Object.values(policy.claimLocks).every((value) => !value)).toBe(
      true,
    );
    expect(
      Object.values(policy.unresolved).every((value) => value === null),
    ).toBe(true);
  });

  it("treats only the deeply frozen singleton as authoritative", () => {
    const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1;
    expect(isNhm2SphericalBosonStarNewtonianSeedDirectedProofV1(policy)).toBe(
      true,
    );
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofV1Violations(policy),
    ).toEqual([]);
    expect(Object.isFrozen(policy)).toBe(true);
    expect(Object.isFrozen(policy.exteriorFiber)).toBe(true);
    expect(Object.isFrozen(policy.dutyRegistry.dutyDefinitions)).toBe(true);
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofV1Violations(clone()),
    ).toEqual([
      "spherical_seed_directed_proof_external_copy_not_authoritative",
    ]);
  });

  it("rejects semantic and authority drift", () => {
    const authority = clone();
    authority.authorityLocks.physicalViability = true;
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofV1Violations(authority),
    ).toEqual(["spherical_seed_directed_proof_semantic_mismatch"]);

    const formula = clone();
    formula.preconditioner.principalTailMultipliers.schrodinger = "forged";
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofV1Violations(formula),
    ).toEqual(["spherical_seed_directed_proof_semantic_mismatch"]);

    const abi = clone();
    abi.primaryToVerifierAbi.derivedOperandsNeverAcceptedFromPrimary = [];
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofV1Violations(abi),
    ).toEqual(["spherical_seed_directed_proof_semantic_mismatch"]);
  });

  it("rejects proxies and accessors without executing them", () => {
    let traps = 0;
    const proxy = new Proxy(clone(), {
      getPrototypeOf() {
        traps += 1;
        throw new Error("must not execute");
      },
      ownKeys() {
        traps += 1;
        throw new Error("must not execute");
      },
    });
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofV1Violations(proxy),
    ).toEqual(["proxy_forbidden:/"]);
    expect(traps).toBe(0);

    let getterReads = 0;
    const accessor = clone();
    Object.defineProperty(accessor, "maturity", {
      enumerable: true,
      get() {
        getterReads += 1;
        return "forged";
      },
    });
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofV1Violations(accessor),
    ).toEqual(["object_property_surface:/maturity"]);
    expect(getterReads).toBe(0);
  });

  it("rejects hidden, symbolic, forbidden, sparse, and array-side properties", () => {
    const hidden = clone();
    Object.defineProperty(hidden, "hidden", { value: true, enumerable: false });
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofV1Violations(hidden),
    ).toEqual(["object_property_surface:/hidden"]);

    const symbolic = clone();
    Object.defineProperty(symbolic, Symbol("hidden"), {
      value: true,
      enumerable: true,
    });
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofV1Violations(symbolic),
    ).toEqual(["symbol_key:/"]);

    const forbidden = clone();
    Object.defineProperty(forbidden, "__proto__", {
      value: {},
      enumerable: true,
    });
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofV1Violations(forbidden),
    ).toEqual(["forbidden_key:/__proto__"]);

    const sparse = clone();
    delete sparse.dutyRegistry.dutyDefinitions[2];
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofV1Violations(sparse),
    ).toEqual(["array_surface:/dutyRegistry/dutyDefinitions"]);

    const arraySide = clone();
    Object.defineProperty(arraySide.dutyRegistry.dutyOrder, "4294967295", {
      value: "forged",
      enumerable: true,
    });
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofV1Violations(arraySide),
    ).toEqual(["array_surface:/dutyRegistry/dutyOrder"]);
  });

  it("bounds hostile depth, width, cycles, arrays, strings, values, and prototypes", () => {
    const deep = clone();
    let cursor: Record<string, unknown> = {};
    deep.extra = cursor;
    for (
      let index = 0;
      index <
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_VALIDATOR_LIMITS.maximumDepth +
        4;
      index += 1
    ) {
      const next: Record<string, unknown> = {};
      cursor.next = next;
      cursor = next;
    }
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofV1Violations(deep)[0],
    ).toMatch(/^snapshot_depth_limit:/);

    const wide = clone();
    for (
      let index = 0;
      index <=
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_VALIDATOR_LIMITS.maximumObjectPropertyCount;
      index += 1
    ) {
      wide[`extra_${index}`] = index;
    }
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofV1Violations(wide),
    ).toEqual(["object_property_count_limit:/"]);

    const cycle = clone();
    cycle.self = cycle;
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofV1Violations(cycle),
    ).toEqual(["cycle:/self"]);

    const oversizedArray = clone();
    oversizedArray.extra = new Array(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_VALIDATOR_LIMITS.maximumArrayLength +
        1,
    ).fill(0);
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofV1Violations(
        oversizedArray,
      ),
    ).toEqual(["array_length_limit:/extra"]);

    const oversizedString = clone();
    oversizedString.extra = "x".repeat(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_VALIDATOR_LIMITS.maximumStringUtf8Bytes +
        1,
    );
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofV1Violations(
        oversizedString,
      ),
    ).toEqual(["string_byte_limit:/extra"]);

    for (const invalid of [Number.NaN, Infinity, -Infinity, -0]) {
      const numeric = clone();
      numeric.preconditioner.auditCutoff = invalid;
      expect(
        nhm2SphericalBosonStarNewtonianSeedDirectedProofV1Violations(numeric),
      ).toEqual(["invalid_number:/preconditioner/auditCutoff"]);
    }

    const bigint = clone();
    bigint.extra = 1n;
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofV1Violations(bigint),
    ).toEqual(["non_json_value:/extra"]);

    const nonPlain = clone();
    nonPlain.extra = Object.create(null);
    expect(
      nhm2SphericalBosonStarNewtonianSeedDirectedProofV1Violations(nonPlain),
    ).toEqual(["non_plain_object:/extra"]);
  });
});
