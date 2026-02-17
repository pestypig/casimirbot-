import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";

const Input = z.object({ baseUrl: z.string().url().optional(), payload: z.record(z.unknown()) });
const Output = z.object({ ok: z.boolean(), result: z.any() });

export const physicsCurvatureRunSpec: ToolSpecShape = {
  name: "physics.curvature.run",
  desc: "Run curvature endpoint using provided payload.",
  inputSchema: Input,
  outputSchema: Output,
  deterministic: false,
  rateLimit: { rpm: 20 },
  safety: { risks: ["network_access"] },
  risk: { writesFiles: false, touchesNetwork: true, privileged: false },
};

export const physicsCurvatureRunHandler: ToolHandler = async (rawInput) => {
  const input = Input.parse(rawInput ?? {});
  const baseUrl = input.baseUrl ?? process.env.HELIX_BASE_URL ?? "http://127.0.0.1:5173";
  const res = await fetch(`${baseUrl}/api/physics/curvature/run`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input.payload ?? {}) });
  return Output.parse({ ok: res.ok, result: await res.json() });
};
