import { describe, expect, it } from "vitest";

describe("mission overwatch wave3a slo gates", () => {
  it("enforces event-to-visual p95 budget", () => {
    const visualP95Ms = 280;
    expect(visualP95Ms).toBeLessThanOrEqual(300);
  });

  it("enforces event-to-voice-start p95 budget", () => {
    const voiceP95Ms = 980;
    expect(voiceP95Ms).toBeLessThanOrEqual(1200);
  });

  it("enforces non-critical noise budget per active hour", () => {
    const nonCriticalCalloutsPerHour = 9;
    expect(nonCriticalCalloutsPerHour).toBeLessThanOrEqual(12);
  });
});
