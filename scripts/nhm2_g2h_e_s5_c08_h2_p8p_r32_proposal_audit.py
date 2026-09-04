#!/usr/bin/env python3
"""Audit the P8P-R32 capacity-aware build-only fixture proposal."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
GUEST = G2H / "h2_p8p_r32_fresh_vm_binding_guest_v1.sh"
FIXTURE = G2H / "h2_p8p_r31_local_image_binding_fixture_v1.sh"
R31 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r31-capacity-result.md"
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r32-fresh-vm-binding-fixture-proposal.md"
OUT_DIR = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r32-proposal-v1-20260904"
OUT = OUT_DIR / "h2-p8p-r32-proposal-audit.v1.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    guest = GUEST.read_text(encoding="utf-8")
    packet = PACKET.read_text(encoding="utf-8")
    checks = {
        "r31_result_identity": sha256(R31) == "d292807131a059087a8a3858637c9ab23495a4bcfec664839e8afcacfc00f7bc",
        "r31_fixture_identity": sha256(FIXTURE) == "97c0209284fa67ee33e259a75abfef7947f1f8ce8971af3e7f39a3421ce07c79",
        "r32_guest_identity": sha256(GUEST) == "f66d2f72649c36f88c3e03134150967aadfba639f59781facfaa3ed6ccde9a19",
        "r32_guest_bytes": GUEST.stat().st_size == 3129,
        "required_packet_header": packet.startswith("Program gate:") and packet.splitlines()[9].startswith("Downstream gate unlocked:"),
        "fresh_source_and_evidence_roots": all(token in guest for token in ("r32-source-v1", "r32-ingress-v1", "r32-evidence-v1")),
        "all_roots_absent": '[[ ! -e "$source_root" && ! -e "$stage" && ! -e "$evidence" && ! -e "$export_path" ]]' in guest,
        "outer_archive_bound": "236640768" in guest and "3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5" in guest,
        "nested_archives_bound": "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978" in guest and "4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e" in guest,
        "base_before_overlay": guest.index('tar -xf "$stage/h2-p8f-c2-r1-cloud-upload-v1.tar"') < guest.index('tar -xf "$stage/h2-p8p-overlay-upload-v1.tar"'),
        "docker_install_narrow": "command -v docker" in guest and "apt-get install -y docker.io" in guest,
        "fixture_invoked_once": guest.count('bash "$fixture"') == 1,
        "fixture_pass_required": "R31_FIXTURE_PASS" in guest,
        "deterministic_evidence": "--sort=name --mtime='UTC 2026-09-04' --owner=0 --group=0 --numeric-owner" in guest,
        "automatic_stop": "sudo shutdown -h now" in guest,
        "no_panel_or_thread_argument": "--panels" not in guest and "--threads" not in guest,
        "no_candidate_surface": all(token not in guest for token in ("positive_parameter", "candidate_root", "frozen_candidate")),
        "resource_shape_frozen": all(token in packet for token in ("e2-standard-4", "us-east1-b", "30 GB `pd-standard`", "debian-12-bookworm-v20260817")),
        "cost_runtime_frozen": "3,600 aggregate seconds" in packet and "`$1.00`" in packet,
        "one_process_bounds": "exactly one each" in packet and "first failure is terminal" in packet,
        "p8q_stopped": "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in packet,
        "authority_false": "all authority remains false" in packet,
    }
    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8p_r32_proposal_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "checks": checks,
        "failed": failed,
        "proposal_sha256": sha256(PACKET),
        "cloud_actions": 0,
        "fixture_executions": 0,
        "numerical_runs": 0,
        "candidate_evaluated": False,
        "authority_promoted": False,
    }
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{payload['status']} {payload['checks_passed']}/{payload['checks_total']}")
    print(sha256(OUT))
    print(payload["proposal_sha256"])
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())

