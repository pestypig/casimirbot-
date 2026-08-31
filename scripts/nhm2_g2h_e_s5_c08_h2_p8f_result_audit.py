#!/usr/bin/env python3
"""Fail-closed audit and preregistered causal classification for H2-P8F.

The audit reads a completed local evidence root.  It never inspects a running
container, invokes Docker, evaluates a candidate, or promotes authority.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import tempfile
from collections import OrderedDict
from datetime import datetime
from decimal import Decimal, InvalidOperation, localcontext
from pathlib import Path


SCHEMA = "nhm2.g2h_e_s5.c08_h2_p8f_representative.v1"
AUDIT_SCHEMA = "nhm2.g2h_e_s5.c08_h2_p8f_result_audit.v1"
IMAGE_ID = "sha256:ec6ab2ada583d575fd2faedbef0ec6bdb865c44014d3eb3660a8b5c537c2defd"
EXECUTABLE_SHA256 = "12aa0158d56340a7fb7a545c4d2a5bc918c76148ba37548de2988cb968790d20"
CONTAINER_ID = "8cacecb98e7855f05af70d2d89c15f20f3df8fb865a69255ad1aab76d1252ec1"
TIMEOUT_SECONDS = 43_200
REQUIRED_FILES = {
    "container.id.txt", "executable.sha256.txt", "image.id.txt",
    "start.utc.txt", "finish.utc.txt", "exit.code.txt", "timed_out.txt",
    "stdout.txt", "stderr.txt", "container.inspect.json",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return ""


def one_line(path: Path) -> str:
    value = text(path)
    return value.strip() if value.count("\n") <= 1 else ""


def iso8601(value: str) -> datetime | None:
    try:
        return datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except ValueError:
        return None


def decimal(value: object) -> Decimal | None:
    try:
        parsed = Decimal(str(value))
        return parsed if parsed.is_finite() else None
    except (InvalidOperation, ValueError):
        return None


def close_decimal(left: Decimal, right: Decimal) -> bool:
    scale = max(abs(left), abs(right), Decimal(1))
    return abs(left - right) <= Decimal("1e-30") * scale


def authority_false(record: dict[str, object]) -> bool:
    return (
        record.get("candidate_evaluations") == 0
        and record.get("positive_parameter_samples") == 0
        and record.get("candidate_roots_created") is False
        and record.get("scientific_handler_linked") is False
        and record.get("authority_promoted") is False
    )


def parse_terminal_record(stdout: str) -> dict[str, object]:
    lines = stdout.splitlines()
    if len(lines) != 1:
        return {}
    try:
        value = json.loads(lines[0])
    except json.JSONDecodeError:
        return {}
    return value if isinstance(value, dict) else {}


def classify(record: dict[str, object]) -> tuple[str, dict[str, object]]:
    final_radius = decimal(record.get("final_radius"))
    elementary = decimal(record.get("total_elementary_radius_sum"))
    boundary = decimal(record.get("boundary_panel_radius"))
    nonboundary = decimal(record.get("nonboundary_panel_radius_sum"))
    slots = [decimal(item) for item in record.get("slot_radius_sums", [])]
    if any(item is None for item in (final_radius, elementary, boundary, nonboundary)):
        return "P8F_UNCLASSIFIED_INVALID_DECIMAL", {}
    if len(slots) != 4 or any(item is None for item in slots):
        return "P8F_UNCLASSIFIED_INVALID_SLOT_INVENTORY", {}
    assert final_radius is not None and elementary is not None
    assert boundary is not None and nonboundary is not None
    exact_slots = [item for item in slots if item is not None]
    largest = max(exact_slots)
    maxima = [index for index, item in enumerate(exact_slots) if item == largest]
    facts: dict[str, object] = {
        "outer_exceeds_elementary": final_radius > elementary,
        "boundary_exceeds_nonboundary": boundary > nonboundary,
        "unique_largest_slot": maxima[0] if len(maxima) == 1 else None,
        "largest_elementary_panel_ordinal": record.get("maximum_elementary_panel_ordinal"),
        "largest_elementary_slot": record.get("maximum_elementary_slot"),
    }
    if final_radius > elementary:
        return "P8G_OUTER_ACCUMULATION_ARITHMETIC_LEAD", facts
    if boundary > nonboundary:
        return "P8G_BOUNDARY_CONTRIBUTION_ENCLOSURE_LEAD", facts
    if len(maxima) == 1:
        return f"P8G_NONBOUNDARY_SLOT_{maxima[0]}_ENCLOSURE_LEAD", facts
    return "P8G_DISTRIBUTED_NONBOUNDARY_ENCLOSURE_LEAD", facts


def audit(capture: Path, output: Path) -> dict[str, object]:
    checks: OrderedDict[str, bool] = OrderedDict()
    checks["capture_is_directory"] = capture.is_dir()
    names = {item.name for item in capture.iterdir()} if capture.is_dir() else set()
    checks["exact_terminal_file_inventory"] = names == REQUIRED_FILES
    checks["all_members_regular_files"] = capture.is_dir() and all(
        item.is_file() and not item.is_symlink() for item in capture.iterdir()
    )
    checks["container_identity_exact"] = one_line(capture / "container.id.txt") == CONTAINER_ID
    checks["image_identity_exact"] = one_line(capture / "image.id.txt") == IMAGE_ID
    checks["executable_identity_exact"] = one_line(capture / "executable.sha256.txt") == EXECUTABLE_SHA256

    started = iso8601(one_line(capture / "start.utc.txt"))
    finished = iso8601(one_line(capture / "finish.utc.txt"))
    elapsed = (finished - started).total_seconds() if started and finished else None
    checks["chronology_complete_ordered"] = elapsed is not None and elapsed >= 0
    checks["aggregate_timeout_respected"] = elapsed is not None and elapsed <= TIMEOUT_SECONDS + 90
    try:
        exit_code = int(one_line(capture / "exit.code.txt"))
    except ValueError:
        exit_code = None
    timed_out_text = one_line(capture / "timed_out.txt")
    checks["timeout_bit_total"] = timed_out_text in {"true", "false"}
    timed_out = timed_out_text == "true"

    stdout = text(capture / "stdout.txt")
    stderr = text(capture / "stderr.txt")
    record = parse_terminal_record(stdout)
    status = record.get("status")
    checks["terminal_payload_or_bounded_timeout"] = bool(record) or timed_out
    checks["record_schema_exact_when_present"] = not record or record.get("schema") == SCHEMA
    checks["authority_locks_false_when_present"] = not record or authority_false(record)
    checks["container_inspect_is_json"] = isinstance(
        _safe_json(capture / "container.inspect.json"), list
    )

    success = status == "PASS"
    if success:
        slots = record.get("slot_radius_sums")
        magnitudes = record.get("slot_upper_magnitude_sums")
        values = {
            name: decimal(record.get(name)) for name in (
                "final_radius", "final_threshold", "final_ratio",
                "boundary_panel_radius", "nonboundary_panel_radius_sum",
                "total_elementary_radius_sum", "final_to_elementary_radius_ratio",
                "maximum_elementary_radius",
            )
        }
        checks["fixed_representative_target_exact"] = (
            record.get("panel_count") == 65_536
            and record.get("thread_count") == 16
            and record.get("target_degree") == 3
            and record.get("target_jet") == 9
            and record.get("terms_per_panel") == 4
            and record.get("elementary_terms_observed") == 262_144
        )
        checks["reconstruction_and_parent_invariants"] = (
            record.get("all_panel_reconstructions_equal") is True
            and record.get("final_reconstruction_equal") is True
            and record.get("parent_unchanged") is True
        )
        checks["bounded_slot_inventories"] = (
            isinstance(slots, list) and len(slots) == 4
            and isinstance(magnitudes, list) and len(magnitudes) == 4
        )
        parsed_slots = [decimal(item) for item in slots] if isinstance(slots, list) else []
        parsed_magnitudes = [decimal(item) for item in magnitudes] if isinstance(magnitudes, list) else []
        checks["all_directed_decimals_positive"] = (
            all(item is not None and item > 0 for item in values.values())
            and all(item is not None and item >= 0 for item in parsed_slots)
            and all(item is not None and item >= 0 for item in parsed_magnitudes)
        )
        final = values["final_radius"]
        threshold = values["final_threshold"]
        ratio = values["final_ratio"]
        total = values["total_elementary_radius_sum"]
        final_to_total = values["final_to_elementary_radius_ratio"]
        with localcontext() as context:
            context.prec = 100
            checks["reported_ratios_replay"] = bool(
                final and threshold and ratio and total and final_to_total
                and close_decimal(final / threshold, ratio)
                and close_decimal(final / total, final_to_total)
            )
            checks["slot_sum_replays_elementary_total"] = bool(
                total is not None and len(parsed_slots) == 4
                and all(item is not None for item in parsed_slots)
                and close_decimal(sum(item for item in parsed_slots if item is not None), total)
            )
        checks["representative_width_failure_reproduced"] = ratio is not None and ratio > 1
        checks["maximum_elementary_location_bounded"] = (
            isinstance(record.get("maximum_elementary_panel_ordinal"), int)
            and 0 <= record["maximum_elementary_panel_ordinal"] < 65_536
            and isinstance(record.get("maximum_elementary_slot"), int)
            and 0 <= record["maximum_elementary_slot"] < 4
        )
        checks["one_candidate_only_no_width_decision"] = (
            record.get("refinement_candidates_visited") == 1
            and record.get("subpanels_accumulated") == 65_536
            and record.get("numerical_width_checks") == 0
        )
        checks["successful_process_disposition"] = exit_code == 0 and not timed_out and stderr == "\n"
    else:
        checks["nonpass_disposition_bounded"] = (
            (timed_out and exit_code in {124, 137, 143})
            or (status == "FAIL" and exit_code not in {None, 0} and authority_false(record))
        )

    audit_pass = all(checks.values())
    if audit_pass and success:
        classification, facts = classify(record)
    elif audit_pass and timed_out:
        classification, facts = "P8F_TIMEOUT_PARTIAL_NO_CAUSAL_SELECTION", {}
    elif audit_pass:
        classification, facts = "P8F_EXECUTION_FAIL_NO_CAUSAL_SELECTION", {}
    else:
        classification, facts = "AUDIT_FAIL", {}
    payload: dict[str, object] = {
        "schema": AUDIT_SCHEMA,
        "audit_status": "PASS" if audit_pass else "FAIL",
        "result_classification": classification,
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "checks": checks,
        "elapsed_seconds": elapsed,
        "exit_code": exit_code,
        "timed_out": timed_out,
        "terminal_record": record if record else None,
        "causal_facts": facts,
        "evidence_sha256": {
            name: sha256(capture / name) for name in sorted(names)
            if (capture / name).is_file()
        },
        "candidate_evaluated": False,
        "authority": {name: False for name in (
            "candidate", "proof", "geometry_state", "lane", "lamp",
            "physical", "propulsion", "transport",
        )},
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return payload


def _safe_json(path: Path) -> object | None:
    try:
        return json.loads(text(path))
    except json.JSONDecodeError:
        return None


def make_fixture(root: Path, kind: str) -> Path:
    capture = root / kind.lower()
    capture.mkdir()
    (capture / "container.id.txt").write_text(CONTAINER_ID + "\n", encoding="utf-8")
    (capture / "image.id.txt").write_text(IMAGE_ID + "\n", encoding="utf-8")
    (capture / "executable.sha256.txt").write_text(EXECUTABLE_SHA256 + "\n", encoding="utf-8")
    (capture / "start.utc.txt").write_text("2026-08-30T20:43:38+00:00\n", encoding="utf-8")
    (capture / "finish.utc.txt").write_text("2026-08-30T21:43:38+00:00\n", encoding="utf-8")
    (capture / "container.inspect.json").write_text("[]\n", encoding="utf-8")
    record: dict[str, object] = {
        "schema": SCHEMA, "status": "PASS", "phase": "complete",
        "panel_count": 65_536, "thread_count": 16, "target_degree": 3,
        "target_jet": 9, "terms_per_panel": 4,
        "elementary_terms_observed": 262_144,
        "all_panel_reconstructions_equal": True,
        "final_reconstruction_equal": True, "final_radius": "12",
        "final_threshold": "10", "final_ratio": "1.2",
        "slot_radius_sums": ["1", "2", "3", "4"],
        "slot_upper_magnitude_sums": ["2", "3", "4", "5"],
        "boundary_panel_radius": "1", "nonboundary_panel_radius_sum": "9",
        "total_elementary_radius_sum": "10",
        "final_to_elementary_radius_ratio": "1.2",
        "maximum_elementary_radius": "0.1",
        "maximum_elementary_panel_ordinal": 7,
        "maximum_elementary_slot": 3, "parent_unchanged": True,
        "refinement_candidates_visited": 1, "subpanels_accumulated": 65_536,
        "jet_predecessor_calls": 1, "elementary_convolutions": 262_144,
        "numerical_width_checks": 0, "candidate_evaluations": 0,
        "positive_parameter_samples": 0, "candidate_roots_created": False,
        "scientific_handler_linked": False, "authority_promoted": False,
    }
    if kind == "PASS":
        stdout, stderr, exit_code, timeout = json.dumps(record, separators=(",", ":")) + "\n", "\n", "0\n", "false\n"
    elif kind == "FAIL":
        record = {"schema": SCHEMA, "status": "FAIL", "phase": "h2_initialize",
                  "candidate_evaluations": 0, "positive_parameter_samples": 0,
                  "candidate_roots_created": False, "scientific_handler_linked": False,
                  "authority_promoted": False}
        stdout, stderr, exit_code, timeout = json.dumps(record, separators=(",", ":")) + "\n", "failure\n", "1\n", "false\n"
    else:
        stdout, stderr, exit_code, timeout = "\n", "\n", "137\n", "true\n"
    (capture / "stdout.txt").write_text(stdout, encoding="utf-8")
    (capture / "stderr.txt").write_text(stderr, encoding="utf-8")
    (capture / "exit.code.txt").write_text(exit_code, encoding="utf-8")
    (capture / "timed_out.txt").write_text(timeout, encoding="utf-8")
    return capture


def self_test() -> int:
    with tempfile.TemporaryDirectory(prefix="nhm2-p8f-audit-") as temp:
        root = Path(temp)
        expected = {
            "PASS": "P8G_OUTER_ACCUMULATION_ARITHMETIC_LEAD",
            "FAIL": "P8F_EXECUTION_FAIL_NO_CAUSAL_SELECTION",
            "TIMEOUT": "P8F_TIMEOUT_PARTIAL_NO_CAUSAL_SELECTION",
        }
        checks = []
        for kind, classification in expected.items():
            result = audit(make_fixture(root, kind), root / f"{kind}.json")
            checks.append(result["audit_status"] == "PASS" and result["result_classification"] == classification)
        corrupt = make_fixture(root, "PASS_CORRUPT")
        (corrupt / "container.id.txt").write_text("wrong\n", encoding="utf-8")
        result = audit(corrupt, root / "corrupt.json")
        checks.append(result["audit_status"] == "FAIL")
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
        parser.error("--capture-dir and --output are required")
    result = audit(args.capture_dir.resolve(), args.output.resolve())
    print(f"{result['checks_passed']}/{result['checks_total']} {result['audit_status']}")
    print(result["result_classification"])
    print(sha256(args.output.resolve()))
    return 0 if result["audit_status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
