import { createHash } from "node:crypto";
import { HELIX_MINECRAFT_PERCEPTION_SNAPSHOT_READ_CAPABILITY, helixEnvironmentProbeObservationSchema } from "@shared/helix-environment-connector";
import type { HelixLocalSupervisorPresence } from "@shared/helix-local-supervisor-coordination";
import { HelixReasoningTaskBindingError, type HelixReasoningTaskBindingStore } from "../../local-supervisor/reasoning-task-binding-store";
import { resolveReasoningRunAssociation } from "../../local-supervisor/reasoning-run-association";
import { readSharedRealtimeRoomMembership } from "../../helix-ask/realtime-room/room-store";
import { resolveWorkstationGatewayAccountContext } from "../../helix-ask/workstation-tool-gateway/account-policy";
import type { HelixWorkstationGatewayAccountContext } from "../../helix-ask/workstation-tool-gateway/account-policy";
import { executeEnvironmentProbeGatewayCapability } from "../../helix-ask/workstation-tool-gateway/environment-probe";
import { environmentDurableGoalStore } from "../goals/durable-goal-store";
import { listRoomEnvironmentProjections, refreshOwnRoomEnvironmentSubjectEpoch } from "../subjects/subject-binding-store";
import { readyUpEnvironmentSession } from "./ready-up-session";

const services = {
  association: resolveReasoningRunAssociation, membership: readSharedRealtimeRoomMembership,
  account: resolveWorkstationGatewayAccountContext,
  goal: environmentDurableGoalStore.findForSession.bind(environmentDurableGoalStore),
  environments: listRoomEnvironmentProjections, refreshSubject: refreshOwnRoomEnvironmentSubjectEpoch,
  observe: executeEnvironmentProbeGatewayCapability, prepare: readyUpEnvironmentSession,
};

/** Owner-scoped setup using an authenticated browser or MCP account context.
 * Never an external-provider reasoning turn. No consent or lease renewal.
 * The MCP adapter additionally supplies and verifies its exact authenticated task.
 */
