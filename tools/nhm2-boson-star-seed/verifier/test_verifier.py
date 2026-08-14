from __future__ import annotations

import ast
import hashlib
import inspect
import json
import math
import os
import struct
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import verifier.operators as verifier_operators
from verifier import VERIFIER_IMPLEMENTATION_VERSION
from verifier import verifier as verifier_runtime
from verifier.bootstrap import (
    EXPECTED_ARGV,
    EXPECTED_ENVIRONMENT,
    EXPECTED_EXECUTABLE,
    EXPECTED_INITIAL_SYS_PATH,
    EXPECTED_RUNTIME_SYS_PATH,
    EXPECTED_WORKING_DIRECTORY,
)
from verifier.contract import (
    ARRAY_INVENTORY,
    ARRAY_SHA256_DOMAIN,
    AUTHORITY_LOCKS,
    DYNAMIC_RUN_REQUEST_BINDING_MAXIMUM_BYTES,
    DYNAMIC_RUN_REQUEST_BINDING_PROFILES,
    REPLAY_BUNDLE_PATH,
    RUN_REQUEST_EXPECTED_KEYS,
    STATIC_RUN_REQUEST_BINDINGS,
    TOTAL_ARRAY_BYTES,
    TOTAL_ARRAY_ELEMENTS,
    ArraySpec,
)
from verifier.errors import VerificationBlocked
from verifier.manifest import RunRequest, parse_run_request_bytes
from verifier.mpfr_backend import GMP_LIBRARY_PATH, MPFR_LIBRARY_PATH, Interval, MpfrBackend
from verifier.operators import (
    PROJECTED_MULTIPOLE_POSITIVE_ZERO_COUNT,
    PROJECTED_NODAL_POSITIVE_ZERO_COUNT,
    PROJECTED_POSITIVE_ZERO_COUNT,
    LevelOperators,
    _convergence_metrics_from_differences,
    _count_positive_zero_violations,
    _diagnostic_parity_source_difference,
    _diagnostic_pass_state,
    _parity_legendre_angular_components,
    differentiation_matrix,
    regenerate_level_operators,
)
from verifier.proof_kernel import attempt_required_proof_replays
from verifier.replay_bundle import emit_replay_bundle
from verifier.secure_arrays import array_domain_sha256, decode_finite_f64le


def _binding(field: str) -> dict[str, object]:
    artifact_kind, domain = DYNAMIC_RUN_REQUEST_BINDING_PROFILES[field]
    return {
        "bindingVersion": "nhm2.control_plane.domain_hash_binding/v1",
        "artifactKind": artifact_kind,
        "sha256Domain": domain,
        "sha256": hashlib.sha256(field.encode("ascii")).hexdigest(),
        "canonicalSizeBytes": 1,
    }


def _run_request_value() -> dict[str, object]:
    value: dict[str, object] = {
        "schemaVersion": "nhm2.prolate_boson_star.newtonian_seed.run_request/v1"
    }
    for field in RUN_REQUEST_EXPECTED_KEYS:
        if field == "schemaVersion":
            continue
        if field in STATIC_RUN_REQUEST_BINDINGS:
            value[field] = dict(STATIC_RUN_REQUEST_BINDINGS[field])
        elif field.endswith("Binding"):
            value[field] = _binding(field)
        elif field.endswith("OciImageDigest"):
            value[field] = "sha256:" + hashlib.sha256(field.encode("ascii")).hexdigest()
        else:
            raise AssertionError(field)
    return value


def _canonical(value: object) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        allow_nan=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")


class _FakeDirectedBackend:
    mpfr_version = "test-mpfr"
    gmp_version = "test-gmp"

    @staticmethod
    def add_interval(_left: Interval, _right: Interval) -> Interval:
        return Interval(0.2999999999999999, 0.3000000000000001)

    @staticmethod
    def multiply_interval(_left: Interval, _right: Interval) -> Interval:
        return Interval(0.01999999999999999, 0.02000000000000001)

    @staticmethod
    def divide_interval(_left: Interval, _right: Interval) -> Interval:
        return Interval(0.0999999999999999, 0.1000000000000001)

    @staticmethod
    def sqrt_interval(_value: Interval) -> Interval:
        return Interval(1.4142135623730949, 1.4142135623730952)


