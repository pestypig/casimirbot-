import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
const DEFAULT_BASE_URL = "http://127.0.0.1:5173";

const ActivateInput = z.object({
  baseUrl: z.string().url().optional(),
  warpFieldType: z.enum(["natario", "natario_sdf", "alcubierre", "irrotational"]).default("natario"),
  grEnabled: z.boolean().default(true),
  publishDiagnostics: z.boolean().default(true),
  async: z.boolean().default(false),
  kickGrBrick: z.boolean().default(true),
  quality: z.string().optional(),
  kickQuality: z.string().optional(),
  gridScale: z.number().positive().optional(),
  grTargetDx: z.number().positive().optional(),
  includeExtra: z.boolean().optional(),
  includeMatter: z.boolean().optional(),
  includeKij: z.boolean().optional(),
  wallInvariant: z.enum(["kretschmann", "ricci4"]).optional(),
  timeoutMs: z.number().positive().optional(),
  diagnosticsTimeoutMs: z.number().positive().optional(),
});

const ActivateOutput = z.object({
  ok: z.boolean(),
  baseUrl: z.string(),
  warpFieldType: z.string(),
  grEnabled: z.boolean(),
  pipelineUpdate: z.any(),
  diagnostics: z.any(),
});

const postJson = async <T>(url: string, body: unknown, timeoutMs?: number): Promise<T> => {
  const controller = timeoutMs ? new AbortController() : null;
  const timeout = timeoutMs
    ? setTimeout(() => controller?.abort(), timeoutMs)
    : null;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body ?? {}),
    signal: controller?.signal,
  });
  if (timeout) clearTimeout(timeout);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POST ${url} failed (${res.status}): ${text}`);
  }
  return (await res.json()) as T;
};

export const timeDilationActivateSpec: ToolSpecShape = {
  name: "telemetry.time_dilation.activate_natario",
  desc: "Activate Natario canonical pipeline + GR brick and publish a strict time-dilation lattice diagnostics payload.",
  inputSchema: ActivateInput,
  outputSchema: ActivateOutput,
  deterministic: false,
  rateLimit: { rpm: 10 },
  safety: { risks: ["network_access"] },
  risk: { writesFiles: false, touchesNetwork: true, privileged: false },
  health: "ok",
};

export const timeDilationActivateHandler: ToolHandler = async (rawInput) => {
  const input = ActivateInput.parse(rawInput ?? {});
  const baseUrl = input.baseUrl ?? process.env.HELIX_BASE_URL ?? DEFAULT_BASE_URL;
  const timeoutMs = input.timeoutMs;

  const activation = await postJson<any>(
    `${baseUrl}/api/helix/time-dilation/activate`,
    {
      warpFieldType: input.warpFieldType,
      grEnabled: input.grEnabled,
      publishDiagnostics: input.publishDiagnostics,
      async: input.async,
      kickGrBrick: input.kickGrBrick,
      quality: input.quality,
      kickQuality: input.kickQuality,
      gridScale: input.gridScale,
      grTargetDx: input.grTargetDx,
      includeExtra: input.includeExtra,
      includeMatter: input.includeMatter,
      includeKij: input.includeKij,
      wallInvariant: input.wallInvariant,
      timeoutMs,
      diagnosticsTimeoutMs: input.diagnosticsTimeoutMs,
    },
    timeoutMs,
  );

  return ActivateOutput.parse({
    ok: true,
    baseUrl,
    warpFieldType: input.warpFieldType,
    grEnabled: input.grEnabled,
    pipelineUpdate: activation?.pipelineUpdate ?? null,
    diagnostics: activation?.diagnostics ?? null,
  });
};
