import { describe, expect, it } from "vitest";
import {
  verifyPhysicsCertificate,
  verifyRoboticsSafetyCertificate,
} from "../tools/verifyCertificate";

describe("certificate authenticity ladder", () => {
  it("keeps low-consequence verification integrity-only by default", () => {
    const result = verifyRoboticsSafetyCertificate({
      mode: "robotics-safety-v1",
      checks: [
        { id: "collision.margin", pass: true, value: 0.1, limit: ">= 0.05", severity: "HARD" },
      ],
      certificateHash: "0b35fe1487d6d369b7abb3b46409951d294d174d31e396502a3e4ee011d5196b",
    });

    expect(result.integrity.ok).toBe(true);
    expect(result.authenticity.consequence).toBe("low");
    expect(result.authenticity.enforced).toBe(false);
    expect(result.authenticity.ok).toBe(true);
  });

  it("enforces authenticity for high-consequence verification", () => {
    const result = verifyRoboticsSafetyCertificate(
      {
        mode: "robotics-safety-v1",
        checks: [
          { id: "collision.margin", pass: true, value: 0.1, limit: ">= 0.05", severity: "HARD" },
        ],
        certificateHash: "0b35fe1487d6d369b7abb3b46409951d294d174d31e396502a3e4ee011d5196b",
      },
      {
        authenticityConsequence: "high",
      },
    );

    expect(result.integrity.ok).toBe(true);
    expect(result.authenticity.consequence).toBe("high");
    expect(result.authenticity.enforced).toBe(true);
    expect(result.authenticity.ok).toBe(false);
    expect(result.authenticity.reasonCodes).toContain("signature_missing");
  });

  it("allows medium consequence to stay non-enforced unless required", () => {
    const cert = {
      header: {
        id: "c1",
        kind: "warp-viability" as const,
        issuedAt: new Date(0).toISOString(),
        issuer: "test",
      },
      payload: { a: 1 },
      payloadHash: "015abd7f5cc57a2dd94b7590f04ad8084273905ee33ec5cebeae62276a97f862",
    };
    const result = verifyPhysicsCertificate(cert, { authenticityConsequence: "medium" });

    expect(result.integrity.ok).toBe(true);
    expect(result.authenticity.consequence).toBe("medium");
    expect(result.authenticity.enforced).toBe(false);
    expect(result.authenticity.ok).toBe(true);
  });
});
