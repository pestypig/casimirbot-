"""Frozen primary dense-LU and three-pass refinement primitive.

This module implements only the bounded scalar binary64 Doolittle solve and
the three literal MPFR256 residual-refinement passes.  It does not implement
Newton control, select or execute a candidate, materialize output, or confer
scientific, replay, acceptance, propulsion, or transport authority.
"""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
import hashlib
import math
from pathlib import Path
import struct
import sys
from types import MappingProxyType, ModuleType
from typing import Final, Iterator

import gmpy2


DENSE_LU_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_seed_primary_dense_lu/v1"
)
PRIMARY_NUMERICS_POLICY_SHA256: Final[str] = (
    "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4"
)
PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES: Final[int] = 80_055
BINARY64_ENVIRONMENT_SOURCE_SHA256: Final[str] = (
    "8d452abdfa6d9b3e0cf92aa7d8682202b588f1fe8b0fe0772c6d003d2d12f1a4"
)
BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES: Final[int] = 14_980
MAXIMUM_SYSTEM_ORDER: Final[int] = 257
REFINEMENT_PASSES: Final[int] = 3
MPFR_PRECISION_BITS: Final[int] = 256
MPFR_ROUNDING_MODE: Final[str] = "MPFR_RNDN"
MPFR_EMIN: Final[int] = -1_000_000
MPFR_EMAX: Final[int] = 1_000_000

FACTOR_OPERATION_GRAPH: Final[str] = (
    "k_increasing;pivot_rows_k_through_last_increasing_strict_abs_greater_only;"
    "swap_complete_rows_and_permutation;for_i_increasing_Lik=div_then_for_j_"
    "increasing_product=mul_and_Aij=sub;one_factorization_only"
)
SOLVE_OPERATION_GRAPH: Final[str] = (
    "apply_recorded_permutation;forward_i_increasing_j_0_to_i_minus_1_mul_then_"
    "sub;backward_i_decreasing_j_i_plus_1_to_last_increasing_mul_then_sub_then_div"
)
REFINEMENT_OPERATION_GRAPH: Final[str] = (
    "exactly_three_passes;for_each_i_set_ui_acc_zero;for_j_increasing_set_d_J_"
    "set_d_x_mul_add_set;set_d_b_sub;one_get_d_per_i;solve_same_LU;binary64_"
    "solution_add_i_increasing;no_refactor_or_early_exit"
)


class DenseLuError(ValueError):
    """Fail-closed dense-LU error with a deterministic code."""

    def __init__(self, code: str, detail: str) -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


_BINARY64_ENVIRONMENT_PATH: Final[Path] = (
    Path(__file__).resolve().with_name("binary64_environment.py")
)
_PRIVATE_BINARY64_ENVIRONMENT_MODULE_NAME: Final[str] = (
    "_nhm2_seed_dense_lu_fenv_8d452abdfa6d9b3e"
)
_MISSING_MODULE: Final[object] = object()


def _read_bound_binary64_environment_source() -> bytes:
    try:
        source = _BINARY64_ENVIRONMENT_PATH.read_bytes()
    except OSError as error:
        raise DenseLuError(
            "binary64_environment_source_unavailable", type(error).__name__
        ) from error
    if len(source) != BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES:
        raise DenseLuError("binary64_environment_source_mismatch", "size")
    if hashlib.sha256(source).hexdigest() != BINARY64_ENVIRONMENT_SOURCE_SHA256:
        raise DenseLuError("binary64_environment_source_mismatch", "sha256")
    return source


