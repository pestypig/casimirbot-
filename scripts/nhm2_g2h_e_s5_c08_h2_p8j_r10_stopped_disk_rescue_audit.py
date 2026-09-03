"""Audit the candidate-neutral H2-P8J-R10 stopped-disk rescue proposal."""

from __future__ import annotations

import hashlib
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r10-stopped-disk-rescue-proposal.md"
RESCUE = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8j_r10_stopped_disk_rescue_v1.sh"
ORCHESTRATOR = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8j_r10_cloudshell_rescue_orchestrator_v1.sh"
LEDGER = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r10-stopped-disk-rescue-preflight-v1-20260901/h2-p8j-r10-staging-command-ledger.v1.json"
CONTROLLER = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8j_cloud_run_v1.sh"
EXPECTED_CONTROLLER = "4b8f5722c885980bb0fbac3602ecf36436a66ff1141e4776168f3bbef86276e6"


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
        "orchestrator_exact": sha(ORCHESTRATOR) == "a7a824fedee5cf32db43b37608b5e71a282565373f4dca83239259dda51f2c4d" and "a7a824fe" in text,
        "ledger_exact": sha(LEDGER) == "30ae0c68a047fe2f7dd891dbb06b0abbf27a82c76c9cc5af6f9ceb28d2611f35" and "30ae0c68" in text,
        "outer_evidence": all(value in text for value in (
            "ffe56577eab1b7a6b0b51964d8e33e5b79ae3bfe7d7a628656d8f0095049f665",
            "R9_PREEXECUTION_PASS", "us-east1-c", "outer exit `3`", "fail-stop",
        )),
        "source_protected": "original VM is never started" in text and "original VM/disk" in text,
        "resources_exact": all(value in text for value in (
            "nhm2-h2-p8j-r9-evidence-snapshot-20260901",
            "nhm2-h2-p8j-r9-evidence-clone-20260901",
            "nhm2-h2-p8j-r10-rescue-e2-small-20260901",
            "`e2-small`", "10 GB `pd-standard`", "`$0.50`", "3,600-second",
        )),
        "boot_before_attach": "helper boot before clone attachment" in text and "`READ_ONLY` mode" in text,
        "mount_fail_closed": "ext4 with `ro,noload`" in text and "xfs with `ro,norecovery`" in text,
        "bounded_read": "reads only" in text and "persistent controller journal" in text,
        "transport_bound": "hash-verified through Cloud Shell" in text and "initially absent local capture" in text,
        "retention": "remain\nretained pending a separate cleanup decision" in text and "authorizes no deletion" in text,
        "authority_locked": "authorizes no numerical execution" in text and "physical, propulsion or transport" in text,
        "rescue_paths_exact": all(value in rescue for value in (
            "google-nhm2-h2-p8j-r9-evidence-clone", "/mnt/nhm2-p8j-r9-rescue",
            "nhm2-h2-p8j-evidence-v1", "nhm2-h2-p8j-evidence-export-v1.tgz",
            "nhm2-h2-p8j-r9.service",
        )),
        "rescue_read_only": all(value in rescue for value in (
            "blockdev --getro", "mount -o ro,noload", "mount -o ro,norecovery",
            "findmnt -no OPTIONS", "grep -qx ro",
        )),
        "deterministic_archive": all(value in rescue for value in (
            "--sort=name", "--mtime='UTC 2026-09-01'", "--owner=0",
            "--group=0", "--numeric-owner", "sha256sum",
        )),
        "orchestrator_scope": all(value in ORCHESTRATOR.read_text(encoding="utf-8") for value in (
            "gcloud compute snapshots create", "gcloud compute instances create",
            "gcloud compute disks create", "--mode=ro", "--max-run-duration=3600s",
        )),
    }
    passed = sum(checks.values())
    result = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8j_r10_stopped_disk_rescue_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "rescue_sha256": sha(RESCUE),
        "orchestrator_sha256": sha(ORCHESTRATOR),
        "ledger_sha256": sha(LEDGER),
        "proposal_sha256": sha(DOC),
        "candidate_evaluations": 0,
        "numerical_executions": 0,
        "authority_promoted": False,
    }
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
