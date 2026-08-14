"""Calculation-only MPFR-256 materializer for the spherical-v2 SI graph.

This module evaluates the values and directed enclosures of the static
normalization graph frozen by
``nhm2-spherical-boson-star-v2-si-output-normalization.v1``.  Its source-local
``ctypes`` boundary observes pinned MPFR/GMP DLL files and cross-checks the
mutable-destination construction for unsigned integers and exact dyadics.  The
remaining numerical graph is evaluated by ``gmpy2``.  Hashing a pathname before
``ctypes.CDLL`` does not prove that the mapped bytes are the hashed bytes, and
this module does not hold an exclusive native-context lease through the graph.
Its receipt therefore records those limitations explicitly and never claims
full native operation-trace or production-runtime conformance.  This module
does not read candidate arrays, solve the branch, admit execution, or grant
replay or claim authority.  A runtime-bound primary implementation and a
source/runtime-disjoint independent implementation are still required.
Its receipt registry is only a same-module origin/content diagnostic and must
never be promoted as a server-authenticated capability.
"""

from __future__ import annotations

import ctypes
from dataclasses import dataclass, fields
import hashlib
import hmac
import math
from pathlib import Path
import struct
from typing import Callable, Final
import weakref

import gmpy2


CONTRACT_SHA256: Final[str] = (
    "16224114ce7bc790d1e5ceeaf8f75e31e5c37412856c5bea8b99284301bf3c24"
)
CONTRACT_CANONICAL_SIZE_BYTES: Final[int] = 23_822
CODATA_RAW_SHA256: Final[str] = (
    "5a7e10ed709577c224cf45f78199dd143a7f9cf10d6f8fe8c018e168454b7a61"
)
CODATA_RAW_SIZE_BYTES: Final[int] = 6_180
PRECISION_BITS: Final[int] = 256
EMIN: Final[int] = -1_000_000
EMAX: Final[int] = 1_000_000
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

_UINT_CONSTRUCTION_ORDER: Final[tuple[str, ...]] = (
    "01_allocate_fresh_MPFR256_lower_destination",
    "02_allocate_fresh_MPFR256_upper_destination",
    "03_require_lower_and_upper_storage_identity_distinct",
    "04_lower_ternary=mpfr_set_ui(lower,n,MPFR_RNDN)",
    "05_require_lower_ternary_equal_zero_and_lower_exact",
    "06_upper_ternary=mpfr_set(upper,lower,MPFR_RNDN)",
    "07_require_upper_ternary_equal_zero_and_upper_exact",
    "08_require_mpfr_equal_p(lower,upper)_and_no_endpoint_alias",
)
_DYADIC_CONSTRUCTION_ORDER: Final[tuple[str, ...]] = (
    "01_allocate_fresh_MPFR256_mantissa_destination",
    "02_allocate_fresh_MPFR256_lower_destination",
    "03_allocate_fresh_MPFR256_upper_destination",
    "04_require_mantissa_lower_and_upper_storage_identities_pairwise_distinct",
    "05_mantissa_ternary=mpfr_set_z(mantissa,m,MPFR_RNDN)",
    "06_require_mantissa_ternary_equal_zero_and_integer_exact",
    "07_lower_ternary=mpfr_mul_2si(lower,mantissa,e2,MPFR_RNDN)",
    "08_require_lower_ternary_equal_zero_and_dyadic_exact",
    "09_upper_ternary=mpfr_set(upper,lower,MPFR_RNDN)",
    "10_require_upper_ternary_equal_zero_and_upper_exact",
    "11_require_mpfr_equal_p(lower,upper)_and_no_endpoint_alias",
)

SCALE_IDS: Final[tuple[str, ...]] = (
    "mu_E_central",
    "mu_L_central",
    "stress_scale_central_via_mu",
    "stress_scale_central_closed",
    "noise_scale_central",
    "mu_E_one_sigma",
    "mu_L_one_sigma",
    "stress_scale_one_sigma",
    "noise_scale_one_sigma",
    "mu_E_admission_k2",
    "mu_L_admission_k2",
    "stress_scale_admission_k2",
    "noise_scale_admission_k2",
)

CALCULATION_ONLY_IMPLEMENTATION_BLOCKERS: Final[tuple[str, ...]] = (
    "native_library_hash_to_load_toctou_not_closed",
    "exact_loaded_native_module_byte_identity_not_proved",
    "direct_native_full_contract_operation_graph_not_implemented",
    "gmpy2_high_level_numeric_graph_used",
    "exclusive_mpfr_context_lease_not_implemented",
    "dedicated_single_purpose_process_not_enforced",
    "caller_native_flags_restore_not_proved",
    "native_dso_unload_and_context_cleanup_lifecycle_not_implemented",
    "normalization_rounding_audit_bound_unfrozen",
    "whole_output_once_only_scale_context_and_fsync_lifetime_not_implemented",
    "module_local_receipt_registry_not_server_authentication",
    "same_process_post_admission_mutation_not_authoritatively_closed",
    "authenticated_source_runtime_manifest_and_scientific_preseal_absent",
    "source_disjoint_independent_si_implementation_and_agreement_absent",
)


class SiNormalizationError(RuntimeError):
    """Typed failure at the authority-neutral normalization boundary."""

    def __init__(self, code: str, detail: str | None = None) -> None:
        super().__init__(code if detail is None else f"{code}:{detail}")
        self.code = code
        self.detail = detail


@dataclass(frozen=True, slots=True)
class DyadicEndpoint:
    sign: str
    mantissa_lowercase_hex: str
    exponent2: int
    precision_bits: int
    direction: str


@dataclass(frozen=True, slots=True)
class DirectedIntervalReceipt:
    lower: DyadicEndpoint
    upper: DyadicEndpoint


@dataclass(frozen=True, slots=True)
class PrimitiveTrace:
    ordinal: int
    label: str
    rounding: str
    ternary_result: int
    inexact: bool


@dataclass(frozen=True, slots=True)
class NativeExactEndpointTrace:
    ordinal: int
    label: str
    primitive: str
    construction_order: tuple[str, ...]
    destination_count: int
    destination_storage_pairwise_distinct: bool
    limb_storage_pairwise_distinct: bool
    destination_precision_bits: tuple[int, ...]
    ternary_results: tuple[int, ...]
    lower_upper_equal: bool
    mathematical_value_verified: bool
    gmpy2_calculation_value_verified: bool
    canonical_mantissa: int
    canonical_exponent2: int


@dataclass(frozen=True, slots=True)
class CentralScaleReceipt:
    value: DyadicEndpoint
    binary64_bits: str


@dataclass(frozen=True, slots=True, weakref_slot=True)
class SiNormalizationReceipt:
    contract_sha256: str
    contract_canonical_size_bytes: int
    codata_raw_sha256: str
    codata_raw_size_bytes: int
    gmpy2_version: str
    mpfr_version: str
    gmp_version: str
    native_mpfr_version: str
    native_gmp_version: str
    native_mpfr_dll_sha256: str
    native_mpfr_dll_size_bytes: int
    native_gmp_dll_sha256: str
    native_gmp_dll_size_bytes: int
    scale_graph_node_count: int
    central_graph_node_count: int
    primitive_trace: tuple[PrimitiveTrace, ...]
    native_exact_endpoint_trace: tuple[NativeExactEndpointTrace, ...]
    scales: tuple[tuple[str, DirectedIntervalReceipt], ...]
    central_scales: tuple[tuple[str, CentralScaleReceipt], ...]
    central_via_mu_overlaps_closed: bool
    calculation_only: bool
    native_disk_bytes_hash_observed: bool
    exact_loaded_native_module_byte_identity_proved: bool
    native_hash_to_load_toctou_closed: bool
    exact_mutable_destination_storage_verified: bool
    native_exact_endpoint_subset_only: bool
    full_contract_graph_executed_through_direct_native_abi: bool
    gmpy2_numeric_graph_used: bool
    exclusive_mpfr_context_lease: bool
    caller_native_flags_restored: bool
    production_runtime_bound: bool
    source_disjoint_independent_implementation_bound: bool
    exact_contract_operation_trace_conformance: bool
    module_local_origin_check_only: bool
    server_authenticated: bool
    capability_authority: bool
    future_server_promotion_allowed: bool
    implementation_blockers: tuple[str, ...]
    execution_authority: bool
    replay_authority: bool
    diagnostic_pass: bool
    stress_noise_lamp: bool
    constraint_algebra_lamp: bool
    physical_viability: bool
    propulsion: bool
    transport: bool

    def __post_init__(self) -> None:
        required_true = (
            self.calculation_only,
            self.native_disk_bytes_hash_observed,
            self.exact_mutable_destination_storage_verified,
            self.native_exact_endpoint_subset_only,
            self.gmpy2_numeric_graph_used,
            self.module_local_origin_check_only,
        )
        required_false = (
            self.exact_loaded_native_module_byte_identity_proved,
            self.native_hash_to_load_toctou_closed,
            self.full_contract_graph_executed_through_direct_native_abi,
            self.exclusive_mpfr_context_lease,
            self.caller_native_flags_restored,
            self.production_runtime_bound,
            self.source_disjoint_independent_implementation_bound,
            self.exact_contract_operation_trace_conformance,
            self.server_authenticated,
            self.capability_authority,
            self.future_server_promotion_allowed,
            self.execution_authority,
            self.replay_authority,
            self.diagnostic_pass,
            self.stress_noise_lamp,
            self.constraint_algebra_lamp,
            self.physical_viability,
            self.propulsion,
            self.transport,
        )
        if any(value is not True for value in required_true):
            raise ValueError("si normalization calculation truth lock violated")
        if any(value is not False for value in required_false):
            raise ValueError("si normalization authority lock violated")
        if (
            type(self.implementation_blockers) is not tuple
            or self.implementation_blockers
            != CALCULATION_ONLY_IMPLEMENTATION_BLOCKERS
        ):
            raise ValueError("si normalization blocker inventory violated")


