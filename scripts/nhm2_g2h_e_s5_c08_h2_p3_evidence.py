#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p3-deterministic-parallel-v3-20260827"
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
SELECTOR_IMAGE = "nhm2-g2h-e-s5-c08-selector-parallel-fixture:v3"
CALIBRATION_IMAGE = "nhm2-g2h-e-s5-c08-h2-parallel-calibration:v3"


def run(command: list[str], output: Path | None = None) -> str:
    completed = subprocess.run(command, cwd=ROOT, text=True,
                               stdout=subprocess.PIPE,
                               stderr=subprocess.STDOUT, check=False)
    if output is not None:
        output.write_text(completed.stdout, encoding="utf-8", newline="\n")
    if completed.returncode != 0:
        raise RuntimeError(f"command failed ({completed.returncode}): {' '.join(command)}\n{completed.stdout}")
    return completed.stdout


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ndjson(text: str) -> list[dict]:
    return [json.loads(line) for line in text.splitlines() if line.strip()]


def semantic(rows: list[dict]) -> list[dict]:
    excluded = {"candidate_milliseconds", "cumulative_milliseconds", "threads"}
    return [{key: value for key, value in row.items() if key not in excluded}
            for row in rows]


def candidate_ms(rows: list[dict]) -> int:
    return sum(int(row["candidate_milliseconds"])
               for row in rows if row.get("status") == "PROGRESS")


def main() -> int:
    if EVIDENCE.exists():
        raise RuntimeError(f"immutable evidence root already exists: {EVIDENCE}")
    EVIDENCE.mkdir(parents=True)

    selector_docker = G2H / "Dockerfile.primary.mini-boson-c08-convolution-selector-parallel-fixture.v3"
    calibration_docker = G2H / "Dockerfile.primary.mini-boson-c08-h2-parallel-calibration.v3"
    run(["docker", "build", "--progress=plain", "-f", str(selector_docker),
         "-t", SELECTOR_IMAGE, "."], EVIDENCE / "selector-build.log")
    run(["docker", "build", "--progress=plain", "-f", str(calibration_docker),
         "-t", CALIBRATION_IMAGE, "."], EVIDENCE / "calibration-build.log")

    hardening = ["--rm", "--network", "none", "--read-only", "--cap-drop", "ALL",
                 "--security-opt", "no-new-privileges"]
    fixture_a = run(["docker", "run", *hardening, SELECTOR_IMAGE])
    (EVIDENCE / "selector-fixture-a.ndjson").write_text(fixture_a, encoding="utf-8", newline="\n")
    fixture_b = run(["docker", "run", *hardening, SELECTOR_IMAGE])
    (EVIDENCE / "selector-fixture-b.ndjson").write_text(fixture_b, encoding="utf-8", newline="\n")

    outputs: dict[str, str] = {}
    for label, threads in (("threads-1", "1"), ("threads-2-a", "2"),
                           ("threads-2-b", "2")):
        outputs[label] = run(["docker", "run", *hardening, CALIBRATION_IMAGE,
                              "--max-exponent", "2", "--threads", threads])
        (EVIDENCE / f"calibration-{label}.ndjson").write_text(
            outputs[label], encoding="utf-8", newline="\n")

    rows = {key: ndjson(value) for key, value in outputs.items()}
    semantic_equal = (semantic(rows["threads-1"]) == semantic(rows["threads-2-a"])
                      == semantic(rows["threads-2-b"]))
    fixture_equal = fixture_a == fixture_b
    one_ms = candidate_ms(rows["threads-1"])
    two_a_ms = candidate_ms(rows["threads-2-a"])
    two_b_ms = candidate_ms(rows["threads-2-b"])

    inspect = {}
    for label, image in (("selector", SELECTOR_IMAGE),
                         ("calibration", CALIBRATION_IMAGE)):
        raw = run(["docker", "image", "inspect", image])
        inspect[label] = json.loads(raw)[0]
    executable_hashes = {
        "selector": run(["docker", "run", "--rm", "--entrypoint", "sha256sum",
                         SELECTOR_IMAGE,
                         "/usr/local/bin/mini-boson-star-primary-c08-convolution-selector-parallel-fixture-v3"]).split()[0],
        "calibration": run(["docker", "run", "--rm", "--entrypoint", "sha256sum",
                            CALIBRATION_IMAGE,
                            "/usr/local/bin/mini-boson-star-primary-c08-h2-parallel-calibration-v3"]).split()[0],
    }
    local_container = run(["docker", "inspect", "-f",
                           "{{.Name}} {{.State.Status}} {{.State.StartedAt}}",
                           "nhm2-c08-h2-repaired-fixture"]).strip()

    source_names = [
        "mini_boson_star_primary_c08_convolution_selector_v1.hpp",
        "mini_boson_star_primary_c08_convolution_selector_v1.cpp",
        "mini_boson_star_primary_c08_convolution_selector_fixture_v1.cpp",
        "mini_boson_star_primary_c08_h2_timing_calibration_v1.cpp",
        selector_docker.name,
        calibration_docker.name,
    ]
    source_hashes = {name: sha256(G2H / name) for name in source_names}
    receipt = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p3_deterministic_parallel_receipt.v1",
        "status_date": date.today().isoformat(),
        "verdict": "PASS" if semantic_equal and fixture_equal else "FAIL",
        "candidate_neutral": True,
        "precision_bits": 512,
        "order": 128,
        "jet_count": 13,
        "elementary_convolutions_per_subpanel": 43,
        "maximum_threads": 64,
        "tested_threads": [1, 2],
        "tested_max_exponent": 2,
        "ordinal_reduction": "serial_increasing",
        "refinement_candidates_parallelized": False,
        "serial_oracle_arb_equal_all_outputs": semantic_equal,
        "two_thread_repeat_semantically_equal": semantic_equal,
        "selector_fixture_repeat_byte_equal": fixture_equal,
        "selector_fixture": json.loads(fixture_a),
        "timing_milliseconds": {
            "threads_1": one_ms,
            "threads_2_a": two_a_ms,
            "threads_2_b": two_b_ms,
        },
        "speedup": {
            "threads_2_a": one_ms / two_a_ms,
            "threads_2_b": one_ms / two_b_ms,
        },
        "parallel_efficiency": {
            "threads_2_a": one_ms / two_a_ms / 2.0,
            "threads_2_b": one_ms / two_b_ms / 2.0,
        },
        "images": {
            key: {"id": value["Id"], "repo_digests": value.get("RepoDigests", [])}
            for key, value in inspect.items()
        },
        "executable_sha256": executable_hashes,
        "source_sha256": source_hashes,
        "preserved_local_serial_container": local_container,
        "preserved_cloud_serial_execution_modified": False,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "authorization_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    receipt_path = EVIDENCE / "receipt.json"
    receipt_path.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n",
                            encoding="utf-8", newline="\n")

    inventory = {}
    for path in sorted(EVIDENCE.iterdir(), key=lambda item: item.name):
        if path.name != "evidence-manifest.json":
            inventory[path.name] = {"bytes": path.stat().st_size,
                                     "sha256": sha256(path)}
    manifest_path = EVIDENCE / "evidence-manifest.json"
    manifest_path.write_text(json.dumps({"files": inventory}, indent=2,
                                        sort_keys=True) + "\n",
                             encoding="utf-8", newline="\n")
    print(json.dumps({"evidence_root": str(EVIDENCE),
                      "receipt_sha256": sha256(receipt_path),
                      "manifest_sha256": sha256(manifest_path),
                      "verdict": receipt["verdict"]}, sort_keys=True))
    return 0 if receipt["verdict"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
