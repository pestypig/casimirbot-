"""Persist the bounded G2B Linux runtime identity before any candidate solve.

Program gate: G2B — replacement classical proof attempt
Workstream: frozen four-grid classical branch
Capability or component: Linux x86_64/glibc full-fenv runtime admission
Current maturity: pinned image built; loaded-byte runtime identity absent
Target maturity: exclusive canonical runtime manifest with loaded-byte hashes
Required frozen inputs: fixed container image and frozen binary64 boundary source
Required evidence: Python/gmpy2 versions, loader bytes, libc family, and fenv symbols
Stop/fail criteria: first platform, ABI, loader, library, fenv, or output collision
Explicit non-goals: candidate solve, initializer evaluation, retune, or authority
Downstream gate unlocked: integrated four-grid preexecution sealing
"""

from __future__ import annotations

import ctypes
import hashlib
import json
import os
from pathlib import Path
import platform
import struct
import sys
from typing import Final, NoReturn

import gmpy2


ROOT: Final[Path] = Path(__file__).resolve().parents[2]
PACKET_PATH: Final[Path] = (
    ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2b-b3-linux-runtime-admission.md"
)
PACKET_SHA256: Final[str] = (
    "a5b1e4d51263bf9a1d523c93ce7015dd9762ea9d867e560677f07f23374913b4"
)
PACKET_SIZE_BYTES: Final[int] = 4_569
OUTPUT_ROOT: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-b3-linux-runtime-v1"
)
OUTPUT_PATH: Final[Path] = OUTPUT_ROOT / "runtime-manifest.json"
DOMAIN: Final[bytes] = b"nhm2-spherical-boson-star-v2/g2b-linux-runtime/v1\n"
REQUIRED_FENV_SYMBOLS: Final[tuple[str, ...]] = (
    "feclearexcept",
    "fegetenv",
    "fegetround",
    "fesetenv",
    "fesetround",
    "fetestexcept",
)
AUTHORITY: Final[dict[str, bool]] = {
    "candidateAuthority": False,
    "executionAuthority": False,
    "physicalAuthority": False,
    "proofAuthority": False,
    "propulsionAuthority": False,
    "replayAuthority": False,
    "theoryGraphAuthority": False,
    "transportAuthority": False,
}


class RuntimeAdmissionError(RuntimeError):
    pass


def _fail(code: str, detail: str = "") -> NoReturn:
    raise RuntimeAdmissionError(f"{code}:{detail}" if detail else code)


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    try:
        with path.open("rb") as stream:
            for chunk in iter(lambda: stream.read(1 << 20), b""):
                digest.update(chunk)
    except OSError as error:
        _fail("g2b_runtime_byte_read_failed", f"{path}:{type(error).__name__}")
    return digest.hexdigest()


