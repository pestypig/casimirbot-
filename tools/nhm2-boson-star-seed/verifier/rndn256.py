"""Bounded mutable MPFR-256 RNDN arithmetic for verifier proof kernels.

This module deliberately exposes only the operation vocabulary frozen by the
numeric-materialization and postprojection graphs.  It does not load a
library, choose a runtime, set an exponent range, issue a receipt, or grant
authority.  Those duties remain with the attested runtime wrapper.
"""

from __future__ import annotations

import ctypes
import math
from typing import Protocol, TypeVar, runtime_checkable

from .errors import block
from .mpfr_backend import MPFR_RNDN, MpfrBackend, _MpfrStruct, _Number


ValueT = TypeVar("ValueT")
_REQUIRED_EMIN = -1_000_000
_REQUIRED_EMAX = 1_000_000


class _GmpzStruct(ctypes.Structure):
    _fields_ = (
        ("_mp_alloc", ctypes.c_int),
        ("_mp_size", ctypes.c_int),
        ("_mp_d", ctypes.POINTER(ctypes.c_ulong)),
    )


class _GmpqStruct(ctypes.Structure):
    _fields_ = (("_mp_num", _GmpzStruct), ("_mp_den", _GmpzStruct))


@runtime_checkable
class Rndn256Arithmetic(Protocol[ValueT]):
    """In-place arithmetic interface used by the frozen operation graph."""

    def new(self) -> ValueT: ...

    def clear(self, value: ValueT) -> None: ...

    def set_int(self, destination: ValueT, value: int) -> None: ...

    def set_f64(self, destination: ValueT, value: float) -> None: ...

    def set_rational(
        self, destination: ValueT, numerator: int, denominator: int
    ) -> None: ...

    def copy(self, destination: ValueT, source: ValueT) -> None: ...

    def add(self, destination: ValueT, left: ValueT, right: ValueT) -> None: ...

    def subtract(
        self, destination: ValueT, left: ValueT, right: ValueT
    ) -> None: ...

    def multiply(
        self, destination: ValueT, left: ValueT, right: ValueT
    ) -> None: ...

    def divide(
        self, destination: ValueT, numerator: ValueT, denominator: ValueT
    ) -> None: ...

    def square_root(self, destination: ValueT, source: ValueT) -> None: ...

    def cosine(self, destination: ValueT, source: ValueT) -> None: ...

    def constant_pi(self, destination: ValueT) -> None: ...

    def clear_flags(self) -> None: ...

    def compare_zero(self, value: ValueT) -> int: ...

    def get_f64(self, value: ValueT) -> float: ...

    def close(self) -> None: ...


