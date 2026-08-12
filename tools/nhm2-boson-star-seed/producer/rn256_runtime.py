"""Producer-side RN256 runtime-manifest binary observation foundation.

This module has one deliberately prelaunch duty: bind caller-pinned MPFR and
GMP ordinary-file bytes to an immutable manifest *candidate*.  It does not
load either library, resolve a symbol, configure exponent state, execute a
canary, or grant execution, conformance, scientific, or physical authority.

The production path is exactly Linux x86_64, LP64, and little-endian.  A
separate compatibility observer exists only so the file-identity machinery
can be tested on a non-Linux development host.  Its result is permanently
marked non-authoritative and cannot become a production observation.
"""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
import hashlib
import os
from pathlib import PurePosixPath
import platform
import re
import stat
import struct
import sys
from typing import Iterator


MANIFEST_SCHEMA_VERSION = (
    "nhm2_prolate_boson_star_newtonian_seed_rn256_runtime_manifest_candidate/v1"
)
NONLINUX_TEST_COMPATIBILITY_DISPOSITION = (
    "nonlinux_test_compatibility_non_authoritative"
)
# These pinned runtime shared objects are small; a 64 MiB rail leaves ample
# headroom while preventing an untrusted prelaunch expectation from forcing an
# unbounded hashing pass before any runtime authority exists.
MAX_LIBRARY_BYTE_LENGTH = 64 << 20
MAX_PATH_CODEPOINTS = 4096
MAX_METADATA_CODEPOINTS = 256
_LOWER_SHA256 = re.compile(r"[0-9a-f]{64}\Z")


class RuntimeManifestObservationError(RuntimeError):
    """A deterministic fail-closed prelaunch observation error."""

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
class RuntimeLibraryExpectation:
    component: str
    absolute_path: str
    ordinary_file_size: int
    plain_sha256: str
    soname: str
    version: str
    abi: str


@dataclass(frozen=True, slots=True)
class RuntimeManifestRequest:
    mpfr: RuntimeLibraryExpectation
    gmp: RuntimeLibraryExpectation


@dataclass(frozen=True, slots=True)
class RuntimeSymbolGroup:
    group: str
    symbols: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class RuntimeSourceManifest:
    schema_version: str
    mpfr_groups: tuple[RuntimeSymbolGroup, ...]
    gmp_groups: tuple[RuntimeSymbolGroup, ...]
    named_get_d_barriers: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class RuntimePlatformObservation:
    sys_platform: str
    os_name: str
    machine: str
    byteorder: str
    pointer_bits: int
    c_long_bits: int
    c_int_bits: int
    production_guard_satisfied: bool
    disposition: str


@dataclass(frozen=True, slots=True)
class RuntimeBinaryObservation:
    component: str
    exact_absolute_path: str
    ordinary_file_size: int
    plain_sha256: str
    expected_soname: str
    expected_version: str
    expected_abi: str
    device: int
    inode: int
    link_count: int
    stat_read_stat_stable: bool
    final_reopen_identity_stable: bool
    final_reopen_digest_stable: bool
    soname_observed: str | None
    version_observed: str | None
    abi_observed: str | None


@dataclass(frozen=True, slots=True)
class ObservedRuntimeManifestCandidate:
    schema_version: str
    platform: RuntimePlatformObservation
    source_manifest: RuntimeSourceManifest
    mpfr: RuntimeBinaryObservation
    gmp: RuntimeBinaryObservation
    binary_byte_and_identity_observation_complete: bool
    soname_observation_complete: bool
    version_observation_complete: bool
    abi_observation_complete: bool
    metadata_conformance_established: bool
    manifest_candidate_only: bool
    load_attempted: bool
    load_succeeded: bool
    symbol_resolution_attempted: bool
    symbol_inventory_satisfied: bool
    configure_attempted: bool
    configure_succeeded: bool
    canary_attempted: bool
    canary_succeeded: bool
    conformance_attempted: bool
    conformance_succeeded: bool
    runtime_conformance_authority: bool
    execution_authority: bool
    scientific_authority: bool
    physical_viability_established: bool
    propulsion_capability_established: bool
    transport_capability_established: bool