def _load_private_binary64_environment() -> ModuleType:
    source = _read_bound_binary64_environment_source()
    module = ModuleType(_PRIVATE_BINARY64_ENVIRONMENT_MODULE_NAME)
    module.__file__ = str(_BINARY64_ENVIRONMENT_PATH)
    module.__package__ = ""
    previous = sys.modules.get(
        _PRIVATE_BINARY64_ENVIRONMENT_MODULE_NAME,
        _MISSING_MODULE,
    )
    sys.modules[_PRIVATE_BINARY64_ENVIRONMENT_MODULE_NAME] = module
    try:
        code = compile(
            source,
            str(_BINARY64_ENVIRONMENT_PATH),
            "exec",
            dont_inherit=True,
            optimize=0,
        )
        exec(code, module.__dict__)
    except Exception as error:
        raise DenseLuError(
            "binary64_environment_private_load_failed",
            type(error).__name__,
        ) from error
    finally:
        if previous is _MISSING_MODULE:
            del sys.modules[_PRIVATE_BINARY64_ENVIRONMENT_MODULE_NAME]
        else:
            sys.modules[_PRIVATE_BINARY64_ENVIRONMENT_MODULE_NAME] = previous
    if (
        getattr(module, "BINARY64_ENVIRONMENT_VERSION", None)
        != "nhm2_spherical_boson_star_seed_producer_binary64_environment/v1"
        or any(value is not False for value in module.AUTHORITY_LOCKS.values())
    ):
        raise DenseLuError("binary64_environment_private_module_invalid", "literal")
    return module


# Execute only the authenticated bytes in a private, nonpersistent namespace.
# A public ``sys.modules['binary64_environment']`` entry is never consulted.
_binary64_environment = _load_private_binary64_environment()


@dataclass(frozen=True, slots=True)
class FrozenDenseLuResult:
    order: int
    solution: tuple[float, ...]
    pivot_row_at_step: tuple[int, ...]
    final_permutation: tuple[int, ...]
    refinement_residuals: tuple[tuple[float, ...], ...]
    refinement_passes: int
    factorization_count: int
    factored_solve_count: int
    mpfr_residual_evaluation_count: int
    mpfr_get_d_count: int
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    binary64_environment_source_sha256: str
    binary64_environment_source_size_bytes: int
    binary64_runtime_family: str
    mpfr_precision_bits: int
    mpfr_rounding_mode: str
    mpfr_emin: int
    mpfr_emax: int
    observed_gmpy2_version: str
    observed_mpfr_version: str
    calculation_implemented: bool = True
    unfactored_operands_retained: bool = True
    exact_absolute_tie_lowest_row: bool = True
    one_factorization_only: bool = True
    exactly_three_refinement_passes: bool = True
    equilibration_used: bool = False
    fma_used: bool = False
    blas_used: bool = False
    retry_allowed: bool = False
    early_exit_allowed: bool = False
    newton_implemented: bool = False
    candidate_execution_authorized: bool = False
    candidate_executed: bool = False
    candidate_output_materialized: bool = False
    output_present: bool = False
    output_accepted: bool = False
    seed_accepted: bool = False
    branch_accepted: bool = False
    nondegeneracy_accepted: bool = False
    replay_authority: bool = False
    independent_agreement: bool = False
    semiclassical_stress_noise_lamp: bool = False
    semiclassical_constraint_algebra_lamp: bool = False
    diagnostic_pass_authority: bool = False
    candidate_authority: bool = False
    theory_graph_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False


AUTHORITY_LOCKS: Final = MappingProxyType(
    {
        "primaryNumericsSemanticAuthority": False,
        "fixtureRuntimeAuthority": False,
        "implementationClosureComplete": False,
        "runtimeClosureComplete": False,
        "sourceManifestAuthority": False,
        "toolchainAuthority": False,
        "executableAuthority": False,
        "runtimeAuthority": False,
        "preexecutionPresealPresent": False,
        "executionAuthorized": False,
        "executionObserved": False,
        "outputPresent": False,
        "outputAccepted": False,
        "seedAccepted": False,
        "branchAccepted": False,
        "nondegeneracyAccepted": False,
        "runReplayAccepted": False,
        "independentAgreementAccepted": False,
        "semiclassicalStressNoiseLamp": False,
        "semiclassicalConstraintAlgebraLamp": False,
        "diagnosticPass": False,
        "candidateAuthority": False,
        "theoryGraphAuthority": False,
        "physicalViability": False,
        "propulsion": False,
        "transport": False,
    }
)


def _negative_zero(value: float) -> bool:
    return value == 0.0 and struct.pack("<d", value) == bytes.fromhex(
        "0000000000000080"
    )


def _verify_literal_bindings() -> None:
    _read_bound_binary64_environment_source()
    if any(value is not False for value in _binary64_environment.AUTHORITY_LOCKS.values()):
        raise DenseLuError("binary64_environment_authority_lock_invalid", "root")


