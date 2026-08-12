"""Hermetic Linux entry point for the untrusted numerical producer stage.

Success writes only the 32 raw staging arrays.  It never writes a descriptor,
gate report, proof receipt, log, or authority-bearing artifact.
"""

from __future__ import annotations

import os
import sys


_SOURCE_DIRECTORY = "/opt/nhm2-producer/source/producer"
_BOOTSTRAP = f"{_SOURCE_DIRECTORY}/bootstrap.py"
_PYTHON = "/opt/nhm2-producer/toolchain/python/bin/python3"
_PYTHON_PREFIX = "/opt/nhm2-producer/toolchain/python"
_INPUT = "/run/input/00-seed-run-request.v1.json"
_OUTPUT = "/run/staging"
_EXPECTED_SCRIPT_ARGV = (
    _BOOTSTRAP,
    "--input-manifest",
    _INPUT,
    "--output-root",
    _OUTPUT,
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


def _freeze_import_path() -> None:
    if os.name != "posix" or not sys.platform.startswith("linux"):
        raise RuntimeError("producer bootstrap is Linux-only")
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


def _install_audit_guard() -> None:
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
    write_mask = os.O_WRONLY | os.O_RDWR | os.O_CREAT | os.O_TRUNC | os.O_APPEND

    def guard(event: str, args: tuple[object, ...]) -> None:
        if event in forbidden_events or event.startswith(forbidden_prefixes):
            raise PermissionError(f"producer audit policy rejected {event}")
        if event == "open" and args:
            raw_path = args[0]
            flags = args[2] if len(args) > 2 and isinstance(args[2], int) else 0
            mode = args[1] if len(args) > 1 and isinstance(args[1], str) else ""
            writing = bool(flags & write_mask) or any(character in mode for character in "wax+")
            if writing:
                path = os.fsdecode(raw_path) if isinstance(raw_path, (bytes, bytearray)) else str(raw_path)
                if path not in array_paths:
                    raise PermissionError("producer attempted a non-inventory write")
                required = os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_CLOEXEC | os.O_NOFOLLOW
                forbidden = os.O_RDWR | os.O_TRUNC | os.O_APPEND
                if flags & required != required or flags & forbidden:
                    raise PermissionError("producer array write lacks the exclusive frozen flag set")

    sys.addaudithook(guard)


def _load_run_request(path: str) -> object:
    import json
    import stat

    metadata = os.lstat(path)
    if not stat.S_ISREG(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode):
        raise RuntimeError("run request is not an ordinary no-follow file")
    if metadata.st_nlink != 1:
        raise RuntimeError("run request hardlink count is not one")
    if metadata.st_size < 2 or metadata.st_size > 1_048_576:
        raise RuntimeError("run request byte length is outside the frozen cap")
    descriptor = os.open(path, os.O_RDONLY | os.O_CLOEXEC | os.O_NOFOLLOW)
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
            raise RuntimeError("run request changed between lstat and open")
        chunks: list[bytes] = []
        remaining = 1_048_577
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
        raise RuntimeError("run request changed during bounded read")
    if len(raw) != metadata.st_size or len(raw) > 1_048_576:
        raise RuntimeError("run request changed or exceeded the bounded read")

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


def main() -> int:
    _freeze_import_path()
    _assert_launch_surface()
    _assert_binary64_rn_even()
    _install_audit_guard()

    from pathlib import Path

    import numpy as np

    from contract import validate_run_request
    from continuum import assemble_fields
    from output import prepare_payloads, write_staging_arrays_exclusive
    from solver import solve_production_hierarchy

    np.seterr(divide="raise", invalid="raise", over="raise", under="ignore")
    validate_run_request(_load_run_request(_INPUT))

    # No final-path write occurs until every solve, tail synthesis, scaling,
    # shape check, finite check, and byte serialization has completed in memory.
    l0, l1, l2 = solve_production_hierarchy()
    fields = assemble_fields(l0, l1, l2)
    _assert_binary64_rn_even()
    payloads = prepare_payloads(fields.level_arrays)
    write_staging_arrays_exclusive(Path(_OUTPUT), payloads)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
