import { describe, expect, it } from "vitest";
import { sectorControlLiveEventSchema, sectorControlPlanSchema, sectorControlRationaleSchema } from "../shared/schema";

describe("sectorControlPlanSchema", () => {
  it("accepts complete sector-control plans", () => {
    const parsed = sectorControlPlanSchema.parse({
      mode: "diagnostic",
      timing: { strobeHz: 120, sectorPeriod_ms: 8.33, TS_ratio: 1.6, tauLC_ms: 10, tauPulse_ms: 2 },
      allocation: { sectorCount: 12, concurrentSectors: 3, negativeFraction: 0.25, negSectors: 3, posSectors: 9 },
      duty: { dutyCycle: 0.5, dutyBurst: 0.3, dutyEffective_FR: 0.075, dutyShip: 0.18 },
      observerGrid: {
        paybackGain: 1.1,
        paybackBudget_Jm3s: 0.01,
        overflowCount: 0,
        observers: [
          {
            observerId: "hull_band",
            rho_Jm3: -0.5,
            dt_ms: 2,
            debtBefore_Jm3s: 0.01,
            debtAfter_Jm3s: 0.02,
            maxDebt_Jm3s: 0.2,
            requiredPayback_Jm3s: 0.02,
            paybackApplied_Jm3s: 0.03,
            paybackRatio: 1.5,
            status: "pass",
          },
        ],
      },
      constraints: {
        FordRomanQI: "pass",
        ThetaAudit: "pass",
        TS_ratio_min: "pass",
        VdB_band: "unknown",
        grConstraintGate: "pass",
      },
      objective: "diagnostic scheduler preview",
      maturity: "diagnostic",
      notes: ["non-certifying"],
    });

    expect(parsed.maturity).toBe("diagnostic");
    expect(parsed.duty.dutyEffective_FR).toBeCloseTo(0.075, 8);
    expect(parsed.observerGrid?.observers[0]?.observerId).toBe("hull_band");
  });

  it("rejects invalid duty bounds", () => {
    const parsed = sectorControlPlanSchema.safeParse({
      mode: "diagnostic",
      timing: { strobeHz: 120, sectorPeriod_ms: 8.33, TS_ratio: 1.6, tauLC_ms: 10, tauPulse_ms: 2 },
      allocation: { sectorCount: 12, concurrentSectors: 3, negativeFraction: 0.25, negSectors: 3, posSectors: 9 },
      duty: { dutyCycle: 1.2, dutyBurst: 0.3, dutyEffective_FR: 0.075, dutyShip: 0.18 },
      constraints: {
        FordRomanQI: "pass",
        ThetaAudit: "pass",
        TS_ratio_min: "pass",
        VdB_band: "unknown",
        grConstraintGate: "pass",
      },
      objective: "diagnostic scheduler preview",
      maturity: "diagnostic",
      notes: [],
    });

    expect(parsed.success).toBe(false);
  });
});

describe("sectorControlRationaleSchema", () => {
  it("accepts optional summary and citations", () => {
    const payload = sectorControlRationaleSchema.parse({
      equations: ["TS_ratio = tauLC/tauPulse"],
      risks: ["Ford-Roman QI window violation"],
      citations: ["WARP_AGENTS.md#FordRomanQI"],
      summary: "Reduced-order sector plan rationale",
    });

    expect(payload.citations).toHaveLength(1);
  });
});


describe("sectorControlLiveEventSchema", () => {
  it("accepts server-authoritative live event payloads", () => {
    const parsed = sectorControlLiveEventSchema.parse({
      ts: 1735689600000,
      requestedMode: "cruise",
      appliedMode: "nearzero",
      fallbackApplied: true,
      plannerMode: "qi_conservative",
      firstFail: "FordRomanQI",
      constraints: { FordRomanQI: "fail", ThetaAudit: "pass" },
      observerGrid: { overflowCount: 2, paybackGain: 1.25 },
    });

    expect(parsed.observerGrid?.overflowCount).toBe(2);
    expect(parsed.constraints?.FordRomanQI).toBe("fail");
  });
});
