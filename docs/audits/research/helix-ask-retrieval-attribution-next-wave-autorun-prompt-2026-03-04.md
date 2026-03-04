# Helix Ask Retrieval Attribution Next Wave - Paste Prompt (2026-03-04)

Use this prompt directly in Codex Cloud:

```text
Execution mode:
AUTORUN. Do not pause for approvals. Complete end-to-end unless a hard blocker prevents safe continuation.

Branching:
1) Checkout latest main.
2) Create branch: codex/retrieval-attribution-next-wave
3) Keep one prompt scope per commit.

Primary playbook (execute exactly):
docs/audits/research/helix-ask-retrieval-attribution-next-wave-codex-cloud-autorun-batch-prompt-pack-2026-03-04.md

Required pre-read:
- AGENTS.md
- WARP_AGENTS.md
- AGENT_PLAYBOOK.md
- docs/helix-ask-readiness-debug-loop.md
- docs/helix-ask-retrieval-objective-resolution-plan-2026-03-03.md
- docs/runbooks/helix-ask-retrieval-attribution-ablation-2026-03-03.md
- docs/audits/research/helix-ask-retrieval-attribution-codex-cloud-autorun-batch-prompt-pack-2026-03-03.md

Run settings:
- HELIX_ASK_RETRIEVAL_MAX_TASKS=40
- HELIX_ASK_RETRIEVAL_SEEDS=7,11,13
- HELIX_ASK_RETRIEVAL_TEMPERATURES=0.2

Mandatory commands:
1) npm run atlas:build
2) npm run atlas:why -- helix-ask-retrieval-ablation
3) npm run atlas:trace -- helix-ask-retrieval-ablation --upstream
4) npm run helix:ask:retrieval:ablation
5) npm run build
6) For each prompt scope that changes code/config:
   npm run casimir:verify -- --pack repo-convergence --auto-telemetry --ci --trace-out artifacts/training-trace.jsonl --trace-limit 200 --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export

Strict decision fork (must enforce):
1) If unmatched_expected_file_rate > 0.6 -> Eval-Fidelity v2 only.
2) Else if recall@10 < 0.10 or consequential_file_retention < 0.20 -> Coverage-Adaptive Retrieval.
3) Else -> Rerank + Packing Convergence.
4) Do not claim retrieval_lift_proven unless lane-ablation deltas are positive with bounded confidence and stage-fault attribution points to retrieval.

Required deliverables:
- reports/helix-ask-retrieval-attribution-fidelity-v2-2026-03-04.md
- reports/helix-ask-retrieval-stage-fault-matrix-2026-03-04.md
- reports/helix-ask-retrieval-ablation-scorecard-2026-03-03.json
- reports/helix-ask-retrieval-ablation-scorecard-2026-03-03.md
- reports/helix-ask-retrieval-attribution-go-no-go-2026-03-03.md
- artifacts/experiments/helix-ask-retrieval-ablation/<run-id>/summary.comparison.json
- artifacts/experiments/helix-ask-retrieval-ablation/<run-id>/summary.comparison.md

PR + merge requirements:
1) Open PR to main with prompt-by-prompt status + commit SHAs.
2) Include Casimir blocks for each patch scope (verdict, runId, traceId, certificateHash, integrityOk).
3) Merge only if Casimir PASS and required artifacts exist.

Final response format:
- Prompt-by-prompt status + SHAs
- Artifact paths
- Retrieval attribution verdict
- Stage-fault matrix summary
- Casimir summary blocks
- PR number and merge commit SHA
```
