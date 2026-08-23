"""No-candidate tests for the B4-R11 terminal-equivalence diagnostic."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import struct
import sys
import unittest


PATH = Path(__file__).with_name("g2b_b4_r11_terminal_equivalence_diagnosis.py")
SPEC = importlib.util.spec_from_file_location("_nhm2_g2b_b4_r11_tested", PATH)
assert SPEC is not None and SPEC.loader is not None
R11 = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = R11
SPEC.loader.exec_module(R11)


class B4R11NoCandidateTests(unittest.TestCase):
    def test_import_does_not_create_output(self) -> None:
        self.assertFalse(R11.OUTPUT.exists())

    def test_packet_binding_is_exact(self) -> None:
        item = R11.EXPECTED[0]
        binding = R11._ordinary_binding(*item)
        self.assertEqual(binding["role"], "packet")
        self.assertEqual(binding["rawSha256"], item[3])

    def test_canonical_json_is_ascii_and_total(self) -> None:
        raw = R11._canonical({"z": "\N{GREEK SMALL LETTER LAMDA}", "a": 1})
        self.assertEqual(raw, b'{"a":1,"z":"\\u03bb"}')
        self.assertEqual(json.loads(raw), {"a": 1, "z": "\N{GREEK SMALL LETTER LAMDA}"})

    def test_binary64_word_is_big_endian_identity(self) -> None:
        self.assertEqual(R11._word(1.0), struct.pack(">d", 1.0).hex())

    def test_authority_locks_are_all_false(self) -> None:
        self.assertTrue(R11.AUTHORITY_LOCKS)
        self.assertFalse(any(R11.AUTHORITY_LOCKS.values()))


if __name__ == "__main__":
    unittest.main()
