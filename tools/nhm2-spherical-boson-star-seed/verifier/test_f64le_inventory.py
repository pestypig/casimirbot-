from __future__ import annotations

import importlib.util
import math
import struct
import sys
import unittest
from dataclasses import FrozenInstanceError
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("f64le_inventory.py")
SPEC = importlib.util.spec_from_file_location("spherical_seed_f64le_inventory", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
inventory = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = inventory
SPEC.loader.exec_module(inventory)


def payloads_with(fill: float = 0.0):
    return tuple(
        (
            spec.path,
            struct.pack("<d", fill) * spec.element_count,
        )
        for spec in inventory.PRIMARY_PAYLOAD_SPECS
    )


class TupleSubclass(tuple):
    pass


class BytesSubclass(bytes):
    pass


class PrimaryPayloadInventoryTests(unittest.TestCase):
    def test_exact_inventory_decodes_and_is_frozen(self) -> None:
        result = inventory.decode_primary_payloads(payloads_with())
        self.assertEqual(len(result.payloads), 5)
        self.assertEqual(inventory.TOTAL_ELEMENT_COUNT, 329)
        self.assertEqual(inventory.TOTAL_BYTE_COUNT, 2632)
        self.assertEqual(result.scalar("lambda"), 0.0)
        self.assertEqual(result.payloads[0].values, (0.0,) * 9)
        self.assertEqual(
            result.payloads[0].raw_sha256,
            "834a709ba2534ebe3ee1397fd4f7bd288b2acc1d20a08d6c862dcd99b6f04400",
        )
        self.assertEqual(
            result.payloads[0].payload_sha256,
            "2f24285535319aca44f9341e003a3ce30f42384e26c97a24a7bc30b809ede3f1",
        )
        with self.assertRaises(FrozenInstanceError):
            result.payloads[0].raw_sha256 = "0" * 64  # type: ignore[misc]

    def test_preserves_finite_subnormals_and_signed_values(self) -> None:
        entries = list(payloads_with())
        values = [
            math.ldexp(1.0, -1074),
            -math.ldexp(1.0, -1074),
            -1.5,
        ] + [0.0] * 6
        entries[0] = (
            entries[0][0],
            b"".join(struct.pack("<d", value) for value in values),
        )
        result = inventory.decode_primary_payloads(tuple(entries))
        self.assertEqual(result.payloads[0].values[:3], tuple(values[:3]))

    def test_rejects_nonfinite_and_negative_zero_at_first_coordinate(self) -> None:
        for value, code in (
            (float("nan"), "numeric_payload_nonfinite"),
            (float("inf"), "numeric_payload_nonfinite"),
            (-float("inf"), "numeric_payload_nonfinite"),
            (-0.0, "numeric_payload_negative_zero"),
        ):
            entries = list(payloads_with())
            raw = bytearray(entries[2][1])
            raw[5 * 8 : 6 * 8] = struct.pack("<d", value)
            entries[2] = (entries[2][0], bytes(raw))
            with self.assertRaises(inventory.PrimaryPayloadError) as caught:
                inventory.decode_primary_payloads(tuple(entries))
            self.assertEqual(caught.exception.code, code)
            self.assertEqual(
                caught.exception.detail,
                "coefficients/core_L2_V.f64le:5",
            )

    def test_failure_precedence_is_shape_then_nonfinite_then_negative_zero(self) -> None:
        entries = list(payloads_with())
        first_values = [0.0] * 9
        first_values[0] = -0.0
        entries[0] = (
            entries[0][0],
            b"".join(struct.pack("<d", value) for value in first_values),
        )
        last_values = [0.0] * 32
        last_values[-1] = float("nan")
        entries[-1] = (
            entries[-1][0],
            b"".join(struct.pack("<d", value) for value in last_values),
        )

        malformed = list(entries)
        malformed[2] = (malformed[2][0], malformed[2][1][:-8])
        with self.assertRaises(inventory.PrimaryPayloadError) as caught:
            inventory.decode_primary_payloads(tuple(malformed))
        self.assertEqual(caught.exception.code, "payload_size_mismatch")

        with self.assertRaises(inventory.PrimaryPayloadError) as caught:
            inventory.decode_primary_payloads(tuple(entries))
        self.assertEqual(caught.exception.code, "numeric_payload_nonfinite")

        last_values[-1] = 0.0
        entries[-1] = (
            entries[-1][0],
            b"".join(struct.pack("<d", value) for value in last_values),
        )
        with self.assertRaises(inventory.PrimaryPayloadError) as caught:
            inventory.decode_primary_payloads(tuple(entries))
        self.assertEqual(caught.exception.code, "numeric_payload_negative_zero")

    def test_bound_decode_checks_all_hashes_before_numeric_classification(self) -> None:
        exact = payloads_with()
        decoded = inventory.decode_primary_payloads(exact)
        hashes = tuple(
            (payload.raw_sha256, payload.payload_sha256)
            for payload in decoded.payloads
        )
        self.assertEqual(inventory.decode_bound_primary_payloads(exact, hashes), decoded)

        entries = list(exact)
        raw = bytearray(entries[0][1])
        raw[:8] = struct.pack("<d", float("nan"))
        entries[0] = (entries[0][0], bytes(raw))
        with self.assertRaises(inventory.PrimaryPayloadError) as caught:
            inventory.decode_bound_primary_payloads(tuple(entries), hashes)
        self.assertEqual(caught.exception.code, "numeric_payload_hash_or_shape_mismatch")

        changed_hashes = list(hashes)
        observed = inventory._freeze_inventory(tuple(entries))
        changed_hashes[0] = (observed[0][2], observed[0][3])
        with self.assertRaises(inventory.PrimaryPayloadError) as caught:
            inventory.decode_bound_primary_payloads(tuple(entries), tuple(changed_hashes))
        self.assertEqual(caught.exception.code, "numeric_payload_nonfinite")

    def test_rejects_wrong_count_order_path_and_size(self) -> None:
        exact = payloads_with()
        cases = (
            exact[:-1],
            (exact[1], exact[0], *exact[2:]),
            (("wrong.f64le", exact[0][1]), *exact[1:]),
            ((exact[0][0], exact[0][1][:-1]), *exact[1:]),
        )
        for candidate in cases:
            with self.assertRaises(inventory.PrimaryPayloadError):
                inventory.decode_primary_payloads(candidate)

    def test_rejects_container_and_byte_subclasses_without_iteration(self) -> None:
        exact = payloads_with()
        with self.assertRaises(inventory.PrimaryPayloadError) as caught:
            inventory.decode_primary_payloads(TupleSubclass(exact))
        self.assertEqual(caught.exception.code, "payload_inventory_type_invalid")

        entries = list(exact)
        entries[0] = (entries[0][0], BytesSubclass(entries[0][1]))
        with self.assertRaises(inventory.PrimaryPayloadError) as caught:
            inventory.decode_primary_payloads(tuple(entries))
        self.assertEqual(caught.exception.code, "payload_bytes_type_invalid")

        entries = list(exact)
        entries[0] = TupleSubclass(entries[0])
        with self.assertRaises(inventory.PrimaryPayloadError) as caught:
            inventory.decode_primary_payloads(tuple(entries))
        self.assertEqual(caught.exception.code, "payload_entry_shape_invalid")

    def test_unknown_lookup_is_typed_and_locks_remain_false(self) -> None:
        result = inventory.decode_primary_payloads(payloads_with())
        with self.assertRaises(inventory.PrimaryPayloadError):
            result.payload("unknown")
        with self.assertRaises(inventory.PrimaryPayloadError):
            result.scalar("unknown")
        self.assertTrue(all(value is False for value in inventory.AUTHORITY_LOCKS.values()))
        with self.assertRaises(TypeError):
            inventory.AUTHORITY_LOCKS["executionAuthorized"] = True

    def test_source_is_independent_of_every_producer_module(self) -> None:
        source = MODULE_PATH.read_text(encoding="utf-8")
        self.assertNotIn("nhm2-boson-star-seed/producer", source)
        self.assertNotIn("nhm2_boson_star_seed.producer", source)
        self.assertNotIn("from producer", source)
        self.assertNotIn("import producer", source)


if __name__ == "__main__":
    unittest.main()
