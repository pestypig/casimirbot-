import { execFile } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { promisify } from "node:util";
import {
  HELIX_REPO_CODE_EVIDENCE_OBSERVATION_SCHEMA,
  type HelixRepoCodeEvidenceObservation,
} from "../../../../shared/helix-repo-code-evidence-observation";
import {
  formatRepoSearchEvidence,
  type RepoSearchPlan,
  type RepoSearchResult,
  type RepoSearchHit,
} from "../repo-search";
import type { HelixAskTopicTag } from "../topic";
import {
  buildRepoCodeEvidenceSpans,
  rankRepoCodeEvidenceHits,
} from "./repo-code-evidence-ranker";
import {
  findRepoConceptAliasEntry,
  repoConceptAliasTerms,
  repoConceptPathMatchesHint,
  repoConceptPathMatchesPreferredPrefix,
  type RepoConceptAliasEntry,
} from "../repo-concept-alias-registry";

const execFileAsync = promisify(execFile);

const DEFAULT_MAX_FILES = 20;
const DEFAULT_MAX_SPANS = 12;
const DEFAULT_CONTEXT_LINES = 4;
const MAX_FILE_BYTES = 1_000_000;

const TEXT_FILE_RE =
  /\.(?:ts|tsx|js|jsx|mjs|cjs|mts|cts|md|mdx|json|jsonc|py|txt|css|scss|html|yml|yaml|toml|xml|sql|sh|ps1)$/i;

const ALWAYS_SKIP_PATH_RE =
  /(?:^|\/)(?:\.git|node_modules|dist|build|coverage|attached_assets|tmp|temp|\.tmp|\.cache)(?:\/|$)|(?:^|\/)server\/_generated(?:\/|$)/i;

const normalizePath = (value: string): string => value.replace(/\\/g, "/");
const normalizeTerm = (value: string): string => value.trim().replace(/\s+/g, " ");

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const insideRoot = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
};

const safeResolveRepoPath = (root: string, relativePath: string): string | null => {
  const normalized = normalizePath(relativePath).replace(/^\/+/, "");
  if (!normalized || normalized.includes("\0") || path.isAbsolute(normalized)) return null;
  const resolved = path.resolve(root, normalized);
  return insideRoot(root, resolved) ? resolved : null;
};

const conceptVariants = (concept: string): string[] => {
  const normalized = normalizeTerm(concept);
  if (!normalized) return [];
  const lower = normalized.toLowerCase();
  const words = normalized.split(/\s+/).filter(Boolean);
  const titleWords = words.map((word) => word.slice(0, 1).toUpperCase() + word.slice(1));
  const compact = titleWords.join("");
  const snake = words.join("_").toLowerCase();
  const kebab = words.join("-").toLowerCase();
  return unique([normalized, lower, compact, snake, kebab]);
};

