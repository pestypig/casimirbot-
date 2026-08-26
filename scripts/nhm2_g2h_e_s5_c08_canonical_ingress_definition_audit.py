#!/usr/bin/env python3
"""Exact candidate-neutral audit of the proposed C08-002 resource definition."""

from __future__ import annotations

import hashlib
import json
import math
import pathlib
import sys
from typing import Any


ROOT = pathlib.Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-canonical-ingress-resource-contract.v1.json"
BOREL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json"

EXPECTED = {
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-canonical-ingress-resource-contract.v1.json":
        "efbff4c1f9490803e7283ff8d1906fbdeedae787d78047d42f3061bd975efc48",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-wire-record-contract.v1.json":
        "c225865343ccf3c2874b59e305c70891cdd944fa3f3a88179bc55eccbf59c160",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json":
        "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-state-jet-system.v1.json":
        "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-classical-state-grid-contract.v2.json":
        "cd98fb110a6d0d94cd69d1134e8f5233444ea34f7894bc14333075d0dfa5013c",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-checkpoint-abi.v1.json":
        "6fbf6cdbb80e6da390c84f6d87f13f37f2b81b2226bf937cbcfd2c8aff3911ca",
}

PROTECTED = (
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
    "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
    "artifacts/nhm2/g2h-e-s5/executions",
)


