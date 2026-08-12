"""Source-independent, byte-preserving readers for the sealed v3 inputs.

N32 (``/run/staging``) and R6 (``/run/postprojection-evidence``) are separate
closed inventories.  This module never combines them and never decodes their
contents as Python numeric values.  Linux is the production implementation;
the path-based non-Linux branch is non-authoritative and requires an explicit
test-only opt-in so it cannot silently substitute for the production reader.

The observations produced here are raw filesystem observations only.  They do
not assert a broker closure, candidate identity, or cross-domain hash equality.
"""

from __future__ import annotations

from collections.abc import Mapping
import ctypes
from dataclasses import dataclass
import hashlib
import os
from pathlib import Path
import posixpath
import re
import stat
import sys
from types import MappingProxyType
from typing import Final


N32_CANONICAL_ROOT: Final[str] = "/run/staging"
R6_CANONICAL_ROOT: Final[str] = "/run/postprojection-evidence"

R6_SHA256_DOMAIN: Final[bytes] = (
    b"nhm2.prolate_boson_star.newtonian_2p_seed."
    b"preprojection_evidence.array.sha256.v1\n"
)

LINUX_OPENAT2_SECURITY_PROFILE: Final[str] = (
    "linux_x86_64_openat2_beneath_no_symlinks_no_magiclinks_no_xdev"
)
NONLINUX_TEST_COMPATIBILITY_SECURITY_PROFILE: Final[str] = (
    "nonlinux_test_compatibility_non_authoritative"
)

_SHA256_RE: Final[re.Pattern[str]] = re.compile(r"^[0-9a-f]{64}$")


class V3InputError(RuntimeError):
    """Typed fail-closed raw-input rejection."""

    def __init__(self, code: str, path: str, detail: str = "") -> None:
        self.code = code
        self.path = path
        self.detail = detail
        message = f"{code}:{path}"
        if detail:
            message += f":{detail}"
        super().__init__(message)


@dataclass(frozen=True, slots=True)
class N32InputSpec:
    inventory_index: int
    level_id: str
    role: str
    relative_path: str
    canonical_absolute_path: str
    shape: tuple[int, ...]
    byte_length: int


@dataclass(frozen=True, slots=True)
class R6InputSpec:
    evidence_index: int
    level_id: str
    role: str
    relative_path: str
    canonical_absolute_path: str
    shape: tuple[int, int]
    byte_length: int


@dataclass(frozen=True, slots=True)
class N32Observation:
    inventory_index: int
    path: str
    relative_path: str
    byte_length: int
    plain_sha256: str
    device_id: int
    inode: int
    mode: int
    mode_file_type: int
    link_count: int
    mtime_nanoseconds: int
    ctime_nanoseconds: int
    raw_bytes: bytes
    security_profile: str


@dataclass(frozen=True, slots=True)
class R6Observation:
    evidence_index: int
    path: str
    relative_path: str
    byte_length: int
    plain_sha256: str
    domain_sha256: str
    device_id: int
    inode: int
    mode: int
    mode_file_type: int
    link_count: int
    mtime_nanoseconds: int
    ctime_nanoseconds: int
    raw_bytes: bytes
    security_profile: str


_N32_LEVELS: Final[tuple[tuple[str, int, int], ...]] = (
    ("L0", 64, 32),
    ("L1", 96, 48),
    ("L2", 128, 64),
    ("AUDIT", 256, 128),
)
_N32_ROLES: Final[tuple[tuple[str, str], ...]] = (
    ("newtonian_seed.grid.rho_nodes", "rho_nodes"),
    ("newtonian_seed.grid.theta_nodes", "theta_nodes"),
    ("newtonian_seed.base.scalar_u0", "base_scalar_u0"),
    ("newtonian_seed.base.potential_V0", "base_potential_V0"),
    ("newtonian_seed.target.scalar_u_A", "target_scalar_u_A"),
    ("newtonian_seed.target.potential_V_A", "target_potential_V_A"),
    ("newtonian_seed.multipole.scalar_odd", "multipole_scalar_odd"),
    ("newtonian_seed.multipole.potential_even", "multipole_potential_even"),
)


