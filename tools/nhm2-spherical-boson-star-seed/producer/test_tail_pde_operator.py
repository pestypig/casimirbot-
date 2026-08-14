from __future__ import annotations

import ctypes
from dataclasses import FrozenInstanceError, replace
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
import join_extraction as public_join  # noqa: E402
import tail_collocation as public_tail  # noqa: E402
import tail_pde_operator as pde  # noqa: E402


GOLDEN_DOMAIN = b"nhm2-spherical-boson-star-seed/tail-pde/golden/v1\n"
GOLDEN_SHA256 = "19392b5a71a8c1acaf1310a13c1c5ed0902ff9168c30cb2b06563e082edaf167"
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


def _barriers() -> public_join.FrozenL2JoinBarriers:
    values = (0.125, -0.00390625, -0.25, 0.0078125)
    return public_join.FrozenL2JoinBarriers(
        node_count=128,
        join_x=32,
        join_rho_exact="32/33",
        U=values[0],
        U1=values[1],
        V=values[2],
        V1=values[3],
        barrier_values=values,
        barrier_order=("U", "U1", "V", "V1"),
        primary_numerics_policy_sha256=pde.PRIMARY_NUMERICS_POLICY_SHA256,
        primary_numerics_policy_canonical_size_bytes=(
            pde.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        ),
        spectral_source_sha256=public_join.SPECTRAL_SOURCE_SHA256,
        spectral_source_size_bytes=public_join.SPECTRAL_SOURCE_SIZE_BYTES,
        spectral_payload_sha256=public_join.SPECTRAL_N128_PAYLOAD_SHA256,
        mpfr_precision_bits=pde.MPFR_PRECISION_BITS,
        mpfr_rounding_mode=pde.MPFR_ROUNDING_MODE,
        mpfr_emin=pde.MPFR_EMIN,
        mpfr_emax=pde.MPFR_EMAX,
        observed_gmpy2_version="synthetic_role_only",
        observed_mpfr_version="synthetic_role_only",
    )


def _state() -> tuple[float, ...]:
    h = tuple(
        (2.0 ** -(8 + (index % 5))) * (-1.0 if index % 2 else 1.0)
        for index in range(32)
    )
    q = tuple(
        (2.0 ** -(9 + (index % 4))) * (-1.0 if index % 3 else 1.0)
        for index in range(32)
    )
    return (0.75, *h, *q)


def _golden(result: pde.FrozenTailPdeEvaluation) -> str:
    digest = hashlib.sha256(GOLDEN_DOMAIN)
    digest.update(struct.pack("<64d", *result.residual))
    for row in result.jacobian:
        digest.update(struct.pack("<65d", *row))
    return digest.hexdigest()


def _context_snapshot(context: gmpy2.context) -> tuple[object, ...]:
    return tuple(getattr(context, field) for field in CONTEXT_FIELDS)


