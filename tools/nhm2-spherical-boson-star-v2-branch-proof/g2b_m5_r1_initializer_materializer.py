"""Materialize the frozen G2B-B1 six-payload initializer in memory.

Program gate: G2B — replacement classical proof attempt
Workstream: authenticated classical branch closure
Capability or component: M5-R1 entry binding and initializer materialization
Current maturity: preregistered authority-neutral calculation implementation
Target maturity: deterministic six-payload initializer receipt or falsifier
Required frozen inputs: B1 packet, M5/M5-R1 receipts, final branch/evaluator contracts
Required evidence: exact rehash, payload words, join/scalar identities, context restore
Stop/fail criteria: first input, runtime, arithmetic, domain, payload or invariant failure
Explicit non-goals: candidate solve, persistence, retry, retune, proof or authority
Downstream gate unlocked: four-grid execution review
"""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from fractions import Fraction
import hashlib
import json
import math
from pathlib import Path
import struct
from typing import Callable, Final, Iterator, NoReturn

import gmpy2


ROOT: Final[Path] = Path(__file__).resolve().parents[2]
PACKET_PATH: Final[Path] = (
    ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2b-b1-entry-binding-and-initializer-closure.md"
)
PACKET_SHA256: Final[str] = (
    "f76682d88435f3a6256f402bccb9ffca27afe28dce1ccb810a08609cf97e8291"
)
PACKET_SIZE_BYTES: Final[int] = 6_573
BRANCH_POLICY_PATH: Final[Path] = (
    ROOT
    / "shared"
    / "contracts"
    / "nhm2-spherical-boson-star-v2-branch-selection-numerics.v1.ts"
)
BRANCH_POLICY_SHA256: Final[str] = (
    "d20e6eeef3d185ff938aa27cc83af87a201d76f986c63d77e0dbe72cf8600c82"
)
BRANCH_POLICY_SIZE_BYTES: Final[int] = 44_912
BRANCH_POLICY_SEMANTIC_SHA256: Final[str] = (
    "221af0c6b9f858d20ca2f89c5e4eedf14a0c64ede9ff39e60077b79f08ad9aaa"
)
INITIALIZER_POLICY_PATH: Final[Path] = (
    ROOT
    / "shared"
    / "contracts"
    / "nhm2-spherical-boson-star-v2-initializer-evaluator.v1.ts"
)
INITIALIZER_POLICY_SHA256: Final[str] = (
    "05d0c327090a30065a453941ad4612f518818dd88f230864d4ef257c9e8a2be4"
)
INITIALIZER_POLICY_SIZE_BYTES: Final[int] = 60_627
INITIALIZER_POLICY_SEMANTIC_SHA256: Final[str] = (
    "2253cea43e7b0abc99aaebd19ced18994eba4605b65fe674febb03d9945cdbc5"
)
M5_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-m5-tail-power-api-repair-v1.json"
)
M5_RAW_SHA256: Final[str] = (
    "0996c9178bd25b71ce1ee26d2cc03b76bff71013ba5a4ff1e0d13179d2430cdf"
)
M5_SIZE_BYTES: Final[int] = 309_486
M5_SELF_SHA256: Final[str] = (
    "646e41b4cad522fb3aecb1d9e6413a4c7f627732b1a9fd8cac606d6796dc8e0d"
)
M5_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2b-m5-tail-power-api-repair/v1\n"
)
M5_R1_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-m5-r1-independent-admission-v1.json"
)
M5_R1_RAW_SHA256: Final[str] = (
    "41b1fcd261f17b722197ccfd3bcc2e116c1941194c63c52712a28d7f5cd80d83"
)
M5_R1_SIZE_BYTES: Final[int] = 12_888
M5_R1_SELF_SHA256: Final[str] = (
    "c37c0a329765c558c99e559bfede6aed815244f372d289085953f7aed097d1a8"
)
M5_R1_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2b-m5-r1-independent-admission/v1\n"
)
RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2b-b1-initializer-materialization/v1\n"
)

