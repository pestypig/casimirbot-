import { beforeAll, describe, expect, it } from "vitest";
import { resetDbClient } from "../server/db/client";
import { curvatureUnitHandler } from "../server/skills/physics.curvature";

describe("CurvatureUnit invariants", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = "pg-mem://theory-conservation";
    await resetDbClient();
  });

  it("preserves mass equivalence and small Poisson residuals", async () => {
    const result = (await curvatureUnitHandler(
      {
        grid: { nx: 64, ny: 64, dx: 0.02, dy: 0.02, thickness_m: 1 },
        sources: [
          { x: -0.2, y: 0, sigma: 0.05, peak_u: 1_000 },
          { x: 0.2, y: 0, sigma: 0.05, peak_u: 1_000 },
        ],
        constants: { c: 299_792_458, G: 6.6743e-11 },
      },
      { personaId: "persona:test" },
    )) as any;

    expect(result.summary.total_energy_J).toBeGreaterThan(0);
    expect(result.summary.mass_equivalent_kg).toBeGreaterThan(0);
    expect(result.summary.residual_rms).toBeLessThan(1e-6);
    expect(result.summary.vector_roots.length).toBeGreaterThan(0);
  });
});
