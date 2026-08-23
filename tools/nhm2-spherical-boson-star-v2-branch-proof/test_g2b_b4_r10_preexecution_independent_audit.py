"""Source-disjoint preexecution audit for B4-R10.

This audit does not import the implementation.  It reopens the frozen proposal,
implementation and checkpoint as bytes and independently checks the no-execute
boundary and the exact sole numerical delta.
"""

from __future__ import annotations

import ast
import hashlib
import json
import math
from pathlib import Path
import re
import stat
import struct
import unittest


ROOT = Path(__file__).resolve().parents[2]
TOOLS = Path(__file__).resolve().parent
SOURCE = TOOLS / "g2b_b4_r10_equilibrated_four_grid_successor.py"
R9_SOURCE = TOOLS / "g2b_b4_r9_formulation_proposal.py"
CHECKPOINT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r10-execution-checkpoint.md"
OUTPUT = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r10-four-grid-v1"


def _sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _equilibrate(matrix, rhs):
    def scale(maximum):
        if maximum == 0.0:
            return 1.0
        return math.ldexp(1.0, -math.frexp(maximum)[1])
    rows = tuple(scale(max(abs(value) for value in row)) for row in matrix)
    row_matrix = tuple(tuple(rows[i] * value for value in row) for i, row in enumerate(matrix))
    columns = tuple(scale(max(abs(row_matrix[i][j]) for i in range(len(matrix)))) for j in range(len(matrix)))
    return (
        tuple(tuple(row_matrix[i][j] * columns[j] for j in range(len(matrix))) for i in range(len(matrix))),
        tuple(rows[i] * rhs[i] for i in range(len(rhs))),
        rows,
        columns,
    )


class B4R10IndependentPreexecutionAudit(unittest.TestCase):
    def test_output_root_is_fresh_and_no_candidate_artifact_exists(self) -> None:
        self.assertFalse(OUTPUT.exists())
        self.assertFalse(OUTPUT.is_symlink())

    def test_source_has_single_guarded_execution_entrypoint(self) -> None:
        raw = SOURCE.read_bytes()
        tree = ast.parse(raw.decode("utf-8"))
        functions = [node.name for node in tree.body if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))]
        self.assertEqual(functions.count("execute_once"), 1)
        pre = next(node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == "verify_preexecution_only")
        calls = {node.func.attr if isinstance(node.func, ast.Attribute) else node.func.id
                 for node in ast.walk(pre) if isinstance(node, ast.Call) and isinstance(node.func, (ast.Attribute, ast.Name))}
        self.assertTrue(calls.isdisjoint({"execute_once", "generate_compactified_lobatto_grid", "continue_spherical_radial_compactified_diagnostic", "_solve_newton_map"}))
        self.assertIn("_assert_execution_environment()", raw.decode("utf-8"))

    def test_exact_numerical_delta_and_locks_are_literal(self) -> None:
        text = SOURCE.read_text(encoding="utf-8")
        required = (
            "R9.equilibrate_linear_system(jacobian, raw_rhs)",
            "R9.recover_unscaled_direction(",
            "trial_merit <= armijo_bound or stationary",
            "R9.interpolatory_prefix_mpfr512(grid.rho, g)",
            "R9.contracts_without_threshold(values)",
            '"absoluteThresholdUsed": False',
            '"coarseGridPredictorAllowed": False',
            '"candidateAdmission": False',
        )
        for literal in required:
            self.assertIn(literal, text)
        self.assertNotIn("least_squares", text)
        self.assertNotIn("scipy", text)

    def test_checkpoint_rehashes_all_preexecution_files(self) -> None:
        checkpoint = CHECKPOINT.read_text(encoding="utf-8")
        roles = {
            "implementation": SOURCE,
            "focused_tests": TOOLS / "test_g2b_b4_r10_equilibrated_four_grid_successor.py",
            "independent_audit": Path(__file__).resolve(),
            "implementation_packet": ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r10-implementation-preexecution.md",
        }
        for role, path in roles.items():
            metadata = path.lstat()
            raw = path.read_bytes()
            self.assertTrue(stat.S_ISREG(metadata.st_mode))
            self.assertFalse(stat.S_ISLNK(metadata.st_mode))
            self.assertIn(f"| {role} | {len(raw):,} | `{_sha(raw)}` |", checkpoint)

    def test_independent_equilibration_preserves_exact_solution(self) -> None:
        matrix = ((8.0, 2.0), (0.25, 4.0))
        rhs = (10.0, 4.25)
        scaled_matrix, scaled_rhs, rows, columns = _equilibrate(matrix, rhs)
        determinant = scaled_matrix[0][0] * scaled_matrix[1][1] - scaled_matrix[0][1] * scaled_matrix[1][0]
        y = (
            (scaled_rhs[0] * scaled_matrix[1][1] - scaled_matrix[0][1] * scaled_rhs[1]) / determinant,
            (scaled_matrix[0][0] * scaled_rhs[1] - scaled_rhs[0] * scaled_matrix[1][0]) / determinant,
        )
        direction = tuple(y[index] * columns[index] for index in range(2))
        self.assertEqual(direction, (1.0, 1.0))
        for value in (*rows, *columns):
            mantissa, _ = math.frexp(value)
            self.assertEqual(abs(mantissa), 0.5)

    def test_checkpoint_token_is_single_fixed_sha256_word(self) -> None:
        checkpoint = CHECKPOINT.read_text(encoding="utf-8")
        matches = re.findall(r"NHM2_G2B_B4_R10_EXECUTION_TOKEN=([0-9a-f]{64})", checkpoint)
        self.assertEqual(len(set(matches)), 1)
        self.assertGreaterEqual(len(matches), 1)


if __name__ == "__main__":
    unittest.main()
