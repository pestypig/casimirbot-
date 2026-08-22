"""Exact finite-prefix lambda-zero coupled-Jacobian action oracle.

Program gate: G2 — classical branch proof and terminal state
Workstream: lambda-zero limiting-ground-state proof implementation
Capability or component: spectral L0 and normalized coupled DR0 prefix action
Current maturity: authority-neutral exact-arithmetic reference implementation
Target maturity: source-disjoint oracle for the directed MPFR linear operator
Required frozen inputs: sealed lambda-zero proof definition and the accepted
    radial power-series coefficient convention at the regular origin
Required evidence: exact radial Laplacian, convolution, directional derivative,
    normalization row, bounded ingress, deterministic digest, false authority
Stop/fail criteria: definition drift, non-rational or oversized ingress,
    mismatched lengths, normalization drift, derivative mismatch, or promotion
Explicit non-goals: a global inverse, tail operator, kernel proof,
    transversality integral, seed execution, first tube, candidate, or lamp
Downstream gate unlocked: directed MPFR coupled-Jacobian finite-prefix evaluator

The returned finite prefix is a calculation oracle only.  It neither proves
bijectivity nor supplies the analytic tail columns required by the successor.
"""

from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction
import hashlib
import json
from typing import Final


__all__ = [
    "LambdaZeroCoupledJacobianError",
    "apply_lambda_zero_coupled_jacobian_exact",
]


LAMBDA_ZERO_DEFINITION_SEMANTIC_SHA256: Final[str] = (
    "bb8dc226a11d3189357f75da67b8ea7b189c09b9b0091fc42aabac4da66f629f"
)
LAMBDA_ZERO_DEFINITION_CANONICAL_SIZE_BYTES: Final[int] = 8_157
LAMBDA_ZERO_DEFINITION_RAW_SHA256: Final[str] = (
    "ee617cf1c48d25536e1faf11f9cd2bd75fc25deb2b102fec547243c26e928de7"
)
LAMBDA_ZERO_DEFINITION_RAW_SIZE_BYTES: Final[int] = 20_476
MAXIMUM_PREFIX_COEFFICIENTS: Final[int] = 513
MAXIMUM_SCALAR_BITS: Final[int] = 2_048
WIRE_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/lambda-zero-coupled-jacobian-exact/v1\n"
)


class LambdaZeroCoupledJacobianError(RuntimeError):
    """Typed fail-closed exact coupled-Jacobian error."""

    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> None:
    raise LambdaZeroCoupledJacobianError(code, detail)


def _fraction(value: object, label: str) -> Fraction:
    if type(value) is int:
        result = Fraction(value)
    elif type(value) is Fraction:
        result = value
    else:
        _fail("exact_rational_required", label)
    if (
        result.numerator.bit_length() > MAXIMUM_SCALAR_BITS
        or result.denominator.bit_length() > MAXIMUM_SCALAR_BITS
    ):
        _fail("scalar_bit_budget_exceeded", label)
    return result


def _coefficients(value: object, label: str) -> tuple[Fraction, ...]:
    if type(value) is not tuple:
        _fail("coefficient_tuple_required", label)
    if not 1 <= len(value) <= MAXIMUM_PREFIX_COEFFICIENTS:
        _fail("coefficient_count_invalid", label)
    return tuple(
        _fraction(entry, f"{label}[{index}]")
        for index, entry in enumerate(value)
    )


def _radial_laplacian_prefix(
    coefficients: tuple[Fraction, ...], output_length: int
) -> tuple[Fraction, ...]:
    result = [Fraction(0) for _ in range(output_length)]
    for output_index in range(min(output_length, len(coefficients) - 1)):
        source_index = output_index + 1
        result[output_index] = (
            2
            * source_index
            * (2 * source_index + 1)
            * coefficients[source_index]
        )
    return tuple(result)


def _product_prefix(
    left: tuple[Fraction, ...],
    right: tuple[Fraction, ...],
    output_length: int,
) -> tuple[Fraction, ...]:
    result = [Fraction(0) for _ in range(output_length)]
    for shell in range(output_length):
        minimum = max(0, shell - (len(right) - 1))
        maximum = min(shell, len(left) - 1)
        for left_index in range(minimum, maximum + 1):
            result[shell] += left[left_index] * right[shell - left_index]
    return tuple(result)


def _subtract_scalar_from_constant(
    coefficients: tuple[Fraction, ...], scalar: Fraction
) -> tuple[Fraction, ...]:
    return (coefficients[0] - scalar,) + coefficients[1:]


def _spectral_action(
    u: tuple[Fraction, ...],
    v: tuple[Fraction, ...],
    nu: Fraction,
    delta_u: tuple[Fraction, ...],
) -> tuple[Fraction, ...]:
    length = len(u)
    laplacian = _radial_laplacian_prefix(delta_u, length)
    potential = _product_prefix(
        _subtract_scalar_from_constant(v, nu), delta_u, length
    )
    return tuple(-laplacian[index] / 2 + potential[index] for index in range(length))


