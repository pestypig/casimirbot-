"""No-candidate tests for the sole B4-R11-R1 loader repair."""

from __future__ import annotations

import importlib.util
from pathlib import Path
import sys
import unittest


PATH = Path(__file__).with_name("g2b_b4_r11_r1_terminal_equivalence_diagnosis.py")
SPEC = importlib.util.spec_from_file_location("_nhm2_g2b_b4_r11_r1_tested", PATH)
assert SPEC is not None and SPEC.loader is not None
R1 = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = R1
SPEC.loader.exec_module(R1)


class B4R11R1NoCandidateTests(unittest.TestCase):
    def test_import_creates_no_output(self) -> None:
        self.assertFalse(R1.OUTPUT.exists())

    def test_frozen_r11_source_identity(self) -> None:
        self.assertEqual(
            R1.R11._sha(R1.PATH.read_bytes()),
            "7ef946fe2e08dc9f04da1a22b7b7245ce95f284bca7431f6fac4a9a3be3d4de7",
        )

    def test_branch_modules_use_canonical_class_identity(self) -> None:
        if str(R1.R11.BRANCH) not in sys.path:
            sys.path.insert(0, str(R1.R11.BRANCH))
        grid = R1._canonical_load("ignored", R1.R11.BRANCH / "radial_lobatto_grid.py")
        system = R1._canonical_load("ignored", R1.R11.BRANCH / "radial_compactified_system.py")
        self.assertIs(grid.CompactifiedDifferentiationData, system.CompactifiedDifferentiationData)

    def test_only_branch_paths_are_canonicalized(self) -> None:
        self.assertNotEqual(R1.R11.R9_SOURCE.parent.resolve(), R1.R11.BRANCH.resolve())

    def test_authority_locks_remain_false(self) -> None:
        self.assertFalse(any(R1.R11.AUTHORITY_LOCKS.values()))


if __name__ == "__main__":
    unittest.main()