def _canonical(value: object) -> bytes:
    return json.dumps(
        value,
        allow_nan=False,
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("ascii")


def _verify_packet() -> None:
    try:
        raw = PACKET_PATH.read_bytes()
    except OSError as error:
        _fail("g2b_runtime_packet_read_failed", type(error).__name__)
    if len(raw) != PACKET_SIZE_BYTES or hashlib.sha256(raw).hexdigest() != PACKET_SHA256:
        _fail("g2b_runtime_packet_binding_drift")


def _loaded_shared_objects() -> list[dict[str, object]]:
    try:
        lines = Path("/proc/self/maps").read_text(encoding="ascii").splitlines()
    except OSError as error:
        _fail("g2b_runtime_proc_maps_read_failed", type(error).__name__)
    paths: set[Path] = set()
    for line in lines:
        fields = line.split()
        if len(fields) < 6 or not fields[-1].startswith("/"):
            continue
        candidate = Path(fields[-1])
        name = candidate.name
        if (
            name.startswith("ld-linux")
            or name.startswith("libc.so")
            or name.startswith("libm.so")
            or name.startswith("libgmp")
            or name.startswith("libmpfr")
            or name.startswith("libmpc")
            or name.startswith("gmpy2.")
        ):
            paths.add(candidate)
    required_prefixes = ("ld-linux", "libc.so", "libgmp", "libmpfr", "gmpy2.")
    names = tuple(path.name for path in paths)
    for prefix in required_prefixes:
        if not any(name.startswith(prefix) for name in names):
            _fail("g2b_runtime_loaded_object_missing", prefix)
    result: list[dict[str, object]] = []
    for path in sorted(paths, key=lambda item: str(item)):
        try:
            size = path.stat().st_size
        except OSError as error:
            _fail("g2b_runtime_loaded_object_stat_failed", f"{path}:{type(error).__name__}")
        result.append({"path": str(path), "rawSha256": _sha256(path), "sizeBytes": size})
    return result


def _fenv_observation() -> dict[str, object]:
    process = ctypes.CDLL(None, use_errno=True)
    for symbol in REQUIRED_FENV_SYMBOLS:
        if not hasattr(process, symbol):
            _fail("g2b_runtime_fenv_symbol_missing", symbol)
    process.fegetround.restype = ctypes.c_int
    observed_round = int(process.fegetround())
    if observed_round != 0:
        _fail("g2b_runtime_rounding_mode_not_nearest", str(observed_round))
    return {
        "fegetround": observed_round,
        "requiredSymbols": list(REQUIRED_FENV_SYMBOLS),
        "roundToNearestCConstant": 0,
        "symbolsPresent": True,
    }


def _write_exclusive(path: Path, raw: bytes) -> None:
    try:
        descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except OSError as error:
        _fail("g2b_runtime_output_open_failed", type(error).__name__)
    try:
        with os.fdopen(descriptor, "wb") as stream:
            stream.write(raw)
            stream.flush()
            os.fsync(stream.fileno())
    except OSError as error:
        _fail("g2b_runtime_output_write_failed", type(error).__name__)


def execute_once() -> dict[str, object]:
    _verify_packet()
    if sys.platform != "linux":
        _fail("g2b_runtime_platform_invalid", sys.platform)
    machine = platform.machine().lower()
    if machine not in {"x86_64", "amd64"} or struct.calcsize("P") != 8:
        _fail("g2b_runtime_architecture_invalid", f"{machine}:{struct.calcsize('P')}")
    libc_name, libc_version = platform.libc_ver()
    if libc_name != "glibc" or not libc_version:
        _fail("g2b_runtime_libc_invalid", f"{libc_name}:{libc_version}")
    if OUTPUT_ROOT.exists() or OUTPUT_ROOT.is_symlink():
        _fail("g2b_runtime_output_collision")

    executable = Path(sys.executable).resolve(strict=True)
    manifest: dict[str, object] = {
        "architecture": machine,
        "authority": AUTHORITY,
        "contractVersion": "nhm2_spherical_boson_star_v2_g2b_linux_runtime/v1",
        "fenv": _fenv_observation(),
        "gmpy2": {
            "gmpVersion": gmpy2.mp_version(),
            "gmpy2Version": gmpy2.version(),
            "mpcVersion": gmpy2.mpc_version(),
            "mpfrVersion": gmpy2.mpfr_version(),
        },
        "libc": {"family": libc_name, "version": libc_version},
        "loadedObjects": _loaded_shared_objects(),
        "platform": sys.platform,
        "pointerBytes": struct.calcsize("P"),
        "python": {
            "implementation": platform.python_implementation(),
            "rawSha256": _sha256(executable),
            "resolvedExecutable": str(executable),
            "sizeBytes": executable.stat().st_size,
            "version": platform.python_version(),
            "versionInfo": list(sys.version_info[:5]),
        },
    }
    preimage = _canonical(manifest)
    manifest["manifestSha256"] = hashlib.sha256(DOMAIN + preimage).hexdigest()
    raw = _canonical(manifest)
    OUTPUT_ROOT.parent.mkdir(parents=True, exist_ok=True)
    try:
        OUTPUT_ROOT.mkdir(mode=0o700)
    except OSError as error:
        _fail("g2b_runtime_output_root_create_failed", type(error).__name__)
    _write_exclusive(OUTPUT_PATH, raw)
    if OUTPUT_PATH.read_bytes() != raw:
        _fail("g2b_runtime_output_readback_mismatch")
    return {"manifestSha256": manifest["manifestSha256"], "rawSha256": hashlib.sha256(raw).hexdigest(), "sizeBytes": len(raw)}


if __name__ == "__main__":
    if sys.argv != [sys.argv[0], "--execute-once"]:
        _fail("g2b_runtime_command_invalid")
    print(json.dumps(execute_once(), sort_keys=True, separators=(",", ":")))