def _encode_fraction(value: Fraction) -> str:
    return f"{value.numerator}/{value.denominator}"


def _wire_sha256(payload: object) -> str:
    encoded = json.dumps(
        payload,
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("ascii")
    return hashlib.sha256(
        WIRE_DOMAIN + len(encoded).to_bytes(8, "little") + encoded
    ).hexdigest()


@dataclass(frozen=True, slots=True)
class _CoupledJacobianReceipt:
    u: tuple[Fraction, ...]
    v: tuple[Fraction, ...]
    nu: Fraction
    delta_u: tuple[Fraction, ...]
    delta_v: tuple[Fraction, ...]
    delta_nu: Fraction
    spectral_l0_delta_u: tuple[Fraction, ...]
    delta_r_u: tuple[Fraction, ...]
    delta_r_v: tuple[Fraction, ...]
    delta_r_normalization: Fraction
    canonical_sha256: str
    exact_finite_prefix_action_implemented: bool
    analytic_tail_columns_implemented: bool
    global_inverse_proved: bool
    simple_kernel_proved: bool
    transversality_proved: bool
    proof_execution_authorized: bool
    candidate_executed: bool
    branch_accepted: bool
    theory_graph_authority: bool
    physical_authority: bool
    propulsion_authority: bool
    transport_authority: bool
    blockers: tuple[str, ...]

    def __post_init__(self) -> None:
        if self.exact_finite_prefix_action_implemented is not True:
            _fail("receipt_finite_prefix_fact_invalid")
        false_fields = (
            "analytic_tail_columns_implemented",
            "global_inverse_proved",
            "simple_kernel_proved",
            "transversality_proved",
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


def apply_lambda_zero_coupled_jacobian_exact(
    u: object,
    v: object,
    nu: object,
    delta_u: object,
    delta_v: object,
    delta_nu: object,
) -> _CoupledJacobianReceipt:
    """Apply the frozen normalized coupled Jacobian to one exact prefix."""

    exact_u = _coefficients(u, "u")
    exact_v = _coefficients(v, "v")
    exact_delta_u = _coefficients(delta_u, "delta_u")
    exact_delta_v = _coefficients(delta_v, "delta_v")
    if not (
        len(exact_u)
        == len(exact_v)
        == len(exact_delta_u)
        == len(exact_delta_v)
    ):
        _fail("coefficient_length_mismatch")
    if exact_u[0] != 1:
        _fail("normalized_ground_state_u0_required")
    exact_nu = _fraction(nu, "nu")
    if exact_nu >= 0:
        _fail("negative_nu_required")
    exact_delta_nu = _fraction(delta_nu, "delta_nu")
    length = len(exact_u)
    spectral = _spectral_action(
        exact_u, exact_v, exact_nu, exact_delta_u
    )
    u_delta_v = _product_prefix(exact_u, exact_delta_v, length)
    delta_r_u = tuple(
        spectral[index]
        + u_delta_v[index]
        - exact_u[index] * exact_delta_nu
        for index in range(length)
    )
    laplacian_delta_v = _radial_laplacian_prefix(exact_delta_v, length)
    u_delta_u = _product_prefix(exact_u, exact_delta_u, length)
    delta_r_v = tuple(
        laplacian_delta_v[index] - 2 * u_delta_u[index]
        for index in range(length)
    )
    payload = {
        "deltaNu": _encode_fraction(exact_delta_nu),
        "deltaRU": [_encode_fraction(value) for value in delta_r_u],
        "deltaRV": [_encode_fraction(value) for value in delta_r_v],
        "deltaUNormalization": _encode_fraction(exact_delta_u[0]),
        "nu": _encode_fraction(exact_nu),
        "version": (
            "nhm2_spherical_boson_star_v2_"
            "lambda_zero_coupled_jacobian_exact/v1"
        ),
    }
    return _CoupledJacobianReceipt(
        u=exact_u,
        v=exact_v,
        nu=exact_nu,
        delta_u=exact_delta_u,
        delta_v=exact_delta_v,
        delta_nu=exact_delta_nu,
        spectral_l0_delta_u=spectral,
        delta_r_u=delta_r_u,
        delta_r_v=delta_r_v,
        delta_r_normalization=exact_delta_u[0],
        canonical_sha256=_wire_sha256(payload),
        exact_finite_prefix_action_implemented=True,
        analytic_tail_columns_implemented=False,
        global_inverse_proved=False,
        simple_kernel_proved=False,
        transversality_proved=False,
        proof_execution_authorized=False,
        candidate_executed=False,
        branch_accepted=False,
        theory_graph_authority=False,
        physical_authority=False,
        propulsion_authority=False,
        transport_authority=False,
        blockers=(
            "accepted_global_newtonian_profile_absent",
            "directed_mpfr_prefix_replay_not_implemented",
            "analytic_tail_columns_and_global_inverse_absent",
            "simple_kernel_and_transversality_receipts_absent",
            "first_tube_containment_absent",
        ),
    )
