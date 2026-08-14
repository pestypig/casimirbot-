import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import * as pairAgreementModule from "../nhm2-conformally-flat-needle-fixed-background-pair-agreement.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_CANONICAL_JSON,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_CLAIM_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_CONTENT_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_CONTENT_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_EXPECTED_OBSERVABLES_BINDING,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_OBSERVABLE_OUTPUTS_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_OBSERVABLE_OUTPUTS_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_SIZE_BYTES,
  type Nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementV1,
  canonicalNhm2ConformallyFlatNeedleFixedBackgroundPairAgreementJson,
  isNhm2ConformallyFlatNeedleFixedBackgroundPairAgreementV1,
  nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementViolations,
} from "../nhm2-conformally-flat-needle-fixed-background-pair-agreement.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
} from "../nhm2-conformally-flat-needle-fixed-background-observables.v1";

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

const binding = (value: unknown) => {
  const canonical = canonicalJson(value);
  return {
    sha256: createHash("sha256").update(canonical, "utf8").digest("hex"),
    sizeBytes: Buffer.byteLength(canonical, "utf8"),
  };
};

const clone = (): any =>
  structuredClone(NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT);

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

describe("nhm2_conformally_flat_needle_fixed_background_pair_agreement_policy/v1", () => {
  it("exports one deeply frozen policy plan with no builder, issuer, or receipt authority", () => {
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementViolations(
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT,
      ),
    ).toEqual([]);
    expect(
      isNhm2ConformallyFlatNeedleFixedBackgroundPairAgreementV1(
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT,
      ),
    ).toBe(true);
    expect(
      isDeepFrozen(
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT,
      ),
    ).toBe(true);
    expect(
      Object.keys(pairAgreementModule).filter((name) =>
        /^(?:build|create|issue|promote)|receipt/i.test(name),
      ),
    ).toEqual([]);

    const content =
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT.content;
    expect(content).toMatchObject({
      maturity: "diagnostic_pair_agreement_policy_plan_only",
      status: "blocked_missing_frozen_tolerances_and_pair_evidence",
      executionAdmissible: false,
      authorityBoundary: {
        policyPlanOnly: true,
        builderExported: false,
        issuerAuthority: false,
        receiptAuthority: false,
        pairAgreementAuthority: false,
      },
    });
  });

  it("binds the exact observables contract without importing or depending on a run plan", () => {
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_EXPECTED_OBSERVABLES_BINDING,
    ).toEqual({
      artifactId:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_ARTIFACT_ID,
      contractVersion:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTRACT_VERSION,
      sha256: NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
      sizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
      canonicalization: "utf8_lexicographic_object_keys_json_v1",
    });
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT.content
        .observablesBinding,
    ).toMatchObject(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_EXPECTED_OBSERVABLES_BINDING,
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT.content
        .relationship,
    ).toEqual({
      kind: "separate_additive_policy_over_exact_observables_contract",
      mutatesObservablesContract: false,
      runPlanDependency: null,
      runPlanImported: false,
      futureRunPlanMayBindThisPolicyByExactHash: true,
      futureRunPlanMayOverrideThisPolicy: false,
    });
  });

  it("pins the imported output boundary, policy content, and full contract to literal bytes", () => {
    const contract =
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT;
    const observableOutputs = binding(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES.content
        .outputBoundary.allowedArrayOutputs,
    );

    expect(observableOutputs).toEqual({
      sha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_OBSERVABLE_OUTPUTS_EXPECTED_SHA256,
      sizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_OBSERVABLE_OUTPUTS_EXPECTED_SIZE_BYTES,
    });
    expect(observableOutputs).toEqual({
      sha256:
        "fe7f02dceeb72b9644270debb0b3430d04c6a658a12c892037c1d6d026e97264",
      sizeBytes: 660,
    });
    expect(
      contract.content.observablesBinding.outputBoundaryBinding,
    ).toMatchObject(observableOutputs);

    expect(binding(contract.content)).toEqual({
      sha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_CONTENT_EXPECTED_SHA256,
      sizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_CONTENT_EXPECTED_SIZE_BYTES,
    });
    expect(binding(contract.content)).toEqual({
      sha256:
        "4bbdf624e9236a0a73b04e58e17ab524c1312818db67cb26d10755bcd545f73c",
      sizeBytes: 8399,
    });
    expect(contract.contentBinding).toMatchObject(binding(contract.content));

    expect(binding(contract)).toEqual({
      sha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_EXPECTED_SHA256,
      sizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_EXPECTED_SIZE_BYTES,
    });
    expect(binding(contract)).toEqual({
      sha256:
        "db54b1887cf7c73f0da7fa912bde63a6c9e14ab4d9c6c5b699cff180e5404075",
      sizeBytes: 8847,
    });
  });

  it("covers only the five frozen fixed-background roles and forbids constraints and lever inputs", () => {
    const scope =
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT.content
        .comparisonScope;
    expect(scope.exactAllowedRoles).toEqual([
      "fixed_background_mean_rset",
      "fixed_background_mean_rset_absolute_uncertainty95",
      "fixed_background_connected_noise_kernel",
      "fixed_background_connected_noise_absolute_uncertainty95",
      "fixed_background_sample_weights",
    ]);
    expect(scope).toMatchObject({
      roleOrderMustMatchObservablesContract: true,
      everyArrayElementComparedExactlyOnce: true,
      declaredLeverTensorPresent: false,
      declaredLeverTensorAllowed: false,
      declaredLeverTensorForbidden: true,
      constraintArrayRolesAllowed: false,
      constraintComparisonAllowed: false,
    });
    expect(scope.forbiddenRolePatterns).toEqual(
      expect.arrayContaining([
        "^H$",
        "^H_i$",
        "constraint",
        "hamiltonian",
        "momentum",
        "antisymmetry",
        "jacobi",
      ]),
    );
  });

  it("freezes componentwise comparison and inclusive interval overlap without norm averaging", () => {
    const content =
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT.content;
    expect(content.scalarComparison).toEqual({
      formula:
        "abs(x_primary-x_independent)<=A+R*max(abs(x_primary),abs(x_independent))+u_primary+u_independent",
      deltaDefinition: "abs(x_primary-x_independent)",
      scaleDefinition: "max(abs(x_primary),abs(x_independent))",
      budgetDefinition:
        "A+R*max(abs(x_primary),abs(x_independent))+u_primary+u_independent",
      componentwiseEveryScalarMustPass: true,
      comparisonSymmetricUnderLaneSwap: true,
      sampleWeightUncertaintyConvention:
        "u_primary=u_independent=0_for_fixed_background_sample_weights",
      normAggregationAllowed: false,
      meanAggregationAllowed: false,
      rmsAggregationAllowed: false,
      averagingCanRescueFailedComponent: false,
      worstComponentOnlySufficient: false,
      everyInputAndDerivedScalarMustBeFinite: true,
      derivedOverflowOrNonfiniteDisposition: "blocked",
    });
    expect(content.intervalOverlap).toEqual({
      formula:
        "max(x_primary-u_primary,x_independent-u_independent)<=min(x_primary+u_primary,x_independent+u_independent)",
      requiredForEveryMeanAndNoiseValueComponent: true,
      inclusiveEndpoints: true,
      pairPassRequiresBothBudgetFormulaAndIntervalOverlap: true,
      producerSuppliedOverlapBooleanAuthoritative: false,
      serverReplayFromDetachedArraysRequired: true,
      missingInvalidOrNonfiniteEndpointDisposition: "blocked",
    });
  });

  it("freezes finite nonnegative uncertainty validation and the factor-four rule while leaving absolute floors null", () => {
    const uncertainty =
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT.content
        .uncertaintyValidation;
    expect(uncertainty).toMatchObject({
      finiteRequired: true,
      nonnegativeRequired: true,
      independentlyDerivedRequired: true,
      independentlyServerReplayedRequired: true,
      agreementCannotEstablishCoverageByItself: true,
      coverageEvidenceRequiredBeforePairExecution: true,
      factorRule: {
        formula:
          "max(u_primary,u_independent)<=4*max(min(u_primary,u_independent),absolute_floor)",
        factorLimit: 4,
        absoluteFloorMustBeScaleDerivedAndPresealed: true,
        absoluteFloorByRole: {
          fixedBackgroundMeanRsetAbsoluteUncertainty95: null,
          fixedBackgroundConnectedNoiseAbsoluteUncertainty95: null,
        },
        nullAbsoluteFloorExecutionAllowed: false,
        factorRuleMustPassEveryUncertaintyComponent: true,
      },
    });
  });

  it("keeps every tolerance and item of pair evidence null and blocks post-observation retuning", () => {
    const content =
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT.content;
    expect(content.tolerancePlan).toMatchObject({
      status: "blocked_not_scale_derived_or_frozen",
      valuesFrozen: false,
      nullToleranceExecutionAllowed: false,
      producerSelectedToleranceAllowed: false,
      observedOutputSelectedToleranceAllowed: false,
    });
    for (const tolerance of Object.values(
      content.tolerancePlan.roleTolerances,
    )) {
      expect(tolerance).toMatchObject({
        absoluteToleranceA: null,
        relativeToleranceR: null,
        absoluteUncertaintyFactorFloor: null,
      });
    }
    expect(Object.values(content.evidence)).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
    expect(content.preregistrationAndRetuning).toMatchObject({
      postObservationToleranceRetuningAllowed: false,
      postFailureToleranceRetuningAllowed: false,
      postFailureNormAveragingAllowed: false,
      inPlaceMutationAllowed: false,
      anyToleranceOrRuleChangeRequiresNewContractVersion: true,
    });
  });

  it("requires the same frozen science and independently attested implementations, executables, runs, and roots", () => {
    const content =
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT.content;
    expect(content.sameFrozenScience).toMatchObject({
      exactObservablesContractBytesMustMatchBothLanes: true,
      exactScientificInputDescriptorBytesMustMatchBothLanes: true,
      exactScientificInputValueBytesMustMatchBothLanes: true,
      implementationInputBytesMustBeDistinct: true,
      serverObservedBindingsRequired: true,
      currentEvidence: null,
    });
    expect(content.lineageAndIsolation).toMatchObject({
      distinctImplementationIdRequired: true,
      distinctSourceSha256Required: true,
      distinctDependencyLockSha256Required: true,
      distinctExecutableSha256Required: true,
      distinctRunIdRequired: true,
      distinctOutputRootRequired: true,
      disjointOutputRootsRequired: true,
      crossLaneOutputReadForbidden: true,
      sharedDerivedScienceSourceFilesAllowed: false,
      sharedEquationTranscriptionAllowed: false,
      sharedGeneratedScienceCodeAllowed: false,
      sharedNumericalKernelAllowed: false,
      sharedDependencyGraphAllowed: false,
      sharedExecutableAllowed: false,
      sharedIntermediateCachesAllowed: false,
      sharedFourierOrQuadratureTablesAllowed: false,
      onlyExactContractSchemasAndFrozenScientificInputBytesMayBeShared: true,
    });
  });

  it("keeps every diagnostic, lamp, ADM, physical, propulsion, transport, and certificate claim locked", () => {
    const content =
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT.content;
    expect(content.authorityBoundary.blockers).toEqual(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_BLOCKERS,
    );
    expect(
      Object.values(
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_CLAIM_LOCKS,
      ),
    ).not.toContain(true);
    expect(content.authorityBoundary).toMatchObject({
      lampAuthority: false,
      fullAdmConstraintAuthority: false,
      physicalViabilityAuthority: false,
      propulsionAuthority: false,
      transportAuthority: false,
      certificateAuthority: false,
    });
  });

  it("has deterministic canonical bytes and is insensitive to object insertion order", () => {
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_SHA256,
    ).toBe(
      createHash("sha256")
        .update(
          NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_SIZE_BYTES,
    ).toBe(
      Buffer.byteLength(
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_CANONICAL_JSON,
        "utf8",
      ),
    );

    const value = clone();
    const reordered = {
      content: value.content,
      policyId: value.policyId,
      contentBinding: value.contentBinding,
      contractVersion: value.contractVersion,
      artifactId: value.artifactId,
    } as Nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementV1;
    expect(
      canonicalNhm2ConformallyFlatNeedleFixedBackgroundPairAgreementJson(
        reordered,
      ),
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_PAIR_AGREEMENT_CANONICAL_JSON,
    );
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementViolations(
        reordered,
      ),
    ).toEqual([]);
  });

  it("rejects extra and missing keys at exact contract boundaries", () => {
    const extra = clone();
    extra.content.authorityBoundary.pairReceipt = { status: "pass" };
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementViolations(extra),
    ).toContain("extra_key:/content/authorityBoundary/pairReceipt");

    const missing = clone();
    delete missing.content.lineageAndIsolation.distinctExecutableSha256Required;
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementViolations(missing),
    ).toContain(
      "missing_key:/content/lineageAndIsolation/distinctExecutableSha256Required",
    );
  });

  it("rejects proxies, accessors, symbols, non-plain objects, and noncanonical numbers", () => {
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementViolations(
        new Proxy(clone(), {}),
      ),
    ).toEqual(["proxy_forbidden:/"]);

    const accessor = clone();
    Object.defineProperty(accessor.content, "status", {
      enumerable: true,
      get: () => "blocked_missing_frozen_tolerances_and_pair_evidence",
    });
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementViolations(accessor),
    ).toEqual(["accessor_or_hidden_property_forbidden:/content/status"]);

    const symbol = clone();
    symbol.content[Symbol("hidden-authority")] = true;
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementViolations(symbol),
    ).toEqual(["symbol_key_forbidden:/content"]);

    const forbiddenKey = clone();
    Object.defineProperty(forbiddenKey.content, "__proto__", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: { promoted: true },
    });
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementViolations(
        forbiddenKey,
      ),
    ).toEqual(["forbidden_data_key:/content/__proto__"]);

    const inherited = Object.assign(Object.create({ promoted: true }), clone());
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementViolations(
        inherited,
      ),
    ).toEqual(["non_plain_object:/"]);

    const nonfinite = clone();
    nonfinite.content.uncertaintyValidation.factorRule.factorLimit =
      Number.POSITIVE_INFINITY;
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementViolations(
        nonfinite,
      ),
    ).toEqual([
      "nonfinite_number:/content/uncertaintyValidation/factorRule/factorLimit",
    ]);

    const negativeZero = clone();
    negativeZero.content.uncertaintyValidation.factorRule.factorLimit = -0;
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementViolations(
        negativeZero,
      ),
    ).toEqual([
      "negative_zero:/content/uncertaintyValidation/factorRule/factorLimit",
    ]);
  });

  it("rejects binding drift, tolerance retuning, aggregation, evidence invention, constraints, lever admission, and authority unlocks", () => {
    const bindingDrift = clone();
    bindingDrift.content.observablesBinding.sha256 = "0".repeat(64);
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementViolations(
        bindingDrift,
      ),
    ).toContain("exact_observables_binding_invalid");

    const retuned = clone();
    retuned.content.tolerancePlan.roleTolerances.fixedBackgroundMeanRset.absoluteToleranceA = 1e-12;
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementViolations(retuned),
    ).toContain("tolerance_plan_must_remain_null_and_blocked");

    const aggregated = clone();
    aggregated.content.scalarComparison.normAggregationAllowed = true;
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementViolations(
        aggregated,
      ),
    ).toContain("componentwise_no_aggregation_policy_invalid");

    const inventedEvidence = clone();
    inventedEvidence.content.evidence.pairNumericEvidence = {
      producerSaysPass: true,
    };
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementViolations(
        inventedEvidence,
      ),
    ).toContain("pair_evidence_must_remain_null");

    const constraints = clone();
    constraints.content.comparisonScope.constraintArrayRolesAllowed = true;
    constraints.content.comparisonScope.constraintComparisonAllowed = true;
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementViolations(
        constraints,
      ),
    ).toContain("constraint_comparison_forbidden");

    const lever = clone();
    lever.content.comparisonScope.declaredLeverTensorPresent = true;
    lever.content.comparisonScope.declaredLeverTensorAllowed = true;
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementViolations(lever),
    ).toContain("declared_lever_tensor_forbidden");

    const authority = clone();
    authority.content.authorityBoundary.certificateAuthority = true;
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementViolations(
        authority,
      ),
    ).toContain("authority_must_remain_blocked");

    const claim = clone();
    claim.content.claimLocks.physicalViability = true;
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundPairAgreementViolations(claim),
    ).toContain("claim_lock_must_remain_false:physicalViability");
  });
});
