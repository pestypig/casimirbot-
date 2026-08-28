#!/usr/bin/env python3
"""Fail-closed independent audit for one preserved H2-P7 parent result.

The audit validates evidence identity and chronology.  A valid numerical FAIL
or timeout is an audit PASS with a non-passing result classification; audit
PASS must never be confused with H2 scientific success.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import tempfile
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path


EXPECTED_PROPOSAL_SHA256 = "3f15f387c95079d2049f346e260cd8b31e51732ea903b06ae11f8feb0eabfdc3"
EXPECTED_ARCHIVE_SHA256 = "9c2a6af7f470e15329741ed0a0210f1519ce12b8fe8ec808f02001a21a18f1f5"
EXPECTED_MANIFEST_SHA256 = "d20e0f8e550c5a7e71070e2445df05f5e49b15594f4de6cc062e7dabafff9d5f"
EXPECTED_BINARY_SHA256 = "e6dfc3409a83504143b12cfdf023aa42318d89579d33275fd59643cc69788f56"
EXPECTED_VM = "nhm2-h2-p7-parent-c4-16-20260827"
EXPECTED_ZONE = "us-central1-a"
EXPECTED_MACHINE = "c4-standard-16"
EXPECTED_DISK_TYPE = "hyperdisk-balanced"
EXPECTED_DISK_GB = "30"
EXPECTED_PROCESS = "nhm2-h2-p7-parent-process-r1"
EXPECTED_SCHEMA = "nhm2.g2h_e_s5.c08_h2_ledger_fixture.v1"
EXPECTED_BUILDER_ID = "sha256:540d7039743d1fa2d285c2ec2570fef20954339fcb0a48453f187cf80c0c304c"
EXPECTED_RUNTIME_ID = "sha256:17043e9f1891cb2026c3a959de47af3d5c75ed9918d32e44455148dfaff2057e"
PROCESS_TIMEOUT_SECONDS = 100800
VM_RUNTIME_CEILING_SECONDS = 108000
PLANNING_RATE_USD_PER_HOUR = 0.79068
COST_CEILING_USD = 25.0

REQUIRED_CAPTURE_FILES = (
    "capture-disposition.json",
    "disk-poststop.json",
    "disk-prestop.json",
    "frozen-binding.txt",
    "instance-poststop.json",
    "instance-prestop.json",
    "process-count.txt",
    "run.started.utc",
    "run.stderr",
    "run.stdout",
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def parse_key_values(path: Path) -> dict[str, str]:
    result: dict[str, str] = {}
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except (OSError, UnicodeDecodeError):
        return result
    for line in lines:
        if "=" in line:
            key, value = line.split("=", 1)
            result[key] = value
    return result


def parse_utc(text: str) -> datetime:
    return datetime.strptime(text.strip(), "%Y-%m-%dT%H:%M:%SZ").replace(
        tzinfo=timezone.utc
    )


def safe_utc(path: Path) -> datetime | None:
    try:
        return parse_utc(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, ValueError):
        return None


def safe_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return ""


def safe_bytes(path: Path) -> bytes:
    try:
        return path.read_bytes()
    except OSError:
        return b""


def safe_json(path: Path) -> object | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return None


def capture_manifest_ok(capture: Path) -> tuple[bool, int]:
    manifest = capture / "capture-files.sha256"
    if not manifest.is_file():
        return False, 0
    try:
        lines = manifest.read_text(encoding="utf-8").splitlines()
    except (OSError, UnicodeDecodeError):
        return False, 0
    observed: set[str] = set()
    valid = bool(lines)
    for line in lines:
        fields = line.split(maxsplit=1)
        if len(fields) != 2:
            valid = False
            continue
        expected, name = fields
        candidate = capture / name
        valid &= (
            name not in observed
            and not Path(name).is_absolute()
            and ".." not in Path(name).parts
            and candidate.is_file()
            and sha256(candidate) == expected
        )
        observed.add(name)
    valid &= set(REQUIRED_CAPTURE_FILES).issubset(observed)
    return valid, len(lines)


def authority_locks_false(record: dict[str, object]) -> bool:
    return (
        record.get("candidate_evaluations") == 0
        and record.get("positive_parameter_samples") == 0
        and record.get("candidate_roots_created") is False
        and record.get("scientific_handler_linked") is False
        and record.get("authority_promoted") is False
    )


def audit(capture: Path, output: Path) -> dict[str, object]:
    checks: OrderedDict[str, bool] = OrderedDict()
    checks["capture_directory_exists"] = capture.is_dir()
    checks["required_capture_files_exist"] = all(
        (capture / name).is_file() for name in REQUIRED_CAPTURE_FILES
    )
    manifest_ok, manifest_count = capture_manifest_ok(capture)
    checks["capture_manifest_replays_safe_unique_files"] = manifest_ok

    binding = parse_key_values(capture / "frozen-binding.txt")
    checks["proposal_binding_exact"] = binding.get("proposal_sha256") == EXPECTED_PROPOSAL_SHA256
    checks["archive_binding_exact"] = binding.get("archive_sha256") == EXPECTED_ARCHIVE_SHA256
    checks["manifest_binding_exact"] = binding.get("manifest_sha256") == EXPECTED_MANIFEST_SHA256
    checks["binary_binding_exact"] = binding.get("binary_sha256") == EXPECTED_BINARY_SHA256
    checks["process_identity_exact"] = binding.get("process_name") == EXPECTED_PROCESS

    pre = safe_json(capture / "instance-prestop.json")
    post = safe_json(capture / "instance-poststop.json")
    disk_pre = safe_json(capture / "disk-prestop.json")
    disk_post = safe_json(capture / "disk-poststop.json")
    checks["instance_metadata_parse"] = all(isinstance(item, dict) for item in (pre, post, disk_pre, disk_post))
    pre = pre if isinstance(pre, dict) else {}
    post = post if isinstance(post, dict) else {}
    disk_pre = disk_pre if isinstance(disk_pre, dict) else {}
    disk_post = disk_post if isinstance(disk_post, dict) else {}
    checks["resource_identity_exact"] = (
        pre.get("name") == EXPECTED_VM
        and str(pre.get("zone", "")).endswith("/" + EXPECTED_ZONE)
        and str(pre.get("machineType", "")).endswith("/" + EXPECTED_MACHINE)
        and pre.get("scheduling", {}).get("provisioningModel") == "STANDARD"
    )
    checks["instance_stopped_after_capture"] = post.get("status") == "TERMINATED"
    checks["disk_identity_preserved"] = disk_pre.get("name") == disk_post.get("name") == EXPECTED_VM
    checks["disk_shape_exact"] = (
        str(disk_pre.get("type", "")).endswith("/" + EXPECTED_DISK_TYPE)
        and str(disk_pre.get("sizeGb")) == EXPECTED_DISK_GB
        and disk_post.get("status") == "READY"
    )

    disposition = safe_json(capture / "capture-disposition.json")
    disposition = disposition if isinstance(disposition, dict) else {}
    result_kind = disposition.get("result_kind")
    checks["disposition_is_terminal"] = result_kind in {"COMPLETE", "FAIL", "TIMEOUT", "PARTIAL"}
    checks["one_process_only"] = safe_text(capture / "process-count.txt").strip() == "1"
    checks["no_retry_or_retune"] = (
        disposition.get("retry_count") == 0
        and disposition.get("retune_used") is False
        and disposition.get("additional_uploads") == 0
    )
    checks["frozen_candidate_not_evaluated"] = disposition.get("frozen_candidate_evaluated") is False
    checks["protected_roots_not_created"] = disposition.get("protected_roots_created") == 0
    checks["all_authority_locks_false"] = isinstance(disposition.get("authority"), dict) and all(
        value is False for value in disposition.get("authority", {}).values()
    )

    started = safe_utc(capture / "run.started.utc")
    finished_path = capture / "run.finished.utc"
    finished = safe_utc(finished_path)
    elapsed = (finished - started).total_seconds() if finished is not None and started is not None else None
    checks["chronology_complete"] = elapsed is not None and elapsed >= 0
    checks["process_timeout_respected"] = elapsed is not None and elapsed <= PROCESS_TIMEOUT_SECONDS + 60
    try:
        creation = datetime.fromisoformat(str(pre.get("creationTimestamp"))) if pre.get("creationTimestamp") else None
    except ValueError:
        creation = None
    try:
        stop_utc = parse_utc(str(disposition.get("stop_capture_utc"))) if disposition.get("stop_capture_utc") else None
    except ValueError:
        stop_utc = None
    vm_runtime = (stop_utc - creation).total_seconds() if creation and stop_utc else None
    checks["vm_runtime_ceiling_respected"] = vm_runtime is not None and 0 < vm_runtime <= VM_RUNTIME_CEILING_SECONDS
    estimated_cost = vm_runtime / 3600 * PLANNING_RATE_USD_PER_HOUR if vm_runtime is not None else None
    checks["planning_cost_ceiling_respected"] = estimated_cost is not None and estimated_cost <= COST_CEILING_USD

    stdout_bytes = safe_bytes(capture / "run.stdout")
    stderr_bytes = safe_bytes(capture / "run.stderr")
    exit_path = capture / "run.exit"
    try:
        exit_code = int(safe_text(exit_path).strip()) if exit_path.is_file() else None
    except ValueError:
        exit_code = None
    record: dict[str, object] = {}
    try:
        lines = stdout_bytes.decode("utf-8", errors="strict").splitlines() if stdout_bytes else []
    except UnicodeDecodeError:
        lines = []
    if len(lines) == 1:
        try:
            parsed = json.loads(lines[0])
            record = parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            record = {}

    complete_record = (
        len(lines) == 1
        and record.get("schema") == EXPECTED_SCHEMA
        and record.get("status") in {"PASS", "FAIL"}
        and isinstance(record.get("checks_passed"), int)
        and isinstance(record.get("checks_total"), int)
        and 0 <= int(record.get("checks_passed", -1)) <= int(record.get("checks_total", -1))
        and authority_locks_false(record)
    )
    partial_evidence = result_kind in {"TIMEOUT", "PARTIAL"} and (
        exit_code in {None, 124, 137} or disposition.get("forced_vm_stop") is True
    )
    checks["result_payload_matches_disposition"] = (
        (result_kind == "COMPLETE" and complete_record and record.get("status") == "PASS" and exit_code == 0 and stderr_bytes == b"")
        or (result_kind == "FAIL" and complete_record and record.get("status") == "FAIL" and exit_code not in {None, 0})
        or partial_evidence
    )

    audit_pass = all(checks.values())
    numerical_pass = (
        audit_pass
        and result_kind == "COMPLETE"
        and record.get("status") == "PASS"
        and record.get("checks_passed") == record.get("checks_total")
    )
    classification = (
        "H2_PARENT_PASS" if numerical_pass
        else "H2_PARENT_FAIL" if audit_pass and result_kind == "FAIL"
        else "H2_PARENT_TIMEOUT_OR_PARTIAL" if audit_pass and result_kind in {"TIMEOUT", "PARTIAL"}
        else "AUDIT_FAIL"
    )
    payload: dict[str, object] = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p7_parent_result_audit.v1",
        "audit_status": "PASS" if audit_pass else "FAIL",
        "result_classification": classification,
        "scientific_h2_pass": numerical_pass,
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "checks": checks,
        "capture_manifest_entries": manifest_count,
        "capture_sha256": {name: sha256(capture / name) for name in sorted(p.name for p in capture.iterdir() if p.is_file())} if capture.is_dir() else {},
        "elapsed_process_seconds": elapsed,
        "aggregate_vm_runtime_seconds": vm_runtime,
        "estimated_compute_cost_usd": estimated_cost,
        "exit_code": exit_code,
        "stdout_bytes": len(stdout_bytes),
        "stderr_bytes": len(stderr_bytes),
        "frozen_candidate_evaluated": False,
        "authority": {name: False for name in ("candidate", "proof", "geometry_state", "lane", "lamp", "physical", "propulsion", "transport")},
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return payload


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, sort_keys=True) + "\n", encoding="utf-8")


def make_self_test_capture(root: Path, result_kind: str) -> Path:
    capture = root / result_kind.lower()
    capture.mkdir()
    creation = "2026-08-28T00:00:00+00:00"
    write_json(capture / "instance-prestop.json", {"name": EXPECTED_VM, "zone": f"zones/{EXPECTED_ZONE}", "machineType": f"machineTypes/{EXPECTED_MACHINE}", "status": "RUNNING", "creationTimestamp": creation, "scheduling": {"provisioningModel": "STANDARD"}})
    write_json(capture / "instance-poststop.json", {"name": EXPECTED_VM, "status": "TERMINATED"})
    write_json(capture / "disk-prestop.json", {"name": EXPECTED_VM, "type": f"diskTypes/{EXPECTED_DISK_TYPE}", "sizeGb": EXPECTED_DISK_GB, "status": "READY"})
    write_json(capture / "disk-poststop.json", {"name": EXPECTED_VM, "status": "READY"})
    authority = {name: False for name in ("candidate", "proof", "geometry_state", "lane", "lamp", "physical", "propulsion", "transport")}
    write_json(capture / "capture-disposition.json", {"result_kind": result_kind, "retry_count": 0, "retune_used": False, "additional_uploads": 0, "frozen_candidate_evaluated": False, "protected_roots_created": 0, "authority": authority, "stop_capture_utc": "2026-08-28T00:20:00Z", "forced_vm_stop": result_kind == "PARTIAL"})
    (capture / "frozen-binding.txt").write_text(f"proposal_sha256={EXPECTED_PROPOSAL_SHA256}\narchive_sha256={EXPECTED_ARCHIVE_SHA256}\nmanifest_sha256={EXPECTED_MANIFEST_SHA256}\nbinary_sha256={EXPECTED_BINARY_SHA256}\nprocess_name={EXPECTED_PROCESS}\n", encoding="utf-8")
    (capture / "process-count.txt").write_text("1\n", encoding="utf-8")
    (capture / "run.started.utc").write_text("2026-08-28T00:05:00Z\n", encoding="utf-8")
    (capture / "run.finished.utc").write_text("2026-08-28T00:15:00Z\n", encoding="utf-8")
    (capture / "run.stderr").write_bytes(b"")
    if result_kind == "COMPLETE":
        record = {"schema": EXPECTED_SCHEMA, "status": "PASS", "checks_passed": 16, "checks_total": 16, "candidate_evaluations": 0, "positive_parameter_samples": 0, "candidate_roots_created": False, "scientific_handler_linked": False, "authority_promoted": False}
        (capture / "run.stdout").write_text(json.dumps(record) + "\n", encoding="utf-8")
        (capture / "run.exit").write_text("0\n", encoding="utf-8")
    elif result_kind == "FAIL":
        record = {"schema": EXPECTED_SCHEMA, "status": "FAIL", "checks_passed": 8, "checks_total": 16, "candidate_evaluations": 0, "positive_parameter_samples": 0, "candidate_roots_created": False, "scientific_handler_linked": False, "authority_promoted": False}
        (capture / "run.stdout").write_text(json.dumps(record) + "\n", encoding="utf-8")
        (capture / "run.exit").write_text("1\n", encoding="utf-8")
    else:
        (capture / "run.stdout").write_bytes(b"")
        (capture / "run.exit").write_text("137\n", encoding="utf-8")
    files = sorted(p.name for p in capture.iterdir() if p.is_file())
    (capture / "capture-files.sha256").write_text("".join(f"{sha256(capture / name)}  {name}\n" for name in files), encoding="utf-8")
    return capture


def self_test() -> int:
    with tempfile.TemporaryDirectory(prefix="nhm2-h2-p7-audit-") as temp:
        root = Path(temp)
        expected = {"COMPLETE": "H2_PARENT_PASS", "FAIL": "H2_PARENT_FAIL", "PARTIAL": "H2_PARENT_TIMEOUT_OR_PARTIAL"}
        checks: list[bool] = []
        for kind, classification in expected.items():
            capture = make_self_test_capture(root, kind)
            result = audit(capture, root / f"{kind.lower()}-audit.json")
            checks.append(result["audit_status"] == "PASS" and result["result_classification"] == classification)
        corrupt = make_self_test_capture(root, "TIMEOUT")
        (corrupt / "process-count.txt").write_text("2\n", encoding="utf-8")
        result = audit(corrupt, root / "corrupt-audit.json")
        checks.append(result["audit_status"] == "FAIL" and result["scientific_h2_pass"] is False)
        passed = sum(checks)
        print(f"{passed}/{len(checks)} {'PASS' if passed == len(checks) else 'FAIL'}")
        return 0 if passed == len(checks) else 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--capture-dir", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        return self_test()
    if args.capture_dir is None or args.output is None:
        parser.error("--capture-dir and --output are required outside --self-test")
    result = audit(args.capture_dir.resolve(), args.output.resolve())
    print(f"{result['checks_passed']}/{result['checks_total']} {result['audit_status']}")
    print(result["result_classification"])
    print(sha256(args.output.resolve()))
    return 0 if result["audit_status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
