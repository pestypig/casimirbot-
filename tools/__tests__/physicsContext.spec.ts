import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getTool, registerTool, unregisterTool } from "../../server/skills";
import { buildPhysicsPrompt } from "../physicsContext";

const ORIGINAL_AUDIT_ENABLE = process.env.PHYSICS_AUDIT_ENABLE;
const ORIGINAL_AUDIT_BUDGET = process.env.PHYSICS_AUDIT_BUDGET;
const ORIGINAL_AUDIT_CODE_BUDGET = process.env.PHYSICS_AUDIT_CODE_BUDGET;
const ORIGINAL_AUDIT_CACHE_KEY = process.env.PHYSICS_AUDIT_CACHE_KEY;

const ORIGINAL_TOOLS = {
  http: getTool("llm.http.generate"),
  local: getTool("llm.local.generate"),
  spawn: getTool("llm.local.spawn.generate"),
};

describe("physicsContext prompt assembly", () => {
  beforeEach(() => {
    process.env.PHYSICS_AUDIT_ENABLE = "true";
    process.env.PHYSICS_AUDIT_BUDGET = "800";
    process.env.PHYSICS_AUDIT_CODE_BUDGET = "800";
    process.env.PHYSICS_AUDIT_CACHE_KEY = "";
  });

  afterEach(() => {
    process.env.PHYSICS_AUDIT_ENABLE = ORIGINAL_AUDIT_ENABLE;
    process.env.PHYSICS_AUDIT_BUDGET = ORIGINAL_AUDIT_BUDGET;
    process.env.PHYSICS_AUDIT_CODE_BUDGET = ORIGINAL_AUDIT_CODE_BUDGET;
    process.env.PHYSICS_AUDIT_CACHE_KEY = ORIGINAL_AUDIT_CACHE_KEY;

    if (ORIGINAL_TOOLS.http) {
      registerTool(ORIGINAL_TOOLS.http);
    } else {
      unregisterTool("llm.http.generate");
    }
    if (ORIGINAL_TOOLS.local) {
      registerTool(ORIGINAL_TOOLS.local);
    } else {
      unregisterTool("llm.local.generate");
    }
    if (ORIGINAL_TOOLS.spawn) {
      registerTool(ORIGINAL_TOOLS.spawn);
    } else {
      unregisterTool("llm.local.spawn.generate");
    }
  });

  it("keeps anchor slices and citations even when audit is enabled", async () => {
    const assembled = await buildPhysicsPrompt("Casimir tile gamma");
    expect(assembled.contextBlocks.length).toBeGreaterThan(0);
    const first = assembled.contextBlocks[0];
    expect(first.sourcePath).toBeTruthy();
    expect(first.startLine).toBeGreaterThan(0);
    expect(Object.keys(assembled.citationHints)).toContain(first.id);

    expect(assembled.auditMeta?.enabled).toBe(true);
    expect(assembled.auditBlocks).toBeDefined();
  });

  it("uses llm audit when a tool is registered and caches per subject", async () => {
    process.env.PHYSICS_AUDIT_CACHE_KEY = "test-hash";
    let calls = 0;
    registerTool({
      name: "llm.http.generate",
      desc: "stub",
      deterministic: false,
      rateLimit: { rpm: 60 },
      safety: { risks: [] },
      handler: async () => {
        calls += 1;
        return {
          text: JSON.stringify({
            audit: ["Subject audit note"],
            formula: ["Key formula note"],
            env: ["Environment assumptions"],
            safety: ["Safety rails"],
          }),
        };
      },
    } as any);

    const first = await buildPhysicsPrompt("Casimir tile gamma");
    expect(first.auditBlocks?.some((b) => b.kind === "formula")).toBe(true);
    expect(first.auditMeta?.mode).toBe("llm");
    const firstCalls = calls;

    const second = await buildPhysicsPrompt("Casimir tile gamma");
    expect(calls).toBe(firstCalls);
    expect(second.auditMeta?.cached).toBe(true);
    expect(second.auditMeta?.cacheKey).toContain("casimir tile gamma:test-hash");
  });
});
