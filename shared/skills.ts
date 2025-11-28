import { z } from "zod";

export type ToolHandler = (input: unknown, ctx: any) => Promise<unknown>;

export const ToolRisk = z.enum(["writes_files", "network_access"]);
export type ToolRiskType = z.infer<typeof ToolRisk>;

export const ToolSafety = z.object({
  risks: z.array(ToolRisk).default([]),
  approvalNotes: z.string().optional(),
});
export type ToolSafetyShape = z.infer<typeof ToolSafety>;

export const ToolRiskProfile = z.object({
  writesFiles: z.boolean().default(false),
  touchesNetwork: z.boolean().default(false),
  privileged: z.boolean().default(false),
});
export type ToolRiskProfileShape = z.infer<typeof ToolRiskProfile>;

export const ToolSpec = z.object({
  name: z.string(),
  desc: z.string(),
  inputSchema: z.any(),
  outputSchema: z.any(),
  deterministic: z.boolean().default(true),
  rateLimit: z.object({ rpm: z.number().default(60) }).default({ rpm: 60 }),
  safety: ToolSafety.default({ risks: [] }),
  risk: ToolRiskProfile.optional(),
  health: z.enum(["ok", "degraded", "offline"]).optional(),
});

export type ToolSpecShape = z.infer<typeof ToolSpec>;
export type ToolManifestEntry = Pick<ToolSpecShape, "name" | "desc" | "deterministic" | "rateLimit" | "health">;
export type ToolManifest = ToolManifestEntry[];

export type Tool = ToolSpecShape & { handler: ToolHandler };
