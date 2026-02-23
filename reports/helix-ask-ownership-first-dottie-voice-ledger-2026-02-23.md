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
| Prompt 1 | Contract and policy hardening | done | 585dce5 | Documented ownership-first voice policy, managed fallback boundaries, and consent/profile governance compatibility notes. |
| Prompt 2 | Startup config enforcement | done | c07599f | Added deterministic startup flags for managed-provider enablement and local-only mission mode with safe defaults. |
| Prompt 3 | Voice route ownership guardrails | done | 95b1e8c | Enforced mission-critical local routing and managed-provider disable guardrails while preserving deterministic envelopes. |
| Prompt 4 | Voice bundle format and validator | done | 13c8c98 | Added portable voice bundle format doc and deterministic validator with checksum/bytes enforcement. |
| Prompt 5 | Voice service contract wiring | done | 900665e | Wired optional voice_profile_id pass-through with backward-compatible voice contract behavior. |
| Prompt 6 | Dataset preparation mode for voice training | done | f84ee08 | Added voice_dataset prep mode with deterministic manifest checksums and dataset-job metadata exposure. |
| Prompt 7 | Training runner job-type extension | done | 23c2884 | Added tts_voice_train job path and artifact refs while preserving spectral adapter defaults. |
| Prompt 8 | Evaluation and offline-core regression gates | done | 4a6ac4a | Added offline-core regression specs and runbook gates for managed-disabled continuity checks. |
| Prompt 9 | Governance and business docs closure | done | 7998fb2 | Closed consent boundaries, local-only runtime/fallback limits, and managed-off economics docs. |
| Prompt 10 | Final closure readiness report | done | HEAD | Published final readiness report including commit/artifact tables and GO decision. |

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


### Prompt 1

- prompt_id: Prompt 1
- files_changed:
  - `docs/architecture/voice-service-contract.md`
  - `docs/helix-ask-agent-policy.md`
  - `docs/helix-ask-runtime-limitations.md`
  - `reports/helix-ask-ownership-first-dottie-voice-ledger-2026-02-23.md`
- behavior_delta: Added ownership-first routing requirements, managed fallback-only language, and additive consent/voice profile governance fields while preserving `/api/voice/speak` backward compatibility language.
- tests_or_checks_run:
  - `npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`
- casimir_verdict: PASS
- casimir_firstFail: null
- casimir_certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
- casimir_integrityOk: true
- casimir_traceId: adapter:81453320-e513-45e2-b846-34bdd4daf140
- casimir_runId: 1
- commit_sha: 585dce5
- status: done


### Prompt 2

- prompt_id: Prompt 2
- files_changed:
  - `server/startup-config.ts`
  - `tests/startup-config.spec.ts`
  - `reports/helix-ask-ownership-first-dottie-voice-ledger-2026-02-23.md`
- behavior_delta: Added `VOICE_MANAGED_PROVIDERS_ENABLED` and `VOICE_LOCAL_ONLY_MISSION_MODE` startup flags with deterministic parsed state while preserving prior config behavior and local-only safety defaults.
- tests_or_checks_run:
  - `npx vitest run tests/startup-config.spec.ts`
  - `npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`
- casimir_verdict: PASS
- casimir_firstFail: null
- casimir_certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
- casimir_integrityOk: true
- casimir_traceId: adapter:7276c0ce-92f2-4be3-9395-e109bc07eec1
- casimir_runId: 2
- commit_sha: c07599f
- status: done


### Prompt 3

- prompt_id: Prompt 3
- files_changed:
  - `server/routes/voice.ts`
  - `tests/voice.routes.spec.ts`
  - `reports/helix-ask-ownership-first-dottie-voice-ledger-2026-02-23.md`
- behavior_delta: Added mission-critical local-only routing, explicit managed-provider disable enforcement for non-critical routes, and preserved existing deterministic `/api/voice/speak` success/error shapes.
- tests_or_checks_run:
  - `npx vitest run tests/voice.routes.spec.ts`
  - `npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`
- casimir_verdict: PASS
- casimir_firstFail: null
- casimir_certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
- casimir_integrityOk: true
- casimir_traceId: adapter:542806e3-52f1-45e7-aaf0-0a6bc5ceb7f4
- casimir_runId: 3
- commit_sha: 95b1e8c
- status: done


### Prompt 4

- prompt_id: Prompt 4
- files_changed:
  - `docs/architecture/voice-bundle-format.md`
  - `server/services/voice-bundle/validator.ts`
  - `tests/voice-bundle.validator.spec.ts`
  - `reports/helix-ask-ownership-first-dottie-voice-ledger-2026-02-23.md`
- behavior_delta: Defined bundle manifest schema and implemented deterministic local validator that enforces required fields, required files, file sizes, and checksums.
- tests_or_checks_run:
  - `npx vitest run tests/voice-bundle.validator.spec.ts`
  - `npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`
- casimir_verdict: PASS
- casimir_firstFail: null
- casimir_certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
- casimir_integrityOk: true
- casimir_traceId: adapter:f68b21b9-764b-4b04-ae3a-3779395c12a1
- casimir_runId: 4
- commit_sha: 13c8c98
- status: done


