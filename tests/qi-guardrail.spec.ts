import { beforeEach, describe, expect, test, vi } from "vitest";

const tileTelemetry = { avgNeg: null as number | null, source: null as string | null, updatedAt: 0 };
vi.mock("../server/qi/pipeline-qi-stream.js", () => ({
  updatePipelineQiTiles: vi.fn(),
  getLatestQiTileStats: () => tileTelemetry,
}));

import { evaluateQiGuardrail, deriveQiStatus, type EnergyPipelineState } from "../server/energy-pipeline";
import type { PhaseSchedule } from "../server/energy/phase-scheduler.js";
import type { PhaseScheduleTelemetry } from "../shared/schema";

const baseState: EnergyPipelineState = {
  tileArea_cm2: 1,
  shipRadius_m: 1,
  gap_nm: 1,
  sag_nm: 0,
  temperature_K: 300,
  modulationFreq_GHz: 1,
  currentMode: "hover",
  dutyCycle: 0,
  dutyShip: 0,
  sectorCount: 1,
  concurrentSectors: 1,
  sectorStrobing: 1,
  qSpoilingFactor: 1,
  negativeFraction: 1,
  gammaGeo: 1,
  qMechanical: 1,
  qCavity: 1,
  gammaVanDenBroeck: 1,
  exoticMassTarget_kg: 1,
  U_static: 0,
  U_geo: 0,
  U_Q: 0,
  U_cycle: 0,
  P_loss_raw: 0,
  P_avg: 0,
  M_exotic: 0,
  M_exotic_raw: 0,
  massCalibration: 1,
  TS_ratio: 1,
  zeta: 0,
  N_tiles: 1,
  tilesPerSector: 1,
  activeSectors: 1,
  activeTiles: 1,
  activeFraction: 1,
  fordRomanCompliance: true,
  natarioConstraint: true,
  curvatureLimit: true,
  overallStatus: "NOMINAL",
};

const makeState = (overrides: Partial<EnergyPipelineState> = {}): EnergyPipelineState => ({
  ...baseState,
  ...overrides,
});

const makeSchedule = (
  N: number,
  negSectors: number[],
  sectorPeriod_ms: number,
  tau_ms: number,
): PhaseScheduleTelemetry => ({
  N,
  sectorPeriod_ms,
  phase01: 0,
  phi_deg_by_sector: Array.from({ length: N }, () => 0),
  negSectors,
  posSectors: [],
  sampler: "gaussian",
  tau_s_ms: tau_ms,
  weights: Array.from({ length: N }, () => 1),
});

beforeEach(() => {
  tileTelemetry.avgNeg = null;
  tileTelemetry.source = null;
  process.env.QI_TILE_TELEMETRY_SCALE = undefined;
});

