#!/usr/bin/env python3
"""Independent static/receipt audit for the bounded G2H-R1 fixture repair."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FAILURE_ROOT = ROOT / "artifacts/research/nhm2/g2h-fixtures-v1"
R1 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-r1-prebuild.v1.json"
V1_SOURCE = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/tolman_vii_primary.c"
CANDIDATE_ROOTS = [
    ROOT / "artifacts/research/nhm2/g2h/tolman-vii-primary-v1",
    ROOT / "artifacts/research/nhm2/g2h/tolman-vii-independent-v1",
]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonical(payload: object) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":")).encode() + b"\n"


def main() -> int:
    r1 = json.loads(R1.read_text(encoding="utf-8"))
    v2_path = ROOT / r1["primary_v2_source"]
    v2 = v2_path.read_text(encoding="utf-8")
    v1 = V1_SOURCE.read_text(encoding="utf-8")
    manifest_path = FAILURE_ROOT / "fixture-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    unsigned = dict(manifest)
    self_hash = unsigned.pop("self_hash")

    receipt_files = sorted(
        path for path in FAILURE_ROOT.glob("*.json") if path.name != "fixture-manifest.json"
    )
    receipts = [json.loads(path.read_text(encoding="utf-8")) for path in receipt_files]
    recorded = {entry["name"]: entry for entry in manifest["artifacts"]}
    artifact_hashes_valid = all(
        path.name in recorded
        and path.stat().st_size == recorded[path.name]["bytes"]
        and sha256(path) == recorded[path.name]["sha256"]
        for path in receipt_files
    )
    observed_sequence = [receipt["fixture"] for receipt in receipts]

    checks = {
        "v1_root_is_partial_fail": manifest["complete"] is False
        and manifest["primary_fixture_count"] == 5
        and manifest["independent_fixture_count"] == 0,
        "v1_self_hash_valid": hashlib.sha256(canonical(unsigned)).hexdigest() == self_hash,
        "v1_artifact_hashes_valid": artifact_hashes_valid,
        "v1_first_failure_exact": observed_sequence
        == [
            "digest_mutation",
            "authority_mutation",
            "strict_sign_touching_zero",
            "nonfinite_arithmetic",
            "exact_rational_positive",
        ]
        and receipts[-1]["pass"] is False
        and receipts[-1]["observation"]["pass"] is False,
        "v1_authority_locked": manifest["candidate_evaluations"] == 0
        and manifest["candidate_execution_authorized"] is False
        and manifest["classical_proof_established"] is False,
        "v1_source_still_bound": sha256(V1_SOURCE) == r1["primary_v1_source_sha256"],
        "v2_source_bound": sha256(v2_path) == r1["primary_v2_source_sha256"]
        and v2_path.stat().st_size == r1["primary_v2_source_bytes"],
        "v2_reuses_v1_without_mutation": '#include "tolman_vii_primary.c"' in v2
        and "run_fixture_v1(name)" in v2,
        "v2_delta_is_exact_layer_only": "fmpq_set_si(exact, 1, 5)" in v2
        and "fmpq_equal_si(exact, 1, 5)" in v2
        and "arb_contains_fmpq(enclosure, exact)" in v2
        and v2.count("exact_rational_positive") == 1,
        "candidate_guard_preserved": "refuse_candidate_execution" in v1
        and "return refuse_candidate_execution();" in v2,
        "independent_unexecuted": r1["independent_reuse"]["prior_executions"] == 0,
        "candidate_roots_absent": all(not path.exists() for path in CANDIDATE_ROOTS),
        "fresh_v2_root_absent": not (ROOT / r1["fresh_output_root"]).exists(),
        "zero_authority": r1["candidate_evaluations"] == 0
        and r1["candidate_execution_authorized"] is False
        and r1["proof_implementation_complete"] is False
        and r1["all_downstream_authority"] is False,
    }
    print(json.dumps({"schema": "nhm2.g2h_r1.static_audit.v1", "checks": checks}, sort_keys=True))
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