GMPY2_VERSION: Final[str] = "2.3.1"
MPFR_VERSION: Final[str] = "MPFR 4.2.2"
GMPY2_EXTENSION_SHA256: Final[str] = (
    "56f2bf12ffd4ca523f403bd2b6ce13069800cc2fc4332cf5de3537a34e8c76fb"
)
GMPY2_EXTENSION_SIZE_BYTES: Final[int] = 442_368
MPFR_DLL_SHA256: Final[str] = (
    "95b280f52d24a1fe1e024877ee325a629c3424e12961d27f84daec73d02c4bd8"
)
MPFR_DLL_SIZE_BYTES: Final[int] = 904_297
GMP_DLL_SHA256: Final[str] = (
    "829adcf025d22e641c6816b431fbe5b226a39b390c7205192d480151646fe9c9"
)
GMP_DLL_SIZE_BYTES: Final[int] = 1_083_865

PRECISION_BITS: Final[int] = 256
EMIN: Final[int] = -1_073_741_823
EMAX: Final[int] = 1_073_741_823
SELECTED_MODE_COUNT: Final[int] = 128
RADIUS: Final[int] = 32
PAYLOAD_LAYOUT: Final[tuple[tuple[str, int, int], ...]] = (
    ("scalars.f64le", 9, 72),
    ("coefficients/core_L2_u.f64le", 128, 1_024),
    ("coefficients/core_L2_V.f64le", 128, 1_024),
    ("coefficients/tail_H.f64le", 32, 256),
    ("coefficients/tail_Q.f64le", 32, 256),
    ("initializer/core_L2_join_barrier.f64le", 4, 32),
)
AUTHORITY_NAMES: Final[tuple[str, ...]] = (
    "candidateAuthority",
    "proofAuthority",
    "executionAuthority",
    "replayAuthority",
    "pairAgreementAuthority",
    "diagnosticLampAuthority",
    "theoryGraphAuthority",
    "physicalAuthority",
    "propulsionAuthority",
    "transportAuthority",
)


class G2BB1InitializerError(RuntimeError):
    """Typed fail-closed materialization error."""

    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


@dataclass(frozen=True, slots=True)
class InitializerPayload:
    ordinal: int
    path: str
    raw: bytes
    raw_sha256: str
    size_bytes: int
    f64le_word_hex: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class InitializerMaterialization:
    payloads: tuple[InitializerPayload, ...]
    receipt_canonical_json: bytes
    receipt_sha256: str
    total_size_bytes: int
    status: str


def _fail(code: str, detail: str = "") -> NoReturn:
    raise G2BB1InitializerError(code, detail)


def _sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _canonical(value: object) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=True,
        allow_nan=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("ascii")


def _verify_file(path: Path, size: int, digest: str, label: str) -> bytes:
    try:
        raw = path.read_bytes()
    except OSError as error:
        _fail("g2b_b1_input_read_failed", f"{label}:{type(error).__name__}")
    if len(raw) != size or _sha256(raw) != digest:
        _fail("g2b_b1_input_binding_drift", label)
    return raw


def _load_receipt(
    path: Path,
    size: int,
    raw_digest: str,
    self_digest: str,
    domain: bytes,
    label: str,
) -> dict[str, object]:
    raw = _verify_file(path, size, raw_digest, label)
    try:
        value = json.loads(raw)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        _fail("g2b_b1_receipt_parse_failed", f"{label}:{type(error).__name__}")
    if type(value) is not dict or _canonical(value) != raw:
        _fail("g2b_b1_receipt_noncanonical", label)
    observed = value.get("receiptSha256")
    if observed != self_digest:
        _fail("g2b_b1_receipt_literal_self_hash_mismatch", label)
    unsigned = dict(value)
    del unsigned["receiptSha256"]
    preimage = _canonical(unsigned)
    expected = _sha256(domain + struct.pack("<Q", len(preimage)) + preimage)
    if expected != observed:
        _fail("g2b_b1_receipt_self_hash_mismatch", label)
    return value


