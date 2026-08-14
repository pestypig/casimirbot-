"""Authority-neutral Linux MPFR/GMP runtime-conformance diagnostic.

No audited, non-caller-controlled runtime manifest literal is installed.  Both
zero-input public entry points therefore fail closed before any filesystem or
native-loader traversal.  They accept no candidate, output root, library path,
digest, launch command, execution receipt, provider, or authority capability.

The module-private diagnostic core securely opens and hashes each single-link
source file, copies those exact bytes into a sealed memfd, and can inspect the
sealed GMP and MPFR copies in one fresh dynamic-loader namespace.  That core is
not a public loader route while the source literal remains null.  Its private
test seam can mint only permanently synthetic evidence.  The source inode is
deliberately *not* claimed to be the loaded inode.

The diagnostic proves the sealed loaded-object identities at the observation
boundary using ``dlinfo``, ``dladdr``, and ``/proc/self/maps``.  It then runs a
small direct-native-ABI MPFR-256 canary, then retains an exclusive context and
owned opaque values through fixed SI operations.  Receipt finalization happens
only after reverse object clearing, context restoration, unloading, and held-FD
closure.  Every execution, replay, publication, scientific, physical,
propulsion, and transport authority flag is permanently false.
"""

from __future__ import annotations

from dataclasses import dataclass, fields
import ctypes
import hashlib
import importlib
import json
import math
import os
import platform
import re
import stat
import struct
import sys
import threading
import weakref
from typing import Any, Final, NoReturn


ARTIFACT_ID: Final = (
    "nhm2.spherical_boson_star_v2.mpfr256_runtime_conformance_receipt"
)
CONTRACT_VERSION: Final = (
    "nhm2_spherical_boson_star_v2_mpfr256_runtime_conformance/v2"
)
EXPECTED_MPFR_VERSION: Final = "4.2.2"
EXPECTED_GMP_VERSION: Final = "6.3.0"
EXPECTED_MPFR_SONAME: Final = "libmpfr.so.6"
EXPECTED_GMP_SONAME: Final = "libgmp.so.10"
PRECISION_BITS: Final = 256
CONFIGURED_EMIN: Final = -1_000_000
CONFIGURED_EMAX: Final = 1_000_000
MAX_LIBRARY_SIZE_BYTES: Final = 64 * 1024 * 1024
MAX_PATH_CODEPOINTS: Final = 4_096
MAX_LOADER_MAP_BYTES: Final = 16 * 1024 * 1024
MAX_ELF_PROGRAM_HEADERS: Final = 512
MAX_DYNAMIC_ENTRIES: Final = 4_096
MAX_DYNAMIC_STRING_TABLE_BYTES: Final = 1 * 1024 * 1024
MAX_DYNAMIC_STRINGS: Final = 128
READ_CHUNK_BYTES: Final = 1024 * 1024
MAX_LEASE_OBJECTS: Final = 4_096
MAX_LEASE_OPERATIONS: Final = 65_536
MAX_DECIMAL_LITERAL_BYTES: Final = 256
MAX_INTEGER_DECIMAL_BYTES: Final = 4_096
MAX_ABS_BINARY_EXPONENT: Final = 1_000_000
MAX_RECEIPT_SNAPSHOT_DEPTH: Final = 16
MAX_RECEIPT_SNAPSHOT_NODES: Final = 1_000_000
MAX_RECEIPT_SNAPSHOT_TUPLE_LENGTH: Final = MAX_LEASE_OPERATIONS + 1
MAX_RECEIPT_SNAPSHOT_STRING_BYTES: Final = 32_768
MAX_RECEIPT_SNAPSHOT_BYTES: Final = 32 * 1024 * 1024
SI_EXPECTED_DIRECTED_ROUNDED_OPERATION_COUNT: Final = 107
SI_EXPECTED_CENTRAL_RNDN_OPERATION_COUNT: Final = 28
SI_EXPECTED_TERMINAL_GET_D_COUNT: Final = 4
SI_EXPECTED_TOTAL_ROUNDED_OPERATION_COUNT: Final = 139

RNDN: Final = 0
RNDU: Final = 2
RNDD: Final = 3
MPFR_FLAGS_ALL: Final = 63

SI_LEASE_OPERATION_INVENTORY: Final = (
    "allocate_mpfr256",
    "allocate_mpz",
    "mpz_set_ui",
    "mpz_set_si",
    "mpz_set_decimal",
    "mpz_decimal",
    "mpfr_set_ui",
    "mpfr_set_si",
    "mpfr_set_decimal",
    "mpfr_set_z",
    "mpfr_set",
    "mpfr_mul_2si",
    "mpfr_add",
    "mpfr_sub",
    "mpfr_mul",
    "mpfr_div",
    "mpfr_sqrt",
    "mpfr_const_pi",
    "mpfr_compare",
    "mpfr_compare_ui",
    "mpfr_compare_z",
    "mpfr_equal",
    "mpfr_get_z_2exp",
    "mpfr_get_d",
    "mpfr_number",
    "mpfr_precision",
)

REQUIRED_MPFR_SYMBOLS: Final = (
    "mpfr_init2",
    "mpfr_clear",
    "mpfr_get_prec",
    "mpfr_set",
    "mpfr_set_ui",
    "mpfr_set_si",
    "mpfr_set_d",
    "mpfr_set_str",
    "mpfr_set_z",
    "mpfr_mul_2si",
    "mpfr_add",
    "mpfr_sub",
    "mpfr_mul",
    "mpfr_mul_ui",
    "mpfr_mul_si",
    "mpfr_div",
    "mpfr_div_ui",
    "mpfr_ui_div",
    "mpfr_neg",
    "mpfr_abs",
    "mpfr_sqrt",
    "mpfr_exp",
    "mpfr_log",
    "mpfr_cos",
    "mpfr_const_pi",
    "mpfr_cmp",
    "mpfr_cmp_ui",
    "mpfr_cmp_z",
    "mpfr_equal_p",
    "mpfr_get_z_2exp",
    "mpfr_get_d",
    "mpfr_number_p",
    "mpfr_get_emin",
    "mpfr_get_emax",
    "mpfr_set_emin",
    "mpfr_set_emax",
    "mpfr_get_default_rounding_mode",
    "mpfr_set_default_rounding_mode",
    "mpfr_clear_flags",
    "mpfr_flags_save",
    "mpfr_flags_restore",
    "mpfr_underflow_p",
    "mpfr_overflow_p",
    "mpfr_divby0_p",
    "mpfr_nanflag_p",
    "mpfr_inexflag_p",
    "mpfr_erangeflag_p",
    "mpfr_get_version",
    "mpfr_buildopt_tls_p",
    "mpfr_free_cache",
)

REQUIRED_GMP_SYMBOLS: Final = (
    "__gmpz_init",
    "__gmpz_clear",
    "__gmpz_set_ui",
    "__gmpz_set_si",
    "__gmpz_set_str",
    "__gmpz_get_str",
    "__gmpz_sizeinbase",
    "__gmp_version",
    "__gmp_bits_per_limb",
)

AUTHORITY_BLOCKERS: Final = (
    "runtime_conformance_receipt_is_diagnostic_binding_only",
    "trusted_runtime_manifest_not_installed",
    "server_authenticated_runtime_loader_observer_absent",
    "independent_runtime_conformance_observation_absent",
    "real_linux_glibc_integration_not_observed",
    "native_runtime_provider_has_no_public_route",
    "consumer_arithmetic_not_bound_to_conformed_runtime",
    "transitive_runtime_closure_unbound",
    "host_loader_and_procfs_identity_not_authenticated",
    "candidate_execution_and_publication_not_authorized",
    "semantic_si_operation_labels_bound_by_future_adapter_not_runtime_lease",
)

SYNTHETIC_LEASE_BLOCKERS: Final = (
    "synthetic_test_provider_not_production_conformance",
    "trusted_runtime_manifest_not_installed",
    "real_linux_glibc_integration_not_observed",
    "independent_runtime_lane_absent",
    "server_authenticated_runtime_loader_observer_absent",
    "transitive_runtime_closure_unbound",
    "host_loader_and_procfs_identity_not_authenticated",
    "candidate_execution_and_publication_not_authorized",
    "semantic_si_operation_labels_bound_by_future_adapter_not_runtime_lease",
    "post_close_binding_requires_validated_immutable_receipt_snapshot",
)

NATIVE_LEASE_BLOCKERS: Final = (
    "runtime_conformance_receipt_is_diagnostic_binding_only",
    "independent_runtime_lane_absent",
    "server_authenticated_runtime_loader_observer_absent",
    "transitive_runtime_closure_unbound",
    "host_loader_and_procfs_identity_not_authenticated",
    "candidate_execution_and_publication_not_authorized",
    "semantic_si_operation_labels_bound_by_future_adapter_not_runtime_lease",
    "post_close_binding_requires_validated_immutable_receipt_snapshot",
)

_SHA256_RE = re.compile(r"[0-9a-f]{64}\Z")
_FINITE_DECIMAL_RE = re.compile(
    r"\+?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:e[+-]?[0-9]+)?\Z"
)
_INTEGER_DECIMAL_RE = re.compile(r"-?(?:0|[1-9][0-9]*)\Z")
_MAP_LINE_RE = re.compile(
    r"^(?P<start>[0-9a-f]+)-(?P<end>[0-9a-f]+)\s+"
    r"(?P<perms>[-rwxps]{4})\s+(?P<offset>[0-9a-f]+)\s+"
    r"(?P<major>[0-9a-f]+):(?P<minor>[0-9a-f]+)\s+"
    r"(?P<inode>[0-9]+)(?:\s+(?P<path>.*))?$"
)
_MAP_ESCAPE_RE = re.compile(r"\\([0-7]{3})")

_RUNTIME_LOCK = threading.Lock()
_CONTEXT_POISONED = False
_CONTEXT_POISON_REASONS: tuple[str, ...] = ()
_TEST_ONLY_MARKER = object()
_LEASE_GENERATION = 0


class RuntimeConformanceError(RuntimeError):
    """Typed, bounded failure that never grants partial conformance."""

    def __init__(
        self,
        code: str,
        detail: str | None = None,
        cleanup_codes: tuple[str, ...] = (),
    ) -> None:
        if type(code) is not str or not code or len(code) > 128:
            raise TypeError("runtime conformance error code must be bounded text")
        self.code = code
        self.detail = _bounded_text(detail, 256) if detail is not None else None
        self.cleanup_codes = tuple(
            _bounded_text(item, 128) for item in cleanup_codes[:12]
        )
        message = code if self.detail is None else f"{code}:{self.detail}"
        if self.cleanup_codes:
            message += ":cleanup=" + ",".join(self.cleanup_codes)
        super().__init__(message)


@dataclass(frozen=True, slots=True)
class _RuntimeLibraryExpectation:
    component: str
    absolute_path: str
    size_bytes: int
    sha256: str


@dataclass(frozen=True, slots=True)
class _RuntimeConformanceRequest:
    gmp: _RuntimeLibraryExpectation
    mpfr: _RuntimeLibraryExpectation


@dataclass(frozen=True, slots=True)
class _TrustedRuntimeManifestV1:
    artifact_id: str
    contract_version: str
    platform_system: str
    machine: str
    byte_order: str
    pointer_bits: int
    c_long_bits: int
    c_int_bits: int
    c_ulong_bits: int
    mpfr_version: str
    gmp_version: str
    mpfr_soname: str
    gmp_soname: str
    required_mpfr_symbols: tuple[str, ...]
    required_gmp_symbols: tuple[str, ...]
    gmp: _RuntimeLibraryExpectation
    mpfr: _RuntimeLibraryExpectation
    non_caller_controlled_literal: bool
    external_installer_allowed: bool
    canonical_size_bytes: int
    manifest_sha256: str


_TRUSTED_RUNTIME_MANIFEST_LITERAL: Final[
    _TrustedRuntimeManifestV1 | None
] = None


@dataclass(frozen=True, slots=True)
class FileIdentity:
    device: int
    inode: int
    mode: int
    link_count: int
    size_bytes: int
    mtime_ns: int
    ctime_ns: int


@dataclass(frozen=True, slots=True)
class ElfIdentity:
    elf_class: str
    byte_order: str
    object_type: str
    machine: str
    soname: str
    needed: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class SourceLibraryBinding:
    component: str
    canonical_path: str
    identity: FileIdentity
    sha256_first_pass: str
    sha256_second_pass: str
    sha256_after_load: str
    elf: ElfIdentity
    nofollow_segment_traversal: bool
    single_link_regular_file: bool
    source_inode_loaded_directly: bool


@dataclass(frozen=True, slots=True)
class LoadedLibraryBinding:
    component: str
    sealed_memfd_name: str
    identity: FileIdentity
    sha256: str
    seal_mask: int
    required_seal_mask: int
    seals_exact: bool
    loader_procfd_path: str
    loader_link_map_name: str
    dladdr_name: str
    maps_path: str
    representative_symbol: str
    maps_device_inode_exact: bool
    link_map_dladdr_exact: bool
    source_inode_loaded_directly: bool


@dataclass(frozen=True, slots=True)
class AbiObservation:
    platform_system: str
    machine: str
    byte_order: str
    pointer_bits: int
    c_long_bits: int
    c_int_bits: int
    c_ulong_bits: int
    mpfr_struct_size_bytes: int
    mpfr_struct_offsets: tuple[int, int, int, int]
    mpz_struct_size_bytes: int
    mpz_struct_offsets: tuple[int, int, int]
    gmp_limb_bits: int
    mpfr_tls_enabled: bool
    abi_exact: bool


@dataclass(frozen=True, slots=True)
class CanaryObservation:
    precision_bits: int
    lower_ternary: int
    upper_ternary: int
    lower_binary64_bits: str
    upper_binary64_bits: str
    strict_interval_observed: bool
    inexact_flag_observed: bool
    forbidden_flags_clear: bool
    reverse_cleanup_complete: bool


@dataclass(frozen=True, slots=True)
class ContextObservation:
    saved_emin: int
    saved_emax: int
    saved_rounding: int
    saved_flags: int
    configured_emin: int
    configured_emax: int
    configured_rounding: int
    exclusive_non_reentrant_lease: bool
    context_snapshot_complete: bool
    context_configuration_exact: bool
    context_restored_exact: bool
    flags_restored_exact: bool
    canary: CanaryObservation


@dataclass(frozen=True, slots=True)
class LeaseOperationObservation:
    ordinal: int
    operation: str
    rounding: str | None
    destination_ordinal: int | None
    source_ordinals: tuple[int, ...]
    ternary_result: int | None
    inexact_flag: bool
    forbidden_flags_clear: bool


@dataclass(frozen=True, slots=True, weakref_slot=True)
class _RuntimeLeaseReceipt:
    artifact_id: str
    contract_version: str
    provider_kind: str
    trusted_manifest_installed: bool
    trusted_manifest_sha256: str | None
    trusted_manifest_size_bytes: int | None
    real_linux_glibc_integration_observed: bool
    synthetic_test_provider: bool
    calculation_only: bool
    runtime_conformance_diagnostic_only: bool
    operations_issued_through_this_live_lease: bool
    safe_finite_number_predicate_exposed: bool
    precision_256_verified_for_every_allocated_mpfr_object: bool
    storage_nonalias_verified_for_every_allocated_mpfr_object: bool
    semantic_si_operation_labels_bound: bool
    expected_directed_rounded_operation_count: int
    expected_central_rndn_operation_count: int
    expected_terminal_get_d_count: int
    expected_total_rounded_operation_count: int
    observed_rounded_operation_count: int
    observed_terminal_get_d_count: int
    operation_inventory: tuple[str, ...]
    operation_trace: tuple[LeaseOperationObservation, ...]
    operation_trace_sha256: str
    generation: int
    mpfr_object_count: int
    mpz_object_count: int
    reverse_object_clear_complete: bool
    context_restored_exact: bool
    flags_restored_exact: bool
    runtime_unloaded_and_fds_closed: bool
    lifecycle_complete: bool
    canary: CanaryObservation
    source_libraries: tuple[SourceLibraryBinding, ...]
    loaded_libraries: tuple[LoadedLibraryBinding, ...]
    abi: AbiObservation
    implementation_blockers: tuple[str, ...]
    runtime_conformance_authority: bool
    candidate_ready: bool
    execution_ready: bool
    execution_authority: bool
    replay_ready: bool
    replay_authority: bool
    publication_ready: bool
    publication_authority: bool
    scientific_preseal_authority: bool
    scientific_authority: bool
    independent_agreement: bool
    diagnostic_pass: bool
    semiclassical_stress_noise_lamp: bool
    semiclassical_constraint_algebra_lamp: bool
    theory_graph_promotion: bool
    physical_viability: bool
    propulsion: bool
    transport: bool

    def __post_init__(self) -> None:
        if (
            self.artifact_id != ARTIFACT_ID
            or self.contract_version != CONTRACT_VERSION
            or self.operation_inventory != SI_LEASE_OPERATION_INVENTORY
        ):
            raise ValueError("runtime lease receipt identity violated")
        fixed_true = (
            "calculation_only",
            "runtime_conformance_diagnostic_only",
            "safe_finite_number_predicate_exposed",
            "precision_256_verified_for_every_allocated_mpfr_object",
            "storage_nonalias_verified_for_every_allocated_mpfr_object",
            "reverse_object_clear_complete",
            "context_restored_exact",
            "flags_restored_exact",
            "runtime_unloaded_and_fds_closed",
            "lifecycle_complete",
        )
        fixed_false = (
            "runtime_conformance_authority",
            "semantic_si_operation_labels_bound",
            "candidate_ready",
            "execution_ready",
            "execution_authority",
            "replay_ready",
            "replay_authority",
            "publication_ready",
            "publication_authority",
            "scientific_preseal_authority",
            "scientific_authority",
            "independent_agreement",
            "diagnostic_pass",
            "semiclassical_stress_noise_lamp",
            "semiclassical_constraint_algebra_lamp",
            "theory_graph_promotion",
            "physical_viability",
            "propulsion",
            "transport",
        )
        if any(getattr(self, name) is not True for name in fixed_true):
            raise ValueError("runtime lease lifecycle lock violated")
        if any(getattr(self, name) is not False for name in fixed_false):
            raise ValueError("runtime lease authority lock violated")
        if self.synthetic_test_provider:
            if (
                self.provider_kind != "synthetic_test_only"
                or self.trusted_manifest_installed
                or self.trusted_manifest_sha256 is not None
                or self.trusted_manifest_size_bytes is not None
                or self.real_linux_glibc_integration_observed
            ):
                raise ValueError("synthetic lease cannot claim native manifest facts")
        elif not (
            self.provider_kind
            == "linux_x86_64_sealed_memfd_dlmopen_diagnostic/v1"
            and self.trusted_manifest_installed
            and self.trusted_manifest_sha256 is not None
            and self.trusted_manifest_size_bytes is not None
            and self.real_linux_glibc_integration_observed
        ):
            raise ValueError("native lease manifest facts missing")
        if (
            type(self.generation) is not int
            or self.generation <= 0
            or type(self.mpfr_object_count) is not int
            or self.mpfr_object_count < 0
            or type(self.mpz_object_count) is not int
            or self.mpz_object_count < 0
            or type(self.operation_trace) is not tuple
            or self.operations_issued_through_this_live_lease
            is not bool(self.operation_trace)
            or any(
                type(item) is not LeaseOperationObservation
                or item.ordinal != index
                or item.operation not in SI_LEASE_OPERATION_INVENTORY
                or item.rounding
                not in {None, "nearest_even", "upward", "downward"}
                or (
                    item.destination_ordinal is not None
                    and (
                        type(item.destination_ordinal) is not int
                        or item.destination_ordinal <= 0
                    )
                )
                or any(
                    type(ordinal) is not int or ordinal <= 0
                    for ordinal in item.source_ordinals
                )
                or type(item.source_ordinals) is not tuple
                or item.ternary_result not in {None, -1, 0, 1}
                or type(item.inexact_flag) is not bool
                or item.forbidden_flags_clear is not True
                for index, item in enumerate(self.operation_trace, start=1)
            )
            or self.operation_trace_sha256
            != _operation_trace_sha256(self.operation_trace)
            or any(
                type(value) is not int
                for value in (
                    self.expected_directed_rounded_operation_count,
                    self.expected_central_rndn_operation_count,
                    self.expected_terminal_get_d_count,
                    self.expected_total_rounded_operation_count,
                )
            )
            or self.expected_directed_rounded_operation_count
            != SI_EXPECTED_DIRECTED_ROUNDED_OPERATION_COUNT
            or self.expected_central_rndn_operation_count
            != SI_EXPECTED_CENTRAL_RNDN_OPERATION_COUNT
            or self.expected_terminal_get_d_count
            != SI_EXPECTED_TERMINAL_GET_D_COUNT
            or self.expected_total_rounded_operation_count
            != SI_EXPECTED_TOTAL_ROUNDED_OPERATION_COUNT
            or type(self.observed_rounded_operation_count) is not int
            or type(self.observed_terminal_get_d_count) is not int
            or self.observed_rounded_operation_count
            != sum(item.rounding is not None for item in self.operation_trace)
            or self.observed_terminal_get_d_count
            != sum(
                item.operation == "mpfr_get_d" for item in self.operation_trace
            )
        ):
            raise ValueError("runtime lease trace identity violated")
        expected_blockers = (
            SYNTHETIC_LEASE_BLOCKERS
            if self.synthetic_test_provider
            else NATIVE_LEASE_BLOCKERS
        )
        if self.implementation_blockers != expected_blockers:
            raise ValueError("runtime lease blocker inventory violated")


