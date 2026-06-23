import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  enforceHelixAskObjectiveEvidenceSufficiency,
  enforceHelixAskObjectiveUnknownBlocks,
  isHelixAskObjectiveCoverageSatisfied,
  isHelixAskObjectiveTerminalStatus,
  scoreHelixAskObjectiveEvidenceSufficiency,
} from "../services/helix-ask/objectives/objective-loop-debug";

const repoRoot = process.cwd();
const routePath = join(repoRoot, "server/routes/agi.plan.ts");
const servicePath = join(repoRoot, "server/services/helix-ask/objectives/objective-loop-debug.ts");

describe("Helix Ask objective loop debug extraction boundary", () => {
  it("keeps objective loop pure helpers out of agi.plan.ts", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain("../services/helix-ask/objectives/objective-loop-debug");
    expect(routeSource).not.toMatch(/const\s+isHelixAskObjectiveTerminalStatus\s*=/);
    expect(routeSource).not.toMatch(/const\s+isHelixAskObjectiveCoverageSatisfied\s*=/);
    expect(routeSource).not.toMatch(/const\s+enforceHelixAskObjectiveUnknownBlocks\s*=/);
    expect(routeSource).not.toMatch(/const\s+scoreHelixAskObjectiveEvidenceSufficiency\s*=/);
    expect(routeSource).not.toMatch(/const\s+enforceHelixAskObjectiveEvidenceSufficiency\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+isHelixAskObjectiveTerminalStatus\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+isHelixAskObjectiveCoverageSatisfied\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+enforceHelixAskObjectiveUnknownBlocks\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+scoreHelixAskObjectiveEvidenceSufficiency\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+enforceHelixAskObjectiveEvidenceSufficiency\s*=/);
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../../../routes/agi.plan");
    expect(serviceSource).not.toContain("../../routes/agi.plan");
    expect(serviceSource).not.toContain("../routes/agi.plan");
  });

  it("preserves objective terminal and coverage checks", () => {
    expect(isHelixAskObjectiveTerminalStatus("complete")).toBe(true);
    expect(isHelixAskObjectiveTerminalStatus("blocked")).toBe(true);
    expect(isHelixAskObjectiveTerminalStatus("retrieving")).toBe(false);
    expect(
      isHelixAskObjectiveCoverageSatisfied({
        objective_id: "obj_1",
        objective_label: "Evidence",
        required_slots: ["doc-evidence", "numeric-result"],
        matched_slots: ["doc-evidence"],
        status: "retrieving",
        attempt: 1,
      }),
    ).toBe(false);
  });

  it("preserves unknown-block and evidence-sufficiency enforcement", () => {
    const miniAnswer = {
      objective_id: "obj_1",
      objective_label: "Load Bearing",
      status: "covered" as const,
      matched_slots: ["doc-evidence"],
      missing_slots: [],
      evidence_refs: [],
      linked_evidence_refs: [],
      summary: "Load Bearing: covered.",
    };
    const state = {
      objective_id: "obj_1",
      objective_label: "Load Bearing",
      required_slots: ["doc-evidence", "numeric-result"],
      matched_slots: ["doc-evidence"],
      status: "synthesizing" as const,
      attempt: 1,
      retrieval_confidence: 0,
    };

    expect(
      enforceHelixAskObjectiveUnknownBlocks({
        miniAnswers: [{ ...miniAnswer, status: "partial", missing_slots: ["numeric-result"] }],
        maxObjectives: 2,
      }).missingObjectiveIds,
    ).toEqual(["obj_1"]);

    expect(scoreHelixAskObjectiveEvidenceSufficiency({ miniAnswer, state }).reason).toBe(
      "objective_zero_confidence_missing_evidence_linkage",
    );

    const enforced = enforceHelixAskObjectiveEvidenceSufficiency({
      miniAnswers: [miniAnswer],
      states: [state],
    });
    expect(enforced.miniAnswers[0]?.status).toBe("blocked");
    expect(enforced.terminalizationReasons.obj_1).toBe("objective_oes_below_block_threshold");
  });
});
