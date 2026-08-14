from __future__ import annotations

from collections import Counter
from dataclasses import FrozenInstanceError, replace
import hashlib
import math
import os
from pathlib import Path
import struct
import subprocess
import sys
import unittest
from unittest.mock import patch

import gmpy2


HERE = Path(__file__).resolve().parent
REPOSITORY_ROOT = HERE.parents[2]
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import join_extraction as join  # noqa: E402

generate_lobatto_spectral_primitive = (
    join._spectral_module.generate_lobatto_spectral_primitive
)


GOLDEN_DOMAIN = b"nhm2-spherical-boson-star-seed-primary-l2-join/golden/v1\n"
GOLDEN_SHA256 = "42e11c43186bc30c947c7e4655088cf8ea6adfa58eb6787cdc10fd75d66e0af1"
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


def _state(grid: object) -> tuple[float, ...]:
    u = tuple(
        0.0 if index == 127 else (1.0 - rho) * (1.0 + 0.25 * rho)
        for index, rho in enumerate(grid.rho)  # type: ignore[attr-defined]
    )
    potential = tuple(
        0.0 if index == 127 else -2.0 * (1.0 - rho) * (1.0 - 0.125 * rho)
        for index, rho in enumerate(grid.rho)  # type: ignore[attr-defined]
    )
    return (*u, *potential, -0.25)


def _golden(values: tuple[float, ...]) -> str:
    digest = hashlib.sha256(GOLDEN_DOMAIN)
    digest.update(struct.pack("<4d", *values))
    return digest.hexdigest()


def _context_snapshot(context: gmpy2.context) -> tuple[object, ...]:
    return tuple(getattr(context, field) for field in CONTEXT_FIELDS)


class JoinExtractionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.grid = generate_lobatto_spectral_primitive(128)
        cls.state = _state(cls.grid)
        cls.result = join.extract_l2_join_barriers(cls.grid, cls.state)

    def test_exact_binding_barrier_order_and_golden(self) -> None:
        result = self.result
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
        source = (HERE / "spectral.py").read_bytes()
        self.assertEqual(len(source), join.SPECTRAL_SOURCE_SIZE_BYTES)
        self.assertEqual(hashlib.sha256(source).hexdigest(), join.SPECTRAL_SOURCE_SHA256)
        self.assertEqual(result.barrier_order, ("U", "U1", "V", "V1"))
        self.assertEqual(
            result.barrier_values,
            (result.U, result.U1, result.V, result.V1),
        )
        self.assertEqual(_golden(result.barrier_values), GOLDEN_SHA256)

    def test_exact_path_preloaded_spectral_module_is_ignored(self) -> None:
        module_path = HERE / "join_extraction.py"
        program = f"""
import importlib.util
import pathlib
import sys
import types

path = pathlib.Path({str(module_path)!r})
fake = types.ModuleType("spectral")
fake.__file__ = str(path.with_name("spectral.py"))
fake.FrozenLobattoSpectralPrimitive = object
fake.AUTHORITY_LOCKS = {{"candidateAuthority": True}}
sys.modules["spectral"] = fake
spec = importlib.util.spec_from_file_location("hostile_join_extraction", path)
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)
private = module._spectral_module
print(
    int(
        private is not fake
        and sys.modules["spectral"] is fake
        and pathlib.Path(private.__file__).resolve() == path.with_name("spectral.py")
        and module.FrozenLobattoSpectralPrimitive
        is private.FrozenLobattoSpectralPrimitive
    )
)
"""
        environment = os.environ.copy()
        environment["PYTHONDONTWRITEBYTECODE"] = "1"
        completed = subprocess.run(
            [sys.executable, "-B", "-W", "error", "-c", program],
            cwd=REPOSITORY_ROOT,
            env=environment,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=30,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout.strip(), "1")

    def test_spectral_snapshot_survives_caller_object_changes(self) -> None:
        grid = replace(self.grid)
        original_validate = join._validate_spectral_primitive

        def mutate_before_validation(
            snapshot: join._FrozenSpectralSnapshot,
        ) -> join._FrozenSpectralSnapshot:
            object.__setattr__(grid, "rho", tuple(reversed(grid.rho)))
            object.__setattr__(
                grid,
                "second_derivative",
                tuple(reversed(grid.second_derivative)),
            )
            object.__setattr__(grid, "candidate_authority", True)
            return original_validate(snapshot)

        with patch.object(
            join,
            "_validate_spectral_primitive",
            side_effect=mutate_before_validation,
        ):
            observed = join.extract_l2_join_barriers(grid, self.state)
        self.assertEqual(_golden(observed.barrier_values), GOLDEN_SHA256)

    def test_low_degree_fields_match_independent_analytic_x_derivatives(self) -> None:
        rho = 32.0 / 33.0
        expected = (
            (1.0 - rho) * (1.0 + 0.25 * rho),
            (-0.75 - 0.5 * rho) * (1.0 - rho) ** 2,
            -2.0 * (1.0 - rho) * (1.0 - 0.125 * rho),
            (2.25 - 0.5 * rho) * (1.0 - rho) ** 2,
        )
        for observed, target in zip(self.result.barrier_values, expected, strict=True):
            # The input nodal values are first rounded to binary64, so the
            # MPFR interpolant is not the exact real polynomial.  This bound
            # checks the expected low-degree graph without erasing that ABI.
            self.assertLessEqual(abs(observed - target), 32.0 * math.ulp(target))

    def test_literal_term_accumulation_and_barrier_chronology(self) -> None:
        events: list[str] = []
        get_d_events: list[str] = []
        original_binary = join._binary
        original_copy = join._copy
        original_get_d = join._get_d

        def observed_binary(*args: object, **kwargs: object) -> object:
            events.append(args[1])  # type: ignore[arg-type]
            return original_binary(*args, **kwargs)  # type: ignore[arg-type]

        def observed_copy(*args: object, **kwargs: object) -> object:
            events.append(args[2])  # type: ignore[arg-type]
            return original_copy(*args, **kwargs)  # type: ignore[arg-type]

        def observed_get_d(*args: object, **kwargs: object) -> float:
            get_d_events.append(args[2])  # type: ignore[arg-type]
            return original_get_d(*args, **kwargs)  # type: ignore[arg-type]

        with (
            patch.object(join, "_binary", side_effect=observed_binary),
            patch.object(join, "_copy", side_effect=observed_copy),
            patch.object(join, "_get_d", side_effect=observed_get_d),
        ):
            observed = join.extract_l2_join_barriers(self.grid, self.state)
        first_u_node = [event for event in events if event.startswith("u.")][:15]
        self.assertEqual(
            first_u_node,
            [
                "u.difference.sub",
                "u.difference_squared.mul",
                "u.termS0.div",
                "u.S0.add",
                "u.S0.copy",
                "u.weighted_value.mul",
                "u.termS1.div",
                "u.S1.add",
                "u.S1.copy",
                "u.termS2.div",
                "u.S2.add",
                "u.S2.copy",
                "u.termS3.div",
                "u.S3.add",
                "u.S3.copy",
            ],
        )
        self.assertEqual(
            get_d_events,
            ["U.get_d", "U1.get_d", "V.get_d", "V1.get_d"],
        )
        self.assertEqual(observed.barrier_values, self.result.barrier_values)

    def test_owned_mpfr_context_is_complete_and_restored_on_success_and_failure(self) -> None:
        ambient = gmpy2.get_context()
        saved = ambient.copy()
        try:
            ambient.precision = 79
            ambient.round = gmpy2.RoundDown
            ambient.emin = -91
            ambient.emax = 97
            ambient.subnormalize = True
            ambient.trap_underflow = True
            ambient.trap_overflow = True
            ambient.trap_inexact = True
            ambient.trap_invalid = True
            ambient.trap_erange = True
            ambient.trap_divzero = True
            ambient.underflow = True
            ambient.overflow = True
            ambient.inexact = True
            ambient.invalid = True
            ambient.erange = True
            ambient.divzero = True
            ambient.allow_complex = True
            ambient.rational_division = True
            ambient.allow_release_gil = True
            before = _context_snapshot(ambient)
            observed = join.extract_l2_join_barriers(self.grid, self.state)
            self.assertEqual(observed.barrier_values, self.result.barrier_values)
            self.assertEqual(_context_snapshot(ambient), before)

            with patch.object(
                join,
                "_field_at_join",
                side_effect=join.JoinExtractionError("synthetic_join_failure"),
            ):
                with self.assertRaises(join.JoinExtractionError) as caught:
                    join.extract_l2_join_barriers(self.grid, self.state)
                self.assertEqual(caught.exception.code, "synthetic_join_failure")
            self.assertEqual(_context_snapshot(ambient), before)

            validation_contexts: list[tuple[object, ...]] = []
            original_validation = join._validate_projected_state

            def observed_validation(*args: object, **kwargs: object) -> tuple[float, ...]:
                validation_contexts.append(_context_snapshot(gmpy2.get_context()))
                return original_validation(*args, **kwargs)  # type: ignore[arg-type]

            with patch.object(
                join,
                "_validate_projected_state",
                side_effect=observed_validation,
            ):
                join.extract_l2_join_barriers(self.grid, self.state)
            self.assertEqual(len(validation_contexts), 1)
            installed = dict(zip(CONTEXT_FIELDS, validation_contexts[0]))
            self.assertEqual(installed["precision"], 256)
            self.assertEqual(installed["round"], gmpy2.RoundToNearest)
            self.assertEqual(
                (installed["emin"], installed["emax"]),
                (-1_000_000, 1_000_000),
            )
            self.assertTrue(
                all(
                    installed[field] is False
                    for field in CONTEXT_FIELDS
                    if field not in {"precision", "round", "emin", "emax"}
                )
            )
        finally:
            gmpy2.set_context(saved)

    def test_every_mpfr_flag_is_sampled_after_each_primitive(self) -> None:
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

        probe = FlagProbe()
        join._check_flags(probe, "probe")  # type: ignore[arg-type]
        self.assertEqual(
            probe.reads,
            [
                "underflow",
                "overflow",
                "inexact",
                "invalid",
                "erange",
                "divzero",
            ],
        )

        checks: list[str] = []
        finishes: list[tuple[str, bool]] = []
        conversions: list[str] = []
        original_check = join._check_flags
        original_finish = join._finish
        original_get_d = join._get_d

        def observed_check(context: gmpy2.context, operation: str) -> None:
            checks.append(operation)
            original_check(context, operation)

        def observed_finish(
            context: gmpy2.context,
            value: gmpy2.mpfr,
            operation: str,
        ) -> gmpy2.mpfr:
            finishes.append((operation, bool(gmpy2.is_zero(value))))
            return original_finish(context, value, operation)

        def observed_get_d(
            context: gmpy2.context,
            value: gmpy2.mpfr,
            operation: str,
        ) -> float:
            conversions.append(operation)
            return original_get_d(context, value, operation)

        with (
            patch.object(join, "_check_flags", side_effect=observed_check),
            patch.object(join, "_finish", side_effect=observed_finish),
            patch.object(join, "_get_d", side_effect=observed_get_d),
        ):
            observed = join.extract_l2_join_barriers(self.grid, self.state)
        self.assertEqual(observed.barrier_values, self.result.barrier_values)
        expected_checks = Counter(operation for operation, _ in finishes)
        expected_checks.update(conversions)
        expected_checks.update(
            f"{operation}.canonical_zero"
            for operation, is_zero in finishes
            if is_zero
        )
        self.assertEqual(Counter(checks), expected_checks)
        self.assertGreater(len(finishes), 1_000)
        self.assertEqual(conversions, ["U.get_d", "U1.get_d", "V.get_d", "V1.get_d"])

    def test_shape_bits_and_spectral_binding_fail_closed(self) -> None:
        cases = (
            (list(self.state), "join_projected_state_shape_invalid"),
            (self.state[:-1], "join_projected_state_shape_invalid"),
            (
                (*self.state[:-1], float("nan")),
                "join_binary64_nonfinite_input",
            ),
            (
                (*self.state[:17], -0.0, *self.state[18:]),
                "join_binary64_negative_zero_input",
            ),
            (
                (*self.state[:127], 1.0, *self.state[128:]),
                "join_projected_u_infinity_not_positive_zero",
            ),
        )
        for state, code in cases:
            with self.subTest(code=code):
                with self.assertRaises(join.JoinExtractionError) as caught:
                    join.extract_l2_join_barriers(self.grid, state)  # type: ignore[arg-type]
                self.assertEqual(caught.exception.code, code)
        with self.assertRaises(join.JoinExtractionError) as caught:
            join.extract_l2_join_barriers(
                generate_lobatto_spectral_primitive(64), self.state
            )
        self.assertEqual(caught.exception.code, "join_spectral_node_count_invalid")
        with self.assertRaises(join.JoinExtractionError) as caught:
            join.extract_l2_join_barriers(
                replace(self.grid, calculation_implemented=False), self.state
            )
        self.assertEqual(caught.exception.code, "join_spectral_binding_invalid")
        malformed_first = (
            self.grid.first_derivative[0][:-1],
            *self.grid.first_derivative[1:],
        )
        with patch.object(
            join,
            "_spectral_payload_sha256",
            side_effect=AssertionError("payload hash reached before validation"),
        ):
            for field in join._SPECTRAL_FALSE_FIELDS:
                with self.subTest(authority_field=field):
                    with self.assertRaises(join.JoinExtractionError) as caught:
                        join.extract_l2_join_barriers(
                            replace(self.grid, **{field: True}), self.state
                        )
                    self.assertEqual(
                        caught.exception.code,
                        "join_spectral_authority_lock_invalid",
                    )
            with patch.object(
                join,
                "SPECTRAL_AUTHORITY_LOCKS",
                {"hostile": True},
            ):
                with self.assertRaises(join.JoinExtractionError) as caught:
                    join.extract_l2_join_barriers(self.grid, self.state)
                self.assertEqual(
                    caught.exception.code,
                    "join_spectral_module_authority_lock_invalid",
                )
            with self.assertRaises(join.JoinExtractionError) as caught:
                join.extract_l2_join_barriers(
                    replace(self.grid, first_derivative=malformed_first), self.state
                )
            self.assertEqual(caught.exception.code, "join_spectral_shape_invalid")
        with self.assertRaises(join.JoinExtractionError) as caught:
            join.extract_l2_join_barriers(
                replace(self.grid, node_count=128.0), self.state
            )
        self.assertEqual(caught.exception.code, "join_spectral_node_count_invalid")
        with patch.object(join, "SPECTRAL_SOURCE_SHA256", "0" * 64):
            with self.assertRaises(join.JoinExtractionError) as caught:
                join.extract_l2_join_barriers(object(), object())  # type: ignore[arg-type]
            self.assertEqual(
                caught.exception.code,
                "join_spectral_source_binding_mismatch",
            )

    def test_result_is_immutable_and_every_authority_lock_stays_false(self) -> None:
        self.assertTrue(self.result.calculation_implemented)
        self.assertFalse(self.result.projected_source_acceptance_verified)
        self.assertFalse(any(join.AUTHORITY_LOCKS.values()))
        for field in (
            "candidate_execution_authorized",
            "candidate_executed",
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
            self.result.U = 0.0  # type: ignore[misc]


if __name__ == "__main__":
    unittest.main()
