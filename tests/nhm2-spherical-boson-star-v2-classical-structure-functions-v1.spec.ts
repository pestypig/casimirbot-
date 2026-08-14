import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORMULAS,
} from "../shared/contracts/nhm2-semiclassical-v2-raw-replay-manifest.v1";
import {
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES,
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256,
} from "../shared/contracts/nhm2-semiclassical-v2-science-derivation-authority.v1";
import {
  NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS,
  NHM2_SEMICLASSICAL_CONSTRAINT_COMPONENT_ORDER,
} from "../shared/contracts/nhm2-semiclassical-state-realizability.v2";
import {
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-coherent-candidate-plan.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS,
  NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_BINDING_PINS,
  NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_VALIDATOR_LIMITS,
  cloneNhm2SphericalBosonStarV2ClassicalStructureFunctions,
  isNhm2SphericalBosonStarV2ClassicalStructureFunctionsV1,
  nhm2SphericalBosonStarV2ClassicalStructureFunctionsViolations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-classical-structure-functions.v1";

const deepFrozen = (value: unknown, seen = new Set<object>()): boolean => {
  if (value == null || typeof value !== "object" || seen.has(value)) {
    return true;
  }
  seen.add(value);
  return (
    Object.isFrozen(value) &&
    Reflect.ownKeys(value).every((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return descriptor == null ||
        !("value" in descriptor) ||
        typeof descriptor.value !== "object" ||
        descriptor.value == null
        ? true
        : deepFrozen(descriptor.value, seen);
    })
  );
};

describe("NHM2 spherical boson-star v2 classical structure functions v1", () => {
  it("has stable canonical bytes and a domain-separated digest", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_SHA256,
    ).toBe("d6f12f0703f5b756c8c08c424f3af8c06990b59005f404691b5b20f6e71ce700");
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CANONICAL_SIZE_BYTES,
    ).toBe(8870);
    expect(
      Buffer.byteLength(
        NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CANONICAL_JSON,
        "utf8",
      ),
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CANONICAL_SIZE_BYTES,
    );
    expect(
      createHash("sha256")
        .update(
          NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_SHA256_DOMAIN,
          "utf8",
        )
        .update(
          NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    ).toBe(NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_SHA256);
    expect(
      isNhm2SphericalBosonStarV2ClassicalStructureFunctionsV1(
        cloneNhm2SphericalBosonStarV2ClassicalStructureFunctions(),
      ),
    ).toBe(true);
    expect(
      deepFrozen(NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS),
    ).toBe(true);
  });

  it("exact-binds the source plan, v2 candidate freeze, replay policy and DAG", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS;
    const pins =
      NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_BINDING_PINS;
    expect(NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256).toBe(
      pins.sourceCandidatePlanSha256,
    );
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256).toBe(
      pins.v2CandidateFreezeSha256,
    );
    expect(
      NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
    ).toMatchObject({
      sha256: pins.approvedV2ReplayPolicySha256,
      sizeBytes: pins.approvedV2ReplayPolicySizeBytes,
    });
    expect(NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256).toBe(
      pins.scienceDerivationDagSha256,
    );
    expect(
      contract.exactSourceBindings.sphericalCoherentCandidatePlan,
    ).toMatchObject({
      sha256: pins.sourceCandidatePlanSha256,
      canonicalSizeBytes: pins.sourceCandidatePlanCanonicalSizeBytes,
    });
    expect(contract.exactSourceBindings.v2CandidateFreeze).toMatchObject({
      sha256: pins.v2CandidateFreezeSha256,
      canonicalSizeBytes: pins.v2CandidateFreezeCanonicalSizeBytes,
    });
    expect(contract.candidateIdentity.candidateId).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE.candidateIdentity
        .candidateId,
    );
  });

  it("copies only the three already-frozen candidate target formulas in exact family order", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS;
    const source =
      NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN.totalConstraintDuty
        .targetConstruction;
    expect(contract.classicalDiracTargets.familyOrder).toEqual([
      ...NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS,
    ]);
    expect(
      contract.classicalDiracTargets.families.map(
        ({ ordinal, bracketId, targetFormula }) => ({
          ordinal,
          bracketId,
          targetFormula,
        }),
      ),
    ).toEqual([
      { ordinal: 0, bracketId: "H_H", targetFormula: source.H_H },
      { ordinal: 1, bracketId: "H_Hi", targetFormula: source.H_Hi },
      { ordinal: 2, bracketId: "Hi_Hj", targetFormula: source.Hi_Hj },
    ]);
    expect(contract.classicalDiracTargets).toMatchObject({
      exactSourceFormulaCopy: true,
      additionalCandidateSpecificFormulaAllowed: false,
    });
  });

  it("freezes target array component order and barred input-only normalization", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS;
    const source = NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN;
    expect(contract.targetArrayInterface).toMatchObject({
      valuesPresent: false,
      familyOrder: ["H_H", "H_Hi", "Hi_Hj"],
      sampleCount: 64,
      shape: [64, 4],
      storageOrder: "row-major",
      componentOrder: [...NHM2_SEMICLASSICAL_CONSTRAINT_COMPONENT_ORDER],
      rolePattern: "constraint_bracket.{bracket_id}.target",
      unit: "dimensionless",
      noComponentMixing: true,
    });
    expect(contract.normalization).toMatchObject({
      coordinates: source.totalConstraintDuty.normalization.coordinates,
      scalar: source.totalConstraintDuty.normalization.scalar,
      generatorDefinition:
        source.totalConstraintDuty.normalization.generatorDefinition,
      scale: source.totalConstraintDuty.normalization.scale,
      normalizedValue: source.totalConstraintDuty.normalization.normalizedValue,
      inputOnly: true,
      outputDependentRescalingAllowed: false,
      targetUnit: "dimensionless",
      v2ReplayResidualFormula:
        NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORMULAS.bracketResidual,
    });
  });

  it("freezes only approved geometry/chart/sampling/formulation probe dependencies", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS;
    const expectedEdges =
      NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES.filter(
        ({ to }) => to === "classical_bracket_targets_witness",
      );
    expect(contract.probeDependencies.approvedWitnessEdges).toEqual(
      expectedEdges,
    );
    expect(
      contract.probeDependencies.requiredScientificInputIdsInApprovedOrder,
    ).toEqual([
      "constraint_formulation",
      "classical_structure_functions",
      "geometry",
      "chart",
      "sampling_basis",
    ]);
    expect(
      contract.probeDependencies.externalScientificInputIdsInApprovedOrder,
    ).toEqual([
      "constraint_formulation",
      "geometry",
      "chart",
      "sampling_basis",
    ]);
    expect(contract.probeDependencies.formulaProbeSymbolsByFamily).toEqual({
      H_H: ["N", "M"],
      H_Hi: ["X", "N"],
      Hi_Hj: ["X", "Y"],
    });
    expect(contract.probeDependencies).toMatchObject({
      probeBindingsRequiredFromConstraintFormulationChartAndSamplingBasis: true,
      probeVariationalTreatmentSpecifiedByThisContract: false,
      probeValuesInventedOrMaterializedByThisContract: false,
      targetEvaluationAuthorizedByThisContract: false,
    });
  });

  it("forbids target construction from consuming computed or residual arrays", () => {
    const rule =
      NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS.targetInputRule;
    expect(rule).toMatchObject({
      targetMayReadComputedOrResidualArrays: false,
      computedArrayMayBeUsedAsTargetInput: false,
      residualArrayMayBeUsedAsTargetInput: false,
      targetArrayMayBeEchoedAsComputedInput: false,
      serverResidualRecomputeFormula:
        "normalized_residual=normalized_computed-normalized_classical_structure_function_target",
      residualMustBeRecomputedAfterIndependentComputedAndTargetMaterialization: true,
    });
    expect(rule.forbiddenTargetInputRoles).toEqual([
      "constraint_bracket.H_H.computed",
      "constraint_bracket.H_H.residual",
      "constraint_bracket.H_Hi.computed",
      "constraint_bracket.H_Hi.residual",
      "constraint_bracket.Hi_Hj.computed",
      "constraint_bracket.Hi_Hj.residual",
    ]);
  });

  it("is preexecution science only and leaves every authority and physical lock false", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS;
    expect(contract.materialization).toMatchObject({
      canonicalScienceBytesPresent: true,
      frozenBeforeCandidateExecution: true,
      candidateExecutionObserved: false,
      targetValuesPresent: false,
      outputArraysPresent: false,
      solveReceipt: null,
      replayReceipt: null,
      independentAgreementReceipt: null,
    });
    expect(Object.values(contract.executionBoundary)).toEqual(
      Array(10).fill(false),
    );
    expect(Object.values(contract.authorityLocks)).toEqual(
      Array(
        Object.keys(
          NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_AUTHORITY_LOCKS,
        ).length,
      ).fill(false),
    );
    expect(contract.declaredLeverBoundary).toEqual({
      sourceMode: "state_derived_not_declared_lever",
      declaredLeverTensorUsed: false,
      declaredTileTensorUsed: false,
      declaredLeverOrTileTensorAcceptedAsProbe: false,
    });
  });

  it("rejects semantic drift, forbidden surfaces, proxies and invalid numbers", () => {
    const drift =
      cloneNhm2SphericalBosonStarV2ClassicalStructureFunctions() as unknown as Record<
        string,
        unknown
      >;
    (
      drift.candidateIdentity as Record<string, unknown>
    ).declaredLeverOrTileTensorUsed = true;
    expect(
      nhm2SphericalBosonStarV2ClassicalStructureFunctionsViolations(drift),
    ).toContain("spherical_v2_classical_structure_functions_semantic_drift");

    const proxy = new Proxy(
      cloneNhm2SphericalBosonStarV2ClassicalStructureFunctions(),
      {},
    );
    expect(
      nhm2SphericalBosonStarV2ClassicalStructureFunctionsViolations(proxy),
    ).toEqual(["proxy_forbidden:/"]);

    const negativeZero =
      cloneNhm2SphericalBosonStarV2ClassicalStructureFunctions() as unknown as Record<
        string,
        unknown
      >;
    (negativeZero.targetArrayInterface as Record<string, unknown>).sampleCount =
      -0;
    expect(
      nhm2SphericalBosonStarV2ClassicalStructureFunctionsViolations(
        negativeZero,
      )[0],
    ).toContain("invalid_number:");

    const accessor =
      cloneNhm2SphericalBosonStarV2ClassicalStructureFunctions() as unknown as Record<
        string,
        unknown
      >;
    Object.defineProperty(accessor, "authority", {
      get: () => "canonical_pre_execution_scientific_input_bytes_only",
      enumerable: true,
    });
    expect(
      nhm2SphericalBosonStarV2ClassicalStructureFunctionsViolations(
        accessor,
      )[0],
    ).toContain("object_entry_surface:");
  });

  it("enforces bounded plain-data validation", () => {
    const limits =
      NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_VALIDATOR_LIMITS;
    const huge =
      cloneNhm2SphericalBosonStarV2ClassicalStructureFunctions() as unknown as Record<
        string,
        unknown
      >;
    huge.authority = "x".repeat(limits.maximumStringUtf8Bytes + 1);
    expect(
      nhm2SphericalBosonStarV2ClassicalStructureFunctionsViolations(huge)[0],
    ).toContain("string_byte_limit:");

    const symbolKey =
      cloneNhm2SphericalBosonStarV2ClassicalStructureFunctions() as unknown as Record<
        PropertyKey,
        unknown
      >;
    symbolKey[Symbol("hidden")] = true;
    expect(
      nhm2SphericalBosonStarV2ClassicalStructureFunctionsViolations(
        symbolKey,
      )[0],
    ).toContain("object_surface:");
  });
});
