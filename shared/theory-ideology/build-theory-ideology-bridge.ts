import type { TheoryContextReflectionV1 } from "../contracts/theory-context-reflection.v1";
import type { IdeologyContextReflectionV1 } from "../ideology-context-reflection";
import {
  buildTheoryIdeologyBridgeV1,
  type TheoryIdeologyBridgeLinkV1,
  type TheoryIdeologyBridgeRecommendedActionV1,
} from "../contracts/theory-ideology-bridge.v1";
import { BRIDGE_MAPPINGS, type TheoryIdeologyBridgeMapping } from "./bridge-mappings";

// TheoryIdeologyBridge is an evidence-only bridge. It may relate observable
// constraints, mathematical structure, and declared/lived context to procedural
// justice lenses. It must not claim that physics proves morality, that a person
// is morally approved or failed, or that any action has execution permission.
// Analogy links must remain analogy_only unless both graph receipts supply
// direct evidence for a stronger procedural relation.
export type BuildTheoryIdeologyBridgeInput = {
  prompt: string;
  theoryReflection?: TheoryContextReflectionV1 | null;
  ideologyReflection: IdeologyContextReflectionV1;
  objective?: string;
  refs?: string[];
  generatedAt?: string;
  bridgeId?: string;
};

type EvidenceEntry = {
  id: string;
  label: string;
  score: number;
  text: string;
};

const ANALOGY_ONLY_REFUSALS = [
  "moral_finality",
  "physics_derived_moral_certainty",
  "execution_permission",
] as const;

