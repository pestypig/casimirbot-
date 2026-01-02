import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import {
  grConstraintPolicySchema,
  grConstraintThresholdSchema,
  grGroundingSchema,
  type GrConstraintEntry,
  type GrGrounding,
} from "@shared/schema";
import type { WarpConfig } from "../../types/warpViability";
import { loadWarpAgentsConfig } from "../../modules/physics/warpAgents";
import { getGlobalPipelineState } from "../energy-pipeline";
import { runGrEvaluation } from "../gr/gr-evaluation";
import { SupplementSchema, type Supplement } from "../services/planner/supplements";

const GR_GROUNDING_TOOL_NAME = "physics.gr.grounding";

const WarpConfigSchema = z
  .object({
    bubbleRadius_m: z.number().optional(),
    wallThickness_m: z.number().optional(),
    targetVelocity_c: z.number().optional(),
    tileConfigId: z.string().optional(),
    tileCount: z.number().optional(),
    dutyCycle: z.number().min(0).max(1).optional(),
    gammaGeoOverride: z.number().optional(),
  })
  .passthrough();

const GrGroundingInput = z
  .object({
    warpConfig: WarpConfigSchema.optional(),
    config: WarpConfigSchema.optional(),
    thresholds: grConstraintThresholdSchema.partial().optional(),
    policy: grConstraintPolicySchema.partial().optional(),
    useLiveSnapshot: z.boolean().optional(),
  })
  .passthrough();

const GrGroundingOutputSchema = grGroundingSchema.extend({
  supplement: SupplementSchema.optional(),
});

const formatNumber = (value?: number): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "n/a";
  }
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e5 || abs < 1e-3)) {
    return value.toExponential(3);
  }
  return Number(value.toPrecision(6)).toString();
};

const formatConstraintLine = (constraint: GrConstraintEntry): string => {
  const status = constraint.status.toUpperCase();
  const value =
    constraint.value !== undefined && constraint.value !== null
      ? formatNumber(constraint.value)
      : "n/a";
  const limit = constraint.limit ?? "n/a";
  return `${status} ${constraint.id} (${constraint.severity}) value=${value} limit=${limit}`;
};

const pickFirstFail = (
  constraints: GrConstraintEntry[],
): GrConstraintEntry | undefined =>
  constraints.find((entry) => entry.severity === "HARD" && entry.status === "fail") ??
  constraints.find((entry) => entry.status === "fail");

const buildPolicyVersion = async (args: {
  gateVersion?: number;
  overridesApplied?: boolean;
}): Promise<string> => {
  const parts: string[] = [];
  try {
    const config = await loadWarpAgentsConfig();
    parts.push(`warp-agents-v${config.version}`);
  } catch {
    parts.push("warp-agents-unknown");
  }
  if (args.gateVersion) {
    parts.push(`gate-v${args.gateVersion}`);
  }
  if (args.overridesApplied) {
    parts.push("overrides");
  }
  return parts.join(":");
};

const buildSupplement = (grounding: GrGrounding): Supplement => {
  const residuals = grounding.residuals;
  const certificate = grounding.certificate;
  const lines: string[] = [
    `policy: ${grounding.policyVersion}`,
    `pass: ${grounding.pass ? "true" : "false"}`,
    `residuals: H_rms=${formatNumber(residuals.H_rms)} M_rms=${formatNumber(
      residuals.M_rms,
    )} H_maxAbs=${formatNumber(residuals.H_maxAbs)} M_maxAbs=${formatNumber(
      residuals.M_maxAbs,
    )}`,
    `certificate: status=${certificate.status}${
      certificate.certificateHash ? ` hash=${certificate.certificateHash}` : ""
    }`,
  ];
  const firstFail = pickFirstFail(grounding.constraints);
  if (firstFail) {
    lines.push(`first_fail: ${firstFail.id} (${firstFail.severity})`);
  }
  if (grounding.proxy) {
    lines.push("proxy: true");
  }
  const constraintLines = grounding.constraints.map(formatConstraintLine);
  lines.push("constraints:");
  lines.push(...constraintLines);
  if (grounding.notes && grounding.notes.length > 0) {
    lines.push(`notes: ${grounding.notes.join(" | ")}`);
  }
  return {
    kind: "metrics",
    tool: GR_GROUNDING_TOOL_NAME,
    title: "GR Grounding",
    summary: `GR grounding ${grounding.pass ? "pass" : "fail"} (policy ${grounding.policyVersion})`,
    detail: lines.join("\n"),
    importance: 0.85,
  };
};

export const grGroundingSpec: ToolSpecShape = {
  name: GR_GROUNDING_TOOL_NAME,
  desc: "Summarize GR constraint residuals with policy version and certificate reference",
  inputSchema: GrGroundingInput,
  outputSchema: GrGroundingOutputSchema,
  deterministic: true,
  rateLimit: { rpm: 30 },
  safety: { risks: [] },
  risk: { writesFiles: false, touchesNetwork: false, privileged: false },
  health: "ok",
};

export const grGroundingHandler: ToolHandler = async (rawInput) => {
  const input = GrGroundingInput.parse(rawInput ?? {});
  const state = getGlobalPipelineState();
  const diagnostics = (state as any)?.gr ?? null;
  const warpConfig = (input.warpConfig ?? input.config ?? {}) as WarpConfig;
  const evaluation = await runGrEvaluation({
    diagnostics,
    warpConfig,
    thresholds: input.thresholds,
    policy: input.policy,
    useLiveSnapshot: input.useLiveSnapshot,
  });
  const overridesApplied =
    Boolean(input.thresholds || input.policy) ||
    Boolean(evaluation.evaluation.policy?.gate?.overridesApplied);
  const policyVersion = await buildPolicyVersion({
    gateVersion: evaluation.evaluation.policy?.gate?.version,
    overridesApplied,
  });
  const proxy =
    !diagnostics ||
    evaluation.evaluation.constraints.some(
      (entry) => entry.status === "unknown" || entry.proxy,
    );
  const grounding: GrGrounding = {
    kind: "gr-grounding",
    version: 1,
    updatedAt: evaluation.evaluation.updatedAt,
    policyVersion,
    residuals: evaluation.evaluation.residuals,
    constraints: evaluation.evaluation.constraints,
    certificate: {
      status: evaluation.evaluation.certificate.status,
      admissibleStatus: evaluation.evaluation.certificate.admissibleStatus,
      hasCertificate: evaluation.evaluation.certificate.hasCertificate,
      certificateHash: evaluation.evaluation.certificate.certificateHash ?? null,
      certificateId: evaluation.evaluation.certificate.certificateId ?? null,
      integrityOk: evaluation.evaluation.certificate.integrityOk,
    },
    pass: evaluation.evaluation.pass,
    ...(evaluation.evaluation.notes ? { notes: evaluation.evaluation.notes } : {}),
    ...(proxy ? { proxy: true } : {}),
  };
  const supplement = buildSupplement(grounding);
  return GrGroundingOutputSchema.parse({ ...grounding, supplement });
};
