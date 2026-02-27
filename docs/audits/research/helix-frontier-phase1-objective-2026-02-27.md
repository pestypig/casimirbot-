# Helix Frontier Phase 1 Objective (2026-02-27)

## Objective

Align Helix Ask with frontier-reasoning research by hardening runtime behavior, not just answer style:

1. Preserve frontier lens continuity across follow-up turns in the same session.
2. Prevent frontier flows from collapsing to unconstrained general fallback.
3. Enforce a scientific-method output contract when frontier mode is active.
4. Keep runtime/debug fallback noise out of user-facing text.
5. Add repeatable regression coverage for frontier continuity.

## Scope (Phase 1)

- `server/routes/agi.plan.ts`
  - Session-aware frontier lens lock and follow-up carryover.
  - Frontier routing guard metadata for debug proof.
  - Frontier session lock persistence to session memory.
  - Runtime fallback noise cleanup in final answer text.
- `server/services/helix-ask/session-memory.ts`
  - Session preference field for frontier lens lock.
- `scripts/helix-ask-regression.ts`
  - Multi-turn frontier continuity case (same-session follow-up).

## Debug-Proof Run Plan

Run on local server endpoint expected by user path:

- Base URL: `http://localhost:5050`
- Primary workflow path: `POST /api/agi/ask`

Commands:

1. Variety harness:
   - `HELIX_ASK_BASE_URL=http://localhost:5050 HELIX_ASK_REGRESSION_AMBIGUITY=1 HELIX_ASK_REGRESSION_IDEOLOGY=1 HELIX_ASK_REGRESSION_FRONTIER_CONTINUITY=1 npx tsx scripts/helix-ask-regression.ts`
2. Targeted frontier follow-up check (same session):
   - turn 1: `Is the sun conscious under Orch-OR style reasoning?`
   - turn 2: `What in the reasoning ladder should we focus on since this is the case?`
3. Casimir verify gate:
   - `npm run casimir:verify -- --pack repo-convergence --auto-telemetry --ci --trace-out artifacts/training-trace.jsonl --trace-limit 200 --url http://localhost:5050/api/agi/adapter/run --export-url http://localhost:5050/api/agi/training-trace/export`
4. Trace endpoint check:
   - `GET http://localhost:5050/api/agi/training-trace/<runId>`

## Acceptance Snapshot (to fill per run)

- Run context:
  - Date: 2026-02-27
  - Ask endpoint: `http://localhost:5050/api/agi/ask`
  - Session proof chain:
    - turn 1: `Is the sun conscious under Orch-OR style reasoning?`
    - turn 2: `What in the reasoning ladder should we focus on since this is the case?`

- Frontier direct routing: pass
  - intent: `falsifiable.frontier_consciousness_theory_lens`
- Frontier follow-up continuity: pass
  - follow-up intent: `falsifiable.frontier_consciousness_theory_lens`
  - source: `session_followup`
  - frontier active: `true`
- Scientific-method section coverage (frontier follow-up): pass
  - detected sections: `7/7` (`Definitions`, `Baseline`, `Hypothesis`, `Anti-hypothesis`, `Falsifiers`, `Uncertainty band`, `Claim tier`)
- Telemetry/debug leakage (frontier follow-up): pass
  - no `Execution log` / `Ask debug` leakage in answer text
- Runtime `fetch failed` phrase on frontier follow-up: pass
  - not present in follow-up answer text

- Variety harness status:
  - command:
    - `HELIX_ASK_BASE_URL=http://localhost:5050 HELIX_ASK_REGRESSION_AMBIGUITY=1 HELIX_ASK_REGRESSION_IDEOLOGY=1 HELIX_ASK_REGRESSION_FRONTIER_CONTINUITY=1 npx tsx scripts/helix-ask-regression.ts`
  - result: fail (non-frontier families still drifting)
  - notable remaining blockers:
    - repo-pipeline and composite-synthesis intent mismatches
    - ambiguity-cavity routing mismatch
    - ideology narrative/context routing and style-contract drift
    - composite fallback prose still surfaces `Runtime fallback:` prefix under hybrid relation path

- Frontier continuity harness-only status:
  - command:
    - `HELIX_ASK_BASE_URL=http://localhost:5050 HELIX_ASK_REGRESSION_ONLY=__none__ HELIX_ASK_REGRESSION_AMBIGUITY=0 HELIX_ASK_REGRESSION_IDEOLOGY=0 HELIX_ASK_REGRESSION_FRONTIER_CONTINUITY=1 npx tsx scripts/helix-ask-regression.ts`
  - result: pass (`frontier continuity followup`)

- Casimir verify verdict/hash/integrity: pass
  - runId: `21728`
  - traceId: `adapter:960e5cd1-42f5-4003-bd92-81a0663ee292`
  - certificate hash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
  - integrity: `true`
  - trace export endpoint check: pass (`/api/agi/training-trace/export`, snapshot saved to `artifacts/training-trace.export.jsonl`)