class _FakeMappedAngularBackend:
    def __init__(self) -> None:
        self.angular_calls: list[tuple[int, int]] = []

    @staticmethod
    def mapped_node(index: int, count: int, angular: bool) -> float:
        if angular:
            raise AssertionError("generic angular mapped-node rule selected")
        if count != 2 or index not in (0, 1):
            raise AssertionError("unexpected fake radial node")
        return float(index)

    def mapped_angular_node_trigonometry(
        self, index: int, count: int
    ) -> tuple[float, float, float, float | None]:
        self.angular_calls.append((index, count))
        if count != 2 or index not in (0, 1):
            raise AssertionError("unexpected fake angular node")
        if index == 0:
            return 0.0, 0.0, 1.0, None
        return math.pi / 2.0, 1.0, 0.0, 0.0

    @staticmethod
    def sine_cosine_cotangent(
        _value: float,
    ) -> tuple[float, float, float | None]:
        raise AssertionError("serialized-theta trigonometry rule selected")

    @staticmethod
    def cosine_pi_rational(numerator: int, denominator: int) -> float:
        return math.cos(math.pi * numerator / denominator)


def _synthetic_operators(
    level_id: str,
    rho: tuple[float, ...],
    cosine: tuple[float, ...],
) -> LevelOperators:
    theta = tuple(math.acos(value) for value in cosine)
    sine = tuple(math.sin(value) for value in theta)
    cotangent = tuple(
        None if index == 0 else 0.0 if index == len(theta) - 1 else cosine[index] / sine[index]
        for index in range(len(theta))
    )
    radial_zero = tuple(tuple(0.0 for _ in rho) for _ in rho)
    angular_zero = tuple(tuple(0.0 for _ in theta) for _ in theta)
    return LevelOperators(
        level_id=level_id,
        rho=rho,
        theta=theta,
        theta_sine=sine,
        theta_cosine=cosine,
        theta_cotangent=cotangent,
        radial_dct_cosine=radial_zero,
        radial_first=radial_zero,
        radial_second=radial_zero,
        angular_first=angular_zero,
        angular_second=angular_zero,
    )