def digest(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def reject_duplicates(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate key: {key}")
        result[key] = value
    return result


def scalar_unicode_ok(value: Any) -> bool:
    if isinstance(value, str):
        return not any(0xD800 <= ord(char) <= 0xDFFF for char in value)
    if isinstance(value, list):
        return all(scalar_unicode_ok(item) for item in value)
    if isinstance(value, dict):
        return all(scalar_unicode_ok(key) and scalar_unicode_ok(item)
                   for key, item in value.items())
    return True


def utf16_key(value: str) -> bytes:
    return value.encode("utf-16-be", "strict")


def canonical(value: Any) -> str:
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        if not math.isfinite(value):
            raise ValueError("nonfinite number")
        raise ValueError("the frozen contract unexpectedly contains a non-integer number")
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    if isinstance(value, list):
        return "[" + ",".join(canonical(item) for item in value) + "]"
    if isinstance(value, dict):
        return "{" + ",".join(
            canonical(key) + ":" + canonical(value[key])
            for key in sorted(value, key=utf16_key)
        ) + "}"
    raise TypeError(type(value).__name__)


def metrics(value: Any) -> dict[str, int]:
    result = {
        "maximum_depth": 0,
        "total_value_nodes": 0,
        "maximum_members_in_one_object": 0,
        "maximum_elements_in_one_array": 0,
        "maximum_decoded_string_utf8_bytes": 0,
        "maximum_decoded_object_key_utf8_bytes": 0,
        "numeric_value_count": 0,
    }

    def visit(item: Any, depth: int) -> None:
        result["total_value_nodes"] += 1
        result["maximum_depth"] = max(result["maximum_depth"], depth)
        if isinstance(item, bool) or item is None:
            return
        if isinstance(item, (int, float)):
            result["numeric_value_count"] += 1
            return
        if isinstance(item, str):
            result["maximum_decoded_string_utf8_bytes"] = max(
                result["maximum_decoded_string_utf8_bytes"], len(item.encode("utf-8")))
            return
        if isinstance(item, list):
            result["maximum_elements_in_one_array"] = max(
                result["maximum_elements_in_one_array"], len(item))
            for child in item:
                visit(child, depth + 1)
            return
        if isinstance(item, dict):
            result["maximum_members_in_one_object"] = max(
                result["maximum_members_in_one_object"], len(item))
            for key, child in item.items():
                result["maximum_decoded_object_key_utf8_bytes"] = max(
                    result["maximum_decoded_object_key_utf8_bytes"],
                    len(key.encode("utf-8")))
                visit(child, depth + 1)
            return
        raise TypeError(type(item).__name__)

    visit(value, 0)
    return result


def main() -> int:
    checks: list[tuple[str, bool]] = []

    for relative, expected in EXPECTED.items():
        checks.append((f"raw_hash:{relative}", digest(ROOT / relative) == expected))
    checks.append(("protected_roots_absent", all(not (ROOT / path).exists() for path in PROTECTED)))

    proposal = json.loads(PROPOSAL.read_text(encoding="utf-8"), object_pairs_hook=reject_duplicates)
    borel_raw = BOREL.read_bytes()
    checks.append(("borel_no_bom", not borel_raw.startswith(b"\xef\xbb\xbf")))
    borel = json.loads(borel_raw.decode("utf-8"), object_pairs_hook=reject_duplicates)
    checks.append(("unicode_scalar_values_only", scalar_unicode_ok(borel)))

    measured = metrics(borel)
    expected_measured = proposal["measured_frozen_contract_footprint"]
    for key in measured:
        checks.append((f"measured:{key}", measured[key] == expected_measured[key]))
    checks.append(("measured_raw_bytes", len(borel_raw) == expected_measured["raw_input_bytes"] == 54972))
    checks.append(("all_contract_numbers_are_nonnegative_integers",
                   all(not isinstance(value, float) for value in _all_values(borel))))

    canonical_bytes = canonical(borel).encode("utf-8")
    domain = proposal["hash_bindings"]["canonical_domain_utf8"].encode("utf-8")
    canonical_hash = hashlib.sha256(domain + canonical_bytes).hexdigest()
    checks.append(("canonical_byte_count", len(canonical_bytes) == 49780
                   == proposal["hash_bindings"]["expected_canonical_bytes"]))
    checks.append(("canonical_domain_hash", canonical_hash
                   == proposal["hash_bindings"]["expected_canonical_sha256"]
                   == "665b6d9ddd9d2108274652414ec9d6a0a2fb43f86f28ab3ab64db70003c7f520"))

    bounds = proposal["fixed_ingress_resource_bounds"]
    exact_bounds = {
        "maximum_raw_input_bytes": 65536,
        "maximum_canonical_output_bytes": 65536,
        "maximum_depth": 8,
        "maximum_total_value_nodes": 1024,
        "maximum_members_per_object": 64,
        "maximum_elements_per_array": 64,
        "maximum_decoded_string_utf8_bytes": 1024,
        "maximum_decoded_object_key_utf8_bytes": 128,
        "maximum_cumulative_decoded_string_utf8_bytes": 65536,
        "maximum_number_lexeme_bytes": 64,
    }
    checks.append(("exact_fixed_bounds", all(bounds[key] == value for key, value in exact_bounds.items())))
    checks.append(("measured_values_strictly_within_bounds",
                   len(borel_raw) < bounds["maximum_raw_input_bytes"]
                   and len(canonical_bytes) < bounds["maximum_canonical_output_bytes"]
                   and measured["maximum_depth"] < bounds["maximum_depth"]
                   and measured["total_value_nodes"] < bounds["maximum_total_value_nodes"]
                   and measured["maximum_members_in_one_object"] < bounds["maximum_members_per_object"]
                   and measured["maximum_elements_in_one_array"] < bounds["maximum_elements_per_array"]
                   and measured["maximum_decoded_string_utf8_bytes"] < bounds["maximum_decoded_string_utf8_bytes"]
                   and measured["maximum_decoded_object_key_utf8_bytes"] < bounds["maximum_decoded_object_key_utf8_bytes"]))
    checks.append(("power_of_two_bounds", all(value > 0 and value & (value - 1) == 0
                                               for value in exact_bounds.values())))

    scope = proposal["scope"]
    checks.append(("scope_exact_borel_only", scope["admitted_value"].endswith("contract file only")
                   and scope["admitted_raw_bytes"] == 54972
                   and scope["admitted_raw_sha256"] == EXPECTED[str(BOREL.relative_to(ROOT)).replace("\\", "/")]
                   and "C08 scientific output payload" in scope["excluded"]
                   and "C08-021 record envelope or ledger stream" in scope["excluded"]))
    checks.append(("failure_code_exact", scope["c08_failure_code"] == "C08-002_CANONICAL_JSON_OR_HASH"))
    checks.append(("validation_order_total", len(proposal["ordered_validation_and_failure_precedence"]) == 10
                   and proposal["ordered_validation_and_failure_precedence"][0].startswith("001 ")
                   and proposal["ordered_validation_and_failure_precedence"][-1].startswith("010 ")))
    checks.append(("hash_domains_inherited", proposal["hash_bindings"]["inherited_payload_domain_utf8"]
                   == "nhm2-g2h-e-s4/payload/v1\n"
                   and proposal["hash_bindings"]["inherited_record_domain_utf8"]
                   == "nhm2-g2h-e-s4/record/v1\n"
                   and proposal["hash_bindings"]["inherited_manifest_self_domain_utf8"]
                   == "nhm2-g2h-e-s4/manifest-self/v1\n"
                   and proposal["hash_bindings"]["inherited_stream_domain_utf8"]
                   == "nhm2-g2h-e-s4/stream/v1\n"))
    checks.append(("parser_semantics_fail_closed", proposal["wire_and_canonicalization"]["bom"] == "reject"
                   and proposal["wire_and_canonicalization"]["invalid_utf8"] == "reject"
                   and proposal["wire_and_canonicalization"]["nonfinite_number"] == "reject"
                   and "before object construction" in proposal["wire_and_canonicalization"]["duplicate_rule"]))
    checks.append(("fixture_matrix_complete", len(proposal["candidate_neutral_fixture_matrix"]) == 18))
    checks.append(("acknowledgement_required", proposal["acknowledgement_boundary"]["required_before_implementation"] is True
                   and proposal["readiness"]["independent_parent_acknowledgement_complete"] is False
                   and proposal["readiness"]["implementation_authorized"] is False))
    checks.append(("proposal_unsealed", proposal["status"]
                   == "proposal_unsealed_pending_independent_parent_acknowledgement_no_implementation_authority"))
    checks.append(("authority_all_false", all(value is False for value in proposal["authority"].values())))

    passed = sum(ok for _, ok in checks)
    report = {
        "schema": "nhm2.g2h_e_s5.c08_canonical_ingress_definition_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "failures": [name for name, ok in checks if not ok],
        "proposal_raw_sha256": digest(PROPOSAL),
        "borel_contract_canonical_bytes": len(canonical_bytes),
        "borel_contract_canonical_sha256": canonical_hash,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "implementation_authorized": False,
        "authority_promoted": False,
    }
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if report["status"] == "PASS" else 1


def _all_values(value: Any):
    yield value
    if isinstance(value, list):
        for item in value:
            yield from _all_values(item)
    elif isinstance(value, dict):
        for key, item in value.items():
            yield key
            yield from _all_values(item)


if __name__ == "__main__":
    sys.exit(main())
