import { describe, expect, it } from "vitest";
import { computeHaloBankTimeModel } from "../server/services/halobank/time-model";

describe("halobank horizons consistency gate", () => {
  it("returns PASS gate with live ephemeris provenance", () => {
    const result = computeHaloBankTimeModel({
      question: "orbital alignment with horizons",
      timestamp: "2025-03-01T12:00:00Z",
      place: { lat: 10, lon: 20 },
      model: { orbitalAlignment: true, ephemerisSource: "live" },
    });

    expect(result.ok).toBe(true);
    expect(result.ephemeris?.consistency.gate).toBe("halobank.horizons.consistency.v1");
    expect(result.ephemeris?.consistency.verdict).toBe("PASS");
    expect(result.ephemeris?.consistency.firstFailId).toBeNull();
    expect(result.ephemeris?.consistency.deterministic).toBe(true);
    expect(result.ephemeris?.provenance.class).toBe("live");
    expect(result.ephemeris?.provenance.claim_tier).toBe("diagnostic");
  });

  it("returns FAIL gate with deterministic firstFail on fallback ephemeris", () => {
    const result = computeHaloBankTimeModel({
      question: "orbital alignment with fallback ephemeris",
      timestamp: "2025-03-01T12:00:00Z",
      place: { lat: 10, lon: 20 },
      model: { orbitalAlignment: true, ephemerisSource: "fallback" },
    });

    expect(result.ok).toBe(true);
    expect(result.ephemeris?.consistency.verdict).toBe("FAIL");
    expect(result.ephemeris?.consistency.firstFailId).toBe("HALOBANK_HORIZONS_FALLBACK_DIAGNOSTIC_ONLY");
    expect(result.ephemeris?.consistency.deterministic).toBe(true);
    expect(result.ephemeris?.provenance.class).toBe("fallback");
    expect(result.ephemeris?.provenance.certifying).toBe(false);
    expect(result.ephemeris?.provenance.note.toLowerCase()).toContain("diagnostic");
  });
});