export async function prepareBrowserEnvironmentSession(input: {
  sessionId: string; profileRef: string; bindingId: string; bindingEpoch: number;
  helixConversationId: string; missionId: string | null; runId: string; requestId: string;
}, store: Pick<HelixReasoningTaskBindingStore, "resolveOwnedPreparationTarget" | "verifyTaskAssociation">,
presence: HelixLocalSupervisorPresence[], dependencies = services,
authenticatedActor?: {
  accountContext: HelixWorkstationGatewayAccountContext;
  target: Parameters<HelixReasoningTaskBindingStore["verifyTaskAssociation"]>[0];
}) {
  const fail = (code: string): never => { throw new HelixReasoningTaskBindingError(code, 409); };
  const accountContext = authenticatedActor?.accountContext ?? await dependencies.account(input.sessionId);
  if (!accountContext.trusted_account_session || accountContext.profile_id !== input.profileRef ||
      accountContext.session_id !== input.sessionId) return fail("reasoning_binding_identity_mismatch");
  const target = store.resolveOwnedPreparationTarget({ profileRef: input.profileRef,
    bindingId: input.bindingId, bindingEpoch: input.bindingEpoch,
    helixConversationId: input.helixConversationId, missionId: input.missionId, runId: input.runId });
  if (authenticatedActor) {
    const actor = authenticatedActor.target;
    store.verifyTaskAssociation(actor);
    if (actor.profileRef !== target.profileRef || actor.authenticatedMcpClientRef !== target.authenticatedMcpClientRef ||
        actor.clientSessionRef !== target.clientSessionRef || actor.clientContinuationRef !== target.clientContinuationRef ||
        actor.bindingId !== target.bindingId || actor.bindingEpoch !== target.bindingEpoch ||
        actor.helixConversationId !== target.helixConversationId || actor.missionId !== target.missionId ||
        actor.runId !== target.runId) return fail("reasoning_binding_identity_mismatch");
  }
  const entry = presence.find(row => row.authenticated_profile_ref === input.profileRef &&
    row.client_session_ref === target.clientSessionRef && row.conversation_thread_ref === target.clientContinuationRef &&
    row.authenticated_mcp_client_ref === target.authenticatedMcpClientRef);
  const association = entry ? await dependencies.association(entry) : null;
  if (!association || association.run_id !== input.runId) return fail("reasoning_binding_run_association_stale");
  const roomId = association.room_id;
  const member = await dependencies.membership({ roomId, profileId: input.profileRef });
  if (!member || member.roomStatus === "closed") return fail("reasoning_binding_identity_mismatch");
  const goal = await dependencies.goal({ roomId, profileId: input.profileRef,
    participantId: member.participantId, runId: input.runId });
  if (!goal) return fail("environment_session_goal_missing");
  const identity = goal.identity;
  const environments = await dependencies.environments({ roomId, profileId: input.profileRef });
  const environment = environments.find(row => row.environment_binding_id === identity.environment_binding_id &&
    row.room_id === roomId && row.source_id === identity.source_id && row.world_id === identity.world_id);
  const subject = environment?.self_subject_binding;
  if (!subject || subject.subject_binding_id !== identity.subject_binding_id ||
      subject.participant_id !== member.participantId) return fail("environment_session_subject_changed");
  if (subject.status === "stale") {
    store.verifyTaskAssociation(target);
    await dependencies.refreshSubject({ roomId, profileId: input.profileRef,
      environmentBindingId: identity.environment_binding_id, subjectRef: subject.subject_ref,
      subjectBindingId: subject.subject_binding_id, expectedProducerEpochRef: subject.producer_epoch_ref });
  }
  store.verifyTaskAssociation(target);
  // Stable per-request broker deduplication, explicitly not a Codex execution ID.
  const ref = createHash("sha256").update(JSON.stringify([input.profileRef,
    input.bindingId, input.bindingEpoch, input.requestId])).digest("hex");
  const turnId = `environment_session_preparation:${ref}`;
  const probe = await dependencies.observe({ policy: null, accountContext,
    assertCurrentTarget: () => { store.verifyTaskAssociation(target); },
    conversationThreadId: `helix-ask:room:${roomId}`, turnId,
    toolCallId: `${turnId}:observe`, providerExecutionId: turnId,
    capabilityId: HELIX_MINECRAFT_PERCEPTION_SNAPSHOT_READ_CAPABILITY,
    arguments: { target: "current_actor", freshness_requirement_ms: 5_000 },
    expectedEnvironmentIdentity: { roomId, environmentBindingId: identity.environment_binding_id,
      sourceId: identity.source_id, worldId: identity.world_id,
      subjectBindingId: identity.subject_binding_id, subjectNativeId: identity.subject_native_id },
  });
  store.verifyTaskAssociation(target);
  const observation = helixEnvironmentProbeObservationSchema.safeParse(probe.observation);
  if (!probe.ok || !observation.success || observation.data.outcome !== "succeeded" ||
      observation.data.capability_id !== HELIX_MINECRAFT_PERCEPTION_SNAPSHOT_READ_CAPABILITY ||
      !observation.data.provenance_valid || !observation.data.eligible_for_current_turn_reentry) {
    return fail("environment_session_observation_unavailable");
  }
  return dependencies.prepare({ binding: target,
    context: { profileId: input.profileRef, participantId: member.participantId, roomId,
      runId: input.runId, goalId: goal.goal_id, expectedRevision: goal.revision, turnId,
      probeRequestId: observation.data.probe_request_ref, priorTurnId: turnId },
    environmentBindingId: identity.environment_binding_id, sourceId: identity.source_id,
    worldId: identity.world_id, subjectBindingId: identity.subject_binding_id,
    actionAuthorityId: identity.action_authority_id,
  }, store);
}
