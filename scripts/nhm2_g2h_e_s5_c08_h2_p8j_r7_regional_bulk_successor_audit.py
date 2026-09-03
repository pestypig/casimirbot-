#!/usr/bin/env python3
"""Independent static audit for the candidate-neutral P8J-R7 successor."""

from __future__ import annotations

import hashlib
import json
import pathlib


ROOT = pathlib.Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r7-regional-bulk-capacity-successor-proposal.md"
R6_RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r6-cloud-preexecution-result.md"
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c2-r1-cloud-preflight-v1-20260831/h2-p8f-c2-r1-cloud-upload-v1.tar"
OVERLAY = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-cloud-preflight-v1-20260831/h2-p8j-r2-overlay-upload-v1.tar"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r7-regional-bulk-successor-preflight-v1-20260831/h2-p8j-r7-regional-bulk-successor-audit.v1.json"


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

    exact("proposal", PROPOSAL, 7750, "1a2ac30fa82d1ac96d03eea58a91a6bfd7261447cfd083df565b8da1cdf7469e")
    exact("r6_result", R6_RESULT, 4049, "2cf0ef29ee9fe17e8a6c39fea5055d66a5b52a31fe4a35317c740a4f127f7b68")
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
    checks["status_frozen_no_resource"] = "FROZEN PREEXECUTION PROPOSAL / NO R7 CLOUD RESOURCE CREATED" in text
    checks["r6_stockout_bound"] = all(x in text for x in ("R6 admitted", "single `us-central1-a` request", "zonal stockout"))
    checks["allocation_only_change"] = "changes only the capacity-allocation method" in text
    checks["official_bulk_sources"] = all(
        x in text
        for x in (
            "instances/multiple/about-bulk-creation",
            "sdk/gcloud/reference/compute/instances/bulk/create",
            "compute/docs/regions-zones",
        )
    )
    checks["bulk_command_exact"] = "`gcloud compute instances bulk create`" in text
    checks["region_exact"] = "`dark-stratum-455714-h4` / `us-east1`" in text
    checks["name_exact"] = "exactly `nhm2-h2-p8j-r7-c2d-32-20260831`" in text
    checks["count_exact"] = "| count / minimum | `1` / `1` |" in text
    checks["shape_exact"] = "| target distribution | `ANY_SINGLE_ZONE` |" in text
    checks["zones_exact"] = all(x in text for x in ("`us-east1-b`", "`us-east1-c`", "`us-east1-d`"))
    checks["machine_exact"] = "`c2d-standard-32` / `STANDARD` on-demand" in text
    checks["image_exact"] = "projects/debian-cloud/global/images/debian-12-bookworm-v20260817" in text
    checks["disk_exact"] = "exactly 30 GB `pd-balanced`, auto-delete" in text
    checks["provider_stop"] = "| maximum run duration | `25h` with termination action `STOP` |" in text
    checks["absence_guard"] = "exact name is\nabsent in every zone" in text
    checks["single_live_guard"] = "no other non-terminated `nhm2-h2-` VM exists" in text
    checks["single_result_guard"] = "exactly one instance with the predefined name" in text and "Zero or multiple instances are terminal failures" in text
    checks["controller_exact"] = "4b8f5722c885980bb0fbac3602ecf36436a66ff1141e4776168f3bbef86276e6" in text
    checks["fixture_exact"] = "445e6a277c4071abd73beec61fcac317e1b8048dd0e54439e9157cd94f504ab2" in text and "14/14 PASS" in text
    checks["target_exact"] = "d40c6e51988c30d89f8cd824e41f855e56acdb4e40f0bb0a24cf0e88721de9d6" in text
    checks["scientific_surface_exact"] = "`65,536` / `32` / `3` / `9` / `512-bit Arb`" in text
    checks["one_process"] = "starting exactly one no-network" in text
    checks["runtime_ceiling"] = "90,000` seconds" in text
    checks["cost_ceiling"] = "$40.00`" in text
    checks["first_failure_terminal"] = "First failure is terminal" in text
    checks["no_retry_fallback_retune"] = all(x in text for x in ("no retry, fallback, second bulk request", "retune", "resource substitution"))
    checks["no_multiple_resources"] = "does not\nauthorize multiple disks, VMs or processes" in text
    checks["candidate_activity_locked"] = "Candidate evaluations and positive samples remain zero" in text
    checks["authority_locked"] = "transport authority remain false" in text

    passed = sum(checks.values())
    receipt = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8j_r7_regional_bulk_successor_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "proposal_sha256": "1a2ac30fa82d1ac96d03eea58a91a6bfd7261447cfd083df565b8da1cdf7469e",
        "r6_result_sha256": "2cf0ef29ee9fe17e8a6c39fea5055d66a5b52a31fe4a35317c740a4f127f7b68",
        "allocation_method": "regional_bulk_insert",
        "region": "us-east1",
        "machine_type": "c2d-standard-32",
        "requested_count": 1,
        "minimum_count": 1,
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
