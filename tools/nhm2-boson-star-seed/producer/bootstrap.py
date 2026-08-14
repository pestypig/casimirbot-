"""Hermetic Linux entry point for the untrusted v3 numerical producer stage.

Success writes only the 32 numeric staging arrays and six raw preprojection
evidence arrays.  It never writes a descriptor, gate report, proof receipt,
log, or authority-bearing artifact.
"""

from __future__ import annotations

import hashlib
import os
import stat
import sys


_O_CLOEXEC = getattr(os, "O_CLOEXEC", 0)
_O_NOFOLLOW = getattr(os, "O_NOFOLLOW", 0)


_SOURCE_DIRECTORY = "/opt/nhm2-producer/source/producer"
_BOOTSTRAP = f"{_SOURCE_DIRECTORY}/bootstrap.py"
_PYTHON = "/opt/nhm2-producer/toolchain/python/bin/python3"
_PYTHON_PREFIX = "/opt/nhm2-producer/toolchain/python"
_INPUT = "/run/input/00-seed-run-request.v1.json"
_NUMERIC_POLICY = "/run/input/08-numeric-materialization-policy-v1.canonical.json"
_POSTPROJECTION_POLICY = "/run/input/09-postprojection-policy-v1.canonical.json"
_OUTPUT = "/run/staging"
_RAW_OUTPUT = "/run/postprojection-evidence"
_NUMERIC_POLICY_SIZE = 243_240
_NUMERIC_POLICY_SHA256 = (
    "3ab28f4e777e201a0b6dac73cf637af901d28f2b86db590d18aced5d89e75b40"
)
_POSTPROJECTION_POLICY_SIZE = 220_450
_POSTPROJECTION_POLICY_SHA256 = (
    "e5cc63fe4f22831ab18bc33ec8f608ea23cbe934cf2160f5be47f9bb2680d2c1"
)
_EXPECTED_SCRIPT_ARGV = (
    _BOOTSTRAP,
    "--input-manifest",
    _INPUT,
    "--numeric-materialization-policy",
    _NUMERIC_POLICY,
    "--postprojection-policy",
    _POSTPROJECTION_POLICY,
    "--output-root",
    _OUTPUT,
    "--postprojection-evidence-root",
    _RAW_OUTPUT,
)
_EXPECTED_ENVIRONMENT = {
    "BLIS_NUM_THREADS": "1",
    "LANG": "C.UTF-8",
    "LC_ALL": "C.UTF-8",
    "MKL_DYNAMIC": "FALSE",
    "MKL_NUM_THREADS": "1",
    "NUMEXPR_NUM_THREADS": "1",
    "OMP_DYNAMIC": "FALSE",
    "OMP_NUM_THREADS": "1",
    "OMP_THREAD_LIMIT": "1",
    "OPENBLAS_NUM_THREADS": "1",
    "TMPDIR": _OUTPUT,
    "TZ": "UTC",
    "VECLIB_MAXIMUM_THREADS": "1",
}

_RAW_EVIDENCE_WRITE_ORDER = (
    ("L0", "00-raw-scalar-u.f64le"),
    ("L0", "01-raw-potential-v.f64le"),
    ("L1", "00-raw-scalar-u.f64le"),
    ("L1", "01-raw-potential-v.f64le"),
    ("L2", "00-raw-scalar-u.f64le"),
    ("L2", "01-raw-potential-v.f64le"),
)