### Prompt 5

- prompt_id: Prompt 5
- files_changed:
  - `server/routes/voice.ts`
  - `docs/architecture/voice-service-contract.md`
  - `tests/voice.routes.spec.ts`
  - `reports/helix-ask-ownership-first-dottie-voice-ledger-2026-02-23.md`
- behavior_delta: Kept existing request shape, added optional `voice_profile_id` pass-through via proxy wiring, and preserved dry-run plus deterministic error behavior.
- tests_or_checks_run:
  - `npx vitest run tests/voice.routes.spec.ts`
  - `npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`
- casimir_verdict: PASS
- casimir_firstFail: null
- casimir_certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
- casimir_integrityOk: true
- casimir_traceId: adapter:c8031bee-3468-4af3-9691-2bfb9c245139
- casimir_runId: 5
- commit_sha: 900665e
- status: done


### Prompt 6

- prompt_id: Prompt 6
- files_changed:
  - `external/audiocraft/scripts/prepare_knowledge_audio.py`
  - `server/routes/train-status.ts`
  - `tests/train-status.routes.spec.ts`
  - `reports/helix-ask-ownership-first-dottie-voice-ledger-2026-02-23.md`
- behavior_delta: Added `voice_dataset` preparation mode with deterministic dataset manifest/checksum output and exposed dataset mode/manifest metadata through train-status job state.
- tests_or_checks_run:
  - `npx vitest run tests/train-status.routes.spec.ts`
  - `npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`
- casimir_verdict: PASS
- casimir_firstFail: null
- casimir_certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
- casimir_integrityOk: true
- casimir_traceId: adapter:0129d189-644a-433b-be0d-8fcb577d169b
- casimir_runId: 6
- commit_sha: f84ee08
- status: done


### Prompt 7

- prompt_id: Prompt 7
- files_changed:
  - `external/audiocraft/scripts/train_spectral_adapter.py`
  - `server/routes/train-status.ts`
  - `tests/train-status.routes.spec.ts`
  - `reports/helix-ask-ownership-first-dottie-voice-ledger-2026-02-23.md`
- behavior_delta: Extended training run path with `tts_voice_train` job type, preserved default spectral adapter behavior, and surfaced output artifact refs through deterministic job status fields.
- tests_or_checks_run:
  - `npx vitest run tests/train-status.routes.spec.ts`
  - `npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`
- casimir_verdict: PASS
- casimir_firstFail: null
- casimir_certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
- casimir_integrityOk: true
- casimir_traceId: adapter:2f7af9d3-a796-4cdc-81cd-ff5c84d412a1
- casimir_runId: 7
- commit_sha: 23c2884
- status: done


### Prompt 8

- prompt_id: Prompt 8
- files_changed:
  - `tests/voice.offline-core.spec.ts`
  - `tests/voice.routes.spec.ts`
  - `docs/runbooks/voice-eval-gates-2026-02-23.md`
  - `reports/helix-ask-ownership-first-dottie-voice-ledger-2026-02-23.md`
- behavior_delta: Added deterministic offline-core regression checks for managed-disabled operation and mission-critical local continuity, with runbook instructions for CI harness hooks.
- tests_or_checks_run:
  - `npx vitest run tests/voice.offline-core.spec.ts tests/voice.routes.spec.ts`
  - `npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`
- casimir_verdict: PASS
- casimir_firstFail: null
- casimir_certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
- casimir_integrityOk: true
- casimir_traceId: adapter:567b3721-8bae-456a-a89d-4c7adcc29030
- casimir_runId: 8
- commit_sha: 4a6ac4a
- status: done


### Prompt 9

- prompt_id: Prompt 9
- files_changed:
  - `docs/helix-ask-agent-policy.md`
  - `docs/helix-ask-runtime-limitations.md`
  - `docs/BUSINESS_MODEL.md`
  - `reports/helix-ask-ownership-first-dottie-voice-ledger-2026-02-23.md`
- behavior_delta: Closed governance and business documentation for consent boundaries, local-only operational limits, and economics split between managed-off core and fallback-enabled operation.
- tests_or_checks_run:
  - `npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`
- casimir_verdict: PASS
- casimir_firstFail: null
- casimir_certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
- casimir_integrityOk: true
- casimir_traceId: adapter:6bfecb85-d5cb-45c9-b75e-ffeb8204f08d
- casimir_runId: 9
- commit_sha: 7998fb2
- status: done


### Prompt 10

- prompt_id: Prompt 10
- files_changed:
  - `reports/helix-ask-ownership-first-dottie-voice-readiness-2026-02-23.md`
  - `reports/helix-ask-ownership-first-dottie-voice-ledger-2026-02-23.md`
- behavior_delta: Published final readiness summary with ordered prompt table, artifact existence table, explicit GO/NO-GO decision, and final Casimir PASS/certificate integrity status.
- tests_or_checks_run:
  - `npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`
- casimir_verdict: PASS
- casimir_firstFail: null
- casimir_certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
- casimir_integrityOk: true
- casimir_traceId: adapter:dfee4988-4032-48f6-9d85-cc53770b144a
- casimir_runId: 10
- commit_sha: HEAD
- status: done
