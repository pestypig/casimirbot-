"""Microfixtures for the source-independent binary64 bit view."""

from __future__ import annotations

import ast
import builtins
from dataclasses import FrozenInstanceError
import importlib.util
from pathlib import Path
import sys
import unittest
from unittest import mock


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

_FORBIDDEN_MODULES = frozenset({"array", "math", "numpy", "producer", "struct"})
_FORBIDDEN_MODULES_BEFORE_IMPORT = frozenset(
    name
    for name in sys.modules
    if name.split(".", 1)[0] in _FORBIDDEN_MODULES
)

import f64le_bits  # noqa: E402
from f64le_bits import (  # noqa: E402
    F64LEBits,
    F64LEBitsError,
    F64LEBitView,
    F64LEValidationError,
    positive_zero_f64le_bytes,
    validate_finite,
    validate_finite_no_negative_zero,
    validate_no_negative_zero,
)


def _le(unsigned_bits: int) -> bytes:
    return unsigned_bits.to_bytes(8, "little", signed=False)


POSITIVE_ZERO = b"\x00\x00\x00\x00\x00\x00\x00\x00"
NEGATIVE_ZERO = _le(0x8000_0000_0000_0000)
MIN_SUBNORMAL = _le(0x0000_0000_0000_0001)
MAX_SUBNORMAL = _le(0x000F_FFFF_FFFF_FFFF)
MIN_NORMAL = _le(0x0010_0000_0000_0000)
POSITIVE_FINITE = _le(0x3FF0_0000_0000_0000)
NEGATIVE_FINITE = _le(0xBFF0_0000_0000_0000)
POSITIVE_INFINITY = _le(0x7FF0_0000_0000_0000)
NEGATIVE_INFINITY = _le(0xFFF0_0000_0000_0000)
QUIET_NAN = _le(0x7FF8_0000_0000_0001)
SIGNALING_NAN = _le(0x7FF0_0000_0000_0001)


class ClassificationTests(unittest.TestCase):
    def test_literal_positive_zero_helper(self) -> None:
        self.assertEqual(positive_zero_f64le_bytes(), POSITIVE_ZERO)
        self.assertIsInstance(positive_zero_f64le_bytes(), bytes)

    def test_exact_bit_classification_microfixtures(self) -> None:
        fixtures = (
            ("positive zero", POSITIVE_ZERO, 0, 0, 0, True, True, False),
            ("negative zero", NEGATIVE_ZERO, 1, 0, 0, True, True, True),
            ("minimum subnormal", MIN_SUBNORMAL, 0, 0, 1, True, False, False),
            (
                "maximum subnormal",
                MAX_SUBNORMAL,
                0,
                0,
                0x000F_FFFF_FFFF_FFFF,
                True,
                False,
                False,
            ),
            ("minimum normal", MIN_NORMAL, 0, 1, 0, True, False, False),
            ("positive finite", POSITIVE_FINITE, 0, 0x3FF, 0, True, False, False),
            ("negative finite", NEGATIVE_FINITE, 1, 0x3FF, 0, True, False, False),
            ("positive infinity", POSITIVE_INFINITY, 0, 0x7FF, 0, False, False, False),
            ("negative infinity", NEGATIVE_INFINITY, 1, 0x7FF, 0, False, False, False),
            (
                "quiet NaN",
                QUIET_NAN,
                0,
                0x7FF,
                0x0008_0000_0000_0001,
                False,
                False,
                False,
            ),
            ("signaling NaN", SIGNALING_NAN, 0, 0x7FF, 1, False, False, False),
        )
        for (
            label,
            raw,
            sign_bit,
            exponent_bits,
            fraction_bits,
            is_finite,
            is_zero,
            is_negative_zero,
        ) in fixtures:
            with self.subTest(label=label):
                element = F64LEBits(raw)
                self.assertIs(element.exact_bytes, raw)
                self.assertEqual(element.sign_bit, sign_bit)
                self.assertEqual(element.exponent_bits, exponent_bits)
                self.assertEqual(element.fraction_bits, fraction_bits)
                self.assertIs(element.is_finite, is_finite)
                self.assertIs(element.is_zero, is_zero)
                self.assertIs(element.is_negative_zero, is_negative_zero)

    def test_element_requires_exact_immutable_eight_bytes(self) -> None:
        for raw in (b"", b"\x00" * 7, b"\x00" * 9):
            with self.subTest(length=len(raw)), self.assertRaisesRegex(
                F64LEBitsError, "exactly_8_bytes_required"
            ):
                F64LEBits(raw)
        with self.assertRaisesRegex(F64LEBitsError, "exact_bytes_type_required"):
            F64LEBits(bytearray(8))  # type: ignore[arg-type]

    def test_element_is_frozen_and_has_no_decoded_value_surface(self) -> None:
        element = F64LEBits(POSITIVE_FINITE)
        with self.assertRaises(FrozenInstanceError):
            element.exact_bytes = NEGATIVE_FINITE  # type: ignore[misc]
        self.assertFalse(hasattr(element, "value"))
        self.assertFalse(hasattr(element, "bits"))
        self.assertFalse(hasattr(element, "as_float"))