export const expandRepoCodeEvidenceTerms = (input: {
  concept?: string | null;
  query: string;
  normalized_terms?: string[];
}): string[] => {
  const sourceTerms = [
    input.concept ?? "",
    input.query,
    ...(input.normalized_terms ?? []),
  ];
  const aliasEntry = findRepoConceptAliasEntry([input.concept ?? "", input.query, ...(input.normalized_terms ?? [])].join(" "));
  const terms: string[] = [];
  for (const term of sourceTerms) {
    terms.push(...conceptVariants(term));
  }
  terms.push(...repoConceptAliasTerms(aliasEntry));

  const joined = sourceTerms.join(" ").toLowerCase();
  if (/\bsituation\s+room\b/.test(joined)) {
    terms.push(
      "Situation Room",
      "SituationRoom",
      "situation-room",
      "situation_room",
      "situation_context",
      "situation-room-pipelines",
      "situation-room-sources",
      "SituationRoomSource",
      "SituationRoomStore",
      "useSituationRoomStore",
      "useSituationRoomJobStore",
      "situation-capture-context",
    );
  }
  if (/\bauntie\s+dottie\b|\bdottie\b/.test(joined)) {
    terms.push(
      "Auntie Dottie",
      "Dottie",
      "dottie",
      "dottie.manifest",
      "dottie_manifest",
      "dottie_manifest_preset",
      "dottie_observer_subscription",
      "dottie_voice_receipt",
      "voice_delivery",
      "observer.attach",
      "observer.query",
      "helix-agent-commentary",
      "helix-dottie-manifest-preset",
      "dottie-manifest-preset",
      "workstation-tool-planner",
    );
  }
  if (/\broute\s+evidence\b/.test(joined)) {
    terms.push(
      "Route Evidence",
      "route_evidence",
      "route-evidence",
      "route_drift",
      "route watcher",
      "route_watcher",
      "minecraft_route_watcher",
      "live_perturbation",
      "field_worker_policy",
      "field_worker",
      "situation-room-live-job-contract",
      "helix-situation-construct",
      "situation-construct-recipe",
      "live_env.query_navigation_state",
      "live_env.query_source_health",
    );
  }
  if (/\bdocs?\s+(?:panel|viewer)\b|\bdocument\s+viewer\b/.test(joined)) {
    terms.push(
      "Docs & Papers",
      "docs-viewer",
      "docs_viewer",
      "DocViewerPanel",
      "docs panel",
      "docs viewer",
      "panelCapabilities",
      "panelActionAdapters",
      "workstation-dynamic-tools",
      "doc_summary",
      "doc_location_matches",
    );
  }
  if (/\bterminal\s+authority\b/.test(joined)) {
    terms.push(
      "terminal authority",
      "terminal_authority",
      "terminal_answer_authority",
      "turn-terminal-authority",
      "repo_code_evidence_answer",
      "terminal-answer-envelope",
      "runtime-authority-contract",
      "terminal_presentation",
    );
  }

  return unique(
    terms
      .map(normalizeTerm)
      .filter((term) => term.length >= 3)
      .slice(0, 32),
  );
};

const enumerateGitTrackedFiles = async (repoRoot: string): Promise<string[] | null> => {
  try {
    const { stdout } = await execFileAsync("git", ["ls-files"], {
      cwd: repoRoot,
      timeout: 4000,
      maxBuffer: 4 * 1024 * 1024,
    });
    return stdout
      .split(/\r?\n/)
      .map((entry) => normalizePath(entry.trim()))
      .filter(Boolean);
  } catch {
    return null;
  }
};

