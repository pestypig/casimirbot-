import { expect, it } from "vitest";
import { newDb } from "pg-mem";
import { temporalSuccessorCandidatesSql } from "../temporal-successor-query";

it("polls an empty successor queue and filters exact identity on packaged SQL", async () => {
  const memory = newDb();
  memory.public.none(`CREATE TABLE helix_environment_temporal_plan_admissions (
    action_request_id text, resident_action_request_id text, previous_plan_id text, previous_plan_hash text,
    checkpoint_association jsonb, reasoning_binding_id text, reasoning_binding_epoch integer, client_continuation_ref text);
    CREATE TABLE helix_environment_action_requests (
    action_request_id text, request_payload jsonb, deadline_at timestamptz, action_authority_id text,
    connector_manifest_id text, status text);`);
  const { Pool } = memory.adapters.createPg();
  const pool = new Pool();
  const identity = ["root", "predecessor", "hash", "authority", "manifest"];
  try {
    // This exact original production syntax throws even on the empty queue.
    await expect(pool.query(temporalSuccessorCandidatesSql + " OF a", identity)).rejects.toThrow();
    expect((await pool.query(temporalSuccessorCandidatesSql, identity)).rows).toEqual([]);
    await pool.query(`INSERT INTO helix_environment_temporal_plan_admissions VALUES
      ('child','root','predecessor','hash','{}','binding',1,'continuation');
      INSERT INTO helix_environment_action_requests VALUES
      ('child','{}',now()+interval '1 day','authority','manifest','admitted');`);
    expect((await pool.query(temporalSuccessorCandidatesSql, identity)).rows).toHaveLength(1);
    for (let i = 0; i < identity.length; i++) {
      const wrong = [...identity]; wrong[i] = "wrong";
      expect((await pool.query(temporalSuccessorCandidatesSql, wrong)).rows).toEqual([]);
    }
    for (const status of ["queued", "failed", "canceled"]) {
      await pool.query("UPDATE helix_environment_action_requests SET status=$1", [status]);
      expect((await pool.query(temporalSuccessorCandidatesSql, identity)).rows).toEqual([]);
    }
    await pool.query("UPDATE helix_environment_action_requests SET status='admitted', deadline_at=now()-interval '1 day'");
    expect((await pool.query(temporalSuccessorCandidatesSql, identity)).rows).toEqual([]);
  } finally { await pool.end(); }
});