@dataclass(frozen=True, slots=True)
class _PlatformSnapshot:
    sys_platform: str
    os_name: str
    machine: str
    byteorder: str
    pointer_bits: int
    c_long_bits: int
    c_int_bits: int


_MPFR_GROUPS = (
    RuntimeSymbolGroup(
        "lifecycle_and_assignment",
        (
            "mpfr_init2",
            "mpfr_clear",
            "mpfr_set",
            "mpfr_set_zero",
            "mpfr_set_d",
            "mpfr_set_si",
            "mpfr_set_ui",
        ),
    ),
    RuntimeSymbolGroup(
        "integer_and_rational_injection",
        (
            "mpfr_set_z",
            "mpfr_set_z_2exp",
            "mpfr_get_z_2exp",
            "mpfr_set_q",
        ),
    ),
    RuntimeSymbolGroup(
        "arithmetic_and_comparison",
        (
            "mpfr_add",
            "mpfr_sub",
            "mpfr_mul",
            "mpfr_div",
            "mpfr_neg",
            "mpfr_abs",
            "mpfr_sqrt",
            "mpfr_cmp",
            "mpfr_cmp_si",
            "mpfr_cmp_ui",
            "mpfr_zero_p",
            "mpfr_number_p",
        ),
    ),
    RuntimeSymbolGroup(
        "transcendental",
        (
            "mpfr_const_pi",
            "mpfr_cos",
            "mpfr_log",
            "mpfr_exp",
        ),
    ),
    RuntimeSymbolGroup(
        "exponent_range",
        (
            "mpfr_set_emin",
            "mpfr_set_emax",
            "mpfr_get_emin",
            "mpfr_get_emax",
        ),
    ),
    RuntimeSymbolGroup(
        "status_flags",
        (
            "mpfr_clear_flags",
            "mpfr_underflow_p",
            "mpfr_overflow_p",
            "mpfr_nanflag_p",
            "mpfr_inexflag_p",
            "mpfr_erangeflag_p",
            "mpfr_divby0_p",
        ),
    ),
    RuntimeSymbolGroup(
        "version_and_build_identity",
        (
            "mpfr_get_version",
            "mpfr_get_patches",
            "mpfr_buildopt_tls_p",
        ),
    ),
    RuntimeSymbolGroup("named_binary64_barrier", ("mpfr_get_d",)),
)

_GMP_GROUPS = (
    RuntimeSymbolGroup(
        "integer_z",
        (
            "__gmpz_init",
            "__gmpz_clear",
            "__gmpz_set_str",
            "__gmpz_set_si",
            "__gmpz_set_ui",
            "__gmpz_neg",
        ),
    ),
    RuntimeSymbolGroup(
        "rational_q",
        (
            "__gmpq_init",
            "__gmpq_clear",
            "__gmpq_set_str",
            "__gmpq_set_num",
            "__gmpq_set_den",
            "__gmpq_canonicalize",
        ),
    ),
    RuntimeSymbolGroup("version_identity", ("__gmp_version",)),
)

_NAMED_GET_D_BARRIERS = (
    "serialized_rho_node_bits",
    "serialized_theta_node_bits",
    "serialized_analytic_z_bits",
    "pRepresentativeBits",
    "A0Bits",
    "tailScalarCoefficientBits",
    "tailPotentialCoefficientBits",
    "perTargetLambdaBits",
    "final_ordered_array_element_bits",
    "provisionalPostprojectionCoefficientBits",
    "provisionalA1ReceiptBits",
    "finalA1ReceiptBits",
)

RUNTIME_SOURCE_MANIFEST = RuntimeSourceManifest(
    schema_version=(
        "nhm2_prolate_boson_star_newtonian_seed_rn256_runtime_source_manifest/v1"
    ),
    mpfr_groups=_MPFR_GROUPS,
    gmp_groups=_GMP_GROUPS,
    named_get_d_barriers=_NAMED_GET_D_BARRIERS,
)


def _flatten(groups: tuple[RuntimeSymbolGroup, ...]) -> tuple[str, ...]:
    return tuple(symbol for group in groups for symbol in group.symbols)


