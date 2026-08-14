"""Authenticated boundary for the combined 65-row tail operator.

The source-authenticated PDE primitive supplies rows ``S[0..31],P[0..31]``
and the source-authenticated mass primitive supplies row 64.  The caller's
65-component tail state is scanned into one immutable bit-preserving snapshot
before either primitive runs.  Newton mode assembles the complete analytic
65-by-65 Jacobian; final-residual-gate mode never reads either subordinate
Jacobian field and returns no Jacobian target.

The exact tail-initializer bytes are privately executed and its once-only
continuation can mint one identity-gated persistent session.  A session retains
the original MPFR256 core sum, its one binary64 barrier, projected L2 state,
join barriers, and collocation while allowing many Newton evaluations followed
by a residual-only gate without re-consuming or recomputing the core barrier.

The separately private-loaded producer modules do not yet share an upstream
initializer instance, so the public production session opener records that
typed composition blocker before caller traversal.  The private synthetic
session constructor exercises the exact-instance continuation path.  Reduced-
cell mass evaluations remain diagnostic only; no solve, candidate, output,
acceptance, replay, or physical authority is claimed.
"""

from __future__ import annotations

from dataclasses import dataclass, replace
import hashlib
import math
from pathlib import Path
import struct
import sys
from types import MappingProxyType, ModuleType
from typing import Final

import gmpy2


TAIL_OPERATOR_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_seed_primary_tail_operator/v1"
)

BINARY64_ENVIRONMENT_SOURCE_SHA256: Final[str] = (
    "8d452abdfa6d9b3e0cf92aa7d8682202b588f1fe8b0fe0772c6d003d2d12f1a4"
)
BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES: Final[int] = 14_980
TAIL_PDE_OPERATOR_SOURCE_SHA256: Final[str] = (
    "b619ca6046e89784d665f96b0cd84d868b83a0847ba51957a05cdfd4f48f3cc6"
)
TAIL_PDE_OPERATOR_SOURCE_SIZE_BYTES: Final[int] = 78_567
TAIL_MASS_OPERATOR_SOURCE_SHA256: Final[str] = (
    "4ae2820053a9835b8cd842c7548c198ff031ec072d924e30507ce8a5e9387ab6"
)
TAIL_MASS_OPERATOR_SOURCE_SIZE_BYTES: Final[int] = 102_513

TAIL_INITIALIZER_SOURCE_SHA256: Final[str] = (
    "42408124ef4cdf6dbafc98bdcd3a0219db64977cd1f5c277aeb5eed9a4080854"
)
TAIL_INITIALIZER_SOURCE_SIZE_BYTES: Final[int] = 56_936
TAIL_INITIALIZER_SOURCE_STATUS: Final[str] = "sealed_private_exact_byte_source"
PRODUCTION_DEPENDENCIES_SEALED: Final[bool] = True
PRODUCTION_SESSION_COMPOSITION_STATUS: Final[str] = (
    "blocked_shared_private_initializer_instance_not_composed"
)

UNKNOWN_COUNT: Final[int] = 65
PDE_ROW_COUNT: Final[int] = 64
RESIDUAL_ROW_COUNT: Final[int] = 65
PROJECTED_L2_UNKNOWN_COUNT: Final[int] = 257
PROJECTED_L2_NODE_COUNT: Final[int] = 128
FULL_TAIL_CELL_COUNT: Final[int] = 4096
UNKNOWN_ORDER: Final[str] = "C,h[0..31],q[0..31]"
ROW_ORDER: Final[str] = "S[0..31],P[0..31],mass"
NEWTON_MODE: Final[str] = "Newton"
FINAL_RESIDUAL_GATE_MODE: Final[str] = "finalResidualGate"
EVALUATION_MODES: Final[tuple[str, str]] = (
    NEWTON_MODE,
    FINAL_RESIDUAL_GATE_MODE,
)

STATE_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/tail-operator/state-f64le/v1\n"
)
PROJECTED_STATE_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/tail-operator/projected-f64le/v1\n"
)
CHRONOLOGY_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/tail-operator/chronology/v1\n"
)
SESSION_ID_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/tail-operator/session/v1\n"
)

STATE_SNAPSHOT_GRAPH: Final[str] = (
    "scan_caller_state_once_in_unknown_order_C_h0_to_h31_q0_to_q31;"
    "copy_each_exact_binary64_bit_pattern_to_one_immutable_tuple;"
    "never_read_caller_state_again;pass_the_same_snapshot_to_PDE_then_mass"
)
COMBINED_ROW_GRAPH: Final[str] = (
    "PDE_S0_through_S31_then_P0_through_P31;mass_row_64;"
    "store_each_residual_then_only_in_Newton_mode_columns_0_through_64;"
    "finalResidualGate_never_reads_subordinate_Jacobian_fields"
)
FIRST_FAILURE_GRAPH: Final[str] = (
    "source_rehash_then_exact_ABI_false_locks_then_state_snapshot_then_mode_"
    "then_projected_snapshot_then_PDE_once_then_mass_once;stop_at_first_"
    "failure_without_retry_retune_alternate_source_or_partial_result"
)


class TailOperatorError(ValueError):
    """Fail-closed combined-tail error with a stable code."""

    def __init__(self, code: str, detail: str = "root") -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


_HERE: Final[Path] = Path(__file__).resolve().parent
_BINARY64_ENVIRONMENT_PATH: Final[Path] = _HERE / "binary64_environment.py"
_TAIL_PDE_OPERATOR_PATH: Final[Path] = _HERE / "tail_pde_operator.py"
_TAIL_MASS_OPERATOR_PATH: Final[Path] = _HERE / "tail_mass_operator.py"
_TAIL_INITIALIZER_PATH: Final[Path] = _HERE / "tail_initializer.py"
_PRIVATE_FENV_MODULE_NAME: Final[str] = (
    "_nhm2_seed_tail_operator_fenv_8d452abdfa6d9b3e"
)
_PRIVATE_PDE_MODULE_NAME: Final[str] = (
    "_nhm2_seed_tail_operator_pde_b619ca6046e89784"
)
_PRIVATE_MASS_MODULE_NAME: Final[str] = (
    "_nhm2_seed_tail_operator_mass_4ae2820053a9835b"
)
_PRIVATE_INITIALIZER_MODULE_NAME: Final[str] = (
    "_nhm2_seed_tail_operator_initializer_99697c6d97588a1e"
)
_MISSING_MODULE: Final[object] = object()


def _read_bound_source(
    path: Path,
    expected_sha256: str,
    expected_size_bytes: int,
    dependency: str,
) -> bytes:
    try:
        source = path.read_bytes()
    except OSError as error:
        raise TailOperatorError(
            f"tail_operator_{dependency}_source_unavailable",
            type(error).__name__,
        ) from error
    if len(source) != expected_size_bytes:
        raise TailOperatorError(
            f"tail_operator_{dependency}_source_mismatch", "size"
        )
    if hashlib.sha256(source).hexdigest() != expected_sha256:
        raise TailOperatorError(
            f"tail_operator_{dependency}_source_mismatch", "sha256"
        )
    return source


def _read_bound_binary64_environment_source() -> bytes:
    return _read_bound_source(
        _BINARY64_ENVIRONMENT_PATH,
        BINARY64_ENVIRONMENT_SOURCE_SHA256,
        BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES,
        "binary64_environment",
    )


def _read_bound_tail_pde_operator_source() -> bytes:
    return _read_bound_source(
        _TAIL_PDE_OPERATOR_PATH,
        TAIL_PDE_OPERATOR_SOURCE_SHA256,
        TAIL_PDE_OPERATOR_SOURCE_SIZE_BYTES,
        "tail_pde_operator",
    )


def _read_bound_tail_mass_operator_source() -> bytes:
    return _read_bound_source(
        _TAIL_MASS_OPERATOR_PATH,
        TAIL_MASS_OPERATOR_SOURCE_SHA256,
        TAIL_MASS_OPERATOR_SOURCE_SIZE_BYTES,
        "tail_mass_operator",
    )


def _read_bound_tail_initializer_source() -> bytes:
    return _read_bound_source(
        _TAIL_INITIALIZER_PATH,
        TAIL_INITIALIZER_SOURCE_SHA256,
        TAIL_INITIALIZER_SOURCE_SIZE_BYTES,
        "tail_initializer",
    )


def _execute_private_module(
    *,
    source: bytes,
    path: Path,
    private_name: str,
    dependency: str,
) -> ModuleType:
    module = ModuleType(private_name)
    module.__file__ = str(path)
    module.__package__ = ""
    previous = sys.modules.get(private_name, _MISSING_MODULE)
    sys.modules[private_name] = module
    try:
        code = compile(
            source,
            str(path),
            "exec",
            dont_inherit=True,
            optimize=0,
        )
        exec(code, module.__dict__)
    except Exception as error:
        raise TailOperatorError(
            f"tail_operator_{dependency}_private_load_failed",
            type(error).__name__,
        ) from error
    finally:
        if previous is _MISSING_MODULE:
            del sys.modules[private_name]
        else:
            sys.modules[private_name] = previous
    if (
        not isinstance(getattr(module, "__file__", None), str)
        or Path(module.__file__).resolve() != path
    ):
        raise TailOperatorError(
            f"tail_operator_{dependency}_module_origin_mismatch"
        )
    return module


_binary64_environment = _execute_private_module(
    source=_read_bound_binary64_environment_source(),
    path=_BINARY64_ENVIRONMENT_PATH,
    private_name=_PRIVATE_FENV_MODULE_NAME,
    dependency="binary64_environment",
)
_tail_pde_module = _execute_private_module(
    source=_read_bound_tail_pde_operator_source(),
    path=_TAIL_PDE_OPERATOR_PATH,
    private_name=_PRIVATE_PDE_MODULE_NAME,
    dependency="tail_pde_operator",
)
_tail_mass_module = _execute_private_module(
    source=_read_bound_tail_mass_operator_source(),
    path=_TAIL_MASS_OPERATOR_PATH,
    private_name=_PRIVATE_MASS_MODULE_NAME,
    dependency="tail_mass_operator",
)
_tail_initializer_module = _execute_private_module(
    source=_read_bound_tail_initializer_source(),
    path=_TAIL_INITIALIZER_PATH,
    private_name=_PRIVATE_INITIALIZER_MODULE_NAME,
    dependency="tail_initializer",
)


@dataclass(frozen=True, slots=True)
class FrozenTailOperatorEvaluation:
    mode: str
    residual_row_count: int
    unknown_count: int
    residual: tuple[float, ...]
    jacobian: tuple[tuple[float, ...], ...] | None
    row_labels: tuple[str, ...]
    row_order: str
    unknown_order: str
    state_snapshot_bits: tuple[str, ...]
    state_f64le_sha256: str
    projected_state_f64le_sha256: str
    state_snapshot_count: int
    state_component_read_count: int
    state_bitwise_unchanged: bool
    pde_rows_completed: int
    mass_rows_completed: int
    residual_store_count: int
    jacobian_target_touched: bool
    jacobian_row_store_count: int
    jacobian_component_store_count: int
    pde_jacobian_field_accessed: bool
    mass_jacobian_field_accessed: bool
    chronology_event_count: int
    chronology_sha256: str
    synthetic_mass_cell_count: int
    full_tail_cell_count: int
    mass_row_is_partial: bool
    full_tail_mass_execution_observed: bool
    full_tail_mass_golden_verified: bool
    tail_pde_operator_source_sha256: str
    tail_pde_operator_source_size_bytes: int
    tail_mass_operator_source_sha256: str
    tail_mass_operator_source_size_bytes: int
    binary64_environment_source_sha256: str
    binary64_environment_source_size_bytes: int
    tail_initializer_source_sha256: str | None
    tail_initializer_source_size_bytes: int | None
    tail_initializer_source_status: str
    production_dependencies_sealed: bool
    binary64_runtime_family: str
    session_id_sha256: str | None
    session_evaluation_ordinal: int | None
    retained_core_get_d_count: int
    synthetic_dependencies_used: bool
    calculation_implemented: bool = True
    combined_residual_implemented: bool = True
    analytic_jacobian_implemented: bool = True
    final_residual_only_mode_implemented: bool = True
    production_adapter_available: bool = False
    initializer_continuation_consumed: bool = False
    implementation_closure_complete: bool = False
    runtime_closure_complete: bool = False
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


