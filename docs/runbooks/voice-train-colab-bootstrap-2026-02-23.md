# Voice Train Colab Bootstrap (2026-02-23)

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

## Colab usage

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
