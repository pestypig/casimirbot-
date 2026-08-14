"""Frozen N=32 tail nodes and binary64 Chebyshev derivative basis.

This module implements two finite primitives from the primary numerics policy:
the MPFR256 Lobatto node barrier for y and the literal binary64 recurrence for
T_n(2y-1), dT_n/dy, and d2T_n/dy2.  It does not evaluate a tail residual,
solve a system, or accept a candidate.
"""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
import hashlib
import math
from pathlib import Path
import struct
from types import MappingProxyType, ModuleType
from typing import Final, Iterator

import gmpy2


TAIL_COLLOCATION_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_seed_primary_tail_collocation/v1"
)
PRIMARY_NUMERICS_POLICY_SHA256: Final[str] = (
    "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4"
)
PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES: Final[int] = 80_055
BINARY64_ENVIRONMENT_SOURCE_SHA256: Final[str] = (
    "8d452abdfa6d9b3e0cf92aa7d8682202b588f1fe8b0fe0772c6d003d2d12f1a4"
)
BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES: Final[int] = 14_980
NODE_COUNT: Final[int] = 32
MAXIMUM_BASIS_INDEX: Final[int] = 31
MPFR_PRECISION_BITS: Final[int] = 256
MPFR_ROUNDING_MODE: Final[str] = "MPFR_RNDN"
MPFR_EMIN: Final[int] = -1_000_000
MPFR_EMAX: Final[int] = 1_000_000
NODE_OPERATION_GRAPH: Final[str] = (
    "j_0_positive_zero;j_31_exact_one;interior_set_ui_j_set_ui_31_const_pi_"
    "mul_div_cos_set_ui_1_sub_set_ui_2_div;one_get_d_per_y_in_order"
)
BASIS_OPERATION_GRAPH: Final[str] = (
    "t=round64(round64(2*y)-1);T0=1,Ty0=Tyy0=+0;T1=t,Ty1=2,Tyy1=+0;"
    "n_1_through_30_literal_T_Ty_Tyy_recurrence_with_binary64_barriers"
)


class TailCollocationError(ValueError):
    def __init__(self, code: str, detail: str = "root") -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


_BINARY64_ENVIRONMENT_PATH: Final[Path] = Path(__file__).resolve().with_name(
    "binary64_environment.py"
)


def _read_bound_binary64_environment_source() -> bytes:
    try:
        source = _BINARY64_ENVIRONMENT_PATH.read_bytes()
    except OSError as error:
        raise TailCollocationError(
            "tail_collocation_fenv_source_unavailable", type(error).__name__
        ) from error
    if len(source) != BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES:
        raise TailCollocationError("tail_collocation_fenv_source_mismatch", "size")
    if hashlib.sha256(source).hexdigest() != BINARY64_ENVIRONMENT_SOURCE_SHA256:
        raise TailCollocationError("tail_collocation_fenv_source_mismatch", "sha256")
    return source


def _load_bound_binary64_environment() -> ModuleType:
    source = _read_bound_binary64_environment_source()
    module = ModuleType(
        "_nhm2_seed_tail_collocation_bound_binary64_environment"
    )
    module.__file__ = str(_BINARY64_ENVIRONMENT_PATH)
    module.__package__ = ""
    try:
        code = compile(
            source,
            str(_BINARY64_ENVIRONMENT_PATH),
            "exec",
            dont_inherit=True,
            optimize=0,
        )
        exec(code, module.__dict__)
    except Exception as error:
        raise TailCollocationError(
            "tail_collocation_fenv_module_execution_failed", type(error).__name__
        ) from error
    if (
        not isinstance(getattr(module, "__file__", None), str)
        or Path(module.__file__).resolve() != _BINARY64_ENVIRONMENT_PATH
    ):
        raise TailCollocationError("tail_collocation_fenv_module_origin_mismatch")
    return module


_binary64_environment = _load_bound_binary64_environment()


def _verify_literal_bindings() -> None:
    _read_bound_binary64_environment_source()
    if any(
        value is not False
        for value in _binary64_environment.AUTHORITY_LOCKS.values()
    ):
        raise TailCollocationError("tail_collocation_fenv_authority_lock_invalid")


