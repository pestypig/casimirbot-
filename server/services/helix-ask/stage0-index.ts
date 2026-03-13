import { execFile } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { promisify } from "node:util";
import { filterSignalTokens, tokenizeAskQuery } from "./query";

const execFileAsync = promisify(execFile);

const STAGE0_VERSION = "helix-stage0/1" as const;
const DEFAULT_STAGE0_MAX_CANDIDATES = 256;
const DEFAULT_STAGE0_STALE_MAX_MS = 120_000;
const STAGE0_STALE_HARD_MULTIPLIER = 4;
const STAGE0_HEAD_RECHECK_MS = 2_000;
const STAGE0_FILENAME_HINT_RE =
  /\b[a-z0-9][a-z0-9._-]*\.(?:tsx?|jsx?|md|json|ya?ml|mjs|cjs|py|go|rs|java|cpp|c|h)\b/gi;
const BITMASK_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789/._-";
const PATH_TOKEN_RE = /[a-z0-9]+/gi;
const STAGE0_ROLLOUT_MODES = new Set(["off", "shadow", "partial", "full"]);

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
const readNumber = (raw: string | undefined, fallback: number): number => {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeRepoPath = (value: string): string =>
  value
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "")
    .trim();

const isSafeRepoPath = (value: string): boolean => {
  if (!value) return false;
  if (path.isAbsolute(value)) return false;
  if (value === ".." || value.startsWith("../")) return false;
  if (value.includes("/../") || value.includes("..\\")) return false;
  return true;
};

const splitPathTokens = (value: string): string[] => {
  const out: string[] = [];
  for (const match of value.matchAll(PATH_TOKEN_RE)) {
    const token = String(match[0] ?? "").trim().toLowerCase();
    if (!token) continue;
    out.push(token);
  }
  return out;
};

const stableUnique = (values: string[]): string[] => {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
};

const compactAlphaNumeric = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();

const toTrigramSet = (value: string): Set<string> => {
  const normalized = compactAlphaNumeric(value);
  if (!normalized) return new Set();
  if (normalized.length < 3) return new Set([normalized]);
  const out = new Set<string>();
  for (let i = 0; i < normalized.length - 2; i += 1) {
    out.add(normalized.slice(i, i + 3));
  }
  return out;
};

const trigramSimilarity = (left: Set<string>, right: Set<string>): number => {
  if (left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  for (const trigram of left) {
    if (right.has(trigram)) intersection += 1;
  }
  const union = left.size + right.size - intersection;
  return union > 0 ? intersection / union : 0;
};

const buildMask = (value: string): number => {
  let mask = 0;
  for (const raw of value.toLowerCase()) {
    const idx = BITMASK_CHARS.indexOf(raw);
    if (idx < 0) continue;
    mask |= 1 << (idx % 30);
  }
  return mask >>> 0;
};

const extractFileNameHints = (query: string): string[] => {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const match of query.matchAll(STAGE0_FILENAME_HINT_RE)) {
    const hint = String(match[0] ?? "").trim().toLowerCase();
    if (!hint || seen.has(hint)) continue;
    seen.add(hint);
    out.push(hint);
  }
  return out;
};

const normalizeTokenSet = (query: string): Set<string> => {
  const rawTokens = filterSignalTokens(tokenizeAskQuery(query));
  const out = new Set<string>();
  for (const token of rawTokens) {
    const normalized = String(token ?? "").trim().toLowerCase();
    if (!normalized || normalized.length < 3) continue;
    out.add(normalized);
    for (const part of normalized.split(/[./:_-]+/)) {
      const cleaned = part.trim();
      if (cleaned.length >= 3) out.add(cleaned);
    }
  }
  return out;
};

type Stage0FileRecord = {
  filePath: string;
  lowerPath: string;
  basename: string;
  lowerBasename: string;
  tokens: string[];
  tokenSet: Set<string>;
  mask: number;
  basenameTrigrams: Set<string>;
  pathTrigrams: Set<string>;
};

