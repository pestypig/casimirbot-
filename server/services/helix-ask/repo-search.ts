import { execFile } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { promisify } from "node:util";
import type { HelixAskConceptMatch } from "./concepts";
import type { HelixAskTopicProfile, HelixAskTopicTag } from "./topic";
import { filterSignalTokens, tokenizeAskQuery } from "./query";

const execFileAsync = promisify(execFile);

export type RepoSearchPlan = {
  terms: string[];
  paths: string[];
  explicit: boolean;
  reason: string;
  mode?: "fallback" | "preflight" | "explicit";
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

const EXPLICIT_SEARCH_RE =
  /\b(git\s+grep|ripgrep|rg|repo\s+search|search\s+repo|find\s+in\s+repo|grep\s+the\s+repo)\b/i;

const DEFAULT_REPO_SEARCH_PATHS: string[] = ["docs", "server", "modules", "shared", "client/src"];

const REPO_SEARCH_PATHS_BY_TAG: Record<HelixAskTopicTag, string[]> = {
  ideology: ["docs/ethos", "docs/knowledge/ethos", "server/services/ideology", "shared/ideology"],
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
    .replace(/[^a-z0-9 _.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned;
};

export function extractRepoSearchTerms(
  question: string,
  conceptMatch?: HelixAskConceptMatch | null,
): string[] {
  const terms: string[] = [];
  if (conceptMatch?.matchedTerm) {
    const normalized = sanitizeSearchTerm(conceptMatch.matchedTerm);
    if (normalized) terms.push(normalized);
  }
  const tokens = filterSignalTokens(tokenizeAskQuery(question)).map((token) =>
    sanitizeSearchTerm(token),
  );
  for (const token of tokens) {
    if (!token) continue;
    if (token.length < 4) continue;
    if (/^\d+$/.test(token)) continue;
    terms.push(token);
  }
  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const term of terms) {
    if (seen.has(term)) continue;
    seen.add(term);
    deduped.push(term);
  }
  deduped.sort((a, b) => b.length - a.length);
  return deduped.slice(0, REPO_SEARCH_MAX_TERMS);
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
    terms: clippedTerms,
    paths,
    explicit,
    reason: explicit ? "explicit_request" : mode === "preflight" ? "preflight" : "evidence_gate_fail",
    mode,
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
    const args = [...baseArgs, "--", term, ...plan.paths];
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
      return { hits, truncated, error: message };
    }
  }
  return { hits, truncated };
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
