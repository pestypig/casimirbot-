import { describe, expect, it } from "vitest";
import {
  HELIX_WORKSPACE_OS_STATUS_SCHEMA,
  buildHelixWorkspaceOsAuthority,
  summarizeHelixWorkspaceOsCapabilities,
  withHelixWorkspaceOsAuthority,
  type HelixWorkspaceOsStatus,
} from "@shared/helix-workspace-os-status";
import { arbitrateAskSourceTarget } from "../services/helix-ask/ask-source-target-arbitrator";
import { buildCapabilityPlan } from "../services/helix-ask/capability-planner";
import { buildRouteProductContract } from "../services/helix-ask/route-product-contract";
import { buildToolCallAdmissionDecision } from "../services/helix-ask/tool-call-admission";
import { buildHelixToolSurfacePacket } from "../services/helix-ask/tool-router/helix-tool-surface-builder";
import {
  HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
} from "../services/helix-ask/workspace-os-status-intent";
import {
  HELIX_WORKSPACE_OS_STATUS_OBSERVATION_SCHEMA,
  buildWorkspaceOsStatusObservation,
} from "../services/helix-ask/workspace-os-status-tool";

const canonicalGoalFrame = {
  turn_id: "ask:workspace-os",
  goal_kind: "workspace_status_diagnostic",
  answer_scope: "workspace_state",
  required_terminal_kind: "model_synthesized_answer",
  allows_workspace_context: true,
  allows_prior_artifacts: false,
  corpus_anchors: [],
  numeric_tokens: [],
  concept_tokens: ["workspace_os_status"],
  confidence: "high",
  classifier_reasons: ["workspace_os_status_intent"],
};

describe("Helix Ask Workspace OS status tool", () => {
  it("routes status and capability-health prompts to a diagnostic-only tool path", () => {
    const promptText =
      "Check the Workspace OS status: are browser tab capture, clipboard write, source bindings, and runtime memory healthy?";
    const sourceTargetIntent = arbitrateAskSourceTarget({
      turnId: "ask:workspace-os",
      threadId: "helix-ask:test",
      promptText,
    });

    expect(sourceTargetIntent).toMatchObject({
      target_source: "workspace_diagnostic",
      target_kind: "workspace_diagnostic",
      strength: "hard",
      allow_no_tool_direct: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(sourceTargetIntent.requested_outputs).toContain("workspace_os_status");

    const routeContract = buildRouteProductContract({
      turnId: "ask:workspace-os",
      threadId: "helix-ask:test",
      sourceTargetIntent,
      promptText,
    });
    expect(routeContract.source_target).toBe("workspace_diagnostic");
    expect(routeContract.allowed_terminal_artifact_kinds).toContain("model_synthesized_answer");
    expect(routeContract.forbidden_terminal_artifact_kinds).toContain("workspace_action_receipt");
    expect(routeContract.side_artifact_kinds_allowed).toContain("workspace_os_status_observation");

    const admission = buildToolCallAdmissionDecision({
      turnId: "ask:workspace-os",
      sourceTargetIntent,
      routeProductContract: routeContract,
      promptText,
    });
    expect(admission).toMatchObject({
      source_target: "workspace_diagnostic",
      required: true,
      admitted_tool_families: ["workspace_diagnostic"],
      reason: "workspace_diagnostic_requires_workspace_os_status_tool_path",
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(admission.forbidden_terminal_artifact_kinds).toContain("workspace_action_receipt");

    const plan = buildCapabilityPlan({
      turnId: "ask:workspace-os",
      promptText,
      sourceTargetIntent,
      routeProductContract: routeContract,
      toolCallAdmissionDecision: admission,
      canonicalGoalFrame,
    });
    expect(plan).toMatchObject({
      capability_family: "workspace_diagnostic",
      requested_action: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
      mutating: false,
      operator_command_required: false,
      admission_status: "needs_evidence",
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("exposes workspace_os.status in the model-visible tool surface as non-terminal and non-mutating", () => {
    const packet = buildHelixToolSurfacePacket({
      turnId: "ask:workspace-os",
      prompt: "Which workspace capabilities are blocked or unknown in the Workspace OS status plane?",
      maxEntries: 8,
    });
    const entry = packet.entries.find((candidate) => candidate.capability_key === HELIX_WORKSPACE_OS_STATUS_CAPABILITY);

    expect(entry).toBeTruthy();
    expect(entry).toMatchObject({
      panel_id: "workspace-os",
      action: "status",
      runtime_shape: "run_panel_action",
      execution_target: "server_only",
      mutating: false,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(entry?.expected_observation_schema).toBe(HELIX_WORKSPACE_OS_STATUS_OBSERVATION_SCHEMA);
    expect(entry?.safety_tags).toEqual(expect.arrayContaining(["diagnostic_only", "no_raw_content", "non_terminal"]));
  });

  it("builds a sanitized non-terminal Workspace OS observation", () => {
    const capabilities = [
      withHelixWorkspaceOsAuthority({
        capability_id: "clipboard.write",
        surface: "clipboard",
        mode: "read_write",
        status: "unknown",
        label: "Clipboard write",
        missing_reason: "no_client_capability_signal_registered",
        fallbacks: ["workstation.dynamic_actions"],
        evidence_refs: [],
        receipt_refs: [],
      }),
      withHelixWorkspaceOsAuthority({
        capability_id: "runtime.memory",
        surface: "runtime_memory",
        mode: "diagnostic",
        status: "available",
        label: "Runtime memory governor",
        evidence_refs: ["helix.runtime_memory_governor.snapshot.v1"],
        receipt_refs: [],
      }),
    ] as const;
    const status: HelixWorkspaceOsStatus = {
      schema_version: HELIX_WORKSPACE_OS_STATUS_SCHEMA,
      generated_at: "2026-06-05T12:00:00.000Z",
      thread_id: "helix-ask:test",
      room_id: null,
      capabilities: [...capabilities],
      runtime: {
        memory_pressure: "normal",
        active_task_count: 0,
        queued_task_count: 0,
        paused_background_task_count: 0,
        rejected_task_count: 0,
      },
      summary: summarizeHelixWorkspaceOsCapabilities(capabilities),
      authority: buildHelixWorkspaceOsAuthority(),
    };

    const observation = buildWorkspaceOsStatusObservation({ status });

    expect(observation).toMatchObject({
      schema: HELIX_WORKSPACE_OS_STATUS_OBSERVATION_SCHEMA,
      capability_key: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
      status_schema_version: HELIX_WORKSPACE_OS_STATUS_SCHEMA,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(observation.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
    });
    expect(observation.noteworthy_capabilities).toContainEqual(expect.objectContaining({
      capability_id: "clipboard.write",
      status: "unknown",
      authority: expect.objectContaining({
        assistant_answer: false,
        raw_content_included: false,
        terminal_eligible: false,
      }),
    }));
  });
});
