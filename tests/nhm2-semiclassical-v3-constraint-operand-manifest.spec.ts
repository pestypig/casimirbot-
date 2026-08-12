import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import {
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_COMPLETE_INPUT_CLOSURE_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_COMPLETE_INPUT_CLOSURE_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_ARRAYS_PER_LEVEL,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_SCHEMA_BOUNDARY,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_INPUT_CLOSURE_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_INPUT_CLOSURE_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_PRESEAL_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_PRESEAL_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING,
  collectNhm2SemiclassicalV3ConstraintOperandArrays,
  computeNhm2SemiclassicalV3ConstraintCompleteInputClosureSha256,
  computeNhm2SemiclassicalV3ConstraintOperandInventorySha256,
  computeNhm2SemiclassicalV3ConstraintScientificInputClosureSha256,
  computeNhm2SemiclassicalV3ConstraintScientificPresealSealKey,
  isNhm2SemiclassicalV3ConstraintOperandManifest,
  nhm2SemiclassicalV3ConstraintOperandManifestViolations,
  validateNhm2SemiclassicalV3ConstraintOperandManifest,
  type Nhm2SemiclassicalV3ConstraintCompleteInputClosureV1,
  type Nhm2SemiclassicalV3ConstraintOperandArrayV1,
  type Nhm2SemiclassicalV3ConstraintOperandManifestV1,
  type Nhm2SemiclassicalV3ConstraintScientificInputClosureV1,
} from "../shared/contracts/nhm2-semiclassical-v3-constraint-operand-manifest.v1";
import {
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARRAY_COUNT,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_CHANNEL_ORDER,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_FAMILY_ORDER,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_LEVELS,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_OUTPUT_ROLES,
  NHM2_SEMICLASSICAL_V3_CONSTRAINT_ROLE_ORDER,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCK_KEYS,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
  NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS,
  NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS,
} from "../shared/contracts/nhm2-semiclassical-v3-replay-epoch.v1";

const hash = (value: string): string =>
  createHash("sha256").update(value, "utf8").digest("hex");

const CANDIDATE_ID = "nhm2.semiclassical_v3.constraint_candidate.test/v1";
const PRESEAL_ID = "nhm2.semiclassical_v3.constraint_preseal.test/v1";
const OUTPUT_DIRECTORY = "artifacts/nhm2-v3-constraint-operands/run-primary";
const INPUT_OBSERVED_AT = "2026-08-11T11:59:58.000Z";
const SEALED_AT = "2026-08-11T11:59:59.000Z";
const IMPLEMENTATION_OBSERVED_AT = "2026-08-11T11:59:59.500Z";
const COMPLETE_INPUT_FROZEN_AT = "2026-08-11T11:59:59.750Z";
const STARTED_AT = "2026-08-11T12:00:00.000Z";
const COMPLETED_AT = "2026-08-11T12:00:02.000Z";
const OPERAND_OBSERVED_AT = "2026-08-11T12:00:03.000Z";
const GENERATED_AT = "2026-08-11T12:00:04.000Z";

const buildScientificInputClosure =
  (): Nhm2SemiclassicalV3ConstraintScientificInputClosureV1 => {
    const inputs = NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS.map(
      (inputId) => ({
        inputId,
        identityId:
          inputId === "candidate_manifest"
            ? CANDIDATE_ID
            : `nhm2.semiclassical_v3.input.${inputId}/v1`,
        sha256: hash(`input:${inputId}`),
        sizeBytes: 1_024 + inputId.length,
        observedAt: INPUT_OBSERVED_AT,
      }),
    );
    const closure: Nhm2SemiclassicalV3ConstraintScientificInputClosureV1 = {
      artifactId:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_INPUT_CLOSURE_ARTIFACT_ID,
      contractVersion:
        NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_INPUT_CLOSURE_CONTRACT_VERSION,
      requiredInputIds: [...NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS],
      inputs,
      sha256: "0".repeat(64),
    };
    closure.sha256 =
      computeNhm2SemiclassicalV3ConstraintScientificInputClosureSha256(closure);
    return closure;
  };

