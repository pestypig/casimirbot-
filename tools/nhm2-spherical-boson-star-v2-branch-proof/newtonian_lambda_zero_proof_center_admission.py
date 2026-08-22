"""Independent admission replay for the frozen lambda-zero proof center.

Program gate: G2 — classical branch proof and terminal state
Workstream: lambda-zero limiting-ground-state proof closure
Capability or component: independent proof-center byte admission
Current maturity: projected calculation center; no directed global proof
Target maturity: content-addressed authority-neutral admission receipt
Required frozen inputs: exact global-center and projection bytes
Required evidence: hashes, codecs, reconstruction, joins, false locks
Stop/fail criteria: first binding, shape, scalar, or reconstruction mismatch
Explicit non-goals: solve, proof, candidate, lamp, or physical authority
Downstream gate unlocked: directed global-profile proof ingestion only
"""

from __future__ import annotations

from bisect import bisect_right
from fractions import Fraction
import hashlib
import json
import math
import os
from pathlib import Path
import struct
from types import MappingProxyType
from typing import Final


ADMISSION_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_v2_lambda_zero_proof_center_admission/v1"
)
REPOSITORY_ROOT: Final[Path] = Path(__file__).resolve().parents[2]
GLOBAL_CENTER_PATH: Final[Path] = (
    REPOSITORY_ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "lambda-zero-global-root-primary-v1.json"
)
GLOBAL_CENTER_RAW_SHA256: Final[str] = (
    "d0b0f74da5eb2512fe23e4bb049aa1d68cef6d9c9f590af993027b4af6509f30"
)
GLOBAL_CENTER_SIZE_BYTES: Final[int] = 196_505
GLOBAL_CENTER_RECEIPT_SHA256: Final[str] = (
    "bc8269c95543a0507a1d261093e51ebb8f23199f8f406e22742fd191e4f39e9d"
)
GLOBAL_CENTER_RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/lambda-zero-global-root-primary/v1\n"
)
PROJECTION_ROOT: Final[Path] = (
    REPOSITORY_ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "lambda-zero-proof-center-v1"
)
PROJECTION_RECEIPT_RAW_SHA256: Final[str] = (
    "08e0eb93a8f39f804bfa069c680bf85303ce4614aa16c3b2129c107d4527f330"
)
PROJECTION_RECEIPT_SIZE_BYTES: Final[int] = 1_841
PROJECTION_RECEIPT_SHA256: Final[str] = (
    "754db1dc77a39e4560607b393763d760ae8ebeb8fa4245143bb1280fc9745d14"
)
PROJECTION_RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/lambda-zero-proof-center-projection/v1\n"
)
PROJECTION_SOURCE_PATH: Final[Path] = (
    REPOSITORY_ROOT
    / "tools"
    / "nhm2-spherical-boson-star-v2-branch-proof"
    / "newtonian_lambda_zero_proof_center_projection.py"
)
PROJECTION_SOURCE_RAW_SHA256: Final[str] = (
    "a859191d2989c3b1e03a96d1f7dd000a80e1425021da87e3ae3687cfff02f33b"
)
PROJECTION_SOURCE_SIZE_BYTES: Final[int] = 15_771
PROPOSAL_PATH: Final[Path] = (
    REPOSITORY_ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2-lambda-zero-proof-center-admission.md"
)
PROPOSAL_RAW_SHA256: Final[str] = (
    "3cb018c09ccd121659bfec15eee577ee2966ee33070c320a520611bb1080f27f"
)
PROPOSAL_SIZE_BYTES: Final[int] = 3_983
OUTPUT_PATH: Final[Path] = (
    REPOSITORY_ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "lambda-zero-proof-center-admission-v1.json"
)
ADMISSION_RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/lambda-zero-proof-center-admission/v1\n"
)

CORE_MODE_COUNT: Final[int] = 128
TAIL_MODE_COUNT: Final[int] = 32
OUTER_RADIUS: Final[float] = 32.0
EPSILON: Final[float] = 2.0**-12
ORIGIN_MAXIMUM_INDEX: Final[int] = 16
NODE_RECONSTRUCTION_LIMIT: Final[float] = 2.0**-40
JOIN_RECONSTRUCTION_LIMIT: Final[float] = 2.0**-28
ENDPOINT_RECONSTRUCTION_LIMIT: Final[float] = 2.0**-40

