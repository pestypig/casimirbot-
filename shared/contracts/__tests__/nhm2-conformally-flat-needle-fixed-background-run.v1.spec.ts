import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import * as runModule from "../nhm2-conformally-flat-needle-fixed-background-run.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_CANONICAL_JSON,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_CLAIM_LOCKS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_CANDIDATE_DESCRIPTOR_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_CANDIDATE_DESCRIPTOR_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_CONTENT_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_CONTENT_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_OBSERVABLES_CONTRACT_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_OBSERVABLES_CONTRACT_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_SCALAR_REFERENCE_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_SCALAR_REFERENCE_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_SIZE_BYTES,
  isNhm2ConformallyFlatNeedleFixedBackgroundRunV1,
  nhm2ConformallyFlatNeedleFixedBackgroundRunViolations,
} from "../nhm2-conformally-flat-needle-fixed-background-run.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
} from "../nhm2-conformally-flat-needle-fixed-background-observables.v1";
import { NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE } from "../nhm2-conformally-flat-needle-scalar-reference.v1";

const clone = (): any =>
  structuredClone(NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN);

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
    canonicalization: "utf8_lexicographic_object_keys_json_v1",
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

describe("nhm2_conformally_flat_needle_fixed_background_run/v1", () => {
  it("exports one exact deeply frozen blocked schema plan and no authority factory", () => {
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundRunViolations(
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN,
      ),
    ).toEqual([]);
    expect(
      isNhm2ConformallyFlatNeedleFixedBackgroundRunV1(
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN,
      ),
    ).toBe(true);
    expect(
      isDeepFrozen(NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN),
    ).toBe(true);
    expect(
      Object.keys(runModule).filter((name) =>
        /^(?:build|create|issue|authorize|execute|promote)/i.test(name),
      ),
    ).toEqual([]);
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN.content,
    ).toMatchObject({
      maturity: "diagnostic_fixed_background_run_schema_plan_only",
      status: "blocked_manifest_only_no_execution",
      executionAdmissible: false,
      schemaPlanOnly: true,
    });
  });

  it("binds the exact observables contract, scalar reference, candidate descriptor, content, and exported bytes", () => {
    const contract = NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN;
    const bindings = contract.content.bindings;
    expect(bindings.observablesContract).toMatchObject({
      sha256: NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
      sizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
      contentSha256:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES.contentBinding
          .sha256,
      contentSizeBytes:
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES.contentBinding
          .sizeBytes,
      exactContractRequired: true,
    });
    expect(bindings.scalarReference).toMatchObject({
      ...binding(NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE),
      exactReferenceRequired: true,
    });
    expect(bindings.candidateIdentity).toMatchObject({
      status: "exact_semantic_descriptor_bound_manifest_not_issued",
      descriptorSha256: binding(bindings.candidateIdentity.descriptor).sha256,
      descriptorSizeBytes: binding(bindings.candidateIdentity.descriptor)
        .sizeBytes,
      authoritativeManifestSha256: null,
      authoritativeManifestSizeBytes: null,
      authoritativeManifestPresent: false,
    });
    expect(contract.contentBinding).toMatchObject(binding(contract.content));
    expect(NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_SHA256).toBe(
      createHash("sha256")
        .update(
          NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_CANONICAL_JSON,
          "utf8",
        )
        .digest("hex"),
    );
    expect(NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_SIZE_BYTES).toBe(
      Buffer.byteLength(
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_CANONICAL_JSON,
        "utf8",
      ),
    );
    expect(NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_SHA256).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_SHA256,
    );
    expect(NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_SIZE_BYTES).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_SIZE_BYTES,
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_OBSERVABLES_CONTRACT_SHA256,
    );
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
    ).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_OBSERVABLES_CONTRACT_SIZE_BYTES,
    );
    expect(bindings.scalarReference.sha256).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_SCALAR_REFERENCE_SHA256,
    );
    expect(bindings.scalarReference.sizeBytes).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_SCALAR_REFERENCE_SIZE_BYTES,
    );
    expect(bindings.candidateIdentity.descriptorSha256).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_CANDIDATE_DESCRIPTOR_SHA256,
    );
    expect(bindings.candidateIdentity.descriptorSizeBytes).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_CANDIDATE_DESCRIPTOR_SIZE_BYTES,
    );
    expect(contract.contentBinding.sha256).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_CONTENT_SHA256,
    );
    expect(contract.contentBinding.sizeBytes).toBe(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_EXPECTED_CONTENT_SIZE_BYTES,
    );
  });

  it("names exactly one nondegenerate diagnostic candidate without relabeling it as current NHM2 or physical", () => {
    const descriptor =
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN.content.bindings
        .candidateIdentity.descriptor;
    expect(descriptor).toMatchObject({
      candidateId: "conformally_flat_needle_fixed_background_candidate_001",
      candidateOrdinal: 1,
      candidateCount: 1,
      relationshipToCurrentNhm2:
        "not_the_current_nhm2_shift_lapse_metric_or_source_model",
      semanticRelabelingAllowed: false,
      geometryCriterion: {
        kind: "nondegenerate_conformal_bump_reference",
        conformalAmplitude: 0.000001,
        conformalAmplitudeNonzero: true,
        conformalFactorStrictlyPositive: true,
        sampleCount: 64,
        allSmearingSupportsStrictlyInsideBump: true,
        diagnosticMathematicalCriterionSatisfied: true,
        establishesPhysicalRealizability: false,
      },
      executionPresealIssued: false,
      authoritativeCandidateManifestPresent: false,
    });
  });

  it("binds the exact ordered geometry, state, chart, tetrad, sample, smearing, and tensor identities", () => {
    const bindings =
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN.content
        .frozenInputIdentityBindings;
    const identities =
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES.content
        .frozenInputIdentities;
    const expected = [
      ["geometry", identities.geometry],
      ["state", identities.state],
      ["chart", identities.chart],
      ["tetrad", identities.tetrad],
      ["samples", identities.samples],
      ["smearing", identities.smearing],
      ["tensor_convention", identities.tensorConvention],
    ] as const;
    expect(bindings.map(({ role }) => role)).toEqual(
      expected.map(([role]) => role),
    );
    for (let ordinal = 0; ordinal < expected.length; ordinal += 1) {
      expect(bindings[ordinal]).toMatchObject({
        ordinal,
        role: expected[ordinal][0],
        ...binding(expected[ordinal][1]),
      });
    }
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN.content
        .unresolvedExecutionPolicyBindings,
    ).toMatchObject({
      renormalizationConventionPlan: {
        authoritativeConventionFrozen: false,
        ...binding(
          NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES.content
            .renormalizationConventionPlan,
        ),
      },
      deterministicNumericsPlan: {
        policyFrozen: false,
        ...binding(
          NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES.content
            .deterministicNumericsPlan,
        ),
      },
      executionAllowedWhileEitherPolicyUnresolved: false,
    });
  });

  it("plans exactly five ordered raw f64le outputs with exact shapes and byte counts", () => {
    const inventory =
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN.content
        .plannedArtifactInventory;
    const arrays = inventory.arrayOutputs;
    expect(arrays.map(({ ordinal }) => ordinal)).toEqual([0, 1, 2, 3, 4]);
    expect(arrays.map(({ role }) => role)).toEqual([
      "fixed_background_mean_rset",
      "fixed_background_mean_rset_absolute_uncertainty95",
      "fixed_background_connected_noise_kernel",
      "fixed_background_connected_noise_absolute_uncertainty95",
      "fixed_background_sample_weights",
    ]);
    expect(arrays.map(({ shape }) => shape)).toEqual([
      [64, 10],
      [64, 10],
      [64, 64, 100],
      [64, 64, 100],
      [64],
    ]);
    expect(arrays.map(({ axisOrder }) => axisOrder)).toEqual([
      ["sample_ordinal", "tensor_component_ordinal"],
      ["sample_ordinal", "tensor_component_ordinal"],
      [
        "left_sample_ordinal",
        "right_sample_ordinal",
        "tensor_component_pair_ordinal",
      ],
      [
        "left_sample_ordinal",
        "right_sample_ordinal",
        "tensor_component_pair_ordinal",
      ],
      ["sample_ordinal"],
    ]);
    expect(arrays.map(({ expectedSizeBytes }) => expectedSizeBytes)).toEqual([
      5120, 5120, 3276800, 3276800, 512,
    ]);
    expect(
      arrays.reduce((sum, entry) => sum + entry.expectedSizeBytes, 0),
    ).toBe(inventory.totalExpectedArrayBytesPerImplementation);
    expect(inventory.totalExpectedArrayBytesPerImplementation).toBe(6564352);
    expect(
      inventory.artifactPathsResolvedUnderPerImplementationRunOutputRoot,
    ).toBe(true);
    for (const entry of arrays) {
      expect(entry.relativePath.endsWith(".f64le")).toBe(true);
      expect(entry.encoding).toBe("raw_ieee754_float64_little_endian");
      expect(entry.elementSizeBytes).toBe(8);
      expect(entry.expectedSizeBytes).toBe(
        entry.elementCount * entry.elementSizeBytes,
      );
      expect(entry).toMatchObject({
        headerBytes: 0,
        framingAllowed: false,
        present: false,
        sha256: null,
        sizeBytes: null,
        serverObservationReceiptSha256: null,
      });
    }
  });

  it("plans exact derivation, tail, and provenance sidecars that cannot authorize claims", () => {
    const inventory =
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN.content
        .plannedArtifactInventory;
    expect(inventory.sidecars.map(({ ordinal }) => ordinal)).toEqual([0, 1, 2]);
    expect(inventory.sidecars.map(({ role }) => role)).toEqual([
      "fixed_background_derivation_receipt",
      "fixed_background_interval_trace",
      "fixed_background_execution_provenance",
    ]);
    expect(inventory.sidecars.map(({ mediaType }) => mediaType)).toEqual([
      "application/json",
      "application/jsonl",
      "application/json",
    ]);
    for (const sidecar of inventory.sidecars) {
      expect(sidecar).toMatchObject({
        authoritativeByItself: false,
        canUnlockClaims: false,
        present: false,
        sha256: null,
        sizeBytes: null,
        serverObservationReceiptSha256: null,
      });
    }
    expect(inventory.sidecarsAreAuthorityByThemselves).toBe(false);
    expect(inventory.arrayHashReceiptsPresent).toBe(false);
    expect(inventory.sidecarHashReceiptsPresent).toBe(false);
  });

  it("requires distinct absent source, dependency, and executable bytes for both lineages", () => {
    const plan =
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN.content
        .implementationInputPlan;
    expect(
      plan.inputs.map(({ implementationRole }) => implementationRole),
    ).toEqual(["primary", "independent"]);
    const roots = plan.inputs.map(({ lineageRoot }) => lineageRoot);
    const runOutputRoots = plan.inputs.map(
      ({ runOutputRoot }) => runOutputRoot,
    );
    const paths = plan.inputs.flatMap((entry) => [
      entry.source.relativePath,
      entry.dependency.relativePath,
      entry.executable.relativePath,
    ]);
    expect(new Set(roots).size).toBe(2);
    expect(new Set(runOutputRoots).size).toBe(2);
    expect(new Set([...roots, ...runOutputRoots]).size).toBe(4);
    expect(new Set(paths).size).toBe(6);
    for (const implementation of plan.inputs) {
      expect(implementation.status).toBe("planned_bytes_absent");
      for (const input of [
        implementation.source,
        implementation.dependency,
        implementation.executable,
      ]) {
        expect(
          input.relativePath.startsWith(`${implementation.lineageRoot}/`),
        ).toBe(true);
        expect(input).toMatchObject({
          requiredBeforeExecution: true,
          present: false,
          sha256: null,
          sizeBytes: null,
          executorObserved: false,
        });
      }
    }
    expect(plan).toMatchObject({
      lineageRootsMustBeDisjoint: true,
      runOutputRootsMustBeDisjoint: true,
      crossLineageSourceReuseAllowed: false,
      crossLineageDependencyReuseAllowed: false,
      crossLineageExecutableReuseAllowed: false,
      crossLineageRuntimeReuseAllowed: false,
      crossLineageIntermediateCacheReuseAllowed: false,
      producerSelfAssertionSufficient: false,
    });
  });

  it("keeps preseal, execution, replay, pair agreement, lamps, and certificate authority absent", () => {
    const content = NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN.content;
    expect(content.freezeBoundary).toMatchObject({
      renormalizationConventionFrozenForExecution: false,
      deterministicNumericsPolicyFrozenForExecution: false,
      executionPresealIssued: false,
      exactPresealSha256: null,
      exactPresealSizeBytes: null,
      candidateManifestSha256: null,
      candidateManifestSizeBytes: null,
      mutationAfterPresealAllowed: false,
    });
    expect(content.replayAndAgreementBoundary).toEqual({
      runReceiptPresent: false,
      runReceiptSha256: null,
      replayReceiptPresent: false,
      replayReceiptSha256: null,
      pairAgreementReceiptPresent: false,
      pairAgreementReceiptSha256: null,
      serverByteReplayCompleted: false,
      independentPairAgreementEstablished: false,
      executionProvenanceVerified: false,
      replayOrReceiptMayBeSynthesizedFromThisPlan: false,
    });
    expect(content.authority).toMatchObject({
      status: "blocked",
      blockers: NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_BLOCKERS,
      builderExported: false,
      issuerExported: false,
      executableRunExported: false,
      manifestMayAuthorizeExecution: false,
      manifestMayUnlockLamps: false,
      manifestMayEstablishConstraintClosure: false,
      manifestMayEstablishPhysicalClaims: false,
      certificateAuthority: false,
    });
    expect(
      Object.values(
        NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_CLAIM_LOCKS,
      ),
    ).not.toContain(true);
  });

  it("forbids the declared lever, metric-demand substitution, and every constraint-shaped output", () => {
    const content = NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN.content;
    expect(content.sourceBoundary).toMatchObject({
      declaredLeverTensorPresent: false,
      declaredLeverTensorInputAllowed: false,
      declaredLeverTensorForbidden: true,
      metricDemandTensorInputAllowed: false,
      metricDemandSubstitutionForQuantumExpectationAllowed: false,
    });
    expect(content.constraintOutputBoundary).toMatchObject({
      constraintArrayProductionAuthorized: false,
      constraintOutputSchemaPresent: false,
      normalizedConstraintBracketOutputAuthorized: false,
      antisymmetryOutputAuthorized: false,
      jacobiOutputAuthorized: false,
      regulatorOutputAuthorized: false,
      fullAdmConstraintClosureClaimAllowed: false,
      fixedBackgroundWardIdentityEstablishesFullAdmClosure: false,
    });
    const outputRoles = content.plannedArtifactInventory.arrayOutputs.map(
      ({ role }) => role,
    );
    expect(
      outputRoles.some((role) =>
        /(?:^H$|^H_i$|constraint|bracket|jacobi|antisymmetry|regulator)/i.test(
          role,
        ),
      ),
    ).toBe(false);
  });

  it("freezes fail-without-retuning as the only future execution disposition", () => {
    expect(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN.content.noRetunePolicy,
    ).toEqual({
      policy: "single_exact_presealed_candidate_fail_without_retuning",
      candidateRetuningAfterExecutionFailureAllowed: false,
      renormalizationRetuningAfterExecutionFailureAllowed: false,
      toleranceRetuningAfterExecutionFailureAllowed: false,
      cutoffRetuningAfterExecutionFailureAllowed: false,
      budgetRetuningAfterExecutionFailureAllowed: false,
      implementationSubstitutionAfterExecutionFailureAllowed: false,
      failureDisposition: "fail_candidate_and_preserve_failed_lineage",
    });
  });

  it("rejects extra or missing keys and any canonical binding drift", () => {
    const extra = clone();
    extra.content.authority.promoted = true;
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundRunViolations(extra),
    ).toContain("extra_key:/content/authority/promoted");

    const missing = clone();
    delete missing.content.bindings.scalarReference.sizeBytes;
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundRunViolations(missing),
    ).toContain("missing_key:/content/bindings/scalarReference/sizeBytes");

    const bindingDrift = clone();
    bindingDrift.content.bindings.observablesContract.sha256 = "0".repeat(64);
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundRunViolations(bindingDrift),
    ).toContain("canonical_identity_bindings_invalid");
  });

  it("rejects proxies, accessors without invoking them, symbols, and non-plain objects", () => {
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundRunViolations(
        new Proxy(clone(), {}),
      ),
    ).toEqual(["proxy_forbidden:/"]);

    let getterCalls = 0;
    const accessor = clone();
    Object.defineProperty(accessor.content, "status", {
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return "blocked_manifest_only_no_execution";
      },
    });
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundRunViolations(accessor),
    ).toEqual(["accessor_or_hidden_property_forbidden:/content/status"]);
    expect(getterCalls).toBe(0);

    const nestedProxy = clone();
    nestedProxy.content.bindings = new Proxy(nestedProxy.content.bindings, {});
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundRunViolations(nestedProxy),
    ).toEqual(["proxy_forbidden:/content/bindings"]);

    const symbol = clone();
    symbol.content[Symbol("hidden-authority")] = true;
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundRunViolations(symbol),
    ).toEqual(["symbol_key_forbidden:/content"]);

    const forbiddenKey = clone();
    Object.defineProperty(forbiddenKey.content, "__proto__", {
      value: { promoted: true },
      enumerable: true,
    });
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundRunViolations(forbiddenKey),
    ).toEqual(["forbidden_data_key:/content/__proto__"]);

    const inherited = Object.assign(Object.create({ promoted: true }), clone());
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundRunViolations(inherited),
    ).toEqual(["non_plain_object:/"]);
  });

  it("rejects invented outputs, observed hashes, lineage reuse, retuning, and every false lock promotion", () => {
    const constraint = clone();
    constraint.content.plannedArtifactInventory.arrayOutputs[0].role =
      "normalized_constraint_bracket";
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundRunViolations(constraint),
    ).toContain(
      "raw_array_inventory_must_remain_unobserved_and_constraint_free",
    );

    const inventedHash = clone();
    inventedHash.content.plannedArtifactInventory.arrayOutputs[0].present = true;
    inventedHash.content.plannedArtifactInventory.arrayOutputs[0].sha256 =
      "a".repeat(64);
    inventedHash.content.plannedArtifactInventory.arrayOutputs[0].sizeBytes = 5120;
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundRunViolations(inventedHash),
    ).toContain(
      "raw_array_inventory_must_remain_unobserved_and_constraint_free",
    );

    const lineageReuse = clone();
    lineageReuse.content.implementationInputPlan.inputs[1].lineageRoot =
      lineageReuse.content.implementationInputPlan.inputs[0].lineageRoot;
    lineageReuse.content.implementationInputPlan.inputs[1].source.relativePath =
      lineageReuse.content.implementationInputPlan.inputs[0].source.relativePath;
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundRunViolations(lineageReuse),
    ).toContain("implementation_lineages_must_remain_disjoint_and_unobserved");

    const retune = clone();
    retune.content.noRetunePolicy.toleranceRetuningAfterExecutionFailureAllowed = true;
    expect(
      nhm2ConformallyFlatNeedleFixedBackgroundRunViolations(retune),
    ).toContain("no_retune_policy_invalid");

    for (const key of Object.keys(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_RUN_CLAIM_LOCKS,
    )) {
      const promoted = clone();
      promoted.content.claimLocks[key] = true;
      expect(
        nhm2ConformallyFlatNeedleFixedBackgroundRunViolations(promoted),
        key,
      ).toContain(`claim_lock_must_remain_false:${key}`);
    }
  });
});
