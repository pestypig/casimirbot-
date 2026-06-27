import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  createAskTurnActionArgBoundaryTrimmer,
  trimAskTurnProtectedTitleArgBoundaries,
} from "../services/helix-ask/note-arg-boundaries";

const repoRoot = process.cwd();
const routePath = join(repoRoot, "server/routes/agi.plan.ts");
const servicePath = join(repoRoot, "server/services/helix-ask/note-arg-boundaries.ts");

describe("Helix Ask note arg boundary extraction boundary", () => {
  it("keeps note arg boundary trimming out of agi.plan.ts", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain("../services/helix-ask/note-arg-boundaries");
    expect(routeSource).toContain("createAskTurnActionArgBoundaryTrimmer({");
    expect(routeSource).not.toMatch(/const\s+trimAskTurnActionArgBoundaries\s*=\s*\(value/);
    expect(routeSource).not.toMatch(/const\s+trimAskTurnProtectedTitleArgBoundaries\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+createAskTurnActionArgBoundaryTrimmer\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+trimAskTurnProtectedTitleArgBoundaries\s*=/);
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../routes/agi.plan");
  });

  it("preserves bounded and unbounded trim behavior", () => {
    const boundedTrim = createAskTurnActionArgBoundaryTrimmer({ isBoundedNoteArgsEnabled: () => true });
    const unboundedTrim = createAskTurnActionArgBoundaryTrimmer({ isBoundedNoteArgsEnabled: () => false });

    expect(boundedTrim('"field notes, then summarize the doc."')).toBe("field notes");
    expect(boundedTrim("field notes explain later")).toBe("field notes");
    expect(unboundedTrim('"field notes, then summarize the doc."')).toBe("field notes, then summarize the doc");
    expect(trimAskTurnProtectedTitleArgBoundaries('"field notes, then open docs."')).toBe("field notes");
  });
});
