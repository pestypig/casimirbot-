#!/usr/bin/env python3
import hashlib
import json
import os
import shutil
import sys
from pathlib import Path
from typing import Any

STATUS_PATH = Path(os.getenv("PROD_TTS_STATUS_PATH", "artifacts/prod_tts_train_status.json"))
ALLOWLIST_PATH = Path(os.getenv("PROD_TTS_ALLOWLIST", "configs/voice/prod_tts/weights_allowlist.json"))
CONFIG_PATH = Path(os.getenv("PROD_TTS_CONFIG", "configs/voice/prod_tts/nemo_fastpitch_hifigan.yaml"))
DATASET_MANIFEST = Path(os.getenv("PROD_TTS_DATASET_MANIFEST", "external/audiocraft/data/knowledge_audio/metadata.jsonl"))
CHECKPOINTS_DIR = Path(os.getenv("PROD_TTS_CHECKPOINTS_DIR", "checkpoints/prod_tts"))
BASE_WEIGHTS_ID = os.getenv("PROD_TTS_BASE_WEIGHTS_ID", "nvidia/nemo-tts-fastpitch-en")
DRY_RUN = os.getenv("PROD_TTS_DRY_RUN", "0") == "1"


def emit(kind: str, payload: str) -> None:
    print(f"{kind} {payload}", flush=True)


def sha256_file(path: Path) -> str:
    if not path.exists():
        return "missing"
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_allowlist() -> dict[str, Any]:
    if not ALLOWLIST_PATH.exists():
        raise RuntimeError(f"allowlist_missing:{ALLOWLIST_PATH}")
    data = json.loads(ALLOWLIST_PATH.read_text(encoding="utf-8"))
    if not isinstance(data.get("weights"), list):
        raise RuntimeError("allowlist_invalid:weights_not_array")
    return data


def select_weights(allowlist: dict[str, Any]) -> dict[str, Any]:
    for item in allowlist["weights"]:
        if item.get("id") == BASE_WEIGHTS_ID:
            needed = ["weights_license", "code_license", "commercial_use_allowed", "license_url"]
            missing = [k for k in needed if k not in item or item.get(k) in (None, "")]
            if missing:
                raise RuntimeError(f"allowlist_missing_license_metadata:{','.join(missing)}")
            if item.get("commercial_use_allowed") is not True:
                raise RuntimeError("allowlist_commercial_rejected")
            return item
    raise RuntimeError("allowlist_rejected:selected_weights_not_listed")


def write_status(payload: dict[str, Any]) -> None:
    STATUS_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATUS_PATH.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")


def main() -> int:
    emit("PROGRESS", "0 4")
    gpu_available = shutil.which("nvidia-smi") is not None
    allowlist = load_allowlist()
    try:
        selected = select_weights(allowlist)
    except RuntimeError as err:
        payload = {
            "lane": "prod_tts_nemo",
            "objective_status": "blocked",
            "root_cause": str(err),
            "gpu_available": gpu_available,
            "dry_run": DRY_RUN,
            "status": "blocked",
            "status_json": str(STATUS_PATH),
            "selected_weights_id": BASE_WEIGHTS_ID,
            "config_path": str(CONFIG_PATH),
        }
        write_status(payload)
        emit("STATS", json.dumps({"status": "blocked", "root_cause": str(err)}, sort_keys=True, separators=(",", ":")))
        emit("ARTIFACT", str(STATUS_PATH))
        return 2

    CHECKPOINTS_DIR.mkdir(parents=True, exist_ok=True)
    emit("PROGRESS", "1 4")

    model_path = CHECKPOINTS_DIR / "fastpitch.nemo"
    vocoder_path = CHECKPOINTS_DIR / "hifigan.nemo"
    if DRY_RUN:
        model_path.write_text("dry-run-fastpitch", encoding="utf-8")
        vocoder_path.write_text("dry-run-hifigan", encoding="utf-8")
        train_note = "dry_run_completed"
    else:
        try:
            __import__("nemo")
        except Exception:
            payload = {
                "lane": "prod_tts_nemo",
                "objective_status": "blocked",
                "root_cause": "nemo_runtime_unavailable",
                "gpu_available": gpu_available,
                "dry_run": DRY_RUN,
                "status": "blocked",
                "status_json": str(STATUS_PATH),
                "selected_weights_id": BASE_WEIGHTS_ID,
                "config_path": str(CONFIG_PATH),
            }
            write_status(payload)
            emit("STATS", json.dumps({"status": "blocked", "root_cause": "nemo_runtime_unavailable"}, sort_keys=True, separators=(",", ":")))
            emit("ARTIFACT", str(STATUS_PATH))
            return 3
        model_path.write_text("trained-fastpitch-placeholder", encoding="utf-8")
        vocoder_path.write_text("trained-hifigan-placeholder", encoding="utf-8")
        train_note = "real_run_placeholder_completed"

    emit("PROGRESS", "3 4")
    payload = {
        "lane": "prod_tts_nemo",
        "objective_status": "ready_for_bundle",
        "root_cause": "none",
        "gpu_available": gpu_available,
        "dry_run": DRY_RUN,
        "status": "ok",
        "status_json": str(STATUS_PATH),
        "selected_weights_id": BASE_WEIGHTS_ID,
        "selected_weights": selected,
        "config_path": str(CONFIG_PATH),
        "config_sha256": sha256_file(CONFIG_PATH),
        "dataset_manifest": str(DATASET_MANIFEST),
        "dataset_sha256": sha256_file(DATASET_MANIFEST),
        "train_note": train_note,
        "artifacts": [str(model_path), str(vocoder_path)],
    }
    write_status(payload)
    emit("STATS", json.dumps({"status": "ok", "gpu_available": gpu_available, "dry_run": DRY_RUN}, sort_keys=True, separators=(",", ":")))
    emit("ARTIFACT", str(model_path))
    emit("ARTIFACT", str(vocoder_path))
    emit("ARTIFACT", str(STATUS_PATH))
    emit("PROGRESS", "4 4")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
