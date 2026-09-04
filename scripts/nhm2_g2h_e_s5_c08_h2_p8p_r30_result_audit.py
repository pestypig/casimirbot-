"""Audit the immutable H2-P8P-R30 stopped-disk inspection result."""

from __future__ import annotations

import hashlib
import json
import pathlib


ROOT = pathlib.Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r30-stopped-disk-inspection-result.md"
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r30-stopped-disk-inspection-proposal.md"
RESCUE = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r30_stopped_disk_inspection_v1.sh"
CAP = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r30-stopped-disk-inspection-v1-20260904"
EXTRACTED = CAP / "extracted/nhm2-h2-p8p-r30-inspection-capture-v1"
EXPECTED_PROPOSAL = "3d9d79e8ad3b9513659859d6a093e76ef5e7397b47b380bd5344cc9f9e243f38"
EXPECTED_RESCUE = "d1781a5a26f711f93ed2a2b3f6d1f82a2918c025eaf762dc07cff12adc30cb16"


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_json(name: str) -> dict[str, object]:
    return json.loads((CAP / name).read_text(encoding="utf-8"))


def main() -> int:
    text = DOC.read_text(encoding="utf-8")
    flat = " ".join(text.split())
    journal = (EXTRACTED / "r29.service.journal.txt").read_text(encoding="utf-8")
    inventory = (EXTRACTED / "exact-path-inventory.txt").read_text(encoding="utf-8")
    mount = (EXTRACTED / "device-and-mount.txt").read_text(encoding="utf-8")
    evidence = EXTRACTED / "nhm2-h2-p8p-evidence-v1"
    build = (evidence / "p8p-docker-build.txt").read_text(encoding="utf-8")
    p8q = json.loads((CAP / "p8q-audit.v1.json").read_text(encoding="utf-8"))
    source_vm = load_json("source-vm.final.json")
    source_disk = load_json("source-disk.final.json")
    snapshot = load_json("snapshot.final.json")
    clone = load_json("clone.final.json")
    helper = load_json("helper.final.json")
    helper_clone = next(
        disk for disk in helper["disks"]
        if disk["deviceName"] == "nhm2-h2-p8p-r29-evidence-clone"
    )
    checks = {
        "header": all(key in text for key in (
            "Program gate:", "Workstream:", "Capability or component:",
            "Current maturity:", "Target maturity:", "Required frozen inputs:",
            "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
            "Downstream gate unlocked:",
        )),
        "proposal_and_rescue_exact": sha(PROPOSAL) == EXPECTED_PROPOSAL and sha(RESCUE) == EXPECTED_RESCUE,
        "inspection_archive_exact": (
            sha(CAP / "nhm2-h2-p8p-r30-stopped-disk-inspection-v1.tgz")
            == "6f836f12d7230f9167dd541dd1b18d869285cb3d8fdb96ec105f1221f9eda048"
            and (CAP / "nhm2-h2-p8p-r30-stopped-disk-inspection-v1.tgz").stat().st_size == 10970
        ),
        "read_only_mount": all(value in mount for value in (
            "DEVICE_RO=1", "PARTITION=/dev/sdb1", "FILESYSTEM=ext4",
            "MOUNT_OPTIONS=ro,relatime,norecovery", "sdb1  part ext4",
        )),
        "exact_ingress_bound": all(value in inventory for value in (
            "236640768 home/dan/h2-p8p-r29-upload-v1.tar 3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5",
            "236492800 home/pestypig/h2-p8f-c2-r1-cloud-upload-v1.tar fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978",
            "134656 home/pestypig/h2-p8p-overlay-upload-v1.tar 4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e",
        )),
        "service_started_once": journal.count("Starting nhm2-h2-p8p-r29.service") == 1,
        "docker_install_depth": "COMMAND=/usr/bin/apt-get install -y docker.io" in journal and "COMMAND=/usr/bin/docker version" in journal,
        "controller_invoked": "h2_p8p_turnaround_calibration_cloud_run_v1.sh" in journal,
        "offline_build_terminal": all(value in journal for value in (
            "P8P_CONTROLLER_TERMINAL phase=offline_build exit=98",
            "Main process exited, code=exited, status=98/n/a",
        )),
        "build_failure_exact": all(value in build for value in (
            "Step 3/9 : FROM ${BUILDER_IMAGE} AS builder",
            "pull access denied for nhm2-g2h-s4-primary-fixture-builder",
        )),
        "loaded_images_exact": sha(evidence / "p8p-docker-load.txt") == "c77e7396a971b27f033927291ebbe6218ac25b787987f8c7a6f713dcbb48cd52",
        "evidence_phase_exact": (
            (evidence / "phase.txt").read_text().strip() == "preexecution"
            and (evidence / "terminal.phase.txt").read_text().strip() == "offline_build"
            and (evidence / "controller.exit.txt").read_text().strip() == "98"
        ),
        "no_container_metadata": (EXTRACTED / "docker-container-metadata-inventory.txt").read_bytes() == b"",
        "source_export_exact": (
            (EXTRACTED / "source-evidence-export.tgz").stat().st_size == 717
            and sha(EXTRACTED / "source-evidence-export.tgz") == "2833929eb141b4b96716832cd6e8c643cd160f72559282c7f9f226f617056269"
        ),
        "p8q_stopped": (
            p8q["audit_status"] == "FAIL" and p8q["checks_passed"] == 1
            and p8q["checks_total"] == 11
            and p8q["p8q_decision"] == "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED"
            and sha(CAP / "p8q-audit.v1.json") == "c41fd11cf9a12f34e56ac5a90a77b723eab177f440c9f71f040a29c3b4621d44"
        ),
        "source_retained": (
            source_vm["id"] == "4290604153416687194" and source_vm["status"] == "TERMINATED"
            and source_disk["id"] == "8031354852430290522" and source_disk["status"] == "READY"
        ),
        "derivatives_exact": (
            snapshot["id"] == "9195124078627223264" and snapshot["status"] == "READY"
            and snapshot["sourceDiskId"] == "8031354852430290522"
            and clone["id"] == "2144297777427347105" and clone["status"] == "READY"
            and clone["sourceSnapshotId"] == "9195124078627223264"
        ),
        "helper_stopped_clone_ro": (
            helper["id"] == "1281895389799610005" and helper["status"] == "TERMINATED"
            and helper_clone["mode"] == "READ_ONLY" and helper_clone["autoDelete"] is False
        ),
        "classification_exact": all(value in text for value in (
            "R30_CLASS_OFFLINE_BUILD_DIGEST_RESOLUTION_FAILURE",
            "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED",
            "no numerical execution occurred",
        )),
        "authority_locked": "physical, propulsion or transport authority remains false" in flat,
    }
    passed = sum(checks.values())
    result = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8p_r30_result_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "classification": "R30_CLASS_OFFLINE_BUILD_DIGEST_RESOLUTION_FAILURE",
        "p8q_decision": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED",
        "candidate_evaluations": 0,
        "numerical_executions": 0,
        "authority_promoted": False,
        "result_sha256": sha(DOC),
    }
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
