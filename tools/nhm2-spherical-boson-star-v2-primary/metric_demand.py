"""Synthetic-only MPFR-256 executor for the frozen metric-demand program.

The accepted input is the bounded canonical UTF-8 JSON interchange frozen by
``nhm2-spherical-boson-star-v2-metric-demand-program.v1``.  This module owns a
source-local native MPFR/GMP boundary, evaluates the exact primitive order, and
returns immutable calculation bytes plus an authority-neutral diagnostic
receipt.  It cannot read candidate artifacts, publish files, or grant any
execution, replay, readiness, lamp, or physical authority.
"""

from __future__ import annotations

import ctypes
from dataclasses import dataclass
import hashlib
import json
import math
from pathlib import Path
import re
import struct
import threading
from typing import Any, Callable, Final, Iterable, Mapping, NoReturn

import gmpy2


PROGRAM_SHA256: Final[str] = (
    "c64cd963ec7a8ad2485de2e4ff16e307da61a6fd1e108439ae56eade76b00fee"
)
PROGRAM_CANONICAL_SIZE_BYTES: Final[int] = 48_595
PROGRAM_RAW_SHA256: Final[str] = (
    "959d8a8b5211f3549e2124ffdf0db36779f83723d9cdacbf15088b2daf4c851c"
)
PROGRAM_RAW_SIZE_BYTES: Final[int] = 51_850
PROGRAM_INPUT_VERSION: Final[str] = (
    "nhm2_semiclassical_v2_spherical_boson_star_metric_demand_mpfr256_input/v1"
)
PROGRAM_GRAPH_ID: Final[str] = (
    "nhm2_spherical_boson_star_v2_metric_demand_mpfr256_primitive_ast/v1"
)

PRECISION_BITS: Final[int] = 256
EMIN: Final[int] = -1_000_000
EMAX: Final[int] = 1_000_000
MAX_WIRE_UTF16_CODE_UNITS: Final[int] = 131_072
MAX_WIRE_UTF8_BYTES: Final[int] = 262_144
MAX_DEPTH: Final[int] = 24
MAX_NODES: Final[int] = 8_192
MAX_ARRAY_LENGTH: Final[int] = 1_024
MAX_OBJECT_PROPERTY_COUNT: Final[int] = 256
MAX_STRING_UTF8_BYTES: Final[int] = 32_768
MAX_AGGREGATE_UTF8_BYTES: Final[int] = 262_144

EXPECTED_GMPY2_VERSION: Final[str] = "2.3.1"
EXPECTED_MPFR_VERSION: Final[str] = "MPFR 4.2.2"
EXPECTED_GMP_VERSION: Final[str] = "GMP 6.3.0"
EXPECTED_NATIVE_MPFR_VERSION: Final[str] = "4.2.2"
EXPECTED_NATIVE_GMP_VERSION: Final[str] = "6.3.0"
NATIVE_MPFR_DLL_NAME: Final[str] = "libmpfr-6.dll"
NATIVE_MPFR_DLL_SHA256: Final[str] = (
    "95b280f52d24a1fe1e024877ee325a629c3424e12961d27f84daec73d02c4bd8"
)
NATIVE_MPFR_DLL_SIZE_BYTES: Final[int] = 904_297
NATIVE_GMP_DLL_NAME: Final[str] = "libgmp-10.dll"
NATIVE_GMP_DLL_SHA256: Final[str] = (
    "829adcf025d22e641c6816b431fbe5b226a39b390c7205192d480151646fe9c9"
)
NATIVE_GMP_DLL_SIZE_BYTES: Final[int] = 1_083_865

RNDN: Final[int] = 0
RNDU: Final[int] = 2
RNDD: Final[int] = 3
ROUND_NAMES: Final[dict[int, str]] = {
    RNDN: "MPFR_RNDN",
    RNDU: "MPFR_RNDU",
    RNDD: "MPFR_RNDD",
}
MPFR_FLAGS_ALL: Final[int] = 63

AXIS_NUMERATORS: Final[tuple[int, ...]] = (-3, -1, 1, 3)
QUANTITY_ORDER: Final[tuple[str, ...]] = (
    "F1",
    "F0_prime",
    "F1_prime",
    "F0_double_prime",
    "F1_double_prime",
)
COMPONENT_ORDER: Final[tuple[str, ...]] = (
    "00",
    "01",
    "02",
    "03",
    "11",
    "12",
    "13",
    "22",
    "23",
    "33",
)
RADIUS_GROUPS: Final[tuple[tuple[str, int, tuple[int, ...]], ...]] = (
    ("r2_3_over_64", 3, (21, 22, 25, 26, 37, 38, 41, 42)),
    (
        "r2_11_over_64",
        11,
        (
            5,
            6,
            9,
            10,
            17,
            18,
            20,
            23,
            24,
            27,
            29,
            30,
            33,
            34,
            36,
            39,
            40,
            43,
            45,
            46,
            53,
            54,
            57,
            58,
        ),
    ),
    (
        "r2_19_over_64",
        19,
        (
            1,
            2,
            4,
            7,
            8,
            11,
            13,
            14,
            16,
            19,
            28,
            31,
            32,
            35,
            44,
            47,
            49,
            50,
            52,
            55,
            56,
            59,
            61,
            62,
        ),
    ),
    ("r2_27_over_64", 27, (0, 3, 12, 15, 48, 51, 60, 63)),
)
SAMPLE_VISIT_ORDER: Final[tuple[int, ...]] = tuple(
    sample for _, _, members in RADIUS_GROUPS for sample in members
)

_ENDPOINT_KEYS: Final[frozenset[str]] = frozenset(
    {"sign", "mantissaHex", "exponent2", "precisionBits", "direction"}
)
_QUANTITY_KEYS: Final[frozenset[str]] = frozenset(
    {
        "quantityId",
        "centralF64WordHex",
        "centralMpfr256",
        "lowerMpfr256",
        "upperMpfr256",
    }
)
_GROUP_KEYS: Final[frozenset[str]] = frozenset({"radiusGroup", "quantities"})
_SCALE_KEYS: Final[frozenset[str]] = frozenset(
    {
        "stressScaleNCentralMpfr256",
        "stressScaleK2LowerMpfr256",
        "stressScaleK2UpperMpfr256",
    }
)
_ENVELOPE_KEYS: Final[frozenset[str]] = frozenset(
    {"contractVersion", "radiusGroups", "siScale"}
)
_HEX_RE: Final[re.Pattern[str]] = re.compile(r"(?:0|[1-9a-f][0-9a-f]*)\Z")
_DECIMAL_RE: Final[re.Pattern[str]] = re.compile(r"(?:0|-?[1-9][0-9]*)\Z")
_WORD_RE: Final[re.Pattern[str]] = re.compile(r"[0-9a-f]{16}\Z")
_EXECUTION_LOCK = threading.Lock()
_CONTEXT_POISONED = False
_CONTEXT_POISON_REASONS: tuple[str, ...] = ()


class MetricDemandError(RuntimeError):
    """Fail-closed synthetic metric-demand boundary error."""

    def __init__(self, code: str, detail: str | None = None) -> None:
        super().__init__(code if detail is None else f"{code}:{detail}")
        self.code = code
        self.detail = detail


@dataclass(frozen=True, slots=True)
class MetricDemandReceipt:
    program_sha256: str
    program_canonical_size_bytes: int
    program_raw_sha256: str
    program_raw_size_bytes: int
    primitive_graph_id: str
    input_sha256: str
    metric_demand_sha256: str
    absolute_error_sha256: str
    metric_demand_size_bytes: int
    absolute_error_size_bytes: int
    gmpy2_version: str
    mpfr_version: str
    gmp_version: str
    native_mpfr_version: str
    native_gmp_version: str
    native_mpfr_disk_file_sha256_at_module_admission: str
    native_mpfr_disk_file_size_bytes_at_module_admission: int
    native_gmp_disk_file_sha256_at_module_admission: str
    native_gmp_disk_file_size_bytes_at_module_admission: int
    arithmetic_uses_native_mpfr_gmp_abi: bool
    native_runtime_disk_files_hash_verified_at_module_admission: bool
    exact_loaded_native_module_byte_identity_proved: bool
    native_module_hash_to_load_toctou_closed: bool
    gmpy2_used_only_for_runtime_location_and_version_metadata: bool
    gmpy2_numeric_arithmetic_used: bool
    implementation_blockers: tuple[str, ...]
    trace_event_count: int
    trace_chronology_sha256: str
    operation_counts: tuple[tuple[str, int], ...]
    sample_visit_order: tuple[int, ...]
    component_order: tuple[str, ...]
    stored_element_count_per_role: int
    arithmetic_observation_count: int
    comparison_observation_count: int
    get_d_observation_count: int
    mpfr_destination_count: int
    mpz_destination_count: int
    all_destinations_single_assignment: bool
    reverse_lifecycle_cleanup_verified: bool
    caller_context_restored_before_receipt: bool
    caller_flags_restored_before_receipt: bool
    primitive_flags_verified: bool
    serialized_center_enclosure_verified: bool
    synthetic_input_only: bool
    calculation_only: bool
    branch_geometry_accepted: bool
    metric_demand_tensor_materialized: bool
    metric_demand_absolute_error_bound_materialized: bool
    derivation_receipt_materialized: bool
    interval_trace_server_replayed: bool
    si_scale_receipt_verified: bool
    scientific_candidate_manifest_authority: bool
    scientific_preseal_authority: bool
    execution_ready: bool
    replay_ready: bool
    publication_ready: bool
    certification_ready: bool
    execution_authority: bool
    replay_authority: bool
    independent_agreement: bool
    semiclassical_stress_noise_lamp: bool
    semiclassical_constraint_algebra_lamp: bool
    diagnostic_pass: bool
    theory_graph_promotion: bool
    physical_viability: bool
    propulsion: bool
    transport: bool


@dataclass(frozen=True, slots=True)
class MetricDemandResult:
    metric_demand_f64le: bytes
    absolute_error_f64le: bytes
    receipt: MetricDemandReceipt


@dataclass(frozen=True, slots=True)
class _EndpointSpec:
    sign: str
    mantissa_hex: str
    exponent2: int
    direction: str


@dataclass(frozen=True, slots=True)
class _QuantitySpec:
    quantity_id: str
    central_word: int
    central: _EndpointSpec
    lower: _EndpointSpec
    upper: _EndpointSpec


@dataclass(frozen=True, slots=True)
class _Payload:
    groups: tuple[tuple[_QuantitySpec, ...], ...]
    scale_central: _EndpointSpec
    scale_lower: _EndpointSpec
    scale_upper: _EndpointSpec


class _MpfrStruct(ctypes.Structure):
    _fields_ = (
        ("_mpfr_prec", ctypes.c_long),
        ("_mpfr_sign", ctypes.c_int),
        ("_mpfr_exp", ctypes.c_long),
        ("_mpfr_d", ctypes.c_void_p),
    )


