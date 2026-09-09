import { ensureDatabase, getPool } from "../../db/client";

/** Fresh owner/run binding lookup, independent of transport heartbeat. */
export async function isPairingEnvironmentEligible(input: {
  profileId: string; issuer: string; roomId: string; runId: string; participantId: string;
}) {
  await ensureDatabase();
  const result = await getPool().query(`SELECT r.run_id FROM helix_agent_runs r
    JOIN helix_agent_run_room_bindings b ON b.run_id = r.run_id
      AND b.tenant_id = r.tenant_id AND b.issuer = r.issuer
      AND b.subject_id = r.subject_id AND b.account_profile_id = r.account_profile_id
    WHERE r.run_id = $1 AND r.account_profile_id = $2 AND r.issuer = $3
      AND r.lifecycle_status IN ('queued', 'running', 'waiting')
      AND r.expires_at > NOW() AND r.cancelled_at IS NULL AND r.completed_at IS NULL
      AND r.steps_used < r.max_steps AND b.status = 'active'
      AND b.room_id = $4 AND b.participant_id_at_bind = $5 LIMIT 1`,
  [input.runId, input.profileId, input.issuer, input.roomId, input.participantId]);
  return result.rows.length === 1;
}
