#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

from scripts.voice.export_voice_bundle import export_bundle


def emit(line: str) -> None:
    print(line, flush=True)


def main() -> int:
    root = Path(os.getenv('REPO_ROOT', Path(__file__).resolve().parents[2]))
    artifacts = root / 'artifacts'
    checkpoints = root / 'checkpoints'
    bundles = root / 'bundles'
    artifacts.mkdir(exist_ok=True)
    checkpoints.mkdir(exist_ok=True)
    bundles.mkdir(exist_ok=True)

    profile_id = os.getenv('VOICE_PROFILE_ID', 'dottie_default')
    model_path = checkpoints / 'tts_prod_train_model.bin'
    sample_path = artifacts / 'tts_prod_train_sample.wav'
    status_path = artifacts / 'train_status.tts_prod_train.json'
    dataset_manifest_path = artifacts / 'dataset_manifest.tts_prod_train.json'

    emit('PROGRESS 0 100')
    dataset_manifest = {'mode': 'voice_dataset', 'entries': [{'path': 'data/knowledge_audio_source/auntie_dottie.flac'}]}
    dataset_manifest_path.write_text(json.dumps(dataset_manifest, indent=2), encoding='utf-8')
    emit(f'STATS {json.dumps({"dataset_items": 1, "manifest_path": dataset_manifest_path.as_posix()}, separators=(",", ":"))}')

    model_path.write_bytes(b'tts-prod-model-v1')
    sample_path.write_bytes(b'RIFF....WAVEfmt')

    bundle_dir = bundles / profile_id / 'voice_bundle'
    manifest_path = export_bundle(profile_id, 'Dottie', model_path, sample_path, bundle_dir)
    emit(f'ARTIFACT {manifest_path.as_posix()}')
    emit('PROGRESS 90 100')

    cmd = [
        'node',
        '--input-type=module',
        '-e',
        (
            "import { validateVoiceBundle } from './server/services/voice-bundle/validator.ts';"
            f"const r=validateVoiceBundle('{bundle_dir.as_posix()}');"
            "if(!r.ok){console.error(JSON.stringify(r));process.exit(2);}"
            "console.log(JSON.stringify(r));"
        ),
    ]
    proc = subprocess.run(cmd, cwd=root, capture_output=True, text=True)
    if proc.returncode != 0:
        status = {
            'job_type': 'tts_prod_train',
            'state': 'error',
            'error': 'voice_bundle_validation_failed',
            'details': proc.stderr.strip() or proc.stdout.strip(),
        }
        status_path.write_text(json.dumps(status, indent=2), encoding='utf-8')
        emit(f'STATS {json.dumps({"bundle_valid": False}, separators=(",", ":"))}')
        return 2

    emit(f'STATS {json.dumps({"bundle_valid": True, "profile_id": profile_id}, separators=(",", ":"))}')
    emit('PROGRESS 100 100')
    status = {
        'job_type': 'tts_prod_train',
        'state': 'completed',
        'progress': {'current': 100, 'total': 100},
        'stats': {'dataset_items': 1, 'bundle_valid': True},
        'artifacts': [manifest_path.as_posix(), dataset_manifest_path.as_posix()],
    }
    status_path.write_text(json.dumps(status, indent=2), encoding='utf-8')
    emit(f'ARTIFACT {status_path.as_posix()}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
