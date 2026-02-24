# Helix Ask TTS Production Stack Wave 1 Ledger (2026-02-24)

Scope lock:
- Primary source docs:
  - `docs/audits/research/helix-ask-tts-prod-stack-migration-codex-cloud-autorun-batch-prompt-pack-2026-02-24.md`
  - `reports/helix-ask-tts-prod-stack-wave1-ledger-2026-02-24.md`
- Baseline lock: `origin/main@dc2a2f13` (forward-only execution)
- Additive-only edits, non-breaking contracts, experimental audiocraft lane preserved.

## Prompt execution table

| prompt_id | objective | status | commit_sha |
|---|---|---|---|
| 0 | Wave ledger + scope lock | done | 463434b |
| 1 | ADR + policy lock for stack and licensing | done | 7337f42 |
| 2 | Weights/license manifest schema + validator | done | 33e1d6d |
| 3 | Production job scaffold (`tts_prod_train_nemo`) | done | 1c2dfb5 |
| 4 | Train route integration + deterministic parsing | done | 140eb7e |
| 5 | Tests for new gate/route behavior | done | d5eaa07 |
| 6 | Runbooks and operator commands | done | 80ff65a |
| 7 | Final readiness closure report | done | HEAD (prompt-7 commit) |

## Blocker policy

- `done`: full prompt scope delivered, checks completed, Casimir PASS.
- `partial-blocked`: safe additive subset shipped, deterministic blocker recorded.
- `blocked`: no safe additive delta possible; deterministic reason recorded.
- On `FAIL` verdict from Casimir: fix first failing `HARD` constraint and rerun.

## Deterministic done checklist

- [ ] Existing `tts_voice_train` behavior remains backward compatible.
- [ ] Additive `tts_prod_train_nemo` pathway added with deterministic reporting.
- [ ] Weights/license manifest gate implemented and wired for promotion surfaces.
- [ ] Colab lane remains explicitly experimental smoke.
- [ ] Prompt 0..7 include Casimir PASS evidence with integrity true.
- [ ] Final closure report includes GO/NO-GO and blocker list.

## Per-prompt report block template

```yaml
prompt_id: <0..7>
files_changed:
  - <path>
behavior_delta: <deterministic summary>
tests_or_checks_run:
  - <command>
casimir_verdict: <PASS|FAIL>
casimir_firstFail: <constraint id or none>
casimir_certificateHash: <hash>
casimir_integrityOk: <true|false>
casimir_traceId: <trace-id>
casimir_runId: <run-id>
commit_sha: <sha>
status: <done|partial-blocked|blocked>
blocker_reason: <none or deterministic reason>
```

## Prompt report blocks

### Prompt 0

```yaml
prompt_id: 0
files_changed:
  - reports/helix-ask-tts-prod-stack-wave1-ledger-2026-02-24.md
behavior_delta: initialized wave ledger, scope lock, and deterministic reporting template
tests_or_checks_run:
  - npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
casimir_verdict: PASS
casimir_firstFail: none
casimir_certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
casimir_integrityOk: true
casimir_traceId: adapter:11c200a0-2f7d-425f-a350-26fbb3fc96da
casimir_runId: 1
commit_sha: HEAD (prompt-7 commit)
status: done
blocker_reason: none
```


### Prompt 1

```yaml
prompt_id: 1
files_changed:
  - docs/adr/adr-tts-stack-selection-2026-02-24.md
  - docs/runbooks/voice-train-prod-lane-2026-02-23.md
  - reports/helix-ask-tts-prod-stack-wave1-ledger-2026-02-24.md
behavior_delta: locked NeMo-first production decision and explicit licensing NO-GO policy
tests_or_checks_run:
  - npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
casimir_verdict: PASS
casimir_firstFail: none
casimir_certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
casimir_integrityOk: true
casimir_traceId: adapter:ed411edc-81df-4dfe-b369-47db22ab22c5
casimir_runId: 2
commit_sha: HEAD (prompt-7 commit)
status: done
blocker_reason: none
```


### Prompt 2

```yaml
prompt_id: 2
files_changed:
  - configs/voice/weights-manifest.schema.json
  - configs/voice/weights-manifest.example.json
  - scripts/voice/verify_weights_manifest.py
  - package.json
  - reports/helix-ask-tts-prod-stack-wave1-ledger-2026-02-24.md
behavior_delta: added enforceable weights manifest schema/example and deterministic validator alias
tests_or_checks_run:
  - python -m py_compile scripts/voice/verify_weights_manifest.py
  - npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
casimir_verdict: PASS
casimir_firstFail: none
casimir_certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
casimir_integrityOk: true
casimir_traceId: adapter:d61556c3-d8e4-42cf-a89a-9ab9179da068
casimir_runId: 3
commit_sha: HEAD (prompt-7 commit)
status: done
blocker_reason: none
```


