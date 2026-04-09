import { describe, expect, it } from "vitest";
import { resolveBenchmarkTarget } from "../server/modules/starsim/benchmark-targets";

describe("star-sim benchmark target matching", () => {
  it("matches supported benchmark target deterministically by Gaia identifier", () => {
    const target = resolveBenchmarkTarget({
      request: {
        target: { name: "Any" },
      } as any,
      identifiersResolved: { gaia_dr3_source_id: "123456789012345678" },
    });
    expect(target?.id).toBe("demo_solar_a");
  });

  it("does not infer unsupported target membership", () => {
    const target = resolveBenchmarkTarget({
      request: {
        target: { name: "Random Star" },
      } as any,
      identifiersResolved: { gaia_dr3_source_id: "000000000000000001" },
    });
    expect(target).toBeNull();
  });
});