REQUIRED_MPFR_SYMBOLS = _flatten(_MPFR_GROUPS)
REQUIRED_GMP_SYMBOLS = _flatten(_GMP_GROUPS)
REQUIRED_NAMED_GET_D_BARRIERS = _NAMED_GET_D_BARRIERS


def _exact_group_shape(
    groups: object,
    *,
    component: str,
) -> tuple[RuntimeSymbolGroup, ...]:
    if type(groups) is not tuple:
        raise RuntimeManifestObservationError(
            "source_manifest_group_mismatch", component=component
        )
    result: list[RuntimeSymbolGroup] = []
    for group in groups:
        if type(group) is not RuntimeSymbolGroup:
            raise RuntimeManifestObservationError(
                "source_manifest_group_mismatch", component=component
            )
        if type(group.group) is not str or not group.group:
            raise RuntimeManifestObservationError(
                "source_manifest_group_mismatch", component=component
            )
        if type(group.symbols) is not tuple or any(
            type(symbol) is not str or not symbol for symbol in group.symbols
        ):
            raise RuntimeManifestObservationError(
                "source_manifest_group_mismatch", component=component
            )
        result.append(group)
    return tuple(result)


def validate_runtime_source_manifest(manifest: RuntimeSourceManifest) -> None:
    """Fail closed unless ``manifest`` is the complete frozen source inventory."""

    if type(manifest) is not RuntimeSourceManifest:
        raise RuntimeManifestObservationError("invalid_source_manifest_type")
    if (
        type(manifest.schema_version) is not str
        or manifest.schema_version != RUNTIME_SOURCE_MANIFEST.schema_version
    ):
        raise RuntimeManifestObservationError("source_manifest_schema_mismatch")
    mpfr_groups = _exact_group_shape(manifest.mpfr_groups, component="mpfr")
    gmp_groups = _exact_group_shape(manifest.gmp_groups, component="gmp")

    for component, observed, required in (
        ("mpfr", _flatten(mpfr_groups), REQUIRED_MPFR_SYMBOLS),
        ("gmp", _flatten(gmp_groups), REQUIRED_GMP_SYMBOLS),
    ):
        if len(set(observed)) != len(observed):
            raise RuntimeManifestObservationError(
                "source_manifest_duplicate_symbols", component=component
            )
        missing = tuple(symbol for symbol in required if symbol not in observed)
        if missing:
            raise RuntimeManifestObservationError(
                "source_manifest_missing_symbols",
                component=component,
                detail=",".join(missing),
            )
        unexpected = tuple(symbol for symbol in observed if symbol not in required)
        if unexpected:
            raise RuntimeManifestObservationError(
                "source_manifest_unexpected_symbols",
                component=component,
                detail=",".join(unexpected),
            )
        if observed != required:
            raise RuntimeManifestObservationError(
                "source_manifest_symbol_order_mismatch", component=component
            )

    barriers = manifest.named_get_d_barriers
    if type(barriers) is not tuple or any(
        type(barrier) is not str or not barrier for barrier in barriers
    ):
        raise RuntimeManifestObservationError("named_get_d_barrier_inventory_invalid")
    missing_barriers = tuple(
        barrier for barrier in REQUIRED_NAMED_GET_D_BARRIERS if barrier not in barriers
    )
    if missing_barriers:
        raise RuntimeManifestObservationError(
            "source_manifest_missing_named_get_d_barriers",
            detail=",".join(missing_barriers),
        )
    if barriers != REQUIRED_NAMED_GET_D_BARRIERS:
        raise RuntimeManifestObservationError(
            "named_get_d_barrier_inventory_mismatch"
        )

    if mpfr_groups != _MPFR_GROUPS or gmp_groups != _GMP_GROUPS:
        raise RuntimeManifestObservationError("source_manifest_group_mismatch")


def _platform_snapshot() -> _PlatformSnapshot:
    return _PlatformSnapshot(
        sys_platform=sys.platform,
        os_name=os.name,
        machine=platform.machine(),
        byteorder=sys.byteorder,
        pointer_bits=8 * struct.calcsize("P"),
        c_long_bits=8 * struct.calcsize("l"),
        c_int_bits=8 * struct.calcsize("i"),
    )


