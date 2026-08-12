"""Producer-only bridge from byte observations to static ELF evidence.

This module deliberately stops before every dynamic-runtime boundary.  It
revalidates an existing :mod:`rn256_runtime` observation, binds explicit exact
immutable bytes to that observation by size and SHA-256, and independently
invokes :mod:`rn256_elf` on both libraries.  The returned frozen object is a
static metadata candidate only.  It cannot load a library, resolve a symbol,
configure MPFR, execute a canary, perform arithmetic, serialize a result, or
grant runtime, admission, scientific, or physical authority.
"""

from __future__ import annotations

from dataclasses import dataclass, fields
import hashlib
from pathlib import PurePosixPath, PureWindowsPath
import re

from rn256_elf import (
    MAX_DYNAMIC_ENTRIES,
    MAX_DYNSYMBOLS,
    MAX_NEEDED_ENTRIES,
    MAX_PROGRAM_HEADERS,
    MAX_SECTION_HEADERS,
    STATIC_ELF_EVIDENCE_SCHEMA_VERSION,
    StaticElfExpectation,
    StaticElfInspectionError,
    StaticElfMetadataEvidence,
    frozen_required_dynsymbols,
    inspect_static_elf,
)
from rn256_runtime import (
    MANIFEST_SCHEMA_VERSION,
    MAX_LIBRARY_BYTE_LENGTH,
    NONLINUX_TEST_COMPATIBILITY_DISPOSITION,
    ObservedRuntimeManifestCandidate,
    RUNTIME_SOURCE_MANIFEST,
    RuntimeBinaryObservation,
    RuntimeManifestObservationError,
    RuntimePlatformObservation,
    validate_runtime_source_manifest,
)


STATIC_RUNTIME_MANIFEST_SCHEMA_VERSION = (
    "nhm2_prolate_boson_star_newtonian_seed_rn256_static_runtime_manifest_candidate/v1"
)
_PRODUCTION_DISPOSITION = (
    "linux_x86_64_lp64_little_endian_production_observation"
)
_ABI = "x86_64-linux-gnu-lp64"
_LOWER_SHA256 = re.compile(r"[0-9a-f]{64}\Z")
_SAFE_ASCII = re.compile(r"[\x21-\x7e]+\Z")
_MPFR_SONAME = re.compile(r"libmpfr\.so(?:\.[0-9]+)?\Z")
_GMP_SONAME = re.compile(r"libgmp\.so(?:\.[0-9]+)?\Z")


class StaticRuntimeManifestBridgeError(RuntimeError):
    """Deterministic fail-closed static-manifest bridge error."""

    def __init__(
        self,
        code: str,
        *,
        component: str | None = None,
        detail: str | None = None,
    ) -> None:
        if type(code) is not str or not code:
            raise TypeError("error code must be an exact nonempty string")
        self.code = code
        self.component = component
        self.detail = detail
        message = code
        if component is not None:
            message = f"{message}:{component}"
        if detail is not None:
            message = f"{message}:{detail}"
        super().__init__(message)


@dataclass(frozen=True, slots=True)
class StaticRuntimeLibraryCandidate:
    component: str
    exact_absolute_path: str
    ordinary_file_size: int
    plain_sha256: str
    device: int
    inode: int
    link_count: int
    expected_abi: str
    static_elf_class: str
    static_byte_order: str
    static_machine: str
    static_object_type: str
    soname: str
    version: str
    version_marker: bytes
    needed_sonames: tuple[str, ...]
    gmp_family_dependencies: tuple[str, ...]
    defined_required_dynsymbols: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class StaticRuntimeManifestCandidate:
    schema_version: str
    runtime_observation_schema_version: str
    runtime_source_manifest_schema_version: str
    static_elf_evidence_schema_version: str
    platform_disposition: str
    production_platform_observation: bool
    mpfr: StaticRuntimeLibraryCandidate
    gmp: StaticRuntimeLibraryCandidate
    binary_observation_revalidated: bool
    static_elf_evidence_recomputed: bool
    static_observation_crosscheck_complete: bool
    static_metadata_evidence_only: bool
    observation_provenance_authority: bool
    raw_byte_provenance_authority: bool
    loader_attempted: bool
    loader_succeeded: bool
    runtime_mapping_established: bool
    symbol_resolution_attempted: bool
    symbol_resolution_succeeded: bool
    runtime_configuration_attempted: bool
    runtime_configuration_succeeded: bool
    canary_attempted: bool
    canary_succeeded: bool
    conformance_attempted: bool
    conformance_succeeded: bool
    arithmetic_executed: bool
    serialization_executed: bool
    runtime_binding_established: bool
    metadata_conformance_established: bool
    runtime_conformance_authority: bool
    execution_authority: bool
    admission_authority: bool
    scientific_authority: bool
    physical_viability_established: bool
    propulsion_capability_established: bool
    transport_capability_established: bool


