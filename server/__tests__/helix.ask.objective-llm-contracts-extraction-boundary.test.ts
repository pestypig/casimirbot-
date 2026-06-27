import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildHelixAskObjectiveRetrieveProposalPrompt,
  parseHelixAskObjectiveRetrieveProposal,
} from "../services/helix-ask/objectives/objective-llm-contracts";

const repoRoot = process.cwd();
const routePath = join(repoRoot, "server/routes/agi.plan.ts");
const servicePath = join(
  repoRoot,
  "server/services/helix-ask/objectives/objective-llm-contracts.ts",
);

describe("Helix Ask objective LLM contracts extraction boundary", () => {
  it("keeps retrieve-proposal prompt and parser helpers out of agi.plan.ts", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain("../services/helix-ask/objectives/objective-llm-contracts");
    expect(routeSource).not.toMatch(/const\s+buildHelixAskObjectiveRetrieveProposalPrompt\s*=/);
    expect(routeSource).not.toMatch(/const\s+parseHelixAskObjectiveRetrieveProposal\s*=/);
    expect(serviceSource).toMatch(
      /export\s+const\s+buildHelixAskObjectiveRetrieveProposalPrompt\s*=/,
    );
    expect(serviceSource).toMatch(/export\s+const\s+parseHelixAskObjectiveRetrieveProposal\s*=/);
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../../../routes/agi.plan");
    expect(serviceSource).not.toContain("../../routes/agi.plan");
    expect(serviceSource).not.toContain("../routes/agi.plan");
  });

  it("preserves retrieve-proposal prompt rendering", () => {
    expect(
      buildHelixAskObjectiveRetrieveProposalPrompt({
        question: "What is the load bearing?",
        objectiveId: "load-bearing",
        objectiveLabel: "Load Bearing",
        requiredSlots: ["numeric-result", "doc-evidence"],
        missingSlots: ["numeric-result"],
        queryHints: ["newtons per tile", "lbs conversion"],
        responseLanguage: "en",
      }),
    ).toContain(
      [
        "You are Helix Ask objective retrieval planner.",
        "Return strict JSON only. No markdown. No commentary.",
        "Schema:",
        '{ "objective_id":"string","queries":["string"],"rationale":"string" }',
      ].join("\n"),
    );
  });

  it("preserves retrieve-proposal parsing from nested and action-shaped JSON", () => {
    expect(
      parseHelixAskObjectiveRetrieveProposal(
        JSON.stringify({
          data: {
            objective_id: "load-bearing",
            queries: ["newtons per tile"],
            actions: [{ q: "casimir tile load bearing lbs" }],
            rationale: "Need the numeric evidence.",
          },
        }),
      ),
    ).toEqual({
      objective_id: "load-bearing",
      queries: ["newtons per tile", "casimir tile load bearing lbs"],
      rationale: "Need the numeric evidence.",
    });

    expect(parseHelixAskObjectiveRetrieveProposal("not json")).toBeNull();
  });
});
