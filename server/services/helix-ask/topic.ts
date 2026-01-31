export type HelixAskTopicTag =
  | "helix_ask"
  | "warp"
  | "physics"
  | "energy_pipeline"
  | "trace"
  | "resonance"
  | "ideology"
  | "ledger"
  | "star"
  | "concepts";

export type HelixAskTopicProfile = {
  tags: HelixAskTopicTag[];
  allowlistTiers: RegExp[][];
  boostPaths: RegExp[];
  deboostPaths: RegExp[];
  mustIncludePaths: RegExp[];
  mustIncludeFiles?: string[];
  minTierCandidates: number;
};

const TOPIC_PATTERNS: Record<HelixAskTopicTag, RegExp> = {
  helix_ask:
    /\b(helix ask|helixask|ask pipeline|ask system|ask mode|agi ask|\/api\/agi\/ask|helix ask pill|intent routing|route intent|topic tags?|format router|format policy|evidence gate|coverage gate|belief gate|rattling gate|citation repair|cite repair|repair citations|answer path)\b/i,
  warp: /\b(warp|alcubierre|natario|warp bubble|warp drive)\b/i,
  physics:
    /\b(casimir|quantum inequality|ford-roman|energy condition|stress[-\s]?energy|spacetime|metric|riemann|ricci|einstein tensor|general relativity|gr\b|adm\b|york time)\b/i,
  energy_pipeline:
    /\b(energy pipeline|energy-pipeline|energypipeline|energy\s+pipeline|calculateenergy|drivewarpfrompipeline)\b/i,
  trace: /\b(trace|task trace|tasktrace|trajectory|essence|casimir)\b/i,
  resonance: /\b(resonance|code lattice|lattice)\b/i,
  ideology:
    /\b(ideology|ethos|mission ethos|ideology tree|ethos tree|two-key approval|stewardship ledger|sun ledger|stellar ledger|tend the sun ledger|tend the stellar ledger|zen society)\b/i,
  concepts:
    /\b(platonic reasoning|platonic method|concept registry|definition lint|belief gate|rattling gate|wavefunction|uncertainty|probability field|boltzmann|langevin|scientific method|verification|falsifiability|falsifiable)\b/i,
  ledger:
    /\b(ledger|sun ledger|stellar ledger|warp ledger|curvature ledger|kappa[_\s-]?drive|kappa[_\s-]?body|potato threshold|quantum inequality|ford-roman|qi bounds?)\b/i,
  star:
    /\b(star hydrostatic|stellar hydrostatic|polytrope|gamow window|stellar ledger|solar restoration|sun restoration|restore the sun|save the sun|save-the-sun|save‑the‑sun|saving the sun|saving-the-sun|savingthesun|red giant|stellar evolution)\b/i,
};

const HELIX_ASK_CORE_PATHS: RegExp[] = [
  /server\/routes\/agi\.plan\.ts/i,
  /server\/services\/helix-ask\//i,
  /client\/src\/components\/helix\/HelixAskPill\.tsx/i,
  /client\/src\/pages\/desktop\.tsx/i,
  /docs\/helix-ask-flow\.md/i,
  /client\/src\/lib\/agi\/api\.ts/i,
];

const HELIX_ASK_CORE_FILES: string[] = [
  "server/routes/agi.plan.ts",
  "docs/helix-ask-flow.md",
];

const HELIX_ASK_EXPANDED_PATHS: RegExp[] = [
  /client\/src\/components\/agi\//i,
  /client\/src\/lib\/agi\//i,
  /server\/db\/agi/i,
  /docs\/TRACE-API\.md/i,
  /docs\/ESSENCE-CONSOLE/i,
  /server\/services\/observability/i,
  /docs\/knowledge\/platonic-reasoning\.md/i,
];

const HELIX_ASK_NOISE_PATHS: RegExp[] = [
  /server\/energy-pipeline/i,
  /modules\/warp\//i,
  /client\/src\/components\/warp/i,
  /energy-pipeline/i,
  /warp-?module/i,
];

const WARP_PATHS: RegExp[] = [
  /modules\/warp\//i,
  /docs\/warp/i,
  /docs\/warp-/i,
  /warp-?module/i,
  /warp-?theta/i,
  /warp bubble/i,
];

