import { z } from "zod";

export const SolarGuardrailSeverity = z.enum(["hard", "soft"]);
export type TSolarGuardrailSeverity = z.infer<typeof SolarGuardrailSeverity>;

export const SolarGuardrailStatus = z.enum(["pass", "fail", "unknown"]);
export type TSolarGuardrailStatus = z.infer<typeof SolarGuardrailStatus>;

export const SolarGuardrailRange = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  severity: SolarGuardrailSeverity,
  units: z.string().optional(),
  citation: z.string().optional(),
  notes: z.string().optional(),
});

export const SolarGuardrailEnumRange = z.object({
  allowed: z.array(z.string().min(1)).min(1),
  severity: SolarGuardrailSeverity,
  citation: z.string().optional(),
  notes: z.string().optional(),
});

export const SolarGuardrailConfig = z.object({
  schema_version: z.literal("solar_guardrails/1"),
  version: z.string().min(1),
  ranges: z.object({
    density_kg_m3: SolarGuardrailRange,
    pressure_Pa: SolarGuardrailRange,
    scale_height_km: SolarGuardrailRange,
    opacity_regime: SolarGuardrailEnumRange,
  }),
  followups: z
    .object({
      density: z.array(z.string()).optional(),
      pressure: z.array(z.string()).optional(),
      scale_height: z.array(z.string()).optional(),
      opacity_regime: z.array(z.string()).optional(),
    })
    .optional(),
});

export type TSolarGuardrailConfig = z.infer<typeof SolarGuardrailConfig>;

export const SolarGuardrailCheck = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  severity: SolarGuardrailSeverity,
  status: SolarGuardrailStatus,
  value: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  units: z.string().optional(),
  citation: z.string().optional(),
  notes: z.string().optional(),
  required_followups: z.array(z.string()).optional(),
});

export type TSolarGuardrailCheck = z.infer<typeof SolarGuardrailCheck>;

export const SolarGuardrailReport = z.object({
  schema_version: z.literal("solar_guardrail_report/1"),
  kind: z.literal("solar_guardrail_report"),
  generated_at_iso: z.string().datetime(),
  config_version: z.string().optional(),
  checks: z.array(SolarGuardrailCheck),
  summary: z.object({
    hard_fail_count: z.number().int().nonnegative(),
    soft_fail_count: z.number().int().nonnegative(),
    unknown_count: z.number().int().nonnegative(),
    requires_followup: z.boolean(),
  }),
});

export type TSolarGuardrailReport = z.infer<typeof SolarGuardrailReport>;

export type SolarGuardrailInputs = {
  density_kg_m3?: number | null;
  pressure_Pa?: number | null;
  scale_height_km?: number | null;
  opacity_regime?: string | null;
};

const isFiniteNumber = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);

const inRange = (value: number, min?: number, max?: number): boolean => {
  if (!Number.isFinite(value)) return false;
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
};

const buildRangeCheck = (args: {
  id: string;
  label: string;
  value: number | null | undefined;
  range: z.infer<typeof SolarGuardrailRange>;
  followups?: string[];
}): TSolarGuardrailCheck => {
  const { id, label, value, range, followups } = args;
  if (!isFiniteNumber(value)) {
    return {
      id,
      label,
      severity: range.severity,
      status: "unknown",
      min: range.min,
      max: range.max,
      units: range.units,
      citation: range.citation,
      notes: range.notes,
      required_followups: followups,
    };
  }
  const status = inRange(value, range.min, range.max) ? "pass" : "fail";
  return {
    id,
    label,
    severity: range.severity,
    status,
    value,
    min: range.min,
    max: range.max,
    units: range.units,
    citation: range.citation,
    notes: range.notes,
    required_followups: status === "pass" ? undefined : followups,
  };
};

const buildEnumCheck = (args: {
  id: string;
  label: string;
  value: string | null | undefined;
  range: z.infer<typeof SolarGuardrailEnumRange>;
  followups?: string[];
}): TSolarGuardrailCheck => {
  const { id, label, value, range, followups } = args;
  const cleaned = typeof value === "string" ? value.trim() : "";
  if (!cleaned) {
    return {
      id,
      label,
      severity: range.severity,
      status: "unknown",
      citation: range.citation,
      notes: range.notes,
      required_followups: followups,
    };
  }
  const allowed = range.allowed.map((entry) => entry.toLowerCase());
  const status = allowed.includes(cleaned.toLowerCase()) ? "pass" : "fail";
  return {
    id,
    label,
    severity: range.severity,
    status,
    citation: range.citation,
    notes: range.notes,
    required_followups: status === "pass" ? undefined : followups,
  };
};

export function evaluateSolarGuardrails(
  inputs: SolarGuardrailInputs | null | undefined,
  config: TSolarGuardrailConfig,
  generatedAtIso = new Date().toISOString(),
): TSolarGuardrailReport {
  const followups = config.followups ?? {};
  const checks: TSolarGuardrailCheck[] = [
    buildRangeCheck({
      id: "density_kg_m3",
      label: "Photospheric density",
      value: inputs?.density_kg_m3 ?? null,
      range: config.ranges.density_kg_m3,
      followups: followups.density,
    }),
    buildRangeCheck({
      id: "pressure_Pa",
      label: "Photospheric pressure",
      value: inputs?.pressure_Pa ?? null,
      range: config.ranges.pressure_Pa,
      followups: followups.pressure,
    }),
    buildRangeCheck({
      id: "scale_height_km",
      label: "Scale height",
      value: inputs?.scale_height_km ?? null,
      range: config.ranges.scale_height_km,
      followups: followups.scale_height,
    }),
    buildEnumCheck({
      id: "opacity_regime",
      label: "Opacity regime",
      value: inputs?.opacity_regime ?? null,
      range: config.ranges.opacity_regime,
      followups: followups.opacity_regime,
    }),
  ];

  let hardFail = 0;
  let softFail = 0;
  let unknown = 0;
  for (const check of checks) {
    if (check.status === "unknown") {
      unknown += 1;
      continue;
    }
    if (check.status === "fail") {
      if (check.severity === "hard") {
        hardFail += 1;
      } else {
        softFail += 1;
      }
    }
  }

  return SolarGuardrailReport.parse({
    schema_version: "solar_guardrail_report/1",
    kind: "solar_guardrail_report",
    generated_at_iso: generatedAtIso,
    config_version: config.version,
    checks,
    summary: {
      hard_fail_count: hardFail,
      soft_fail_count: softFail,
      unknown_count: unknown,
      requires_followup: hardFail + softFail + unknown > 0,
    },
  });
}
