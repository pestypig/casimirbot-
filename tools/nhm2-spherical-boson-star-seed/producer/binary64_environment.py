"""Owned binary64 environment boundary for spherical-seed arithmetic.

The finite-operation graph is meaningful only when every Python scalar float
operation runs with nearest/ties-to-even rounding, masked exceptions, and
gradual underflow.  This module admits only the two explicitly frozen native
ABIs and restores the caller's complete arithmetic environment on every exit.

It is an arithmetic precondition, not a source, toolchain, runtime, execution,
candidate, output, acceptance, replay, or physical-authority artifact.
"""

from __future__ import annotations

from contextlib import contextmanager
import ctypes
from functools import wraps
import platform
import sys
from types import MappingProxyType
from typing import Callable, Final, Iterator, ParamSpec, TypeVar


BINARY64_ENVIRONMENT_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_seed_producer_binary64_environment/v1"
)
BINARY64_ROUNDING_MODE: Final[str] = "nearest_ties_to_even"

WINDOWS_UCRT_FENV_SIZE_BYTES: Final[int] = 8
WINDOWS_REQUIRED_FENV_CONTROL: Final[int] = 0x3F00003F
WINDOWS_REQUIRED_FENV_STATUS: Final[int] = 0x00000000
WINDOWS_CONTROLFP_MASK: Final[int] = 0x0308031F
WINDOWS_REQUIRED_CONTROLFP: Final[int] = 0x0008001F

LINUX_GLIBC_X86_64_FENV_SIZE_BYTES: Final[int] = 32
LINUX_X87_CONTROL_MASK: Final[int] = 0x0F3F
LINUX_X87_REQUIRED_CONTROL: Final[int] = 0x033F
LINUX_X87_EXCEPTION_STATUS_MASK: Final[int] = 0x003F
LINUX_MXCSR_CONTROL_MASK: Final[int] = 0xFFC0
LINUX_MXCSR_REQUIRED_CONTROL: Final[int] = 0x1F80
LINUX_MXCSR_EXCEPTION_STATUS_MASK: Final[int] = 0x003F
POSIX_FE_TONEAREST: Final[int] = 0


class Binary64EnvironmentError(RuntimeError):
    """Fail-closed native-environment error with a stable code."""

    def __init__(self, code: str, detail: str = "root") -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


class _WindowsUcrtFenv(ctypes.Structure):
    _fields_ = [
        ("control", ctypes.c_uint32),
        ("status", ctypes.c_uint32),
    ]


class _LinuxGlibcX86_64Fenv(ctypes.Structure):
    _fields_ = [
        ("x87_control", ctypes.c_uint16),
        ("reserved_0", ctypes.c_uint16),
        ("x87_status", ctypes.c_uint16),
        ("reserved_1", ctypes.c_uint16),
        ("x87_tag", ctypes.c_uint32),
        ("instruction_pointer", ctypes.c_uint32),
        ("code_selector_opcode", ctypes.c_uint32),
        ("data_pointer", ctypes.c_uint32),
        ("data_selector_reserved", ctypes.c_uint32),
        ("mxcsr", ctypes.c_uint32),
    ]


if ctypes.sizeof(_WindowsUcrtFenv) != WINDOWS_UCRT_FENV_SIZE_BYTES:
    raise Binary64EnvironmentError("windows_ucrt_fenv_layout_invalid", "size")
if ctypes.sizeof(_LinuxGlibcX86_64Fenv) != LINUX_GLIBC_X86_64_FENV_SIZE_BYTES:
    raise Binary64EnvironmentError("linux_glibc_fenv_layout_invalid", "size")
if (
    _LinuxGlibcX86_64Fenv.x87_control.offset != 0
    or _LinuxGlibcX86_64Fenv.x87_status.offset != 4
    or _LinuxGlibcX86_64Fenv.mxcsr.offset != 28
):
    raise Binary64EnvironmentError("linux_glibc_fenv_layout_invalid", "offset")


