# Production Voice Train Docker Lane

This lane is additive to `docker/voice-train/*` and is intended for deterministic production training runs.

## Build

```bash
docker build -f docker/voice-train-prod/Dockerfile -t casimir-voice-train-prod:latest .
```

## Run

```bash
docker run --rm -v "$PWD:/workspace/casimirbot-" casimir-voice-train-prod:latest
```

## Deterministic outputs

- `artifacts/train_status.tts_prod_train.json`
- `artifacts/voice_train_prod.log`
- `bundles/<voice_profile_id>/voice_bundle/manifest.json` (when training succeeds)

The entrypoint always prints a deterministic `=== DOCKER PROD TRAIN REPORT ===` block.
