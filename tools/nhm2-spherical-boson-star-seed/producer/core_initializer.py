"""Frozen fixed-L0 MPFR256 initializer for the spherical seed core.

This module consumes only the authenticated N=64 Lobatto spectral primitive
and implements the primary-numerics fixed-L0 initializer graph.  It does not
iterate, solve, run Newton, publish a candidate, or confer execution,
scientific, acceptance, replay, propulsion, or transport authority.
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


CORE_INITIALIZER_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_seed_primary_fixed_l0_initializer/v1"
)
PRIMARY_NUMERICS_POLICY_SHA256: Final[str] = (
    "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4"
)
PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES: Final[int] = 80_055
PRIMARY_NUMERICS_POLICY_SHA256_DOMAIN: Final[str] = (
    "nhm2-spherical-boson-star-newtonian-seed-primary-numerics/v1\n"
)
SPECTRAL_SOURCE_SHA256: Final[str] = (
    "e9b2509b0c4a5d417250b3d145a648404cde440f12961d2faec1bc14758b78f7"
)
SPECTRAL_SOURCE_SIZE_BYTES: Final[int] = 19_045
SPECTRAL_N64_GOLDEN_SHA256: Final[str] = (
    "83f63880c10f9aafae4d3c173cbb11fabd1baecf1a67c29c3b3f75636536a680"
)
SPECTRAL_GOLDEN_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed-primary-spectral/golden/v1\n"
)

FIXED_NODE_COUNT: Final[int] = 64
MPFR_PRECISION_BITS: Final[int] = 256
MPFR_ROUNDING_MODE: Final[str] = "MPFR_RNDN"
MPFR_EMIN: Final[int] = -1_000_000
MPFR_EMAX: Final[int] = 1_000_000

KG_OPERATION_GRAPH: Final[str] = (
    "set_ui_7_set_ui_8_div_ratio_then_sqrt_firstRoot_then_sqrt_kg_then_one_"
    "get_d_RNDN_kg"
)
NU_OPERATION_GRAPH: Final[str] = (
    "set_d_kg64_then_mul_kgSquared_then_neg_then_set_ui_2_then_div_then_one_"
    "get_d_RNDN_nu"
)
INTERIOR_OPERATION_GRAPH: Final[str] = (
    "rho_j_increasing;MPFR_x=rho/(1-rho)_without_get_d;distinct_exp_minus_kgx_"
    "then_exp_minus_2kgx;for_n_1_2_3_4_factorial_then_series_j_increasing_"
    "then_denominator_power_index_increasing_then_I_n_then_J_n;u_grouping_"
    "then_V_I_grouping_then_V_J_grouping;one_get_d_RNDN_u_then_one_get_d_"
    "RNDN_V_per_stored_node"
)
ENDPOINT_OPERATION_GRAPH: Final[str] = (
    "j_0_exact_u_1_and_V_minus_9_over_8_kg64_squared;j_63_exact_positive_zero_"
    "u_and_V_without_subtract_divide_or_exp;one_get_d_RNDN_per_stored_field"
)
PACKING_OPERATION_GRAPH: Final[str] = (
    "z_L0_equals_u_nodes_increasing_then_V_nodes_increasing_then_exact_nu64"
)


class CoreInitializerError(ValueError):
    """Fail-closed fixed-L0 initializer error with a stable code."""

    def __init__(self, code: str, detail: str) -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


_SPECTRAL_PATH: Final[Path] = Path(__file__).resolve().with_name("spectral.py")


def _read_bound_spectral_source() -> bytes:
    try:
        source = _SPECTRAL_PATH.read_bytes()
    except OSError as error:
        raise CoreInitializerError(
            "initializer_spectral_source_binding_unavailable",
            type(error).__name__,
        ) from error
    if len(source) != SPECTRAL_SOURCE_SIZE_BYTES:
        raise CoreInitializerError(
            "initializer_spectral_source_binding_mismatch", "size"
        )
    if hashlib.sha256(source).hexdigest() != SPECTRAL_SOURCE_SHA256:
        raise CoreInitializerError(
            "initializer_spectral_source_binding_mismatch", "sha256"
        )
    return source


def _load_bound_spectral_module() -> ModuleType:
    source = _read_bound_spectral_source()
    module = ModuleType(
        "_nhm2_spherical_seed_initializer_spectral_e9b2509b0c4a5d41"
    )
    module.__file__ = str(_SPECTRAL_PATH)
    module.__package__ = ""
    missing = object()
    previous = sys.modules.get(module.__name__, missing)
    sys.modules[module.__name__] = module
    try:
        code = compile(
            source,
            str(_SPECTRAL_PATH),
            "exec",
            dont_inherit=True,
            optimize=0,
        )
        exec(code, module.__dict__)
    except Exception as error:
        raise CoreInitializerError(
            "initializer_spectral_private_load_failed", type(error).__name__
        ) from error
    finally:
        if previous is missing:
            del sys.modules[module.__name__]
        else:
            sys.modules[module.__name__] = previous
    if (
        not isinstance(getattr(module, "__file__", None), str)
        or Path(module.__file__).resolve() != _SPECTRAL_PATH
    ):
        raise CoreInitializerError(
            "initializer_spectral_module_origin_mismatch", "path"
        )
    return module


# Execute only the already size/SHA-authenticated bytes.  No public
# ``sys.modules['spectral']`` identity participates in this dependency bind.
_spectral_module = _load_bound_spectral_module()

FrozenLobattoSpectralPrimitive = _spectral_module.FrozenLobattoSpectralPrimitive
SPECTRAL_AUTHORITY_LOCKS = _spectral_module.AUTHORITY_LOCKS
SPECTRAL_POLICY_SHA256 = _spectral_module.PRIMARY_NUMERICS_POLICY_SHA256
SPECTRAL_POLICY_SIZE = (
    _spectral_module.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
)


@dataclass(frozen=True, slots=True)
class FrozenFixedL0Initializer:
    node_count: int
    kg: float
    u: tuple[float, ...]
    V: tuple[float, ...]
    nu: float
    z: tuple[float, ...]
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    spectral_source_sha256: str
    spectral_source_size_bytes: int
    spectral_instance_sha256: str
    mpfr_precision_bits: int
    mpfr_rounding_mode: str
    mpfr_emin: int
    mpfr_emax: int
    observed_gmpy2_version: str
    observed_mpfr_version: str
    calculation_implemented: bool = True
    fixed_l0_graph_implemented: bool = True
    initializer_vector_computed: bool = True
    alternate_initializer_used: bool = False
    primary_numerics_semantic_authority: bool = False
    initializer_contract_authority: bool = False
    implementation_closure_complete: bool = False
    runtime_closure_complete: bool = False
    source_manifest_bound: bool = False
    toolchain_manifest_bound: bool = False
    executable_bound: bool = False
    runtime_manifest_bound: bool = False
    scientific_preseal_present: bool = False
    newton_implemented: bool = False
    solve_performed: bool = False
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
    diagnostic_pass_authority: bool = False
    candidate_authority: bool = False
    theory_graph_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False


AUTHORITY_LOCKS: Final = MappingProxyType(
    {
        "primaryNumericsSemanticAuthority": False,
        "initializerContractAuthority": False,
        "implementationClosureComplete": False,
        "runtimeClosureComplete": False,
        "sourceManifestAuthority": False,
        "toolchainAuthority": False,
        "executableAuthority": False,
        "runtimeAuthority": False,
        "preexecutionPresealPresent": False,
        "executionAuthorized": False,
        "executionObserved": False,
        "candidateOutputMaterialized": False,
        "outputPresent": False,
        "outputAccepted": False,
        "seedAccepted": False,
        "branchAccepted": False,
        "nondegeneracyAccepted": False,
        "runReplayAccepted": False,
        "independentAgreementAccepted": False,
        "diagnosticPass": False,
        "candidateAuthority": False,
        "theoryGraphAuthority": False,
        "semiclassicalStressNoiseLamp": False,
        "semiclassicalConstraintAlgebraLamp": False,
        "physicalViability": False,
        "propulsion": False,
        "transport": False,
    }
)


_SPECTRAL_FALSE_FIELDS: Final[tuple[str, ...]] = (
    "primary_numerics_semantic_authority",
    "implementation_closure_complete",
    "runtime_closure_complete",
    "node_count_selected_for_candidate",
    "gauss_legendre_fixture_bound",
    "source_manifest_bound",
    "toolchain_manifest_bound",
    "executable_bound",
    "runtime_manifest_bound",
    "scientific_preseal_present",
    "candidate_execution_authorized",
    "candidate_executed",
    "output_present",
    "output_accepted",
    "candidate_output_materialized",
    "seed_accepted",
    "branch_accepted",
    "nondegeneracy_accepted",
    "replay_authority",
    "independent_agreement",
    "diagnostic_pass_authority",
    "candidate_authority",
    "theory_graph_authority",
    "physical_authority",
    "propulsion_authority",
    "transport_authority",
)

_SPECTRAL_SNAPSHOT_FIELD_NAMES: Final[tuple[str, ...]] = (
    "node_count",
    "rho",
    "barycentric_weights",
    "first_derivative",
    "second_derivative",
    "primary_numerics_policy_sha256",
    "primary_numerics_policy_canonical_size_bytes",
    "mpfr_precision_bits",
    "mpfr_rounding_mode",
    "mpfr_emin",
    "mpfr_emax",
    "observed_gmpy2_version",
    "observed_mpfr_version",
    "calculation_implemented",
    *_SPECTRAL_FALSE_FIELDS,
)


@dataclass(frozen=True, slots=True)
class _FrozenSpectralSnapshot:
    field_values: tuple[object, ...]
    node_count: int
    rho: tuple[float, ...]
    barycentric_weights: tuple[float, ...]
    first_derivative: tuple[tuple[float, ...], ...]
    second_derivative: tuple[tuple[float, ...], ...]
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    calculation_implemented: bool
    false_field_values: tuple[object, ...]
    exact_tuple_shape: bool


def _snapshot_spectral_primitive(value: object) -> _FrozenSpectralSnapshot:
    if type(value) is not FrozenLobattoSpectralPrimitive:
        raise CoreInitializerError(
            "initializer_spectral_primitive_type_invalid", type(value).__name__
        )
    try:
        supplied = tuple(
            getattr(value, field_name)
            for field_name in _SPECTRAL_SNAPSHOT_FIELD_NAMES
        )
    except Exception as error:
        raise CoreInitializerError(
            "initializer_spectral_snapshot_failed", type(error).__name__
        ) from error
    rho_raw, weights_raw, first_raw, second_raw = supplied[1:5]
    rho_exact = type(rho_raw) is tuple
    weights_exact = type(weights_raw) is tuple
    first_exact = type(first_raw) is tuple and all(
        type(row) is tuple for row in first_raw
    )
    second_exact = type(second_raw) is tuple and all(
        type(row) is tuple for row in second_raw
    )
    rho = tuple(item for item in rho_raw) if rho_exact else ()
    weights = tuple(item for item in weights_raw) if weights_exact else ()
    first = (
        tuple(tuple(item for item in row) for row in first_raw)
        if first_exact
        else ()
    )
    second = (
        tuple(tuple(item for item in row) for row in second_raw)
        if second_exact
        else ()
    )
    frozen_fields = (
        supplied[0],
        rho,
        weights,
        first,
        second,
        *supplied[5:],
    )
    return _FrozenSpectralSnapshot(
        field_values=frozen_fields,
        node_count=supplied[0],
        rho=rho,
        barycentric_weights=weights,
        first_derivative=first,
        second_derivative=second,
        primary_numerics_policy_sha256=supplied[5],
        primary_numerics_policy_canonical_size_bytes=supplied[6],
        calculation_implemented=supplied[13],
        false_field_values=tuple(supplied[14:]),
        exact_tuple_shape=(rho_exact and weights_exact and first_exact and second_exact),
    )


def _negative_zero(value: float) -> bool:
    return value == 0.0 and struct.pack("<d", value) == bytes.fromhex(
        "0000000000000080"
    )


def _validate_f64(value: object, detail: str) -> float:
    if type(value) is not float:
        raise CoreInitializerError("initializer_binary64_type_invalid", detail)
    if not math.isfinite(value):
        raise CoreInitializerError("initializer_binary64_nonfinite_input", detail)
    if _negative_zero(value):
        raise CoreInitializerError("initializer_binary64_negative_zero_input", detail)
    return value


def _u64le(value: int) -> bytes:
    if type(value) is not int or value < 0:
        raise CoreInitializerError("initializer_u64_invalid", repr(value))
    return value.to_bytes(8, "little", signed=False)


def _flatten(rows: tuple[tuple[float, ...], ...]) -> tuple[float, ...]:
    return tuple(value for row in rows for value in row)


def _spectral_golden_sha256(grid: _FrozenSpectralSnapshot) -> str:
    sequences = (
        (b"rho", grid.rho),
        (b"barycentric_weights", grid.barycentric_weights),
        (b"first_derivative_row_major", _flatten(grid.first_derivative)),
        (b"second_derivative_row_major", _flatten(grid.second_derivative)),
    )
    digest = hashlib.sha256()
    digest.update(SPECTRAL_GOLDEN_HASH_DOMAIN)
    digest.update(_u64le(grid.node_count))
    for label, values in sequences:
        digest.update(_u64le(len(label)))
        digest.update(label)
        digest.update(_u64le(len(values)))
        digest.update(struct.pack(f"<{len(values)}d", *values))
    return digest.hexdigest()


def _verify_literal_bindings() -> None:
    if (
        PRIMARY_NUMERICS_POLICY_SHA256 != SPECTRAL_POLICY_SHA256
        or PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES != SPECTRAL_POLICY_SIZE
    ):
        raise CoreInitializerError(
            "initializer_primary_numerics_policy_binding_mismatch", "spectral"
        )
    _read_bound_spectral_source()


def _validate_spectral_primitive(
    grid: _FrozenSpectralSnapshot,
) -> _FrozenSpectralSnapshot:
    if type(grid.node_count) is not int or grid.node_count != FIXED_NODE_COUNT:
        raise CoreInitializerError(
            "initializer_spectral_node_count_invalid", repr(grid.node_count)
        )
    if (
        grid.primary_numerics_policy_sha256 != PRIMARY_NUMERICS_POLICY_SHA256
        or grid.primary_numerics_policy_canonical_size_bytes
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
    ):
        raise CoreInitializerError(
            "initializer_spectral_policy_binding_mismatch", str(grid.node_count)
        )
    if grid.calculation_implemented is not True:
        raise CoreInitializerError(
            "initializer_spectral_calculation_absent", str(grid.node_count)
        )
    if any(value is not False for value in grid.false_field_values):
        raise CoreInitializerError(
            "initializer_spectral_authority_lock_invalid", str(grid.node_count)
        )
    if any(value is not False for value in SPECTRAL_AUTHORITY_LOCKS.values()):
        raise CoreInitializerError(
            "initializer_spectral_module_authority_lock_invalid", str(grid.node_count)
        )
    if (
        not grid.exact_tuple_shape
        or type(grid.rho) is not tuple
        or type(grid.barycentric_weights) is not tuple
        or type(grid.first_derivative) is not tuple
        or type(grid.second_derivative) is not tuple
        or len(grid.rho) != FIXED_NODE_COUNT
        or len(grid.barycentric_weights) != FIXED_NODE_COUNT
        or len(grid.first_derivative) != FIXED_NODE_COUNT
        or len(grid.second_derivative) != FIXED_NODE_COUNT
        or any(
            type(row) is not tuple or len(row) != FIXED_NODE_COUNT
            for row in (*grid.first_derivative, *grid.second_derivative)
        )
    ):
        raise CoreInitializerError("initializer_spectral_shape_invalid", "N64")
    for index, entry in enumerate(grid.rho):
        _validate_f64(entry, f"rho[{index}]")
    for index, entry in enumerate(grid.barycentric_weights):
        _validate_f64(entry, f"weight[{index}]")
    for matrix_name, matrix in (
        ("D", grid.first_derivative),
        ("D2", grid.second_derivative),
    ):
        for row in range(FIXED_NODE_COUNT):
            for column in range(FIXED_NODE_COUNT):
                _validate_f64(matrix[row][column], f"{matrix_name}[{row},{column}]")
    if struct.pack("<d", grid.rho[0]) != bytes(8) or grid.rho[-1] != 1.0:
        raise CoreInitializerError("initializer_spectral_endpoint_invalid", "N64")
    if any(
        grid.rho[index] <= grid.rho[index - 1]
        for index in range(1, FIXED_NODE_COUNT)
    ):
        raise CoreInitializerError("initializer_spectral_order_invalid", "N64")
    if _spectral_golden_sha256(grid) != SPECTRAL_N64_GOLDEN_SHA256:
        raise CoreInitializerError("initializer_spectral_instance_mismatch", "sha256")
    return grid


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
            raise CoreInitializerError("initializer_mpfr_context_installation_failed", "root")
        context.clear_flags()
        yield context


def _check_flags(context: gmpy2.context, operation: str) -> None:
    bad = tuple(
        name
        for name in ("invalid", "divzero", "overflow", "underflow", "erange")
        if bool(getattr(context, name))
    )
    if bad:
        raise CoreInitializerError(
            "initializer_mpfr_exceptional_flag", f"{operation}:{','.join(bad)}"
        )


def _positive_zero(context: gmpy2.context) -> gmpy2.mpfr:
    context.clear_flags()
    result = gmpy2.mpfr(0, MPFR_PRECISION_BITS)
    _check_flags(context, "set_positive_zero")
    if not gmpy2.is_zero(result) or gmpy2.is_signed(result):
        raise CoreInitializerError("initializer_mpfr_positive_zero_failure", "root")
    return result


def _finish(
    context: gmpy2.context,
    value: gmpy2.mpfr,
    operation: str,
) -> gmpy2.mpfr:
    _check_flags(context, operation)
    if not gmpy2.is_finite(value):
        raise CoreInitializerError("initializer_mpfr_nonfinite", operation)
    return _positive_zero(context) if gmpy2.is_zero(value) else value


def _set_ui(context: gmpy2.context, value: int, operation: str) -> gmpy2.mpfr:
    if type(value) is not int or value < 0:
        raise CoreInitializerError("initializer_set_ui_domain_invalid", operation)
    context.clear_flags()
    result = _finish(context, gmpy2.mpfr(value, MPFR_PRECISION_BITS), operation)
    if context.inexact:
        raise CoreInitializerError("initializer_set_ui_inexact", operation)
    return result


def _set_si(context: gmpy2.context, value: int, operation: str) -> gmpy2.mpfr:
    if type(value) is not int:
        raise CoreInitializerError("initializer_set_si_domain_invalid", operation)
    context.clear_flags()
    result = _finish(context, gmpy2.mpfr(value, MPFR_PRECISION_BITS), operation)
    if context.inexact:
        raise CoreInitializerError("initializer_set_si_inexact", operation)
    return result


def _set_d(context: gmpy2.context, value: float, operation: str) -> gmpy2.mpfr:
    _validate_f64(value, operation)
    context.clear_flags()
    result = _finish(context, gmpy2.mpfr(value, MPFR_PRECISION_BITS), operation)
    if context.inexact:
        raise CoreInitializerError("initializer_set_d_inexact", operation)
    return result


def _copy(context: gmpy2.context, value: gmpy2.mpfr, operation: str) -> gmpy2.mpfr:
    context.clear_flags()
    result = _finish(context, gmpy2.mpfr(value, MPFR_PRECISION_BITS), operation)
    if context.inexact:
        raise CoreInitializerError("initializer_set_inexact", operation)
    return result


def _add(
    context: gmpy2.context,
    left: gmpy2.mpfr,
    right: gmpy2.mpfr,
    operation: str,
) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish(context, gmpy2.add(left, right), operation)


def _sub(
    context: gmpy2.context,
    left: gmpy2.mpfr,
    right: gmpy2.mpfr,
    operation: str,
) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish(context, gmpy2.sub(left, right), operation)


def _mul(
    context: gmpy2.context,
    left: gmpy2.mpfr,
    right: gmpy2.mpfr,
    operation: str,
) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish(context, gmpy2.mul(left, right), operation)


def _div(
    context: gmpy2.context,
    numerator: gmpy2.mpfr,
    denominator: gmpy2.mpfr,
    operation: str,
) -> gmpy2.mpfr:
    if gmpy2.is_zero(denominator):
        raise CoreInitializerError("initializer_mpfr_division_by_zero", operation)
    context.clear_flags()
    return _finish(context, gmpy2.div(numerator, denominator), operation)


def _neg(context: gmpy2.context, value: gmpy2.mpfr, operation: str) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish(context, -value, operation)


def _sqrt(context: gmpy2.context, value: gmpy2.mpfr, operation: str) -> gmpy2.mpfr:
    if value < 0:
        raise CoreInitializerError("initializer_mpfr_sqrt_domain_invalid", operation)
    context.clear_flags()
    return _finish(context, gmpy2.sqrt(value), operation)


def _exp(context: gmpy2.context, value: gmpy2.mpfr, operation: str) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish(context, gmpy2.exp(value), operation)


def _get_d(context: gmpy2.context, value: gmpy2.mpfr, operation: str) -> float:
    context.clear_flags()
    result = float(value)
    _check_flags(context, operation)
    if not math.isfinite(result):
        raise CoreInitializerError("initializer_binary64_nonfinite_output", operation)
    if result == 0.0:
        result = 0.0
    if _negative_zero(result):
        raise CoreInitializerError("initializer_binary64_negative_zero_output", operation)
    return result


def _kg64(context: gmpy2.context) -> float:
    seven = _set_ui(context, 7, "kg.set_seven")
    eight = _set_ui(context, 8, "kg.set_eight")
    ratio = _div(context, seven, eight, "kg.div_ratio")
    first_root = _sqrt(context, ratio, "kg.sqrt_first_root")
    kg = _sqrt(context, first_root, "kg.sqrt_kg")
    return _get_d(context, kg, "kg.get_d")


def _nu64(context: gmpy2.context, kg64: float) -> float:
    kg = _set_d(context, kg64, "nu.set_d_kg")
    kg_squared = _mul(context, kg, kg, "nu.mul_kg_squared")
    negative_kg_squared = _neg(context, kg_squared, "nu.neg_kg_squared")
    two = _set_ui(context, 2, "nu.set_two")
    nu = _div(context, negative_kg_squared, two, "nu.div_two")
    return _get_d(context, nu, "nu.get_d")


def _factorial(context: gmpy2.context, n: int) -> gmpy2.mpfr:
    factorial = _set_ui(context, 1, f"integral[{n}].factorial.set_one")
    for factor in range(2, n + 1):
        factor_mp = _set_ui(
            context, factor, f"integral[{n}].factorial.set_factor[{factor}]"
        )
        next_factorial = _mul(
            context,
            factorial,
            factor_mp,
            f"integral[{n}].factorial.mul[{factor}]",
        )
        factorial = _copy(
            context,
            next_factorial,
            f"integral[{n}].factorial.copy[{factor}]",
        )
    return factorial


def _series(
    context: gmpy2.context,
    n: int,
    two_kg_x: gmpy2.mpfr,
) -> gmpy2.mpfr:
    series = _set_ui(context, 0, f"integral[{n}].series.set_zero")
    power = _set_ui(context, 1, f"integral[{n}].power.set_one")
    j_factorial = _set_ui(context, 1, f"integral[{n}].j_factorial.set_one")
    for j in range(0, n + 1):
        if j > 0:
            j_mp = _set_ui(context, j, f"integral[{n}].set_j[{j}]")
            next_power = _mul(
                context,
                power,
                two_kg_x,
                f"integral[{n}].power.mul[{j}]",
            )
            power = _copy(
                context,
                next_power,
                f"integral[{n}].power.copy[{j}]",
            )
            next_j_factorial = _mul(
                context,
                j_factorial,
                j_mp,
                f"integral[{n}].j_factorial.mul[{j}]",
            )
            j_factorial = _copy(
                context,
                next_j_factorial,
                f"integral[{n}].j_factorial.copy[{j}]",
            )
        term = _div(
            context,
            power,
            j_factorial,
            f"integral[{n}].series.div_term[{j}]",
        )
        next_series = _add(
            context,
            series,
            term,
            f"integral[{n}].series.add[{j}]",
        )
        series = _copy(
            context,
            next_series,
            f"integral[{n}].series.copy[{j}]",
        )
    return series


def _denominator_power(
    context: gmpy2.context,
    n: int,
    two_kg: gmpy2.mpfr,
) -> gmpy2.mpfr:
    denominator = _set_ui(context, 1, f"integral[{n}].denominator.set_one")
    for power_index in range(0, n + 1):
        next_denominator = _mul(
            context,
            denominator,
            two_kg,
            f"integral[{n}].denominator.mul[{power_index}]",
        )
        denominator = _copy(
            context,
            next_denominator,
            f"integral[{n}].denominator.copy[{power_index}]",
        )
    return denominator


def _integrals(
    context: gmpy2.context,
    two_kg: gmpy2.mpfr,
    two_kg_x: gmpy2.mpfr,
    exp_minus_two_kg_x: gmpy2.mpfr,
) -> tuple[
    tuple[gmpy2.mpfr, gmpy2.mpfr, gmpy2.mpfr, gmpy2.mpfr],
    tuple[gmpy2.mpfr, gmpy2.mpfr, gmpy2.mpfr, gmpy2.mpfr],
    gmpy2.mpfr,
]:
    i_values: list[gmpy2.mpfr] = []
    j_values: list[gmpy2.mpfr] = []
    last_one: gmpy2.mpfr | None = None
    for n in (1, 2, 3, 4):
        factorial = _factorial(context, n)
        series = _series(context, n, two_kg_x)
        one = _set_ui(context, 1, f"integral[{n}].set_one")
        exp_series = _mul(
            context,
            exp_minus_two_kg_x,
            series,
            f"integral[{n}].mul_exp_series",
        )
        one_minus_exp_series = _sub(
            context,
            one,
            exp_series,
            f"integral[{n}].sub_one_exp_series",
        )
        denominator = _denominator_power(context, n, two_kg)
        prefactor = _div(
            context,
            factorial,
            denominator,
            f"integral[{n}].div_prefactor",
        )
        i_value = _mul(
            context,
            prefactor,
            one_minus_exp_series,
            f"integral[{n}].mul_I",
        )
        j_value = _mul(
            context,
            prefactor,
            exp_series,
            f"integral[{n}].mul_J",
        )
        i_values.append(i_value)
        j_values.append(j_value)
        last_one = one
    if last_one is None:
        raise CoreInitializerError("initializer_integral_inventory_invalid", "empty")
    return (
        (i_values[0], i_values[1], i_values[2], i_values[3]),
        (j_values[0], j_values[1], j_values[2], j_values[3]),
        last_one,
    )


def _interior_values(
    context: gmpy2.context,
    rho64: float,
    kg64: float,
    node_index: int,
) -> tuple[gmpy2.mpfr, gmpy2.mpfr, gmpy2.mpfr, gmpy2.mpfr]:
    if not 0.0 < rho64 < 1.0:
        raise CoreInitializerError(
            "initializer_interior_rho_domain_invalid", str(node_index)
        )
    rho = _set_d(context, rho64, f"node[{node_index}].set_d_rho")
    one_for_x = _set_ui(context, 1, f"node[{node_index}].x.set_one")
    denominator = _sub(
        context,
        one_for_x,
        rho,
        f"node[{node_index}].x.sub_denominator",
    )
    x = _div(context, rho, denominator, f"node[{node_index}].x.div")
    kg = _set_d(context, kg64, f"node[{node_index}].set_d_kg")
    kg_x = _mul(context, kg, x, f"node[{node_index}].mul_kg_x")
    minus_kg_x = _neg(context, kg_x, f"node[{node_index}].neg_kg_x")
    exp_minus_kg_x = _exp(
        context,
        minus_kg_x,
        f"node[{node_index}].exp_minus_kg_x",
    )
    two = _set_ui(context, 2, f"node[{node_index}].set_two")
    two_kg = _mul(context, two, kg, f"node[{node_index}].mul_two_kg")
    two_kg_x = _mul(context, two_kg, x, f"node[{node_index}].mul_two_kg_x")
    minus_two_kg_x = _neg(
        context,
        two_kg_x,
        f"node[{node_index}].neg_two_kg_x",
    )
    exp_minus_two_kg_x = _exp(
        context,
        minus_two_kg_x,
        f"node[{node_index}].exp_minus_two_kg_x",
    )
    i_values, j_values, one = _integrals(
        context,
        two_kg,
        two_kg_x,
        exp_minus_two_kg_x,
    )
    _, i2, i3, i4 = i_values
    j1, j2, j3, _ = j_values
    u_linear = _mul(context, kg, x, f"node[{node_index}].u.mul_linear")
    u_linear_plus_one = _add(
        context,
        one,
        u_linear,
        f"node[{node_index}].u.add_one",
    )
    u_value = _mul(
        context,
        u_linear_plus_one,
        exp_minus_kg_x,
        f"node[{node_index}].u.mul_exp",
    )
    kg_squared = _mul(context, kg, kg, f"node[{node_index}].V.mul_kg_squared")
    two_kg_i3 = _mul(context, two_kg, i3, f"node[{node_index}].V.mul_two_kg_I3")
    kg_squared_i4 = _mul(
        context,
        kg_squared,
        i4,
        f"node[{node_index}].V.mul_kg_squared_I4",
    )
    i_partial = _add(context, i2, two_kg_i3, f"node[{node_index}].V.add_I_partial")
    i_total = _add(
        context,
        i_partial,
        kg_squared_i4,
        f"node[{node_index}].V.add_I_total",
    )
    i_over_x = _div(context, i_total, x, f"node[{node_index}].V.div_I_x")
    negative_i_over_x = _neg(
        context,
        i_over_x,
        f"node[{node_index}].V.neg_I_x",
    )
    two_kg_j2 = _mul(context, two_kg, j2, f"node[{node_index}].V.mul_two_kg_J2")
    kg_squared_j3 = _mul(
        context,
        kg_squared,
        j3,
        f"node[{node_index}].V.mul_kg_squared_J3",
    )
    j_partial = _add(context, j1, two_kg_j2, f"node[{node_index}].V.add_J_partial")
    j_total = _add(
        context,
        j_partial,
        kg_squared_j3,
        f"node[{node_index}].V.add_J_total",
    )
    v_value = _sub(
        context,
        negative_i_over_x,
        j_total,
        f"node[{node_index}].V.sub_J_total",
    )
    return u_value, v_value, exp_minus_kg_x, exp_minus_two_kg_x


def _origin_values(
    context: gmpy2.context,
    kg64: float,
) -> tuple[gmpy2.mpfr, gmpy2.mpfr]:
    u_value = _set_ui(context, 1, "origin.u.set_one")
    kg = _set_d(context, kg64, "origin.set_d_kg")
    kg_squared = _mul(context, kg, kg, "origin.mul_kg_squared")
    eight = _set_ui(context, 8, "origin.set_eight")
    denominator = _mul(context, eight, kg_squared, "origin.mul_denominator")
    minus_nine = _set_si(context, -9, "origin.set_minus_nine")
    v_value = _div(context, minus_nine, denominator, "origin.div_V")
    return u_value, v_value


def _validate_output(
    u: tuple[float, ...],
    potential: tuple[float, ...],
    nu: float,
    z: tuple[float, ...],
) -> None:
    if (
        len(u) != FIXED_NODE_COUNT
        or len(potential) != FIXED_NODE_COUNT
        or len(z) != 2 * FIXED_NODE_COUNT + 1
        or z != (*u, *potential, nu)
    ):
        raise CoreInitializerError("initializer_output_shape_invalid", "N64")
    for index, value in enumerate((*u, *potential, nu)):
        _validate_f64(value, f"output[{index}]")
    if struct.pack("<d", u[0]) != bytes.fromhex("000000000000f03f"):
        raise CoreInitializerError("initializer_origin_u_invariant", "bits")
    if not potential[0] < 0.0:
        raise CoreInitializerError("initializer_origin_V_invariant", "sign")
    if struct.pack("<d", u[-1]) != bytes(8) or struct.pack("<d", potential[-1]) != bytes(8):
        raise CoreInitializerError("initializer_infinity_invariant", "bits")
    if not -0.5 < nu < 0.0:
        raise CoreInitializerError("initializer_nu_domain_invalid", repr(nu))
    if any(value < 0.0 for value in u):
        raise CoreInitializerError("initializer_u_domain_invalid", "negative")
    if any(value > 0.0 for value in potential):
        raise CoreInitializerError("initializer_V_domain_invalid", "positive")


def materialize_fixed_l0_initializer(
    spectral: FrozenLobattoSpectralPrimitive,
) -> FrozenFixedL0Initializer:
    """Materialize the one frozen N=64 fixed-L0 initializer vector."""

    _verify_literal_bindings()
    grid = _validate_spectral_primitive(_snapshot_spectral_primitive(spectral))
    rho = grid.rho
    with _owned_mpfr256_context() as context:
        kg64 = _kg64(context)
        nu64 = _nu64(context, kg64)
        u_values: list[float] = []
        potential_values: list[float] = []
        for index in range(FIXED_NODE_COUNT):
            if index == 0:
                u_mp, v_mp = _origin_values(context, kg64)
            elif index == FIXED_NODE_COUNT - 1:
                u_mp = _set_ui(context, 0, "infinity.u.set_positive_zero")
                v_mp = _set_ui(context, 0, "infinity.V.set_positive_zero")
            else:
                u_mp, v_mp, _, _ = _interior_values(
                    context,
                    rho[index],
                    kg64,
                    index,
                )
            u_values.append(_get_d(context, u_mp, f"node[{index}].u.get_d"))
            potential_values.append(
                _get_d(context, v_mp, f"node[{index}].V.get_d")
            )
    frozen_u = tuple(u_values)
    frozen_potential = tuple(potential_values)
    frozen_z = (*frozen_u, *frozen_potential, nu64)
    _validate_output(frozen_u, frozen_potential, nu64, frozen_z)
    _read_bound_spectral_source()
    return FrozenFixedL0Initializer(
        node_count=FIXED_NODE_COUNT,
        kg=kg64,
        u=frozen_u,
        V=frozen_potential,
        nu=nu64,
        z=frozen_z,
        primary_numerics_policy_sha256=PRIMARY_NUMERICS_POLICY_SHA256,
        primary_numerics_policy_canonical_size_bytes=(
            PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        ),
        spectral_source_sha256=SPECTRAL_SOURCE_SHA256,
        spectral_source_size_bytes=SPECTRAL_SOURCE_SIZE_BYTES,
        spectral_instance_sha256=SPECTRAL_N64_GOLDEN_SHA256,
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
    or len(SPECTRAL_SOURCE_SHA256) != 64
    or SPECTRAL_SOURCE_SIZE_BYTES != 19_045
    or len(SPECTRAL_N64_GOLDEN_SHA256) != 64
    or tuple(FrozenLobattoSpectralPrimitive.__dataclass_fields__)
    != _SPECTRAL_SNAPSHOT_FIELD_NAMES
    or FIXED_NODE_COUNT != 64
    or MPFR_PRECISION_BITS != 256
    or MPFR_EMIN != -1_000_000
    or MPFR_EMAX != 1_000_000
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("spherical_seed_primary_fixed_l0_initializer_invariant")


__all__ = [
    "AUTHORITY_LOCKS",
    "CORE_INITIALIZER_VERSION",
    "CoreInitializerError",
    "ENDPOINT_OPERATION_GRAPH",
    "FIXED_NODE_COUNT",
    "FrozenFixedL0Initializer",
    "INTERIOR_OPERATION_GRAPH",
    "KG_OPERATION_GRAPH",
    "MPFR_EMAX",
    "MPFR_EMIN",
    "MPFR_PRECISION_BITS",
    "MPFR_ROUNDING_MODE",
    "NU_OPERATION_GRAPH",
    "PACKING_OPERATION_GRAPH",
    "PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES",
    "PRIMARY_NUMERICS_POLICY_SHA256",
    "PRIMARY_NUMERICS_POLICY_SHA256_DOMAIN",
    "SPECTRAL_N64_GOLDEN_SHA256",
    "SPECTRAL_SOURCE_SHA256",
    "SPECTRAL_SOURCE_SIZE_BYTES",
    "materialize_fixed_l0_initializer",
]