@dataclass(frozen=True, slots=True)
class FrozenTailOperatorSession:
    """Opaque public receipt; only its originating object identity is valid."""

    session_id_sha256: str
    initial_state: tuple[float, ...]
    initial_state_bits: tuple[str, ...]
    initial_state_f64le_sha256: str
    projected_state_f64le_sha256: str
    join_barrier_f64le_sha256: str
    core64: float
    core64_bits: str
    synthetic_mass_cell_count: int
    initializer_continuation_consumption_count: int
    retained_core_get_d_count: int
    tail_initializer_source_sha256: str
    tail_initializer_source_size_bytes: int
    synthetic_dependencies_used: bool
    production_adapter_available: bool = False
    implementation_closure_complete: bool = False
    runtime_closure_complete: bool = False
    newton_implemented: bool = False
    solve_performed: bool = False
    candidate_execution_authorized: bool = False
    candidate_executed: bool = False
    output_present: bool = False
    output_accepted: bool = False
    seed_accepted: bool = False
    branch_accepted: bool = False
    replay_authority: bool = False
    independent_agreement: bool = False
    diagnostic_pass_authority: bool = False
    candidate_authority: bool = False
    theory_graph_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False


@dataclass(slots=True)
class _PersistentTailOperatorSession:
    handle: FrozenTailOperatorSession
    initializer_result: object
    initializer_continuation: object
    core_integral_continuation: object
    collocation: object
    join_barriers: object
    projected_l2_state: tuple[float, ...]
    core_continuation: object | None
    core_sum: gmpy2.mpfr
    core64: float
    synthetic_mass_cell_count: int
    evaluation_count: int = 0
    newton_evaluation_count: int = 0
    final_residual_gate_evaluation_count: int = 0
    final_residual_gate_started: bool = False
    solve_claimed: bool = False
    terminal: bool = False


@dataclass(frozen=True, slots=True)
class _SyntheticRetainedCoreContinuation:
    core_sum: gmpy2.mpfr
    core64: float


_active_tail_operator_session: _PersistentTailOperatorSession | None = None
_SHARED_SESSION_AUTHORITY: Final[object] = object()


AUTHORITY_LOCKS: Final = MappingProxyType(
    {
        "primaryNumericsSemanticAuthority": False,
        "implementationClosureComplete": False,
        "runtimeClosureComplete": False,
        "sourceManifestAuthority": False,
        "toolchainAuthority": False,
        "preexecutionPresealPresent": False,
        "executionAuthorized": False,
        "executionObserved": False,
        "productionAdapterAvailable": False,
        "initializerContinuationConsumed": False,
        "fullTailMassGoldenVerified": False,
        "newtonImplemented": False,
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
        "physicalViability": False,
        "propulsion": False,
        "transport": False,
    }
)

_PDE_RESULT_FIELDS: Final[tuple[str, ...]] = (
    "node_count", "unknown_count", "pde_row_count", "residual", "jacobian",
    "unknown_order", "row_order", "row_labels", "tail_state_f64le_sha256",
    "join_barrier_f64le_sha256", "tail_node_payload_sha256",
    "primary_numerics_policy_sha256",
    "primary_numerics_policy_canonical_size_bytes",
    "binary64_environment_source_sha256",
    "binary64_environment_source_size_bytes", "tail_collocation_source_sha256",
    "tail_collocation_source_size_bytes", "join_extraction_source_sha256",
    "join_extraction_source_size_bytes", "binary64_runtime_family",
    "mpfr_precision_bits", "mpfr_rounding_mode", "mpfr_emin", "mpfr_emax",
    "observed_gmpy2_version", "observed_mpfr_version",
    "calculation_implemented", "analytic_jacobian_implemented",
    "chebyshev_streaming_implemented", "mass_row_implemented",
    "quadrature_implemented", "newton_implemented", "solve_performed",
    "candidate_execution_authorized", "candidate_executed",
    "candidate_output_materialized", "output_present", "output_accepted",
    "seed_accepted", "branch_accepted", "replay_authority",
    "independent_agreement", "diagnostic_pass_authority",
    "candidate_authority", "theory_graph_authority", "physical_authority",
    "propulsion_authority", "transport_authority",
)
_MASS_RESULT_FIELDS: Final[tuple[str, ...]] = (
    "full_tail_cell_count", "synthetic_cells_completed", "gl_point_count",
    "points_completed", "basis_entries_completed", "basis_entries_cleared",
    "node_integrands_completed", "tail_unknown_count",
    "active_mass_derivative_count", "tail_unknown_order", "tail64",
    "tail64_bits", "tail_derivative64", "tail_derivative64_bits",
    "mass_residual", "mass_residual_bits", "mass_jacobian_row",
    "mass_jacobian_row_bits", "barrier_order", "get_d_barrier_count",
    "exact_q_zero_barrier_count", "chronology_event_count",
    "chronology_sha256", "state_f64le_sha256",
    "projected_state_f64le_sha256", "join_f64le_sha256", "core64",
    "core64_bits", "projected_l2_nu", "projected_l2_nu_bits",
    "primary_numerics_policy_sha256",
    "primary_numerics_policy_canonical_size_bytes",
    "primary_numerics_policy_source_sha256",
    "primary_numerics_policy_source_size_bytes",
    "binary64_environment_source_sha256",
    "binary64_environment_source_size_bytes", "fixture_manifest_sha256",
    "fixture_manifest_size_bytes", "fixture_records_sha256",
    "fixture_records_size_bytes", "fixture_generator_sha256",
    "fixture_generator_size_bytes", "fixture_independent_test_sha256",
    "fixture_independent_test_size_bytes",
    "core_integral_continuation_source_sha256",
    "core_integral_continuation_source_size_bytes",
    "core_integral_continuation_source_status", "join_extraction_source_sha256",
    "join_extraction_source_size_bytes", "join_extraction_source_status",
    "combined_tail_operator_source_sha256",
    "combined_tail_operator_source_size_bytes",
    "combined_tail_operator_source_status", "production_dependencies_sealed",
    "binary64_runtime_family", "mpfr_precision_bits", "mpfr_rounding_mode",
    "mpfr_emin", "mpfr_emax", "observed_gmpy2_version",
    "observed_mpfr_version", "synthetic_dependencies_used",
    "synthetic_reduced_cell_graph_executed",
    "same_fixed_4096_cell_partition_used",
    "full_4096_cell_execution_observed", "full_4096_cell_golden_verified",
    "tail_sum_is_partial", "production_adapter_available",
    "implementation_closure_complete", "runtime_closure_complete",
    "core_integral_continuation_executed_here", "pde_rows_evaluated_here",
    "combined_operator_evaluated", "newton_implemented", "solve_performed",
    "projected_source_acceptance_verified", "join_receipt_present",
    "candidate_execution_authorized", "candidate_executed",
    "candidate_output_materialized", "output_present", "output_accepted",
    "seed_accepted", "branch_accepted", "nondegeneracy_accepted",
    "replay_authority", "independent_agreement",
    "semiclassical_stress_noise_lamp",
    "semiclassical_constraint_algebra_lamp", "diagnostic_pass_authority",
    "candidate_authority", "theory_graph_authority", "physical_authority",
    "propulsion_authority", "transport_authority",
)
_INITIALIZER_RESULT_FIELDS: Final[tuple[str, ...]] = (
    "projected_node_count", "projected_unknown_count", "tail_node_count",
    "tail_unknown_count", "radius", "tail_unknown_order", "initial_state",
    "initial_state_bits", "initial_state_f64le_sha256", "projected_l2_nu",
    "projected_l2_nu_bits", "projected_state_f64le_sha256", "core64",
    "core64_bits", "join_barriers", "join_barrier_bits",
    "join_barrier_f64le_sha256", "invariant_order", "invariant_values",
    "invariant_bits", "kappa", "a", "sigma", "H1", "Hy1", "Q1", "Qy1",
    "primary_numerics_policy_sha256",
    "primary_numerics_policy_canonical_size_bytes",
    "binary64_environment_source_sha256",
    "binary64_environment_source_size_bytes", "join_extraction_source_sha256",
    "join_extraction_source_size_bytes", "join_extraction_source_status",
    "core_integral_continuation_source_sha256",
    "core_integral_continuation_source_size_bytes",
    "core_integral_continuation_source_status", "production_dependencies_sealed",
    "binary64_runtime_family", "mpfr_precision_bits", "mpfr_rounding_mode",
    "mpfr_emin", "mpfr_emax", "observed_gmpy2_version",
    "observed_mpfr_version", "synthetic_dependencies_used",
    "calculation_implemented", "initializer_vector_computed",
    "c1_lift_diagnostic_computed", "core64_barrier_consumption_count",
    "core64_barrier_copy_count", "h_positive_zero_count",
    "q_positive_zero_count", "production_adapter_available",
    "core_integral_continuation_executed", "mass_row_implemented",
    "mass_quadrature_implemented", "newton_implemented", "solve_performed",
    "projected_source_acceptance_verified", "join_receipt_present",
    "implementation_closure_complete", "runtime_closure_complete",
    "candidate_execution_authorized", "candidate_executed",
    "candidate_output_materialized", "output_present", "output_accepted",
    "seed_accepted", "branch_accepted", "nondegeneracy_accepted",
    "replay_authority", "independent_agreement", "directed_proof_authority",
    "semiclassical_stress_noise_lamp",
    "semiclassical_constraint_algebra_lamp", "diagnostic_pass_authority",
    "candidate_authority", "theory_graph_authority", "physical_authority",
    "propulsion_authority", "transport_authority",
)
_INITIALIZER_TOKEN_FIELDS: Final[tuple[str, ...]] = (
    "result", "core_integral_result", "core_integral_continuation",
    "core_sum", "core64",
)
_PDE_FALSE_FIELDS: Final[tuple[str, ...]] = (
    "mass_row_implemented", "quadrature_implemented", "newton_implemented",
    "solve_performed", "candidate_execution_authorized",
    "candidate_executed", "candidate_output_materialized", "output_present",
    "output_accepted", "seed_accepted", "branch_accepted",
    "replay_authority", "independent_agreement",
    "diagnostic_pass_authority", "candidate_authority",
    "theory_graph_authority", "physical_authority", "propulsion_authority",
    "transport_authority",
)
_MASS_FALSE_FIELDS: Final[tuple[str, ...]] = (
    "full_4096_cell_golden_verified", "production_adapter_available",
    "implementation_closure_complete", "runtime_closure_complete",
    "core_integral_continuation_executed_here", "pde_rows_evaluated_here",
    "combined_operator_evaluated", "newton_implemented", "solve_performed",
    "projected_source_acceptance_verified", "join_receipt_present",
    "candidate_execution_authorized", "candidate_executed",
    "candidate_output_materialized", "output_present", "output_accepted",
    "seed_accepted", "branch_accepted", "nondegeneracy_accepted",
    "replay_authority", "independent_agreement",
    "semiclassical_stress_noise_lamp",
    "semiclassical_constraint_algebra_lamp", "diagnostic_pass_authority",
    "candidate_authority", "theory_graph_authority", "physical_authority",
    "propulsion_authority", "transport_authority",
)
_INITIALIZER_ALWAYS_FALSE_FIELDS: Final[tuple[str, ...]] = (
    "mass_row_implemented", "mass_quadrature_implemented",
    "newton_implemented", "solve_performed",
    "projected_source_acceptance_verified", "join_receipt_present",
    "implementation_closure_complete", "runtime_closure_complete",
    "candidate_execution_authorized", "candidate_executed",
    "candidate_output_materialized", "output_present", "output_accepted",
    "seed_accepted", "branch_accepted", "nondegeneracy_accepted",
    "replay_authority", "independent_agreement", "directed_proof_authority",
    "semiclassical_stress_noise_lamp",
    "semiclassical_constraint_algebra_lamp", "diagnostic_pass_authority",
    "candidate_authority", "theory_graph_authority", "physical_authority",
    "propulsion_authority", "transport_authority",
)
_SESSION_FALSE_FIELDS: Final[tuple[str, ...]] = (
    "implementation_closure_complete", "runtime_closure_complete",
    "newton_implemented", "solve_performed",
    "candidate_execution_authorized", "candidate_executed", "output_present",
    "output_accepted", "seed_accepted", "branch_accepted", "replay_authority",
    "independent_agreement", "diagnostic_pass_authority",
    "candidate_authority", "theory_graph_authority", "physical_authority",
    "propulsion_authority", "transport_authority",
)
_RESULT_FALSE_FIELDS: Final[tuple[str, ...]] = (
    "production_adapter_available", "initializer_continuation_consumed",
    "implementation_closure_complete", "runtime_closure_complete",
    "newton_implemented", "solve_performed",
    "candidate_execution_authorized", "candidate_executed",
    "candidate_output_materialized", "output_present", "output_accepted",
    "seed_accepted", "branch_accepted", "nondegeneracy_accepted",
    "replay_authority", "independent_agreement",
    "diagnostic_pass_authority", "candidate_authority",
    "theory_graph_authority", "physical_authority", "propulsion_authority",
    "transport_authority",
)


