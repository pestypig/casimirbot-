import { execSync } from "node:child_process";

export type CoChangeEdge = { left: string; right: string; weight: number };

export function getDeterministicCoChangeBaseline(maxCommits = 40): CoChangeEdge[] {
  try {
    const raw = execSync(`git log -n ${Math.max(1, maxCommits)} --name-only --pretty=format:__COMMIT__`, { encoding: "utf8" });
    const groups = raw.split("__COMMIT__").map((chunk) => chunk.split("\n").map((line) => line.trim()).filter(Boolean));
    const map = new Map<string, number>();
    for (const files of groups) {
      const unique = Array.from(new Set(files)).sort();
      for (let i = 0; i < unique.length; i++) {
        for (let j = i + 1; j < unique.length; j++) {
          const key = `${unique[i]}::${unique[j]}`;
          map.set(key, (map.get(key) ?? 0) + 1);
        }
      }
    }
    return Array.from(map.entries())
      .map(([key, weight]) => {
        const [left, right] = key.split("::");
        return { left, right, weight };
      })
      .sort((a, b) => b.weight - a.weight || a.left.localeCompare(b.left) || a.right.localeCompare(b.right));
  } catch {
    return [];
  }
}
