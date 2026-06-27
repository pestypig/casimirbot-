import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  createShouldUseAskTurnDeicticWorkspaceContext,
  isAskTurnDocContextMutatingAction,
  isAskTurnDocContextPreservingAction,
  resolveAskTurnReasoningContextMode,
} from "../services/helix-ask/workspace-context-predicates";

const repoRoot = process.cwd();
const routePath = join(repoRoot, "server/routes/agi.plan.ts");
const servicePath = join(repoRoot, "server/services/helix-ask/workspace-context-predicates.ts");

describe("Helix Ask workspace context predicates extraction boundary", () => {
  it("keeps workspace context predicates out of agi.plan.ts", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain("../services/helix-ask/workspace-context-predicates");
    expect(routeSource).toContain("createShouldUseAskTurnDeicticWorkspaceContext({");
    expect(routeSource).not.toMatch(/const\s+resolveAskTurnReasoningContextMode\s*=\s*\(/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnDocContextMutatingAction\s*=/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnDocContextPreservingAction\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+resolveAskTurnReasoningContextMode\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+createShouldUseAskTurnDeicticWorkspaceContext\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+isAskTurnDocContextMutatingAction\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+isAskTurnDocContextPreservingAction\s*=/);
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../routes/agi.plan");
  });

  it("preserves reasoning mode and doc-context predicates", () => {
    expect(resolveAskTurnReasoningContextMode("isolated")).toBe("isolated");
    expect(resolveAskTurnReasoningContextMode("attached")).toBe("attached");
    expect(resolveAskTurnReasoningContextMode("anything")).toBe("attached");
    expect(isAskTurnDocContextMutatingAction({ panel_id: "docs-viewer", action_id: "open_doc_by_path" })).toBe(true);
    expect(isAskTurnDocContextMutatingAction({ panel_id: "docs-viewer", action_id: "search_docs" })).toBe(false);
    expect(isAskTurnDocContextPreservingAction({ panel_id: "docs-viewer", action_id: "locate_in_doc" })).toBe(true);
    expect(isAskTurnDocContextPreservingAction({ panel_id: "repo-code", action_id: "locate_in_doc" })).toBe(false);
  });

  it("preserves deictic workspace context flag behavior", () => {
    const fixed = createShouldUseAskTurnDeicticWorkspaceContext({ isDeicticDocFixEnabled: () => true });
    const legacy = createShouldUseAskTurnDeicticWorkspaceContext({ isDeicticDocFixEnabled: () => false });

    expect(fixed("Where in this document does it say that?")).toBe(true);
    expect(legacy("Where in this document does it say that?")).toBe(false);
    expect(fixed("Read this")).toBe(true);
    expect(legacy("Read this")).toBe(true);
  });
});
