"""Exact rational counterexample witness for the first core residual duty.

Program gate: G2 — classical branch proof and terminal state
Workstream: lambda-zero limiting-ground-state proof closure
Capability or component: exact first-duty point witness
Current maturity: admitted proof center; no core residual decision
Target maturity: content-addressed exact pass/fail witness
Required frozen inputs: admission, payload, and proof-definition bytes
Required evidence: exact binary64 injection and rational residual inequality
Stop/fail criteria: binding, arithmetic-budget, inequality, or collision failure
Explicit non-goals: center changes, full cover, later duties, or authority
Downstream gate unlocked: G2 first failure or full core interval cover
"""

from __future__ import annotations

from fractions import Fraction
import hashlib
import json
import os
from pathlib import Path
import struct
from types import MappingProxyType
from typing import Final


WITNESS_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_v2_lambda_zero_core_residual_witness/v1"
)
REPOSITORY_ROOT: Final[Path] = Path(__file__).resolve().parents[2]
ADMISSION_PATH: Final[Path] = (
    REPOSITORY_ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "lambda-zero-proof-center-admission-v1.json"
)
ADMISSION_RAW_SHA256: Final[str] = (
    "ff07124e88673fee04f9ca7e3e7c4b6545a1ee37fb70bda43a140e56bf582645"
)
ADMISSION_SIZE_BYTES: Final[int] = 2_158
ADMISSION_RECEIPT_SHA256: Final[str] = (
    "ff37f9eebebcaf49a5d3fd88d749c62071e33cc5f58b3af6f069700a88a530df"
)
ADMISSION_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/lambda-zero-proof-center-admission/v1\n"
)
PROJECTION_ROOT: Final[Path] = (
    REPOSITORY_ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "lambda-zero-proof-center-v1"
)
SCALARS_PATH: Final[Path] = PROJECTION_ROOT / "scalars.f64le"
CORE_U_PATH: Final[Path] = PROJECTION_ROOT / "coefficients/core_L2_u.f64le"
CORE_V_PATH: Final[Path] = PROJECTION_ROOT / "coefficients/core_L2_V.f64le"
SCALARS_BINDING: Final[tuple[int, str]] = (
    72,
    "a03f00ec97ccc41798f38092be05a77af248ae63097c83ff34ed17d39bfc0872",
)
CORE_U_BINDING: Final[tuple[int, str]] = (
    1_024,
    "1aa202f58afdb5e23a3e12e5f216ffcff08ad55343e8a8a2823497d826f8af69",
)
CORE_V_BINDING: Final[tuple[int, str]] = (
    1_024,
    "44543910df07444709f963b1711dcd66f165e97ce78602fc17eae49330f6eb83",
)
DIRECTED_PROOF_PATH: Final[Path] = (
    REPOSITORY_ROOT
    / "shared/contracts/nhm2-spherical-boson-star-newtonian-seed-directed-proof.v1.ts"
)
DIRECTED_PROOF_RAW_SHA256: Final[str] = (
    "0b51f6df4cf6ded8c0008e4392f5e08f8752a30259d0deba829edf7689707853"
)
DIRECTED_PROOF_RAW_SIZE_BYTES: Final[int] = 61_403
DIRECTED_PROOF_SEMANTIC_SHA256: Final[str] = (
    "c8832ae77d1279d400f1fffbc587e413659c111ae90283cb34a016fb7e08ea99"
)
DIRECTED_PROOF_CANONICAL_SIZE_BYTES: Final[int] = 42_778
DIRECTED_OPERATOR_PATH: Final[Path] = (
    REPOSITORY_ROOT
    / "shared"
    / "contracts"
    / "nhm2-spherical-boson-star-newtonian-seed-directed-proof-operator.v1.ts"
)
DIRECTED_OPERATOR_RAW_SHA256: Final[str] = (
    "084e1b32a15955fd9867f9616a4ec01bb986a12fa347162df92efed7c1d430a1"
)
DIRECTED_OPERATOR_RAW_SIZE_BYTES: Final[int] = 54_712
DIRECTED_OPERATOR_SEMANTIC_SHA256: Final[str] = (
    "511609501b01560c7e8a15f99a5b94176b51fb0e9add9bf5aa1045ef51d2342b"
)
DIRECTED_OPERATOR_CANONICAL_SIZE_BYTES: Final[int] = 34_695
LAMBDA_ZERO_DEFINITION_PATH: Final[Path] = (
    REPOSITORY_ROOT
    / "shared/contracts/nhm2-spherical-boson-star-v2-lambda-zero-proof-definition.v1.ts"
)
LAMBDA_ZERO_DEFINITION_RAW_SHA256: Final[str] = (
    "ee617cf1c48d25536e1faf11f9cd2bd75fc25deb2b102fec547243c26e928de7"
)
LAMBDA_ZERO_DEFINITION_RAW_SIZE_BYTES: Final[int] = 20_476
LAMBDA_ZERO_DEFINITION_SEMANTIC_SHA256: Final[str] = (
    "bb8dc226a11d3189357f75da67b8ea7b189c09b9b0091fc42aabac4da66f629f"
)
LAMBDA_ZERO_DEFINITION_CANONICAL_SIZE_BYTES: Final[int] = 8_157
PROPOSAL_PATH: Final[Path] = (
    REPOSITORY_ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2-lambda-zero-core-residual-witness.md"
)
PROPOSAL_RAW_SHA256: Final[str] = (
    "c7ae9a1e7421b39485c4982372d4b2bdc47f30bdffa04c8f725fe1428ae8a6e8"
)
PROPOSAL_SIZE_BYTES: Final[int] = 3_699
OUTPUT_PATH: Final[Path] = (
    REPOSITORY_ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "lambda-zero-core-residual-witness-v1.json"
)
RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/lambda-zero-core-residual-witness/v1\n"
)

