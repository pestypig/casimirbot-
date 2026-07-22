export const PHYSICS_ATLAS_ARTIFACT_ID = "physics_atlas" as const;
export const PHYSICS_ATLAS_SCHEMA_VERSION = "physics_atlas/v1" as const;

export const PHYSICS_ATLAS_BLOCK_IDS = [
  "stellar_evolution",
  "astrochemistry_prebiotic",
  "cosmic_distance_ladder",
  "solar_surface_spectrum",
  "casimir_cavity_modes",
  "casimir_dp_quantum_foam",
  "warp_gr_nhm2",
  "nhm2_full_solve",
  "qei_stress_energy",
  "tokamak_plasma",
  "galactic_dynamics",
  "curvature_collapse",
] as const;

export type PhysicsAtlasBlockId = (typeof PHYSICS_ATLAS_BLOCK_IDS)[number];
export type PhysicsAtlasBlockStatus = "active" | "seed" | "planned" | "disabled";

export type PhysicsAtlasBlockV1 = {
  id: PhysicsAtlasBlockId;
  title: string;
  shortTitle: string;
  glyph: string;
  description: string;
  status: PhysicsAtlasBlockStatus;
  subjects: string[];
  symbols: string[];
  unitSignatures: string[];
  equationFamilies: string[];
  simulationOwners: string[];
  repoPathHints: string[];
  primaryBadgeIds: string[];
  rootBadgeIds: string[];
  claimBoundaryBadgeIds: string[];
  calculatorExamples: Array<{
    label: string;
    expression: string;
    displayLatex: string;
    symbols: string[];
  }>;
  runtimeActions: Array<{
    actionId: string;
    label: string;
    badgeId?: string;
    note: string;
  }>;
  sourceRefs: Array<{
    kind: "repo_module" | "config" | "contract" | "manifest" | "doc" | "test" | "runtime";
    path: string;
    id?: string | null;
    note?: string | null;
  }>;
  claimBoundaryNotes: string[];
};

export type PhysicsAtlasV1 = {
  artifactId: typeof PHYSICS_ATLAS_ARTIFACT_ID;
  schemaVersion: typeof PHYSICS_ATLAS_SCHEMA_VERSION;
  generatedAt: string;
  graphId: string;
  alwaysOnFoundationSubjects: string[];
  alwaysOnFoundationBadgeIds: string[];
  alwaysOnClaimBoundaryBadgeIds: string[];
  blocks: PhysicsAtlasBlockV1[];
  summary: {
    blockCount: number;
    activeCount: number;
    seedCount: number;
    plannedCount: number;
  };
};

type BuildPhysicsAtlasV1Input = Omit<
  PhysicsAtlasV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "summary"
> & {
  generatedAt?: string;
  summary?: Partial<PhysicsAtlasV1["summary"]>;
};

const FORBIDDEN_PHYSICS_ATLAS_PATTERNS = [
  /\bdirect ER=EPR evidence\b/i,
  /\bCL4 support\b/i,
  /\bvalidated propulsion\b/i,
  /\bproven warp\b/i,
  /\bconfirmed physical mechanism\b/i,
  /\bStarSim proves\b/i,
  /\bSolar proves\b/i,
  /\bCasimir proves propulsion\b/i,
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item: unknown) => typeof item === "string");

function countStatus(blocks: PhysicsAtlasBlockV1[], status: PhysicsAtlasBlockStatus): number {
  return blocks.filter((block: PhysicsAtlasBlockV1) => block.status === status).length;
}

export function buildPhysicsAtlasV1(input: BuildPhysicsAtlasV1Input): PhysicsAtlasV1 {
  return {
    artifactId: PHYSICS_ATLAS_ARTIFACT_ID,
    schemaVersion: PHYSICS_ATLAS_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    graphId: input.graphId,
    alwaysOnFoundationSubjects: input.alwaysOnFoundationSubjects,
    alwaysOnFoundationBadgeIds: input.alwaysOnFoundationBadgeIds,
    alwaysOnClaimBoundaryBadgeIds: input.alwaysOnClaimBoundaryBadgeIds,
    blocks: input.blocks,
    summary: {
      blockCount: input.blocks.length,
      activeCount: countStatus(input.blocks, "active"),
      seedCount: countStatus(input.blocks, "seed"),
      plannedCount: countStatus(input.blocks, "planned"),
      ...input.summary,
    },
  };
}