@dataclass(frozen=True, slots=True)
class FrozenTailCollocation:
    node_count: int
    y: tuple[float, ...]
    primary_numerics_policy_sha256: str
    primary_numerics_policy_canonical_size_bytes: int
    binary64_environment_source_sha256: str
    binary64_environment_source_size_bytes: int
    binary64_runtime_family: str
    mpfr_precision_bits: int
    mpfr_rounding_mode: str
    mpfr_emin: int
    mpfr_emax: int
    observed_gmpy2_version: str
    observed_mpfr_version: str
    calculation_implemented: bool = True
    tail_residual_implemented: bool = False
    solve_performed: bool = False
    candidate_execution_authorized: bool = False
    candidate_executed: bool = False
    replay_authority: bool = False
    independent_agreement: bool = False
    diagnostic_pass_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False


@dataclass(frozen=True, slots=True)
class FrozenTailChebyshevBasis:
    y: float
    t: float
    T: tuple[float, ...]
    Ty: tuple[float, ...]
    Tyy: tuple[float, ...]
    basis_count: int = NODE_COUNT
    calculation_implemented: bool = True
    derivative_order: tuple[str, ...] = ("T", "Ty", "Tyy")
    tail_residual_implemented: bool = False
    candidate_execution_authorized: bool = False
    candidate_executed: bool = False
    replay_authority: bool = False
    diagnostic_pass_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False


AUTHORITY_LOCKS: Final = MappingProxyType(
    {
        "implementationClosureComplete": False,
        "runtimeClosureComplete": False,
        "sourceManifestAuthority": False,
        "toolchainAuthority": False,
        "preexecutionPresealPresent": False,
        "executionAuthorized": False,
        "executionObserved": False,
        "tailResidualImplemented": False,
        "outputPresent": False,
        "outputAccepted": False,
        "seedAccepted": False,
        "branchAccepted": False,
        "runReplayAccepted": False,
        "independentAgreementAccepted": False,
        "diagnosticPass": False,
        "candidateAuthority": False,
        "theoryGraphAuthority": False,
        "physicalViability": False,
        "propulsion": False,
        "transport": False,
    }
)


def _negative_zero(value: float) -> bool:
    return value == 0.0 and struct.pack("<d", value) == bytes.fromhex(
        "0000000000000080"
    )


def _owned_context_template() -> gmpy2.context:
    template = gmpy2.get_context().copy()
    template.precision = MPFR_PRECISION_BITS
    template.round = gmpy2.RoundToNearest
    template.emin = MPFR_EMIN
    template.emax = MPFR_EMAX
    template.subnormalize = False
    template.trap_underflow = False
    template.trap_overflow = False
    template.trap_inexact = False
    template.trap_invalid = False
    template.trap_erange = False
    template.trap_divzero = False
    template.underflow = False
    template.overflow = False
    template.inexact = False
    template.invalid = False
    template.erange = False
    template.divzero = False
    template.allow_complex = False
    template.rational_division = False
    template.allow_release_gil = False
    return template


@contextmanager
def _owned_mpfr256_context() -> Iterator[gmpy2.context]:
    with gmpy2.context(_owned_context_template()):
        context = gmpy2.get_context()
        if (
            context.precision != MPFR_PRECISION_BITS
            or context.round != gmpy2.RoundToNearest
            or context.emin != MPFR_EMIN
            or context.emax != MPFR_EMAX
            or context.subnormalize
            or context.trap_underflow
            or context.trap_overflow
            or context.trap_inexact
            or context.trap_invalid
            or context.trap_erange
            or context.trap_divzero
            or context.underflow
            or context.overflow
            or context.inexact
            or context.invalid
            or context.erange
            or context.divzero
            or context.allow_complex
            or context.rational_division
            or context.allow_release_gil
        ):
            raise TailCollocationError("tail_collocation_mpfr_context_installation_failed")
        context.clear_flags()
        yield context


def _check_flags(context: gmpy2.context, operation: str) -> None:
    observed = {
        name: bool(getattr(context, name))
        for name in (
            "underflow",
            "overflow",
            "inexact",
            "invalid",
            "erange",
            "divzero",
        )
    }
    if any(observed[name] for name in ("underflow", "overflow", "invalid", "erange", "divzero")):
        raise TailCollocationError(
            "tail_collocation_mpfr_exceptional_flag",
            f"{operation}:{','.join(name for name, value in observed.items() if value)}",
        )