class _MpzStruct(ctypes.Structure):
    _fields_ = (
        ("_mp_alloc", ctypes.c_int),
        ("_mp_size", ctypes.c_int),
        ("_mp_d", ctypes.c_void_p),
    )


@dataclass(frozen=True, slots=True)
class _Value:
    destination_id: str
    raw: _MpfrStruct


@dataclass(frozen=True, slots=True)
class _Interval:
    lower: _Value
    upper: _Value


@dataclass(slots=True)
class _ContextGuard:
    saved_flags: int | None = None
    saved_emin: int | None = None
    saved_emax: int | None = None
    active: bool = False
    range_snapshot_complete: bool = False
    range_mutation_started: bool = False
    restored: bool = False


@dataclass(frozen=True, slots=True)
class _ContextRecovery:
    complete: bool
    unresolved: tuple[str, ...]
    observed_failures: tuple[str, ...]


class _ExclusiveLease:
    def __enter__(self) -> None:
        if not _EXECUTION_LOCK.acquire(blocking=False):
            _fail("exclusive_mpfr_context_busy")

    def __exit__(
        self,
        exception_type: type[BaseException] | None,
        exception: BaseException | None,
        traceback: Any,
    ) -> None:
        _EXECUTION_LOCK.release()


def _fail(code: str, detail: str | None = None) -> NoReturn:
    raise MetricDemandError(code, detail)


def _bounded_error_code(error: BaseException) -> str:
    if isinstance(error, MetricDemandError):
        return error.code
    name = type(error).__name__
    return name if len(name) <= 64 else "non_metric_exception"


def _add_bounded_note(
    target: BaseException, label: str, source: BaseException | None
) -> None:
    if source is not None:
        target.add_note(f"{label}:{_bounded_error_code(source)}")


def _poison_context(reasons: Iterable[str]) -> None:
    global _CONTEXT_POISONED, _CONTEXT_POISON_REASONS
    bounded = tuple(dict.fromkeys(reasons))[:8]
    _CONTEXT_POISONED = True
    _CONTEXT_POISON_REASONS = bounded or ("context_recovery_unverified",)


def _sha256_file(path: Path) -> str:
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def _require_runtime_versions() -> None:
    observed = (
        gmpy2.__version__,
        gmpy2.mpfr_version(),
        gmpy2.mp_limbsize(),
    )
    expected = (EXPECTED_GMPY2_VERSION, EXPECTED_MPFR_VERSION, 64)
    if observed != expected:
        _fail("gmpy2_runtime_mismatch", repr(observed))
    if gmpy2.mp_version() != EXPECTED_GMP_VERSION:
        _fail("gmp_runtime_mismatch", gmpy2.mp_version())


class _NativeRuntime:
    def __init__(self) -> None:
        _require_runtime_versions()
        mpfr_path, gmp_path = self._admit_runtime_files()
        self.mpfr_path = mpfr_path
        self.gmp_path = gmp_path
        self.gmp = ctypes.PyDLL(str(gmp_path))
        self.mpfr = ctypes.PyDLL(str(mpfr_path))
        self._require_loaded_path(self.gmp, gmp_path, "gmp")
        self._require_loaded_path(self.mpfr, mpfr_path, "mpfr")
        self._bind_abi()
        self._verify_native_versions()

    @staticmethod
    def _admit_runtime_files() -> tuple[Path, Path]:
        module_path = Path(gmpy2.__file__).resolve(strict=True)
        root = (module_path.parent.parent / "gmpy2.libs").resolve(strict=True)
        if not root.is_dir():
            _fail("native_library_root_invalid")
        admitted: list[Path] = []
        for name, size, sha256 in (
            (
                NATIVE_MPFR_DLL_NAME,
                NATIVE_MPFR_DLL_SIZE_BYTES,
                NATIVE_MPFR_DLL_SHA256,
            ),
            (NATIVE_GMP_DLL_NAME, NATIVE_GMP_DLL_SIZE_BYTES, NATIVE_GMP_DLL_SHA256),
        ):
            path = (root / name).resolve(strict=True)
            if path.parent != root or path.name != name or not path.is_file():
                _fail("native_library_path_invalid", name)
            before = path.stat()
            observed_hash = _sha256_file(path)
            after = path.stat()
            before_identity = (
                before.st_dev,
                before.st_ino,
                before.st_size,
                before.st_mtime_ns,
            )
            after_identity = (
                after.st_dev,
                after.st_ino,
                after.st_size,
                after.st_mtime_ns,
            )
            if before_identity != after_identity:
                _fail("native_library_changed_during_hash", name)
            if after.st_size != size:
                _fail("native_library_size_mismatch", name)
            if observed_hash != sha256:
                _fail("native_library_sha256_mismatch", name)
            admitted.append(path)
        return admitted[0], admitted[1]

    @staticmethod
    def _require_loaded_path(
        library: ctypes.PyDLL, expected: Path, label: str
    ) -> None:
        if not hasattr(ctypes, "WinDLL"):
            _fail("native_windows_abi_required")
        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        get_name = kernel32.GetModuleFileNameW
        get_name.argtypes = (ctypes.c_void_p, ctypes.c_wchar_p, ctypes.c_uint32)
        get_name.restype = ctypes.c_uint32
        buffer = ctypes.create_unicode_buffer(32_768)
        copied = int(
            get_name(
                ctypes.c_void_p(library._handle),  # type: ignore[attr-defined]
                buffer,
                len(buffer),
            )
        )
        if copied == 0 or copied >= len(buffer):
            _fail("native_loaded_path_unavailable", label)
        if Path(buffer.value).resolve(strict=True) != expected:
            _fail("native_loaded_path_mismatch", label)

    def _bind_abi(self) -> None:
        mpfr_offsets = tuple(
            getattr(_MpfrStruct, field).offset
            for field in ("_mpfr_prec", "_mpfr_sign", "_mpfr_exp", "_mpfr_d")
        )
        mpz_offsets = tuple(
            getattr(_MpzStruct, field).offset
            for field in ("_mp_alloc", "_mp_size", "_mp_d")
        )
        if (
            ctypes.sizeof(ctypes.c_long) != 4
            or ctypes.sizeof(ctypes.c_void_p) != 8
            or ctypes.sizeof(_MpfrStruct) != 24
            or mpfr_offsets != (0, 4, 8, 16)
            or ctypes.sizeof(_MpzStruct) != 16
            or mpz_offsets != (0, 4, 8)
        ):
            _fail("native_ctypes_abi_mismatch")

        mpfr_p = ctypes.POINTER(_MpfrStruct)
        mpz_p = ctypes.POINTER(_MpzStruct)
        signatures: tuple[tuple[str, tuple[Any, ...], Any], ...] = (
            ("mpfr_init2", (mpfr_p, ctypes.c_long), None),
            ("mpfr_clear", (mpfr_p,), None),
            ("mpfr_get_prec", (mpfr_p,), ctypes.c_long),
            ("mpfr_set_ui", (mpfr_p, ctypes.c_ulong, ctypes.c_int), ctypes.c_int),
            ("mpfr_set_si", (mpfr_p, ctypes.c_long, ctypes.c_int), ctypes.c_int),
            ("mpfr_set_z", (mpfr_p, mpz_p, ctypes.c_int), ctypes.c_int),
            (
                "mpfr_mul_2si",
                (mpfr_p, mpfr_p, ctypes.c_long, ctypes.c_int),
                ctypes.c_int,
            ),
            ("mpfr_set", (mpfr_p, mpfr_p, ctypes.c_int), ctypes.c_int),
            ("mpfr_set_d", (mpfr_p, ctypes.c_double, ctypes.c_int), ctypes.c_int),
            ("mpfr_sqrt", (mpfr_p, mpfr_p, ctypes.c_int), ctypes.c_int),
            (
                "mpfr_div_ui",
                (mpfr_p, mpfr_p, ctypes.c_ulong, ctypes.c_int),
                ctypes.c_int,
            ),
            (
                "mpfr_ui_div",
                (mpfr_p, ctypes.c_ulong, mpfr_p, ctypes.c_int),
                ctypes.c_int,
            ),
            ("mpfr_div", (mpfr_p, mpfr_p, mpfr_p, ctypes.c_int), ctypes.c_int),
            ("mpfr_mul", (mpfr_p, mpfr_p, mpfr_p, ctypes.c_int), ctypes.c_int),
            (
                "mpfr_mul_si",
                (mpfr_p, mpfr_p, ctypes.c_long, ctypes.c_int),
                ctypes.c_int,
            ),
            (
                "mpfr_mul_ui",
                (mpfr_p, mpfr_p, ctypes.c_ulong, ctypes.c_int),
                ctypes.c_int,
            ),
            ("mpfr_add", (mpfr_p, mpfr_p, mpfr_p, ctypes.c_int), ctypes.c_int),
            ("mpfr_sub", (mpfr_p, mpfr_p, mpfr_p, ctypes.c_int), ctypes.c_int),
            ("mpfr_neg", (mpfr_p, mpfr_p, ctypes.c_int), ctypes.c_int),
            ("mpfr_exp", (mpfr_p, mpfr_p, ctypes.c_int), ctypes.c_int),
            ("mpfr_cmp", (mpfr_p, mpfr_p), ctypes.c_int),
            ("mpfr_cmp_ui", (mpfr_p, ctypes.c_ulong), ctypes.c_int),
            ("mpfr_get_d", (mpfr_p, ctypes.c_int), ctypes.c_double),
            ("mpfr_number_p", (mpfr_p,), ctypes.c_int),
            ("mpfr_get_emin", (), ctypes.c_long),
            ("mpfr_get_emax", (), ctypes.c_long),
            ("mpfr_set_emin", (ctypes.c_long,), ctypes.c_int),
            ("mpfr_set_emax", (ctypes.c_long,), ctypes.c_int),
            ("mpfr_clear_flags", (), None),
            ("mpfr_flags_save", (), ctypes.c_uint),
            ("mpfr_flags_restore", (ctypes.c_uint, ctypes.c_uint), None),
            ("mpfr_underflow_p", (), ctypes.c_int),
            ("mpfr_overflow_p", (), ctypes.c_int),
            ("mpfr_divby0_p", (), ctypes.c_int),
            ("mpfr_nanflag_p", (), ctypes.c_int),
            ("mpfr_inexflag_p", (), ctypes.c_int),
            ("mpfr_erangeflag_p", (), ctypes.c_int),
            ("mpfr_get_version", (), ctypes.c_char_p),
        )
        for name, argtypes, restype in signatures:
            function = getattr(self.mpfr, name)
            function.argtypes = argtypes
            function.restype = restype

        self.mpz_init = getattr(self.gmp, "__gmpz_init")
        self.mpz_init.argtypes = (mpz_p,)
        self.mpz_init.restype = None
        self.mpz_clear = getattr(self.gmp, "__gmpz_clear")
        self.mpz_clear.argtypes = (mpz_p,)
        self.mpz_clear.restype = None
        self.mpz_set_str = getattr(self.gmp, "__gmpz_set_str")
        self.mpz_set_str.argtypes = (mpz_p, ctypes.c_char_p, ctypes.c_int)
        self.mpz_set_str.restype = ctypes.c_int
        self.mpz_get_str = getattr(self.gmp, "__gmpz_get_str")
        self.mpz_get_str.argtypes = (
            ctypes.POINTER(ctypes.c_char),
            ctypes.c_int,
            mpz_p,
        )
        self.mpz_get_str.restype = ctypes.POINTER(ctypes.c_char)
        self.mpz_sizeinbase = getattr(self.gmp, "__gmpz_sizeinbase")
        self.mpz_sizeinbase.argtypes = (mpz_p, ctypes.c_int)
        self.mpz_sizeinbase.restype = ctypes.c_size_t

    def _verify_native_versions(self) -> None:
        mpfr_raw = self.mpfr.mpfr_get_version()
        gmp_raw = ctypes.c_char_p.in_dll(self.gmp, "__gmp_version").value
        if mpfr_raw is None or gmp_raw is None:
            _fail("native_version_unavailable")
        observed = (mpfr_raw.decode("ascii"), gmp_raw.decode("ascii"))
        if observed != (EXPECTED_NATIVE_MPFR_VERSION, EXPECTED_NATIVE_GMP_VERSION):
            _fail("native_version_mismatch", repr(observed))

    def flags(self) -> tuple[bool, bool, bool, bool, bool, bool]:
        return (
            bool(self.mpfr.mpfr_underflow_p()),
            bool(self.mpfr.mpfr_overflow_p()),
            bool(self.mpfr.mpfr_divby0_p()),
            bool(self.mpfr.mpfr_nanflag_p()),
            bool(self.mpfr.mpfr_inexflag_p()),
            bool(self.mpfr.mpfr_erangeflag_p()),
        )


