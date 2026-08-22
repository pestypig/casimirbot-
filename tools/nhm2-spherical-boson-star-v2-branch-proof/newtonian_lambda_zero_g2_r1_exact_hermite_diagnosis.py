"""One-shot exact G2-R1 Hermite-versus-projection cause diagnosis.

Program gate: G2-R1 — global-center/core-representation diagnosis
Workstream: versioned classical-branch repair review
Capability or component: exact immutable-center Hermite residual diagnosis
Current maturity: authenticated projected-center counterexample
Target maturity: content-addressed successor-class diagnosis
Required frozen inputs: proposal plus four immutable G2 receipts
Required evidence: exact binary64 injection, Hermite jets, and inequality
Stop/fail criteria: first binding, shape, arithmetic, decision, or collision error
Explicit non-goals: replacement center/codec, later duties, or authority
Downstream gate unlocked: exactly one versioned G2B successor review
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


DIAGNOSIS_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_v2_g2_r1_exact_hermite_diagnosis/v1"
)
ROOT: Final[Path] = Path(__file__).resolve().parents[2]
ARTIFACT_ROOT: Final[Path] = (
    ROOT / "artifacts" / "nhm2-spherical-boson-star-v2-g2"
)
PROPOSAL_PATH: Final[Path] = (
    ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2-r1-exact-hermite-diagnosis-proposal.md"
)
PROPOSAL_RAW_SHA256: Final[str] = (
    "4b17d5704155611eed628b5bd3ac6a374684fa3f1de0a24b164feab0b19c3fa7"
)
PROPOSAL_SIZE_BYTES: Final[int] = 4_870
ACTIVE_PACKET_PATH: Final[Path] = (
    ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2-r1-center-projection-diagnosis.md"
)
ACTIVE_PACKET_RAW_SHA256: Final[str] = (
    "01a811fb186120d9fa1d92faf0c1ce1630e200c0a64da7fb3c91659132fab8a0"
)
ACTIVE_PACKET_SIZE_BYTES: Final[int] = 3_140
GLOBAL_PATH: Final[Path] = (
    ARTIFACT_ROOT / "lambda-zero-global-root-primary-v1.json"
)
GLOBAL_RAW_SHA256: Final[str] = (
    "d0b0f74da5eb2512fe23e4bb049aa1d68cef6d9c9f590af993027b4af6509f30"
)
GLOBAL_SIZE_BYTES: Final[int] = 196_505
GLOBAL_SELF_SHA256: Final[str] = (
    "bc8269c95543a0507a1d261093e51ebb8f23199f8f406e22742fd191e4f39e9d"
)
PROJECTION_PATH: Final[Path] = (
    ARTIFACT_ROOT / "lambda-zero-proof-center-v1" / "receipt.json"
)
PROJECTION_RAW_SHA256: Final[str] = (
    "08e0eb93a8f39f804bfa069c680bf85303ce4614aa16c3b2129c107d4527f330"
)
PROJECTION_SIZE_BYTES: Final[int] = 1_841
PROJECTION_SELF_SHA256: Final[str] = (
    "754db1dc77a39e4560607b393763d760ae8ebeb8fa4245143bb1280fc9745d14"
)
ADMISSION_PATH: Final[Path] = (
    ARTIFACT_ROOT / "lambda-zero-proof-center-admission-v1.json"
)
ADMISSION_RAW_SHA256: Final[str] = (
    "ff07124e88673fee04f9ca7e3e7c4b6545a1ee37fb70bda43a140e56bf582645"
)
ADMISSION_SIZE_BYTES: Final[int] = 2_158
ADMISSION_SELF_SHA256: Final[str] = (
    "ff37f9eebebcaf49a5d3fd88d749c62071e33cc5f58b3af6f069700a88a530df"
)
POLYNOMIAL_PATH: Final[Path] = (
    ARTIFACT_ROOT / "lambda-zero-core-residual-witness-v1.json"
)
POLYNOMIAL_RAW_SHA256: Final[str] = (
    "ad44b456c00c9644e73da27ebbe737f6fafbe99cac835e41519449c72479c691"
)
POLYNOMIAL_SIZE_BYTES: Final[int] = 6_922
POLYNOMIAL_SELF_SHA256: Final[str] = (
    "bde9c4ebfefade6354c8248295d5511cbc864dc23e79a7948ff976a91c2e188d"
)
POLYNOMIAL_FRACTION_EVIDENCE_SHA256: Final[str] = (
    "0dedd3a913bd1e70c75b5b6fa74cbd7be2a358c518562f19f2dfd80fcd068706"
)
OUTPUT_PATH: Final[Path] = (
    ARTIFACT_ROOT / "g2-r1-exact-hermite-diagnosis-v1.json"
)

GLOBAL_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/lambda-zero-global-root-primary/v1\n"
)
PROJECTION_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/lambda-zero-proof-center-projection/v1\n"
)
ADMISSION_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/lambda-zero-proof-center-admission/v1\n"
)
POLYNOMIAL_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/lambda-zero-core-residual-witness/v1\n"
)
RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2-r1-exact-hermite-diagnosis/v1\n"
)

POINT_X: Final[Fraction] = Fraction(1, 128)
THRESHOLD: Final[Fraction] = Fraction(1, 10_000_000_000)
MAXIMUM_MESH_LENGTH: Final[int] = 16_385
MAXIMUM_RATIONAL_BITS: Final[int] = 262_144
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


class G2R1DiagnosisError(RuntimeError):
    """Typed fail-closed diagnosis error."""

    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(code if not detail else f"{code}:{detail}")
        self.code = code
        self.detail = detail


def _sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _canonical_bytes(value: object) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=True,
        allow_nan=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("ascii")


def _pairs_object(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in pairs:
        if key in result:
            raise G2R1DiagnosisError("diagnosis_duplicate_json_key", key)
        result[key] = value
    return result


def _read_bound(path: Path, size: int, digest: str, code: str) -> bytes:
    raw = path.read_bytes()
    if len(raw) != size or _sha256(raw) != digest:
        raise G2R1DiagnosisError(code)
    return raw


def _parse_bound_json(path: Path, size: int, digest: str, code: str) -> dict:
    raw = _read_bound(path, size, digest, code)
    try:
        value = json.loads(raw.decode("ascii"), object_pairs_hook=_pairs_object)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise G2R1DiagnosisError(f"{code}_json") from error
    if type(value) is not dict or _canonical_bytes(value) != raw:
        raise G2R1DiagnosisError(f"{code}_canonical")
    return value


def _verify_self_hash(value: dict, domain: bytes, expected: str, code: str) -> None:
    if value.get("receiptSha256") != expected:
        raise G2R1DiagnosisError(code)
    unsigned = dict(value)
    del unsigned["receiptSha256"]
    raw = _canonical_bytes(unsigned)
    observed = _sha256(domain + struct.pack("<Q", len(raw)) + raw)
    if observed != expected:
        raise G2R1DiagnosisError(code)


def _check_fraction(value: Fraction, label: str) -> None:
    if (
        value.numerator.bit_length() > MAXIMUM_RATIONAL_BITS
        or value.denominator.bit_length() > MAXIMUM_RATIONAL_BITS
    ):
        raise G2R1DiagnosisError("diagnosis_rational_budget_exceeded", label)


def _binary64_fraction_hex(word: object, label: str) -> Fraction:
    if type(word) is not str or len(word) != 16:
        raise G2R1DiagnosisError("diagnosis_binary64_word_invalid", label)
    try:
        bits = int(word, 16)
    except ValueError as error:
        raise G2R1DiagnosisError("diagnosis_binary64_word_invalid", label) from error
    sign = -1 if bits >> 63 else 1
    exponent = (bits >> 52) & 0x7FF
    fraction = bits & ((1 << 52) - 1)
    if exponent == 0x7FF or (bits == 1 << 63):
        raise G2R1DiagnosisError("diagnosis_binary64_word_invalid", label)
    if exponent == 0:
        significand = fraction
        shift = -1074
    else:
        significand = (1 << 52) | fraction
        shift = exponent - 1023 - 52
    value = Fraction(sign * significand)
    value = value * (1 << shift) if shift >= 0 else value / (1 << -shift)
    _check_fraction(value, label)
    return value


def _fraction_from_record(value: object, label: str) -> Fraction:
    if type(value) is not dict or set(value) != {"denominator", "numerator"}:
        raise G2R1DiagnosisError("diagnosis_fraction_record_invalid", label)
    numerator = value.get("numerator")
    denominator = value.get("denominator")
    if (
        type(numerator) is not str
        or type(denominator) is not str
        or not numerator.lstrip("-").isdigit()
        or not denominator.isdigit()
        or denominator.startswith("0")
    ):
        raise G2R1DiagnosisError("diagnosis_fraction_record_invalid", label)
    result = Fraction(int(numerator), int(denominator))
    _check_fraction(result, label)
    return result


def _fraction_json(value: Fraction) -> dict[str, str]:
    return {
        "denominator": str(value.denominator),
        "numerator": str(value.numerator),
    }


def _hermite_jet(
    x0: Fraction,
    x1: Fraction,
    y0: Fraction,
    y1: Fraction,
    m0: Fraction,
    m1: Fraction,
    x: Fraction,
    label: str,
) -> tuple[Fraction, Fraction, Fraction]:
    if not x0 < x < x1:
        raise G2R1DiagnosisError("diagnosis_point_not_strictly_inside", label)
    h = x1 - x0
    s = (x - x0) / h
    value = (2 * s**3 - 3 * s**2 + 1) * y0
    value += (s**3 - 2 * s**2 + s) * h * m0
    value += (-2 * s**3 + 3 * s**2) * y1
    value += (s**3 - s**2) * h * m1
    first_s = (6 * s**2 - 6 * s) * y0
    first_s += (3 * s**2 - 4 * s + 1) * h * m0
    first_s += (-6 * s**2 + 6 * s) * y1
    first_s += (3 * s**2 - 2 * s) * h * m1
    second_s = (12 * s - 6) * y0
    second_s += (6 * s - 4) * h * m0
    second_s += (-12 * s + 6) * y1
    second_s += (6 * s - 2) * h * m1
    result = (value, first_s / h, second_s / (h * h))
    for ordinal, item in enumerate(result):
        _check_fraction(item, f"{label}[{ordinal}]")
    return result


def _load_inputs() -> tuple[dict, dict, dict, dict]:
    _read_bound(
        PROPOSAL_PATH,
        PROPOSAL_SIZE_BYTES,
        PROPOSAL_RAW_SHA256,
        "diagnosis_proposal_binding_mismatch",
    )
    _read_bound(
        ACTIVE_PACKET_PATH,
        ACTIVE_PACKET_SIZE_BYTES,
        ACTIVE_PACKET_RAW_SHA256,
        "diagnosis_active_packet_binding_mismatch",
    )
    global_center = _parse_bound_json(
        GLOBAL_PATH,
        GLOBAL_SIZE_BYTES,
        GLOBAL_RAW_SHA256,
        "diagnosis_global_binding_mismatch",
    )
    projection = _parse_bound_json(
        PROJECTION_PATH,
        PROJECTION_SIZE_BYTES,
        PROJECTION_RAW_SHA256,
        "diagnosis_projection_binding_mismatch",
    )
    admission = _parse_bound_json(
        ADMISSION_PATH,
        ADMISSION_SIZE_BYTES,
        ADMISSION_RAW_SHA256,
        "diagnosis_admission_binding_mismatch",
    )
    polynomial = _parse_bound_json(
        POLYNOMIAL_PATH,
        POLYNOMIAL_SIZE_BYTES,
        POLYNOMIAL_RAW_SHA256,
        "diagnosis_polynomial_binding_mismatch",
    )
    for value, domain, expected, code in (
        (global_center, GLOBAL_DOMAIN, GLOBAL_SELF_SHA256, "diagnosis_global_self"),
        (
            projection,
            PROJECTION_DOMAIN,
            PROJECTION_SELF_SHA256,
            "diagnosis_projection_self",
        ),
        (
            admission,
            ADMISSION_DOMAIN,
            ADMISSION_SELF_SHA256,
            "diagnosis_admission_self",
        ),
        (
            polynomial,
            POLYNOMIAL_DOMAIN,
            POLYNOMIAL_SELF_SHA256,
            "diagnosis_polynomial_self",
        ),
    ):
        _verify_self_hash(value, domain, expected, code)
    return global_center, projection, admission, polynomial


def _exact_diagnosis() -> dict[str, object]:
    global_center, projection, admission, polynomial = _load_inputs()
    if (
        global_center.get("decision") != "CALCULATION_CENTER_ONLY"
        or global_center.get("noRetune") is not True
        or global_center.get("stateOrder") != ["u", "uPrime", "V", "VPrime"]
        or projection.get("decision") != "PROPOSED_PROOF_CENTER_ONLY"
        or admission.get("decision")
        != "PROOF_CENTER_ADMITTED_AS_CALCULATION_INPUT_ONLY"
        or polynomial.get("decision") != "EXACT_CORE_DUTY_COUNTEREXAMPLE"
    ):
        raise G2R1DiagnosisError("diagnosis_upstream_decision_invalid")
    for value in (global_center, projection, admission, polynomial):
        locks = value.get("authorityLocks")
        if type(locks) is not dict or any(item is not False for item in locks.values()):
            raise G2R1DiagnosisError("diagnosis_upstream_authority_invalid")
    mesh_words = global_center.get("meshF64Hex")
    rows_words = global_center.get("stateRowsF64Hex")
    parameters = global_center.get("parameters")
    if (
        type(mesh_words) is not list
        or not 2 <= len(mesh_words) <= MAXIMUM_MESH_LENGTH
        or type(rows_words) is not list
        or len(rows_words) != 4
        or any(
            type(row) is not list or len(row) != len(mesh_words)
            for row in rows_words
        )
        or type(parameters) is not dict
    ):
        raise G2R1DiagnosisError("diagnosis_global_shape_invalid")
    mesh = tuple(
        _binary64_fraction_hex(word, f"mesh[{index}]")
        for index, word in enumerate(mesh_words)
    )
    if any(mesh[index] <= mesh[index - 1] for index in range(1, len(mesh))):
        raise G2R1DiagnosisError("diagnosis_mesh_not_strict")
    intervals = [
        index
        for index in range(len(mesh) - 1)
        if mesh[index] < POINT_X < mesh[index + 1]
    ]
    if len(intervals) != 1:
        raise G2R1DiagnosisError("diagnosis_unique_interval_absent")
    left = intervals[0]
    rows = tuple(
        tuple(
            _binary64_fraction_hex(word, f"state[{row}][{column}]")
            for column, word in enumerate(row_words)
        )
        for row, row_words in enumerate(rows_words)
    )
    nu = _binary64_fraction_hex(parameters.get("nuF64Hex"), "nu")
    u, u_x, u_xx = _hermite_jet(
        mesh[left],
        mesh[left + 1],
        rows[0][left],
        rows[0][left + 1],
        rows[1][left],
        rows[1][left + 1],
        POINT_X,
        "u",
    )
    potential, _v_x, _v_xx = _hermite_jet(
        mesh[left],
        mesh[left + 1],
        rows[2][left],
        rows[2][left + 1],
        rows[3][left],
        rows[3][left + 1],
        POINT_X,
        "V",
    )
    residual = -Fraction(1, 2) * (u_xx + 2 * u_x / POINT_X)
    residual += (potential - nu) * u
    denominator = Fraction(1)
    denominator += abs(u_xx / 2)
    denominator += abs(u_x / POINT_X)
    denominator += abs(potential * u)
    denominator += abs(nu * u)
    hermite_normalized = abs(residual) / denominator
    for label, value in (
        ("residual", residual),
        ("denominator", denominator),
        ("hermite_normalized", hermite_normalized),
    ):
        _check_fraction(value, label)
    polynomial_result = polynomial.get("result")
    if type(polynomial_result) is not dict:
        raise G2R1DiagnosisError("diagnosis_polynomial_result_invalid")
    polynomial_normalized = _fraction_from_record(
        polynomial_result.get("normalizedResidualExact"),
        "polynomial_normalized",
    )
    if (
        polynomial_result.get("strictlyExceedsThreshold") is not True
        or polynomial_normalized <= THRESHOLD
        or _fraction_from_record(
            polynomial_result.get("thresholdExact"), "polynomial_threshold"
        )
        != THRESHOLD
    ):
        raise G2R1DiagnosisError("diagnosis_polynomial_decision_drift")
    if hermite_normalized > THRESHOLD:
        decision = "UPSTREAM_GLOBAL_CENTER_ACCURACY_SUCCESSOR_REQUIRED"
    else:
        decision = "CORE_CODEC_OR_MODE_COUNT_SUCCESSOR_REQUIRED"
    return {
        "decision": decision,
        "denominatorExact": _fraction_json(denominator),
        "hermiteNormalizedResidualExact": _fraction_json(hermite_normalized),
        "hermiteStrictlyExceedsThreshold": hermite_normalized > THRESHOLD,
        "interval": {
            "leftMeshF64Hex": mesh_words[left],
            "leftOrdinal": left,
            "rightMeshF64Hex": mesh_words[left + 1],
            "rightOrdinal": left + 1,
        },
        "pointExact": _fraction_json(POINT_X),
        "polynomialFractionEvidenceSha256": POLYNOMIAL_FRACTION_EVIDENCE_SHA256,
        "polynomialNormalizedResidualExact": _fraction_json(polynomial_normalized),
        "polynomialStrictlyExceedsThreshold": True,
        "residualExact": _fraction_json(residual),
        "thresholdExact": _fraction_json(THRESHOLD),
    }


def materialize_exact_hermite_diagnosis() -> str:
    if OUTPUT_PATH.exists() or OUTPUT_PATH.is_symlink():
        raise G2R1DiagnosisError("diagnosis_output_collision")
    result = _exact_diagnosis()
    source_raw = Path(__file__).resolve().read_bytes()
    unsigned = {
        "activePacketRawSha256": ACTIVE_PACKET_RAW_SHA256,
        "artifactId": (
            "nhm2.spherical_boson_star_v2.g2_r1_exact_hermite_diagnosis"
        ),
        "authorityLocks": dict(AUTHORITY_LOCKS),
        "diagnosisVersion": DIAGNOSIS_VERSION,
        "globalCenterRawSha256": GLOBAL_RAW_SHA256,
        "globalCenterReceiptSha256": GLOBAL_SELF_SHA256,
        "noRetune": True,
        "polynomialRawSha256": POLYNOMIAL_RAW_SHA256,
        "polynomialReceiptSha256": POLYNOMIAL_SELF_SHA256,
        "projectionRawSha256": PROJECTION_RAW_SHA256,
        "projectionReceiptSha256": PROJECTION_SELF_SHA256,
        "proposalRawSha256": PROPOSAL_RAW_SHA256,
        "representationChanged": False,
        "result": result,
        "sourceRawSha256": _sha256(source_raw),
        "sourceRawSizeBytes": len(source_raw),
    }
    full = dict(unsigned)
    raw = _canonical_bytes(unsigned)
    full["receiptSha256"] = _sha256(
        RECEIPT_DOMAIN + struct.pack("<Q", len(raw)) + raw
    )
    output = _canonical_bytes(full)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    descriptor = os.open(OUTPUT_PATH, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        with os.fdopen(descriptor, "wb", closefd=True) as stream:
            stream.write(output)
            stream.flush()
            os.fsync(stream.fileno())
    except BaseException:
        try:
            OUTPUT_PATH.unlink()
        except OSError:
            pass
        raise
    return full["receiptSha256"]


if __name__ == "__main__":
    print(materialize_exact_hermite_diagnosis())


__all__ = (
    "G2R1DiagnosisError",
    "materialize_exact_hermite_diagnosis",
)
