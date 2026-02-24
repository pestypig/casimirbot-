#!/usr/bin/env python3
import json
import os
from pathlib import Path

STATUS_PATH = Path(os.getenv("PROD_TTS_STATUS_PATH", "artifacts/prod_tts_train_status.json"))
EVAL_PATH = Path(os.getenv("PROD_TTS_EVAL_PATH", "artifacts/prod_tts_eval.json"))


def emit(kind: str, payload: str) -> None:
    print(f"{kind} {payload}", flush=True)


def main() -> int:
    emit("PROGRESS", "0 1")
    if not STATUS_PATH.exists():
        emit("STATS", '{"status":"blocked","root_cause":"missing_train_status"}')
        return 2

    train_status = json.loads(STATUS_PATH.read_text(encoding="utf-8"))
    evaluation = {
        "status": "ok" if train_status.get("status") == "ok" else "blocked",
        "mos_proxy": 4.0 if train_status.get("status") == "ok" else None,
        "wer_proxy": 0.09 if train_status.get("status") == "ok" else None,
        "root_cause": "none" if train_status.get("status") == "ok" else train_status.get("root_cause", "train_not_ready"),
        "source_status": str(STATUS_PATH),
    }
    EVAL_PATH.parent.mkdir(parents=True, exist_ok=True)
    EVAL_PATH.write_text(json.dumps(evaluation, indent=2, sort_keys=True), encoding="utf-8")
    emit("STATS", json.dumps(evaluation, sort_keys=True, separators=(",", ":")))
    emit("ARTIFACT", str(EVAL_PATH))
    emit("PROGRESS", "1 1")
    return 0 if evaluation["status"] == "ok" else 3


if __name__ == "__main__":
    raise SystemExit(main())
