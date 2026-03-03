import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { RepoAtlas } from "./repo-atlas-build";

const DEFAULT_ATLAS_PATH = path.join(process.cwd(), "artifacts", "repo-atlas", "repo-atlas.v1.json");

type Direction = "upstream" | "downstream";

const normalize = (value: string): string => value.trim().toLowerCase();

export const loadAtlas = async (atlasPath = DEFAULT_ATLAS_PATH): Promise<RepoAtlas> => {
  const raw = await fs.readFile(atlasPath, "utf8");
  return JSON.parse(raw) as RepoAtlas;
};

const rankFieldMatch = (value: string, needle: string, fieldWeight: number): number => {
  const normalized = normalize(value);
  if (!normalized) return -1;
  if (normalized === needle) return 1000 + fieldWeight;
  if (normalized.startsWith(needle)) return 500 + fieldWeight - Math.max(0, normalized.length - needle.length);
  if (normalized.includes(needle)) return 100 + fieldWeight - Math.max(0, normalized.length - needle.length);
  return -1;
};

export const resolveIdentifier = (atlas: RepoAtlas, identifier: string) => {
  const needle = normalize(identifier);
  if (!needle) return undefined;

  const ranked = atlas.nodes
    .map((node) => {
      const score = Math.max(
        rankFieldMatch(node.id, needle, 30),
        rankFieldMatch(node.label, needle, 20),
        rankFieldMatch(node.path ?? "", needle, 10),
      );
      return { node, score };
    })
    .filter((row) => row.score >= 0)
    .sort((a, b) => b.score - a.score || a.node.id.localeCompare(b.node.id));

  return ranked[0]?.node;
};

const buildAdjacency = (atlas: RepoAtlas, direction: Direction): Map<string, string[]> => {
  const map = new Map<string, string[]>();
  for (const edge of atlas.edges) {
    const from = direction === "downstream" ? edge.source : edge.target;
    const to = direction === "downstream" ? edge.target : edge.source;
    const list = map.get(from) ?? [];
    list.push(to);
    map.set(from, list);
  }
  return map;
};

const bfsPaths = (atlas: RepoAtlas, startId: string, direction: Direction, maxDepth = 4): string[][] => {
  const adjacency = buildAdjacency(atlas, direction);
  const queue: Array<{ id: string; path: string[]; depth: number }> = [{ id: startId, path: [startId], depth: 0 }];
  const visited = new Set<string>([startId]);
  const paths: string[][] = [];

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) break;
    if (item.depth >= maxDepth) continue;
    for (const nextId of adjacency.get(item.id) ?? []) {
      const nextPath = [...item.path, nextId];
      paths.push(nextPath);
      if (!visited.has(nextId)) {
        visited.add(nextId);
        queue.push({ id: nextId, path: nextPath, depth: item.depth + 1 });
      }
    }
  }

  return paths.sort((a, b) => a.join("|").localeCompare(b.join("|")));
};

export const whyIdentifier = (atlas: RepoAtlas, identifier: string) => {
  const node = resolveIdentifier(atlas, identifier);
  if (!node) return null;
  const producers = bfsPaths(atlas, node.id, "upstream", 3);
  const consumers = bfsPaths(atlas, node.id, "downstream", 3);
  return { node, producers, consumers };
};

export const traceIdentifier = (atlas: RepoAtlas, identifier: string, direction: Direction) => {
  const node = resolveIdentifier(atlas, identifier);
  if (!node) return null;
  return { node, direction, paths: bfsPaths(atlas, node.id, direction, 6) };
};

function printResult(title: string, payload: unknown) {
  console.log(`# ${title}`);
  console.log(JSON.stringify(payload, null, 2));
}

async function main() {
  const [command, identifier, ...rest] = process.argv.slice(2);
  if (!command || !identifier) {
    console.error("Usage: tsx scripts/repo-atlas-query.ts <why|trace> <identifier> [--upstream|--downstream]");
    process.exitCode = 1;
    return;
  }

  const atlas = await loadAtlas();

  if (command === "why") {
    const result = whyIdentifier(atlas, identifier);
    if (!result) {
      console.error(`Identifier not found: ${identifier}`);
      process.exitCode = 1;
      return;
    }
    printResult(`why ${identifier}`, result);
    return;
  }

  if (command === "trace") {
    const direction: Direction = rest.includes("--upstream") ? "upstream" : "downstream";
    const result = traceIdentifier(atlas, identifier, direction);
    if (!result) {
      console.error(`Identifier not found: ${identifier}`);
      process.exitCode = 1;
      return;
    }
    printResult(`trace ${identifier} (${direction})`, result);
    return;
  }

  console.error(`Unknown command: ${command}`);
  process.exitCode = 1;
}

export const isDirectExecution = (importMetaUrl: string, argvPath = process.argv[1]): boolean => {
  if (!argvPath) return false;
  return importMetaUrl === pathToFileURL(path.resolve(argvPath)).href;
};

if (isDirectExecution(import.meta.url)) {
  void main();
}
