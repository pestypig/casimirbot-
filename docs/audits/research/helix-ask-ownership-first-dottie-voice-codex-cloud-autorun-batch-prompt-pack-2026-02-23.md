# Helix Ask Ownership-First Dottie Voice Codex Cloud Autorun Batch Prompt Pack (2026-02-23)

Derived from:
- `docs/audits/research/helix-ask-ownership-first-dottie-voice-pipeline-2026-02-23.md`
- `server/routes/voice.ts`
- `server/startup-config.ts`
- `docs/architecture/voice-service-contract.md`
- `server/routes/train-status.ts`
- `external/audiocraft/scripts/prepare_knowledge_audio.py`
- `external/audiocraft/scripts/train_spectral_adapter.py`
- `docs/helix-ask-agent-policy.md`
- `docs/helix-ask-runtime-limitations.md`
- `docs/BUSINESS_MODEL.md`

## Baseline lock

Use this exact baseline and do not reopen completed slices:
- `origin/main@d602240c`

Execution ledger for this wave:
- `reports/helix-ask-ownership-first-dottie-voice-ledger-2026-02-23.md`

Ledger policy:
- update prompt table and per-prompt report block after every prompt commit.
- Prompt 0 initialized in `reports/helix-ask-ownership-first-dottie-voice-ledger-2026-02-23.md`; continue strict Prompt 1..10 sequencing from that ledger.

## Shared guardrails (apply to every prompt)

```text
Hard constraints:
1) Ownership-first is mandatory for production core callouts.
2) Mission callouts must remain functional with managed providers fully disabled.
3) Keep /api/voice/speak non-breaking.
4) Keep /api/agi/ask behavior unchanged.
5) Managed providers remain fallback-only and non-critical.
6) Additive changes only; no destructive refactors.
7) One commit per prompt scope.
8) If blocked, ship maximal safe additive subset and continue.

Mandatory verification after each prompt:
npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

If verdict FAIL:
- fix first failing HARD constraint
- rerun until PASS

Per-prompt report block:
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
- [ ] Local-only core callout path enforced.
- [ ] Managed-provider disabled mode tested.
- [ ] Voice contract remains non-breaking.
- [ ] Casimir verify PASS recorded per prompt with integrity true.
- [ ] Ledger updated after each prompt commit.

## Single autorun launcher prompt (paste into Codex Cloud)

```text
Execution mode:
AUTORUN. Run Prompt 0 through Prompt 10 in strict order with one commit per prompt.

Primary source of truth:
- docs/audits/research/helix-ask-ownership-first-dottie-voice-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md
- docs/audits/research/helix-ask-ownership-first-dottie-voice-pipeline-2026-02-23.md

Baseline lock:
- origin/main@d602240c

Global rules:
1) Keep changes additive and non-breaking.
2) Mission callouts must always work when managed providers are disabled.
3) /api/voice/speak public contract must stay backward compatible.
4) Managed providers can only be used in explicit non-critical fallback paths.
5) After each prompt, run required checks + Casimir verify.
6) On Casimir FAIL, repair first failing HARD constraint and rerun.
7) Update voice wave ledger after each prompt commit.
8) Do not claim completion without final PASS and integrityOk true.

Final deliverables:
- ordered commit table
- artifact existence table
- final GO/NO-GO + blockers
- final Casimir PASS block
```

## Prompt 0: Wave ledger and scope lock

```text
Objective:
Initialize deterministic execution tracking for ownership-first voice wave.

Allowed paths:
- reports/helix-ask-ownership-first-dottie-voice-ledger-2026-02-23.md (new)
- docs/audits/research/helix-ask-ownership-first-dottie-voice-codex-cloud-autorun-batch-prompt-pack-2026-02-23.md

Requirements:
1) Add prompt table for Prompt 0..10.
2) Add ownership non-negotiables.
3) Add blocker policy and done checklist.

Checks:
- casimir verify command
```

## Prompt 1: Contract and policy hardening

```text
Objective:
Document ownership-first voice contract and policy constraints.

Allowed paths:
- docs/architecture/voice-service-contract.md
- docs/helix-ask-agent-policy.md
- docs/helix-ask-runtime-limitations.md

Requirements:
1) Document local-only mission callout rule.
2) Document managed fallback as non-critical only.
3) Document consent and voice profile governance fields.
4) Preserve compatibility language for existing clients.

Checks:
- casimir verify command
```

## Prompt 2: Startup config enforcement

```text
Objective:
Add runtime config controls for managed-provider disable and local-only mode.

Allowed paths:
- server/startup-config.ts
- tests/startup-config.spec.ts