def _validate_binary64(value: object, detail: str) -> float:
    if type(value) is not float:
        raise DenseLuError("dense_lu_binary64_type_invalid", detail)
    if not math.isfinite(value):
        raise DenseLuError("dense_lu_nonfinite_input", detail)
    if _negative_zero(value):
        raise DenseLuError("dense_lu_negative_zero_input", detail)
    return 0.0 if value == 0.0 else value


def _validate_system(
    matrix: object,
    right_hand_side: object,
) -> tuple[tuple[tuple[float, ...], ...], tuple[float, ...]]:
    if type(matrix) is not tuple:
        raise DenseLuError("dense_lu_matrix_type_invalid", type(matrix).__name__)
    if type(right_hand_side) is not tuple:
        raise DenseLuError(
            "dense_lu_right_hand_side_type_invalid",
            type(right_hand_side).__name__,
        )
    order = len(matrix)
    if order < 1 or order > MAXIMUM_SYSTEM_ORDER:
        raise DenseLuError("dense_lu_order_invalid", str(order))
    if len(right_hand_side) != order:
        raise DenseLuError(
            "dense_lu_right_hand_side_length_invalid",
            f"{len(right_hand_side)}!={order}",
        )

    retained_rows: list[tuple[float, ...]] = []
    for row_index, row in enumerate(matrix):
        if type(row) is not tuple or len(row) != order:
            raise DenseLuError("dense_lu_matrix_row_invalid", str(row_index))
        retained_row: list[float] = []
        for column_index, value in enumerate(row):
            retained_row.append(
                _validate_binary64(value, f"matrix[{row_index},{column_index}]")
            )
        retained_rows.append(tuple(retained_row))

    retained_rhs = tuple(
        _validate_binary64(value, f"right_hand_side[{index}]")
        for index, value in enumerate(right_hand_side)
    )
    return tuple(retained_rows), retained_rhs


def _finish_binary64(value: float, operation: str) -> float:
    if not math.isfinite(value):
        raise DenseLuError("dense_lu_nonfinite_intermediate", operation)
    return 0.0 if value == 0.0 else value


def _add64(left: float, right: float, operation: str) -> float:
    return _finish_binary64(left + right, operation)


def _sub64(left: float, right: float, operation: str) -> float:
    return _finish_binary64(left - right, operation)


def _mul64(left: float, right: float, operation: str) -> float:
    return _finish_binary64(left * right, operation)


def _div64(numerator: float, denominator: float, operation: str) -> float:
    if denominator == 0.0:
        raise DenseLuError("dense_lu_division_by_zero", operation)
    return _finish_binary64(numerator / denominator, operation)


def _factor_once(
    unfactored: tuple[tuple[float, ...], ...],
) -> tuple[list[list[float]], tuple[int, ...], tuple[int, ...]]:
    order = len(unfactored)
    factors = [list(row) for row in unfactored]
    permutation = list(range(order))
    pivot_rows: list[int] = []

    for step in range(order):
        selected_row = step
        selected_magnitude = abs(factors[step][step])
        for row in range(step + 1, order):
            candidate_magnitude = abs(factors[row][step])
            if candidate_magnitude > selected_magnitude:
                selected_magnitude = candidate_magnitude
                selected_row = row
        if not math.isfinite(selected_magnitude) or selected_magnitude == 0.0:
            raise DenseLuError("dense_lu_pivot_invalid", str(step))
        pivot_rows.append(selected_row)

        if selected_row != step:
            for column in range(order):
                temporary = factors[step][column]
                factors[step][column] = factors[selected_row][column]
                factors[selected_row][column] = temporary
            temporary_permutation = permutation[step]
            permutation[step] = permutation[selected_row]
            permutation[selected_row] = temporary_permutation

        pivot = factors[step][step]
        if not math.isfinite(pivot) or pivot == 0.0:
            raise DenseLuError("dense_lu_pivot_invalid", str(step))
        for row in range(step + 1, order):
            multiplier = _div64(
                factors[row][step],
                pivot,
                f"factor.multiplier[{row},{step}]",
            )
            factors[row][step] = multiplier
            for column in range(step + 1, order):
                product = _mul64(
                    multiplier,
                    factors[step][column],
                    f"factor.product[{row},{column}]",
                )
                factors[row][column] = _sub64(
                    factors[row][column],
                    product,
                    f"factor.update[{row},{column}]",
                )

    return factors, tuple(permutation), tuple(pivot_rows)


