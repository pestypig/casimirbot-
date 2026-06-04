import type {
  TheoryEvidenceObservation,
  TheoryToolKind,
} from "../../../../shared/helix-theory-congruence-trace";
import type { TheoryContextExplanationPlanV1 } from "../../../../shared/contracts/theory-context-explanation-plan.v1";
import type { TheoryContextReflectionV1 } from "../../../../shared/contracts/theory-context-reflection.v1";

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function observation(args: {
  id: string;
  lane: TheoryEvidenceObservation["lane"];
  status: TheoryEvidenceObservation["status"];
  sourceRefs: string[];
  compactSummary: string;
  missingRequirements?: string[];
  suggestedNextTools?: TheoryToolKind[];
}): TheoryEvidenceObservation {
  return {
    id: args.id,
    lane: args.lane,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    status: args.status,
    source_refs: unique(args.sourceRefs),
    compact_summary: args.compactSummary,
    missing_requirements: args.missingRequirements ?? [],
    suggested_next_tools: args.suggestedNextTools ?? [],
  };
}

export function buildTheoryGraphObservation(args: {
  turnId: string;
  reflection: TheoryContextReflectionV1;
}): TheoryEvidenceObservation {
  const badgeIds = unique([
    ...args.reflection.exactMatches.map((match) => match.badgeId),
    ...args.reflection.likelyMatches.map((match) => match.badgeId),
  ]);
  return observation({
    id: `theory-graph:${args.turnId}`,
    lane: "theory_badge_graph",
    status: badgeIds.length > 0 ? "ok" : "missing",
    sourceRefs: badgeIds.map((id) => `theory-badge:${id}`),
    compactSummary: badgeIds.length > 0
      ? `Matched ${badgeIds.length} theory badge(s) for Ask context.`
      : "No theory badge match was available for this prompt.",
    missingRequirements: badgeIds.length > 0 ? [] : ["theory_badge_match"],
    suggestedNextTools: badgeIds.length > 0 ? ["physics_atlas", "calculator_loadout"] : ["repo_search"],
  });
}

export function buildPhysicsAtlasObservation(args: {
  turnId: string;
  reflection: TheoryContextReflectionV1;
}): TheoryEvidenceObservation {
  const atlasIds = unique(args.reflection.inferredDomains.map((domain) => domain.atlasBlockId));
  return observation({
    id: `physics-atlas:${args.turnId}`,
    lane: "physics_atlas",
    status: atlasIds.length > 0 ? "ok" : "missing",
    sourceRefs: atlasIds.map((id) => `physics-atlas:${id}`),
    compactSummary: atlasIds.length > 0
      ? `Inferred atlas block(s): ${atlasIds.join(", ")}.`
      : "No physics atlas block was inferred.",
    missingRequirements: atlasIds.length > 0 ? [] : ["physics_atlas_domain"],
    suggestedNextTools: atlasIds.length > 0 ? ["repo_search"] : ["theory_badge_graph"],
  });
}

export function buildCalculatorObservation(args: {
  turnId: string;
  explanationPlan: TheoryContextExplanationPlanV1 | null;
}): TheoryEvidenceObservation {
  const scalarRows = args.explanationPlan?.scalarCutBadgeIds ?? [];
  return observation({
    id: `calculator-loadout:${args.turnId}`,
    lane: "calculator_loadout",
    status: scalarRows.length > 0 ? "ok" : "missing",
    sourceRefs: scalarRows.map((id) => `theory-calculator-row:${id}`),
    compactSummary: scalarRows.length > 0
      ? `Found ${scalarRows.length} calculator-loadable badge row(s).`
      : "No calculator-loadable rows were found in the selected theory path.",
    missingRequirements: scalarRows.length > 0 ? [] : ["scalar_calculator_payload"],
    suggestedNextTools: scalarRows.length > 0 ? [] : ["theory_badge_graph"],
  });
}

export function buildRepoSourceObservation(args: {
  turnId: string;
  explanationPlan: TheoryContextExplanationPlanV1 | null;
}): TheoryEvidenceObservation {
  const sourceRefs = unique(
    [
      ...(args.explanationPlan?.firstPrincipleRoots ?? []),
      ...(args.explanationPlan?.branchNodes ?? []),
      ...(args.explanationPlan?.diagnosticNodes ?? []),
      ...(args.explanationPlan?.runtimeNodes ?? []),
      ...(args.explanationPlan?.claimBoundaryNodes ?? []),
    ].flatMap((node) => node.sourceRefs.map((ref) => ref.path ?? ref.id ?? "")),
  );
  return observation({
    id: `repo-sources:${args.turnId}`,
    lane: "repo_search",
    status: sourceRefs.length > 0 ? "ok" : "missing",
    sourceRefs,
    compactSummary: sourceRefs.length > 0
      ? `Collected ${sourceRefs.length} repo/doc source ref(s) from selected theory nodes.`
      : "No repo/doc source refs were available in the selected theory nodes.",
    missingRequirements: sourceRefs.length > 0 ? [] : ["repo_or_doc_source_ref"],
    suggestedNextTools: sourceRefs.length > 0 ? [] : ["repo_search"],
  });
}

export function buildForbiddenClaimObservation(args: {
  turnId: string;
  status: "pass" | "fail";
  forbiddenTermsFound: string[];
}): TheoryEvidenceObservation {
  return observation({
    id: `forbidden-claim-scan:${args.turnId}`,
    lane: "forbidden_claim_scan",
    status: args.status === "pass" ? "ok" : "failed",
    sourceRefs: [],
    compactSummary: args.status === "pass"
      ? "Forbidden claim scan passed."
      : `Forbidden claim scan found: ${args.forbiddenTermsFound.join(", ")}.`,
    missingRequirements: args.status === "pass" ? [] : ["repair_forbidden_claims"],
    suggestedNextTools: args.status === "pass" ? [] : ["forbidden_claim_scan"],
  });
}
