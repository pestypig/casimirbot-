import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildRelationAssemblyPacket } from "../server/services/helix-ask/relation-assembly";

type TreeNode = {
  id: string;
  nodeType?: string;
  links?: Array<{ rel: string; to: string }>;
  bridge?: { left: string; right: string; relation?: string };
  evidence?: Array<{
    scope?: string;
    provenance_class?: "measured" | "proxy" | "inferred";
    claim_tier?: "diagnostic" | "reduced-order" | "certified";
    certifying?: boolean;
  }>;
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
  const trees = treeFiles.map((file) => ({ file, tree: loadTree(file) }));
  const globalNodeIds = new Set<string>();
  for (const { tree } of trees) {
    for (const node of tree.nodes ?? []) {
      if (node?.id) {
        globalNodeIds.add(node.id);
      }
    }
  }

  it("bridge nodes bind left/right and include scoped evidence", () => {
    const bridgeNodes: Array<{ file: string; node: TreeNode }> = [];
    for (const { file, tree } of trees) {
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

      expect(globalNodeIds.has(bridge.left), `${file} ${node.id} left target missing`).toBe(true);
      expect(globalNodeIds.has(bridge.right), `${file} ${node.id} right target missing`).toBe(true);

      expect(ensureLink(node.links, "see-also", bridge.left), `${file} ${node.id} missing see-also to left`).toBe(true);
      expect(ensureLink(node.links, "see-also", bridge.right), `${file} ${node.id} missing see-also to right`).toBe(true);

      const evidence = node.evidence ?? [];
      const hasLeft = evidence.some((entry) => entry.scope === "left");
      const hasRight = evidence.some((entry) => entry.scope === "right");
      if (hasLeft || hasRight) {
        expect(hasLeft, `${file} ${node.id} missing left-scoped evidence`).toBe(true);
        expect(hasRight, `${file} ${node.id} missing right-scoped evidence`).toBe(true);
      } else {
        expect(
          evidence.length >= 2,
          `${file} ${node.id} missing left/right scoped evidence`,
        ).toBe(true);
      }


      const hasContractMetadata = evidence.some(
        (entry) => entry.provenance_class || entry.claim_tier || typeof entry.certifying === "boolean",
      );
      if (hasContractMetadata) {
        for (const entry of evidence) {
          expect(entry.provenance_class, `${file} ${node.id} missing provenance_class`).toBeTruthy();
          expect(entry.claim_tier, `${file} ${node.id} missing claim_tier`).toBeTruthy();
          expect(typeof entry.certifying, `${file} ${node.id} missing certifying`).toBe("boolean");
        }
      }
    }
  });

  it("returns deterministic strict bridge fail_reason when bridge evidence metadata is incomplete", () => {
    const packet = buildRelationAssemblyPacket({
      question: "How does ideology bridge physics?",
      contextFiles: ["docs/ethos/ideology.json", "docs/knowledge/physics/einstein-field-equations.md"],
      contextText: "ideology and physics relation",
      docBlocks: [],
      strictBridgeEvidence: true,
      graphPack: {
        frameworks: [
          {
            treeId: "test",
            sourcePath: "docs/ethos/ideology.json",
            anchors: [],
            path: [
              {
                id: "bridge-node",
                title: "Bridge",
                tags: [],
                score: 1,
                depth: 0,
                nodeType: "bridge",
                evidence: [
                  {
                    type: "doc",
                    path: "docs/knowledge/physics/einstein-field-equations.md",
                    scope: "left",
                  },
                ],
              },
            ],
            scaffoldText: "",
            contextText: "",
            preferGraph: true,
          },
        ],
        scaffoldText: "",
        contextText: "",
        preferGraph: true,
        sourcePaths: ["docs/ethos/ideology.json"],
        treeIds: ["test"],
      },
    });

    expect(packet.fail_reason).toBe("IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_MISSING");
  });

  it("preserves non-strict bridge behavior when metadata is incomplete", () => {
    const packet = buildRelationAssemblyPacket({
      question: "How does ideology bridge physics?",
      contextFiles: ["docs/ethos/ideology.json", "docs/knowledge/physics/einstein-field-equations.md"],
      contextText: "ideology and physics relation",
      docBlocks: [],
      graphPack: {
        frameworks: [
          {
            treeId: "test",
            sourcePath: "docs/ethos/ideology.json",
            anchors: [],
            path: [
              {
                id: "bridge-node",
                title: "Bridge",
                tags: [],
                score: 1,
                depth: 0,
                nodeType: "bridge",
                evidence: [
                  {
                    type: "doc",
                    path: "docs/knowledge/physics/einstein-field-equations.md",
                    scope: "left",
                  },
                ],
              },
            ],
            scaffoldText: "",
            contextText: "",
            preferGraph: true,
          },
        ],
        scaffoldText: "",
        contextText: "",
        preferGraph: true,
        sourcePaths: ["docs/ethos/ideology.json"],
        treeIds: ["test"],
      },
    });

    expect(packet.fail_reason).toBeUndefined();
  });

});
