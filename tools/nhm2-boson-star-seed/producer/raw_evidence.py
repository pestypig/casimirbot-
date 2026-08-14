"""Exact raw preprojection evidence preparation and exclusive writer.

This module has one deliberately narrow duty: preserve the six unpacked
binary64 Newton-result arrays as raw little-endian bytes before projection,
masking, phase selection, resampling, or value canonicalization.  It creates
no descriptor, receipt, gate result, or scientific authority.
"""

from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path
import stat
import sys
from typing import Mapping, Sequence

import numpy as np


@dataclass(frozen=True, slots=True)
class RawEvidenceSpec:
    evidence_index: int
    level_index: int
    role_index: int
    level_id: str
    role: str
    relative_path: str
    shape: tuple[int, int]
    element_count: int
    byte_length: int


@dataclass(frozen=True, slots=True)
class FrozenRawLevelEvidence:
    """Immutable preprojection bytes captured at one solver-level boundary."""

    level_id: str
    scalar_f64le: bytes
    potential_f64le: bytes

    def __post_init__(self) -> None:
        if type(self.level_id) is not str:
            raise TypeError("raw evidence level id must be an exact string")
        matching = tuple(
            item for item in RAW_EVIDENCE_INVENTORY if item.level_id == self.level_id
        )
        if len(matching) != 2:
            raise ValueError("raw evidence level id is not frozen")
        _validate_f64le_payload(matching[0], self.scalar_f64le)
        _validate_f64le_payload(matching[1], self.potential_f64le)


_LEVELS = (
    ("L0", (64, 32)),
    ("L1", (96, 48)),
    ("L2", (128, 64)),
)
_ROLES = (
    (
        "newtonian_seed.evidence.preprojection.raw_scalar_u",
        "00-raw-scalar-u.f64le",
    ),
    (
        "newtonian_seed.evidence.preprojection.raw_potential_V",
        "01-raw-potential-v.f64le",
    ),
)


def _inventory() -> tuple[RawEvidenceSpec, ...]:
    entries: list[RawEvidenceSpec] = []
    for level_index, (level_id, shape) in enumerate(_LEVELS):
        element_count = shape[0] * shape[1]
        for role_index, (role, basename) in enumerate(_ROLES):
            entries.append(
                RawEvidenceSpec(
                    evidence_index=2 * level_index + role_index,
                    level_index=level_index,
                    role_index=role_index,
                    level_id=level_id,
                    role=role,
                    relative_path=f"{level_id}/{basename}",
                    shape=shape,
                    element_count=element_count,
                    byte_length=8 * element_count,
                )
            )
    return tuple(entries)


RAW_EVIDENCE_INVENTORY = _inventory()
RAW_EVIDENCE_RELATIVE_PATHS = tuple(
    item.relative_path for item in RAW_EVIDENCE_INVENTORY
)
RAW_EVIDENCE_TOTAL_ELEMENT_COUNT = sum(
    item.element_count for item in RAW_EVIDENCE_INVENTORY
)
RAW_EVIDENCE_TOTAL_BYTE_LENGTH = sum(
    item.byte_length for item in RAW_EVIDENCE_INVENTORY
)

if (
    len(RAW_EVIDENCE_INVENTORY) != 6
    or tuple(item.evidence_index for item in RAW_EVIDENCE_INVENTORY)
    != tuple(range(6))
    or RAW_EVIDENCE_TOTAL_ELEMENT_COUNT != 29_696
    or RAW_EVIDENCE_TOTAL_BYTE_LENGTH != 237_568
):
    raise RuntimeError("frozen_raw_evidence_inventory_invariant_failed")


PreparedRawEvidence = tuple[tuple[str, bytes], ...]


