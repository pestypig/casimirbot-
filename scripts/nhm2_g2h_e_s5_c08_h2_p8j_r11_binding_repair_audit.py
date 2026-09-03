#!/usr/bin/env python3
"""Independently audit the candidate-neutral P8J-R11 offline binding repair."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
CONTROLLER = G2H / "h2_p8j_cloud_run_v2.sh"
R9_CONTROLLER = G2H / "h2_p8j_cloud_run_v1.sh"
ORCHESTRATOR = G2H / "h2_p8j_r11_cloudshell_orchestrator_v1.sh"
FIXTURE_DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-h2-p8i-selector-slot3-attribution-fixture.v1"
TARGET_DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-h2-p8j-representative-attribution.v1"
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r11-offline-binding-repair-successor.md"
R10_AUDIT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r10-stopped-disk-recovery-v1-20260901/h2-p8j-r10-recovery-result-audit.v1.json"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r11-binding-repair-v1-20260901"
AUDIT = OUT / "h2-p8j-r11-binding-repair-audit.v1.json"

EXPECTED = {
    "r9_controller": "4b8f5722c885980bb0fbac3602ecf36436a66ff1141e4776168f3bbef86276e6",
    "controller": "867f4b20a9d81d00b9bab16d99865470b70ea22d8a02fd2735901b2ad7097a01",
    "orchestrator": "cbb7682ac579585e818e2dbca0cf6ee2e5c2970de0834818d30ef06a5a16340a",
    "proposal": "0faf89026ab92df26aecb42510d7a414c504a21dbb5bc1c075e25e7b5d80f541",
    "fixture_dockerfile": "134619ec451b0759eca25440869b3225c3923bdbb6fb0d5a0c00eefe58c4f4a2",
    "target_dockerfile": "43a3adc4c70dfffcf454e6710ce1b6481d37362860400149032a9737bd7d6cd1",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    text = CONTROLLER.read_text(encoding="utf-8")
    r10 = json.loads(R10_AUDIT.read_text(encoding="utf-8"))
    checks = {
        "r9_controller_identity_preserved": sha256(R9_CONTROLLER) == EXPECTED["r9_controller"],
        "r11_controller_identity_exact": sha256(CONTROLLER) == EXPECTED["controller"],
        "r11_orchestrator_identity_exact": sha256(ORCHESTRATOR) == EXPECTED["orchestrator"],
        "r11_proposal_identity_exact": sha256(PROPOSAL) == EXPECTED["proposal"],
        "fixture_definition_unchanged": sha256(FIXTURE_DOCKERFILE) == EXPECTED["fixture_dockerfile"],
        "target_definition_unchanged": sha256(TARGET_DOCKERFILE) == EXPECTED["target_dockerfile"],
        "r10_recovery_audit_pass": r10.get("status") == "PASS" and r10.get("checks_passed") == 16,
        "r10_blocker_environment_build": r10.get("terminal_classification") == "environment/build",
        "local_tags_absent_before_load": "fail builder_tag_preexisted" in text and "fail runtime_tag_preexisted" in text,
        "loaded_builder_identity_bound": all(token in text for token in (
            "BUILDER_MANIFEST=sha256:9e94d19f", "BUILDER_CONFIG=sha256:540d7039",
            'case "$BUILDER_BEFORE" in "$BUILDER_MANIFEST"|"$BUILDER_CONFIG")')),
        "loaded_runtime_identity_bound": all(token in text for token in (
            "RUNTIME_MANIFEST=sha256:8334e977", "RUNTIME_CONFIG=sha256:17043e9f",
            'case "$RUNTIME_BEFORE" in "$RUNTIME_MANIFEST"|"$RUNTIME_CONFIG")')),
        "offline_build_args_fixture": text.count('--build-arg "BUILDER_IMAGE=$BUILDER_TAG" --build-arg "RUNTIME_IMAGE=$RUNTIME_TAG"') == 2,
        "pull_and_network_disabled_twice": text.count("DOCKER_BUILDKIT=0 docker build --network=none --pull=false") == 2,
        "base_identity_stability_checked": "fail builder_identity_changed" in text and "fail runtime_identity_changed" in text,
        "fixture_binary_identity_unchanged": "EXPECTED_FIXTURE_SHA=445e6a277c4071abd73beec61fcac317e1b8048dd0e54439e9157cd94f504ab2" in text,
        "target_binary_identity_unchanged": "EXPECTED_TARGET_SHA=d40c6e51988c30d89f8cd824e41f855e56acdb4e40f0bb0a24cf0e88721de9d6" in text,
        "result_audit_identity_unchanged": "EXPECTED_AUDIT_SHA=5a3cfc0d1413353c7ee6f9050bc8b2305d23383fd0746559cd51b53f3454cab2" in text,
        "numerical_timeout_unchanged": "TIMEOUT_SECONDS=86400" in text,
        "candidate_neutral_container_unchanged": "--network none --read-only --cap-drop ALL" in text and "--cpus 32" in text,
        "no_candidate_or_authority_surface": all(token not in text for token in (
            "positive_parameter", "candidate_root", "authority_promoted=true", "G3", "SI-v2")),
        "single_bounded_cloud_process": "--count=1 --min-count=1" in ORCHESTRATOR.read_text(encoding="utf-8")
        and "--max-run-duration=25h" in ORCHESTRATOR.read_text(encoding="utf-8")
        and ORCHESTRATOR.read_text(encoding="utf-8").count("systemctl start --no-block") == 1,
    }
    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8j_r11_binding_repair_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "checks": checks,
        "failed": failed,
        "controller_sha256": sha256(CONTROLLER),
        "repair_scope": "offline base-image runtime binding only",
        "scientific_definitions_changed": False,
        "numerical_runs": 0,
        "candidate_evaluated": False,
        "authority_promoted": False,
    }
    OUT.mkdir(parents=True, exist_ok=True)
    AUDIT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{payload['status']} {payload['checks_passed']}/{payload['checks_total']}")
    print(sha256(AUDIT))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
