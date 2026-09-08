import { createHash } from "node:crypto";
import { projectEnvironmentSessionReadiness, type EnvironmentSessionCheck,
  type EnvironmentSessionLayer } from "@shared/helix-environment-session-readiness";
import type { HelixReasoningTaskBindingStore } from "../../local-supervisor/reasoning-task-binding-store";
import { readSharedRealtimeRoomMembership } from "../../helix-ask/realtime-room/room-store";
import { listRoomEnvironmentProjections, ensureOwnRoomEnvironmentSubject, RoomEnvironmentSubjectError } from "../subjects/subject-binding-store";
import { readEnvironmentActionAuthorities, readEnvironmentActionConnectorReadiness,
  isEnvironmentActionAuthorityError } from "../actions/authority-store";
import { environmentDurableGoalStore, isEnvironmentDurableGoalError } from "../goals/durable-goal-store";
import { readBoundSessionEvidence, type BoundSessionEvidenceInput } from "./bound-session-evidence";

/** Server-owned readers only; not an RPC-supplied evidence bag. */
const readers = {
  membership: readSharedRealtimeRoomMembership,
  environments: listRoomEnvironmentProjections,
  subject: ensureOwnRoomEnvironmentSubject,
  authorities: readEnvironmentActionAuthorities,
  controllers: readEnvironmentActionConnectorReadiness,
  goal: (input: BoundSessionEvidenceInput["context"]) =>
    environmentDurableGoalStore.resolveTemporalAdmissionContext(input),
  perception: readBoundSessionEvidence,
};

export type EnvironmentSessionReadinessInput = BoundSessionEvidenceInput & {
  environmentBindingId: string;
  sourceId: string;
  worldId: string;
  subjectBindingId: string;
  actionAuthorityId: string;
};

/**
 * Read-only collection, deliberately separate from repair. Reports independent
 * failures after membership/task authentication; never chooses another run,
 * subject, authority or chat. Every action still needs normal admission.
 */