export type Stage0Snapshot = {
  version: typeof STAGE0_VERSION;
  builtAtMs: number;
  commit: string | null;
  files: Stage0FileRecord[];
  byToken: Map<string, number[]>;
  byBasename: Map<string, number[]>;
};

export type Stage0Candidate = {
  filePath: string;
  score: number;
  tokenHits: number;
  exactBasename: boolean;
};

export type Stage0QueryOptions = {
  query: string;
  maxCandidates: number;
  allowlist?: RegExp[];
  avoidlist?: RegExp[];
  pathScopeMatcher?: (filePath: string) => boolean;
};

export type Stage0Telemetry = {
  used: boolean;
  shadow_only: boolean;
  candidate_count: number;
  hit_rate: number;
  fallback_reason: string | null;
  build_age_ms: number | null;
  commit: string | null;
  rollout_mode?: "off" | "shadow" | "partial" | "full";
  canary_hit?: boolean;
  policy_decision?: string;
  fail_open_reason?: string | null;
  soft_must_include_applied?: boolean;
};

export type Stage0QueryResult = {
  candidates: Stage0Candidate[];
  telemetry: Stage0Telemetry;
};

const parseStage0RolloutMode = (): "off" | "shadow" | "partial" | "full" | null => {
  const raw = String(process.env.HELIX_ASK_STAGE0_ROLLOUT_MODE ?? "")
    .trim()
    .toLowerCase();
  if (STAGE0_ROLLOUT_MODES.has(raw)) {
    return raw as "off" | "shadow" | "partial" | "full";
  }
  return null;
};

const stage0Enabled = (): boolean => {
  const rolloutMode = parseStage0RolloutMode();
  if (rolloutMode) return rolloutMode !== "off";
  return String(process.env.HELIX_ASK_STAGE0_ENABLED ?? "0").trim() !== "0";
};

const stage0ShadowOnly = (): boolean => {
  const rolloutMode = parseStage0RolloutMode();
  if (rolloutMode) return rolloutMode === "shadow";
  return String(process.env.HELIX_ASK_STAGE0_SHADOW ?? "1").trim() !== "0";
};
const stage0MaxCandidates = (): number =>
  clampNumber(
    Math.floor(readNumber(process.env.HELIX_ASK_STAGE0_MAX_CANDIDATES, DEFAULT_STAGE0_MAX_CANDIDATES)),
    16,
    4096,
  );
const stage0StaleMaxMs = (): number =>
  clampNumber(readNumber(process.env.HELIX_ASK_STAGE0_STALE_MAX_MS, DEFAULT_STAGE0_STALE_MAX_MS), 10_000, 3_600_000);

const computeBuildAge = (snapshot: Stage0Snapshot | null): number | null =>
  snapshot ? Math.max(0, Date.now() - snapshot.builtAtMs) : null;

const asStage0Telemetry = (
  args: Partial<Stage0Telemetry> & Pick<Stage0Telemetry, "used" | "shadow_only" | "candidate_count">,
): Stage0Telemetry => ({
  used: args.used,
  shadow_only: args.shadow_only,
  candidate_count: args.candidate_count,
  hit_rate: Number((args.hit_rate ?? 0).toFixed(4)),
  fallback_reason: args.fallback_reason ?? null,
  build_age_ms: args.build_age_ms ?? null,
  commit: args.commit ?? null,
  rollout_mode: args.rollout_mode,
  canary_hit: args.canary_hit,
  policy_decision: args.policy_decision,
  fail_open_reason: args.fail_open_reason ?? null,
  soft_must_include_applied: args.soft_must_include_applied ?? false,
});

const buildFileRecord = (filePath: string): Stage0FileRecord | null => {
  const normalized = normalizeRepoPath(filePath);
  if (!isSafeRepoPath(normalized)) return null;
  const lowerPath = normalized.toLowerCase();
  const basename = path.posix.basename(normalized);
  const lowerBasename = basename.toLowerCase();
  const tokens = stableUnique(splitPathTokens(lowerPath));
  return {
    filePath: normalized,
    lowerPath,
    basename,
    lowerBasename,
    tokens,
    tokenSet: new Set(tokens),
    mask: buildMask(lowerPath),
    basenameTrigrams: toTrigramSet(lowerBasename),
    pathTrigrams: toTrigramSet(lowerPath),
  };
};

