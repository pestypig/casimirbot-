"""Coordinate-cancellation-free EKG residuals for the prolate branch BVP.

The generic covariant reference kernel constructs spherical-coordinate
Christoffel symbols and cancels their flat-space contributions only after the
Ricci contractions.  Close to ``x=0`` that is a poorly conditioned binary64
operation: individually nonzero terms scale as ``1/x**2`` even when the exact
Einstein tensor is zero.  This module evaluates the same five required mixed
Einstein components after symbolic cancellation of every coordinate-only
term.  Therefore a constant flat metric produces exact positive zeros at all
representable strict-interior points.

The formulas are derived from the frozen metric (and reproducible with
``derive_regular_residual.py``), not fitted to residuals or targets.  This is
still only a pointwise diagnostic kernel: it performs no solve, continuation,
branch admission, or physical-claim promotion and accepts no lever tensor,
target, residual array, or candidate output as input.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Final

import numpy as np

from covariant_residual import (
    COORDINATE_ORDER,
    FIELD_ORDER,
    SOLVED_RESIDUAL_ORDER,
    UNUSED_CONSTRAINT_ORDER,
    FieldJet,
)


ANALYTIC_FORM_VERSION: Final = (
    "nhm2_prolate_boson_star_coordinate_regular_ekg_residual/v1"
)
DERIVATION_ARTIFACT: Final = (
    "tools/nhm2-boson-star-branch/derive_regular_residual.py"
)


@dataclass(frozen=True)
class RegularResidual:
    """Raw and normalized residuals in the frozen branch-component order."""

    solved: tuple[float, float, float, float]
    unused_constraints: tuple[float, float]
    normalized_solved: tuple[float, float, float, float]
    normalized_unused_constraints: tuple[float, float]
    einstein_mixed: tuple[tuple[float, ...], ...]
    stress_mixed: tuple[tuple[float, ...], ...]
    einstein_covariant: tuple[tuple[float, ...], ...]
    stress_covariant: tuple[tuple[float, ...], ...]
    box_w_varphi: float
    analytic_form_version: str = ANALYTIC_FORM_VERSION
    derivation_artifact: str = DERIVATION_ARTIFACT
    authority: str = "diagnostic_coordinate_regular_interior_residual_only"
    solver_implemented: bool = False
    branch_solved: bool = False
    candidate_admissible: bool = False
    diagnostic_pass_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False
    target_or_residual_array_input_read: bool = False
    declared_lever_tensor_read: bool = False


def _finite_scalar(name: str, value: object) -> float:
    if isinstance(value, (bool, np.bool_)):
        raise ValueError(f"{name} must be a finite real scalar")
    try:
        result = float(value)
    except (TypeError, ValueError, OverflowError) as error:
        raise ValueError(f"{name} must be a finite real scalar") from error
    if not math.isfinite(result):
        raise ValueError(f"{name} must be a finite real scalar")
    return 0.0 if result == 0.0 else result


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


def _finite_positive_exp(name: str, exponent: float) -> float:
    try:
        value = math.exp(exponent)
    except OverflowError as error:
        raise ValueError(f"{name} is outside the finite binary64 domain") from error
    if not math.isfinite(value) or value <= 0.0:
        raise ValueError(f"{name} is outside the finite binary64 domain")
    return value


def _finite_sum(name: str, *terms: float) -> float:
    try:
        value = math.fsum(terms)
    except (OverflowError, ValueError) as error:
        raise ValueError(f"{name} overflowed") from error
    if not math.isfinite(value):
        raise ValueError(f"{name} is not finite")
    return 0.0 if value == 0.0 else value


def _finite_product(name: str, *factors: float) -> float:
    value = 1.0
    for factor in factors:
        value *= factor
        if not math.isfinite(value):
            raise ValueError(f"{name} is not finite")
    return 0.0 if value == 0.0 else value


def _finite_positive_product(name: str, *factors: float) -> float:
    """Multiply positive scales without order-dependent intermediate overflow."""

    if not factors:
        raise ValueError(f"{name} requires at least one factor")
    mantissa = 1.0
    exponent = 0
    for factor in factors:
        if not math.isfinite(factor) or factor <= 0.0:
            raise ValueError(f"{name} has a nonfinite nonpositive factor")
        factor_mantissa, factor_exponent = math.frexp(factor)
        mantissa *= factor_mantissa
        mantissa, normalization_exponent = math.frexp(mantissa)
        exponent += factor_exponent + normalization_exponent
    try:
        value = math.ldexp(mantissa, exponent)
    except OverflowError as error:
        raise ValueError(f"{name} is outside the finite binary64 domain") from error
    if not math.isfinite(value) or value <= 0.0:
        raise ValueError(f"{name} is outside the finite positive domain")
    return value


def _positive_denominator(name: str, *magnitudes: float) -> float:
    value = _finite_sum(name, 1.0, *magnitudes)
    if value <= 0.0:
        raise ValueError(f"{name} is not positive")
    return value


def _matrix_tuple(matrix: np.ndarray) -> tuple[tuple[float, ...], ...]:
    return tuple(
        tuple(0.0 if float(value) == 0.0 else float(value) for value in row)
        for row in matrix
    )


def _evaluate_regular_residual_impl(
    *,
    x: float,
    theta: float,
    F0: FieldJet,
    F1: FieldJet,
    F2: FieldJet,
    varphi: FieldJet,
    w: float,
) -> RegularResidual:
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

    x_squared = x_value * x_value
    sin_theta = math.sin(theta_value)
    sin_squared = sin_theta * sin_theta
    if (
        not math.isfinite(x_squared)
        or x_squared == 0.0
        or not math.isfinite(sin_squared)
        or sin_squared == 0.0
    ):
        raise ValueError("interior coordinate scale is not representable")
    inverse_x = 1.0 / x_value
    inverse_x_squared = 1.0 / x_squared
    cot_theta = math.cos(theta_value) / sin_theta
    if not all(
        math.isfinite(value)
        for value in (inverse_x, inverse_x_squared, cot_theta)
    ):
        raise ValueError("inverse interior coordinate scale is not representable")

    # Both signs are checked because the corresponding metric and inverse
    # metric factors must be finite and strictly nonzero.  This also rejects
    # silent binary64 underflow, not merely exp overflow.
    exp_2f0 = _finite_positive_exp("exp(2*F0)", 2.0 * f0.value)
    exp_m2f0 = _finite_positive_exp("exp(-2*F0)", -2.0 * f0.value)
    exp_2f1 = _finite_positive_exp("exp(2*F1)", 2.0 * f1.value)
    exp_m2f1 = _finite_positive_exp("exp(-2*F1)", -2.0 * f1.value)
    exp_2f2 = _finite_positive_exp("exp(2*F2)", 2.0 * f2.value)
    exp_m2f2 = _finite_positive_exp("exp(-2*F2)", -2.0 * f2.value)
    metric_theta_theta = _finite_product(
        "g_theta_theta",
        exp_2f1,
        x_squared,
    )
    metric_phi_phi = _finite_product(
        "g_phi_phi",
        exp_2f2,
        x_squared,
        sin_squared,
    )
    if metric_theta_theta <= 0.0 or metric_phi_phi <= 0.0:
        raise ValueError("metric coordinate scale is not finite positive")
    inverse_sin_squared = 1.0 / sin_squared
    if not math.isfinite(inverse_sin_squared) or inverse_sin_squared <= 0.0:
        raise ValueError("inverse angular coordinate scale is not finite positive")
    inverse_metric_theta_theta = _finite_positive_product(
        "g^theta_theta",
        exp_m2f1,
        inverse_x_squared,
    )
    _finite_positive_product(
        "g^phi_phi",
        exp_m2f2,
        inverse_x_squared,
        inverse_sin_squared,
    )
    # The generic covariant reference also requires the exact azimuthal
    # angular metric jet -2*csc(theta)^2 to be representable.  Keep the
    # regular form inside that same fail-closed coordinate domain even when
    # zero field derivatives would otherwise short-circuit every PDE term.
    _finite_positive_product(
        "azimuthal angular metric-jet scale",
        2.0,
        inverse_sin_squared,
    )

    # Names A/B/C keep the analytic expressions readable:
    # A=F0 (lapse), B=F1 (meridional conformal factor), C=F2 (azimuthal).
    ax, at = f0.dx, f0.dtheta
    axx, axt, att = f0.dxx, f0.dxtheta, f0.dthetatheta
    bx, bt = f1.dx, f1.dtheta
    bxx, btt = f1.dxx, f1.dthetatheta
    cx, ct = f2.dx, f2.dtheta
    cxx, cxt, ctt = f2.dxx, f2.dxtheta, f2.dthetatheta

    # These are exact mixed Einstein components after symbolic cancellation.
    # Every term contains a field derivative, so constant flat data evaluates
    # to zero without subtracting spherical-coordinate connections.
    g_time = _finite_product(
        "G^t_t",
        exp_m2f1,
        _finite_sum(
            "G^t_t bracket",
            bxx,
            cxx,
            cx * cx,
            inverse_x * (bx + 3.0 * cx),
            inverse_x_squared
            * (btt + ctt + ct * ct + 2.0 * cot_theta * ct),
        ),
    )
    g_radial = _finite_product(
        "G^x_x",
        exp_m2f1,
        _finite_sum(
            "G^x_x bracket",
            ax * bx,
            ax * cx,
            bx * cx,
            inverse_x * (2.0 * ax + bx + cx),
            inverse_x_squared
            * (
                att
                + ctt
                + at * at
                - at * bt
                + at * ct
                - bt * ct
                + ct * ct
                + cot_theta * (at - bt + 2.0 * ct)
            ),
        ),
    )
    g_polar = _finite_product(
        "G^theta_theta",
        exp_m2f1,
        _finite_sum(
            "G^theta_theta bracket",
            ax * ax,
            -ax * bx,
            ax * cx,
            axx,
            -bx * cx,
            cx * cx,
            cxx,
            inverse_x * (ax - bx + 2.0 * cx),
            inverse_x_squared
            * (at * bt + at * ct + bt * ct + cot_theta * (at + bt)),
        ),
    )
    g_azimuthal = _finite_product(
        "G^phi_phi",
        exp_m2f1,
        _finite_sum(
            "G^phi_phi bracket",
            ax * ax,
            axx,
            bxx,
            inverse_x * (ax + bx),
            inverse_x_squared * (at * at + att + btt),
        ),
    )
    g_radial_polar = _finite_product(
        "G^x_theta",
        -exp_m2f1,
        _finite_sum(
            "G^x_theta bracket",
            at * ax,
            -at * bx,
            -ax * bt,
            -bt * cx,
            -bx * ct,
            ct * cx,
            axt,
            cxt,
            cot_theta * (-bx + cx),
            -inverse_x * (at + bt),
        ),
    )

    p, px, pt = scalar.value, scalar.dx, scalar.dtheta
    p_squared = p * p
    time_gradient = exp_m2f0 * w_value * w_value * p_squared
    radial_gradient = exp_m2f1 * px * px
    polar_gradient = inverse_metric_theta_theta * pt * pt
    mass = p_squared
    stress_time = _finite_sum(
        "T^t_t",
        -time_gradient,
        -radial_gradient,
        -polar_gradient,
        -mass,
    )
    stress_radial = _finite_sum(
        "T^x_x",
        time_gradient,
        radial_gradient,
        -polar_gradient,
        -mass,
    )
    stress_polar = _finite_sum(
        "T^theta_theta",
        time_gradient,
        -radial_gradient,
        polar_gradient,
        -mass,
    )
    stress_azimuthal = _finite_sum(
        "T^phi_phi",
        time_gradient,
        -radial_gradient,
        -polar_gradient,
        -mass,
    )
    stress_radial_polar = _finite_product(
        "T^x_theta",
        2.0,
        exp_m2f1,
        px,
        pt,
    )

    radial_box = _finite_sum(
        "radial Box(varphi)",
        scalar.dxx,
        (ax + cx + 2.0 * inverse_x) * px,
    )
    polar_box = _finite_sum(
        "polar Box(varphi)",
        scalar.dthetatheta,
        (at + ct + cot_theta) * pt,
    )
    box_w_varphi = _finite_sum(
        "Box_w(varphi)",
        exp_m2f1 * radial_box,
        inverse_metric_theta_theta * polar_box,
        exp_m2f0 * w_value * w_value * p,
    )
    klein_gordon = _finite_sum("KGbar", box_w_varphi, -p)

    solved = (
        _finite_sum("E^t_t", g_time, -stress_time),
        _finite_sum(
            "E^x_x+E^theta_theta",
            g_radial,
            g_polar,
            -stress_radial,
            -stress_polar,
        ),
        _finite_sum("E^phi_phi", g_azimuthal, -stress_azimuthal),
        klein_gordon,
    )
    unused = (
        _finite_sum(
            "E^x_theta",
            g_radial_polar,
            -stress_radial_polar,
        ),
        _finite_sum(
            "E^x_x-E^theta_theta",
            g_radial,
            -g_polar,
            -stress_radial,
            stress_polar,
        ),
    )

    time_denominator = _positive_denominator(
        "time normalization denominator",
        abs(g_time),
        abs(stress_time),
    )
    spatial_denominator = _positive_denominator(
        "spatial normalization denominator",
        abs(g_radial),
        abs(g_polar),
        abs(stress_radial),
        abs(stress_polar),
    )
    azimuthal_denominator = _positive_denominator(
        "azimuthal normalization denominator",
        abs(g_azimuthal),
        abs(stress_azimuthal),
    )
    kg_denominator = _positive_denominator(
        "KG normalization denominator",
        abs(box_w_varphi),
        abs(p),
    )
    cross_denominator = _positive_denominator(
        "cross normalization denominator",
        abs(g_radial_polar),
        abs(stress_radial_polar),
    )
    normalized_solved = (
        abs(solved[0]) / time_denominator,
        abs(solved[1]) / spatial_denominator,
        abs(solved[2]) / azimuthal_denominator,
        abs(solved[3]) / kg_denominator,
    )
    normalized_unused = (
        abs(unused[0]) / cross_denominator,
        abs(unused[1]) / spatial_denominator,
    )

    einstein_mixed = np.zeros((4, 4), dtype=np.float64)
    stress_mixed = np.zeros((4, 4), dtype=np.float64)
    for matrix, diagonal in (
        (
            einstein_mixed,
            (g_time, g_radial, g_polar, g_azimuthal),
        ),
        (
            stress_mixed,
            (
                stress_time,
                stress_radial,
                stress_polar,
                stress_azimuthal,
            ),
        ),
    ):
        for index, value in enumerate(diagonal):
            matrix[index, index] = value
    einstein_mixed[1, 2] = g_radial_polar
    einstein_mixed[2, 1] = inverse_x_squared * g_radial_polar
    stress_mixed[1, 2] = stress_radial_polar
    stress_mixed[2, 1] = inverse_x_squared * stress_radial_polar

    einstein_covariant = np.zeros((4, 4), dtype=np.float64)
    stress_covariant = np.zeros((4, 4), dtype=np.float64)
    metric_diagonal = (-exp_2f0, exp_2f1, metric_theta_theta, metric_phi_phi)
    for covariant, mixed in (
        (einstein_covariant, einstein_mixed),
        (stress_covariant, stress_mixed),
    ):
        for index, metric_value in enumerate(metric_diagonal):
            covariant[index, index] = metric_value * mixed[index, index]
        covariant[1, 2] = exp_2f1 * mixed[1, 2]
        covariant[2, 1] = covariant[1, 2]

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
        raise ValueError("regular residual evaluation produced a nonfinite value")

    return RegularResidual(
        solved=tuple(0.0 if value == 0.0 else value for value in solved),
        unused_constraints=tuple(
            0.0 if value == 0.0 else value for value in unused
        ),
        normalized_solved=tuple(
            0.0 if value == 0.0 else value for value in normalized_solved
        ),
        normalized_unused_constraints=tuple(
            0.0 if value == 0.0 else value for value in normalized_unused
        ),
        einstein_mixed=_matrix_tuple(einstein_mixed),
        stress_mixed=_matrix_tuple(stress_mixed),
        einstein_covariant=_matrix_tuple(einstein_covariant),
        stress_covariant=_matrix_tuple(stress_covariant),
        box_w_varphi=0.0 if box_w_varphi == 0.0 else box_w_varphi,
    )


def evaluate_interior_regular_residual(
    *,
    x: float,
    theta: float,
    F0: FieldJet,
    F1: FieldJet,
    F2: FieldJet,
    varphi: FieldJet,
    w: float,
) -> RegularResidual:
    """Fail-closed public boundary for the analytic interior kernel."""

    try:
        with np.errstate(divide="raise", invalid="raise", over="raise"):
            return _evaluate_regular_residual_impl(
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
            "regular residual evaluation left the finite binary64 domain",
        ) from error
