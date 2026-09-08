import type { HelixReasoningTaskBindingStore } from "../../local-supervisor/reasoning-task-binding-store";
import { listRoomEnvironmentProjections, refreshOwnRoomEnvironmentSubjectEpoch,
  RoomEnvironmentSubjectError } from "../subjects/subject-binding-store";
import { readEnvironmentSessionReadiness, type EnvironmentSessionReadinessInput } from "./session-readiness";
import { recoverEnvironmentSessionGoal } from "./recover-session-goal";
import { isEnvironmentDurableGoalError } from "../goals/durable-goal-store";

const services = {
  inspect: readEnvironmentSessionReadiness,
  environments: listRoomEnvironmentProjections,
  refreshSubject: refreshOwnRoomEnvironmentSubjectEpoch,
  recoverGoal: recoverEnvironmentSessionGoal,
};

/**
 * Bounded setup reconciliation for subject epoch and restart goal recovery;
 * unresolved layers remain explicit blockers, never a fabricated success. No
 * player selection, source rotation, authority renewal, goal creation or dispatch.
 */
export async function readyUpEnvironmentSession(
  input: EnvironmentSessionReadinessInput,
  bindingStore: Pick<HelixReasoningTaskBindingStore, "verifyTaskAssociation">,
  dependencies: typeof services = services,
) {
  const before = await dependencies.inspect(input, bindingStore);
  const repairs: Array<{ layer: "subject" | "goal"; changed: boolean | null; reason_code: string }> = [];
  const subject = before.checks.find(check => check.layer === "subject");
  const source = before.checks.find(check => check.layer === "source");
  // Only recover a known stale binding, not a missing choice or revoked grant.
  if (subject?.state === "stale" && source?.state === "verified") {
    const environments = await dependencies.environments({
      profileId: input.context.profileId, roomId: input.context.roomId,
    });
    const selected = environments.find(environment =>
      environment.environment_binding_id === input.environmentBindingId &&
      environment.room_id === input.context.roomId && environment.source_id === input.sourceId &&
      environment.world_id === input.worldId);
    const prior = selected?.self_subject_binding;
    if (prior && prior.subject_binding_id === input.subjectBindingId &&
        prior.participant_id === input.context.participantId && prior.status !== "revoked") {
      bindingStore.verifyTaskAssociation(input.binding);
      try {
        const refreshed = await dependencies.refreshSubject({
          roomId: input.context.roomId, profileId: input.context.profileId,
          environmentBindingId: input.environmentBindingId, subjectRef: prior.subject_ref,
          subjectBindingId: prior.subject_binding_id, expectedProducerEpochRef: prior.producer_epoch_ref,
        });
        repairs.push({ layer: "subject", changed: refreshed.producer_epoch_ref !== prior.producer_epoch_ref,
          reason_code: "subject_epoch_checked" });
      } catch (error) {
        if (!(error instanceof RoomEnvironmentSubjectError)) throw error;
        repairs.push({ layer: "subject", changed: false, reason_code: error.code });
      }
    }
  }
  // Always inspect again; repairs are not readiness or execution proof.
  let readiness = await dependencies.inspect(input, bindingStore);
  if (readiness.checks.some(check => check.layer === "goal" && check.state !== "verified") &&
      ["source", "subject", "authority", "controller"].every(layer =>
        readiness.checks.some(check => check.layer === layer && check.state === "verified"))) {
    try {
      const recovered = await dependencies.recoverGoal(input, bindingStore);
      repairs.push({ layer: "goal", changed: recovered.changed, reason_code: "goal_recovery_checked" });
      readiness = await dependencies.inspect({ ...input,
        context: { ...input.context, expectedRevision: recovered.goal.revision } }, bindingStore);
    } catch (error) {
      if (!isEnvironmentDurableGoalError(error)) throw error;
      // Earlier ledger steps may have committed before a later step failed.
      repairs.push({ layer: "goal", changed: null, reason_code: error.code });
      readiness = await dependencies.inspect(input, bindingStore);
    }
  }
  return { schema: "helix.environment_session_ready_up.v1" as const,
    selection: { room_id: input.context.roomId, environment_binding_id: input.environmentBindingId },
    readiness, repairs, execution_authority: false as const,
    answer_authority: false as const, assistant_answer: false as const,
    terminal_eligible: false as const };
}
