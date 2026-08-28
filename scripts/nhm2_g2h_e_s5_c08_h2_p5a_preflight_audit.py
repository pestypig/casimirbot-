#!/usr/bin/env python3
"""Independent exact audit of the inert H2-P5A preflight artifacts."""

from __future__ import annotations

import hashlib
import json
import pathlib
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
EVIDENCE_DIR = ROOT / (
    "artifacts/nhm2/g2h-e-s5/candidate-neutral/"
    "h2-p5a-preflight-v1-20260827"
)
PREFLIGHT = EVIDENCE_DIR / "h2-p5a-preflight.json"
PROPOSAL = EVIDENCE_DIR / "h2-p5a-execution-proposal.json"
MANIFEST = EVIDENCE_DIR / "h2-p5a-source-manifest.json"
AUDIT = EVIDENCE_DIR / "h2-p5a-preflight-audit.json"


def sha256(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> int:
    preflight = json.loads(PREFLIGHT.read_text(encoding="utf-8"))
    proposal = json.loads(PROPOSAL.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    files = manifest["files"]
    source_map = {item["path"]: item for item in files}
    threads = [item["threads"] for item in proposal["runs"]]
    acceptance = proposal["semantic_acceptance"]
    projected_boundary_ms = int(
        24 * 60 * 60 * 1000
        / float(acceptance["projection_multiplier_from_p1024"])
    )
    checks = {
        "preflight_schema": preflight["schema"].endswith("p5a_preflight.v1"),
        "preflight_pass": preflight["status"] == "PASS",
        "preflight_all_checks_pass":
            preflight["checks_passed"] == preflight["checks_total"] == 32,
        "proposal_hash_bound":
            preflight["execution_proposal_sha256"] == sha256(PROPOSAL),
        "manifest_hash_bound":
            preflight["source_manifest_sha256"] == sha256(MANIFEST),
        "manifest_nonempty": len(files) >= 30,
        "manifest_paths_unique": len(source_map) == len(files),
        "manifest_files_exist": all((ROOT / item["path"]).is_file()
                                    for item in files),
        "manifest_file_hashes_exact": all(
            sha256(ROOT / item["path"]) == item["sha256"] for item in files
        ),
        "base_archive_hash_exact":
            sha256(ROOT / manifest["pinned_base_images_archive"]["path"])
            == manifest["pinned_base_images_archive"]["sha256"],
        "proposal_awaits_authorization":
            proposal["status"] == "FROZEN_AWAITING_EXPLICIT_AUTHORIZATION",
        "proposal_machine_exact":
            proposal["machine"]["name"]
            == "nhm2-h2-p5a-c4-16-20260827"
            and proposal["machine"]["type"] == "c4-standard-16",
        "proposal_disk_exact":
            proposal["machine"]["boot_disk_gb"] == 30
            and proposal["machine"]["boot_disk_type"] == "pd-balanced",
        "proposal_cost_ceiling_exact":
            proposal["machine"]["total_cost_ceiling_usd"] == "2.00",
        "run_sequence_exact": threads == [1, 4, 8, 16, 16],
        "repeat_binding_exact": proposal["runs"][4].get("repeat_of") == 4,
        "one_hour_per_run_timeout":
            proposal["external_timeout_seconds_per_run"] == 3600,
        "semantic_equality_required":
            acceptance["semantic_sha256_equal_across_all_runs"] is True,
        "stderr_empty_required": acceptance["stderr_empty"] is True,
        "all_runs_complete_required": acceptance["all_runs_complete"] is True,
        "projection_multiplier_exact":
            acceptance["projection_multiplier_from_p1024"]
            == "255.998046875",
        "projection_boundary_conservative":
            acceptance["slower_16_thread_milliseconds_max"]
            <= projected_boundary_ms,
        "two_selector_target_24h":
            acceptance["two_selector_projection_hours_max"] == 24,
        "authority_all_false": not any(proposal["authority"].values()),
        "stop_on_numerical_mismatch":
            "any numerical mismatch" in proposal["stop_fail"],
        "stop_on_partial_or_timeout":
            "any timeout or partial output" in proposal["stop_fail"],
        "preflight_executed_no_numerical_run":
            preflight["numerical_runs_executed"] == 0,
        "preflight_created_no_vm":
            preflight["vm_created_or_started"] is False,
        "preflight_promoted_no_authority":
            preflight["authority_promoted"] is False,
        "description_exact_candidate_surface":
            preflight["description"]["u_panels"] == 1024
            and preflight["description"]["candidate_calls_per_process"] == 1,
        "description_no_hidden_oracle":
            preflight["description"]["smaller_widths_evaluated"] is False
            and preflight["description"]["serial_oracle_in_process"] is False,
        "invalid_argument_is_inert":
            preflight["invalid_argument_receipt"]["phase"] == "arguments"
            and preflight["invalid_argument_receipt"]
            ["candidate_evaluations"] == 0,
    }
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p5a_preflight_audit.v1",
        "status": "PASS" if all(checks.values()) else "FAIL",
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "checks": checks,
        "execution_proposal_sha256": sha256(PROPOSAL),
        "source_manifest_sha256": sha256(MANIFEST),
        "numerical_runs_executed": 0,
        "vm_created_or_started": False,
        "authority_promoted": False,
    }
    AUDIT.write_text(
        json.dumps(payload, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(payload, indent=2, sort_keys=True))
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
