import { execFile } from "node:child_process";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { promisify } from "node:util";
import type { HelixAskConceptMatch } from "./concepts";
import type { HelixAskTopicProfile, HelixAskTopicTag } from "./topic";
import { filterSignalTokens, tokenizeAskQuery } from "./query";
import {
  applyStage0HitRate,
  createStage0ScopeMatcher,
  queryHelixAskStage0Index,
  type Stage0Telemetry,
} from "./stage0-index";

const execFileAsync = promisify(execFile);

export type RepoSearchPlan = {
  rawQuestion?: string;
  terms: string[];
  paths: string[];
  explicit: boolean;
  reason: string;
  mode?: "fallback" | "preflight" | "explicit";
  intentDomain?: "general" | "repo" | "hybrid" | "falsifiable";
  intentId?: string | null;
  topicTags?: HelixAskTopicTag[];
  mustIncludeFiles?: string[];
  sessionId?: string | null;
  retrievalMetadata?: RepoSearchRetrievalMetadata;
  fail_reason?: "PACKAGES_EVIDENCE_PROVENANCE_MISSING";
};

export type RepoSearchRetrievalMetadata = {
  provenance_class: "inferred" | "proxy" | "measured";
  claim_tier: "diagnostic" | "reduced-order" | "certified";
  certifying: boolean;
};

export const PACKAGES_RETRIEVAL_FAIL_REASON = "PACKAGES_EVIDENCE_PROVENANCE_MISSING" as const;

const PACKAGES_RETRIEVAL_METADATA: RepoSearchRetrievalMetadata = {
  provenance_class: "inferred",
  claim_tier: "diagnostic",
  certifying: false,
};

export function resolvePackagesRetrievalMetadata(
  tags: HelixAskTopicTag[],
): RepoSearchRetrievalMetadata | null {
  return tags.includes("packages") ? { ...PACKAGES_RETRIEVAL_METADATA } : null;
}

export type RepoSearchHit = {
  filePath: string;
  line: number;
  text: string;
  term: string;
};

export type RepoSearchResult = {
  hits: RepoSearchHit[];
  truncated: boolean;
  error?: string;
  stage0?: Stage0Telemetry;
  stage0_candidates?: string[];
};

export type RepoSearchStage0Telemetry = Stage0Telemetry;

export type GitTrackedRepoSearchResult = RepoSearchResult & {
  terms: string[];
};

const REPO_SEARCH_ENABLED = String(process.env.HELIX_ASK_REPO_SEARCH ?? "1").trim() !== "0";
const REPO_SEARCH_EXPLICIT_ENABLED =
  String(process.env.HELIX_ASK_REPO_SEARCH_EXPLICIT ?? "1").trim() !== "0";
const REPO_SEARCH_ON_EVIDENCE_FAIL =
  String(process.env.HELIX_ASK_REPO_SEARCH_ON_EVIDENCE_FAIL ?? "1").trim() !== "0";
const REPO_SEARCH_PREFLIGHT_ENABLED =
  String(process.env.HELIX_ASK_REPO_SEARCH_PREFLIGHT ?? "1").trim() !== "0";
const REPO_SEARCH_PREFLIGHT_MAX_TERMS = Math.max(
  1,
  Number(process.env.HELIX_ASK_REPO_SEARCH_PREFLIGHT_MAX_TERMS ?? 2),
);
const REPO_SEARCH_MAX_TERMS = Math.max(1, Number(process.env.HELIX_ASK_REPO_SEARCH_MAX_TERMS ?? 4));
const REPO_SEARCH_MAX_PER_TERM = Math.max(
  1,
  Number(process.env.HELIX_ASK_REPO_SEARCH_MAX_PER_TERM ?? 20),
);
const REPO_SEARCH_MAX_TOTAL = Math.max(
  REPO_SEARCH_MAX_PER_TERM,
  Number(process.env.HELIX_ASK_REPO_SEARCH_MAX_TOTAL ?? 60),
);
const REPO_SEARCH_TIMEOUT_MS = Math.max(
  1000,
  Number(process.env.HELIX_ASK_REPO_SEARCH_TIMEOUT_MS ?? 4000),
);
const REPO_SEARCH_MAX_LINE_CHARS = Math.max(
  80,
  Number(process.env.HELIX_ASK_REPO_SEARCH_MAX_LINE_CHARS ?? 180),
);
const GIT_TRACKED_SCAN_ENABLED =
  String(process.env.HELIX_ASK_GIT_TRACKED_SCAN ?? "1").trim() !== "0";
const GIT_TRACKED_SCAN_SCRIPT = path.resolve(
  process.cwd(),
  "scripts/helix_ask_git_tracked_scan.py",
);
const GIT_TRACKED_SCAN_MAX_TERMS = Math.max(
  1,
  Number(process.env.HELIX_ASK_GIT_TRACKED_SCAN_MAX_TERMS ?? 4),
);
const GIT_TRACKED_SCAN_MAX_PER_TERM = Math.max(
  1,
  Number(process.env.HELIX_ASK_GIT_TRACKED_SCAN_MAX_PER_TERM ?? 6),
);
const GIT_TRACKED_SCAN_MAX_HITS = Math.max(
  GIT_TRACKED_SCAN_MAX_PER_TERM,
  Number(process.env.HELIX_ASK_GIT_TRACKED_SCAN_MAX_HITS ?? 24),
);
const GIT_TRACKED_SCAN_TIMEOUT_MS = Math.max(
  1000,
  Number(process.env.HELIX_ASK_GIT_TRACKED_SCAN_TIMEOUT_MS ?? 7000),
);
const STAGE0_QUERY_MAX_CANDIDATES = Math.max(
  16,
  Number(process.env.HELIX_ASK_STAGE0_MAX_CANDIDATES ?? 256),
);
const STAGE0_CANARY_DEFAULT_PCT = 10;
const STAGE0_ROLLOUT_MODE_SET = new Set(["off", "shadow", "partial", "full"]);
const STAGE0_ACTIVE_MODE_SET = new Set(
  String(process.env.HELIX_ASK_STAGE0_ACTIVE_MODES ?? "fallback")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean),
);
const STAGE0_EXCLUDED_INTENT_SET = new Set(
  String(
    process.env.HELIX_ASK_STAGE0_EXCLUDED_INTENTS ??
      "hybrid.warp_ethos_relation,repo.ideology_reference",
  )
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean),
);
const STAGE0_ACTIVE_QUERY_BLOCKLIST = String(
  process.env.HELIX_ASK_STAGE0_ACTIVE_QUERY_BLOCKLIST ??
    "ideology,mission ethos,retrieval confidence and deterministic contract signal thresholds",
)
  .split(",")
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);
const STAGE0_ACTIVE_DOMAIN_SET = new Set(
  String(
    process.env.HELIX_ASK_STAGE0_ACTIVE_DOMAINS ?? "general,repo,hybrid,falsifiable",
  )
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean),
);

