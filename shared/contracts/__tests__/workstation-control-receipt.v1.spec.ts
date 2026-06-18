import { describe, expect, it } from "vitest";
import type { WorkstationControlReceiptV1 } from "../workstation-control-receipt.v1";
import {
  WORKSTATION_CONTROL_RECEIPT_SCHEMA,
  validateWorkstationControlReceiptV1,
} from "../workstation-control-receipt.v1";

const receiptFixture = (
  overrides: Partial<WorkstationControlReceiptV1> = {},
): WorkstationControlReceiptV1 => ({
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
  agentGoalSession: null,
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
});

describe("stage_play_workstation_control_receipt/v1", () => {
  it("accepts prepared workstation control receipts as non-terminal tool evidence", () => {
    expect(validateWorkstationControlReceiptV1(receiptFixture())).toEqual([]);
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
