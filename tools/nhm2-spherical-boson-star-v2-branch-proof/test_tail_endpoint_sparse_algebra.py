"""Focused exact checks for the descaled endpoint sparse algebra."""

from __future__ import annotations

from fractions import Fraction
import hashlib
import importlib.util
import inspect
import json
from pathlib import Path
import sys
import unittest

import sympy


HERE = Path(__file__).resolve().parent
SOURCE = HERE / "tail_endpoint_sparse_algebra.py"
BOUNDARY_SOURCE = HERE / "radial_boundary_remainders.py"
CODEGEN_SOURCE = HERE / "generate_tail_endpoint_sparse_algebra_header.py"
GENERATED_HEADER = HERE / "tail_endpoint_sparse_algebra_generated.hpp"
EXPECTED_SCALAR_SHA256 = (
    "858e83405870b2a6bb170b42f9b85817f7cfd9413e6206faba1fbbd1ae27826d"
)
EXPECTED_RAW_SHA256 = "4c90e133cdbbc06bea501e88a12ce2e324caef68eb951331addb6255cbc3044c"
EXPECTED_QUOTIENT_SHA256 = (
    "c19b4795d314597d72d18ab8ad6e8dbfe55d16f58f31472402fff548417022a7"
)
EXPECTED_RAW_PLAIN_SHA256 = (
    "f5bda3a1efba08ed3000fe1a2018b3952b78bf76aac4ab2eac2d1a58e20c317d"
)
EXPECTED_QUOTIENT_PLAIN_SHA256 = (
    "fab6a26868075cf6dfd63f04aa1e52f3e7e7f6811181b3ebfcd97924509a08e3"
)


def _load(path: Path, name: str) -> object:
    specification = importlib.util.spec_from_file_location(name, path)
    if specification is None or specification.loader is None:
        raise RuntimeError("test_target_spec_unavailable")
    module = importlib.util.module_from_spec(specification)
    sys.modules[name] = module
    specification.loader.exec_module(module)
    return module


M = _load(SOURCE, "_nhm2_tail_endpoint_sparse_algebra_test_target")
B = _load(BOUNDARY_SOURCE, "_nhm2_boundary_recurrence_bridge_target")
C = _load(CODEGEN_SOURCE, "_nhm2_tail_endpoint_codegen_test_target")


def _evaluate(
    wire: list[list[int | str]], s: Fraction, m: Fraction, k: Fraction
) -> Fraction:
    result = Fraction()
    for s_exponent, m_exponent, k_exponent, numerator, denominator in wire:
        result += (
            Fraction(int(numerator), int(denominator))
            * s ** int(s_exponent)
            * m ** int(m_exponent)
            * k ** int(k_exponent)
        )
    return result


class _Hostile:
    reads = 0

    def __getattribute__(self, name: str) -> object:
        type(self).reads += 1
        raise AssertionError(name)


class TailEndpointSparseAlgebraTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.receipt = M._test_only_generate(M._TEST_MARKER)

    def test_public_surface_is_zero_argument_and_blocked(self) -> None:
        self.assertEqual(
            M.__all__,
            [
                "TailEndpointSparseAlgebraError",
                "observe_tail_endpoint_sparse_algebra",
            ],
        )
        self.assertEqual(
            tuple(inspect.signature(M.observe_tail_endpoint_sparse_algebra).parameters),
            (),
        )
        with self.assertRaises(M.TailEndpointSparseAlgebraError) as observed:
            M.observe_tail_endpoint_sparse_algebra()
        self.assertEqual(
            observed.exception.code,
            "tail_endpoint_algebra_successor_not_sealed_or_independently_audited",
        )

    def test_hostile_extra_argument_is_not_traversed(self) -> None:
        hostile = _Hostile()
        _Hostile.reads = 0
        with self.assertRaises(TypeError):
            M.observe_tail_endpoint_sparse_algebra(hostile)
        self.assertEqual(_Hostile.reads, 0)

    def test_canonical_ring_rejects_aliases_and_illegal_division(self) -> None:
        with self.assertRaises(M.TailEndpointSparseAlgebraError):
            M._Poly(((((0, 0, 0), Fraction(1))), (((0, 0, 0), Fraction(2)))))
        with self.assertRaises(M.TailEndpointSparseAlgebraError):
            M.S_ATOM.shift(s=-2)
        identity = M.K_ATOM.shift(k=-1)
        self.assertEqual(identity, M.ONE)

    def test_descaled_scalar_recurrence_matches_physical_bridge_fixture(self) -> None:
        s = Fraction(9, 16)
        lam = Fraction(3, 4)
        k = Fraction(4, 5)
        w = Fraction(4, 5)
        kappa = lam * k
        mass = Fraction(1)
        scaled_mass = mass / lam
        physical = B._derive_tail_formal_recurrence(
            synthetic_w_surrogate=w,
            synthetic_kappa_surrogate=kappa,
            synthetic_adm_mass_surrogate=mass,
            synthetic_outer_amplitude_surrogate=Fraction(1),
        )
        self.assertEqual(physical.q, s * scaled_mass * k / 2)
        self.assertEqual(
            physical.sigma,
            scaled_mass / k - 2 * s * scaled_mass * k - 1,
        )
        for step in physical.scalar_steps:
            self.assertEqual(step.diagonal / s, 2 * k * k * step.n)
        observed = tuple(
            _evaluate(wire, s, scaled_mass, k)
            for wire in self.receipt.scalar_coefficients
        )
        self.assertEqual(
            observed,
            tuple(value for _, value in physical.C_coefficients_through_emitted_order),
        )

    def test_low_orders_are_literal_empty_and_quotient_is_exact_shift(self) -> None:
        self.assertEqual(len(self.receipt.raw_coefficients), 27)
        self.assertEqual(len(self.receipt.quotient_coefficients), 17)
        self.assertEqual(self.receipt.raw_coefficients[:10], ([],) * 10)
        self.assertEqual(
            self.receipt.quotient_coefficients,
            self.receipt.raw_coefficients[10:],
        )
        self.assertEqual(self.receipt.graded_residual_order_before, 27)
        self.assertEqual(self.receipt.graded_residual_order_after, 17)

    def test_raw_source_coefficients_match_independent_sympy_fixture(self) -> None:
        s = Fraction(9, 16)
        k = Fraction(4, 5)
        m = Fraction(4, 3)
        nu = -k * k / 2
        q = s * m * k / 2
        sigma = m / k - 2 * s * m * k - 1
        physical = B._derive_tail_formal_recurrence(
            synthetic_w_surrogate=Fraction(4, 5),
            synthetic_kappa_surrogate=Fraction(3, 5),
            synthetic_adm_mass_surrogate=Fraction(1),
            synthetic_outer_amplitude_surrogate=Fraction(1),
        )
        z = sympy.symbols("z")
        sr = sympy.Rational
        s_q = sr(s.numerator, s.denominator)
        k_q = sr(k.numerator, k.denominator)
        nu_q = sr(nu.numerator, nu.denominator)
        q_q = sr(q.numerator, q.denominator)
        sigma_q = sr(sigma.numerator, sigma.denominator)
        v0 = (sympy.log(1 - q_q * z) - sympy.log(1 + q_q * z)) / s_q
        v1 = 2 * sympy.log(1 + q_q * z) / s_q
        h = v0 + v1
        scalar = sum(
            sr(value.numerator, value.denominator) * z**ordinal
            for ordinal, value in physical.C_coefficients_through_emitted_order
        )
        b = -k_q + sigma_q * k_q * z
        h_y = -k_q * z**2 * sympy.diff(h, z)
        scalar_y = -k_q * z**2 * sympy.diff(scalar, z)
        scalar_yy = k_q**2 * (
            z**4 * sympy.diff(scalar, z, 2)
            + 2 * z**3 * sympy.diff(scalar, z)
        )
        e0 = sympy.exp(-2 * s_q * (h - v1))
        a_scalar = 2 * k_q * z + s_q * h_y
        q0 = (sympy.exp(-2 * s_q * (h - v1)) - 1) / s_q
        v_scalar = sympy.exp(2 * s_q * v1) * (q0 + 2 * nu_q * e0)
        p_tilde = (2 * sigma_q + 2) * k_q * z + s_q * h_y
        q_tilde = (
            -sigma_q * k_q**2 * z**2
            + b**2
            + a_scalar * b
            + v_scalar
        )
        source = (
            -p_tilde * scalar_y
            - q_tilde * scalar
            - (scalar_yy - 2 * k_q * scalar_y)
        )
        expanded = sympy.series(source, z, 0, 27).removeO().expand()
        expected = tuple(
            Fraction(sympy.Rational(expanded.coeff(z, ordinal)))
            for ordinal in range(27)
        )
        observed = tuple(
            _evaluate(wire, s, m, k) for wire in self.receipt.raw_coefficients
        )
        self.assertEqual(observed, expected)

    def test_exact_golden_hashes_are_stable(self) -> None:
        encode = lambda value: json.dumps(
            value, ensure_ascii=True, separators=(",", ":"), sort_keys=True
        ).encode("ascii")
        raw_hash = hashlib.sha256(encode(self.receipt.raw_coefficients)).hexdigest()
        quotient_hash = hashlib.sha256(
            encode(self.receipt.quotient_coefficients)
        ).hexdigest()
        scalar_bytes = encode(self.receipt.scalar_coefficients)
        raw_bytes = encode(self.receipt.raw_coefficients)
        quotient_bytes = encode(self.receipt.quotient_coefficients)
        seal = lambda domain, wire: hashlib.sha256(
            domain + len(wire).to_bytes(8, "little") + wire
        ).hexdigest()
        self.assertEqual(
            seal(
                b"nhm2-spherical-boson-star-v2/g2-d-tail-endpoint-scalar-jet/v1\n",
                scalar_bytes,
            ),
            EXPECTED_SCALAR_SHA256,
        )
        self.assertEqual(
            seal(
                b"nhm2-spherical-boson-star-v2/g2-d-tail-endpoint-raw-source/v1\n",
                raw_bytes,
            ),
            EXPECTED_RAW_SHA256,
        )
        self.assertEqual(
            seal(
                b"nhm2-spherical-boson-star-v2/g2-d-tail-endpoint-quotient/v1\n",
                quotient_bytes,
            ),
            EXPECTED_QUOTIENT_SHA256,
        )
        self.assertEqual(raw_hash, EXPECTED_RAW_PLAIN_SHA256)
        self.assertEqual(quotient_hash, EXPECTED_QUOTIENT_PLAIN_SHA256)
        self.assertEqual(self.receipt.scalar_wire_sha256, EXPECTED_SCALAR_SHA256)
        self.assertEqual(self.receipt.raw_wire_sha256, EXPECTED_RAW_SHA256)
        self.assertEqual(
            self.receipt.quotient_wire_sha256, EXPECTED_QUOTIENT_SHA256
        )
        self.assertEqual(
            self.receipt.raw_wire_plain_sha256, EXPECTED_RAW_PLAIN_SHA256
        )
        self.assertEqual(
            self.receipt.quotient_wire_plain_sha256,
            EXPECTED_QUOTIENT_PLAIN_SHA256,
        )
        self.assertEqual(self.receipt.scalar_wire_size_bytes, 12234)
        self.assertEqual(self.receipt.raw_wire_size_bytes, 99897)
        self.assertEqual(self.receipt.quotient_wire_size_bytes, 99867)

    def test_cpp_table_is_a_deterministic_projection_of_frozen_wire(self) -> None:
        rendered = C._render()
        observed = GENERATED_HEADER.read_bytes()
        self.assertEqual(observed, rendered)
        self.assertEqual(
            hashlib.sha256(observed).hexdigest(),
            "dee0e4ce1aabaa376eeb3cf004b1aef9d5a7cedfb59c81e6f7f7c098138798fb",
        )
        text = observed.decode("ascii")
        self.assertIn("std::array<LaurentTerm, 516> kScalarTerms", text)
        self.assertIn("std::array<std::size_t, 10> kScalarOffsets", text)
        self.assertIn("std::array<LaurentTerm, 3053> kQuotientTerms", text)
        self.assertIn("std::array<std::size_t, 18> kQuotientOffsets", text)
        self.assertEqual(text.count("LaurentTerm{"), 3569)

    def test_every_authority_lock_remains_false(self) -> None:
        self.assertTrue(self.receipt.calculation_only)
        for field in (
            "independent_audit_clear",
            "proof_authority",
            "candidate_executed",
            "theory_graph_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
        ):
            self.assertIs(getattr(self.receipt, field), False)

    def test_source_is_stdlib_only_and_has_no_execution_surface(self) -> None:
        text = SOURCE.read_text(encoding="utf-8")
        for required in (
            "Q[s,m,k,k^-1]",
            "RAW_ORDER: Final[int] = 26",
            "QUOTIENT_ORDER: Final[int] = 16",
            "SCALAR_ORDER: Final[int] = 8",
        ):
            self.assertIn(required, text)
        for forbidden in (
            "sympy",
            "gmpy2",
            "numpy",
            "subprocess",
            "os.environ",
            "candidate_output",
            "registry",
            "proof_authority=True",
        ):
            self.assertNotIn(forbidden, text)


if __name__ == "__main__":
    unittest.main()
