"""Fail-closed Stage-2 core-level archive and continuation boundary.

This module authenticates every currently sealed core producer from its exact
source bytes and executes those bytes only in private module namespaces.  It
also implements the lifecycle that can be proved without running a candidate:
three projected-state archive receipts, the two source-rho scratch lifetimes,
the immutable L2 rho support, join/core-integral receipts, and local retention
of the once-only core-integral continuation.

The repaired ``level_transfer`` ABI accepts only immutable archived source-rho
bits, the immutable projected source archive, and the one live target spectral
primitive.  The synthetic lifecycle therefore proves the required source
release-before-target chronology without retaining a source operator.  The
public production adapter remains blocked before a candidate numeric read
because the Python producer ABIs do not expose the single fixed native
MPFR/binary64/permutation arenas required by the resource preflight.  Inventing
an arena adapter would not be the frozen graph.

There is a second, independent production-composition blocker.  A continuation
belongs to the exact private ``core_quadrature`` module instance that created
it.  A tail initializer that separately private-loads identical source bytes
has a distinct pending slot and class identity, so it cannot consume this
continuation.  The token remains owned here until a future top-level loader
injects the same authenticated module instance into both stages.  Rebinding or
recomputing the core integral is forbidden.

Only the underscored synthetic engine is executable.  It accepts scripted
diagnostic results, performs no physics calculation, and confers no execution,
candidate, proof, replay, lamp, scientific, physical, propulsion, or transport
authority.
"""

from __future__ import annotations

from dataclasses import dataclass, fields
import hashlib
import inspect
import math
from pathlib import Path
import struct
import sys
from types import MappingProxyType, ModuleType
from typing import Final

import gmpy2


CORE_LEVEL_ORCHESTRATOR_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_seed_primary_core_level_orchestrator/v1"
)
PRIMARY_NUMERICS_POLICY_SHA256: Final[str] = (
    "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4"
)
PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES: Final[int] = 80_055

LEVEL_ORDER: Final[tuple[str, ...]] = ("L0", "L1", "L2")
LEVEL_NODE_COUNTS: Final[tuple[tuple[str, int], ...]] = (
    ("L0", 64),
    ("L1", 96),
    ("L2", 128),
)
LEVEL_UNKNOWN_COUNTS: Final[tuple[tuple[str, int], ...]] = (
    ("L0", 129),
    ("L1", 193),
    ("L2", 257),
)
PROJECTION_RESIDUAL_LIMIT: Final[float] = 2.0**-40
L2_NODE_COUNT: Final[int] = 128
L2_UNKNOWN_COUNT: Final[int] = 257

STAGE_ORDER: Final[tuple[str, ...]] = (
    "dependency_and_fixture_bindings_verified",
    "L0_operator_generated",
    "L0_initializer_materialized",
    "L0_solved_once",
    "L0_projected_gate_passed",
    "L0_projected_archive_copied",
    "L0_source_rho_scratch_copied",
    "L0_operator_released",
    "L1_operator_generated",
    "L0_to_L1_transferred_once",
    "L0_source_rho_scratch_cleared",
    "L1_solved_once",
    "L1_projected_gate_passed",
    "L1_projected_archive_copied",
    "L1_source_rho_scratch_copied",
    "L1_operator_released",
    "L2_operator_generated",
    "L1_to_L2_transferred_once",
    "L1_source_rho_scratch_cleared",
    "L2_solved_once",
    "L2_projected_gate_passed",
    "L2_projected_archive_copied",
    "L2_rho_source_support_copied",
    "L2_rho_source_support_bit_gate_passed",
    "L2_join_extracted_once",
    "L2_core_quadrature_completed_once",
    "L2_core_quadrature_continuation_consumed_once",
    "L2_operator_released",
)

BACKEND_CALL_ORDER: Final[tuple[str, ...]] = (
    "generate_spectral:L0",
    "initialize_l0",
    "solve_core:L0",
    "release_operator:L0",
    "generate_spectral:L1",
    "transfer_level:L0->L1",
    "solve_core:L1",
    "release_operator:L1",
    "generate_spectral:L2",
    "transfer_level:L1->L2",
    "solve_core:L2",
    "extract_join:L2",
    "integrate_core:L2",
    "consume_core_continuation:L2",
    "release_operator:L2",
)

RAW_STATE_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/core-level/raw-state-f64le/v1\n"
)
PROJECTED_STATE_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/core-level/projected-state-f64le/v1\n"
)
ARCHIVE_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/core-level/archive-f64le/v1\n"
)
TRANSFER_STATE_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/core-level/transfer-state-f64le/v1\n"
)
TRANSFER_RHO_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/core-level/transfer-rho-f64le/v1\n"
)
L2_RHO_SUPPORT_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/core-level/l2-rho-support-f64le/v1\n"
)
JOIN_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/core-level/join-f64le/v1\n"
)


class CoreLevelOrchestratorError(RuntimeError):
    """Deterministic fail-closed error for this boundary."""

    def __init__(self, code: str, detail: str = "root") -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


@dataclass(frozen=True, slots=True)
class FrozenCoreLevelRuntimeBlocker:
    code: str
    stage: str
    reasons: tuple[str, ...]
    required_native_mpfr_element_count: int
    required_binary64_element_count: int
    required_permutation_element_count: int
    before_candidate_numeric_read: bool = True
    current_producer_abi_exposes_fixed_native_arenas: bool = False
    retry_allowed: bool = False
    retune_allowed: bool = False
    alternate_runtime_allowed: bool = False
    candidate_execution_authorized: bool = False
    physical_authority: bool = False


@dataclass(frozen=True, slots=True)
class FrozenCoreContinuationCompositionBlocker:
    code: str
    stage: str
    current_owner: str
    incompatible_downstream_owner: str
    required_resolution: str
    same_authenticated_module_instance_required: bool = True
    production_composition_available: bool = False
    token_rebinding_allowed: bool = False
    core_integral_recomputation_allowed: bool = False
    candidate_execution_authorized: bool = False
    physical_authority: bool = False


PRODUCTION_RUNTIME_BLOCKER: Final[FrozenCoreLevelRuntimeBlocker] = (
    FrozenCoreLevelRuntimeBlocker(
        code="core_level_fixed_native_arena_abi_unavailable",
        stage="resource_preflight_before_candidate_numeric_read",
        reasons=(
            "fixed_native_mpfr_binary64_and_permutation_arenas_not_exposed",
            "producer_calls_do_not_share_policy_native_arenas_or_fixed_indices",
            "same_core_quadrature_module_instance_not_shared_with_tail_initializer",
        ),
        required_native_mpfr_element_count=65_536,
        required_binary64_element_count=262_144,
        required_permutation_element_count=257,
    )
)
PRODUCTION_RUNTIME_AVAILABLE: Final[bool] = False
CONTINUATION_COMPOSITION_BLOCKER: Final[
    FrozenCoreContinuationCompositionBlocker
] = FrozenCoreContinuationCompositionBlocker(
    code="core_level_continuation_shared_instance_injection_unavailable",
    stage="core_quadrature_to_tail_initializer_composition",
    current_owner=(
        "core_level_orchestrator_authenticated_private_core_quadrature_instance"
    ),
    incompatible_downstream_owner=(
        "tail_initializer_separately_private_loaded_core_quadrature_instance"
    ),
    required_resolution=(
        "future_top_level_shared_loader_must_inject_the_same_authenticated_"
        "core_quadrature_module_instance_without_rebinding_or_recomputation"
    ),
)
PRODUCTION_CONTINUATION_COMPOSITION_AVAILABLE: Final[bool] = False


@dataclass(frozen=True, slots=True)
class FrozenCoreLevelArchiveReceipt:
    level_id: str
    node_count: int
    unknown_count: int
    spectral_payload_sha256: str
    raw_accepted_state_f64le_sha256: str
    projected_state_f64le_sha256: str
    immutable_archive_f64le_sha256: str
    raw_u_infinity_bits: str
    raw_V_infinity_bits: str
    projected_residual_max: float
    projected_residual_max_bits: str
    projected_state: tuple[float, ...]
    projection_gate_passed: bool
    archive_copy_distinct: bool
    synthetic_receipt: bool = True
    candidate_execution_authorized: bool = False
    candidate_executed: bool = False
    output_accepted: bool = False
    replay_authority: bool = False
    diagnostic_pass_authority: bool = False
    physical_authority: bool = False


@dataclass(frozen=True, slots=True)
class FrozenLevelTransferReceipt:
    source_level: str
    target_level: str
    source_node_count: int
    target_node_count: int
    archived_source_rho_f64le_sha256: str
    source_archive_f64le_sha256: str
    transferred_state_f64le_sha256: str
    source_archive_spectral_payload_sha256: str
    target_spectral_payload_sha256: str
    archived_source_rho_cleared_before_solve: bool
    target_only_operator_abi_observed: bool
    one_transfer_only: bool = True
    retry_allowed: bool = False
    alternate_interpolation_used: bool = False
    filtering_used: bool = False
    candidate_execution_authorized: bool = False
    physical_authority: bool = False


@dataclass(frozen=True, slots=True)
class FrozenL2JoinReceipt:
    barrier_order: tuple[str, ...]
    barrier_values: tuple[float, ...]
    barrier_bits: tuple[str, ...]
    barrier_f64le_sha256: str
    join_x: int
    join_rho_exact: str
    spectral_payload_sha256: str
    calculation_observed_from_synthetic_backend: bool = True
    projected_source_acceptance_authority: bool = False
    candidate_execution_authorized: bool = False
    physical_authority: bool = False


