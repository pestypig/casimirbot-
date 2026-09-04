"""Audit the candidate-neutral H2-P8P-R30 stopped-disk inspection proposal."""

from __future__ import annotations

import hashlib
import json
import pathlib


ROOT = pathlib.Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r30-stopped-disk-inspection-proposal.md"
RESCUE = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r30_stopped_disk_inspection_v1.sh"
R29_RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r29-terminal-guest-depth-unknown-result.md"
EXPECTED_RESCUE = "d1781a5a26f711f93ed2a2b3f6d1f82a2918c025eaf762dc07cff12adc30cb16"
EXPECTED_R29_RESULT = "bf3c12a6719ba5dbf35a2ad8aff5b407c0dfb647cb4393644e6eb546cdbed3e7"


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    text = DOC.read_text(encoding="utf-8")
    rescue = RESCUE.read_text(encoding="utf-8")
    flat = " ".join(text.split())
    checks = {
        "header": all(key in text for key in (
            "Program gate:", "Workstream:", "Capability or component:",
            "Current maturity:", "Target maturity:", "Required frozen inputs:",
            "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
            "Downstream gate unlocked:",
        )),
        "r29_result_exact": sha(R29_RESULT) == EXPECTED_R29_RESULT and EXPECTED_R29_RESULT in text,
        "rescue_exact": sha(RESCUE) == EXPECTED_RESCUE and EXPECTED_RESCUE in text,
        "source_identity": all(value in text for value in (
            "nhm2-h2-p8p-r26-c2d-32-20260903", "4290604153416687194",
            "8031354852430290522", "us-east1-c", "30 GB `pd-standard`",
        )),
        "resources_exact": all(value in text for value in (
            "nhm2-h2-p8p-r29-evidence-snapshot-20260904",
            "nhm2-h2-p8p-r29-evidence-clone-20260904",
            "nhm2-h2-p8p-r29-rescue-e2-small-20260904",
            "`e2-small`", "10 GB `pd-standard`", "3,600 seconds", "`$0.50`",
        )),
        "boot_before_attach": "helper must boot before clone attachment" in flat and "`READ_ONLY` mode" in text,
        "mount_fail_closed": all(value in flat for value in (
            "ext4 with `ro,noload`", "xfs with `ro,norecovery`",
            "Filesystem check/repair is forbidden",
        )),
        "diagnostic_scope": all(value in text for value in (
            "R29 unit", "persistent journal", "exact P8P source/evidence paths",
            "Docker metadata inventory",
        )),
        "bounded_ingress": "268,435,456-byte" in text and "67,108,864-byte" in text,
        "transport_bound": "exactly once" in text and "SHA-256" in text and "initially absent" in text,
        "source_protected": "must remain terminated, attached and unchanged" in flat,
        "authority_locked": "does not authorize numerical execution" in text and "physical, propulsion or transport" in text,
        "rescue_paths_exact": all(value in rescue for value in (
            "google-nhm2-h2-p8p-r29-evidence-clone",
            "/mnt/nhm2-p8p-r29-rescue",
            "nhm2-h2-p8p-r29.service",
            "nhm2-h2-p8p-evidence-v1",
            "nhm2-h2-p8p-evidence-export-v1.tgz",
            "p8p-docker-build.txt",
        )),
        "rescue_read_only": all(value in rescue for value in (
            "blockdev --getro", "mount -o ro,noload", "mount -o ro,norecovery",
            "findmnt -no OPTIONS", "grep -qx ro",
        )),
        "rescue_bounded": all(value in rescue for value in (
            "MAX_COPY_BYTES=268435456", "MAX_FILE_BYTES=67108864",
            "-size +\"${MAX_FILE_BYTES}\"c", "--lines=4000",
        )),
        "deterministic_archive": all(value in rescue for value in (
            "--sort=name", "--mtime='UTC 2026-09-04'", "--owner=0",
            "--group=0", "--numeric-owner", "sha256sum",
        )),
    }
    passed = sum(checks.values())
    result = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8p_r30_stopped_disk_inspection_audit.v1",
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
