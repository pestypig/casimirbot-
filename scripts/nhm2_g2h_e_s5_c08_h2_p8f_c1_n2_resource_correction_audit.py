"""Audit the quota-compatible H2-P8F-C1 N2 resource correction."""

from __future__ import annotations

import hashlib
import json
import pathlib


ROOT = pathlib.Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8f-c1-n2-resource-correction.md"
PARENT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8f-c1-cloud-observable-execution-proposal.md"
ARCHIVE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c1-cloud-preflight-v1-20260831/h2-p8f-c1-cloud-upload-v2.tar"
EXPECTED_ARCHIVE = "c40fda6b7fca57c34a6eef1f93398bfbc5edb731c58c9b5d70a83dcdb4724640"
EXPECTED_PARENT = "58c3b9fbd98c616855581c36c6ce4f2c7941d89f058391e2c57681f5f29ec6e4"


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    text = DOC.read_text(encoding="utf-8")
    checks = {
        "parent_exact": sha(PARENT) == EXPECTED_PARENT,
        "archive_exact": ARCHIVE.stat().st_size == 236_391_936 and sha(ARCHIVE) == EXPECTED_ARCHIVE,
        "c4_rejection_preserved": "rejected before creating a VM or" in text and "Therefore no C4 compute cost began" in text and "limit `24`" in text,
        "n2_quota_observed": "N2 CPUs: limit `200`, usage `0`" in text,
        "resource_exact": all(value in text for value in ("nhm2-h2-p8f-c1-n2-32-20260831", "n2-standard-32", "30 GB `pd-balanced`", "us-central1-a")),
        "bounds_unchanged": "86,400" in text and "$40.00" in text,
        "identities_unchanged": all(value in text for value in (EXPECTED_ARCHIVE, "14140897...1bad6", "940ee74a...db8b2")),
        "science_unchanged": "No source, mathematical target, precision, panel count, thread count" in text,
        "authority_locked": "no scientific authority" in text and "authority promotion" in text,
    }
    passed = sum(checks.values())
    print(json.dumps({"schema":"nhm2.g2h_e_s5.c08_h2_p8f_c1_n2_resource_correction_audit.v1","status":"PASS" if passed == len(checks) else "FAIL","checks_passed":passed,"checks_total":len(checks),"checks":checks,"candidate_evaluations":0,"authority_promoted":False},sort_keys=True,separators=(",",":")))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
