import { describe, expect, it } from "vitest";
import {
  buildCasimirFormalLeanReplayPolicyV1,
  validateCasimirFormalLeanReplayPolicyIntegrityV1,
  validateCasimirFormalLeanReplayPolicyV1,
} from "../casimir-formal-lean-replay-policy.v1";

const hash = (digit: string): string => digit.repeat(64);

async function policy() {
  return buildCasimirFormalLeanReplayPolicyV1({
    policyId: "casimir-lean-policy-v1",
    pinnedVersion: "4.31.0",
    kernelBinarySha256: hash("a"),
    allowedImportModules: ["Init", "Std"],
    resourceCeilings: {
      timeoutMs: 120_000,
      maxMemoryBytes: 1_073_741_824,
      maxOutputBytes: 1_048_576,
      maxSourceBytes: 1_048_576,
      maxImportCount: 64,
    },
  });
}

describe("casimir_formal_lean_replay_policy/v1", () => {
  it("builds a hash-bound fixed-command policy with no broader authority", async () => {
    const value = await policy();

    expect(validateCasimirFormalLeanReplayPolicyV1(value)).toEqual([]);
    expect(
      await validateCasimirFormalLeanReplayPolicyIntegrityV1(value),
    ).toEqual([]);
    expect(value.fixedInvocation).toEqual({
      directExecutableOnly: true,
      shellAllowed: false,
      argumentsPrefix: ["--trust=0", "--threads=1"],
      wrapperFileName: "CasimirReplay.lean",
      replayCount: 2,
    });
    expect(value.authority).toMatchObject({
      replayPolicyOnly: true,
      executesTools: false,
      formalAuthority: false,
      numericalAuthority: false,
      empiricalAuthority: false,
      physicalAuthority: false,
      assistantAnswer: false,
      terminalEligible: false,
      promotionAllowed: false,
    });
  });

  it("detects policy content substitution", async () => {
    const value = await policy();
    value.kernelBinarySha256 = hash("b");

    expect(
      await validateCasimirFormalLeanReplayPolicyIntegrityV1(value),
    ).toContain("artifactSha256 does not match replay policy content");
  });

  it("rejects shell, inherited-environment, and source-admission weakening", async () => {
    const value = await policy();
    value.fixedInvocation.shellAllowed = true as false;
    value.isolation.inheritedEnvironmentAllowed = true as false;
    value.sourceAdmission.forbiddenTokens = ["sorry"];

    expect(validateCasimirFormalLeanReplayPolicyV1(value)).toEqual(
      expect.arrayContaining([
        "fixedInvocation.shellAllowed must be false",
        "isolation.inheritedEnvironmentAllowed must be false",
        "sourceAdmission.forbiddenTokens must match v1 authority",
      ]),
    );
  });
});