def _independent_formula_and_jacobian(
    collocation: public_tail.FrozenTailCollocation,
    barriers: public_join.FrozenL2JoinBarriers,
    nu: float,
    state: tuple[float, ...],
) -> tuple[tuple[float, ...], tuple[tuple[float, ...], ...]]:
    R = 32.0
    C = state[0]
    kappa = math.sqrt(-2.0 * nu)
    a = kappa * R
    sigma = C / kappa - 1.0
    sigma_c = 1.0 / kappa
    H1 = barriers.U
    Hy1 = (-a + sigma) * H1 - R * barriers.U1
    Hy1_c = sigma_c * H1
    Q1 = barriers.V + C / R
    Q1_c = 1.0 / R
    q_coefficient = -2.0 * a + 2.0 * sigma
    Qy1 = q_coefficient * Q1 + C / R - R * barriers.V1
    Qy1_c = 2.0 * sigma_c * Q1 + q_coefficient * Q1_c + 1.0 / R

    residual: list[float] = []
    jacobian: list[tuple[float, ...]] = []
    bases = tuple(
        public_tail.evaluate_tail_chebyshev_basis(y) for y in collocation.y
    )
    cached: list[
        tuple[
            float,
            float,
            float,
            float,
            float,
            float,
            tuple[float, ...],
            tuple[float, ...],
            tuple[float, ...],
            tuple[float, ...],
            tuple[float, ...],
            tuple[float, ...],
        ]
    ] = []
    for y, basis in zip(collocation.y, bases, strict=True):
        one_minus = 1.0 - y
        envelope = one_minus * one_minus
        envelope_y = -2.0 * one_minus
        Ah = math.fsum(state[1 + n] * basis.T[n] for n in range(32))
        Ahy = math.fsum(state[1 + n] * basis.Ty[n] for n in range(32))
        Ahyy = math.fsum(state[1 + n] * basis.Tyy[n] for n in range(32))
        Aq = math.fsum(state[33 + n] * basis.T[n] for n in range(32))
        Aqy = math.fsum(state[33 + n] * basis.Ty[n] for n in range(32))
        Aqyy = math.fsum(state[33 + n] * basis.Tyy[n] for n in range(32))
        H = H1 + Hy1 * (y - 1.0) + envelope * Ah
        Hy = Hy1 + envelope_y * Ah + envelope * Ahy
        Hyy = 2.0 * Ah + 2.0 * envelope_y * Ahy + envelope * Ahyy
        Q = Q1 + Qy1 * (y - 1.0) + envelope * Aq
        Qy = Qy1 + envelope_y * Aq + envelope * Aqy
        Qyy = 2.0 * Aq + 2.0 * envelope_y * Aqy + envelope * Aqyy

        dH = [0.0] * 65
        dHy = [0.0] * 65
        dHyy = [0.0] * 65
        dQ = [0.0] * 65
        dQy = [0.0] * 65
        dQyy = [0.0] * 65
        dH[0] = Hy1_c * (y - 1.0)
        dHy[0] = Hy1_c
        dQ[0] = Q1_c + Qy1_c * (y - 1.0)
        dQy[0] = Qy1_c
        for n in range(32):
            dH[1 + n] = envelope * basis.T[n]
            dHy[1 + n] = envelope_y * basis.T[n] + envelope * basis.Ty[n]
            dHyy[1 + n] = (
                2.0 * basis.T[n]
                + 2.0 * envelope_y * basis.Ty[n]
                + envelope * basis.Tyy[n]
            )
            dQ[33 + n] = envelope * basis.T[n]
            dQy[33 + n] = envelope_y * basis.T[n] + envelope * basis.Ty[n]
            dQyy[33 + n] = (
                2.0 * basis.T[n]
                + 2.0 * envelope_y * basis.Ty[n]
                + envelope * basis.Tyy[n]
            )
        cached.append(
            (
                H,
                Hy,
                Hyy,
                Q,
                Qy,
                Qyy,
                tuple(dH),
                tuple(dHy),
                tuple(dHyy),
                tuple(dQ),
                tuple(dQy),
                tuple(dQyy),
            )
        )

    for row_kind in ("S", "P"):
        for y, values in zip(collocation.y, cached, strict=True):
            H, Hy, Hyy, Q, Qy, Qyy, dH, dHy, dHyy, dQ, dQy, dQyy = values
            if y == 0.0:
                exterior = 0.0
                exterior_c = 0.0
            else:
                x = R / y
                logarithm = math.log(x / R)
                B = math.exp(-kappa * (x - R) + sigma * logarithm)
                exterior = (B * B) / (y * y)
                exterior_c = exterior * 2.0 * sigma_c * logarithm
            if row_kind == "S":
                sigma_product = sigma * (sigma + 1.0)
                sigma_product_c = (2.0 * sigma + 1.0) * sigma_c
                if y == 0.0:
                    value = -a * Hy - 0.5 * sigma_product * H
                else:
                    a_minus_sigma_y = a - sigma * y
                    linear = (
                        y * y * Hyy
                        + 2.0 * a_minus_sigma_y * Hy
                        + sigma_product * H
                    )
                    source = R * R * exterior * Q * H
                    value = -0.5 * linear + source
                row_derivatives: list[float] = []
                for k in range(65):
                    dsigma = sigma_c if k == 0 else 0.0
                    d_sigma_product = sigma_product_c if k == 0 else 0.0
                    if y == 0.0:
                        derivative = (
                            -a * dHy[k]
                            - 0.5
                            * (d_sigma_product * H + sigma_product * dH[k])
                        )
                    else:
                        a_minus_sigma_y = a - sigma * y
                        d_a_minus_sigma_y = -dsigma * y
                        d_linear = (
                            y * y * dHyy[k]
                            + 2.0
                            * (
                                d_a_minus_sigma_y * Hy
                                + a_minus_sigma_y * dHy[k]
                            )
                            + d_sigma_product * H
                            + sigma_product * dH[k]
                        )
                        d_exterior = exterior_c if k == 0 else 0.0
                        d_source = R * R * (
                            d_exterior * Q * H
                            + exterior * (dQ[k] * H + Q * dH[k])
                        )
                        derivative = -0.5 * d_linear + d_source
                    row_derivatives.append(derivative)
            else:
                if y == 0.0:
                    coefficient = 4.0 * a * a
                    value = coefficient * Q - R * R * H * H
                else:
                    a_minus_sigma_y = a - sigma * y
                    coefficient = (
                        4.0 * a * a
                        - 4.0 * a * (2.0 * sigma + 1.0) * y
                        + (2.0 * sigma) * (2.0 * sigma + 1.0) * y * y
                    )
                    value = (
                        y**4 * Qyy
                        + 4.0 * y * y * a_minus_sigma_y * Qy
                        + coefficient * Q
                        - R * R * H * H
                    )
                row_derivatives = []
                for k in range(65):
                    dsigma = sigma_c if k == 0 else 0.0
                    if y == 0.0:
                        derivative = (
                            coefficient * dQ[k] - R * R * 2.0 * H * dH[k]
                        )
                    else:
                        d_a_minus_sigma_y = -dsigma * y
                        d_coefficient = (
                            -4.0 * a * (2.0 * dsigma) * y
                            + (8.0 * sigma + 2.0) * dsigma * y * y
                        )
                        derivative = (
                            y**4 * dQyy[k]
                            + 4.0
                            * y
                            * y
                            * (
                                d_a_minus_sigma_y * Qy
                                + a_minus_sigma_y * dQy[k]
                            )
                            + d_coefficient * Q
                            + coefficient * dQ[k]
                            - R * R * 2.0 * H * dH[k]
                        )
                    row_derivatives.append(derivative)
            residual.append(value)
            jacobian.append(tuple(row_derivatives))
    return tuple(residual), tuple(jacobian)


class TailPdeOperatorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.collocation = public_tail.generate_tail_collocation()
        cls.barriers = _barriers()
        cls.nu = -0.125
        cls.state = _state()
        cls.result = pde.evaluate_tail_pde_operator(
            cls.collocation, cls.barriers, cls.nu, cls.state
        )

    def test_exact_source_bindings_dimensions_order_and_golden(self) -> None:
        expected_sources = (
            (
                "binary64_environment.py",
                pde.BINARY64_ENVIRONMENT_SOURCE_SHA256,
                pde.BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES,
            ),
            (
                "tail_collocation.py",
                pde.TAIL_COLLOCATION_SOURCE_SHA256,
                pde.TAIL_COLLOCATION_SOURCE_SIZE_BYTES,
            ),
            (
                "join_extraction.py",
                pde.JOIN_EXTRACTION_SOURCE_SHA256,
                pde.JOIN_EXTRACTION_SOURCE_SIZE_BYTES,
            ),
            (
                "spectral.py",
                pde.SPECTRAL_SOURCE_SHA256,
                pde.SPECTRAL_SOURCE_SIZE_BYTES,
            ),
        )
        for filename, expected_hash, expected_size in expected_sources:
            with self.subTest(filename=filename):
                source = (HERE / filename).read_bytes()
                self.assertEqual(len(source), expected_size)
                self.assertEqual(hashlib.sha256(source).hexdigest(), expected_hash)
        self.assertEqual(
            (
                pde.PRIMARY_NUMERICS_POLICY_SHA256,
                pde.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES,
            ),
            (
                "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4",
                80_055,
            ),
        )
        self.assertEqual(
            (
                pde.JOIN_EXTRACTION_SOURCE_SHA256,
                pde.JOIN_EXTRACTION_SOURCE_SIZE_BYTES,
            ),
            (
                "d2b86dffeaa9e56aabed044f688d89c6b282600b435aa8b3491ce51ca07d7d6b",
                26_780,
            ),
        )
        self.assertEqual(
            pde._PRIVATE_JOIN_EXTRACTION_MODULE_NAME,
            "_nhm2_seed_tail_pde_join_d2b86dffeaa9e56a",
        )
        self.assertIsNot(
            pde._join_extraction_module._spectral_module,
            pde._spectral_module,
        )
        self.assertIs(
            pde._join_extraction_module.FrozenLobattoSpectralPrimitive,
            pde._join_extraction_module._spectral_module.FrozenLobattoSpectralPrimitive,
        )
        result = self.result
        self.assertEqual((result.node_count, result.unknown_count), (32, 65))
        self.assertEqual(result.pde_row_count, 64)
        self.assertEqual(len(result.residual), 64)
        self.assertEqual(len(result.jacobian), 64)
        self.assertTrue(all(len(row) == 65 for row in result.jacobian))
        self.assertEqual(result.unknown_order, "C,h[0..31],q[0..31]")
        self.assertEqual(result.row_order, "S[0..31],P[0..31]")
        self.assertEqual(
            result.row_labels,
            tuple([*(f"S[{i}]" for i in range(32)), *(f"P[{i}]" for i in range(32))]),
        )
        self.assertEqual(_golden(result), GOLDEN_SHA256)

    def test_literal_row_field_transcendental_and_storage_chronology(self) -> None:
        rows: list[tuple[str, int]] = []
        fields: list[str] = []
        aliases: list[tuple[str, str]] = []
        original_row = pde._evaluate_pde_row
        original_field = pde._stream_field
        original_alias = pde._cr_alias

        def observed_row(*args: object, **kwargs: object) -> object:
            rows.append((args[1], args[2]))  # type: ignore[arg-type]
            return original_row(*args, **kwargs)  # type: ignore[arg-type]

        def observed_field(*args: object, **kwargs: object) -> object:
            fields.append(args[5])  # type: ignore[arg-type]
            return original_field(*args, **kwargs)  # type: ignore[arg-type]

        def observed_alias(*args: object, **kwargs: object) -> float:
            aliases.append((args[1], args[3]))  # type: ignore[arg-type]
            return original_alias(*args, **kwargs)  # type: ignore[arg-type]

        with (
            patch.object(pde, "_evaluate_pde_row", side_effect=observed_row),
            patch.object(pde, "_stream_field", side_effect=observed_field),
            patch.object(pde, "_cr_alias", side_effect=observed_alias),
        ):
            observed = pde.evaluate_tail_pde_operator(
                self.collocation, self.barriers, self.nu, self.state
            )
        self.assertEqual(observed.residual, self.result.residual)
        self.assertEqual(
            rows,
            [*(("S", i) for i in range(32)), *(("P", i) for i in range(32))],
        )
        expected_fields: list[str] = []
        for row_kind in ("S", "P"):
            for index in range(32):
                expected_fields.extend((f"{row_kind}[{index}].H", f"{row_kind}[{index}].Q"))
        self.assertEqual(fields, expected_fields)
        self.assertEqual(aliases[0], ("sqrt", "invariant.kappa"))
        self.assertEqual(len(aliases), 125)
        self.assertTrue(all(kind in {"log", "exp"} for kind, _ in aliases[1:]))
        for index in range(1, len(aliases) - 1, 2):
            self.assertEqual((aliases[index][0], aliases[index + 1][0]), ("log", "exp"))

    def test_literal_c1_lifts_and_dual_component_order(self) -> None:
        with environment.nearest_binary64_environment():
            with pde._owned_mpfr256_context() as context:
                invariants = pde._build_row_invariants(
                    context,
                    self.nu,
                    self.state,
                    self.barriers.barrier_values,
                )
        self.assertEqual(
            (
                invariants.kappa.value,
                invariants.a.value,
                invariants.sigma.value,
                invariants.H1.value,
                invariants.Hy1.value,
                invariants.Q1.value,
                invariants.Qy1.value,
            ),
            (0.5, 16.0, 0.5, 0.125, -1.8125, -0.2265625, 6.796875),
        )
        self.assertEqual(
            (
                invariants.sigma.derivatives[0],
                invariants.Hy1.derivatives[0],
                invariants.Q1.derivatives[0],
                invariants.Qy1.derivatives[0],
            ),
            (2.0, 0.25, 0.03125, -1.84375),
        )
        for invariant in (
            invariants.R,
            invariants.kappa,
            invariants.a,
            invariants.H1,
        ):
            self.assertTrue(all(value == 0.0 for value in invariant.derivatives))

        events: list[str] = []
        original_mul = pde._mul
        original_add = pde._add

        def observed_mul(left: float, right: float, operation: str) -> float:
            events.append(operation)
            return original_mul(left, right, operation)

        def observed_add(left: float, right: float, operation: str) -> float:
            events.append(operation)
            return original_add(left, right, operation)

        left = pde._dual_unknown(3.0, 0, "left")
        right = pde._dual_unknown(5.0, 64, "right")
        with (
            patch.object(pde, "_mul", side_effect=observed_mul),
            patch.object(pde, "_add", side_effect=observed_add),
        ):
            product = pde._dual_mul(left, right, "probe")
        expected_events = ["probe.value"]
        for index in range(65):
            expected_events.extend(
                (
                    f"probe.d[{index}].left",
                    f"probe.d[{index}].right",
                    f"probe.d[{index}].add",
                )
            )
        self.assertEqual(events, expected_events)
        self.assertEqual(product.value, 15.0)
        self.assertEqual(product.derivatives[0], 5.0)
        self.assertEqual(product.derivatives[64], 3.0)

        class FlagProbe:
            def __init__(self) -> None:
                self.reads: list[str] = []

            def __getattribute__(self, name: str) -> object:
                if name in {
                    "underflow",
                    "overflow",
                    "inexact",
                    "invalid",
                    "erange",
                    "divzero",
                }:
                    object.__getattribute__(self, "reads").append(name)
                    return False
                return object.__getattribute__(self, name)

        flag_probe = FlagProbe()
        pde._check_mpfr_flags(flag_probe, "probe")  # type: ignore[arg-type]
        self.assertEqual(
            flag_probe.reads,
            ["underflow", "overflow", "inexact", "invalid", "erange", "divzero"],
        )

    def test_literal_scaled_row_inner_operation_order(self) -> None:
        constant = pde._dual_constant
        invariants = pde._RowInvariants(
            R=constant(32.0, "probe.R"),
            kappa=constant(0.5, "probe.kappa"),
            a=constant(16.0, "probe.a"),
            sigma=constant(0.5, "probe.sigma"),
            H1=constant(0.125, "probe.H1"),
            Hy1=constant(-1.8125, "probe.Hy1"),
            Q1=constant(-0.2265625, "probe.Q1"),
            Qy1=constant(6.796875, "probe.Qy1"),
        )
        y = constant(0.5, "probe.y")
        H = constant(0.25, "probe.H")
        Hy = constant(-0.125, "probe.Hy")
        Hyy = constant(0.0625, "probe.Hyy")
        Q = constant(-0.375, "probe.Q")
        Qy = constant(0.1875, "probe.Qy")
        Qyy = constant(-0.09375, "probe.Qyy")
        exterior = constant(0.03125, "probe.exterior")

        def capture(callable_: object, *args: object) -> list[str]:
            events: list[str] = []
            originals = {
                "_dual_add": pde._dual_add,
                "_dual_sub": pde._dual_sub,
                "_dual_neg": pde._dual_neg,
                "_dual_mul": pde._dual_mul,
            }

            def observed(name: str):
                def wrapper(*inner_args: object, **inner_kwargs: object) -> object:
                    events.append(inner_args[-1])  # type: ignore[arg-type]
                    return originals[name](*inner_args, **inner_kwargs)  # type: ignore[arg-type]

                return wrapper

            with (
                patch.object(pde, "_dual_add", side_effect=observed("_dual_add")),
                patch.object(pde, "_dual_sub", side_effect=observed("_dual_sub")),
                patch.object(pde, "_dual_neg", side_effect=observed("_dual_neg")),
                patch.object(pde, "_dual_mul", side_effect=observed("_dual_mul")),
            ):
                callable_(*args)  # type: ignore[operator]
            return events

        self.assertEqual(
            capture(
                pde._schrodinger_row,
                y,
                H,
                Hy,
                Hyy,
                Q,
                exterior,
                invariants,
                "Sprobe",
            ),
            [
                "Sprobe.t0_y_squared",
                "Sprobe.t1",
                "Sprobe.sigma_y",
                "Sprobe.t2",
                "Sprobe.two_t2",
                "Sprobe.t3",
                "Sprobe.sigma_plus_one",
                "Sprobe.sigma_product",
                "Sprobe.t4",
                "Sprobe.linear.t1_plus_t3",
                "Sprobe.linear",
                "Sprobe.R_squared",
                "Sprobe.source_scale",
                "Sprobe.Q_times_H",
                "Sprobe.source",
                "Sprobe.negative_half_linear",
                "Sprobe.value",
            ],
        )
        self.assertEqual(
            capture(
                pde._poisson_row,
                y,
                H,
                Q,
                Qy,
                Qyy,
                invariants,
                "Pprobe",
            ),
            [
                "Pprobe.p0.y_squared_left",
                "Pprobe.p0.y_squared_right",
                "Pprobe.p0.y_fourth",
                "Pprobe.p0",
                "Pprobe.p1.y_squared",
                "Pprobe.p1.four_y_squared",
                "Pprobe.p1.sigma_y",
                "Pprobe.p1.a_minus_sigma_y",
                "Pprobe.p1.prefix",
                "Pprobe.p1",
                "Pprobe.a_squared",
                "Pprobe.c0",
                "Pprobe.c1.four_a",
                "Pprobe.c1.two_sigma",
                "Pprobe.c1.two_sigma_plus_one",
                "Pprobe.c1",
                "Pprobe.c2.two_sigma",
                "Pprobe.c2.two_sigma_plus_one",
                "Pprobe.c2",
                "Pprobe.coefficient.c1_y",
                "Pprobe.coefficient.subtract",
                "Pprobe.coefficient.y_squared",
                "Pprobe.coefficient.c2_y_squared",
                "Pprobe.coefficient",
                "Pprobe.p2",
                "Pprobe.R_squared",
                "Pprobe.H_squared",
                "Pprobe.p3",
                "Pprobe.p0_plus_p1",
                "Pprobe.p0_plus_p1_plus_p2",
                "Pprobe.value",
            ],
        )

    def test_full_jacobian_matches_independent_closed_form_chain_rule(self) -> None:
        expected_residual, expected_jacobian = _independent_formula_and_jacobian(
            self.collocation, self.barriers, self.nu, self.state
        )
        for row_index, (observed, expected) in enumerate(
            zip(self.result.residual, expected_residual, strict=True)
        ):
            self.assertTrue(
                math.isclose(observed, expected, rel_tol=2.0e-11, abs_tol=2.0e-9),
                (row_index, observed, expected),
            )
        for row_index, (observed_row, expected_row) in enumerate(
            zip(self.result.jacobian, expected_jacobian, strict=True)
        ):
            for column_index, (observed, expected) in enumerate(
                zip(observed_row, expected_row, strict=True)
            ):
                self.assertTrue(
                    math.isclose(
                        observed, expected, rel_tol=5.0e-10, abs_tol=5.0e-8
                    ),
                    (row_index, column_index, observed, expected),
                )

    def test_complete_mpfr_and_native_fenv_are_invariant_and_restored(self) -> None:
        mpfr = gmpy2.get_context()
        saved_mpfr = mpfr.copy()
        original_native = environment._capture_native_environment()
        try:
            mpfr.precision = 71
            mpfr.round = gmpy2.RoundDown
            mpfr.emin = -89
            mpfr.emax = 97
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
            mpfr_before = _context_snapshot(mpfr)

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
            native_before = environment.observed_binary64_environment()
            observed = pde.evaluate_tail_pde_operator(
                self.collocation, self.barriers, self.nu, self.state
            )
            self.assertEqual(_golden(observed), GOLDEN_SHA256)
            self.assertEqual(_context_snapshot(mpfr), mpfr_before)
            self.assertEqual(environment.observed_binary64_environment(), native_before)

            with patch.object(
                pde,
                "_evaluate_pde_row",
                side_effect=pde.TailPdeOperatorError("synthetic_row_failure"),
            ):
                with self.assertRaises(pde.TailPdeOperatorError) as caught:
                    pde.evaluate_tail_pde_operator(
                        self.collocation, self.barriers, self.nu, self.state
                    )
                self.assertEqual(caught.exception.code, "synthetic_row_failure")
            self.assertEqual(_context_snapshot(mpfr), mpfr_before)
            self.assertEqual(environment.observed_binary64_environment(), native_before)
        finally:
            gmpy2.set_context(saved_mpfr)
            environment._restore_native_environment(original_native)

    def test_hostile_shapes_bits_authority_and_source_pins_fail_closed(self) -> None:
        state_cases = (
            (list(self.state), "tail_pde_state_shape_invalid"),
            (self.state[:-1], "tail_pde_state_shape_invalid"),
            ((-0.0, *self.state[1:]), "tail_pde_binary64_negative_zero_input"),
            ((*self.state[:-1], float("nan")), "tail_pde_binary64_nonfinite_input"),
        )
        for selected_state, code in state_cases:
            with self.subTest(code=code):
                with self.assertRaises(pde.TailPdeOperatorError) as caught:
                    pde.evaluate_tail_pde_operator(
                        self.collocation,
                        self.barriers,
                        self.nu,
                        selected_state,  # type: ignore[arg-type]
                    )
                self.assertEqual(caught.exception.code, code)
        zero_c = pde.evaluate_tail_pde_operator(
            self.collocation, self.barriers, self.nu, (0.0, *self.state[1:])
        )
        self.assertEqual(len(zero_c.residual), 64)
        self.assertEqual(len(zero_c.jacobian), 64)
        with self.assertRaises(pde.TailPdeOperatorError) as caught:
            pde.evaluate_tail_pde_operator(
                self.collocation, self.barriers, 0.0, self.state
            )
        self.assertEqual(caught.exception.code, "tail_pde_nu_domain_invalid")

    def test_private_residual_only_graph_is_bitwise_equal_and_never_dual(self) -> None:
        full = pde.evaluate_tail_pde_operator(
            self.collocation, self.barriers, self.nu, self.state
        )
        with patch.object(
            pde, "_dual_unknown", side_effect=AssertionError("dual graph touched")
        ):
            residual_only = pde._evaluate_tail_pde_residual_only(
                self.collocation, self.barriers, self.nu, self.state
            )
        self.assertEqual(
            tuple(pde._f64_bits(value) for value in residual_only.residual),
            tuple(pde._f64_bits(value) for value in full.residual),
        )
        self.assertFalse(hasattr(residual_only, "jacobian"))
        self.assertIs(residual_only.dual_graph_executed, False)
        self.assertIs(residual_only.jacobian_computed, False)

        owned_full = pde._evaluate_tail_pde_operator_from_owned_join(
            owner_join_module=public_join,
            collocation=self.collocation,
            join_barriers=self.barriers,
            projected_l2_nu=self.nu,
            state=self.state,
        )
        with patch.object(
            pde, "_dual_unknown", side_effect=AssertionError("dual graph touched")
        ):
            owned_residual = pde._evaluate_tail_pde_residual_from_owned_join(
                owner_join_module=public_join,
                collocation=self.collocation,
                join_barriers=self.barriers,
                projected_l2_nu=self.nu,
                state=self.state,
            )
        self.assertEqual(
            tuple(pde._f64_bits(value) for value in owned_full.residual),
            tuple(pde._f64_bits(value) for value in full.residual),
        )
        self.assertEqual(
            tuple(pde._f64_bits(value) for value in owned_residual.residual),
            tuple(pde._f64_bits(value) for value in full.residual),
        )
        with self.assertRaises(pde.TailPdeOperatorError) as owner_mismatch:
            pde._validate_owned_join_barriers(
                pde._join_extraction_module, self.barriers
            )
        self.assertEqual(
            owner_mismatch.exception.code,
            "tail_pde_owned_join_barrier_type_invalid",
        )

        hostile_inputs = (
            (
                replace(self.collocation, candidate_execution_authorized=True),
                self.barriers,
                "tail_pde_collocation_authority_lock_invalid",
            ),
            (
                replace(
                    self.collocation,
                    y=(
                        self.collocation.y[0],
                        math.nextafter(self.collocation.y[1], self.collocation.y[2]),
                        *self.collocation.y[2:],
                    ),
                ),
                self.barriers,
                "tail_pde_collocation_payload_invalid",
            ),
            (
                self.collocation,
                replace(self.barriers, candidate_authority=True),
                "tail_pde_join_barrier_authority_lock_invalid",
            ),
            (
                self.collocation,
                replace(self.barriers, barrier_values=(0.0,) * 4),
                "tail_pde_join_barrier_named_value_mismatch",
            ),
        )
        for collocation, barriers, code in hostile_inputs:
            with self.subTest(code=code):
                with self.assertRaises(pde.TailPdeOperatorError) as caught:
                    pde.evaluate_tail_pde_operator(
                        collocation, barriers, self.nu, self.state
                    )
                self.assertEqual(caught.exception.code, code)

        for field, code in (
            (
                "BINARY64_ENVIRONMENT_SOURCE_SHA256",
                "tail_pde_binary64_environment_source_mismatch",
            ),
            (
                "TAIL_COLLOCATION_SOURCE_SHA256",
                "tail_pde_tail_collocation_source_mismatch",
            ),
            (
                "JOIN_EXTRACTION_SOURCE_SHA256",
                "tail_pde_join_extraction_source_mismatch",
            ),
            (
                "SPECTRAL_SOURCE_SHA256",
                "tail_pde_spectral_source_mismatch",
            ),
        ):
            with self.subTest(source_pin=field):
                with patch.object(pde, field, "0" * 64):
                    with self.assertRaises(pde.TailPdeOperatorError) as caught:
                        pde.evaluate_tail_pde_operator(
                            object(), object(), float("nan"), object()  # type: ignore[arg-type]
                        )
                    self.assertEqual(caught.exception.code, code)

    def test_exact_path_public_module_preloads_cannot_substitute_private_bytes(self) -> None:
        module_path = HERE / "tail_pde_operator.py"
        program = f"""
import importlib.util
import pathlib
import sys
import types

path = pathlib.Path({str(module_path)!r})
sys.path.insert(0, str(path.parent))
fakes = {{}}
for name in ("binary64_environment", "tail_collocation", "join_extraction", "spectral"):
    fake = types.ModuleType(name)
    fake.__file__ = str(path.with_name(name + ".py"))
    fakes[name] = fake
    sys.modules[name] = fake
spec = importlib.util.spec_from_file_location("hostile_tail_pde_operator", path)
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
try:
    spec.loader.exec_module(module)
except Exception as error:
    print(getattr(error, "code", type(error).__name__))
else:
    private = (
        module._binary64_environment,
        module._tail_collocation_module,
        module._join_extraction_module,
        module._spectral_module,
    )
    if (
        all(private[index] is not fakes[name] for index, name in enumerate(("binary64_environment", "tail_collocation", "join_extraction", "spectral")))
        and all(sys.modules[name] is fake for name, fake in fakes.items())
        and all(pathlib.Path(item.__file__).resolve() == path.with_name(name + ".py") for item, name in zip(private, ("binary64_environment", "tail_collocation", "join_extraction", "spectral")))
        and module._join_extraction_module._spectral_module is not fakes["spectral"]
        and module._join_extraction_module._spectral_module is not module._spectral_module
        and module._join_extraction_module.FrozenLobattoSpectralPrimitive is module._join_extraction_module._spectral_module.FrozenLobattoSpectralPrimitive
        and module._PRIVATE_JOIN_EXTRACTION_MODULE_NAME not in sys.modules
        and module._join_extraction_module._spectral_module.__name__ not in sys.modules
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

    def test_result_is_immutable_and_all_authority_stays_false(self) -> None:
        self.assertTrue(self.result.calculation_implemented)
        self.assertTrue(self.result.analytic_jacobian_implemented)
        self.assertFalse(any(pde.AUTHORITY_LOCKS.values()))
        for field in (
            "mass_row_implemented",
            "quadrature_implemented",
            "newton_implemented",
            "solve_performed",
            "candidate_execution_authorized",
            "candidate_executed",
            "candidate_output_materialized",
            "output_present",
            "output_accepted",
            "seed_accepted",
            "branch_accepted",
            "replay_authority",
            "independent_agreement",
            "diagnostic_pass_authority",
            "candidate_authority",
            "theory_graph_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
        ):
            self.assertIs(getattr(self.result, field), False)
        with self.assertRaises(FrozenInstanceError):
            self.result.pde_row_count = 65  # type: ignore[misc]
        self.assertFalse(hasattr(pde, "evaluate_tail_mass_row"))
        self.assertFalse(hasattr(pde, "solve_tail_newton"))


if __name__ == "__main__":
    unittest.main()