def _linux_restore_projection(
    environment: _LinuxGlibcX86_64Fenv,
) -> tuple[int, int, int, int, int, int, int]:
    """Return exactly the arithmetic fields glibc x86_64 restores.

    glibc's ``fesetenv`` intentionally preserves the live x87 tag and reserved
    fields.  Comparing all 32 opaque bytes would therefore reject a conforming
    restore.  The projection follows the public glibc x86_64 implementation.
    """

    return (
        int(environment.x87_control) & LINUX_X87_CONTROL_MASK,
        int(environment.x87_status) & LINUX_X87_EXCEPTION_STATUS_MASK,
        int(environment.instruction_pointer),
        int(environment.code_selector_opcode) & 0x07FFFFFF,
        int(environment.data_pointer),
        int(environment.data_selector_reserved) & 0x0000FFFF,
        int(environment.mxcsr),
    )


def _windows_raw_projection(
    environment: _WindowsUcrtFenv,
) -> tuple[int, int]:
    return (int(environment.control), int(environment.status))


_machine = platform.machine().lower()
if _machine not in ("amd64", "x86_64") or ctypes.sizeof(ctypes.c_void_p) != 8:
    raise Binary64EnvironmentError(
        "binary64_architecture_unsupported",
        f"{sys.platform}:{_machine}:{ctypes.sizeof(ctypes.c_void_p)}",
    )


if sys.platform == "win32":
    BINARY64_RUNTIME_FAMILY: Final[str] = "windows_amd64_ucrt_full_fenv"
    OBSERVED_GLIBC_VERSION: Final[str | None] = None
    try:
        _native_library = ctypes.CDLL("ucrtbase")
        _fegetenv = _native_library.fegetenv
        _fesetenv = _native_library.fesetenv
        _controlfp_s = _native_library._controlfp_s
    except (AttributeError, OSError) as error:
        raise Binary64EnvironmentError(
            "windows_ucrt_fenv_symbols_unavailable"
        ) from error

    _fegetenv.argtypes = [ctypes.POINTER(_WindowsUcrtFenv)]
    _fegetenv.restype = ctypes.c_int
    _fesetenv.argtypes = [ctypes.POINTER(_WindowsUcrtFenv)]
    _fesetenv.restype = ctypes.c_int
    _controlfp_s.argtypes = [
        ctypes.POINTER(ctypes.c_uint),
        ctypes.c_uint,
        ctypes.c_uint,
    ]
    _controlfp_s.restype = ctypes.c_int

    def _capture_native_environment() -> _WindowsUcrtFenv:
        captured = _WindowsUcrtFenv()
        status = int(_fegetenv(ctypes.byref(captured)))
        if status != 0:
            raise Binary64EnvironmentError("windows_fegetenv_failed", str(status))
        return captured

    def _read_controlfp() -> int:
        observed = ctypes.c_uint()
        status = int(_controlfp_s(ctypes.byref(observed), 0, 0))
        if status != 0:
            raise Binary64EnvironmentError("windows_controlfp_read_failed", str(status))
        return int(observed.value)

    def _required_controls_are_established() -> bool:
        observed = _capture_native_environment()
        return (
            int(observed.control) == WINDOWS_REQUIRED_FENV_CONTROL
            and (_read_controlfp() & WINDOWS_CONTROLFP_MASK)
            == WINDOWS_REQUIRED_CONTROLFP
        )

    def _establish_required_environment() -> None:
        required = _WindowsUcrtFenv(
            WINDOWS_REQUIRED_FENV_CONTROL,
            WINDOWS_REQUIRED_FENV_STATUS,
        )
        status = int(_fesetenv(ctypes.byref(required)))
        if status != 0:
            raise Binary64EnvironmentError("windows_fesetenv_default_failed", str(status))
        observed = _capture_native_environment()
        if _windows_raw_projection(observed) != _windows_raw_projection(required):
            raise Binary64EnvironmentError("windows_required_fenv_not_established")
        if not _required_controls_are_established():
            raise Binary64EnvironmentError("windows_required_controls_not_established")

    def _restore_native_environment(snapshot: object) -> None:
        if type(snapshot) is not _WindowsUcrtFenv:
            raise Binary64EnvironmentError("windows_fenv_snapshot_type_invalid")
        status = int(_fesetenv(ctypes.byref(snapshot)))
        if status != 0:
            raise Binary64EnvironmentError("windows_fesetenv_restore_failed", str(status))
        restored = _capture_native_environment()
        if _windows_raw_projection(restored) != _windows_raw_projection(snapshot):
            raise Binary64EnvironmentError("windows_caller_fenv_not_exactly_restored")

