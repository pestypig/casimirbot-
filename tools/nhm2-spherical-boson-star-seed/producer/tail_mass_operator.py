"""Synthetic-first MPFR256 dual diagnostic for the spherical tail mass row.

The frozen source graph is the policy's GL256 composite quadrature over 4096
fixed cells on ``y in [0,1]`` with unknown order
``[C,h[0..31],q[0..31]]``.  Tests execute only the first bounded number of
cells of that *same* 4096-cell partition.  They do not replace the partition,
and therefore produce an explicitly partial diagnostic rather than a solved
mass row.

The repaired join source, core-integral continuation source, and future
combined tail-operator source remain typed null dependencies.  The public
adapter authenticates closed policy/fixture/fenv bytes and then fails before
traversing caller inputs.  No solve, candidate execution, implementation
closure, output acceptance, or scientific authority is claimed.
"""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
import hashlib
import json
import math
from pathlib import Path
import re
import struct
import sys
from types import MappingProxyType, ModuleType
from typing import Final, Iterator

import gmpy2


TAIL_MASS_OPERATOR_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_seed_primary_tail_mass_operator/v1"
)

PRIMARY_NUMERICS_POLICY_RELATIVE_PATH: Final[str] = (
    "shared/contracts/nhm2-spherical-boson-star-newtonian-seed-primary-numerics.v1.ts"
)
PRIMARY_NUMERICS_POLICY_SHA256: Final[str] = (
    "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4"
)
PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES: Final[int] = 80_055
PRIMARY_NUMERICS_POLICY_SOURCE_SHA256: Final[str] = (
    "f74627f96fef606852fe7c6fc772e45ca9bc5a454802a0986c2c204a4f65a2b0"
)
PRIMARY_NUMERICS_POLICY_SOURCE_SIZE_BYTES: Final[int] = 103_911

BINARY64_ENVIRONMENT_SOURCE_SHA256: Final[str] = (
    "8d452abdfa6d9b3e0cf92aa7d8682202b588f1fe8b0fe0772c6d003d2d12f1a4"
)
BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES: Final[int] = 14_980

GL256_MANIFEST_RELATIVE_PATH: Final[str] = (
    "configs/research/nhm2-spherical-gl256-mpfr256-manifest.v1.json"
)
GL256_MANIFEST_SCHEMA: Final[str] = "nhm2_spherical_gl256_mpfr256_manifest/v1"
GL256_MANIFEST_SHA256: Final[str] = (
    "9b600578714821fddb41ad2c1b2c456bfdb11795d500200b55515a28948774e4"
)
GL256_MANIFEST_SIZE_BYTES: Final[int] = 5_390
GL256_RECORDS_RELATIVE_PATH: Final[str] = (
    "configs/research/fixtures/nhm2-spherical-gl256-mpfr256.v1.jsonl"
)
GL256_RECORD_SCHEMA: Final[str] = "nhm2_spherical_gl256_mpfr256_record/v1"
GL256_RECORDS_SHA256: Final[str] = (
    "966a28e7a0c5633709b5e59e2c0b99bb8d25e2ddadccf0cc391ebd1a9c70f794"
)
GL256_RECORDS_SIZE_BYTES: Final[int] = 77_842
GL256_GENERATOR_RELATIVE_PATH: Final[str] = (
    "scripts/research/build-verify-nhm2-spherical-gl256-mpfr256.py"
)
GL256_GENERATOR_SHA256: Final[str] = (
    "3acc145080a0bb799f58292640245d84f76c7f2ea445349bc0db58ef40eca5ed"
)
GL256_GENERATOR_SIZE_BYTES: Final[int] = 25_877
GL256_INDEPENDENT_TEST_RELATIVE_PATH: Final[str] = (
    "tests/nhm2-spherical-gl256-mpfr256-fixture.spec.ts"
)
GL256_INDEPENDENT_TEST_SHA256: Final[str] = (
    "bbec4f9040578e3a4c9be138718bd98a3169c58d5b553c0e7a7dd49f5e1de7b5"
)
GL256_INDEPENDENT_TEST_SIZE_BYTES: Final[int] = 31_699

# These coordinates remain null until their owners provide final authenticated
# source continuations.  A live file is never inferred as the missing pin.
CORE_INTEGRAL_CONTINUATION_SOURCE_SHA256: Final[str | None] = None
CORE_INTEGRAL_CONTINUATION_SOURCE_SIZE_BYTES: Final[int | None] = None
CORE_INTEGRAL_CONTINUATION_SOURCE_STATUS: Final[str] = (
    "pending_authenticated_core_integral_continuation_source"
)
JOIN_EXTRACTION_SOURCE_SHA256: Final[str | None] = None
JOIN_EXTRACTION_SOURCE_SIZE_BYTES: Final[int | None] = None
JOIN_EXTRACTION_SOURCE_STATUS: Final[str] = "pending_repaired_join_source"
COMBINED_TAIL_OPERATOR_SOURCE_SHA256: Final[str | None] = None
COMBINED_TAIL_OPERATOR_SOURCE_SIZE_BYTES: Final[int | None] = None
COMBINED_TAIL_OPERATOR_SOURCE_STATUS: Final[str] = (
    "pending_combined_65_row_tail_operator_source"
)
PRODUCTION_DEPENDENCIES_SEALED: Final[bool] = False

RADIUS: Final[int] = 32
PROJECTED_NODE_COUNT: Final[int] = 128
PROJECTED_UNKNOWN_COUNT: Final[int] = 257
TAIL_NODE_COUNT: Final[int] = 32
TAIL_UNKNOWN_COUNT: Final[int] = 65
ACTIVE_MASS_DERIVATIVE_COUNT: Final[int] = 33
TAIL_UNKNOWN_ORDER: Final[str] = "C,h[0..31],q[0..31]"
JOIN_BARRIER_ORDER: Final[tuple[str, ...]] = ("U", "U1", "V", "V1")
FULL_TAIL_CELL_COUNT: Final[int] = 4096
GL_POINT_COUNT: Final[int] = 256
CHEBYSHEV_TERM_COUNT: Final[int] = 32

MPFR_PRECISION_BITS: Final[int] = 256
MPFR_ROUNDING_MODE: Final[str] = "MPFR_RNDN"
MPFR_EMIN: Final[int] = -1_000_000
MPFR_EMAX: Final[int] = 1_000_000

STATE_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/tail-mass/state-f64le/v1\n"
)
PROJECTED_STATE_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/tail-mass/projected-l2-f64le/v1\n"
)
JOIN_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/tail-mass/join-f64le/v1\n"
)
CHRONOLOGY_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/tail-mass/chronology/v1\n"
)

MAPPED_CELL_OPERATION_GRAPH: Final[str] = (
    "cell_index_increasing;set_ui_domainLength_1_cellIndex_cellIndexPlusOne_"
    "cellCount_4096_two;mul_leftNumerator_div_left_mul_rightNumerator_div_"
    "right_add_endpoints_div_mid_sub_endpoints_div_half"
)
MAPPED_POINT_AND_T_TABLE_GRAPH: Final[str] = (
    "fixture_index_0_through_255_point_pass_nodeProduct_then_point_then_copy;"
    "after_all_points_fixture_index_increasing_T0_then_T1_then_n_1_through_30;"
    "node_outer_n_inner_table;after_last_node_clear_node_outer_n_inner"
)
MPFR_DUAL_OPERATION_GRAPH: Final[str] = (
    "dual_primal_then_derivatives_0_through_64;unknown_order_C_h0_to_h31_"
    "q0_to_q31;fresh_destination_literal_add_sub_neg_mul_div_sqrt_exp_log;"
    "q_derivatives_33_through_64_exact_positive_zero_without_Q_evaluation"
)
TAIL_PRIMAL_AND_DUAL_GRAPH: Final[str] = (
    "per_node_y_nu_minusTwoNu_kappa_C_sigma_a_H1_Hy1;A_zero_then_n_0_"
    "through_31_load_precomputed_Tn_then_hn_product_then_A_add;oneMinusY_"
    "correction_H;x_xMinusR_xOverR_exponent_B_E;y2_y4_H2;R3_E_then_H2_"
    "numerator;integrand;mappedWeight_term;tailSum_add"
)
TAIL_SUM_AND_MASS_BARRIER_GRAPH: Final[str] = (
    "after_selected_cells_get_d_tail_primal_then_C_then_h0_through_h31;"
    "write_exact_positive_zero_q0_through_q31;binary64_cMinusCore=C-core64;"
    "mass=cMinusCore-tail64;J0=1-dC;J_h=-dh;J_q=positive_zero"
)


class TailMassOperatorError(ValueError):
    """Fail-closed tail-mass diagnostic error with a stable code."""

    def __init__(self, code: str, detail: str = "root") -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


@dataclass(frozen=True, slots=True)
class _LiteralDyadic:
    sign: int
    significand: int
    exponent2: int


@dataclass(frozen=True, slots=True)
class _LiteralGLRecord:
    index: int
    node: _LiteralDyadic
    weight: _LiteralDyadic


@dataclass(frozen=True, slots=True)
class _FrozenFixtureValues:
    nodes: tuple[gmpy2.mpfr, ...]
    weights: tuple[gmpy2.mpfr, ...]


@dataclass(frozen=True, slots=True)
class _MpfrDual:
    value: gmpy2.mpfr
    derivatives: tuple[gmpy2.mpfr, ...]


@dataclass(frozen=True, slots=True)
class _SyntheticJoinBarriers:
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
class _SyntheticCoreContinuation:
    core64: float
    core64_bits: str
    calculation_implemented: bool = True
    complete_core_graph_evaluated: bool = True
    one_final_get_d_observed: bool = True
    continuation_consumed: bool = False
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
class FrozenTailMassDiagnostic:
    full_tail_cell_count: int
    synthetic_cells_completed: int
    gl_point_count: int
    points_completed: int
    basis_entries_completed: int
    basis_entries_cleared: int
    node_integrands_completed: int
    tail_unknown_count: int
    active_mass_derivative_count: int
    tail_unknown_order: str
    tail64: float
    tail64_bits: str
    tail_derivative64: tuple[float, ...]
    tail_derivative64_bits: tuple[str, ...]
    mass_residual: float
    mass_residual_bits: str
    mass_jacobian_row: tuple[float, ...]
    mass_jacobian_row_bits: tuple[str, ...]
    barrier_order: tuple[str, ...]
    get_d_barrier_count: int
    exact_q_zero_barrier_count: int
    chronology_event_count: int
    chronology_sha256: str
    state_f64le_sha256: str
    projected_state_f64le_sha256: str
    join_f64le_sha256: str
    core64: float
    core64_bits: str
    projected_l2_nu: float
    projected_l2_nu_bits: str
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    primary_numerics_policy_source_sha256: str
    primary_numerics_policy_source_size_bytes: int
    binary64_environment_source_sha256: str
    binary64_environment_source_size_bytes: int
    fixture_manifest_sha256: str
    fixture_manifest_size_bytes: int
    fixture_records_sha256: str
    fixture_records_size_bytes: int
    fixture_generator_sha256: str
    fixture_generator_size_bytes: int
    fixture_independent_test_sha256: str
    fixture_independent_test_size_bytes: int
    core_integral_continuation_source_sha256: str | None
    core_integral_continuation_source_size_bytes: int | None
    core_integral_continuation_source_status: str
    join_extraction_source_sha256: str | None
    join_extraction_source_size_bytes: int | None
    join_extraction_source_status: str
    combined_tail_operator_source_sha256: str | None
    combined_tail_operator_source_size_bytes: int | None
    combined_tail_operator_source_status: str
    production_dependencies_sealed: bool
    binary64_runtime_family: str
    mpfr_precision_bits: int
    mpfr_rounding_mode: str
    mpfr_emin: int
    mpfr_emax: int
    observed_gmpy2_version: str
    observed_mpfr_version: str
    synthetic_dependencies_used: bool
    synthetic_reduced_cell_graph_executed: bool = True
    same_fixed_4096_cell_partition_used: bool = True
    full_4096_cell_execution_observed: bool = False
    full_4096_cell_golden_verified: bool = False
    tail_sum_is_partial: bool = True
    production_adapter_available: bool = False
    implementation_closure_complete: bool = False
    runtime_closure_complete: bool = False
    core_integral_continuation_executed_here: bool = False
    pde_rows_evaluated_here: bool = False
    combined_operator_evaluated: bool = False
    newton_implemented: bool = False
    solve_performed: bool = False
    projected_source_acceptance_verified: bool = False
    join_receipt_present: bool = False
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


