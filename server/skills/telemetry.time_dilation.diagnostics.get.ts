import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";

const Input = z.object({ baseUrl: z.string().url().optional(), timeoutMs: z.number().positive().optional() });
const Output = z.object({ ok: z.boolean(), diagnostics: z.any() });

export const timeDilationDiagnosticsGetSpec: ToolSpecShape = {
  name: "telemetry.time_dilation.diagnostics.get",
  desc: "Fetch latest time-dilation diagnostics payload.",
  inputSchema: Input,
  outputSchema: Output,
  deterministic: false,
  rateLimit: { rpm: 30 },
  safety: { risks: ["network_access"] },
  risk: { writesFiles: false, touchesNetwork: true, privileged: false },
};

export const timeDilationDiagnosticsGetHandler: ToolHandler = async (rawInput) => {
  const input = Input.parse(rawInput ?? {});
  const baseUrl = input.baseUrl ?? process.env.HELIX_BASE_URL ?? "http://127.0.0.1:5173";
  const response = await fetch(`${baseUrl}/api/helix/time-dilation/diagnostics`);
  const diagnostics = await response.json();
  return Output.parse({ ok: response.ok, diagnostics });
};