elif sys.platform == "linux":
    BINARY64_RUNTIME_FAMILY = "linux_x86_64_glibc_full_fenv"
    try:
        _native_library = ctypes.CDLL(None)
        _gnu_get_libc_version = _native_library.gnu_get_libc_version
        _fegetenv = _native_library.fegetenv
        _fesetenv = _native_library.fesetenv
        _fegetround = _native_library.fegetround
    except (AttributeError, OSError) as error:
        raise Binary64EnvironmentError(
            "linux_glibc_fenv_symbols_unavailable"
        ) from error

    _gnu_get_libc_version.argtypes = []
    _gnu_get_libc_version.restype = ctypes.c_char_p
    _version_bytes = _gnu_get_libc_version()
    if not _version_bytes:
        raise Binary64EnvironmentError("linux_glibc_version_unavailable")
    try:
        OBSERVED_GLIBC_VERSION = _version_bytes.decode("ascii", "strict")
    except UnicodeDecodeError as error:
        raise Binary64EnvironmentError("linux_glibc_version_invalid") from error

    _fegetenv.argtypes = [ctypes.POINTER(_LinuxGlibcX86_64Fenv)]
    _fegetenv.restype = ctypes.c_int
    _fesetenv.argtypes = [ctypes.c_void_p]
    _fesetenv.restype = ctypes.c_int
    _fegetround.argtypes = []
    _fegetround.restype = ctypes.c_int
    _glibc_default_environment = ctypes.c_void_p(-1)

    def _capture_native_environment() -> _LinuxGlibcX86_64Fenv:
        captured = _LinuxGlibcX86_64Fenv()
        status = int(_fegetenv(ctypes.byref(captured)))
        if status != 0:
            raise Binary64EnvironmentError("linux_fegetenv_failed", str(status))
        return captured

    def _read_linux_rounding() -> int:
        rounding = int(_fegetround())
        if rounding < 0:
            raise Binary64EnvironmentError("linux_fegetround_failed")
        return rounding

    def _required_controls_are_established() -> bool:
        observed = _capture_native_environment()
        return (
            (int(observed.x87_control) & LINUX_X87_CONTROL_MASK)
            == LINUX_X87_REQUIRED_CONTROL
            and (int(observed.mxcsr) & LINUX_MXCSR_CONTROL_MASK)
            == LINUX_MXCSR_REQUIRED_CONTROL
            and _read_linux_rounding() == POSIX_FE_TONEAREST
        )

    def _establish_required_environment() -> None:
        status = int(_fesetenv(_glibc_default_environment))
        if status != 0:
            raise Binary64EnvironmentError("linux_fesetenv_default_failed", str(status))
        observed = _capture_native_environment()
        if not _required_controls_are_established():
            raise Binary64EnvironmentError("linux_required_controls_not_established")
        if (
            int(observed.x87_status) & LINUX_X87_EXCEPTION_STATUS_MASK
            or int(observed.mxcsr) & LINUX_MXCSR_EXCEPTION_STATUS_MASK
        ):
            raise Binary64EnvironmentError("linux_exception_status_not_cleared")

    def _restore_native_environment(snapshot: object) -> None:
        if type(snapshot) is not _LinuxGlibcX86_64Fenv:
            raise Binary64EnvironmentError("linux_fenv_snapshot_type_invalid")
        status = int(_fesetenv(ctypes.byref(snapshot)))
        if status != 0:
            raise Binary64EnvironmentError("linux_fesetenv_restore_failed", str(status))
        restored = _capture_native_environment()
        if _linux_restore_projection(restored) != _linux_restore_projection(snapshot):
            raise Binary64EnvironmentError("linux_caller_fenv_not_exactly_restored")

else:
    raise Binary64EnvironmentError(
        "binary64_platform_unsupported",
        sys.platform,
    )


AUTHORITY_LOCKS: Final = MappingProxyType(
    {
        "sourceManifestAuthority": False,
        "toolchainAuthority": False,
        "executableAuthority": False,
        "runtimeAuthority": False,
        "preexecutionPresealPresent": False,
        "executionAuthorized": False,
        "executionObserved": False,
        "outputPresent": False,
        "outputAccepted": False,
        "seedAccepted": False,
        "branchAccepted": False,
        "runReplayAccepted": False,
        "independentAgreementAccepted": False,
        "candidateAuthority": False,
        "theoryGraphAuthority": False,
        "physicalViability": False,
        "propulsion": False,
        "transport": False,
    }
)


