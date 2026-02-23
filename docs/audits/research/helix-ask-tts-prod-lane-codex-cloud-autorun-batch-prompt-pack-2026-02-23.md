# Helix Ask TTS Production Lane Codex Cloud Autorun Batch Prompt Pack (2026-02-23)

Derived from:
- `docs/audits/research/helix-ask-ownership-first-dottie-voice-pipeline-2026-02-23.md`
- `docs/runbooks/voice-train-colab-bootstrap-2026-02-23.md`
- `scripts/voice/colab_run_once.sh`
- `server/routes/train-status.ts`
- `server/services/voice-bundle/validator.ts`
- `docs/architecture/voice-bundle-format.md`

## Baseline lock

Use this baseline and continue forward only:
- `origin/main@032f2264`

Execution ledger for this wave:
- `reports/helix-ask-tts-prod-lane-ledger-2026-02-23.md`

## Shared guardrails (apply to every prompt)

```text
Hard constraints:
1) Keep current audiocraft lane intact, but classify it as experimental only.
2) Build additive production lane; do not break existing /api/train/status, /api/train/start, /api/train/job/:id.
3) Keep /api/voice/speak behavior non-breaking.
4) Production lane must emit deterministic PROGRESS/STATS/ARTIFACT lines.
5) Production lane must output voice_bundle/1 and pass validateVoiceBundle.
6) One prompt = one commit.
7) If blocked, ship maximal safe additive subset and continue.

Mandatory Casimir verification after each prompt:
npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

If verdict FAIL:
- fix first failing HARD constraint
- rerun until PASS

Per-prompt report block fields:
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
```

## Deterministic done checklist

- [ ] Prompt path scope honored for each slice.
- [ ] Existing train routes remain backward compatible.
- [ ] New `tts_prod_train` lane emits PROGRESS/STATS/ARTIFACT deterministically.
- [ ] Production training output includes `voice_bundle/manifest.json` with `bundle_version=voice_bundle/1`.
- [ ] `validateVoiceBundle` pass recorded for production bundle.
- [ ] Casimir PASS recorded per prompt with integrity true.
- [ ] Ledger and final readiness report updated.

## Single autorun launcher prompt (paste into Codex Cloud)

```text
AUTORUN. STRICT SEQUENTIAL MODE.
Run Prompt 0 through Prompt 8 in strict order, one commit per prompt.

Primary source of truth:
- docs/audits/research/helix-ask-tts-prod-lane-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md
- reports/helix-ask-tts-prod-lane-ledger-2026-02-23.md

Baseline lock:
- origin/main@032f2264
- If origin/main is ahead, do not reset backward; continue from current main and execute remaining prompts.

Global rules:
1) Additive changes only.
2) Do not break existing train/voice APIs.
3) Preserve existing audiocraft scripts and runbooks; mark them experimental where needed.
4) For production lane, emit deterministic PROGRESS/STATS/ARTIFACT lines and write train_status JSON.
5) After each prompt: run prompt checks + Casimir verify.
6) If Casimir FAIL: fix first HARD fail and rerun until PASS.
7) Update wave ledger after each prompt commit.
8) If blocked, mark prompt status partial-blocked/blocked with deterministic reason, commit safe subset, continue.

Per-prompt loop:
1) Implement current prompt scope only.
2) Run prompt checks.
3) Run Casimir verify command.
4) Fix first HARD failure if needed and rerun Casimir to PASS.
5) Commit with prefix: "prompt-<N>:".
6) Update ledger prompt table + report block with Casimir fields and commit sha.
7) Print compact checkpoint summary.

Final deliverables:
1) ordered commit table Prompt 0..8
2) artifact existence table
3) GO/NO-GO with blockers
4) final Casimir PASS block (certificate hash + integrity)
```

## Prompt index

| Prompt | Objective |
|---|---|
| Prompt 0 | Wave ledger and scope lock |
| Prompt 1 | Production-lane architecture docs + experimental labeling |
| Prompt 2 | Add production trainer Docker lane scaffold |
| Prompt 3 | Add one-command production trainer orchestrator |
| Prompt 4 | Add deterministic production trainer script + bundle export |
| Prompt 5 | Add `tts_prod_train` support to train status routes |
| Prompt 6 | Add tests for production lane parsing + bundle validation |
| Prompt 7 | Add runbook and operator command surface |
| Prompt 8 | Final readiness closure report |

## Prompt 0: Wave ledger and scope lock

```text
Objective:
Initialize deterministic execution tracking for production TTS lane wave.

Allowed paths:
- reports/helix-ask-tts-prod-lane-ledger-2026-02-23.md (new)
- docs/audits/research/helix-ask-tts-prod-lane-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md

Requirements:
1) Add prompt table for Prompt 0..8.
2) Add blocker policy and done checklist.
3) Add per-prompt report block template.

Checks:
- casimir verify command
```

