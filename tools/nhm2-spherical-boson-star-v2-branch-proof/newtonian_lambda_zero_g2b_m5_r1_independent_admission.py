"""Independent exact admission of the immutable G2B-M5 projection receipt.

Program gate: G2B-M5-R1 — exact projection evidence completion
Workstream: lambda-zero proof-center recovery
Capability or component: exact coefficient and projected-residual admission
Current maturity: private preregistered one-shot verifier
Target maturity: independently verified core-duty pass or falsifier
Required frozen inputs: M5 receipt, M3 receipt, frozen MPFR solve engine
Required evidence: exact nu replay, coefficient hashes, residual equality
Stop/fail criteria: first immutable mismatch; no retry or repair
Explicit non-goals: projection rerun, retuning, full proof or authority
Downstream gate unlocked: G2B replacement classical proof attempt
"""

from __future__ import annotations

from fractions import Fraction
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import struct
import sys
from typing import Final, NoReturn, Sequence


ROOT: Final[Path] = Path(__file__).resolve().parents[2]
PACKET_PATH: Final[Path] = (
    ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2b-m5-r1-independent-admission.md"
)
PACKET_SHA256: Final[str] = (
    "6e349dae9c89e2341c48ecd52a0134eff53401b24e6ffc5b936ec8bd478c48cf"
)
PACKET_SIZE_BYTES: Final[int] = 2_246
M5_SOURCE_PATH: Final[Path] = Path(__file__).with_name(
    "newtonian_lambda_zero_g2b_m5_tail_power_api_repair.py"
)
M5_SOURCE_SHA256: Final[str] = (
    "e9f9ee203d92262b77b77ae23323e420ebe459e62b52ac91943976a22ee70e4f"
)
M5_SOURCE_SIZE_BYTES: Final[int] = 16_568
M5_RECEIPT_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-m5-tail-power-api-repair-v1.json"
)
M5_RECEIPT_SHA256: Final[str] = (
    "0996c9178bd25b71ce1ee26d2cc03b76bff71013ba5a4ff1e0d13179d2430cdf"
)
M5_RECEIPT_SIZE_BYTES: Final[int] = 309_486
M5_RECEIPT_SELF_SHA256: Final[str] = (
    "646e41b4cad522fb3aecb1d9e6413a4c7f627732b1a9fd8cac606d6796dc8e0d"
)
M5_RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2b-m5-tail-power-api-repair/v1\n"
)
M3_RECEIPT_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-m3-local-center-refinement-v1.json"
)
M3_RECEIPT_SHA256: Final[str] = (
    "38bb7bb9cf52f0f0008442f9c8c212279f85d9d323eab69b66ec1eea061fa88d"
)
M3_RECEIPT_SIZE_BYTES: Final[int] = 18_479
M3_RECEIPT_SELF_SHA256: Final[str] = (
    "198f65decd9fe7616a523a066d80898b582fdf630921bafaa9557858a5aeb212"
)
M3_RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2b-m3-local-center-refinement/v1\n"
)
ENGINE_PATH: Final[Path] = Path(__file__).with_name(
    "newtonian_lambda_zero_g2b_m1_mpfr256_multiple_shooting.py"
)
ENGINE_SHA256: Final[str] = (
    "85e60d3b3393630b3b21eb1f9e2e6ebd8c2bd61547e6554e89fa2c01796af6de"
)
ENGINE_SIZE_BYTES: Final[int] = 32_381
OUTPUT_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-m5-r1-independent-admission-v1.json"
)
RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2b-m5-r1-independent-admission/v1\n"
)

POINT_X: Final[Fraction] = Fraction(1, 128)
MARGIN: Final[Fraction] = Fraction(1, 4 * 10**10)
MODE_COUNTS: Final[tuple[int, ...]] = (128, 256, 512)
NODE_LIMIT: Final[Fraction] = Fraction(1, 2**40)
JOIN_LIMIT: Final[Fraction] = Fraction(1, 2**28)
ENDPOINT_LIMIT: Final[Fraction] = Fraction(1, 2**40)
CROSS_LIMIT: Final[Fraction] = Fraction(1, 2**40)
AUTHORITY_NAMES: Final[tuple[str, ...]] = (
    "candidateAuthority",
    "proofAuthority",
    "executionAuthority",
    "diagnosticLampAuthority",
    "physicalAuthority",
    "propulsionAuthority",
    "transportAuthority",
)


class G2BM5R1Error(RuntimeError):
    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> NoReturn:
    raise G2BM5R1Error(code, detail)