_LEASE_RECEIPT_IDENTITIES: dict[int, tuple[Any, str, str]] = {}


def _receipt_snapshot_projection(
    value: object, depth: int, nodes: list[int]
) -> object:
    if depth > MAX_RECEIPT_SNAPSHOT_DEPTH:
        _fail("runtime_lease_receipt_snapshot_depth_limit")
    nodes[0] += 1
    if nodes[0] > MAX_RECEIPT_SNAPSHOT_NODES:
        _fail("runtime_lease_receipt_snapshot_node_limit")
    if value is None or type(value) is bool:
        return value
    if type(value) is int:
        if value.bit_length() > 256:
            _fail("runtime_lease_receipt_snapshot_integer_limit")
        return value
    if type(value) is str:
        encoded = value.encode("utf-8", "strict")
        if len(encoded) > MAX_RECEIPT_SNAPSHOT_STRING_BYTES:
            _fail("runtime_lease_receipt_snapshot_string_limit")
        return value
    if type(value) is tuple:
        if len(value) > MAX_RECEIPT_SNAPSHOT_TUPLE_LENGTH:
            _fail("runtime_lease_receipt_snapshot_tuple_limit")
        return [
            _receipt_snapshot_projection(item, depth + 1, nodes)
            for item in value
        ]
    allowed_dataclasses = (
        _RuntimeLeaseReceipt,
        LeaseOperationObservation,
        CanaryObservation,
        SourceLibraryBinding,
        LoadedLibraryBinding,
        FileIdentity,
        ElfIdentity,
        AbiObservation,
    )
    if type(value) not in allowed_dataclasses:
        _fail("runtime_lease_receipt_snapshot_type_invalid")
    return {
        field.name: _receipt_snapshot_projection(
            getattr(value, field.name), depth + 1, nodes
        )
        for field in fields(value)
    }


def _receipt_snapshot(value: object) -> tuple[str, str]:
    if type(value) is not _RuntimeLeaseReceipt:
        _fail("runtime_lease_receipt_type_invalid")
    projection = _receipt_snapshot_projection(value, 0, [0])
    canonical = json.dumps(
        projection,
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=False,
    ).encode("ascii")
    if len(canonical) > MAX_RECEIPT_SNAPSHOT_BYTES:
        _fail("runtime_lease_receipt_snapshot_byte_limit")
    domain = b"nhm2-spherical-boson-star-v2/runtime-lease-receipt-snapshot/v2\n"
    fingerprint = hashlib.sha256(
        domain + struct.pack("<Q", len(canonical)) + canonical
    ).hexdigest()
    return canonical.decode("ascii"), fingerprint


def _mint_lease_receipt(
    receipt: _RuntimeLeaseReceipt,
) -> _RuntimeLeaseReceipt:
    canonical, fingerprint = _receipt_snapshot(receipt)
    receipt_id = id(receipt)
    existing = _LEASE_RECEIPT_IDENTITIES.get(receipt_id)
    if existing is not None and existing[0]() is not None:
        _fail("runtime_lease_receipt_identity_collision")

    def collected(reference: Any) -> None:
        current = _LEASE_RECEIPT_IDENTITIES.get(receipt_id)
        if current is not None and current[0] is reference:
            _LEASE_RECEIPT_IDENTITIES.pop(receipt_id, None)

    reference = weakref.ref(receipt, collected)
    _LEASE_RECEIPT_IDENTITIES[receipt_id] = (
        reference,
        canonical,
        fingerprint,
    )
    return receipt


def _validated_lease_receipt_snapshot(
    receipt: object,
) -> tuple[str, str]:
    if type(receipt) is not _RuntimeLeaseReceipt:
        _fail("runtime_lease_receipt_type_invalid")
    entry = _LEASE_RECEIPT_IDENTITIES.get(id(receipt))
    if entry is None or entry[0]() is not receipt:
        _fail("runtime_lease_receipt_not_minted")
    try:
        canonical, fingerprint = _receipt_snapshot(receipt)
    except BaseException as error:
        raise RuntimeConformanceError(
            "runtime_lease_receipt_integrity_invalid", _error_code(error)
        ) from error
    if canonical != entry[1] or fingerprint != entry[2]:
        _fail("runtime_lease_receipt_integrity_invalid")
    return entry[1], entry[2]


@dataclass(frozen=True, slots=True)
class _RuntimeConformanceReceipt:
    artifact_id: str
    contract_version: str
    provider_kind: str
    trusted_runtime_manifest_installed: bool
    trusted_runtime_manifest_binding: None
    real_linux_glibc_integration_observed: bool
    calculation_only: bool
    runtime_conformance_diagnostic_only: bool
    linux_native_runtime_diagnostic_observed: bool
    production_runtime_conformance_observed: bool
    synthetic_test_provider: bool
    source_inode_loaded_directly: bool
    exact_source_bytes_copied_to_sealed_memfds: bool
    exact_sealed_loaded_required_symbol_identity_observed: bool
    fresh_loader_namespace: bool
    gmp_loaded_before_mpfr: bool
    mpfr_required_gmp_symbol_inventory_resolved_from_exact_sealed_copy: bool
    consumer_arithmetic_bound_to_conformed_runtime: bool
    transitive_runtime_closure_bound: bool
    namespace_id: int
    mpfr_version: str
    gmp_version: str
    required_mpfr_symbols: tuple[str, ...]
    required_gmp_symbols: tuple[str, ...]
    source_libraries: tuple[SourceLibraryBinding, ...]
    loaded_libraries: tuple[LoadedLibraryBinding, ...]
    abi: AbiObservation
    context: ContextObservation
    implementation_blockers: tuple[str, ...]
    runtime_conformance_authority: bool
    candidate_ready: bool
    execution_ready: bool
    execution_authority: bool
    replay_ready: bool
    replay_authority: bool
    publication_ready: bool
    publication_authority: bool
    scientific_preseal_authority: bool
    scientific_authority: bool
    independent_agreement: bool
    diagnostic_pass: bool
    semiclassical_stress_noise_lamp: bool
    semiclassical_constraint_algebra_lamp: bool
    theory_graph_promotion: bool
    physical_viability: bool
    propulsion: bool
    transport: bool

    def __post_init__(self) -> None:
        fixed_true = (
            "calculation_only",
            "runtime_conformance_diagnostic_only",
            "synthetic_test_provider",
        )
        fixed_false = (
            "trusted_runtime_manifest_installed",
            "real_linux_glibc_integration_observed",
            "linux_native_runtime_diagnostic_observed",
            "production_runtime_conformance_observed",
            "source_inode_loaded_directly",
            "exact_source_bytes_copied_to_sealed_memfds",
            "exact_sealed_loaded_required_symbol_identity_observed",
            "fresh_loader_namespace",
            "gmp_loaded_before_mpfr",
            "mpfr_required_gmp_symbol_inventory_resolved_from_exact_sealed_copy",
            "consumer_arithmetic_bound_to_conformed_runtime",
            "transitive_runtime_closure_bound",
            "runtime_conformance_authority",
            "candidate_ready",
            "execution_ready",
            "execution_authority",
            "replay_ready",
            "replay_authority",
            "publication_ready",
            "publication_authority",
            "scientific_preseal_authority",
            "scientific_authority",
            "independent_agreement",
            "diagnostic_pass",
            "semiclassical_stress_noise_lamp",
            "semiclassical_constraint_algebra_lamp",
            "theory_graph_promotion",
            "physical_viability",
            "propulsion",
            "transport",
        )
        if self.provider_kind != "synthetic_test_only":
            raise ValueError("runtime receipt provider must remain synthetic")
        if (
            self.artifact_id != ARTIFACT_ID
            or self.contract_version != CONTRACT_VERSION
        ):
            raise ValueError("runtime receipt contract identity violated")
        if self.trusted_runtime_manifest_binding is not None:
            raise ValueError("runtime manifest binding must remain absent")
        if any(getattr(self, name) is not True for name in fixed_true):
            raise ValueError("runtime receipt diagnostic lock violated")
        if any(getattr(self, name) is not False for name in fixed_false):
            raise ValueError("runtime receipt authority lock violated")
        if tuple(self.implementation_blockers) != (
            "synthetic_test_provider_not_production_conformance",
        ) + AUTHORITY_BLOCKERS:
            raise ValueError("runtime receipt blocker inventory violated")
        if (
            self.mpfr_version != EXPECTED_MPFR_VERSION
            or self.gmp_version != EXPECTED_GMP_VERSION
            or self.required_mpfr_symbols != REQUIRED_MPFR_SYMBOLS
            or self.required_gmp_symbols != REQUIRED_GMP_SYMBOLS
            or self.namespace_id <= 0
        ):
            raise ValueError("runtime receipt diagnostic identity violated")


@dataclass(frozen=True, slots=True)
class _ProviderEvidence:
    provider_kind: str
    native_provider_mechanics_observed: bool
    namespace_id: int
    source_libraries: tuple[SourceLibraryBinding, ...]
    loaded_libraries: tuple[LoadedLibraryBinding, ...]
    mpfr_version: str
    gmp_version: str
    resolved_mpfr_symbols: tuple[str, ...]
    resolved_gmp_symbols: tuple[str, ...]
    abi: AbiObservation
    required_gmp_dependency_inventory_exact: bool
    api: Any


def _provider_evidence_without_api(
    evidence: _ProviderEvidence,
) -> _ProviderEvidence:
    return _ProviderEvidence(
        provider_kind=evidence.provider_kind,
        native_provider_mechanics_observed=(
            evidence.native_provider_mechanics_observed
        ),
        namespace_id=evidence.namespace_id,
        source_libraries=evidence.source_libraries,
        loaded_libraries=evidence.loaded_libraries,
        mpfr_version=evidence.mpfr_version,
        gmp_version=evidence.gmp_version,
        resolved_mpfr_symbols=evidence.resolved_mpfr_symbols,
        resolved_gmp_symbols=evidence.resolved_gmp_symbols,
        abi=evidence.abi,
        required_gmp_dependency_inventory_exact=(
            evidence.required_gmp_dependency_inventory_exact
        ),
        api=None,
    )


@dataclass(frozen=True, slots=True)
class _ContextSnapshot:
    emin: int
    emax: int
    rounding: int
    flags: int


@dataclass(frozen=True, slots=True)
class _Recovery:
    complete: bool
    unresolved: tuple[str, ...]
    observed_failures: tuple[str, ...]


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


class _LinkMap(ctypes.Structure):
    pass


_LinkMap._fields_ = (
    ("l_addr", ctypes.c_void_p),
    ("l_name", ctypes.c_char_p),
    ("l_ld", ctypes.c_void_p),
    ("l_next", ctypes.POINTER(_LinkMap)),
    ("l_prev", ctypes.POINTER(_LinkMap)),
)


class _DlInfo(ctypes.Structure):
    _fields_ = (
        ("dli_fname", ctypes.c_char_p),
        ("dli_fbase", ctypes.c_void_p),
        ("dli_sname", ctypes.c_char_p),
        ("dli_saddr", ctypes.c_void_p),
    )


def _bounded_text(value: object, limit: int) -> str:
    if type(value) is not str:
        return type(value).__name__[:limit]
    encoded = value.encode("ascii", "backslashreplace")
    return encoded[:limit].decode("ascii", "strict")


def _fail(code: str, detail: str | None = None) -> NoReturn:
    raise RuntimeConformanceError(code, detail)


def _host_is_linux_x86_64() -> bool:
    return (
        sys.platform == "linux"
        and os.name == "posix"
        and platform.machine() == "x86_64"
        and sys.byteorder == "little"
        and struct.calcsize("P") == 8
        and ctypes.sizeof(ctypes.c_void_p) == 8
        and ctypes.sizeof(ctypes.c_long) == 8
        and ctypes.sizeof(ctypes.c_ulong) == 8
        and ctypes.sizeof(ctypes.c_int) == 4
    )


def _require_linux_x86_64() -> None:
    if not _host_is_linux_x86_64():
        _fail("linux_x86_64_runtime_required")


def _path_segments(value: object) -> tuple[str, ...]:
    if (
        type(value) is not str
        or not value.startswith("/")
        or value.startswith("//")
        or value.endswith("/")
        or len(value) > MAX_PATH_CODEPOINTS
        or "\x00" in value
    ):
        _fail("runtime_library_path_invalid")
    if any(ord(character) < 0x20 or ord(character) > 0x7E for character in value):
        _fail("runtime_library_path_invalid")
    segments = tuple(value[1:].split("/"))
    if not segments or any(segment in {"", ".", ".."} for segment in segments):
        _fail("runtime_library_path_invalid")
    return segments


def _require_expectation(
    value: object, expected_component: str
) -> _RuntimeLibraryExpectation:
    if type(value) is not _RuntimeLibraryExpectation:
        _fail("runtime_library_expectation_type_invalid", expected_component)
    if value.component != expected_component:
        _fail("runtime_library_component_invalid", expected_component)
    _path_segments(value.absolute_path)
    if (
        type(value.size_bytes) is not int
        or not 1 <= value.size_bytes <= MAX_LIBRARY_SIZE_BYTES
    ):
        _fail("runtime_library_size_expectation_invalid", expected_component)
    if type(value.sha256) is not str or _SHA256_RE.fullmatch(value.sha256) is None:
        _fail("runtime_library_sha256_expectation_invalid", expected_component)
    return value


def _require_request(value: object) -> _RuntimeConformanceRequest:
    if type(value) is not _RuntimeConformanceRequest:
        _fail("runtime_conformance_request_type_invalid")
    gmp = _require_expectation(value.gmp, "gmp")
    mpfr = _require_expectation(value.mpfr, "mpfr")
    if gmp.absolute_path == mpfr.absolute_path or gmp.sha256 == mpfr.sha256:
        _fail("runtime_library_pair_identity_not_distinct")
    return _RuntimeConformanceRequest(gmp=gmp, mpfr=mpfr)


