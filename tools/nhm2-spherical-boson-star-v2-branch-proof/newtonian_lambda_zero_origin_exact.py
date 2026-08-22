"""Exact lambda-zero origin contraction reference for the G2 proof.

Program gate: G2 — classical branch proof and terminal state
Workstream: lambda-zero limiting-ground-state proof implementation
Capability or component: exact origin representative and contraction oracle
Current maturity: authority-neutral exact-arithmetic reference implementation
Target maturity: source-disjoint oracle for the directed MPFR origin proof
Required frozen inputs: Newtonian seed directed-proof architecture and operator
    successor, d=2^-8, representative order 16, and 61 frozen radii
Required evidence: exact recurrence, finite representative defect, Y/Z0/Z1,
    radius selection, derivative-envelope propagation, bounded ingress, digest
Stop/fail criteria: non-rational ingress, excessive integer size, recurrence or
    envelope disagreement, no accepted radius, or any authority promotion
Explicit non-goals: seed execution, exterior proof, simple-kernel proof,
    transversality, first-tube containment, candidate admission, or lamp claims
Downstream gate unlocked: directed MPFR lambda-zero origin proof implementation

This module evaluates only the already-frozen rational origin formulas.  It
does not read seed outputs, mint proof evidence, or authorize execution.
"""

from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction
import hashlib
import json
from typing import Final


__all__ = [
    "LambdaZeroOriginError",
    "evaluate_lambda_zero_origin_exact",
]


DIRECTED_PROOF_OPERATOR_RAW_SHA256: Final[str] = (
    "084e1b32a15955fd9867f9616a4ec01bb986a12fa347162df92efed7c1d430a1"
)
DIRECTED_PROOF_OPERATOR_RAW_SIZE_BYTES: Final[int] = 54_712
DIRECTED_PROOF_ARCHITECTURE_SHA256: Final[str] = (
    "c8832ae77d1279d400f1fffbc587e413659c111ae90283cb34a016fb7e08ea99"
)
DIRECTED_PROOF_ARCHITECTURE_CANONICAL_SIZE_BYTES: Final[int] = 42_778
WIRE_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/lambda-zero-origin-exact/v1\n"
)
MAXIMUM_SCALAR_BITS: Final[int] = 1_024
REPRESENTATIVE_MAXIMUM_INDEX: Final[int] = 16
DEFECT_MINIMUM_INDEX: Final[int] = 17
DEFECT_MAXIMUM_INDEX: Final[int] = 33
RADIUS_CANDIDATES: Final[tuple[Fraction, ...]] = tuple(
    Fraction(1, 1 << exponent) for exponent in range(80, 19, -1)
)
D_EXACT: Final[Fraction] = Fraction(1, 1 << 8)
Q_EXACT: Final[Fraction] = Fraction(1, 1 << 12)
M_EXACT: Final[Fraction] = Fraction(1 << 8)
INV_D17_EXACT: Final[Fraction] = Fraction(1, 1_190)


class LambdaZeroOriginError(RuntimeError):
    """Typed fail-closed exact-origin error."""

    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> None:
    raise LambdaZeroOriginError(code, detail)


def _fraction(value: object, label: str) -> Fraction:
    if type(value) is int:
        result = Fraction(value)
    elif type(value) is Fraction:
        result = value
    else:
        _fail("scalar_exact_rational_required", label)
    if (
        result.numerator.bit_length() > MAXIMUM_SCALAR_BITS
        or result.denominator.bit_length() > MAXIMUM_SCALAR_BITS
    ):
        _fail("scalar_bit_budget_exceeded", label)
    return result


def _denominator(index: int) -> int:
    return 2 * index * (2 * index + 1)


def _convolution(
    left: tuple[Fraction, ...], right: tuple[Fraction, ...], shell: int
) -> Fraction:
    return sum(
        (left[index] * right[shell - index] for index in range(shell + 1)),
        Fraction(0),
    )


def _representative(
    nu0: Fraction, vc: Fraction
) -> tuple[tuple[Fraction, ...], tuple[Fraction, ...]]:
    a = [Fraction(1)]
    b = [vc]
    for shell in range(REPRESENTATIVE_MAXIMUM_INDEX):
        denominator = _denominator(shell + 1)
        ba = _convolution(tuple(b), tuple(a), shell)
        aa = _convolution(tuple(a), tuple(a), shell)
        a.append(Fraction(2) * (ba - nu0 * a[shell]) / denominator)
        b.append(aa / denominator)
    return tuple(a), tuple(b)


