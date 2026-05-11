import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  erEprStage1RunPlanSchema,
  runErEprStage1Plan,
  type ErEprStage1RunPlan,
} from "../shared/er-epr-stage1-runner";

const fixturePath = path.resolve(process.cwd(), "tests/fixtures/er-epr-stage1/plan.fixture.json");

function loadPlan(): ErEprStage1RunPlan {
  return JSON.parse(fs.readFileSync(fixturePath, "utf8")) as ErEprStage1RunPlan;
}

describe("ER=EPR Stage 1 runner", () => {
  it("returns strong support for a passing candidate with all failed controls", () => {
    const report = runErEprStage1Plan(loadPlan());

    expect(report.strongestVerdict).toBe("dual_model_support_strong");
    expect(report.reproducibilityStatus).toBe("fixture_only");
    expect(report.failedControlSummary.requiredControlsPresent).toBe(true);
    expect(report.failedControlSummary.signalCarryingControls).toHaveLength(0);
    expect(report.failedControlSummary.entropyWashoutObserved).toBe(true);
    expect(report.strongestAllowedClaim.claimTier).toBe("Stage1_falsifiable_model_support");
  });

  it("demotes if a shuffled-Hamiltonian control exceeds threshold", () => {
    const plan = loadPlan() as any;
    const shuffled = plan.controlRuns.find((run: any) => run.controlKind === "shuffled_hamiltonian_control");
    shuffled.input.observables.shuffledHamiltonianControlScore = 0.72;

    const report = runErEprStage1Plan(plan);

    expect(report.strongestVerdict).toBe("ordinary_control_explains_signal");
    expect(report.failedControlSummary.signalCarryingControls.map((control) => control.controlKind)).toContain(
      "shuffled_hamiltonian_control",
    );
  });

  it("demotes if a wrong-sign coupling control exceeds threshold", () => {
    const plan = loadPlan() as any;
    const wrongSign = plan.controlRuns.find((run: any) => run.controlKind === "wrong_sign_coupling_control");
    wrongSign.input.observables.wrongSignCouplingControlScore = 0.72;

    const report = runErEprStage1Plan(plan);

    expect(report.strongestVerdict).toBe("ordinary_control_explains_signal");
    expect(report.failedControlSummary.signalCarryingControls.map((control) => control.controlKind)).toContain(
      "wrong_sign_coupling_control",
    );
  });

  it("rejects missing citations and claim IDs in the run plan", () => {
    const missingClaims = loadPlan() as any;
    missingClaims.candidateRuns[0].claimIds = [];
    expect(erEprStage1RunPlanSchema.safeParse(missingClaims).success).toBe(false);

    const missingCitations = loadPlan() as any;
    missingCitations.candidateRuns[0].citations = [];
    expect(erEprStage1RunPlanSchema.safeParse(missingCitations).success).toBe(false);
  });
});
