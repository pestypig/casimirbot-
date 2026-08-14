from __future__ import annotations

import ctypes
from dataclasses import FrozenInstanceError
import hashlib
import math
from pathlib import Path
import struct
import subprocess
import sys
import unittest
from unittest.mock import patch

import gmpy2


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import binary64_environment as environment  # noqa: E402
import tail_collocation as tail  # noqa: E402


NODE_GOLDEN_DOMAIN = (
    b"nhm2-spherical-boson-star-seed-primary-tail-collocation/golden/v1\n"
)
NODE_GOLDEN_SHA256 = "fff305d51e7019b902b261e1dd7a7fe2609e5268a551364919605a78ba78f762"
BASIS_GOLDEN_DOMAIN = b"nhm2-spherical-boson-star-seed-primary-tail-basis/golden/v1\n"
BASIS_GOLDEN_SHA256 = "90b35c2131cd36ee2c84b061ec885e8b978b87fbe2b1679139edc371ee76b0f7"
CONTEXT_FIELDS = (
    "precision",
    "round",
    "emin",
    "emax",
    "subnormalize",
    "trap_underflow",
    "trap_overflow",
    "trap_inexact",
    "trap_invalid",
    "trap_erange",
    "trap_divzero",
    "underflow",
    "overflow",
    "inexact",
    "invalid",
    "erange",
    "divzero",
    "allow_complex",
    "rational_division",
    "allow_release_gil",
)


def _node_hash(values: tuple[float, ...]) -> str:
    digest = hashlib.sha256(NODE_GOLDEN_DOMAIN)
    digest.update(struct.pack("<32d", *values))
    return digest.hexdigest()


def _basis_hash(values: tuple[object, ...]) -> str:
    digest = hashlib.sha256(BASIS_GOLDEN_DOMAIN)
    for basis in values:
        digest.update(struct.pack("<d", basis.t))  # type: ignore[attr-defined]
        digest.update(struct.pack("<32d", *basis.T))  # type: ignore[attr-defined]
        digest.update(struct.pack("<32d", *basis.Ty))  # type: ignore[attr-defined]
        digest.update(struct.pack("<32d", *basis.Tyy))  # type: ignore[attr-defined]
    return digest.hexdigest()


def _context_snapshot(context: gmpy2.context) -> tuple[object, ...]:
    return tuple(getattr(context, field) for field in CONTEXT_FIELDS)


class TailCollocationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.collocation = tail.generate_tail_collocation()
        cls.bases = tuple(
            tail.evaluate_tail_chebyshev_basis(y) for y in cls.collocation.y
        )

    def test_exact_node_graph_binding_order_symmetry_and_golden(self) -> None:
        result = self.collocation
        self.assertEqual(result.node_count, 32)
        self.assertEqual(
            (
                result.primary_numerics_policy_sha256,
                result.primary_numerics_policy_canonical_size_bytes,
            ),
            (
                "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4",
                80_055,
            ),
        )
        source = (HERE / "binary64_environment.py").read_bytes()
        self.assertEqual(len(source), tail.BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES)
        self.assertEqual(
            hashlib.sha256(source).hexdigest(),
            tail.BINARY64_ENVIRONMENT_SOURCE_SHA256,
        )
        self.assertEqual(struct.pack("<d", result.y[0]), bytes(8))
        self.assertEqual(result.y[-1], 1.0)
        self.assertTrue(all(result.y[i] > result.y[i - 1] for i in range(1, 32)))
        for left, right in zip(result.y, reversed(result.y), strict=True):
            self.assertEqual(left + right, 1.0)
        self.assertEqual(_node_hash(result.y), NODE_GOLDEN_SHA256)

    def test_complete_basis_surface_has_frozen_golden(self) -> None:
        self.assertEqual(_basis_hash(self.bases), BASIS_GOLDEN_SHA256)
        for basis in self.bases:
            self.assertEqual(len(basis.T), 32)
            self.assertEqual(len(basis.Ty), 32)
            self.assertEqual(len(basis.Tyy), 32)
            self.assertTrue(
                all(
                    math.isfinite(value)
                    for value in (*basis.T, *basis.Ty, *basis.Tyy)
                )
            )

    def test_endpoint_values_match_independent_closed_forms(self) -> None:
        left = self.bases[0]
        right = self.bases[-1]
        for index in range(32):
            n2 = index * index
            d2 = (4 * n2 * (n2 - 1)) // 3
            self.assertEqual(right.T[index], 1.0)
            self.assertEqual(right.Ty[index], float(2 * n2))
            self.assertEqual(right.Tyy[index], float(d2))
            sign = -1.0 if index % 2 else 1.0
            self.assertEqual(left.T[index], sign)
            self.assertEqual(left.Ty[index], -sign * float(2 * n2))
            self.assertEqual(left.Tyy[index], sign * float(d2))

    def test_owned_mpfr_and_binary64_environments_are_restored(self) -> None:
        mpfr = gmpy2.get_context()
        saved_mpfr = mpfr.copy()
        baseline_nodes = self.collocation.y
        try:
            mpfr.precision = 73
            mpfr.round = gmpy2.RoundUp
            mpfr.emin = -77
            mpfr.emax = 83
            mpfr.subnormalize = True
            mpfr.trap_underflow = True
            mpfr.trap_overflow = True
            mpfr.trap_inexact = True
            mpfr.trap_invalid = True
            mpfr.trap_erange = True
            mpfr.trap_divzero = True
            mpfr.underflow = True
            mpfr.overflow = True
            mpfr.inexact = True
            mpfr.invalid = True
            mpfr.erange = True
            mpfr.divzero = True
            mpfr.allow_complex = True
            mpfr.rational_division = True
            mpfr.allow_release_gil = True
            before = _context_snapshot(mpfr)
            observed = tail.generate_tail_collocation()
            self.assertEqual(observed.y, baseline_nodes)
            self.assertEqual(_context_snapshot(mpfr), before)
            with patch.object(
                tail,
                "_get_d",
                side_effect=tail.TailCollocationError("synthetic_node_failure"),
            ):
                with self.assertRaises(tail.TailCollocationError) as caught:
                    tail.generate_tail_collocation()
                self.assertEqual(caught.exception.code, "synthetic_node_failure")
            self.assertEqual(_context_snapshot(mpfr), before)
        finally:
            gmpy2.set_context(saved_mpfr)

        baseline_basis = tail.evaluate_tail_chebyshev_basis(0.375)
        original_native = environment._capture_native_environment()
        try:
            if sys.platform == "win32":
                native = ctypes.CDLL("ucrtbase")
                setter = native._controlfp_s
                setter.argtypes = [
                    ctypes.POINTER(ctypes.c_uint),
                    ctypes.c_uint,
                    ctypes.c_uint,
                ]
                setter.restype = ctypes.c_int
                observed_control = ctypes.c_uint()
                self.assertEqual(
                    setter(
                        ctypes.byref(observed_control),
                        0x03000300 | 0x00080017,
                        environment.WINDOWS_CONTROLFP_MASK,
                    ),
                    0,
                )
            else:
                hostile = environment._capture_native_environment()
                hostile.x87_control = 0x0F3F
                hostile.mxcsr = 0x0000FF80
                environment._restore_native_environment(hostile)
            binary64_before = environment.observed_binary64_environment()
            self.assertEqual(
                tail.evaluate_tail_chebyshev_basis(0.375), baseline_basis
            )
            self.assertEqual(
                environment.observed_binary64_environment(), binary64_before
            )
            with patch.object(
                tail,
                "_mul",
                side_effect=tail.TailCollocationError("synthetic_basis_failure"),
            ):
                with self.assertRaises(tail.TailCollocationError) as caught:
                    tail.evaluate_tail_chebyshev_basis(0.375)
                self.assertEqual(caught.exception.code, "synthetic_basis_failure")
            self.assertEqual(
                environment.observed_binary64_environment(), binary64_before
            )
        finally:
            environment._restore_native_environment(original_native)

    def test_exact_path_public_fenv_preload_cannot_substitute_private_bytes(self) -> None:
        module_path = HERE / "tail_collocation.py"
        program = f"""
from contextlib import contextmanager
import importlib.util
import pathlib
import sys
import types

path = pathlib.Path({str(module_path)!r})
sys.path.insert(0, str(path.parent))
fake = types.ModuleType("binary64_environment")
fake.__file__ = str(path.with_name("binary64_environment.py"))
fake.BINARY64_RUNTIME_FAMILY = "hostile_noop_runtime"
fake.AUTHORITY_LOCKS = {{}}
@contextmanager
def noop():
    yield
fake.nearest_binary64_environment = noop
sys.modules["binary64_environment"] = fake
spec = importlib.util.spec_from_file_location("hostile_tail_collocation", path)
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
try:
    spec.loader.exec_module(module)
except Exception as error:
    print(getattr(error, "code", type(error).__name__))
else:
    private = module._binary64_environment
    if (
        private is not fake
        and sys.modules["binary64_environment"] is fake
        and pathlib.Path(private.__file__).resolve() == path.with_name("binary64_environment.py")
        and private.BINARY64_RUNTIME_FAMILY != "hostile_noop_runtime"
        and private.nearest_binary64_environment is not noop
    ):
        print("private_bound_exact_bytes")
    else:
        print("hostile_preload_accepted")
"""
        completed = subprocess.run(
            [sys.executable, "-B", "-W", "error", "-c", program],
            cwd=HERE,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=30,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout.strip(), "private_bound_exact_bytes")

    def test_invalid_y_and_all_authority_surfaces_fail_closed(self) -> None:
        for value in (-0.0, float("nan"), -0.01, 1.01, 0, [0.5]):
            with self.subTest(value=repr(value)):
                with self.assertRaises(tail.TailCollocationError):
                    tail.evaluate_tail_chebyshev_basis(value)  # type: ignore[arg-type]
        with patch.object(tail, "BINARY64_ENVIRONMENT_SOURCE_SHA256", "0" * 64):
            for entrypoint, args in (
                (tail.generate_tail_collocation, ()),
                (tail.evaluate_tail_chebyshev_basis, (float("nan"),)),
            ):
                with self.subTest(entrypoint=entrypoint.__name__):
                    with self.assertRaises(tail.TailCollocationError) as caught:
                        entrypoint(*args)
                    self.assertEqual(
                        caught.exception.code,
                        "tail_collocation_fenv_source_mismatch",
                    )
        self.assertFalse(any(tail.AUTHORITY_LOCKS.values()))
        self.assertFalse(self.collocation.tail_residual_implemented)
        self.assertFalse(self.collocation.candidate_execution_authorized)
        self.assertFalse(self.bases[0].tail_residual_implemented)
        self.assertFalse(self.bases[0].physical_authority)
        with self.assertRaises(FrozenInstanceError):
            self.collocation.node_count = 31  # type: ignore[misc]


if __name__ == "__main__":
    unittest.main()
