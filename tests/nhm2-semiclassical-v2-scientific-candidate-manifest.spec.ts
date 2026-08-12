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
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_CLAIM_LOCKS,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_KIND,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_PHASE,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_NON_SELF_INPUT_IDS,
  computeNhm2SemiclassicalV2ScientificCandidateManifestExternalSha256,
  isNhm2SemiclassicalV2ScientificCandidateManifest,
  nhm2SemiclassicalV2ScientificCandidateManifestViolations,
  type Nhm2SemiclassicalV2ScientificCandidateManifestV1,
} from "../shared/contracts/nhm2-semiclassical-v2-scientific-candidate-manifest.v1";
import { NHM2_SEMICLASSICAL_TENSOR_COMPONENTS } from "../shared/contracts/nhm2-semiclassical-state-realizability.v1";

const sha = (value: string): string =>
  createHash("sha256").update(value, "utf8").digest("hex");

const scientificObjectIds: Record<string, string> = {
  geometry: "geometry-frozen-001",
  quantum_state: "quantum-state-frozen-001",
  chart: "chart-frozen-001",
  normalization: "normalization-frozen-001",
  smearing_definition: "smearing-frozen-001",
  sampling_basis: "sampling-basis-frozen-001",
};

const candidateManifest =
  (): Nhm2SemiclassicalV2ScientificCandidateManifestV1 => {
    const scientificInputs =
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
              scientificObjectId:
                scientificObjectIds[inputId] ?? `${inputId}-frozen-001`,
            },
          };
        },
      );
    return {
      artifactId:
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_ARTIFACT_ID,
      contractVersion:
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_CONTRACT_VERSION,
      phase: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_PHASE,
      candidateFrozenAt: "2026-08-09T12:00:00.000Z",
      candidate: {
        candidateId: "nhm2-v2-candidate-001",
        candidateManifestId: "nhm2-v2-candidate-manifest-001",
        selectedProfileId: "nhm2-nondegenerate-profile-001",
        candidateKind: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_KIND,
        geometryId: scientificObjectIds.geometry,
        quantumStateId: scientificObjectIds.quantum_state,
        chartId: scientificObjectIds.chart,
        normalizationId: scientificObjectIds.normalization,
        tolerancePolicyId: NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID,
        smearingFunctionId: scientificObjectIds.smearing_definition,
        samplingBasisId: scientificObjectIds.sampling_basis,
        nondegeneracyCriterionId:
          NHM2_SEMICLASSICAL_V2_METRIC_DEMAND_NONDEGENERACY_CRITERION_ID,
        metricDemandInputId: "metric_demand_tensor",
        metricDemandErrorBoundInputId: "metric_demand_absolute_error_bound",
        metricDemandDerivationWitnessInputId:
          "metric_demand_derivation_receipt",
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
        scientificInputs as Nhm2SemiclassicalV2ScientificCandidateManifestV1["scientificInputs"],
      claimLocks: { ...NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_CLAIM_LOCKS },
    };
  };

