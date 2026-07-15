import type { TheoryRuntimeContextObservationV1 } from "./theory-runtime-context.v1";

export const THEORY_RUNTIME_EXPLANATION_ROUTE_SCHEMA = "helix.ask.route_metadata.v1" as const;
export const THEORY_RUNTIME_EXPLANATION_ROUTE_SOURCE = "scientific_calculator_runtime_result" as const;
export const THEORY_RUNTIME_EXPLANATION_INVOCATION_KIND =
  "scientific_calculator_runtime_result_explanation" as const;
export const THEORY_RUNTIME_EXPLANATION_SOURCE_TARGET =
  "scientific_calculator_theory_runtime_result" as const;
export const THEORY_RUNTIME_EXPLANATION_CANONICAL_GOAL = "explain_theory_runtime_result" as const;
export const THEORY_RUNTIME_CONTEXT_READ_CAPABILITY =
  "scientific-calculator.read_visible_theory_run_result" as const;
export const THEORY_RUNTIME_EXECUTE_CAPABILITY = "scientific-calculator.run_theory_runtime" as const;
export const THEORY_RUNTIME_EXPLANATION_TOOL_FAMILY = "scientific-calculator" as const;
export const THEORY_RUNTIME_EXPLANATION_TERMINAL_PRODUCT =
  "calculator_workstation_tool_evaluation" as const;
export const THEORY_RUNTIME_EXPLANATION_PROVIDER_TERMINAL =
  "agent_provider_terminal_candidate" as const;

export type TheoryRuntimeExplanationRouteMetadataV1 = {
  schema: typeof THEORY_RUNTIME_EXPLANATION_ROUTE_SCHEMA;
  source: typeof THEORY_RUNTIME_EXPLANATION_ROUTE_SOURCE;
  invocationKind: typeof THEORY_RUNTIME_EXPLANATION_INVOCATION_KIND;
  sourceTarget: typeof THEORY_RUNTIME_EXPLANATION_SOURCE_TARGET;
  requiredCanonicalGoal: typeof THEORY_RUNTIME_EXPLANATION_CANONICAL_GOAL;
  allowedCapabilities: [typeof THEORY_RUNTIME_CONTEXT_READ_CAPABILITY];
  forbiddenCapabilities: [typeof THEORY_RUNTIME_EXECUTE_CAPABILITY];
  evidenceRefs: [string, string];
  requiredToolFamily: typeof THEORY_RUNTIME_EXPLANATION_TOOL_FAMILY;
  requiredTerminalProductKind: typeof THEORY_RUNTIME_EXPLANATION_TERMINAL_PRODUCT;
  allowedTerminalProductKinds: [
    typeof THEORY_RUNTIME_EXPLANATION_TERMINAL_PRODUCT,
    typeof THEORY_RUNTIME_EXPLANATION_PROVIDER_TERMINAL,
  ];
  compact_context: {
    theory_runtime_context_ref: string;
    request_id: string;
    receipt_id: string;
    runtime_id: string;
    output_role: "evidence_for_synthesis";
    terminal_eligible: false;
    post_tool_model_step_required: true;
  };
};

export const buildTheoryRuntimeExplanationRouteMetadataV1 = (
  context: TheoryRuntimeContextObservationV1,
): TheoryRuntimeExplanationRouteMetadataV1 => ({
  schema: THEORY_RUNTIME_EXPLANATION_ROUTE_SCHEMA,
  source: THEORY_RUNTIME_EXPLANATION_ROUTE_SOURCE,
  invocationKind: THEORY_RUNTIME_EXPLANATION_INVOCATION_KIND,
  sourceTarget: THEORY_RUNTIME_EXPLANATION_SOURCE_TARGET,
  requiredCanonicalGoal: THEORY_RUNTIME_EXPLANATION_CANONICAL_GOAL,
  allowedCapabilities: [THEORY_RUNTIME_CONTEXT_READ_CAPABILITY],
  forbiddenCapabilities: [THEORY_RUNTIME_EXECUTE_CAPABILITY],
  evidenceRefs: [
    `theory_runtime_request:${context.requestId}`,
    `theory_runtime_receipt:${context.receiptId}`,
  ],
  requiredToolFamily: THEORY_RUNTIME_EXPLANATION_TOOL_FAMILY,
  requiredTerminalProductKind: THEORY_RUNTIME_EXPLANATION_TERMINAL_PRODUCT,
  allowedTerminalProductKinds: [
    THEORY_RUNTIME_EXPLANATION_TERMINAL_PRODUCT,
    THEORY_RUNTIME_EXPLANATION_PROVIDER_TERMINAL,
  ],
  compact_context: {
    theory_runtime_context_ref: context.contextId,
    request_id: context.requestId,
    receipt_id: context.receiptId,
    runtime_id: context.runtimeId,
    output_role: "evidence_for_synthesis",
    terminal_eligible: false,
    post_tool_model_step_required: true,
  },
});
