"""Frozen Linux entry point for the NHM2 trusted descriptor assembler."""

from __future__ import annotations

import importlib.util
import os
import sys


EXPECTED_EXECUTABLE = "/opt/nhm2-assembler/toolchain/python/bin/python3"
EXPECTED_TOOLCHAIN_ROOT = "/opt/nhm2-assembler/toolchain"
EXPECTED_BOOTSTRAP = "/opt/nhm2-assembler/source/assembler/bootstrap.py"
ASSEMBLER_MODULE = "/opt/nhm2-assembler/source/assembler/assembler.py"
EXPECTED_WORKING_DIRECTORY = "/run/output"
EXPECTED_ARGV = [
    EXPECTED_BOOTSTRAP,
    "--input-manifest",
    "/run/input/00-seed-run-request.v1.json",
    "--staging-root",
    "/run/staging",
    "--replay-bundle",
    "/run/replay/seed-verifier-replay-bundle.canonical.json",
    "--verifier-enforcement-receipt",
    "/run/attestation/verifier-stage-enforcement-receipt.canonical.json",
    "--output-root",
    "/run/output",
]
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
    "TMPDIR": "/run/output",
    "TZ": "UTC",
    "VECLIB_MAXIMUM_THREADS": "1",
}


def _emit_failure(code: str) -> int:
    try:
        os.write(2, ("nhm2_trusted_assembler_error:" + code + "\n").encode("ascii"))
    except OSError:
        pass
    return 2


def _stdin_is_closed() -> bool:
    try:
        os.fstat(0)
    except OSError:
        return True
    return False


def _sys_path_is_toolchain_closed() -> bool:
    if not sys.path:
        return False
    prefix = EXPECTED_TOOLCHAIN_ROOT + "/"
    for entry in sys.path:
        if not isinstance(entry, str) or not entry.startswith("/"):
            return False
        normalized = os.path.normpath(entry)
        if normalized != entry or not normalized.startswith(prefix):
            return False
    return True


def _load_assembler_module():
    spec = importlib.util.spec_from_file_location("nhm2_trusted_assembler", ASSEMBLER_MODULE)
    if spec is None or spec.loader is None:
        raise RuntimeError("assembler_module_spec_unavailable")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def main() -> int:
    if sys.platform != "linux" or os.name != "posix":
        return _emit_failure("linux_only")
    if (
        sys.executable != EXPECTED_EXECUTABLE
        or os.path.abspath(__file__) != EXPECTED_BOOTSTRAP
        or sys.argv != EXPECTED_ARGV
        or os.getcwd() != EXPECTED_WORKING_DIRECTORY
    ):
        return _emit_failure("invocation_mismatch")
    if (
        sys.flags.isolated != 1
        or sys.flags.no_site != 1
        or sys.flags.dont_write_bytecode != 1
        or sys.flags.utf8_mode != 1
    ):
        return _emit_failure("python_isolation_flags_mismatch")
    if not _sys_path_is_toolchain_closed():
        return _emit_failure("python_sys_path_not_toolchain_closed")
    if dict(os.environ) != EXPECTED_ENVIRONMENT:
        return _emit_failure("environment_mismatch")
    if not _stdin_is_closed():
        return _emit_failure("stdin_not_closed")
    try:
        assembler = _load_assembler_module()
        assembler.assemble_seed_container(
            input_manifest_path="/run/input/00-seed-run-request.v1.json",
            staging_root_path="/run/staging",
            replay_bundle_path="/run/replay/seed-verifier-replay-bundle.canonical.json",
            verifier_enforcement_receipt_path=(
                "/run/attestation/verifier-stage-enforcement-receipt.canonical.json"
            ),
            output_root_path="/run/output",
        )
    except BaseException as exc:
        error_type = type(exc).__name__
        if error_type == "AssemblyError" and exc.args and isinstance(exc.args[0], str):
            code = exc.args[0]
            if code.isascii() and re_safe_code(code):
                return _emit_failure(code)
        return _emit_failure("internal_fail_closed")
    return 0


def re_safe_code(value: str) -> bool:
    return bool(value) and value.isascii() and all(
        char.isalnum() or char == "_" for char in value
    )


if __name__ == "__main__":
    raise SystemExit(main())
