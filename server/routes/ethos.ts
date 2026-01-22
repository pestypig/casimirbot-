import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { runBeliefGraphLoop } from "../../modules/analysis/belief-graph-loop.js";
import {
  getIdeologyArtifactById,
  searchIdeologyArtifacts
} from "../services/ideology/artifacts";
import { renderIdeologyPill } from "../services/ideology/render";

export const ethosRouter = Router();

type IdeologyLink = { rel: string; to: string };
type IdeologyNode = {
  id: string;
  title?: string;
  children?: string[];
  links?: IdeologyLink[];
};
type IdeologyDoc = {
  rootId: string;
  nodes: IdeologyNode[];
};

const ideologyLinkSchema = z.object({
  rel: z.string(),
  to: z.string(),
});
const ideologyNodeSchema = z
  .object({
    id: z.string(),
    title: z.string().optional(),
    children: z.array(z.string()).optional(),
    links: z.array(ideologyLinkSchema).optional(),
  })
  .passthrough();
const ideologyDocSchema = z
  .object({
    rootId: z.string(),
    nodes: z.array(ideologyNodeSchema),
  })
  .passthrough();

const beliefGraphRequestSchema = z
  .object({
    includeGraph: z.boolean().optional(),
    includeAttempts: z.boolean().optional(),
    includeSeeAlso: z.boolean().optional(),
    seeAlsoWeight: z.number().min(0).max(2).optional(),
    edgeMode: z
      .enum(["parent-to-child", "child-to-parent", "bidirectional"])
      .optional(),
    rootFixed: z.boolean().optional(),
    trueIds: z.array(z.string()).optional(),
    falseIds: z.array(z.string()).optional(),
    stepSize: z.number().min(0.01).max(1).optional(),
    maxIterations: z.number().int().min(1).max(20).optional(),
    thresholds: z
      .object({
        violationMax: z.number().int().min(0),
        violationWeightMax: z.number().min(0),
      })
      .partial()
      .optional(),
    scoreClamp: z
      .object({
        min: z.number(),
        max: z.number(),
      })
      .refine((value) => value.max >= value.min, {
        message: "scoreClamp max must be >= min",
      })
      .optional(),
  })
  .strict();

const IDEOLOGY_FILE_PATH = path.resolve("docs/ethos/ideology.json");

const loadIdeologyDoc = async (): Promise<IdeologyDoc> => {
  const payload = await fs.readFile(IDEOLOGY_FILE_PATH, "utf8");
  const parsed = ideologyDocSchema.safeParse(JSON.parse(payload));
  if (!parsed.success) {
    throw new Error(`Invalid ideology.json: ${parsed.error.message}`);
  }
  return parsed.data;
};

type BeliefGraphEdge = {
  from: string;
  to: string;
  kind: "implies" | "excludes";
  weight?: number;
  rel?: string;
};

