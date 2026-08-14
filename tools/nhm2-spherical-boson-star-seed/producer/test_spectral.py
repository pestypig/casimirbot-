from __future__ import annotations

import ast
from dataclasses import FrozenInstanceError
import hashlib
import json
import math
import os
from pathlib import Path
import struct
import subprocess
import sys
import unittest

import gmpy2


HERE = Path(__file__).resolve().parent
REPOSITORY_ROOT = HERE.parents[2]
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from spectral import (  # noqa: E402
    ADMITTED_NODE_COUNTS,
    AUTHORITY_LOCKS,
    FIRST_DERIVATIVE_OPERATION_GRAPH,
    MPFR_EMAX,
    MPFR_EMIN,
    MPFR_PRECISION_BITS,
    MPFR_ROUNDING_MODE,
    NODE_OPERATION_GRAPH,
    PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES,
    PRIMARY_NUMERICS_POLICY_SHA256,
    SECOND_DERIVATIVE_OPERATION_GRAPH,
    SpectralPrimitiveError,
    generate_lobatto_spectral_primitive,
)


GOLDEN_HASH_DOMAIN = (
    b"nhm2-spherical-boson-star-seed-primary-spectral/golden/v1\n"
)
GOLDEN_HASHES = {
    64: "83f63880c10f9aafae4d3c173cbb11fabd1baecf1a67c29c3b3f75636536a680",
    96: "33a584aeacfaa92b0fc2bf642ed6e8f5a2ab67f5692d0a37c056e510aa35b8e3",
    128: "9997d1ede86739b4716d838f287f5aaca27edba3fb52748ad0ac48a6e62f7c45",
    256: "a3c9bf8713593783d7bb590b6831e7786350ae043780142765032a02ffd5551f",
}


def _u64le(value: int) -> bytes:
    return value.to_bytes(8, "little", signed=False)


def _negative_zero(value: float) -> bool:
    return value == 0.0 and struct.pack("<d", value) == bytes.fromhex(
        "0000000000000080"
    )


def _flatten(rows: tuple[tuple[float, ...], ...]) -> tuple[float, ...]:
    return tuple(value for row in rows for value in row)


def _golden_hash(result: object) -> str:
    node_count = result.node_count  # type: ignore[attr-defined]
    sequences = (
        (b"rho", result.rho),  # type: ignore[attr-defined]
        (b"barycentric_weights", result.barycentric_weights),  # type: ignore[attr-defined]
        (
            b"first_derivative_row_major",
            _flatten(result.first_derivative),  # type: ignore[attr-defined]
        ),
        (
            b"second_derivative_row_major",
            _flatten(result.second_derivative),  # type: ignore[attr-defined]
        ),
    )
    digest = hashlib.sha256()
    digest.update(GOLDEN_HASH_DOMAIN)
    digest.update(_u64le(node_count))
    for label, values in sequences:
        digest.update(_u64le(len(label)))
        digest.update(label)
        digest.update(_u64le(len(values)))
        digest.update(struct.pack(f"<{len(values)}d", *values))
    return digest.hexdigest()


class PrimarySpectralPrimitiveTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.results = {
            count: generate_lobatto_spectral_primitive(count)
            for count in ADMITTED_NODE_COUNTS
        }

    def test_literal_policy_binding_matches_the_live_semantic_seal(self) -> None:
        executable = "npx.cmd" if os.name == "nt" else "npx"
        program = (
            "import {"
            "NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256 as h,"
            "NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES as s"
            "} from './shared/contracts/nhm2-spherical-boson-star-newtonian-seed-primary-numerics.v1.ts';"
            "console.log(JSON.stringify({h,s}));"
        )
        completed = subprocess.run(
            [executable, "tsx", "-e", program],
            cwd=REPOSITORY_ROOT,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=30,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        live = json.loads(completed.stdout)
        self.assertEqual(live["h"], PRIMARY_NUMERICS_POLICY_SHA256)
        self.assertEqual(
            live["s"], PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        )
        self.assertEqual(
            (PRIMARY_NUMERICS_POLICY_SHA256, PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES),
            (
                "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4",
                80_055,
            ),
        )

    def test_dimensions_order_finiteness_and_positive_zero_are_exact(self) -> None:
        for count, result in self.results.items():
            with self.subTest(count=count):
                self.assertEqual(result.node_count, count)
                self.assertEqual(len(result.rho), count)
                self.assertEqual(len(result.barycentric_weights), count)
                self.assertEqual(len(result.first_derivative), count)
                self.assertEqual(len(result.second_derivative), count)
                self.assertTrue(
                    all(len(row) == count for row in result.first_derivative)
                )
                self.assertTrue(
                    all(len(row) == count for row in result.second_derivative)
                )
                self.assertEqual(struct.pack("<d", result.rho[0]), bytes(8))
                self.assertEqual(result.rho[-1], 1.0)
                self.assertTrue(
                    all(
                        result.rho[index] > result.rho[index - 1]
                        for index in range(1, count)
                    )
                )
                self.assertEqual(result.barycentric_weights[0], 0.5)
                self.assertEqual(result.barycentric_weights[1], -1.0)
                self.assertEqual(result.barycentric_weights[2], 1.0)
                self.assertEqual(result.barycentric_weights[-1], -0.5)
                values = (
                    *result.rho,
                    *result.barycentric_weights,
                    *_flatten(result.first_derivative),
                    *_flatten(result.second_derivative),
                )
                self.assertTrue(all(math.isfinite(value) for value in values))
                self.assertFalse(any(_negative_zero(value) for value in values))

    def test_complete_row_major_numeric_surfaces_match_literal_hashes(self) -> None:
        self.assertEqual(set(GOLDEN_HASHES), set(ADMITTED_NODE_COUNTS))
        for count, expected in GOLDEN_HASHES.items():
            with self.subTest(count=count):
                self.assertEqual(_golden_hash(self.results[count]), expected)

    def test_operation_graph_and_owned_context_are_frozen(self) -> None:
        self.assertEqual(ADMITTED_NODE_COUNTS, (64, 96, 128, 256))
        self.assertEqual(MPFR_PRECISION_BITS, 256)
        self.assertEqual(MPFR_ROUNDING_MODE, "MPFR_RNDN")
        self.assertEqual((MPFR_EMIN, MPFR_EMAX), (-1_000_000, 1_000_000))
        self.assertIn("one_get_d_RNDN_per_node", NODE_OPERATION_GRAPH)
        self.assertIn("all_offdiagonal_i_then_j", FIRST_DERIVATIVE_OPERATION_GRAPH)
        self.assertIn("complete_unrounded_D", FIRST_DERIVATIVE_OPERATION_GRAPH)
        self.assertIn("unrounded_D_i_k", SECOND_DERIVATIVE_OPERATION_GRAPH)
        self.assertIn("immediately_for_that_entry", SECOND_DERIVATIVE_OPERATION_GRAPH)

    def test_hostile_ambient_mpfr_context_is_ignored_and_restored(self) -> None:
        baseline = self.results[64]
        ambient = gmpy2.get_context()
        original = ambient.copy()
        try:
            ambient.precision = 19
            ambient.round = gmpy2.RoundDown
            ambient.emin = -20
            ambient.emax = 20
            ambient.subnormalize = True
            ambient.trap_inexact = True
            ambient.trap_underflow = True
            ambient.inexact = True
            observed = generate_lobatto_spectral_primitive(64)
            self.assertEqual(_golden_hash(observed), _golden_hash(baseline))
            self.assertEqual(ambient.precision, 19)
            self.assertEqual(ambient.round, gmpy2.RoundDown)
            self.assertEqual(ambient.emin, -20)
            self.assertEqual(ambient.emax, 20)
            self.assertIs(ambient.subnormalize, True)
            self.assertIs(ambient.trap_inexact, True)
            self.assertIs(ambient.trap_underflow, True)
            self.assertIs(ambient.inexact, True)
        finally:
            gmpy2.set_context(original)

    def test_binding_count_and_type_failures_are_typed_and_pre_numeric(self) -> None:
        cases = (
            (True, {}, "spectral_node_count_invalid"),
            (63, {}, "spectral_node_count_invalid"),
            (64.0, {}, "spectral_node_count_invalid"),
            (
                64,
                {"primary_numerics_policy_sha256": "0" * 64},
                "primary_numerics_policy_binding_mismatch",
            ),
            (
                64,
                {"primary_numerics_policy_canonical_size_bytes": True},
                "primary_numerics_policy_binding_mismatch",
            ),
            (
                64,
                {"primary_numerics_policy_canonical_size_bytes": 80_054},
                "primary_numerics_policy_binding_mismatch",
            ),
        )
        for node_count, kwargs, expected_code in cases:
            with self.subTest(node_count=node_count, kwargs=kwargs):
                with self.assertRaises(SpectralPrimitiveError) as raised:
                    generate_lobatto_spectral_primitive(node_count, **kwargs)  # type: ignore[arg-type]
                self.assertEqual(raised.exception.code, expected_code)

    def test_results_are_frozen_and_all_authority_surfaces_remain_false(self) -> None:
        result = self.results[64]
        self.assertEqual(
            result.primary_numerics_policy_sha256,
            PRIMARY_NUMERICS_POLICY_SHA256,
        )
        self.assertEqual(
            result.primary_numerics_policy_canonical_size_bytes,
            PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES,
        )
        for field in (
            "primary_numerics_semantic_authority",
            "implementation_closure_complete",
            "runtime_closure_complete",
            "node_count_selected_for_candidate",
            "gauss_legendre_fixture_bound",
            "source_manifest_bound",
            "toolchain_manifest_bound",
            "executable_bound",
            "runtime_manifest_bound",
            "scientific_preseal_present",
            "candidate_execution_authorized",
            "candidate_executed",
            "output_present",
            "output_accepted",
            "candidate_output_materialized",
            "seed_accepted",
            "branch_accepted",
            "nondegeneracy_accepted",
            "replay_authority",
            "independent_agreement",
            "diagnostic_pass_authority",
            "candidate_authority",
            "theory_graph_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
        ):
            self.assertIs(getattr(result, field), False)
        self.assertTrue(all(value is False for value in AUTHORITY_LOCKS.values()))
        with self.assertRaises(FrozenInstanceError):
            result.candidate_executed = True  # type: ignore[misc]

    def test_source_has_no_forbidden_numeric_dependency_or_solver_surface(self) -> None:
        source = (HERE / "spectral.py").read_text(encoding="utf-8")
        tree = ast.parse(source)
        imported_roots: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imported_roots.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module is not None:
                imported_roots.add(node.module.split(".")[0])
        self.assertFalse(imported_roots & {"decimal", "numpy", "scipy"})
        for forbidden in (
            "import numpy",
            "import scipy",
            "from decimal",
            "np.",
            "numpy.",
            "scipy.",
        ):
            self.assertNotIn(forbidden, source)
        self.assertNotIn("solve(", source)


if __name__ == "__main__":
    unittest.main()
