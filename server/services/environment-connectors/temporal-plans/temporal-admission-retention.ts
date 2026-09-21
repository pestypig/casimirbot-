import { TemporalPlanError } from "./temporal-plan-error";
import type { PoolClient } from "pg";
import { helixEnvironmentTemporalPlanSchema, helixEnvironmentTimeSha256 } from "@shared/helix-environment-time";
import type { preflightTemporalPlan } from "./temporal-plan-preflight";
import { readTemporalCheckpointEvidence } from "./temporal-checkpoint-evidence";

type Preflight = Awaited<ReturnType<typeof preflightTemporalPlan>>;
const json = (value: unknown): any => typeof value === "string" ? JSON.parse(value) : value;

/** Internal transaction participant, not an admission API. The broker must call
 * this before committing its action INSERT, after current authority/task checks.
 * Resolves successor checkpoint evidence before retention, but does not authorize
 * dispatch or prove resident handoff. */
export async function retainTemporalAdmission(db: PoolClient, input: {
  preflight: Preflight; actionRequestId: string;
  /** Broker-owned newly inserted, non-executable request. Never a replay. */
  unpublished?: boolean;
  /** Legacy SQL column names retain both exact room bindings and direct-MCP
   * context IDs. The disjoint ID prefixes prevent cross-kind lineage reuse. */
  bindingId: string; bindingEpoch: number; continuationRef: string; runId: string;
  checkpoint?: { eventId: string; checkpointId: string };
}) {
  const plan = helixEnvironmentTemporalPlanSchema.parse(input.preflight.plan);
  const compilation = input.preflight.compilation;
  const { compilation_hash, ...compiledBody } = compilation;
  if (compilation_hash !== helixEnvironmentTimeSha256(compiledBody) ||
      compilation.source_plan_id !== plan.plan_id || compilation.source_plan_hash !== plan.plan_hash ||
      compilation.source_goal_id !== plan.identity.goal_id || compilation.source_goal_revision !== plan.identity.goal_revision) {
    throw new TemporalPlanError("temporal_retention_compilation_mismatch");
  }
  if (!input.bindingId || !input.continuationRef || !Number.isSafeInteger(input.bindingEpoch) || input.bindingEpoch < 1) {
    throw new TemporalPlanError("temporal_retention_binding_invalid");
  }
  const association = input.preflight.association;
  if (association.associationId !== input.bindingId || association.associationEpoch !== input.bindingEpoch ||
      association.runId !== input.runId || association.continuationRef !== input.continuationRef) {
    throw new TemporalPlanError("temporal_retention_task_mismatch");
  }
  // Publisher and pruning also lock this goal row: revision cannot change while
  // its frontier is being pinned to the admitted action.
  const goals = await db.query(`SELECT current_sequence, status FROM helix_environment_durable_goals
    WHERE goal_id=$1 FOR UPDATE`, [plan.identity.goal_id]);
  if (goals.rows[0]?.status !== "active" || Number(goals.rows[0]?.current_sequence) !== plan.identity.goal_revision) {
    throw new TemporalPlanError("temporal_retention_goal_stale");
  }
  const frontiers = await db.query(`SELECT frontier_payload, payload_hash FROM helix_environment_temporal_frontiers
    WHERE frontier_id=$1 AND goal_id=$2 AND goal_revision=$3
      AND observed_at<=now() AND retained_until>now() FOR UPDATE`,
    [input.preflight.frontier.frontier_id, plan.identity.goal_id, plan.identity.goal_revision]);
  const frontier = frontiers.rows[0];
  if (!frontier || frontier.payload_hash !== helixEnvironmentTimeSha256(json(frontier.frontier_payload)) ||
      frontier.payload_hash !== helixEnvironmentTimeSha256(input.preflight.frontier) ||
      helixEnvironmentTimeSha256(input.preflight.frontier.identity) !== helixEnvironmentTimeSha256(plan.identity)) {
    throw new TemporalPlanError("temporal_retention_frontier_stale");
  }
  const rows = await db.query(`SELECT request_payload, policy_version, status FROM helix_environment_action_requests
    WHERE action_request_id=$1 FOR UPDATE`, [input.actionRequestId]);
  const action = rows.rows[0];
  if (action?.status === "queued" && !input.unpublished) {
    throw new TemporalPlanError("temporal_retention_action_already_dispatched");
  }
  const payload = json(action?.request_payload ?? null);
  if (!action || !payload || payload.action_request_id !== input.actionRequestId || payload.run_id !== input.runId ||
      payload.action_authority_id !== plan.identity.authority_id || Number(action.policy_version) !== plan.identity.authority_revision ||
      payload.environment_binding_id !== plan.identity.environment_id || payload.source_id !== plan.identity.source_id ||
      payload.subject_binding_id !== plan.identity.subject_id ||
      helixEnvironmentTimeSha256(payload.temporal_plan) !== helixEnvironmentTimeSha256(plan) ||
      helixEnvironmentTimeSha256(payload.arguments) !== helixEnvironmentTimeSha256(compilation.arguments)) {
    throw new TemporalPlanError("temporal_retention_action_mismatch");
  }
  const grants = await db.query(`SELECT scopes FROM helix_environment_durable_goal_participants
    WHERE goal_id=$1 AND profile_id=$2 AND participant_id=$3 AND status='active' FOR UPDATE`,
    [plan.identity.goal_id, association.profileRef, payload.participant_id]);
  const scopes = json(grants.rows[0]?.scopes ?? []);
  if (!Array.isArray(scopes) || !scopes.includes("steer")) throw new TemporalPlanError("temporal_retention_goal_forbidden");
  const existing = await db.query(`SELECT * FROM helix_environment_temporal_plan_admissions
    WHERE plan_id=$1 OR action_request_id=$2`, [plan.plan_id, input.actionRequestId]);
  if (existing.rows.length) {
    const row = existing.rows[0];
    if (typeof row.resident_action_request_id !== "string" || !row.resident_action_request_id ||
        (plan.previous_plan_id === null && row.resident_action_request_id !== input.actionRequestId)) {
      throw new TemporalPlanError("temporal_retention_resident_unresolved");
    }
    const checkpoint = json(row.checkpoint_association ?? null);
    if (plan.previous_plan_id !== null && (!input.checkpoint || checkpoint?.event_id !== input.checkpoint.eventId ||
        checkpoint?.checkpoint_id !== input.checkpoint.checkpointId)) throw new TemporalPlanError("temporal_retention_checkpoint_replay_conflict");
    if (existing.rows.length !== 1 || row.plan_id !== plan.plan_id || row.plan_hash !== plan.plan_hash ||
        row.compilation_hash !== compilation_hash || row.action_request_id !== input.actionRequestId ||
        row.frontier_id !== input.preflight.frontier.frontier_id || row.reasoning_binding_id !== input.bindingId ||
        Number(row.reasoning_binding_epoch) !== input.bindingEpoch || row.client_continuation_ref !== input.continuationRef) {
      throw new TemporalPlanError("temporal_retention_replay_conflict");
    }
    return { retained: true as const, replay: true, resident_action_request_id: row.resident_action_request_id as string, execution_authority: false as const };
  }
  // Never retrofit an already dispatched action with temporal authority metadata.
  if (action.status !== (input.unpublished ? "queued" : "admitted")) throw new TemporalPlanError("temporal_retention_action_already_dispatched");
  let checkpointAssociation = null;
  let residentActionRequestId = input.actionRequestId;
  if (plan.previous_plan_id !== null) {
    if (!input.checkpoint) throw new TemporalPlanError("temporal_retention_checkpoint_required");
    const predecessor = await db.query(`SELECT source_plan, reasoning_binding_id, reasoning_binding_epoch,
      client_continuation_ref, action_request_id, compilation_artifact, resident_action_request_id FROM helix_environment_temporal_plan_admissions
      WHERE plan_id=$1 AND plan_hash=$2 FOR UPDATE`, [plan.previous_plan_id, plan.previous_plan_hash]);
    assertTemporalPredecessorAssociation(plan, predecessor.rows[0], input);
    const inheritedResident = predecessor.rows[0].resident_action_request_id;
    if (typeof inheritedResident !== "string" || !inheritedResident) throw new TemporalPlanError("temporal_retention_resident_unresolved");
    residentActionRequestId = inheritedResident;
    // The locked predecessor serializes successor selection. Identical replay
    // returned above; a different successor needs a separately settled
    // cancellation/replacement protocol, not another ordinary append.
    const successors = await db.query(`SELECT plan_id FROM helix_environment_temporal_plan_admissions
      WHERE previous_plan_id=$1 LIMIT 1`, [plan.previous_plan_id]);
    if (successors.rows.length) throw new TemporalPlanError("temporal_retention_successor_already_admitted");
    checkpointAssociation = await readTemporalCheckpointEvidence(db, {
      plan: json(predecessor.rows[0].source_plan), compilation: json(predecessor.rows[0].compilation_artifact),
      actionRequestId: predecessor.rows[0].action_request_id, runId: input.runId,
      eventId: input.checkpoint.eventId, checkpointId: input.checkpoint.checkpointId,
    });
    const frontierTime = Date.parse(input.preflight.frontier.clocks.audit_at);
    const anchor = checkpointAssociation.checkpoint_anchor;
    const anchorTime = anchor ? Date.parse(anchor.observed_at) : NaN;
    // The reader still verifies the latest running event and exact checkpoint.
    // Repeated progress must not move the checkpoint's measurement forward.
    if (!anchor || !Number.isFinite(anchorTime) || !Number.isSafeInteger(anchor.world_tick_index) ||
        anchor.world_tick_index < 0 || !Number.isFinite(frontierTime) || frontierTime < anchorTime ||
        input.preflight.frontier.clocks.environment.resolution_unit !== "minecraft_world_tick" ||
        input.preflight.frontier.clocks.environment.sequence < anchor.world_tick_index) {
      throw new TemporalPlanError("temporal_retention_frontier_predates_checkpoint");
    }
  }
  await db.query(`INSERT INTO helix_environment_temporal_plan_admissions
    (plan_id,plan_hash,source_plan,compilation_hash,compilation_artifact,action_request_id,
     frontier_id,goal_id,goal_revision,reasoning_binding_id,reasoning_binding_epoch,
     client_continuation_ref,previous_plan_id,previous_plan_hash,checkpoint_association,resident_action_request_id)
    VALUES ($1,$2,$3::jsonb,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16)`,
    [plan.plan_id, plan.plan_hash, JSON.stringify(plan), compilation_hash, JSON.stringify(compilation),
      input.actionRequestId, input.preflight.frontier.frontier_id, plan.identity.goal_id, plan.identity.goal_revision,
      input.bindingId, input.bindingEpoch, input.continuationRef, plan.previous_plan_id, plan.previous_plan_hash,
      checkpointAssociation === null ? null : JSON.stringify(checkpointAssociation), residentActionRequestId]);
  return { retained: true as const, replay: false, resident_action_request_id: residentActionRequestId, execution_authority: false as const };
}

