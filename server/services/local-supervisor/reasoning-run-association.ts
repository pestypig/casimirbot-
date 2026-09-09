import type { HelixLocalSupervisorPresence } from "@shared/helix-local-supervisor-coordination";
import { ensureDatabase, getPool } from "../../db/client";

export type ReasoningRunAssociation = {
  run_id: string;
  run_version: number;
  room_id: string;
  room_binding_id: string;
  room_binding_version: number;
  verification_ref: string;
  run_expires_at: string;
};

/** Revalidate a server-verified presence snapshot; advisory run_ref is not proof. */
export const resolveReasoningRunAssociation = async (
  presence: HelixLocalSupervisorPresence,
): Promise<ReasoningRunAssociation | null> => {
  const runtime = presence.verified_retained_runtime_identity;
  const room = presence.verified_room_identity;
  const now = Date.now();
  if (!presence.active || !runtime || !room ||
      runtime.basis !== "server_verified" || room.basis !== "server_verified" ||
      !(Date.parse(presence.observed_at) <= now) ||
      !(Date.parse(presence.heartbeat_expires_at) > now) ||
      presence.run_ref !== runtime.run_ref || presence.room_ref !== room.room_ref) return null;
  await ensureDatabase();
  const { rows } = await getPool().query(
    `SELECT r.run_id, r.expires_at
       FROM helix_agent_runs r
       JOIN helix_agent_run_room_bindings b ON b.run_id = r.run_id
        AND b.tenant_id = r.tenant_id AND b.issuer = r.issuer
        AND b.subject_id = r.subject_id AND b.account_profile_id = r.account_profile_id
      WHERE r.run_id = $1 AND r.account_profile_id = $2 AND r.version = $3
        AND r.lifecycle_status IN ('queued', 'running', 'waiting')
        AND r.expires_at > NOW() AND r.cancelled_at IS NULL
        AND r.completed_at IS NULL AND r.steps_used < r.max_steps
        AND b.binding_id = $4 AND b.version = $5 AND b.status = 'active'
        AND b.room_id = $6 AND b.participant_id_at_bind = $7
      LIMIT 1`,
    [runtime.run_ref, presence.authenticated_profile_ref, runtime.run_version,
      runtime.run_room_binding_ref, runtime.run_room_binding_version,
      room.room_ref, room.participant_ref],
  );
  if (!rows.length) return null;
  const expires = new Date(rows[0].expires_at).getTime();
  if (!Number.isFinite(expires) || expires <= Date.now()) return null;
  return {
    run_id: runtime.run_ref, run_version: runtime.run_version,
    room_id: room.room_ref, room_binding_id: runtime.run_room_binding_ref,
    room_binding_version: runtime.run_room_binding_version,
    verification_ref: runtime.verification_ref,
    run_expires_at: new Date(expires).toISOString(),
  };
};
