import { describe, expect, it } from "vitest";
import { analyzeNhm2PhaseTopology } from "../server/energy/phase-topology.ts";
import { smoothSectorPhaseAngles } from "../server/energy/phase-scheduler.ts";

const makeSchedule = (phi_deg_by_sector: number[], overrides: Record<string, unknown> = {}) => ({
  N: phi_deg_by_sector.length,
  sectorPeriod_ms: 10,
  phase01: 0,
  phi_deg_by_sector,
  negSectors: [0],
  posSectors: [Math.max(0, phi_deg_by_sector.length - 1)],
  sampler: "gaussian",
  tau_s_ms: 2,
  weights: new Array(phi_deg_by_sector.length).fill(1),
  ...overrides,
});

const hull = {
  Lx_m: 2,
  Ly_m: 2,
  Lz_m: 2,
};

describe("NHM2 phase topology audit", () => {
  it("does not mutate QI, metric T00, or phase schedule source fields", () => {
    const schedule = makeSchedule(new Array(16).fill(45));
    const state = {
      qiGuardrail: { status: "ok", marginRatio: 0.1 },
      warp: { metricT00: -1.23 },
      phaseSchedule: structuredClone(schedule),
    };
    const before = structuredClone(state);

    const result = analyzeNhm2PhaseTopology({ schedule, hull, nowMs: 1000 });

    expect(result.artifact.claimScope).toBe("strobe_pattern_diagnostic_not_metric_source");
    expect(state.qiGuardrail).toEqual(before.qiGuardrail);
    expect(state.warp.metricT00).toEqual(before.warp.metricT00);
    expect(state.phaseSchedule).toEqual(before.phaseSchedule);
  });

  it("flags hard sector phase seams", () => {
    const schedule = makeSchedule(
      Array.from({ length: 24 }, (_, index) => (index % 2 === 0 ? 0 : 180)),
    );
    const result = analyzeNhm2PhaseTopology({ schedule, hull, nowMs: 1000 });

    expect(result.artifact.reasonCodes).toContain("hard_phase_seam_review");
    expect(["review", "fail"]).toContain(result.artifact.status);
  });

  it("labels superluminal sector-front speed as pattern-only", () => {
    const schedule = makeSchedule(new Array(16).fill(45), {
      sectorPeriod_ms: 1e-9,
    });
    const result = analyzeNhm2PhaseTopology({ schedule, hull, nowMs: 1000 });

    expect(result.artifact.velocities.superluminalPatternObserved).toBe(true);
    expect(result.artifact.velocities.transportInterpretation)
      .toBe("pattern_only_no_energy_or_signal_claim");
    expect(result.artifact.status).not.toBe("fail");
  });

  it("smoothing reduces maximum seam jump", () => {
    const raw = makeSchedule(
      Array.from({ length: 24 }, (_, index) => (index % 2 === 0 ? 0 : 180)),
    );
    const smooth = {
      ...raw,
      phi_deg_by_sector: smoothSectorPhaseAngles(raw.phi_deg_by_sector, 2),
    };

    const a = analyzeNhm2PhaseTopology({ schedule: raw, hull, nowMs: 1000 });
    const b = analyzeNhm2PhaseTopology({ schedule: smooth, hull, nowMs: 1000 });

    expect(b.artifact.defects.maxSeamJump_rad)
      .toBeLessThan(a.artifact.defects.maxSeamJump_rad);
  });
});
