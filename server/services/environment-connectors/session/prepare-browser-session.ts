import type { ReasoningPreparationTargetStore } from "../../local-supervisor/reasoning-binding-ports";
import { createHash, randomUUID } from "node:crypto";
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
import { EnvironmentSessionPreparationError, type EnvironmentPreparationPhase } from "./preparation-error";
import { readEnvironmentSessionReadiness } from "./session-readiness";
import { projectEnvironmentSessionReadiness } from "@shared/helix-environment-session-readiness";
import { helixEnvironmentDurableGoalSha256, type HelixEnvironmentDurableGoalObjective } from "@shared/helix-environment-durable-goal";

const services = {
  association: resolveReasoningRunAssociation, membership: readSharedRealtimeRoomMembership,
  account: resolveWorkstationGatewayAccountContext,
  goal: environmentDurableGoalStore.findForSession.bind(environmentDurableGoalStore),
  createGoal: environmentDurableGoalStore.create.bind(environmentDurableGoalStore),
  environments: listRoomEnvironmentProjections, refreshSubject: refreshOwnRoomEnvironmentSubjectEpoch,
  observe: executeEnvironmentProbeGatewayCapability, prepare: readyUpEnvironmentSession,
  inspect: readEnvironmentSessionReadiness,
};

/** Owner-scoped setup using an authenticated browser or MCP account context.
 * Never an external-provider reasoning turn. No consent or lease renewal.
 * The MCP adapter additionally supplies and verifies its exact authenticated task.
 */