type Stage0RolloutMode = "off" | "shadow" | "partial" | "full";

type Stage0PolicyDecision = {
  mode: Stage0RolloutMode;
  canaryHit: boolean;
  policyDecision: string;
  failOpenReason: string | null;
};
const FILE_PATH_HINT_PATTERN =
  "(?:[a-z]:[\\\\/]|\\.{1,2}[\\\\/]|/)?[a-z0-9._-]+(?:[\\\\/][a-z0-9._-]+)+(?:\\.[a-z0-9]{1,8})?";
const REPO_TOP_LEVEL_PATH_HINTS = new Set([
  "server",
  "client",
  "modules",
  "shared",
  "scripts",
  "docs",
  "tests",
  "tools",
  "configs",
  "packages",
  "external",
  "public",
  "assets",
  "ui",
]);

const EXPLICIT_SEARCH_RE =
  /\b(git\s+grep|ripgrep|rg|repo\s+search|search\s+repo|find\s+in\s+repo|grep\s+the\s+repo)\b/i;

const DEFAULT_REPO_SEARCH_PATHS: string[] = ["docs", "server", "modules", "shared", "client/src"];

const REPO_SEARCH_PATHS_BY_TAG: Record<HelixAskTopicTag, string[]> = {
  ideology: ["docs/ethos", "docs/knowledge/ethos", "server/services/ideology", "shared/ideology"],
  zen_ladder_pack: ["docs/ethos", "docs/knowledge/ethos", "docs/zen-ladder-pack"],
  helix_ask: [
    "server/services/helix-ask",
    "server/routes/agi.plan.ts",
    "docs/helix-ask-flow.md",
    "client/src/components/helix",
    "client/src/lib/agi",
  ],
  concepts: ["server/services/helix-ask", "docs/knowledge"],
  warp: ["modules/warp", "docs/warp", "docs/knowledge/warp"],
  physics: ["docs/knowledge/physics", "docs/knowledge/warp", "modules/core", "shared"],
  ledger: ["docs/knowledge", "server/helix-proof-pack.ts", "shared/curvature-proxy.ts"],
  star: ["docs/knowledge", "client/src/physics", "client/src/pages"],
  energy_pipeline: ["server/energy-pipeline.ts", "client/src/components/energy-pipeline.tsx"],
  trace: ["docs/TRACE-API.md", "server/db/agi", "client/src/components/agi"],
  resonance: ["server/_generated", "docs/knowledge", "client/src/components/Resonance"],
  ui: [
    "client/src/components",
    "client/src/pages",
    "client/src/hooks",
    "client/src/lib",
    "ui",
    "docs/knowledge/ui-components-tree.json",
    "docs/knowledge/ui-backend-binding-tree.json",
  ],
  frontend: [
    "client/src/components",
    "client/src/pages",
    "client/src/hooks",
    "client/src/lib",
    "ui",
  ],
  client: [
    "client/src/components",
    "client/src/pages",
    "client/src/hooks",
    "client/src/lib",
    "ui",
  ],
  backend: ["server", "modules", "shared", "server/helix-core.ts", "server/routes.ts"],
  simulation: [
    "simulations",
    "sim_core",
    "modules/analysis",
    "docs/knowledge/physics",
    "client/src/physics",
  ],
  uncertainty: [
    "docs/knowledge/physics",
    "docs/knowledge/physics/uncertainty-mechanics-tree.json",
    "docs/knowledge/certainty-framework-tree.json",
  ],
  brick: [
    "docs/knowledge/physics/brick-lattice-dataflow-tree.json",
    "modules/analysis",
    "server/services/code-lattice",
  ],
  lattice: [
    "server/services/code-lattice",
    "docs/knowledge/resonance-tree.json",
    "docs/knowledge/physics/brick-lattice-dataflow-tree.json",
  ],
  knowledge: [
    "docs/knowledge",
    "server/services/knowledge",
    "server/config/knowledge.ts",
    "datasets",
    "data",
  ],
  rag: ["docs/knowledge", "server/services/knowledge", "datasets", "data"],
  essence: [
    "shared/essence-schema.ts",
    "shared/essence-persona.ts",
    "server/db/essence.ts",
    "server/db/essenceProfile.ts",
    "server/routes/essence.ts",
    "server/routes/essence.prompts.ts",
    "server/services/essence",
    "client/src/pages/essence-render.tsx",
  ],
  luma: [
    "server/services/luma.ts",
    "server/routes/luma.ts",
    "client/src/pages/luma.tsx",
    "client/src/lib/luma-client.ts",
    "docs/knowledge/essence-luma-noise-tree.json",
  ],
  noise: [
    "server/services/noisegen-store.ts",
    "server/routes/noise-gens.ts",
    "client/src/pages/noisegen.tsx",
    "client/src/pages/helix-noise-gens.tsx",
    "client/src/types/noise-gens.ts",
    "modules/analysis/noise-field-loop.ts",
    "docs/knowledge/essence-luma-noise-tree.json",
  ],
  hardware: [
    "server/helix-core.ts",
    "server/energy-pipeline.ts",
    "server/services/hardware",
    "server/instruments",
    "client/src/hooks/useHardwareFeeds.ts",
    "client/src/components/HardwareConnectModal.tsx",
    "docs/knowledge/hardware-telemetry-tree.json",
  ],
  telemetry: [
    "server/services/observability",
    "server/skills/telemetry.badges.ts",
    "server/skills/telemetry.panels.ts",
    "shared/badge-telemetry.ts",
    "shared/star-telemetry.ts",
    "docs/knowledge/hardware-telemetry-tree.json",
  ],
  console: [
    "server/services/console-telemetry",
    "server/_generated/console-telemetry.json",
    "client/src/lib/agi/consoleTelemetry.ts",
    "client/src/lib/desktop",
    "docs/warp-console-architecture.md",
  ],
  llm: [
    "server/routes/small-llm.ts",
    "server/services/small-llm.ts",
    "server/services/llm",
    "server/skills/llm.local.ts",
    "server/skills/llm.http.ts",
    "server/skills/llm.local.spawn.ts",
    "client/src/workers/llm-worker.ts",
    "client/src/lib/llm",
    "client/src/lib/weights",
    "docs/warp-llm-contracts.md",
    "docs/tokenizer-guardrails.md",
    "server/config/tokenizer-registry.json",
    "tools/tokenizer-verify.ts",
  ],
  debate: [
    "server/services/debate",
    "server/routes/agi.debate.ts",
    "shared/essence-debate.ts",
    "server/skills/debate.run.ts",
    "server/skills/debate.checklist.generate.ts",
    "server/skills/debate.checklist.score.ts",
    "tests/debate-search.spec.ts",
    "tests/debate-orchestrator.spec.ts",
    "tests/debate-sse.spec.ts",
    "scripts/debate-harness.mjs",
  ],
  specialists: [
    "server/specialists",
    "server/services/specialists",
    "server/routes/agi.specialists.ts",
    "shared/agi-specialists.ts",
    "tests/specialists.evolution.spec.ts",
    "tests/specialists.math.spec.ts",
    "scripts/specialists-mini-loop.ts",
  ],
  security: [
    "server/security",
    "server/auth",
    "server/middleware/concurrency-guard.ts",
    "server/routes/hull.status.ts",
    "server/routes/hull.capsules.ts",
    "server/routes/hull-preview.ts",
    "shared/hull-basis.ts",
    "client/src/lib/hull-guardrails.ts",
    "docs/qi-guard-consolidation.md",
    "docs/guarded-casimir-tile-code-mapped.md",
    "docs/needle-hull-materials.md",
    "docs/needle-hull-mainframe.md",
  ],
  skills: ["server/skills", "shared/skills.ts", "cli", "tools", "scripts"],
  materials: [
    "docs/needle-hull-materials.md",
    "docs/needle-hull-mainframe.md",
    "docs/hull-glb-next-steps.md",
    "client/src/lib/hull-metrics.ts",
    "client/src/lib/hull-assets.ts",
    "client/src/components/needle-hull-preset.tsx",
  ],
  environment: [
    "shared/environment-model.ts",
    "server/services/essence/environment.ts",
    "server/db/migrations/009_essence_environment.ts",
  ],
  sdk: [
    "sdk",
    "sdk/src",
    "sdk/README.md",
    "packages/create-casimir-verifier/sdk-example.mjs",
    "examples/hello-verifier/adapter-request.json",
  ],
  packages: [
    "packages",
    "packages/create-casimir-verifier",
    "packages/app-native",
  ],
  external: [
    "external",
  ],
  queue: ["server/services/jobs", "ops", "docs/knowledge/queue-orchestration-tree.json"],
  jobs: ["server/services/jobs", "ops", "docs/knowledge/queue-orchestration-tree.json"],
  ops: [
    ".github/workflows",
    "ops",
    "scripts",
    "docker-compose.observability.yml",
    "docs/knowledge/ops-deployment-tree.json",
  ],
  ci: [".github/workflows", "scripts", "ops"],
};

