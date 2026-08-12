"""Independently regenerated grids, spectral operators, and preliminary gates."""

from __future__ import annotations

import math
import struct
from dataclasses import dataclass
from typing import Final, Sequence

from .contract import LEVELS, NU0, RHO_TAIL, THRESHOLDS
from .errors import Blocker, block
from .mpfr_backend import MpfrBackend
from .secure_arrays import ArrayPayload

Matrix = tuple[tuple[float, ...], ...]


@dataclass(frozen=True, slots=True)
class LevelOperators:
    level_id: str
    rho: tuple[float, ...]
    theta: tuple[float, ...]
    theta_sine: tuple[float, ...]
    theta_cosine: tuple[float, ...]
    theta_cotangent: tuple[float | None, ...]
    radial_dct_cosine: Matrix
    radial_first: Matrix
    radial_second: Matrix
    angular_first: Matrix
    angular_second: Matrix


@dataclass(frozen=True, slots=True)
class ProductionLevelMetrics:
    level_id: str
    schrodinger_normalized_linf: float
    poisson_normalized_linf: float
    boundary_and_parity_linf: float
    radial_tail_relative: float
    angular_tail_relative: float
    passed: bool | None


@dataclass(frozen=True, slots=True)
class FieldConvergenceMetrics:
    d01: float
    d12: float
    difference_ratio: float
    diagnostic_within_rails: bool
    passed: bool | None


@dataclass(frozen=True, slots=True)
class DiscreteAuditMetrics:
    negative_or_negative_zero_count: int
    prescribed_positive_zero_count: int
    prescribed_positive_zero_violation_count: int
    eligible_nonboundary_count: int
    unresolved_eligible_positive_zero_count: int
    nonnegative_potential_interior_count: int
    interior_source_linf: float
    passed: bool | None


@dataclass(frozen=True, slots=True)
class PreliminaryGateReplay:
    production_levels: tuple[ProductionLevelMetrics, ...]
    field_convergence: FieldConvergenceMetrics | None
    audit_discrete: DiscreteAuditMetrics
    projected_zero_violation_count: int
    blockers: tuple[Blocker, ...]
    any_completed_gate_failed: bool
    complete_gate_report_available: bool = False


def _diagnostic_pass_state(within_numeric_rails: bool) -> bool | None:
    """A diagnostic may establish failure, but never authoritative success."""

    return None if within_numeric_rails else False


def barycentric_weights(count: int) -> tuple[float, ...]:
    if count < 2:
        block("operators", "at_least_two_nodes_required", str(count))
    return tuple(
        ((-1.0) ** index) * (0.5 if index in (0, count - 1) else 1.0)
        for index in range(count)
    )


def differentiation_matrix(nodes: Sequence[float]) -> Matrix:
    count = len(nodes)
    weights = barycentric_weights(count)
    rows: list[tuple[float, ...]] = []
    for row in range(count):
        values = [0.0] * count
        for column in range(count):
            if row == column:
                continue
            denominator = nodes[row] - nodes[column]
            if denominator == 0.0:
                block("operators", "duplicate_grid_node", f"{row}:{column}")
            values[column] = weights[column] / (weights[row] * denominator)
        values[row] = -math.fsum(values)
        rows.append(tuple(values))
    return tuple(rows)


def matrix_product(left: Matrix, right: Matrix) -> Matrix:
    size = len(left)
    if size == 0 or len(right) != size or any(len(row) != size for row in left + right):
        block("operators", "square_matrix_required", str(size))
    return tuple(
        tuple(
            math.fsum(left[row][inner] * right[inner][column] for inner in range(size))
            for column in range(size)
        )
        for row in range(size)
    )


def _same_f64_bits(left: float, right: float) -> bool:
    return struct.pack("<d", left) == struct.pack("<d", right)


