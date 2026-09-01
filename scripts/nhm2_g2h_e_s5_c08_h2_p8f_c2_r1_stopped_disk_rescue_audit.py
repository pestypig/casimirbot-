"""Audit the candidate-neutral H2-P8F-C2-R1 stopped-disk rescue proposal."""

from __future__ import annotations

import hashlib
import json
import pathlib


ROOT = pathlib.Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8f-c2-r1-stopped-disk-rescue-proposal.md"
RESCUE = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8f_c2_r1_stopped_disk_rescue_v1.sh"
CONTROLLER = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8f_c2_r1_cloud_run_v1.sh"
EXPECTED_CONTROLLER = "8c83cd477e95260bcf53bd909584062b8c6d8f9087b5614c9df0533bfa2b2406"


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    text = DOC.read_text(encoding="utf-8")
    rescue = RESCUE.read_text(encoding="utf-8")
    checks = {
        "header": all(key in text for key in (
            "Program gate:", "Workstream:", "Capability or component:",
            "Current maturity:", "Target maturity:", "Required frozen inputs:",
            "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
            "Downstream gate unlocked:",
        )),
        "controller_exact": sha(CONTROLLER) == EXPECTED_CONTROLLER and EXPECTED_CONTROLLER[:8] in text,
        "terminal_chronology": all(value in text for value in (
            "2026-08-31T15:07:57.978406008Z", "35,840/65,536",
            "2026-08-31T08:05:03.030-07:00", "2026-08-31T10:25:26.239-07:00",
        )),
        "source_protected": "must remain stopped,\nattached and unchanged" in text and "original-VM restart are forbidden" in text,
        "resources_exact": all(value in text for value in (
            "nhm2-h2-p8f-c2-r1-evidence-snapshot-20260831",
            "nhm2-h2-p8f-c2-r1-evidence-clone-20260831",
            "nhm2-h2-p8f-c2-r1-rescue-e2-small-20260831",
            "`e2-small`", "10 GB `pd-standard`", "`$0.50`", "3,600 seconds",
        )),
        "boot_before_attach": "helper boot before clone attachment" in text and "`READ_ONLY` mode" in text,
        "mount_fail_closed": "ext4 with `ro,noload`" in text and "xfs\nwith `ro,norecovery`" in text and "Filesystem check/repair" in text,
        "bounded_read": "reads only the stopped source filesystem" in text and "persistent controller journal" in text,
        "transport_bound": "copied once through Cloud Shell" in text and "SHA-256 at every hop" in text,
        "retention": "all evidence remain retained" in text and "separate cleanup decision" in text,
        "authority_locked": "does not authorize numerical execution" in text and "physical, propulsion or transport" in text,
        "rescue_paths_exact": all(value in rescue for value in (
            "google-nhm2-h2-p8f-c2-r1-evidence-clone",
            "/mnt/nhm2-p8f-c2-r1-rescue",
            "nhm2-h2-p8f-c2-r1-evidence-v1",
            "nhm2-h2-p8f-c2-r1-evidence-export-v1.tgz",
            "nhm2-h2-p8f-c2-r1-controller",
        )),
        "rescue_read_only": all(value in rescue for value in (
            "blockdev --getro", "mount -o ro,noload", "mount -o ro,norecovery",
            "findmnt -no OPTIONS", "grep -qx ro",
        )),
        "deterministic_archive": all(value in rescue for value in (
            "--sort=name", "--mtime='UTC 2026-08-31'", "--owner=0",
            "--group=0", "--numeric-owner", "sha256sum",
        )),
    }
    passed = sum(checks.values())
    result = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8f_c2_r1_stopped_disk_rescue_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "rescue_sha256": sha(RESCUE),
        "proposal_sha256": sha(DOC),
        "candidate_evaluations": 0,
        "numerical_executions": 0,
        "authority_promoted": False,
    }
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
