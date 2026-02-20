# Codex Cloud Autorun Prompt: AGIBOT X1 Wave 2 Batch Pack (2026-02-20)

Use this as one prompt in Codex Cloud to execute Wave 2 in strict sequence without manual stops.

## Prompt (paste into Codex Cloud as-is)

```text
Execution mode:
AUTORUN. Do not stop for approval between prompts. Execute full sequence unless a hard technical blocker prevents safe continuation.

Primary source of truth:
- docs/audits/research/agibot-x1-helix-wave2-codex-cloud-batch-prompt-pack-2026-02-20.md
- reports/agibot-x1-helix-integration-readiness-2026-02-20.md

Objective:
Run Prompt 0 through Prompt 8 from the Wave 2 batch pack in exact order, with deterministic validation and verification reporting after every prompt.

Hard operating rules:
1) Execute in this exact order: 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8.
2) One prompt scope per commit.
3) Respect allowed_paths exactly; do not broaden scope.
4) After each prompt, run required checks and:
   npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
5) If verification verdict is FAIL:
   - fix first failing HARD constraint
   - rerun verification
   - repeat until PASS
6) Keep no direct LLM-to-actuator control path in all outputs.
7) Do not make physical deployment-readiness claims unless blockers are fully closed with evidence.

No-stop behavior:
- Do not ask for confirmation between prompts.
- If blocked, implement the largest safe additive subset, record deterministic TODO/blockers, and continue.
- Stop only if repository integrity or safety constraints would be violated by continuing.

Per-prompt report block (required after each prompt):
- prompt_id
- files_changed
- behavior_delta
- tests_or_checks_run
- casimir_verdict
- casimir_firstFail
- casimir_certificateHash
- casimir_integrityOk
- casimir_traceId
- casimir_runId
- commit_sha
- status (done|partial-blocked|blocked)

Final output format:
1) Execution summary table for Prompt 0..8
2) Combined blocker ledger
3) Final Casimir verification summary
4) Produced artifacts list
5) Remaining no-go blockers for physical deployment claim (if any)
```