def regenerate_level_operators(
    level_id: str,
    rho_values: Sequence[float],
    theta_values: Sequence[float],
    backend: MpfrBackend,
) -> LevelOperators:
    level = next((entry for entry in LEVELS if entry[0] == level_id), None)
    if level is None:
        block("operators", "unknown_level", level_id)
    _, nr, ntheta = level
    if len(rho_values) != nr or len(theta_values) != ntheta:
        block("operators", "grid_shape_mismatch", level_id)
    regenerated_rho = tuple(backend.mapped_node(index, nr, False) for index in range(nr))
    angular_trigonometry = tuple(
        backend.mapped_angular_node_trigonometry(index, ntheta)
        for index in range(ntheta)
    )
    regenerated_theta = tuple(item[0] for item in angular_trigonometry)
    for index, (observed, expected) in enumerate(zip(rho_values, regenerated_rho)):
        if not _same_f64_bits(observed, expected):
            block("operators", "rho_grid_bit_mismatch", f"{level_id}:{index}")
    for index, (observed, expected) in enumerate(zip(theta_values, regenerated_theta)):
        if not _same_f64_bits(observed, expected):
            block("operators", "theta_grid_bit_mismatch", f"{level_id}:{index}")
    radial_dct_cosine = tuple(
        tuple(
            backend.cosine_pi_rational(coefficient * radial, nr - 1)
            for radial in range(nr)
        )
        for coefficient in range(nr)
    )
    radial_first = differentiation_matrix(regenerated_rho)
    angular_first = differentiation_matrix(regenerated_theta)
    return LevelOperators(
        level_id=level_id,
        rho=regenerated_rho,
        theta=regenerated_theta,
        theta_sine=tuple(item[1] for item in angular_trigonometry),
        theta_cosine=tuple(item[2] for item in angular_trigonometry),
        theta_cotangent=tuple(item[3] for item in angular_trigonometry),
        radial_dct_cosine=radial_dct_cosine,
        radial_first=radial_first,
        radial_second=matrix_product(radial_first, radial_first),
        angular_first=angular_first,
        angular_second=matrix_product(angular_first, angular_first),
    )


@dataclass(frozen=True, slots=True)
class AngularComponents:
    value: float
    theta_first: float
    theta_second: float
    cotangent_theta_first: float
    laplacian: float


def _positive_zero(value: float) -> float:
    return 0.0 if value == 0.0 else value


def _legendre_value_derivatives(
    argument: float, maximum_ell: int
) -> tuple[tuple[float, ...], tuple[float, ...], tuple[float, ...]]:
    """Diagnostic P_l(z), dP_l/dz, and d2P_l/dz2 recurrence.

    This recurrence is not the missing frozen MPFR materialization graph and
    therefore cannot establish the required bitwise nodal identity.
    """

    if maximum_ell < 0 or not math.isfinite(argument):
        block("legendre", "finite_nonnegative_degree_required", repr(maximum_ell))
    values = [1.0]
    first = [0.0]
    second = [0.0]
    if maximum_ell == 0:
        return tuple(values), tuple(first), tuple(second)
    values.append(argument)
    first.append(1.0)
    second.append(0.0)
    for ell in range(2, maximum_ell + 1):
        scale = 2 * ell - 1
        values.append(
            (scale * argument * values[-1] - (ell - 1) * values[-2]) / ell
        )
        first.append(
            (scale * (values[-2] + argument * first[-1]) - (ell - 1) * first[-2])
            / ell
        )
        second.append(
            (
                scale * (2.0 * first[-2] + argument * second[-1])
                - (ell - 1) * second[-2]
            )
            / ell
        )
    return tuple(values), tuple(first), tuple(second)


def _parity_legendre_angular_components(
    coefficients: Sequence[float],
    odd: bool,
    cosine: float,
    sine: float,
    cotangent: float | None,
    *,
    axis: bool,
    equator: bool,
) -> AngularComponents:
    """Evaluate analytic angular terms without theta-Chebyshev derivatives.

    Endpoint values use the regular Legendre limits.  The arithmetic order is
    deliberately diagnostic: seed v1 does not freeze the MPFR scalar operation
    graph needed to turn these values into authoritative binary64 samples.
    """

    if not coefficients:
        block("legendre", "at_least_one_parity_mode_required", "empty")
    if axis and equator:
        block("legendre", "axis_and_equator_are_disjoint", "both_selected")
    maximum_ell = 2 * (len(coefficients) - 1) + (1 if odd else 0)
    values, first, second = _legendre_value_derivatives(cosine, maximum_ell)
    degrees = tuple(2 * mode + (1 if odd else 0) for mode in range(len(coefficients)))
    value = math.fsum(
        coefficient * values[ell]
        for coefficient, ell in zip(coefficients, degrees)
    )
    laplacian = math.fsum(
        -ell * (ell + 1) * coefficient * values[ell]
        for coefficient, ell in zip(coefficients, degrees)
    )
    if axis:
        theta_first = 0.0
        theta_second = 0.5 * laplacian
        cotangent_theta_first = 0.5 * laplacian
    elif equator:
        theta_first = math.fsum(
            -coefficient * first[ell]
            for coefficient, ell in zip(coefficients, degrees)
        )
        theta_second = laplacian
        cotangent_theta_first = 0.0
    else:
        if cotangent is None:
            block("legendre", "interior_cotangent_required", repr(cosine))
        theta_first = math.fsum(
            -sine * coefficient * first[ell]
            for coefficient, ell in zip(coefficients, degrees)
        )
        theta_second = math.fsum(
            coefficient
            * (-cosine * first[ell] + sine * sine * second[ell])
            for coefficient, ell in zip(coefficients, degrees)
        )
        cotangent_theta_first = cotangent * theta_first
    return AngularComponents(
        value=_positive_zero(value),
        theta_first=_positive_zero(theta_first),
        theta_second=_positive_zero(theta_second),
        cotangent_theta_first=_positive_zero(cotangent_theta_first),
        laplacian=_positive_zero(laplacian),
    )


