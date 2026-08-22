"""Deterministic projection of the immutable lambda-zero global center.

Program gate: G2 — classical branch proof and terminal state
Workstream: lambda-zero limiting-ground-state proof closure
Capability or component: frozen core/tail proof-center codec
Current maturity: representation transform; no proof or acceptance
Target maturity: content-addressed five-payload directed-proof center
Required frozen inputs: immutable global-center receipt and projection packet
Required evidence: exact rehash, reconstruction screens, exclusive output
Stop/fail criteria: any binding, shape, reconstruction, or collision failure
Explicit non-goals: solving, proof, branch, candidate, lamp, or authority
Downstream gate unlocked: directed global-profile proof ingestion only
"""

from __future__ import annotations

from fractions import Fraction
import hashlib
import json
import math
import os
from pathlib import Path
import struct
from types import MappingProxyType
from typing import Final

import numpy as np
from scipy.interpolate import CubicHermiteSpline


PROJECTION_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_v2_lambda_zero_proof_center_projection/v1"
)
REPOSITORY_ROOT: Final[Path] = Path(__file__).resolve().parents[2]
INPUT_PATH: Final[Path] = (
    REPOSITORY_ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "lambda-zero-global-root-primary-v1.json"
)
INPUT_RAW_SHA256: Final[str] = (
    "d0b0f74da5eb2512fe23e4bb049aa1d68cef6d9c9f590af993027b4af6509f30"
)
INPUT_SIZE_BYTES: Final[int] = 196_505
INPUT_RECEIPT_SHA256: Final[str] = (
    "bc8269c95543a0507a1d261093e51ebb8f23199f8f406e22742fd191e4f39e9d"
)
INPUT_RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/lambda-zero-global-root-primary/v1\n"
)
PROPOSAL_PATH: Final[Path] = (
    REPOSITORY_ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2-lambda-zero-proof-center-projection.md"
)
PROPOSAL_RAW_SHA256: Final[str] = (
    "4d4bf6f13dccf10e39c146e085b1947d222d91d5785e99c101883c2e17ef6a86"
)
PROPOSAL_SIZE_BYTES: Final[int] = 4_011
RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/lambda-zero-proof-center-projection/v1\n"
)
CORE_MODE_COUNT: Final[int] = 128
TAIL_MODE_COUNT: Final[int] = 32
OUTER_RADIUS: Final[float] = 32.0
EPSILON: Final[float] = 2.0**-12
ORIGIN_MAXIMUM_INDEX: Final[int] = 16
NODE_RECONSTRUCTION_LIMIT: Final[float] = 2.0**-40
JOIN_RECONSTRUCTION_LIMIT: Final[float] = 2.0**-28

PAYLOAD_ORDER: Final[tuple[tuple[str, int], ...]] = (
    ("scalars.f64le", 72),
    ("coefficients/core_L2_u.f64le", 1_024),
    ("coefficients/core_L2_V.f64le", 1_024),
    ("coefficients/tail_H.f64le", 256),
    ("coefficients/tail_Q.f64le", 256),
)
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


class ProofCenterProjectionError(RuntimeError):
    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(code if not detail else f"{code}:{detail}")
        self.code = code
        self.detail = detail


def _sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _u64le(value: int) -> bytes:
    return struct.pack("<Q", value)


def _canonical(value: object) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=True,
        allow_nan=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("ascii")


def _receipt_hash(unsigned: dict[str, object]) -> str:
    raw = _canonical(unsigned)
    return _sha256(RECEIPT_DOMAIN + _u64le(len(raw)) + raw)


def _decode_f64(value: object, role: str) -> float:
    if type(value) is not str or len(value) != 16:
        raise ProofCenterProjectionError("projection_f64_hex_invalid", role)
    try:
        raw = bytes.fromhex(value)
        output = struct.unpack(">d", raw)[0]
    except Exception as error:
        raise ProofCenterProjectionError(
            "projection_f64_hex_invalid", role
        ) from error
    if not math.isfinite(output) or raw == bytes.fromhex("8000000000000000"):
        raise ProofCenterProjectionError("projection_f64_value_invalid", role)
    return output


def _positive_zero(value: float) -> float:
    return 0.0 if value == 0.0 else value