def _validate_f64le_payload(item: RawEvidenceSpec, raw: bytes) -> bytes:
    if type(raw) is not bytes:
        raise TypeError(f"{item.relative_path}: immutable bytes required")
    if len(raw) != item.byte_length:
        raise ValueError(f"{item.relative_path}: payload byte length mismatch")
    bits = np.frombuffer(raw, dtype=np.dtype("<u8"))
    exponent = bits & np.uint64(0x7FF0000000000000)
    if bool(np.any(exponent == np.uint64(0x7FF0000000000000))):
        raise ValueError(f"{item.relative_path}: nonfinite value forbidden")
    if bool(np.any(bits == np.uint64(0x8000000000000000))):
        raise ValueError(f"{item.relative_path}: negative zero forbidden")
    return raw


def _exact_little_endian_bytes(
    item: RawEvidenceSpec,
    array: np.ndarray,
) -> bytes:
    # ndarray subclasses can override/rewrite NumPy validation semantics.  In
    # particular, MaskedArray may hide a nonfinite or negative-zero element
    # from the reductions below while its underlying bytes are still emitted.
    # The frozen raw-evidence boundary therefore accepts only the exact base
    # ndarray representation supplied by the solver unpack step.
    if type(array) is not np.ndarray:
        raise TypeError(f"{item.relative_path}: exact base numpy ndarray required")
    if array.dtype.kind != "f" or array.dtype.itemsize != 8:
        raise TypeError(f"{item.relative_path}: binary64 dtype required")
    if array.shape != item.shape:
        raise ValueError(
            f"{item.relative_path}: shape {array.shape!r} != frozen {item.shape!r}"
        )
    if not array.flags.c_contiguous:
        raise ValueError(f"{item.relative_path}: C-contiguous array required")
    if not bool(np.all(np.isfinite(array))):
        raise ValueError(f"{item.relative_path}: nonfinite value forbidden")
    zero_mask = array == 0.0
    if bool(np.any(np.signbit(array[zero_mask]))):
        raise ValueError(f"{item.relative_path}: negative zero forbidden")

    # This is only an endian projection.  No arithmetic, zero normalization,
    # or other value canonicalization is permitted on the raw evidence path.
    little_endian = np.asarray(array, dtype=np.dtype("<f8"), order="C")
    raw = little_endian.tobytes(order="C")
    if len(raw) != item.byte_length:
        raise RuntimeError(f"{item.relative_path}: byte length invariant failed")
    return raw


def prepare_raw_evidence(
    level_arrays: Mapping[str, Sequence[np.ndarray]],
) -> PreparedRawEvidence:
    """Validate and freeze all six payloads before any filesystem mutation.

    ``level_arrays`` must contain exactly ``L0``, ``L1``, and ``L2``.  Each
    value is exactly ``(raw_scalar_u, raw_potential_V)`` in that order.
    """

    if not isinstance(level_arrays, Mapping):
        raise TypeError("raw evidence input must be a level mapping")
    expected_levels = {level_id for level_id, _ in _LEVELS}
    if set(level_arrays) != expected_levels:
        raise ValueError("raw evidence level inventory must be exactly L0,L1,L2")

    payloads: list[tuple[str, bytes]] = []
    for item in RAW_EVIDENCE_INVENTORY:
        arrays = level_arrays[item.level_id]
        if isinstance(arrays, np.ndarray) or len(arrays) != 2:
            raise ValueError(
                f"{item.level_id}: exactly scalar and potential arrays required"
            )
        array = arrays[item.role_index]
        payloads.append(
            (item.relative_path, _exact_little_endian_bytes(item, array))
        )
    return tuple(payloads)


def freeze_raw_level_evidence(
    level_id: str,
    scalar: np.ndarray,
    potential: np.ndarray,
) -> FrozenRawLevelEvidence:
    """Snapshot one exact unpacked Newton result before any projection work."""

    if type(level_id) is not str:
        raise TypeError("raw evidence level id must be an exact string")
    matching = tuple(
        item for item in RAW_EVIDENCE_INVENTORY if item.level_id == level_id
    )
    if len(matching) != 2:
        raise ValueError("raw evidence level id is not frozen")
    return FrozenRawLevelEvidence(
        level_id=level_id,
        scalar_f64le=_exact_little_endian_bytes(matching[0], scalar),
        potential_f64le=_exact_little_endian_bytes(matching[1], potential),
    )


