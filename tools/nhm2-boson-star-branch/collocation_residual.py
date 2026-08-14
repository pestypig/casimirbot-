"""Bounded collocation residual assembly for the frozen prolate branch BVP.

This module is an additive diagnostic component.  It snapshots four
caller-supplied nodal fields, constructs their barycentric derivatives on one
of the three frozen Lobatto levels, applies the frozen rho compactification,
and calls the symbolically derived coordinate-regular EKG kernel at
strict-interior collocation points.

The returned object deliberately remains *structured*.  The branch-BVP v1
contract does not freeze a flattened Newton/JFNK unknown or residual ABI, nor
does it assign the two continuous-peak equations to particular replacement
slots in such a vector.  Consequently this module exposes four full tau-row
planes plus the two global peak equations separately.  It performs no Newton
step, continuation, interpolation to an oversampled grid, branch/fold replay,
global-maximum proof, candidate emission, or authority promotion.
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
import importlib.util
import math
from pathlib import Path
from types import ModuleType
from typing import Final

import numpy as np

from covariant_residual import (
    FIELD_ORDER,
    SOLVED_RESIDUAL_ORDER,
    UNUSED_CONSTRAINT_ORDER,
    FieldJet,
)
from regular_residual import evaluate_interior_regular_residual


LEVEL_SHAPES: Final = ((16, 12), (32, 24), (64, 48))
AMPLITUDE_STAGES: Final = tuple(2.0**exponent for exponent in range(-16, -9))
PEAK_EQUATION_ORDER: Final = (
    "varphi_at_rho_peak_theta_zero_minus_amplitude",
    "partial_rho_varphi_at_rho_peak_theta_zero",
)
TAU_ROW_FIELD_ORDER: Final = FIELD_ORDER
BOUNDARY_ROW_KIND_ORDER: Final = (
    "origin_rho_zero",
    "infinity_rho_one",
    "north_axis_theta_zero",
    "equator_theta_pi_over_two",
)

_SOLVED_PDE_MAXIMUM: Final = 1.0e-9
_BOUNDARY_MAXIMUM: Final = 1.0e-10
_UNUSED_CONSTRAINT_MAXIMUM: Final = 1.0e-6
_CONICAL_MAXIMUM: Final = 1.0e-8
_AMPLITUDE_ERROR_MAXIMUM: Final = 1.0e-12
_ORIGIN_REGULARITY_MAXIMUM: Final = 1.0e-10
_ZERO_JET: Final = FieldJet(0.0, 0.0, 0.0, 0.0, 0.0, 0.0)


def _load_seed_spectral_primitives() -> ModuleType:
    """Load the existing Newtonian producer's exact spectral primitives.

    The repository directory names contain hyphens and are therefore not
    importable package identifiers.  Loading the file under a private module
    name reuses its Decimal node construction and barycentric matrices without
    mutating ``sys.path`` or copying a second numerical convention here.
    """

    path = (
        Path(__file__).resolve().parents[1]
        / "nhm2-boson-star-seed"
        / "producer"
        / "spectral.py"
    )
    spec = importlib.util.spec_from_file_location(
        "_nhm2_boson_star_seed_spectral_primitives",
        path,
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("frozen spectral primitive module could not be loaded")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


_SPECTRAL = _load_seed_spectral_primitives()


@dataclass(frozen=True)
class CollocationDiagnosticReport:
    """Finite observations over the computable subset of frozen rails."""

    solved_normalized_pde_linf: float
    boundary_condition_linf: float
    unused_constraint_normalized_linf: float
    axis_conical_linf: float
    amplitude_absolute_error: float
    peak_stationarity_absolute_residual: float
    peak_second_rho_derivative: float
    origin_metric_angular_constancy_linf: float
    origin_common_f1_f2_absolute_residual: float
    origin_a1: float
    origin_positive_dipole_slope_linf: float
    flat_space_solved_normalized_pde_linf: float
    flat_space_unused_constraint_normalized_linf: float
    solved_pde_within_frozen_maximum: bool
    boundary_conditions_within_frozen_maximum: bool
    unused_constraints_within_frozen_maximum: bool
    axis_conical_within_frozen_maximum: bool
    amplitude_within_frozen_maximum: bool
    origin_leading_regularity_within_frozen_maxima: bool
    flat_space_floor_below_frozen_pde_rails: bool
    computable_rail_subset_within_limits: bool
    flat_space_control_evaluated: bool = True
    flat_space_floor_subtracted: bool = False
    oversampled_covariant_grid_evaluated: bool = False
    continuous_global_maximum_uniqueness_evaluated: bool = False
    full_domain_parity_evaluated: bool = False
    adjacent_resolution_convergence_evaluated: bool = False
    branch_identity_replayed: bool = False
    no_fold_replayed: bool = False
    all_preregistered_rails_evaluated: bool = False
    diagnostic_pass_authority: bool = False
    branch_solved: bool = False
    candidate_admissible: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False


@dataclass(frozen=True)
class CollocationResidualAssembly:
    """Structured residual planes; intentionally not a flattened solver ABI."""

    level_shape: tuple[int, int]
    rho_nodes: np.ndarray
    theta_nodes: np.ndarray
    solved_tau_rows: np.ndarray
    solved_pde_raw: np.ndarray
    solved_pde_normalized: np.ndarray
    unused_constraints_raw: np.ndarray
    unused_constraints_normalized: np.ndarray
    peak_equations: tuple[float, float]
    w: float
    rho_peak: float
    target_amplitude: float
    report: CollocationDiagnosticReport
    tau_row_field_order: tuple[str, ...] = TAU_ROW_FIELD_ORDER
    solved_residual_order: tuple[str, ...] = SOLVED_RESIDUAL_ORDER
    unused_constraint_order: tuple[str, ...] = UNUSED_CONSTRAINT_ORDER
    peak_equation_order: tuple[str, ...] = PEAK_EQUATION_ORDER
    boundary_corner_precedence: str = (
        "radial_boundary_rows_replace_all_angular_rows_at_corners"
    )
    authority: str = "structured_collocation_diagnostic_only"
    flattened_newton_abi_present: bool = False
    newton_update_present: bool = False
    continuation_present: bool = False
    candidate_output_present: bool = False
    target_or_residual_array_input_read: bool = False
    declared_lever_tensor_read: bool = False
    diagnostic_pass_authority: bool = False
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
    return 0.0 if result == 0.0 else result


def _snapshot_field(name: str, value: object) -> np.ndarray:
    if type(value) is not np.ndarray:
        raise ValueError(f"{name} must be an exact numpy.ndarray")
    if value.dtype != np.dtype(np.float64):
        raise ValueError(f"{name} must have native float64 dtype")
    if value.ndim != 2 or tuple(value.shape) not in LEVEL_SHAPES:
        raise ValueError(f"{name} must have one frozen collocation level shape")
    if not value.flags.c_contiguous:
        raise ValueError(f"{name} must be C-contiguous")
    snapshot = np.array(value, dtype=np.float64, order="C", copy=True)
    if not np.all(np.isfinite(snapshot)):
        raise ValueError(f"{name} contains a nonfinite value")
    snapshot[snapshot == 0.0] = 0.0
    return snapshot


def _readonly_canonical(value: np.ndarray) -> np.ndarray:
    output = np.array(value, dtype=np.float64, order="C", copy=True)
    if not np.all(np.isfinite(output)):
        raise ValueError("collocation assembly produced a nonfinite value")
    output[output == 0.0] = 0.0
    output.setflags(write=False)
    return output


def _canonical_scalar(value: float) -> float:
    result = float(value)
    if not math.isfinite(result):
        raise ValueError("collocation assembly produced a nonfinite scalar")
    return 0.0 if result == 0.0 else result


def _barycentric_sample(
    values: np.ndarray,
    derivative: np.ndarray,
    rho_nodes: np.ndarray,
    rho_peak: float,
) -> tuple[float, float, float]:
    interpolation = _SPECTRAL.interpolation_matrix(
        rho_nodes,
        np.asarray([rho_peak], dtype=np.float64),
    )[0]
    first_nodal = derivative @ values
    second_nodal = derivative @ first_nodal
    return (
        _canonical_scalar(float(interpolation @ values)),
        _canonical_scalar(float(interpolation @ first_nodal)),
        _canonical_scalar(float(interpolation @ second_nodal)),
    )


def _maximum_absolute(values: np.ndarray) -> float:
    return _canonical_scalar(float(np.max(np.abs(values))))


@lru_cache(maxsize=len(LEVEL_SHAPES))
def _flat_space_numerical_floor(
    radial_count: int,
    angular_count: int,
) -> tuple[float, float]:
    """Measure, but never subtract, the same-grid binary64 flat-space floor."""

    if (radial_count, angular_count) not in LEVEL_SHAPES:
        raise ValueError("flat-space control requires one frozen level")
    rho_nodes, _ = _SPECTRAL.mapped_nodes(radial_count)
    theta_nodes, _ = _SPECTRAL.mapped_nodes(angular_count, angular=True)
    solved_linf = 0.0
    unused_linf = 0.0
    with np.errstate(divide="raise", invalid="raise", over="raise"):
        for radial_index in range(1, radial_count - 1):
            rho = float(rho_nodes[radial_index])
            x = rho / (1.0 - rho)
            for angular_index in range(1, angular_count - 1):
                try:
                    residual = evaluate_interior_regular_residual(
                        x=x,
                        theta=float(theta_nodes[angular_index]),
                        F0=_ZERO_JET,
                        F1=_ZERO_JET,
                        F2=_ZERO_JET,
                        varphi=_ZERO_JET,
                        # Flat vacuum is independent of w; use one exact
                        # interior binary64 value for the numerical control.
                        w=0.5,
                    )
                except ValueError as error:
                    raise ValueError(
                        "flat-space control failed at collocation index "
                        f"({radial_index},{angular_index})",
                    ) from error
                solved_linf = max(solved_linf, *residual.normalized_solved)
                unused_linf = max(
                    unused_linf,
                    *residual.normalized_unused_constraints,
                )
    return _canonical_scalar(solved_linf), _canonical_scalar(unused_linf)


def assemble_collocation_residual(
    *,
    F0: np.ndarray,
    F1: np.ndarray,
    F2: np.ndarray,
    varphi: np.ndarray,
    w: float,
    rho_peak: float,
    target_amplitude: float,
) -> CollocationResidualAssembly:
    """Assemble the frozen structured tau/PDE/constraint diagnostics.

    Each full tau plane is paired positionally with ``FIELD_ORDER``.  Strict
    interior entries carry the corresponding solved covariant PDE.  Boundary
    entries carry the ordered boundary operator for that field; radial rows
    are written last so they have exact precedence at all four corners.
    """

    fields = tuple(
        _snapshot_field(name, value)
        for name, value in zip(FIELD_ORDER, (F0, F1, F2, varphi), strict=True)
    )
    shape = tuple(fields[0].shape)
    if any(tuple(field.shape) != shape for field in fields[1:]):
        raise ValueError("all fields must have the same frozen level shape")

    w_value = _finite_scalar("w", w)
    rho_peak_value = _finite_scalar("rho_peak", rho_peak)
    amplitude_value = _finite_scalar("target_amplitude", target_amplitude)
    if not 0.0 < w_value < 1.0:
        raise ValueError("w must satisfy the frozen branch range 0<w<1")
    if not 0.0 < rho_peak_value < 1.0:
        raise ValueError("rho_peak must lie strictly inside the frozen domain")
    if amplitude_value not in AMPLITUDE_STAGES:
        raise ValueError("target_amplitude must be one frozen continuation amplitude")

    radial_count, angular_count = shape
    rho_nodes, unused_z = _SPECTRAL.mapped_nodes(radial_count)
    if unused_z is not None:  # pragma: no cover - spectral primitive invariant
        raise RuntimeError("radial mapped-node primitive returned angular data")
    theta_nodes, cos_theta = _SPECTRAL.mapped_nodes(
        angular_count,
        angular=True,
    )
    if cos_theta is None:  # pragma: no cover - spectral primitive invariant
        raise RuntimeError("angular mapped-node primitive omitted analytic cosine")
    d_rho = _SPECTRAL.differentiation_matrix(radial_count)
    d_theta = _SPECTRAL.differentiation_matrix(angular_count, angular=True)

    rho_nodes = np.asarray(rho_nodes, dtype=np.float64)
    theta_nodes = np.asarray(theta_nodes, dtype=np.float64)
    try:
        with np.errstate(divide="raise", invalid="raise", over="raise"):
            radial_first = tuple(d_rho @ field for field in fields)
            radial_second = tuple(d_rho @ first for first in radial_first)
            angular_first = tuple(field @ d_theta.T for field in fields)
            angular_second = tuple(first @ d_theta.T for first in angular_first)
            mixed_rho_theta = tuple(d_rho @ field @ d_theta.T for field in fields)
    except FloatingPointError as error:
        raise ValueError(
            "collocation differentiation left the finite binary64 domain",
        ) from error

    interior_shape = (radial_count - 2, angular_count - 2)
    solved_raw = np.empty((4, *interior_shape), dtype=np.float64)
    solved_normalized = np.empty_like(solved_raw)
    unused_raw = np.empty((2, *interior_shape), dtype=np.float64)
    unused_normalized = np.empty_like(unused_raw)

    with np.errstate(divide="raise", invalid="raise", over="raise"):
        for radial_index in range(1, radial_count - 1):
            rho = float(rho_nodes[radial_index])
            one_minus_rho = 1.0 - rho
            x = rho / one_minus_rho
            first_scale = one_minus_rho * one_minus_rho
            second_scale = first_scale * first_scale
            second_correction = -2.0 * one_minus_rho * first_scale
            for angular_index in range(1, angular_count - 1):
                jets = tuple(
                    FieldJet(
                        value=float(field[radial_index, angular_index]),
                        dx=float(
                            first_scale
                            * dr[radial_index, angular_index]
                        ),
                        dtheta=float(dt[radial_index, angular_index]),
                        dxx=float(
                            second_scale
                            * drr[radial_index, angular_index]
                            + second_correction
                            * dr[radial_index, angular_index]
                        ),
                        dxtheta=float(
                            first_scale
                            * drt[radial_index, angular_index]
                        ),
                        dthetatheta=float(dtt[radial_index, angular_index]),
                    )
                    for field, dr, drr, dt, dtt, drt in zip(
                        fields,
                        radial_first,
                        radial_second,
                        angular_first,
                        angular_second,
                        mixed_rho_theta,
                        strict=True,
                    )
                )
                try:
                    residual = evaluate_interior_regular_residual(
                        x=x,
                        theta=float(theta_nodes[angular_index]),
                        F0=jets[0],
                        F1=jets[1],
                        F2=jets[2],
                        varphi=jets[3],
                        w=w_value,
                    )
                except ValueError as error:
                    raise ValueError(
                        "interior coordinate-regular residual failed at "
                        f"collocation index ({radial_index},{angular_index})",
                    ) from error
                output_index = (radial_index - 1, angular_index - 1)
                solved_raw[(slice(None), *output_index)] = residual.solved
                solved_normalized[(slice(None), *output_index)] = (
                    residual.normalized_solved
                )
                unused_raw[(slice(None), *output_index)] = (
                    residual.unused_constraints
                )
                unused_normalized[(slice(None), *output_index)] = (
                    residual.normalized_unused_constraints
                )

    # Begin with solved PDE entries on strict-interior rows.  Angular boundary
    # operators apply only to 1 <= j <= Nr-2.  Radial operators are assigned
    # last across every k, giving them literal, inspectable corner precedence.
    tau_rows = np.zeros((4, radial_count, angular_count), dtype=np.float64)
    tau_rows[:, 1:-1, 1:-1] = solved_raw
    for field_index in range(4):
        tau_rows[field_index, 1:-1, 0] = angular_first[field_index][1:-1, 0]
    for field_index in range(3):
        tau_rows[field_index, 1:-1, -1] = angular_first[field_index][1:-1, -1]
    tau_rows[3, 1:-1, -1] = fields[3][1:-1, -1]
    for field_index in range(3):
        tau_rows[field_index, 0, :] = radial_first[field_index][0, :]
    tau_rows[3, 0, :] = fields[3][0, :]
    for field_index in range(4):
        tau_rows[field_index, -1, :] = fields[field_index][-1, :]

    try:
        with np.errstate(divide="raise", invalid="raise", over="raise"):
            peak_value, peak_first, peak_second = _barycentric_sample(
                fields[3][:, 0],
                d_rho,
                rho_nodes,
                rho_peak_value,
            )
    except FloatingPointError as error:
        raise ValueError(
            "peak interpolation left the finite binary64 domain",
        ) from error
    peak_equations = (
        _canonical_scalar(peak_value - amplitude_value),
        peak_first,
    )

    boundary_mask = np.zeros((radial_count, angular_count), dtype=bool)
    boundary_mask[0, :] = True
    boundary_mask[-1, :] = True
    boundary_mask[1:-1, 0] = True
    boundary_mask[1:-1, -1] = True

    metric_origin_variation = max(
        _maximum_absolute(field[0, :] - field[0, 0])
        for field in fields[:3]
    )
    origin_common = _canonical_scalar(abs(fields[1][0, 0] - fields[2][0, 0]))
    origin_a1 = _canonical_scalar(float(radial_first[3][0, 0]))
    origin_dipole_error = _maximum_absolute(
        radial_first[3][0, :] - origin_a1 * np.asarray(cos_theta)
    )
    flat_solved_linf, flat_unused_linf = _flat_space_numerical_floor(
        radial_count,
        angular_count,
    )

    solved_linf = _maximum_absolute(solved_normalized)
    boundary_linf = _maximum_absolute(tau_rows[:, boundary_mask])
    unused_linf = _maximum_absolute(unused_normalized)
    conical_linf = _maximum_absolute(fields[1][:, 0] - fields[2][:, 0])
    amplitude_error = _canonical_scalar(abs(peak_equations[0]))
    origin_regular = (
        metric_origin_variation <= _ORIGIN_REGULARITY_MAXIMUM
        and origin_common <= _ORIGIN_REGULARITY_MAXIMUM
        and origin_a1 > 0.0
        and origin_dipole_error <= _ORIGIN_REGULARITY_MAXIMUM
    )
    flat_floor_below_rails = (
        flat_solved_linf <= _SOLVED_PDE_MAXIMUM
        and flat_unused_linf <= _UNUSED_CONSTRAINT_MAXIMUM
    )
    computable_subset = (
        solved_linf <= _SOLVED_PDE_MAXIMUM
        and boundary_linf <= _BOUNDARY_MAXIMUM
        and unused_linf <= _UNUSED_CONSTRAINT_MAXIMUM
        and conical_linf <= _CONICAL_MAXIMUM
        and amplitude_error <= _AMPLITUDE_ERROR_MAXIMUM
        and origin_regular
        and flat_floor_below_rails
    )
    report = CollocationDiagnosticReport(
        solved_normalized_pde_linf=solved_linf,
        boundary_condition_linf=boundary_linf,
        unused_constraint_normalized_linf=unused_linf,
        axis_conical_linf=conical_linf,
        amplitude_absolute_error=amplitude_error,
        peak_stationarity_absolute_residual=_canonical_scalar(abs(peak_first)),
        peak_second_rho_derivative=peak_second,
        origin_metric_angular_constancy_linf=metric_origin_variation,
        origin_common_f1_f2_absolute_residual=origin_common,
        origin_a1=origin_a1,
        origin_positive_dipole_slope_linf=origin_dipole_error,
        flat_space_solved_normalized_pde_linf=flat_solved_linf,
        flat_space_unused_constraint_normalized_linf=flat_unused_linf,
        solved_pde_within_frozen_maximum=solved_linf <= _SOLVED_PDE_MAXIMUM,
        boundary_conditions_within_frozen_maximum=(
            boundary_linf <= _BOUNDARY_MAXIMUM
        ),
        unused_constraints_within_frozen_maximum=(
            unused_linf <= _UNUSED_CONSTRAINT_MAXIMUM
        ),
        axis_conical_within_frozen_maximum=conical_linf <= _CONICAL_MAXIMUM,
        amplitude_within_frozen_maximum=(
            amplitude_error <= _AMPLITUDE_ERROR_MAXIMUM
        ),
        origin_leading_regularity_within_frozen_maxima=origin_regular,
        flat_space_floor_below_frozen_pde_rails=flat_floor_below_rails,
        computable_rail_subset_within_limits=computable_subset,
    )

    return CollocationResidualAssembly(
        level_shape=shape,
        rho_nodes=_readonly_canonical(rho_nodes),
        theta_nodes=_readonly_canonical(theta_nodes),
        solved_tau_rows=_readonly_canonical(tau_rows),
        solved_pde_raw=_readonly_canonical(solved_raw),
        solved_pde_normalized=_readonly_canonical(solved_normalized),
        unused_constraints_raw=_readonly_canonical(unused_raw),
        unused_constraints_normalized=_readonly_canonical(unused_normalized),
        peak_equations=peak_equations,
        w=w_value,
        rho_peak=rho_peak_value,
        target_amplitude=amplitude_value,
        report=report,
    )
