# Ownership-First Auntie Dottie Read-Aloud Voice Pipeline Implementation Plan (2026-02-23)

## Section A: Executive recommendation

Build now with an ownership-first voice stack:
- production core callouts must run fully self-hosted,
- managed providers are fallback-only and non-critical,
- disabling managed providers must not break mission callouts.

Recommended direction:
- self-hosted training + self-hosted serving on permissive code licenses (MIT/Apache),
- exportable artifacts (weights, configs, tokenizer/phoneme assets, metadata),
- strict routing and policy gates to enforce local-first behavior.

Reject as core:
- AudioCraft as core TTS stack (objective mismatch and non-commercial released weight restrictions),
- provider-hosted custom voice as production core (fails ownership/exit constraints),
- GPL-entangling runtime dependencies in production distribution paths.

## Section B: Ownership compliance and method selection

### Ownership interpretation

Hard ownership means:
- mission voice continues when all managed providers are disabled,
- complete artifact portability to offline or air-gapped deployments,
- operator custody over voice artifacts and consent records.

### Ownership compliance checklist

Map enforcement to:
- `server/startup-config.ts`
- `server/routes/voice.ts`
- `docs/architecture/voice-service-contract.md`
- `docs/helix-ask-agent-policy.md`
- `docs/BUSINESS_MODEL.md`
- `docs/helix-ask-runtime-limitations.md`

Checklist:
- Artifact custody:
  - versioned voice bundles in operator-controlled storage,
  - signed manifest with checksums and provenance.
- Exportability:
  - portable bundle with all runtime dependencies declared,
  - at least one CPU-operable runtime path.
- Commercial status:
  - dependency and model/data license validation gate,
  - fail build when license artifacts are missing.
- Offline operability:
  - managed providers fully disable-able via config,
  - no hidden remote dependency in synthesis path.
- Provider exit readiness:
  - documented and tested 24h disable procedure,
  - no core feature loss for mission callouts.

### Method selection

Primary method:
- self-hosted TTS training and inference with permissive licensing,
- portable export format (ONNX or equivalent) for runtime portability.

Fallback method:
- managed providers allowed only for explicitly non-critical read-aloud,
- never used for mission-critical callouts.

### Rejected alternatives

- AudioCraft core TTS path: reject for this objective.
- Provider-hosted custom voice as core: reject for ownership and lock-in reasons.
- GPL runtime coupling in production core path: reject unless business explicitly accepts GPL obligations.

## Section C: Architecture and API contracts

### Architecture v1

Core components:
1. Local Voice Service (self-hosted synthesis service).
2. Voice proxy (`POST /api/voice/speak`) remains stable and non-breaking.
3. Voice profile registry (operator-managed).
4. Voice bundle validation at boot/runtime.
5. Optional managed-provider fallback lane (non-critical only).

### Routing policy

Enforce in `server/routes/voice.ts`:
- mission callouts route to local voices only,
- managed providers require explicit allow + non-critical classification,
- deterministic fallback order:
  - target local voice profile,
  - local generic fallback profile,
  - structured error if local synthesis unavailable.

### Startup policy

Enforce in `server/startup-config.ts`:
- `VOICE_MANAGED_PROVIDERS_ENABLED` (default false in ownership mode),
- `VOICE_LOCAL_ONLY` and/or equivalent hard switch,
- clear startup logs for active policy mode.

### Contract posture

Keep `docs/architecture/voice-service-contract.md` non-breaking:
- preserve public request/response shape,
- allow additive optional fields for internal routing metadata.

## Section D: Training backend and local artifact handoff

### Backend role

Default training backend is Codex Cloud compute.
Colab is optional fallback for experimentation only.
Production acceptance requires local reproducibility and offline serving validation regardless of where training ran.

### Training blueprint (backend-agnostic)

1. Environment lock:
   - pinned dependencies, deterministic config capture.