def _canonical(value: object) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("ascii")


def _sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _verify(path: Path, size: int, digest: str, label: str) -> bytes:
    raw = path.read_bytes()
    if len(raw) != size or _sha256(raw) != digest:
        _fail("g2b_m5_r1_static_binding_drift", label)
    return raw


def _load_json(path: Path, size: int, digest: str, label: str) -> dict[str, object]:
    raw = _verify(path, size, digest, label)
    root = json.loads(raw)
    if type(root) is not dict or _canonical(root) != raw:
        _fail("g2b_m5_r1_noncanonical_json", label)
    return root


def _verify_self_hash(
    root: dict[str, object], domain: bytes, expected: str, label: str
) -> None:
    if root.get("receiptSha256") != expected:
        _fail("g2b_m5_r1_self_hash_literal_mismatch", label)
    unsigned = {key: value for key, value in root.items() if key != "receiptSha256"}
    raw = _canonical(unsigned)
    observed = _sha256(domain + struct.pack("<Q", len(raw)) + raw)
    if observed != expected:
        _fail("g2b_m5_r1_self_hash_mismatch", label)


def _load_engine():
    _verify(ENGINE_PATH, ENGINE_SIZE_BYTES, ENGINE_SHA256, "engine")
    spec = importlib.util.spec_from_file_location("g2b_m5_r1_engine", ENGINE_PATH)
    if spec is None or spec.loader is None:
        _fail("g2b_m5_r1_engine_spec_unavailable")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def _fraction_record(value: Fraction) -> dict[str, str]:
    return {"denominator": str(value.denominator), "numerator": str(value.numerator)}


def _fraction_from_record(value: object, label: str) -> Fraction:
    if type(value) is not dict or set(value) != {"denominator", "numerator"}:
        _fail("g2b_m5_r1_fraction_shape", label)
    try:
        numerator = int(value["numerator"])
        denominator = int(value["denominator"])
    except (KeyError, TypeError, ValueError):
        _fail("g2b_m5_r1_fraction_encoding", label)
    if denominator <= 0:
        _fail("g2b_m5_r1_fraction_denominator", label)
    result = Fraction(numerator, denominator)
    if _fraction_record(result) != value:
        _fail("g2b_m5_r1_fraction_noncanonical", label)
    return result


def _dyadic(value: object, label: str) -> Fraction:
    expected = {"encoding", "exponent2", "mantissaHex", "sourcePrecisionBits"}
    if type(value) is not dict or set(value) != expected:
        _fail("g2b_m5_r1_dyadic_shape", label)
    if (
        value["encoding"] != "canonical_exact_dyadic"
        or type(value["exponent2"]) is not int
        or type(value["mantissaHex"]) is not str
        or value["sourcePrecisionBits"] != 256
    ):
        _fail("g2b_m5_r1_dyadic_encoding", label)
    try:
        mantissa = int(value["mantissaHex"], 16)
    except ValueError:
        _fail("g2b_m5_r1_dyadic_mantissa", label)
    if mantissa == 0 or value["mantissaHex"] != format(mantissa, "x"):
        _fail("g2b_m5_r1_dyadic_noncanonical", label)
    exponent = value["exponent2"]
    return Fraction(mantissa * 2**exponent) if exponent >= 0 else Fraction(
        mantissa, 2 ** (-exponent)
    )


def _mpfr_fraction(value: object) -> Fraction:
    numerator, denominator = value.as_integer_ratio()
    return Fraction(int(numerator), int(denominator))


def _normalized_difference(left: Fraction, right: Fraction) -> Fraction:
    return abs(left - right) / (1 + abs(left) + abs(right))


def _chebyshev_derivative(coefficients: tuple[Fraction, ...]) -> tuple[Fraction, ...]:
    count = len(coefficients)
    if count <= 1:
        return (Fraction(0),)
    output = [Fraction(0)] * count
    output[-2] = 2 * (count - 1) * coefficients[-1]
    for index in range(count - 3, -1, -1):
        output[index] = output[index + 2] + 2 * (index + 1) * coefficients[index + 1]
    output[0] /= 2
    return tuple(output[:-1])


def _chebyshev_value(
    coefficients: Sequence[Fraction], coordinate: Fraction
) -> Fraction:
    if not coefficients:
        return Fraction(0)
    previous = Fraction(1)
    total = coefficients[0]
    if len(coefficients) == 1:
        return total
    current = coordinate
    total += coefficients[1] * current
    for mode in range(2, len(coefficients)):
        following = 2 * coordinate * current - previous
        total += coefficients[mode] * following
        previous, current = current, following
    return total