_RUNTIME_CANDIDATE_FIELDS = (
    "schema_version",
    "platform",
    "source_manifest",
    "mpfr",
    "gmp",
    "binary_byte_and_identity_observation_complete",
    "soname_observation_complete",
    "version_observation_complete",
    "abi_observation_complete",
    "metadata_conformance_established",
    "manifest_candidate_only",
    "load_attempted",
    "load_succeeded",
    "symbol_resolution_attempted",
    "symbol_inventory_satisfied",
    "configure_attempted",
    "configure_succeeded",
    "canary_attempted",
    "canary_succeeded",
    "conformance_attempted",
    "conformance_succeeded",
    "runtime_conformance_authority",
    "execution_authority",
    "scientific_authority",
    "physical_viability_established",
    "propulsion_capability_established",
    "transport_capability_established",
)
_PLATFORM_FIELDS = (
    "sys_platform",
    "os_name",
    "machine",
    "byteorder",
    "pointer_bits",
    "c_long_bits",
    "c_int_bits",
    "production_guard_satisfied",
    "disposition",
)
_BINARY_FIELDS = (
    "component",
    "exact_absolute_path",
    "ordinary_file_size",
    "plain_sha256",
    "expected_soname",
    "expected_version",
    "expected_abi",
    "device",
    "inode",
    "link_count",
    "stat_read_stat_stable",
    "final_reopen_identity_stable",
    "final_reopen_digest_stable",
    "soname_observed",
    "version_observed",
    "abi_observed",
)
_STATIC_EVIDENCE_FIELDS = (
    "schema_version",
    "component",
    "byte_length",
    "plain_sha256",
    "elf_class",
    "byte_order",
    "machine",
    "object_type",
    "program_header_count",
    "section_header_count",
    "dynamic_entry_count",
    "dynsymbol_count",
    "soname",
    "needed_sonames",
    "gmp_family_dependencies",
    "version_marker",
    "defined_required_dynsymbols",
    "static_structure_validated",
    "static_soname_match",
    "static_dependency_match",
    "static_version_marker_match",
    "static_required_dynsymbols_defined",
    "static_metadata_evidence_only",
    "host_file_access_attempted",
    "loader_attempted",
    "runtime_mapping_established",
    "runtime_symbol_resolution_attempted",
    "runtime_configuration_attempted",
    "canary_attempted",
    "conformance_attempted",
    "serialization_executed",
    "arithmetic_executed",
    "runtime_conformance_authority",
    "execution_authority",
    "admission_authority",
    "scientific_authority",
    "physical_viability_established",
    "propulsion_capability_established",
    "transport_capability_established",
)

_RUNTIME_TRUE_FLAGS = (
    "binary_byte_and_identity_observation_complete",
    "manifest_candidate_only",
)
_RUNTIME_FALSE_FLAGS = (
    "soname_observation_complete",
    "version_observation_complete",
    "abi_observation_complete",
    "metadata_conformance_established",
    "load_attempted",
    "load_succeeded",
    "symbol_resolution_attempted",
    "symbol_inventory_satisfied",
    "configure_attempted",
    "configure_succeeded",
    "canary_attempted",
    "canary_succeeded",
    "conformance_attempted",
    "conformance_succeeded",
    "runtime_conformance_authority",
    "execution_authority",
    "scientific_authority",
    "physical_viability_established",
    "propulsion_capability_established",
    "transport_capability_established",
)
_STATIC_TRUE_FLAGS = (
    "static_structure_validated",
    "static_soname_match",
    "static_dependency_match",
    "static_version_marker_match",
    "static_required_dynsymbols_defined",
    "static_metadata_evidence_only",
)
_STATIC_FALSE_FLAGS = (
    "host_file_access_attempted",
    "loader_attempted",
    "runtime_mapping_established",
    "runtime_symbol_resolution_attempted",
    "runtime_configuration_attempted",
    "canary_attempted",
    "conformance_attempted",
    "serialization_executed",
    "arithmetic_executed",
    "runtime_conformance_authority",
    "execution_authority",
    "admission_authority",
    "scientific_authority",
    "physical_viability_established",
    "propulsion_capability_established",
    "transport_capability_established",
)