def _angular_components_at(
    multipoles: Sequence[float],
    radial_index: int,
    mode_count: int,
    odd: bool,
    operators: LevelOperators,
    angular_index: int,
) -> AngularComponents:
    start = radial_index * mode_count
    return _parity_legendre_angular_components(
        multipoles[start : start + mode_count],
        odd,
        operators.theta_cosine[angular_index],
        operators.theta_sine[angular_index],
        operators.theta_cotangent[angular_index],
        axis=angular_index == 0,
        equator=angular_index == len(operators.theta) - 1,
    )


def _multipole_reconstruction_defect(
    field: Sequence[float],
    multipoles: Sequence[float],
    nr: int,
    ntheta: int,
    odd: bool,
    operators: LevelOperators,
) -> float:
    mode_count = (ntheta + 1) // 2
    maximum = 0.0
    for angular_index in range(ntheta):
        for radial_index in range(nr):
            reconstructed = _angular_components_at(
                multipoles,
                radial_index,
                mode_count,
                odd,
                operators,
                angular_index,
            ).value
            maximum = max(
                maximum,
                abs(field[radial_index * ntheta + angular_index] - reconstructed),
            )
    return maximum


def _boundary_parity_defect(
    scalar: Sequence[float],
    potential: Sequence[float],
    scalar_multipoles: Sequence[float],
    potential_multipoles: Sequence[float],
    operators: LevelOperators,
) -> float:
    nr = len(operators.rho)
    ntheta = len(operators.theta)
    scalar_modes = (ntheta + 1) // 2
    potential_modes = scalar_modes
    potential_rho_modes = _apply_radial_modes(
        operators.radial_first, potential_multipoles, nr, potential_modes
    )
    potential_origin_rho = tuple(
        _angular_components_at(
            potential_rho_modes,
            0,
            potential_modes,
            False,
            operators,
            angular_index,
        ).value
        for angular_index in range(ntheta)
    )
    scalar_axis_theta = tuple(
        _angular_components_at(
            scalar_multipoles, radial, scalar_modes, True, operators, 0
        ).theta_first
        for radial in range(1, nr - 1)
    )
    potential_axis_theta = tuple(
        _angular_components_at(
            potential_multipoles, radial, potential_modes, False, operators, 0
        ).theta_first
        for radial in range(1, nr - 1)
    )
    potential_equator_theta = tuple(
        _angular_components_at(
            potential_multipoles,
            radial,
            potential_modes,
            False,
            operators,
            ntheta - 1,
        ).theta_first
        for radial in range(1, nr - 1)
    )
    defects = [
        max(abs(scalar[column]) for column in range(ntheta)),
        max(abs(scalar[(nr - 1) * ntheta + column]) for column in range(ntheta)),
        max(abs(scalar[row * ntheta + ntheta - 1]) for row in range(nr)),
        max(abs(potential[(nr - 1) * ntheta + column]) for column in range(ntheta)),
        max(abs(value) for value in potential_origin_rho),
        max((abs(value) for value in scalar_axis_theta), default=0.0),
        max((abs(value) for value in potential_axis_theta), default=0.0),
        max((abs(value) for value in potential_equator_theta), default=0.0),
        max(abs(scalar_multipoles[mode]) for mode in range(scalar_modes)),
        max(
            abs(scalar_multipoles[(nr - 1) * scalar_modes + mode])
            for mode in range(scalar_modes)
        ),
        max(
            abs(potential_multipoles[(nr - 1) * potential_modes + mode])
            for mode in range(potential_modes)
        ),
        _multipole_reconstruction_defect(
            scalar, scalar_multipoles, nr, ntheta, True, operators
        ),
        _multipole_reconstruction_defect(
            potential,
            potential_multipoles,
            nr,
            ntheta,
            False,
            operators,
        ),
    ]
    return max(defects)


