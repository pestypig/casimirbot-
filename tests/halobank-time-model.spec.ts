import { describe, expect, it } from "vitest";
import { computeHaloBankTimeModel } from "../server/services/halobank/time-model";

describe("halobank time model", () => {
  it("computes deterministic state for same input", () => {
    const input = {
      timestamp: "2025-03-01T12:00:00.000Z",
      place: { lat: 40.7128, lon: -74.006, label: "NYC" },
      durationMs: 60_000,
    };
    const a = computeHaloBankTimeModel(input);
    const b = computeHaloBankTimeModel(input);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    expect(a).toEqual(b);
  });

  it("computes duration-weighted exposure deltas", () => {
    const result = computeHaloBankTimeModel({
      timestamp: "2025-03-01T12:00:00.000Z",
      place: { lat: 0, lon: 0 },
      durationMs: 60_000,
      compare: {
        timestamp: "2025-03-01T12:00:00.000Z",
        place: { lat: 0, lon: 0 },
        durationMs: 120_000,
      },
    });

    expect(result.ok).toBe(true);
    const deltas = result.comparison?.deltas;
    expect(deltas).toBeDefined();
    expect(deltas?.dDuration_s).toBeCloseTo(60, 8);
    expect(deltas?.dGravExposure_ns).toBeCloseTo((result.primary?.voxel.grav_ns_per_1s ?? 0) * 60, 6);
    expect(deltas?.dKinExposure_ns).toBeCloseTo((result.primary?.voxel.kin_ns_per_1s ?? 0) * 60, 6);
    expect(deltas?.dCombExposure_ns).toBeCloseTo((result.primary?.voxel.combined_ns_per_1s ?? 0) * 60, 6);
  });

  it("returns actionable validation when parsing is insufficient", () => {
    const result = computeHaloBankTimeModel({ question: "what are the tides" });
    expect(result.ok).toBe(false);
    expect(result.message?.toLowerCase()).toContain("validation");
  });
});
