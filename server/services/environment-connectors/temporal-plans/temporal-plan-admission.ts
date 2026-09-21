import type { ReasoningTaskAssociationVerifier } from "../../local-supervisor/reasoning-binding-ports";
import type { HelixEnvironmentActionRequest } from "@shared/helix-environment-action";
import { enqueueEnvironmentAction } from "../actions/action-broker";
import { preflightTemporalPlan, preflightTemporalPlanWithAssociation } from "./temporal-plan-preflight";
import { TemporalPlanError } from "./temporal-plan-error";
import type { TemporalExecutionAssociation, TemporalExecutionAssociationVerifier } from "./temporal-execution-association";
import { registerDirectMcpTemporalAssociation } from "./direct-mcp-temporal-registry";

/** Internal composition only. Callers must derive binding identity from their
 * authenticated task context, not from arbitrary tool arguments. The broker
 * still owns capability, authority, transaction and execution admission. */
export async function admitTemporalPlan(input: {
  preflight: Parameters<typeof preflightTemporalPlan>[0];
  request: Omit<HelixEnvironmentActionRequest, "arguments" | "temporal_plan" |
    "temporal_plan_canonical_json" | "temporal_compilation_hash" | "temporal_compilation_canonical_json">;
  checkpoint?: { eventId: string; checkpointId: string };
}, bindingStore: ReasoningTaskAssociationVerifier) {
  const frozen = structuredClone(input);
  const binding = frozen.preflight.binding;
  if (!binding.runId || frozen.request.run_id !== binding.runId ||
      frozen.request.participant_id !== frozen.preflight.context.participantId ||
      frozen.request.action_kind !== (frozen.preflight.compilation.target === "serial" ? "execute_sequence" : "execute_reactive_program")) {
    throw new TemporalPlanError("temporal_admission_request_context_mismatch");
  }
  const preflight = await preflightTemporalPlan(frozen.preflight, bindingStore);
  const revalidateTask = async () => { await bindingStore.verifyTaskAssociation(binding); };
  await revalidateTask();
  return enqueueEnvironmentAction({ profileId: frozen.preflight.context.profileId,
    requestingParticipantId: frozen.preflight.context.participantId,
    request: { ...frozen.request, arguments: preflight.compilation.arguments, temporal_plan: preflight.plan },
  }, { retention: { preflight, bindingId: preflight.association.associationId,
    bindingEpoch: preflight.association.associationEpoch,
    continuationRef: preflight.association.continuationRef, runId: preflight.association.runId,
    checkpoint: frozen.checkpoint }, revalidateTask });
}

/** Direct authenticated-MCP path. It has no chat pickup/ack transport and must
 * never be represented as a verified provider-thread binding. */
export async function admitDirectTemporalPlan(input: {
  preflight: Parameters<typeof preflightTemporalPlanWithAssociation>[0];
  request: Omit<HelixEnvironmentActionRequest, "arguments" | "temporal_plan" |
    "temporal_plan_canonical_json" | "temporal_compilation_hash" | "temporal_compilation_canonical_json">;
  checkpoint?: { eventId: string; checkpointId: string };
}, verifyAssociation: TemporalExecutionAssociationVerifier) {
  const frozen = structuredClone(input);
  const association: TemporalExecutionAssociation = frozen.preflight.association;
  if (association.kind !== "direct_mcp_client" || !association.runId ||
      frozen.request.run_id !== association.runId ||
      frozen.request.room_id !== association.roomId ||
      frozen.request.participant_id !== association.participantId ||
      frozen.request.action_kind !== (frozen.preflight.compilation.target === "serial"
        ? "execute_sequence" : "execute_reactive_program")) {
    throw new TemporalPlanError("temporal_admission_request_context_mismatch");
  }
  const preflight = await preflightTemporalPlanWithAssociation(frozen.preflight, verifyAssociation);
  const revalidateTask = async () => { await verifyAssociation(association); };
  await revalidateTask();
  if (!(await registerDirectMcpTemporalAssociation({ association, verify: verifyAssociation }))) {
    throw new TemporalPlanError("temporal_direct_context_identity_mismatch");
  }
  return enqueueEnvironmentAction({ profileId: association.profileRef,
    requestingParticipantId: association.participantId,
    request: { ...frozen.request, arguments: preflight.compilation.arguments, temporal_plan: preflight.plan },
  }, { retention: { preflight, bindingId: association.associationId,
    bindingEpoch: association.associationEpoch, continuationRef: association.continuationRef,
    runId: association.runId, checkpoint: frozen.checkpoint }, revalidateTask });
}
