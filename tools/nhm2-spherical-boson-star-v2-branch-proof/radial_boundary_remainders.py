"""Authority-neutral formal radial boundary recurrence machinery.

This module closes only finite, exact-algebra diagnostics selected by the
frozen spherical-v2 branch policy.  It replays the regular-origin coefficient
rows through ``x^12``, the algebraic Schwarzschild tail through emitted order
``z^8`` plus non-emitted metric scratch order ``z^9``, and the factored scalar
tail through ``C_8``.  The arithmetic seam uses :class:`fractions.Fraction`
surrogates; it does not claim that candidate transcendental jets have rational
values or that the surrogates are authenticated candidate data.

The two production proof entry points are deliberately blocked before they
inspect any caller value.  Candidate interface jets, certified majorants, an
interval source/toolchain/executable/runtime closure, and a proof issuer do not
exist here.  Nothing in this file solves or executes a candidate, reads target
or residual arrays, publishes output, promotes a registry entry or lamp, or
grants physical, propulsion, or transport authority.
"""

from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction
import hashlib
from pathlib import Path
from typing import Final, NoReturn, Sequence


RADIAL_BOUNDARY_REMAINDERS_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_v2_radial_boundary_remainders/v1"
)

BRANCH_SELECTION_RAW_SOURCE_PATH: Final[str] = (
    "shared/contracts/nhm2-spherical-boson-star-v2-branch-selection-numerics.v1.ts"
)
BRANCH_SELECTION_RAW_SOURCE_SHA256: Final[str] = (
    "d20e6eeef3d185ff938aa27cc83af87a201d76f986c63d77e0dbe72cf8600c82"
)
BRANCH_SELECTION_RAW_SOURCE_SIZE_BYTES: Final[int] = 44_912
BRANCH_SELECTION_SEMANTIC_SHA256_DOMAIN: Final[str] = (
    "nhm2-spherical-boson-star-v2-branch-selection-numerics/v1\n"
)
BRANCH_SELECTION_SEMANTIC_SHA256: Final[str] = (
    "221af0c6b9f858d20ca2f89c5e4eedf14a0c64ede9ff39e60077b79f08ad9aaa"
)
BRANCH_SELECTION_PLAIN_CANONICAL_SHA256: Final[str] = (
    "913b9d524071c20669e8f0abfd838ef6daa7b2e17b1bd5775a1fafc1e2282962"
)
BRANCH_SELECTION_CANONICAL_SIZE_BYTES: Final[int] = 41_280

BRANCH_BVP_SEMANTIC_SHA256: Final[str] = (
    "ce00d2b6048d8c22e6dedd4526a8548373916525ef9adb75fcea48e67dc7e557"
)
BRANCH_BVP_CANONICAL_SIZE_BYTES: Final[int] = 13_847
RADIAL_PRIMARY_NUMERICS_SEMANTIC_SHA256: Final[str] = (
    "f88e31544dfeccdbb43a5b956172c4b6b4b84f22de3b25ced762282cb5f271bc"
)
RADIAL_PRIMARY_NUMERICS_CANONICAL_SIZE_BYTES: Final[int] = 14_732

ORIGIN_SOURCE_PATH: Final[str] = (
    "tools/nhm2-spherical-boson-star-branch/radial_origin_series.py"
)
ORIGIN_SOURCE_SHA256: Final[str] = (
    "ea76613c9cb5d3ad882d96786f98f85ee170f67e486672d97bc3add444a0d25d"
)
ORIGIN_SOURCE_SIZE_BYTES: Final[int] = 4_738
TAIL_SOURCE_PATH: Final[str] = (
    "tools/nhm2-spherical-boson-star-branch/radial_tail_asymptotics.py"
)
TAIL_SOURCE_SHA256: Final[str] = (
    "b635e5d6f24d05f0c88b29dfa99a156c34968990f4948048a78bd98f2690b1b9"
)
TAIL_SOURCE_SIZE_BYTES: Final[int] = 3_554

FROZEN_ORIGIN_AMPLITUDE: Final[Fraction] = Fraction(1, 1_024)
ORIGIN_MAXIMUM_POWER: Final[int] = 12
ORIGIN_FIRST_OMITTED_POWER: Final[int] = 14
ORIGIN_ANALYTIC_RADIUS_MINIMUM: Final[Fraction] = Fraction(1, 16)
ORIGIN_EVALUATION_EDGE: Final[Fraction] = Fraction(1, 256)
ORIGIN_NORMALIZED_EDGE: Final[Fraction] = Fraction(1, 16)
TAIL_EMITTED_MAXIMUM_ORDER: Final[int] = 8
TAIL_SCRATCH_ORDER: Final[int] = 9
TAIL_NORMALIZED_EDGE: Final[Fraction] = Fraction(1, 64)
MAXIMUM_INPUT_RATIONAL_BITS: Final[int] = 256

ORIGIN_ROW_ORDER: Final[tuple[str, ...]] = (
    "Et_t",
    "Etheta_theta",
    "KGbar",
)
ORIGIN_UNKNOWN_ORDER: Final[tuple[str, ...]] = (
    "F0",
    "F1",
    "varphi",
)
ORIGIN_ELIMINATION_ORDER: Final[tuple[str, ...]] = (
    "F1_from_Et_t",
    "F0_from_Etheta_theta_after_F1",
    "varphi_from_KGbar",
)
TAIL_METRIC_ROW_ORDER: Final[tuple[str, ...]] = ("BnRow", "AnBnRow")
TAIL_METRIC_UNKNOWN_ORDER: Final[tuple[str, ...]] = ("B_n", "A_n")

SYNTHETIC_NUMBER_DOMAIN: Final[str] = (
    "synthetic_stdlib_Fraction_exact_rational_surrogates_only_not_authenticated_"
    "candidate_transcendental_jets"
)


@dataclass(frozen=True, slots=True)
class SourceByteBinding:
    role: str
    relative_path: str
    sha256: str
    size_bytes: int


@dataclass(frozen=True, slots=True)
class SemanticBinding:
    role: str
    semantic_sha256: str
    canonical_size_bytes: int
    semantic_sha256_domain: str | None = None
    plain_canonical_sha256: str | None = None


SOURCE_BYTE_BINDINGS: Final[tuple[SourceByteBinding, ...]] = (
    SourceByteBinding(
        role="frozen_branch_selection_policy_raw_source",
        relative_path=BRANCH_SELECTION_RAW_SOURCE_PATH,
        sha256=BRANCH_SELECTION_RAW_SOURCE_SHA256,
        size_bytes=BRANCH_SELECTION_RAW_SOURCE_SIZE_BYTES,
    ),
    SourceByteBinding(
        role="existing_finite_origin_x4_source",
        relative_path=ORIGIN_SOURCE_PATH,
        sha256=ORIGIN_SOURCE_SHA256,
        size_bytes=ORIGIN_SOURCE_SIZE_BYTES,
    ),
    SourceByteBinding(
        role="existing_leading_tail_source",
        relative_path=TAIL_SOURCE_PATH,
        sha256=TAIL_SOURCE_SHA256,
        size_bytes=TAIL_SOURCE_SIZE_BYTES,
    ),
)