@dataclass(frozen=True, slots=True)
class FrozenL2CoreIntegralReceipt:
    core64: float
    core64_bits: str
    core_cell_count: int
    fixture_point_count: int
    cells_completed: int
    mapped_points_completed: int
    node_integrands_completed: int
    exact_node_shortcuts: int
    projected_rho_f64le_sha256: str
    projected_u_f64le_sha256: str
    spectral_payload_sha256: str
    fixture_manifest_sha256: str
    fixture_records_sha256: str
    fixture_generator_sha256: str
    fixture_independent_test_sha256: str
    complete_core_graph_reported_by_synthetic_backend: bool
    one_final_get_d_reported_by_synthetic_backend: bool
    continuation_transferred_once: bool
    projected_source_acceptance_authority: bool = False
    candidate_execution_authorized: bool = False
    physical_authority: bool = False


@dataclass(frozen=True, slots=True)
class FrozenCoreLevelOrchestrationDiagnostic:
    level_order: tuple[str, ...]
    stage_order: tuple[str, ...]
    level_archives: tuple[FrozenCoreLevelArchiveReceipt, ...]
    level_transfers: tuple[FrozenLevelTransferReceipt, ...]
    l2_rho_source_support: tuple[float, ...]
    l2_rho_source_support_bits: tuple[str, ...]
    l2_rho_source_support_f64le_sha256: str
    join_receipt: FrozenL2JoinReceipt
    core_integral_receipt: FrozenL2CoreIntegralReceipt
    dependency_source_bindings: tuple[tuple[str, str, int], ...]
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    production_runtime_blocker: FrozenCoreLevelRuntimeBlocker
    continuation_composition_blocker: FrozenCoreContinuationCompositionBlocker
    synthetic_backend_used: bool = True
    archive_receipt_lifecycle_implemented: bool = True
    source_rho_lifetime_implemented: bool = True
    one_live_operator_chronology_implemented: bool = True
    l2_rho_support_lifetime_implemented: bool = True
    local_continuation_lifetime_implemented: bool = True
    same_authenticated_core_quadrature_instance_required: bool = True
    production_continuation_composition_available: bool = False
    producer_math_executed_by_orchestrator: bool = False
    production_runtime_available: bool = False
    primary_numerics_semantic_authority: bool = False
    implementation_closure_complete: bool = False
    runtime_closure_complete: bool = False
    source_manifest_bound: bool = False
    toolchain_manifest_bound: bool = False
    executable_bound: bool = False
    runtime_manifest_bound: bool = False
    scientific_preseal_present: bool = False
    retry_allowed: bool = False
    retune_allowed: bool = False
    alternate_solver_allowed: bool = False
    solve_performed: bool = False
    execution_authorized: bool = False
    execution_observed: bool = False
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
    directed_proof_authority: bool = False
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
        "implementationClosureComplete": False,
        "runtimeClosureComplete": False,
        "sourceManifestAuthority": False,
        "toolchainAuthority": False,
        "executableAuthority": False,
        "runtimeAuthority": False,
        "productionContinuationCompositionAvailable": False,
        "continuationTokenRebindingAllowed": False,
        "coreIntegralRecomputationAllowed": False,
        "preexecutionPresealPresent": False,
        "executionAuthorized": False,
        "executionObserved": False,
        "candidateExecuted": False,
        "outputPresent": False,
        "outputAccepted": False,
        "seedAccepted": False,
        "branchAccepted": False,
        "nondegeneracyAccepted": False,
        "runReplayAccepted": False,
        "independentAgreementAccepted": False,
        "directedProofAccepted": False,
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


_DEPENDENCY_SPECS: Final[tuple[tuple[str, str, str, int], ...]] = (
    (
        "spectral",
        "spectral.py",
        "e9b2509b0c4a5d417250b3d145a648404cde440f12961d2faec1bc14758b78f7",
        19_045,
    ),
    (
        "core_initializer",
        "core_initializer.py",
        "1edb2e612603cec67118390d11f875a07e3fb1640f63d319b23bf725b016f235",
        36_770,
    ),
    (
        "core_operator",
        "core_operator.py",
        "b5333cb145ed42e443ac6e122ae77cd4ae4c05e8053cf305c91fdc3572dd6189",
        32_114,
    ),
    (
        "dense_lu",
        "dense_lu.py",
        "44d38215a8ebe64a03b12b314211ccbe35001e3f963a6f6974631f9c1f07df0e",
        25_345,
    ),
    (
        "core_newton",
        "core_newton.py",
        "723100d07abdbb1524a2ea8fc1e649b0e5ecd709f69d51ed15b7ddcdc4096e55",
        57_195,
    ),
    (
        "level_transfer",
        "level_transfer.py",
        "2901f959a9aa5c80cb1ccac59de7b1ac32765fdd4ff0b7b5ed38029488aa60f9",
        36_239,
    ),
    (
        "join_extraction",
        "join_extraction.py",
        "d2b86dffeaa9e56aabed044f688d89c6b282600b435aa8b3491ce51ca07d7d6b",
        26_780,
    ),
    (
        "core_quadrature",
        "core_quadrature.py",
        "78d56665839c0c50c7ee3a013595ac5b30baf67ea9194e062a930554eeb302e1",
        47_738,
    ),
    (
        "binary64_environment",
        "binary64_environment.py",
        "8d452abdfa6d9b3e0cf92aa7d8682202b588f1fe8b0fe0772c6d003d2d12f1a4",
        14_980,
    ),
)
DEPENDENCY_SOURCE_BINDINGS: Final = MappingProxyType(
    {role: (sha256, size) for role, _filename, sha256, size in _DEPENDENCY_SPECS}
)

_HERE: Final[Path] = Path(__file__).resolve().parent
_MISSING_MODULE: Final[object] = object()


def _read_bound_source(
    role: str,
    filename: str,
    expected_sha256: str,
    expected_size: int,
) -> bytes:
    path = _HERE / filename
    try:
        source = path.read_bytes()
    except OSError as error:
        raise CoreLevelOrchestratorError(
            "core_level_dependency_source_unavailable",
            f"{role}:{type(error).__name__}",
        ) from error
    if len(source) != expected_size:
        raise CoreLevelOrchestratorError(
            "core_level_dependency_source_mismatch", f"{role}:size"
        )
    if hashlib.sha256(source).hexdigest() != expected_sha256:
        raise CoreLevelOrchestratorError(
            "core_level_dependency_source_mismatch", f"{role}:sha256"
        )
    return source


def _execute_private_module(
    *, role: str, filename: str, sha256: str, size: int
) -> ModuleType:
    source = _read_bound_source(role, filename, sha256, size)
    private_name = f"_nhm2_seed_core_levels_{role}_{sha256[:16]}"
    path = (_HERE / filename).resolve()
    module = ModuleType(private_name)
    module.__file__ = str(path)
    module.__package__ = ""
    previous = sys.modules.get(private_name, _MISSING_MODULE)
    sys.modules[private_name] = module
    try:
        code = compile(source, str(path), "exec", dont_inherit=True, optimize=0)
        exec(code, module.__dict__)
    except Exception as error:
        raise CoreLevelOrchestratorError(
            "core_level_dependency_private_load_failed",
            f"{role}:{type(error).__name__}",
        ) from error
    finally:
        if previous is _MISSING_MODULE:
            del sys.modules[private_name]
        else:
            sys.modules[private_name] = previous
    if (
        type(getattr(module, "__file__", None)) is not str
        or Path(module.__file__).resolve() != path
    ):
        raise CoreLevelOrchestratorError(
            "core_level_dependency_private_origin_mismatch", role
        )
    return module


_BOUND_MODULES: Final[dict[str, ModuleType]] = {
    role: _execute_private_module(
        role=role, filename=filename, sha256=sha256, size=size
    )
    for role, filename, sha256, size in _DEPENDENCY_SPECS
}
_spectral: Final[ModuleType] = _BOUND_MODULES["spectral"]
_core_initializer: Final[ModuleType] = _BOUND_MODULES["core_initializer"]
_core_operator: Final[ModuleType] = _BOUND_MODULES["core_operator"]
_dense_lu: Final[ModuleType] = _BOUND_MODULES["dense_lu"]
_core_newton: Final[ModuleType] = _BOUND_MODULES["core_newton"]
_level_transfer: Final[ModuleType] = _BOUND_MODULES["level_transfer"]
_join_extraction: Final[ModuleType] = _BOUND_MODULES["join_extraction"]
_core_quadrature: Final[ModuleType] = _BOUND_MODULES["core_quadrature"]
_binary64_environment: Final[ModuleType] = _BOUND_MODULES[
    "binary64_environment"
]


