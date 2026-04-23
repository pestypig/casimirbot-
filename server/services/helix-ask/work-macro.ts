import { createHash } from "node:crypto";
import { z } from "zod";
import type { ToolManifestEntry } from "@shared/skills";

export const HELIX_WORK_MACRO_SCHEMA_VERSION = "helix.work_macro.v1" as const;
export const HELIX_WORK_CAPABILITY_GLOSSARY_VERSION = "helix.work_capability_glossary.v1" as const;

const HelixWorkMacroLaneSchema = z.enum(["act", "observe", "verify"]);
const HelixWorkMacroVerbSchema = z.enum(["tool.invoke"]);
const HelixWorkMacroOnFailSchema = z.enum(["retry", "skip", "abort"]);

const HelixWorkMacroStepSchema = z.object({
  id: z.string().min(1).max(120),
  verb: HelixWorkMacroVerbSchema,
  args: z.record(z.unknown()),
  requires_capabilities: z.array(z.string().min(1).max(120)).min(1).max(24),
  timeout_ms: z.number().int().min(250).max(120_000),
  on_fail: HelixWorkMacroOnFailSchema,
});

export const HelixWorkMacroPlanSchema = z.object({
  schema_version: z.literal(HELIX_WORK_MACRO_SCHEMA_VERSION),
  id: z.string().min(1).max(120),
  lane: HelixWorkMacroLaneSchema,
  intent: z.string().min(1).max(240),
  idempotency_key: z.string().min(1).max(200),
  steps: z.array(HelixWorkMacroStepSchema).min(1).max(12),
  manual_fallback: z.string().min(1).max(500),
});

export type HelixWorkMacroPlan = z.infer<typeof HelixWorkMacroPlanSchema>;

const HelixWorkMacroValidationSchema = z.object({
  ok: z.boolean(),
  errors: z.array(z.string()).default([]),
});

export type HelixWorkMacroValidation = z.infer<typeof HelixWorkMacroValidationSchema>;

export const HelixWorkCapabilityGlossarySchema = z.object({
  schema_version: z.literal(HELIX_WORK_CAPABILITY_GLOSSARY_VERSION),
  generated_at_ms: z.number().int().nonnegative(),
  lane: HelixWorkMacroLaneSchema,
  selected_tool: z.string().min(1).max(120),
  allowed_tools: z.array(z.string().min(1).max(120)).max(256),
  required_capabilities: z.array(z.string().min(1).max(120)).max(24),
  available_capabilities: z.array(z.string().min(1).max(120)).max(1024),
});

export type HelixWorkCapabilityGlossary = z.infer<typeof HelixWorkCapabilityGlossarySchema>;

type BuildHelixWorkCapabilityGlossaryArgs = {
  lane: z.infer<typeof HelixWorkMacroLaneSchema>;
  toolName: string;
  allowTools: string[];
  manifest: ToolManifestEntry[];
};

type BuildHelixWorkMacroPlanArgs = BuildHelixWorkCapabilityGlossaryArgs & {
  traceId: string;
  requestPayload: Record<string, unknown>;
  timeoutMs?: number;
};

const stableHash = (value: unknown): string =>
  createHash("sha256").update(JSON.stringify(value) ?? "null").digest("hex");

const resolveLaneTimeoutMs = (lane: z.infer<typeof HelixWorkMacroLaneSchema>, timeoutMs?: number): number => {
  if (typeof timeoutMs === "number" && Number.isFinite(timeoutMs)) {
    return Math.min(120_000, Math.max(250, Math.floor(timeoutMs)));
  }
  switch (lane) {
    case "verify":
      return 45_000;
    case "observe":
      return 30_000;
    case "act":
    default:
      return 60_000;
  }
};

const resolveOnFailPolicy = (lane: z.infer<typeof HelixWorkMacroLaneSchema>): z.infer<typeof HelixWorkMacroOnFailSchema> => {
  switch (lane) {
    case "verify":
      return "abort";
    case "observe":
      return "skip";
    case "act":
    default:
      return "retry";
  }
};

const resolveManualFallback = (toolName: string): string =>
  `Manual fallback: run '${toolName}' with the same arguments in a trusted operator lane and record a deterministic receipt.`;

export const buildHelixWorkCapabilityGlossary = (
  args: BuildHelixWorkCapabilityGlossaryArgs,
): HelixWorkCapabilityGlossary => {
  const availableCapabilities = new Set<string>();
  availableCapabilities.add(`lane:${args.lane}`);
  for (const entry of args.manifest) {
    if (!entry?.name) continue;
    availableCapabilities.add(`tool:${entry.name}`);
    if (entry.deterministic === true) {
      availableCapabilities.add(`tool:${entry.name}:deterministic`);
    }
    if (entry.risk?.writesFiles === true) {
      availableCapabilities.add("risk:writes_files");
    }
    if (entry.risk?.touchesNetwork === true) {
      availableCapabilities.add("risk:network_access");
    }
    if (entry.risk?.privileged === true) {
      availableCapabilities.add("risk:privileged");
    }
  }
  const requiredCapabilities = [`lane:${args.lane}`, `tool:${args.toolName}`];
  return {
    schema_version: HELIX_WORK_CAPABILITY_GLOSSARY_VERSION,
    generated_at_ms: Date.now(),
    lane: args.lane,
    selected_tool: args.toolName,
    allowed_tools: args.allowTools.length > 0 ? [...args.allowTools] : args.manifest.map((entry) => entry.name),
    required_capabilities: requiredCapabilities,
    available_capabilities: Array.from(availableCapabilities).sort(),
  };
};

export const buildHelixWorkMacroPlan = (
  args: BuildHelixWorkMacroPlanArgs,
): {
  plan: HelixWorkMacroPlan;
  validation: HelixWorkMacroValidation;
  capabilityGlossary: HelixWorkCapabilityGlossary;
} => {
  const capabilityGlossary = buildHelixWorkCapabilityGlossary(args);
  const plan: HelixWorkMacroPlan = {
    schema_version: HELIX_WORK_MACRO_SCHEMA_VERSION,
    id: `wm:${args.traceId}:1`.slice(0, 120),
    lane: args.lane,
    intent: `${args.lane} -> ${args.toolName}`,
    idempotency_key: `wm:${stableHash({ lane: args.lane, tool: args.toolName, request: args.requestPayload }).slice(0, 24)}`,
    steps: [
      {
        id: "step:tool.invoke",
        verb: "tool.invoke",
        args: {
          tool: args.toolName,
          payload: args.requestPayload,
        },
        requires_capabilities: capabilityGlossary.required_capabilities,
        timeout_ms: resolveLaneTimeoutMs(args.lane, args.timeoutMs),
        on_fail: resolveOnFailPolicy(args.lane),
      },
    ],
    manual_fallback: resolveManualFallback(args.toolName),
  };
  const parsed = HelixWorkMacroPlanSchema.safeParse(plan);
  const validation: HelixWorkMacroValidation = parsed.success
    ? { ok: true, errors: [] }
    : { ok: false, errors: parsed.error.issues.map((issue) => issue.message) };
  return {
    plan,
    validation: HelixWorkMacroValidationSchema.parse(validation),
    capabilityGlossary,
  };
};
