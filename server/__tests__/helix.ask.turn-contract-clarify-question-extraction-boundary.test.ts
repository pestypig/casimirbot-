import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildHelixAskTurnContractClarifyQuestion } from "../services/helix-ask/contracts/turn-contract-clarify-question";

const repoRoot = process.cwd();
const routePath = join(repoRoot, "server/routes/agi.plan.ts");
const servicePath = join(repoRoot, "server/services/helix-ask/contracts/turn-contract-clarify-question.ts");

describe("Helix Ask turn-contract clarify-question extraction boundary", () => {
  it("keeps clarify-question assembly out of agi.plan.ts", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain("../services/helix-ask/contracts/turn-contract-clarify-question");
    expect(routeSource).not.toContain("Which objective should be pinned to explicit repo anchors first?");
    expect(serviceSource).toMatch(/export\s+const\s+buildHelixAskTurnContractClarifyQuestion\s*=/);
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../../../routes/agi.plan");
    expect(serviceSource).not.toContain("../../routes/agi.plan");
    expect(serviceSource).not.toContain("../routes/agi.plan");
  });

  it("preserves planner clarify question precedence and normalization", () => {
    expect(
      buildHelixAskTurnContractClarifyQuestion({
        plannerClarifyQuestion: "  **Which source first?**  ",
        requiresRepoEvidence: true,
        objectiveCount: 4,
        explicitAnchorPathCount: 0,
      }),
    ).toBe("Which source first?");
  });

  it("preserves repo-anchor fallback condition", () => {
    expect(
      buildHelixAskTurnContractClarifyQuestion({
        plannerClarifyQuestion: "",
        requiresRepoEvidence: true,
        objectiveCount: 3,
        explicitAnchorPathCount: 0,
      }),
    ).toBe("Which objective should be pinned to explicit repo anchors first?");

    expect(
      buildHelixAskTurnContractClarifyQuestion({
        plannerClarifyQuestion: "",
        requiresRepoEvidence: true,
        objectiveCount: 3,
        explicitAnchorPathCount: 1,
      }),
    ).toBe("");
  });
});
