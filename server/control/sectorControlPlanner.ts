import {
  sectorControlPlanSchema,
  type SectorControlMode,
  type SectorControlPlan,
} from "@shared/schema";
import { evaluateTsRatioGate } from "@shared/clocking";

type GuardrailStatus = "pass" | "fail" | "unknown";

export type SectorControlObserverInput = {
  observerId: string;
  rho_Jm3?: number;
  debt_Jm3s?: number;
  maxDebt_Jm3s?: number;
  dt_ms?: number;
};

export type SectorControlObserverGridInput = {
  paybackGain?: number;
  observers?: SectorControlObserverInput[];
};

export type SectorControlPlannerInput = {
  mode: SectorControlMode;
  objective?: string;
  notes?: string[];
  maturity?: SectorControlPlan["maturity"];
  timing?: Partial<SectorControlPlan["timing"]>;
  allocation?: Partial<Pick<SectorControlPlan["allocation"], "sectorCount" | "concurrentSectors" | "negativeFraction">>;
  duty?: Partial<Pick<SectorControlPlan["duty"], "dutyCycle" | "dutyBurst" | "dutyShip">>;
  constraints?: Partial<SectorControlPlan["constraints"]>;
  observerGrid?: SectorControlObserverGridInput;
};

export type SectorControlPlannerResult =
  | { ok: true; plan: SectorControlPlan; firstFail: null }
  | { ok: false; plan: SectorControlPlan; firstFail: keyof SectorControlPlan["constraints"] };

const HARD_GUARDRAIL_ORDER: Array<keyof SectorControlPlan["constraints"]> = [
  "FordRomanQI",
  "ThetaAudit",
  "grConstraintGate",
];

const DEFAULT_PAYBACK_GAIN = 1.1;
const DEFAULT_OBSERVER_GRID: Array<{
  observerId: string;
  rhoWeight: number;
  maxDebt_Jm3s: number;
}> = [
  { observerId: "hull_band", rhoWeight: -1.0, maxDebt_Jm3s: 0.35 },
  { observerId: "ship_core", rhoWeight: -0.45, maxDebt_Jm3s: 0.2 },
  { observerId: "far_field", rhoWeight: 0.2, maxDebt_Jm3s: 0.45 },
];

function buildObserverGridTracking(args: {
  observerGrid?: SectorControlObserverGridInput;
  dutyEffective_FR: number;
  sectorCount: number;
  posSectors: number;
  timing: SectorControlPlan["timing"];
}): {
  observerGrid: NonNullable<SectorControlPlan["observerGrid"]>;
  hasOverflow: boolean;
} {
  const paybackGain = Math.max(1, args.observerGrid?.paybackGain ?? DEFAULT_PAYBACK_GAIN);
  const baseMagnitude = Math.max(1e-6, args.dutyEffective_FR * 10);
  const baseDt_ms = Math.max(1e-6, args.timing.tauPulse_ms);
  const baseDt_s = baseDt_ms / 1000;
  const paybackBudget_Jm3s =
    baseMagnitude *
    (args.posSectors / Math.max(args.sectorCount, 1)) *
    baseDt_s;

  const observerInputs: SectorControlObserverInput[] =
    args.observerGrid?.observers && args.observerGrid.observers.length > 0
      ? args.observerGrid.observers
      : DEFAULT_OBSERVER_GRID.map((entry) => ({ observerId: entry.observerId }));

  const observers = observerInputs.map((observer, index) => {
    const fallback = DEFAULT_OBSERVER_GRID[index % DEFAULT_OBSERVER_GRID.length];
    const dt_ms = Math.max(1e-6, observer.dt_ms ?? baseDt_ms);
    const dt_s = dt_ms / 1000;
    const rho_Jm3 =
      Number.isFinite(observer.rho_Jm3) && observer.rho_Jm3 !== undefined
        ? observer.rho_Jm3
        : baseMagnitude * fallback.rhoWeight;
    const debtBefore_Jm3s = Math.max(0, observer.debt_Jm3s ?? 0);
    const maxDebt_Jm3s = Math.max(1e-9, observer.maxDebt_Jm3s ?? fallback.maxDebt_Jm3s);

    const negativeLoan_Jm3s = Math.max(0, -rho_Jm3) * dt_s;
    const requiredPayback_Jm3s = negativeLoan_Jm3s * paybackGain;
    const observerShare = 1 + index * 0.15;
    const paybackApplied_Jm3s =
      Math.max(0, rho_Jm3) * dt_s + paybackBudget_Jm3s * observerShare;
    const debtAfter_Jm3s = Math.max(
      0,
      debtBefore_Jm3s + requiredPayback_Jm3s - paybackApplied_Jm3s,
    );
    const paybackRatio =
      requiredPayback_Jm3s > 1e-12 ? paybackApplied_Jm3s / requiredPayback_Jm3s : 1;
    const status: "pass" | "fail" = debtAfter_Jm3s > maxDebt_Jm3s ? "fail" : "pass";

    return {
      observerId: observer.observerId || fallback.observerId,
      rho_Jm3,
      dt_ms,
      debtBefore_Jm3s,
      debtAfter_Jm3s,
      maxDebt_Jm3s,
      requiredPayback_Jm3s,
      paybackApplied_Jm3s,
      paybackRatio,
      status,
      note:
        status === "fail"
          ? `observer debt exceeded cap (${debtAfter_Jm3s.toExponential(3)} > ${maxDebt_Jm3s.toExponential(3)})`
          : undefined,
    };
  });

  const overflowCount = observers.filter((entry) => entry.status === "fail").length;
  return {
    observerGrid: {
      paybackGain,
      paybackBudget_Jm3s,
      overflowCount,
      observers,
    },
    hasOverflow: overflowCount > 0,
  };
}

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
  const observerTracking = buildObserverGridTracking({
    observerGrid: input.observerGrid,
    dutyEffective_FR,
    sectorCount,
    posSectors,
    timing,
  });
  const notes = input.notes ? [...input.notes] : ["Non-certifying planner output."];
  if (observerTracking.hasOverflow && constraints.FordRomanQI === "pass") {
    constraints.FordRomanQI = "fail";
    notes.push("Observer-grid QI debt overflow triggered FordRomanQI fail-closed.");
  }

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
    observerGrid: observerTracking.observerGrid,
    constraints,
    objective: input.objective ?? "Generate diagnostic sector-control schedule under hard guardrails.",
    maturity: input.maturity ?? "diagnostic",
    notes,
  });

  const firstFail = selectFirstHardFail(plan.constraints);
  if (firstFail) {
    return { ok: false, plan, firstFail };
  }
  return { ok: true, plan, firstFail: null };
}
