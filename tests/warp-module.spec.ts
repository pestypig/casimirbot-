import { describe, expect, it } from "vitest";
import { resolveDutyEff } from "../modules/warp/warp-module";
import type { SimulationParameters } from "../shared/schema";

const makeParams = (
  dynamicConfig: Partial<SimulationParameters["dynamicConfig"]> = {},
  extras: Record<string, unknown> = {},
): SimulationParameters =>
  ({
    dynamicConfig,
    ...extras,
  } as SimulationParameters);

describe("resolveDutyEff", () => {
  it("returns pipeline dutyEffectiveFR when provided", () => {
    const params = makeParams({ sectorCount: 8 }, { dutyEffectiveFR: 0.4 });
    expect(resolveDutyEff(params)).toBeCloseTo(0.4);
  });

  it("converts burst/dwell timing to FR duty", () => {
    const params = makeParams({ burstLengthUs: 10, cycleLengthUs: 100, sectorCount: 5 });
    expect(resolveDutyEff(params)).toBeCloseTo(0.02);
  });

  it("divides sectorDuty by sector count when above FR threshold", () => {
    const params = makeParams({ sectorDuty: 0.05, sectorCount: 4 });
    expect(resolveDutyEff(params)).toBeCloseTo(0.0125);
  });

  it("treats very small sectorDuty as already FR", () => {
    const params = makeParams({ sectorDuty: 0.001, sectorCount: 20 });
    expect(resolveDutyEff(params)).toBeCloseTo(0.001);
  });
});
