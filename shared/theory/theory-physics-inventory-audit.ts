import type { PhysicsAtlasBlockV1 } from "../contracts/physics-atlas.v1";
import type { TheoryBadgeGraphV1, TheoryBadgeV1 } from "../contracts/theory-badge-graph.v1";
import { PHYSICS_ATLAS_BLOCKS } from "./physics-atlas-blocks";

export type TheoryPhysicsInventoryDomainStatus =
  | "represented"
  | "partially_represented"
  | "repo_present_graph_gap"
  | "not_detected";

export type TheoryPhysicsInventoryDomainDefinition = {
  id: string;
  title: string;
  keywords: string[];
  pathPatterns: string[];
  expectedAtlasBlockIds: string[];
  expectedBadgePrefixes: string[];
  recommendedNextPatch: string;
  claimBoundaryNote: string;
};

export type TheoryPhysicsInventoryDomainReport = {
  id: string;
  title: string;
  status: TheoryPhysicsInventoryDomainStatus;
  repoPathCount: number;
  sampleRepoPaths: string[];
  atlasBlockIds: string[];
  badgeIds: string[];
  missingAtlasBlockIds: string[];
  missingBadgePrefixes: string[];
  recommendedNextPatch: string;
  claimBoundaryNote: string;
};

export type TheoryPhysicsInventoryAuditReport = {
  generatedAt: string;
  graphId: string;
  graphBadgeCount: number;
  atlasBlockCount: number;
  scannedRepoPathCount: number;
  domains: TheoryPhysicsInventoryDomainReport[];
  summary: {
    representedCount: number;
    partiallyRepresentedCount: number;
    repoPresentGraphGapCount: number;
    notDetectedCount: number;
  };
};