Requirements:
1) Add explicit managed-provider enable/disable flag(s).
2) Add local-only mode flag(s) with safe defaults.
3) Validate and expose deterministic startup config state.

Checks:
- npx vitest run tests/startup-config.spec.ts
- casimir verify command
```

## Prompt 3: Voice route ownership guardrails

```text
Objective:
Enforce routing policy in /api/voice/speak without breaking API behavior.

Allowed paths:
- server/routes/voice.ts
- tests/voice.routes.spec.ts

Requirements:
1) Mission-critical requests route local-only.
2) Managed providers allowed only when enabled and non-critical.
3) Preserve deterministic envelopes and existing success/failure shapes.
4) Keep provider-governance and budget controls intact.

Checks:
- npx vitest run tests/voice.routes.spec.ts
- casimir verify command
```

## Prompt 4: Voice bundle format and validator

```text
Objective:
Define and enforce portable voice artifact bundle structure.

Allowed paths:
- docs/architecture/voice-bundle-format.md (new)
- server/services/voice-bundle/validator.ts (new)
- tests/voice-bundle.validator.spec.ts (new)

Requirements:
1) Define manifest schema and required files.
2) Validate checksums and required metadata.
3) Return deterministic validation failures.

Checks:
- npx vitest run tests/voice-bundle.validator.spec.ts
- casimir verify command
```

## Prompt 5: Voice service contract wiring

```text
Objective:
Wire local TTS service contract mapping via TTS_BASE_URL with non-breaking proxy behavior.

Allowed paths:
- server/routes/voice.ts
- docs/architecture/voice-service-contract.md
- tests/voice.routes.spec.ts

Requirements:
1) Keep existing request shape accepted.
2) Add optional voice_profile_id pass-through support.
3) Preserve dry-run and deterministic error behavior.

Checks:
- npx vitest run tests/voice.routes.spec.ts
- casimir verify command
```

## Prompt 6: Dataset preparation mode for voice training

```text
Objective:
Extend dataset prep script for voice dataset normalization and manifest generation.

Allowed paths:
- external/audiocraft/scripts/prepare_knowledge_audio.py
- server/routes/train-status.ts
- tests/train-status.routes.spec.ts (new or update)

Requirements:
1) Add voice_dataset mode.
2) Emit deterministic dataset manifest with checksums.
3) Expose job status metadata for voice dataset jobs.

Checks:
- npx vitest run tests/train-status.routes.spec.ts
- casimir verify command
```

## Prompt 7: Training runner job-type extension

```text
Objective:
Extend training runner entrypoint with TTS job type while preserving existing behavior.

Allowed paths:
- external/audiocraft/scripts/train_spectral_adapter.py
- server/routes/train-status.ts
- tests/train-status.routes.spec.ts

Requirements:
1) Add tts_voice_train job type path.
2) Preserve existing spectral_adapter behavior.
3) Surface output artifact refs in job status.

Checks:
- npx vitest run tests/train-status.routes.spec.ts
- casimir verify command
```

## Prompt 8: Evaluation and offline-core regression gates

```text
Objective:
Add deterministic regression checks for ownership and mission-callout continuity.

Allowed paths:
- tests/voice.offline-core.spec.ts (new)
- tests/voice.routes.spec.ts
- docs/runbooks/voice-eval-gates-2026-02-23.md (new)

Requirements:
1) Add managed-providers-disabled integration checks.
2) Confirm mission callout synthesis path succeeds in local-only mode.
3) Add deterministic regression prompt suite harness hooks.

Checks:
- npx vitest run tests/voice.offline-core.spec.ts tests/voice.routes.spec.ts
- casimir verify command
```

## Prompt 9: Governance and business docs closure

```text
Objective:
Close policy, runtime, and business docs for ownership-first voice mode.

Allowed paths:
- docs/helix-ask-agent-policy.md
- docs/helix-ask-runtime-limitations.md
- docs/BUSINESS_MODEL.md

Requirements:
1) Document consent requirements and usage boundaries.
2) Document local-only ops limits and fallback behavior.
3) Document economics for managed-off vs fallback-enabled modes.

Checks:
- casimir verify command
```

## Prompt 10: Final closure readiness report

```text
Objective:
Publish final readiness report for ownership-first voice wave.

Allowed paths:
- reports/helix-ask-ownership-first-dottie-voice-readiness-2026-02-23.md (new)
- reports/helix-ask-ownership-first-dottie-voice-ledger-2026-02-23.md

Requirements:
1) Include ordered commit table Prompt 0..10.
2) Include artifact existence table.
3) Include GO/NO-GO with explicit blockers.
4) Include final Casimir PASS block with certificate hash and integrity status.

Checks:
- casimir verify command
```