const buildCompleteInputClosure = (
  scientific: Nhm2SemiclassicalV3ConstraintScientificInputClosureV1,
): Nhm2SemiclassicalV3ConstraintCompleteInputClosureV1 => {
  const scientificById = new Map(
    scientific.inputs.map((descriptor) => [descriptor.inputId, descriptor]),
  );
  const inputs = NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS.map((inputId) => {
    const scientificDescriptor = scientificById.get(inputId);
    if (scientificDescriptor != null)
      return structuredClone(scientificDescriptor);
    return {
      inputId,
      identityId: `nhm2.semiclassical_v3.input.${inputId}.primary/v1`,
      sha256: hash(`input:${inputId}:primary`),
      sizeBytes: 2_048 + inputId.length,
      observedAt: IMPLEMENTATION_OBSERVED_AT,
    };
  });
  const closure: Nhm2SemiclassicalV3ConstraintCompleteInputClosureV1 = {
    artifactId:
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_COMPLETE_INPUT_CLOSURE_ARTIFACT_ID,
    contractVersion:
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_COMPLETE_INPUT_CLOSURE_CONTRACT_VERSION,
    requiredInputIds: [...NHM2_SEMICLASSICAL_V3_REQUIRED_INPUT_IDS],
    inputs,
    scientificInputClosureSha256: scientific.sha256,
    frozenAt: COMPLETE_INPUT_FROZEN_AT,
    sha256: "0".repeat(64),
  };
  closure.sha256 =
    computeNhm2SemiclassicalV3ConstraintCompleteInputClosureSha256(closure);
  return closure;
};

const descriptor = (
  levelId: string,
  familyId: string,
  operandRole: Nhm2SemiclassicalV3ConstraintOperandArrayV1["operandRole"],
  sealKey: string,
): Nhm2SemiclassicalV3ConstraintOperandArrayV1 => {
  const path = `${OUTPUT_DIRECTORY}/${levelId}/${familyId}/${operandRole}.f64le`;
  return {
    arrayRole: `constraint_operand.${levelId}.${familyId}.${operandRole}`,
    operandRole,
    path,
    sha256: hash(`output:${path}`),
    sizeBytes: NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_ARRAY_SIZE_BYTES,
    freshness: "new",
    observedAt: OPERAND_OBSERVED_AT,
    scientificPresealSealKey: sealKey,
    dtype: "float64",
    binaryEncoding: "raw_ieee754",
    endianness: "little",
    shape: [64, 4],
    storageOrder: "row-major",
    componentOrder: [...NHM2_SEMICLASSICAL_V3_CONSTRAINT_CHANNEL_ORDER],
    sampleOrder: "candidate_sampling_ordinal_0_to_63",
    unit: "dimensionless_barred_constraint_generator",
  };
};

