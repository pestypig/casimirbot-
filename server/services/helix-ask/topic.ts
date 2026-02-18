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
  | "concepts"
  | "ui"
  | "frontend"
  | "client"
  | "backend"
  | "simulation"
  | "uncertainty"
  | "brick"
  | "lattice"
  | "knowledge"
  | "rag"
  | "essence"
  | "luma"
  | "noise"
  | "hardware"
  | "telemetry"
  | "console"
  | "llm"
  | "debate"
  | "specialists"
  | "security"
  | "skills"
  | "materials"
  | "environment"
  | "sdk"
  | "packages"
  | "external"
  | "queue"
  | "jobs"
  | "ops"
  | "ci"
  | "zen_ladder_pack";

export type HelixAskTopicProfile = {
  tags: HelixAskTopicTag[];
  allowlistTiers: RegExp[][];
  boostPaths: RegExp[];
  deboostPaths: RegExp[];
  mustIncludePaths: RegExp[];
  mustIncludeFiles?: string[];
  minTierCandidates: number;
  routingMetadata?: {
    provenance_class: "inferred";
    claim_tier: "diagnostic";
    certifying: false;
  };
};

const TOPIC_PATTERNS: Record<HelixAskTopicTag, RegExp> = {
  helix_ask:
    /\b(helix ask|helixask|ask pipeline|ask system|ask mode|agi ask|\/api\/agi\/ask|helix ask pill|intent routing|route intent|topic tags?|format router|format policy|evidence gate|coverage gate|belief gate|rattling gate|citation repair|cite repair|repair citations|answer path)\b/i,
  warp: /\b(warp|alcubierre|natario|warp bubble|warp drive)\b/i,
  physics:
    /\b(casimir|quantum inequality|ford-roman|energy condition|stress[-\s]?energy|spacetime|metric|riemann|ricci|einstein tensor|general relativity|gr\b|adm\b|york time|atom(?:ic)?|electron(?:s)?|orbital(?:s)?|wavefunction|bohr|hydrogenic|universe|cosmos|cosmology|astrobiology|abiogenesis|origin(?:s)? of life|life emergence|stellar consciousness)\b/i,
  energy_pipeline:
    /\b(energy pipeline|energy-pipeline|energypipeline|energy\s+pipeline|calculateenergy|drivewarpfrompipeline)\b/i,
  trace: /\b(trace|task trace|tasktrace|trajectory|essence|casimir)\b/i,
  resonance: /\b(resonance|code lattice|lattice)\b/i,
  ideology:
    /\b(ideology|ethos|mission[-\s]?ethos|ideology tree|ethos tree|two-key approval|stewardship ledger|sun ledger|stellar ledger|tend the sun ledger|tend the stellar ledger|zen society|zen ladder|zen-ladder|zen ladder pack|zen-ladder-pack)\b/i,
  concepts:
    /\b(platonic reasoning|platonic method|concept registry|definition lint|belief gate|rattling gate|analysis loop|analysis loops|belief graph loop|morphospace attractors?|morphospace|wavefunction|uncertainty|probability field|boltzmann|langevin|scientific method|verification|falsifiability|falsifiable)\b/i,
  ledger:
    /\b(ledger|sun ledger|stellar ledger|warp ledger|curvature ledger|kappa[_\s-]?drive|kappa[_\s-]?body|kappa proxy|curvature proxy|kappa ledger|potato threshold|e[_\s-]?potato|qi bounds?|qi widget|qi auto[-\s]?tuner|quantum inequality|ford[-\s]?roman)\b/i,
  star:
    /\b(star hydrostatic|stellar hydrostatic|polytrope|gamow window|potato threshold|hr map|hr diagram|stellar ledger|solar restoration|sun restoration|restore the sun|save the sun|save-the-sun|saving the sun|saving-the-sun|savingthesun|red giant|red giant phase|stellar evolution)\b/i,
  ui: /\b(ui|user interface|frontend|front[-\s]?end|panel|panels|dashboard|hud|viewport|component tree|ui components|desktop panel)\b/i,
  frontend: /\b(frontend|front[-\s]?end|client[-\s]?side|browser|tsx|react)\b/i,
  client: /\b(client|client[-\s]?side|browser|desktop app|ui client)\b/i,
  backend: /\b(backend|back[-\s]?end|server[-\s]?side|api|endpoint|service|worker)\b/i,
  simulation:
    /\b(simulation|simulator|sim systems?|parametric sweep|finite element|scuffem|gmsh|simulation api|atomic simulation|orbital simulator|orbital viewer|electron orbital)\b/i,
  uncertainty:
    /\b(uncertainty|confidence interval|error bars?|error propagation|monte carlo|stochastic|noise kernel)\b/i,
  brick: /\b(brick|brick lattice|brick dataflow|brick pipeline|brick mesh)\b/i,
  lattice: /\b(lattice|grid|voxel|sdf|signed distance)\b/i,
  knowledge:
    /\b(knowledge (ingestion|corpus|base)|knowledge graph|rag|retrieval|vector store|embedding)\b/i,
  rag: /\b(rag|retrieval augmented generation|vector store|embeddings?)\b/i,
  essence: /\b(essence|persona|essence profile|essence mix|essence ingest)\b/i,
  luma: /\b(luma|luma panel|luma whispers|image generation)\b/i,
  noise: /\b(noise gen|noise field|noise kernel|noise panel|noise profile|noisegen)\b/i,
  hardware: /\b(hardware|instrument|device|pump driver|spectrum tuner|vacuum gap)\b/i,
  telemetry: /\b(telemetry|metrics|observability|panel telemetry|telemetry stream)\b/i,
  console:
    /\b(console|warp console|essence console|console telemetry|console snapshot|panel telemetry)\b/i,
  llm: /\b(llm|language model|local model|tokenizer|ollama|small-llm)\b/i,
  debate: /\b(debate|referee|proponent|skeptic|debate loop|debate telemetry)\b/i,
  specialists: /\b(specialists?|solver|verifier|specialist plan)\b/i,
  security:
    /\b(security|guardrail|guardrails|hull guard|hull mode|tenant|authorization|auth guard|concurrency guard|hack(?:ed|ing)?|phish(?:ing)?|fraud|scam|account takeover|credential (?:theft|stuffing)|ransom(?:ware)?|cyber(?:security| attack)?|financial hack)\b/i,
  skills: /\b(skills?|tool registry|tooling|tool spec|skill catalog|tool manifest)\b/i,
  materials: /\b(materials?|hull materials|needle hull|dlc|diamond stack|hull glb)\b/i,
  environment: /\b(environment model|environment tags?|environment alignment|essence environment)\b/i,
  sdk: /\b(sdk|client sdk|api client|sdk example|sdk runtime|typescript sdk)\b/i,
  packages:
    /\b(packages tree|create-casimir-verifier|package scaffold|monorepo package|app native bundle)\b/i,
  external:
    /\b(external dependencies?|third[-\s]?party|vendor|llama\.cpp|sunpy|whisper|audiocraft)\b/i,
  queue: /\b(queue|job queue|scheduler|orchestration|pipeline jobs?)\b/i,
  jobs: /\b(job|jobs|scheduler|orchestration|worker pool)\b/i,
  ops: /\b(ops|operations|deployment|release|runbook|observability|infra|sre)\b/i,
  ci: /\b(ci|cd|github actions|build pipeline|release pipeline)\b/i,
  zen_ladder_pack: /\b(zen ladder|zen-ladder|zen ladder pack|zen-ladder-pack)\b/i,
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
  /docs\/knowledge\/warp\//i,
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
  /docs\/stellar-consciousness.*\.md/i,
  /docs\/stellar-consciousness-ii\.md/i,
  /docs\/stellar-consciousness-orch-or-review\.md/i,
  /docs\/papers(?:\/|\.md)/i,
  /docs\/knowledge\/stellar-restoration-tree\.json/i,
  /docs\/knowledge\/trees\/stellar-restoration-tree\.md/i,
  /client\/src\/components\/ElectronOrbitalPanel\.tsx/i,
  /client\/src\/hooks\/useElectronOrbitSim\.ts/i,
  /client\/src\/lib\/atomic-orbitals\.ts/i,
];

