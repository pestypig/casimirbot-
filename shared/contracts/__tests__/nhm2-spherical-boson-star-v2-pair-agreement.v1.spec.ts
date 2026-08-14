import { describe, expect, it } from "vitest";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT,
  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_RAW_SCHEMA_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_RAW_SCHEMA_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CANONICAL_ISSUE_CODE_BY_TOLERANCE_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CANONICAL_OUTCOME_ISSUE_CODES,
  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CHECK_OUTCOME_COUNT,
  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_COMPARISON_RELATION_BY_TOLERANCE_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_RAW_ROLE_COUNT,
  cloneNhm2SphericalBosonStarV2PairAgreement,
  isNhm2SphericalBosonStarV2PairAgreementV1,
  nhm2SphericalBosonStarV2PairAgreementViolations,
} from "../nhm2-spherical-boson-star-v2-pair-agreement.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING,
} from "../nhm2-spherical-boson-star-v2-raw-replay-schema.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SHA256,
} from "../nhm2-spherical-boson-star-v2-smearing-weight-freeze.v1";

type MutableRecord = Record<string, unknown>;

const mutableClone = (): MutableRecord =>
  JSON.parse(
    NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_CANONICAL_JSON,
  ) as MutableRecord;

const wireOf = (value: unknown): string => JSON.stringify(value);

const at = (value: unknown, ...keys: string[]): MutableRecord => {
  let cursor = value as MutableRecord;
  for (const key of keys) cursor = cursor[key] as MutableRecord;
  return cursor;
};

