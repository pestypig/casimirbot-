#!/usr/bin/env python3
"""Independent static audit for the candidate-neutral P8J-R8 successor."""
from __future__ import annotations

import hashlib
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r8-pd-standard-regional-capacity-successor-proposal.md"
R7_RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r7-cloud-preexecution-result.md"
CLEANUP = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-cloud-cleanup-result-20260831.md"
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c2-r1-cloud-preflight-v1-20260831/h2-p8f-c2-r1-cloud-upload-v1.tar"
OVERLAY = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-cloud-preflight-v1-20260831/h2-p8j-r2-overlay-upload-v1.tar"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r8-pd-standard-successor-preflight-v1-20260831/h2-p8j-r8-pd-standard-successor-audit.v1.json"


def digest(path: pathlib.Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            value.update(chunk)
    return value.hexdigest()


def main() -> int:
    checks: dict[str, bool] = {}

    def exact(name: str, path: pathlib.Path, size: int, sha256: str) -> None:
        checks[name + "_regular"] = path.is_file() and not path.is_symlink()
        checks[name + "_bytes"] = checks[name + "_regular"] and path.stat().st_size == size
        checks[name + "_sha256"] = checks[name + "_regular"] and digest(path) == sha256

    exact("proposal", PROPOSAL, 8484, "fd73febf138f6dd03ecfa507eeec915bc727dce5d073f52ff1bfd02360481b83")
    exact("r7_result", R7_RESULT, 4690, "948b2655eb7d47ac3a3ab18fe56fac948787513e380f22586faad4a6112556b5")
    exact("cleanup", CLEANUP, 3525, "b8098a7cbd23955b5ae282283aba7774eef87039a7ce2e3d2ad7e2f833ef7ad4")
    exact("base", BASE, 236492800, "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978")
    exact("overlay", OVERLAY, 225792, "3d49deb1c4044232e2cdd83da6192f2baca26bbc9773b58bbdca85e6109c19a7")

    text = PROPOSAL.read_text(encoding="utf-8")
    fields = (
        "Program gate", "Workstream", "Capability or component", "Current maturity",
        "Target maturity", "Required frozen inputs", "Required evidence", "Stop/fail criteria",
        "Explicit non-goals", "Downstream gate unlocked",
    )
    checks["metadata_complete"] = all(field + ":" in text for field in fields)
    checks["status_frozen_no_resource"] = "FROZEN PREEXECUTION PROPOSAL / NO R8 CLOUD RESOURCE CREATED" in text
    checks["r7_disk_stockout_bound"] = all(value in text for value in ("R7's sole regional request", "`pd-balanced` disk was\nunavailable", "left no VM or disk"))
    checks["only_storage_and_name_change"] = "changes only the zonal boot-disk storage class" in text and "changes the predefined resource name" in text
    checks["c2d_standard_supported"] = "C2D supports zonal Standard Persistent Disk" in text
    checks["minimum_valid"] = "10 GiB minimum, so 30 GB is valid" in text
    checks["default_type"] = "gcloud and the Compute Engine API use `pd-standard` as their default" in text
    checks["hdd_boundary"] = "`pd-standard` is HDD-backed" in text
    checks["no_performance_equivalence"] = "does not claim I/O equivalence" in text
    checks["official_sources"] = all(value in text for value in ("disks/persistent-disks", "disks/add-persistent-disk", "disks/performance", "instances/bulk/create"))
    checks["bulk_command"] = "gcloud compute instances bulk create" in text
    checks["project_region"] = "`dark-stratum-455714-h4` / `us-east1`" in text
    checks["name_exact"] = "exactly `nhm2-h2-p8j-r8-c2d-32-20260831`" in text
    checks["count_minimum"] = "| count / minimum | `1` / `1` |" in text
    checks["shape_exact"] = "| target distribution | `ANY_SINGLE_ZONE` |" in text
    checks["zones_exact"] = all(value in text for value in ("`us-east1-b`", "`us-east1-c`", "`us-east1-d`"))
    checks["machine_exact"] = "`c2d-standard-32` / `STANDARD` on-demand" in text
    checks["image_exact"] = "projects/debian-cloud/global/images/debian-12-bookworm-v20260817" in text
    checks["disk_exact"] = "exactly 30 GB zonal `pd-standard`, auto-delete" in text and "--boot-disk-type=pd-standard" in text
    checks["provider_stop"] = "`25h` with termination action `STOP`" in text
    checks["absence_guard"] = "exact name absent in\nevery zone" in text
    checks["single_live_guard"] = "no other non-terminated `nhm2-h2-` VM" in text
    checks["single_result_guard"] = "exactly one exact-name VM" in text and "Zero\nor multiple instances are terminal failures" in text
    checks["controller_exact"] = "4b8f5722c885980bb0fbac3602ecf36436a66ff1141e4776168f3bbef86276e6" in text
    checks["fixture_exact"] = "445e6a277c4071abd73beec61fcac317e1b8048dd0e54439e9157cd94f504ab2" in text and "14/14 PASS" in text
    checks["target_exact"] = "d40c6e51988c30d89f8cd824e41f855e56acdb4e40f0bb0a24cf0e88721de9d6" in text
    checks["scientific_surface"] = "`65,536` / `32` / `3` / `9` / `512-bit Arb`" in text
    checks["one_process"] = "starting exactly one\nno-network" in text
    checks["runtime_ceiling"] = "90,000 seconds" in text
    checks["cost_ceiling"] = "$40.00`" in text
    checks["first_failure_terminal"] = "First failure is terminal" in text
    checks["no_retry_substitution_retune"] = all(value in text for value in ("No retry, fallback, second bulk", "storage substitution", "retune"))
    checks["result_inference_bounded"] = "provider failure instead establishes\nonly another provisioning boundary" in text
    checks["candidate_locked"] = "Candidate evaluations and positive samples remain zero" in text
    checks["authority_locked"] = "transport authority remain false" in text

    passed = sum(checks.values())
    receipt = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8j_r8_pd_standard_successor_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "proposal_sha256": "fd73febf138f6dd03ecfa507eeec915bc727dce5d073f52ff1bfd02360481b83",
        "r7_result_sha256": "948b2655eb7d47ac3a3ab18fe56fac948787513e380f22586faad4a6112556b5",
        "cleanup_sha256": "b8098a7cbd23955b5ae282283aba7774eef87039a7ce2e3d2ad7e2f833ef7ad4",
        "allocation_method": "regional_bulk_insert",
        "region": "us-east1",
        "machine_type": "c2d-standard-32",
        "boot_disk_type": "pd-standard",
        "boot_disk_gb": 30,
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