export async function readEnvironmentSessionReadiness(
  input: EnvironmentSessionReadinessInput,
  bindingStore: Pick<HelixReasoningTaskBindingStore, "verifyTaskAssociation">,
  dependencies: typeof readers = readers,
) {
  if (input.context.profileId !== input.binding.profileRef ||
      !input.context.runId || input.context.runId !== input.binding.runId) {
    throw new RoomEnvironmentSubjectError("subject_binding_forbidden", 403,
      "Session readiness requires an exact authenticated environment run.");
  }
  const room = { profileId: input.context.profileId, roomId: input.context.roomId };
  const membership = await dependencies.membership(room);
  if (!membership || membership.participantId !== input.context.participantId ||
      membership.roomStatus === "closed") {
    throw new RoomEnvironmentSubjectError("subject_binding_forbidden", 403,
      "Session readiness requires the current room participant.");
  }
  const binding = bindingStore.verifyTaskAssociation(input.binding);
  const started = Date.now();
  // Fixed field order; never serialize caller objects or credentials into refs.
  const contextRef = `sha256:${createHash("sha256").update(JSON.stringify([
    room.profileId, room.roomId, membership.participantId,
    input.binding.bindingId, input.binding.bindingEpoch, input.binding.helixConversationId,
    input.context.runId, input.context.goalId, input.context.expectedRevision,
    input.environmentBindingId, input.sourceId, input.worldId,
    input.subjectBindingId, input.actionAuthorityId,
  ])).digest("hex")}`;
  const checks: EnvironmentSessionCheck[] = [];
  const add = (layer: EnvironmentSessionLayer, state: EnvironmentSessionCheck["state"],
    evidenceRef: string, reasons: string[] = [], deadline: number | null = null) => {
    checks.push({ layer, state, context_ref: contextRef, evidence_ref: evidenceRef,
      observed_at_ms: started, expires_at_ms: deadline, reason_codes: reasons,
      // Diagnostic failure alone is not evidence that another consent is needed.
      human_approval_required: false });
  };
  const failure = (layer: EnvironmentSessionLayer, error: unknown) => {
    const code = error instanceof RoomEnvironmentSubjectError ||
      isEnvironmentActionAuthorityError(error) || isEnvironmentDurableGoalError(error)
      ? error.code : "session_check_unavailable";
    add(layer, "blocked", `session_check:${layer}`, [code]);
  };
  add("profile", "verified", membership.participantId);
  // verifyTaskAssociation checks the exact service, authenticated MCP client,
  // client session, continuation and live supervisor presence, not just a label.
  add("service", "verified", binding.service_instance_ref);
  add("client", "verified", binding.reasoning_binding_id);
  // Active binding expires_at is a consumed claim deadline, not a session lease.
  add("binding", "verified", binding.reasoning_binding_id);

  try {
    const environments = await dependencies.environments(room);
    const environment = environments.find(row => row.environment_binding_id === input.environmentBindingId);
    const exact = environment && environment.room_id === room.roomId &&
      environment.source_id === input.sourceId && environment.world_id === input.worldId;
    if (!exact) {
      add("source", "blocked", input.environmentBindingId, ["session_source_identity_mismatch"]);
      add("subject", "blocked", input.subjectBindingId, ["session_source_identity_mismatch"]);
    } else {
      add("source", environment.connection_status === "active" &&
        environment.subject_directory?.freshness === "fresh" ? "verified" :
          environment.connection_status === "revoked" ? "revoked" : "stale",
      environment.source_id, environment.connection_status !== "active" ? ["session_source_not_active"] :
        environment.subject_directory?.freshness !== "fresh" ? ["session_source_not_fresh"] : []);
      const subject = environment.self_subject_binding;
      const subjectExact = subject?.subject_binding_id === input.subjectBindingId &&
        subject.participant_id === membership.participantId &&
        subject.room_id === room.roomId && subject.environment_binding_id === input.environmentBindingId &&
        subject.source_id === input.sourceId && subject.world_id === input.worldId;
      if (subjectExact && subject.status === "active") {
        try {
          const verified = await dependencies.subject({ ...room,
            environmentBindingId: input.environmentBindingId, subjectRef: subject.subject_ref });
          add("subject", verified.subject_binding_id === input.subjectBindingId ? "verified" : "stale",
            input.subjectBindingId,
            verified.subject_binding_id === input.subjectBindingId ? [] : ["session_subject_changed_during_read"],
            verified.expires_at ? Date.parse(verified.expires_at) : null);
        } catch (error) { failure("subject", error); }
      } else add("subject", !subjectExact ? "missing" :
        subject.status === "revoked" ? "revoked" : "stale", input.subjectBindingId,
      !subjectExact ? ["session_subject_identity_mismatch"] : ["session_subject_stale"],
      subjectExact && subject.expires_at ? Date.parse(subject.expires_at) : null);
    }
  } catch (error) { failure("source", error); failure("subject", error); }

  const environmentInput = { ...room, environmentBindingId: input.environmentBindingId };
  try {
    const authorities = await dependencies.authorities(environmentInput);
    const authority = authorities.find(row => row.action_authority_id === input.actionAuthorityId);
    const exact = authority && authority.environment_binding_id === input.environmentBindingId &&
      authority.room_id === room.roomId && authority.source_id === input.sourceId &&
      authority.world_id === input.worldId && authority.participant_id === membership.participantId &&
      authority.subject_binding_id === input.subjectBindingId;
    add("authority", !exact ? "missing" : authority.status === "active" && authority.expires_at ? "verified" :
      authority.status === "revoked" ? "revoked" : "blocked", input.actionAuthorityId,
    !exact ? ["session_authority_identity_mismatch"] : !authority.expires_at ? ["session_finite_authority_required"] : authority.status === "active" ? [] : ["session_authority_inactive"],
    exact && authority.expires_at ? Date.parse(authority.expires_at) : null);
  } catch (error) { failure("authority", error); }
  try {
    const controllers = await dependencies.controllers(environmentInput);
    const controller = controllers.find(row => row.action_authority_id === input.actionAuthorityId);
    const heartbeatAt = controller?.heartbeat_received_at ? Date.parse(controller.heartbeat_received_at) : NaN;
    const current = controller?.ready_for_actions && Number.isFinite(heartbeatAt) && heartbeatAt <= Date.now();
    add("controller", current ? "verified" : "blocked", input.actionAuthorityId,
      current ? [] : ["session_controller_not_ready"],
      controller?.heartbeat_received_at ? Date.parse(controller.heartbeat_received_at) + controller.heartbeat_max_age_ms : null);
  } catch (error) { failure("controller", error); }
  try {
    const goal = await dependencies.goal(input.context);
    const exact = goal.goal_id === input.context.goalId && goal.goal_revision === input.context.expectedRevision &&
      goal.identity.run_id === input.context.runId && goal.identity.room_id === room.roomId &&
      goal.identity.environment_binding_id === input.environmentBindingId &&
      goal.identity.source_id === input.sourceId && goal.identity.world_id === input.worldId &&
      goal.identity.subject_binding_id === input.subjectBindingId &&
      goal.identity.action_authority_id === input.actionAuthorityId;
    add("goal", exact ? "verified" : "stale", goal.goal_id,
      exact ? [] : ["session_goal_identity_mismatch"]);
  } catch (error) { failure("goal", error); }
  try {
    const evidence = await dependencies.perception(input, bindingStore);
    add("perception", "verified", evidence.context.evidence.observation.evidence_ref);
  } catch (error) { failure("perception", error); }
  // Do not publish an authenticated snapshot after its binding was revoked.
  bindingStore.verifyTaskAssociation(input.binding);
  return projectEnvironmentSessionReadiness({ context_ref: contextRef, checks,
    now_ms: Date.now(), maximum_check_age_ms: 5_000 });
}