@dataclass(frozen=True, slots=True)
class _FrozenTailMassResidual:
    """Private F-only receipt; it intentionally has no derivative/J fields."""

    full_tail_cell_count: int
    cells_completed: int
    gl_point_count: int
    points_completed: int
    basis_entries_completed: int
    basis_entries_cleared: int
    node_integrands_completed: int
    tail64: float
    tail64_bits: str
    mass_residual: float
    mass_residual_bits: str
    get_d_barrier_count: int
    chronology_event_count: int
    chronology_sha256: str
    state_f64le_sha256: str
    projected_state_f64le_sha256: str
    join_f64le_sha256: str
    core64: float
    core64_bits: str
    projected_l2_nu: float
    projected_l2_nu_bits: str
    synthetic_dependencies_used: bool
    same_fixed_4096_cell_partition_used: bool = True
    full_4096_cell_execution_observed: bool = False
    tail_sum_is_partial: bool = True
    residual_only_graph_executed: bool = True
    derivative_graph_executed: bool = False
    jacobian_computed: bool = False


_BOUND_MASS_AUTHORITY: Final[object] = object()


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
        "full4096CellGoldenVerified": False,
        "productionAdapterAvailable": False,
        "coreIntegralContinuationExecutedHere": False,
        "pdeRowsEvaluatedHere": False,
        "combinedOperatorEvaluated": False,
        "newtonImplemented": False,
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
    "continuation_consumed",
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
_REPOSITORY_ROOT: Final[Path] = Path(__file__).resolve().parents[3]
_BINARY64_ENVIRONMENT_PATH: Final[Path] = _HERE / "binary64_environment.py"
_JOIN_EXTRACTION_PATH: Final[Path] = _HERE / "join_extraction.py"
_POLICY_PATH: Final[Path] = _REPOSITORY_ROOT / PRIMARY_NUMERICS_POLICY_RELATIVE_PATH
_PRIVATE_FENV_MODULE_NAME: Final[str] = (
    "_nhm2_seed_tail_mass_fenv_8d452abdfa6d9b3e"
)
_MISSING_MODULE: Final[object] = object()
_HEX_256_RE: Final[re.Pattern[str]] = re.compile(r"[89abcdef][0-9a-f]{63}")


def _read_bound_file(
    path: Path,
    expected_size: int,
    expected_sha256: str,
    role: str,
) -> bytes:
    try:
        raw = path.read_bytes()
    except OSError as error:
        raise TailMassOperatorError(
            "tail_mass_bound_file_unavailable", f"{role}:{type(error).__name__}"
        ) from error
    if len(raw) != expected_size:
        raise TailMassOperatorError(
            "tail_mass_bound_file_mismatch", f"{role}:size"
        )
    if hashlib.sha256(raw).hexdigest() != expected_sha256:
        raise TailMassOperatorError(
            "tail_mass_bound_file_mismatch", f"{role}:sha256"
        )
    return raw


def _read_bound_binary64_environment_source() -> bytes:
    return _read_bound_file(
        _BINARY64_ENVIRONMENT_PATH,
        BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES,
        BINARY64_ENVIRONMENT_SOURCE_SHA256,
        "binary64_environment_source",
    )


def _execute_private_fenv(source: bytes) -> ModuleType:
    module = ModuleType(_PRIVATE_FENV_MODULE_NAME)
    module.__file__ = str(_BINARY64_ENVIRONMENT_PATH)
    module.__package__ = ""
    previous = sys.modules.get(_PRIVATE_FENV_MODULE_NAME, _MISSING_MODULE)
    sys.modules[_PRIVATE_FENV_MODULE_NAME] = module
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
        raise TailMassOperatorError(
            "tail_mass_binary64_environment_private_load_failed",
            type(error).__name__,
        ) from error
    finally:
        if previous is _MISSING_MODULE:
            del sys.modules[_PRIVATE_FENV_MODULE_NAME]
        else:
            sys.modules[_PRIVATE_FENV_MODULE_NAME] = previous
    if (
        not isinstance(getattr(module, "__file__", None), str)
        or Path(module.__file__).resolve() != _BINARY64_ENVIRONMENT_PATH
    ):
        raise TailMassOperatorError(
            "tail_mass_binary64_environment_module_origin_mismatch"
        )
    return module


_binary64_environment = _execute_private_fenv(
    _read_bound_binary64_environment_source()
)


