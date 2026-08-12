import { describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

import {
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_COUNT,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAYS_PER_LEVEL,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_CHANNEL_ORDER,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_FAMILY_ORDER,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_LEVELS,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_AUTHORITY_BOUNDARY,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_ID,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_SHA256,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_SHA256_DOMAIN,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_SIZE_BYTES,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_INVENTORY_SHA256_DOMAIN,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_RESIDUAL_FORMULAS,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ROLE_ORDER,
  collectNhm2SemiclassicalV2ConstraintOperandArrays,
  computeNhm2SemiclassicalV2ConstraintOperandInventorySha256,
  isNhm2SemiclassicalV2ConstraintOperandReplay,
  nhm2SemiclassicalV2ConstraintOperandReplayPairViolations,
  nhm2SemiclassicalV2ConstraintOperandReplayViolations,
  type Nhm2SemiclassicalV2ConstraintOperandArrayV1,
  type Nhm2SemiclassicalV2ConstraintOperandFamilyId,
  type Nhm2SemiclassicalV2ConstraintOperandReplayV1,
} from "../shared/contracts/nhm2-semiclassical-v2-constraint-operand-replay.v1";
import {
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONTRACT_VERSION,
  computeNhm2SemiclassicalV2ScientificSealKey,
} from "../shared/contracts/nhm2-semiclassical-v2-scientific-preseal.v1";

const hash = (value: string): string =>
  createHash("sha256").update(value, "utf8").digest("hex");

const CANDIDATE_ID = "nhm2.test.constraint-operands/candidate-v1";
const CANDIDATE_MANIFEST_SHA256 = hash("candidate-manifest");
const SEAL_KEY = computeNhm2SemiclassicalV2ScientificSealKey(CANDIDATE_ID);
const OUTPUT_DIRECTORY = "artifacts/constraint-operand-test";
const COMPLETED_AT = "2026-08-10T12:00:02.000Z";
const OBSERVED_AT = "2026-08-10T12:00:03.000Z";
const GENERATED_AT = "2026-08-10T12:00:04.000Z";

const descriptor = (
  levelId: string,
  familyId: Nhm2SemiclassicalV2ConstraintOperandFamilyId,
  operandRole: Nhm2SemiclassicalV2ConstraintOperandArrayV1["operandRole"],
): Nhm2SemiclassicalV2ConstraintOperandArrayV1 => {
  const path = `${OUTPUT_DIRECTORY}/${levelId}/${familyId}/${operandRole}.f64le`;
  return {
    operandRole,
    path,
    sha256: hash(path),
    sizeBytes: NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES,
    freshness: "new",
    observedAt: OBSERVED_AT,
    scientificPresealSealKey: SEAL_KEY,
    dtype: "float64",
    binaryEncoding: "raw_ieee754",
    endianness: "little",
    shape: [64, 4],
    storageOrder: "row-major",
    componentOrder: [...NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_CHANNEL_ORDER],
    sampleOrder: "candidate_sampling_ordinal_0_to_63",
    unit: "dimensionless_barred_constraint_generator",
  };
};

const completeManifest = (): Nhm2SemiclassicalV2ConstraintOperandReplayV1 => {
  const manifest: Nhm2SemiclassicalV2ConstraintOperandReplayV1 = {
    artifactId: NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_ARTIFACT_ID,
    contractVersion:
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_CONTRACT_VERSION,
    generatedAt: GENERATED_AT,
    policyBinding: {
      artifactId:
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_ARTIFACT_ID,
      contractVersion:
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_CONTRACT_VERSION,
      policyId: NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_ID,
      sha256: NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_SHA256,
      sizeBytes:
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_SIZE_BYTES,
    },
    candidateBinding: {
      candidateId: CANDIDATE_ID,
      candidateManifestSha256: CANDIDATE_MANIFEST_SHA256,
      scientificPresealBinding: {
        artifactId: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_ARTIFACT_ID,
        contractVersion:
          NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONTRACT_VERSION,
        sealKey: SEAL_KEY,
        candidateManifestSha256: CANDIDATE_MANIFEST_SHA256,
        scientificContentSha256: hash("scientific-content"),
        sealedInventorySha256: hash("sealed-inventory"),
        sealedAt: "2026-08-10T11:59:59.000Z",
      },
    },
    implementation: {
      comparisonPairId: "pair.test.constraint-operands/v1",
      role: "primary",
      implementationId: "implementation.test.primary/v1",
      sourceIdentityId: "source.test.primary/v1",
      sourceSha256: hash("source"),
      dependencyLockIdentityId: "dependency-lock.test.primary/v1",
      dependencyLockSha256: hash("dependency-lock"),
      executableIdentityId: "executable.test.primary/v1",
      executableSha256: hash("executable"),
    },
    execution: {
      commitSha: hash("commit").slice(0, 40),
      command: "solver --emit-constraint-operands",
      argv: ["solver", "--emit-constraint-operands"],
      outputDirectory: OUTPUT_DIRECTORY,
      startedAt: "2026-08-10T12:00:00.000Z",
      completedAt: COMPLETED_AT,
      durationMs: 2_000,
      exitCode: 0,
      terminationSignal: null,
    },
    levels: NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_LEVELS.map((level) => ({
      ...level,
      families: NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_FAMILY_ORDER.map(
        (familyId) => {
          const roles =
            NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ROLE_ORDER[familyId];
          return {
            familyId,
            operandOrder: [...roles],
            residualFormula:
              NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_RESIDUAL_FORMULAS[
                familyId
              ],
            operands: roles.map((role) =>
              descriptor(level.levelId, familyId, role),
            ),
          };
        },
      ),
    })),
    operandInventorySha256: "0".repeat(64),
    authorityBoundary: structuredClone(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_AUTHORITY_BOUNDARY,
    ),
  };
  manifest.operandInventorySha256 =
    computeNhm2SemiclassicalV2ConstraintOperandInventorySha256(manifest);
  return manifest;
};

const resealInventory = (
  manifest: Nhm2SemiclassicalV2ConstraintOperandReplayV1,
): void => {
  manifest.operandInventorySha256 =
    computeNhm2SemiclassicalV2ConstraintOperandInventorySha256(manifest);
};

const rebaseOutputDirectory = (
  manifest: Nhm2SemiclassicalV2ConstraintOperandReplayV1,
  outputDirectory: string,
): void => {
  manifest.execution.outputDirectory = outputDirectory;
  for (const level of manifest.levels) {
    for (const family of level.families) {
      for (const operand of family.operands) {
        operand.path = `${outputDirectory}/${level.levelId}/${family.familyId}/${operand.operandRole}.f64le`;
        operand.sha256 = hash(operand.path);
      }
    }
  }
  resealInventory(manifest);
};

const independentManifest =
  (): Nhm2SemiclassicalV2ConstraintOperandReplayV1 => {
    const manifest = completeManifest();
    manifest.implementation.role = "independent";
    manifest.implementation.implementationId =
      "implementation.test.independent/v1";
    manifest.implementation.sourceIdentityId = "source.test.independent/v1";
    manifest.implementation.sourceSha256 = hash("independent-source");
    manifest.implementation.dependencyLockIdentityId =
      "dependency-lock.test.independent/v1";
    manifest.implementation.dependencyLockSha256 = hash(
      "independent-dependency-lock",
    );
    manifest.implementation.executableIdentityId =
      "executable.test.independent/v1";
    manifest.implementation.executableSha256 = hash("independent-executable");
    rebaseOutputDirectory(manifest, `${OUTPUT_DIRECTORY}-independent`);
    return manifest;
  };

describe("NHM2 semiclassical-v2 per-level constraint operand replay schema", () => {
  it("accepts exactly 3 levels, 5 ordered families, and 63 bound raw arrays", () => {
    const manifest = completeManifest();
    expect(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_CONTRACT_VERSION,
    ).toBe("nhm2_semiclassical_v2_constraint_operand_replay/v2");
    expect(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_CONTRACT_VERSION,
    ).toBe("nhm2_semiclassical_v2_constraint_operand_replay_policy/v2");
    expect(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_SHA256_DOMAIN,
    ).toBe("nhm2-semiclassical-v2-constraint-operand-replay-policy/v2\n");
    expect(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_INVENTORY_SHA256_DOMAIN,
    ).toBe("nhm2-semiclassical-v2-constraint-operand-inventory/v2\n");
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(manifest),
    ).toEqual([]);
    expect(isNhm2SemiclassicalV2ConstraintOperandReplay(manifest)).toBe(true);
    expect(manifest.levels).toHaveLength(3);
    for (const level of manifest.levels) {
      expect(level.families.map((family) => family.familyId)).toEqual(
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_FAMILY_ORDER,
      );
      expect(
        level.families.reduce(
          (total, family) => total + family.operands.length,
          0,
        ),
      ).toBe(NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAYS_PER_LEVEL);
    }
    expect(
      collectNhm2SemiclassicalV2ConstraintOperandArrays(manifest),
    ).toHaveLength(NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_COUNT);
    expect(NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES).toBe(
      64 * 4 * Float64Array.BYTES_PER_ELEMENT,
    );
  });

  it("freezes conservative p_min=1 roles and forbids family aggregation", () => {
    expect(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY.convergence,
    ).toMatchObject({
      familyAggregation: "none",
      pMinimum: 1,
      conservativeErrorRoles: {
        level_0: "E_0=2*d01",
        level_1: "E_1=2*d12",
        level_2: "E_2=d12",
      },
      monotonicityAbsoluteTolerance: 1e-12,
      everyFamilyMustPassSeparately: true,
      producerReportedOrderAuthoritative: false,
    });
    expect(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY.serverRecomputation,
    ).toMatchObject({
      producerResidualOrConvergenceSummaryAuthoritative: false,
      derivedOnlySubmissionAllowed: false,
      recomputeEveryFamilyResidualAtEveryLevel: true,
      rejectSubmittedResidualMismatch: true,
      submittedResidualMismatchLInf:
        "submittedResidualMismatchLInf=max(abs(submittedResidual-serverResidual))",
      centralLevelOrdinal: 2,
      centralResidualUpper95:
        "residualUpper95=max(abs(serverResidual)+submittedU95)",
    });
    expect(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY.provenanceVerification,
    ).toMatchObject({
      serverMustRehashEveryOperandFileBeforeDecode: true,
      serverMustVerifyRunSpecificNewness: true,
      producerFreshnessClassificationAuthoritative: false,
      serverMustResolveAndMatchPersistedScientificPreseal: true,
      producerScientificPresealEchoAuthoritative: false,
    });
    expect(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY.convergence
        .finiteDerivedRoleOrder,
    ).toEqual([
      "R_level_0",
      "R_level_1",
      "R_level_2",
      "d01",
      "d12",
      "E_0",
      "E_1",
      "E_2",
      "U_E0",
      "U_E1",
      "U_E2",
      "q_0",
      "q_1",
      "q_2",
      "D01Lower",
      "D01Upper",
      "D12Lower",
      "D12Upper",
      "pLower",
      "submitted_residual_mismatch_linf",
      "central_residual_upper95",
    ]);
    expect(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY.convergence,
    ).toMatchObject({
      everyDerivedRoleMustBeFiniteBeforeComparison: true,
      finiteCheckCadence:
        "after_every_primitive_operation_reduction_and_derived_role",
      nonfiniteOrOverflowDisposition:
        "blocked_before_any_family_or_global_pass",
      interlevelBoundDefinitions: {
        D01Lower:
          "D01Lower=max_i(max(0,abs(R_level_0-R_level_1)-(U_level_0+U_level_1)))",
        D01Upper:
          "D01Upper=max_i(abs(R_level_0-R_level_1)+U_level_0+U_level_1)",
        D12Lower:
          "D12Lower=max_i(max(0,abs(R_level_1-R_level_2)-(U_level_1+U_level_2)))",
        D12Upper:
          "D12Upper=max_i(abs(R_level_1-R_level_2)+U_level_1+U_level_2)",
      },
      conservativeOrderLowerDefinition: "pLower=log(D01Lower/D12Upper)/log(2)",
    });
    expect(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY.uncertaintyCoverage,
    ).toMatchObject({
      coverageKind:
        "joint_simultaneous_95_percent_or_stronger_deterministic_enclosure",
      componentwiseMarginalCoverageSufficient: false,
      serverDerivationReceiptRequired: true,
      serverDerivationReceiptIntegrated: false,
    });
    expect(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY.pairBinding,
    ).toMatchObject({
      rejectCaseInsensitiveEqualOutputRoots: true,
      rejectAncestorOrDescendantOutputRoots: true,
      realpathFilesystemIdentityVerified: false,
      symlinkJunctionHardlinkIdentityVerified: false,
      pairBindingGrantsReplayOrAgreementAuthority: false,
    });
  });

  it("rejects omission of every one of the 63 required role slots", () => {
    const baseline = completeManifest();
    baseline.levels.forEach((level, levelIndex) => {
      level.families.forEach((family, familyIndex) => {
        family.operands.forEach((_operand, roleIndex) => {
          const missing = completeManifest();
          missing.levels[levelIndex].families[familyIndex].operands.splice(
            roleIndex,
            1,
          );
          resealInventory(missing);
          expect(
            nhm2SemiclassicalV2ConstraintOperandReplayViolations(missing),
          ).toContain(
            `operand_count_invalid:/levels/${levelIndex}/families/${familyIndex}`,
          );
        });
      });
    });
  });

  it("rejects reordered levels, families, roles, and channels", () => {
    const levelOrder = completeManifest();
    levelOrder.levels.reverse();
    resealInventory(levelOrder);
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(levelOrder),
    ).toContain("level_binding_invalid:/levels/0");

    const familyOrder = completeManifest();
    familyOrder.levels[0].families.reverse();
    resealInventory(familyOrder);
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(familyOrder),
    ).toContain("family_binding_invalid:/levels/0/families/0");

    const roleOrder = completeManifest();
    roleOrder.levels[0].families[0].operands.reverse();
    resealInventory(roleOrder);
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(roleOrder),
    ).toContain("operand_descriptor_invalid:/levels/0/families/0/operands/0");

    const channelOrder = completeManifest();
    channelOrder.levels[0].families[0].operands[0].componentOrder.reverse();
    resealInventory(channelOrder);
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(channelOrder),
    ).toContain("operand_descriptor_invalid:/levels/0/families/0/operands/0");
  });

  it("rejects representation, unit, size, hash, and freshness drift", () => {
    const mutations: Array<
      (operand: Nhm2SemiclassicalV2ConstraintOperandArrayV1) => void
    > = [
      (operand) => {
        operand.shape = [64, 3] as unknown as [64, 4];
      },
      (operand) => {
        operand.unit = "constraint_density_SI" as never;
      },
      (operand) => {
        operand.binaryEncoding = "json" as never;
      },
      (operand) => {
        operand.endianness = "big" as never;
      },
      (operand) => {
        operand.sizeBytes = 8 as 2048;
      },
      (operand) => {
        operand.sha256 = "not-a-hash";
      },
      (operand) => {
        operand.freshness = "preexisting_unchanged" as never;
      },
    ];
    for (const mutate of mutations) {
      const manifest = completeManifest();
      mutate(manifest.levels[0].families[0].operands[0]);
      resealInventory(manifest);
      expect(
        nhm2SemiclassicalV2ConstraintOperandReplayViolations(manifest),
      ).toContain("operand_descriptor_invalid:/levels/0/families/0/operands/0");
    }
  });

  it("binds every operand to a deterministic pre-execution scientific preseal", () => {
    const wrongCandidateHash = completeManifest();
    wrongCandidateHash.candidateBinding.scientificPresealBinding.candidateManifestSha256 =
      hash("other-candidate");
    resealInventory(wrongCandidateHash);
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(wrongCandidateHash),
    ).toContain("scientific_preseal_binding_invalid");

    const retunedSeal = completeManifest();
    retunedSeal.candidateBinding.scientificPresealBinding.sealKey =
      hash("retuned-seal");
    resealInventory(retunedSeal);
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(retunedSeal),
    ).toContain("scientific_preseal_binding_invalid");

    const operandFromOtherSeal = completeManifest();
    operandFromOtherSeal.levels[2].families[4].operands[4].scientificPresealSealKey =
      hash("other-seal");
    resealInventory(operandFromOtherSeal);
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(
        operandFromOtherSeal,
      ),
    ).toContain("operand_descriptor_invalid:/levels/2/families/4/operands/4");

    const latePreseal = completeManifest();
    latePreseal.candidateBinding.scientificPresealBinding.sealedAt =
      latePreseal.execution.startedAt;
    resealInventory(latePreseal);
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(latePreseal),
    ).toContain("preseal_execution_chronology_invalid");
  });

  it("requires fresh post-run observations inside one run-specific output root", () => {
    const stale = completeManifest();
    stale.levels[0].families[0].operands[0].observedAt = COMPLETED_AT.replace(
      "02.000",
      "01.999",
    );
    resealInventory(stale);
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(stale),
    ).toContain("operand_descriptor_invalid:/levels/0/families/0/operands/0");

    const escaped = completeManifest();
    escaped.levels[0].families[0].operands[0].path =
      "artifacts/unbound/raw.f64le";
    resealInventory(escaped);
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(escaped),
    ).toContain("operand_descriptor_invalid:/levels/0/families/0/operands/0");

    const wrongNamespacedRole = completeManifest();
    wrongNamespacedRole.levels[0].families[0].operands[0].path = `${OUTPUT_DIRECTORY}/level_0/H_H/arbitrary.f64le`;
    resealInventory(wrongNamespacedRole);
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(wrongNamespacedRole),
    ).toContain("operand_descriptor_invalid:/levels/0/families/0/operands/0");

    const alias = completeManifest();
    alias.levels[0].families[0].operands[1].path =
      alias.levels[0].families[0].operands[0].path.toUpperCase();
    resealInventory(alias);
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(alias),
    ).toContain("operand_paths_not_unique");
  });

  it("accepts full Git SHA-1 or SHA-256 provenance and rejects other widths", () => {
    const sha1 = completeManifest();
    expect(sha1.execution.commitSha).toHaveLength(40);
    expect(nhm2SemiclassicalV2ConstraintOperandReplayViolations(sha1)).toEqual(
      [],
    );

    const sha256 = completeManifest();
    sha256.execution.commitSha = hash("sha256-git-object-format");
    resealInventory(sha256);
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(sha256),
    ).toEqual([]);

    const abbreviated = completeManifest();
    abbreviated.execution.commitSha = hash("commit").slice(0, 12);
    resealInventory(abbreviated);
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(abbreviated),
    ).toContain("execution_binding_invalid");
  });

  it("detects descriptor and preseal mutation through the inventory closure", () => {
    const descriptorMutation = completeManifest();
    descriptorMutation.levels[1].families[3].operands[0].sha256 =
      hash("mutated-bytes");
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(descriptorMutation),
    ).toContain("operand_inventory_sha256_mismatch");

    const presealMutation = completeManifest();
    presealMutation.candidateBinding.scientificPresealBinding.scientificContentSha256 =
      hash("different-science");
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(presealMutation),
    ).toContain("operand_inventory_sha256_mismatch");

    const observationWindowMutation = completeManifest();
    observationWindowMutation.generatedAt = "2026-08-10T12:00:05.000Z";
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(
        observationWindowMutation,
      ),
    ).toContain("operand_inventory_sha256_mismatch");

    const wrongPolicyArtifact = completeManifest();
    wrongPolicyArtifact.policyBinding.artifactId =
      "nhm2.producer_selected_policy" as never;
    resealInventory(wrongPolicyArtifact);
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(wrongPolicyArtifact),
    ).toContain("policy_binding_invalid");
  });

  it("rejects producer-derived-only substitutions and injected pass summaries", () => {
    const duplicateResidual = completeManifest();
    duplicateResidual.levels[0].families[0].operands[0].operandRole =
      "residual";
    resealInventory(duplicateResidual);
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(duplicateResidual),
    ).toContain("operand_descriptor_invalid:/levels/0/families/0/operands/0");

    const injected = completeManifest() as unknown as Record<string, unknown>;
    injected.producerConvergencePass = true;
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(injected),
    ).toEqual(["manifest_shape_invalid"]);

    const familySummary = completeManifest() as unknown as {
      levels: Array<{ families: Array<Record<string, unknown>> }>;
    };
    familySummary.levels[0].families[0].producerObservedOrder = 99;
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(familySummary),
    ).toContain("family_binding_invalid:/levels/0/families/0");

    const injectedDerivedValues = completeManifest() as unknown as Record<
      string,
      unknown
    >;
    injectedDerivedValues.producerDerivedConvergence = {
      residualMismatchLInf: 0,
      residualUpper95: 0,
      q_2: 0,
      p_observed: 99,
      pass: true,
    };
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(
        injectedDerivedValues,
      ),
    ).toEqual(["manifest_shape_invalid"]);

    const overflowSummary = completeManifest() as unknown as Record<
      string,
      unknown
    >;
    overflowSummary.producerDerivedConvergence = {
      q_2: Number.MAX_VALUE * 2,
    };
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(overflowSummary),
    ).toEqual(["manifest_plain_data_snapshot_invalid"]);
  });

  it("keeps integration, candidate, preseal, replay, lamps, theory, and physical claims locked", () => {
    expect(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_AUTHORITY_BOUNDARY.schemaImplemented,
    ).toBe(true);
    for (const [key, expected] of Object.entries(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_AUTHORITY_BOUNDARY,
    )) {
      if (key === "schemaImplemented") continue;
      expect(expected, key).toBe(false);
      const manifest = completeManifest();
      (manifest.authorityBoundary as unknown as Record<string, boolean>)[key] =
        true;
      expect(
        nhm2SemiclassicalV2ConstraintOperandReplayViolations(manifest),
      ).toContain("authority_boundary_invalid");
    }

    const schemaDenied = completeManifest();
    (schemaDenied.authorityBoundary as unknown as Record<string, boolean>)[
      "schemaImplemented"
    ] = false;
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(schemaDenied),
    ).toContain("authority_boundary_invalid");
  });

  it("binds a primary/independent pair without granting agreement authority", () => {
    const primary = completeManifest();
    const independent = independentManifest();
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayPairViolations(
        primary,
        independent,
      ),
    ).toEqual([]);
    expect(primary.authorityBoundary.independentAgreement).toBe(false);
    expect(independent.authorityBoundary.independentAgreement).toBe(false);

    const copiedImplementation = independentManifest();
    copiedImplementation.implementation.sourceIdentityId =
      primary.implementation.sourceIdentityId;
    copiedImplementation.implementation.sourceSha256 =
      primary.implementation.sourceSha256;
    resealInventory(copiedImplementation);
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayPairViolations(
        primary,
        copiedImplementation,
      ),
    ).toEqual(
      expect.arrayContaining([
        "source_identity_id_not_distinct",
        "source_sha256_not_distinct",
      ]),
    );

    const retunedScience = independentManifest();
    retunedScience.candidateBinding.scientificPresealBinding.scientificContentSha256 =
      hash("retuned-independent-science");
    resealInventory(retunedScience);
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayPairViolations(
        primary,
        retunedScience,
      ),
    ).toContain("pair_scientific_preseal_binding_mismatch");

    const wrongPair = independentManifest();
    wrongPair.implementation.comparisonPairId = "pair.other/v1";
    resealInventory(wrongPair);
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayPairViolations(
        primary,
        wrongPair,
      ),
    ).toContain("comparison_pair_id_mismatch");

    const caseAliasedRoot = independentManifest();
    rebaseOutputDirectory(caseAliasedRoot, OUTPUT_DIRECTORY.toUpperCase());
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayPairViolations(
        primary,
        caseAliasedRoot,
      ),
    ).toContain("pair_output_root_topology_invalid");

    const nestedRoot = independentManifest();
    rebaseOutputDirectory(nestedRoot, `${OUTPUT_DIRECTORY}/independent`);
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayPairViolations(
        primary,
        nestedRoot,
      ),
    ).toContain("pair_output_root_topology_invalid");

    const ancestorRoot = independentManifest();
    rebaseOutputDirectory(ancestorRoot, "artifacts");
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayPairViolations(
        primary,
        ancestorRoot,
      ),
    ).toContain("pair_output_root_topology_invalid");
  });

  it("keeps pair validation exception-safe against hostile and stateful inputs", () => {
    const independent = independentManifest();
    const proxy = new Proxy(completeManifest(), {});
    let proxyResult: string[] | null = null;
    expect(() => {
      proxyResult = nhm2SemiclassicalV2ConstraintOperandReplayPairViolations(
        proxy,
        independent,
      );
    }).not.toThrow();
    expect(proxyResult).toContain(
      "primary_manifest_invalid:manifest_plain_data_snapshot_invalid",
    );

    const primary = completeManifest();
    const originalStructuredClone = globalThis.structuredClone;
    let primaryOriginalObservations = 0;
    const cloneSpy = vi
      .spyOn(globalThis, "structuredClone")
      .mockImplementation(((value: unknown) => {
        if (value === primary) {
          primaryOriginalObservations += 1;
          if (primaryOriginalObservations > 1) return {};
        }
        return originalStructuredClone(value);
      }) as typeof structuredClone);
    try {
      let result: string[] | null = null;
      expect(() => {
        result = nhm2SemiclassicalV2ConstraintOperandReplayPairViolations(
          primary,
          independent,
        );
      }).not.toThrow();
      expect(result).toEqual([]);
      expect(primaryOriginalObservations).toBe(1);
    } finally {
      cloneSpy.mockRestore();
    }

    const modifiedOnFirstSnapshot = completeManifest();
    const modifiedSnapshotSpy = vi
      .spyOn(globalThis, "structuredClone")
      .mockImplementation(((value: unknown) =>
        value === modifiedOnFirstSnapshot
          ? {}
          : originalStructuredClone(value)) as typeof structuredClone);
    try {
      let result: string[] | null = null;
      expect(() => {
        result = nhm2SemiclassicalV2ConstraintOperandReplayPairViolations(
          modifiedOnFirstSnapshot,
          independent,
        );
      }).not.toThrow();
      expect(result).toContain(
        "primary_manifest_invalid:manifest_shape_invalid",
      );
    } finally {
      modifiedSnapshotSpy.mockRestore();
    }
  });

  it("rejects accessors, symbols, exotic prototypes, and Proxy wrappers before validation", () => {
    let getterReads = 0;
    const accessor = completeManifest();
    Object.defineProperty(accessor, "generatedAt", {
      configurable: true,
      enumerable: true,
      get: () => {
        getterReads += 1;
        return GENERATED_AT;
      },
    });
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(accessor),
    ).toEqual(["manifest_plain_data_snapshot_invalid"]);
    expect(getterReads).toBe(0);

    const symbol = completeManifest() as unknown as Record<
      PropertyKey,
      unknown
    >;
    symbol[Symbol("producer-pass")] = true;
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(symbol),
    ).toEqual(["manifest_plain_data_snapshot_invalid"]);

    const exoticPrototype = completeManifest();
    Object.setPrototypeOf(exoticPrototype, { producerAuthority: true });
    expect(
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(exoticPrototype),
    ).toEqual(["manifest_plain_data_snapshot_invalid"]);

    const proxy = new Proxy(completeManifest(), {});
    expect(nhm2SemiclassicalV2ConstraintOperandReplayViolations(proxy)).toEqual(
      ["manifest_plain_data_snapshot_invalid"],
    );
    expect(isNhm2SemiclassicalV2ConstraintOperandReplay(proxy)).toBe(false);
  });

  it("fails closed without throwing for malformed and cyclic objects", () => {
    for (const value of [null, [], {}, { artifactId: "wrong" }]) {
      expect(() =>
        nhm2SemiclassicalV2ConstraintOperandReplayViolations(value),
      ).not.toThrow();
      expect(
        nhm2SemiclassicalV2ConstraintOperandReplayViolations(value),
      ).toContain("manifest_shape_invalid");
    }
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() =>
      nhm2SemiclassicalV2ConstraintOperandReplayViolations(cyclic),
    ).not.toThrow();
    expect(isNhm2SemiclassicalV2ConstraintOperandReplay(cyclic)).toBe(false);
  });
});