def _fail(
    code: str,
    *,
    component: str | None = None,
    detail: str | None = None,
) -> None:
    raise StaticRuntimeManifestBridgeError(
        code,
        component=component,
        detail=detail,
    )


def _field_names(value: object) -> tuple[str, ...]:
    return tuple(field.name for field in fields(value))


def _validate_platform(platform: object) -> RuntimePlatformObservation:
    if type(platform) is not RuntimePlatformObservation:
        _fail("invalid_platform_observation_type")
    if _field_names(platform) != _PLATFORM_FIELDS:
        _fail("platform_observation_shape_mismatch")
    if any(
        type(getattr(platform, name)) is not str
        or not getattr(platform, name)
        or len(getattr(platform, name)) > 256
        or _SAFE_ASCII.fullmatch(getattr(platform, name)) is None
        for name in ("sys_platform", "os_name", "machine", "byteorder", "disposition")
    ):
        _fail("platform_observation_text_invalid")
    for name in ("pointer_bits", "c_long_bits", "c_int_bits"):
        value = getattr(platform, name)
        if type(value) is not int or value <= 0 or value > 128 or value % 8:
            _fail("platform_observation_width_invalid", detail=name)
    if type(platform.production_guard_satisfied) is not bool:
        _fail("platform_observation_guard_invalid")

    if platform.production_guard_satisfied:
        expected = (
            "linux",
            "posix",
            "x86_64",
            "little",
            64,
            64,
            32,
            _PRODUCTION_DISPOSITION,
        )
    else:
        expected = (
            "win32",
            "nt",
            "AMD64",
            "little",
            64,
            32,
            32,
            NONLINUX_TEST_COMPATIBILITY_DISPOSITION,
        )
    observed = (
        platform.sys_platform,
        platform.os_name,
        platform.machine,
        platform.byteorder,
        platform.pointer_bits,
        platform.c_long_bits,
        platform.c_int_bits,
        platform.disposition,
    )
    if observed != expected:
        _fail("platform_observation_profile_mismatch")
    return platform


def _validate_ascii(value: object, code: str, component: str) -> str:
    if (
        type(value) is not str
        or not value
        or len(value) > 256
        or _SAFE_ASCII.fullmatch(value) is None
    ):
        _fail(code, component=component)
    return value


def _validate_path(path: object, component: str, production: bool) -> str:
    if (
        type(path) is not str
        or not path
        or len(path) > 4096
        or any(ord(character) < 0x20 or ord(character) == 0x7F for character in path)
    ):
        _fail("runtime_observation_path_invalid", component=component)
    parsed = PurePosixPath(path) if production else PureWindowsPath(path)
    if (
        not parsed.is_absolute()
        or str(parsed) != path
        or len(parsed.parts) < 2
        or any(part in ("", ".", "..") for part in parsed.parts[1:])
    ):
        _fail("runtime_observation_path_invalid", component=component)
    return path


