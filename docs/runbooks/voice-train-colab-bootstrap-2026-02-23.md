# Voice Train Colab Bootstrap (2026-02-23)

> Status: **experimental lane** (best-effort). Use `tts_prod_train` for production-authoritative voice artifacts.

This runbook is the reproducible path for Python 3.12 Colab sessions where
`xformers` wheels are unavailable.

## What changed

- `external/audiocraft/audiocraft/__init__.py` now uses lazy submodule imports.
- `external/audiocraft/requirements.train-py312.txt` defines a non-xformers
  dependency set for training.
- `scripts/voice/bootstrap_colab_train.sh` installs deps, validates audio,
  and runs prepare/train using torch attention backend.
- `scripts/voice/run_colab_train.py` orchestrates bootstrap + artifact checks
  and always emits a deterministic final `=== COLAB TRAIN REPORT ===` block.
- `external/audiocraft/scripts/train_spectral_adapter.py` now includes CPU smoke
  lane stabilization:
  - force LM to `float32` on CPU (`cpu_mode_cast=float32`)
  - sanitize non-finite logits (`nan_to_num`) and clamp CPU logits before CE
  - deterministic hard-fail on non-finite loss with status artifact emission

## Latest reproducible baseline (2026-02-23)

- Repo head: `6442a579`
- Result: `objective_status: completed` on CPU Colab smoke lane
- Final training status:
  - `status: completed`
  - `loss: 9.698966026306152` (finite)
  - `checkpoint: checkpoints/tts_voice_train_musicgen_small.pt`
  - `checkpoint_sha256: 64242758c67eff5e2c3a54f96a33ec5b08b182a98f5c2ab286c7aa3897ec8e86`

Use this baseline for regression checks when the lane changes.

## Colab usage

### One-command entrypoint (recommended)

```bash
cd /content
rm -rf casimirbot-
git clone https://github.com/pestypig/casimirbot-.git
cd casimirbot-
EXPECTED_HEAD=6442a579 bash scripts/voice/colab_run_once.sh
```

This avoids Python-in-bash quoting errors and enforces a fresh sync before
running training.

Note: if you compare short SHAs manually, use `git rev-parse --short=8 HEAD`.
`git rev-parse --short HEAD` may emit 7 chars and cause false mismatches.

### Manual sequence

```bash
cd /content
test -d casimirbot- || git clone https://github.com/pestypig/casimirbot-.git
cd casimirbot-
git fetch origin main
git checkout main
git pull --rebase origin main
python scripts/voice/run_colab_train.py
```

## Optional flags/env

- `RUN_GIT_SYNC=1` to force in-script `git fetch/checkout/pull`.
- `CLEAR_PREVIOUS_ARTIFACTS=1` (default) removes stale manifest/status/checkpoint
  before each run.
- `RESET_TRAIN_OUTPUTS=1` (default) removes stale status/checkpoint at bootstrap
  right before prepare/train execution.
- `EFFICIENT_ATTENTION_BACKEND=torch` is the expected default.
- `RUN_PREPARE=0` or `RUN_TRAIN=0` are passed through to bootstrap when needed.
- `AUDIO_PATH=data/knowledge_audio_source/auntie_dottie.flac` selects the source
  file used for preflight checks.
- `KNOWLEDGE_SOURCE_DIR=data/knowledge_audio_source` is passed explicitly to
  prepare so source discovery cannot drift from shell defaults.
- `KNOWLEDGE_AUDIO_DIR=external/audiocraft/data/knowledge_audio` sets the staged
  dataset output path and is validated before training starts.
- `INSTALL_AUDIOCRAFT_EDITABLE=auto` (default) attempts editable install with
  `--no-build-isolation`; on failure, bootstrap falls back to source import via
  `PYTHONPATH` instead of aborting.
- If `python -m pip` is missing in a runtime image, bootstrap auto-recovers via
  `ensurepip` and then `get-pip.py` fallback (`PIP_BOOTSTRAP_URL` overrideable).
- On wrapper failures, full bootstrap logs are written to:
  - `artifacts/colab_bootstrap_stdout.log`
  - `artifacts/colab_bootstrap_stderr.log`

## Required input

- `data/knowledge_audio_source/auntie_dottie.flac` must exist and be real audio
  (>5MB, not an LFS pointer).

## Outputs

- `external/audiocraft/data/knowledge_audio/voice_dataset_manifest.json`
- `external/audiocraft/checkpoints/train_status.json`
- `checkpoints/tts_voice_train_musicgen_small.pt`

## Reproducibility gates (must pass)

- `=== COLAB TRAIN REPORT ===` exists and reports:
  - `objective_status: completed`
  - `first_failed_step: none`
  - `root_cause: none`
- `external/audiocraft/checkpoints/train_status.json` exists and reports:
  - `status: completed`
  - finite numeric `loss` (not `NaN`, not `Inf`)
- `checkpoints/tts_voice_train_musicgen_small.pt` exists and is non-empty
- If `status: completed` with non-finite loss, treat as failure/regression


## Production boundary

- Colab bootstrap is preserved for exploratory iteration and compatibility.
- Production promotion must come from the deterministic `tts_prod_train` lane that writes train-status JSON, dataset manifest, and validated voice bundle outputs.
- `/api/voice/speak` compatibility is unchanged by this runbook; this document does not redefine serving contracts.
