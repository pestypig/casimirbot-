"""Audit the H2-P8F-C1 N2 terminal-input recovery packet."""

from __future__ import annotations

import hashlib
import json
import pathlib


ROOT = pathlib.Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8f-c1-n2-terminal-input-recovery.md"
PARENT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8f-c1-n2-resource-correction.md"
ARCHIVE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c1-cloud-preflight-v1-20260831/h2-p8f-c1-cloud-upload-v2.tar"
EXPECTED_PARENT = "be5696c37958082ea598e7ec3caca815664273f18e3b64a5ac81dafcbba8103b"
EXPECTED_ARCHIVE = "c40fda6b7fca57c34a6eef1f93398bfbc5edb731c58c9b5d70a83dcdb4724640"


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    text = DOC.read_text(encoding="utf-8")
    checks = {
        "parent_exact": sha(PARENT) == EXPECTED_PARENT,
        "archive_exact": ARCHIVE.stat().st_size == 236_391_936 and sha(ARCHIVE) == EXPECTED_ARCHIVE,
        "work_packet_header": all(key in text for key in (
            "Program gate:", "Workstream:", "Capability or component:", "Current maturity:",
            "Target maturity:", "Required frozen inputs:", "Required evidence:",
            "Stop/fail criteria:", "Explicit non-goals:", "Downstream gate unlocked:",
        )),
        "incident_identity": all(value in text for value in (
            "`instances`, ID `4056482909131436405`", "`n2-standard-32`",
            "2026-08-31T02:55:38.250-07:00", "2026-08-31T02:57:21.051-07:00",
            "current status `TERMINATED`", "30 GB `pd-balanced`", "auto-delete true",
        )),
        "zero_science": all(value in text for value in (
            "No archive was copied", "Docker was not installed", "no executable was invoked",
            "no output or evidence root was created", "no candidate or positive sample was",
        )),
        "narrow_delete": "permanently delete only the terminated accidental VM `instances`" in text and "Deletion is limited to the accidental inert resource" in text,
        "replacement_exact": all(value in text for value in (
            "`nhm2-h2-p8f-c1-n2-32-20260831`", "us-central1-a",
            "projects/debian-cloud/global/images/debian-12-bookworm-v20260817",
            "86,400-second", "`$40.00`",
        )),
        "terminal_guard": all(value in text for value in (
            "receive `Ctrl+U`", "observed empty at a live prompt",
            "exactly one\n`gcloud compute instances create` token sequence",
        )),
        "science_unchanged": "changes no\nmathematical semantics" in text and "unchanged candidate-neutral archive" in text,
        "evidence_protected": "every NHM2 evidence disk/snapshot/clone" in text and "remain protected" in text,
        "authority_locked": "no scientific authority" in text and "every scientific/authority lock" in text,
    }
    passed = sum(checks.values())
    result = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8f_c1_n2_terminal_input_recovery_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "candidate_evaluations": 0,
        "authority_promoted": False,
    }
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
