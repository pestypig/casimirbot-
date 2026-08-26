#!/usr/bin/env python3
"""Mechanical fixture audit for the draft S4 wire/record contract.

This is representation-only. It never loads or evaluates candidate data and it
does not create an output root or proof receipt.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import json
import math
from pathlib import Path
import re
import sys
from typing import Any, Callable


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-wire-record-contract.v1.json"
R2_SHA = "041c406c4113c6915bf02db36c1fadd2ad685278ce9d2ce445da5176a90ed12a"
ZERO_SHA = "0" * 64
SAFE_INTEGER = 9_007_199_254_740_991
DECIMAL = re.compile(r"-?(?:0|[1-9][0-9]*)\Z")
POSITIVE_DECIMAL = re.compile(r"[1-9][0-9]*\Z")
SHA = re.compile(r"[0-9a-f]{64}\Z")


class Rejected(ValueError):
    pass


def reject_duplicate_pairs(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise Rejected("duplicate_key")
        result[key] = value
    return result


def valid_unicode_scalars(value: str) -> bool:
    return all(not 0xD800 <= ord(character) <= 0xDFFF for character in value)


def validate_tree(value: Any, *, key: bool = False) -> None:
    if value is None or isinstance(value, bool):
        return
    if isinstance(value, int):
        if abs(value) > SAFE_INTEGER:
            raise Rejected("unsafe_json_integer")
        return
    if isinstance(value, float):
        if not math.isfinite(value):
            raise Rejected("nonfinite")
        raise Rejected("json_float_forbidden")
    if isinstance(value, str):
        if not valid_unicode_scalars(value):
            raise Rejected("unpaired_surrogate")
        if key and (not value or any(ord(c) < 0x20 or ord(c) > 0x7E for c in value)):
            raise Rejected("abi_key_not_printable_ascii")
        return
    if isinstance(value, list):
        for item in value:
            validate_tree(item)
        return
    if isinstance(value, dict):
        for object_key, item in value.items():
            validate_tree(object_key, key=True)
            validate_tree(item)
        return
    raise Rejected("unsupported_json_type")


def parse_wire(raw: bytes) -> Any:
    if raw.startswith(b"\xef\xbb\xbf"):
        raise Rejected("bom")
    try:
        text = raw.decode("utf-8", "strict")
    except UnicodeDecodeError as error:
        raise Rejected("invalid_utf8") from error
    try:
        value = json.loads(
            text,
            object_pairs_hook=reject_duplicate_pairs,
            parse_constant=lambda _: (_ for _ in ()).throw(Rejected("nonfinite")),
        )
    except Rejected:
        raise
    except (json.JSONDecodeError, ValueError) as error:
        raise Rejected("invalid_json_or_trailing_bytes") from error
    validate_tree(value)
    return value


def canonical(value: Any) -> bytes:
    validate_tree(value)
    # Contract-defined keys are printable ASCII, so Python lexicographic order
    # equals RFC8785 UTF-16 code-unit order for every admitted ABI object.
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def require_keys(value: Any, expected: set[str]) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) != expected:
        raise Rejected("exact_key_set")
    return value


def integer(value: Any) -> int:
    obj = require_keys(value, {"decimal", "schema"})
    if obj["schema"] != "nhm2.integer.v1" or not isinstance(obj["decimal"], str) or not DECIMAL.fullmatch(obj["decimal"]):
        raise Rejected("integer_grammar")
    if obj["decimal"] == "-0":
        raise Rejected("negative_zero")
    return int(obj["decimal"])


def rational(value: Any) -> tuple[int, int]:
    obj = require_keys(value, {"denominator", "numerator", "schema"})
    if obj["schema"] != "nhm2.rational.v1" or not isinstance(obj["numerator"], str) or not isinstance(obj["denominator"], str):
        raise Rejected("rational_schema")
    if not DECIMAL.fullmatch(obj["numerator"]) or obj["numerator"] == "-0" or not POSITIVE_DECIMAL.fullmatch(obj["denominator"]):
        raise Rejected("rational_grammar")
    numerator, denominator = int(obj["numerator"]), int(obj["denominator"])
    if math.gcd(abs(numerator), denominator) != 1 or (numerator == 0 and denominator != 1):
        raise Rejected("rational_not_reduced")
    return numerator, denominator


def dyadic(value: Any) -> tuple[int, int]:
    obj = require_keys(value, {"exponent2", "mantissa", "schema"})
    if obj["schema"] != "nhm2.dyadic.v1" or isinstance(obj["exponent2"], bool) or not isinstance(obj["exponent2"], int):
        raise Rejected("dyadic_schema")
    if abs(obj["exponent2"]) > SAFE_INTEGER or not isinstance(obj["mantissa"], str) or not DECIMAL.fullmatch(obj["mantissa"]) or obj["mantissa"] == "-0":
        raise Rejected("dyadic_grammar")
    mantissa, exponent = int(obj["mantissa"]), obj["exponent2"]
    if (mantissa == 0 and exponent != 0) or (mantissa != 0 and mantissa % 2 == 0):
        raise Rejected("dyadic_not_normal")
    return mantissa, exponent


def ball(value: Any) -> tuple[tuple[int, int], tuple[int, int]]:
    obj = require_keys(value, {"midpoint", "radius", "schema"})
    if obj["schema"] != "nhm2.real_ball.v1":
        raise Rejected("ball_schema")
    midpoint, radius = dyadic(obj["midpoint"]), dyadic(obj["radius"])
    if radius[0] < 0:
        raise Rejected("negative_radius")
    return midpoint, radius


def digest(domain: str, value: Any) -> str:
    return hashlib.sha256(domain.encode("ascii") + canonical(value)).hexdigest()


AUTHORITY = {
    "candidate_admitted": False,
    "classical_proof_established": False,
    "diagnostic_lamp": False,
    "geometry_state_accepted": False,
    "physical_viability": False,
    "propulsion_authority": False,
    "transport_authority": False,
}


def make_record(sequence: int, previous: str, decision: str, payload: dict[str, Any]) -> dict[str, Any]:
    payload_hash = digest("nhm2-g2h-e-s4/payload/v1\n", payload)
    unsigned = {
        "authority": AUTHORITY,
        "candidate_evaluations": 0,
        "contract_sha256": R2_SHA,
        "decision": decision,
        "duty_id": f"FIXTURE-{sequence:02d}",
        "fixture_id": "manufactured_wire_record_v1",
        "implementation_id": "definition_audit_python_v1",
        "lane": "primary_fixture",
        "payload": payload,
        "payload_sha256": payload_hash,
        "previous_record_sha256": previous,
        "schema": "nhm2.g2h_e_s4.proof_record.v1",
        "sequence": sequence,
    }
    record_hash = digest("nhm2-g2h-e-s4/record/v1\n", unsigned)
    return {**unsigned, "record_self_sha256": record_hash}


def validate_record(record: Any, expected_sequence: int, expected_previous: str) -> None:
    required = {
        "authority", "candidate_evaluations", "contract_sha256", "decision", "duty_id",
        "fixture_id", "implementation_id", "lane", "payload", "payload_sha256",
        "previous_record_sha256", "record_self_sha256", "schema", "sequence",
    }
    obj = require_keys(record, required)
    if obj["authority"] != AUTHORITY or obj["candidate_evaluations"] != 0:
        raise Rejected("authority_or_evaluation")
    if obj["contract_sha256"] != R2_SHA or obj["schema"] != "nhm2.g2h_e_s4.proof_record.v1":
        raise Rejected("identity")
    if obj["lane"] not in {"primary_fixture", "independent_fixture"} or obj["decision"] not in {"PASS", "FAIL", "INELIGIBLE_AFTER_FIRST_FAIL"}:
        raise Rejected("enum")
    if obj["sequence"] != expected_sequence or obj["previous_record_sha256"] != expected_previous:
        raise Rejected("chronology")
    if not isinstance(obj["payload_sha256"], str) or not SHA.fullmatch(obj["payload_sha256"]):
        raise Rejected("payload_hash_grammar")
    if obj["payload_sha256"] != digest("nhm2-g2h-e-s4/payload/v1\n", obj["payload"]):
        raise Rejected("payload_hash")
    claimed = obj["record_self_sha256"]
    if not isinstance(claimed, str) or not SHA.fullmatch(claimed):
        raise Rejected("record_hash_grammar")
    unsigned = {key: value for key, value in obj.items() if key != "record_self_sha256"}
    if claimed != digest("nhm2-g2h-e-s4/record/v1\n", unsigned):
        raise Rejected("record_hash")


@dataclass(frozen=True)
class Case:
    name: str
    action: Callable[[], Any]
    should_pass: bool


def main() -> int:
    contract = parse_wire(CONTRACT.read_bytes())
    if contract["status"] != "draft_unsealed_representational_contract_no_scientific_or_execution_authority":
        raise Rejected("contract_status")

    i0 = {"decimal": "0", "schema": "nhm2.integer.v1"}
    d0 = {"exponent2": 0, "mantissa": "0", "schema": "nhm2.dyadic.v1"}
    d1 = {"exponent2": -4, "mantissa": "3", "schema": "nhm2.dyadic.v1"}
    good_ball = {"midpoint": d1, "radius": d0, "schema": "nhm2.real_ball.v1"}
    r0 = make_record(0, ZERO_SHA, "PASS", {"ball": good_ball, "integer": i0})
    r1 = make_record(1, r0["record_self_sha256"], "FAIL", {"typed_failure": "SYNTHETIC_STRICT_SIGN_TOUCHES_ZERO"})

    cases = [
        Case("wire_contract", lambda: contract, True),
        Case("integer_zero", lambda: integer(i0), True),
        Case("integer_leading_zero", lambda: integer({"decimal": "01", "schema": "nhm2.integer.v1"}), False),
        Case("integer_negative_zero", lambda: integer({"decimal": "-0", "schema": "nhm2.integer.v1"}), False),
        Case("rational_reduced", lambda: rational({"denominator": "5", "numerator": "6", "schema": "nhm2.rational.v1"}), True),
        Case("rational_unreduced", lambda: rational({"denominator": "10", "numerator": "12", "schema": "nhm2.rational.v1"}), False),
        Case("rational_zero_normal", lambda: rational({"denominator": "1", "numerator": "0", "schema": "nhm2.rational.v1"}), True),
        Case("dyadic_normal", lambda: dyadic(d1), True),
        Case("dyadic_even_mantissa", lambda: dyadic({"exponent2": -5, "mantissa": "6", "schema": "nhm2.dyadic.v1"}), False),
        Case("dyadic_zero_exponent", lambda: dyadic({"exponent2": 4, "mantissa": "0", "schema": "nhm2.dyadic.v1"}), False),
        Case("ball_zero_radius", lambda: ball(good_ball), True),
        Case("ball_negative_radius", lambda: ball({"midpoint": d0, "radius": {"exponent2": 0, "mantissa": "-1", "schema": "nhm2.dyadic.v1"}, "schema": "nhm2.real_ball.v1"}), False),
        Case("wire_duplicate", lambda: parse_wire(b'{"a":1,"a":2}'), False),
        Case("wire_duplicate_escape", lambda: parse_wire(b'{"a":1,"\\u0061":2}'), False),
        Case("wire_bom", lambda: parse_wire(b"\xef\xbb\xbf{}"), False),
        Case("wire_invalid_utf8", lambda: parse_wire(b'"\xff"'), False),
        Case("wire_unpaired_surrogate", lambda: parse_wire(b'"\\ud800"'), False),
        Case("wire_trailing", lambda: parse_wire(b"{}{}"), False),
        Case("wire_unsafe_integer", lambda: parse_wire(b"9007199254740992"), False),
        Case("wire_float", lambda: parse_wire(b"0.5"), False),
        Case("record_zero", lambda: validate_record(r0, 0, ZERO_SHA), True),
        Case("record_chain", lambda: validate_record(r1, 1, r0["record_self_sha256"]), True),
        Case("record_wrong_previous", lambda: validate_record(r1, 1, ZERO_SHA), False),
        Case("record_payload_mutation", lambda: validate_record({**r0, "payload": {"integer": i0}}, 0, ZERO_SHA), False),
        Case("record_authority_mutation", lambda: validate_record({**r0, "authority": {**AUTHORITY, "candidate_admitted": True}}, 0, ZERO_SHA), False),
    ]

    results: list[dict[str, Any]] = []
    all_passed = True
    for case in cases:
        rejected = False
        error = None
        try:
            case.action()
        except (Rejected, UnicodeError, ValueError, TypeError, KeyError) as caught:
            rejected, error = True, str(caught)
        passed = (not rejected) if case.should_pass else rejected
        all_passed &= passed
        results.append({"name": case.name, "expected": "ACCEPT" if case.should_pass else "REJECT", "passed": passed, "error": error})

    output = {
        "schema": "nhm2.g2h_e_s4_r1.wire_record_audit.v1",
        "passed": all_passed,
        "passed_count": sum(1 for result in results if result["passed"]),
        "total_count": len(results),
        "candidate_evaluations": 0,
        "candidate_roots_created": False,
        "implementation_authorized": False,
        "execution_authorized": False,
        "authority_promoted": False,
        "results": results,
    }
    print(json.dumps(output, indent=2, sort_keys=True))
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