def _apply_radial_modes(
    matrix: Matrix, multipoles: Sequence[float], nr: int, modes: int
) -> tuple[float, ...]:
    if len(multipoles) != nr * modes:
        block(
            "residual",
            "multipole_shape_mismatch",
            f"observed={len(multipoles)}:expected={nr * modes}",
        )
    return tuple(
        math.fsum(
            matrix[row][source] * multipoles[source * modes + mode]
            for source in range(nr)
        )
        for row in range(nr)
        for mode in range(modes)
    )


def _normalized_residuals(
    scalar: Sequence[float],
    potential: Sequence[float],
    scalar_multipoles: Sequence[float],
    potential_multipoles: Sequence[float],
    operators: LevelOperators,
) -> tuple[float, float]:
    nr = len(operators.rho)
    ntheta = len(operators.theta)
    if len(scalar) != nr * ntheta or len(potential) != nr * ntheta:
        block("residual", "nodal_shape_mismatch", operators.level_id)
    modes = (ntheta + 1) // 2
    scalar_rho = _apply_radial_modes(
        operators.radial_first, scalar_multipoles, nr, modes
    )
    scalar_rhorho = _apply_radial_modes(
        operators.radial_second, scalar_multipoles, nr, modes
    )
    potential_rho = _apply_radial_modes(
        operators.radial_first, potential_multipoles, nr, modes
    )
    potential_rhorho = _apply_radial_modes(
        operators.radial_second, potential_multipoles, nr, modes
    )
    schrodinger_maximum = 0.0
    poisson_maximum = 0.0
    for radial_index in range(1, nr - 1):
        rho = operators.rho[radial_index]
        if rho > RHO_TAIL:
            continue
        one_minus = 1.0 - rho
        x = rho / one_minus
        x2 = x * x
        for angular_index in range(1, ntheta - 1):
            u_terms = _angular_components_at(
                scalar_multipoles,
                radial_index,
                modes,
                True,
                operators,
                angular_index,
            )
            v_terms = _angular_components_at(
                potential_multipoles,
                radial_index,
                modes,
                False,
                operators,
                angular_index,
            )
            ur = _angular_components_at(
                scalar_rho,
                radial_index,
                modes,
                True,
                operators,
                angular_index,
            ).value
            urr = _angular_components_at(
                scalar_rhorho,
                radial_index,
                modes,
                True,
                operators,
                angular_index,
            ).value
            vr = _angular_components_at(
                potential_rho,
                radial_index,
                modes,
                False,
                operators,
                angular_index,
            ).value
            vrr = _angular_components_at(
                potential_rhorho,
                radial_index,
                modes,
                False,
                operators,
                angular_index,
            ).value
            ux = one_minus * one_minus * ur
            uxx = (
                one_minus**4 * urr
                - 2.0 * one_minus**3 * ur
            )
            vx = one_minus * one_minus * vr
            vxx = (
                one_minus**4 * vrr
                - 2.0 * one_minus**3 * vr
            )
            angular_u = u_terms.laplacian / x2
            angular_v = v_terms.laplacian / x2
            u = u_terms.value
            v = v_terms.value
            schrodinger = -0.5 * (uxx + 2.0 * ux / x + angular_u) + v * u - NU0 * u
            schrodinger_denominator = (
                1.0
                + abs(uxx / 2.0)
                + abs(ux / x)
                + abs(u_terms.theta_second / (2.0 * x2))
                + abs(u_terms.cotangent_theta_first / (2.0 * x2))
                + abs(v * u)
                + abs(NU0 * u)
            )
            poisson = vxx + 2.0 * vx / x + angular_v - u * u
            poisson_denominator = (
                1.0
                + abs(vxx)
                + abs(2.0 * vx / x)
                + abs(v_terms.theta_second / x2)
                + abs(v_terms.cotangent_theta_first / x2)
                + u * u
            )
            schrodinger_maximum = max(
                schrodinger_maximum, abs(schrodinger) / schrodinger_denominator
            )
            poisson_maximum = max(
                poisson_maximum, abs(poisson) / poisson_denominator
            )
    return schrodinger_maximum, poisson_maximum


