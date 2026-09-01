#!/usr/bin/env python3
"""Independent static audit for the candidate-neutral P8J-R6 C2D successor."""

from __future__ import annotations

import hashlib
import json
import pathlib


ROOT = pathlib.Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r6-c2d-quota-compatible-successor-proposal.md"
R5_RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r5-cloud-preexecution-result.md"
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c2-r1-cloud-preflight-v1-20260831/h2-p8f-c2-r1-cloud-upload-v1.tar"
OVERLAY = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-cloud-preflight-v1-20260831/h2-p8j-r2-overlay-upload-v1.tar"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r6-c2d-successor-preflight-v1-20260831/h2-p8j-r6-c2d-successor-audit.v1.json"


def digest(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    checks: dict[str, bool] = {}

    def exact(name: str, path: pathlib.Path, size: int, sha: str) -> None:
        checks[f"{name}_regular"] = path.is_file() and not path.is_symlink()
        checks[f"{name}_bytes"] = checks[f"{name}_regular"] and path.stat().st_size == size
        checks[f"{name}_sha256"] = checks[f"{name}_regular"] and digest(path) == sha

    exact("proposal", PROPOSAL, 6628, "f0a2aab6e81ca29d39f58fc5b79f51a5324ceca629571f1353d5e2501962d878")
    exact("r5_result", R5_RESULT, 4088, "0e8534f618aea8b09a75f26400668c0d79378a7ecf64aecee2ecbee01c7dfa0c")
    exact("base", BASE, 236492800, "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978")
    exact("overlay", OVERLAY, 225792, "3d49deb1c4044232e2cdd83da6192f2baca26bbc9773b58bbdca85e6109c19a7")

    text = PROPOSAL.read_text(encoding="utf-8")
    checks["metadata_complete"] = all(
        f"{field}:" in text
        for field in (
            "Program gate", "Workstream", "Capability or component", "Current maturity",
            "Target maturity", "Required frozen inputs", "Required evidence", "Stop/fail criteria",
            "Explicit non-goals", "Downstream gate unlocked",
        )
    )
    checks["status_frozen_no_resource"] = "FROZEN PREEXECUTION PROPOSAL / NO R6 CLOUD RESOURCE CREATED" in text
    checks["r5_quota_bound"] = all(x in text for x in ("CPUS-PER-VM-FAMILY-per-project-region", "24 for C4", "32-vCPU controller"))
    checks["c2d_quota_exact"] = text.count("| `C2D_CPUS` | `100` | `0` |") == 5
    checks["quota_not_capacity"] = "Quota does not guarantee live zonal\ncapacity" in text
    checks["shape_exact"] = "c2d-standard-32" in text and "32 vCPUs and 131,072\nMiB" in text
    checks["x86_platform"] = "x86-64 AMD EPYC Milan" in text
    checks["disk_supported"] = "30 GB `pd-balanced` boot storage" in text
    checks["price_exact"] = "$1.452768/hour" in text
    checks["project_exact"] = "project: `dark-stratum-455714-h4`" in text
    checks["zone_exact"] = "zone: exactly `us-central1-a`" in text
    checks["vm_exact"] = "VM: exactly `nhm2-h2-p8j-r6-c2d-32-20260831`" in text
    checks["image_exact"] = "projects/debian-cloud/global/images/debian-12-bookworm-v20260817" in text
    checks["disk_exact"] = "boot disk: exactly 30 GB `pd-balanced`" in text
    checks["runtime_ceiling"] = "90,000` seconds" in text
    checks["cost_ceiling"] = "$40.00`" in text
    checks["controller_exact"] = "4b8f5722c885980bb0fbac3602ecf36436a66ff1141e4776168f3bbef86276e6" in text
    checks["fixture_exact"] = "445e6a277c4071abd73beec61fcac317e1b8048dd0e54439e9157cd94f504ab2" in text and "14/14 PASS" in text
    checks["target_exact"] = "d40c6e51988c30d89f8cd824e41f855e56acdb4e40f0bb0a24cf0e88721de9d6" in text
    checks["one_process"] = "starting exactly one no-network" in text
    checks["one_creation_attempt"] = "perform exactly one R6 creation attempt" in text
    checks["first_failure_terminal"] = "First failure is terminal" in text
    checks["no_retry_fallback_retune"] = all(x in text for x in ("no\nretry, fallback, retune", "quota mutation", "resource substitution"))
    checks["candidate_activity_locked"] = "Candidate evaluations and positive samples remain zero" in text
    checks["authority_locked"] = "transport authority remain false" in text

    passed = sum(checks.values())
    receipt = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8j_r6_c2d_successor_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "proposal_sha256": "f0a2aab6e81ca29d39f58fc5b79f51a5324ceca629571f1353d5e2501962d878",
        "r5_result_sha256": "0e8534f618aea8b09a75f26400668c0d79378a7ecf64aecee2ecbee01c7dfa0c",
        "machine_type": "c2d-standard-32",
        "regional_family_quota": 100,
        "required_vcpus": 32,
        "vm_created": False,
        "numerical_process_started": False,
        "candidate_evaluations": 0,
        "authority_promoted": False,
        "checks": checks,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(receipt, sort_keys=True, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{passed}/{len(checks)} {receipt['status']}")
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
