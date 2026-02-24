# Production TTS Colab Run Record (b357dba3)

Date: 2026-02-24
Branch: `main`
Commit: `b357dba3`

## Outcome

- `objective_status`: `ready_for_bundle`
- `root_cause`: `none`
- `evaluation_status`: `ok`
- `final_loss`: `0.05039643123745918`

## Bundle Artifacts

- Colab bundle tarball:
  - `/content/prod_tts_bundle_b357dba3.tgz`
  - `sha256`: `4b3ee1f5f52abd48e5654bae3d26f153c5f508f8492085c8d0df1f9ed3e45c30`

- Drive copy:
  - `/content/drive/MyDrive/CasimirBot/artifacts/prod_tts/prod_tts_bundle_b357dba3.tgz`
  - metadata:
    `/content/drive/MyDrive/CasimirBot/artifacts/prod_tts/prod_tts_bundle_b357dba3.tgz.sha256.json`

- Manifest path:
  - `checkpoints/prod_tts_voice_bundle/manifest.json`
  - `bundle_version`: `prod_tts_voice_bundle/1`
  - `artifact_sha256` (manifest field):
    `9ab758d3197580ef964459172538b675db9603a2090ccf63c6d81985715c0d1e`

## Notes

- This run produced a production-lane training bundle (`prod_tts_voice_bundle/1`).
- Next repository step is promotion/conversion to serving bundle format (`voice_bundle/1`) for `/api/voice/speak` consumption.
