import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildPhysicsPrompt } from "../physicsContext";

const ORIGINAL_AUDIT_ENABLE = process.env.PHYSICS_AUDIT_ENABLE;
const ORIGINAL_AUDIT_BUDGET = process.env.PHYSICS_AUDIT_BUDGET;
const ORIGINAL_AUDIT_CODE_BUDGET = process.env.PHYSICS_AUDIT_CODE_BUDGET;

describe("physicsContext prompt assembly", () => {
  beforeEach(() => {
    process.env.PHYSICS_AUDIT_ENABLE = "true";
    process.env.PHYSICS_AUDIT_BUDGET = "800";
    process.env.PHYSICS_AUDIT_CODE_BUDGET = "800";
  });

  afterEach(() => {
    process.env.PHYSICS_AUDIT_ENABLE = ORIGINAL_AUDIT_ENABLE;
    process.env.PHYSICS_AUDIT_BUDGET = ORIGINAL_AUDIT_BUDGET;
    process.env.PHYSICS_AUDIT_CODE_BUDGET = ORIGINAL_AUDIT_CODE_BUDGET;
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
});
