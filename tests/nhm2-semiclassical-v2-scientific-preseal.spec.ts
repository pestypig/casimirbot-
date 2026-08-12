import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
} from "../shared/contracts/nhm2-semiclassical-v2-raw-replay-manifest.v1";
import {
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_NONDEGENERACY_CRITERION_ID,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_COVERAGE,
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ENCLOSURE_METHOD,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_CLAIM_LOCKS,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_KIND,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_PHASE,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_NON_SELF_INPUT_IDS,
  canonicalNhm2SemiclassicalV2ScientificCandidateManifestJson,
  computeNhm2SemiclassicalV2ScientificCandidateManifestExternalSha256,
  type Nhm2SemiclassicalV2ScientificCandidateManifestV1,
} from "../shared/contracts/nhm2-semiclassical-v2-scientific-candidate-manifest.v1";
import {
  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_NONZERO_SCREEN_ID,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_AUTHORITY,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONSUMER_SCOPE,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONTRACT_VERSION,
  computeNhm2SemiclassicalV2ScientificContentSha256,
  computeNhm2SemiclassicalV2ScientificSealKey,
  computeNhm2SemiclassicalV2SealedInventorySha256,
  isNhm2SemiclassicalV2ScientificPreseal,
  nhm2SemiclassicalV2ScientificPresealCandidateBindingViolations,
  nhm2SemiclassicalV2ScientificPresealPairViolations,
  nhm2SemiclassicalV2ScientificPresealViolations,
  type Nhm2SemiclassicalV2ScientificPresealV1,
} from "../shared/contracts/nhm2-semiclassical-v2-scientific-preseal.v1";
import { NHM2_SEMICLASSICAL_TENSOR_COMPONENTS } from "../shared/contracts/nhm2-semiclassical-state-realizability.v1";

const sha = (value: string): string =>
  createHash("sha256").update(value, "utf8").digest("hex");

const objectIds: Record<string, string> = {
  geometry: "geometry-frozen-001",
  quantum_state: "quantum-state-frozen-001",
  chart: "chart-frozen-001",
  normalization: "normalization-frozen-001",
  smearing_definition: "smearing-frozen-001",
  sampling_basis: "sampling-basis-frozen-001",
};

