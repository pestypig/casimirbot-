#!/usr/bin/env python3
"""Prepare and audit the inert H2-P5A representative-width calibration."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys
from typing import Any


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
SOURCE = G2H / "mini_boson_star_primary_c08_h2_p5a_width_calibration_v1.cpp"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-h2-p5a-width-calibration.v1"
IMAGE = "nhm2-g2h-e-s5-h2-p5a-width-calibration:v1"
BINARY = "/usr/local/bin/mini-boson-star-primary-c08-h2-p5a-width-calibration-v1"
EVIDENCE_DIR = ROOT / (
    "artifacts/nhm2/g2h-e-s5/candidate-neutral/"
    "h2-p5a-preflight-v1-20260827"
)
EVIDENCE = EVIDENCE_DIR / "h2-p5a-preflight.json"
PROPOSAL = EVIDENCE_DIR / "h2-p5a-execution-proposal.json"
MANIFEST = EVIDENCE_DIR / "h2-p5a-source-manifest.json"
BASE_ARCHIVE = ROOT / (
    "artifacts/nhm2/g2h-e-s5/candidate-neutral/"
    "h2-p4-cloud-preflight-v1-20260827/h2-p4-upload-v1/"
    "h2-p4-pinned-base-images.tar"
)
BUILDER_DIGEST = "9e94d19f9014938b510e95c776778d164cce120777adfc2d495c1812de5221a1"
RUNTIME_DIGEST = "8334e9777fd7cb9405d8878b243d0196f3e45d9d51d82df159452dcb430159ab"
EXPECTED_BASE_ARCHIVE_SHA256 = (
    "4645ef9f0028a4ae58601a73d8d7cf7cb8f2316578a318ce6ce2257b103624f1"
)


def sha256(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def run(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        list(args), cwd=ROOT, text=True, capture_output=True, check=check
    )


def copied_sources(docker_text: str) -> list[pathlib.Path]:
    paths: list[pathlib.Path] = []
    for line in docker_text.splitlines():
        if not line.startswith("COPY tools/"):
            continue
        relative = line.split()[1]
        path = ROOT / relative
        if path not in paths:
            paths.append(path)
    return paths


def main() -> int:
    source_text = SOURCE.read_text(encoding="utf-8")
    docker_text = DOCKERFILE.read_text(encoding="utf-8")
    description_run = run("docker", "run", "--rm", IMAGE, "--describe")
    description = json.loads(description_run.stdout)
    invalid_run = run(
        "docker", "run", "--rm", IMAGE, "--threads", "2", check=False
    )
    invalid = json.loads(invalid_run.stdout)
    image_id = run(
        "docker", "image", "inspect", IMAGE, "--format", "{{.Id}}"
    ).stdout.strip()
    repo_digests = json.loads(
        run(
            "docker", "image", "inspect", IMAGE,
            "--format", "{{json .RepoDigests}}"
        ).stdout
    )
    binary_line = run(
        "docker", "run", "--rm", "--entrypoint", "/usr/bin/sha256sum",
        IMAGE, BINARY
    ).stdout.strip()
    binary_sha256 = binary_line.split()[0]

    sources = copied_sources(docker_text)
    manifest_payload: dict[str, Any] = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p5a_source_manifest.v1",
        "status": "PREPARED_INERT",
        "files": [
            {
                "path": path.relative_to(ROOT).as_posix(),
                "bytes": path.stat().st_size,
                "sha256": sha256(path),
            }
            for path in sources
        ],
        "pinned_base_images_archive": {
            "path": BASE_ARCHIVE.relative_to(ROOT).as_posix(),
            "bytes": BASE_ARCHIVE.stat().st_size,
            "sha256": sha256(BASE_ARCHIVE),
            "builder_oci_index_sha256": BUILDER_DIGEST,
            "runtime_oci_index_sha256": RUNTIME_DIGEST,
        },
    }
    EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(
        json.dumps(manifest_payload, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    proposal_payload: dict[str, Any] = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p5a_execution_proposal.v1",
        "status": "FROZEN_AWAITING_EXPLICIT_AUTHORIZATION",
        "program_gate": "G2H-E-S5",
        "machine": {
            "provider": "Google Compute Engine",
            "name": "nhm2-h2-p5a-c4-16-20260827",
            "zone": "us-central1-a",
            "type": "c4-standard-16",
            "boot_disk_gb": 30,
            "boot_disk_type": "pd-balanced",
            "on_demand_rate_usd_per_hour": "0.79068",
            "total_cost_ceiling_usd": "2.00",
        },
        "container": {
            "tag": IMAGE,
            "local_preflight_repo_digest": repo_digests[0],
            "local_preflight_image_id": image_id,
            "binary": BINARY,
            "required_remote_binary_sha256": binary_sha256,
            "source_manifest_sha256": sha256(MANIFEST),
        },
        "runs": [
            {"ordinal": 1, "threads": 1},
            {"ordinal": 2, "threads": 4},
            {"ordinal": 3, "threads": 8},
            {"ordinal": 4, "threads": 16},
            {"ordinal": 5, "threads": 16, "repeat_of": 4},
        ],
        "command_template": (
            "docker run --rm --cpus=16 --memory=12g "
            "nhm2-g2h-e-s5-h2-p5a-width-calibration:v1 "
            "--threads {threads}"
        ),
        "external_timeout_seconds_per_run": 3600,
        "semantic_acceptance": {
            "all_runs_complete": True,
            "stderr_empty": True,
            "semantic_sha256_equal_across_all_runs": True,
            "slower_16_thread_milliseconds_max": 337502,
            "two_selector_projection_hours_max": 24,
            "projection_multiplier_from_p1024": "255.998046875",
        },
        "stop_fail": [
            "any numerical mismatch",
            "any timeout or partial output",
            "any nonempty stderr",
            "any authority lock nonzero or true",
            "cost ceiling reached",
        ],
        "authority": {
            "frozen_candidate_evaluation": False,
            "full_selector_execution": False,
            "positive_sampling": False,
            "candidate_or_output_root_creation": False,
            "scientific_handler_linkage": False,
            "retuning_or_retry": False,
            "g3_si_metric_lane_work": False,
            "authority_promotion": False,
        },
    }
    PROPOSAL.write_text(
        json.dumps(proposal_payload, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    checks = {
        "source_hardcodes_p1024": "kPanelCount = 1024U" in source_text,
        "source_allows_only_1_4_8_16":
            "kAllowedThreads = {1U, 4U, 8U, 16U}" in source_text,
        "single_candidate_call_site":
            source_text.count("selector::evaluate_prepared_candidate(") == 1,
        "no_full_selector_call": "selector::evaluate(" not in source_text,
        "no_width_selector_call":
            "evaluate_prepared_parallel" not in source_text,
        "no_exponent_loop": "maximum_exponent" not in source_text,
        "no_in_process_serial_oracle": "serial_output" not in source_text,
        "semantic_domain_separated":
            "c08-h2-p5a-semantics/v1" in source_text,
        "semantic_digest_uses_arb_dump": "arb_dump_str" in source_text,
        "semantic_digest_covers_coefficients":
            '"coefficient"' in source_text
            and '"coefficient_margin"' in source_text,
        "semantic_digest_covers_remainders":
            '"remainder"' in source_text
            and '"remainder_margin"' in source_text,
        "semantic_digest_covers_coverage":
            "direct_coverage_offsets" in source_text
            and "reflected_coverage_ordinals" in source_text,
        "semantic_digest_covers_result":
            "refinement_candidates_visited" in source_text
            and "elementary_convolutions" in source_text,
        "docker_builder_digest_pinned": BUILDER_DIGEST in docker_text,
        "docker_runtime_digest_pinned": RUNTIME_DIGEST in docker_text,
        "docker_nonroot": "USER 65532:65532" in docker_text,
        "description_exit_zero": description_run.returncode == 0,
        "description_exact_width": description.get("u_panels") == 1024,
        "description_single_call":
            description.get("candidate_calls_per_process") == 1,
        "description_no_smaller_widths":
            description.get("smaller_widths_evaluated") is False,
        "description_no_serial_oracle":
            description.get("serial_oracle_in_process") is False,
        "description_authority_locks_false": all(
            description.get(key) in (0, False)
            for key in (
                "candidate_evaluations", "positive_parameter_samples",
                "candidate_roots_created", "scientific_handler_linked",
                "authority_promoted",
            )
        ),
        "invalid_thread_rejected": invalid_run.returncode == 1,
        "invalid_thread_rejected_before_compute":
            invalid.get("phase") == "arguments"
            and invalid.get("candidate_evaluations") == 0,
        "base_archive_present": BASE_ARCHIVE.is_file(),
        "base_archive_unchanged":
            sha256(BASE_ARCHIVE) == EXPECTED_BASE_ARCHIVE_SHA256,
        "manifest_covers_all_docker_copy_inputs":
            len(manifest_payload["files"]) == len(sources),
        "proposal_exactly_five_runs": len(proposal_payload["runs"]) == 5,
        "proposal_repeats_only_16":
            [item["threads"] for item in proposal_payload["runs"]]
            == [1, 4, 8, 16, 16],
        "proposal_has_frozen_24h_threshold":
            proposal_payload["semantic_acceptance"]
            ["two_selector_projection_hours_max"] == 24,
        "proposal_has_cost_ceiling":
            proposal_payload["machine"]["total_cost_ceiling_usd"] == "2.00",
        "proposal_authority_all_false":
            not any(proposal_payload["authority"].values()),
    }
    evidence_payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p5a_preflight.v1",
        "status": "PASS" if all(checks.values()) else "FAIL",
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "checks": checks,
        "source_sha256": sha256(SOURCE),
        "dockerfile_sha256": sha256(DOCKERFILE),
        "image_id": image_id,
        "repo_digests": repo_digests,
        "binary_sha256": binary_sha256,
        "description": description,
        "invalid_argument_receipt": invalid,
        "source_manifest_sha256": sha256(MANIFEST),
        "execution_proposal_sha256": sha256(PROPOSAL),
        "numerical_runs_executed": 0,
        "vm_created_or_started": False,
        "authority_promoted": False,
    }
    EVIDENCE.write_text(
        json.dumps(evidence_payload, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(evidence_payload, indent=2, sort_keys=True))
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