export const buildStage0SnapshotFromPaths = (
  paths: string[],
  commit: string | null,
  builtAtMs = Date.now(),
): Stage0Snapshot => {
  const deduped = stableUnique(paths.map((entry) => normalizeRepoPath(entry)).filter(Boolean)).sort((a, b) =>
    a.localeCompare(b),
  );
  const files: Stage0FileRecord[] = [];
  for (const entry of deduped) {
    const record = buildFileRecord(entry);
    if (!record) continue;
    files.push(record);
  }

  const byToken = new Map<string, number[]>();
  const byBasename = new Map<string, number[]>();
  for (let i = 0; i < files.length; i += 1) {
    const record = files[i];
    const baseList = byBasename.get(record.lowerBasename) ?? [];
    baseList.push(i);
    byBasename.set(record.lowerBasename, baseList);
    for (const token of record.tokens) {
      const list = byToken.get(token) ?? [];
      list.push(i);
      byToken.set(token, list);
    }
  }

  return {
    version: STAGE0_VERSION,
    builtAtMs,
    commit,
    files,
    byToken,
    byBasename,
  };
};

const passesPathFilters = (
  filePath: string,
  allowlist: RegExp[],
  avoidlist: RegExp[],
  scopeMatcher?: (candidate: string) => boolean,
): boolean => {
  if (scopeMatcher && !scopeMatcher(filePath)) return false;
  if (avoidlist.length > 0 && avoidlist.some((entry) => entry.test(filePath))) return false;
  if (allowlist.length > 0 && !allowlist.some((entry) => entry.test(filePath))) return false;
  return true;
};

const queryHasTokenMention = (queryLower: string, token: string): boolean => {
  if (!token || token.length < 3) return false;
  return queryLower.includes(token);
};

const scoreRecord = (
  record: Stage0FileRecord,
  queryLower: string,
  queryTokens: Set<string>,
  queryMask: number,
  queryTrigrams: Set<string>,
  fileNameHints: Set<string>,
): Stage0Candidate | null => {
  const hasMaskOverlap = (record.mask & queryMask) !== 0;
  const exactBasename = fileNameHints.has(record.lowerBasename);
  let tokenHits = 0;
  let containsHits = 0;
  for (const token of queryTokens) {
    if (record.tokenSet.has(token)) tokenHits += 1;
    if (queryHasTokenMention(record.lowerPath, token)) containsHits += 1;
  }
  const basenameTrigScore = trigramSimilarity(queryTrigrams, record.basenameTrigrams);
  const pathTrigScore = trigramSimilarity(queryTrigrams, record.pathTrigrams);
  const trigScore = Math.max(basenameTrigScore, pathTrigScore);
  if (!exactBasename && tokenHits === 0 && containsHits === 0 && trigScore < 0.14) {
    return null;
  }
  let score = 0;
  if (exactBasename) score += 32;
  score += tokenHits * 6;
  score += containsHits * 2;
  if (queryLower.includes(record.lowerBasename)) score += 10;
  if (queryLower.includes(record.lowerPath)) score += 8;
  score += trigScore * 10;
  if (!hasMaskOverlap) score -= 2;
  if (score <= 0) return null;
  return {
    filePath: record.filePath,
    score: Number(score.toFixed(6)),
    tokenHits,
    exactBasename,
  };
};

