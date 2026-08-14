"""Interior covariant EKG residual kernel for the frozen prolate branch BVP.

This module is a diagnostic solver component, not a branch solver and not an
authority-bearing artifact.  It evaluates the exact covariant equations named
by ``nhm2-prolate-boson-star-branch-bvp.v1`` from one interior field jet.  No
declared lever/tile tensor, target residual, fitted source, or candidate output
is accepted as input.

Coordinates and unknowns follow the frozen dimensionless convention

    (tau, x, theta, phi), (F0, F1, F2, varphi), w = omega / mu,

with

    ds^2 = -exp(2 F0) d tau^2
           + exp(2 F1) (dx^2 + x^2 d theta^2)
           + exp(2 F2) x^2 sin(theta)^2 d phi^2.

Only strict interior points are admitted.  Boundary/tau rows, continuation,
Newton--Krylov policy, branch identity, and every acceptance rail remain duties
of a future bounded branch solver and server replay.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Final

import numpy as np


COORDINATE_ORDER: Final = ("tau", "x", "theta", "phi")
FIELD_ORDER: Final = ("F0", "F1", "F2", "varphi")
SOLVED_RESIDUAL_ORDER: Final = (
    "einstein_Et_t",
    "einstein_Er_r_plus_Etheta_theta",
    "einstein_Ephi_phi",
    "klein_gordon",
)
UNUSED_CONSTRAINT_ORDER: Final = (
    "einstein_Er_theta",
    "einstein_Er_r_minus_Etheta_theta",
)


@dataclass(frozen=True)
class FieldJet:
    """Value and all x/theta derivatives required by a second-order PDE."""

    value: float
    dx: float
    dtheta: float
    dxx: float
    dxtheta: float
    dthetatheta: float


@dataclass(frozen=True)
class CovariantResidual:
    """Raw pointwise tensors and residuals in the frozen component order."""

    solved: tuple[float, float, float, float]
    unused_constraints: tuple[float, float]
    normalized_solved: tuple[float, float, float, float]
    normalized_unused_constraints: tuple[float, float]
    einstein_mixed: tuple[tuple[float, ...], ...]
    stress_mixed: tuple[tuple[float, ...], ...]
    einstein_covariant: tuple[tuple[float, ...], ...]
    stress_covariant: tuple[tuple[float, ...], ...]
    box_w_varphi: float
    authority: str = "diagnostic_interior_residual_only"
    branch_solved: bool = False
    candidate_admissible: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False


def _finite_scalar(name: str, value: object) -> float:
    if isinstance(value, (bool, np.bool_)):
        raise ValueError(f"{name} must be a finite real scalar")
    try:
        result = float(value)
    except (TypeError, ValueError, OverflowError) as error:
        raise ValueError(f"{name} must be a finite real scalar") from error
    if not math.isfinite(result):
        raise ValueError(f"{name} must be a finite real scalar")
    return result


def _validated_jet(name: str, jet: object) -> FieldJet:
    if type(jet) is not FieldJet:
        raise ValueError(f"{name} must be an exact FieldJet")
    return FieldJet(
        value=_finite_scalar(f"{name}.value", jet.value),
        dx=_finite_scalar(f"{name}.dx", jet.dx),
        dtheta=_finite_scalar(f"{name}.dtheta", jet.dtheta),
        dxx=_finite_scalar(f"{name}.dxx", jet.dxx),
        dxtheta=_finite_scalar(f"{name}.dxtheta", jet.dxtheta),
        dthetatheta=_finite_scalar(
            f"{name}.dthetatheta",
            jet.dthetatheta,
        ),
    )


def _matrix_tuple(matrix: np.ndarray) -> tuple[tuple[float, ...], ...]:
    return tuple(tuple(float(value) for value in row) for row in matrix)


def _canonicalize_symmetric_tensor(matrix: np.ndarray) -> np.ndarray:
    """Average roundoff-only covariant index skew before mixed projection.

    Ricci and stress are mathematically symmetric.  Their two independently
    accumulated floating-point paths can differ by a few ulps near coordinate
    singularities.  Averaging is not a tolerance or an acceptance decision; it
    enforces the exact tensor symmetry of the covariant formula itself.
    """

    return 0.5 * (matrix + matrix.T)


def _positive_finite_sum(*values: float) -> float:
    try:
        result = math.fsum(values)
    except (OverflowError, ValueError) as error:
        raise ValueError("residual normalization denominator overflowed") from error
    if not math.isfinite(result) or result <= 0.0:
        raise ValueError("residual normalization denominator is not finite positive")
    return result


def _metric_from_jets(
    x: float,
    theta: float,
    f0: FieldJet,
    f1: FieldJet,
    f2: FieldJet,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Return g_ab, partial_c g_ab, and partial_c partial_d g_ab.

    Derivatives are formed analytically from logarithmic diagonal metric
    factors.  This avoids differentiating coordinate-singular Christoffel
    samples across the origin or axis.
    """

    sin_theta = math.sin(theta)
    x_squared = x * x
    sin_squared_theta = sin_theta * sin_theta
    if (
        not math.isfinite(x_squared)
        or x_squared == 0.0
        or not math.isfinite(sin_squared_theta)
        or sin_squared_theta == 0.0
    ):
        raise ValueError("interior coordinate scale is not representable")
    cot_theta = math.cos(theta) / sin_theta
    csc_squared_theta = 1.0 / sin_squared_theta

    metric = np.zeros((4, 4), dtype=np.float64)
    first = np.zeros((4, 4, 4), dtype=np.float64)
    second = np.zeros((4, 4, 4, 4), dtype=np.float64)

    # (coordinate index, signed metric value, L_x, L_theta,
    #  L_xx, L_xtheta, L_thetatheta), where g_aa = sign * exp(L).
    diagonal = (
        (
            0,
            -math.exp(2.0 * f0.value),
            2.0 * f0.dx,
            2.0 * f0.dtheta,
            2.0 * f0.dxx,
            2.0 * f0.dxtheta,
            2.0 * f0.dthetatheta,
        ),
        (
            1,
            math.exp(2.0 * f1.value),
            2.0 * f1.dx,
            2.0 * f1.dtheta,
            2.0 * f1.dxx,
            2.0 * f1.dxtheta,
            2.0 * f1.dthetatheta,
        ),
        (
            2,
            math.exp(2.0 * f1.value) * x_squared,
            2.0 * f1.dx + 2.0 / x,
            2.0 * f1.dtheta,
            2.0 * f1.dxx - 2.0 / (x * x),
            2.0 * f1.dxtheta,
            2.0 * f1.dthetatheta,
        ),
        (
            3,
            math.exp(2.0 * f2.value) * x_squared * sin_squared_theta,
            2.0 * f2.dx + 2.0 / x,
            2.0 * f2.dtheta + 2.0 * cot_theta,
            2.0 * f2.dxx - 2.0 / (x * x),
            2.0 * f2.dxtheta,
            2.0 * f2.dthetatheta - 2.0 * csc_squared_theta,
        ),
    )

    for index, value, lx, lt, lxx, lxt, ltt in diagonal:
        metric[index, index] = value
        first[1, index, index] = value * lx
        first[2, index, index] = value * lt
        second[1, 1, index, index] = value * (lx * lx + lxx)
        second[1, 2, index, index] = value * (lx * lt + lxt)
        second[2, 1, index, index] = second[1, 2, index, index]
        second[2, 2, index, index] = value * (lt * lt + ltt)
    if not (
        np.all(np.isfinite(metric))
        and np.all(np.isfinite(first))
        and np.all(np.isfinite(second))
    ):
        raise ValueError("metric jet is outside the finite binary64 domain")
    return metric, first, second


