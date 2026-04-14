import { describe, expect, it } from "vitest";
import {
  NHM2_CERTIFICATE_POLICY_ARTIFACT_ID,
  NHM2_CERTIFICATE_POLICY_LANE_ID,
  NHM2_CERTIFICATE_POLICY_SCHEMA_VERSION,
  buildNhm2CertificatePolicyArtifact,
  isNhm2CertificatePolicyArtifact,
} from "../shared/contracts/nhm2-certificate-policy.v1";

describe("nhm2 certificate policy contract", () => {
  it("builds a serializable wrapper artifact for an admitted certificate trace", () => {
    const artifact = buildNhm2CertificatePolicyArtifact({
      generatedAt: "2026-04-12T08:28:59.625Z",
      state: "pass",
      reasonCodes: [],
      sourceTraceId: "adapter:test-trace",
      sourceRunId: "fixture-run-1",
      verdict: "PASS",
      firstFail: null,
      viabilityStatus: "ADMISSIBLE",
      hardConstraintPass: true,
      firstHardFailureId: null,
      certificateStatus: "GREEN",
      certificateHash:
        "6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45",
      certificateIntegrity: "ok",
      promotionTier: "certified",
      promotionReason: null,
      artifactRefs: [
        {
          artifactId: "casimir_repo_convergence_trace",
          path: "artifacts/training-trace.jsonl",
          contractVersion: "training_trace/v1",
          status: "pass",
        },
      ],
    });

    expect(artifact).not.toBeNull();
    expect(artifact).toMatchObject({
      artifactId: NHM2_CERTIFICATE_POLICY_ARTIFACT_ID,
      schemaVersion: NHM2_CERTIFICATE_POLICY_SCHEMA_VERSION,
      laneId: NHM2_CERTIFICATE_POLICY_LANE_ID,
      state: "pass",
      verdict: "PASS",
      viabilityStatus: "ADMISSIBLE",
      hardConstraintPass: true,
      certificateStatus: "GREEN",
      certificateIntegrity: "ok",
      promotionTier: "certified",
    });
    expect(artifact?.artifactRefs).toHaveLength(1);
    expect(isNhm2CertificatePolicyArtifact(JSON.parse(JSON.stringify(artifact)))).toBe(
      true,
    );
  });

  it("builds an unavailable wrapper artifact when the certificate source is absent", () => {
    const artifact = buildNhm2CertificatePolicyArtifact({
      generatedAt: "2026-04-12T08:28:59.625Z",
      state: "unavailable",
      reasonCodes: ["certificate_missing"],
      verdict: "UNKNOWN",
      firstFail: null,
      viabilityStatus: "UNKNOWN",
      hardConstraintPass: null,
      firstHardFailureId: null,
      certificateStatus: null,
      certificateHash: null,
      certificateIntegrity: "unavailable",
      promotionTier: null,
      promotionReason: "certificate_missing",
      artifactRefs: [],
    });

    expect(artifact).not.toBeNull();
    expect(artifact).toMatchObject({
      state: "unavailable",
      reasonCodes: ["certificate_missing"],
      verdict: "UNKNOWN",
      viabilityStatus: "UNKNOWN",
      certificateHash: null,
      certificateIntegrity: "unavailable",
      promotionTier: null,
      promotionReason: "certificate_missing",
    });
    expect(isNhm2CertificatePolicyArtifact(artifact)).toBe(true);
  });

  it("rejects invalid reason codes", () => {
    const artifact = buildNhm2CertificatePolicyArtifact({
      generatedAt: "2026-04-12T08:28:59.625Z",
      state: "review",
      reasonCodes: ["not_a_reason" as any],
      verdict: "FAIL",
      firstFail: null,
      viabilityStatus: "INADMISSIBLE",
      hardConstraintPass: false,
      firstHardFailureId: "tests_passed",
      certificateStatus: "FAIL",
      certificateHash: "deadbeef",
      certificateIntegrity: "fail",
      promotionTier: null,
      promotionReason: null,
      artifactRefs: [],
    });

    expect(artifact).not.toBeNull();
    expect(artifact?.reasonCodes).toEqual([]);
    expect(isNhm2CertificatePolicyArtifact(artifact)).toBe(true);
  });
});
