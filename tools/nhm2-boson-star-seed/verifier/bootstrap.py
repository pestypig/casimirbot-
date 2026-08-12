"""Frozen verifier stage entry point."""

from __future__ import annotations

import json
import os
import sys

EXPECTED_FILE = "/opt/nhm2-verifier/source/verifier/bootstrap.py"
EXPECTED_EXECUTABLE = "/opt/nhm2-verifier/toolchain/python/bin/python3"
EXPECTED_WORKING_DIRECTORY = "/run/replay"
EXPECTED_TOOLCHAIN_ROOT = "/opt/nhm2-verifier/toolchain/python"
SOURCE_ROOT = "/opt/nhm2-verifier/source"
PYTHON_STDLIB_ZIP = "/opt/nhm2-verifier/toolchain/python/lib/python313.zip"
PYTHON_STDLIB_ROOT = "/opt/nhm2-verifier/toolchain/python/lib/python3.13"
PYTHON_DYNLOAD_ROOT = (
    "/opt/nhm2-verifier/toolchain/python/lib/python3.13/lib-dynload"
)
EXPECTED_INITIAL_SYS_PATH = (
    PYTHON_STDLIB_ZIP,
    PYTHON_STDLIB_ROOT,
    PYTHON_DYNLOAD_ROOT,
)
EXPECTED_RUNTIME_SYS_PATH = (
    SOURCE_ROOT,
    PYTHON_STDLIB_ZIP,
    PYTHON_STDLIB_ROOT,
    PYTHON_DYNLOAD_ROOT,
)
EXPECTED_ARGV = (
    "--input-manifest",
    "/run/input/00-seed-run-request.v1.json",
    "--staging-root",
    "/run/staging",
    "--replay-bundle",
    "/run/replay/seed-verifier-replay-bundle.canonical.json",
)
EXPECTED_ENVIRONMENT = {
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
    "TMPDIR": "/run/replay",
    "TZ": "UTC",
    "VECLIB_MAXIMUM_THREADS": "1",
}


def _fail(code: str, detail: str) -> "NoReturn":
    payload = {
        "schemaVersion": "nhm2.independent_seed_verifier.blocker/v1",
        "status": "blocked",
        "code": code,
        "detail": detail,
        "replayBundleCreated": False,
        "artifactAccepted": False,
        "physicalClaimAllowed": False,
    }
    sys.stderr.write(
        json.dumps(payload, ensure_ascii=True, separators=(",", ":"), sort_keys=True)
        + "\n"
    )
    raise SystemExit(2)


def _stdin_is_closed() -> bool:
    try:
        os.fstat(0)
    except OSError:
        return True
    return False


def _initial_sys_path_is_closed() -> bool:
    if tuple(sys.path) != EXPECTED_INITIAL_SYS_PATH:
        return False
    prefix = EXPECTED_TOOLCHAIN_ROOT + "/"
    return all(
        type(entry) is str
        and entry.startswith(prefix)
        and os.path.normpath(entry) == entry
        for entry in sys.path
    )


def main() -> int:
    if sys.platform != "linux" or os.name != "posix":
        _fail("external_linux_worker_required", sys.platform)
    if sys.executable != EXPECTED_EXECUTABLE:
        _fail("frozen_executable_mismatch", sys.executable)
    if sys.version_info[:2] != (3, 13):
        _fail("frozen_python_version_mismatch", repr(sys.version_info[:2]))
    if (
        sys.flags.isolated != 1
        or sys.flags.no_site != 1
        or sys.flags.dont_write_bytecode != 1
        or sys.flags.utf8_mode != 1
        or sys.flags.ignore_environment != 1
        or sys.flags.no_user_site != 1
        or sys.flags.safe_path is not True
    ):
        _fail("python_isolation_flags_mismatch", "-I -S -B -X utf8 required")
    if os.getcwd() != EXPECTED_WORKING_DIRECTORY:
        _fail("frozen_working_directory_mismatch", os.getcwd())
    if not _stdin_is_closed():
        _fail("stdin_not_closed", "descriptor_zero_must_be_closed")
    if not _initial_sys_path_is_closed():
        _fail("initial_sys_path_not_toolchain_closed", repr(tuple(sys.path)))
    if os.path.abspath(__file__) != EXPECTED_FILE or os.path.realpath(__file__) != EXPECTED_FILE:
        _fail("bootstrap_path_mismatch", os.path.realpath(__file__))
    if tuple(sys.argv) != (EXPECTED_FILE, *EXPECTED_ARGV):
        _fail("frozen_argv_mismatch", repr(tuple(sys.argv)))
    if dict(os.environ) != EXPECTED_ENVIRONMENT:
        _fail("closed_environment_mismatch", "exact verifier environment required")
    sys.path[:] = list(EXPECTED_RUNTIME_SYS_PATH)
    try:
        from verifier.errors import VerificationBlocked
        from verifier.verifier import run_fail_closed_verifier

        run_fail_closed_verifier(
            input_manifest=EXPECTED_ARGV[1],
            staging_root=EXPECTED_ARGV[3],
            replay_bundle=EXPECTED_ARGV[5],
        )
    except VerificationBlocked as error:
        _fail(error.blocker.code, error.blocker.detail)
    _fail("unreachable_incomplete_verifier", "bundle emission authority is absent")


if __name__ == "__main__":
    raise SystemExit(main())
