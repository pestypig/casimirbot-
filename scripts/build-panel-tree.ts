import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

type PanelTermHit = {
  term: string;
  files: string[];
  treeMatches: Array<{ treeId: string; nodeId: string; title?: string; tags?: string[] }>;
};

type PanelRecord = {
  id: string;
  title?: string;
  keywords?: string[];
  endpoints?: string[];
  componentPath?: string | null;
  terms?: string[];
  termHits?: PanelTermHit[];
};

type PanelReport = {
  generatedAt: string;
  repoRev: string;
  panels: PanelRecord[];
};

const REPORT_PATH = path.join("reports", "panel-cross-concepts.json");
const OUTPUT_PATH = path.join("docs", "knowledge", "panel-registry-tree.json");

const sha256 = (filePath: string): string | null => {
  try {
    const buf = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(buf).digest("hex");
  } catch {
    return null;
  }
};

const safePath = (filePath: string | null | undefined): string | null => {
  if (!filePath) return null;
  return filePath.replace(/\\/g, "/");
};

const run = () => {
  if (!fs.existsSync(REPORT_PATH)) {
    throw new Error(`Missing ${REPORT_PATH}. Run scripts/panel-cross-concepts.ts first.`);
  }
  const report = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8")) as PanelReport;
  const repoRev = report.repoRev || execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  const registryHash = sha256("client/src/pages/helix-core.panels.ts");
  const panelNodes: any[] = [];

  for (const panel of report.panels) {
    const nodeId = `panel-${panel.id}`;
    const title = panel.title || panel.id;
    const keywords = (panel.keywords ?? []).filter(Boolean);
    const tags = Array.from(new Set(["panel", panel.id, ...keywords])).slice(0, 24);
    const links: Array<{ rel: string; to: string }> = [
      { rel: "parent", to: "panel-registry-tree" }
    ];

    const matchedNodes = new Set<string>();
    (panel.termHits ?? []).forEach((hit) => {
      hit.treeMatches?.forEach((match) => {
        if (match.treeId === "panel-registry-tree") return;
        if (match.nodeId === nodeId) return;
        const key = `${match.treeId}:${match.nodeId}`;
        matchedNodes.add(key);
      });
    });
    const matchedList = Array.from(matchedNodes).slice(0, 6);
    for (const key of matchedList) {
      const [, nodeIdMatch] = key.split(":");
      if (nodeIdMatch) {
        links.push({ rel: "see-also", to: nodeIdMatch });
      }
    }

    const componentPath = safePath(panel.componentPath);
    const evidence: any[] = [];
    if (componentPath && fs.existsSync(componentPath)) {
      const hash = sha256(componentPath);
      evidence.push({
        type: "code",
        path: componentPath,
        repo_rev: repoRev,
        content_hash: hash ? `sha256:${hash}` : undefined
      });
    }
    evidence.push({
      type: "doc",
      path: "client/src/pages/helix-core.panels.ts",
      repo_rev: repoRev,
      content_hash: registryHash ? `sha256:${registryHash}` : undefined
    });

    const endpoints = (panel.endpoints ?? []).filter(Boolean);
    const bodyLines = [
      `Panel ${panel.id} loaded from helix-core panels registry.`,
      componentPath ? `Component: ${componentPath}` : "Component: (unresolved)",
      endpoints.length ? `Endpoints: ${endpoints.join(", ")}` : "Endpoints: none",
      keywords.length ? `Keywords: ${keywords.join(", ")}` : "Keywords: none"
    ];

    panelNodes.push({
      id: nodeId,
      slug: nodeId,
      title,
      excerpt: `Panel surface for ${title}.`,
      bodyMD: bodyLines.join("\n"),
      tags,
      children: [],
      links,
      summary: `Panel surface for ${title}.`,
      nodeType: "concept",
      inputs: [],
      outputs: [],
      assumptions: [],
      validity: {},
      deterministic: null,
      tolerance: null,
      environment: null,
      dependencies: ["panel-registry-tree"],
      evidence: evidence.filter((entry) => entry.content_hash || entry.type !== "code"),
      predictability: {
        status: "partial",
        missing: [
          "inputs",
          "outputs",
          "assumptions",
          "validity",
          "deterministic",
          "tolerance",
          "environment"
        ]
      }
    });
  }

  const rootNode = {
    id: "panel-registry-tree",
    slug: "panel-registry-tree",
    title: "Panel Registry Tree",
    excerpt: "Panel surfaces and cross-concept joins derived from Helix UI.",
    bodyMD:
      "This tree enumerates Helix panels and their cross-concept joins to keep UI surfaces grounded in the DAG.\n\nMinimal artifact: panel registry map.",
    tags: ["ui", "panels", "registry"],
    children: panelNodes.map((node) => node.id),
    links: [],
    summary: "Panel surfaces and cross-concept joins derived from Helix UI.",
    nodeType: "concept",
    inputs: [],
    outputs: [],
    assumptions: [],
    validity: {},
    deterministic: null,
    tolerance: null,
    environment: null,
    dependencies: [],
    evidence: [
      {
        type: "doc",
        path: "client/src/pages/helix-core.panels.ts",
        repo_rev: repoRev,
        content_hash: registryHash ? `sha256:${registryHash}` : undefined
      }
    ],
    predictability: {
      status: "partial",
      missing: [
        "inputs",
        "outputs",
        "assumptions",
        "validity",
        "deterministic",
        "tolerance",
        "environment"
      ]
    }
  };

  const payload = {
    version: 1,
    rootId: "panel-registry-tree",
    nodes: [rootNode, ...panelNodes],
    schema: {
      name: "helix-ask-dag-node",
      version: 1
    }
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${OUTPUT_PATH} (${payload.nodes.length} nodes).`);
};

run();
