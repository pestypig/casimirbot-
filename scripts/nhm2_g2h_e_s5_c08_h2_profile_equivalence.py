#!/usr/bin/env python3
"""Exact semantic-output comparator for the candidate-neutral H2 profiler."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
from typing import Any


TIMING_FIELDS = frozenset({"candidate_milliseconds", "cumulative_milliseconds"})


def _unique_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def load_records(path: pathlib.Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for line_number, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not raw or raw != raw.strip():
            raise ValueError(f"non-canonical line framing at {line_number}")
        value = json.loads(raw, object_pairs_hook=_unique_object)
        if not isinstance(value, dict):
            raise ValueError(f"record {line_number} is not an object")
        records.append(value)
    if not records:
        raise ValueError("empty NDJSON evidence")
    return records


def semantic_records(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for record in records:
        normalized.append({key: value for key, value in record.items()
                           if key not in TIMING_FIELDS})
    return normalized


def canonical_digest(records: list[dict[str, Any]]) -> str:
    payload = "\n".join(json.dumps(record, sort_keys=True,
                                   separators=(",", ":"))
                        for record in records) + "\n"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def compare(baseline: pathlib.Path, profile: pathlib.Path) -> dict[str, Any]:
    baseline_records = load_records(baseline)
    profile_records = load_records(profile)
    baseline_semantic = semantic_records(baseline_records)
    profile_semantic = semantic_records(profile_records)
    exact = baseline_semantic == profile_semantic
    authority_false = all(
        record.get("candidate_evaluations") == 0
        and record.get("positive_parameter_samples") == 0
        and record.get("candidate_roots_created") is False
        and record.get("scientific_handler_linked") is False
        and record.get("authority_promoted") is False
        for record in baseline_semantic + profile_semantic
    )
    return {
        "schema": "nhm2.g2h_e_s5.c08_h2_profile_equivalence.v1",
        "status": "PASS" if exact and authority_false else "FAIL",
        "record_count_equal": len(baseline_records) == len(profile_records),
        "baseline_record_count": len(baseline_records),
        "profile_record_count": len(profile_records),
        "semantic_records_equal": exact,
        "baseline_semantic_sha256": canonical_digest(baseline_semantic),
        "profile_semantic_sha256": canonical_digest(profile_semantic),
        "timing_fields_excluded_only": sorted(TIMING_FIELDS),
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", type=pathlib.Path, required=True)
    parser.add_argument("--profile", type=pathlib.Path, required=True)
    args = parser.parse_args()
    try:
        receipt = compare(args.baseline, args.profile)
    except (OSError, UnicodeError, ValueError, json.JSONDecodeError) as exc:
        receipt = {
            "schema": "nhm2.g2h_e_s5.c08_h2_profile_equivalence.v1",
            "status": "FAIL",
            "error": str(exc),
            "candidate_evaluations": 0,
            "positive_parameter_samples": 0,
            "candidate_roots_created": False,
            "scientific_handler_linked": False,
            "authority_promoted": False,
        }
    print(json.dumps(receipt, sort_keys=True, separators=(",", ":")))
    return 0 if receipt["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
