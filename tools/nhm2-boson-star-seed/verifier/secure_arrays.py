"""Linux-only fixed-inventory secure reader for the 32 staging arrays."""

from __future__ import annotations

import array
import ctypes
import hashlib
import math
import os
import stat
import sys
from dataclasses import dataclass
from typing import Final

from .contract import ARRAY_INVENTORY, ARRAY_SHA256_DOMAIN, STAGING_ROOT, ArraySpec
from .errors import block

_SYS_OPENAT2_X86_64: Final[int] = 437
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


@dataclass(frozen=True, slots=True)
class ArrayObservation:
    inventory_index: int
    level_index: int
    role_index: int
    level_id: str
    role: str
    relative_path: str
    dtype: str
    order: str
    shape: tuple[int, ...]
    element_count: int
    byte_length: int
    sha256: str
    device_id: int
    inode: int
    mtime_nanoseconds: int
    ctime_nanoseconds: int

    def replay_bundle_item(self) -> dict[str, object]:
        return {
            "inventoryIndex": self.inventory_index,
            "levelIndex": self.level_index,
            "roleIndex": self.role_index,
            "levelId": self.level_id,
            "role": self.role,
            "relativePath": self.relative_path,
            "dtype": self.dtype,
            "order": self.order,
            "shape": list(self.shape),
            "elementCount": self.element_count,
            "byteLength": self.byte_length,
            "sha256": self.sha256,
        }


@dataclass(frozen=True, slots=True)
class ArrayPayload:
    spec: ArraySpec
    values: array.array[float]
    observation: ArrayObservation


def array_domain_sha256(spec: ArraySpec, raw: bytes) -> str:
    if len(raw) != spec.byte_length:
        block("array_read", "byte_length_mismatch", spec.relative_path)
    path = spec.relative_path.encode("utf-8")
    role = spec.role.encode("utf-8")
    digest = hashlib.sha256()
    digest.update(ARRAY_SHA256_DOMAIN)
    digest.update(len(path).to_bytes(8, "big"))
    digest.update(path)
    digest.update(len(role).to_bytes(8, "big"))
    digest.update(role)
    digest.update(len(raw).to_bytes(8, "big"))
    digest.update(raw)
    return digest.hexdigest()


def decode_finite_f64le(spec: ArraySpec, raw: bytes) -> array.array[float]:
    if len(raw) != spec.byte_length or len(raw) % 8 != 0:
        block("array_decode", "exact_f64le_byte_length_required", spec.relative_path)
    for offset in range(0, len(raw), 8):
        bits = int.from_bytes(raw[offset : offset + 8], "little", signed=False)
        if bits == 0x8000000000000000:
            block("array_decode", "negative_zero_forbidden", f"{spec.relative_path}:{offset // 8}")
    values = array.array("d")
    values.frombytes(raw)
    if sys.byteorder != "little":
        values.byteswap()
    if len(values) != spec.element_count:
        block("array_decode", "element_count_mismatch", spec.relative_path)
    for index, value in enumerate(values):
        if not math.isfinite(value):
            block("array_decode", "nonfinite_value_forbidden", f"{spec.relative_path}:{index}")
    return values


def _openat2(root_fd: int, relative_path: str) -> int:
    if sys.platform != "linux" or os.uname().machine != "x86_64":
        block("array_read", "linux_x86_64_openat2_required", sys.platform)
    encoded = relative_path.encode("utf-8", "strict")
    if not encoded or b"\x00" in encoded or relative_path.startswith("/"):
        block("array_read", "canonical_relative_path_required", relative_path)
    libc = ctypes.CDLL(None, use_errno=True)
    syscall = libc.syscall
    syscall.restype = ctypes.c_long
    how = _OpenHow(
        flags=os.O_RDONLY
        | getattr(os, "O_CLOEXEC", 0)
        | getattr(os, "O_NOFOLLOW", 0),
        mode=0,
        resolve=(
            _RESOLVE_NO_XDEV
            | _RESOLVE_NO_MAGICLINKS
            | _RESOLVE_NO_SYMLINKS
            | _RESOLVE_BENEATH
        ),
    )
    result = syscall(
        ctypes.c_long(_SYS_OPENAT2_X86_64),
        ctypes.c_int(root_fd),
        ctypes.c_char_p(encoded),
        ctypes.byref(how),
        ctypes.c_size_t(ctypes.sizeof(how)),
    )
    if result < 0:
        error_number = ctypes.get_errno()
        block("array_read", "openat2_failed", f"{relative_path}:errno={error_number}")
    return int(result)


