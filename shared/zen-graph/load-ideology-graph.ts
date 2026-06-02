import { readFile } from "node:fs/promises";
import path from "node:path";
import type { IdeologyGraph, IdeologyGraphDocument } from "./ideology-graph-types";
export { buildIdeologyGraph } from "./build-ideology-graph";
import { buildIdeologyGraph } from "./build-ideology-graph";

export function defaultIdeologyGraphPath(cwd = process.cwd()): string {
  return path.resolve(cwd, "docs", "ethos", "ideology.json");
}

export async function loadIdeologyGraphFromFile(filePath = defaultIdeologyGraphPath()): Promise<IdeologyGraph> {
  const raw = await readFile(filePath, "utf-8");
  return buildIdeologyGraph(JSON.parse(raw) as IdeologyGraphDocument);
}
