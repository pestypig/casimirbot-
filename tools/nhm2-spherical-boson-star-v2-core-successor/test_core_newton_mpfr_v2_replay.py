from __future__ import annotations

import ast
from dataclasses import FrozenInstanceError
import hashlib
import importlib.util
import inspect
from pathlib import Path
import sys
import unittest

import gmpy2


HERE = Path(__file__).resolve().parent
REPLAY_PATH = HERE / "core_newton_mpfr_v2_replay.py"
PRIMARY_PATH = HERE / "core_newton_mpfr_v2.py"
PROPOSAL_PATH = (
    HERE.parents[1]
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-equilibrated-mpfr-core-successor-proposal.md"
)


def _load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise AssertionError(name)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


REPLAY = _load("_nhm2_mpfr_v2_replay_test_target", REPLAY_PATH)
PRIMARY = _load("_nhm2_mpfr_v2_primary_comparison_fixture", PRIMARY_PATH)


class _Trap:
    def __init__(self) -> None:
        object.__setattr__(self, "reads", 0)

    def __getattribute__(self, name: str):
        if name == "reads":
            return object.__getattribute__(self, name)
        object.__setattr__(
            self, "reads", object.__getattribute__(self, "reads") + 1
        )
        raise AssertionError(name)


class CoreNewtonMpfrV2ReplayTests(unittest.TestCase):
    def test_proposal_and_versions_are_exact(self) -> None:
        payload = PROPOSAL_PATH.read_bytes()
        self.assertEqual(len(payload), REPLAY.PROPOSAL_SIZE_BYTES)
        self.assertEqual(hashlib.sha256(payload).hexdigest(), REPLAY.PROPOSAL_SHA256)
        self.assertEqual(
            REPLAY.REPLAY_VERSION,
            "nhm2_spherical_boson_star_v2_frozen_core_newton_replay/v2",
        )
        self.assertEqual(REPLAY.PRECISION_BITS, 256)
        self.assertEqual(REPLAY.MAXIMUM_UPDATES, 48)
        self.assertEqual(REPLAY.TRIAL_COUNT, 25)

    def test_independent_encoder_matches_preregistered_comparison(self) -> None:
        with REPLAY._context():
            values = [gmpy2.mpfr(index) / 7 for index in range(REPLAY.ORDER)]
            replay_wire, replay_hash = REPLAY._comparison(values)
            primary_wire, primary_hash = PRIMARY._comparison(values)
        self.assertEqual(replay_wire, primary_wire)
        self.assertEqual(replay_hash, primary_hash)

    def test_gauss_jordan_equilibrated_path_closes_diagonal_system(self) -> None:
        with REPLAY._context() as context:
            matrix = [
                [
                    gmpy2.mpfr(row + 1) if row == column else gmpy2.mpfr(0)
                    for column in range(REPLAY.ORDER)
                ]
                for row in range(REPLAY.ORDER)
            ]
            residual = [gmpy2.mpfr(-(index + 1)) for index in range(REPLAY.ORDER)]
            direction, row_span, column_span = REPLAY._inverse_equilibrated(
                matrix, residual
            )
            self.assertTrue(all(value == 1 for value in direction))
            self.assertEqual(row_span, REPLAY.ORDER)
            self.assertEqual(column_span, 1)
            REPLAY._flags(context, "synthetic_diagonal")

    def test_public_entry_is_exactly_zero_argument(self) -> None:
        self.assertEqual(
            str(inspect.signature(REPLAY.replay_frozen_n64_successor)),
            "() -> 'FrozenMpfrCoreReplayResult'",
        )
        trap = _Trap()
        with self.assertRaises(TypeError):
            REPLAY.replay_frozen_n64_successor(trap)
        self.assertEqual(trap.reads, 0)

    def test_replay_receipt_defaults_preserve_all_locks(self) -> None:
        result = REPLAY.FrozenMpfrCoreReplayResult(
            status="FAIL",
            failure_code="synthetic",
            updates=(),
            dense_solve_count=0,
            full_evaluation_count=0,
            trial_attempt_count=0,
            current_state_sha256="0" * 64,
            current_residual_sha256="1" * 64,
            projected_state_sha256=None,
            projected_residual_sha256=None,
            comparison_wire=None,
            comparison_sha256=None,
            raw_equation_linf="0:0:0:256:C",
            projection_raw_equation_linf=None,
            numerical_go=False,
        )
        self.assertIs(result.source_disjoint_from_primary, True)
        for name in (
            "runtime_disjoint_independent_replay",
            "retry_allowed",
            "retune_allowed",
            "candidate_execution_authorized",
            "candidate_executed",
            "output_present",
            "replay_authority",
            "theory_graph_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
        ):
            self.assertIs(getattr(result, name), False, name)
        with self.assertRaises(FrozenInstanceError):
            result.status = "GO"

    def test_replay_source_does_not_import_or_read_primary(self) -> None:
        source = REPLAY_PATH.read_text(encoding="utf-8")
        tree = ast.parse(source)
        imports = {
            alias.name
            for node in ast.walk(tree)
            if isinstance(node, ast.Import)
            for alias in node.names
        }
        imports.update(
            node.module or ""
            for node in ast.walk(tree)
            if isinstance(node, ast.ImportFrom)
        )
        self.assertNotIn("core_newton_mpfr_v2", imports)
        self.assertNotIn("core_newton", imports)
        self.assertNotIn("core_operator", imports)
        self.assertNotIn("dense_lu", imports)
        self.assertNotIn("core_newton_mpfr_v2.py", source)
        self.assertNotIn("write_bytes", source)
        self.assertNotIn("write_text", source)
        self.assertNotIn("subprocess", imports)
        self.assertNotIn("socket", imports)


if __name__ == "__main__":
    unittest.main()
