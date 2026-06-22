import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { decideHelixToolChoice } from "../services/helix-ask/tool-choice-policy";
import { planWorkstationToolUse } from "../services/helix-ask/workstation-tool-planner";

describe("Helix Ask tool-choice policy", () => {
  it("surfaces run_ask_tool affordance ids for workstation goal-context plans", () => {
    const workstationPlan = planWorkstationToolUse(
      "Start an agent goal session goal_id=goal:frog-monitor source_id=image-lens:latest objective=\"Monitor visual capture for frog classification evidence.\"",
      { threadId: "thread:frog", turnId: "turn:frog" },
    ).tool_plan;

    const decision = decideHelixToolChoice({
      turn_id: "turn:frog",
      prompt: "Start an agent goal session for frog classification.",
      workstation_tool_plan: workstationPlan,
    });

    expect(decision.decision).toBe("workstation_tool_plan");
    expect(decision.selected_affordance_ids).toEqual([
      "live_env.start_agent_goal_session",
      "live_env.query_workstation_goal_context",
    ]);
  });

  it("surfaces live_env narrator affordance ids for governed narrator control plans", () => {
    const workstationPlan = planWorkstationToolUse(
      'Narrator say text="Translation is now routed through Narrator."',
      { threadId: "thread:narrator", turnId: "turn:narrator" },
    ).tool_plan;

    const decision = decideHelixToolChoice({
      turn_id: "turn:narrator",
      prompt: "Narrator say this status update.",
      workstation_tool_plan: workstationPlan,
    });

    expect(decision.decision).toBe("workstation_tool_plan");
    expect(decision.selected_affordance_ids).toEqual([
      "live_env.narrator_say",
    ]);
  });

  it("keeps repair workstation source exposed in the top-level Ask live_env capability surface", () => {
    const agiPlanSource = readFileSync(resolve(__dirname, "../routes/agi.plan.ts"), "utf8");
    const repairCapability = "live_env.repair_workstation_source";

    expect(agiPlanSource.match(new RegExp(`case "${repairCapability}"`, "g"))?.length ?? 0).toBeGreaterThanOrEqual(1);
    expect(agiPlanSource).toContain(`"${repairCapability}",`);
    expect(agiPlanSource).toContain(`capability_key: "${repairCapability}"`);
    expect(agiPlanSource).toContain("Creates a governed source-repair control receipt");
  });

  it("keeps context-resume memory from repairing failed stream terminal authority", () => {
    const agiPlanSource = readFileSync(resolve(__dirname, "../routes/agi.plan.ts"), "utf8");

    expect(agiPlanSource).toContain("const shouldAttemptContextResumeStreamFailureAnswerRepair = (): boolean => false;");
    expect(agiPlanSource).toContain("streamSolverFailureRequiresTypedFailure && shouldAttemptContextResumeStreamFailureAnswerRepair()");
    expect(agiPlanSource).toContain("const recoveryRecall = shouldAttemptContextResumeStreamFailureAnswerRepair()");
    expect(agiPlanSource).toContain("stream_terminal_repair_suppressed_by_solver_authority");
    expect(agiPlanSource).toContain("context_resume_memory_must_not_repair_solver_path_incomplete_before_terminal");
  });

  it("requires solver permission before stream projection promotes a model draft to terminal authority", () => {
    const agiPlanSource = readFileSync(resolve(__dirname, "../routes/agi.plan.ts"), "utf8");

    expect(agiPlanSource).toContain("const streamTerminalProjectionAllowedBySolver =");
    expect(agiPlanSource).toContain("const streamCanProjectSelectedAnswer =");
    expect(agiPlanSource).toContain("stream_projection_without_solver_authority");
    expect(agiPlanSource).toMatch(
      /const modelDraftIsTerminalAuthority =[\s\S]*!isWorkstationToolTerminalAuthority &&[\s\S]*streamTerminalProjectionAllowedBySolver &&[\s\S]*streamFinalAnswerSource === "final_answer_draft"/,
    );
    expect(agiPlanSource).toMatch(
      /const selectedStreamAnswerCandidate =[\s\S]*terminalPresentationConciseText[\s\S]*bodySelectedFinalAnswer/,
    );
    expect(agiPlanSource).toMatch(
      /let selectedStreamAnswer = streamCanProjectSelectedAnswer \? selectedStreamAnswerCandidate : "";/,
    );
  });

  it("requires solver permission before response-boundary presentation text becomes terminal authority", () => {
    const agiPlanSource = readFileSync(resolve(__dirname, "../routes/agi.plan.ts"), "utf8");

    expect(agiPlanSource).toContain("const canProjectAskTurnTerminalAtResponseBoundary =");
    expect(agiPlanSource).toContain("const canPromoteAskTurnTerminalKindAtResponseBoundary =");
    expect(agiPlanSource).toContain("const responseBoundaryCanProjectTerminalPresentation =");
    expect(agiPlanSource).toContain("terminal_presentation_requires_solver_or_terminal_authority");
    expect(agiPlanSource).toContain("const responseBoundaryCanProjectTerminalAuthority =");
    expect(agiPlanSource).toContain("response_projection_without_solver_authority");
    expect(agiPlanSource).toContain("response_boundary_projection_suppressed_by_solver_authority");
    expect(agiPlanSource).toMatch(
      /if \(responseBoundaryCanProjectTerminalPresentation\) \{[\s\S]*payload\.selected_final_answer = terminalPresentationBundle\.presentation\.concise_text;/,
    );
    expect(agiPlanSource).toMatch(
      /if \(authorityTerminalText && !responseBoundaryCanProjectTerminalAuthority\) \{[\s\S]*final_answer_source: "typed_failure"[\s\S]*terminal_artifact_kind: "typed_failure"/,
    );
  });

  it("requires solver permission before response-boundary repo evidence repair promotes typed failure to success", () => {
    const agiPlanSource = readFileSync(resolve(__dirname, "../routes/agi.plan.ts"), "utf8");

    expect(agiPlanSource).toContain("const responseBoundaryCanPromoteRepoEvidenceAnswer =");
    expect(agiPlanSource).toContain("const finalizerCanPromoteRepoEvidenceAnswer =");
    expect(agiPlanSource).toContain("const finalizerCanPromoteRepoDefinition =");
    expect(agiPlanSource).toContain("const responseBoundaryCanPromoteRepoDefinition =");
    expect(agiPlanSource).toContain("repo_evidence_answer_requires_solver_or_terminal_authority");
    expect(agiPlanSource).toContain("repo_definition_answer_requires_solver_or_terminal_authority");
    expect(agiPlanSource).toContain("response_boundary_repo_evidence_projection_suppressed");
    expect(agiPlanSource).toContain("response_boundary_repo_definition_projection_suppressed");
    expect(agiPlanSource).toMatch(
      /repoAnswerTextForResponseBoundary &&[\s\S]*routeProductContractForPresentation\.source_target === "repo_code" &&[\s\S]*responseBoundaryCanPromoteRepoEvidenceAnswer &&[\s\S]*payload\.terminal_artifact_kind = "repo_code_evidence_answer"/,
    );
    expect(agiPlanSource).toMatch(
      /modelAuthoredRepoEvidenceText && finalizerCanPromoteRepoEvidenceAnswer[\s\S]*payload\.terminal_artifact_kind = "repo_code_evidence_answer"/,
    );
    expect(agiPlanSource).toMatch(
      /repoConceptForResponseBoundary &&[\s\S]*responseBoundaryCanPromoteRepoDefinition[\s\S]*payload\.terminal_artifact_kind = "repo_code_evidence_answer"/,
    );
  });

  it("requires solver permission before attached visual evidence repairs a failed terminal answer", () => {
    const agiPlanSource = readFileSync(resolve(__dirname, "../routes/agi.plan.ts"), "utf8");

    expect(agiPlanSource).toContain("const responseBoundaryCanPromoteAttachedVisual =");
    expect(agiPlanSource).toContain("visual_frame_evidence_requires_solver_or_terminal_authority");
    expect(agiPlanSource).toContain("response_boundary_visual_projection_suppressed");
    expect(agiPlanSource).toMatch(
      /attachedVisualSummary &&[\s\S]*asksAboutAttachedVisual &&[\s\S]*visualPromotionDecision\?\.allowed === true &&[\s\S]*responseBoundaryCanPromoteAttachedVisual &&[\s\S]*applySituationContextFinalAnswer\(visualAnswer, terminalArtifactId\)/,
    );
  });

  it("requires solver permission before processed-mail checkpoint evidence repairs a failed terminal answer", () => {
    const agiPlanSource = readFileSync(resolve(__dirname, "../routes/agi.plan.ts"), "utf8");

    expect(agiPlanSource).toContain("const responseBoundaryCanPromoteProcessedMailCheckpoint =");
    expect(agiPlanSource).toContain("processed_mail_checkpoint_synthesis_requires_solver_or_terminal_authority");
    expect(agiPlanSource).toContain("response_boundary_processed_mail_projection_suppressed");
    expect(agiPlanSource).toMatch(
      /processedMailCheckpointTextForResponseBoundary &&[\s\S]*processedMailCheckpointDecisionSatisfiedForResponseBoundary &&[\s\S]*responseBoundaryCanPromoteProcessedMailCheckpoint &&[\s\S]*payload\.terminal_artifact_kind = "model_synthesized_answer"/,
    );
  });

  it("requires solver permission before doc concept artifacts repair a failed terminal answer", () => {
    const agiPlanSource = readFileSync(resolve(__dirname, "../routes/agi.plan.ts"), "utf8");

    expect(agiPlanSource).toContain("const responseBoundaryCanPromoteDocConceptExplanation =");
    expect(agiPlanSource.match(/const responseBoundaryCanPromoteDocConceptExplanation =/g)?.length ?? 0).toBeGreaterThanOrEqual(6);
    expect(agiPlanSource).toContain("doc_concept_explanation_requires_solver_or_terminal_authority");
    expect(agiPlanSource).toContain("response_boundary_doc_concept_projection_suppressed");
    expect(agiPlanSource).toMatch(
      /conceptArtifact && conceptText\.trim\(\) && responseBoundaryCanPromoteDocConceptExplanation[\s\S]*payload\.terminal_artifact_kind = "doc_concept_explanation"/,
    );
  });

  it("requires solver permission before the top-level Ask wrapper mints terminal authority", () => {
    const agiPlanSource = readFileSync(resolve(__dirname, "../routes/agi.plan.ts"), "utf8");

    expect(agiPlanSource).toContain("const askWrapperCanProjectTerminalAuthority =");
    expect(agiPlanSource).toContain("canProjectAskTurnTerminalAtResponseBoundary(typedPayload, typedDebug)");
    expect(agiPlanSource).toContain("ask_wrapper_projection_without_solver_authority");
    expect(agiPlanSource).toContain("ask_wrapper_projection_suppressed_by_solver_authority");
    expect(agiPlanSource).toMatch(
      /if \(poisonTerminalText && !askWrapperCanProjectTerminalAuthority\) \{[\s\S]*final_answer_source: "typed_failure"[\s\S]*terminal_artifact_kind: "typed_failure"/,
    );
    expect(agiPlanSource).toMatch(
      /const terminalAuthorityRecord = recordHelixTurnTerminalAuthority\(\{[\s\S]*terminal_text: poisonTerminalText/,
    );
  });

  it("keeps goal sessions, goal context, packet traces, route evidence, and automation policies exposed in the top-level Ask live_env capability surface", () => {
    const agiPlanSource = readFileSync(resolve(__dirname, "../routes/agi.plan.ts"), "utf8");
    const capabilities = [
      "live_env.start_agent_goal_session",
      "live_env.query_workstation_goal_context",
      "live_env.query_packet_traces",
      "live_env.query_route_evidence",
      "live_env.query_automation_policies",
    ];

    for (const capability of capabilities) {
      expect(agiPlanSource.match(new RegExp(`case "${capability}"`, "g"))?.length ?? 0).toBeGreaterThanOrEqual(1);
      expect(agiPlanSource).toContain(`"${capability}",`);
      expect(agiPlanSource).toContain(`capability_key: "${capability}"`);
    }

    expect(agiPlanSource).toContain("context_feeds");
    expect(agiPlanSource).toContain("allowed_actuators");
    expect(agiPlanSource).toContain("producer_kind");
    expect(agiPlanSource).toContain("update_kind");
    expect(agiPlanSource).toContain("packet_id");
    expect(agiPlanSource).toContain("route-watch GoalContextUpdate evidence");
  });
});
