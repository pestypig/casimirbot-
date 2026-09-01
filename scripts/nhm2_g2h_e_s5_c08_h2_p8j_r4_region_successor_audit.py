#!/usr/bin/env python3
"""Static independent audit for the candidate-neutral P8J-R4 region successor."""

from __future__ import annotations

import hashlib
import json
import pathlib


ROOT = pathlib.Path(__file__).resolve().parents[1]
R3_RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r3-cloud-preexecution-result.md"
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r4-region-capacity-successor-proposal.md"
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c2-r1-cloud-preflight-v1-20260831/h2-p8f-c2-r1-cloud-upload-v1.tar"
OVERLAY = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-cloud-preflight-v1-20260831/h2-p8j-r2-overlay-upload-v1.tar"
P8J_AUDIT = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8j_result_audit.py"
CONTROLLER = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8j_cloud_run_v1.sh"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r4-region-successor-preflight-v1-20260831/h2-p8j-r4-region-successor-audit.v1.json"


def sha256(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    checks: dict[str, bool] = {}

    def exact(name: str, path: pathlib.Path, size: int, digest: str) -> None:
        checks[f"{name}_regular"] = path.is_file() and not path.is_symlink()
        checks[f"{name}_bytes"] = checks[f"{name}_regular"] and path.stat().st_size == size
        checks[f"{name}_sha256"] = checks[f"{name}_regular"] and sha256(path) == digest

    exact("r3_result", R3_RESULT, 3471, "21dafa88f5ae9e783c689fdfe021afc5e399f231528056433e8c27e247d46dd7")
    exact("r4_proposal", PROPOSAL, 6462, "2510cae2367a1f7b71fa3813d7b9d616d29983993017a3fdeac24aeec8c23d9f")
    exact("base", BASE, 236492800, "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978")
    exact("overlay", OVERLAY, 225792, "3d49deb1c4044232e2cdd83da6192f2baca26bbc9773b58bbdca85e6109c19a7")
    exact("p8j_audit", P8J_AUDIT, 10138, "5a3cfc0d1413353c7ee6f9050bc8b2305d23383fd0746559cd51b53f3454cab2")
    exact("controller", CONTROLLER, 5857, "4b8f5722c885980bb0fbac3602ecf36436a66ff1141e4776168f3bbef86276e6")

    r3 = R3_RESULT.read_text(encoding="utf-8")
    proposal = PROPOSAL.read_text(encoding="utf-8")
    checks["r3_terminal_classification"] = "BLOCKED_PREEXECUTION_ZONE_RESOURCE_POOL_EXHAUSTED / R3 EXHAUSTED" in r3
    checks["r3_two_zones_bound"] = "us-central1-a" in r3 and "us-central1-b" in r3
    checks["r3_no_scientific_execution"] = "No scientific\nexecutable ran" in r3
    checks["metadata_complete"] = all(
        f"{field}:" in proposal
        for field in (
            "Program gate", "Workstream", "Capability or component", "Current maturity",
            "Target maturity", "Required frozen inputs", "Required evidence", "Stop/fail criteria",
            "Explicit non-goals", "Downstream gate unlocked",
        )
    )
    checks["official_resource_guidance"] = "troubleshooting-resource-availability" in proposal
    checks["official_error_catalog"] = "reference/rest/beta/errors" in proposal
    checks["quota_not_capacity"] = "distinguishes quota eligibility and machine-type definition from\nlive physical capacity" in proposal
    checks["global_quota_bound"] = "`CPUS_ALL_REGIONS` was `32 / 0`" in proposal
    checks["regional_quota_bound"] = all(x in proposal for x in ("`us-east1`", "`200 / 0`", "N2_CPUS"))
    checks["no_active_instances"] = "no non-terminated instance was\nlisted" in proposal
    checks["r4_cross_region_only"] = "zone: `us-central1-b` -> `us-east1-b`" in proposal
    checks["r4_name_exact"] = "nhm2-h2-p8j-r4-n2-32-20260831" in proposal
    checks["deterministic_zone_rule"] = "first enumerated N2-capable zone" in proposal
    checks["no_creation_probe"] = "No creation request was used as a\ncapacity probe" in proposal
    checks["machine_unchanged"] = "exactly one temporary on-demand `n2-standard-32`" in proposal
    checks["image_exact"] = "projects/debian-cloud/global/images/debian-12-bookworm-v20260817" in proposal
    checks["disk_exact"] = "exactly 30 GB `pd-balanced`" in proposal
    checks["no_upload"] = "No upload, replacement, rename, move or deletion is permitted" in proposal
    checks["single_creation"] = "exactly one R4 creation attempt" in proposal
    checks["failure_terminal"] = "If creation\nfails, R4 is terminal" in proposal
    checks["no_retry"] = "There is no\nretry, fallback, retune, resource substitution" in proposal
    checks["one_process"] = "starting\nexactly one no-network" in proposal
    checks["timeout_bound"] = "`86,400` seconds" in proposal and "`90,000` seconds" in proposal
    checks["cost_bound"] = "`$40.00`" in proposal
    checks["binary_bound"] = "d40c6e51988c30d89f8cd824e41f855e56acdb4e40f0bb0a24cf0e88721de9d6" in proposal
    checks["fixture_bound"] = "445e6a277c4071abd73beec61fcac317e1b8048dd0e54439e9157cd94f504ab2" in proposal
    checks["separate_authorization"] = "R4 requires separate exact operator authorization" in proposal
    checks["reservation_deferred"] = "reservation is deferred" in proposal
    checks["alternate_machine_deferred"] = "Changing machine family is deferred" in proposal
    checks["candidate_neutral"] = "Candidate evaluations and positive samples remain zero" in proposal
    checks["authority_locked"] = "authority remain false" in proposal

    passed = sum(checks.values())
    receipt = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8j_r4_region_successor_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "r3_result_sha256": "21dafa88f5ae9e783c689fdfe021afc5e399f231528056433e8c27e247d46dd7",
        "r4_proposal_sha256": "2510cae2367a1f7b71fa3813d7b9d616d29983993017a3fdeac24aeec8c23d9f",
        "r4_cloud_action_performed": False,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "authority_promoted": False,
        "checks": checks,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(receipt, sort_keys=True, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{passed}/{len(checks)} {receipt['status']}")
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
