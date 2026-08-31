#!/usr/bin/env python3
"""Freeze the inert H2-P8C diagnostic cloud proposal and upload."""

from __future__ import annotations

import hashlib
import io
import json
import tarfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
P7 = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p7-parent-cloud-preflight-v1-20260827"
P7_ARCHIVE = P7 / "h2-p7-parent-upload-r1.tar"
P7_MANIFEST = P7 / "h2-p7-parent-source-manifest.r1.json"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-diagnostic-cloud-preflight-v1-20260828"
ARCHIVE = OUT / "h2-p8c-diagnostic-upload-v1.tar"
MANIFEST = OUT / "h2-p8c-diagnostic-source-manifest.v1.json"
PROPOSAL = OUT / "h2-p8c-diagnostic-cloud-proposal.v1.json"
PREFLIGHT = OUT / "h2-p8c-diagnostic-preflight.v1.json"
P7_ARCHIVE_SHA256 = "9c2a6af7f470e15329741ed0a0210f1519ce12b8fe8ec808f02001a21a18f1f5"
P7_MANIFEST_SHA256 = "d20e0f8e550c5a7e71070e2445df05f5e49b15594f4de6cc062e7dabafff9d5f"
BASE_ARCHIVE_SHA256 = "4645ef9f0028a4ae58601a73d8d7cf7cb8f2316578a318ce6ce2257b103624f1"
REQUIRED_BINARY_SHA256 = "7e7d78393f933ac103208476f6e8c5beefb5de66b58d93a6b2a080bdf80deb25"
PREFIX = "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/"
REPLACEMENTS = [
    PREFIX + "mini_boson_star_primary_c08_convolution_selector_v1.hpp",
    PREFIX + "mini_boson_star_primary_c08_convolution_selector_v1.cpp",
    PREFIX + "mini_boson_star_primary_c08_h2_ledger_v1.hpp",
    PREFIX + "mini_boson_star_primary_c08_h2_ledger_v1.cpp",
]
ADDITIONS = [
    PREFIX + "mini_boson_star_primary_c08_h2_p8c_diagnostic_run_v1.cpp",
    PREFIX + "Dockerfile.primary.mini-boson-c08-h2-p8c-diagnostic-run.v1",
    PREFIX + "h2_p8c_diagnostic_offline_build_guard_v1.sh",
]
PROTECTED = [
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
    "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
    "artifacts/nhm2/g2h-e-s5/executions",
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def member_sha256(archive: tarfile.TarFile, name: str) -> str:
    stream = archive.extractfile(archive.getmember(name))
    if stream is None:
        return ""
    digest = hashlib.sha256()
    for block in iter(lambda: stream.read(1024 * 1024), b""):
        digest.update(block)
    return digest.hexdigest()


def normalized(name: str, size: int, mode: int = 0o644) -> tarfile.TarInfo:
    info = tarfile.TarInfo(name)
    info.size = size
    info.mode = mode
    info.mtime = info.uid = info.gid = 0
    info.uname = info.gname = ""
    return info


def metadata(name: str) -> dict[str, object]:
    path = ROOT / name
    return {"bytes": path.stat().st_size, "path": name, "sha256": sha256(path)}


def main() -> int:
    p7_manifest = json.loads(P7_MANIFEST.read_text(encoding="utf-8"))
    with tarfile.open(P7_ARCHIVE, "r") as source:
        p7_names = source.getnames()
    checks = {
        "p7_archive_exact": sha256(P7_ARCHIVE) == P7_ARCHIVE_SHA256,
        "p7_manifest_exact": sha256(P7_MANIFEST) == P7_MANIFEST_SHA256,
        "p7_inventory_44_unique": len(p7_names) == len(set(p7_names)) == 44,
        "base_archive_bound": p7_manifest["pinned_base_images_archive"]["sha256"] == BASE_ARCHIVE_SHA256,
        "replacement_inventory_exact": all(name in p7_names and (ROOT / name).is_file() for name in REPLACEMENTS),
        "additions_exist_and_new": all((ROOT / name).is_file() and name not in p7_names for name in ADDITIONS),
        "protected_roots_absent": all(not (ROOT / name).exists() for name in PROTECTED),
    }
    if not all(checks.values()):
        raise SystemExit(f"frozen ingress mismatch: {[name for name, value in checks.items() if not value]}")

    OUT.mkdir(parents=True, exist_ok=False)
    replacements = {item["path"]: item for item in map(metadata, REPLACEMENTS)}
    additions = list(map(metadata, ADDITIONS))
    files = [replacements.get(item["path"], item) for item in p7_manifest["files"]] + additions
    manifest = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8c_diagnostic_source_manifest.v1",
        "status": "PREPARED_INERT_DIAGNOSTIC_EXECUTION_INPUT",
        "files": files,
        "pinned_base_images_archive": p7_manifest["pinned_base_images_archive"],
        "required_binary_sha256": REQUIRED_BINARY_SHA256,
        "inventory_lineage": {
            "predecessor_archive_sha256": P7_ARCHIVE_SHA256,
            "predecessor_manifest_sha256": P7_MANIFEST_SHA256,
            "predecessor_entry_count": 44,
            "preserved_entry_count": 40,
            "replacement_entries": REPLACEMENTS,
            "additive_entries": ADDITIONS,
            "entry_count": 47,
        },
        "runtime_binding": {
            "selector_threads": 16,
            "selector_invocations_maximum": 2,
            "p7_observed_hours": 6.164166666666667,
            "external_timeout_seconds": 50400,
            "diagnostic_record_maximum_bytes": 65536,
        },
        "authority": {
            "candidate": False, "proof": False, "geometry_state": False,
            "lane": False, "lamp": False, "physical": False,
            "propulsion": False, "transport": False,
        },
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    with tarfile.open(P7_ARCHIVE, "r") as source, tarfile.open(ARCHIVE, "w", format=tarfile.GNU_FORMAT) as target:
        for name in p7_names:
            if name in replacements:
                data = (ROOT / name).read_bytes()
                target.addfile(normalized(name, len(data)), io.BytesIO(data))
            else:
                member = source.getmember(name)
                stream = source.extractfile(member)
                if stream is None:
                    raise SystemExit(f"missing predecessor member: {name}")
                target.addfile(normalized(name, member.size, member.mode), stream)
        for name in ADDITIONS:
            data = (ROOT / name).read_bytes()
            mode = 0o755 if name.endswith(".sh") else 0o644
            target.addfile(normalized(name, len(data), mode), io.BytesIO(data))

    manifest_hash = sha256(MANIFEST)
    archive_hash = sha256(ARCHIVE)
    proposal = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8c_diagnostic_cloud_proposal.v1",
        "status": "FROZEN_INERT_AWAITING_SEPARATE_AUTHORIZATION",
        "resource": {
            "provider": "google_compute_engine",
            "project": "dark-stratum-455714-h4",
            "name": "nhm2-h2-p8c-diagnostic-c4-16-20260828",
            "zone": "us-central1-a",
            "machine_type": "c4-standard-16",
            "provisioning_model": "STANDARD",
            "boot_disk_gb": 30,
            "boot_disk_type": "hyperdisk-balanced",
            "planning_compute_rate_usd_per_hour": 0.79068,
            "aggregate_vm_runtime_ceiling_seconds": 54000,
            "total_cost_ceiling_usd": 13.0,
            "stop_after_evidence_capture": True,
            "delete_disk_or_evidence": False,
        },
        "upload": {
            "path": ARCHIVE.name,
            "bytes": ARCHIVE.stat().st_size,
            "entries": 47,
            "sha256": archive_hash,
            "manifest_sha256": manifest_hash,
            "additional_uploads_allowed": False,
        },
        "build": {
            "guard": ADDITIONS[2],
            "pull": False,
            "network": "none",
            "required_binary_sha256": REQUIRED_BINARY_SHA256,
        },
        "execution": {
            "process_count": 1,
            "entrypoint": "/usr/local/bin/mini-boson-star-primary-c08-h2-p8c-diagnostic-run-v1",
            "selector_thread_count": 16,
            "external_timeout_seconds": 50400,
            "expected_result_schema": "nhm2.g2h_e_s5.c08_h2_p8c_diagnostic_run.v1",
            "expected_diagnostic_schema": "nhm2.g2h_e_s5.c08_h2_p8b_parent_diagnostic.v1",
            "expected_parent_sequence": ["scalar_initialize", "h2_initialize", "scalar_extend", "h2_extend"],
            "immutable_complete_fail_timeout_or_partial_evidence": True,
            "retry_allowed": False,
            "retune_allowed": False,
            "alternate_output_root_allowed": False,
        },
        "evidence": {
            "remote_root": "/home/pestypig/nhm2-h2-p8c-evidence-v1",
            "root_must_be_absent_before_authorized_execution": True,
            "required_files": ["run.started.utc", "run.finished.utc", "run.exit", "run.stdout", "run.stderr", "resource.pre.json", "resource.post.json", "sha256.txt"],
            "independent_result_audit_required": True,
        },
        "forbidden": {
            "full_frozen_candidate_evaluation": True,
            "positive_parameter_sampling": True,
            "candidate_or_scientific_output_root": True,
            "authorization_token_creation": True,
            "scientific_handler_linkage": True,
            "rust_or_g3_or_si_or_metric_or_lane_work": True,
            "evidence_deletion": True,
            "authority_promotion": True,
        },
    }
    PROPOSAL.write_text(json.dumps(proposal, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    with tarfile.open(P7_ARCHIVE, "r") as predecessor, tarfile.open(ARCHIVE, "r") as produced:
        names = produced.getnames()
        preserved = [name for name in p7_names if name not in REPLACEMENTS]
        checks.update({
            "inventory_exact_47": names == p7_names + ADDITIONS and len(names) == len(set(names)) == 47,
            "preserved_40_byte_exact": len(preserved) == 40 and all(member_sha256(produced, name) == member_sha256(predecessor, name) for name in preserved),
            "replacement_hashes_exact": all(member_sha256(produced, name) == replacements[name]["sha256"] for name in REPLACEMENTS),
            "addition_hashes_exact": all(member_sha256(produced, item["path"]) == item["sha256"] for item in additions),
            "proposal_inert": proposal["status"] == "FROZEN_INERT_AWAITING_SEPARATE_AUTHORIZATION",
            "no_execution_evidence": not (OUT / "h2-p8c-diagnostic-execution.v1.json").exists(),
        })
    receipt = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8c_diagnostic_preflight.v1",
        "status": "PASS" if all(checks.values()) else "FAIL",
        "checks": checks,
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "archive_entry_count": 47,
        "archive_bytes": ARCHIVE.stat().st_size,
        "archive_sha256": archive_hash,
        "manifest_sha256": manifest_hash,
        "proposal_sha256": sha256(PROPOSAL),
        "required_binary_sha256": REQUIRED_BINARY_SHA256,
        "cloud_actions": 0,
        "numerical_runs": 0,
        "frozen_candidate_evaluated": False,
        "authority_promoted": False,
    }
    PREFLIGHT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{receipt['status']} {receipt['checks_passed']}/{receipt['checks_total']}")
    for name in ("archive_sha256", "manifest_sha256", "proposal_sha256", "required_binary_sha256"):
        print(f"{name}={receipt[name]}")
    return 0 if receipt["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
