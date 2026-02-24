#!/usr/bin/env python3
import hashlib
import json
import os
from pathlib import Path

STATUS_PATH = Path(os.getenv("PROD_TTS_STATUS_PATH", "artifacts/prod_tts_train_status.json"))
EVAL_PATH = Path(os.getenv("PROD_TTS_EVAL_PATH", "artifacts/prod_tts_eval.json"))
BUNDLE_DIR = Path(os.getenv("PROD_TTS_BUNDLE_DIR", "checkpoints/prod_tts_voice_bundle"))
COMMIT = os.getenv("PROD_TTS_COMMIT", "unknown")


def emit(kind: str, payload: str) -> None:
    print(f"{kind} {payload}", flush=True)


def sha256_bytes(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def file_entry(path: Path, base: Path) -> dict[str, object]:
    return {
        "path": str(path.relative_to(base)),
        "bytes": path.stat().st_size,
        "sha256": sha256_file(path),
    }


def main() -> int:
    emit("PROGRESS", "0 1")
    if not STATUS_PATH.exists():
        emit("STATS", '{"status":"blocked","root_cause":"missing_train_status"}')
        return 2

    status = json.loads(STATUS_PATH.read_text(encoding="utf-8"))
    if status.get("status") != "ok":
        emit("STATS", json.dumps({"status": "blocked", "root_cause": status.get("root_cause", "status_not_ok")}, sort_keys=True, separators=(",", ":")))
        return 3

    BUNDLE_DIR.mkdir(parents=True, exist_ok=True)
    artifacts = []
    for artifact in status.get("artifacts", []):
        src = Path(artifact)
        if not src.exists():
            continue
        dst = BUNDLE_DIR / src.name
        dst.write_bytes(src.read_bytes())
        artifacts.append(dst)

    if EVAL_PATH.exists():
        eval_copy = BUNDLE_DIR / EVAL_PATH.name
        eval_copy.write_bytes(EVAL_PATH.read_bytes())
        artifacts.append(eval_copy)

    manifest = {
        "bundle_version": "prod_tts_voice_bundle/1",
        "commit": COMMIT,
        "config_sha256": status.get("config_sha256", "missing"),
        "dataset_sha256": status.get("dataset_sha256", "missing"),
        "weights_refs": {
            "id": status.get("selected_weights_id"),
            "weights_license": (status.get("selected_weights") or {}).get("weights_license"),
            "code_license": (status.get("selected_weights") or {}).get("code_license"),
            "license_url": (status.get("selected_weights") or {}).get("license_url"),
        },
        "files": [],
    }

    for artifact in sorted(artifacts, key=lambda p: p.name):
        manifest["files"].append(file_entry(artifact, BUNDLE_DIR))

    manifest_bytes = json.dumps(manifest, indent=2, sort_keys=True).encode("utf-8")
    manifest["artifact_sha256"] = sha256_bytes(manifest_bytes)
    final_bytes = json.dumps(manifest, indent=2, sort_keys=True).encode("utf-8")
    (BUNDLE_DIR / "manifest.json").write_bytes(final_bytes)

    emit("STATS", json.dumps({"status": "ok", "bundle_dir": str(BUNDLE_DIR), "files": len(manifest["files"])}, sort_keys=True, separators=(",", ":")))
    emit("ARTIFACT", str(BUNDLE_DIR / "manifest.json"))
    emit("PROGRESS", "1 1")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