const buildBeliefGraph = (
  doc: IdeologyDoc,
  options: {
    includeSeeAlso: boolean;
    seeAlsoWeight: number;
    edgeMode: "parent-to-child" | "child-to-parent" | "bidirectional";
    rootFixed: boolean;
    trueIds: string[];
    falseIds: string[];
  },
) => {
  const nodeIds = new Set(doc.nodes.map((node) => node.id));
  const titles = new Map(doc.nodes.map((node) => [node.id, node.title ?? ""]));
  const trueIds = new Set(options.trueIds);
  const falseIds = new Set(options.falseIds);
  const conflictIds = Array.from(trueIds).filter((id) => falseIds.has(id));
  conflictIds.forEach((id) => falseIds.delete(id));

  const nodes = doc.nodes.map((node) => {
    const isRoot = options.rootFixed && node.id === doc.rootId;
    const isTrue = trueIds.has(node.id) || isRoot;
    const isFalse = falseIds.has(node.id);
    const fixed = isTrue ? true : isFalse ? false : undefined;
    const score = isTrue ? 1 : isFalse ? -1 : 0;
    return {
      id: node.id,
      score,
      fixed,
      title: titles.get(node.id) || undefined,
    };
  });

  const edges: BeliefGraphEdge[] = [];
  const edgeKeys = new Set<string>();
  const missingNodes = new Set<string>();

  const pushEdge = (
    from: string,
    to: string,
    kind: "implies" | "excludes",
    weight?: number,
    rel?: string,
  ) => {
    if (!from || !to || from === to) return;
    const key = `${from}|${to}|${kind}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push({ from, to, kind, weight, rel });
  };

  const connectParentChild = (parentId: string, childId: string) => {
    if (!nodeIds.has(parentId)) missingNodes.add(parentId);
    if (!nodeIds.has(childId)) missingNodes.add(childId);
    if (options.edgeMode === "parent-to-child" || options.edgeMode === "bidirectional") {
      pushEdge(parentId, childId, "implies", 1, "child");
    }
    if (options.edgeMode === "child-to-parent" || options.edgeMode === "bidirectional") {
      pushEdge(childId, parentId, "implies", 1, "parent");
    }
  };

  for (const node of doc.nodes) {
    for (const child of node.children ?? []) {
      connectParentChild(node.id, child);
    }
    for (const link of node.links ?? []) {
      const rel = link.rel.toLowerCase();
      if (rel === "parent") {
        connectParentChild(link.to, node.id);
        continue;
      }
      if (rel === "child") {
        connectParentChild(node.id, link.to);
        continue;
      }
      if (rel === "see-also" && options.includeSeeAlso) {
        pushEdge(node.id, link.to, "implies", options.seeAlsoWeight, "see-also");
        continue;
      }
      if (rel === "excludes" || rel === "contradicts") {
        pushEdge(node.id, link.to, "excludes", 1, rel);
        continue;
      }
    }
  }

  const unknownIds = [
    ...Array.from(trueIds).filter((id) => !nodeIds.has(id)),
    ...Array.from(falseIds).filter((id) => !nodeIds.has(id)),
  ];

  return {
    nodes,
    edges,
    titles,
    missingNodes: Array.from(missingNodes).sort(),
    unknownIds: Array.from(new Set(unknownIds)).sort(),
    conflictIds: conflictIds.sort(),
  };
};

ethosRouter.get("/ideology", async (_req, res) => {
  try {
    const payload = await fs.readFile(IDEOLOGY_FILE_PATH, "utf8");
    res.setHeader("Content-Type", "application/json");
    res.send(payload);
  } catch (err) {
    res.status(404).json({
      message: "ideology.json not found",
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

const readQuery = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    return value.length > 0 ? String(value[0]) : undefined;
  }
  return typeof value === "string" ? value : undefined;
};

const parseTags = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => String(entry).split(","))
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
};

const parseNumber = (value: unknown): number | undefined => {
  const raw = readQuery(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const resolveBaseUrl = (req: any): string => {
  const protoHeader = req.headers?.["x-forwarded-proto"];
  const hostHeader = req.headers?.["x-forwarded-host"];
  const proto =
    typeof protoHeader === "string"
      ? protoHeader.split(",")[0].trim()
      : req.protocol;
  const host =
    typeof hostHeader === "string"
      ? hostHeader.split(",")[0].trim()
      : req.get("host");
  if (!host) {
    throw new Error("host_unavailable");
  }
  return `${proto}://${host}`;
};

ethosRouter.get("/artifacts", (req, res) => {
  const query = readQuery(req.query.q)?.trim();
  const panelId = readQuery(req.query.panelId)?.trim();
  const nodeId = readQuery(req.query.nodeId)?.trim();
  const tags = parseTags(req.query.tags ?? req.query.tag);
  const limit = parseNumber(req.query.limit);
  const offset = parseNumber(req.query.offset);

  const result = searchIdeologyArtifacts({
    query,
    panelId,
    nodeId,
    tags,
    limit,
    offset
  });

  res.json(result);
});

ethosRouter.get("/artifacts/:id(*)", (req, res) => {
  const artifactId = req.params.id;
  const artifact = getIdeologyArtifactById(artifactId);
  if (!artifact) {
    res.status(404).json({ error: "artifact_not_found", id: artifactId });      
    return;
  }
  res.json(artifact);
});

ethosRouter.get("/artifacts/:id(*)/render", async (req, res) => {
  const artifactId = req.params.id;
  const artifact = getIdeologyArtifactById(artifactId);
  if (!artifact) {
    res.status(404).json({ error: "artifact_not_found", id: artifactId });
    return;
  }
  if (artifact.exportKind !== "pill" || !artifact.exportTargetId) {
    res.status(400).json({ error: "artifact_not_renderable", id: artifactId });
    return;
  }
  const formatParam = readQuery(req.query.format)?.toLowerCase();
  const format = formatParam === "svg" ? "svg" : formatParam === "png" || !formatParam ? "png" : null;
  if (!format) {
    res.status(400).json({ error: "unsupported_format", format: formatParam });
    return;
  }
  const pixelRatio = parseNumber(req.query.pixelRatio ?? req.query.scale);

  let baseUrl: string;
  try {
    baseUrl = resolveBaseUrl(req);
  } catch (err) {
    res.status(400).json({ error: "invalid_host", message: String(err) });
    return;
  }

  try {
    const result = await renderIdeologyPill({
      baseUrl,
      pillId: artifact.exportTargetId,
      format,
      pixelRatio: pixelRatio && pixelRatio > 0 ? pixelRatio : undefined,
    });
    const extension = format === "svg" ? "svg" : "png";
    const safeName = (artifact.exportTargetId || artifact.id).replace(/[^a-z0-9-_]+/gi, "_");
    res.setHeader("Content-Type", result.contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${safeName}.${extension}"`,
    );
    res.send(result.buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "playwright_unavailable") {
      res.status(503).json({ error: "render_unavailable", message });
      return;
    }
    res.status(500).json({ error: "artifact_render_failed", message });
  }
});

const handleBeliefGraphRequest = async (req: any, res: any) => {
  const source =
    req.method === "GET"
      ? {}
      : req.body && typeof req.body === "object"
        ? req.body
        : {};
  const parsed = beliefGraphRequestSchema.safeParse(source);
  if (!parsed.success) {
    res.status(400).json({
      error: "invalid-belief-graph-request",
      issues: parsed.error.issues,
    });
    return;
  }

  try {
    const ideology = await loadIdeologyDoc();
    const includeGraph = parsed.data.includeGraph !== false;
    const includeAttempts = parsed.data.includeAttempts === true;
    const includeSeeAlso = parsed.data.includeSeeAlso === true;
    const seeAlsoWeight = parsed.data.seeAlsoWeight ?? 0.4;
    const edgeMode = parsed.data.edgeMode ?? "bidirectional";
    const rootFixed = parsed.data.rootFixed !== false;
    const trueIds = parsed.data.trueIds ?? [];
    const falseIds = parsed.data.falseIds ?? [];

    const graph = buildBeliefGraph(ideology, {
      includeSeeAlso,
      seeAlsoWeight,
      edgeMode,
      rootFixed,
      trueIds,
      falseIds,
    });

    const thresholds = {
      violationMax: 0,
      violationWeightMax: 0,
      ...(parsed.data.thresholds ?? {}),
    };

    const result = runBeliefGraphLoop({
      graph: {
        nodes: graph.nodes.map(({ id, score, fixed }) => ({ id, score, fixed })),
        edges: graph.edges.map(({ from, to, kind, weight }) => ({
          from,
          to,
          kind,
          weight,
        })),
      },
      maxIterations: parsed.data.maxIterations,
      stepSize: parsed.data.stepSize,
      thresholds,
      scoreClamp: parsed.data.scoreClamp,
    });

    const attempts = result.attempts.map((attempt) => ({
      iteration: attempt.iteration,
      accepted: attempt.accepted,
      gate: attempt.gate,
      constraints: attempt.constraints,
    }));
    const finalAttempt = attempts[attempts.length - 1] ?? null;

    res.json({
      config: {
        rootId: ideology.rootId,
        rootFixed,
        includeSeeAlso,
        seeAlsoWeight,
        edgeMode,
        stepSize: parsed.data.stepSize ?? 0.25,
        maxIterations: parsed.data.maxIterations ?? 6,
        thresholds,
        scoreClamp: parsed.data.scoreClamp ?? null,
        trueIds,
        falseIds,
      },
      summary: {
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
        impliesEdges: graph.edges.filter((edge) => edge.kind === "implies").length,
        excludesEdges: graph.edges.filter((edge) => edge.kind === "excludes").length,
        missingNodes: graph.missingNodes,
        unknownIds: graph.unknownIds,
        conflictIds: graph.conflictIds,
      },
      accepted: result.accepted,
      acceptedIteration: result.acceptedIteration ?? null,
      iterations: attempts.length,
      gate: finalAttempt?.gate ?? null,
      constraints: finalAttempt?.constraints ?? null,
      attempts: includeAttempts ? attempts : undefined,
      graph: includeGraph
        ? {
            nodes: result.finalState.nodes.map((node) => ({
              id: node.id,
              score: node.score,
              fixed: node.fixed,
              title: graph.titles.get(node.id) || undefined,
            })),
            edges: graph.edges,
          }
        : undefined,
    });
  } catch (err) {
    res.status(500).json({
      error: "belief-graph-failed",
      message: err instanceof Error ? err.message : String(err),
    });
  }
};

ethosRouter.get("/ideology/belief-graph", handleBeliefGraphRequest);
ethosRouter.post("/ideology/belief-graph", handleBeliefGraphRequest);
