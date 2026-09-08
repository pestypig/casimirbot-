import { helixEnvironmentTemporalPlanSchema } from "@shared/helix-environment-time";
import { readSharedRealtimeRoomDatabase } from "../../helix-ask/realtime-room/room-store/database";
import { readTemporalCheckpointEvidence } from "./temporal-checkpoint-evidence";
import type { resolveTemporalPerceptionContext } from "./temporal-perception-context";

const json = (value: unknown): any => typeof value === "string" ? JSON.parse(value) : value;

/** Called only after current goal/member/authority/perception admission. This
 * exposes locators for caller-authored successors, never permission to submit.
 * Submission independently revalidates the latest measured event. */
export async function readTemporalSuccessorContext(
  context: Awaited<ReturnType<typeof resolveTemporalPerceptionContext>>,
) {
  const absent = { available: false as const, reason_code: "no_current_verified_checkpoint",
    execution_authority: false as const, answer_authority: false as const, terminal_eligible: false as const };
  const identity = context.goal.identity;
  if (!identity.run_id) return absent;
  const db = await readSharedRealtimeRoomDatabase();
  const events = await db.query(`SELECT event_id,event_payload FROM helix_environment_events
    WHERE environment_binding_id=$1 AND producer_epoch_ref=$2 AND event_payload->>'source_id'=$3
      AND subject_ref=$4 AND event_payload->>'room_id'=$5 AND event_payload->>'world_id'=$6
      AND producer_plane='player_embodiment' AND workflow_ref IS NOT NULL
      AND observed_at<=now() AND observed_at>now()-interval '5 seconds'
    ORDER BY sequence DESC LIMIT 1`, [identity.environment_binding_id, identity.producer_epoch_ref,
    identity.source_id, identity.subject_binding_id, identity.room_id, identity.world_id]);
  if (!events.rows[0]) return absent;
  try {
    const event = json(events.rows[0].event_payload);
    const nativePlanId = event?.attributes?.workflow_measurements?.sequence_id;
    if (typeof nativePlanId !== "string" || !nativePlanId) return absent;
    const plans = await db.query(`SELECT a.source_plan,a.compilation_artifact,a.action_request_id
      FROM helix_environment_temporal_plan_admissions a
      JOIN helix_environment_action_requests r ON r.action_request_id=a.resident_action_request_id
      WHERE a.goal_id=$1 AND r.run_id=$2 AND r.workflow_id=$3
        AND a.compilation_artifact->'arguments'->>'sequence_id'=$4
      ORDER BY a.admitted_at DESC LIMIT 1`,
    [context.goal.goal_id, identity.run_id, event.workflow_ref, nativePlanId]);
    const row = plans.rows[0];
    if (!row) return absent;
    const plan = helixEnvironmentTemporalPlanSchema.parse(json(row.source_plan));
    const expected = { environment_id: identity.environment_binding_id, source_id: identity.source_id,
      subject_id: identity.subject_binding_id, producer_epoch: identity.producer_epoch_ref,
      authority_id: identity.action_authority_id, authority_revision: identity.authority_policy_version,
      goal_id: context.goal.goal_id };
    if (Object.entries(expected).some(([key, value]) => plan.identity[key as keyof typeof expected] !== value) ||
        Number(plan.identity.goal_revision) > context.goal.goal_revision) return absent;
    const compilation = json(row.compilation_artifact);
    const sourceIds = new Set(plan.nodes.filter(node => node.kind === "checkpoint")
      .map(node => node.kind === "checkpoint" ? node.checkpoint_id : ""));
    const settlements = event?.attributes?.workflow_measurements?.checkpoint_settlements;
    if (!Array.isArray(settlements) || settlements.length > 256) return absent;
    const latest = settlements.filter(value => sourceIds.has(value?.checkpoint_id)).at(-1);
    if (!latest) return absent;
    const verified = await readTemporalCheckpointEvidence(db, { plan, compilation,
      actionRequestId: row.action_request_id, runId: identity.run_id,
      eventId: events.rows[0].event_id, checkpointId: latest.checkpoint_id });
    // Current workflow admission still uses verified.event_id. Perception must
    // follow the separately verified measurement of the same checkpoint, not
    // every subsequent progress report that repeats it.
    const perceptionAt = Date.parse(context.evidence.observation.observed_at);
    const anchor = verified.checkpoint_anchor;
    if (!anchor) return { ...absent, reason_code: "checkpoint_anchor_missing" };
    const eventAt = Date.parse(anchor.observed_at);
    const perceptionTick = Number(context.evidence.observation.result.game_tick);
    if (!Number.isFinite(perceptionAt) || !Number.isFinite(eventAt) ||
        !Number.isSafeInteger(perceptionTick) || perceptionTick < 0 ||
        !Number.isSafeInteger(anchor.world_tick_index) || anchor.world_tick_index < 0) {
      return { ...absent, reason_code: "checkpoint_perception_clock_invalid" };
    }
    if (perceptionAt < eventAt || perceptionTick < anchor.world_tick_index) {
      return { ...absent, reason_code: "perception_precedes_verified_checkpoint" };
    }
    return { available: true as const, previous_plan_id: plan.plan_id, previous_plan_hash: plan.plan_hash,
      checkpoint: { event_id: verified.event_id, checkpoint_id: verified.checkpoint_id },
      workflow_id: verified.workflow_id, observed_at: verified.observed_at,
      predecessor_clocks: plan.clocks, predecessor_watermarks: plan.watermarks,
      revalidation_required: true as const, execution_authority: false as const,
      answer_authority: false as const, terminal_eligible: false as const };
  } catch {
    // Races, stale evidence and invalid retained content cannot become locators.
    return absent;
  }
}