class _RawWriteAuditScope:
    """Narrowly authorize the six descriptor-relative raw-evidence opens."""

    def __init__(self, staging_paths: set[str]) -> None:
        self._staging_paths = frozenset(staging_paths)
        self._raw_queue: list[tuple[str, str]] | None = None

    def begin_raw_writes(self) -> None:
        if self._raw_queue is not None:
            raise RuntimeError("raw evidence write authorization is already active")
        self._raw_queue = list(_RAW_EVIDENCE_WRITE_ORDER)

    def finish_raw_writes(self) -> None:
        if self._raw_queue is None:
            raise RuntimeError("raw evidence write authorization is not active")
        if self._raw_queue:
            remaining = len(self._raw_queue)
            self._raw_queue = None
            raise RuntimeError(
                f"raw evidence writer opened only {6 - remaining} of six files"
            )
        self._raw_queue = None

    def abort_raw_writes(self) -> None:
        self._raw_queue = None

    def guard(self, event: str, args: tuple[object, ...]) -> None:
        forbidden_prefixes = ("socket.", "subprocess.", "pty.")
        forbidden_events = {
            "os.system",
            "os.posix_spawn",
            "os.posix_spawnp",
            "os.exec",
            "os.spawn",
            "os.fork",
            "os.forkpty",
            "os.putenv",
            "os.unsetenv",
            "os.chdir",
            "os.mkdir",
            "os.rmdir",
            "os.remove",
            "os.rename",
            "os.replace",
            "os.link",
            "os.symlink",
            "shutil.copyfile",
            "shutil.copytree",
        }
        if event in forbidden_events or event.startswith(forbidden_prefixes):
            raise PermissionError(f"producer audit policy rejected {event}")
        if event != "open" or not args:
            return

        raw_path = args[0]
        flags = args[2] if len(args) > 2 and isinstance(args[2], int) else 0
        mode = args[1] if len(args) > 1 and isinstance(args[1], str) else ""
        write_mask = os.O_WRONLY | os.O_RDWR | os.O_CREAT | os.O_TRUNC | os.O_APPEND
        writing = bool(flags & write_mask) or any(character in mode for character in "wax+")
        if not writing:
            return

        path = (
            os.fsdecode(raw_path)
            if isinstance(raw_path, (bytes, bytearray))
            else str(raw_path)
        )
        required = os.O_WRONLY | os.O_CREAT | os.O_EXCL | _O_CLOEXEC | _O_NOFOLLOW
        forbidden = os.O_RDWR | os.O_TRUNC | os.O_APPEND
        if flags & required != required or flags & forbidden:
            raise PermissionError(
                "producer output write lacks the exclusive frozen flag set"
            )
        if path in self._staging_paths:
            return
        if self._raw_queue is None or not self._raw_queue:
            raise PermissionError("producer attempted a non-inventory write")
        expected_level, expected_basename = self._raw_queue[0]
        prefix = "/proc/self/fd/"
        if not path.startswith(prefix):
            raise PermissionError("producer raw-evidence open is not descriptor-bound")
        suffix = path[len(prefix) :]
        descriptor_text, separator, basename = suffix.partition("/")
        if (
            not separator
            or not descriptor_text.isascii()
            or not descriptor_text.isdecimal()
            or descriptor_text.startswith("0") and descriptor_text != "0"
            or basename != expected_basename
        ):
            raise PermissionError("producer raw-evidence write order differs from inventory")
        descriptor = int(descriptor_text, 10)
        try:
            opened_directory = os.fstat(descriptor)
            expected_directory = os.lstat(f"{_RAW_OUTPUT}/{expected_level}")
        except OSError as error:
            raise PermissionError("producer raw-evidence directory identity unavailable") from error
        opened_identity = (
            opened_directory.st_dev,
            opened_directory.st_ino,
            stat.S_IFMT(opened_directory.st_mode),
        )
        expected_identity = (
            expected_directory.st_dev,
            expected_directory.st_ino,
            stat.S_IFMT(expected_directory.st_mode),
        )
        if (
            opened_identity != expected_identity
            or not stat.S_ISDIR(opened_directory.st_mode)
            or not stat.S_ISDIR(expected_directory.st_mode)
        ):
            raise PermissionError("producer raw-evidence directory identity mismatch")
        self._raw_queue.pop(0)


def _freeze_import_path() -> None:
    if os.name != "posix" or not sys.platform.startswith("linux"):
        raise RuntimeError("producer bootstrap is Linux-only")
    if not _O_CLOEXEC or not _O_NOFOLLOW:
        raise RuntimeError("producer bootstrap requires CLOEXEC and NOFOLLOW")
    if os.path.abspath(__file__) != _BOOTSTRAP:
        raise RuntimeError("producer bootstrap path differs from frozen invocation")
    if os.path.abspath(sys.executable) != _PYTHON:
        raise RuntimeError("producer interpreter path differs from frozen invocation")
    if sys.version_info[:2] != (3, 13):
        raise RuntimeError("producer toolchain requires its sealed CPython 3.13 runtime")
    if not (
        sys.flags.isolated == 1
        and sys.flags.no_site == 1
        and sys.flags.dont_write_bytecode == 1
        and sys.flags.utf8_mode == 1
    ):
        raise RuntimeError("producer interpreter isolation flags are incomplete")
    version = "python3.13"
    sys.path[:] = [
        _SOURCE_DIRECTORY,
        f"{_PYTHON_PREFIX}/lib/{version}.zip",
        f"{_PYTHON_PREFIX}/lib/{version}",
        f"{_PYTHON_PREFIX}/lib/{version}/lib-dynload",
        f"{_PYTHON_PREFIX}/lib/{version}/site-packages",
    ]


