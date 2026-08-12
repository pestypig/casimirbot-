import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_DERIVATION_SIDECAR_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_INPUT_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_OUTPUT_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_ROLE_ORDER_SHA256,
} from "../shared/contracts/nhm2-semiclassical-v3-replay-epoch.v1";
import {
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_COVERAGE_ROLES,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_COVERAGE_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_EXPECTED_EPOCH_BINDINGS,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_GROUP_POLICIES,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_CANONICAL_JSON,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_SHA256,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_SHA256_DOMAIN,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_SIZE_BYTES,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_POLICIES,
  NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_TO_UNCERTAINTY_ROLE,
  compareNhm2SemiclassicalV3PairNumericScalar,
  nhm2SemiclassicalV3PairNumericAgreementPolicyViolations,
} from "../shared/contracts/nhm2-semiclassical-v3-pair-numeric-agreement-policy.v1";

const jsonClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const everyObjectFrozen = (
  value: unknown,
  visited = new Set<object>(),
): boolean => {
  if (value == null || typeof value !== "object" || visited.has(value)) {
    return true;
  }
  visited.add(value);
  return (
    Object.isFrozen(value) &&
    Object.values(value as Record<string, unknown>).every((entry) =>
      everyObjectFrozen(entry, visited),
    )
  );
};

