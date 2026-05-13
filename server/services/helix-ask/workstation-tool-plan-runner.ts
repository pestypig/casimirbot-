import type {
  HelixWorkstationToolPlan,
  HelixWorkstationToolPlanStep,
} from "../../../shared/helix-workstation-tool-plan";

export type WorkstationToolPlanRunnableAction = {
  step_id: string;
  panel_id: string;
  action_id: string;
  args: Record<string, unknown>;
  expected_receipt_kind?: string | null;
};

export function getRunnableWorkstationToolPlanActions(
  plan: HelixWorkstationToolPlan | null | undefined,
): WorkstationToolPlanRunnableAction[] {
  if (!plan) return [];
  return plan.steps
    .filter((step): step is HelixWorkstationToolPlanStep & { panel_id: string; action_id: string } =>
      (step.kind === "open_panel" || step.kind === "run_panel_action" || step.kind === "run_job") &&
      typeof step.panel_id === "string" &&
      step.panel_id.trim().length > 0 &&
      typeof step.action_id === "string" &&
      step.action_id.trim().length > 0,
    )
    .map((step) => ({
      step_id: step.step_id,
      panel_id: step.panel_id,
      action_id: step.action_id,
      args: step.args && typeof step.args === "object" ? step.args : {},
      expected_receipt_kind: step.expected_receipt_kind ?? null,
    }));
}

