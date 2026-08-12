"""Exact-path Linux MPFR/GMP binary-256 directed-rounding primitives.

The backend intentionally does not search the host or invoke a compiler,
loader helper, shell, or subprocess.  The two library paths are part of the
verifier toolchain closure and must already have been broker-attested.
"""

from __future__ import annotations

import ctypes
import hashlib
import math
import os
import stat
import sys
from dataclasses import dataclass
from typing import Final

from .contract import GMP_LIBRARY_PATH, MPFR_LIBRARY_PATH
from .errors import block

MPFR_PRECISION_BITS: Final[int] = 256
MPFR_RNDN: Final[int] = 0
MPFR_RNDZ: Final[int] = 1
MPFR_RNDU: Final[int] = 2
MPFR_RNDD: Final[int] = 3


class _MpfrStruct(ctypes.Structure):
    _fields_ = (
        ("_mpfr_prec", ctypes.c_long),
        ("_mpfr_sign", ctypes.c_int),
        ("_mpfr_exp", ctypes.c_long),
        ("_mpfr_d", ctypes.POINTER(ctypes.c_ulong)),
    )


@dataclass(frozen=True, slots=True)
class Interval:
    lower: float
    upper: float

    def __post_init__(self) -> None:
        if (
            not math.isfinite(self.lower)
            or not math.isfinite(self.upper)
            or self.lower > self.upper
        ):
            block("mpfr", "invalid_finite_interval", f"[{self.lower},{self.upper}]")


@dataclass(frozen=True, slots=True)
class LibraryIdentity:
    absolute_path: str
    byte_length: int
    sha256: str


class _Number:
    __slots__ = ("_backend", "raw", "_cleared")

    def __init__(self, backend: "MpfrBackend") -> None:
        self._backend = backend
        self.raw = _MpfrStruct()
        self._cleared = False
        backend._mpfr.mpfr_init2(ctypes.byref(self.raw), MPFR_PRECISION_BITS)

    def clear(self) -> None:
        if not self._cleared:
            self._backend._mpfr.mpfr_clear(ctypes.byref(self.raw))
            self._cleared = True


