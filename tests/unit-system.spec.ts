import { describe, expect, it } from "vitest";
import { CurvatureUnitInput } from "../shared/essence-physics";
import { SI_UNITS } from "../shared/unit-system";

describe("unit system: SI lock", () => {
  it("defaults CurvatureUnitInput.units to SI and normalizes legacy field names", () => {
    const parsed = CurvatureUnitInput.parse({
      grid: { nx: 4, ny: 3, dx: 0.5, dy: 0.25, thickness_m: 2 },
      sources: [{ x: 0, y: 0.1, sigma: 0.2, peak_u: 42 }],
    });

    expect(parsed.units).toEqual(SI_UNITS);
    expect(parsed.grid.dx_m).toBeCloseTo(0.5, 12);
    expect(parsed.grid.dy_m).toBeCloseTo(0.25, 12);
    expect(parsed.sources[0].x_m).toBeCloseTo(0, 12);
    expect(parsed.sources[0].sigma_m).toBeCloseTo(0.2, 12);
    expect(parsed.sources[0].peak_u_Jm3).toBeCloseTo(42, 12);
  });

  it("rejects non-SI unit overrides", () => {
    expect(() =>
      CurvatureUnitInput.parse({
        units: { ...SI_UNITS, length: "cm" },
        grid: { nx: 4, ny: 3, dx_m: 0.5, dy_m: 0.25, thickness_m: 2 },
        sources: [{ x_m: 0, y_m: 0.1, sigma_m: 0.2, peak_u_Jm3: 42 }],
      }),
    ).toThrow();
  });
});

