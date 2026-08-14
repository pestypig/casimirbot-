from __future__ import annotations

import importlib.util
import json
import sys
import unittest
from fractions import Fraction
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("dyadic_interval.py")
SPEC = importlib.util.spec_from_file_location("spherical_seed_dyadic_interval", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
intervals = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = intervals
SPEC.loader.exec_module(intervals)


def endpoint(
    direction: str = "RNDD",
    exponent2: int = -4,
    mantissa: str = "3",
    sign: str = "plus",
):
    return {
        "direction": direction,
        "exponent2": exponent2,
        "mantissaLowercaseHex": mantissa,
        "precisionBits": 256,
        "sign": sign,
    }


class DirectedIntervalTests(unittest.TestCase):
    def test_parses_normalized_endpoints_as_exact_fractions(self) -> None:
        value = intervals.parse_directed_endpoint(endpoint())
        self.assertEqual(value.exact_value, Fraction(3, 16))
        negative = intervals.parse_directed_endpoint(
            endpoint(direction="RNDU", exponent2=3, mantissa="5", sign="minus")
        )
        self.assertEqual(negative.exact_value, Fraction(-40))
        zero = intervals.parse_directed_endpoint(
            endpoint(direction="RNDU", exponent2=0, mantissa="0", sign="zero")
        )
        self.assertEqual(zero.exact_value, 0)

    def test_builds_only_ordered_rndd_rndu_intervals(self) -> None:
        interval = intervals.parse_directed_interval(
            [
                endpoint(sign="minus"),
                endpoint(direction="RNDU", mantissa="5"),
            ]
        )
        self.assertEqual(interval.lower.exact_value, Fraction(-3, 16))
        self.assertEqual(interval.upper.exact_value, Fraction(5, 16))

        with self.assertRaises(intervals.DirectedIntervalError) as caught:
            intervals.parse_directed_interval(
                [
                    endpoint(mantissa="5"),
                    endpoint(direction="RNDU", mantissa="3"),
                ]
            )
        self.assertEqual(caught.exception.code, "interval_order_invalid")

    def test_rejects_noncanonical_mantissas_zero_and_precision(self) -> None:
        bad = (
            endpoint(mantissa="03"),
            endpoint(mantissa="2"),
            endpoint(mantissa="A"),
            endpoint(mantissa="1" * 65),
            endpoint(exponent2=1, mantissa="0", sign="zero"),
            {**endpoint(), "precisionBits": 255},
        )
        for candidate in bad:
            with self.assertRaises(intervals.DirectedIntervalError):
                intervals.parse_directed_endpoint(candidate)

    def test_rejects_bool_integer_subclasses_extra_keys_and_wrong_directions(self) -> None:
        bad = (
            {**endpoint(), "exponent2": True},
            {**endpoint(), "precisionBits": True},
            {**endpoint(), "extra": 1},
            endpoint(direction="RNDN"),
        )
        for candidate in bad:
            with self.assertRaises(intervals.DirectedIntervalError):
                intervals.parse_directed_endpoint(candidate)

        with self.assertRaises(intervals.DirectedIntervalError):
            intervals.parse_directed_interval(
                [endpoint(), endpoint(direction="RNDD")]
            )

        with self.assertRaises(intervals.DirectedIntervalError) as caught:
            intervals.parse_directed_interval(
                (endpoint(), endpoint(direction="RNDU"))
            )
        self.assertEqual(
            caught.exception.code, "interval_exact_two_element_json_array_invalid"
        )

    def test_consumes_the_exact_json_array_wire_shape(self) -> None:
        canonical = json.dumps(
            [endpoint(), endpoint(direction="RNDU", mantissa="5")],
            separators=(",", ":"),
            sort_keys=True,
        )
        decoded = json.loads(canonical)
        result = intervals.parse_directed_interval(decoded)
        self.assertEqual(result.lower.exact_value, Fraction(3, 16))
        self.assertEqual(result.upper.exact_value, Fraction(5, 16))

        class ListSubclass(list):
            pass

        with self.assertRaises(intervals.DirectedIntervalError):
            intervals.parse_directed_interval(ListSubclass(decoded))

    def test_authority_stays_false_and_source_is_producer_independent(self) -> None:
        self.assertTrue(all(value is False for value in intervals.AUTHORITY_LOCKS))
        source = MODULE_PATH.read_text(encoding="utf-8")
        self.assertNotIn("producer", source.lower())


if __name__ == "__main__":
    unittest.main()
