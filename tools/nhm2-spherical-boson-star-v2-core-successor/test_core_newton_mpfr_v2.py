from __future__ import annotations

import ast
from dataclasses import FrozenInstanceError
import hashlib
import importlib.util
import inspect
import json
from pathlib import Path
import struct
import sys
import unittest

import gmpy2


HERE = Path(__file__).resolve().parent
SOURCE_PATH = HERE / "core_newton_mpfr_v2.py"
REPOSITORY = HERE.parents[1]
PROPOSAL_PATH = (
    REPOSITORY
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-equilibrated-mpfr-core-successor-proposal.md"
)


def _load_module():
    spec = importlib.util.spec_from_file_location(
        "_nhm2_core_newton_mpfr_v2_test_target", SOURCE_PATH
    )
    if spec is None or spec.loader is None:
        raise AssertionError("module spec unavailable")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


MODULE = _load_module()


class _Hostile:
    def __init__(self) -> None:
        object.__setattr__(self, "reads", 0)

    def __getattribute__(self, name: str):
        if name == "reads":
            return object.__getattribute__(self, name)
        object.__setattr__(
            self, "reads", object.__getattribute__(self, "reads") + 1
        )
        raise AssertionError(name)


class CoreNewtonMpfrV2Tests(unittest.TestCase):
    def test_preregistered_proposal_binding_is_exact(self) -> None:
        payload = PROPOSAL_PATH.read_bytes()
        self.assertEqual(len(payload), MODULE.PROPOSAL_SIZE_BYTES)
        self.assertEqual(hashlib.sha256(payload).hexdigest(), MODULE.PROPOSAL_SHA256)
        self.assertEqual(
            MODULE.SUCCESSOR_VERSION,
            "nhm2_spherical_boson_star_v2_frozen_core_newton/v2",
        )
        self.assertEqual(MODULE.NODE_COUNT, 64)
        self.assertEqual(MODULE.ORDER, 129)

    def test_frozen_rules_do_not_relax_predecessor_gates(self) -> None:
        self.assertEqual(MODULE.MAXIMUM_ACCEPTED_UPDATES, 48)
        self.assertEqual(MODULE.BACKTRACK_TRIAL_COUNT, 25)
        self.assertEqual(MODULE.ARMIJO_C_EXPONENT, -12)
        self.assertEqual(MODULE.EQUATION_THRESHOLD_EXPONENT, -40)
        self.assertEqual(MODULE.STEP_THRESHOLD_EXPONENT, -42)
        self.assertEqual(MODULE.CONSECUTIVE_REQUIRED, 2)
        self.assertEqual(MODULE.MPFR_PRECISION_BITS, 256)

    def test_binary64_lift_is_exact_for_fixed_words(self) -> None:
        words = (
            "0000000000000000",
            "8000000000000000",
            "3ff0000000000000",
            "bfc0000000000000",
            "0010000000000000",
            "7fefffffffffffff",
        )
        with MODULE._owned_context():
            for word in words:
                value = struct.unpack(">d", bytes.fromhex(word))[0]
                lifted = MODULE._lift_f64(value)
                numerator, denominator = value.as_integer_ratio()
                self.assertEqual(
                    lifted,
                    gmpy2.mpfr(gmpy2.mpq(numerator, denominator)),
                )

    def test_canonical_mpfr_encoding_is_exact_and_normalized(self) -> None:
        with MODULE._owned_context():
            self.assertEqual(MODULE._encode_mpfr(gmpy2.mpfr(0)), "0:0:0:256:C")
            self.assertEqual(MODULE._encode_mpfr(gmpy2.mpfr("1.5")), "1:3:-1:256:C")
            self.assertEqual(MODULE._encode_mpfr(gmpy2.mpfr("-0.25")), "-1:1:-2:256:C")

    def test_equilibrated_dense_solve_closes_a_known_system(self) -> None:
        with MODULE._owned_context() as context:
            matrix = [
                [gmpy2.mpfr(2), gmpy2.mpfr(1)],
                [gmpy2.mpfr(1), gmpy2.mpfr(3)],
            ]
            residual = [gmpy2.mpfr(-1), gmpy2.mpfr(-2)]
            direction, row_span, column_span = MODULE._solve_equilibrated(
                matrix, residual
            )
            self.assertLess(
                abs(direction[0] - gmpy2.mpfr("0.2")), gmpy2.mpfr(2) ** -250
            )
            self.assertLess(
                abs(direction[1] - gmpy2.mpfr("0.6")), gmpy2.mpfr(2) ** -250
            )
            self.assertEqual(row_span, gmpy2.mpfr("1.5"))
            self.assertEqual(column_span, gmpy2.mpfr(1))
            MODULE._check_flags(context, "synthetic_solve")

    def test_comparison_wire_has_exact_schema_and_word_count(self) -> None:
        with MODULE._owned_context():
            state = [gmpy2.mpfr(index) for index in range(MODULE.ORDER)]
            wire, digest = MODULE._comparison(state)
        parsed = json.loads(wire)
        self.assertEqual(
            tuple(parsed),
            (
                "comparisonVersion",
                "nodeCount",
                "projectedStateF64BeWordHex",
            ),
        )
        self.assertEqual(parsed["nodeCount"], 64)
        self.assertEqual(len(parsed["projectedStateF64BeWordHex"]), 129)
        self.assertEqual(len(digest), 64)
        self.assertEqual(json.dumps(parsed, separators=(",", ":")), wire)

    def test_public_entry_is_zero_argument_and_does_not_traverse_extras(self) -> None:
        self.assertEqual(
            str(inspect.signature(MODULE.run_frozen_n64_successor)),
            "() -> 'FrozenMpfrCoreSuccessorResult'",
        )
        hostile = _Hostile()
        with self.assertRaises(TypeError):
            MODULE.run_frozen_n64_successor(hostile)
        self.assertEqual(hostile.reads, 0)

    def test_result_is_frozen_and_every_authority_default_is_false(self) -> None:
        fields = {
            "status": "FAIL",
            "failure_code": "synthetic",
            "accepted_update_count": 0,
            "dense_solve_count": 0,
            "full_evaluation_count": 0,
            "trial_attempt_count": 0,
            "residual_only_evaluation_count": 0,
            "accepted_alpha_exponents": (),
            "accepted_updates": (),
            "current_state_sha256": "0" * 64,
            "current_residual_sha256": "1" * 64,
            "projected_state_sha256": None,
            "projected_residual_sha256": None,
            "comparison_wire": None,
            "comparison_sha256": None,
            "raw_equation_linf": "0:0:0:256:C",
            "scaled_step_linf": None,
            "projection_raw_equation_linf": None,
            "predecessor_failure_receipt_sha256": "2" * 64,
            "proposal_sha256": "3" * 64,
            "proposal_size_bytes": 1,
            "spectral_source_sha256": "4" * 64,
            "initializer_source_sha256": "5" * 64,
            "gmpy2_extension_sha256": "6" * 64,
            "mpfr_dll_sha256": "7" * 64,
            "gmp_dll_sha256": "8" * 64,
            "observed_gmpy2_version": "synthetic",
            "observed_mpfr_version": "synthetic",
            "numerical_go": False,
        }
        result = MODULE.FrozenMpfrCoreSuccessorResult(**fields)
        for name in (
            "predecessor_reinterpreted",
            "retry_allowed",
            "retune_allowed",
            "alternate_initializer_used",
            "source_disjoint_agreement",
            "runtime_disjoint_independent_replay",
            "candidate_execution_authorized",
            "candidate_executed",
            "candidate_output_materialized",
            "output_present",
            "output_accepted",
            "branch_accepted",
            "replay_authority",
            "diagnostic_pass_authority",
            "theory_graph_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
        ):
            self.assertIs(getattr(result, name), False, name)
        with self.assertRaises(FrozenInstanceError):
            result.status = "GO"

    def test_static_surface_has_no_io_launch_or_predecessor_solver_import(self) -> None:
        source = SOURCE_PATH.read_text(encoding="utf-8")
        tree = ast.parse(source)
        imported = {
            alias.name
            for node in ast.walk(tree)
            if isinstance(node, ast.Import)
            for alias in node.names
        }
        imported.update(
            node.module or ""
            for node in ast.walk(tree)
            if isinstance(node, ast.ImportFrom)
        )
        self.assertFalse(
            imported
            & {
                "subprocess",
                "socket",
                "requests",
                "urllib",
                "core_newton",
                "core_operator",
                "dense_lu",
            }
        )
        self.assertNotIn("write_bytes", source)
        self.assertNotIn("write_text", source)
        self.assertNotIn("open(", source)
        self.assertNotIn("N=96", source)
        self.assertNotIn("N=128", source)
        self.assertNotIn("N=256", source)


if __name__ == "__main__":
    unittest.main()
