import * as fs from "node:fs";
import * as path from "node:path";

function collectIds(value: unknown, ids: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectIds(item, ids);
    }
    return;
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const [key, val] of Object.entries(obj)) {
      if (key === "id" && typeof val === "string") {
        ids.add(val);
      }
      collectIds(val, ids);
    }
  }
}

export function loadIdeologyIdSet(repoRoot: string, ideologyJsonPath: string): Set<string> {
  const fullPath = path.resolve(repoRoot, ideologyJsonPath);
  const raw = fs.readFileSync(fullPath, "utf8");
  const json = JSON.parse(raw);

  const ids = new Set<string>();
  collectIds(json, ids);
  return ids;
}