SEMANTIC_BINDINGS: Final[tuple[SemanticBinding, ...]] = (
    SemanticBinding(
        role="frozen_branch_selection_policy",
        semantic_sha256=BRANCH_SELECTION_SEMANTIC_SHA256,
        canonical_size_bytes=BRANCH_SELECTION_CANONICAL_SIZE_BYTES,
        semantic_sha256_domain=BRANCH_SELECTION_SEMANTIC_SHA256_DOMAIN,
        plain_canonical_sha256=BRANCH_SELECTION_PLAIN_CANONICAL_SHA256,
    ),
    SemanticBinding(
        role="frozen_spherical_branch_bvp",
        semantic_sha256=BRANCH_BVP_SEMANTIC_SHA256,
        canonical_size_bytes=BRANCH_BVP_CANONICAL_SIZE_BYTES,
    ),
    SemanticBinding(
        role="frozen_radial_primary_numerics",
        semantic_sha256=RADIAL_PRIMARY_NUMERICS_SEMANTIC_SHA256,
        canonical_size_bytes=RADIAL_PRIMARY_NUMERICS_CANONICAL_SIZE_BYTES,
    ),
)

_MODULE_DIRECTORY = Path(__file__).resolve().parent
_REPOSITORY_ROOT = _MODULE_DIRECTORY.parents[1]


def _assert_bound_source_bytes() -> None:
    for ordinal, binding in enumerate(SOURCE_BYTE_BINDINGS):
        path = _REPOSITORY_ROOT.joinpath(*binding.relative_path.split("/"))
        try:
            payload = path.read_bytes()
        except OSError as error:
            raise RuntimeError(
                f"boundary_remainders_bound_source_read_failed:{ordinal}"
            ) from error
        observed_sha256 = hashlib.sha256(payload).hexdigest()
        if (
            len(payload) != binding.size_bytes
            or observed_sha256 != binding.sha256
        ):
            raise RuntimeError(
                "boundary_remainders_bound_source_pin_mismatch:"
                f"{ordinal}:{observed_sha256}/{len(payload)}"
            )


_assert_bound_source_bytes()


@dataclass(frozen=True, slots=True)
class BoundaryAuthorityLocks:
    calculation_is_candidate_data: bool = False
    recurrence_proof_authority: bool = False
    remainder_proof_authority: bool = False
    candidate_execution_authority: bool = False
    branch_authority: bool = False
    replay_authority: bool = False
    pair_agreement_authority: bool = False
    diagnostic_pass: bool = False
    theory_graph_lamp: bool = False
    theory_graph_authority: bool = False
    certificate_authority: bool = False
    physical_viability: bool = False
    propulsion: bool = False
    transport: bool = False


BOUNDARY_AUTHORITY_LOCKS: Final[BoundaryAuthorityLocks] = (
    BoundaryAuthorityLocks()
)


class FormalRecurrenceInputError(ValueError):
    """A synthetic exact-rational recurrence input violates the frozen gates."""


class FormalRecurrenceInvariantError(RuntimeError):
    """An exact finite row, diagonal, chronology, or cancellation drifted."""


ORIGIN_PRODUCTION_BLOCKERS: Final[tuple[str, ...]] = (
    "head_majorant_configuration_absent",
    "authenticated_candidate_interface_jets_absent",
    "interval_runtime_binding_absent",
    "interval_source_binding_absent",
    "interval_executable_binding_absent",
    "proof_issuer_binding_absent",
)
TAIL_PRODUCTION_BLOCKERS: Final[tuple[str, ...]] = (
    "tail_majorant_configuration_absent",
    "authenticated_candidate_interface_jets_absent",
    "interval_runtime_binding_absent",
    "interval_source_binding_absent",
    "interval_executable_binding_absent",
    "proof_issuer_binding_absent",
)


class BoundaryRemainderProofBlocked(RuntimeError):
    """Typed production blocker that carries no proof or candidate authority."""

    __slots__ = ("proof_kind", "blockers", "authority_locks")

    def __init__(self, proof_kind: str, blockers: tuple[str, ...]) -> None:
        RuntimeError.__init__(
            self,
            f"radial_boundary_remainder_proof_blocked:{proof_kind}",
        )
        self.proof_kind = proof_kind
        self.blockers = blockers
        self.authority_locks = BOUNDARY_AUTHORITY_LOCKS


def prove_origin_x14(*_positional: object, **_keyword: object) -> NoReturn:
    """Fail before inspecting caller values because production bindings are absent.

    This function cannot suppress work a caller already performed while
    expanding a ``**mapping``.  Once normal Python argument passing reaches the
    function body, neither positional nor keyword *values* are traversed.
    """

    raise BoundaryRemainderProofBlocked(
        "origin_x14",
        ORIGIN_PRODUCTION_BLOCKERS,
    )


def prove_tail_z9(*_positional: object, **_keyword: object) -> NoReturn:
    """Fail before inspecting caller values because production bindings are absent."""

    raise BoundaryRemainderProofBlocked(
        "tail_z9",
        TAIL_PRODUCTION_BLOCKERS,
    )


def _require_fraction(name: str, value: object) -> Fraction:
    if type(value) is not Fraction:
        raise FormalRecurrenceInputError(
            f"{name}_must_be_stdlib_Fraction_synthetic_surrogate"
        )
    if (
        value.numerator.bit_length() > MAXIMUM_INPUT_RATIONAL_BITS
        or value.denominator.bit_length() > MAXIMUM_INPUT_RATIONAL_BITS
    ):
        raise FormalRecurrenceInputError(f"{name}_rational_bit_limit")
    return value


def _series_zero(maximum_degree: int) -> list[Fraction]:
    return [Fraction(0) for _ in range(maximum_degree + 1)]


def _series_coefficient(
    series: Sequence[Fraction], degree: int
) -> Fraction:
    if degree < 0 or degree >= len(series):
        return Fraction(0)
    return series[degree]


def _series_add(
    left: Sequence[Fraction],
    right: Sequence[Fraction],
    maximum_degree: int,
) -> list[Fraction]:
    return [
        _series_coefficient(left, degree)
        + _series_coefficient(right, degree)
        for degree in range(maximum_degree + 1)
    ]


