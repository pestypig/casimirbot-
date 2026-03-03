# Helix Ask Dottie Grounding Build - Codex Cloud Autorun Prompt (2026-03-03)

## Objective

Run a no-pause Codex Cloud build that implements the plan in:

- `docs/helix-ask-dottie-grounding-deep-research-2026-03-03.md`

and produces implementation evidence, test evidence, and bookkeeping artifacts that can be pulled locally for validation.

## Primary source of truth

- `AGENTS.md`
- `WARP_AGENTS.md`
- `AGENT_PLAYBOOK.md`
- `docs/helix-ask-readiness-debug-loop.md`
- `docs/helix-ask-flow.md`
- `docs/helix-ask-agent-policy.md`
- `docs/architecture/helix-ask-mission-systems-integration-plan.md`
- `docs/helix-ask-dottie-grounding-deep-research-2026-03-03.md`

## Prompt (paste into Codex Cloud as-is)

```text
Execution mode:
AUTORUN. Do not pause for approval between steps. Complete the sequence end-to-end unless a hard technical blocker prevents safe continuation.

Build target:
Implement and operationalize docs/helix-ask-dottie-grounding-deep-research-2026-03-03.md.

Hard rules:
1) Read AGENTS.md, WARP_AGENTS.md, AGENT_PLAYBOOK.md, and docs/helix-ask-readiness-debug-loop.md before patching.
2) Follow the target doc section order:
   - Build context
   - Build plan Phase 0..4
   - Measurement and guardrails
   - Immediate execution checklist
3) One prompt scope per commit.
4) Keep all changes additive/minimal and feature-flagged where behavior risk exists.
5) Do not claim repo grounding when evidence is weak; switch to explicit open-world mode with uncertainty.
6) Voice certainty must not exceed text certainty.
7) After each prompt scope, run required tests and Casimir verification:
   npm run casimir:verify -- --pack repo-convergence --auto-telemetry --ci --trace-out artifacts/training-trace.jsonl --trace-limit 200 --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export
8) If verdict is FAIL, fix first failing HARD constraint and rerun until PASS.
9) Preserve deterministic debug fields and add:
   - dottie_signal_applied
   - channel_contributions
   - mode_rationale
   - atlas_channel_used
10) Keep LLM call orchestration bounded: primary call + optional rescue call.

Required execution sequence:

Prompt 0 - Baseline and instrumentation lock
- Capture baseline scorecard from current Helix Ask behavior:
  mode precision, coverage ratio, unsupported-claim rate, contradiction rate, p50/p95 latency, llm_call_count distribution.
- Confirm current arbiter debug fields and where to add new ones.
- Do not change synthesis semantics in Prompt 0.

Prompt 1 - Arbiter and Dottie soft-signal routing
- Add mission-overwatch/Dottie topic/tag signal to arbiter and retrieval seed expansion.
- Keep this as soft influence only; no persona override behavior.
- Add deterministic mode rationale logging.

Prompt 2 - Atlas runtime retrieval lane
- Wire Atlas-derived retrieval channel into Ask runtime channel fusion/rerank.
- Add per-channel contribution accounting and evidence selection trace.
- Keep guardrails for weak evidence fallback.

Prompt 3 - Scientific synthesis contract hardening
- Enforce output sections:
  hypothesis, evidence, counterpoints, uncertainty, next falsifiable check.
- Add claim-to-evidence checker and certainty downgrade/fallback rules.
- Ensure text/voice certainty parity contract is preserved.

Prompt 4 - Readiness battery, scorecards, and bookkeeping
- Run readiness debug loop batteries (contract + variety).
- Produce before/after scorecard and GO/NO-GO recommendation.
- Export training trace JSONL for bookkeeping.

Required deliverables:
- docs/audits/research/helix-ask-dottie-grounding-build-execution-report-2026-03-03.md
- reports/helix-ask-dottie-grounding-baseline-scorecard-2026-03-03.json
- reports/helix-ask-dottie-grounding-final-scorecard-2026-03-03.json
- reports/helix-ask-dottie-grounding-go-no-go-2026-03-03.md
- artifacts/training-trace.dottie-grounding-2026-03-03.jsonl

Per-prompt report block (required):
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
1) Prompt-by-prompt status table with commit SHAs
2) Baseline vs final scorecard deltas
3) Final Casimir verification summary
4) Blocker ledger (if any)
5) Exact paths to produced artifacts and reports
```

