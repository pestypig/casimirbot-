#!/usr/bin/env python3
"""Independent static audit of the candidate-neutral P8P-R3 ingress successor."""

from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r3-chunked-browser-ingress-successor-proposal.md"
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r2-browser-upload-preexecution-result.md"
SOURCE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c2-r1-cloud-preflight-v1-20260831/h2-p8f-c2-r1-cloud-upload-v1.tar"
OVERLAY = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-cloud-preflight-v1-20260901/h2-p8p-overlay-upload-v1.tar"
MANIFEST = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r3_base_chunk_manifest_v1.json"
MATERIALIZER = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8p_r3_materialize_chunks.py"
LEDGER = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r3_browser_guest_sequence_v1.sh"


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            hasher.update(block)
    return hasher.hexdigest()


def chunk_identities() -> tuple[bool, int]:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    entries = manifest["chunks"]
    total = 0
    with SOURCE.open("rb") as source:
        for expected_index, entry in enumerate(entries, 1):
            raw = source.read(entry["bytes"])
            if entry["index"] != expected_index or len(raw) != entry["bytes"]:
                return False, total
            if hashlib.sha256(raw).hexdigest() != entry["sha256"]:
                return False, total
            total += len(raw)
        eof = source.read(1)
    return not eof, total


text = DOC.read_text(encoding="utf-8")
flat = " ".join(text.split())
result = RESULT.read_text(encoding="utf-8")
manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
chunk_ok, chunk_total = chunk_identities()
syntax = subprocess.run(
    [r"C:\Program Files\Git\bin\bash.exe", "-n", str(LEDGER)],
    cwd=ROOT, capture_output=True, text=True, check=False,
)

expected_files = {
    SOURCE: (236492800, "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978"),
    OVERLAY: (134656, "4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e"),
    MANIFEST: (3014, "ec1c115461442e1ddba9ccc635aebdd722be5440f23e06c797406ce8cde6b52d"),
    MATERIALIZER: (3786, "a1f7532d6adb39fa1aed42301df19a3067ec276b913ffc3c5f52d2369b6a3003"),
    LEDGER: (4991, "f7112c5a547b48814ee63961cc6b441cd67f147b0bc47feb6ea8f98cddf8ca96"),
}

checks = {
    "required_header": all(label in text for label in (
        "Program gate:", "Workstream:", "Capability or component:",
        "Current maturity:", "Target maturity:", "Required frozen inputs:",
        "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
        "Downstream gate unlocked:")),
    "r2_zero_item_result_bound": all(value in result and value in text for value in (
        "Transferred 0 items", "236,492,800", "R2 is exhausted")),
    "all_frozen_files_exact": all(
        path.is_file() and not path.is_symlink() and path.stat().st_size == size
        and digest(path) == sha for path, (size, sha) in expected_files.items()),
    "manifest_schema_neutral": (
        manifest.get("schema") == "nhm2.g2h_e_s5.c08_h2_p8p_r3_base_chunk_manifest.v1"
        and manifest.get("candidate_neutral") is True),
    "manifest_exact_15_chunks": (
        len(manifest.get("chunks", [])) == 15
        and [entry["index"] for entry in manifest["chunks"]] == list(range(1, 16))),
    "chunk_source_equality": chunk_ok and chunk_total == 236492800,
    "chunk_sizes_bounded": (
        all(entry["bytes"] == 16777216 for entry in manifest["chunks"][:-1])
        and manifest["chunks"][-1]["bytes"] == 1611776),
    "manifest_authority_false": manifest.get("authority") == {
        key: False for key in (
            "candidate", "proof", "geometry_state", "lane", "lamp",
            "physical", "propulsion", "transport")},
    "materializer_fail_closed": all(value in MATERIALIZER.read_text(encoding="utf-8") for value in (
        "assert not output.exists()", "open(\"xb\")", "assert source.read(1) == b\"\"",
        "len(tuple(output.iterdir())) == len(chunks) + 1")),
    "ledger_syntax": syntax.returncode == 0,
    "ledger_all_parts_authenticated": all(value in LEDGER.read_text(encoding="utf-8") for value in (
        "CHUNK_NAMES=(", "CHUNK_BYTES=(", "CHUNK_SHA=(", "for i in \"${!CHUNK_NAMES[@]}\"")),
    "ledger_reconstruction_exact": all(value in LEDGER.read_text(encoding="utf-8") for value in (
        ": > \"$BASE\"", "cat -- \"$HOME_ROOT/$name\" >> \"$BASE\"",
        "BASE_BYTES=236492800", "BASE_SHA=fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978")),
    "resource_exact": all(value in flat for value in (
        "nhm2-h2-p8p-r3-c2d-32-20260901", "us-east1-d", "c2d-standard-32",
        "debian-12-bookworm-v20260826", "30 GB `pd-standard`", "18,000 seconds", "$9.00", "14,400 seconds")),
    "one_batch_one_process": "one browser-upload batch" in flat and "exactly one candidate-neutral P=1024 process" in flat,
    "unchanged_science": all(value in flat for value in (
        "not compression, content transformation, mathematical retuning, numerical retry or scientific change",
        "executable SHA-256 `7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718`",
        "No outcome authorizes P=65,536")),
    "receipt_scope": all(value in flat for value in (
        "phase-specific selector/observer/total timing", "64 progress lines",
        "all 514 degree buckets", "six aggregate totals", "P8I equality", "chronology")),
    "p8q_trinary": all(value in flat for value in (
        "P8Q_YES_PROPOSAL_READY", "P8Q_NO_ALGORITHMIC_PERFORMANCE_LEAD",
        "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED")),
    "first_failure_terminal": "First failure is terminal" in flat and "do not use Retry" in flat,
    "authority_locks": "physical, propulsion and transport authority remain false" in flat,
}

for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"PROPOSAL_SHA256 {digest(DOC)}")
raise SystemExit(0 if passed == len(checks) else 1)