## Prompt 1: Architecture docs + experimental boundary

```text
Objective:
Document hybrid model: existing audiocraft lane experimental, new production lane authoritative.

Allowed paths:
- docs/architecture/voice-bundle-format.md
- docs/runbooks/voice-train-colab-bootstrap-2026-02-23.md
- docs/architecture/voice-service-contract.md

Requirements:
1) Mark audiocraft/colab lane as experimental/best-effort.
2) Define production lane artifact contract: train_status + dataset manifest + voice_bundle.
3) Keep serving contract non-breaking.

Checks:
- casimir verify command
```

## Prompt 2: Production Docker lane scaffold

```text
Objective:
Add additive docker lane for production trainer.

Allowed paths:
- docker/voice-train-prod/Dockerfile (new)
- docker/voice-train-prod/run_voice_train_prod.sh (new)
- docker/voice-train-prod/README.md (new)

Requirements:
1) Build-time dependency install; no runtime dependency improvisation.
2) Entrypoint emits deterministic final report block.
3) Writes artifacts under existing repository paths (artifacts/, checkpoints/, bundles/).

Checks:
- casimir verify command
```

## Prompt 3: One-command production orchestrator

```text
Objective:
Add one command for operators and Codex Cloud.

Allowed paths:
- scripts/voice/train_production_voice.sh (new)
- scripts/voice/colab_run_once.sh

Requirements:
1) Support TRAIN_BACKEND=local_docker (required), managed_job (stub with deterministic blocked reason).
2) Validate commit/head and required input audio path.
3) Run production docker lane and print log tails on failure.

Checks:
- casimir verify command
```

## Prompt 4: Deterministic production trainer script + bundle export

```text
Objective:
Add production trainer script that emits stable job protocol and outputs voice bundle.

Allowed paths:
- scripts/voice/train_production_tts.py (new)
- scripts/voice/export_voice_bundle.py (new)
- server/services/voice-bundle/validator.ts

Requirements:
1) Emit PROGRESS, STATS, ARTIFACT lines deterministically.
2) Write train_status JSON with completed/error states and details.
3) Export voice_bundle/manifest.json with bundle_version=voice_bundle/1.
4) Validate bundle with validateVoiceBundle before final success.

Checks:
- npx vitest run tests/voice-bundle.validator.spec.ts
- casimir verify command
```

## Prompt 5: Train route integration for `tts_prod_train`

```text
Objective:
Integrate new production job type without breaking existing train routes.

Allowed paths:
- server/routes/train-status.ts
- tests/train-status.routes.spec.ts

Requirements:
1) Add jobType `tts_prod_train` path.
2) Preserve existing `train` and `tts_voice_train` behaviors.
3) Parse and surface PROGRESS/STATS/ARTIFACT from production script.

Checks:
- npx vitest run tests/train-status.routes.spec.ts
- casimir verify command
```

## Prompt 6: Production-lane tests

```text
Objective:
Add deterministic tests for production lane contracts.

Allowed paths:
- tests/train-status.routes.spec.ts
- tests/voice-bundle.validator.spec.ts
- tests/voice.offline-core.spec.ts

Requirements:
1) Add coverage for `tts_prod_train` status parsing and artifact refs.
2) Add test fixture for production bundle validation pass/fail.
3) Keep offline-core expectations unchanged.

Checks:
- npx vitest run tests/train-status.routes.spec.ts tests/voice-bundle.validator.spec.ts tests/voice.offline-core.spec.ts
- casimir verify command
```

## Prompt 7: Runbook and operations

```text
Objective:
Ship operator runbook for production lane.

Allowed paths:
- docs/runbooks/voice-train-prod-lane-2026-02-23.md (new)
- docs/BUSINESS_MODEL.md

Requirements:
1) One-command workflows for local docker and managed-job stub.
2) Deterministic failure taxonomy and unblock actions.
3) Economics section: experimental lane vs production lane.

Checks:
- casimir verify command
```

## Prompt 8: Final readiness closure

```text
Objective:
Publish final readiness report and close wave.

Allowed paths:
- reports/helix-ask-tts-prod-lane-readiness-2026-02-23.md (new)
- reports/helix-ask-tts-prod-lane-ledger-2026-02-23.md

Requirements:
1) Ordered commit table Prompt 0..8.
2) Artifact existence table (bundle, status, scripts, docker lane, runbook).
3) GO/NO-GO with deterministic blockers.
4) Final Casimir PASS block.

Checks:
- casimir verify command
```