PAYLOAD_ORDER: Final[tuple[tuple[str, int, str], ...]] = (
    (
        "scalars.f64le",
        72,
        "a03f00ec97ccc41798f38092be05a77af248ae63097c83ff34ed17d39bfc0872",
    ),
    (
        "coefficients/core_L2_u.f64le",
        1_024,
        "1aa202f58afdb5e23a3e12e5f216ffcff08ad55343e8a8a2823497d826f8af69",
    ),
    (
        "coefficients/core_L2_V.f64le",
        1_024,
        "44543910df07444709f963b1711dcd66f165e97ce78602fc17eae49330f6eb83",
    ),
    (
        "coefficients/tail_H.f64le",
        256,
        "5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1",
    ),
    (
        "coefficients/tail_Q.f64le",
        256,
        "5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1",
    ),
)
EXPECTED_INVENTORY: Final[tuple[str, ...]] = tuple(
    sorted(("receipt.json", *(item[0] for item in PAYLOAD_ORDER)))
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


class ProofCenterAdmissionError(RuntimeError):
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


def _length_delimited_hash(domain: bytes, unsigned: dict[str, object]) -> str:
    raw = _canonical(unsigned)
    return _sha256(domain + _u64le(len(raw)) + raw)


def _read_fixed_file(path: Path, size: int, raw_sha256: str, code: str) -> bytes:
    if path.is_symlink() or not path.is_file():
        raise ProofCenterAdmissionError(code, "path")
    raw = path.read_bytes()
    if len(raw) != size or _sha256(raw) != raw_sha256:
        raise ProofCenterAdmissionError(code, "bytes")
    return raw


def _load_canonical_receipt(
    raw: bytes,
    expected_self_hash: str,
    domain: bytes,
    code: str,
) -> dict[str, object]:
    try:
        value = json.loads(raw)
    except Exception as error:
        raise ProofCenterAdmissionError(code, "json") from error
    if type(value) is not dict or _canonical(value) != raw:
        raise ProofCenterAdmissionError(code, "canonical")
    if value.get("receiptSha256") != expected_self_hash:
        raise ProofCenterAdmissionError(code, "literal")
    unsigned = dict(value)
    del unsigned["receiptSha256"]
    if _length_delimited_hash(domain, unsigned) != expected_self_hash:
        raise ProofCenterAdmissionError(code, "self_hash")
    return value


def _decode_be_f64_hex(value: object, role: str) -> float:
    if type(value) is not str or len(value) != 16:
        raise ProofCenterAdmissionError("admission_global_f64_invalid", role)
    try:
        raw = bytes.fromhex(value)
        number = struct.unpack(">d", raw)[0]
    except Exception as error:
        raise ProofCenterAdmissionError(
            "admission_global_f64_invalid", role
        ) from error
    if not math.isfinite(number) or raw == bytes.fromhex("8000000000000000"):
        raise ProofCenterAdmissionError("admission_global_f64_invalid", role)
    return number


def _decode_le_f64_payload(raw: bytes, count: int, role: str) -> tuple[float, ...]:
    if len(raw) != count * 8:
        raise ProofCenterAdmissionError("admission_payload_shape_invalid", role)
    values: list[float] = []
    for ordinal in range(count):
        word = raw[ordinal * 8 : (ordinal + 1) * 8]
        value = struct.unpack("<d", word)[0]
        if not math.isfinite(value) or word == bytes.fromhex("0000000000000080"):
            raise ProofCenterAdmissionError(
                "admission_payload_f64_invalid", f"{role}[{ordinal}]"
            )
        values.append(value)
    return tuple(values)


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


def _hermite(
    mesh: tuple[float, ...],
    values: tuple[float, ...],
    derivatives: tuple[float, ...],
    x: float,
) -> float:
    index = min(len(mesh) - 2, max(0, bisect_right(mesh, x) - 1))
    x0 = mesh[index]
    x1 = mesh[index + 1]
    width = x1 - x0
    if width <= 0.0 or x < x0 or x > x1:
        raise ProofCenterAdmissionError("admission_hermite_interval_invalid")
    t = (x - x0) / width
    t2 = t * t
    t3 = t2 * t
    return math.fsum(
        (
            (2.0 * t3 - 3.0 * t2 + 1.0) * values[index],
            (t3 - 2.0 * t2 + t) * width * derivatives[index],
            (-2.0 * t3 + 3.0 * t2) * values[index + 1],
            (t3 - t2) * width * derivatives[index + 1],
        )
    )


def _evaluate_chebyshev(coefficients: tuple[float, ...], rho: float) -> float:
    coordinate = max(-1.0, min(1.0, 2.0 * rho - 1.0))
    theta = math.acos(coordinate)
    return math.fsum(
        coefficient * math.cos(mode * theta)
        for mode, coefficient in enumerate(coefficients)
    )


def _load_inputs() -> tuple[dict[str, object], dict[str, object], dict[str, bytes]]:
    global_raw = _read_fixed_file(
        GLOBAL_CENTER_PATH,
        GLOBAL_CENTER_SIZE_BYTES,
        GLOBAL_CENTER_RAW_SHA256,
        "admission_global_center_binding_mismatch",
    )
    global_value = _load_canonical_receipt(
        global_raw,
        GLOBAL_CENTER_RECEIPT_SHA256,
        GLOBAL_CENTER_RECEIPT_DOMAIN,
        "admission_global_center_receipt_invalid",
    )
    if global_value.get("decision") != "CALCULATION_CENTER_ONLY":
        raise ProofCenterAdmissionError("admission_global_center_decision_invalid")
    global_locks = global_value.get("authorityLocks")
    if type(global_locks) is not dict or any(
        item is not False for item in global_locks.values()
    ):
        raise ProofCenterAdmissionError("admission_global_center_authority_invalid")

    if PROJECTION_ROOT.is_symlink() or not PROJECTION_ROOT.is_dir():
        raise ProofCenterAdmissionError("admission_projection_root_invalid")
    inventory: list[str] = []
    for path in PROJECTION_ROOT.rglob("*"):
        if path.is_symlink():
            raise ProofCenterAdmissionError("admission_projection_symlink_invalid")
        if path.is_file():
            inventory.append(path.relative_to(PROJECTION_ROOT).as_posix())
        elif not path.is_dir():
            raise ProofCenterAdmissionError("admission_projection_entry_invalid")
    if tuple(sorted(inventory)) != EXPECTED_INVENTORY:
        raise ProofCenterAdmissionError("admission_projection_inventory_invalid")

    receipt_raw = _read_fixed_file(
        PROJECTION_ROOT / "receipt.json",
        PROJECTION_RECEIPT_SIZE_BYTES,
        PROJECTION_RECEIPT_RAW_SHA256,
        "admission_projection_receipt_binding_mismatch",
    )
    projection = _load_canonical_receipt(
        receipt_raw,
        PROJECTION_RECEIPT_SHA256,
        PROJECTION_RECEIPT_DOMAIN,
        "admission_projection_receipt_invalid",
    )
    if (
        projection.get("decision") != "PROPOSED_PROOF_CENTER_ONLY"
        or projection.get("noRetune") is not True
        or projection.get("tailCorrectionsArePositiveZero") is not True
        or projection.get("inputRawSha256") != GLOBAL_CENTER_RAW_SHA256
        or projection.get("inputReceiptSha256")
        != GLOBAL_CENTER_RECEIPT_SHA256
        or projection.get("sourceRawSha256") != PROJECTION_SOURCE_RAW_SHA256
        or projection.get("sourceRawSizeBytes") != PROJECTION_SOURCE_SIZE_BYTES
    ):
        raise ProofCenterAdmissionError("admission_projection_metadata_invalid")
    projection_locks = projection.get("authorityLocks")
    if projection_locks != dict(AUTHORITY_LOCKS):
        raise ProofCenterAdmissionError("admission_projection_authority_invalid")
    _read_fixed_file(
        PROJECTION_SOURCE_PATH,
        PROJECTION_SOURCE_SIZE_BYTES,
        PROJECTION_SOURCE_RAW_SHA256,
        "admission_projection_source_binding_mismatch",
    )
    _read_fixed_file(
        PROPOSAL_PATH,
        PROPOSAL_SIZE_BYTES,
        PROPOSAL_RAW_SHA256,
        "admission_proposal_binding_mismatch",
    )

    expected_bindings = [
        {
            "ordinal": ordinal,
            "path": path,
            "rawSha256": raw_sha256,
            "sizeBytes": size,
        }
        for ordinal, (path, size, raw_sha256) in enumerate(PAYLOAD_ORDER)
    ]
    if projection.get("orderedPayloadBindings") != expected_bindings:
        raise ProofCenterAdmissionError("admission_payload_ledger_invalid")
    payloads = {
        path: _read_fixed_file(
            PROJECTION_ROOT / Path(path),
            size,
            raw_sha256,
            "admission_payload_binding_mismatch",
        )
        for path, size, raw_sha256 in PAYLOAD_ORDER
    }
    return global_value, projection, payloads


def _replay(
    global_value: dict[str, object],
    projection: dict[str, object],
    payloads: dict[str, bytes],
) -> dict[str, str]:
    mesh_raw = global_value.get("meshF64Hex")
    rows_raw = global_value.get("stateRowsF64Hex")
    parameters = global_value.get("parameters")
    summary = global_value.get("summaryF64Hex")
    if (
        type(mesh_raw) is not list
        or type(rows_raw) is not list
        or len(rows_raw) != 4
        or type(parameters) is not dict
        or type(summary) is not dict
    ):
        raise ProofCenterAdmissionError("admission_global_shape_invalid")
    mesh = tuple(
        _decode_be_f64_hex(item, f"mesh[{ordinal}]")
        for ordinal, item in enumerate(mesh_raw)
    )
    rows = tuple(
        tuple(
            _decode_be_f64_hex(item, f"state[{row}][{column}]")
            for column, item in enumerate(row_raw)
        )
        for row, row_raw in enumerate(rows_raw)
    )
    if len(mesh) < 2 or any(len(row) != len(mesh) for row in rows):
        raise ProofCenterAdmissionError("admission_global_state_shape_invalid")
    if any(mesh[index] <= mesh[index - 1] for index in range(1, len(mesh))):
        raise ProofCenterAdmissionError("admission_global_mesh_invalid")
    vc = _decode_be_f64_hex(parameters.get("VcF64Hex"), "Vc")
    nu = _decode_be_f64_hex(parameters.get("nuF64Hex"), "nu")
    mass = _decode_be_f64_hex(summary.get("mass"), "mass")
    kappa = _decode_be_f64_hex(summary.get("kappa"), "kappa")
    sigma = _decode_be_f64_hex(summary.get("sigma"), "sigma")
    scalars = _decode_le_f64_payload(payloads["scalars.f64le"], 9, "scalars")
    lambda_value = 2.0**-5
    nu_star = lambda_value * lambda_value * nu
    expected_scalars = (
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
    if b"".join(struct.pack("<d", item) for item in expected_scalars) != payloads[
        "scalars.f64le"
    ]:
        raise ProofCenterAdmissionError("admission_scalar_relation_mismatch")
    if scalars != expected_scalars:
        raise ProofCenterAdmissionError("admission_scalar_decode_mismatch")

    u_coefficients = _decode_le_f64_payload(
        payloads["coefficients/core_L2_u.f64le"], CORE_MODE_COUNT, "core_L2_u"
    )
    v_coefficients = _decode_le_f64_payload(
        payloads["coefficients/core_L2_V.f64le"], CORE_MODE_COUNT, "core_L2_V"
    )
    tail_h = _decode_le_f64_payload(
        payloads["coefficients/tail_H.f64le"], TAIL_MODE_COUNT, "tail_H"
    )
    tail_q = _decode_le_f64_payload(
        payloads["coefficients/tail_Q.f64le"], TAIL_MODE_COUNT, "tail_Q"
    )
    if any(value != 0.0 for value in (*tail_h, *tail_q)):
        raise ProofCenterAdmissionError("admission_tail_correction_nonzero")

    origin_u, origin_v = _origin_coefficients(vc, nu)

    def expected_profile(x: float) -> tuple[float, float]:
        if x < EPSILON:
            return _series(origin_u, x), _series(origin_v, x)
        if x <= OUTER_RADIUS:
            return (
                _hermite(mesh, rows[0], rows[1], x),
                _hermite(mesh, rows[2], rows[3], x),
            )
        u_value = rows[0][-1] * math.exp(-kappa * (x - OUTER_RADIUS))
        u_value *= (x / OUTER_RADIUS) ** sigma
        return u_value, -mass / x

    rho_nodes = tuple(
        (1.0 - math.cos(math.pi * index / (CORE_MODE_COUNT - 1))) / 2.0
        for index in range(CORE_MODE_COUNT)
    )
    maximum_node_error = 0.0
    for rho in rho_nodes:
        expected_u, expected_v = (
            (0.0, 0.0) if rho == 1.0 else expected_profile(rho / (1.0 - rho))
        )
        observed_u = _evaluate_chebyshev(u_coefficients, rho)
        observed_v = _evaluate_chebyshev(v_coefficients, rho)
        maximum_node_error = max(
            maximum_node_error,
            abs(observed_u - expected_u) / (1.0 + abs(expected_u)),
            abs(observed_v - expected_v) / (1.0 + abs(expected_v)),
        )
    endpoint_error = max(
        abs(_evaluate_chebyshev(u_coefficients, 0.0) - 1.0),
        abs(_evaluate_chebyshev(v_coefficients, 0.0) - vc),
        abs(_evaluate_chebyshev(u_coefficients, 1.0)),
        abs(_evaluate_chebyshev(v_coefficients, 1.0)),
    )
    join_rho = OUTER_RADIUS / (1.0 + OUTER_RADIUS)
    join_error = max(
        abs(_evaluate_chebyshev(u_coefficients, join_rho) - rows[0][-1]),
        abs(_evaluate_chebyshev(v_coefficients, join_rho) - rows[2][-1]),
    )
    if maximum_node_error > NODE_RECONSTRUCTION_LIMIT:
        raise ProofCenterAdmissionError("admission_node_reconstruction_failed")
    if endpoint_error > ENDPOINT_RECONSTRUCTION_LIMIT:
        raise ProofCenterAdmissionError("admission_endpoint_reconstruction_failed")
    if join_error > JOIN_RECONSTRUCTION_LIMIT:
        raise ProofCenterAdmissionError("admission_join_reconstruction_failed")

    primary_diagnostics = projection.get("diagnostics")
    if type(primary_diagnostics) is not dict:
        raise ProofCenterAdmissionError("admission_primary_diagnostics_invalid")
    for role, limit in (
        ("endpointErrorF64Hex", ENDPOINT_RECONSTRUCTION_LIMIT),
        ("joinErrorF64Hex", JOIN_RECONSTRUCTION_LIMIT),
        ("nodeErrorF64Hex", NODE_RECONSTRUCTION_LIMIT),
    ):
        if _decode_be_f64_hex(primary_diagnostics.get(role), role) > limit:
            raise ProofCenterAdmissionError("admission_primary_screen_failed", role)
    return {
        "endpointErrorF64Hex": struct.pack(">d", endpoint_error).hex(),
        "joinErrorF64Hex": struct.pack(">d", join_error).hex(),
        "nodeErrorF64Hex": struct.pack(">d", maximum_node_error).hex(),
    }


def materialize_proof_center_admission() -> str:
    """Replay fixed bytes once and exclusively persist the admission receipt."""

    if OUTPUT_PATH.exists() or OUTPUT_PATH.is_symlink():
        raise ProofCenterAdmissionError("admission_output_collision")
    global_value, projection, payloads = _load_inputs()
    diagnostics = _replay(global_value, projection, payloads)
    source_raw = Path(__file__).resolve().read_bytes()
    unsigned = {
        "admissionVersion": ADMISSION_VERSION,
        "artifactId": (
            "nhm2.spherical_boson_star_v2.lambda_zero_proof_center_admission"
        ),
        "authorityLocks": dict(AUTHORITY_LOCKS),
        "decision": "PROOF_CENTER_ADMITTED_AS_CALCULATION_INPUT_ONLY",
        "globalCenterRawSha256": GLOBAL_CENTER_RAW_SHA256,
        "globalCenterReceiptSha256": GLOBAL_CENTER_RECEIPT_SHA256,
        "independentDiagnostics": diagnostics,
        "noRetune": True,
        "orderedPayloadBindings": projection["orderedPayloadBindings"],
        "primaryDiagnosticsDecisionAuthority": False,
        "projectionReceiptRawSha256": PROJECTION_RECEIPT_RAW_SHA256,
        "projectionReceiptSha256": PROJECTION_RECEIPT_SHA256,
        "proposalRawSha256": PROPOSAL_RAW_SHA256,
        "representationAccepted": True,
        "sourceRawSha256": _sha256(source_raw),
        "sourceRawSizeBytes": len(source_raw),
        "tailCorrectionsArePositiveZero": True,
    }
    full = dict(unsigned)
    full["receiptSha256"] = _length_delimited_hash(
        ADMISSION_RECEIPT_DOMAIN, unsigned
    )
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    raw = _canonical(full)
    try:
        with OUTPUT_PATH.open("xb") as handle:
            handle.write(raw)
            handle.flush()
            os.fsync(handle.fileno())
    except FileExistsError as error:
        raise ProofCenterAdmissionError("admission_output_collision") from error
    return full["receiptSha256"]


if (
    CORE_MODE_COUNT != 128
    or TAIL_MODE_COUNT != 32
    or len(PAYLOAD_ORDER) != 5
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("lambda_zero_proof_center_admission_invariant")


__all__ = [
    "ADMISSION_VERSION",
    "AUTHORITY_LOCKS",
    "ProofCenterAdmissionError",
    "materialize_proof_center_admission",
]


if __name__ == "__main__":
    print(materialize_proof_center_admission())
