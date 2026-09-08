import type { HelixEnvironmentActionRequest } from "@shared/helix-environment-action";
import type { HelixReasoningTaskBindingStore } from "../../local-supervisor/reasoning-task-binding-store";
import { enqueueEnvironmentAction } from "../actions/action-broker";
import { preflightTemporalPlan } from "./temporal-plan-preflight";
import { TemporalPlanError } from "./temporal-plan-error";

/** Internal composition only. Callers must derive binding identity from their
 * authenticated task context, not from arbitrary tool arguments. The broker
 * still owns capability, authority, transaction and execution admission. */
export async function admitTemporalPlan(input: {
  preflight: Parameters<typeof preflightTemporalPlan>[0];
  request: Omit<HelixEnvironmentActionRequest, "arguments" | "temporal_plan" |
    "temporal_plan_canonical_json" | "temporal_compilation_hash" | "temporal_compilation_canonical_json">;
  checkpoint?: { eventId: string; checkpointId: string };
}, bindingStore: Pick<HelixReasoningTaskBindingStore, "verifyTaskAssociation">) {
  const frozen = structuredClone(input);
  const binding = frozen.preflight.binding;
  if (!binding.runId || frozen.request.run_id !== binding.runId ||
      frozen.request.participant_id !== frozen.preflight.context.participantId ||
      frozen.request.action_kind !== (frozen.preflight.compilation.target === "serial" ? "execute_sequence" : "execute_reactive_program")) {
    throw new TemporalPlanError("temporal_admission_request_context_mismatch");
  }
  const preflight = await preflightTemporalPlan(frozen.preflight, bindingStore);
  const revalidateTask = () => { bindingStore.verifyTaskAssociation(binding); };
  revalidateTask();
  return enqueueEnvironmentAction({ profileId: frozen.preflight.context.profileId,
    requestingParticipantId: frozen.preflight.context.participantId,
    request: { ...frozen.request, arguments: preflight.compilation.arguments, temporal_plan: preflight.plan },
  }, { retention: { preflight, bindingId: binding.bindingId, bindingEpoch: binding.bindingEpoch,
    continuationRef: binding.clientContinuationRef, runId: binding.runId, checkpoint: frozen.checkpoint }, revalidateTask });
}
