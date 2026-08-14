"""Fail-closed binary64 environment boundary for radial diagnostics.

Python scalar floating-point operations follow the calling thread's native
environment.  These radial primitives therefore cannot be replayed bit-for-bit
while inheriting an arbitrary host mode.  Every public finite-operation entry
point runs inside this boundary and the complete caller environment is restored
afterward.

The supported execution ABIs are intentionally narrow:

* Windows uses the CRT control-word interface to select round-to-nearest and
  preserve denormals while restoring those exact caller controls.
* Linux requires glibc on x86_64.  It snapshots the glibc ``fenv_t``,
  installs glibc's ``FE_DFL_ENV`` (masked exceptions, nearest rounding, and
  MXCSR FTZ/DAZ disabled), verifies the x87 and MXCSR controls, and restores the
  exact arithmetic-environment fields that glibc ``fesetenv`` defines.

Other libc, architecture, and operating-system combinations fail at import.
This is an arithmetic precondition only.  It does not bind a candidate,
toolchain, executable, runtime, preseal, or scientific authority.
"""

from __future__ import annotations

from contextlib import contextmanager
import ctypes
from functools import wraps
import platform
import sys
from typing import Callable, Final, Iterator, ParamSpec, TypeVar


BINARY64_ENVIRONMENT_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_binary64_environment/v2"
)
BINARY64_ROUNDING_MODE: Final[str] = "round_to_nearest_ties_to_even"
WINDOWS_CONTROL_MASK: Final[int] = 0x03000300  # _MCW_DN | _MCW_RC
WINDOWS_REQUIRED_CONTROL: Final[int] = 0x00000000  # _DN_SAVE | _RC_NEAR
POSIX_FE_TONEAREST: Final[int] = 0

# Frozen glibc x86_64 fenv ABI from bits/fenv.h.  The complete 32-byte value is
# captured/restored; named controls below are additionally checked before any
# arithmetic is allowed to escape the boundary.
LINUX_GLIBC_X86_64_FENV_SIZE_BYTES: Final[int] = 32
LINUX_X87_CONTROL_MASK: Final[int] = 0x0F3F
LINUX_X87_REQUIRED_CONTROL: Final[int] = 0x033F
LINUX_X87_STATUS_EXCEPTION_MASK: Final[int] = 0x003F
LINUX_MXCSR_CONTROL_MASK: Final[int] = 0xFFC0
LINUX_MXCSR_REQUIRED_CONTROL: Final[int] = 0x1F80
LINUX_MXCSR_STATUS_EXCEPTION_MASK: Final[int] = 0x003F


class Binary64EnvironmentError(RuntimeError):
    """The native thread environment could not be established or restored."""


class _LinuxGlibcX86_64Fenv(ctypes.Structure):
    _fields_ = [
        ("x87_control_word", ctypes.c_uint16),
        ("glibc_reserved_1", ctypes.c_uint16),
        ("x87_status_word", ctypes.c_uint16),
        ("glibc_reserved_2", ctypes.c_uint16),
        ("x87_tag_word", ctypes.c_uint32),
        ("x87_instruction_pointer", ctypes.c_uint32),
        ("x87_code_selector_and_opcode", ctypes.c_uint32),
        ("x87_data_pointer", ctypes.c_uint32),
        ("x87_data_selector_and_reserved", ctypes.c_uint32),
        ("mxcsr", ctypes.c_uint32),
    ]


def _fenv_arithmetic_state(
    value: _LinuxGlibcX86_64Fenv,
) -> tuple[int, int, int, int, int, int, int]:
    """Project the exact fields restored by glibc x86_64 ``fesetenv``.

    glibc deliberately preserves the live x87 tag word and reserved bits while
    restoring the control/status exception fields, instruction/data metadata,
    and complete MXCSR.  Comparing opaque bytes would therefore reject a valid
    libc restore whenever the non-environment tag word changed.
    """

    return (
        value.x87_control_word & LINUX_X87_CONTROL_MASK,
        value.x87_status_word & LINUX_X87_STATUS_EXCEPTION_MASK,
        value.x87_instruction_pointer,
        value.x87_code_selector_and_opcode & 0x07FFFFFF,
        value.x87_data_pointer,
        value.x87_data_selector_and_reserved & 0x0000FFFF,
        value.mxcsr,
    )


if ctypes.sizeof(_LinuxGlibcX86_64Fenv) != LINUX_GLIBC_X86_64_FENV_SIZE_BYTES:
    raise Binary64EnvironmentError("binary64_glibc_x86_64_fenv_layout_invalid")