const buildCandidate =
  (): Nhm2SemiclassicalV2ScientificCandidateManifestV1 => ({
    artifactId: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_ARTIFACT_ID,
    contractVersion:
      NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_CONTRACT_VERSION,
    phase: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_PHASE,
    candidateFrozenAt: "2026-08-09T12:00:00.000Z",
    candidate: {
      candidateId: "nhm2-v2-candidate-001",
      candidateManifestId: "nhm2-v2-candidate-manifest-001",
      selectedProfileId: "nhm2-nondegenerate-profile-001",
      candidateKind: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_KIND,
      geometryId: objectIds.geometry,
      quantumStateId: objectIds.quantum_state,
      chartId: objectIds.chart,
      normalizationId: objectIds.normalization,
      tolerancePolicyId: NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID,
      smearingFunctionId: objectIds.smearing_definition,
      samplingBasisId: objectIds.sampling_basis,
      nondegeneracyCriterionId:
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_NONDEGENERACY_CRITERION_ID,
      metricDemandInputId: "metric_demand_tensor",
      metricDemandErrorBoundInputId: "metric_demand_absolute_error_bound",
      metricDemandDerivationWitnessInputId: "metric_demand_derivation_receipt",
      minimumMetricDemandFrobeniusSI:
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.minimumMetricDemandFrobeniusSI,
      requiredNondegenerateSampleFraction:
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.requiredMetricDemandSampleFraction,
      sampleCount: 64,
    },
    sourceProvenance: {
      sourceMode: "state_derived_not_declared_lever",
      meanRsetOrigin: "renormalized_quantum_state_expectation_value",
      noiseKernelOrigin:
        "connected_symmetrized_quantum_state_two_point_function",
      declaredLeverTensorUsed: false,
      inputClosureExcludesDeclaredLeverTensor: true,
    },
    scientificInputs:
      NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_NON_SELF_INPUT_IDS.map(
        (inputId) => {
          if (inputId === "tolerance_policy") {
            return {
              inputId,
              relativePath: "policy/approved-replay-policy.v1.json",
              sha256:
                NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.sha256,
              sizeBytes:
                NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.sizeBytes,
              mediaType: "application/json",
              descriptor: {
                descriptorKind: "approved_replay_policy",
                scientificInputId: inputId,
                artifactId:
                  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ARTIFACT_ID,
                contractVersion:
                  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CONTRACT_VERSION,
                policyId: NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID,
              },
            };
          }
          if (
            inputId === "metric_demand_tensor" ||
            inputId === "metric_demand_absolute_error_bound"
          ) {
            return {
              inputId,
              relativePath:
                inputId === "metric_demand_tensor"
                  ? "metric/metric-demand.float64le.bin"
                  : "metric/metric-demand-error-bound.float64le.bin",
              sha256: sha(inputId),
              sizeBytes: 64 * NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length * 8,
              mediaType: "application/octet-stream",
              descriptor: {
                descriptorKind:
                  inputId === "metric_demand_tensor"
                    ? "metric_demand_tensor_float64"
                    : "metric_demand_absolute_error_bound_float64",
                scientificInputId: inputId,
                dtype: "float64",
                binaryEncoding: "raw_ieee754",
                endianness: "little",
                shape: [64, NHM2_SEMICLASSICAL_TENSOR_COMPONENTS.length],
                storageOrder: "row-major",
                componentOrder: [...NHM2_SEMICLASSICAL_TENSOR_COMPONENTS],
                unit: "J/m^3",
              },
            };
          }
          if (inputId === "metric_demand_derivation_receipt") {
            return {
              inputId,
              relativePath: "metric/metric-demand-derivation-receipt.v1.json",
              sha256: sha(inputId),
              sizeBytes: 2048,
              mediaType: "application/json",
              descriptor: {
                descriptorKind: "metric_demand_derivation_receipt",
                scientificInputId: inputId,
                artifactId:
                  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID,
                contractVersion:
                  NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION,
                scientificObjectId: "nhm2-v2-candidate-001",
              },
            };
          }
          return {
            inputId,
            relativePath: `science/${inputId}.v1.json`,
            sha256: sha(inputId),
            sizeBytes: 128 + inputId.length,
            mediaType: "application/json",
            descriptor: {
              descriptorKind: "frozen_scientific_artifact",
              scientificInputId: inputId,
              artifactId: `nhm2.test.${inputId}`,
              contractVersion: "nhm2_test_scientific_artifact/v1",
              scientificObjectId: objectIds[inputId] ?? `${inputId}-frozen-001`,
            },
          };
        },
      ) as Nhm2SemiclassicalV2ScientificCandidateManifestV1["scientificInputs"],
    claimLocks: { ...NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_CLAIM_LOCKS },
  });

