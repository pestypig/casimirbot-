# Helix Ask Retrieval Attribution Next Wave - Codex Cloud Autorun Batch Prompt Pack (2026-03-04)

## Why this wave
Latest merged attribution sweep indicates retrieval lift is still unproven.

Reviewed merge state:
1. merge commit: `d4e262dd` (PR #430)
2. patch commit: `f360d2fe`
3. scorecard run id: `retrieval-ablation-1772584380302`
4. `retrieval_lift_proven=no`
5. `dominant_channel=none`
6. `contributions.atlas=0`, `contributions.git_tracked=0`
7. `unmatched_expected_file_rate=1.0`

Strict decision fork result:
- next build wave must be `Eval-Fidelity v2`.

## Objective
Execute an attribution-first cloud wave that fixes evaluation fidelity and
enables reliable retrieval causality claims.

Do not start adaptive retrieval or rerank convergence until this wave passes.

## Source anchors (required pre-read)
- `AGENTS.md`
- `WARP_AGENTS.md`
- `AGENT_PLAYBOOK.md`
- `docs/helix-ask-readiness-debug-loop.md`
- `docs/helix-ask-retrieval-objective-resolution-plan-2026-03-03.md`
- `docs/runbooks/helix-ask-retrieval-attribution-ablation-2026-03-03.md`
- `docs/audits/research/helix-ask-retrieval-attribution-codex-cloud-autorun-batch-prompt-pack-2026-03-03.md`

## Execution settings
- `HELIX_ASK_RETRIEVAL_MAX_TASKS=40`
- `HELIX_ASK_RETRIEVAL_SEEDS=7,11,13`
- `HELIX_ASK_RETRIEVAL_TEMPERATURES=0.2`
- runtime stability requirement: no silent hangs; explicit timeout/fail reason required

## Deliverables (required)
- `reports/helix-ask-retrieval-attribution-fidelity-v2-2026-03-04.md`
- `reports/helix-ask-retrieval-ablation-scorecard-2026-03-03.json`
- `reports/helix-ask-retrieval-ablation-scorecard-2026-03-03.md`
- `reports/helix-ask-retrieval-attribution-go-no-go-2026-03-03.md`
- `reports/helix-ask-retrieval-stage-fault-matrix-2026-03-04.md`
- `artifacts/experiments/helix-ask-retrieval-ablation/<run-id>/summary.comparison.json`
- `artifacts/experiments/helix-ask-retrieval-ablation/<run-id>/summary.comparison.md`

## Prompt 0 - Intake and correction lock (no patch)
```text
Execution mode:
AUTORUN for this prompt scope. No code patching.

Task:
1) Verify latest merged retrieval-attribution state and correct any stale SHAs.
2) Record canonical anchor values:
   - merge commit
   - patch commit
   - run id
   - verdict fields
3) Confirm strict decision fork selection for this wave.

Output:
- reports/helix-ask-retrieval-attribution-fidelity-v2-2026-03-04.md (intake section)
```

## Prompt 1 - Eval-Fidelity v2 implementation
```text
Execution mode:
AUTORUN. One prompt scope per commit.

Implement in scripts/helix-ask-retrieval-ablation.ts:
1) expanded path canonicalization (slash/case/relative variants)
2) alias families for known path migrations
3) evidence-id normalization for expected-vs-retrieved file matching
4) explicit mismatch reason taxonomy:
   - path_form_mismatch
   - alias_unmapped
   - retrieval_miss
   - context_shape_mismatch
5) per-task diagnostic emit in variant JSON

Validation:
- run bounded smoke (MAX_TASKS=2)
- ensure diagnostics are populated
```

## Prompt 2 - Stability and completeness hardening for MAX_TASKS=40
```text
Execution mode:
AUTORUN. One prompt scope per commit.

Add runner controls:
1) per-variant watchdog timeout with deterministic fail reason
2) partial-run safety artifact (do not overwrite prior complete scorecard)
3) explicit completion flag:
   - run_complete=true only when all variants/seeds/temps/tasks finish

Validation:
- run HELIX_ASK_RETRIEVAL_MAX_TASKS=40
- if incomplete, emit blocked status with exact failure stage
```

## Prompt 3 - Stage-fault matrix and attribution guard
```text
Execution mode:
AUTORUN. One prompt scope per commit.

Add attribution outputs:
1) stage-fault matrix fields per run:
   - retrieval
   - candidate_filtering
   - rerank
   - synthesis_packing
   - final_cleanup
2) fault owner classifier:
   - routing
   - retrieval
   - post_processing
3) update scorecard/go-no-go text to block retrieval-lift claim unless:
   - positive lane-ablation delta
   - bounded confidence
   - fault owner points to retrieval

Output:
- reports/helix-ask-retrieval-stage-fault-matrix-2026-03-04.md
```

## Prompt 4 - Final run, decision, and handoff
```text
Execution mode:
AUTORUN. One prompt scope per commit.

Run:
1) HELIX_ASK_RETRIEVAL_MAX_TASKS=40 npm run helix:ask:retrieval:ablation
2) npm run build
3) Casimir verify for each patch scope:
   npm run casimir:verify -- --pack repo-convergence --auto-telemetry --ci --trace-out artifacts/training-trace.jsonl --trace-limit 200 --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export

Final response must include:
1) prompt-by-prompt status + commit SHAs
2) artifact paths
3) retrieval attribution verdict
4) stage-fault matrix summary
5) Casimir summary blocks (verdict, runId, traceId, certificateHash, integrityOk)
6) PR number and merge commit SHA
```

## Acceptance criteria
1. `run_complete=true` for the 40-task sweep or explicit deterministic blocked reason.
2. `unmatched_expected_file_rate` drops materially from prior anchor run.
3. attribution verdict uses strict gate (no retrieval-lift claim on ambiguous data).
4. stage-fault matrix is present and actionable.
5. Casimir verify is PASS with `integrityOk=true` for patch scopes.