def _verify_dependency_bindings() -> None:
    """Re-authenticate bytes and all literal/cross-module bindings."""

    for role, filename, sha256, size in _DEPENDENCY_SPECS:
        _read_bound_source(role, filename, sha256, size)

    expected_versions = (
        (
            _spectral,
            "SPECTRAL_PRIMITIVE_VERSION",
            "nhm2_spherical_boson_star_seed_primary_spectral/v1",
        ),
        (
            _core_initializer,
            "CORE_INITIALIZER_VERSION",
            "nhm2_spherical_boson_star_seed_primary_fixed_l0_initializer/v1",
        ),
        (
            _core_operator,
            "CORE_OPERATOR_VERSION",
            "nhm2_spherical_boson_star_seed_primary_core_operator/v1",
        ),
        (
            _dense_lu,
            "DENSE_LU_VERSION",
            "nhm2_spherical_boson_star_seed_primary_dense_lu/v1",
        ),
        (
            _core_newton,
            "CORE_NEWTON_VERSION",
            "nhm2_spherical_boson_star_seed_primary_core_newton/v1",
        ),
        (
            _level_transfer,
            "LEVEL_TRANSFER_VERSION",
            "nhm2_spherical_boson_star_seed_accepted_level_transfer/v1",
        ),
        (
            _join_extraction,
            "JOIN_EXTRACTION_VERSION",
            "nhm2_spherical_boson_star_seed_primary_l2_join_extraction/v1",
        ),
        (
            _core_quadrature,
            "CORE_QUADRATURE_VERSION",
            "nhm2_spherical_boson_star_seed_primary_l2_core_gl256_quadrature/v1",
        ),
        (
            _binary64_environment,
            "BINARY64_ENVIRONMENT_VERSION",
            "nhm2_spherical_boson_star_seed_producer_binary64_environment/v1",
        ),
    )
    for module, field_name, expected in expected_versions:
        if getattr(module, field_name, None) != expected:
            raise CoreLevelOrchestratorError(
                "core_level_dependency_literal_binding_invalid", field_name
            )
        if any(value is not False for value in module.AUTHORITY_LOCKS.values()):
            raise CoreLevelOrchestratorError(
                "core_level_dependency_authority_lock_invalid", field_name
            )
        if module is not _binary64_environment and (
            module.PRIMARY_NUMERICS_POLICY_SHA256
            != PRIMARY_NUMERICS_POLICY_SHA256
            or module.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
            != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        ):
            raise CoreLevelOrchestratorError(
                "core_level_dependency_policy_binding_invalid", field_name
            )

    spectral_sha, spectral_size = DEPENDENCY_SOURCE_BINDINGS["spectral"]
    fenv_sha, fenv_size = DEPENDENCY_SOURCE_BINDINGS["binary64_environment"]
    dense_sha, dense_size = DEPENDENCY_SOURCE_BINDINGS["dense_lu"]
    operator_sha, operator_size = DEPENDENCY_SOURCE_BINDINGS["core_operator"]
    transfer_signature = inspect.signature(
        _level_transfer.transfer_accepted_level_state
    )
    transfer_parameters = tuple(transfer_signature.parameters.values())
    transfer_result_fields = tuple(
        field.name for field in fields(_level_transfer.FrozenAcceptedLevelTransfer)
    )
    for module in (
        _core_initializer,
        _core_operator,
        _core_newton,
        _level_transfer,
        _join_extraction,
        _core_quadrature,
    ):
        if (
            module.SPECTRAL_SOURCE_SHA256 != spectral_sha
            or module.SPECTRAL_SOURCE_SIZE_BYTES != spectral_size
        ):
            raise CoreLevelOrchestratorError(
                "core_level_dependency_cross_pin_invalid", "spectral"
            )
    for module in (_core_operator, _dense_lu, _core_newton):
        if (
            module.BINARY64_ENVIRONMENT_SOURCE_SHA256 != fenv_sha
            or module.BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES != fenv_size
        ):
            raise CoreLevelOrchestratorError(
                "core_level_dependency_cross_pin_invalid", "binary64_environment"
            )
    if (
        _core_newton.DENSE_LU_SOURCE_SHA256 != dense_sha
        or _core_newton.DENSE_LU_SOURCE_SIZE_BYTES != dense_size
        or _core_newton.CORE_OPERATOR_SOURCE_SHA256 != operator_sha
        or _core_newton.CORE_OPERATOR_SOURCE_SIZE_BYTES != operator_size
        or _core_newton.CORE_OPERATOR_DEPENDENCY_SEALED is not True
        or tuple(_spectral.ADMITTED_NODE_COUNTS) != (64, 96, 128, 256)
        or tuple(_core_operator.CORE_NODE_COUNTS) != (64, 96, 128)
        or tuple(_core_newton.CORE_NODE_COUNTS) != (64, 96, 128)
        or tuple(_level_transfer.LEVEL_NODE_COUNTS.items())
        != LEVEL_NODE_COUNTS
        or tuple(_level_transfer.ACCEPTED_TRANSFER_PAIRS)
        != ((64, 96), (96, 128))
        or tuple(parameter.name for parameter in transfer_parameters)
        != (
            "source_level",
            "archived_source_rho",
            "projected_source_state",
            "target_spectral",
        )
        or any(
            parameter.kind is not inspect.Parameter.KEYWORD_ONLY
            for parameter in transfer_parameters
        )
        or "source_rho_payload_sha256" not in transfer_result_fields
        or "source_spectral_payload_sha256" in transfer_result_fields
        or _level_transfer.SOURCE_RHO_HASH_DOMAIN != TRANSFER_RHO_HASH_DOMAIN
        or dict(_level_transfer.SOURCE_RHO_PAYLOAD_GOLDEN_HASHES)
        != {
            64: "ba32f26043e32131bd12a672de28d1cb6eadf0d5d12f9ffd690ed5558f24d362",
            96: "8766de10d18a94211c450c51d7f701d0a9ed3e54e88173e22898a68168c00bdd",
        }
        or "only_live_target_operator"
        not in _level_transfer.BARYCENTRIC_OPERATION_GRAPH
    ):
        raise CoreLevelOrchestratorError(
            "core_level_dependency_cross_pin_invalid", "core_graph"
        )

    spectral_consumers = (
        _core_initializer,
        _core_operator,
        _level_transfer,
        _join_extraction,
        _core_quadrature,
    )
    nested_spectral_modules: list[ModuleType] = []
    for consumer in spectral_consumers:
        nested = getattr(consumer, "_spectral_module", None)
        if (
            type(nested) is not ModuleType
            or consumer.FrozenLobattoSpectralPrimitive
            is not nested.FrozenLobattoSpectralPrimitive
            or nested is _spectral
            or nested.SPECTRAL_PRIMITIVE_VERSION
            != "nhm2_spherical_boson_star_seed_primary_spectral/v1"
            or nested.PRIMARY_NUMERICS_POLICY_SHA256
            != PRIMARY_NUMERICS_POLICY_SHA256
            or nested.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
            != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
            or any(value is not False for value in nested.AUTHORITY_LOCKS.values())
        ):
            raise CoreLevelOrchestratorError(
                "core_level_nested_spectral_binding_invalid",
                consumer.__name__,
            )
        nested_spectral_modules.append(nested)
    if len({id(module) for module in nested_spectral_modules}) != len(
        nested_spectral_modules
    ):
        raise CoreLevelOrchestratorError(
            "core_level_nested_spectral_identity_alias_invalid"
        )

    nested_fenv_modules = (
        _core_operator._binary64_environment_module,
        _dense_lu._binary64_environment,
        _core_newton._binary64_environment,
    )
    for nested in nested_fenv_modules:
        if (
            type(nested) is not ModuleType
            or nested is _binary64_environment
            or nested.BINARY64_ENVIRONMENT_VERSION
            != "nhm2_spherical_boson_star_seed_producer_binary64_environment/v1"
            or any(value is not False for value in nested.AUTHORITY_LOCKS.values())
        ):
            raise CoreLevelOrchestratorError(
                "core_level_nested_binary64_environment_binding_invalid"
            )
    try:
        _core_newton._verify_dependency_bindings(require_core_operator=True)
    except Exception as error:
        raise CoreLevelOrchestratorError(
            "core_level_nested_newton_binding_invalid",
            getattr(error, "code", type(error).__name__),
        ) from error

    # Exact fixture-byte checks precede the resource/ABI blocker, matching the
    # frozen first-failure precedence.  Parsing records does not read a
    # candidate or execute the quadrature.
    try:
        records = _core_quadrature._load_bound_fixture_records()
    except Exception as error:
        raise CoreLevelOrchestratorError(
            "core_level_quadrature_fixture_binding_invalid",
            getattr(error, "code", type(error).__name__),
        ) from error
    if type(records) is not tuple or len(records) != 256:
        raise CoreLevelOrchestratorError(
            "core_level_quadrature_fixture_binding_invalid", "record_count"
        )


_SPECTRAL_FIELD_NAMES: Final[tuple[str, ...]] = tuple(
    field.name for field in fields(_spectral.FrozenLobattoSpectralPrimitive)
)
_SPECTRAL_FALSE_FIELDS: Final[tuple[str, ...]] = tuple(
    field.name
    for field in fields(_spectral.FrozenLobattoSpectralPrimitive)
    if field.default is False
)


@dataclass(frozen=True, slots=True)
class _FrozenSpectralPayload:
    field_values: tuple[object, ...]
    node_count: int
    rho: tuple[float, ...]
    barycentric_weights: tuple[float, ...]
    first_derivative: tuple[tuple[float, ...], ...]
    second_derivative: tuple[tuple[float, ...], ...]
    payload_sha256: str


def _negative_zero(value: float) -> bool:
    return value == 0.0 and struct.pack("<d", value) == bytes.fromhex(
        "0000000000000080"
    )


def _validate_f64(value: object, role: str) -> float:
    if type(value) is not float:
        raise CoreLevelOrchestratorError(
            "core_level_binary64_type_invalid", role
        )
    if not math.isfinite(value):
        raise CoreLevelOrchestratorError(
            "core_level_binary64_nonfinite", role
        )
    if _negative_zero(value):
        raise CoreLevelOrchestratorError(
            "core_level_binary64_negative_zero", role
        )
    return 0.0 if value == 0.0 else value


def _f64_bits(value: float) -> bytes:
    return struct.pack("<d", value)


def _f64_hex(value: float) -> str:
    return _f64_bits(value).hex()


def _snapshot_f64_tuple(value: object, expected: int, role: str) -> tuple[float, ...]:
    if type(value) is not tuple or len(value) != expected:
        raise CoreLevelOrchestratorError(
            "core_level_tuple_shape_invalid", f"{role}:{expected}"
        )
    return tuple(
        _validate_f64(component, f"{role}[{index}]")
        for index, component in enumerate(value)
    )


def _f64_payload(values: tuple[float, ...]) -> bytes:
    return struct.pack(f"<{len(values)}d", *values)


def _hash_f64(domain: bytes, values: tuple[float, ...]) -> str:
    digest = hashlib.sha256()
    digest.update(domain)
    digest.update(_f64_payload(values))
    return digest.hexdigest()


def _snapshot_fields_once(
    value: object, field_names: tuple[str, ...], role: str
) -> dict[str, object]:
    try:
        supplied = tuple(getattr(value, name) for name in field_names)
    except Exception as error:
        raise CoreLevelOrchestratorError(
            "core_level_result_snapshot_failed",
            f"{role}:{type(error).__name__}",
        ) from error
    return dict(zip(field_names, supplied, strict=True))