def observed_binary64_environment() -> tuple[int, ...]:
    """Return the admitted ABI's complete restore comparison surface."""

    captured = _capture_native_environment()
    if type(captured) is _WindowsUcrtFenv:
        return (*_windows_raw_projection(captured), _read_controlfp() & WINDOWS_CONTROLFP_MASK)
    if type(captured) is _LinuxGlibcX86_64Fenv:
        return _linux_restore_projection(captured)
    raise Binary64EnvironmentError("binary64_snapshot_type_invalid")


@contextmanager
def nearest_binary64_environment() -> Iterator[None]:
    """Install the frozen controls and exactly restore the calling thread."""

    original = _capture_native_environment()
    try:
        _establish_required_environment()
        if not _required_controls_are_established():
            raise Binary64EnvironmentError("binary64_setup_verification_failed")
    except BaseException:
        try:
            _restore_native_environment(original)
        except BaseException as restore_error:
            raise Binary64EnvironmentError(
                "binary64_restore_failed_after_setup_failure"
            ) from restore_error
        raise

    try:
        yield
        if not _required_controls_are_established():
            raise Binary64EnvironmentError("binary64_controls_changed_during_body")
    except BaseException:
        try:
            _restore_native_environment(original)
        except BaseException as restore_error:
            raise Binary64EnvironmentError(
                "binary64_restore_failed_after_body_failure"
            ) from restore_error
        raise

    try:
        _restore_native_environment(original)
    except BaseException as restore_error:
        raise Binary64EnvironmentError("binary64_restore_failed_after_success") from restore_error


_P = ParamSpec("_P")
_R = TypeVar("_R")


def nearest_binary64(function: Callable[_P, _R]) -> Callable[_P, _R]:
    """Wrap one complete scalar-binary64 operation graph."""

    @wraps(function)
    def wrapped(*args: _P.args, **kwargs: _P.kwargs) -> _R:
        with nearest_binary64_environment():
            return function(*args, **kwargs)

    return wrapped


if (
    WINDOWS_REQUIRED_FENV_CONTROL != 0x3F00003F
    or WINDOWS_REQUIRED_FENV_STATUS != 0
    or WINDOWS_REQUIRED_CONTROLFP & WINDOWS_CONTROLFP_MASK
    != WINDOWS_REQUIRED_CONTROLFP
    or LINUX_X87_REQUIRED_CONTROL & LINUX_X87_CONTROL_MASK
    != LINUX_X87_REQUIRED_CONTROL
    or LINUX_MXCSR_REQUIRED_CONTROL & LINUX_MXCSR_CONTROL_MASK
    != LINUX_MXCSR_REQUIRED_CONTROL
    or LINUX_MXCSR_REQUIRED_CONTROL & ((1 << 6) | (1 << 15))
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("spherical_seed_binary64_environment_invariant")


__all__ = [
    "AUTHORITY_LOCKS",
    "BINARY64_ENVIRONMENT_VERSION",
    "BINARY64_ROUNDING_MODE",
    "BINARY64_RUNTIME_FAMILY",
    "Binary64EnvironmentError",
    "LINUX_GLIBC_X86_64_FENV_SIZE_BYTES",
    "LINUX_MXCSR_CONTROL_MASK",
    "LINUX_MXCSR_REQUIRED_CONTROL",
    "LINUX_X87_CONTROL_MASK",
    "LINUX_X87_REQUIRED_CONTROL",
    "OBSERVED_GLIBC_VERSION",
    "POSIX_FE_TONEAREST",
    "WINDOWS_CONTROLFP_MASK",
    "WINDOWS_REQUIRED_CONTROLFP",
    "WINDOWS_REQUIRED_FENV_CONTROL",
    "WINDOWS_REQUIRED_FENV_STATUS",
    "WINDOWS_UCRT_FENV_SIZE_BYTES",
    "nearest_binary64",
    "nearest_binary64_environment",
    "observed_binary64_environment",
]
