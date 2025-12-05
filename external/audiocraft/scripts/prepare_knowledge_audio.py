"""
Stage knowledge audio for training.
- Reads audio files from knowledge (mirror them into external/audiocraft/data/knowledge_audio)
- Emits PROGRESS and STATS lines so the job UI can show progress.
"""
import argparse
import json
import os
import shutil
from pathlib import Path

AUDIO_EXTS = {".wav", ".mp3", ".flac", ".ogg"}


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", default=os.environ.get("KNOWLEDGE_SOURCE_DIR", "data/knowledge_audio_source"))
    parser.add_argument("--out-dir", default=os.environ.get("KNOWLEDGE_AUDIO_DIR", "external/audiocraft/data/knowledge_audio"))
    return parser.parse_args()


def main():
    args = parse_args()
    source_dir = Path(args.source_dir)
    target_dir = Path(args.out_dir)
    target_dir.mkdir(parents=True, exist_ok=True)

    files = [p for p in source_dir.rglob("*") if p.is_file() and p.suffix.lower() in AUDIO_EXTS]
    total = len(files)
    print(f"PROGRESS 0 {total}", flush=True)

    copied = 0
    for idx, path in enumerate(files, start=1):
        dest = target_dir / path.name
        shutil.copy2(path, dest)
        copied += 1
        print(f"PROGRESS {idx} {total}", flush=True)

    stats = {"files": total, "copied": copied, "out_dir": str(target_dir)}
    print("STATS " + json.dumps(stats), flush=True)
    print(f"[prepare] copied {copied} audio files into {target_dir}")


if __name__ == "__main__":
    main()