def _production_guard_satisfied(snapshot: _PlatformSnapshot) -> bool:
    return (
        snapshot.sys_platform == "linux"
        and snapshot.os_name == "posix"
        and snapshot.machine == "x86_64"
        and snapshot.byteorder == "little"
        and snapshot.pointer_bits == 64
        and snapshot.c_long_bits == 64
        and snapshot.c_int_bits == 32
    )


def _platform_observation(
    snapshot: _PlatformSnapshot,
    *,
    test_only_allow_nonlinux_compatibility: bool,
) -> RuntimePlatformObservation:
    if type(test_only_allow_nonlinux_compatibility) is not bool:
        raise RuntimeManifestObservationError("invalid_test_compatibility_opt_in")
    if _production_guard_satisfied(snapshot):
        return RuntimePlatformObservation(
            sys_platform=snapshot.sys_platform,
            os_name=snapshot.os_name,
            machine=snapshot.machine,
            byteorder=snapshot.byteorder,
            pointer_bits=snapshot.pointer_bits,
            c_long_bits=snapshot.c_long_bits,
            c_int_bits=snapshot.c_int_bits,
            production_guard_satisfied=True,
            disposition="linux_x86_64_lp64_little_endian_production_observation",
        )
    if snapshot.sys_platform == "linux":
        raise RuntimeManifestObservationError("linux_abi_guard_mismatch")
    if not test_only_allow_nonlinux_compatibility:
        raise RuntimeManifestObservationError(
            "nonlinux_test_compatibility_not_authorized"
        )
    if snapshot.sys_platform != "win32" or snapshot.os_name != "nt":
        raise RuntimeManifestObservationError(
            "nonlinux_test_compatibility_platform_unsupported"
        )
    return RuntimePlatformObservation(
        sys_platform=snapshot.sys_platform,
        os_name=snapshot.os_name,
        machine=snapshot.machine,
        byteorder=snapshot.byteorder,
        pointer_bits=snapshot.pointer_bits,
        c_long_bits=snapshot.c_long_bits,
        c_int_bits=snapshot.c_int_bits,
        production_guard_satisfied=False,
        disposition=NONLINUX_TEST_COMPATIBILITY_DISPOSITION,
    )


def _validate_exact_text(
    value: object,
    *,
    code: str,
    component: str,
    maximum: int,
) -> str:
    if (
        type(value) is not str
        or not value
        or len(value) > maximum
        or "\x00" in value
        or any(ord(character) < 0x20 or ord(character) == 0x7F for character in value)
    ):
        raise RuntimeManifestObservationError(code, component=component)
    return value


def _validate_expectation(
    expectation: RuntimeLibraryExpectation,
    expected_component: str,
    *,
    production: bool,
) -> RuntimeLibraryExpectation:
    if type(expectation) is not RuntimeLibraryExpectation:
        raise RuntimeManifestObservationError(
            "invalid_library_expectation_type", component=expected_component
        )
    if type(expectation.component) is not str or expectation.component != expected_component:
        raise RuntimeManifestObservationError(
            "library_component_mismatch", component=expected_component
        )
    path = _validate_exact_text(
        expectation.absolute_path,
        code="invalid_absolute_library_path",
        component=expected_component,
        maximum=MAX_PATH_CODEPOINTS,
    )
    if production:
        parsed = PurePosixPath(path)
        if (
            not parsed.is_absolute()
            or path != str(parsed)
            or len(parsed.parts) < 2
            or any(part in ("", ".", "..") for part in parsed.parts[1:])
        ):
            raise RuntimeManifestObservationError(
                "invalid_absolute_library_path", component=expected_component
            )
    else:
        if not os.path.isabs(path) or os.path.normpath(path) != path:
            raise RuntimeManifestObservationError(
                "invalid_absolute_library_path", component=expected_component
            )
    if (
        type(expectation.ordinary_file_size) is not int
        or isinstance(expectation.ordinary_file_size, bool)
        or expectation.ordinary_file_size <= 0
        or expectation.ordinary_file_size > MAX_LIBRARY_BYTE_LENGTH
    ):
        raise RuntimeManifestObservationError(
            "invalid_expected_ordinary_file_size", component=expected_component
        )
    if (
        type(expectation.plain_sha256) is not str
        or _LOWER_SHA256.fullmatch(expectation.plain_sha256) is None
    ):
        raise RuntimeManifestObservationError(
            "invalid_expected_plain_sha256", component=expected_component
        )
    _validate_exact_text(
        expectation.soname,
        code="invalid_expected_soname",
        component=expected_component,
        maximum=MAX_METADATA_CODEPOINTS,
    )
    _validate_exact_text(
        expectation.version,
        code="invalid_expected_version",
        component=expected_component,
        maximum=MAX_METADATA_CODEPOINTS,
    )
    _validate_exact_text(
        expectation.abi,
        code="invalid_expected_abi",
        component=expected_component,
        maximum=MAX_METADATA_CODEPOINTS,
    )
    return expectation


