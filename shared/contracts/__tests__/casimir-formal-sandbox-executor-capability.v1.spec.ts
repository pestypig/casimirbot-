import { describe, expect, it } from "vitest";

import {
  buildCasimirFormalSandboxExecutorCapabilityV1,
  validateCasimirFormalSandboxExecutorCapabilityV1,
} from "../casimir-formal-sandbox-executor-capability.v1";

const hash = (character: string): string => character.repeat(64);

const input = () => ({
  generatedAt: "2026-07-29T00:00:00.000Z",
  capabilityId: "casimir.formal.external-sandbox.v1",
  platform: "linux",
  architecture: "x64",
  sandboxPolicySha256: hash("1"),
  enforcement: {
    operatingSystemMemoryLimitEnforced: true as const,
    operatingSystemProcessLimitEnforced: true as const,
    filesystemIsolationEnforced: true as const,
    networkIsolationEnforced: true as const,
    wallTimeoutEnforced: true as const,
    outputByteLimitEnforced: true as const,
    processTreeContainmentEnforced: true as const,
    hostWorkstationExecutionAllowed: false as const,
  },
  resourceCeilings: {
    maxMemoryBytes: 12 * 1024 * 1024 * 1024,
    maxProcessCount: 8,
    timeoutMs: 900_000,
    maxOutputBytes: 4 * 1024 * 1024,
  },
  attestation: {
    issuer: "casimir-executor-control-plane",
    evidenceSha256: hash("2"),
  },
});

describe("casimir formal sandbox executor capability", () => {
  it("binds an external, OS-isolated, nonterminal capability", async () => {
    const capability =
      await buildCasimirFormalSandboxExecutorCapabilityV1(input());
    expect(
      await validateCasimirFormalSandboxExecutorCapabilityV1(
        capability,
      ),
    ).toEqual([]);
    expect(capability).toMatchObject({
      executionTarget: "external_isolated_worker",
      enforcement: {
        operatingSystemMemoryLimitEnforced: true,
        hostWorkstationExecutionAllowed: false,
      },
      authority: {
        executesByItself: false,
        formalPropositionChecked: false,
        validatesScientificTruth: false,
        terminalEligible: false,
      },
    });
    expect(
      await validateCasimirFormalSandboxExecutorCapabilityV1({
        ...capability,
        executablePath: "C:\\untrusted\\lean.exe",
      }),
    ).toContain("capability shape is invalid");
  });

  it("rejects a self-rehashed capability that allows workstation execution", async () => {
    const base = input();
    const candidate = {
      ...base,
      enforcement: {
        ...base.enforcement,
        hostWorkstationExecutionAllowed: true,
      },
    };
    const capability =
      await buildCasimirFormalSandboxExecutorCapabilityV1(
        candidate as unknown as Parameters<
          typeof buildCasimirFormalSandboxExecutorCapabilityV1
        >[0],
      );
    expect(
      await validateCasimirFormalSandboxExecutorCapabilityV1(
        capability,
      ),
    ).toContain("sandbox enforcement is insufficient");
  });
});