def prepare_frozen_raw_evidence(
    levels: tuple[
        FrozenRawLevelEvidence,
        FrozenRawLevelEvidence,
        FrozenRawLevelEvidence,
    ],
) -> PreparedRawEvidence:
    """Assemble the exact six captured byte leaves without reserializing arrays."""

    if type(levels) is not tuple or len(levels) != len(_LEVELS):
        raise TypeError("frozen raw evidence input must be an exact three-tuple")
    by_level: dict[str, FrozenRawLevelEvidence] = {}
    for (expected_level_id, _), level in zip(_LEVELS, levels, strict=True):
        if type(level) is not FrozenRawLevelEvidence:
            raise TypeError(f"{expected_level_id}: exact frozen evidence type required")
        if level.level_id != expected_level_id:
            raise ValueError("frozen raw evidence order must be exactly L0,L1,L2")
        by_level[expected_level_id] = level
    payloads: list[tuple[str, bytes]] = []
    for item in RAW_EVIDENCE_INVENTORY:
        level = by_level[item.level_id]
        raw = (
            level.scalar_f64le
            if item.role_index == 0
            else level.potential_f64le
        )
        payloads.append((item.relative_path, _validate_f64le_payload(item, raw)))
    return tuple(payloads)


def _validated_payload_tuple(
    payloads: Sequence[tuple[str, bytes]],
) -> PreparedRawEvidence:
    if type(payloads) is not tuple:
        raise TypeError("raw evidence payload inventory must be an exact tuple")
    if len(payloads) != len(RAW_EVIDENCE_INVENTORY):
        raise ValueError("raw evidence payload count must be exactly six")
    for item, payload in zip(RAW_EVIDENCE_INVENTORY, payloads, strict=True):
        if type(payload) is not tuple or len(payload) != 2:
            raise TypeError("raw evidence payload entries must be (path, bytes)")
        relative_path, raw = payload
        if type(relative_path) is not str:
            raise TypeError("raw evidence payload path must be an exact string")
        if relative_path != item.relative_path:
            raise ValueError("raw evidence payload order/path differs from inventory")
        _validate_f64le_payload(item, raw)
    return tuple(
        (item.relative_path, raw)
        for item, (_, raw) in zip(RAW_EVIDENCE_INVENTORY, payloads, strict=True)
    )


def _ordinary_directory(metadata: os.stat_result) -> bool:
    return stat.S_ISDIR(metadata.st_mode) and not stat.S_ISLNK(metadata.st_mode)


def _assert_precreated_empty_tree_by_path(root: Path) -> None:
    try:
        root_metadata = os.lstat(root)
    except OSError as error:
        raise RuntimeError("raw evidence root is unavailable") from error
    if not _ordinary_directory(root_metadata):
        raise RuntimeError("raw evidence root must be an ordinary directory")

    expected_levels = {level_id for level_id, _ in _LEVELS}
    with os.scandir(root) as entries:
        observed = {entry.name for entry in entries}
    if observed != expected_levels:
        raise RuntimeError("raw evidence root directory inventory mismatch")

    for level_id, _ in _LEVELS:
        level_path = root / level_id
        metadata = os.lstat(level_path)
        if not _ordinary_directory(metadata):
            raise RuntimeError(f"raw evidence level is not ordinary: {level_id}")
        with os.scandir(level_path) as entries:
            if next(iter(entries), None) is not None:
                raise RuntimeError(f"raw evidence level is not empty: {level_id}")