def _stable_file_identity(metadata: os.stat_result) -> tuple[int, ...]:
    return (
        int(metadata.st_dev),
        int(metadata.st_ino),
        int(stat.S_IFMT(metadata.st_mode)),
        int(metadata.st_nlink),
        int(metadata.st_size),
        int(metadata.st_mtime_ns),
        int(metadata.st_ctime_ns),
    )


def _path_identity(metadata: os.stat_result) -> tuple[int, int, int]:
    return (
        int(metadata.st_dev),
        int(metadata.st_ino),
        int(stat.S_IFMT(metadata.st_mode)),
    )


def _validate_open_file(
    metadata: os.stat_result,
    expectation: RuntimeLibraryExpectation,
) -> None:
    if not stat.S_ISREG(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode):
        raise RuntimeManifestObservationError(
            "library_not_ordinary_file", component=expectation.component
        )
    if metadata.st_nlink != 1:
        raise RuntimeManifestObservationError(
            "library_hardlink_count_mismatch", component=expectation.component
        )
    if metadata.st_size != expectation.ordinary_file_size:
        raise RuntimeManifestObservationError(
            "library_size_mismatch", component=expectation.component
        )


def _read_exact_digest(
    descriptor: int,
    expectation: RuntimeLibraryExpectation,
) -> str:
    remaining = expectation.ordinary_file_size
    digest = hashlib.sha256()
    while remaining:
        try:
            block = os.read(descriptor, min(remaining, 1 << 20))
        except OSError as error:
            raise RuntimeManifestObservationError(
                "library_read_failed", component=expectation.component
            ) from error
        if not block:
            raise RuntimeManifestObservationError(
                "library_size_changed_during_read", component=expectation.component
            )
        digest.update(block)
        remaining -= len(block)
    try:
        extra = os.read(descriptor, 1)
    except OSError as error:
        raise RuntimeManifestObservationError(
            "library_read_failed", component=expectation.component
        ) from error
    if extra:
        raise RuntimeManifestObservationError(
            "library_size_changed_during_read", component=expectation.component
        )
    return digest.hexdigest()


def _observe_descriptor(
    descriptor: int,
    expectation: RuntimeLibraryExpectation,
) -> tuple[os.stat_result, str]:
    try:
        before = os.fstat(descriptor)
    except OSError as error:
        raise RuntimeManifestObservationError(
            "library_fstat_failed", component=expectation.component
        ) from error
    _validate_open_file(before, expectation)
    digest = _read_exact_digest(descriptor, expectation)
    try:
        after = os.fstat(descriptor)
    except OSError as error:
        raise RuntimeManifestObservationError(
            "library_fstat_failed", component=expectation.component
        ) from error
    _validate_open_file(after, expectation)
    if _stable_file_identity(before) != _stable_file_identity(after):
        raise RuntimeManifestObservationError(
            "library_stat_read_stat_race", component=expectation.component
        )
    if digest != expectation.plain_sha256:
        raise RuntimeManifestObservationError(
            "library_plain_sha256_mismatch", component=expectation.component
        )
    return after, digest


@dataclass(slots=True)
class _HeldLinuxPath:
    directory_descriptors: list[int]
    directory_identities: tuple[tuple[int, int, int], ...]
    file_descriptor: int


