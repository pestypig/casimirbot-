#!/usr/bin/env python3
"""Static independent audit of the P8J-R7 regional disk-stockout result."""
from __future__ import annotations

import hashlib
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r7-regional-bulk-capacity-successor-proposal.md"
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r7-cloud-preexecution-result.md"
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c2-r1-cloud-preflight-v1-20260831/h2-p8f-c2-r1-cloud-upload-v1.tar"
OVERLAY = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-cloud-preflight-v1-20260831/h2-p8j-r2-overlay-upload-v1.tar"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r7-result-v1-20260831/h2-p8j-r7-result-audit.v1.json"


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

    exact("proposal", PROPOSAL, 7750, "1a2ac30fa82d1ac96d03eea58a91a6bfd7261447cfd083df565b8da1cdf7469e")
    exact("result", RESULT, 4690, "948b2655eb7d47ac3a3ab18fe56fac948787513e380f22586faad4a6112556b5")
    exact("base", BASE, 236492800, "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978")
    exact("overlay", OVERLAY, 225792, "3d49deb1c4044232e2cdd83da6192f2baca26bbc9773b58bbdca85e6109c19a7")

    text = RESULT.read_text(encoding="utf-8")
    fields = (
        "Program gate", "Workstream", "Capability or component", "Current maturity",
        "Target maturity", "Required frozen inputs", "Required evidence", "Stop/fail criteria",
        "Explicit non-goals", "Downstream gate unlocked",
    )
    checks["metadata_complete"] = all(field + ":" in text for field in fields)
    checks["terminal_class"] = "BLOCKED_PREEXECUTION_REGIONAL_PD_BALANCED_STOCKOUT / R7 EXHAUSTED" in text
    checks["one_request"] = "Exactly one `gcloud compute instances bulk create` request" in text
    checks["regional_shape"] = all(value in text for value in ("`count=1`", "`min-count=1`", "`ANY_SINGLE_ZONE`"))
    checks["quota_guard"] = "`C2D_CPUS` limit\n`100.0`, usage `0.0`" in text
    checks["readonly_format_error_bounded"] = "read-only quota-formatting query was rejected" in text and "was not a creation retry" in text
    checks["operation"] = "operation-1788228712017-65a6271282cd3-e37de60d-8a2eb326" in text
    checks["done_503"] = "status: DONE" in text and "httpErrorStatusCode: 503" in text
    checks["minimum_not_reached"] = "VM_MIN_COUNT_NOT_REACHED" in text
    checks["pool_exhausted"] = "ZONE_RESOURCE_POOL_EXHAUSTED" in text
    checks["disk_reason"] = "reason: persistent_disk_availability" in text
    checks["disk_shape"] = "diskSize: 30GB" in text and "diskType: pd-balanced" in text
    checks["selected_zone"] = "zone: us-east1-c" in text
    checks["timestamps"] = all(value in text for value in ("19:11:55.141-07:00", "19:11:55.145-07:00", "19:12:19.062-07:00"))
    checks["vm_disk_absent"] = "left no R7 VM or disk" in text
    checks["no_build_fixture"] = "offline build and P8I fixture did not run" in text
    checks["no_process"] = "no representative or candidate process started" in text
    checks["inference_bounded"] = "does not establish that C2D\ncompute capacity was available through completion" in text
    checks["not_mathematics"] = "does not diagnose\nthe H2 mathematics" in text
    checks["no_automatic_successor"] = "no retry, storage substitution or automatic successor execution" in text
    checks["candidate_zero"] = "Candidate evaluations and positive samples remain zero" in text
    checks["authority_locked"] = "transport authority remain false" in text

    passed = sum(checks.values())
    receipt = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8j_r7_result_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "proposal_sha256": "1a2ac30fa82d1ac96d03eea58a91a6bfd7261447cfd083df565b8da1cdf7469e",
        "result_sha256": "948b2655eb7d47ac3a3ab18fe56fac948787513e380f22586faad4a6112556b5",
        "classification": "BLOCKED_PREEXECUTION_REGIONAL_PD_BALANCED_STOCKOUT",
        "regional_request_count": 1,
        "vm_created": False,
        "disk_created": False,
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