def _same_open_identity(left: os.stat_result, right: os.stat_result) -> bool:
    return (
        left.st_dev,
        left.st_ino,
        stat.S_IFMT(left.st_mode),
    ) == (
        right.st_dev,
        right.st_ino,
        stat.S_IFMT(right.st_mode),
    )


def _require_same_device(
    root_metadata: os.stat_result,
    child_metadata: os.stat_result,
    label: str,
) -> None:
    if child_metadata.st_dev != root_metadata.st_dev:
        raise RuntimeError(f"cross-device raw evidence directory forbidden: {label}")


def _scan_fd_exact(directory_fd: int, expected: set[str], label: str) -> None:
    with os.scandir(directory_fd) as entries:
        observed: set[str] = set()
        for entry in entries:
            if entry.name in observed or entry.name in (".", ".."):
                raise RuntimeError(f"duplicate or dot entry in {label}")
            observed.add(entry.name)
            if entry.is_symlink():
                raise RuntimeError(f"symlink forbidden in {label}")
    if observed != expected:
        raise RuntimeError(f"{label} directory inventory mismatch")


def _open_posix_empty_tree(root: Path) -> tuple[int, dict[str, int]]:
    required_flags = ("O_CLOEXEC", "O_DIRECTORY", "O_NOFOLLOW")
    if any(not hasattr(os, name) for name in required_flags):
        raise RuntimeError("Linux no-follow directory API is required")
    before_root = os.lstat(root)
    if not _ordinary_directory(before_root):
        raise RuntimeError("raw evidence root must be an ordinary directory")
    directory_flags = os.O_RDONLY | os.O_CLOEXEC | os.O_DIRECTORY | os.O_NOFOLLOW
    root_fd = os.open(root, directory_flags)
    level_fds: dict[str, int] = {}
    try:
        opened_root = os.fstat(root_fd)
        if not _same_open_identity(before_root, opened_root):
            raise RuntimeError("raw evidence root changed during secure open")
        expected_levels = {level_id for level_id, _ in _LEVELS}
        _scan_fd_exact(root_fd, expected_levels, "raw evidence root")
        for level_id, _ in _LEVELS:
            before_level = os.stat(level_id, dir_fd=root_fd, follow_symlinks=False)
            if not _ordinary_directory(before_level):
                raise RuntimeError(
                    f"raw evidence level is not ordinary: {level_id}"
                )
            _require_same_device(before_root, before_level, level_id)
            level_fd = os.open(level_id, directory_flags, dir_fd=root_fd)
            level_fds[level_id] = level_fd
            opened_level = os.fstat(level_fd)
            if not _same_open_identity(before_level, opened_level):
                raise RuntimeError(
                    f"raw evidence level changed during secure open: {level_id}"
                )
            _scan_fd_exact(level_fd, set(), f"raw evidence {level_id}")
        return root_fd, level_fds
    except BaseException:
        for descriptor in level_fds.values():
            os.close(descriptor)
        os.close(root_fd)
        raise


def _write_all(descriptor: int, raw: bytes) -> None:
    view = memoryview(raw)
    offset = 0
    while offset < len(view):
        written = os.write(descriptor, view[offset:])
        if written <= 0:
            raise OSError("short or nonprogressing raw evidence write")
        offset += written