const EXCLUDE_GLOBS: string[] = [
  "!**/*.test.*",
  "!**/*.spec.*",
  "!**/*.snap",
  "!**/*.map",
  "!**/node_modules/**",
  "!**/dist/**",
  "!**/build/**",
  "!**/.git/**",
  "!**/server/_generated/**",
];

const sanitizeSearchTerm = (value: string): string => {
  const cleaned = value
    .toLowerCase()
    .replace(/[^\p{L}\p{N} _.-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned;
};

const CJK_TOKEN_RE = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/u;

const minRepoTermLength = (token: string): number => (CJK_TOKEN_RE.test(token) ? 2 : 4);

const LOW_VALUE_PHRASE_TOKEN_RE = /^(work|works?|working|does|how|what|where|when|why|explain)$/;
const LOW_VALUE_UNIGRAM_RE = /^(work|works?|working|does|how|what|where|when|why|explain)$/;

const HIGH_SIGNAL_UNIGRAM_RANK = new Map<string, number>([
  ["helix", 0],
  ["routing", 1],
  ["pipeline", 2],
  ["retrieval", 3],
  ["rerank", 4],
  ["arbiter", 5],
  ["evidence", 6],
  ["citation", 7],
  ["repo", 8],
  ["module", 9],
  ["path", 10],
  ["intent", 11],
]);

const isLowValueGluePhrase = (phrase: string): boolean => {
  const parts = phrase.split(" ").filter(Boolean);
  if (parts.length !== 2) return false;
  const [left, right] = parts;
  return LOW_VALUE_PHRASE_TOKEN_RE.test(left ?? "") || LOW_VALUE_PHRASE_TOKEN_RE.test(right ?? "");
};

const rankUnigrams = (values: string[]): string[] =>
  [...values].sort((a, b) => {
    const rankA = HIGH_SIGNAL_UNIGRAM_RANK.get(a) ?? Number.MAX_SAFE_INTEGER;
    const rankB = HIGH_SIGNAL_UNIGRAM_RANK.get(b) ?? Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) return rankA - rankB;
    if (a.length !== b.length) return b.length - a.length;
    return a.localeCompare(b);
  });

export function extractRepoSearchTerms(
  question: string,
  conceptMatch?: HelixAskConceptMatch | null,
): string[] {
  const phraseTerms: string[] = [];
  const normalizedQuestion = sanitizeSearchTerm(question);
  if (/\bhelix ask\b/i.test(normalizedQuestion)) phraseTerms.push("helix ask");
  const unigramTerms: string[] = [];
  if (conceptMatch?.matchedTerm) {
    const normalized = sanitizeSearchTerm(conceptMatch.matchedTerm);
    if (normalized) phraseTerms.push(normalized);
  }
  const tokens = filterSignalTokens(tokenizeAskQuery(question)).map((token) =>
    sanitizeSearchTerm(token),
  );
  for (let i = 0; i < tokens.length - 1; i += 1) {
    const left = tokens[i] ?? "";
    const right = tokens[i + 1] ?? "";
    if (left.length < minRepoTermLength(left) || right.length < minRepoTermLength(right)) continue;
    const phrase = sanitizeSearchTerm(`${left} ${right}`);
    const minPhraseLength = CJK_TOKEN_RE.test(left) || CJK_TOKEN_RE.test(right) ? 4 : 9;
    if (phrase.length < minPhraseLength) continue;
    if (isLowValueGluePhrase(phrase)) continue;
    phraseTerms.push(phrase);
  }
  for (const token of tokens) {
    if (!token) continue;
    if (token.length < minRepoTermLength(token)) continue;
    if (/^\d+$/.test(token)) continue;
    if (LOW_VALUE_UNIGRAM_RE.test(token)) continue;
    unigramTerms.push(token);
  }

  const dedupe = (values: string[]): string[] => {
    const deduped: string[] = [];
    const seen = new Set<string>();
    for (const value of values) {
      if (seen.has(value)) continue;
      seen.add(value);
      deduped.push(value);
    }
    return deduped;
  };

  const uniquePhrases = dedupe(phraseTerms);
  const uniqueUnigrams = dedupe(unigramTerms);

  const phraseCap = Math.max(1, REPO_SEARCH_MAX_TERMS - 1);
  const selectedPhrases = uniquePhrases.slice(0, phraseCap);
  const selectedPhraseTokenSet = new Set<string>();
  for (const phrase of selectedPhrases) {
    for (const part of phrase.split(" ")) {
      if (part) selectedPhraseTokenSet.add(part);
    }
  }
  const nonCoveredUnigrams = rankUnigrams(
    uniqueUnigrams.filter((term) => !selectedPhraseTokenSet.has(term)),
  );
  const coveredUnigrams = rankUnigrams(
    uniqueUnigrams.filter((term) => selectedPhraseTokenSet.has(term)),
  );
  const prioritizedUnigrams = [
    ...nonCoveredUnigrams,
    ...coveredUnigrams,
  ];
  const combined = dedupe([...selectedPhrases, ...prioritizedUnigrams]);
  return combined.slice(0, REPO_SEARCH_MAX_TERMS);
}

export function selectRepoSearchPaths(
  tags: HelixAskTopicTag[],
  mustIncludeFiles?: string[],
): string[] {
  const paths = new Set<string>();
  for (const tag of tags) {
    for (const pathEntry of REPO_SEARCH_PATHS_BY_TAG[tag] ?? []) {
      paths.add(pathEntry);
    }
  }
  if (mustIncludeFiles?.length) {
    for (const filePath of mustIncludeFiles) {
      if (filePath) paths.add(filePath);
    }
  }
  if (paths.size === 0) {
    for (const entry of DEFAULT_REPO_SEARCH_PATHS) paths.add(entry);
  }
  const filtered = Array.from(paths).filter((entry) => {
    if (!entry) return false;
    const resolved = path.resolve(process.cwd(), entry);
    return fs.existsSync(resolved);
  });
  return filtered;
}

export function buildRepoSearchPlan(input: {
  question: string;
  topicTags: HelixAskTopicTag[];
  conceptMatch?: HelixAskConceptMatch | null;
  intentDomain: "general" | "repo" | "hybrid" | "falsifiable";
  intentId?: string | null;
  sessionId?: string | null;
  evidenceGateOk: boolean;
  promptIngested?: boolean;
  topicProfile?: HelixAskTopicProfile | null;
  mode?: "fallback" | "preflight" | "explicit";
  strictProvenance?: boolean;
}): RepoSearchPlan | null {
  if (!REPO_SEARCH_ENABLED) return null;
  const explicit = REPO_SEARCH_EXPLICIT_ENABLED && EXPLICIT_SEARCH_RE.test(input.question);
  const mode = explicit ? "explicit" : input.mode ?? "fallback";
  if (mode === "preflight" && !REPO_SEARCH_PREFLIGHT_ENABLED) return null;
  if (input.promptIngested && !explicit && mode !== "preflight") return null;
  if (input.promptIngested && mode === "preflight" && !explicit) return null;
  const domainOk = input.intentDomain === "repo" || input.intentDomain === "hybrid";
  const fallbackOk = REPO_SEARCH_ON_EVIDENCE_FAIL && !input.evidenceGateOk;
  if (!explicit && mode === "fallback" && !fallbackOk) return null;
  if (!explicit && mode === "fallback" && !domainOk) return null;
  const terms = extractRepoSearchTerms(input.question, input.conceptMatch);
  if (terms.length === 0) return null;
  const clippedTerms =
    mode === "preflight" ? terms.slice(0, REPO_SEARCH_PREFLIGHT_MAX_TERMS) : terms;
  const paths = selectRepoSearchPaths(input.topicTags, input.topicProfile?.mustIncludeFiles);
  if (paths.length === 0) return null;
  const retrievalMetadata = resolvePackagesRetrievalMetadata(input.topicTags);
  return {
    rawQuestion: input.question,
    terms: clippedTerms,
    paths,
    explicit,
    reason: explicit ? "explicit_request" : mode === "preflight" ? "preflight" : "evidence_gate_fail",
    mode,
    intentDomain: input.intentDomain,
    intentId: input.intentId ?? null,
    topicTags: input.topicTags.slice(),
    mustIncludeFiles: input.topicProfile?.mustIncludeFiles?.slice() ?? [],
    sessionId: input.sessionId ?? null,
    retrievalMetadata: retrievalMetadata ?? undefined,
    fail_reason:
      input.strictProvenance && input.topicTags.includes("packages") && !retrievalMetadata
        ? PACKAGES_RETRIEVAL_FAIL_REASON
        : undefined,
  };
}

const clipLine = (value: string): string => {
  const trimmed = value.replace(/\r?\n/g, " ").trim();
  if (trimmed.length <= REPO_SEARCH_MAX_LINE_CHARS) return trimmed;
  return `${trimmed.slice(0, REPO_SEARCH_MAX_LINE_CHARS - 3)}...`;
};

const normalizeRepoPath = (value: string): string =>
  value.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "").trim();