POINT_X: Final[Fraction] = Fraction(1, 128)
POINT_RHO: Final[Fraction] = Fraction(1, 129)
POINT_T: Final[Fraction] = Fraction(-127, 129)
RESIDUAL_THRESHOLD: Final[Fraction] = Fraction(1, 10_000_000_000)
MAXIMUM_RATIONAL_BITS: Final[int] = 131_072
CORE_MODE_COUNT: Final[int] = 128
AUTHORITY_LOCKS: Final = MappingProxyType(
    {
        "proofComplete": False,
        "groundStateAccepted": False,
        "executionAuthority": False,
        "candidateAuthority": False,
        "replayAuthority": False,
        "diagnosticLampAuthority": False,
        "physicalAuthority": False,
        "propulsionAuthority": False,
        "transportAuthority": False,
    }
)


class CoreResidualWitnessError(RuntimeError):
    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(code if not detail else f"{code}:{detail}")
        self.code = code
        self.detail = detail


def _sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _canonical(value: object) -> bytes:
    return json.dumps(
        value,
        allow_nan=False,
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("ascii")


def _receipt_hash(unsigned: dict[str, object]) -> str:
    raw = _canonical(unsigned)
    return _sha256(RECEIPT_DOMAIN + struct.pack("<Q", len(raw)) + raw)


def _read_bound(path: Path, size: int, expected: str, code: str) -> bytes:
    if path.is_symlink() or not path.is_file():
        raise CoreResidualWitnessError(code, "path")
    raw = path.read_bytes()
    if len(raw) != size or _sha256(raw) != expected:
        raise CoreResidualWitnessError(code, "bytes")
    return raw


def _check_fraction(value: Fraction, label: str) -> Fraction:
    if (
        value.numerator.bit_length() > MAXIMUM_RATIONAL_BITS
        or value.denominator.bit_length() > MAXIMUM_RATIONAL_BITS
    ):
        raise CoreResidualWitnessError("witness_rational_budget_exceeded", label)
    return value


def _binary64_fraction_le(word: bytes, label: str) -> Fraction:
    if len(word) != 8:
        raise CoreResidualWitnessError("witness_binary64_word_invalid", label)
    bits = int.from_bytes(word, "little")
    sign = -1 if bits >> 63 else 1
    exponent_bits = (bits >> 52) & 0x7FF
    fraction_bits = bits & ((1 << 52) - 1)
    if exponent_bits == 0x7FF or bits == 1 << 63:
        raise CoreResidualWitnessError("witness_binary64_word_invalid", label)
    if exponent_bits == 0:
        mantissa = fraction_bits
        exponent = -1_074
    else:
        mantissa = (1 << 52) | fraction_bits
        exponent = exponent_bits - 1_075
    if mantissa == 0:
        return Fraction(0)
    if exponent >= 0:
        value = Fraction(sign * mantissa * (1 << exponent))
    else:
        value = Fraction(sign * mantissa, 1 << (-exponent))
    return _check_fraction(value, label)


def _decode_payload(raw: bytes, count: int, label: str) -> tuple[Fraction, ...]:
    if len(raw) != count * 8:
        raise CoreResidualWitnessError("witness_payload_shape_invalid", label)
    return tuple(
        _binary64_fraction_le(raw[index * 8 : (index + 1) * 8], f"{label}[{index}]")
        for index in range(count)
    )


def _chebyshev_derivative(
    coefficients: tuple[Fraction, ...], label: str
) -> tuple[Fraction, ...]:
    if len(coefficients) <= 1:
        return (Fraction(0),)
    derivative = [Fraction(0)] * len(coefficients)
    last = len(coefficients) - 1
    derivative[last - 1] = 2 * last * coefficients[last]
    for index in range(last - 2, -1, -1):
        derivative[index] = 2 * (index + 1) * coefficients[index + 1]
        if index + 2 < len(derivative):
            derivative[index] += derivative[index + 2]
        _check_fraction(derivative[index], f"{label}[{index}]")
    derivative[0] /= 2
    return tuple(derivative[:-1])


def _chebyshev_value(
    coefficients: tuple[Fraction, ...], coordinate: Fraction, label: str
) -> Fraction:
    if not coefficients:
        raise CoreResidualWitnessError("witness_chebyshev_shape_invalid", label)
    t_previous = Fraction(1)
    result = coefficients[0]
    if len(coefficients) == 1:
        return result
    t_current = coordinate
    result += coefficients[1] * t_current
    for mode in range(2, len(coefficients)):
        t_next = 2 * coordinate * t_current - t_previous
        result += coefficients[mode] * t_next
        _check_fraction(result, f"{label}.sum[{mode}]")
        t_previous, t_current = t_current, t_next
    return _check_fraction(result, label)


def _field_jet(
    coefficients: tuple[Fraction, ...], label: str
) -> tuple[Fraction, Fraction, Fraction]:
    first = _chebyshev_derivative(coefficients, label + ".d1")
    second = _chebyshev_derivative(first, label + ".d2")
    value = _chebyshev_value(coefficients, POINT_T, label + ".value")
    rho_first = 2 * _chebyshev_value(first, POINT_T, label + ".rho1")
    rho_second = 4 * _chebyshev_value(second, POINT_T, label + ".rho2")
    one_minus_rho = 1 - POINT_RHO
    x_first = one_minus_rho**2 * rho_first
    x_second = one_minus_rho**4 * rho_second
    x_second -= 2 * one_minus_rho**3 * rho_first
    return tuple(
        _check_fraction(item, f"{label}.jet[{ordinal}]")
        for ordinal, item in enumerate((value, x_first, x_second))
    )


def _load_admission() -> dict[str, object]:
    raw = _read_bound(
        ADMISSION_PATH,
        ADMISSION_SIZE_BYTES,
        ADMISSION_RAW_SHA256,
        "witness_admission_binding_mismatch",
    )
    try:
        value = json.loads(raw)
    except Exception as error:
        raise CoreResidualWitnessError("witness_admission_json_invalid") from error
    if type(value) is not dict or _canonical(value) != raw:
        raise CoreResidualWitnessError("witness_admission_noncanonical")
    if value.get("receiptSha256") != ADMISSION_RECEIPT_SHA256:
        raise CoreResidualWitnessError("witness_admission_self_hash_literal_invalid")
    unsigned = dict(value)
    del unsigned["receiptSha256"]
    unsigned_raw = _canonical(unsigned)
    observed = _sha256(
        ADMISSION_DOMAIN + struct.pack("<Q", len(unsigned_raw)) + unsigned_raw
    )
    if observed != ADMISSION_RECEIPT_SHA256:
        raise CoreResidualWitnessError("witness_admission_self_hash_invalid")
    if (
        value.get("decision")
        != "PROOF_CENTER_ADMITTED_AS_CALCULATION_INPUT_ONLY"
        or value.get("representationAccepted") is not True
        or value.get("noRetune") is not True
    ):
        raise CoreResidualWitnessError("witness_admission_decision_invalid")
    locks = value.get("authorityLocks")
    if type(locks) is not dict or any(item is not False for item in locks.values()):
        raise CoreResidualWitnessError("witness_admission_authority_invalid")
    return value


def _verify_dependencies() -> None:
    _read_bound(
        DIRECTED_PROOF_PATH,
        DIRECTED_PROOF_RAW_SIZE_BYTES,
        DIRECTED_PROOF_RAW_SHA256,
        "witness_directed_proof_binding_mismatch",
    )
    _read_bound(
        DIRECTED_OPERATOR_PATH,
        DIRECTED_OPERATOR_RAW_SIZE_BYTES,
        DIRECTED_OPERATOR_RAW_SHA256,
        "witness_directed_operator_binding_mismatch",
    )
    _read_bound(
        LAMBDA_ZERO_DEFINITION_PATH,
        LAMBDA_ZERO_DEFINITION_RAW_SIZE_BYTES,
        LAMBDA_ZERO_DEFINITION_RAW_SHA256,
        "witness_lambda_zero_definition_binding_mismatch",
    )
    _read_bound(
        PROPOSAL_PATH,
        PROPOSAL_SIZE_BYTES,
        PROPOSAL_RAW_SHA256,
        "witness_proposal_binding_mismatch",
    )


def _fraction_json(value: Fraction) -> dict[str, str]:
    return {
        "denominator": str(value.denominator),
        "numerator": str(value.numerator),
    }


def _compute_witness() -> dict[str, object]:
    _load_admission()
    _verify_dependencies()
    scalar_raw = _read_bound(
        SCALARS_PATH,
        SCALARS_BINDING[0],
        SCALARS_BINDING[1],
        "witness_scalar_payload_binding_mismatch",
    )
    u_raw = _read_bound(
        CORE_U_PATH,
        CORE_U_BINDING[0],
        CORE_U_BINDING[1],
        "witness_core_u_payload_binding_mismatch",
    )
    v_raw = _read_bound(
        CORE_V_PATH,
        CORE_V_BINDING[0],
        CORE_V_BINDING[1],
        "witness_core_v_payload_binding_mismatch",
    )
    scalars = _decode_payload(scalar_raw, 9, "scalars")
    u_coefficients = _decode_payload(u_raw, CORE_MODE_COUNT, "core_u")
    v_coefficients = _decode_payload(v_raw, CORE_MODE_COUNT, "core_v")
    nu = scalars[0]
    u, u_x, u_xx = _field_jet(u_coefficients, "u")
    potential, _v_x, _v_xx = _field_jet(v_coefficients, "V")
    residual = -Fraction(1, 2) * (u_xx + 2 * u_x / POINT_X)
    residual += (potential - nu) * u
    denominator = Fraction(1)
    denominator += abs(u_xx / 2)
    denominator += abs(u_x / POINT_X)
    denominator += abs(potential * u)
    denominator += abs(nu * u)
    normalized = abs(residual) / denominator
    margin = normalized - RESIDUAL_THRESHOLD
    for label, value in (
        ("residual", residual),
        ("denominator", denominator),
        ("normalized", normalized),
        ("margin", margin),
    ):
        _check_fraction(value, label)
    strict = margin > 0
    return {
        "denominatorExact": _fraction_json(denominator),
        "firstFailureCode": (
            "core_normalized_schrodinger_point_counterexample" if strict else None
        ),
        "firstFailureDutyId": "core_normalized_schrodinger" if strict else None,
        "firstFailureDutyOrdinal": 1 if strict else None,
        "laterDutiesEvaluated": False,
        "marginExact": _fraction_json(margin),
        "normalizedResidualExact": _fraction_json(normalized),
        "pointExact": _fraction_json(POINT_X),
        "residualExact": _fraction_json(residual),
        "strictlyExceedsThreshold": strict,
        "thresholdExact": _fraction_json(RESIDUAL_THRESHOLD),
    }


def materialize_core_residual_witness() -> str:
    if OUTPUT_PATH.exists() or OUTPUT_PATH.is_symlink():
        raise CoreResidualWitnessError("witness_output_collision")
    result = _compute_witness()
    source_raw = Path(__file__).resolve().read_bytes()
    strict = result["strictlyExceedsThreshold"] is True
    unsigned = {
        "admissionRawSha256": ADMISSION_RAW_SHA256,
        "admissionReceiptSha256": ADMISSION_RECEIPT_SHA256,
        "artifactId": (
            "nhm2.spherical_boson_star_v2.lambda_zero_core_residual_witness"
        ),
        "authorityLocks": dict(AUTHORITY_LOCKS),
        "decision": (
            "EXACT_CORE_DUTY_COUNTEREXAMPLE"
            if strict
            else "WITNESS_NOT_ESTABLISHED"
        ),
        "directedOperatorBinding": {
            "canonicalSizeBytes": DIRECTED_OPERATOR_CANONICAL_SIZE_BYTES,
            "rawSha256": DIRECTED_OPERATOR_RAW_SHA256,
            "semanticSha256": DIRECTED_OPERATOR_SEMANTIC_SHA256,
        },
        "directedProofBinding": {
            "canonicalSizeBytes": DIRECTED_PROOF_CANONICAL_SIZE_BYTES,
            "rawSha256": DIRECTED_PROOF_RAW_SHA256,
            "semanticSha256": DIRECTED_PROOF_SEMANTIC_SHA256,
        },
        "lambdaZeroDefinitionBinding": {
            "canonicalSizeBytes": LAMBDA_ZERO_DEFINITION_CANONICAL_SIZE_BYTES,
            "rawSha256": LAMBDA_ZERO_DEFINITION_RAW_SHA256,
            "semanticSha256": LAMBDA_ZERO_DEFINITION_SEMANTIC_SHA256,
        },
        "noRetune": True,
        "proposalRawSha256": PROPOSAL_RAW_SHA256,
        "result": result,
        "sourceRawSha256": _sha256(source_raw),
        "sourceRawSizeBytes": len(source_raw),
        "witnessVersion": WITNESS_VERSION,
    }
    full = dict(unsigned)
    full["receiptSha256"] = _receipt_hash(unsigned)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    try:
        with OUTPUT_PATH.open("xb") as handle:
            handle.write(_canonical(full))
            handle.flush()
            os.fsync(handle.fileno())
    except FileExistsError as error:
        raise CoreResidualWitnessError("witness_output_collision") from error
    return full["receiptSha256"]


if (
    POINT_RHO != POINT_X / (1 + POINT_X)
    or POINT_T != 2 * POINT_RHO - 1
    or POINT_X < Fraction(1, 256)
    or POINT_X > 32
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("lambda_zero_core_residual_witness_invariant")


__all__ = [
    "AUTHORITY_LOCKS",
    "CoreResidualWitnessError",
    "WITNESS_VERSION",
    "materialize_core_residual_witness",
]


if __name__ == "__main__":
    print(materialize_core_residual_witness())