def _validate_binary(
    observation: object,
    component: str,
    *,
    production: bool,
) -> RuntimeBinaryObservation:
    if type(observation) is not RuntimeBinaryObservation:
        _fail("invalid_binary_observation_type", component=component)
    if _field_names(observation) != _BINARY_FIELDS:
        _fail("binary_observation_shape_mismatch", component=component)
    if type(observation.component) is not str or observation.component != component:
        _fail("binary_observation_component_mismatch", component=component)
    _validate_path(observation.exact_absolute_path, component, production)
    if (
        type(observation.ordinary_file_size) is not int
        or observation.ordinary_file_size <= 0
        or observation.ordinary_file_size > MAX_LIBRARY_BYTE_LENGTH
    ):
        _fail("binary_observation_size_invalid", component=component)
    if (
        type(observation.plain_sha256) is not str
        or _LOWER_SHA256.fullmatch(observation.plain_sha256) is None
    ):
        _fail("binary_observation_digest_invalid", component=component)
    soname = _validate_ascii(
        observation.expected_soname,
        "binary_observation_soname_invalid",
        component,
    )
    if "/" in soname or "\\" in soname:
        _fail("binary_observation_soname_invalid", component=component)
    if component == "mpfr" and _MPFR_SONAME.fullmatch(soname) is None:
        _fail("binary_observation_soname_invalid", component=component)
    if component == "gmp" and _GMP_SONAME.fullmatch(soname) is None:
        _fail("binary_observation_soname_invalid", component=component)
    _validate_ascii(
        observation.expected_version,
        "binary_observation_version_invalid",
        component,
    )
    abi = _validate_ascii(
        observation.expected_abi,
        "binary_observation_abi_invalid",
        component,
    )
    if abi != _ABI:
        _fail("binary_observation_abi_mismatch", component=component)
    for name in ("device", "inode"):
        value = getattr(observation, name)
        if type(value) is not int or value < 0:
            _fail("binary_observation_identity_invalid", component=component, detail=name)
    if type(observation.link_count) is not int or observation.link_count != 1:
        _fail("binary_observation_link_count_mismatch", component=component)
    for name in (
        "stat_read_stat_stable",
        "final_reopen_identity_stable",
        "final_reopen_digest_stable",
    ):
        if getattr(observation, name) is not True:
            _fail("binary_observation_stability_mismatch", component=component, detail=name)
    for name in ("soname_observed", "version_observed", "abi_observed"):
        if getattr(observation, name) is not None:
            _fail("runtime_metadata_observation_must_be_absent", component=component, detail=name)
    return observation


def _validate_runtime_candidate(
    candidate: object,
) -> tuple[ObservedRuntimeManifestCandidate, RuntimeBinaryObservation, RuntimeBinaryObservation]:
    if type(candidate) is not ObservedRuntimeManifestCandidate:
        _fail("invalid_runtime_observation_candidate_type")
    if _field_names(candidate) != _RUNTIME_CANDIDATE_FIELDS:
        _fail("runtime_observation_candidate_shape_mismatch")
    if type(candidate.schema_version) is not str or candidate.schema_version != MANIFEST_SCHEMA_VERSION:
        _fail("runtime_observation_schema_mismatch")
    platform = _validate_platform(candidate.platform)
    try:
        validate_runtime_source_manifest(candidate.source_manifest)
    except RuntimeManifestObservationError as error:
        _fail("runtime_source_manifest_revalidation_failed", detail=error.code)
    if candidate.source_manifest != RUNTIME_SOURCE_MANIFEST:
        _fail("runtime_source_manifest_mismatch")
    for name in _RUNTIME_TRUE_FLAGS:
        if getattr(candidate, name) is not True:
            _fail("runtime_observation_flag_mismatch", detail=name)
    for name in _RUNTIME_FALSE_FLAGS:
        if getattr(candidate, name) is not False:
            _fail("runtime_observation_flag_mismatch", detail=name)
    mpfr = _validate_binary(
        candidate.mpfr,
        "mpfr",
        production=platform.production_guard_satisfied,
    )
    gmp = _validate_binary(
        candidate.gmp,
        "gmp",
        production=platform.production_guard_satisfied,
    )
    if mpfr.exact_absolute_path == gmp.exact_absolute_path:
        _fail("runtime_library_paths_not_distinct")
    if (mpfr.device, mpfr.inode) == (gmp.device, gmp.inode):
        _fail("runtime_library_identities_not_distinct")
    return candidate, mpfr, gmp


def _validate_raw(raw: object, observation: RuntimeBinaryObservation) -> bytes:
    component = observation.component
    if type(raw) is not bytes:
        _fail("exact_immutable_library_bytes_required", component=component)
    if len(raw) != observation.ordinary_file_size:
        _fail("library_byte_length_observation_mismatch", component=component)
    digest = hashlib.sha256(raw).hexdigest()
    if digest != observation.plain_sha256:
        _fail("library_digest_observation_mismatch", component=component)
    return raw


def _version_marker(observation: RuntimeBinaryObservation) -> bytes:
    prefix = "MPFR " if observation.component == "mpfr" else "GMP "
    try:
        return (prefix + observation.expected_version).encode("ascii")
    except UnicodeEncodeError:
        _fail("binary_observation_version_invalid", component=observation.component)