const dedupePaths = (entries: string[]): string[] => {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    const normalized = normalizeRepoPath(entry);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
  }
  return out;
};

const parseStage0RolloutMode = (): Stage0RolloutMode => {
  const raw = String(process.env.HELIX_ASK_STAGE0_ROLLOUT_MODE ?? "")
    .trim()
    .toLowerCase();
  if (STAGE0_ROLLOUT_MODE_SET.has(raw)) {
    return raw as Stage0RolloutMode;
  }
  const enabled = String(process.env.HELIX_ASK_STAGE0_ENABLED ?? "0").trim() !== "0";
  if (!enabled) return "off";
  const shadowOnly = String(process.env.HELIX_ASK_STAGE0_SHADOW ?? "1").trim() !== "0";
  if (shadowOnly) return "shadow";
  const partialActive = String(process.env.HELIX_ASK_STAGE0_PARTIAL_ACTIVE ?? "1").trim() !== "0";
  return partialActive ? "partial" : "full";
};

const readStage0CanaryPct = (): number => {
  const raw = Number(process.env.HELIX_ASK_STAGE0_CANARY_PCT ?? STAGE0_CANARY_DEFAULT_PCT);
  if (!Number.isFinite(raw)) return STAGE0_CANARY_DEFAULT_PCT;
  return Math.max(0, Math.min(100, Math.trunc(raw)));
};

