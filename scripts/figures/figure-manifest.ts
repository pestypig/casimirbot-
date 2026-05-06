import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import type { Nhm2ScientificFigureRecord } from "../../shared/contracts/nhm2-scientific-figure-atlas.v1.js";

export const CLAIM_BOUNDARY = {
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
  doesValidateNHM2: false,
} as const;

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function readJsonIfExists(pathname: string): any {
  if (!fs.existsSync(pathname)) return null;
  return JSON.parse(fs.readFileSync(pathname, "utf8"));
}

export function writeJson(pathname: string, value: unknown): void {
  ensureDir(path.dirname(pathname));
  fs.writeFileSync(pathname, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function sha256File(pathname: string): string {
  return createHash("sha256").update(fs.readFileSync(pathname)).digest("hex");
}

export function sha256Text(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function relPath(pathname: string, root = process.cwd()): string {
  return path.relative(root, pathname).replace(/\\/g, "/");
}

export function makeRecord(
  partial: Omit<Nhm2ScientificFigureRecord, "claimBoundary">,
): Nhm2ScientificFigureRecord {
  return {
    ...partial,
    claimBoundary: CLAIM_BOUNDARY,
  };
}

export function findNewestFile(root: string, pattern: RegExp): string | null {
  if (!fs.existsSync(root)) return null;
  const candidates: string[] = [];
  const visit = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (pattern.test(entry.name)) candidates.push(full);
    }
  };
  visit(root);
  candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs || a.localeCompare(b));
  return candidates[0] ?? null;
}
