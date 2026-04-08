import { describe, expect, it } from "vitest";
import {
  buildNhm2EnvelopePerturbationArtifact,
  isNhm2EnvelopePerturbationArtifact,
} from "../shared/contracts/nhm2-envelope-perturbation-suite.v1";

describe("nhm2 envelope perturbation contract", () => {
  it("represents incomplete evidence honestly without synthetic success", () => {
    const artifact = buildNhm2EnvelopePerturbationArtifact({
      generatedOn: "2026-04-07",
      publicationCommand: "npm run warp:full-solve:nhm2-shift-lapse:publish-envelope-suite",
      suites: [
        {
          suiteId: "resolution_sensitivity",
          referenceCaseId: "resolution_096",
          cases: [
            {
              caseId: "resolution_096",
              label: "96^3 reference brick",
              suiteId: "resolution_sensitivity",
              axis: "resolution",
              provenance: "direct_gr_perturbation",
              transport: {
                transportCertificationStatus:
                  "bounded_transport_proof_bearing_gate_admitted",
              },
              lowExpansion: { status: "pass" },
              wallSafety: { status: "pass" },
              solverHealth: { status: null },
              missionTime: { source: "missing" },
            },
          ],
        },
      ],
    });

    expect(artifact.status).toBe("unavailable");
    expect(artifact.completeness).toBe("incomplete");
    expect(artifact.summary.incompleteCaseIds).toEqual(["resolution_096"]);
    expect(artifact.summary.statusCounts.unavailable).toBe(1);
    expect(isNhm2EnvelopePerturbationArtifact(artifact)).toBe(true);
  });

  it("preserves negative perturbation cases as explicit failures", () => {
    const artifact = buildNhm2EnvelopePerturbationArtifact({
      generatedOn: "2026-04-07",
      suites: [
        {
          suiteId: "boundary_condition_sensitivity",
          referenceCaseId: "boundary_clamp",
          cases: [
            {
              caseId: "boundary_outflow",
              label: "Outflow boundary",
              suiteId: "boundary_condition_sensitivity",
              axis: "boundary_condition",
              provenance: "direct_gr_perturbation",
              transport: {
                transportCertificationStatus:
                  "bounded_transport_fail_closed_reference_only",
              },
              lowExpansion: { status: "fail" },
              wallSafety: { status: "fail" },
              solverHealth: { status: "UNSTABLE" },
              missionTime: { source: "live_pipeline_contracts" },
            },
          ],
        },
      ],
    });

    expect(artifact.status).toBe("fail");
    expect(artifact.summary.negativeCaseIds).toEqual(["boundary_outflow"]);
    expect(artifact.suites[0]?.cases[0]?.reasonCodes).toContain(
      "negative_result_preserved",
    );
    expect(isNhm2EnvelopePerturbationArtifact(artifact)).toBe(true);
  });

  it("rejects malformed artifacts", () => {
    expect(
      isNhm2EnvelopePerturbationArtifact({
        artifactId: "nhm2_envelope_perturbation_suite",
        schemaVersion: "nhm2_envelope_perturbation_suite/v1",
        suites: [{ suiteId: "resolution_sensitivity" }],
      }),
    ).toBe(false);
  });
});