// PS2 stellar-framework retrieval contract anchors.
const STELLAR_FRAMEWORK_REQUIRED_FILES: string[] = [
  "docs/stellar-consciousness-ii.md",
  "docs/stellar-consciousness-orch-or-review.md",
  "docs/knowledge/dag-node-schema.md",
  "docs/knowledge/physics/math-tree.json",
  "docs/knowledge/physics/math-maturity-stages.md",
  "docs/knowledge/physics/physics-foundations-tree.json",
  "docs/knowledge/bridges/ideology-physics-bridge-tree.json",
  "docs/ethos/ideology.json",
  "WARP_AGENTS.md",
];

const STELLAR_FRAMEWORK_REQUIRED_PATHS: RegExp[] = [
  /docs\/stellar-consciousness-ii\.md/i,
  /docs\/stellar-consciousness-orch-or-review\.md/i,
  /docs\/knowledge\/dag-node-schema\.md/i,
  /docs\/knowledge\/physics\/math-tree\.json/i,
  /docs\/knowledge\/physics\/math-maturity-stages\.md/i,
  /docs\/knowledge\/physics\/physics-foundations-tree\.json/i,
  /docs\/knowledge\/bridges\/ideology-physics-bridge-tree\.json/i,
  /docs\/ethos\/ideology\.json/i,
  /WARP_AGENTS\.md/i,
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
  /docs\/knowledge\/warp\//i,
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

const IDEOLOGY_KNOWLEDGE_PATHS: RegExp[] = [
  /docs\/knowledge\/ethos\//i,
];

const ZEN_LADDER_PACK_PATHS: RegExp[] = [/docs\/zen-ladder-pack\//i, /docs\/ethos\/ideology\.json/i];

const ZEN_LADDER_PACK_FILES: string[] = ["docs/ethos/ideology.json"];

const LEDGER_CORE_PATHS: RegExp[] = [
  /docs\/ethos\/ideology\.json/i,
  /docs\/ethos\/why\.md/i,
  /docs\/knowledge\/(sun-ledger|stewardship-ledger|warp-ledger|curvature-ledger|kappa-proxy|potato-threshold|qi-bounds|stellar-ledger)\.md/i,
  /shared\/curvature-proxy\.ts/i,
  /server\/helix-proof-pack\.ts/i,
  /server\/helix-core\.ts/i,
  /client\/src\/physics\/curvature\.ts/i,
  /client\/src\/pages\/potato-threshold-lab\.tsx/i,
  /client\/src\/components\/CurvatureLedgerPanel\.tsx/i,
  /client\/src\/components\/DriveGuardsPanel\.tsx/i,
  /client\/src\/components\/WarpLedgerPanel\.tsx/i,
  /client\/src\/components\/QiWidget\.tsx/i,
  /client\/src\/components\/QiAutoTunerPanel\.tsx/i,
  /warp-web\/km-scale-warp-ledger\.html/i,
];

const LEDGER_CORE_FILES: string[] = [
  "docs/ethos/ideology.json",
  "docs/ethos/why.md",
  "docs/knowledge/sun-ledger.md",
  "docs/knowledge/stewardship-ledger.md",
  "docs/knowledge/warp-ledger.md",
  "docs/knowledge/curvature-ledger.md",
  "docs/knowledge/potato-threshold.md",
  "docs/knowledge/qi-bounds.md",
  "docs/knowledge/stellar-ledger.md",
  "docs/knowledge/kappa-proxy.md",
  "shared/curvature-proxy.ts",
  "server/helix-proof-pack.ts",
  "client/src/components/CurvatureLedgerPanel.tsx",
  "client/src/components/DriveGuardsPanel.tsx",
  "client/src/components/WarpLedgerPanel.tsx",
  "client/src/components/QiWidget.tsx",
  "client/src/components/QiAutoTunerPanel.tsx",
  "client/src/pages/potato-threshold-lab.tsx",
  "warp-web/km-scale-warp-ledger.html",
];

const STAR_CORE_PATHS: RegExp[] = [
  /docs\/knowledge\/(star-hydrostatic|stellar-ledger|solar-restoration|potato-threshold|red-giant-phase)\.md/i,
  /client\/src\/pages\/star-hydrostatic-panel\.tsx/i,
  /client\/src\/pages\/star-watcher-panel\.tsx/i,
  /client\/src\/pages\/potato-threshold-lab\.tsx/i,
  /client\/src\/physics\/polytrope\.ts/i,
  /client\/src\/physics\/gamow\.ts/i,
  /docs\/curvature-unit-solar-notes\.md/i,
  /client\/src\/pages\/start\.tsx/i,
];

const STAR_CORE_FILES: string[] = [
  "docs/knowledge/star-hydrostatic.md",
  "docs/knowledge/stellar-ledger.md",
  "docs/knowledge/solar-restoration.md",
  "docs/knowledge/potato-threshold.md",
  "docs/knowledge/red-giant-phase.md",
  "client/src/pages/star-hydrostatic-panel.tsx",
  "client/src/pages/star-watcher-panel.tsx",
  "client/src/pages/potato-threshold-lab.tsx",
  "client/src/physics/polytrope.ts",
  "client/src/physics/gamow.ts",
  "docs/curvature-unit-solar-notes.md",
];

const UI_PATHS: RegExp[] = [
  /client\/src\/components\//i,
  /client\/src\/pages\//i,
  /client\/src\/hooks\//i,
  /client\/src\/lib\//i,
  /client\/src\/assets\//i,
  /client\/src\/index\.css/i,
  /client\/src\/App\.tsx/i,
  /client\/src\/main\.tsx/i,
  /ui\//i,
];

const BACKEND_PATHS: RegExp[] = [
  /server\//i,
  /modules\//i,
  /shared\//i,
  /cli\//i,
  /sdk\//i,
];

const SIMULATION_PATHS: RegExp[] = [
  /simulations\//i,
  /sim_core\//i,
  /modules\/analysis\//i,
  /docs\/knowledge\/physics\//i,
  /client\/src\/physics\//i,
  /docs\/knowledge\/physics\/atomic-systems-tree\.json/i,
  /client\/src\/components\/ElectronOrbitalPanel\.tsx/i,
  /client\/src\/hooks\/useElectronOrbitSim\.ts/i,
  /client\/src\/lib\/atomic-orbitals\.ts/i,
];

const UNCERTAINTY_PATHS: RegExp[] = [
  /docs\/knowledge\/physics\/uncertainty-mechanics-tree\.json/i,
  /docs\/knowledge\/physics\/math-tree\.json/i,
  /docs\/knowledge\/physics\//i,
];

const BRICK_PATHS: RegExp[] = [
  /docs\/knowledge\/physics\/brick-lattice-dataflow-tree\.json/i,
  /modules\/analysis\//i,
  /server\/services\/code-lattice\//i,
];

const LATTICE_PATHS: RegExp[] = [
  /docs\/knowledge\/physics\/brick-lattice-dataflow-tree\.json/i,
  /docs\/knowledge\/resonance-tree\.json/i,
  /server\/services\/code-lattice\//i,
];

const KNOWLEDGE_PATHS: RegExp[] = [
  /docs\/knowledge\//i,
  /server\/services\/knowledge\//i,
  /server\/config\/knowledge\.ts/i,
  /datasets\//i,
  /data\//i,
];

const ESSENCE_PATHS: RegExp[] = [
  /shared\/essence-/i,
  /server\/db\/essence/i,
  /server\/routes\/essence/i,
  /server\/services\/essence/i,
  /client\/src\/pages\/essence/i,
  /client\/src\/components\/agi\/essence\.tsx/i,
];

const LUMA_PATHS: RegExp[] = [
  /server\/services\/luma/i,
  /server\/routes\/luma/i,
  /client\/src\/pages\/luma/i,
  /client\/src\/lib\/luma/i,
  /client\/public\/luma/i,
  /docs\/knowledge\/essence-luma-noise-tree\.json/i,
];

const NOISE_PATHS: RegExp[] = [
  /server\/services\/noisegen/i,
  /server\/routes\/noise-gens/i,
  /client\/src\/pages\/noise/i,
  /client\/src\/types\/noise/i,
  /client\/src\/lib\/api\/noiseGens\.ts/i,
  /modules\/analysis\/noise-field-loop\.ts/i,
  /docs\/knowledge\/essence-luma-noise-tree\.json/i,
];

const HARDWARE_PATHS: RegExp[] = [
  /server\/helix-core\.ts/i,
  /server\/energy-pipeline\.ts/i,
  /server\/services\/hardware\//i,
  /server\/instruments\//i,
  /client\/src\/hooks\/useHardware/i,
  /client\/src\/components\/Hardware/i,
  /docs\/knowledge\/hardware-telemetry-tree\.json/i,
];

const TELEMETRY_PATHS: RegExp[] = [
  /telemetry/i,
  /server\/services\/observability\//i,
  /server\/skills\/telemetry/i,
  /shared\/.*telemetry/i,
  /docs\/knowledge\/hardware-telemetry-tree\.json/i,
];

const CONSOLE_PATHS: RegExp[] = [
  /server\/services\/console-telemetry\//i,
  /server\/_generated\/console-telemetry\.json/i,
  /client\/src\/lib\/agi\/consoleTelemetry\.ts/i,
  /client\/src\/lib\/desktop\//i,
  /docs\/warp-console-architecture\.md/i,
  /server\/routes\/agi\.plan\.ts/i,
];

const LLM_PATHS: RegExp[] = [
  /server\/routes\/small-llm\.ts/i,
  /server\/services\/small-llm\.ts/i,
  /server\/services\/llm\//i,
  /server\/skills\/llm\./i,
  /client\/src\/workers\/llm-worker\.ts/i,
  /client\/src\/lib\/llm\//i,
  /client\/src\/lib\/weights\//i,
  /docs\/warp-llm-contracts\.md/i,
  /docs\/local-llm-windows\.md/i,
  /docs\/tokenizer-guardrails\.md/i,
  /server\/config\/tokenizer-registry\.json/i,
  /tools\/tokenizer-verify\.ts/i,
  /tools\/generate-tokenizer-canary\.ts/i,
  /tests\/tokenizer-canary\.spec\.ts/i,
];

const DEBATE_PATHS: RegExp[] = [
  /server\/services\/debate\//i,
  /server\/routes\/agi\.debate\.ts/i,
  /shared\/essence-debate\.ts/i,
  /server\/skills\/debate\./i,
  /tests\/debate-/i,
  /scripts\/debate-/i,
  /scripts\/plan-exec-with-debate\.mjs/i,
];

const SPECIALISTS_PATHS: RegExp[] = [
  /server\/services\/specialists\//i,
  /server\/specialists\//i,
  /server\/routes\/agi\.specialists\.ts/i,
  /shared\/agi-specialists\.ts/i,
  /tests\/specialists/i,
  /scripts\/specialists-/i,
];

const SECURITY_PATHS: RegExp[] = [
  /server\/security\//i,
  /server\/auth\//i,
  /server\/middleware\/concurrency-guard\.ts/i,
  /server\/routes\/hull\./i,
  /shared\/hull-basis\.ts/i,
  /client\/src\/lib\/hull-/i,
  /docs\/needle-hull-/i,
  /docs\/hull-glb-/i,
  /docs\/guarded-casimir-/i,
  /docs\/qi-guard-/i,
  /docs\/knowledge\/ethos\/no-bypass-guardrail\.md/i,
  /docs\/knowledge\/ethos\/metric-integrity-guardrail\.md/i,
  /docs\/knowledge\/security-hull-guard-tree\.json/i,
];

const SKILLS_PATHS: RegExp[] = [
  /server\/skills\//i,
  /shared\/skills\.ts/i,
  /cli\//i,
  /tools\//i,
  /scripts\//i,
  /skills\//i,
];

const MATERIALS_PATHS: RegExp[] = [
  /docs\/needle-hull-materials\.md/i,
  /docs\/needle-hull-mainframe\.md/i,
  /docs\/hull-glb-next-steps\.md/i,
  /client\/src\/lib\/hull-metrics\.ts/i,
  /client\/src\/lib\/hull-assets\.ts/i,
  /client\/src\/lib\/resolve-hull-dims\.ts/i,
  /client\/src\/components\/needle-hull-preset\.tsx/i,
];

const ENVIRONMENT_PATHS: RegExp[] = [
  /shared\/environment-model\.ts/i,
  /server\/services\/essence\/environment\.ts/i,
  /server\/db\/migrations\/009_essence_environment\.ts/i,
];

const SDK_PATHS: RegExp[] = [
  /sdk\//i,
  /sdk\/src\//i,
  /packages\/create-casimir-verifier\/sdk-example\.mjs/i,
  /examples\/hello-verifier\/adapter-request\.json/i,
];

const PACKAGES_PATHS: RegExp[] = [
  /packages\//i,
  /packages\/create-casimir-verifier\//i,
  /packages\/app-native\//i,
];

const EXTERNAL_PATHS: RegExp[] = [
  /external\//i,
];

const QUEUE_PATHS: RegExp[] = [
  /server\/services\/jobs\//i,
  /server\/services\/queue\//i,
  /server\/services\/scheduler\//i,
  /ops\/queue/i,
  /docs\/knowledge\/queue-orchestration-tree\.json/i,
];

const OPS_PATHS: RegExp[] = [
  /\.github\/workflows\//i,
  /ops\//i,
  /scripts\//i,
  /docker/i,
  /server\/services\/observability\//i,
  /docs\/knowledge\/ops-deployment-tree\.json/i,
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
  let routingMetadata: HelixAskTopicProfile["routingMetadata"];

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
    allowlistTiers.push([
      ...IDEOLOGY_CORE_PATHS,
      ...IDEOLOGY_EXPANDED_PATHS,
      ...IDEOLOGY_KNOWLEDGE_PATHS,
    ]);
    allowlistTiers.push([]);
    boostPaths.push(...IDEOLOGY_CORE_PATHS, ...IDEOLOGY_EXPANDED_PATHS, ...IDEOLOGY_KNOWLEDGE_PATHS);
    mustIncludePaths.push(/docs\/ethos\/ideology\.json/i);
    mustIncludeFiles.push(...IDEOLOGY_CORE_FILES);
    // Avoid warp/energy drift when the user is asking for ideology guidance.
    deboostPaths.push(...WARP_PATHS, ...ENERGY_PATHS);
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("zen_ladder_pack")) {
    allowlistTiers.push(ZEN_LADDER_PACK_PATHS);
    allowlistTiers.push([]);
    boostPaths.push(...ZEN_LADDER_PACK_PATHS);
    mustIncludePaths.push(...ZEN_LADDER_PACK_PATHS);
    mustIncludeFiles.push(...ZEN_LADDER_PACK_FILES);
    deboostPaths.push(...WARP_PATHS, ...ENERGY_PATHS);
    minTierCandidates = Math.max(minTierCandidates, 2);
    routingMetadata = {
      provenance_class: "inferred",
      claim_tier: "diagnostic",
      certifying: false,
    };
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
    mustIncludePaths.push(...STELLAR_FRAMEWORK_REQUIRED_PATHS);
    mustIncludeFiles.push(...STELLAR_FRAMEWORK_REQUIRED_FILES);
    minTierCandidates = Math.max(minTierCandidates, 3);
  }

  const uiTagged = tags.some((tag) => tag === "ui" || tag === "frontend" || tag === "client");
  if (uiTagged) {
    boostPaths.push(...UI_PATHS);
    minTierCandidates = Math.max(minTierCandidates, 2);
    routingMetadata = {
      provenance_class: "inferred",
      claim_tier: "diagnostic",
      certifying: false,
    };
  }

  if (tags.includes("backend")) {
    boostPaths.push(...BACKEND_PATHS);
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("simulation")) {
    boostPaths.push(...SIMULATION_PATHS);
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("uncertainty")) {
    boostPaths.push(...UNCERTAINTY_PATHS);
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("brick")) {
    boostPaths.push(...BRICK_PATHS);
  }

  if (tags.includes("lattice")) {
    boostPaths.push(...LATTICE_PATHS);
  }

  if (tags.includes("knowledge") || tags.includes("rag")) {
    boostPaths.push(...KNOWLEDGE_PATHS);
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("essence")) {
    boostPaths.push(...ESSENCE_PATHS);
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("luma")) {
    boostPaths.push(...LUMA_PATHS);
  }

  if (tags.includes("noise")) {
    boostPaths.push(...NOISE_PATHS);
  }

  if (tags.includes("hardware")) {
    boostPaths.push(...HARDWARE_PATHS);
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("telemetry")) {
    boostPaths.push(...TELEMETRY_PATHS);
  }

  if (tags.includes("console")) {
    boostPaths.push(...CONSOLE_PATHS);
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("llm")) {
    boostPaths.push(...LLM_PATHS);
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("debate")) {
    boostPaths.push(...DEBATE_PATHS);
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("specialists")) {
    boostPaths.push(...SPECIALISTS_PATHS);
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("security")) {
    allowlistTiers.push(SECURITY_PATHS);
    allowlistTiers.push([]);
    boostPaths.push(...SECURITY_PATHS);
    mustIncludePaths.push(...SECURITY_PATHS);
    mustIncludeFiles.push(
      "docs/knowledge/security-hull-guard-tree.json",
      "docs/knowledge/ethos/no-bypass-guardrail.md",
      "docs/knowledge/ethos/metric-integrity-guardrail.md",
    );
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("skills")) {
    boostPaths.push(...SKILLS_PATHS);
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("materials")) {
    boostPaths.push(...MATERIALS_PATHS);
  }

  if (tags.includes("environment")) {
    boostPaths.push(...ENVIRONMENT_PATHS);
  }

  if (tags.includes("sdk")) {
    boostPaths.push(...SDK_PATHS);
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("packages")) {
    boostPaths.push(...PACKAGES_PATHS);
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("external")) {
    boostPaths.push(...EXTERNAL_PATHS);
    minTierCandidates = Math.max(minTierCandidates, 2);
  }

  if (tags.includes("queue") || tags.includes("jobs")) {
    boostPaths.push(...QUEUE_PATHS);
  }

  if (tags.includes("ops") || tags.includes("ci")) {
    boostPaths.push(...OPS_PATHS);
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
    routingMetadata,
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