@dataclass(frozen=True, slots=True, weakref_slot=True)
class PairedElementReceipt:
    scale_kind: str
    input_center_binary64_bits: str
    input_uncertainty_binary64_bits: str
    central_binary64_bits: str
    uncertainty_binary64_bits: str
    central_value: float
    absolute_uncertainty95: float
    serialized_center_inside_directed_hull: bool
    serialized_uncertainty_encloses_both_distances: bool
    calculation_only: bool
    production_runtime_bound: bool
    module_local_origin_check_only: bool
    server_authenticated: bool
    capability_authority: bool
    future_server_promotion_allowed: bool
    implementation_blockers: tuple[str, ...]
    execution_authority: bool
    replay_authority: bool
    diagnostic_pass: bool
    physical_viability: bool
    propulsion: bool
    transport: bool

    def __post_init__(self) -> None:
        if (
            self.calculation_only is not True
            or self.module_local_origin_check_only is not True
            or self.serialized_center_inside_directed_hull is not True
            or self.serialized_uncertainty_encloses_both_distances is not True
        ):
            raise ValueError("paired SI calculation truth lock violated")
        if any(
            value is not False
            for value in (
                self.production_runtime_bound,
                self.server_authenticated,
                self.capability_authority,
                self.future_server_promotion_allowed,
                self.execution_authority,
                self.replay_authority,
                self.diagnostic_pass,
                self.physical_viability,
                self.propulsion,
                self.transport,
            )
        ):
            raise ValueError("paired SI authority lock violated")
        if (
            type(self.implementation_blockers) is not tuple
            or self.implementation_blockers
            != CALCULATION_ONLY_IMPLEMENTATION_BLOCKERS
        ):
            raise ValueError("paired SI blocker inventory violated")


@dataclass(frozen=True, slots=True)
class _Interval:
    lower: gmpy2.mpfr
    upper: gmpy2.mpfr


_SI_RECEIPTS: dict[int, tuple[object, str]] = {}
_PAIRED_RECEIPTS: dict[int, tuple[object, str]] = {}

_RECEIPT_VALUE_TYPES: Final[tuple[type[object], ...]] = (
    DyadicEndpoint,
    DirectedIntervalReceipt,
    PrimitiveTrace,
    NativeExactEndpointTrace,
    CentralScaleReceipt,
    SiNormalizationReceipt,
    PairedElementReceipt,
)


def _receipt_fingerprint(value: object) -> str:
    digest = hashlib.sha256()
    node_count = 0

    def emit(tag: bytes, payload: bytes = b"") -> None:
        digest.update(tag)
        digest.update(len(payload).to_bytes(8, "little"))
        digest.update(payload)

    def visit(current: object, depth: int) -> None:
        nonlocal node_count
        node_count += 1
        if depth > 32 or node_count > 16_384:
            raise ValueError("receipt fingerprint budget exceeded")
        if current is None:
            emit(b"n")
            return
        if type(current) is bool:
            emit(b"b", b"1" if current else b"0")
            return
        if type(current) is int:
            if current.bit_length() > 4_096:
                raise ValueError("receipt integer budget exceeded")
            emit(b"i", str(current).encode("ascii"))
            return
        if type(current) is float:
            if not math.isfinite(current) or _float_bits(current) == "8000000000000000":
                raise ValueError("receipt float invalid")
            emit(b"f", struct.pack(">d", current))
            return
        if type(current) is str:
            if len(current) > 1_048_576:
                raise ValueError("receipt string budget exceeded")
            encoded = current.encode("utf-8", "strict")
            if len(encoded) > 1_048_576:
                raise ValueError("receipt string byte budget exceeded")
            emit(b"s", encoded)
            return
        if type(current) is tuple:
            if len(current) > 16_384:
                raise ValueError("receipt tuple budget exceeded")
            emit(b"t", len(current).to_bytes(8, "little"))
            for entry in current:
                visit(entry, depth + 1)
            return
        current_type = type(current)
        if current_type not in _RECEIPT_VALUE_TYPES:
            raise ValueError("receipt value type invalid")
        emit(b"d", current_type.__name__.encode("ascii"))
        for descriptor in fields(current_type):
            emit(b"k", descriptor.name.encode("ascii"))
            visit(object.__getattribute__(current, descriptor.name), depth + 1)

    visit(value, 0)
    return digest.hexdigest()


def _register_receipt(
    registry: dict[int, tuple[object, str]], value: object
) -> None:
    key = id(value)

    def discard(observed: object) -> None:
        current = registry.get(key)
        if current is not None and current[0] is observed:
            registry.pop(key, None)

    reference = weakref.ref(value, discard)
    registry[key] = (reference, _receipt_fingerprint(value))


def _receipt_is_registered_unchanged(
    registry: dict[int, tuple[object, str]], value: object
) -> bool:
    entry = registry.get(id(value))
    if entry is None:
        return False
    reference, expected = entry
    if not callable(reference) or reference() is not value:
        return False
    try:
        observed = _receipt_fingerprint(value)
    except (
        TypeError,
        ValueError,
        UnicodeError,
        OverflowError,
        SiNormalizationError,
    ):
        return False
    return hmac.compare_digest(observed, expected)


def require_authentic_si_normalization_receipt(
    value: object,
) -> SiNormalizationReceipt:
    """Check module-local origin/content only; this is not server authority."""

    if (
        type(value) is not SiNormalizationReceipt
        or not _receipt_is_registered_unchanged(_SI_RECEIPTS, value)
    ):
        raise SiNormalizationError("si_normalization_receipt_not_authentic")
    return value


def require_authentic_paired_element_receipt(
    value: object,
) -> PairedElementReceipt:
    """Check module-local origin/content only; this is not server authority."""

    if (
        type(value) is not PairedElementReceipt
        or not _receipt_is_registered_unchanged(_PAIRED_RECEIPTS, value)
    ):
        raise SiNormalizationError("paired_element_receipt_not_authentic")
    return value


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


def _canonical_dyadic(mantissa: int, exponent2: int) -> tuple[int, int]:
    if mantissa == 0:
        return (0, 0)
    while mantissa % 2 == 0:
        mantissa //= 2
        exponent2 += 1
    return (mantissa, exponent2)


def _gmpy2_canonical_dyadic(value: gmpy2.mpfr) -> tuple[int, int]:
    mantissa, exponent2 = value.as_mantissa_exp()
    return _canonical_dyadic(int(mantissa), int(exponent2))