def _finish(
    context: gmpy2.context, value: gmpy2.mpfr, operation: str
) -> gmpy2.mpfr:
    _check_flags(context, operation)
    if not gmpy2.is_finite(value):
        raise TailCollocationError("tail_collocation_mpfr_nonfinite", operation)
    return value


def _set_ui(context: gmpy2.context, value: int, operation: str) -> gmpy2.mpfr:
    context.clear_flags()
    result = _finish(context, gmpy2.mpfr(value, MPFR_PRECISION_BITS), operation)
    if context.inexact:
        raise TailCollocationError("tail_collocation_set_ui_inexact", operation)
    return result


def _mpfr_binary(
    context: gmpy2.context,
    kind: str,
    left: gmpy2.mpfr,
    right: gmpy2.mpfr,
    operation: str,
) -> gmpy2.mpfr:
    context.clear_flags()
    if kind == "add":
        value = gmpy2.add(left, right)
    elif kind == "sub":
        value = gmpy2.sub(left, right)
    elif kind == "mul":
        value = gmpy2.mul(left, right)
    elif kind == "div":
        if gmpy2.is_zero(right):
            raise TailCollocationError("tail_collocation_mpfr_division_by_zero", operation)
        value = gmpy2.div(left, right)
    else:
        raise TailCollocationError("tail_collocation_internal_operation_invalid", kind)
    return _finish(context, value, operation)


def _get_d(context: gmpy2.context, value: gmpy2.mpfr, operation: str) -> float:
    context.clear_flags()
    result = float(value)
    _check_flags(context, operation)
    if not math.isfinite(result):
        raise TailCollocationError("tail_collocation_binary64_nonfinite", operation)
    result = 0.0 if result == 0.0 else result
    if _negative_zero(result):
        raise TailCollocationError("tail_collocation_binary64_negative_zero", operation)
    return result


def generate_tail_collocation() -> FrozenTailCollocation:
    """Generate exactly the 32 MPFR256 Lobatto y barriers once."""

    _verify_literal_bindings()
    values: list[float] = []
    with _owned_mpfr256_context() as context:
        for index in range(NODE_COUNT):
            if index == 0:
                y = _set_ui(context, 0, "y[0].set_positive_zero")
            elif index == NODE_COUNT - 1:
                y = _set_ui(context, 1, "y[31].set_one")
            else:
                j = _set_ui(context, index, f"y[{index}].set_j")
                denominator = _set_ui(context, NODE_COUNT - 1, f"y[{index}].set_31")
                context.clear_flags()
                pi = _finish(
                    context,
                    gmpy2.const_pi(),
                    f"y[{index}].const_pi",
                )
                pi_times_j = _mpfr_binary(
                    context, "mul", pi, j, f"y[{index}].pi_times_j"
                )
                theta = _mpfr_binary(
                    context, "div", pi_times_j, denominator, f"y[{index}].theta"
                )
                context.clear_flags()
                cosine = _finish(context, gmpy2.cos(theta), f"y[{index}].cos")
                one = _set_ui(context, 1, f"y[{index}].one")
                difference = _mpfr_binary(
                    context, "sub", one, cosine, f"y[{index}].difference"
                )
                two = _set_ui(context, 2, f"y[{index}].two")
                y = _mpfr_binary(
                    context, "div", difference, two, f"y[{index}].divide_two"
                )
            values.append(_get_d(context, y, f"y[{index}].get_d"))
    frozen = tuple(values)
    if (
        len(frozen) != NODE_COUNT
        or struct.pack("<d", frozen[0]) != bytes(8)
        or frozen[-1] != 1.0
        or any(frozen[index] <= frozen[index - 1] for index in range(1, NODE_COUNT))
    ):
        raise TailCollocationError("tail_collocation_node_invariant")
    return FrozenTailCollocation(
        node_count=NODE_COUNT,
        y=frozen,
        primary_numerics_policy_sha256=PRIMARY_NUMERICS_POLICY_SHA256,
        primary_numerics_policy_canonical_size_bytes=(
            PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        ),
        binary64_environment_source_sha256=BINARY64_ENVIRONMENT_SOURCE_SHA256,
        binary64_environment_source_size_bytes=BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES,
        binary64_runtime_family=_binary64_environment.BINARY64_RUNTIME_FAMILY,
        mpfr_precision_bits=MPFR_PRECISION_BITS,
        mpfr_rounding_mode=MPFR_ROUNDING_MODE,
        mpfr_emin=MPFR_EMIN,
        mpfr_emax=MPFR_EMAX,
        observed_gmpy2_version=gmpy2.version(),
        observed_mpfr_version=gmpy2.mpfr_version(),
    )