def _radial_chebyshev_tail(
    multipoles: Sequence[float],
    nr: int,
    modes: int,
    dct_cosine: Matrix,
) -> float:
    maximum_all = 0.0
    maximum_tail = 0.0
    denominator = nr - 1
    for mode in range(modes):
        for coefficient in range(nr):
            value = (2.0 / denominator) * math.fsum(
                (0.5 if radial in (0, nr - 1) else 1.0)
                * multipoles[radial * modes + mode]
                * dct_cosine[coefficient][radial]
                for radial in range(nr)
            )
            if coefficient in (0, nr - 1):
                value *= 0.5
            magnitude = abs(value)
            maximum_all = max(maximum_all, magnitude)
            if coefficient >= nr - 8:
                maximum_tail = max(maximum_tail, magnitude)
    return maximum_tail / max(maximum_all, 1.0e-300)


def _angular_tail(multipoles: Sequence[float], nr: int, modes: int) -> float:
    maximum_all = max((abs(value) for value in multipoles), default=0.0)
    maximum_tail = max(
        (
            abs(multipoles[radial * modes + mode])
            for radial in range(nr)
            for mode in range(max(0, modes - 8), modes)
        ),
        default=0.0,
    )
    return maximum_tail / max(maximum_all, 1.0e-300)


def replay_production_level(
    payloads: dict[int, ArrayPayload], operators: LevelOperators
) -> ProductionLevelMetrics:
    level_index = next(index for index, level in enumerate(LEVELS) if level[0] == operators.level_id)
    offset = level_index * 8
    scalar = payloads[offset + 2].values
    potential = payloads[offset + 3].values
    scalar_multipoles = payloads[offset + 6].values
    potential_multipoles = payloads[offset + 7].values
    nr = len(operators.rho)
    ntheta = len(operators.theta)
    modes = (ntheta + 1) // 2
    schrodinger, poisson = _normalized_residuals(
        scalar,
        potential,
        scalar_multipoles,
        potential_multipoles,
        operators,
    )
    boundary = _boundary_parity_defect(
        scalar,
        potential,
        scalar_multipoles,
        potential_multipoles,
        operators,
    )
    radial_tail = max(
        _radial_chebyshev_tail(
            scalar_multipoles, nr, modes, operators.radial_dct_cosine
        ),
        _radial_chebyshev_tail(
            potential_multipoles, nr, modes, operators.radial_dct_cosine
        ),
    )
    angular_tail = max(
        _angular_tail(scalar_multipoles, nr, modes),
        _angular_tail(potential_multipoles, nr, modes),
    )
    diagnostic_within_rails = (
        schrodinger <= THRESHOLDS["production_schrodinger_linf"]
        and poisson <= THRESHOLDS["production_poisson_linf"]
        and boundary <= THRESHOLDS["boundary_parity_linf"]
        and radial_tail <= THRESHOLDS["radial_spectral_tail_relative"]
        and angular_tail <= THRESHOLDS["angular_spectral_tail_relative"]
    )
    return ProductionLevelMetrics(
        level_id=operators.level_id,
        schrodinger_normalized_linf=schrodinger,
        poisson_normalized_linf=poisson,
        boundary_and_parity_linf=boundary,
        radial_tail_relative=radial_tail,
        angular_tail_relative=angular_tail,
        passed=_diagnostic_pass_state(diagnostic_within_rails),
    )


def _interpolation_rows(source_nodes: Sequence[float], target_nodes: Sequence[float]) -> Matrix:
    weights = barycentric_weights(len(source_nodes))
    rows: list[tuple[float, ...]] = []
    for target in target_nodes:
        exact = next((index for index, node in enumerate(source_nodes) if target == node), None)
        if exact is not None:
            row = [0.0] * len(source_nodes)
            row[exact] = 1.0
            rows.append(tuple(row))
            continue
        terms = [weights[index] / (target - node) for index, node in enumerate(source_nodes)]
        denominator = math.fsum(terms)
        if denominator == 0.0:
            block("convergence", "barycentric_denominator_zero", repr(target))
        rows.append(tuple(term / denominator for term in terms))
    return tuple(rows)


