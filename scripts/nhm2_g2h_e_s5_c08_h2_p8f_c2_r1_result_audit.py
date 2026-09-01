#!/usr/bin/env python3
"""Fail-closed result audit for the immutable H2-P8F-C2-R1 capture.

This reader never invokes Docker, runs numerical code, mutates evidence, or
promotes scientific authority.  Arb decimal balls are replayed as closed
Decimal intervals; causal comparisons require strict interval separation.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import OrderedDict
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, InvalidOperation, localcontext
from pathlib import Path


SCHEMA = "nhm2.g2h_e_s5.c08_h2_p8f_c1_cloud_representative.v1"
AUDIT_SCHEMA = "nhm2.g2h_e_s5.c08_h2_p8f_c2_r1_result_audit.v1"
PROGRESS_SCHEMA = "nhm2.g2h_e_s5.c08_h2_p8f_c1_progress.v1"
CONTAINER_ID = "82dd2e3e412a030bbe6c6e8ae787ad9ffe96d9a0e9b314bfc3d2555c28d68d3e"
IMAGE_ID = "sha256:d6baac26c7806cb23c84d432c9d11b91f8d99b31e802b04d61698714476b1352"
EXECUTABLE_SHA256 = "141408979c900f417409e2bf7fe0c1e0ecec7b859e0063e2eca9e4a36721bad6"
ENTRYPOINT = "/usr/local/bin/mini-boson-star-primary-c08-h2-p8f-c2-r1-cloud-representative-v1"
TIMEOUT_SECONDS = 86_400
REQUIRED_HASHES = {
    "container.id.txt": "4987503d7723a07f17a57492cfe1149a8e9de8de6b25c43acdc630cdc2a567e3",
    "container.inspect.json": "aaaf66b646c4487637fb5eff5a70e56ef72539b9fd28ff2f4fef3cd7669bbb03",
    "controller.exit.txt": "9a271f2a916b0b6ee6cecb2426f0b3206ef074578be55d9bc94f6f3fe3ab86aa",
    "executable.sha256.txt": "eb1daa3f95e0d21968a45494735e5cac2ae633dd7cf74e333947982db8ac799a",
    "finish.utc.txt": "c6d00333820115a07d8f1b6f9bccfcb771bb523b70f08242bfe3f177d1747af3",
    "image.inspect.json": "926de3659906da9093f2c9d3d5a66473a5db099f059051dddb00debd4da25e67",
    "p8f-c2-r1-docker-build.txt": "6922055dd84e9298fce4f91cf601ffb9e62d979f6a76cdddf3b40258f6178445",
    "p8f-c2-r1-docker-load.txt": "c77e7396a971b27f033927291ebbe6218ac25b787987f8c7a6f713dcbb48cd52",
    "phase.txt": "5219e9e81ca35360976bd913981befedd6ec2ea8d11e441e746ea6887ec7f54a",
    "start.utc.txt": "df3785af364b204a14699e78029658b248080c020dda38b1ad5d6c1cdbddd0ab",
    "stderr.txt": "c03321f319862ea5b8a82fc112a924547751f70637a977582bc0f0bd181aea50",
    "stdout.txt": "d58e0c81dd62ed306225f9ecb75d8412aa794901cbb47836b02b5e1936520201",
    "timed_out.txt": "2ed27c1421e6928dbe13dbfdb5c59e1045b30341fe7ebe05700006bc5ac572c0",
}
BALL = re.compile(r"^\[([+\-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+\-]?\d+)?) \+/- ([+\-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+\-]?\d+)?)\]$")


@dataclass(frozen=True)
class Interval:
    low: Decimal
    high: Decimal

    def overlaps(self, other: "Interval") -> bool:
        return self.low <= other.high and other.low <= self.high


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


def safe_json(path: Path) -> object | None:
    try:
        return json.loads(text(path))
    except json.JSONDecodeError:
        return None


def ball(value: object) -> Interval | None:
    if not isinstance(value, str):
        return None
    match = BALL.fullmatch(value)
    if not match:
        return None
    try:
        midpoint, radius = (Decimal(item) for item in match.groups())
    except InvalidOperation:
        return None
    if not midpoint.is_finite() or not radius.is_finite() or radius < 0:
        return None
    return Interval(midpoint - radius, midpoint + radius)


def add(items: list[Interval]) -> Interval:
    return Interval(sum((item.low for item in items), Decimal(0)),
                    sum((item.high for item in items), Decimal(0)))


def divide(left: Interval, right: Interval) -> Interval | None:
    if right.low <= 0:
        return None
    return Interval(left.low / right.high, left.high / right.low)


def classify(final: Interval, elementary: Interval, boundary: Interval,
             nonboundary: Interval, slots: list[Interval]) -> tuple[str, dict[str, object]]:
    unique = [i for i, item in enumerate(slots)
              if all(i == j or item.low > other.high for j, other in enumerate(slots))]
    facts = {
        "outer_strictly_separated": final.low > elementary.high,
        "boundary_strictly_separated": boundary.low > nonboundary.high,
        "unique_strict_largest_slot": unique[0] if len(unique) == 1 else None,
    }
    if facts["outer_strictly_separated"]:
        return "P8G_OUTER_ACCUMULATION_ARITHMETIC_LEAD", facts
    if facts["boundary_strictly_separated"]:
        return "P8G_BOUNDARY_CONTRIBUTION_ENCLOSURE_LEAD", facts
    if len(unique) == 1:
        return f"P8G_NONBOUNDARY_SLOT_{unique[0]}_ENCLOSURE_LEAD", facts
    return "P8G_DISTRIBUTED_NONBOUNDARY_ENCLOSURE_LEAD", facts


def audit(capture: Path, output: Path) -> dict[str, object]:
    checks: OrderedDict[str, bool] = OrderedDict()
    checks["capture_is_directory"] = capture.is_dir()
    names = {item.name for item in capture.iterdir()} if capture.is_dir() else set()
    checks["exact_13_file_inventory"] = names == set(REQUIRED_HASHES)
    checks["all_members_regular_non_symlinks"] = capture.is_dir() and all(
        item.is_file() and not item.is_symlink() for item in capture.iterdir())
    actual_hashes = {name: sha256(capture / name) for name in sorted(names)
                     if (capture / name).is_file() and not (capture / name).is_symlink()}
    checks["all_evidence_hashes_exact"] = actual_hashes == REQUIRED_HASHES
    checks["container_id_exact"] = one_line(capture / "container.id.txt") == CONTAINER_ID
    checks["executable_id_exact"] = one_line(capture / "executable.sha256.txt") == EXECUTABLE_SHA256
    checks["phase_exact"] = one_line(capture / "phase.txt") == "numerical_execution"
    checks["exit_zero_non_timeout"] = (one_line(capture / "controller.exit.txt") == "0"
                                       and one_line(capture / "timed_out.txt") == "false")

    image = safe_json(capture / "image.inspect.json")
    image_item = image[0] if isinstance(image, list) and len(image) == 1 and isinstance(image[0], dict) else {}
    checks["image_inspect_exact"] = (image_item.get("Id") == IMAGE_ID
                                      and image_item.get("Architecture") == "amd64"
                                      and image_item.get("Os") == "linux"
                                      and image_item.get("Config", {}).get("Entrypoint") == [ENTRYPOINT])
    inspected = safe_json(capture / "container.inspect.json")
    container = inspected[0] if isinstance(inspected, list) and len(inspected) == 1 and isinstance(inspected[0], dict) else {}
    state = container.get("State", {}) if isinstance(container.get("State"), dict) else {}
    host = container.get("HostConfig", {}) if isinstance(container.get("HostConfig"), dict) else {}
    config = container.get("Config", {}) if isinstance(container.get("Config"), dict) else {}
    checks["container_inspect_identity_and_exit"] = (
        container.get("Id") == CONTAINER_ID and container.get("Image") == IMAGE_ID
        and state.get("Status") == "exited" and state.get("Running") is False
        and state.get("OOMKilled") is False and state.get("ExitCode") == 0
        and container.get("RestartCount") == 0)
    checks["container_isolation_exact"] = (
        host.get("NetworkMode") == "none" and host.get("ReadonlyRootfs") is True
        and host.get("CapDrop") == ["ALL"] and host.get("NanoCpus") == 32_000_000_000
        and host.get("RestartPolicy", {}).get("Name") == "no"
        and config.get("Entrypoint") == [ENTRYPOINT])

    try:
        started = datetime.fromisoformat(one_line(capture / "start.utc.txt").replace("Z", "+00:00"))
        finished = datetime.fromisoformat(one_line(capture / "finish.utc.txt").replace("Z", "+00:00"))
        elapsed = (finished - started).total_seconds()
    except ValueError:
        elapsed = None
    checks["chronology_ordered_and_bounded"] = elapsed is not None and 0 <= elapsed <= TIMEOUT_SECONDS + 90

    progress = []
    for line in text(capture / "stderr.txt").splitlines():
        try:
            item = json.loads(line)
        except json.JSONDecodeError:
            item = None
        progress.append(item)
    checks["progress_exact_64_monotone_markers"] = (
        len(progress) == 64 and all(isinstance(item, dict) for item in progress)
        and all(item == {"schema": PROGRESS_SCHEMA, "completed_panels": (i + 1) * 1024,
                         "total_panels": 65_536} for i, item in enumerate(progress)))

    lines = text(capture / "stdout.txt").splitlines()
    try:
        record = json.loads(lines[0]) if len(lines) == 1 else {}
    except json.JSONDecodeError:
        record = {}
    record = record if isinstance(record, dict) else {}
    checks["record_schema_status_exact"] = record.get("schema") == SCHEMA and record.get("status") == "PASS" and record.get("phase") == "complete"
    checks["fixed_target_and_work_counts_exact"] = all((
        record.get("panel_count") == 65_536, record.get("thread_count") == 32,
        record.get("target_degree") == 3, record.get("target_jet") == 9,
        record.get("terms_per_panel") == 4, record.get("elementary_terms_observed") == 262_144,
        record.get("refinement_candidates_visited") == 1,
        record.get("subpanels_accumulated") == 65_536,
        record.get("jet_predecessor_calls") == 65_536,
        record.get("elementary_convolutions") == 2_818_048,
        record.get("numerical_width_checks") == 0,
    ))
    checks["reconstruction_parent_invariants"] = all((
        record.get("all_panel_reconstructions_equal") is True,
        record.get("final_reconstruction_equal") is True,
        record.get("parent_unchanged") is True,
    ))
    checks["authority_locks_false"] = all((
        record.get("candidate_evaluations") == 0,
        record.get("positive_parameter_samples") == 0,
        record.get("candidate_roots_created") is False,
        record.get("scientific_handler_linked") is False,
        record.get("authority_promoted") is False,
    ))

    scalar_names = ("final_radius", "final_threshold", "final_ratio", "boundary_panel_radius",
                    "nonboundary_panel_radius_sum", "total_elementary_radius_sum",
                    "final_to_elementary_radius_ratio", "maximum_elementary_radius")
    values = {name: ball(record.get(name)) for name in scalar_names}
    slots_raw = record.get("slot_radius_sums")
    magnitudes_raw = record.get("slot_upper_magnitude_sums")
    slots = [ball(item) for item in slots_raw] if isinstance(slots_raw, list) else []
    magnitudes = [ball(item) for item in magnitudes_raw] if isinstance(magnitudes_raw, list) else []
    checks["all_arb_balls_parse_and_are_positive"] = (
        all(item is not None and item.low > 0 for item in values.values())
        and len(slots) == 4 and all(item is not None and item.low >= 0 for item in slots)
        and len(magnitudes) == 4 and all(item is not None and item.low >= 0 for item in magnitudes))
    valid = checks["all_arb_balls_parse_and_are_positive"]
    classification, facts = "P8F_C2_R1_UNCLASSIFIED_INVALID_INTERVAL", {}
    if valid:
        exact = {name: item for name, item in values.items() if item is not None}
        exact_slots = [item for item in slots if item is not None]
        with localcontext() as context:
            context.prec = 220
            q1 = divide(exact["final_radius"], exact["final_threshold"])
            q2 = divide(exact["final_radius"], exact["total_elementary_radius_sum"])
            checks["reported_ratio_intervals_replay"] = bool(
                q1 and q2 and q1.overlaps(exact["final_ratio"])
                and q2.overlaps(exact["final_to_elementary_radius_ratio"]))
            checks["slot_sum_interval_replays_total"] = add(exact_slots).overlaps(exact["total_elementary_radius_sum"])
            checks["unchanged_width_control_strictly_above_one"] = exact["final_ratio"].low > 1
            classification, facts = classify(
                exact["final_radius"], exact["total_elementary_radius_sum"],
                exact["boundary_panel_radius"], exact["nonboundary_panel_radius_sum"], exact_slots)
    else:
        checks["reported_ratio_intervals_replay"] = False
        checks["slot_sum_interval_replays_total"] = False
        checks["unchanged_width_control_strictly_above_one"] = False
    checks["maximum_elementary_location_exact"] = record.get("maximum_elementary_panel_ordinal") == 0 and record.get("maximum_elementary_slot") == 3

    passed = all(checks.values())
    result = {
        "schema": AUDIT_SCHEMA,
        "audit_status": "PASS" if passed else "FAIL",
        "result_classification": classification if passed else "AUDIT_FAIL",
        "checks_passed": sum(checks.values()), "checks_total": len(checks),
        "checks": checks, "elapsed_seconds": elapsed,
        "causal_facts": facts if passed else {}, "terminal_record": record or None,
        "evidence_sha256": actual_hashes, "candidate_evaluated": False,
        "authority": {name: False for name in ("candidate", "proof", "geometry_state", "lane", "lamp", "physical", "propulsion", "transport")},
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return result


def self_test() -> int:
    def b(mid: str, rad: str = "0") -> Interval:
        value = ball(f"[{mid} +/- {rad}]")
        assert value is not None
        return value
    checks = [
        ball("[1.0e-4 +/- 2e-9]") == Interval(Decimal("0.000099998"), Decimal("0.000100002")),
        ball("1.0") is None, ball("[1 +/- -1]") is None,
        divide(b("12"), b("10")) == Interval(Decimal("1.2"), Decimal("1.2")),
        add([b("1"), b("2"), b("3"), b("4")]) == b("10"),
        classify(b("12"), b("10"), b("1"), b("9"), [b("1"), b("2"), b("3"), b("4")])[0] == "P8G_OUTER_ACCUMULATION_ARITHMETIC_LEAD",
        classify(b("10"), b("10"), b("9"), b("8"), [b("1"), b("2"), b("3"), b("4")])[0] == "P8G_BOUNDARY_CONTRIBUTION_ENCLOSURE_LEAD",
        classify(b("10"), b("10"), b("8"), b("9"), [b("1"), b("2"), b("5"), b("4")])[0] == "P8G_NONBOUNDARY_SLOT_2_ENCLOSURE_LEAD",
        classify(b("10"), b("10"), b("8"), b("9"), [b("4"), b("4"), b("3"), b("2")])[0] == "P8G_DISTRIBUTED_NONBOUNDARY_ENCLOSURE_LEAD",
        not b("1", "0.2").overlaps(b("2", "0.2")), b("1", "0.2").overlaps(b("1.3", "0.2")),
    ]
    print(f"{sum(checks)}/{len(checks)} {'PASS' if all(checks) else 'FAIL'}")
    return 0 if all(checks) else 1


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