const completeManifest = (): Nhm2SemiclassicalV3ConstraintOperandManifestV1 => {
  const scientificInputClosure = buildScientificInputClosure();
  const completeInputClosure = buildCompleteInputClosure(
    scientificInputClosure,
  );
  const candidateManifest = scientificInputClosure.inputs.find(
    (input) => input.inputId === "candidate_manifest",
  )!;
  const sealKey = computeNhm2SemiclassicalV3ConstraintScientificPresealSealKey({
    presealId: PRESEAL_ID,
    candidateId: CANDIDATE_ID,
    candidateManifestSha256: candidateManifest.sha256,
    scientificInputClosureSha256: scientificInputClosure.sha256,
  });
  const implementationSource = completeInputClosure.inputs.find(
    (input) => input.inputId === "implementation_source",
  )!;
  const dependencyLock = completeInputClosure.inputs.find(
    (input) => input.inputId === "dependency_lock",
  )!;
  const executable = completeInputClosure.inputs.find(
    (input) => input.inputId === "executable",
  )!;
  const manifest: Nhm2SemiclassicalV3ConstraintOperandManifestV1 = {
    artifactId: NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_ARTIFACT_ID,
    contractVersion:
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_MANIFEST_CONTRACT_VERSION,
    generatedAt: GENERATED_AT,
    replayEpochPolicyBinding: structuredClone(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING,
    ),
    constraintArithmeticPolicyBinding: structuredClone(
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
    ),
    candidateBinding: {
      candidateId: CANDIDATE_ID,
      candidateManifestSha256: candidateManifest.sha256,
      scientificInputClosureSha256: scientificInputClosure.sha256,
      scientificPresealBinding: {
        artifactId:
          NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_PRESEAL_ARTIFACT_ID,
        contractVersion:
          NHM2_SEMICLASSICAL_V3_CONSTRAINT_SCIENTIFIC_PRESEAL_CONTRACT_VERSION,
        presealId: PRESEAL_ID,
        sealKey,
        candidateId: CANDIDATE_ID,
        candidateManifestSha256: candidateManifest.sha256,
        scientificInputClosureSha256: scientificInputClosure.sha256,
        sealedAt: SEALED_AT,
      },
    },
    scientificInputClosure,
    completeInputClosure,
    implementation: {
      comparisonPairId: "nhm2.semiclassical_v3.constraint_pair.test/v1",
      role: "primary",
      implementationId:
        "nhm2.semiclassical_v3.constraint_implementation.primary/v1",
      sourceIdentityId: implementationSource.identityId,
      sourceSha256: implementationSource.sha256,
      dependencyLockIdentityId: dependencyLock.identityId,
      dependencyLockSha256: dependencyLock.sha256,
      executableIdentityId: executable.identityId,
      executableSha256: executable.sha256,
    },
    execution: {
      runId: "nhm2.semiclassical_v3.constraint_run.primary/v1",
      commitSha: hash("commit").slice(0, 40),
      command: "solver --emit-v3-constraint-operands",
      argv: ["solver", "--emit-v3-constraint-operands"],
      outputDirectory: OUTPUT_DIRECTORY,
      startedAt: STARTED_AT,
      completedAt: COMPLETED_AT,
      durationMs: 2_000,
      exitCode: 0,
      terminationSignal: null,
    },
    levels: NHM2_SEMICLASSICAL_V3_CONSTRAINT_LEVELS.map((level) => ({
      ...level,
      families: NHM2_SEMICLASSICAL_V3_CONSTRAINT_FAMILY_ORDER.map(
        (familyId) => {
          const roles = NHM2_SEMICLASSICAL_V3_CONSTRAINT_ROLE_ORDER[familyId];
          return {
            familyId,
            operandOrder: [...roles],
            residualFormula:
              NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY
                .residualFormulas[familyId],
            operands: roles.map((role) =>
              descriptor(level.levelId, familyId, role, sealKey),
            ),
          };
        },
      ),
    })),
    operandInventorySha256: "0".repeat(64),
    claimLocks: structuredClone(NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS),
    schemaBoundary: structuredClone(
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_SCHEMA_BOUNDARY,
    ),
  };
  manifest.operandInventorySha256 =
    computeNhm2SemiclassicalV3ConstraintOperandInventorySha256(manifest);
  return manifest;
};

const cloneManifest = (
  manifest = completeManifest(),
): Nhm2SemiclassicalV3ConstraintOperandManifestV1 => structuredClone(manifest);

const resealManifest = (
  manifest: Nhm2SemiclassicalV3ConstraintOperandManifestV1,
): void => {
  manifest.operandInventorySha256 =
    computeNhm2SemiclassicalV3ConstraintOperandInventorySha256(manifest);
};

const resealCompleteInputClosure = (
  manifest: Nhm2SemiclassicalV3ConstraintOperandManifestV1,
): void => {
  manifest.completeInputClosure.scientificInputClosureSha256 =
    manifest.scientificInputClosure.sha256;
  manifest.completeInputClosure.sha256 =
    computeNhm2SemiclassicalV3ConstraintCompleteInputClosureSha256(
      manifest.completeInputClosure,
    );
  resealManifest(manifest);
};

