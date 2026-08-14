import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import * as observablesModule from "../nhm2-conformally-flat-needle-fixed-background-observables.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CANONICAL_JSON,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CLAIM_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTENT_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTENT_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_REFERENCE_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_REFERENCE_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
  isNhm2ConformallyFlatNeedleFixedBackgroundObservablesV1,
  nhm2ConformallyFlatNeedleFixedBackgroundObservablesViolations,
} from "../nhm2-conformally-flat-needle-fixed-background-observables.v1";
import { NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE } from "../nhm2-conformally-flat-needle-scalar-reference.v1";

const clone = (): any =>
  structuredClone(NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES);

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

const binding = (value: unknown) => {
  const bytes = Buffer.from(canonicalJson(value), "utf8");
  return {
    sha256: createHash("sha256").update(bytes).digest("hex"),
    sizeBytes: bytes.byteLength,
  };
};

const isDeepFrozen = (value: unknown, seen = new Set<object>()): boolean => {
  if (value == null || typeof value !== "object") return true;
  if (seen.has(value)) return true;
  seen.add(value);
  return (
    Object.isFrozen(value) &&
    Reflect.ownKeys(value).every((key) =>
      isDeepFrozen((value as Record<PropertyKey, unknown>)[key], seen),
    )
  );
};

