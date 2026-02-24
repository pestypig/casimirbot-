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

## Stack and licensing policy lock (2026-02-24)

- Primary production lane: `tts_prod_train_nemo` (NeMo-first).
- Backup production lane: ESPnet2 fallback plan (only when NeMo path is blocked).
- Audiocraft/MusicGen remains **experimental** and not a production promotion basis.
- **NO-GO** when weights license is non-commercial or unclear, even if code license is permissive.
- Treat code-license facts and weight-license facts as separate mandatory checks.

## Operator command surface (Wave 1)

### Production lane (NeMo-first scaffold)

```bash
python scripts/voice/verify_weights_manifest.py configs/voice/weights-manifest.example.json
TRAIN_LANE=tts_prod_train_nemo bash scripts/voice/train_production_voice.sh
```

Expected production-lane deterministic behavior:
- `PROGRESS`, `STATS`, and `ARTIFACT` lines are emitted
- `artifacts/train_status.tts_prod_train_nemo.json` is always written
- blocked runtime surfaces deterministic reason (`nemo_runtime_unavailable`)

### Promotion checklist

- [ ] Weights manifest validation passes (`status=ok`).
- [ ] Weights license explicitly allows commercial use, or release is NO-GO.
- [ ] Route/report surfaces preserve deterministic `PROGRESS/STATS/ARTIFACT`.
- [ ] `train_status.json` exists for production job outcome capture.
- [ ] Casimir verify verdict is PASS with certificate integrity true.
