# Helix Ask Ownership-First Dottie Voice Docker Codex Cloud Autorun Prompt (2026-02-23)

Use this when Codex Cloud policy mode blocks runtime dependency installs or outbound fetches.

Primary references:
- `docs/runbooks/codex-cloud-voice-train-objective-2026-02-23.md`
- `docker/voice-train/Dockerfile`
- `docker/voice-train/run_voice_train.sh`
- `docker/voice-train/README.md`

## Paste this into Codex Cloud

```text
Execution mode:
AUTORUN. OBJECTIVE-DRIVEN. POLICY-LOCKED.

Objective:
Produce a completed Auntie Dottie training run using repo-local assets and Docker runtime.

Source of truth:
- docs/runbooks/codex-cloud-voice-train-objective-2026-02-23.md

Hard constraints:
1) Assume outbound package installs/fetches may be blocked.
2) Do not rely on `pip install` at runtime.
3) Use Docker image from docker/voice-train/Dockerfile.
4) Do not modify app source unless explicitly needed to report a deterministic blocker.
5) Always emit a final deterministic report block.

Required steps:
1) Preflight:
   - verify `data/knowledge_audio_source/auntie_dottie.flac` exists, >5MB, not LFS pointer.
   - verify Docker CLI + daemon are available.
2) Build:
   - `docker build -f docker/voice-train/Dockerfile -t casimir-voice-train:latest .`
3) Run:
   - `docker run --rm -v "$PWD:/workspace/casimirbot-" casimir-voice-train:latest`
4) Validate artifacts:
   - external/audiocraft/data/knowledge_audio/voice_dataset_manifest.json
   - external/audiocraft/checkpoints/train_status.json
   - checkpoints/tts_voice_train_musicgen_small.pt
5) Emit final report.

Final report format (required):
=== DOCKER OBJECTIVE REPORT ===
objective_status: success|blocked
first_failed_step: <step|none>
root_cause_class: environment_blocked|runtime_blocked|data_blocked|train_failed|none
audio_path: <path>
audio_size_bytes: <bytes>
manifest_exists: true|false
manifest_entry_count: <n|none>
train_status_json: <json>
checkpoint_exists: true|false
checkpoint_size_bytes: <bytes|N/A>
checkpoint_sha256: <hash|N/A>
next_unblock_action: <single best action>

If blocked:
- Do not retry randomly.
- Stop after deterministic diagnosis and report one best unblock action.
```

## Optional one-shot shell runner

```bash
docker build -f docker/voice-train/Dockerfile -t casimir-voice-train:latest . && \
docker run --rm -v "$PWD:/workspace/casimirbot-" casimir-voice-train:latest
```