if (
    _LinuxGlibcX86_64Fenv.x87_control_word.offset != 0
    or _LinuxGlibcX86_64Fenv.x87_status_word.offset != 4
    or _LinuxGlibcX86_64Fenv.mxcsr.offset != 28
):
    raise Binary64EnvironmentError("binary64_glibc_x86_64_fenv_offsets_invalid")


if sys.platform == "win32":
    BINARY64_RUNTIME_FAMILY = "windows_crt_controlfp_rc_dn"
    _CRT = ctypes.CDLL("msvcrt")
    _CONTROLFP_S = _CRT._controlfp_s
    _CONTROLFP_S.argtypes = [
        ctypes.POINTER(ctypes.c_uint),
        ctypes.c_uint,
        ctypes.c_uint,
    ]
    _CONTROLFP_S.restype = ctypes.c_int

    def _read_native_mode() -> int:
        observed = ctypes.c_uint()
        status = _CONTROLFP_S(ctypes.byref(observed), 0, 0)
        if status != 0:
            raise Binary64EnvironmentError(
                f"binary64_controlfp_read_failed:{status}"
            )
        return int(observed.value) & WINDOWS_CONTROL_MASK

    def _write_native_mode(mode: int) -> None:
        observed = ctypes.c_uint()
        status = _CONTROLFP_S(
            ctypes.byref(observed),
            int(mode) & WINDOWS_CONTROL_MASK,
            WINDOWS_CONTROL_MASK,
        )
        if status != 0:
            raise Binary64EnvironmentError(
                f"binary64_controlfp_write_failed:{status}"
            )

    def _capture_native_environment() -> int:
        return _read_native_mode()

    def _establish_required_environment() -> None:
        _write_native_mode(WINDOWS_REQUIRED_CONTROL)

    def _required_environment_is_established() -> bool:
        return _read_native_mode() == WINDOWS_REQUIRED_CONTROL

    def _restore_native_environment(snapshot: object) -> None:
        if type(snapshot) is not int:
            raise Binary64EnvironmentError("binary64_windows_snapshot_type_invalid")
        _write_native_mode(snapshot)
        if _read_native_mode() != snapshot:
            raise Binary64EnvironmentError("binary64_caller_mode_not_restored")