def _projected_residual(
    u_coefficients: tuple[Fraction, ...],
    v_coefficients: tuple[Fraction, ...],
    nu: Fraction,
) -> Fraction:
    rho = POINT_X / (1 + POINT_X)
    coordinate = 2 * rho - 1
    first = _chebyshev_derivative(u_coefficients)
    second = _chebyshev_derivative(first)
    u = _chebyshev_value(u_coefficients, coordinate)
    rho_first = 2 * _chebyshev_value(first, coordinate)
    rho_second = 4 * _chebyshev_value(second, coordinate)
    one_minus = 1 - rho
    ux = one_minus**2 * rho_first
    uxx = one_minus**4 * rho_second - 2 * one_minus**3 * rho_first
    potential = _chebyshev_value(v_coefficients, coordinate)
    residual = -Fraction(1, 2) * (uxx + 2 * ux / POINT_X)
    residual += (potential - nu) * u
    denominator = 1 + abs(uxx / 2) + abs(ux / POINT_X)
    denominator += abs(potential * u) + abs(nu * u)
    return abs(residual) / denominator


def _coefficient_binding(value: object, count: int, label: str) -> tuple[Fraction, ...]:
    if type(value) is not dict or set(value) != {
        "canonicalDyadics",
        "rawSha256",
        "sizeBytes",
    }:
        _fail("g2b_m5_r1_coefficient_binding_shape", label)
    encoded = value["canonicalDyadics"]
    if type(encoded) is not list or len(encoded) != count:
        _fail("g2b_m5_r1_coefficient_count", label)
    raw = _canonical(encoded)
    if value["sizeBytes"] != len(raw) or value["rawSha256"] != _sha256(raw):
        _fail("g2b_m5_r1_coefficient_binding_mismatch", label)
    return tuple(
        _dyadic(item, f"{label}:{ordinal}")
        for ordinal, item in enumerate(encoded)
    )


def _exclusive_write(path: Path, raw: bytes) -> None:
    descriptor = os.open(
        path,
        os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_BINARY", 0),
        0o600,
    )
    with os.fdopen(descriptor, "wb", closefd=True) as handle:
        handle.write(raw)
        handle.flush()
        os.fsync(handle.fileno())


def _receipt_self_hash(unsigned: dict[str, object]) -> str:
    raw = _canonical(unsigned)
    return _sha256(RECEIPT_DOMAIN + struct.pack("<Q", len(raw)) + raw)