def _assert_launch_surface() -> None:
    if tuple(sys.argv) != _EXPECTED_SCRIPT_ARGV:
        raise RuntimeError("producer argv differs from frozen run-plan invocation")
    if os.getcwd() != _OUTPUT:
        raise RuntimeError("producer working directory differs from frozen /run/staging")
    try:
        os.fstat(0)
    except OSError:
        pass
    else:
        raise RuntimeError("producer stdin must be closed before execution")
    observed = dict(os.environ)
    if observed != _EXPECTED_ENVIRONMENT:
        missing = sorted(set(_EXPECTED_ENVIRONMENT) - set(observed))
        extra = sorted(set(observed) - set(_EXPECTED_ENVIRONMENT))
        mismatched = sorted(
            key
            for key in set(observed) & set(_EXPECTED_ENVIRONMENT)
            if observed[key] != _EXPECTED_ENVIRONMENT[key]
        )
        raise RuntimeError(
            f"producer environment mismatch missing={missing!r} extra={extra!r} values={mismatched!r}"
        )


def _assert_binary64_rn_even() -> None:
    half_ulp = 2.0**-53
    if 1.0 + half_ulp != 1.0:
        raise RuntimeError("binary64 rounding mode is not ties-to-even")
    if 1.0 + 3.0 * half_ulp != 1.0 + 2.0**-51:
        raise RuntimeError("binary64 tie parity check failed")


def _install_audit_guard() -> _RawWriteAuditScope:
    array_paths: set[str] = set()
    levels = (("L0", 64, 32), ("L1", 96, 48), ("L2", 128, 64), ("AUDIT", 256, 128))
    stems = (
        "rho_nodes",
        "theta_nodes",
        "base_scalar_u0",
        "base_potential_V0",
        "target_scalar_u_A",
        "target_potential_V_A",
        "multipole_scalar_odd",
        "multipole_potential_even",
    )
    for level, _, _ in levels:
        for index, stem in enumerate(stems):
            array_paths.add(f"{_OUTPUT}/arrays/{level}/{index:02d}-{stem}.f64le")

    scope = _RawWriteAuditScope(array_paths)
    sys.addaudithook(scope.guard)
    return scope


