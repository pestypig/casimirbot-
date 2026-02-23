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