def _n32_shape(role_index: int, radial: int, angular: int) -> tuple[int, ...]:
    if role_index == 0:
        return (radial,)
    if role_index == 1:
        return (angular,)
    if role_index in (4, 5):
        return (7, radial, angular)
    if role_index in (6, 7):
        return (radial, (angular + 1) // 2)
    return (radial, angular)


def _element_count(shape: tuple[int, ...]) -> int:
    count = 1
    for extent in shape:
        count *= extent
    return count


def _build_n32_inventory() -> tuple[N32InputSpec, ...]:
    entries: list[N32InputSpec] = []
    for level_index, (level_id, radial, angular) in enumerate(_N32_LEVELS):
        for role_index, (role, stem) in enumerate(_N32_ROLES):
            relative_path = f"arrays/{level_id}/{role_index:02d}-{stem}.f64le"
            shape = _n32_shape(role_index, radial, angular)
            entries.append(
                N32InputSpec(
                    inventory_index=level_index * len(_N32_ROLES) + role_index,
                    level_id=level_id,
                    role=role,
                    relative_path=relative_path,
                    canonical_absolute_path=f"{N32_CANONICAL_ROOT}/{relative_path}",
                    shape=shape,
                    byte_length=8 * _element_count(shape),
                )
            )
    return tuple(entries)


_R6_LEVELS: Final[tuple[tuple[str, tuple[int, int]], ...]] = (
    ("L0", (64, 32)),
    ("L1", (96, 48)),
    ("L2", (128, 64)),
)
_R6_ROLES: Final[tuple[tuple[str, str], ...]] = (
    ("newtonian_seed.evidence.preprojection.raw_scalar_u", "raw-scalar-u"),
    ("newtonian_seed.evidence.preprojection.raw_potential_V", "raw-potential-v"),
)


def _build_r6_inventory() -> tuple[R6InputSpec, ...]:
    entries: list[R6InputSpec] = []
    for level_index, (level_id, shape) in enumerate(_R6_LEVELS):
        for role_index, (role, stem) in enumerate(_R6_ROLES):
            relative_path = f"{level_id}/{role_index:02d}-{stem}.f64le"
            entries.append(
                R6InputSpec(
                    evidence_index=level_index * len(_R6_ROLES) + role_index,
                    level_id=level_id,
                    role=role,
                    relative_path=relative_path,
                    canonical_absolute_path=f"{R6_CANONICAL_ROOT}/{relative_path}",
                    shape=shape,
                    byte_length=8 * _element_count(shape),
                )
            )
    return tuple(entries)


N32_INVENTORY: Final[tuple[N32InputSpec, ...]] = _build_n32_inventory()
R6_INVENTORY: Final[tuple[R6InputSpec, ...]] = _build_r6_inventory()
N32_TOTAL_BYTE_LENGTH: Final[int] = sum(item.byte_length for item in N32_INVENTORY)
R6_TOTAL_BYTE_LENGTH: Final[int] = sum(item.byte_length for item in R6_INVENTORY)

if (
    len(N32_INVENTORY) != 32
    or tuple(item.inventory_index for item in N32_INVENTORY) != tuple(range(32))
    or N32_TOTAL_BYTE_LENGTH != 6_482_304
):
    raise RuntimeError("frozen_n32_inventory_invariant_failed")
if (
    len(R6_INVENTORY) != 6
    or tuple(item.evidence_index for item in R6_INVENTORY) != tuple(range(6))
    or R6_TOTAL_BYTE_LENGTH != 237_568
):
    raise RuntimeError("frozen_r6_inventory_invariant_failed")


def _children_by_directory(
    relative_paths: tuple[str, ...],
) -> tuple[tuple[str, tuple[str, ...]], ...]:
    children: dict[str, set[str]] = {"": set()}
    for relative_path in relative_paths:
        components = relative_path.split("/")
        if (
            not components
            or any(component in ("", ".", "..") for component in components)
            or relative_path.startswith("/")
        ):
            raise RuntimeError("noncanonical_frozen_relative_path")
        parent = ""
        for component in components[:-1]:
            children.setdefault(parent, set()).add(component)
            parent = component if not parent else f"{parent}/{component}"
            children.setdefault(parent, set())
        children[parent].add(components[-1])
    return tuple(
        (directory, tuple(sorted(names)))
        for directory, names in sorted(
            children.items(), key=lambda item: (item[0].count("/"), item[0])
        )
    )


_N32_LAYOUT: Final[tuple[tuple[str, tuple[str, ...]], ...]] = (
    _children_by_directory(tuple(item.relative_path for item in N32_INVENTORY))
)
_R6_LAYOUT: Final[tuple[tuple[str, tuple[str, ...]], ...]] = (
    _children_by_directory(tuple(item.relative_path for item in R6_INVENTORY))
)


@dataclass(frozen=True, slots=True)
class _RawRead:
    path: str
    relative_path: str
    byte_length: int
    plain_sha256: str
    device_id: int
    inode: int
    mode: int
    mode_file_type: int
    link_count: int
    mtime_nanoseconds: int
    ctime_nanoseconds: int
    raw_bytes: bytes
    security_profile: str


@dataclass(frozen=True, slots=True)
class _HeldDirectory:
    relative_path: str
    descriptor: int
    identity: tuple[int, ...]


def _fail(code: str, path: str, detail: str = "") -> None:
    raise V3InputError(code, path, detail)


def _absolute_precreated_root(root: str | os.PathLike[str]) -> Path:
    try:
        path = Path(root)
    except (TypeError, ValueError) as error:
        raise V3InputError("invalid_root", repr(root)) from error
    if not path.is_absolute():
        _fail("absolute_root_required", os.fspath(path))
    return path


def _directory_identity(metadata: os.stat_result) -> tuple[int, ...]:
    return (
        metadata.st_dev,
        metadata.st_ino,
        metadata.st_mode,
        metadata.st_nlink,
        metadata.st_size,
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


def _file_open_identity_nonlinux(metadata: os.stat_result) -> tuple[int, ...]:
    """Core identity used only across a non-production Windows open.

    Windows may normalize ``st_ctime_ns`` on the first handle open for a newly
    written file.  Device, inode, mode, link count, size, and mtime still bind
    the lstat path to the opened handle.  The handle's complete metadata,
    including ctime, is then required to remain exact across read/fstat and the
    final lstat.
    """

    return (
        metadata.st_dev,
        metadata.st_ino,
        metadata.st_mode,
        metadata.st_nlink,
        metadata.st_size,
        metadata.st_mtime_ns,
    )


def _validate_directory_metadata(
    metadata: os.stat_result,
    path: str,
    root_device: int | None,
) -> None:
    if not stat.S_ISDIR(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode):
        _fail("ordinary_directory_required", path)
    if root_device is not None and metadata.st_dev != root_device:
        _fail("xdev_forbidden", path)


def _validate_file_metadata(
    metadata: os.stat_result,
    expected_size: int,
    root_device: int,
    path: str,
) -> None:
    if not stat.S_ISREG(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode):
        _fail("regular_file_required", path)
    if metadata.st_nlink != 1:
        _fail("single_link_required", path)
    if metadata.st_size != expected_size:
        _fail(
            "exact_size_required",
            path,
            f"expected={expected_size}:actual={metadata.st_size}",
        )
    if metadata.st_dev != root_device:
        _fail("xdev_forbidden", path)


def _validated_expected_hashes(
    specs: tuple[N32InputSpec, ...] | tuple[R6InputSpec, ...],
    expected: Mapping[str, str] | None,
) -> Mapping[str, str]:
    if expected is None:
        return MappingProxyType({})
    if not isinstance(expected, Mapping):
        _fail("expected_hash_mapping_required", "expected_plain_sha256")
    frozen = dict(expected)
    paths = {item.relative_path for item in specs}
    if set(frozen) != paths:
        missing = sorted(paths - set(frozen))
        extra = sorted(set(frozen) - paths)
        _fail(
            "expected_hash_inventory_mismatch",
            "expected_plain_sha256",
            f"missing={missing}:extra={extra}",
        )
    for path, digest in frozen.items():
        if type(digest) is not str or _SHA256_RE.fullmatch(digest) is None:
            _fail("invalid_expected_plain_sha256", path)
    return MappingProxyType(frozen)


def _read_exact_bytes(descriptor: int, byte_length: int, path: str) -> bytes:
    chunks: list[bytes] = []
    remaining = byte_length
    while remaining:
        try:
            chunk = os.read(descriptor, min(65_536, remaining))
        except OSError as error:
            raise V3InputError("read_failed", path, f"errno={error.errno}") from error
        if not chunk:
            _fail("short_read", path)
        chunks.append(chunk)
        remaining -= len(chunk)
    try:
        trailing = os.read(descriptor, 1)
    except OSError as error:
        raise V3InputError("eof_probe_failed", path, f"errno={error.errno}") from error
    if trailing != b"":
        _fail("file_grew_or_trailing_bytes", path)
    return b"".join(chunks)


def _plain_sha256(raw_bytes: bytes) -> str:
    return hashlib.sha256(raw_bytes).hexdigest()


def r6_domain_sha256(spec: R6InputSpec, raw_bytes: bytes) -> str:
    """Return the sealed R6 domain digest, distinct from plain SHA-256."""

    if type(raw_bytes) is not bytes:
        _fail("immutable_raw_bytes_required", spec.relative_path)
    if len(raw_bytes) != spec.byte_length:
        _fail("exact_size_required", spec.relative_path)
    path = spec.relative_path.encode("utf-8", "strict")
    role = spec.role.encode("utf-8", "strict")
    digest = hashlib.sha256()
    digest.update(R6_SHA256_DOMAIN)
    digest.update(len(path).to_bytes(8, "big"))
    digest.update(path)
    digest.update(len(role).to_bytes(8, "big"))
    digest.update(role)
    digest.update(len(raw_bytes).to_bytes(8, "big"))
    digest.update(raw_bytes)
    return digest.hexdigest()


_SYS_OPENAT2: Final[int] = 437
_RESOLVE_NO_XDEV: Final[int] = 0x01
_RESOLVE_NO_MAGICLINKS: Final[int] = 0x02
_RESOLVE_NO_SYMLINKS: Final[int] = 0x04
_RESOLVE_BENEATH: Final[int] = 0x08


class _OpenHow(ctypes.Structure):
    _fields_ = (
        ("flags", ctypes.c_uint64),
        ("mode", ctypes.c_uint64),
        ("resolve", ctypes.c_uint64),
    )


def _require_linux_x86_64_openat2_abi(relative_path: str) -> None:
    if sys.platform != "linux" or os.name != "posix":
        _fail("linux_openat2_required", relative_path)
    try:
        machine = os.uname().machine
    except (AttributeError, OSError) as error:
        raise V3InputError(
            "linux_x86_64_abi_unavailable", relative_path
        ) from error
    if (
        machine != "x86_64"
        or sys.byteorder != "little"
        or ctypes.sizeof(ctypes.c_void_p) != 8
        or ctypes.sizeof(ctypes.c_long) != 8
        or ctypes.sizeof(_OpenHow) != 24
    ):
        _fail(
            "linux_x86_64_abi_required",
            relative_path,
            (
                f"machine={machine}:byteorder={sys.byteorder}:"
                f"pointer_bytes={ctypes.sizeof(ctypes.c_void_p)}:"
                f"long_bytes={ctypes.sizeof(ctypes.c_long)}:"
                f"open_how_bytes={ctypes.sizeof(_OpenHow)}"
            ),
        )


def _open_beneath(
    root_fd: int,
    relative_path: str,
    *,
    directory: bool,
    path_only: bool = False,
) -> int:
    _require_linux_x86_64_openat2_abi(relative_path)
    required_flags = ["O_CLOEXEC", "O_NOFOLLOW", "O_DIRECTORY"]
    if path_only:
        required_flags.append("O_PATH")
    if any(not hasattr(os, name) for name in required_flags):
        _fail("linux_openat2_flags_unavailable", relative_path)
    if directory and path_only:
        _fail("invalid_openat2_mode", relative_path)
    components = relative_path.split("/")
    if (
        not relative_path
        or relative_path.startswith("/")
        or any(component in ("", ".", "..") for component in components)
        or "\x00" in relative_path
    ):
        _fail("canonical_relative_path_required", relative_path)
    encoded = relative_path.encode("utf-8", "strict")
    if path_only:
        flags = os.O_PATH | os.O_CLOEXEC | os.O_NOFOLLOW
    else:
        flags = os.O_RDONLY | os.O_CLOEXEC | os.O_NOFOLLOW
    if directory:
        flags |= os.O_DIRECTORY
    how = _OpenHow(
        flags=flags,
        mode=0,
        resolve=(
            _RESOLVE_NO_XDEV
            | _RESOLVE_NO_MAGICLINKS
            | _RESOLVE_NO_SYMLINKS
            | _RESOLVE_BENEATH
        ),
    )
    libc = ctypes.CDLL(None, use_errno=True)
    syscall = libc.syscall
    syscall.restype = ctypes.c_long
    result = syscall(
        ctypes.c_long(_SYS_OPENAT2),
        ctypes.c_int(root_fd),
        ctypes.c_char_p(encoded),
        ctypes.byref(how),
        ctypes.c_size_t(ctypes.sizeof(how)),
    )
    if result < 0:
        error_number = ctypes.get_errno()
        _fail("openat2_beneath_failed", relative_path, f"errno={error_number}")
    return int(result)


def _open_held_regular_for_read(
    probe_descriptor: int,
    relative_path: str,
) -> int:
    if not hasattr(os, "O_NONBLOCK"):
        _fail("linux_nonblocking_open_flag_unavailable", relative_path)
    try:
        return os.open(
            f"/proc/self/fd/{probe_descriptor}",
            os.O_RDONLY | os.O_CLOEXEC | os.O_NONBLOCK,
        )
    except OSError as error:
        raise V3InputError(
            "held_regular_inode_read_open_failed",
            relative_path,
            f"errno={error.errno}",
        ) from error


def _scan_fd_exact(
    descriptor: int,
    expected_names: tuple[str, ...],
    path: str,
) -> None:
    observed: set[str] = set()
    try:
        if os.lseek(descriptor, 0, os.SEEK_SET) != 0:
            _fail("directory_rewind_failed", path, "nonzero_result")
        with os.scandir(descriptor) as entries:
            for entry in entries:
                if entry.name in observed or entry.name in (".", ".."):
                    _fail("duplicate_or_dot_entry", path, entry.name)
                observed.add(entry.name)
                if entry.is_symlink():
                    _fail("symlink_forbidden", f"{path}/{entry.name}")
    except V3InputError:
        raise
    except OSError as error:
        raise V3InputError(
            "directory_rewind_or_scan_failed", path, f"errno={error.errno}"
        ) from error
    expected = set(expected_names)
    if observed != expected:
        _fail(
            "closed_inventory_mismatch",
            path,
            f"missing={sorted(expected - observed)}:extra={sorted(observed - expected)}",
        )


def _open_linux_root(root: Path) -> tuple[int, os.stat_result]:
    path = os.fspath(root)
    try:
        before = os.lstat(root)
    except OSError as error:
        raise V3InputError("root_lstat_failed", path, f"errno={error.errno}") from error
    _validate_directory_metadata(before, path, None)
    flags = os.O_RDONLY | os.O_CLOEXEC | os.O_DIRECTORY | os.O_NOFOLLOW
    try:
        descriptor = os.open(root, flags)
    except OSError as error:
        raise V3InputError("root_open_failed", path, f"errno={error.errno}") from error
    try:
        opened = os.fstat(descriptor)
    except OSError as error:
        os.close(descriptor)
        raise V3InputError(
            "root_fstat_failed", path, f"errno={error.errno}"
        ) from error
    if _directory_identity(before) != _directory_identity(opened):
        os.close(descriptor)
        _fail("root_lstat_open_identity_changed", path)
    return descriptor, before


def _open_linux_layout(
    root_fd: int,
    root_device: int,
    layout: tuple[tuple[str, tuple[str, ...]], ...],
    root_path: str,
) -> dict[str, _HeldDirectory]:
    held = {
        "": _HeldDirectory(
            relative_path="",
            descriptor=root_fd,
            identity=_directory_identity(os.fstat(root_fd)),
        )
    }
    layout_map = dict(layout)
    _scan_fd_exact(root_fd, layout_map[""], root_path)
    try:
        for relative_directory, expected_names in layout[1:]:
            parent = posixpath.dirname(relative_directory)
            basename = posixpath.basename(relative_directory)
            parent_fd = held[parent].descriptor
            actual_path = f"{root_path}/{relative_directory}"
            try:
                before = os.stat(
                    basename,
                    dir_fd=parent_fd,
                    follow_symlinks=False,
                )
            except OSError as error:
                raise V3InputError(
                    "directory_lstat_failed",
                    actual_path,
                    f"errno={error.errno}",
                ) from error
            _validate_directory_metadata(before, actual_path, root_device)
            descriptor = _open_beneath(
                root_fd,
                relative_directory,
                directory=True,
            )
            try:
                opened = os.fstat(descriptor)
            except OSError as error:
                os.close(descriptor)
                raise V3InputError(
                    "directory_fstat_failed",
                    actual_path,
                    f"errno={error.errno}",
                ) from error
            if _directory_identity(before) != _directory_identity(opened):
                os.close(descriptor)
                _fail("directory_lstat_open_identity_changed", actual_path)
            held[relative_directory] = _HeldDirectory(
                relative_path=relative_directory,
                descriptor=descriptor,
                identity=_directory_identity(before),
            )
            _scan_fd_exact(descriptor, expected_names, actual_path)
    except BaseException:
        for entry in reversed(tuple(held.values())):
            if entry.descriptor != root_fd:
                os.close(entry.descriptor)
        raise
    return held


def _read_one_linux(
    root_fd: int,
    root_device: int,
    held: Mapping[str, _HeldDirectory],
    spec: N32InputSpec | R6InputSpec,
    actual_path: str,
    expected_digest: str | None,
) -> _RawRead:
    parent = posixpath.dirname(spec.relative_path)
    basename = posixpath.basename(spec.relative_path)
    try:
        before = os.stat(
            basename,
            dir_fd=held[parent].descriptor,
            follow_symlinks=False,
        )
    except OSError as error:
        raise V3InputError(
            "file_lstat_failed", actual_path, f"errno={error.errno}"
        ) from error
    _validate_file_metadata(before, spec.byte_length, root_device, actual_path)
    probe_descriptor = _open_beneath(
        root_fd,
        spec.relative_path,
        directory=False,
        path_only=True,
    )
    descriptor = -1
    try:
        probed = os.fstat(probe_descriptor)
        _validate_file_metadata(probed, spec.byte_length, root_device, actual_path)
        if _file_identity(before) != _file_identity(probed):
            _fail("file_lstat_open_identity_changed", actual_path)
        descriptor = _open_held_regular_for_read(
            probe_descriptor,
            spec.relative_path,
        )
        opened = os.fstat(descriptor)
        _validate_file_metadata(opened, spec.byte_length, root_device, actual_path)
        if _file_identity(probed) != _file_identity(opened):
            _fail("file_probe_read_identity_changed", actual_path)
        raw_bytes = _read_exact_bytes(descriptor, spec.byte_length, actual_path)
        after = os.fstat(descriptor)
        if _file_identity(opened) != _file_identity(after):
            _fail("file_stat_read_stat_changed", actual_path)
    finally:
        if descriptor >= 0:
            os.close(descriptor)
        os.close(probe_descriptor)
    plain_digest = _plain_sha256(raw_bytes)
    if expected_digest is not None and plain_digest != expected_digest:
        _fail("plain_sha256_mismatch", actual_path)
    return _RawRead(
        path=actual_path,
        relative_path=spec.relative_path,
        byte_length=spec.byte_length,
        plain_sha256=plain_digest,
        device_id=before.st_dev,
        inode=before.st_ino,
        mode=before.st_mode,
        mode_file_type=stat.S_IFMT(before.st_mode),
        link_count=before.st_nlink,
        mtime_nanoseconds=before.st_mtime_ns,
        ctime_nanoseconds=before.st_ctime_ns,
        raw_bytes=raw_bytes,
        security_profile=LINUX_OPENAT2_SECURITY_PROFILE,
    )


def _raw_read_identity(item: _RawRead) -> tuple[int, ...]:
    return (
        item.device_id,
        item.inode,
        item.mode,
        item.link_count,
        item.byte_length,
        item.mtime_nanoseconds,
        item.ctime_nanoseconds,
    )


def _reopen_linux_and_match(
    root_fd: int,
    held: Mapping[str, _HeldDirectory],
    spec: N32InputSpec | R6InputSpec,
    observation: _RawRead,
) -> None:
    parent = posixpath.dirname(spec.relative_path)
    basename = posixpath.basename(spec.relative_path)
    current_lstat = os.stat(
        basename,
        dir_fd=held[parent].descriptor,
        follow_symlinks=False,
    )
    if _file_identity(current_lstat) != _raw_read_identity(observation):
        _fail("post_read_path_identity_changed", observation.path)
    descriptor = _open_beneath(
        root_fd,
        spec.relative_path,
        directory=False,
        path_only=True,
    )
    try:
        if _file_identity(os.fstat(descriptor)) != _raw_read_identity(observation):
            _fail("post_read_open_identity_changed", observation.path)
    finally:
        os.close(descriptor)


def _read_linux_inventory(
    root: Path,
    specs: tuple[N32InputSpec, ...] | tuple[R6InputSpec, ...],
    layout: tuple[tuple[str, tuple[str, ...]], ...],
    expected_hashes: Mapping[str, str],
) -> tuple[_RawRead, ...]:
    root_path = os.fspath(root)
    root_fd, root_before = _open_linux_root(root)
    held: dict[str, _HeldDirectory] = {}
    try:
        held = _open_linux_layout(
            root_fd,
            root_before.st_dev,
            layout,
            root_path,
        )
        observations: list[_RawRead] = []
        seen_identities: set[tuple[int, int]] = set()
        for spec in specs:
            actual_path = os.fspath(root / Path(*spec.relative_path.split("/")))
            observation = _read_one_linux(
                root_fd,
                root_before.st_dev,
                held,
                spec,
                actual_path,
                expected_hashes.get(spec.relative_path),
            )
            identity = (observation.device_id, observation.inode)
            if identity in seen_identities:
                _fail("file_inode_alias_forbidden", actual_path)
            seen_identities.add(identity)
            observations.append(observation)

        layout_map = dict(layout)
        for relative_directory, expected_names in layout:
            label = root_path
            if relative_directory:
                label = f"{root_path}/{relative_directory}"
            _scan_fd_exact(
                held[relative_directory].descriptor,
                expected_names,
                label,
            )
        for spec, observation in zip(specs, observations, strict=True):
            _reopen_linux_and_match(root_fd, held, spec, observation)
        for entry in held.values():
            if _directory_identity(os.fstat(entry.descriptor)) != entry.identity:
                path = root_path
                if entry.relative_path:
                    path = f"{root_path}/{entry.relative_path}"
                _fail("directory_identity_changed", path)
        root_after_path = os.lstat(root)
        if _directory_identity(root_after_path) != _directory_identity(root_before):
            _fail("root_path_identity_changed", root_path)
        return tuple(observations)
    finally:
        for entry in reversed(tuple(held.values())):
            if entry.descriptor != root_fd:
                os.close(entry.descriptor)
        os.close(root_fd)


def _scan_path_exact(path: Path, expected_names: tuple[str, ...]) -> None:
    observed: set[str] = set()
    try:
        with os.scandir(path) as entries:
            for entry in entries:
                if entry.name in observed or entry.name in (".", ".."):
                    _fail("duplicate_or_dot_entry", os.fspath(path), entry.name)
                observed.add(entry.name)
                if entry.is_symlink():
                    _fail("symlink_forbidden", os.fspath(path / entry.name))
    except V3InputError:
        raise
    except OSError as error:
        raise V3InputError(
            "directory_scan_failed", os.fspath(path), f"errno={error.errno}"
        ) from error
    expected = set(expected_names)
    if observed != expected:
        _fail(
            "closed_inventory_mismatch",
            os.fspath(path),
            f"missing={sorted(expected - observed)}:extra={sorted(observed - expected)}",
        )


def _read_one_nonlinux_compatibility(
    root: Path,
    root_device: int,
    spec: N32InputSpec | R6InputSpec,
    expected_digest: str | None,
) -> _RawRead:
    path = root / Path(*spec.relative_path.split("/"))
    actual_path = os.fspath(path)
    before = os.lstat(path)
    _validate_file_metadata(before, spec.byte_length, root_device, actual_path)
    flags = os.O_RDONLY
    flags |= getattr(os, "O_BINARY", 0) | getattr(os, "O_NOINHERIT", 0)
    flags |= getattr(os, "O_NOFOLLOW", 0)
    try:
        descriptor = os.open(path, flags)
    except OSError as error:
        raise V3InputError(
            "compatibility_file_open_failed",
            actual_path,
            f"errno={error.errno}",
        ) from error
    try:
        opened = os.fstat(descriptor)
        _validate_file_metadata(opened, spec.byte_length, root_device, actual_path)
        if _file_open_identity_nonlinux(before) != _file_open_identity_nonlinux(
            opened
        ):
            _fail("file_lstat_open_identity_changed", actual_path)
        raw_bytes = _read_exact_bytes(descriptor, spec.byte_length, actual_path)
        after = os.fstat(descriptor)
        if _file_identity(opened) != _file_identity(after):
            _fail("file_stat_read_stat_changed", actual_path)
    finally:
        os.close(descriptor)
    final_lstat = os.lstat(path)
    if _file_identity(before) != _file_identity(final_lstat):
        _fail("post_read_path_identity_changed", actual_path)
    plain_digest = _plain_sha256(raw_bytes)
    if expected_digest is not None and plain_digest != expected_digest:
        _fail("plain_sha256_mismatch", actual_path)
    return _RawRead(
        path=actual_path,
        relative_path=spec.relative_path,
        byte_length=spec.byte_length,
        plain_sha256=plain_digest,
        device_id=before.st_dev,
        inode=before.st_ino,
        mode=before.st_mode,
        mode_file_type=stat.S_IFMT(before.st_mode),
        link_count=before.st_nlink,
        mtime_nanoseconds=before.st_mtime_ns,
        ctime_nanoseconds=before.st_ctime_ns,
        raw_bytes=raw_bytes,
        security_profile=NONLINUX_TEST_COMPATIBILITY_SECURITY_PROFILE,
    )


def _read_nonlinux_test_compatibility(
    root: Path,
    specs: tuple[N32InputSpec, ...] | tuple[R6InputSpec, ...],
    layout: tuple[tuple[str, tuple[str, ...]], ...],
    expected_hashes: Mapping[str, str],
) -> tuple[_RawRead, ...]:
    """Non-production path used only for deterministic source tests.

    Non-Linux hosts do not provide the required openat2 resolution contract.
    This branch still checks lstat/open/fstat/read/fstat, exact inventories,
    single links, sizes, devices, and identities, but it is not an execution
    substitute for the Linux branch.
    """

    root_path = os.fspath(root)
    try:
        root_before = os.lstat(root)
    except OSError as error:
        raise V3InputError("root_lstat_failed", root_path, f"errno={error.errno}") from error
    _validate_directory_metadata(root_before, root_path, None)
    layout_map = dict(layout)
    directory_metadata: dict[str, os.stat_result] = {"": root_before}
    _scan_path_exact(root, layout_map[""])
    for relative_directory, expected_names in layout[1:]:
        path = root / Path(*relative_directory.split("/"))
        metadata = os.lstat(path)
        _validate_directory_metadata(metadata, os.fspath(path), root_before.st_dev)
        directory_metadata[relative_directory] = metadata
        _scan_path_exact(path, expected_names)

    observations: list[_RawRead] = []
    seen_identities: set[tuple[int, int]] = set()
    for spec in specs:
        observation = _read_one_nonlinux_compatibility(
            root,
            root_before.st_dev,
            spec,
            expected_hashes.get(spec.relative_path),
        )
        identity = (observation.device_id, observation.inode)
        if identity in seen_identities:
            _fail("file_inode_alias_forbidden", observation.path)
        seen_identities.add(identity)
        observations.append(observation)

    for relative_directory, expected_names in layout:
        path = root
        if relative_directory:
            path = root / Path(*relative_directory.split("/"))
        _scan_path_exact(path, expected_names)
        if _directory_identity(os.lstat(path)) != _directory_identity(
            directory_metadata[relative_directory]
        ):
            _fail("directory_identity_changed", os.fspath(path))
    return tuple(observations)


def _read_inventory(
    root: Path,
    specs: tuple[N32InputSpec, ...] | tuple[R6InputSpec, ...],
    layout: tuple[tuple[str, tuple[str, ...]], ...],
    expected_hashes: Mapping[str, str],
    *,
    test_only_allow_nonlinux_compatibility: bool,
) -> tuple[_RawRead, ...]:
    if type(test_only_allow_nonlinux_compatibility) is not bool:
        _fail(
            "invalid_nonlinux_test_compatibility_opt_in",
            os.fspath(root),
            "test_only_allow_nonlinux_compatibility must be an exact bool",
        )
    if sys.platform == "linux" and os.name == "posix":
        return _read_linux_inventory(root, specs, layout, expected_hashes)
    if not test_only_allow_nonlinux_compatibility:
        _fail(
            "nonlinux_compatibility_requires_explicit_test_opt_in",
            os.fspath(root),
            "set test_only_allow_nonlinux_compatibility=True only in tests",
        )
    return _read_nonlinux_test_compatibility(root, specs, layout, expected_hashes)


def read_n32_inputs(
    staging_root: str | os.PathLike[str],
    expected_plain_sha256: Mapping[str, str] | None = None,
    *,
    test_only_allow_nonlinux_compatibility: bool = False,
) -> tuple[N32Observation, ...]:
    """Retain N32 bytes, requiring explicit opt-in to non-Linux test mode."""

    root = _absolute_precreated_root(staging_root)
    expected = _validated_expected_hashes(N32_INVENTORY, expected_plain_sha256)
    raw_observations = _read_inventory(
        root,
        N32_INVENTORY,
        _N32_LAYOUT,
        expected,
        test_only_allow_nonlinux_compatibility=(
            test_only_allow_nonlinux_compatibility
        ),
    )
    return tuple(
        N32Observation(
            inventory_index=spec.inventory_index,
            path=raw.path,
            relative_path=raw.relative_path,
            byte_length=raw.byte_length,
            plain_sha256=raw.plain_sha256,
            device_id=raw.device_id,
            inode=raw.inode,
            mode=raw.mode,
            mode_file_type=raw.mode_file_type,
            link_count=raw.link_count,
            mtime_nanoseconds=raw.mtime_nanoseconds,
            ctime_nanoseconds=raw.ctime_nanoseconds,
            raw_bytes=raw.raw_bytes,
            security_profile=raw.security_profile,
        )
        for spec, raw in zip(N32_INVENTORY, raw_observations, strict=True)
    )


def read_r6_inputs(
    evidence_root: str | os.PathLike[str],
    expected_plain_sha256: Mapping[str, str] | None = None,
    *,
    test_only_allow_nonlinux_compatibility: bool = False,
) -> tuple[R6Observation, ...]:
    """Retain R6 bytes, requiring explicit opt-in to non-Linux test mode."""

    root = _absolute_precreated_root(evidence_root)
    expected = _validated_expected_hashes(R6_INVENTORY, expected_plain_sha256)
    raw_observations = _read_inventory(
        root,
        R6_INVENTORY,
        _R6_LAYOUT,
        expected,
        test_only_allow_nonlinux_compatibility=(
            test_only_allow_nonlinux_compatibility
        ),
    )
    return tuple(
        R6Observation(
            evidence_index=spec.evidence_index,
            path=raw.path,
            relative_path=raw.relative_path,
            byte_length=raw.byte_length,
            plain_sha256=raw.plain_sha256,
            domain_sha256=r6_domain_sha256(spec, raw.raw_bytes),
            device_id=raw.device_id,
            inode=raw.inode,
            mode=raw.mode,
            mode_file_type=raw.mode_file_type,
            link_count=raw.link_count,
            mtime_nanoseconds=raw.mtime_nanoseconds,
            ctime_nanoseconds=raw.ctime_nanoseconds,
            raw_bytes=raw.raw_bytes,
            security_profile=raw.security_profile,
        )
        for spec, raw in zip(R6_INVENTORY, raw_observations, strict=True)
    )


__all__ = [
    "LINUX_OPENAT2_SECURITY_PROFILE",
    "N32_CANONICAL_ROOT",
    "N32_INVENTORY",
    "N32_TOTAL_BYTE_LENGTH",
    "N32InputSpec",
    "N32Observation",
    "NONLINUX_TEST_COMPATIBILITY_SECURITY_PROFILE",
    "R6_CANONICAL_ROOT",
    "R6_INVENTORY",
    "R6_SHA256_DOMAIN",
    "R6_TOTAL_BYTE_LENGTH",
    "R6InputSpec",
    "R6Observation",
    "V3InputError",
    "r6_domain_sha256",
    "read_n32_inputs",
    "read_r6_inputs",
]