const enumerateFilesFromFs = async (repoRoot: string): Promise<string[]> => {
  const out: string[] = [];
  const walk = async (relativeDir: string): Promise<void> => {
    const absoluteDir = path.resolve(repoRoot, relativeDir);
    if (!insideRoot(repoRoot, absoluteDir) && absoluteDir !== repoRoot) return;
    let entries: Array<import("node:fs").Dirent>;
    try {
      entries = await fs.readdir(absoluteDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const relativePath = normalizePath(path.join(relativeDir, entry.name));
      if (ALWAYS_SKIP_PATH_RE.test(relativePath)) continue;
      if (entry.isDirectory()) {
        await walk(relativePath);
      } else if (entry.isFile()) {
        out.push(relativePath);
      }
    }
  };
  await walk("");
  return out;
};

const enumerateRepoFiles = async (repoRoot: string): Promise<string[]> => {
  const gitTracked = await enumerateGitTrackedFiles(repoRoot);
  const files = gitTracked ?? await enumerateFilesFromFs(repoRoot);
  return unique(
    files
      .map(normalizePath)
      .filter((filePath) => TEXT_FILE_RE.test(filePath))
      .filter((filePath) => !ALWAYS_SKIP_PATH_RE.test(filePath)),
  );
};

const isSituationRoomSearch = (terms: string[]): boolean =>
  terms.some((term) => /situation[\s_-]*room|situationroom|situation_context|situation-capture/i.test(term));

const isDottieSearch = (terms: string[]): boolean =>
  terms.some((term) => /\bdottie\b|auntie\s+dottie|voice_delivery|observer\.(?:attach|query)|dottie[_-]?manifest/i.test(term));

const isRouteEvidenceSearch = (terms: string[]): boolean =>
  terms.some((term) => /route[\s_-]*evidence|route[_-]?drift|field[_-]?worker|live[_-]?perturbation|query_navigation_state/i.test(term));

const isDocsPanelSearch = (terms: string[]): boolean =>
  terms.some((term) => /docs?[\s_-]*(?:panel|viewer)|docviewerpanel|panel(?:capabilities|actionadapters)|workstation-dynamic-tools/i.test(term));

const isTerminalAuthoritySearch = (terms: string[]): boolean =>
  terms.some((term) => /terminal[\s_-]*authority|terminal[_-]?answer[_-]?authority|terminal-answer-envelope|runtime-authority-contract/i.test(term));

const situationRoomFileSearchPriority = (filePath: string): number | null => {
  const normalized = normalizePath(filePath).toLowerCase();
  if (/client\/src\/store\/usesituationroomstore\.ts$/.test(normalized)) return -60;
  if (/client\/src\/store\/usesituationroom(?:jobstore|graphstore)\.ts$/.test(normalized)) return -56;
  if (/client\/src\/lib\/helix\/situation-room\.ts$/.test(normalized)) return -48;
  if (/client\/src\/lib\/helix\/situation-capture-context\.ts$/.test(normalized)) return -46;
  if (/server\/services\/situation-room/.test(normalized)) return -44;
  if (/shared\/.*situation/.test(normalized)) return -42;
  if (/client\/src\/components\/(?:helix|workstation)\/.*situation/.test(normalized)) return -40;
  if (/situation-room-pipelines|situation-room-sources/.test(normalized)) return -38;
  if (/server\/services\/helix-ask\/.*situation/.test(normalized)) return -20;
  if (/server\/services\/helix-ask/.test(normalized)) return 8;
  return null;
};

const dottieFileSearchPriority = (filePath: string): number | null => {
  const normalized = normalizePath(filePath).toLowerCase();
  if (/shared\/helix-dottie-manifest-preset\.ts$/.test(normalized)) return -66;
  if (/server\/services\/situation-room\/dottie-manifest-preset\.ts$/.test(normalized)) return -64;
  if (/shared\/helix-agent-commentary\.ts$/.test(normalized)) return -58;
  if (/shared\/workstation-dynamic-tools\.ts$/.test(normalized)) return -54;
  if (/server\/services\/helix-ask\/workstation-tool-planner\.ts$/.test(normalized)) return -52;
  if (/server\/services\/helix-ask\/runtime-authority-contract\.ts$/.test(normalized)) return -46;
  if (/client\/src\/lib\/workstation\/panel(?:capabilities|actionadapters)\.ts$/.test(normalized)) return -42;
  if (/dottie|voice_delivery|observer/.test(normalized)) return -38;
  return null;
};

const routeEvidenceFileSearchPriority = (filePath: string): number | null => {
  const normalized = normalizePath(filePath).toLowerCase();
  if (/shared\/helix-situation-construct\.ts$/.test(normalized)) return -64;
  if (/shared\/situation-room-live-job-contract\.ts$/.test(normalized)) return -62;
  if (/server\/services\/situation-room\/situation-construct-recipe(?:-registry|-runner)?\.ts$/.test(normalized)) return -58;
  if (/server\/services\/helix-ask\/situation-room-live-job-setup-planner\.ts$/.test(normalized)) return -54;
  if (/client\/src\/components\/workstation\/situationroompipelinespanel\.tsx$/.test(normalized)) return -50;
  if (/client\/src\/lib\/workstation\/panelactionadapters\.ts$/.test(normalized)) return -44;
  if (/route[_-]?evidence|route[_-]?drift|field[_-]?worker|live[_-]?perturbation/.test(normalized)) return -40;
  return null;
};

const docsPanelFileSearchPriority = (filePath: string): number | null => {
  const normalized = normalizePath(filePath).toLowerCase();
  if (/client\/src\/components\/docviewerpanel\.tsx$/.test(normalized)) return -66;
  if (/client\/src\/lib\/docs\/docviewer\.ts$/.test(normalized)) return -62;
  if (/client\/src\/lib\/workstation\/panelcapabilities\.ts$/.test(normalized)) return -58;
  if (/client\/src\/lib\/workstation\/panelactionadapters\.ts$/.test(normalized)) return -56;
  if (/shared\/workstation-dynamic-tools\.ts$/.test(normalized)) return -52;
  if (/server\/services\/helix-ask\/(?:runtime-authority-contract|route-product-contract)\.ts$/.test(normalized)) return -42;
  if (/docs?-viewer|docviewer|doc_summary|doc_location/.test(normalized)) return -38;
  return null;
};

const terminalAuthorityFileSearchPriority = (filePath: string): number | null => {
  const normalized = normalizePath(filePath).toLowerCase();
  if (/server\/services\/helix-ask\/terminal-answer-envelope\.ts$/.test(normalized)) return -68;
  if (/server\/services\/helix-ask\/runtime-authority-contract\.ts$/.test(normalized)) return -66;
  if (/server\/services\/helix-ask\/solver-controller-decision\.ts$/.test(normalized)) return -56;
  if (/server\/services\/helix-ask\/route-product-contract\.ts$/.test(normalized)) return -52;
  if (/shared\/helix.*terminal.*authority/.test(normalized)) return -44;
  return null;
};

const fileSearchPriority = (filePath: string, terms: string[]): number => {
  const normalized = normalizePath(filePath).toLowerCase();
  const aliasEntry = findRepoConceptAliasEntry(terms.join(" "));
  if (repoConceptPathMatchesHint(normalized, aliasEntry)) return -90;
  if (repoConceptPathMatchesPreferredPrefix(normalized, aliasEntry)) return -35;
  if (isSituationRoomSearch(terms)) {
    const situationPriority = situationRoomFileSearchPriority(normalized);
    if (situationPriority !== null) return situationPriority;
  }
  if (isDottieSearch(terms)) {
    const dottiePriority = dottieFileSearchPriority(normalized);
    if (dottiePriority !== null) return dottiePriority;
  }
  if (isRouteEvidenceSearch(terms)) {
    const routeEvidencePriority = routeEvidenceFileSearchPriority(normalized);
    if (routeEvidencePriority !== null) return routeEvidencePriority;
  }
  if (isDocsPanelSearch(terms)) {
    const docsPriority = docsPanelFileSearchPriority(normalized);
    if (docsPriority !== null) return docsPriority;
  }
  if (isTerminalAuthoritySearch(terms)) {
    const terminalPriority = terminalAuthorityFileSearchPriority(normalized);
    if (terminalPriority !== null) return terminalPriority;
  }
  if (/server\/services\/helix-ask/.test(normalized)) return 0;
  if (/shared\//.test(normalized)) return 1;
  if (/client\/src\/lib\/workstation/.test(normalized)) return 2;
  if (/client\/src\/components\/workstation/.test(normalized)) return 3;
  if (/server\/services\/situation-room/.test(normalized)) return 4;
  if (/(?:^|\/)__tests__\/|(?:\.test|\.spec)\.[tj]sx?$/.test(normalized)) return 5;
  if (/docs\//.test(normalized)) return 6;
  if (/(?:^|\/)(?:generated|artifacts?|tmp|temp)\//.test(normalized)) return 20;
  return 10;
};

const prioritizeRepoFilesForSearch = (files: string[], terms: string[]): string[] =>
  [...files].sort((left, right) => {
    const priorityDelta = fileSearchPriority(left, terms) - fileSearchPriority(right, terms);
    return priorityDelta || left.localeCompare(right);
  });

const termMatchesLine = (line: string, terms: string[]): string | null => {
  const lower = line.toLowerCase();
  return terms.find((term) => lower.includes(term.toLowerCase())) ?? null;
};

const contextExcerpt = (lines: string[], lineIndex: number, contextLines: number): string => {
  const start = Math.max(0, lineIndex - contextLines);
  const end = Math.min(lines.length - 1, lineIndex + contextLines);
  return lines
    .slice(start, end + 1)
    .map((line) => line.trimEnd())
    .join("\n")
    .trim()
    .slice(0, 1800);
};

const readSearchableFile = async (repoRoot: string, relativePath: string): Promise<string | null> => {
  const resolved = safeResolveRepoPath(repoRoot, relativePath);
  if (!resolved) return null;
  try {
    const stat = await fs.stat(resolved);
    if (!stat.isFile() || stat.size > MAX_FILE_BYTES) return null;
    const buffer = await fs.readFile(resolved);
    if (buffer.includes(0)) return null;
    return buffer.toString("utf8");
  } catch {
    return null;
  }
};

const searchRepoFiles = async (input: {
  repoRoot: string;
  files: string[];
  terms: string[];
  maxFiles: number;
  maxSpans: number;
  contextLines: number;
}): Promise<RepoSearchResult> => {
  const hits: RepoSearchHit[] = [];
  const matchedFiles = new Set<string>();
  let truncated = false;

  for (const filePath of input.files) {
    if (hits.length >= input.maxSpans) {
      truncated = true;
      break;
    }
    if (matchedFiles.size >= input.maxFiles && !matchedFiles.has(filePath)) {
      truncated = true;
      break;
    }
    const text = await readSearchableFile(input.repoRoot, filePath);
    if (!text) continue;
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? "";
      const matchedTerm = termMatchesLine(line, input.terms);
      if (!matchedTerm) continue;
      matchedFiles.add(filePath);
      hits.push({
        filePath,
        line: index + 1,
        text: contextExcerpt(lines, index, input.contextLines),
        term: matchedTerm,
      });
      if (hits.length >= input.maxSpans) {
        truncated = true;
        break;
      }
    }
  }

  return { hits, truncated };
};

const firstUsefulLineIndex = (lines: string[], terms: string[]): number => {
  for (let index = 0; index < lines.length; index += 1) {
    if (termMatchesLine(lines[index] ?? "", terms)) return index;
  }
  for (let index = 0; index < lines.length; index += 1) {
    if (/\b(?:export|type|interface|class|function|const|describe|it|test)\b/i.test(lines[index] ?? "")) return index;
  }
  return Math.max(0, lines.findIndex((line) => line.trim().length > 0));
};

const firstImplementationLineIndex = (lines: string[]): number => {
  for (let index = 0; index < lines.length; index += 1) {
    if (/\bexport\s+(?:type|interface|class|function|const)\b/i.test(lines[index] ?? "")) return index;
  }
  for (let index = 0; index < lines.length; index += 1) {
    if (/\b(?:type|interface|class|function|const)\b/i.test(lines[index] ?? "")) return index;
  }
  return Math.max(0, lines.findIndex((line) => line.trim().length > 0));
};

const buildPathHintHits = async (input: {
  repoRoot: string;
  files: string[];
  terms: string[];
  aliasEntry: RepoConceptAliasEntry | null;
  maxSpans: number;
  contextLines: number;
}): Promise<RepoSearchHit[]> => {
  if (!input.aliasEntry) return [];
  const hintFiles = input.files
    .filter((filePath) => repoConceptPathMatchesHint(filePath, input.aliasEntry))
    .slice(0, Math.max(1, Math.min(input.maxSpans, 12)));
  const hits: RepoSearchHit[] = [];
  for (const filePath of hintFiles) {
    if (hits.length >= input.maxSpans) break;
    const text = await readSearchableFile(input.repoRoot, filePath);
    if (!text) continue;
    const lines = text.split(/\r?\n/);
    const lineIndex = firstImplementationLineIndex(lines);
    if (lineIndex < 0) continue;
    hits.push({
      filePath,
      line: lineIndex + 1,
      text: contextExcerpt(lines, lineIndex, input.contextLines),
      term: termMatchesLine(lines[lineIndex] ?? "", input.terms) ?? input.aliasEntry.canonical_concept,
    });
  }
  return hits;
};

const mergeSearchHits = (hits: RepoSearchHit[]): RepoSearchHit[] => {
  const seen = new Set<string>();
  const out: RepoSearchHit[] = [];
  for (const hit of hits) {
    const key = `${normalizePath(hit.filePath)}:${hit.line}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(hit);
  }
  return out;
};

export type HelixRepoCodeEvidenceSearchResult = {
  plan: RepoSearchPlan | null;
  rawResult: RepoSearchResult;
  rankedResult: RepoSearchResult;
  evidenceText: string;
  filePaths: string[];
  observations: HelixRepoCodeEvidenceObservation["observations"];
  observation: HelixRepoCodeEvidenceObservation;
};

export async function runRepoCodeEvidenceSearch(input: {
  turnId: string;
  callId?: string | null;
  query: string;
  topicTags?: HelixAskTopicTag[];
  conceptMatch?: string | null;
  sessionId?: string | null;
  maxHits?: number;
  max_files?: number;
  max_spans?: number;
  context_lines?: number;
  normalized_terms?: string[];
  intentId?: string | null;
}): Promise<HelixRepoCodeEvidenceSearchResult> {
  const repoRoot = process.cwd();
  const terms = expandRepoCodeEvidenceTerms({
    concept: input.conceptMatch,
    query: input.query,
    normalized_terms: input.normalized_terms,
  });
  const aliasEntry = findRepoConceptAliasEntry([input.conceptMatch ?? "", input.query, ...terms].join(" "));
  const maxSpans = Math.max(1, Math.min(input.max_spans ?? input.maxHits ?? DEFAULT_MAX_SPANS, 80));
  const maxFiles = Math.max(1, Math.min(input.max_files ?? DEFAULT_MAX_FILES, 80));
  const contextLines = Math.max(0, Math.min(input.context_lines ?? DEFAULT_CONTEXT_LINES, 12));
  const files = prioritizeRepoFilesForSearch(await enumerateRepoFiles(repoRoot), terms);
  const pathHintHits = await buildPathHintHits({
    repoRoot,
    files,
    terms,
    aliasEntry,
    maxSpans,
    contextLines,
  });
  const rawResult = await searchRepoFiles({
    repoRoot,
    files,
    terms,
    maxFiles,
    maxSpans,
    contextLines,
  });
  rawResult.hits = mergeSearchHits([...pathHintHits, ...rawResult.hits]);
  const rankedHits = rankRepoCodeEvidenceHits({
    hits: rawResult.hits,
    query: input.query,
    concept: input.conceptMatch,
    exactTerms: terms,
    maxHits: maxSpans,
  });
  const rankedResult = {
    ...rawResult,
    hits: rankedHits,
  };
  const formatted = formatRepoSearchEvidence(rankedResult, {
    query: input.query,
    sourceStage: "fallback_repo_search",
  });
  const artifactId = `${input.callId ?? input.turnId}:repo_code_evidence_observation`;
  const observation: HelixRepoCodeEvidenceObservation = {
    schema: HELIX_REPO_CODE_EVIDENCE_OBSERVATION_SCHEMA,
    artifact_id: artifactId,
    turn_id: input.turnId,
    concept: input.conceptMatch ?? input.query,
    query: input.query,
    normalized_terms: terms,
    search_strategy: {
      exact_terms: terms,
      symbol_terms: terms.filter((term) => /[A-Z_][A-Za-z0-9_]*|\w+\.\w+|\w+-\w+/.test(term)),
      path_globs_considered: unique(rankedHits.map((hit) => hit.filePath.split("/").slice(0, 3).join("/"))),
      max_spans: maxSpans,
    },
    evidence_refs: formatted.observations.flatMap((entry) => entry.refs).slice(0, 64),
    observations: formatted.observations,
    spans: buildRepoCodeEvidenceSpans({
      hits: rankedHits,
      query: input.query,
      concept: input.conceptMatch,
      exactTerms: terms,
    }),
    selected_for_answer: rankedHits.length > 0,
    assistant_answer: false,
    raw_content_included: false,
  };
  return {
    plan: {
      rawQuestion: input.query,
      terms,
      paths: ["git-tracked-files", "fs-fallback"],
      explicit: false,
      reason: "repo_code_search_concept_read_only_service",
      mode: "fallback",
      intentDomain: "repo",
      intentId: input.intentId ?? "runtime_repo_search_concept",
      topicTags: input.topicTags ?? [],
      sessionId: input.sessionId ?? null,
    },
    rawResult,
    rankedResult,
    evidenceText: formatted.evidenceText,
    filePaths: formatted.filePaths,
    observations: formatted.observations,
    observation,
  };
}
