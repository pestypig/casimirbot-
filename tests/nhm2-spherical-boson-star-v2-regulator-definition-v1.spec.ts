import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAYS_PER_LEVEL,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_COUNT,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_CHANNEL_ORDER,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_FAMILY_ORDER,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_LEVELS,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_CANONICAL_JSON,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_SHA256_DOMAIN,
  NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ROLE_ORDER,
} from "../shared/contracts/nhm2-semiclassical-v2-constraint-operand-replay.v1";
import { NHM2_SEMICLASSICAL_TENSOR_COMPONENTS } from "../shared/contracts/nhm2-semiclassical-state-realizability.v1";
import { NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER } from "../shared/contracts/nhm2-semiclassical-state-realizability.v2";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CENTRAL_LOGICAL_ALIAS_COUNT,
  NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_OPERAND_ARRAY_COUNT,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXACT_TOTAL_OUTPUT_ARRAY_COUNT,
  NHM2_SPHERICAL_BOSON_STAR_V2_NONCONSTRAINT_ARRAY_COUNT,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING_PINS,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_FAMILY_ORDER,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_LEVEL_ORDER,
  NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_OPERAND_ROLE_ORDER,
  cloneNhm2SphericalBosonStarV2RegulatorDefinition,
  isNhm2SphericalBosonStarV2RegulatorDefinitionV1,
  nhm2SphericalBosonStarV2RegulatorDefinitionViolations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-regulator-definition.v1";

const sha256 = (bytes: string | Buffer): string =>
  createHash("sha256").update(bytes).digest("hex");

const independentCanonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(independentCanonicalize);
  if (value != null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, entry]) => [key, independentCanonicalize(entry)]),
    );
  }
  return value;
};