def _read_exact_input_file(
    path: str,
    *,
    expected_size: int | None,
    expected_sha256: str | None,
    label: str,
) -> bytes:
    import stat

    metadata = os.lstat(path)
    if not stat.S_ISREG(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode):
        raise RuntimeError(f"{label} is not an ordinary no-follow file")
    if metadata.st_nlink != 1:
        raise RuntimeError(f"{label} hardlink count is not one")
    if expected_size is not None:
        if metadata.st_size != expected_size:
            raise RuntimeError(f"{label} byte length differs from the literal pin")
        maximum_size = expected_size
    else:
        if metadata.st_size < 2 or metadata.st_size > 1_048_576:
            raise RuntimeError(f"{label} byte length is outside the frozen cap")
        maximum_size = 1_048_576
    descriptor = os.open(path, os.O_RDONLY | _O_CLOEXEC | _O_NOFOLLOW)
    try:
        opened = os.fstat(descriptor)
        identity = (
            metadata.st_dev,
            metadata.st_ino,
            metadata.st_mode,
            metadata.st_nlink,
            metadata.st_size,
            metadata.st_mtime_ns,
            metadata.st_ctime_ns,
        )
        opened_identity = (
            opened.st_dev,
            opened.st_ino,
            opened.st_mode,
            opened.st_nlink,
            opened.st_size,
            opened.st_mtime_ns,
            opened.st_ctime_ns,
        )
        if opened_identity != identity:
            raise RuntimeError(f"{label} changed between lstat and open")
        chunks: list[bytes] = []
        remaining = maximum_size + 1
        while remaining:
            chunk = os.read(descriptor, min(65_536, remaining))
            if not chunk:
                break
            chunks.append(chunk)
            remaining -= len(chunk)
        raw = b"".join(chunks)
        after = os.fstat(descriptor)
    finally:
        os.close(descriptor)
    final_metadata = os.lstat(path)
    final_identity = (
        final_metadata.st_dev,
        final_metadata.st_ino,
        final_metadata.st_mode,
        final_metadata.st_nlink,
        final_metadata.st_size,
        final_metadata.st_mtime_ns,
        final_metadata.st_ctime_ns,
    )
    after_identity = (
        after.st_dev,
        after.st_ino,
        after.st_mode,
        after.st_nlink,
        after.st_size,
        after.st_mtime_ns,
        after.st_ctime_ns,
    )
    if after_identity != identity or final_identity != identity:
        raise RuntimeError(f"{label} changed during bounded read")
    if len(raw) != metadata.st_size or len(raw) > maximum_size:
        raise RuntimeError(f"{label} changed or exceeded the bounded read")
    if expected_sha256 is not None:
        observed_sha256 = hashlib.sha256(raw).hexdigest()
        if observed_sha256 != expected_sha256:
            raise RuntimeError(f"{label} SHA-256 differs from the literal pin")
    return raw


def _load_run_request(path: str) -> object:
    import json

    raw = _read_exact_input_file(
        path,
        expected_size=None,
        expected_sha256=None,
        label="run request",
    )

    def no_constant(token: str) -> object:
        raise ValueError(f"nonfinite JSON token forbidden: {token}")

    def no_duplicate_pairs(pairs: list[tuple[str, object]]) -> dict[str, object]:
        result: dict[str, object] = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f"duplicate JSON key forbidden: {key}")
            result[key] = value
        return result

    return json.loads(
        raw.decode("utf-8", errors="strict"),
        parse_constant=no_constant,
        object_pairs_hook=no_duplicate_pairs,
    )


def _verify_policy_inputs() -> None:
    _read_exact_input_file(
        _NUMERIC_POLICY,
        expected_size=_NUMERIC_POLICY_SIZE,
        expected_sha256=_NUMERIC_POLICY_SHA256,
        label="numeric materialization policy",
    )
    _read_exact_input_file(
        _POSTPROJECTION_POLICY,
        expected_size=_POSTPROJECTION_POLICY_SIZE,
        expected_sha256=_POSTPROJECTION_POLICY_SHA256,
        label="postprojection policy",
    )


def main() -> int:
    _freeze_import_path()
    _assert_launch_surface()
    _assert_binary64_rn_even()
    audit_scope = _install_audit_guard()

    from pathlib import Path

    import numpy as np

    from contract import validate_run_request
    from continuum import assemble_fields
    from output import prepare_payloads, write_staging_arrays_exclusive
    from raw_evidence import prepare_frozen_raw_evidence, write_raw_evidence_exclusive
    from solver import solve_production_hierarchy

    np.seterr(divide="raise", invalid="raise", over="raise", under="ignore")
    validate_run_request(_load_run_request(_INPUT))
    _verify_policy_inputs()

    # No final-path write occurs until every solve, tail synthesis, scaling,
    # shape check, finite check, and byte serialization has completed in memory.
    l0, l1, l2 = solve_production_hierarchy()
    fields = assemble_fields(l0, l1, l2)
    _assert_binary64_rn_even()
    payloads = prepare_payloads(fields.level_arrays)
    raw_payloads = prepare_frozen_raw_evidence(
        (l0.raw_preprojection, l1.raw_preprojection, l2.raw_preprojection)
    )
    write_staging_arrays_exclusive(Path(_OUTPUT), payloads)
    audit_scope.begin_raw_writes()
    try:
        write_raw_evidence_exclusive(Path(_RAW_OUTPUT), raw_payloads)
        audit_scope.finish_raw_writes()
    except BaseException:
        audit_scope.abort_raw_writes()
        raise
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
