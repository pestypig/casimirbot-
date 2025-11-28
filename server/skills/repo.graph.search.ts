import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { searchRepoGraph } from "../services/repo/repoGraph";

const RepoGraphSearchInput = z.object({
  query: z.string().min(1),
  projectId: z.string().optional(),
  essenceId: z.string().optional(),
  limit: z.number().int().positive().max(50).default(12),
  intentTags: z.array(z.string()).optional(),
});

const RepoGraphNode = z.object({
  id: z.string(),
  kind: z.enum(["file", "symbol", "concept"]),
  name: z.string(),
  path: z.string().optional(),
  tags: z.array(z.string()).optional(),
  score: z.number().optional(),
});

const RepoGraphEdge = z.object({
  source: z.string(),
  target: z.string(),
  kind: z.enum(["imports", "reexports", "defines", "calls", "tests", "mentions"]),
  citation_context: z.string().optional(),
});

const RepoGraphSearchOutput = z.object({
  nodes: z.array(RepoGraphNode),
  edges: z.array(RepoGraphEdge),
  hits: z.array(
    z.object({
      id: z.string(),
      snippet: z.string(),
      score: z.number(),
      kind: z.string(),
      keys: z.array(z.string()),
      path: z.string().optional(),
      file_path: z.string().optional(),
      symbol_name: z.string().optional(),
      snippet_id: z.string().optional(),
    }),
  ),
  packets: z.array(
    z.object({
      id: z.string(),
      essence_id: z.string(),
      kind: z.literal("repo_context"),
      file_path: z.string(),
      symbol_name: z.string().optional(),
      snippet: z.string(),
      score: z.number(),
      snippet_id: z.string().optional(),
    }),
  ),
  collapse_inputs: z
    .object({
      text: z.array(z.string()).optional(),
      image: z.array(z.string()).optional(),
      audio: z.array(z.string()).optional(),
    })
    .optional(),
});

export const repoGraphSearchSpec: ToolSpecShape = {
  name: "repo.graph.search",
  desc: "Relation-aware search over repo files/symbols (imports, definitions, mentions).",
  inputSchema: RepoGraphSearchInput,
  outputSchema: RepoGraphSearchOutput,
  deterministic: true,
  rateLimit: { rpm: 15 },
  safety: { risks: [] },
};

export const repoGraphSearchHandler: ToolHandler = async (rawInput) => {
  const input = RepoGraphSearchInput.parse(rawInput ?? {});
  const result = await searchRepoGraph({
    query: input.query,
    projectId: input.projectId,
    limit: input.limit,
    intentTags: input.intentTags,
  });
  const packets = result.hits.map((hit) => ({
    id: hit.id,
    essence_id: input.essenceId ?? hit.id,
    kind: "repo_context" as const,
    file_path: hit.file_path ?? hit.path ?? hit.id,
    symbol_name: hit.symbol_name,
    snippet: hit.snippet,
    score: hit.score,
    snippet_id: hit.snippet_id ?? hit.id,
  }));
  const collapse_inputs = { text: packets.map((p) => p.essence_id) };
  return RepoGraphSearchOutput.parse({ ...result, packets, collapse_inputs });
};
