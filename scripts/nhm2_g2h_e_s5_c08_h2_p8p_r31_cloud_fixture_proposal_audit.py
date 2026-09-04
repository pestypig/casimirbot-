#!/usr/bin/env python3
"""Audit the frozen P8P-R31 retained-VM build-only fixture proposal."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
FIXTURE = G2H / "h2_p8p_r31_local_image_binding_fixture_v1.sh"
GUEST = G2H / "h2_p8p_r31_clean_daemon_guest_v1.sh"
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r31-local-image-binding-fixture.md"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r31-binding-fixture-v1-20260904"
RECEIPT = OUT / "h2-p8p-r31-cloud-fixture-proposal-audit.v1.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    guest = GUEST.read_text(encoding="utf-8")
    packet = PACKET.read_text(encoding="utf-8")
    checks = {
        "fixture_identity": sha256(FIXTURE) == "97c0209284fa67ee33e259a75abfef7947f1f8ce8971af3e7f39a3421ce07c79",
        "required_packet_header": packet.startswith("Program gate:") and all(any(line.startswith(label) for line in packet.splitlines()[:10]) for label in (
            "Workstream:", "Capability or component:", "Current maturity:", "Target maturity:",
            "Required frozen inputs:", "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
            "Downstream gate unlocked:",
        )),
        "retained_source_root_exact": "source_root=/home/pestypig/nhm2-h2-p8p-source-v1" in guest,
        "new_evidence_paths": "nhm2-h2-p8p-r31-evidence-v1" in guest and "nhm2-h2-p8p-r31-evidence-export-v1.tgz" in guest,
        "clean_data_root_absence": "data_root_absence" in guest and "nhm2-h2-p8p-r31-docker-v1" in guest,
        "clean_socket_absence": "socket_dir_absence" in guest,
        "isolated_daemon": all(token in guest for token in ("--data-root", "--exec-root", "--storage-driver=vfs", "--iptables=false", "--bridge=none")),
        "bounded_daemon_wait": "seq 1 60" in guest,
        "fixture_invoked_once": guest.count('bash "$fixture"') == 1,
        "fixture_hash_rechecked": "expected_fixture=97c0209284fa67ee33e259a75abfef7947f1f8ce8971af3e7f39a3421ce07c79" in guest,
        "deterministic_archive": "--sort=name --mtime='UTC 2026-09-04' --owner=0 --group=0 --numeric-owner" in guest,
        "daemon_cleanup": "trap cleanup EXIT" in guest and 'sudo kill "$daemon_pid"' in guest,
        "no_numerical_arguments": all(token not in guest for token in ("--panels", "--threads", "--max-exponent", "timeout --signal")),
        "no_cloud_inside_guest": "gcloud" not in guest,
        "no_candidate_surface": all(token not in guest for token in ("positive_parameter", "candidate_root", "frozen_candidate")),
        "no_authority_promotion": all(token not in guest for token in ("authority_promoted=true", "lamp=true", "physical_viability=true")),
        "packet_freezes_retained_vm": "nhm2-h2-p8p-r26-c2d-32-20260903" in packet and "4290604153416687194" in packet,
        "packet_cost_runtime_bounded": "$1.00" in packet and "1,800-second" in packet,
        "packet_one_restart": "exactly one restart" in packet,
        "packet_build_only": "build-only" in packet and "no P=1024" in packet,
        "first_failure_terminal": "First failure is\nterminal" in packet or "First failure is terminal" in packet,
        "automatic_stop": "stops the VM" in packet or "stop the VM" in packet,
    }
    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8p_r31_cloud_fixture_proposal_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "checks": checks,
        "failed": failed,
        "fixture_sha256": sha256(FIXTURE),
        "guest_sha256": sha256(GUEST),
        "packet_sha256": sha256(PACKET),
        "cloud_actions": 0,
        "numerical_runs": 0,
        "candidate_evaluated": False,
        "authority_promoted": False,
    }
    OUT.mkdir(parents=True, exist_ok=True)
    RECEIPT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{payload['status']} {payload['checks_passed']}/{payload['checks_total']}")
    print(sha256(RECEIPT))
    print(payload["guest_sha256"])
    print(payload["packet_sha256"])
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
