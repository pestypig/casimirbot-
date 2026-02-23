import fs from "node:fs";
import type { EvolutionPatchRecord } from "./patch-store";
import { getPatchesPath } from "./patch-store";
import { getDeterministicCoChangeBaseline } from "./git-history";

const parsePatchRecord = (line: string): EvolutionPatchRecord | null => {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as Partial<EvolutionPatchRecord>;
    if (
      typeof parsed.patchId !== "string" ||
      typeof parsed.ts !== "string" ||
      typeof parsed.title !== "string" ||
      !Array.isArray(parsed.touchedPaths) ||
      !Array.isArray(parsed.intentTags)
    ) {
      return null;
    }
    return {
      patchId: parsed.patchId,
      ts: parsed.ts,
      title: parsed.title,
      touchedPaths: parsed.touchedPaths.filter((x): x is string => typeof x === "string"),
      intentTags: parsed.intentTags.filter((x): x is string => typeof x === "string"),
    };
  } catch {
    return null;
  }
};

const loadPatchRows = (): EvolutionPatchRecord[] => {
  const patchesPath = getPatchesPath();
  if (!fs.existsSync(patchesPath)) return [];
  return fs
    .readFileSync(patchesPath, "utf8")
    .split(/\r?\n/)
    .map(parsePatchRecord)
    .filter((row): row is EvolutionPatchRecord => row !== null)
    .sort((a, b) => a.ts.localeCompare(b.ts));
};

export function getTrajectory(id: string) {
  const rows = loadPatchRows();
  const patch = rows.find((row) => row.patchId === id);
  if (!patch) return null;

  const coChange = getDeterministicCoChangeBaseline(25).slice(0, 10);
  const touched = patch.touchedPaths;
  const hotspot = coChange
    .filter((edge) => touched.includes(edge.left) || touched.includes(edge.right))
    .slice(0, 5);

  return {
    id,
    rollingState: {
      patchesSeen: rows.length,
      latestTimestamp: patch.ts,
    },
    hotspotSummary: hotspot,
    unresolvedRisks: hotspot
      .filter((edge) => edge.weight >= 3)
      .map((edge) => `cochange_spike:${edge.left}<->${edge.right}`),
  };
}