def _inspect(
    raw: bytes,
    observation: RuntimeBinaryObservation,
    *,
    expected_gmp_soname: str | None,
) -> StaticElfMetadataEvidence:
    expectation = StaticElfExpectation(
        component=observation.component,
        expected_byte_length=observation.ordinary_file_size,
        expected_plain_sha256=observation.plain_sha256,
        expected_soname=observation.expected_soname,
        expected_version_marker=_version_marker(observation),
        expected_gmp_soname=expected_gmp_soname,
        required_dynsymbols=frozen_required_dynsymbols(observation.component),
    )
    try:
        evidence = inspect_static_elf(raw, expectation)
    except StaticElfInspectionError as error:
        _fail(
            "static_elf_inspection_failed",
            component=observation.component,
            detail=error.code,
        )
    return evidence


def _validate_static_evidence(
    evidence: object,
    observation: RuntimeBinaryObservation,
    *,
    expected_gmp_soname: str | None,
) -> StaticElfMetadataEvidence:
    component = observation.component
    if type(evidence) is not StaticElfMetadataEvidence:
        _fail("invalid_static_elf_evidence_type", component=component)
    if _field_names(evidence) != _STATIC_EVIDENCE_FIELDS:
        _fail("static_elf_evidence_shape_mismatch", component=component)
    exact_scalars = (
        ("schema_version", STATIC_ELF_EVIDENCE_SCHEMA_VERSION),
        ("component", component),
        ("byte_length", observation.ordinary_file_size),
        ("plain_sha256", observation.plain_sha256),
        ("elf_class", "ELF64"),
        ("byte_order", "little_endian"),
        ("machine", "x86_64"),
        ("object_type", "ET_DYN"),
        ("soname", observation.expected_soname),
        ("version_marker", _version_marker(observation)),
    )
    for name, expected in exact_scalars:
        if type(getattr(evidence, name)) is not type(expected) or getattr(evidence, name) != expected:
            _fail("static_elf_evidence_crosscheck_mismatch", component=component, detail=name)
    required_dynsymbols = frozen_required_dynsymbols(component)
    if (
        type(evidence.defined_required_dynsymbols) is not tuple
        or any(type(name) is not str for name in evidence.defined_required_dynsymbols)
        or evidence.defined_required_dynsymbols != required_dynsymbols
    ):
        _fail(
            "static_elf_evidence_crosscheck_mismatch",
            component=component,
            detail="defined_required_dynsymbols",
        )
    for name, maximum in (
        ("program_header_count", MAX_PROGRAM_HEADERS),
        ("section_header_count", MAX_SECTION_HEADERS),
        ("dynamic_entry_count", MAX_DYNAMIC_ENTRIES),
        ("dynsymbol_count", MAX_DYNSYMBOLS),
    ):
        value = getattr(evidence, name)
        if type(value) is not int or value <= 0 or value > maximum:
            _fail("static_elf_evidence_count_invalid", component=component, detail=name)
    needed = evidence.needed_sonames
    if (
        type(needed) is not tuple
        or len(needed) > MAX_NEEDED_ENTRIES
        or any(
            type(name) is not str
            or not name
            or len(name) > 256
            or _SAFE_ASCII.fullmatch(name) is None
            or "/" in name
            or "\\" in name
            for name in needed
        )
    ):
        _fail("static_needed_soname_inventory_invalid", component=component)
    if len(set(needed)) != len(needed):
        _fail("static_needed_soname_inventory_invalid", component=component)
    observed_gmp = tuple(name for name in needed if _GMP_SONAME.fullmatch(name))
    suspicious_gmp = tuple(
        name
        for name in needed
        if name.casefold().startswith("libgmp") and _GMP_SONAME.fullmatch(name) is None
    )
    if suspicious_gmp:
        _fail("static_gmp_dependency_alias_invalid", component=component, detail=suspicious_gmp[0])
    expected_dependencies = (
        (expected_gmp_soname,) if component == "mpfr" else ()
    )
    if observed_gmp != expected_dependencies:
        _fail("static_gmp_dependency_crosscheck_mismatch", component=component)
    if (
        type(evidence.gmp_family_dependencies) is not tuple
        or any(type(name) is not str for name in evidence.gmp_family_dependencies)
        or evidence.gmp_family_dependencies != expected_dependencies
    ):
        _fail("static_gmp_dependency_evidence_mismatch", component=component)
    for name in _STATIC_TRUE_FLAGS:
        if getattr(evidence, name) is not True:
            _fail("static_elf_evidence_flag_mismatch", component=component, detail=name)
    for name in _STATIC_FALSE_FLAGS:
        if getattr(evidence, name) is not False:
            _fail("static_elf_evidence_flag_mismatch", component=component, detail=name)
    return evidence


