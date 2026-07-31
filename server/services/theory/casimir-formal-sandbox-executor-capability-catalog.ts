import {
  validateCasimirFormalSandboxExecutorCapabilityV1,
  type CasimirFormalSandboxExecutorCapabilityV1,
} from "../../../shared/contracts/casimir-formal-sandbox-executor-capability.v1";

// Scientific formal replay remains unavailable until trusted server
// composition installs an externally attested executor capability here.
const ENTRIES: readonly CasimirFormalSandboxExecutorCapabilityV1[] = [];

let integrityPromise: Promise<string[]> | null = null;
const integrityIssues = async (): Promise<string[]> => {
  integrityPromise ??= (async () => {
    const issues: string[] = [];
    const seen = new Set<string>();
    for (const entry of ENTRIES) {
      issues.push(
        ...(await validateCasimirFormalSandboxExecutorCapabilityV1(
          entry,
        )).map((issue) => `${entry.capabilityId}: ${issue}`),
      );
      if (seen.has(entry.capabilityId))
        issues.push(`${entry.capabilityId}: duplicate capabilityId`);
      seen.add(entry.capabilityId);
    }
    return issues;
  })();
  return integrityPromise;
};

export async function inspectCasimirFormalSandboxExecutorCapabilityCatalogV1() {
  const issues = await integrityIssues();
  return {
    schema:
      "casimir.formal_sandbox_executor_capability_catalog.v1" as const,
    configured: issues.length === 0 && ENTRIES.length > 0,
    capabilityIds:
      issues.length === 0
        ? ENTRIES.map((entry) => entry.capabilityId).sort()
        : [],
    issues,
    assistantAnswer: false as const,
    terminalEligible: false as const,
  };
}

export async function resolveCasimirFormalSandboxExecutorCapabilityV1(
  input: {
    capabilityId: string | null | undefined;
    artifactSha256?: string | null;
  },
): Promise<CasimirFormalSandboxExecutorCapabilityV1 | null> {
  if ((await integrityIssues()).length > 0) return null;
  const capabilityId = input.capabilityId?.trim();
  const artifactSha256 = input.artifactSha256?.trim() || null;
  if (!capabilityId) return null;
  return (
    ENTRIES.find(
      (entry) =>
        entry.capabilityId === capabilityId &&
        (!artifactSha256 ||
          entry.artifactSha256 === artifactSha256),
    ) ?? null
  );
}

export function resetCasimirFormalSandboxExecutorCapabilityCatalogForTestsV1(): void {
  integrityPromise = null;
}