describe("NHM2 semiclassical-v3 independent numeric agreement policy", () => {
  it("maps all 68 roles exactly once to the frozen comparison groups and U companions", () => {
    expect(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_POLICIES,
    ).toHaveLength(68);
    expect(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_POLICIES.map(
        (entry) => entry.role,
      ),
    ).toEqual(NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES);
    expect(
      Object.keys(
        NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_TO_UNCERTAINTY_ROLE,
      ),
    ).toEqual([...NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES]);
    expect(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_TO_UNCERTAINTY_ROLE.noise_kernel,
    ).toBe("noise_kernel_absolute_uncertainty95");
    expect(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_TO_UNCERTAINTY_ROLE.mean_rset,
    ).toBe("mean_rset_absolute_uncertainty95");
    expect(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_TO_UNCERTAINTY_ROLE.smearing_weights,
    ).toBeNull();
    expect(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_TO_UNCERTAINTY_ROLE[
        "constraint_operand.level_1.jacobi.term_2"
      ],
    ).toBe("constraint_operand.level_1.jacobi.absolute_uncertainty95");

    for (const entry of NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_POLICIES) {
      if (
        entry.groupId === "normalized_constraint_operand" &&
        entry.uncertaintyRole != null
      ) {
        expect(entry.uncertaintyRole).toBe(
          `${entry.role.slice(0, entry.role.lastIndexOf("."))}.absolute_uncertainty95`,
        );
      }
    }

    const counts = Object.fromEntries(
      Object.keys(
        NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_GROUP_POLICIES,
      ).map((groupId) => [
        groupId,
        NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_POLICIES.filter(
          (entry) => entry.groupId === groupId,
        ).length,
      ]),
    );
    expect(counts).toEqual({
      noise_kernel: 1,
      noise_kernel_absolute_uncertainty95: 1,
      mean_rset: 1,
      mean_rset_absolute_uncertainty95: 1,
      smearing_weights: 1,
      normalized_constraint_operand: 48,
      normalized_constraint_absolute_uncertainty95: 15,
    });
    const withUncertainty =
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_POLICIES.filter(
        (entry) =>
          entry.comparisonKind === "scientific_value_with_uncertainty_envelope",
      );
    const uncertaintyEstimators =
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_POLICIES.filter(
        (entry) => entry.comparisonKind === "uncertainty_estimator_factor_four",
      );
    const withoutUncertainty =
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_ROLE_POLICIES.filter(
        (entry) =>
          entry.comparisonKind ===
          "scientific_value_without_uncertainty_envelope",
      );
    expect(withUncertainty).toHaveLength(50);
    expect(uncertaintyEstimators).toHaveLength(17);
    expect(withoutUncertainty).toHaveLength(1);
    expect(
      withUncertainty.every(
        (entry) =>
          entry.uncertaintyRole != null &&
          NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES.includes(
            entry.uncertaintyRole as any,
          ),
      ),
    ).toBe(true);
    expect(NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_COVERAGE_ROLES).toEqual(
      withUncertainty.map((entry) => entry.role),
    );
    expect(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_COVERAGE_ROLE_ORDER_SHA256,
    ).toBe("67ded14423f2d9761b8abdc92b8d24d2b7693f6eda12987402645f2bb5fad1ec");
  });

  it("freezes the exact dimensional A/R rails and conservative coverage semantics", () => {
    expect(NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_GROUP_POLICIES).toEqual(
      {
        noise_kernel: {
          groupId: "noise_kernel",
          unit: "(J/m^3)^2",
          absoluteTolerance: 1e-12,
          relativeTolerance: 1e-5,
          comparisonKind: "scientific_value_with_uncertainty_envelope",
        },
        noise_kernel_absolute_uncertainty95: {
          groupId: "noise_kernel_absolute_uncertainty95",
          unit: "(J/m^3)^2",
          absoluteTolerance: 1e-12,
          relativeTolerance: 0.75,
          comparisonKind: "uncertainty_estimator_factor_four",
        },
        mean_rset: {
          groupId: "mean_rset",
          unit: "J/m^3",
          absoluteTolerance: 1e-12,
          relativeTolerance: 1e-6,
          comparisonKind: "scientific_value_with_uncertainty_envelope",
        },
        mean_rset_absolute_uncertainty95: {
          groupId: "mean_rset_absolute_uncertainty95",
          unit: "J/m^3",
          absoluteTolerance: 1e-12,
          relativeTolerance: 0.75,
          comparisonKind: "uncertainty_estimator_factor_four",
        },
        smearing_weights: {
          groupId: "smearing_weights",
          unit: "dimensionless",
          absoluteTolerance: 1e-12,
          relativeTolerance: 1e-10,
          comparisonKind: "scientific_value_without_uncertainty_envelope",
        },
        normalized_constraint_operand: {
          groupId: "normalized_constraint_operand",
          unit: "dimensionless",
          absoluteTolerance: 1e-12,
          relativeTolerance: 1e-6,
          comparisonKind: "scientific_value_with_uncertainty_envelope",
        },
        normalized_constraint_absolute_uncertainty95: {
          groupId: "normalized_constraint_absolute_uncertainty95",
          unit: "dimensionless",
          absoluteTolerance: 1e-12,
          relativeTolerance: 0.75,
          comparisonKind: "uncertainty_estimator_factor_four",
        },
      },
    );
    expect(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY.coverage,
    ).toEqual({
      perRunMinimumJointSimultaneousCoverage: 0.975,
      pairMinimumJointSimultaneousCoverage: 0.95,
      coverageRoleCount: 50,
      coverageRoleOrderSha256:
        NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_COVERAGE_ROLE_ORDER_SHA256,
      perRunScope:
        "all_50_uncertainty_enveloped_scientific_roles_all_levels_families_samples_channels_jointly_or_stronger_deterministic_enclosure",
      uncertaintyEstimatorAgreementHandledBySeparateUComparison: true,
      smearingWeightsHaveNoStatisticalCoverageEnvelope: true,
      deterministicEnclosureAllowed: true,
      bonferroniPairLowerBoundFormula:
        "pair_coverage_lower=max(0,primary_joint_coverage+independent_joint_coverage-1)",
      implementationIndependenceAssumedForCoverage: false,
      marginalOrPointwise95CoverageSufficient: false,
      serverReplayOfCoverageDerivationRequired: true,
    });
    expect(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY.constraintUncertaintyScope,
    ).toMatchObject({
      everyPrimitiveOperandErrorBounded: true,
      linearResidualErrorBounded: true,
      residualOnlyUncertaintyMayEnvelopePrimitiveOperands: false,
    });
  });

  it("applies the exact symmetric value and uncertainty formulas fail-closed", () => {
    const centralPass = compareNhm2SemiclassicalV3PairNumericScalar({
      role: "mean_rset",
      primaryValue: 100,
      independentValue: 100.00015,
      primaryUncertainty: 0.00003,
      independentUncertainty: 0.00003,
    });
    expect(centralPass.status).toBe("pass");
    expect(centralPass.budget).toBeCloseTo(
      1e-12 + 1e-6 * 100.00015 + 0.00006,
      15,
    );
    const centralPassWithLanesSwapped =
      compareNhm2SemiclassicalV3PairNumericScalar({
        role: "mean_rset",
        primaryValue: 100.00015,
        independentValue: 100,
        primaryUncertainty: 0.00003,
        independentUncertainty: 0.00003,
      });
    expect(centralPassWithLanesSwapped).toEqual(centralPass);
    expect(
      compareNhm2SemiclassicalV3PairNumericScalar({
        role: "mean_rset",
        primaryValue: 100,
        independentValue: 100.001,
        primaryUncertainty: 0.00003,
        independentUncertainty: 0.00003,
      }).status,
    ).toBe("fail");
    expect(
      compareNhm2SemiclassicalV3PairNumericScalar({
        role: "mean_rset",
        primaryValue: 1,
        independentValue: 1,
      }),
    ).toMatchObject({ status: "blocked", reason: "missing_uncertainty" });
    expect(
      compareNhm2SemiclassicalV3PairNumericScalar({
        role: "mean_rset",
        primaryValue: 1,
        independentValue: 1,
        primaryUncertainty: -1,
        independentUncertainty: 0,
      }),
    ).toMatchObject({ status: "blocked", reason: "negative_uncertainty" });
    expect(
      compareNhm2SemiclassicalV3PairNumericScalar({
        role: "mean_rset_absolute_uncertainty95",
        primaryValue: 4,
        independentValue: 1,
      }).status,
    ).toBe("pass");
    expect(
      compareNhm2SemiclassicalV3PairNumericScalar({
        role: "mean_rset_absolute_uncertainty95",
        primaryValue: 4.0000000001,
        independentValue: 1,
      }).status,
    ).toBe("fail");
    expect(
      compareNhm2SemiclassicalV3PairNumericScalar({
        role: "smearing_weights",
        primaryValue: 0,
        independentValue: 2e-12,
      }).status,
    ).toBe("fail");
    expect(
      compareNhm2SemiclassicalV3PairNumericScalar({
        role: "unknown",
        primaryValue: 0,
        independentValue: 0,
      }),
    ).toMatchObject({ status: "blocked", reason: "unknown_role" });
    expect(
      compareNhm2SemiclassicalV3PairNumericScalar({
        role: "noise_kernel",
        primaryValue: Number.MAX_VALUE,
        independentValue: -Number.MAX_VALUE,
        primaryUncertainty: 0,
        independentUncertainty: 0,
      }),
    ).toMatchObject({
      status: "blocked",
      reason: "derived_numeric_overflow",
    });

    const hostileScalar = new Proxy(
      {
        role: "mean_rset",
        primaryValue: 1,
        independentValue: 1,
        primaryUncertainty: 0,
        independentUncertainty: 0,
      },
      {},
    );
    expect(
      compareNhm2SemiclassicalV3PairNumericScalar(hostileScalar),
    ).toMatchObject({
      status: "blocked",
      reason: "comparison_input_invalid",
    });
  });

  it("binds the epoch hashes, sidecar semantics, lineage, no-retune rule, and all locks", () => {
    expect(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY.epochBindings,
    ).toEqual({
      inputRoleOrderSha256: NHM2_SEMICLASSICAL_V3_INPUT_ROLE_ORDER_SHA256,
      scientificInputRoleOrderSha256:
        NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_ROLE_ORDER_SHA256,
      implementationInputRoleOrderSha256:
        NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_ROLE_ORDER_SHA256,
      outputRoleOrderSha256: NHM2_SEMICLASSICAL_V3_OUTPUT_ROLE_ORDER_SHA256,
      derivationSidecarRoleOrderSha256:
        NHM2_SEMICLASSICAL_V3_DERIVATION_SIDECAR_ROLE_ORDER_SHA256,
      replayEpochPolicySha256:
        NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING.sha256,
      constraintArithmeticPolicySha256:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING.sha256,
      replayEpochPolicyBinding:
        NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING,
      constraintArithmeticPolicyBinding:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
      outputRoleCount: 68,
      inputRoleCount: 28,
      scientificInputRoleCount: 25,
      implementationInputRoleCount: 3,
      derivationSidecarRoleCount: 3,
    });
    expect(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY.epochBindings,
    ).toMatchObject(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_EXPECTED_EPOCH_BINDINGS,
    );
    expect(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY.byteAndSemanticComparison,
    ).toMatchObject({
      frozenScientificInputBytesMustMatch: true,
      frozenScientificInputDescriptorBytesMustMatch: true,
      independentImplementationInputBytesMustMatch: false,
      independentImplementationInputBytesMustBeDistinct: true,
      independentImplementationDescriptorBytesMustMatch: false,
      independentImplementationDescriptorBytesMustBeDistinct: true,
      independentScientificOutputBytesMustMatch: false,
      independentDerivationSidecarBytesMustMatch: false,
      sidecarSchemaHashAndRunCrossBindingRequired: true,
      sidecarSemanticEvidenceAgreementRequired: true,
    });
    expect(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY
        .byteAndSemanticComparison.exactSidecarFrozenSha256Values,
    ).toEqual({
      input_role_order_sha256: NHM2_SEMICLASSICAL_V3_INPUT_ROLE_ORDER_SHA256,
      scientific_input_role_order_sha256:
        NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_ROLE_ORDER_SHA256,
      implementation_input_role_order_sha256:
        NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_ROLE_ORDER_SHA256,
      output_role_order_sha256: NHM2_SEMICLASSICAL_V3_OUTPUT_ROLE_ORDER_SHA256,
      derivation_sidecar_role_order_sha256:
        NHM2_SEMICLASSICAL_V3_DERIVATION_SIDECAR_ROLE_ORDER_SHA256,
      replay_epoch_policy_sha256:
        NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING.sha256,
      constraint_operand_policy_sha256:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING.sha256,
    });
    expect(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY.futurePairInputBinding,
    ).toEqual({
      presealedNumericPolicyBindingIsMandatoryPairInput: true,
      primaryLaneNumericPolicySha256Required: true,
      independentLaneNumericPolicySha256Required: true,
      bothLaneValuesMustEqualPresealedPairPolicyBindingSha256: true,
      pairPresealReceiptMustPredateBothRuns: true,
      moduleComputedHashWithoutPairPresealReceiptSufficient: false,
      missingOrMismatchedBindingDisposition: "blocked",
    });
    expect(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY.serverDecodedSnapshotBoundary,
    ).toEqual({
      serverFilesystemReadRequired: true,
      serverDecodesFloat64ArraysBeforeComparison: true,
      exactlyOneDetachedImmutableSnapshotPerLane: true,
      snapshotCompletedBeforeValidationOrArithmetic: true,
      comparisonReadsOnlyDetachedSnapshot: true,
      producerSuppliedObjectGraphAccepted: false,
      proxyAccessorOrMutableAliasDisposition: "blocked",
    });
    expect(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY.lineageAndCopyControls,
    ).toMatchObject({
      distinctSourceSha256Required: true,
      distinctExecutableSha256Required: true,
      crossRunScientificOutputReadForbidden: true,
      exactScientificByteIdentityGrantsAgreement: false,
    });
    expect(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY.runDecision,
    ).toMatchObject({
      pairPassCanRescueFailedRun: false,
      numericDisagreementDisposition: "fail",
      missingInvalidOrNonfiniteEvidenceDisposition: "blocked",
    });
    expect(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY.preregistrationAndVersioning,
    ).toMatchObject({
      postObservationToleranceRetuningAllowed: false,
      changeRequiresNewPolicyContractVersion: true,
      changeRequiresNewCandidateId: true,
    });
    expect(NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY.claimLocks).toBe(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
    );
    expect(
      Object.values(
        NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY.claimLocks,
      ).every((value) => value === false),
    ).toBe(true);
    expect(
      Object.values(
        NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY.authorityBoundary,
      ).every((value) => value === false),
    ).toBe(true);
  });

  it("deep-freezes canonical policy bytes and binds the exact SHA-256 receipt", () => {
    expect(
      everyObjectFrozen(NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY),
    ).toBe(true);
    expect(
      createHash("sha256")
        .update(
          NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_SHA256_DOMAIN,
          "utf8",
        )
        .update(
          NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    ).toBe(NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_SHA256);
    expect(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_SHA256_DOMAIN,
    ).toBe("nhm2-semiclassical-v3-pair-numeric-agreement-policy/v1\n");
    expect(NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_SHA256).toBe(
      "872f17a82aead893b9371ded595c631ce8dc825152de2f545b0b2840f51d1cb8",
    );
    expect(NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_SIZE_BYTES).toBe(
      36988,
    );
    expect(NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_BINDING).toEqual(
      {
        artifactId: "nhm2.semiclassical_v3_pair_numeric_agreement_policy",
        contractVersion:
          "nhm2_semiclassical_v3_pair_numeric_agreement_policy/v1",
        policyId:
          "nhm2.server_owned.semiclassical_v3.independent_numeric_agreement/v1",
        sha256: NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_SHA256,
        sizeBytes: Buffer.byteLength(
          NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY_CANONICAL_JSON,
          "utf8",
        ),
        mediaType: "application/json",
      },
    );
  });

  it("rejects retuning, schema drift, and hostile object graphs", () => {
    expect(
      nhm2SemiclassicalV3PairNumericAgreementPolicyViolations(
        NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY,
      ),
    ).toEqual([]);
    expect(
      nhm2SemiclassicalV3PairNumericAgreementPolicyViolations(
        jsonClone(NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY),
      ),
    ).toEqual([]);

    const retuned = jsonClone(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY,
    ) as any;
    retuned.groupPolicies.mean_rset.relativeTolerance = 1e-5;
    expect(
      nhm2SemiclassicalV3PairNumericAgreementPolicyViolations(retuned),
    ).toEqual(["policy_content_mismatch"]);

    const remapped = jsonClone(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY,
    ) as any;
    remapped.roleToUncertaintyRole.mean_rset =
      "noise_kernel_absolute_uncertainty95";
    expect(
      nhm2SemiclassicalV3PairNumericAgreementPolicyViolations(remapped),
    ).toEqual(["policy_content_mismatch"]);

    const accessor = jsonClone(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY,
    ) as any;
    Object.defineProperty(
      accessor.coverage,
      "pairMinimumJointSimultaneousCoverage",
      {
        enumerable: true,
        get: () => 0.95,
      },
    );
    expect(
      nhm2SemiclassicalV3PairNumericAgreementPolicyViolations(accessor),
    ).toEqual(["policy_plain_data_snapshot_invalid"]);

    const hidden = jsonClone(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY,
    ) as any;
    Object.defineProperty(hidden, "hidden", { value: true, enumerable: false });
    expect(
      nhm2SemiclassicalV3PairNumericAgreementPolicyViolations(hidden),
    ).toEqual(["policy_plain_data_snapshot_invalid"]);

    const symbol = jsonClone(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY,
    ) as any;
    symbol[Symbol("hidden")] = true;
    expect(
      nhm2SemiclassicalV3PairNumericAgreementPolicyViolations(symbol),
    ).toEqual(["policy_plain_data_snapshot_invalid"]);

    const repeated = jsonClone(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY,
    ) as any;
    repeated.authorityBoundary = repeated.runDecision;
    expect(
      nhm2SemiclassicalV3PairNumericAgreementPolicyViolations(repeated),
    ).toEqual(["policy_plain_data_snapshot_invalid"]);

    const nestedProxy = jsonClone(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY,
    ) as any;
    nestedProxy.coverage = new Proxy(nestedProxy.coverage, {});
    expect(
      nhm2SemiclassicalV3PairNumericAgreementPolicyViolations(nestedProxy),
    ).toEqual(["policy_plain_data_snapshot_invalid"]);

    expect(
      nhm2SemiclassicalV3PairNumericAgreementPolicyViolations(
        new Proxy(
          jsonClone(NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY),
          {},
        ),
      ),
    ).toEqual(["policy_plain_data_snapshot_invalid"]);

    const throwingProxy = new Proxy(
      jsonClone(NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY),
      {
        getPrototypeOf: () => {
          throw new Error("hostile");
        },
      },
    );
    expect(
      nhm2SemiclassicalV3PairNumericAgreementPolicyViolations(throwingProxy),
    ).toEqual(["policy_plain_data_snapshot_invalid"]);

    const revocable = Proxy.revocable(
      jsonClone(NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY),
      {},
    );
    revocable.revoke();
    expect(
      nhm2SemiclassicalV3PairNumericAgreementPolicyViolations(revocable.proxy),
    ).toEqual(["policy_plain_data_snapshot_invalid"]);

    const sparse = jsonClone(
      NHM2_SEMICLASSICAL_V3_PAIR_NUMERIC_AGREEMENT_POLICY,
    ) as any;
    delete sparse.rolePolicies[0];
    expect(
      nhm2SemiclassicalV3PairNumericAgreementPolicyViolations(sparse),
    ).toEqual(["policy_plain_data_snapshot_invalid"]);
  });
});