export const DEFAULT_THEORY_PHYSICS_INVENTORY_DOMAINS: TheoryPhysicsInventoryDomainDefinition[] = [
  {
    id: "granular_tidal_love_number",
    title: "Granular / Tidal Love-Number Response",
    keywords: ["tidal", "love number", "tidal bulge", "quality factor", "rubble", "granular"],
    pathPatterns: ["tidal", "love", "rubble", "granular", "self-gravity-shape"],
    expectedAtlasBlockIds: [],
    expectedBadgePrefixes: ["tidal.", "granular.", "self_gravity."],
    recommendedNextPatch: "feat(theory): add granular tidal/Love-number badge seed under Galactic or Collapse",
    claimBoundaryNote:
      "Tidal and Love-number rows should be material-response diagnostics, not universal collapse or solar-restoration claims.",
  },
  {
    id: "solar_flare_sunquake_nanoflare",
    title: "Solar Flare / Sunquake / Nanoflare Response",
    keywords: ["nanoflare", "sunquake", "flare", "helioseismic", "p-mode", "reconnection"],
    pathPatterns: ["nanoflare", "sunquake", "flare", "helioseismic", "solar-surface-event"],
    expectedAtlasBlockIds: ["solar_surface_spectrum"],
    expectedBadgePrefixes: ["solar.flare.", "solar.sunquake.", "solar.nanoflare."],
    recommendedNextPatch: "feat(theory): extend solar atlas with flare-to-sunquake and nanoflare observable badges",
    claimBoundaryNote:
      "Solar flare, sunquake, and nanoflare rows are observational/MHD diagnostics, not wavefunction-collapse evidence.",
  },
  {
    id: "solar_restoration_red_giant",
    title: "Solar Restoration / Red-Giant Prevention",
    keywords: ["stellar restoration", "solar restoration", "red giant", "deep mixing", "stellar ledger"],
    pathPatterns: ["stellar-restoration", "solar-restoration", "red-giant", "stellar-ledger"],
    expectedAtlasBlockIds: ["stellar_evolution"],
    expectedBadgePrefixes: ["starsim.restoration."],
    recommendedNextPatch: "chore(theory): keep solar-restoration/red-giant planning rows non-actionable and forecast-only",
    claimBoundaryNote:
      "Solar restoration rows must be planning/forecast context only and cannot imply feasible stellar intervention.",
  },
  {
    id: "dp_objective_collapse",
    title: "DP / Objective-Collapse Runtime",
    keywords: ["dp collapse", "diosi", "penrose", "objective collapse", "wavefunction", "collapse estimator"],
    pathPatterns: ["dp-collapse", "collapse-benchmark", "curvature-collapse"],
    expectedAtlasBlockIds: ["curvature_collapse"],
    expectedBadgePrefixes: ["collapse.objective.", "curvature."],
    recommendedNextPatch: "chore(theory): keep DP/objective-collapse badges aligned with runtime artifacts",
    claimBoundaryNote:
      "Objective-collapse rows stay exploratory/model-comparison unless backed by specific experimental receipts.",
  },
  {
    id: "orch_or_microtubule_time_crystal",
    title: "Orch-OR / Microtubule / Time-Crystal Hypothesis",
    keywords: ["orch", "microtubule", "time crystal", "gamma synchrony", "quantum consciousness"],
    pathPatterns: ["orch", "microtubule", "time-crystal", "consciousness"],
    expectedAtlasBlockIds: ["curvature_collapse"],
    expectedBadgePrefixes: ["orch_or."],
    recommendedNextPatch: "chore(theory): keep Orch-OR comparison rows fenced as exploratory",
    claimBoundaryNote:
      "Orch-OR rows are hypothesis-comparison helpers, not consciousness or biological time-crystal validation.",
  },
  {
    id: "halobank_solar_tidal_diagnostics",
    title: "Halobank Solar / Tidal Diagnostics",
    keywords: ["halobank", "solar forcing", "lunisolar", "tidal tensor", "love number"],
    pathPatterns: ["halobank-solar", "lunisolar", "tidal"],
    expectedAtlasBlockIds: [],
    expectedBadgePrefixes: ["halobank.", "solar.tidal.", "tidal."],
    recommendedNextPatch: "feat(theory): add halobank solar/tidal diagnostic badge seed",
    claimBoundaryNote:
      "Halobank solar/tidal rows should remain falsifier/diagnostic context unless runtime receipts support a narrower claim.",
  },
  {
    id: "stellar_structure_nucleosynthesis",
    title: "Stellar Structure / Nucleosynthesis",
    keywords: ["hydrostatic", "opacity", "nucleosynthesis", "stellar structure", "MESA", "fusion"],
    pathPatterns: ["stellar-structure", "nucleosynthesis", "opacity", "mesa", "fusion"],
    expectedAtlasBlockIds: ["stellar_evolution"],
    expectedBadgePrefixes: ["starsim.", "stellar."],
    recommendedNextPatch: "feat(theory): expand Stellar lane with hydrostatic/opacity/nucleosynthesis source rows",
    claimBoundaryNote:
      "Stellar structure rows are reduced-order/model-context unless external stellar-evolution receipts are present.",
  },
  {
    id: "solar_reference_pack",
    title: "Solar Reference Pack / Helioseismic Closure",
    keywords: ["solar reference", "helioseismic", "neutrino", "magnetogram", "solar cycle"],
    pathPatterns: ["solar-reference", "solar-product", "helioseismic", "magnetogram", "solar-cycle"],
    expectedAtlasBlockIds: ["solar_surface_spectrum", "stellar_evolution"],
    expectedBadgePrefixes: ["solar.reference.", "solar.interior.", "solar.cycle."],
    recommendedNextPatch: "feat(theory): add solar reference-pack badges for helioseismic/neutrino/cycle context",
    claimBoundaryNote:
      "Solar reference-pack rows are observational closure context and must require calibration/provenance.",
  },
];

function normalized(value: string): string {
  return value.toLowerCase().replace(/\\/g, "/");
}

function matchesAny(value: string, needles: readonly string[]): boolean {
  const lower = normalized(value);
  return needles.some((needle) => lower.includes(needle.toLowerCase()));
}

function badgeSearchText(badge: TheoryBadgeV1): string {
  return normalized(
    [
      badge.id,
      badge.title,
      badge.plainMeaning,
      badge.whyItMatters,
      ...badge.subjects,
      ...badge.tags,
      ...badge.equationFamilies,
      ...badge.simulationOwners,
      ...badge.sourceRefs.map((ref) => `${ref.path ?? ""} ${ref.id ?? ""} ${ref.note ?? ""}`),
    ].join(" "),
  );
}

function atlasSearchText(block: PhysicsAtlasBlockV1): string {
  return normalized(
    [
      block.id,
      block.title,
      block.shortTitle,
      block.description,
      ...block.subjects,
      ...block.symbols,
      ...block.equationFamilies,
      ...block.simulationOwners,
      ...block.repoPathHints,
      ...block.primaryBadgeIds,
      ...block.claimBoundaryBadgeIds,
      ...block.claimBoundaryNotes,
    ].join(" "),
  );
}

