import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import trackedPolicy from "../../../configs/casimir-spec-benchmark-policy.v1.json";
import trackedRubric from "../../../configs/casimir-spec-vcr-rubric.v1.json";
import {
  CASIMIR_SPEC_BENCHMARK_DIFFICULTIES,
  CASIMIR_SPEC_BENCHMARK_DOMAINS,
  CASIMIR_SPEC_BENCHMARK_PRIMARY_STRATA,
  CASIMIR_SPEC_BENCHMARK_PUBLIC_FREEZE_SCHEMA_VERSION,
  CASIMIR_SPEC_BENCHMARK_SPLITS,
  CASIMIR_SPEC_HIDDEN_BUNDLE_COMMITMENT_DOMAIN,
  computeCasimirSpecFrozenArtifactValueHashesV1,
  type CasimirSpecBenchmarkAggregateCountsV1,
  type CasimirSpecBenchmarkFrozenArtifactRefV1,
  type CasimirSpecBenchmarkPublicFreezeV1,
} from "../casimir-spec-benchmark-case-pack.v1";
import {
  CASIMIR_SPEC_BENCHMARK_CUSTODIAN_FREEZE_RECEIPT_SCHEMA_VERSION,
  CASIMIR_SPEC_BENCHMARK_EXTERNAL_TIMESTAMP_RECEIPT_SCHEMA_VERSION,
  CASIMIR_SPEC_FROZEN_VCR_RUBRIC_AUTHORITY_V1,
  assessCasimirSpecBenchmarkFreezeReadinessV1,
  type CasimirSpecBenchmarkCustodianFreezeReceiptV1,
  type CasimirSpecBenchmarkExternalTimestampReceiptV1,
} from "../casimir-spec-benchmark-freeze-readiness.v1";
import {
  canonicalizeCasimirSpecValueV1,
  computeCasimirSpecValueSha256V1,
} from "../casimir-spec-scientific-claim-ir.v1";

const encoder = new TextEncoder();
const sha = (digit: string): string => digit.repeat(64);
const bytes = (value: unknown): Uint8Array =>
  encoder.encode(canonicalizeCasimirSpecValueV1(value));
