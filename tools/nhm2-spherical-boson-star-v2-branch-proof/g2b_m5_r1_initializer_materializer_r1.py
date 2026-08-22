"""Versioned terminal-RNDN origin-barrier repair for G2B-B1.

Program gate: G2B — replacement classical proof attempt
Workstream: authenticated classical branch closure
Capability or component: B1-R1 initializer origin-representation admission
Current maturity: preregistered sole-repair calculation implementation
Target maturity: deterministic six-payload initializer receipt or falsifier
Required frozen inputs: B1 failure/source, R1 packet, M5/M5-R1 and policy bindings
Required evidence: unchanged derivation plus exact positive-one terminal barrier
Stop/fail criteria: first unchanged B1 failure or repaired barrier mismatch
Explicit non-goals: tolerance change, M5 rerun, candidate solve, persistence or authority
Downstream gate unlocked: four-grid execution review
"""

from __future__ import annotations

from fractions import Fraction
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import sys
from typing import Final, NoReturn

import gmpy2


ROOT: Final[Path] = Path(__file__).resolve().parents[2]
PACKET_PATH: Final[Path] = (
    ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2b-b1-r1-origin-barrier-diagnosis.md"
)
PACKET_SHA256: Final[str] = (
    "1a300324068fb48fcd7cd245332b89910db997a11e4353197442be044d4fabdc"
)
PACKET_SIZE_BYTES: Final[int] = 2_579
B1_SOURCE_PATH: Final[Path] = Path(__file__).with_name(
    "g2b_m5_r1_initializer_materializer.py"
)
B1_SOURCE_SHA256: Final[str] = (
    "09c191ff5be53ce3829e97f9ce13659544d5856dbcaf470402157e786c72f724"
)
B1_SOURCE_SIZE_BYTES: Final[int] = 25_304
RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2b-b1-r1-initializer-materialization/v1\n"
)
EXPECTED_ORIGIN_DIFFERENCE: Final[Fraction] = Fraction(
    10_445_944_158_304_557,
    324_518_553_658_426_726_783_156_020_576_256,
)
EXPECTED_ORIGIN_TERMINAL_WORD: Final[str] = "000000000000f03f"


class G2BB1R1InitializerError(RuntimeError):
    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> NoReturn:
    raise G2BB1R1InitializerError(code, detail)


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


def _load_b1():
    try:
        raw = B1_SOURCE_PATH.read_bytes()
    except OSError as error:
        _fail("g2b_b1_r1_b1_source_read_failed", type(error).__name__)
    if len(raw) != B1_SOURCE_SIZE_BYTES or _sha256(raw) != B1_SOURCE_SHA256:
        _fail("g2b_b1_r1_b1_source_binding_drift")
    spec = importlib.util.spec_from_file_location("g2b_b1_r1_frozen_b1", B1_SOURCE_PATH)
    if spec is None or spec.loader is None:
        _fail("g2b_b1_r1_b1_source_spec_unavailable")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def _mpfr_fraction(value: object) -> Fraction:
    numerator, denominator = gmpy2.mpfr(value).as_integer_ratio()
    return Fraction(int(numerator), int(denominator))


def _receipt_self_hash(unsigned: dict[str, object]) -> str:
    raw = _canonical(unsigned)
    return _sha256(RECEIPT_DOMAIN + struct.pack("<Q", len(raw)) + raw)


