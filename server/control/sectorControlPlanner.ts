import {
  sectorControlPlanSchema,
  type SectorControlMode,
  type SectorControlPlan,
} from "@shared/schema";
import { evaluateTsRatioGate } from "@shared/clocking";

type GuardrailStatus = "pass" | "fail" | "unknown";

export type SectorControlPlannerInput = {
  mode: SectorControlMode;
  objective?: string;
  notes?: string[];
  maturity?: SectorControlPlan["maturity"];
  timing?: Partial<SectorControlPlan["timing"]>;
  allocation?: Partial<Pick<SectorControlPlan["allocation"], "sectorCount" | "concurrentSectors" | "negativeFraction">>;
  duty?: Partial<Pick<SectorControlPlan["duty"], "dutyCycle" | "dutyBurst" | "dutyShip">>;
  constraints?: Partial<SectorControlPlan["constraints"]>;
};

export type SectorControlPlannerResult =
  | { ok: true; plan: SectorControlPlan; firstFail: null }
  | { ok: false; plan: SectorControlPlan; firstFail: keyof SectorControlPlan["constraints"] };

const HARD_GUARDRAIL_ORDER: Array<keyof SectorControlPlan["constraints"]> = [
  "FordRomanQI",
  "ThetaAudit",
  "grConstraintGate",
];

function selectFirstHardFail(constraints: SectorControlPlan["constraints"]): keyof SectorControlPlan["constraints"] | null {
  for (const key of HARD_GUARDRAIL_ORDER) {
    if (constraints[key] === "fail" || constraints[key] === "unknown") {
      return key;
    }
  }
  return null;
}

export function buildSectorControlPlan(input: SectorControlPlannerInput): SectorControlPlannerResult {
  const timing = {
    strobeHz: input.timing?.strobeHz ?? 120,
    sectorPeriod_ms: input.timing?.sectorPeriod_ms ?? 8.333,
    TS_ratio: input.timing?.TS_ratio ?? 1.6,
    tauLC_ms: input.timing?.tauLC_ms ?? 10,
    tauPulse_ms: input.timing?.tauPulse_ms ?? 2,
  };

  const sectorCount = Math.max(1, Math.trunc(input.allocation?.sectorCount ?? 12));
  const concurrentSectors = Math.max(1, Math.min(sectorCount, Math.trunc(input.allocation?.concurrentSectors ?? 3)));
  const negativeFraction = Math.min(1, Math.max(0, input.allocation?.negativeFraction ?? 0.25));
  const negSectors = Math.min(sectorCount, Math.round(sectorCount * negativeFraction));
  const posSectors = Math.max(0, sectorCount - negSectors);

  const dutyCycle = Math.min(1, Math.max(0, input.duty?.dutyCycle ?? 0.5));
  const dutyBurst = Math.min(1, Math.max(0, input.duty?.dutyBurst ?? 0.3));
  const dutyShip = Math.min(1, Math.max(0, input.duty?.dutyShip ?? 0.2));
  const dutyEffective_FR = Math.min(1, dutyBurst * dutyCycle * (concurrentSectors / sectorCount));

  const constraints: Record<keyof SectorControlPlan["constraints"], GuardrailStatus> = {
    FordRomanQI: input.constraints?.FordRomanQI ?? "pass",
    ThetaAudit: input.constraints?.ThetaAudit ?? "pass",
    TS_ratio_min:
      input.constraints?.TS_ratio_min ??
      (evaluateTsRatioGate(timing.TS_ratio, 1.5).pass ? "pass" : "fail"),
    VdB_band: input.constraints?.VdB_band ?? "unknown",
    grConstraintGate: input.constraints?.grConstraintGate ?? "pass",
  };

  const plan = sectorControlPlanSchema.parse({
    mode: input.mode,
    timing,
    allocation: {
      sectorCount,
      concurrentSectors,
      negativeFraction,
      negSectors,
      posSectors,
    },
    duty: { dutyCycle, dutyBurst, dutyEffective_FR, dutyShip },
    constraints,
    objective: input.objective ?? "Generate diagnostic sector-control schedule under hard guardrails.",
    maturity: input.maturity ?? "diagnostic",
    notes: input.notes ?? ["Non-certifying planner output."],
  });

  const firstFail = selectFirstHardFail(plan.constraints);
  if (firstFail) {
    return { ok: false, plan, firstFail };
  }
  return { ok: true, plan, firstFail: null };
}
