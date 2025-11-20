import fs from "node:fs/promises";
import path from "node:path";
import chokidar from "chokidar";
import type { CodeLatticeSnapshot } from "@shared/code-lattice";
import {
  CODE_LATTICE_IGNORE_PATTERNS,
  CODE_LATTICE_SOURCE_GLOBS,
  buildCodeLatticeSnapshot,
  buildSnapshotFromContexts,
  detectCommit,
  loadTelemetrySnapshot,
  loadTestSuites,
  readFileContexts,
  type FileContext,
} from "./builders";
import { essenceHub } from "../essence/events";
import { invalidateCodeLattice } from "./loader";

type PendingType = "change" | "delete";
export type LatticeWatcherOptions = {
  root?: string;
  patterns?: string[];
  debounceMs?: number;
};

export type LatticeWatcherHandle = {
  close(): Promise<void>;
  getVersion(): number;
};

type DeltaStats = {
  filesTouched: number;
  addedNodes: number;
  updatedNodes: number;
  removedNodes: number;
  edgeDelta: number;
};

type WatcherState = {
  root: string;
  contexts: Map<string, FileContext>;
  snapshot: CodeLatticeSnapshot;
  version: number;
};

const WATCH_PATTERNS = [
  "client/src/**/*.{ts,tsx}",
  "server/**/*.{ts,tsx}",
  "shared/**/*.{ts,tsx}",
];

const WATCH_IGNORES = [
  "**/node_modules/**",
  "**/.git/**",
  "**/.next/**",
  "**/dist/**",
  "**/build/**",
  "**/_generated/**",
  "**/*.stories.*",
  "**/*.d.ts",
  "**/*.test.d.ts",
];

const toPosix = (value: string): string => value.replace(/\\/g, "/");

async function writeSnapshot(root: string, snapshot: CodeLatticeSnapshot): Promise<void> {
  const outDir = path.join(root, "server/_generated");
  await fs.mkdir(outDir, { recursive: true });
  const target = path.join(outDir, "code-lattice.json");
  await fs.writeFile(target, JSON.stringify(snapshot, null, 2));
}

const zeroStats = (): DeltaStats => ({
  filesTouched: 0,
  addedNodes: 0,
  updatedNodes: 0,
  removedNodes: 0,
  edgeDelta: 0,
});

const diffNodes = (before?: FileContext, after?: FileContext | null): Pick<DeltaStats, "addedNodes" | "updatedNodes" | "removedNodes"> => {
  const prevIds = new Set((before?.nodes ?? []).map((node) => node.feature.nodeId));
  const nextIds = new Set((after?.nodes ?? []).map((node) => node.feature.nodeId));
  let added = 0;
  let updated = 0;
  for (const id of nextIds) {
    if (prevIds.has(id)) {
      updated += 1;
    } else {
      added += 1;
    }
  }
  let removed = 0;
  for (const id of prevIds) {
    if (!nextIds.has(id)) {
      removed += 1;
    }
  }
  return { addedNodes: added, updatedNodes: updated, removedNodes: removed };
};

async function buildInitialState(root: string): Promise<WatcherState> {
  const { snapshot, contexts } = await buildCodeLatticeSnapshot({
    globs: CODE_LATTICE_SOURCE_GLOBS,
    ignore: CODE_LATTICE_IGNORE_PATTERNS,
    logStats: false,
  });
  const version = snapshot.latticeVersion && snapshot.latticeVersion > 0 ? snapshot.latticeVersion : 1;
  const normalized = { ...snapshot, latticeVersion: version };
  await writeSnapshot(root, normalized);
  invalidateCodeLattice();
  return {
    root,
    contexts: new Map(contexts.map((ctx) => [ctx.path, ctx])),
    snapshot: normalized,
    version,
  };
}

async function rebuildAll(state: WatcherState, reason: string): Promise<DeltaStats | null> {
  console.warn(`[code-lattice:watcher] ${reason}; rebuilding entire lattice.`);
  try {
    const { snapshot, contexts } = await buildCodeLatticeSnapshot({
      globs: CODE_LATTICE_SOURCE_GLOBS,
      ignore: CODE_LATTICE_IGNORE_PATTERNS,
      logStats: false,
    });
    const prevEdges = state.snapshot.edges.length;
    const prevNodes = state.snapshot.nodes.length;
    state.version += 1;
    const nextSnapshot = { ...snapshot, latticeVersion: state.version };
    state.snapshot = nextSnapshot;
    state.contexts = new Map(contexts.map((ctx) => [ctx.path, ctx]));
    await writeSnapshot(state.root, nextSnapshot);
    invalidateCodeLattice();
    return {
      filesTouched: contexts.length,
      addedNodes: Math.max(0, nextSnapshot.nodes.length - prevNodes),
      updatedNodes: Math.min(nextSnapshot.nodes.length, prevNodes),
      removedNodes: Math.max(0, prevNodes - nextSnapshot.nodes.length),
      edgeDelta: nextSnapshot.edges.length - prevEdges,
    };
  } catch (error) {
    console.error("[code-lattice:watcher] full rebuild failed", error);
    return null;
  }
}