def _series_scale(
    series: Sequence[Fraction],
    scalar: Fraction,
    maximum_degree: int,
) -> list[Fraction]:
    return [
        scalar * _series_coefficient(series, degree)
        for degree in range(maximum_degree + 1)
    ]


def _series_multiply(
    left: Sequence[Fraction],
    right: Sequence[Fraction],
    maximum_degree: int,
) -> list[Fraction]:
    output = _series_zero(maximum_degree)
    for degree in range(maximum_degree + 1):
        output[degree] = sum(
            (
                _series_coefficient(left, left_degree)
                * _series_coefficient(right, degree - left_degree)
                for left_degree in range(degree + 1)
            ),
            Fraction(0),
        )
    return output


def _series_derivative(
    series: Sequence[Fraction], maximum_degree: int
) -> list[Fraction]:
    return [
        Fraction(degree + 1)
        * _series_coefficient(series, degree + 1)
        for degree in range(maximum_degree + 1)
    ]


def _series_second_derivative(
    series: Sequence[Fraction], maximum_degree: int
) -> list[Fraction]:
    return [
        Fraction((degree + 2) * (degree + 1))
        * _series_coefficient(series, degree + 2)
        for degree in range(maximum_degree + 1)
    ]


def _series_derivative_over_x(
    series: Sequence[Fraction], maximum_degree: int
) -> list[Fraction]:
    if _series_coefficient(series, 1) != 0:
        raise FormalRecurrenceInvariantError(
            "origin_odd_linear_coefficient_would_make_derivative_over_x_singular"
        )
    return [
        Fraction(degree + 2)
        * _series_coefficient(series, degree + 2)
        for degree in range(maximum_degree + 1)
    ]


def _series_exp_zero_constant(
    exponent: Sequence[Fraction], maximum_degree: int
) -> list[Fraction]:
    if _series_coefficient(exponent, 0) != 0:
        raise FormalRecurrenceInvariantError(
            "formal_exponential_requires_zero_constant"
        )
    output = _series_zero(maximum_degree)
    output[0] = Fraction(1)
    for degree in range(1, maximum_degree + 1):
        output[degree] = sum(
            (
                Fraction(source_degree)
                * _series_coefficient(exponent, source_degree)
                * output[degree - source_degree]
                for source_degree in range(1, degree + 1)
            ),
            Fraction(0),
        ) / Fraction(degree)
    return output


def _determinant_three_by_three(
    matrix: tuple[tuple[Fraction, Fraction, Fraction], ...]
) -> Fraction:
    (a, b, c), (d, e, f), (g, h, i) = matrix
    return a * (e * i - f * h) - b * (d * i - f * g) + c * (
        d * h - e * g
    )


def _origin_frozen_rows(
    F0_delta: Sequence[Fraction],
    F1_delta: Sequence[Fraction],
    varphi: Sequence[Fraction],
    *,
    exp_2F1_origin: Fraction,
    redshifted_frequency_square_origin: Fraction,
    maximum_degree: int,
) -> tuple[list[Fraction], list[Fraction], list[Fraction]]:
    """Evaluate the literal, unscaled Et_t, Etheta_theta and KG rows."""

    inverse_exp_2F1_origin = Fraction(1) / exp_2F1_origin
    minus_2F1 = _series_scale(F1_delta, Fraction(-2), maximum_degree)
    minus_2F0 = _series_scale(F0_delta, Fraction(-2), maximum_degree)
    exp_minus_2F1 = _series_scale(
        _series_exp_zero_constant(minus_2F1, maximum_degree),
        inverse_exp_2F1_origin,
        maximum_degree,
    )
    frequency_exp_minus_2F0 = _series_scale(
        _series_exp_zero_constant(minus_2F0, maximum_degree),
        redshifted_frequency_square_origin,
        maximum_degree,
    )

    F0_prime = _series_derivative(F0_delta, maximum_degree)
    F1_prime = _series_derivative(F1_delta, maximum_degree)
    varphi_prime = _series_derivative(varphi, maximum_degree)
    F0_second = _series_second_derivative(F0_delta, maximum_degree)
    F1_second = _series_second_derivative(F1_delta, maximum_degree)
    varphi_second = _series_second_derivative(varphi, maximum_degree)
    F0_prime_over_x = _series_derivative_over_x(
        F0_delta, maximum_degree
    )
    F1_prime_over_x = _series_derivative_over_x(
        F1_delta, maximum_degree
    )
    varphi_prime_over_x = _series_derivative_over_x(
        varphi, maximum_degree
    )

    varphi_square = _series_multiply(
        varphi, varphi, maximum_degree
    )
    varphi_prime_square = _series_multiply(
        varphi_prime, varphi_prime, maximum_degree
    )

    Gt_inner = _series_add(
        _series_add(
            _series_scale(F1_second, Fraction(2), maximum_degree),
            _series_multiply(F1_prime, F1_prime, maximum_degree),
            maximum_degree,
        ),
        _series_scale(F1_prime_over_x, Fraction(4), maximum_degree),
        maximum_degree,
    )
    Et_t = _series_add(
        _series_add(
            _series_multiply(exp_minus_2F1, Gt_inner, maximum_degree),
            _series_multiply(
                frequency_exp_minus_2F0,
                varphi_square,
                maximum_degree,
            ),
            maximum_degree,
        ),
        _series_add(
            _series_multiply(
                exp_minus_2F1,
                varphi_prime_square,
                maximum_degree,
            ),
            list(varphi_square),
            maximum_degree,
        ),
        maximum_degree,
    )

    Gtheta_inner = _series_add(
        _series_add(
            _series_add(
                _series_multiply(F0_prime, F0_prime, maximum_degree),
                F0_second,
                maximum_degree,
            ),
            F1_second,
            maximum_degree,
        ),
        _series_add(
            F0_prime_over_x,
            F1_prime_over_x,
            maximum_degree,
        ),
        maximum_degree,
    )
    Etheta_theta = _series_add(
        _series_add(
            _series_multiply(
                exp_minus_2F1, Gtheta_inner, maximum_degree
            ),
            _series_scale(
                _series_multiply(
                    frequency_exp_minus_2F0,
                    varphi_square,
                    maximum_degree,
                ),
                Fraction(-1),
                maximum_degree,
            ),
            maximum_degree,
        ),
        _series_add(
            _series_multiply(
                exp_minus_2F1,
                varphi_prime_square,
                maximum_degree,
            ),
            list(varphi_square),
            maximum_degree,
        ),
        maximum_degree,
    )

    radial_box = _series_add(
        _series_add(
            varphi_second,
            _series_multiply(
                _series_add(F0_prime, F1_prime, maximum_degree),
                varphi_prime,
                maximum_degree,
            ),
            maximum_degree,
        ),
        _series_scale(varphi_prime_over_x, Fraction(2), maximum_degree),
        maximum_degree,
    )
    KGbar = _series_add(
        _series_add(
            _series_multiply(
                exp_minus_2F1, radial_box, maximum_degree
            ),
            _series_multiply(
                frequency_exp_minus_2F0,
                varphi,
                maximum_degree,
            ),
            maximum_degree,
        ),
        _series_scale(varphi, Fraction(-1), maximum_degree),
        maximum_degree,
    )
    return Et_t, Etheta_theta, KGbar


