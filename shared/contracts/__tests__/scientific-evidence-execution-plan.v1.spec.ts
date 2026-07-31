import { describe, expect, it } from "vitest";

import {
  ADVECTION_DIFFUSION_SCIENTIFIC_EVIDENCE_ORIENTATION_ID,
  ADVECTION_DIFFUSION_SOURCE_CLAIM_ID,
  buildAdvectionDiffusionScientificEvidenceExecutionPlanV1,
} from "../../scientific-evidence/advection-diffusion-scientific-evidence-enrollment";
import {
  validateScientificEvidenceExecutionPlanIntegrityV1,
  validateScientificEvidenceExecutionPlanShapeV1,
} from "../scientific-evidence-execution-plan.v1";

describe("scientific evidence execution plan v1", () => {
  it("hash-binds the exact current-turn source, orientation, and intervention without execution authority", async () => {
    const plan =
      await buildAdvectionDiffusionScientificEvidenceExecutionPlanV1({
        turnId: "turn:scientific-plan",
        interventionValue: "0.02",
        generatedAt: "2026-07-30T12:00:00.000Z",
      });
    expect(
      await validateScientificEvidenceExecutionPlanIntegrityV1(plan),
    ).toEqual([]);
    expect(plan.selection).toMatchObject({
      orientationId:
        ADVECTION_DIFFUSION_SCIENTIFIC_EVIDENCE_ORIENTATION_ID,
      sourceClaimId: ADVECTION_DIFFUSION_SOURCE_CLAIM_ID,
    });
    expect(plan.intervention).toMatchObject({
      parameterId: "parameter:diffusivity",
      baselineValue: "0.01",
      selectedValue: "0.02",
    });
    expect(plan.authority).toMatchObject({
      userSelectionBound: true,
      executesTools: false,
      grantsConfirmation: false,
      assistantAnswer: false,
      terminalEligible: false,
      promotionAllowed: false,
    });
  });

  it("rejects tampering and a no-op intervention", async () => {
    const plan =
      await buildAdvectionDiffusionScientificEvidenceExecutionPlanV1({
        turnId: "turn:scientific-plan-tamper",
        interventionValue: "0.02",
        generatedAt: "2026-07-30T12:00:00.000Z",
      });
    const tampered = structuredClone(plan);
    tampered.intervention.selectedValue = "0.01";
    expect(validateScientificEvidenceExecutionPlanShapeV1(tampered)).toContain(
      "intervention.selectedValue must differ from baselineValue",
    );
    expect(
      await validateScientificEvidenceExecutionPlanIntegrityV1(tampered),
    ).toEqual(
      expect.arrayContaining([
        "intervention.selectedValue must differ from baselineValue",
      ]),
    );
    await expect(
      buildAdvectionDiffusionScientificEvidenceExecutionPlanV1({
        turnId: "turn:scientific-plan-outside",
        interventionValue: "0.03",
      }),
    ).rejects.toThrow("scientific_evidence_intervention_not_permitted");
  });
});