export async function startLatticeWatcher(
  options: LatticeWatcherOptions = {},
): Promise<LatticeWatcherHandle> {
  const root = toPosix(path.resolve(options.root ?? process.cwd()));
  const patterns = options.patterns ?? WATCH_PATTERNS;
  const debounceMs = Math.max(100, options.debounceMs ?? 350);
  const state = await buildInitialState(root);

  const pending = new Map<string, PendingType>();
  let timer: NodeJS.Timeout | null = null;
  let processing = false;

  const flushQueue = async (): Promise<void> => {
    if (processing || pending.size === 0) {
      return;
    }
    processing = true;
    const batch = Array.from(pending.entries());
    pending.clear();
    const touched = new Set<string>();
    let addedNodes = 0;
    let updatedNodes = 0;
    let removedNodes = 0;
    let needsRebuild = false;
    const commit = detectCommit();

    for (const [relative, type] of batch) {
      touched.add(relative);
      if (type === "delete") {
        const existing = state.contexts.get(relative);
        if (existing) {
          const delta = diffNodes(existing, null);
          addedNodes += delta.addedNodes;
          updatedNodes += delta.updatedNodes;
          removedNodes += delta.removedNodes;
          state.contexts.delete(relative);
        }
        continue;
      }
      const absolute = toPosix(path.resolve(root, relative));
      try {
        const contexts = await readFileContexts([absolute], commit);
        if (contexts.length === 0) {
          continue;
        }
        const context = contexts[0];
        const previous = state.contexts.get(context.path);
        const delta = diffNodes(previous, context);
        addedNodes += delta.addedNodes;
        updatedNodes += delta.updatedNodes;
        removedNodes += delta.removedNodes;
        state.contexts.set(context.path, context);
      } catch (error) {
        console.warn(`[code-lattice:watcher] failed to parse ${relative}`, error);
        needsRebuild = true;
        break;
      }
    }

    if (needsRebuild) {
      const stats = await rebuildAll(state, "parse failure");
      if (stats) {
        essenceHub.emit("code-lattice:updated", {
          type: "code-lattice:updated",
          version: state.version,
          stats,
        });
      }
      processing = false;
      return;
    }

    if (touched.size === 0) {
      processing = false;
      return;
    }

    const contexts = Array.from(state.contexts.values());
    const [telemetrySnapshot, testSuites] = await Promise.all([
      loadTelemetrySnapshot(),
      loadTestSuites(),
    ]);
    const { snapshot } = buildSnapshotFromContexts({
      contexts,
      commit,
      telemetry: telemetrySnapshot,
      suites: testSuites,
      logStats: false,
    });
    const prevEdges = state.snapshot.edges.length;
    state.version += 1;
    const nextSnapshot = { ...snapshot, latticeVersion: state.version };
    state.snapshot = nextSnapshot;
    await writeSnapshot(root, nextSnapshot);
    invalidateCodeLattice();
    const stats: DeltaStats = {
      filesTouched: touched.size,
      addedNodes,
      updatedNodes,
      removedNodes,
      edgeDelta: nextSnapshot.edges.length - prevEdges,
    };
    essenceHub.emit("code-lattice:updated", {
      type: "code-lattice:updated",
      version: state.version,
      stats,
    });
    processing = false;
  };

  const schedule = (relative: string, type: PendingType): void => {
    pending.set(toPosix(relative), type);
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      void flushQueue();
    }, debounceMs);
  };

  const watcher = chokidar.watch(patterns, {
    cwd: root,
    ignoreInitial: true,
    ignored: WATCH_IGNORES,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
  });

  watcher
    .on("add", (file) => schedule(file, "change"))
    .on("change", (file) => schedule(file, "change"))
    .on("unlink", (file) => schedule(file, "delete"));

  const handle: LatticeWatcherHandle = {
    async close() {
      if (timer) {
        clearTimeout(timer);
      }
      await watcher.close();
    },
    getVersion() {
      return state.version;
    },
  };

  return handle;
}