def _encode_f64le(values: tuple[float, ...]) -> bytes:
    output = bytearray()
    for index, value in enumerate(values):
        value = _positive_zero(value)
        if not math.isfinite(value):
            raise ProofCenterProjectionError(
                "projection_nonfinite_output", str(index)
            )
        output.extend(struct.pack("<d", value))
    return bytes(output)


def _verify_and_load_input() -> dict[str, object]:
    raw = INPUT_PATH.read_bytes()
    if len(raw) != INPUT_SIZE_BYTES or _sha256(raw) != INPUT_RAW_SHA256:
        raise ProofCenterProjectionError("projection_input_raw_binding_mismatch")
    proposal = PROPOSAL_PATH.read_bytes()
    if (
        len(proposal) != PROPOSAL_SIZE_BYTES
        or _sha256(proposal) != PROPOSAL_RAW_SHA256
    ):
        raise ProofCenterProjectionError("projection_proposal_binding_mismatch")
    try:
        value = json.loads(raw)
    except Exception as error:
        raise ProofCenterProjectionError("projection_input_json_invalid") from error
    if type(value) is not dict or _canonical(value) != raw:
        raise ProofCenterProjectionError("projection_input_noncanonical")
    if value.get("receiptSha256") != INPUT_RECEIPT_SHA256:
        raise ProofCenterProjectionError("projection_input_self_hash_literal_mismatch")
    unsigned = dict(value)
    del unsigned["receiptSha256"]
    unsigned_raw = _canonical(unsigned)
    observed = _sha256(
        INPUT_RECEIPT_DOMAIN + _u64le(len(unsigned_raw)) + unsigned_raw
    )
    if observed != INPUT_RECEIPT_SHA256:
        raise ProofCenterProjectionError("projection_input_self_hash_mismatch")
    if value.get("decision") != "CALCULATION_CENTER_ONLY":
        raise ProofCenterProjectionError("projection_input_decision_invalid")
    locks = value.get("authorityLocks")
    if type(locks) is not dict or any(item is not False for item in locks.values()):
        raise ProofCenterProjectionError("projection_input_authority_invalid")
    return value


def _origin_coefficients(
    vc_value: float, nu_value: float
) -> tuple[tuple[Fraction, ...], tuple[Fraction, ...]]:
    vc = Fraction.from_float(vc_value)
    nu = Fraction.from_float(nu_value)
    a = [Fraction(1)]
    b = [vc]
    for shell in range(ORIGIN_MAXIMUM_INDEX):
        denominator = Fraction((2 * shell + 2) * (2 * shell + 3))
        ba = sum(b[k] * a[shell - k] for k in range(shell + 1))
        aa = sum(a[k] * a[shell - k] for k in range(shell + 1))
        a.append(2 * (ba - nu * a[shell]) / denominator)
        b.append(aa / denominator)
    return tuple(a), tuple(b)


def _series(coefficients: tuple[Fraction, ...], x: float) -> float:
    xf = Fraction.from_float(x)
    x2 = xf * xf
    power = Fraction(1)
    value = Fraction(0)
    for coefficient in coefficients:
        value += coefficient * power
        power *= x2
    return float(value)


def _dct_i(values: tuple[float, ...]) -> tuple[float, ...]:
    if len(values) != CORE_MODE_COUNT:
        raise ProofCenterProjectionError("projection_dct_shape_invalid")
    denominator = CORE_MODE_COUNT - 1
    coefficients: list[float] = []
    for mode in range(CORE_MODE_COUNT):
        terms = []
        for ordinal, value in enumerate(values):
            weight = 0.5 if ordinal in (0, denominator) else 1.0
            angle = math.pi * mode * (denominator - ordinal) / denominator
            terms.append(weight * value * math.cos(angle))
        coefficient = 2.0 * math.fsum(terms) / denominator
        if mode in (0, denominator):
            coefficient *= 0.5
        coefficients.append(_positive_zero(coefficient))
    return tuple(coefficients)


def _evaluate_chebyshev(coefficients: tuple[float, ...], rho: float) -> float:
    t = 2.0 * rho - 1.0
    theta = math.acos(max(-1.0, min(1.0, t)))
    return math.fsum(
        coefficient * math.cos(mode * theta)
        for mode, coefficient in enumerate(coefficients)
    )