def _unique_json_object(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in pairs:
        if key in result:
            raise TailMassOperatorError("tail_mass_fixture_duplicate_key", key)
        result[key] = value
    return result


def _parse_json(raw: bytes, role: str) -> dict[str, object]:
    try:
        text = raw.decode("ascii")
    except UnicodeDecodeError as error:
        raise TailMassOperatorError(
            "tail_mass_fixture_encoding_invalid", role
        ) from error
    try:
        value = json.loads(text, object_pairs_hook=_unique_json_object)
    except json.JSONDecodeError as error:
        raise TailMassOperatorError(
            "tail_mass_fixture_json_invalid", role
        ) from error
    if type(value) is not dict:
        raise TailMassOperatorError("tail_mass_fixture_json_root_invalid", role)
    return value


def _validate_manifest(raw: bytes) -> None:
    if b"\r" in raw or raw.startswith(b"\xef\xbb\xbf") or not raw.endswith(b"\n"):
        raise TailMassOperatorError("tail_mass_manifest_encoding_invalid")
    root = _parse_json(raw, "manifest")
    canonical = json.dumps(
        root, ensure_ascii=True, separators=(",", ":"), sort_keys=True
    ).encode("ascii") + b"\n"
    if canonical != raw:
        raise TailMassOperatorError("tail_mass_manifest_not_canonical")
    try:
        fixture = root["fixture"]
        generation = root["generation"]
        independent = root["independentVerifier"]
        authority = root["authorityLocks"]
        scope = root["scope"]
        if (
            root["schema"] != GL256_MANIFEST_SCHEMA
            or type(fixture) is not dict
            or fixture["path"] != GL256_RECORDS_RELATIVE_PATH
            or fixture["recordSchema"] != GL256_RECORD_SCHEMA
            or fixture["nodeCount"] != GL_POINT_COUNT
            or fixture["recordCount"] != GL_POINT_COUNT
            or fixture["sha256"] != GL256_RECORDS_SHA256
            or fixture["sizeBytes"] != GL256_RECORDS_SIZE_BYTES
            or type(generation) is not dict
            or type(generation["script"]) is not dict
            or generation["script"]["path"] != GL256_GENERATOR_RELATIVE_PATH
            or generation["script"]["sha256"] != GL256_GENERATOR_SHA256
            or generation["script"]["sizeBytes"] != GL256_GENERATOR_SIZE_BYTES
            or type(independent) is not dict
            or type(independent["test"]) is not dict
            or independent["test"]["path"] != GL256_INDEPENDENT_TEST_RELATIVE_PATH
            or independent["test"]["sha256"] != GL256_INDEPENDENT_TEST_SHA256
            or independent["test"]["sizeBytes"]
            != GL256_INDEPENDENT_TEST_SIZE_BYTES
            or type(authority) is not dict
            or any(item is not False for item in authority.values())
            or type(scope) is not dict
            or scope["candidateData"] is not False
            or scope["seedSolveExecuted"] is not False
        ):
            raise TailMassOperatorError("tail_mass_manifest_schema_mismatch")
    except (KeyError, TypeError):
        raise TailMassOperatorError(
            "tail_mass_manifest_schema_mismatch"
        ) from None


def _parse_dyadic(value: object, detail: str) -> _LiteralDyadic:
    if type(value) is not dict or tuple(value) != (
        "exponent2",
        "sign",
        "significandHex",
    ):
        raise TailMassOperatorError(
            "tail_mass_fixture_dyadic_shape_invalid", detail
        )
    exponent2 = value["exponent2"]
    sign = value["sign"]
    significand_hex = value["significandHex"]
    if (
        type(exponent2) is not int
        or not MPFR_EMIN <= exponent2 <= MPFR_EMAX
        or type(sign) is not int
        or sign not in (-1, 1)
        or type(significand_hex) is not str
        or _HEX_256_RE.fullmatch(significand_hex) is None
    ):
        raise TailMassOperatorError("tail_mass_fixture_dyadic_invalid", detail)
    return _LiteralDyadic(sign, int(significand_hex, 16), exponent2)


def _parse_fixture_records(raw: bytes) -> tuple[_LiteralGLRecord, ...]:
    if raw.startswith(b"\xef\xbb\xbf") or b"\r" in raw or not raw.endswith(b"\n"):
        raise TailMassOperatorError(
            "tail_mass_fixture_encoding_invalid", "records"
        )
    lines = raw.splitlines(keepends=True)
    if len(lines) != GL_POINT_COUNT or any(line == b"\n" for line in lines):
        raise TailMassOperatorError("tail_mass_fixture_record_count_invalid")
    records: list[_LiteralGLRecord] = []
    for expected_index, line in enumerate(lines):
        if not line.endswith(b"\n") or line.count(b"\n") != 1:
            raise TailMassOperatorError(
                "tail_mass_fixture_line_encoding_invalid", str(expected_index)
            )
        root = _parse_json(line[:-1], f"record[{expected_index}]")
        canonical = json.dumps(
            root, ensure_ascii=True, separators=(",", ":"), sort_keys=True
        ).encode("ascii") + b"\n"
        if canonical != line or tuple(root) != ("index", "node", "schema", "weight"):
            raise TailMassOperatorError(
                "tail_mass_fixture_record_not_canonical", str(expected_index)
            )
        if (
            type(root["index"]) is not int
            or root["index"] != expected_index
            or root["schema"] != GL256_RECORD_SCHEMA
        ):
            raise TailMassOperatorError(
                "tail_mass_fixture_record_schema_invalid", str(expected_index)
            )
        records.append(
            _LiteralGLRecord(
                expected_index,
                _parse_dyadic(root["node"], f"node[{expected_index}]"),
                _parse_dyadic(root["weight"], f"weight[{expected_index}]"),
            )
        )
    return tuple(records)


def _verify_bound_sources_and_load_records() -> tuple[_LiteralGLRecord, ...]:
    _read_bound_binary64_environment_source()
    _read_bound_file(
        _POLICY_PATH,
        PRIMARY_NUMERICS_POLICY_SOURCE_SIZE_BYTES,
        PRIMARY_NUMERICS_POLICY_SOURCE_SHA256,
        "primary_numerics_policy_source",
    )
    manifest_raw = _read_bound_file(
        _REPOSITORY_ROOT / GL256_MANIFEST_RELATIVE_PATH,
        GL256_MANIFEST_SIZE_BYTES,
        GL256_MANIFEST_SHA256,
        "fixture_manifest",
    )
    records_raw = _read_bound_file(
        _REPOSITORY_ROOT / GL256_RECORDS_RELATIVE_PATH,
        GL256_RECORDS_SIZE_BYTES,
        GL256_RECORDS_SHA256,
        "fixture_records",
    )
    _read_bound_file(
        _REPOSITORY_ROOT / GL256_GENERATOR_RELATIVE_PATH,
        GL256_GENERATOR_SIZE_BYTES,
        GL256_GENERATOR_SHA256,
        "fixture_generator",
    )
    _read_bound_file(
        _REPOSITORY_ROOT / GL256_INDEPENDENT_TEST_RELATIVE_PATH,
        GL256_INDEPENDENT_TEST_SIZE_BYTES,
        GL256_INDEPENDENT_TEST_SHA256,
        "fixture_independent_test",
    )
    if (
        _binary64_environment.BINARY64_ENVIRONMENT_VERSION
        != "nhm2_spherical_boson_star_seed_producer_binary64_environment/v1"
        or any(
            value is not False
            for value in _binary64_environment.AUTHORITY_LOCKS.values()
        )
    ):
        raise TailMassOperatorError("tail_mass_fenv_binding_invalid")
    _validate_manifest(manifest_raw)
    return _parse_fixture_records(records_raw)


def _require_sealed_production_dependencies() -> None:
    if (
        PRODUCTION_DEPENDENCIES_SEALED is not True
        or CORE_INTEGRAL_CONTINUATION_SOURCE_SHA256 is None
        or CORE_INTEGRAL_CONTINUATION_SOURCE_SIZE_BYTES is None
        or JOIN_EXTRACTION_SOURCE_SHA256 is None
        or JOIN_EXTRACTION_SOURCE_SIZE_BYTES is None
        or COMBINED_TAIL_OPERATOR_SOURCE_SHA256 is None
        or COMBINED_TAIL_OPERATOR_SOURCE_SIZE_BYTES is None
    ):
        raise TailMassOperatorError(
            "tail_mass_production_dependencies_unsealed",
            "pending_core_continuation_repaired_join_and_combined_sources",
        )
    raise TailMassOperatorError(
        "tail_mass_production_adapter_unimplemented",
        "authenticated_dependency_adapters_required",
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
        raise TailMassOperatorError("tail_mass_binary64_type_invalid", detail)
    if not math.isfinite(value):
        raise TailMassOperatorError("tail_mass_binary64_nonfinite_input", detail)
    if _negative_zero(value):
        raise TailMassOperatorError(
            "tail_mass_binary64_negative_zero_input", detail
        )
    return 0.0 if value == 0.0 else value


def _f64_tuple_sha256(domain: bytes, values: tuple[float, ...]) -> str:
    digest = hashlib.sha256(domain)
    digest.update(struct.pack(f"<{len(values)}d", *values))
    return digest.hexdigest()


def _validate_tail_state(value: object) -> tuple[float, ...]:
    if type(value) is not tuple or len(value) != TAIL_UNKNOWN_COUNT:
        raise TailMassOperatorError("tail_mass_state_shape_invalid")
    state = tuple(
        _validate_f64(component, f"state[{index}]")
        for index, component in enumerate(value)
    )
    return state


def _validate_projected_state(value: object) -> tuple[tuple[float, ...], float]:
    if type(value) is not tuple or len(value) != PROJECTED_UNKNOWN_COUNT:
        raise TailMassOperatorError("tail_mass_projected_state_shape_invalid")
    state = tuple(
        _validate_f64(component, f"projected_l2_state[{index}]")
        for index, component in enumerate(value)
    )
    if _f64_bits(state[PROJECTED_NODE_COUNT - 1]) != bytes(8):
        raise TailMassOperatorError(
            "tail_mass_projected_u_infinity_not_positive_zero"
        )
    if _f64_bits(state[(2 * PROJECTED_NODE_COUNT) - 1]) != bytes(8):
        raise TailMassOperatorError(
            "tail_mass_projected_V_infinity_not_positive_zero"
        )
    nu = state[-1]
    if nu >= 0.0:
        raise TailMassOperatorError("tail_mass_projected_nu_domain_invalid")
    return state, nu


def _validate_synthetic_join(
    value: object,
) -> tuple[float, float, float, float]:
    if type(value) is not _SyntheticJoinBarriers:
        raise TailMassOperatorError(
            "tail_mass_synthetic_join_type_invalid", type(value).__name__
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
        raise TailMassOperatorError("tail_mass_synthetic_join_binding_invalid")
    if any(
        getattr(join, field, None) is not False for field in _JOIN_FALSE_FIELDS
    ):
        raise TailMassOperatorError(
            "tail_mass_synthetic_join_authority_lock_invalid"
        )
    if type(join.barrier_values) is not tuple or len(join.barrier_values) != 4:
        raise TailMassOperatorError("tail_mass_synthetic_join_shape_invalid")
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
        raise TailMassOperatorError(
            "tail_mass_synthetic_join_named_value_mismatch"
        )
    return barriers  # type: ignore[return-value]


def _validate_owned_join(
    owner_join_module: object, value: object
) -> tuple[float, float, float, float]:
    """Authenticate a raw join object retained by the composed initializer."""

    if type(owner_join_module) is not ModuleType:
        raise TailMassOperatorError("tail_mass_owned_join_module_type_invalid")
    owner = owner_join_module
    try:
        binding_invalid = (
            owner.JOIN_EXTRACTION_VERSION
            != "nhm2_spherical_boson_star_seed_primary_l2_join_extraction/v1"
            or owner.PRIMARY_NUMERICS_POLICY_SHA256
            != PRIMARY_NUMERICS_POLICY_SHA256
            or owner.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
            != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
            or owner.NODE_COUNT != PROJECTED_NODE_COUNT
            or owner.JOIN_X != RADIUS
            or owner.BARRIER_ORDER != JOIN_BARRIER_ORDER
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
        raise TailMassOperatorError(
            "tail_mass_owned_join_module_binding_invalid", type(error).__name__
        ) from error
    if binding_invalid:
        raise TailMassOperatorError("tail_mass_owned_join_module_binding_invalid")
    if type(owned_type) is not type or type(value) is not owned_type:
        raise TailMassOperatorError(
            "tail_mass_owned_join_type_invalid", type(value).__name__
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
        or join.barrier_order != JOIN_BARRIER_ORDER
        or type(join.primary_numerics_policy_sha256) is not str
        or join.primary_numerics_policy_sha256
        != PRIMARY_NUMERICS_POLICY_SHA256
        or type(join.primary_numerics_policy_canonical_size_bytes) is not int
        or join.primary_numerics_policy_canonical_size_bytes
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or type(join.spectral_source_sha256) is not str
        or join.spectral_source_sha256 != owner.SPECTRAL_SOURCE_SHA256
        or type(join.spectral_source_size_bytes) is not int
        or join.spectral_source_size_bytes != owner.SPECTRAL_SOURCE_SIZE_BYTES
        or type(join.spectral_payload_sha256) is not str
        or join.spectral_payload_sha256 != owner.SPECTRAL_N128_PAYLOAD_SHA256
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
        raise TailMassOperatorError("tail_mass_owned_join_binding_invalid")
    if any(
        getattr(join, field, None) is not False for field in _JOIN_FALSE_FIELDS
    ):
        raise TailMassOperatorError("tail_mass_owned_join_authority_lock_invalid")
    if type(join.barrier_values) is not tuple or len(join.barrier_values) != 4:
        raise TailMassOperatorError("tail_mass_owned_join_shape_invalid")
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
        raise TailMassOperatorError("tail_mass_owned_join_named_value_mismatch")
    return barriers  # type: ignore[return-value]


def _validate_synthetic_core(value: object) -> float:
    if type(value) is not _SyntheticCoreContinuation:
        raise TailMassOperatorError(
            "tail_mass_synthetic_core_type_invalid", type(value).__name__
        )
    core = value
    if (
        core.calculation_implemented is not True
        or core.complete_core_graph_evaluated is not True
        or core.one_final_get_d_observed is not True
        or type(core.core64_bits) is not str
        or len(core.core64_bits) != 16
    ):
        raise TailMassOperatorError("tail_mass_synthetic_core_binding_invalid")
    if any(
        getattr(core, field, None) is not False for field in _CORE_FALSE_FIELDS
    ):
        raise TailMassOperatorError(
            "tail_mass_synthetic_core_authority_lock_invalid"
        )
    core64 = _validate_f64(core.core64, "core64")
    if core64 < 0.0:
        raise TailMassOperatorError("tail_mass_core64_domain_invalid")
    if core.core64_bits != _f64_hex(core64):
        raise TailMassOperatorError("tail_mass_core64_bit_mismatch")
    return core64


def _owned_context_template() -> gmpy2.context:
    template = gmpy2.get_context().copy()
    template.precision = MPFR_PRECISION_BITS
    template.round = gmpy2.RoundToNearest
    template.real_prec = MPFR_PRECISION_BITS
    template.imag_prec = MPFR_PRECISION_BITS
    template.real_round = gmpy2.RoundToNearest
    template.imag_round = gmpy2.RoundToNearest
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
            or context.real_prec != MPFR_PRECISION_BITS
            or context.imag_prec != MPFR_PRECISION_BITS
            or context.real_round != gmpy2.RoundToNearest
            or context.imag_round != gmpy2.RoundToNearest
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
            raise TailMassOperatorError(
                "tail_mass_mpfr_context_installation_failed"
            )
        context.clear_flags()
        yield context


def _check_flags(context: gmpy2.context, operation: str) -> None:
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
        raise TailMassOperatorError(
            "tail_mass_mpfr_exceptional_flag",
            f"{operation}:{','.join(bad)}",
        )


def _positive_zero(context: gmpy2.context, operation: str) -> gmpy2.mpfr:
    context.clear_flags()
    result = gmpy2.mpfr(0, MPFR_PRECISION_BITS)
    _check_flags(context, operation)
    if not gmpy2.is_zero(result) or gmpy2.is_signed(result):
        raise TailMassOperatorError("tail_mass_positive_zero_failure", operation)
    return result


def _finish(
    context: gmpy2.context,
    value: gmpy2.mpfr,
    operation: str,
) -> gmpy2.mpfr:
    _check_flags(context, operation)
    if not gmpy2.is_finite(value):
        raise TailMassOperatorError("tail_mass_mpfr_nonfinite", operation)
    return _positive_zero(context, f"{operation}.canonical_zero") if gmpy2.is_zero(value) else value


def _set_ui(context: gmpy2.context, value: int, operation: str) -> gmpy2.mpfr:
    if type(value) is not int or value < 0:
        raise TailMassOperatorError("tail_mass_set_ui_domain_invalid", operation)
    context.clear_flags()
    result = gmpy2.mpfr(value, MPFR_PRECISION_BITS)
    inexact = bool(context.inexact)
    result = _finish(context, result, operation)
    if inexact:
        raise TailMassOperatorError("tail_mass_set_ui_inexact", operation)
    return result


def _set_si(context: gmpy2.context, value: int, operation: str) -> gmpy2.mpfr:
    if type(value) is not int:
        raise TailMassOperatorError("tail_mass_set_si_domain_invalid", operation)
    context.clear_flags()
    result = gmpy2.mpfr(value, MPFR_PRECISION_BITS)
    inexact = bool(context.inexact)
    result = _finish(context, result, operation)
    if inexact:
        raise TailMassOperatorError("tail_mass_set_si_inexact", operation)
    return result


def _set_d(context: gmpy2.context, value: float, operation: str) -> gmpy2.mpfr:
    _validate_f64(value, operation)
    context.clear_flags()
    result = gmpy2.mpfr(value, MPFR_PRECISION_BITS)
    inexact = bool(context.inexact)
    result = _finish(context, result, operation)
    if inexact:
        raise TailMassOperatorError("tail_mass_set_d_inexact", operation)
    return result


def _copy(
    context: gmpy2.context, value: gmpy2.mpfr, operation: str
) -> gmpy2.mpfr:
    context.clear_flags()
    result = gmpy2.mpfr(value, MPFR_PRECISION_BITS)
    inexact = bool(context.inexact)
    result = _finish(context, result, operation)
    if inexact:
        raise TailMassOperatorError("tail_mass_copy_inexact", operation)
    return result


def _set_z_2exp(
    context: gmpy2.context,
    value: _LiteralDyadic,
    operation: str,
) -> gmpy2.mpfr:
    signed_significand = value.sign * value.significand
    context.clear_flags()
    significand = gmpy2.mpfr(gmpy2.mpz(signed_significand), MPFR_PRECISION_BITS)
    significand_inexact = bool(context.inexact)
    significand = _finish(context, significand, f"{operation}.significand")
    if significand_inexact:
        raise TailMassOperatorError("tail_mass_set_z_2exp_inexact", operation)
    context.clear_flags()
    result = gmpy2.mul_2exp(significand, value.exponent2)
    scale_inexact = bool(context.inexact)
    result = _finish(context, result, operation)
    if scale_inexact:
        raise TailMassOperatorError("tail_mass_set_z_2exp_inexact", operation)
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
        raise TailMassOperatorError("tail_mass_mpfr_division_by_zero", operation)
    context.clear_flags()
    return _finish(context, gmpy2.div(numerator, denominator), operation)


def _neg(
    context: gmpy2.context, value: gmpy2.mpfr, operation: str
) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish(context, -value, operation)


def _sqrt(
    context: gmpy2.context, value: gmpy2.mpfr, operation: str
) -> gmpy2.mpfr:
    if value < 0:
        raise TailMassOperatorError("tail_mass_mpfr_sqrt_domain_invalid", operation)
    context.clear_flags()
    return _finish(context, gmpy2.sqrt(value), operation)


def _exp(
    context: gmpy2.context, value: gmpy2.mpfr, operation: str
) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish(context, gmpy2.exp(value), operation)


def _log(
    context: gmpy2.context, value: gmpy2.mpfr, operation: str
) -> gmpy2.mpfr:
    if value <= 0:
        raise TailMassOperatorError("tail_mass_mpfr_log_domain_invalid", operation)
    context.clear_flags()
    return _finish(context, gmpy2.log(value), operation)


def _get_d(context: gmpy2.context, value: gmpy2.mpfr, operation: str) -> float:
    context.clear_flags()
    result = float(value)
    _check_flags(context, operation)
    if not math.isfinite(result):
        raise TailMassOperatorError(
            "tail_mass_binary64_nonfinite_result", operation
        )
    result = 0.0 if result == 0.0 else result
    if _negative_zero(result):
        raise TailMassOperatorError(
            "tail_mass_binary64_negative_zero_result", operation
        )
    return result


def _materialize_fixture_values(
    context: gmpy2.context,
    records: tuple[_LiteralGLRecord, ...],
) -> _FrozenFixtureValues:
    if len(records) != GL_POINT_COUNT:
        raise TailMassOperatorError("tail_mass_fixture_record_count_invalid")
    nodes: list[gmpy2.mpfr] = []
    weights: list[gmpy2.mpfr] = []
    for expected_index, record in enumerate(records):
        if record.index != expected_index:
            raise TailMassOperatorError(
                "tail_mass_fixture_record_order_invalid", str(expected_index)
            )
        nodes.append(
            _set_z_2exp(
                context, record.node, f"fixture[{expected_index}].node"
            )
        )
        weights.append(
            _set_z_2exp(
                context, record.weight, f"fixture[{expected_index}].weight"
            )
        )
    one = _set_ui(context, 1, "fixture.order.one")
    minus_one = _neg(context, one, "fixture.order.minus_one")
    if not all(minus_one < node < one for node in nodes):
        raise TailMassOperatorError("tail_mass_fixture_node_domain_invalid")
    if any(
        nodes[index] <= nodes[index - 1]
        for index in range(1, GL_POINT_COUNT)
    ):
        raise TailMassOperatorError("tail_mass_fixture_node_order_invalid")
    if any(weight <= 0 for weight in weights):
        raise TailMassOperatorError("tail_mass_fixture_weight_invalid")
    return _FrozenFixtureValues(tuple(nodes), tuple(weights))


class _ChronologyTrace:
    __slots__ = ("_digest", "count")

    def __init__(self) -> None:
        self._digest = hashlib.sha256(CHRONOLOGY_HASH_DOMAIN)
        self.count = 0

    def record(self, label: str) -> None:
        if type(label) is not str or not label or len(label) > 256:
            raise TailMassOperatorError("tail_mass_trace_label_invalid")
        encoded = label.encode("ascii")
        self._digest.update(len(encoded).to_bytes(4, "little"))
        self._digest.update(encoded)
        self.count += 1

    def hexdigest(self) -> str:
        return self._digest.hexdigest()


def _validate_dual(dual: _MpfrDual, operation: str) -> None:
    if type(dual) is not _MpfrDual or len(dual.derivatives) != TAIL_UNKNOWN_COUNT:
        raise TailMassOperatorError("tail_mass_internal_dual_shape_invalid", operation)
    if not gmpy2.is_finite(dual.value):
        raise TailMassOperatorError("tail_mass_internal_dual_nonfinite", operation)
    for index, component in enumerate(dual.derivatives):
        if not gmpy2.is_finite(component):
            raise TailMassOperatorError(
                "tail_mass_internal_dual_nonfinite", f"{operation}:d[{index}]"
            )
    for index in range(ACTIVE_MASS_DERIVATIVE_COUNT, TAIL_UNKNOWN_COUNT):
        component = dual.derivatives[index]
        if not gmpy2.is_zero(component) or gmpy2.is_signed(component):
            raise TailMassOperatorError(
                "tail_mass_internal_q_derivative_nonzero",
                f"{operation}:d[{index}]",
            )


def _q_zero_tail(
    context: gmpy2.context, operation: str
) -> list[gmpy2.mpfr]:
    return [
        _positive_zero(context, f"{operation}.d[{index}].q_zero")
        for index in range(ACTIVE_MASS_DERIVATIVE_COUNT, TAIL_UNKNOWN_COUNT)
    ]


def _dual_zero(context: gmpy2.context, operation: str) -> _MpfrDual:
    value = _positive_zero(context, f"{operation}.value")
    derivatives = tuple(
        _positive_zero(context, f"{operation}.d[{index}]")
        for index in range(TAIL_UNKNOWN_COUNT)
    )
    return _MpfrDual(value, derivatives)


def _dual_set_ui(
    context: gmpy2.context, value: int, operation: str
) -> _MpfrDual:
    primal = _set_ui(context, value, f"{operation}.value")
    derivatives = tuple(
        _positive_zero(context, f"{operation}.d[{index}]")
        for index in range(TAIL_UNKNOWN_COUNT)
    )
    return _MpfrDual(primal, derivatives)


def _dual_set_si(
    context: gmpy2.context, value: int, operation: str
) -> _MpfrDual:
    primal = _set_si(context, value, f"{operation}.value")
    derivatives = tuple(
        _positive_zero(context, f"{operation}.d[{index}]")
        for index in range(TAIL_UNKNOWN_COUNT)
    )
    return _MpfrDual(primal, derivatives)


def _dual_set_d(
    context: gmpy2.context, value: float, operation: str
) -> _MpfrDual:
    primal = _set_d(context, value, f"{operation}.value")
    derivatives = tuple(
        _positive_zero(context, f"{operation}.d[{index}]")
        for index in range(TAIL_UNKNOWN_COUNT)
    )
    return _MpfrDual(primal, derivatives)


def _dual_from_mpfr(
    context: gmpy2.context, value: gmpy2.mpfr, operation: str
) -> _MpfrDual:
    primal = _copy(context, value, f"{operation}.value")
    derivatives = tuple(
        _positive_zero(context, f"{operation}.d[{index}]")
        for index in range(TAIL_UNKNOWN_COUNT)
    )
    return _MpfrDual(primal, derivatives)


def _dual_unknown(
    context: gmpy2.context,
    value: float,
    unknown_index: int,
    operation: str,
) -> _MpfrDual:
    if (
        type(unknown_index) is not int
        or not 0 <= unknown_index < ACTIVE_MASS_DERIVATIVE_COUNT
    ):
        raise TailMassOperatorError(
            "tail_mass_active_unknown_index_invalid", repr(unknown_index)
        )
    primal = _set_d(context, value, f"{operation}.value")
    derivatives = tuple(
        _set_ui(
            context,
            1 if index == unknown_index else 0,
            f"{operation}.d[{index}]",
        )
        for index in range(TAIL_UNKNOWN_COUNT)
    )
    return _MpfrDual(primal, derivatives)


def _dual_add(
    context: gmpy2.context, left: _MpfrDual, right: _MpfrDual, operation: str
) -> _MpfrDual:
    _validate_dual(left, f"{operation}.left")
    _validate_dual(right, f"{operation}.right")
    primal = _add(context, left.value, right.value, f"{operation}.value")
    derivatives = [
        _add(
            context,
            left.derivatives[index],
            right.derivatives[index],
            f"{operation}.d[{index}]",
        )
        for index in range(ACTIVE_MASS_DERIVATIVE_COUNT)
    ]
    derivatives.extend(_q_zero_tail(context, operation))
    return _MpfrDual(primal, tuple(derivatives))


def _dual_sub(
    context: gmpy2.context, left: _MpfrDual, right: _MpfrDual, operation: str
) -> _MpfrDual:
    _validate_dual(left, f"{operation}.left")
    _validate_dual(right, f"{operation}.right")
    primal = _sub(context, left.value, right.value, f"{operation}.value")
    derivatives = [
        _sub(
            context,
            left.derivatives[index],
            right.derivatives[index],
            f"{operation}.d[{index}]",
        )
        for index in range(ACTIVE_MASS_DERIVATIVE_COUNT)
    ]
    derivatives.extend(_q_zero_tail(context, operation))
    return _MpfrDual(primal, tuple(derivatives))


def _dual_neg(
    context: gmpy2.context, value: _MpfrDual, operation: str
) -> _MpfrDual:
    _validate_dual(value, f"{operation}.operand")
    primal = _neg(context, value.value, f"{operation}.value")
    derivatives = [
        _neg(context, value.derivatives[index], f"{operation}.d[{index}]")
        for index in range(ACTIVE_MASS_DERIVATIVE_COUNT)
    ]
    derivatives.extend(_q_zero_tail(context, operation))
    return _MpfrDual(primal, tuple(derivatives))


def _dual_mul(
    context: gmpy2.context, left: _MpfrDual, right: _MpfrDual, operation: str
) -> _MpfrDual:
    _validate_dual(left, f"{operation}.left")
    _validate_dual(right, f"{operation}.right")
    primal = _mul(context, left.value, right.value, f"{operation}.value")
    derivatives: list[gmpy2.mpfr] = []
    for index in range(ACTIVE_MASS_DERIVATIVE_COUNT):
        left_term = _mul(
            context,
            left.derivatives[index],
            right.value,
            f"{operation}.d[{index}].left",
        )
        right_term = _mul(
            context,
            left.value,
            right.derivatives[index],
            f"{operation}.d[{index}].right",
        )
        derivatives.append(
            _add(
                context,
                left_term,
                right_term,
                f"{operation}.d[{index}].add",
            )
        )
    derivatives.extend(_q_zero_tail(context, operation))
    return _MpfrDual(primal, tuple(derivatives))


def _dual_div(
    context: gmpy2.context,
    numerator: _MpfrDual,
    denominator: _MpfrDual,
    operation: str,
) -> _MpfrDual:
    _validate_dual(numerator, f"{operation}.numerator")
    _validate_dual(denominator, f"{operation}.denominator")
    primal = _div(
        context, numerator.value, denominator.value, f"{operation}.value"
    )
    denominator_squared = _mul(
        context,
        denominator.value,
        denominator.value,
        f"{operation}.denominator_squared",
    )
    derivatives: list[gmpy2.mpfr] = []
    for index in range(ACTIVE_MASS_DERIVATIVE_COUNT):
        left_term = _mul(
            context,
            numerator.derivatives[index],
            denominator.value,
            f"{operation}.d[{index}].left",
        )
        right_term = _mul(
            context,
            numerator.value,
            denominator.derivatives[index],
            f"{operation}.d[{index}].right",
        )
        derivative_numerator = _sub(
            context,
            left_term,
            right_term,
            f"{operation}.d[{index}].numerator",
        )
        derivatives.append(
            _div(
                context,
                derivative_numerator,
                denominator_squared,
                f"{operation}.d[{index}].divide",
            )
        )
    derivatives.extend(_q_zero_tail(context, operation))
    return _MpfrDual(primal, tuple(derivatives))


def _dual_sqrt(
    context: gmpy2.context, value: _MpfrDual, operation: str
) -> _MpfrDual:
    _validate_dual(value, f"{operation}.operand")
    primal = _sqrt(context, value.value, f"{operation}.value")
    two = _set_ui(context, 2, f"{operation}.two")
    two_primal = _mul(context, two, primal, f"{operation}.two_v")
    derivatives = [
        _div(
            context,
            value.derivatives[index],
            two_primal,
            f"{operation}.d[{index}]",
        )
        for index in range(ACTIVE_MASS_DERIVATIVE_COUNT)
    ]
    derivatives.extend(_q_zero_tail(context, operation))
    return _MpfrDual(primal, tuple(derivatives))


def _dual_exp(
    context: gmpy2.context, value: _MpfrDual, operation: str
) -> _MpfrDual:
    _validate_dual(value, f"{operation}.operand")
    primal = _exp(context, value.value, f"{operation}.value")
    derivatives = [
        _mul(
            context,
            primal,
            value.derivatives[index],
            f"{operation}.d[{index}]",
        )
        for index in range(ACTIVE_MASS_DERIVATIVE_COUNT)
    ]
    derivatives.extend(_q_zero_tail(context, operation))
    return _MpfrDual(primal, tuple(derivatives))


def _dual_log(
    context: gmpy2.context, value: _MpfrDual, operation: str
) -> _MpfrDual:
    _validate_dual(value, f"{operation}.operand")
    primal = _log(context, value.value, f"{operation}.value")
    derivatives = [
        _div(
            context,
            value.derivatives[index],
            value.value,
            f"{operation}.d[{index}]",
        )
        for index in range(ACTIVE_MASS_DERIVATIVE_COUNT)
    ]
    derivatives.extend(_q_zero_tail(context, operation))
    return _MpfrDual(primal, tuple(derivatives))


def _mapped_cell(
    context: gmpy2.context,
    cell_index: int,
    trace: _ChronologyTrace,
) -> tuple[gmpy2.mpfr, gmpy2.mpfr]:
    if type(cell_index) is not int or not 0 <= cell_index < FULL_TAIL_CELL_COUNT:
        raise TailMassOperatorError("tail_mass_cell_index_invalid", repr(cell_index))
    prefix = f"cell[{cell_index}].map"
    trace.record(f"{prefix}.begin")
    domain_length = _set_ui(context, 1, f"{prefix}.domain_length")
    cell_index_mp = _set_ui(context, cell_index, f"{prefix}.index")
    cell_index_plus_one = _set_ui(
        context, cell_index + 1, f"{prefix}.index_plus_one"
    )
    cell_count = _set_ui(context, FULL_TAIL_CELL_COUNT, f"{prefix}.cell_count")
    two = _set_ui(context, 2, f"{prefix}.two")
    left_numerator = _mul(
        context, domain_length, cell_index_mp, f"{prefix}.left_numerator"
    )
    left = _div(context, left_numerator, cell_count, f"{prefix}.left")
    trace.record(f"{prefix}.left")
    right_numerator = _mul(
        context,
        domain_length,
        cell_index_plus_one,
        f"{prefix}.right_numerator",
    )
    right = _div(context, right_numerator, cell_count, f"{prefix}.right")
    trace.record(f"{prefix}.right")
    sum_endpoints = _add(context, left, right, f"{prefix}.sum_endpoints")
    mid = _div(context, sum_endpoints, two, f"{prefix}.mid")
    trace.record(f"{prefix}.mid")
    difference_endpoints = _sub(
        context, right, left, f"{prefix}.difference_endpoints"
    )
    half = _div(context, difference_endpoints, two, f"{prefix}.half")
    trace.record(f"{prefix}.half")
    return mid, half


def _mapped_points(
    context: gmpy2.context,
    *,
    cell_index: int,
    mid: gmpy2.mpfr,
    half: gmpy2.mpfr,
    fixture: _FrozenFixtureValues,
    trace: _ChronologyTrace,
) -> tuple[gmpy2.mpfr, ...]:
    points: list[gmpy2.mpfr] = []
    for fixture_index in range(GL_POINT_COUNT):
        prefix = f"cell[{cell_index}].point[{fixture_index}]"
        node_product = _mul(
            context,
            half,
            fixture.nodes[fixture_index],
            f"{prefix}.node_product",
        )
        point = _add(context, mid, node_product, f"{prefix}.point")
        points.append(_copy(context, point, f"{prefix}.store"))
        trace.record(prefix)
    trace.record(f"cell[{cell_index}].point_pass.complete")
    return tuple(points)


def _tail_cell_basis_table(
    context: gmpy2.context,
    *,
    cell_index: int,
    points: tuple[gmpy2.mpfr, ...],
    trace: _ChronologyTrace,
) -> list[list[gmpy2.mpfr]]:
    if len(points) != GL_POINT_COUNT:
        raise TailMassOperatorError("tail_mass_point_table_shape_invalid")
    table: list[list[gmpy2.mpfr]] = []
    for fixture_index, point in enumerate(points):
        prefix = f"cell[{cell_index}].basis[{fixture_index}]"
        y = _copy(context, point, f"{prefix}.y")
        two = _set_ui(context, 2, f"{prefix}.two")
        two_y = _mul(context, two, y, f"{prefix}.two_y")
        one = _set_ui(context, 1, f"{prefix}.one")
        t = _sub(context, two_y, one, f"{prefix}.t")
        row = [_set_ui(context, 1, f"{prefix}.T[0]")]
        trace.record(f"cell[{cell_index}].T[{fixture_index},0]")
        row.append(_copy(context, t, f"{prefix}.T[1]"))
        trace.record(f"cell[{cell_index}].T[{fixture_index},1]")
        for n in range(1, CHEBYSHEV_TERM_COUNT - 1):
            two_t = _mul(context, two, t, f"{prefix}.n[{n}].two_t")
            product = _mul(
                context, two_t, row[n], f"{prefix}.n[{n}].product"
            )
            next_value = _sub(
                context, product, row[n - 1], f"{prefix}.T[{n + 1}]"
            )
            row.append(next_value)
            trace.record(f"cell[{cell_index}].T[{fixture_index},{n + 1}]")
        if len(row) != CHEBYSHEV_TERM_COUNT:
            raise TailMassOperatorError("tail_mass_basis_row_shape_invalid")
        table.append(row)
    trace.record(f"cell[{cell_index}].basis_table.complete")
    return table


def _tail_node_term(
    context: gmpy2.context,
    *,
    cell_index: int,
    fixture_index: int,
    y_value: gmpy2.mpfr,
    mapped_weight_value: gmpy2.mpfr,
    T_row: list[gmpy2.mpfr],
    projected_l2_nu: float,
    state: tuple[float, ...],
    U: float,
    U1: float,
) -> _MpfrDual:
    if len(T_row) != CHEBYSHEV_TERM_COUNT:
        raise TailMassOperatorError("tail_mass_basis_row_shape_invalid")
    prefix = f"cell[{cell_index}].node[{fixture_index}]"
    y = _dual_from_mpfr(context, y_value, f"{prefix}.y")
    nu = _dual_set_d(context, projected_l2_nu, f"{prefix}.nu")
    minus_two = _dual_set_si(context, -2, f"{prefix}.minus_two")
    minus_two_nu = _dual_mul(
        context, minus_two, nu, f"{prefix}.minus_two_nu"
    )
    kappa = _dual_sqrt(context, minus_two_nu, f"{prefix}.kappa")
    if kappa.value <= 0:
        raise TailMassOperatorError("tail_mass_kappa_domain_invalid")
    C = _dual_unknown(context, state[0], 0, f"{prefix}.C")
    C_over_kappa = _dual_div(
        context, C, kappa, f"{prefix}.C_over_kappa"
    )
    one = _dual_set_ui(context, 1, f"{prefix}.one")
    sigma = _dual_sub(context, C_over_kappa, one, f"{prefix}.sigma")
    radius = _dual_set_ui(context, RADIUS, f"{prefix}.R")
    a = _dual_mul(context, kappa, radius, f"{prefix}.a")
    H1 = _dual_set_d(context, U, f"{prefix}.H1")
    negative_a = _dual_neg(context, a, f"{prefix}.negative_a")
    lift_coefficient = _dual_add(
        context, negative_a, sigma, f"{prefix}.lift_coefficient"
    )
    lift_product = _dual_mul(
        context, lift_coefficient, H1, f"{prefix}.lift_product"
    )
    join_U1 = _dual_set_d(context, U1, f"{prefix}.U1")
    radius_U1 = _dual_mul(
        context, radius, join_U1, f"{prefix}.radius_U1"
    )
    Hy1 = _dual_sub(context, lift_product, radius_U1, f"{prefix}.Hy1")

    A = _dual_zero(context, f"{prefix}.A.zero")
    for n in range(CHEBYSHEV_TERM_COUNT):
        Tn = _dual_from_mpfr(context, T_row[n], f"{prefix}.A[{n}].Tn")
        hn = _dual_unknown(context, state[1 + n], 1 + n, f"{prefix}.A[{n}].hn")
        product = _dual_mul(context, hn, Tn, f"{prefix}.A[{n}].product")
        A = _dual_add(context, A, product, f"{prefix}.A[{n}].next")

    one_minus_y = _dual_sub(context, one, y, f"{prefix}.one_minus_y")
    one_minus_y_squared = _dual_mul(
        context, one_minus_y, one_minus_y, f"{prefix}.one_minus_y_squared"
    )
    correction = _dual_mul(
        context, one_minus_y_squared, A, f"{prefix}.correction"
    )
    y_minus_one = _dual_sub(context, y, one, f"{prefix}.y_minus_one")
    linear_product = _dual_mul(
        context, Hy1, y_minus_one, f"{prefix}.linear_product"
    )
    linear = _dual_add(context, H1, linear_product, f"{prefix}.linear")
    H = _dual_add(context, linear, correction, f"{prefix}.H")

    x = _dual_div(context, radius, y, f"{prefix}.x")
    x_minus_radius = _dual_sub(
        context, x, radius, f"{prefix}.x_minus_radius"
    )
    x_over_radius = _dual_div(
        context, x, radius, f"{prefix}.x_over_radius"
    )
    kappa_distance = _dual_mul(
        context, kappa, x_minus_radius, f"{prefix}.kappa_distance"
    )
    decay = _dual_neg(context, kappa_distance, f"{prefix}.decay")
    logarithm = _dual_log(context, x_over_radius, f"{prefix}.log_x_over_radius")
    logarithmic_term = _dual_mul(
        context, sigma, logarithm, f"{prefix}.logarithmic_term"
    )
    exponent = _dual_add(context, decay, logarithmic_term, f"{prefix}.exponent")
    B = _dual_exp(context, exponent, f"{prefix}.B")
    E = _dual_mul(context, B, B, f"{prefix}.E")
    y2 = _dual_mul(context, y, y, f"{prefix}.y2")
    y4 = _dual_mul(context, y2, y2, f"{prefix}.y4")
    H2 = _dual_mul(context, H, H, f"{prefix}.H2")
    radius_cubed = _dual_set_ui(context, RADIUS**3, f"{prefix}.R3")
    radius_cubed_E = _dual_mul(
        context, radius_cubed, E, f"{prefix}.R3_E"
    )
    numerator = _dual_mul(
        context, radius_cubed_E, H2, f"{prefix}.numerator"
    )
    integrand = _dual_div(context, numerator, y4, f"{prefix}.integrand")
    mapped_weight = _dual_from_mpfr(
        context, mapped_weight_value, f"{prefix}.mapped_weight"
    )
    return _dual_mul(context, mapped_weight, integrand, f"{prefix}.term")


def _tail_node_value(
    context: gmpy2.context,
    *,
    cell_index: int,
    fixture_index: int,
    y_value: gmpy2.mpfr,
    mapped_weight_value: gmpy2.mpfr,
    T_row: list[gmpy2.mpfr],
    projected_l2_nu: float,
    state: tuple[float, ...],
    U: float,
    U1: float,
) -> gmpy2.mpfr:
    """Evaluate only the primal mass integrand in the frozen operation order."""

    if len(T_row) != CHEBYSHEV_TERM_COUNT:
        raise TailMassOperatorError("tail_mass_basis_row_shape_invalid")
    prefix = f"cell[{cell_index}].node[{fixture_index}].residual_only"
    y = _copy(context, y_value, f"{prefix}.y")
    nu = _set_d(context, projected_l2_nu, f"{prefix}.nu")
    minus_two = _set_si(context, -2, f"{prefix}.minus_two")
    minus_two_nu = _mul(context, minus_two, nu, f"{prefix}.minus_two_nu")
    kappa = _sqrt(context, minus_two_nu, f"{prefix}.kappa")
    if kappa <= 0:
        raise TailMassOperatorError("tail_mass_kappa_domain_invalid")
    C = _set_d(context, state[0], f"{prefix}.C")
    C_over_kappa = _div(context, C, kappa, f"{prefix}.C_over_kappa")
    one = _set_ui(context, 1, f"{prefix}.one")
    sigma = _sub(context, C_over_kappa, one, f"{prefix}.sigma")
    radius = _set_ui(context, RADIUS, f"{prefix}.R")
    a = _mul(context, kappa, radius, f"{prefix}.a")
    H1 = _set_d(context, U, f"{prefix}.H1")
    negative_a = _neg(context, a, f"{prefix}.negative_a")
    lift_coefficient = _add(
        context, negative_a, sigma, f"{prefix}.lift_coefficient"
    )
    lift_product = _mul(
        context, lift_coefficient, H1, f"{prefix}.lift_product"
    )
    join_U1 = _set_d(context, U1, f"{prefix}.U1")
    radius_U1 = _mul(context, radius, join_U1, f"{prefix}.radius_U1")
    Hy1 = _sub(context, lift_product, radius_U1, f"{prefix}.Hy1")

    A = _positive_zero(context, f"{prefix}.A.zero")
    for n in range(CHEBYSHEV_TERM_COUNT):
        Tn = _copy(context, T_row[n], f"{prefix}.A[{n}].Tn")
        hn = _set_d(context, state[1 + n], f"{prefix}.A[{n}].hn")
        product = _mul(context, hn, Tn, f"{prefix}.A[{n}].product")
        A = _add(context, A, product, f"{prefix}.A[{n}].next")

    one_minus_y = _sub(context, one, y, f"{prefix}.one_minus_y")
    one_minus_y_squared = _mul(
        context, one_minus_y, one_minus_y, f"{prefix}.one_minus_y_squared"
    )
    correction = _mul(
        context, one_minus_y_squared, A, f"{prefix}.correction"
    )
    y_minus_one = _sub(context, y, one, f"{prefix}.y_minus_one")
    linear_product = _mul(
        context, Hy1, y_minus_one, f"{prefix}.linear_product"
    )
    linear = _add(context, H1, linear_product, f"{prefix}.linear")
    H = _add(context, linear, correction, f"{prefix}.H")

    x = _div(context, radius, y, f"{prefix}.x")
    x_minus_radius = _sub(context, x, radius, f"{prefix}.x_minus_radius")
    x_over_radius = _div(context, x, radius, f"{prefix}.x_over_radius")
    kappa_distance = _mul(
        context, kappa, x_minus_radius, f"{prefix}.kappa_distance"
    )
    decay = _neg(context, kappa_distance, f"{prefix}.decay")
    logarithm = _log(context, x_over_radius, f"{prefix}.log_x_over_radius")
    logarithmic_term = _mul(
        context, sigma, logarithm, f"{prefix}.logarithmic_term"
    )
    exponent = _add(context, decay, logarithmic_term, f"{prefix}.exponent")
    B = _exp(context, exponent, f"{prefix}.B")
    E = _mul(context, B, B, f"{prefix}.E")
    y2 = _mul(context, y, y, f"{prefix}.y2")
    y4 = _mul(context, y2, y2, f"{prefix}.y4")
    H2 = _mul(context, H, H, f"{prefix}.H2")
    radius_cubed = _set_ui(context, RADIUS**3, f"{prefix}.R3")
    radius_cubed_E = _mul(context, radius_cubed, E, f"{prefix}.R3_E")
    numerator = _mul(context, radius_cubed_E, H2, f"{prefix}.numerator")
    integrand = _div(context, numerator, y4, f"{prefix}.integrand")
    mapped_weight = _copy(
        context, mapped_weight_value, f"{prefix}.mapped_weight"
    )
    return _mul(context, mapped_weight, integrand, f"{prefix}.term")


def _clear_basis_table(
    context: gmpy2.context,
    *,
    cell_index: int,
    table: list[list[gmpy2.mpfr]],
    trace: _ChronologyTrace,
) -> int:
    if len(table) != GL_POINT_COUNT or any(
        len(row) != CHEBYSHEV_TERM_COUNT for row in table
    ):
        raise TailMassOperatorError("tail_mass_basis_table_shape_invalid")
    cleared = 0
    for fixture_index in range(GL_POINT_COUNT):
        for n in range(CHEBYSHEV_TERM_COUNT):
            table[fixture_index][n] = _positive_zero(
                context, f"cell[{cell_index}].clear[{fixture_index},{n}]"
            )
            trace.record(f"cell[{cell_index}].clear[{fixture_index},{n}]")
            cleared += 1
    trace.record(f"cell[{cell_index}].basis_table.cleared")
    return cleared


def _finish_f64(value: float, operation: str) -> float:
    if not math.isfinite(value):
        raise TailMassOperatorError(
            "tail_mass_binary64_nonfinite_intermediate", operation
        )
    return 0.0 if value == 0.0 else value


def _f64_sub(left: float, right: float, operation: str) -> float:
    return _finish_f64(left - right, operation)


def _f64_neg(value: float, operation: str) -> float:
    return _finish_f64(-value, operation)


def _evaluate_tail_mass_graph(
    *,
    projected_l2_state: tuple[float, ...],
    join_barriers: object,
    core_continuation: _SyntheticCoreContinuation | None,
    state: tuple[float, ...],
    synthetic_cell_count: int,
    synthetic_dependencies_used: bool,
    _bound_core64: object = None,
    _bound_authority: object = None,
    _bound_join_owner: object = None,
) -> FrozenTailMassDiagnostic:
    """Run the dual graph; bound callers require this exact module capability."""

    with _binary64_environment.nearest_binary64_environment():
        with _owned_mpfr256_context() as context:
            records = _verify_bound_sources_and_load_records()
            bound_execution = _bound_authority is _BOUND_MASS_AUTHORITY
            if bound_execution:
                if (
                    synthetic_dependencies_used is not False
                    or synthetic_cell_count != FULL_TAIL_CELL_COUNT
                    or core_continuation is not None
                    or _bound_join_owner is None
                ):
                    raise TailMassOperatorError("tail_mass_bound_execution_invalid")
                core64 = _validate_f64(_bound_core64, "bound_core64")
                if core64 < 0.0:
                    raise TailMassOperatorError("tail_mass_core64_domain_invalid")
            else:
                if (
                    _bound_authority is not None
                    or _bound_core64 is not None
                    or _bound_join_owner is not None
                ):
                    raise TailMassOperatorError("tail_mass_bound_authority_invalid")
                if synthetic_dependencies_used is not True:
                    raise TailMassOperatorError(
                        "tail_mass_synthetic_flag_invalid",
                        repr(synthetic_dependencies_used),
                    )
                if (
                    type(synthetic_cell_count) is not int
                    or not 1 <= synthetic_cell_count <= FULL_TAIL_CELL_COUNT
                ):
                    raise TailMassOperatorError(
                        "tail_mass_synthetic_cell_count_invalid",
                        repr(synthetic_cell_count),
                    )
                core64 = _validate_synthetic_core(core_continuation)
            selected_state = _validate_tail_state(state)
            projected_state, nu = _validate_projected_state(projected_l2_state)
            barriers = (
                _validate_owned_join(_bound_join_owner, join_barriers)
                if bound_execution
                else _validate_synthetic_join(join_barriers)
            )
            fixture = _materialize_fixture_values(context, records)
            trace = _ChronologyTrace()
            trace.record("fixture.materialized")
            tail_sum = _dual_zero(context, "tail_sum.zero")
            trace.record("tail_sum.zero")
            points_completed = 0
            basis_entries_completed = 0
            basis_entries_cleared = 0
            node_integrands_completed = 0

            U, U1, _, _ = barriers
            for cell_index in range(synthetic_cell_count):
                mid, half = _mapped_cell(context, cell_index, trace)
                points = _mapped_points(
                    context,
                    cell_index=cell_index,
                    mid=mid,
                    half=half,
                    fixture=fixture,
                    trace=trace,
                )
                points_completed += len(points)
                table = _tail_cell_basis_table(
                    context,
                    cell_index=cell_index,
                    points=points,
                    trace=trace,
                )
                basis_entries_completed += GL_POINT_COUNT * CHEBYSHEV_TERM_COUNT
                for fixture_index in range(GL_POINT_COUNT):
                    prefix = f"cell[{cell_index}].node[{fixture_index}]"
                    mapped_weight = _mul(
                        context,
                        half,
                        fixture.weights[fixture_index],
                        f"{prefix}.mapped_weight_mpfr",
                    )
                    trace.record(f"{prefix}.mapped_weight")
                    term = _tail_node_term(
                        context,
                        cell_index=cell_index,
                        fixture_index=fixture_index,
                        y_value=points[fixture_index],
                        mapped_weight_value=mapped_weight,
                        T_row=table[fixture_index],
                        projected_l2_nu=nu,
                        state=selected_state,
                        U=U,
                        U1=U1,
                    )
                    node_integrands_completed += 1
                    trace.record(f"{prefix}.integrand_term.complete")
                    tail_sum = _dual_add(
                        context, tail_sum, term, f"{prefix}.tail_sum.next"
                    )
                    trace.record(f"{prefix}.tail_sum.accumulated")
                basis_entries_cleared += _clear_basis_table(
                    context,
                    cell_index=cell_index,
                    table=table,
                    trace=trace,
                )
                trace.record(f"cell[{cell_index}].complete")

            _validate_dual(tail_sum, "tail_sum.complete")
            barrier_labels: list[str] = []
            tail64 = _get_d(context, tail_sum.value, "barrier.tail.v")
            barrier_labels.append("tail.v")
            trace.record("barrier.tail.v")
            active_derivatives: list[float] = []
            for derivative_index in range(ACTIVE_MASS_DERIVATIVE_COUNT):
                label = "C" if derivative_index == 0 else f"h{derivative_index - 1}"
                value = _get_d(
                    context,
                    tail_sum.derivatives[derivative_index],
                    f"barrier.tail.d[{label}]",
                )
                active_derivatives.append(value)
                barrier_labels.append(f"tail.d[{label}]")
                trace.record(f"barrier.tail.d[{label}]")
            q_derivatives: list[float] = []
            for q_index in range(TAIL_NODE_COUNT):
                derivative_index = ACTIVE_MASS_DERIVATIVE_COUNT + q_index
                mpfr_component = tail_sum.derivatives[derivative_index]
                if not gmpy2.is_zero(mpfr_component) or gmpy2.is_signed(mpfr_component):
                    raise TailMassOperatorError(
                        "tail_mass_q_derivative_barrier_invalid", str(q_index)
                    )
                q_derivatives.append(0.0)
                barrier_labels.append(f"tail.d[q{q_index}].positive_zero")
                trace.record(f"barrier.tail.d[q{q_index}].positive_zero")
            derivatives = tuple((*active_derivatives, *q_derivatives))
            if len(derivatives) != TAIL_UNKNOWN_COUNT:
                raise TailMassOperatorError(
                    "tail_mass_derivative_barrier_shape_invalid"
                )

            c_minus_core = _f64_sub(
                selected_state[0], core64, "mass.c_minus_core"
            )
            trace.record("binary64.mass.c_minus_core")
            mass = _f64_sub(c_minus_core, tail64, "mass.residual")
            trace.record("binary64.mass.residual")
            jacobian: list[float] = []
            jacobian.append(_f64_sub(1.0, derivatives[0], "mass.J[0]"))
            trace.record("binary64.mass.J[0]")
            for h_index in range(TAIL_NODE_COUNT):
                column = 1 + h_index
                jacobian.append(
                    _f64_neg(derivatives[column], f"mass.J[{column}]")
                )
                trace.record(f"binary64.mass.J[{column}]")
            for q_index in range(TAIL_NODE_COUNT):
                column = ACTIVE_MASS_DERIVATIVE_COUNT + q_index
                jacobian.append(0.0)
                trace.record(f"binary64.mass.J[{column}].positive_zero")
            frozen_jacobian = tuple(jacobian)
            if (
                len(frozen_jacobian) != TAIL_UNKNOWN_COUNT
                or any(
                    not math.isfinite(component) or _negative_zero(component)
                    for component in (tail64, mass, *derivatives, *frozen_jacobian)
                )
                or any(_f64_bits(component) != bytes(8) for component in derivatives[33:])
                or any(
                    _f64_bits(component) != bytes(8)
                    for component in frozen_jacobian[33:]
                )
            ):
                raise TailMassOperatorError("tail_mass_result_invariant_invalid")

            state_hash = _f64_tuple_sha256(STATE_HASH_DOMAIN, selected_state)
            projected_hash = _f64_tuple_sha256(
                PROJECTED_STATE_HASH_DOMAIN, projected_state
            )
            join_hash = _f64_tuple_sha256(JOIN_HASH_DOMAIN, barriers)
            chronology_count = trace.count
            chronology_sha256 = trace.hexdigest()

    full_observed = synthetic_cell_count == FULL_TAIL_CELL_COUNT
    return FrozenTailMassDiagnostic(
        full_tail_cell_count=FULL_TAIL_CELL_COUNT,
        synthetic_cells_completed=synthetic_cell_count,
        gl_point_count=GL_POINT_COUNT,
        points_completed=points_completed,
        basis_entries_completed=basis_entries_completed,
        basis_entries_cleared=basis_entries_cleared,
        node_integrands_completed=node_integrands_completed,
        tail_unknown_count=TAIL_UNKNOWN_COUNT,
        active_mass_derivative_count=ACTIVE_MASS_DERIVATIVE_COUNT,
        tail_unknown_order=TAIL_UNKNOWN_ORDER,
        tail64=tail64,
        tail64_bits=_f64_hex(tail64),
        tail_derivative64=derivatives,
        tail_derivative64_bits=tuple(_f64_hex(value) for value in derivatives),
        mass_residual=mass,
        mass_residual_bits=_f64_hex(mass),
        mass_jacobian_row=frozen_jacobian,
        mass_jacobian_row_bits=tuple(
            _f64_hex(value) for value in frozen_jacobian
        ),
        barrier_order=tuple(barrier_labels),
        get_d_barrier_count=1 + ACTIVE_MASS_DERIVATIVE_COUNT,
        exact_q_zero_barrier_count=TAIL_NODE_COUNT,
        chronology_event_count=chronology_count,
        chronology_sha256=chronology_sha256,
        state_f64le_sha256=state_hash,
        projected_state_f64le_sha256=projected_hash,
        join_f64le_sha256=join_hash,
        core64=core64,
        core64_bits=_f64_hex(core64),
        projected_l2_nu=nu,
        projected_l2_nu_bits=_f64_hex(nu),
        primary_numerics_policy_sha256=PRIMARY_NUMERICS_POLICY_SHA256,
        primary_numerics_policy_canonical_size_bytes=(
            PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        ),
        primary_numerics_policy_source_sha256=(
            PRIMARY_NUMERICS_POLICY_SOURCE_SHA256
        ),
        primary_numerics_policy_source_size_bytes=(
            PRIMARY_NUMERICS_POLICY_SOURCE_SIZE_BYTES
        ),
        binary64_environment_source_sha256=(
            BINARY64_ENVIRONMENT_SOURCE_SHA256
        ),
        binary64_environment_source_size_bytes=(
            BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        ),
        fixture_manifest_sha256=GL256_MANIFEST_SHA256,
        fixture_manifest_size_bytes=GL256_MANIFEST_SIZE_BYTES,
        fixture_records_sha256=GL256_RECORDS_SHA256,
        fixture_records_size_bytes=GL256_RECORDS_SIZE_BYTES,
        fixture_generator_sha256=GL256_GENERATOR_SHA256,
        fixture_generator_size_bytes=GL256_GENERATOR_SIZE_BYTES,
        fixture_independent_test_sha256=GL256_INDEPENDENT_TEST_SHA256,
        fixture_independent_test_size_bytes=GL256_INDEPENDENT_TEST_SIZE_BYTES,
        core_integral_continuation_source_sha256=(
            CORE_INTEGRAL_CONTINUATION_SOURCE_SHA256
        ),
        core_integral_continuation_source_size_bytes=(
            CORE_INTEGRAL_CONTINUATION_SOURCE_SIZE_BYTES
        ),
        core_integral_continuation_source_status=(
            CORE_INTEGRAL_CONTINUATION_SOURCE_STATUS
        ),
        join_extraction_source_sha256=JOIN_EXTRACTION_SOURCE_SHA256,
        join_extraction_source_size_bytes=JOIN_EXTRACTION_SOURCE_SIZE_BYTES,
        join_extraction_source_status=JOIN_EXTRACTION_SOURCE_STATUS,
        combined_tail_operator_source_sha256=(
            COMBINED_TAIL_OPERATOR_SOURCE_SHA256
        ),
        combined_tail_operator_source_size_bytes=(
            COMBINED_TAIL_OPERATOR_SOURCE_SIZE_BYTES
        ),
        combined_tail_operator_source_status=(
            COMBINED_TAIL_OPERATOR_SOURCE_STATUS
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
        synthetic_reduced_cell_graph_executed=(
            synthetic_dependencies_used and not full_observed
        ),
        full_4096_cell_execution_observed=full_observed,
        tail_sum_is_partial=not full_observed,
    )


def _evaluate_bound_tail_mass_graph(
    *,
    projected_l2_state: tuple[float, ...],
    owner_join_module: object,
    join_barriers: object,
    retained_core64: float,
    state: tuple[float, ...],
) -> FrozenTailMassDiagnostic:
    """Private authenticated full-4096 dual path; no public adapter can mint it."""

    return _evaluate_tail_mass_graph(
        projected_l2_state=projected_l2_state,
        join_barriers=join_barriers,
        core_continuation=None,
        state=state,
        synthetic_cell_count=FULL_TAIL_CELL_COUNT,
        synthetic_dependencies_used=False,
        _bound_core64=retained_core64,
        _bound_authority=_BOUND_MASS_AUTHORITY,
        _bound_join_owner=owner_join_module,
    )


def _evaluate_tail_mass_residual_graph(
    *,
    projected_l2_state: tuple[float, ...],
    join_barriers: object,
    core_continuation: _SyntheticCoreContinuation | None,
    state: tuple[float, ...],
    synthetic_cell_count: int,
    synthetic_dependencies_used: bool,
    _bound_core64: object = None,
    _bound_authority: object = None,
    _bound_join_owner: object = None,
) -> _FrozenTailMassResidual:
    """Evaluate F_mass only; no dual, derivative barrier, or J is materialized."""

    with _binary64_environment.nearest_binary64_environment():
        with _owned_mpfr256_context() as context:
            records = _verify_bound_sources_and_load_records()
            bound_execution = _bound_authority is _BOUND_MASS_AUTHORITY
            if bound_execution:
                if (
                    synthetic_dependencies_used is not False
                    or synthetic_cell_count != FULL_TAIL_CELL_COUNT
                    or core_continuation is not None
                    or _bound_join_owner is None
                ):
                    raise TailMassOperatorError("tail_mass_bound_execution_invalid")
                core64 = _validate_f64(_bound_core64, "bound_core64")
                if core64 < 0.0:
                    raise TailMassOperatorError("tail_mass_core64_domain_invalid")
            else:
                if (
                    _bound_authority is not None
                    or _bound_core64 is not None
                    or _bound_join_owner is not None
                ):
                    raise TailMassOperatorError("tail_mass_bound_authority_invalid")
                if synthetic_dependencies_used is not True:
                    raise TailMassOperatorError(
                        "tail_mass_synthetic_flag_invalid",
                        repr(synthetic_dependencies_used),
                    )
                if (
                    type(synthetic_cell_count) is not int
                    or not 1 <= synthetic_cell_count <= FULL_TAIL_CELL_COUNT
                ):
                    raise TailMassOperatorError(
                        "tail_mass_synthetic_cell_count_invalid",
                        repr(synthetic_cell_count),
                    )
                core64 = _validate_synthetic_core(core_continuation)

            selected_state = _validate_tail_state(state)
            projected_state, nu = _validate_projected_state(projected_l2_state)
            barriers = (
                _validate_owned_join(_bound_join_owner, join_barriers)
                if bound_execution
                else _validate_synthetic_join(join_barriers)
            )
            fixture = _materialize_fixture_values(context, records)
            trace = _ChronologyTrace()
            trace.record("fixture.materialized")
            tail_sum = _positive_zero(context, "residual_only.tail_sum.zero")
            trace.record("residual_only.tail_sum.zero")
            points_completed = 0
            basis_entries_completed = 0
            basis_entries_cleared = 0
            node_integrands_completed = 0

            U, U1, _, _ = barriers
            for cell_index in range(synthetic_cell_count):
                mid, half = _mapped_cell(context, cell_index, trace)
                points = _mapped_points(
                    context,
                    cell_index=cell_index,
                    mid=mid,
                    half=half,
                    fixture=fixture,
                    trace=trace,
                )
                points_completed += len(points)
                table = _tail_cell_basis_table(
                    context,
                    cell_index=cell_index,
                    points=points,
                    trace=trace,
                )
                basis_entries_completed += GL_POINT_COUNT * CHEBYSHEV_TERM_COUNT
                for fixture_index in range(GL_POINT_COUNT):
                    prefix = f"cell[{cell_index}].node[{fixture_index}]"
                    mapped_weight = _mul(
                        context,
                        half,
                        fixture.weights[fixture_index],
                        f"{prefix}.residual_only.mapped_weight_mpfr",
                    )
                    trace.record(f"{prefix}.residual_only.mapped_weight")
                    term = _tail_node_value(
                        context,
                        cell_index=cell_index,
                        fixture_index=fixture_index,
                        y_value=points[fixture_index],
                        mapped_weight_value=mapped_weight,
                        T_row=table[fixture_index],
                        projected_l2_nu=nu,
                        state=selected_state,
                        U=U,
                        U1=U1,
                    )
                    node_integrands_completed += 1
                    trace.record(f"{prefix}.residual_only.integrand_term.complete")
                    tail_sum = _add(
                        context,
                        tail_sum,
                        term,
                        f"{prefix}.residual_only.tail_sum.next",
                    )
                    trace.record(f"{prefix}.residual_only.tail_sum.accumulated")
                basis_entries_cleared += _clear_basis_table(
                    context,
                    cell_index=cell_index,
                    table=table,
                    trace=trace,
                )
                trace.record(f"cell[{cell_index}].residual_only.complete")

            if not gmpy2.is_finite(tail_sum):
                raise TailMassOperatorError("tail_mass_residual_only_sum_invalid")
            tail64 = _get_d(context, tail_sum, "barrier.residual_only.tail.v")
            trace.record("barrier.residual_only.tail.v")
            c_minus_core = _f64_sub(
                selected_state[0], core64, "residual_only.mass.c_minus_core"
            )
            trace.record("binary64.residual_only.mass.c_minus_core")
            mass = _f64_sub(c_minus_core, tail64, "residual_only.mass.residual")
            trace.record("binary64.residual_only.mass.residual")
            if any(
                not math.isfinite(component) or _negative_zero(component)
                for component in (tail64, mass)
            ):
                raise TailMassOperatorError(
                    "tail_mass_residual_only_result_invariant_invalid"
                )
            state_hash = _f64_tuple_sha256(STATE_HASH_DOMAIN, selected_state)
            projected_hash = _f64_tuple_sha256(
                PROJECTED_STATE_HASH_DOMAIN, projected_state
            )
            join_hash = _f64_tuple_sha256(JOIN_HASH_DOMAIN, barriers)
            chronology_count = trace.count
            chronology_sha256 = trace.hexdigest()

    full_observed = synthetic_cell_count == FULL_TAIL_CELL_COUNT
    return _FrozenTailMassResidual(
        full_tail_cell_count=FULL_TAIL_CELL_COUNT,
        cells_completed=synthetic_cell_count,
        gl_point_count=GL_POINT_COUNT,
        points_completed=points_completed,
        basis_entries_completed=basis_entries_completed,
        basis_entries_cleared=basis_entries_cleared,
        node_integrands_completed=node_integrands_completed,
        tail64=tail64,
        tail64_bits=_f64_hex(tail64),
        mass_residual=mass,
        mass_residual_bits=_f64_hex(mass),
        get_d_barrier_count=1,
        chronology_event_count=chronology_count,
        chronology_sha256=chronology_sha256,
        state_f64le_sha256=state_hash,
        projected_state_f64le_sha256=projected_hash,
        join_f64le_sha256=join_hash,
        core64=core64,
        core64_bits=_f64_hex(core64),
        projected_l2_nu=nu,
        projected_l2_nu_bits=_f64_hex(nu),
        synthetic_dependencies_used=synthetic_dependencies_used,
        full_4096_cell_execution_observed=full_observed,
        tail_sum_is_partial=not full_observed,
    )


def _evaluate_bound_tail_mass_residual_graph(
    *,
    projected_l2_state: tuple[float, ...],
    owner_join_module: object,
    join_barriers: object,
    retained_core64: float,
    state: tuple[float, ...],
) -> _FrozenTailMassResidual:
    """Private authenticated F-only full-4096 path."""

    return _evaluate_tail_mass_residual_graph(
        projected_l2_state=projected_l2_state,
        join_barriers=join_barriers,
        core_continuation=None,
        state=state,
        synthetic_cell_count=FULL_TAIL_CELL_COUNT,
        synthetic_dependencies_used=False,
        _bound_core64=retained_core64,
        _bound_authority=_BOUND_MASS_AUTHORITY,
        _bound_join_owner=owner_join_module,
    )


def _evaluate_policy_binary64_tail_dual_n3_fixture(
) -> tuple[float, tuple[float, ...]]:
    """Evaluate the policy's separate three-variable binary64 dual golden."""

    # This intentionally mirrors ``syntheticTailDualGolden`` in the bound
    # primary policy's independent validator.  It is not the MPFR256 mass
    # graph: every scalar and derivative primitive rounds in binary64 order.
    with _binary64_environment.nearest_binary64_environment():
        _verify_bound_sources_and_load_records()
        dimension = 3
        Dual3 = tuple[float, tuple[float, float, float]]

        def finish(value: float, operation: str) -> float:
            return _finish_f64(value, f"n3.{operation}")

        def constant(value: float) -> Dual3:
            return (finish(value, "constant"), (0.0, 0.0, 0.0))

        def variable(value: float, index: int) -> Dual3:
            return (
                finish(value, "variable"),
                tuple(1.0 if k == index else 0.0 for k in range(dimension)),
            )

        def add(left: Dual3, right: Dual3) -> Dual3:
            return (
                finish(left[0] + right[0], "add.v"),
                tuple(
                    finish(left[1][k] + right[1][k], f"add.d[{k}]")
                    for k in range(dimension)
                ),
            )

        def subtract(left: Dual3, right: Dual3) -> Dual3:
            return (
                finish(left[0] - right[0], "subtract.v"),
                tuple(
                    finish(
                        left[1][k] - right[1][k], f"subtract.d[{k}]"
                    )
                    for k in range(dimension)
                ),
            )

        def negate(value: Dual3) -> Dual3:
            return (
                finish(-value[0], "negate.v"),
                tuple(
                    finish(-value[1][k], f"negate.d[{k}]")
                    for k in range(dimension)
                ),
            )

        def multiply(left: Dual3, right: Dual3) -> Dual3:
            return (
                finish(left[0] * right[0], "multiply.v"),
                tuple(
                    finish(
                        finish(
                            left[1][k] * right[0],
                            f"multiply.left.d[{k}]",
                        )
                        + finish(
                            left[0] * right[1][k],
                            f"multiply.right.d[{k}]",
                        ),
                        f"multiply.d[{k}]",
                    )
                    for k in range(dimension)
                ),
            )

        def divide(numerator: Dual3, denominator: Dual3) -> Dual3:
            denominator_squared = finish(
                denominator[0] * denominator[0], "divide.denominator_squared"
            )
            return (
                finish(numerator[0] / denominator[0], "divide.v"),
                tuple(
                    finish(
                        finish(
                            finish(
                                numerator[1][k] * denominator[0],
                                f"divide.left.d[{k}]",
                            )
                            - finish(
                                numerator[0] * denominator[1][k],
                                f"divide.right.d[{k}]",
                            ),
                            f"divide.numerator.d[{k}]",
                        )
                        / denominator_squared,
                        f"divide.d[{k}]",
                    )
                    for k in range(dimension)
                ),
            )

        def exponential(value: Dual3) -> Dual3:
            primal = finish(math.exp(value[0]), "exp.v")
            return (
                primal,
                tuple(
                    finish(primal * value[1][k], f"exp.d[{k}]")
                    for k in range(dimension)
                ),
            )

        def logarithm(value: Dual3) -> Dual3:
            return (
                finish(math.log(value[0]), "log.v"),
                tuple(
                    finish(value[1][k] / value[0], f"log.d[{k}]")
                    for k in range(dimension)
                ),
            )

        C = variable(_validate_f64(3.0, "n3.C"), 0)
        h0 = variable(_validate_f64(4.0, "n3.h0"), 1)
        variable(_validate_f64(7.0, "n3.q0"), 2)
        radius = constant(2.0)
        y = constant(0.5)
        kappa = constant(1.0)
        one = constant(1.0)
        sigma = subtract(divide(C, kappa), one)
        a = multiply(kappa, radius)
        H1 = constant(1.0)
        U1 = constant(0.0)
        Hy1 = subtract(
            multiply(add(negate(a), sigma), H1), multiply(radius, U1)
        )
        one_minus_y = subtract(one, y)
        H = add(
            add(H1, multiply(Hy1, subtract(y, one))),
            multiply(multiply(one_minus_y, one_minus_y), h0),
        )
        x = divide(radius, y)
        exponent = add(
            negate(multiply(kappa, subtract(x, radius))),
            multiply(sigma, logarithm(divide(x, radius))),
        )
        B = exponential(exponent)
        E = multiply(B, B)
        y2 = multiply(y, y)
        y4 = multiply(y2, y2)
        H2 = multiply(H, H)
        R2 = multiply(radius, radius)
        R3 = multiply(R2, radius)
        integrand = divide(multiply(multiply(R3, E), H2), y4)
        if integrand[1][2] != 0.0 or _negative_zero(integrand[1][2]):
            raise TailMassOperatorError("tail_mass_n3_q_derivative_invalid")
        return integrand


def evaluate_primary_tail_mass_operator(
    *,
    projected_l2_state: object,
    join_barriers: object,
    core_continuation: object,
    state: object,
) -> FrozenTailMassDiagnostic:
    """Fail before input traversal until all three production sources are sealed."""

    del projected_l2_state, join_barriers, core_continuation, state
    with _binary64_environment.nearest_binary64_environment():
        records = _verify_bound_sources_and_load_records()
        del records
        _require_sealed_production_dependencies()


if (
    len(PRIMARY_NUMERICS_POLICY_SHA256) != 64
    or PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES != 80_055
    or len(PRIMARY_NUMERICS_POLICY_SOURCE_SHA256) != 64
    or PRIMARY_NUMERICS_POLICY_SOURCE_SIZE_BYTES != 103_911
    or len(BINARY64_ENVIRONMENT_SOURCE_SHA256) != 64
    or BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES != 14_980
    or len(GL256_MANIFEST_SHA256) != 64
    or GL256_MANIFEST_SIZE_BYTES != 5_390
    or len(GL256_RECORDS_SHA256) != 64
    or GL256_RECORDS_SIZE_BYTES != 77_842
    or len(GL256_GENERATOR_SHA256) != 64
    or GL256_GENERATOR_SIZE_BYTES != 25_877
    or len(GL256_INDEPENDENT_TEST_SHA256) != 64
    or GL256_INDEPENDENT_TEST_SIZE_BYTES != 31_699
    or CORE_INTEGRAL_CONTINUATION_SOURCE_SHA256 is not None
    or CORE_INTEGRAL_CONTINUATION_SOURCE_SIZE_BYTES is not None
    or JOIN_EXTRACTION_SOURCE_SHA256 is not None
    or JOIN_EXTRACTION_SOURCE_SIZE_BYTES is not None
    or COMBINED_TAIL_OPERATOR_SOURCE_SHA256 is not None
    or COMBINED_TAIL_OPERATOR_SOURCE_SIZE_BYTES is not None
    or PRODUCTION_DEPENDENCIES_SEALED
    or (RADIUS, PROJECTED_NODE_COUNT, PROJECTED_UNKNOWN_COUNT) != (32, 128, 257)
    or (TAIL_NODE_COUNT, TAIL_UNKNOWN_COUNT) != (32, 65)
    or ACTIVE_MASS_DERIVATIVE_COUNT != 33
    or (FULL_TAIL_CELL_COUNT, GL_POINT_COUNT, CHEBYSHEV_TERM_COUNT)
    != (4096, 256, 32)
    or MPFR_PRECISION_BITS != 256
    or MPFR_EMIN != -1_000_000
    or MPFR_EMAX != 1_000_000
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("spherical_seed_primary_tail_mass_operator_invariant")


__all__ = [
    "ACTIVE_MASS_DERIVATIVE_COUNT",
    "AUTHORITY_LOCKS",
    "BINARY64_ENVIRONMENT_SOURCE_SHA256",
    "BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES",
    "CHEBYSHEV_TERM_COUNT",
    "COMBINED_TAIL_OPERATOR_SOURCE_SHA256",
    "COMBINED_TAIL_OPERATOR_SOURCE_SIZE_BYTES",
    "COMBINED_TAIL_OPERATOR_SOURCE_STATUS",
    "CORE_INTEGRAL_CONTINUATION_SOURCE_SHA256",
    "CORE_INTEGRAL_CONTINUATION_SOURCE_SIZE_BYTES",
    "CORE_INTEGRAL_CONTINUATION_SOURCE_STATUS",
    "FULL_TAIL_CELL_COUNT",
    "FrozenTailMassDiagnostic",
    "GL256_GENERATOR_SHA256",
    "GL256_GENERATOR_SIZE_BYTES",
    "GL256_INDEPENDENT_TEST_SHA256",
    "GL256_INDEPENDENT_TEST_SIZE_BYTES",
    "GL256_MANIFEST_SHA256",
    "GL256_MANIFEST_SIZE_BYTES",
    "GL256_RECORDS_SHA256",
    "GL256_RECORDS_SIZE_BYTES",
    "GL_POINT_COUNT",
    "JOIN_EXTRACTION_SOURCE_SHA256",
    "JOIN_EXTRACTION_SOURCE_SIZE_BYTES",
    "JOIN_EXTRACTION_SOURCE_STATUS",
    "MAPPED_CELL_OPERATION_GRAPH",
    "MAPPED_POINT_AND_T_TABLE_GRAPH",
    "MPFR_DUAL_OPERATION_GRAPH",
    "MPFR_EMAX",
    "MPFR_EMIN",
    "MPFR_PRECISION_BITS",
    "MPFR_ROUNDING_MODE",
    "PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES",
    "PRIMARY_NUMERICS_POLICY_SHA256",
    "PRIMARY_NUMERICS_POLICY_SOURCE_SHA256",
    "PRIMARY_NUMERICS_POLICY_SOURCE_SIZE_BYTES",
    "PRODUCTION_DEPENDENCIES_SEALED",
    "TAIL_MASS_OPERATOR_VERSION",
    "TAIL_PRIMAL_AND_DUAL_GRAPH",
    "TAIL_SUM_AND_MASS_BARRIER_GRAPH",
    "TAIL_UNKNOWN_COUNT",
    "TAIL_UNKNOWN_ORDER",
    "TailMassOperatorError",
    "evaluate_primary_tail_mass_operator",
]
