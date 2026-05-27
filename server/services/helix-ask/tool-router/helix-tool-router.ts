import {
  HELIX_RUNTIME_TOOL_CALL_V1_SCHEMA,
  type HelixAgentStepDecisionV2,
  type HelixRawToolResult,
  type HelixRuntimeToolCallV1,
} from "@shared/helix-agent-step-observation-packet";
import type { HelixToolSurfacePacket } from "@shared/helix-tool-surface";
import {
  buildHelixToolSurfacePacket,
  type BuildHelixToolSurfaceInput,
} from "./helix-tool-surface-builder";
import {
  validateHelixRouterToolCall,
  type HelixToolRouterContext,
} from "./helix-tool-call-validator";
import {
  buildHelixAgentStepObservationPacket,
  buildSituationRoomLiveJobObservationPacket,
} from "./helix-tool-observation-packet";

export class HelixToolRouter {
  buildToolSurfacePacket(input: BuildHelixToolSurfaceInput): HelixToolSurfacePacket {
    return buildHelixToolSurfacePacket(input);
  }

  buildRuntimeToolCallFromDecision(
    decision: HelixAgentStepDecisionV2,
    surface: HelixToolSurfacePacket,
  ): HelixRuntimeToolCallV1 {
    const selected = decision.chosen_capability
      ? surface.entries.find((entry) => entry.capability_key === decision.chosen_capability) ?? null
      : null;
    const call = decision.runtime_tool_call;
    const capabilityKey = selected?.capability_key ?? call?.capability_key ?? decision.chosen_capability ?? "unknown";
    return {
      schema: HELIX_RUNTIME_TOOL_CALL_V1_SCHEMA,
      call_id: call?.call_id ?? `${decision.turn_id}:helix_tool_router:${decision.iteration}:${capabilityKey.replace(/[^a-z0-9]+/gi, "_")}`,
      turn_id: decision.turn_id,
      decision_id: decision.decision_id,
      capability_key: capabilityKey,
      panel_id: selected?.panel_id ?? call?.panel_id ?? "",
      action: selected?.action ?? call?.action ?? "",
      runtime_shape: selected?.runtime_shape ?? (call?.action === "open" ? "open_panel" : "run_panel_action"),
      args: call?.args ?? {},
      validation: {
        ok: false,
        violations: ["not_validated"],
      },
      policy: {
        mutating: selected?.mutating ?? false,
        manual_only: selected?.manual_only ?? false,
        explicit_attachment_only: selected?.explicit_attachment_only ?? false,
        confirmation_required: selected?.confirmation_required ?? false,
        terminal_eligible: false,
      },
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  validateRuntimeToolCall(
    call: HelixRuntimeToolCallV1,
    surface: HelixToolSurfacePacket,
    context: HelixToolRouterContext = {},
  ): HelixRuntimeToolCallV1 {
    return validateHelixRouterToolCall(call, surface, context);
  }

  async dispatchRuntimeToolCall(
    call: HelixRuntimeToolCallV1,
    _context: HelixToolRouterContext = {},
  ): Promise<HelixRawToolResult> {
    if (!call.validation.ok) {
      const firstViolation = call.validation.violations[0] ?? "invalid_tool_call";
      return {
        ok: false,
        status: firstViolation.includes("missing_arg")
          ? "missing_input"
          : firstViolation.includes("confirmation")
            ? "needs_confirmation"
            : "blocked",
        summary: `Tool call ${call.capability_key} was blocked before execution: ${call.validation.violations.join(", ")}.`,
        missing_requirements: call.validation.violations.map((violation) => ({
          code: violation,
          message: violation,
          repair_action: violation.includes("missing_arg") ? "ask_user" : "repair",
        })),
      };
    }
    if (call.runtime_shape === "open_panel") {
      return {
        ok: true,
        status: "client_pending",
        summary: `Prepared open_panel action for ${call.panel_id}; client receipt must re-enter the next model step.`,
        produced_artifact_refs: [call.call_id],
        receipts: [{ receipt_ref: call.call_id, kind: "workspace_action_receipt", status: "pending_client" }],
        state_delta: { opened_panels: [call.panel_id], focused_panel: call.panel_id },
      };
    }
    return {
      ok: true,
      status: "client_pending",
      summary: `Prepared run_panel_action ${call.capability_key}; client/tool receipt must re-enter the next model step.`,
      produced_artifact_refs: [call.call_id],
      receipts: [{ receipt_ref: call.call_id, kind: "workstation_action_receipt", status: "pending_client" }],
    };
  }

  toObservationPacket(args: {
    turnId: string;
    iteration: number;
    call: HelixRuntimeToolCallV1;
    result: HelixRawToolResult;
  }) {
    if (
      args.call.panel_id === "situation-room-pipelines" &&
      /^(?:construct\.|dottie\.|observer\.|voice_delivery\.)/i.test(args.call.action)
    ) {
      return buildSituationRoomLiveJobObservationPacket(args);
    }
    return buildHelixAgentStepObservationPacket(args);
  }
}

export const helixToolRouter = new HelixToolRouter();
