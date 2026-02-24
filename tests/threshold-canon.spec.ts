import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  WARP_TS_RATIO_MIN,
  WARP_TS_RATIO_MIN_LABEL,
  WARP_TS_REGIME_LABEL,
  evaluateTsRatioGate,
  computeClocking,
} from "../shared/clocking";

describe("threshold canon", () => {
  it("keeps TS ratio minimum aligned across WARP_AGENTS and runtime gates", () => {
    const warpAgents = fs.readFileSync(path.resolve(process.cwd(), "WARP_AGENTS.md"), "utf8");
    const m = warpAgents.match(/TS_ratio\s*>=\s*([0-9.]+)/);
    expect(m).toBeTruthy();
    expect(warpAgents).toContain("Canonical minimum TS_ratio gate for operational timing proxy semantics");
    const specMin = Number(m?.[1]);
    expect(specMin).toBe(WARP_TS_RATIO_MIN);
    expect(evaluateTsRatioGate(specMin - 1e-6, WARP_TS_RATIO_MIN).pass).toBe(false);
    expect(evaluateTsRatioGate(specMin, WARP_TS_RATIO_MIN).pass).toBe(true);
    expect(evaluateTsRatioGate(specMin, WARP_TS_RATIO_MIN).detail).toContain(WARP_TS_RATIO_MIN_LABEL);
  });

  it("keeps TS operational regime semantics distinct from gate minimum semantics", () => {
    const clocking = computeClocking({ tauLC_ms: 10, burst_ms: 1 });
    expect(clocking.detail).toContain("borderline averaging");
    expect(WARP_TS_REGIME_LABEL).toBe("operational_regime_proxy");
  });
});