def _solve_factored(
    factors: list[list[float]],
    permutation: tuple[int, ...],
    right_hand_side: tuple[float, ...],
) -> tuple[float, ...]:
    order = len(factors)
    permuted = tuple(right_hand_side[permutation[row]] for row in range(order))
    forward = [0.0 for _ in range(order)]
    for row in range(order):
        accumulator = permuted[row]
        for column in range(row):
            product = _mul64(
                factors[row][column],
                forward[column],
                f"forward.product[{row},{column}]",
            )
            accumulator = _sub64(
                accumulator,
                product,
                f"forward.accumulator[{row},{column}]",
            )
        forward[row] = accumulator

    solution = [0.0 for _ in range(order)]
    for row in range(order - 1, -1, -1):
        accumulator = forward[row]
        for column in range(row + 1, order):
            product = _mul64(
                factors[row][column],
                solution[column],
                f"backward.product[{row},{column}]",
            )
            accumulator = _sub64(
                accumulator,
                product,
                f"backward.accumulator[{row},{column}]",
            )
        pivot = factors[row][row]
        if not math.isfinite(pivot) or pivot == 0.0:
            raise DenseLuError("dense_lu_back_pivot_invalid", str(row))
        solution[row] = _div64(
            accumulator,
            pivot,
            f"backward.solution[{row}]",
        )
    return tuple(solution)


def _owned_context_template() -> gmpy2.context:
    template = gmpy2.get_context().copy()
    template.precision = MPFR_PRECISION_BITS
    template.round = gmpy2.RoundToNearest
    template.emin = MPFR_EMIN
    template.emax = MPFR_EMAX
    template.subnormalize = False
    template.trap_underflow = False
    template.trap_overflow = False
    template.trap_inexact = False
    template.trap_invalid = False
    template.trap_erange = False
    template.trap_divzero = False
    template.underflow = False
    template.overflow = False
    template.inexact = False
    template.invalid = False
    template.erange = False
    template.divzero = False
    template.allow_complex = False
    template.rational_division = False
    template.allow_release_gil = False
    return template


@contextmanager
def _owned_mpfr256_context() -> Iterator[gmpy2.context]:
    with gmpy2.context(_owned_context_template()):
        context = gmpy2.get_context()
        if (
            context.precision != MPFR_PRECISION_BITS
            or context.round != gmpy2.RoundToNearest
            or context.emin != MPFR_EMIN
            or context.emax != MPFR_EMAX
            or context.subnormalize
            or context.allow_complex
            or context.rational_division
            or context.allow_release_gil
        ):
            raise DenseLuError("dense_lu_mpfr_context_installation_failed", "root")
        context.clear_flags()
        yield context


def _check_mpfr_flags(context: gmpy2.context, operation: str) -> None:
    bad = tuple(
        name
        for name in ("invalid", "divzero", "overflow", "underflow", "erange")
        if bool(getattr(context, name))
    )
    if bad:
        raise DenseLuError(
            "dense_lu_mpfr_exceptional_flag",
            f"{operation}:{','.join(bad)}",
        )


def _mpfr_positive_zero(context: gmpy2.context) -> gmpy2.mpfr:
    context.clear_flags()
    value = gmpy2.mpfr(0, MPFR_PRECISION_BITS)
    _check_mpfr_flags(context, "set_positive_zero")
    if not gmpy2.is_zero(value) or gmpy2.is_signed(value):
        raise DenseLuError("dense_lu_mpfr_positive_zero_failure", "root")
    return value


def _finish_mpfr(
    context: gmpy2.context,
    value: gmpy2.mpfr,
    operation: str,
) -> gmpy2.mpfr:
    _check_mpfr_flags(context, operation)
    if not gmpy2.is_finite(value):
        raise DenseLuError("dense_lu_mpfr_nonfinite", operation)
    return _mpfr_positive_zero(context) if gmpy2.is_zero(value) else value