@dataclass(frozen=True, slots=True)
class OriginCoefficientStep:
    row_degree: int
    coefficient_power: int
    row_order: tuple[str, ...]
    unknown_order: tuple[str, ...]
    coefficient_matrix: tuple[tuple[Fraction, Fraction, Fraction], ...]
    determinant: Fraction
    determinant_formula_value: Fraction
    elimination_order: tuple[str, ...]
    row_remainder_before_new_coefficients: tuple[Fraction, Fraction, Fraction]
    coefficients_degree_major: tuple[
        tuple[str, Fraction], tuple[str, Fraction], tuple[str, Fraction]
    ]
    row_coefficient_after_elimination: tuple[Fraction, Fraction, Fraction]


@dataclass(frozen=True, slots=True)
class OriginFormalRecurrence:
    number_domain: str
    amplitude: Fraction
    synthetic_exp_2F1_origin_surrogate: Fraction
    synthetic_redshifted_frequency_square_origin_surrogate: Fraction
    coefficient_serialization_order: str
    steps: tuple[OriginCoefficientStep, ...]
    F0_minus_F0_origin_even_coefficients: tuple[tuple[int, Fraction], ...]
    F1_minus_F1_origin_even_coefficients: tuple[tuple[int, Fraction], ...]
    varphi_even_coefficients: tuple[tuple[int, Fraction], ...]
    cancelled_row_degrees: tuple[int, ...]
    recurrence_calculation_complete_through_x12: bool = True
    authenticated_candidate_interface_jets_used: bool = False
    transcendental_candidate_identity_claimed: bool = False
    remainder_majorant_present: bool = False
    proof_authority: bool = False
    candidate_executed: bool = False
    branch_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False


def _origin_x2_formulas(
    H: Fraction, E: Fraction
) -> tuple[Fraction, Fraction, Fraction]:
    P = FROZEN_ORIGIN_AMPLITUDE
    a2 = P * P * H * (2 * E - 1) / 6
    b2 = -(P * P * H * (E + 1)) / 12
    p2 = P * H * (1 - E) / 6
    return a2, b2, p2


def _origin_x4_formulas(
    H: Fraction, E: Fraction
) -> tuple[Fraction, Fraction, Fraction]:
    P = FROZEN_ORIGIN_AMPLITUDE
    a4 = (
        -P
        * P
        * H
        * H
        * (2 * E - 1)
        * ((3 * P * P + 1) * E - 1)
        / 60
    )
    b4 = (
        P
        * P
        * H
        * H
        * (
            P * P * (29 * E * E - 2 * E + 5)
            + 8 * E * E
            + 8 * E
            - 16
        )
        / 1_440
    )
    p4 = (
        P
        * H
        * H
        * (P * P * (6 * E * E - 4 * E) + (1 - E) * (1 - E))
        / 120
    )
    return a4, b4, p4


def _derive_origin_formal_recurrence(
    *,
    synthetic_exp_2F1_origin_surrogate: Fraction,
    synthetic_redshifted_frequency_square_origin_surrogate: Fraction,
) -> OriginFormalRecurrence:
    H = _require_fraction(
        "synthetic_exp_2F1_origin_surrogate",
        synthetic_exp_2F1_origin_surrogate,
    )
    E = _require_fraction(
        "synthetic_redshifted_frequency_square_origin_surrogate",
        synthetic_redshifted_frequency_square_origin_surrogate,
    )
    if H <= 0:
        raise FormalRecurrenceInputError(
            "synthetic_exp_2F1_origin_surrogate_must_be_positive"
        )
    if E <= 0:
        raise FormalRecurrenceInputError(
            "synthetic_redshifted_frequency_square_origin_surrogate_must_be_positive"
        )

    maximum_series_degree = ORIGIN_MAXIMUM_POWER
    F0_delta = _series_zero(maximum_series_degree)
    F1_delta = _series_zero(maximum_series_degree)
    varphi = _series_zero(maximum_series_degree)
    varphi[0] = FROZEN_ORIGIN_AMPLITUDE
    U0 = Fraction(1) / H
    steps: list[OriginCoefficientStep] = []

    for row_degree in range(0, ORIGIN_MAXIMUM_POWER, 2):
        coefficient_power = row_degree + 2
        rows_before = _origin_frozen_rows(
            F0_delta,
            F1_delta,
            varphi,
            exp_2F1_origin=H,
            redshifted_frequency_square_origin=E,
            maximum_degree=row_degree,
        )
        remainders = tuple(row[row_degree] for row in rows_before)
        k = Fraction(coefficient_power)
        matrix = (
            (Fraction(0), U0 * 2 * k * (k + 1), Fraction(0)),
            (U0 * k * k, U0 * k * k, Fraction(0)),
            (Fraction(0), Fraction(0), U0 * k * (k + 1)),
        )
        determinant = _determinant_three_by_three(matrix)
        determinant_formula = -2 * U0**3 * k**4 * (k + 1) ** 2
        if determinant == 0 or determinant != determinant_formula:
            raise FormalRecurrenceInvariantError(
                f"origin_coefficient_matrix_determinant_drift:{coefficient_power}"
            )

        b_coefficient = -remainders[0] / matrix[0][1]
        a_coefficient = -(
            remainders[1] + matrix[1][1] * b_coefficient
        ) / matrix[1][0]
        p_coefficient = -remainders[2] / matrix[2][2]
        F0_delta[coefficient_power] = a_coefficient
        F1_delta[coefficient_power] = b_coefficient
        varphi[coefficient_power] = p_coefficient

        rows_after = _origin_frozen_rows(
            F0_delta,
            F1_delta,
            varphi,
            exp_2F1_origin=H,
            redshifted_frequency_square_origin=E,
            maximum_degree=row_degree,
        )
        after = tuple(row[row_degree] for row in rows_after)
        if after != (Fraction(0), Fraction(0), Fraction(0)):
            raise FormalRecurrenceInvariantError(
                f"origin_row_elimination_failed:{row_degree}"
            )
        steps.append(
            OriginCoefficientStep(
                row_degree=row_degree,
                coefficient_power=coefficient_power,
                row_order=ORIGIN_ROW_ORDER,
                unknown_order=ORIGIN_UNKNOWN_ORDER,
                coefficient_matrix=matrix,
                determinant=determinant,
                determinant_formula_value=determinant_formula,
                elimination_order=ORIGIN_ELIMINATION_ORDER,
                row_remainder_before_new_coefficients=remainders,
                coefficients_degree_major=(
                    ("F0", a_coefficient),
                    ("F1", b_coefficient),
                    ("varphi", p_coefficient),
                ),
                row_coefficient_after_elimination=after,
            )
        )

    if tuple(value for _, value in steps[0].coefficients_degree_major) != (
        _origin_x2_formulas(H, E)
    ):
        raise FormalRecurrenceInvariantError("origin_x2_formula_drift")
    if tuple(value for _, value in steps[1].coefficients_degree_major) != (
        _origin_x4_formulas(H, E)
    ):
        raise FormalRecurrenceInvariantError("origin_x4_formula_drift")

    degrees = tuple(range(0, ORIGIN_MAXIMUM_POWER + 1, 2))
    return OriginFormalRecurrence(
        number_domain=SYNTHETIC_NUMBER_DOMAIN,
        amplitude=FROZEN_ORIGIN_AMPLITUDE,
        synthetic_exp_2F1_origin_surrogate=H,
        synthetic_redshifted_frequency_square_origin_surrogate=E,
        coefficient_serialization_order=(
            "degree_major_x0_x2_x4_x6_x8_x10_x12;"
            "within_degree_F0_then_F1_then_varphi"
        ),
        steps=tuple(steps),
        F0_minus_F0_origin_even_coefficients=tuple(
            (degree, F0_delta[degree]) for degree in degrees
        ),
        F1_minus_F1_origin_even_coefficients=tuple(
            (degree, F1_delta[degree]) for degree in degrees
        ),
        varphi_even_coefficients=tuple(
            (degree, varphi[degree]) for degree in degrees
        ),
        cancelled_row_degrees=tuple(range(0, ORIGIN_MAXIMUM_POWER, 2)),
    )