class PayloadViewTests(unittest.TestCase):
    def test_exact_counts_and_indexed_iteration_are_deterministic(self) -> None:
        raw = MIN_SUBNORMAL + POSITIVE_ZERO + NEGATIVE_FINITE
        view = F64LEBitView(raw, expected_element_count=3, expected_byte_count=24)
        self.assertIs(view.exact_bytes, raw)
        self.assertEqual(view.element_count, 3)
        self.assertEqual(view.byte_count, 24)
        expected = (
            (0, MIN_SUBNORMAL),
            (1, POSITIVE_ZERO),
            (2, NEGATIVE_FINITE),
        )
        observed_once = tuple(
            (index, element.exact_bytes) for index, element in view.iter_indexed()
        )
        observed_twice = tuple(
            (index, element.exact_bytes) for index, element in view.iter_indexed()
        )
        self.assertEqual(observed_once, expected)
        self.assertEqual(observed_twice, expected)
        self.assertEqual(tuple(element.exact_bytes for element in view), raw_chunks(raw))
        self.assertEqual(view.at(0).exact_bytes, MIN_SUBNORMAL)
        self.assertEqual(view.at(2).exact_bytes, NEGATIVE_FINITE)

    def test_view_is_frozen_and_requires_bytes(self) -> None:
        view = F64LEBitView(POSITIVE_ZERO, 1, 8)
        with self.assertRaises(FrozenInstanceError):
            view.expected_element_count = 2  # type: ignore[misc]
        with self.assertRaisesRegex(F64LEBitsError, "immutable_bytes_payload_required"):
            F64LEBitView(bytearray(8), 1, 8)  # type: ignore[arg-type]

    def test_truncated_and_extra_payloads_fail_closed(self) -> None:
        with self.assertRaisesRegex(F64LEBitsError, "payload_truncated"):
            F64LEBitView(POSITIVE_ZERO[:-1], 1, 8)
        with self.assertRaisesRegex(F64LEBitsError, "payload_has_extra_bytes"):
            F64LEBitView(POSITIVE_ZERO + b"\x00", 1, 8)

    def test_incoherent_or_invalid_expected_counts_fail_closed(self) -> None:
        with self.assertRaisesRegex(
            F64LEBitsError, "element_and_byte_expectations_disagree"
        ):
            F64LEBitView(POSITIVE_ZERO, 1, 16)
        for element_count in (-1, True):
            with self.subTest(element_count=element_count), self.assertRaisesRegex(
                F64LEBitsError, "nonnegative_integer_element_count_required"
            ):
                F64LEBitView(b"", element_count, 0)  # type: ignore[arg-type]
        for byte_count in (-1, True):
            with self.subTest(byte_count=byte_count), self.assertRaisesRegex(
                F64LEBitsError, "nonnegative_integer_byte_count_required"
            ):
                F64LEBitView(b"", 0, byte_count)  # type: ignore[arg-type]

    def test_index_contract_rejects_noninteger_negative_and_past_end(self) -> None:
        view = F64LEBitView(POSITIVE_ZERO, 1, 8)
        for index in (-1, 1):
            with self.subTest(index=index), self.assertRaises(IndexError):
                view.at(index)
        for index in (True, 0.0, "0"):
            with self.subTest(index=index), self.assertRaises(TypeError):
                view.at(index)  # type: ignore[arg-type]


