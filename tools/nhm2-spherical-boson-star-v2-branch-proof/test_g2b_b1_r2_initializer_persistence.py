"""Preexecution checks for the G2B-B1-R2 persistence boundary."""

from __future__ import annotations

import ast
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import sys
import tempfile
import unittest


HERE = Path(__file__).resolve().parent
SOURCE = HERE / "g2b_b1_r2_initializer_persistence.py"
R1_SOURCE = HERE / "g2b_m5_r1_initializer_materializer_r1.py"
ROOT = HERE.parents[1]
PACKET = (
    ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2b-b1-r2-initializer-persistence.md"
)
RESULT = (
    ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2b-b1-r1-result-record.md"
)

SPEC = importlib.util.spec_from_file_location("g2b_b1_r2_test_target", SOURCE)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("g2b_b1_r2_test_target_unavailable")
TARGET = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = TARGET
SPEC.loader.exec_module(TARGET)


class G2BB1R2PersistenceTests(unittest.TestCase):
    def test_frozen_predecessor_and_packet_bindings(self) -> None:
        cases = (
            (PACKET, TARGET.PACKET_SHA256, TARGET.PACKET_SIZE_BYTES),
            (R1_SOURCE, TARGET.R1_SOURCE_SHA256, TARGET.R1_SOURCE_SIZE_BYTES),
            (RESULT, TARGET.R1_RESULT_SHA256, TARGET.R1_RESULT_SIZE_BYTES),
        )
        for path, digest, size in cases:
            raw = path.read_bytes()
            self.assertEqual(len(raw), size)
            self.assertEqual(hashlib.sha256(raw).hexdigest(), digest)

    def test_output_root_is_absent_before_execution(self) -> None:
        self.assertFalse(TARGET.OUTPUT_ROOT.exists())
        self.assertFalse(TARGET.OUTPUT_ROOT.is_symlink())
        TARGET._assert_output_boundary()

    def test_expected_inventory_is_exact_and_unique(self) -> None:
        self.assertEqual(len(TARGET.EXPECTED_PAYLOADS), 6)
        self.assertEqual(sum(item[2] for item in TARGET.EXPECTED_PAYLOADS), 2_664)
        paths = tuple(item[0] for item in TARGET.EXPECTED_PAYLOADS)
        self.assertEqual(len(set(paths)), len(paths))
        self.assertEqual(
            paths,
            (
                "scalars.f64le",
                "coefficients/core_L2_u.f64le",
                "coefficients/core_L2_V.f64le",
                "coefficients/tail_H.f64le",
                "coefficients/tail_Q.f64le",
                "initializer/core_L2_join_barrier.f64le",
            ),
        )

    def test_exact_command_fails_before_execution(self) -> None:
        with self.assertRaisesRegex(
            TARGET.G2BB1R2PersistenceError, "g2b_b1_r2_exact_command_required"
        ):
            TARGET._main([])
        self.assertFalse(TARGET.OUTPUT_ROOT.exists())

    def test_exclusive_writer_writes_once_and_rejects_collision(self) -> None:
        with tempfile.TemporaryDirectory(prefix="g2b-b1-r2-") as directory:
            path = Path(directory) / "payload.bin"
            TARGET._write_exclusive(path, b"frozen")
            self.assertEqual(path.read_bytes(), b"frozen")
            with self.assertRaisesRegex(
                TARGET.G2BB1R2PersistenceError,
                "g2b_b1_r2_exclusive_open_failed",
            ):
                TARGET._write_exclusive(path, b"changed")
            self.assertEqual(path.read_bytes(), b"frozen")

    def test_canonical_receipt_hash_recipe_is_length_delimited(self) -> None:
        unsigned = {"a": 1, "z": False}
        raw = b'{"a":1,"z":false}'
        expected = hashlib.sha256(
            TARGET.RECEIPT_DOMAIN + struct.pack("<Q", len(raw)) + raw
        ).hexdigest()
        self.assertEqual(TARGET._canonical(unsigned), raw)
        self.assertEqual(TARGET._receipt_self_hash(unsigned), expected)

    def test_source_surface_has_no_solver_or_authority_promotion(self) -> None:
        source = SOURCE.read_text(encoding="utf-8")
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
                "radial_continuation",
                "deterministic_newton",
                "radial_cross_grid_convergence",
            }
        )
        self.assertNotIn("candidateAuthority\": True", source)
        self.assertNotIn("physicalAuthority\": True", source)
        self.assertNotIn("shutil", imported)
        self.assertNotIn("subprocess", imported)
        self.assertNotIn("unlink(", source)
        self.assertNotIn("rmtree(", source)

    def test_result_record_binds_every_expected_hash(self) -> None:
        text = RESULT.read_text(encoding="utf-8")
        self.assertIn(TARGET.MATERIALIZATION_RECEIPT_SELF_SHA256, text)
        for _, digest, size in TARGET.EXPECTED_PAYLOADS:
            self.assertIn(digest, text)
            self.assertGreater(size, 0)

    def test_packet_contains_required_work_header_and_false_authority(self) -> None:
        text = PACKET.read_text(encoding="utf-8")
        for label in (
            "Program gate:",
            "Workstream:",
            "Capability or component:",
            "Current maturity:",
            "Target maturity:",
            "Required frozen inputs:",
            "Required evidence:",
            "Stop/fail criteria:",
            "Explicit non-goals:",
            "Downstream gate unlocked:",
        ):
            self.assertIn(label, text)
        self.assertIn("authority-neutral initializer", text)


if __name__ == "__main__":
    unittest.main()