const WARP_CORE_PATHS: RegExp[] = [
  /modules\/warp\/warp-module\.ts/i,
  /modules\/warp\/natario-warp\.ts/i,
  /docs\/warp-console-architecture\.md/i,
];

const PHYSICS_PATHS: RegExp[] = [
  /docs\/knowledge\/physics\//i,
  /docs\/knowledge\/warp\//i,
];

const PHYSICS_NOISE_PATHS: RegExp[] = [
  /\.test\.ts$/i,
  /\.spec\.ts$/i,
  /-adapter\.ts$/i,
  /use-.*-pipeline\.ts$/i,
  /energy-pipeline\.ts$/i,
];

const WARP_ALLOWLIST_PATHS: RegExp[] = [
  /modules\/warp\/(?!.*\.(test|spec)\.ts)/i,
  /docs\/warp/i,
  /docs\/warp-/i,
];

const WARP_NOISE_PATHS: RegExp[] = [
  /\.test\.ts$/i,
  /\.spec\.ts$/i,
  /modules\/warp\/.*\.(test|spec)\.ts$/i,
  /-adapter\.ts$/i,
  /use-.*-pipeline\.ts$/i,
  /components\/.*Pipeline\.tsx$/i,
  /energy-pipeline\.ts$/i,
];

const ENERGY_PATHS: RegExp[] = [
  /energy-pipeline/i,
  /EnergyPipeline\.tsx/i,
  /calculateEnergyPipeline/i,
  /driveWarpFromPipeline/i,
];

const TRACE_PATHS: RegExp[] = [
  /docs\/TRACE-API\.md/i,
  /server\/db\/agi/i,
  /client\/src\/components\/agi\//i,
  /client\/src\/lib\/agi\//i,
];

const RESONANCE_PATHS: RegExp[] = [
  /code-lattice/i,
  /resonance/i,
];

const IDEOLOGY_CORE_PATHS: RegExp[] = [
  /docs\/ethos\/ideology\.json/i,
  /docs\/ethos\/why\.md/i,
  /server\/routes\/ethos\.ts/i,
  /server\/services\/ideology\//i,
  /shared\/ideology\//i,
];

const IDEOLOGY_CORE_FILES: string[] = [
  "docs/ethos/ideology.json",
  "docs/ethos/why.md",
];

const IDEOLOGY_EXPANDED_PATHS: RegExp[] = [
  /docs\/zen-society\//i,
  /docs\/zen-ladder-pack\//i,
  /client\/src\/components\/ideology\//i,
  /client\/src\/components\/IdeologyPanel\.tsx/i,
  /client\/src\/components\/MissionEthosSourcePanel\.tsx/i,
  /client\/src\/hooks\/use-ideology/i,
  /client\/src\/lib\/ideology/i,
];

const LEDGER_CORE_PATHS: RegExp[] = [
  /docs\/ethos\/ideology\.json/i,
  /docs\/ethos\/why\.md/i,
  /docs\/knowledge\/(sun-ledger|stewardship-ledger|warp-ledger|curvature-ledger|kappa-proxy)\.md/i,
  /shared\/curvature-proxy\.ts/i,
  /server\/helix-proof-pack\.ts/i,
  /server\/helix-core\.ts/i,
  /client\/src\/physics\/curvature\.ts/i,
  /client\/src\/components\/DriveGuardsPanel\.tsx/i,
  /client\/src\/components\/WarpLedgerPanel\.tsx/i,
  /warp-web\/km-scale-warp-ledger\.html/i,
];

const LEDGER_CORE_FILES: string[] = [
  "docs/ethos/ideology.json",
  "docs/ethos/why.md",
  "docs/knowledge/sun-ledger.md",
  "docs/knowledge/stewardship-ledger.md",
  "docs/knowledge/warp-ledger.md",
  "docs/knowledge/kappa-proxy.md",
  "shared/curvature-proxy.ts",
  "server/helix-proof-pack.ts",
  "client/src/components/DriveGuardsPanel.tsx",
  "client/src/components/WarpLedgerPanel.tsx",
  "warp-web/km-scale-warp-ledger.html",
];