@contextmanager
def _open_linux_held(
    expectation: RuntimeLibraryExpectation,
) -> Iterator[_HeldLinuxPath]:
    for flag_name in (
        "O_CLOEXEC",
        "O_DIRECTORY",
        "O_NOFOLLOW",
        "O_NONBLOCK",
        "O_PATH",
    ):
        if not hasattr(os, flag_name):
            raise RuntimeManifestObservationError(
                "linux_secure_open_api_unavailable", component=expectation.component
            )
    directory_flags = os.O_RDONLY | os.O_CLOEXEC | os.O_DIRECTORY | os.O_NOFOLLOW
    probe_flags = os.O_PATH | os.O_CLOEXEC | os.O_NOFOLLOW
    read_flags = os.O_RDONLY | os.O_CLOEXEC | os.O_NONBLOCK
    parts = PurePosixPath(expectation.absolute_path).parts
    descriptors: list[int] = []
    probe_descriptor = -1
    file_descriptor = -1
    identities: list[tuple[int, int, int]] = []
    try:
        try:
            current = os.open("/", directory_flags)
        except OSError as error:
            raise RuntimeManifestObservationError(
                "library_parent_open_failed", component=expectation.component
            ) from error
        descriptors.append(current)
        identities.append(_path_identity(os.fstat(current)))
        for component in parts[1:-1]:
            try:
                current = os.open(component, directory_flags, dir_fd=current)
            except OSError as error:
                raise RuntimeManifestObservationError(
                    "library_parent_open_failed", component=expectation.component
                ) from error
            # Own the descriptor before any fstat/type operation so every
            # exceptional path is covered by the outer cleanup.
            descriptors.append(current)
            metadata = os.fstat(current)
            if not stat.S_ISDIR(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode):
                raise RuntimeManifestObservationError(
                    "library_parent_not_ordinary_directory",
                    component=expectation.component,
                )
            identities.append(_path_identity(metadata))
        try:
            probe_descriptor = os.open(parts[-1], probe_flags, dir_fd=current)
        except OSError as error:
            raise RuntimeManifestObservationError(
                "library_type_probe_open_failed", component=expectation.component
            ) from error
        try:
            probed_metadata = os.fstat(probe_descriptor)
        except OSError as error:
            raise RuntimeManifestObservationError(
                "library_type_probe_fstat_failed", component=expectation.component
            ) from error
        _validate_open_file(probed_metadata, expectation)

        # Reopen the already-held ordinary inode rather than the caller path.
        # This prevents a final-component swap to a FIFO or device between the
        # type probe and the read open.  O_NONBLOCK is retained as a second
        # availability rail even though the held inode is already regular.
        try:
            file_descriptor = os.open(
                f"/proc/self/fd/{probe_descriptor}",
                read_flags,
            )
        except OSError as error:
            raise RuntimeManifestObservationError(
                "library_held_inode_read_open_failed",
                component=expectation.component,
            ) from error
        try:
            read_metadata = os.fstat(file_descriptor)
        except OSError as error:
            raise RuntimeManifestObservationError(
                "library_read_handle_fstat_failed", component=expectation.component
            ) from error
        if _stable_file_identity(probed_metadata) != _stable_file_identity(
            read_metadata
        ):
            raise RuntimeManifestObservationError(
                "library_type_probe_read_identity_mismatch",
                component=expectation.component,
            )
        yield _HeldLinuxPath(descriptors, tuple(identities), file_descriptor)
    finally:
        if file_descriptor >= 0:
            os.close(file_descriptor)
        if probe_descriptor >= 0:
            os.close(probe_descriptor)
        for descriptor in reversed(descriptors):
            os.close(descriptor)