describe("evaluateQiGuardrail", () => {
  test("returns lhs ~ effective rho when the mask is fully on", () => {
    const dutyCycle = 5.64;
    const sectorPeriod_ms = 1;
    const tau_ms = 1;
    const schedule = makeSchedule(1, [0], sectorPeriod_ms, tau_ms);
    const scheduleGuard: PhaseSchedule = {
      phi_deg_by_sector: schedule.phi_deg_by_sector,
      negSectors: schedule.negSectors,
      posSectors: schedule.posSectors,
      weights: schedule.weights ?? Array.from({ length: schedule.N }, () => 1),
    };

    const guard = evaluateQiGuardrail(
      makeState({
        dutyCycle,
        dutyShip: dutyCycle,
        dutyEffective_FR: dutyCycle,
        sectorCount: 1,
        concurrentSectors: 1,
        sectorStrobing: 1,
        negativeFraction: 1,
        phaseSchedule: schedule,
      }),
      { schedule: scheduleGuard, sectorPeriod_ms, tau_ms },
    );

    expect(guard.effectiveRho).toBeCloseTo(-Math.abs(dutyCycle), 9);
    expect(guard.lhs_Jm3).toBeCloseTo(guard.effectiveRho, 9);
  });

  test("duty-weighted masks still integrate back to effective rho", () => {
    const dutyCycle = 12.3;
    const sectorPeriod_ms = 1;
    const tau_ms = 2;
    const schedule = makeSchedule(4, [0, 2], sectorPeriod_ms, tau_ms);
    const scheduleGuard: PhaseSchedule = {
      phi_deg_by_sector: schedule.phi_deg_by_sector,
      negSectors: schedule.negSectors,
      posSectors: schedule.posSectors,
      weights: schedule.weights ?? Array.from({ length: schedule.N }, () => 1),
    };

    const guard = evaluateQiGuardrail(
      makeState({
        dutyCycle,
        dutyShip: dutyCycle,
        dutyEffective_FR: dutyCycle,
        sectorCount: 4,
        concurrentSectors: 1,
        sectorStrobing: 1,
        negativeFraction: 0.5,
        phaseSchedule: schedule,
      }),
      { schedule: scheduleGuard, sectorPeriod_ms, tau_ms },
    );

    expect(guard.patternDuty).toBeCloseTo(0.5, 6);
    expect(guard.rhoOn).toBeCloseTo(guard.effectiveRho / guard.patternDuty, 6);
    expect(guard.lhs_Jm3).toBeCloseTo(guard.effectiveRho, 3);
  });

  test("scales tile telemetry before integrating the guard window", () => {
    const scale = 0.03095;
    const prev = process.env.QI_TILE_TELEMETRY_SCALE;
    process.env.QI_TILE_TELEMETRY_SCALE = String(scale);
    tileTelemetry.avgNeg = -522.99;
    tileTelemetry.source = "controller";
    const sectorPeriod_ms = 1;
    const tau_ms = 1;
    const schedule = makeSchedule(1, [0], sectorPeriod_ms, tau_ms);
    const scheduleGuard: PhaseSchedule = {
      phi_deg_by_sector: schedule.phi_deg_by_sector,
      negSectors: schedule.negSectors,
      posSectors: schedule.posSectors,
      weights: schedule.weights ?? Array.from({ length: schedule.N }, () => 1),
    };

    const guard = evaluateQiGuardrail(
      makeState({
        dutyCycle: 0,
        dutyShip: 0,
        dutyEffective_FR: 0,
        sectorCount: 1,
        concurrentSectors: 1,
        sectorStrobing: 1,
        negativeFraction: 1,
        phaseSchedule: schedule,
      }),
      { schedule: scheduleGuard, sectorPeriod_ms, tau_ms },
    );

    if (tileTelemetry.avgNeg == null) throw new Error("tile telemetry not set");
    const expected = tileTelemetry.avgNeg * scale;
    expect(guard.effectiveRho).toBeCloseTo(expected, 6);
    expect(guard.lhs_Jm3).toBeCloseTo(expected, 6);
    expect(guard.rhoSource).toBe("tile-telemetry");
    process.env.QI_TILE_TELEMETRY_SCALE = prev;
  });
});

describe("deriveQiStatus", () => {
  test("uses raw zeta for compliance when policy clamp is more lenient", () => {
    const result = deriveQiStatus({
      zetaRaw: 2,
      zetaClamped: 0.5,
      pAvg: 0,
      pWarn: 1,
      mode: "hover",
    });

    expect(result.zetaForStatus).toBeCloseTo(2);
    expect(result.compliance).toBe(false);
    expect(result.overallStatus).toBe("CRITICAL");
  });

  test("falls back to clamped zeta and suppresses power warning in emergency mode", () => {
    const result = deriveQiStatus({
      zetaRaw: undefined,
      zetaClamped: 0.5,
      pAvg: 10,
      pWarn: 1,
      mode: "emergency",
    });

    expect(result.zetaForStatus).toBeCloseTo(0.5);
    expect(result.compliance).toBe(true);
    expect(result.overallStatus).toBe("NOMINAL");
  });

  test("derives color thresholds from raw zeta without policy clamps", () => {
    const red = deriveQiStatus({
      zetaRaw: 1.2,
      zetaClamped: 0.8,
      pAvg: 0,
      pWarn: 1,
      mode: "hover",
    }).color;

    const amber = deriveQiStatus({
      zetaRaw: undefined,
      zetaClamped: 0.96,
      pAvg: 0,
      pWarn: 1,
      mode: "hover",
    }).color;

    const green = deriveQiStatus({
      zetaRaw: 0.4,
      zetaClamped: 0.4,
      pAvg: 0,
      pWarn: 1,
      mode: "hover",
    }).color;

    const muted = deriveQiStatus({
      zetaRaw: undefined,
      zetaClamped: undefined,
      pAvg: undefined,
      pWarn: undefined,
      mode: "hover",
    }).color;

    expect(red).toBe("red");
    expect(amber).toBe("amber");
    expect(green).toBe("green");
    expect(muted).toBe("muted");
  });
});
