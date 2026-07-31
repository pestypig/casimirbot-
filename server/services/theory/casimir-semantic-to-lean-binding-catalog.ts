import {
  validateCasimirSemanticToLeanBindingV1,
  type CasimirSemanticToLeanBindingV1,
} from "../../../shared/contracts/casimir-semantic-to-lean-binding.v1";
import { buildAdvectionDiffusionZeroGradientLeanBindingV1 } from "../../../shared/scientific-evidence/advection-diffusion-zero-gradient-lean-binding";

// Production registration is intentionally additive and server-owned. A binding
// must point to a real Casimir Spec claim, audited theorem, observed Lean type,
// and independent review artifact before it can be added here.
const buildRegisteredBindings = async (): Promise<
  readonly CasimirSemanticToLeanBindingV1[]
> => [
  (await buildAdvectionDiffusionZeroGradientLeanBindingV1()).binding,
];

let integrityPromise: Promise<{
  bindings: readonly CasimirSemanticToLeanBindingV1[];
  issues: string[];
}> | null = null;

const inspectIntegrity = async (): Promise<{
  bindings: readonly CasimirSemanticToLeanBindingV1[];
  issues: string[];
}> => {
  if (integrityPromise) return integrityPromise;
  integrityPromise = (async () => {
    const bindings = await buildRegisteredBindings();
    const issues: string[] = [];
    const seen = new Set<string>();
    for (const binding of bindings) {
      const bindingIssues =
        await validateCasimirSemanticToLeanBindingV1(binding);
      issues.push(
        ...bindingIssues.map((issue) => `${binding.bindingId}: ${issue}`),
      );
      if (binding.status !== "reviewed")
        issues.push(`${binding.bindingId}: production binding is not reviewed`);
      if (seen.has(binding.bindingId))
        issues.push(`${binding.bindingId}: duplicate bindingId`);
      seen.add(binding.bindingId);
    }
    return { bindings, issues };
  })();
  return integrityPromise;
};

export async function inspectCasimirSemanticToLeanBindingCatalogV1() {
  const { bindings, issues } = await inspectIntegrity();
  return {
    schema: "casimir.semantic_to_lean_binding_catalog.v1" as const,
    configured: issues.length === 0 && bindings.length > 0,
    registeredBindingCount:
      issues.length === 0 ? bindings.length : 0,
    bindingIds:
      issues.length === 0
        ? bindings.map((entry) => entry.bindingId).sort()
        : [],
    issues,
    authority: {
      semanticBindingRegistrationAuthority: true,
      formalPropositionChecked: false,
      scientificAuthority: false,
      assistantAnswer: false,
      terminalEligible: false,
    },
  };
}

export async function resolveCasimirSemanticToLeanBindingCatalogEntryV1(
  input: {
    bindingId: string | null | undefined;
    artifactSha256: string | null | undefined;
    claimId: string | null | undefined;
    semanticPropositionSha256: string | null | undefined;
    formalArtifactId: string | null | undefined;
    observedTheoremTypeSha256: string | null | undefined;
  },
): Promise<CasimirSemanticToLeanBindingV1 | null> {
  const { bindings, issues } = await inspectIntegrity();
  if (issues.length > 0) return null;
  const exact = Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, value?.trim() || null]),
  ) as Record<keyof typeof input, string | null>;
  if (Object.values(exact).some((value) => value === null)) return null;
  return (
    bindings.find(
      (binding) =>
        binding.status === "reviewed" &&
        binding.bindingId === exact.bindingId &&
        binding.artifactSha256 === exact.artifactSha256 &&
        binding.semanticClaim.claimId === exact.claimId &&
        binding.semanticClaim.propositionSha256 ===
          exact.semanticPropositionSha256 &&
        binding.formalArtifact.formalArtifactId ===
          exact.formalArtifactId &&
        binding.formalArtifact.observedTheoremTypeSha256 ===
          exact.observedTheoremTypeSha256,
    ) ?? null
  );
}

export function resetCasimirSemanticToLeanBindingCatalogForTestsV1(): void {
  integrityPromise = null;
}
