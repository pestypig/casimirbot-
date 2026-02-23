# Helix Ask Ownership-First Dottie Voice Execution Ledger (2026-02-23)

Baseline lock: `origin/main@d602240c`

## Ownership non-negotiables

- Production mission callouts must remain ownership-first and local-first.
- Mission callouts must continue functioning when all managed providers are disabled.
- `/api/voice/speak` must remain backward compatible for existing clients.
- Managed providers may only execute in explicitly non-critical fallback paths.
- Changes must be additive and non-breaking across this wave.

## Prompt execution table

| prompt_id | objective | status | commit_sha | notes |
|---|---|---|---|---|
| Prompt 0 | Wave ledger and scope lock | done | HEAD | Initialize deterministic execution tracking for Prompt 0..10. |
| Prompt 1 | Contract and policy hardening | pending | pending |  |
| Prompt 2 | Startup config enforcement | pending | pending |  |
| Prompt 3 | Voice route ownership guardrails | pending | pending |  |
| Prompt 4 | Voice bundle format and validator | pending | pending |  |
| Prompt 5 | Voice service contract wiring | pending | pending |  |
| Prompt 6 | Dataset preparation mode for voice training | pending | pending |  |
| Prompt 7 | Training runner job-type extension | pending | pending |  |
| Prompt 8 | Evaluation and offline-core regression gates | pending | pending |  |
| Prompt 9 | Governance and business docs closure | pending | pending |  |
| Prompt 10 | Final closure readiness report | pending | pending |  |

## Blocker policy

When environment/runtime constraints block the full prompt scope, ship the largest safe additive subset and mark status as `partial-blocked` or `blocked` with deterministic reason and scope impact. Do not mark a prompt done without recording checks and Casimir status.

## Deterministic done checklist

- [ ] Prompt-scoped files changed only.
- [ ] Prompt checks executed and recorded.
- [ ] `npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci` returns PASS.
- [ ] Casimir fields captured: verdict, firstFail, certificateHash, integrityOk, traceId, runId.
- [ ] Prompt status + commit SHA recorded below.

## Per-prompt execution report

### Prompt 0

- prompt_id: Prompt 0
- files_changed:
  - `reports/helix-ask-ownership-first-dottie-voice-ledger-2026-02-23.md`
  - `docs/audits/research/helix-ask-ownership-first-dottie-voice-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md`
- behavior_delta: Added wave ledger scaffold with prompt table for Prompt 0..10, ownership non-negotiables, blocker policy, and deterministic done checklist.
- tests_or_checks_run:
  - `npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`
- casimir_verdict: PASS
- casimir_firstFail: null
- casimir_certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
- casimir_integrityOk: true
- casimir_traceId: adapter:d0dfeff8-d5e0-4f03-933f-1d4e5288319f
- casimir_runId: 1
- commit_sha: HEAD
- status: done