def _diagnostic_parity_source_difference(
    source_multipoles: Sequence[float],
    target_field: Sequence[float],
    source: LevelOperators,
    target: LevelOperators,
    odd: bool,
    rho_maximum: float,
) -> tuple[float, float]:
    """Compare a target prefix with radial-prolonged parity multipoles.

    The returned pair is (absolute L-inf defect, target L-inf norm).  It is a
    diagnostic because the v1 contract does not bind the scalar interpolation,
    Legendre evaluation, or reduction operation graph.
    """

    source_nr = len(source.rho)
    source_modes = (len(source.theta) + 1) // 2
    target_nr = len(target.rho)
    target_ntheta = len(target.theta)
    if len(source_multipoles) != source_nr * source_modes:
        block("convergence", "source_multipole_shape_mismatch", source.level_id)
    if len(target_field) != target_nr * target_ntheta:
        block("convergence", "target_nodal_shape_mismatch", target.level_id)
    selected_radial = tuple(
        radial for radial, rho in enumerate(target.rho) if rho <= rho_maximum
    )
    if not selected_radial:
        block("convergence", "empty_rho_prefix", target.level_id)
    interpolation = _interpolation_rows(
        source.rho, tuple(target.rho[index] for index in selected_radial)
    )
    absolute_defect = 0.0
    target_norm = 0.0
    for row, target_radial in zip(interpolation, selected_radial):
        coefficients = tuple(
            math.fsum(
                row[source_radial]
                * source_multipoles[source_radial * source_modes + mode]
                for source_radial in range(source_nr)
            )
            for mode in range(source_modes)
        )
        for angular in range(target_ntheta):
            reconstructed = _parity_legendre_angular_components(
                coefficients,
                odd,
                target.theta_cosine[angular],
                target.theta_sine[angular],
                target.theta_cotangent[angular],
                axis=angular == 0,
                equator=angular == target_ntheta - 1,
            ).value
            observed = target_field[target_radial * target_ntheta + angular]
            absolute_defect = max(absolute_defect, abs(observed - reconstructed))
            target_norm = max(target_norm, abs(observed))
    return absolute_defect, target_norm


def _field_difference(
    payloads: dict[int, ArrayPayload],
    coarse: LevelOperators,
    fine: LevelOperators,
) -> float:
    coarse_index = next(index for index, item in enumerate(LEVELS) if item[0] == coarse.level_id)
    fine_index = next(index for index, item in enumerate(LEVELS) if item[0] == fine.level_id)
    maximum = 0.0
    for role_index, multipole_role_index, odd in ((2, 6, True), (3, 7, False)):
        coarse_multipoles = payloads[
            coarse_index * 8 + multipole_role_index
        ].values
        fine_field = payloads[fine_index * 8 + role_index].values
        numerator, denominator = _diagnostic_parity_source_difference(
            coarse_multipoles,
            fine_field,
            coarse,
            fine,
            odd,
            RHO_TAIL,
        )
        maximum = max(maximum, numerator / max(denominator, 1.0e-300))
    return maximum


def _convergence_metrics_from_differences(
    d01: float, d12: float
) -> FieldConvergenceMetrics:
    if d01 < 0.0 or d12 < 0.0 or not math.isfinite(d01) or not math.isfinite(d12):
        block("convergence", "finite_nonnegative_differences_required", f"{d01}:{d12}")
    difference_ratio = (
        0.0
        if d12 == 0.0 and d01 == 0.0
        else d01 / d12
        if d12 > 0.0
        else math.inf
    )
    diagnostic_within_rails = (
        d12 <= THRESHOLDS["l1_l2_field_relative"]
        and (
            (d12 == 0.0 and d01 == 0.0)
            or (d12 > 0.0 and difference_ratio >= THRESHOLDS["difference_ratio"])
        )
    )
    return FieldConvergenceMetrics(
        d01=d01,
        d12=d12,
        difference_ratio=difference_ratio,
        diagnostic_within_rails=diagnostic_within_rails,
        passed=_diagnostic_pass_state(diagnostic_within_rails),
    )


def replay_field_convergence(
    payloads: dict[int, ArrayPayload], operators: dict[str, LevelOperators]
) -> FieldConvergenceMetrics:
    d01 = _field_difference(payloads, operators["L0"], operators["L1"])
    d12 = _field_difference(payloads, operators["L1"], operators["L2"])
    return _convergence_metrics_from_differences(d01, d12)


