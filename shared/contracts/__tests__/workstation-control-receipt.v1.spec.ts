import { describe, expect, it } from "vitest";
import {
  WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS,
  WORKSTATION_AGENT_GOAL_SESSION_SCHEMA,
  type AgentGoalSessionV1,
} from "../workstation-goal-context.v1";
import type { WorkstationControlReceiptV1 } from "../workstation-control-receipt.v1";
import {
  WORKSTATION_CONTROL_RECEIPT_SCHEMA,
  validateWorkstationControlReceiptV1,
} from "../workstation-control-receipt.v1";

const receiptFixture = (
  overrides: Partial<WorkstationControlReceiptV1> = {},
): WorkstationControlReceiptV1 => {
  const agentGoalSession: AgentGoalSessionV1 = {
    schemaVersion: WORKSTATION_AGENT_GOAL_SESSION_SCHEMA,
    goalId: "goal:frog",
    threadId: "helix-ask:desktop",
    roomId: "room:desktop",
    objective: "Classify frog imagery from ImageLens visual capture.",
    userVisibleSummary: "Classifying frog imagery.",
    status: "active",
    sourceRefs: ["visual_source:image-lens", "source:visual:active"],
    loopRefs: ["helix-ask:desktop", "workstation_control:change_preset", "workstation_actuator:change_preset"],
    constructRefs: ["stage-play-badge-graph", "live-answer-environment"],
    contextFeeds: [{
      feedId: "feed:visual-summaries",
      sourceKind: "visual_summaries",
      freshnessMs: 30_000,
      relevancePolicy: "same-source-or-goal-id",
    }],
    allowedActuators: ["change_preset"],
    cadence: { kind: "user_turn_only" },
    stopConditions: ["user stops the goal", "visual source disconnects"],
    checkpoints: [{
      checkpointId: "goal_checkpoint:frog:control",
      createdAtMs: 1_780_000_000_000,
      summary: "Preset control prepared for frog classification.",
      evidenceRefs: ["stage_play_workstation_control_receipt:change_preset:frog"],
      actionsTaken: ["change_preset"],
      nextStep: "continue",
    }],
    authority: {
      assistantAnswer: false,
      finalReportsRequireTerminalAuthority: true,
      finalReportRequirements: WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS,
    },
  };
  return {
  schema: WORKSTATION_CONTROL_RECEIPT_SCHEMA,
  receiptId: "stage_play_workstation_control_receipt:change_preset:frog",
  controlKind: "change_preset",
  label: "change workstation preset",
  ok: true,
  status: "prepared",
  missingRequirements: [],
  goalId: "goal:frog",
  goalSessionFound: true,
  requiredActuator: "change_preset",
  actuatorAllowed: true,
  policyEvidenceRefs: ["allowed_actuator:change_preset"],
  sourceRefs: ["visual_source:image-lens", "source:visual:active"],
  loopRefs: ["helix-ask:desktop", "workstation_control:change_preset", "workstation_actuator:change_preset"],
  evidenceRefs: [
    "stage_play_workstation_control_receipt:change_preset:frog",
    "allowed_actuator:change_preset",
    "visual_source:image-lens",
    "source:visual:active",
    "helix-ask:desktop",
    "workstation_control:change_preset",
    "workstation_actuator:change_preset",
  ],
  producedRefs: [
    "stage_play_workstation_control_receipt:change_preset:frog",
    "stage_play_goal_context_update:control:frog",
  ],
  agentGoalSession,
  targetRef: "source:visual:active",
  sourceRef: "visual_source:image-lens",
  presetId: "preset:frog-classifier",
  loopRef: null,
  lineKey: null,
  panelId: "stage-play-badge-graph",
  nodeRef: null,
  loopState: null,
  reason: "Apply frog classifier.",
  mailboxThreadId: "helix-ask:desktop",
  mailboxThreadResolution: {
    mailboxThreadId: "helix-ask:desktop",
  },
  dispatch: [
    { kind: "log_receipt", receiptRef: "stage_play_workstation_control_receipt:change_preset:frog" },
    { kind: "update_panel", panelId: "stage-play-badge-graph" },
    { kind: "change_preset", targetRef: "source:visual:active", presetId: "preset:frog-classifier" },
  ],
  suggestedDispatch: [
    { kind: "log_receipt", receiptRef: "stage_play_workstation_control_receipt:change_preset:frog" },
    { kind: "update_panel", panelId: "stage-play-badge-graph" },
    { kind: "change_preset", targetRef: "source:visual:active", presetId: "preset:frog-classifier" },
  ],
  goalContextUpdateId: "stage_play_goal_context_update:control:frog",
  terminalAuthority: {
    status: "not_terminal",
    finalAnswerEligible: false,
    completedSolverPathRequired: true,
    terminalAuthoritySingleWriterRequired: true,
  },
  post_tool_model_step_required: true,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
  context_role: "tool_evidence",
  ask_context_policy: "evidence_only",
  ...overrides,
  };
};

