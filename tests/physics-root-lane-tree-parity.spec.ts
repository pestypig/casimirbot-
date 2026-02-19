import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type RootEntry = {
  id: string;
  tree_lane?: string;
  tree_path?: string;
};

type Manifest = { roots: RootEntry[] };
type ResolverTree = { id: string; path: string };
type Resolvers = { trees: ResolverTree[] };

const REQUIRED_ROOT_TREE_MAP: Record<string, string> = {
  physics_spacetime_gr: "docs/knowledge/physics/physics-spacetime-gr-tree.json",
  physics_quantum_semiclassical: "docs/knowledge/physics/physics-quantum-semiclassical-tree.json",
};

describe("physics root-lane tree parity", () => {
  it("maps dedicated manifest root lanes to deterministic graph resolver tree lanes", () => {
    const repoRoot = process.cwd();
    const manifestPath = path.join(repoRoot, "configs", "physics-root-leaf-manifest.v1.json");
    const resolversPath = path.join(repoRoot, "configs", "graph-resolvers.json");

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Manifest;
    const resolvers = JSON.parse(fs.readFileSync(resolversPath, "utf8")) as Resolvers;

    const rootsById = new Map(manifest.roots.map((root) => [root.id, root]));
    const treesById = new Map(resolvers.trees.map((tree) => [tree.id, tree.path]));

    for (const [rootId, expectedPath] of Object.entries(REQUIRED_ROOT_TREE_MAP)) {
      const root = rootsById.get(rootId);
      expect(root).toBeTruthy();
      expect(root?.tree_lane).toBe(rootId);
      expect(root?.tree_path).toBe(expectedPath);
      expect(treesById.get(rootId)).toBe(expectedPath);
    }
  });
});
