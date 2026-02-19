# HELIX-PS3.1 Quake Weight Hardening Patch (Correctness + Portability)

- Timestamp: 20260219T080412Z
- Scope: harden profile-weight parsing, cross-platform tuning runner, stop-reason extraction accuracy, and bookkeeping

## Changes implemented
1. Hardened `HELIX_ASK_MOVE_PROFILE_WEIGHTS` parsing:
   - only finite numeric override fields are applied
   - invalid/missing keys are ignored
   - defaults remain in force for ignored keys
   - move score serialization now guarantees finite numeric values
2. Made tuning runner command execution cross-platform (`spawn` with command/args; no hard bash dependency).
3. Fixed stop-reason extraction to prefer debug fields:
   - `debug.agent_stop_reason`
   - `debug.controller_stop_reason`
   - fallback: `row.stop_reason`
4. Added hardening tests for partial invalid overrides and debug stop-reason extraction.

## Commands run
1. `npx vitest run tests/helix-ask-quake-move-policy.spec.ts tests/helix-ask-semantic-quality.spec.ts tests/helix-ask-quake-weight-tuning.spec.ts`
2. `npm run casimir:verify -- --pack repo-convergence --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace-quake-weight-hardening.jsonl --trace-limit 200 --ci`

## ✅/⚠️/❌ checks
- ✅ hardening + policy tests passed (14/14)
- ✅ Casimir verify PASS with certificate integrity OK

## Metrics / baseline bookkeeping
- Previous tuning metrics are left untouched (not recomputed in this patch).
- This patch focuses on correctness/portability hardening and extraction fidelity.

## Casimir PASS block
- verdict: PASS
- traceId: adapter:c1adafd6-36da-49bd-b94c-67af0cffdfb2
- runId: 1
- certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
- certificateId: constraint-pack:repo-convergence:6e84f965957f
- integrityOk: true
- status: GREEN

## SCM
- patch commit: recorded at release step (see final response commit hash); merge-hash semantics preserved
- merge hash in main: N/A (not merged in this workspace)

## Artifacts
- `artifacts/training-trace-quake-weight-hardening.jsonl`
