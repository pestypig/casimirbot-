import fs from "node:fs";
import path from "node:path";
import {
  SolarGuardrailConfig,
  evaluateSolarGuardrails,
  type SolarGuardrailInputs,
  type TSolarGuardrailConfig,
  type TSolarGuardrailReport,
} from "@shared/solar-guardrails";

const DEFAULT_GUARDRAIL_VERSION =
  process.env.SOLAR_GUARDRAIL_VERSION ?? "v1";

const guardrailCache = new Map<string, TSolarGuardrailConfig>();

const STAR_MATERIALS_PROVENANCE_NON_MEASURED =
  "STAR_MATERIALS_PROVENANCE_NON_MEASURED" as const;

type StarMaterialsProvenanceClass = "measured" | "proxy" | "inferred";
type StarMaterialsClaimTier = "diagnostic" | "reduced-order" | "certified";

type StarMaterialsProvenanceEnvelope = {
  provenance_class: StarMaterialsProvenanceClass;
  claim_tier: StarMaterialsClaimTier;
  certifying: boolean;
  fail_reason?: typeof STAR_MATERIALS_PROVENANCE_NON_MEASURED;
};

const normalizeProvenanceClass = (
  value: unknown,
): StarMaterialsProvenanceClass => {
  if (value === "measured" || value === "proxy" || value === "inferred") {
    return value;
  }
  return "inferred";
};

const normalizeClaimTier = (value: unknown): StarMaterialsClaimTier => {
  if (
    value === "diagnostic" ||
    value === "reduced-order" ||
    value === "certified"
  ) {
    return value;
  }
  return "diagnostic";
};

const resolveStarMaterialsProvenance = (
  opts?: {
    provenanceClass?: unknown;
    claimTier?: unknown;
    strictMeasuredProvenance?: boolean;
  },
): StarMaterialsProvenanceEnvelope => {
  const provenanceClass = normalizeProvenanceClass(opts?.provenanceClass);
  const requestedClaimTier = normalizeClaimTier(opts?.claimTier);
  const certifying = provenanceClass === "measured" && requestedClaimTier === "certified";
  const claimTier = certifying ? requestedClaimTier : "diagnostic";

  if (opts?.strictMeasuredProvenance && provenanceClass !== "measured") {
    return {
      provenance_class: provenanceClass,
      claim_tier: "diagnostic",
      certifying: false,
      fail_reason: STAR_MATERIALS_PROVENANCE_NON_MEASURED,
    };
  }

  return {
    provenance_class: provenanceClass,
    claim_tier: claimTier,
    certifying,
  };
};

export const solarGuardrailConfigPath = (
  version = DEFAULT_GUARDRAIL_VERSION,
): string =>
  process.env.SOLAR_GUARDRAIL_PATH ??
  path.resolve(process.cwd(), "configs", `solar-guardrails.${version}.json`);

export function loadSolarGuardrailConfig(
  version = DEFAULT_GUARDRAIL_VERSION,
): TSolarGuardrailConfig {
  const cached = guardrailCache.get(version);
  if (cached) return cached;
  const file = solarGuardrailConfigPath(version);
  const raw = fs.readFileSync(file, "utf8");
  const parsed = SolarGuardrailConfig.parse(JSON.parse(raw));
  guardrailCache.set(version, parsed);
  return parsed;
}

export function runSolarGuardrails(
  inputs: SolarGuardrailInputs | null | undefined,
  opts?: {
    configVersion?: string;
    generatedAtIso?: string;
    provenanceClass?: unknown;
    claimTier?: unknown;
    strictMeasuredProvenance?: boolean;
  },
): TSolarGuardrailReport & StarMaterialsProvenanceEnvelope {
  const version = opts?.configVersion ?? DEFAULT_GUARDRAIL_VERSION;
  const config = loadSolarGuardrailConfig(version);
  const report = evaluateSolarGuardrails(inputs, config, opts?.generatedAtIso);
  const provenance = resolveStarMaterialsProvenance(opts);
  return {
    ...report,
    ...provenance,
  };
}

export { STAR_MATERIALS_PROVENANCE_NON_MEASURED };