class MpfrBackend:
    """Small audited primitive surface; not a complete receipt proof kernel."""

    __slots__ = (
        "_gmp",
        "_mpfr",
        "_library_fds",
        "gmp_version",
        "mpfr_version",
    )

    def __init__(
        self,
        gmp: ctypes.CDLL,
        mpfr: ctypes.CDLL,
        library_fds: tuple[int, int],
    ) -> None:
        self._gmp = gmp
        self._mpfr = mpfr
        self._library_fds = library_fds
        self._configure_signatures()
        mpfr_version_raw = self._mpfr.mpfr_get_version()
        gmp_version_raw = ctypes.c_char_p.in_dll(self._gmp, "__gmp_version").value
        if mpfr_version_raw is None or gmp_version_raw is None:
            block("mpfr", "library_version_symbol_missing", "mpfr_or_gmp")
        self.mpfr_version = mpfr_version_raw.decode("ascii", "strict")
        self.gmp_version = gmp_version_raw.decode("ascii", "strict")

    @classmethod
    def load_frozen(cls) -> "MpfrBackend":
        block(
            "mpfr",
            "attested_library_observations_required",
            "the frozen run request exposes only a runtime binding and not its two library observations",
        )

    @staticmethod
    def _open_attested_library(
        expected_path: str, identity: LibraryIdentity
    ) -> int:
        if (
            identity.absolute_path != expected_path
            or identity.byte_length <= 0
            or len(identity.sha256) != 64
            or any(character not in "0123456789abcdef" for character in identity.sha256)
        ):
            block("mpfr", "library_identity_profile_mismatch", expected_path)
        flags = (
            os.O_RDONLY
            | getattr(os, "O_CLOEXEC", 0)
            | getattr(os, "O_NOFOLLOW", 0)
        )
        try:
            descriptor = os.open(expected_path, flags)
        except OSError as error:
            block("mpfr", "attested_library_open_failed", f"errno={error.errno}")
        before = os.fstat(descriptor)
        if (
            not stat.S_ISREG(before.st_mode)
            or before.st_nlink != 1
            or before.st_size != identity.byte_length
        ):
            os.close(descriptor)
            block("mpfr", "attested_library_stat_mismatch", expected_path)
        digest = hashlib.sha256()
        remaining = identity.byte_length
        while remaining:
            chunk = os.read(descriptor, min(65536, remaining))
            if not chunk:
                os.close(descriptor)
                block("mpfr", "attested_library_short_read", expected_path)
            digest.update(chunk)
            remaining -= len(chunk)
        if os.read(descriptor, 1) != b"":
            os.close(descriptor)
            block("mpfr", "attested_library_trailing_read", expected_path)
        after = os.fstat(descriptor)
        if (
            before.st_dev,
            before.st_ino,
            before.st_size,
            before.st_mtime_ns,
            before.st_ctime_ns,
        ) != (
            after.st_dev,
            after.st_ino,
            after.st_size,
            after.st_mtime_ns,
            after.st_ctime_ns,
        ) or digest.hexdigest() != identity.sha256:
            os.close(descriptor)
            block("mpfr", "attested_library_identity_or_hash_changed", expected_path)
        return descriptor

    @classmethod
    def load_attested(
        cls, gmp_identity: LibraryIdentity, mpfr_identity: LibraryIdentity
    ) -> "MpfrBackend":
        if sys.platform != "linux" or os.uname().machine != "x86_64":
            block("mpfr", "linux_x86_64_runtime_required", sys.platform)
        gmp_fd = cls._open_attested_library(GMP_LIBRARY_PATH, gmp_identity)
        try:
            mpfr_fd = cls._open_attested_library(MPFR_LIBRARY_PATH, mpfr_identity)
        except BaseException:
            os.close(gmp_fd)
            raise
        try:
            gmp = ctypes.CDLL(f"/proc/self/fd/{gmp_fd}", mode=ctypes.RTLD_GLOBAL)
            mpfr = ctypes.CDLL(f"/proc/self/fd/{mpfr_fd}", mode=ctypes.RTLD_LOCAL)
        except OSError as error:
            os.close(mpfr_fd)
            os.close(gmp_fd)
            block("mpfr", "attested_descriptor_library_load_failed", str(error))
        try:
            return cls(gmp=gmp, mpfr=mpfr, library_fds=(gmp_fd, mpfr_fd))
        except BaseException:
            os.close(mpfr_fd)
            os.close(gmp_fd)
            raise

    def close(self) -> None:
        while self._library_fds:
            descriptor, *remaining = self._library_fds
            self._library_fds = tuple(remaining)
            os.close(descriptor)

    def _configure_signatures(self) -> None:
        pointer = ctypes.POINTER(_MpfrStruct)
        self._mpfr.mpfr_init2.argtypes = (pointer, ctypes.c_long)
        self._mpfr.mpfr_init2.restype = None
        self._mpfr.mpfr_clear.argtypes = (pointer,)
        self._mpfr.mpfr_clear.restype = None
        self._mpfr.mpfr_set_d.argtypes = (pointer, ctypes.c_double, ctypes.c_int)
        self._mpfr.mpfr_set_d.restype = ctypes.c_int
        self._mpfr.mpfr_set_si.argtypes = (pointer, ctypes.c_long, ctypes.c_int)
        self._mpfr.mpfr_set_si.restype = ctypes.c_int
        self._mpfr.mpfr_const_pi.argtypes = (pointer, ctypes.c_int)
        self._mpfr.mpfr_const_pi.restype = ctypes.c_int
        for name in ("mpfr_add", "mpfr_sub", "mpfr_mul", "mpfr_div"):
            function = getattr(self._mpfr, name)
            function.argtypes = (pointer, pointer, pointer, ctypes.c_int)
            function.restype = ctypes.c_int
        for name in ("mpfr_cos", "mpfr_sin", "mpfr_sqrt"):
            function = getattr(self._mpfr, name)
            function.argtypes = (pointer, pointer, ctypes.c_int)
            function.restype = ctypes.c_int
        self._mpfr.mpfr_get_d.argtypes = (pointer, ctypes.c_int)
        self._mpfr.mpfr_get_d.restype = ctypes.c_double
        self._mpfr.mpfr_get_version.argtypes = ()
        self._mpfr.mpfr_get_version.restype = ctypes.c_char_p

    def _from_float(self, value: float) -> _Number:
        if not math.isfinite(value):
            block("mpfr", "finite_binary64_required", repr(value))
        number = _Number(self)
        self._mpfr.mpfr_set_d(ctypes.byref(number.raw), value, MPFR_RNDN)
        return number

    def _from_int(self, value: int) -> _Number:
        number = _Number(self)
        self._mpfr.mpfr_set_si(ctypes.byref(number.raw), value, MPFR_RNDN)
        return number

    def _binary(self, name: str, left: float, right: float, rounding: int) -> float:
        a = self._from_float(left)
        b = self._from_float(right)
        result = _Number(self)
        try:
            getattr(self._mpfr, name)(
                ctypes.byref(result.raw),
                ctypes.byref(a.raw),
                ctypes.byref(b.raw),
                rounding,
            )
            value = self._mpfr.mpfr_get_d(ctypes.byref(result.raw), rounding)
            if not math.isfinite(value):
                block("mpfr", "nonfinite_directed_result", name)
            return value
        finally:
            result.clear()
            b.clear()
            a.clear()

    def add_interval(self, left: Interval, right: Interval) -> Interval:
        return Interval(
            self._binary("mpfr_add", left.lower, right.lower, MPFR_RNDD),
            self._binary("mpfr_add", left.upper, right.upper, MPFR_RNDU),
        )

    def subtract_interval(self, left: Interval, right: Interval) -> Interval:
        return Interval(
            self._binary("mpfr_sub", left.lower, right.upper, MPFR_RNDD),
            self._binary("mpfr_sub", left.upper, right.lower, MPFR_RNDU),
        )

    def multiply_interval(self, left: Interval, right: Interval) -> Interval:
        lower_candidates = (
            self._binary("mpfr_mul", left.lower, right.lower, MPFR_RNDD),
            self._binary("mpfr_mul", left.lower, right.upper, MPFR_RNDD),
            self._binary("mpfr_mul", left.upper, right.lower, MPFR_RNDD),
            self._binary("mpfr_mul", left.upper, right.upper, MPFR_RNDD),
        )
        upper_candidates = (
            self._binary("mpfr_mul", left.lower, right.lower, MPFR_RNDU),
            self._binary("mpfr_mul", left.lower, right.upper, MPFR_RNDU),
            self._binary("mpfr_mul", left.upper, right.lower, MPFR_RNDU),
            self._binary("mpfr_mul", left.upper, right.upper, MPFR_RNDU),
        )
        return Interval(min(lower_candidates), max(upper_candidates))

    def divide_interval(self, numerator: Interval, denominator: Interval) -> Interval:
        if denominator.lower <= 0.0 <= denominator.upper:
            block("mpfr", "interval_division_by_zero", repr(denominator))
        reciprocal = Interval(
            self._binary("mpfr_div", 1.0, denominator.upper, MPFR_RNDD),
            self._binary("mpfr_div", 1.0, denominator.lower, MPFR_RNDU),
        )
        if reciprocal.lower > reciprocal.upper:
            reciprocal = Interval(reciprocal.upper, reciprocal.lower)
        return self.multiply_interval(numerator, reciprocal)

    def sqrt_interval(self, value: Interval) -> Interval:
        if value.lower < 0.0:
            block("mpfr", "negative_interval_sqrt", repr(value))
        lower = self._from_float(value.lower)
        upper = self._from_float(value.upper)
        lower_result = _Number(self)
        upper_result = _Number(self)
        try:
            self._mpfr.mpfr_sqrt(
                ctypes.byref(lower_result.raw), ctypes.byref(lower.raw), MPFR_RNDD
            )
            self._mpfr.mpfr_sqrt(
                ctypes.byref(upper_result.raw), ctypes.byref(upper.raw), MPFR_RNDU
            )
            return Interval(
                self._mpfr.mpfr_get_d(ctypes.byref(lower_result.raw), MPFR_RNDD),
                self._mpfr.mpfr_get_d(ctypes.byref(upper_result.raw), MPFR_RNDU),
            )
        finally:
            upper_result.clear()
            lower_result.clear()
            upper.clear()
            lower.clear()

    def mapped_node(self, index: int, count: int, angular: bool) -> float:
        if angular:
            return self.mapped_angular_node_trigonometry(index, count)[0]
        if count < 2 or index < 0 or index >= count:
            block("mpfr", "grid_index_out_of_range", f"{index}/{count}")
        pi_value = _Number(self)
        index_value = self._from_int(index)
        denominator = self._from_int(count - 1)
        argument = _Number(self)
        cosine = _Number(self)
        one = self._from_int(1)
        difference = _Number(self)
        scale_denominator = self._from_int(2)
        result = _Number(self)
        try:
            self._mpfr.mpfr_const_pi(ctypes.byref(pi_value.raw), MPFR_RNDN)
            self._mpfr.mpfr_mul(
                ctypes.byref(argument.raw),
                ctypes.byref(pi_value.raw),
                ctypes.byref(index_value.raw),
                MPFR_RNDN,
            )
            self._mpfr.mpfr_div(
                ctypes.byref(argument.raw),
                ctypes.byref(argument.raw),
                ctypes.byref(denominator.raw),
                MPFR_RNDN,
            )
            self._mpfr.mpfr_cos(
                ctypes.byref(cosine.raw), ctypes.byref(argument.raw), MPFR_RNDN
            )
            self._mpfr.mpfr_sub(
                ctypes.byref(difference.raw),
                ctypes.byref(one.raw),
                ctypes.byref(cosine.raw),
                MPFR_RNDN,
            )
            self._mpfr.mpfr_div(
                ctypes.byref(result.raw),
                ctypes.byref(difference.raw),
                ctypes.byref(scale_denominator.raw),
                MPFR_RNDN,
            )
            value = self._mpfr.mpfr_get_d(ctypes.byref(result.raw), MPFR_RNDN)
            return 0.0 if value == 0.0 else value
        finally:
            result.clear()
            scale_denominator.clear()
            difference.clear()
            one.clear()
            cosine.clear()
            argument.clear()
            denominator.clear()
            index_value.clear()
            pi_value.clear()

    def mapped_angular_node_trigonometry(
        self, index: int, count: int
    ) -> tuple[float, float, float, float | None]:
        """Regenerate theta and its factors from one un-serialized MPFR value."""

        if count < 2 or index < 0 or index >= count:
            block("mpfr", "grid_index_out_of_range", f"{index}/{count}")
        if index == 0:
            return 0.0, 0.0, 1.0, None

        pi_value = _Number(self)
        index_value = self._from_int(index)
        denominator = self._from_int(count - 1)
        argument = _Number(self)
        lobatto_cosine = _Number(self)
        one = self._from_int(1)
        difference = _Number(self)
        four = self._from_int(4)
        theta = _Number(self)
        try:
            self._mpfr.mpfr_const_pi(ctypes.byref(pi_value.raw), MPFR_RNDN)
            self._mpfr.mpfr_mul(
                ctypes.byref(argument.raw),
                ctypes.byref(pi_value.raw),
                ctypes.byref(index_value.raw),
                MPFR_RNDN,
            )
            self._mpfr.mpfr_div(
                ctypes.byref(argument.raw),
                ctypes.byref(argument.raw),
                ctypes.byref(denominator.raw),
                MPFR_RNDN,
            )
            self._mpfr.mpfr_cos(
                ctypes.byref(lobatto_cosine.raw),
                ctypes.byref(argument.raw),
                MPFR_RNDN,
            )
            self._mpfr.mpfr_sub(
                ctypes.byref(difference.raw),
                ctypes.byref(one.raw),
                ctypes.byref(lobatto_cosine.raw),
                MPFR_RNDN,
            )
            self._mpfr.mpfr_mul(
                ctypes.byref(theta.raw),
                ctypes.byref(pi_value.raw),
                ctypes.byref(difference.raw),
                MPFR_RNDN,
            )
            self._mpfr.mpfr_div(
                ctypes.byref(theta.raw),
                ctypes.byref(theta.raw),
                ctypes.byref(four.raw),
                MPFR_RNDN,
            )
            theta_value = self._mpfr.mpfr_get_d(
                ctypes.byref(theta.raw), MPFR_RNDN
            )
            if index == count - 1:
                return theta_value, 1.0, 0.0, 0.0

            sine = _Number(self)
            cosine = _Number(self)
            cotangent = _Number(self)
            try:
                self._mpfr.mpfr_sin(
                    ctypes.byref(sine.raw), ctypes.byref(theta.raw), MPFR_RNDN
                )
                self._mpfr.mpfr_cos(
                    ctypes.byref(cosine.raw), ctypes.byref(theta.raw), MPFR_RNDN
                )
                self._mpfr.mpfr_div(
                    ctypes.byref(cotangent.raw),
                    ctypes.byref(cosine.raw),
                    ctypes.byref(sine.raw),
                    MPFR_RNDN,
                )
                return (
                    theta_value,
                    self._mpfr.mpfr_get_d(ctypes.byref(sine.raw), MPFR_RNDN),
                    self._mpfr.mpfr_get_d(ctypes.byref(cosine.raw), MPFR_RNDN),
                    self._mpfr.mpfr_get_d(
                        ctypes.byref(cotangent.raw), MPFR_RNDN
                    ),
                )
            finally:
                cotangent.clear()
                cosine.clear()
                sine.clear()
        finally:
            theta.clear()
            four.clear()
            difference.clear()
            one.clear()
            lobatto_cosine.clear()
            argument.clear()
            denominator.clear()
            index_value.clear()
            pi_value.clear()

    def sine_cosine_cotangent(self, value: float) -> tuple[float, float, float | None]:
        source = self._from_float(value)
        sine = _Number(self)
        cosine = _Number(self)
        cotangent = _Number(self)
        try:
            self._mpfr.mpfr_sin(
                ctypes.byref(sine.raw), ctypes.byref(source.raw), MPFR_RNDN
            )
            self._mpfr.mpfr_cos(
                ctypes.byref(cosine.raw), ctypes.byref(source.raw), MPFR_RNDN
            )
            sine_value = self._mpfr.mpfr_get_d(ctypes.byref(sine.raw), MPFR_RNDN)
            cosine_value = self._mpfr.mpfr_get_d(
                ctypes.byref(cosine.raw), MPFR_RNDN
            )
            if sine_value == 0.0:
                return 0.0, cosine_value, None
            self._mpfr.mpfr_div(
                ctypes.byref(cotangent.raw),
                ctypes.byref(cosine.raw),
                ctypes.byref(sine.raw),
                MPFR_RNDN,
            )
            cotangent_value = self._mpfr.mpfr_get_d(
                ctypes.byref(cotangent.raw), MPFR_RNDN
            )
            return sine_value, cosine_value, cotangent_value
        finally:
            cotangent.clear()
            cosine.clear()
            sine.clear()
            source.clear()

    def cosine_pi_rational(self, numerator: int, denominator: int) -> float:
        if numerator < 0 or denominator <= 0:
            block("mpfr", "nonnegative_pi_rational_required", f"{numerator}/{denominator}")
        pi_value = _Number(self)
        numerator_value = self._from_int(numerator)
        denominator_value = self._from_int(denominator)
        argument = _Number(self)
        cosine = _Number(self)
        try:
            self._mpfr.mpfr_const_pi(ctypes.byref(pi_value.raw), MPFR_RNDN)
            self._mpfr.mpfr_mul(
                ctypes.byref(argument.raw),
                ctypes.byref(pi_value.raw),
                ctypes.byref(numerator_value.raw),
                MPFR_RNDN,
            )
            self._mpfr.mpfr_div(
                ctypes.byref(argument.raw),
                ctypes.byref(argument.raw),
                ctypes.byref(denominator_value.raw),
                MPFR_RNDN,
            )
            self._mpfr.mpfr_cos(
                ctypes.byref(cosine.raw), ctypes.byref(argument.raw), MPFR_RNDN
            )
            value = self._mpfr.mpfr_get_d(ctypes.byref(cosine.raw), MPFR_RNDN)
            return 0.0 if value == 0.0 else value
        finally:
            cosine.clear()
            argument.clear()
            denominator_value.clear()
            numerator_value.clear()
            pi_value.clear()