def _write_posix(root: Path, payloads: PreparedRawEvidence) -> None:
    if not os.path.isdir("/proc/self/fd"):
        raise RuntimeError("Linux procfs descriptor paths are required")
    root_fd, level_fds = _open_posix_empty_tree(root)
    file_flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_CLOEXEC | os.O_NOFOLLOW
    try:
        last_level: str | None = None
        for item, (relative_path, raw) in zip(
            RAW_EVIDENCE_INVENTORY, payloads, strict=True
        ):
            if item.level_id != last_level and last_level is not None:
                os.fsync(level_fds[last_level])
            basename = relative_path.rsplit("/", 1)[1]
            # CPython's ``open`` audit event omits dir_fd.  Address the same
            # already-validated held directory descriptor through procfs so
            # the bootstrap audit hook can bind every write to the exact
            # level-directory device/inode instead of trusting a basename.
            destination = f"/proc/self/fd/{level_fds[item.level_id]}/{basename}"
            descriptor = os.open(
                destination,
                file_flags,
                0o600,
            )
            try:
                _write_all(descriptor, raw)
                os.fsync(descriptor)
            finally:
                os.close(descriptor)
            last_level = item.level_id
        if last_level is not None:
            os.fsync(level_fds[last_level])
        os.fsync(root_fd)
    finally:
        for descriptor in level_fds.values():
            os.close(descriptor)
        os.close(root_fd)


def _write_nonposix_test_compatibility(
    root: Path,
    payloads: PreparedRawEvidence,
) -> None:
    """Exercise deterministic source tests on non-POSIX hosts.

    The bound producer runtime is Linux-only.  Its production path is always
    ``_write_posix`` above, where held directory descriptors and O_NOFOLLOW
    close parent and final-component traversal.  This compatibility path keeps
    validation and O_EXCL behavior testable on Windows without weakening the
    Linux path.
    """

    _assert_precreated_empty_tree_by_path(root)
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    flags |= getattr(os, "O_BINARY", 0) | getattr(os, "O_NOINHERIT", 0)
    for relative_path, raw in payloads:
        destination = root / Path(relative_path)
        descriptor = os.open(destination, flags, 0o600)
        try:
            _write_all(descriptor, raw)
            os.fsync(descriptor)
        finally:
            os.close(descriptor)


def write_raw_evidence_exclusive(
    root: str | os.PathLike[str],
    payloads: Sequence[tuple[str, bytes]],
    *,
    test_only_allow_nonlinux_compatibility: bool = False,
) -> None:
    """Write the six files without replacement on the Linux production path.

    Non-Linux compatibility is disabled by default and exists only for focused
    source tests.  It is never a production fallback or runtime evidence.
    """

    frozen = _validated_payload_tuple(payloads)
    if type(test_only_allow_nonlinux_compatibility) is not bool:
        raise TypeError("test-only compatibility flag must be an exact bool")
    output_root = Path(root)
    if not output_root.is_absolute():
        raise ValueError("raw evidence root must be absolute")
    if os.name == "posix" and sys.platform.startswith("linux"):
        _write_posix(output_root, frozen)
    elif test_only_allow_nonlinux_compatibility:
        _write_nonposix_test_compatibility(output_root, frozen)
    else:
        raise RuntimeError(
            "Linux raw evidence writer required; non-Linux compatibility is test-only"
        )


def prepare_and_write_raw_evidence(
    root: str | os.PathLike[str],
    level_arrays: Mapping[str, Sequence[np.ndarray]],
    *,
    test_only_allow_nonlinux_compatibility: bool = False,
) -> PreparedRawEvidence:
    """Prepare all six immutable payloads, then perform the exclusive write."""

    payloads = prepare_raw_evidence(level_arrays)
    write_raw_evidence_exclusive(
        root,
        payloads,
        test_only_allow_nonlinux_compatibility=test_only_allow_nonlinux_compatibility,
    )
    return payloads


__all__ = [
    "FrozenRawLevelEvidence",
    "RAW_EVIDENCE_INVENTORY",
    "RAW_EVIDENCE_RELATIVE_PATHS",
    "RAW_EVIDENCE_TOTAL_BYTE_LENGTH",
    "RAW_EVIDENCE_TOTAL_ELEMENT_COUNT",
    "PreparedRawEvidence",
    "RawEvidenceSpec",
    "freeze_raw_level_evidence",
    "prepare_and_write_raw_evidence",
    "prepare_frozen_raw_evidence",
    "prepare_raw_evidence",
    "write_raw_evidence_exclusive",
]