const buildFixture = (): {
  candidate: Nhm2SemiclassicalV2ScientificCandidateManifestV1;
  candidateBytes: Buffer;
  preseal: Nhm2SemiclassicalV2ScientificPresealV1;
} => {
  const candidate = buildCandidate();
  const candidateBytes = Buffer.from(
    canonicalNhm2SemiclassicalV2ScientificCandidateManifestJson(candidate),
    "utf8",
  );
  const candidateSha256 =
    computeNhm2SemiclassicalV2ScientificCandidateManifestExternalSha256(
      candidateBytes,
    );
  const stagedInputs = [
    {
      inputId: "candidate_manifest" as const,
      relativePath: "candidate/scientific-candidate-manifest.v1.json",
      sha256: candidateSha256,
      sizeBytes: candidateBytes.byteLength,
      mediaType: "application/json" as const,
      descriptor: {
        descriptorKind: "scientific_candidate_manifest" as const,
        scientificInputId: "candidate_manifest" as const,
        artifactId:
          NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_ARTIFACT_ID,
        contractVersion:
          NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_CONTRACT_VERSION,
        candidateId: candidate.candidate.candidateId,
        candidateManifestId: candidate.candidate.candidateManifestId,
        candidateFrozenAt: candidate.candidateFrozenAt,
      },
    },
    ...structuredClone(candidate.scientificInputs),
  ];
  const unsigned = {
    artifactId: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_ARTIFACT_ID,
    contractVersion: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONTRACT_VERSION,
    authority: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_AUTHORITY,
    consumerScope: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONSUMER_SCOPE,
    sealKey: computeNhm2SemiclassicalV2ScientificSealKey(
      candidate.candidate.candidateId,
    ),
    candidateFrozenAt: candidate.candidateFrozenAt,
    sealedAt: "2026-08-09T12:00:01.000Z",
    candidateBinding: {
      candidateId: candidate.candidate.candidateId,
      candidateManifestId: candidate.candidate.candidateManifestId,
      candidateManifestInputId: "candidate_manifest" as const,
      candidateManifestSha256: candidateSha256,
      candidateManifestSizeBytes: candidateBytes.byteLength,
    },
    sealedScientificRootDirectory: "sealed/nhm2-v2/candidate-001/science",
    stagedInputs,
    scientificContentSha256:
      computeNhm2SemiclassicalV2ScientificContentSha256(stagedInputs),
    approvedReplayPolicy: {
      ...NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
    },
    metricDemandDerivationBinding: {
      inputId: "metric_demand_derivation_receipt" as const,
      sha256: sha("metric_demand_derivation_receipt"),
      artifactId:
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_ARTIFACT_ID,
      contractVersion:
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_DERIVATION_RECEIPT_CONTRACT_VERSION,
      metricDemandInputId: "metric_demand_tensor" as const,
      metricDemandSha256: sha("metric_demand_tensor"),
      errorBoundInputId: "metric_demand_absolute_error_bound" as const,
      errorBoundSha256: sha("metric_demand_absolute_error_bound"),
      enclosureMethod:
        NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_ENCLOSURE_METHOD,
      coverage: NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_ERROR_COVERAGE,
      relativeEnclosureTarget: 0.01 as const,
      verificationStatus:
        "metric_demand_derivation_executor_provenance_unverified" as const,
      blockers: [
        "metric_demand_derivation_executor_provenance_unverified",
        "interval_trace_not_server_replayed",
      ] as const,
    },
    metricDemandNondegeneracy: {
      screenId: NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_NONZERO_SCREEN_ID,
      authority:
        "server_recomputed_from_staged_metric_and_error_float64_bytes" as const,
      inputId: "metric_demand_tensor" as const,
      metricDemandSha256: sha("metric_demand_tensor"),
      errorBoundInputId: "metric_demand_absolute_error_bound" as const,
      metricDemandAbsoluteErrorBoundSha256: sha(
        "metric_demand_absolute_error_bound",
      ),
      algorithm:
        "stable_scaled_symmetric_tensor_frobenius_lower_bound_per_sample_float64_v2" as const,
      sampleCount: 64 as const,
      componentCount: 10 as const,
      valueCount: 640 as const,
      finiteValueCount: 640 as const,
      errorBoundValueCount: 640 as const,
      finiteErrorBoundValueCount: 640 as const,
      minimumMetricDemandFrobeniusSI:
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.minimumMetricDemandFrobeniusSI,
      requiredNondegenerateSampleFraction:
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.requiredMetricDemandSampleFraction,
      observedNondegenerateSampleCount: 64,
      observedNondegenerateSampleFraction: 1,
      minimumObservedSampleFrobeniusSI: 2e-12,
      maximumObservedSampleFrobeniusSI: 4e-12,
      minimumObservedSampleFrobeniusLowerBoundSI: 1.5e-12,
      maximumObservedSampleErrorBoundFrobeniusSI: 5e-13,
      maximumAllowedRelativeErrorBound: 0.01 as const,
      maximumObservedRelativeErrorBound: 0.00025,
      allSamplesWithinRelativeErrorBound: true as const,
      globalMetricDemandFrobeniusSI: 2e-11,
      allValuesFinite: true as const,
      allErrorBoundsFiniteAndNonnegative: true as const,
      allErrorBoundsStrictlyPositive: true as const,
      passesFrozenScreen: true as const,
      regionalPhysicalNondegeneracyAuthority: false as const,
    },
    runPlans: [
      {
        role: "primary" as const,
        planId: "primary-plan-001",
        scientificRootDirectory: "sealed/nhm2-v2/candidate-001/science",
        scientificRootAccess: "read_only_exact_sealed_inventory" as const,
        implementationRootDirectory: "lanes/primary/toolchain-001",
        outputDirectory: "runs/primary/candidate-001",
        counterpartOutputs: "not_mounted" as const,
        ambientRepository: "not_mounted" as const,
      },
      {
        role: "independent" as const,
        planId: "independent-plan-001",
        scientificRootDirectory: "sealed/nhm2-v2/candidate-001/science",
        scientificRootAccess: "read_only_exact_sealed_inventory" as const,
        implementationRootDirectory: "lanes/independent/toolchain-001",
        outputDirectory: "runs/independent/candidate-001",
        counterpartOutputs: "not_mounted" as const,
        ambientRepository: "not_mounted" as const,
      },
    ] as const,
    claimLocks: {
      ...NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_CLAIM_LOCKS,
    },
  };
  const sealedInventorySha256 = computeNhm2SemiclassicalV2SealedInventorySha256(
    unsigned as unknown as Omit<
      Nhm2SemiclassicalV2ScientificPresealV1,
      "sealedInventorySha256"
    >,
  );
  return {
    candidate,
    candidateBytes,
    preseal: {
      ...unsigned,
      runPlans: [...unsigned.runPlans],
      sealedInventorySha256,
    } as Nhm2SemiclassicalV2ScientificPresealV1,
  };
};