class MpfrRndn256Arithmetic:
    """One bounded arena of exact 256-bit MPFR destinations.

    Every destination is initialized at precision 256 by ``_Number``.  Every
    arithmetic operation uses ``MPFR_RNDN`` and checks that its destination is
    an ordinary finite MPFR number.  The caller controls operation ordering;
    this class neither reassociates nor fuses expressions.
    """

    __slots__ = ("_backend", "_live", "_closed")

    def __init__(self, backend: MpfrBackend) -> None:
        if type(backend) is not MpfrBackend:
            block("mpfr", "exact_backend_instance_required", type(backend).__name__)
        self._backend = backend
        self._live: dict[int, _Number] = {}
        self._closed = False
        self._configure_additional_signatures()
        self._require_exact_exponent_range()

    def _configure_additional_signatures(self) -> None:
        # Configure signatures without allocating an MPFR destination: the
        # exact global exponent range must be checked before any graph value.
        pointer = ctypes.POINTER(_MpfrStruct)
        mpfr = self._backend._mpfr
        gmp = self._backend._gmp
        mpfr.mpfr_set.argtypes = (pointer, pointer, ctypes.c_int)
        mpfr.mpfr_set.restype = ctypes.c_int
        mpfr.mpfr_set_z.argtypes = (
            pointer,
            ctypes.POINTER(_GmpzStruct),
            ctypes.c_int,
        )
        mpfr.mpfr_set_z.restype = ctypes.c_int
        mpfr.mpfr_set_q.argtypes = (
            pointer,
            ctypes.POINTER(_GmpqStruct),
            ctypes.c_int,
        )
        mpfr.mpfr_set_q.restype = ctypes.c_int
        mpfr.mpfr_cmp_si.argtypes = (pointer, ctypes.c_long)
        mpfr.mpfr_cmp_si.restype = ctypes.c_int
        mpfr.mpfr_number_p.argtypes = (pointer,)
        mpfr.mpfr_number_p.restype = ctypes.c_int
        mpfr.mpfr_zero_p.argtypes = (pointer,)
        mpfr.mpfr_zero_p.restype = ctypes.c_int
        mpfr.mpfr_set_zero.argtypes = (pointer, ctypes.c_int)
        mpfr.mpfr_set_zero.restype = None
        mpfr.mpfr_clear_flags.argtypes = ()
        mpfr.mpfr_clear_flags.restype = None
        mpfr.mpfr_get_emin.argtypes = ()
        mpfr.mpfr_get_emin.restype = ctypes.c_long
        mpfr.mpfr_get_emax.argtypes = ()
        mpfr.mpfr_get_emax.restype = ctypes.c_long
        gmpz_init = getattr(gmp, "__gmpz_init")
        gmpz_set_si = getattr(gmp, "__gmpz_set_si")
        gmpz_clear = getattr(gmp, "__gmpz_clear")
        gmpq_init = getattr(gmp, "__gmpq_init")
        gmpq_clear = getattr(gmp, "__gmpq_clear")
        gmpq_set_num = getattr(gmp, "__gmpq_set_num")
        gmpq_set_den = getattr(gmp, "__gmpq_set_den")
        gmpq_canonicalize = getattr(gmp, "__gmpq_canonicalize")
        gmpz_init.argtypes = (ctypes.POINTER(_GmpzStruct),)
        gmpz_init.restype = None
        gmpz_set_si.argtypes = (
            ctypes.POINTER(_GmpzStruct),
            ctypes.c_long,
        )
        gmpz_set_si.restype = None
        gmpz_clear.argtypes = (ctypes.POINTER(_GmpzStruct),)
        gmpz_clear.restype = None
        gmpq_init.argtypes = (ctypes.POINTER(_GmpqStruct),)
        gmpq_init.restype = None
        gmpq_clear.argtypes = (ctypes.POINTER(_GmpqStruct),)
        gmpq_clear.restype = None
        gmpq_set_num.argtypes = (
            ctypes.POINTER(_GmpqStruct),
            ctypes.POINTER(_GmpzStruct),
        )
        gmpq_set_num.restype = None
        gmpq_set_den.argtypes = (
            ctypes.POINTER(_GmpqStruct),
            ctypes.POINTER(_GmpzStruct),
        )
        gmpq_set_den.restype = None
        gmpq_canonicalize.argtypes = (ctypes.POINTER(_GmpqStruct),)
        gmpq_canonicalize.restype = None

    def _require_exact_exponent_range(self) -> None:
        observed = (
            self._backend._mpfr.mpfr_get_emin(),
            self._backend._mpfr.mpfr_get_emax(),
        )
        if observed != (_REQUIRED_EMIN, _REQUIRED_EMAX):
            block(
                "mpfr",
                "exact_exponent_range_must_be_preconfigured",
                repr(observed),
            )

    def _require_open(self) -> None:
        if self._closed:
            block("mpfr", "rndn256_arena_already_closed", "postprojection")

    def _require_value(self, value: _Number) -> None:
        self._require_open()
        if type(value) is not _Number or self._live.get(id(value)) is not value:
            block("mpfr", "foreign_or_cleared_rndn256_value", "postprojection")

    def _canonicalize_zero_and_require_finite(
        self, value: _Number, operation: str
    ) -> None:
        if self._backend._mpfr.mpfr_number_p(ctypes.byref(value.raw)) == 0:
            block("mpfr", "nonfinite_rndn256_result", operation)
        if self._backend._mpfr.mpfr_zero_p(ctypes.byref(value.raw)) != 0:
            self._backend._mpfr.mpfr_set_zero(ctypes.byref(value.raw), 1)

    def new(self) -> _Number:
        self._require_open()
        value = _Number(self._backend)
        self._live[id(value)] = value
        return value

    def clear(self, value: _Number) -> None:
        self._require_value(value)
        del self._live[id(value)]
        value.clear()

    def set_int(self, destination: _Number, value: int) -> None:
        self._require_value(destination)
        if type(value) is not int or not -(2**63) < value < 2**63:
            block("mpfr", "bounded_signed_integer_required", repr(value))
        integer = _GmpzStruct()
        gmpz_init = getattr(self._backend._gmp, "__gmpz_init")
        gmpz_set_si = getattr(self._backend._gmp, "__gmpz_set_si")
        gmpz_clear = getattr(self._backend._gmp, "__gmpz_clear")
        gmpz_init(ctypes.byref(integer))
        try:
            gmpz_set_si(ctypes.byref(integer), value)
            self._backend._mpfr.mpfr_set_z(
                ctypes.byref(destination.raw), ctypes.byref(integer), MPFR_RNDN
            )
        finally:
            gmpz_clear(ctypes.byref(integer))
        self._canonicalize_zero_and_require_finite(destination, "mpfr_set_z")

    def set_f64(self, destination: _Number, value: float) -> None:
        self._require_value(destination)
        if type(value) is not float or not math.isfinite(value):
            block("mpfr", "finite_exact_binary64_required", repr(value))
        self._backend._mpfr.mpfr_set_d(
            ctypes.byref(destination.raw), value, MPFR_RNDN
        )
        self._canonicalize_zero_and_require_finite(destination, "mpfr_set_d")

    def set_rational(
        self, destination: _Number, numerator: int, denominator: int
    ) -> None:
        self._require_value(destination)
        if (
            type(numerator) is not int
            or type(denominator) is not int
            or not -(2**63) < numerator < 2**63
            or not 0 < denominator < 2**63
        ):
            block(
                "mpfr",
                "bounded_canonical_rational_required",
                f"{numerator!r}/{denominator!r}",
            )
        rational = _GmpqStruct()
        numerator_integer = _GmpzStruct()
        denominator_integer = _GmpzStruct()
        gmp = self._backend._gmp
        gmpz_init = getattr(gmp, "__gmpz_init")
        gmpz_set_si = getattr(gmp, "__gmpz_set_si")
        gmpz_clear = getattr(gmp, "__gmpz_clear")
        gmpq_init = getattr(gmp, "__gmpq_init")
        gmpq_clear = getattr(gmp, "__gmpq_clear")
        gmpq_set_num = getattr(gmp, "__gmpq_set_num")
        gmpq_set_den = getattr(gmp, "__gmpq_set_den")
        gmpq_canonicalize = getattr(gmp, "__gmpq_canonicalize")
        gmpq_init(ctypes.byref(rational))
        gmpz_init(ctypes.byref(numerator_integer))
        gmpz_init(ctypes.byref(denominator_integer))
        try:
            gmpz_set_si(ctypes.byref(numerator_integer), numerator)
            gmpz_set_si(ctypes.byref(denominator_integer), denominator)
            gmpq_set_num(ctypes.byref(rational), ctypes.byref(numerator_integer))
            gmpq_set_den(ctypes.byref(rational), ctypes.byref(denominator_integer))
            gmpq_canonicalize(ctypes.byref(rational))
            self._backend._mpfr.mpfr_set_q(
                ctypes.byref(destination.raw), ctypes.byref(rational), MPFR_RNDN
            )
        finally:
            gmpz_clear(ctypes.byref(denominator_integer))
            gmpz_clear(ctypes.byref(numerator_integer))
            gmpq_clear(ctypes.byref(rational))
        self._canonicalize_zero_and_require_finite(destination, "mpfr_set_q")

    def copy(self, destination: _Number, source: _Number) -> None:
        self._require_value(destination)
        self._require_value(source)
        self._backend._mpfr.mpfr_set(
            ctypes.byref(destination.raw), ctypes.byref(source.raw), MPFR_RNDN
        )
        self._canonicalize_zero_and_require_finite(destination, "mpfr_set")

    def _binary(
        self,
        operation: str,
        destination: _Number,
        left: _Number,
        right: _Number,
    ) -> None:
        self._require_value(destination)
        self._require_value(left)
        self._require_value(right)
        getattr(self._backend._mpfr, operation)(
            ctypes.byref(destination.raw),
            ctypes.byref(left.raw),
            ctypes.byref(right.raw),
            MPFR_RNDN,
        )
        self._canonicalize_zero_and_require_finite(destination, operation)

    def add(self, destination: _Number, left: _Number, right: _Number) -> None:
        self._binary("mpfr_add", destination, left, right)

    def subtract(
        self, destination: _Number, left: _Number, right: _Number
    ) -> None:
        self._binary("mpfr_sub", destination, left, right)

    def multiply(
        self, destination: _Number, left: _Number, right: _Number
    ) -> None:
        self._binary("mpfr_mul", destination, left, right)

    def divide(
        self, destination: _Number, numerator: _Number, denominator: _Number
    ) -> None:
        self._binary("mpfr_div", destination, numerator, denominator)

    def square_root(self, destination: _Number, source: _Number) -> None:
        self._require_value(destination)
        self._require_value(source)
        self._backend._mpfr.mpfr_sqrt(
            ctypes.byref(destination.raw), ctypes.byref(source.raw), MPFR_RNDN
        )
        self._canonicalize_zero_and_require_finite(destination, "mpfr_sqrt")

    def cosine(self, destination: _Number, source: _Number) -> None:
        self._require_value(destination)
        self._require_value(source)
        self._backend._mpfr.mpfr_cos(
            ctypes.byref(destination.raw), ctypes.byref(source.raw), MPFR_RNDN
        )
        self._canonicalize_zero_and_require_finite(destination, "mpfr_cos")

    def constant_pi(self, destination: _Number) -> None:
        self._require_value(destination)
        self._backend._mpfr.mpfr_const_pi(
            ctypes.byref(destination.raw), MPFR_RNDN
        )
        self._canonicalize_zero_and_require_finite(destination, "mpfr_const_pi")

    def clear_flags(self) -> None:
        self._require_open()
        self._backend._mpfr.mpfr_clear_flags()

    def compare_zero(self, value: _Number) -> int:
        self._require_value(value)
        comparison = self._backend._mpfr.mpfr_cmp_si(ctypes.byref(value.raw), 0)
        return -1 if comparison < 0 else 1 if comparison > 0 else 0

    def get_f64(self, value: _Number) -> float:
        self._require_value(value)
        result = self._backend._mpfr.mpfr_get_d(
            ctypes.byref(value.raw), MPFR_RNDN
        )
        if not math.isfinite(result):
            block("mpfr", "nonfinite_mpfr_get_d", "postprojection")
        return 0.0 if result == 0.0 else result

    def close(self) -> None:
        if self._closed:
            return
        for value in tuple(self._live.values()):
            value.clear()
        self._live.clear()
        self._closed = True

    def __enter__(self) -> "MpfrRndn256Arithmetic":
        self._require_open()
        return self

    def __exit__(self, _kind: object, _value: object, _traceback: object) -> None:
        self.close()


__all__ = ["MpfrRndn256Arithmetic", "Rndn256Arithmetic"]