class _NativeExactEndpointKernel:
    """Pinned native MPFR boundary for the two exact endpoint primitives."""

    def __init__(self) -> None:
        self._trace: list[NativeExactEndpointTrace] = []
        mpfr_path, gmp_path = self._admit_runtime_files()
        self._gmp = ctypes.CDLL(str(gmp_path))
        self._mpfr = ctypes.CDLL(str(mpfr_path))
        self._require_loaded_module_path(self._gmp, gmp_path, "gmp")
        self._require_loaded_module_path(self._mpfr, mpfr_path, "mpfr")
        self._bind_abi()
        self._verify_versions()

    @property
    def trace(self) -> tuple[NativeExactEndpointTrace, ...]:
        return tuple(self._trace)

    @staticmethod
    def _file_sha256(path: Path) -> str:
        with path.open("rb") as stream:
            return hashlib.file_digest(stream, "sha256").hexdigest()

    @classmethod
    def _admit_runtime_files(cls) -> tuple[Path, Path]:
        module_path = Path(gmpy2.__file__).resolve(strict=True)
        libraries_root = (module_path.parent.parent / "gmpy2.libs").resolve(
            strict=True
        )
        if not libraries_root.is_dir():
            raise SiNormalizationError("native_mpfr_library_root_invalid")

        admitted: list[Path] = []
        for name, expected_size, expected_sha256 in (
            (
                NATIVE_MPFR_DLL_NAME,
                NATIVE_MPFR_DLL_SIZE_BYTES,
                NATIVE_MPFR_DLL_SHA256,
            ),
            (NATIVE_GMP_DLL_NAME, NATIVE_GMP_DLL_SIZE_BYTES, NATIVE_GMP_DLL_SHA256),
        ):
            path = (libraries_root / name).resolve(strict=True)
            if path.parent != libraries_root or path.name != name or not path.is_file():
                raise SiNormalizationError("native_mpfr_library_path_invalid", name)
            stat_before = path.stat()
            observed_sha256 = cls._file_sha256(path)
            stat_after = path.stat()
            identity_before = (
                stat_before.st_dev,
                stat_before.st_ino,
                stat_before.st_size,
                stat_before.st_mtime_ns,
            )
            identity_after = (
                stat_after.st_dev,
                stat_after.st_ino,
                stat_after.st_size,
                stat_after.st_mtime_ns,
            )
            if identity_before != identity_after:
                raise SiNormalizationError("native_mpfr_library_changed_during_hash", name)
            if stat_after.st_size != expected_size:
                raise SiNormalizationError("native_mpfr_library_size_mismatch", name)
            if observed_sha256 != expected_sha256:
                raise SiNormalizationError("native_mpfr_library_sha256_mismatch", name)
            admitted.append(path)
        return admitted[0], admitted[1]

    @staticmethod
    def _require_loaded_module_path(
        library: ctypes.CDLL, expected_path: Path, label: str
    ) -> None:
        if not hasattr(ctypes, "WinDLL"):
            raise SiNormalizationError("native_mpfr_windows_abi_required")
        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        get_module_filename = kernel32.GetModuleFileNameW
        get_module_filename.argtypes = (
            ctypes.c_void_p,
            ctypes.c_wchar_p,
            ctypes.c_uint32,
        )
        get_module_filename.restype = ctypes.c_uint32
        buffer = ctypes.create_unicode_buffer(32_768)
        copied = int(
            get_module_filename(
                ctypes.c_void_p(library._handle), buffer, len(buffer)  # type: ignore[attr-defined]
            )
        )
        if copied == 0 or copied >= len(buffer):
            raise SiNormalizationError("native_mpfr_loaded_path_unavailable", label)
        observed_path = Path(buffer.value).resolve(strict=True)
        if observed_path != expected_path:
            raise SiNormalizationError(
                "native_mpfr_loaded_path_mismatch", f"{label}:{observed_path}"
            )

    def _bind_abi(self) -> None:
        expected_mpfr_offsets = (0, 4, 8, 16)
        observed_mpfr_offsets = tuple(
            getattr(_MpfrStruct, name).offset
            for name in ("_mpfr_prec", "_mpfr_sign", "_mpfr_exp", "_mpfr_d")
        )
        expected_mpz_offsets = (0, 4, 8)
        observed_mpz_offsets = tuple(
            getattr(_MpzStruct, name).offset
            for name in ("_mp_alloc", "_mp_size", "_mp_d")
        )
        if (
            ctypes.sizeof(ctypes.c_long) != 4
            or ctypes.sizeof(ctypes.c_void_p) != 8
            or ctypes.sizeof(_MpfrStruct) != 24
            or observed_mpfr_offsets != expected_mpfr_offsets
            or ctypes.sizeof(_MpzStruct) != 16
            or observed_mpz_offsets != expected_mpz_offsets
        ):
            raise SiNormalizationError("native_mpfr_ctypes_abi_mismatch")

        mpfr_pointer = ctypes.POINTER(_MpfrStruct)
        mpz_pointer = ctypes.POINTER(_MpzStruct)
        self._mpfr.mpfr_init2.argtypes = (mpfr_pointer, ctypes.c_long)
        self._mpfr.mpfr_init2.restype = None
        self._mpfr.mpfr_clear.argtypes = (mpfr_pointer,)
        self._mpfr.mpfr_clear.restype = None
        self._mpfr.mpfr_set_ui.argtypes = (
            mpfr_pointer,
            ctypes.c_ulong,
            ctypes.c_int,
        )
        self._mpfr.mpfr_set_ui.restype = ctypes.c_int
        self._mpfr.mpfr_set_z.argtypes = (mpfr_pointer, mpz_pointer, ctypes.c_int)
        self._mpfr.mpfr_set_z.restype = ctypes.c_int
        self._mpfr.mpfr_mul_2si.argtypes = (
            mpfr_pointer,
            mpfr_pointer,
            ctypes.c_long,
            ctypes.c_int,
        )
        self._mpfr.mpfr_mul_2si.restype = ctypes.c_int
        self._mpfr.mpfr_set.argtypes = (mpfr_pointer, mpfr_pointer, ctypes.c_int)
        self._mpfr.mpfr_set.restype = ctypes.c_int
        self._mpfr.mpfr_get_prec.argtypes = (mpfr_pointer,)
        self._mpfr.mpfr_get_prec.restype = ctypes.c_long
        self._mpfr.mpfr_equal_p.argtypes = (mpfr_pointer, mpfr_pointer)
        self._mpfr.mpfr_equal_p.restype = ctypes.c_int
        self._mpfr.mpfr_cmp_ui.argtypes = (mpfr_pointer, ctypes.c_ulong)
        self._mpfr.mpfr_cmp_ui.restype = ctypes.c_int
        self._mpfr.mpfr_cmp_z.argtypes = (mpfr_pointer, mpz_pointer)
        self._mpfr.mpfr_cmp_z.restype = ctypes.c_int
        self._mpfr.mpfr_get_z_2exp.argtypes = (mpz_pointer, mpfr_pointer)
        self._mpfr.mpfr_get_z_2exp.restype = ctypes.c_long
        self._mpfr.mpfr_clear_flags.argtypes = ()
        self._mpfr.mpfr_clear_flags.restype = None
        for flag_name in (
            "mpfr_nanflag_p",
            "mpfr_divby0_p",
            "mpfr_overflow_p",
            "mpfr_underflow_p",
            "mpfr_erangeflag_p",
            "mpfr_inexflag_p",
        ):
            flag_function = getattr(self._mpfr, flag_name)
            flag_function.argtypes = ()
            flag_function.restype = ctypes.c_int
        self._mpfr.mpfr_get_version.argtypes = ()
        self._mpfr.mpfr_get_version.restype = ctypes.c_char_p

        self._gmpz_init = getattr(self._gmp, "__gmpz_init")
        self._gmpz_init.argtypes = (mpz_pointer,)
        self._gmpz_init.restype = None
        self._gmpz_clear = getattr(self._gmp, "__gmpz_clear")
        self._gmpz_clear.argtypes = (mpz_pointer,)
        self._gmpz_clear.restype = None
        self._gmpz_set_str = getattr(self._gmp, "__gmpz_set_str")
        self._gmpz_set_str.argtypes = (mpz_pointer, ctypes.c_char_p, ctypes.c_int)
        self._gmpz_set_str.restype = ctypes.c_int
        self._gmpz_get_str = getattr(self._gmp, "__gmpz_get_str")
        self._gmpz_get_str.argtypes = (
            ctypes.POINTER(ctypes.c_char),
            ctypes.c_int,
            mpz_pointer,
        )
        self._gmpz_get_str.restype = ctypes.POINTER(ctypes.c_char)
        self._gmpz_sizeinbase = getattr(self._gmp, "__gmpz_sizeinbase")
        self._gmpz_sizeinbase.argtypes = (mpz_pointer, ctypes.c_int)
        self._gmpz_sizeinbase.restype = ctypes.c_size_t

    def _verify_versions(self) -> None:
        mpfr_raw = self._mpfr.mpfr_get_version()
        gmp_raw = ctypes.c_char_p.in_dll(self._gmp, "__gmp_version").value
        if mpfr_raw is None or gmp_raw is None:
            raise SiNormalizationError("native_mpfr_version_unavailable")
        observed = (mpfr_raw.decode("ascii"), gmp_raw.decode("ascii"))
        expected = (EXPECTED_NATIVE_MPFR_VERSION, EXPECTED_NATIVE_GMP_VERSION)
        if observed != expected:
            raise SiNormalizationError("native_mpfr_version_mismatch", repr(observed))

    def _new_mpfr(self) -> _MpfrStruct:
        destination = _MpfrStruct()
        self._mpfr.mpfr_init2(ctypes.byref(destination), PRECISION_BITS)
        if self._precision(destination) != PRECISION_BITS or not destination._mpfr_d:
            self._mpfr.mpfr_clear(ctypes.byref(destination))
            raise SiNormalizationError("native_mpfr_destination_init_failed")
        return destination

    def _precision(self, value: _MpfrStruct) -> int:
        return int(self._mpfr.mpfr_get_prec(ctypes.byref(value)))

    def _new_mpz(self, value: int | None = None) -> _MpzStruct:
        destination = _MpzStruct()
        self._gmpz_init(ctypes.byref(destination))
        if value is not None:
            status = int(
                self._gmpz_set_str(
                    ctypes.byref(destination), str(value).encode("ascii"), 10
                )
            )
            if status != 0:
                self._gmpz_clear(ctypes.byref(destination))
                raise SiNormalizationError("native_gmp_integer_injection_failed")
        return destination

    def _mpz_to_int(self, value: _MpzStruct) -> int:
        digit_bound = int(self._gmpz_sizeinbase(ctypes.byref(value), 10))
        if not 1 <= digit_bound <= 80:
            raise SiNormalizationError("native_gmp_integer_readback_size_invalid")
        buffer = ctypes.create_string_buffer(digit_bound + 3)
        result = self._gmpz_get_str(buffer, 10, ctypes.byref(value))
        if not result:
            raise SiNormalizationError("native_gmp_integer_readback_failed")
        return int(buffer.value.decode("ascii"), 10)

    def _native_canonical_dyadic(self, value: _MpfrStruct) -> tuple[int, int]:
        significand = self._new_mpz()
        try:
            exponent2 = int(
                self._mpfr.mpfr_get_z_2exp(
                    ctypes.byref(significand), ctypes.byref(value)
                )
            )
            return _canonical_dyadic(self._mpz_to_int(significand), exponent2)
        finally:
            self._gmpz_clear(ctypes.byref(significand))

    def _exact_call(self, label: str, operation: Callable[[], int]) -> int:
        self._mpfr.mpfr_clear_flags()
        ternary = int(operation())
        observed_flags = tuple(
            name
            for name in (
                "mpfr_nanflag_p",
                "mpfr_divby0_p",
                "mpfr_overflow_p",
                "mpfr_underflow_p",
                "mpfr_erangeflag_p",
                "mpfr_inexflag_p",
            )
            if int(getattr(self._mpfr, name)()) != 0
        )
        if ternary != 0 or observed_flags:
            raise SiNormalizationError(
                "native_mpfr_exact_operation_inexact",
                f"{label}:ternary={ternary}:flags={','.join(observed_flags)}",
            )
        return ternary

    @staticmethod
    def _storage_is_pairwise_distinct(
        destinations: tuple[_MpfrStruct, ...]
    ) -> tuple[bool, bool]:
        destination_addresses = tuple(ctypes.addressof(value) for value in destinations)
        limb_addresses = tuple(int(value._mpfr_d or 0) for value in destinations)
        return (
            len(set(destination_addresses)) == len(destination_addresses),
            0 not in limb_addresses and len(set(limb_addresses)) == len(limb_addresses),
        )

    def uint(
        self,
        label: str,
        value: int,
        calculated_lower: gmpy2.mpfr,
        calculated_upper: gmpy2.mpfr,
    ) -> NativeExactEndpointTrace:
        if type(value) is not int or value < 0:
            raise SiNormalizationError("exact_unsigned_integer_required", label)
        if value > (1 << (8 * ctypes.sizeof(ctypes.c_ulong))) - 1:
            raise SiNormalizationError("native_mpfr_unsigned_long_range", label)

        lower = self._new_mpfr()
        try:
            upper = self._new_mpfr()
            try:
                destination_distinct, limb_distinct = self._storage_is_pairwise_distinct(
                    (lower, upper)
                )
                if not destination_distinct or not limb_distinct:
                    raise SiNormalizationError("native_mpfr_destination_alias", label)
                lower_ternary = self._exact_call(
                    f"{label}.lower.set_ui",
                    lambda: self._mpfr.mpfr_set_ui(
                        ctypes.byref(lower), value, 0
                    ),
                )
                if self._mpfr.mpfr_cmp_ui(ctypes.byref(lower), value) != 0:
                    raise SiNormalizationError("native_mpfr_uint_value_mismatch", label)
                upper_ternary = self._exact_call(
                    f"{label}.upper.set",
                    lambda: self._mpfr.mpfr_set(
                        ctypes.byref(upper), ctypes.byref(lower), 0
                    ),
                )
                lower_upper_equal = bool(
                    self._mpfr.mpfr_equal_p(
                        ctypes.byref(lower), ctypes.byref(upper)
                    )
                )
                canonical = self._native_canonical_dyadic(lower)
                expected = _canonical_dyadic(value, 0)
                precisions = (self._precision(lower), self._precision(upper))
                calculation_verified = (
                    _gmpy2_canonical_dyadic(calculated_lower) == expected
                    and _gmpy2_canonical_dyadic(calculated_upper) == expected
                )
                if (
                    not lower_upper_equal
                    or canonical != expected
                    or precisions != (PRECISION_BITS, PRECISION_BITS)
                    or not calculation_verified
                ):
                    raise SiNormalizationError("native_mpfr_uint_postcondition", label)
                receipt = NativeExactEndpointTrace(
                    ordinal=len(self._trace),
                    label=label,
                    primitive="exact_unsigned_integer",
                    construction_order=_UINT_CONSTRUCTION_ORDER,
                    destination_count=2,
                    destination_storage_pairwise_distinct=destination_distinct,
                    limb_storage_pairwise_distinct=limb_distinct,
                    destination_precision_bits=precisions,
                    ternary_results=(lower_ternary, upper_ternary),
                    lower_upper_equal=lower_upper_equal,
                    mathematical_value_verified=canonical == expected,
                    gmpy2_calculation_value_verified=calculation_verified,
                    canonical_mantissa=canonical[0],
                    canonical_exponent2=canonical[1],
                )
                self._trace.append(receipt)
                return receipt
            finally:
                self._mpfr.mpfr_clear(ctypes.byref(upper))
        finally:
            self._mpfr.mpfr_clear(ctypes.byref(lower))

    def dyadic(
        self,
        label: str,
        mantissa: int,
        exponent2: int,
        calculated_lower: gmpy2.mpfr,
        calculated_upper: gmpy2.mpfr,
    ) -> NativeExactEndpointTrace:
        if type(mantissa) is not int or type(exponent2) is not int:
            raise SiNormalizationError("exact_dyadic_required", label)
        long_min = -(1 << (8 * ctypes.sizeof(ctypes.c_long) - 1))
        long_max = (1 << (8 * ctypes.sizeof(ctypes.c_long) - 1)) - 1
        if not long_min <= exponent2 <= long_max:
            raise SiNormalizationError("native_mpfr_exponent_range", label)

        integer_source = self._new_mpz(mantissa)
        try:
            mantissa_destination = self._new_mpfr()
            try:
                lower = self._new_mpfr()
                try:
                    upper = self._new_mpfr()
                    try:
                        destination_distinct, limb_distinct = (
                            self._storage_is_pairwise_distinct(
                                (mantissa_destination, lower, upper)
                            )
                        )
                        if not destination_distinct or not limb_distinct:
                            raise SiNormalizationError(
                                "native_mpfr_destination_alias", label
                            )
                        mantissa_ternary = self._exact_call(
                            f"{label}.mantissa.set_z",
                            lambda: self._mpfr.mpfr_set_z(
                                ctypes.byref(mantissa_destination),
                                ctypes.byref(integer_source),
                                0,
                            ),
                        )
                        if (
                            self._mpfr.mpfr_cmp_z(
                                ctypes.byref(mantissa_destination),
                                ctypes.byref(integer_source),
                            )
                            != 0
                        ):
                            raise SiNormalizationError(
                                "native_mpfr_mantissa_value_mismatch", label
                            )
                        lower_ternary = self._exact_call(
                            f"{label}.lower.mul_2si",
                            lambda: self._mpfr.mpfr_mul_2si(
                                ctypes.byref(lower),
                                ctypes.byref(mantissa_destination),
                                exponent2,
                                0,
                            ),
                        )
                        upper_ternary = self._exact_call(
                            f"{label}.upper.set",
                            lambda: self._mpfr.mpfr_set(
                                ctypes.byref(upper), ctypes.byref(lower), 0
                            ),
                        )
                        lower_upper_equal = bool(
                            self._mpfr.mpfr_equal_p(
                                ctypes.byref(lower), ctypes.byref(upper)
                            )
                        )
                        canonical = self._native_canonical_dyadic(lower)
                        expected = _canonical_dyadic(mantissa, exponent2)
                        precisions = tuple(
                            self._precision(value)
                            for value in (mantissa_destination, lower, upper)
                        )
                        calculation_verified = (
                            _gmpy2_canonical_dyadic(calculated_lower) == expected
                            and _gmpy2_canonical_dyadic(calculated_upper) == expected
                        )
                        if (
                            not lower_upper_equal
                            or canonical != expected
                            or precisions != (PRECISION_BITS,) * 3
                            or not calculation_verified
                        ):
                            raise SiNormalizationError(
                                "native_mpfr_dyadic_postcondition", label
                            )
                        receipt = NativeExactEndpointTrace(
                            ordinal=len(self._trace),
                            label=label,
                            primitive="exact_dyadic",
                            construction_order=_DYADIC_CONSTRUCTION_ORDER,
                            destination_count=3,
                            destination_storage_pairwise_distinct=destination_distinct,
                            limb_storage_pairwise_distinct=limb_distinct,
                            destination_precision_bits=precisions,
                            ternary_results=(
                                mantissa_ternary,
                                lower_ternary,
                                upper_ternary,
                            ),
                            lower_upper_equal=lower_upper_equal,
                            mathematical_value_verified=canonical == expected,
                            gmpy2_calculation_value_verified=calculation_verified,
                            canonical_mantissa=canonical[0],
                            canonical_exponent2=canonical[1],
                        )
                        self._trace.append(receipt)
                        return receipt
                    finally:
                        self._mpfr.mpfr_clear(ctypes.byref(upper))
                finally:
                    self._mpfr.mpfr_clear(ctypes.byref(lower))
            finally:
                self._mpfr.mpfr_clear(ctypes.byref(mantissa_destination))
        finally:
            self._gmpz_clear(ctypes.byref(integer_source))


