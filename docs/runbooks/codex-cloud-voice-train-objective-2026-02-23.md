# Codex Cloud Voice Train Objective (Policy-Locked) - 2026-02-23

Primary objective:
- Produce a valid TTS training checkpoint for Auntie Dottie using repo-local audio and the Docker training runtime.

Scope anchors:
- `docker/voice-train/Dockerfile`
- `docker/voice-train/run_voice_train.sh`
- `docker/voice-train/README.md`
- `data/knowledge_audio_source/auntie_dottie.flac`
- `external/audiocraft/scripts/prepare_knowledge_audio.py`
- `external/audiocraft/scripts/train_spectral_adapter.py`

Non-negotiable constraints:
1. Assume Codex Cloud network policy is fixed and may block `pip`, git remote fetches, and cloud model downloads.
2. Do not depend on runtime package installs.
3. Prefer deterministic offline execution with prebuilt Docker runtime.
4. Do not modify `/api/agi/ask` behavior.
5. Keep outputs deterministic and report-first.

Success criteria:
1. `external/audiocraft/data/knowledge_audio/voice_dataset_manifest.json` exists and has `entries >= 1`.
2. `external/audiocraft/checkpoints/train_status.json` has `"status":"completed"` and a finite numeric `loss` (not `NaN`/`Inf`).
3. `checkpoints/tts_voice_train_musicgen_small.pt` exists and has non-zero size.
4. A final report block is printed with artifact paths, sizes, and checkpoint sha256.

Failure classification:
- `environment_blocked`: Docker daemon unavailable or image build cannot complete.
- `runtime_blocked`: model/runtime import failure inside container.
- `data_blocked`: source audio missing, tiny, or LFS pointer.
- `train_failed`: training script runs but exits non-zero.

Execution phases:

## Phase 1 - Preflight
- Validate source audio file:
  - path exists
  - size > 5 MB
  - does not contain LFS pointer signature
- Validate Docker CLI and daemon:
  - `docker --version`
  - `docker info`

## Phase 2 - Build runtime image
- Build `casimir-voice-train:latest` from `docker/voice-train/Dockerfile`.
- No source edits during this phase.

## Phase 3 - Readiness run
- Run container with repo bind mount:
  - `-v "$PWD:/workspace/casimirbot-"`
- Confirm `=== DOCKER TRAIN REPORT ===` is emitted.

## Phase 4 - Artifact validation
- Confirm:
  - manifest exists and entry count >= 1
  - status JSON completed
  - checkpoint exists with sha256

## Phase 5 - Deterministic final report
- Print:
  - objective_status: `success|blocked`
  - first_failed_step
  - root_cause_class
  - audio_path + size
  - manifest_path + entries
  - train_status_json
  - checkpoint_path + size + sha256
  - next_unblock_action

Stop policy:
- Stop immediately only for hard environment blockers (`docker` unavailable, mount denied, or policy denies container operations).
- Otherwise continue to completion and emit report with deterministic failure reason.

Notes:
- If policy mode blocks Docker itself, move training to a runner with Docker/GPU support and reuse the same image and run command.
- If model-weight downloads are required by runtime and blocked, pre-seed required artifacts in the image build stage from an allowed internal source.
