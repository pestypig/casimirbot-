"""Audit the candidate-neutral H2-P8F-C1 stopped-disk rescue packet."""

from __future__ import annotations

import hashlib
import json
import pathlib


ROOT = pathlib.Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8f-c1-stopped-disk-rescue.md"
CONTROLLER = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8f_c1_cloud_run_v1.sh"
EXPECTED_CONTROLLER = "940ee74a7093614bc5c5268a9871fd40a16ab1563c60a9ba5bc399f286ddb8b2"


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    text = DOC.read_text(encoding="utf-8")
    checks = {
        "header": all(k in text for k in ("Program gate:", "Workstream:", "Capability or component:", "Current maturity:", "Target maturity:", "Required frozen inputs:", "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:", "Downstream gate unlocked:")),
        "controller_exact": sha(CONTROLLER) == EXPECTED_CONTROLLER and EXPECTED_CONTROLLER[:8] in text,
        "terminal_chronology": "PID 3123" in text and "2026-08-31T06:17:06.403-07:00" in text and "`TERMINATED`" in text,
        "source_protected": "source VM and disk must remain stopped and unchanged" in text and "source mutation or original-VM restart is allowed" in text,
        "resources_exact": all(v in text for v in ("nhm2-h2-p8f-c1-evidence-snapshot-20260831", "nhm2-h2-p8f-c1-evidence-clone-20260831", "nhm2-h2-p8f-c1-rescue-e2-small-20260831", "`e2-small`", "10 GB `pd-standard`")),
        "boot_before_attach": "helper boot before clone attachment" in text and "`READ_ONLY` mode" in text,
        "mount_fail_closed": "ext4 with `ro,noload`" in text and "xfs with `ro,norecovery`" in text and "No filesystem check" in text,
        "bounded_read": "read only the stopped source filesystem" in text and "controller load/build" in text,
        "transport_bound": "copies it" in text and "through Cloud Shell into the local candidate-neutral capture" in text and "SHA-256 at every hop" in text,
        "retention": "all evidence remain retained" in text and "separate cleanup decision" in text,
        "authority_locked": "does not authorize a numerical retry" in text and "physical, propulsion or transport authority" in text,
    }
    passed = sum(checks.values())
    out = {"schema":"nhm2.g2h_e_s5.c08_h2_p8f_c1_stopped_disk_rescue_audit.v1","status":"PASS" if passed == len(checks) else "FAIL","checks_passed":passed,"checks_total":len(checks),"checks":checks,"candidate_evaluations":0,"numerical_executions":0,"authority_promoted":False}
    print(json.dumps(out, sort_keys=True, separators=(",", ":")))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