class _Arithmetic:
    __slots__ = ("_contexts", "_native", "_trace")

    def __init__(self) -> None:
        common = dict(
            precision=PRECISION_BITS,
            emin=EMIN,
            emax=EMAX,
            subnormalize=False,
            trap_underflow=False,
            trap_overflow=False,
            trap_inexact=False,
            trap_invalid=False,
            trap_erange=False,
            trap_divzero=False,
            allow_complex=False,
            rational_division=False,
            allow_release_gil=False,
        )
        self._contexts = {
            "RNDD": gmpy2.context(round=gmpy2.RoundDown, **common),
            "RNDU": gmpy2.context(round=gmpy2.RoundUp, **common),
            "RNDN": gmpy2.context(round=gmpy2.RoundToNearest, **common),
        }
        self._native = _NativeExactEndpointKernel()
        self._trace: list[PrimitiveTrace] = []

    @property
    def trace(self) -> tuple[PrimitiveTrace, ...]:
        return tuple(self._trace)

    @property
    def native_trace(self) -> tuple[NativeExactEndpointTrace, ...]:
        return self._native.trace

    def _operation(
        self,
        label: str,
        rounding: str,
        operation: Callable[[], gmpy2.mpfr],
    ) -> gmpy2.mpfr:
        context = self._contexts[rounding]
        with gmpy2.context(context) as active:
            active.clear_flags()
            result = operation()
            forbidden = tuple(
                name
                for name in ("invalid", "divzero", "overflow", "underflow", "erange")
                if bool(getattr(active, name))
            )
            if forbidden:
                raise SiNormalizationError(
                    "mpfr_forbidden_flag", f"{label}:{','.join(forbidden)}"
                )
            if result.precision != PRECISION_BITS or not gmpy2.is_finite(result):
                raise SiNormalizationError("mpfr_result_invalid", label)
            self._trace.append(
                PrimitiveTrace(
                    ordinal=len(self._trace),
                    label=label,
                    rounding=rounding,
                    ternary_result=int(result.rc),
                    inexact=bool(active.inexact),
                )
            )
            return result

    def decimal(self, label: str, value: str) -> _Interval:
        lower = self._operation(
            f"{label}.lower", "RNDD", lambda: gmpy2.mpfr(value, PRECISION_BITS)
        )
        upper = self._operation(
            f"{label}.upper", "RNDU", lambda: gmpy2.mpfr(value, PRECISION_BITS)
        )
        return self._ordered_positive(label, lower, upper)

    def uint(self, label: str, value: int) -> _Interval:
        if type(value) is not int or value < 0:
            raise SiNormalizationError("exact_unsigned_integer_required", label)
        lower = self._operation(
            f"{label}.lower.set_ui",
            "RNDN",
            lambda: gmpy2.mpfr(value, PRECISION_BITS),
        )
        upper = self._operation(
            f"{label}.upper.set_copy",
            "RNDN",
            lambda: gmpy2.mpfr(lower, PRECISION_BITS),
        )
        if (
            lower.rc != 0
            or upper.rc != 0
            or int(lower) != value
            or int(upper) != value
        ):
            raise SiNormalizationError("integer_not_exact_at_mpfr256", label)
        self._native.uint(label, value, lower, upper)
        return _Interval(lower, upper)

    def dyadic(self, label: str, mantissa: int, exponent2: int) -> _Interval:
        if type(mantissa) is not int or type(exponent2) is not int:
            raise SiNormalizationError("exact_dyadic_required", label)
        mantissa_value = self._operation(
            f"{label}.mantissa.set_z",
            "RNDN",
            lambda: gmpy2.mpfr(mantissa, PRECISION_BITS),
        )
        lower = self._operation(
            f"{label}.lower.mul_2exp",
            "RNDN",
            lambda: gmpy2.mul_2exp(mantissa_value, exponent2),
        )
        upper = self._operation(
            f"{label}.upper.set_copy",
            "RNDN",
            lambda: gmpy2.mpfr(lower, PRECISION_BITS),
        )
        if (
            any(value.rc != 0 for value in (mantissa_value, lower, upper))
        ):
            raise SiNormalizationError("dyadic_not_exact_at_mpfr256", label)
        self._native.dyadic(label, mantissa, exponent2, lower, upper)
        return _Interval(lower, upper)

    def general_mul(
        self, label: str, left: _Interval, right: _Interval
    ) -> _Interval:
        lower_products = tuple(
            self._binary(label, f"{suffix}.lower", "RNDD", gmpy2.mul, a, b)
            for suffix, a, b in (
                ("ac", left.lower, right.lower),
                ("ad", left.lower, right.upper),
                ("bc", left.upper, right.lower),
                ("bd", left.upper, right.upper),
            )
        )
        upper_products = tuple(
            self._binary(label, f"{suffix}.upper", "RNDU", gmpy2.mul, a, b)
            for suffix, a, b in (
                ("ac", left.lower, right.lower),
                ("ad", left.lower, right.upper),
                ("bc", left.upper, right.lower),
                ("bd", left.upper, right.upper),
            )
        )
        lower = min(lower_products)
        upper = max(upper_products)
        if lower > upper:
            raise SiNormalizationError("general_product_interval_invalid", label)
        return _Interval(lower, upper)

    def exact_binary64(self, label: str, value: float) -> gmpy2.mpfr:
        if type(value) is not float or not math.isfinite(value):
            raise SiNormalizationError("finite_exact_binary64_required", label)
        result = self._operation(
            label, "RNDN", lambda: gmpy2.mpfr(value, PRECISION_BITS)
        )
        if result.rc != 0 or float(result) != value:
            raise SiNormalizationError("binary64_injection_not_exact", label)
        return result

    def get_d(self, label: str, value: gmpy2.mpfr, rounding: str) -> float:
        context = self._contexts[rounding]
        with gmpy2.context(context) as active:
            active.clear_flags()
            result = float(value)
            if not math.isfinite(result):
                raise SiNormalizationError("mpfr_get_d_nonfinite", label)
            exact_result = gmpy2.mpfr(result, PRECISION_BITS)
            ternary = -1 if exact_result < value else 1 if exact_result > value else 0
            self._trace.append(
                PrimitiveTrace(
                    ordinal=len(self._trace),
                    label=label,
                    rounding=rounding,
                    ternary_result=ternary,
                    inexact=ternary != 0,
                )
            )
            return result

    def const_pi(self, label: str) -> _Interval:
        lower = self._operation(
            f"{label}.lower", "RNDD", lambda: gmpy2.const_pi(PRECISION_BITS)
        )
        upper = self._operation(
            f"{label}.upper", "RNDU", lambda: gmpy2.const_pi(PRECISION_BITS)
        )
        return self._ordered_positive(label, lower, upper)

    def add_pos(self, label: str, left: _Interval, right: _Interval) -> _Interval:
        lower = self._binary(label, "lower", "RNDD", gmpy2.add, left.lower, right.lower)
        upper = self._binary(label, "upper", "RNDU", gmpy2.add, left.upper, right.upper)
        return self._ordered_positive(label, lower, upper)

    def mul_pos(self, label: str, left: _Interval, right: _Interval) -> _Interval:
        self._require_nonnegative(label, left, right)
        lower = self._binary(label, "lower", "RNDD", gmpy2.mul, left.lower, right.lower)
        upper = self._binary(label, "upper", "RNDU", gmpy2.mul, left.upper, right.upper)
        return self._ordered_positive(label, lower, upper)

    def div_pos(self, label: str, numerator: _Interval, denominator: _Interval) -> _Interval:
        self._require_nonnegative(label, numerator, denominator)
        if denominator.lower <= 0:
            raise SiNormalizationError("interval_denominator_not_positive", label)
        lower = self._binary(
            label, "lower", "RNDD", gmpy2.div, numerator.lower, denominator.upper
        )
        upper = self._binary(
            label, "upper", "RNDU", gmpy2.div, numerator.upper, denominator.lower
        )
        return self._ordered_positive(label, lower, upper)

    def square_pos(self, label: str, value: _Interval) -> _Interval:
        self._require_nonnegative(label, value)
        lower = self._binary(label, "lower", "RNDD", gmpy2.mul, value.lower, value.lower)
        upper = self._binary(label, "upper", "RNDU", gmpy2.mul, value.upper, value.upper)
        return self._ordered_positive(label, lower, upper)

    def sqrt_pos(self, label: str, value: _Interval) -> _Interval:
        self._require_nonnegative(label, value)
        lower = self._operation(
            f"{label}.lower", "RNDD", lambda: gmpy2.sqrt(value.lower)
        )
        upper = self._operation(
            f"{label}.upper", "RNDU", lambda: gmpy2.sqrt(value.upper)
        )
        return self._ordered_positive(label, lower, upper)

    def symmetric_hull(
        self, label: str, center: _Interval, uncertainty: _Interval, factor: _Interval
    ) -> _Interval:
        self._require_nonnegative(label, center, uncertainty, factor)
        product_lower_use = self._binary(
            label,
            "factor_uncertainty_for_lower",
            "RNDU",
            gmpy2.mul,
            factor.upper,
            uncertainty.upper,
        )
        lower = self._binary(
            label,
            "lower",
            "RNDD",
            gmpy2.sub,
            center.lower,
            product_lower_use,
        )
        product_upper_use = self._binary(
            label,
            "factor_uncertainty_for_upper",
            "RNDU",
            gmpy2.mul,
            factor.upper,
            uncertainty.upper,
        )
        upper = self._binary(
            label,
            "upper",
            "RNDU",
            gmpy2.add,
            center.upper,
            product_upper_use,
        )
        return self._ordered_positive(label, lower, upper)

    def central_decimal(self, label: str, value: str) -> gmpy2.mpfr:
        return self._operation(label, "RNDN", lambda: gmpy2.mpfr(value, PRECISION_BITS))

    def central_uint(self, label: str, value: int) -> gmpy2.mpfr:
        return self._operation(label, "RNDN", lambda: gmpy2.mpfr(value, PRECISION_BITS))

    def central_dyadic(self, label: str, mantissa: int, exponent2: int) -> gmpy2.mpfr:
        base = self._operation(
            f"{label}.set_integer", "RNDN", lambda: gmpy2.mpfr(mantissa, PRECISION_BITS)
        )
        return self._operation(
            f"{label}.mul_2exp", "RNDN", lambda: gmpy2.mul_2exp(base, exponent2)
        )

    def central_pi(self, label: str) -> gmpy2.mpfr:
        return self._operation(label, "RNDN", lambda: gmpy2.const_pi(PRECISION_BITS))

    def central_binary(
        self,
        label: str,
        operation: Callable[[gmpy2.mpfr, gmpy2.mpfr], gmpy2.mpfr],
        left: gmpy2.mpfr,
        right: gmpy2.mpfr,
    ) -> gmpy2.mpfr:
        return self._operation(label, "RNDN", lambda: operation(left, right))

    def central_sqrt(self, label: str, value: gmpy2.mpfr) -> gmpy2.mpfr:
        if value <= 0:
            raise SiNormalizationError("central_sqrt_nonpositive", label)
        return self._operation(label, "RNDN", lambda: gmpy2.sqrt(value))

    def _binary(
        self,
        label: str,
        suffix: str,
        rounding: str,
        operation: Callable[[gmpy2.mpfr, gmpy2.mpfr], gmpy2.mpfr],
        left: gmpy2.mpfr,
        right: gmpy2.mpfr,
    ) -> gmpy2.mpfr:
        return self._operation(
            f"{label}.{suffix}", rounding, lambda: operation(left, right)
        )

    @staticmethod
    def _require_nonnegative(label: str, *values: _Interval) -> None:
        if any(value.lower < 0 or value.upper < value.lower for value in values):
            raise SiNormalizationError("positive_interval_precondition_failed", label)

    @staticmethod
    def _ordered_positive(
        label: str, lower: gmpy2.mpfr, upper: gmpy2.mpfr
    ) -> _Interval:
        if not (0 < lower <= upper):
            raise SiNormalizationError("positive_interval_invalid", label)
        return _Interval(lower, upper)


