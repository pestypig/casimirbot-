import { describe, expect, it } from "vitest";
import { runSolarGuardrails } from "../server/services/essence/solar-guardrails";

describe("solar guardrails", () => {
  it("passes for nominal photospheric ranges", () => {
    const report = runSolarGuardrails(
      {
        density_kg_m3: 5e-6,
        pressure_Pa: 5e4,
        scale_height_km: 150,
        opacity_regime: "H-",
      },
      { configVersion: "v1", generatedAtIso: "2026-01-17T00:00:00.000Z" },
    );

    expect(report.summary.hard_fail_count).toBe(0);
    expect(report.summary.soft_fail_count).toBe(0);
    expect(report.summary.unknown_count).toBe(0);
    expect(report.summary.requires_followup).toBe(false);
  });

  it("flags out-of-range values and followups", () => {
    const report = runSolarGuardrails(
      {
        density_kg_m3: 1e-2,
        pressure_Pa: null,
        scale_height_km: 30,
        opacity_regime: "metal",
      },
      { configVersion: "v1", generatedAtIso: "2026-01-17T00:00:00.000Z" },
    );

    const byId = new Map(report.checks.map((check) => [check.id, check]));
    expect(byId.get("density_kg_m3")?.status).toBe("fail");
    expect(byId.get("density_kg_m3")?.severity).toBe("hard");
    expect(byId.get("density_kg_m3")?.required_followups?.length).toBeGreaterThan(0);
    expect(byId.get("pressure_Pa")?.status).toBe("unknown");
    expect(byId.get("scale_height_km")?.status).toBe("fail");
    expect(byId.get("opacity_regime")?.status).toBe("fail");

    expect(report.summary.hard_fail_count).toBeGreaterThan(0);
    expect(report.summary.requires_followup).toBe(true);
  });
});