def _mpfr_set_ui(
    context: gmpy2.context,
    value: int,
    operation: str,
) -> gmpy2.mpfr:
    if type(value) is not int or value < 0:
        raise DenseLuError("dense_lu_mpfr_set_ui_domain_invalid", operation)
    context.clear_flags()
    result = _finish_mpfr(
        context,
        gmpy2.mpfr(value, MPFR_PRECISION_BITS),
        operation,
    )
    if context.inexact:
        raise DenseLuError("dense_lu_mpfr_set_ui_inexact", operation)
    return result


def _mpfr_set_d(
    context: gmpy2.context,
    value: float,
    operation: str,
) -> gmpy2.mpfr:
    context.clear_flags()
    result = _finish_mpfr(
        context,
        gmpy2.mpfr(value, MPFR_PRECISION_BITS),
        operation,
    )
    if context.inexact:
        raise DenseLuError("dense_lu_mpfr_set_d_inexact", operation)
    return result


def _mpfr_copy(
    context: gmpy2.context,
    value: gmpy2.mpfr,
    operation: str,
) -> gmpy2.mpfr:
    context.clear_flags()
    result = _finish_mpfr(
        context,
        gmpy2.mpfr(value, MPFR_PRECISION_BITS),
        operation,
    )
    if context.inexact:
        raise DenseLuError("dense_lu_mpfr_set_inexact", operation)
    return result


def _mpfr_mul(
    context: gmpy2.context,
    left: gmpy2.mpfr,
    right: gmpy2.mpfr,
    operation: str,
) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish_mpfr(context, gmpy2.mul(left, right), operation)


def _mpfr_add(
    context: gmpy2.context,
    left: gmpy2.mpfr,
    right: gmpy2.mpfr,
    operation: str,
) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish_mpfr(context, gmpy2.add(left, right), operation)


def _mpfr_sub(
    context: gmpy2.context,
    left: gmpy2.mpfr,
    right: gmpy2.mpfr,
    operation: str,
) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish_mpfr(context, gmpy2.sub(left, right), operation)


def _mpfr_get_d(
    context: gmpy2.context,
    value: gmpy2.mpfr,
    operation: str,
) -> float:
    context.clear_flags()
    result = float(value)
    _check_mpfr_flags(context, operation)
    if not math.isfinite(result):
        raise DenseLuError("dense_lu_mpfr_get_d_nonfinite", operation)
    if result == 0.0 and not gmpy2.is_zero(value):
        raise DenseLuError("dense_lu_mpfr_get_d_underflow", operation)
    result = 0.0 if result == 0.0 else result
    if _negative_zero(result):
        raise DenseLuError("dense_lu_mpfr_get_d_negative_zero", operation)
    return result


def _mpfr_residual(
    context: gmpy2.context,
    unfactored: tuple[tuple[float, ...], ...],
    right_hand_side: tuple[float, ...],
    solution: tuple[float, ...],
    pass_index: int,
) -> tuple[float, ...]:
    order = len(unfactored)
    residual: list[float] = []
    for row in range(order):
        accumulator = _mpfr_set_ui(
            context,
            0,
            f"refinement[{pass_index}].row[{row}].set_accumulator",
        )
        for column in range(order):
            matrix_value = _mpfr_set_d(
                context,
                unfactored[row][column],
                f"refinement[{pass_index}].row[{row}].set_matrix[{column}]",
            )
            solution_value = _mpfr_set_d(
                context,
                solution[column],
                f"refinement[{pass_index}].row[{row}].set_solution[{column}]",
            )
            product = _mpfr_mul(
                context,
                matrix_value,
                solution_value,
                f"refinement[{pass_index}].row[{row}].multiply[{column}]",
            )
            next_accumulator = _mpfr_add(
                context,
                accumulator,
                product,
                f"refinement[{pass_index}].row[{row}].add[{column}]",
            )
            accumulator = _mpfr_copy(
                context,
                next_accumulator,
                f"refinement[{pass_index}].row[{row}].set_accumulator[{column}]",
            )
        rhs_value = _mpfr_set_d(
            context,
            right_hand_side[row],
            f"refinement[{pass_index}].row[{row}].set_rhs",
        )
        residual_value = _mpfr_sub(
            context,
            rhs_value,
            accumulator,
            f"refinement[{pass_index}].row[{row}].subtract",
        )
        residual.append(
            _mpfr_get_d(
                context,
                residual_value,
                f"refinement[{pass_index}].row[{row}].get_d",
            )
        )
    return tuple(residual)