const rawSha256 = (value: Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");

function frozenCounts(): CasimirSpecBenchmarkAggregateCountsV1 {
  const splitCount: Record<string, number> = {
    public: 66,
    development: 132,
    blinded_calibration: 132,
    confirmatory_heldout: 990,
  };
  const perCell: Record<string, number> = {
    public: 1,
    development: 2,
    blinded_calibration: 2,
    confirmatory_heldout: 15,
  };
  return {
    totalCases: 1_320,
    bySplit: CASIMIR_SPEC_BENCHMARK_SPLITS.map((id) => ({
      id,
      count: splitCount[id],
    })),
    byDomain: CASIMIR_SPEC_BENCHMARK_DOMAINS.map((id) => ({
      id,
      count: 220,
    })),
    byPrimaryStratum: CASIMIR_SPEC_BENCHMARK_PRIMARY_STRATA.map((id) => ({
      id,
      count: 120,
    })),
    byDifficulty: CASIMIR_SPEC_BENCHMARK_DIFFICULTIES.map((id) => ({
      id,
      count: 440,
    })),
    byDomainPrimaryStratumSplit: CASIMIR_SPEC_BENCHMARK_DOMAINS.flatMap(
      (domain) =>
        CASIMIR_SPEC_BENCHMARK_PRIMARY_STRATA.flatMap((primaryStratum) =>
          CASIMIR_SPEC_BENCHMARK_SPLITS.map((split) => ({
            domain,
            primaryStratum,
            split,
            count: perCell[split],
          })),
        ),
    ),
    heldoutByDomainPrimaryStratumDifficulty:
      CASIMIR_SPEC_BENCHMARK_DOMAINS.flatMap((domain) =>
        CASIMIR_SPEC_BENCHMARK_PRIMARY_STRATA.flatMap((primaryStratum) =>
          CASIMIR_SPEC_BENCHMARK_DIFFICULTIES.map((difficulty) => ({
            domain,
            primaryStratum,
            difficulty,
            count: 5,
          })),
        ),
      ),
    safetyCriticalCases: 528,
    leanEligibleCases: 990,
    lanyonEligibleCases: 198,
    falseCertificationOpportunities: 1_320,
    safetyCriticalFalseCertificationOpportunities: 528,
  };
}

function frozenPolicy(): Record<string, unknown> {
  const policy = structuredClone(trackedPolicy) as Record<string, unknown>;
  policy.status = "frozen_design_no_results";
  const freezeState = policy.freezeState as Record<string, unknown>;
  freezeState.preregistered = true;
  freezeState.frozen = true;
  freezeState.frozenAt = "2026-07-24T04:00:00.000Z";
  freezeState.policySemanticSha256 = sha("a");
  freezeState.previousPolicySemanticSha256 = null;
  freezeState.externalCommitmentSha256 = sha("b");
  freezeState.blockers = [];
  const boundary = policy.claimBoundary as Record<string, unknown>;
  boundary.preregistered = true;
  boundary.frozen = true;
  const promotion = policy.promotionCriteria as Record<string, unknown>;
  promotion.status = "blocked_until_frozen_run_results";
  return policy;
}

async function frozenRef(
  value: Record<string, unknown>,
  index: number,
): Promise<{
  ref: CasimirSpecBenchmarkFrozenArtifactRefV1;
  bytes: Uint8Array;
}> {
  const artifactBytes = bytes(value);
  const hashes = await computeCasimirSpecFrozenArtifactValueHashesV1(value);
  const artifactId = index.toString(16).padStart(32, "0");
  return {
    bytes: artifactBytes,
    ref: {
      artifactId,
      portablePath: `artifacts/casimir-spec/candidate/${artifactId}.json`,
      schemaVersion: String(value.schemaVersion),
      rawSha256: rawSha256(artifactBytes),
      sizeBytes: artifactBytes.byteLength,
      mediaType: "application/json",
      frozen: true,
      semanticSha256: hashes.semanticSha256,
      artifactSha256: hashes.artifactSha256,
    },
  };
}

type ReadyFixture = {
  publicFreeze: CasimirSpecBenchmarkPublicFreezeV1;
  policy: Record<string, unknown>;
  policyBytes: Uint8Array;
  rubric: Record<string, unknown>;
  rubricBytes: Uint8Array;
  custodian: CasimirSpecBenchmarkCustodianFreezeReceiptV1;
  timestamp: CasimirSpecBenchmarkExternalTimestampReceiptV1;
};

async function readyFixture(): Promise<ReadyFixture> {
  const policy = frozenPolicy();
  const rubric = structuredClone(
    CASIMIR_SPEC_FROZEN_VCR_RUBRIC_AUTHORITY_V1,
  ) as unknown as Record<string, unknown>;
  const policyArtifact = await frozenRef(policy, 1);
  const rubricArtifact = await frozenRef(rubric, 2);
  const genericArtifacts = await Promise.all(
    Array.from({ length: 10 }, (_, index) =>
      frozenRef(
        {
          schemaVersion: "casimir_spec_frozen_design_artifact/v1",
          artifactId: `design-artifact-${index + 3}`,
          frozen: true,
        },
        index + 3,
      ),
    ),
  );
  const [
    publicDevelopmentPackRef,
    promptBundleRef,
    toolArmManifestRef,
    modelSamplingAccountPinsRef,
    evaluatorAdjudicationRef,
    statisticsOutcomeRef,
    sourceDeliveryPolicyRef,
    scheduleDerivationRef,
    leakageAuditRef,
    calibrationAcceptanceRef,
  ] = genericArtifacts.map((entry) => entry.ref);
  const aggregateCounts = frozenCounts();
  const publicFreeze: CasimirSpecBenchmarkPublicFreezeV1 = {
    schemaVersion: CASIMIR_SPEC_BENCHMARK_PUBLIC_FREEZE_SCHEMA_VERSION,
    benchmarkId: "casimir-spec-verified-claim-resolution-v1",
    contentClass: "benchmark",
    visibility: "public_commitment_no_hidden_content",
    status: "frozen_design_no_results",
    frozenAt: "2026-07-24T04:00:00.000Z",
    designClosureRefs: {
      policyRef: policyArtifact.ref,
      publicDevelopmentPackRef,
      rubricRef: rubricArtifact.ref,
      promptBundleRef,
      toolArmManifestRef,
      modelSamplingAccountPinsRef,
      evaluatorAdjudicationRef,
      statisticsOutcomeRef,
      sourceDeliveryPolicyRef,
      scheduleDerivationRef,
      leakageAuditRef,
      calibrationAcceptanceRef,
    },
    hiddenBundleCommitment: {
      algorithm: "sha256_domain_zero_salt_semantic_artifact",
      domain: CASIMIR_SPEC_HIDDEN_BUNDLE_COMMITMENT_DOMAIN,
      commitmentSha256: sha("c"),
      saltDisclosure: "withheld_32_bytes_until_reveal",
    },
    aggregateCounts,
  };
  const publicFreezeSha256 =
    await computeCasimirSpecValueSha256V1(publicFreeze);
  const custodian: CasimirSpecBenchmarkCustodianFreezeReceiptV1 = {
    schemaVersion:
      CASIMIR_SPEC_BENCHMARK_CUSTODIAN_FREEZE_RECEIPT_SCHEMA_VERSION,
    receiptId: "custodian-receipt-001",
    receiptArtifactSha256: sha("d"),
    benchmarkId: publicFreeze.benchmarkId,
    publicFreezeSha256,
    hiddenBundleCommitmentSha256:
      publicFreeze.hiddenBundleCommitment.commitmentSha256,
    aggregateCountsSha256:
      await computeCasimirSpecValueSha256V1(aggregateCounts),
    validatorImplementationId: "casimir-spec-bundle-validator-v1",
    validatorRevisionSha256: sha("e"),
    validationContract: "validateCasimirSpecBenchmarkBundleV1",
    bundleValidation: "passed",
    calibrationAcceptance: "passed",
    validatedAt: "2026-07-24T04:01:00.000Z",
    candidateDeveloperDisclosure: "public_freeze_only",
    hiddenContentDisclosure: "withheld_from_candidate_developers",
    independentCustodian: true,
  };
  const timestamp: CasimirSpecBenchmarkExternalTimestampReceiptV1 = {
    schemaVersion:
      CASIMIR_SPEC_BENCHMARK_EXTERNAL_TIMESTAMP_RECEIPT_SCHEMA_VERSION,
    receiptId: "timestamp-receipt-001",
    receiptArtifactSha256: sha("f"),
    providerId: "external-rfc3161-provider",
    method: "rfc3161",
    subjectKind: "casimir_spec_benchmark_public_freeze_sha256",
    subjectSha256: publicFreezeSha256,
    timestampedAt: "2026-07-24T04:02:00.000Z",
    verificationStatus: "verified",
    verifierId: "external-timestamp-verifier",
    verifierVersion: "1.0.0",
    verifierKeyRegistrySha256: sha("1"),
    verifiedAt: "2026-07-24T04:03:00.000Z",
    independentOfCandidateSystem: true,
  };
  return {
    publicFreeze,
    policy,
    policyBytes: policyArtifact.bytes,
    rubric,
    rubricBytes: rubricArtifact.bytes,
    custodian,
    timestamp,
  };
}

async function assess(fixture: ReadyFixture) {
  return assessCasimirSpecBenchmarkFreezeReadinessV1({
    publicFreezeValue: fixture.publicFreeze,
    policyValue: fixture.policy,
    policyBytes: fixture.policyBytes,
    rubricValue: fixture.rubric,
    rubricBytes: fixture.rubricBytes,
    custodianReceiptValue: fixture.custodian,
    externalTimestampReceiptValue: fixture.timestamp,
    assessedAt: "2026-07-24T04:04:00.000Z",
  });
}

describe("casimir_spec_benchmark_freeze_readiness/v1", () => {
  it("admits parser development only after every frozen evidence layer closes", async () => {
    const result = await assess(await readyFixture());

    expect(result.status).toBe("ready_for_parser_development");
    expect(result.parserDevelopmentAllowed).toBe(true);
    expect(result.modelPromptTuningAllowed).toBe(true);
    expect(result.blockers).toEqual([]);
    expect(Object.values(result.evidence).every(Boolean)).toBe(true);
    expect(result.claimBoundary).toEqual({
      benchmarkResult: false,
      preregistrationAuthority: false,
      scientificAuthority: false,
      assistantAnswer: false,
      terminalEligible: false,
      postToolModelStepRequired: true,
    });
  });

  it("keeps the currently tracked draft policy and rubric blocked", async () => {
    const fixture = await readyFixture();
    fixture.policy = structuredClone(trackedPolicy) as Record<string, unknown>;
    fixture.rubric = structuredClone(trackedRubric) as Record<string, unknown>;
    const result = await assess(fixture);

    expect(result.status).toBe("blocked");
    expect(result.parserDevelopmentAllowed).toBe(false);
    expect(result.blockers.map((entry) => entry.code)).toEqual(
      expect.arrayContaining([
        "policy_not_frozen",
        "rubric_not_frozen_authority",
        "artifact_value_bytes_mismatch",
      ]),
    );
  });

  it("fails closed on custodian commitment substitution", async () => {
    const fixture = await readyFixture();
    fixture.custodian.hiddenBundleCommitmentSha256 = sha("0");
    const result = await assess(fixture);

    expect(result.status).toBe("blocked");
    expect(result.evidence.custodianReceiptValidated).toBe(false);
    expect(result.blockers.map((entry) => entry.code)).toContain(
      "custodian_hidden_commitment_mismatch",
    );
  });

  it("rejects non-canonical policy bytes even when they parse to the same value", async () => {
    const fixture = await readyFixture();
    fixture.policyBytes = encoder.encode(
      JSON.stringify(fixture.policy, null, 2),
    );
    const result = await assess(fixture);

    expect(result.status).toBe("blocked");
    expect(result.evidence.policyArtifactValidated).toBe(false);
    expect(result.blockers.map((entry) => entry.code)).toContain(
      "artifact_json_not_canonical",
    );
  });

  it("fails closed on timestamp substitution or claimed non-independence", async () => {
    const fixture = await readyFixture();
    fixture.timestamp.subjectSha256 = sha("0");
    fixture.timestamp.independentOfCandidateSystem = false as true;
    const result = await assess(fixture);

    expect(result.status).toBe("blocked");
    expect(result.evidence.externalTimestampReceiptValidated).toBe(false);
    expect(result.blockers.map((entry) => entry.code)).toEqual(
      expect.arrayContaining([
        "timestamp_independence_invalid",
        "external_timestamp_subject_mismatch",
      ]),
    );
  });

  it("fails closed when aggregate quotas are structurally valid but underpowered", async () => {
    const fixture = await readyFixture();
    fixture.publicFreeze.aggregateCounts.totalCases = 1_319;
    const result = await assess(fixture);

    expect(result.status).toBe("blocked");
    expect(result.evidence.designQuotasValidated).toBe(false);
    expect(result.blockers.map((entry) => entry.code)).toContain(
      "freeze_count_invalid",
    );
  });
});
