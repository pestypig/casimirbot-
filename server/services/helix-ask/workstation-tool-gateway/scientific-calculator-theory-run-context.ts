import {
  isTheoryRuntimeContextObservationV1,
  THEORY_RUNTIME_CONTEXT_SCHEMA,
  type TheoryRuntimeContextObservationV1,
} from "@shared/contracts/theory-runtime-context.v1";
import type { HelixWorkstationCapabilityManifest } from "./types";

export const SCIENTIFIC_CALCULATOR_THEORY_RUN_CONTEXT_CAPABILITY =
  "scientific-calculator.read_visible_theory_run_result" as const;

export const scientificCalculatorTheoryRunContextManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: SCIENTIFIC_CALCULATOR_THEORY_RUN_CONTEXT_CAPABILITY,
  label: "Read selected theory runtime result",
  description:
    "Reads one explicitly selected, bounded Scientific Calculator theory-runtime receipt as evidence for model synthesis. It does not execute a runtime and cannot become the answer by itself.",
  panel_id: "scientific-calculator",
  action_id: "read_visible_theory_run_result",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["request_id", "receipt_id"],
    properties: {
      request_id: { type: "string" },
      receipt_id: { type: "string" },
      theory_runtime_context: { type: "object" },
      active_theory_runtime_context: { type: "object" },
      workspace_context: { type: "object" },
      source_target_intent: { type: "object" },
    },
  },
  output_observation_schema: THEORY_RUNTIME_CONTEXT_SCHEMA,
  observation_schema: THEORY_RUNTIME_CONTEXT_SCHEMA,
  produces_affordances: ["source_ref", "claim_boundary"],
  typed_handoff_role: "producer",
  safety_tags: ["read_or_observe", "calculator", "runtime_receipt", "evidence_for_synthesis", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

const text = (value: unknown): string => typeof value === "string" ? value.trim() : "";

function findContext(args: Record<string, unknown>): TheoryRuntimeContextObservationV1 | null {
  const workspace = record(args.workspace_context);
  const candidates = [
    args.theory_runtime_context,
    args.active_theory_runtime_context,
    workspace?.activeTheoryRuntimeContext,
    workspace?.active_theory_runtime_context,
  ];
  return candidates.find(isTheoryRuntimeContextObservationV1) ?? null;
}

export function buildScientificCalculatorTheoryRunContextGatewayObservation(args: Record<string, unknown>) {
  const requestId = text(args.request_id);
  const receiptId = text(args.receipt_id);
  const context = findContext(args);
  const mismatch = context && (context.requestId !== requestId || context.receiptId !== receiptId);
  const blockedReason = !requestId || !receiptId
    ? "theory_runtime_result_identity_required"
    : !context
      ? "theory_runtime_context_missing"
      : mismatch
        ? "theory_runtime_context_identity_mismatch"
        : null;
  if (blockedReason || !context) {
    return {
      ok: false,
      admissionStatus: "blocked" as const,
      admissionReason: blockedReason ?? "theory_runtime_context_missing",
      blockedReason: blockedReason ?? "theory_runtime_context_missing",
      observationStatus: "blocked" as const,
      panelId: "scientific-calculator" as const,
      action: "read_visible_theory_run_result" as const,
      summary: "The selected theory runtime result could not be admitted with an exact request and receipt identity.",
      observation: {
        schema: THEORY_RUNTIME_CONTEXT_SCHEMA,
        status: "blocked",
        blocked_reason: blockedReason,
        requested_request_id: requestId || null,
        requested_receipt_id: receiptId || null,
        available_request_id: context?.requestId ?? null,
        available_receipt_id: context?.receiptId ?? null,
        output_role: "evidence_for_synthesis",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      missingRequirements: [{
        code: blockedReason ?? "theory_runtime_context_missing",
        message: "Bind the exact selected request and receipt from the Scientific Calculator before asking for an explanation.",
        repair_action: "ask_user" as const,
      }],
      error: blockedReason ?? "theory_runtime_context_missing",
    };
  }
  const observation = {
    ...context,
    capability_key: SCIENTIFIC_CALCULATOR_THEORY_RUN_CONTEXT_CAPABILITY,
    panel_id: "scientific-calculator",
    action_id: "read_visible_theory_run_result",
    output_role: "evidence_for_synthesis",
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  return {
    ok: true,
    admissionStatus: "admitted" as const,
    admissionReason: "explicit_theory_runtime_receipt_binding",
    blockedReason: undefined,
    observationStatus: "succeeded" as const,
    panelId: "scientific-calculator" as const,
    action: "read_visible_theory_run_result" as const,
    summary: `Read bounded runtime receipt ${context.receiptId} for ${context.runtimeId}; model synthesis remains required.`,
    observation,
    missingRequirements: undefined,
    error: undefined,
  };
}
