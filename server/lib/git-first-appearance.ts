import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(execFile);

export type FileFirstAppearance = {
  path: string;
  timestampMs: number;
  iso: string;
  commit: string;
  author: string;
  email: string;
};

type CacheEntry = {
  items: FileFirstAppearance[];
  cachedAt: number;
};

const CACHE_TTL_MS = 60_000;
let cache: CacheEntry | null = null;

const parseLimit = (value?: string | string[]): number | undefined => {
  if (!value) return undefined;
  const str = Array.isArray(value) ? value[0] : value;
  const num = Number.parseInt(str, 10);
  return Number.isFinite(num) && num > 0 ? num : undefined;
};

export async function getGitFirstAppearances(options?: {
  repoRoot?: string;
  limit?: string | string[] | number;
}): Promise<{ items: FileFirstAppearance[]; total: number; cachedAt: number }> {
  const repoRoot = path.resolve(options?.repoRoot || process.cwd());
  const limit =
    typeof options?.limit === "number"
      ? (Number.isFinite(options.limit) && options.limit > 0
          ? Math.floor(options.limit)
          : undefined)
      : parseLimit(options?.limit);

  const now = Date.now();
  if (cache && now - cache.cachedAt < CACHE_TTL_MS) {
    const items =
      typeof limit === "number"
        ? cache.items.slice(0, limit)
        : cache.items.slice();
    return { items, total: cache.items.length, cachedAt: cache.cachedAt };
  }

  let stdout: string;
  try {
    ({ stdout } = await execAsync(
      "git",
      [
        "log",
        "--reverse",
        "--no-merges",
        "--diff-filter=A",
        "--format=%H|%ct|%an|%ae",
        "--name-only",
      ],
      { cwd: repoRoot, maxBuffer: 20 * 1024 * 1024 },
    ));
  } catch (err) {
    const message =
      err instanceof Error && typeof err.message === "string"
        ? err.message
        : String(err);
    throw new Error(
      `git log failed while building first-appearance data: ${message}`,
    );
  }

  const lines = stdout.split(/\r?\n/);
  let currentCommit:
    | { sha: string; tsMs: number; author: string; email: string }
    | null = null;
  const firstSeen = new Map<string, FileFirstAppearance>();

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (/^[0-9a-f]{7,40}\|/i.test(line)) {
      const [sha, tsSeconds, author, email] = line.split("|");
      const tsMs = Number(tsSeconds) * 1000;
      if (!sha || !Number.isFinite(tsMs)) {
        currentCommit = null;
        continue;
      }
      currentCommit = {
        sha,
        tsMs,
        author: author || "unknown",
        email: email || "",
      };
      continue;
    }

    if (!currentCommit) continue;
    if (firstSeen.has(line)) continue;

    firstSeen.set(line, {
      path: line,
      timestampMs: currentCommit.tsMs,
      iso: new Date(currentCommit.tsMs).toISOString(),
      commit: currentCommit.sha,
      author: currentCommit.author,
      email: currentCommit.email,
    });
  }

  const sorted = Array.from(firstSeen.values()).sort(
    (a, b) => a.timestampMs - b.timestampMs,
  );
  cache = { items: sorted, cachedAt: Date.now() };

  const limited =
    typeof limit === "number" ? sorted.slice(0, limit) : sorted.slice();
  return { items: limited, total: sorted.length, cachedAt: cache.cachedAt };
}