def execute_once() -> str:
    if OUTPUT_PATH.exists():
        _fail("g2b_m5_r1_output_collision")
    _verify(PACKET_PATH, PACKET_SIZE_BYTES, PACKET_SHA256, "packet")
    _verify(M5_SOURCE_PATH, M5_SOURCE_SIZE_BYTES, M5_SOURCE_SHA256, "m5_source")
    m5 = _load_json(
        M5_RECEIPT_PATH,
        M5_RECEIPT_SIZE_BYTES,
        M5_RECEIPT_SHA256,
        "m5_receipt",
    )
    _verify_self_hash(m5, M5_RECEIPT_DOMAIN, M5_RECEIPT_SELF_SHA256, "m5")
    m3 = _load_json(
        M3_RECEIPT_PATH,
        M3_RECEIPT_SIZE_BYTES,
        M3_RECEIPT_SHA256,
        "m3_receipt",
    )
    _verify_self_hash(m3, M3_RECEIPT_DOMAIN, M3_RECEIPT_SELF_SHA256, "m3")
    expected_center = m3.get("centerObservations", [None] * 4)[3]
    if m5.get("selectedCenterReplay") != expected_center:
        _fail("g2b_m5_r1_center_replay_mismatch")
    if (
        m5.get("decision") != "MPFR_PROJECTION_SELECTED"
        or m5.get("selectedModeCount") != 128
        or m5.get("selectedSubstepsPerOutputInterval") != 256
        or m5.get("noRetune") is not True
        or m5.get("noCandidateSolve") is not True
        or m5.get("authorityLocks") != {name: False for name in AUTHORITY_NAMES}
    ):
        _fail("g2b_m5_r1_m5_claim_surface_mismatch")

    engine = _load_engine()
    completed: list[dict[str, object]] = []
    mode_checks: list[dict[str, object]] = []
    failure: dict[str, str] | None = None
    nu_binding: dict[str, object] | None = None
    selected: int | None = None
    try:
        engine._verify_static_inputs()
        engine._verify_runtime()
        with engine._mpfr_context():
            coarse, coarse_chronology = engine._newton_refinement(
                engine._initial_unknowns(), 4
            )
            completed.append({"chronology": list(coarse_chronology), "ordinal": 0})
            fine, fine_chronology = engine._newton_refinement(
                engine._initial_unknowns(), 8
            )
            completed.append({"chronology": list(fine_chronology), "ordinal": 1})
            coarse_nu = _mpfr_fraction(coarse[1])
            fine_nu = _mpfr_fraction(fine[1])
            difference = _normalized_difference(coarse_nu, fine_nu)
            if difference > CROSS_LIMIT:
                _fail("g2b_m5_r1_nu_cross_refinement_failed")
            nu_binding = {
                "coarse": _fraction_record(coarse_nu),
                "fine": _fraction_record(fine_nu),
                "normalizedDifference": _fraction_record(difference),
            }

        records = m5.get("projectionRecords")
        if type(records) is not list or len(records) != len(MODE_COUNTS):
            _fail("g2b_m5_r1_projection_record_count")
        paired = zip(MODE_COUNTS, records, strict=True)
        for ordinal, (count, record) in enumerate(paired):
            if type(record) is not dict:
                _fail("g2b_m5_r1_projection_record_shape", str(ordinal))
            if record.get("ordinal") != ordinal or record.get("modeCount") != count:
                _fail("g2b_m5_r1_projection_record_order", str(ordinal))
            u = _coefficient_binding(
                record.get("uCoefficientBinding"), count, f"u:{count}"
            )
            v = _coefficient_binding(
                record.get("vCoefficientBinding"), count, f"v:{count}"
            )
            computed = _projected_residual(u, v, fine_nu)
            stored = _fraction_from_record(
                record.get("projectedNormalizedResidualExact"), f"residual:{count}"
            )
            exact_match = computed == stored
            node = _dyadic(record.get("nodeError"), f"node:{count}")
            join = _dyadic(record.get("joinError"), f"join:{count}")
            endpoint = _dyadic(record.get("endpointError"), f"endpoint:{count}")
            eligible = (
                exact_match
                and computed <= MARGIN
                and node <= NODE_LIMIT
                and join <= JOIN_LIMIT
                and endpoint <= ENDPOINT_LIMIT
            )
            if record.get("eligible") is not eligible:
                _fail("g2b_m5_r1_eligibility_mismatch", str(count))
            if eligible and selected is None:
                selected = count
            mode_checks.append(
                {
                    "coefficientBindingsVerified": True,
                    "computedProjectedNormalizedResidualExact": _fraction_record(
                        computed
                    ),
                    "eligible": eligible,
                    "modeCount": count,
                    "ordinal": ordinal,
                    "storedResidualExactMatch": exact_match,
                }
            )
        if selected != m5.get("selectedModeCount"):
            _fail("g2b_m5_r1_selection_mismatch")
        decision = "INDEPENDENT_CORE_DUTY_PASS"
    except Exception as error:
        if isinstance(error, G2BM5R1Error):
            failure = {"code": error.code, "detail": error.detail}
        else:
            failure = {
                "code": "g2b_m5_r1_untyped_exception",
                "detail": type(error).__name__,
            }
        decision = "INDEPENDENT_CORE_DUTY_FALSIFIER"

    unsigned: dict[str, object] = {
        "artifactId": "nhm2.spherical_boson_star_v2.g2b_m5_r1_admission",
        "authorityLocks": {name: False for name in AUTHORITY_NAMES},
        "completedSolveRefinements": completed,
        "decision": decision,
        "firstFailure": failure,
        "m3ReceiptSha256": M3_RECEIPT_SELF_SHA256,
        "m5ReceiptSha256": M5_RECEIPT_SELF_SHA256,
        "modeChecks": mode_checks,
        "noCandidateSolve": True,
        "noProjectionRerun": True,
        "noRetune": True,
        "nuBinding": nu_binding,
        "packetRawSha256": PACKET_SHA256,
        "runnerSourceRawSha256": _sha256(Path(__file__).read_bytes()),
        "selectedModeCount": selected,
    }
    full = dict(unsigned)
    full["receiptSha256"] = _receipt_self_hash(unsigned)
    _exclusive_write(OUTPUT_PATH, _canonical(full))
    return full["receiptSha256"]


def _main(arguments: list[str]) -> int:
    if arguments != ["--execute-once"]:
        _fail("g2b_m5_r1_exact_command_required")
    sys.stdout.write(execute_once() + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))
