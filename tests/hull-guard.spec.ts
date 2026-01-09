import { beforeEach, describe, expect, it } from "vitest";
import { assertHullAllowed, isHullAllowed } from "../server/security/hull-guard";

describe("hull guard", () => {
  beforeEach(() => {
    delete process.env.HULL_MODE;
    delete process.env.HULL_ALLOW_HOSTS;
  });

  it("allows any host when hull mode disabled", () => {
    expect(isHullAllowed("https://example.com")).toBe(true);
    expect(() => assertHullAllowed("https://example.com")).not.toThrow();
  });

  it("blocks non-allowlist host when hull mode enabled", () => {
    process.env.HULL_MODE = "1";
    process.env.HULL_ALLOW_HOSTS = "127.0.0.1,localhost,*.hull";
    expect(isHullAllowed("https://127.0.0.1")).toBe(true);
    expect(isHullAllowed("https://alpha.hull")).toBe(true);
    expect(isHullAllowed("https://api.example.com")).toBe(false);
    expect(() => assertHullAllowed("https://api.example.com")).toThrow(/HULL_MODE/);
    try {
      assertHullAllowed("https://api.example.com");
    } catch (error) {
      const typed = error as { policy?: { reason?: string; capability?: string } };
      expect(typed.policy?.reason).toMatch(/HULL_MODE/);
      expect(typed.policy?.capability).toBe("network_access");
    }
  });
});