export const queryStage0Snapshot = (
  snapshot: Stage0Snapshot,
  options: Stage0QueryOptions,
): Stage0Candidate[] => {
  const query = String(options.query ?? "").trim();
  const queryTokens = normalizeTokenSet(query);
  const queryLower = query.toLowerCase();
  const fileNameHints = new Set(extractFileNameHints(queryLower));
  if (queryTokens.size === 0 && fileNameHints.size === 0) {
    return [];
  }

  const candidateIds = new Set<number>();
  for (const hint of fileNameHints) {
    for (const id of snapshot.byBasename.get(hint) ?? []) {
      candidateIds.add(id);
    }
  }
  for (const token of queryTokens) {
    for (const id of snapshot.byToken.get(token) ?? []) {
      candidateIds.add(id);
    }
  }

  const allowlist = options.allowlist ?? [];
  const avoidlist = options.avoidlist ?? [];
  const queryMask = buildMask(queryLower);
  const queryTrigrams = toTrigramSet(queryLower);
  const candidateRows: Stage0Candidate[] = [];
  const rowsToInspect = candidateIds.size > 0 ? Array.from(candidateIds.values()) : snapshot.files.map((_, idx) => idx);
  for (const fileId of rowsToInspect) {
    const record = snapshot.files[fileId];
    if (!record) continue;
    if (!passesPathFilters(record.filePath, allowlist, avoidlist, options.pathScopeMatcher)) {
      continue;
    }
    const scored = scoreRecord(record, queryLower, queryTokens, queryMask, queryTrigrams, fileNameHints);
    if (!scored) continue;
    candidateRows.push(scored);
  }

  return candidateRows
    .sort((a, b) => b.score - a.score || a.filePath.localeCompare(b.filePath))
    .slice(0, Math.max(1, options.maxCandidates));
};

export const isStage0SnapshotStale = (
  snapshot: Stage0Snapshot,
  nowMs: number,
  staleMaxMs: number,
): boolean => nowMs - snapshot.builtAtMs > Math.max(10_000, staleMaxMs);

const resolveGitDir = (): string | null => {
  const dotGitPath = path.resolve(process.cwd(), ".git");
  try {
    const stats = fs.statSync(dotGitPath);
    if (stats.isDirectory()) return dotGitPath;
  } catch {
    return null;
  }
  try {
    const raw = fs.readFileSync(dotGitPath, "utf8");
    const match = raw.match(/gitdir:\s*(.+)\s*$/i);
    if (!match?.[1]) return null;
    const rel = match[1].trim();
    return path.resolve(process.cwd(), rel);
  } catch {
    return null;
  }
};

const resolveWatchedGitFiles = (): string[] => {
  const gitDir = resolveGitDir();
  if (!gitDir) return [];
  return [path.resolve(gitDir, "HEAD"), path.resolve(gitDir, "index")];
};

const readTextFile = (filePath: string): string | null => {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
};

const resolveHeadCommitFromGitFiles = (): string | null => {
  const gitDir = resolveGitDir();
  if (!gitDir) return null;
  const rawHead = readTextFile(path.resolve(gitDir, "HEAD"));
  if (!rawHead) return null;
  const head = rawHead.trim();
  if (!head) return null;
  const match = head.match(/^ref:\s*(.+)$/i);
  if (!match?.[1]) return head;
  const refName = match[1].trim();
  if (!refName) return null;
  const refValue = readTextFile(path.resolve(gitDir, refName))?.trim() ?? "";
  if (refValue) return refValue;
  const packedRefs = readTextFile(path.resolve(gitDir, "packed-refs"));
  if (!packedRefs) return null;
  for (const line of packedRefs.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("^")) continue;
    const [hash, ref] = trimmed.split(/\s+/, 2);
    if (ref === refName && hash) return hash;
  }
  return null;
};

const listGitTrackedPaths = async (): Promise<string[]> => {
  const { stdout } = await execFileAsync("git", ["ls-files", "--recurse-submodules"], {
    cwd: process.cwd(),
    timeout: 20_000,
    maxBuffer: 64 * 1024 * 1024,
  });
  return stdout
    .split(/\r?\n/)
    .map((entry) => normalizeRepoPath(entry))
    .filter((entry) => Boolean(entry));
};

const resolveHeadCommit = async (): Promise<string | null> => {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"], {
      cwd: process.cwd(),
      timeout: 8000,
      maxBuffer: 1024 * 1024,
    });
    const commit = String(stdout ?? "").trim();
    return commit || null;
  } catch {
    return null;
  }
};

class Stage0IndexRuntime {
  private snapshot: Stage0Snapshot | null = null;

  private buildPromise: Promise<Stage0Snapshot | null> | null = null;

  private dirty = false;

  private started = false;

  private watchStarted = false;

