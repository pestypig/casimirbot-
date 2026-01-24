import path from "node:path";
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { essenceHub, type EssenceEvent } from "../services/essence/events";
import { getLatticeVersion, loadCodeLattice } from "../services/code-lattice/loader";
import type { KnowledgeFileAttachment, KnowledgeProjectExport } from "@shared/knowledge";

export const codeLatticeRouter = Router();

const SearchRequest = z.object({
  query: z.string().min(2),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

const clip = (value: string | undefined, limit: number) => {
  if (!value) return "";
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}...`;
};

function tokenizeQuery(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[^a-z0-9_/.:-]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function formatPreview({
  doc,
  snippet,
  score,
  filePath,
  symbol,
}: {
  doc?: string;
  snippet?: string;
  score: number;
  filePath: string;
  symbol: string;
}): string {
  const parts: string[] = [];
  if (doc) parts.push(clip(doc, 400));
  if (snippet) parts.push(clip(snippet, 320));
  parts.push(`score=${score.toFixed(3)} | symbol=${symbol} | file=${filePath}`);
  return parts.join("\n");
}

codeLatticeRouter.post("/search", async (req: Request, res: Response) => {
  const parsed = SearchRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const snapshot = await loadCodeLattice();
  if (!snapshot) {
    return res.status(503).json({ error: "lattice_unavailable" });
  }
  const tokens = tokenizeQuery(parsed.data.query);
  if (tokens.length === 0) {
    return res.json({
      project: { id: "code-lattice-search", name: "Code Lattice Search", type: "code", hashSlug: "code-lattice-search" },
      summary: `No searchable tokens extracted from query "${parsed.data.query}".`,
      files: [],
      approxBytes: 0,
    } satisfies KnowledgeProjectExport);
  }
  const scored = snapshot.nodes
    .map((node) => {
      const symbol = node.symbol ?? "";
      const filePath = node.filePath ?? "";
      const signature = node.signature ?? "";
      const doc = node.doc ?? "";
      const snippet = node.snippet ?? "";
      const haystack = `${symbol} ${filePath} ${signature} ${doc} ${snippet}`.toLowerCase();
      let score = 0;
      for (const token of tokens) {
        if (symbol.toLowerCase().includes(token)) score += 6;
        if (filePath.toLowerCase().includes(token)) score += 5;
        if (signature.toLowerCase().includes(token)) score += 3;
        if (doc.toLowerCase().includes(token)) score += 1.5;
        if (snippet.toLowerCase().includes(token)) score += 1;
      }
      return score > 0
        ? {
            node,
            score,
            haystack,
          }
        : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((a, b) => b.score - a.score);

  const files: KnowledgeFileAttachment[] = [];
  const seen = new Set<string>();
  let approxBytes = 0;
  for (const entry of scored) {
    const node = entry.node;
    const filePath = node.filePath ?? "";
    const key = `${node.nodeId}:${filePath}`;
    if (!filePath || seen.has(key)) continue;
    const size = node.metrics?.bytes ?? Buffer.byteLength(node.snippet ?? "", "utf8");
    files.push({
      id: node.nodeId,
      name: `${node.symbol} (${path.posix.basename(filePath)})`,
      path: filePath,
      mime: "text/plain",
      size,
      hashSlug: node.astHash,
      kind: "code",
      preview: formatPreview({
        doc: node.doc,
        snippet: node.snippet,
        score: entry.score,
        filePath,
        symbol: node.symbol,
      }),
    });
    approxBytes += Math.max(0, size);
    seen.add(key);
    if (files.length >= parsed.data.limit) break;
  }

  const payload: KnowledgeProjectExport = {
    project: {
      id: "code-lattice-search",
      name: "Code Lattice Search",
      type: "code",
      hashSlug: "code-lattice-search",
    },
    summary: `Search results for "${parsed.data.query}"`,
    files,
    approxBytes,
  };
  return res.json(payload);
});

function setupSse(res: Response): () => void {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();
  const heartbeat = setInterval(() => {
    try {
      res.write("event: ping\ndata: {}\n\n");
    } catch {
      /* ignore */
    }
  }, 25000);
  return () => clearInterval(heartbeat);
}

codeLatticeRouter.get("/stream", (req: Request, res: Response) => {
  const stopHeartbeat = setupSse(res);
  const bootstrapVersion = getLatticeVersion();
  if (bootstrapVersion > 0) {
    try {
      res.write("event: init\ndata: " + JSON.stringify({ version: bootstrapVersion }) + "\n\n");
    } catch {
      /* ignore */
    }
  }

  const handleUpdate = (event: Extract<EssenceEvent, { type: "code-lattice:updated" }>) => {
    try {
      res.write("data: " + JSON.stringify({ version: event.version, stats: event.stats }) + "\n\n");
    } catch {
      /* swallow */
    }
  };
  essenceHub.on("code-lattice:updated", handleUpdate);

  const cleanup = () => {
    stopHeartbeat();
    essenceHub.off("code-lattice:updated", handleUpdate);
  };
  req.on("close", cleanup);
  req.on("error", cleanup);
});