def _scan_exact_names(directory_fd: int, expected: set[str], label: str) -> None:
    try:
        with os.scandir(directory_fd) as entries:
            actual: set[str] = set()
            for entry in entries:
                if entry.name in (".", "..") or entry.name in actual:
                    block("array_inventory", "duplicate_or_dot_entry", f"{label}/{entry.name}")
                actual.add(entry.name)
                if entry.is_symlink():
                    block("array_inventory", "symlink_forbidden", f"{label}/{entry.name}")
    except OSError as error:
        block("array_inventory", "directory_scan_failed", f"{label}:errno={error.errno}")
    if actual != expected:
        missing = sorted(expected - actual)
        extra = sorted(actual - expected)
        block("array_inventory", "closed_inventory_mismatch", f"{label}:missing={missing}:extra={extra}")


def _validate_directory_tree(root_fd: int) -> None:
    _scan_exact_names(root_fd, {"arrays"}, ".")
    directory_flags = (
        os.O_RDONLY
        | getattr(os, "O_DIRECTORY", 0)
        | getattr(os, "O_CLOEXEC", 0)
        | getattr(os, "O_NOFOLLOW", 0)
    )
    try:
        arrays_fd = os.open("arrays", directory_flags, dir_fd=root_fd)
    except OSError as error:
        block("array_inventory", "arrays_directory_open_failed", f"errno={error.errno}")
    try:
        level_ids = {spec.level_id for spec in ARRAY_INVENTORY}
        _scan_exact_names(arrays_fd, level_ids, "arrays")
        for level_id in sorted(level_ids):
            try:
                level_fd = os.open(level_id, directory_flags, dir_fd=arrays_fd)
            except OSError as error:
                block("array_inventory", "level_directory_open_failed", f"{level_id}:errno={error.errno}")
            try:
                names = {
                    spec.relative_path.rsplit("/", 1)[1]
                    for spec in ARRAY_INVENTORY
                    if spec.level_id == level_id
                }
                _scan_exact_names(level_fd, names, f"arrays/{level_id}")
            finally:
                os.close(level_fd)
    finally:
        os.close(arrays_fd)


def _read_one(root_fd: int, spec: ArraySpec) -> ArrayPayload:
    descriptor = _openat2(root_fd, spec.relative_path)
    try:
        before = os.fstat(descriptor)
        if (
            not stat.S_ISREG(before.st_mode)
            or before.st_nlink != 1
            or before.st_size != spec.byte_length
        ):
            block("array_read", "regular_single_link_exact_size_required", spec.relative_path)
        chunks: list[bytes] = []
        remaining = spec.byte_length
        while remaining:
            chunk = os.read(descriptor, min(65536, remaining))
            if not chunk:
                block("array_read", "short_read", spec.relative_path)
            chunks.append(chunk)
            remaining -= len(chunk)
        if os.read(descriptor, 1) != b"":
            block("array_read", "trailing_read_probe_failed", spec.relative_path)
        after = os.fstat(descriptor)
        before_identity = (
            before.st_dev,
            before.st_ino,
            before.st_size,
            before.st_mtime_ns,
            before.st_ctime_ns,
            before.st_nlink,
            stat.S_IFMT(before.st_mode),
        )
        after_identity = (
            after.st_dev,
            after.st_ino,
            after.st_size,
            after.st_mtime_ns,
            after.st_ctime_ns,
            after.st_nlink,
            stat.S_IFMT(after.st_mode),
        )
        if before_identity != after_identity:
            block("array_read", "stat_read_stat_changed", spec.relative_path)
        raw = b"".join(chunks)
        digest = array_domain_sha256(spec, raw)
        values = decode_finite_f64le(spec, raw)
        observation = ArrayObservation(
            inventory_index=spec.inventory_index,
            level_index=spec.level_index,
            role_index=spec.role_index,
            level_id=spec.level_id,
            role=spec.role,
            relative_path=spec.relative_path,
            dtype=spec.dtype,
            order=spec.order,
            shape=spec.shape,
            element_count=spec.element_count,
            byte_length=spec.byte_length,
            sha256=digest,
            device_id=before.st_dev,
            inode=before.st_ino,
            mtime_nanoseconds=before.st_mtime_ns,
            ctime_nanoseconds=before.st_ctime_ns,
        )
        return ArrayPayload(spec=spec, values=values, observation=observation)
    finally:
        os.close(descriptor)


