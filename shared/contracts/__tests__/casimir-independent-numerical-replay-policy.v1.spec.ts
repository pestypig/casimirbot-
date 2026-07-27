import { describe, expect, it } from "vitest";

import {
  buildCasimirIndependentNumericalReplayPolicyV1,
  validateCasimirIndependentNumericalReplayPolicyIntegrityV1,
} from "../casimir-independent-numerical-replay-policy.v1";

const sha = (character: string): string => character.repeat(64);

const buildPolicy = () =>
  buildCasimirIndependentNumericalReplayPolicyV1({
    generatedAt: "2026-07-25T00:00:00.000Z",
    policyId: "advection-diffusion-independent-replay/v1",
    harness: {
      protocol: "casimir_numerical_harness_json_files/v1",
      launchMode: "node_script",
      executableSha256: sha("a"),
      sourceSha256: sha("b"),
    },
    lanes: {
      primary: {
        implementationId: "lanyon-c",
        lineageId: "lanyon",
        sourceSha256: sha("c"),
        buildManifestSha256: sha("d"),
        executableSha256: sha("e"),
        environment: {
          environmentId: "clang-pinned",
          toolchainSha256: sha("f"),
          runtimeSha256: sha("1"),
          platformSha256: sha("2"),
        },
      },
      independent: {
        implementationId: "casimir-reference",
        lineageId: "casimir",
        sourceSha256: sha("3"),
        buildManifestSha256: sha("4"),
        executableSha256: sha("5"),
        environment: {
          environmentId: "node-pinned",
          toolchainSha256: sha("6"),
          runtimeSha256: sha("7"),
          platformSha256: sha("8"),
        },
      },
    },
    execution: {
      replayCount: 2,
      networkAllowed: false,
      arbitraryCommandAllowed: false,
      outerObservedProcessRequired: true,
      timeoutMs: 30_000,
      maxOutputBytes: 1_048_576,
      maximumRefinementLevels: 8,
    },
  });

describe("casimir independent numerical replay policy v1", () => {
  it("builds an integrity-valid, authority-bounded policy", async () => {
    const policy = await buildPolicy();
    expect(
      await validateCasimirIndependentNumericalReplayPolicyIntegrityV1(policy),
    ).toEqual([]);
    expect(policy.execution).toMatchObject({
      replayCount: 2,
      networkAllowed: false,
      arbitraryCommandAllowed: false,
      outerObservedProcessRequired: true,
    });
    expect(policy.authority).toMatchObject({
      numericalAuthority: false,
      terminalEligible: false,
      promotionAllowed: false,
    });
  });

  it("rejects policy mutation", async () => {
    const policy = await buildPolicy();
    const mutated = {
      ...policy,
      execution: { ...policy.execution, timeoutMs: 30_001 },
    };
    expect(
      await validateCasimirIndependentNumericalReplayPolicyIntegrityV1(mutated),
    ).toContain("artifactSha256 does not match replay policy content");
  });

  it("rejects identical numerical lineages", async () => {
    const policy = await buildPolicy();
    const invalid = {
      ...policy,
      lanes: {
        ...policy.lanes,
        independent: {
          ...policy.lanes.independent,
          lineageId: policy.lanes.primary.lineageId,
        },
      },
    };
    expect(
      await validateCasimirIndependentNumericalReplayPolicyIntegrityV1(invalid),
    ).toContain("lanes.independent.lineageId: lineage IDs must be distinct");
  });
});