def _runtime_paths() -> tuple[str, str, str]:
    if gmpy2.version() != GMPY2_VERSION or gmpy2.mpfr_version() != MPFR_VERSION:
        _fail("g2b_b1_runtime_version_mismatch")
    extension = Path(gmpy2.gmpy2.__file__).resolve(strict=True)
    libraries = extension.parent.parent / "gmpy2.libs"
    mpfr = libraries / "libmpfr-6.dll"
    gmp = libraries / "libgmp-10.dll"
    for path, size, digest, label in (
        (
            extension,
            GMPY2_EXTENSION_SIZE_BYTES,
            GMPY2_EXTENSION_SHA256,
            "gmpy2_extension",
        ),
        (mpfr, MPFR_DLL_SIZE_BYTES, MPFR_DLL_SHA256, "mpfr"),
        (gmp, GMP_DLL_SIZE_BYTES, GMP_DLL_SHA256, "gmp"),
    ):
        _verify_file(path, size, digest, label)
    return str(extension), str(mpfr), str(gmp)


def _context_template():
    context = gmpy2.get_context().copy()
    context.precision = PRECISION_BITS
    context.round = gmpy2.RoundToNearest
    context.emin = EMIN
    context.emax = EMAX
    context.subnormalize = False
    context.trap_underflow = False
    context.trap_overflow = False
    context.trap_inexact = False
    context.trap_invalid = False
    context.trap_erange = False
    context.trap_divzero = False
    context.allow_complex = False
    context.rational_division = False
    context.allow_release_gil = False
    context.clear_flags()
    return context


@contextmanager
def _mpfr_context() -> Iterator[object]:
    before = gmpy2.get_context().copy()
    try:
        with gmpy2.context(_context_template()):
            active = gmpy2.get_context()
            active.clear_flags()
            yield active
            forbidden = (
                active.invalid,
                active.divzero,
                active.overflow,
                active.underflow,
                active.erange,
            )
            if any(forbidden):
                _fail("g2b_b1_forbidden_mpfr_flag", "context_exit")
    finally:
        after = gmpy2.get_context()
        names = (
            "precision",
            "round",
            "emin",
            "emax",
            "subnormalize",
            "trap_underflow",
            "trap_overflow",
            "trap_inexact",
            "trap_invalid",
            "trap_erange",
            "trap_divzero",
            "allow_complex",
            "rational_division",
            "allow_release_gil",
        )
        if any(getattr(after, name) != getattr(before, name) for name in names):
            _fail("g2b_b1_mpfr_context_restore_failed")


def _op(label: str, function: Callable[[], object]):
    context = gmpy2.get_context()
    context.clear_flags()
    try:
        result = function()
    except Exception as error:
        _fail("g2b_b1_mpfr_operation_failed", f"{label}:{type(error).__name__}")
    if any(
        (
            context.invalid,
            context.divzero,
            context.overflow,
            context.underflow,
            context.erange,
        )
    ):
        _fail("g2b_b1_forbidden_mpfr_flag", label)
    context.clear_flags()
    return result


def _mp_fraction(value: Fraction, label: str):
    return _op(
        label,
        lambda: gmpy2.mpfr(gmpy2.mpq(value.numerator, value.denominator)),
    )


def _dyadic_fraction(value: object, label: str) -> Fraction:
    if type(value) is not dict or set(value) != {
        "encoding",
        "exponent2",
        "mantissaHex",
        "sourcePrecisionBits",
    }:
        _fail("g2b_b1_dyadic_shape_invalid", label)
    if (
        value["encoding"] != "canonical_exact_dyadic"
        or type(value["exponent2"]) is not int
        or type(value["mantissaHex"]) is not str
        or value["sourcePrecisionBits"] != PRECISION_BITS
    ):
        _fail("g2b_b1_dyadic_encoding_invalid", label)
    try:
        mantissa = int(value["mantissaHex"], 16)
    except ValueError:
        _fail("g2b_b1_dyadic_mantissa_invalid", label)
    exponent = value["exponent2"]
    if mantissa == 0:
        return Fraction(0)
    return (
        Fraction(mantissa << exponent)
        if exponent >= 0
        else Fraction(mantissa, 1 << -exponent)
    )