const STAR_CORE_PATHS: RegExp[] = [
  /docs\/knowledge\/(star-hydrostatic|stellar-ledger|solar-restoration)\.md/i,
  /client\/src\/pages\/star-hydrostatic-panel\.tsx/i,
  /client\/src\/physics\/polytrope\.ts/i,
  /client\/src\/physics\/gamow\.ts/i,
  /docs\/curvature-unit-solar-notes\.md/i,
  /client\/src\/pages\/start\.tsx/i,
];

const STAR_CORE_FILES: string[] = [
  "docs/knowledge/star-hydrostatic.md",
  "docs/knowledge/stellar-ledger.md",
  "docs/knowledge/solar-restoration.md",
  "client/src/pages/star-hydrostatic-panel.tsx",
  "client/src/physics/polytrope.ts",
  "client/src/physics/gamow.ts",
  "docs/curvature-unit-solar-notes.md",
];

const normalizePath = (value: string): string => value.replace(/\\/g, "/");

export function pathMatchesAny(value: string, patterns: RegExp[] = []): boolean {
  if (!value || patterns.length === 0) return false;
  const normalized = normalizePath(value);
  return patterns.some((pattern) => pattern.test(normalized));
}

export function inferHelixAskTopicTags(question: string, searchQuery?: string): HelixAskTopicTag[] {
  const combined = `${question} ${searchQuery ?? ""}`.trim();
  if (!combined) return [];
  const tags: HelixAskTopicTag[] = [];
  const push = (tag: HelixAskTopicTag) => {
    if (!tags.includes(tag)) tags.push(tag);
  };
  for (const [tag, pattern] of Object.entries(TOPIC_PATTERNS) as Array<
    [HelixAskTopicTag, RegExp]
  >) {
    if (pattern.test(combined)) {
      push(tag);
    }
  }
  return tags;
}