describe("spherical NHM2 semiclassical v2 regulator definition v1", () => {
  it("independently binds the frozen candidate and operand policy raw/canonical identities", () => {
    const pins = NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING_PINS;
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256).toBe(
      pins.candidateFreezeSha256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES,
    ).toBe(pins.candidateFreezeCanonicalSizeBytes);

    const sourceBytes = readFileSync(pins.constraintOperandReplaySourcePath);
    expect(sha256(sourceBytes)).toBe(
      pins.constraintOperandReplaySourceRawSha256,
    );
    expect(sourceBytes.byteLength).toBe(
      pins.constraintOperandReplaySourceRawSizeBytes,
    );

    const independentlyCanonical = JSON.stringify(
      independentCanonicalize(
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY,
      ),
    );
    expect(independentlyCanonical).toBe(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_CANONICAL_JSON,
    );
    expect(sha256(independentlyCanonical)).toBe(
      pins.constraintOperandReplayPolicyCanonicalJsonRawSha256,
    );
    expect(Buffer.byteLength(independentlyCanonical, "utf8")).toBe(
      pins.constraintOperandReplayPolicyCanonicalSizeBytes,
    );
    expect(
      sha256(
        NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY_SHA256_DOMAIN +
          independentlyCanonical,
      ),
    ).toBe(pins.constraintOperandReplayPolicyDomainSealedSha256);
  });

  it("has a literal, independently recomputable canonical self-seal", () => {
    const independentlyCanonical = JSON.stringify(
      independentCanonicalize(
        NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION,
      ),
    );
    expect(independentlyCanonical).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_CANONICAL_JSON,
    );
    expect(
      sha256(
        NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_SHA256_DOMAIN +
          independentlyCanonical,
      ),
    ).toBe(NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_SHA256);
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_SHA256).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_EXPECTED_SHA256,
    );
    expect(
      Buffer.byteLength(
        NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_CANONICAL_JSON,
        "utf8",
      ),
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_BINDING,
    ).toMatchObject({
      sha256: NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_EXPECTED_SHA256,
      canonicalSizeBytes:
        NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_EXPECTED_CANONICAL_SIZE_BYTES,
    });
  });

  it("freezes the complete 63-file primitive operand inventory in exact level-family-role order", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION;
    const arrays =
      contract.successorOutputInventory.constraintOperandFiles.arrays;
    const expected = NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_LEVEL_ORDER.flatMap(
      (level) =>
        NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_FAMILY_ORDER.flatMap(
          (familyId) =>
            NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ROLE_ORDER[familyId].map(
              (operandRole) => ({
                levelOrdinal: level.ordinal,
                levelId: level.levelId,
                hExact: level.hExact,
                familyId,
                operandRole,
                role: `constraint_operand.${level.levelId}.${familyId}.${operandRole}`,
                path: `{outputDirectory}/${level.levelId}/${familyId}/${operandRole}.f64le`,
              }),
            ),
        ),
    );

    expect(contract.levels).toEqual(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_LEVELS,
    );
    expect(contract.familyOrder).toEqual(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_FAMILY_ORDER,
    );
    expect(contract.operandRoleOrder).toEqual(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ROLE_ORDER,
    );
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_OPERAND_ROLE_ORDER).toEqual(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ROLE_ORDER,
    );
    expect(contract.familyAggregation).toBe("none");
    expect(arrays).toHaveLength(
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_OPERAND_ARRAY_COUNT,
    );
    expect(
      arrays.map(
        ({
          levelOrdinal,
          levelId,
          hExact,
          familyId,
          operandRole,
          role,
          path,
        }) => ({
          levelOrdinal,
          levelId,
          hExact,
          familyId,
          operandRole,
          role,
          path,
        }),
      ),
    ).toEqual(expected);
    expect(new Set(arrays.map((entry) => entry.role)).size).toBe(63);
    expect(new Set(arrays.map((entry) => entry.path.toLowerCase())).size).toBe(
      63,
    );
    for (const [constraintOrdinal, entry] of arrays.entries()) {
      expect(entry.constraintOrdinal).toBe(constraintOrdinal);
      expect(entry.fileOrdinal).toBe(
        NHM2_SPHERICAL_BOSON_STAR_V2_NONCONSTRAINT_ARRAY_COUNT +
          constraintOrdinal,
      );
      expect(entry).toMatchObject({
        dtype: "float64",
        binaryEncoding: "raw_ieee754",
        endianness: "little",
        shape: [64, 4],
        storageOrder: "row-major",
        componentOrder: NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_CHANNEL_ORDER,
        sampleOrder: "candidate_sampling_ordinal_0_to_63",
        unit: "dimensionless_barred_constraint_generator",
        sizeBytes: 2048,
        finiteValuesRequired: true,
        negativeZeroAllowed: false,
      });
    }
    expect(
      contract.successorOutputInventory.constraintOperandFiles
        .exactArraysPerLevel,
    ).toBe(NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAYS_PER_LEVEL);
    expect(
      contract.successorOutputInventory.constraintOperandFiles.exactArrayCount,
    ).toBe(NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_COUNT);
    expect(NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_ARRAY_COUNT).toBe(63);
  });

  it("freezes five nonconstraint files plus 63 operands as exactly 68 unique physical files", () => {
    const inventory =
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION.successorOutputInventory;
    const fixed = inventory.nonconstraintFiles.files;
    const operands = inventory.constraintOperandFiles.arrays;
    expect(fixed.map((entry) => entry.role)).toEqual([
      "noise_kernel",
      "noise_kernel_absolute_uncertainty95",
      "mean_rset",
      "mean_rset_absolute_uncertainty95",
      "smearing_weights",
    ]);
    expect(fixed.map((entry) => entry.fileOrdinal)).toEqual([0, 1, 2, 3, 4]);
    expect(fixed.map((entry) => entry.shape)).toEqual([
      [64, 64, 100],
      [64, 64, 100],
      [64, 10],
      [64, 10],
      [64],
    ]);
    expect(fixed[0].componentOrder).toEqual(
      NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER,
    );
    expect(fixed[1].componentOrder).toEqual(
      NHM2_SEMICLASSICAL_NOISE_KERNEL_COMPONENT_PAIR_ORDER,
    );
    expect(fixed[2].componentOrder).toEqual(
      NHM2_SEMICLASSICAL_TENSOR_COMPONENTS,
    );
    expect(fixed[3].componentOrder).toEqual(
      NHM2_SEMICLASSICAL_TENSOR_COMPONENTS,
    );
    expect(fixed[4].componentOrder).toEqual(["weight"]);
    for (const entry of fixed) {
      expect(entry.sizeBytes).toBe(
        entry.shape.reduce((product, axis) => product * axis, 1) * 8,
      );
      expect(entry).toMatchObject({
        dtype: "float64",
        binaryEncoding: "raw_ieee754",
        endianness: "little",
        storageOrder: "row-major",
        mediaType: "application/octet-stream",
        finiteValuesRequired: true,
        negativeZeroAllowed: false,
      });
    }
    expect(fixed).toHaveLength(
      NHM2_SPHERICAL_BOSON_STAR_V2_NONCONSTRAINT_ARRAY_COUNT,
    );
    expect(operands).toHaveLength(
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_OPERAND_ARRAY_COUNT,
    );
    const physicalPaths = [...fixed, ...operands].map((entry) =>
      entry.path.toLowerCase(),
    );
    expect(new Set(physicalPaths).size).toBe(physicalPaths.length);
    expect(inventory.exactUniquePhysicalFileCount).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_EXACT_TOTAL_OUTPUT_ARRAY_COUNT,
    );
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_EXACT_TOTAL_OUTPUT_ARRAY_COUNT).toBe(
      5 + 63,
    );
  });

  it("projects the 21 historical central roles onto level_2 files by path and hash, never duplicates", () => {
    const inventory =
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION.successorOutputInventory;
    const central = inventory.constraintOperandFiles.arrays.filter(
      (entry) => entry.levelId === "level_2",
    );
    const aliases = inventory.centralLevel2LogicalAliases.aliases;
    expect(central).toHaveLength(
      NHM2_SPHERICAL_BOSON_STAR_V2_CENTRAL_LOGICAL_ALIAS_COUNT,
    );
    expect(aliases).toHaveLength(
      NHM2_SPHERICAL_BOSON_STAR_V2_CENTRAL_LOGICAL_ALIAS_COUNT,
    );
    for (const [index, alias] of aliases.entries()) {
      const canonical = central[index];
      const expectedLegacyRole = ["H_H", "H_Hi", "Hi_Hj"].includes(
        canonical.familyId,
      )
        ? `constraint_bracket.${canonical.familyId}.${canonical.operandRole}`
        : `${canonical.familyId}.${canonical.operandRole}`;
      expect(alias).toEqual({
        aliasOrdinal: index,
        legacyLogicalRole: expectedLegacyRole,
        canonicalConstraintOrdinal: canonical.constraintOrdinal,
        canonicalFileOrdinal: canonical.fileOrdinal,
        canonicalRole: canonical.role,
        canonicalPath: canonical.path,
        pathEqualityRequired: true,
        sha256EqualityRequired: true,
        relation: "same_canonical_level_2_file_and_sha256_no_duplicate",
        additionalPhysicalFile: false,
      });
    }
    expect(inventory.centralLevel2LogicalAliases).toMatchObject({
      centralLevelOrdinal: 2,
      centralLevelId: "level_2",
      aliasesAreManifestProjectionsNotAdditionalFiles: true,
      exactAliasCount: 21,
    });
    expect(
      inventory.exactUniquePhysicalFileCount +
        aliases.filter((entry) => entry.additionalPhysicalFile).length,
    ).toBe(68);
  });

  it("inherits the frozen no-aggregation convergence formulas and thresholds exactly", () => {
    const convergence =
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION.convergence;
    expect(convergence).toEqual(
      NHM2_SEMICLASSICAL_V2_CONSTRAINT_OPERAND_REPLAY_POLICY.convergence,
    );
    expect(convergence).toMatchObject({
      familyAggregation: "none",
      pMinimum: 1,
      conservativeOrderLowerDefinition: "pLower=log(D01Lower/D12Upper)/log(2)",
      exactZeroDisposition:
        "D01Lower_less_than_or_equal_to_zero_or_D12Upper_less_than_or_equal_to_zero_is_blocked_without_synthetic_floor",
      monotonicityDefinition:
        "D12Upper<=D01Lower+monotonicity_absolute_tolerance",
      monotonicityAbsoluteTolerance: 1e-12,
      minimumObservedOrder: 1,
      finalResidualUpper95Tolerance: 0.1,
      finalRegulatorErrorUpper95Tolerance: 0.1,
      everyFamilyMustPassSeparately: true,
      producerReportedOrderAuthoritative: false,
      everyDerivedRoleMustBeFiniteBeforeComparison: true,
      nonfiniteOrOverflowDisposition:
        "blocked_before_any_family_or_global_pass",
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION.operandReplayEnforcement,
    ).toEqual({
      derivedOnlySubmissionAllowed: false,
      decodeEveryRawOperand: true,
      recomputeEveryFamilyResidualAtEveryLevel: true,
      submittedResidualUse: "consistency_check_only_never_residual_authority",
      rejectSubmittedResidualMismatch: true,
      targetMustBeRecomputedFromFrozenDiracStructureFunctions: true,
      suppliedTargetBytesAloneEstablishDerivation: false,
      centralLevelAliasesMustResolveBeforeDecode: true,
      decodeUniqueCanonicalFilesExactlyOnce: true,
      recomputeAllFiveFamiliesAtAllThreeLevelsFromPrimitiveOperands: true,
    });
  });

  it("is an additive placeholder completion without execution or claim authority", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION;
    expect(contract.additiveCompletion).toMatchObject({
      scientificInputId: "regulator_definition",
      relation: "additive_successor_completion_without_source_mutation",
      regulatorDefinitionComplete: true,
      successorOutputInventoryComplete: true,
      sourceCandidateFreezeMutated: false,
      supersedesForThisCandidate:
        "ambiguous_aggregate_only_regulator_output_duty_placeholder",
      sourceFreezeMissingInputListRemainsHistoricalEvidence: true,
    });
    expect(contract.integrationBoundary).toEqual({
      currentAggregateOnlyRawReplayProjectionCompatible: false,
      successorRawReplayManifestSchemaRequired: true,
      allConstraintOperandFilesUniqueAcrossLevelFamilyRole: true,
      centralHistoricalLogicalRolesAliasCanonicalLevel2Files: true,
      centralAliasesAddNoPhysicalFiles: true,
      constraintOperandReplayPathLayoutIsTheFrozenArrayLayout: true,
      schemaIntegrationComplete: false,
      executionRemainsBlockedUntilSchemaIntegrationAndPreseal: true,
    });
    expect(contract.declaredLeverExclusion).toEqual({
      declaredLeverTensorUsed: false,
      declaredTileEffectiveTensorLeverModelUsed: false,
      forbiddenInputIds: [
        "declared_lever_tensor",
        "candidate_declared_tile_effective_tensor_lever_model",
      ],
    });
    expect(contract.executionDisposition).toMatchObject({
      definitionFrozenBeforeExecution: true,
      rolesShapesEncodingAndPathOrderMayChangeAfterExecution: false,
      producerSummariesAuthoritative: false,
      recomputeEveryFamilyFromRawBytes: true,
      candidateFailureOnAnyFrozenGateExceedance:
        "fail_this_v2_candidate_without_retuning",
      postObservationToleranceGridFamilyOrFormulaRetuningAllowed: false,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION_AUTHORITY_LOCKS,
    ).toEqual({
      implementationComplete: false,
      implementationArtifact: null,
      runtimeBound: false,
      runtimeManifest: null,
      scientificPresealMaterialized: false,
      scientificPresealReceipt: null,
      executionAuthorized: false,
      executionObserved: false,
      resultsPresent: false,
      resultReceipt: null,
      replayAuthority: false,
      replayReceipt: null,
      independentAgreement: false,
      pairAgreementReceipt: null,
      semiclassicalStressNoiseLamp: false,
      semiclassicalConstraintAlgebraLamp: false,
      diagnosticPass: false,
      theoryGraphPromotion: false,
      physicalViability: false,
      propulsion: false,
      transport: false,
    });
  });

  it("accepts only the exact frozen semantic value", () => {
    const clone = cloneNhm2SphericalBosonStarV2RegulatorDefinition();
    expect(
      nhm2SphericalBosonStarV2RegulatorDefinitionViolations(clone),
    ).toEqual([]);
    expect(isNhm2SphericalBosonStarV2RegulatorDefinitionV1(clone)).toBe(true);

    const changedLevel =
      cloneNhm2SphericalBosonStarV2RegulatorDefinition() as any;
    changedLevel.levels[2].hExact = "1/128";
    expect(
      nhm2SphericalBosonStarV2RegulatorDefinitionViolations(changedLevel),
    ).toEqual(["spherical_v2_regulator_definition_semantic_drift"]);

    const unlocked = cloneNhm2SphericalBosonStarV2RegulatorDefinition() as any;
    unlocked.authorityLocks.diagnosticPass = true;
    expect(isNhm2SphericalBosonStarV2RegulatorDefinitionV1(unlocked)).toBe(
      false,
    );

    const extra = cloneNhm2SphericalBosonStarV2RegulatorDefinition() as any;
    extra.unregistered = false;
    expect(isNhm2SphericalBosonStarV2RegulatorDefinitionV1(extra)).toBe(false);
  });

  it("fails closed and bounded on hostile object graphs without invoking accessors", () => {
    let getterCalls = 0;
    const accessor = cloneNhm2SphericalBosonStarV2RegulatorDefinition() as any;
    Object.defineProperty(accessor, "artifactId", {
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return "hostile";
      },
    });
    expect(
      nhm2SphericalBosonStarV2RegulatorDefinitionViolations(accessor),
    ).toEqual(["object_entry_surface:/artifactId"]);
    expect(getterCalls).toBe(0);

    const proxy = new Proxy(
      {},
      {
        ownKeys: () => {
          throw new Error("trap");
        },
      },
    );
    expect(
      nhm2SphericalBosonStarV2RegulatorDefinitionViolations(proxy),
    ).toEqual(["proxy_forbidden:/"]);

    const cyclic: Record<string, unknown> = {};
    cyclic.loop = cyclic;
    expect(
      nhm2SphericalBosonStarV2RegulatorDefinitionViolations(cyclic),
    ).toEqual(["cycle_forbidden:/loop"]);

    const deep: Record<string, unknown> = {};
    let cursor = deep;
    for (let index = 0; index < 34; index += 1) {
      const next: Record<string, unknown> = {};
      cursor.next = next;
      cursor = next;
    }
    expect(
      nhm2SphericalBosonStarV2RegulatorDefinitionViolations(deep)[0],
    ).toMatch(/^snapshot_depth_limit:/);

    expect(
      nhm2SphericalBosonStarV2RegulatorDefinitionViolations(
        Array.from({ length: 1025 }, () => null),
      ),
    ).toEqual(["array_length_limit:/"]);
    expect(
      nhm2SphericalBosonStarV2RegulatorDefinitionViolations({
        value: "x".repeat(32769),
      }),
    ).toEqual(["string_byte_limit:/value"]);
    expect(
      nhm2SphericalBosonStarV2RegulatorDefinitionViolations(
        Array.from({ length: 33 }, () => "x".repeat(32768)),
      )[0],
    ).toMatch(/^aggregate_utf8_byte_limit:/);
    expect(
      nhm2SphericalBosonStarV2RegulatorDefinitionViolations({
        ["x".repeat(4097)]: null,
      }),
    ).toEqual(["property_key_byte_limit:/"]);
    expect(
      nhm2SphericalBosonStarV2RegulatorDefinitionViolations(
        Object.fromEntries(
          Array.from({ length: 257 }, (_, index) => [`k${index}`, null]),
        ),
      ),
    ).toEqual(["object_surface:/"]);
    expect(
      nhm2SphericalBosonStarV2RegulatorDefinitionViolations(
        JSON.parse('{"__proto__":null}'),
      ),
    ).toEqual(["forbidden_key:/__proto__"]);

    const nodeFlood = Array.from({ length: 1024 }, () =>
      Array.from({ length: 16 }, () => null),
    );
    expect(
      nhm2SphericalBosonStarV2RegulatorDefinitionViolations(nodeFlood)[0],
    ).toMatch(/^snapshot_node_limit:/);

    const symbolSurface = { value: null } as Record<PropertyKey, unknown>;
    symbolSurface[Symbol("hostile")] = null;
    expect(
      nhm2SphericalBosonStarV2RegulatorDefinitionViolations(symbolSurface),
    ).toEqual(["object_surface:/"]);
    for (const value of [NaN, Infinity, -Infinity, -0]) {
      expect(
        nhm2SphericalBosonStarV2RegulatorDefinitionViolations(value),
      ).toEqual(["invalid_number:/"]);
    }
    for (const value of [undefined, 1n, () => undefined, Symbol("x")]) {
      expect(
        nhm2SphericalBosonStarV2RegulatorDefinitionViolations(value),
      ).toEqual(["non_json_value:/"]);
    }
    expect(
      nhm2SphericalBosonStarV2RegulatorDefinitionViolations(
        Object.create(null),
      ),
    ).toEqual(["non_plain_object:/"]);
  });

  it("exports a deeply immutable authority artifact and detached clones", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_REGULATOR_DEFINITION;
    expect(Object.isFrozen(contract)).toBe(true);
    expect(
      Object.isFrozen(
        contract.successorOutputInventory.constraintOperandFiles.arrays,
      ),
    ).toBe(true);
    expect(
      Object.isFrozen(
        contract.successorOutputInventory.constraintOperandFiles.arrays[0],
      ),
    ).toBe(true);
    expect(
      Object.isFrozen(
        contract.successorOutputInventory.nonconstraintFiles.files[0],
      ),
    ).toBe(true);
    expect(
      Object.isFrozen(
        contract.successorOutputInventory.centralLevel2LogicalAliases
          .aliases[0],
      ),
    ).toBe(true);
    expect(Object.isFrozen(contract.convergence)).toBe(true);
    expect(Object.isFrozen(contract.authorityLocks)).toBe(true);

    const left = cloneNhm2SphericalBosonStarV2RegulatorDefinition() as any;
    const right = cloneNhm2SphericalBosonStarV2RegulatorDefinition() as any;
    left.successorOutputInventory.constraintOperandFiles.arrays[0].role =
      "mutated";
    expect(
      right.successorOutputInventory.constraintOperandFiles.arrays[0].role,
    ).not.toBe("mutated");
    expect(
      contract.successorOutputInventory.constraintOperandFiles.arrays[0].role,
    ).not.toBe("mutated");
  });
});
