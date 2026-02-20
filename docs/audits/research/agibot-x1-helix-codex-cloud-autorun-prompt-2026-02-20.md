# Codex Cloud Autorun Prompt: AGIBOT X1 Batch Pack (2026-02-20)

Use this as a single prompt in Codex Cloud when you want the full batch to run in order without pausing between prompts.

## Prompt (paste into Codex Cloud as-is)

```text
Execution mode:
AUTORUN. Do not stop for confirmation between steps. Execute the full sequence end-to-end unless a hard technical blocker makes continuation impossible.

Primary source of truth:
- docs/audits/research/agibot-x1-helix-codex-cloud-batch-prompt-pack-2026-02-20.md
- docs/audits/research/agibot-x1-physical-ai-deep-research-prompt-2026-02-20.md

Objective:
Run Prompt 0 through Prompt 7 in strict order, applying all requirements, checks, and guardrails from the batch pack, with no manual pauses.

Hard operating rules:
1) Execute in this exact order: 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7.
2) One prompt scope per commit.
3) Respect allowed_paths per prompt. Do not broaden scope.
4) After each prompt, run required tests/checks and then run:
   npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
5) If verification verdict is FAIL:
   - fix first failing HARD constraint
   - rerun verification
   - repeat until PASS
6) Never claim certification/physical viability from documentation work alone.
7) No direct LLM-to-actuator control path is allowed in any produced contract.

No-stop behavior:
- Do not ask for approval between prompts.
- If blocked, implement the maximum additive subset, record deterministic TODOs/blockers, and continue to next prompt.
- Only stop early if repository integrity is at risk (corrupt state, destructive conflict, or missing essential files).

Per-prompt required report block (emit after each prompt):
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
1) Execution summary table for Prompt 0..7 (status + commit SHA)
2) Combined blocker ledger (if any)
3) Final Casimir verification summary from the last prompt
4) List of produced artifacts/paths
5) Next actions (only if blockers remain)
```