describe("stage_play_workstation_control_receipt/v1", () => {
  it("accepts prepared workstation control receipts as non-terminal tool evidence", () => {
    expect(validateWorkstationControlReceiptV1(receiptFixture())).toEqual([]);
  });

  it("requires prepared receipts to include their matching control dispatch", () => {
    const receipt = receiptFixture({
      dispatch: [
        { kind: "log_receipt", receiptRef: "stage_play_workstation_control_receipt:change_preset:frog" },
        { kind: "update_panel", panelId: "stage-play-badge-graph" },
      ],
      suggestedDispatch: [
        { kind: "log_receipt", receiptRef: "stage_play_workstation_control_receipt:change_preset:frog" },
        { kind: "update_panel", panelId: "stage-play-badge-graph" },
      ],
    });

    expect(validateWorkstationControlReceiptV1(receipt)).toEqual(expect.arrayContaining([
      "dispatch must include prepared change_preset dispatch",
      "suggestedDispatch must include prepared change_preset dispatch",
    ]));
  });

  it("accepts blocked receipts only when mutating dispatches are suppressed", () => {
    const receipt = receiptFixture({
      ok: false,
      status: "blocked",
      missingRequirements: ["allowed_actuator:change_preset"],
      actuatorAllowed: false,
      dispatch: [
        { kind: "log_receipt", receiptRef: "stage_play_workstation_control_receipt:change_preset:frog" },
        { kind: "update_panel", panelId: "stage-play-badge-graph" },
      ],
      suggestedDispatch: [
        { kind: "log_receipt", receiptRef: "stage_play_workstation_control_receipt:change_preset:frog" },
        { kind: "update_panel", panelId: "stage-play-badge-graph" },
      ],
    });

    expect(validateWorkstationControlReceiptV1(receipt)).toEqual([]);
  });

  it("rejects prepared receipts without actuator policy or valid goal-session evidence", () => {
    expect(validateWorkstationControlReceiptV1(receiptFixture({
      actuatorAllowed: false,
      policyEvidenceRefs: ["goal:policy-context"],
      agentGoalSession: {
        goalId: "goal:wrong",
        threadId: "helix-ask:desktop",
      },
    }))).toEqual(expect.arrayContaining([
      "prepared receipts must have actuatorAllowed=true",
      "policyEvidenceRefs must include required actuator policy ref",
      "agentGoalSession.schemaVersion must match agent goal session schema",
      "agentGoalSession.goalId must match goalId",
    ]));
  });

  it("rejects control receipts whose evidence does not carry policy, source, and loop proof refs", () => {
    expect(validateWorkstationControlReceiptV1(receiptFixture({
      loopRefs: ["helix-ask:desktop"],
      evidenceRefs: [
        "stage_play_workstation_control_receipt:change_preset:frog",
        "allowed_actuator:change_preset",
        "visual_source:image-lens",
      ],
    }))).toEqual(expect.arrayContaining([
      "loopRefs must include workstation control loop ref",
      "loopRefs must include required actuator loop ref",
      "evidenceRefs must include every sourceRefs entry",
      "evidenceRefs must include every loopRefs entry",
    ]));

    expect(validateWorkstationControlReceiptV1(receiptFixture({
      evidenceRefs: [
        "stage_play_workstation_control_receipt:change_preset:frog",
        "visual_source:image-lens",
        "source:visual:active",
        "helix-ask:desktop",
        "workstation_control:change_preset",
        "workstation_actuator:change_preset",
      ],
    }))).toEqual(expect.arrayContaining([
      "evidenceRefs must include every policyEvidenceRefs entry",
    ]));
  });

  it("requires prepared process-graph focus receipts to name a node", () => {
    expect(validateWorkstationControlReceiptV1(receiptFixture({
      receiptId: "stage_play_workstation_control_receipt:focus_process_graph:frog",
      controlKind: "focus_process_graph",
      label: "focus process graph",
      requiredActuator: "focus_process_graph",
      policyEvidenceRefs: ["allowed_actuator:focus_process_graph"],
      sourceRefs: ["visual_source:image-lens", "packet:frog"],
      loopRefs: ["helix-ask:desktop", "workstation_control:focus_process_graph", "workstation_actuator:focus_process_graph"],
      evidenceRefs: [
        "stage_play_workstation_control_receipt:focus_process_graph:frog",
        "allowed_actuator:focus_process_graph",
        "visual_source:image-lens",
        "packet:frog",
        "helix-ask:desktop",
        "workstation_control:focus_process_graph",
        "workstation_actuator:focus_process_graph",
      ],
      producedRefs: [
        "stage_play_workstation_control_receipt:focus_process_graph:frog",
        "stage_play_goal_context_update:control:frog",
      ],
      targetRef: null,
      presetId: null,
      nodeRef: "packet:frog",
      dispatch: [
        { kind: "log_receipt", receiptRef: "stage_play_workstation_control_receipt:focus_process_graph:frog" },
        { kind: "update_panel", panelId: "stage-play-badge-graph" },
        { kind: "focus_process_graph", nodeRef: "packet:frog" },
      ],
      suggestedDispatch: [
        { kind: "log_receipt", receiptRef: "stage_play_workstation_control_receipt:focus_process_graph:frog" },
        { kind: "update_panel", panelId: "stage-play-badge-graph" },
        { kind: "focus_process_graph", nodeRef: "packet:frog" },
      ],
    }))).toEqual([]);

    expect(validateWorkstationControlReceiptV1(receiptFixture({
      controlKind: "focus_process_graph",
      label: "focus process graph",
      requiredActuator: "focus_process_graph",
      policyEvidenceRefs: ["allowed_actuator:focus_process_graph"],
      nodeRef: null,
    }))).toEqual(expect.arrayContaining([
      "prepared focus_process_graph receipts must include nodeRef",
    ]));
  });

  it("requires prepared source binding and loop receipts to name their targets", () => {
    expect(validateWorkstationControlReceiptV1(receiptFixture({
      receiptId: "stage_play_workstation_control_receipt:bind_source:frog",
      controlKind: "bind_source",
      label: "bind workstation source",
      requiredActuator: "bind_source",
      policyEvidenceRefs: ["allowed_actuator:bind_source"],
      sourceRefs: ["source:visual:active", "live-answer:visual"],
      sourceRef: "source:visual:active",
      targetRef: "live-answer:visual",
      presetId: null,
      loopRefs: ["helix-ask:desktop", "workstation_control:bind_source", "workstation_actuator:bind_source"],
      evidenceRefs: [
        "stage_play_workstation_control_receipt:bind_source:frog",
        "allowed_actuator:bind_source",
        "source:visual:active",
        "live-answer:visual",
        "helix-ask:desktop",
        "workstation_control:bind_source",
        "workstation_actuator:bind_source",
      ],
      producedRefs: [
        "stage_play_workstation_control_receipt:bind_source:frog",
        "stage_play_goal_context_update:control:frog",
      ],
      dispatch: [
        { kind: "log_receipt", receiptRef: "stage_play_workstation_control_receipt:bind_source:frog" },
        { kind: "update_panel", panelId: "live-answer-environment" },
        { kind: "bind_source", sourceRef: "source:visual:active", targetRef: "live-answer:visual" },
      ],
      suggestedDispatch: [
        { kind: "log_receipt", receiptRef: "stage_play_workstation_control_receipt:bind_source:frog" },
        { kind: "update_panel", panelId: "live-answer-environment" },
        { kind: "bind_source", sourceRef: "source:visual:active", targetRef: "live-answer:visual" },
      ],
    }))).toEqual([]);

    expect(validateWorkstationControlReceiptV1(receiptFixture({
      controlKind: "bind_source",
      label: "bind workstation source",
      requiredActuator: "bind_source",
      policyEvidenceRefs: ["allowed_actuator:bind_source"],
      sourceRef: "source:visual:active",
      targetRef: null,
      presetId: null,
    }))).toEqual(expect.arrayContaining([
      "prepared bind_source receipts must include targetRef",
    ]));

    expect(validateWorkstationControlReceiptV1(receiptFixture({
      controlKind: "set_loop_state",
      label: "set workstation loop state",
      requiredActuator: "pause_loop",
      policyEvidenceRefs: ["allowed_actuator:pause_loop"],
      targetRef: null,
      presetId: null,
      loopRef: null,
      loopState: "paused",
    }))).toEqual(expect.arrayContaining([
      "prepared set_loop_state receipts must include loopRef",
    ]));
  });

  it("rejects blocked or terminalizing workstation control receipts", () => {
    const invalid = {
      ...receiptFixture({
        ok: false,
        status: "blocked",
        missingRequirements: ["allowed_actuator:change_preset"],
        actuatorAllowed: false,
      }),
      assistant_answer: true,
      terminal_eligible: true,
      raw_content_included: true,
      evidenceRefs: ["allowed_actuator:change_preset"],
      producedRefs: ["stage_play_goal_context_update:control:frog"],
      terminalAuthority: {
        status: "terminal",
        finalAnswerEligible: true,
        completedSolverPathRequired: false,
        terminalAuthoritySingleWriterRequired: false,
      },
    } as unknown as WorkstationControlReceiptV1;

    expect(validateWorkstationControlReceiptV1(invalid)).toEqual(expect.arrayContaining([
      "dispatch must not include mutating control dispatch while blocked",
      "suggestedDispatch must not include mutating control dispatch while blocked",
      "evidenceRefs must include receiptId",
      "producedRefs must include receiptId",
      "terminalAuthority.status must be not_terminal",
      "terminalAuthority.finalAnswerEligible must be false",
      "terminalAuthority.completedSolverPathRequired must be true",
      "terminalAuthority.terminalAuthoritySingleWriterRequired must be true",
      "assistant_answer must be false",
      "terminal_eligible must be false",
      "raw_content_included must be false",
    ]));
  });
});
