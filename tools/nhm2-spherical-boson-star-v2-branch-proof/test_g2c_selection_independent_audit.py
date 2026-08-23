import unittest

from g2c_selection_independent_audit import EXPECTED, audit


class G2CSelectionIndependentAuditTest(unittest.TestCase):
    def test_frozen_selection_replays_to_unique_expected_winner(self) -> None:
        winner, vector = audit()
        self.assertEqual(winner, EXPECTED)
        self.assertEqual(vector, (2, 2, 2, 2, 2, 2, 2))


if __name__ == "__main__":
    unittest.main()