def solve_frozen_dense_lu(
    *,
    matrix: tuple[tuple[float, ...], ...],
    right_hand_side: tuple[float, ...],
) -> FrozenDenseLuResult:
    """Factor once and apply exactly three MPFR residual refinements."""

    _verify_literal_bindings()
    with (
        _binary64_environment.nearest_binary64_environment(),
        _owned_mpfr256_context() as mpfr_context,
    ):
        unfactored, retained_rhs = _validate_system(matrix, right_hand_side)
        factors, permutation, pivot_rows = _factor_once(unfactored)
        solution = _solve_factored(factors, permutation, retained_rhs)
        residual_diagnostics: list[tuple[float, ...]] = []
        for pass_index in range(REFINEMENT_PASSES):
            residual = _mpfr_residual(
                mpfr_context,
                unfactored,
                retained_rhs,
                solution,
                pass_index,
            )
            residual_diagnostics.append(residual)
            correction = _solve_factored(factors, permutation, residual)
            updated_solution: list[float] = []
            for index in range(len(solution)):
                updated_solution.append(
                    _add64(
                        solution[index],
                        correction[index],
                        f"refinement[{pass_index}].solution_add[{index}]",
                    )
                )
            solution = tuple(updated_solution)

        return FrozenDenseLuResult(
            order=len(unfactored),
            solution=solution,
            pivot_row_at_step=pivot_rows,
            final_permutation=permutation,
            refinement_residuals=tuple(residual_diagnostics),
            refinement_passes=REFINEMENT_PASSES,
            factorization_count=1,
            factored_solve_count=1 + REFINEMENT_PASSES,
            mpfr_residual_evaluation_count=REFINEMENT_PASSES,
            mpfr_get_d_count=REFINEMENT_PASSES * len(unfactored),
            primary_numerics_policy_sha256=PRIMARY_NUMERICS_POLICY_SHA256,
            primary_numerics_policy_canonical_size_bytes=(
                PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
            ),
            binary64_environment_source_sha256=(
                BINARY64_ENVIRONMENT_SOURCE_SHA256
            ),
            binary64_environment_source_size_bytes=(
                BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
            ),
            binary64_runtime_family=(
                _binary64_environment.BINARY64_RUNTIME_FAMILY
            ),
            mpfr_precision_bits=MPFR_PRECISION_BITS,
            mpfr_rounding_mode=MPFR_ROUNDING_MODE,
            mpfr_emin=MPFR_EMIN,
            mpfr_emax=MPFR_EMAX,
            observed_gmpy2_version=gmpy2.version(),
            observed_mpfr_version=gmpy2.mpfr_version(),
        )


if (
    len(PRIMARY_NUMERICS_POLICY_SHA256) != 64
    or PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES != 80_055
    or len(BINARY64_ENVIRONMENT_SOURCE_SHA256) != 64
    or BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES != 14_980
    or MAXIMUM_SYSTEM_ORDER != 257
    or REFINEMENT_PASSES != 3
    or MPFR_PRECISION_BITS != 256
    or MPFR_EMIN != -1_000_000
    or MPFR_EMAX != 1_000_000
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("spherical_seed_primary_dense_lu_invariant")


__all__ = [
    "AUTHORITY_LOCKS",
    "BINARY64_ENVIRONMENT_SOURCE_SHA256",
    "BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES",
    "DENSE_LU_VERSION",
    "DenseLuError",
    "FACTOR_OPERATION_GRAPH",
    "FrozenDenseLuResult",
    "MAXIMUM_SYSTEM_ORDER",
    "MPFR_EMAX",
    "MPFR_EMIN",
    "MPFR_PRECISION_BITS",
    "MPFR_ROUNDING_MODE",
    "PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES",
    "PRIMARY_NUMERICS_POLICY_SHA256",
    "REFINEMENT_OPERATION_GRAPH",
    "REFINEMENT_PASSES",
    "SOLVE_OPERATION_GRAPH",
    "solve_frozen_dense_lu",
]