  private watchers: fs.FSWatcher[] = [];

  private lastBuildFailureReason: string | null = null;

  private lastHeadCommit: string | null = null;

  private lastHeadCheckMs = 0;

  constructor() {
    if (stage0Enabled()) {
      this.ensureStarted();
    }
  }

  private ensureStarted(): void {
    if (this.started) return;
    this.started = true;
    this.startWatchers();
    void this.rebuild("cold_start");
  }

  private resolveObservedHeadCommit(nowMs: number): string | null {
    if (nowMs - this.lastHeadCheckMs < STAGE0_HEAD_RECHECK_MS) {
      return this.lastHeadCommit;
    }
    this.lastHeadCheckMs = nowMs;
    this.lastHeadCommit = resolveHeadCommitFromGitFiles();
    return this.lastHeadCommit;
  }

  private startWatchers(): void {
    if (this.watchStarted) return;
    this.watchStarted = true;
    for (const watchTarget of resolveWatchedGitFiles()) {
      if (!fs.existsSync(watchTarget)) continue;
      try {
        const watcher = fs.watch(watchTarget, { persistent: false }, () => {
          this.dirty = true;
          void this.refreshIfIdle("git_signal");
        });
        this.watchers.push(watcher);
      } catch {
        // Watch failures should not block retrieval; stale checks still apply.
      }
    }
  }

  private async refreshIfIdle(reason: string): Promise<void> {
    if (this.buildPromise) return;
    await this.rebuild(reason);
  }

  private async rebuild(reason: string): Promise<Stage0Snapshot | null> {
    if (this.buildPromise) return this.buildPromise;
    this.buildPromise = (async () => {
      try {
        const [paths, commit] = await Promise.all([listGitTrackedPaths(), resolveHeadCommit()]);
        const built = buildStage0SnapshotFromPaths(paths, commit, Date.now());
        this.snapshot = built;
        this.dirty = false;
        this.lastBuildFailureReason = null;
        this.lastHeadCommit = commit ?? resolveHeadCommitFromGitFiles();
        this.lastHeadCheckMs = Date.now();
        return built;
      } catch {
        this.lastBuildFailureReason = reason === "cold_start" ? "index_build_failed" : "index_refresh_failed";
        return this.snapshot;
      } finally {
        this.buildPromise = null;
      }
    })();
    return this.buildPromise;
  }

  async query(options: Stage0QueryOptions): Promise<Stage0QueryResult> {
    if (!stage0Enabled()) {
      return {
        candidates: [],
        telemetry: asStage0Telemetry({
          used: false,
          shadow_only: false,
          candidate_count: 0,
          fallback_reason: "stage0_disabled",
          commit: null,
          build_age_ms: null,
        }),
      };
    }
    this.ensureStarted();
    if (!this.snapshot) {
      await this.rebuild("cold_start");
    } else if (this.dirty) {
      void this.refreshIfIdle("dirty");
    }
    const snapshot = this.snapshot;
    if (!snapshot) {
      return {
        candidates: [],
        telemetry: asStage0Telemetry({
          used: false,
          shadow_only: false,
          candidate_count: 0,
          fallback_reason: this.lastBuildFailureReason ?? "index_unavailable",
          commit: null,
          build_age_ms: null,
        }),
      };
    }

    const buildAgeMs = computeBuildAge(snapshot);
    if (snapshot.version !== STAGE0_VERSION) {
      return {
        candidates: [],
        telemetry: asStage0Telemetry({
          used: false,
          shadow_only: false,
          candidate_count: 0,
          fallback_reason: "index_version_mismatch",
          commit: snapshot.commit,
          build_age_ms: buildAgeMs,
        }),
      };
    }
    const nowMs = Date.now();
    const observedHeadCommit = this.resolveObservedHeadCommit(nowMs);
    if (observedHeadCommit && snapshot.commit && observedHeadCommit !== snapshot.commit) {
      this.dirty = true;
      void this.refreshIfIdle("commit_mismatch");
      return {
        candidates: [],
        telemetry: asStage0Telemetry({
          used: false,
          shadow_only: false,
          candidate_count: 0,
          fallback_reason: "index_commit_mismatch",
          commit: snapshot.commit,
          build_age_ms: buildAgeMs,
        }),
      };
    }
    const staleMs = stage0StaleMaxMs();
    const stale = isStage0SnapshotStale(snapshot, nowMs, staleMs);
    if (stale) {
      void this.refreshIfIdle("stale");
      if ((buildAgeMs ?? 0) > staleMs * STAGE0_STALE_HARD_MULTIPLIER) {
        return {
          candidates: [],
          telemetry: asStage0Telemetry({
            used: false,
            shadow_only: false,
            candidate_count: 0,
            fallback_reason: "index_stale",
            commit: snapshot.commit,
            build_age_ms: buildAgeMs,
          }),
        };
      }
    }

    const maxCandidates = clampNumber(options.maxCandidates || stage0MaxCandidates(), 16, 4096);
    const candidates = queryStage0Snapshot(snapshot, { ...options, maxCandidates });
    const shadowOnly = stage0ShadowOnly();
    if (candidates.length === 0) {
      return {
        candidates,
        telemetry: asStage0Telemetry({
          used: false,
          shadow_only: shadowOnly,
          candidate_count: 0,
          fallback_reason: "empty_candidates",
          commit: snapshot.commit,
          build_age_ms: buildAgeMs,
        }),
      };
    }
    return {
      candidates,
      telemetry: asStage0Telemetry({
        used: !shadowOnly,
        shadow_only: shadowOnly,
        candidate_count: candidates.length,
        fallback_reason: shadowOnly ? "shadow_mode" : null,
        commit: snapshot.commit,
        build_age_ms: buildAgeMs,
      }),
    };
  }
}