const stage0CanaryBucket = (seed: string): number => {
  const digest = crypto.createHash("sha256").update(seed).digest("hex");
  const first32 = Number.parseInt(digest.slice(0, 8), 16);
  if (!Number.isFinite(first32)) return 0;
  return Math.max(0, first32 % 100);
};

const resolveStage0CanaryHit = (
  sessionId: string | null | undefined,
  fallbackSeed: string,
  canaryPct: number,
): boolean => {
  if (canaryPct <= 0) return false;
  if (canaryPct >= 100) return true;
  const seed = String(sessionId ?? "").trim() || fallbackSeed;
  if (!seed) return false;
  return stage0CanaryBucket(seed) < canaryPct;
};

const withStage0PolicyTelemetry = (
  telemetry: Stage0Telemetry,
  policy: Stage0PolicyDecision,
): Stage0Telemetry => ({
  ...telemetry,
  rollout_mode: policy.mode,
  canary_hit: policy.canaryHit,
  policy_decision: policy.policyDecision,
  fail_open_reason: telemetry.used ? null : policy.failOpenReason ?? telemetry.fallback_reason ?? null,
});

const withSoftMustIncludeTelemetry = (
  telemetry: Stage0Telemetry,
  softMustIncludeApplied: boolean,
): Stage0Telemetry => ({
  ...telemetry,
  soft_must_include_applied: softMustIncludeApplied,
});

const stage0BypassTelemetry = (reason: string, policy: Stage0PolicyDecision): Stage0Telemetry =>
  withStage0PolicyTelemetry(
    {
      used: false,
      shadow_only: false,
      candidate_count: 0,
      hit_rate: 0,
      fallback_reason: reason,
      build_age_ms: null,
      commit: null,
      soft_must_include_applied: false,
    },
    { ...policy, failOpenReason: reason, policyDecision: reason },
  );

