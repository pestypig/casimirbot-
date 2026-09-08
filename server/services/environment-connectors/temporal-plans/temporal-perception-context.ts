import { HELIX_MINECRAFT_PERCEPTION_SNAPSHOT_READ_CAPABILITY } from "@shared/helix-environment-connector";
import { environmentDurableGoalStore, EnvironmentDurableGoalError } from "../goals/durable-goal-store";
import { readDurableEnvironmentProbeContinuationEvidence } from "../probe/durable-broker";
import { readSharedRealtimeRoomDatabase } from "../../helix-ask/realtime-room/room-store/database";
import { resolveEnvironmentTemporalActionCatalog } from "../actions/action-broker";
import { TEMPORAL_OBSERVATION_MAX_AGE_MS } from "./temporal-observation-window";

/** Internal frontier prerequisite, never a dispatch or an authorization receipt. */
export const resolveTemporalPerceptionContext = async (input:
  Parameters<typeof environmentDurableGoalStore.resolveTemporalAdmissionContext>[0] & {
    probeRequestId: string; priorTurnId: string;
  }) => {
  const goal = await environmentDurableGoalStore.resolveTemporalAdmissionContext(input);
  const identity = goal.identity;
  const catalog = await resolveEnvironmentTemporalActionCatalog({ profileId: input.profileId,
    roomId: identity.room_id, environmentBindingId: identity.environment_binding_id,
    participantId: identity.authority_participant_id });
  const current = catalog.context;
  if (current.actionAuthorityId !== identity.action_authority_id ||
      current.policyVersion !== identity.authority_policy_version ||
      current.environmentBindingId !== identity.environment_binding_id ||
      current.roomId !== identity.room_id || current.sourceId !== identity.source_id ||
      current.worldId !== identity.world_id || current.subjectBindingId !== identity.subject_binding_id ||
      current.subjectNativeId !== identity.subject_native_id ||
      catalog.action_producer_epoch_ref !== identity.producer_epoch_ref || catalog.truncated) {
    throw new EnvironmentDurableGoalError("durable_goal_authority_stale", 409,
      "The temporal catalog no longer matches the complete goal action identity.");
  }
  const perception = await readExactEnvironmentPerceptionEvidence({
    identity, probeRequestId: input.probeRequestId, priorTurnId: input.priorTurnId,
  });
  return { goal, ...perception, catalog,
    action_producer_epoch_ref: identity.producer_epoch_ref,
    execution_authority: false as const, answer_authority: false as const,
    terminal_eligible: false as const };
};

/**
 * Internal evidence read for an already-authorized exact environment identity.
 * Does not require the goal to be active: recovery needs fresh evidence before
 * it can resume a goal. Caller must establish membership/task/current authority;
 * never accept the identity itself as untrusted RPC authorization.
 */
export const readExactEnvironmentPerceptionEvidence = async (input: {
  identity: Awaited<ReturnType<typeof environmentDurableGoalStore.resolveTemporalAdmissionContext>>["identity"];
  probeRequestId: string;
  priorTurnId: string;
}) => {
  const { identity } = input;
  const db = await readSharedRealtimeRoomDatabase();
  // Observation and Player Embodiment producers are distinct planes.
  const selected = await db.query<{ producer_epoch_ref: string }>(
    `SELECT d.producer_epoch_ref FROM helix_environment_connector_bindings b
      JOIN helix_environment_connector_devices d ON d.device_id=b.device_id AND d.installation_id=b.installation_id
      JOIN helix_environment_connector_installations i ON i.installation_id=b.installation_id
      JOIN helix_room_source_bindings s ON s.binding_id=b.room_source_binding_id
      JOIN helix_environment_adapter_admissions a ON a.admission_id=b.adapter_admission_id
        AND a.binding_id=b.room_source_binding_id AND a.room_id=b.room_id
        AND a.source_id=b.source_id AND a.world_id=b.world_id
      JOIN helix_room_source_credentials c ON c.credential_id=a.credential_id
     WHERE b.environment_binding_id=$1 AND b.room_id=$2 AND b.source_id=$3
       AND b.world_id=$4 AND b.room_source_binding_id=$5
       AND b.status='active' AND d.status='active' AND i.status='active'
       AND s.status='active' AND a.status='active' AND c.status='active'
       AND (c.expires_at IS NULL OR c.expires_at > now()) LIMIT 1;`,
    [identity.environment_binding_id, identity.room_id, identity.source_id,
      identity.world_id, identity.room_source_binding_id],
  );
  const observationEpoch = selected.rows[0]?.producer_epoch_ref;
  if (!observationEpoch) throw new EnvironmentDurableGoalError(
    "durable_goal_identity_unavailable", 409, "The current observation producer is unavailable.");
  const evidence = await readDurableEnvironmentProbeContinuationEvidence({
    requestId: input.probeRequestId, expectedPriorTurnId: input.priorTurnId,
    expectedRoomId: identity.room_id,
    expectedCapabilityId: HELIX_MINECRAFT_PERCEPTION_SNAPSHOT_READ_CAPABILITY,
    maxAgeMs: TEMPORAL_OBSERVATION_MAX_AGE_MS,
    expectedEnvironmentIdentity: {
      environmentBindingId: identity.environment_binding_id, sourceId: identity.source_id,
      worldId: identity.world_id, subjectBindingId: identity.subject_binding_id,
      subjectNativeId: identity.subject_native_id, observationProducerEpochRef: observationEpoch,
    },
  });
  if (!evidence || evidence.observation.result.snapshot_schema !== "helix.minecraft_perception_snapshot.v1") {
    throw new EnvironmentDurableGoalError("durable_goal_evidence_identity_mismatch", 409,
      "A fresh exact-player perception snapshot is required for temporal planning.");
  }
  return { evidence, observation_producer_epoch_ref: observationEpoch,
    execution_authority: false as const, answer_authority: false as const,
    terminal_eligible: false as const };
};