const stage0Runtime = new Stage0IndexRuntime();

export const queryHelixAskStage0Index = async (
  options: Stage0QueryOptions,
): Promise<Stage0QueryResult> => stage0Runtime.query(options);

export const createStage0ScopeMatcher = (paths: string[]): ((candidatePath: string) => boolean) => {
  const exactPaths = new Set<string>();
  const dirPrefixes: string[] = [];
  for (const entry of paths) {
    const normalized = normalizeRepoPath(entry);
    if (!normalized) continue;
    const absolute = path.resolve(process.cwd(), normalized);
    let isDirectory = false;
    try {
      isDirectory = fs.existsSync(absolute) ? fs.statSync(absolute).isDirectory() : normalized.endsWith("/");
    } catch {
      isDirectory = normalized.endsWith("/");
    }
    if (isDirectory) {
      const prefix = normalized.replace(/\/+$/, "").toLowerCase();
      if (prefix) dirPrefixes.push(`${prefix}/`);
      continue;
    }
    exactPaths.add(normalized.toLowerCase());
  }
  if (exactPaths.size === 0 && dirPrefixes.length === 0) {
    return () => true;
  }
  return (candidatePath: string): boolean => {
    const normalized = normalizeRepoPath(candidatePath).toLowerCase();
    if (!normalized) return false;
    if (exactPaths.has(normalized)) return true;
    return dirPrefixes.some((prefix) => normalized.startsWith(prefix));
  };
};

export const applyStage0HitRate = (
  telemetry: Stage0Telemetry,
  candidates: Array<{ filePath: string }>,
  hits: Array<{ filePath: string }>,
): Stage0Telemetry => {
  if (candidates.length === 0) {
    return asStage0Telemetry({ ...telemetry, hit_rate: 0, candidate_count: 0 });
  }
  const candidateSet = new Set(candidates.map((entry) => normalizeRepoPath(entry.filePath).toLowerCase()));
  const matched = new Set<string>();
  for (const hit of hits) {
    const normalized = normalizeRepoPath(String(hit.filePath ?? "")).toLowerCase();
    if (!normalized) continue;
    if (candidateSet.has(normalized)) matched.add(normalized);
  }
  const hitRate = matched.size / Math.max(1, candidateSet.size);
  return asStage0Telemetry({
    ...telemetry,
    candidate_count: candidates.length,
    hit_rate: Number(hitRate.toFixed(4)),
  });
};
