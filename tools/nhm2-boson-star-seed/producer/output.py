"""Exclusive staging-array writer; never creates a descriptor or receipt."""

from __future__ import annotations

import os
from pathlib import Path
import stat
from typing import Mapping, Sequence

import numpy as np

from contract import OUTPUT_INVENTORY, OUTPUT_ROOT
from spectral import canonical_f64


def _assert_precreated_empty_tree(output_root: Path) -> None:
    if str(output_root) != str(OUTPUT_ROOT) or not output_root.is_absolute():
        raise RuntimeError("output root differs from frozen /run/staging path")
    root_stat = os.lstat(output_root)
    if not stat.S_ISDIR(root_stat.st_mode) or stat.S_ISLNK(root_stat.st_mode):
        raise RuntimeError("staging root is not a precreated ordinary directory")

    expected_by_parent = {
        ".": {"arrays"},
        "arrays": {"L0", "L1", "L2", "AUDIT"},
        "arrays/L0": set(),
        "arrays/L1": set(),
        "arrays/L2": set(),
        "arrays/AUDIT": set(),
    }
    for relative, expected_names in expected_by_parent.items():
        directory = output_root if relative == "." else output_root / relative
        directory_stat = os.lstat(directory)
        if not stat.S_ISDIR(directory_stat.st_mode) or stat.S_ISLNK(directory_stat.st_mode):
            raise RuntimeError(f"invalid staging directory: {relative}")
        with os.scandir(directory) as entries:
            observed = set()
            for entry in entries:
                observed.add(entry.name)
                if relative in (".", "arrays"):
                    if not entry.is_dir(follow_symlinks=False):
                        raise RuntimeError(f"unexpected non-directory staging entry: {entry.path}")
                else:
                    raise RuntimeError(f"staging leaf directory is not empty: {relative}")
            if observed != expected_names:
                raise RuntimeError(f"staging directory inventory mismatch: {relative}")


def prepare_payloads(
    level_arrays: Mapping[str, Sequence[np.ndarray]],
) -> tuple[tuple[str, bytes], ...]:
    """Validate the complete 32-array inventory before the first filesystem write."""

    payloads: list[tuple[str, bytes]] = []
    for item in OUTPUT_INVENTORY:
        arrays = level_arrays.get(item.level_id)
        if arrays is None or len(arrays) != 8:
            raise RuntimeError(f"missing eight-role array tuple for {item.level_id}")
        array = canonical_f64(np.asarray(arrays[item.role_index]))
        if array.shape != item.shape:
            raise RuntimeError(
                f"{item.relative_path}: shape {array.shape!r} != frozen {item.shape!r}"
            )
        zero_mask = array == 0.0
        if np.any(np.signbit(array[zero_mask])):
            raise RuntimeError(f"{item.relative_path}: negative zero remains")
        little_endian = np.asarray(array, dtype="<f8", order="C")
        raw = little_endian.tobytes(order="C")
        if len(raw) != item.byte_length:
            raise RuntimeError(f"{item.relative_path}: byte length mismatch")
        payloads.append((item.relative_path, raw))
    if len(payloads) != 32:
        raise RuntimeError("prepared staging inventory is not exactly 32 arrays")
    return tuple(payloads)


def _write_all(fd: int, raw: bytes) -> None:
    view = memoryview(raw)
    offset = 0
    while offset < len(view):
        written = os.write(fd, view[offset:])
        if written <= 0:
            raise OSError("short/nonprogressing staging-array write")
        offset += written


def _fsync_directory(path: Path) -> None:
    flags = os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC | os.O_NOFOLLOW
    descriptor = os.open(path, flags)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def write_staging_arrays_exclusive(
    output_root: Path,
    payloads: Sequence[tuple[str, bytes]],
) -> None:
    """Write exactly the frozen arrays in inventory order with O_EXCL + fsync.

    A failure deliberately leaves any already-written prefix in staging.  Such
    a prefix has no descriptor, is not a closed inventory, and therefore has no
    seed or claim authority; the trusted broker must discard the failed root.
    """

    required_os_flags = ("O_CLOEXEC", "O_NOFOLLOW", "O_DIRECTORY")
    if os.name != "posix" or any(not hasattr(os, name) for name in required_os_flags):
        raise RuntimeError("producer writer requires the frozen Linux filesystem API")
    if tuple(path for path, _ in payloads) != tuple(
        item.relative_path for item in OUTPUT_INVENTORY
    ):
        raise RuntimeError("payload order differs from frozen inventory")
    _assert_precreated_empty_tree(output_root)

    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_CLOEXEC | os.O_NOFOLLOW
    last_level: str | None = None
    for item, (relative_path, raw) in zip(OUTPUT_INVENTORY, payloads, strict=True):
        if relative_path != item.relative_path or len(raw) != item.byte_length:
            raise RuntimeError("payload/inventory mismatch immediately before write")
        if last_level is not None and item.level_id != last_level:
            _fsync_directory(output_root / "arrays" / last_level)
        destination = output_root / relative_path
        descriptor = os.open(destination, flags, 0o600)
        try:
            _write_all(descriptor, raw)
            os.fsync(descriptor)
        finally:
            os.close(descriptor)
        last_level = item.level_id
    if last_level is not None:
        _fsync_directory(output_root / "arrays" / last_level)
    _fsync_directory(output_root / "arrays")
    _fsync_directory(output_root)