def origin_envelope_g0(z: Fraction) -> Fraction:
    value = _require_fraction("origin_normalized_radius_z", z)
    if not Fraction(0) <= value <= ORIGIN_NORMALIZED_EDGE:
        raise FormalRecurrenceInputError("origin_normalized_radius_out_of_domain")
    return value**14 / (1 - value * value)


def origin_envelope_g1(z: Fraction) -> Fraction:
    value = _require_fraction("origin_normalized_radius_z", z)
    if not Fraction(0) <= value <= ORIGIN_NORMALIZED_EDGE:
        raise FormalRecurrenceInputError("origin_normalized_radius_out_of_domain")
    denominator = 1 - value * value
    return value**13 * (14 - 12 * value * value) / denominator**2


def origin_envelope_g2(z: Fraction) -> Fraction:
    value = _require_fraction("origin_normalized_radius_z", z)
    if not Fraction(0) <= value <= ORIGIN_NORMALIZED_EDGE:
        raise FormalRecurrenceInputError("origin_normalized_radius_out_of_domain")
    denominator = 1 - value * value
    return (
        value**12
        * (182 - 306 * value * value + 132 * value**4)
        / denominator**3
    )


def origin_x14_envelope_bounds(
    *, coefficient_majorant: Fraction, analytic_radius: Fraction, x: Fraction
) -> tuple[Fraction, Fraction, Fraction]:
    majorant = _require_fraction("origin_coefficient_majorant", coefficient_majorant)
    radius = _require_fraction("origin_analytic_radius", analytic_radius)
    point = _require_fraction("origin_physical_radius_x", x)
    if majorant < 0:
        raise FormalRecurrenceInputError(
            "origin_coefficient_majorant_must_be_nonnegative"
        )
    if radius < ORIGIN_ANALYTIC_RADIUS_MINIMUM:
        raise FormalRecurrenceInputError("origin_analytic_radius_below_minimum")
    if not Fraction(0) <= point <= ORIGIN_EVALUATION_EDGE:
        raise FormalRecurrenceInputError("origin_physical_radius_out_of_domain")
    z = point / radius
    if z > ORIGIN_NORMALIZED_EDGE:
        raise FormalRecurrenceInputError("origin_normalized_radius_out_of_domain")
    return (
        majorant * origin_envelope_g0(z),
        majorant * origin_envelope_g1(z) / radius,
        majorant * origin_envelope_g2(z) / (radius * radius),
    )


def tail_envelope_h0(z: Fraction) -> Fraction:
    value = _require_fraction("tail_normalized_inverse_radius_z", z)
    if not Fraction(0) <= value <= TAIL_NORMALIZED_EDGE:
        raise FormalRecurrenceInputError("tail_normalized_radius_out_of_domain")
    return value**9 / (1 - value)


def tail_envelope_h1(z: Fraction) -> Fraction:
    value = _require_fraction("tail_normalized_inverse_radius_z", z)
    if not Fraction(0) <= value <= TAIL_NORMALIZED_EDGE:
        raise FormalRecurrenceInputError("tail_normalized_radius_out_of_domain")
    return value**8 * (9 - 8 * value) / (1 - value) ** 2


def tail_envelope_h2(z: Fraction) -> Fraction:
    value = _require_fraction("tail_normalized_inverse_radius_z", z)
    if not Fraction(0) <= value <= TAIL_NORMALIZED_EDGE:
        raise FormalRecurrenceInputError("tail_normalized_radius_out_of_domain")
    return value**7 * (72 - 126 * value + 56 * value * value) / (
        1 - value
    ) ** 3


def tail_metric_z9_physical_x_bounds(
    *, coefficient_majorant: Fraction, kappa: Fraction, z: Fraction
) -> tuple[Fraction, Fraction, Fraction]:
    majorant = _require_fraction("tail_coefficient_majorant", coefficient_majorant)
    decay = _require_fraction("synthetic_tail_kappa_surrogate", kappa)
    point = _require_fraction("tail_normalized_inverse_radius_z", z)
    if majorant < 0:
        raise FormalRecurrenceInputError(
            "tail_coefficient_majorant_must_be_nonnegative"
        )
    if decay <= 0:
        raise FormalRecurrenceInputError("tail_kappa_must_be_positive")
    h0 = tail_envelope_h0(point)
    h1 = tail_envelope_h1(point)
    h2 = tail_envelope_h2(point)
    return (
        majorant * h0,
        majorant * decay * point * point * h1,
        majorant
        * decay
        * decay
        * (point**4 * h2 + 2 * point**3 * h1),
    )


def _l_sigma_series(
    coefficients: Sequence[Fraction],
    sigma: Fraction,
    maximum_degree: int,
) -> list[Fraction]:
    output = _series_zero(maximum_degree)
    for degree in range(maximum_degree + 1):
        output[degree] = -_series_coefficient(coefficients, degree)
        if degree > 0:
            output[degree] += (
                sigma - Fraction(degree - 1)
            ) * _series_coefficient(coefficients, degree - 1)
    return output


