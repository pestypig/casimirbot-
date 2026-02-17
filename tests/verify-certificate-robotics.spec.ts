import { describe, expect, it } from "vitest";
import { verifyRoboticsSafetyCertificateIntegrity } from "../tools/verifyCertificate";

describe("robotics safety certificate integrity", () => {
  it("validates certificate hash for robotics safety payload", () => {
    const cert = {
      mode: "robotics-safety-v1" as const,
      checks: [
        { id: "collision.margin", pass: true, value: 0.1, limit: ">= 0.05", severity: "HARD" as const },
      ],
      certificateHash: "0b35fe1487d6d369b7abb3b46409951d294d174d31e396502a3e4ee011d5196b",
    };
    expect(verifyRoboticsSafetyCertificateIntegrity(cert)).toBe(true);
  });
});
