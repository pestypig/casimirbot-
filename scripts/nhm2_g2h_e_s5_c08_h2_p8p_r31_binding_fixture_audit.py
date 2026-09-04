#!/usr/bin/env python3
"""Audit the inert P8P-R31 local-image binding fixture definition."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
FIXTURE = G2H / "h2_p8p_r31_local_image_binding_fixture_v1.sh"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-h2-p8p-turnaround-calibration.v1"
R30 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r30-stopped-disk-inspection-result.md"
P8J_REPAIR = G2H / "h2_p8j_cloud_run_v2.sh"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r31-binding-fixture-v1-20260904"
RECEIPT = OUT / "h2-p8p-r31-binding-fixture-definition-audit.v1.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    text = FIXTURE.read_text(encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    precedent = P8J_REPAIR.read_text(encoding="utf-8")
    checks = {
        "r30_result_identity": sha256(R30) == "ba4dffb9135042a39816925dc3f2861de4e86d9101a7e0e90ed1a6627087bd0c",
        "immutable_dockerfile_identity": sha256(DOCKERFILE) == "1159828fb3a7b69f9b75ecde002b27e6c1442e4c28630c05433559bc8986b570",
        "dockerfile_still_digest_qualified": dockerfile.count("@sha256:") == 2,
        "fixture_uses_build_arg_override": text.count("--build-arg") == 2,
        "builder_local_tag_exact": "builder_tag=nhm2-g2h-s4-primary-fixture-builder:v2" in text,
        "runtime_local_tag_exact": "runtime_tag=nhm2-g2h-primary-proof:v2" in text,
        "builder_manifest_bound": "builder_manifest=sha256:9e94d19f9014938b510e95c776778d164cce120777adfc2d495c1812de5221a1" in text,
        "builder_config_bound": "builder_config=sha256:540d7039743d1fa2d285c2ec2570fef20954339fcb0a48453f187cf80c0c304c" in text,
        "runtime_manifest_bound": "runtime_manifest=sha256:8334e9777fd7cb9405d8878b243d0196f3e45d9d51d82df159452dcb430159ab" in text,
        "runtime_config_bound": "runtime_config=sha256:17043e9f1891cb2026c3a959de47af3d5c75ed9918d32e44455148dfaff2057e" in text,
        "base_archive_bound": "expected_archive=4645ef9f0028a4ae58601a73d8d7cf7cb8f2316578a318ce6ce2257b103624f1" in text,
        "binary_bound": "expected_binary=7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718" in text,
        "fresh_tags_required": all(token in text for token in ("builder_tag_preexisted", "runtime_tag_preexisted", "target_image_preexisted")),
        "empty_repo_digests_required": "builder_repo_digests" in text and "runtime_repo_digests" in text and text.count("== '[]'") == 2,
        "offline_build_only": "docker build --pull=false --network=none" in text,
        "classic_builder_forced": "DOCKER_BUILDKIT=0" in text,
        "base_identity_stability": "builder_identity_changed" in text and "runtime_identity_changed" in text,
        "binary_read_is_sandboxed": "docker run --rm --network=none --read-only --cap-drop=ALL" in text,
        "no_calibration_execution": "--panels" not in text and "--threads" not in text and "timeout --signal" not in text,
        "no_cloud_or_resource_action": all(token not in text for token in ("gcloud", "instances create", "bulk create", "shutdown -h")),
        "no_candidate_surface": all(token not in text for token in ("positive_parameter", "candidate_root", "frozen_candidate")),
        "known_repair_pattern_matches": all(token in precedent for token in (
            '--build-arg "BUILDER_IMAGE=$BUILDER_TAG"',
            '--build-arg "RUNTIME_IMAGE=$RUNTIME_TAG"',
            "DOCKER_BUILDKIT=0 docker build --network=none --pull=false",
        )),
    }
    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8p_r31_binding_fixture_definition_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "checks": checks,
        "failed": failed,
        "fixture_sha256": sha256(FIXTURE),
        "repair_scope": "candidate-neutral offline local-image digest resolution only",
        "fixture_executions": 0,
        "numerical_runs": 0,
        "candidate_evaluated": False,
        "authority_promoted": False,
    }
    OUT.mkdir(parents=True, exist_ok=True)
    RECEIPT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{payload['status']} {payload['checks_passed']}/{payload['checks_total']}")
    print(sha256(RECEIPT))
    print(payload["fixture_sha256"])
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())