def _geometry_tensors(
    metric: np.ndarray,
    first: np.ndarray,
    second: np.ndarray,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    inverse = np.linalg.inv(metric)
    if not np.all(np.isfinite(inverse)):
        raise ValueError("inverse metric is outside the finite binary64 domain")
    inverse_first = np.zeros((4, 4, 4), dtype=np.float64)
    for derivative in range(4):
        inverse_first[derivative] = (
            -inverse @ first[derivative] @ inverse
        )

    christoffel = np.zeros((4, 4, 4), dtype=np.float64)
    christoffel_first = np.zeros((4, 4, 4, 4), dtype=np.float64)
    for upper in range(4):
        for lower_a in range(4):
            for lower_b in range(4):
                for contracted in range(4):
                    metric_combination = (
                        first[lower_a, contracted, lower_b]
                        + first[lower_b, contracted, lower_a]
                        - first[contracted, lower_a, lower_b]
                    )
                    christoffel[upper, lower_a, lower_b] += (
                        0.5 * inverse[upper, contracted] * metric_combination
                    )
                    for derivative in range(4):
                        derivative_combination = (
                            second[
                                derivative,
                                lower_a,
                                contracted,
                                lower_b,
                            ]
                            + second[
                                derivative,
                                lower_b,
                                contracted,
                                lower_a,
                            ]
                            - second[
                                derivative,
                                contracted,
                                lower_a,
                                lower_b,
                            ]
                        )
                        christoffel_first[
                            derivative,
                            upper,
                            lower_a,
                            lower_b,
                        ] += 0.5 * (
                            inverse_first[derivative, upper, contracted]
                            * metric_combination
                            + inverse[upper, contracted]
                            * derivative_combination
                        )

    ricci = np.zeros((4, 4), dtype=np.float64)
    for covariant_a in range(4):
        for covariant_b in range(4):
            value = 0.0
            for contracted_c in range(4):
                value += christoffel_first[
                    contracted_c,
                    contracted_c,
                    covariant_a,
                    covariant_b,
                ]
                value -= christoffel_first[
                    covariant_b,
                    contracted_c,
                    covariant_a,
                    contracted_c,
                ]
                for contracted_d in range(4):
                    value += (
                        christoffel[
                            contracted_c,
                            covariant_a,
                            covariant_b,
                        ]
                        * christoffel[
                            contracted_d,
                            contracted_c,
                            contracted_d,
                        ]
                    )
                    value -= (
                        christoffel[
                            contracted_d,
                            covariant_a,
                            contracted_c,
                        ]
                        * christoffel[
                            contracted_c,
                            covariant_b,
                            contracted_d,
                        ]
                    )
            ricci[covariant_a, covariant_b] = value

    scalar_curvature = float(np.sum(inverse * ricci))
    einstein_covariant = _canonicalize_symmetric_tensor(
        ricci - 0.5 * metric * scalar_curvature,
    )
    return inverse, christoffel, einstein_covariant


def _evaluate_interior_covariant_residual_impl(
    *,
    x: float,
    theta: float,
    F0: FieldJet,
    F1: FieldJet,
    F2: FieldJet,
    varphi: FieldJet,
    w: float,
) -> CovariantResidual:
    """Evaluate the six frozen branch residual families at one interior point.

    ``w`` is checked only as a branch-domain input.  This function does not
    solve for it, enforce the peak normalization, or confer eigenvalue status.
    """

    x_value = _finite_scalar("x", x)
    theta_value = _finite_scalar("theta", theta)
    w_value = _finite_scalar("w", w)
    if not x_value > 0.0:
        raise ValueError("x must be strictly positive for the interior kernel")
    if not 0.0 < theta_value < math.pi / 2.0:
        raise ValueError(
            "theta must lie strictly inside the frozen north half-domain",
        )
    if not 0.0 < w_value < 1.0:
        raise ValueError("w must satisfy the frozen branch range 0<w<1")

    f0 = _validated_jet("F0", F0)
    f1 = _validated_jet("F1", F1)
    f2 = _validated_jet("F2", F2)
    scalar = _validated_jet("varphi", varphi)

    try:
        metric, metric_first, metric_second = _metric_from_jets(
            x_value,
            theta_value,
            f0,
            f1,
            f2,
        )
        inverse, christoffel, einstein_covariant = _geometry_tensors(
            metric,
            metric_first,
            metric_second,
        )
    except (
        ArithmeticError,
        FloatingPointError,
        ValueError,
        np.linalg.LinAlgError,
    ) as error:
        raise ValueError(
            "metric jet does not define a finite invertible metric",
        ) from error

    scalar_gradient = np.asarray(
        [0.0, scalar.dx, scalar.dtheta, 0.0],
        dtype=np.float64,
    )
    scalar_second = np.zeros((4, 4), dtype=np.float64)
    scalar_second[0, 0] = -w_value * w_value * scalar.value
    scalar_second[1, 1] = scalar.dxx
    scalar_second[1, 2] = scalar.dxtheta
    scalar_second[2, 1] = scalar.dxtheta
    scalar_second[2, 2] = scalar.dthetatheta

    box_w_varphi = 0.0
    for covariant_a in range(4):
        for covariant_b in range(4):
            covariant_second = scalar_second[covariant_a, covariant_b]
            for contracted in range(4):
                covariant_second -= (
                    christoffel[contracted, covariant_a, covariant_b]
                    * scalar_gradient[contracted]
                )
            box_w_varphi += inverse[covariant_a, covariant_b] * covariant_second
    klein_gordon = box_w_varphi - scalar.value

    kinetic_plus_mass = (
        inverse[0, 0] * w_value * w_value * scalar.value * scalar.value
        + inverse[1, 1] * scalar.dx * scalar.dx
        + inverse[2, 2] * scalar.dtheta * scalar.dtheta
        + scalar.value * scalar.value
    )
    stress_bilinear = np.zeros((4, 4), dtype=np.float64)
    stress_bilinear[0, 0] = (
        2.0 * w_value * w_value * scalar.value * scalar.value
    )
    stress_bilinear[1, 1] = 2.0 * scalar.dx * scalar.dx
    stress_bilinear[2, 2] = 2.0 * scalar.dtheta * scalar.dtheta
    stress_bilinear[1, 2] = 2.0 * scalar.dx * scalar.dtheta
    stress_bilinear[2, 1] = stress_bilinear[1, 2]
    stress_covariant = _canonicalize_symmetric_tensor(
        stress_bilinear - metric * kinetic_plus_mass,
    )

    einstein_mixed = inverse @ einstein_covariant
    stress_mixed = inverse @ stress_covariant
    equation_mixed = einstein_mixed - stress_mixed

    solved = (
        float(equation_mixed[0, 0]),
        float(equation_mixed[1, 1] + equation_mixed[2, 2]),
        float(equation_mixed[3, 3]),
        float(klein_gordon),
    )
    unused = (
        float(equation_mixed[1, 2]),
        float(equation_mixed[1, 1] - equation_mixed[2, 2]),
    )
    time_denominator = _positive_finite_sum(
        1.0,
        abs(einstein_mixed[0, 0]),
        abs(stress_mixed[0, 0]),
    )
    spatial_sum_denominator = _positive_finite_sum(
        1.0,
        abs(einstein_mixed[1, 1]),
        abs(einstein_mixed[2, 2]),
        abs(stress_mixed[1, 1]),
        abs(stress_mixed[2, 2]),
    )
    azimuthal_denominator = _positive_finite_sum(
        1.0,
        abs(einstein_mixed[3, 3]),
        abs(stress_mixed[3, 3]),
    )
    kg_denominator = _positive_finite_sum(
        1.0,
        abs(box_w_varphi),
        abs(scalar.value),
    )
    cross_denominator = _positive_finite_sum(
        1.0,
        abs(einstein_mixed[1, 2]),
        abs(stress_mixed[1, 2]),
    )
    normalized_solved = (
        abs(solved[0]) / time_denominator,
        abs(solved[1]) / spatial_sum_denominator,
        abs(solved[2]) / azimuthal_denominator,
        abs(solved[3]) / kg_denominator,
    )
    normalized_unused = (
        abs(unused[0]) / cross_denominator,
        abs(unused[1]) / spatial_sum_denominator,
    )

    finite_outputs = (
        *solved,
        *unused,
        *normalized_solved,
        *normalized_unused,
        box_w_varphi,
        *einstein_mixed.ravel(),
        *stress_mixed.ravel(),
        *einstein_covariant.ravel(),
        *stress_covariant.ravel(),
    )
    if not all(math.isfinite(float(value)) for value in finite_outputs):
        raise ValueError("covariant residual evaluation produced a nonfinite value")

    return CovariantResidual(
        solved=solved,
        unused_constraints=unused,
        normalized_solved=tuple(float(value) for value in normalized_solved),
        normalized_unused_constraints=tuple(
            float(value) for value in normalized_unused
        ),
        einstein_mixed=_matrix_tuple(einstein_mixed),
        stress_mixed=_matrix_tuple(stress_mixed),
        einstein_covariant=_matrix_tuple(einstein_covariant),
        stress_covariant=_matrix_tuple(stress_covariant),
        box_w_varphi=float(box_w_varphi),
    )


def evaluate_interior_covariant_residual(
    *,
    x: float,
    theta: float,
    F0: FieldJet,
    F1: FieldJet,
    F2: FieldJet,
    varphi: FieldJet,
    w: float,
) -> CovariantResidual:
    """Fail-closed public boundary for the diagnostic interior kernel."""

    try:
        with np.errstate(divide="raise", invalid="raise", over="raise"):
            return _evaluate_interior_covariant_residual_impl(
                x=x,
                theta=theta,
                F0=F0,
                F1=F1,
                F2=F2,
                varphi=varphi,
                w=w,
            )
    except (ArithmeticError, FloatingPointError) as error:
        raise ValueError(
            "covariant residual evaluation left the finite binary64 domain",
        ) from error