def _project(value: dict[str, object]) -> tuple[dict[str, object], dict[str, bytes]]:
    mesh_raw = value.get("meshF64Hex")
    rows_raw = value.get("stateRowsF64Hex")
    parameters_raw = value.get("parameters")
    summary_raw = value.get("summaryF64Hex")
    if (
        type(mesh_raw) is not list
        or type(rows_raw) is not list
        or len(rows_raw) != 4
        or type(parameters_raw) is not dict
        or type(summary_raw) is not dict
    ):
        raise ProofCenterProjectionError("projection_input_shape_invalid")
    mesh = tuple(
        _decode_f64(item, f"mesh[{index}]")
        for index, item in enumerate(mesh_raw)
    )
    rows = tuple(
        tuple(
            _decode_f64(item, f"state[{row}][{column}]")
            for column, item in enumerate(row_raw)
        )
        for row, row_raw in enumerate(rows_raw)
    )
    if any(len(row) != len(mesh) for row in rows) or any(
        mesh[index] <= mesh[index - 1] for index in range(1, len(mesh))
    ):
        raise ProofCenterProjectionError("projection_input_mesh_invalid")
    vc = _decode_f64(parameters_raw.get("VcF64Hex"), "Vc")
    nu = _decode_f64(parameters_raw.get("nuF64Hex"), "nu")
    mass = _decode_f64(summary_raw.get("mass"), "mass")
    kappa = _decode_f64(summary_raw.get("kappa"), "kappa")
    sigma = _decode_f64(summary_raw.get("sigma"), "sigma")
    a, b = _origin_coefficients(vc, nu)
    u_spline = CubicHermiteSpline(mesh, rows[0], rows[1])
    v_spline = CubicHermiteSpline(mesh, rows[2], rows[3])

    def profile(x: float) -> tuple[float, float]:
        if x < EPSILON:
            return _series(a, x), _series(b, x)
        if x <= OUTER_RADIUS:
            return float(u_spline(x)), float(v_spline(x))
        u_value = rows[0][-1] * math.exp(-kappa * (x - OUTER_RADIUS))
        u_value *= (x / OUTER_RADIUS) ** sigma
        return u_value, -mass / x

    rho_nodes = tuple(
        (1.0 - math.cos(math.pi * index / (CORE_MODE_COUNT - 1))) / 2.0
        for index in range(CORE_MODE_COUNT)
    )
    sampled = []
    for rho in rho_nodes:
        sampled.append((0.0, 0.0) if rho == 1.0 else profile(rho / (1.0 - rho)))
    u_values = tuple(item[0] for item in sampled)
    v_values = tuple(item[1] for item in sampled)
    u_coefficients = _dct_i(u_values)
    v_coefficients = _dct_i(v_values)
    maximum_node_error = max(
        max(
            abs(_evaluate_chebyshev(coefficients, rho) - expected)
            / (1.0 + abs(expected))
            for rho, expected in zip(rho_nodes, expected_values, strict=True)
        )
        for coefficients, expected_values in (
            (u_coefficients, u_values),
            (v_coefficients, v_values),
        )
    )
    join_rho = OUTER_RADIUS / (1.0 + OUTER_RADIUS)
    join_u = _evaluate_chebyshev(u_coefficients, join_rho)
    join_v = _evaluate_chebyshev(v_coefficients, join_rho)
    maximum_join_error = max(
        abs(join_u - rows[0][-1]), abs(join_v - rows[2][-1])
    )
    endpoint_error = max(
        abs(_evaluate_chebyshev(u_coefficients, 0.0) - 1.0),
        abs(_evaluate_chebyshev(v_coefficients, 0.0) - vc),
        abs(_evaluate_chebyshev(u_coefficients, 1.0)),
        abs(_evaluate_chebyshev(v_coefficients, 1.0)),
    )
    if maximum_node_error > NODE_RECONSTRUCTION_LIMIT:
        raise ProofCenterProjectionError("projection_node_reconstruction_failed")
    if maximum_join_error > JOIN_RECONSTRUCTION_LIMIT:
        raise ProofCenterProjectionError("projection_join_reconstruction_failed")
    if endpoint_error > NODE_RECONSTRUCTION_LIMIT:
        raise ProofCenterProjectionError("projection_endpoint_reconstruction_failed")
    lambda_value = 2.0**-5
    nu_star = lambda_value * lambda_value * nu
    scalars = (
        nu,
        vc,
        4.0 * math.pi * mass,
        mass,
        kappa,
        sigma,
        lambda_value,
        nu_star,
        math.sqrt(1.0 + 2.0 * nu_star),
    )
    zero_tail = (0.0,) * TAIL_MODE_COUNT
    payloads = {
        "scalars.f64le": _encode_f64le(scalars),
        "coefficients/core_L2_u.f64le": _encode_f64le(u_coefficients),
        "coefficients/core_L2_V.f64le": _encode_f64le(v_coefficients),
        "coefficients/tail_H.f64le": _encode_f64le(zero_tail),
        "coefficients/tail_Q.f64le": _encode_f64le(zero_tail),
    }
    observed_inventory = tuple(
        (path, len(payloads[path])) for path, _size in PAYLOAD_ORDER
    )
    if observed_inventory != PAYLOAD_ORDER:
        raise ProofCenterProjectionError("projection_payload_inventory_invalid")
    diagnostics = {
        "endpointErrorF64Hex": struct.pack(">d", endpoint_error).hex(),
        "joinErrorF64Hex": struct.pack(">d", maximum_join_error).hex(),
        "nodeErrorF64Hex": struct.pack(">d", maximum_node_error).hex(),
    }
    return diagnostics, payloads