const resealScientificInputAndPreseal = (
  manifest: Nhm2SemiclassicalV3ConstraintOperandManifestV1,
): void => {
  manifest.scientificInputClosure.sha256 =
    computeNhm2SemiclassicalV3ConstraintScientificInputClosureSha256(
      manifest.scientificInputClosure,
    );
  for (
    let index = 0;
    index < NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS.length;
    index += 1
  ) {
    manifest.completeInputClosure.inputs[index] = structuredClone(
      manifest.scientificInputClosure.inputs[index],
    );
  }
  manifest.completeInputClosure.scientificInputClosureSha256 =
    manifest.scientificInputClosure.sha256;
  manifest.completeInputClosure.sha256 =
    computeNhm2SemiclassicalV3ConstraintCompleteInputClosureSha256(
      manifest.completeInputClosure,
    );
  const candidateInput = manifest.scientificInputClosure.inputs.find(
    (input) => input.inputId === "candidate_manifest",
  )!;
  manifest.candidateBinding.candidateManifestSha256 = candidateInput.sha256;
  manifest.candidateBinding.scientificInputClosureSha256 =
    manifest.scientificInputClosure.sha256;
  const preseal = manifest.candidateBinding.scientificPresealBinding;
  preseal.candidateId = manifest.candidateBinding.candidateId;
  preseal.candidateManifestSha256 = candidateInput.sha256;
  preseal.scientificInputClosureSha256 = manifest.scientificInputClosure.sha256;
  preseal.sealKey =
    computeNhm2SemiclassicalV3ConstraintScientificPresealSealKey({
      presealId: preseal.presealId,
      candidateId: manifest.candidateBinding.candidateId,
      candidateManifestSha256: candidateInput.sha256,
      scientificInputClosureSha256: manifest.scientificInputClosure.sha256,
    });
  for (const operand of collectNhm2SemiclassicalV3ConstraintOperandArrays(
    manifest,
  )) {
    operand.scientificPresealSealKey = preseal.sealKey;
  }
  resealManifest(manifest);
};

