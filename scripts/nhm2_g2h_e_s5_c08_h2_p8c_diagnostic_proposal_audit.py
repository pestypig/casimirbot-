#!/usr/bin/env python3
"""Independent inert audit for the H2-P8C diagnostic proposal."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import tarfile


ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-diagnostic-cloud-preflight-v1-20260828"
ARCHIVE = OUT / "h2-p8c-diagnostic-upload-v1.tar"
MANIFEST = OUT / "h2-p8c-diagnostic-source-manifest.v1.json"
PROPOSAL = OUT / "h2-p8c-diagnostic-cloud-proposal.v1.json"
PREFLIGHT = OUT / "h2-p8c-diagnostic-preflight.v1.json"
AUDIT = OUT / "h2-p8c-diagnostic-proposal-independent-audit.r2.v1.json"
EXPECTED_ARCHIVE = "f0a0fabf608949d6755465ddc8f35075631818f383d6ba5eb78ab297152d3c4c"
EXPECTED_MANIFEST = "78fdff467f3ededee3a18be0d6c2f94176a90b65b9e94da140f701f95d2fd868"
EXPECTED_PROPOSAL = "7e8f28d755b5dea7cc212c4d0fda263a84374215680b0a94a179fbb2fbca2ace"
EXPECTED_BINARY = "7e7d78393f933ac103208476f6e8c5beefb5de66b58d93a6b2a080bdf80deb25"
BUILDER = "nhm2-g2h-s4-primary-fixture-builder:v2"
ALLOWED_BUILDER_IDS = {
    "sha256:9e94d19f9014938b510e95c776778d164cce120777adfc2d495c1812de5221a1",
    "sha256:540d7039743d1fa2d285c2ec2570fef20954339fcb0a48453f187cf80c0c304c",
}
ALLOWED_RUNTIME_IDS = {
    "sha256:8334e9777fd7cb9405d8878b243d0196f3e45d9d51d82df159452dcb430159ab",
    "sha256:17043e9f1891cb2026c3a959de47af3d5c75ed9918d32e44455148dfaff2057e",
}
PROTECTED = (
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
    "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
    "artifacts/nhm2/g2h-e-s5/executions",
)
COMPILE = " " .join([
    "g++ -std=c++20 -O2 -fno-fast-math -fno-common -Wall -Wextra -Werror -pthread -o /tmp/p8c",
    "/src/mini_boson_star_primary_grid_v1.cpp",
    "/src/mini_boson_star_primary_c08_identity_v1.cpp",
    "/src/mini_boson_star_primary_c08_margins_v1.cpp",
    "/src/mini_boson_star_primary_c08_gevrey_v1.cpp",
    "/src/mini_boson_star_primary_c08_convolution_ledger_v1.cpp",
    "/src/mini_boson_star_primary_c08_convolution_bivariate_v1.cpp",
    "/src/mini_boson_star_primary_c08_convolution_jet_v1.cpp",
    "/src/mini_boson_star_primary_c08_convolution_selector_v1.cpp",
    "/src/mini_boson_star_primary_c08_origin_models_v1.cpp",
    "/src/mini_boson_star_primary_c08_successor_panel_v1.cpp",
    "/src/mini_boson_star_primary_c08_scalar_ledger_provider_v1.cpp",
    "/src/mini_boson_star_primary_c08_h2_ledger_v1.cpp",
    "/src/mini_boson_star_primary_c08_h2_p8c_diagnostic_run_v1.cpp",
    "-lflint-arb -lflint -lgmp -lmpfr -lm && sha256sum /tmp/p8c",
])


def sha(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def inspect_image(tag: str) -> str:
    result = subprocess.run(
        ["docker", "image", "inspect", tag, "--format", "{{.Id}}"],
        cwd=ROOT, check=False, capture_output=True, text=True,
    )
    return result.stdout.strip() if result.returncode == 0 else ""


def main() -> int:
    if AUDIT.exists():
        raise SystemExit("immutable audit output already exists")
    preflight = json.loads(PREFLIGHT.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    proposal = json.loads(PROPOSAL.read_text(encoding="utf-8"))
    checks: dict[str, bool] = {
        "producer_preflight_13_of_13": preflight.get("status") == "PASS" and preflight.get("checks_passed") == preflight.get("checks_total") == 13,
        "archive_hash_exact": sha(ARCHIVE) == EXPECTED_ARCHIVE,
        "manifest_hash_exact": sha(MANIFEST) == EXPECTED_MANIFEST,
        "proposal_hash_exact": sha(PROPOSAL) == EXPECTED_PROPOSAL,
        "preflight_bindings_exact": preflight.get("archive_sha256") == EXPECTED_ARCHIVE and preflight.get("manifest_sha256") == EXPECTED_MANIFEST and preflight.get("proposal_sha256") == EXPECTED_PROPOSAL,
        "status_inert": proposal.get("status") == "FROZEN_INERT_AWAITING_SEPARATE_AUTHORIZATION",
        "resource_exact": proposal["resource"]["name"] == "nhm2-h2-p8c-diagnostic-c4-16-20260828" and proposal["resource"]["zone"] == "us-central1-a" and proposal["resource"]["machine_type"] == "c4-standard-16",
        "disk_exact": proposal["resource"]["boot_disk_gb"] == 30 and proposal["resource"]["boot_disk_type"] == "hyperdisk-balanced",
        "runtime_ceiling_exact": proposal["resource"]["aggregate_vm_runtime_ceiling_seconds"] == 54000,
        "timeout_inside_ceiling": proposal["execution"]["external_timeout_seconds"] == 50400 < proposal["resource"]["aggregate_vm_runtime_ceiling_seconds"],
        "cost_ceiling_sufficient": proposal["resource"]["planning_compute_rate_usd_per_hour"] * proposal["resource"]["aggregate_vm_runtime_ceiling_seconds"] / 3600 <= proposal["resource"]["total_cost_ceiling_usd"],
        "single_process_only": proposal["execution"]["process_count"] == 1,
        "threads_exact": proposal["execution"]["selector_thread_count"] == 16,
        "parent_sequence_exact": proposal["execution"]["expected_parent_sequence"] == ["scalar_initialize", "h2_initialize", "scalar_extend", "h2_extend"],
        "schemas_exact": proposal["execution"]["expected_result_schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_diagnostic_run.v1" and proposal["execution"]["expected_diagnostic_schema"] == "nhm2.g2h_e_s5.c08_h2_p8b_parent_diagnostic.v1",
        "retry_retune_root_false": proposal["execution"]["retry_allowed"] is False and proposal["execution"]["retune_allowed"] is False and proposal["execution"]["alternate_output_root_allowed"] is False,
        "upload_exact": proposal["upload"]["entries"] == 47 and proposal["upload"]["sha256"] == EXPECTED_ARCHIVE and proposal["upload"]["manifest_sha256"] == EXPECTED_MANIFEST and proposal["upload"]["bytes"] == ARCHIVE.stat().st_size,
        "additional_upload_forbidden": proposal["upload"]["additional_uploads_allowed"] is False,
        "offline_build_only": proposal["build"]["pull"] is False and proposal["build"]["network"] == "none",
        "binary_binding_exact": proposal["build"]["required_binary_sha256"] == manifest["required_binary_sha256"] == EXPECTED_BINARY,
        "evidence_root_absent_contract": proposal["evidence"]["root_must_be_absent_before_authorized_execution"] is True and proposal["evidence"]["remote_root"] == "/home/pestypig/nhm2-h2-p8c-evidence-v1",
        "result_audit_required": proposal["evidence"]["independent_result_audit_required"] is True,
        "authority_all_false": all(value is False for value in manifest["authority"].values()),
        "forbidden_all_true": all(value is True for value in proposal["forbidden"].values()),
        "protected_roots_absent": all(not (ROOT / path).exists() for path in PROTECTED),
        "no_cloud_or_numerical_action": preflight.get("cloud_actions") == 0 and preflight.get("numerical_runs") == 0,
        "candidate_and_authority_false": preflight.get("frozen_candidate_evaluated") is False and preflight.get("authority_promoted") is False,
        "builder_identity_pinned": inspect_image(BUILDER) in ALLOWED_BUILDER_IDS,
        "runtime_identity_pinned": inspect_image("nhm2-g2h-primary-proof:v2") in ALLOWED_RUNTIME_IDS,
    }
    files = {item["path"]: item for item in manifest["files"]}
    checks["manifest_46_unique_plus_base_archive"] = len(files) == 46
    checks["manifest_sources_match_workspace"] = all(
        (ROOT / path).is_file() and sha(ROOT / path) == item["sha256"] and (ROOT / path).stat().st_size == item["bytes"]
        for path, item in files.items()
    )
    with tarfile.open(ARCHIVE, "r") as archive:
        names = archive.getnames()
        checks["archive_47_unique"] = len(names) == len(set(names)) == 47
        checks["archive_paths_safe"] = all(not pathlib.PurePosixPath(name).is_absolute() and ".." not in pathlib.PurePosixPath(name).parts for name in names)
        checks["archive_inventory_matches_manifest_plus_base_archive"] = (
            set(names) == set(files) | {manifest["pinned_base_images_archive"]["path"]}
        )
        checks["diagnostic_members_present"] = all(name in names for name in manifest["inventory_lineage"]["replacement_entries"] + manifest["inventory_lineage"]["additive_entries"])

    source = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
    replay = subprocess.run(
        ["docker", "run", "--rm", "--network", "none", "-v", f"{source}:/src:ro", "--entrypoint", "/bin/sh", BUILDER, "-c", COMPILE],
        cwd=ROOT, check=False, capture_output=True, text=True,
    )
    observed_binary = replay.stdout.strip().split()[0] if replay.returncode == 0 else ""
    checks["independent_binary_replay_exact"] = observed_binary == EXPECTED_BINARY

    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8c_diagnostic_proposal_independent_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": len(checks) - len(failed),
        "checks_total": len(checks),
        "checks": checks,
        "failed": failed,
        "proposal_sha256": EXPECTED_PROPOSAL,
        "archive_sha256": EXPECTED_ARCHIVE,
        "manifest_sha256": EXPECTED_MANIFEST,
        "binary_sha256": observed_binary,
        "cloud_actions": 0,
        "numerical_runs": 0,
        "frozen_candidate_evaluated": False,
        "authority_promoted": False,
    }
    AUDIT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{payload['checks_passed']}/{payload['checks_total']} {payload['status']}")
    print(sha(AUDIT))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
