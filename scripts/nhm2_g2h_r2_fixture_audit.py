#!/usr/bin/env python3
"""Producer-independent audit of immutable G2H-R2 fixture receipts."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "artifacts/research/nhm2/g2h-fixtures-v3"
BINDING = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-build-bindings.v3.json"
SIDECAR = BINDING.with_suffix(".sha256")
CANDIDATE_ROOTS = (
    ROOT / "artifacts/research/nhm2/g2h/tolman-vii-primary-v1",
    ROOT / "artifacts/research/nhm2/g2h/tolman-vii-independent-v1",
)
FIXTURES = (
    "digest_mutation",
    "authority_mutation",
    "strict_sign_touching_zero",
    "nonfinite_arithmetic",
    "exact_rational_positive",
    "chronology_interruption",
    "deliberate_disagreement",
)
TYPED = {
    "digest_mutation": "CONTRACT_OR_SOURCE_DIGEST_MISMATCH",
    "authority_mutation": "AUTHORITY_MUTATION_REJECTED",
    "strict_sign_touching_zero": "STRICT_SIGN_TOUCHING_ZERO_REJECTED",
    "nonfinite_arithmetic": "NONFINITE_ARITHMETIC_REJECTED",
    "exact_rational_positive": "NO_CANDIDATE_EXACT_RATIONAL_FIXTURE_PASS",
    "chronology_interruption": "INDEPENDENT_START_BEFORE_PRIMARY_COMPLETION_REJECTED",
    "deliberate_disagreement": "PRIMARY_INDEPENDENT_DISAGREEMENT",
}


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def canonical(payload: object) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":")).encode() + b"\n"


def main() -> int:
    manifest_path = EVIDENCE / "fixture-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    binding_bytes = BINDING.read_bytes()
    binding = json.loads(binding_bytes)
    binding_hash = SIDECAR.read_text(encoding="ascii").split()[0]
    unsigned_manifest = dict(manifest)
    self_hash = unsigned_manifest.pop("self_hash")
    receipt_paths = sorted(
        path for path in EVIDENCE.glob("*.json") if path.name != manifest_path.name
    )
    receipts = [json.loads(path.read_text(encoding="utf-8")) for path in receipt_paths]
    recorded = {item["name"]: item for item in manifest["artifacts"]}
    expected_sequence = list(range(2, 9)) + list(range(10, 17))
    expected_pairs = [
        (lane, fixture)
        for lane in ("primary", "independent")
        for fixture in FIXTURES
    ]

    checks = {
        "binding_valid": sha256_bytes(binding_bytes) == binding_hash
        and manifest["binding_sha256"] == binding_hash,
        "manifest_self_hash_valid": sha256_bytes(canonical(unsigned_manifest)) == self_hash,
        "artifact_inventory_exact": len(receipt_paths) == 14
        and len(recorded) == 14
        and set(recorded) == {path.name for path in receipt_paths},
        "artifact_hashes_valid": all(
            path.stat().st_size == recorded[path.name]["bytes"]
            and sha256(path) == recorded[path.name]["sha256"]
            for path in receipt_paths
        ),
        "chronology_exact": [receipt["sequence"] for receipt in receipts]
        == expected_sequence
        and [(receipt["lane"], receipt["fixture"]) for receipt in receipts]
        == expected_pairs
        and [event["sequence"] for event in manifest["events"]] == list(range(1, 17))
        and manifest["events"][0] == {
            "sequence": 1,
            "lane": "primary",
            "event": "image_identity_verified",
        }
        and manifest["events"][8] == {
            "sequence": 9,
            "lane": "independent",
            "event": "image_identity_verified",
        },
        "lane_identities_bound": all(
            receipt["image_id"] == binding[receipt["lane"]]["image_id"]
            and receipt["executable_sha256"]
            == binding[receipt["lane"]]["executable_sha256"]
            for receipt in receipts
        ),
        "fixture_results_typed_and_complete": all(
            receipt["schema"] == "nhm2.g2h.fixture_receipt.v1"
            and receipt["exit_code"] == 0
            and receipt["pass"] is True
            and receipt["observation"]["pass"] is True
            and receipt["observation"]["fixture"] == receipt["fixture"]
            and receipt["observation"]["typed_result"] == TYPED[receipt["fixture"]]
            for receipt in receipts
        ),
        "implementations_distinct": {
            receipt["observation"]["implementation"] for receipt in receipts
        }
        == {
            "G2H_TOLMAN_VII_PRIMARY_C17_ARB_V1",
            "G2H_TOLMAN_VII_INDEPENDENT_PURE_RUST_V1",
        },
        "contract_identity_exact": all(
            receipt["observation"]["contract_sha256"] == binding["contract_sha256"]
            for receipt in receipts
        ),
        "receipt_authority_locked": all(
            receipt["candidate_evaluations"] == 0
            and receipt["candidate_execution_authorized"] is False
            and receipt["observation"]["candidate_evaluations"] == 0
            and receipt["observation"]["candidate_execution_authorized"] is False
            and receipt["observation"]["candidate_admitted"] is False
            and receipt["observation"]["classical_proof_established"] is False
            and receipt["observation"]["physical_viability"] is False
            and receipt["observation"]["propulsion_authority"] is False
            and receipt["observation"]["transport_authority"] is False
            for receipt in receipts
        ),
        "manifest_complete_but_non_authoritative": manifest["complete"] is True
        and manifest["primary_fixture_count"] == 7
        and manifest["independent_fixture_count"] == 7
        and manifest["candidate_evaluations"] == 0
        and manifest["candidate_execution_authorized"] is False
        and manifest["classical_proof_established"] is False
        and manifest["geometry_state_accepted"] is False
        and manifest["diagnostic_lamp"] is False
        and manifest["physical_viability"] is False
        and manifest["propulsion_authority"] is False
        and manifest["transport_authority"] is False,
        "candidate_roots_absent": all(not path.exists() for path in CANDIDATE_ROOTS)
        and manifest["candidate_roots_absent"] is True,
        "v1_failure_preserved": (
            ROOT / "artifacts/research/nhm2/g2h-fixtures-v1/fixture-manifest.json"
        ).is_file(),
    }
    print(json.dumps({"schema": "nhm2.g2h_r2.fixture_audit.v1", "checks": checks}, sort_keys=True))
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