def _spectral_payload_sha256(
    node_count: int,
    rho: tuple[float, ...],
    weights: tuple[float, ...],
    first: tuple[tuple[float, ...], ...],
    second: tuple[tuple[float, ...], ...],
) -> str:
    digest = hashlib.sha256()
    digest.update(_level_transfer.SPECTRAL_PAYLOAD_GOLDEN_DOMAIN)
    digest.update(node_count.to_bytes(8, "little", signed=False))
    for label, values in ((b"rho", rho), (b"barycentric_weights", weights)):
        digest.update(len(label).to_bytes(8, "little", signed=False))
        digest.update(label)
        digest.update(len(values).to_bytes(8, "little", signed=False))
        digest.update(_f64_payload(values))
    for label, matrix in (
        (b"first_derivative_row_major", first),
        (b"second_derivative_row_major", second),
    ):
        digest.update(len(label).to_bytes(8, "little", signed=False))
        digest.update(label)
        digest.update((node_count * node_count).to_bytes(8, "little", signed=False))
        for row in matrix:
            digest.update(_f64_payload(row))
    return digest.hexdigest()


def _snapshot_spectral_payload(
    value: object, expected_level: str
) -> _FrozenSpectralPayload:
    if type(value) is not _spectral.FrozenLobattoSpectralPrimitive:
        raise CoreLevelOrchestratorError(
            "core_level_spectral_type_invalid", expected_level
        )
    supplied = _snapshot_fields_once(value, _SPECTRAL_FIELD_NAMES, expected_level)
    expected_count = dict(LEVEL_NODE_COUNTS)[expected_level]
    count = supplied["node_count"]
    if type(count) is not int or count != expected_count:
        raise CoreLevelOrchestratorError(
            "core_level_spectral_node_count_invalid", expected_level
        )
    rho = _snapshot_f64_tuple(supplied["rho"], count, f"{expected_level}.rho")
    weights = _snapshot_f64_tuple(
        supplied["barycentric_weights"], count, f"{expected_level}.weights"
    )

    def matrix_snapshot(raw: object, role: str) -> tuple[tuple[float, ...], ...]:
        if type(raw) is not tuple or len(raw) != count:
            raise CoreLevelOrchestratorError(
                "core_level_spectral_matrix_shape_invalid", role
            )
        return tuple(
            _snapshot_f64_tuple(row, count, f"{role}[{index}]")
            for index, row in enumerate(raw)
        )

    first = matrix_snapshot(supplied["first_derivative"], f"{expected_level}.D")
    second = matrix_snapshot(
        supplied["second_derivative"], f"{expected_level}.D2"
    )
    if (
        supplied["primary_numerics_policy_sha256"]
        != PRIMARY_NUMERICS_POLICY_SHA256
        or supplied["primary_numerics_policy_canonical_size_bytes"]
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or supplied["calculation_implemented"] is not True
        or any(supplied[name] is not False for name in _SPECTRAL_FALSE_FIELDS)
        or _f64_bits(rho[0]) != bytes(8)
        or rho[-1] != 1.0
        or any(rho[index] <= rho[index - 1] for index in range(1, count))
    ):
        raise CoreLevelOrchestratorError(
            "core_level_spectral_binding_invalid", expected_level
        )
    observed = _spectral_payload_sha256(count, rho, weights, first, second)
    expected_hash = _core_operator.SPECTRAL_PAYLOAD_GOLDEN_HASHES[count]
    if observed != expected_hash:
        raise CoreLevelOrchestratorError(
            "core_level_spectral_payload_mismatch", expected_level
        )

    copied_values = dict(supplied)
    copied_values.update(
        rho=rho,
        barycentric_weights=weights,
        first_derivative=first,
        second_derivative=second,
    )
    return _FrozenSpectralPayload(
        field_values=tuple(copied_values[name] for name in _SPECTRAL_FIELD_NAMES),
        node_count=count,
        rho=rho,
        barycentric_weights=weights,
        first_derivative=first,
        second_derivative=second,
        payload_sha256=observed,
    )


def _rebind_spectral_payload(
    module: ModuleType, snapshot: _FrozenSpectralPayload
) -> object:
    """Rebuild one immutable payload in a consumer's private class identity."""

    if type(snapshot) is not _FrozenSpectralPayload:
        raise CoreLevelOrchestratorError(
            "core_level_spectral_snapshot_type_invalid"
        )
    bound_type = getattr(module, "FrozenLobattoSpectralPrimitive", None)
    if bound_type is None:
        bound_type = getattr(
            getattr(module, "_spectral", None),
            "FrozenLobattoSpectralPrimitive",
            None,
        )
    if bound_type is None:
        raise CoreLevelOrchestratorError(
            "core_level_spectral_rebind_target_invalid"
        )
    try:
        rebound = bound_type(
            **dict(zip(_SPECTRAL_FIELD_NAMES, snapshot.field_values, strict=True))
        )
    except Exception as error:
        raise CoreLevelOrchestratorError(
            "core_level_spectral_rebind_failed", type(error).__name__
        ) from error
    if type(rebound) is not bound_type:
        raise CoreLevelOrchestratorError(
            "core_level_spectral_rebind_identity_invalid"
        )
    return rebound