@dataclass(frozen=True, slots=True)
class FullScalarPrefactorOperators:
    sigma: Fraction
    scalar_correction: tuple[Fraction, ...]
    L_sigma: tuple[Fraction, ...]
    L_sigma_squared: tuple[Fraction, ...]
    first_physical_x_factor: str = "kappa*L_sigma"
    second_physical_x_factor: str = "kappa^2*L_sigma^2"
    includes_complete_exponential_and_power_prefactor: bool = True
    normalized_correction_only_derivative_authority: bool = False
    proof_authority: bool = False


def full_scalar_prefactor_operator_coefficients(
    scalar_correction: tuple[Fraction, ...], *, sigma: Fraction
) -> FullScalarPrefactorOperators:
    if type(scalar_correction) is not tuple or not scalar_correction:
        raise FormalRecurrenceInputError(
            "scalar_correction_must_be_nonempty_exact_tuple"
        )
    if len(scalar_correction) > TAIL_SCRATCH_ORDER + 1:
        raise FormalRecurrenceInputError("scalar_correction_length_limit")
    checked = tuple(
        _require_fraction(f"scalar_correction_{index}", value)
        for index, value in enumerate(scalar_correction)
    )
    exponent = _require_fraction("synthetic_scalar_power_sigma_surrogate", sigma)
    maximum_first_degree = len(checked)
    first = _l_sigma_series(checked, exponent, maximum_first_degree)
    second = _l_sigma_series(first, exponent, maximum_first_degree + 1)
    return FullScalarPrefactorOperators(
        sigma=exponent,
        scalar_correction=checked,
        L_sigma=tuple(first),
        L_sigma_squared=tuple(second),
    )


def _tail_kg_coefficients(
    A: Sequence[Fraction],
    B: Sequence[Fraction],
    S: Sequence[Fraction],
    *,
    w_square: Fraction,
    kappa_square: Fraction,
    sigma: Fraction,
    maximum_degree: int,
) -> list[Fraction]:
    minus_2A = _series_scale(A, Fraction(-2), maximum_degree)
    minus_2B = _series_scale(B, Fraction(-2), maximum_degree)
    exp_minus_2A = _series_exp_zero_constant(minus_2A, maximum_degree)
    exp_minus_2B = _series_exp_zero_constant(minus_2B, maximum_degree)
    L = _l_sigma_series(S, sigma, maximum_degree)
    L2 = _l_sigma_series(L, sigma, maximum_degree)

    radial_factor = _series_zero(maximum_degree)
    if maximum_degree >= 1:
        radial_factor[1] = Fraction(2)
    for degree in range(2, maximum_degree + 1):
        radial_factor[degree] = -Fraction(degree - 1) * (
            _series_coefficient(A, degree - 1)
            + _series_coefficient(B, degree - 1)
        )
    inner = _series_add(
        L2,
        _series_multiply(radial_factor, L, maximum_degree),
        maximum_degree,
    )
    first_term = _series_scale(
        _series_multiply(exp_minus_2B, inner, maximum_degree),
        kappa_square,
        maximum_degree,
    )
    potential = _series_scale(
        exp_minus_2A, w_square, maximum_degree
    )
    potential[0] -= 1
    second_term = _series_multiply(potential, S, maximum_degree)
    return _series_add(first_term, second_term, maximum_degree)


@dataclass(frozen=True, slots=True)
class TailMetricStep:
    n: int
    row_order: tuple[str, ...]
    unknown_order: tuple[str, ...]
    coefficient_matrix: tuple[tuple[Fraction, Fraction], ...]
    determinant: Fraction
    determinant_formula_value: Fraction
    row_remainder_before_new_coefficients: tuple[Fraction, Fraction]
    A_n: Fraction
    B_n: Fraction
    closed_form_A_n: Fraction
    closed_form_B_n: Fraction
    emitted: bool
    internal_scratch: bool


@dataclass(frozen=True, slots=True)
class TailScalarStep:
    n: int
    extracted_kg_degree: int
    diagonal: Fraction
    exact_required_diagonal: Fraction
    row_remainder_with_C_n_zero: Fraction
    C_n: Fraction
    metric_available_through: int
    A_n_plus_1_and_B_n_plus_1_available_before_solve: bool
    scratch_A9_B9_bound_before_C8: bool
    row_coefficient_after_elimination: Fraction


@dataclass(frozen=True, slots=True)
class TailFormalRecurrence:
    number_domain: str
    synthetic_w_surrogate: Fraction
    synthetic_kappa_surrogate: Fraction
    synthetic_adm_mass_surrogate: Fraction
    synthetic_outer_amplitude_surrogate: Fraction
    q: Fraction
    sigma: Fraction
    C0: Fraction
    chronology: tuple[str, ...]
    emitted_metric_steps: tuple[TailMetricStep, ...]
    scratch_metric_step: TailMetricStep
    scalar_steps: tuple[TailScalarStep, ...]
    A_coefficients_through_scratch: tuple[tuple[int, Fraction], ...]
    B_coefficients_through_scratch: tuple[tuple[int, Fraction], ...]
    C_coefficients_through_emitted_order: tuple[tuple[int, Fraction], ...]
    kg_compatibility_z0: Fraction
    kg_compatibility_z1: Fraction
    cancelled_kg_degrees: tuple[int, ...]
    recurrence_calculation_complete: bool = True
    A9_B9_non_emitted: bool = True
    authenticated_candidate_interface_jets_used: bool = False
    transcendental_candidate_identity_claimed: bool = False
    remainder_majorant_present: bool = False
    denominator_separation_receipt_present: bool = False
    proof_authority: bool = False
    candidate_executed: bool = False
    branch_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False


