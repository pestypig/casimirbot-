import { describe, expect, it } from "vitest";

import {
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_SHA256,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_SIZE_BYTES,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OUTPUT_ROLES,
  NHM2_SEMICLASSICAL_V3_DECODED_FLOAT64_ARRAY_COUNT,
  NHM2_SEMICLASSICAL_V3_DECODED_FLOAT64_VALUE_COUNT,
  NHM2_SEMICLASSICAL_V3_DECODED_SIZE_BYTES,
  NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_ROLES,
  NHM2_SEMICLASSICAL_V3_DERIVATION_SIDECAR_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_OUTPUT_ARRAY_COUNT,
  NHM2_SEMICLASSICAL_V3_OUTPUT_FLOAT64_VALUE_COUNT,
  NHM2_SEMICLASSICAL_V3_OUTPUT_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES,
  NHM2_SEMICLASSICAL_V3_OUTPUT_SIZE_BYTES,
  NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_INPUT_ROLE_ORDER_SHA256,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCK_KEYS,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_SHA256,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_SHA256_DOMAIN,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_SIZE_BYTES,
  NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_COUNT,
  NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_COVERAGE,
  NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS,
  NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_COVERAGE_SHA256,
  NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS_SHA256,
  NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS,
  NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS,
  NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_ROLE_ORDER_SHA256,
} from "../shared/contracts/nhm2-semiclassical-v3-replay-epoch.v1";

