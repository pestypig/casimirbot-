# Voice Train Vertex Setup (2026-02-23)

This runbook wires secure GCP auth in-repo for offloaded voice training.
It avoids API key auth and uses GitHub OIDC + Workload Identity Federation.

## Security prerequisite

If any GCP API key was exposed in chat/logs, revoke it immediately.
Do not use API keys for Vertex training workflow auth.

## New workflow and scripts

- `.github/workflows/voice-train-vertex.yml`
- `scripts/voice/submit_vertex_voice_train.sh`
- `docker/voice-train/Dockerfile.vertex`
- `docker/voice-train/run_voice_train.sh` (supports optional GCS artifact upload)

## Required Google APIs

Enable these in your GCP project:
- Compute Engine API
- Vertex AI API
- Artifact Registry API

## Required GitHub repository secrets

Set these in repo settings:
- `GCP_PROJECT_ID`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`  
  Format example: `projects/123456789/locations/global/workloadIdentityPools/pool/providers/provider`
- `GCP_SERVICE_ACCOUNT_EMAIL`  
  Example: `gha-vertex-train@my-project.iam.gserviceaccount.com`

## Minimum IAM on the service account

Grant roles needed for this workflow:
- Vertex AI job submission (e.g. `roles/aiplatform.user`)
- Artifact Registry push (e.g. `roles/artifactregistry.writer`)
- Optional GCS output upload (e.g. `roles/storage.objectAdmin` on target bucket path)

Grant Workload Identity user binding so GitHub OIDC principal can impersonate
the service account.

## One-time Artifact Registry setup

Create a Docker repository matching workflow input `artifact_repository`
(default `casimir-voice-train`) in your selected region.

## How to run

### Option A: no Codex Cloud secrets (controlled push trigger)

Push to `main` with commit message containing:

`[run-vertex-train]`

The workflow now supports a guarded `push` trigger and only runs on push when
that marker is present in `github.event.head_commit.message`.

For push-triggered runs, defaults come from workflow vars/fallbacks:
- region: `us-central1`
- Artifact Registry repo: `casimir-voice-train`
- machine: `g2-standard-8`
- accelerator: `NVIDIA_TESLA_T4` x `1`
- optional output URI: `vars.VERTEX_GCS_OUTPUT_URI` if set

You can override these via repository/environment variables:
- `VERTEX_GCP_REGION`
- `VERTEX_ARTIFACT_REPOSITORY`
- `VERTEX_MACHINE_TYPE`
- `VERTEX_ACCELERATOR_TYPE`
- `VERTEX_ACCELERATOR_COUNT`
- `VERTEX_GCS_OUTPUT_URI`

### Option B: manual run via Actions UI (`workflow_dispatch`)

1. Open GitHub Actions.
2. Run workflow `Voice Train (Vertex AI)` using `workflow_dispatch`.
3. Optionally set `vertex_gcs_output_uri` (`gs://bucket/prefix`) to upload
   manifest/status/checkpoint/log from the training container.

## What the workflow does

1. Authenticates to Google Cloud using OIDC/WIF.
2. Builds and pushes `docker/voice-train/Dockerfile.vertex` to Artifact Registry.
3. Submits a Vertex AI CustomJob with GPU worker settings.
4. Uploads `artifacts/vertex-custom-job.json` to workflow artifacts.

## Runtime notes

- `Dockerfile.vertex` includes the audio source from
  `data/knowledge_audio_source/auntie_dottie.flac`.
- `run_voice_train.sh` enforces source-file checks and deterministic report output.
- If `VERTEX_GCS_OUTPUT_URI` is passed, the script uploads produced artifacts to GCS.
