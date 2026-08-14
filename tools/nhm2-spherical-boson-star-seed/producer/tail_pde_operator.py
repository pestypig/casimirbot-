"""Frozen binary64 evaluator for the 64 non-mass tail PDE rows.

This diagnostic primitive evaluates S(y[0..31]) followed by P(y[0..31]) and
their complete 64-by-65 analytic Jacobian in unknown order
``[C,h[0..31],q[0..31]]``.  It deliberately omits the mass row, quadrature,
Newton control, candidate execution, and every scientific-authority claim.
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


TAIL_PDE_OPERATOR_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_seed_primary_tail_pde_operator/v1"
)
PRIMARY_NUMERICS_POLICY_SHA256: Final[str] = (
    "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4"
)
PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES: Final[int] = 80_055
BINARY64_ENVIRONMENT_SOURCE_SHA256: Final[str] = (
    "8d452abdfa6d9b3e0cf92aa7d8682202b588f1fe8b0fe0772c6d003d2d12f1a4"
)
BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES: Final[int] = 14_980
TAIL_COLLOCATION_SOURCE_SHA256: Final[str] = (
    "a857b7e97cce63c87678c90a09d8bfd6b4f0dfc62f81749fe009f307ba0d4cf9"
)
TAIL_COLLOCATION_SOURCE_SIZE_BYTES: Final[int] = 16_680
JOIN_EXTRACTION_SOURCE_SHA256: Final[str] = (
    "d2b86dffeaa9e56aabed044f688d89c6b282600b435aa8b3491ce51ca07d7d6b"
)
JOIN_EXTRACTION_SOURCE_SIZE_BYTES: Final[int] = 26_780
SPECTRAL_SOURCE_SHA256: Final[str] = (
    "e9b2509b0c4a5d417250b3d145a648404cde440f12961d2faec1bc14758b78f7"
)
SPECTRAL_SOURCE_SIZE_BYTES: Final[int] = 19_045

RADIUS: Final[int] = 32
NODE_COUNT: Final[int] = 32
UNKNOWN_COUNT: Final[int] = 65
PDE_ROW_COUNT: Final[int] = 64
MPFR_PRECISION_BITS: Final[int] = 256
MPFR_ROUNDING_MODE: Final[str] = "MPFR_RNDN"
MPFR_EMIN: Final[int] = -1_000_000
MPFR_EMAX: Final[int] = 1_000_000
UNKNOWN_ORDER: Final[str] = "C,h[0..31],q[0..31]"
ROW_ORDER: Final[str] = "S[0..31],P[0..31]"

TAIL_NODE_GOLDEN_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed-primary-tail-collocation/golden/v1\n"
)
TAIL_NODE_GOLDEN_SHA256: Final[str] = (
    "fff305d51e7019b902b261e1dd7a7fe2609e5268a551364919605a78ba78f762"
)
TAIL_STATE_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/tail-pde/state-f64le/v1\n"
)
JOIN_BARRIER_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/tail-pde/join-f64le/v1\n"
)

C1_LIFT_OPERATION_GRAPH: Final[str] = (
    "kappa=cr_sqrt64(round64(-2*nu));a=round64(kappa*32);"
    "sigma=C/kappa-1;H1=U;Hy1=(-a+sigma)*U-32*U1;"
    "Q1=V+C/32;Qy1=((-2*a)+(2*sigma))*Q1+C/32-32*V1"
)
DUAL_COMPONENT_OPERATION_GRAPH: Final[str] = (
    "fresh_destination_primal_then_d0_through_d64;unknown_order_C_h0_to_h31_"
    "q0_to_q31;literal_add_sub_neg_mul_div_exp_log_rules;no_finite_difference_"
    "complex_step_or_generic_AD"
)
CHEBYSHEV_STREAMING_GRAPH: Final[str] = (
    "per_row_field_H_then_Q;seed_only_current_coefficient;retain_previous_"
    "current_next_T_Ty_Tyy_and_A_Ay_Ayy;never_materialize_32_by_3_dual_table"
)
ROW_EVALUATION_GRAPH: Final[str] = (
    "row_invariants_once;S_j_increasing_then_P_j_increasing;each_row_recompute_"
    "H_Q_derivatives_then_exterior_factor;positive_y_literal_scaled_row;"
    "y_zero_open_row_without_div_log_exp;store_residual_then_columns_0_to_64"
)


class TailPdeOperatorError(ValueError):
    """Fail-closed tail-PDE primitive error with a stable code."""

    def __init__(self, code: str, detail: str = "root") -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


_HERE: Final[Path] = Path(__file__).resolve().parent
_BINARY64_ENVIRONMENT_PATH: Final[Path] = _HERE / "binary64_environment.py"
_TAIL_COLLOCATION_PATH: Final[Path] = _HERE / "tail_collocation.py"
_JOIN_EXTRACTION_PATH: Final[Path] = _HERE / "join_extraction.py"
_SPECTRAL_PATH: Final[Path] = _HERE / "spectral.py"
_PRIVATE_JOIN_EXTRACTION_MODULE_NAME: Final[str] = (
    "_nhm2_seed_tail_pde_join_d2b86dffeaa9e56a"
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
        raise TailPdeOperatorError(
            f"tail_pde_{dependency}_source_unavailable", type(error).__name__
        ) from error
    if len(source) != expected_size_bytes:
        raise TailPdeOperatorError(
            f"tail_pde_{dependency}_source_mismatch", "size"
        )
    if hashlib.sha256(source).hexdigest() != expected_sha256:
        raise TailPdeOperatorError(
            f"tail_pde_{dependency}_source_mismatch", "sha256"
        )
    return source


def _read_bound_binary64_environment_source() -> bytes:
    return _read_bound_source(
        _BINARY64_ENVIRONMENT_PATH,
        BINARY64_ENVIRONMENT_SOURCE_SHA256,
        BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES,
        "binary64_environment",
    )


def _read_bound_tail_collocation_source() -> bytes:
    return _read_bound_source(
        _TAIL_COLLOCATION_PATH,
        TAIL_COLLOCATION_SOURCE_SHA256,
        TAIL_COLLOCATION_SOURCE_SIZE_BYTES,
        "tail_collocation",
    )


def _read_bound_join_extraction_source() -> bytes:
    return _read_bound_source(
        _JOIN_EXTRACTION_PATH,
        JOIN_EXTRACTION_SOURCE_SHA256,
        JOIN_EXTRACTION_SOURCE_SIZE_BYTES,
        "join_extraction",
    )


def _read_bound_spectral_source() -> bytes:
    return _read_bound_source(
        _SPECTRAL_PATH,
        SPECTRAL_SOURCE_SHA256,
        SPECTRAL_SOURCE_SIZE_BYTES,
        "spectral",
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
        raise TailPdeOperatorError(
            f"tail_pde_{dependency}_private_load_failed", type(error).__name__
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
        raise TailPdeOperatorError(
            f"tail_pde_{dependency}_module_origin_mismatch"
        )
    return module


def _load_bound_binary64_environment() -> ModuleType:
    source = _read_bound_binary64_environment_source()
    return _execute_private_module(
        source=source,
        path=_BINARY64_ENVIRONMENT_PATH,
        private_name="_nhm2_seed_tail_pde_bound_binary64_environment",
        dependency="binary64_environment",
    )


_binary64_environment = _load_bound_binary64_environment()
_tail_collocation_module = _execute_private_module(
    source=_read_bound_tail_collocation_source(),
    path=_TAIL_COLLOCATION_PATH,
    private_name="_nhm2_seed_tail_pde_bound_tail_collocation",
    dependency="tail_collocation",
)
_spectral_module = _execute_private_module(
    source=_read_bound_spectral_source(),
    path=_SPECTRAL_PATH,
    private_name="_nhm2_seed_tail_pde_bound_spectral",
    dependency="spectral",
)
_join_extraction_module = _execute_private_module(
    source=_read_bound_join_extraction_source(),
    path=_JOIN_EXTRACTION_PATH,
    private_name=_PRIVATE_JOIN_EXTRACTION_MODULE_NAME,
    dependency="join_extraction",
)

FrozenTailCollocation = _tail_collocation_module.FrozenTailCollocation
FrozenL2JoinBarriers = _join_extraction_module.FrozenL2JoinBarriers


@dataclass(frozen=True, slots=True)
class _Dual:
    value: float
    derivatives: tuple[float, ...]


@dataclass(frozen=True, slots=True)
class _RowInvariants:
    R: _Dual
    kappa: _Dual
    a: _Dual
    sigma: _Dual
    H1: _Dual
    Hy1: _Dual
    Q1: _Dual
    Qy1: _Dual


@dataclass(frozen=True, slots=True)
class _PrimalRowInvariants:
    R: float
    kappa: float
    a: float
    sigma: float
    H1: float
    Hy1: float
    Q1: float
    Qy1: float


@dataclass(frozen=True, slots=True)
class _FrozenTailPdeResidual:
    """Private F-only receipt; no derivative or Jacobian field exists."""

    node_count: int
    pde_row_count: int
    residual: tuple[float, ...]
    row_labels: tuple[str, ...]
    tail_state_f64le_sha256: str
    join_barrier_f64le_sha256: str
    tail_node_payload_sha256: str
    residual_only_graph_executed: bool = True
    dual_graph_executed: bool = False
    jacobian_computed: bool = False


@dataclass(frozen=True, slots=True)
class FrozenTailPdeEvaluation:
    node_count: int
    unknown_count: int
    pde_row_count: int
    residual: tuple[float, ...]
    jacobian: tuple[tuple[float, ...], ...]
    unknown_order: str
    row_order: str
    row_labels: tuple[str, ...]
    tail_state_f64le_sha256: str
    join_barrier_f64le_sha256: str
    tail_node_payload_sha256: str
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    binary64_environment_source_sha256: str
    binary64_environment_source_size_bytes: int
    tail_collocation_source_sha256: str
    tail_collocation_source_size_bytes: int
    join_extraction_source_sha256: str
    join_extraction_source_size_bytes: int
    binary64_runtime_family: str
    mpfr_precision_bits: int
    mpfr_rounding_mode: str
    mpfr_emin: int
    mpfr_emax: int
    observed_gmpy2_version: str
    observed_mpfr_version: str
    calculation_implemented: bool = True
    analytic_jacobian_implemented: bool = True
    chebyshev_streaming_implemented: bool = True
    mass_row_implemented: bool = False
    quadrature_implemented: bool = False
    newton_implemented: bool = False
    solve_performed: bool = False
    candidate_execution_authorized: bool = False
    candidate_executed: bool = False
    candidate_output_materialized: bool = False
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
        "massRowImplemented": False,
        "quadratureImplemented": False,
        "newtonImplemented": False,
        "outputPresent": False,
        "outputAccepted": False,
        "seedAccepted": False,
        "branchAccepted": False,
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

_TAIL_FALSE_FIELDS: Final[tuple[str, ...]] = (
    "tail_residual_implemented",
    "solve_performed",
    "candidate_execution_authorized",
    "candidate_executed",
    "replay_authority",
    "independent_agreement",
    "diagnostic_pass_authority",
    "physical_authority",
    "propulsion_authority",
    "transport_authority",
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


def _verify_dependency_bindings() -> None:
    _read_bound_binary64_environment_source()
    _read_bound_tail_collocation_source()
    _read_bound_join_extraction_source()
    _read_bound_spectral_source()
    if any(
        value is not False
        for value in _binary64_environment.AUTHORITY_LOCKS.values()
    ):
        raise TailPdeOperatorError("tail_pde_fenv_authority_lock_invalid")
    if any(
        value is not False
        for value in _tail_collocation_module.AUTHORITY_LOCKS.values()
    ):
        raise TailPdeOperatorError(
            "tail_pde_tail_collocation_module_authority_lock_invalid"
        )
    if any(
        value is not False
        for value in _join_extraction_module.AUTHORITY_LOCKS.values()
    ):
        raise TailPdeOperatorError(
            "tail_pde_join_extraction_module_authority_lock_invalid"
        )
    if any(
        value is not False
        for value in _join_extraction_module._spectral_module.AUTHORITY_LOCKS.values()
    ):
        raise TailPdeOperatorError(
            "tail_pde_join_spectral_module_authority_lock_invalid"
        )
    if any(value is not False for value in _spectral_module.AUTHORITY_LOCKS.values()):
        raise TailPdeOperatorError("tail_pde_spectral_module_authority_lock_invalid")
    if (
        _tail_collocation_module.PRIMARY_NUMERICS_POLICY_SHA256
        != PRIMARY_NUMERICS_POLICY_SHA256
        or _tail_collocation_module.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or _tail_collocation_module.BINARY64_ENVIRONMENT_SOURCE_SHA256
        != BINARY64_ENVIRONMENT_SOURCE_SHA256
        or _tail_collocation_module.BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        != BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
    ):
        raise TailPdeOperatorError("tail_pde_tail_collocation_literal_binding_invalid")
    if (
        _join_extraction_module.PRIMARY_NUMERICS_POLICY_SHA256
        != PRIMARY_NUMERICS_POLICY_SHA256
        or _join_extraction_module.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or _join_extraction_module.SPECTRAL_SOURCE_SHA256
        != SPECTRAL_SOURCE_SHA256
        or _join_extraction_module.SPECTRAL_SOURCE_SIZE_BYTES
        != SPECTRAL_SOURCE_SIZE_BYTES
        or _join_extraction_module.FrozenLobattoSpectralPrimitive
        is not _join_extraction_module._spectral_module.FrozenLobattoSpectralPrimitive
        or _join_extraction_module._spectral_module is _spectral_module
        or _join_extraction_module._spectral_module.PRIMARY_NUMERICS_POLICY_SHA256
        != PRIMARY_NUMERICS_POLICY_SHA256
        or _join_extraction_module._spectral_module.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
    ):
        raise TailPdeOperatorError("tail_pde_join_extraction_literal_binding_invalid")


def _f64_bits(value: float) -> bytes:
    return struct.pack("<d", value)


def _has_exact_frozen_slots(value: object, expected_type: type[object]) -> bool:
    actual_type = type(value)
    return (
        actual_type is expected_type
        or (
            actual_type.__name__ == expected_type.__name__
            and getattr(actual_type, "__slots__", None)
            == getattr(expected_type, "__slots__", None)
            and getattr(actual_type, "__getattribute__", None)
            is object.__getattribute__
            and not hasattr(value, "__dict__")
        )
    )


def _negative_zero(value: float) -> bool:
    return value == 0.0 and _f64_bits(value) == bytes.fromhex(
        "0000000000000080"
    )


def _validate_f64(value: object, detail: str) -> float:
    if type(value) is not float:
        raise TailPdeOperatorError("tail_pde_binary64_type_invalid", detail)
    if not math.isfinite(value):
        raise TailPdeOperatorError("tail_pde_binary64_nonfinite_input", detail)
    if _negative_zero(value):
        raise TailPdeOperatorError("tail_pde_binary64_negative_zero_input", detail)
    return 0.0 if value == 0.0 else value


def _tail_node_payload_sha256(values: tuple[float, ...]) -> str:
    digest = hashlib.sha256(TAIL_NODE_GOLDEN_DOMAIN)
    digest.update(struct.pack("<32d", *values))
    return digest.hexdigest()


def _f64_tuple_sha256(domain: bytes, values: tuple[float, ...]) -> str:
    digest = hashlib.sha256(domain)
    digest.update(struct.pack(f"<{len(values)}d", *values))
    return digest.hexdigest()


def _validate_tail_collocation(value: object) -> tuple[float, ...]:
    if not _has_exact_frozen_slots(value, FrozenTailCollocation):
        raise TailPdeOperatorError(
            "tail_pde_collocation_type_invalid", type(value).__name__
        )
    collocation = value
    if type(collocation.node_count) is not int or collocation.node_count != NODE_COUNT:
        raise TailPdeOperatorError("tail_pde_collocation_node_count_invalid")
    if (
        type(collocation.primary_numerics_policy_sha256) is not str
        or len(collocation.primary_numerics_policy_sha256) != 64
        or collocation.primary_numerics_policy_sha256
        != PRIMARY_NUMERICS_POLICY_SHA256
        or type(collocation.primary_numerics_policy_canonical_size_bytes) is not int
        or collocation.primary_numerics_policy_canonical_size_bytes
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or type(collocation.binary64_environment_source_sha256) is not str
        or len(collocation.binary64_environment_source_sha256) != 64
        or collocation.binary64_environment_source_sha256
        != BINARY64_ENVIRONMENT_SOURCE_SHA256
        or type(collocation.binary64_environment_source_size_bytes) is not int
        or collocation.binary64_environment_source_size_bytes
        != BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        or type(collocation.binary64_runtime_family) is not str
        or collocation.binary64_runtime_family
        != _binary64_environment.BINARY64_RUNTIME_FAMILY
        or type(collocation.mpfr_precision_bits) is not int
        or collocation.mpfr_precision_bits != MPFR_PRECISION_BITS
        or type(collocation.mpfr_rounding_mode) is not str
        or collocation.mpfr_rounding_mode != MPFR_ROUNDING_MODE
        or type(collocation.mpfr_emin) is not int
        or collocation.mpfr_emin != MPFR_EMIN
        or type(collocation.mpfr_emax) is not int
        or collocation.mpfr_emax != MPFR_EMAX
        or type(collocation.observed_gmpy2_version) is not str
        or not 0 < len(collocation.observed_gmpy2_version) <= 128
        or type(collocation.observed_mpfr_version) is not str
        or not 0 < len(collocation.observed_mpfr_version) <= 128
        or collocation.calculation_implemented is not True
    ):
        raise TailPdeOperatorError("tail_pde_collocation_binding_invalid")
    if any(
        getattr(collocation, field, None) is not False
        for field in _TAIL_FALSE_FIELDS
    ):
        raise TailPdeOperatorError("tail_pde_collocation_authority_lock_invalid")
    if type(collocation.y) is not tuple or len(collocation.y) != NODE_COUNT:
        raise TailPdeOperatorError("tail_pde_collocation_shape_invalid")
    nodes = tuple(
        _validate_f64(node, f"collocation.y[{index}]")
        for index, node in enumerate(collocation.y)
    )
    if _f64_bits(nodes[0]) != bytes(8) or nodes[-1] != 1.0:
        raise TailPdeOperatorError("tail_pde_collocation_endpoint_invalid")
    if any(nodes[index] <= nodes[index - 1] for index in range(1, NODE_COUNT)):
        raise TailPdeOperatorError("tail_pde_collocation_order_invalid")
    if _tail_node_payload_sha256(nodes) != TAIL_NODE_GOLDEN_SHA256:
        raise TailPdeOperatorError("tail_pde_collocation_payload_invalid")
    return nodes


def _validate_join_barrier_payload(
    join: object, owner_join_module: ModuleType
) -> tuple[float, float, float, float]:
    if (
        type(join.node_count) is not int
        or join.node_count != 128
        or type(join.join_x) is not int
        or join.join_x != RADIUS
        or type(join.join_rho_exact) is not str
        or join.join_rho_exact != "32/33"
        or type(join.barrier_order) is not tuple
        or len(join.barrier_order) != 4
        or any(type(component) is not str for component in join.barrier_order)
        or join.barrier_order != ("U", "U1", "V", "V1")
        or type(join.primary_numerics_policy_sha256) is not str
        or len(join.primary_numerics_policy_sha256) != 64
        or join.primary_numerics_policy_sha256
        != PRIMARY_NUMERICS_POLICY_SHA256
        or type(join.primary_numerics_policy_canonical_size_bytes) is not int
        or join.primary_numerics_policy_canonical_size_bytes
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or type(join.spectral_source_sha256) is not str
        or len(join.spectral_source_sha256) != 64
        or join.spectral_source_sha256
        != owner_join_module.SPECTRAL_SOURCE_SHA256
        or type(join.spectral_source_size_bytes) is not int
        or join.spectral_source_size_bytes
        != owner_join_module.SPECTRAL_SOURCE_SIZE_BYTES
        or type(join.spectral_payload_sha256) is not str
        or len(join.spectral_payload_sha256) != 64
        or join.spectral_payload_sha256
        != owner_join_module.SPECTRAL_N128_PAYLOAD_SHA256
        or type(join.mpfr_precision_bits) is not int
        or join.mpfr_precision_bits != MPFR_PRECISION_BITS
        or type(join.mpfr_rounding_mode) is not str
        or join.mpfr_rounding_mode != MPFR_ROUNDING_MODE
        or type(join.mpfr_emin) is not int
        or join.mpfr_emin != MPFR_EMIN
        or type(join.mpfr_emax) is not int
        or join.mpfr_emax != MPFR_EMAX
        or type(join.observed_gmpy2_version) is not str
        or not 0 < len(join.observed_gmpy2_version) <= 128
        or type(join.observed_mpfr_version) is not str
        or not 0 < len(join.observed_mpfr_version) <= 128
        or join.calculation_implemented is not True
    ):
        raise TailPdeOperatorError("tail_pde_join_barrier_binding_invalid")
    if any(
        getattr(join, field, None) is not False for field in _JOIN_FALSE_FIELDS
    ):
        raise TailPdeOperatorError("tail_pde_join_barrier_authority_lock_invalid")
    if type(join.barrier_values) is not tuple or len(join.barrier_values) != 4:
        raise TailPdeOperatorError("tail_pde_join_barrier_shape_invalid")
    barriers = tuple(
        _validate_f64(component, f"join.{name}")
        for name, component in zip(
            ("U", "U1", "V", "V1"), join.barrier_values, strict=True
        )
    )
    named = (join.U, join.U1, join.V, join.V1)
    if any(
        type(component) is not float
        or _f64_bits(component) != _f64_bits(barriers[index])
        for index, component in enumerate(named)
    ):
        raise TailPdeOperatorError("tail_pde_join_barrier_named_value_mismatch")
    return barriers  # type: ignore[return-value]


def _validate_join_barriers(value: object) -> tuple[float, float, float, float]:
    if not _has_exact_frozen_slots(value, FrozenL2JoinBarriers):
        raise TailPdeOperatorError(
            "tail_pde_join_barrier_type_invalid", type(value).__name__
        )
    return _validate_join_barrier_payload(value, _join_extraction_module)


def _validate_owned_join_barriers(
    owner_join_module: object, value: object
) -> tuple[float, float, float, float]:
    """Authenticate an exact raw join object owned by a composed module instance."""

    if type(owner_join_module) is not ModuleType:
        raise TailPdeOperatorError("tail_pde_owned_join_module_type_invalid")
    owner = owner_join_module
    try:
        binding_invalid = (
            owner.JOIN_EXTRACTION_VERSION
            != "nhm2_spherical_boson_star_seed_primary_l2_join_extraction/v1"
            or owner.PRIMARY_NUMERICS_POLICY_SHA256
            != PRIMARY_NUMERICS_POLICY_SHA256
            or owner.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
            != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
            or owner.SPECTRAL_SOURCE_SHA256 != SPECTRAL_SOURCE_SHA256
            or owner.SPECTRAL_SOURCE_SIZE_BYTES != SPECTRAL_SOURCE_SIZE_BYTES
            or owner.SPECTRAL_N128_PAYLOAD_SHA256
            != _join_extraction_module.SPECTRAL_N128_PAYLOAD_SHA256
            or Path(owner.__file__).resolve() != _JOIN_EXTRACTION_PATH
            or any(item is not False for item in owner.AUTHORITY_LOCKS.values())
            or any(
                item is not False
                for item in owner._spectral_module.AUTHORITY_LOCKS.values()
            )
            or owner.FrozenLobattoSpectralPrimitive
            is not owner._spectral_module.FrozenLobattoSpectralPrimitive
        )
        owned_type = owner.FrozenL2JoinBarriers
    except (AttributeError, TypeError, ValueError, OSError) as error:
        raise TailPdeOperatorError(
            "tail_pde_owned_join_module_binding_invalid", type(error).__name__
        ) from error
    if binding_invalid:
        raise TailPdeOperatorError("tail_pde_owned_join_module_binding_invalid")
    if type(owned_type) is not type or type(value) is not owned_type:
        raise TailPdeOperatorError(
            "tail_pde_owned_join_barrier_type_invalid", type(value).__name__
        )
    return _validate_join_barrier_payload(value, owner)


def _validate_state(value: object) -> tuple[float, ...]:
    if type(value) is not tuple or len(value) != UNKNOWN_COUNT:
        raise TailPdeOperatorError("tail_pde_state_shape_invalid")
    state = tuple(
        _validate_f64(component, f"state[{index}]")
        for index, component in enumerate(value)
    )
    return state


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
            raise TailPdeOperatorError("tail_pde_mpfr_context_installation_failed")
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
        raise TailPdeOperatorError(
            "tail_pde_mpfr_exceptional_flag", f"{operation}:{','.join(bad)}"
        )


def _finish_mpfr(
    context: gmpy2.context, value: gmpy2.mpfr, operation: str
) -> gmpy2.mpfr:
    _check_mpfr_flags(context, operation)
    if not gmpy2.is_finite(value):
        raise TailPdeOperatorError("tail_pde_mpfr_nonfinite", operation)
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
        raise TailPdeOperatorError("tail_pde_mpfr_set_d_inexact", operation)
    return result


def _mpfr_unary(
    context: gmpy2.context,
    kind: str,
    value: gmpy2.mpfr,
    operation: str,
) -> gmpy2.mpfr:
    context.clear_flags()
    if kind == "sqrt":
        if value < 0:
            raise TailPdeOperatorError("tail_pde_sqrt_domain_invalid", operation)
        result = gmpy2.sqrt(value)
    elif kind == "exp":
        result = gmpy2.exp(value)
    elif kind == "log":
        if value <= 0:
            raise TailPdeOperatorError("tail_pde_log_domain_invalid", operation)
        result = gmpy2.log(value)
    else:
        raise TailPdeOperatorError("tail_pde_mpfr_operation_invalid", kind)
    return _finish_mpfr(context, result, operation)


def _mpfr_get_d(
    context: gmpy2.context, value: gmpy2.mpfr, operation: str
) -> float:
    context.clear_flags()
    result = float(value)
    _check_mpfr_flags(context, operation)
    if not math.isfinite(result):
        raise TailPdeOperatorError("tail_pde_mpfr_get_d_nonfinite", operation)
    result = 0.0 if result == 0.0 else result
    if _negative_zero(result):
        raise TailPdeOperatorError("tail_pde_mpfr_get_d_negative_zero", operation)
    return result


def _cr_alias(
    context: gmpy2.context, kind: str, value: float, operation: str
) -> float:
    operand = _mpfr_set_d(context, value, f"{operation}.set_d")
    result = _mpfr_unary(context, kind, operand, f"{operation}.{kind}")
    return _mpfr_get_d(context, result, f"{operation}.get_d")


def _finish_f64(value: float, operation: str) -> float:
    if not math.isfinite(value):
        raise TailPdeOperatorError("tail_pde_binary64_nonfinite_intermediate", operation)
    return 0.0 if value == 0.0 else value


def _copy(value: float, operation: str) -> float:
    if type(value) is not float:
        raise TailPdeOperatorError("tail_pde_internal_binary64_type_invalid", operation)
    return _finish_f64(value, operation)


def _add(left: float, right: float, operation: str) -> float:
    return _finish_f64(left + right, operation)


def _sub(left: float, right: float, operation: str) -> float:
    return _finish_f64(left - right, operation)


def _mul(left: float, right: float, operation: str) -> float:
    return _finish_f64(left * right, operation)


def _div(numerator: float, denominator: float, operation: str) -> float:
    if denominator == 0.0:
        raise TailPdeOperatorError("tail_pde_binary64_division_by_zero", operation)
    return _finish_f64(numerator / denominator, operation)


def _neg(value: float, operation: str) -> float:
    return _finish_f64(-value, operation)


def _dual_constant(value: float, operation: str) -> _Dual:
    primal = _copy(value, f"{operation}.value")
    derivatives: list[float] = []
    for index in range(UNKNOWN_COUNT):
        derivatives.append(0.0)
    return _Dual(primal, tuple(derivatives))


def _dual_unknown(value: float, unknown_index: int, operation: str) -> _Dual:
    primal = _copy(value, f"{operation}.value")
    derivatives: list[float] = []
    for index in range(UNKNOWN_COUNT):
        derivatives.append(1.0 if index == unknown_index else 0.0)
    return _Dual(primal, tuple(derivatives))


def _dual_add(left: _Dual, right: _Dual, operation: str) -> _Dual:
    primal = _add(left.value, right.value, f"{operation}.value")
    derivatives: list[float] = []
    for index in range(UNKNOWN_COUNT):
        derivatives.append(
            _add(
                left.derivatives[index],
                right.derivatives[index],
                f"{operation}.d[{index}]",
            )
        )
    return _Dual(primal, tuple(derivatives))


def _dual_sub(left: _Dual, right: _Dual, operation: str) -> _Dual:
    primal = _sub(left.value, right.value, f"{operation}.value")
    derivatives: list[float] = []
    for index in range(UNKNOWN_COUNT):
        derivatives.append(
            _sub(
                left.derivatives[index],
                right.derivatives[index],
                f"{operation}.d[{index}]",
            )
        )
    return _Dual(primal, tuple(derivatives))


def _dual_neg(value: _Dual, operation: str) -> _Dual:
    primal = _neg(value.value, f"{operation}.value")
    derivatives: list[float] = []
    for index in range(UNKNOWN_COUNT):
        derivatives.append(
            _neg(value.derivatives[index], f"{operation}.d[{index}]")
        )
    return _Dual(primal, tuple(derivatives))


def _dual_mul(left: _Dual, right: _Dual, operation: str) -> _Dual:
    primal = _mul(left.value, right.value, f"{operation}.value")
    derivatives: list[float] = []
    for index in range(UNKNOWN_COUNT):
        left_term = _mul(
            left.derivatives[index],
            right.value,
            f"{operation}.d[{index}].left",
        )
        right_term = _mul(
            left.value,
            right.derivatives[index],
            f"{operation}.d[{index}].right",
        )
        derivatives.append(
            _add(left_term, right_term, f"{operation}.d[{index}].add")
        )
    return _Dual(primal, tuple(derivatives))


def _dual_div(numerator: _Dual, denominator: _Dual, operation: str) -> _Dual:
    primal = _div(numerator.value, denominator.value, f"{operation}.value")
    denominator_squared = _mul(
        denominator.value,
        denominator.value,
        f"{operation}.denominator_squared",
    )
    derivatives: list[float] = []
    for index in range(UNKNOWN_COUNT):
        left_term = _mul(
            numerator.derivatives[index],
            denominator.value,
            f"{operation}.d[{index}].left",
        )
        right_term = _mul(
            numerator.value,
            denominator.derivatives[index],
            f"{operation}.d[{index}].right",
        )
        derivative_numerator = _sub(
            left_term, right_term, f"{operation}.d[{index}].numerator"
        )
        derivatives.append(
            _div(
                derivative_numerator,
                denominator_squared,
                f"{operation}.d[{index}].divide",
            )
        )
    return _Dual(primal, tuple(derivatives))


def _dual_exp(
    context: gmpy2.context, value: _Dual, operation: str
) -> _Dual:
    primal = _cr_alias(context, "exp", value.value, f"{operation}.value")
    derivatives: list[float] = []
    for index in range(UNKNOWN_COUNT):
        derivatives.append(
            _mul(
                primal,
                value.derivatives[index],
                f"{operation}.d[{index}]",
            )
        )
    return _Dual(primal, tuple(derivatives))


def _dual_log(
    context: gmpy2.context, value: _Dual, operation: str
) -> _Dual:
    primal = _cr_alias(context, "log", value.value, f"{operation}.value")
    derivatives: list[float] = []
    for index in range(UNKNOWN_COUNT):
        derivatives.append(
            _div(
                value.derivatives[index],
                value.value,
                f"{operation}.d[{index}]",
            )
        )
    return _Dual(primal, tuple(derivatives))


def _primal_constant(value: float, operation: str) -> float:
    return _copy(value, f"{operation}.value")


def _primal_unknown(value: float, operation: str) -> float:
    return _copy(value, f"{operation}.value")


def _primal_add(left: float, right: float, operation: str) -> float:
    return _add(left, right, f"{operation}.value")


def _primal_sub(left: float, right: float, operation: str) -> float:
    return _sub(left, right, f"{operation}.value")


def _primal_neg(value: float, operation: str) -> float:
    return _neg(value, f"{operation}.value")


def _primal_mul(left: float, right: float, operation: str) -> float:
    return _mul(left, right, f"{operation}.value")


def _primal_div(numerator: float, denominator: float, operation: str) -> float:
    return _div(numerator, denominator, f"{operation}.value")


def _primal_exp(
    context: gmpy2.context, value: float, operation: str
) -> float:
    return _cr_alias(context, "exp", value, f"{operation}.value")


def _primal_log(
    context: gmpy2.context, value: float, operation: str
) -> float:
    return _cr_alias(context, "log", value, f"{operation}.value")


def _build_primal_row_invariants(
    context: gmpy2.context,
    projected_l2_nu: float,
    state: tuple[float, ...],
    barriers: tuple[float, float, float, float],
) -> _PrimalRowInvariants:
    minus_two_nu = _mul(-2.0, projected_l2_nu, "invariant.minus_two_nu")
    if minus_two_nu <= 0.0:
        raise TailPdeOperatorError("tail_pde_kappa_domain_invalid")
    kappa_value = _cr_alias(context, "sqrt", minus_two_nu, "invariant.kappa")
    if kappa_value <= 0.0:
        raise TailPdeOperatorError("tail_pde_kappa_domain_invalid")
    a_value = _mul(kappa_value, float(RADIUS), "invariant.a")

    R = _primal_constant(float(RADIUS), "invariant.R")
    kappa = _primal_constant(kappa_value, "invariant.kappa_dual")
    a = _primal_constant(a_value, "invariant.a_dual")
    C = _primal_unknown(state[0], "invariant.C")
    one = _primal_constant(1.0, "invariant.one")
    sigma = _primal_sub(
        _primal_div(C, kappa, "invariant.C_over_kappa"),
        one,
        "invariant.sigma",
    )

    U, U1, V, V1 = barriers
    H1 = _primal_constant(U, "invariant.H1")
    negative_a = _primal_neg(a, "invariant.Hy1.negative_a")
    hy_t0 = _primal_add(negative_a, sigma, "invariant.Hy1.t0")
    hy_t1 = _primal_mul(hy_t0, H1, "invariant.Hy1.t1")
    hy_t2 = _primal_mul(
        R, _primal_constant(U1, "invariant.U1"), "invariant.Hy1.t2"
    )
    Hy1 = _primal_sub(hy_t1, hy_t2, "invariant.Hy1")

    c_over_r_q1 = _primal_div(C, R, "invariant.Q1.C_over_R")
    Q1 = _primal_add(
        _primal_constant(V, "invariant.V"), c_over_r_q1, "invariant.Q1"
    )
    negative_two_a = _primal_mul(
        _primal_constant(-2.0, "invariant.Qy1.minus_two"),
        a,
        "invariant.Qy1.negative_two_a",
    )
    two_sigma = _primal_mul(
        _primal_constant(2.0, "invariant.Qy1.two"),
        sigma,
        "invariant.Qy1.two_sigma",
    )
    qy_t0 = _primal_add(negative_two_a, two_sigma, "invariant.Qy1.t0")
    qy_t1 = _primal_mul(qy_t0, Q1, "invariant.Qy1.t1")
    qy_t2 = _primal_div(C, R, "invariant.Qy1.t2_C_over_R")
    qy_t3 = _primal_mul(
        R, _primal_constant(V1, "invariant.V1"), "invariant.Qy1.t3"
    )
    qy_sum = _primal_add(qy_t1, qy_t2, "invariant.Qy1.t1_plus_t2")
    Qy1 = _primal_sub(qy_sum, qy_t3, "invariant.Qy1")
    return _PrimalRowInvariants(R, kappa, a, sigma, H1, Hy1, Q1, Qy1)


def _accumulate_primal_basis_term(
    accumulator: float,
    coefficient: float,
    basis: float,
    operation: str,
) -> float:
    term = _primal_mul(coefficient, basis, f"{operation}.term")
    return _primal_add(accumulator, term, f"{operation}.add")


def _stream_primal_field(
    y: float,
    state: tuple[float, ...],
    coefficient_offset: int,
    G1: float,
    Gy1: float,
    field: str,
) -> tuple[float, float, float]:
    one = _primal_constant(1.0, f"{field}.one")
    two = _primal_constant(2.0, f"{field}.two")
    four = _primal_constant(4.0, f"{field}.four")
    eight = _primal_constant(8.0, f"{field}.eight")
    t = _primal_sub(
        _primal_mul(two, y, f"{field}.t.two_y"), one, f"{field}.t"
    )

    T_previous = one
    Ty_previous = _primal_constant(0.0, f"{field}.Ty[0].zero")
    Tyy_previous = _primal_constant(0.0, f"{field}.Tyy[0].zero")
    T_current = t
    Ty_current = two
    Tyy_current = _primal_constant(0.0, f"{field}.Tyy[1].zero")
    A = _primal_constant(0.0, f"{field}.A.zero")
    Ay = _primal_constant(0.0, f"{field}.Ay.zero")
    Ayy = _primal_constant(0.0, f"{field}.Ayy.zero")

    coefficient = _primal_unknown(
        state[coefficient_offset], f"{field}.coefficient[0]"
    )
    A = _accumulate_primal_basis_term(
        A, coefficient, T_previous, f"{field}.A[0]"
    )
    Ay = _accumulate_primal_basis_term(
        Ay, coefficient, Ty_previous, f"{field}.Ay[0]"
    )
    Ayy = _accumulate_primal_basis_term(
        Ayy, coefficient, Tyy_previous, f"{field}.Ayy[0]"
    )

    coefficient = _primal_unknown(
        state[coefficient_offset + 1], f"{field}.coefficient[1]"
    )
    A = _accumulate_primal_basis_term(
        A, coefficient, T_current, f"{field}.A[1]"
    )
    Ay = _accumulate_primal_basis_term(
        Ay, coefficient, Ty_current, f"{field}.Ay[1]"
    )
    Ayy = _accumulate_primal_basis_term(
        Ayy, coefficient, Tyy_current, f"{field}.Ayy[1]"
    )

    for basis_index in range(2, NODE_COUNT):
        two_t = _primal_mul(two, t, f"{field}.basis[{basis_index}].two_t")
        T_next = _primal_sub(
            _primal_mul(
                two_t, T_current, f"{field}.basis[{basis_index}].T.product"
            ),
            T_previous,
            f"{field}.basis[{basis_index}].T.subtract",
        )
        Ty_next = _primal_sub(
            _primal_add(
                _primal_mul(
                    four,
                    T_current,
                    f"{field}.basis[{basis_index}].Ty.four_T",
                ),
                _primal_mul(
                    two_t,
                    Ty_current,
                    f"{field}.basis[{basis_index}].Ty.two_t_Ty",
                ),
                f"{field}.basis[{basis_index}].Ty.add",
            ),
            Ty_previous,
            f"{field}.basis[{basis_index}].Ty.subtract",
        )
        Tyy_next = _primal_sub(
            _primal_add(
                _primal_mul(
                    eight,
                    Ty_current,
                    f"{field}.basis[{basis_index}].Tyy.eight_Ty",
                ),
                _primal_mul(
                    two_t,
                    Tyy_current,
                    f"{field}.basis[{basis_index}].Tyy.two_t_Tyy",
                ),
                f"{field}.basis[{basis_index}].Tyy.add",
            ),
            Tyy_previous,
            f"{field}.basis[{basis_index}].Tyy.subtract",
        )
        T_previous, T_current = T_current, T_next
        Ty_previous, Ty_current = Ty_current, Ty_next
        Tyy_previous, Tyy_current = Tyy_current, Tyy_next
        coefficient_index = coefficient_offset + basis_index
        coefficient = _primal_unknown(
            state[coefficient_index], f"{field}.coefficient[{basis_index}]"
        )
        A = _accumulate_primal_basis_term(
            A, coefficient, T_current, f"{field}.A[{basis_index}]"
        )
        Ay = _accumulate_primal_basis_term(
            Ay, coefficient, Ty_current, f"{field}.Ay[{basis_index}]"
        )
        Ayy = _accumulate_primal_basis_term(
            Ayy, coefficient, Tyy_current, f"{field}.Ayy[{basis_index}]"
        )

    one_minus_y = _primal_sub(one, y, f"{field}.one_minus_y")
    envelope = _primal_mul(one_minus_y, one_minus_y, f"{field}.envelope")
    envelope_y = _primal_mul(
        _primal_constant(-2.0, f"{field}.minus_two"),
        one_minus_y,
        f"{field}.envelope_y",
    )
    envelope_yy = two
    y_minus_one = _primal_sub(y, one, f"{field}.y_minus_one")
    linear_term = _primal_mul(Gy1, y_minus_one, f"{field}.linear_term")
    linear = _primal_add(G1, linear_term, f"{field}.linear")
    correction = _primal_mul(envelope, A, f"{field}.correction")
    G = _primal_add(linear, correction, f"{field}.value")

    gy_inner = _primal_add(
        _primal_mul(envelope_y, A, f"{field}.derivative.envelope_y_A"),
        _primal_mul(envelope, Ay, f"{field}.derivative.envelope_Ay"),
        f"{field}.derivative.inner",
    )
    Gy = _primal_add(Gy1, gy_inner, f"{field}.derivative")

    two_envelope_y_Ay = _primal_mul(
        two,
        _primal_mul(
            envelope_y,
            Ay,
            f"{field}.second_derivative.envelope_y_Ay",
        ),
        f"{field}.second_derivative.two_envelope_y_Ay",
    )
    gyy_inner = _primal_add(
        two_envelope_y_Ay,
        _primal_mul(
            envelope, Ayy, f"{field}.second_derivative.envelope_Ayy"
        ),
        f"{field}.second_derivative.inner",
    )
    Gyy = _primal_add(
        _primal_mul(
            envelope_yy, A, f"{field}.second_derivative.envelope_yy_A"
        ),
        gyy_inner,
        f"{field}.second_derivative",
    )
    return G, Gy, Gyy


def _exterior_primal_factor(
    context: gmpy2.context,
    y: float,
    invariants: _PrimalRowInvariants,
    row: str,
) -> tuple[float, float, float]:
    if y == 0.0:
        return (
            _primal_constant(0.0, f"{row}.exterior.B.zero"),
            _primal_constant(0.0, f"{row}.exterior.E.zero"),
            _primal_constant(0.0, f"{row}.exterior.E_over_y_squared.zero"),
        )
    x = _primal_div(invariants.R, y, f"{row}.exterior.x")
    x_minus_r = _primal_sub(x, invariants.R, f"{row}.exterior.x_minus_R")
    decay = _primal_neg(
        _primal_mul(
            invariants.kappa,
            x_minus_r,
            f"{row}.exterior.kappa_x_minus_R",
        ),
        f"{row}.exterior.decay",
    )
    x_over_r = _primal_div(x, invariants.R, f"{row}.exterior.x_over_R")
    logarithm = _primal_log(context, x_over_r, f"{row}.exterior.log")
    log_term = _primal_mul(
        invariants.sigma, logarithm, f"{row}.exterior.log_term"
    )
    exponent = _primal_add(decay, log_term, f"{row}.exterior.exponent")
    B = _primal_exp(context, exponent, f"{row}.exterior.B")
    E = _primal_mul(B, B, f"{row}.exterior.E")
    y_squared = _primal_mul(y, y, f"{row}.exterior.y_squared")
    E_over_y_squared = _primal_div(
        E, y_squared, f"{row}.exterior.E_over_y_squared"
    )
    return B, E, E_over_y_squared


def _schrodinger_primal_row(
    y: float,
    H: float,
    Hy: float,
    Hyy: float,
    Q: float,
    E_over_y_squared: float,
    invariants: _PrimalRowInvariants,
    row: str,
) -> float:
    if y == 0.0:
        negative_a_hy = _primal_mul(
            _primal_neg(invariants.a, f"{row}.negative_a"),
            Hy,
            f"{row}.negative_a_Hy",
        )
        sigma_plus_one = _primal_add(
            invariants.sigma,
            _primal_constant(1.0, f"{row}.one"),
            f"{row}.sigma_plus_one",
        )
        sigma_product = _primal_mul(
            invariants.sigma, sigma_plus_one, f"{row}.sigma_product"
        )
        sigma_h = _primal_mul(sigma_product, H, f"{row}.sigma_product_H")
        half_sigma_h = _primal_mul(
            _primal_constant(0.5, f"{row}.half"),
            sigma_h,
            f"{row}.half_sigma_product_H",
        )
        return _primal_sub(negative_a_hy, half_sigma_h, f"{row}.value")

    y_squared = _primal_mul(y, y, f"{row}.t0_y_squared")
    t1 = _primal_mul(y_squared, Hyy, f"{row}.t1")
    sigma_y = _primal_mul(invariants.sigma, y, f"{row}.sigma_y")
    t2 = _primal_sub(invariants.a, sigma_y, f"{row}.t2")
    two_t2 = _primal_mul(
        _primal_constant(2.0, f"{row}.two"), t2, f"{row}.two_t2"
    )
    t3 = _primal_mul(two_t2, Hy, f"{row}.t3")
    sigma_plus_one = _primal_add(
        invariants.sigma,
        _primal_constant(1.0, f"{row}.one"),
        f"{row}.sigma_plus_one",
    )
    sigma_product = _primal_mul(
        invariants.sigma, sigma_plus_one, f"{row}.sigma_product"
    )
    t4 = _primal_mul(sigma_product, H, f"{row}.t4")
    linear = _primal_add(
        _primal_add(t1, t3, f"{row}.linear.t1_plus_t3"),
        t4,
        f"{row}.linear",
    )
    r_squared = _primal_mul(
        invariants.R, invariants.R, f"{row}.R_squared"
    )
    source_scale = _primal_mul(
        r_squared, E_over_y_squared, f"{row}.source_scale"
    )
    q_times_h = _primal_mul(Q, H, f"{row}.Q_times_H")
    source = _primal_mul(source_scale, q_times_h, f"{row}.source")
    negative_half_linear = _primal_mul(
        _primal_constant(-0.5, f"{row}.negative_half"),
        linear,
        f"{row}.negative_half_linear",
    )
    return _primal_add(negative_half_linear, source, f"{row}.value")


def _poisson_primal_row(
    y: float,
    H: float,
    Q: float,
    Qy: float,
    Qyy: float,
    invariants: _PrimalRowInvariants,
    row: str,
) -> float:
    four = _primal_constant(4.0, f"{row}.four")
    if y == 0.0:
        a_squared = _primal_mul(
            invariants.a, invariants.a, f"{row}.a_squared"
        )
        c0 = _primal_mul(four, a_squared, f"{row}.c0")
        leading = _primal_mul(c0, Q, f"{row}.leading")
        r_squared = _primal_mul(
            invariants.R, invariants.R, f"{row}.R_squared"
        )
        h_squared = _primal_mul(H, H, f"{row}.H_squared")
        p3 = _primal_mul(r_squared, h_squared, f"{row}.p3")
        return _primal_sub(leading, p3, f"{row}.value")

    y_squared_left = _primal_mul(y, y, f"{row}.p0.y_squared_left")
    y_squared_right = _primal_mul(y, y, f"{row}.p0.y_squared_right")
    y_fourth = _primal_mul(
        y_squared_left, y_squared_right, f"{row}.p0.y_fourth"
    )
    p0 = _primal_mul(y_fourth, Qyy, f"{row}.p0")

    p1_y_squared = _primal_mul(y, y, f"{row}.p1.y_squared")
    four_y_squared = _primal_mul(
        four, p1_y_squared, f"{row}.p1.four_y_squared"
    )
    sigma_y = _primal_mul(invariants.sigma, y, f"{row}.p1.sigma_y")
    a_minus_sigma_y = _primal_sub(
        invariants.a, sigma_y, f"{row}.p1.a_minus_sigma_y"
    )
    p1_prefix = _primal_mul(
        four_y_squared, a_minus_sigma_y, f"{row}.p1.prefix"
    )
    p1 = _primal_mul(p1_prefix, Qy, f"{row}.p1")

    a_squared = _primal_mul(invariants.a, invariants.a, f"{row}.a_squared")
    c0 = _primal_mul(four, a_squared, f"{row}.c0")
    four_a = _primal_mul(four, invariants.a, f"{row}.c1.four_a")
    two_sigma_c1 = _primal_mul(
        _primal_constant(2.0, f"{row}.c1.two"),
        invariants.sigma,
        f"{row}.c1.two_sigma",
    )
    two_sigma_plus_one_c1 = _primal_add(
        two_sigma_c1,
        _primal_constant(1.0, f"{row}.c1.one"),
        f"{row}.c1.two_sigma_plus_one",
    )
    c1 = _primal_mul(four_a, two_sigma_plus_one_c1, f"{row}.c1")

    two_sigma_c2 = _primal_mul(
        _primal_constant(2.0, f"{row}.c2.two"),
        invariants.sigma,
        f"{row}.c2.two_sigma",
    )
    two_sigma_plus_one_c2 = _primal_add(
        two_sigma_c2,
        _primal_constant(1.0, f"{row}.c2.one"),
        f"{row}.c2.two_sigma_plus_one",
    )
    c2 = _primal_mul(two_sigma_c2, two_sigma_plus_one_c2, f"{row}.c2")
    c1_y = _primal_mul(c1, y, f"{row}.coefficient.c1_y")
    c0_minus_c1_y = _primal_sub(
        c0, c1_y, f"{row}.coefficient.subtract"
    )
    coefficient_y_squared = _primal_mul(
        y, y, f"{row}.coefficient.y_squared"
    )
    c2_y_squared = _primal_mul(
        c2, coefficient_y_squared, f"{row}.coefficient.c2_y_squared"
    )
    coefficient = _primal_add(
        c0_minus_c1_y, c2_y_squared, f"{row}.coefficient"
    )
    p2 = _primal_mul(coefficient, Q, f"{row}.p2")
    r_squared = _primal_mul(invariants.R, invariants.R, f"{row}.R_squared")
    h_squared = _primal_mul(H, H, f"{row}.H_squared")
    p3 = _primal_mul(r_squared, h_squared, f"{row}.p3")
    return _primal_sub(
        _primal_add(
            _primal_add(p0, p1, f"{row}.p0_plus_p1"),
            p2,
            f"{row}.p0_plus_p1_plus_p2",
        ),
        p3,
        f"{row}.value",
    )


def _evaluate_primal_pde_row(
    context: gmpy2.context,
    row_kind: str,
    node_index: int,
    node: float,
    state: tuple[float, ...],
    invariants: _PrimalRowInvariants,
) -> float:
    row = f"{row_kind}[{node_index}]"
    y = _primal_constant(node, f"{row}.y")
    H, Hy, Hyy = _stream_primal_field(
        y, state, 1, invariants.H1, invariants.Hy1, f"{row}.H"
    )
    Q, Qy, Qyy = _stream_primal_field(
        y, state, 33, invariants.Q1, invariants.Qy1, f"{row}.Q"
    )
    _, _, E_over_y_squared = _exterior_primal_factor(
        context, y, invariants, row
    )
    if row_kind == "S":
        return _schrodinger_primal_row(
            y,
            H,
            Hy,
            Hyy,
            Q,
            E_over_y_squared,
            invariants,
            row,
        )
    if row_kind == "P":
        return _poisson_primal_row(y, H, Q, Qy, Qyy, invariants, row)
    raise TailPdeOperatorError("tail_pde_internal_row_kind_invalid", row_kind)


def _build_row_invariants(
    context: gmpy2.context,
    projected_l2_nu: float,
    state: tuple[float, ...],
    barriers: tuple[float, float, float, float],
) -> _RowInvariants:
    minus_two_nu = _mul(-2.0, projected_l2_nu, "invariant.minus_two_nu")
    if minus_two_nu <= 0.0:
        raise TailPdeOperatorError("tail_pde_kappa_domain_invalid")
    kappa_value = _cr_alias(context, "sqrt", minus_two_nu, "invariant.kappa")
    if kappa_value <= 0.0:
        raise TailPdeOperatorError("tail_pde_kappa_domain_invalid")
    a_value = _mul(kappa_value, float(RADIUS), "invariant.a")

    R = _dual_constant(float(RADIUS), "invariant.R")
    kappa = _dual_constant(kappa_value, "invariant.kappa_dual")
    a = _dual_constant(a_value, "invariant.a_dual")
    C = _dual_unknown(state[0], 0, "invariant.C")
    one = _dual_constant(1.0, "invariant.one")
    sigma = _dual_sub(
        _dual_div(C, kappa, "invariant.C_over_kappa"),
        one,
        "invariant.sigma",
    )

    U, U1, V, V1 = barriers
    H1 = _dual_constant(U, "invariant.H1")
    negative_a = _dual_neg(a, "invariant.Hy1.negative_a")
    hy_t0 = _dual_add(negative_a, sigma, "invariant.Hy1.t0")
    hy_t1 = _dual_mul(hy_t0, H1, "invariant.Hy1.t1")
    hy_t2 = _dual_mul(
        R,
        _dual_constant(U1, "invariant.U1"),
        "invariant.Hy1.t2",
    )
    Hy1 = _dual_sub(hy_t1, hy_t2, "invariant.Hy1")

    c_over_r_q1 = _dual_div(C, R, "invariant.Q1.C_over_R")
    Q1 = _dual_add(
        _dual_constant(V, "invariant.V"), c_over_r_q1, "invariant.Q1"
    )
    negative_two_a = _dual_mul(
        _dual_constant(-2.0, "invariant.Qy1.minus_two"),
        a,
        "invariant.Qy1.negative_two_a",
    )
    two_sigma = _dual_mul(
        _dual_constant(2.0, "invariant.Qy1.two"),
        sigma,
        "invariant.Qy1.two_sigma",
    )
    qy_t0 = _dual_add(negative_two_a, two_sigma, "invariant.Qy1.t0")
    qy_t1 = _dual_mul(qy_t0, Q1, "invariant.Qy1.t1")
    qy_t2 = _dual_div(C, R, "invariant.Qy1.t2_C_over_R")
    qy_t3 = _dual_mul(
        R,
        _dual_constant(V1, "invariant.V1"),
        "invariant.Qy1.t3",
    )
    qy_sum = _dual_add(qy_t1, qy_t2, "invariant.Qy1.t1_plus_t2")
    Qy1 = _dual_sub(qy_sum, qy_t3, "invariant.Qy1")
    return _RowInvariants(R, kappa, a, sigma, H1, Hy1, Q1, Qy1)


def _accumulate_basis_term(
    accumulator: _Dual,
    coefficient: _Dual,
    basis: _Dual,
    operation: str,
) -> _Dual:
    term = _dual_mul(coefficient, basis, f"{operation}.term")
    return _dual_add(accumulator, term, f"{operation}.add")


def _stream_field(
    y: _Dual,
    state: tuple[float, ...],
    coefficient_offset: int,
    G1: _Dual,
    Gy1: _Dual,
    field: str,
) -> tuple[_Dual, _Dual, _Dual]:
    one = _dual_constant(1.0, f"{field}.one")
    two = _dual_constant(2.0, f"{field}.two")
    four = _dual_constant(4.0, f"{field}.four")
    eight = _dual_constant(8.0, f"{field}.eight")
    t = _dual_sub(_dual_mul(two, y, f"{field}.t.two_y"), one, f"{field}.t")

    T_previous = one
    Ty_previous = _dual_constant(0.0, f"{field}.Ty[0].zero")
    Tyy_previous = _dual_constant(0.0, f"{field}.Tyy[0].zero")
    T_current = t
    Ty_current = two
    Tyy_current = _dual_constant(0.0, f"{field}.Tyy[1].zero")
    A = _dual_constant(0.0, f"{field}.A.zero")
    Ay = _dual_constant(0.0, f"{field}.Ay.zero")
    Ayy = _dual_constant(0.0, f"{field}.Ayy.zero")

    coefficient = _dual_unknown(
        state[coefficient_offset], coefficient_offset, f"{field}.coefficient[0]"
    )
    A = _accumulate_basis_term(A, coefficient, T_previous, f"{field}.A[0]")
    Ay = _accumulate_basis_term(Ay, coefficient, Ty_previous, f"{field}.Ay[0]")
    Ayy = _accumulate_basis_term(
        Ayy, coefficient, Tyy_previous, f"{field}.Ayy[0]"
    )

    coefficient = _dual_unknown(
        state[coefficient_offset + 1],
        coefficient_offset + 1,
        f"{field}.coefficient[1]",
    )
    A = _accumulate_basis_term(A, coefficient, T_current, f"{field}.A[1]")
    Ay = _accumulate_basis_term(Ay, coefficient, Ty_current, f"{field}.Ay[1]")
    Ayy = _accumulate_basis_term(
        Ayy, coefficient, Tyy_current, f"{field}.Ayy[1]"
    )

    for basis_index in range(2, NODE_COUNT):
        two_t = _dual_mul(two, t, f"{field}.basis[{basis_index}].two_t")
        T_next = _dual_sub(
            _dual_mul(
                two_t, T_current, f"{field}.basis[{basis_index}].T.product"
            ),
            T_previous,
            f"{field}.basis[{basis_index}].T.subtract",
        )
        Ty_next = _dual_sub(
            _dual_add(
                _dual_mul(
                    four,
                    T_current,
                    f"{field}.basis[{basis_index}].Ty.four_T",
                ),
                _dual_mul(
                    two_t,
                    Ty_current,
                    f"{field}.basis[{basis_index}].Ty.two_t_Ty",
                ),
                f"{field}.basis[{basis_index}].Ty.add",
            ),
            Ty_previous,
            f"{field}.basis[{basis_index}].Ty.subtract",
        )
        Tyy_next = _dual_sub(
            _dual_add(
                _dual_mul(
                    eight,
                    Ty_current,
                    f"{field}.basis[{basis_index}].Tyy.eight_Ty",
                ),
                _dual_mul(
                    two_t,
                    Tyy_current,
                    f"{field}.basis[{basis_index}].Tyy.two_t_Tyy",
                ),
                f"{field}.basis[{basis_index}].Tyy.add",
            ),
            Tyy_previous,
            f"{field}.basis[{basis_index}].Tyy.subtract",
        )
        T_previous, T_current = T_current, T_next
        Ty_previous, Ty_current = Ty_current, Ty_next
        Tyy_previous, Tyy_current = Tyy_current, Tyy_next
        coefficient_index = coefficient_offset + basis_index
        coefficient = _dual_unknown(
            state[coefficient_index],
            coefficient_index,
            f"{field}.coefficient[{basis_index}]",
        )
        A = _accumulate_basis_term(
            A, coefficient, T_current, f"{field}.A[{basis_index}]"
        )
        Ay = _accumulate_basis_term(
            Ay, coefficient, Ty_current, f"{field}.Ay[{basis_index}]"
        )
        Ayy = _accumulate_basis_term(
            Ayy, coefficient, Tyy_current, f"{field}.Ayy[{basis_index}]"
        )

    one_minus_y = _dual_sub(one, y, f"{field}.one_minus_y")
    envelope = _dual_mul(one_minus_y, one_minus_y, f"{field}.envelope")
    envelope_y = _dual_mul(
        _dual_constant(-2.0, f"{field}.minus_two"),
        one_minus_y,
        f"{field}.envelope_y",
    )
    envelope_yy = two
    y_minus_one = _dual_sub(y, one, f"{field}.y_minus_one")
    linear_term = _dual_mul(Gy1, y_minus_one, f"{field}.linear_term")
    linear = _dual_add(G1, linear_term, f"{field}.linear")
    correction = _dual_mul(envelope, A, f"{field}.correction")
    G = _dual_add(linear, correction, f"{field}.value")

    gy_inner = _dual_add(
        _dual_mul(envelope_y, A, f"{field}.derivative.envelope_y_A"),
        _dual_mul(envelope, Ay, f"{field}.derivative.envelope_Ay"),
        f"{field}.derivative.inner",
    )
    Gy = _dual_add(Gy1, gy_inner, f"{field}.derivative")

    two_envelope_y_Ay = _dual_mul(
        two,
        _dual_mul(
            envelope_y,
            Ay,
            f"{field}.second_derivative.envelope_y_Ay",
        ),
        f"{field}.second_derivative.two_envelope_y_Ay",
    )
    gyy_inner = _dual_add(
        two_envelope_y_Ay,
        _dual_mul(
            envelope,
            Ayy,
            f"{field}.second_derivative.envelope_Ayy",
        ),
        f"{field}.second_derivative.inner",
    )
    Gyy = _dual_add(
        _dual_mul(
            envelope_yy,
            A,
            f"{field}.second_derivative.envelope_yy_A",
        ),
        gyy_inner,
        f"{field}.second_derivative",
    )
    return G, Gy, Gyy


def _exterior_factor(
    context: gmpy2.context,
    y: _Dual,
    invariants: _RowInvariants,
    row: str,
) -> tuple[_Dual, _Dual, _Dual]:
    if y.value == 0.0:
        return (
            _dual_constant(0.0, f"{row}.exterior.B.zero"),
            _dual_constant(0.0, f"{row}.exterior.E.zero"),
            _dual_constant(0.0, f"{row}.exterior.E_over_y_squared.zero"),
        )
    x = _dual_div(invariants.R, y, f"{row}.exterior.x")
    x_minus_r = _dual_sub(x, invariants.R, f"{row}.exterior.x_minus_R")
    decay = _dual_neg(
        _dual_mul(
            invariants.kappa,
            x_minus_r,
            f"{row}.exterior.kappa_x_minus_R",
        ),
        f"{row}.exterior.decay",
    )
    x_over_r = _dual_div(x, invariants.R, f"{row}.exterior.x_over_R")
    logarithm = _dual_log(context, x_over_r, f"{row}.exterior.log")
    log_term = _dual_mul(
        invariants.sigma, logarithm, f"{row}.exterior.log_term"
    )
    exponent = _dual_add(decay, log_term, f"{row}.exterior.exponent")
    B = _dual_exp(context, exponent, f"{row}.exterior.B")
    E = _dual_mul(B, B, f"{row}.exterior.E")
    y_squared = _dual_mul(y, y, f"{row}.exterior.y_squared")
    E_over_y_squared = _dual_div(
        E, y_squared, f"{row}.exterior.E_over_y_squared"
    )
    return B, E, E_over_y_squared


def _schrodinger_row(
    y: _Dual,
    H: _Dual,
    Hy: _Dual,
    Hyy: _Dual,
    Q: _Dual,
    E_over_y_squared: _Dual,
    invariants: _RowInvariants,
    row: str,
) -> _Dual:
    if y.value == 0.0:
        negative_a_hy = _dual_mul(
            _dual_neg(invariants.a, f"{row}.negative_a"),
            Hy,
            f"{row}.negative_a_Hy",
        )
        sigma_plus_one = _dual_add(
            invariants.sigma,
            _dual_constant(1.0, f"{row}.one"),
            f"{row}.sigma_plus_one",
        )
        sigma_product = _dual_mul(
            invariants.sigma, sigma_plus_one, f"{row}.sigma_product"
        )
        sigma_h = _dual_mul(sigma_product, H, f"{row}.sigma_product_H")
        half_sigma_h = _dual_mul(
            _dual_constant(0.5, f"{row}.half"),
            sigma_h,
            f"{row}.half_sigma_product_H",
        )
        return _dual_sub(negative_a_hy, half_sigma_h, f"{row}.value")

    y_squared = _dual_mul(y, y, f"{row}.t0_y_squared")
    t1 = _dual_mul(y_squared, Hyy, f"{row}.t1")
    sigma_y = _dual_mul(invariants.sigma, y, f"{row}.sigma_y")
    t2 = _dual_sub(invariants.a, sigma_y, f"{row}.t2")
    two_t2 = _dual_mul(
        _dual_constant(2.0, f"{row}.two"), t2, f"{row}.two_t2"
    )
    t3 = _dual_mul(two_t2, Hy, f"{row}.t3")
    sigma_plus_one = _dual_add(
        invariants.sigma,
        _dual_constant(1.0, f"{row}.one"),
        f"{row}.sigma_plus_one",
    )
    sigma_product = _dual_mul(
        invariants.sigma, sigma_plus_one, f"{row}.sigma_product"
    )
    t4 = _dual_mul(sigma_product, H, f"{row}.t4")
    linear = _dual_add(
        _dual_add(t1, t3, f"{row}.linear.t1_plus_t3"),
        t4,
        f"{row}.linear",
    )
    r_squared = _dual_mul(invariants.R, invariants.R, f"{row}.R_squared")
    source_scale = _dual_mul(
        r_squared, E_over_y_squared, f"{row}.source_scale"
    )
    q_times_h = _dual_mul(Q, H, f"{row}.Q_times_H")
    source = _dual_mul(source_scale, q_times_h, f"{row}.source")
    negative_half_linear = _dual_mul(
        _dual_constant(-0.5, f"{row}.negative_half"),
        linear,
        f"{row}.negative_half_linear",
    )
    return _dual_add(negative_half_linear, source, f"{row}.value")


def _poisson_row(
    y: _Dual,
    H: _Dual,
    Q: _Dual,
    Qy: _Dual,
    Qyy: _Dual,
    invariants: _RowInvariants,
    row: str,
) -> _Dual:
    four = _dual_constant(4.0, f"{row}.four")
    if y.value == 0.0:
        a_squared = _dual_mul(invariants.a, invariants.a, f"{row}.a_squared")
        c0 = _dual_mul(four, a_squared, f"{row}.c0")
        leading = _dual_mul(c0, Q, f"{row}.leading")
        r_squared = _dual_mul(invariants.R, invariants.R, f"{row}.R_squared")
        h_squared = _dual_mul(H, H, f"{row}.H_squared")
        p3 = _dual_mul(r_squared, h_squared, f"{row}.p3")
        return _dual_sub(leading, p3, f"{row}.value")

    y_squared_left = _dual_mul(y, y, f"{row}.p0.y_squared_left")
    y_squared_right = _dual_mul(y, y, f"{row}.p0.y_squared_right")
    y_fourth = _dual_mul(
        y_squared_left, y_squared_right, f"{row}.p0.y_fourth"
    )
    p0 = _dual_mul(y_fourth, Qyy, f"{row}.p0")

    p1_y_squared = _dual_mul(y, y, f"{row}.p1.y_squared")
    four_y_squared = _dual_mul(four, p1_y_squared, f"{row}.p1.four_y_squared")
    sigma_y = _dual_mul(invariants.sigma, y, f"{row}.p1.sigma_y")
    a_minus_sigma_y = _dual_sub(
        invariants.a, sigma_y, f"{row}.p1.a_minus_sigma_y"
    )
    p1_prefix = _dual_mul(
        four_y_squared, a_minus_sigma_y, f"{row}.p1.prefix"
    )
    p1 = _dual_mul(p1_prefix, Qy, f"{row}.p1")

    a_squared = _dual_mul(invariants.a, invariants.a, f"{row}.a_squared")
    c0 = _dual_mul(four, a_squared, f"{row}.c0")
    four_a = _dual_mul(four, invariants.a, f"{row}.c1.four_a")
    two_sigma_c1 = _dual_mul(
        _dual_constant(2.0, f"{row}.c1.two"),
        invariants.sigma,
        f"{row}.c1.two_sigma",
    )
    two_sigma_plus_one_c1 = _dual_add(
        two_sigma_c1,
        _dual_constant(1.0, f"{row}.c1.one"),
        f"{row}.c1.two_sigma_plus_one",
    )
    c1 = _dual_mul(four_a, two_sigma_plus_one_c1, f"{row}.c1")

    two_sigma_c2 = _dual_mul(
        _dual_constant(2.0, f"{row}.c2.two"),
        invariants.sigma,
        f"{row}.c2.two_sigma",
    )
    two_sigma_plus_one_c2 = _dual_add(
        two_sigma_c2,
        _dual_constant(1.0, f"{row}.c2.one"),
        f"{row}.c2.two_sigma_plus_one",
    )
    c2 = _dual_mul(two_sigma_c2, two_sigma_plus_one_c2, f"{row}.c2")
    c1_y = _dual_mul(c1, y, f"{row}.coefficient.c1_y")
    c0_minus_c1_y = _dual_sub(c0, c1_y, f"{row}.coefficient.subtract")
    coefficient_y_squared = _dual_mul(
        y, y, f"{row}.coefficient.y_squared"
    )
    c2_y_squared = _dual_mul(
        c2, coefficient_y_squared, f"{row}.coefficient.c2_y_squared"
    )
    coefficient = _dual_add(
        c0_minus_c1_y, c2_y_squared, f"{row}.coefficient"
    )
    p2 = _dual_mul(coefficient, Q, f"{row}.p2")
    r_squared = _dual_mul(invariants.R, invariants.R, f"{row}.R_squared")
    h_squared = _dual_mul(H, H, f"{row}.H_squared")
    p3 = _dual_mul(r_squared, h_squared, f"{row}.p3")
    return _dual_sub(
        _dual_add(
            _dual_add(p0, p1, f"{row}.p0_plus_p1"),
            p2,
            f"{row}.p0_plus_p1_plus_p2",
        ),
        p3,
        f"{row}.value",
    )


def _evaluate_pde_row(
    context: gmpy2.context,
    row_kind: str,
    node_index: int,
    node: float,
    state: tuple[float, ...],
    invariants: _RowInvariants,
) -> _Dual:
    row = f"{row_kind}[{node_index}]"
    y = _dual_constant(node, f"{row}.y")
    H, Hy, Hyy = _stream_field(
        y, state, 1, invariants.H1, invariants.Hy1, f"{row}.H"
    )
    Q, Qy, Qyy = _stream_field(
        y, state, 33, invariants.Q1, invariants.Qy1, f"{row}.Q"
    )
    _, _, E_over_y_squared = _exterior_factor(context, y, invariants, row)
    if row_kind == "S":
        return _schrodinger_row(
            y,
            H,
            Hy,
            Hyy,
            Q,
            E_over_y_squared,
            invariants,
            row,
        )
    if row_kind == "P":
        return _poisson_row(y, H, Q, Qy, Qyy, invariants, row)
    raise TailPdeOperatorError("tail_pde_internal_row_kind_invalid", row_kind)


def _evaluate_tail_pde_residual_only(
    collocation: FrozenTailCollocation,
    join_barriers: FrozenL2JoinBarriers,
    projected_l2_nu: float,
    state: tuple[float, ...],
    *,
    _owned_join_module: object = None,
) -> _FrozenTailPdeResidual:
    """Evaluate the 64 non-mass residual rows without any dual/J graph."""

    _verify_dependency_bindings()
    with _binary64_environment.nearest_binary64_environment():
        with _owned_mpfr256_context() as context:
            nodes = _validate_tail_collocation(collocation)
            selected_state = _validate_state(state)
            nu = _validate_f64(projected_l2_nu, "projected_l2_nu")
            if nu >= 0.0:
                raise TailPdeOperatorError("tail_pde_nu_domain_invalid")
            barriers = (
                _validate_join_barriers(join_barriers)
                if _owned_join_module is None
                else _validate_owned_join_barriers(
                    _owned_join_module, join_barriers
                )
            )
            invariants = _build_primal_row_invariants(
                context, nu, selected_state, barriers
            )
            residual: list[float] = []
            labels: list[str] = []
            for row_kind in ("S", "P"):
                for node_index, node in enumerate(nodes):
                    residual.append(
                        _evaluate_primal_pde_row(
                            context,
                            row_kind,
                            node_index,
                            node,
                            selected_state,
                            invariants,
                        )
                    )
                    labels.append(f"{row_kind}[{node_index}]")

    frozen_residual = tuple(residual)
    if (
        len(frozen_residual) != PDE_ROW_COUNT
        or any(
            not math.isfinite(value) or _negative_zero(value)
            for value in frozen_residual
        )
    ):
        raise TailPdeOperatorError("tail_pde_residual_only_result_invalid")
    return _FrozenTailPdeResidual(
        node_count=NODE_COUNT,
        pde_row_count=PDE_ROW_COUNT,
        residual=frozen_residual,
        row_labels=tuple(labels),
        tail_state_f64le_sha256=_f64_tuple_sha256(
            TAIL_STATE_HASH_DOMAIN, selected_state
        ),
        join_barrier_f64le_sha256=_f64_tuple_sha256(
            JOIN_BARRIER_HASH_DOMAIN, barriers
        ),
        tail_node_payload_sha256=TAIL_NODE_GOLDEN_SHA256,
    )


def _evaluate_tail_pde_operator_graph(
    collocation: FrozenTailCollocation,
    join_barriers: FrozenL2JoinBarriers,
    projected_l2_nu: float,
    state: tuple[float, ...],
    *,
    _owned_join_module: object = None,
) -> FrozenTailPdeEvaluation:
    """Evaluate the 64 non-mass rows and their 64-by-65 analytic Jacobian."""

    _verify_dependency_bindings()
    with _binary64_environment.nearest_binary64_environment():
        with _owned_mpfr256_context() as context:
            nodes = _validate_tail_collocation(collocation)
            selected_state = _validate_state(state)
            nu = _validate_f64(projected_l2_nu, "projected_l2_nu")
            if nu >= 0.0:
                raise TailPdeOperatorError("tail_pde_nu_domain_invalid")
            barriers = (
                _validate_join_barriers(join_barriers)
                if _owned_join_module is None
                else _validate_owned_join_barriers(
                    _owned_join_module, join_barriers
                )
            )
            invariants = _build_row_invariants(
                context, nu, selected_state, barriers
            )
            residual: list[float] = []
            jacobian: list[tuple[float, ...]] = []
            labels: list[str] = []
            for row_kind in ("S", "P"):
                for node_index, node in enumerate(nodes):
                    row = _evaluate_pde_row(
                        context,
                        row_kind,
                        node_index,
                        node,
                        selected_state,
                        invariants,
                    )
                    if len(row.derivatives) != UNKNOWN_COUNT:
                        raise TailPdeOperatorError(
                            "tail_pde_internal_derivative_shape_invalid",
                            f"{row_kind}[{node_index}]",
                        )
                    residual.append(row.value)
                    jacobian.append(row.derivatives)
                    labels.append(f"{row_kind}[{node_index}]")

    frozen_residual = tuple(residual)
    frozen_jacobian = tuple(jacobian)
    if (
        len(frozen_residual) != PDE_ROW_COUNT
        or len(frozen_jacobian) != PDE_ROW_COUNT
        or any(len(row) != UNKNOWN_COUNT for row in frozen_jacobian)
        or any(
            not math.isfinite(value) or _negative_zero(value)
            for value in frozen_residual
        )
        or any(
            not math.isfinite(value) or _negative_zero(value)
            for row in frozen_jacobian
            for value in row
        )
    ):
        raise TailPdeOperatorError("tail_pde_result_invariant_invalid")
    return FrozenTailPdeEvaluation(
        node_count=NODE_COUNT,
        unknown_count=UNKNOWN_COUNT,
        pde_row_count=PDE_ROW_COUNT,
        residual=frozen_residual,
        jacobian=frozen_jacobian,
        unknown_order=UNKNOWN_ORDER,
        row_order=ROW_ORDER,
        row_labels=tuple(labels),
        tail_state_f64le_sha256=_f64_tuple_sha256(
            TAIL_STATE_HASH_DOMAIN, selected_state
        ),
        join_barrier_f64le_sha256=_f64_tuple_sha256(
            JOIN_BARRIER_HASH_DOMAIN, barriers
        ),
        tail_node_payload_sha256=TAIL_NODE_GOLDEN_SHA256,
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
        tail_collocation_source_sha256=TAIL_COLLOCATION_SOURCE_SHA256,
        tail_collocation_source_size_bytes=TAIL_COLLOCATION_SOURCE_SIZE_BYTES,
        join_extraction_source_sha256=JOIN_EXTRACTION_SOURCE_SHA256,
        join_extraction_source_size_bytes=JOIN_EXTRACTION_SOURCE_SIZE_BYTES,
        binary64_runtime_family=_binary64_environment.BINARY64_RUNTIME_FAMILY,
        mpfr_precision_bits=MPFR_PRECISION_BITS,
        mpfr_rounding_mode=MPFR_ROUNDING_MODE,
        mpfr_emin=MPFR_EMIN,
        mpfr_emax=MPFR_EMAX,
        observed_gmpy2_version=gmpy2.version(),
        observed_mpfr_version=gmpy2.mpfr_version(),
    )


def _evaluate_tail_pde_operator_from_owned_join(
    *,
    owner_join_module: object,
    collocation: FrozenTailCollocation,
    join_barriers: object,
    projected_l2_nu: float,
    state: tuple[float, ...],
) -> FrozenTailPdeEvaluation:
    """Private full-F/J graph over the exact composed owner's raw join object."""

    return _evaluate_tail_pde_operator_graph(
        collocation,
        join_barriers,
        projected_l2_nu,
        state,
        _owned_join_module=owner_join_module,
    )