export function buildHelixAskTopicProfile(tags: HelixAskTopicTag[]): HelixAskTopicProfile | null {
  if (!tags.length) return null;
  const allowlistTiers: RegExp[][] = [];
  const boostPaths: RegExp[] = [];
  const deboostPaths: RegExp[] = [];
  const mustIncludePaths: RegExp[] = [];
  const mustIncludeFiles: string[] = [];
  let minTierCandidates = 0;

  if (tags.includes("helix_ask")) {
    allowlistTiers.push(HELIX_ASK_CORE_PATHS);
    allowlistTiers.push([...HELIX_ASK_CORE_PATHS, ...HELIX_ASK_EXPANDED_PATHS]);
    allowlistTiers.push([]);
    boostPaths.push(...HELIX_ASK_CORE_PATHS);
    mustIncludePaths.push(...HELIX_ASK_CORE_PATHS);
    mustIncludeFiles.push(...HELIX_ASK_CORE_FILES);
    deboostPaths.push(...HELIX_ASK_NOISE_PATHS);
    minTierCandidates = Math.max(minTierCandidates, 3);
  }

  if (tags.includes("concepts")) {
    allowlistTiers.push(HELIX_ASK_CORE_PATHS);
    allowlistTiers.push([...HELIX_ASK_CORE_PATHS, ...HELIX_ASK_EXPANDED_PATHS]);
    allowlistTiers.push([]);
    boostPaths.push(...HELIX_ASK_CORE_PATHS);
    mustIncludePaths.push(
      /server\/services\/helix-ask\/platonic-gates\.ts/i,
      /server\/services\/helix-ask\/concepts\.ts/i,
      /server\/services\/helix-ask\/intent-directory\.ts/i,
      /server\/routes\/agi\.plan\.ts/i,
    );
    mustIncludeFiles.push(
      "server/services/helix-ask/platonic-gates.ts",
      "server/services/helix-ask/concepts.ts",
      "server/services/helix-ask/intent-directory.ts",
      "server/routes/agi.plan.ts",
    );
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("trace")) {
    boostPaths.push(...TRACE_PATHS);
    if (!tags.includes("helix_ask")) {
      allowlistTiers.push(TRACE_PATHS);
      allowlistTiers.push([]);
    }
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("resonance")) {
    boostPaths.push(...RESONANCE_PATHS);
  }

  if (tags.includes("ideology")) {
    allowlistTiers.push(IDEOLOGY_CORE_PATHS);
    allowlistTiers.push([...IDEOLOGY_CORE_PATHS, ...IDEOLOGY_EXPANDED_PATHS]);
    allowlistTiers.push([]);
    boostPaths.push(...IDEOLOGY_CORE_PATHS, ...IDEOLOGY_EXPANDED_PATHS);
    mustIncludePaths.push(/docs\/ethos\/ideology\.json/i);
    mustIncludeFiles.push(...IDEOLOGY_CORE_FILES);
    // Avoid warp/energy drift when the user is asking for ideology guidance.
    deboostPaths.push(...WARP_PATHS, ...ENERGY_PATHS);
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("ledger")) {
    allowlistTiers.push(LEDGER_CORE_PATHS);
    allowlistTiers.push([]);
    boostPaths.push(...LEDGER_CORE_PATHS);
    mustIncludePaths.push(...LEDGER_CORE_PATHS);
    mustIncludeFiles.push(...LEDGER_CORE_FILES);
    // Ledger prompts frequently drift into generic energy pipeline files.
    deboostPaths.push(...ENERGY_PATHS);
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("star")) {
    allowlistTiers.push(STAR_CORE_PATHS);
    allowlistTiers.push([]);
    boostPaths.push(...STAR_CORE_PATHS);
    mustIncludePaths.push(...STAR_CORE_PATHS);
    mustIncludeFiles.push(...STAR_CORE_FILES);
    // Star prompts should not drift into warp/energy unless asked.
    deboostPaths.push(...WARP_PATHS, ...ENERGY_PATHS);
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("warp")) {
    allowlistTiers.push(WARP_ALLOWLIST_PATHS);
    allowlistTiers.push([...WARP_ALLOWLIST_PATHS, ...WARP_PATHS]);
    allowlistTiers.push([]);
    boostPaths.push(...WARP_PATHS, ...WARP_CORE_PATHS);
    deboostPaths.push(...WARP_NOISE_PATHS);
    mustIncludePaths.push(...WARP_CORE_PATHS);
    mustIncludeFiles.push(
      "modules/warp/warp-module.ts",
      "modules/warp/natario-warp.ts",
      "docs/warp-console-architecture.md",
    );
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("physics")) {
    allowlistTiers.push(PHYSICS_PATHS);
    allowlistTiers.push([]);
    boostPaths.push(...PHYSICS_PATHS);
    deboostPaths.push(...PHYSICS_NOISE_PATHS);
    mustIncludePaths.push(...PHYSICS_PATHS);
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("energy_pipeline")) {
    boostPaths.push(...ENERGY_PATHS);
  } else if (!tags.includes("warp")) {
    deboostPaths.push(...ENERGY_PATHS);
  }

  const unique = <T>(items: T[]): T[] => Array.from(new Set(items));

  return {
    tags: unique(tags),
    allowlistTiers: allowlistTiers.length ? allowlistTiers : [[]],
    boostPaths: unique(boostPaths),
    deboostPaths: unique(deboostPaths),
    mustIncludePaths: unique(mustIncludePaths),
    mustIncludeFiles: mustIncludeFiles.length ? unique(mustIncludeFiles) : undefined,
    minTierCandidates,
  };
}

export function scoreHelixAskTopicPath(
  filePath: string,
  profile?: HelixAskTopicProfile | null,
): number {
  if (!profile) return 0;
  let delta = 0;
  if (profile.boostPaths.length && pathMatchesAny(filePath, profile.boostPaths)) {
    delta += 6;
  }
  if (profile.deboostPaths.length && pathMatchesAny(filePath, profile.deboostPaths)) {
    delta -= 6;
  }
  return delta;
}

export function topicMustIncludeSatisfied(
  filePaths: string[],
  profile?: HelixAskTopicProfile | null,
): boolean {
  if (!profile || profile.mustIncludePaths.length === 0) return true;
  return filePaths.some((filePath) => pathMatchesAny(filePath, profile.mustIncludePaths));
}
