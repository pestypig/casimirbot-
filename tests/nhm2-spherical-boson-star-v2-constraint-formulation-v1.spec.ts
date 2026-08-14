import { describe, expect, it } from "vitest";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION,
  NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_SHA256,
  validateNhm2SphericalBosonStarV2ConstraintFormulationV1,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-constraint-formulation.v1";

const clone = (): unknown =>
  JSON.parse(
    JSON.stringify(NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION),
  );

describe("spherical boson-star v2 constraint formulation", () => {
  it("freezes the candidate-specific total phase space and all terms", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION.canonicalPhaseSpace
        .gravityVariables,
    ).toEqual(["qbar_ab", "pibar^ab"]);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION.generators
        .requiredTerms,
    ).toEqual([
      "gravity",
      "coherent_mean_field",
      "renormalized_vacuum",
      "gravity_matter_cross_variations",
      "state_and_geometry_functional_variations",
      "structure_function_targets",
    ]);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION.canonicalPhaseSpace
        .fixedStateDuringGravityVariationAllowed,
    ).toBe(false);
  });

  it("freezes probes before bracket evaluation and keeps them external during every variation", () => {
    const probes =
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION.spatialProbeDefinition;
    expect(probes.constructionAndSeal).toContain(
      "before_either_constraint_implementation_starts",
    );
    expect(probes.variationalTreatment).toContain(
      "nested_Poissonbar_variation",
    );
    expect(probes.metricVariationThroughProbeNormalizationAllowed).toBe(false);
    expect(probes.probeArtifactSha256).toBeNull();
  });

  it("freezes exact Dirac targets and the independent residual chronology", () => {
    const targets =
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION.classicalDiracTargets;
    expect(targets.H_H).toContain(
      "qbar^ab*(N*partialbar_b(M)-M*partialbar_b(N))",
    );
    expect(targets.H_Hi).toContain("-Hbar_total[X^a*partialbar_a(N)]");
    expect(targets.Hi_Hj).toContain(
      "X^b*partialbar_b(Y^a)-Y^b*partialbar_b(X^a)",
    );
    expect(targets.targetMayReadComputedOrResidualArrays).toBe(false);
    expect(targets.computedMayReadTargetOrResidualArrays).toBe(false);
    expect(targets.residualRecomputedServerSide).toBe(
      "normalized_residual=normalized_computed-normalized_classical_structure_function_target",
    );
  });

  it("freezes the full 64 by 4 bracket and identity interface", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION.bracketOperands.shape,
    ).toEqual([64, 4]);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION.bracketOperands
        .componentOrder,
    ).toEqual(["hamiltonian", "momentum_x", "momentum_y", "momentum_z"]);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION.identityOperands
        .antisymmetry,
    ).toContain("forward+reverse");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION.identityOperands
        .jacobi,
    ).toContain("term_1+term_2+term_3");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION.identityOperands
        .probeTriples.momentumZ,
    ).toContain("u_p,z*chi_p*e_x");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION.identityOperands
        .everyInnerOuterAndReverseBracketSeparatelyEvaluated,
    ).toBe(true);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION.identityOperands
        .finiteProbeCoverageProvesFullFunctionalIdentity,
    ).toBe(false);
  });

  it("records the exact missing computed-side derivation edges without claiming approval", () => {
    const derivation =
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION.derivationAuthority;
    expect(derivation.baseDagSufficientForComputedBracketWitness).toBe(false);
    expect(
      derivation.candidateSpecificRequiredEdgeOverlay.map(({ from }) => from),
    ).toEqual(["geometry", "chart", "sampling_basis"]);
    expect(derivation.overlayApprovedByCurrentDerivationAuthority).toBe(false);
    expect(derivation.derivationAuthoritySuccessorRequired).toBe(true);
    expect(derivation.complete).toBe(false);
  });

  it("is sealed and all authority remains false", () => {
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_SHA256).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_EXPECTED_SHA256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_BINDING.sha256,
    ).toBe(NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_SHA256);
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_AUTHORITY_LOCKS,
      ).every((value) => value === false),
    ).toBe(true);
  });

  it("accepts only the exact bounded plain descriptor", () => {
    expect(
      validateNhm2SphericalBosonStarV2ConstraintFormulationV1(clone()),
    ).toEqual({ ok: true });
    const changed = clone() as Record<string, unknown>;
    (
      changed.candidateIdentity as Record<string, unknown>
    ).declaredLeverOrTileTensorUsed = true;
    expect(
      validateNhm2SphericalBosonStarV2ConstraintFormulationV1(changed),
    ).toEqual({ ok: false, violation: "semantic_mismatch" });
    expect(
      validateNhm2SphericalBosonStarV2ConstraintFormulationV1(
        new Proxy({}, {}),
      ),
    ).toEqual({ ok: false, violation: "non_plain_or_cyclic" });
  });

  it("rejects accessors, cycles, nonfinite numbers, negative zero, sparse arrays, and oversized data", () => {
    const accessor = clone() as Record<string, unknown>;
    Object.defineProperty(accessor, "maturity", {
      enumerable: true,
      get: () => "bad",
    });
    expect(
      validateNhm2SphericalBosonStarV2ConstraintFormulationV1(accessor).ok,
    ).toBe(false);
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(
      validateNhm2SphericalBosonStarV2ConstraintFormulationV1(cyclic).ok,
    ).toBe(false);
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, -0]) {
      expect(
        validateNhm2SphericalBosonStarV2ConstraintFormulationV1(value).ok,
      ).toBe(false);
    }
    const sparse = new Array(2);
    sparse[1] = 1;
    expect(
      validateNhm2SphericalBosonStarV2ConstraintFormulationV1(sparse).ok,
    ).toBe(false);
    expect(
      validateNhm2SphericalBosonStarV2ConstraintFormulationV1(
        "x".repeat(40_000),
      ).ok,
    ).toBe(false);
  });

  it("is deeply frozen and cannot import candidate observations", () => {
    expect(
      Object.isFrozen(NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION),
    ).toBe(true);
    expect(
      Object.isFrozen(
        NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION
          .spatialProbeDefinition.fixedVectors.v,
      ),
    ).toBe(true);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION.materialization
        .arraysPresent,
    ).toBe(false);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION.materialization
        .replayReceipt,
    ).toBeNull();
  });
});