const reseal = (
  preseal: Nhm2SemiclassicalV2ScientificPresealV1,
): Nhm2SemiclassicalV2ScientificPresealV1 => {
  const { sealedInventorySha256: _old, ...unsigned } = preseal;
  return {
    ...unsigned,
    sealedInventorySha256:
      computeNhm2SemiclassicalV2SealedInventorySha256(unsigned),
  };
};

describe("NHM2 semiclassical-v2 server scientific preseal", () => {
  it("rejects the superseded v1 scientific-preseal identity", () => {
    const oldPreseal = buildFixture().preseal as unknown as {
      contractVersion: string;
    };
    oldPreseal.contractVersion = "nhm2_semiclassical_v2_scientific_preseal/v1";
    expect(
      nhm2SemiclassicalV2ScientificPresealViolations(oldPreseal),
    ).toContain("scientific_preseal_identity_invalid");
  });
  it("accepts one server-only seal and its exact external candidate bytes", () => {
    const { candidate, candidateBytes, preseal } = buildFixture();

    expect(isNhm2SemiclassicalV2ScientificPreseal(preseal)).toBe(true);
    expect(
      nhm2SemiclassicalV2ScientificPresealCandidateBindingViolations(
        preseal,
        candidate,
        candidateBytes,
      ),
    ).toEqual([]);
    expect(preseal).toMatchObject({
      authority: "server_owned",
      consumerScope: "server_only",
      candidateFrozenAt: "2026-08-09T12:00:00.000Z",
      sealedAt: "2026-08-09T12:00:01.000Z",
    });
  });

  it("makes the external candidate file the first of exactly twenty-three staged inputs", () => {
    const { candidate, candidateBytes, preseal } = buildFixture();
    expect(preseal.stagedInputs).toHaveLength(23);
    expect(preseal.stagedInputs.map((entry) => entry.inputId)).toEqual([
      "candidate_manifest",
      ...NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_NON_SELF_INPUT_IDS,
    ]);
    expect(preseal.stagedInputs[0]).toMatchObject({
      inputId: "candidate_manifest",
      sha256:
        computeNhm2SemiclassicalV2ScientificCandidateManifestExternalSha256(
          candidateBytes,
        ),
      sizeBytes: candidateBytes.byteLength,
    });
    expect(preseal.stagedInputs.slice(1)).toEqual(candidate.scientificInputs);
  });

  it("keeps scientific content root/time-independent while the sealed digest binds both", () => {
    const { preseal } = buildFixture();
    const changed = structuredClone(preseal);
    changed.sealedScientificRootDirectory =
      "sealed/nhm2-v2/candidate-001-alt/science";
    changed.sealedAt = "2026-08-09T12:00:03.000Z";
    for (const plan of changed.runPlans) {
      plan.scientificRootDirectory = changed.sealedScientificRootDirectory;
    }
    const resealed = reseal(changed);

    expect(
      computeNhm2SemiclassicalV2ScientificContentSha256(preseal.stagedInputs),
    ).toBe(
      computeNhm2SemiclassicalV2ScientificContentSha256(resealed.stagedInputs),
    );
    expect(resealed.scientificContentSha256).toBe(
      preseal.scientificContentSha256,
    );
    expect(resealed.sealedInventorySha256).not.toBe(
      preseal.sealedInventorySha256,
    );
    expect(isNhm2SemiclassicalV2ScientificPreseal(resealed)).toBe(true);
  });

  it("rejects collapsed or reversed freeze and seal chronology", () => {
    const { preseal } = buildFixture();
    preseal.sealedAt = preseal.candidateFrozenAt;
    const invalid = reseal(preseal);

    expect(nhm2SemiclassicalV2ScientificPresealViolations(invalid)).toContain(
      "freeze_seal_chronology_invalid",
    );
  });

  it("requires the approved policy hash and exact N=64 metric descriptor", () => {
    const { preseal } = buildFixture();
    const policy = preseal.stagedInputs.find(
      (entry) => entry.inputId === "tolerance_policy",
    );
    if (policy == null) throw new Error("policy fixture missing");
    policy.sha256 = sha("unapproved-policy");
    const policyInvalid = reseal(preseal);
    expect(
      nhm2SemiclassicalV2ScientificPresealViolations(policyInvalid),
    ).toContain("approved_policy_staged_input_mismatch");

    const metricFixture = buildFixture().preseal;
    const metric = metricFixture.stagedInputs.find(
      (entry) => entry.inputId === "metric_demand_tensor",
    );
    if (metric?.inputId !== "metric_demand_tensor") {
      throw new Error("metric fixture missing");
    }
    metric.descriptor.shape = [64, 9] as unknown as [64, 10];
    const metricInvalid = reseal(metricFixture);
    expect(
      nhm2SemiclassicalV2ScientificPresealViolations(metricInvalid),
    ).toContain("metric_demand_staged_descriptor_invalid:/stagedInputs/20");
  });

  it("requires server-recomputed all-64 coverage and denies regional physical authority", () => {
    const { preseal } = buildFixture();
    expect(preseal.metricDemandNondegeneracy).toMatchObject({
      authority: "server_recomputed_from_staged_metric_and_error_float64_bytes",
      sampleCount: 64,
      observedNondegenerateSampleCount: 64,
      observedNondegenerateSampleFraction: 1,
      requiredNondegenerateSampleFraction: 1,
      regionalPhysicalNondegeneracyAuthority: false,
    });

    preseal.metricDemandNondegeneracy.observedNondegenerateSampleCount = 1;
    preseal.metricDemandNondegeneracy.observedNondegenerateSampleFraction =
      1 / 64;
    const spikeOnly = reseal(preseal);
    expect(nhm2SemiclassicalV2ScientificPresealViolations(spikeOnly)).toContain(
      "metric_demand_nondegeneracy_screen_invalid",
    );
  });

  it("rejects case-insensitive staged-path and private-root aliases", () => {
    const stagedAlias = buildFixture().preseal;
    stagedAlias.stagedInputs[1].relativePath =
      stagedAlias.stagedInputs[0].relativePath.toLocaleUpperCase("en-US");
    const stagedInvalid = reseal(stagedAlias);
    expect(
      nhm2SemiclassicalV2ScientificPresealViolations(stagedInvalid),
    ).toContain("staged_input_paths_alias_case_insensitively");

    const rootAlias = buildFixture().preseal;
    rootAlias.runPlans[1].outputDirectory =
      rootAlias.runPlans[0].implementationRootDirectory.toLocaleUpperCase(
        "en-US",
      );
    const rootInvalid = reseal(rootAlias);
    expect(
      nhm2SemiclassicalV2ScientificPresealViolations(rootInvalid),
    ).toContain("run_plan_root_topology_alias_case_insensitively");
  });

  it("binds distinct primary/independent plan identities and rejects lever IDs", () => {
    const plans = buildFixture().preseal;
    plans.runPlans[1].planId =
      plans.runPlans[0].planId.toLocaleUpperCase("en-US");
    const planInvalid = reseal(plans);
    expect(
      nhm2SemiclassicalV2ScientificPresealViolations(planInvalid),
    ).toContain("run_plan_ids_alias_case_insensitively");

    const lever = buildFixture().preseal;
    lever.runPlans[0].planId = "DECLARED_LEVER_TENSOR";
    const leverInvalid = reseal(lever);
    expect(
      nhm2SemiclassicalV2ScientificPresealViolations(leverInvalid),
    ).toContain("declared_lever_identity_forbidden");
  });

  it("rejects extra keys and keeps every claim lock false", () => {
    const extra = buildFixture().preseal;
    (
      extra.metricDemandNondegeneracy as unknown as Record<string, unknown>
    ).pass = true;
    const extraInvalid = reseal(extra);
    expect(isNhm2SemiclassicalV2ScientificPreseal(extraInvalid)).toBe(false);

    const claims = buildFixture().preseal;
    expect(
      Object.values(claims.claimLocks).every((value) => value === false),
    ).toBe(true);
    (
      claims.claimLocks as unknown as Record<string, unknown>
    ).physicalViability = true;
    const claimsInvalid = reseal(claims);
    expect(
      nhm2SemiclassicalV2ScientificPresealViolations(claimsInvalid),
    ).toContain("claim_locks_not_all_false");
  });

  it("rejects mismatched external bytes or a parsed candidate shadow", () => {
    const { candidate, candidateBytes, preseal } = buildFixture();
    const changedBytes = Buffer.concat([
      candidateBytes,
      Buffer.from(" ", "utf8"),
    ]);
    expect(
      nhm2SemiclassicalV2ScientificPresealCandidateBindingViolations(
        preseal,
        candidate,
        changedBytes,
      ),
    ).toContain("candidate_manifest_external_byte_binding_mismatch");

    const shadow = structuredClone(candidate);
    shadow.candidate.selectedProfileId = "another-profile";
    expect(
      nhm2SemiclassicalV2ScientificPresealCandidateBindingViolations(
        preseal,
        shadow,
        candidateBytes,
      ),
    ).toContain("candidate_manifest_external_bytes_content_mismatch");
  });

  it("allows exact idempotent readback but rejects a different second seal", () => {
    const { preseal } = buildFixture();
    expect(
      nhm2SemiclassicalV2ScientificPresealPairViolations(
        preseal,
        structuredClone(preseal),
      ),
    ).toEqual([]);

    const second = structuredClone(preseal);
    second.sealedAt = "2026-08-09T12:00:03.000Z";
    const secondValid = reseal(second);
    expect(isNhm2SemiclassicalV2ScientificPreseal(secondValid)).toBe(true);
    expect(
      nhm2SemiclassicalV2ScientificPresealPairViolations(preseal, secondValid),
    ).toContain("deterministic_seal_key_conflict_second_seal_forbidden");
  });

  it("rejects noncanonical candidate bytes even when their parsed content matches", () => {
    const { candidate, preseal } = buildFixture();
    const prettyBytes = Buffer.from(JSON.stringify(candidate, null, 2), "utf8");
    const pretty = structuredClone(preseal);
    const digest =
      computeNhm2SemiclassicalV2ScientificCandidateManifestExternalSha256(
        prettyBytes,
      );
    pretty.candidateBinding.candidateManifestSha256 = digest;
    pretty.candidateBinding.candidateManifestSizeBytes = prettyBytes.byteLength;
    pretty.stagedInputs[0].sha256 = digest;
    pretty.stagedInputs[0].sizeBytes = prettyBytes.byteLength;
    pretty.scientificContentSha256 =
      computeNhm2SemiclassicalV2ScientificContentSha256(pretty.stagedInputs);
    const resealed = reseal(pretty);

    expect(
      nhm2SemiclassicalV2ScientificPresealCandidateBindingViolations(
        resealed,
        candidate,
        prettyBytes,
      ),
    ).toContain("candidate_manifest_external_bytes_not_canonical_json");
  });
});