def _verify_dependency_bindings() -> None:
    _read_bound_binary64_environment_source()
    _read_bound_tail_pde_operator_source()
    _read_bound_tail_mass_operator_source()
    _read_bound_tail_initializer_source()
    if (
        _binary64_environment.BINARY64_ENVIRONMENT_VERSION
        != "nhm2_spherical_boson_star_seed_producer_binary64_environment/v1"
        or any(
            value is not False
            for value in _binary64_environment.AUTHORITY_LOCKS.values()
        )
    ):
        raise TailOperatorError("tail_operator_fenv_abi_invalid")
    if (
        _tail_pde_module.TAIL_PDE_OPERATOR_VERSION
        != "nhm2_spherical_boson_star_seed_primary_tail_pde_operator/v1"
        or _tail_pde_module.BINARY64_ENVIRONMENT_SOURCE_SHA256
        != BINARY64_ENVIRONMENT_SOURCE_SHA256
        or _tail_pde_module.BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        != BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        or (_tail_pde_module.PDE_ROW_COUNT, _tail_pde_module.UNKNOWN_COUNT)
        != (PDE_ROW_COUNT, UNKNOWN_COUNT)
        or _tail_pde_module.UNKNOWN_ORDER != UNKNOWN_ORDER
        or _tail_pde_module.ROW_ORDER != "S[0..31],P[0..31]"
        or tuple(_tail_pde_module.FrozenTailPdeEvaluation.__dataclass_fields__)
        != _PDE_RESULT_FIELDS
        or any(
            value is not False
            for value in _tail_pde_module.AUTHORITY_LOCKS.values()
        )
        or not callable(_tail_pde_module.evaluate_tail_pde_operator)
    ):
        raise TailOperatorError("tail_operator_pde_abi_invalid")
    if (
        _tail_mass_module.TAIL_MASS_OPERATOR_VERSION
        != "nhm2_spherical_boson_star_seed_primary_tail_mass_operator/v1"
        or _tail_mass_module.BINARY64_ENVIRONMENT_SOURCE_SHA256
        != BINARY64_ENVIRONMENT_SOURCE_SHA256
        or _tail_mass_module.BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        != BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        or _tail_mass_module.TAIL_UNKNOWN_COUNT != UNKNOWN_COUNT
        or _tail_mass_module.TAIL_UNKNOWN_ORDER != UNKNOWN_ORDER
        or _tail_mass_module.FULL_TAIL_CELL_COUNT != FULL_TAIL_CELL_COUNT
        or tuple(_tail_mass_module.FrozenTailMassDiagnostic.__dataclass_fields__)
        != _MASS_RESULT_FIELDS
        or any(
            value is not False
            for value in _tail_mass_module.AUTHORITY_LOCKS.values()
        )
        or _tail_mass_module.PRODUCTION_DEPENDENCIES_SEALED is not False
        or _tail_mass_module.COMBINED_TAIL_OPERATOR_SOURCE_SHA256 is not None
        or _tail_mass_module.COMBINED_TAIL_OPERATOR_SOURCE_SIZE_BYTES is not None
        or not callable(_tail_mass_module._evaluate_tail_mass_graph)
    ):
        raise TailOperatorError("tail_operator_mass_abi_invalid")
    if (
        _tail_initializer_module.TAIL_INITIALIZER_VERSION
        != "nhm2_spherical_boson_star_seed_primary_tail_initializer/v1"
        or _tail_initializer_module.BINARY64_ENVIRONMENT_SOURCE_SHA256
        != BINARY64_ENVIRONMENT_SOURCE_SHA256
        or _tail_initializer_module.BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        != BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        or _tail_initializer_module.PROJECTED_NODE_COUNT
        != PROJECTED_L2_NODE_COUNT
        or _tail_initializer_module.PROJECTED_UNKNOWN_COUNT
        != PROJECTED_L2_UNKNOWN_COUNT
        or _tail_initializer_module.TAIL_UNKNOWN_COUNT != UNKNOWN_COUNT
        or _tail_initializer_module.TAIL_UNKNOWN_ORDER != UNKNOWN_ORDER
        or _tail_initializer_module.MPFR_PRECISION_BITS != 256
        or _tail_initializer_module.PRODUCTION_DEPENDENCIES_SEALED is not True
        or tuple(getattr(
            _tail_initializer_module.FrozenTailInitializerDiagnostic,
            "__dataclass_fields__",
        )) != _INITIALIZER_RESULT_FIELDS
        or tuple(getattr(
            _tail_initializer_module._TailInitializerContinuationToken,
            "__dataclass_fields__",
        )) != _INITIALIZER_TOKEN_FIELDS
        or any(
            value is not False
            for value in _tail_initializer_module.AUTHORITY_LOCKS.values()
        )
        or not callable(
            _tail_initializer_module._consume_tail_initializer_continuation
        )
        or not callable(
            _tail_initializer_module._materialize_tail_initializer_graph
        )
        or not callable(
            _tail_initializer_module._register_tail_initializer_continuation
        )
    ):
        raise TailOperatorError("tail_operator_initializer_abi_invalid")
    nested_fenvs = (
        _tail_pde_module._binary64_environment,
        _tail_mass_module._binary64_environment,
        _tail_initializer_module._binary64_environment,
    )
    if (
        any(module is _binary64_environment for module in nested_fenvs)
        or len({id(module) for module in nested_fenvs}) != len(nested_fenvs)
        or any(
            module.BINARY64_ENVIRONMENT_VERSION
            != _binary64_environment.BINARY64_ENVIRONMENT_VERSION
            or any(value is not False for value in module.AUTHORITY_LOCKS.values())
            for module in nested_fenvs
        )
    ):
        raise TailOperatorError("tail_operator_nested_fenv_abi_invalid")


def _f64_bits(value: float) -> bytes:
    return struct.pack("<d", value)


def _f64_hex(value: float) -> str:
    return _f64_bits(value).hex()


def _negative_zero(value: float) -> bool:
    return value == 0.0 and _f64_bits(value) == bytes.fromhex(
        "0000000000000080"
    )


def _sha256_valid(value: object) -> bool:
    return (
        type(value) is str
        and len(value) == 64
        and value != "0" * 64
        and all(character in "0123456789abcdef" for character in value)
    )


def _validate_f64(value: object, detail: str) -> float:
    if type(value) is not float:
        raise TailOperatorError("tail_operator_binary64_type_invalid", detail)
    if not math.isfinite(value):
        raise TailOperatorError("tail_operator_binary64_nonfinite_input", detail)
    if _negative_zero(value):
        raise TailOperatorError(
            "tail_operator_binary64_negative_zero_input", detail
        )
    return 0.0 if value == 0.0 else value


def _f64_tuple_sha256(domain: bytes, values: tuple[float, ...]) -> str:
    digest = hashlib.sha256(domain)
    digest.update(struct.pack(f"<{len(values)}d", *values))
    return digest.hexdigest()


def _snapshot_state(value: object) -> tuple[float, ...]:
    if type(value) is not tuple or len(value) != UNKNOWN_COUNT:
        raise TailOperatorError("tail_operator_state_shape_invalid")
    snapshot = tuple(
        _validate_f64(value[index], f"state[{index}]")
        for index in range(UNKNOWN_COUNT)
    )
    return snapshot


def _snapshot_projected_state(value: object) -> tuple[float, ...]:
    if type(value) is not tuple or len(value) != PROJECTED_L2_UNKNOWN_COUNT:
        raise TailOperatorError("tail_operator_projected_state_shape_invalid")
    snapshot = tuple(
        _validate_f64(value[index], f"projected_l2_state[{index}]")
        for index in range(PROJECTED_L2_UNKNOWN_COUNT)
    )
    if _f64_bits(snapshot[PROJECTED_L2_NODE_COUNT - 1]) != bytes(8):
        raise TailOperatorError("tail_operator_projected_u_infinity_invalid")
    if _f64_bits(snapshot[(2 * PROJECTED_L2_NODE_COUNT) - 1]) != bytes(8):
        raise TailOperatorError("tail_operator_projected_V_infinity_invalid")
    if snapshot[-1] >= 0.0:
        raise TailOperatorError("tail_operator_projected_nu_domain_invalid")
    return snapshot


def _validate_mode(value: object) -> str:
    if type(value) is not str or value not in EVALUATION_MODES:
        raise TailOperatorError("tail_operator_mode_invalid", type(value).__name__)
    return value


def _validate_synthetic_cell_count(value: object) -> int:
    if type(value) is not int or not 1 <= value <= FULL_TAIL_CELL_COUNT:
        raise TailOperatorError(
            "tail_operator_synthetic_cell_count_invalid", type(value).__name__
        )
    return value


