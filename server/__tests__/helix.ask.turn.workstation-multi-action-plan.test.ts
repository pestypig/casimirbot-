import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { planRouter } from "../routes/agi.plan";
import { synthesizeWorkstationToolAnswer } from "../services/helix-ask/workstation-answer-synthesizer";
import { evaluateWorkstationToolPlan } from "../services/helix-ask/workstation-tool-result-evaluator";
import { planWorkstationToolUse } from "../services/helix-ask/workstation-tool-planner";
import { listSubgoalEvaluations } from "../services/helix-ask/subgoal-evaluator";
import { listCategorizationEvents } from "../services/situation-room/categorization-bus";
import { listSyntheticEvidence } from "../services/situation-room/synthetic-evidence-ledger";

const actionKeys = (prompt: string): string[] =>
  (planWorkstationToolUse(prompt).tool_plan?.steps ?? [])
    .map((step) =>
      step.panel_id && step.action_id
        ? `${step.panel_id}.${step.action_id}`
        : null,
    )
    .filter((entry): entry is string => Boolean(entry));

describe("Helix Ask workstation multi-action tool plans", () => {
  it("builds calculator verification as open -> ingest -> solve -> evaluate", () => {
    const prompt = "Check this equation with the scientific calculator: x^2 - 4 = 0";
    const result = planWorkstationToolUse(prompt, {
      threadId: "helix-ask:test",
      turnId: "turn:test",
      now: new Date("2026-05-13T00:00:00.000Z"),
    });

    expect(result.tool_plan?.intent).toBe("calculator_verify");
    expect(actionKeys(prompt)).toEqual(
      expect.arrayContaining([
        "scientific-calculator.open",
        "scientific-calculator.ingest_latex",
        "scientific-calculator.solve_with_steps",
      ]),
    );

    const evaluation = evaluateWorkstationToolPlan({
      plan: result.tool_plan!,
      receipt_ids: ["receipt:calculator"],
      evidence_refs: ["receipt:calculator"],
    });
    expect(evaluation.schema).toBe("helix.workstation_tool_evaluation.v1");
    expect(evaluation.deterministic).toBe(true);
    expect(evaluation.model_invoked).toBe(false);
    expect(evaluation.categorization_event_ids?.length).toBeGreaterThan(0);
    expect(evaluation.synthetic_evidence_ids?.length).toBeGreaterThan(0);
    expect(evaluation.subgoal_evaluation_ids?.length).toBeGreaterThan(0);
    const evidence = listSyntheticEvidence("helix-ask:test").find(
      (entry) => entry.evidence_id === evaluation.synthetic_evidence_ids?.[0],
    );
    expect(evidence?.produced_by).toBe("calculator");
    expect(evidence?.assistant_answer).toBe(false);
    expect(evidence?.raw_content_included).toBe(false);
    expect(listCategorizationEvents("helix-ask:test").at(-1)?.category).toBe("equation_result");
    expect(listSubgoalEvaluations("helix-ask:test").at(-1)?.status).toBe("completed");
    expect(synthesizeWorkstationToolAnswer({ prompt, plan: result.tool_plan!, evaluation })).toMatch(/x = 2, -2/i);
  });

  it("builds note creation as open -> create -> evaluate and answers with a note reference", () => {
    const prompt = 'Create a workstation note titled "Test" with body hello';
    const result = planWorkstationToolUse(prompt, {
      threadId: "helix-ask:test",
      turnId: "turn:test",
      now: new Date("2026-05-13T00:00:00.000Z"),
    });

    expect(result.tool_plan?.intent).toBe("notes_create");
    expect(actionKeys(prompt)).toEqual(
      expect.arrayContaining(["workstation-notes.open", "workstation-notes.create_note"]),
    );

    const evaluation = evaluateWorkstationToolPlan({
      plan: result.tool_plan!,
      receipt_ids: ["receipt:note"],
      evidence_refs: ["receipt:note"],
    });
    expect(evaluation.supports_goal).toBe(true);
    const evidence = listSyntheticEvidence("helix-ask:test").find(
      (entry) => entry.evidence_id === evaluation.synthetic_evidence_ids?.[0],
    );
    expect(evidence?.produced_by).toBe("workstation_note");
    expect(evidence?.reusable_context_ref).toBe("receipt:note");
    expect(evidence?.assistant_answer).toBe(false);
    expect(listCategorizationEvents("helix-ask:test").at(-1)?.category).toBe("context_reference");
    expect(synthesizeWorkstationToolAnswer({ prompt, plan: result.tool_plan!, evaluation })).toMatch(
      /Created workstation note "Test"/i,
    );
  });

  it("builds Zen motive comparison through the mission-ethos affordance", () => {
    const prompt = "Compare this motive to Zen: I am gathering resources to survive.";
    const result = planWorkstationToolUse(prompt, {
      threadId: "helix-ask:test",
      turnId: "turn:test",
      now: new Date("2026-05-13T00:00:00.000Z"),
    });

    expect(result.tool_plan?.intent).toBe("ideology_compare");
    expect(actionKeys(prompt)).toEqual(
      expect.arrayContaining(["mission-ethos.open", "mission-ethos.compare_motive_to_zen"]),
    );

    const evaluation = evaluateWorkstationToolPlan({
      plan: result.tool_plan!,
      receipt_ids: ["receipt:mission-ethos"],
      evidence_refs: ["receipt:mission-ethos"],
    });
    expect(evaluation.tool_receipt_ids).toEqual(["receipt:mission-ethos"]);
    expect(listSyntheticEvidence("helix-ask:test").at(-1)?.produced_by).toBe("ideology");
    expect(listCategorizationEvents("helix-ask:test").at(-1)?.category).toBe("motive_framework");
    expect(synthesizeWorkstationToolAnswer({ prompt, plan: result.tool_plan!, evaluation })).toMatch(
      /Mission Ethos|Zen|ideology comparison/i,
    );
  });

  it("returns matching receipt artifacts from the ask/turn note path", async () => {
    const app = express();
    app.use(express.json());
    app.use("/api/agi", planRouter);
    const sessionId = `workstation-note-${Date.now()}`;

    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: 'Create a workstation note titled "Trace Check" with body hello',
        mode: "read",
        sessionId,
      })
      .expect(200);

    expect(response.body?.final_answer_source).toBe("workstation_tool_evaluation");
    expect(response.body?.terminal_artifact_kind).toBe("workstation_tool_evaluation");

    const createNoteStep = (response.body?.step_results ?? []).find(
      (step: { step_id?: string }) => step.step_id === "workstation_tool_create_note",
    );
    expect(createNoteStep?.actual_artifacts).toContain("note_action_receipt");
    expect(createNoteStep?.artifact?.kind).toBe("note_action_receipt");

    const evidenceResponse = await request(app)
      .get("/api/agi/situation/synthetic-evidence")
      .query({ thread_id: sessionId })
      .expect(200);
    expect(evidenceResponse.body?.raw_logs_included).toBe(false);
    expect(evidenceResponse.body?.deterministic_content_role).toBe("observation_not_assistant_answer");
    expect(evidenceResponse.body?.evidence?.at(-1)?.produced_by).toBe("workstation_note");
    expect(evidenceResponse.body?.evidence?.at(-1)?.assistant_answer).toBe(false);

    const categorizationResponse = await request(app)
      .get("/api/agi/situation/categorization-events")
      .query({ thread_id: sessionId })
      .expect(200);
    expect(categorizationResponse.body?.events?.at(-1)?.category).toBe("context_reference");

    const subgoalResponse = await request(app)
      .get("/api/agi/situation/subgoal-evaluations")
      .query({ thread_id: sessionId })
      .expect(200);
    expect(subgoalResponse.body?.evaluations?.at(-1)?.status).toBe("completed");
  });
});