def _coefficient_fractions(binding: object, label: str) -> tuple[Fraction, ...]:
    if type(binding) is not dict or set(binding) != {
        "canonicalDyadics",
        "rawSha256",
        "sizeBytes",
    }:
        _fail("g2b_b1_coefficient_binding_shape_invalid", label)
    encoded = binding["canonicalDyadics"]
    if type(encoded) is not list or len(encoded) != SELECTED_MODE_COUNT:
        _fail("g2b_b1_coefficient_count_invalid", label)
    raw = _canonical(encoded)
    if binding["sizeBytes"] != len(raw) or binding["rawSha256"] != _sha256(raw):
        _fail("g2b_b1_coefficient_binding_mismatch", label)
    return tuple(
        _dyadic_fraction(value, f"{label}:{index}")
        for index, value in enumerate(encoded)
    )


def _positive_zero(value: float) -> float:
    return 0.0 if value == 0.0 else value


def _to_f64(value: object, label: str) -> float:
    converted = _op(label, lambda: float(value))
    if type(converted) is not float or not math.isfinite(converted):
        _fail("g2b_b1_binary64_nonfinite", label)
    converted = _positive_zero(converted)
    if struct.pack(">d", converted).hex() == "8000000000000000":
        _fail("g2b_b1_binary64_negative_zero", label)
    return converted


def _chebyshev_value_and_rho_derivative(
    coefficients: tuple[object, ...], rho: object, label: str
) -> tuple[object, object]:
    if len(coefficients) != SELECTED_MODE_COUNT:
        _fail("g2b_b1_coefficient_count_invalid", label)
    one = _op(f"{label}:one", lambda: gmpy2.mpfr(1))
    two = _op(f"{label}:two", lambda: gmpy2.mpfr(2))
    t = _op(f"{label}:t_mul", lambda: two * rho)
    t = _op(f"{label}:t_sub", lambda: t - one)
    t_previous = one
    dt_previous = _op(f"{label}:dt0", lambda: gmpy2.mpfr(0))
    total = _op(f"{label}:sum0", lambda: coefficients[0] * t_previous)
    derivative_t = _op(
        f"{label}:dsum0", lambda: coefficients[0] * dt_previous
    )
    t_current = t
    dt_current = one
    term = _op(f"{label}:term1", lambda: coefficients[1] * t_current)
    total = _op(f"{label}:sum1", lambda: total + term)
    dterm = _op(f"{label}:dterm1", lambda: coefficients[1] * dt_current)
    derivative_t = _op(f"{label}:dsum1", lambda: derivative_t + dterm)
    for index in range(2, len(coefficients)):
        product = _op(f"{label}:T_mul:{index}", lambda: two * t)
        product = _op(
            f"{label}:T_mul_current:{index}", lambda: product * t_current
        )
        t_next = _op(f"{label}:T_sub:{index}", lambda: product - t_previous)
        first = _op(f"{label}:dT_first:{index}", lambda: two * t_current)
        second = _op(f"{label}:dT_two_t:{index}", lambda: two * t)
        second = _op(
            f"{label}:dT_second:{index}", lambda: second * dt_current
        )
        derivative_sum = _op(
            f"{label}:dT_add:{index}", lambda: first + second
        )
        dt_next = _op(
            f"{label}:dT_sub:{index}", lambda: derivative_sum - dt_previous
        )
        term = _op(f"{label}:term:{index}", lambda: coefficients[index] * t_next)
        total = _op(f"{label}:sum:{index}", lambda: total + term)
        dterm = _op(
            f"{label}:dterm:{index}", lambda: coefficients[index] * dt_next
        )
        derivative_t = _op(
            f"{label}:dsum:{index}", lambda: derivative_t + dterm
        )
        t_previous, t_current = t_current, t_next
        dt_previous, dt_current = dt_current, dt_next
    derivative_rho = _op(
        f"{label}:rho_derivative", lambda: two * derivative_t
    )
    return total, derivative_rho


