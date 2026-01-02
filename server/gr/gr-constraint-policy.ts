import type {
  GrCertificatePolicy,
  GrConstraintGateConfig,
  GrConstraintPolicy,
  GrConstraintPolicyBundle,
  GrConstraintThresholds,
} from "../../shared/schema.js";
import { loadWarpAgentsConfig } from "../../modules/physics/warpAgents.js";
import {
  DEFAULT_GR_CONSTRAINT_POLICY,
  DEFAULT_GR_CONSTRAINT_THRESHOLDS,
} from "./constraint-evaluator.js";

const DEFAULT_CERTIFICATE_POLICY: GrCertificatePolicy = {
  admissibleStatus: "ADMISSIBLE",
  allowMarginalAsViable: false,
  treatMissingCertificateAsNotCertified: true,
};

const mergeOverrides = <T extends Record<string, unknown>>(
  base: T,
  overrides?: Partial<T>,
): T => {
  if (!overrides) return base;
  const next = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) {
      (next as Record<string, unknown>)[key] = value;
    }
  }
  return next;
};

export async function resolveGrConstraintPolicyBundle(
  overrides?: {
    thresholds?: Partial<GrConstraintThresholds>;
    policy?: Partial<GrConstraintPolicy>;
  },
): Promise<GrConstraintPolicyBundle> {
  const agentsConfig = await loadWarpAgentsConfig().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load WARP_AGENTS.md: ${message}`);
  });

  const gateConfig = agentsConfig.grConstraintGate;
  const baseThresholds = mergeOverrides(
    { ...DEFAULT_GR_CONSTRAINT_THRESHOLDS },
    gateConfig?.thresholds,
  );
  const basePolicy = mergeOverrides(
    { ...DEFAULT_GR_CONSTRAINT_POLICY },
    gateConfig?.policy,
  );
  const thresholds = mergeOverrides(baseThresholds, overrides?.thresholds);
  const policy = mergeOverrides(basePolicy, overrides?.policy);
  const overridesApplied = Boolean(
    overrides?.thresholds || overrides?.policy,
  );

  const gate: GrConstraintGateConfig = {
    version: gateConfig?.version ?? 1,
    source: gateConfig ? "warp-agents" : "default",
    thresholds,
    policy,
    ...(overridesApplied ? { overridesApplied } : {}),
  };

  const certificate = agentsConfig.viabilityPolicy
    ? { ...agentsConfig.viabilityPolicy }
    : DEFAULT_CERTIFICATE_POLICY;

  return { gate, certificate };
}
