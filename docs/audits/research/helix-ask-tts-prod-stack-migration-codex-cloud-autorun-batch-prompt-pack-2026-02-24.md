# Helix Ask Production TTS Stack Migration Codex Cloud Autorun Batch Prompt Pack (2026-02-24)

Derived from:
- decision-ready research brief (2026-02-24) selecting NeMo primary and ESPnet backup
- `docs/runbooks/voice-train-colab-bootstrap-2026-02-23.md`
- `docs/runbooks/voice-train-prod-lane-2026-02-23.md`
- `docs/architecture/voice-service-contract.md`
- `docs/architecture/voice-bundle-format.md`
- `server/routes/train-status.ts`
- `server/services/voice-bundle/validator.ts`

## Baseline lock

Use this baseline and continue forward only:
- `origin/main@dc2a2f13`

Execution ledger for this wave:
- `reports/helix-ask-tts-prod-stack-wave1-ledger-2026-02-24.md`

## Shared guardrails (apply to every prompt)

```text
Hard constraints:
1) Keep current audiocraft/musicgen lane intact and explicitly experimental.
2) Additive changes only; do not break existing /api/train/* contracts.
3) Preserve /api/voice/speak contract and local-first assumptions.
4) Production lane surfaces must emit deterministic PROGRESS/STATS/ARTIFACT and train_status.json.
5) Enforce weights/license manifest gate before production promotion.
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

- [ ] Existing `tts_voice_train` behavior remains backward compatible.
- [ ] `tts_prod_train_nemo` added additively with deterministic status/report behavior.
- [ ] Weights/license manifest gate implemented and enforced for promotion surface.
- [ ] Colab lane remains marked experimental smoke.
- [ ] Casimir PASS recorded for each prompt with integrity true.
- [ ] Wave ledger and final readiness report updated.

## Single autorun launcher prompt (paste into Codex Cloud)

```text
AUTORUN. STRICT SEQUENTIAL MODE.
Run Prompt 0 through Prompt 7 in strict order, one commit per prompt.

Primary source of truth:
- docs/audits/research/helix-ask-tts-prod-stack-migration-codex-cloud-autorun-batch-prompt-pack-2026-02-24.md
- reports/helix-ask-tts-prod-stack-wave1-ledger-2026-02-24.md

Baseline lock:
- origin/main@dc2a2f13
- If origin/main is ahead, do not reset backward; continue from current main and execute remaining prompts.

Global rules:
1) Additive changes only.
2) Keep audiocraft lane experimental and non-breaking.
3) Implement NeMo-first production lane scaffolding and gates only (no destructive replacement).
4) Emit deterministic PROGRESS/STATS/ARTIFACT + train_status for production surfaces.
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
1) ordered commit table Prompt 0..7
2) artifact/gate table
3) GO/NO-GO with blockers
4) final Casimir PASS block (certificate hash + integrity)
5) operator-ready commands for Colab experimental lane and production lane
```

## Prompt index

| Prompt | Objective |
|---|---|
| Prompt 0 | Wave ledger + scope lock |
| Prompt 1 | ADR + policy lock for stack and licensing |
| Prompt 2 | Weights/license manifest schema + validator |
| Prompt 3 | Production job scaffold (`tts_prod_train_nemo`) |
| Prompt 4 | Train route integration + deterministic parsing |
| Prompt 5 | Tests for new gate/route behavior |
| Prompt 6 | Runbooks and operator commands |
| Prompt 7 | Final readiness closure report |

## Prompt 0: Wave ledger + scope lock

```text
Objective:
Initialize deterministic execution tracking for NeMo-first production lane wave.

Allowed paths:
- reports/helix-ask-tts-prod-stack-wave1-ledger-2026-02-24.md (new)
- docs/audits/research/helix-ask-tts-prod-stack-migration-codex-cloud-autorun-batch-prompt-pack-2026-02-24.md

Requirements:
1) Add prompt table for Prompt 0..7.
2) Add blocker policy and done checklist.
3) Add per-prompt report block template.

Checks:
- casimir verify command
```

## Prompt 1: ADR + licensing policy lock

```text
Objective:
Record explicit production stack decision and promotion policy.