def materialize_proof_center(output_root: str) -> str:
    if type(output_root) is not str or not output_root:
        raise ProofCenterProjectionError("projection_output_root_invalid")
    target = Path(output_root).resolve()
    partial = target.with_name(target.name + ".partial")
    if target.exists() or partial.exists():
        raise ProofCenterProjectionError("projection_output_collision")
    value = _verify_and_load_input()
    diagnostics, payloads = _project(value)
    source_raw = Path(__file__).resolve().read_bytes()
    bindings = [
        {
            "ordinal": ordinal,
            "path": path,
            "sizeBytes": len(payloads[path]),
            "rawSha256": _sha256(payloads[path]),
        }
        for ordinal, (path, _size) in enumerate(PAYLOAD_ORDER)
    ]
    unsigned = {
        "artifactId": "nhm2.spherical_boson_star_v2.lambda_zero_proof_center",
        "authorityLocks": dict(AUTHORITY_LOCKS),
        "decision": "PROPOSED_PROOF_CENTER_ONLY",
        "diagnostics": diagnostics,
        "inputRawSha256": INPUT_RAW_SHA256,
        "inputReceiptSha256": INPUT_RECEIPT_SHA256,
        "noRetune": True,
        "orderedPayloadBindings": bindings,
        "projectionVersion": PROJECTION_VERSION,
        "proposalRawSha256": PROPOSAL_RAW_SHA256,
        "sourceRawSha256": _sha256(source_raw),
        "sourceRawSizeBytes": len(source_raw),
        "tailCorrectionsArePositiveZero": True,
    }
    full = dict(unsigned)
    full["receiptSha256"] = _receipt_hash(unsigned)
    try:
        partial.mkdir(parents=False)
        for path, _size in PAYLOAD_ORDER:
            destination = partial / Path(path)
            destination.parent.mkdir(parents=True, exist_ok=True)
            with destination.open("xb") as handle:
                handle.write(payloads[path])
                handle.flush()
                os.fsync(handle.fileno())
        receipt_path = partial / "receipt.json"
        with receipt_path.open("xb") as handle:
            handle.write(_canonical(full))
            handle.flush()
            os.fsync(handle.fileno())
        partial.rename(target)
    except Exception:
        raise
    return full["receiptSha256"]


if (
    CORE_MODE_COUNT != 128
    or TAIL_MODE_COUNT != 32
    or len(PAYLOAD_ORDER) != 5
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("lambda_zero_proof_center_projection_invariant")


__all__ = [
    "AUTHORITY_LOCKS",
    "PROJECTION_VERSION",
    "ProofCenterProjectionError",
    "materialize_proof_center",
]