function domainStatus(args: {
  repoPathCount: number;
  atlasBlockIds: string[];
  badgeIds: string[];
  expectedAtlasBlockIds: string[];
  expectedBadgePrefixes: string[];
}): TheoryPhysicsInventoryDomainStatus {
  const { repoPathCount, atlasBlockIds, badgeIds, expectedAtlasBlockIds, expectedBadgePrefixes } = args;
  if (repoPathCount === 0) return "not_detected";
  const hasExpectedAtlas =
    expectedAtlasBlockIds.length === 0 ||
    expectedAtlasBlockIds.every((id) => atlasBlockIds.includes(id));
  const hasExpectedBadge =
    expectedBadgePrefixes.length === 0 ||
    expectedBadgePrefixes.every((prefix) => badgeIds.some((id) => id.startsWith(prefix)));
  if (hasExpectedAtlas && hasExpectedBadge) return "represented";
  if (atlasBlockIds.length > 0 || badgeIds.length > 0) return "partially_represented";
  return "repo_present_graph_gap";
}

export function buildTheoryPhysicsInventoryAuditReport(args: {
  graph: TheoryBadgeGraphV1;
  filePaths: string[];
  atlasBlocks?: PhysicsAtlasBlockV1[];
  domains?: TheoryPhysicsInventoryDomainDefinition[];
  generatedAt?: string;
}): TheoryPhysicsInventoryAuditReport {
  const domains = args.domains ?? DEFAULT_THEORY_PHYSICS_INVENTORY_DOMAINS;
  const atlasBlocks = args.atlasBlocks ?? PHYSICS_ATLAS_BLOCKS;
  const badgeTexts = args.graph.badges.map((badge) => ({ id: badge.id, text: badgeSearchText(badge) }));
  const atlasTexts = atlasBlocks.map((block) => ({ id: block.id, text: atlasSearchText(block) }));
  const repoPaths = args.filePaths
    .map((filePath) => normalized(filePath))
    .filter((filePath) => filePath && !filePath.startsWith("external/") && !filePath.includes("/node_modules/"));

  const domainReports = domains.map((domain): TheoryPhysicsInventoryDomainReport => {
    const matchedRepoPaths = repoPaths.filter((filePath) =>
      matchesAny(filePath, [...domain.pathPatterns, ...domain.keywords]),
    );
    const atlasBlockIds = atlasTexts
      .filter((block) => matchesAny(block.text, [...domain.keywords, ...domain.pathPatterns]))
      .map((block) => block.id);
    const badgeIds = badgeTexts
      .filter((badge) => {
        if (domain.expectedBadgePrefixes.some((prefix) => badge.id.startsWith(prefix))) return true;
        return matchesAny(badge.text, [...domain.keywords, ...domain.pathPatterns]);
      })
      .map((badge) => badge.id);
    const uniqueAtlasIds = Array.from(new Set(atlasBlockIds)).sort();
    const uniqueBadgeIds = Array.from(new Set(badgeIds)).sort();
    const missingAtlasBlockIds = domain.expectedAtlasBlockIds.filter(
      (id) => !uniqueAtlasIds.includes(id),
    );
    const missingBadgePrefixes = domain.expectedBadgePrefixes.filter(
      (prefix) => !uniqueBadgeIds.some((id) => id.startsWith(prefix)),
    );

    return {
      id: domain.id,
      title: domain.title,
      status: domainStatus({
        repoPathCount: matchedRepoPaths.length,
        atlasBlockIds: uniqueAtlasIds,
        badgeIds: uniqueBadgeIds,
        expectedAtlasBlockIds: domain.expectedAtlasBlockIds,
        expectedBadgePrefixes: domain.expectedBadgePrefixes,
      }),
      repoPathCount: matchedRepoPaths.length,
      sampleRepoPaths: matchedRepoPaths.slice(0, 12),
      atlasBlockIds: uniqueAtlasIds,
      badgeIds: uniqueBadgeIds,
      missingAtlasBlockIds,
      missingBadgePrefixes,
      recommendedNextPatch: domain.recommendedNextPatch,
      claimBoundaryNote: domain.claimBoundaryNote,
    };
  });

  return {
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    graphId: args.graph.graphId,
    graphBadgeCount: args.graph.badges.length,
    atlasBlockCount: atlasBlocks.length,
    scannedRepoPathCount: repoPaths.length,
    domains: domainReports,
    summary: {
      representedCount: domainReports.filter((domain) => domain.status === "represented").length,
      partiallyRepresentedCount: domainReports.filter((domain) => domain.status === "partially_represented").length,
      repoPresentGraphGapCount: domainReports.filter((domain) => domain.status === "repo_present_graph_gap").length,
      notDetectedCount: domainReports.filter((domain) => domain.status === "not_detected").length,
    },
  };
}
