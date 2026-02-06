import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type TreeNode = {
  id: string;
  nodeType?: string;
  links?: Array<{ rel: string; to: string }>;
  bridge?: { left: string; right: string; relation?: string };
  evidence?: Array<{ scope?: string }>;
};

type TreeFile = { nodes: TreeNode[] };

const walkTreeFiles = (dir: string, acc: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkTreeFiles(full, acc);
      continue;
    }
    if (entry.endsWith("-tree.json")) {
      acc.push(full);
    }
  }
  return acc;
};

const loadTree = (filePath: string): TreeFile =>
  JSON.parse(readFileSync(filePath, "utf8")) as TreeFile;

const ensureLink = (links: TreeNode["links"] | undefined, rel: string, to: string) =>
  Array.isArray(links) && links.some((link) => link.rel === rel && link.to === to);

describe("Helix Ask bridge nodes", () => {
  const treeFiles = walkTreeFiles(join(process.cwd(), "docs", "knowledge"));

  it("bridge nodes bind left/right and include scoped evidence", () => {
    const bridgeNodes: Array<{ file: string; node: TreeNode }> = [];
    for (const file of treeFiles) {
      const tree = loadTree(file);
      for (const node of tree.nodes ?? []) {
        if (node.nodeType === "bridge" || node.bridge) {
          bridgeNodes.push({ file, node });
        }
      }
    }

    if (bridgeNodes.length === 0) {
      return;
    }

    for (const { file, node } of bridgeNodes) {
      expect(node.bridge, `${file} ${node.id} missing bridge block`).toBeTruthy();
      const bridge = node.bridge!;
      expect(bridge.left, `${file} ${node.id} missing bridge.left`).toBeTruthy();
      expect(bridge.right, `${file} ${node.id} missing bridge.right`).toBeTruthy();
      expect(bridge.relation, `${file} ${node.id} missing bridge.relation`).toBeTruthy();

      const tree = loadTree(file);
      const nodeIds = new Set(tree.nodes.map((entry) => entry.id));
      expect(nodeIds.has(bridge.left), `${file} ${node.id} left target missing`).toBe(true);
      expect(nodeIds.has(bridge.right), `${file} ${node.id} right target missing`).toBe(true);

      expect(ensureLink(node.links, "see-also", bridge.left), `${file} ${node.id} missing see-also to left`).toBe(true);
      expect(ensureLink(node.links, "see-also", bridge.right), `${file} ${node.id} missing see-also to right`).toBe(true);

      const evidence = node.evidence ?? [];
      const hasLeft = evidence.some((entry) => entry.scope === "left");
      const hasRight = evidence.some((entry) => entry.scope === "right");
      expect(hasLeft, `${file} ${node.id} missing left-scoped evidence`).toBe(true);
      expect(hasRight, `${file} ${node.id} missing right-scoped evidence`).toBe(true);
    }
  });
});
