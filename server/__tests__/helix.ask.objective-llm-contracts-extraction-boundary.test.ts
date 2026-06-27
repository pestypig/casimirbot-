import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildHelixAskObjectiveRetrieveProposalPrompt,
  parseHelixAskObjectiveMiniCritique,
  parseHelixAskObjectiveMiniSynth,
  parseHelixAskObjectiveRetrieveProposal,
} from "../services/helix-ask/objectives/objective-llm-contracts";

const repoRoot = process.cwd();
const routePath = join(repoRoot, "server/routes/agi.plan.ts");
const servicePath = join(
  repoRoot,
  "server/services/helix-ask/objectives/objective-llm-contracts.ts",
);

describe("Helix Ask objective LLM contracts extraction boundary", () => {
  it("keeps objective LLM prompt and parser helpers out of agi.plan.ts", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain("../services/helix-ask/objectives/objective-llm-contracts");
    expect(routeSource).not.toMatch(/const\s+buildHelixAskObjectiveRetrieveProposalPrompt\s*=/);
    expect(routeSource).not.toMatch(/const\s+parseHelixAskObjectiveRetrieveProposal\s*=/);
    expect(routeSource).not.toMatch(/^const\s+parseHelixAskObjectiveMiniSynth\s*=/m);
    expect(routeSource).not.toMatch(/^const\s+parseHelixAskObjectiveMiniCritique\s*=/m);
    expect(routeSource).not.toMatch(/^const\s+collectHelixAskJsonParseCandidates\s*=/m);
    expect(routeSource).not.toMatch(/^const\s+normalizeHelixAskObjectiveSlotArray\s*=/m);
    expect(serviceSource).toMatch(
      /export\s+const\s+buildHelixAskObjectiveRetrieveProposalPrompt\s*=/,
    );
    expect(serviceSource).toMatch(/export\s+const\s+parseHelixAskObjectiveRetrieveProposal\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+parseHelixAskObjectiveMiniSynth\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+parseHelixAskObjectiveMiniCritique\s*=/);
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

  it("preserves mini-synth parsing from JSON and single-objective text fallback", () => {
    expect(
      parseHelixAskObjectiveMiniSynth(
        JSON.stringify({
          objectives: [
            {
              objective_id: "load-bearing",
              status: "complete",
              matched_slots: ["numeric result", "doc evidence"],
              missing_slots: ["unused"],
              summary: "Load bearing was grounded.",
              evidence_refs: ["docs/research/nhm2.md"],
            },
          ],
        }),
      ),
    ).toEqual({
      objectives: [
        {
          objective_id: "load-bearing",
          status: "covered",
          matched_slots: ["numeric-result", "doc-evidence"],
          missing_slots: [],
          summary: "Load bearing was grounded.",
          evidence_refs: ["docs/research/nhm2.md"],
          unknown_block: undefined,
        },
      ],
    });

    expect(
      parseHelixAskObjectiveMiniSynth("partial. Missing slots: doc evidence.", {
        objectiveHints: [
          {
            objective_id: "load-bearing",
            objective_label: "Load Bearing",
            required_slots: ["numeric-result", "doc-evidence"],
          },
        ],
      }),
    ).toMatchObject({
      objectives: [
        {
          objective_id: "load-bearing",
          status: "partial",
          matched_slots: ["numeric-result"],
          missing_slots: ["doc-evidence"],
        },
      ],
    });
  });

  it("preserves mini-critique parsing", () => {
    expect(
      parseHelixAskObjectiveMiniCritique(
        JSON.stringify({
          data: {
            objectives: [
              {
                objective_id: "load-bearing",
                status: "blocked",
                missing_slots: ["doc evidence"],
                reason: "No citation reached the target document.",
              },
            ],
          },
        }),
      ),
    ).toEqual({
      objectives: [
        {
          objective_id: "load-bearing",
          status: "blocked",
          missing_slots: ["doc-evidence"],
          reason: "No citation reached the target document.",
        },
      ],
    });

    expect(parseHelixAskObjectiveMiniCritique("no json")).toBeNull();
  });
});