def _validate_initializer_result(
    value: object,
    *,
    projected_snapshot: tuple[float, ...],
    join_values: tuple[float, float, float, float],
    synthetic_dependencies_used: bool,
) -> tuple[tuple[float, ...], float]:
    initializer = _tail_initializer_module
    if type(value) is not initializer.FrozenTailInitializerDiagnostic:
        raise TailOperatorError(
            "tail_operator_initializer_result_type_invalid",
            type(value).__name__,
        )
    result = value
    if (
        result.projected_node_count != PROJECTED_L2_NODE_COUNT
        or result.projected_unknown_count != PROJECTED_L2_UNKNOWN_COUNT
        or result.tail_node_count != 32
        or result.tail_unknown_count != UNKNOWN_COUNT
        or result.radius != 32
        or result.tail_unknown_order != UNKNOWN_ORDER
        or result.primary_numerics_policy_sha256
        != initializer.PRIMARY_NUMERICS_POLICY_SHA256
        or result.primary_numerics_policy_canonical_size_bytes
        != initializer.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or result.binary64_environment_source_sha256
        != BINARY64_ENVIRONMENT_SOURCE_SHA256
        or result.binary64_environment_source_size_bytes
        != BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        or result.join_extraction_source_sha256
        != initializer.JOIN_EXTRACTION_SOURCE_SHA256
        or result.join_extraction_source_size_bytes
        != initializer.JOIN_EXTRACTION_SOURCE_SIZE_BYTES
        or result.join_extraction_source_status
        != initializer.JOIN_EXTRACTION_SOURCE_STATUS
        or result.core_integral_continuation_source_sha256
        != initializer.CORE_INTEGRAL_CONTINUATION_SOURCE_SHA256
        or result.core_integral_continuation_source_size_bytes
        != initializer.CORE_INTEGRAL_CONTINUATION_SOURCE_SIZE_BYTES
        or result.core_integral_continuation_source_status
        != initializer.CORE_INTEGRAL_CONTINUATION_SOURCE_STATUS
        or result.production_dependencies_sealed is not True
        or result.binary64_runtime_family
        != _binary64_environment.BINARY64_RUNTIME_FAMILY
        or result.mpfr_precision_bits != initializer.MPFR_PRECISION_BITS
        or result.mpfr_rounding_mode != initializer.MPFR_ROUNDING_MODE
        or result.mpfr_emin != initializer.MPFR_EMIN
        or result.mpfr_emax != initializer.MPFR_EMAX
        or result.observed_gmpy2_version != gmpy2.version()
        or result.observed_mpfr_version != gmpy2.mpfr_version()
        or result.synthetic_dependencies_used is not synthetic_dependencies_used
        or result.production_adapter_available
        is not (not synthetic_dependencies_used)
        or result.core_integral_continuation_executed
        is not (not synthetic_dependencies_used)
        or result.calculation_implemented is not True
        or result.initializer_vector_computed is not True
        or result.c1_lift_diagnostic_computed is not True
        or result.core64_barrier_consumption_count != 1
        or result.core64_barrier_copy_count != 1
        or result.h_positive_zero_count != 32
        or result.q_positive_zero_count != 32
        or any(
            getattr(result, field, None) is not False
            for field in _INITIALIZER_ALWAYS_FALSE_FIELDS
        )
    ):
        raise TailOperatorError("tail_operator_initializer_result_abi_invalid")

    initial_state = _snapshot_state(result.initial_state)
    initial_bits = tuple(_f64_hex(component) for component in initial_state)
    initial_hash = initializer._f64_tuple_sha256(
        initializer.INITIAL_STATE_HASH_DOMAIN, initial_state
    )
    if (
        type(result.initial_state_bits) is not tuple
        or result.initial_state_bits != initial_bits
        or result.initial_state_f64le_sha256 != initial_hash
        or any(_f64_bits(component) != bytes(8) for component in initial_state[1:])
    ):
        raise TailOperatorError("tail_operator_initializer_state_invalid")

    projected_hash = initializer._f64_tuple_sha256(
        initializer.PROJECTED_STATE_HASH_DOMAIN, projected_snapshot
    )
    if (
        type(result.projected_l2_nu) is not float
        or _f64_bits(result.projected_l2_nu) != _f64_bits(projected_snapshot[-1])
        or result.projected_l2_nu_bits != _f64_hex(projected_snapshot[-1])
        or result.projected_state_f64le_sha256 != projected_hash
    ):
        raise TailOperatorError(
            "tail_operator_initializer_projected_receipt_invalid"
        )

    if type(result.join_barriers) is not tuple or len(result.join_barriers) != 4:
        raise TailOperatorError("tail_operator_initializer_join_shape_invalid")
    initializer_join = tuple(
        _validate_f64(component, f"initializer.join[{index}]")
        for index, component in enumerate(result.join_barriers)
    )
    join_bits = tuple(_f64_hex(component) for component in initializer_join)
    join_hash = initializer._f64_tuple_sha256(
        initializer.JOIN_BARRIER_HASH_DOMAIN, initializer_join
    )
    if (
        any(
            _f64_bits(initializer_join[index]) != _f64_bits(join_values[index])
            for index in range(4)
        )
        or result.join_barrier_bits != join_bits
        or result.join_barrier_f64le_sha256 != join_hash
    ):
        raise TailOperatorError("tail_operator_initializer_join_receipt_invalid")

    core64 = _validate_f64(result.core64, "initializer.core64")
    if (
        core64 <= 0.0
        or result.core64_bits != _f64_hex(core64)
        or _f64_bits(initial_state[0]) != _f64_bits(core64)
    ):
        raise TailOperatorError("tail_operator_initializer_core64_invalid")

    if (
        result.invariant_order != initializer.INVARIANT_ORDER
        or type(result.invariant_values) is not tuple
        or len(result.invariant_values) != len(initializer.INVARIANT_ORDER)
    ):
        raise TailOperatorError("tail_operator_initializer_invariants_invalid")
    invariants = tuple(
        _validate_f64(component, f"initializer.invariant[{index}]")
        for index, component in enumerate(result.invariant_values)
    )
    named_invariants = (
        result.kappa, result.a, result.sigma, result.H1,
        result.Hy1, result.Q1, result.Qy1,
    )
    if (
        result.invariant_bits
        != tuple(_f64_hex(component) for component in invariants)
        or any(
            type(component) is not float
            or _f64_bits(component) != _f64_bits(invariants[index])
            for index, component in enumerate(named_invariants)
        )
    ):
        raise TailOperatorError("tail_operator_initializer_invariants_invalid")
    return initial_state, core64


def _validate_initializer_token(
    result: object,
    core64: float,
) -> object:
    initializer = _tail_initializer_module
    token = initializer._pending_tail_initializer_continuation
    if token is None:
        raise TailOperatorError("tail_operator_initializer_continuation_unavailable")
    if type(token) is not initializer._TailInitializerContinuationToken:
        raise TailOperatorError("tail_operator_initializer_continuation_type_invalid")
    if token.result is not result:
        raise TailOperatorError(
            "tail_operator_initializer_continuation_identity_mismatch"
        )
    if (
        token.core_integral_result is None
        or token.core_integral_continuation is None
        or type(token.core_sum) is not gmpy2.mpfr
        or token.core_sum.precision != initializer.MPFR_PRECISION_BITS
        or not gmpy2.is_finite(token.core_sum)
        or token.core_sum <= 0
        or gmpy2.is_signed(token.core_sum)
        or type(token.core64) is not float
        or _f64_bits(token.core64) != _f64_bits(core64)
    ):
        raise TailOperatorError(
            "tail_operator_initializer_continuation_binding_invalid"
        )
    return token


def _session_id(
    *,
    initializer_result: object,
    cell_count: int,
    synthetic_dependencies_used: bool,
) -> str:
    digest = hashlib.sha256(SESSION_ID_HASH_DOMAIN)
    for value in (
        initializer_result.initial_state_f64le_sha256,
        initializer_result.projected_state_f64le_sha256,
        initializer_result.join_barrier_f64le_sha256,
        TAIL_INITIALIZER_SOURCE_SHA256,
        TAIL_PDE_OPERATOR_SOURCE_SHA256,
        TAIL_MASS_OPERATOR_SOURCE_SHA256,
    ):
        digest.update(bytes.fromhex(value))
    digest.update(_f64_bits(initializer_result.core64))
    digest.update(cell_count.to_bytes(4, "little"))
    digest.update(b"\x01" if synthetic_dependencies_used else b"\x00")
    return digest.hexdigest()


def _open_tail_operator_session(
    *,
    initializer_result: object,
    collocation: object,
    join_barriers: object,
    projected_l2_state: object,
    synthetic_mass_cell_count: object,
    synthetic_dependencies_used: object,
    _shared_instance_authority: object = None,
) -> FrozenTailOperatorSession:
    """Consume one continuation from this module's exact initializer instance."""

    global _active_tail_operator_session
    with _binary64_environment.nearest_binary64_environment():
        _verify_dependency_bindings()
        if _active_tail_operator_session is not None:
            raise TailOperatorError("tail_operator_session_already_active")
        if type(synthetic_dependencies_used) is not bool:
            raise TailOperatorError("tail_operator_session_synthetic_flag_invalid")
        if synthetic_dependencies_used:
            if _shared_instance_authority is not None:
                raise TailOperatorError(
                    "tail_operator_shared_session_authority_invalid"
                )
            cell_count = _validate_synthetic_cell_count(
                synthetic_mass_cell_count
            )
        else:
            if _shared_instance_authority is not _SHARED_SESSION_AUTHORITY:
                raise TailOperatorError(
                    "tail_operator_shared_initializer_instance_composition_blocked",
                    PRODUCTION_SESSION_COMPOSITION_STATUS,
                )
            if synthetic_mass_cell_count != FULL_TAIL_CELL_COUNT:
                raise TailOperatorError(
                    "tail_operator_bound_mass_cell_count_invalid"
                )
            cell_count = FULL_TAIL_CELL_COUNT
        try:
            _tail_pde_module._validate_tail_collocation(collocation)
            join_values = (
                _tail_pde_module._validate_join_barriers(join_barriers)
                if synthetic_dependencies_used
                else _tail_pde_module._validate_owned_join_barriers(
                    _tail_initializer_module._join_extraction,
                    join_barriers,
                )
            )
        except _tail_pde_module.TailPdeOperatorError as error:
            raise TailOperatorError(
                "tail_operator_session_pde_binding_invalid", error.code
            ) from error
        projected_snapshot = _snapshot_projected_state(projected_l2_state)
        initial_state, core64 = _validate_initializer_result(
            initializer_result,
            projected_snapshot=projected_snapshot,
            join_values=join_values,
            synthetic_dependencies_used=synthetic_dependencies_used,
        )
        with _tail_initializer_module._owned_mpfr256_context():
            token = _validate_initializer_token(initializer_result, core64)
        if synthetic_dependencies_used:
            mass_core: object | None = _tail_mass_module._SyntheticCoreContinuation(
                core64=token.core64,
                core64_bits=_f64_hex(token.core64),
            )
        else:
            core_owner = _tail_initializer_module._core_quadrature
            core_token = token.core_integral_continuation
            if (
                type(core_token) is not core_owner._CoreIntegralContinuationToken
                or core_token.result is not token.core_integral_result
                or core_token.core_sum is not token.core_sum
                or type(core_token.core64) is not float
                or _f64_bits(core_token.core64) != _f64_bits(token.core64)
            ):
                raise TailOperatorError(
                    "tail_operator_owned_core_continuation_identity_invalid"
                )
            mass_core = None
        session_id = _session_id(
            initializer_result=initializer_result,
            cell_count=cell_count,
            synthetic_dependencies_used=synthetic_dependencies_used,
        )
        handle = FrozenTailOperatorSession(
            session_id_sha256=session_id,
            initial_state=initial_state,
            initial_state_bits=tuple(_f64_hex(value) for value in initial_state),
            initial_state_f64le_sha256=(
                initializer_result.initial_state_f64le_sha256
            ),
            projected_state_f64le_sha256=(
                initializer_result.projected_state_f64le_sha256
            ),
            join_barrier_f64le_sha256=(
                initializer_result.join_barrier_f64le_sha256
            ),
            core64=token.core64,
            core64_bits=_f64_hex(token.core64),
            synthetic_mass_cell_count=cell_count,
            initializer_continuation_consumption_count=1,
            retained_core_get_d_count=1,
            tail_initializer_source_sha256=TAIL_INITIALIZER_SOURCE_SHA256,
            tail_initializer_source_size_bytes=TAIL_INITIALIZER_SOURCE_SIZE_BYTES,
            synthetic_dependencies_used=synthetic_dependencies_used,
            production_adapter_available=not synthetic_dependencies_used,
        )
        persistent = _PersistentTailOperatorSession(
            handle=handle,
            initializer_result=initializer_result,
            initializer_continuation=token,
            core_integral_continuation=token.core_integral_continuation,
            collocation=collocation,
            join_barriers=join_barriers,
            projected_l2_state=projected_snapshot,
            core_continuation=mass_core,
            core_sum=token.core_sum,
            core64=token.core64,
            synthetic_mass_cell_count=cell_count,
        )
        try:
            consumed = (
                _tail_initializer_module._consume_tail_initializer_continuation(
                    initializer_result
                )
            )
        except _tail_initializer_module.TailInitializerError as error:
            raise TailOperatorError(
                "tail_operator_initializer_continuation_consumption_failed",
                error.code,
            ) from error
        if consumed is not token:
            raise TailOperatorError(
                "tail_operator_initializer_continuation_consumption_mismatch"
            )
        _active_tail_operator_session = persistent
        return handle


