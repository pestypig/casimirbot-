#!/usr/bin/env python3
"""Independent inert audit of the H2-P7 evidence-retrieval proposal."""

from __future__ import annotations

import hashlib
import json
from collections import OrderedDict
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p7-evidence-retrieval-preflight-v1-20260828"
PROPOSAL = OUT / "h2-p7-evidence-retrieval-proposal.v1.json"
AUDIT = OUT / "h2-p7-evidence-retrieval-proposal-independent-audit.v1.json"
EXPECTED_PROPOSAL_SHA256 = "3c581eb9abb9205a520f75f0eb5196a63afd257786a5cc0a7528d6f8e451ee25"
EXPECTED_PARENT_PROPOSAL = "3f15f387c95079d2049f346e260cd8b31e51732ea903b06ae11f8feb0eabfdc3"
EXPECTED_ARCHIVE = "9c2a6af7f470e15329741ed0a0210f1519ce12b8fe8ec808f02001a21a18f1f5"
EXPECTED_MANIFEST = "d20e0f8e550c5a7e71070e2445df05f5e49b15594f4de6cc062e7dabafff9d5f"
EXPECTED_BINARY = "e6dfc3409a83504143b12cfdf023aa42318d89579d33275fd59643cc69788f56"
PROTECTED = (
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
    "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
    "artifacts/nhm2/g2h-e-s5/executions",
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> int:
    payload = json.loads(PROPOSAL.read_text(encoding="utf-8"))
    predecessor = payload["predecessor"]
    resource = payload["observed_stopped_resource"]
    retrieval = payload["retrieval"]
    forbidden = payload["forbidden_actions"]
    required = payload["required_capture"]
    checks: OrderedDict[str, bool] = OrderedDict()
    checks["proposal_hash_exact"] = sha256(PROPOSAL) == EXPECTED_PROPOSAL_SHA256
    checks["proposal_is_inert"] = payload["status"] == "FROZEN_INERT_AWAITING_SEPARATE_AUTHORIZATION"
    checks["parent_bindings_exact"] = (
        predecessor["proposal_sha256"] == EXPECTED_PARENT_PROPOSAL
        and predecessor["archive_sha256"] == EXPECTED_ARCHIVE
        and predecessor["manifest_sha256"] == EXPECTED_MANIFEST
        and predecessor["binary_sha256"] == EXPECTED_BINARY
    )
    checks["resource_identity_exact"] = (
        resource["project"] == "dark-stratum-455714-h4"
        and resource["name"] == "nhm2-h2-p7-parent-c4-16-20260827"
        and resource["zone"] == "us-central1-a"
        and resource["machine_type"] == "c4-standard-16"
        and resource["provisioning_model"] == "STANDARD"
    )
    checks["retained_disk_exact"] = (
        resource["boot_disk_gb"] == 30
        and resource["boot_disk_type"] == "hyperdisk-balanced"
        and resource["instance_status"] == "TERMINATED"
        and resource["disk_status"] == "READY"
    )
    stopped = datetime.fromisoformat(resource["last_stop_timestamp_raw"])
    ceiling = datetime.fromisoformat(resource["scheduled_ceiling_shutdown_utc"].replace("Z", "+00:00"))
    checks["observed_stop_precedes_ceiling"] = resource["stopped_before_scheduled_ceiling"] is True and stopped < ceiling
    checks["one_restart_only"] = retrieval["restart_attempts"] == 1
    checks["runtime_ceiling_exact"] = retrieval["aggregate_vm_runtime_ceiling_seconds"] == 1200
    projected_cost = retrieval["planning_compute_rate_usd_per_hour"] * retrieval["aggregate_vm_runtime_ceiling_seconds"] / 3600
    checks["cost_ceiling_covers_runtime"] = projected_cost <= retrieval["total_cost_ceiling_usd"] == 0.30
    checks["source_and_archive_paths_exact"] = (
        retrieval["source_directory"] == "/home/pestypig/nhm2-h2-p7-evidence-v1"
        and retrieval["vm_archive"] == "/home/pestypig/nhm2-h2-p7-terminal-evidence-export-v1.tgz"
        and retrieval["cloud_shell_archive"] == "/home/pestypig/nhm2-h2-p7-terminal-evidence-export-v1.tgz"
    )
    checks["archive_is_additive_deterministic"] = (
        retrieval["archive_creation"] == "deterministic_tar_sorted_mtime_zero_owner_zero_piped_to_gzip_n"
        and retrieval["archive_must_be_absent_before_creation"] is True
        and retrieval["source_files_are_read_only"] is True
    )
    checks["copy_then_stop_and_retain"] = (
        retrieval["copy_to_cloud_shell"] is True
        and retrieval["download_to_local_workspace"] is True
        and retrieval["stop_after_copy"] is True
        and retrieval["retain_vm_disk_logs_and_evidence"] is True
    )
    checks["zero_numerical_build_upload_actions"] = (
        forbidden["numerical_processes"] == 0
        and forbidden["builds"] == 0
        and forbidden["additional_uploads"] == 0
    )
    checks["runtime_reentry_forbidden"] = forbidden["docker_start_or_run"] is True and forbidden["systemd_parent_service_start"] is True
    checks["scientific_and_evidence_mutations_forbidden"] = all(
        forbidden[key] is True
        for key in (
            "source_file_mutation", "retry_or_retune", "frozen_candidate_evaluation",
            "positive_sampling", "candidate_or_scientific_root_creation",
            "scientific_handler_linkage", "rust_g3_si_metric_lane_work",
            "evidence_deletion", "authority_promotion",
        )
    )
    checks["capture_is_complete"] = all(value is True for value in required.values())
    checks["all_authority_false"] = all(value is False for value in payload["authority"].values())
    checks["protected_roots_absent"] = all(not (ROOT / path).exists() for path in PROTECTED)

    failed = [name for name, passed in checks.items() if not passed]
    result = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p7_evidence_retrieval_proposal.independent_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": len(checks) - len(failed),
        "checks_total": len(checks),
        "checks": checks,
        "failed": failed,
        "proposal_sha256": EXPECTED_PROPOSAL_SHA256,
        "projected_compute_cost_usd": projected_cost,
        "cloud_actions": 0,
        "numerical_processes": 0,
        "frozen_candidate_evaluated": False,
        "authority_promoted": False,
    }
    AUDIT.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{result['checks_passed']}/{result['checks_total']} {result['status']}")
    print(sha256(AUDIT))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