def _observation_identity(observation: ArrayObservation) -> tuple[int, ...]:
    return (
        observation.device_id,
        observation.inode,
        observation.byte_length,
        observation.mtime_nanoseconds,
        observation.ctime_nanoseconds,
        1,
        stat.S_IFREG,
    )


def _reopen_and_match_observation(root_fd: int, payload: ArrayPayload) -> None:
    descriptor = _openat2(root_fd, payload.spec.relative_path)
    try:
        current = os.fstat(descriptor)
        identity = (
            current.st_dev,
            current.st_ino,
            current.st_size,
            current.st_mtime_ns,
            current.st_ctime_ns,
            current.st_nlink,
            stat.S_IFMT(current.st_mode),
        )
        if identity != _observation_identity(payload.observation):
            block(
                "array_read",
                "post_read_path_identity_changed",
                payload.spec.relative_path,
            )
    finally:
        os.close(descriptor)


def read_exact_array_inventory(staging_root: str) -> tuple[ArrayPayload, ...]:
    if sys.platform != "linux" or os.uname().machine != "x86_64":
        block("array_read", "linux_x86_64_verifier_required", sys.platform)
    if staging_root != STAGING_ROOT:
        block("array_read", "exact_staging_root_required", staging_root)
    flags = (
        os.O_RDONLY
        | getattr(os, "O_DIRECTORY", 0)
        | getattr(os, "O_CLOEXEC", 0)
        | getattr(os, "O_NOFOLLOW", 0)
    )
    try:
        root_fd = os.open(staging_root, flags)
    except OSError as error:
        block("array_read", "staging_root_open_failed", f"errno={error.errno}")
    try:
        root_before = os.fstat(root_fd)
        if not stat.S_ISDIR(root_before.st_mode):
            block("array_read", "staging_root_directory_required", staging_root)
        _validate_directory_tree(root_fd)
        payloads = tuple(_read_one(root_fd, spec) for spec in ARRAY_INVENTORY)
        if tuple(item.spec.inventory_index for item in payloads) != tuple(range(32)):
            block("array_inventory", "inventory_order_mismatch", "0_through_31_required")
        _validate_directory_tree(root_fd)
        for payload in payloads:
            _reopen_and_match_observation(root_fd, payload)
        _validate_directory_tree(root_fd)
        root_after = os.fstat(root_fd)
        root_before_identity = (
            root_before.st_dev,
            root_before.st_ino,
            root_before.st_mtime_ns,
            root_before.st_ctime_ns,
            stat.S_IFMT(root_before.st_mode),
        )
        root_after_identity = (
            root_after.st_dev,
            root_after.st_ino,
            root_after.st_mtime_ns,
            root_after.st_ctime_ns,
            stat.S_IFMT(root_after.st_mode),
        )
        if root_before_identity != root_after_identity:
            block("array_read", "staging_root_identity_changed", staging_root)
        return payloads
    finally:
        os.close(root_fd)