const BASE_REFUSALS = [
  "moral_finality",
  "physics_as_moral_proof",
  "execution_authority",
] as const;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(value: string): string {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

function normalizeScore(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return clampConfidence(value > 1 ? value / 100 : value);
}

function roundConfidence(value: number): number {
  return Math.round(clampConfidence(value) * 100) / 100;
}

function textContainsHint(text: string, hints: readonly string[]): boolean {
  const normalizedText = normalize(text);
  return hints.some((hint) => {
    const normalizedHint = normalize(hint);
    return normalizedText.includes(normalizedHint) || normalizedText.includes(slug(normalizedHint));
  });
}

function collectTheoryEntries(reflection: TheoryContextReflectionV1 | null | undefined): EvidenceEntry[] {
  if (!reflection) return [];
  const entries: EvidenceEntry[] = [];
  for (const match of [...reflection.exactMatches, ...reflection.likelyMatches]) {
    const semanticReasons = match.reasons.filter((reason) =>
      !/^(?:source path hint|text match|inside selected atlas lens|direct atlas primary badge)\b/i.test(reason),
    );
    entries.push({
      id: match.badgeId,
      label: match.title,
      score: normalizeScore(match.score),
      text: [
        match.badgeId,
        match.title,
        ...semanticReasons,
        ...match.matchedSymbols,
        ...match.matchedEquationFamilies,
        ...match.matchedRepoPaths,
        ...match.claimBoundaryNotes,
      ].join(" "),
    });
  }
  for (const domain of reflection.inferredDomains) {
    entries.push({
      id: `domain:${domain.atlasBlockId}`,
      label: domain.title,
      score: normalizeScore(domain.score),
      text: [domain.atlasBlockId, domain.title, ...domain.reasons].join(" "),
    });
  }
  reflection.evidenceForAsk.claimBoundaries.forEach((boundary, index) => {
    entries.push({
      id: `claim_boundary:${index + 1}`,
      label: "Theory claim boundary",
      score: 0.6,
      text: boundary,
    });
  });
  return entries;
}

function collectIdeologyEntries(reflection: IdeologyContextReflectionV1): EvidenceEntry[] {
  const entries: EvidenceEntry[] = [];
  for (const match of [
    ...reflection.matches.exact,
    ...reflection.matches.likely,
    ...reflection.matches.inferred_lenses,
  ]) {
    entries.push({
      id: match.nodeId,
      label: match.label,
      score: normalizeScore(match.score),
      text: [
        match.nodeId,
        match.label,
        ...match.reasons,
        ...(match.tags ?? []),
        ...(match.pathToRoot ?? []),
      ].join(" "),
    });
  }
  for (const trait of reflection.activated_traits) {
    entries.push({
      id: trait.nodeId,
      label: trait.label,
      score: normalizeScore(trait.confidence),
      text: [
        trait.nodeId,
        trait.label,
        ...(trait.tags ?? []),
        ...trait.pathToRoot,
      ].join(" "),
    });
  }
  for (const evidence of reflection.claim_boundaries.missing_evidence ?? []) {
    entries.push({
      id: `ideology_missing_evidence:${slug(evidence) || "missing"}`,
      label: "Ideology missing evidence",
      score: 0.5,
      text: evidence,
    });
  }
  return entries;
}

function hasTheoryEvidence(reflection: TheoryContextReflectionV1 | null | undefined): boolean {
  return collectTheoryEntries(reflection).length > 0;
}

function hasIdeologyEvidence(reflection: IdeologyContextReflectionV1): boolean {
  return collectIdeologyEntries(reflection).length > 0;
}

function matchTheoryEntries(
  entries: readonly EvidenceEntry[],
  mapping: TheoryIdeologyBridgeMapping,
): EvidenceEntry[] {
  return entries.filter((entry) => textContainsHint(entry.text, mapping.theoryHints));
}

function ideologyHintsForMapping(mapping: TheoryIdeologyBridgeMapping): string[] {
  return mapping.ideologyNodeIds.flatMap((id) => [id, id.replace(/-/g, " ")]);
}

function matchIdeologyEntries(
  entries: readonly EvidenceEntry[],
  mapping: TheoryIdeologyBridgeMapping,
): EvidenceEntry[] {
  const ideologyHints = ideologyHintsForMapping(mapping);
  return entries.filter(
    (entry) =>
      mapping.ideologyNodeIds.includes(entry.id) ||
      textContainsHint(entry.text, ideologyHints),
  );
}

function bestConfidence(
  theoryMatches: readonly EvidenceEntry[],
  ideologyMatches: readonly EvidenceEntry[],
  relation: string,
): number {
  const bestTheory = Math.max(0, ...theoryMatches.map((entry) => entry.score));
  const bestIdeology = Math.max(0, ...ideologyMatches.map((entry) => entry.score));
  const bothSides = bestTheory > 0 && bestIdeology > 0;
  const raw = bothSides ? (bestTheory + bestIdeology) / 2 : Math.max(bestTheory, bestIdeology) * 0.65;
  const capped = relation === "analogy_only" ? Math.min(raw, 0.68) : raw;
  return roundConfidence(Math.max(capped, bothSides ? 0.55 : 0.35));
}

function sourceEvidenceRefs(input: BuildTheoryIdeologyBridgeInput): string[] {
  return unique([
    ...(input.refs ?? []),
    ...(input.theoryReflection ? [`theory_context_reflection:${input.theoryReflection.reflectionId}`] : []),
    `ideology_context_reflection:${input.ideologyReflection.reflectionId}`,
    ...(input.ideologyReflection.input.refs ?? []),
  ]);
}

function linkMissingEvidence(
  theoryMatches: readonly EvidenceEntry[],
  ideologyMatches: readonly EvidenceEntry[],
  mapping: TheoryIdeologyBridgeMapping,
  input: BuildTheoryIdeologyBridgeInput,
  ideologyReflection: IdeologyContextReflectionV1,
): string[] {
  const theoryMissing = theoryMatches.length === 0
    ? input.theoryReflection
      ? [`theory_counterpart:${mapping.theoryHints.slice(0, 2).map(slug).filter(Boolean).join("+") || "unverified"}`]
      : ["theory_context_reflection"]
    : [];
  const ideologyMissing = ideologyMatches.length === 0
    ? [`ideology_counterpart:${slug(mapping.ideologyNodeIds[0] ?? "unverified")}`]
    : [];
  return unique([
    ...theoryMissing,
    ...ideologyMissing,
    ...(ideologyReflection.claim_boundaries.missing_evidence ?? []),
  ]);
}

function buildExplanation(
  mapping: TheoryIdeologyBridgeMapping,
  theoryLabels: readonly string[],
  ideologyLabels: readonly string[],
): string {
  const theoryText = theoryLabels.length > 0 ? theoryLabels.join(", ") : "unverified theory counterpart";
  const ideologyText = ideologyLabels.length > 0 ? ideologyLabels.join(", ") : "unverified Moral counterpart";
  return `Theory evidence (${theoryText}) is bridged to Moral evidence (${ideologyText}) as ${mapping.relation}; counterpart gaps stay listed as missing evidence.`;
}

function makeLink(
  input: BuildTheoryIdeologyBridgeInput,
  mapping: TheoryIdeologyBridgeMapping,
  index: number,
  theoryMatches: readonly EvidenceEntry[],
  ideologyMatches: readonly EvidenceEntry[],
): TheoryIdeologyBridgeLinkV1 {
  const theoryIds = unique(
    theoryMatches.length > 0
      ? theoryMatches.map((entry) => entry.id)
      : mapping.theoryHints.map((hint) => `theory_counterpart_hint:${slug(hint)}`),
  );
  const ideologyIds = unique(
    ideologyMatches.length > 0
      ? ideologyMatches.map((entry) => entry.id)
      : mapping.ideologyNodeIds,
  );
  const theoryLabels = unique(theoryMatches.map((entry) => entry.label));
  const ideologyLabels = unique(ideologyMatches.map((entry) => entry.label));
  const missingEvidence = linkMissingEvidence(theoryMatches, ideologyMatches, mapping, input, input.ideologyReflection);
  return {
    id: `bridge:${index + 1}:${slug(mapping.relation)}:${slug(theoryIds[0] ?? "theory")}:to:${slug(
      ideologyIds[0] ?? "ideology",
    )}`,
    theoryBadgeIds: theoryIds,
    ...(theoryLabels.length > 0 ? { theoryLabels } : {}),
    ideologyNodeIds: ideologyIds,
    ...(ideologyLabels.length > 0 ? { ideologyLabels } : {}),
    relation: mapping.relation,
    explanation: buildExplanation(mapping, theoryLabels, ideologyLabels),
    proceduralEffect: mapping.proceduralEffect,
    confidence: bestConfidence(theoryMatches, ideologyMatches, mapping.relation),
    evidenceRefs: sourceEvidenceRefs(input),
    ...(missingEvidence.length > 0 ? { missingEvidence } : {}),
    refusesAuthority:
      mapping.relation === "analogy_only" ? [...ANALOGY_ONLY_REFUSALS] : [...BASE_REFUSALS],
    reasonCodes: unique([
      "theory_ideology_bridge",
      `bridge_relation:${mapping.relation}`,
      ...(theoryMatches.length === 0 ? ["theory_counterpart_unverified"] : []),
      ...(ideologyMatches.length === 0 ? ["ideology_counterpart_unverified"] : []),
      ...(mapping.relation === "analogy_only" ? ["analogy_boundary_required"] : []),
    ]),
  };
}

function buildRecommendedActions(
  missingEvidence: readonly string[],
  links: readonly TheoryIdeologyBridgeLinkV1[],
): TheoryIdeologyBridgeRecommendedActionV1[] {
  const actions: TheoryIdeologyBridgeRecommendedActionV1[] = [];
  if (missingEvidence.includes("theory_context_reflection")) {
    actions.push({
      id: "bridge-action:request-theory-reflection",
      type: "ask_for_missing_evidence",
      label: "Request theory reflection evidence before strengthening the bridge.",
      reasonCodes: ["missing_theory_reflection", "evidence_only_bridge"],
    });
  }
  if (missingEvidence.includes("ideology_context_reflection")) {
    actions.push({
      id: "bridge-action:request-ideology-reflection",
      type: "ask_for_missing_evidence",
      label: "Request Moral reflection evidence before strengthening the bridge.",
      reasonCodes: ["missing_ideology_reflection", "evidence_only_bridge"],
    });
  }
  if (missingEvidence.some((entry) => !entry.endsWith("_reflection"))) {
    actions.push({
      id: "bridge-action:ask-for-missing-evidence",
      type: "ask_for_missing_evidence",
      label: "Ask for the missing counterpart evidence listed by the bridge.",
      reasonCodes: ["missing_evidence", "claim_boundary_guard"],
    });
  }
  if (links.some((link) => link.relation === "analogy_only")) {
    actions.push({
      id: "bridge-action:preserve-analogy-boundary",
      type: "preserve_claim_boundary",
      label: "Keep physics language as analogy and preserve procedural review.",
      description:
        "Use the bridge to shape questions, uncertainty, and review gates; do not treat it as final authority.",
      reasonCodes: ["analogy_only", "overclaim_guard"],
    });
  }
  if (actions.length === 0) {
    actions.push({
      id: "bridge-action:preserve-evidence-only-posture",
      type: "preserve_uncertainty",
      label: "Use the bridge as evidence-only procedural context.",
      reasonCodes: ["evidence_only_bridge", "terminal_authority_false"],
    });
  }
  return actions;
}

export function buildTheoryIdeologyBridgeFromReflections(
  input: BuildTheoryIdeologyBridgeInput,
) {
  const theoryEntries = collectTheoryEntries(input.theoryReflection);
  const ideologyEntries = collectIdeologyEntries(input.ideologyReflection);
  const theoryEvidencePresent = hasTheoryEvidence(input.theoryReflection);
  const ideologyEvidencePresent = hasIdeologyEvidence(input.ideologyReflection);

  const links = BRIDGE_MAPPINGS.map((mapping, index) => {
    const theoryMatches = matchTheoryEntries(theoryEntries, mapping);
    const ideologyMatches = matchIdeologyEntries(ideologyEntries, mapping);
    if (theoryMatches.length === 0 && ideologyMatches.length === 0) return null;
    return makeLink(input, mapping, index, theoryMatches, ideologyMatches);
  }).filter((link): link is TheoryIdeologyBridgeLinkV1 => Boolean(link));

  const missingEvidence = unique([
    ...(!theoryEvidencePresent ? ["theory_context_reflection"] : []),
    ...(!ideologyEvidencePresent ? ["ideology_context_reflection"] : []),
    ...links.flatMap((link) => link.missingEvidence ?? []),
    ...(input.ideologyReflection.claim_boundaries.missing_evidence ?? []),
  ]);

  return buildTheoryIdeologyBridgeV1({
    generatedAt: input.generatedAt,
    bridgeId: input.bridgeId,
    ...(input.theoryReflection
      ? { sourceTheoryReflectionId: input.theoryReflection.reflectionId }
      : {}),
    sourceIdeologyReflectionId: input.ideologyReflection.reflectionId,
    inputs: {
      prompt: input.prompt,
      ...(input.objective ? { objective: input.objective } : {}),
      ...(input.refs ? { refs: input.refs } : {}),
    },
    links,
    missingEvidence,
    recommendedActions: buildRecommendedActions(missingEvidence, links),
  });
}
