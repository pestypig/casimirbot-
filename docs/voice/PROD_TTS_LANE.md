# Production TTS lane (NeMo scaffold)

This lane runs in parallel with Auntie Dottie smoke training and is intended for production-candidate packaging with deterministic status/artifacts.

## Colab usage

```bash
cd /content/casimirbot-
PROD_TTS_DRY_RUN=1 bash scripts/voice/colab_run_prod_tts_once.sh
```

Real run (GPU runtime):

```bash
cd /content/casimirbot-
PROD_TTS_DRY_RUN=0 \
PROD_TTS_BASE_WEIGHTS_ID=nvidia/nemo-tts-fastpitch-en \
bash scripts/voice/colab_run_prod_tts_once.sh
```

## Dry-run vs real-run

- `PROD_TTS_DRY_RUN=1`: skips heavy NeMo training and emits deterministic status/eval/bundle artifacts for CI and contract checks.
- `PROD_TTS_DRY_RUN=0`: fail-closed scaffold mode. If NeMo is unavailable, `root_cause=nemo_runtime_unavailable`; if NeMo is available, this scaffold still exits blocked with `root_cause=real_training_not_implemented` until full trainer wiring lands.

## Required env vars

- `PROD_TTS_DRY_RUN` (`0|1`)
- `PROD_TTS_BASE_WEIGHTS_ID` (must exist in `configs/voice/prod_tts/weights_allowlist.json`)
- Optional overrides:
  - `PROD_TTS_ALLOWLIST`
  - `PROD_TTS_CONFIG`
  - `PROD_TTS_DATASET_MANIFEST`
  - `PROD_TTS_ARTIFACTS_DIR`
  - `PROD_TTS_STATUS_PATH`
  - `PROD_TTS_BUNDLE_DIR`
  - `PROD_TTS_PIP_CORE_SPECS`
  - `PROD_TTS_PIP_TTS_SPECS`

## Artifact layout

- `artifacts/prod_tts_train_status.json`
- `artifacts/prod_tts_eval.json`
- `checkpoints/prod_tts_voice_bundle/manifest.json`
- `checkpoints/prod_tts_voice_bundle/*.nemo` (or dry-run placeholders)

Manifest includes: bundle version, commit SHA, config/dataset hashes, selected weights + license references, and artifact checksums.

Notes:
- Missing config/dataset hashes now fail closed in bundle build.
- If dataset manifest is absent in dry-run, a deterministic synthetic manifest is generated under `PROD_TTS_ARTIFACTS_DIR`.

## Promotion checklist

1. Allowlist gate passes (weights present, commercial-safe, explicit `weights_license`, `code_license`, `license_url`).
2. Status JSON is `objective_status=ready_for_bundle` and `status=ok`.
3. Bundle manifest exists and checksum fields are populated.
4. Reproducibility fields present: commit, config hash, dataset hash.
5. Casimir verify gate PASS with certificate hash and integrity OK.
