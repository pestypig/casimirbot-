from __future__ import annotations

import importlib.util
import math
import struct
import sys
import unittest
from hashlib import sha256
from pathlib import Path


HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("raw_inventory", HERE / "raw_inventory.py")
assert SPEC is not None and SPEC.loader is not None
raw_inventory = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = raw_inventory
SPEC.loader.exec_module(raw_inventory)


def _zeros(size: int) -> bytes:
    return bytes(size)


def _input() -> dict[str, object]:
    files: list[dict[str, object]] = []
    for descriptor in raw_inventory.FILE_DESCRIPTORS:
        payload = _zeros(descriptor.size_bytes)
        files.append(
            {
                "fileOrdinal": descriptor.file_ordinal,
                "path": descriptor.path,
                "role": descriptor.role,
                "shape": list(descriptor.shape),
                "sizeBytes": descriptor.size_bytes,
                "sha256": sha256(payload).hexdigest(),
                "bytes": payload,
            }
        )
    return {
        "contractVersion": raw_inventory.INPUT_CONTRACT_VERSION,
        "candidateId": raw_inventory.CANDIDATE_ID,
        "schemaBinding": raw_inventory.schema_binding(),
        "files": files,
    }


def _replace_word(
    input_value: dict[str, object], file_ordinal: int, word: int
) -> None:
    files = input_value["files"]
    assert type(files) is list
    observation = files[file_ordinal]
    assert type(observation) is dict
    payload = bytearray(observation["bytes"])
    struct.pack_into("<Q", payload, 0, word)
    immutable = bytes(payload)
    observation["bytes"] = immutable
    observation["sha256"] = sha256(immutable).hexdigest()


class IndependentRawInventoryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.valid = _input()

    def test_exact_inventory_and_aggregate(self) -> None:
        descriptors = raw_inventory.FILE_DESCRIPTORS
        self.assertEqual(len(descriptors), 68)
        self.assertEqual(sum(item.size_bytes for item in descriptors), 6_693_376)
        self.assertEqual(descriptors[0].shape, (64, 64, 100))
        self.assertEqual(descriptors[67].role, "constraint_operand.level_2.jacobi.absolute_uncertainty95")
        self.assertEqual(len(raw_inventory.NONNEGATIVE_FILE_ORDINALS), 18)
        self.assertEqual(
            raw_inventory.schema_binding()["artifactId"],
            "nhm2.spherical_boson_star_v2_raw_replay_schema",
        )
        self.assertEqual(
            raw_inventory.schema_binding()["contractVersion"],
            "nhm2_spherical_boson_star_v2_raw_replay_schema/v1",
        )

    def test_accepts_exact_zero_fixture_without_unlocking_authority(self) -> None:
        receipt = raw_inventory.admit_raw_inventory(self.valid)
        self.assertEqual(receipt.disposition, "accepted")
        self.assertTrue(receipt.calculation_ready)
        self.assertEqual(len(receipt.raw_hash_bindings), 68)
        self.assertRegex(receipt.raw_hash_closure_sha256 or "", r"^[a-f0-9]{64}$")
        self.assertTrue(all(value is False for value in receipt.authority_boundary.values()))
        self.assertEqual(raw_inventory.get_admitted_float64_length(receipt, 0), 409_600)
        self.assertEqual(
            raw_inventory.get_admitted_raw_sha256(receipt, 4),
            receipt.raw_hash_bindings[4]["sha256"],
        )
        self.assertEqual(raw_inventory.read_admitted_float64(receipt, 67, 255), 0.0)

    def test_hash_failure_precedes_nonfinite_scan(self) -> None:
        value = _input()
        _replace_word(value, 0, 0x7FF8000000000001)
        files = value["files"]
        assert type(files) is list and type(files[0]) is dict
        files[0]["sha256"] = "0" * 64
        receipt = raw_inventory.admit_raw_inventory(value)
        self.assertEqual(receipt.first_blocker, "file_sha256_mismatch")

    def test_nonfinite_precedes_negative_zero_globally(self) -> None:
        value = _input()
        _replace_word(value, 1, 0x8000000000000000)
        _replace_word(value, 67, 0x7FF0000000000000)
        receipt = raw_inventory.admit_raw_inventory(value)
        self.assertEqual(receipt.first_blocker, "decoded_nonfinite")

    def test_negative_zero_precedes_role_sensitive_negative(self) -> None:
        value = _input()
        _replace_word(value, 1, 0xBFF0000000000000)
        _replace_word(value, 67, 0x8000000000000000)
        receipt = raw_inventory.admit_raw_inventory(value)
        self.assertEqual(receipt.first_blocker, "decoded_negative_zero")

    def test_role_sensitive_negative_is_rejected_but_computed_negative_is_allowed(self) -> None:
        negative_uncertainty = _input()
        _replace_word(negative_uncertainty, 1, 0xBFF0000000000000)
        rejected = raw_inventory.admit_raw_inventory(negative_uncertainty)
        self.assertEqual(rejected.first_blocker, "decoded_role_sensitive_negative")

        negative_computed = _input()
        _replace_word(negative_computed, 5, 0xBFF0000000000000)
        accepted = raw_inventory.admit_raw_inventory(negative_computed)
        self.assertEqual(accepted.disposition, "accepted")
        self.assertEqual(raw_inventory.read_admitted_float64(accepted, 5, 0), -1.0)

    def test_descriptor_and_bytes_subclass_fail_closed(self) -> None:
        wrong_role = _input()
        files = wrong_role["files"]
        assert type(files) is list and type(files[2]) is dict
        files[2]["role"] = "noise_kernel"
        self.assertEqual(
            raw_inventory.admit_raw_inventory(wrong_role).first_blocker,
            "inventory_descriptor_mismatch",
        )

        class BytesSubclass(bytes):
            pass

        subclassed = _input()
        subclassed_files = subclassed["files"]
        assert type(subclassed_files) is list and type(subclassed_files[0]) is dict
        subclassed_files[0]["bytes"] = BytesSubclass(subclassed_files[0]["bytes"])
        self.assertEqual(
            raw_inventory.admit_raw_inventory(subclassed).first_blocker,
            "file_bytes_invalid",
        )

    def test_hostile_ingress_values_are_rejected_before_comparison(self) -> None:
        class EqualityTrap:
            calls = 0

            def __eq__(self, _other: object) -> bool:
                type(self).calls += 1
                raise AssertionError("hostile equality must not run")

            def __ne__(self, _other: object) -> bool:
                type(self).calls += 1
                raise AssertionError("hostile inequality must not run")

        hostile_contract = _input()
        hostile_contract["contractVersion"] = EqualityTrap()
        self.assertEqual(
            raw_inventory.admit_raw_inventory(hostile_contract).first_blocker,
            "input_shape_invalid",
        )

        hostile_role = _input()
        files = hostile_role["files"]
        assert type(files) is list and type(files[0]) is dict
        files[0]["role"] = EqualityTrap()
        self.assertEqual(
            raw_inventory.admit_raw_inventory(hostile_role).first_blocker,
            "inventory_descriptor_mismatch",
        )
        self.assertEqual(EqualityTrap.calls, 0)

    def test_forged_receipt_has_no_private_inventory(self) -> None:
        genuine = raw_inventory.admit_raw_inventory(self.valid)
        forged = raw_inventory.Receipt(
            artifact_id=genuine.artifact_id,
            contract_version=genuine.contract_version,
            server_owned=True,
            independent_implementation=True,
            diagnostic_only=True,
            calculation_only=True,
            disposition="accepted",
            calculation_ready=True,
            first_blocker=None,
            blockers=(),
            candidate_id=raw_inventory.CANDIDATE_ID,
            raw_hash_closure_sha256=genuine.raw_hash_closure_sha256,
            raw_hash_bindings=genuine.raw_hash_bindings,
            authority_boundary=genuine.authority_boundary,
        )
        self.assertTrue(raw_inventory.has_private_admitted_inventory(genuine))
        self.assertFalse(raw_inventory.has_private_admitted_inventory(forged))
        self.assertIsNone(raw_inventory.read_admitted_float64(forged, 0, 0))
        self.assertIsNone(raw_inventory.get_admitted_float64_length(forged, 0))
        self.assertIsNone(raw_inventory.get_admitted_raw_sha256(forged, 0))

    def test_source_is_stdlib_only_and_contains_no_solver_import(self) -> None:
        source = (HERE / "raw_inventory.py").read_text(encoding="utf-8")
        for forbidden in ("numpy", "scipy", "producer", "content-replay"):
            self.assertNotIn(forbidden, source.lower())
        self.assertFalse(math.isnan(raw_inventory.read_admitted_float64(
            raw_inventory.admit_raw_inventory(self.valid), 0, 0
        )))


if __name__ == "__main__":
    unittest.main()
