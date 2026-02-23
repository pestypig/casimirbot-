import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type EvolutionPatchRecord = {
  patchId: string;
  ts: string;
  title: string;
  touchedPaths: string[];
  intentTags: string[];
};

const EVOLUTION_DIR = path.resolve(process.cwd(), ".cal/evolution");
const PATCHES_PATH = path.join(EVOLUTION_DIR, "patches.jsonl");
const PATCH_RETENTION_MAX = Math.max(
  50,
  Number.isFinite(Number(process.env.EVOLUTION_PATCH_RETENTION_MAX))
    ? Math.floor(Number(process.env.EVOLUTION_PATCH_RETENTION_MAX))
    : 1000,
);

const stableSort = (items: string[]): string[] =>
  Array.from(new Set(items.map((x) => x.trim()).filter(Boolean))).sort();

const prunePatchHistory = (): void => {
  if (!fs.existsSync(PATCHES_PATH)) return;
  const lines = fs
    .readFileSync(PATCHES_PATH, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  if (lines.length <= PATCH_RETENTION_MAX) return;
  const kept = lines.slice(-PATCH_RETENTION_MAX);
  fs.writeFileSync(PATCHES_PATH, `${kept.join("\n")}\n`, "utf8");
};

export function canonicalizePatchInput(input: {
  title: string;
  touchedPaths?: string[];
  intentTags?: string[];
}) {
  return {
    title: input.title.trim(),
    touchedPaths: stableSort(input.touchedPaths ?? []),
    intentTags: stableSort(input.intentTags ?? []),
  };
}

export function derivePatchId(input: {
  title: string;
  touchedPaths?: string[];
  intentTags?: string[];
}): string {
  const canonical = canonicalizePatchInput(input);
  const raw = JSON.stringify(canonical);
  return `patch:${crypto.createHash("sha256").update(raw).digest("hex")}`;
}

export function appendPatchRecord(
  record: EvolutionPatchRecord,
): { ok: true; path: string } | { ok: false; code: "EVOLUTION_PERSIST_FAILED"; message: string } {
  try {
    fs.mkdirSync(EVOLUTION_DIR, { recursive: true });
    fs.appendFileSync(PATCHES_PATH, `${JSON.stringify(record)}\n`, "utf8");
    prunePatchHistory();
    return { ok: true, path: PATCHES_PATH };
  } catch (error) {
    return {
      ok: false,
      code: "EVOLUTION_PERSIST_FAILED",
      message: error instanceof Error ? error.message : "unknown persist error",
    };
  }
}

export function getPatchesPath(): string {
  return PATCHES_PATH;
}