def _evaluate_tail_pde_residual_from_owned_join(
    *,
    owner_join_module: object,
    collocation: FrozenTailCollocation,
    join_barriers: object,
    projected_l2_nu: float,
    state: tuple[float, ...],
) -> _FrozenTailPdeResidual:
    """Private F-only graph over the exact composed owner's raw join object."""

    return _evaluate_tail_pde_residual_only(
        collocation,
        join_barriers,
        projected_l2_nu,
        state,
        _owned_join_module=owner_join_module,
    )


def evaluate_tail_pde_operator(
    collocation: FrozenTailCollocation,
    join_barriers: FrozenL2JoinBarriers,
    projected_l2_nu: float,
    state: tuple[float, ...],
) -> FrozenTailPdeEvaluation:
    """Evaluate the public diagnostic against this module's exact join type."""

    return _evaluate_tail_pde_operator_graph(
        collocation, join_barriers, projected_l2_nu, state
    )


if (
    (RADIUS, NODE_COUNT, UNKNOWN_COUNT, PDE_ROW_COUNT) != (32, 32, 65, 64)
    or MPFR_PRECISION_BITS != 256
    or MPFR_EMIN != -1_000_000
    or MPFR_EMAX != 1_000_000
    or JOIN_EXTRACTION_SOURCE_SHA256
    != "d2b86dffeaa9e56aabed044f688d89c6b282600b435aa8b3491ce51ca07d7d6b"
    or JOIN_EXTRACTION_SOURCE_SIZE_BYTES != 26_780
    or _PRIVATE_JOIN_EXTRACTION_MODULE_NAME
    != "_nhm2_seed_tail_pde_join_d2b86dffeaa9e56a"
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("spherical_seed_primary_tail_pde_operator_invariant")


__all__ = [
    "AUTHORITY_LOCKS",
    "BINARY64_ENVIRONMENT_SOURCE_SHA256",
    "BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES",
    "C1_LIFT_OPERATION_GRAPH",
    "CHEBYSHEV_STREAMING_GRAPH",
    "DUAL_COMPONENT_OPERATION_GRAPH",
    "FrozenTailPdeEvaluation",
    "JOIN_EXTRACTION_SOURCE_SHA256",
    "JOIN_EXTRACTION_SOURCE_SIZE_BYTES",
    "MPFR_EMAX",
    "MPFR_EMIN",
    "MPFR_PRECISION_BITS",
    "MPFR_ROUNDING_MODE",
    "NODE_COUNT",
    "PDE_ROW_COUNT",
    "PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES",
    "PRIMARY_NUMERICS_POLICY_SHA256",
    "RADIUS",
    "ROW_EVALUATION_GRAPH",
    "ROW_ORDER",
    "TAIL_COLLOCATION_SOURCE_SHA256",
    "TAIL_COLLOCATION_SOURCE_SIZE_BYTES",
    "TAIL_NODE_GOLDEN_SHA256",
    "TAIL_PDE_OPERATOR_VERSION",
    "TailPdeOperatorError",
    "UNKNOWN_COUNT",
    "UNKNOWN_ORDER",
    "evaluate_tail_pde_operator",
]
