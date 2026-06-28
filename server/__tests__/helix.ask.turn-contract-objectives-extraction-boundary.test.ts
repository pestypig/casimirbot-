import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildHelixAskTurnContractFallbackObjectiveLabels,
  buildHelixAskTurnContractObjectives,
  selectHelixAskTurnContractObjectiveInputs,
} from "../services/helix-ask/contracts/turn-contract-objectives";

const repoRoot = process.cwd();
const routePath = join(repoRoot, "server/routes/agi.plan.ts");
const servicePath = join(repoRoot, "server/services/helix-ask/contracts/turn-contract-objectives.ts");

describe("Helix Ask turn-contract objectives extraction boundary", () => {
  it("keeps objective normalization out of agi.plan.ts", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain("../services/helix-ask/contracts/turn-contract-objectives");
    expect(routeSource).not.toContain("const objectives = objectiveInputs\n    .map((entry) => {");
    expect(routeSource).toContain("buildHelixAskTurnContractFallbackObjectiveLabels({");
    expect(routeSource).not.toContain("const fallbackObjectiveLabels = researchObjectiveInputs.length\n    ? []");
    expect(routeSource).toContain("selectHelixAskTurnContractObjectiveInputs({");
    expect(routeSource).not.toContain("? args.plannerPass.objectives\n        : fallbackObjectiveLabels.map");
    expect(routeSource).not.toContain("return {\n        label,\n        required_slots: requiredSlots,\n        query_hints: queryHints,\n      } satisfies HelixAskTurnContractObjective;");
    expect(serviceSource).toMatch(/export\s+const\s+buildHelixAskTurnContractFallbackObjectiveLabels\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+buildHelixAskTurnContractObjectives\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+selectHelixAskTurnContractObjectiveInputs\s*=/);
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../../../routes/agi.plan");
    expect(serviceSource).not.toContain("../../routes/agi.plan");
    expect(serviceSource).not.toContain("../routes/agi.plan");
  });

  it("preserves objective normalization, slot fallback, query hints, and fallback objective", () => {
    expect(
      buildHelixAskTurnContractObjectives({
        objectiveInputs: [
          {
            label: "  API integration plan  ",
            required_slots: [" API Surface ", "api-surface"],
            query_hints: [" custom query ", "custom query"],
          },
        ],
        question: "fallback question",
        family: "implementation_code_path",
        groundingMode: "repo",
        maxObjectives: 4,
      }),
    ).toEqual([
      {
        label: "API integration plan",
        required_slots: ["api-surface", "integration"],
        query_hints: [
          "custom query",
          "API integration plan",
          "api endpoint integration plan",
          "integration",
          "integration implementation",
        ],
      },
    ]);

    expect(
      buildHelixAskTurnContractObjectives({
        objectiveInputs: [{ label: "   " }],
        question: "  ",
        family: "general_overview",
        groundingMode: "open",
        maxObjectives: 4,
      }),
    ).toEqual([
      {
        label: "Answer the current ask.",
        required_slots: ["current", "ask"],
        query_hints: ["Answer the current ask.", "current ask."],
      },
    ]);
  });

  it("preserves objective input precedence from research, planner, then fallback labels", () => {
    const researchObjectiveInputs = [{ label: "research objective" }];
    const plannerObjectiveInputs = [{ label: "planner objective" }];
    const fallbackObjectiveLabels = ["fallback objective"];

    expect(
      selectHelixAskTurnContractObjectiveInputs({
        researchObjectiveInputs,
        plannerObjectiveInputs,
        fallbackObjectiveLabels,
      }),
    ).toBe(researchObjectiveInputs);

    expect(
      selectHelixAskTurnContractObjectiveInputs({
        researchObjectiveInputs: [],
        plannerObjectiveInputs,
        fallbackObjectiveLabels,
      }),
    ).toBe(plannerObjectiveInputs);

    expect(
      selectHelixAskTurnContractObjectiveInputs({
        researchObjectiveInputs: [],
        plannerObjectiveInputs: [],
        fallbackObjectiveLabels,
      }),
    ).toEqual([{ label: "fallback objective" }]);
  });

  it("preserves fallback objective label suppression when research objectives exist", () => {
    expect(
      buildHelixAskTurnContractFallbackObjectiveLabels({
        hasResearchObjectiveInputs: true,
        question: "find alpha and beta; then cite gamma",
        maxObjectives: 4,
      }),
    ).toEqual([]);

    expect(
      buildHelixAskTurnContractFallbackObjectiveLabels({
        hasResearchObjectiveInputs: false,
        question: "find alpha and beta; then cite gamma",
        maxObjectives: 4,
      }),
    ).toEqual(["find alpha and beta; then cite gamma", "find alpha", "beta; then cite gamma"]);
  });
});
