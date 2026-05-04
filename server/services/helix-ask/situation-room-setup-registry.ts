import type {
  SituationRoomSetupActionArgs,
  SituationRoomSetupIntent,
  SituationRoomSetupPlanReceipt,
} from "@shared/helix-situation-setup";

export type RememberedSituationRoomSetupPlan = {
  intent: SituationRoomSetupIntent;
  setup_action_args: SituationRoomSetupActionArgs;
  plan_receipt: SituationRoomSetupPlanReceipt;
  created_at: string;
};

const setupPlans = new Map<string, RememberedSituationRoomSetupPlan>();

export const rememberSituationRoomSetupPlan = (plan: {
  intent: SituationRoomSetupIntent;
  setupActionArgs: SituationRoomSetupActionArgs;
  planReceipt: SituationRoomSetupPlanReceipt;
}): RememberedSituationRoomSetupPlan => {
  const setupCallId = plan.planReceipt.correlation.setup_call_id;
  const remembered: RememberedSituationRoomSetupPlan = {
    intent: plan.intent,
    setup_action_args: plan.setupActionArgs,
    plan_receipt: plan.planReceipt,
    created_at: new Date().toISOString(),
  };
  setupPlans.set(setupCallId, remembered);
  return remembered;
};

export const getSituationRoomSetupPlan = (
  setupCallId: string,
): RememberedSituationRoomSetupPlan | null => setupPlans.get(setupCallId) ?? null;

export const __resetSituationRoomSetupPlanRegistryForTests = (): void => {
  setupPlans.clear();
};
