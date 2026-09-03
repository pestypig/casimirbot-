#!/usr/bin/env python3
"""Frozen result audit and preregistered P8Q classifier for H2-P8P."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import tarfile
from collections import OrderedDict
from pathlib import Path

SCHEMA = "nhm2.g2h_e_s5.c08_h2_p8p_turnaround_result_audit.v1"
RECORD_SCHEMA = "nhm2.g2h_e_s5.c08_h2_p8p_turnaround_calibration.v1"
PROGRESS_SCHEMA = "nhm2.g2h_e_s5.c08_h2_p8p_progress.v1"
EXPECTED_BINARY_SHA = "7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718"
PANEL_COUNT = 1024
THREAD_COUNT = 32
PROGRESS_RECORDS = 64
DEGREE_BUCKETS = 514
SELECTOR_FULL_SECONDS = 6044
SELECTOR_GUARD_NUMERATOR = 5
SELECTOR_GUARD_DENOMINATOR = 4
OBSERVER_SCALE = 64
OBSERVER_GUARD = 2
FULL_RUNTIME_CEILING_SECONDS = 172800
PLANNING_RATE_PER_HOUR = 1.452768
FULL_COST_CEILING_DOLLARS = 80.0


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def safe_members(archive: tarfile.TarFile) -> list[tarfile.TarInfo]:
    members = archive.getmembers()
    prefix = "nhm2-h2-p8p-evidence-v1/"
    if not members or any(
        member.issym() or member.islnk() or member.name.startswith("/")
        or ".." in Path(member.name).parts
        or not (member.name == prefix[:-1] or member.name.startswith(prefix))
        for member in members
    ):
        raise ValueError("unsafe or out-of-root archive member")
    return members


def read_member(archive: tarfile.TarFile, name: str, cap: int = 1_000_000) -> bytes:
    member = archive.getmember("nhm2-h2-p8p-evidence-v1/" + name)
    if not member.isfile() or member.size > cap:
        raise ValueError(f"invalid member {name}")
    stream = archive.extractfile(member)
    if stream is None:
        raise ValueError(f"unreadable member {name}")
    return stream.read(cap + 1)


def classify(observer_nanoseconds: int) -> tuple[str, int, float]:
    selector_guarded = (SELECTOR_FULL_SECONDS * SELECTOR_GUARD_NUMERATOR
                        + SELECTOR_GUARD_DENOMINATOR - 1) // SELECTOR_GUARD_DENOMINATOR
    observer_seconds = (observer_nanoseconds + 999_999_999) // 1_000_000_000
    projected = selector_guarded + OBSERVER_SCALE * OBSERVER_GUARD * observer_seconds
    cost = projected * PLANNING_RATE_PER_HOUR / 3600.0
    decision = ("P8Q_YES_PROPOSAL_READY" if projected <= FULL_RUNTIME_CEILING_SECONDS
                and cost <= FULL_COST_CEILING_DOLLARS
                else "P8Q_NO_ALGORITHMIC_PERFORMANCE_LEAD")
    return decision, projected, cost


def audit(archive_path: Path, output: Path) -> dict[str, object]:
    checks: OrderedDict[str, bool] = OrderedDict()
    checks["archive_regular_non_symlink"] = archive_path.is_file() and not archive_path.is_symlink()
    record: dict[str, object] = {}
    progress: list[dict[str, object]] = []
    try:
        with tarfile.open(archive_path, "r:gz") as archive:
            safe_members(archive)
            stdout = read_member(archive, "stdout.txt", 131072).decode("utf-8")
            stderr = read_member(archive, "stderr.txt", 131072).decode("utf-8")
            numerical_exit = read_member(archive, "numerical.exit.txt", 32).decode().strip()
            timed_out = read_member(archive, "timed_out.txt", 32).decode().strip()
            binary_sha = read_member(archive, "executable.sha256.txt", 128).decode().strip()
        lines = [line for line in stdout.splitlines() if line.strip()]
        record = json.loads(lines[-1]) if len(lines) == 1 else {}
        progress = [json.loads(line) for line in stderr.splitlines() if line.strip()]
    except (OSError, KeyError, ValueError, UnicodeDecodeError, json.JSONDecodeError, tarfile.TarError):
        numerical_exit, timed_out, binary_sha = "", "", ""

    checks["binary_identity"] = binary_sha == EXPECTED_BINARY_SHA
    checks["single_success_record"] = record.get("schema") == RECORD_SCHEMA and record.get("status") == "PASS"
    checks["execution_shape"] = (
        record.get("phase") == "complete" and record.get("panel_count") == PANEL_COUNT
        and record.get("thread_count") == THREAD_COUNT and record.get("target_degree") == 3
        and record.get("target_jet") == 9 and record.get("precision_bits") == 512)
    selector_ns = record.get("selector_nanoseconds")
    observer_ns = record.get("observer_nanoseconds")
    total_ns = record.get("total_nanoseconds")
    checks["phase_timings_positive_consistent"] = (
        isinstance(selector_ns, int) and selector_ns > 0 and isinstance(observer_ns, int)
        and observer_ns > 0 and isinstance(total_ns, int) and total_ns >= selector_ns + observer_ns)
    checks["p8i_and_parent_exact"] = (
        record.get("p8i_counts_equal") is True and record.get("p8i_aggregate_equal") is True
        and record.get("parent_unchanged") is True)
    checks["all_scientific_aggregates_present"] = (
        record.get("degree_bucket_capacity") == DEGREE_BUCKETS
        and isinstance(record.get("degree_terms"), list)
        and len(record.get("degree_terms", [])) == DEGREE_BUCKETS
        and isinstance(record.get("six_origin_totals"), list)
        and len(record.get("six_origin_totals", [])) == 6)
    checks["receipt_summary_exact"] = (
        record.get("callback_invocations") == PANEL_COUNT
        and record.get("progress_receipts_emitted") == PROGRESS_RECORDS
        and record.get("progress_interval") == 16 and record.get("monotone_progress") is True)
    completed = [item.get("completed_panels") for item in progress]
    timestamps = [item.get("monotonic_nanoseconds") for item in progress]
    checks["bounded_progress_records_exact"] = (
        len(progress) == PROGRESS_RECORDS
        and all(item.get("schema") == PROGRESS_SCHEMA and item.get("phase") == "observer"
                and item.get("total_panels") == PANEL_COUNT for item in progress)
        and completed == list(range(16, PANEL_COUNT + 1, 16))
        and all(isinstance(value, int) for value in timestamps)
        and timestamps == sorted(timestamps))
    checks["terminal_status_exact"] = numerical_exit == "0" and timed_out == "false"
    checks["candidate_neutral_locks"] = (
        record.get("candidate_evaluations") == 0
        and record.get("positive_parameter_samples") == 0
        and record.get("candidate_roots_created") is False
        and record.get("scientific_handler_linked") is False
        and record.get("authority_promoted") is False)

    passed = sum(checks.values())
    decision = "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED"
    projected_seconds = None
    projected_cost = None
    if passed == len(checks) and isinstance(observer_ns, int):
        decision, projected_seconds, projected_cost = classify(observer_ns)
    payload = {
        "schema": SCHEMA,
        "audit_status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "archive_sha256": sha256(archive_path) if checks["archive_regular_non_symlink"] else None,
        "p8q_decision": decision,
        "projection_rule": {
            "selector_full_seconds": SELECTOR_FULL_SECONDS,
            "selector_guard_factor": "1.25",
            "observer_width_scale": OBSERVER_SCALE,
            "observer_guard_factor": OBSERVER_GUARD,
            "runtime_ceiling_seconds": FULL_RUNTIME_CEILING_SECONDS,
            "planning_rate_per_hour": PLANNING_RATE_PER_HOUR,
            "cost_ceiling_dollars": FULL_COST_CEILING_DOLLARS,
        },
        "guarded_full_projection_seconds": projected_seconds,
        "guarded_full_projection_cost_dollars": projected_cost,
        "candidate_evaluated": False,
        "authority": {name: False for name in (
            "candidate", "proof", "geometry_state", "lane", "lamp",
            "physical", "propulsion", "transport")},
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return payload


def self_test() -> int:
    cases = [
        (1_000_000_000, "P8Q_YES_PROPOSAL_READY"),
        (1_290_000_000_000, "P8Q_YES_PROPOSAL_READY"),
        (1_291_000_000_000, "P8Q_NO_ALGORITHMIC_PERFORMANCE_LEAD"),
    ]
    checks = [classify(value)[0] == expected for value, expected in cases]
    checks.append(re.fullmatch(r"[0-9a-f]{64}", EXPECTED_BINARY_SHA) is not None)
    print(f"{sum(checks)}/{len(checks)} {'PASS' if all(checks) else 'FAIL'}")
    return 0 if all(checks) else 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        return self_test()
    if args.archive is None or args.output is None:
        parser.error("--archive and --output are required")
    result = audit(args.archive.resolve(), args.output.resolve())
    print(f"{result['checks_passed']}/{result['checks_total']} {result['audit_status']}")
    print(result["p8q_decision"])
    print(sha256(args.output.resolve()))
    return 0 if result["audit_status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