def _runtime_guard() -> None:
    observed = (gmpy2.version(), gmpy2.mpfr_version(), gmpy2.mp_version())
    expected = (EXPECTED_GMPY2_VERSION, EXPECTED_MPFR_VERSION, EXPECTED_GMP_VERSION)
    if observed != expected:
        raise SiNormalizationError("mpfr_runtime_identity_mismatch", repr(observed))


def _endpoint(value: gmpy2.mpfr, direction: str) -> DyadicEndpoint:
    if value == 0 or not gmpy2.is_finite(value):
        raise SiNormalizationError("receipt_endpoint_invalid", direction)
    mantissa_raw, exponent_raw = value.as_mantissa_exp()
    mantissa = int(mantissa_raw)
    exponent2 = int(exponent_raw)
    sign = "-" if mantissa < 0 else "+"
    magnitude = abs(mantissa)
    while magnitude & 1 == 0:
        magnitude >>= 1
        exponent2 += 1
    return DyadicEndpoint(
        sign=sign,
        mantissa_lowercase_hex=f"{magnitude:x}",
        exponent2=exponent2,
        precision_bits=PRECISION_BITS,
        direction=direction,
    )


def _interval_receipt(value: _Interval) -> DirectedIntervalReceipt:
    return DirectedIntervalReceipt(
        lower=_endpoint(value.lower, "RNDD"), upper=_endpoint(value.upper, "RNDU")
    )


