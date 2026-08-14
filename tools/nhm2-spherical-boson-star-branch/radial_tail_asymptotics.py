"""Leading asymptotic coefficients for the frozen spherical radial EKG rows.

The finite formulas in this module encode only the vacuum 1/x metric sector
through x^-2 and the leading scalar exponential/power exponent.  They do not
construct a finite tail representative, bound a remainder, or solve the BVP.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Final

from binary64_environment import nearest_binary64


TAIL_ASYMPTOTIC_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_1s_radial_ekg_leading_tail/v1"
)


@dataclass(frozen=True, slots=True)
class SphericalRadialLeadingTail:
    w: float
    kappa: float
    adm_mass_coefficient: float
    F0_x_minus_1: float
    F0_x_minus_2: float
    F1_x_minus_1: float
    F1_x_minus_2: float
    scalar_power_sigma: float
    scalar_principal_amplitude: float
    analytic_form_version: str = TAIL_ASYMPTOTIC_VERSION
    calculation_implemented: bool = True
    finite_tail_representative_implemented: bool = False
    all_order_recurrence_implemented: bool = False
    outward_remainder_bound_implemented: bool = False
    tail_replay_authority: bool = False
    branch_solver_implemented: bool = False
    candidate_executed: bool = False
    branch_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False
    target_or_residual_array_input_read: bool = False
    declared_lever_tensor_read: bool = False


def _finite(name: str, value: object) -> float:
    if type(value) not in (int, float):
        raise ValueError(f"{name} must be an exact finite real scalar")
    scalar = float(value)
    if not math.isfinite(scalar):
        raise ValueError(f"{name} must be finite")
    return 0.0 if scalar == 0.0 else scalar


def _canonical(name: str, value: float) -> float:
    if not math.isfinite(value):
        raise ValueError(f"{name} left the finite binary64 domain")
    return 0.0 if value == 0.0 else value


@nearest_binary64
def derive_spherical_radial_leading_tail(
    *,
    w: float,
    adm_mass_coefficient: float,
    scalar_principal_amplitude: float,
) -> SphericalRadialLeadingTail:
    """Derive kappa, metric x^-1/x^-2 terms, and scalar power sigma."""

    frequency = _finite("w", w)
    mass = _finite("adm_mass_coefficient", adm_mass_coefficient)
    amplitude = _finite("scalar_principal_amplitude", scalar_principal_amplitude)
    if not 0.0 < frequency < 1.0:
        raise ValueError("w must satisfy 0<w<1")
    if not mass > 0.0:
        raise ValueError("adm_mass_coefficient must be strictly positive")
    if not amplitude > 0.0:
        raise ValueError("scalar_principal_amplitude must be strictly positive")
    kappa = math.sqrt((1.0 - frequency) * (1.0 + frequency))
    if not math.isfinite(kappa) or not kappa > 0.0:
        raise ValueError("kappa left the finite positive domain")
    sigma = mass * (2.0 * frequency * frequency - 1.0) / kappa - 1.0
    return SphericalRadialLeadingTail(
        w=frequency,
        kappa=_canonical("kappa", kappa),
        adm_mass_coefficient=mass,
        F0_x_minus_1=_canonical("F0_x_minus_1", -mass),
        F0_x_minus_2=0.0,
        F1_x_minus_1=mass,
        F1_x_minus_2=_canonical("F1_x_minus_2", -mass * mass / 4.0),
        scalar_power_sigma=_canonical("scalar_power_sigma", sigma),
        scalar_principal_amplitude=amplitude,
    )


__all__ = [
    "SphericalRadialLeadingTail",
    "TAIL_ASYMPTOTIC_VERSION",
    "derive_spherical_radial_leading_tail",
]