export function validatePhysicsAtlasV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["physics atlas must be an object"];
  if (value.artifactId !== PHYSICS_ATLAS_ARTIFACT_ID) {
    issues.push(`artifactId must be ${PHYSICS_ATLAS_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== PHYSICS_ATLAS_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${PHYSICS_ATLAS_SCHEMA_VERSION}`);
  }
  for (const field of ["generatedAt", "graphId"] as const) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }
  if (!isStringArray(value.alwaysOnFoundationSubjects)) {
    issues.push("alwaysOnFoundationSubjects must be an array of strings");
  }
  if (!isStringArray(value.alwaysOnFoundationBadgeIds)) {
    issues.push("alwaysOnFoundationBadgeIds must be an array of strings");
  }
  if (!isStringArray(value.alwaysOnClaimBoundaryBadgeIds)) {
    issues.push("alwaysOnClaimBoundaryBadgeIds must be an array of strings");
  }
  if (!Array.isArray(value.blocks)) {
    issues.push("blocks must be an array");
    return issues;
  }

  const blockIds = new Set<string>();
  for (const [index, rawBlock] of value.blocks.entries()) {
    const prefix = `blocks[${index}]`;
    if (!isRecord(rawBlock)) {
      issues.push(`${prefix} must be an object`);
      continue;
    }
    const rawBlockId = typeof rawBlock.id === "string" ? rawBlock.id : "";
    if (!PHYSICS_ATLAS_BLOCK_IDS.includes(rawBlockId as PhysicsAtlasBlockId)) {
      issues.push(`${prefix}.id is invalid`);
    } else if (blockIds.has(rawBlockId)) {
      issues.push(`duplicate block id: ${rawBlockId}`);
    } else {
      blockIds.add(rawBlockId);
    }
    for (const field of ["title", "shortTitle", "glyph", "description", "status"] as const) {
      if (!isNonEmptyString(rawBlock[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
    }
    for (const field of [
      "subjects",
      "symbols",
      "unitSignatures",
      "equationFamilies",
      "simulationOwners",
      "repoPathHints",
      "primaryBadgeIds",
      "rootBadgeIds",
      "claimBoundaryBadgeIds",
      "claimBoundaryNotes",
    ] as const) {
      if (!isStringArray(rawBlock[field])) issues.push(`${prefix}.${field} must be an array of strings`);
    }
    if (!Array.isArray(rawBlock.calculatorExamples)) issues.push(`${prefix}.calculatorExamples must be an array`);
    if (!Array.isArray(rawBlock.runtimeActions)) issues.push(`${prefix}.runtimeActions must be an array`);
    if (!Array.isArray(rawBlock.sourceRefs) || rawBlock.sourceRefs.length === 0) {
      issues.push(`${prefix}.sourceRefs must be a non-empty array`);
    }
    const status = rawBlock.status as PhysicsAtlasBlockStatus;
    const hasLocatorFields =
      Array.isArray(rawBlock.subjects) && rawBlock.subjects.length > 0 ||
      Array.isArray(rawBlock.symbols) && rawBlock.symbols.length > 0 ||
      Array.isArray(rawBlock.equationFamilies) && rawBlock.equationFamilies.length > 0 ||
      Array.isArray(rawBlock.simulationOwners) && rawBlock.simulationOwners.length > 0;
    if ((status === "active" || status === "seed") && !hasLocatorFields && !isStringArray(rawBlock.primaryBadgeIds)) {
      issues.push(`${prefix} active/seed block must include primaryBadgeIds or locator fields`);
    }
  }

  for (const expectedId of PHYSICS_ATLAS_BLOCK_IDS) {
    if (!blockIds.has(expectedId)) issues.push(`missing atlas block: ${expectedId}`);
  }
  if (!isRecord(value.summary)) {
    issues.push("summary must be an object");
  } else {
    const blocks = value.blocks as PhysicsAtlasBlockV1[];
    const expected = {
      blockCount: blocks.length,
      activeCount: countStatus(blocks, "active"),
      seedCount: countStatus(blocks, "seed"),
      plannedCount: countStatus(blocks, "planned"),
    };
    for (const [key, expectedValue] of Object.entries(expected)) {
      if (value.summary[key] !== expectedValue) issues.push(`summary.${key} must be ${expectedValue}`);
    }
  }

  const text = JSON.stringify(value);
  for (const pattern of FORBIDDEN_PHYSICS_ATLAS_PATTERNS) {
    if (pattern.test(text)) issues.push(`forbidden overclaiming text matched: ${pattern.source}`);
  }
  return issues;
}

export function isPhysicsAtlasV1(value: unknown): value is PhysicsAtlasV1 {
  return validatePhysicsAtlasV1(value).length === 0;
}