def _open_bound_tail_operator_session(
    *,
    initializer_result: object,
    collocation: object,
    join_barriers: object,
    projected_l2_state: object,
) -> FrozenTailOperatorSession:
    """Open the exact shared-instance path with a forced full-4096 mass graph."""

    return _open_tail_operator_session(
        initializer_result=initializer_result,
        collocation=collocation,
        join_barriers=join_barriers,
        projected_l2_state=projected_l2_state,
        synthetic_mass_cell_count=FULL_TAIL_CELL_COUNT,
        synthetic_dependencies_used=False,
        _shared_instance_authority=_SHARED_SESSION_AUTHORITY,
    )


def _require_active_session(value: object) -> _PersistentTailOperatorSession:
    active = _active_tail_operator_session
    if active is None:
        raise TailOperatorError("tail_operator_session_unavailable")
    if type(value) is not FrozenTailOperatorSession or value is not active.handle:
        raise TailOperatorError("tail_operator_session_identity_mismatch")
    if (
        any(getattr(value, field, None) is not False for field in _SESSION_FALSE_FIELDS)
        or value.production_adapter_available
        is not (not value.synthetic_dependencies_used)
    ):
        raise TailOperatorError("tail_operator_session_authority_lock_invalid")
    return active


def _claim_tail_operator_session(
    value: object, initial_state: object
) -> _PersistentTailOperatorSession:
    """Grant one solver-exclusive lease bound to the initializer state bits."""

    active = _require_active_session(value)
    if (
        active.solve_claimed
        or active.terminal
        or active.evaluation_count != 0
        or active.final_residual_gate_started
    ):
        raise TailOperatorError("tail_operator_session_not_virgin")
    selected = _snapshot_state(initial_state)
    selected_bits = tuple(_f64_hex(component) for component in selected)
    selected_hash = _tail_initializer_module._f64_tuple_sha256(
        _tail_initializer_module.INITIAL_STATE_HASH_DOMAIN, selected
    )
    if (
        selected_bits != active.handle.initial_state_bits
        or selected_hash != active.handle.initial_state_f64le_sha256
        or any(
            _f64_bits(selected[index])
            != _f64_bits(active.handle.initial_state[index])
            for index in range(UNKNOWN_COUNT)
        )
    ):
        raise TailOperatorError("tail_operator_initial_state_binding_mismatch")
    active.solve_claimed = True
    return active


def _abort_tail_operator_session(value: object) -> None:
    """Make a claimed session terminal after the chronologically first failure."""

    active = _require_active_session(value)
    if not active.solve_claimed:
        raise TailOperatorError("tail_operator_session_not_claimed")
    active.terminal = True


def _complete_tail_operator_session(value: object) -> None:
    """Verify that one claimed solve ended in exactly one successful F-only gate."""

    active = _require_active_session(value)
    if (
        not active.solve_claimed
        or not active.terminal
        or not active.final_residual_gate_started
        or active.final_residual_gate_evaluation_count != 1
    ):
        raise TailOperatorError("tail_operator_session_terminal_invariant")


def _release_tail_operator_session(value: object) -> None:
    """Test/lifecycle hook; a forged or stale receipt cannot release a session."""

    global _active_tail_operator_session
    _require_active_session(value)
    _active_tail_operator_session = None


def _open_synthetic_tail_operator_session(
    *,
    collocation: object,
    join_barriers: object,
    projected_l2_state: object,
    retained_core_sum: object,
    retained_core64: object,
    synthetic_mass_cell_count: object,
) -> FrozenTailOperatorSession:
    """Mint a diagnostic session wholly inside the exact initializer instance."""

    with _binary64_environment.nearest_binary64_environment():
        _verify_dependency_bindings()
        if _active_tail_operator_session is not None:
            raise TailOperatorError("tail_operator_session_already_active")
        if _tail_initializer_module._pending_tail_initializer_continuation is not None:
            raise TailOperatorError(
                "tail_operator_initializer_continuation_already_pending"
            )
        cell_count = _validate_synthetic_cell_count(synthetic_mass_cell_count)
        try:
            _tail_pde_module._validate_tail_collocation(collocation)
            join_values = _tail_pde_module._validate_join_barriers(join_barriers)
        except _tail_pde_module.TailPdeOperatorError as error:
            raise TailOperatorError(
                "tail_operator_session_pde_binding_invalid", error.code
            ) from error
        projected_snapshot = _snapshot_projected_state(projected_l2_state)
        core64 = _validate_f64(retained_core64, "retained_core64")
        with _tail_initializer_module._owned_mpfr256_context():
            if (
                type(retained_core_sum) is not gmpy2.mpfr
                or retained_core_sum.precision
                != _tail_initializer_module.MPFR_PRECISION_BITS
                or not gmpy2.is_finite(retained_core_sum)
                or retained_core_sum <= 0
                or gmpy2.is_signed(retained_core_sum)
                or core64 <= 0.0
                or retained_core_sum
                != gmpy2.mpfr(
                    core64, _tail_initializer_module.MPFR_PRECISION_BITS
                )
            ):
                raise TailOperatorError(
                    "tail_operator_synthetic_retained_core_invalid"
                )
        initializer_join = _tail_initializer_module._SyntheticJoinBarriers(
            U=join_values[0],
            U1=join_values[1],
            V=join_values[2],
            V1=join_values[3],
            barrier_values=join_values,
        )
        initializer_core = (
            _tail_initializer_module._SyntheticCoreIntegralBarrier(
                core64=core64,
                core64_bits=_f64_hex(core64),
            )
        )
        try:
            initializer_result = (
                _tail_initializer_module._materialize_tail_initializer_graph(
                    projected_l2_state=projected_snapshot,
                    join_barriers=initializer_join,
                    core_integral=initializer_core,
                    synthetic_dependencies_used=True,
                )
            )
            retained = _SyntheticRetainedCoreContinuation(
                core_sum=retained_core_sum,
                core64=core64,
            )
            _tail_initializer_module._register_tail_initializer_continuation(
                initializer_result,
                initializer_core,
                retained,
            )
        except _tail_initializer_module.TailInitializerError as error:
            raise TailOperatorError(
                "tail_operator_synthetic_initializer_failed", error.code
            ) from error
        return _open_tail_operator_session(
            initializer_result=initializer_result,
            collocation=collocation,
            join_barriers=join_barriers,
            projected_l2_state=projected_snapshot,
            synthetic_mass_cell_count=cell_count,
            synthetic_dependencies_used=True,
        )


class _ChronologyTrace:
    __slots__ = ("_digest", "count")

    def __init__(self) -> None:
        self._digest = hashlib.sha256(CHRONOLOGY_HASH_DOMAIN)
        self.count = 0

    def record(self, label: str) -> None:
        if type(label) is not str or not label or len(label) > 256:
            raise TailOperatorError("tail_operator_trace_label_invalid")
        encoded = label.encode("ascii")
        self._digest.update(len(encoded).to_bytes(4, "little"))
        self._digest.update(encoded)
        self.count += 1

    def hexdigest(self) -> str:
        return self._digest.hexdigest()


def _validate_pde_result(
    result: object,
    *,
    mode: str,
    state_snapshot: tuple[float, ...],
    join_values: tuple[float, float, float, float],
) -> tuple[tuple[float, ...], tuple[tuple[float, ...], ...] | None]:
    if type(result) is not _tail_pde_module.FrozenTailPdeEvaluation:
        raise TailOperatorError(
            "tail_operator_pde_result_type_invalid", type(result).__name__
        )
    expected_labels = tuple(
        f"{kind}[{index}]" for kind in ("S", "P") for index in range(32)
    )
    expected_state_hash = _tail_pde_module._f64_tuple_sha256(
        _tail_pde_module.TAIL_STATE_HASH_DOMAIN, state_snapshot
    )
    expected_join_hash = _tail_pde_module._f64_tuple_sha256(
        _tail_pde_module.JOIN_BARRIER_HASH_DOMAIN, join_values
    )
    if (
        result.node_count != 32
        or result.unknown_count != UNKNOWN_COUNT
        or result.pde_row_count != PDE_ROW_COUNT
        or result.unknown_order != UNKNOWN_ORDER
        or result.row_order != "S[0..31],P[0..31]"
        or result.row_labels != expected_labels
        or result.tail_state_f64le_sha256 != expected_state_hash
        or result.join_barrier_f64le_sha256 != expected_join_hash
        or result.tail_node_payload_sha256
        != _tail_pde_module.TAIL_NODE_GOLDEN_SHA256
        or result.primary_numerics_policy_sha256
        != _tail_pde_module.PRIMARY_NUMERICS_POLICY_SHA256
        or result.primary_numerics_policy_canonical_size_bytes
        != _tail_pde_module.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or result.binary64_environment_source_sha256
        != BINARY64_ENVIRONMENT_SOURCE_SHA256
        or result.binary64_environment_source_size_bytes
        != BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        or result.tail_collocation_source_sha256
        != _tail_pde_module.TAIL_COLLOCATION_SOURCE_SHA256
        or result.tail_collocation_source_size_bytes
        != _tail_pde_module.TAIL_COLLOCATION_SOURCE_SIZE_BYTES
        or result.join_extraction_source_sha256
        != _tail_pde_module.JOIN_EXTRACTION_SOURCE_SHA256
        or result.join_extraction_source_size_bytes
        != _tail_pde_module.JOIN_EXTRACTION_SOURCE_SIZE_BYTES
        or result.binary64_runtime_family
        != _binary64_environment.BINARY64_RUNTIME_FAMILY
        or result.mpfr_precision_bits != _tail_pde_module.MPFR_PRECISION_BITS
        or result.mpfr_rounding_mode != _tail_pde_module.MPFR_ROUNDING_MODE
        or result.mpfr_emin != _tail_pde_module.MPFR_EMIN
        or result.mpfr_emax != _tail_pde_module.MPFR_EMAX
        or result.observed_gmpy2_version != gmpy2.version()
        or result.observed_mpfr_version != gmpy2.mpfr_version()
        or result.calculation_implemented is not True
        or result.analytic_jacobian_implemented is not True
        or result.chebyshev_streaming_implemented is not True
        or any(
            getattr(result, field, None) is not False
            for field in _PDE_FALSE_FIELDS
        )
    ):
        raise TailOperatorError("tail_operator_pde_result_abi_invalid")
    if type(result.residual) is not tuple or len(result.residual) != PDE_ROW_COUNT:
        raise TailOperatorError("tail_operator_pde_residual_shape_invalid")
    residual = tuple(
        _validate_f64(value, f"pde.residual[{row}]")
        for row, value in enumerate(result.residual)
    )
    if mode == FINAL_RESIDUAL_GATE_MODE:
        return residual, None
    jacobian_value = result.jacobian
    if type(jacobian_value) is not tuple or len(jacobian_value) != PDE_ROW_COUNT:
        raise TailOperatorError("tail_operator_pde_jacobian_shape_invalid")
    rows: list[tuple[float, ...]] = []
    for row_index, row in enumerate(jacobian_value):
        if type(row) is not tuple or len(row) != UNKNOWN_COUNT:
            raise TailOperatorError(
                "tail_operator_pde_jacobian_row_invalid", str(row_index)
            )
        rows.append(
            tuple(
                _validate_f64(value, f"pde.jacobian[{row_index},{column}]")
                for column, value in enumerate(row)
            )
        )
    return residual, tuple(rows)


