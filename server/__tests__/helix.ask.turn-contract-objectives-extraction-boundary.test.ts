import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildHelixAskTurnContractObjectives } from "../services/helix-ask/contracts/turn-contract-objectives";

const repoRoot = process.cwd();
const routePath = join(repoRoot, "server/routes/agi.plan.ts");
const servicePath = join(repoRoot, "server/services/helix-ask/contracts/turn-contract-objectives.ts");

describe("Helix Ask turn-contract objectives extraction boundary", () => {
  it("keeps objective normalization out of agi.plan.ts", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain("../services/helix-ask/contracts/turn-contract-objectives");
    expect(routeSource).not.toContain("const objectives = objectiveInputs\n    .map((entry) => {");
    expect(routeSource).not.toContain("return {\n        label,\n        required_slots: requiredSlots,\n        query_hints: queryHints,\n      } satisfies HelixAskTurnContractObjective;");
    expect(serviceSource).toMatch(/export\s+const\s+buildHelixAskTurnContractObjectives\s*=/);
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
});