def _tail_metric_step(
    n: int,
    A: list[Fraction],
    B: list[Fraction],
    q: Fraction,
    *,
    emitted: bool,
    internal_scratch: bool,
) -> TailMetricStep:
    n_fraction = Fraction(n)
    B_remainder = sum(
        (
            Fraction(index * (n - index))
            * B[index]
            * B[n - index]
            for index in range(1, n)
        ),
        Fraction(0),
    )
    A_remainder = sum(
        (
            Fraction(index * (n - index))
            * A[index]
            * A[n - index]
            for index in range(1, n)
        ),
        Fraction(0),
    )
    matrix = (
        (2 * n_fraction * (n_fraction - 1), Fraction(0)),
        (n_fraction * n_fraction, n_fraction * n_fraction),
    )
    determinant = matrix[0][0] * matrix[1][1]
    determinant_formula = 2 * n_fraction**3 * (n_fraction - 1)
    if determinant == 0 or determinant != determinant_formula:
        raise FormalRecurrenceInvariantError(
            f"tail_metric_determinant_drift:{n}"
        )
    B_n = -B_remainder / matrix[0][0]
    A_n = -(A_remainder + matrix[1][0] * B_n) / matrix[1][1]
    A[n] = A_n
    B[n] = B_n
    closed_A = -2 * q**n / n_fraction if n % 2 == 1 else Fraction(0)
    closed_B = 2 * Fraction((-1) ** (n + 1)) * q**n / n_fraction
    if A_n != closed_A or B_n != closed_B:
        raise FormalRecurrenceInvariantError(
            f"tail_metric_closed_form_drift:{n}"
        )
    return TailMetricStep(
        n=n,
        row_order=TAIL_METRIC_ROW_ORDER,
        unknown_order=TAIL_METRIC_UNKNOWN_ORDER,
        coefficient_matrix=matrix,
        determinant=determinant,
        determinant_formula_value=determinant_formula,
        row_remainder_before_new_coefficients=(B_remainder, A_remainder),
        A_n=A_n,
        B_n=B_n,
        closed_form_A_n=closed_A,
        closed_form_B_n=closed_B,
        emitted=emitted,
        internal_scratch=internal_scratch,
    )


def _derive_tail_formal_recurrence(
    *,
    synthetic_w_surrogate: Fraction,
    synthetic_kappa_surrogate: Fraction,
    synthetic_adm_mass_surrogate: Fraction,
    synthetic_outer_amplitude_surrogate: Fraction,
) -> TailFormalRecurrence:
    w = _require_fraction("synthetic_w_surrogate", synthetic_w_surrogate)
    kappa = _require_fraction(
        "synthetic_kappa_surrogate", synthetic_kappa_surrogate
    )
    mass = _require_fraction(
        "synthetic_adm_mass_surrogate", synthetic_adm_mass_surrogate
    )
    outer_amplitude = _require_fraction(
        "synthetic_outer_amplitude_surrogate",
        synthetic_outer_amplitude_surrogate,
    )
    if not Fraction(0) < w < Fraction(1):
        raise FormalRecurrenceInputError("tail_w_must_satisfy_0_lt_w_lt_1")
    if not Fraction(0) < kappa < Fraction(1):
        raise FormalRecurrenceInputError(
            "tail_kappa_must_satisfy_0_lt_kappa_lt_1"
        )
    if w * w + kappa * kappa != 1:
        raise FormalRecurrenceInputError(
            "tail_kappa_compatibility_must_be_exact"
        )
    if mass <= 0:
        raise FormalRecurrenceInputError("tail_adm_mass_must_be_positive")
    if outer_amplitude <= 0:
        raise FormalRecurrenceInputError(
            "tail_outer_amplitude_C_must_be_positive"
        )
    q = mass * kappa / 2
    if not Fraction(0) < q < Fraction(64):
        raise FormalRecurrenceInputError("tail_q_must_satisfy_0_lt_q_lt_64")

    w_square = w * w
    kappa_square = kappa * kappa
    sigma = mass * (2 * w_square - 1) / kappa - 1
    maximum_degree = TAIL_SCRATCH_ORDER
    A = _series_zero(maximum_degree)
    B = _series_zero(maximum_degree)
    S = _series_zero(maximum_degree)
    S[0] = Fraction(1)
    A[1] = -2 * q
    B[1] = 2 * q
    chronology: list[str] = ["mass_mode_A1_B1"]
    emitted_steps: list[TailMetricStep] = []
    for n in range(2, TAIL_EMITTED_MAXIMUM_ORDER + 1):
        emitted_steps.append(
            _tail_metric_step(
                n,
                A,
                B,
                q,
                emitted=True,
                internal_scratch=False,
            )
        )
        chronology.append(f"metric_diagonal_{n}")

    compatibility = _tail_kg_coefficients(
        A,
        B,
        S,
        w_square=w_square,
        kappa_square=kappa_square,
        sigma=sigma,
        maximum_degree=1,
    )
    if compatibility[0] != 0 or compatibility[1] != 0:
        raise FormalRecurrenceInvariantError(
            "tail_scalar_leading_compatibility_drift"
        )
    chronology.extend(("KG_z0_kappa_compatibility", "KG_z1_sigma_compatibility"))

    scalar_steps: list[TailScalarStep] = []

    def solve_scalar(n: int, metric_maximum: int, scratch_bound: bool) -> None:
        extracted_degree = n + 1
        S[n] = Fraction(0)
        row_zero = _tail_kg_coefficients(
            A,
            B,
            S,
            w_square=w_square,
            kappa_square=kappa_square,
            sigma=sigma,
            maximum_degree=extracted_degree,
        )[extracted_degree]
        S[n] = Fraction(1)
        row_one = _tail_kg_coefficients(
            A,
            B,
            S,
            w_square=w_square,
            kappa_square=kappa_square,
            sigma=sigma,
            maximum_degree=extracted_degree,
        )[extracted_degree]
        diagonal = row_one - row_zero
        required_diagonal = 2 * kappa_square * n
        if diagonal == 0 or diagonal != required_diagonal:
            raise FormalRecurrenceInvariantError(
                f"tail_scalar_diagonal_drift:{n}"
            )
        S[n] = -row_zero / diagonal
        row_after = _tail_kg_coefficients(
            A,
            B,
            S,
            w_square=w_square,
            kappa_square=kappa_square,
            sigma=sigma,
            maximum_degree=extracted_degree,
        )[extracted_degree]
        if row_after != 0:
            raise FormalRecurrenceInvariantError(
                f"tail_scalar_elimination_failed:{n}"
            )
        scalar_steps.append(
            TailScalarStep(
                n=n,
                extracted_kg_degree=extracted_degree,
                diagonal=diagonal,
                exact_required_diagonal=required_diagonal,
                row_remainder_with_C_n_zero=row_zero,
                C_n=S[n],
                metric_available_through=metric_maximum,
                A_n_plus_1_and_B_n_plus_1_available_before_solve=(
                    metric_maximum >= n + 1
                ),
                scratch_A9_B9_bound_before_C8=scratch_bound,
                row_coefficient_after_elimination=row_after,
            )
        )
        chronology.append(f"scalar_diagonal_C{n}_from_z{extracted_degree}")

    for n in range(1, TAIL_EMITTED_MAXIMUM_ORDER):
        solve_scalar(n, TAIL_EMITTED_MAXIMUM_ORDER, False)

    scratch_step = _tail_metric_step(
        TAIL_SCRATCH_ORDER,
        A,
        B,
        q,
        emitted=False,
        internal_scratch=True,
    )
    chronology.append("metric_scratch_A9_B9_bound")
    solve_scalar(
        TAIL_EMITTED_MAXIMUM_ORDER,
        TAIL_SCRATCH_ORDER,
        True,
    )

    final_kg = _tail_kg_coefficients(
        A,
        B,
        S,
        w_square=w_square,
        kappa_square=kappa_square,
        sigma=sigma,
        maximum_degree=TAIL_SCRATCH_ORDER,
    )
    if any(value != 0 for value in final_kg):
        raise FormalRecurrenceInvariantError("tail_kg_cancellation_drift")

    return TailFormalRecurrence(
        number_domain=SYNTHETIC_NUMBER_DOMAIN,
        synthetic_w_surrogate=w,
        synthetic_kappa_surrogate=kappa,
        synthetic_adm_mass_surrogate=mass,
        synthetic_outer_amplitude_surrogate=outer_amplitude,
        q=q,
        sigma=sigma,
        C0=Fraction(1),
        chronology=tuple(chronology),
        emitted_metric_steps=tuple(emitted_steps),
        scratch_metric_step=scratch_step,
        scalar_steps=tuple(scalar_steps),
        A_coefficients_through_scratch=tuple(
            (n, A[n]) for n in range(1, TAIL_SCRATCH_ORDER + 1)
        ),
        B_coefficients_through_scratch=tuple(
            (n, B[n]) for n in range(1, TAIL_SCRATCH_ORDER + 1)
        ),
        C_coefficients_through_emitted_order=tuple(
            (n, S[n]) for n in range(TAIL_EMITTED_MAXIMUM_ORDER + 1)
        ),
        kg_compatibility_z0=compatibility[0],
        kg_compatibility_z1=compatibility[1],
        cancelled_kg_degrees=tuple(range(TAIL_SCRATCH_ORDER + 1)),
    )


