# Voice Training Docker Runtime

This image is the prebuilt runtime for the ownership-first Dottie training path.
It installs AudioCraft dependencies at image build time so runtime jobs do not
need outbound `pip` access.

## Build

```bash
docker build -f docker/voice-train/Dockerfile -t casimir-voice-train:latest .
```

## Run (mount repo)

```bash
docker run --rm \
  -v "$PWD:/workspace/casimirbot-" \
  casimir-voice-train:latest
```

The container entrypoint runs:
- `external/audiocraft/scripts/prepare_knowledge_audio.py --mode voice_dataset`
- `external/audiocraft/scripts/train_spectral_adapter.py` with `TRAIN_JOB_TYPE=tts_voice_train`

and prints a deterministic `=== DOCKER TRAIN REPORT ===` block.

## Optional overrides

```bash
docker run --rm \
  -v "$PWD:/workspace/casimirbot-" \
  -e VOICE_SOURCE_AUDIO=/workspace/casimirbot-/data/knowledge_audio_source/auntie_dottie.flac \
  -e KNOWLEDGE_AUDIO_DIR=/workspace/casimirbot-/external/audiocraft/data/knowledge_audio \
  -e TRAIN_STATUS_PATH=/workspace/casimirbot-/external/audiocraft/checkpoints/train_status.json \
  casimir-voice-train:latest
```

## GPU

If running on an NVIDIA host:

```bash
docker run --rm --gpus all \
  -v "$PWD:/workspace/casimirbot-" \
  casimir-voice-train:latest
```

## Vertex AI container variant

For offloaded training without repo bind mounts, use:

```bash
docker build -f docker/voice-train/Dockerfile.vertex -t casimir-voice-train:vertex .
```

The Vertex workflow (`.github/workflows/voice-train-vertex.yml`) builds and
pushes this image to Artifact Registry, then submits a Vertex CustomJob.
