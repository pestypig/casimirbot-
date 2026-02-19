import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type RootEntry = {
  id: string;
  tree_lane?: string;
  tree_path?: string;
};

type PathFalsifier = {
  uncertainty_model?: string;
  test_refs?: string[];
};

type PathMaturityGate = {
  strict_fail_reason?: string;
};

type PathEntry = {
  root_id: string;
  falsifier?: PathFalsifier;
  maturity_gate?: PathMaturityGate;
};

type Manifest = { roots: RootEntry[]; paths: PathEntry[] };
type ResolverTree = { id: string; path: string };
type Resolvers = { trees: ResolverTree[] };
type TreeNode = {
  id: string;
  derived_residual?: {
    schema?: string;
    tolerance?: { max?: number };
    uncertainty?: { model?: string };
  };
};
type LaneTree = { rootId: string; nodes: TreeNode[] };

const REQUIRED_ROOT_TREE_MAP: Record<string, string> = {
  physics_spacetime_gr: "docs/knowledge/physics/physics-spacetime-gr-tree.json",
  physics_quantum_semiclassical: "docs/knowledge/physics/physics-quantum-semiclassical-tree.json",
  physics_thermodynamics_entropy: "docs/knowledge/physics/physics-thermodynamics-entropy-tree.json",
  physics_information_dynamics: "docs/knowledge/physics/physics-information-dynamics-tree.json",
  physics_prebiotic_chemistry: "docs/knowledge/physics/physics-prebiotic-chemistry-tree.json",
  physics_biology_life: "docs/knowledge/physics/physics-biology-life-tree.json",
  physics_runtime_safety_control: "docs/knowledge/physics/physics-runtime-safety-control-tree.json",
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

  it("requires explicit falsifier linkage for information-dynamics paths", () => {
    const repoRoot = process.cwd();
    const manifestPath = path.join(repoRoot, "configs", "physics-root-leaf-manifest.v1.json");

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Manifest;

    const informationPaths = manifest.paths.filter((entry) => entry.root_id === "physics_information_dynamics");
    expect(informationPaths.length).toBeGreaterThan(0);

    for (const entry of informationPaths) {
      expect(entry.falsifier).toBeTruthy();
      expect(entry.falsifier?.test_refs ?? []).toContain("tests/physics-root-lane-tree-parity.spec.ts");
    }
  });


  it("requires explicit deterministic strict fail reasons for runtime safety control paths", () => {
    const repoRoot = process.cwd();
    const manifestPath = path.join(repoRoot, "configs", "physics-root-leaf-manifest.v1.json");

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Manifest;

    const runtimePaths = manifest.paths.filter((entry) => entry.root_id === "physics_runtime_safety_control");
    expect(runtimePaths.length).toBeGreaterThan(0);

    for (const entry of runtimePaths) {
      expect(entry.falsifier).toBeTruthy();
      expect(entry.falsifier?.uncertainty_model?.startsWith("runtime_gate_thresholds")).toBe(true);
      expect(entry.maturity_gate?.strict_fail_reason).toBe("ROOT_LEAF_RUNTIME_CONTROL_PATH_MISSING");
    }
  });

  it("requires derived residual schema plus tolerance and uncertainty declaration for each physics root lane tree", () => {
    const repoRoot = process.cwd();

    for (const treePath of Object.values(REQUIRED_ROOT_TREE_MAP)) {
      const fullTreePath = path.join(repoRoot, treePath);
      const tree = JSON.parse(fs.readFileSync(fullTreePath, "utf8")) as LaneTree;

      const residualNodes = tree.nodes.filter((node) => Boolean(node.derived_residual));
      expect(residualNodes.length).toBeGreaterThan(0);

      const hasDeclaredContract = residualNodes.some((node) => {
        const residual = node.derived_residual;
        return Boolean(
          residual?.schema &&
            typeof residual.tolerance?.max === "number" &&
            residual.uncertainty?.model,
        );
      });

      expect(hasDeclaredContract).toBe(true);
    }
  });

});