describe("NHM2 semiclassical-v2 scientific candidate manifest", () => {
  it("rejects the superseded v1 candidate and approved-policy identities", () => {
    const oldCandidate = candidateManifest() as unknown as {
      contractVersion: string;
    };
    oldCandidate.contractVersion =
      "nhm2_semiclassical_v2_scientific_candidate_manifest/v1";
    expect(
      nhm2SemiclassicalV2ScientificCandidateManifestViolations(oldCandidate),
    ).toContain("candidate_manifest_identity_or_time_invalid");

    const oldPolicy = candidateManifest() as unknown as {
      scientificInputs: Array<{
        inputId: string;
        descriptor: { contractVersion?: string };
      }>;
    };
    const policy = oldPolicy.scientificInputs.find(
      (entry) => entry.inputId === "tolerance_policy",
    );
    if (policy == null) throw new Error("Policy fixture missing.");
    policy.descriptor.contractVersion =
      "nhm2_semiclassical_v2_approved_replay_policy/v1";
    expect(
      nhm2SemiclassicalV2ScientificCandidateManifestViolations(oldPolicy),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining("approved_policy_binding_invalid:"),
      ]),
    );
  });
  it("accepts exactly the ordered twenty-two non-self scientific inputs", () => {
    const manifest = candidateManifest();

    expect(manifest.scientificInputs.map((entry) => entry.inputId)).toEqual(
      NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_NON_SELF_INPUT_IDS,
    );
    expect(manifest.scientificInputs).toHaveLength(22);
    expect(
      manifest.scientificInputs.some(
        (entry) => entry.inputId === ("candidate_manifest" as never),
      ),
    ).toBe(false);
    expect(
      nhm2SemiclassicalV2ScientificCandidateManifestViolations(manifest),
    ).toEqual([]);
    expect(isNhm2SemiclassicalV2ScientificCandidateManifest(manifest)).toBe(
      true,
    );
  });

  it("is output-free and rejects operational or unknown shadow fields", () => {
    const manifest = candidateManifest() as unknown as Record<string, unknown>;
    expect(manifest).not.toHaveProperty("request");
    expect(manifest).not.toHaveProperty("receipt");
    expect(manifest).not.toHaveProperty("execution");
    expect(manifest).not.toHaveProperty("implementation");
    expect(manifest).not.toHaveProperty("outputs");

    manifest.outputManifestSha256 = sha("future-output");
    expect(
      nhm2SemiclassicalV2ScientificCandidateManifestViolations(manifest),
    ).toContain("candidate_manifest_contains_operational_fields");
    expect(isNhm2SemiclassicalV2ScientificCandidateManifest(manifest)).toBe(
      false,
    );

    const nested = candidateManifest();
    (nested.candidate as unknown as Record<string, unknown>).receiptId =
      "future";
    expect(isNhm2SemiclassicalV2ScientificCandidateManifest(nested)).toBe(
      false,
    );
  });

  it("rejects self insertion, reordering, omission, and extra input keys", () => {
    const reordered = candidateManifest();
    [reordered.scientificInputs[0], reordered.scientificInputs[1]] = [
      reordered.scientificInputs[1],
      reordered.scientificInputs[0],
    ];
    expect(isNhm2SemiclassicalV2ScientificCandidateManifest(reordered)).toBe(
      false,
    );

    const omitted = candidateManifest();
    omitted.scientificInputs.pop();
    expect(
      nhm2SemiclassicalV2ScientificCandidateManifestViolations(omitted),
    ).toContain("scientific_input_count_invalid");

    const extraKey = candidateManifest();
    (
      extraKey.scientificInputs[0] as unknown as Record<string, unknown>
    ).freshness = "new";
    expect(isNhm2SemiclassicalV2ScientificCandidateManifest(extraKey)).toBe(
      false,
    );
  });

  it("binds the approved server policy and exact N=64 metric descriptor", () => {
    const manifest = candidateManifest();
    const policy = manifest.scientificInputs.find(
      (entry) => entry.inputId === "tolerance_policy",
    );
    const metric = manifest.scientificInputs.find(
      (entry) => entry.inputId === "metric_demand_tensor",
    );

    expect(policy).toMatchObject({
      sha256: NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.sha256,
      sizeBytes:
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.sizeBytes,
    });
    expect(metric?.descriptor).toMatchObject({
      shape: [64, 10],
      dtype: "float64",
      endianness: "little",
    });

    if (metric?.inputId !== "metric_demand_tensor") {
      throw new Error("metric fixture missing");
    }
    metric.descriptor.shape = [63, 10] as unknown as [64, 10];
    expect(
      nhm2SemiclassicalV2ScientificCandidateManifestViolations(manifest),
    ).toContain("metric_demand_descriptor_invalid:/scientificInputs/19");
  });

  it("freezes the all-64 nonzero coverage criterion instead of a max-only spike", () => {
    const manifest = candidateManifest();
    expect(manifest.candidate).toMatchObject({
      sampleCount: 64,
      requiredNondegenerateSampleFraction: 1,
      minimumMetricDemandFrobeniusSI:
        NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY.minimumMetricDemandFrobeniusSI,
    });

    manifest.candidate.requiredNondegenerateSampleFraction = 1 / 64;
    expect(
      nhm2SemiclassicalV2ScientificCandidateManifestViolations(manifest),
    ).toContain("candidate_binding_invalid");
  });

  it("rejects declared-lever identities and case-insensitive path aliases", () => {
    const lever = candidateManifest();
    lever.candidate.selectedProfileId =
      "candidate_declared_tile_effective_tensor_lever_model";
    expect(
      nhm2SemiclassicalV2ScientificCandidateManifestViolations(lever),
    ).toContain("declared_lever_identity_forbidden");

    const aliases = candidateManifest();
    aliases.scientificInputs[1].relativePath =
      aliases.scientificInputs[0].relativePath.toLocaleUpperCase("en-US");
    expect(
      nhm2SemiclassicalV2ScientificCandidateManifestViolations(aliases),
    ).toContain("scientific_input_paths_alias_case_insensitively");
  });

  it("keeps every diagnostic, graph, physical, propulsion, and transport lock false", () => {
    const manifest = candidateManifest();
    expect(
      Object.values(manifest.claimLocks).every((value) => value === false),
    ).toBe(true);

    (
      manifest.claimLocks as unknown as Record<string, unknown>
    ).physicalViability = true;
    expect(
      nhm2SemiclassicalV2ScientificCandidateManifestViolations(manifest),
    ).toContain("claim_locks_not_all_false");
  });

  it("hashes exact external bytes without placing a self hash in the manifest", () => {
    const manifest = candidateManifest();
    const bytes = Buffer.from(JSON.stringify(manifest), "utf8");

    expect(
      computeNhm2SemiclassicalV2ScientificCandidateManifestExternalSha256(
        bytes,
      ),
    ).toBe(createHash("sha256").update(bytes).digest("hex"));
    expect(JSON.stringify(manifest)).not.toContain(
      computeNhm2SemiclassicalV2ScientificCandidateManifestExternalSha256(
        bytes,
      ),
    );
  });
});
