import {
  HELIX_WORKSTATION_TOOL_EVALUATION_SCHEMA,
  type HelixWorkstationActionReceipt,
  type WorkstationToolEvaluation,
} from "../../../shared/helix-workstation-affordance";

export type EvaluateWorkstationToolReceiptInput = {
  thread_id: string;
  turn_id?: string | null;
  goal_id?: string | null;
  subgoal_id?: string | null;
  receipt: HelixWorkstationActionReceipt | Record<string, unknown>;
  expected_result_text?: string | null;
};

function newId(prefix: string): string {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function includesExpected(value: string | null, expected: string | null | undefined): boolean {
  if (!value || !expected) return false;
  return value.toLowerCase().includes(expected.toLowerCase());
}

export function evaluateWorkstationToolReceipt(input: EvaluateWorkstationToolReceiptInput): WorkstationToolEvaluation {
  const receipt = input.receipt as Record<string, unknown>;
  const artifact = asRecord(receipt.artifact);
  const panelId = getString(receipt.panel_id) ?? getString(artifact?.panel_id) ?? "unknown";
  const actionId = getString(receipt.action_id) ?? getString(artifact?.action_id) ?? "unknown";
  const ok = receipt.ok === true;
  const evidenceRefs = Array.isArray(receipt.evidence_refs)
    ? receipt.evidence_refs.filter((entry: unknown): entry is string => typeof entry === "string")
    : [`workstation:${panelId}.${actionId}`];

  let result: WorkstationToolEvaluation["result"] = ok ? "supports_subgoal" : "insufficient";
  let summary = ok
    ? `${panelId}.${actionId} completed with a receipt.`
    : `${panelId}.${actionId} did not produce a successful receipt.`;

  if (panelId === "scientific-calculator") {
    const resultText = getString(artifact?.result_text);
    if (!ok) {
      result = "insufficient";
      summary = getString(receipt.message) ?? "Calculator did not produce a usable result.";
    } else if (input.expected_result_text && !includesExpected(resultText, input.expected_result_text)) {
      result = "contradicts_subgoal";
      summary = `Calculator result ${resultText ?? "unknown"} does not match expected result ${input.expected_result_text}.`;
    } else {
      result = "supports_subgoal";
      summary = `Calculator verified ${getString(artifact?.normalized_expression) ?? "the expression"} with result ${resultText ?? "available in receipt"}.`;
    }
  } else if (panelId === "workstation-notes") {
    result = ok ? "stored_for_reference" : "insufficient";
    summary = ok
      ? `Note action stored reference material without injecting raw text into Ask.`
      : `Note action failed or did not return a receipt.`;
  } else if (panelId === "theory-badge-graph") {
    const kind = getString(artifact?.kind);
    if (!ok) {
      result = "insufficient";
      summary = getString(receipt.message) ?? "Theory badge graph action did not produce a usable receipt.";
    } else if (kind === "helix_physics_calculation_context_plan") {
      const nextActions = Array.isArray(artifact?.next_actions) ? artifact.next_actions.length : 0;
      result = nextActions > 0 ? "needs_followup_tool" : "supports_subgoal";
      summary =
        nextActions > 0
          ? "Physics context plan located theory badges and proposed follow-up workstation actions."
          : "Physics context plan located theory badges and claim boundaries.";
    } else if (kind === "theory_badge_locator") {
      result = "supports_subgoal";
      summary = "Theory locator matched relevant badges and claim boundaries.";
    } else if (kind === "theory_calculator_loadout_loaded") {
      result = "needs_followup_tool";
      summary = "Theory calculator loadout was loaded but not solved.";
    } else if (kind === "theory_calculator_loadout_solve" || kind === "theory_calculator_loadout_solved") {
      result = "supports_subgoal";
      summary = "Theory calculator loadout returned scalar traces and context rows.";
    } else if (kind === "starsim_runtime_receipt") {
      result = "supports_subgoal";
      summary = "StarSim runtime receipt returned classification context and claim boundaries.";
    }
  } else if (String(receipt.receipt_kind ?? "").includes("live_source")) {
    const status = getString(artifact?.status);
    result = status === "active" || artifact?.latest_tick ? "supports_subgoal" : "needs_followup_tool";
    summary =
      result === "supports_subgoal"
        ? `Live source is active and has observable state.`
        : `Live source receipt exists but needs a first tick or active status before the subgoal is satisfied.`;
  }

  return {
    schema: HELIX_WORKSTATION_TOOL_EVALUATION_SCHEMA,
    evaluation_id: newId("workstation-tool-eval"),
    thread_id: input.thread_id,
    turn_id: input.turn_id ?? null,
    goal_id: input.goal_id ?? null,
    subgoal_id: input.subgoal_id ?? null,
    tool_receipt_id: getString(receipt.receipt_id) ?? "receipt:unknown",
    result,
    summary,
    evidence_refs: evidenceRefs,
    model_invoked: false,
    deterministic_gate: true,
    created_at: new Date().toISOString(),
  };
}
