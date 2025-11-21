import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import type { BadgeTelemetrySnapshot } from "@shared/badge-telemetry";
import { collectBadgeTelemetry, DEFAULT_BADGE_TELEMETRY_DESKTOP } from "../services/telemetry/badges";

const TelemetryInput = z.object({
  desktopId: z.string().min(1).max(128).default(DEFAULT_BADGE_TELEMETRY_DESKTOP),
  panelIds: z.array(z.string().min(1)).optional(),
  includeRaw: z.boolean().optional(),
});

const BadgeProofSchema = z.object({
  label: z.string(),
  value: z.string(),
  severity: z.enum(["info", "warn", "error"]).optional(),
});

const BadgeSolutionSchema = z.object({
  action: z.string(),
  rationale: z.string().optional(),
  severity: z.enum(["info", "warn", "urgent"]).optional(),
});

const TelemetryOutput = z.object({
  desktopId: z.string(),
  capturedAt: z.string(),
  summary: z.string(),
  total: z.number(),
  relatedPanels: z.array(z.string()).optional(),
  relationNotes: z.array(z.string()).optional(),
  entries: z.array(
    z.object({
      panelId: z.string(),
      instanceId: z.string(),
      title: z.string(),
      kind: z.string().optional(),
      status: z.enum(["ok", "warn", "error", "unknown"]),
      summary: z.string(),
      proofs: z.array(BadgeProofSchema),
      solutions: z.array(BadgeSolutionSchema),
      metrics: z.record(z.number()).optional(),
      flags: z.record(z.boolean()).optional(),
      bands: z.array(z.any()).optional(),
      lastUpdated: z.string(),
      sourceIds: z.array(z.string()).optional(),
    }),
  ),
  raw: z.any().optional(),
});

export const badgeTelemetrySpec: ToolSpecShape = {
  name: "telemetry.badges.read",
  desc: "Reads live badge and proof telemetry (Casimir tiles, coherence, Q-factor, occupancy).",
  inputSchema: TelemetryInput,
  outputSchema: TelemetryOutput,
  deterministic: true,
  rateLimit: { rpm: 30 },
  safety: { risks: [] },
};

export const badgeTelemetryHandler: ToolHandler = async (rawInput): Promise<BadgeTelemetrySnapshot & { raw?: unknown }> => {
  const input = TelemetryInput.parse(rawInput ?? {});
  const { snapshot, rawPanels } = collectBadgeTelemetry({
    desktopId: input.desktopId,
    panelIds: input.panelIds,
  });
  return input.includeRaw ? { ...snapshot, raw: rawPanels } : snapshot;
};