def _payload(ordinal: int, path: str, values: tuple[float, ...]) -> InitializerPayload:
    expected_path, expected_count, expected_size = PAYLOAD_LAYOUT[ordinal]
    if path != expected_path or len(values) != expected_count:
        _fail("g2b_b1_payload_shape_invalid", path)
    raw = b"".join(struct.pack("<d", _positive_zero(value)) for value in values)
    if len(raw) != expected_size:
        _fail("g2b_b1_payload_size_invalid", path)
    return InitializerPayload(
        ordinal=ordinal,
        path=path,
        raw=raw,
        raw_sha256=_sha256(raw),
        size_bytes=len(raw),
        f64le_word_hex=tuple(raw[index : index + 8].hex() for index in range(0, len(raw), 8)),
    )


def _receipt_self_hash(unsigned: dict[str, object]) -> str:
    raw = _canonical(unsigned)
    return _sha256(RECEIPT_DOMAIN + struct.pack("<Q", len(raw)) + raw)


def materialize_initializer_from_m5_r1() -> InitializerMaterialization:
    """Return deterministic immutable payloads; perform no persistence or solve."""

    _verify_file(PACKET_PATH, PACKET_SIZE_BYTES, PACKET_SHA256, "packet")
    _verify_file(
        BRANCH_POLICY_PATH,
        BRANCH_POLICY_SIZE_BYTES,
        BRANCH_POLICY_SHA256,
        "branch_policy",
    )
    _verify_file(
        INITIALIZER_POLICY_PATH,
        INITIALIZER_POLICY_SIZE_BYTES,
        INITIALIZER_POLICY_SHA256,
        "initializer_policy",
    )
    m5 = _load_receipt(
        M5_PATH,
        M5_SIZE_BYTES,
        M5_RAW_SHA256,
        M5_SELF_SHA256,
        M5_DOMAIN,
        "m5",
    )
    m5_r1 = _load_receipt(
        M5_R1_PATH,
        M5_R1_SIZE_BYTES,
        M5_R1_RAW_SHA256,
        M5_R1_SELF_SHA256,
        M5_R1_DOMAIN,
        "m5_r1",
    )
    if (
        m5_r1.get("decision") != "INDEPENDENT_CORE_DUTY_PASS"
        or m5_r1.get("firstFailure") is not None
        or m5_r1.get("m5ReceiptSha256") != M5_SELF_SHA256
        or m5_r1.get("selectedModeCount") != SELECTED_MODE_COUNT
        or m5_r1.get("noCandidateSolve") is not True
        or m5_r1.get("noProjectionRerun") is not True
        or m5_r1.get("noRetune") is not True
        or m5.get("decision") != "MPFR_PROJECTION_SELECTED"
        or m5.get("selectedModeCount") != SELECTED_MODE_COUNT
        or m5.get("noCandidateSolve") is not True
        or m5.get("noRetune") is not True
    ):
        _fail("g2b_b1_entry_receipt_invalid")
    records = m5.get("projectionRecords")
    if type(records) is not list or len(records) != 3:
        _fail("g2b_b1_projection_records_invalid")
    selected = next(
        (
            record
            for record in records
            if type(record) is dict
            and record.get("modeCount") == SELECTED_MODE_COUNT
            and record.get("eligible") is True
        ),
        None,
    )
    if selected is None:
        _fail("g2b_b1_selected_projection_absent")
    u_exact = _coefficient_fractions(selected.get("uCoefficientBinding"), "u")
    v_exact = _coefficient_fractions(selected.get("vCoefficientBinding"), "V")
    nu_binding = m5_r1.get("nuBinding")
    if type(nu_binding) is not dict or type(nu_binding.get("fine")) is not dict:
        _fail("g2b_b1_nu_binding_invalid")
    fine_nu = nu_binding["fine"]
    if set(fine_nu) != {"numerator", "denominator"}:
        _fail("g2b_b1_nu_binding_invalid")
    try:
        nu_exact = Fraction(int(fine_nu["numerator"]), int(fine_nu["denominator"]))
    except (TypeError, ValueError, ZeroDivisionError):
        _fail("g2b_b1_nu_binding_invalid")
    runtime_paths = _runtime_paths()
    with _mpfr_context():
        u_f64 = tuple(
            _to_f64(_mp_fraction(value, f"u_exact:{index}"), f"u_f64:{index}")
            for index, value in enumerate(u_exact)
        )
        v_f64 = tuple(
            _to_f64(_mp_fraction(value, f"V_exact:{index}"), f"V_f64:{index}")
            for index, value in enumerate(v_exact)
        )
        u_mp = tuple(_op(f"u_set_d:{index}", lambda value=value: gmpy2.mpfr(value)) for index, value in enumerate(u_f64))
        v_mp = tuple(_op(f"V_set_d:{index}", lambda value=value: gmpy2.mpfr(value)) for index, value in enumerate(v_f64))
        rho_zero = _op("rho_zero", lambda: gmpy2.mpfr(0))
        rho_join = _mp_fraction(Fraction(RADIUS, RADIUS + 1), "rho_join")
        u_origin, _ = _chebyshev_value_and_rho_derivative(u_mp, rho_zero, "u_origin")
        vc, _ = _chebyshev_value_and_rho_derivative(v_mp, rho_zero, "V_origin")
        join_u, join_u_rho = _chebyshev_value_and_rho_derivative(u_mp, rho_join, "u_join")
        join_v, join_v_rho = _chebyshev_value_and_rho_derivative(v_mp, rho_join, "V_join")
        derivative_denominator = _op("derivative_denominator", lambda: gmpy2.mpfr((RADIUS + 1) ** 2))
        join_u1 = _op("join_u1", lambda: join_u_rho / derivative_denominator)
        join_v1 = _op("join_v1", lambda: join_v_rho / derivative_denominator)
        radius_mp = _op("radius", lambda: gmpy2.mpfr(RADIUS))
        radius_squared = _op("radius_squared", lambda: radius_mp * radius_mp)
        mass = _op("mass", lambda: radius_squared * join_v1)
        nu0 = _mp_fraction(nu_exact, "nu0")
        minus_two = _op("minus_two", lambda: gmpy2.mpfr(-2))
        minus_two_nu = _op("minus_two_nu", lambda: minus_two * nu0)
        kappa = _op("kappa", lambda: gmpy2.sqrt(minus_two_nu))
        one = _op("one", lambda: gmpy2.mpfr(1))
        sigma_plus_one = _op("sigma_plus_one", lambda: mass / kappa)
        sigma = _op("sigma", lambda: sigma_plus_one - one)
        kappa_radius = _op("kappa_radius", lambda: kappa * radius_mp)
        log_radius = _op("log_radius", lambda: gmpy2.log(radius_mp))
        sigma_log_radius = _op("sigma_log_radius", lambda: sigma * log_radius)
        c_exponent = _op("c_exponent", lambda: kappa_radius - sigma_log_radius)
        c_factor = _op("c_factor", lambda: gmpy2.exp(c_exponent))
        c_value = _op("C", lambda: join_u * c_factor)
        four = _op("four", lambda: gmpy2.mpfr(4))
        pi = _op("pi", lambda: gmpy2.const_pi())
        four_pi = _op("four_pi", lambda: four * pi)
        n0 = _op("N0", lambda: four_pi * c_value)
        thirty_two = _op("thirty_two", lambda: gmpy2.mpfr(32))
        lambda_value = _op("lambda", lambda: one / thirty_two)
        lambda_squared = _op("lambda_squared", lambda: lambda_value * lambda_value)
        nu_star = _op("nu_star", lambda: lambda_squared * nu0)
        two = _op("two", lambda: gmpy2.mpfr(2))
        two_nu_star = _op("two_nu_star", lambda: two * nu_star)
        w_squared = _op("w_squared", lambda: one + two_nu_star)
        w_seed = _op("w_seed", lambda: gmpy2.sqrt(w_squared))
        if not (
            nu0 < 0
            and join_u > 0
            and c_value > 0
            and kappa > 0
            and mass > 0
            and gmpy2.mpfr("-0.5") < nu_star < 0
            and 0 < w_seed < 1
            and gmpy2.is_finite(vc)
        ):
            _fail("g2b_b1_frozen_domain_failed")
        origin_difference = _op("origin_difference", lambda: abs(u_origin - one))
        if origin_difference != 0:
            _fail("g2b_b1_origin_normalization_failed")
        scalar_values = tuple(
            _to_f64(value, label)
            for value, label in (
                (nu0, "scalar_nu0"),
                (vc, "scalar_Vc"),
                (n0, "scalar_N0"),
                (c_value, "scalar_C"),
                (kappa, "scalar_kappa"),
                (sigma, "scalar_sigma"),
                (lambda_value, "scalar_lambda"),
                (nu_star, "scalar_nu_star"),
                (w_seed, "scalar_wSeed"),
            )
        )
        join_values = tuple(
            _to_f64(value, label)
            for value, label in (
                (join_u, "join_U"),
                (join_u1, "join_U1"),
                (join_v, "join_V"),
                (join_v1, "join_V1"),
            )
        )
    zeros = (0.0,) * 32
    payloads = (
        _payload(0, PAYLOAD_LAYOUT[0][0], scalar_values),
        _payload(1, PAYLOAD_LAYOUT[1][0], u_f64),
        _payload(2, PAYLOAD_LAYOUT[2][0], v_f64),
        _payload(3, PAYLOAD_LAYOUT[3][0], zeros),
        _payload(4, PAYLOAD_LAYOUT[4][0], zeros),
        _payload(5, PAYLOAD_LAYOUT[5][0], join_values),
    )
    total_size = sum(payload.size_bytes for payload in payloads)
    if total_size != 2_664:
        _fail("g2b_b1_aggregate_size_invalid")
    unsigned: dict[str, object] = {
        "artifactId": "nhm2.spherical_boson_star_v2.g2b_b1_initializer_materialization",
        "authorityLocks": {name: False for name in AUTHORITY_NAMES},
        "branchPolicyRawSha256": BRANCH_POLICY_SHA256,
        "branchPolicySemanticSha256": BRANCH_POLICY_SEMANTIC_SHA256,
        "candidateExecuted": False,
        "decision": "INITIALIZER_PAYLOADS_MATERIALIZED_IN_MEMORY",
        "initializerPolicyRawSha256": INITIALIZER_POLICY_SHA256,
        "initializerPolicySemanticSha256": INITIALIZER_POLICY_SEMANTIC_SHA256,
        "m5R1ReceiptRawSha256": M5_R1_RAW_SHA256,
        "m5R1ReceiptSha256": M5_R1_SELF_SHA256,
        "m5ReceiptRawSha256": M5_RAW_SHA256,
        "m5ReceiptSha256": M5_SELF_SHA256,
        "noCandidateSolve": True,
        "noPersistence": True,
        "noRetune": True,
        "orderedPayloadBindings": [
            {
                "f64leWordHex": list(payload.f64le_word_hex),
                "ordinal": payload.ordinal,
                "path": payload.path,
                "rawSha256": payload.raw_sha256,
                "sizeBytes": payload.size_bytes,
            }
            for payload in payloads
        ],
        "packetRawSha256": PACKET_SHA256,
        "runtimeBinding": {
            "gmpy2Version": GMPY2_VERSION,
            "loadedByteIdentityAuthenticated": False,
            "mpfrVersion": MPFR_VERSION,
            "paths": list(runtime_paths),
            "runtimeDisjointIndependentReplayAuthority": False,
        },
        "selectedModeCount": SELECTED_MODE_COUNT,
        "status": "PASS",
        "totalSizeBytes": total_size,
    }
    receipt_sha256 = _receipt_self_hash(unsigned)
    full = dict(unsigned)
    full["receiptSha256"] = receipt_sha256
    receipt_raw = _canonical(full)
    return InitializerMaterialization(
        payloads=payloads,
        receipt_canonical_json=receipt_raw,
        receipt_sha256=receipt_sha256,
        total_size_bytes=total_size,
        status="PASS",
    )


__all__ = [
    "G2BB1InitializerError",
    "InitializerMaterialization",
    "InitializerPayload",
    "materialize_initializer_from_m5_r1",
]