def _observe_linux_library(
    expectation: RuntimeLibraryExpectation,
) -> RuntimeBinaryObservation:
    with _open_linux_held(expectation) as first:
        first_metadata, first_digest = _observe_descriptor(
            first.file_descriptor, expectation
        )
        with _open_linux_held(expectation) as reopened:
            if reopened.directory_identities != first.directory_identities:
                raise RuntimeManifestObservationError(
                    "library_final_reopen_parent_identity_mismatch",
                    component=expectation.component,
                )
            reopened_metadata, reopened_digest = _observe_descriptor(
                reopened.file_descriptor, expectation
            )
            if _path_identity(first_metadata) != _path_identity(reopened_metadata):
                raise RuntimeManifestObservationError(
                    "library_final_reopen_identity_mismatch",
                    component=expectation.component,
                )
            if first_digest != reopened_digest:
                raise RuntimeManifestObservationError(
                    "library_final_reopen_digest_mismatch",
                    component=expectation.component,
                )
    return _binary_observation(expectation, reopened_metadata, reopened_digest)


def _is_reparse_point(metadata: os.stat_result) -> bool:
    attributes = int(getattr(metadata, "st_file_attributes", 0))
    marker = int(getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400))
    return bool(attributes & marker)


def _compat_path_chain(path: str, component: str) -> tuple[tuple[int, int, int], ...]:
    drive, tail = os.path.splitdrive(path)
    if not drive or not tail.startswith(("\\", "/")):
        raise RuntimeManifestObservationError(
            "invalid_absolute_library_path", component=component
        )
    relative_parts = [part for part in re.split(r"[\\/]", tail) if part]
    current = drive + os.sep
    identities: list[tuple[int, int, int]] = []
    for index, part in enumerate(relative_parts):
        current = os.path.join(current, part)
        try:
            metadata = os.lstat(current)
        except OSError as error:
            raise RuntimeManifestObservationError(
                "library_path_lstat_failed", component=component
            ) from error
        if stat.S_ISLNK(metadata.st_mode) or _is_reparse_point(metadata):
            raise RuntimeManifestObservationError(
                "library_path_symlink_or_reparse_forbidden", component=component
            )
        if index < len(relative_parts) - 1 and not stat.S_ISDIR(metadata.st_mode):
            raise RuntimeManifestObservationError(
                "library_parent_not_ordinary_directory", component=component
            )
        identities.append(_path_identity(metadata))
    return tuple(identities)


def _open_compat_file(expectation: RuntimeLibraryExpectation) -> int:
    flags = os.O_RDONLY | int(getattr(os, "O_BINARY", 0))
    try:
        return os.open(expectation.absolute_path, flags)
    except OSError as error:
        raise RuntimeManifestObservationError(
            "library_file_open_failed", component=expectation.component
        ) from error


def _observe_nonlinux_test_library(
    expectation: RuntimeLibraryExpectation,
) -> RuntimeBinaryObservation:
    first_chain = _compat_path_chain(expectation.absolute_path, expectation.component)
    first_descriptor = _open_compat_file(expectation)
    try:
        first_metadata, first_digest = _observe_descriptor(
            first_descriptor, expectation
        )
    finally:
        os.close(first_descriptor)
    if not first_chain or first_chain[-1] != _path_identity(first_metadata):
        raise RuntimeManifestObservationError(
            "library_path_open_identity_mismatch", component=expectation.component
        )

    reopened_chain = _compat_path_chain(
        expectation.absolute_path, expectation.component
    )
    reopened_descriptor = _open_compat_file(expectation)
    try:
        reopened_metadata, reopened_digest = _observe_descriptor(
            reopened_descriptor, expectation
        )
    finally:
        os.close(reopened_descriptor)
    if reopened_chain != first_chain:
        raise RuntimeManifestObservationError(
            "library_final_reopen_parent_identity_mismatch",
            component=expectation.component,
        )
    if reopened_chain[-1] != _path_identity(reopened_metadata):
        raise RuntimeManifestObservationError(
            "library_path_open_identity_mismatch", component=expectation.component
        )
    if _path_identity(first_metadata) != _path_identity(reopened_metadata):
        raise RuntimeManifestObservationError(
            "library_final_reopen_identity_mismatch", component=expectation.component
        )
    if first_digest != reopened_digest:
        raise RuntimeManifestObservationError(
            "library_final_reopen_digest_mismatch", component=expectation.component
        )
    return _binary_observation(expectation, reopened_metadata, reopened_digest)


