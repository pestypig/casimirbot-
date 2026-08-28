from __future__ import annotations

import hashlib
import json
import tarfile
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ARTIFACT_DIR = (
    ROOT
    / "artifacts"
    / "nhm2"
    / "g2h-e-s5"
    / "candidate-neutral"
    / "h2-p5a-r2-cloud-execution-v1-20260827"
)
CAPTURE_BUNDLE = ARTIFACT_DIR / "h2-p5a-r2-cloud-capture-v1.tgz"
CAPTURE = ARTIFACT_DIR / "capture" / "h2-p5a-r2-cloud-capture-v1"
EVIDENCE_BUNDLE = CAPTURE / "h2-p5a-r2-cloud-evidence-export.tgz"
EVIDENCE = ARTIFACT_DIR / "evidence"
AUDIT = ARTIFACT_DIR / "h2-p5a-r2-independent-audit.v1.json"

EXPECTED_CAPTURE_SHA256 = "01fa09a921682d4699ec15a7087f72eb0eef0030062cfa3dbbc8e36ca0ea4336"
EXPECTED_EVIDENCE_SHA256 = "bb58268293a480493f09597a82464c47d20c816ebb560b422c7b564b34497039"
EXPECTED_PROPOSAL_SHA256 = "34a5af861a7800370615ce4ba4ab34bc211acbe8e445c17979a18067bcaa84bb"
EXPECTED_ARCHIVE_SHA256 = "e9a2d9ee23fac2c1ef8a5b2d128ee5690014f96dd0cf781af6a8546404f37d87"
EXPECTED_MANIFEST_SHA256 = "2a48f796d10e4dd048838eb50f307c066db3cf5dd5a29fc5098509a27c91ccce"
EXPECTED_BINARY_SHA256 = "aa37562fe73ecf48b0177b6875aea48a259a0439fdbc24abc0525624acb013b7"
EXPECTED_SEMANTIC_SHA256 = "79c114073ed3c82d4faeb95e0ddaa81a3fb385a55465adf85e022574965ec098"
EXPECTED_BUILDER_ID = "sha256:540d7039743d1fa2d285c2ec2570fef20954339fcb0a48453f187cf80c0c304c"
EXPECTED_RUNTIME_ID = "sha256:17043e9f1891cb2026c3a959de47af3d5c75ed9918d32e44455148dfaff2057e"
EXPECTED_RUNS = [
    ("01-threads-1", 1, 1312978, 1313238),
    ("02-threads-4", 4, 335148, 335412),
    ("03-threads-8", 8, 168247, 168522),
    ("04-threads-16", 16, 157550, 157816),
    ("05-threads-16-repeat", 16, 157322, 157574),
]
SLOWER_16_LIMIT_MS = 337502
PROJECTION_MULTIPLIER = 255.998046875


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def parse_key_values(path: Path) -> dict[str, str]:
    result: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if "=" in line:
            key, value = line.split("=", 1)
            result[key] = value
    return result


def safe_members(bundle: Path) -> list[str]:
    with tarfile.open(bundle, "r:gz") as archive:
        names = archive.getnames()
    for name in names:
        parts = Path(name).parts
        if Path(name).is_absolute() or ".." in parts:
            raise ValueError(f"unsafe archive member: {name}")
    return names


