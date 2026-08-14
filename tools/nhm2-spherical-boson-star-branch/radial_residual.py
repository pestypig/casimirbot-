"""Cancellation-free radial EKG residual for the spherical 1s successor.

This is a pointwise diagnostic kernel, not a branch solver.  It is the exact
spherical reduction F2=F1, partial_theta=0 of the frozen (-+++) isotropic EKG
system used by the prolate branch.  It accepts no residual target, declared
lever tensor, output path, tolerance override, or authority-bearing input.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Final

from binary64_environment import nearest_binary64


ANALYTIC_FORM_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_1s_radial_ekg_residual/v1"
)
SOLVED_RESIDUAL_ORDER: Final[tuple[str, ...]] = (
    "einstein_Et_t",
    "einstein_Etheta_theta",
    "klein_gordon",
)
UNUSED_CONSTRAINT_ORDER: Final[tuple[str, ...]] = ("einstein_Ex_x",)


@dataclass(frozen=True, slots=True)
class RadialJet:
    value: float
    dx: float
    dxx: float


@dataclass(frozen=True, slots=True)
class SphericalRadialResidual:
    solved: tuple[float, float, float]
    unused_constraints: tuple[float]
    normalized_solved: tuple[float, float, float]
    normalized_unused_constraints: tuple[float]
    einstein_mixed_diagonal: tuple[float, float, float, float]
    stress_mixed_diagonal: tuple[float, float, float, float]
    box_w_varphi: float
    analytic_form_version: str = ANALYTIC_FORM_VERSION
    maturity: str = "diagnostic_pointwise_spherical_radial_algebra_only"
    calculation_implemented: bool = True
    branch_solver_implemented: bool = False
    branch_solved: bool = False
    candidate_admissible: bool = False
    metric_demand_non_degeneracy_established: bool = False
    execution_authority: bool = False
    diagnostic_pass_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False
    target_or_residual_array_input_read: bool = False
    declared_lever_tensor_read: bool = False


def _finite_scalar(name: str, value: object) -> float:
    if type(value) not in (int, float):
        raise ValueError(f"{name} must be an exact finite real scalar")
    result = float(value)
    if not math.isfinite(result):
        raise ValueError(f"{name} must be finite")
    return 0.0 if result == 0.0 else result


def _jet(name: str, value: object) -> RadialJet:
    if type(value) is not RadialJet:
        raise ValueError(f"{name} must be an exact RadialJet")
    return RadialJet(
        value=_finite_scalar(f"{name}.value", value.value),
        dx=_finite_scalar(f"{name}.dx", value.dx),
        dxx=_finite_scalar(f"{name}.dxx", value.dxx),
    )


def _finite_positive_exp(name: str, exponent: float) -> float:
    try:
        result = math.exp(exponent)
    except OverflowError as error:
        raise ValueError(f"{name} is outside the finite binary64 domain") from error
    if not math.isfinite(result) or result <= 0.0:
        raise ValueError(f"{name} is outside the finite positive domain")
    return result


def _finite_sum(name: str, *terms: float) -> float:
    try:
        result = math.fsum(terms)
    except (OverflowError, ValueError) as error:
        raise ValueError(f"{name} overflowed") from error
    if not math.isfinite(result):
        raise ValueError(f"{name} is not finite")
    return 0.0 if result == 0.0 else result


def _finite_product(name: str, *factors: float) -> float:
    result = 1.0
    for factor in factors:
        result *= factor
        if not math.isfinite(result):
            raise ValueError(f"{name} is not finite")
    return 0.0 if result == 0.0 else result


def _finite_positive_product(name: str, *factors: float) -> float:
    if not factors:
        raise ValueError(f"{name} requires at least one factor")
    mantissa = 1.0
    exponent = 0
    for factor in factors:
        if not math.isfinite(factor) or factor <= 0.0:
            raise ValueError(f"{name} has a nonfinite or nonpositive factor")
        factor_mantissa, factor_exponent = math.frexp(factor)
        mantissa *= factor_mantissa
        mantissa, normalization_exponent = math.frexp(mantissa)
        exponent += factor_exponent + normalization_exponent
    try:
        result = math.ldexp(mantissa, exponent)
    except OverflowError as error:
        raise ValueError(f"{name} is outside the finite binary64 domain") from error
    if not math.isfinite(result) or result <= 0.0:
        raise ValueError(f"{name} is outside the finite positive domain")
    return result


def _normalized(value: float, *magnitudes: float) -> float:
    denominator = _finite_sum(
        "residual normalization denominator",
        1.0,
        *(abs(item) for item in magnitudes),
    )
    result = abs(value) / denominator
    if not math.isfinite(result):
        raise ValueError("normalized residual is not finite")
    return 0.0 if result == 0.0 else result


@nearest_binary64
def evaluate_spherical_radial_residual(
    *,
    x: float,
    F0: RadialJet,
    F1: RadialJet,
    varphi: RadialJet,
    w: float,
) -> SphericalRadialResidual:
    """Evaluate the three solved rows and one unused Einstein constraint."""

    x_value = _finite_scalar("x", x)
    w_value = _finite_scalar("w", w)
    if x_value <= 0.0:
        raise ValueError("x must be strictly positive for the interior kernel")
    if not 0.0 < w_value < 1.0:
        raise ValueError("w must satisfy the frozen range 0<w<1")
    lapse = _jet("F0", F0)
    spatial = _jet("F1", F1)
    scalar = _jet("varphi", varphi)

    x_squared = x_value * x_value
    if not math.isfinite(x_squared) or x_squared == 0.0:
        raise ValueError("radial coordinate scale is not representable")
    inverse_x = 1.0 / x_value
    inverse_x_squared = 1.0 / x_squared
    if not math.isfinite(inverse_x) or not math.isfinite(inverse_x_squared):
        raise ValueError("inverse radial coordinate scale is not representable")

    exp_2f0 = _finite_positive_exp("exp(2*F0)", 2.0 * lapse.value)
    exp_m2f0 = _finite_positive_exp("exp(-2*F0)", -2.0 * lapse.value)
    exp_2f1 = _finite_positive_exp("exp(2*F1)", 2.0 * spatial.value)
    exp_m2f1 = _finite_positive_exp("exp(-2*F1)", -2.0 * spatial.value)
    _finite_positive_product("g_theta_theta", exp_2f1, x_squared)
    inverse_metric_angular = _finite_positive_product(
        "g^theta_theta",
        exp_m2f1,
        inverse_x_squared,
    )

    ap, app = lapse.dx, lapse.dxx
    bp, bpp = spatial.dx, spatial.dxx
    p, pp, ppp = scalar.value, scalar.dx, scalar.dxx

    g_time = _finite_product(
        "G^t_t",
        exp_m2f1,
        _finite_sum(
            "G^t_t bracket",
            2.0 * bpp,
            bp * bp,
            4.0 * inverse_x * bp,
        ),
    )
    g_radial = _finite_product(
        "G^x_x",
        exp_m2f1,
        _finite_sum(
            "G^x_x bracket",
            2.0 * ap * bp,
            bp * bp,
            2.0 * inverse_x * (ap + bp),
        ),
    )
    g_angular = _finite_product(
        "G^theta_theta",
        exp_m2f1,
        _finite_sum(
            "G^theta_theta bracket",
            ap * ap,
            app,
            bpp,
            inverse_x * (ap + bp),
        ),
    )

    p_squared = p * p
    time_gradient = _finite_product(
        "time scalar gradient",
        exp_m2f0,
        w_value,
        w_value,
        p_squared,
    )
    radial_gradient = _finite_product(
        "radial scalar gradient",
        exp_m2f1,
        pp,
        pp,
    )
    stress_time = _finite_sum(
        "T^t_t",
        -time_gradient,
        -radial_gradient,
        -p_squared,
    )
    stress_radial = _finite_sum(
        "T^x_x",
        time_gradient,
        radial_gradient,
        -p_squared,
    )
    stress_angular = _finite_sum(
        "T^theta_theta",
        time_gradient,
        -radial_gradient,
        -p_squared,
    )

    radial_box = _finite_sum(
        "radial Box(varphi)",
        ppp,
        (ap + bp + 2.0 * inverse_x) * pp,
    )
    box_w_varphi = _finite_sum(
        "Box_w(varphi)",
        exp_m2f1 * radial_box,
        exp_m2f0 * w_value * w_value * p,
    )
    e_time = _finite_sum("E^t_t", g_time, -stress_time)
    e_radial = _finite_sum("E^x_x", g_radial, -stress_radial)
    e_angular = _finite_sum("E^theta_theta", g_angular, -stress_angular)
    klein_gordon = _finite_sum("KGbar", box_w_varphi, -p)

    solved = (e_time, e_angular, klein_gordon)
    unused = (e_radial,)
    normalized_solved = (
        _normalized(e_time, g_time, stress_time),
        _normalized(e_angular, g_angular, stress_angular),
        _normalized(klein_gordon, box_w_varphi, p),
    )
    normalized_unused = (_normalized(e_radial, g_radial, stress_radial),)
    finite_values = (
        *solved,
        *unused,
        *normalized_solved,
        *normalized_unused,
        g_time,
        g_radial,
        g_angular,
        stress_time,
        stress_radial,
        stress_angular,
        box_w_varphi,
        inverse_metric_angular,
        exp_2f0,
    )
    if not all(math.isfinite(value) for value in finite_values):
        raise ValueError("radial residual left the finite binary64 domain")

    def canonical(value: float) -> float:
        return 0.0 if value == 0.0 else value

    return SphericalRadialResidual(
        solved=tuple(canonical(value) for value in solved),
        unused_constraints=tuple(canonical(value) for value in unused),
        normalized_solved=tuple(canonical(value) for value in normalized_solved),
        normalized_unused_constraints=tuple(
            canonical(value) for value in normalized_unused
        ),
        einstein_mixed_diagonal=(
            canonical(g_time),
            canonical(g_radial),
            canonical(g_angular),
            canonical(g_angular),
        ),
        stress_mixed_diagonal=(
            canonical(stress_time),
            canonical(stress_radial),
            canonical(stress_angular),
            canonical(stress_angular),
        ),
        box_w_varphi=canonical(box_w_varphi),
    )


__all__ = [
    "ANALYTIC_FORM_VERSION",
    "RadialJet",
    "SOLVED_RESIDUAL_ORDER",
    "SphericalRadialResidual",
    "UNUSED_CONSTRAINT_ORDER",
    "evaluate_spherical_radial_residual",
]
