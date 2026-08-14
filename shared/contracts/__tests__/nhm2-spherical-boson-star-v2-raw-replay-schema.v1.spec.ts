import { describe, expect, it } from "vitest";

import {
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_VALIDATOR_LIMITS,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_CENTRAL_LEVEL2_LOGICAL_ALIASES,
  NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS,
  cloneNhm2SphericalBosonStarV2RawReplaySchema,
  isNhm2SphericalBosonStarV2RawReplaySchemaV1,
  nhm2SphericalBosonStarV2RawReplaySchemaViolations,
} from "../nhm2-spherical-boson-star-v2-raw-replay-schema.v1";

type MutableRecord = Record<string, unknown>;

const mutableClone = (): MutableRecord =>
  JSON.parse(
    NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_CANONICAL_JSON,
  ) as MutableRecord;

const at = (value: unknown, ...keys: string[]): MutableRecord => {
  let cursor = value as MutableRecord;
  for (const key of keys) cursor = cursor[key] as MutableRecord;
  return cursor;
};

describe("NHM2 spherical boson-star v2 raw replay successor schema", () => {
  it("has a stable literal canonical seal", () => {
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_SHA256).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_EXPECTED_SHA256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING.sha256).toBe(
      "96f5816f9d04b9d3b14a228ab821c3224974f47839ace6d7c7819f77c6a223ff",
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING.canonicalSizeBytes,
    ).toBe(163_818);
  });

  it("accepts only the exact plain canonical value", () => {
    const clone = cloneNhm2SphericalBosonStarV2RawReplaySchema();
    expect(isNhm2SphericalBosonStarV2RawReplaySchemaV1(clone)).toBe(true);
    expect(nhm2SphericalBosonStarV2RawReplaySchemaViolations(clone)).toEqual(
      [],
    );
    expect(
      isNhm2SphericalBosonStarV2RawReplaySchemaV1(
        NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA,
      ),
    ).toBe(true);
    expect(
      Object.isFrozen(NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA),
    ).toBe(true);
    expect(
      Object.isFrozen(
        NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.exactRawOutputInventory
          .descriptors,
      ),
    ).toBe(true);
  });

  it("exact-binds every available candidate-specific science dependency", () => {
    const bindings =
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.exactBindings;
    expect(bindings.candidateFreeze.sha256).toBe(
      "628092507b7dc1be76722f06a7b591efc59d1799bed0d4b7d1999d852d92f28f",
    );
    expect(bindings.regulatorDefinition.sha256).toBe(
      "d3b42d5483abde3db51b2755bbf58e0b35f78abd4980da56a750963362d46ade",
    );
    expect(bindings.constraintFormulation.sha256).toBe(
      "736ce86009ef09e4e7222bebc12638b8889f7129db6443160b1856585aae45ff",
    );
    expect(bindings.classicalStructureFunctions.sha256).toBe(
      "d6f12f0703f5b756c8c08c424f3af8c06990b59005f404691b5b20f6e71ce700",
    );
    expect(bindings.renormalizationPrescription.sha256).toBe(
      "0c9e38c5dec82db015ccb8eeac23c55257b3fd667c774a34f68cf5ee0fc8ae89",
    );
    expect(bindings.renormalizationCounterterms.sha256).toBe(
      "ce189a901d951d839cba823e32b8b5e56b532bc7cad5b5ae5b1ad372d76afcfa",
    );
    expect(bindings.operatorOrdering.sha256).toBe(
      "ea9600151d59c6692190673658bed861904b4261de9dcda92a52bf093aa2dd0e",
    );
    expect(bindings.approvedV2ReplayPolicy.sha256).toBe(
      "ada5f8a24aba724ec36528d9bddfe267b794b93cd3bceef9a7774c1e78ad5b00",
    );
  });

  it("propagates incomplete operator-ordering status instead of treating its hash as science closure", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA;
    expect(contract.exactBindings.operatorOrdering.sha256).toBe(
      "ea9600151d59c6692190673658bed861904b4261de9dcda92a52bf093aa2dd0e",
    );
    const status =
      contract.scienceInputCompleteness.operatorOrderingArtifactStatus;
    expect(
      contract.scienceInputCompleteness.operatorOrderingRequiredInputId,
    ).toBe("operator_ordering");
    expect(status.canonicalArtifactPresent).toBe(true);
    expect(status.deterministicSymbolicCallOrderFrozen).toBe(true);
    expect(status.sourceAndDerivationClosureComplete).toBe(false);
    expect(status.executableNumericalOrderingComplete).toBe(false);
    expect(status.anomalyAnalysisComplete).toBe(false);
    expect(status.scientificInputComplete).toBe(false);
    expect(status.candidateExecutionMayStart).toBe(false);
    expect(status.exactBindingHashPresenceSatisfiesScientificCompleteness).toBe(
      false,
    );
    expect(status.exactBindingHashPresenceSatisfiesExecutionAdmission).toBe(
      false,
    );
    expect(status.propagatedBlockers).toContain(
      "state_inverse_symplectic_coordinate_chart_and_discretization_derivation_not_bound",
    );
    expect(contract.scienceInputCompleteness.blockers).toContain(
      "operator_ordering:state_inverse_symplectic_coordinate_chart_and_discretization_derivation_not_bound",
    );
    expect(
      contract.scienceInputCompleteness.staticScientificInputClosureComplete,
    ).toBe(false);
    expect(contract.staticInputClosureSchema.closureComplete).toBe(false);
    expect(
      contract.staticInputClosureSchema.exactCandidateSpecificPins
        .candidateManifestSha256,
    ).toBeNull();
    expect(
      contract.staticInputClosureSchema.exactCandidateSpecificPins
        .operatorOrderingSha256,
    ).toBe("ea9600151d59c6692190673658bed861904b4261de9dcda92a52bf093aa2dd0e");
    expect(
      contract.staticInputClosureSchema.operatorOrderingInputRequirements
        .bindingHashPresenceSatisfiesClosure,
    ).toBe(false);
    expect(
      contract.staticInputClosureSchema.operatorOrderingInputRequirements
        .complete,
    ).toBe(false);
    expect(contract.scienceInputCompleteness.executionMayBeAdmitted).toBe(
      false,
    );
  });

  it("blocks ID-only normalization until the exact SI conversion graph is bound", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA;
    const dependency =
      contract.scienceInputCompleteness.normalizationConversionDependency;
    expect(dependency.parentScientificInputId).toBe("normalization");
    expect(dependency.exactCanonicalBinding).toBeNull();
    expect(dependency.constantsEdition).toBeNull();
    expect(dependency.naturalUnitsToJPerM3FormulaGraph).toBeNull();
    expect(dependency.uncertaintyPropagationGraph).toBeNull();
    expect(dependency.normalizationIdAloneSatisfiesRequirement).toBe(false);
    expect(dependency.requiredBeforeScientificPreseal).toBe(true);
    expect(dependency.requiredBeforeExecutionAdmission).toBe(true);
    expect(contract.scienceInputCompleteness.blockers).toContain(
      "natural_units_to_si_j_per_m3_conversion_constants_and_uncertainty_graph_absent",
    );
    const closure =
      contract.staticInputClosureSchema.normalizationInputContentRequirements;
    expect(closure.normalizationIdAcceptedWithoutCanonicalContentGraph).toBe(
      false,
    );
    expect(closure.exactBinding).toBeNull();
    expect(closure.requiredOutputUnitsInOrder).toEqual(["J/m^3", "(J/m^3)^2"]);
    expect(closure.complete).toBe(false);
  });

  it("declares the legacy aggregate manifest incompatible without mutating it", () => {
    const successor =
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.additiveSuccessor;
    expect(successor.legacyAggregateManifest.contractVersion).toBe(
      "nhm2_semiclassical_v2_raw_replay_manifest/v2",
    );
    expect(successor.legacyAggregateManifest.sourceMutated).toBe(false);
    expect(successor.legacyAggregateManifest.structurallyCompatible).toBe(
      false,
    );
    expect(successor.legacyAggregateManifest.acceptedAsSuccessorManifest).toBe(
      false,
    );
    expect(successor.successorManifest.contractVersion).toBe(
      "nhm2_spherical_boson_star_v2_raw_replay_manifest/v1",
    );
  });

  it("separates the preexecution hashless skeleton from the postrun hash manifest", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA;
    const successor = contract.additiveSuccessor;
    const lifecycle = contract.successorArtifactLifecycle;
    expect(successor.preexecutionOutputSkeleton.artifactId).not.toBe(
      successor.successorManifest.artifactId,
    );
    expect(successor.preexecutionOutputSkeleton.contractVersion).not.toBe(
      successor.successorManifest.contractVersion,
    );
    expect(
      lifecycle.preexecutionOutputSkeletonShape.exactRootFieldOrder,
    ).toContain("plannedPhysicalFiles");
    expect(
      lifecycle.preexecutionOutputSkeletonShape.exactRootFieldOrder,
    ).not.toContain("execution");
    expect(
      lifecycle.preexecutionOutputSkeletonShape
        .expectedSizeBytesFromFrozenDescriptorRequired,
    ).toBe(true);
    expect(
      lifecycle.preexecutionOutputSkeletonShape
        .outputSha256FreshnessObservedAtOrExecutionReceiptFieldsAllowed,
    ).toBe(false);
    expect(
      lifecycle.preexecutionOutputSkeletonShape
        .frozenAndServerPersistedBeforeScientificPreseal,
    ).toBe(true);
    expect(lifecycle.postrunHashManifestShape.exactRootFieldOrder).toContain(
      "preexecutionSkeletonBinding",
    );
    expect(lifecycle.postrunHashManifestShape.exactRootFieldOrder).toContain(
      "scientificPresealBinding",
    );
    expect(
      lifecycle.postrunHashManifestShape
        .generatedOnlyAfterExecutionCompletionAndEveryFileObservation,
    ).toBe(true);
    expect(
      lifecycle.postrunHashManifestShape
        .mayBeFrozenOrUsedAsInputBeforeItsPostrunGeneration,
    ).toBe(false);
    expect(lifecycle.chronology.exactBoundaryOrder).toEqual([
      "persist_hashless_preexecution_output_skeleton",
      "persist_scientific_preseal_binding_the_skeleton",
      "admit_and_start_execution",
      "complete_execution",
      "observe_and_rehash_every_output_file",
      "generate_hash_bearing_postrun_manifest",
    ]);
    expect(
      lifecycle.chronology
        .postrunManifestCannotBeAnInputToItsOwnScientificPreseal,
    ).toBe(true);
  });

  it("freezes exactly 68 unique ordered physical files", () => {
    const inventory =
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.exactRawOutputInventory;
    const files = inventory.descriptors;
    expect(files).toHaveLength(68);
    expect(files).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_PHYSICAL_FILE_DESCRIPTORS,
    );
    expect(files.map((entry) => entry.fileOrdinal)).toEqual(
      Array.from({ length: 68 }, (_, index) => index),
    );
    expect(new Set(files.map((entry) => entry.path)).size).toBe(68);
    expect(new Set(files.map((entry) => entry.role)).size).toBe(68);
    expect(files.slice(0, 5).map((entry) => entry.role)).toEqual([
      "noise_kernel",
      "noise_kernel_absolute_uncertainty95",
      "mean_rset",
      "mean_rset_absolute_uncertainty95",
      "smearing_weights",
    ]);
    expect(files[5].role).toBe("constraint_operand.level_0.H_H.computed");
    expect(files[67].role).toBe(
      "constraint_operand.level_2.jacobi.absolute_uncertainty95",
    );
    expect(inventory.pathMaterializationRules.runtimePathFormula).toBe(
      "execution.outputDirectory+'/'+descriptor.path_after_exact_{outputDirectory}/_prefix",
    );
    expect(
      inventory.pathMaterializationRules
        .runtimePathMustRemainInsideOutputRootAfterRealpath,
    ).toBe(true);
  });

  it("freezes raw representations, shapes, finiteness, and negative-zero rejection", () => {
    const files =
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.exactRawOutputInventory
        .descriptors;
    expect(files[0].shape).toEqual([64, 64, 100]);
    expect(files[2].shape).toEqual([64, 10]);
    expect(files[4].shape).toEqual([64]);
    expect(
      files.slice(5).every((entry) => entry.shape.join(",") === "64,4"),
    ).toBe(true);
    expect(
      files.every(
        (entry) =>
          entry.dtype === "float64" &&
          entry.binaryEncoding === "raw_ieee754" &&
          entry.endianness === "little" &&
          entry.storageOrder === "row-major" &&
          entry.finiteValuesRequired === true &&
          entry.negativeZeroAllowed === false,
      ),
    ).toBe(true);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.exactRawOutputInventory
        .representationRules
        .identicalContentHashesAcrossDistinctPhysicalFilesAllowed,
    ).toBe(true);
  });

  it("projects all 21 historical central roles onto level_2 without files", () => {
    const inventory =
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.exactRawOutputInventory;
    const aliases = inventory.centralLevel2LogicalAliases.aliases;
    const files = inventory.descriptors;
    expect(aliases).toHaveLength(21);
    expect(aliases).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_CENTRAL_LEVEL2_LOGICAL_ALIASES,
    );
    expect(inventory.centralLevel2LogicalAliases.additionalPhysicalFiles).toBe(
      0,
    );
    for (const alias of aliases) {
      const canonical = files[alias.canonicalFileOrdinal];
      expect(alias.additionalPhysicalFile).toBe(false);
      expect(alias.canonicalPath).toBe(canonical.path);
      expect(alias.canonicalRole).toBe(canonical.role);
      expect(alias.canonicalSha256MustEqualPhysicalFileEntrySha256).toBe(true);
    }
  });

  it("maps all five families at every level to primitive-file recomputation", () => {
    const recomputation =
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.serverRecomputation;
    expect(recomputation.residualMappings).toHaveLength(15);
    expect(
      recomputation.residualMappings.map((entry) => entry.mappingId),
    ).toEqual([
      "level_0.H_H",
      "level_0.H_Hi",
      "level_0.Hi_Hj",
      "level_0.antisymmetry",
      "level_0.jacobi",
      "level_1.H_H",
      "level_1.H_Hi",
      "level_1.Hi_Hj",
      "level_1.antisymmetry",
      "level_1.jacobi",
      "level_2.H_H",
      "level_2.H_Hi",
      "level_2.Hi_Hj",
      "level_2.antisymmetry",
      "level_2.jacobi",
    ]);
    expect(
      recomputation.residualMappings.every(
        (entry) =>
          entry.exactPrimitiveFilesByRole.every(
            (file) => file.serverRehashRequiredBeforeDecode,
          ) &&
          entry.submittedResidualUse ===
            "consistency_check_only_never_residual_or_convergence_authority" &&
          entry.uncertaintyUsedAsResidualFormulaOperand === false,
      ),
    ).toBe(true);
    const expectedSourceRoles = {
      H_H: ["computed", "target"],
      H_Hi: ["computed", "target"],
      Hi_Hj: ["computed", "target"],
      antisymmetry: ["forward", "reverse"],
      jacobi: ["term_1", "term_2", "term_3"],
    } as const;
    for (const mapping of recomputation.residualMappings) {
      expect(
        mapping.formulaSourcesInOrder.map((source) => source.formulaRole),
      ).toEqual(expectedSourceRoles[mapping.familyId]);
      expect(
        mapping.formulaSourcesInOrder.map((source) => source.formulaRole),
      ).not.toContain("absolute_uncertainty95");
      expect(mapping.uncertaintyRole).toBe("absolute_uncertainty95");
    }
  });

  it("types persisted computed operands and server-recomputed classical targets without trusting target echoes", () => {
    const mappings =
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.serverRecomputation
        .residualMappings;
    const hh = mappings.find((entry) => entry.mappingId === "level_0.H_H");
    const antisymmetry = mappings.find(
      (entry) => entry.mappingId === "level_0.antisymmetry",
    );
    const jacobi = mappings.find(
      (entry) => entry.mappingId === "level_0.jacobi",
    );
    expect(hh?.serverResidualFormula).toBe("server_residual=computed-target");
    expect(
      hh?.targetPolicy
        .serverMustRecomputeTargetFromFrozenClassicalStructureFunctions,
    ).toBe(true);
    expect(hh?.targetPolicy.submittedTargetAuthoritative).toBe(false);
    expect(hh?.targetPolicy.submittedTargetUse).toBe(
      "consistency_echo_only_never_formula_or_convergence_authority",
    );
    expect(hh?.formulaSourcesInOrder).toHaveLength(2);
    expect(hh?.formulaSourcesInOrder[0]).toMatchObject({
      formulaRole: "computed",
      authoritativeValueOrigin:
        "persisted_raw_operand_bytes_after_server_rehash_and_decode",
      submittedBytesUse:
        "authoritative_formula_input_only_after_server_byte_admission",
      submittedBytesAuthoritative: true,
      serverRecomputationRequired: false,
      serverRecomputationBinding: null,
      resolvedValueIsAuthoritativeFormulaInput: true,
    });
    expect(hh?.formulaSourcesInOrder[1]).toMatchObject({
      formulaRole: "target",
      authoritativeValueOrigin:
        "server_recomputed_from_frozen_classical_structure_functions",
      submittedBytesUse:
        "consistency_echo_only_never_formula_or_convergence_authority",
      submittedBytesAuthoritative: false,
      serverRecomputationRequired: true,
      resolvedValueIsAuthoritativeFormulaInput: true,
    });
    expect(
      hh?.formulaSourcesInOrder[1]?.serverRecomputationBinding?.sha256,
    ).toBe("d6f12f0703f5b756c8c08c424f3af8c06990b59005f404691b5b20f6e71ce700");
    expect(antisymmetry?.serverResidualFormula).toBe(
      "server_residual=forward+reverse",
    );
    expect(
      antisymmetry?.formulaSourcesInOrder.every(
        (source) =>
          source.authoritativeValueOrigin ===
            "persisted_raw_operand_bytes_after_server_rehash_and_decode" &&
          source.serverRecomputationRequired === false,
      ),
    ).toBe(true);
    expect(jacobi?.serverResidualFormula).toBe(
      "server_residual=term_1+term_2+term_3",
    );
  });

  it("preserves the frozen candidate noise-and-mean check order after primitive admission", () => {
    const recomputation =
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.serverRecomputation;
    expect(recomputation.primitiveDecodePolicy.admissionChecksInOrder).toEqual([
      "finiteness",
      "negativeZeroExclusion",
      "roleSensitiveNonnegativity",
    ]);
    expect(recomputation.requiredNoiseAndMeanChecksInOrder).toEqual([
      "metricDemandNondegeneracy",
      "meanMetricDemandClosure",
      "metricDemandErrorEnclosure",
      "smearingNormalization",
      "exchangeSymmetry",
      "psd",
      "maximumEigenvalueUpper95",
      "fluctuationRatio",
    ]);
  });

  it("rejects negative uncertainty, absolute-error, and smearing roles before gates", () => {
    const admission =
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.serverRecomputation
        .primitiveDecodePolicy.roleSensitiveNonnegativeAdmission;
    expect(admission.outputPhysicalFilesInOrdinalOrder).toHaveLength(18);
    expect(admission.constraintAbsoluteUncertainty95FileCount).toBe(15);
    expect(admission.nonconstraintAbsoluteUncertainty95FileCount).toBe(2);
    expect(admission.smearingWeightFileCount).toBe(1);
    expect(admission.staticInputIdsInCheckOrder).toEqual([
      "metric_demand_absolute_error_bound",
    ]);
    expect(
      admission.outputPhysicalFilesInOrdinalOrder.every(
        (entry) =>
          entry.rule === "every_decoded_value_greater_than_or_equal_to_zero",
      ),
    ).toBe(true);
    expect(
      admission.everyAbsoluteUncertainty95ValueMustBeGreaterThanOrEqualToZero,
    ).toBe(true);
    expect(
      admission.everyMetricDemandAbsoluteErrorBoundValueMustBeGreaterThanOrEqualToZero,
    ).toBe(true);
    expect(admission.everySmearingWeightMustBeGreaterThanOrEqualToZero).toBe(
      true,
    );
    expect(admission.smearingNormalizationStillRecomputedSeparately).toBe(true);
  });

  it("defines five separate three-level regulator convergence recomputations", () => {
    const convergence =
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA.serverRecomputation
        .convergenceMappings;
    expect(convergence).toHaveLength(5);
    expect(convergence.map((entry) => entry.familyId)).toEqual([
      "H_H",
      "H_Hi",
      "Hi_Hj",
      "antisymmetry",
      "jacobi",
    ]);
    expect(
      convergence.every(
        (entry) =>
          entry.familyAggregation === "none" &&
          entry.exactLevelInputs.length === 3 &&
          entry.exactLevelInputs.every(
            (level) =>
              level.residualSource ===
              "server_recomputed_residual_not_submitted_residual_bytes",
          ),
      ),
    ).toBe(true);
  });

  it("requires exact provenance, static preseal closure, and independent roots", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA;
    expect(contract.provenanceSchema.execution.exactFieldOrder).toContain(
      "commitSha",
    );
    expect(contract.provenanceSchema.execution.exactFieldOrder).toContain(
      "argv",
    );
    expect(contract.provenanceSchema.sourceProvenance.meanRsetOrigin).toBe(
      "renormalized_quantum_state_expectation_value",
    );
    expect(contract.provenanceSchema.sourceProvenance.noiseKernelOrigin).toBe(
      "connected_symmetrized_quantum_state_two_point_function",
    );
    expect(
      contract.provenanceSchema.fileHashAndFreshness
        .serverMustVerifyRunSpecificNewnessUsingPreexecutionAbsenceInventory,
    ).toBe(true);
    expect(
      contract.staticInputClosureSchema
        .closureMustBeFrozenAndServerPersistedBeforeExecution,
    ).toBe(true);
    expect(contract.implementationPairSchema.exactRoleOrder).toEqual([
      "primary",
      "independent",
    ]);
    expect(
      contract.implementationPairSchema
        .sourceDependencyAndExecutableHashesMustDifferAcrossRoles,
    ).toBe(true);
    expect(
      contract.implementationPairSchema
        .implementationAndOutputRootsPairwiseDisjointByPortablePathRealpathAndFilesystemIdentity,
    ).toBe(true);
  });

  it("locks retuning, replay, lamps, and physical claims", () => {
    const contract = NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA;
    expect(contract.frozenFailurePolicy.anyFrozenLimitExceeded).toBe(
      "fail_this_v2_candidate_without_retuning_or_relabeling",
    );
    expect(
      contract.frozenFailurePolicy.postObservationToleranceChangeAllowed,
    ).toBe(false);
    expect(
      Object.entries(contract.authorityLocks).every(([, value]) =>
        value === null ? true : value === false,
      ),
    ).toBe(true);
  });

  it("rejects semantic drift in pins, paths, typed sources, chronology, completeness, and authority", () => {
    const pinDrift = mutableClone();
    at(pinDrift, "exactBindings", "regulatorDefinition").sha256 = "0".repeat(
      64,
    );
    expect(nhm2SphericalBosonStarV2RawReplaySchemaViolations(pinDrift)).toEqual(
      ["spherical_v2_raw_replay_schema_semantic_drift"],
    );

    const pathDrift = mutableClone();
    const descriptors = at(pathDrift, "exactRawOutputInventory").descriptors as
      MutableRecord[] | undefined;
    expect(descriptors).toBeDefined();
    descriptors![5].path = "outputs/not-the-frozen-path.f64le";
    expect(
      nhm2SphericalBosonStarV2RawReplaySchemaViolations(pathDrift),
    ).toEqual(["spherical_v2_raw_replay_schema_semantic_drift"]);

    const sourceAuthorityDrift = mutableClone();
    const residualMappings = at(sourceAuthorityDrift, "serverRecomputation")
      .residualMappings as MutableRecord[];
    const formulaSources = residualMappings[0]
      .formulaSourcesInOrder as MutableRecord[];
    formulaSources[1].submittedBytesUse =
      "authoritative_formula_input_only_after_server_byte_admission";
    expect(
      nhm2SphericalBosonStarV2RawReplaySchemaViolations(sourceAuthorityDrift),
    ).toEqual(["spherical_v2_raw_replay_schema_semantic_drift"]);

    const chronologyDrift = mutableClone();
    at(
      chronologyDrift,
      "successorArtifactLifecycle",
      "postrunHashManifestShape",
    ).mayBeFrozenOrUsedAsInputBeforeItsPostrunGeneration = true;
    expect(
      nhm2SphericalBosonStarV2RawReplaySchemaViolations(chronologyDrift),
    ).toEqual(["spherical_v2_raw_replay_schema_semantic_drift"]);

    const completenessDrift = mutableClone();
    at(
      completenessDrift,
      "scienceInputCompleteness",
      "operatorOrderingArtifactStatus",
    ).scientificInputComplete = true;
    expect(
      nhm2SphericalBosonStarV2RawReplaySchemaViolations(completenessDrift),
    ).toEqual(["spherical_v2_raw_replay_schema_semantic_drift"]);

    const authorityDrift = mutableClone();
    at(authorityDrift, "authorityLocks").executionAuthorized = true;
    expect(
      nhm2SphericalBosonStarV2RawReplaySchemaViolations(authorityDrift),
    ).toEqual(["spherical_v2_raw_replay_schema_semantic_drift"]);
  });

  it("rejects nonfinite values and negative zero", () => {
    const nonfinite = mutableClone();
    at(nonfinite, "exactRawOutputInventory").exactUniquePhysicalFileCount =
      Number.POSITIVE_INFINITY;
    expect(
      nhm2SphericalBosonStarV2RawReplaySchemaViolations(nonfinite)[0],
    ).toMatch(/^invalid_number:/);

    const negativeZero = mutableClone();
    at(negativeZero, "exactRawOutputInventory").exactUniquePhysicalFileCount =
      -0;
    expect(
      nhm2SphericalBosonStarV2RawReplaySchemaViolations(negativeZero)[0],
    ).toMatch(/^invalid_number:/);
  });

  it("rejects proxies and accessors without invoking hostile code", () => {
    expect(
      nhm2SphericalBosonStarV2RawReplaySchemaViolations(
        new Proxy(mutableClone(), {}),
      )[0],
    ).toBe("proxy_forbidden:/");

    let invoked = false;
    const accessor = mutableClone();
    Object.defineProperty(accessor, "artifactId", {
      enumerable: true,
      get: () => {
        invoked = true;
        throw new Error("must not run");
      },
    });
    expect(nhm2SphericalBosonStarV2RawReplaySchemaViolations(accessor)[0]).toBe(
      "object_entry_surface:/artifactId",
    );
    expect(invoked).toBe(false);
  });

  it("rejects cycles, non-plain objects, symbols, and forbidden keys", () => {
    const cycle = mutableClone();
    cycle.artifactId = cycle;
    expect(nhm2SphericalBosonStarV2RawReplaySchemaViolations(cycle)[0]).toBe(
      "cycle_forbidden:/artifactId",
    );

    const nonPlain = mutableClone();
    nonPlain.artifactId = new Date();
    expect(nhm2SphericalBosonStarV2RawReplaySchemaViolations(nonPlain)[0]).toBe(
      "non_plain_object:/artifactId",
    );

    const symbolKey = mutableClone();
    Object.defineProperty(symbolKey, Symbol("hostile"), {
      value: true,
      enumerable: true,
    });
    expect(
      nhm2SphericalBosonStarV2RawReplaySchemaViolations(symbolKey)[0],
    ).toBe("object_surface:/");

    const forbidden = mutableClone();
    Object.defineProperty(forbidden, "constructor", {
      value: "hostile",
      enumerable: true,
    });
    expect(
      nhm2SphericalBosonStarV2RawReplaySchemaViolations(forbidden)[0],
    ).toBe("forbidden_key:/constructor");
  });

  it("rejects hostile depth, array length, and string budgets", () => {
    const deep = mutableClone();
    let cursor: MutableRecord = {};
    deep.artifactId = cursor;
    for (
      let index = 0;
      index <=
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_VALIDATOR_LIMITS.maximumDepth;
      index += 1
    ) {
      const next: MutableRecord = {};
      cursor.next = next;
      cursor = next;
    }
    expect(nhm2SphericalBosonStarV2RawReplaySchemaViolations(deep)[0]).toMatch(
      /^snapshot_depth_limit:/,
    );

    const longArray = mutableClone();
    longArray.artifactId = new Array(
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_VALIDATOR_LIMITS.maximumArrayLength +
        1,
    );
    expect(
      nhm2SphericalBosonStarV2RawReplaySchemaViolations(longArray)[0],
    ).toBe("array_length_limit:/artifactId");

    const longString = mutableClone();
    longString.artifactId = "x".repeat(
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_VALIDATOR_LIMITS.maximumStringUtf8Bytes +
        1,
    );
    expect(
      nhm2SphericalBosonStarV2RawReplaySchemaViolations(longString)[0],
    ).toBe("string_byte_limit:/artifactId");
  });
});