describe("NHM2 spherical boson-star v2 68-role pair agreement successor", () => {
  it("has a stable seal and exact-binds the current raw schema literal", () => {
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_SHA256).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_EXPECTED_SHA256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_RAW_SCHEMA_SHA256).toBe(
      "96f5816f9d04b9d3b14a228ab821c3224974f47839ace6d7c7819f77c6a223ff",
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT_RAW_SCHEMA_SIZE_BYTES,
    ).toBe(163_818);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT.exactRawReplaySchemaBinding,
    ).toEqual(NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT.exactSmearingWeightFreezeBinding,
    ).toEqual(NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_FREEZE_BINDING);
  });

  it("freezes exactly the schema's 68 unique ordinal-role-path-size comparisons", () => {
    const policy =
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT.rawHashAgreementPolicy;
    expect(policy.exactRoleCount).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_RAW_ROLE_COUNT,
    );
    expect(policy.roles).toHaveLength(68);
    expect(policy.roles.map((entry) => entry.ordinal)).toEqual(
      Array.from({ length: 68 }, (_, index) => index),
    );
    expect(new Set(policy.roles.map((entry) => entry.role)).size).toBe(68);
    expect(new Set(policy.roles.map((entry) => entry.path)).size).toBe(68);
    policy.roles.forEach((entry, index) => {
      const descriptor =
        NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS[
          index
        ];
      expect(entry).toMatchObject({
        ordinal: descriptor.fileOrdinal,
        role: descriptor.role,
        path: descriptor.path,
        expectedSizeBytes: descriptor.sizeBytes,
        hashAlgorithm: "sha256",
        comparator: "identical_sha256_and_size",
        requiredStatus: "pass",
      });
    });
    expect(
      policy.serverMustRehashEveryPhysicalFileInEachLaneBeforeComparison,
    ).toBe(true);
    expect(policy.producerReportedHashAcceptedWithoutServerRehash).toBe(false);
    expect(policy.aggregateHashEqualityMayReplacePerRoleEquality).toBe(false);
    expect(policy.roles[4]).toMatchObject({
      primaryHashSource:
        "server_rehashed_primary_successor_manifest_physical_file_entry",
      independentHashSource:
        "server_rehashed_independent_successor_manifest_physical_file_entry",
      comparator: "identical_sha256_and_size",
    });
    expect(policy.candidateFrozenContent).toEqual({
      fileOrdinal: 4,
      role: "smearing_weights",
      exactRawSha256: NHM2_SPHERICAL_BOSON_STAR_V2_SMEARING_WEIGHT_RAW_SHA256,
      exactRawSizeBytes: 512,
      bothLanesMustCheckExactHashBeforeFloatDecode: true,
      decodedBitCheckAndNormalizationRemainDefenseInDepth: true,
      pairMustCompareBothLaneHashesToThisValueNotOnlyToEachOther: true,
    });
  });

  it("requires independent equality for every ordered check and tolerance outcome", () => {
    const policy =
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT.checkAndToleranceOutcomeAgreementPolicy;
    expect(policy.exactOutcomeCount).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CHECK_OUTCOME_COUNT,
    );
    expect(policy.outcomeRoles).toHaveLength(30);
    expect(policy.outcomeRoles.map((entry) => entry.ordinal)).toEqual(
      Array.from({ length: 30 }, (_, index) => index),
    );
    expect(
      policy.outcomeRoles.slice(0, 10).map((entry) => entry.checkId),
    ).toEqual([
      "finiteness",
      "metricDemandNondegeneracy",
      "meanMetricDemandClosure",
      "metricDemandErrorEnclosure",
      "smearingWeightFreeze",
      "smearingNormalization",
      "exchangeSymmetry",
      "psd",
      "maximumEigenvalueUpper95",
      "fluctuationRatio",
    ]);
    expect(
      policy.outcomeRoles
        .slice(10, 25)
        .map((entry) => `${entry.checkId}:${entry.scopeId}`),
    ).toEqual([
      "bracketResidual:level_0.H_H",
      "bracketResidual:level_0.H_Hi",
      "bracketResidual:level_0.Hi_Hj",
      "antisymmetry:level_0.antisymmetry",
      "jacobi:level_0.jacobi",
      "bracketResidual:level_1.H_H",
      "bracketResidual:level_1.H_Hi",
      "bracketResidual:level_1.Hi_Hj",
      "antisymmetry:level_1.antisymmetry",
      "jacobi:level_1.jacobi",
      "bracketResidual:level_2.H_H",
      "bracketResidual:level_2.H_Hi",
      "bracketResidual:level_2.Hi_Hj",
      "antisymmetry:level_2.antisymmetry",
      "jacobi:level_2.jacobi",
    ]);
    expect(policy.outcomeRoles.slice(25).map((entry) => entry.scopeId)).toEqual(
      ["H_H", "H_Hi", "Hi_Hj", "antisymmetry", "jacobi"],
    );
    expect(
      policy.outcomeRoles
        .slice(10, 20)
        .map((entry) => entry.appliedToleranceIds),
    ).toEqual(Array.from({ length: 10 }, () => ["float64RecomputeAbsolute"]));
    expect(
      policy.outcomeRoles
        .slice(20, 25)
        .map((entry) => entry.appliedToleranceIds),
    ).toEqual([
      ["bracketResidualUpper95", "float64RecomputeAbsolute"],
      ["bracketResidualUpper95", "float64RecomputeAbsolute"],
      ["bracketResidualUpper95", "float64RecomputeAbsolute"],
      ["antisymmetryResidualUpper95", "float64RecomputeAbsolute"],
      ["jacobiResidualUpper95", "float64RecomputeAbsolute"],
    ]);
    expect(
      policy.outcomeRoles.slice(25).map((entry) => entry.appliedToleranceIds),
    ).toEqual(
      Array.from({ length: 5 }, () => [
        "regulatorResidualUpper95",
        "finalRegulatorErrorUpper95Tolerance",
        "regulatorMonotonicityAbsolute",
        "minimumRegulatorConvergenceOrder",
      ]),
    );
    expect(policy.eachLaneMustRecomputeEveryOutcomeIndependently).toBe(true);
    expect(policy.producerSuppliedDerivedOutcomeAcceptedAsAuthority).toBe(
      false,
    );
    expect(policy.everyOutcomeMustBePresentFiniteOrderedAndEqual).toBe(true);
    expect(policy.bothReplayCalculationDispositionsMustBePassForPairPass).toBe(
      true,
    );
    expect(policy.normalizedOutcomeExactFields).toEqual([
      "ordinal",
      "checkId",
      "scopeId",
      "disposition",
      "appliedToleranceIds",
      "appliedToleranceResults",
      "orderedIssueCodes",
    ]);
    expect(policy.laneProjectionReceiptFieldByRole).toEqual({
      primary: "normalizedOutcomeProjection",
      independent: "normalized_outcome_projection",
    });
    expect(policy.appliedToleranceResultExactFields).toEqual([
      "toleranceId",
      "comparisonRelation",
      "satisfied",
    ]);
    const toleranceIds = [
      ...new Set(
        policy.outcomeRoles.flatMap((entry) => entry.appliedToleranceIds),
      ),
    ].sort();
    expect(
      Object.keys(
        NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_COMPARISON_RELATION_BY_TOLERANCE_ID,
      ).sort(),
    ).toEqual(toleranceIds);
    expect(
      Object.keys(
        NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CANONICAL_ISSUE_CODE_BY_TOLERANCE_ID,
      ).sort(),
    ).toEqual(toleranceIds);
    expect(
      Object.entries(
        NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CANONICAL_ISSUE_CODE_BY_TOLERANCE_ID,
      ).every(
        ([toleranceId, code]) =>
          code === `tolerance_not_satisfied:${toleranceId}`,
      ),
    ).toBe(true);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_CANONICAL_OUTCOME_ISSUE_CODES,
    ).toEqual({
      blocked: "outcome_not_recomputed",
      finiteness: "finiteness_not_satisfied",
      smearingWeightFreeze: "smearing_weight_freeze_not_satisfied",
      maximumEigenvalueUpper95: "maximum_eigenvalue_upper95_not_finite",
    });
    expect(policy.normalizedProjectionPolicy).toEqual({
      exactLength: 30,
      everyOutcomeAlwaysPresent: true,
      unreachedOutcomeDisposition: "blocked",
      unreachedOutcomeOrderedIssueCodes: ["outcome_not_recomputed"],
      appliedToleranceResultsExactlyFollowAppliedToleranceIds: true,
      falseToleranceResultsDoNotByThemselvesDistinguishFailFromBlocked: true,
      anyObservedFailDominatesAnyLaterBlockedOutcomeForCandidateDisposition: true,
      laterBlockedOutcomeMayEraseEarlierObservedFail: false,
      laneNativeIssueNamesAcceptedWithoutCanonicalMapping: false,
    });
  });

  it("keeps every execution/replay/agreement instance null", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT;
    expect(Object.values(contract.instances)).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
    expect(
      contract.readinessBoundary.rawSchemaScientificInputClosureComplete,
    ).toBe(false);
    expect(contract.readinessBoundary.rawSchemaExecutionMayBeAdmitted).toBe(
      false,
    );
    expect(
      contract.readinessBoundary.rawSchemaRecomputationImplementationPresent,
    ).toBe(false);
    expect(
      contract.readinessBoundary
        .exactSchemaBindingDoesNotClearReadinessBlockers,
    ).toBe(true);
  });

  it("gates exactly two diagnostic lamps behind both replay passes and full agreement", () => {
    const gate = NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT.diagnosticLampGate;
    expect(gate.exactDiagnosticLampIds).toEqual([
      "semiclassicalStressNoiseLamp",
      "semiclassicalConstraintAlgebraLamp",
    ]);
    expect(gate.exactDiagnosticLampCount).toBe(2);
    expect(gate.bothReplayPassesRequired).toBe(true);
    expect(gate.fullPairAgreementPassRequired).toBe(true);
    expect(gate.all68RawHashComparisonsRequired).toBe(true);
    expect(gate.all30CheckAndToleranceOutcomeComparisonsRequired).toBe(true);
    expect(gate.pairAgreementReceiptRequiredBeforeLampPromotion).toBe(true);
    expect(gate.thisContractSetsLampState).toBe(false);
    expect(gate.currentLampState).toEqual({
      semiclassicalStressNoiseLamp: false,
      semiclassicalConstraintAlgebraLamp: false,
    });
    expect(gate.stressNoiseOutcomeOrdinals).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    expect(gate.constraintAlgebraOutcomeOrdinals).toHaveLength(21);
  });

  it("fails mismatches without retuning and never unlocks physical authority", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT;
    expect(
      contract.pairPassRule.observedMismatchOrFrozenLimitFailureDisposition,
    ).toBe("fail_this_v2_candidate_without_retuning_or_relabeling");
    expect(contract.frozenFailurePolicy.failureDisposition).toBe(
      "fail_this_v2_candidate_without_retuning_or_relabeling",
    );
    expect(contract.frozenFailurePolicy.retuningPermitted).toBe(false);
    expect(
      contract.frozenFailurePolicy.postObservationToleranceChangeAllowed,
    ).toBe(false);
    expect(
      contract.frozenFailurePolicy
        .mismatchMayBeDiscardedAndRerunAsSameCandidate,
    ).toBe(false);
    expect(
      Object.entries(contract.authorityLocks).every(([, value]) =>
        value === null ? true : value === false,
      ),
    ).toBe(true);
    expect(
      contract.diagnosticLampGate.lampPromotionGrantsPhysicalViability,
    ).toBe(false);
    expect(
      contract.diagnosticLampGate.lampPromotionGrantsPropulsionOrTransport,
    ).toBe(false);
  });

  it("preserves an earlier fail when later prerequisite evidence blocks", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT;
    expect(contract.pairPassRule.firstNonPassInFrozenOrderIsAuthoritative).toBe(
      true,
    );
    expect(contract.pairPassRule.mixedPrerequisiteDisposition).toEqual({
      earlierObservedFailThenLaterMissingInvalidOrBlocked:
        "fail_this_v2_candidate_without_retuning_or_relabeling",
      laterMissingInvalidOrBlockedMayOverwriteEarlierFail: false,
      retuningPermitted: false,
    });
    expect(contract.frozenFailurePolicy.retuningPermitted).toBe(false);
  });

  it("is additive and does not reinterpret the legacy 32-role contract", () => {
    const successor =
      NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT.additiveSuccessor;
    expect(successor.legacyPairContract.contractVersion).toBe(
      "nhm2_semiclassical_v2_pair_agreement/v2",
    );
    expect(successor.legacyPairContract.legacyArrayRoleCount).toBe(32);
    expect(successor.legacyPairContract.sourceMutated).toBe(false);
    expect(successor.legacyPairContract.acceptedAsThis68RoleSuccessor).toBe(
      false,
    );
    expect(successor.thisContractGrantsExecutionAdmission).toBe(false);
    expect(successor.thisContractGrantsReplayOrAgreementEvidence).toBe(false);
  });

  it("accepts only the exact plain contract and rejects binding, role, gate, and authority drift", () => {
    const clone = cloneNhm2SphericalBosonStarV2PairAgreement();
    expect(
      isNhm2SphericalBosonStarV2PairAgreementV1(
        NHM2_SPHERICAL_BOSON_STAR_V2_PAIR_AGREEMENT,
      ),
    ).toBe(true);
    expect(isNhm2SphericalBosonStarV2PairAgreementV1(clone)).toBe(false);
    expect(
      nhm2SphericalBosonStarV2PairAgreementViolations(wireOf(clone)),
    ).toEqual(["pair_agreement_external_copy_not_authoritative"]);

    const bindingDrift = mutableClone();
    at(bindingDrift, "exactRawReplaySchemaBinding").sha256 = "0".repeat(64);
    expect(
      nhm2SphericalBosonStarV2PairAgreementViolations(wireOf(bindingDrift)),
    ).toEqual(["spherical_v2_pair_agreement_contract_semantic_drift"]);

    const roleDrift = mutableClone();
    const roles = at(roleDrift, "rawHashAgreementPolicy").roles as
      MutableRecord[] | undefined;
    roles![0].role = "not_the_frozen_role";
    expect(
      nhm2SphericalBosonStarV2PairAgreementViolations(wireOf(roleDrift)),
    ).toEqual(["spherical_v2_pair_agreement_contract_semantic_drift"]);

    const gateDrift = mutableClone();
    at(gateDrift, "diagnosticLampGate").bothReplayPassesRequired = false;
    expect(
      nhm2SphericalBosonStarV2PairAgreementViolations(wireOf(gateDrift)),
    ).toEqual(["spherical_v2_pair_agreement_contract_semantic_drift"]);

    const authorityDrift = mutableClone();
    at(authorityDrift, "authorityLocks").physicalViability = true;
    expect(
      nhm2SphericalBosonStarV2PairAgreementViolations(wireOf(authorityDrift)),
    ).toEqual(["spherical_v2_pair_agreement_contract_semantic_drift"]);

    const injectedExecution = mutableClone();
    at(injectedExecution, "instances").primaryExecution = { runId: "forged" };
    expect(
      nhm2SphericalBosonStarV2PairAgreementViolations(
        wireOf(injectedExecution),
      ),
    ).toEqual(["spherical_v2_pair_agreement_contract_semantic_drift"]);
  });

  it("rejects hostile accessors, proxies, cycles, and nonfinite numbers", () => {
    let proxyTraps = 0;
    expect(
      nhm2SphericalBosonStarV2PairAgreementViolations(
        new Proxy(mutableClone(), {
          ownKeys: () => {
            proxyTraps += 1;
            throw new Error("must not enumerate");
          },
        }),
      )[0],
    ).toBe("pair_agreement_wire_required");
    expect(proxyTraps).toBe(0);

    let invoked = false;
    const accessor = mutableClone();
    Object.defineProperty(accessor, "artifactId", {
      enumerable: true,
      get: () => {
        invoked = true;
        throw new Error("must not run");
      },
    });
    expect(nhm2SphericalBosonStarV2PairAgreementViolations(accessor)[0]).toBe(
      "pair_agreement_wire_required",
    );
    expect(invoked).toBe(false);

    const cycle = mutableClone();
    cycle.artifactId = cycle;
    expect(nhm2SphericalBosonStarV2PairAgreementViolations(cycle)[0]).toBe(
      "pair_agreement_wire_required",
    );

    const nonfinite = mutableClone();
    at(nonfinite, "rawHashAgreementPolicy").exactRoleCount =
      Number.POSITIVE_INFINITY;
    expect(nhm2SphericalBosonStarV2PairAgreementViolations(nonfinite)[0]).toBe(
      "pair_agreement_wire_required",
    );

    expect(
      nhm2SphericalBosonStarV2PairAgreementViolations("x".repeat(1_048_577)),
    ).toEqual(["pair_agreement_wire_code_unit_limit"]);
    expect(nhm2SphericalBosonStarV2PairAgreementViolations("{} ")).toEqual([
      "pair_agreement_wire_not_canonical",
    ]);

    let nested: unknown = null;
    for (let depth = 0; depth < 26; depth += 1) nested = [nested];
    expect(
      nhm2SphericalBosonStarV2PairAgreementViolations(
        JSON.stringify(nested),
      )[0],
    ).toMatch(/^snapshot_depth_limit:/);
    expect(
      nhm2SphericalBosonStarV2PairAgreementViolations(
        JSON.stringify(Array.from({ length: 257 }, () => null)),
      ),
    ).toEqual(["array_length_limit:/"]);
    expect(
      nhm2SphericalBosonStarV2PairAgreementViolations(
        JSON.stringify({ value: "x".repeat(16_385) }),
      ),
    ).toEqual(["string_byte_limit:/value"]);
  });
});