class ValidatorTests(unittest.TestCase):
    def test_finite_validator_reports_first_nonfinite_index(self) -> None:
        view = F64LEBitView(
            POSITIVE_FINITE + POSITIVE_INFINITY + SIGNALING_NAN,
            3,
            24,
        )
        with self.assertRaises(F64LEValidationError) as caught:
            validate_finite(view)
        self.assertEqual(caught.exception.code, "nonfinite_binary64_forbidden")
        self.assertEqual(caught.exception.index, 1)
        self.assertEqual(str(caught.exception), "nonfinite_binary64_forbidden:index=1")

    def test_negative_zero_validator_reports_first_offending_index(self) -> None:
        view = F64LEBitView(POSITIVE_ZERO + NEGATIVE_ZERO + NEGATIVE_ZERO, 3, 24)
        with self.assertRaises(F64LEValidationError) as caught:
            validate_no_negative_zero(view)
        self.assertEqual(caught.exception.code, "negative_zero_forbidden")
        self.assertEqual(caught.exception.index, 1)

    def test_combined_validator_uses_first_bad_payload_index(self) -> None:
        cases = (
            (
                POSITIVE_FINITE + NEGATIVE_ZERO + POSITIVE_INFINITY,
                "negative_zero_forbidden",
            ),
            (
                POSITIVE_FINITE + POSITIVE_INFINITY + NEGATIVE_ZERO,
                "nonfinite_binary64_forbidden",
            ),
            (
                POSITIVE_FINITE + QUIET_NAN + SIGNALING_NAN,
                "nonfinite_binary64_forbidden",
            ),
        )
        for raw, expected_code in cases:
            view = F64LEBitView(raw, 3, 24)
            observed = []
            for _ in range(2):
                with self.assertRaises(F64LEValidationError) as caught:
                    validate_finite_no_negative_zero(view)
                observed.append((caught.exception.code, caught.exception.index))
            self.assertEqual(observed, [(expected_code, 1), (expected_code, 1)])

    def test_all_finite_nonnegative_zero_encodings_pass(self) -> None:
        raw = (
            POSITIVE_ZERO
            + MIN_SUBNORMAL
            + MAX_SUBNORMAL
            + MIN_NORMAL
            + POSITIVE_FINITE
            + NEGATIVE_FINITE
        )
        view = F64LEBitView(raw, 6, 48)
        self.assertIsNone(validate_finite(view))
        self.assertIsNone(validate_no_negative_zero(view))
        self.assertIsNone(validate_finite_no_negative_zero(view))

    def test_validators_reject_nonexact_view_objects(self) -> None:
        for validator in (
            validate_finite,
            validate_no_negative_zero,
            validate_finite_no_negative_zero,
        ):
            with self.subTest(validator=validator.__name__), self.assertRaisesRegex(
                F64LEBitsError, "exact_f64le_bit_view_required"
            ):
                validator(object())  # type: ignore[arg-type]


class SourceIndependenceTests(unittest.TestCase):
    def test_ast_has_no_float_decoder_or_forbidden_import(self) -> None:
        source_path = HERE / "f64le_bits.py"
        tree = ast.parse(source_path.read_text(encoding="utf-8"))
        imported_roots: set[str] = set()
        called_names: set[str] = set()
        called_attributes: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imported_roots.update(alias.name.split(".", 1)[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imported_roots.add(node.module.split(".", 1)[0])
            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    called_names.add(node.func.id)
                elif isinstance(node.func, ast.Attribute):
                    called_attributes.add(node.func.attr)
        self.assertTrue(imported_roots.isdisjoint(_FORBIDDEN_MODULES))
        self.assertNotIn("float", called_names)
        self.assertTrue(
            called_attributes.isdisjoint({"byteswap", "frombytes", "pack", "unpack"})
        )

    def test_import_loads_no_forbidden_runtime_module(self) -> None:
        forbidden_after = frozenset(
            name
            for name in sys.modules
            if name.split(".", 1)[0] in _FORBIDDEN_MODULES
        )
        self.assertEqual(forbidden_after, _FORBIDDEN_MODULES_BEFORE_IMPORT)

    def test_fresh_runtime_import_rejects_forbidden_dependencies(self) -> None:
        module_name = "_f64le_bits_source_independence_probe"
        source_path = HERE / "f64le_bits.py"
        specification = importlib.util.spec_from_file_location(module_name, source_path)
        self.assertIsNotNone(specification)
        self.assertIsNotNone(specification.loader)
        module = importlib.util.module_from_spec(specification)
        original_import = builtins.__import__

        def guarded_import(name: str, *args: object, **kwargs: object) -> object:
            root = name.split(".", 1)[0]
            if root in _FORBIDDEN_MODULES:
                raise AssertionError(f"forbidden dependency requested: {root}")
            return original_import(name, *args, **kwargs)

        sys.modules[module_name] = module
        try:
            with mock.patch("builtins.__import__", side_effect=guarded_import):
                specification.loader.exec_module(module)
        finally:
            sys.modules.pop(module_name, None)


def raw_chunks(raw: bytes) -> tuple[bytes, ...]:
    return tuple(raw[offset : offset + 8] for offset in range(0, len(raw), 8))


if __name__ == "__main__":
    unittest.main()