class VerifierContractTests(unittest.TestCase):
    def test_inventory_is_exact_and_closed(self) -> None:
        self.assertEqual(VERIFIER_IMPLEMENTATION_VERSION.split("/")[-1], "v1")
        self.assertEqual(len(ARRAY_INVENTORY), 32)
        self.assertEqual(TOTAL_ARRAY_ELEMENTS, 810_288)
        self.assertEqual(TOTAL_ARRAY_BYTES, 6_482_304)
        self.assertEqual(
            [entry.inventory_index for entry in ARRAY_INVENTORY], list(range(32))
        )
        self.assertEqual(len({entry.relative_path for entry in ARRAY_INVENTORY}), 32)
        self.assertTrue(all(entry.dtype == "float64_le" for entry in ARRAY_INVENTORY))
        self.assertTrue(all(entry.order == "C_row_major" for entry in ARRAY_INVENTORY))

    def test_array_hash_recipe_and_f64_rejections(self) -> None:
        spec = ArraySpec(
            inventory_index=0,
            level_index=0,
            role_index=0,
            level_id="TEST",
            role="test.role",
            relative_path="arrays/TEST/00-test.f64le",
            shape=(2,),
            element_count=2,
            byte_length=16,
        )
        raw = struct.pack("<dd", 1.25, -2.5)
        path = spec.relative_path.encode("utf-8")
        role = spec.role.encode("utf-8")
        expected = hashlib.sha256(
            ARRAY_SHA256_DOMAIN
            + len(path).to_bytes(8, "big")
            + path
            + len(role).to_bytes(8, "big")
            + role
            + len(raw).to_bytes(8, "big")
            + raw
        ).hexdigest()
        self.assertEqual(array_domain_sha256(spec, raw), expected)
        self.assertEqual(list(decode_finite_f64le(spec, raw)), [1.25, -2.5])
        with self.assertRaisesRegex(VerificationBlocked, "negative_zero_forbidden"):
            decode_finite_f64le(spec, struct.pack("<Qd", 0x8000000000000000, 1.0))
        with self.assertRaisesRegex(VerificationBlocked, "nonfinite_value_forbidden"):
            decode_finite_f64le(spec, struct.pack("<dd", math.inf, 1.0))

    def test_independent_barycentric_derivative_is_exact_for_quadratic(self) -> None:
        nodes = (0.0, 0.25, 0.75, 1.0)
        matrix = differentiation_matrix(nodes)
        values = tuple(node * node for node in nodes)
        derivative = [
            math.fsum(matrix[row][column] * values[column] for column in range(4))
            for row in range(4)
        ]
        for observed, node in zip(derivative, nodes):
            self.assertAlmostEqual(observed, 2.0 * node, places=13)

    def test_operator_regeneration_selects_indexed_angular_rule_and_endpoints(
        self,
    ) -> None:
        backend = _FakeMappedAngularBackend()
        frozen_levels = (("TEST", 2, 2),)
        with mock.patch.object(verifier_operators, "LEVELS", frozen_levels):
            operators = regenerate_level_operators(
                "TEST",
                (0.0, 1.0),
                (0.0, math.pi / 2.0),
                backend,  # type: ignore[arg-type]
            )
        self.assertEqual(backend.angular_calls, [(0, 2), (1, 2)])
        self.assertEqual(operators.theta_sine, (0.0, 1.0))
        self.assertEqual(operators.theta_cosine, (1.0, 0.0))
        self.assertEqual(operators.theta_cotangent, (None, 0.0))
        self.assertEqual(struct.pack("<d", operators.theta[0]), bytes(8))
        self.assertEqual(struct.pack("<d", operators.theta_sine[0]), bytes(8))
        self.assertEqual(struct.pack("<d", operators.theta_cosine[-1]), bytes(8))
        self.assertEqual(struct.pack("<d", operators.theta_cotangent[-1]), bytes(8))

        mismatched = _FakeMappedAngularBackend()
        with (
            mock.patch.object(verifier_operators, "LEVELS", frozen_levels),
            self.assertRaisesRegex(VerificationBlocked, "theta_grid_bit_mismatch"),
        ):
            regenerate_level_operators(
                "TEST",
                (0.0, 1.0),
                (0.0, math.nextafter(math.pi / 2.0, 0.0)),
                mismatched,  # type: ignore[arg-type]
            )

    def test_analytic_parity_legendre_modes_and_regular_endpoints(self) -> None:
        scalar_axis = _parity_legendre_angular_components(
            (1.0,), True, 1.0, 0.0, None, axis=True, equator=False
        )
        self.assertEqual(scalar_axis.value, 1.0)
        self.assertEqual(scalar_axis.theta_first, 0.0)
        self.assertEqual(scalar_axis.theta_second, -1.0)
        self.assertEqual(scalar_axis.cotangent_theta_first, -1.0)
        self.assertEqual(scalar_axis.laplacian, -2.0)

        scalar_equator = _parity_legendre_angular_components(
            (1.0,), True, 0.0, 1.0, 0.0, axis=False, equator=True
        )
        self.assertEqual(struct.pack("<d", scalar_equator.value), bytes(8))
        self.assertEqual(scalar_equator.theta_first, -1.0)
        self.assertEqual(struct.pack("<d", scalar_equator.theta_second), bytes(8))
        self.assertEqual(
            struct.pack("<d", scalar_equator.cotangent_theta_first), bytes(8)
        )
        self.assertEqual(struct.pack("<d", scalar_equator.laplacian), bytes(8))

        potential_axis = _parity_legendre_angular_components(
            (0.0, 1.0), False, 1.0, 0.0, None, axis=True, equator=False
        )
        self.assertEqual(potential_axis.value, 1.0)
        self.assertEqual(potential_axis.theta_first, 0.0)
        self.assertEqual(potential_axis.theta_second, -3.0)
        self.assertEqual(potential_axis.cotangent_theta_first, -3.0)
        self.assertEqual(potential_axis.laplacian, -6.0)

        potential_equator = _parity_legendre_angular_components(
            (0.0, 1.0), False, 0.0, 1.0, 0.0, axis=False, equator=True
        )
        self.assertEqual(potential_equator.value, -0.5)
        self.assertEqual(struct.pack("<d", potential_equator.theta_first), bytes(8))
        self.assertEqual(potential_equator.theta_second, 3.0)
        self.assertEqual(potential_equator.cotangent_theta_first, 0.0)
        self.assertEqual(potential_equator.laplacian, 3.0)

        sine = math.sqrt(0.75)
        potential_interior = _parity_legendre_angular_components(
            (0.0, 1.0),
            False,
            0.5,
            sine,
            0.5 / sine,
            axis=False,
            equator=False,
        )
        self.assertEqual(potential_interior.value, -0.125)
        self.assertAlmostEqual(
            potential_interior.theta_second
            + potential_interior.cotangent_theta_first,
            potential_interior.laplacian,
            places=14,
        )
        self.assertEqual(potential_interior.laplacian, 0.75)

        scalar_p1 = _parity_legendre_angular_components(
            (1.0, 0.0),
            True,
            0.5,
            sine,
            0.5 / sine,
            axis=False,
            equator=False,
        )
        scalar_p3 = _parity_legendre_angular_components(
            (0.0, 1.0),
            True,
            0.5,
            sine,
            0.5 / sine,
            axis=False,
            equator=False,
        )
        self.assertEqual(scalar_p1.value, 0.5)
        self.assertEqual(scalar_p3.value, -0.4375)

    def test_symbolic_positive_zero_counts_and_negative_zero_rejection(self) -> None:
        self.assertEqual(PROJECTED_NODAL_POSITIVE_ZERO_COUNT, 10_816)
        self.assertEqual(PROJECTED_MULTIPOLE_POSITIVE_ZERO_COUNT, 408)
        self.assertEqual(PROJECTED_POSITIVE_ZERO_COUNT, 11_224)
        self.assertEqual(_count_positive_zero_violations((0.0,), (0,)), 0)
        self.assertEqual(_count_positive_zero_violations((-0.0,), (0,)), 1)
        self.assertEqual(_count_positive_zero_violations((1.0,), (0,)), 1)

    def test_diagnostic_convergence_rule_never_promotes_success(self) -> None:
        converged = _convergence_metrics_from_differences(4.0e-9, 1.0e-9)
        self.assertEqual(converged.difference_ratio, 4.0)
        self.assertTrue(converged.diagnostic_within_rails)
        self.assertIsNone(converged.passed)

        exact = _convergence_metrics_from_differences(0.0, 0.0)
        self.assertEqual(exact.difference_ratio, 0.0)
        self.assertTrue(exact.diagnostic_within_rails)
        self.assertIsNone(exact.passed)

        low_order = _convergence_metrics_from_differences(3.0e-9, 1.0e-9)
        self.assertFalse(low_order.diagnostic_within_rails)
        self.assertIs(low_order.passed, False)
        too_large = _convergence_metrics_from_differences(1.0e-7, 2.0e-8)
        self.assertFalse(too_large.diagnostic_within_rails)
        self.assertIs(too_large.passed, False)
        self.assertIsNone(_diagnostic_pass_state(True))
        self.assertIs(_diagnostic_pass_state(False), False)

    def test_audit_interior_source_prefix_detects_corruption_and_ignores_tail(self) -> None:
        source = _synthetic_operators("L2_TEST", (0.0, 1.0), (1.0, 0.5, 0.0))
        audit = _synthetic_operators(
            "AUDIT_TEST", (0.0, 0.5, 1.0), (1.0, 0.5, 0.0)
        )
        source_scalar_multipoles = (0.0, 0.0, 1.0, 0.0)
        audit_scalar = (
            0.0,
            0.0,
            0.0,
            0.5,
            0.25,
            0.0,
            123.0,
            -456.0,
            789.0,
        )
        defect, norm = _diagnostic_parity_source_difference(
            source_scalar_multipoles,
            audit_scalar,
            source,
            audit,
            True,
            0.75,
        )
        self.assertEqual(defect, 0.0)
        self.assertEqual(norm, 0.5)

        corrupted = list(audit_scalar)
        corrupted[4] = math.nextafter(corrupted[4], math.inf)
        corrupted_defect, _ = _diagnostic_parity_source_difference(
            source_scalar_multipoles,
            corrupted,
            source,
            audit,
            True,
            0.75,
        )
        self.assertGreater(corrupted_defect, 0.0)

        wrong_parity_defect, _ = _diagnostic_parity_source_difference(
            source_scalar_multipoles,
            audit_scalar,
            source,
            audit,
            False,
            0.75,
        )
        self.assertGreater(wrong_parity_defect, 0.0)

    def test_modal_diagnostics_remain_blocked_from_authority(self) -> None:
        blocker_codes = {
            item.code for item in verifier_operators._INCOMPLETE_GATE_BLOCKERS
        }
        self.assertIn("numeric_materialization_policy_absent", blocker_codes)
        self.assertIn(
            "bitwise_mpfr_nodal_resampling_replay_not_implemented", blocker_codes
        )
        source = inspect.getsource(verifier_operators._normalized_residuals)
        self.assertIn(".laplacian", source)
        self.assertNotIn("angular_first", source)
        self.assertNotIn("angular_second", source)

    def test_run_request_is_canonical_and_static_target_bound(self) -> None:
        value = _run_request_value()
        raw = _canonical(value)
        request = parse_run_request_bytes(raw)
        self.assertEqual(request.canonical_bytes, raw)
        self.assertEqual(
            request.binding["sha256"],
            hashlib.sha256(
                b"nhm2-prolate-boson-star-newtonian-seed-run-request/v1\n" + raw
            ).hexdigest(),
        )
        with self.assertRaisesRegex(VerificationBlocked, "noncanonical_json"):
            parse_run_request_bytes(json.dumps(value, indent=2).encode("utf-8"))
        wrong = _run_request_value()
        wrong_binding = dict(wrong["seedContractBinding"])
        wrong_binding["sha256"] = "0" * 64
        wrong["seedContractBinding"] = wrong_binding
        with self.assertRaisesRegex(VerificationBlocked, "static_binding_mismatch"):
            parse_run_request_bytes(_canonical(wrong))

    def test_run_request_rejects_swapped_oversize_and_duplicate_profiles(self) -> None:
        swapped = _run_request_value()
        swapped["verifierSourceLedgerBinding"], swapped["producerSourceLedgerBinding"] = (
            swapped["producerSourceLedgerBinding"],
            swapped["verifierSourceLedgerBinding"],
        )
        with self.assertRaisesRegex(
            VerificationBlocked, "binding_profile_or_value_invalid"
        ):
            parse_run_request_bytes(_canonical(swapped))

        arbitrary_domain = _run_request_value()
        runtime = dict(arbitrary_domain["verifierMpfrGmpRuntimeBinding"])
        runtime["sha256Domain"] = "nhm2.test.arbitrary-domain/v1\n"
        arbitrary_domain["verifierMpfrGmpRuntimeBinding"] = runtime
        with self.assertRaisesRegex(
            VerificationBlocked, "binding_profile_or_value_invalid"
        ):
            parse_run_request_bytes(_canonical(arbitrary_domain))

        oversize = _run_request_value()
        capability = dict(oversize["isolatedWorkerCapabilityBinding"])
        capability["canonicalSizeBytes"] = (
            DYNAMIC_RUN_REQUEST_BINDING_MAXIMUM_BYTES[
                "isolatedWorkerCapabilityBinding"
            ]
            + 1
        )
        oversize["isolatedWorkerCapabilityBinding"] = capability
        with self.assertRaisesRegex(
            VerificationBlocked, "binding_profile_or_value_invalid"
        ):
            parse_run_request_bytes(_canonical(oversize))

        unsafe = _run_request_value()
        lease = dict(unsafe["schedulerLeaseBinding"])
        lease["canonicalSizeBytes"] = 2**53
        unsafe["schedulerLeaseBinding"] = lease
        with self.assertRaisesRegex(
            VerificationBlocked, "binding_profile_or_value_invalid"
        ):
            parse_run_request_bytes(_canonical(unsafe))

        duplicate = _run_request_value()
        producer = dict(duplicate["producerSourceLedgerBinding"])
        verifier = dict(duplicate["verifierSourceLedgerBinding"])
        verifier["sha256"] = producer["sha256"]
        duplicate["verifierSourceLedgerBinding"] = verifier
        with self.assertRaisesRegex(
            VerificationBlocked, "pairwise_distinct_stage_bindings_required"
        ):
            parse_run_request_bytes(_canonical(duplicate))

    def test_proof_kernel_never_fabricates_a_receipt(self) -> None:
        value = _run_request_value()
        raw = _canonical(value)
        request = RunRequest(
            value=value,
            canonical_bytes=raw,
            binding={
                "bindingVersion": "nhm2.control_plane.domain_hash_binding/v1",
                "artifactKind": "nhm2.prolate_boson_star.newtonian_seed.run_request",
                "sha256Domain": (
                    "nhm2-prolate-boson-star-newtonian-seed-run-request/v1\n"
                ),
                "sha256": hashlib.sha256(raw).hexdigest(),
                "canonicalSizeBytes": len(raw),
            },
        )
        attempt = attempt_required_proof_replays(
            _FakeDirectedBackend(), request, [object()] * 32  # type: ignore[arg-type]
        )
        self.assertTrue(attempt.directed_rounding_self_test_passed)
        self.assertFalse(attempt.all_receipts_complete)
        self.assertIsNone(attempt.continuous_nodeless_receipt)
        self.assertIsNone(attempt.continuous_peak_receipt)
        self.assertIsNone(attempt.numerical_origin_series_defect_receipt)
        self.assertGreaterEqual(len(attempt.blockers), 5)

    def test_bundle_emitter_is_unconditionally_locked(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "seed-verifier-replay-bundle.canonical.json"
            with self.assertRaisesRegex(
                VerificationBlocked, "emission_disabled_in_incomplete_verifier"
            ):
                emit_replay_bundle(target, {"allPassed": True})
            self.assertFalse(target.exists())
        self.assertTrue(all(value is False for value in AUTHORITY_LOCKS.values()))
        self.assertIs(AUTHORITY_LOCKS["transportClaimAllowed"], False)

    def test_operational_entrypoint_blocker_leaves_replay_root_empty(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            replay_root = root / "replay"
            replay_root.mkdir()
            request_path = str(root / "00-seed-run-request.v1.json")
            staging_root = str(root / "staging")
            replay_path = str(replay_root / "seed-verifier-replay-bundle.canonical.json")
            with (
                mock.patch.object(verifier_runtime, "RUN_REQUEST_PATH", request_path),
                mock.patch.object(verifier_runtime, "STAGING_ROOT", staging_root),
                mock.patch.object(verifier_runtime, "REPLAY_BUNDLE_PATH", replay_path),
                mock.patch.object(verifier_runtime.sys, "platform", "linux"),
                mock.patch.object(
                    verifier_runtime.os,
                    "uname",
                    create=True,
                    return_value=mock.Mock(machine="x86_64"),
                ),
                mock.patch.object(
                    verifier_runtime,
                    "read_run_request",
                    return_value=mock.sentinel.sealed_request,
                ),
            ):
                with self.assertRaisesRegex(
                    VerificationBlocked, "cross_field_instance_replay_unavailable"
                ):
                    verifier_runtime.run_fail_closed_verifier(
                        request_path, staging_root, replay_path
                    )
            self.assertEqual(list(replay_root.iterdir()), [])

    def test_default_host_has_no_mpfr_fallback(self) -> None:
        exact_runtime_present = (
            sys.platform == "linux"
            and Path(GMP_LIBRARY_PATH).is_file()
            and Path(MPFR_LIBRARY_PATH).is_file()
        )
        if exact_runtime_present:
            self.skipTest("exact frozen Linux runtime is present")
        with self.assertRaises(VerificationBlocked):
            MpfrBackend.load_frozen()

    def test_frozen_invocation_and_no_forbidden_imports(self) -> None:
        self.assertEqual(
            EXPECTED_EXECUTABLE,
            "/opt/nhm2-verifier/toolchain/python/bin/python3",
        )
        self.assertEqual(EXPECTED_WORKING_DIRECTORY, "/run/replay")
        self.assertEqual(
            EXPECTED_INITIAL_SYS_PATH,
            (
                "/opt/nhm2-verifier/toolchain/python/lib/python313.zip",
                "/opt/nhm2-verifier/toolchain/python/lib/python3.13",
                "/opt/nhm2-verifier/toolchain/python/lib/python3.13/lib-dynload",
            ),
        )
        self.assertEqual(EXPECTED_RUNTIME_SYS_PATH[0], "/opt/nhm2-verifier/source")
        self.assertEqual(
            EXPECTED_ARGV,
            (
                "--input-manifest",
                "/run/input/00-seed-run-request.v1.json",
                "--numeric-materialization-policy",
                "/run/input/08-numeric-materialization-policy-v1.canonical.json",
                "--postprojection-policy",
                "/run/input/09-postprojection-policy-v1.canonical.json",
                "--staging-root",
                "/run/staging",
                "--postprojection-evidence-root",
                "/run/postprojection-evidence",
                "--replay-bundle",
                REPLAY_BUNDLE_PATH,
                "--broker-runtime-evidence",
                "/run/broker-channel/verifier-runtime-evidence.v3.canonical.json",
            ),
        )
        self.assertEqual(EXPECTED_ENVIRONMENT["OMP_NUM_THREADS"], "1")
        verifier_root = Path(__file__).resolve().parent
        forbidden_roots = {
            "producer",
            "assembler",
            "subprocess",
            "socket",
            "requests",
            "urllib",
        }
        for source_path in verifier_root.glob("*.py"):
            tree = ast.parse(source_path.read_text(encoding="utf-8"), source_path.name)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    roots = {alias.name.split(".", 1)[0] for alias in node.names}
                elif isinstance(node, ast.ImportFrom):
                    roots = {(node.module or "").split(".", 1)[0]}
                else:
                    continue
                self.assertTrue(
                    roots.isdisjoint(forbidden_roots),
                    f"forbidden import in {source_path.name}: {sorted(roots)}",
                )


if __name__ == "__main__":
    unittest.main()