def _validate_pde_residual_result(
    result: object,
    *,
    state_snapshot: tuple[float, ...],
    join_values: tuple[float, float, float, float],
) -> tuple[float, ...]:
    if type(result) is not _tail_pde_module._FrozenTailPdeResidual:
        raise TailOperatorError(
            "tail_operator_pde_residual_result_type_invalid",
            type(result).__name__,
        )
    expected_labels = tuple(
        f"{kind}[{index}]" for kind in ("S", "P") for index in range(32)
    )
    if (
        result.node_count != 32
        or result.pde_row_count != PDE_ROW_COUNT
        or result.row_labels != expected_labels
        or result.tail_state_f64le_sha256
        != _tail_pde_module._f64_tuple_sha256(
            _tail_pde_module.TAIL_STATE_HASH_DOMAIN, state_snapshot
        )
        or result.join_barrier_f64le_sha256
        != _tail_pde_module._f64_tuple_sha256(
            _tail_pde_module.JOIN_BARRIER_HASH_DOMAIN, join_values
        )
        or result.tail_node_payload_sha256
        != _tail_pde_module.TAIL_NODE_GOLDEN_SHA256
        or result.residual_only_graph_executed is not True
        or result.dual_graph_executed is not False
        or result.jacobian_computed is not False
        or hasattr(result, "jacobian")
        or type(result.residual) is not tuple
        or len(result.residual) != PDE_ROW_COUNT
    ):
        raise TailOperatorError("tail_operator_pde_residual_result_abi_invalid")
    return tuple(
        _validate_f64(value, f"pde.residual[{row}]")
        for row, value in enumerate(result.residual)
    )


def _make_mass_join(join_barriers: object) -> object:
    try:
        values = join_barriers.barrier_values
        return _tail_mass_module._SyntheticJoinBarriers(
            U=join_barriers.U,
            U1=join_barriers.U1,
            V=join_barriers.V,
            V1=join_barriers.V1,
            barrier_values=values,
        )
    except (AttributeError, TypeError) as error:
        raise TailOperatorError(
            "tail_operator_join_adapter_failed", type(error).__name__
        ) from error


def _validate_mass_result(
    result: object,
    *,
    mode: str,
    cell_count: int,
    state_snapshot: tuple[float, ...],
    projected_snapshot: tuple[float, ...],
    mass_join: object,
    expected_core64: float,
    synthetic_dependencies_used: bool,
) -> tuple[float, tuple[float, ...] | None]:
    if type(result) is not _tail_mass_module.FrozenTailMassDiagnostic:
        raise TailOperatorError(
            "tail_operator_mass_result_type_invalid", type(result).__name__
        )
    expected_state_hash = _tail_mass_module._f64_tuple_sha256(
        _tail_mass_module.STATE_HASH_DOMAIN, state_snapshot
    )
    expected_projected_hash = _tail_mass_module._f64_tuple_sha256(
        _tail_mass_module.PROJECTED_STATE_HASH_DOMAIN, projected_snapshot
    )
    expected_join = mass_join.barrier_values
    expected_join_hash = _tail_mass_module._f64_tuple_sha256(
        _tail_mass_module.JOIN_HASH_DOMAIN, expected_join
    )
    full_observed = cell_count == FULL_TAIL_CELL_COUNT
    if (
        result.full_tail_cell_count != FULL_TAIL_CELL_COUNT
        or result.synthetic_cells_completed != cell_count
        or result.gl_point_count != 256
        or result.points_completed != cell_count * 256
        or result.basis_entries_completed != cell_count * 256 * 32
        or result.basis_entries_cleared != cell_count * 256 * 32
        or result.node_integrands_completed != cell_count * 256
        or result.tail_unknown_count != UNKNOWN_COUNT
        or result.active_mass_derivative_count != 33
        or result.tail_unknown_order != UNKNOWN_ORDER
        or result.state_f64le_sha256 != expected_state_hash
        or result.projected_state_f64le_sha256 != expected_projected_hash
        or result.join_f64le_sha256 != expected_join_hash
        or result.projected_l2_nu_bits != _f64_hex(projected_snapshot[-1])
        or type(result.projected_l2_nu) is not float
        or _f64_bits(result.projected_l2_nu)
        != _f64_bits(projected_snapshot[-1])
        or type(result.core64) is not float
        or _f64_bits(result.core64) != _f64_bits(expected_core64)
        or result.core64_bits != _f64_hex(expected_core64)
        or result.primary_numerics_policy_sha256
        != _tail_mass_module.PRIMARY_NUMERICS_POLICY_SHA256
        or result.primary_numerics_policy_canonical_size_bytes
        != _tail_mass_module.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or result.primary_numerics_policy_source_sha256
        != _tail_mass_module.PRIMARY_NUMERICS_POLICY_SOURCE_SHA256
        or result.primary_numerics_policy_source_size_bytes
        != _tail_mass_module.PRIMARY_NUMERICS_POLICY_SOURCE_SIZE_BYTES
        or result.binary64_environment_source_sha256
        != BINARY64_ENVIRONMENT_SOURCE_SHA256
        or result.binary64_environment_source_size_bytes
        != BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        or result.fixture_manifest_sha256
        != _tail_mass_module.GL256_MANIFEST_SHA256
        or result.fixture_manifest_size_bytes
        != _tail_mass_module.GL256_MANIFEST_SIZE_BYTES
        or result.fixture_records_sha256
        != _tail_mass_module.GL256_RECORDS_SHA256
        or result.fixture_records_size_bytes
        != _tail_mass_module.GL256_RECORDS_SIZE_BYTES
        or result.fixture_generator_sha256
        != _tail_mass_module.GL256_GENERATOR_SHA256
        or result.fixture_generator_size_bytes
        != _tail_mass_module.GL256_GENERATOR_SIZE_BYTES
        or result.fixture_independent_test_sha256
        != _tail_mass_module.GL256_INDEPENDENT_TEST_SHA256
        or result.fixture_independent_test_size_bytes
        != _tail_mass_module.GL256_INDEPENDENT_TEST_SIZE_BYTES
        or result.core_integral_continuation_source_sha256
        is not _tail_mass_module.CORE_INTEGRAL_CONTINUATION_SOURCE_SHA256
        or result.core_integral_continuation_source_size_bytes
        is not _tail_mass_module.CORE_INTEGRAL_CONTINUATION_SOURCE_SIZE_BYTES
        or result.core_integral_continuation_source_status
        != _tail_mass_module.CORE_INTEGRAL_CONTINUATION_SOURCE_STATUS
        or result.join_extraction_source_sha256
        is not _tail_mass_module.JOIN_EXTRACTION_SOURCE_SHA256
        or result.join_extraction_source_size_bytes
        is not _tail_mass_module.JOIN_EXTRACTION_SOURCE_SIZE_BYTES
        or result.join_extraction_source_status
        != _tail_mass_module.JOIN_EXTRACTION_SOURCE_STATUS
        or result.combined_tail_operator_source_sha256
        is not _tail_mass_module.COMBINED_TAIL_OPERATOR_SOURCE_SHA256
        or result.combined_tail_operator_source_size_bytes
        is not _tail_mass_module.COMBINED_TAIL_OPERATOR_SOURCE_SIZE_BYTES
        or result.combined_tail_operator_source_status
        != _tail_mass_module.COMBINED_TAIL_OPERATOR_SOURCE_STATUS
        or result.synthetic_dependencies_used is not synthetic_dependencies_used
        or result.same_fixed_4096_cell_partition_used is not True
        or result.synthetic_reduced_cell_graph_executed
        is not (synthetic_dependencies_used and not full_observed)
        or result.full_4096_cell_execution_observed is not full_observed
        or result.tail_sum_is_partial is not (not full_observed)
        or result.production_dependencies_sealed is not False
        or result.binary64_runtime_family
        != _binary64_environment.BINARY64_RUNTIME_FAMILY
        or result.mpfr_precision_bits != _tail_mass_module.MPFR_PRECISION_BITS
        or result.mpfr_rounding_mode != _tail_mass_module.MPFR_ROUNDING_MODE
        or result.mpfr_emin != _tail_mass_module.MPFR_EMIN
        or result.mpfr_emax != _tail_mass_module.MPFR_EMAX
        or result.observed_gmpy2_version != gmpy2.version()
        or result.observed_mpfr_version != gmpy2.mpfr_version()
        or any(
            getattr(result, field, None) is not False
            for field in _MASS_FALSE_FIELDS
        )
    ):
        raise TailOperatorError("tail_operator_mass_result_abi_invalid")
    mass_residual = _validate_f64(result.mass_residual, "mass.residual")
    tail64 = _validate_f64(result.tail64, "mass.tail64")
    expected_mass_residual = _tail_mass_module._f64_sub(
        _tail_mass_module._f64_sub(
            state_snapshot[0], expected_core64, "combined.mass.c_minus_core"
        ),
        tail64,
        "combined.mass.residual",
    )
    expected_barrier_order = (
        "tail.v",
        "tail.d[C]",
        *(f"tail.d[h{index}]" for index in range(32)),
        *(f"tail.d[q{index}].positive_zero" for index in range(32)),
    )
    if (
        result.mass_residual_bits != _f64_hex(mass_residual)
        or result.tail64_bits != _f64_hex(tail64)
        or _f64_bits(mass_residual) != _f64_bits(expected_mass_residual)
        or result.barrier_order != expected_barrier_order
        or result.get_d_barrier_count != 34
        or result.exact_q_zero_barrier_count != 32
        or type(result.chronology_event_count) is not int
        or result.chronology_event_count <= 0
        or not _sha256_valid(result.chronology_sha256)
    ):
        raise TailOperatorError("tail_operator_mass_residual_bits_invalid")
    if mode == FINAL_RESIDUAL_GATE_MODE:
        return mass_residual, None
    derivative_value = result.tail_derivative64
    derivative_bits = result.tail_derivative64_bits
    if (
        type(derivative_value) is not tuple
        or len(derivative_value) != UNKNOWN_COUNT
        or type(derivative_bits) is not tuple
        or len(derivative_bits) != UNKNOWN_COUNT
    ):
        raise TailOperatorError("tail_operator_mass_derivative_shape_invalid")
    derivatives = tuple(
        _validate_f64(value, f"mass.derivative[{column}]")
        for column, value in enumerate(derivative_value)
    )
    if (
        derivative_bits != tuple(_f64_hex(value) for value in derivatives)
        or any(_f64_bits(value) != bytes(8) for value in derivatives[33:])
    ):
        raise TailOperatorError("tail_operator_mass_derivative_bits_invalid")
    jacobian_value = result.mass_jacobian_row
    if type(jacobian_value) is not tuple or len(jacobian_value) != UNKNOWN_COUNT:
        raise TailOperatorError("tail_operator_mass_jacobian_shape_invalid")
    jacobian = tuple(
        _validate_f64(value, f"mass.jacobian[{column}]")
        for column, value in enumerate(jacobian_value)
    )
    expected_jacobian = (
        _tail_mass_module._f64_sub(
            1.0, derivatives[0], "combined.mass.J[0]"
        ),
        *(
            _tail_mass_module._f64_neg(
                derivatives[column], f"combined.mass.J[{column}]"
            )
            for column in range(1, 33)
        ),
        *((0.0,) * 32),
    )
    if (
        type(result.mass_jacobian_row_bits) is not tuple
        or result.mass_jacobian_row_bits
        != tuple(_f64_hex(value) for value in jacobian)
        or any(
            _f64_bits(jacobian[column]) != _f64_bits(expected_jacobian[column])
            for column in range(UNKNOWN_COUNT)
        )
    ):
        raise TailOperatorError("tail_operator_mass_jacobian_bits_invalid")
    return mass_residual, jacobian