def _binary_observation(
    expectation: RuntimeLibraryExpectation,
    metadata: os.stat_result,
    digest: str,
) -> RuntimeBinaryObservation:
    return RuntimeBinaryObservation(
        component=expectation.component,
        exact_absolute_path=expectation.absolute_path,
        ordinary_file_size=expectation.ordinary_file_size,
        plain_sha256=digest,
        expected_soname=expectation.soname,
        expected_version=expectation.version,
        expected_abi=expectation.abi,
        device=int(metadata.st_dev),
        inode=int(metadata.st_ino),
        link_count=int(metadata.st_nlink),
        stat_read_stat_stable=True,
        final_reopen_identity_stable=True,
        final_reopen_digest_stable=True,
        soname_observed=None,
        version_observed=None,
        abi_observed=None,
    )


def observe_runtime_manifest_candidate(
    request: RuntimeManifestRequest,
    *,
    test_only_allow_nonlinux_compatibility: bool = False,
) -> ObservedRuntimeManifestCandidate:
    """Observe pinned binary bytes without loading or configuring a runtime."""

    validate_runtime_source_manifest(RUNTIME_SOURCE_MANIFEST)
    if type(request) is not RuntimeManifestRequest:
        raise RuntimeManifestObservationError("invalid_runtime_manifest_request_type")
    snapshot = _platform_snapshot()
    platform_observation = _platform_observation(
        snapshot,
        test_only_allow_nonlinux_compatibility=(
            test_only_allow_nonlinux_compatibility
        ),
    )
    production = platform_observation.production_guard_satisfied
    mpfr = _validate_expectation(request.mpfr, "mpfr", production=production)
    gmp = _validate_expectation(request.gmp, "gmp", production=production)
    if mpfr.absolute_path == gmp.absolute_path:
        raise RuntimeManifestObservationError("library_paths_must_be_distinct")

    observer = _observe_linux_library if production else _observe_nonlinux_test_library
    mpfr_observation = observer(mpfr)
    gmp_observation = observer(gmp)
    if (
        mpfr_observation.device,
        mpfr_observation.inode,
    ) == (
        gmp_observation.device,
        gmp_observation.inode,
    ):
        raise RuntimeManifestObservationError("library_file_identities_must_be_distinct")

    return ObservedRuntimeManifestCandidate(
        schema_version=MANIFEST_SCHEMA_VERSION,
        platform=platform_observation,
        source_manifest=RUNTIME_SOURCE_MANIFEST,
        mpfr=mpfr_observation,
        gmp=gmp_observation,
        binary_byte_and_identity_observation_complete=True,
        soname_observation_complete=False,
        version_observation_complete=False,
        abi_observation_complete=False,
        metadata_conformance_established=False,
        manifest_candidate_only=True,
        load_attempted=False,
        load_succeeded=False,
        symbol_resolution_attempted=False,
        symbol_inventory_satisfied=False,
        configure_attempted=False,
        configure_succeeded=False,
        canary_attempted=False,
        canary_succeeded=False,
        conformance_attempted=False,
        conformance_succeeded=False,
        runtime_conformance_authority=False,
        execution_authority=False,
        scientific_authority=False,
        physical_viability_established=False,
        propulsion_capability_established=False,
        transport_capability_established=False,
    )


validate_runtime_source_manifest(RUNTIME_SOURCE_MANIFEST)


__all__ = (
    "MANIFEST_SCHEMA_VERSION",
    "NONLINUX_TEST_COMPATIBILITY_DISPOSITION",
    "ObservedRuntimeManifestCandidate",
    "REQUIRED_GMP_SYMBOLS",
    "REQUIRED_MPFR_SYMBOLS",
    "REQUIRED_NAMED_GET_D_BARRIERS",
    "RUNTIME_SOURCE_MANIFEST",
    "RuntimeBinaryObservation",
    "RuntimeLibraryExpectation",
    "RuntimeManifestObservationError",
    "RuntimeManifestRequest",
    "RuntimePlatformObservation",
    "RuntimeSourceManifest",
    "RuntimeSymbolGroup",
    "observe_runtime_manifest_candidate",
    "validate_runtime_source_manifest",
)
