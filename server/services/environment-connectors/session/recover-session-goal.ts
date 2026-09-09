import type { ReasoningTaskAssociationVerifier } from "../../local-supervisor/reasoning-binding-ports";
import { helixEnvironmentDurableGoalSha256 } from "@shared/helix-environment-durable-goal";
import { environmentDurableGoalStore, resolveCurrentEnvironmentDurableGoalIdentity,
  EnvironmentDurableGoalError } from "../goals/durable-goal-store";
import { readSharedRealtimeRoomDatabase } from "../../helix-ask/realtime-room/room-store/database";
import { readExactEnvironmentPerceptionEvidence } from "../temporal-plans/temporal-perception-context";
import type { EnvironmentSessionReadinessInput } from "./session-readiness";

const services = {
  goals: environmentDurableGoalStore,
  database: readSharedRealtimeRoomDatabase,
  identity: resolveCurrentEnvironmentDurableGoalIdentity,
  perception: readExactEnvironmentPerceptionEvidence,
};
type RecoveryServices = Omit<typeof services, "goals"> & {
  goals: Pick<typeof environmentDurableGoalStore, "inspect" | "resolveTemporalAdmissionContext" | "append">;
};

/** Fixed recovery lifecycle only; no strategy, new goal, new authority or action. */
export async function recoverEnvironmentSessionGoal(
  input: EnvironmentSessionReadinessInput,
  bindingStore: ReasoningTaskAssociationVerifier,
  dependencies: RecoveryServices = services,
) {
  const fail = () => new EnvironmentDurableGoalError("durable_goal_identity_mismatch", 409,
    "Ready up requires the exact existing task, run, environment and player.");
  if (!input.context.runId || input.context.runId !== input.binding.runId ||
      input.context.profileId !== input.binding.profileRef) throw fail();
  await bindingStore.verifyTaskAssociation(input.binding);
  let goal = await dependencies.goals.inspect(input.context);
  const prior = goal.identity;
  if (prior.run_id !== input.context.runId || prior.room_id !== input.context.roomId ||
      prior.environment_binding_id !== input.environmentBindingId || prior.source_id !== input.sourceId ||
      prior.world_id !== input.worldId || prior.subject_binding_id !== input.subjectBindingId) throw fail();
  if (goal.status === "active" && !goal.recovery.required) {
    await dependencies.goals.resolveTemporalAdmissionContext({ ...input.context, expectedRevision: goal.revision });
    await bindingStore.verifyTaskAssociation(input.binding);
    return { goal, changed: false, execution_authority: false as const,
      answer_authority: false as const, terminal_eligible: false as const };
  }
  if (goal.status !== "recovery_required" || !goal.recovery.required ||
      !["disconnect", "fabric_restart", "helix_restart", "connector_epoch_changed"].includes(goal.recovery.reason ?? "")) {
    throw new EnvironmentDurableGoalError("durable_goal_authority_stale", 409,
      "This recovery reason requires explicit operator intent; Ready up will not resume it.");
  }
  // Use the revision just inspected, not a stale UI projection. Each append
  // still compares that exact revision atomically; conflicts are not retried.
  const request = { ownerProfileId: input.context.profileId, roomId: input.context.roomId,
    participantId: input.context.participantId, environmentBindingId: input.environmentBindingId,
    subjectNativeId: prior.subject_native_id, actionAuthorityId: input.actionAuthorityId,
    runId: input.context.runId, turnId: input.context.turnId };
  const identity = await dependencies.identity(await dependencies.database(), { ...request,
    ownerProfileId: prior.owner_profile_id, goalOwnerParticipantId: prior.goal_owner_participant_id,
    authorityParticipantId: prior.authority_participant_id });
  if (identity.subject_binding_id !== input.subjectBindingId || identity.source_id !== input.sourceId ||
      identity.world_id !== input.worldId || identity.environment_binding_id !== input.environmentBindingId ||
      identity.subject_native_id !== prior.subject_native_id) throw fail();
  const readEvidence = () => dependencies.perception({ identity,
    probeRequestId: input.context.probeRequestId, priorTurnId: input.context.priorTurnId });
  const { evidence } = await readEvidence();
  const revision = evidence.observation.result.observation_revision;
  if (typeof revision !== "number" || !Number.isSafeInteger(revision) || revision < 0) throw new EnvironmentDurableGoalError(
    "durable_goal_evidence_identity_mismatch", 409, "Recovery requires an exact observation revision.");
  const refs = [evidence.observation.evidence_ref];
  const append = async (payload: Parameters<typeof environmentDurableGoalStore.append>[0]["payload"]) => {
    // Recheck freshness/identity and exact binding at each bounded lifecycle step.
    const fresh = await readEvidence();
    if (fresh.evidence.observation.evidence_ref !== refs[0] ||
        fresh.evidence.observation.result.observation_revision !== revision) throw fail();
    await bindingStore.verifyTaskAssociation(input.binding);
    goal = await dependencies.goals.append({ ...request, goalId: goal.goal_id,
      expectedRevision: goal.revision, payload, evidenceRefs: refs });
  };
  if (!goal.recovery.rebound_event_id) await append({ kind: "authority_rebound",
    superseded_producer_epoch_ref: prior.producer_epoch_ref, fresh_observation_revision: revision });
  const facts = { environment_binding_id: identity.environment_binding_id,
    subject_binding_id: identity.subject_binding_id, source_id: identity.source_id,
    observation_revision: revision };
  const checkpointId = `checkpoint:ready-up:${helixEnvironmentDurableGoalSha256({
    goal_id: goal.goal_id, rebound_event_id: goal.recovery.rebound_event_id, evidence_refs: refs,
  })}`;
  if (goal.latest_checkpoint?.checkpoint_id !== checkpointId) await append({ kind: "checkpoint_verified",
    checkpoint_id: checkpointId, milestone_id: null, observation_revision: revision, verified_facts: facts,
    completed_postcondition_ids: [], incomplete_postcondition_ids: [],
    checkpoint_evidence_hash: helixEnvironmentDurableGoalSha256({ evidence_refs: refs,
      observation_revision: revision, verified_facts: facts,
      completed_postcondition_ids: [], incomplete_postcondition_ids: [] }) });
  await append({ kind: "goal_resumed", recovery_checkpoint_id: checkpointId });
  await bindingStore.verifyTaskAssociation(input.binding);
  return { goal, changed: true, execution_authority: false as const,
    answer_authority: false as const, terminal_eligible: false as const };
}
