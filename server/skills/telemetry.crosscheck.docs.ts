import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";

const TelemetryCrosscheckInput = z.object({
  telemetry: z.record(z.number()),
  thresholds: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
      source: z.string().optional(),
    }),
  ),
});

const TelemetryCrosscheckOutput = z.object({
  status: z.enum(["ok", "warn", "error"]),
  mismatches: z.array(
    z.object({
      metric: z.string(),
      value: z.number(),
      needed: z.number(),
      source: z.string().optional(),
    }),
  ),
});

export const telemetryCrosscheckDocsSpec: ToolSpecShape = {
  name: "telemetry.crosscheck.docs",
  desc: "Compare live telemetry metrics against documented thresholds.",
  inputSchema: TelemetryCrosscheckInput,
  outputSchema: TelemetryCrosscheckOutput,
  deterministic: true,
  rateLimit: { rpm: 30 },
  safety: { risks: [] },
};

export const telemetryCrosscheckDocsHandler: ToolHandler = async (rawInput) => {
  const input = TelemetryCrosscheckInput.parse(rawInput ?? {});
  const mismatches = input.thresholds
    .map((entry) => {
      const value = input.telemetry[entry.name.replace(/_min$|_max$/i, "")] ?? input.telemetry[entry.name];
      if (value === undefined) return null;
      if (entry.name.toLowerCase().includes("min") && value < entry.value) {
        return { metric: entry.name, value, needed: entry.value, source: entry.source };
      }
      if (entry.name.toLowerCase().includes("max") && value > entry.value) {
        return { metric: entry.name, value, needed: entry.value, source: entry.source };
      }
      return null;
    })
    .filter(Boolean) as Array<{ metric: string; value: number; needed: number; source?: string }>;
  const status: "ok" | "warn" | "error" = mismatches.length === 0 ? "ok" : mismatches.length > 2 ? "error" : "warn";
  return { status, mismatches };
};

