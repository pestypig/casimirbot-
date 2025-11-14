import { z } from "zod";
import type { KnowledgeProjectExport } from "./knowledge";
import { ToolRisk } from "./skills";
import type { ToolManifestEntry } from "./skills";

export const PersonaProfile = z.object({
  id: z.string(),
  display_name: z.string(),
  goals: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  style: z
    .object({
      tone: z.string().optional(),
      safety_level: z.enum(["strict", "balanced", "creative"]).default("balanced"),
    })
    .default({}),
  preferences: z.record(z.any()).default({}),
});

export const MemoryRecord = z.object({
  id: z.string(),
  owner_id: z.string(),
  created_at: z.string(),
  kind: z.enum(["episodic", "semantic", "procedural"]),
  keys: z.array(z.string()).default([]),
  essence_id: z.string().optional(),
  text: z.string().optional(),
  embedding_space: z.string().optional(),
  embedding_cid: z.string().optional(),
  visibility: z.enum(["private", "followers", "public"]).default("private"),
});

export type TMemoryRecord = z.infer<typeof MemoryRecord>;

export const MemorySearchHit = z.object({
  id: z.string(),
  snippet: z.string(),
  envelope_id: z.string().nullable(),
  score: z.number(),
  owner_id: z.string(),
  created_at: z.string(),
  kind: MemoryRecord.shape.kind,
  keys: z.array(z.string()),
  visibility: MemoryRecord.shape.visibility,
  embedding_space: z.string().nullable(),
  embedding_cid: z.string().nullable(),
});

export type TMemorySearchHit = z.infer<typeof MemorySearchHit>;

export const TaskApproval = z.object({
  id: z.string(),
  tool: z.string(),
  capability: ToolRisk,
  granted_at: z.string(),
  granted_by: z.string(),
  reason: z.string(),
  notes: z.string().optional(),
});

export type TTaskApproval = z.infer<typeof TaskApproval>;

export const TaskTrace = z.object({
  id: z.string(),
  persona_id: z.string(),
  created_at: z.string(),
  goal: z.string(),
  notes: z.string().optional(),
  plan_json: z.any(),
  plan_manifest: z.array(z.any()).optional(),
  steps: z.array(z.any()),
  approvals: z.array(TaskApproval).default([]),
  result_summary: z.string().optional(),
  ok: z.boolean().optional(),
  knowledgeContext: z.any().optional(),
  // Agent instructions captured alongside the trace
  routine_json: z.any().optional(),
});

export type TTaskTrace = z.infer<typeof TaskTrace> & {
  knowledgeContext?: KnowledgeProjectExport[];
  plan_manifest?: ToolManifestEntry[];
};
