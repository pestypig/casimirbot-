import { readSharedRealtimeRoomDatabase } from '../../helix-ask/realtime-room/room-store/database';
import { readEnvironmentActionObservation, resolveEnvironmentActionWorkflowControlContext, terminalRequestStatusForOutcome } from './action-broker';

const terminal = new Set(['succeeded', 'failed', 'canceled', 'timed_out',
  'emergency_stopped', 'connector_offline', 'authority_stale']);

/** Historical result only. Never substitutes for a current control observation. */
export async function readRetainedEnvironmentWorkflowResult(
  input: Parameters<typeof resolveEnvironmentActionWorkflowControlContext>[0],
  deps = {
    resolveContext: resolveEnvironmentActionWorkflowControlContext,
    readDatabase: readSharedRealtimeRoomDatabase,
    readObservation: readEnvironmentActionObservation,
  },
) {
  const context = await deps.resolveContext(input);
  const db = await deps.readDatabase();
  // A caller timestamp cannot order a rolling chain. Until the native chain
  // provides an exact terminal locator, expose only an unambiguous request.
  const latest = async () => (await db.query<{
    action_request_id: string; status: string;
  }>(`SELECT action_request_id, status FROM helix_environment_action_requests
      WHERE room_id=$1 AND workflow_id=$2 AND participant_id=$3
        AND action_authority_id=$4 AND environment_binding_id=$5
      LIMIT 2`,
    [context.roomId, context.workflowId, context.participantId,
      context.actionAuthorityId, context.environmentBindingId])).rows;
  const rows = await latest();
  const row = rows.length === 1 ? rows[0] : null;
  if (!row || !terminal.has(row.status)) return null;
  const result = await deps.readObservation(row.action_request_id);
  if (!result || !result.provenance_valid || !result.eligible_for_current_turn_reentry ||
      result.action_request_ref !== row.action_request_id || result.workflow_ref !== context.workflowId ||
      terminalRequestStatusForOutcome(result.outcome) !== row.status) return null;
  const current = await deps.resolveContext(input);
  if (Object.keys(context).some(key => context[key as keyof typeof context] !== current[key as keyof typeof current])) return null;
  const after = await latest();
  if (after.length !== 1 || after[0].action_request_id !== row.action_request_id || after[0].status !== row.status) return null;
  // Preserve the retained timestamp, release measurement and evidence references.
  // This says nothing about another workflow or controls asserted since then.
  return result;
}