def _validate_mass_residual_result(
    result: object,
    *,
    cell_count: int,
    state_snapshot: tuple[float, ...],
    projected_snapshot: tuple[float, ...],
    mass_join: object,
    expected_core64: float,
    synthetic_dependencies_used: bool,
) -> float:
    if type(result) is not _tail_mass_module._FrozenTailMassResidual:
        raise TailOperatorError(
            "tail_operator_mass_residual_result_type_invalid",
            type(result).__name__,
        )
    full_observed = cell_count == FULL_TAIL_CELL_COUNT
    expected_join = mass_join.barrier_values
    if (
        result.full_tail_cell_count != FULL_TAIL_CELL_COUNT
        or result.cells_completed != cell_count
        or result.gl_point_count != 256
        or result.points_completed != cell_count * 256
        or result.basis_entries_completed != cell_count * 256 * 32
        or result.basis_entries_cleared != cell_count * 256 * 32
        or result.node_integrands_completed != cell_count * 256
        or result.get_d_barrier_count != 1
        or result.state_f64le_sha256
        != _tail_mass_module._f64_tuple_sha256(
            _tail_mass_module.STATE_HASH_DOMAIN, state_snapshot
        )
        or result.projected_state_f64le_sha256
        != _tail_mass_module._f64_tuple_sha256(
            _tail_mass_module.PROJECTED_STATE_HASH_DOMAIN, projected_snapshot
        )
        or result.join_f64le_sha256
        != _tail_mass_module._f64_tuple_sha256(
            _tail_mass_module.JOIN_HASH_DOMAIN, expected_join
        )
        or type(result.core64) is not float
        or _f64_bits(result.core64) != _f64_bits(expected_core64)
        or result.core64_bits != _f64_hex(expected_core64)
        or type(result.projected_l2_nu) is not float
        or _f64_bits(result.projected_l2_nu)
        != _f64_bits(projected_snapshot[-1])
        or result.projected_l2_nu_bits != _f64_hex(projected_snapshot[-1])
        or result.synthetic_dependencies_used is not synthetic_dependencies_used
        or result.same_fixed_4096_cell_partition_used is not True
        or result.full_4096_cell_execution_observed is not full_observed
        or result.tail_sum_is_partial is not (not full_observed)
        or result.residual_only_graph_executed is not True
        or result.derivative_graph_executed is not False
        or result.jacobian_computed is not False
        or hasattr(result, "tail_derivative64")
        or hasattr(result, "mass_jacobian_row")
        or type(result.chronology_event_count) is not int
        or result.chronology_event_count <= 0
        or not _sha256_valid(result.chronology_sha256)
    ):
        raise TailOperatorError("tail_operator_mass_residual_result_abi_invalid")
    tail64 = _validate_f64(result.tail64, "mass.tail64")
    mass_residual = _validate_f64(result.mass_residual, "mass.residual")
    expected_mass = _tail_mass_module._f64_sub(
        _tail_mass_module._f64_sub(
            state_snapshot[0], expected_core64, "combined.mass.c_minus_core"
        ),
        tail64,
        "combined.mass.residual",
    )
    if (
        result.tail64_bits != _f64_hex(tail64)
        or result.mass_residual_bits != _f64_hex(mass_residual)
        or _f64_bits(mass_residual) != _f64_bits(expected_mass)
    ):
        raise TailOperatorError("tail_operator_mass_residual_bits_invalid")
    return mass_residual


def _evaluate_synthetic_tail_operator(
    *,
    collocation: object,
    join_barriers: object,
    projected_l2_state: object,
    core_continuation: object,
    state: object,
    mode: object,
    synthetic_mass_cell_count: object,
    synthetic_dependencies_used: object,
    _retained_core64: object = None,
    _shared_instance_authority: object = None,
) -> FrozenTailOperatorEvaluation:
    """Evaluate one authenticated composition without allocating a session."""

    with _binary64_environment.nearest_binary64_environment():
        _verify_dependency_bindings()
        if type(synthetic_dependencies_used) is not bool:
            raise TailOperatorError(
                "tail_operator_synthetic_flag_invalid",
                type(synthetic_dependencies_used).__name__,
            )
        if synthetic_dependencies_used:
            if (
                _retained_core64 is not None
                or _shared_instance_authority is not None
            ):
                raise TailOperatorError(
                    "tail_operator_shared_session_authority_invalid"
                )
            cell_count = _validate_synthetic_cell_count(
                synthetic_mass_cell_count
            )
        else:
            if _shared_instance_authority is not _SHARED_SESSION_AUTHORITY:
                if _shared_instance_authority is None:
                    raise TailOperatorError(
                        "tail_operator_synthetic_flag_invalid", "False"
                    )
                raise TailOperatorError("tail_operator_shared_session_authority_invalid")
            if synthetic_mass_cell_count != FULL_TAIL_CELL_COUNT:
                raise TailOperatorError(
                    "tail_operator_bound_mass_cell_count_invalid"
                )
            cell_count = FULL_TAIL_CELL_COUNT
        trace = _ChronologyTrace()
        trace.record("dependency.sources.rehashed")
        trace.record("dependency.abi.validated")

        trace.record("state.snapshot.begin")
        state_snapshot = _snapshot_state(state)
        del state
        for index in range(UNKNOWN_COUNT):
            trace.record(f"state.snapshot[{index}]")
        trace.record("state.snapshot.complete")
        selected_mode = _validate_mode(mode)
        trace.record(f"mode.{selected_mode}")

        trace.record("projected.snapshot.begin")
        projected_snapshot = _snapshot_projected_state(projected_l2_state)
        del projected_l2_state
        for index in range(PROJECTED_L2_UNKNOWN_COUNT):
            trace.record(f"projected.snapshot[{index}]")
        trace.record("projected.snapshot.complete")

        trace.record("pde.evaluate.begin")
        try:
            if synthetic_dependencies_used:
                pde_join_values = _tail_pde_module._validate_join_barriers(
                    join_barriers
                )
            else:
                pde_join_values = _tail_pde_module._validate_owned_join_barriers(
                    _tail_initializer_module._join_extraction,
                    join_barriers,
                )
            if selected_mode == NEWTON_MODE:
                if synthetic_dependencies_used:
                    raw_pde = _tail_pde_module.evaluate_tail_pde_operator(
                        collocation,
                        join_barriers,
                        projected_snapshot[-1],
                        state_snapshot,
                    )
                else:
                    raw_pde = (
                        _tail_pde_module._evaluate_tail_pde_operator_from_owned_join(
                            owner_join_module=(
                                _tail_initializer_module._join_extraction
                            ),
                            collocation=collocation,
                            join_barriers=join_barriers,
                            projected_l2_nu=projected_snapshot[-1],
                            state=state_snapshot,
                        )
                    )
            else:
                if synthetic_dependencies_used:
                    raw_pde = _tail_pde_module._evaluate_tail_pde_residual_only(
                        collocation,
                        join_barriers,
                        projected_snapshot[-1],
                        state_snapshot,
                    )
                else:
                    raw_pde = (
                        _tail_pde_module._evaluate_tail_pde_residual_from_owned_join(
                            owner_join_module=(
                                _tail_initializer_module._join_extraction
                            ),
                            collocation=collocation,
                            join_barriers=join_barriers,
                            projected_l2_nu=projected_snapshot[-1],
                            state=state_snapshot,
                        )
                    )
        except _tail_pde_module.TailPdeOperatorError as error:
            raise TailOperatorError(
                "tail_operator_pde_evaluation_failed", error.code
            ) from error
        except Exception as error:
            raise TailOperatorError(
                "tail_operator_pde_evaluator_raised", type(error).__name__
            ) from error
        if selected_mode == NEWTON_MODE:
            pde_residual, pde_jacobian = _validate_pde_result(
                raw_pde,
                mode=selected_mode,
                state_snapshot=state_snapshot,
                join_values=pde_join_values,
            )
        else:
            pde_residual = _validate_pde_residual_result(
                raw_pde,
                state_snapshot=state_snapshot,
                join_values=pde_join_values,
            )
            pde_jacobian = None
        trace.record("pde.evaluate.complete")

        residual: list[float] = []
        jacobian: list[tuple[float, ...]] | None = (
            [] if selected_mode == NEWTON_MODE else None
        )
        for row in range(PDE_ROW_COUNT):
            residual.append(pde_residual[row])
            trace.record(f"residual[{row}].stored")
            if selected_mode == NEWTON_MODE:
                if pde_jacobian is None or jacobian is None:
                    raise TailOperatorError("tail_operator_internal_mode_invariant")
                selected_row = pde_jacobian[row]
                jacobian.append(selected_row)
                for column in range(UNKNOWN_COUNT):
                    trace.record(f"jacobian[{row},{column}].stored")
            trace.record(f"row[{row}].complete")

        mass_join = (
            _make_mass_join(join_barriers)
            if synthetic_dependencies_used
            else join_barriers
        )
        trace.record("mass.evaluate.begin")
        try:
            if synthetic_dependencies_used:
                expected_core64 = _tail_mass_module._validate_synthetic_core(
                    core_continuation
                )
                if selected_mode == NEWTON_MODE:
                    raw_mass = _tail_mass_module._evaluate_tail_mass_graph(
                        projected_l2_state=projected_snapshot,
                        join_barriers=mass_join,
                        core_continuation=core_continuation,
                        state=state_snapshot,
                        synthetic_cell_count=cell_count,
                        synthetic_dependencies_used=True,
                    )
                else:
                    raw_mass = (
                        _tail_mass_module._evaluate_tail_mass_residual_graph(
                            projected_l2_state=projected_snapshot,
                            join_barriers=mass_join,
                            core_continuation=core_continuation,
                            state=state_snapshot,
                            synthetic_cell_count=cell_count,
                            synthetic_dependencies_used=True,
                        )
                    )
            else:
                if core_continuation is not None:
                    raise TailOperatorError(
                        "tail_operator_bound_core_adapter_invalid"
                    )
                expected_core64 = _validate_f64(
                    _retained_core64, "retained_core64"
                )
                if selected_mode == NEWTON_MODE:
                    raw_mass = _tail_mass_module._evaluate_bound_tail_mass_graph(
                        projected_l2_state=projected_snapshot,
                        owner_join_module=(
                            _tail_initializer_module._join_extraction
                        ),
                        join_barriers=mass_join,
                        retained_core64=expected_core64,
                        state=state_snapshot,
                    )
                else:
                    raw_mass = (
                        _tail_mass_module._evaluate_bound_tail_mass_residual_graph(
                            projected_l2_state=projected_snapshot,
                            owner_join_module=(
                                _tail_initializer_module._join_extraction
                            ),
                            join_barriers=mass_join,
                            retained_core64=expected_core64,
                            state=state_snapshot,
                        )
                    )
        except _tail_mass_module.TailMassOperatorError as error:
            raise TailOperatorError(
                "tail_operator_mass_evaluation_failed", error.code
            ) from error
        except Exception as error:
            raise TailOperatorError(
                "tail_operator_mass_evaluator_raised", type(error).__name__
            ) from error
        if selected_mode == NEWTON_MODE:
            mass_residual, mass_jacobian = _validate_mass_result(
                raw_mass,
                mode=selected_mode,
                cell_count=cell_count,
                state_snapshot=state_snapshot,
                projected_snapshot=projected_snapshot,
                mass_join=mass_join,
                expected_core64=expected_core64,
                synthetic_dependencies_used=synthetic_dependencies_used,
            )
        else:
            mass_residual = _validate_mass_residual_result(
                raw_mass,
                cell_count=cell_count,
                state_snapshot=state_snapshot,
                projected_snapshot=projected_snapshot,
                mass_join=mass_join,
                expected_core64=expected_core64,
                synthetic_dependencies_used=synthetic_dependencies_used,
            )
            mass_jacobian = None
        trace.record("mass.evaluate.complete")
        residual.append(mass_residual)
        trace.record("residual[64].stored")
        if selected_mode == NEWTON_MODE:
            if mass_jacobian is None or jacobian is None:
                raise TailOperatorError("tail_operator_internal_mode_invariant")
            jacobian.append(mass_jacobian)
            for column in range(UNKNOWN_COUNT):
                trace.record(f"jacobian[64,{column}].stored")
        trace.record("row[64].complete")
        trace.record("combined.complete")

        frozen_residual = tuple(residual)
        frozen_jacobian = None if jacobian is None else tuple(jacobian)
        if (
            len(frozen_residual) != RESIDUAL_ROW_COUNT
            or (
                selected_mode == NEWTON_MODE
                and (
                    frozen_jacobian is None
                    or len(frozen_jacobian) != RESIDUAL_ROW_COUNT
                    or any(len(row) != UNKNOWN_COUNT for row in frozen_jacobian)
                )
            )
            or (
                selected_mode == FINAL_RESIDUAL_GATE_MODE
                and frozen_jacobian is not None
            )
        ):
            raise TailOperatorError("tail_operator_result_shape_invariant")

        state_bits = tuple(_f64_hex(value) for value in state_snapshot)
        state_hash = _f64_tuple_sha256(STATE_HASH_DOMAIN, state_snapshot)
        projected_hash = _f64_tuple_sha256(
            PROJECTED_STATE_HASH_DOMAIN, projected_snapshot
        )
        event_count = trace.count
        chronology_sha256 = trace.hexdigest()

    newton_mode = selected_mode == NEWTON_MODE
    full_mass = cell_count == FULL_TAIL_CELL_COUNT
    return FrozenTailOperatorEvaluation(
        mode=selected_mode,
        residual_row_count=RESIDUAL_ROW_COUNT,
        unknown_count=UNKNOWN_COUNT,
        residual=frozen_residual,
        jacobian=frozen_jacobian,
        row_labels=tuple(
            (*(
                f"{kind}[{index}]"
                for kind in ("S", "P")
                for index in range(32)
            ), "mass")
        ),
        row_order=ROW_ORDER,
        unknown_order=UNKNOWN_ORDER,
        state_snapshot_bits=state_bits,
        state_f64le_sha256=state_hash,
        projected_state_f64le_sha256=projected_hash,
        state_snapshot_count=1,
        state_component_read_count=UNKNOWN_COUNT,
        state_bitwise_unchanged=True,
        pde_rows_completed=PDE_ROW_COUNT,
        mass_rows_completed=1,
        residual_store_count=RESIDUAL_ROW_COUNT,
        jacobian_target_touched=newton_mode,
        jacobian_row_store_count=RESIDUAL_ROW_COUNT if newton_mode else 0,
        jacobian_component_store_count=(
            RESIDUAL_ROW_COUNT * UNKNOWN_COUNT if newton_mode else 0
        ),
        pde_jacobian_field_accessed=newton_mode,
        mass_jacobian_field_accessed=newton_mode,
        chronology_event_count=event_count,
        chronology_sha256=chronology_sha256,
        synthetic_mass_cell_count=cell_count,
        full_tail_cell_count=FULL_TAIL_CELL_COUNT,
        mass_row_is_partial=not full_mass,
        full_tail_mass_execution_observed=full_mass,
        full_tail_mass_golden_verified=False,
        tail_pde_operator_source_sha256=TAIL_PDE_OPERATOR_SOURCE_SHA256,
        tail_pde_operator_source_size_bytes=TAIL_PDE_OPERATOR_SOURCE_SIZE_BYTES,
        tail_mass_operator_source_sha256=TAIL_MASS_OPERATOR_SOURCE_SHA256,
        tail_mass_operator_source_size_bytes=TAIL_MASS_OPERATOR_SOURCE_SIZE_BYTES,
        binary64_environment_source_sha256=(
            BINARY64_ENVIRONMENT_SOURCE_SHA256
        ),
        binary64_environment_source_size_bytes=(
            BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        ),
        tail_initializer_source_sha256=TAIL_INITIALIZER_SOURCE_SHA256,
        tail_initializer_source_size_bytes=TAIL_INITIALIZER_SOURCE_SIZE_BYTES,
        tail_initializer_source_status=TAIL_INITIALIZER_SOURCE_STATUS,
        production_dependencies_sealed=PRODUCTION_DEPENDENCIES_SEALED,
        binary64_runtime_family=_binary64_environment.BINARY64_RUNTIME_FAMILY,
        session_id_sha256=None,
        session_evaluation_ordinal=None,
        retained_core_get_d_count=0,
        synthetic_dependencies_used=synthetic_dependencies_used,
    )


