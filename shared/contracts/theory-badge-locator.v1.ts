export const THEORY_BADGE_LOCATOR_ARTIFACT_ID = "theory_badge_locator" as const;
export const THEORY_BADGE_LOCATOR_SCHEMA_VERSION = "theory_badge_locator/v1" as const;

export const THEORY_BADGE_LOCATOR_SOURCES = [
  "helix_ask",
  "scientific_calculator",
  "manual",
  "playback",
] as const;

export const THEORY_BADGE_LOCATOR_RESOLUTIONS = ["matched", "unresolved"] as const;
export const THEORY_BADGE_LOCATOR_RESOLUTION_REASONS = [
  "matched_graph_evidence",
  "no_supported_graph_match",
] as const;

export type TheoryBadgeLocatorSource = (typeof THEORY_BADGE_LOCATOR_SOURCES)[number];
export type TheoryBadgeLocatorResolution = (typeof THEORY_BADGE_LOCATOR_RESOLUTIONS)[number];
export type TheoryBadgeLocatorResolutionReason =
  (typeof THEORY_BADGE_LOCATOR_RESOLUTION_REASONS)[number];

export type TheoryBadgeLocatorMatchV1 = {
  badgeId: string;
  title: string;
  score: number;
  reasons: string[];
  matchedSubjects: string[];
  matchedSymbols: string[];
  matchedUnitSignatures: string[];
  matchedEquationFamilies: string[];
  matchedSimulationOwners: string[];
  matchedRepoPaths: string[];
  calculatorPayloads: Array<{
    payloadId: string;
    expression: string;
    displayLatex: string;
    preferredAction: string;
  }>;
  claimBoundaryNotes: string[];
};

export type TheoryBadgeLocatorOverlayV1 = {
  centerBadgeIds: string[];
  highlightedBadgeIds: string[];
  highlightedEdgeIds: string[];
  rippleBadgeIds: string[];
  heatByBadgeId: Record<string, number>;
  suggestedViewport: {
    centerBadgeId: string | null;
    zoom: number;
  };
};

export type TheoryBadgeLocatorArtifactV1 = {
  artifactId: typeof THEORY_BADGE_LOCATOR_ARTIFACT_ID;
  schemaVersion: typeof THEORY_BADGE_LOCATOR_SCHEMA_VERSION;
  generatedAt: string;
  graphId: string;
  input: {
    query: string | null;
    expression: string | null;
    subjects: string[];
    symbols: string[];
    unitSignatures: string[];
    repoPaths: string[];
    equationFamilies: string[];
    simulationOwners: string[];
    source: TheoryBadgeLocatorSource;
  };
  resolution: TheoryBadgeLocatorResolution;
  resolutionReason: TheoryBadgeLocatorResolutionReason;
  matches: TheoryBadgeLocatorMatchV1[];
  overlay: TheoryBadgeLocatorOverlayV1;
  recommendedActions: Array<{
    actionId: string;
    label: string;
    badgeId?: string;
    payloadIds?: string[];
    targetBadgeId?: string;
  }>;
  claimBoundaryNotes: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function validateOverlay(value: unknown, prefix: string): string[] {
  if (!isRecord(value)) return [`${prefix} must be an object`];
  const issues: string[] = [];
  for (const key of ["centerBadgeIds", "highlightedBadgeIds", "highlightedEdgeIds", "rippleBadgeIds"]) {
    if (!isStringArray(value[key])) issues.push(`${prefix}.${key} must be a string array`);
  }
  if (!isRecord(value.heatByBadgeId)) issues.push(`${prefix}.heatByBadgeId must be an object`);
  if (!isRecord(value.suggestedViewport)) issues.push(`${prefix}.suggestedViewport must be an object`);
  return issues;
}

export function buildTheoryBadgeLocatorArtifactV1(
  args: Omit<
    TheoryBadgeLocatorArtifactV1,
    "artifactId" | "schemaVersion" | "generatedAt" | "resolution" | "resolutionReason"
  > & {
    generatedAt?: string;
  },
): TheoryBadgeLocatorArtifactV1 {
  const resolution = args.matches.length > 0 ? "matched" : "unresolved";
  return {
    artifactId: THEORY_BADGE_LOCATOR_ARTIFACT_ID,
    schemaVersion: THEORY_BADGE_LOCATOR_SCHEMA_VERSION,
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    graphId: args.graphId,
    input: args.input,
    resolution,
    resolutionReason:
      resolution === "matched" ? "matched_graph_evidence" : "no_supported_graph_match",
    matches: args.matches,
    overlay: args.overlay,
    recommendedActions: args.recommendedActions,
    claimBoundaryNotes: args.claimBoundaryNotes,
  };
}

export function validateTheoryBadgeLocatorArtifactV1(value: unknown): string[] {
  if (!isRecord(value)) return ["artifact must be an object"];
  const issues: string[] = [];
  if (value.artifactId !== THEORY_BADGE_LOCATOR_ARTIFACT_ID) issues.push("artifactId must be theory_badge_locator");
  if (value.schemaVersion !== THEORY_BADGE_LOCATOR_SCHEMA_VERSION) {
    issues.push("schemaVersion must be theory_badge_locator/v1");
  }
  if (typeof value.generatedAt !== "string" || !value.generatedAt) issues.push("generatedAt must be a string");
  if (typeof value.graphId !== "string" || !value.graphId) issues.push("graphId must be a non-empty string");
  if (!isRecord(value.input)) issues.push("input must be an object");
  if (!Array.isArray(value.matches)) issues.push("matches must be an array");
  if (!THEORY_BADGE_LOCATOR_RESOLUTIONS.includes(value.resolution as TheoryBadgeLocatorResolution)) {
    issues.push("resolution is invalid");
  }
  if (
    !THEORY_BADGE_LOCATOR_RESOLUTION_REASONS.includes(
      value.resolutionReason as TheoryBadgeLocatorResolutionReason,
    )
  ) {
    issues.push("resolutionReason is invalid");
  }
  if (Array.isArray(value.matches)) {
    if (value.resolution === "matched" && value.matches.length === 0) {
      issues.push("matched resolution requires at least one match");
    }
    if (value.resolution === "unresolved" && value.matches.length > 0) {
      issues.push("unresolved resolution requires no matches");
    }
    if (value.resolution === "matched" && value.resolutionReason !== "matched_graph_evidence") {
      issues.push("matched resolution requires matched_graph_evidence reason");
    }
    if (value.resolution === "unresolved" && value.resolutionReason !== "no_supported_graph_match") {
      issues.push("unresolved resolution requires no_supported_graph_match reason");
    }
  }
  if (value.overlay) issues.push(...validateOverlay(value.overlay, "overlay"));
  else issues.push("overlay must be present");
  if (!Array.isArray(value.recommendedActions)) issues.push("recommendedActions must be an array");
  if (!isStringArray(value.claimBoundaryNotes)) issues.push("claimBoundaryNotes must be a string array");
  return issues;
}

export function isTheoryBadgeLocatorArtifactV1(value: unknown): value is TheoryBadgeLocatorArtifactV1 {
  return validateTheoryBadgeLocatorArtifactV1(value).length === 0;
}