_RUNTIME = _NativeRuntime()


def _reject_json_number(token: str) -> NoReturn:
    _fail("wire_number_invalid", token[:32])


def _parse_precision(token: str) -> int:
    if token != "256":
        _reject_json_number(token)
    return 256


def _bounded_key_detail(encoded_key: bytes) -> str:
    return "key_sha256=" + hashlib.sha256(encoded_key).hexdigest()


def _make_bounded_object_pairs_hook() -> Callable[
    [list[tuple[str, Any]]], dict[str, Any]
]:
    aggregate_key_bytes = 0

    def bounded_object_pairs(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        nonlocal aggregate_key_bytes
        if len(pairs) > MAX_OBJECT_PROPERTY_COUNT:
            _fail("wire_object_limit")
        result: dict[str, Any] = {}
        for key, value in pairs:
            try:
                encoded = key.encode("utf-8", "strict")
            except UnicodeError:
                _fail("wire_object_key_utf8_invalid")
            detail = _bounded_key_detail(encoded)
            if len(encoded) > MAX_STRING_UTF8_BYTES:
                _fail("wire_object_key_limit", detail)
            aggregate_key_bytes += len(encoded)
            if aggregate_key_bytes > MAX_AGGREGATE_UTF8_BYTES:
                _fail("wire_aggregate_utf8_limit", detail)
            if key in result:
                _fail("wire_duplicate_key", detail)
            result[key] = value
        return result

    return bounded_object_pairs


def _utf16_code_units(value: str) -> int:
    return len(value.encode("utf-16-le", "strict")) // 2


def _canonical_json(value: Any) -> str:
    return json.dumps(
        value,
        ensure_ascii=False,
        allow_nan=False,
        sort_keys=True,
        separators=(",", ":"),
    )


def _validate_budget(value: Any) -> None:
    nodes = 0
    aggregate = 0

    def visit(item: Any, depth: int) -> None:
        nonlocal nodes, aggregate
        if depth > MAX_DEPTH:
            _fail("wire_depth_limit")
        nodes += 1
        if nodes > MAX_NODES:
            _fail("wire_node_limit")
        if item is None or type(item) is bool:
            return
        if type(item) is int:
            return
        if isinstance(item, str):
            encoded = item.encode("utf-8", "strict")
            aggregate += len(encoded)
            if len(encoded) > MAX_STRING_UTF8_BYTES:
                _fail("wire_string_limit")
            if aggregate > MAX_AGGREGATE_UTF8_BYTES:
                _fail("wire_aggregate_utf8_limit")
            return
        if isinstance(item, list):
            if len(item) > MAX_ARRAY_LENGTH:
                _fail("wire_array_limit")
            for child in item:
                visit(child, depth + 1)
            return
        if isinstance(item, dict):
            if len(item) > MAX_OBJECT_PROPERTY_COUNT:
                _fail("wire_object_limit")
            for key, child in item.items():
                encoded = key.encode("utf-8", "strict")
                if len(encoded) > MAX_STRING_UTF8_BYTES:
                    _fail("wire_object_key_limit", _bounded_key_detail(encoded))
                aggregate += len(encoded)
                if aggregate > MAX_AGGREGATE_UTF8_BYTES:
                    _fail("wire_aggregate_utf8_limit")
                visit(child, depth + 1)
            return
        _fail("wire_non_json")

    visit(value, 0)


def _require_object(value: Any, keys: frozenset[str], label: str) -> Mapping[str, Any]:
    if not isinstance(value, dict) or frozenset(value) != keys:
        _fail("wire_object_shape", label)
    return value


def _require_array(value: Any, length: int, label: str) -> list[Any]:
    if not isinstance(value, list) or len(value) != length:
        _fail("wire_array_shape", label)
    return value


def _parse_endpoint(value: Any, direction: str, label: str) -> _EndpointSpec:
    record = _require_object(value, _ENDPOINT_KEYS, label)
    sign = record["sign"]
    mantissa = record["mantissaHex"]
    exponent_token = record["exponent2"]
    precision = record["precisionBits"]
    observed_direction = record["direction"]
    if sign not in ("positive_zero", "plus", "minus"):
        _fail("endpoint_sign_invalid", label)
    if not isinstance(mantissa, str) or _HEX_RE.fullmatch(mantissa) is None:
        _fail("endpoint_mantissa_invalid", label)
    if len(mantissa) > 64:
        _fail("endpoint_mantissa_precision", label)
    if (
        not isinstance(exponent_token, str)
        or _DECIMAL_RE.fullmatch(exponent_token) is None
    ):
        _fail("endpoint_exponent_invalid", label)
    if len(exponent_token) > 8:
        _fail("endpoint_exponent_range", label)
    exponent2 = int(exponent_token)
    if type(precision) is not int or precision != PRECISION_BITS:
        _fail("endpoint_precision_invalid", label)
    if observed_direction != direction:
        _fail("endpoint_direction_invalid", label)
    integer = int(mantissa, 16)
    if sign == "positive_zero":
        if integer != 0 or exponent2 != 0:
            _fail("endpoint_zero_not_unique", label)
    else:
        if integer == 0 or integer & 1 == 0:
            _fail("endpoint_nonzero_not_normalized", label)
        bit_length = integer.bit_length()
        if not (1 <= bit_length <= PRECISION_BITS):
            _fail("endpoint_mantissa_precision", label)
        top_exponent = exponent2 + bit_length
        if not (EMIN <= top_exponent <= EMAX):
            _fail("endpoint_exponent_range", label)
    return _EndpointSpec(sign, mantissa, exponent2, direction)


def _f64_dyadic(word: int) -> tuple[str, str, int]:
    sign_bit = word >> 63
    biased = (word >> 52) & 0x7FF
    fraction = word & ((1 << 52) - 1)
    if biased == 0x7FF:
        _fail("central_f64_nonfinite")
    if biased == 0 and fraction == 0:
        if sign_bit:
            _fail("central_f64_negative_zero")
        return ("positive_zero", "0", 0)
    if biased == 0:
        integer = fraction
        exponent2 = -1074
    else:
        integer = (1 << 52) | fraction
        exponent2 = biased - 1023 - 52
    while integer & 1 == 0:
        integer >>= 1
        exponent2 += 1
    return ("minus" if sign_bit else "plus", format(integer, "x"), exponent2)


def _parse_quantity(value: Any, expected_id: str, label: str) -> _QuantitySpec:
    record = _require_object(value, _QUANTITY_KEYS, label)
    if record["quantityId"] != expected_id:
        _fail("quantity_order_invalid", label)
    word_hex = record["centralF64WordHex"]
    if not isinstance(word_hex, str) or _WORD_RE.fullmatch(word_hex) is None:
        _fail("central_f64_word_invalid", label)
    word = int(word_hex, 16)
    central = _parse_endpoint(record["centralMpfr256"], "MPFR_RNDN", label + ".C")
    lower = _parse_endpoint(record["lowerMpfr256"], "MPFR_RNDD", label + ".L")
    upper = _parse_endpoint(record["upperMpfr256"], "MPFR_RNDU", label + ".U")
    if (central.sign, central.mantissa_hex, central.exponent2) != _f64_dyadic(word):
        _fail("central_f64_identity_mismatch", label)
    return _QuantitySpec(expected_id, word, central, lower, upper)


def _parse_wire(input_wire: bytes) -> _Payload:
    if type(input_wire) is not bytes:
        _fail("canonical_utf8_bytes_required")
    if len(input_wire) > MAX_WIRE_UTF8_BYTES:
        _fail("wire_byte_limit")
    if input_wire.startswith(b"\xef\xbb\xbf"):
        _fail("wire_bom_forbidden")
    try:
        text = input_wire.decode("utf-8", "strict")
    except UnicodeDecodeError as error:
        _fail("wire_utf8_invalid", str(error.start))
    if _utf16_code_units(text) > MAX_WIRE_UTF16_CODE_UNITS:
        _fail("wire_code_unit_limit")
    try:
        parsed = json.loads(
            text,
            object_pairs_hook=_make_bounded_object_pairs_hook(),
            parse_int=_parse_precision,
            parse_float=_reject_json_number,
            parse_constant=_reject_json_number,
        )
    except MetricDemandError:
        raise
    except (json.JSONDecodeError, UnicodeError, ValueError, RecursionError) as error:
        _fail("wire_json_invalid", type(error).__name__)
    try:
        _validate_budget(parsed)
    except MetricDemandError:
        raise
    except (UnicodeError, RecursionError) as error:
        _fail("wire_resource_validation_invalid", type(error).__name__)
    try:
        canonical = _canonical_json(parsed)
    except (TypeError, ValueError, UnicodeError) as error:
        _fail("wire_not_canonical", type(error).__name__)
    if canonical != text:
        _fail("wire_not_canonical")

    envelope = _require_object(parsed, _ENVELOPE_KEYS, "envelope")
    if envelope["contractVersion"] != PROGRAM_INPUT_VERSION:
        _fail("wire_contract_version_invalid")
    groups = _require_array(envelope["radiusGroups"], 4, "radiusGroups")
    parsed_groups: list[tuple[_QuantitySpec, ...]] = []
    for group_ordinal, (expected_name, _, _) in enumerate(RADIUS_GROUPS):
        group = _require_object(groups[group_ordinal], _GROUP_KEYS, "radiusGroup")
        if group["radiusGroup"] != expected_name:
            _fail("radius_group_order_invalid", str(group_ordinal))
        quantities = _require_array(group["quantities"], 5, "quantities")
        parsed_groups.append(
            tuple(
                _parse_quantity(
                    quantity,
                    expected_id,
                    f"rg{group_ordinal}.{expected_id}",
                )
                for quantity, expected_id in zip(
                    quantities, QUANTITY_ORDER, strict=True
                )
            )
        )
    scale = _require_object(envelope["siScale"], _SCALE_KEYS, "siScale")
    return _Payload(
        groups=tuple(parsed_groups),
        scale_central=_parse_endpoint(
            scale["stressScaleNCentralMpfr256"], "MPFR_RNDN", "scale.C"
        ),
        scale_lower=_parse_endpoint(
            scale["stressScaleK2LowerMpfr256"], "MPFR_RNDD", "scale.L"
        ),
        scale_upper=_parse_endpoint(
            scale["stressScaleK2UpperMpfr256"], "MPFR_RNDU", "scale.U"
        ),
    )


def _word_to_float(word: int) -> float:
    return struct.unpack(">d", word.to_bytes(8, "big"))[0]


def _float_to_word(value: float) -> int:
    return int.from_bytes(struct.pack(">d", value), "big")


class _Trace:
    def __init__(self, runtime: _NativeRuntime) -> None:
        self.runtime = runtime
        self.ordinal = 0
        self.hash = hashlib.sha256()
        self.counts: dict[str, int] = {}
        self.values: list[_Value] = []
        self.mpz_values: list[tuple[str, _MpzStruct]] = []
        self.destination_ids: set[str] = set()
        self.mpz_ids: set[str] = set()
        self.cleared_destination_ids: set[str] = set()
        self.cleared_mpz_ids: set[str] = set()
        self.stage = 0
        self.arithmetic_count = 0
        self.comparison_count = 0
        self.get_d_count = 0
        self.cleanup_complete = False
        self.cleanup_failure_codes: tuple[str, ...] = ()

    def record(self, operation: str, fields: Iterable[str] = ()) -> None:
        self.ordinal += 1
        self.counts[operation] = self.counts.get(operation, 0) + 1
        encoded = "|".join((str(self.ordinal), operation, *fields)).encode("ascii")
        self.hash.update(encoded + b"\n")

    def clear_flags(self) -> None:
        self.runtime.mpfr.mpfr_clear_flags()
        self.record("mpfr_clear_flags")

    def flags(self) -> tuple[bool, bool, bool, bool, bool, bool]:
        return self.runtime.flags()

    @staticmethod
    def _flags_text(flags: tuple[bool, bool, bool, bool, bool, bool]) -> str:
        return "".join("1" if value else "0" for value in flags)

    @staticmethod
    def _validate_flags(
        flags: tuple[bool, bool, bool, bool, bool, bool], allow_inexact: bool
    ) -> None:
        underflow, overflow, divide_by_zero, nan, inexact, erange = flags
        if underflow:
            _fail("mpfr_disallowed_flag", "underflow")
        if overflow:
            _fail("mpfr_disallowed_flag", "overflow")
        if divide_by_zero:
            _fail("mpfr_disallowed_flag", "divide_by_zero")
        if nan:
            _fail("mpfr_disallowed_flag", "nan")
        if erange:
            _fail("mpfr_disallowed_flag", "erange")
        if inexact and not allow_inexact:
            _fail("mpfr_inexact_on_exact_step")

    def _destination_id(self, scope: str, symbol: str, role: str) -> str:
        self.stage += 1
        destination_id = f"scope{scope}.stage{self.stage:06d}.{symbol}.{role}"
        if destination_id in self.destination_ids:
            _fail("mpfr_destination_reused", destination_id)
        self.destination_ids.add(destination_id)
        return destination_id

    @staticmethod
    def _mpfr_registration_value(
        destination_id: str, raw: _MpfrStruct
    ) -> _Value:
        return _Value(destination_id, raw)

    @staticmethod
    def _mpz_registration_value(
        name: str, raw: _MpzStruct
    ) -> tuple[str, _MpzStruct]:
        return (name, raw)

    def _init(self, scope: str, symbol: str, role: str) -> _Value:
        destination_id = self._destination_id(scope, symbol, role)
        raw = _MpfrStruct()
        value: _Value | None = None
        try:
            self.runtime.mpfr.mpfr_init2(ctypes.byref(raw), PRECISION_BITS)
            value = self._mpfr_registration_value(destination_id, raw)
            self.record("mpfr_init2", (destination_id, str(PRECISION_BITS)))
            if int(raw._mpfr_prec) != PRECISION_BITS or not raw._mpfr_d:
                _fail("mpfr_destination_init_failed", destination_id)
            self.values.append(value)
            return value
        except BaseException:
            registered = any(
                entry.destination_id == destination_id for entry in self.values
            )
            if not registered and raw._mpfr_d:
                try:
                    self.runtime.mpfr.mpfr_clear(ctypes.byref(raw))
                except BaseException:
                    self.values.append(
                        value or _Value(destination_id, raw)
                    )
            raise

    def arithmetic(
        self,
        scope: str,
        symbol: str,
        role: str,
        operation: str,
        sources: Iterable[str],
        rounding: int,
        call: Callable[[_MpfrStruct], int],
        *,
        exact: bool = False,
    ) -> _Value:
        self.clear_flags()
        try:
            value = self._init(scope, symbol, role)
            ternary = int(call(value.raw))
            flags = self.flags()
            if ternary not in (-1, 0, 1):
                _fail("mpfr_ternary_noncanonical", operation)
            self._validate_flags(flags, allow_inexact=not exact)
            if (ternary == 0) != (not flags[4]):
                _fail("mpfr_ternary_inexact_flag_inconsistent", operation)
            if exact and ternary != 0:
                _fail("mpfr_ternary_nonzero_on_exact_step", operation)
            self.record(
                operation,
                (
                    value.destination_id,
                    ",".join(sources),
                    ROUND_NAMES[rounding],
                    str(ternary),
                    self._flags_text(flags),
                ),
            )
            self.arithmetic_count += 1
            return value
        finally:
            self.runtime.mpfr.mpfr_clear_flags()
            self.record("mpfr_clear_flags")

    def compare(
        self, operation: str, sources: Iterable[str], call: Callable[[], int]
    ) -> int:
        self.clear_flags()
        try:
            raw = int(call())
            flags = self.flags()
            self._validate_flags(flags, allow_inexact=False)
            normalized = -1 if raw < 0 else 1 if raw > 0 else 0
            self.record(
                operation,
                (",".join(sources), str(normalized), self._flags_text(flags)),
            )
            self.comparison_count += 1
            return normalized
        finally:
            self.runtime.mpfr.mpfr_clear_flags()
            self.record("mpfr_clear_flags")

    def get_d(self, source: _Value, rounding: int) -> int:
        self.clear_flags()
        try:
            value = float(
                self.runtime.mpfr.mpfr_get_d(ctypes.byref(source.raw), rounding)
            )
            flags = self.flags()
            self._validate_flags(flags, allow_inexact=True)
            if not math.isfinite(value):
                _fail("mpfr_get_d_nonfinite", source.destination_id)
            word = _float_to_word(value)
            self.record(
                "mpfr_get_d",
                (
                    source.destination_id,
                    ROUND_NAMES[rounding],
                    f"{word:016x}",
                    self._flags_text(flags),
                ),
            )
            self.get_d_count += 1
            return word
        finally:
            self.runtime.mpfr.mpfr_clear_flags()
            self.record("mpfr_clear_flags")

    def new_mpz(self, name: str, mantissa_hex: str) -> _MpzStruct:
        if name in self.mpz_ids:
            _fail("mpz_destination_reused", name)
        self.mpz_ids.add(name)
        if self.flags() != (False, False, False, False, False, False):
            _fail("mpz_operation_entered_with_mpfr_flags", name)
        value = _MpzStruct()
        registered_value: tuple[str, _MpzStruct] | None = None
        try:
            self.runtime.mpz_init(ctypes.byref(value))
            registered_value = self._mpz_registration_value(name, value)
            self.record("mpz_init", (name,))
            self.mpz_values.append(registered_value)
        except BaseException:
            registered = any(entry_name == name for entry_name, _ in self.mpz_values)
            if not registered and value._mp_d:
                try:
                    self.runtime.mpz_clear(ctypes.byref(value))
                except BaseException:
                    self.mpz_values.append(registered_value or (name, value))
            raise
        status = int(
            self.runtime.mpz_set_str(
                ctypes.byref(value), mantissa_hex.encode("ascii"), 16
            )
        )
        self.record("mpz_set_str", (name, mantissa_hex, "16", str(status)))
        if status != 0:
            _fail("mpz_set_str_failed", name)
        size = int(self.runtime.mpz_sizeinbase(ctypes.byref(value), 16))
        buffer = ctypes.create_string_buffer(size + 2)
        result = self.runtime.mpz_get_str(buffer, 16, ctypes.byref(value))
        self.record("mpz_get_str", (name, "16"))
        if not result or buffer.value.decode("ascii") != mantissa_hex:
            _fail("mpz_canonical_roundtrip_failed", name)
        if self.flags() != (False, False, False, False, False, False):
            _fail("mpz_operation_changed_mpfr_flags", name)
        return value

    def cleanup(self) -> None:
        if self.cleanup_complete:
            if self.cleanup_failure_codes:
                _fail(
                    "mpfr_lifecycle_cleanup_failed",
                    ",".join(self.cleanup_failure_codes),
                )
            return
        issues: list[str] = []

        def remember(code: str) -> None:
            if code not in issues and len(issues) < 8:
                issues.append(code)

        def clear_mpfr(value: _Value) -> None:
            if value.destination_id in self.cleared_destination_ids:
                return
            try:
                self.runtime.mpfr.mpfr_clear(ctypes.byref(value.raw))
            except BaseException:
                remember("mpfr_clear_call_failed")
                return
            self.cleared_destination_ids.add(value.destination_id)
            try:
                self.record("mpfr_clear", (value.destination_id,))
            except BaseException:
                remember("mpfr_clear_trace_failed")

        def clear_mpz(name: str, value: _MpzStruct) -> None:
            if name in self.cleared_mpz_ids:
                return
            try:
                self.runtime.mpz_clear(ctypes.byref(value))
            except BaseException:
                remember("mpz_clear_call_failed")
                return
            self.cleared_mpz_ids.add(name)
            try:
                self.record("mpz_clear", (name,))
            except BaseException:
                remember("mpz_clear_trace_failed")

        for value in reversed(self.values):
            clear_mpfr(value)
        for value in reversed(self.values):
            clear_mpfr(value)
        if len(self.cleared_destination_ids) != len(self.values):
            remember("mpfr_destinations_uncleared")

        for name, value in reversed(self.mpz_values):
            clear_mpz(name, value)
        for name, value in reversed(self.mpz_values):
            clear_mpz(name, value)
        if len(self.cleared_mpz_ids) != len(self.mpz_values):
            remember("mpz_destinations_uncleared")

        self.cleanup_complete = (
            len(self.cleared_destination_ids) == len(self.values)
            and len(self.cleared_mpz_ids) == len(self.mpz_values)
        )
        try:
            flags_clear = self.flags() == (
                False,
                False,
                False,
                False,
                False,
                False,
            )
        except BaseException:
            flags_clear = False
            remember("cleanup_flags_unverified")
        if not flags_clear:
            remember("cleanup_flags_not_clear")
        self.cleanup_failure_codes = tuple(issues)
        if issues:
            _fail("mpfr_lifecycle_cleanup_failed", ",".join(issues))


def _arith_ui(
    trace: _Trace,
    scope: str,
    symbol: str,
    role: str,
    operation: str,
    value: int,
    rounding: int = RNDN,
) -> _Value:
    return trace.arithmetic(
        scope,
        symbol,
        role,
        operation,
        (str(value),),
        rounding,
        lambda out: trace.runtime.mpfr.mpfr_set_ui(
            ctypes.byref(out), value, rounding
        ),
        exact=True,
    )


def _arith_si(
    trace: _Trace,
    scope: str,
    symbol: str,
    role: str,
    value: int,
) -> _Value:
    return trace.arithmetic(
        scope,
        symbol,
        role,
        "mpfr_set_si",
        (str(value),),
        RNDN,
        lambda out: trace.runtime.mpfr.mpfr_set_si(ctypes.byref(out), value, RNDN),
        exact=True,
    )


def _arith_unary(
    trace: _Trace,
    scope: str,
    symbol: str,
    role: str,
    operation: str,
    source: _Value,
    rounding: int,
    *,
    exact: bool = False,
) -> _Value:
    function = getattr(trace.runtime.mpfr, operation)
    return trace.arithmetic(
        scope,
        symbol,
        role,
        operation,
        (source.destination_id,),
        rounding,
        lambda out: function(ctypes.byref(out), ctypes.byref(source.raw), rounding),
        exact=exact,
    )


def _arith_binary(
    trace: _Trace,
    scope: str,
    symbol: str,
    role: str,
    operation: str,
    left: _Value,
    right: _Value,
    rounding: int,
) -> _Value:
    function = getattr(trace.runtime.mpfr, operation)
    return trace.arithmetic(
        scope,
        symbol,
        role,
        operation,
        (left.destination_id, right.destination_id),
        rounding,
        lambda out: function(
            ctypes.byref(out), ctypes.byref(left.raw), ctypes.byref(right.raw), rounding
        ),
    )


def _arith_value_integer(
    trace: _Trace,
    scope: str,
    symbol: str,
    role: str,
    operation: str,
    source: _Value,
    integer: int,
    rounding: int,
) -> _Value:
    function = getattr(trace.runtime.mpfr, operation)
    c_integer: Any = ctypes.c_long(integer) if operation == "mpfr_mul_si" else integer
    return trace.arithmetic(
        scope,
        symbol,
        role,
        operation,
        (source.destination_id, str(integer)),
        rounding,
        lambda out: function(
            ctypes.byref(out), ctypes.byref(source.raw), c_integer, rounding
        ),
    )


def _copy(
    trace: _Trace,
    scope: str,
    symbol: str,
    role: str,
    source: _Value,
    rounding: int = RNDN,
) -> _Value:
    return _arith_unary(
        trace, scope, symbol, role, "mpfr_set", source, rounding, exact=True
    )


def _compare(trace: _Trace, left: _Value, right: _Value) -> int:
    return trace.compare(
        "mpfr_cmp",
        (left.destination_id, right.destination_id),
        lambda: trace.runtime.mpfr.mpfr_cmp(
            ctypes.byref(left.raw), ctypes.byref(right.raw)
        ),
    )


def _compare_ui(trace: _Trace, value: _Value, integer: int) -> int:
    return trace.compare(
        "mpfr_cmp_ui",
        (value.destination_id, str(integer)),
        lambda: trace.runtime.mpfr.mpfr_cmp_ui(ctypes.byref(value.raw), integer),
    )


def _load_endpoint(
    trace: _Trace, scope: str, symbol: str, role: str, spec: _EndpointSpec
) -> _Value:
    mpz_name = f"scope{scope}.{symbol}.{role}.mantissa"
    integer = trace.new_mpz(mpz_name, spec.mantissa_hex)
    if spec.sign == "positive_zero":
        return _arith_ui(trace, scope, symbol + "Signed", role, "mpfr_set_ui", 0)
    unsigned_integer = trace.arithmetic(
        scope,
        symbol + "UnsignedInteger",
        role,
        "mpfr_set_z",
        (mpz_name,),
        RNDN,
        lambda out: trace.runtime.mpfr.mpfr_set_z(
            ctypes.byref(out), ctypes.byref(integer), RNDN
        ),
        exact=True,
    )
    unsigned_dyadic = trace.arithmetic(
        scope,
        symbol + "UnsignedDyadic",
        role,
        "mpfr_mul_2si",
        (unsigned_integer.destination_id, str(spec.exponent2)),
        RNDN,
        lambda out: trace.runtime.mpfr.mpfr_mul_2si(
            ctypes.byref(out),
            ctypes.byref(unsigned_integer.raw),
            spec.exponent2,
            RNDN,
        ),
        exact=True,
    )
    operation = "mpfr_set" if spec.sign == "plus" else "mpfr_neg"
    return _arith_unary(
        trace,
        scope,
        symbol + "Signed",
        role,
        operation,
        unsigned_dyadic,
        RNDN,
        exact=True,
    )


def _load_f64_central(
    trace: _Trace, scope: str, symbol: str, word: int, witness: _Value
) -> _Value:
    value = _word_to_float(word)
    loaded = trace.arithmetic(
        scope,
        symbol + "CentralFromF64",
        "C",
        "mpfr_set_d",
        (f"{word:016x}",),
        RNDN,
        lambda out: trace.runtime.mpfr.mpfr_set_d(ctypes.byref(out), value, RNDN),
        exact=True,
    )
    if _compare(trace, loaded, witness) != 0:
        _fail("native_central_f64_identity_mismatch", symbol)
    return loaded


def _load_interval_triplet(
    trace: _Trace,
    scope: str,
    symbol: str,
    central_spec: _EndpointSpec,
    lower_spec: _EndpointSpec,
    upper_spec: _EndpointSpec,
    central_word: int | None,
) -> tuple[_Value, _Interval]:
    witness = _load_endpoint(trace, scope, symbol, "C", central_spec)
    central = (
        witness
        if central_word is None
        else _load_f64_central(trace, scope, symbol, central_word, witness)
    )
    lower = _load_endpoint(trace, scope, symbol, "L", lower_spec)
    upper = _load_endpoint(trace, scope, symbol, "U", upper_spec)
    if _compare(trace, lower, central) > 0 or _compare(trace, central, upper) > 0:
        _fail("input_interval_does_not_enclose_central", symbol)
    return central, _Interval(lower, upper)


def _interval_add(
    trace: _Trace, scope: str, symbol: str, a: _Interval, b: _Interval
) -> _Interval:
    return _Interval(
        _arith_binary(trace, scope, symbol, "L", "mpfr_add", a.lower, b.lower, RNDD),
        _arith_binary(trace, scope, symbol, "U", "mpfr_add", a.upper, b.upper, RNDU),
    )


def _interval_sub(
    trace: _Trace, scope: str, symbol: str, a: _Interval, b: _Interval
) -> _Interval:
    return _Interval(
        _arith_binary(trace, scope, symbol, "L", "mpfr_sub", a.lower, b.upper, RNDD),
        _arith_binary(trace, scope, symbol, "U", "mpfr_sub", a.upper, b.lower, RNDU),
    )


def _interval_neg(
    trace: _Trace, scope: str, symbol: str, value: _Interval
) -> _Interval:
    return _Interval(
        _arith_unary(
            trace, scope, symbol, "L", "mpfr_neg", value.upper, RNDD, exact=True
        ),
        _arith_unary(
            trace, scope, symbol, "U", "mpfr_neg", value.lower, RNDU, exact=True
        ),
    )


def _interval_multiply(
    trace: _Trace, scope: str, symbol: str, a: _Interval, b: _Interval
) -> _Interval:
    pairs = (
        ("LL", a.lower, b.lower),
        ("LU", a.lower, b.upper),
        ("UL", a.upper, b.lower),
        ("UU", a.upper, b.upper),
    )
    lower_candidates = tuple(
        _arith_binary(
            trace,
            scope,
            symbol + suffix + "Candidate",
            "L",
            "mpfr_mul",
            left,
            right,
            RNDD,
        )
        for suffix, left, right in pairs
    )
    upper_candidates = tuple(
        _arith_binary(
            trace,
            scope,
            symbol + suffix + "Candidate",
            "U",
            "mpfr_mul",
            left,
            right,
            RNDU,
        )
        for suffix, left, right in pairs
    )
    selected_lower = lower_candidates[0]
    for candidate in lower_candidates[1:]:
        if _compare(trace, selected_lower, candidate) > 0:
            selected_lower = candidate
    selected_upper = upper_candidates[0]
    for candidate in upper_candidates[1:]:
        if _compare(trace, selected_upper, candidate) < 0:
            selected_upper = candidate
    return _Interval(
        _copy(trace, scope, symbol, "L", selected_lower),
        _copy(trace, scope, symbol, "U", selected_upper),
    )


def _interval_mul_integer(
    trace: _Trace, scope: str, symbol: str, value: _Interval, integer: int
) -> _Interval:
    integer_l = _arith_si(trace, scope, symbol + "Integer", "L", integer)
    integer_u = _arith_si(trace, scope, symbol + "Integer", "U", integer)
    return _interval_multiply(
        trace, scope, symbol + "Product", value, _Interval(integer_l, integer_u)
    )


def _interval_div_positive(
    trace: _Trace, scope: str, symbol: str, a: _Interval, b: _Interval
) -> _Interval:
    if _compare_ui(trace, b.lower, 0) <= 0:
        _fail("interval_denominator_not_positive", symbol)
    reciprocal_l = trace.arithmetic(
        scope,
        symbol + "Reciprocal",
        "L",
        "mpfr_ui_div",
        ("1", b.upper.destination_id),
        RNDD,
        lambda out: trace.runtime.mpfr.mpfr_ui_div(
            ctypes.byref(out), 1, ctypes.byref(b.upper.raw), RNDD
        ),
    )
    reciprocal_u = trace.arithmetic(
        scope,
        symbol + "Reciprocal",
        "U",
        "mpfr_ui_div",
        ("1", b.lower.destination_id),
        RNDU,
        lambda out: trace.runtime.mpfr.mpfr_ui_div(
            ctypes.byref(out), 1, ctypes.byref(b.lower.raw), RNDU
        ),
    )
    return _interval_multiply(
        trace,
        scope,
        symbol + "Product",
        a,
        _Interval(reciprocal_l, reciprocal_u),
    )


def _interval_exp(
    trace: _Trace, scope: str, symbol: str, value: _Interval
) -> _Interval:
    return _Interval(
        _arith_unary(trace, scope, symbol, "L", "mpfr_exp", value.lower, RNDD),
        _arith_unary(trace, scope, symbol, "U", "mpfr_exp", value.upper, RNDU),
    )


def _interval_copy(
    trace: _Trace, scope: str, symbol: str, value: _Interval
) -> _Interval:
    return _Interval(
        _copy(trace, scope, symbol, "L", value.lower),
        _copy(trace, scope, symbol, "U", value.upper),
    )


def _interval_zero(trace: _Trace, scope: str, symbol: str) -> _Interval:
    return _Interval(
        _arith_ui(trace, scope, symbol, "L", "mpfr_set_ui", 0),
        _arith_ui(trace, scope, symbol, "U", "mpfr_set_ui", 0),
    )


def _geometry(
    trace: _Trace,
    group_ordinal: int,
    sample: int,
    radius_numerator: int,
) -> tuple[
    _Value,
    _Interval,
    tuple[_Value, _Value, _Value],
    tuple[_Interval, _Interval, _Interval],
]:
    scope = f"rg{group_ordinal}.s{sample}"
    ix = sample % 4
    iy = (sample // 4) % 4
    iz = sample // 16
    numerators = (
        AXIS_NUMERATORS[ix],
        AXIS_NUMERATORS[iy],
        AXIS_NUMERATORS[iz],
    )
    if sum(value * value for value in numerators) != radius_numerator:
        _fail("sample_radius_membership_mismatch", str(sample))

    q_c = _arith_ui(trace, scope, "q", "C", "mpfr_set_ui", radius_numerator)
    sqrt_q_c = _arith_unary(trace, scope, "sqrtQ", "C", "mpfr_sqrt", q_c, RNDN)
    x_c = trace.arithmetic(
        scope,
        "x",
        "C",
        "mpfr_div_ui",
        (sqrt_q_c.destination_id, "8"),
        RNDN,
        lambda out: trace.runtime.mpfr.mpfr_div_ui(
            ctypes.byref(out), ctypes.byref(sqrt_q_c.raw), 8, RNDN
        ),
    )
    n_c: list[_Value] = []
    for axis, numerator in zip(("X", "Y", "Z"), numerators, strict=True):
        num_c = _arith_si(trace, scope, "num" + axis, "C", numerator)
        n_c.append(
            _arith_binary(
                trace,
                scope,
                "n" + axis,
                "C",
                "mpfr_div",
                num_c,
                sqrt_q_c,
                RNDN,
            )
        )

    q_l = _arith_ui(trace, scope, "q", "L", "mpfr_set_ui", radius_numerator)
    q_u = _arith_ui(trace, scope, "q", "U", "mpfr_set_ui", radius_numerator)
    sqrt_q_l = _arith_unary(trace, scope, "sqrtQ", "L", "mpfr_sqrt", q_l, RNDD)
    sqrt_q_u = _arith_unary(trace, scope, "sqrtQ", "U", "mpfr_sqrt", q_u, RNDU)
    x_l = trace.arithmetic(
        scope,
        "x",
        "L",
        "mpfr_div_ui",
        (sqrt_q_l.destination_id, "8"),
        RNDD,
        lambda out: trace.runtime.mpfr.mpfr_div_ui(
            ctypes.byref(out), ctypes.byref(sqrt_q_l.raw), 8, RNDD
        ),
    )
    x_u = trace.arithmetic(
        scope,
        "x",
        "U",
        "mpfr_div_ui",
        (sqrt_q_u.destination_id, "8"),
        RNDU,
        lambda out: trace.runtime.mpfr.mpfr_div_ui(
            ctypes.byref(out), ctypes.byref(sqrt_q_u.raw), 8, RNDU
        ),
    )
    n_hulls: list[_Interval] = []
    for axis, numerator in zip(("X", "Y", "Z"), numerators, strict=True):
        absolute = abs(numerator)
        abs_l = _arith_ui(trace, scope, "absNum" + axis, "L", "mpfr_set_ui", absolute)
        abs_u = _arith_ui(trace, scope, "absNum" + axis, "U", "mpfr_set_ui", absolute)
        n_abs_l = _arith_binary(
            trace,
            scope,
            "nAbs" + axis,
            "L",
            "mpfr_div",
            abs_l,
            sqrt_q_u,
            RNDD,
        )
        n_abs_u = _arith_binary(
            trace,
            scope,
            "nAbs" + axis,
            "U",
            "mpfr_div",
            abs_u,
            sqrt_q_l,
            RNDU,
        )
        if numerator > 0:
            n_l = _copy(trace, scope, "n" + axis, "L", n_abs_l)
            n_u = _copy(trace, scope, "n" + axis, "U", n_abs_u)
        else:
            n_l = _arith_unary(
                trace,
                scope,
                "n" + axis,
                "L",
                "mpfr_neg",
                n_abs_u,
                RNDD,
                exact=True,
            )
            n_u = _arith_unary(
                trace,
                scope,
                "n" + axis,
                "U",
                "mpfr_neg",
                n_abs_l,
                RNDU,
                exact=True,
            )
        n_hulls.append(_Interval(n_l, n_u))
    return x_c, _Interval(x_l, x_u), tuple(n_c), tuple(n_hulls)


def _central_scalars(
    trace: _Trace, scope: str, central: Mapping[str, _Value], x: _Value
) -> tuple[_Value, _Value, _Value]:
    f1 = central["F1"]
    f0p = central["F0_prime"]
    f1p = central["F1_prime"]
    f0pp = central["F0_double_prime"]
    f1pp = central["F1_double_prime"]
    e0 = _arith_value_integer(trace, scope, "e0", "C", "mpfr_mul_si", f1, -2, RNDN)
    e = _arith_unary(trace, scope, "e", "C", "mpfr_exp", e0, RNDN)

    r0 = _arith_value_integer(trace, scope, "r0", "C", "mpfr_mul_ui", f1pp, 2, RNDN)
    r1 = _arith_binary(trace, scope, "r1", "C", "mpfr_mul", f1p, f1p, RNDN)
    r2 = _arith_value_integer(trace, scope, "r2", "C", "mpfr_mul_ui", f1p, 4, RNDN)
    r3 = _arith_binary(trace, scope, "r3", "C", "mpfr_div", r2, x, RNDN)
    r4 = _arith_binary(trace, scope, "r4", "C", "mpfr_add", r0, r1, RNDN)
    r5 = _arith_binary(trace, scope, "r5", "C", "mpfr_add", r4, r3, RNDN)
    r6 = _arith_binary(trace, scope, "r6", "C", "mpfr_mul", e, r5, RNDN)
    rho = _arith_unary(
        trace, scope, "rho", "C", "mpfr_neg", r6, RNDN, exact=True
    )

    p0 = _arith_binary(trace, scope, "p0", "C", "mpfr_mul", f0p, f1p, RNDN)
    p1 = _arith_value_integer(trace, scope, "p1", "C", "mpfr_mul_ui", p0, 2, RNDN)
    p2 = _arith_binary(trace, scope, "p2", "C", "mpfr_mul", f1p, f1p, RNDN)
    p3 = _arith_binary(trace, scope, "p3", "C", "mpfr_add", f0p, f1p, RNDN)
    p4 = _arith_value_integer(trace, scope, "p4", "C", "mpfr_mul_ui", p3, 2, RNDN)
    p5 = _arith_binary(trace, scope, "p5", "C", "mpfr_div", p4, x, RNDN)
    p6 = _arith_binary(trace, scope, "p6", "C", "mpfr_add", p1, p2, RNDN)
    p7 = _arith_binary(trace, scope, "p7", "C", "mpfr_add", p6, p5, RNDN)
    pr = _arith_binary(trace, scope, "pr", "C", "mpfr_mul", e, p7, RNDN)

    t0 = _arith_binary(trace, scope, "t0", "C", "mpfr_mul", f0p, f0p, RNDN)
    t1 = _arith_binary(trace, scope, "t1", "C", "mpfr_add", t0, f0pp, RNDN)
    t2 = _arith_binary(trace, scope, "t2", "C", "mpfr_add", t1, f1pp, RNDN)
    t3 = _arith_binary(trace, scope, "t3", "C", "mpfr_add", f0p, f1p, RNDN)
    t4 = _arith_binary(trace, scope, "t4", "C", "mpfr_div", t3, x, RNDN)
    t5 = _arith_binary(trace, scope, "t5", "C", "mpfr_add", t2, t4, RNDN)
    pt = _arith_binary(trace, scope, "pt", "C", "mpfr_mul", e, t5, RNDN)
    return rho, pr, pt


def _directed_scalars(
    trace: _Trace, scope: str, hulls: Mapping[str, _Interval], x: _Interval
) -> tuple[_Interval, _Interval, _Interval]:
    f1 = hulls["F1"]
    f0p = hulls["F0_prime"]
    f1p = hulls["F1_prime"]
    f0pp = hulls["F0_double_prime"]
    f1pp = hulls["F1_double_prime"]
    e0 = _interval_mul_integer(trace, scope, "e0Hull", f1, -2)
    e = _interval_exp(trace, scope, "eHull", e0)

    r0 = _interval_mul_integer(trace, scope, "r0Hull", f1pp, 2)
    r1 = _interval_multiply(trace, scope, "r1Hull", f1p, f1p)
    r2 = _interval_mul_integer(trace, scope, "r2Hull", f1p, 4)
    r3 = _interval_div_positive(trace, scope, "r3Hull", r2, x)
    r4 = _interval_add(trace, scope, "r4Hull", r0, r1)
    r5 = _interval_add(trace, scope, "r5Hull", r4, r3)
    r6 = _interval_multiply(trace, scope, "r6Hull", e, r5)
    rho = _interval_neg(trace, scope, "rhoHull", r6)

    p0 = _interval_multiply(trace, scope, "p0Hull", f0p, f1p)
    p1 = _interval_mul_integer(trace, scope, "p1Hull", p0, 2)
    p2 = _interval_multiply(trace, scope, "p2Hull", f1p, f1p)
    p3 = _interval_add(trace, scope, "p3Hull", f0p, f1p)
    p4 = _interval_mul_integer(trace, scope, "p4Hull", p3, 2)
    p5 = _interval_div_positive(trace, scope, "p5Hull", p4, x)
    p6 = _interval_add(trace, scope, "p6Hull", p1, p2)
    p7 = _interval_add(trace, scope, "p7Hull", p6, p5)
    pr = _interval_multiply(trace, scope, "prHull", e, p7)

    t0 = _interval_multiply(trace, scope, "t0Hull", f0p, f0p)
    t1 = _interval_add(trace, scope, "t1Hull", t0, f0pp)
    t2 = _interval_add(trace, scope, "t2Hull", t1, f1pp)
    t3 = _interval_add(trace, scope, "t3Hull", f0p, f1p)
    t4 = _interval_div_positive(trace, scope, "t4Hull", t3, x)
    t5 = _interval_add(trace, scope, "t5Hull", t2, t4)
    pt = _interval_multiply(trace, scope, "ptHull", e, t5)
    return rho, pr, pt


def _canonicalize_zero(
    trace: _Trace, scope: str, symbol: str, role: str, source: _Value
) -> _Value:
    if _compare_ui(trace, source, 0) == 0:
        return _arith_ui(trace, scope, symbol, role, "mpfr_set_ui", 0)
    return _copy(trace, scope, symbol, role, source)


def _terminal(
    trace: _Trace,
    scope: str,
    component_c: _Value,
    component_hull: _Interval,
    scale_c: _Value,
    scale_hull: _Interval,
) -> tuple[int, int]:
    c_raw = _arith_binary(
        trace, scope, "cSiRaw", "C", "mpfr_mul", component_c, scale_c, RNDN
    )
    c_canonical = _canonicalize_zero(trace, scope, "cSiCanonical", "C", c_raw)
    c_word = trace.get_d(c_canonical, RNDN)
    if c_word & ((1 << 63) - 1) == 0:
        c_word = 0
    c_float = _word_to_float(c_word)
    c_exact = trace.arithmetic(
        scope,
        "cExact",
        "C",
        "mpfr_set_d",
        (f"{c_word:016x}",),
        RNDN,
        lambda out: trace.runtime.mpfr.mpfr_set_d(
            ctypes.byref(out), c_float, RNDN
        ),
        exact=True,
    )
    final_raw = _interval_multiply(
        trace, scope, "finalRawHull", component_hull, scale_hull
    )
    final_l = _canonicalize_zero(
        trace, scope, "finalCanonical", "L", final_raw.lower
    )
    final_u = _canonicalize_zero(
        trace, scope, "finalCanonical", "U", final_raw.upper
    )
    if _compare(trace, final_l, c_exact) > 0:
        _fail("serialized_center_below_final_hull", scope)
    if _compare(trace, c_exact, final_u) > 0:
        _fail("serialized_center_above_final_hull", scope)
    distance_l = _arith_binary(
        trace, scope, "distance", "L", "mpfr_sub", c_exact, final_l, RNDU
    )
    distance_u = _arith_binary(
        trace, scope, "distance", "U", "mpfr_sub", final_u, c_exact, RNDU
    )
    selected = (
        distance_l
        if _compare(trace, distance_l, distance_u) >= 0
        else distance_u
    )
    distance_max = _copy(trace, scope, "distanceMax", "U", selected)
    u_word = trace.get_d(distance_max, RNDU)
    if u_word & ((1 << 63) - 1) == 0:
        u_word = 0
    u_float = _word_to_float(u_word)
    if u_float < 0.0:
        _fail("serialized_error_negative", scope)
    u_exact = trace.arithmetic(
        scope,
        "uExact",
        "U",
        "mpfr_set_d",
        (f"{u_word:016x}",),
        RNDN,
        lambda out: trace.runtime.mpfr.mpfr_set_d(
            ctypes.byref(out), u_float, RNDN
        ),
        exact=True,
    )
    if _compare(trace, u_exact, distance_l) < 0:
        _fail("serialized_error_below_lower_distance", scope)
    if _compare(trace, u_exact, distance_u) < 0:
        _fail("serialized_error_below_upper_distance", scope)
    return c_word, u_word


def _execute_graph(
    trace: _Trace, payload: _Payload
) -> tuple[bytes, bytes]:
    scale_c, scale_hull = _load_interval_triplet(
        trace,
        "global",
        "stressScale",
        payload.scale_central,
        payload.scale_lower,
        payload.scale_upper,
        None,
    )
    central_buffer = bytearray(5_120)
    error_buffer = bytearray(5_120)
    visited: list[int] = []
    for group_ordinal, ((_, radius_numerator, members), quantity_specs) in enumerate(
        zip(RADIUS_GROUPS, payload.groups, strict=True)
    ):
        group_c: dict[str, _Value] = {}
        group_hulls: dict[str, _Interval] = {}
        for quantity in quantity_specs:
            central, hull = _load_interval_triplet(
                trace,
                f"rg{group_ordinal}",
                quantity.quantity_id,
                quantity.central,
                quantity.lower,
                quantity.upper,
                quantity.central_word,
            )
            group_c[quantity.quantity_id] = central
            group_hulls[quantity.quantity_id] = hull
        for sample in members:
            visited.append(sample)
            sample_scope = f"rg{group_ordinal}.s{sample}"
            x_c, x_hull, n_c, n_hulls = _geometry(
                trace, group_ordinal, sample, radius_numerator
            )
            rho_c, pr_c, pt_c = _central_scalars(trace, sample_scope, group_c, x_c)
            rho_hull, pr_hull, pt_hull = _directed_scalars(
                trace, sample_scope, group_hulls, x_hull
            )
            diff_c = _arith_binary(
                trace, sample_scope, "diff", "C", "mpfr_sub", pr_c, pt_c, RNDN
            )
            diff_hull = _interval_sub(
                trace, sample_scope, "diffHull", pr_hull, pt_hull
            )
            axis_pairs = ((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2))
            for component_ordinal, component in enumerate(COMPONENT_ORDER):
                component_scope = sample_scope + f".c{component}"
                if component == "00":
                    component_c = _copy(
                        trace, component_scope, "component", "C", rho_c
                    )
                    component_hull = _interval_copy(
                        trace, component_scope, "componentHull", rho_hull
                    )
                elif component in ("01", "02", "03"):
                    component_c = _arith_ui(
                        trace,
                        component_scope,
                        "component",
                        "C",
                        "mpfr_set_ui",
                        0,
                    )
                    component_hull = _interval_zero(
                        trace, component_scope, "componentHull"
                    )
                else:
                    i, j = axis_pairs[component_ordinal - 4]
                    nij_c = _arith_binary(
                        trace,
                        component_scope,
                        "nij",
                        "C",
                        "mpfr_mul",
                        n_c[i],
                        n_c[j],
                        RNDN,
                    )
                    nij_hull = _interval_multiply(
                        trace,
                        component_scope,
                        "nijHull",
                        n_hulls[i],
                        n_hulls[j],
                    )
                    corr_c = _arith_binary(
                        trace,
                        component_scope,
                        "corr",
                        "C",
                        "mpfr_mul",
                        diff_c,
                        nij_c,
                        RNDN,
                    )
                    corr_hull = _interval_multiply(
                        trace,
                        component_scope,
                        "corrHull",
                        diff_hull,
                        nij_hull,
                    )
                    if i == j:
                        base_c = _copy(
                            trace, component_scope, "base", "C", pt_c
                        )
                        base_hull = _interval_copy(
                            trace, component_scope, "baseHull", pt_hull
                        )
                    else:
                        base_c = _arith_ui(
                            trace,
                            component_scope,
                            "base",
                            "C",
                            "mpfr_set_ui",
                            0,
                        )
                        base_hull = _interval_zero(
                            trace, component_scope, "baseHull"
                        )
                    component_c = _arith_binary(
                        trace,
                        component_scope,
                        "component",
                        "C",
                        "mpfr_add",
                        base_c,
                        corr_c,
                        RNDN,
                    )
                    component_hull = _interval_add(
                        trace,
                        component_scope,
                        "componentHull",
                        base_hull,
                        corr_hull,
                    )
                central_word, error_word = _terminal(
                    trace,
                    component_scope,
                    component_c,
                    component_hull,
                    scale_c,
                    scale_hull,
                )
                offset = 8 * (10 * sample + component_ordinal)
                central_buffer[offset : offset + 8] = central_word.to_bytes(8, "little")
                error_buffer[offset : offset + 8] = error_word.to_bytes(8, "little")
    if tuple(visited) != SAMPLE_VISIT_ORDER or sorted(visited) != list(range(64)):
        _fail("sample_visit_order_invalid")
    return bytes(central_buffer), bytes(error_buffer)


def _context_enter(trace: _Trace, guard: _ContextGuard) -> None:
    saved_flags = int(trace.runtime.mpfr.mpfr_flags_save())
    guard.saved_flags = saved_flags
    guard.active = True
    trace.record("mpfr_flags_save", (str(saved_flags),))
    trace.clear_flags()
    saved_emin = int(trace.runtime.mpfr.mpfr_get_emin())
    guard.saved_emin = saved_emin
    trace.record("mpfr_get_emin", (str(saved_emin),))
    saved_emax = int(trace.runtime.mpfr.mpfr_get_emax())
    guard.saved_emax = saved_emax
    trace.record("mpfr_get_emax", (str(saved_emax),))
    guard.range_snapshot_complete = True
    if saved_emin > EMIN or saved_emax < EMAX:
        _fail("caller_exponent_range_precondition")
    guard.range_mutation_started = True
    if int(trace.runtime.mpfr.mpfr_set_emin(EMIN)) != 0:
        _fail("mpfr_set_emin_failed")
    trace.record("mpfr_set_emin", (str(EMIN),))
    if int(trace.runtime.mpfr.mpfr_set_emax(EMAX)) != 0:
        _fail("mpfr_set_emax_failed")
    trace.record("mpfr_set_emax", (str(EMAX),))
    if trace.flags() != (False, False, False, False, False, False):
        _fail("mpfr_context_operation_set_flags")


def _context_restore(trace: _Trace, guard: _ContextGuard) -> _ContextRecovery:
    if not guard.active:
        return _ContextRecovery(True, (), ())
    observed: list[str] = []

    def remember(code: str) -> None:
        if code not in observed and len(observed) < 12:
            observed.append(code)

    def set_emax(phase: str) -> None:
        assert guard.saved_emax is not None
        try:
            status = int(trace.runtime.mpfr.mpfr_set_emax(guard.saved_emax))
        except BaseException:
            remember("set_emax_call_failed")
            return
        if status != 0:
            remember("set_emax_status_failed")
            return
        try:
            trace.record("mpfr_set_emax", (str(guard.saved_emax), phase))
        except BaseException:
            remember("set_emax_trace_failed")

    def set_emin(phase: str) -> None:
        assert guard.saved_emin is not None
        try:
            status = int(trace.runtime.mpfr.mpfr_set_emin(guard.saved_emin))
        except BaseException:
            remember("set_emin_call_failed")
            return
        if status != 0:
            remember("set_emin_status_failed")
            return
        try:
            trace.record("mpfr_set_emin", (str(guard.saved_emin), phase))
        except BaseException:
            remember("set_emin_trace_failed")

    def verify_emax(phase: str) -> bool:
        assert guard.saved_emax is not None
        try:
            observed_emax = int(trace.runtime.mpfr.mpfr_get_emax())
        except BaseException:
            remember("get_emax_call_failed")
            return False
        try:
            trace.record("mpfr_get_emax", (str(observed_emax), phase))
        except BaseException:
            remember("get_emax_trace_failed")
        return observed_emax == guard.saved_emax

    def verify_emin(phase: str) -> bool:
        assert guard.saved_emin is not None
        try:
            observed_emin = int(trace.runtime.mpfr.mpfr_get_emin())
        except BaseException:
            remember("get_emin_call_failed")
            return False
        try:
            trace.record("mpfr_get_emin", (str(observed_emin), phase))
        except BaseException:
            remember("get_emin_trace_failed")
        return observed_emin == guard.saved_emin

    def restore_flags(phase: str) -> None:
        assert guard.saved_flags is not None
        try:
            trace.runtime.mpfr.mpfr_flags_restore(
                guard.saved_flags, MPFR_FLAGS_ALL
            )
        except BaseException:
            remember("flags_restore_call_failed")
            return
        try:
            fields = (str(guard.saved_flags), str(MPFR_FLAGS_ALL))
            if phase != "restore":
                fields += (phase,)
            trace.record(
                "mpfr_flags_restore",
                fields,
            )
        except BaseException:
            remember("flags_restore_trace_failed")

    def verify_flags(phase: str) -> bool:
        assert guard.saved_flags is not None
        try:
            restored_flags = int(trace.runtime.mpfr.mpfr_flags_save())
        except BaseException:
            remember("flags_save_call_failed")
            return False
        fields = (str(restored_flags), phase)
        try:
            trace.record("mpfr_flags_save", fields)
        except BaseException:
            remember("flags_save_trace_failed")
        return restored_flags == guard.saved_flags

    range_ok = not guard.range_mutation_started
    if guard.range_snapshot_complete:
        set_emax("restore")
        set_emin("restore")
        range_ok = verify_emax("verify_restore") & verify_emin("verify_restore")
    elif guard.range_mutation_started:
        remember("range_snapshot_incomplete_after_mutation")
        range_ok = False

    restore_flags("restore")
    flags_ok = verify_flags("verify_restore")

    if guard.range_snapshot_complete and not range_ok:
        set_emax("restore_retry")
        set_emin("restore_retry")
        range_ok = verify_emax("verify_restore_retry") & verify_emin(
            "verify_restore_retry"
        )
    if not flags_ok:
        restore_flags("restore_retry")
        flags_ok = verify_flags("verify_restore_retry")

    unresolved: list[str] = []
    if not range_ok:
        unresolved.append("range_unverified")
    if not flags_ok:
        unresolved.append("flags_unverified")
    complete = not unresolved
    guard.restored = complete
    if complete:
        guard.active = False
    return _ContextRecovery(complete, tuple(unresolved), tuple(observed))


def execute_synthetic_metric_demand(input_wire: bytes) -> MetricDemandResult:
    """Execute one canonical synthetic metric-demand wire without authority."""

    with _ExclusiveLease():
        if _CONTEXT_POISONED:
            _fail(
                "mpfr_context_poisoned",
                ",".join(_CONTEXT_POISON_REASONS),
            )
        _require_runtime_versions()
        trace = _Trace(_RUNTIME)
        guard = _ContextGuard()
        graph_result: tuple[bytes, bytes] | None = None
        primary_error: BaseException | None = None
        lifecycle_error: BaseException | None = None
        try:
            _context_enter(trace, guard)
            payload = _parse_wire(input_wire)
            graph_result = _execute_graph(trace, payload)
        except BaseException as error:
            primary_error = error
        try:
            trace.cleanup()
        except BaseException as cleanup_error:
            lifecycle_error = cleanup_error

        try:
            recovery = _context_restore(trace, guard)
        except BaseException as unexpected_restore_error:
            recovery = _ContextRecovery(
                False,
                ("restore_routine_unexpected_exception",),
                (_bounded_error_code(unexpected_restore_error),),
            )

        restore_error: BaseException | None = None
        if not recovery.complete:
            _poison_context(recovery.unresolved)
            restore_error = MetricDemandError(
                "mpfr_context_restore_failed", ",".join(recovery.unresolved)
            )
            _add_bounded_note(restore_error, "suppressed_primary", primary_error)
            _add_bounded_note(
                restore_error, "suppressed_lifecycle", lifecycle_error
            )
        elif (
            recovery.observed_failures
            and primary_error is None
            and lifecycle_error is None
        ):
            restore_error = MetricDemandError(
                "mpfr_context_restore_recovered_after_failure",
                ",".join(recovery.observed_failures),
            )

        if restore_error is not None:
            raise restore_error
        if lifecycle_error is not None:
            _add_bounded_note(
                lifecycle_error, "suppressed_primary", primary_error
            )
            if recovery.observed_failures:
                lifecycle_error.add_note(
                    "context_restore_recovered:"
                    + ",".join(recovery.observed_failures)
                )
            raise lifecycle_error
        if primary_error is not None:
            if recovery.observed_failures:
                primary_error.add_note(
                    "context_restore_recovered:"
                    + ",".join(recovery.observed_failures)
                )
            raise primary_error
        if graph_result is None:
            _fail("metric_demand_internal_missing_result")
        central_bytes, error_bytes = graph_result
        if len(central_bytes) != 5_120 or len(error_bytes) != 5_120:
            _fail("metric_demand_output_size_invalid")
        operation_counts = tuple(sorted(trace.counts.items()))
        receipt = MetricDemandReceipt(
            program_sha256=PROGRAM_SHA256,
            program_canonical_size_bytes=PROGRAM_CANONICAL_SIZE_BYTES,
            program_raw_sha256=PROGRAM_RAW_SHA256,
            program_raw_size_bytes=PROGRAM_RAW_SIZE_BYTES,
            primitive_graph_id=PROGRAM_GRAPH_ID,
            input_sha256=hashlib.sha256(input_wire).hexdigest(),
            metric_demand_sha256=hashlib.sha256(central_bytes).hexdigest(),
            absolute_error_sha256=hashlib.sha256(error_bytes).hexdigest(),
            metric_demand_size_bytes=len(central_bytes),
            absolute_error_size_bytes=len(error_bytes),
            gmpy2_version=gmpy2.__version__,
            mpfr_version=gmpy2.mpfr_version(),
            gmp_version=gmpy2.mp_version(),
            native_mpfr_version=EXPECTED_NATIVE_MPFR_VERSION,
            native_gmp_version=EXPECTED_NATIVE_GMP_VERSION,
            native_mpfr_disk_file_sha256_at_module_admission=(
                NATIVE_MPFR_DLL_SHA256
            ),
            native_mpfr_disk_file_size_bytes_at_module_admission=(
                NATIVE_MPFR_DLL_SIZE_BYTES
            ),
            native_gmp_disk_file_sha256_at_module_admission=NATIVE_GMP_DLL_SHA256,
            native_gmp_disk_file_size_bytes_at_module_admission=(
                NATIVE_GMP_DLL_SIZE_BYTES
            ),
            arithmetic_uses_native_mpfr_gmp_abi=True,
            native_runtime_disk_files_hash_verified_at_module_admission=True,
            exact_loaded_native_module_byte_identity_proved=False,
            native_module_hash_to_load_toctou_closed=False,
            gmpy2_used_only_for_runtime_location_and_version_metadata=True,
            gmpy2_numeric_arithmetic_used=False,
            implementation_blockers=(
                "exact_loaded_native_module_byte_identity_unproved_due_"
                "gmpy2_preload_and_hash_to_load_toctou",
            ),
            trace_event_count=trace.ordinal,
            trace_chronology_sha256=trace.hash.hexdigest(),
            operation_counts=operation_counts,
            sample_visit_order=SAMPLE_VISIT_ORDER,
            component_order=COMPONENT_ORDER,
            stored_element_count_per_role=640,
            arithmetic_observation_count=trace.arithmetic_count,
            comparison_observation_count=trace.comparison_count,
            get_d_observation_count=trace.get_d_count,
            mpfr_destination_count=len(trace.values),
            mpz_destination_count=len(trace.mpz_values),
            all_destinations_single_assignment=(
                len(trace.destination_ids) == len(trace.values)
                and len(trace.mpz_ids) == len(trace.mpz_values)
            ),
            reverse_lifecycle_cleanup_verified=trace.cleanup_complete,
            caller_context_restored_before_receipt=True,
            caller_flags_restored_before_receipt=True,
            primitive_flags_verified=True,
            serialized_center_enclosure_verified=True,
            synthetic_input_only=True,
            calculation_only=True,
            branch_geometry_accepted=False,
            metric_demand_tensor_materialized=False,
            metric_demand_absolute_error_bound_materialized=False,
            derivation_receipt_materialized=False,
            interval_trace_server_replayed=False,
            si_scale_receipt_verified=False,
            scientific_candidate_manifest_authority=False,
            scientific_preseal_authority=False,
            execution_ready=False,
            replay_ready=False,
            publication_ready=False,
            certification_ready=False,
            execution_authority=False,
            replay_authority=False,
            independent_agreement=False,
            semiclassical_stress_noise_lamp=False,
            semiclassical_constraint_algebra_lamp=False,
            diagnostic_pass=False,
            theory_graph_promotion=False,
            physical_viability=False,
            propulsion=False,
            transport=False,
        )
        return MetricDemandResult(central_bytes, error_bytes, receipt)


__all__ = (
    "MetricDemandError",
    "MetricDemandReceipt",
    "MetricDemandResult",
    "execute_synthetic_metric_demand",
)