describe("NHM2 semiclassical-v3 replay epoch", () => {
  it("freezes the exact 68-output and 70-decoded-array inventory", () => {
    expect(NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS).toHaveLength(25);
    expect(NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS).toHaveLength(28);
    expect(NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS.at(-1)).toBe("executable");
    expect(NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_ROLE_ORDER_SHA256).toMatch(
      /^[a-f0-9]{64}$/,
    );
    expect(
      NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_ROLE_ORDER_SHA256,
    ).toMatch(/^[a-f0-9]{64}$/);
    expect(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY.scientificInputRoleOrderSha256,
    ).toBe(NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_ROLE_ORDER_SHA256);
    expect(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY.implementationInputRoleOrderSha256,
    ).toBe(NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_ROLE_ORDER_SHA256);
    expect(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY.inputClosureTopology,
    ).toEqual({
      sharedScientificPresealInputCount: 25,
      roleSpecificImplementationInputCount: 3,
      completeRunInputReceiptCount: 28,
      scientificPresealBindsRoleSpecificImplementationBytes: false,
      completeRunInputClosureFrozenBeforeExecutionRequired: true,
      pairScientificInputClosureMustMatch: true,
      pairImplementationInputClosuresMustBeDistinct: true,
    });
    expect(NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS).toContain(
      "constraint_probe_definition",
    );
    expect(NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS).toContain(
      "constraint_uncertainty_model",
    );
    expect(NHM2_SEMICLASSICAL_V3_DERIVATION_EVIDENCE_SIDECAR_ROLES).toEqual([
      "constraint_operand_derivation_receipt",
      "constraint_uncertainty_derivation_receipt",
      "constraint_target_derivation_receipt",
    ]);
    expect(NHM2_SEMICLASSICAL_V3_DERIVATION_SIDECAR_ROLE_ORDER_SHA256).toMatch(
      /^[a-f0-9]{64}$/,
    );
    expect(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY.derivationEvidenceSidecarRoleOrderSha256,
    ).toBe(NHM2_SEMICLASSICAL_V3_DERIVATION_SIDECAR_ROLE_ORDER_SHA256);
    expect(NHM2_SEMICLASSICAL_V3_CONSTRAINT_OUTPUT_ROLES).toHaveLength(63);
    expect(NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES).toHaveLength(68);
    expect(new Set(NHM2_SEMICLASSICAL_V3_OUTPUT_ROLES).size).toBe(68);
    expect(NHM2_SEMICLASSICAL_V3_OUTPUT_ARRAY_COUNT).toBe(68);
    expect(NHM2_SEMICLASSICAL_V3_DECODED_FLOAT64_ARRAY_COUNT).toBe(70);
    expect(NHM2_SEMICLASSICAL_V3_OUTPUT_FLOAT64_VALUE_COUNT).toBe(836_672);
    expect(NHM2_SEMICLASSICAL_V3_DECODED_FLOAT64_VALUE_COUNT).toBe(837_952);
    expect(NHM2_SEMICLASSICAL_V3_OUTPUT_SIZE_BYTES).toBe(6_693_376);
    expect(NHM2_SEMICLASSICAL_V3_DECODED_SIZE_BYTES).toBe(6_703_616);
  });

  it("binds all three levels and all five constraint families", () => {
    expect(NHM2_SEMICLASSICAL_V3_CONSTRAINT_OUTPUT_ROLES[0]).toBe(
      "constraint_operand.level_0.H_H.computed",
    );
    expect(NHM2_SEMICLASSICAL_V3_CONSTRAINT_OUTPUT_ROLES.at(-1)).toBe(
      "constraint_operand.level_2.jacobi.absolute_uncertainty95",
    );
    for (const levelId of ["level_0", "level_1", "level_2"]) {
      expect(
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_OUTPUT_ROLES.filter((role) =>
          role.includes(`.${levelId}.`),
        ),
      ).toHaveLength(21);
    }
  });

  it("replaces the drifting v2 regulator projection with 64 exact v3 leaves", () => {
    expect(NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_COVERAGE).toHaveLength(159);
    expect(NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_COUNT).toBe(159);
    expect(new Set(NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS).size).toBe(
      159,
    );
    expect(NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS).toContain(
      "metrics.regulator.levelScales[2]",
    );
    expect(NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS).not.toContain(
      "metrics.regulator.spacing[0]",
    );
    expect(
      NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS.filter((leaf) =>
        leaf.startsWith("metrics.regulator."),
      ),
    ).toHaveLength(64);
    expect(NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS).toContain(
      "metrics.regulator.families.H_H.observedOrderLower95",
    );
  });

  it("requires a clean version break and preserves every claim lock", () => {
    expect(NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY.migration).toEqual({
      legacyV1Accepted: false,
      legacyV2Accepted: false,
      automaticUpgradeAllowed: false,
      oldAggregateRegulatorArraysAccepted: false,
      allThreeRegulatorScalesCovered: true,
      perFamilyRegulatorConvergenceRequired: true,
    });
    expect(
      Object.values(
        NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY.authorityBoundary,
      ).every((value) => value === false),
    ).toBe(true);
    expect(Object.keys(NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS)).toEqual(
      [...NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCK_KEYS],
    );
    expect(
      Object.values(NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS).every(
        (value) => value === false,
      ),
    ).toBe(true);
    expect(Object.isFrozen(NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY)).toBe(
      true,
    );
    expect(Object.isFrozen(NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS)).toBe(
      true,
    );
    expect(NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_SHA256).toMatch(
      /^[a-f0-9]{64}$/,
    );
    expect(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_SIZE_BYTES,
    ).toBeGreaterThan(1_000);
    expect(NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING.sha256).toBe(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_SHA256,
    );
    expect(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY.pairComparison
        .independentScientificOutputByteEqualityRequired,
    ).toBe(false);
    expect(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY.constraintUncertainty
        .componentwiseNonnegativeAloneIsCoverageEvidence,
    ).toBe(false);
    expect(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY.retainedResidualMetricProjection
        .producerResidualMismatchLInf,
    ).toBe("maximum_over_all_three_levels_samples_and_channels");
    expect(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY.constraintArithmeticPolicySha256,
    ).toBe(NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_SHA256);
    expect(NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_SHA256).toMatch(
      /^[a-f0-9]{64}$/,
    );
    expect(NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_SIZE_BYTES).toBe(
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING.sizeBytes,
    );
    expect(
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
    ).toMatchObject({
      sha256: NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_SHA256,
      mediaType: "application/json",
    });
  });

  it("pins the frozen epoch, role, arithmetic, sidecar, and leaf digests", () => {
    expect(NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_SHA256_DOMAIN).toBe(
      "nhm2-semiclassical-v3-replay-epoch-policy/v1\n",
    );
    expect(NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_SHA256).toBe(
      "72809f7bf15551886994ee80bf3f67d793d4024e2c64decd838f9c6d6795413f",
    );
    expect(NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_SHA256).toBe(
      "ec6dc71043c35d20b74efe0053ae2b3665af6ec9ac9c2d5c36e2911b89defeb8",
    );
    expect(NHM2_SEMICLASSICAL_V3_INPUT_ROLE_ORDER_SHA256).toBe(
      "a2d6c6c256b7dbfcbb87873a9cd5659d471a8a92b38e9720192aa83d6023994b",
    );
    expect(NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_ROLE_ORDER_SHA256).toBe(
      "fbefe8a647f1a11c81148a931258a850b6b41041927552bb76429197f12e238b",
    );
    expect(NHM2_SEMICLASSICAL_V3_IMPLEMENTATION_INPUT_ROLE_ORDER_SHA256).toBe(
      "4977f5339269383309287bf5f3e81a33c108e8e212eebc281591cbee020b9406",
    );
    expect(NHM2_SEMICLASSICAL_V3_OUTPUT_ROLE_ORDER_SHA256).toBe(
      "95ce1862e00c151f7bb36e483e7fffbe7c08b23791f8682dff4a0268b688f227",
    );
    expect(NHM2_SEMICLASSICAL_V3_DERIVATION_SIDECAR_ROLE_ORDER_SHA256).toBe(
      "9ec55cfe0f5b109166abc72e35b08a5e2dbc0dfbf2ec1c43341cda01a40a917b",
    );
    expect(NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_LEAF_IDS_SHA256).toBe(
      "99eb0b2077bea07be03a3fe08db126c5014f6801c0ac6bb220c6dd2723aa7498",
    );
    expect(NHM2_SEMICLASSICAL_V3_REPLAY_METRIC_COVERAGE_SHA256).toBe(
      "b9c806970fbe853603ad666ee454a6e16f0a9aebd85903b4de9e41098586b574",
    );
  });
});
