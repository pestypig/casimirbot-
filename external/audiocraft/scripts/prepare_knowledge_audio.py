"""
Stage knowledge audio for training.
- Reads audio files from knowledge (mirror them into external/audiocraft/data/knowledge_audio)
- Emits PROGRESS and STATS lines so the job UI can show progress.
"""
import argparse
import hashlib
import json
import os
import shutil
from pathlib import Path

AUDIO_EXTS = {".wav", ".mp3", ".flac", ".ogg"}


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", default=os.environ.get("KNOWLEDGE_SOURCE_DIR", "data/knowledge_audio_source"))
    parser.add_argument("--out-dir", default=os.environ.get("KNOWLEDGE_AUDIO_DIR", "external/audiocraft/data/knowledge_audio"))
    parser.add_argument("--mode", default=os.environ.get("DATASET_PREP_MODE", "knowledge_audio"))
    return parser.parse_args()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    args = parse_args()
    source_dir = Path(args.source_dir)
    target_dir = Path(args.out_dir)
    mode = (args.mode or "knowledge_audio").strip().lower()
    target_dir.mkdir(parents=True, exist_ok=True)

    files = [p for p in source_dir.rglob("*") if p.is_file() and p.suffix.lower() in AUDIO_EXTS]
    files = sorted(files)
    total = len(files)
    print(f"PROGRESS 0 {total}", flush=True)

    copied = 0
    manifest_entries = []
    for idx, path in enumerate(files, start=1):
        dest = target_dir / path.name
        shutil.copy2(path, dest)
        copied += 1
        if mode == "voice_dataset":
            manifest_entries.append({
                "source": str(path),
                "target": str(dest),
                "bytes": dest.stat().st_size,
                "sha256": sha256_file(dest),
            })
        print(f"PROGRESS {idx} {total}", flush=True)

    stats = {"mode": mode, "files": total, "copied": copied, "out_dir": str(target_dir)}
    if mode == "voice_dataset":
        manifest_path = target_dir / "voice_dataset_manifest.json"
        manifest = {
            "schema": "voice_dataset/1",
            "mode": mode,
            "entries": manifest_entries,
            "count": len(manifest_entries),
        }
        manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        stats["manifestPath"] = str(manifest_path)
    print("STATS " + json.dumps(stats), flush=True)
    print(f"[prepare] copied {copied} audio files into {target_dir}")


if __name__ == "__main__":
    main()