def _library_candidate(
    observation: RuntimeBinaryObservation,
    evidence: StaticElfMetadataEvidence,
) -> StaticRuntimeLibraryCandidate:
    return StaticRuntimeLibraryCandidate(
        component=observation.component,
        exact_absolute_path=observation.exact_absolute_path,
        ordinary_file_size=observation.ordinary_file_size,
        plain_sha256=observation.plain_sha256,
        device=observation.device,
        inode=observation.inode,
        link_count=observation.link_count,
        expected_abi=observation.expected_abi,
        static_elf_class=evidence.elf_class,
        static_byte_order=evidence.byte_order,
        static_machine=evidence.machine,
        static_object_type=evidence.object_type,
        soname=evidence.soname,
        version=observation.expected_version,
        version_marker=evidence.version_marker,
        needed_sonames=evidence.needed_sonames,
        gmp_family_dependencies=evidence.gmp_family_dependencies,
        defined_required_dynsymbols=evidence.defined_required_dynsymbols,
    )


def build_static_runtime_manifest_candidate(
    runtime_observation: ObservedRuntimeManifestCandidate,
    *,
    mpfr_raw: bytes,
    gmp_raw: bytes,
) -> StaticRuntimeManifestCandidate:
    """Recompute and cross-bind static ELF evidence without runtime authority."""

    candidate, mpfr_observation, gmp_observation = _validate_runtime_candidate(
        runtime_observation
    )
    exact_mpfr = _validate_raw(mpfr_raw, mpfr_observation)
    exact_gmp = _validate_raw(gmp_raw, gmp_observation)

    # Inspect GMP first so the dependency identity supplied to the MPFR
    # inspection is itself recomputed from exact bytes in this invocation.
    gmp_evidence = _validate_static_evidence(
        _inspect(exact_gmp, gmp_observation, expected_gmp_soname=None),
        gmp_observation,
        expected_gmp_soname=None,
    )
    mpfr_evidence = _validate_static_evidence(
        _inspect(
            exact_mpfr,
            mpfr_observation,
            expected_gmp_soname=gmp_evidence.soname,
        ),
        mpfr_observation,
        expected_gmp_soname=gmp_evidence.soname,
    )
    if mpfr_evidence.gmp_family_dependencies != (gmp_evidence.soname,):
        _fail("mpfr_gmp_static_identity_cross_binding_mismatch")

    return StaticRuntimeManifestCandidate(
        schema_version=STATIC_RUNTIME_MANIFEST_SCHEMA_VERSION,
        runtime_observation_schema_version=candidate.schema_version,
        runtime_source_manifest_schema_version=candidate.source_manifest.schema_version,
        static_elf_evidence_schema_version=STATIC_ELF_EVIDENCE_SCHEMA_VERSION,
        platform_disposition=candidate.platform.disposition,
        production_platform_observation=candidate.platform.production_guard_satisfied,
        mpfr=_library_candidate(mpfr_observation, mpfr_evidence),
        gmp=_library_candidate(gmp_observation, gmp_evidence),
        binary_observation_revalidated=True,
        static_elf_evidence_recomputed=True,
        static_observation_crosscheck_complete=True,
        static_metadata_evidence_only=True,
        observation_provenance_authority=False,
        raw_byte_provenance_authority=False,
        loader_attempted=False,
        loader_succeeded=False,
        runtime_mapping_established=False,
        symbol_resolution_attempted=False,
        symbol_resolution_succeeded=False,
        runtime_configuration_attempted=False,
        runtime_configuration_succeeded=False,
        canary_attempted=False,
        canary_succeeded=False,
        conformance_attempted=False,
        conformance_succeeded=False,
        arithmetic_executed=False,
        serialization_executed=False,
        runtime_binding_established=False,
        metadata_conformance_established=False,
        runtime_conformance_authority=False,
        execution_authority=False,
        admission_authority=False,
        scientific_authority=False,
        physical_viability_established=False,
        propulsion_capability_established=False,
        transport_capability_established=False,
    )


__all__ = (
    "STATIC_RUNTIME_MANIFEST_SCHEMA_VERSION",
    "StaticRuntimeLibraryCandidate",
    "StaticRuntimeManifestBridgeError",
    "StaticRuntimeManifestCandidate",
    "build_static_runtime_manifest_candidate",
)
