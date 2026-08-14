"""Frozen MPFR256 GL256 integral of a projected L2 core field.

This module implements only the once-per-run core quadrature primitive from
the primary spherical-seed numerics policy.  It authenticates and parses the
final GL256 fixture, consumes the frozen N=128 spectral support plus a caller-
supplied projected-u role, and evaluates ``integral_0^32 x^2 u(x)^2 dx`` in
the literal cell/node chronology.  It does not solve or accept a candidate and
confers no replay, diagnostic, scientific, physical, or transport authority.
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


CORE_QUADRATURE_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_seed_primary_l2_core_gl256_quadrature/v1"
)
PRIMARY_NUMERICS_POLICY_SHA256: Final[str] = (
    "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4"
)
PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES: Final[int] = 80_055

SPECTRAL_SOURCE_SHA256: Final[str] = (
    "e9b2509b0c4a5d417250b3d145a648404cde440f12961d2faec1bc14758b78f7"
)
SPECTRAL_SOURCE_SIZE_BYTES: Final[int] = 19_045
SPECTRAL_N128_PAYLOAD_SHA256: Final[str] = (
    "9997d1ede86739b4716d838f287f5aaca27edba3fb52748ad0ac48a6e62f7c45"
)
SPECTRAL_PAYLOAD_GOLDEN_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed-primary-spectral/golden/v1\n"
)

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

L2_NODE_COUNT: Final[int] = 128
CORE_CELL_COUNT: Final[int] = 256
GL_POINT_COUNT: Final[int] = 256
CORE_DOMAIN_LENGTH: Final[int] = 32
MPFR_PRECISION_BITS: Final[int] = 256
MPFR_ROUNDING_MODE: Final[str] = "MPFR_RNDN"
MPFR_EMIN: Final[int] = -1_000_000
MPFR_EMAX: Final[int] = 1_000_000

MAPPED_CELL_OPERATION_GRAPH: Final[str] = (
    "cell_index_increasing;set_ui_domainLength_32_cellIndex_cellIndexPlusOne_"
    "cellCount_256_two;left_then_right_then_mid_then_half"
)
MAPPED_POINT_WEIGHT_OPERATION_GRAPH: Final[str] = (
    "fixture_index_increasing_point_pass_nodeProduct_then_point_then_set;"
    "after_all_256_points_fixture_index_increasing_weight_then_integrand"
)
CORE_PRIMAL_OPERATION_GRAPH: Final[str] = (
    "set_x_point;rho=x/(1+x);lowest_exact_L2_rho_match_set_d_u_or_j_0_"
    "through_127_literal_signed_barycentric_sums;mul_x2_then_u2_then_"
    "integrand_then_mappedWeight_term_then_coreSum_add_set"
)
CORE_SUM_BARRIER_GRAPH: Final[str] = (
    "one_positive_zero_coreSum;256_cells_times_256_nodes;one_final_get_d_RNDN"
)

PROJECTED_RHO_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/core-quadrature/projected-rho-f64le/v1\n"
)
PROJECTED_U_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-seed/core-quadrature/projected-u-f64le/v1\n"
)


class CoreQuadratureError(ValueError):
    """Fail-closed core-quadrature error with a stable code."""

    def __init__(self, code: str, detail: str = "root") -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


_REPOSITORY_ROOT: Final[Path] = Path(__file__).resolve().parents[3]
_SPECTRAL_PATH: Final[Path] = Path(__file__).resolve().with_name("spectral.py")
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
        raise CoreQuadratureError(
            "core_quadrature_bound_file_unavailable",
            f"{role}:{type(error).__name__}",
        ) from error
    if len(raw) != expected_size:
        raise CoreQuadratureError(
            "core_quadrature_bound_file_mismatch", f"{role}:size"
        )
    if hashlib.sha256(raw).hexdigest() != expected_sha256:
        raise CoreQuadratureError(
            "core_quadrature_bound_file_mismatch", f"{role}:sha256"
        )
    return raw


def _read_bound_spectral_source() -> bytes:
    return _read_bound_file(
        _SPECTRAL_PATH,
        SPECTRAL_SOURCE_SIZE_BYTES,
        SPECTRAL_SOURCE_SHA256,
        "spectral_source",
    )


def _load_bound_spectral_module() -> ModuleType:
    source = _read_bound_spectral_source()
    module = ModuleType(
        "_nhm2_spherical_seed_core_quadrature_spectral_e9b2509b0c4a5d41"
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
        raise CoreQuadratureError(
            "core_quadrature_spectral_private_load_failed",
            type(error).__name__,
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
        raise CoreQuadratureError(
            "core_quadrature_spectral_module_origin_mismatch"
        )
    return module


_spectral_module = _load_bound_spectral_module()

FrozenLobattoSpectralPrimitive = _spectral_module.FrozenLobattoSpectralPrimitive
SPECTRAL_AUTHORITY_LOCKS = _spectral_module.AUTHORITY_LOCKS


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
class FrozenProjectedL2CoreIntegral:
    node_count: int
    core_cell_count: int
    fixture_point_count: int
    domain: tuple[int, int]
    core64: float
    core64_bits: str
    cells_completed: int
    mapped_points_completed: int
    node_integrands_completed: int
    exact_node_shortcuts: int
    projected_rho_f64le_sha256: str
    projected_u_f64le_sha256: str
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    spectral_source_sha256: str
    spectral_source_size_bytes: int
    spectral_payload_sha256: str
    fixture_manifest_sha256: str
    fixture_manifest_size_bytes: int
    fixture_records_sha256: str
    fixture_records_size_bytes: int
    fixture_generator_sha256: str
    fixture_generator_size_bytes: int
    fixture_independent_test_sha256: str
    fixture_independent_test_size_bytes: int
    mpfr_precision_bits: int
    mpfr_rounding_mode: str
    mpfr_emin: int
    mpfr_emax: int
    observed_gmpy2_version: str
    observed_mpfr_version: str
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


_CORE_CONTINUATION_BINDING_FIELD_NAMES: Final[tuple[str, ...]] = (
    "node_count",
    "core_cell_count",
    "fixture_point_count",
    "domain",
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
    "observed_gmpy2_version",
    "observed_mpfr_version",
)


@dataclass(frozen=True, slots=True)
class _CoreIntegralContinuationToken:
    result: FrozenProjectedL2CoreIntegral
    core_sum: gmpy2.mpfr
    core64: float
    bindings: tuple[tuple[str, object], ...]


_pending_core_integral_continuation: _CoreIntegralContinuationToken | None = None


def _require_core_integral_continuation_slot() -> None:
    if _pending_core_integral_continuation is not None:
        raise CoreQuadratureError("core_quadrature_continuation_pending")


def _register_core_integral_continuation(
    result: FrozenProjectedL2CoreIntegral,
    core_sum: gmpy2.mpfr,
    core64: float,
) -> None:
    global _pending_core_integral_continuation
    _require_core_integral_continuation_slot()
    bindings = tuple(
        (field_name, getattr(result, field_name))
        for field_name in _CORE_CONTINUATION_BINDING_FIELD_NAMES
    )
    _pending_core_integral_continuation = _CoreIntegralContinuationToken(
        result=result,
        core_sum=core_sum,
        core64=core64,
        bindings=bindings,
    )


def _consume_core_integral_continuation(
    result: FrozenProjectedL2CoreIntegral,
) -> _CoreIntegralContinuationToken:
    global _pending_core_integral_continuation
    token = _pending_core_integral_continuation
    if token is None:
        raise CoreQuadratureError("core_quadrature_continuation_unavailable")
    if type(result) is not FrozenProjectedL2CoreIntegral or token.result is not result:
        raise CoreQuadratureError("core_quadrature_continuation_identity_mismatch")
    _pending_core_integral_continuation = None
    return token


AUTHORITY_LOCKS: Final = MappingProxyType(
    {
        "projectedSourceAcceptanceVerified": False,
        "fixtureRuntimeAuthority": False,
        "implementationClosureComplete": False,
        "runtimeClosureComplete": False,
        "sourceManifestAuthority": False,
        "toolchainAuthority": False,
        "preexecutionPresealPresent": False,
        "executionAuthorized": False,
        "executionObserved": False,
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
        raise CoreQuadratureError(
            "core_quadrature_spectral_primitive_type_invalid", type(value).__name__
        )
    try:
        supplied = tuple(
            getattr(value, field_name)
            for field_name in _SPECTRAL_SNAPSHOT_FIELD_NAMES
        )
    except Exception as error:
        raise CoreQuadratureError(
            "core_quadrature_spectral_snapshot_failed", type(error).__name__
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
    return _FrozenSpectralSnapshot(
        field_values=(supplied[0], rho, weights, first, second, *supplied[5:]),
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
        raise CoreQuadratureError("core_quadrature_binary64_type_invalid", detail)
    if not math.isfinite(value):
        raise CoreQuadratureError("core_quadrature_binary64_nonfinite_input", detail)
    if _negative_zero(value):
        raise CoreQuadratureError("core_quadrature_binary64_negative_zero_input", detail)
    return value


def _u64le(value: int) -> bytes:
    if type(value) is not int or value < 0:
        raise CoreQuadratureError("core_quadrature_u64_invalid", repr(value))
    return value.to_bytes(8, "little", signed=False)


def _spectral_payload_sha256(grid: _FrozenSpectralSnapshot) -> str:
    count = grid.node_count
    digest = hashlib.sha256()
    digest.update(SPECTRAL_PAYLOAD_GOLDEN_DOMAIN)
    digest.update(_u64le(count))
    for label, values in (
        (b"rho", grid.rho),
        (b"barycentric_weights", grid.barycentric_weights),
    ):
        digest.update(_u64le(len(label)))
        digest.update(label)
        digest.update(_u64le(len(values)))
        digest.update(struct.pack(f"<{len(values)}d", *values))
    for label, matrix in (
        (b"first_derivative_row_major", grid.first_derivative),
        (b"second_derivative_row_major", grid.second_derivative),
    ):
        digest.update(_u64le(len(label)))
        digest.update(label)
        digest.update(_u64le(count * count))
        for row in matrix:
            digest.update(struct.pack(f"<{count}d", *row))
    return digest.hexdigest()


def _f64_payload_sha256(domain: bytes, values: tuple[float, ...]) -> str:
    digest = hashlib.sha256()
    digest.update(domain)
    digest.update(_u64le(len(values)))
    digest.update(struct.pack(f"<{len(values)}d", *values))
    return digest.hexdigest()


def _validate_spectral_primitive(
    grid: _FrozenSpectralSnapshot,
) -> _FrozenSpectralSnapshot:
    if type(grid.node_count) is not int or grid.node_count != L2_NODE_COUNT:
        raise CoreQuadratureError(
            "core_quadrature_spectral_node_count_invalid", repr(grid.node_count)
        )
    if (
        grid.primary_numerics_policy_sha256 != PRIMARY_NUMERICS_POLICY_SHA256
        or grid.primary_numerics_policy_canonical_size_bytes
        != PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        or grid.calculation_implemented is not True
    ):
        raise CoreQuadratureError("core_quadrature_spectral_binding_invalid")
    if any(value is not False for value in grid.false_field_values):
        raise CoreQuadratureError("core_quadrature_spectral_authority_lock_invalid")
    if any(value is not False for value in SPECTRAL_AUTHORITY_LOCKS.values()):
        raise CoreQuadratureError("core_quadrature_spectral_module_lock_invalid")
    if (
        not grid.exact_tuple_shape
        or type(grid.rho) is not tuple
        or type(grid.barycentric_weights) is not tuple
        or type(grid.first_derivative) is not tuple
        or type(grid.second_derivative) is not tuple
        or len(grid.rho) != L2_NODE_COUNT
        or len(grid.barycentric_weights) != L2_NODE_COUNT
        or len(grid.first_derivative) != L2_NODE_COUNT
        or len(grid.second_derivative) != L2_NODE_COUNT
        or any(
            type(row) is not tuple or len(row) != L2_NODE_COUNT
            for row in (*grid.first_derivative, *grid.second_derivative)
        )
    ):
        raise CoreQuadratureError("core_quadrature_spectral_shape_invalid")
    for index, item in enumerate(grid.rho):
        _validate_f64(item, f"rho[{index}]")
    for index, item in enumerate(grid.barycentric_weights):
        _validate_f64(item, f"weight[{index}]")
    for matrix_name, matrix in (
        ("D", grid.first_derivative),
        ("D2", grid.second_derivative),
    ):
        for row_index, row in enumerate(matrix):
            for column_index, item in enumerate(row):
                _validate_f64(item, f"{matrix_name}[{row_index},{column_index}]")
    if struct.pack("<d", grid.rho[0]) != bytes(8) or grid.rho[-1] != 1.0:
        raise CoreQuadratureError("core_quadrature_spectral_endpoint_invalid")
    if any(
        grid.rho[index] <= grid.rho[index - 1]
        for index in range(1, L2_NODE_COUNT)
    ):
        raise CoreQuadratureError("core_quadrature_spectral_order_invalid")
    if _spectral_payload_sha256(grid) != SPECTRAL_N128_PAYLOAD_SHA256:
        raise CoreQuadratureError("core_quadrature_spectral_payload_mismatch")
    return grid


def _validate_projected_u(value: object) -> tuple[float, ...]:
    if type(value) is not tuple:
        raise CoreQuadratureError(
            "core_quadrature_projected_u_type_invalid", type(value).__name__
        )
    if len(value) != L2_NODE_COUNT:
        raise CoreQuadratureError(
            "core_quadrature_projected_u_length_invalid", str(len(value))
        )
    result = tuple(
        _validate_f64(item, f"projected_u[{index}]")
        for index, item in enumerate(value)
    )
    if struct.pack("<d", result[-1]) != bytes(8):
        raise CoreQuadratureError("core_quadrature_projected_u_infinity_invalid")
    return result


def _unique_json_object(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in pairs:
        if key in result:
            raise CoreQuadratureError("core_quadrature_fixture_duplicate_key", key)
        result[key] = value
    return result


def _parse_json(raw: bytes, role: str) -> dict[str, object]:
    try:
        text = raw.decode("ascii")
    except UnicodeDecodeError as error:
        raise CoreQuadratureError(
            "core_quadrature_fixture_encoding_invalid", role
        ) from error
    try:
        value = json.loads(text, object_pairs_hook=_unique_json_object)
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        raise CoreQuadratureError(
            "core_quadrature_fixture_json_invalid", role
        ) from error
    if type(value) is not dict:
        raise CoreQuadratureError("core_quadrature_fixture_json_root_invalid", role)
    return value


def _validate_manifest(raw: bytes) -> None:
    if b"\r" in raw or raw.startswith(b"\xef\xbb\xbf") or not raw.endswith(b"\n"):
        raise CoreQuadratureError("core_quadrature_manifest_encoding_invalid")
    root = _parse_json(raw, "manifest")
    canonical = json.dumps(
        root, ensure_ascii=True, separators=(",", ":"), sort_keys=True
    ).encode("ascii") + b"\n"
    if canonical != raw:
        raise CoreQuadratureError("core_quadrature_manifest_not_canonical")
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
            raise CoreQuadratureError("core_quadrature_manifest_schema_mismatch")
    except (KeyError, TypeError):
        raise CoreQuadratureError(
            "core_quadrature_manifest_schema_mismatch"
        ) from None


def _parse_dyadic(value: object, detail: str) -> _LiteralDyadic:
    if type(value) is not dict or tuple(value) != (
        "exponent2",
        "sign",
        "significandHex",
    ):
        raise CoreQuadratureError("core_quadrature_fixture_dyadic_shape_invalid", detail)
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
        raise CoreQuadratureError("core_quadrature_fixture_dyadic_invalid", detail)
    return _LiteralDyadic(sign, int(significand_hex, 16), exponent2)


def _parse_fixture_records(raw: bytes) -> tuple[_LiteralGLRecord, ...]:
    if (
        raw.startswith(b"\xef\xbb\xbf")
        or b"\r" in raw
        or not raw.endswith(b"\n")
    ):
        raise CoreQuadratureError("core_quadrature_fixture_encoding_invalid", "records")
    lines = raw.splitlines(keepends=True)
    if len(lines) != GL_POINT_COUNT or any(line == b"\n" for line in lines):
        raise CoreQuadratureError("core_quadrature_fixture_record_count_invalid")
    records: list[_LiteralGLRecord] = []
    for expected_index, line in enumerate(lines):
        if not line.endswith(b"\n") or line.count(b"\n") != 1:
            raise CoreQuadratureError(
                "core_quadrature_fixture_line_encoding_invalid", str(expected_index)
            )
        root = _parse_json(line[:-1], f"record[{expected_index}]")
        canonical = json.dumps(
            root, ensure_ascii=True, separators=(",", ":"), sort_keys=True
        ).encode("ascii") + b"\n"
        if canonical != line or tuple(root) != ("index", "node", "schema", "weight"):
            raise CoreQuadratureError(
                "core_quadrature_fixture_record_not_canonical", str(expected_index)
            )
        if (
            type(root["index"]) is not int
            or root["index"] != expected_index
            or root["schema"] != GL256_RECORD_SCHEMA
        ):
            raise CoreQuadratureError(
                "core_quadrature_fixture_record_schema_invalid", str(expected_index)
            )
        records.append(
            _LiteralGLRecord(
                expected_index,
                _parse_dyadic(root["node"], f"node[{expected_index}]"),
                _parse_dyadic(root["weight"], f"weight[{expected_index}]"),
            )
        )
    return tuple(records)


def _load_bound_fixture_records() -> tuple[_LiteralGLRecord, ...]:
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
    _validate_manifest(manifest_raw)
    return _parse_fixture_records(records_raw)


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
            raise CoreQuadratureError("core_quadrature_mpfr_context_installation_failed")
        context.clear_flags()
        yield context


def _check_flags(context: gmpy2.context, operation: str) -> None:
    bad = tuple(
        name
        for name in ("invalid", "divzero", "overflow", "underflow", "erange")
        if bool(getattr(context, name))
    )
    if bad:
        raise CoreQuadratureError(
            "core_quadrature_mpfr_exceptional_flag",
            f"{operation}:{','.join(bad)}",
        )


def _positive_zero(context: gmpy2.context, operation: str) -> gmpy2.mpfr:
    context.clear_flags()
    result = gmpy2.mpfr(0, MPFR_PRECISION_BITS)
    _check_flags(context, operation)
    if not gmpy2.is_zero(result) or gmpy2.is_signed(result):
        raise CoreQuadratureError("core_quadrature_positive_zero_failure", operation)
    return result


def _finish(
    context: gmpy2.context,
    value: gmpy2.mpfr,
    operation: str,
) -> gmpy2.mpfr:
    _check_flags(context, operation)
    if not gmpy2.is_finite(value):
        raise CoreQuadratureError("core_quadrature_mpfr_nonfinite", operation)
    return _positive_zero(context, operation) if gmpy2.is_zero(value) else value


def _set_ui(context: gmpy2.context, value: int, operation: str) -> gmpy2.mpfr:
    if type(value) is not int or value < 0:
        raise CoreQuadratureError("core_quadrature_set_ui_domain_invalid", operation)
    context.clear_flags()
    result = gmpy2.mpfr(value, MPFR_PRECISION_BITS)
    inexact = bool(context.inexact)
    result = _finish(context, result, operation)
    if inexact:
        raise CoreQuadratureError("core_quadrature_set_ui_inexact", operation)
    return result


def _set_d(context: gmpy2.context, value: float, operation: str) -> gmpy2.mpfr:
    _validate_f64(value, operation)
    context.clear_flags()
    result = gmpy2.mpfr(value, MPFR_PRECISION_BITS)
    inexact = bool(context.inexact)
    result = _finish(context, result, operation)
    if inexact:
        raise CoreQuadratureError("core_quadrature_set_d_inexact", operation)
    return result


def _copy(
    context: gmpy2.context, value: gmpy2.mpfr, operation: str
) -> gmpy2.mpfr:
    context.clear_flags()
    result = gmpy2.mpfr(value, MPFR_PRECISION_BITS)
    inexact = bool(context.inexact)
    result = _finish(context, result, operation)
    if inexact:
        raise CoreQuadratureError("core_quadrature_copy_inexact", operation)
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
        raise CoreQuadratureError("core_quadrature_set_z_2exp_inexact", operation)
    context.clear_flags()
    result = gmpy2.mul_2exp(significand, value.exponent2)
    scale_inexact = bool(context.inexact)
    result = _finish(context, result, operation)
    if scale_inexact:
        raise CoreQuadratureError("core_quadrature_set_z_2exp_inexact", operation)
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
        raise CoreQuadratureError("core_quadrature_mpfr_division_by_zero", operation)
    context.clear_flags()
    return _finish(context, gmpy2.div(numerator, denominator), operation)


def _neg(
    context: gmpy2.context, value: gmpy2.mpfr, operation: str
) -> gmpy2.mpfr:
    context.clear_flags()
    return _finish(context, -value, operation)


def _get_d(context: gmpy2.context, value: gmpy2.mpfr, operation: str) -> float:
    context.clear_flags()
    result = float(value)
    _check_flags(context, operation)
    if not math.isfinite(result):
        raise CoreQuadratureError("core_quadrature_binary64_nonfinite_result", operation)
    result = 0.0 if result == 0.0 else result
    if _negative_zero(result):
        raise CoreQuadratureError("core_quadrature_binary64_negative_zero_result", operation)
    return result


def _materialize_fixture_values(
    context: gmpy2.context,
    records: tuple[_LiteralGLRecord, ...],
) -> _FrozenFixtureValues:
    if len(records) != GL_POINT_COUNT:
        raise CoreQuadratureError("core_quadrature_fixture_record_count_invalid")
    nodes: list[gmpy2.mpfr] = []
    weights: list[gmpy2.mpfr] = []
    for expected_index, record in enumerate(records):
        if record.index != expected_index:
            raise CoreQuadratureError(
                "core_quadrature_fixture_record_order_invalid", str(expected_index)
            )
        node = _set_z_2exp(context, record.node, f"fixture[{expected_index}].node")
        weight = _set_z_2exp(
            context, record.weight, f"fixture[{expected_index}].weight"
        )
        nodes.append(node)
        weights.append(weight)
    one = _set_ui(context, 1, "fixture.order.one")
    minus_one = _neg(context, one, "fixture.order.minus_one")
    if not all(minus_one < node < one for node in nodes):
        raise CoreQuadratureError("core_quadrature_fixture_node_domain_invalid")
    if any(nodes[index] <= nodes[index - 1] for index in range(1, GL_POINT_COUNT)):
        raise CoreQuadratureError("core_quadrature_fixture_node_order_invalid")
    if any(weight <= 0 for weight in weights):
        raise CoreQuadratureError("core_quadrature_fixture_weight_invalid")
    return _FrozenFixtureValues(tuple(nodes), tuple(weights))


def _mapped_cell(
    context: gmpy2.context, cell_index: int
) -> tuple[gmpy2.mpfr, gmpy2.mpfr]:
    if type(cell_index) is not int or not 0 <= cell_index < CORE_CELL_COUNT:
        raise CoreQuadratureError("core_quadrature_cell_index_invalid", repr(cell_index))
    domain_length = _set_ui(context, CORE_DOMAIN_LENGTH, "cell.domain_length")
    cell_index_mp = _set_ui(context, cell_index, "cell.index")
    cell_index_plus_one = _set_ui(context, cell_index + 1, "cell.index_plus_one")
    cell_count = _set_ui(context, CORE_CELL_COUNT, "cell.count")
    two = _set_ui(context, 2, "cell.two")
    left_numerator = _mul(
        context, domain_length, cell_index_mp, "cell.left_numerator"
    )
    left = _div(context, left_numerator, cell_count, "cell.left")
    right_numerator = _mul(
        context, domain_length, cell_index_plus_one, "cell.right_numerator"
    )
    right = _div(context, right_numerator, cell_count, "cell.right")
    sum_endpoints = _add(context, left, right, "cell.sum_endpoints")
    mid = _div(context, sum_endpoints, two, "cell.mid")
    difference_endpoints = _sub(context, right, left, "cell.difference_endpoints")
    half = _div(context, difference_endpoints, two, "cell.half")
    return mid, half


def _mapped_points(
    context: gmpy2.context,
    mid: gmpy2.mpfr,
    half: gmpy2.mpfr,
    fixture_nodes: tuple[gmpy2.mpfr, ...],
) -> tuple[gmpy2.mpfr, ...]:
    if len(fixture_nodes) != GL_POINT_COUNT:
        raise CoreQuadratureError("core_quadrature_fixture_point_count_invalid")
    points: list[gmpy2.mpfr] = []
    for fixture_index in range(GL_POINT_COUNT):
        node_product = _mul(
            context, half, fixture_nodes[fixture_index], "point.node_product"
        )
        point = _add(context, mid, node_product, "point.add_mid")
        points.append(_copy(context, point, "point.store"))
    return tuple(points)


def _signed_barycentric_weight(
    context: gmpy2.context, index: int
) -> gmpy2.mpfr:
    magnitude = _set_ui(
        context,
        1 if index in (0, L2_NODE_COUNT - 1) else 2,
        "barycentric.magnitude",
    )
    two = _set_ui(context, 2, "barycentric.two")
    unsigned = _div(context, magnitude, two, "barycentric.divide_two")
    return (
        _neg(context, unsigned, "barycentric.negate_odd")
        if index % 2
        else _copy(context, unsigned, "barycentric.copy_even")
    )


def _interpolate_projected_u(
    context: gmpy2.context,
    rho: gmpy2.mpfr,
    source_nodes: tuple[float, ...],
    source_u: tuple[float, ...],
) -> tuple[gmpy2.mpfr, int | None]:
    for source_index in range(L2_NODE_COUNT):
        node = _set_d(context, source_nodes[source_index], "exact_match.node")
        if rho == node:
            return (
                _set_d(context, source_u[source_index], "exact_match.u"),
                source_index,
            )

    numerator = _set_ui(context, 0, "interpolate.numerator.zero")
    denominator = _set_ui(context, 0, "interpolate.denominator.zero")
    for source_index in range(L2_NODE_COUNT):
        node = _set_d(context, source_nodes[source_index], "interpolate.node")
        difference = _sub(context, rho, node, "interpolate.difference")
        weight = _signed_barycentric_weight(context, source_index)
        ratio = _div(context, weight, difference, "interpolate.ratio")
        u_node = _set_d(context, source_u[source_index], "interpolate.u_node")
        weighted_value = _mul(
            context, ratio, u_node, "interpolate.weighted_value"
        )
        next_numerator = _add(
            context, numerator, weighted_value, "interpolate.numerator.add"
        )
        numerator = _copy(
            context, next_numerator, "interpolate.numerator.copy"
        )
        next_denominator = _add(
            context, denominator, ratio, "interpolate.denominator.add"
        )
        denominator = _copy(
            context, next_denominator, "interpolate.denominator.copy"
        )
    return _div(context, numerator, denominator, "interpolate.final_div"), None


def _integrate_core_node(
    context: gmpy2.context,
    core_sum: gmpy2.mpfr,
    point: gmpy2.mpfr,
    mapped_weight: gmpy2.mpfr,
    source_nodes: tuple[float, ...],
    source_u: tuple[float, ...],
) -> tuple[gmpy2.mpfr, bool]:
    x = _copy(context, point, "node.set_x")
    one = _set_ui(context, 1, "node.one")
    one_plus_x = _add(context, one, x, "node.one_plus_x")
    rho = _div(context, x, one_plus_x, "node.rho")
    u, exact_index = _interpolate_projected_u(
        context, rho, source_nodes, source_u
    )
    x2 = _mul(context, x, x, "node.x2")
    u2 = _mul(context, u, u, "node.u2")
    integrand = _mul(context, x2, u2, "node.integrand")
    term = _mul(context, mapped_weight, integrand, "node.term")
    next_core_sum = _add(context, core_sum, term, "node.core_sum.add")
    return _copy(context, next_core_sum, "node.core_sum.copy"), exact_index is not None


def _integrate_one_cell(
    context: gmpy2.context,
    core_sum: gmpy2.mpfr,
    fixture: _FrozenFixtureValues,
    source_nodes: tuple[float, ...],
    source_u: tuple[float, ...],
    cell_index: int,
) -> tuple[gmpy2.mpfr, int, int]:
    mid, half = _mapped_cell(context, cell_index)
    points = _mapped_points(context, mid, half, fixture.nodes)
    exact_node_shortcuts = 0
    for fixture_index in range(GL_POINT_COUNT):
        mapped_weight = _mul(
            context,
            half,
            fixture.weights[fixture_index],
            "node.mapped_weight",
        )
        core_sum, exact_match = _integrate_core_node(
            context,
            core_sum,
            points[fixture_index],
            mapped_weight,
            source_nodes,
            source_u,
        )
        exact_node_shortcuts += int(exact_match)
    return core_sum, len(points), exact_node_shortcuts


def _integrate_all_cells(
    context: gmpy2.context,
    fixture: _FrozenFixtureValues,
    source_nodes: tuple[float, ...],
    source_u: tuple[float, ...],
) -> tuple[gmpy2.mpfr, int, int, int]:
    core_sum = _positive_zero(context, "core_sum.positive_zero")
    mapped_point_count = 0
    node_count = 0
    exact_node_shortcuts = 0
    for cell_index in range(CORE_CELL_COUNT):
        core_sum, cell_points, cell_shortcuts = _integrate_one_cell(
            context,
            core_sum,
            fixture,
            source_nodes,
            source_u,
            cell_index,
        )
        mapped_point_count += cell_points
        node_count += GL_POINT_COUNT
        exact_node_shortcuts += cell_shortcuts
    return core_sum, mapped_point_count, node_count, exact_node_shortcuts


def materialize_projected_l2_core_integral(
    spectral: FrozenLobattoSpectralPrimitive,
    projected_u: tuple[float, ...],
) -> FrozenProjectedL2CoreIntegral:
    """Evaluate the frozen once-only core graph without accepting its input."""

    _require_core_integral_continuation_slot()
    records = _load_bound_fixture_records()
    _read_bound_spectral_source()
    grid = _validate_spectral_primitive(_snapshot_spectral_primitive(spectral))
    source_nodes = grid.rho
    source_u = _validate_projected_u(projected_u)
    with _owned_mpfr256_context() as context:
        fixture = _materialize_fixture_values(context, records)
        core_sum, mapped_points, node_integrands, exact_shortcuts = (
            _integrate_all_cells(context, fixture, source_nodes, source_u)
        )
        core64 = _get_d(context, core_sum, "core_sum.get_d")

    expected_nodes = CORE_CELL_COUNT * GL_POINT_COUNT
    if (
        mapped_points != expected_nodes
        or node_integrands != expected_nodes
        or not math.isfinite(core64)
        or core64 < 0.0
        or _negative_zero(core64)
    ):
        raise CoreQuadratureError("core_quadrature_output_invariant")
    result = FrozenProjectedL2CoreIntegral(
        node_count=L2_NODE_COUNT,
        core_cell_count=CORE_CELL_COUNT,
        fixture_point_count=GL_POINT_COUNT,
        domain=(0, CORE_DOMAIN_LENGTH),
        core64=core64,
        core64_bits=struct.pack("<d", core64).hex(),
        cells_completed=CORE_CELL_COUNT,
        mapped_points_completed=mapped_points,
        node_integrands_completed=node_integrands,
        exact_node_shortcuts=exact_shortcuts,
        projected_rho_f64le_sha256=_f64_payload_sha256(
            PROJECTED_RHO_HASH_DOMAIN, source_nodes
        ),
        projected_u_f64le_sha256=_f64_payload_sha256(
            PROJECTED_U_HASH_DOMAIN, source_u
        ),
        primary_numerics_policy_sha256=PRIMARY_NUMERICS_POLICY_SHA256,
        primary_numerics_policy_canonical_size_bytes=(
            PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        ),
        spectral_source_sha256=SPECTRAL_SOURCE_SHA256,
        spectral_source_size_bytes=SPECTRAL_SOURCE_SIZE_BYTES,
        spectral_payload_sha256=SPECTRAL_N128_PAYLOAD_SHA256,
        fixture_manifest_sha256=GL256_MANIFEST_SHA256,
        fixture_manifest_size_bytes=GL256_MANIFEST_SIZE_BYTES,
        fixture_records_sha256=GL256_RECORDS_SHA256,
        fixture_records_size_bytes=GL256_RECORDS_SIZE_BYTES,
        fixture_generator_sha256=GL256_GENERATOR_SHA256,
        fixture_generator_size_bytes=GL256_GENERATOR_SIZE_BYTES,
        fixture_independent_test_sha256=GL256_INDEPENDENT_TEST_SHA256,
        fixture_independent_test_size_bytes=GL256_INDEPENDENT_TEST_SIZE_BYTES,
        mpfr_precision_bits=MPFR_PRECISION_BITS,
        mpfr_rounding_mode=MPFR_ROUNDING_MODE,
        mpfr_emin=MPFR_EMIN,
        mpfr_emax=MPFR_EMAX,
        observed_gmpy2_version=gmpy2.version(),
        observed_mpfr_version=gmpy2.mpfr_version(),
    )
    _register_core_integral_continuation(result, core_sum, core64)
    return result


if (
    L2_NODE_COUNT != 128
    or CORE_CELL_COUNT != 256
    or GL_POINT_COUNT != 256
    or CORE_DOMAIN_LENGTH != 32
    or tuple(FrozenLobattoSpectralPrimitive.__dataclass_fields__)
    != _SPECTRAL_SNAPSHOT_FIELD_NAMES
    or any(
        field_name not in FrozenProjectedL2CoreIntegral.__dataclass_fields__
        for field_name in _CORE_CONTINUATION_BINDING_FIELD_NAMES
    )
    or MPFR_PRECISION_BITS != 256
    or MPFR_EMIN != -1_000_000
    or MPFR_EMAX != 1_000_000
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("spherical_seed_primary_l2_core_quadrature_invariant")


__all__ = [
    "AUTHORITY_LOCKS",
    "CORE_CELL_COUNT",
    "CORE_DOMAIN_LENGTH",
    "CORE_PRIMAL_OPERATION_GRAPH",
    "CORE_QUADRATURE_VERSION",
    "CORE_SUM_BARRIER_GRAPH",
    "CoreQuadratureError",
    "FrozenProjectedL2CoreIntegral",
    "GL256_GENERATOR_SHA256",
    "GL256_GENERATOR_SIZE_BYTES",
    "GL256_INDEPENDENT_TEST_SHA256",
    "GL256_INDEPENDENT_TEST_SIZE_BYTES",
    "GL256_MANIFEST_SCHEMA",
    "GL256_MANIFEST_SHA256",
    "GL256_MANIFEST_SIZE_BYTES",
    "GL_POINT_COUNT",
    "GL256_RECORDS_SHA256",
    "GL256_RECORDS_SIZE_BYTES",
    "GL256_RECORD_SCHEMA",
    "L2_NODE_COUNT",
    "MAPPED_CELL_OPERATION_GRAPH",
    "MAPPED_POINT_WEIGHT_OPERATION_GRAPH",
    "MPFR_EMAX",
    "MPFR_EMIN",
    "MPFR_PRECISION_BITS",
    "MPFR_ROUNDING_MODE",
    "PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES",
    "PRIMARY_NUMERICS_POLICY_SHA256",
    "SPECTRAL_N128_PAYLOAD_SHA256",
    "SPECTRAL_SOURCE_SHA256",
    "SPECTRAL_SOURCE_SIZE_BYTES",
    "materialize_projected_l2_core_integral",
]