def materialize_initializer_from_m5_r1_r1():
    """Execute the one repaired barrier rule; perform no persistence or solve."""

    b1 = _load_b1()
    b1._verify_file(PACKET_PATH, PACKET_SIZE_BYTES, PACKET_SHA256, "r1_packet")
    b1._verify_file(
        b1.PACKET_PATH, b1.PACKET_SIZE_BYTES, b1.PACKET_SHA256, "b1_packet"
    )
    b1._verify_file(
        b1.BRANCH_POLICY_PATH,
        b1.BRANCH_POLICY_SIZE_BYTES,
        b1.BRANCH_POLICY_SHA256,
        "branch_policy",
    )
    b1._verify_file(
        b1.INITIALIZER_POLICY_PATH,
        b1.INITIALIZER_POLICY_SIZE_BYTES,
        b1.INITIALIZER_POLICY_SHA256,
        "initializer_policy",
    )
    m5 = b1._load_receipt(
        b1.M5_PATH,
        b1.M5_SIZE_BYTES,
        b1.M5_RAW_SHA256,
        b1.M5_SELF_SHA256,
        b1.M5_DOMAIN,
        "m5",
    )
    m5_r1 = b1._load_receipt(
        b1.M5_R1_PATH,
        b1.M5_R1_SIZE_BYTES,
        b1.M5_R1_RAW_SHA256,
        b1.M5_R1_SELF_SHA256,
        b1.M5_R1_DOMAIN,
        "m5_r1",
    )
    if (
        m5_r1.get("decision") != "INDEPENDENT_CORE_DUTY_PASS"
        or m5_r1.get("firstFailure") is not None
        or m5_r1.get("m5ReceiptSha256") != b1.M5_SELF_SHA256
        or m5_r1.get("selectedModeCount") != b1.SELECTED_MODE_COUNT
        or m5_r1.get("noCandidateSolve") is not True
        or m5_r1.get("noProjectionRerun") is not True
        or m5_r1.get("noRetune") is not True
        or m5.get("decision") != "MPFR_PROJECTION_SELECTED"
        or m5.get("selectedModeCount") != b1.SELECTED_MODE_COUNT
        or m5.get("noCandidateSolve") is not True
        or m5.get("noRetune") is not True
    ):
        _fail("g2b_b1_r1_entry_receipt_invalid")
    records = m5.get("projectionRecords")
    if type(records) is not list or len(records) != 3:
        _fail("g2b_b1_r1_projection_records_invalid")
    selected = next(
        (
            record
            for record in records
            if type(record) is dict
            and record.get("modeCount") == b1.SELECTED_MODE_COUNT
            and record.get("eligible") is True
        ),
        None,
    )
    if selected is None:
        _fail("g2b_b1_r1_selected_projection_absent")
    u_exact = b1._coefficient_fractions(selected.get("uCoefficientBinding"), "u")
    v_exact = b1._coefficient_fractions(selected.get("vCoefficientBinding"), "V")
    nu_binding = m5_r1.get("nuBinding")
    if type(nu_binding) is not dict or type(nu_binding.get("fine")) is not dict:
        _fail("g2b_b1_r1_nu_binding_invalid")
    fine_nu = nu_binding["fine"]
    if set(fine_nu) != {"numerator", "denominator"}:
        _fail("g2b_b1_r1_nu_binding_invalid")
    try:
        nu_exact = Fraction(int(fine_nu["numerator"]), int(fine_nu["denominator"]))
    except (TypeError, ValueError, ZeroDivisionError):
        _fail("g2b_b1_r1_nu_binding_invalid")
    runtime_paths = b1._runtime_paths()
    with b1._mpfr_context():
        u_f64 = tuple(
            b1._to_f64(
                b1._mp_fraction(value, f"u_exact:{index}"), f"u_f64:{index}"
            )
            for index, value in enumerate(u_exact)
        )
        v_f64 = tuple(
            b1._to_f64(
                b1._mp_fraction(value, f"V_exact:{index}"), f"V_f64:{index}"
            )
            for index, value in enumerate(v_exact)
        )
        u_mp = tuple(
            b1._op(
                f"u_set_d:{index}", lambda value=value: gmpy2.mpfr(value)
            )
            for index, value in enumerate(u_f64)
        )
        v_mp = tuple(
            b1._op(
                f"V_set_d:{index}", lambda value=value: gmpy2.mpfr(value)
            )
            for index, value in enumerate(v_f64)
        )
        rho_zero = b1._op("rho_zero", lambda: gmpy2.mpfr(0))
        rho_join = b1._mp_fraction(Fraction(b1.RADIUS, b1.RADIUS + 1), "rho_join")
        u_origin, _ = b1._chebyshev_value_and_rho_derivative(
            u_mp, rho_zero, "u_origin"
        )
        vc, _ = b1._chebyshev_value_and_rho_derivative(v_mp, rho_zero, "V_origin")
        join_u, join_u_rho = b1._chebyshev_value_and_rho_derivative(
            u_mp, rho_join, "u_join"
        )
        join_v, join_v_rho = b1._chebyshev_value_and_rho_derivative(
            v_mp, rho_join, "V_join"
        )
        derivative_denominator = b1._op(
            "derivative_denominator", lambda: gmpy2.mpfr((b1.RADIUS + 1) ** 2)
        )
        join_u1 = b1._op("join_u1", lambda: join_u_rho / derivative_denominator)
        join_v1 = b1._op("join_v1", lambda: join_v_rho / derivative_denominator)
        radius_mp = b1._op("radius", lambda: gmpy2.mpfr(b1.RADIUS))
        radius_squared = b1._op("radius_squared", lambda: radius_mp * radius_mp)
        mass = b1._op("mass", lambda: radius_squared * join_v1)
        nu0 = b1._mp_fraction(nu_exact, "nu0")
        minus_two = b1._op("minus_two", lambda: gmpy2.mpfr(-2))
        minus_two_nu = b1._op("minus_two_nu", lambda: minus_two * nu0)
        kappa = b1._op("kappa", lambda: gmpy2.sqrt(minus_two_nu))
        one = b1._op("one", lambda: gmpy2.mpfr(1))
        sigma_plus_one = b1._op("sigma_plus_one", lambda: mass / kappa)
        sigma = b1._op("sigma", lambda: sigma_plus_one - one)
        kappa_radius = b1._op("kappa_radius", lambda: kappa * radius_mp)
        log_radius = b1._op("log_radius", lambda: gmpy2.log(radius_mp))
        sigma_log_radius = b1._op("sigma_log_radius", lambda: sigma * log_radius)
        c_exponent = b1._op("c_exponent", lambda: kappa_radius - sigma_log_radius)
        c_factor = b1._op("c_factor", lambda: gmpy2.exp(c_exponent))
        c_value = b1._op("C", lambda: join_u * c_factor)
        four = b1._op("four", lambda: gmpy2.mpfr(4))
        pi = b1._op("pi", lambda: gmpy2.const_pi())
        four_pi = b1._op("four_pi", lambda: four * pi)
        n0 = b1._op("N0", lambda: four_pi * c_value)
        thirty_two = b1._op("thirty_two", lambda: gmpy2.mpfr(32))
        lambda_value = b1._op("lambda", lambda: one / thirty_two)
        lambda_squared = b1._op("lambda_squared", lambda: lambda_value * lambda_value)
        nu_star = b1._op("nu_star", lambda: lambda_squared * nu0)
        two = b1._op("two", lambda: gmpy2.mpfr(2))
        two_nu_star = b1._op("two_nu_star", lambda: two * nu_star)
        w_squared = b1._op("w_squared", lambda: one + two_nu_star)
        w_seed = b1._op("w_seed", lambda: gmpy2.sqrt(w_squared))
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
            _fail("g2b_b1_r1_frozen_domain_failed")
        origin_difference = _mpfr_fraction(u_origin - one)
        origin_terminal = b1._to_f64(u_origin, "origin_terminal")
        origin_terminal_word = struct.pack("<d", origin_terminal).hex()
        if origin_difference != EXPECTED_ORIGIN_DIFFERENCE:
            _fail("g2b_b1_r1_origin_difference_mismatch")
        if origin_terminal_word != EXPECTED_ORIGIN_TERMINAL_WORD:
            _fail("g2b_b1_r1_origin_terminal_barrier_failed")
        scalar_values = tuple(
            b1._to_f64(value, label)
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
            b1._to_f64(value, label)
            for value, label in (
                (join_u, "join_U"),
                (join_u1, "join_U1"),
                (join_v, "join_V"),
                (join_v1, "join_V1"),
            )
        )
    zeros = (0.0,) * 32
    payloads = (
        b1._payload(0, b1.PAYLOAD_LAYOUT[0][0], scalar_values),
        b1._payload(1, b1.PAYLOAD_LAYOUT[1][0], u_f64),
        b1._payload(2, b1.PAYLOAD_LAYOUT[2][0], v_f64),
        b1._payload(3, b1.PAYLOAD_LAYOUT[3][0], zeros),
        b1._payload(4, b1.PAYLOAD_LAYOUT[4][0], zeros),
        b1._payload(5, b1.PAYLOAD_LAYOUT[5][0], join_values),
    )
    total_size = sum(payload.size_bytes for payload in payloads)
    if total_size != 2_664:
        _fail("g2b_b1_r1_aggregate_size_invalid")
    unsigned: dict[str, object] = {
        "artifactId": "nhm2.spherical_boson_star_v2.g2b_b1_r1_initializer_materialization",
        "authorityLocks": {name: False for name in b1.AUTHORITY_NAMES},
        "b1FailurePreserved": True,
        "b1SourceRawSha256": B1_SOURCE_SHA256,
        "branchPolicyRawSha256": b1.BRANCH_POLICY_SHA256,
        "branchPolicySemanticSha256": b1.BRANCH_POLICY_SEMANTIC_SHA256,
        "candidateExecuted": False,
        "decision": "INITIALIZER_PAYLOADS_MATERIALIZED_IN_MEMORY",
        "initializerPolicyRawSha256": b1.INITIALIZER_POLICY_SHA256,
        "initializerPolicySemanticSha256": b1.INITIALIZER_POLICY_SEMANTIC_SHA256,
        "m5R1ReceiptRawSha256": b1.M5_R1_RAW_SHA256,
        "m5R1ReceiptSha256": b1.M5_R1_SELF_SHA256,
        "m5ReceiptRawSha256": b1.M5_RAW_SHA256,
        "m5ReceiptSha256": b1.M5_SELF_SHA256,
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
        "originRepresentationEvidence": {
            "exactDifferenceDenominator": str(origin_difference.denominator),
            "exactDifferenceNumerator": str(origin_difference.numerator),
            "terminalF64leWordHex": origin_terminal_word,
        },
        "packetRawSha256": PACKET_SHA256,
        "runtimeBinding": {
            "gmpy2Version": b1.GMPY2_VERSION,
            "loadedByteIdentityAuthenticated": False,
            "mpfrVersion": b1.MPFR_VERSION,
            "paths": list(runtime_paths),
            "runtimeDisjointIndependentReplayAuthority": False,
        },
        "selectedModeCount": b1.SELECTED_MODE_COUNT,
        "soleRepair": "exact_mpfr_origin_equality_replaced_by_exact_positive_one_terminal_RNDN_word",
        "status": "PASS",
        "totalSizeBytes": total_size,
    }
    receipt_sha256 = _receipt_self_hash(unsigned)
    full = dict(unsigned)
    full["receiptSha256"] = receipt_sha256
    return b1.InitializerMaterialization(
        payloads=payloads,
        receipt_canonical_json=_canonical(full),
        receipt_sha256=receipt_sha256,
        total_size_bytes=total_size,
        status="PASS",
    )


__all__ = [
    "G2BB1R1InitializerError",
    "materialize_initializer_from_m5_r1_r1",
]