def replay_audit_discrete(
    payloads: dict[int, ArrayPayload], interior_source_linf: float
) -> DiscreteAuditMetrics:
    if interior_source_linf < 0.0 or not math.isfinite(interior_source_linf):
        block(
            "audit_discrete",
            "finite_nonnegative_interior_source_defect_required",
            repr(interior_source_linf),
        )
    level_index = 3
    nr = LEVELS[level_index][1]
    ntheta = LEVELS[level_index][2]
    negative = 0
    prescribed_zero_count = 0
    prescribed_zero_violations = 0
    eligible_count = 0
    unresolved_zero = 0
    for role_index in (2, 4):
        values = payloads[level_index * 8 + role_index].values
        field_count = 1 if role_index == 2 else 7
        field_size = nr * ntheta
        for field_index in range(field_count):
            start = field_index * field_size
            for radial in range(nr):
                for angular in range(ntheta):
                    value = values[start + radial * ntheta + angular]
                    prescribed = radial in (0, nr - 1) or angular == ntheta - 1
                    if prescribed:
                        prescribed_zero_count += 1
                        if not _same_f64_bits(value, 0.0):
                            prescribed_zero_violations += 1
                    else:
                        eligible_count += 1
                    if value < 0.0 or (
                        value == 0.0 and not _same_f64_bits(value, 0.0)
                    ):
                        negative += 1
                    elif value == 0.0 and not prescribed:
                        unresolved_zero += 1
    nonnegative_potential = 0
    for role_index in (3, 5):
        values = payloads[level_index * 8 + role_index].values
        field_count = 1 if role_index == 3 else 7
        field_size = nr * ntheta
        for field_index in range(field_count):
            start = field_index * field_size
            for radial in range(nr - 1):
                for angular in range(ntheta):
                    if values[start + radial * ntheta + angular] >= 0.0:
                        nonnegative_potential += 1
    if prescribed_zero_count != 4080 or eligible_count != 258064:
        block(
            "audit_discrete",
            "frozen_scalar_population_mismatch",
            f"prescribed={prescribed_zero_count}:eligible={eligible_count}",
        )
    return DiscreteAuditMetrics(
        negative_or_negative_zero_count=negative,
        prescribed_positive_zero_count=prescribed_zero_count,
        prescribed_positive_zero_violation_count=prescribed_zero_violations,
        eligible_nonboundary_count=eligible_count,
        unresolved_eligible_positive_zero_count=unresolved_zero,
        nonnegative_potential_interior_count=nonnegative_potential,
        interior_source_linf=interior_source_linf,
        passed=None,
    )


_INCOMPLETE_GATE_BLOCKERS: Final[tuple[Blocker, ...]] = (
    Blocker(
        phase="production_residual_gate",
        code="numeric_materialization_policy_absent",
        detail="seed v1 does not freeze DCT-I sums Legendre recurrence rounding radial interpolation reductions or endpoint overwrite chronology; analytic modal values remain diagnostic",
    ),
    Blocker(
        phase="boundary_parity_gate",
        code="bitwise_mpfr_nodal_resampling_replay_not_implemented",
        detail="tolerance-level nodal versus multipole comparison cannot establish required RN-even bit identity",
    ),
    Blocker(
        phase="audit_gate",
        code="piecewise_tail_residual_reconstruction_not_implemented",
        detail="AUDIT residuals require the proof-selected L2-plus-Coulomb-tail representative",
    ),
    Blocker(
        phase="scaling_gate",
        code="certified_peak_metadata_unavailable",
        detail="A0 and every target lambda must come from the continuous peak receipt",
    ),
    Blocker(
        phase="observable_gate",
        code="directed_full_space_quadrature_not_implemented",
        detail="interior comparison and full-space interval observables remain unavailable",
    ),
    Blocker(
        phase="identity_gate",
        code="coulomb_tail_flux_and_energy_not_implemented",
        detail="virial eigenvalue Poisson-energy and Gauss gates cannot be formed",
    ),
)


PROJECTED_NODAL_POSITIVE_ZERO_COUNT: Final[int] = 10_816
PROJECTED_MULTIPOLE_POSITIVE_ZERO_COUNT: Final[int] = 408
PROJECTED_POSITIVE_ZERO_COUNT: Final[int] = 11_224


def _count_positive_zero_violations(
    values: Sequence[float], indices: Sequence[int]
) -> int:
    return sum(not _same_f64_bits(values[index], 0.0) for index in indices)


