import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  createAskTurnActionArgBoundaryTrimmer,
  isAskTurnDeicticNoteLabel,
  isAskTurnDeicticNoteTarget,
  isAskTurnInvalidResolvedNoteTitle,
  resolveAskTurnTextArg,
  resolveAskTurnTitleArg,
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
    expect(routeSource).not.toMatch(/const\s+resolveAskTurnTextArg\s*=\s*\(transcript/);
    expect(routeSource).not.toMatch(/const\s+resolveAskTurnTitleArg\s*=\s*\(transcript/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnDeicticNoteLabel\s*=/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnDeicticNoteTarget\s*=/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnInvalidResolvedNoteTitle\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+createAskTurnActionArgBoundaryTrimmer\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+trimAskTurnProtectedTitleArgBoundaries\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+resolveAskTurnTextArg\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+resolveAskTurnTitleArg\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+isAskTurnDeicticNoteLabel\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+isAskTurnDeicticNoteTarget\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+isAskTurnInvalidResolvedNoteTitle\s*=/);
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

  it("preserves basic text and title argument readers", () => {
    expect(resolveAskTurnTextArg("write this: alpha beta")).toBe("alpha beta");
    expect(resolveAskTurnTextArg('write "quoted text"')).toBe("quoted text");
    expect(resolveAskTurnTextArg("write without explicit content")).toBeNull();
    expect(resolveAskTurnTitleArg('create note "Field Notes, then read docs"')).toBe("Field Notes");
    expect(resolveAskTurnTitleArg("create note called Field Notes, then read docs")).toBe("Field Notes");
    expect(resolveAskTurnTitleArg("create note Field Notes, then read docs")).toBe("Field Notes");
  });

  it("preserves deictic and invalid note title predicates", () => {
    expect(isAskTurnDeicticNoteLabel("this note")).toBe(true);
    expect(isAskTurnDeicticNoteTarget("the note I just created")).toBe(true);
    expect(isAskTurnDeicticNoteTarget("Field Notes")).toBe(false);
    expect(isAskTurnInvalidResolvedNoteTitle("and then compare")).toBe(true);
    expect(isAskTurnInvalidResolvedNoteTitle("Field Notes")).toBe(false);
  });
});
