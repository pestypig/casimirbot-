import { describe, expect, it } from "vitest";
import { resolveRuntimeToolPolicy } from "../server/services/runtime/tool-policy";

describe("runtime tool policy", () => {
  it("merges tool metadata with profile timeout overrides", () => {
    const policy = resolveRuntimeToolPolicy("repo.search");
    expect(policy).toBeTruthy();
    expect(policy?.lane).toBe("io");
    expect(policy?.hardTimeoutMs).toBe(900);
  });

  it("accepts underscore profile aliases", () => {
    const policy = resolveRuntimeToolPolicy("tts.local");
    expect(policy).toBeTruthy();
    expect(policy?.hardTimeoutMs).toBe(650);
  });

  it("returns null for unknown tool", () => {
    expect(resolveRuntimeToolPolicy("missing.tool")).toBeNull();
  });
});