@dataclass(frozen=True, slots=True)
class ExactSyntheticRadiiCheck:
    label: str
    Y: Fraction
    Z: Fraction
    radius: Fraction
    Y_plus_Z_radius: Fraction
    contraction_strictly_below_one: bool
    maps_ball_into_itself: bool
    synthetic_algebra_only: bool = True
    certified_majorant: bool = False
    proof_authority: bool = False


@dataclass(frozen=True, slots=True)
class SyntheticBoundaryRemainderReceipt:
    number_domain: str
    origin: OriginFormalRecurrence
    tail: TailFormalRecurrence
    origin_edge_envelopes: tuple[Fraction, Fraction, Fraction]
    tail_edge_envelopes: tuple[Fraction, Fraction, Fraction]
    exact_radii_checks: tuple[ExactSyntheticRadiiCheck, ...]
    all_exact_algebra_checks_passed: bool
    private_synthetic_test_seam: bool = True
    accepts_caller_majorants_as_authority: bool = False
    authenticated_candidate_interface_jets_used: bool = False
    interval_runtime_bound: bool = False
    proof_issuer_bound: bool = False
    recurrence_proof_authority: bool = False
    remainder_proof_authority: bool = False
    candidate_executed: bool = False
    diagnostic_pass: bool = False
    theory_graph_lamp: bool = False
    physical_viability: bool = False
    propulsion: bool = False
    transport: bool = False


def _synthetic_radii_check(
    label: str, Y: Fraction, Z: Fraction, radius: Fraction
) -> ExactSyntheticRadiiCheck:
    left = Y + Z * radius
    return ExactSyntheticRadiiCheck(
        label=label,
        Y=Y,
        Z=Z,
        radius=radius,
        Y_plus_Z_radius=left,
        contraction_strictly_below_one=Z < 1,
        maps_ball_into_itself=left <= radius,
    )


_SYNTHETIC_TEST_MARKER: Final[object] = object()


def _synthetic_boundary_remainder_seam(
    marker: object,
    *,
    synthetic_exp_2F1_origin_surrogate: Fraction,
    synthetic_redshifted_frequency_square_origin_surrogate: Fraction,
    synthetic_w_surrogate: Fraction,
    synthetic_kappa_surrogate: Fraction,
    synthetic_adm_mass_surrogate: Fraction,
    synthetic_outer_amplitude_surrogate: Fraction,
) -> SyntheticBoundaryRemainderReceipt:
    if marker is not _SYNTHETIC_TEST_MARKER:
        raise PermissionError("boundary_remainders_private_synthetic_marker_required")
    origin = _derive_origin_formal_recurrence(
        synthetic_exp_2F1_origin_surrogate=(
            synthetic_exp_2F1_origin_surrogate
        ),
        synthetic_redshifted_frequency_square_origin_surrogate=(
            synthetic_redshifted_frequency_square_origin_surrogate
        ),
    )
    tail = _derive_tail_formal_recurrence(
        synthetic_w_surrogate=synthetic_w_surrogate,
        synthetic_kappa_surrogate=synthetic_kappa_surrogate,
        synthetic_adm_mass_surrogate=synthetic_adm_mass_surrogate,
        synthetic_outer_amplitude_surrogate=(
            synthetic_outer_amplitude_surrogate
        ),
    )
    radii = (
        _synthetic_radii_check(
            "synthetic_origin_fixed_point_algebra",
            Fraction(1, 64),
            Fraction(1, 4),
            Fraction(1, 32),
        ),
        _synthetic_radii_check(
            "synthetic_tail_fixed_point_algebra",
            Fraction(1, 128),
            Fraction(1, 8),
            Fraction(1, 64),
        ),
    )
    all_passed = (
        all(
            step.row_coefficient_after_elimination
            == (Fraction(0), Fraction(0), Fraction(0))
            for step in origin.steps
        )
        and tail.kg_compatibility_z0 == 0
        and tail.kg_compatibility_z1 == 0
        and all(step.row_coefficient_after_elimination == 0 for step in tail.scalar_steps)
        and all(
            check.contraction_strictly_below_one
            and check.maps_ball_into_itself
            for check in radii
        )
    )
    return SyntheticBoundaryRemainderReceipt(
        number_domain=SYNTHETIC_NUMBER_DOMAIN,
        origin=origin,
        tail=tail,
        origin_edge_envelopes=(
            origin_envelope_g0(ORIGIN_NORMALIZED_EDGE),
            origin_envelope_g1(ORIGIN_NORMALIZED_EDGE),
            origin_envelope_g2(ORIGIN_NORMALIZED_EDGE),
        ),
        tail_edge_envelopes=(
            tail_envelope_h0(TAIL_NORMALIZED_EDGE),
            tail_envelope_h1(TAIL_NORMALIZED_EDGE),
            tail_envelope_h2(TAIL_NORMALIZED_EDGE),
        ),
        exact_radii_checks=radii,
        all_exact_algebra_checks_passed=all_passed,
    )


__all__ = [
    "BoundaryRemainderProofBlocked",
    "prove_origin_x14",
    "prove_tail_z9",
]
