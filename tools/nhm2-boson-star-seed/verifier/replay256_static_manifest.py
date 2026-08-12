"""Verifier-only bridge from pinned runtime bytes to static ELF observations.

This module accepts a fully formed :mod:`replay256_runtime` candidate, treats
every field as untrusted, and independently revalidates it before invoking the
bytes-only :mod:`replay256_elf` inspector.  Success establishes only internal
agreement between two immutable records for the exact bytes supplied by the
caller.  It does not establish where the observations came from, which images
a loader would bind, any runtime behavior, or any scientific authority.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import ntpath
import re
import stat
from typing import Final

from replay256_elf import (
    ElfInspectionExpectation,
    MAX_NEEDED_DEPENDENCIES,
    MAX_SECTION_HEADERS,
    Replay256ElfError,
    STATIC_ELF_SECURITY_PROFILE,
    StaticElfObservation,
    VERIFIER_REQUIRED_GMP_DYNSYMBOLS,
    VERIFIER_REQUIRED_MPFR_DYNSYMBOLS,
    inspect_replay256_elf,
)
from replay256_runtime import (
    LINUX_SECURITY_PROFILE,
    MAX_RUNTIME_LIBRARY_BYTES,
    REPLAY256_NAMED_GET_D_BARRIERS,
    REQUIRED_GMP_SYMBOLS,
    REQUIRED_MPFR_SYMBOLS,
    WINDOWS_TEST_SECURITY_PROFILE,
    Replay256RuntimeManifestCandidate,
    RuntimeLibraryObservation,
)


STATIC_RUNTIME_MANIFEST_SECURITY_PROFILE: Final[str] = (
    "verifier_replay256_static_runtime_manifest_bytes_only_non_authoritative"
)
REPLAY256_EXPECTED_RUNTIME_ABI: Final[str] = (
    "ELF64-x86_64-LP64-little-endian"
)
REPLAY256_OBSERVED_STATIC_ABI: Final[str] = (
    "ELF64-little-endian-x86_64-ET_DYN"
)

_SHA256_RE: Final[re.Pattern[str]] = re.compile(r"^[0-9a-f]{64}$")
_MPFR_SONAME_RE: Final[re.Pattern[str]] = re.compile(
    r"^libmpfr\.so(?:\.[0-9]+)?$"
)
_GMP_SONAME_RE: Final[re.Pattern[str]] = re.compile(
    r"^libgmp\.so(?:\.[0-9]+)?$"
)
_VERSION_RE: Final[re.Pattern[str]] = re.compile(
    r"^[0-9]+(?:\.[0-9]+){1,3}(?:[-+][A-Za-z0-9._-]+)?$"
)
_ASCII_NAME_RE: Final[re.Pattern[str]] = re.compile(r"^[!-~]+$")


class Replay256StaticManifestError(RuntimeError):
    """Deterministic fail-closed rejection of an untrusted bridge input."""

    def __init__(self, code: str, path: str = "<manifest>", detail: str = "") -> None:
        self.code = code
        self.path = path
        self.detail = detail
        message = f"{code}:{path}"
        if detail:
            message += f":{detail}"
        super().__init__(message)


@dataclass(frozen=True, slots=True)
class Replay256StaticRuntimeManifestCandidate:
    """Frozen static agreement record with no runtime or policy authority."""

    runtime_candidate: Replay256RuntimeManifestCandidate
    mpfr_static: StaticElfObservation
    gmp_static: StaticElfObservation
    security_profile: str
    runtime_security_profile: str
    mpfr_absolute_path: str
    gmp_absolute_path: str
    expected_runtime_abi: str
    required_mpfr_symbols: tuple[str, ...]
    required_gmp_symbols: tuple[str, ...]
    named_get_d_barriers: tuple[str, ...]
    byte_identity_cross_binding_established: bool
    static_metadata_cross_binding_established: bool
    mpfr_gmp_dependency_cross_binding_established: bool
    required_symbol_inventory_cross_binding_established: bool
    static_manifest_candidate_complete: bool
    observation_provenance_available: bool
    loader_available: bool
    symbol_resolution_available: bool
    runtime_configuration_available: bool
    canary_available: bool
    conformance_available: bool
    policy_arithmetic_available: bool
    serialization_barrier_available: bool
    runtime_binding_available: bool
    dynamic_loading_attempted: bool
    symbol_resolution_attempted: bool
    runtime_configuration_attempted: bool
    canary_executed: bool
    conformance_executed: bool
    policy_arithmetic_executed: bool
    serialization_barrier_executed: bool
    runtime_binding_attempted: bool
    canary_passed: bool
    conformance_passed: bool
    serialization_barrier_passed: bool
    observation_provenance_authority: bool
    loader_authority: bool
    symbol_resolution_authority: bool
    runtime_configuration_authority: bool
    canary_authority: bool
    runtime_conformance_authority: bool
    policy_arithmetic_authority: bool
    serialization_authority: bool
    runtime_binding_authority: bool
    toolchain_binding_authority: bool
    admission_authority: bool
    scientific_authority: bool
    physical_authority: bool
    propulsion_authority: bool
    transport_authority: bool
    proof_authority: bool
    gate_authority: bool
    registration_authority: bool


def _fail(code: str, path: str = "<manifest>", detail: str = "") -> None:
    raise Replay256StaticManifestError(code, path, detail)


def _require_exact_bool(value: object, expected: bool, code: str, path: str) -> None:
    if type(value) is not bool or value is not expected:
        _fail(code, path, f"expected={expected}:observed={value!r}")


def _require_int(
    value: object,
    code: str,
    path: str,
    *,
    minimum: int = 0,
) -> int:
    if type(value) is not int or value < minimum:
        _fail(code, path)
    return value


def _validated_path(value: object, profile: str, library_id: str) -> str:
    if type(value) is not str or not value or "\x00" in value:
        _fail("invalid_runtime_absolute_path", library_id)
    if profile == LINUX_SECURITY_PROFILE:
        if not value.startswith("/") or value.startswith("//") or value == "/":
            _fail("invalid_runtime_absolute_path", library_id)
        if any(component in ("", ".", "..") for component in value.split("/")[1:]):
            _fail("noncanonical_runtime_absolute_path", library_id)
        return value
    if profile == WINDOWS_TEST_SECURITY_PROFILE:
        if not ntpath.isabs(value) or ntpath.normpath(value) != value:
            _fail("noncanonical_runtime_absolute_path", library_id)
        drive, tail = ntpath.splitdrive(value)
        if not drive or tail in ("", "\\", "/"):
            _fail("invalid_runtime_absolute_path", library_id)
        components = re.split(r"[\\/]", tail.lstrip("\\/"))
        if any(component in ("", ".", "..") for component in components):
            _fail("noncanonical_runtime_absolute_path", library_id)
        return value
    _fail("unsupported_runtime_security_profile", library_id, profile)


def _validated_expectation_text(
    value: object,
    pattern: re.Pattern[str],
    code: str,
    library_id: str,
) -> str:
    if type(value) is not str or pattern.fullmatch(value) is None:
        _fail(code, library_id)
    return value


def _version_marker(library_id: str, version: str) -> bytes:
    prefix = "MPFR_VERSION=" if library_id == "mpfr" else "GMP_VERSION="
    marker = (prefix + version).encode("ascii")
    if len(marker) > 256:
        _fail("derived_version_marker_too_long", library_id)
    return marker


def _validate_library_observation(
    observation: object,
    library_id: str,
    profile: str,
    explicit_raw_bytes: object,
) -> RuntimeLibraryObservation:
    if type(observation) is not RuntimeLibraryObservation:
        _fail("runtime_library_observation_required", library_id)
    if type(observation.library_id) is not str or observation.library_id != library_id:
        _fail("runtime_library_id_mismatch", library_id)
    absolute_path = _validated_path(observation.absolute_path, profile, library_id)
    byte_length = _require_int(
        observation.byte_length,
        "invalid_runtime_byte_length",
        library_id,
        minimum=1,
    )
    if byte_length > MAX_RUNTIME_LIBRARY_BYTES:
        _fail("runtime_byte_length_cap_exceeded", library_id)
    if type(explicit_raw_bytes) is not bytes:
        _fail("explicit_immutable_bytes_required", library_id)
    if type(observation.raw_bytes) is not bytes:
        _fail("retained_immutable_bytes_required", library_id)
    if len(explicit_raw_bytes) != byte_length or len(observation.raw_bytes) != byte_length:
        _fail("runtime_byte_length_cross_binding_mismatch", library_id)
    if observation.raw_bytes != explicit_raw_bytes:
        _fail("explicit_retained_bytes_mismatch", library_id)
    if type(observation.plain_sha256) is not str or _SHA256_RE.fullmatch(
        observation.plain_sha256
    ) is None:
        _fail("invalid_runtime_plain_sha256", library_id)
    digest = hashlib.sha256(explicit_raw_bytes).hexdigest()
    if digest != observation.plain_sha256:
        _fail("runtime_plain_sha256_cross_binding_mismatch", library_id)

    soname_pattern = _MPFR_SONAME_RE if library_id == "mpfr" else _GMP_SONAME_RE
    _validated_expectation_text(
        observation.expected_soname,
        soname_pattern,
        "invalid_runtime_expected_soname",
        library_id,
    )
    _validated_expectation_text(
        observation.expected_version,
        _VERSION_RE,
        "invalid_runtime_expected_version",
        library_id,
    )
    if (
        type(observation.expected_abi) is not str
        or observation.expected_abi != REPLAY256_EXPECTED_RUNTIME_ABI
    ):
        _fail("runtime_expected_abi_mismatch", library_id)

    _require_int(observation.device_id, "invalid_runtime_device_id", library_id)
    _require_int(observation.inode, "invalid_runtime_inode", library_id, minimum=1)
    mode = _require_int(observation.mode, "invalid_runtime_mode", library_id)
    mode_file_type = _require_int(
        observation.mode_file_type,
        "invalid_runtime_mode_file_type",
        library_id,
    )
    if stat.S_IFMT(mode) != stat.S_IFREG or mode_file_type != stat.S_IFREG:
        _fail("runtime_regular_file_identity_required", library_id)
    if type(observation.link_count) is not int or observation.link_count != 1:
        _fail("runtime_single_link_identity_required", library_id)
    _require_int(
        observation.mtime_nanoseconds,
        "invalid_runtime_mtime_nanoseconds",
        library_id,
    )
    _require_int(
        observation.ctime_nanoseconds,
        "invalid_runtime_ctime_nanoseconds",
        library_id,
    )
    if (
        type(observation.security_profile) is not str
        or observation.security_profile != profile
    ):
        _fail("runtime_library_security_profile_mismatch", library_id)

    expected_production = profile == LINUX_SECURITY_PROFILE
    library_flags = {
        "production_security_profile_established": expected_production,
        "exact_size_match_established": True,
        "plain_sha256_match_established": True,
        "identity_stability_established": True,
        "fresh_reopen_match_established": True,
        "soname_observed": False,
        "soname_match_established": False,
        "version_observed": False,
        "version_match_established": False,
        "abi_observed": False,
        "abi_match_established": False,
    }
    for field_name, expected in library_flags.items():
        _require_exact_bool(
            getattr(observation, field_name),
            expected,
            "runtime_library_flag_mismatch",
            f"{library_id}.{field_name}",
        )
    return observation


def _validate_runtime_candidate(
    candidate: object,
    mpfr_raw_bytes: object,
    gmp_raw_bytes: object,
) -> tuple[
    Replay256RuntimeManifestCandidate,
    RuntimeLibraryObservation,
    RuntimeLibraryObservation,
]:
    if type(candidate) is not Replay256RuntimeManifestCandidate:
        _fail("replay256_runtime_manifest_candidate_required")
    profile = candidate.security_profile
    if type(profile) is not str or profile not in (
        LINUX_SECURITY_PROFILE,
        WINDOWS_TEST_SECURITY_PROFILE,
    ):
        _fail("unsupported_runtime_security_profile")
    mpfr = _validate_library_observation(
        candidate.mpfr,
        "mpfr",
        profile,
        mpfr_raw_bytes,
    )
    gmp = _validate_library_observation(
        candidate.gmp,
        "gmp",
        profile,
        gmp_raw_bytes,
    )
    if mpfr.absolute_path == gmp.absolute_path:
        _fail("runtime_library_path_alias_forbidden")
    if (mpfr.device_id, mpfr.inode) == (gmp.device_id, gmp.inode):
        _fail("runtime_library_inode_alias_forbidden")

    if (
        type(candidate.required_mpfr_symbols) is not tuple
        or any(type(item) is not str for item in candidate.required_mpfr_symbols)
        or candidate.required_mpfr_symbols != REQUIRED_MPFR_SYMBOLS
    ):
        _fail("runtime_required_mpfr_symbols_mismatch")
    if (
        type(candidate.required_gmp_symbols) is not tuple
        or any(type(item) is not str for item in candidate.required_gmp_symbols)
        or candidate.required_gmp_symbols != REQUIRED_GMP_SYMBOLS
    ):
        _fail("runtime_required_gmp_symbols_mismatch")
    if (
        type(candidate.named_get_d_barriers) is not tuple
        or any(type(item) is not str for item in candidate.named_get_d_barriers)
        or candidate.named_get_d_barriers != REPLAY256_NAMED_GET_D_BARRIERS
    ):
        _fail("runtime_named_get_d_barriers_mismatch")
    if REQUIRED_MPFR_SYMBOLS != VERIFIER_REQUIRED_MPFR_DYNSYMBOLS:
        _fail("mpfr_required_symbol_inventory_cross_module_mismatch")
    if REQUIRED_GMP_SYMBOLS != VERIFIER_REQUIRED_GMP_DYNSYMBOLS:
        _fail("gmp_required_symbol_inventory_cross_module_mismatch")

    candidate_flags = {
        "byte_identity_observation_complete": True,
        "pair_concurrent_immutability_established": False,
        "soname_observation_complete": False,
        "version_observation_complete": False,
        "abi_observation_complete": False,
        "required_symbols_observed": False,
        "runtime_loader_available": False,
        "symbol_resolution_available": False,
        "runtime_configuration_available": False,
        "canary_available": False,
        "conformance_available": False,
        "serialization_barrier_available": False,
        "policy_arithmetic_available": False,
        "dynamic_loading_attempted": False,
        "symbol_resolution_attempted": False,
        "runtime_configuration_attempted": False,
        "canary_executed": False,
        "conformance_executed": False,
        "runtime_authority": False,
        "runtime_conformance_authority": False,
        "toolchain_binding_authority": False,
        "policy_arithmetic_authority": False,
        "scientific_authority": False,
        "proof_authority": False,
        "gate_authority": False,
        "admission_authority": False,
        "registration_authority": False,
    }
    for field_name, expected in candidate_flags.items():
        _require_exact_bool(
            getattr(candidate, field_name),
            expected,
            "runtime_candidate_flag_mismatch",
            field_name,
        )
    return candidate, mpfr, gmp


def _validated_dependency_tuple(value: object, library_id: str) -> tuple[str, ...]:
    if type(value) is not tuple or len(value) > MAX_NEEDED_DEPENDENCIES:
        _fail("static_needed_dependencies_invalid", library_id)
    if len(value) != len(set(value)):
        _fail("static_needed_dependencies_invalid", library_id)
    for item in value:
        if type(item) is not str or _ASCII_NAME_RE.fullmatch(item) is None:
            _fail("static_needed_dependencies_invalid", library_id)
        if "/" in item or "\\" in item:
            _fail("static_needed_dependencies_invalid", library_id)
        if item.casefold().startswith("libgmp") and _GMP_SONAME_RE.fullmatch(item) is None:
            _fail("static_gmp_dependency_alias_invalid", library_id, item)
    return value


def _validate_static_observation(
    observation: object,
    runtime: RuntimeLibraryObservation,
    explicit_raw_bytes: bytes,
    expected_gmp_soname: str | None,
) -> StaticElfObservation:
    library_id = runtime.library_id
    if type(observation) is not StaticElfObservation:
        _fail("static_elf_observation_required", library_id)
    marker = _version_marker(library_id, runtime.expected_version)
    exact_values = {
        "library_id": library_id,
        "byte_length": runtime.byte_length,
        "plain_sha256": runtime.plain_sha256,
        "raw_bytes": explicit_raw_bytes,
        "security_profile": STATIC_ELF_SECURITY_PROFILE,
        "observed_abi": REPLAY256_OBSERVED_STATIC_ABI,
        "observed_soname": runtime.expected_soname,
        "observed_version_marker": marker,
        "expected_soname": runtime.expected_soname,
        "expected_version_marker": marker,
        "expected_gmp_soname": expected_gmp_soname,
    }
    for field_name, expected in exact_values.items():
        observed = getattr(observation, field_name)
        if type(observed) is not type(expected) or observed != expected:
            _fail(
                "static_observation_field_mismatch",
                f"{library_id}.{field_name}",
            )
    if (
        type(observation.version_marker_section_index) is not int
        or observation.version_marker_section_index <= 0
        or observation.version_marker_section_index >= MAX_SECTION_HEADERS
    ):
        _fail("static_version_marker_section_index_invalid", library_id)

    needed = _validated_dependency_tuple(observation.needed_dependencies, library_id)
    other = _validated_dependency_tuple(
        observation.other_needed_dependencies,
        library_id,
    )
    gmp_family = _validated_dependency_tuple(
        observation.gmp_family_needed_dependencies,
        library_id,
    )
    derived_gmp_family = tuple(name for name in needed if _GMP_SONAME_RE.fullmatch(name))
    derived_other = tuple(name for name in needed if name not in derived_gmp_family)
    if gmp_family != derived_gmp_family or other != derived_other:
        _fail("static_dependency_partition_mismatch", library_id)
    if library_id == "mpfr" and gmp_family != (expected_gmp_soname,):
        _fail("static_mpfr_gmp_dependency_cross_binding_mismatch", library_id)
    if library_id == "gmp" and gmp_family:
        _fail("static_gmp_self_family_dependency_forbidden", library_id)

    required = (
        VERIFIER_REQUIRED_MPFR_DYNSYMBOLS
        if library_id == "mpfr"
        else VERIFIER_REQUIRED_GMP_DYNSYMBOLS
    )
    if (
        type(observation.required_dynsymbols) is not tuple
        or any(type(item) is not str for item in observation.required_dynsymbols)
        or observation.required_dynsymbols != required
    ):
        _fail("static_required_dynsymbols_mismatch", library_id)
    if (
        type(observation.defined_required_dynsymbols) is not tuple
        or any(type(item) is not str for item in observation.defined_required_dynsymbols)
        or observation.defined_required_dynsymbols != required
    ):
        _fail("static_defined_required_dynsymbols_mismatch", library_id)

    expected_dependency_rule = library_id == "mpfr"
    static_flags = {
        "plain_sha256_match_established": True,
        "elf_identity_match_established": True,
        "bounded_table_validation_established": True,
        "soname_match_established": True,
        "gmp_dependency_rule_applicable": expected_dependency_rule,
        "gmp_dependency_rule_satisfied": expected_dependency_rule,
        "version_marker_match_established": True,
        "required_dynsymbols_defined_established": True,
        "required_dynsymbols_default_version_visible_established": True,
        "static_metadata_observation_complete": True,
        "loader_available": False,
        "runtime_available": False,
        "canary_available": False,
        "canary_executed": False,
        "canary_passed": False,
        "conformance_available": False,
        "conformance_executed": False,
        "conformance_passed": False,
        "serialization_barrier_available": False,
        "serialization_barrier_executed": False,
        "serialization_barrier_passed": False,
        "policy_arithmetic_available": False,
        "runtime_authority": False,
        "runtime_conformance_authority": False,
        "serialization_authority": False,
        "policy_arithmetic_authority": False,
        "scientific_authority": False,
        "proof_authority": False,
        "gate_authority": False,
        "admission_authority": False,
        "registration_authority": False,
    }
    for field_name, expected in static_flags.items():
        _require_exact_bool(
            getattr(observation, field_name),
            expected,
            "static_observation_flag_mismatch",
            f"{library_id}.{field_name}",
        )
    if type(observation.gnu_versym_present) is not bool:
        _fail("static_gnu_versym_presence_invalid", library_id)
    return observation


def _inspect_exact_static(
    runtime: RuntimeLibraryObservation,
    raw_bytes: bytes,
    expected_gmp_soname: str | None,
) -> StaticElfObservation:
    expectation = ElfInspectionExpectation(
        library_id=runtime.library_id,
        byte_length=runtime.byte_length,
        plain_sha256=runtime.plain_sha256,
        expected_soname=runtime.expected_soname,
        expected_version_marker=_version_marker(
            runtime.library_id,
            runtime.expected_version,
        ),
        expected_gmp_soname=expected_gmp_soname,
    )
    try:
        observed = inspect_replay256_elf(raw_bytes, expectation)
    except Replay256ElfError as error:
        raise Replay256StaticManifestError(
            "static_elf_inspection_rejected",
            runtime.library_id,
            error.code,
        ) from error
    return _validate_static_observation(
        observed,
        runtime,
        raw_bytes,
        expected_gmp_soname,
    )


def build_replay256_static_runtime_manifest(
    runtime_candidate: Replay256RuntimeManifestCandidate,
    *,
    mpfr_raw_bytes: bytes,
    gmp_raw_bytes: bytes,
) -> Replay256StaticRuntimeManifestCandidate:
    """Recompute and cross-bind static evidence without granting authority."""

    validated, mpfr_runtime, gmp_runtime = _validate_runtime_candidate(
        runtime_candidate,
        mpfr_raw_bytes,
        gmp_raw_bytes,
    )
    mpfr_static = _inspect_exact_static(
        mpfr_runtime,
        mpfr_raw_bytes,
        gmp_runtime.expected_soname,
    )
    gmp_static = _inspect_exact_static(gmp_runtime, gmp_raw_bytes, None)
    return Replay256StaticRuntimeManifestCandidate(
        runtime_candidate=validated,
        mpfr_static=mpfr_static,
        gmp_static=gmp_static,
        security_profile=STATIC_RUNTIME_MANIFEST_SECURITY_PROFILE,
        runtime_security_profile=validated.security_profile,
        mpfr_absolute_path=mpfr_runtime.absolute_path,
        gmp_absolute_path=gmp_runtime.absolute_path,
        expected_runtime_abi=REPLAY256_EXPECTED_RUNTIME_ABI,
        required_mpfr_symbols=REQUIRED_MPFR_SYMBOLS,
        required_gmp_symbols=REQUIRED_GMP_SYMBOLS,
        named_get_d_barriers=REPLAY256_NAMED_GET_D_BARRIERS,
        byte_identity_cross_binding_established=True,
        static_metadata_cross_binding_established=True,
        mpfr_gmp_dependency_cross_binding_established=True,
        required_symbol_inventory_cross_binding_established=True,
        static_manifest_candidate_complete=True,
        observation_provenance_available=False,
        loader_available=False,
        symbol_resolution_available=False,
        runtime_configuration_available=False,
        canary_available=False,
        conformance_available=False,
        policy_arithmetic_available=False,
        serialization_barrier_available=False,
        runtime_binding_available=False,
        dynamic_loading_attempted=False,
        symbol_resolution_attempted=False,
        runtime_configuration_attempted=False,
        canary_executed=False,
        conformance_executed=False,
        policy_arithmetic_executed=False,
        serialization_barrier_executed=False,
        runtime_binding_attempted=False,
        canary_passed=False,
        conformance_passed=False,
        serialization_barrier_passed=False,
        observation_provenance_authority=False,
        loader_authority=False,
        symbol_resolution_authority=False,
        runtime_configuration_authority=False,
        canary_authority=False,
        runtime_conformance_authority=False,
        policy_arithmetic_authority=False,
        serialization_authority=False,
        runtime_binding_authority=False,
        toolchain_binding_authority=False,
        admission_authority=False,
        scientific_authority=False,
        physical_authority=False,
        propulsion_authority=False,
        transport_authority=False,
        proof_authority=False,
        gate_authority=False,
        registration_authority=False,
    )


__all__ = [
    "REPLAY256_EXPECTED_RUNTIME_ABI",
    "REPLAY256_OBSERVED_STATIC_ABI",
    "STATIC_RUNTIME_MANIFEST_SECURITY_PROFILE",
    "Replay256StaticManifestError",
    "Replay256StaticRuntimeManifestCandidate",
    "build_replay256_static_runtime_manifest",
]
