import { readFileSync } from 'node:fs';
import { readTemporalCheckpointEvidence } from '../server/services/environment-connectors/temporal-plans/temporal-checkpoint-evidence';

// Offline diagnostic only: selects recorded rows at explicit cutoffs. It does
// not establish historical transaction ordering or contact a running service.
async function main() {
  const snapshot = JSON.parse(readFileSync('C:/Users/dan/AppData/Roaming/@casimirbot/desktop/state/helix-local-pg-mem.json', 'utf8'));
  const tables = snapshot.tables;
  const parse = (x: any) => typeof x === 'string' ? JSON.parse(x) : x;
  const admission = tables.helix_environment_temporal_plan_admissions.find((r: any) => r.plan_id === 'plan:et6-root-1938');
  for (const cutoff of ['2026-09-06T19:38:25.600Z', '2026-09-06T19:38:26.600Z', '2026-09-06T19:38:27.600Z']) {
    const now = Date.parse(cutoff);
    const db = { query: async (sql: string, args: any[]) => {
      if (sql.includes('FROM helix_environment_temporal_plan_admissions')) return { rows: [admission] };
      if (sql.includes('FROM helix_environment_action_requests')) return { rows: tables.helix_environment_action_requests.filter((r: any) => r.action_request_id === args[0]) };
      if (sql.includes('FROM helix_environment_action_workflow_events')) return { rows: tables.helix_environment_action_workflow_events.filter((r: any) => r.action_request_id === args[0] && r.workflow_id === args[1] && Date.parse(r.received_at) <= now).sort((a: any,b: any) => b.sequence-a.sequence).slice(0,1) };
      if (sql.includes('FROM helix_environment_events')) {
        let rows = tables.helix_environment_events.filter((r: any) => r.workflow_ref === 'et6-root-1938-workflow' && Date.parse(parse(r.event_payload).observed_at) <= now);
        if (sql.includes('WHERE event_id=$1')) rows = rows.filter((r: any) => r.event_id === args[0]);
        if (sql.includes('sequence<=$4')) rows = rows.filter((r: any) => r.sequence <= args[3]);
        else rows = rows.filter((r: any) => Date.parse(parse(r.event_payload).observed_at) > now-5000);
        return { rows: rows.sort((a: any,b: any) => b.sequence-a.sequence).slice(0, sql.includes('LIMIT 256') ? 256 : 1) };
      }
      throw new Error('unhandled offline query');
    }};
    try {
      const result = await readTemporalCheckpointEvidence(db as never, { plan: parse(admission.source_plan), compilation: parse(admission.compilation_artifact), actionRequestId: admission.action_request_id, runId: 'run_37bc3de3-0a24-4134-9c10-afa3dd417cc7', eventId: 'environment_event:f1bf7a3c-3efe-415d-9446-925c2ab69ff4', checkpointId: 'checkpoint:et6-root-1938' });
      console.log(JSON.stringify({ cutoff, verified: true, anchor: result.checkpoint_anchor }));
    } catch (error) { console.log(JSON.stringify({ cutoff, verified: false, code: error instanceof Error ? error.message : 'unknown' })); }
  }
}
void main();
