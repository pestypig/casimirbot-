# Local Ownership Voice Serving (NeMo)

Status: additive local-serving runbook for `/api/voice/speak`.

## Goal
Run voice synthesis locally with owned bundle files instead of managed providers.

## Prerequisites
- Voice bundle files present:
  - `bundles/dottie_default/voice_bundle/fastpitch.nemo`
  - `bundles/dottie_default/voice_bundle/hifigan.nemo`
  - `bundles/dottie_default/voice_bundle/sample.wav` (optional fallback smoke path)
- Python runtime with NeMo/Torch installed for dynamic synthesis.

## Start local TTS service
```bash
npm run voice:serve:nemo
```

Default bind:
- host: `127.0.0.1`
- port: `5051`
- health: `GET http://127.0.0.1:5051/health`
- synth: `POST http://127.0.0.1:5051/speak`

## Wire Helix proxy to local service
Set these in the Helix app runtime:
- `TTS_BASE_URL=http://127.0.0.1:5051`
- `VOICE_PROXY_DRY_RUN=0`

Then restart app server and use `Read aloud` in Helix Ask.

## Optional fallback mode
For transport-path testing when NeMo runtime is unavailable:
- `LOCAL_TTS_ENABLE_SAMPLE_FALLBACK=1`

In fallback mode, `/speak` returns the bundle `sample.wav` deterministically.

## Runtime knobs
- `LOCAL_TTS_HOST` (default `127.0.0.1`)
- `LOCAL_TTS_PORT` (default `5051`)
- `LOCAL_TTS_FASTPITCH_PATH` (default bundle path)
- `LOCAL_TTS_HIFIGAN_PATH` (default bundle path)
- `LOCAL_TTS_SAMPLE_PATH` (default bundle path)
- `LOCAL_TTS_DEVICE` (`auto|cpu|cuda`, default `auto`)

## Notes
- This runbook keeps `/api/voice/speak` contract unchanged.
- Local synthesis preserves ownership-first posture; managed providers remain optional fallback by policy.
