import fs from "node:fs";
import { getPatchesPath } from "./patch-store";
import { getDeterministicCoChangeBaseline } from "./git-history";

export function getTrajectory(id: string) {
  const path = getPatchesPath();
  const rows = fs.existsSync(path)
    ? fs.readFileSync(path, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line))
    : [];
  const patch = rows.find((row) => row.patchId === id);
  if (!patch) return null;

  const coChange = getDeterministicCoChangeBaseline(25).slice(0, 10);
  const touched = (patch.touchedPaths ?? []) as string[];
  const hotspot = coChange.filter((edge) => touched.includes(edge.left) || touched.includes(edge.right)).slice(0, 5);

  return {
    id,
    rollingState: {
      patchesSeen: rows.length,
      latestTimestamp: patch.ts,
    },
    hotspotSummary: hotspot,
    unresolvedRisks: hotspot.filter((edge) => edge.weight >= 3).map((edge) => `cochange_spike:${edge.left}<->${edge.right}`),
  };
}