def _projected_zero_violations(payloads: dict[int, ArrayPayload]) -> int:
    violations = 0
    population = 0
    nodal_population = 0
    multipole_population = 0
    for level_index, (_, nr, ntheta) in enumerate(LEVELS):
        offset = level_index * 8
        scalar_modes = (ntheta + 1) // 2
        for role_index in (2, 4):
            values = payloads[offset + role_index].values
            fields = 1 if role_index == 2 else 7
            field_size = nr * ntheta
            indices = {
                radial * ntheta + angular
                for radial in (0, nr - 1)
                for angular in range(ntheta)
            } | {
                radial * ntheta + (ntheta - 1) for radial in range(nr)
            }
            for field_index in range(fields):
                start = field_index * field_size
                selected = tuple(start + index for index in indices)
                population += len(selected)
                nodal_population += len(selected)
                violations += _count_positive_zero_violations(values, selected)
        for role_index in (3, 5):
            values = payloads[offset + role_index].values
            fields = 1 if role_index == 3 else 7
            field_size = nr * ntheta
            for field_index in range(fields):
                start = field_index * field_size + (nr - 1) * ntheta
                selected = tuple(start + angular for angular in range(ntheta))
                population += len(selected)
                nodal_population += len(selected)
                violations += _count_positive_zero_violations(values, selected)
        scalar_multipoles = payloads[offset + 6].values
        potential_multipoles = payloads[offset + 7].values
        for radial in (0, nr - 1):
            selected = tuple(
                radial * scalar_modes + mode for mode in range(scalar_modes)
            )
            population += len(selected)
            multipole_population += len(selected)
            violations += _count_positive_zero_violations(
                scalar_multipoles, selected
            )
        selected = tuple(
            (nr - 1) * scalar_modes + mode for mode in range(scalar_modes)
        )
        population += len(selected)
        multipole_population += len(selected)
        violations += _count_positive_zero_violations(
            potential_multipoles, selected
        )
    if (
        population != PROJECTED_POSITIVE_ZERO_COUNT
        or nodal_population != PROJECTED_NODAL_POSITIVE_ZERO_COUNT
        or multipole_population != PROJECTED_MULTIPOLE_POSITIVE_ZERO_COUNT
    ):
        block(
            "projection",
            "frozen_projected_zero_population_mismatch",
            f"all={population}:nodal={nodal_population}:multipole={multipole_population}",
        )
    return violations


def replay_preliminary_gates(
    payload_sequence: Sequence[ArrayPayload], backend: MpfrBackend
) -> PreliminaryGateReplay:
    if len(payload_sequence) != 32:
        block("gates", "exact_32_payloads_required", str(len(payload_sequence)))
    payloads = {item.spec.inventory_index: item for item in payload_sequence}
    if set(payloads) != set(range(32)):
        block("gates", "payload_inventory_indices_mismatch", "0_through_31_required")
    operators: dict[str, LevelOperators] = {}
    for level_index, (level_id, _, _) in enumerate(LEVELS):
        rho = payloads[level_index * 8].values
        theta = payloads[level_index * 8 + 1].values
        operators[level_id] = regenerate_level_operators(level_id, rho, theta, backend)
    production = tuple(
        replay_production_level(payloads, operators[level_id])
        for level_id in ("L0", "L1", "L2")
    )
    convergence = replay_field_convergence(payloads, operators)
    audit_scalar_source_linf, _ = _diagnostic_parity_source_difference(
        payloads[22].values,
        payloads[26].values,
        operators["L2"],
        operators["AUDIT"],
        True,
        RHO_TAIL,
    )
    audit_potential_source_linf, _ = _diagnostic_parity_source_difference(
        payloads[23].values,
        payloads[27].values,
        operators["L2"],
        operators["AUDIT"],
        False,
        RHO_TAIL,
    )
    audit = replay_audit_discrete(
        payloads, max(audit_scalar_source_linf, audit_potential_source_linf)
    )
    projected_zero_violations = _projected_zero_violations(payloads)
    dynamic_blockers = _INCOMPLETE_GATE_BLOCKERS
    if audit.unresolved_eligible_positive_zero_count > 0:
        dynamic_blockers = (
            *dynamic_blockers,
            Blocker(
                phase="audit_discrete",
                code="tail_underflow_zero_classification_requires_continuous_proof",
                detail=str(audit.unresolved_eligible_positive_zero_count),
            ),
        )
    any_failed = (
        any(item.passed is False for item in production)
        or convergence.passed is False
        or audit.negative_or_negative_zero_count > 0
        or audit.prescribed_positive_zero_violation_count > 0
        or audit.nonnegative_potential_interior_count > 0
        or projected_zero_violations > 0
    )
    return PreliminaryGateReplay(
        production_levels=production,
        field_convergence=convergence,
        audit_discrete=audit,
        projected_zero_violation_count=projected_zero_violations,
        blockers=dynamic_blockers,
        any_completed_gate_failed=any_failed,
    )
