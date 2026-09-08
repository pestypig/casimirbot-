// Keep this query compatible with both PostgreSQL and the packaged pg-mem
// store. In particular, pg-mem cannot resolve the target alias in UPDATE FROM.
// Call only after the broker validates the retained temporal evidence chain.
export const temporalDeliveryStatusSql = `UPDATE helix_environment_action_requests
  SET status=$3,updated_at=now(),
    completed_at=CASE WHEN $3 IN ('succeeded','failed','canceled','timed_out','emergency_stopped','connector_offline','authority_stale')
      THEN now() ELSE completed_at END
  WHERE action_request_id IN (
    SELECT action_request_id FROM helix_environment_temporal_plan_admissions
    WHERE resident_action_request_id=$1 AND plan_id=$2
  ) AND action_request_id<>$1
    AND status IN ('leased','running','paused_manual_override','cancel_requested')`;