describe("NHM2 semiclassical-v3 constraint operand manifest", () => {
  it("accepts one clean v3 snapshot with exact epoch and arithmetic policy bindings", () => {
    const manifest = completeManifest();
    const result =
      validateNhm2SemiclassicalV3ConstraintOperandManifest(manifest);
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
    expect(isNhm2SemiclassicalV3ConstraintOperandManifest(manifest)).toBe(true);
    expect(manifest.replayEpochPolicyBinding).toEqual(
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_POLICY_BINDING,
    );
    expect(manifest.constraintArithmeticPolicyBinding).toEqual(
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARITHMETIC_POLICY_BINDING,
    );
    expect(manifest.constraintArithmeticPolicyBinding).toHaveProperty(
      "sizeBytes",
    );
    expect(manifest.constraintArithmeticPolicyBinding).toHaveProperty(
      "mediaType",
      "application/json",
    );
    expect(manifest.scientificInputClosure.inputs).toHaveLength(25);
    expect(manifest.completeInputClosure.inputs).toHaveLength(28);
    expect(manifest.completeInputClosure.inputs.slice(0, 25)).toEqual(
      manifest.scientificInputClosure.inputs,
    );
    expect(result.ok && Object.isFrozen(result.manifest)).toBe(true);
    expect(
      result.ok && Object.isFrozen(result.manifest.levels[0].families[0]),
    ).toBe(true);
  });

  it("requires exactly three levels, 21 roles per level, and 63 canonical files", () => {
    const manifest = completeManifest();
    expect(manifest.levels).toHaveLength(3);
    expect(NHM2_SEMICLASSICAL_V3_CONSTRAINT_OPERAND_ARRAYS_PER_LEVEL).toBe(21);
    for (const level of manifest.levels) {
      expect(
        level.families.reduce(
          (count, family) => count + family.operands.length,
          0,
        ),
      ).toBe(21);
    }
    const operands =
      collectNhm2SemiclassicalV3ConstraintOperandArrays(manifest);
    expect(operands).toHaveLength(NHM2_SEMICLASSICAL_V3_CONSTRAINT_ARRAY_COUNT);
    expect(operands.map((operand) => operand.arrayRole)).toEqual(
      NHM2_SEMICLASSICAL_V3_CONSTRAINT_OUTPUT_ROLES,
    );
    for (const level of manifest.levels) {
      for (const family of level.families) {
        for (const operand of family.operands) {
          expect(operand.path).toBe(
            `${OUTPUT_DIRECTORY}/${level.levelId}/${family.familyId}/${operand.operandRole}.f64le`,
          );
          expect(operand).toMatchObject({
            shape: [64, 4],
            dtype: "float64",
            binaryEncoding: "raw_ieee754",
            endianness: "little",
            sizeBytes: 2_048,
            freshness: "new",
          });
        }
      }
    }
  });

  it("rejects omission of every one of the 63 exact operand slots", () => {
    const baseline = completeManifest();
    baseline.levels.forEach((level, levelIndex) => {
      level.families.forEach((family, familyIndex) => {
        family.operands.forEach((_operand, roleIndex) => {
          const manifest = completeManifest();
          manifest.levels[levelIndex].families[familyIndex].operands.splice(
            roleIndex,
            1,
          );
          resealManifest(manifest);
          expect(
            nhm2SemiclassicalV3ConstraintOperandManifestViolations(manifest),
          ).toContain(
            `operand_count_invalid:/levels/${levelIndex}/families/${familyIndex}`,
          );
        });
      });
    });
  });

  it("rejects reordered levels, families, roles, channels, and array-role order", () => {
    const levelOrder = completeManifest();
    levelOrder.levels.reverse();
    resealManifest(levelOrder);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(levelOrder),
    ).toContain("level_binding_invalid:/levels/0");

    const familyOrder = completeManifest();
    familyOrder.levels[0].families.reverse();
    resealManifest(familyOrder);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(familyOrder),
    ).toContain("family_binding_invalid:/levels/0/families/0");

    const roleOrder = completeManifest();
    roleOrder.levels[0].families[0].operands.reverse();
    resealManifest(roleOrder);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(roleOrder),
    ).toContain("operand_descriptor_invalid:/levels/0/families/0/operands/0");

    const channelOrder = completeManifest();
    channelOrder.levels[0].families[0].operands[0].componentOrder.reverse();
    resealManifest(channelOrder);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(channelOrder),
    ).toContain("operand_descriptor_invalid:/levels/0/families/0/operands/0");

    const arrayRole = completeManifest();
    arrayRole.levels[0].families[0].operands[0].arrayRole =
      "constraint_operand.level_0.H_H.target";
    resealManifest(arrayRole);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(arrayRole),
    ).toContain("constraint_array_role_order_invalid");
  });

  it("rejects path, representation, hash, size, freshness, and preseal drift", () => {
    const mutations: Array<
      (operand: Nhm2SemiclassicalV3ConstraintOperandArrayV1) => void
    > = [
      (operand) => {
        operand.path = "artifacts/unbound.f64le";
      },
      (operand) => {
        operand.shape = [64, 3] as unknown as [64, 4];
      },
      (operand) => {
        operand.binaryEncoding = "json" as never;
      },
      (operand) => {
        operand.endianness = "big" as never;
      },
      (operand) => {
        operand.sha256 = "not-a-hash";
      },
      (operand) => {
        operand.sizeBytes = 8 as 2048;
      },
      (operand) => {
        operand.freshness = "preexisting_unchanged" as never;
      },
      (operand) => {
        operand.scientificPresealSealKey = hash("wrong-preseal");
      },
    ];
    for (const mutate of mutations) {
      const manifest = completeManifest();
      mutate(manifest.levels[0].families[0].operands[0]);
      resealManifest(manifest);
      expect(
        nhm2SemiclassicalV3ConstraintOperandManifestViolations(manifest),
      ).toContain("operand_descriptor_invalid:/levels/0/families/0/operands/0");
    }
  });

  it("binds candidate, preseal, ordered input closure, and implementation identities", () => {
    const scientificOmission = completeManifest();
    scientificOmission.scientificInputClosure.inputs.pop();
    scientificOmission.scientificInputClosure.sha256 =
      computeNhm2SemiclassicalV3ConstraintScientificInputClosureSha256(
        scientificOmission.scientificInputClosure,
      );
    resealManifest(scientificOmission);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(
        scientificOmission,
      ),
    ).toContain("scientific_input_closure_shape_invalid");

    const completeReorder = completeManifest();
    completeReorder.completeInputClosure.inputs.reverse();
    completeReorder.completeInputClosure.sha256 =
      computeNhm2SemiclassicalV3ConstraintCompleteInputClosureSha256(
        completeReorder.completeInputClosure,
      );
    resealManifest(completeReorder);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(completeReorder),
    ).toContain(
      "complete_input_descriptor_invalid:/completeInputClosure/inputs/0",
    );

    const candidateMismatch = completeManifest();
    candidateMismatch.candidateBinding.candidateManifestSha256 = hash("other");
    resealManifest(candidateMismatch);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(candidateMismatch),
    ).toContain("candidate_binding_invalid");

    const scientificClosureMismatch = completeManifest();
    scientificClosureMismatch.scientificInputClosure.inputs[0].sizeBytes += 1;
    resealManifest(scientificClosureMismatch);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(
        scientificClosureMismatch,
      ),
    ).toContain("scientific_input_closure_sha256_mismatch");

    const presealMismatch = completeManifest();
    presealMismatch.candidateBinding.scientificPresealBinding.sealKey =
      hash("wrong");
    resealManifest(presealMismatch);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(presealMismatch),
    ).toContain("scientific_preseal_binding_invalid");

    const presealIdentityMismatch = completeManifest();
    presealIdentityMismatch.candidateBinding.scientificPresealBinding.presealId =
      "nhm2.semiclassical_v3.constraint_preseal.other/v1";
    resealManifest(presealIdentityMismatch);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(
        presealIdentityMismatch,
      ),
    ).toContain("scientific_preseal_binding_invalid");

    const implementationMismatch = completeManifest();
    implementationMismatch.implementation.sourceSha256 = hash("other-source");
    resealManifest(implementationMismatch);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(
        implementationMismatch,
      ),
    ).toContain("implementation_input_binding_invalid:implementation_source");

    const coherentlyChangedInput = completeManifest();
    coherentlyChangedInput.scientificInputClosure.inputs[1].sha256 =
      hash("new-input");
    resealScientificInputAndPreseal(coherentlyChangedInput);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(
        coherentlyChangedInput,
      ),
    ).toEqual([]);
  });

  it("shares one 25-input science preseal across distinct 3-input implementation lanes", () => {
    const primary = completeManifest();
    const independent = completeManifest();
    independent.implementation.role = "independent";
    independent.implementation.implementationId =
      "nhm2.semiclassical_v3.constraint_implementation.independent/v1";
    for (const inputId of [
      "implementation_source",
      "dependency_lock",
      "executable",
    ] as const) {
      const descriptor = independent.completeInputClosure.inputs.find(
        (input) => input.inputId === inputId,
      )!;
      descriptor.identityId = `nhm2.semiclassical_v3.input.${inputId}.independent/v1`;
      descriptor.sha256 = hash(`input:${inputId}:independent`);
    }
    const source = independent.completeInputClosure.inputs.find(
      (input) => input.inputId === "implementation_source",
    )!;
    const dependency = independent.completeInputClosure.inputs.find(
      (input) => input.inputId === "dependency_lock",
    )!;
    const executable = independent.completeInputClosure.inputs.find(
      (input) => input.inputId === "executable",
    )!;
    independent.implementation.sourceIdentityId = source.identityId;
    independent.implementation.sourceSha256 = source.sha256;
    independent.implementation.dependencyLockIdentityId = dependency.identityId;
    independent.implementation.dependencyLockSha256 = dependency.sha256;
    independent.implementation.executableIdentityId = executable.identityId;
    independent.implementation.executableSha256 = executable.sha256;
    resealCompleteInputClosure(independent);

    expect(independent.scientificInputClosure).toEqual(
      primary.scientificInputClosure,
    );
    expect(independent.candidateBinding.scientificPresealBinding).toEqual(
      primary.candidateBinding.scientificPresealBinding,
    );
    expect(independent.completeInputClosure.sha256).not.toBe(
      primary.completeInputClosure.sha256,
    );
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(primary),
    ).toEqual([]);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(independent),
    ).toEqual([]);
  });

  it("requires exact policy hashes and rejects any caller policy retuning", () => {
    const epochDrift = completeManifest();
    (
      epochDrift.replayEpochPolicyBinding as unknown as { sha256: string }
    ).sha256 = hash("other-epoch");
    resealManifest(epochDrift);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(epochDrift),
    ).toContain("replay_epoch_policy_binding_invalid");

    const arithmeticDrift = completeManifest();
    (
      arithmeticDrift.constraintArithmeticPolicyBinding as unknown as {
        sha256: string;
      }
    ).sha256 = hash("other-arithmetic-policy");
    resealManifest(arithmeticDrift);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(arithmeticDrift),
    ).toContain("constraint_arithmetic_policy_binding_invalid");

    const retune =
      completeManifest() as Nhm2SemiclassicalV3ConstraintOperandManifestV1 & {
        toleranceOverride?: number;
      };
    retune.toleranceOverride = 1;
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(retune),
    ).toContain("manifest_shape_invalid");
  });

  it("rejects v1/v2 identities and legacy central or regulator aliases", () => {
    for (const oldIdentity of [
      "nhm2.semiclassical_v1_constraint_operand_manifest",
      "nhm2_semiclassical_v2_constraint_operand_replay/v2",
      "nhm2.server_owned.semiclassical_v2.constraint_operand_replay/v2",
    ]) {
      const manifest = completeManifest();
      manifest.implementation.implementationId = oldIdentity;
      resealManifest(manifest);
      expect(
        nhm2SemiclassicalV3ConstraintOperandManifestViolations(manifest),
      ).toContain("legacy_v1_v2_identity_rejected");
    }

    const central =
      completeManifest() as Nhm2SemiclassicalV3ConstraintOperandManifestV1 & {
        central?: unknown;
      };
    central.central = {};
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(central),
    ).toContain("legacy_central_or_regulator_alias_rejected");

    const regulator = completeManifest();
    regulator.levels[0].levelId = "regulator_0" as never;
    resealManifest(regulator);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(regulator),
    ).toContain("legacy_central_or_regulator_alias_rejected");
  });

  it("enforces preseal, execution, observation, and generation chronology", () => {
    const presealAfterStart = completeManifest();
    presealAfterStart.candidateBinding.scientificPresealBinding.sealedAt =
      STARTED_AT;
    resealManifest(presealAfterStart);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(presealAfterStart),
    ).toContain("execution_binding_or_chronology_invalid");

    const scientificInputAfterPreseal = completeManifest();
    scientificInputAfterPreseal.scientificInputClosure.inputs[0].observedAt =
      STARTED_AT;
    resealScientificInputAndPreseal(scientificInputAfterPreseal);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(
        scientificInputAfterPreseal,
      ),
    ).toContain(
      "scientific_input_descriptor_invalid:/scientificInputClosure/inputs/0",
    );

    const implementationAtStart = completeManifest();
    const implementationIndex =
      NHM2_SEMICLASSICAL_V3_SCIENTIFIC_INPUT_IDS.length;
    expect(
      Date.parse(
        implementationAtStart.completeInputClosure.inputs[implementationIndex]
          .observedAt,
      ),
    ).toBeGreaterThan(Date.parse(SEALED_AT));
    implementationAtStart.completeInputClosure.inputs[
      implementationIndex
    ].observedAt = STARTED_AT;
    resealCompleteInputClosure(implementationAtStart);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(
        implementationAtStart,
      ),
    ).toContain(
      `complete_input_descriptor_invalid:/completeInputClosure/inputs/${implementationIndex}`,
    );

    const closureFrozenAtStart = completeManifest();
    closureFrozenAtStart.completeInputClosure.frozenAt = STARTED_AT;
    resealCompleteInputClosure(closureFrozenAtStart);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(
        closureFrozenAtStart,
      ),
    ).toContain("complete_input_closure_chronology_invalid");

    const outputBeforeCompletion = completeManifest();
    outputBeforeCompletion.levels[0].families[0].operands[0].observedAt =
      STARTED_AT;
    resealManifest(outputBeforeCompletion);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(
        outputBeforeCompletion,
      ),
    ).toContain("operand_descriptor_invalid:/levels/0/families/0/operands/0");

    const badDuration = completeManifest();
    badDuration.execution.durationMs = 1;
    resealManifest(badDuration);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(badDuration),
    ).toContain("execution_binding_or_chronology_invalid");

    const sha256Commit = completeManifest();
    sha256Commit.execution.commitSha = hash("sha256-commit");
    resealManifest(sha256Commit);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(sha256Commit),
    ).toEqual([]);
  });

  it("requires the exact exhaustive epoch claim-lock surface and no authority", () => {
    const manifest = completeManifest();
    expect(Object.keys(manifest.claimLocks)).toEqual([
      ...NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCK_KEYS,
    ]);
    expect(
      Object.values(manifest.claimLocks).every((value) => value === false),
    ).toBe(true);
    expect(
      Object.entries(manifest.schemaBoundary).filter(
        ([key]) => key !== "schemaImplemented",
      ),
    ).toSatisfy((entries: Array<[string, boolean]>) =>
      entries.every(([, value]) => value === false),
    );

    const opened = completeManifest();
    (
      opened.claimLocks as unknown as Record<string, boolean>
    ).physicalViability = true;
    resealManifest(opened);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(opened),
    ).toContain("epoch_claim_locks_invalid");

    const omitted = completeManifest();
    delete (omitted.claimLocks as unknown as Record<string, boolean>)
      .runReplayAuthority;
    resealManifest(omitted);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(omitted),
    ).toContain("epoch_claim_locks_invalid");
  });

  it("binds generatedAt and every manifest field into the inventory closure", () => {
    const manifest = completeManifest();
    const original = manifest.operandInventorySha256;
    manifest.generatedAt = "2026-08-11T12:00:05.000Z";
    expect(
      computeNhm2SemiclassicalV3ConstraintOperandInventorySha256(manifest),
    ).not.toBe(original);
    expect(
      nhm2SemiclassicalV3ConstraintOperandManifestViolations(manifest),
    ).toContain("operand_inventory_sha256_mismatch");
  });

  it("snapshots the caller once and fails closed on getters, symbols, prototypes, cycles, and proxies", () => {
    const getter = cloneManifest();
    let getterCalls = 0;
    Object.defineProperty(getter, "generatedAt", {
      enumerable: true,
      configurable: true,
      get: () => {
        getterCalls += 1;
        return GENERATED_AT;
      },
    });
    expect(
      validateNhm2SemiclassicalV3ConstraintOperandManifest(getter).violations,
    ).toContain("manifest_plain_data_snapshot_invalid");
    expect(getterCalls).toBe(0);

    const symbol =
      cloneManifest() as Nhm2SemiclassicalV3ConstraintOperandManifestV1 &
        Record<symbol, unknown>;
    symbol[Symbol("hostile")] = true;
    expect(
      validateNhm2SemiclassicalV3ConstraintOperandManifest(symbol).violations,
    ).toContain("manifest_plain_data_snapshot_invalid");

    const exotic = cloneManifest();
    Object.setPrototypeOf(exotic, { hostile: true });
    expect(
      validateNhm2SemiclassicalV3ConstraintOperandManifest(exotic).violations,
    ).toContain("manifest_plain_data_snapshot_invalid");

    const cycle =
      cloneManifest() as Nhm2SemiclassicalV3ConstraintOperandManifestV1 & {
        self?: unknown;
      };
    cycle.self = cycle;
    expect(
      validateNhm2SemiclassicalV3ConstraintOperandManifest(cycle).violations,
    ).toContain("manifest_plain_data_snapshot_invalid");

    const proxy = new Proxy(cloneManifest(), {});
    expect(() =>
      validateNhm2SemiclassicalV3ConstraintOperandManifest(proxy),
    ).not.toThrow();
    expect(
      validateNhm2SemiclassicalV3ConstraintOperandManifest(proxy).violations,
    ).toContain("manifest_plain_data_snapshot_invalid");

    const once = cloneManifest();
    const originalStructuredClone = globalThis.structuredClone;
    let observations = 0;
    const spy = vi.spyOn(globalThis, "structuredClone").mockImplementation(((
      value: unknown,
    ) => {
      if (value === once) {
        observations += 1;
        if (observations > 1) return {};
      }
      return originalStructuredClone(value);
    }) as typeof structuredClone);
    try {
      expect(
        validateNhm2SemiclassicalV3ConstraintOperandManifest(once).ok,
      ).toBe(true);
      expect(observations).toBe(1);
    } finally {
      spy.mockRestore();
    }
  });
});