_INITIALIZER_FALSE_FIELDS: Final[tuple[str, ...]] = (
    "alternate_initializer_used",
    "primary_numerics_semantic_authority",
    "initializer_contract_authority",
    "implementation_closure_complete",
    "runtime_closure_complete",
    "source_manifest_bound",
    "toolchain_manifest_bound",
    "executable_bound",
    "runtime_manifest_bound",
    "scientific_preseal_present",
    "newton_implemented",
    "solve_performed",
    "candidate_execution_authorized",
    "candidate_executed",
    "candidate_output_materialized",
    "output_present",
    "output_accepted",
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
_INITIALIZER_FIELDS: Final[tuple[str, ...]] = (
    "node_count",
    "kg",
    "u",
    "V",
    "nu",
    "z",
    "primary_numerics_policy_sha256",
    "primary_numerics_policy_canonical_size_bytes",
    "spectral_source_sha256",
    "spectral_source_size_bytes",
    "spectral_instance_sha256",
    "calculation_implemented",
    "fixed_l0_graph_implemented",
    "initializer_vector_computed",
    *_INITIALIZER_FALSE_FIELDS,
)


def _snapshot_initializer(value: object, grid: _FrozenSpectralPayload) -> tuple[float, ...]:
    supplied = _snapshot_fields_once(value, _INITIALIZER_FIELDS, "L0_initializer")
    u = _snapshot_f64_tuple(supplied["u"], 64, "L0_initializer.u")
    potential = _snapshot_f64_tuple(supplied["V"], 64, "L0_initializer.V")
    nu = _validate_f64(supplied["nu"], "L0_initializer.nu")
    state = _snapshot_f64_tuple(supplied["z"], 129, "L0_initializer.z")
    if (
        supplied["node_count"] != 64
        or _validate_f64(supplied["kg"], "L0_initializer.kg") <= 0.0
        or _f64_payload(state) != _f64_payload((*u, *potential, nu))
        or supplied["primary_numerics_policy_sha256"]
        != PRIMARY_NUMERICS_POLICY_SHA256
        or supplied["primary_numerics_policy_canonical_size_bytes"]
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or supplied["spectral_source_sha256"]
        != DEPENDENCY_SOURCE_BINDINGS["spectral"][0]
        or supplied["spectral_source_size_bytes"]
        != DEPENDENCY_SOURCE_BINDINGS["spectral"][1]
        or supplied["spectral_instance_sha256"] != grid.payload_sha256
        or supplied["calculation_implemented"] is not True
        or supplied["fixed_l0_graph_implemented"] is not True
        or supplied["initializer_vector_computed"] is not True
        or any(supplied[name] is not False for name in _INITIALIZER_FALSE_FIELDS)
    ):
        raise CoreLevelOrchestratorError(
            "core_level_L0_initializer_result_invalid"
        )
    return state


_NEWTON_FALSE_FIELDS: Final[tuple[str, ...]] = (
    "retry_allowed",
    "retune_allowed",
    "alternate_solver_allowed",
    "newton_restart_allowed",
    "candidate_execution_authorized",
    "candidate_executed",
    "candidate_output_materialized",
    "output_present",
    "output_accepted",
    "seed_accepted",
    "branch_accepted",
    "nondegeneracy_accepted",
    "replay_authority",
    "independent_agreement",
    "semiclassical_stress_noise_lamp",
    "semiclassical_constraint_algebra_lamp",
    "diagnostic_pass_authority",
    "candidate_authority",
    "theory_graph_authority",
    "physical_authority",
    "propulsion_authority",
    "transport_authority",
)
_NEWTON_TRUE_FIELDS: Final[tuple[str, ...]] = (
    "calculation_implemented",
    "complete_initial_f_and_j",
    "complete_trial_f_and_j",
    "one_dense_lu_per_update",
    "exact_armijo_without_stationary_exception",
    "accepted_state_scaled_step_denominator",
    "endpoint_projection_implemented",
    "synthetic_evaluator_used",
)
_NEWTON_FIELDS: Final[tuple[str, ...]] = (
    "node_count",
    "unknown_count",
    "raw_accepted_state",
    "projected_state",
    "projected_residual",
    "newton_terminated",
    "projection_gate_passed",
    "failure_code",
    "projection_residual_linf",
    "primary_numerics_policy_sha256",
    "primary_numerics_policy_canonical_size_bytes",
    "binary64_environment_source_sha256",
    "binary64_environment_source_size_bytes",
    "dense_lu_source_sha256",
    "dense_lu_source_size_bytes",
    "core_operator_source_sha256",
    "core_operator_source_size_bytes",
    "core_operator_dependency_sealed",
    *_NEWTON_TRUE_FIELDS,
    *_NEWTON_FALSE_FIELDS,
)


def _snapshot_projected_level(
    value: object,
    level_id: str,
    spectral_payload_sha256: str,
) -> FrozenCoreLevelArchiveReceipt:
    supplied = _snapshot_fields_once(value, _NEWTON_FIELDS, f"{level_id}_newton")
    node_count = dict(LEVEL_NODE_COUNTS)[level_id]
    unknown_count = dict(LEVEL_UNKNOWN_COUNTS)[level_id]
    if (
        supplied["node_count"] != node_count
        or supplied["unknown_count"] != unknown_count
        or supplied["newton_terminated"] is not True
        or supplied["failure_code"] is not None
    ):
        raise CoreLevelOrchestratorError(
            f"core_level_{level_id}_newton_or_lu_failed_without_retry",
            str(supplied["failure_code"]),
        )
    if supplied["projection_gate_passed"] is not True:
        raise CoreLevelOrchestratorError(
            f"core_level_{level_id}_projection_failed_without_retry"
        )
    if (
        supplied["primary_numerics_policy_sha256"]
        != PRIMARY_NUMERICS_POLICY_SHA256
        or supplied["primary_numerics_policy_canonical_size_bytes"]
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or supplied["binary64_environment_source_sha256"]
        != DEPENDENCY_SOURCE_BINDINGS["binary64_environment"][0]
        or supplied["binary64_environment_source_size_bytes"]
        != DEPENDENCY_SOURCE_BINDINGS["binary64_environment"][1]
        or supplied["dense_lu_source_sha256"]
        != DEPENDENCY_SOURCE_BINDINGS["dense_lu"][0]
        or supplied["dense_lu_source_size_bytes"]
        != DEPENDENCY_SOURCE_BINDINGS["dense_lu"][1]
        or supplied["core_operator_source_sha256"]
        != DEPENDENCY_SOURCE_BINDINGS["core_operator"][0]
        or supplied["core_operator_source_size_bytes"]
        != DEPENDENCY_SOURCE_BINDINGS["core_operator"][1]
        or supplied["core_operator_dependency_sealed"] is not True
        or any(supplied[name] is not True for name in _NEWTON_TRUE_FIELDS)
        or any(supplied[name] is not False for name in _NEWTON_FALSE_FIELDS)
    ):
        raise CoreLevelOrchestratorError(
            f"core_level_{level_id}_newton_binding_invalid"
        )

    raw = _snapshot_f64_tuple(
        supplied["raw_accepted_state"], unknown_count, f"{level_id}.raw"
    )
    projected = _snapshot_f64_tuple(
        supplied["projected_state"], unknown_count, f"{level_id}.projected"
    )
    residual = _snapshot_f64_tuple(
        supplied["projected_residual"], unknown_count, f"{level_id}.residual"
    )
    projected_linf = _validate_f64(
        supplied["projection_residual_linf"], f"{level_id}.projection_linf"
    )
    recomputed_linf = max(abs(component) for component in residual)
    if (
        projected_linf > PROJECTION_RESIDUAL_LIMIT
        or recomputed_linf > PROJECTION_RESIDUAL_LIMIT
        or _f64_bits(projected_linf) != _f64_bits(recomputed_linf)
    ):
        raise CoreLevelOrchestratorError(
            f"core_level_{level_id}_projection_residual_failed_without_retry"
        )
    changed_indices = (node_count - 1, 2 * node_count - 1)
    for index in range(unknown_count):
        if index in changed_indices:
            if _f64_bits(projected[index]) != bytes(8):
                raise CoreLevelOrchestratorError(
                    f"core_level_{level_id}_projection_integrity_failed",
                    str(index),
                )
        elif _f64_bits(projected[index]) != _f64_bits(raw[index]):
            raise CoreLevelOrchestratorError(
                f"core_level_{level_id}_projection_integrity_failed", str(index)
            )

    archive = tuple(component for component in projected)
    if archive is projected:
        raise CoreLevelOrchestratorError(
            f"core_level_{level_id}_archive_alias_invalid"
        )
    return FrozenCoreLevelArchiveReceipt(
        level_id=level_id,
        node_count=node_count,
        unknown_count=unknown_count,
        spectral_payload_sha256=spectral_payload_sha256,
        raw_accepted_state_f64le_sha256=_hash_f64(RAW_STATE_HASH_DOMAIN, raw),
        projected_state_f64le_sha256=_hash_f64(
            PROJECTED_STATE_HASH_DOMAIN, projected
        ),
        immutable_archive_f64le_sha256=_hash_f64(ARCHIVE_HASH_DOMAIN, archive),
        raw_u_infinity_bits=_f64_hex(raw[node_count - 1]),
        raw_V_infinity_bits=_f64_hex(raw[2 * node_count - 1]),
        projected_residual_max=projected_linf,
        projected_residual_max_bits=_f64_hex(projected_linf),
        projected_state=archive,
        projection_gate_passed=True,
        archive_copy_distinct=True,
    )


_TRANSFER_FALSE_FIELDS: Final[tuple[str, ...]] = (
    "source_acceptance_verified",
    "solve_performed",
    "restart_performed",
    "alternate_interpolation_used",
    "filtering_used",
    "candidate_execution_authorized",
    "candidate_executed",
    "candidate_output_materialized",
    "output_present",
    "output_accepted",
    "seed_accepted",
    "branch_accepted",
    "replay_authority",
    "independent_agreement",
    "candidate_authority",
    "theory_graph_authority",
    "physical_authority",
    "propulsion_authority",
    "transport_authority",
)
_TRANSFER_FIELDS: Final[tuple[str, ...]] = (
    "source_level",
    "target_level",
    "source_node_count",
    "target_node_count",
    "state",
    "u",
    "potential",
    "nu",
    "primary_numerics_policy_sha256",
    "primary_numerics_policy_canonical_size_bytes",
    "spectral_source_sha256",
    "spectral_source_size_bytes",
    "source_rho_payload_sha256",
    "target_spectral_payload_sha256",
    "mpfr_precision_bits",
    "mpfr_rounding_mode",
    "mpfr_emin",
    "mpfr_emax",
    "field_transfer_order",
    "calculation_implemented",
    *_TRANSFER_FALSE_FIELDS,
)


def _snapshot_transfer(
    value: object,
    *,
    source_level: str,
    target_level: str,
    source_archive: FrozenCoreLevelArchiveReceipt,
    archived_source_rho: tuple[float, ...],
    target_grid: _FrozenSpectralPayload,
) -> tuple[tuple[float, ...], FrozenLevelTransferReceipt]:
    supplied = _snapshot_fields_once(
        value, _TRANSFER_FIELDS, f"{source_level}_to_{target_level}"
    )
    source_count = dict(LEVEL_NODE_COUNTS)[source_level]
    target_count = dict(LEVEL_NODE_COUNTS)[target_level]
    state = _snapshot_f64_tuple(
        supplied["state"], 2 * target_count + 1, f"{target_level}.transfer.state"
    )
    u = _snapshot_f64_tuple(supplied["u"], target_count, f"{target_level}.transfer.u")
    potential = _snapshot_f64_tuple(
        supplied["potential"], target_count, f"{target_level}.transfer.V"
    )
    nu = _validate_f64(supplied["nu"], f"{target_level}.transfer.nu")
    if (
        supplied["source_level"] != source_level
        or supplied["target_level"] != target_level
        or supplied["source_node_count"] != source_count
        or supplied["target_node_count"] != target_count
        or _f64_payload(state) != _f64_payload((*u, *potential, nu))
        or _f64_bits(nu) != _f64_bits(source_archive.projected_state[-1])
        or supplied["primary_numerics_policy_sha256"]
        != PRIMARY_NUMERICS_POLICY_SHA256
        or supplied["primary_numerics_policy_canonical_size_bytes"]
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or supplied["spectral_source_sha256"]
        != DEPENDENCY_SOURCE_BINDINGS["spectral"][0]
        or supplied["spectral_source_size_bytes"]
        != DEPENDENCY_SOURCE_BINDINGS["spectral"][1]
        or supplied["source_rho_payload_sha256"]
        != _hash_f64(TRANSFER_RHO_HASH_DOMAIN, archived_source_rho)
        or supplied["source_rho_payload_sha256"]
        != _level_transfer.SOURCE_RHO_PAYLOAD_GOLDEN_HASHES[source_count]
        or supplied["target_spectral_payload_sha256"]
        != target_grid.payload_sha256
        or supplied["mpfr_precision_bits"] != 256
        or supplied["mpfr_rounding_mode"] != "MPFR_RNDN"
        or supplied["mpfr_emin"] != -1_000_000
        or supplied["mpfr_emax"] != 1_000_000
        or supplied["field_transfer_order"] != ("u", "V", "nu_bits")
        or supplied["calculation_implemented"] is not True
        or any(supplied[name] is not False for name in _TRANSFER_FALSE_FIELDS)
    ):
        raise CoreLevelOrchestratorError(
            f"core_level_{source_level}_to_{target_level}_transfer_invalid"
        )
    receipt = FrozenLevelTransferReceipt(
        source_level=source_level,
        target_level=target_level,
        source_node_count=source_count,
        target_node_count=target_count,
        archived_source_rho_f64le_sha256=_hash_f64(
            TRANSFER_RHO_HASH_DOMAIN, archived_source_rho
        ),
        source_archive_f64le_sha256=(
            source_archive.immutable_archive_f64le_sha256
        ),
        transferred_state_f64le_sha256=_hash_f64(
            TRANSFER_STATE_HASH_DOMAIN, state
        ),
        source_archive_spectral_payload_sha256=(
            source_archive.spectral_payload_sha256
        ),
        target_spectral_payload_sha256=target_grid.payload_sha256,
        archived_source_rho_cleared_before_solve=True,
        target_only_operator_abi_observed=True,
    )
    return state, receipt


_JOIN_FALSE_FIELDS: Final[tuple[str, ...]] = (
    "projected_source_acceptance_verified",
    "join_receipt_present",
    "solve_performed",
    "candidate_execution_authorized",
    "candidate_executed",
    "output_present",
    "output_accepted",
    "seed_accepted",
    "branch_accepted",
    "replay_authority",
    "independent_agreement",
    "diagnostic_pass_authority",
    "candidate_authority",
    "theory_graph_authority",
    "physical_authority",
    "propulsion_authority",
    "transport_authority",
)
_JOIN_FIELDS: Final[tuple[str, ...]] = (
    "node_count",
    "join_x",
    "join_rho_exact",
    "U",
    "U1",
    "V",
    "V1",
    "barrier_values",
    "barrier_order",
    "primary_numerics_policy_sha256",
    "primary_numerics_policy_canonical_size_bytes",
    "spectral_source_sha256",
    "spectral_source_size_bytes",
    "spectral_payload_sha256",
    "calculation_implemented",
    *_JOIN_FALSE_FIELDS,
)


def _snapshot_join(value: object, grid: _FrozenSpectralPayload) -> FrozenL2JoinReceipt:
    supplied = _snapshot_fields_once(value, _JOIN_FIELDS, "L2_join")
    barriers = _snapshot_f64_tuple(supplied["barrier_values"], 4, "L2.join")
    direct = tuple(
        _validate_f64(supplied[name], f"L2.join.{name}")
        for name in ("U", "U1", "V", "V1")
    )
    if (
        supplied["node_count"] != 128
        or supplied["join_x"] != 32
        or supplied["join_rho_exact"] != "32/33"
        or supplied["barrier_order"] != ("U", "U1", "V", "V1")
        or _f64_payload(barriers) != _f64_payload(direct)
        or supplied["primary_numerics_policy_sha256"]
        != PRIMARY_NUMERICS_POLICY_SHA256
        or supplied["primary_numerics_policy_canonical_size_bytes"]
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or supplied["spectral_source_sha256"]
        != DEPENDENCY_SOURCE_BINDINGS["spectral"][0]
        or supplied["spectral_source_size_bytes"]
        != DEPENDENCY_SOURCE_BINDINGS["spectral"][1]
        or supplied["spectral_payload_sha256"] != grid.payload_sha256
        or supplied["calculation_implemented"] is not True
        or any(supplied[name] is not False for name in _JOIN_FALSE_FIELDS)
    ):
        raise CoreLevelOrchestratorError("core_level_L2_join_result_invalid")
    return FrozenL2JoinReceipt(
        barrier_order=("U", "U1", "V", "V1"),
        barrier_values=barriers,
        barrier_bits=tuple(_f64_hex(component) for component in barriers),
        barrier_f64le_sha256=_hash_f64(JOIN_HASH_DOMAIN, barriers),
        join_x=32,
        join_rho_exact="32/33",
        spectral_payload_sha256=grid.payload_sha256,
    )


_CORE_FALSE_FIELDS: Final[tuple[str, ...]] = (
    "projected_source_acceptance_verified",
    "fixture_runtime_authority",
    "implementation_closure_complete",
    "runtime_closure_complete",
    "solve_performed",
    "candidate_execution_authorized",
    "candidate_executed",
    "output_present",
    "output_accepted",
    "seed_accepted",
    "branch_accepted",
    "replay_authority",
    "independent_agreement",
    "diagnostic_pass_authority",
    "candidate_authority",
    "theory_graph_authority",
    "physical_authority",
    "propulsion_authority",
    "transport_authority",
)
_CORE_FIELDS: Final[tuple[str, ...]] = (
    "node_count",
    "core_cell_count",
    "fixture_point_count",
    "domain",
    "core64",
    "core64_bits",
    "cells_completed",
    "mapped_points_completed",
    "node_integrands_completed",
    "exact_node_shortcuts",
    "projected_rho_f64le_sha256",
    "projected_u_f64le_sha256",
    "primary_numerics_policy_sha256",
    "primary_numerics_policy_canonical_size_bytes",
    "spectral_source_sha256",
    "spectral_source_size_bytes",
    "spectral_payload_sha256",
    "fixture_manifest_sha256",
    "fixture_manifest_size_bytes",
    "fixture_records_sha256",
    "fixture_records_size_bytes",
    "fixture_generator_sha256",
    "fixture_generator_size_bytes",
    "fixture_independent_test_sha256",
    "fixture_independent_test_size_bytes",
    "mpfr_precision_bits",
    "mpfr_rounding_mode",
    "mpfr_emin",
    "mpfr_emax",
    "calculation_implemented",
    "complete_core_graph_evaluated",
    "one_final_get_d_observed",
    *_CORE_FALSE_FIELDS,
)


def _snapshot_core_integral(
    value: object,
    grid: _FrozenSpectralPayload,
    projected_u: tuple[float, ...],
) -> FrozenL2CoreIntegralReceipt:
    supplied = _snapshot_fields_once(value, _CORE_FIELDS, "L2_core_integral")
    core64 = _validate_f64(supplied["core64"], "L2.core64")
    expected_nodes = 256 * 256
    expected_rho_hash = _hash_f64(
        _core_quadrature.PROJECTED_RHO_HASH_DOMAIN, grid.rho
    )
    expected_u_hash = _hash_f64(
        _core_quadrature.PROJECTED_U_HASH_DOMAIN, projected_u
    )
    if (
        supplied["node_count"] != 128
        or supplied["core_cell_count"] != 256
        or supplied["fixture_point_count"] != 256
        or supplied["domain"] != (0, 32)
        or core64 < 0.0
        or supplied["core64_bits"] != _f64_hex(core64)
        or supplied["cells_completed"] != 256
        or supplied["mapped_points_completed"] != expected_nodes
        or supplied["node_integrands_completed"] != expected_nodes
        or type(supplied["exact_node_shortcuts"]) is not int
        or supplied["exact_node_shortcuts"] < 0
        or supplied["projected_rho_f64le_sha256"] != expected_rho_hash
        or supplied["projected_u_f64le_sha256"] != expected_u_hash
        or supplied["primary_numerics_policy_sha256"]
        != PRIMARY_NUMERICS_POLICY_SHA256
        or supplied["primary_numerics_policy_canonical_size_bytes"]
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or supplied["spectral_source_sha256"]
        != DEPENDENCY_SOURCE_BINDINGS["spectral"][0]
        or supplied["spectral_source_size_bytes"]
        != DEPENDENCY_SOURCE_BINDINGS["spectral"][1]
        or supplied["spectral_payload_sha256"] != grid.payload_sha256
        or supplied["fixture_manifest_sha256"]
        != _core_quadrature.GL256_MANIFEST_SHA256
        or supplied["fixture_manifest_size_bytes"]
        != _core_quadrature.GL256_MANIFEST_SIZE_BYTES
        or supplied["fixture_records_sha256"]
        != _core_quadrature.GL256_RECORDS_SHA256
        or supplied["fixture_records_size_bytes"]
        != _core_quadrature.GL256_RECORDS_SIZE_BYTES
        or supplied["fixture_generator_sha256"]
        != _core_quadrature.GL256_GENERATOR_SHA256
        or supplied["fixture_generator_size_bytes"]
        != _core_quadrature.GL256_GENERATOR_SIZE_BYTES
        or supplied["fixture_independent_test_sha256"]
        != _core_quadrature.GL256_INDEPENDENT_TEST_SHA256
        or supplied["fixture_independent_test_size_bytes"]
        != _core_quadrature.GL256_INDEPENDENT_TEST_SIZE_BYTES
        or supplied["mpfr_precision_bits"] != 256
        or supplied["mpfr_rounding_mode"] != "MPFR_RNDN"
        or supplied["mpfr_emin"] != -1_000_000
        or supplied["mpfr_emax"] != 1_000_000
        or supplied["calculation_implemented"] is not True
        or supplied["complete_core_graph_evaluated"] is not True
        or supplied["one_final_get_d_observed"] is not True
        or any(supplied[name] is not False for name in _CORE_FALSE_FIELDS)
    ):
        raise CoreLevelOrchestratorError(
            "core_level_L2_core_integral_result_invalid"
        )
    return FrozenL2CoreIntegralReceipt(
        core64=core64,
        core64_bits=_f64_hex(core64),
        core_cell_count=256,
        fixture_point_count=256,
        cells_completed=256,
        mapped_points_completed=expected_nodes,
        node_integrands_completed=expected_nodes,
        exact_node_shortcuts=supplied["exact_node_shortcuts"],
        projected_rho_f64le_sha256=expected_rho_hash,
        projected_u_f64le_sha256=expected_u_hash,
        spectral_payload_sha256=grid.payload_sha256,
        fixture_manifest_sha256=_core_quadrature.GL256_MANIFEST_SHA256,
        fixture_records_sha256=_core_quadrature.GL256_RECORDS_SHA256,
        fixture_generator_sha256=_core_quadrature.GL256_GENERATOR_SHA256,
        fixture_independent_test_sha256=(
            _core_quadrature.GL256_INDEPENDENT_TEST_SHA256
        ),
        complete_core_graph_reported_by_synthetic_backend=True,
        one_final_get_d_reported_by_synthetic_backend=True,
        continuation_transferred_once=True,
    )


@dataclass(frozen=True, slots=True)
class _CoreLevelContinuationToken:
    result: FrozenCoreLevelOrchestrationDiagnostic
    owner_core_quadrature_module: ModuleType
    join_result: object
    core_integral_result: object
    core_quadrature_token: object
    projected_l2_archive: tuple[float, ...]
    l2_rho_source_support: tuple[float, ...]
    join_barriers: tuple[float, ...]
    core64: float
    bindings: tuple[tuple[str, object], ...]


_pending_core_level_continuation: _CoreLevelContinuationToken | None = None


def _require_core_level_continuation_slot() -> None:
    if _pending_core_level_continuation is not None:
        raise CoreLevelOrchestratorError(
            "core_level_continuation_pending"
        )


def _register_core_level_continuation(
    result: FrozenCoreLevelOrchestrationDiagnostic,
    *,
    owner_core_quadrature_module: ModuleType,
    join_result: object,
    core_integral_result: object,
    core_quadrature_token: object,
) -> None:
    global _pending_core_level_continuation
    _require_core_level_continuation_slot()
    if type(result) is not FrozenCoreLevelOrchestrationDiagnostic:
        raise CoreLevelOrchestratorError(
            "core_level_continuation_result_type_invalid"
        )
    if type(owner_core_quadrature_module) is not ModuleType:
        raise CoreLevelOrchestratorError(
            "core_level_core_quadrature_owner_type_invalid"
        )
    owner_token_type = getattr(
        owner_core_quadrature_module,
        "_CoreIntegralContinuationToken",
        None,
    )
    if (
        type(owner_token_type) is not type
        or type(core_quadrature_token) is not owner_token_type
        or core_quadrature_token.result is not core_integral_result
        or type(core_quadrature_token.core_sum) is not gmpy2.mpfr
        or core_quadrature_token.core_sum.precision != 256
        or type(core_quadrature_token.core64) is not float
        or _f64_bits(core_quadrature_token.core64)
        != _f64_bits(result.core_integral_receipt.core64)
        or type(core_quadrature_token.bindings) is not tuple
    ):
        raise CoreLevelOrchestratorError(
            "core_level_core_continuation_owner_binding_invalid"
        )
    l2_archive = result.level_archives[2].projected_state
    bindings = (
        ("l2_archive_sha256", result.level_archives[2].immutable_archive_f64le_sha256),
        ("l2_rho_support_sha256", result.l2_rho_source_support_f64le_sha256),
        ("join_sha256", result.join_receipt.barrier_f64le_sha256),
        ("core64_bits", result.core_integral_receipt.core64_bits),
        ("stage_order", result.stage_order),
    )
    _pending_core_level_continuation = _CoreLevelContinuationToken(
        result=result,
        owner_core_quadrature_module=owner_core_quadrature_module,
        join_result=join_result,
        core_integral_result=core_integral_result,
        core_quadrature_token=core_quadrature_token,
        projected_l2_archive=l2_archive,
        l2_rho_source_support=result.l2_rho_source_support,
        join_barriers=result.join_receipt.barrier_values,
        core64=result.core_integral_receipt.core64,
        bindings=bindings,
    )


def _consume_core_level_continuation(
    result: FrozenCoreLevelOrchestrationDiagnostic,
) -> _CoreLevelContinuationToken:
    """Transfer local ownership once to a future same-instance top-level loader.

    A separately private-loaded downstream module is not a valid consumer.
    The returned token retains ``owner_core_quadrature_module`` so composition
    can prove exact module identity without rebinding or recomputation.
    """

    global _pending_core_level_continuation
    token = _pending_core_level_continuation
    if token is None:
        raise CoreLevelOrchestratorError(
            "core_level_continuation_unavailable"
        )
    if (
        type(result) is not FrozenCoreLevelOrchestrationDiagnostic
        or token.result is not result
    ):
        raise CoreLevelOrchestratorError(
            "core_level_continuation_identity_mismatch"
        )
    _pending_core_level_continuation = None
    return token


def _backend_call(
    backend: object,
    method_name: str,
    failure_code: str,
    *args: object,
    **kwargs: object,
) -> object:
    try:
        method = getattr(backend, method_name)
        return method(*args, **kwargs)
    except CoreLevelOrchestratorError:
        raise
    except Exception as error:
        raise CoreLevelOrchestratorError(
            failure_code, type(error).__name__
        ) from error


def _release_operator(backend: object, level_id: str) -> None:
    released = _backend_call(
        backend,
        "release_operator",
        f"core_level_{level_id}_operator_release_failed",
        level_id,
    )
    if released is not True:
        raise CoreLevelOrchestratorError(
            f"core_level_{level_id}_operator_release_failed", "not_true"
        )


class _SyntheticOperatorLifetimeProxy:
    """Track the sole synthetic operator role and release it on rejection."""

    __slots__ = ("backend", "active_level")

    def __init__(self, backend: object) -> None:
        self.backend = backend
        self.active_level: str | None = None

    def generate_spectral(self, level_id: str, node_count: int) -> object:
        if self.active_level is not None:
            raise CoreLevelOrchestratorError(
                "core_level_simultaneous_operator_lifetime_invalid",
                f"{self.active_level}->{level_id}",
            )
        result = getattr(self.backend, "generate_spectral")(level_id, node_count)
        self.active_level = level_id
        return result

    def release_operator(self, level_id: str) -> object:
        if self.active_level != level_id:
            raise CoreLevelOrchestratorError(
                "core_level_operator_release_order_invalid", level_id
            )
        result = getattr(self.backend, "release_operator")(level_id)
        if result is True:
            self.active_level = None
        return result

    def __getattr__(self, name: str) -> object:
        return getattr(self.backend, name)


def _validate_dependency_continuation(
    token: object,
    dependency_result: object,
    core_receipt: FrozenL2CoreIntegralReceipt,
    owner_core_quadrature_module: ModuleType,
) -> None:
    owner_token_type = getattr(
        owner_core_quadrature_module,
        "_CoreIntegralContinuationToken",
        None,
    )
    if (
        type(owner_core_quadrature_module) is not ModuleType
        or type(owner_token_type) is not type
        or type(token) is not owner_token_type
    ):
        raise CoreLevelOrchestratorError(
            "core_level_core_continuation_owner_binding_invalid"
        )
    supplied = _snapshot_fields_once(
        token, ("result", "core_sum", "core64", "bindings"), "core_continuation"
    )
    core_sum = supplied["core_sum"]
    if (
        supplied["result"] is not dependency_result
        or type(core_sum) is not gmpy2.mpfr
        or core_sum.precision != 256
        or type(supplied["core64"]) is not float
        or _f64_bits(supplied["core64"]) != _f64_bits(core_receipt.core64)
        or type(supplied["bindings"]) is not tuple
    ):
        raise CoreLevelOrchestratorError(
            "core_level_core_continuation_binding_invalid"
        )


def _resolve_backend_core_quadrature_owner(
    backend: object,
    token: object,
) -> ModuleType:
    """Resolve the exact module that minted ``token`` without rebinding it.

    A backend should identify its owner explicitly.  The sole fallback is safe
    only for the synthetic harness: exact token class identity already proves
    that this orchestrator's authenticated private module minted the token.
    """

    try:
        owner = getattr(backend, "owner_core_quadrature_module")
    except AttributeError:
        if type(token) is not _core_quadrature._CoreIntegralContinuationToken:
            raise CoreLevelOrchestratorError(
                "core_level_core_quadrature_owner_unavailable"
            )
        owner = _core_quadrature
    except Exception as error:
        raise CoreLevelOrchestratorError(
            "core_level_core_quadrature_owner_snapshot_failed",
            type(error).__name__,
        ) from error
    if type(owner) is not ModuleType:
        raise CoreLevelOrchestratorError(
            "core_level_core_quadrature_owner_type_invalid"
        )
    if getattr(owner, "_CoreIntegralContinuationToken", None) is not type(token):
        raise CoreLevelOrchestratorError(
            "core_level_core_continuation_owner_binding_invalid"
        )
    return owner


def _orchestrate_synthetic_core_levels_graph(
    backend: object,
) -> FrozenCoreLevelOrchestrationDiagnostic:
    """Run the immutable lifecycle over scripted, non-authoritative results.

    The backend's keyword-only transfer method receives only the archived
    source-rho scratch, the immutable projected source archive, and the one
    live target spectral snapshot.  It never receives a released source
    operator set and matches the repaired production transfer ABI.
    """

    _verify_dependency_bindings()
    _require_core_level_continuation_slot()
    stages: list[str] = ["dependency_and_fixture_bindings_verified"]

    l0_value = _backend_call(
        backend,
        "generate_spectral",
        "core_level_L0_operator_materialization_failed",
        "L0",
        64,
    )
    l0_grid = _snapshot_spectral_payload(l0_value, "L0")
    l0_value = None
    stages.append("L0_operator_generated")
    l0_initializer = _backend_call(
        backend,
        "initialize_l0",
        "core_level_L0_initializer_failure",
        l0_grid,
    )
    l0_initial_state = _snapshot_initializer(l0_initializer, l0_grid)
    stages.append("L0_initializer_materialized")
    l0_solve = _backend_call(
        backend,
        "solve_core",
        "core_level_L0_newton_or_lu_failed_without_retry",
        "L0",
        l0_grid,
        l0_initial_state,
    )
    stages.append("L0_solved_once")
    l0_archive = _snapshot_projected_level(
        l0_solve, "L0", l0_grid.payload_sha256
    )
    stages.extend(("L0_projected_gate_passed", "L0_projected_archive_copied"))
    l0_rho_scratch = tuple(component for component in l0_grid.rho)
    stages.append("L0_source_rho_scratch_copied")
    _release_operator(backend, "L0")
    l0_grid = None
    stages.append("L0_operator_released")

    l1_value = _backend_call(
        backend,
        "generate_spectral",
        "core_level_L1_operator_materialization_failed",
        "L1",
        96,
    )
    l1_grid = _snapshot_spectral_payload(l1_value, "L1")
    l1_value = None
    stages.append("L1_operator_generated")
    l1_transfer_value = _backend_call(
        backend,
        "transfer_level",
        "core_level_L0_to_L1_transfer_failed_without_retry",
        source_level="L0",
        archived_source_rho=l0_rho_scratch,
        projected_source_state=l0_archive.projected_state,
        target_spectral=l1_grid,
    )
    l1_initial_state, l0_l1_transfer = _snapshot_transfer(
        l1_transfer_value,
        source_level="L0",
        target_level="L1",
        source_archive=l0_archive,
        archived_source_rho=l0_rho_scratch,
        target_grid=l1_grid,
    )
    if _hash_f64(ARCHIVE_HASH_DOMAIN, l0_archive.projected_state) != (
        l0_archive.immutable_archive_f64le_sha256
    ):
        raise CoreLevelOrchestratorError(
            "core_level_L0_archive_mutated_during_transfer"
        )
    stages.append("L0_to_L1_transferred_once")
    l0_rho_scratch = ()
    stages.append("L0_source_rho_scratch_cleared")
    l1_solve = _backend_call(
        backend,
        "solve_core",
        "core_level_L1_newton_or_lu_failed_without_retry",
        "L1",
        l1_grid,
        l1_initial_state,
    )
    stages.append("L1_solved_once")
    l1_archive = _snapshot_projected_level(
        l1_solve, "L1", l1_grid.payload_sha256
    )
    stages.extend(("L1_projected_gate_passed", "L1_projected_archive_copied"))
    l1_rho_scratch = tuple(component for component in l1_grid.rho)
    stages.append("L1_source_rho_scratch_copied")
    _release_operator(backend, "L1")
    l1_grid = None
    stages.append("L1_operator_released")

    l2_value = _backend_call(
        backend,
        "generate_spectral",
        "core_level_L2_operator_materialization_failed",
        "L2",
        128,
    )
    l2_grid = _snapshot_spectral_payload(l2_value, "L2")
    l2_value = None
    stages.append("L2_operator_generated")
    l2_transfer_value = _backend_call(
        backend,
        "transfer_level",
        "core_level_L1_to_L2_transfer_failed_without_retry",
        source_level="L1",
        archived_source_rho=l1_rho_scratch,
        projected_source_state=l1_archive.projected_state,
        target_spectral=l2_grid,
    )
    l2_initial_state, l1_l2_transfer = _snapshot_transfer(
        l2_transfer_value,
        source_level="L1",
        target_level="L2",
        source_archive=l1_archive,
        archived_source_rho=l1_rho_scratch,
        target_grid=l2_grid,
    )
    if _hash_f64(ARCHIVE_HASH_DOMAIN, l1_archive.projected_state) != (
        l1_archive.immutable_archive_f64le_sha256
    ):
        raise CoreLevelOrchestratorError(
            "core_level_L1_archive_mutated_during_transfer"
        )
    stages.append("L1_to_L2_transferred_once")
    l1_rho_scratch = ()
    stages.append("L1_source_rho_scratch_cleared")
    l2_solve = _backend_call(
        backend,
        "solve_core",
        "core_level_L2_newton_or_lu_failed_without_retry",
        "L2",
        l2_grid,
        l2_initial_state,
    )
    stages.append("L2_solved_once")
    l2_archive = _snapshot_projected_level(
        l2_solve, "L2", l2_grid.payload_sha256
    )
    stages.extend(("L2_projected_gate_passed", "L2_projected_archive_copied"))

    l2_rho_support = tuple(component for component in l2_grid.rho)
    if l2_rho_support is l2_grid.rho:
        raise CoreLevelOrchestratorError("core_level_L2_rho_support_alias_invalid")
    stages.append("L2_rho_source_support_copied")
    for index, (source, destination) in enumerate(
        zip(l2_grid.rho, l2_rho_support, strict=True)
    ):
        if _f64_bits(source) != _f64_bits(destination):
            raise CoreLevelOrchestratorError(
                "core_level_L2_rho_support_bit_gate_failed", str(index)
            )
    stages.append("L2_rho_source_support_bit_gate_passed")

    join_value = _backend_call(
        backend,
        "extract_join",
        "core_level_L2_join_extraction_failed_without_retry",
        l2_grid,
        l2_archive.projected_state,
    )
    join_receipt = _snapshot_join(join_value, l2_grid)
    stages.append("L2_join_extracted_once")
    projected_u = tuple(l2_archive.projected_state[:128])
    core_value = _backend_call(
        backend,
        "integrate_core",
        "core_level_L2_core_quadrature_failed_without_retry",
        l2_grid,
        projected_u,
    )
    core_receipt = _snapshot_core_integral(core_value, l2_grid, projected_u)
    stages.append("L2_core_quadrature_completed_once")
    dependency_continuation = _backend_call(
        backend,
        "consume_core_continuation",
        "core_level_L2_core_continuation_transfer_failed",
        core_value,
    )
    owner_core_quadrature_module = _resolve_backend_core_quadrature_owner(
        backend,
        dependency_continuation,
    )
    _validate_dependency_continuation(
        dependency_continuation,
        core_value,
        core_receipt,
        owner_core_quadrature_module,
    )
    stages.append("L2_core_quadrature_continuation_consumed_once")
    _release_operator(backend, "L2")
    l2_grid = None
    stages.append("L2_operator_released")

    if tuple(stages) != STAGE_ORDER:
        raise CoreLevelOrchestratorError(
            "core_level_stage_order_invariant"
        )
    bindings = tuple(
        (role, sha256, size)
        for role, _filename, sha256, size in _DEPENDENCY_SPECS
    )
    result = FrozenCoreLevelOrchestrationDiagnostic(
        level_order=LEVEL_ORDER,
        stage_order=STAGE_ORDER,
        level_archives=(l0_archive, l1_archive, l2_archive),
        level_transfers=(l0_l1_transfer, l1_l2_transfer),
        l2_rho_source_support=l2_rho_support,
        l2_rho_source_support_bits=tuple(
            _f64_hex(component) for component in l2_rho_support
        ),
        l2_rho_source_support_f64le_sha256=_hash_f64(
            L2_RHO_SUPPORT_HASH_DOMAIN, l2_rho_support
        ),
        join_receipt=join_receipt,
        core_integral_receipt=core_receipt,
        dependency_source_bindings=bindings,
        primary_numerics_policy_sha256=PRIMARY_NUMERICS_POLICY_SHA256,
        primary_numerics_policy_canonical_size_bytes=(
            PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        ),
        production_runtime_blocker=PRODUCTION_RUNTIME_BLOCKER,
        continuation_composition_blocker=CONTINUATION_COMPOSITION_BLOCKER,
    )
    _register_core_level_continuation(
        result,
        owner_core_quadrature_module=owner_core_quadrature_module,
        join_result=join_value,
        core_integral_result=core_value,
        core_quadrature_token=dependency_continuation,
    )
    return result


def _orchestrate_synthetic_core_levels(
    backend: object,
) -> FrozenCoreLevelOrchestrationDiagnostic:
    """Run one synthetic lifecycle and release its sole operator on failure."""

    proxy = _SyntheticOperatorLifetimeProxy(backend)
    try:
        return _orchestrate_synthetic_core_levels_graph(proxy)
    except Exception:
        active_level = proxy.active_level
        if active_level is not None:
            try:
                proxy.release_operator(active_level)
            except Exception:
                # Preserve the chronologically first failure.  This synthetic
                # cleanup path has no production/resource authority.
                pass
        raise


def orchestrate_primary_core_levels() -> FrozenCoreLevelOrchestrationDiagnostic:
    """Authenticate dependencies, then fail before any candidate numeric read."""

    _verify_dependency_bindings()
    raise CoreLevelOrchestratorError(
        PRODUCTION_RUNTIME_BLOCKER.code,
        PRODUCTION_RUNTIME_BLOCKER.stage,
    )


if (
    LEVEL_NODE_COUNTS != (("L0", 64), ("L1", 96), ("L2", 128))
    or LEVEL_UNKNOWN_COUNTS != (("L0", 129), ("L1", 193), ("L2", 257))
    or LEVEL_ORDER != ("L0", "L1", "L2")
    or len(STAGE_ORDER) != 28
    or PRODUCTION_RUNTIME_AVAILABLE
    or PRODUCTION_CONTINUATION_COMPOSITION_AVAILABLE
    or PRODUCTION_RUNTIME_BLOCKER.before_candidate_numeric_read is not True
    or (
        PRODUCTION_RUNTIME_BLOCKER.required_native_mpfr_element_count,
        PRODUCTION_RUNTIME_BLOCKER.required_binary64_element_count,
        PRODUCTION_RUNTIME_BLOCKER.required_permutation_element_count,
    )
    != (65_536, 262_144, 257)
    or PRODUCTION_RUNTIME_BLOCKER.current_producer_abi_exposes_fixed_native_arenas
    or PRODUCTION_RUNTIME_BLOCKER.retry_allowed
    or PRODUCTION_RUNTIME_BLOCKER.retune_allowed
    or CONTINUATION_COMPOSITION_BLOCKER.production_composition_available
    or not CONTINUATION_COMPOSITION_BLOCKER.same_authenticated_module_instance_required
    or CONTINUATION_COMPOSITION_BLOCKER.token_rebinding_allowed
    or CONTINUATION_COMPOSITION_BLOCKER.core_integral_recomputation_allowed
    or len(_DEPENDENCY_SPECS) != 9
    or tuple(DEPENDENCY_SOURCE_BINDINGS) != tuple(
        role for role, _filename, _sha256, _size in _DEPENDENCY_SPECS
    )
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("spherical_seed_primary_core_level_orchestrator_invariant")


__all__ = [
    "AUTHORITY_LOCKS",
    "BACKEND_CALL_ORDER",
    "CONTINUATION_COMPOSITION_BLOCKER",
    "CORE_LEVEL_ORCHESTRATOR_VERSION",
    "CoreLevelOrchestratorError",
    "DEPENDENCY_SOURCE_BINDINGS",
    "FrozenCoreLevelArchiveReceipt",
    "FrozenCoreLevelOrchestrationDiagnostic",
    "FrozenCoreLevelRuntimeBlocker",
    "FrozenCoreContinuationCompositionBlocker",
    "FrozenL2CoreIntegralReceipt",
    "FrozenL2JoinReceipt",
    "FrozenLevelTransferReceipt",
    "LEVEL_NODE_COUNTS",
    "LEVEL_ORDER",
    "LEVEL_UNKNOWN_COUNTS",
    "PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES",
    "PRIMARY_NUMERICS_POLICY_SHA256",
    "PRODUCTION_RUNTIME_AVAILABLE",
    "PRODUCTION_RUNTIME_BLOCKER",
    "PRODUCTION_CONTINUATION_COMPOSITION_AVAILABLE",
    "STAGE_ORDER",
    "orchestrate_primary_core_levels",
]
