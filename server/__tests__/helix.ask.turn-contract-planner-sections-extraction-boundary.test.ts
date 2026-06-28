import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildHelixAskTurnContractPlannerSections } from "../services/helix-ask/contracts/turn-contract-planner-sections";

const repoRoot = process.cwd();
const routePath = join(repoRoot, "server/routes/agi.plan.ts");
const servicePath = join(repoRoot, "server/services/helix-ask/contracts/turn-contract-planner-sections.ts");

describe("Helix Ask turn-contract planner-sections extraction boundary", () => {
  it("keeps planner-section normalization out of agi.plan.ts", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain("../services/helix-ask/contracts/turn-contract-planner-sections");
    expect(routeSource).not.toContain("const plannerSections = plannerSectionSource.map((section) => ({");
    expect(serviceSource).toMatch(/export\s+const\s+buildHelixAskTurnContractPlannerSections\s*=/);
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../../../routes/agi.plan");
    expect(serviceSource).not.toContain("../../routes/agi.plan");
    expect(serviceSource).not.toContain("../routes/agi.plan");
  });

  it("preserves planner-section defaults and normalization", () => {
    expect(
      buildHelixAskTurnContractPlannerSections([
        {
          title: "Evidence",
          required: undefined,
          must_answer: ["cover it"],
          required_slots: [" code path "],
          preferred_evidence: ["code", "bogus"],
          kind: "repo",
        },
        {
          required: false,
          preferred_evidence: ["doc"],
          kind: "unknown",
        },
      ]),
    ).toEqual([
      {
        id: "Evidence",
        title: "Evidence",
        required: true,
        must_answer: ["cover it"],
        required_slots: [" code path "],
        preferred_evidence: ["code"],
        kind: "repo",
        objective_label: null,
      },
      {
        id: "section",
        title: "Section",
        required: false,
        must_answer: [],
        required_slots: [],
        preferred_evidence: ["doc"],
        kind: "answer",
        objective_label: null,
      },
    ]);
  });
});
