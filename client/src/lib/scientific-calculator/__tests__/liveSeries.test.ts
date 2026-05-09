import { describe, expect, it } from "vitest";
import {
  createPrimeSeriesState,
  isPrimeTrialDivision,
  nextPrimeSeriesTick,
} from "../liveSeries";

describe("scientific calculator live prime series", () => {
  it("uses deterministic trial division", () => {
    expect(isPrimeTrialDivision(2)).toBe(true);
    expect(isPrimeTrialDivision(3)).toBe(true);
    expect(isPrimeTrialDivision(4)).toBe(false);
    expect(isPrimeTrialDivision(29)).toBe(true);
  });

  it("emits deterministic prime stream ticks", () => {
    let state = createPrimeSeriesState({ start: 2 });
    const ticks = [];
    for (let index = 0; index < 6; index += 1) {
      const tick = nextPrimeSeriesTick(state);
      ticks.push(tick);
      state = tick.state;
    }
    expect(ticks.map((tick) => tick.payload.candidate)).toEqual([2, 3, 4, 5, 6, 7]);
    expect(ticks.filter((tick) => tick.event_type === "prime_found").map((tick) => tick.payload.latest_prime)).toEqual([2, 3, 5, 7]);
    expect(state.primeCount).toBe(4);
  });
});