def open_primary_tail_operator_session(
    *,
    initializer_result: object,
    collocation: object,
    join_barriers: object,
    projected_l2_state: object,
 ) -> FrozenTailOperatorSession:
    """Fail closed until upstream producers share this private module instance."""

    del initializer_result, collocation, join_barriers, projected_l2_state
    with _binary64_environment.nearest_binary64_environment():
        _verify_dependency_bindings()
        raise TailOperatorError(
            "tail_operator_shared_initializer_instance_composition_blocked",
            PRODUCTION_SESSION_COMPOSITION_STATUS,
        )


def evaluate_primary_tail_operator(
    *,
    session: object,
    state: object,
    mode: object,
) -> FrozenTailOperatorEvaluation:
    """Evaluate one mode against the identity-gated persistent session."""

    with _binary64_environment.nearest_binary64_environment():
        _verify_dependency_bindings()
        active = _require_active_session(session)
        selected_mode = _validate_mode(mode)
        if active.terminal:
            raise TailOperatorError("tail_operator_session_terminal")
        if selected_mode == NEWTON_MODE:
            if active.final_residual_gate_started:
                raise TailOperatorError("tail_operator_newton_after_final_gate")
        else:
            if active.final_residual_gate_started:
                raise TailOperatorError("tail_operator_final_gate_already_started")
            active.final_residual_gate_started = True
        try:
            result = _evaluate_synthetic_tail_operator(
                collocation=active.collocation,
                join_barriers=active.join_barriers,
                projected_l2_state=active.projected_l2_state,
                core_continuation=active.core_continuation,
                state=state,
                mode=selected_mode,
                synthetic_mass_cell_count=active.synthetic_mass_cell_count,
                synthetic_dependencies_used=(
                    active.handle.synthetic_dependencies_used
                ),
                _retained_core64=(
                    None
                    if active.handle.synthetic_dependencies_used
                    else active.core64
                ),
                _shared_instance_authority=(
                    None
                    if active.handle.synthetic_dependencies_used
                    else _SHARED_SESSION_AUTHORITY
                ),
            )
        except Exception:
            if selected_mode == FINAL_RESIDUAL_GATE_MODE:
                active.terminal = True
            raise
        ordinal = active.evaluation_count + 1
        active.evaluation_count = ordinal
        if result.mode == NEWTON_MODE:
            active.newton_evaluation_count += 1
        else:
            active.final_residual_gate_evaluation_count += 1
            active.terminal = True
        return replace(
            result,
            session_id_sha256=active.handle.session_id_sha256,
            session_evaluation_ordinal=ordinal,
            retained_core_get_d_count=(
                active.handle.retained_core_get_d_count
            ),
            initializer_continuation_consumed=True,
            production_adapter_available=(
                active.handle.production_adapter_available
            ),
            synthetic_dependencies_used=(
                active.handle.synthetic_dependencies_used
            ),
        )


if (
    (UNKNOWN_COUNT, PDE_ROW_COUNT, RESIDUAL_ROW_COUNT) != (65, 64, 65)
    or PROJECTED_L2_UNKNOWN_COUNT != 257
    or FULL_TAIL_CELL_COUNT != 4096
    or EVALUATION_MODES != ("Newton", "finalResidualGate")
    or len(TAIL_PDE_OPERATOR_SOURCE_SHA256) != 64
    or TAIL_PDE_OPERATOR_SOURCE_SIZE_BYTES != 78_567
    or len(TAIL_MASS_OPERATOR_SOURCE_SHA256) != 64
    or TAIL_MASS_OPERATOR_SOURCE_SIZE_BYTES != 102_513
    or len(BINARY64_ENVIRONMENT_SOURCE_SHA256) != 64
    or BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES != 14_980
    or len(TAIL_INITIALIZER_SOURCE_SHA256) != 64
    or TAIL_INITIALIZER_SOURCE_SIZE_BYTES != 56_936
    or PRODUCTION_DEPENDENCIES_SEALED is not True
    or PRODUCTION_SESSION_COMPOSITION_STATUS
    != "blocked_shared_private_initializer_instance_not_composed"
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("spherical_seed_primary_tail_operator_invariant")


__all__ = [
    "AUTHORITY_LOCKS",
    "BINARY64_ENVIRONMENT_SOURCE_SHA256",
    "BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES",
    "COMBINED_ROW_GRAPH",
    "EVALUATION_MODES",
    "FINAL_RESIDUAL_GATE_MODE",
    "FIRST_FAILURE_GRAPH",
    "FrozenTailOperatorEvaluation",
    "FrozenTailOperatorSession",
    "FULL_TAIL_CELL_COUNT",
    "NEWTON_MODE",
    "PDE_ROW_COUNT",
    "PRODUCTION_DEPENDENCIES_SEALED",
    "PRODUCTION_SESSION_COMPOSITION_STATUS",
    "PROJECTED_L2_UNKNOWN_COUNT",
    "RESIDUAL_ROW_COUNT",
    "ROW_ORDER",
    "STATE_SNAPSHOT_GRAPH",
    "TAIL_INITIALIZER_SOURCE_SHA256",
    "TAIL_INITIALIZER_SOURCE_SIZE_BYTES",
    "TAIL_INITIALIZER_SOURCE_STATUS",
    "TAIL_MASS_OPERATOR_SOURCE_SHA256",
    "TAIL_MASS_OPERATOR_SOURCE_SIZE_BYTES",
    "TAIL_OPERATOR_VERSION",
    "TAIL_PDE_OPERATOR_SOURCE_SHA256",
    "TAIL_PDE_OPERATOR_SOURCE_SIZE_BYTES",
    "TailOperatorError",
    "UNKNOWN_COUNT",
    "UNKNOWN_ORDER",
    "evaluate_primary_tail_operator",
    "open_primary_tail_operator_session",
]
