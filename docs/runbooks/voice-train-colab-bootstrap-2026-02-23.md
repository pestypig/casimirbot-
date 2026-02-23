# Voice Train Colab Bootstrap (2026-02-23)

This runbook is the reproducible path for Python 3.12 Colab sessions where
`xformers` wheels are unavailable.

## What changed

- `external/audiocraft/audiocraft/__init__.py` now uses lazy submodule imports.
- `external/audiocraft/requirements.train-py312.txt` defines a non-xformers
  dependency set for training.
- `scripts/voice/bootstrap_colab_train.sh` installs deps, validates audio,
  and runs prepare/train using torch attention backend.

## Colab usage

```bash
cd /content
test -d casimirbot- || git clone https://github.com/pestypig/casimirbot-.git
cd casimirbot-
git fetch origin main
git checkout main
git pull --rebase origin main
bash scripts/voice/bootstrap_colab_train.sh
```

## Required input

- `data/knowledge_audio_source/auntie_dottie.flac` must exist and be real audio
  (>5MB, not an LFS pointer).

## Outputs

- `external/audiocraft/data/knowledge_audio/voice_dataset_manifest.json`
- `external/audiocraft/checkpoints/train_status.json`
- `checkpoints/tts_voice_train_musicgen_small.pt`