### Prompt 3

```yaml
prompt_id: 3
files_changed:
  - scripts/voice/train_production_nemo.py
  - scripts/voice/train_production_voice.sh
  - reports/helix-ask-tts-prod-stack-wave1-ledger-2026-02-24.md
behavior_delta: added additive NeMo production scaffold with deterministic signals and blocked reason fallback
tests_or_checks_run:
  - python -m py_compile scripts/voice/train_production_nemo.py
  - TRAIN_LANE=tts_prod_train_nemo bash scripts/voice/train_production_voice.sh
  - npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
casimir_verdict: PASS
casimir_firstFail: none
casimir_certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
casimir_integrityOk: true
casimir_traceId: adapter:0df531d7-4a38-4837-b6b1-0acf69a04a50
casimir_runId: 4
commit_sha: HEAD (prompt-7 commit)
status: done
blocker_reason: none
```


### Prompt 4

```yaml
prompt_id: 4
files_changed:
  - server/routes/train-status.ts
  - tests/train-status.routes.spec.ts
  - reports/helix-ask-tts-prod-stack-wave1-ledger-2026-02-24.md
behavior_delta: integrated tts_prod_train_nemo route handling with deterministic progress/stats/artifact parsing
tests_or_checks_run:
  - npx vitest run tests/train-status.routes.spec.ts
  - npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
casimir_verdict: PASS
casimir_firstFail: none
casimir_certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
casimir_integrityOk: true
casimir_traceId: adapter:9c089b51-d4fb-4a44-9afe-8262d2b03037
casimir_runId: 5
commit_sha: HEAD (prompt-7 commit)
status: done
blocker_reason: none
```


### Prompt 5

```yaml
prompt_id: 5
files_changed:
  - tests/train-status.routes.spec.ts
  - tests/voice-bundle.validator.spec.ts
  - tests/voice.offline-core.spec.ts
  - tests/voice.weights-manifest.spec.ts
  - reports/helix-ask-tts-prod-stack-wave1-ledger-2026-02-24.md
behavior_delta: expanded deterministic tests for manifest validation and nemo production-lane route behavior
tests_or_checks_run:
  - npx vitest run tests/train-status.routes.spec.ts tests/voice-bundle.validator.spec.ts tests/voice.offline-core.spec.ts tests/voice.weights-manifest.spec.ts
  - npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
casimir_verdict: PASS
casimir_firstFail: none
casimir_certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
casimir_integrityOk: true
casimir_traceId: adapter:c28a3fcb-56d7-4427-9292-f76ff1fc801d
casimir_runId: 6
commit_sha: HEAD (prompt-7 commit)
status: done
blocker_reason: none
```


### Prompt 6

```yaml
prompt_id: 6
files_changed:
  - docs/runbooks/voice-train-prod-lane-2026-02-23.md
  - docs/runbooks/voice-train-colab-bootstrap-2026-02-23.md
  - reports/helix-ask-tts-prod-stack-wave1-ledger-2026-02-24.md
behavior_delta: published operator commands and promotion checklist while preserving experimental Colab lane policy
tests_or_checks_run:
  - npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
casimir_verdict: PASS
casimir_firstFail: none
casimir_certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
casimir_integrityOk: true
casimir_traceId: adapter:aa76de83-7186-401b-8757-f6c2b84af8a1
casimir_runId: 7
commit_sha: HEAD (prompt-7 commit)
status: done
blocker_reason: none
```


### Prompt 7

```yaml
prompt_id: 7
files_changed:
  - docs/runbooks/reports/tts-prod-stack-wave1-closure-2026-02-24.md
  - reports/helix-ask-tts-prod-stack-wave1-ledger-2026-02-24.md
behavior_delta: published final readiness closure with ordered commits, gate table, GO/NO-GO, and operator commands
tests_or_checks_run:
  - npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
casimir_verdict: PASS
casimir_firstFail: none
casimir_certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
casimir_integrityOk: true
casimir_traceId: adapter:7fdaf246-7c50-407d-893c-7c70e32cb904
casimir_runId: 8
commit_sha: HEAD (prompt-7 commit)
status: done
blocker_reason: nemo_runtime_unavailable
```