def _f64(value: float, operation: str) -> float:
    if not math.isfinite(value):
        raise TailCollocationError("tail_basis_nonfinite_intermediate", operation)
    return 0.0 if value == 0.0 else value


def _add(left: float, right: float, operation: str) -> float:
    return _f64(left + right, operation)


def _sub(left: float, right: float, operation: str) -> float:
    return _f64(left - right, operation)


def _mul(left: float, right: float, operation: str) -> float:
    return _f64(left * right, operation)


def evaluate_tail_chebyshev_basis(y: float) -> FrozenTailChebyshevBasis:
    """Evaluate the literal binary64 T/Ty/Tyy recurrence at one y."""

    _verify_literal_bindings()
    if type(y) is not float or not math.isfinite(y) or _negative_zero(y):
        raise TailCollocationError("tail_basis_y_invalid", repr(y))
    if y < 0.0 or y > 1.0:
        raise TailCollocationError("tail_basis_y_out_of_range", repr(y))
    with _binary64_environment.nearest_binary64_environment():
        t = _sub(_mul(2.0, y, "t.two_y"), 1.0, "t.minus_one")
        T = [1.0, t]
        Ty = [0.0, 2.0]
        Tyy = [0.0, 0.0]
        for index in range(1, MAXIMUM_BASIS_INDEX):
            two_t = _mul(2.0, t, f"basis[{index + 1}].two_t")
            next_T = _sub(
                _mul(two_t, T[index], f"basis[{index + 1}].T.product"),
                T[index - 1],
                f"basis[{index + 1}].T.subtract",
            )
            next_Ty = _sub(
                _add(
                    _mul(4.0, T[index], f"basis[{index + 1}].Ty.four_T"),
                    _mul(two_t, Ty[index], f"basis[{index + 1}].Ty.two_t_Ty"),
                    f"basis[{index + 1}].Ty.add",
                ),
                Ty[index - 1],
                f"basis[{index + 1}].Ty.subtract",
            )
            next_Tyy = _sub(
                _add(
                    _mul(8.0, Ty[index], f"basis[{index + 1}].Tyy.eight_Ty"),
                    _mul(two_t, Tyy[index], f"basis[{index + 1}].Tyy.two_t_Tyy"),
                    f"basis[{index + 1}].Tyy.add",
                ),
                Tyy[index - 1],
                f"basis[{index + 1}].Tyy.subtract",
            )
            T.append(next_T)
            Ty.append(next_Ty)
            Tyy.append(next_Tyy)
        return FrozenTailChebyshevBasis(
            y=y,
            t=t,
            T=tuple(T),
            Ty=tuple(Ty),
            Tyy=tuple(Tyy),
        )


if (
    NODE_COUNT != 32
    or MAXIMUM_BASIS_INDEX != 31
    or MPFR_PRECISION_BITS != 256
    or MPFR_EMIN != -1_000_000
    or MPFR_EMAX != 1_000_000
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("spherical_seed_primary_tail_collocation_invariant")


__all__ = [
    "AUTHORITY_LOCKS",
    "BASIS_OPERATION_GRAPH",
    "BINARY64_ENVIRONMENT_SOURCE_SHA256",
    "BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES",
    "FrozenTailChebyshevBasis",
    "FrozenTailCollocation",
    "MAXIMUM_BASIS_INDEX",
    "MPFR_EMAX",
    "MPFR_EMIN",
    "MPFR_PRECISION_BITS",
    "MPFR_ROUNDING_MODE",
    "NODE_COUNT",
    "NODE_OPERATION_GRAPH",
    "PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES",
    "PRIMARY_NUMERICS_POLICY_SHA256",
    "TAIL_COLLOCATION_VERSION",
    "TailCollocationError",
    "evaluate_tail_chebyshev_basis",
    "generate_tail_collocation",
]
