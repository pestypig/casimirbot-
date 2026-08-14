"""Retained-integral initializer diagnostic for the 65-unknown tail system.

The implemented finite graph materializes ``z=[C,h[0..31],q[0..31]]`` from
one supplied core-integral barrier: ``C`` is copied once and every ``h``/``q``
coefficient is the exact binary64 positive-zero bit pattern.  The projected L2
frequency and four join barriers are validated, then the shared C1 lift
invariants are recomputed in their literal operation order as diagnostics.

The repaired join and core-quadrature sources are authenticated and executed
from their exact bytes under private module identities.  A successful public
adapter call transfers the once-only retained core-integral continuation into a
second identity-gated continuation for the future mass operator.  Synthetic
helpers remain available only for focused tests.  No mass quadrature, Newton
step, candidate execution, output acceptance, or scientific authority is
present.
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


TAIL_INITIALIZER_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_seed_primary_tail_initializer/v1"
)
PRIMARY_NUMERICS_POLICY_SHA256: Final[str] = (
    "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4"
)
PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES: Final[int] = 80_055
BINARY64_ENVIRONMENT_SOURCE_SHA256: Final[str] = (
    "8d452abdfa6d9b3e0cf92aa7d8682202b588f1fe8b0fe0772c6d003d2d12f1a4"
)
BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES: Final[int] = 14_980

JOIN_EXTRACTION_SOURCE_SHA256: Final[str] = (
    "d2b86dffeaa9e56aabed044f688d89c6b282600b435aa8b3491ce51ca07d7d6b"
)
JOIN_EXTRACTION_SOURCE_SIZE_BYTES: Final[int] = 26_780
JOIN_EXTRACTION_SOURCE_STATUS: Final[str] = "sealed_private_exact_byte_source"
CORE_INTEGRAL_CONTINUATION_SOURCE_SHA256: Final[str] = (
    "78d56665839c0c50c7ee3a013595ac5b30baf67ea9194e062a930554eeb302e1"
)
CORE_INTEGRAL_CONTINUATION_SOURCE_SIZE_BYTES: Final[int] = 47_738
CORE_INTEGRAL_CONTINUATION_SOURCE_STATUS: Final[str] = (
    "sealed_private_retained_integral_source"
)
PRODUCTION_DEPENDENCIES_SEALED: Final[bool] = True

RADIUS: Final[int] = 32
PROJECTED_NODE_COUNT: Final[int] = 128
PROJECTED_UNKNOWN_COUNT: Final[int] = 257
TAIL_NODE_COUNT: Final[int] = 32
TAIL_UNKNOWN_COUNT: Final[int] = 65
TAIL_UNKNOWN_ORDER: Final[str] = "C,h[0..31],q[0..31]"
JOIN_BARRIER_ORDER: Final[tuple[str, ...]] = ("U", "U1", "V", "V1")
INVARIANT_ORDER: Final[tuple[str, ...]] = (
    "kappa",
    "a",
    "sigma",
    "H1",
    "Hy1",
    "Q1",
    "Qy1",
)

MPFR_PRECISION_BITS: Final[int] = 256
MPFR_ROUNDING_MODE: Final[str] = "MPFR_RNDN"
MPFR_EMIN: Final[int] = -1_000_000
MPFR_EMAX: Final[int] = 1_000_000

PROJECTED_STATE_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/tail-initializer/projected-l2-f64le/v1\n"
)
JOIN_BARRIER_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/tail-initializer/join-f64le/v1\n"
)
INITIAL_STATE_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/tail-initializer/z-f64le/v1\n"
)

TAIL_INITIALIZER_OPERATION_GRAPH: Final[str] = (
    "authenticate_and_private_execute_join_and_core_quadrature;require_empty_"
    "tail_continuation_slot;install_authenticated_binary64_environment_then_"
    "owned_MPFR256_context;"
    "validate_projected_L2_state_u0_to_u127_then_V0_to_V127_then_nu_and_require_"
    "nu_less_than_zero;validate_join_U_then_U1_then_V_then_V1;validate_one_"
    "authenticated_retained_core64_barrier;copy_C_once_then_append_32_literal_positive_zero_h_"
    "then_32_literal_positive_zero_q;kappa=cr_sqrt64(round64(-2*nu));"
    "a=round64(kappa*32);sigma=round64(C/kappa)-1;H1=U;"
    "Hy1=round64(round64(-a+sigma)*U)-round64(32*U1);"
    "Q1=V+round64(C/32);Qy1=round64(round64(-2*a+2*sigma)*Q1)+"
    "round64(C/32)-round64(32*V1);after_success_consume_core_continuation_"
    "exactly_once_without_get_d_then_transfer_original_core_sum_and_token_to_"
    "identity_gated_once_only_tail_continuation;diagnostic_only"
)


class TailInitializerError(ValueError):
    """Fail-closed tail-initializer error with a deterministic code."""

    def __init__(self, code: str, detail: str = "root") -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


@dataclass(frozen=True, slots=True)
class _SyntheticJoinBarriers:
    """Test-only stand-in; never accepted by the production adapter."""

    U: float
    U1: float
    V: float
    V1: float
    barrier_values: tuple[float, ...]
    node_count: int = PROJECTED_NODE_COUNT
    join_x: int = RADIUS
    join_rho_exact: str = "32/33"
    barrier_order: tuple[str, ...] = JOIN_BARRIER_ORDER
    calculation_implemented: bool = True
    projected_source_acceptance_verified: bool = False
    join_receipt_present: bool = False
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


@dataclass(frozen=True, slots=True)
class _SyntheticCoreIntegralBarrier:
    """Test-only stand-in for one future authenticated core64 barrier."""

    core64: float
    core64_bits: str
    calculation_implemented: bool = True
    complete_core_graph_evaluated: bool = True
    one_final_get_d_observed: bool = True
    projected_source_acceptance_verified: bool = False
    fixture_runtime_authority: bool = False
    implementation_closure_complete: bool = False
    runtime_closure_complete: bool = False
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


@dataclass(frozen=True, slots=True)
class FrozenTailInitializerDiagnostic:
    projected_node_count: int
    projected_unknown_count: int
    tail_node_count: int
    tail_unknown_count: int
    radius: int
    tail_unknown_order: str
    initial_state: tuple[float, ...]
    initial_state_bits: tuple[str, ...]
    initial_state_f64le_sha256: str
    projected_l2_nu: float
    projected_l2_nu_bits: str
    projected_state_f64le_sha256: str
    core64: float
    core64_bits: str
    join_barriers: tuple[float, ...]
    join_barrier_bits: tuple[str, ...]
    join_barrier_f64le_sha256: str
    invariant_order: tuple[str, ...]
    invariant_values: tuple[float, ...]
    invariant_bits: tuple[str, ...]
    kappa: float
    a: float
    sigma: float
    H1: float
    Hy1: float
    Q1: float
    Qy1: float
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    binary64_environment_source_sha256: str
    binary64_environment_source_size_bytes: int
    join_extraction_source_sha256: str | None
    join_extraction_source_size_bytes: int | None
    join_extraction_source_status: str
    core_integral_continuation_source_sha256: str | None
    core_integral_continuation_source_size_bytes: int | None
    core_integral_continuation_source_status: str
    production_dependencies_sealed: bool
    binary64_runtime_family: str
    mpfr_precision_bits: int
    mpfr_rounding_mode: str
    mpfr_emin: int
    mpfr_emax: int
    observed_gmpy2_version: str
    observed_mpfr_version: str
    synthetic_dependencies_used: bool
    calculation_implemented: bool = True
    initializer_vector_computed: bool = True
    c1_lift_diagnostic_computed: bool = True
    core64_barrier_consumption_count: int = 1
    core64_barrier_copy_count: int = 1
    h_positive_zero_count: int = TAIL_NODE_COUNT
    q_positive_zero_count: int = TAIL_NODE_COUNT
    production_adapter_available: bool = False
    core_integral_continuation_executed: bool = False
    mass_row_implemented: bool = False
    mass_quadrature_implemented: bool = False
    newton_implemented: bool = False
    solve_performed: bool = False
    projected_source_acceptance_verified: bool = False
    join_receipt_present: bool = False
    implementation_closure_complete: bool = False
    runtime_closure_complete: bool = False
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


@dataclass(frozen=True, slots=True)
class _TailInitializerContinuationToken:
    result: FrozenTailInitializerDiagnostic
    core_integral_result: object
    core_integral_continuation: object
    core_sum: gmpy2.mpfr
    core64: float


_pending_tail_initializer_continuation: (
    _TailInitializerContinuationToken | None
) = None
_spent_owned_core_continuations: tuple[object, ...] = ()


def _require_tail_initializer_continuation_slot() -> None:
    if _pending_tail_initializer_continuation is not None:
        raise TailInitializerError("tail_initializer_continuation_pending")


def _register_tail_initializer_continuation(
    result: FrozenTailInitializerDiagnostic,
    core_integral_result: object,
    core_integral_continuation: object,
) -> None:
    global _pending_tail_initializer_continuation
    _require_tail_initializer_continuation_slot()
    core_sum = core_integral_continuation.core_sum
    core64 = core_integral_continuation.core64
    _pending_tail_initializer_continuation = _TailInitializerContinuationToken(
        result=result,
        core_integral_result=core_integral_result,
        core_integral_continuation=core_integral_continuation,
        core_sum=core_sum,
        core64=core64,
    )


def _consume_tail_initializer_continuation(
    result: FrozenTailInitializerDiagnostic,
) -> _TailInitializerContinuationToken:
    global _pending_tail_initializer_continuation
    token = _pending_tail_initializer_continuation
    if token is None:
        raise TailInitializerError("tail_initializer_continuation_unavailable")
    if type(result) is not FrozenTailInitializerDiagnostic or token.result is not result:
        raise TailInitializerError("tail_initializer_continuation_identity_mismatch")
    _pending_tail_initializer_continuation = None
    return token


def _owned_core_continuation_was_spent(token: object) -> bool:
    for spent in _spent_owned_core_continuations:
        if spent is token:
            return True
        if (
            type(spent) is _core_quadrature._CoreIntegralContinuationToken
            and type(token) is _core_quadrature._CoreIntegralContinuationToken
            and spent.result is token.result
            and spent.core_sum is token.core_sum
        ):
            return True
    return False


AUTHORITY_LOCKS: Final = MappingProxyType(
    {
        "primaryNumericsSemanticAuthority": False,
        "implementationClosureComplete": False,
        "runtimeClosureComplete": False,
        "sourceManifestAuthority": False,
        "toolchainAuthority": False,
        "executableAuthority": False,
        "runtimeAuthority": False,
        "preexecutionPresealPresent": False,
        "executionAuthorized": False,
        "executionObserved": False,
        "massRowImplemented": False,
        "massQuadratureImplemented": False,
        "newtonImplemented": False,
        "projectedSourceAcceptanceVerified": False,
        "joinReceiptPresent": False,
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


_HERE: Final[Path] = Path(__file__).resolve().parent
_BINARY64_ENVIRONMENT_PATH: Final[Path] = _HERE / "binary64_environment.py"
_JOIN_EXTRACTION_PATH: Final[Path] = _HERE / "join_extraction.py"
_CORE_QUADRATURE_PATH: Final[Path] = _HERE / "core_quadrature.py"
_PRIVATE_FENV_MODULE_NAME: Final[str] = (
    "_nhm2_seed_tail_initializer_fenv_8d452abdfa6d9b3e"
)
_PRIVATE_JOIN_EXTRACTION_MODULE_NAME: Final[str] = (
    "_nhm2_seed_tail_initializer_join_d2b86dffeaa9e56a"
)
_PRIVATE_CORE_QUADRATURE_MODULE_NAME: Final[str] = (
    "_nhm2_seed_tail_initializer_core_quadrature_78d56665839c0c50"
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
        raise TailInitializerError(
            f"tail_initializer_{dependency}_source_unavailable",
            type(error).__name__,
        ) from error
    if len(source) != expected_size_bytes:
        raise TailInitializerError(
            f"tail_initializer_{dependency}_source_mismatch", "size"
        )
    if hashlib.sha256(source).hexdigest() != expected_sha256:
        raise TailInitializerError(
            f"tail_initializer_{dependency}_source_mismatch", "sha256"
        )
    return source


def _read_bound_binary64_environment_source() -> bytes:
    return _read_bound_source(
        _BINARY64_ENVIRONMENT_PATH,
        BINARY64_ENVIRONMENT_SOURCE_SHA256,
        BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES,
        "binary64_environment",
    )


def _read_bound_join_extraction_source() -> bytes:
    return _read_bound_source(
        _JOIN_EXTRACTION_PATH,
        JOIN_EXTRACTION_SOURCE_SHA256,
        JOIN_EXTRACTION_SOURCE_SIZE_BYTES,
        "join_extraction",
    )


def _read_bound_core_quadrature_source() -> bytes:
    return _read_bound_source(
        _CORE_QUADRATURE_PATH,
        CORE_INTEGRAL_CONTINUATION_SOURCE_SHA256,
        CORE_INTEGRAL_CONTINUATION_SOURCE_SIZE_BYTES,
        "core_quadrature",
    )


def _execute_private_module(
    *, source: bytes, path: Path, private_name: str, dependency: str
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
        raise TailInitializerError(
            f"tail_initializer_{dependency}_private_load_failed",
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
        raise TailInitializerError(
            f"tail_initializer_{dependency}_module_origin_mismatch"
        )
    return module


_binary64_environment = _execute_private_module(
    source=_read_bound_binary64_environment_source(),
    path=_BINARY64_ENVIRONMENT_PATH,
    private_name=_PRIVATE_FENV_MODULE_NAME,
    dependency="binary64_environment",
)
_join_extraction = _execute_private_module(
    source=_read_bound_join_extraction_source(),
    path=_JOIN_EXTRACTION_PATH,
    private_name=_PRIVATE_JOIN_EXTRACTION_MODULE_NAME,
    dependency="join_extraction",
)
_core_quadrature = _execute_private_module(
    source=_read_bound_core_quadrature_source(),
    path=_CORE_QUADRATURE_PATH,
    private_name=_PRIVATE_CORE_QUADRATURE_MODULE_NAME,
    dependency="core_quadrature",
)

FrozenL2JoinBarriers = _join_extraction.FrozenL2JoinBarriers
FrozenProjectedL2CoreIntegral = _core_quadrature.FrozenProjectedL2CoreIntegral

_JOIN_RESULT_FIELD_NAMES: Final[tuple[str, ...]] = (
    "node_count", "join_x", "join_rho_exact", "U", "U1", "V", "V1",
    "barrier_values", "barrier_order", "primary_numerics_policy_sha256",
    "primary_numerics_policy_canonical_size_bytes", "spectral_source_sha256",
    "spectral_source_size_bytes", "spectral_payload_sha256",
    "mpfr_precision_bits", "mpfr_rounding_mode", "mpfr_emin", "mpfr_emax",
    "observed_gmpy2_version", "observed_mpfr_version",
    "calculation_implemented", *_JOIN_FALSE_FIELDS,
)
_CORE_RESULT_FIELD_NAMES: Final[tuple[str, ...]] = (
    "node_count", "core_cell_count", "fixture_point_count", "domain", "core64",
    "core64_bits", "cells_completed", "mapped_points_completed",
    "node_integrands_completed", "exact_node_shortcuts",
    "projected_rho_f64le_sha256", "projected_u_f64le_sha256",
    "primary_numerics_policy_sha256",
    "primary_numerics_policy_canonical_size_bytes", "spectral_source_sha256",
    "spectral_source_size_bytes", "spectral_payload_sha256",
    "fixture_manifest_sha256", "fixture_manifest_size_bytes",
    "fixture_records_sha256", "fixture_records_size_bytes",
    "fixture_generator_sha256", "fixture_generator_size_bytes",
    "fixture_independent_test_sha256", "fixture_independent_test_size_bytes",
    "mpfr_precision_bits", "mpfr_rounding_mode", "mpfr_emin", "mpfr_emax",
    "observed_gmpy2_version", "observed_mpfr_version",
    "calculation_implemented", "complete_core_graph_evaluated",
    "one_final_get_d_observed", *_CORE_FALSE_FIELDS,
)


def _verify_closed_dependency_binding() -> None:
    _read_bound_binary64_environment_source()
    _read_bound_join_extraction_source()
    _read_bound_core_quadrature_source()
    if (
        _binary64_environment.BINARY64_ENVIRONMENT_VERSION
        != "nhm2_spherical_boson_star_seed_producer_binary64_environment/v1"
        or any(
            value is not False
            for value in _binary64_environment.AUTHORITY_LOCKS.values()
        )
    ):
        raise TailInitializerError(
            "tail_initializer_binary64_environment_binding_invalid"
        )
    if (
        _join_extraction.JOIN_EXTRACTION_VERSION
        != "nhm2_spherical_boson_star_seed_primary_l2_join_extraction/v1"
        or _join_extraction.PRIMARY_NUMERICS_POLICY_SHA256
        != PRIMARY_NUMERICS_POLICY_SHA256
        or _join_extraction.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or _join_extraction.NODE_COUNT != PROJECTED_NODE_COUNT
        or _join_extraction.JOIN_X != RADIUS
        or _join_extraction.BARRIER_ORDER != JOIN_BARRIER_ORDER
        or tuple(FrozenL2JoinBarriers.__dataclass_fields__)
        != _JOIN_RESULT_FIELD_NAMES
        or any(value is not False for value in _join_extraction.AUTHORITY_LOCKS.values())
        or any(
            value is not False
            for value in _join_extraction._spectral_module.AUTHORITY_LOCKS.values()
        )
    ):
        raise TailInitializerError(
            "tail_initializer_join_extraction_binding_invalid"
        )
    if (
        _core_quadrature.CORE_QUADRATURE_VERSION
        != "nhm2_spherical_boson_star_seed_primary_l2_core_gl256_quadrature/v1"
        or _core_quadrature.PRIMARY_NUMERICS_POLICY_SHA256
        != PRIMARY_NUMERICS_POLICY_SHA256
        or _core_quadrature.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or _core_quadrature.L2_NODE_COUNT != PROJECTED_NODE_COUNT
        or _core_quadrature.CORE_DOMAIN_LENGTH != RADIUS
        or tuple(FrozenProjectedL2CoreIntegral.__dataclass_fields__)
        != _CORE_RESULT_FIELD_NAMES
        or any(value is not False for value in _core_quadrature.AUTHORITY_LOCKS.values())
        or any(
            value is not False
            for value in _core_quadrature._spectral_module.AUTHORITY_LOCKS.values()
        )
        or not callable(
            getattr(_core_quadrature, "_consume_core_integral_continuation", None)
        )
    ):
        raise TailInitializerError(
            "tail_initializer_core_quadrature_binding_invalid"
        )


def _f64_bits(value: float) -> bytes:
    return struct.pack("<d", value)


def _f64_hex(value: float) -> str:
    return _f64_bits(value).hex()


def _negative_zero(value: float) -> bool:
    return value == 0.0 and _f64_bits(value) == bytes.fromhex(
        "0000000000000080"
    )


def _validate_f64(value: object, detail: str) -> float:
    if type(value) is not float:
        raise TailInitializerError(
            "tail_initializer_binary64_type_invalid", detail
        )
    if not math.isfinite(value):
        raise TailInitializerError(
            "tail_initializer_binary64_nonfinite_input", detail
        )
    if _negative_zero(value):
        raise TailInitializerError(
            "tail_initializer_binary64_negative_zero_input", detail
        )
    return 0.0 if value == 0.0 else value


def _sha256_valid(value: object) -> bool:
    return (
        type(value) is str
        and len(value) == 64
        and value != "0" * 64
        and all(character in "0123456789abcdef" for character in value)
    )


def _f64_tuple_sha256(domain: bytes, values: tuple[float, ...]) -> str:
    digest = hashlib.sha256(domain)
    digest.update(struct.pack(f"<{len(values)}d", *values))
    return digest.hexdigest()


def _validate_projected_l2_state(value: object) -> tuple[tuple[float, ...], float]:
    if type(value) is not tuple or len(value) != PROJECTED_UNKNOWN_COUNT:
        raise TailInitializerError(
            "tail_initializer_projected_state_shape_invalid"
        )
    state = tuple(
        _validate_f64(component, f"projected_l2_state[{index}]")
        for index, component in enumerate(value)
    )
    if _f64_bits(state[PROJECTED_NODE_COUNT - 1]) != bytes(8):
        raise TailInitializerError(
            "tail_initializer_projected_u_infinity_not_positive_zero"
        )
    if _f64_bits(state[(2 * PROJECTED_NODE_COUNT) - 1]) != bytes(8):
        raise TailInitializerError(
            "tail_initializer_projected_V_infinity_not_positive_zero"
        )
    nu = state[-1]
    if nu >= 0.0:
        raise TailInitializerError("tail_initializer_projected_nu_domain_invalid")
    return state, nu


def _validate_synthetic_join_barriers(
    value: object,
) -> tuple[float, float, float, float]:
    if type(value) is not _SyntheticJoinBarriers:
        raise TailInitializerError(
            "tail_initializer_synthetic_join_type_invalid", type(value).__name__
        )
    join = value
    if (
        type(join.node_count) is not int
        or join.node_count != PROJECTED_NODE_COUNT
        or type(join.join_x) is not int
        or join.join_x != RADIUS
        or type(join.join_rho_exact) is not str
        or join.join_rho_exact != "32/33"
        or type(join.barrier_order) is not tuple
        or len(join.barrier_order) != 4
        or any(type(item) is not str for item in join.barrier_order)
        or join.barrier_order != JOIN_BARRIER_ORDER
        or join.calculation_implemented is not True
    ):
        raise TailInitializerError(
            "tail_initializer_synthetic_join_binding_invalid"
        )
    if any(
        getattr(join, field, None) is not False for field in _JOIN_FALSE_FIELDS
    ):
        raise TailInitializerError(
            "tail_initializer_synthetic_join_authority_lock_invalid"
        )
    if type(join.barrier_values) is not tuple or len(join.barrier_values) != 4:
        raise TailInitializerError(
            "tail_initializer_synthetic_join_shape_invalid"
        )
    barriers = tuple(
        _validate_f64(component, f"join.{name}")
        for name, component in zip(
            JOIN_BARRIER_ORDER, join.barrier_values, strict=True
        )
    )
    named = (join.U, join.U1, join.V, join.V1)
    if any(
        type(component) is not float
        or _f64_bits(component) != _f64_bits(barriers[index])
        for index, component in enumerate(named)
    ):
        raise TailInitializerError(
            "tail_initializer_synthetic_join_named_value_mismatch"
        )
    return barriers  # type: ignore[return-value]


def _validate_synthetic_core_barrier(value: object) -> float:
    if type(value) is not _SyntheticCoreIntegralBarrier:
        raise TailInitializerError(
            "tail_initializer_synthetic_core_type_invalid", type(value).__name__
        )
    core = value
    if (
        core.calculation_implemented is not True
        or core.complete_core_graph_evaluated is not True
        or core.one_final_get_d_observed is not True
        or type(core.core64_bits) is not str
        or len(core.core64_bits) != 16
    ):
        raise TailInitializerError(
            "tail_initializer_synthetic_core_binding_invalid"
        )
    if any(
        getattr(core, field, None) is not False for field in _CORE_FALSE_FIELDS
    ):
        raise TailInitializerError(
            "tail_initializer_synthetic_core_authority_lock_invalid"
        )
    core64 = _validate_f64(core.core64, "core64")
    if core64 <= 0.0:
        raise TailInitializerError("tail_initializer_core64_domain_invalid")
    if core.core64_bits != _f64_hex(core64):
        raise TailInitializerError("tail_initializer_core64_bit_mismatch")
    return core64


def _snapshot_private_result(
    value: object,
    expected_type: type[object],
    field_names: tuple[str, ...],
    dependency: str,
) -> dict[str, object]:
    if type(value) is not expected_type:
        raise TailInitializerError(
            f"tail_initializer_{dependency}_result_type_invalid",
            type(value).__name__,
        )
    try:
        supplied = tuple(getattr(value, field_name) for field_name in field_names)
    except Exception as error:
        raise TailInitializerError(
            f"tail_initializer_{dependency}_result_snapshot_failed",
            type(error).__name__,
        ) from error
    return dict(zip(field_names, supplied, strict=True))


def _validate_production_join_barriers(
    value: object,
) -> tuple[float, float, float, float]:
    join = _snapshot_private_result(
        value,
        FrozenL2JoinBarriers,
        _JOIN_RESULT_FIELD_NAMES,
        "join",
    )
    if (
        type(join["node_count"]) is not int
        or join["node_count"] != PROJECTED_NODE_COUNT
        or type(join["join_x"]) is not int
        or join["join_x"] != RADIUS
        or type(join["join_rho_exact"]) is not str
        or join["join_rho_exact"] != "32/33"
        or join["barrier_order"] != JOIN_BARRIER_ORDER
        or join["primary_numerics_policy_sha256"]
        != PRIMARY_NUMERICS_POLICY_SHA256
        or join["primary_numerics_policy_canonical_size_bytes"]
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or join["spectral_source_sha256"]
        != _join_extraction.SPECTRAL_SOURCE_SHA256
        or join["spectral_source_size_bytes"]
        != _join_extraction.SPECTRAL_SOURCE_SIZE_BYTES
        or join["spectral_payload_sha256"]
        != _join_extraction.SPECTRAL_N128_PAYLOAD_SHA256
        or join["mpfr_precision_bits"] != MPFR_PRECISION_BITS
        or join["mpfr_rounding_mode"] != MPFR_ROUNDING_MODE
        or join["mpfr_emin"] != MPFR_EMIN
        or join["mpfr_emax"] != MPFR_EMAX
        or join["observed_gmpy2_version"] != gmpy2.version()
        or join["observed_mpfr_version"] != gmpy2.mpfr_version()
        or join["calculation_implemented"] is not True
    ):
        raise TailInitializerError("tail_initializer_join_result_binding_invalid")
    if any(join[field] is not False for field in _JOIN_FALSE_FIELDS):
        raise TailInitializerError(
            "tail_initializer_join_result_authority_lock_invalid"
        )
    raw = join["barrier_values"]
    if type(raw) is not tuple or len(raw) != len(JOIN_BARRIER_ORDER):
        raise TailInitializerError("tail_initializer_join_result_shape_invalid")
    barriers = tuple(
        _validate_f64(component, f"join.{name}")
        for name, component in zip(JOIN_BARRIER_ORDER, raw, strict=True)
    )
    named = tuple(join[name] for name in JOIN_BARRIER_ORDER)
    if any(
        type(component) is not float
        or _f64_bits(component) != _f64_bits(barriers[index])
        for index, component in enumerate(named)
    ):
        raise TailInitializerError("tail_initializer_join_result_named_value_mismatch")
    return barriers  # type: ignore[return-value]


def _validate_production_core_integral(
    value: object,
    projected_state: tuple[float, ...],
) -> tuple[float, tuple[tuple[str, object], ...]]:
    core = _snapshot_private_result(
        value,
        FrozenProjectedL2CoreIntegral,
        _CORE_RESULT_FIELD_NAMES,
        "core",
    )
    expected_nodes = _core_quadrature.CORE_CELL_COUNT * _core_quadrature.GL_POINT_COUNT
    if (
        type(core["node_count"]) is not int
        or core["node_count"] != PROJECTED_NODE_COUNT
        or type(core["core_cell_count"]) is not int
        or core["core_cell_count"] != _core_quadrature.CORE_CELL_COUNT
        or type(core["fixture_point_count"]) is not int
        or core["fixture_point_count"] != _core_quadrature.GL_POINT_COUNT
        or type(core["domain"]) is not tuple
        or len(core["domain"]) != 2
        or any(type(endpoint) is not int for endpoint in core["domain"])
        or core["domain"] != (0, RADIUS)
        or type(core["cells_completed"]) is not int
        or core["cells_completed"] != _core_quadrature.CORE_CELL_COUNT
        or type(core["mapped_points_completed"]) is not int
        or core["mapped_points_completed"] != expected_nodes
        or type(core["node_integrands_completed"]) is not int
        or core["node_integrands_completed"] != expected_nodes
        or type(core["exact_node_shortcuts"]) is not int
        or not 0 <= core["exact_node_shortcuts"] <= expected_nodes
        or core["primary_numerics_policy_sha256"]
        != PRIMARY_NUMERICS_POLICY_SHA256
        or core["primary_numerics_policy_canonical_size_bytes"]
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or core["spectral_source_sha256"]
        != _core_quadrature.SPECTRAL_SOURCE_SHA256
        or core["spectral_source_size_bytes"]
        != _core_quadrature.SPECTRAL_SOURCE_SIZE_BYTES
        or core["spectral_payload_sha256"]
        != _core_quadrature.SPECTRAL_N128_PAYLOAD_SHA256
        or core["fixture_manifest_sha256"]
        != _core_quadrature.GL256_MANIFEST_SHA256
        or core["fixture_manifest_size_bytes"]
        != _core_quadrature.GL256_MANIFEST_SIZE_BYTES
        or core["fixture_records_sha256"]
        != _core_quadrature.GL256_RECORDS_SHA256
        or core["fixture_records_size_bytes"]
        != _core_quadrature.GL256_RECORDS_SIZE_BYTES
        or core["fixture_generator_sha256"]
        != _core_quadrature.GL256_GENERATOR_SHA256
        or core["fixture_generator_size_bytes"]
        != _core_quadrature.GL256_GENERATOR_SIZE_BYTES
        or core["fixture_independent_test_sha256"]
        != _core_quadrature.GL256_INDEPENDENT_TEST_SHA256
        or core["fixture_independent_test_size_bytes"]
        != _core_quadrature.GL256_INDEPENDENT_TEST_SIZE_BYTES
        or core["mpfr_precision_bits"] != MPFR_PRECISION_BITS
        or core["mpfr_rounding_mode"] != MPFR_ROUNDING_MODE
        or core["mpfr_emin"] != MPFR_EMIN
        or core["mpfr_emax"] != MPFR_EMAX
        or core["observed_gmpy2_version"] != gmpy2.version()
        or core["observed_mpfr_version"] != gmpy2.mpfr_version()
        or core["calculation_implemented"] is not True
        or core["complete_core_graph_evaluated"] is not True
        or core["one_final_get_d_observed"] is not True
    ):
        raise TailInitializerError("tail_initializer_core_result_binding_invalid")
    if any(core[field] is not False for field in _CORE_FALSE_FIELDS):
        raise TailInitializerError(
            "tail_initializer_core_result_authority_lock_invalid"
        )
    core64 = _validate_f64(core["core64"], "core64")
    if core64 <= 0.0:
        raise TailInitializerError("tail_initializer_core64_domain_invalid")
    if type(core["core64_bits"]) is not str or core["core64_bits"] != _f64_hex(core64):
        raise TailInitializerError("tail_initializer_core64_bit_mismatch")
    for field in (
        "projected_rho_f64le_sha256",
        "projected_u_f64le_sha256",
    ):
        if not _sha256_valid(core[field]):
            raise TailInitializerError(
                "tail_initializer_core_result_hash_invalid", field
            )
    expected_u_hash = _core_quadrature._f64_payload_sha256(
        _core_quadrature.PROJECTED_U_HASH_DOMAIN,
        projected_state[:PROJECTED_NODE_COUNT],
    )
    if core["projected_u_f64le_sha256"] != expected_u_hash:
        raise TailInitializerError(
            "tail_initializer_core_projected_u_hash_mismatch"
        )
    bindings = tuple(
        (field_name, core[field_name])
        for field_name in _core_quadrature._CORE_CONTINUATION_BINDING_FIELD_NAMES
    )
    return core64, bindings


def _validate_pending_core_continuation(
    token: object,
    result: object,
    core64: float,
    bindings: tuple[tuple[str, object], ...],
) -> object:
    if token is None:
        raise TailInitializerError(
            "tail_initializer_core_continuation_unavailable"
        )
    if type(token) is not _core_quadrature._CoreIntegralContinuationToken:
        raise TailInitializerError(
            "tail_initializer_core_continuation_type_invalid"
        )
    if token.result is not result:
        raise TailInitializerError(
            "tail_initializer_core_continuation_identity_mismatch"
        )
    if (
        type(token.core_sum) is not gmpy2.mpfr
        or token.core_sum.precision != MPFR_PRECISION_BITS
        or not gmpy2.is_finite(token.core_sum)
        or token.core_sum <= 0
        or gmpy2.is_signed(token.core_sum)
        or type(token.core64) is not float
        or token.core64 is not core64
        or _f64_bits(token.core64) != _f64_bits(core64)
        or type(token.bindings) is not tuple
        or token.bindings != bindings
    ):
        raise TailInitializerError(
            "tail_initializer_core_continuation_binding_invalid"
        )
    return token


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
            or context.trap_underflow
            or context.trap_overflow
            or context.trap_inexact
            or context.trap_invalid
            or context.trap_erange
            or context.trap_divzero
            or context.underflow
            or context.overflow
            or context.inexact
            or context.invalid
            or context.erange
            or context.divzero
            or context.allow_complex
            or context.rational_division
            or context.allow_release_gil
        ):
            raise TailInitializerError(
                "tail_initializer_mpfr_context_installation_failed"
            )
        context.clear_flags()
        yield context


def _check_mpfr_flags(context: gmpy2.context, operation: str) -> None:
    observed = {
        name: bool(getattr(context, name))
        for name in (
            "underflow",
            "overflow",
            "inexact",
            "invalid",
            "erange",
            "divzero",
        )
    }
    bad = tuple(
        name
        for name in ("invalid", "divzero", "overflow", "underflow", "erange")
        if observed[name]
    )
    if bad:
        raise TailInitializerError(
            "tail_initializer_mpfr_exceptional_flag",
            f"{operation}:{','.join(bad)}",
        )


def _finish_mpfr(
    context: gmpy2.context, value: gmpy2.mpfr, operation: str
) -> gmpy2.mpfr:
    _check_mpfr_flags(context, operation)
    if not gmpy2.is_finite(value):
        raise TailInitializerError(
            "tail_initializer_mpfr_nonfinite", operation
        )
    if gmpy2.is_zero(value):
        context.clear_flags()
        result = gmpy2.mpfr(0, MPFR_PRECISION_BITS)
        _check_mpfr_flags(context, f"{operation}.canonical_zero")
        return result
    return value


def _mpfr_set_d(
    context: gmpy2.context, value: float, operation: str
) -> gmpy2.mpfr:
    context.clear_flags()
    result = gmpy2.mpfr(value, MPFR_PRECISION_BITS)
    inexact = bool(context.inexact)
    result = _finish_mpfr(context, result, operation)
    if inexact:
        raise TailInitializerError(
            "tail_initializer_mpfr_set_d_inexact", operation
        )
    return result


def _mpfr_sqrt(
    context: gmpy2.context, value: gmpy2.mpfr, operation: str
) -> gmpy2.mpfr:
    if value < 0:
        raise TailInitializerError(
            "tail_initializer_mpfr_sqrt_domain_invalid", operation
        )
    context.clear_flags()
    return _finish_mpfr(context, gmpy2.sqrt(value), operation)


def _mpfr_get_d(
    context: gmpy2.context, value: gmpy2.mpfr, operation: str
) -> float:
    context.clear_flags()
    result = float(value)
    _check_mpfr_flags(context, operation)
    if not math.isfinite(result):
        raise TailInitializerError(
            "tail_initializer_mpfr_get_d_nonfinite", operation
        )
    result = 0.0 if result == 0.0 else result
    if _negative_zero(result):
        raise TailInitializerError(
            "tail_initializer_mpfr_get_d_negative_zero", operation
        )
    return result


def _cr_sqrt64(
    context: gmpy2.context, value: float, operation: str
) -> float:
    operand = _mpfr_set_d(context, value, f"{operation}.set_d")
    result = _mpfr_sqrt(context, operand, f"{operation}.sqrt")
    return _mpfr_get_d(context, result, f"{operation}.get_d")


def _finish_f64(value: float, operation: str) -> float:
    if not math.isfinite(value):
        raise TailInitializerError(
            "tail_initializer_binary64_nonfinite_intermediate", operation
        )
    return 0.0 if value == 0.0 else value


def _copy(value: float, operation: str) -> float:
    if type(value) is not float:
        raise TailInitializerError(
            "tail_initializer_internal_binary64_type_invalid", operation
        )
    return _finish_f64(value, operation)


def _add(left: float, right: float, operation: str) -> float:
    return _finish_f64(left + right, operation)


def _sub(left: float, right: float, operation: str) -> float:
    return _finish_f64(left - right, operation)


def _mul(left: float, right: float, operation: str) -> float:
    return _finish_f64(left * right, operation)


def _div(numerator: float, denominator: float, operation: str) -> float:
    if denominator == 0.0:
        raise TailInitializerError(
            "tail_initializer_binary64_division_by_zero", operation
        )
    return _finish_f64(numerator / denominator, operation)


def _neg(value: float, operation: str) -> float:
    return _finish_f64(-value, operation)


def _build_initial_state(core64: float) -> tuple[float, ...]:
    C = _copy(core64, "initial.C.copy")
    state = (C, *(0.0 for _ in range(TAIL_NODE_COUNT)), *(0.0 for _ in range(TAIL_NODE_COUNT)))
    if (
        len(state) != TAIL_UNKNOWN_COUNT
        or any(_f64_bits(component) != bytes(8) for component in state[1:])
    ):
        raise TailInitializerError(
            "tail_initializer_positive_zero_invariant_failed"
        )
    return state


def _build_c1_diagnostics(
    context: gmpy2.context,
    *,
    C: float,
    projected_l2_nu: float,
    barriers: tuple[float, float, float, float],
) -> tuple[float, float, float, float, float, float, float]:
    minus_two_nu = _mul(-2.0, projected_l2_nu, "diagnostic.minus_two_nu")
    if minus_two_nu <= 0.0:
        raise TailInitializerError("tail_initializer_kappa_domain_invalid")
    kappa = _cr_sqrt64(context, minus_two_nu, "diagnostic.kappa")
    if kappa <= 0.0:
        raise TailInitializerError("tail_initializer_kappa_domain_invalid")
    a = _mul(kappa, float(RADIUS), "diagnostic.a")
    C_over_kappa = _div(C, kappa, "diagnostic.C_over_kappa")
    sigma = _sub(C_over_kappa, 1.0, "diagnostic.sigma")

    U, U1, V, V1 = barriers
    H1 = _copy(U, "diagnostic.H1")
    negative_a = _neg(a, "diagnostic.Hy1.negative_a")
    hy_t0 = _add(negative_a, sigma, "diagnostic.Hy1.t0")
    hy_t1 = _mul(hy_t0, H1, "diagnostic.Hy1.t1")
    hy_t2 = _mul(float(RADIUS), U1, "diagnostic.Hy1.t2")
    Hy1 = _sub(hy_t1, hy_t2, "diagnostic.Hy1")

    c_over_r_q1 = _div(C, float(RADIUS), "diagnostic.Q1.C_over_R")
    copied_V = _copy(V, "diagnostic.Q1.V")
    Q1 = _add(copied_V, c_over_r_q1, "diagnostic.Q1")
    negative_two_a = _mul(-2.0, a, "diagnostic.Qy1.negative_two_a")
    two_sigma = _mul(2.0, sigma, "diagnostic.Qy1.two_sigma")
    qy_t0 = _add(negative_two_a, two_sigma, "diagnostic.Qy1.t0")
    qy_t1 = _mul(qy_t0, Q1, "diagnostic.Qy1.t1")
    qy_t2 = _div(C, float(RADIUS), "diagnostic.Qy1.t2_C_over_R")
    qy_t3 = _mul(float(RADIUS), V1, "diagnostic.Qy1.t3")
    qy_sum = _add(qy_t1, qy_t2, "diagnostic.Qy1.t1_plus_t2")
    Qy1 = _sub(qy_sum, qy_t3, "diagnostic.Qy1")
    return kappa, a, sigma, H1, Hy1, Q1, Qy1


def _materialize_validated_tail_initializer_graph(
    *,
    context: gmpy2.context,
    projected_state: tuple[float, ...],
    nu: float,
    barriers: tuple[float, float, float, float],
    core64: float,
    synthetic_dependencies_used: bool,
    production_adapter_available: bool,
    core_integral_continuation_executed: bool,
) -> FrozenTailInitializerDiagnostic:
    initial_state = _build_initial_state(core64)
    invariants = _build_c1_diagnostics(
        context,
        C=initial_state[0],
        projected_l2_nu=nu,
        barriers=barriers,
    )
    if (
        len(invariants) != len(INVARIANT_ORDER)
        or any(
            not math.isfinite(component) or _negative_zero(component)
            for component in invariants
        )
    ):
        raise TailInitializerError(
            "tail_initializer_diagnostic_invariant_invalid"
        )
    state_bits = tuple(_f64_hex(component) for component in initial_state)
    barrier_bits = tuple(_f64_hex(component) for component in barriers)
    invariant_bits = tuple(_f64_hex(component) for component in invariants)
    initial_hash = _f64_tuple_sha256(INITIAL_STATE_HASH_DOMAIN, initial_state)
    projected_hash = _f64_tuple_sha256(
        PROJECTED_STATE_HASH_DOMAIN, projected_state
    )
    join_hash = _f64_tuple_sha256(JOIN_BARRIER_HASH_DOMAIN, barriers)

    kappa, a, sigma, H1, Hy1, Q1, Qy1 = invariants
    return FrozenTailInitializerDiagnostic(
        projected_node_count=PROJECTED_NODE_COUNT,
        projected_unknown_count=PROJECTED_UNKNOWN_COUNT,
        tail_node_count=TAIL_NODE_COUNT,
        tail_unknown_count=TAIL_UNKNOWN_COUNT,
        radius=RADIUS,
        tail_unknown_order=TAIL_UNKNOWN_ORDER,
        initial_state=initial_state,
        initial_state_bits=state_bits,
        initial_state_f64le_sha256=initial_hash,
        projected_l2_nu=nu,
        projected_l2_nu_bits=_f64_hex(nu),
        projected_state_f64le_sha256=projected_hash,
        core64=initial_state[0],
        core64_bits=state_bits[0],
        join_barriers=barriers,
        join_barrier_bits=barrier_bits,
        join_barrier_f64le_sha256=join_hash,
        invariant_order=INVARIANT_ORDER,
        invariant_values=invariants,
        invariant_bits=invariant_bits,
        kappa=kappa,
        a=a,
        sigma=sigma,
        H1=H1,
        Hy1=Hy1,
        Q1=Q1,
        Qy1=Qy1,
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
        join_extraction_source_sha256=JOIN_EXTRACTION_SOURCE_SHA256,
        join_extraction_source_size_bytes=JOIN_EXTRACTION_SOURCE_SIZE_BYTES,
        join_extraction_source_status=JOIN_EXTRACTION_SOURCE_STATUS,
        core_integral_continuation_source_sha256=(
            CORE_INTEGRAL_CONTINUATION_SOURCE_SHA256
        ),
        core_integral_continuation_source_size_bytes=(
            CORE_INTEGRAL_CONTINUATION_SOURCE_SIZE_BYTES
        ),
        core_integral_continuation_source_status=(
            CORE_INTEGRAL_CONTINUATION_SOURCE_STATUS
        ),
        production_dependencies_sealed=PRODUCTION_DEPENDENCIES_SEALED,
        binary64_runtime_family=_binary64_environment.BINARY64_RUNTIME_FAMILY,
        mpfr_precision_bits=MPFR_PRECISION_BITS,
        mpfr_rounding_mode=MPFR_ROUNDING_MODE,
        mpfr_emin=MPFR_EMIN,
        mpfr_emax=MPFR_EMAX,
        observed_gmpy2_version=gmpy2.version(),
        observed_mpfr_version=gmpy2.mpfr_version(),
        synthetic_dependencies_used=synthetic_dependencies_used,
        production_adapter_available=production_adapter_available,
        core_integral_continuation_executed=(
            core_integral_continuation_executed
        ),
    )


def _materialize_tail_initializer_graph(
    *,
    projected_l2_state: tuple[float, ...],
    join_barriers: _SyntheticJoinBarriers,
    core_integral: _SyntheticCoreIntegralBarrier,
    synthetic_dependencies_used: bool,
) -> FrozenTailInitializerDiagnostic:
    """Execute the finite graph; tests may call it only with synthetic barriers."""

    if synthetic_dependencies_used is not True:
        raise TailInitializerError(
            "tail_initializer_synthetic_flag_invalid", repr(synthetic_dependencies_used)
        )
    _verify_closed_dependency_binding()
    with _binary64_environment.nearest_binary64_environment():
        with _owned_mpfr256_context() as context:
            projected_state, nu = _validate_projected_l2_state(projected_l2_state)
            barriers = _validate_synthetic_join_barriers(join_barriers)
            core64 = _validate_synthetic_core_barrier(core_integral)
            return _materialize_validated_tail_initializer_graph(
                context=context,
                projected_state=projected_state,
                nu=nu,
                barriers=barriers,
                core64=core64,
                synthetic_dependencies_used=True,
                production_adapter_available=False,
                core_integral_continuation_executed=False,
            )


def _materialize_primary_tail_initializer_from_owned_core_continuation(
    *,
    owner_core_quadrature_module: ModuleType,
    projected_l2_state: object,
    join_barriers: object,
    core_integral: object,
    core_integral_continuation: object,
) -> FrozenTailInitializerDiagnostic:
    """Transfer one already-consumed token from the exact shared owner.

    This private composition seam never mints, consumes, rebinds, or
    recomputes a core integral.  Its caller must have consumed the exact token
    from this initializer's authenticated ``_core_quadrature`` instance, and
    that module's pending slot must therefore already be empty.
    """

    global _spent_owned_core_continuations
    _verify_closed_dependency_binding()
    _require_tail_initializer_continuation_slot()
    if (
        type(owner_core_quadrature_module) is not ModuleType
        or owner_core_quadrature_module is not _core_quadrature
    ):
        raise TailInitializerError(
            "tail_initializer_owned_core_owner_identity_mismatch"
        )
    if _core_quadrature._pending_core_integral_continuation is not None:
        raise TailInitializerError(
            "tail_initializer_owned_core_pending_slot_not_empty"
        )
    if _owned_core_continuation_was_spent(core_integral_continuation):
        raise TailInitializerError(
            "tail_initializer_owned_core_continuation_already_spent"
        )

    with _binary64_environment.nearest_binary64_environment():
        with _owned_mpfr256_context() as context:
            projected_state, nu = _validate_projected_l2_state(
                projected_l2_state
            )
            barriers = _validate_production_join_barriers(join_barriers)
            core64, bindings = _validate_production_core_integral(
                core_integral,
                projected_state,
            )
            token = _validate_pending_core_continuation(
                core_integral_continuation,
                core_integral,
                core64,
                bindings,
            )
            result = _materialize_validated_tail_initializer_graph(
                context=context,
                projected_state=projected_state,
                nu=nu,
                barriers=barriers,
                core64=token.core64,
                synthetic_dependencies_used=False,
                production_adapter_available=True,
                core_integral_continuation_executed=True,
            )

    if _core_quadrature._pending_core_integral_continuation is not None:
        raise TailInitializerError(
            "tail_initializer_owned_core_pending_slot_changed"
        )
    if _owned_core_continuation_was_spent(token):
        raise TailInitializerError(
            "tail_initializer_owned_core_continuation_already_spent"
        )
    _register_tail_initializer_continuation(result, core_integral, token)
    _spent_owned_core_continuations = (
        *_spent_owned_core_continuations,
        token,
    )
    return result


def materialize_primary_tail_initializer(
    *,
    projected_l2_state: object,
    join_barriers: object,
    core_integral: object,
) -> FrozenTailInitializerDiagnostic:
    """Transfer one authenticated retained core integral into the tail stage."""

    _verify_closed_dependency_binding()
    _require_tail_initializer_continuation_slot()
    with _binary64_environment.nearest_binary64_environment():
        with _owned_mpfr256_context() as context:
            projected_state, nu = _validate_projected_l2_state(projected_l2_state)
            barriers = _validate_production_join_barriers(join_barriers)
            core64, bindings = _validate_production_core_integral(
                core_integral,
                projected_state,
            )
            pending = _validate_pending_core_continuation(
                _core_quadrature._pending_core_integral_continuation,
                core_integral,
                core64,
                bindings,
            )
            result = _materialize_validated_tail_initializer_graph(
                context=context,
                projected_state=projected_state,
                nu=nu,
                barriers=barriers,
                core64=pending.core64,
                synthetic_dependencies_used=False,
                production_adapter_available=True,
                core_integral_continuation_executed=True,
            )
    consumed = _core_quadrature._consume_core_integral_continuation(core_integral)
    if consumed is not pending:
        raise TailInitializerError(
            "tail_initializer_core_continuation_consumption_mismatch"
        )
    _register_tail_initializer_continuation(result, core_integral, consumed)
    return result


if (
    len(PRIMARY_NUMERICS_POLICY_SHA256) != 64
    or PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES != 80_055
    or len(BINARY64_ENVIRONMENT_SOURCE_SHA256) != 64
    or BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES != 14_980
    or len(JOIN_EXTRACTION_SOURCE_SHA256) != 64
    or JOIN_EXTRACTION_SOURCE_SIZE_BYTES != 26_780
    or len(CORE_INTEGRAL_CONTINUATION_SOURCE_SHA256) != 64
    or CORE_INTEGRAL_CONTINUATION_SOURCE_SIZE_BYTES != 47_738
    or PRODUCTION_DEPENDENCIES_SEALED is not True
    or (RADIUS, PROJECTED_NODE_COUNT, PROJECTED_UNKNOWN_COUNT) != (32, 128, 257)
    or (TAIL_NODE_COUNT, TAIL_UNKNOWN_COUNT) != (32, 65)
    or JOIN_BARRIER_ORDER != ("U", "U1", "V", "V1")
    or MPFR_PRECISION_BITS != 256
    or MPFR_EMIN != -1_000_000
    or MPFR_EMAX != 1_000_000
    or FrozenL2JoinBarriers is not _join_extraction.FrozenL2JoinBarriers
    or FrozenProjectedL2CoreIntegral
    is not _core_quadrature.FrozenProjectedL2CoreIntegral
    or "productionAdapterAvailable" in AUTHORITY_LOCKS
    or "coreIntegralContinuationExecuted" in AUTHORITY_LOCKS
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("spherical_seed_primary_tail_initializer_invariant")


__all__ = [
    "AUTHORITY_LOCKS",
    "BINARY64_ENVIRONMENT_SOURCE_SHA256",
    "BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES",
    "CORE_INTEGRAL_CONTINUATION_SOURCE_SHA256",
    "CORE_INTEGRAL_CONTINUATION_SOURCE_SIZE_BYTES",
    "CORE_INTEGRAL_CONTINUATION_SOURCE_STATUS",
    "FrozenL2JoinBarriers",
    "FrozenProjectedL2CoreIntegral",
    "FrozenTailInitializerDiagnostic",
    "INVARIANT_ORDER",
    "JOIN_BARRIER_ORDER",
    "JOIN_EXTRACTION_SOURCE_SHA256",
    "JOIN_EXTRACTION_SOURCE_SIZE_BYTES",
    "JOIN_EXTRACTION_SOURCE_STATUS",
    "MPFR_EMAX",
    "MPFR_EMIN",
    "MPFR_PRECISION_BITS",
    "MPFR_ROUNDING_MODE",
    "PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES",
    "PRIMARY_NUMERICS_POLICY_SHA256",
    "PRODUCTION_DEPENDENCIES_SEALED",
    "PROJECTED_NODE_COUNT",
    "PROJECTED_UNKNOWN_COUNT",
    "RADIUS",
    "TAIL_INITIALIZER_OPERATION_GRAPH",
    "TAIL_INITIALIZER_VERSION",
    "TAIL_NODE_COUNT",
    "TAIL_UNKNOWN_COUNT",
    "TAIL_UNKNOWN_ORDER",
    "TailInitializerError",
    "materialize_primary_tail_initializer",
]