def _manifest_unsigned_bytes(manifest: _TrustedRuntimeManifestV1) -> bytes:
    payload = {
        "artifactId": manifest.artifact_id,
        "byteOrder": manifest.byte_order,
        "cIntBits": manifest.c_int_bits,
        "cLongBits": manifest.c_long_bits,
        "cUlongBits": manifest.c_ulong_bits,
        "contractVersion": manifest.contract_version,
        "externalInstallerAllowed": manifest.external_installer_allowed,
        "gmp": {
            "absolutePath": manifest.gmp.absolute_path,
            "component": manifest.gmp.component,
            "sha256": manifest.gmp.sha256,
            "sizeBytes": manifest.gmp.size_bytes,
        },
        "gmpSoname": manifest.gmp_soname,
        "gmpVersion": manifest.gmp_version,
        "machine": manifest.machine,
        "mpfr": {
            "absolutePath": manifest.mpfr.absolute_path,
            "component": manifest.mpfr.component,
            "sha256": manifest.mpfr.sha256,
            "sizeBytes": manifest.mpfr.size_bytes,
        },
        "mpfrSoname": manifest.mpfr_soname,
        "mpfrVersion": manifest.mpfr_version,
        "nonCallerControlledLiteral": manifest.non_caller_controlled_literal,
        "platformSystem": manifest.platform_system,
        "pointerBits": manifest.pointer_bits,
        "requiredGmpSymbols": manifest.required_gmp_symbols,
        "requiredMpfrSymbols": manifest.required_mpfr_symbols,
    }
    return json.dumps(
        payload,
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("ascii")


def _require_trusted_manifest(
    value: object,
) -> _TrustedRuntimeManifestV1:
    if type(value) is not _TrustedRuntimeManifestV1:
        _fail("trusted_runtime_manifest_type_invalid")
    if (
        value.artifact_id
        != "nhm2.spherical_boson_star_v2.mpfr256_trusted_runtime_manifest"
        or value.contract_version
        != "nhm2_spherical_boson_star_v2_mpfr256_trusted_runtime_manifest/v1"
        or value.platform_system != "Linux"
        or value.machine != "x86_64"
        or value.byte_order != "little_endian"
        or (value.pointer_bits, value.c_long_bits, value.c_int_bits, value.c_ulong_bits)
        != (64, 64, 32, 64)
        or value.mpfr_version != EXPECTED_MPFR_VERSION
        or value.gmp_version != EXPECTED_GMP_VERSION
        or value.mpfr_soname != EXPECTED_MPFR_SONAME
        or value.gmp_soname != EXPECTED_GMP_SONAME
        or value.required_mpfr_symbols != REQUIRED_MPFR_SYMBOLS
        or value.required_gmp_symbols != REQUIRED_GMP_SYMBOLS
        or value.non_caller_controlled_literal is not True
        or value.external_installer_allowed is not False
    ):
        _fail("trusted_runtime_manifest_semantic_invalid")
    request = _require_request(
        _RuntimeConformanceRequest(gmp=value.gmp, mpfr=value.mpfr)
    )
    unsigned = _manifest_unsigned_bytes(value)
    domain = b"nhm2-spherical-boson-star-v2/trusted-runtime-manifest/v1\n"
    observed = hashlib.sha256(
        domain + struct.pack("<Q", len(unsigned)) + unsigned
    ).hexdigest()
    if (
        value.canonical_size_bytes != len(unsigned)
        or _SHA256_RE.fullmatch(value.manifest_sha256) is None
        or value.manifest_sha256 != observed
    ):
        _fail("trusted_runtime_manifest_self_binding_invalid")
    if request.gmp != value.gmp or request.mpfr != value.mpfr:
        _fail("trusted_runtime_manifest_request_binding_invalid")
    return value


def _identity(metadata: os.stat_result) -> FileIdentity:
    return FileIdentity(
        device=int(metadata.st_dev),
        inode=int(metadata.st_ino),
        mode=int(metadata.st_mode),
        link_count=int(metadata.st_nlink),
        size_bytes=int(metadata.st_size),
        mtime_ns=int(metadata.st_mtime_ns),
        ctime_ns=int(metadata.st_ctime_ns),
    )


def _same_identity(left: FileIdentity, right: FileIdentity) -> bool:
    return left == right


def _validate_source_identity(
    component: str,
    before: FileIdentity,
    after: FileIdentity,
    *,
    symlink_observed: bool,
) -> None:
    if symlink_observed:
        _fail("runtime_library_symlink_forbidden", component)
    if not stat.S_ISREG(before.mode):
        _fail("runtime_library_regular_file_required", component)
    if before.link_count != 1:
        _fail("runtime_library_single_link_required", component)
    if not _same_identity(before, after):
        _fail("runtime_library_stat_drift", component)


def _hash_fd(fd: int, size_bytes: int, component: str) -> str:
    digest = hashlib.sha256()
    offset = 0
    while offset < size_bytes:
        requested = min(READ_CHUNK_BYTES, size_bytes - offset)
        try:
            block = os.pread(fd, requested, offset)
        except OSError as error:
            _fail("runtime_library_read_failed", f"{component}:{error.errno}")
        if not block:
            _fail("runtime_library_short_read", component)
        digest.update(block)
        offset += len(block)
    try:
        extra = os.pread(fd, 1, size_bytes)
    except OSError as error:
        _fail("runtime_library_read_failed", f"{component}:{error.errno}")
    if extra:
        _fail("runtime_library_size_drift", component)
    return digest.hexdigest()


def _pread_exact(fd: int, length: int, offset: int, code: str) -> bytes:
    if length < 0 or offset < 0:
        _fail(code)
    output = bytearray()
    while len(output) < length:
        block = os.pread(fd, length - len(output), offset + len(output))
        if not block:
            _fail(code)
        output.extend(block)
    return bytes(output)


def _elf_string(table: bytes, offset: int, component: str) -> str:
    if not 0 <= offset < len(table):
        _fail("runtime_elf_dynamic_string_offset_invalid", component)
    end = table.find(b"\x00", offset)
    if end < 0 or end - offset > 255:
        _fail("runtime_elf_dynamic_string_invalid", component)
    try:
        value = table[offset:end].decode("ascii", "strict")
    except UnicodeDecodeError:
        _fail("runtime_elf_dynamic_string_invalid", component)
    if not value or "/" in value or "\x00" in value:
        _fail("runtime_elf_dynamic_string_invalid", component)
    return value


def _parse_elf_identity(fd: int, size_bytes: int, component: str) -> ElfIdentity:
    if size_bytes < 64:
        _fail("runtime_elf_header_invalid", component)
    header = _pread_exact(fd, 64, 0, "runtime_elf_header_invalid")
    unpacked = struct.unpack("<16sHHIQQQIHHHHHH", header)
    ident = unpacked[0]
    if (
        ident[:4] != b"\x7fELF"
        or ident[4] != 2
        or ident[5] != 1
        or ident[6] != 1
        or unpacked[1] != 3
        or unpacked[2] != 62
        or unpacked[3] != 1
        or unpacked[8] != 64
        or unpacked[9] != 56
    ):
        _fail("runtime_elf_abi_invalid", component)
    program_offset = int(unpacked[5])
    program_count = int(unpacked[10])
    if not 1 <= program_count <= MAX_ELF_PROGRAM_HEADERS:
        _fail("runtime_elf_program_header_count_invalid", component)
    table_size = program_count * 56
    if program_offset > size_bytes - table_size:
        _fail("runtime_elf_program_header_range_invalid", component)
    raw_programs = _pread_exact(
        fd, table_size, program_offset, "runtime_elf_program_header_read_failed"
    )
    load_segments: list[tuple[int, int, int]] = []
    dynamic_segment: tuple[int, int] | None = None
    for ordinal in range(program_count):
        values = struct.unpack_from("<IIQQQQQQ", raw_programs, ordinal * 56)
        kind, offset, virtual, file_size = values[0], values[2], values[3], values[5]
        if offset > size_bytes or file_size > size_bytes - offset:
            _fail("runtime_elf_segment_range_invalid", component)
        if kind == 1:
            load_segments.append((virtual, file_size, offset))
        elif kind == 2:
            if dynamic_segment is not None:
                _fail("runtime_elf_dynamic_segment_ambiguous", component)
            dynamic_segment = (offset, file_size)
    if dynamic_segment is None or not load_segments:
        _fail("runtime_elf_dynamic_segment_missing", component)
    dynamic_offset, dynamic_size = dynamic_segment
    if dynamic_size % 16 != 0 or dynamic_size // 16 > MAX_DYNAMIC_ENTRIES:
        _fail("runtime_elf_dynamic_segment_invalid", component)
    raw_dynamic = _pread_exact(
        fd, dynamic_size, dynamic_offset, "runtime_elf_dynamic_segment_read_failed"
    )
    string_address: int | None = None
    string_size: int | None = None
    soname_offset: int | None = None
    needed_offsets: list[int] = []
    terminal_seen = False
    for ordinal in range(dynamic_size // 16):
        tag, value = struct.unpack_from("<qQ", raw_dynamic, ordinal * 16)
        if tag == 0:
            terminal_seen = True
            break
        if tag == 5:
            if string_address is not None:
                _fail("runtime_elf_string_table_ambiguous", component)
            string_address = int(value)
        elif tag == 10:
            if string_size is not None:
                _fail("runtime_elf_string_table_ambiguous", component)
            string_size = int(value)
        elif tag == 14:
            if soname_offset is not None:
                _fail("runtime_elf_soname_ambiguous", component)
            soname_offset = int(value)
        elif tag == 1:
            if int(value) in needed_offsets:
                _fail("runtime_elf_needed_inventory_duplicated", component)
            needed_offsets.append(int(value))
            if len(needed_offsets) > MAX_DYNAMIC_STRINGS:
                _fail("runtime_elf_needed_inventory_limit", component)
    if not terminal_seen:
        _fail("runtime_elf_dynamic_terminator_missing", component)
    if (
        string_address is None
        or string_size is None
        or soname_offset is None
        or not 1 <= string_size <= MAX_DYNAMIC_STRING_TABLE_BYTES
    ):
        _fail("runtime_elf_string_table_missing", component)
    string_offset: int | None = None
    for virtual, file_size, offset in load_segments:
        if (
            virtual <= string_address
            and string_address + string_size <= virtual + file_size
        ):
            candidate = offset + (string_address - virtual)
            if candidate <= size_bytes - string_size:
                string_offset = candidate
                break
    if string_offset is None:
        _fail("runtime_elf_string_table_range_invalid", component)
    strings = _pread_exact(
        fd, string_size, string_offset, "runtime_elf_string_table_read_failed"
    )
    soname = _elf_string(strings, soname_offset, component)
    needed = tuple(_elf_string(strings, item, component) for item in needed_offsets)
    expected_soname = (
        EXPECTED_GMP_SONAME if component == "gmp" else EXPECTED_MPFR_SONAME
    )
    if soname != expected_soname:
        _fail("runtime_library_soname_mismatch", component)
    if component == "mpfr":
        if needed.count(EXPECTED_GMP_SONAME) != 1:
            _fail("runtime_mpfr_gmp_dependency_inventory_invalid")
    elif any("mpfr" in item.lower() for item in needed):
        _fail("runtime_gmp_dependency_inventory_invalid")
    return ElfIdentity(
        elf_class="ELF64",
        byte_order="little_endian",
        object_type="ET_DYN",
        machine="EM_X86_64",
        soname=soname,
        needed=needed,
    )


def _decode_map_path(value: str) -> str:
    return _MAP_ESCAPE_RE.sub(lambda match: chr(int(match.group(1), 8)), value)


def _map_for_address(address: int) -> tuple[int, int, str]:
    for start, end, device, inode, path in _map_entries():
        if start <= address < end:
            return device, inode, path
    _fail("runtime_loader_symbol_map_missing")


def _parse_map_entries(
    raw: bytes,
) -> tuple[tuple[int, int, int, int, str], ...]:
    try:
        text = raw.decode("ascii", "backslashreplace")
    except UnicodeError:
        _fail("runtime_loader_maps_encoding_invalid")
    entries: list[tuple[int, int, int, int, str]] = []
    for line in text.splitlines():
        if not line:
            continue
        match = _MAP_LINE_RE.fullmatch(line)
        if match is None:
            _fail("runtime_loader_maps_line_invalid")
        start = int(match.group("start"), 16)
        end = int(match.group("end"), 16)
        device = os.makedev(
            int(match.group("major"), 16), int(match.group("minor"), 16)
        )
        path = _decode_map_path(match.group("path") or "")
        entries.append((start, end, device, int(match.group("inode")), path))
    return tuple(entries)


def _map_entries() -> tuple[tuple[int, int, int, int, str], ...]:
    try:
        fd = os.open("/proc/self/maps", os.O_RDONLY | os.O_CLOEXEC)
    except OSError as error:
        _fail("runtime_loader_maps_unavailable", str(error.errno))
    chunks: list[bytes] = []
    primary: BaseException | None = None
    try:
        total = 0
        while True:
            block = os.read(
                fd,
                min(READ_CHUNK_BYTES, MAX_LOADER_MAP_BYTES - total + 1),
            )
            if not block:
                break
            total += len(block)
            if total > MAX_LOADER_MAP_BYTES:
                _fail("runtime_loader_maps_limit")
            chunks.append(block)
    except BaseException as error:
        primary = error
    cleanup: tuple[str, ...] = ()
    try:
        os.close(fd)
    except BaseException:
        cleanup = ("runtime_loader_maps_fd_close_failed",)
    if cleanup:
        _poison(cleanup)
        raise RuntimeConformanceError(
            "runtime_loader_maps_cleanup_failed",
            _error_code(primary) if primary is not None else None,
            cleanup,
        ) from primary
    if primary is not None:
        raise primary
    return _parse_map_entries(b"".join(chunks))


def _mapped_identity_present(identity: FileIdentity) -> bool:
    return any(
        device == identity.device and inode == identity.inode
        for _start, _end, device, inode, _path in _map_entries()
    )


def _poison(reasons: tuple[str, ...]) -> None:
    global _CONTEXT_POISONED, _CONTEXT_POISON_REASONS
    bounded = tuple(dict.fromkeys(_bounded_text(item, 128) for item in reasons))[:12]
    _CONTEXT_POISONED = True
    _CONTEXT_POISON_REASONS = bounded or ("runtime_recovery_unverified",)


def _error_code(error: BaseException) -> str:
    if isinstance(error, RuntimeConformanceError):
        return error.code
    return _bounded_text(type(error).__name__, 64)


class _HeldSource:
    __slots__ = (
        "component",
        "expectation",
        "fd",
        "directory_fds",
        "identity",
        "first_hash",
        "second_hash",
        "after_load_hash",
        "elf",
    )

    def __init__(
        self,
        component: str,
        expectation: _RuntimeLibraryExpectation,
        fd: int,
        directory_fds: list[int],
        identity: FileIdentity,
    ) -> None:
        self.component = component
        self.expectation = expectation
        self.fd = fd
        self.directory_fds = directory_fds
        self.identity = identity
        self.first_hash = ""
        self.second_hash = ""
        self.after_load_hash = ""
        self.elf: ElfIdentity | None = None

    def close(self) -> tuple[str, ...]:
        issues: list[str] = []
        if self.fd >= 0:
            try:
                os.close(self.fd)
            except OSError:
                issues.append(f"{self.component}_source_fd_close_failed")
            self.fd = -1
        for descriptor in reversed(self.directory_fds):
            try:
                os.close(descriptor)
            except OSError:
                issues.append(f"{self.component}_directory_fd_close_failed")
        self.directory_fds.clear()
        return tuple(dict.fromkeys(issues))

    def binding(self) -> SourceLibraryBinding:
        if (
            self.elf is None
            or not self.first_hash
            or not self.second_hash
            or not self.after_load_hash
        ):
            _fail("runtime_source_binding_incomplete", self.component)
        return SourceLibraryBinding(
            component=self.component,
            canonical_path=self.expectation.absolute_path,
            identity=self.identity,
            sha256_first_pass=self.first_hash,
            sha256_second_pass=self.second_hash,
            sha256_after_load=self.after_load_hash,
            elf=self.elf,
            nofollow_segment_traversal=True,
            single_link_regular_file=True,
            source_inode_loaded_directly=False,
        )


class _SealedCopy:
    __slots__ = (
        "component",
        "fd",
        "name",
        "identity",
        "sha256",
        "seal_mask",
        "required_seal_mask",
    )

    def __init__(
        self,
        component: str,
        fd: int,
        name: str,
        identity: FileIdentity,
        sha256: str,
        seal_mask: int,
        required_seal_mask: int,
    ) -> None:
        self.component = component
        self.fd = fd
        self.name = name
        self.identity = identity
        self.sha256 = sha256
        self.seal_mask = seal_mask
        self.required_seal_mask = required_seal_mask

    @property
    def procfd_path(self) -> str:
        return f"/proc/self/fd/{self.fd}"

    @property
    def maps_path(self) -> str:
        return f"/memfd:{self.name} (deleted)"

    def close(self) -> tuple[str, ...]:
        if self.fd < 0:
            return ()
        try:
            os.close(self.fd)
        except OSError:
            self.fd = -1
            return (f"{self.component}_sealed_fd_close_failed",)
        self.fd = -1
        return ()


def _open_source(expectation: _RuntimeLibraryExpectation) -> _HeldSource:
    component = expectation.component
    segments = _path_segments(expectation.absolute_path)
    required_flags = ("O_CLOEXEC", "O_DIRECTORY", "O_NOFOLLOW", "O_PATH")
    if any(not hasattr(os, name) for name in required_flags):
        _fail("linux_nofollow_open_primitives_unavailable")
    directory_flags = os.O_RDONLY | os.O_CLOEXEC | os.O_DIRECTORY | os.O_NOFOLLOW
    probe_flags = os.O_PATH | os.O_CLOEXEC | os.O_NOFOLLOW
    source_flags = os.O_RDONLY | os.O_CLOEXEC
    if hasattr(os, "O_NONBLOCK"):
        source_flags |= os.O_NONBLOCK
    directory_fds: list[int] = []
    source_fd = -1
    try:
        current_fd = os.open("/", directory_flags)
        directory_fds.append(current_fd)
        for index, segment in enumerate(segments[:-1]):
            try:
                before = os.stat(segment, dir_fd=current_fd, follow_symlinks=False)
            except OSError as error:
                _fail(
                    "runtime_library_directory_traversal_failed",
                    f"{component}:{index}:{error.errno}",
                )
            if stat.S_ISLNK(before.st_mode):
                _fail("runtime_library_directory_symlink_forbidden", component)
            if not stat.S_ISDIR(before.st_mode):
                _fail("runtime_library_directory_required", component)
            try:
                opened = os.open(segment, directory_flags, dir_fd=current_fd)
            except OSError as error:
                _fail(
                    "runtime_library_directory_open_failed",
                    f"{component}:{index}:{error.errno}",
                )
            directory_fds.append(opened)
            after = os.fstat(opened)
            if _identity(before) != _identity(after):
                _fail("runtime_library_directory_stat_drift", component)
            current_fd = opened
        final_name = segments[-1]
        try:
            before_raw = os.stat(
                final_name, dir_fd=current_fd, follow_symlinks=False
            )
        except OSError as error:
            _fail(
                "runtime_library_lstat_failed", f"{component}:{error.errno}"
            )
        before = _identity(before_raw)
        if stat.S_ISLNK(before.mode):
            _fail("runtime_library_symlink_forbidden", component)
        try:
            probe_fd = os.open(final_name, probe_flags, dir_fd=current_fd)
        except OSError as error:
            _fail("runtime_library_open_failed", f"{component}:{error.errno}")
        directory_fds.append(probe_fd)
        probed = _identity(os.fstat(probe_fd))
        _validate_source_identity(
            component, before, probed, symlink_observed=stat.S_ISLNK(probed.mode)
        )
        try:
            source_fd = os.open(f"/proc/self/fd/{probe_fd}", source_flags)
        except OSError as error:
            _fail("runtime_library_read_open_failed", f"{component}:{error.errno}")
        after = _identity(os.fstat(source_fd))
        _validate_source_identity(component, probed, after, symlink_observed=False)
        if after.size_bytes != expectation.size_bytes:
            _fail("runtime_library_size_mismatch", component)
        procfd = f"/proc/self/fd/{source_fd}"
        try:
            observed_path = os.readlink(procfd)
        except OSError as error:
            _fail(
                "runtime_library_procfd_identity_unavailable",
                f"{component}:{error.errno}",
            )
        if observed_path != expectation.absolute_path:
            _fail("runtime_library_canonical_path_mismatch", component)
        return _HeldSource(
            component,
            expectation,
            source_fd,
            directory_fds,
            after,
        )
    except BaseException as error:
        cleanup: list[str] = []
        if source_fd >= 0:
            try:
                os.close(source_fd)
            except BaseException:
                cleanup.append(f"{component}_source_fd_close_failed")
        for descriptor in reversed(directory_fds):
            try:
                os.close(descriptor)
            except BaseException:
                cleanup.append(f"{component}_directory_fd_close_failed")
        cleanup = list(dict.fromkeys(cleanup))
        if cleanup:
            _poison(tuple(cleanup))
            raise RuntimeConformanceError(
                "runtime_source_acquisition_cleanup_failed",
                _error_code(error),
                tuple(cleanup),
            ) from error
        raise


def _copy_and_seal(source: _HeldSource) -> _SealedCopy:
    if not hasattr(os, "memfd_create"):
        _fail("linux_memfd_create_unavailable")
    try:
        fcntl = importlib.import_module("fcntl")
    except ImportError:
        _fail("linux_memfd_sealing_unavailable")
    required_constants = (
        "F_ADD_SEALS",
        "F_GET_SEALS",
        "F_SEAL_WRITE",
        "F_SEAL_GROW",
        "F_SEAL_SHRINK",
        "F_SEAL_SEAL",
    )
    if any(not hasattr(fcntl, name) for name in required_constants):
        _fail("linux_memfd_sealing_unavailable")
    if not hasattr(os, "MFD_ALLOW_SEALING") or not hasattr(os, "MFD_CLOEXEC"):
        _fail("linux_memfd_sealing_flags_unavailable")
    name = f"nhm2-spherical-v2-{source.component}-sealed-v1"
    flags = os.MFD_ALLOW_SEALING | os.MFD_CLOEXEC
    try:
        sealed_fd = os.memfd_create(name, flags)
    except OSError as error:
        _fail("linux_memfd_create_failed", f"{source.component}:{error.errno}")
    try:
        before = _identity(os.fstat(source.fd))
        _validate_source_identity(
            source.component, source.identity, before, symlink_observed=False
        )
        digest = hashlib.sha256()
        offset = 0
        while offset < source.identity.size_bytes:
            requested = min(
                READ_CHUNK_BYTES, source.identity.size_bytes - offset
            )
            block = os.pread(source.fd, requested, offset)
            if not block:
                _fail("runtime_library_short_read", source.component)
            digest.update(block)
            written = 0
            while written < len(block):
                count = os.pwrite(sealed_fd, block[written:], offset + written)
                if count <= 0:
                    _fail("runtime_sealed_copy_short_write", source.component)
                written += count
            offset += len(block)
        source.first_hash = digest.hexdigest()
        after_copy = _identity(os.fstat(source.fd))
        _validate_source_identity(
            source.component,
            source.identity,
            after_copy,
            symlink_observed=False,
        )
        source.second_hash = _hash_fd(
            source.fd, source.identity.size_bytes, source.component
        )
        after_second_hash = _identity(os.fstat(source.fd))
        _validate_source_identity(
            source.component,
            source.identity,
            after_second_hash,
            symlink_observed=False,
        )
        if (
            source.first_hash != source.expectation.sha256
            or source.second_hash != source.expectation.sha256
        ):
            _fail("runtime_library_sha256_mismatch", source.component)
        sealed_before = _identity(os.fstat(sealed_fd))
        if (
            not stat.S_ISREG(sealed_before.mode)
            or sealed_before.size_bytes != source.identity.size_bytes
        ):
            _fail("runtime_sealed_copy_identity_invalid", source.component)
        sealed_hash = _hash_fd(
            sealed_fd, sealed_before.size_bytes, source.component + "_sealed"
        )
        if sealed_hash != source.expectation.sha256:
            _fail("runtime_sealed_copy_sha256_mismatch", source.component)
        source.elf = _parse_elf_identity(
            sealed_fd, sealed_before.size_bytes, source.component
        )
        required_seals = (
            int(fcntl.F_SEAL_WRITE)
            | int(fcntl.F_SEAL_GROW)
            | int(fcntl.F_SEAL_SHRINK)
            | int(fcntl.F_SEAL_SEAL)
        )
        try:
            fcntl.fcntl(sealed_fd, fcntl.F_ADD_SEALS, required_seals)
            observed_seals = int(fcntl.fcntl(sealed_fd, fcntl.F_GET_SEALS))
        except OSError as error:
            _fail("runtime_sealed_copy_seal_failed", str(error.errno))
        if observed_seals != required_seals:
            _fail("runtime_sealed_copy_seal_mask_mismatch", source.component)
        sealed_after = _identity(os.fstat(sealed_fd))
        if sealed_after != sealed_before:
            _fail("runtime_sealed_copy_stat_drift", source.component)
        if (
            _hash_fd(sealed_fd, sealed_after.size_bytes, source.component + "_sealed")
            != sealed_hash
        ):
            _fail("runtime_sealed_copy_postseal_hash_mismatch", source.component)
        return _SealedCopy(
            source.component,
            sealed_fd,
            name,
            sealed_after,
            sealed_hash,
            observed_seals,
            required_seals,
        )
    except BaseException as error:
        cleanup: tuple[str, ...] = ()
        try:
            os.close(sealed_fd)
        except BaseException:
            cleanup = (f"{source.component}_sealed_fd_close_failed",)
        if cleanup:
            _poison(cleanup)
            raise RuntimeConformanceError(
                "runtime_sealed_copy_cleanup_failed",
                _error_code(error),
                cleanup,
            ) from error
        raise


class _DynamicLoader:
    RTLD_NOW = 2
    RTLD_LOCAL = 0
    RTLD_DI_LMID = 1
    RTLD_DI_LINKMAP = 2
    LM_ID_NEWLM = -1

    def __init__(self) -> None:
        try:
            self.lib = ctypes.CDLL(None, use_errno=True)
            for name in ("dlerror", "dlmopen", "dlinfo", "dlsym", "dladdr", "dlclose"):
                getattr(self.lib, name)
        except (AttributeError, OSError) as error:
            _fail("linux_host_loader_api_unavailable", _bounded_text(str(error), 128))
        self.lib.dlerror.argtypes = ()
        self.lib.dlerror.restype = ctypes.c_char_p
        self.lib.dlmopen.argtypes = (ctypes.c_long, ctypes.c_char_p, ctypes.c_int)
        self.lib.dlmopen.restype = ctypes.c_void_p
        self.lib.dlinfo.argtypes = (ctypes.c_void_p, ctypes.c_int, ctypes.c_void_p)
        self.lib.dlinfo.restype = ctypes.c_int
        self.lib.dlsym.argtypes = (ctypes.c_void_p, ctypes.c_char_p)
        self.lib.dlsym.restype = ctypes.c_void_p
        self.lib.dladdr.argtypes = (ctypes.c_void_p, ctypes.POINTER(_DlInfo))
        self.lib.dladdr.restype = ctypes.c_int
        self.lib.dlclose.argtypes = (ctypes.c_void_p,)
        self.lib.dlclose.restype = ctypes.c_int

    def _error(self) -> str:
        raw = self.lib.dlerror()
        if raw is None:
            return "loader_error_unavailable"
        return _bounded_text(raw.decode("ascii", "backslashreplace"), 192)

    def open(self, namespace_id: int, path: str, component: str) -> int:
        self.lib.dlerror()
        handle = self.lib.dlmopen(
            ctypes.c_long(namespace_id), path.encode("ascii"), self.RTLD_NOW
        )
        error = self.lib.dlerror()
        if not handle or error is not None:
            detail = (
                error.decode("ascii", "backslashreplace")
                if error is not None
                else "null_handle"
            )
            _fail("runtime_loader_dlmopen_failed", f"{component}:{detail}")
        return int(handle)

    def namespace_id(self, handle: int, component: str) -> int:
        value = ctypes.c_long()
        if self.lib.dlinfo(
            ctypes.c_void_p(handle), self.RTLD_DI_LMID, ctypes.byref(value)
        ) != 0:
            _fail("runtime_loader_namespace_query_failed", component)
        return int(value.value)

    def link_map(self, handle: int, component: str) -> _LinkMap:
        pointer = ctypes.POINTER(_LinkMap)()
        if self.lib.dlinfo(
            ctypes.c_void_p(handle), self.RTLD_DI_LINKMAP, ctypes.byref(pointer)
        ) != 0 or not pointer:
            _fail("runtime_loader_link_map_query_failed", component)
        return pointer.contents

    def link_map_names(self, handle: int) -> tuple[str, ...]:
        pointer = ctypes.POINTER(_LinkMap)()
        if self.lib.dlinfo(
            ctypes.c_void_p(handle), self.RTLD_DI_LINKMAP, ctypes.byref(pointer)
        ) != 0 or not pointer:
            _fail("runtime_loader_link_map_query_failed")
        seen: set[int] = set()
        while pointer.contents.l_prev:
            address = ctypes.addressof(pointer.contents)
            if address in seen or len(seen) >= 128:
                _fail("runtime_loader_link_map_cycle")
            seen.add(address)
            pointer = pointer.contents.l_prev
        names: list[str] = []
        seen.clear()
        while pointer:
            address = ctypes.addressof(pointer.contents)
            if address in seen or len(seen) >= 128:
                _fail("runtime_loader_link_map_cycle")
            seen.add(address)
            raw = pointer.contents.l_name
            if raw:
                names.append(raw.decode("ascii", "strict"))
            pointer = pointer.contents.l_next
        return tuple(names)

    def symbol(self, handle: int, name: str, component: str) -> int:
        self.lib.dlerror()
        address = self.lib.dlsym(
            ctypes.c_void_p(handle), name.encode("ascii", "strict")
        )
        error = self.lib.dlerror()
        if not address or error is not None:
            _fail("runtime_required_symbol_missing", f"{component}:{name}")
        return int(address)

    def dladdr(self, address: int, component: str) -> _DlInfo:
        info = _DlInfo()
        if self.lib.dladdr(ctypes.c_void_p(address), ctypes.byref(info)) == 0:
            _fail("runtime_loader_dladdr_failed", component)
        return info

    def close(self, handle: int, component: str) -> str | None:
        try:
            status = int(self.lib.dlclose(ctypes.c_void_p(handle)))
        except BaseException:
            return f"{component}_dlclose_call_failed"
        if status != 0:
            return f"{component}_dlclose_status_failed"
        return None


def _loaded_binding(
    loader: _DynamicLoader,
    handle: int,
    sealed: _SealedCopy,
    representative_symbol: str,
) -> tuple[LoadedLibraryBinding, int]:
    component = sealed.component
    link_map = loader.link_map(handle, component)
    try:
        link_name = (link_map.l_name or b"").decode("ascii", "strict")
    except UnicodeDecodeError:
        _fail("runtime_loader_link_map_name_invalid", component)
    if link_name != sealed.procfd_path:
        _fail("runtime_loader_link_map_name_mismatch", component)
    symbol_address = loader.symbol(handle, representative_symbol, component)
    info = loader.dladdr(symbol_address, component)
    try:
        dladdr_name = (info.dli_fname or b"").decode("ascii", "strict")
    except UnicodeDecodeError:
        _fail("runtime_loader_dladdr_name_invalid", component)
    if dladdr_name != sealed.procfd_path:
        _fail("runtime_loader_dladdr_name_mismatch", component)
    if int(info.dli_fbase or 0) != int(link_map.l_addr or 0):
        _fail("runtime_loader_base_address_mismatch", component)
    maps_device, maps_inode, maps_path = _map_for_address(symbol_address)
    if (
        maps_device != sealed.identity.device
        or maps_inode != sealed.identity.inode
        or maps_path != sealed.maps_path
    ):
        _fail("runtime_loader_maps_identity_mismatch", component)
    current = _identity(os.fstat(sealed.fd))
    if current != sealed.identity:
        _fail("runtime_sealed_copy_stat_drift", component)
    return (
        LoadedLibraryBinding(
            component=component,
            sealed_memfd_name=sealed.name,
            identity=sealed.identity,
            sha256=sealed.sha256,
            seal_mask=sealed.seal_mask,
            required_seal_mask=sealed.required_seal_mask,
            seals_exact=sealed.seal_mask == sealed.required_seal_mask,
            loader_procfd_path=sealed.procfd_path,
            loader_link_map_name=link_name,
            dladdr_name=dladdr_name,
            maps_path=maps_path,
            representative_symbol=representative_symbol,
            maps_device_inode_exact=True,
            link_map_dladdr_exact=True,
            source_inode_loaded_directly=False,
        ),
        symbol_address,
    )


def _verify_every_symbol_owner(
    loader: _DynamicLoader,
    handle: int,
    sealed: _SealedCopy,
    names: tuple[str, ...],
) -> dict[str, int]:
    addresses: dict[str, int] = {}
    for name in names:
        address = loader.symbol(handle, name, sealed.component)
        info = loader.dladdr(address, sealed.component)
        try:
            owner = (info.dli_fname or b"").decode("ascii", "strict")
        except UnicodeDecodeError:
            _fail("runtime_required_symbol_owner_invalid", sealed.component)
        maps_device, maps_inode, maps_path = _map_for_address(address)
        if (
            owner != sealed.procfd_path
            or maps_device != sealed.identity.device
            or maps_inode != sealed.identity.inode
            or maps_path != sealed.maps_path
        ):
            _fail(
                "runtime_required_symbol_owner_mismatch",
                f"{sealed.component}:{name}",
            )
        addresses[name] = address
    return addresses


def _verify_mpfr_required_gmp_dependency_inventory(
    loader: _DynamicLoader,
    mpfr_handle: int,
    gmp_sealed: _SealedCopy,
    gmp_addresses: dict[str, int],
) -> None:
    if tuple(gmp_addresses) != REQUIRED_GMP_SYMBOLS:
        _fail("runtime_gmp_symbol_inventory_mismatch")
    for name in REQUIRED_GMP_SYMBOLS:
        address = loader.symbol(
            mpfr_handle,
            name,
            "mpfr_required_gmp_dependency",
        )
        if address != gmp_addresses[name]:
            _fail(
                "runtime_loader_mpfr_gmp_dependency_identity_mismatch",
                name,
            )
        info = loader.dladdr(address, "mpfr_required_gmp_dependency")
        try:
            owner = (info.dli_fname or b"").decode("ascii", "strict")
        except UnicodeDecodeError:
            _fail("runtime_loader_mpfr_gmp_dependency_owner_invalid", name)
        maps_device, maps_inode, maps_path = _map_for_address(address)
        if (
            owner != gmp_sealed.procfd_path
            or maps_device != gmp_sealed.identity.device
            or maps_inode != gmp_sealed.identity.inode
            or maps_path != gmp_sealed.maps_path
        ):
            _fail("runtime_loader_mpfr_gmp_dependency_owner_mismatch", name)


def _function(
    address: int, restype: Any, *argtypes: Any
) -> Any:
    return ctypes.PYFUNCTYPE(restype, *argtypes)(address)


class _NativeMpfrApi:
    __slots__ = (
        "_mpfr",
        "_gmp",
        "mpfr_init2",
        "mpfr_clear",
        "mpfr_get_prec",
        "mpfr_set_ui",
        "mpfr_set_si",
        "mpfr_set_str",
        "mpfr_set_z",
        "mpfr_set",
        "mpfr_mul_2si",
        "mpfr_add",
        "mpfr_sub",
        "mpfr_mul",
        "mpfr_div",
        "mpfr_div_ui",
        "mpfr_sqrt",
        "mpfr_const_pi",
        "mpfr_cmp",
        "mpfr_cmp_ui",
        "mpfr_cmp_z",
        "mpfr_equal_p",
        "mpfr_get_z_2exp",
        "mpfr_get_d",
        "mpfr_number_p",
        "_get_emin",
        "_get_emax",
        "_set_emin",
        "_set_emax",
        "_get_rounding",
        "_set_rounding",
        "_clear_flags",
        "_flags_save",
        "_flags_restore",
        "_underflow",
        "_overflow",
        "_divby0",
        "_nanflag",
        "_inexact",
        "_erange",
        "_get_version",
        "_tls",
        "_free_cache",
        "gmpz_init",
        "gmpz_clear",
        "gmpz_set_ui",
        "gmpz_set_si",
        "gmpz_set_str",
        "gmpz_get_str",
        "gmpz_sizeinbase",
    )

    def __init__(
        self, mpfr_addresses: dict[str, int], gmp_addresses: dict[str, int]
    ) -> None:
        self._mpfr = mpfr_addresses
        self._gmp = gmp_addresses
        mpfr_pointer = ctypes.POINTER(_MpfrStruct)
        mpz_pointer = ctypes.POINTER(_MpzStruct)
        self.mpfr_init2 = _function(
            mpfr_addresses["mpfr_init2"], None, mpfr_pointer, ctypes.c_long
        )
        self.mpfr_clear = _function(
            mpfr_addresses["mpfr_clear"], None, mpfr_pointer
        )
        self.mpfr_get_prec = _function(
            mpfr_addresses["mpfr_get_prec"], ctypes.c_long, mpfr_pointer
        )
        self.mpfr_set_ui = _function(
            mpfr_addresses["mpfr_set_ui"],
            ctypes.c_int,
            mpfr_pointer,
            ctypes.c_ulong,
            ctypes.c_int,
        )
        self.mpfr_set_si = _function(
            mpfr_addresses["mpfr_set_si"],
            ctypes.c_int,
            mpfr_pointer,
            ctypes.c_long,
            ctypes.c_int,
        )
        self.mpfr_set_str = _function(
            mpfr_addresses["mpfr_set_str"],
            ctypes.c_int,
            mpfr_pointer,
            ctypes.c_char_p,
            ctypes.c_int,
            ctypes.c_int,
        )
        self.mpfr_set_z = _function(
            mpfr_addresses["mpfr_set_z"],
            ctypes.c_int,
            mpfr_pointer,
            mpz_pointer,
            ctypes.c_int,
        )
        self.mpfr_set = _function(
            mpfr_addresses["mpfr_set"],
            ctypes.c_int,
            mpfr_pointer,
            mpfr_pointer,
            ctypes.c_int,
        )
        self.mpfr_mul_2si = _function(
            mpfr_addresses["mpfr_mul_2si"],
            ctypes.c_int,
            mpfr_pointer,
            mpfr_pointer,
            ctypes.c_long,
            ctypes.c_int,
        )
        for attribute, symbol in (
            ("mpfr_add", "mpfr_add"),
            ("mpfr_sub", "mpfr_sub"),
            ("mpfr_mul", "mpfr_mul"),
            ("mpfr_div", "mpfr_div"),
        ):
            setattr(
                self,
                attribute,
                _function(
                    mpfr_addresses[symbol],
                    ctypes.c_int,
                    mpfr_pointer,
                    mpfr_pointer,
                    mpfr_pointer,
                    ctypes.c_int,
                ),
            )
        self.mpfr_div_ui = _function(
            mpfr_addresses["mpfr_div_ui"],
            ctypes.c_int,
            mpfr_pointer,
            mpfr_pointer,
            ctypes.c_ulong,
            ctypes.c_int,
        )
        self.mpfr_sqrt = _function(
            mpfr_addresses["mpfr_sqrt"],
            ctypes.c_int,
            mpfr_pointer,
            mpfr_pointer,
            ctypes.c_int,
        )
        self.mpfr_const_pi = _function(
            mpfr_addresses["mpfr_const_pi"],
            ctypes.c_int,
            mpfr_pointer,
            ctypes.c_int,
        )
        self.mpfr_cmp = _function(
            mpfr_addresses["mpfr_cmp"], ctypes.c_int, mpfr_pointer, mpfr_pointer
        )
        self.mpfr_cmp_ui = _function(
            mpfr_addresses["mpfr_cmp_ui"],
            ctypes.c_int,
            mpfr_pointer,
            ctypes.c_ulong,
        )
        self.mpfr_cmp_z = _function(
            mpfr_addresses["mpfr_cmp_z"],
            ctypes.c_int,
            mpfr_pointer,
            mpz_pointer,
        )
        self.mpfr_equal_p = _function(
            mpfr_addresses["mpfr_equal_p"],
            ctypes.c_int,
            mpfr_pointer,
            mpfr_pointer,
        )
        self.mpfr_get_z_2exp = _function(
            mpfr_addresses["mpfr_get_z_2exp"],
            ctypes.c_long,
            mpz_pointer,
            mpfr_pointer,
        )
        self.mpfr_get_d = _function(
            mpfr_addresses["mpfr_get_d"],
            ctypes.c_double,
            mpfr_pointer,
            ctypes.c_int,
        )
        self.mpfr_number_p = _function(
            mpfr_addresses["mpfr_number_p"], ctypes.c_int, mpfr_pointer
        )
        self._get_emin = _function(
            mpfr_addresses["mpfr_get_emin"], ctypes.c_long
        )
        self._get_emax = _function(
            mpfr_addresses["mpfr_get_emax"], ctypes.c_long
        )
        self._set_emin = _function(
            mpfr_addresses["mpfr_set_emin"], ctypes.c_int, ctypes.c_long
        )
        self._set_emax = _function(
            mpfr_addresses["mpfr_set_emax"], ctypes.c_int, ctypes.c_long
        )
        self._get_rounding = _function(
            mpfr_addresses["mpfr_get_default_rounding_mode"], ctypes.c_int
        )
        self._set_rounding = _function(
            mpfr_addresses["mpfr_set_default_rounding_mode"], None, ctypes.c_int
        )
        self._clear_flags = _function(
            mpfr_addresses["mpfr_clear_flags"], None
        )
        self._flags_save = _function(
            mpfr_addresses["mpfr_flags_save"], ctypes.c_uint
        )
        self._flags_restore = _function(
            mpfr_addresses["mpfr_flags_restore"],
            None,
            ctypes.c_uint,
            ctypes.c_uint,
        )
        self._underflow = _function(
            mpfr_addresses["mpfr_underflow_p"], ctypes.c_int
        )
        self._overflow = _function(
            mpfr_addresses["mpfr_overflow_p"], ctypes.c_int
        )
        self._divby0 = _function(
            mpfr_addresses["mpfr_divby0_p"], ctypes.c_int
        )
        self._nanflag = _function(
            mpfr_addresses["mpfr_nanflag_p"], ctypes.c_int
        )
        self._inexact = _function(
            mpfr_addresses["mpfr_inexflag_p"], ctypes.c_int
        )
        self._erange = _function(
            mpfr_addresses["mpfr_erangeflag_p"], ctypes.c_int
        )
        self._get_version = _function(
            mpfr_addresses["mpfr_get_version"], ctypes.c_char_p
        )
        self._tls = _function(
            mpfr_addresses["mpfr_buildopt_tls_p"], ctypes.c_int
        )
        self._free_cache = _function(
            mpfr_addresses["mpfr_free_cache"], None
        )
        self.gmpz_init = _function(
            gmp_addresses["__gmpz_init"], None, mpz_pointer
        )
        self.gmpz_clear = _function(
            gmp_addresses["__gmpz_clear"], None, mpz_pointer
        )
        self.gmpz_set_ui = _function(
            gmp_addresses["__gmpz_set_ui"], None, mpz_pointer, ctypes.c_ulong
        )
        self.gmpz_set_si = _function(
            gmp_addresses["__gmpz_set_si"], None, mpz_pointer, ctypes.c_long
        )
        self.gmpz_set_str = _function(
            gmp_addresses["__gmpz_set_str"],
            ctypes.c_int,
            mpz_pointer,
            ctypes.c_char_p,
            ctypes.c_int,
        )
        self.gmpz_get_str = _function(
            gmp_addresses["__gmpz_get_str"],
            ctypes.c_char_p,
            ctypes.c_char_p,
            ctypes.c_int,
            mpz_pointer,
        )
        self.gmpz_sizeinbase = _function(
            gmp_addresses["__gmpz_sizeinbase"],
            ctypes.c_size_t,
            mpz_pointer,
            ctypes.c_int,
        )

    def mpfr_version(self) -> str:
        raw = self._get_version()
        if raw is None:
            _fail("runtime_mpfr_version_unavailable")
        try:
            return raw.decode("ascii", "strict")
        except UnicodeDecodeError:
            _fail("runtime_mpfr_version_invalid")

    def gmp_version(self) -> str:
        try:
            raw = ctypes.c_char_p.from_address(
                self._gmp["__gmp_version"]
            ).value
        except (ValueError, OSError):
            _fail("runtime_gmp_version_unavailable")
        if raw is None:
            _fail("runtime_gmp_version_unavailable")
        try:
            return raw.decode("ascii", "strict")
        except UnicodeDecodeError:
            _fail("runtime_gmp_version_invalid")

    def gmp_limb_bits(self) -> int:
        try:
            return int(
                ctypes.c_int.from_address(
                    self._gmp["__gmp_bits_per_limb"]
                ).value
            )
        except (ValueError, OSError):
            _fail("runtime_gmp_limb_bits_unavailable")

    def tls_enabled(self) -> bool:
        return int(self._tls()) == 1

    def get_emin(self) -> int:
        return int(self._get_emin())

    def get_emax(self) -> int:
        return int(self._get_emax())

    def set_emin(self, value: int) -> int:
        return int(self._set_emin(value))

    def set_emax(self, value: int) -> int:
        return int(self._set_emax(value))

    def get_rounding(self) -> int:
        return int(self._get_rounding())

    def set_rounding(self, value: int) -> None:
        self._set_rounding(value)

    def clear_flags(self) -> None:
        self._clear_flags()

    def flags_save(self) -> int:
        return int(self._flags_save())

    def flags_restore(self, flags: int) -> None:
        self._flags_restore(flags, MPFR_FLAGS_ALL)

    def flags(self) -> tuple[bool, bool, bool, bool, bool, bool]:
        return (
            bool(self._underflow()),
            bool(self._overflow()),
            bool(self._divby0()),
            bool(self._nanflag()),
            bool(self._inexact()),
            bool(self._erange()),
        )

    def free_cache(self) -> None:
        self._free_cache()

    def lease_new_mpfr(self) -> _MpfrStruct:
        value = _MpfrStruct()
        self.mpfr_init2(ctypes.byref(value), PRECISION_BITS)
        if (
            int(self.mpfr_get_prec(ctypes.byref(value))) != PRECISION_BITS
            or not value._mpfr_d
        ):
            if value._mpfr_d:
                self.mpfr_clear(ctypes.byref(value))
            _fail("runtime_lease_mpfr_init_invalid")
        return value

    def lease_new_mpz(self) -> _MpzStruct:
        value = _MpzStruct()
        self.gmpz_init(ctypes.byref(value))
        if not value._mp_d:
            self.gmpz_clear(ctypes.byref(value))
            _fail("runtime_lease_mpz_init_invalid")
        return value

    def lease_clear_mpfr(self, value: _MpfrStruct) -> None:
        self.mpfr_clear(ctypes.byref(value))

    def lease_clear_mpz(self, value: _MpzStruct) -> None:
        self.gmpz_clear(ctypes.byref(value))

    def lease_mpfr_storage_identity(
        self, value: _MpfrStruct
    ) -> tuple[int, int]:
        return ctypes.addressof(value), int(value._mpfr_d or 0)

    def lease_mpz_set_ui(self, destination: _MpzStruct, value: int) -> None:
        self.gmpz_set_ui(ctypes.byref(destination), value)

    def lease_mpz_set_si(self, destination: _MpzStruct, value: int) -> None:
        self.gmpz_set_si(ctypes.byref(destination), value)

    def lease_mpz_set_decimal(
        self, destination: _MpzStruct, value: str
    ) -> int:
        return int(
            self.gmpz_set_str(
                ctypes.byref(destination), value.encode("ascii"), 10
            )
        )

    def lease_mpz_decimal(self, value: _MpzStruct) -> str:
        digits = int(self.gmpz_sizeinbase(ctypes.byref(value), 10))
        if not 1 <= digits <= MAX_INTEGER_DECIMAL_BYTES - 3:
            _fail("runtime_lease_mpz_readback_size_invalid")
        buffer = ctypes.create_string_buffer(digits + 3)
        result = self.gmpz_get_str(
            ctypes.cast(buffer, ctypes.c_char_p),
            10,
            ctypes.byref(value),
        )
        if result is None:
            _fail("runtime_lease_mpz_readback_failed")
        try:
            return buffer.value.decode("ascii", "strict")
        except UnicodeDecodeError:
            _fail("runtime_lease_mpz_readback_invalid")

    def lease_mpfr_set_ui(
        self, destination: _MpfrStruct, value: int, rounding: int
    ) -> int:
        return int(self.mpfr_set_ui(ctypes.byref(destination), value, rounding))

    def lease_mpfr_set_si(
        self, destination: _MpfrStruct, value: int, rounding: int
    ) -> int:
        return int(self.mpfr_set_si(ctypes.byref(destination), value, rounding))

    def lease_mpfr_set_decimal(
        self, destination: _MpfrStruct, value: str, rounding: int
    ) -> int:
        return int(
            self.mpfr_set_str(
                ctypes.byref(destination),
                value.encode("ascii"),
                10,
                rounding,
            )
        )

    def lease_mpfr_set_z(
        self,
        destination: _MpfrStruct,
        source: _MpzStruct,
        rounding: int,
    ) -> int:
        return int(
            self.mpfr_set_z(
                ctypes.byref(destination),
                ctypes.byref(source),
                rounding,
            )
        )

    def lease_mpfr_set(
        self,
        destination: _MpfrStruct,
        source: _MpfrStruct,
        rounding: int,
    ) -> int:
        return int(
            self.mpfr_set(
                ctypes.byref(destination),
                ctypes.byref(source),
                rounding,
            )
        )

    def lease_mpfr_mul_2si(
        self,
        destination: _MpfrStruct,
        source: _MpfrStruct,
        exponent2: int,
        rounding: int,
    ) -> int:
        return int(
            self.mpfr_mul_2si(
                ctypes.byref(destination),
                ctypes.byref(source),
                exponent2,
                rounding,
            )
        )

    def _lease_binary(
        self,
        operation: Any,
        destination: _MpfrStruct,
        left: _MpfrStruct,
        right: _MpfrStruct,
        rounding: int,
    ) -> int:
        return int(
            operation(
                ctypes.byref(destination),
                ctypes.byref(left),
                ctypes.byref(right),
                rounding,
            )
        )

    def lease_mpfr_add(
        self, destination: _MpfrStruct, left: _MpfrStruct,
        right: _MpfrStruct, rounding: int
    ) -> int:
        return self._lease_binary(self.mpfr_add, destination, left, right, rounding)

    def lease_mpfr_sub(
        self, destination: _MpfrStruct, left: _MpfrStruct,
        right: _MpfrStruct, rounding: int
    ) -> int:
        return self._lease_binary(self.mpfr_sub, destination, left, right, rounding)

    def lease_mpfr_mul(
        self, destination: _MpfrStruct, left: _MpfrStruct,
        right: _MpfrStruct, rounding: int
    ) -> int:
        return self._lease_binary(self.mpfr_mul, destination, left, right, rounding)

    def lease_mpfr_div(
        self, destination: _MpfrStruct, left: _MpfrStruct,
        right: _MpfrStruct, rounding: int
    ) -> int:
        return self._lease_binary(self.mpfr_div, destination, left, right, rounding)

    def lease_mpfr_sqrt(
        self,
        destination: _MpfrStruct,
        source: _MpfrStruct,
        rounding: int,
    ) -> int:
        return int(
            self.mpfr_sqrt(
                ctypes.byref(destination),
                ctypes.byref(source),
                rounding,
            )
        )

    def lease_mpfr_const_pi(
        self, destination: _MpfrStruct, rounding: int
    ) -> int:
        return int(self.mpfr_const_pi(ctypes.byref(destination), rounding))

    def lease_mpfr_compare(
        self, left: _MpfrStruct, right: _MpfrStruct
    ) -> int:
        return int(self.mpfr_cmp(ctypes.byref(left), ctypes.byref(right)))

    def lease_mpfr_compare_ui(self, left: _MpfrStruct, right: int) -> int:
        return int(self.mpfr_cmp_ui(ctypes.byref(left), right))

    def lease_mpfr_compare_z(
        self, left: _MpfrStruct, right: _MpzStruct
    ) -> int:
        return int(self.mpfr_cmp_z(ctypes.byref(left), ctypes.byref(right)))

    def lease_mpfr_equal(
        self, left: _MpfrStruct, right: _MpfrStruct
    ) -> bool:
        return int(self.mpfr_equal_p(ctypes.byref(left), ctypes.byref(right))) != 0

    def lease_mpfr_get_z_2exp(
        self, destination: _MpzStruct, source: _MpfrStruct
    ) -> int:
        return int(
            self.mpfr_get_z_2exp(
                ctypes.byref(destination), ctypes.byref(source)
            )
        )

    def lease_mpfr_get_d(self, source: _MpfrStruct, rounding: int) -> float:
        return float(self.mpfr_get_d(ctypes.byref(source), rounding))

    def lease_mpfr_number(self, source: _MpfrStruct) -> bool:
        return int(self.mpfr_number_p(ctypes.byref(source))) == 1

    def lease_mpfr_precision(self, source: _MpfrStruct) -> int:
        return int(self.mpfr_get_prec(ctypes.byref(source)))

    def run_canary(self) -> CanaryObservation:
        mpz = _MpzStruct()
        mpfr_values: list[_MpfrStruct] = []
        mpz_initialized = False
        cleanup_issues: list[str] = []
        lower_ternary = 0
        upper_ternary = 0
        lower_bits = ""
        upper_bits = ""
        primary: BaseException | None = None
        try:
            self.gmpz_init(ctypes.byref(mpz))
            mpz_initialized = True
            self.gmpz_set_ui(ctypes.byref(mpz), 1)

            def new_mpfr() -> _MpfrStruct:
                value = _MpfrStruct()
                self.mpfr_init2(ctypes.byref(value), PRECISION_BITS)
                if (
                    int(self.mpfr_get_prec(ctypes.byref(value)))
                    != PRECISION_BITS
                    or not value._mpfr_d
                ):
                    if value._mpfr_d:
                        self.mpfr_clear(ctypes.byref(value))
                    _fail("runtime_canary_mpfr_init_invalid")
                mpfr_values.append(value)
                return value

            one = new_mpfr()
            lower = new_mpfr()
            upper = new_mpfr()
            self.clear_flags()
            if int(self.mpfr_set_z(ctypes.byref(one), ctypes.byref(mpz), RNDN)) != 0:
                _fail("runtime_canary_exact_injection_failed")
            lower_ternary = int(
                self.mpfr_div_ui(
                    ctypes.byref(lower), ctypes.byref(one), 3, RNDD
                )
            )
            upper_ternary = int(
                self.mpfr_div_ui(
                    ctypes.byref(upper), ctypes.byref(one), 3, RNDU
                )
            )
            if lower_ternary >= 0 or upper_ternary <= 0:
                _fail("runtime_canary_directed_ternary_invalid")
            if (
                int(self.mpfr_number_p(ctypes.byref(lower))) != 1
                or int(self.mpfr_number_p(ctypes.byref(upper))) != 1
                or int(
                    self.mpfr_cmp(ctypes.byref(lower), ctypes.byref(upper))
                )
                >= 0
                or int(self.mpfr_cmp_ui(ctypes.byref(lower), 0)) <= 0
                or int(self.mpfr_cmp_ui(ctypes.byref(upper), 1)) >= 0
            ):
                _fail("runtime_canary_interval_invalid")
            lower_float = float(self.mpfr_get_d(ctypes.byref(lower), RNDD))
            upper_float = float(self.mpfr_get_d(ctypes.byref(upper), RNDU))
            if not (
                math.isfinite(lower_float)
                and math.isfinite(upper_float)
                and lower_float < upper_float
            ):
                _fail("runtime_canary_binary64_interval_invalid")
            lower_word = struct.unpack(">Q", struct.pack(">d", lower_float))[0]
            upper_word = struct.unpack(">Q", struct.pack(">d", upper_float))[0]
            lower_bits = f"{lower_word:016x}"
            upper_bits = f"{upper_word:016x}"
            if (lower_bits, upper_bits) != (
                "3fd5555555555555",
                "3fd5555555555556",
            ):
                _fail("runtime_canary_binary64_words_invalid")
            flags = self.flags()
            if any(flags[index] for index in (0, 1, 2, 3, 5)):
                _fail("runtime_canary_forbidden_flag_set")
            if not flags[4]:
                _fail("runtime_canary_inexact_flag_missing")
        except BaseException as error:
            primary = error
        for value in reversed(mpfr_values):
            try:
                self.mpfr_clear(ctypes.byref(value))
            except BaseException:
                cleanup_issues.append("mpfr_clear_failed")
        if mpz_initialized:
            try:
                self.gmpz_clear(ctypes.byref(mpz))
            except BaseException:
                cleanup_issues.append("mpz_clear_failed")
        try:
            self.clear_flags()
        except BaseException:
            cleanup_issues.append("canary_flags_clear_failed")
        cleanup_issues = list(dict.fromkeys(cleanup_issues))
        if cleanup_issues:
            raise RuntimeConformanceError(
                "runtime_canary_cleanup_failed",
                _error_code(primary) if primary is not None else None,
                tuple(cleanup_issues),
            )
        if primary is not None:
            raise primary
        return CanaryObservation(
            precision_bits=PRECISION_BITS,
            lower_ternary=lower_ternary,
            upper_ternary=upper_ternary,
            lower_binary64_bits=lower_bits,
            upper_binary64_bits=upper_bits,
            strict_interval_observed=True,
            inexact_flag_observed=True,
            forbidden_flags_clear=True,
            reverse_cleanup_complete=True,
        )


class _NativeProviderSession:
    __slots__ = (
        "evidence",
        "_loader",
        "_mpfr_handle",
        "_gmp_handle",
        "_sources",
        "_sealed",
        "_closed",
    )

    def __init__(
        self,
        evidence: _ProviderEvidence,
        loader: _DynamicLoader,
        mpfr_handle: int,
        gmp_handle: int,
        sources: tuple[_HeldSource, _HeldSource],
        sealed: tuple[_SealedCopy, _SealedCopy],
    ) -> None:
        self.evidence = evidence
        self._loader = loader
        self._mpfr_handle = mpfr_handle
        self._gmp_handle = gmp_handle
        self._sources = sources
        self._sealed = sealed
        self._closed = False

    def close(self) -> tuple[str, ...]:
        if self._closed:
            return ()
        self._closed = True
        issues: list[str] = []

        def remember(code: str) -> None:
            if code not in issues and len(issues) < 16:
                issues.append(code)

        for source in self._sources:
            try:
                current = _identity(os.fstat(source.fd))
                if current != source.identity:
                    remember(f"{source.component}_source_final_stat_drift")
                final_hash = _hash_fd(
                    source.fd, source.identity.size_bytes, source.component
                )
                if final_hash != source.expectation.sha256:
                    remember(f"{source.component}_source_final_hash_mismatch")
            except BaseException:
                remember(f"{source.component}_source_final_verify_failed")

        try:
            fcntl = importlib.import_module("fcntl")
        except ImportError:
            fcntl = None
            remember("sealed_final_seal_query_unavailable")
        for sealed in self._sealed:
            try:
                current = _identity(os.fstat(sealed.fd))
                if current != sealed.identity:
                    remember(f"{sealed.component}_sealed_final_stat_drift")
                final_hash = _hash_fd(
                    sealed.fd, sealed.identity.size_bytes, sealed.component + "_sealed"
                )
                if final_hash != sealed.sha256:
                    remember(f"{sealed.component}_sealed_final_hash_mismatch")
                if fcntl is None or int(
                    fcntl.fcntl(sealed.fd, fcntl.F_GET_SEALS)
                ) != sealed.required_seal_mask:
                    remember(f"{sealed.component}_sealed_final_seal_mismatch")
            except BaseException:
                remember(f"{sealed.component}_sealed_final_verify_failed")

        close_issue = self._loader.close(self._mpfr_handle, "mpfr")
        if close_issue is not None:
            remember(close_issue)
        close_issue = self._loader.close(self._gmp_handle, "gmp")
        if close_issue is not None:
            remember(close_issue)

        for sealed in self._sealed:
            try:
                if _mapped_identity_present(sealed.identity):
                    remember(f"{sealed.component}_mapping_persisted_after_dlclose")
            except RuntimeConformanceError:
                remember(f"{sealed.component}_mapping_absence_unverified")

        for sealed in reversed(self._sealed):
            for code in sealed.close():
                remember(code)
        for source in reversed(self._sources):
            for code in source.close():
                remember(code)
        self.evidence = _provider_evidence_without_api(self.evidence)
        return tuple(issues)


def _observe_native_abi(api: Any) -> AbiObservation:
    mpfr_offsets = tuple(
        getattr(_MpfrStruct, field).offset
        for field in ("_mpfr_prec", "_mpfr_sign", "_mpfr_exp", "_mpfr_d")
    )
    mpz_offsets = tuple(
        getattr(_MpzStruct, field).offset
        for field in ("_mp_alloc", "_mp_size", "_mp_d")
    )
    limb_bits = api.gmp_limb_bits()
    tls_enabled = api.tls_enabled()
    abi_exact = (
        ctypes.sizeof(ctypes.c_void_p) == 8
        and ctypes.sizeof(ctypes.c_long) == 8
        and ctypes.sizeof(ctypes.c_int) == 4
        and ctypes.sizeof(ctypes.c_ulong) == 8
        and ctypes.sizeof(_MpfrStruct) == 32
        and mpfr_offsets == (0, 8, 16, 24)
        and ctypes.sizeof(_MpzStruct) == 16
        and mpz_offsets == (0, 4, 8)
        and limb_bits == 64
        and tls_enabled
    )
    if not abi_exact:
        _fail("runtime_native_abi_mismatch")
    return AbiObservation(
        platform_system="Linux",
        machine="x86_64",
        byte_order="little_endian",
        pointer_bits=64,
        c_long_bits=64,
        c_int_bits=32,
        c_ulong_bits=64,
        mpfr_struct_size_bytes=32,
        mpfr_struct_offsets=(0, 8, 16, 24),
        mpz_struct_size_bytes=16,
        mpz_struct_offsets=(0, 4, 8),
        gmp_limb_bits=limb_bits,
        mpfr_tls_enabled=tls_enabled,
        abi_exact=True,
    )


class _LinuxNativeProvider:
    provider_kind = "linux_x86_64_sealed_memfd_dlmopen_diagnostic/v1"

    def open_runtime(
        self, request: _RuntimeConformanceRequest
    ) -> _NativeProviderSession:
        sources: list[_HeldSource] = []
        sealed_copies: list[_SealedCopy] = []
        loader: _DynamicLoader | None = None
        gmp_handle = 0
        mpfr_handle = 0
        primary: BaseException | None = None
        try:
            gmp_source = _open_source(request.gmp)
            sources.append(gmp_source)
            mpfr_source = _open_source(request.mpfr)
            sources.append(mpfr_source)
            if (
                gmp_source.identity.device,
                gmp_source.identity.inode,
            ) == (
                mpfr_source.identity.device,
                mpfr_source.identity.inode,
            ):
                _fail("runtime_library_pair_source_identity_not_distinct")

            gmp_sealed = _copy_and_seal(gmp_source)
            sealed_copies.append(gmp_sealed)
            mpfr_sealed = _copy_and_seal(mpfr_source)
            sealed_copies.append(mpfr_sealed)
            if (
                gmp_sealed.identity.device,
                gmp_sealed.identity.inode,
            ) == (
                mpfr_sealed.identity.device,
                mpfr_sealed.identity.inode,
            ):
                _fail("runtime_library_pair_sealed_identity_not_distinct")

            loader = _DynamicLoader()
            gmp_handle = loader.open(
                loader.LM_ID_NEWLM, gmp_sealed.procfd_path, "gmp"
            )
            namespace_id = loader.namespace_id(gmp_handle, "gmp")
            if namespace_id <= 0:
                _fail("runtime_loader_fresh_namespace_not_established")
            gmp_binding, _ = _loaded_binding(
                loader, gmp_handle, gmp_sealed, "__gmpz_init"
            )
            gmp_addresses = _verify_every_symbol_owner(
                loader,
                gmp_handle,
                gmp_sealed,
                REQUIRED_GMP_SYMBOLS,
            )

            mpfr_handle = loader.open(
                namespace_id, mpfr_sealed.procfd_path, "mpfr"
            )
            if loader.namespace_id(mpfr_handle, "mpfr") != namespace_id:
                _fail("runtime_loader_namespace_mismatch")
            mpfr_binding, _ = _loaded_binding(
                loader, mpfr_handle, mpfr_sealed, "mpfr_get_version"
            )
            mpfr_addresses = _verify_every_symbol_owner(
                loader,
                mpfr_handle,
                mpfr_sealed,
                REQUIRED_MPFR_SYMBOLS,
            )

            names = loader.link_map_names(mpfr_handle)
            if (
                names.count(gmp_sealed.procfd_path) != 1
                or names.count(mpfr_sealed.procfd_path) != 1
            ):
                _fail("runtime_loader_sealed_link_map_inventory_invalid")
            for name in names:
                lowered = name.lower()
                if name not in {gmp_sealed.procfd_path, mpfr_sealed.procfd_path} and (
                    "libgmp" in lowered or "libmpfr" in lowered
                ):
                    _fail("runtime_loader_ambient_gmp_mpfr_dependency_detected")

            _verify_mpfr_required_gmp_dependency_inventory(
                loader,
                mpfr_handle,
                gmp_sealed,
                gmp_addresses,
            )

            api = _NativeMpfrApi(mpfr_addresses, gmp_addresses)
            mpfr_version = api.mpfr_version()
            gmp_version = api.gmp_version()
            if mpfr_version != EXPECTED_MPFR_VERSION:
                _fail("runtime_mpfr_version_mismatch", mpfr_version)
            if gmp_version != EXPECTED_GMP_VERSION:
                _fail("runtime_gmp_version_mismatch", gmp_version)

            abi = _observe_native_abi(api)

            for source in sources:
                current = _identity(os.fstat(source.fd))
                _validate_source_identity(
                    source.component,
                    source.identity,
                    current,
                    symlink_observed=False,
                )
                source.after_load_hash = _hash_fd(
                    source.fd,
                    source.identity.size_bytes,
                    source.component,
                )
                if source.after_load_hash != source.expectation.sha256:
                    _fail("runtime_library_postload_hash_mismatch", source.component)

            evidence = _ProviderEvidence(
                provider_kind=self.provider_kind,
                native_provider_mechanics_observed=True,
                namespace_id=namespace_id,
                source_libraries=tuple(source.binding() for source in sources),
                loaded_libraries=(gmp_binding, mpfr_binding),
                mpfr_version=mpfr_version,
                gmp_version=gmp_version,
                resolved_mpfr_symbols=tuple(mpfr_addresses),
                resolved_gmp_symbols=tuple(gmp_addresses),
                abi=abi,
                required_gmp_dependency_inventory_exact=True,
                api=api,
            )
            return _NativeProviderSession(
                evidence,
                loader,
                mpfr_handle,
                gmp_handle,
                (gmp_source, mpfr_source),
                (gmp_sealed, mpfr_sealed),
            )
        except BaseException as error:
            primary = error
        cleanup: list[str] = []
        if loader is not None and mpfr_handle:
            issue = loader.close(mpfr_handle, "mpfr")
            if issue is not None:
                cleanup.append(issue)
        if loader is not None and gmp_handle:
            issue = loader.close(gmp_handle, "gmp")
            if issue is not None:
                cleanup.append(issue)
        for sealed in sealed_copies:
            try:
                if _mapped_identity_present(sealed.identity):
                    cleanup.append(
                        f"{sealed.component}_mapping_persisted_after_failed_load"
                    )
            except RuntimeConformanceError:
                cleanup.append(
                    f"{sealed.component}_mapping_absence_unverified_after_failed_load"
                )
        for sealed in reversed(sealed_copies):
            cleanup.extend(sealed.close())
        for source in reversed(sources):
            cleanup.extend(source.close())
        cleanup = list(dict.fromkeys(cleanup))
        if cleanup:
            _poison(tuple(cleanup))
            raise RuntimeConformanceError(
                "runtime_provider_cleanup_failed",
                _error_code(primary) if primary is not None else None,
                tuple(cleanup),
            )
        if primary is None:
            _fail("runtime_provider_internal_failure_missing")
        raise primary


def _capture_context(api: Any) -> _ContextSnapshot:
    try:
        flags = int(api.flags_save())
        emin = int(api.get_emin())
        emax = int(api.get_emax())
        rounding = int(api.get_rounding())
    except BaseException as error:
        raise RuntimeConformanceError(
            "runtime_context_snapshot_failed", _error_code(error)
        ) from error
    if flags < 0 or flags & ~MPFR_FLAGS_ALL:
        _fail("runtime_context_saved_flags_invalid")
    if rounding not in {RNDN, 1, RNDU, RNDD, 4, 5}:
        _fail("runtime_context_saved_rounding_invalid")
    if emin >= emax:
        _fail("runtime_context_saved_range_invalid")
    return _ContextSnapshot(emin=emin, emax=emax, rounding=rounding, flags=flags)


def _configure_context(api: Any) -> None:
    try:
        api.clear_flags()
        api.set_rounding(RNDN)
        if int(api.set_emin(CONFIGURED_EMIN)) != 0:
            _fail("runtime_context_set_emin_failed")
        if int(api.set_emax(CONFIGURED_EMAX)) != 0:
            _fail("runtime_context_set_emax_failed")
        if (
            int(api.get_emin()) != CONFIGURED_EMIN
            or int(api.get_emax()) != CONFIGURED_EMAX
            or int(api.get_rounding()) != RNDN
            or tuple(api.flags()) != (False,) * 6
        ):
            _fail("runtime_context_configuration_mismatch")
    except RuntimeConformanceError:
        raise
    except BaseException as error:
        raise RuntimeConformanceError(
            "runtime_context_configuration_failed", _error_code(error)
        ) from error


def _restore_context(api: Any, snapshot: _ContextSnapshot) -> _Recovery:
    observed: list[str] = []

    def remember(code: str) -> None:
        if code not in observed and len(observed) < 16:
            observed.append(code)

    def restore_once(phase: str) -> tuple[bool, bool, bool, bool]:
        range_ok = False
        rounding_ok = False
        flags_ok = False
        calls_ok = True
        try:
            if int(api.set_emax(snapshot.emax)) != 0:
                remember(f"set_emax_status_failed_{phase}")
                calls_ok = False
        except BaseException:
            remember(f"set_emax_call_failed_{phase}")
            calls_ok = False
        try:
            if int(api.set_emin(snapshot.emin)) != 0:
                remember(f"set_emin_status_failed_{phase}")
                calls_ok = False
        except BaseException:
            remember(f"set_emin_call_failed_{phase}")
            calls_ok = False
        try:
            api.set_rounding(snapshot.rounding)
        except BaseException:
            remember(f"set_rounding_call_failed_{phase}")
            calls_ok = False
        try:
            api.flags_restore(snapshot.flags)
        except BaseException:
            remember(f"flags_restore_call_failed_{phase}")
            calls_ok = False
        try:
            range_ok = (
                int(api.get_emin()) == snapshot.emin
                and int(api.get_emax()) == snapshot.emax
            )
        except BaseException:
            remember(f"range_verify_failed_{phase}")
        try:
            rounding_ok = int(api.get_rounding()) == snapshot.rounding
        except BaseException:
            remember(f"rounding_verify_failed_{phase}")
        try:
            flags_ok = int(api.flags_save()) == snapshot.flags
        except BaseException:
            remember(f"flags_verify_failed_{phase}")
        return calls_ok, range_ok, rounding_ok, flags_ok

    first = restore_once("first")
    final = first
    if not all(first):
        final = restore_once("retry")
    unresolved: list[str] = []
    if not final[0]:
        unresolved.append("restore_calls_unverified")
    if not final[1]:
        unresolved.append("range_unverified")
    if not final[2]:
        unresolved.append("rounding_unverified")
    if not final[3]:
        unresolved.append("flags_unverified")
    return _Recovery(
        complete=not unresolved,
        unresolved=tuple(unresolved),
        observed_failures=tuple(observed),
    )


def _run_context(api: Any) -> ContextObservation:
    snapshot = _capture_context(api)
    if snapshot.emin > CONFIGURED_EMIN or snapshot.emax < CONFIGURED_EMAX:
        _fail("runtime_context_saved_range_does_not_contain_configured_range")
    primary: BaseException | None = None
    canary: CanaryObservation | None = None
    try:
        _configure_context(api)
        canary = api.run_canary()
        if type(canary) is not CanaryObservation:
            _fail("runtime_canary_observation_type_invalid")
        if (
            canary.precision_bits != PRECISION_BITS
            or not canary.strict_interval_observed
            or not canary.inexact_flag_observed
            or not canary.forbidden_flags_clear
            or not canary.reverse_cleanup_complete
        ):
            _fail("runtime_canary_observation_invalid")
        if tuple(api.flags()) != (False,) * 6:
            _fail("runtime_canary_exit_flags_not_clear")
    except BaseException as error:
        primary = error
    try:
        api.free_cache()
    except BaseException as error:
        _poison(("mpfr_cache_cleanup_unverified",))
        if primary is None:
            primary = RuntimeConformanceError(
                "runtime_mpfr_cache_cleanup_failed", _error_code(error)
            )
        else:
            primary = RuntimeConformanceError(
                "runtime_mpfr_cache_cleanup_failed",
                _error_code(primary),
                (_error_code(error),),
            )
    recovery = _restore_context(api, snapshot)
    if (
        isinstance(primary, RuntimeConformanceError)
        and primary.code == "runtime_canary_cleanup_failed"
    ):
        _poison(("canary_cleanup_unverified",))
    if not recovery.complete:
        _poison(recovery.unresolved)
        raise RuntimeConformanceError(
            "runtime_context_restore_failed",
            _error_code(primary) if primary is not None else None,
            recovery.unresolved,
        )
    if recovery.observed_failures:
        raise RuntimeConformanceError(
            "runtime_context_restore_recovered_after_failure",
            _error_code(primary) if primary is not None else None,
            recovery.observed_failures,
        )
    if primary is not None:
        raise primary
    if canary is None:
        _fail("runtime_canary_observation_missing")
    return ContextObservation(
        saved_emin=snapshot.emin,
        saved_emax=snapshot.emax,
        saved_rounding=snapshot.rounding,
        saved_flags=snapshot.flags,
        configured_emin=CONFIGURED_EMIN,
        configured_emax=CONFIGURED_EMAX,
        configured_rounding=RNDN,
        exclusive_non_reentrant_lease=True,
        context_snapshot_complete=True,
        context_configuration_exact=True,
        context_restored_exact=True,
        flags_restored_exact=True,
        canary=canary,
    )


def _validate_provider_inventory(value: object) -> _ProviderEvidence:
    if type(value) is not _ProviderEvidence:
        _fail("runtime_provider_evidence_type_invalid")
    if type(value.provider_kind) is not str or not value.provider_kind:
        _fail("runtime_provider_kind_invalid")
    if value.namespace_id <= 0:
        _fail("runtime_loader_fresh_namespace_not_established")
    if value.mpfr_version != EXPECTED_MPFR_VERSION:
        _fail("runtime_mpfr_version_mismatch")
    if value.gmp_version != EXPECTED_GMP_VERSION:
        _fail("runtime_gmp_version_mismatch")
    if value.resolved_mpfr_symbols != REQUIRED_MPFR_SYMBOLS:
        _fail("runtime_mpfr_symbol_inventory_mismatch")
    if value.resolved_gmp_symbols != REQUIRED_GMP_SYMBOLS:
        _fail("runtime_gmp_symbol_inventory_mismatch")
    if type(value.abi) is not AbiObservation or not value.abi.abi_exact:
        _fail("runtime_native_abi_mismatch")
    if not value.required_gmp_dependency_inventory_exact:
        _fail("runtime_loader_mpfr_gmp_dependency_identity_mismatch")
    if (
        len(value.source_libraries) != 2
        or tuple(item.component for item in value.source_libraries)
        != ("gmp", "mpfr")
        or any(
            type(item) is not SourceLibraryBinding
            or item.source_inode_loaded_directly
            or not item.nofollow_segment_traversal
            or not item.single_link_regular_file
            or not (
                item.sha256_first_pass
                == item.sha256_second_pass
                == item.sha256_after_load
            )
            for item in value.source_libraries
        )
    ):
        _fail("runtime_source_binding_inventory_invalid")
    if (
        len(value.loaded_libraries) != 2
        or tuple(item.component for item in value.loaded_libraries)
        != ("gmp", "mpfr")
        or any(
            type(item) is not LoadedLibraryBinding
            or item.source_inode_loaded_directly
            or not item.seals_exact
            or not item.maps_device_inode_exact
            or not item.link_map_dladdr_exact
            for item in value.loaded_libraries
        )
    ):
        _fail("runtime_loaded_binding_inventory_invalid")
    return value


def _validate_provider_evidence(value: object) -> _ProviderEvidence:
    evidence = _validate_provider_inventory(value)
    if (
        evidence.native_provider_mechanics_observed
        or evidence.provider_kind != "synthetic_test_only"
    ):
        _fail("synthetic_provider_cannot_claim_native_evidence")
    return evidence


def _validate_native_provider_evidence(value: object) -> _ProviderEvidence:
    evidence = _validate_provider_inventory(value)
    if (
        evidence.native_provider_mechanics_observed is not True
        or evidence.provider_kind
        != "linux_x86_64_sealed_memfd_dlmopen_diagnostic/v1"
    ):
        _fail("native_provider_evidence_identity_invalid")
    return evidence


def _receipt(
    evidence: _ProviderEvidence,
    context: ContextObservation,
) -> _RuntimeConformanceReceipt:
    if (
        evidence.native_provider_mechanics_observed
        or evidence.provider_kind != "synthetic_test_only"
    ):
        _fail("synthetic_provider_cannot_claim_native_evidence")
    blockers = (
        "synthetic_test_provider_not_production_conformance",
    ) + AUTHORITY_BLOCKERS
    return _RuntimeConformanceReceipt(
        artifact_id=ARTIFACT_ID,
        contract_version=CONTRACT_VERSION,
        provider_kind=evidence.provider_kind,
        trusted_runtime_manifest_installed=False,
        trusted_runtime_manifest_binding=None,
        real_linux_glibc_integration_observed=False,
        calculation_only=True,
        runtime_conformance_diagnostic_only=True,
        linux_native_runtime_diagnostic_observed=False,
        production_runtime_conformance_observed=False,
        synthetic_test_provider=True,
        source_inode_loaded_directly=False,
        exact_source_bytes_copied_to_sealed_memfds=False,
        exact_sealed_loaded_required_symbol_identity_observed=False,
        fresh_loader_namespace=False,
        gmp_loaded_before_mpfr=False,
        mpfr_required_gmp_symbol_inventory_resolved_from_exact_sealed_copy=False,
        consumer_arithmetic_bound_to_conformed_runtime=False,
        transitive_runtime_closure_bound=False,
        namespace_id=evidence.namespace_id,
        mpfr_version=evidence.mpfr_version,
        gmp_version=evidence.gmp_version,
        required_mpfr_symbols=REQUIRED_MPFR_SYMBOLS,
        required_gmp_symbols=REQUIRED_GMP_SYMBOLS,
        source_libraries=evidence.source_libraries,
        loaded_libraries=evidence.loaded_libraries,
        abi=evidence.abi,
        context=context,
        implementation_blockers=blockers,
        runtime_conformance_authority=False,
        candidate_ready=False,
        execution_ready=False,
        execution_authority=False,
        replay_ready=False,
        replay_authority=False,
        publication_ready=False,
        publication_authority=False,
        scientific_preseal_authority=False,
        scientific_authority=False,
        independent_agreement=False,
        diagnostic_pass=False,
        semiclassical_stress_noise_lamp=False,
        semiclassical_constraint_algebra_lamp=False,
        theory_graph_promotion=False,
        physical_viability=False,
        propulsion=False,
        transport=False,
    )


def _observe_with_provider(
    request: _RuntimeConformanceRequest,
    provider: Any,
) -> _RuntimeConformanceReceipt:
    if not _RUNTIME_LOCK.acquire(blocking=False):
        _fail("exclusive_mpfr_context_lease_unavailable")
    try:
        if _CONTEXT_POISONED:
            _fail("runtime_context_poisoned", ",".join(_CONTEXT_POISON_REASONS))
        session: Any = None
        primary: BaseException | None = None
        context: ContextObservation | None = None
        evidence: _ProviderEvidence | None = None
        try:
            session = provider.open_runtime(request)
            evidence = _validate_provider_evidence(session.evidence)
            context = _run_context(evidence.api)
        except BaseException as error:
            primary = error
        cleanup_codes: tuple[str, ...] = ()
        if session is not None:
            try:
                observed_cleanup = session.close()
                if (
                    type(observed_cleanup) is not tuple
                    or len(observed_cleanup) > 16
                    or any(
                        type(item) is not str or len(item) > 128
                        for item in observed_cleanup
                    )
                ):
                    cleanup_codes = ("runtime_session_cleanup_result_invalid",)
                else:
                    cleanup_codes = tuple(dict.fromkeys(observed_cleanup))
            except BaseException as error:
                cleanup_codes = (
                    "runtime_session_cleanup_call_failed_" + _error_code(error),
                )
        if cleanup_codes:
            _poison(cleanup_codes)
            raise RuntimeConformanceError(
                "runtime_session_cleanup_failed",
                _error_code(primary) if primary is not None else None,
                cleanup_codes,
            )
        if primary is not None:
            raise primary
        if evidence is None or context is None:
            _fail("runtime_receipt_inputs_missing")
        return _receipt(evidence, context)
    finally:
        _RUNTIME_LOCK.release()


@dataclass(slots=True)
class _LeaseObjectState:
    reference: Any
    generation: int
    kind: str
    ordinal: int
    native: Any
    storage_identity: tuple[int, int] | None
    cleared: bool


@dataclass(slots=True)
class _LeaseState:
    token_reference: Any
    generation: int
    owner_thread_ident: int
    session: Any
    api: Any
    snapshot: _ContextSnapshot | None
    canary: CanaryObservation
    evidence: _ProviderEvidence
    manifest: _TrustedRuntimeManifestV1 | None
    synthetic: bool
    objects: dict[int, _LeaseObjectState]
    handles: list[Any]
    allocation_order: list[int]
    operation_trace: list[LeaseOperationObservation]
    mpfr_object_count: int
    mpz_object_count: int
    active: bool
    operation_failure: BaseException | None
    receipt: _RuntimeLeaseReceipt | None


_LEASE_STATES: dict[int, tuple[Any, _LeaseState, int]] = {}
_HANDLE_CONSTRUCTION_MARKER = object()


class _OwnedMpfr256:
    __slots__ = ("__weakref__",)

    def __new__(cls, marker: object = None):
        if marker is not _HANDLE_CONSTRUCTION_MARKER:
            _fail("runtime_lease_handle_construction_forbidden")
        return super().__new__(cls)

    def __copy__(self):
        raise TypeError("opaque MPFR lease handles cannot be copied")

    def __deepcopy__(self, _memo: object):
        raise TypeError("opaque MPFR lease handles cannot be copied")

    def __reduce_ex__(self, _protocol: int):
        raise TypeError("opaque MPFR lease handles cannot be serialized")


class _OwnedMpz:
    __slots__ = ("__weakref__",)

    def __new__(cls, marker: object = None):
        if marker is not _HANDLE_CONSTRUCTION_MARKER:
            _fail("runtime_lease_handle_construction_forbidden")
        return super().__new__(cls)

    def __copy__(self):
        raise TypeError("opaque MPZ lease handles cannot be copied")

    def __deepcopy__(self, _memo: object):
        raise TypeError("opaque MPZ lease handles cannot be copied")

    def __reduce_ex__(self, _protocol: int):
        raise TypeError("opaque MPZ lease handles cannot be serialized")


def _rounding(value: object) -> tuple[int, str]:
    names = {RNDN: "nearest_even", RNDU: "upward", RNDD: "downward"}
    if type(value) is not int or value not in names:
        _fail("runtime_lease_rounding_invalid")
    return value, names[value]


def _unsigned_long(value: object) -> int:
    if type(value) is not int or not 0 <= value <= (1 << 64) - 1:
        _fail("runtime_lease_unsigned_long_invalid")
    return value


def _signed_long(value: object) -> int:
    if type(value) is not int or not -(1 << 63) <= value < (1 << 63):
        _fail("runtime_lease_signed_long_invalid")
    return value


def _binary_exponent(value: object) -> int:
    if (
        type(value) is not int
        or not -MAX_ABS_BINARY_EXPONENT <= value <= MAX_ABS_BINARY_EXPONENT
    ):
        _fail("runtime_lease_binary_exponent_invalid")
    return value


def _finite_decimal(value: object) -> str:
    if (
        type(value) is not str
        or not 1 <= len(value) <= MAX_DECIMAL_LITERAL_BYTES
        or _FINITE_DECIMAL_RE.fullmatch(value) is None
    ):
        _fail("runtime_lease_finite_decimal_invalid")
    exponent_match = re.search(r"e([+-]?)([0-9]+)\Z", value)
    if exponent_match is not None:
        digits = exponent_match.group(2).lstrip("0") or "0"
        if len(digits) > 7 or int(digits) > MAX_ABS_BINARY_EXPONENT:
            _fail("runtime_lease_decimal_exponent_invalid")
    return value


def _integer_decimal(value: object) -> str:
    if (
        type(value) is not str
        or not 1 <= len(value) <= MAX_INTEGER_DECIMAL_BYTES
        or _INTEGER_DECIMAL_RE.fullmatch(value) is None
    ):
        _fail("runtime_lease_integer_decimal_invalid")
    return value


def _operation_trace_sha256(
    trace: tuple[LeaseOperationObservation, ...],
) -> str:
    payload = [
        {
            "destinationOrdinal": item.destination_ordinal,
            "forbiddenFlagsClear": item.forbidden_flags_clear,
            "inexactFlag": item.inexact_flag,
            "operation": item.operation,
            "ordinal": item.ordinal,
            "rounding": item.rounding,
            "sourceOrdinals": item.source_ordinals,
            "ternaryResult": item.ternary_result,
        }
        for item in trace
    ]
    canonical = json.dumps(
        payload,
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("ascii")
    domain = b"nhm2-spherical-boson-star-v2/runtime-lease-operation-trace/v1\n"
    return hashlib.sha256(
        domain + struct.pack("<Q", len(canonical)) + canonical
    ).hexdigest()


def _resolve_lease(
    token: object, *, require_active: bool = True
) -> _LeaseState:
    entry = _LEASE_STATES.get(id(token))
    if entry is None:
        _fail("runtime_lease_token_unknown")
    reference, state, generation = entry
    if (
        reference() is not token
        or state.token_reference is not reference
        or state.generation != generation
    ):
        _fail("runtime_lease_token_identity_mismatch")
    if state.owner_thread_ident != threading.get_ident():
        _fail("runtime_lease_owner_thread_mismatch")
    if require_active and not state.active:
        _fail("runtime_lease_not_active")
    return state


def _resolve_owned(
    state: _LeaseState, handle: object, expected_kind: str
) -> _LeaseObjectState:
    expected_type = _OwnedMpfr256 if expected_kind == "mpfr" else _OwnedMpz
    if type(handle) is not expected_type:
        _fail("runtime_lease_object_type_invalid", expected_kind)
    owned = state.objects.get(id(handle))
    if (
        owned is None
        or owned.reference() is not handle
        or owned.generation != state.generation
        or owned.kind != expected_kind
        or owned.cleared
    ):
        _fail("runtime_lease_object_identity_invalid", expected_kind)
    if expected_kind == "mpfr":
        try:
            observed_identity = state.api.lease_mpfr_storage_identity(
                owned.native
            )
        except BaseException as error:
            wrapped = RuntimeConformanceError(
                "runtime_lease_storage_identity_observation_failed",
                _error_code(error),
            )
            raise _mark_operation_failure(state, wrapped) from error
        if (
            type(observed_identity) is not tuple
            or len(observed_identity) != 2
            or any(type(item) is not int or item <= 0 for item in observed_identity)
            or observed_identity != owned.storage_identity
        ):
            raise _mark_operation_failure(
                state,
                RuntimeConformanceError("runtime_lease_storage_identity_drift"),
            )
    return owned


def _mark_operation_failure(
    state: _LeaseState, error: BaseException
) -> BaseException:
    if state.operation_failure is None:
        state.operation_failure = error
    return error


def _record_operation(
    state: _LeaseState,
    operation: str,
    rounding: str | None,
    destination: _LeaseObjectState | None,
    sources: tuple[_LeaseObjectState, ...],
    ternary: int | None,
    inexact: bool,
) -> None:
    if operation not in SI_LEASE_OPERATION_INVENTORY:
        _fail("runtime_lease_operation_inventory_violation")
    if len(state.operation_trace) >= MAX_LEASE_OPERATIONS:
        error = RuntimeConformanceError("runtime_lease_operation_limit_exceeded")
        raise _mark_operation_failure(state, error)
    state.operation_trace.append(
        LeaseOperationObservation(
            ordinal=len(state.operation_trace) + 1,
            operation=operation,
            rounding=rounding,
            destination_ordinal=(destination.ordinal if destination else None),
            source_ordinals=tuple(item.ordinal for item in sources),
            ternary_result=ternary,
            inexact_flag=inexact,
            forbidden_flags_clear=True,
        )
    )


def _run_lease_operation(
    state: _LeaseState,
    operation: str,
    call: Any,
    *,
    rounding: str | None = None,
    destination: _LeaseObjectState | None = None,
    sources: tuple[_LeaseObjectState, ...] = (),
    ternary_result: bool = False,
) -> Any:
    if state.operation_failure is not None:
        _fail("runtime_lease_already_failed")
    api = state.api
    primary: BaseException | None = None
    result: Any = None
    flags: tuple[bool, ...] | None = None
    try:
        api.clear_flags()
        result = call()
        observed = tuple(api.flags())
        if len(observed) != 6 or any(type(item) is not bool for item in observed):
            _fail("runtime_lease_flag_observation_invalid")
        flags = observed
    except BaseException as error:
        primary = error
    flags_cleanup_error: BaseException | None = None
    try:
        api.clear_flags()
        if tuple(api.flags()) != (False,) * 6:
            _fail("runtime_lease_flags_cleanup_mismatch")
    except BaseException as error:
        flags_cleanup_error = error
    if flags_cleanup_error is not None:
        _poison(("runtime_lease_flags_cleanup_unverified",))
        error = RuntimeConformanceError(
            "runtime_lease_flags_cleanup_failed",
            _error_code(primary) if primary is not None else None,
            (_error_code(flags_cleanup_error),),
        )
        raise _mark_operation_failure(state, error)
    if primary is not None:
        if isinstance(primary, RuntimeConformanceError):
            error = primary
        else:
            error = RuntimeConformanceError(
                "runtime_lease_operation_call_failed",
                operation + "_" + _error_code(primary),
            )
        raise _mark_operation_failure(state, error)
    assert flags is not None
    if any(flags[index] for index in (0, 1, 2, 3, 5)):
        error = RuntimeConformanceError(
            "runtime_lease_operation_forbidden_flag_set", operation
        )
        raise _mark_operation_failure(state, error)
    ternary: int | None = None
    if ternary_result:
        if type(result) is not int:
            error = RuntimeConformanceError(
                "runtime_lease_ternary_result_invalid", operation
            )
            raise _mark_operation_failure(state, error)
        ternary = (result > 0) - (result < 0)
        if (ternary == 0) is not (flags[4] is False):
            error = RuntimeConformanceError(
                "runtime_lease_ternary_inexact_flag_mismatch", operation
            )
            raise _mark_operation_failure(state, error)
    _record_operation(
        state,
        operation,
        rounding,
        destination,
        sources,
        ternary,
        flags[4],
    )
    return ternary if ternary_result else result


def _allocate_owned(state: _LeaseState, kind: str) -> object:
    if state.operation_failure is not None:
        _fail("runtime_lease_already_failed")
    if len(state.objects) >= MAX_LEASE_OBJECTS:
        error = RuntimeConformanceError("runtime_lease_object_limit_exceeded")
        raise _mark_operation_failure(state, error)
    operation = "allocate_mpfr256" if kind == "mpfr" else "allocate_mpz"
    native: Any = None
    try:
        native = (
            state.api.lease_new_mpfr()
            if kind == "mpfr"
            else state.api.lease_new_mpz()
        )
        handle = (
            _OwnedMpfr256(_HANDLE_CONSTRUCTION_MARKER)
            if kind == "mpfr"
            else _OwnedMpz(_HANDLE_CONSTRUCTION_MARKER)
        )
        reference = weakref.ref(handle)
        ordinal = len(state.allocation_order) + 1
        storage_identity: tuple[int, int] | None = None
        if kind == "mpfr":
            observed_precision = state.api.lease_mpfr_precision(native)
            observed_identity = state.api.lease_mpfr_storage_identity(native)
            if (
                type(observed_precision) is not int
                or observed_precision != PRECISION_BITS
            ):
                _fail("runtime_lease_mpfr_precision_invalid")
            if (
                type(observed_identity) is not tuple
                or len(observed_identity) != 2
                or any(
                    type(item) is not int or item <= 0
                    for item in observed_identity
                )
                or any(
                    item.kind == "mpfr"
                    and item.storage_identity is not None
                    and (
                        item.storage_identity[0] == observed_identity[0]
                        or item.storage_identity[1] == observed_identity[1]
                    )
                    for item in state.objects.values()
                )
            ):
                _fail("runtime_lease_mpfr_storage_nonalias_not_established")
            storage_identity = observed_identity
        owned = _LeaseObjectState(
            reference=reference,
            generation=state.generation,
            kind=kind,
            ordinal=ordinal,
            native=native,
            storage_identity=storage_identity,
            cleared=False,
        )
        state.objects[id(handle)] = owned
        state.handles.append(handle)
        state.allocation_order.append(id(handle))
        if kind == "mpfr":
            state.mpfr_object_count += 1
        else:
            state.mpz_object_count += 1
        _record_operation(state, operation, None, owned, (), None, False)
        return handle
    except BaseException as error:
        if native is not None and not any(
            item.native is native for item in state.objects.values()
        ):
            try:
                if kind == "mpfr":
                    state.api.lease_clear_mpfr(native)
                else:
                    state.api.lease_clear_mpz(native)
            except BaseException as cleanup_error:
                _poison(("runtime_lease_failed_allocation_cleanup_unverified",))
                wrapped = RuntimeConformanceError(
                    "runtime_lease_failed_allocation_cleanup_failed",
                    _error_code(error),
                    (_error_code(cleanup_error),),
                )
                raise _mark_operation_failure(state, wrapped)
        if isinstance(error, RuntimeConformanceError):
            wrapped = error
        else:
            wrapped = RuntimeConformanceError(
                "runtime_lease_object_allocation_failed",
                kind + "_" + _error_code(error),
            )
        raise _mark_operation_failure(state, wrapped)


def _require_distinct_destination(
    destination: _LeaseObjectState,
    sources: tuple[_LeaseObjectState, ...],
) -> None:
    if any(destination is source for source in sources):
        _fail("runtime_lease_destination_source_alias_forbidden")


class _Mpfr256RuntimeLease:
    __slots__ = ("__weakref__",)

    def __new__(cls, marker: object = None):
        if marker is not _HANDLE_CONSTRUCTION_MARKER:
            _fail("runtime_lease_token_construction_forbidden")
        return super().__new__(cls)

    def __enter__(self):
        _resolve_lease(self)
        return self

    def __exit__(self, _error_type, error, _traceback) -> bool:
        state = _resolve_lease(self, require_active=False)
        _finalize_lease_state(state, error)
        return False

    def __copy__(self):
        raise TypeError("opaque runtime leases cannot be copied")

    def __deepcopy__(self, _memo: object):
        raise TypeError("opaque runtime leases cannot be copied")

    def __reduce_ex__(self, _protocol: int):
        raise TypeError("opaque runtime leases cannot be serialized")

    def close(self) -> _RuntimeLeaseReceipt:
        return _close_runtime_lease(self, None)

    @property
    def receipt(self) -> _RuntimeLeaseReceipt:
        state = _resolve_lease(self, require_active=False)
        if state.active or state.receipt is None:
            _fail("runtime_lease_receipt_unavailable")
        _validated_lease_receipt_snapshot(state.receipt)
        return state.receipt

    def validated_receipt_snapshot(self) -> tuple[str, str]:
        state = _resolve_lease(self, require_active=False)
        if state.active or state.receipt is None:
            _fail("runtime_lease_receipt_unavailable")
        return _validated_lease_receipt_snapshot(state.receipt)

    def allocate_mpfr256(self) -> object:
        return _allocate_owned(_resolve_lease(self), "mpfr")

    def allocate_mpz(self) -> object:
        return _allocate_owned(_resolve_lease(self), "mpz")

    def mpz_set_ui(self, destination: object, value: object) -> None:
        state = _resolve_lease(self)
        owned = _resolve_owned(state, destination, "mpz")
        bounded = _unsigned_long(value)
        _run_lease_operation(
            state,
            "mpz_set_ui",
            lambda: state.api.lease_mpz_set_ui(owned.native, bounded),
            destination=owned,
        )

    def mpz_set_si(self, destination: object, value: object) -> None:
        state = _resolve_lease(self)
        owned = _resolve_owned(state, destination, "mpz")
        bounded = _signed_long(value)
        _run_lease_operation(
            state,
            "mpz_set_si",
            lambda: state.api.lease_mpz_set_si(owned.native, bounded),
            destination=owned,
        )

    def mpz_set_decimal(self, destination: object, value: object) -> None:
        state = _resolve_lease(self)
        owned = _resolve_owned(state, destination, "mpz")
        bounded = _integer_decimal(value)

        def invoke() -> None:
            if state.api.lease_mpz_set_decimal(owned.native, bounded) != 0:
                _fail("runtime_lease_mpz_decimal_parse_failed")

        _run_lease_operation(
            state,
            "mpz_set_decimal",
            invoke,
            destination=owned,
        )

    def mpz_decimal(self, source: object) -> str:
        state = _resolve_lease(self)
        owned = _resolve_owned(state, source, "mpz")

        def invoke() -> str:
            return _integer_decimal(state.api.lease_mpz_decimal(owned.native))

        return _run_lease_operation(
            state,
            "mpz_decimal",
            invoke,
            sources=(owned,),
        )

    def mpfr_set_ui(
        self, destination: object, value: object, rounding: object
    ) -> int:
        state = _resolve_lease(self)
        owned = _resolve_owned(state, destination, "mpfr")
        bounded = _unsigned_long(value)
        mode, name = _rounding(rounding)
        return _run_lease_operation(
            state,
            "mpfr_set_ui",
            lambda: state.api.lease_mpfr_set_ui(owned.native, bounded, mode),
            rounding=name,
            destination=owned,
            ternary_result=True,
        )

    def mpfr_set_si(
        self, destination: object, value: object, rounding: object
    ) -> int:
        state = _resolve_lease(self)
        owned = _resolve_owned(state, destination, "mpfr")
        bounded = _signed_long(value)
        mode, name = _rounding(rounding)
        return _run_lease_operation(
            state,
            "mpfr_set_si",
            lambda: state.api.lease_mpfr_set_si(owned.native, bounded, mode),
            rounding=name,
            destination=owned,
            ternary_result=True,
        )

    def mpfr_set_decimal(
        self, destination: object, value: object, rounding: object
    ) -> None:
        state = _resolve_lease(self)
        owned = _resolve_owned(state, destination, "mpfr")
        bounded = _finite_decimal(value)
        mode, name = _rounding(rounding)
        def invoke() -> None:
            status = state.api.lease_mpfr_set_decimal(
                owned.native, bounded, mode
            )
            if type(status) is not int or status != 0:
                _fail("runtime_lease_mpfr_decimal_parse_failed")

        _run_lease_operation(
            state,
            "mpfr_set_decimal",
            invoke,
            rounding=name,
            destination=owned,
        )

    def mpfr_set_z(
        self, destination: object, source: object, rounding: object
    ) -> int:
        state = _resolve_lease(self)
        target = _resolve_owned(state, destination, "mpfr")
        operand = _resolve_owned(state, source, "mpz")
        mode, name = _rounding(rounding)
        return _run_lease_operation(
            state,
            "mpfr_set_z",
            lambda: state.api.lease_mpfr_set_z(
                target.native, operand.native, mode
            ),
            rounding=name,
            destination=target,
            sources=(operand,),
            ternary_result=True,
        )

    def mpfr_set(
        self, destination: object, source: object, rounding: object
    ) -> int:
        state = _resolve_lease(self)
        target = _resolve_owned(state, destination, "mpfr")
        operand = _resolve_owned(state, source, "mpfr")
        _require_distinct_destination(target, (operand,))
        mode, name = _rounding(rounding)
        return _run_lease_operation(
            state,
            "mpfr_set",
            lambda: state.api.lease_mpfr_set(
                target.native, operand.native, mode
            ),
            rounding=name,
            destination=target,
            sources=(operand,),
            ternary_result=True,
        )

    def mpfr_mul_2si(
        self,
        destination: object,
        source: object,
        exponent2: object,
        rounding: object,
    ) -> int:
        state = _resolve_lease(self)
        target = _resolve_owned(state, destination, "mpfr")
        operand = _resolve_owned(state, source, "mpfr")
        _require_distinct_destination(target, (operand,))
        exponent = _binary_exponent(exponent2)
        mode, name = _rounding(rounding)
        return _run_lease_operation(
            state,
            "mpfr_mul_2si",
            lambda: state.api.lease_mpfr_mul_2si(
                target.native, operand.native, exponent, mode
            ),
            rounding=name,
            destination=target,
            sources=(operand,),
            ternary_result=True,
        )

    def _binary(
        self,
        operation: str,
        destination: object,
        left: object,
        right: object,
        rounding: object,
    ) -> int:
        if operation not in {"mpfr_add", "mpfr_sub", "mpfr_mul", "mpfr_div"}:
            _fail("runtime_lease_operation_inventory_violation")
        state = _resolve_lease(self)
        target = _resolve_owned(state, destination, "mpfr")
        left_operand = _resolve_owned(state, left, "mpfr")
        right_operand = _resolve_owned(state, right, "mpfr")
        _require_distinct_destination(target, (left_operand, right_operand))
        mode, name = _rounding(rounding)
        native_operation = getattr(state.api, "lease_" + operation)
        return _run_lease_operation(
            state,
            operation,
            lambda: native_operation(
                target.native,
                left_operand.native,
                right_operand.native,
                mode,
            ),
            rounding=name,
            destination=target,
            sources=(left_operand, right_operand),
            ternary_result=True,
        )

    def mpfr_add(
        self, destination: object, left: object, right: object, rounding: object
    ) -> int:
        return self._binary("mpfr_add", destination, left, right, rounding)

    def mpfr_sub(
        self, destination: object, left: object, right: object, rounding: object
    ) -> int:
        return self._binary("mpfr_sub", destination, left, right, rounding)

    def mpfr_mul(
        self, destination: object, left: object, right: object, rounding: object
    ) -> int:
        return self._binary("mpfr_mul", destination, left, right, rounding)

    def mpfr_div(
        self, destination: object, left: object, right: object, rounding: object
    ) -> int:
        return self._binary("mpfr_div", destination, left, right, rounding)

    def mpfr_sqrt(
        self, destination: object, source: object, rounding: object
    ) -> int:
        state = _resolve_lease(self)
        target = _resolve_owned(state, destination, "mpfr")
        operand = _resolve_owned(state, source, "mpfr")
        _require_distinct_destination(target, (operand,))
        mode, name = _rounding(rounding)
        return _run_lease_operation(
            state,
            "mpfr_sqrt",
            lambda: state.api.lease_mpfr_sqrt(
                target.native, operand.native, mode
            ),
            rounding=name,
            destination=target,
            sources=(operand,),
            ternary_result=True,
        )

    def mpfr_const_pi(self, destination: object, rounding: object) -> int:
        state = _resolve_lease(self)
        target = _resolve_owned(state, destination, "mpfr")
        mode, name = _rounding(rounding)
        return _run_lease_operation(
            state,
            "mpfr_const_pi",
            lambda: state.api.lease_mpfr_const_pi(target.native, mode),
            rounding=name,
            destination=target,
            ternary_result=True,
        )

    def mpfr_compare(self, left: object, right: object) -> int:
        state = _resolve_lease(self)
        left_operand = _resolve_owned(state, left, "mpfr")
        right_operand = _resolve_owned(state, right, "mpfr")

        def invoke() -> int:
            observed = state.api.lease_mpfr_compare(
                left_operand.native, right_operand.native
            )
            if type(observed) is not int:
                _fail("runtime_lease_compare_result_invalid")
            return (observed > 0) - (observed < 0)

        return _run_lease_operation(
            state,
            "mpfr_compare",
            invoke,
            sources=(left_operand, right_operand),
        )

    def mpfr_compare_ui(self, left: object, right: object) -> int:
        state = _resolve_lease(self)
        operand = _resolve_owned(state, left, "mpfr")
        bounded = _unsigned_long(right)

        def invoke() -> int:
            observed = state.api.lease_mpfr_compare_ui(
                operand.native, bounded
            )
            if type(observed) is not int:
                _fail("runtime_lease_compare_result_invalid")
            return (observed > 0) - (observed < 0)

        return _run_lease_operation(
            state,
            "mpfr_compare_ui",
            invoke,
            sources=(operand,),
        )

    def mpfr_compare_z(self, left: object, right: object) -> int:
        state = _resolve_lease(self)
        operand = _resolve_owned(state, left, "mpfr")
        integer = _resolve_owned(state, right, "mpz")

        def invoke() -> int:
            observed = state.api.lease_mpfr_compare_z(
                operand.native, integer.native
            )
            if type(observed) is not int:
                _fail("runtime_lease_compare_result_invalid")
            return (observed > 0) - (observed < 0)

        return _run_lease_operation(
            state,
            "mpfr_compare_z",
            invoke,
            sources=(operand, integer),
        )

    def mpfr_equal(self, left: object, right: object) -> bool:
        state = _resolve_lease(self)
        left_operand = _resolve_owned(state, left, "mpfr")
        right_operand = _resolve_owned(state, right, "mpfr")

        def invoke() -> bool:
            observed = state.api.lease_mpfr_equal(
                left_operand.native, right_operand.native
            )
            if type(observed) is not bool:
                _fail("runtime_lease_equal_result_invalid")
            return observed

        return _run_lease_operation(
            state,
            "mpfr_equal",
            invoke,
            sources=(left_operand, right_operand),
        )

    def mpfr_get_z_2exp(self, destination: object, source: object) -> int:
        state = _resolve_lease(self)
        target = _resolve_owned(state, destination, "mpz")
        operand = _resolve_owned(state, source, "mpfr")

        def invoke() -> int:
            observed = state.api.lease_mpfr_get_z_2exp(
                target.native, operand.native
            )
            return _binary_exponent(observed)

        return _run_lease_operation(
            state,
            "mpfr_get_z_2exp",
            invoke,
            destination=target,
            sources=(operand,),
        )

    def mpfr_get_d(self, source: object, rounding: object) -> float:
        state = _resolve_lease(self)
        operand = _resolve_owned(state, source, "mpfr")
        mode, name = _rounding(rounding)

        def invoke() -> float:
            observed = state.api.lease_mpfr_get_d(operand.native, mode)
            if type(observed) is not float or not math.isfinite(observed):
                _fail("runtime_lease_binary64_result_invalid")
            return observed

        return _run_lease_operation(
            state,
            "mpfr_get_d",
            invoke,
            rounding=name,
            sources=(operand,),
        )

    def mpfr_number(self, source: object) -> bool:
        state = _resolve_lease(self)
        operand = _resolve_owned(state, source, "mpfr")

        def invoke() -> bool:
            observed = state.api.lease_mpfr_number(operand.native)
            if type(observed) is not bool:
                _fail("runtime_lease_number_result_invalid")
            return observed

        return _run_lease_operation(
            state,
            "mpfr_number",
            invoke,
            sources=(operand,),
        )

    def mpfr_precision(self, source: object) -> int:
        state = _resolve_lease(self)
        operand = _resolve_owned(state, source, "mpfr")

        def invoke() -> int:
            observed = state.api.lease_mpfr_precision(operand.native)
            if type(observed) is not int or observed != PRECISION_BITS:
                _fail("runtime_lease_precision_result_invalid")
            return observed

        return _run_lease_operation(
            state,
            "mpfr_precision",
            invoke,
            sources=(operand,),
        )


def _validate_evidence_request_binding(
    evidence: _ProviderEvidence, request: _RuntimeConformanceRequest
) -> None:
    for binding, expectation in zip(
        evidence.source_libraries, (request.gmp, request.mpfr), strict=True
    ):
        if (
            binding.component != expectation.component
            or binding.canonical_path != expectation.absolute_path
            or binding.identity.size_bytes != expectation.size_bytes
            or binding.sha256_first_pass != expectation.sha256
            or binding.sha256_second_pass != expectation.sha256
            or binding.sha256_after_load != expectation.sha256
        ):
            _fail("runtime_lease_source_request_binding_mismatch")
    for binding, expectation in zip(
        evidence.loaded_libraries, (request.gmp, request.mpfr), strict=True
    ):
        if (
            binding.component != expectation.component
            or binding.identity.size_bytes != expectation.size_bytes
            or binding.sha256 != expectation.sha256
        ):
            _fail("runtime_lease_loaded_request_binding_mismatch")


def _prepare_live_context(
    api: Any, snapshot: _ContextSnapshot
) -> CanaryObservation:
    if snapshot.emin > CONFIGURED_EMIN or snapshot.emax < CONFIGURED_EMAX:
        _fail("runtime_context_saved_range_does_not_contain_configured_range")
    _configure_context(api)
    canary = api.run_canary()
    if type(canary) is not CanaryObservation:
        _fail("runtime_canary_observation_type_invalid")
    if (
        canary.precision_bits != PRECISION_BITS
        or not canary.strict_interval_observed
        or not canary.inexact_flag_observed
        or not canary.forbidden_flags_clear
        or not canary.reverse_cleanup_complete
    ):
        _fail("runtime_canary_observation_invalid")
    if tuple(api.flags()) != (False,) * 6:
        _fail("runtime_canary_exit_flags_not_clear")
    return canary


def _session_cleanup_codes(session: Any) -> tuple[str, ...]:
    try:
        observed = session.close()
    except BaseException as error:
        return ("runtime_session_cleanup_call_failed_" + _error_code(error),)
    if (
        type(observed) is not tuple
        or len(observed) > 16
        or any(type(item) is not str or len(item) > 128 for item in observed)
    ):
        return ("runtime_session_cleanup_result_invalid",)
    return tuple(dict.fromkeys(observed))


def _lease_receipt(state: _LeaseState) -> _RuntimeLeaseReceipt:
    trace = tuple(state.operation_trace)
    manifest = state.manifest
    synthetic = state.synthetic
    receipt = _RuntimeLeaseReceipt(
        artifact_id=ARTIFACT_ID,
        contract_version=CONTRACT_VERSION,
        provider_kind=state.evidence.provider_kind,
        trusted_manifest_installed=not synthetic,
        trusted_manifest_sha256=(
            None if manifest is None else manifest.manifest_sha256
        ),
        trusted_manifest_size_bytes=(
            None if manifest is None else manifest.canonical_size_bytes
        ),
        real_linux_glibc_integration_observed=not synthetic,
        synthetic_test_provider=synthetic,
        calculation_only=True,
        runtime_conformance_diagnostic_only=True,
        operations_issued_through_this_live_lease=bool(trace),
        safe_finite_number_predicate_exposed=True,
        precision_256_verified_for_every_allocated_mpfr_object=True,
        storage_nonalias_verified_for_every_allocated_mpfr_object=True,
        semantic_si_operation_labels_bound=False,
        expected_directed_rounded_operation_count=(
            SI_EXPECTED_DIRECTED_ROUNDED_OPERATION_COUNT
        ),
        expected_central_rndn_operation_count=(
            SI_EXPECTED_CENTRAL_RNDN_OPERATION_COUNT
        ),
        expected_terminal_get_d_count=SI_EXPECTED_TERMINAL_GET_D_COUNT,
        expected_total_rounded_operation_count=(
            SI_EXPECTED_TOTAL_ROUNDED_OPERATION_COUNT
        ),
        observed_rounded_operation_count=sum(
            item.rounding is not None for item in trace
        ),
        observed_terminal_get_d_count=sum(
            item.operation == "mpfr_get_d" for item in trace
        ),
        operation_inventory=SI_LEASE_OPERATION_INVENTORY,
        operation_trace=trace,
        operation_trace_sha256=_operation_trace_sha256(trace),
        generation=state.generation,
        mpfr_object_count=state.mpfr_object_count,
        mpz_object_count=state.mpz_object_count,
        reverse_object_clear_complete=True,
        context_restored_exact=True,
        flags_restored_exact=True,
        runtime_unloaded_and_fds_closed=True,
        lifecycle_complete=True,
        canary=state.canary,
        source_libraries=state.evidence.source_libraries,
        loaded_libraries=state.evidence.loaded_libraries,
        abi=state.evidence.abi,
        implementation_blockers=(
            SYNTHETIC_LEASE_BLOCKERS if synthetic else NATIVE_LEASE_BLOCKERS
        ),
        runtime_conformance_authority=False,
        candidate_ready=False,
        execution_ready=False,
        execution_authority=False,
        replay_ready=False,
        replay_authority=False,
        publication_ready=False,
        publication_authority=False,
        scientific_preseal_authority=False,
        scientific_authority=False,
        independent_agreement=False,
        diagnostic_pass=False,
        semiclassical_stress_noise_lamp=False,
        semiclassical_constraint_algebra_lamp=False,
        theory_graph_promotion=False,
        physical_viability=False,
        propulsion=False,
        transport=False,
    )
    return _mint_lease_receipt(receipt)


def _finalize_lease_state(
    state: _LeaseState, consumer_error: BaseException | None
) -> _RuntimeLeaseReceipt | None:
    if not state.active:
        if state.receipt is not None:
            _validated_lease_receipt_snapshot(state.receipt)
            return state.receipt
        _fail("runtime_lease_receipt_unavailable")
    state.active = False
    cleanup: list[str] = []

    def remember(code: str) -> None:
        bounded = _bounded_text(code, 128)
        if bounded not in cleanup and len(cleanup) < 16:
            cleanup.append(bounded)

    if state.owner_thread_ident != threading.get_ident():
        remember("runtime_lease_owner_thread_lost")

    try:
        for object_id in reversed(state.allocation_order):
            owned = state.objects.get(object_id)
            if owned is None:
                remember("runtime_lease_object_inventory_drift")
                continue
            if owned.cleared:
                continue
            if owned.kind == "mpfr":
                try:
                    observed_identity = state.api.lease_mpfr_storage_identity(
                        owned.native
                    )
                    if observed_identity != owned.storage_identity:
                        remember(
                            f"mpfr_object_{owned.ordinal}_storage_identity_drift"
                        )
                except BaseException:
                    remember(
                        f"mpfr_object_{owned.ordinal}_storage_identity_unverified"
                    )
            try:
                if owned.kind == "mpfr":
                    state.api.lease_clear_mpfr(owned.native)
                else:
                    state.api.lease_clear_mpz(owned.native)
            except BaseException:
                remember(f"{owned.kind}_object_{owned.ordinal}_clear_failed")
            finally:
                owned.cleared = True
                owned.native = None
        try:
            state.api.free_cache()
        except BaseException as error:
            remember("mpfr_cache_cleanup_failed_" + _error_code(error))
        snapshot = state.snapshot
        if snapshot is None:
            remember("runtime_context_snapshot_missing_during_cleanup")
        else:
            try:
                recovery = _restore_context(state.api, snapshot)
                for code in recovery.observed_failures:
                    remember(code)
                for code in recovery.unresolved:
                    remember(code)
            except BaseException as error:
                remember("runtime_context_restore_call_failed_" + _error_code(error))
        for code in _session_cleanup_codes(state.session):
            remember(code)
    finally:
        state.snapshot = None
        state.evidence = _provider_evidence_without_api(state.evidence)
        state.api = None
        state.session = None
        state.objects.clear()
        state.handles.clear()
        state.allocation_order.clear()
        _RUNTIME_LOCK.release()
    if cleanup:
        _poison(tuple(cleanup))
        state.receipt = None
        raise RuntimeConformanceError(
            "runtime_lease_cleanup_failed",
            _error_code(consumer_error) if consumer_error is not None else None,
            tuple(cleanup),
        )
    if consumer_error is not None:
        state.receipt = None
        return None
    if state.operation_failure is not None:
        state.receipt = None
        raise state.operation_failure
    try:
        state.receipt = _lease_receipt(state)
    except BaseException as error:
        state.receipt = None
        raise RuntimeConformanceError(
            "runtime_lease_receipt_construction_failed", _error_code(error)
        ) from error
    return state.receipt


def _close_runtime_lease(
    token: object, consumer_error: BaseException | None
) -> _RuntimeLeaseReceipt:
    state = _resolve_lease(token, require_active=False)
    receipt = _finalize_lease_state(state, consumer_error)
    if receipt is None:
        _fail("runtime_lease_receipt_unavailable")
    _validated_lease_receipt_snapshot(receipt)
    return receipt


def _lease_token_collected(token_id: int, reference: Any) -> None:
    entry = _LEASE_STATES.get(token_id)
    if entry is None or entry[0] is not reference:
        return
    state = entry[1]
    try:
        if state.active:
            _finalize_lease_state(
                state, RuntimeConformanceError("runtime_lease_abandoned")
            )
    except BaseException:
        pass
    finally:
        current = _LEASE_STATES.get(token_id)
        if current is not None and current[0] is reference:
            _LEASE_STATES.pop(token_id, None)


def _register_lease(
    session: Any,
    evidence: _ProviderEvidence,
    snapshot: _ContextSnapshot,
    canary: CanaryObservation,
    manifest: _TrustedRuntimeManifestV1 | None,
    synthetic: bool,
) -> _Mpfr256RuntimeLease:
    global _LEASE_GENERATION
    _LEASE_GENERATION += 1
    generation = _LEASE_GENERATION
    token = _Mpfr256RuntimeLease(_HANDLE_CONSTRUCTION_MARKER)
    token_id = id(token)

    def collected(reference: Any) -> None:
        _lease_token_collected(token_id, reference)

    reference = weakref.ref(token, collected)
    state = _LeaseState(
        token_reference=reference,
        generation=generation,
        owner_thread_ident=threading.get_ident(),
        session=session,
        api=evidence.api,
        snapshot=snapshot,
        canary=canary,
        evidence=evidence,
        manifest=manifest,
        synthetic=synthetic,
        objects={},
        handles=[],
        allocation_order=[],
        operation_trace=[],
        mpfr_object_count=0,
        mpz_object_count=0,
        active=True,
        operation_failure=None,
        receipt=None,
    )
    _LEASE_STATES[token_id] = (reference, state, generation)
    return token


def _acquire_runtime_lease(
    request: _RuntimeConformanceRequest,
    provider: Any,
    manifest: _TrustedRuntimeManifestV1 | None,
    *,
    synthetic: bool,
) -> _Mpfr256RuntimeLease:
    request = _require_request(request)
    if synthetic:
        if manifest is not None:
            _fail("synthetic_lease_manifest_forbidden")
    elif (
        type(manifest) is not _TrustedRuntimeManifestV1
        or type(provider) is not _LinuxNativeProvider
        or manifest.gmp != request.gmp
        or manifest.mpfr != request.mpfr
    ):
        _fail("native_lease_literal_manifest_binding_invalid")
    else:
        manifest = _require_trusted_manifest(manifest)
    if not _RUNTIME_LOCK.acquire(blocking=False):
        _fail("exclusive_mpfr_context_lease_unavailable")
    session: Any = None
    api: Any = None
    snapshot: _ContextSnapshot | None = None
    primary: BaseException | None = None
    try:
        if _CONTEXT_POISONED:
            _fail("runtime_context_poisoned", ",".join(_CONTEXT_POISON_REASONS))
        session = provider.open_runtime(request)
        evidence = (
            _validate_provider_evidence(session.evidence)
            if synthetic
            else _validate_native_provider_evidence(session.evidence)
        )
        _validate_evidence_request_binding(evidence, request)
        api = evidence.api
        snapshot = _capture_context(api)
        canary = _prepare_live_context(api, snapshot)
        return _register_lease(
            session, evidence, snapshot, canary, manifest, synthetic
        )
    except BaseException as error:
        primary = error
    cleanup: list[str] = []
    if api is not None and snapshot is not None:
        try:
            api.free_cache()
        except BaseException as error:
            cleanup.append("mpfr_cache_cleanup_failed_" + _error_code(error))
        try:
            recovery = _restore_context(api, snapshot)
            cleanup.extend(recovery.observed_failures)
            cleanup.extend(recovery.unresolved)
        except BaseException as error:
            cleanup.append(
                "runtime_context_restore_call_failed_" + _error_code(error)
            )
    if session is not None:
        cleanup.extend(_session_cleanup_codes(session))
    cleanup = list(dict.fromkeys(cleanup))[:16]
    _RUNTIME_LOCK.release()
    if (
        isinstance(primary, RuntimeConformanceError)
        and primary.code == "runtime_canary_cleanup_failed"
    ):
        _poison(("canary_cleanup_unverified",))
    if cleanup:
        _poison(tuple(cleanup))
        raise RuntimeConformanceError(
            "runtime_lease_acquisition_cleanup_failed",
            _error_code(primary) if primary is not None else None,
            tuple(cleanup),
        )
    if primary is None:
        _fail("runtime_lease_acquisition_failure_missing")
    if isinstance(primary, RuntimeConformanceError):
        raise primary
    raise RuntimeConformanceError(
        "runtime_lease_acquisition_failed", _error_code(primary)
    ) from primary


def acquire_mpfr256_runtime_lease() -> object:
    """Acquire the literal-manifest runtime or fail before native traversal."""

    _require_linux_x86_64()
    literal = _TRUSTED_RUNTIME_MANIFEST_LITERAL
    if literal is None:
        _fail("trusted_runtime_manifest_not_installed")
    manifest = _require_trusted_manifest(literal)
    request = _RuntimeConformanceRequest(gmp=manifest.gmp, mpfr=manifest.mpfr)
    return _acquire_runtime_lease(
        request,
        _LinuxNativeProvider(),
        manifest,
        synthetic=False,
    )


def observe_mpfr256_runtime_conformance() -> _RuntimeLeaseReceipt:
    """Acquire and cleanly close a zero-consumer literal-manifest lease."""

    lease = acquire_mpfr256_runtime_lease()
    if type(lease) is not _Mpfr256RuntimeLease:
        _fail("runtime_lease_token_type_invalid")
    return lease.close()


def _test_only_observe_with_provider(
    request: object, provider: Any, marker: object
) -> _RuntimeConformanceReceipt:
    if marker is not _TEST_ONLY_MARKER:
        _fail("synthetic_test_provider_marker_invalid")
    validated = _require_request(request)
    return _observe_with_provider(validated, provider)


def _test_only_acquire_runtime_lease(
    request: object, provider: Any, marker: object
) -> _Mpfr256RuntimeLease:
    if marker is not _TEST_ONLY_MARKER:
        _fail("synthetic_test_provider_marker_invalid")
    validated = _require_request(request)
    return _acquire_runtime_lease(
        validated,
        provider,
        None,
        synthetic=True,
    )


__all__ = (
    "RuntimeConformanceError",
    "acquire_mpfr256_runtime_lease",
    "observe_mpfr256_runtime_conformance",
)