elif sys.platform == "linux":
    machine = platform.machine().lower()
    if machine not in ("x86_64", "amd64") or ctypes.sizeof(ctypes.c_void_p) != 8:
        raise Binary64EnvironmentError(
            f"binary64_linux_architecture_unsupported:{machine}"
        )

    BINARY64_RUNTIME_FAMILY = "linux_x86_64_glibc_full_fenv"
    _LIBC = ctypes.CDLL(None)
    try:
        _GNU_GET_LIBC_VERSION = _LIBC.gnu_get_libc_version
        _FEGETENV = _LIBC.fegetenv
        _FESETENV = _LIBC.fesetenv
        _FEGETROUND = _LIBC.fegetround
    except AttributeError as error:  # pragma: no cover - non-glibc fail-closed path
        raise Binary64EnvironmentError(
            "binary64_linux_glibc_fenv_symbols_unavailable"
        ) from error

    _GNU_GET_LIBC_VERSION.argtypes = []
    _GNU_GET_LIBC_VERSION.restype = ctypes.c_char_p
    _GLIBC_VERSION_BYTES = _GNU_GET_LIBC_VERSION()
    if not _GLIBC_VERSION_BYTES:
        raise Binary64EnvironmentError("binary64_glibc_version_unavailable")
    try:
        OBSERVED_GLIBC_VERSION: str | None = _GLIBC_VERSION_BYTES.decode(
            "ascii", "strict"
        )
    except UnicodeDecodeError as error:  # pragma: no cover - corrupt runtime path
        raise Binary64EnvironmentError("binary64_glibc_version_invalid") from error

    _FEGETENV.argtypes = [ctypes.POINTER(_LinuxGlibcX86_64Fenv)]
    _FEGETENV.restype = ctypes.c_int
    _FESETENV.argtypes = [ctypes.c_void_p]
    _FESETENV.restype = ctypes.c_int
    _FEGETROUND.argtypes = []
    _FEGETROUND.restype = ctypes.c_int
    _GLIBC_FE_DFL_ENV = ctypes.c_void_p(-1)

    def _read_native_mode() -> int:
        observed = int(_FEGETROUND())
        if observed < 0:
            raise Binary64EnvironmentError("binary64_fegetround_failed")
        return observed

    def _capture_native_environment() -> _LinuxGlibcX86_64Fenv:
        snapshot = _LinuxGlibcX86_64Fenv()
        status = int(_FEGETENV(ctypes.byref(snapshot)))
        if status != 0:
            raise Binary64EnvironmentError(f"binary64_fegetenv_failed:{status}")
        return snapshot

    def _linux_required_controls(
        snapshot: _LinuxGlibcX86_64Fenv,
    ) -> bool:
        return (
            snapshot.x87_control_word & LINUX_X87_CONTROL_MASK
            == LINUX_X87_REQUIRED_CONTROL
            and snapshot.mxcsr & LINUX_MXCSR_CONTROL_MASK
            == LINUX_MXCSR_REQUIRED_CONTROL
            and _read_native_mode() == POSIX_FE_TONEAREST
        )

    def _establish_required_environment() -> None:
        status = int(_FESETENV(_GLIBC_FE_DFL_ENV))
        if status != 0:
            raise Binary64EnvironmentError(
                f"binary64_glibc_default_fesetenv_failed:{status}"
            )
        observed = _capture_native_environment()
        if not _linux_required_controls(observed):
            raise Binary64EnvironmentError(
                "binary64_glibc_default_controls_not_established"
            )
        if (
            observed.x87_status_word & LINUX_X87_STATUS_EXCEPTION_MASK
            or observed.mxcsr & LINUX_MXCSR_STATUS_EXCEPTION_MASK
        ):
            raise Binary64EnvironmentError(
                "binary64_glibc_default_exception_status_not_clear"
            )

    def _required_environment_is_established() -> bool:
        return _linux_required_controls(_capture_native_environment())

    def _restore_native_environment(snapshot: object) -> None:
        if type(snapshot) is not _LinuxGlibcX86_64Fenv:
            raise Binary64EnvironmentError("binary64_linux_snapshot_type_invalid")
        status = int(_FESETENV(ctypes.byref(snapshot)))
        if status != 0:
            raise Binary64EnvironmentError(
                f"binary64_glibc_restore_fesetenv_failed:{status}"
            )
        restored = _capture_native_environment()
        if _fenv_arithmetic_state(restored) != _fenv_arithmetic_state(snapshot):
            raise Binary64EnvironmentError(
                "binary64_caller_arithmetic_environment_not_exactly_restored"
            )

else:  # pragma: no cover - intentionally unavailable on unknown runtimes
    raise Binary64EnvironmentError(
        f"binary64_environment_platform_unsupported:{sys.platform}"
    )


if sys.platform != "linux":
    OBSERVED_GLIBC_VERSION = None


def observed_binary64_native_mode() -> int:
    """Return the platform-native rounding/control mode used by the guard."""

    return _read_native_mode()


@contextmanager
def nearest_binary64_environment() -> Iterator[None]:
    """Run one calculation in the required environment and restore the caller."""

    original = _capture_native_environment()
    try:
        _establish_required_environment()
        if not _required_environment_is_established():
            raise Binary64EnvironmentError(
                "binary64_required_environment_not_established"
            )
    except BaseException:
        try:
            _restore_native_environment(original)
        except BaseException as restore_error:
            raise Binary64EnvironmentError(
                "binary64_setup_failure_and_caller_restore_failed"
            ) from restore_error
        raise

    body_error: BaseException | None = None
    try:
        yield
        if not _required_environment_is_established():
            raise Binary64EnvironmentError(
                "binary64_environment_changed_during_calculation"
            )
    except BaseException as error:
        body_error = error
        raise
    finally:
        try:
            _restore_native_environment(original)
        except BaseException as restore_error:
            message = (
                "binary64_caller_restore_failed_after_body_error"
                if body_error is not None
                else "binary64_caller_environment_restore_failed"
            )
            raise Binary64EnvironmentError(message) from restore_error


_P = ParamSpec("_P")
_R = TypeVar("_R")


def nearest_binary64(function: Callable[_P, _R]) -> Callable[_P, _R]:
    """Decorate a complete finite-operation entry point with the boundary."""

    @wraps(function)
    def wrapped(*args: _P.args, **kwargs: _P.kwargs) -> _R:
        with nearest_binary64_environment():
            return function(*args, **kwargs)

    return wrapped


__all__ = [
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
    "WINDOWS_CONTROL_MASK",
    "WINDOWS_REQUIRED_CONTROL",
    "nearest_binary64",
    "nearest_binary64_environment",
    "observed_binary64_native_mode",
]
