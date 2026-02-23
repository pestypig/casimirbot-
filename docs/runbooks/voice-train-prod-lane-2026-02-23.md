# Voice Train Production Lane Runbook (2026-02-23)

Status: production-authoritative lane for `tts_prod_train`.

## One-command workflows

### Local docker (required path)

```bash
TRAIN_BACKEND=local_docker AUDIO_PATH=data/knowledge_audio_source/auntie_dottie.flac bash scripts/voice/train_production_voice.sh
```

### Managed job (stub)

```bash
TRAIN_BACKEND=managed_job bash scripts/voice/train_production_voice.sh
```

Expected deterministic result:

- process exits with code `2`
- line: `[tts-prod] status=blocked reason=managed_job_not_implemented`

## Deterministic failure taxonomy

| Code/Line | Meaning | Unblock action |
|---|---|---|
| `deterministic_head_mismatch` | checkout does not match required head | sync repo and rerun with expected SHA |
| `missing_audio_path` | input audio missing | stage source audio into `data/knowledge_audio_source` |
| `docker_build_failed` | production image failed build | inspect `artifacts/voice_train_prod.orchestrator.log` and fix dependency pin |
| `docker_run_failed` | runtime script returned non-zero | inspect log tail and train_status JSON |
| `managed_job_not_implemented` | managed backend is intentionally stubbed | use `local_docker` path for now |

## Artifacts

- `artifacts/train_status.tts_prod_train.json`
- `artifacts/dataset_manifest.tts_prod_train.json`
- `bundles/<voice_profile_id>/voice_bundle/manifest.json`
- `artifacts/voice_train_prod.orchestrator.log`

## Operational notes

- Existing Audiocraft Colab scripts remain available but experimental.
- `/api/train/start` accepts `tts_prod_train` without breaking `train` or `tts_voice_train`.
- `/api/voice/speak` serving contract remains unchanged.
