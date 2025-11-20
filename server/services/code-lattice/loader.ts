import fs from "node:fs/promises";
import path from "node:path";
import type { CodeLatticeSnapshot } from "@shared/code-lattice";

let cached: { snapshot: CodeLatticeSnapshot; loadedAt: number } | null = null;
let lastKnownVersion = 0;
const SNAPSHOT_PATH = path.join(process.cwd(), "server/_generated/code-lattice.json");

async function readSnapshot(): Promise<CodeLatticeSnapshot | null> {
  try {
    const raw = await fs.readFile(SNAPSHOT_PATH, "utf8");
    return JSON.parse(raw) as CodeLatticeSnapshot;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function loadCodeLattice(options?: {
  refresh?: boolean;
}): Promise<CodeLatticeSnapshot | null> {
  if (!options?.refresh && cached) {
    return cached.snapshot;
  }
  const snapshot = await readSnapshot();
  if (snapshot) {
    cached = { snapshot, loadedAt: Date.now() };
    if (typeof snapshot.latticeVersion === "number") {
      lastKnownVersion = snapshot.latticeVersion;
    }
  } else {
    cached = null;
  }
  return snapshot;
}

export function invalidateCodeLattice(): void {
  cached = null;
}

export function getLatticeVersion(): number {
  if (cached?.snapshot?.latticeVersion) {
    return cached.snapshot.latticeVersion;
  }
  return lastKnownVersion;
}
