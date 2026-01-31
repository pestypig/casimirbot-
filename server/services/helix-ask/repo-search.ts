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
};

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
}): RepoSearchPlan | null {
  if (!REPO_SEARCH_ENABLED) return null;
  const explicit = REPO_SEARCH_EXPLICIT_ENABLED && EXPLICIT_SEARCH_RE.test(input.question);
  if (input.promptIngested && !explicit) return null;
  const domainOk = input.intentDomain === "repo" || input.intentDomain === "hybrid";
  const fallbackOk = REPO_SEARCH_ON_EVIDENCE_FAIL && !input.evidenceGateOk;
  if (!explicit && !fallbackOk) return null;
  if (!explicit && !domainOk) return null;
  const terms = extractRepoSearchTerms(input.question, input.conceptMatch);
  if (terms.length === 0) return null;
  const paths = selectRepoSearchPaths(input.topicTags, input.topicProfile?.mustIncludeFiles);
  if (paths.length === 0) return null;
  return {
    terms,
    paths,
    explicit,
    reason: explicit ? "explicit_request" : "evidence_gate_fail",
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