Allowed paths:
- docs/adr/adr-tts-stack-selection-2026-02-24.md (new)
- docs/runbooks/voice-train-prod-lane-2026-02-23.md

Requirements:
1) Primary: NeMo TTS; backup: ESPnet2.
2) Keep audiocraft lane experimental only.
3) Add NO-GO policy for non-commercial/unclear weights.
4) Separate code-license facts from weight-license facts.

Checks:
- casimir verify command
```

## Prompt 2: Weights/license manifest schema + validator

```text
Objective:
Create enforceable promotion gate for model/weights licensing and provenance.

Allowed paths:
- configs/voice/weights-manifest.schema.json (new)
- configs/voice/weights-manifest.example.json (new)
- scripts/voice/verify_weights_manifest.py (new)
- package.json

Requirements:
1) Required fields include:
   - model_id, source_url, code_license, weights_license
   - commercial_use_allowed (bool), attribution_required (bool)
   - evidence_links[], checksum, created_at
2) Validator exits non-zero on missing/invalid fields.
3) Add npm script alias for validator execution.

Checks:
- python -m py_compile scripts/voice/verify_weights_manifest.py
- casimir verify command
```

## Prompt 3: Production job scaffold (`tts_prod_train_nemo`)

```text
Objective:
Add additive NeMo production training job scaffold with deterministic outputs.

Allowed paths:
- scripts/voice/train_production_nemo.py (new)
- scripts/voice/train_production_voice.sh

Requirements:
1) Emit deterministic PROGRESS/STATS/ARTIFACT lines.
2) Write train_status.json completed/error payloads with stable field names.
3) If dependencies/runtime unavailable, emit deterministic blocked reason and non-zero exit.
4) Keep existing job types unchanged.

Checks:
- python -m py_compile scripts/voice/train_production_nemo.py
- casimir verify command
```

## Prompt 4: Train route integration + parsing

```text
Objective:
Integrate `tts_prod_train_nemo` into existing train routes without regression.

Allowed paths:
- server/routes/train-status.ts
- tests/train-status.routes.spec.ts

Requirements:
1) Add jobType handling for `tts_prod_train_nemo`.
2) Preserve existing `train` and `tts_voice_train` behavior.
3) Parse and persist deterministic PROGRESS/STATS/ARTIFACT signals.

Checks:
- npx vitest run tests/train-status.routes.spec.ts
- casimir verify command
```

## Prompt 5: Tests for gates and artifacts

```text
Objective:
Extend deterministic test coverage for licensing gate and production lane behavior.

Allowed paths:
- tests/train-status.routes.spec.ts
- tests/voice-bundle.validator.spec.ts
- tests/voice.offline-core.spec.ts
- tests/voice.weights-manifest.spec.ts (new)

Requirements:
1) Add validator pass/fail cases for weights manifest.
2) Add route tests for `tts_prod_train_nemo` status/artifact parsing.
3) Keep offline-core behavior unchanged.

Checks:
- npx vitest run tests/train-status.routes.spec.ts tests/voice-bundle.validator.spec.ts tests/voice.offline-core.spec.ts tests/voice.weights-manifest.spec.ts
- casimir verify command
```

## Prompt 6: Runbooks and operator command surface

```text
Objective:
Publish operator-facing commands and promotion checklist.

Allowed paths:
- docs/runbooks/voice-train-prod-lane-2026-02-23.md
- docs/runbooks/voice-train-colab-bootstrap-2026-02-23.md

Requirements:
1) Keep Colab lane explicitly experimental.
2) Document production lane command flow and weights-manifest gate.
3) Add operator checklist for deterministic promotion.

Checks:
- casimir verify command
```

## Prompt 7: Final readiness closure report

```text
Objective:
Write final closure report for this wave with deterministic evidence.

Allowed paths:
- docs/runbooks/reports/tts-prod-stack-wave1-closure-2026-02-24.md (new)
- reports/helix-ask-tts-prod-stack-wave1-ledger-2026-02-24.md

Requirements:
1) Ordered commit table Prompt 0..7.
2) Gate status table (weights manifest, train route, tests, Casimir).
3) Explicit GO/NO-GO and remaining blockers.
4) Final Casimir PASS block with certificate hash and integrity flag.

Checks:
- casimir verify command
```