def _float_bits(value: float) -> str:
    if type(value) is not float or not math.isfinite(value):
        raise SiNormalizationError("binary64_value_invalid")
    return f"{struct.unpack('>Q', struct.pack('>d', value))[0]:016x}"


def _admit_codata(codata_raw_bytes: bytes) -> str:
    if type(codata_raw_bytes) is not bytes:
        raise SiNormalizationError("codata_exact_bytes_required")
    if len(codata_raw_bytes) != CODATA_RAW_SIZE_BYTES:
        raise SiNormalizationError("codata_raw_size_mismatch")
    observed_sha256 = hashlib.sha256(codata_raw_bytes).hexdigest()
    if observed_sha256 != CODATA_RAW_SHA256:
        raise SiNormalizationError("codata_raw_sha256_mismatch")
    _runtime_guard()
    return observed_sha256


def _directed_graph(arithmetic: _Arithmetic) -> dict[str, _Interval]:
    node: dict[str, _Interval] = {}
    node["g"] = arithmetic.dyadic("01_g", 1, -40)
    node["c"] = arithmetic.uint("02_c", 299_792_458)
    node["h"] = arithmetic.decimal("03_h", "6.62607015e-34")
    node["pi"] = arithmetic.const_pi("04_pi")
    node["two"] = arithmetic.uint("05_two", 2)
    node["eight"] = arithmetic.uint("06_eight", 8)
    node["twoPi"] = arithmetic.mul_pos("07_twoPi", node["two"], node["pi"])
    node["hbar"] = arithmetic.div_pos("08_hbar", node["h"], node["twoPi"])
    node["GCentral"] = arithmetic.decimal("09_GCentral", "6.67430e-11")
    node["GStandardUncertainty"] = arithmetic.decimal(
        "10_GStandardUncertainty", "1.5e-15"
    )
    one = arithmetic.uint("11_GOneSigma.factor", 1)
    node["GOneSigma"] = arithmetic.symmetric_hull(
        "11_GOneSigma", node["GCentral"], node["GStandardUncertainty"], one
    )
    two_factor = arithmetic.uint("12_GAdmissionK2.factor", 2)
    node["GAdmissionK2"] = arithmetic.symmetric_hull(
        "12_GAdmissionK2",
        node["GCentral"],
        node["GStandardUncertainty"],
        two_factor,
    )
    node["eightPi"] = arithmetic.mul_pos("13_eightPi", node["eight"], node["pi"])
    node["c2"] = arithmetic.mul_pos("14_c2", node["c"], node["c"])
    node["c3"] = arithmetic.mul_pos("15_c3", node["c2"], node["c"])
    node["c4"] = arithmetic.mul_pos("16_c4", node["c2"], node["c2"])
    node["c5"] = arithmetic.mul_pos("17_c5", node["c4"], node["c"])
    node["c7"] = arithmetic.mul_pos("18_c7", node["c4"], node["c3"])
    node["gHbar"] = arithmetic.mul_pos("19_gHbar", node["g"], node["hbar"])
    node["gHbarC5"] = arithmetic.mul_pos(
        "20_gHbarC5", node["gHbar"], node["c5"]
    )
    node["eightPiGCentral"] = arithmetic.mul_pos(
        "21_eightPiGCentral", node["eightPi"], node["GCentral"]
    )
    node["muECentralSquared"] = arithmetic.div_pos(
        "22_muECentralSquared", node["gHbarC5"], node["eightPiGCentral"]
    )
    node["muECentral"] = arithmetic.sqrt_pos(
        "23_muECentral", node["muECentralSquared"]
    )
    node["hbarC"] = arithmetic.mul_pos("24_hbarC", node["hbar"], node["c"])
    node["muLCentral"] = arithmetic.div_pos(
        "25_muLCentral", node["muECentral"], node["hbarC"]
    )
    node["muLCentralSquared"] = arithmetic.square_pos(
        "26_muLCentralSquared", node["muLCentral"]
    )
    node["c4MuLCentralSquared"] = arithmetic.mul_pos(
        "27_c4MuLCentralSquared", node["c4"], node["muLCentralSquared"]
    )
    node["stressScaleCentralViaMu"] = arithmetic.div_pos(
        "28_stressScaleCentralViaMu",
        node["c4MuLCentralSquared"],
        node["eightPiGCentral"],
    )
    node["eightPiGCentralSquared"] = arithmetic.square_pos(
        "29_eightPiGCentralSquared", node["eightPiGCentral"]
    )
    node["eightPiGCentralSquaredHbar"] = arithmetic.mul_pos(
        "30_eightPiGCentralSquaredHbar",
        node["eightPiGCentralSquared"],
        node["hbar"],
    )
    node["gC7"] = arithmetic.mul_pos("31_gC7", node["g"], node["c7"])
    node["stressScaleCentral"] = arithmetic.div_pos(
        "32_stressScaleCentral", node["gC7"], node["eightPiGCentralSquaredHbar"]
    )
    node["noiseScaleCentral"] = arithmetic.square_pos(
        "33_noiseScaleCentral", node["stressScaleCentral"]
    )
    node["eightPiGOneSigma"] = arithmetic.mul_pos(
        "34_eightPiGOneSigma", node["eightPi"], node["GOneSigma"]
    )
    node["muEOneSigmaSquared"] = arithmetic.div_pos(
        "35_muEOneSigmaSquared", node["gHbarC5"], node["eightPiGOneSigma"]
    )
    node["muEOneSigma"] = arithmetic.sqrt_pos(
        "36_muEOneSigma", node["muEOneSigmaSquared"]
    )
    node["muLOneSigma"] = arithmetic.div_pos(
        "37_muLOneSigma", node["muEOneSigma"], node["hbarC"]
    )
    node["eightPiGOneSigmaSquared"] = arithmetic.square_pos(
        "38_eightPiGOneSigmaSquared", node["eightPiGOneSigma"]
    )
    node["eightPiGOneSigmaSquaredHbar"] = arithmetic.mul_pos(
        "39_eightPiGOneSigmaSquaredHbar",
        node["eightPiGOneSigmaSquared"],
        node["hbar"],
    )
    node["stressScaleOneSigma"] = arithmetic.div_pos(
        "40_stressScaleOneSigma",
        node["gC7"],
        node["eightPiGOneSigmaSquaredHbar"],
    )
    node["noiseScaleOneSigma"] = arithmetic.square_pos(
        "41_noiseScaleOneSigma", node["stressScaleOneSigma"]
    )
    node["eightPiGAdmissionK2"] = arithmetic.mul_pos(
        "42_eightPiGAdmissionK2", node["eightPi"], node["GAdmissionK2"]
    )
    node["muEAdmissionK2Squared"] = arithmetic.div_pos(
        "43_muEAdmissionK2Squared", node["gHbarC5"], node["eightPiGAdmissionK2"]
    )
    node["muEAdmissionK2"] = arithmetic.sqrt_pos(
        "44_muEAdmissionK2", node["muEAdmissionK2Squared"]
    )
    node["muLAdmissionK2"] = arithmetic.div_pos(
        "45_muLAdmissionK2", node["muEAdmissionK2"], node["hbarC"]
    )
    node["eightPiGAdmissionK2Squared"] = arithmetic.square_pos(
        "46_eightPiGAdmissionK2Squared", node["eightPiGAdmissionK2"]
    )
    node["eightPiGAdmissionK2SquaredHbar"] = arithmetic.mul_pos(
        "47_eightPiGAdmissionK2SquaredHbar",
        node["eightPiGAdmissionK2Squared"],
        node["hbar"],
    )
    node["stressScaleAdmissionK2"] = arithmetic.div_pos(
        "48_stressScaleAdmissionK2",
        node["gC7"],
        node["eightPiGAdmissionK2SquaredHbar"],
    )
    node["noiseScaleAdmissionK2"] = arithmetic.square_pos(
        "49_noiseScaleAdmissionK2", node["stressScaleAdmissionK2"]
    )
    return node