export async function prepareBrowserEnvironmentSession(input: {
  sessionId: string; profileRef: string; bindingId: string; bindingEpoch: number;
  helixConversationId: string; missionId: string | null; runId: string; requestId: string;
  goalBootstrap?: { environment_binding_id: string; subject_binding_id: string;
    action_authority_id: string; objective: HelixEnvironmentDurableGoalObjective };
}, store: ReasoningPreparationTargetStore,
presence: HelixLocalSupervisorPresence[], dependencies = services,
authenticatedActor?: {
  accountContext: HelixWorkstationGatewayAccountContext;
  target: Parameters<HelixReasoningTaskBindingStore["verifyTaskAssociation"]>[0];
}) {
  const fail = (code: string): never => { throw new HelixReasoningTaskBindingError(code, 409); };
  const preparationRepairs: Awaited<ReturnType<typeof readyUpEnvironmentSession>>["repairs"] = [];
  let uncertain = false;
  let phase: EnvironmentPreparationPhase = "account_context";
  try {
  const accountContext = authenticatedActor?.accountContext ?? await dependencies.account(input.sessionId);
  if (!accountContext.trusted_account_session || accountContext.profile_id !== input.profileRef ||
      accountContext.session_id !== input.sessionId) return fail("reasoning_binding_identity_mismatch");
  phase = "task_target";
  const target = await store.resolveOwnedPreparationTarget({ profileRef: input.profileRef,
    bindingId: input.bindingId, bindingEpoch: input.bindingEpoch,
    helixConversationId: input.helixConversationId, missionId: input.missionId, runId: input.runId });
  if (authenticatedActor) {
    const actor = authenticatedActor.target;
    phase = "task_binding";
    await store.verifyTaskAssociation(actor);
    if (actor.profileRef !== target.profileRef || actor.authenticatedMcpClientRef !== target.authenticatedMcpClientRef ||
        actor.clientSessionRef !== target.clientSessionRef || actor.clientContinuationRef !== target.clientContinuationRef ||
        actor.bindingId !== target.bindingId || actor.bindingEpoch !== target.bindingEpoch ||
        actor.helixConversationId !== target.helixConversationId || actor.missionId !== target.missionId ||
        actor.runId !== target.runId) return fail("reasoning_binding_identity_mismatch");
  }
  const entry = presence.find(row => row.authenticated_profile_ref === input.profileRef &&
    row.client_session_ref === target.clientSessionRef && row.conversation_thread_ref === target.clientContinuationRef &&
    row.authenticated_mcp_client_ref === target.authenticatedMcpClientRef);
  phase = "run_association";
  const association = entry ? await dependencies.association(entry) : null;
  if (!association || association.run_id !== input.runId) return fail("reasoning_binding_run_association_stale");
  let runExpiresAt = Date.parse(association.run_expires_at);
  if (!Number.isFinite(runExpiresAt) || runExpiresAt <= Date.now()) return fail("reasoning_binding_run_association_stale");
  const assertCurrentAssociation = async () => {
    const priorPhase = phase;
    phase = "run_association";
    const current = entry ? await dependencies.association(entry) : null;
    if (!current || current.run_id !== association.run_id || current.room_id !== association.room_id ||
        current.run_version !== association.run_version || current.room_binding_id !== association.room_binding_id ||
        current.room_binding_version !== association.room_binding_version ||
        current.verification_ref !== association.verification_ref) return fail("reasoning_binding_run_association_stale");
    runExpiresAt = Date.parse(current.run_expires_at);
    if (!Number.isFinite(runExpiresAt) || runExpiresAt <= Date.now()) return fail("reasoning_binding_run_association_stale");
    phase = "task_binding";
    await store.verifyTaskAssociation(target);
    phase = priorPhase;
  };
  const roomId = association.room_id;
  phase = "room_membership";
  const member = await dependencies.membership({ roomId, profileId: input.profileRef });
  if (!member || member.roomStatus === "closed") return fail("reasoning_binding_identity_mismatch");
  phase = "goal_lookup";
  let goal = await dependencies.goal({ roomId, profileId: input.profileRef,
    participantId: member.participantId, runId: input.runId });
  const bootstrap = input.goalBootstrap;
  if (!goal && bootstrap) {
    phase = "environment_lookup";
    const candidates = await dependencies.environments({ roomId, profileId: input.profileRef });
    const selected = candidates.find(row => row.room_id === roomId &&
      row.environment_binding_id === bootstrap.environment_binding_id);
    let selectedSubject = selected?.self_subject_binding;
    if (!selectedSubject || selectedSubject.subject_binding_id !== bootstrap.subject_binding_id ||
        selectedSubject.participant_id !== member.participantId || selectedSubject.status === "revoked") {
      return fail("environment_session_subject_changed");
    }
    // First-session setup needs the same epoch recovery as an existing goal.
    // Refresh only the already selected subject; authority is still checked by
    // goal creation, and no permission is renewed by this observation repair.
    if (selectedSubject.status === "stale") {
      await assertCurrentAssociation();
      uncertain = true;
      phase = "subject_refresh";
      const refreshed = await dependencies.refreshSubject({ roomId, profileId: input.profileRef,
        environmentBindingId: bootstrap.environment_binding_id, subjectRef: selectedSubject.subject_ref,
        subjectBindingId: selectedSubject.subject_binding_id, expectedProducerEpochRef: selectedSubject.producer_epoch_ref });
      preparationRepairs.push({ layer: "subject", changed: refreshed.producer_epoch_ref !== selectedSubject.producer_epoch_ref,
        reason_code: "subject_epoch_checked" });
      uncertain = false;
      await assertCurrentAssociation();
      if (refreshed.status !== "active" || refreshed.subject_binding_id !== selectedSubject.subject_binding_id ||
          refreshed.subject_ref !== selectedSubject.subject_ref || refreshed.participant_id !== member.participantId ||
          refreshed.environment_binding_id !== bootstrap.environment_binding_id || refreshed.room_id !== roomId) {
        return fail("environment_session_subject_changed");
      }
      selectedSubject = refreshed;
    }
    await assertCurrentAssociation();
    uncertain = true;
    phase = "goal_creation";
    goal = await dependencies.createGoal({ ownerProfileId: input.profileRef, roomId,
      participantId: member.participantId, environmentBindingId: bootstrap.environment_binding_id,
      subjectNativeId: selectedSubject.subject_ref, actionAuthorityId: bootstrap.action_authority_id,
      runId: input.runId, turnId: `environment_session_goal:${createHash("sha256").update(JSON.stringify([
        input.profileRef, input.bindingId, input.bindingEpoch, input.requestId])).digest("hex")}`,
      objective: bootstrap.objective,
      idempotencyKey: `session:${createHash("sha256").update(JSON.stringify([
        input.bindingId, input.bindingEpoch, input.helixConversationId, input.runId, input.requestId])).digest("hex")}` });
    preparationRepairs.push({ layer: "goal", changed: null, reason_code: "goal_creation_or_replay_verified" });
    uncertain = false;
    await assertCurrentAssociation();
  }
  if (!goal) {
    // Navigation context only: do not invent a goal or select an environment.
    // Revalidate after the goal read before exposing the room setup handoff.
    await assertCurrentAssociation();
    throw new EnvironmentSessionPreparationError(
      new HelixReasoningTaskBindingError("environment_session_goal_missing", 409),
      preparationRepairs, uncertain, { room_id: roomId });
  }
  const identity = goal.identity;
  if (bootstrap && (identity.environment_binding_id !== bootstrap.environment_binding_id ||
      identity.subject_binding_id !== bootstrap.subject_binding_id ||
      identity.action_authority_id !== bootstrap.action_authority_id ||
      helixEnvironmentDurableGoalSha256(goal.objective) !== helixEnvironmentDurableGoalSha256(bootstrap.objective))) {
    return fail("environment_session_goal_conflict");
  }
  phase = "environment_lookup";
  const environments = await dependencies.environments({ roomId, profileId: input.profileRef });
  const environment = environments.find(row => row.environment_binding_id === identity.environment_binding_id &&
    row.room_id === roomId && row.source_id === identity.source_id && row.world_id === identity.world_id);
  const subject = environment?.self_subject_binding;
  if (!subject || subject.subject_binding_id !== identity.subject_binding_id ||
      subject.participant_id !== member.participantId) return fail("environment_session_subject_changed");
  if (subject.status === "stale") {
    await assertCurrentAssociation();
    phase = "task_binding";
    await store.verifyTaskAssociation(target);
    uncertain = true;
    phase = "subject_refresh";
    const refreshed = await dependencies.refreshSubject({ roomId, profileId: input.profileRef,
      environmentBindingId: identity.environment_binding_id, subjectRef: subject.subject_ref,
      subjectBindingId: subject.subject_binding_id, expectedProducerEpochRef: subject.producer_epoch_ref });
    preparationRepairs.push({ layer: "subject", changed: refreshed.producer_epoch_ref !== subject.producer_epoch_ref,
      reason_code: "subject_epoch_checked" });
    uncertain = false;
  }
  // Setup reads may outlive the run or its room association. Revalidate before
  // admitting even the read-only probe, not only after its result returns.
  await assertCurrentAssociation();
  // Keep setup identity stable, but correlate each explicit readiness read
  // separately: replaying a completed probe cannot make its observation fresh.
  // Retransmission of this one read still uses the same broker idempotency key.
  const ref = createHash("sha256").update(JSON.stringify([input.profileRef,
    input.bindingId, input.bindingEpoch, input.requestId])).digest("hex");
  const turnId = `environment_session_preparation:${ref}`;
  phase = "perception_probe";
  const probe = await dependencies.observe({ policy: null, accountContext,
    assertCurrentTarget: assertCurrentAssociation,
    conversationThreadId: `helix-ask:room:${roomId}`, turnId,
    toolCallId: `${turnId}:observe:${randomUUID()}`, providerExecutionId: turnId,
    capabilityId: HELIX_MINECRAFT_PERCEPTION_SNAPSHOT_READ_CAPABILITY,
    arguments: { target: "current_actor", freshness_requirement_ms: 5_000 },
    expectedEnvironmentIdentity: { roomId, environmentBindingId: identity.environment_binding_id,
      sourceId: identity.source_id, worldId: identity.world_id,
      subjectBindingId: identity.subject_binding_id, subjectNativeId: identity.subject_native_id },
  });
  phase = "task_binding";
  await store.verifyTaskAssociation(target);
  const observation = helixEnvironmentProbeObservationSchema.safeParse(probe.observation);
  if (!probe.ok || !observation.success || observation.data.outcome !== "succeeded" ||
      observation.data.capability_id !== HELIX_MINECRAFT_PERCEPTION_SNAPSHOT_READ_CAPABILITY ||
      !observation.data.provenance_valid || !observation.data.eligible_for_current_turn_reentry) {
    // A rejected probe is not readiness, but must not hide independent setup
    // blockers (such as a finite grant requiring owner review). Inspect only;
    // never recover a goal using missing or rejected observation evidence.
    await assertCurrentAssociation();
    phase = "readiness_inspection";
    const diagnostic = await dependencies.inspect({ binding: target,
      context: { profileId: input.profileRef, participantId: member.participantId, roomId,
        runId: input.runId, goalId: goal.goal_id, expectedRevision: goal.revision, turnId,
        probeRequestId: observation.success ? observation.data.probe_request_ref : `${turnId}:unobserved`, priorTurnId: turnId },
      environmentBindingId: identity.environment_binding_id, sourceId: identity.source_id,
      worldId: identity.world_id, subjectBindingId: identity.subject_binding_id,
      actionAuthorityId: identity.action_authority_id,
    }, store);
    await assertCurrentAssociation();
    const readiness = projectEnvironmentSessionReadiness({ context_ref: diagnostic.context_ref,
      now_ms: Date.now(), maximum_check_age_ms: 5000,
      checks: diagnostic.checks.map(check => check.layer === "perception" ? {
        ...check, state: "blocked" as const, human_approval_required: false,
        reason_codes: ["environment_session_observation_unavailable"],
      } : check),
    });
    return { schema: "helix.environment_session_ready_up.v1" as const,
      selection: { room_id: roomId, environment_binding_id: identity.environment_binding_id },
      session_deadlines: { run_expires_at_ms: runExpiresAt },
      readiness, repairs: preparationRepairs, execution_authority: false as const,
      answer_authority: false as const, assistant_answer: false as const, terminal_eligible: false as const };
  }
  await assertCurrentAssociation();
  uncertain = true;
  phase = "session_recovery";
  const receipt = await dependencies.prepare({ binding: target,
    context: { profileId: input.profileRef, participantId: member.participantId, roomId,
      runId: input.runId, goalId: goal.goal_id, expectedRevision: goal.revision, turnId,
      probeRequestId: observation.data.probe_request_ref, priorTurnId: turnId },
    environmentBindingId: identity.environment_binding_id, sourceId: identity.source_id,
    worldId: identity.world_id, subjectBindingId: identity.subject_binding_id,
    actionAuthorityId: identity.action_authority_id,
  }, store);
  preparationRepairs.push(...receipt.repairs);
  uncertain = receipt.repairs.some(repair => repair.changed === null);
  await assertCurrentAssociation();
  // Final association reads can outlive the observation-backed readiness.
  // Keep completed repairs, but never publish an expired ready receipt.
  if (receipt.readiness.ready && (receipt.readiness.valid_until_ms === null ||
      !Number.isFinite(receipt.readiness.valid_until_ms) ||
      receipt.readiness.valid_until_ms <= Date.now())) {
    return fail("environment_session_readiness_expired");
  }
  return { ...receipt, repairs: preparationRepairs,
    session_deadlines: { run_expires_at_ms: runExpiresAt },
    readiness: { ...receipt.readiness, valid_until_ms: receipt.readiness.valid_until_ms === null
      ? null : Math.min(receipt.readiness.valid_until_ms, runExpiresAt) } };
  } catch (error) {
    if (error instanceof EnvironmentSessionPreparationError) throw error;
    throw new EnvironmentSessionPreparationError(error, preparationRepairs, uncertain, undefined, phase);
  }
}
