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

const stableSort = (items: string[]): string[] => Array.from(new Set(items.map((x) => x.trim()).filter(Boolean))).sort();

export function canonicalizePatchInput(input: { title: string; touchedPaths?: string[]; intentTags?: string[] }) {
  return {
    title: input.title.trim(),
    touchedPaths: stableSort(input.touchedPaths ?? []),
    intentTags: stableSort(input.intentTags ?? []),
  };
}

export function derivePatchId(input: { title: string; touchedPaths?: string[]; intentTags?: string[] }): string {
  const canonical = canonicalizePatchInput(input);
  const raw = JSON.stringify(canonical);
  return `patch:${crypto.createHash("sha256").update(raw).digest("hex")}`;
}

export function appendPatchRecord(record: EvolutionPatchRecord): { ok: true; path: string } | { ok: false; code: "EVOLUTION_PERSIST_FAILED"; message: string } {
  try {
    fs.mkdirSync(EVOLUTION_DIR, { recursive: true });
    fs.appendFileSync(PATCHES_PATH, `${JSON.stringify(record)}\n`, "utf8");
    return { ok: true, path: PATCHES_PATH };
  } catch (error) {
    return { ok: false, code: "EVOLUTION_PERSIST_FAILED", message: error instanceof Error ? error.message : "unknown persist error" };
  }
}

export function getPatchesPath(): string {
  return PATCHES_PATH;
}