def _central_graph(arithmetic: _Arithmetic) -> dict[str, gmpy2.mpfr]:
    node: dict[str, gmpy2.mpfr] = {}
    node["gN"] = arithmetic.central_dyadic("central.01_gN", 1, -40)
    node["cN"] = arithmetic.central_uint("central.02_cN", 299_792_458)
    node["hN"] = arithmetic.central_decimal("central.03_hN", "6.62607015e-34")
    node["piN"] = arithmetic.central_pi("central.04_piN")
    node["twoN"] = arithmetic.central_uint("central.05_twoN", 2)
    node["eightN"] = arithmetic.central_uint("central.06_eightN", 8)
    mul = gmpy2.mul
    div = gmpy2.div
    node["twoPiN"] = arithmetic.central_binary(
        "central.07_twoPiN", mul, node["twoN"], node["piN"]
    )
    node["hbarN"] = arithmetic.central_binary(
        "central.08_hbarN", div, node["hN"], node["twoPiN"]
    )
    node["GN"] = arithmetic.central_decimal("central.09_GN", "6.67430e-11")
    node["eightPiN"] = arithmetic.central_binary(
        "central.10_eightPiN", mul, node["eightN"], node["piN"]
    )
    node["c2N"] = arithmetic.central_binary(
        "central.11_c2N", mul, node["cN"], node["cN"]
    )
    node["c3N"] = arithmetic.central_binary(
        "central.12_c3N", mul, node["c2N"], node["cN"]
    )
    node["c4N"] = arithmetic.central_binary(
        "central.13_c4N", mul, node["c2N"], node["c2N"]
    )
    node["c5N"] = arithmetic.central_binary(
        "central.14_c5N", mul, node["c4N"], node["cN"]
    )
    node["c7N"] = arithmetic.central_binary(
        "central.15_c7N", mul, node["c4N"], node["c3N"]
    )
    node["gHbarN"] = arithmetic.central_binary(
        "central.16_gHbarN", mul, node["gN"], node["hbarN"]
    )
    node["gHbarC5N"] = arithmetic.central_binary(
        "central.17_gHbarC5N", mul, node["gHbarN"], node["c5N"]
    )
    node["eightPiGN"] = arithmetic.central_binary(
        "central.18_eightPiGN", mul, node["eightPiN"], node["GN"]
    )
    node["muE2N"] = arithmetic.central_binary(
        "central.19_muE2N", div, node["gHbarC5N"], node["eightPiGN"]
    )
    node["muEN"] = arithmetic.central_sqrt("central.20_muEN", node["muE2N"])
    node["hbarCN"] = arithmetic.central_binary(
        "central.21_hbarCN", mul, node["hbarN"], node["cN"]
    )
    node["muLN"] = arithmetic.central_binary(
        "central.22_muLN", div, node["muEN"], node["hbarCN"]
    )
    node["eightPiG2N"] = arithmetic.central_binary(
        "central.23_eightPiG2N", mul, node["eightPiGN"], node["eightPiGN"]
    )
    node["eightPiG2HbarN"] = arithmetic.central_binary(
        "central.24_eightPiG2HbarN", mul, node["eightPiG2N"], node["hbarN"]
    )
    node["gC7N"] = arithmetic.central_binary(
        "central.25_gC7N", mul, node["gN"], node["c7N"]
    )
    node["stressScaleN"] = arithmetic.central_binary(
        "central.26_stressScaleN", div, node["gC7N"], node["eightPiG2HbarN"]
    )
    node["noiseScaleN"] = arithmetic.central_binary(
        "central.27_noiseScaleN", mul, node["stressScaleN"], node["stressScaleN"]
    )
    return node