const trimPathTokenDelimiters = (value: string): string =>
  value
    .trim()
    .replace(/^[\s"'`([{<]+/, "")
    .replace(/[\s"'`)\]}>.,:;!?]+$/, "");

const normalizePathToken = (value: string): string =>
  trimPathTokenDelimiters(value).replace(/\\/g, "/");

const hasRepoTopLevelPathHint = (normalizedPath: string): boolean => {
  const stripped = normalizedPath
    .replace(/^[a-z]:\//i, "")
    .replace(/^\/+/, "")
    .replace(/^\.\//, "")
    .replace(/^\.\.\//, "");
  const root = stripped.split("/")[0]?.trim().toLowerCase() ?? "";
  return root.length > 0 && REPO_TOP_LEVEL_PATH_HINTS.has(root);
};

const pathTokenTargetsRepo = (token: string): boolean => {
  const normalized = normalizePathToken(token);
  if (!normalized || !normalized.includes("/")) return false;
  if (normalized.includes("://")) return false;
  if (hasRepoTopLevelPathHint(normalized)) return true;
  if (normalized.startsWith("./") || normalized.startsWith("../")) return true;
  try {
    if (/^[a-z]:\//i.test(normalized) || normalized.startsWith("/")) {
      return fs.existsSync(path.resolve(normalized));
    }
    return fs.existsSync(path.resolve(process.cwd(), normalized));
  } catch {
    return false;
  }
};

const hasExplicitPathCue = (value: string): boolean => {
  if (!value.trim()) return false;
  const matcher = new RegExp(FILE_PATH_HINT_PATTERN, "gi");
  for (const match of value.matchAll(matcher)) {
    const token = String(match[0] ?? "");
    if (!token) continue;
    if (pathTokenTargetsRepo(token)) return true;
  }
  return false;
};

const hasMustIncludeConstraints = (mustIncludeFiles?: string[]): boolean =>
  Boolean(mustIncludeFiles?.some((entry) => String(entry ?? "").trim().length > 0));

const queryBlockedForActiveStage0 = (value: string): boolean => {
  const lower = value.toLowerCase();
  return STAGE0_ACTIVE_QUERY_BLOCKLIST.some((token) => token && lower.includes(token));
};

const resolveStage0PartialExcludeReason = (args: {
  mode?: string;
  intentDomain?: string;
  intentId?: string | null;
  topicTags?: HelixAskTopicTag[];
  query: string;
}): string | null => {
  const mode = String(args.mode ?? "fallback").trim().toLowerCase();
  if (!STAGE0_ACTIVE_MODE_SET.has(mode)) return "stage0_mode_excluded";
  const domain = String(args.intentDomain ?? "").trim().toLowerCase();
  if (STAGE0_ACTIVE_DOMAIN_SET.size > 0) {
    if (!domain || !STAGE0_ACTIVE_DOMAIN_SET.has(domain)) return "stage0_domain_excluded";
  }
  if ((args.topicTags ?? []).includes("ideology")) return "stage0_ideology_excluded";
  const intentId = String(args.intentId ?? "").trim().toLowerCase();
  if (intentId && STAGE0_EXCLUDED_INTENT_SET.has(intentId)) return "stage0_intent_excluded";
  if (queryBlockedForActiveStage0(args.query)) return "stage0_query_blocked";
  return null;
};

const resolveStage0PolicyForRepoPlan = (
  plan: RepoSearchPlan,
  query: string,
): Stage0PolicyDecision => {
  const mode = parseStage0RolloutMode();
  if (mode === "off") {
    return {
      mode,
      canaryHit: false,
      policyDecision: "stage0_rollout_off",
      failOpenReason: "stage0_rollout_off",
    };
  }
  if (mode === "shadow") {
    return {
      mode,
      canaryHit: false,
      policyDecision: "stage0_shadow_mode",
      failOpenReason: "stage0_shadow_mode",
    };
  }
  const canaryPct = readStage0CanaryPct();
  const canaryHit = resolveStage0CanaryHit(plan.sessionId, `repo:${query}`, canaryPct);
  if (!canaryHit) {
    return {
      mode,
      canaryHit: false,
      policyDecision: "stage0_canary_holdout",
      failOpenReason: "stage0_canary_holdout",
    };
  }
  if (mode === "partial") {
    const partialExclude = resolveStage0PartialExcludeReason({
      mode: plan.mode,
      intentDomain: plan.intentDomain,
      intentId: plan.intentId,
      topicTags: plan.topicTags,
      query,
    });
    if (partialExclude) {
      return {
        mode,
        canaryHit,
        policyDecision: partialExclude,
        failOpenReason: partialExclude,
      };
    }
  }
  return {
    mode,
    canaryHit,
    policyDecision: "stage0_active",
    failOpenReason: null,
  };
};

const resolveHardBypassReasonForRepoPlan = (plan: RepoSearchPlan): string | null => {
  if (plan.explicit || plan.mode === "explicit") return "explicit_repo_query";
  const question = String(plan.rawQuestion ?? "").trim();
  if (question && hasExplicitPathCue(question)) return "explicit_path_query";
  if (!question) {
    const joined = plan.terms.join(" ");
    if (joined && hasExplicitPathCue(joined)) return "explicit_path_query";
  }
  return null;
};

const resolveHardBypassReasonForGitTracked = (input: {
  query: string;
  sourceQuestion?: string;
  mustIncludeFiles?: string[];
}): string | null => {
  if (hasExplicitPathCue(String(input.sourceQuestion ?? ""))) return "explicit_path_query";
  if (hasExplicitPathCue(input.query)) return "explicit_path_query";
  return null;
};

const resolveStage0PolicyForGitTracked = (input: {
  query: string;
  mode?: "fallback" | "preflight" | "explicit";
  intentDomain?: "general" | "repo" | "hybrid" | "falsifiable";
  intentId?: string | null;
  topicTags?: HelixAskTopicTag[];
  sessionId?: string | null;
}): Stage0PolicyDecision => {
  const mode = parseStage0RolloutMode();
  if (mode === "off") {
    return {
      mode,
      canaryHit: false,
      policyDecision: "stage0_rollout_off",
      failOpenReason: "stage0_rollout_off",
    };
  }
  if (mode === "shadow") {
    return {
      mode,
      canaryHit: false,
      policyDecision: "stage0_shadow_mode",
      failOpenReason: "stage0_shadow_mode",
    };
  }
  const canaryPct = readStage0CanaryPct();
  const canaryHit = resolveStage0CanaryHit(input.sessionId, `git:${input.query}`, canaryPct);
  if (!canaryHit) {
    return {
      mode,
      canaryHit: false,
      policyDecision: "stage0_canary_holdout",
      failOpenReason: "stage0_canary_holdout",
    };
  }
  if (mode === "partial") {
    const partialExclude = resolveStage0PartialExcludeReason({
      mode: input.mode,
      intentDomain: input.intentDomain,
      intentId: input.intentId,
      topicTags: input.topicTags,
      query: input.query,
    });
    if (partialExclude) {
      return {
        mode,
        canaryHit,
        policyDecision: partialExclude,
        failOpenReason: partialExclude,
      };
    }
  }
  return {
    mode,
    canaryHit,
    policyDecision: "stage0_active",
    failOpenReason: null,
  };
};

type Stage0PrefilterResult = {
  candidates: string[];
  telemetry: Stage0Telemetry;
};

const resolveRepoSearchStage0Prefilter = async (plan: RepoSearchPlan): Promise<Stage0PrefilterResult> => {
  const rolloutMode = parseStage0RolloutMode();
  const softMustIncludeApplied = hasMustIncludeConstraints(plan.mustIncludeFiles);
  const hardBypass = resolveHardBypassReasonForRepoPlan(plan);
  if (hardBypass) {
    return {
      candidates: [],
      telemetry: withSoftMustIncludeTelemetry(
        stage0BypassTelemetry(hardBypass, {
          mode: rolloutMode,
          canaryHit: false,
          policyDecision: hardBypass,
          failOpenReason: hardBypass,
        }),
        softMustIncludeApplied,
      ),
    };
  }
  if (rolloutMode === "off") {
    return {
      candidates: [],
      telemetry: withSoftMustIncludeTelemetry(
        stage0BypassTelemetry("stage0_rollout_off", {
          mode: rolloutMode,
          canaryHit: false,
          policyDecision: "stage0_rollout_off",
          failOpenReason: "stage0_rollout_off",
        }),
        softMustIncludeApplied,
      ),
    };
  }
  const query = Array.from(new Set(plan.terms.map((entry) => entry.trim()).filter(Boolean))).join(" ");
  const policy = resolveStage0PolicyForRepoPlan(plan, query);
  const pathScopeMatcher = createStage0ScopeMatcher(plan.paths);
  const stage0Result = await queryHelixAskStage0Index({
    query,
    maxCandidates: STAGE0_QUERY_MAX_CANDIDATES,
    pathScopeMatcher,
  });
  const candidates = dedupePaths(stage0Result.candidates.map((entry) => entry.filePath));
  if (policy.failOpenReason) {
    const fallbackReason =
      candidates.length > 0
        ? policy.failOpenReason
        : stage0Result.telemetry.fallback_reason ?? policy.failOpenReason;
    return {
      candidates,
      telemetry: withSoftMustIncludeTelemetry(
        withStage0PolicyTelemetry(
          {
            ...stage0Result.telemetry,
            used: false,
            shadow_only: true,
            fallback_reason: fallbackReason,
          },
          policy,
        ),
        softMustIncludeApplied,
      ),
    };
  }
  return {
    candidates,
    telemetry: withSoftMustIncludeTelemetry(
      withStage0PolicyTelemetry(stage0Result.telemetry, policy),
      softMustIncludeApplied,
    ),
  };
};

const resolveGitTrackedStage0Prefilter = async (input: {
  query: string;
  sourceQuestion?: string;
  allowlist?: RegExp[];
  avoidlist?: RegExp[];
  maxHits: number;
  mustIncludeFiles?: string[];
  mode?: "fallback" | "preflight" | "explicit";
  intentDomain?: "general" | "repo" | "hybrid" | "falsifiable";
  intentId?: string | null;
  topicTags?: HelixAskTopicTag[];
  sessionId?: string | null;
}): Promise<Stage0PrefilterResult> => {
  const rolloutMode = parseStage0RolloutMode();
  const softMustIncludeApplied = hasMustIncludeConstraints(input.mustIncludeFiles);
  const hardBypass = resolveHardBypassReasonForGitTracked(input);
  if (hardBypass) {
    return {
      candidates: [],
      telemetry: withSoftMustIncludeTelemetry(
        stage0BypassTelemetry(hardBypass, {
          mode: rolloutMode,
          canaryHit: false,
          policyDecision: hardBypass,
          failOpenReason: hardBypass,
        }),
        softMustIncludeApplied,
      ),
    };
  }
  if (rolloutMode === "off") {
    return {
      candidates: [],
      telemetry: withSoftMustIncludeTelemetry(
        stage0BypassTelemetry("stage0_rollout_off", {
          mode: rolloutMode,
          canaryHit: false,
          policyDecision: "stage0_rollout_off",
          failOpenReason: "stage0_rollout_off",
        }),
        softMustIncludeApplied,
      ),
    };
  }
  const policy = resolveStage0PolicyForGitTracked(input);
  const stage0Result = await queryHelixAskStage0Index({
    query: input.query,
    maxCandidates: Math.max(input.maxHits * 4, STAGE0_QUERY_MAX_CANDIDATES),
    allowlist: input.allowlist,
    avoidlist: input.avoidlist,
  });
  const candidates = dedupePaths(stage0Result.candidates.map((entry) => entry.filePath));
  if (policy.failOpenReason) {
    const fallbackReason =
      candidates.length > 0
        ? policy.failOpenReason
        : stage0Result.telemetry.fallback_reason ?? policy.failOpenReason;
    return {
      candidates,
      telemetry: withSoftMustIncludeTelemetry(
        withStage0PolicyTelemetry(
          {
            ...stage0Result.telemetry,
            used: false,
            shadow_only: true,
            fallback_reason: fallbackReason,
          },
          policy,
        ),
        softMustIncludeApplied,
      ),
    };
  }
  return {
    candidates,
    telemetry: withSoftMustIncludeTelemetry(
      withStage0PolicyTelemetry(stage0Result.telemetry, policy),
      softMustIncludeApplied,
    ),
  };
};

const parseRgJsonLine = (
  line: string,
  term: string,
): RepoSearchHit | null => {
  let parsed: any;
  try {
    parsed = JSON.parse(line);
  } catch {
    return null;
  }
  if (!parsed || parsed.type !== "match") return null;
  const data = parsed.data;
  if (!data?.path?.text || typeof data.line_number !== "number") return null;
  const text = data.lines?.text ?? "";
  return {
    filePath: data.path.text,
    line: data.line_number,
    text: clipLine(text),
    term,
  };
};

export async function runRepoSearch(plan: RepoSearchPlan): Promise<RepoSearchResult> {
  const hits: RepoSearchHit[] = [];
  let truncated = false;
  const stage0Prefilter = await resolveRepoSearchStage0Prefilter(plan);
  const stage0Active = stage0Prefilter.telemetry.used && stage0Prefilter.candidates.length > 0;
  const targetPaths = stage0Active ? stage0Prefilter.candidates : plan.paths;
  const baseArgs = [
    "--json",
    "-n",
    "-F",
    "-i",
  ];
  for (const glob of EXCLUDE_GLOBS) {
    baseArgs.push("--glob", glob);
  }
  for (const term of plan.terms) {
    if (hits.length >= REPO_SEARCH_MAX_TOTAL) {
      truncated = true;
      break;
    }
    const args = [...baseArgs, "--", term, ...targetPaths];
    try {
      const { stdout } = await execFileAsync("rg", args, {
        cwd: process.cwd(),
        timeout: REPO_SEARCH_TIMEOUT_MS,
        maxBuffer: 2 * 1024 * 1024,
      });
      const termHits = parseRgOutput(stdout, term, REPO_SEARCH_MAX_PER_TERM);
      hits.push(...termHits);
    } catch (error: any) {
      const code = typeof error?.code === "number" ? error.code : null;
      const stdout = typeof error?.stdout === "string" ? error.stdout : "";
      if (code === 1) {
        const termHits = parseRgOutput(stdout, term, REPO_SEARCH_MAX_PER_TERM);
        hits.push(...termHits);
        continue;
      }
      const message = error?.code === "ENOENT" ? "rg_not_found" : "rg_failed";
      return {
        hits,
        truncated,
        error: message,
        stage0: applyStage0HitRate(
          stage0Prefilter.telemetry,
          stage0Prefilter.candidates.map((filePath) => ({ filePath })),
          hits,
        ),
      };
    }
  }
  return {
    hits,
    truncated,
    stage0: applyStage0HitRate(
      stage0Prefilter.telemetry,
      stage0Prefilter.candidates.map((filePath) => ({ filePath })),
      hits,
    ),
  };
}

const parseRgOutput = (stdout: string, term: string, limit: number): RepoSearchHit[] => {
  if (!stdout) return [];
  const lines = stdout.split(/\r?\n/).filter(Boolean);
  const hits: RepoSearchHit[] = [];
  for (const line of lines) {
    const hit = parseRgJsonLine(line, term);
    if (!hit) continue;
    hits.push(hit);
    if (hits.length >= limit) break;
  }
  return hits;
};

const parseGitTrackedScanOutput = (
  stdout: string,
  terms: string[],
): GitTrackedRepoSearchResult => {
  if (!stdout.trim()) {
    return { hits: [], truncated: false, terms, error: "git_tracked_scan_empty" };
  }
  let parsed: any;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return { hits: [], truncated: false, terms, error: "git_tracked_scan_invalid_json" };
  }
  const rawHits = Array.isArray(parsed?.hits) ? parsed.hits : [];
  const hits: RepoSearchHit[] = [];
  for (const raw of rawHits) {
    const filePath =
      typeof raw?.filePath === "string"
        ? raw.filePath.replace(/\\/g, "/").trim()
        : "";
    if (!filePath) continue;
    const line = Number.isFinite(Number(raw?.line))
      ? Math.max(1, Math.trunc(Number(raw.line)))
      : 1;
    const text = typeof raw?.text === "string" ? clipLine(raw.text) : "";
    if (!text) continue;
    const termRaw =
      typeof raw?.term === "string" && raw.term.trim().length > 0
        ? sanitizeSearchTerm(raw.term)
        : terms[0] ?? "";
    if (!termRaw) continue;
    hits.push({
      filePath,
      line,
      text,
      term: termRaw,
    });
  }
  const error = typeof parsed?.error === "string" && parsed.error.trim() ? parsed.error.trim() : undefined;
  return {
    hits,
    truncated: Boolean(parsed?.truncated),
    error,
    terms,
  };
};

export async function runGitTrackedRepoSearch(input: {
  query: string;
  sourceQuestion?: string;
  allowlist?: RegExp[];
  avoidlist?: RegExp[];
  maxHits?: number;
  mustIncludeFiles?: string[];
  mode?: "fallback" | "preflight" | "explicit";
  intentDomain?: "general" | "repo" | "hybrid" | "falsifiable";
  intentId?: string | null;
  topicTags?: HelixAskTopicTag[];
  sessionId?: string | null;
}): Promise<GitTrackedRepoSearchResult> {
  if (!GIT_TRACKED_SCAN_ENABLED) {
    return {
      hits: [],
      truncated: false,
      terms: [],
      stage0: {
        used: false,
        shadow_only: false,
        candidate_count: 0,
        hit_rate: 0,
        fallback_reason: "git_tracked_scan_disabled",
        build_age_ms: null,
        commit: null,
      },
    };
  }
  const terms = extractRepoSearchTerms(input.query).slice(0, GIT_TRACKED_SCAN_MAX_TERMS);
  if (terms.length === 0) {
    return {
      hits: [],
      truncated: false,
      terms,
      stage0: {
        used: false,
        shadow_only: false,
        candidate_count: 0,
        hit_rate: 0,
        fallback_reason: "query_terms_empty",
        build_age_ms: null,
        commit: null,
      },
    };
  }
  if (!fs.existsSync(GIT_TRACKED_SCAN_SCRIPT)) {
    return {
      hits: [],
      truncated: false,
      terms,
      error: "git_tracked_scan_script_missing",
      stage0: {
        used: false,
        shadow_only: false,
        candidate_count: 0,
        hit_rate: 0,
        fallback_reason: "git_tracked_scan_script_missing",
        build_age_ms: null,
        commit: null,
      },
    };
  }
  const allowlist = (input.allowlist ?? []).map((entry) => entry.source);
  const avoidlist = (input.avoidlist ?? []).map((entry) => entry.source);
  const maxHits = Math.max(1, Math.min(input.maxHits ?? GIT_TRACKED_SCAN_MAX_HITS, GIT_TRACKED_SCAN_MAX_HITS));
  const stage0Prefilter = await resolveGitTrackedStage0Prefilter({
    query: input.query,
    sourceQuestion: input.sourceQuestion,
    allowlist: input.allowlist,
    avoidlist: input.avoidlist,
    maxHits,
    mustIncludeFiles: input.mustIncludeFiles,
    mode: input.mode ?? "fallback",
    intentDomain: input.intentDomain,
    intentId: input.intentId ?? null,
    topicTags: input.topicTags ?? [],
    sessionId: input.sessionId ?? null,
  });
  const stage0Active = stage0Prefilter.telemetry.used && stage0Prefilter.candidates.length > 0;
  const args = [
    GIT_TRACKED_SCAN_SCRIPT,
    "--max-hits",
    String(maxHits),
    "--max-per-term",
    String(GIT_TRACKED_SCAN_MAX_PER_TERM),
    ...terms.flatMap((term) => ["--term", term]),
    ...allowlist.flatMap((pattern) => ["--allow", pattern]),
    ...avoidlist.flatMap((pattern) => ["--avoid", pattern]),
    ...(stage0Active ? stage0Prefilter.candidates.flatMap((candidate) => ["--file", candidate]) : []),
  ];
  const pythonBin = process.env.PYTHON_BIN || process.env.SUNPY_PYTHON_BIN || "python";
  try {
    const { stdout } = await execFileAsync(pythonBin, args, {
      cwd: process.cwd(),
      timeout: GIT_TRACKED_SCAN_TIMEOUT_MS,
      maxBuffer: 4 * 1024 * 1024,
    });
    const parsed = parseGitTrackedScanOutput(stdout, terms);
    return {
      ...parsed,
      stage0_candidates: stage0Prefilter.candidates,
      stage0: applyStage0HitRate(
        stage0Prefilter.telemetry,
        stage0Prefilter.candidates.map((filePath) => ({ filePath })),
        parsed.hits,
      ),
    };
  } catch (error: any) {
    const stdout = typeof error?.stdout === "string" ? error.stdout : "";
    if (stdout.trim()) {
      const parsed = parseGitTrackedScanOutput(stdout, terms);
      if (!parsed.error || parsed.hits.length > 0) {
        return {
          ...parsed,
          stage0_candidates: stage0Prefilter.candidates,
          stage0: applyStage0HitRate(
            stage0Prefilter.telemetry,
            stage0Prefilter.candidates.map((filePath) => ({ filePath })),
            parsed.hits,
          ),
        };
      }
    }
    const message =
      error?.code === "ENOENT"
        ? "git_tracked_scan_python_not_found"
        : error?.message?.includes("timed out")
          ? "git_tracked_scan_timeout"
          : "git_tracked_scan_failed";
    return {
      hits: [],
      truncated: false,
      terms,
      error: message,
      stage0_candidates: stage0Prefilter.candidates,
      stage0: applyStage0HitRate(
        stage0Prefilter.telemetry,
        stage0Prefilter.candidates.map((filePath) => ({ filePath })),
        [],
      ),
    };
  }
}

export async function runGitTrackedStage0CandidateLane(input: {
  query: string;
  sourceQuestion?: string;
  allowlist?: RegExp[];
  avoidlist?: RegExp[];
  maxHits?: number;
  mustIncludeFiles?: string[];
  mode?: "fallback" | "preflight" | "explicit";
  intentDomain?: "general" | "repo" | "hybrid" | "falsifiable";
  intentId?: string | null;
  topicTags?: HelixAskTopicTag[];
  sessionId?: string | null;
}): Promise<GitTrackedRepoSearchResult> {
  const maxHits = Math.max(1, Math.min(input.maxHits ?? GIT_TRACKED_SCAN_MAX_HITS, GIT_TRACKED_SCAN_MAX_HITS));
  const terms = extractRepoSearchTerms(input.query).slice(0, GIT_TRACKED_SCAN_MAX_TERMS);
  const stage0Prefilter = await resolveGitTrackedStage0Prefilter({
    query: input.query,
    sourceQuestion: input.sourceQuestion,
    allowlist: input.allowlist,
    avoidlist: input.avoidlist,
    maxHits,
    mustIncludeFiles: input.mustIncludeFiles,
    mode: input.mode ?? "fallback",
    intentDomain: input.intentDomain,
    intentId: input.intentId ?? null,
    topicTags: input.topicTags ?? [],
    sessionId: input.sessionId ?? null,
  });
  return {
    hits: [],
    truncated: false,
    terms,
    stage0_candidates: stage0Prefilter.candidates,
    stage0: applyStage0HitRate(
      stage0Prefilter.telemetry,
      stage0Prefilter.candidates.map((filePath) => ({ filePath })),
      [],
    ),
  };
}

export function formatRepoSearchEvidence(result: RepoSearchResult): {
  evidenceText: string;
  filePaths: string[];
} {
  if (!result.hits.length) {
    return { evidenceText: "", filePaths: [] };
  }
  const lines = result.hits.map(
    (hit) => `- ${hit.filePath}:${hit.line}: ${hit.text}`,
  );
  const evidenceText = ["Repo search hits:", ...lines].join("\n");
  const filePaths = Array.from(new Set(result.hits.map((hit) => hit.filePath)));
  return { evidenceText, filePaths };
}
