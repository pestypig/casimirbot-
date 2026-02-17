import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";

const Base = z.object({ baseUrl: z.string().url().optional() });
const SetInput = Base.extend({ command: z.string().min(1), args: z.record(z.unknown()).optional(), source: z.string().optional() });
const Output = z.object({ ok: z.boolean(), result: z.any() });

const baseUrlFrom = (baseUrl?: string) => baseUrl ?? process.env.HELIX_BASE_URL ?? "http://127.0.0.1:5173";

export const timeDilationControlSetSpec: ToolSpecShape = {
  name: "telemetry.time_dilation.control.set",
  desc: "Set time-dilation control command.",
  inputSchema: SetInput,
  outputSchema: Output,
  deterministic: false,
  rateLimit: { rpm: 30 },
  safety: { risks: ["network_access"] },
  risk: { writesFiles: false, touchesNetwork: true, privileged: false },
};
export const timeDilationControlSetHandler: ToolHandler = async (rawInput) => {
  const input = SetInput.parse(rawInput ?? {});
  const res = await fetch(`${baseUrlFrom(input.baseUrl)}/api/helix/time-dilation/control`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command: input.command, args: input.args ?? {}, source: input.source }) });
  return Output.parse({ ok: res.ok, result: await res.json() });
};

export const timeDilationControlGetSpec: ToolSpecShape = {
  name: "telemetry.time_dilation.control.get",
  desc: "Get current time-dilation control command.",
  inputSchema: Base,
  outputSchema: Output,
  deterministic: false,
  rateLimit: { rpm: 30 },
  safety: { risks: ["network_access"] },
  risk: { writesFiles: false, touchesNetwork: true, privileged: false },
};
export const timeDilationControlGetHandler: ToolHandler = async (rawInput) => {
  const input = Base.parse(rawInput ?? {});
  const res = await fetch(`${baseUrlFrom(input.baseUrl)}/api/helix/time-dilation/control`);
  return Output.parse({ ok: res.ok, result: await res.json() });
};

export const timeDilationControlClearSpec: ToolSpecShape = {
  name: "telemetry.time_dilation.control.clear",
  desc: "Clear time-dilation control command.",
  inputSchema: Base,
  outputSchema: Output,
  deterministic: false,
  rateLimit: { rpm: 30 },
  safety: { risks: ["network_access"] },
  risk: { writesFiles: false, touchesNetwork: true, privileged: false },
};
export const timeDilationControlClearHandler: ToolHandler = async (rawInput) => {
  const input = Base.parse(rawInput ?? {});
  const res = await fetch(`${baseUrlFrom(input.baseUrl)}/api/helix/time-dilation/control`, { method: "DELETE" });
  return Output.parse({ ok: res.ok, result: await res.json() });
};