/** Association prerequisite only; checkpoint settlement and resident handoff
 * are separate requirements and cannot be inferred from this comparison. */
export function assertTemporalPredecessorAssociation(
  plan: ReturnType<typeof helixEnvironmentTemporalPlanSchema.parse>,
  row: Record<string, unknown> | undefined,
  binding: { bindingId: string; bindingEpoch: number; continuationRef: string },
) {
  if (!row || row.reasoning_binding_id !== binding.bindingId ||
      Number(row.reasoning_binding_epoch) !== binding.bindingEpoch || row.client_continuation_ref !== binding.continuationRef) {
    throw new TemporalPlanError("temporal_retention_predecessor_binding_mismatch");
  }
  const previous = helixEnvironmentTemporalPlanSchema.parse(json(row.source_plan));
  if (previous.plan_id !== plan.previous_plan_id || previous.plan_hash !== plan.previous_plan_hash ||
      previous.plan_id === plan.plan_id) throw new TemporalPlanError("temporal_retention_predecessor_hash_mismatch");
  for (const key of ["environment_id", "source_id", "subject_id", "producer_epoch", "authority_id",
    "authority_revision", "goal_id"] as const) {
    if (previous.identity[key] !== plan.identity[key]) throw new TemporalPlanError("temporal_retention_predecessor_identity_mismatch");
  }
  if (previous.identity.goal_revision > plan.identity.goal_revision) throw new TemporalPlanError("temporal_retention_predecessor_revision_regressed");
  if (previous.clocks.environment.kind !== plan.clocks.environment.kind ||
      previous.clocks.environment.resolution_unit !== plan.clocks.environment.resolution_unit ||
      previous.clocks.monotonic.origin_id !== plan.clocks.monotonic.origin_id) {
    throw new TemporalPlanError("temporal_retention_predecessor_clock_mismatch");
  }
  const boundary = previous.clocks.environment.sequence + previous.watermarks.committed_through_unit;
  if (!Number.isSafeInteger(boundary) || plan.nodes.some(node => {
    if (node.kind !== "action") return false;
    const start = plan.clocks.environment.sequence + node.timing.earliest_start_unit;
    return !Number.isSafeInteger(start) || start < boundary;
  })) {
    throw new TemporalPlanError("temporal_retention_committed_window_overlap");
  }
}
