import { beforeEach, describe, expect, it } from "vitest";
import { shouldRegisterExternalAdapter } from "../server/security/hull-guard";

describe("hull tool gating", () => {
  beforeEach(() => {
    delete process.env.HULL_MODE;
    delete process.env.HULL_ALLOW_HOSTS;
  });

  it("permits remote adapters when hull mode is off", () => {
    const gate = shouldRegisterExternalAdapter("https://api.example.com");
    expect(gate.allowed).toBe(true);
  });

  it("blocks remote adapters when hull mode is on", () => {
    process.env.HULL_MODE = "1";
    process.env.HULL_ALLOW_HOSTS = "127.0.0.1,localhost";
    const gate = shouldRegisterExternalAdapter("https://api.example.com");
    expect(gate.allowed).toBe(false);
    expect(gate.reason).toBe("blocked");
    const localGate = shouldRegisterExternalAdapter("http://127.0.0.1:8080");
    expect(localGate.allowed).toBe(true);
  });
});