def materialize_si_normalization(codata_raw_bytes: bytes) -> SiNormalizationReceipt:
    """Execute the frozen static graph after exact raw CODATA admission."""

    observed_sha256 = _admit_codata(codata_raw_bytes)

    arithmetic = _Arithmetic()
    directed = _directed_graph(arithmetic)
    central = _central_graph(arithmetic)

    if not (
        directed["stressScaleCentralViaMu"].lower
        <= directed["stressScaleCentral"].upper
        and directed["stressScaleCentral"].lower
        <= directed["stressScaleCentralViaMu"].upper
    ):
        raise SiNormalizationError("central_stress_identity_intervals_disjoint")

    scale_nodes = (
        ("mu_E_central", directed["muECentral"]),
        ("mu_L_central", directed["muLCentral"]),
        ("stress_scale_central_via_mu", directed["stressScaleCentralViaMu"]),
        ("stress_scale_central_closed", directed["stressScaleCentral"]),
        ("noise_scale_central", directed["noiseScaleCentral"]),
        ("mu_E_one_sigma", directed["muEOneSigma"]),
        ("mu_L_one_sigma", directed["muLOneSigma"]),
        ("stress_scale_one_sigma", directed["stressScaleOneSigma"]),
        ("noise_scale_one_sigma", directed["noiseScaleOneSigma"]),
        ("mu_E_admission_k2", directed["muEAdmissionK2"]),
        ("mu_L_admission_k2", directed["muLAdmissionK2"]),
        ("stress_scale_admission_k2", directed["stressScaleAdmissionK2"]),
        ("noise_scale_admission_k2", directed["noiseScaleAdmissionK2"]),
    )
    if tuple(name for name, _ in scale_nodes) != SCALE_IDS:
        raise SiNormalizationError("scale_inventory_internal_mismatch")

    central_nodes = (
        ("mu_E_central", central["muEN"]),
        ("mu_L_central", central["muLN"]),
        ("stress_scale_central_closed", central["stressScaleN"]),
        ("noise_scale_central", central["noiseScaleN"]),
    )
    for name, value in central_nodes:
        enclosure_name = {
            "mu_E_central": "mu_E_central",
            "mu_L_central": "mu_L_central",
            "stress_scale_central_closed": "stress_scale_central_closed",
            "noise_scale_central": "noise_scale_central",
        }[name]
        interval = dict(scale_nodes)[enclosure_name]
        if not (interval.lower <= value <= interval.upper):
            raise SiNormalizationError("central_representative_not_enclosed", name)

    native_trace = arithmetic.native_trace
    if (
        tuple(entry.ordinal for entry in native_trace)
        != tuple(range(len(native_trace)))
        or tuple(entry.label for entry in native_trace)
        != (
            "01_g",
            "02_c",
            "05_two",
            "06_eight",
            "11_GOneSigma.factor",
            "12_GAdmissionK2.factor",
        )
        or not all(
            entry.destination_storage_pairwise_distinct
            and entry.limb_storage_pairwise_distinct
            and entry.lower_upper_equal
            and entry.mathematical_value_verified
            and entry.gmpy2_calculation_value_verified
            and all(
                precision == PRECISION_BITS
                for precision in entry.destination_precision_bits
            )
            and all(ternary == 0 for ternary in entry.ternary_results)
            for entry in native_trace
        )
    ):
        raise SiNormalizationError("native_mpfr_exact_endpoint_inventory_mismatch")

    central_scale_receipts = tuple(
        (
            name,
            CentralScaleReceipt(
                value=_endpoint(value, "RNDN"),
                binary64_bits=_float_bits(
                    arithmetic.get_d(
                        f"receipt.central_scales.{name}.get_d",
                        value,
                        "RNDN",
                    )
                ),
            ),
        )
        for name, value in central_nodes
    )

    receipt = SiNormalizationReceipt(
        contract_sha256=CONTRACT_SHA256,
        contract_canonical_size_bytes=CONTRACT_CANONICAL_SIZE_BYTES,
        codata_raw_sha256=observed_sha256,
        codata_raw_size_bytes=len(codata_raw_bytes),
        gmpy2_version=gmpy2.version(),
        mpfr_version=gmpy2.mpfr_version(),
        gmp_version=gmpy2.mp_version(),
        native_mpfr_version=EXPECTED_NATIVE_MPFR_VERSION,
        native_gmp_version=EXPECTED_NATIVE_GMP_VERSION,
        native_mpfr_dll_sha256=NATIVE_MPFR_DLL_SHA256,
        native_mpfr_dll_size_bytes=NATIVE_MPFR_DLL_SIZE_BYTES,
        native_gmp_dll_sha256=NATIVE_GMP_DLL_SHA256,
        native_gmp_dll_size_bytes=NATIVE_GMP_DLL_SIZE_BYTES,
        scale_graph_node_count=49,
        central_graph_node_count=27,
        primitive_trace=arithmetic.trace,
        native_exact_endpoint_trace=native_trace,
        scales=tuple((name, _interval_receipt(value)) for name, value in scale_nodes),
        central_scales=central_scale_receipts,
        central_via_mu_overlaps_closed=True,
        calculation_only=True,
        native_disk_bytes_hash_observed=True,
        exact_loaded_native_module_byte_identity_proved=False,
        native_hash_to_load_toctou_closed=False,
        exact_mutable_destination_storage_verified=True,
        native_exact_endpoint_subset_only=True,
        full_contract_graph_executed_through_direct_native_abi=False,
        gmpy2_numeric_graph_used=True,
        exclusive_mpfr_context_lease=False,
        caller_native_flags_restored=False,
        production_runtime_bound=False,
        source_disjoint_independent_implementation_bound=False,
        exact_contract_operation_trace_conformance=False,
        module_local_origin_check_only=True,
        server_authenticated=False,
        capability_authority=False,
        future_server_promotion_allowed=False,
        implementation_blockers=CALCULATION_ONLY_IMPLEMENTATION_BLOCKERS,
        execution_authority=False,
        replay_authority=False,
        diagnostic_pass=False,
        stress_noise_lamp=False,
        constraint_algebra_lamp=False,
        physical_viability=False,
        propulsion=False,
        transport=False,
    )
    _register_receipt(_SI_RECEIPTS, receipt)
    return receipt


def materialize_paired_element(
    codata_raw_bytes: bytes,
    input_center: float,
    input_absolute_uncertainty95: float,
    *,
    scale_kind: str,
) -> PairedElementReceipt:
    """Scale one central/uncertainty pair with the frozen byte-centered graph."""

    _admit_codata(codata_raw_bytes)
    if (
        type(scale_kind) is not str
        or len(scale_kind) not in (5, 6)
        or scale_kind not in ("stress", "noise")
    ):
        raise SiNormalizationError("paired_element_scale_kind_invalid")
    if (
        type(input_center) is not float
        or type(input_absolute_uncertainty95) is not float
        or not math.isfinite(input_center)
        or not math.isfinite(input_absolute_uncertainty95)
        or input_absolute_uncertainty95 < 0.0
        or _float_bits(input_center) == "8000000000000000"
        or _float_bits(input_absolute_uncertainty95) == "8000000000000000"
    ):
        raise SiNormalizationError("paired_element_input_invalid")

    arithmetic = _Arithmetic()
    directed = _directed_graph(arithmetic)
    central = _central_graph(arithmetic)
    central_scale = (
        central["stressScaleN"] if scale_kind == "stress" else central["noiseScaleN"]
    )
    admission_scale = (
        directed["stressScaleAdmissionK2"]
        if scale_kind == "stress"
        else directed["noiseScaleAdmissionK2"]
    )

    central_input = arithmetic.exact_binary64(
        "element.central.01_input", input_center
    )
    central_product = arithmetic.central_binary(
        "element.central.03_product",
        gmpy2.mul,
        central_input,
        central_scale,
    )
    central_f64 = arithmetic.get_d(
        "element.central.05_get_d", central_product, "RNDN"
    )
    central_bits = _float_bits(central_f64)
    if central_bits == "8000000000000000":
        raise SiNormalizationError("central_binary64_barrier_invalid")

    uncertainty_center = arithmetic.exact_binary64(
        "element.uncertainty.01_input_center", input_center
    )
    uncertainty_input = arithmetic.exact_binary64(
        "element.uncertainty.02_input_uncertainty",
        input_absolute_uncertainty95,
    )
    if uncertainty_input < 0:
        raise SiNormalizationError("paired_uncertainty_negative")
    value_hull_lower = arithmetic._binary(
        "element.uncertainty",
        "04_value_hull_lower",
        "RNDD",
        gmpy2.sub,
        uncertainty_center,
        uncertainty_input,
    )
    value_hull_upper = arithmetic._binary(
        "element.uncertainty",
        "05_value_hull_upper",
        "RNDU",
        gmpy2.add,
        uncertainty_center,
        uncertainty_input,
    )
    scaled_hull = arithmetic.general_mul(
        "element.uncertainty.06_scaled_hull",
        _Interval(value_hull_lower, value_hull_upper),
        admission_scale,
    )
    serialized_center = arithmetic.exact_binary64(
        "element.uncertainty.08_serialized_center", central_f64
    )
    center_inside = scaled_hull.lower <= serialized_center <= scaled_hull.upper
    if not center_inside:
        raise SiNormalizationError("serialized_center_outside_directed_hull")
    lower_distance = arithmetic._binary(
        "element.uncertainty",
        "10_lower_distance",
        "RNDU",
        gmpy2.sub,
        serialized_center,
        scaled_hull.lower,
    )
    upper_distance = arithmetic._binary(
        "element.uncertainty",
        "11_upper_distance",
        "RNDU",
        gmpy2.sub,
        scaled_hull.upper,
        serialized_center,
    )
    maximum_distance = lower_distance if lower_distance >= upper_distance else upper_distance
    uncertainty_f64 = arithmetic.get_d(
        "element.uncertainty.13_get_d", maximum_distance, "RNDU"
    )
    uncertainty_bits = _float_bits(uncertainty_f64)
    if uncertainty_f64 < 0.0 or uncertainty_bits == "8000000000000000":
        raise SiNormalizationError("uncertainty_binary64_barrier_invalid")
    serialized_uncertainty = arithmetic.exact_binary64(
        "element.uncertainty.15_serialized_uncertainty", uncertainty_f64
    )
    encloses = (
        serialized_uncertainty >= lower_distance
        and serialized_uncertainty >= upper_distance
    )
    if not encloses:
        raise SiNormalizationError("serialized_uncertainty_does_not_enclose_hull")

    receipt = PairedElementReceipt(
        scale_kind=scale_kind,
        input_center_binary64_bits=_float_bits(input_center),
        input_uncertainty_binary64_bits=_float_bits(input_absolute_uncertainty95),
        central_binary64_bits=central_bits,
        uncertainty_binary64_bits=uncertainty_bits,
        central_value=central_f64,
        absolute_uncertainty95=uncertainty_f64,
        serialized_center_inside_directed_hull=center_inside,
        serialized_uncertainty_encloses_both_distances=encloses,
        calculation_only=True,
        production_runtime_bound=False,
        module_local_origin_check_only=True,
        server_authenticated=False,
        capability_authority=False,
        future_server_promotion_allowed=False,
        implementation_blockers=CALCULATION_ONLY_IMPLEMENTATION_BLOCKERS,
        execution_authority=False,
        replay_authority=False,
        diagnostic_pass=False,
        physical_viability=False,
        propulsion=False,
        transport=False,
    )
    _register_receipt(_PAIRED_RECEIPTS, receipt)
    return receipt