def main() -> int:
    checks: OrderedDict[str, bool] = OrderedDict()
    checks["capture_bundle_exists"] = CAPTURE_BUNDLE.is_file()
    checks["capture_bundle_sha256_matches"] = (
        checks["capture_bundle_exists"] and sha256(CAPTURE_BUNDLE) == EXPECTED_CAPTURE_SHA256
    )
    checks["capture_bundle_size_is_10291"] = (
        checks["capture_bundle_exists"] and CAPTURE_BUNDLE.stat().st_size == 10291
    )
    capture_members = safe_members(CAPTURE_BUNDLE) if checks["capture_bundle_exists"] else []
    checks["capture_bundle_has_twelve_safe_members"] = len(capture_members) == 12

    capture_hash_lines = (CAPTURE / "capture-files.sha256").read_text(encoding="utf-8").splitlines()
    capture_hashes_ok = True
    for line in capture_hash_lines:
        expected, remote_path = line.split(maxsplit=1)
        local_path = CAPTURE / Path(remote_path).name
        capture_hashes_ok &= local_path.is_file() and sha256(local_path) == expected
    checks["capture_manifest_replays_all_ten_named_files"] = len(capture_hash_lines) == 10 and capture_hashes_ok

    checks["evidence_bundle_sha256_matches"] = (
        EVIDENCE_BUNDLE.is_file() and sha256(EVIDENCE_BUNDLE) == EXPECTED_EVIDENCE_SHA256
    )
    evidence_members = safe_members(EVIDENCE_BUNDLE) if EVIDENCE_BUNDLE.is_file() else []
    checks["evidence_bundle_has_fifty_four_safe_members"] = len(evidence_members) == 54

    binding = parse_key_values(CAPTURE / "frozen-binding.txt")
    checks["proposal_binding_matches"] = binding.get("proposal_sha256") == EXPECTED_PROPOSAL_SHA256
    checks["upload_archive_binding_matches"] = binding.get("archive_sha256") == EXPECTED_ARCHIVE_SHA256
    checks["source_manifest_binding_matches"] = binding.get("manifest_sha256") == EXPECTED_MANIFEST_SHA256
    checks["binary_binding_matches"] = binding.get("binary_sha256") == EXPECTED_BINARY_SHA256

    pre = json.loads((CAPTURE / "instance-prestop.json").read_text(encoding="utf-8"))
    post = json.loads((CAPTURE / "instance-poststop.json").read_text(encoding="utf-8"))
    disk_pre = json.loads((CAPTURE / "disk-prestop.json").read_text(encoding="utf-8"))
    disk_post = json.loads((CAPTURE / "disk-poststop.json").read_text(encoding="utf-8"))
    checks["instance_name_exact"] = pre["name"] == "nhm2-h2-p5a-r2-c4-16-20260827"
    checks["instance_zone_exact"] = str(pre["zone"]).endswith("/us-central1-a")
    checks["machine_type_exact"] = str(pre["machineType"]).endswith("/c4-standard-16")
    checks["provisioning_model_standard"] = pre["scheduling"]["provisioningModel"] == "STANDARD"
    checks["prestop_instance_running"] = pre["status"] == "RUNNING"
    checks["poststop_instance_terminated"] = post["status"] == "TERMINATED"
    checks["disk_identity_preserved"] = disk_pre["name"] == disk_post["name"] == pre["name"]
    checks["disk_type_exact"] = str(disk_pre["type"]).endswith("/hyperdisk-balanced")
    checks["disk_size_exact"] = str(disk_pre["sizeGb"]) == "30"
    checks["disk_ready_after_stop"] = disk_post["status"] == "READY"

    closure = parse_key_values(CAPTURE / "resource-closure.txt")
    checks["resource_closure_terminated"] = closure.get("INSTANCE_STATUS") == "TERMINATED"
    stop_time = datetime.strptime(closure["STOP_CAPTURE_UTC"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    creation_time = datetime.fromisoformat(pre["creationTimestamp"])
    runtime_seconds = (stop_time - creation_time).total_seconds()
    checks["aggregate_runtime_under_7200_seconds"] = 0 < runtime_seconds <= 7200
    estimated_compute_cost = runtime_seconds / 3600 * 0.79068
    checks["planning_compute_cost_under_two_dollars"] = estimated_compute_cost <= 2.0

    checks["remote_preflight_passed"] = (EVIDENCE / "logs" / "preflight-verdict.txt").read_text(encoding="utf-8").strip() == "R2_VM_PREFLIGHT_PASS"
    guard_out = (EVIDENCE / "logs" / "build-guard.stdout.log").read_text(encoding="utf-8")
    guard_err = (EVIDENCE / "logs" / "build-guard.stderr.log").read_bytes()
    checks["clean_daemon_guard_passed"] = "\nPASS\n" in guard_out and guard_err == b""
    checks["builder_config_id_exact"] = f"builder={EXPECTED_BUILDER_ID}" in guard_out
    checks["runtime_config_id_exact"] = f"runtime={EXPECTED_RUNTIME_ID}" in guard_out
    checks["offline_build_succeeded"] = "Successfully built" in guard_out
    checks["required_binary_reproduced"] = f"binary={EXPECTED_BINARY_SHA256}" in guard_out

    observed_semantics: list[str] = []
    observed_ms: list[int] = []
    for directory, threads, milliseconds, elapsed in EXPECTED_RUNS:
        run = EVIDENCE / "runs" / directory
        record_lines = (run / "stdout.ndjson").read_text(encoding="utf-8").splitlines()
        record = json.loads(record_lines[0]) if len(record_lines) == 1 else {}
        metadata = parse_key_values(run / "process-metadata.txt")
        checks[f"{directory}_single_complete_record"] = (
            len(record_lines) == 1
            and record.get("status") == "CALIBRATION_COMPLETE"
            and record.get("u_panels") == 1024
            and record.get("threads") == threads
            and record.get("milliseconds") == milliseconds
            and record.get("subpanels_accumulated") == 1024
            and record.get("elementary_convolutions") == 44032
        )
        checks[f"{directory}_process_passed"] = (
            metadata.get("EXIT_CODE") == "0"
            and int(metadata.get("ELAPSED_MS", "-1")) == elapsed
            and (run / "stderr.log").read_bytes() == b""
            and (run / "validation.txt").read_text(encoding="utf-8").strip() == "PASS"
        )
        checks[f"{directory}_authority_locks_false"] = (
            record.get("candidate_evaluations") == 0
            and record.get("positive_parameter_samples") == 0
            and record.get("candidate_root_created") is False
            and record.get("scientific_handler_linked") is False
            and record.get("authority_promoted") is False
        )
        observed_semantics.append(record.get("semantic_sha256", ""))
        observed_ms.append(record.get("milliseconds", -1))

    checks["five_runs_have_exact_semantic_agreement"] = (
        len(set(observed_semantics)) == 1 and observed_semantics[0] == EXPECTED_SEMANTIC_SHA256
    )
    checks["thread_sequence_is_exact"] = [item[1] for item in EXPECTED_RUNS] == [1, 4, 8, 16, 16]
    slower_16_ms = max(observed_ms[3], observed_ms[4])
    checks["slower_sixteen_thread_sample_meets_frozen_limit"] = slower_16_ms <= SLOWER_16_LIMIT_MS

    cross_run = parse_key_values(EVIDENCE / "logs" / "cross-run-acceptance.txt")
    checks["remote_cross_run_acceptance_passed"] = (
        cross_run.get("STATUS") == "PASS"
        and cross_run.get("RUNS_COMPLETE") == "5"
        and cross_run.get("SEMANTIC_SHA256") == EXPECTED_SEMANTIC_SHA256
        and cross_run.get("ALL_STDERR_EMPTY") == "true"
        and cross_run.get("ALL_EXIT_CODES_ZERO") == "true"
        and cross_run.get("ALL_AUTHORITY_LOCKS_FALSE") == "true"
        and cross_run.get("FROZEN_CANDIDATE_EVALUATED") == "false"
        and cross_run.get("FULL_SELECTOR_EXECUTED") == "false"
    )

    projected_one_selector_hours = slower_16_ms * PROJECTION_MULTIPLIER / 3_600_000
    projected_two_selector_hours = projected_one_selector_hours * 2
    checks["two_selector_projection_meets_frozen_subday_target"] = projected_two_selector_hours <= 24

    passed = sum(checks.values())
    total = len(checks)
    verdict = "PASS" if passed == total else "FAIL"
    result = {
        "schema_version": "nhm2.h2.p5a.r2.cloud_execution.independent_audit.v1",
        "verdict": verdict,
        "checks_passed": passed,
        "checks_total": total,
        "checks": checks,
        "classification": "RUNTIME_TURNAROUND_BINDING_PASS" if verdict == "PASS" else "AUDIT_FAIL",
        "timings_ms": {directory: milliseconds for directory, _, milliseconds, _ in EXPECTED_RUNS},
        "speedups_vs_one_thread": {
            directory: EXPECTED_RUNS[0][2] / milliseconds
            for directory, _, milliseconds, _ in EXPECTED_RUNS[1:]
        },
        "slower_16_ms": slower_16_ms,
        "frozen_slower_16_limit_ms": SLOWER_16_LIMIT_MS,
        "projected_one_selector_hours": projected_one_selector_hours,
        "projected_two_selector_hours": projected_two_selector_hours,
        "aggregate_vm_runtime_seconds": runtime_seconds,
        "estimated_compute_cost_usd": estimated_compute_cost,
        "capture_bundle_sha256": EXPECTED_CAPTURE_SHA256,
        "evidence_bundle_sha256": EXPECTED_EVIDENCE_SHA256,
        "frozen_candidate_evaluated": False,
        "full_selector_executed": False,
        "authority": {
            "candidate": False,
            "proof": False,
            "geometry_state": False,
            "lane": False,
            "lamp": False,
            "physical": False,
            "propulsion": False,
            "transport": False,
        },
    }
    AUDIT.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{passed}/{total} {verdict}")
    print(sha256(AUDIT))
    print(f"projected_two_selector_hours={projected_two_selector_hours:.9f}")
    return 0 if verdict == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
