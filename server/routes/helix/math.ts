import { Router } from "express";
import type { Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import {
  mathStageRegistry,
  type MathStage,
  type MathCheck,
  type MathStageEntry,
  type UnitSignature,
} from "../../../shared/math-stage.js";

type MathStatus = "pass" | "warn" | "fail" | "unknown";
type MathStageLabel = MathStage | "unstaged";

type MathGraphEdge = {
  from: string;
  to: string;
  reason?: string;
  waiver?: string;
  unitConversion?: boolean;
  unitKeyWarnings?: boolean;
};

type NodeIssues = {
  evidence?: string[];
  stage?: string[];
  unitErrors?: string[];
  unitWarnings?: string[];
};

type StatusCounts = {
  total: number;
  pass: number;
  warn: number;
  fail: number;
  unknown: number;
};

type MathTreeNode = {
  id: string;
  label: string;
  path: string;
  kind: "group" | "module";
  status: MathStatus;
  stage?: MathStageLabel;
  tag?: string;
  checks?: MathCheck[];
  units?: UnitSignature;
  issues?: NodeIssues;
  stats?: StatusCounts;
  children?: MathTreeNode[];
};

type MathReport = {
  generatedAt?: string;
  unstaged?: { count?: number; modules?: string[] };
  evidenceIssues?: { count?: number; items?: Array<{ module: string; missing: string[] }> };
  stageViolations?: {
    edge?: { count?: number; items?: Array<{ from: string; to: string; reason: string }> };
    pipeline?: { count?: number; items?: Array<{ from: string; to: string; reason: string }> };
  };
  unitViolations?: {
    errors?: Array<{ from: string; to: string; key: string; reason: string }>;
    warnings?: Array<{ from: string; to: string; key: string; reason: string }>;
  };
};

const STATUS_RANK: Record<MathStatus, number> = {
  unknown: 0,
  pass: 1,
  warn: 2,
  fail: 3,
};

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const loadGraph = () => {
  const graphPath = path.resolve(process.cwd(), "MATH_GRAPH.json");
  if (!fs.existsSync(graphPath)) {
    return { edges: [] as MathGraphEdge[] };
  }
  const raw = fs.readFileSync(graphPath, "utf8");
  const parsed = JSON.parse(raw) as { edges?: MathGraphEdge[] };
  return { edges: Array.isArray(parsed.edges) ? parsed.edges : [] };
};

const loadReport = () => {
  const reportPath = path.resolve(process.cwd(), "reports", "math-report.json");
  if (!fs.existsSync(reportPath)) {
    return { report: null as MathReport | null, reportPath, reportAgeMs: null as number | null };
  }
  const raw = fs.readFileSync(reportPath, "utf8");
  const report = JSON.parse(raw) as MathReport;
  const stat = fs.statSync(reportPath);
  const reportAgeMs = Date.now() - stat.mtimeMs;
  return { report, reportPath, reportAgeMs };
};

const addIssue = (map: Map<string, NodeIssues>, key: string, field: keyof NodeIssues, value: string) => {
  const existing = map.get(key) ?? {};
  const list = existing[field] ?? [];
  existing[field] = [...list, value];
  map.set(key, existing);
};

const deriveStatus = (entry: MathStageEntry | null, issues?: NodeIssues): MathStatus => {
  if (!entry) return "unknown";
  if (issues?.stage?.length || issues?.unitErrors?.length) return "fail";
  if (issues?.evidence?.length) {
    return entry.stage === "certified" ? "fail" : "warn";
  }
  if (issues?.unitWarnings?.length) return "warn";
  return "pass";
};

const mergeStatus = (left: MathStatus, right: MathStatus) =>
  STATUS_RANK[left] >= STATUS_RANK[right] ? left : right;

const buildStatusCounts = (): StatusCounts => ({
  total: 0,
  pass: 0,
  warn: 0,
  fail: 0,
  unknown: 0,
});

const bumpStatusCounts = (counts: StatusCounts, status: MathStatus) => {
  counts.total += 1;
  counts[status] += 1;
};

const buildTree = (nodes: Map<string, MathTreeNode>) => {
  const root: MathTreeNode = {
    id: "root",
    label: "repo",
    path: "",
    kind: "group",
    status: "unknown",
    children: [],
    stats: buildStatusCounts(),
  };

  const groupIndex = new Map<string, MathTreeNode>();
  groupIndex.set("", root);

  const ensureGroup = (parent: MathTreeNode, segment: string, pathKey: string) => {
    const existing = groupIndex.get(pathKey);
    if (existing) return existing;
    const node: MathTreeNode = {
      id: `group:${pathKey}`,
      label: segment,
      path: pathKey,
      kind: "group",
      status: "unknown",
      children: [],
      stats: buildStatusCounts(),
    };
    parent.children = parent.children ?? [];
    parent.children.push(node);
    groupIndex.set(pathKey, node);
    return node;
  };

  for (const node of nodes.values()) {
    const segments = node.path.split("/").filter(Boolean);
    let cursor = root;
    let prefix = "";
    segments.forEach((segment, idx) => {
      prefix = prefix ? `${prefix}/${segment}` : segment;
      const isLeaf = idx === segments.length - 1;
      if (isLeaf) {
        cursor.children = cursor.children ?? [];
        cursor.children.push(node);
      } else {
        cursor = ensureGroup(cursor, segment, prefix);
      }
    });
  }

  const rollup = (node: MathTreeNode): MathTreeNode => {
    if (!node.children || node.children.length === 0) {
      if (node.stats) {
        bumpStatusCounts(node.stats, node.status);
      }
      return node;
    }
    node.status = "unknown";
    const counts = buildStatusCounts();
    for (const child of node.children) {
      rollup(child);
      node.status = mergeStatus(node.status, child.status);
      if (child.stats) {
        counts.total += child.stats.total;
        counts.pass += child.stats.pass;
        counts.warn += child.stats.warn;
        counts.fail += child.stats.fail;
        counts.unknown += child.stats.unknown;
      }
    }
    node.stats = counts;
    return node;
  };

  rollup(root);
  return root;
};

const buildGraphViewModel = () => {
  const { report, reportPath, reportAgeMs } = loadReport();
  const graph = loadGraph();
  const issuesByModule = new Map<string, NodeIssues>();

  report?.evidenceIssues?.items?.forEach((item) => {
    item.missing.forEach((missing) =>
      addIssue(issuesByModule, item.module, "evidence", missing),
    );
  });

  const stageEdgeIssues = [
    ...(report?.stageViolations?.edge?.items ?? []),
    ...(report?.stageViolations?.pipeline?.items ?? []),
  ];
  stageEdgeIssues.forEach((issue) => {
    addIssue(issuesByModule, issue.from, "stage", issue.reason);
    addIssue(issuesByModule, issue.to, "stage", issue.reason);
  });

  (report?.unitViolations?.errors ?? []).forEach((issue) => {
    const detail = `${issue.key}: ${issue.reason}`;
    addIssue(issuesByModule, issue.from, "unitErrors", detail);
    addIssue(issuesByModule, issue.to, "unitErrors", detail);
  });

  (report?.unitViolations?.warnings ?? []).forEach((issue) => {
    const detail = `${issue.key}: ${issue.reason}`;
    addIssue(issuesByModule, issue.from, "unitWarnings", detail);
    addIssue(issuesByModule, issue.to, "unitWarnings", detail);
  });

  const nodes = new Map<string, MathTreeNode>();
  const stageCounts: Record<MathStage, number> = {
    exploratory: 0,
    "reduced-order": 0,
    diagnostic: 0,
    certified: 0,
  };
  const statusCounts = buildStatusCounts();

  mathStageRegistry.forEach((entry) => {
    stageCounts[entry.stage] += 1;
    const issues = issuesByModule.get(entry.module);
    const status = deriveStatus(entry, issues);
    bumpStatusCounts(statusCounts, status);
    const label = entry.module.split("/").pop() ?? entry.module;
    nodes.set(entry.module, {
      id: entry.module,
      label,
      path: entry.module,
      kind: "module",
      status,
      stage: entry.stage,
      tag: entry.tag,
      checks: entry.checks ?? [],
      units: entry.units,
      issues,
      stats: { ...buildStatusCounts(), ...{ total: 1, [status]: 1 } },
    });
  });

  const unstagedModules = report?.unstaged?.modules ?? [];
  for (const modulePath of unstagedModules) {
    if (nodes.has(modulePath)) continue;
    const label = modulePath.split("/").pop() ?? modulePath;
    const issues = issuesByModule.get(modulePath);
    const status: MathStatus = "warn";
    bumpStatusCounts(statusCounts, status);
    nodes.set(modulePath, {
      id: modulePath,
      label,
      path: modulePath,
      kind: "module",
      status,
      stage: "unstaged",
      tag: "UNSTAGED",
      issues,
      stats: { ...buildStatusCounts(), ...{ total: 1, [status]: 1 } },
    });
  }

  const root = buildTree(nodes);

  return {
    generatedAt: new Date().toISOString(),
    report: {
      available: !!report,
      generatedAt: report?.generatedAt ?? null,
      path: report ? path.relative(process.cwd(), reportPath) : null,
      ageMs: reportAgeMs,
    },
    summary: {
      stages: stageCounts,
      status: statusCounts,
      evidenceIssues: report?.evidenceIssues?.count ?? 0,
      stageViolations: stageEdgeIssues.length,
      unitViolations: {
        errors: report?.unitViolations?.errors?.length ?? 0,
        warnings: report?.unitViolations?.warnings?.length ?? 0,
      },
      unstagedCount: unstagedModules.length,
    },
    root,
    edges: graph.edges,
  };
};

const helixMathRouter = Router();

helixMathRouter.options("/graph", (_req: Request, res: Response) => {
  setCors(res);
  res.status(200).end();
});

helixMathRouter.get("/graph", (_req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const view = buildGraphViewModel();
    return res.json(view);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "math-graph-failed", message });
  }
});

export { helixMathRouter };
