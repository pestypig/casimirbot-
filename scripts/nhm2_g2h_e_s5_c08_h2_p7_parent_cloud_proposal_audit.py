#!/usr/bin/env python3
"""Independent inert audit for the H2-P7 parent cloud proposal."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import tarfile


ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p7-parent-cloud-preflight-v1-20260827"
ARCHIVE = OUT / "h2-p7-parent-upload-r1.tar"
MANIFEST = OUT / "h2-p7-parent-source-manifest.r1.json"
PREFLIGHT = OUT / "h2-p7-parent-preflight.r1.json"
PROPOSAL = OUT / "h2-p7-parent-cloud-proposal.r1.json"
AUDIT = OUT / "h2-p7-parent-cloud-proposal-audit.r1.json"
EXPECTED_ARCHIVE_SHA256 = "9c2a6af7f470e15329741ed0a0210f1519ce12b8fe8ec808f02001a21a18f1f5"
EXPECTED_MANIFEST_SHA256 = "d20e0f8e550c5a7e71070e2445df05f5e49b15594f4de6cc062e7dabafff9d5f"
EXPECTED_PROPOSAL_SHA256 = "3f15f387c95079d2049f346e260cd8b31e51732ea903b06ae11f8feb0eabfdc3"
EXPECTED_BINARY_SHA256 = "e6dfc3409a83504143b12cfdf023aa42318d89579d33275fd59643cc69788f56"
IMAGE = "nhm2-g2h-e-s5-h2-parent-p7:r1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-h2-parent-p7-r1"
PROTECTED = (
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
    "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
    "artifacts/nhm2/g2h-e-s5/executions",
)


def sha(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> int:
    checks: dict[str, bool] = {}
    preflight = json.loads(PREFLIGHT.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    proposal = json.loads(PROPOSAL.read_text(encoding="utf-8"))
    checks.update({
        "producer_preflight_12_of_12": preflight.get("status") == "PASS" and preflight.get("checks_passed") == preflight.get("checks_total") == 12,
        "archive_hash_exact": sha(ARCHIVE) == EXPECTED_ARCHIVE_SHA256,
        "archive_size_exact": ARCHIVE.stat().st_size == 236318720,
        "manifest_hash_exact": sha(MANIFEST) == EXPECTED_MANIFEST_SHA256,
        "proposal_hash_exact": sha(PROPOSAL) == EXPECTED_PROPOSAL_SHA256,
        "proposal_status_inert": proposal.get("status") == "FROZEN_INERT_AWAITING_SEPARATE_AUTHORIZATION",
        "resource_name_exact": proposal["resource"]["name"] == "nhm2-h2-p7-parent-c4-16-20260827",
        "resource_shape_exact": proposal["resource"]["zone"] == "us-central1-a" and proposal["resource"]["machine_type"] == "c4-standard-16" and proposal["resource"]["provisioning_model"] == "STANDARD",
        "disk_shape_exact": proposal["resource"]["boot_disk_gb"] == 30 and proposal["resource"]["boot_disk_type"] == "hyperdisk-balanced",
        "runtime_ceiling_exact": proposal["resource"]["aggregate_vm_runtime_ceiling_seconds"] == 108000,
        "process_timeout_inside_vm_ceiling": proposal["execution"]["external_timeout_seconds"] == 100800 < proposal["resource"]["aggregate_vm_runtime_ceiling_seconds"],
        "cost_ceiling_covers_runtime": proposal["resource"]["planning_compute_rate_usd_per_hour"] * proposal["resource"]["aggregate_vm_runtime_ceiling_seconds"] / 3600 <= proposal["resource"]["total_cost_ceiling_usd"],
        "single_process_only": proposal["execution"]["process_count"] == 1,
        "selector_threads_exact": proposal["execution"]["selector_thread_count"] == 16,
        "retry_and_retune_false": proposal["execution"]["retry_allowed"] is False and proposal["execution"]["retune_allowed"] is False,
        "upload_exact": proposal["upload"]["entries"] == 44 and proposal["upload"]["bytes"] == ARCHIVE.stat().st_size and proposal["upload"]["sha256"] == EXPECTED_ARCHIVE_SHA256,
        "additional_upload_forbidden": proposal["upload"]["additional_uploads_allowed"] is False,
        "manifest_runtime_matches": manifest["runtime_binding"]["selector_threads"] == 16 and manifest["runtime_binding"]["full_selector_invocations"] == 2,
        "binary_binding_exact": proposal["build"]["required_binary_sha256"] == manifest["required_binary_sha256"] == EXPECTED_BINARY_SHA256,
        "offline_build_only": proposal["build"]["pull"] is False and proposal["build"]["network"] == "none",
        "all_authority_false": all(value is False for value in manifest["authority"].values()),
        "protected_roots_absent": all(not (ROOT / path).exists() for path in PROTECTED),
        "no_cloud_or_numerical_action": preflight.get("cloud_actions") == 0 and preflight.get("numerical_runs") == 0 and preflight.get("full_selector_executed") is False,
    })
    with tarfile.open(ARCHIVE, "r") as archive:
        names = archive.getnames()
        checks["archive_has_44_unique_members"] = len(names) == len(set(names)) == 44
        checks["archive_paths_safe"] = all(not pathlib.PurePosixPath(name).is_absolute() and ".." not in pathlib.PurePosixPath(name).parts for name in names)
        checks["guard_and_parent_sources_present"] = all(name in names for name in manifest["inventory_lineage"]["additive_entries"])

    executable = subprocess.run(
        ["docker", "run", "--rm", "--network", "none", "--entrypoint", "sha256sum", IMAGE, EXECUTABLE],
        cwd=ROOT, check=False, capture_output=True, text=True,
    )
    observed_binary = executable.stdout.strip().split()[0] if executable.returncode == 0 else ""
    checks["local_binary_replay_exact"] = observed_binary == EXPECTED_BINARY_SHA256

    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p7_parent_cloud_proposal_audit.r1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": len(checks) - len(failed),
        "checks_total": len(checks),
        "checks": checks,
        "failed": failed,
        "proposal_sha256": EXPECTED_PROPOSAL_SHA256,
        "archive_sha256": EXPECTED_ARCHIVE_SHA256,
        "manifest_sha256": EXPECTED_MANIFEST_SHA256,
        "binary_sha256": observed_binary,
        "cloud_actions": 0,
        "numerical_runs": 0,
        "full_selector_executed": False,
        "frozen_candidate_evaluated": False,
        "authority_promoted": False,
    }
    AUDIT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{payload['checks_passed']}/{payload['checks_total']} {payload['status']}")
    print(sha(AUDIT))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
