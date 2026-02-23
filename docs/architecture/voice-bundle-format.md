# Voice Bundle Format (v1)

A portable voice bundle packages profile metadata and files required for local-first synthesis.

## Required structure
- `manifest.json`
- `model.bin`
- `sample.wav`

## Manifest schema
```json
{
  "bundle_version": "voice_bundle/1",
  "voice_profile_id": "dottie_default",
  "display_name": "Dottie",
  "created_at": "2026-02-23T00:00:00Z",
  "files": [
    { "path": "model.bin", "sha256": "<hex>", "bytes": 1234 },
    { "path": "sample.wav", "sha256": "<hex>", "bytes": 4321 }
  ]
}
```

## Validation rules
- `bundle_version`, `voice_profile_id`, `display_name`, `created_at`, and `files` are required.
- Every file listed in `files[]` must exist in the bundle root.
- Each listed file must match declared `sha256` and `bytes`.
- Failures must return deterministic codes and metadata.


## Lane classification (2026-02-23)

- Existing Audiocraft/Colab training path remains **experimental** and best-effort for research iteration.
- `tts_prod_train` is the authoritative production training lane for operator-facing deployment artifacts.
- Serving via `/api/voice/speak` stays backward-compatible; lane choice only affects training artifact provenance.

## Production lane artifact contract

A successful production run must produce deterministic artifacts under repo paths:

- `artifacts/train_status.tts_prod_train.json`
- `artifacts/dataset_manifest.tts_prod_train.json`
- `bundles/<voice_profile_id>/voice_bundle/manifest.json`

`train_status` minimum fields:

```json
{
  "job_type": "tts_prod_train",
  "state": "completed",
  "progress": { "current": 100, "total": 100 },
  "stats": { "dataset_items": 1, "bundle_valid": true },
  "artifacts": ["bundles/dottie_default/voice_bundle/manifest.json"]
}
```

Determinism requirement: the trainer emits protocol lines in this order for each update tick: `PROGRESS`, optional `STATS`, optional `ARTIFACT`.
