"""Verifier-authored MPFR/GMP runtime-manifest candidate foundation.

This module observes exact caller-pinned library bytes and stable filesystem
identities.  It deliberately does not load a library, resolve a symbol,
configure MPFR, execute a canary, or claim runtime conformance.  Expected
SONAME, version, and ABI strings are retained as expectations only: this
foundation does not parse or observe those properties.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import os
from pathlib import Path
import re
import stat
import struct
import sys
from typing import Final


LINUX_SECURITY_PROFILE: Final[str] = (
    "linux_x86_64_lp64_little_endian_held_nofollow_identity_stable_reopen"
)
WINDOWS_TEST_SECURITY_PROFILE: Final[str] = (
    "windows_test_compatibility_non_authoritative"
)
MAX_RUNTIME_LIBRARY_BYTES: Final[int] = 64 * 1024 * 1024

REQUIRED_MPFR_SYMBOLS: Final[tuple[str, ...]] = (
    "mpfr_init2",
    "mpfr_clear",
    "mpfr_set",
    "mpfr_set_zero",
    "mpfr_set_z",
    "mpfr_set_z_2exp",
    "mpfr_get_z_2exp",
    "mpfr_set_q",
    "mpfr_set_d",
    "mpfr_set_si",
    "mpfr_set_ui",
    "mpfr_add",
    "mpfr_sub",
    "mpfr_mul",
    "mpfr_div",
    "mpfr_neg",
    "mpfr_abs",
    "mpfr_sqrt",
    "mpfr_cos",
    "mpfr_log",
    "mpfr_exp",
    "mpfr_const_pi",
    "mpfr_cmp",
    "mpfr_cmp_si",
    "mpfr_cmp_ui",
    "mpfr_zero_p",
    "mpfr_number_p",
    "mpfr_set_emin",
    "mpfr_set_emax",
    "mpfr_get_emin",
    "mpfr_get_emax",
    "mpfr_clear_flags",
    "mpfr_underflow_p",
    "mpfr_overflow_p",
    "mpfr_nanflag_p",
    "mpfr_inexflag_p",
    "mpfr_erangeflag_p",
    "mpfr_divby0_p",
    "mpfr_get_version",
    "mpfr_get_patches",
    "mpfr_buildopt_tls_p",
    "mpfr_get_d",
)

REQUIRED_GMP_SYMBOLS: Final[tuple[str, ...]] = (
    "__gmpz_init",
    "__gmpz_clear",
    "__gmpz_set_str",
    "__gmpz_set_si",
    "__gmpz_set_ui",
    "__gmpz_neg",
    "__gmpq_init",
    "__gmpq_clear",
    "__gmpq_set_str",
    "__gmpq_set_num",
    "__gmpq_set_den",
    "__gmpq_canonicalize",
    "__gmp_version",
)

NUMERIC_MATERIALIZATION_GET_D_BARRIERS: Final[tuple[str, ...]] = (
    "serialized_rho_node_bits",
    "serialized_theta_node_bits",
    "serialized_analytic_z_bits",
    "pRepresentativeBits",
    "tailScalarCoefficientBits",
    "tailPotentialCoefficientBits",
    "A0Bits",
    "perTargetLambdaBits",
    "final_ordered_array_element_bits",
)

POSTPROJECTION_GET_D_BARRIERS: Final[tuple[str, ...]] = (
    "serialized_analytic_z_bits",
    "provisionalPostprojectionCoefficientBits",
    "provisionalA1ReceiptBits",
    "finalA1ReceiptBits",
    "final_ordered_array_element_bits",
)

REPLAY256_NAMED_GET_D_BARRIERS: Final[tuple[str, ...]] = (
    "serialized_rho_node_bits",
    "serialized_theta_node_bits",
    "serialized_analytic_z_bits",
    "pRepresentativeBits",
    "tailScalarCoefficientBits",
    "tailPotentialCoefficientBits",
    "A0Bits",
    "perTargetLambdaBits",
    "final_ordered_array_element_bits",
    "provisionalPostprojectionCoefficientBits",
    "provisionalA1ReceiptBits",
    "finalA1ReceiptBits",
)

_SHA256_RE: Final[re.Pattern[str]] = re.compile(r"^[0-9a-f]{64}$")
_MAX_EXPECTATION_TEXT_LENGTH: Final[int] = 256
_READ_CHUNK_BYTES: Final[int] = 1024 * 1024


class Replay256RuntimeError(RuntimeError):
    """Typed rejection before any policy arithmetic is available."""

    def __init__(self, code: str, path: str = "<runtime>", detail: str = "") -> None:
        self.code = code
        self.path = path
        self.detail = detail
        message = f"{code}:{path}"
        if detail:
            message += f":{detail}"
        super().__init__(message)


@dataclass(frozen=True, slots=True)
class RuntimeLibraryExpectation:
    absolute_path: str
    byte_length: int
    plain_sha256: str
    expected_soname: str
    expected_version: str
    expected_abi: str


@dataclass(frozen=True, slots=True)
class RuntimeLibraryObservation:
    library_id: str
    absolute_path: str
    byte_length: int
    plain_sha256: str
    expected_soname: str
    expected_version: str
    expected_abi: str
    device_id: int
    inode: int
    mode: int
    mode_file_type: int
    link_count: int
    mtime_nanoseconds: int
    ctime_nanoseconds: int
    raw_bytes: bytes
    security_profile: str
    production_security_profile_established: bool
    exact_size_match_established: bool
    plain_sha256_match_established: bool
    identity_stability_established: bool
    fresh_reopen_match_established: bool
    soname_observed: bool
    soname_match_established: bool
    version_observed: bool
    version_match_established: bool
    abi_observed: bool
    abi_match_established: bool


@dataclass(frozen=True, slots=True)
class Replay256RuntimeManifestCandidate:
    mpfr: RuntimeLibraryObservation
    gmp: RuntimeLibraryObservation
    security_profile: str
    required_mpfr_symbols: tuple[str, ...]
    required_gmp_symbols: tuple[str, ...]
    named_get_d_barriers: tuple[str, ...]
    byte_identity_observation_complete: bool
    pair_concurrent_immutability_established: bool
    soname_observation_complete: bool
    version_observation_complete: bool
    abi_observation_complete: bool
    required_symbols_observed: bool
    runtime_loader_available: bool
    symbol_resolution_available: bool
    runtime_configuration_available: bool
    canary_available: bool
    conformance_available: bool
    serialization_barrier_available: bool
    policy_arithmetic_available: bool
    dynamic_loading_attempted: bool
    symbol_resolution_attempted: bool
    runtime_configuration_attempted: bool
    canary_executed: bool
    conformance_executed: bool
    runtime_authority: bool
    runtime_conformance_authority: bool
    toolchain_binding_authority: bool
    policy_arithmetic_authority: bool
    scientific_authority: bool
    proof_authority: bool
    gate_authority: bool
    admission_authority: bool
    registration_authority: bool


@dataclass(frozen=True, slots=True)
class _FileSnapshot:
    absolute_path: str
    byte_length: int
    plain_sha256: str
    device_id: int
    inode: int
    mode: int
    link_count: int
    mtime_nanoseconds: int
    ctime_nanoseconds: int
    raw_bytes: bytes


@dataclass(frozen=True, slots=True)
class _HeldDirectory:
    descriptor: int
    absolute_path: str
    identity: tuple[int, ...]


def _fail(code: str, path: str = "<runtime>", detail: str = "") -> None:
    raise Replay256RuntimeError(code, path, detail)


def _runtime_host() -> str:
    if sys.platform == "linux" and os.name == "posix":
        return "linux"
    if sys.platform == "win32" and os.name == "nt":
        return "windows"
    return "unsupported"


def _require_linux_x86_64_lp64_little_endian() -> None:
    if _runtime_host() != "linux":
        _fail("linux_x86_64_lp64_little_endian_required")
    uname = getattr(os, "uname", None)
    if uname is None:
        _fail("linux_x86_64_lp64_little_endian_required", detail="uname_absent")
    try:
        machine = uname().machine
    except (AttributeError, OSError) as error:
        raise Replay256RuntimeError(
            "linux_x86_64_lp64_little_endian_required",
            detail="uname_failed",
        ) from error
    if (
        machine != "x86_64"
        or struct.calcsize("P") != 8
        or struct.calcsize("l") != 8
        or struct.calcsize("i") != 4
        or sys.byteorder != "little"
    ):
        _fail(
            "linux_x86_64_lp64_little_endian_required",
            detail=(
                f"machine={machine}:pointer={struct.calcsize('P')}:"
                f"long={struct.calcsize('l')}:int={struct.calcsize('i')}:"
                f"byteorder={sys.byteorder}"
            ),
        )


def _validated_text(value: object, code: str, path: str) -> str:
    if (
        type(value) is not str
        or not value
        or len(value) > _MAX_EXPECTATION_TEXT_LENGTH
        or value.strip() != value
        or any(ord(character) < 0x21 or ord(character) > 0x7E for character in value)
    ):
        _fail(code, path)
    return value


def _validated_absolute_path(value: object, host: str) -> str:
    if type(value) is not str or not value or "\x00" in value:
        _fail("absolute_library_path_required", repr(value))
    if host == "linux":
        if not value.startswith("/") or value.startswith("//") or value == "/":
            _fail("absolute_library_path_required", value)
        components = value.split("/")[1:]
        if any(component in ("", ".", "..") for component in components):
            _fail("canonical_absolute_library_path_required", value)
        return value

    path = Path(value)
    if not path.is_absolute():
        _fail("absolute_library_path_required", value)
    if os.path.normpath(value) != value or os.path.abspath(value) != value:
        _fail("canonical_absolute_library_path_required", value)
    return value


def _validated_expectation(
    expectation: RuntimeLibraryExpectation,
    library_id: str,
    host: str,
) -> RuntimeLibraryExpectation:
    if type(expectation) is not RuntimeLibraryExpectation:
        _fail("runtime_library_expectation_required", detail=library_id)
    path = _validated_absolute_path(expectation.absolute_path, host)
    if (
        type(expectation.byte_length) is not int
        or expectation.byte_length <= 0
        or expectation.byte_length > MAX_RUNTIME_LIBRARY_BYTES
    ):
        _fail("invalid_expected_size", path)
    if type(expectation.plain_sha256) is not str or not _SHA256_RE.fullmatch(
        expectation.plain_sha256
    ):
        _fail("invalid_plain_sha256", path)
    soname = _validated_text(expectation.expected_soname, "invalid_expected_soname", path)
    if "/" in soname or "\\" in soname:
        _fail("invalid_expected_soname", path)
    version = _validated_text(
        expectation.expected_version,
        "invalid_expected_version",
        path,
    )
    abi = _validated_text(expectation.expected_abi, "invalid_expected_abi", path)
    return RuntimeLibraryExpectation(
        absolute_path=path,
        byte_length=expectation.byte_length,
        plain_sha256=expectation.plain_sha256,
        expected_soname=soname,
        expected_version=version,
        expected_abi=abi,
    )


def _directory_identity(metadata: os.stat_result) -> tuple[int, ...]:
    return (
        metadata.st_dev,
        metadata.st_ino,
        metadata.st_mode,
        metadata.st_mtime_ns,
        metadata.st_ctime_ns,
    )


def _file_identity(metadata: os.stat_result) -> tuple[int, ...]:
    return (
        metadata.st_dev,
        metadata.st_ino,
        metadata.st_mode,
        metadata.st_nlink,
        metadata.st_size,
        metadata.st_mtime_ns,
        metadata.st_ctime_ns,
    )


def _file_open_identity_compatibility(metadata: os.stat_result) -> tuple[int, ...]:
    return (
        metadata.st_dev,
        metadata.st_ino,
        stat.S_IFMT(metadata.st_mode),
        metadata.st_nlink,
        metadata.st_size,
        metadata.st_mtime_ns,
    )


def _validate_directory(metadata: os.stat_result, path: str) -> None:
    if not stat.S_ISDIR(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode):
        _fail("ordinary_directory_required", path)


def _validate_file(
    metadata: os.stat_result,
    expectation: RuntimeLibraryExpectation,
) -> None:
    path = expectation.absolute_path
    if not stat.S_ISREG(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode):
        _fail("regular_file_required", path)
    if metadata.st_nlink != 1:
        _fail("single_link_required", path, f"nlink={metadata.st_nlink}")
    if metadata.st_size != expectation.byte_length:
        _fail(
            "exact_size_required",
            path,
            f"expected={expectation.byte_length}:observed={metadata.st_size}",
        )


def _read_exact(descriptor: int, byte_length: int, path: str) -> bytes:
    content = bytearray()
    while len(content) < byte_length:
        try:
            chunk = os.read(
                descriptor,
                min(_READ_CHUNK_BYTES, byte_length - len(content)),
            )
        except OSError as error:
            raise Replay256RuntimeError(
                "library_read_failed", path, f"errno={error.errno}"
            ) from error
        if not chunk:
            _fail("short_read", path, f"offset={len(content)}")
        content.extend(chunk)
    try:
        trailing = os.read(descriptor, 1)
    except OSError as error:
        raise Replay256RuntimeError(
            "library_read_failed", path, f"errno={error.errno}"
        ) from error
    if trailing:
        _fail("file_grew_or_trailing_bytes", path)
    return bytes(content)


def _snapshot(
    expectation: RuntimeLibraryExpectation,
    metadata: os.stat_result,
    raw_bytes: bytes,
    *,
    verify_digest: bool,
) -> _FileSnapshot:
    digest = hashlib.sha256(raw_bytes).hexdigest()
    if verify_digest and digest != expectation.plain_sha256:
        _fail("plain_sha256_mismatch", expectation.absolute_path)
    return _FileSnapshot(
        absolute_path=expectation.absolute_path,
        byte_length=expectation.byte_length,
        plain_sha256=digest,
        device_id=metadata.st_dev,
        inode=metadata.st_ino,
        mode=metadata.st_mode,
        link_count=metadata.st_nlink,
        mtime_nanoseconds=metadata.st_mtime_ns,
        ctime_nanoseconds=metadata.st_ctime_ns,
        raw_bytes=raw_bytes,
    )


def _open_linux_parent(
    absolute_path: str,
) -> tuple[list[_HeldDirectory], int, str]:
    required_flags = ("O_CLOEXEC", "O_DIRECTORY", "O_NOFOLLOW")
    if any(not hasattr(os, name) for name in required_flags):
        _fail("linux_nofollow_flags_unavailable", absolute_path)
    directory_flags = os.O_RDONLY | os.O_CLOEXEC | os.O_DIRECTORY | os.O_NOFOLLOW
    held: list[_HeldDirectory] = []
    try:
        root_fd = os.open("/", directory_flags)
        try:
            root_metadata = os.fstat(root_fd)
            _validate_directory(root_metadata, "/")
        except BaseException:
            os.close(root_fd)
            raise
        held.append(_HeldDirectory(root_fd, "/", _directory_identity(root_metadata)))
        components = absolute_path.split("/")[1:]
        current_fd = root_fd
        current_path = ""
        for component in components[:-1]:
            current_path += f"/{component}"
            try:
                before = os.stat(
                    component,
                    dir_fd=current_fd,
                    follow_symlinks=False,
                )
            except OSError as error:
                raise Replay256RuntimeError(
                    "directory_lstat_failed",
                    current_path,
                    f"errno={error.errno}",
                ) from error
            _validate_directory(before, current_path)
            try:
                descriptor = os.open(component, directory_flags, dir_fd=current_fd)
            except OSError as error:
                raise Replay256RuntimeError(
                    "directory_nofollow_open_failed",
                    current_path,
                    f"errno={error.errno}",
                ) from error
            try:
                opened = os.fstat(descriptor)
                _validate_directory(opened, current_path)
                if _directory_identity(before) != _directory_identity(opened):
                    _fail("directory_lstat_open_identity_changed", current_path)
            except BaseException:
                os.close(descriptor)
                raise
            held.append(
                _HeldDirectory(
                    descriptor,
                    current_path,
                    _directory_identity(opened),
                )
            )
            current_fd = descriptor
        return held, current_fd, components[-1]
    except BaseException:
        for item in reversed(held):
            os.close(item.descriptor)
        raise


def _check_held_directories(held: list[_HeldDirectory]) -> None:
    for item in held:
        try:
            current = os.fstat(item.descriptor)
        except OSError as error:
            raise Replay256RuntimeError(
                "held_directory_fstat_failed",
                item.absolute_path,
                f"errno={error.errno}",
            ) from error
        if _directory_identity(current) != item.identity:
            _fail("held_directory_identity_changed", item.absolute_path)


def _read_linux_snapshot(
    expectation: RuntimeLibraryExpectation,
    *,
    verify_digest: bool,
) -> _FileSnapshot:
    if not hasattr(os, "O_PATH") or not hasattr(os, "O_NONBLOCK"):
        _fail("linux_safe_probe_flags_unavailable", expectation.absolute_path)
    held, parent_fd, basename = _open_linux_parent(expectation.absolute_path)
    try:
        try:
            before = os.stat(basename, dir_fd=parent_fd, follow_symlinks=False)
        except OSError as error:
            raise Replay256RuntimeError(
                "library_lstat_failed",
                expectation.absolute_path,
                f"errno={error.errno}",
            ) from error
        _validate_file(before, expectation)
        probe_flags = os.O_PATH | os.O_CLOEXEC | os.O_NOFOLLOW
        try:
            probe_descriptor = os.open(basename, probe_flags, dir_fd=parent_fd)
        except OSError as error:
            raise Replay256RuntimeError(
                "library_path_probe_open_failed",
                expectation.absolute_path,
                f"errno={error.errno}",
            ) from error
        try:
            probe_opened = os.fstat(probe_descriptor)
            _validate_file(probe_opened, expectation)
            if _file_identity(before) != _file_identity(probe_opened):
                _fail("library_lstat_open_identity_changed", expectation.absolute_path)
            held_inode_path = f"/proc/self/fd/{probe_descriptor}"
            read_flags = os.O_RDONLY | os.O_CLOEXEC | os.O_NONBLOCK
            try:
                descriptor = os.open(held_inode_path, read_flags)
            except OSError as error:
                raise Replay256RuntimeError(
                    "library_held_inode_read_open_failed",
                    expectation.absolute_path,
                    f"errno={error.errno}",
                ) from error
            try:
                opened = os.fstat(descriptor)
                _validate_file(opened, expectation)
                if _file_identity(probe_opened) != _file_identity(opened):
                    _fail("library_probe_read_identity_changed", expectation.absolute_path)
                raw_bytes = _read_exact(
                    descriptor,
                    expectation.byte_length,
                    expectation.absolute_path,
                )
                after = os.fstat(descriptor)
                if _file_identity(opened) != _file_identity(after):
                    _fail("library_stat_read_stat_changed", expectation.absolute_path)
            finally:
                os.close(descriptor)
            probe_after = os.fstat(probe_descriptor)
            if _file_identity(probe_opened) != _file_identity(probe_after):
                _fail("library_probe_identity_changed", expectation.absolute_path)
        finally:
            os.close(probe_descriptor)
        try:
            final_path = os.stat(
                basename,
                dir_fd=parent_fd,
                follow_symlinks=False,
            )
        except OSError as error:
            raise Replay256RuntimeError(
                "post_read_library_lstat_failed",
                expectation.absolute_path,
                f"errno={error.errno}",
            ) from error
        if _file_identity(before) != _file_identity(final_path):
            _fail("post_read_path_identity_changed", expectation.absolute_path)
        _check_held_directories(held)
        return _snapshot(
            expectation,
            before,
            raw_bytes,
            verify_digest=verify_digest,
        )
    finally:
        for item in reversed(held):
            os.close(item.descriptor)


def _read_windows_test_snapshot(
    expectation: RuntimeLibraryExpectation,
    *,
    verify_digest: bool,
) -> _FileSnapshot:
    path = expectation.absolute_path
    try:
        before = os.lstat(path)
    except OSError as error:
        raise Replay256RuntimeError(
            "library_lstat_failed", path, f"errno={error.errno}"
        ) from error
    _validate_file(before, expectation)
    flags = os.O_RDONLY
    flags |= int(getattr(os, "O_BINARY", 0))
    flags |= int(getattr(os, "O_NOINHERIT", 0))
    flags |= int(getattr(os, "O_NOFOLLOW", 0))
    try:
        descriptor = os.open(path, flags)
    except OSError as error:
        raise Replay256RuntimeError(
            "compatibility_library_open_failed", path, f"errno={error.errno}"
        ) from error
    try:
        opened = os.fstat(descriptor)
        _validate_file(opened, expectation)
        if _file_open_identity_compatibility(before) != _file_open_identity_compatibility(
            opened
        ):
            _fail("library_lstat_open_identity_changed", path)
        raw_bytes = _read_exact(descriptor, expectation.byte_length, path)
        after = os.fstat(descriptor)
        if _file_identity(opened) != _file_identity(after):
            _fail("library_stat_read_stat_changed", path)
    finally:
        os.close(descriptor)
    try:
        final_path = os.lstat(path)
    except OSError as error:
        raise Replay256RuntimeError(
            "post_read_library_lstat_failed", path, f"errno={error.errno}"
        ) from error
    if _file_identity(before) != _file_identity(final_path):
        _fail("post_read_path_identity_changed", path)
    return _snapshot(
        expectation,
        before,
        raw_bytes,
        verify_digest=verify_digest,
    )


def _snapshot_identity(snapshot: _FileSnapshot) -> tuple[int, ...]:
    return (
        snapshot.device_id,
        snapshot.inode,
        snapshot.mode,
        snapshot.link_count,
        snapshot.byte_length,
        snapshot.mtime_nanoseconds,
        snapshot.ctime_nanoseconds,
    )


def _confirm_fresh_reopen(
    expectation: RuntimeLibraryExpectation,
    first: _FileSnapshot,
    host: str,
) -> None:
    if host == "linux":
        reopened = _read_linux_snapshot(expectation, verify_digest=False)
    else:
        reopened = _read_windows_test_snapshot(expectation, verify_digest=False)
    if _snapshot_identity(first) != _snapshot_identity(reopened):
        _fail("library_reopen_identity_changed", expectation.absolute_path)
    if first.raw_bytes != reopened.raw_bytes:
        _fail("library_reopen_bytes_changed", expectation.absolute_path)


def _public_observation(
    library_id: str,
    expectation: RuntimeLibraryExpectation,
    snapshot: _FileSnapshot,
    security_profile: str,
    production_security_profile_established: bool,
) -> RuntimeLibraryObservation:
    return RuntimeLibraryObservation(
        library_id=library_id,
        absolute_path=snapshot.absolute_path,
        byte_length=snapshot.byte_length,
        plain_sha256=snapshot.plain_sha256,
        expected_soname=expectation.expected_soname,
        expected_version=expectation.expected_version,
        expected_abi=expectation.expected_abi,
        device_id=snapshot.device_id,
        inode=snapshot.inode,
        mode=snapshot.mode,
        mode_file_type=stat.S_IFMT(snapshot.mode),
        link_count=snapshot.link_count,
        mtime_nanoseconds=snapshot.mtime_nanoseconds,
        ctime_nanoseconds=snapshot.ctime_nanoseconds,
        raw_bytes=snapshot.raw_bytes,
        security_profile=security_profile,
        production_security_profile_established=(
            production_security_profile_established
        ),
        exact_size_match_established=True,
        plain_sha256_match_established=True,
        identity_stability_established=True,
        fresh_reopen_match_established=True,
        soname_observed=False,
        soname_match_established=False,
        version_observed=False,
        version_match_established=False,
        abi_observed=False,
        abi_match_established=False,
    )


def observe_replay256_runtime_candidate(
    mpfr: RuntimeLibraryExpectation,
    gmp: RuntimeLibraryExpectation,
    *,
    test_only_allow_windows_compatibility: bool = False,
) -> Replay256RuntimeManifestCandidate:
    """Observe exact pinned bytes without making a runtime-conformance claim."""

    if type(test_only_allow_windows_compatibility) is not bool:
        _fail("invalid_windows_test_compatibility_opt_in")
    host = _runtime_host()
    if host == "linux":
        _require_linux_x86_64_lp64_little_endian()
        security_profile = LINUX_SECURITY_PROFILE
        production_security_profile_established = True
    else:
        if test_only_allow_windows_compatibility is not True:
            _fail("nonlinux_compatibility_requires_explicit_test_opt_in")
        if host != "windows":
            _fail("windows_test_compatibility_only")
        security_profile = WINDOWS_TEST_SECURITY_PROFILE
        production_security_profile_established = False

    validated_mpfr = _validated_expectation(mpfr, "mpfr", host)
    validated_gmp = _validated_expectation(gmp, "gmp", host)
    if validated_mpfr.absolute_path == validated_gmp.absolute_path:
        _fail("library_paths_must_differ", validated_mpfr.absolute_path)

    if host == "linux":
        mpfr_snapshot = _read_linux_snapshot(validated_mpfr, verify_digest=True)
        gmp_snapshot = _read_linux_snapshot(validated_gmp, verify_digest=True)
    else:
        mpfr_snapshot = _read_windows_test_snapshot(
            validated_mpfr,
            verify_digest=True,
        )
        gmp_snapshot = _read_windows_test_snapshot(
            validated_gmp,
            verify_digest=True,
        )

    if (mpfr_snapshot.device_id, mpfr_snapshot.inode) == (
        gmp_snapshot.device_id,
        gmp_snapshot.inode,
    ):
        _fail("library_inode_alias_forbidden")

    _confirm_fresh_reopen(validated_mpfr, mpfr_snapshot, host)
    _confirm_fresh_reopen(validated_gmp, gmp_snapshot, host)

    mpfr_observation = _public_observation(
        "mpfr",
        validated_mpfr,
        mpfr_snapshot,
        security_profile,
        production_security_profile_established,
    )
    gmp_observation = _public_observation(
        "gmp",
        validated_gmp,
        gmp_snapshot,
        security_profile,
        production_security_profile_established,
    )
    return Replay256RuntimeManifestCandidate(
        mpfr=mpfr_observation,
        gmp=gmp_observation,
        security_profile=security_profile,
        required_mpfr_symbols=REQUIRED_MPFR_SYMBOLS,
        required_gmp_symbols=REQUIRED_GMP_SYMBOLS,
        named_get_d_barriers=REPLAY256_NAMED_GET_D_BARRIERS,
        byte_identity_observation_complete=True,
        pair_concurrent_immutability_established=False,
        soname_observation_complete=False,
        version_observation_complete=False,
        abi_observation_complete=False,
        required_symbols_observed=False,
        runtime_loader_available=False,
        symbol_resolution_available=False,
        runtime_configuration_available=False,
        canary_available=False,
        conformance_available=False,
        serialization_barrier_available=False,
        policy_arithmetic_available=False,
        dynamic_loading_attempted=False,
        symbol_resolution_attempted=False,
        runtime_configuration_attempted=False,
        canary_executed=False,
        conformance_executed=False,
        runtime_authority=False,
        runtime_conformance_authority=False,
        toolchain_binding_authority=False,
        policy_arithmetic_authority=False,
        scientific_authority=False,
        proof_authority=False,
        gate_authority=False,
        admission_authority=False,
        registration_authority=False,
    )


__all__ = [
    "LINUX_SECURITY_PROFILE",
    "MAX_RUNTIME_LIBRARY_BYTES",
    "NUMERIC_MATERIALIZATION_GET_D_BARRIERS",
    "POSTPROJECTION_GET_D_BARRIERS",
    "REPLAY256_NAMED_GET_D_BARRIERS",
    "REQUIRED_GMP_SYMBOLS",
    "REQUIRED_MPFR_SYMBOLS",
    "Replay256RuntimeError",
    "Replay256RuntimeManifestCandidate",
    "RuntimeLibraryExpectation",
    "RuntimeLibraryObservation",
    "WINDOWS_TEST_SECURITY_PROFILE",
    "observe_replay256_runtime_candidate",
]