describe("nhm2_conformally_flat_needle_fixed_background_observables/v1", () => {
  it("exports one exact deeply frozen blocked contract and no authority builder", () => {
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundObservablesViolations(
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
      ),
    ).toEqual([]);
    expect(
      isNhm2ConformallyFlatNeedleFixedBackgroundObservablesV1(
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
      ),
    ).toBe(true);
    expect(
      isDeepFrozen(NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES),
    ).toBe(true);
    expect(
      Object.keys(observablesModule).filter((name) =>
        /^(?:build|create|issue|promote)/i.test(name),
      ),
    ).toEqual([]);
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES.content.status,
    ).toBe("blocked_pending_renormalization_convention_freeze");
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES.content
        .executionAdmissible,
    ).toBe(false);
  });

  it("binds the exact canonical reference bytes, contract content, and exported contract bytes", () => {
    const contract = NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES;
    const reference = binding(NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE);
    expect(contract.content.referenceBinding).toMatchObject({
      canonicalSha256: reference.sha256,
      canonicalSizeBytes: reference.sizeBytes,
      canonicalization: "utf8_lexicographic_object_keys_json_v1",
      exactReferenceRequired: true,
    });
    expect(reference).toEqual({
      sha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_REFERENCE_EXPECTED_SHA256,
      sizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_REFERENCE_EXPECTED_SIZE_BYTES,
    });
    expect(contract.contentBinding).toMatchObject(binding(contract.content));
    expect(contract.contentBinding).toMatchObject({
      sha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTENT_EXPECTED_SHA256,
      sizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTENT_EXPECTED_SIZE_BYTES,
    });
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
    ).toBe(
      createHash("sha256")
        .update(
          NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_EXPECTED_SHA256,
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
    ).toBe(
      Buffer.byteLength(
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CANONICAL_JSON,
        "utf8",
      ),
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_EXPECTED_SIZE_BYTES,
    );
  });

  it("freezes geometry, state, chart, tetrad, all 64 samples, and smearing by exact identities", () => {
    const identities =
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES.content
        .frozenInputIdentities;
    expect(identities.geometry).toMatchObject({
      geometryId: "conformally_flat_needle_reference",
      ...binding(NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.geometry),
    });
    expect(identities.state).toMatchObject({
      stateId: "conformal_minkowski_vacuum",
      stateClass: "quasifree_hadamard",
      ...binding(NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.state),
    });
    expect(identities.chart).toMatchObject({
      chartId: "inertial_conformal_X0_X_Y_Z",
      coordinates: ["X0=c*T", "X", "Y", "Z"],
    });
    expect(identities.tetrad.tetradId).toBe(
      "global_pulled_back_conformal_inertial_tetrad",
    );
    expect(identities.samples).toMatchObject({
      count: 64,
      enumerationOrder: ["z_outer", "y_middle", "x_inner"],
      ...binding(
        NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.sampling.samplePoints,
      ),
    });
    expect(identities.smearing).toMatchObject({
      smearingId: "normalized_C_infinity_spacetime_product_bumps_v1",
      ...binding(
        NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE.sampling.smearing,
      ),
    });
  });

  it("permits only a state-derived source and treats coordinate flow as a pure diffeomorphism", () => {
    const source =
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES.content
        .sourceBoundary;
    expect(source).toMatchObject({
      sourceMode: "state_derived_quantum_expectation",
      declaredLeverTensorPresent: false,
      declaredLeverTensorInputAllowed: false,
      declaredLeverTensorForbidden: true,
      metricDemandSubstitutionForQuantumExpectationAllowed: false,
      coordinateFlow: {
        kind: "pure_coordinate_compact_y_flow",
        pureDiffeomorphism: true,
        materialMotion: false,
        actuation: false,
        propulsionInterpretationAllowed: false,
      },
    });
  });

  it("records all fixed point-splitting choices while refusing to invent the unresolved conservation and Box R convention", () => {
    const convention =
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES.content
        .renormalizationConventionPlan;
    expect(convention).toMatchObject({
      status: "blocked_pending_renormalization_convention_freeze",
      authoritativeConventionFrozen: false,
      primarySourceAudit: {
        sourceVersion: "arXiv:gr-qc/0109048v2",
        equationAnchors: ["10", "18", "19", "20", "21", "22"],
        authoritativelySelectsProjectConvention: false,
      },
      conventionPiecesAlreadyFixed: {
        metricSignature: "(-,+,+,+)",
        proposalsPrimarySourceCrosschecked: false,
        hadamardLengthScale: { symbol: "ell", value: 1, unit: "m" },
      },
      pointSplitProposal: {
        morettiBaselineSelectedForExecution: false,
        hadamardParametrixNormalization: null,
        twoPointHadamardRelativeNormalization: null,
        improvedOperatorParameter: {
          spacetimeDimension: 4,
          formula: "eta=D/(2*(D+2))",
          numerator: 1,
          denominator: 3,
        },
        exactBidifferentialOperatorFormula: null,
        conservationCorrectionFormula: null,
        conservationCorrectionCoefficient: null,
        executionAllowedWithNullFormulaOrCoefficient: false,
      },
      finiteBasisPolicy: {
        namedCoefficientsFixedToZero: true,
        unnamedTermsAllowed: false,
        variationalSignNormalizationPrimarySourceCrosschecked: false,
      },
      traceAnomalyCrossCheckOnly: {
        authoritative: false,
        boxRCoefficientSchemeDependent: true,
        sealedForExecution: false,
      },
    });
    expect(
      convention.finiteWaldAmbiguityBasis.map(({ name, coefficient }) => ({
        name,
        coefficient,
      })),
    ).toEqual([
      { name: "g_ab", coefficient: 0 },
      { name: "G_ab", coefficient: 0 },
      { name: "I_ab", coefficient: 0 },
      { name: "J_ab", coefficient: 0 },
    ]);
    expect(convention.exactChoiceNeededBeforeExecution).toHaveLength(7);
  });

  it("freezes disjoint implementation lineages and a fail-closed deterministic numeric plan", () => {
    const content =
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES.content;
    expect(content.implementationSeparation.primary).toMatchObject({
      meanAlgorithm: "anomaly_wess_zumino_local_curvature_with_Arb_balls",
      noiseAlgorithm: "spectral_mode_noise_kernel_with_rigorous_tail_bounds",
      status: "absent",
    });
    expect(content.implementationSeparation.independent).toMatchObject({
      meanAlgorithm: "direct_Hadamard_point_split_with_AD_and_MPFR_intervals",
      noiseAlgorithm:
        "independent_two_particle_phase_space_bilocal_integration",
      status: "absent",
    });
    expect(content.implementationSeparation.lineagePolicy).toMatchObject({
      sharedDerivedSourceFilesAllowed: false,
      sharedEquationTranscriptionAllowed: false,
      sharedRuntimeAllowed: false,
      sharedDependencyGraphAllowed: false,
      sharedExecutableAllowed: false,
      onlyFrozenContractAndExactInputBytesMayBeShared: true,
    });
    expect(content.deterministicNumericsPlan).toMatchObject({
      policyVersion: "needle_fixed_background_interval_policy/v1_pending",
      policyFrozen: false,
      postFreezeMutationAllowed: false,
      precisionLadderBits: [192, 256, 384],
      spectralCutoffK: null,
      tailDerivativeOrder: 12,
      integrationByPartsOrder: 12,
      cubatureRuleId: null,
      maximumAdaptiveCells: null,
      maximumFunctionEvaluations: null,
      maximumWallClockMs: null,
      refinementDeltaAloneIsProof: false,
      workLimitDisposition: "fail_candidate_without_retuning",
      nullBudgetValuesExecutionAllowed: false,
    });
  });

  it("allows only fixed-background mean, noise, uncertainties, weights, and non-authoritative sidecars", () => {
    const output =
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES.content
        .outputBoundary;
    expect(output.allowedArrayOutputs.map((entry) => entry.role)).toEqual([
      "fixed_background_mean_rset",
      "fixed_background_mean_rset_absolute_uncertainty95",
      "fixed_background_connected_noise_kernel",
      "fixed_background_connected_noise_absolute_uncertainty95",
      "fixed_background_sample_weights",
    ]);
    expect(output.allowedArrayOutputs.map((entry) => entry.shape)).toEqual([
      [64, 10],
      [64, 10],
      [64, 64, 100],
      [64, 64, 100],
      [64],
    ]);
    expect(output.sidecarSchemas).toHaveLength(3);
    expect(output.sidecarsAreAuthorityByThemselves).toBe(false);
    expect(output.constraintArraysAuthorized).toBe(false);
    expect(output.forbiddenArrayRoles).toEqual([
      "H",
      "H_i",
      "hamiltonian_constraint",
      "momentum_constraint",
      "constraint_bracket",
      "constraint_antisymmetry",
      "constraint_jacobi",
    ]);
  });

  it("keeps the Ward identity diagnostic distinct from full ADM constraint closure", () => {
    const boundary =
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES.content
        .constraintBoundary;
    expect(boundary.fixedBackgroundWardIdentity).toEqual({
      target: "nabla^a<T_ab>_ren=0_on_the_frozen_background",
      diagnosticOnly: true,
      status: "blocked_not_computed",
      establishesFullConstraintClosure: false,
    });
    expect(boundary.fullAdmConstraintClosure).toBe(false);
    expect(boundary.fullHamiltonianGeneratorDerived).toBe(false);
    expect(boundary.fullMomentumGeneratorsDerived).toBe(false);
    expect(boundary.fullPoissonBracketStructureFunctionsDerived).toBe(false);
    expect(boundary.exactBlockers).toEqual([
      "full_adm_constraint_theory_not_selected",
      "retarded_commutator_and_contact_kernel_absent",
      "canonical_phase_space_and_ordering_absent",
      "constraint_target_and_joint_uncertainty_absent",
    ]);
  });

  it("preserves the exact blocker set and every diagnostic, lamp, theory, physical, and certificate lock", () => {
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES.content
        .authority.blockers,
    ).toEqual(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_BLOCKERS,
    );
    expect(
      Object.values(
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CLAIM_LOCKS,
      ),
    ).not.toContain(true);
    for (const key of Object.keys(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CLAIM_LOCKS,
    )) {
      const value = clone();
      value.content.claimLocks[key] = true;
      expect(
        nhm2ConformallyFlatNeedleFixedBackgroundObservablesViolations(value),
        key,
      ).toContain(`claim_lock_must_remain_false:${key}`);
    }
  });

  it("rejects extra and missing keys at every exact-contract boundary", () => {
    const extra = clone();
    extra.content.promoted = true;
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundObservablesViolations(extra),
    ).toContain("extra_key:/content/promoted");

    const missing = clone();
    delete missing.content.frozenInputIdentities.smearing;
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundObservablesViolations(missing),
    ).toContain("missing_key:/content/frozenInputIdentities/smearing");
  });

  it("rejects proxies, accessors, symbols, and non-plain values before semantic validation", () => {
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundObservablesViolations(
        new Proxy(clone(), {}),
      ),
    ).toEqual(["proxy_forbidden:/"]);

    const accessor = clone();
    Object.defineProperty(accessor.content, "status", {
      enumerable: true,
      get: () => "blocked_pending_renormalization_convention_freeze",
    });
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundObservablesViolations(accessor),
    ).toEqual(["accessor_or_hidden_property_forbidden:/content/status"]);

    const symbol = clone();
    symbol.content[Symbol("hidden-authority")] = true;
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundObservablesViolations(symbol),
    ).toEqual(["symbol_key_forbidden:/content"]);

    const forbiddenKey = clone();
    Object.defineProperty(forbiddenKey.content, "__proto__", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: { promoted: true },
    });
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundObservablesViolations(
        forbiddenKey,
      ),
    ).toEqual(["forbidden_data_key:/content/__proto__"]);

    const inherited = Object.assign(Object.create({ promoted: true }), clone());
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundObservablesViolations(inherited),
    ).toEqual(["non_plain_object:/"]);
  });

  it("rejects lever admission, constraint-shaped arrays, and any tolerance-policy mutation", () => {
    const lever = clone();
    lever.content.sourceBoundary.declaredLeverTensorPresent = true;
    lever.content.sourceBoundary.declaredLeverTensorInputAllowed = true;
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundObservablesViolations(lever),
    ).toContain("declared_lever_tensor_forbidden");

    const constraint = clone();
    constraint.content.outputBoundary.allowedArrayOutputs.push({
      role: "H_i_constraint_array",
      shape: [64],
      unit: "forbidden",
      encoding: "raw_ieee754_float64_little_endian",
    });
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundObservablesViolations(constraint),
    ).toContain("constraint_arrays_forbidden");

    const tolerance = clone();
    tolerance.content.deterministicNumericsPlan.precisionLadderBits[0] = 128;
    tolerance.content.deterministicNumericsPlan.spectralCutoffK = 1024;
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundObservablesViolations(tolerance),
    ).toContain("deterministic_numeric_policy_drift");
  });
});