2. Dataset ingest:
   - normalized audio + transcript validation + manifest with checksums.
3. Train/fine-tune:
   - single-speaker Auntie Dottie profile objective.
4. Export:
   - portable artifact package.
5. Handoff:
   - local offline load test and regression suite pass required.

### Backend selection policy

- `TRAIN_BACKEND=codex_cloud` (default)
- `TRAIN_BACKEND=colab` (fallback, non-authoritative)
- `TRAIN_BACKEND=local` (offline/local GPU path)

Use the same dataset manifest, training config, and export bundle shape for all backends so file setup and promotion gates are unchanged.

### Required handoff artifacts

Voice bundle includes:
- model artifact(s),
- inference config,
- tokenizer/phoneme assets,
- manifest with dataset hash refs and license metadata,
- consent assertion metadata.

## Section E: Voice customization and governance

### Voice profile model

Voice profile fields:
- `voice_profile_id`
- `voice_profile_version`
- `artifact_ref`
- `consent_assertions`
- `license_bom`
- `allowed_use` flags
- `fallback_order`

### Consent and policy

Require explicit consent assertions for any cloned/custom voice profile.
Document policy in `docs/helix-ask-agent-policy.md`:
- non-impersonation controls,
- permitted use classes,
- disclosure requirements.

### Watermark/provenance

Support optional watermarking for non-critical read-aloud.
Keep mission callouts latency-first unless enterprise policy overrides.

## Section F: Evaluation, SLOs, release gates

### Evaluation framework

Combine:
- subjective listening checks,
- intelligibility checks (ASR parity/WER-style),
- speaker-similarity proxy checks,
- latency and reliability measurements.

### Deterministic regression suite

Add fixed prompt suite covering:
- mission templates,
- numeric/time callouts,
- abbreviations and punctuation edge cases.

Release gate conditions:
- license/consent checks pass,
- offline synthesis path passes,
- managed-provider-disabled integration test passes,
- latency SLOs pass on target hardware profiles.

## Section G: Delivery plan

### 30 days

- enforce local-only policy toggles and routing rules,
- define voice bundle format and validator,
- establish local fallback voice path,
- keep public `/api/voice/speak` non-breaking.

### 60 days

- implement dataset prep + training job runner integration,
- produce first Auntie Dottie candidate bundle,
- add eval harness and CI gates.

### 90 days

- harden packaging for offline deployment,
- add enterprise controls and optional watermark mode,
- finalize managed-provider fallback governance and monitoring.

## Section H: Business model and unit economics

- default to local synthesis to control marginal cost,
- treat managed provider usage as explicit, metered fallback spend,
- expose ownership-mode economics vs fallback-enabled economics in `docs/BUSINESS_MODEL.md`.

## Section I: Risk register

- License integrity risk -> artifact-level license gate.
- GPL contamination risk -> block or isolate non-permissive dependencies from production core.
- Provider lock-in regression -> CI test with providers disabled.
- Consent/compliance risk -> strict consent package and audit trail.
- Reproducibility risk -> local replay and deterministic export checks.
- Evidence posture drift -> read-aloud-only invariants and text parity tests.

## Section J: Open leadership decisions

- Approve primary self-hosted stack and training pipeline.
- Approve consent/voice talent governance policy.
- Decide default watermark posture.
- Decide whether managed fallback is allowed in restricted deployments.
- Approve artifact hosting and signing model.

## Section K: Codex Cloud implementation slices

Suggested slice sequence:
1. Enforce local-only startup and routing policy.
2. Keep voice proxy non-breaking while mapping to local service contract.
3. Add voice bundle spec + validation module.
4. Extend dataset prep script for voice dataset mode.
5. Extend training runner for TTS job mode and status reporting.
6. Add evaluation harness and managed-providers-disabled integration tests.
7. Update policy/runtime/business docs with ownership controls.
8. Add optional watermarking lane for non-critical outputs.