def _defect_component(
    a: tuple[Fraction, ...],
    b: tuple[Fraction, ...],
    nu0: Fraction,
    index: int,
) -> tuple[Fraction, Fraction]:
    padded_a = a + (Fraction(0),) * (index + 1 - len(a))
    padded_b = b + (Fraction(0),) * (index + 1 - len(b))
    shell = index - 1
    denominator = _denominator(index)
    ba = _convolution(padded_b, padded_a, shell)
    aa = _convolution(padded_a, padded_a, shell)
    ga = padded_a[index] - Fraction(2) * (ba - nu0 * padded_a[shell]) / denominator
    gb = padded_b[index] - aa / denominator
    return ga, gb


def _weighted_l1(values: tuple[Fraction, ...]) -> Fraction:
    return sum(
        (
            D_EXACT ** (2 * index) * abs(value)
            for index, value in enumerate(values)
        ),
        Fraction(0),
    )


def _encode_fraction(value: Fraction) -> str:
    return f"{value.numerator}/{value.denominator}"


def _wire_sha256(payload_value: object) -> str:
    payload = json.dumps(
        payload_value,
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("ascii")
    return hashlib.sha256(
        WIRE_DOMAIN + len(payload).to_bytes(8, "little") + payload
    ).hexdigest()


@dataclass(frozen=True, slots=True)
class _RadiusResult:
    ordinal: int
    radius: Fraction
    z_upper: Fraction
    p_upper: Fraction
    contraction_passed: bool
    envelope_base_passed: None
    selected: bool


@dataclass(frozen=True, slots=True)
class _LambdaZeroOriginReceipt:
    nu0: Fraction
    vc: Fraction
    representative_a: tuple[Fraction, ...]
    representative_b: tuple[Fraction, ...]
    defects_a: tuple[Fraction, ...]
    defects_b: tuple[Fraction, ...]
    abar: Fraction
    bbar: Fraction
    y_upper: Fraction
    z0_upper: Fraction
    z1_upper: Fraction
    envelope_propagation_upper: Fraction
    envelope_propagation_passed: bool
    radius_results: tuple[_RadiusResult, ...]
    selected_radius_ordinal: int | None
    selected_radius: Fraction | None
    canonical_sha256: str
    exact_origin_operator_implemented: bool
    directed_mpfr_replay_complete: bool
    exterior_proof_complete: bool
    simple_kernel_proof_complete: bool
    transversality_proof_complete: bool
    first_tube_containment_complete: bool
    proof_execution_authorized: bool
    candidate_executed: bool
    branch_accepted: bool
    theory_graph_authority: bool
    physical_authority: bool
    propulsion_authority: bool
    transport_authority: bool
    blockers: tuple[str, ...]

    def __post_init__(self) -> None:
        if self.exact_origin_operator_implemented is not True:
            _fail("receipt_origin_fact_invalid")
        false_fields = (
            "directed_mpfr_replay_complete",
            "exterior_proof_complete",
            "simple_kernel_proof_complete",
            "transversality_proof_complete",
            "first_tube_containment_complete",
            "proof_execution_authorized",
            "candidate_executed",
            "branch_accepted",
            "theory_graph_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
        )
        if any(getattr(self, field) is not False for field in false_fields):
            _fail("receipt_authority_promotion_forbidden")


def evaluate_lambda_zero_origin_exact(
    nu0: object, vc: object
) -> _LambdaZeroOriginReceipt:
    """Evaluate the frozen exact lambda-zero origin contraction formulas."""

    exact_nu0 = _fraction(nu0, "nu0")
    exact_vc = _fraction(vc, "vc")
    a, b = _representative(exact_nu0, exact_vc)
    defects = tuple(
        _defect_component(a, b, exact_nu0, index)
        for index in range(DEFECT_MINIMUM_INDEX, DEFECT_MAXIMUM_INDEX + 1)
    )
    defects_a = tuple(value[0] for value in defects)
    defects_b = tuple(value[1] for value in defects)
    abar = _weighted_l1(a)
    bbar = _weighted_l1(b)
    y_upper = sum(
        (
            D_EXACT ** (2 * index) * (abs(ga) + abs(gb))
            for index, (ga, gb) in zip(
                range(DEFECT_MINIMUM_INDEX, DEFECT_MAXIMUM_INDEX + 1), defects
            )
        ),
        Fraction(0),
    )
    z0_upper = INV_D17_EXACT * 2 * (abar + bbar + abs(exact_nu0))
    z1_upper = INV_D17_EXACT * 6

    aq = sum(
        (
            abs(value) * (D_EXACT**2 / Q_EXACT) ** index
            for index, value in enumerate(a)
        ),
        Fraction(0),
    )
    bq = sum(
        (
            abs(value) * (D_EXACT**2 / Q_EXACT) ** index
            for index, value in enumerate(b)
        ),
        Fraction(0),
    )
    c_value = M_EXACT * (4 * aq + 2 * bq + 2 * abs(exact_nu0))
    envelope_propagation_upper = (D_EXACT**2 / (M_EXACT * Q_EXACT)) * (
        c_value / 4_970 + 3 * M_EXACT**2 / 548
    )
    envelope_propagation_passed = envelope_propagation_upper <= 1

    radius_rows: list[_RadiusResult] = []
    selected_ordinal: int | None = None
    for ordinal, radius in enumerate(RADIUS_CANDIDATES):
        z_upper = z0_upper + z1_upper * radius
        p_upper = y_upper + z_upper * radius - radius
        contraction_passed = p_upper < 0 and z_upper < 1
        # The frozen envelope base n=17..34 is an interval-recurrence duty.
        # It cannot be inferred from the scalar l1 radius alone, so this exact
        # center oracle deliberately leaves selection unavailable.
        envelope_base_passed = None
        selected = False
        radius_rows.append(
            _RadiusResult(
                ordinal=ordinal,
                radius=radius,
                z_upper=z_upper,
                p_upper=p_upper,
                contraction_passed=contraction_passed,
                envelope_base_passed=envelope_base_passed,
                selected=selected,
            )
        )

    payload = {
        "a": [_encode_fraction(value) for value in a],
        "b": [_encode_fraction(value) for value in b],
        "defectsA": [_encode_fraction(value) for value in defects_a],
        "defectsB": [_encode_fraction(value) for value in defects_b],
        "nu0": _encode_fraction(exact_nu0),
        "selectedRadiusOrdinal": selected_ordinal,
        "vc": _encode_fraction(exact_vc),
        "version": "nhm2_spherical_boson_star_v2_lambda_zero_origin_exact/v1",
    }
    return _LambdaZeroOriginReceipt(
        nu0=exact_nu0,
        vc=exact_vc,
        representative_a=a,
        representative_b=b,
        defects_a=defects_a,
        defects_b=defects_b,
        abar=abar,
        bbar=bbar,
        y_upper=y_upper,
        z0_upper=z0_upper,
        z1_upper=z1_upper,
        envelope_propagation_upper=envelope_propagation_upper,
        envelope_propagation_passed=envelope_propagation_passed,
        radius_results=tuple(radius_rows),
        selected_radius_ordinal=selected_ordinal,
        selected_radius=(
            None if selected_ordinal is None else RADIUS_CANDIDATES[selected_ordinal]
        ),
        canonical_sha256=_wire_sha256(payload),
        exact_origin_operator_implemented=True,
        directed_mpfr_replay_complete=False,
        exterior_proof_complete=False,
        simple_kernel_proof_complete=False,
        transversality_proof_complete=False,
        first_tube_containment_complete=False,
        proof_execution_authorized=False,
        candidate_executed=False,
        branch_accepted=False,
        theory_graph_authority=False,
        physical_authority=False,
        propulsion_authority=False,
        transport_authority=False,
        blockers=(
            "accepted_newtonian_seed_instance_absent",
            "directed_mpfr_origin_replay_not_implemented",
            "exterior_global_root_proof_not_implemented",
            "simple_kernel_and_transversality_proofs_not_implemented",
            "first_vacuum_tube_containment_not_implemented",
        ),
    )
