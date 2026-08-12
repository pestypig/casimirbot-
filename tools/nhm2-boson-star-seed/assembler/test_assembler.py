"""Bounded metadata/self-tests for the trusted assembler (no seed solver)."""

from __future__ import annotations

import copy
import hashlib
import pathlib
import struct
import unittest

import assembler


def _binding(profile_name: str, marker: str = "1") -> dict[str, object]:
    artifact_kind, domain = assembler.CONTROL_BINDING_PROFILES[profile_name]
    return {
        "bindingVersion": "nhm2.control_plane.domain_hash_binding/v1",
        "artifactKind": artifact_kind,
        "sha256Domain": domain,
        "sha256": marker * 64,
        "canonicalSizeBytes": 1,
    }


def _run_request_fixture() -> dict[str, object]:
    value: dict[str, object] = {
        "schemaVersion": "nhm2.prolate_boson_star.newtonian_seed.run_request/v1",
        "runPlanBinding": copy.deepcopy(assembler.RUN_PLAN_BINDING),
        "candidatePlanV2Binding": copy.deepcopy(assembler.CANDIDATE_PLAN_BINDING),
        "branchBvpV1Binding": copy.deepcopy(assembler.BRANCH_BVP_BINDING),
        "seedContractBinding": copy.deepcopy(assembler.SEED_CONTRACT_BINDING),
        "outputDescriptorSchemaBinding": copy.deepcopy(
            assembler.OUTPUT_DESCRIPTOR_SCHEMA_BINDING
        ),
        "proofReplayProtocolBinding": copy.deepcopy(
            assembler.PROOF_REPLAY_PROTOCOL_BINDING
        ),
        "verifierReplayBundleSchemaBinding": copy.deepcopy(
            assembler.REPLAY_BUNDLE_SCHEMA_BINDING
        ),
        "controlPlaneEvidenceGrammarRegistryBinding": copy.deepcopy(
            assembler.CONTROL_PLANE_REGISTRY_BINDING
        ),
        "producerOciImageDigest": "sha256:" + "2" * 64,
        "verifierOciImageDigest": "sha256:" + "3" * 64,
        "assemblerOciImageDigest": "sha256:" + "4" * 64,
    }
    for field, profile in assembler.RUN_REQUEST_PROFILE_FIELDS.items():
        value[field] = _binding(profile)
    return value


class CanonicalJsonTests(unittest.TestCase):
    def test_ecmascript_number_boundaries(self) -> None:
        self.assertEqual(assembler.canonical_json_text(1e-7), "1e-7")
        self.assertEqual(assembler.canonical_json_text(1e-6), "0.000001")
        self.assertEqual(assembler.canonical_json_text(1e20), "100000000000000000000")
        self.assertEqual(assembler.canonical_json_text(1e21), "1e+21")
        self.assertEqual(assembler.canonical_json_text(-0.5), "-0.5")

    def test_exact_canonical_round_trip(self) -> None:
        raw = b'{"a":[0,0.000001,1e+21],"b":"utf8-\xe2\x9c\x93"}'
        value = assembler.parse_exact_canonical_json(raw, 1024, "test")
        self.assertEqual(assembler.canonical_json_bytes(value), raw)

    def test_rejects_noncanonical_duplicate_and_negative_zero(self) -> None:
        bad_values = (
            b'{"b":1,"a":2}',
            b'{"a":1, "b":2}',
            b'{"a":1,"a":1}',
            b'{"a":-0}',
            b'{"a":-0.0}',
            b'\xef\xbb\xbf{}',
        )
        for raw in bad_values:
            with self.subTest(raw=raw), self.assertRaises(assembler.AssemblyError):
                assembler.parse_exact_canonical_json(raw, 1024, "test")


class FrozenContractTests(unittest.TestCase):
    def test_null_closed_schema_authority_fails_before_assembly(self) -> None:
        self.assertIsNone(assembler.EXECUTABLE_CLOSED_SCHEMA_AUTHORITY_BINDING)
        with self.assertRaisesRegex(
            assembler.AssemblyError,
            "^closed_schema_typed_interpreter_authority_absent$",
        ):
            assembler.require_executable_closed_schema_authority()

    def test_exact_inventory_totals_and_paths(self) -> None:
        self.assertEqual(len(assembler.FROZEN_ARRAY_INVENTORY), 32)
        self.assertEqual(
            sum(item["elementCount"] for item in assembler.FROZEN_ARRAY_INVENTORY),
            810288,
        )
        self.assertEqual(
            sum(item["byteLength"] for item in assembler.FROZEN_ARRAY_INVENTORY),
            6482304,
        )
        self.assertEqual(len(set(assembler.ARRAY_PATHS)), 32)
        self.assertEqual(
            assembler.ARRAY_PATHS[0], "arrays/L0/00-rho_nodes.f64le"
        )
        self.assertEqual(
            assembler.ARRAY_PATHS[-1],
            "arrays/AUDIT/07-multipole_potential_even.f64le",
        )
        self.assertEqual(len(assembler.BASE_INPUT_PATHS), 8)
        self.assertEqual(
            assembler.BASE_INPUT_PATHS[0], "00-seed-run-request.v1.json"
        )

    def test_hash_bound_canonical_base_input(self) -> None:
        raw = b'{"a":1}'
        domain = "fixture/v1\n"
        binding = {
            "sha256Domain": domain,
            "sha256": hashlib.sha256(domain.encode("utf-8") + raw).hexdigest(),
            "canonicalSizeBytes": len(raw),
        }
        self.assertEqual(
            assembler.validate_hash_bound_canonical_input(raw, binding, "fixture"),
            {"a": 1},
        )
        altered = dict(binding, sha256="0" * 64)
        with self.assertRaises(assembler.AssemblyError):
            assembler.validate_hash_bound_canonical_input(raw, altered, "fixture")

    def test_array_hash_recipe_is_length_delimited_and_domain_separated(self) -> None:
        path = "arrays/L0/00-rho_nodes.f64le"
        role = "newtonian_seed.grid.rho_nodes"
        raw = b"tiny-fixture"
        expected = hashlib.sha256(
            assembler.ARRAY_HASH_DOMAIN.encode("utf-8")
            + struct.pack(">Q", len(path.encode("utf-8")))
            + path.encode("utf-8")
            + struct.pack(">Q", len(role.encode("utf-8")))
            + role.encode("utf-8")
            + struct.pack(">Q", len(raw))
            + raw
        ).hexdigest()
        self.assertEqual(assembler.array_digest(path, role, raw), expected)

    def test_exact_observed_inventory_accepts_only_hash_extension(self) -> None:
        inventory = [
            {**copy.deepcopy(item), "sha256": f"{index:064x}"}
            for index, item in enumerate(assembler.FROZEN_ARRAY_INVENTORY)
        ]
        validated = assembler.validate_observed_inventory(inventory)
        self.assertEqual(validated, inventory)
        altered = copy.deepcopy(inventory)
        altered[7]["byteLength"] += 8
        with self.assertRaises(assembler.AssemblyError):
            assembler.validate_observed_inventory(altered)

    def test_run_request_frozen_bindings_and_profiles(self) -> None:
        request = _run_request_fixture()
        raw = assembler.canonical_json_bytes(request)
        parsed = assembler.parse_exact_canonical_json(raw, 1024 * 1024, "request")
        validated = assembler.validate_run_request(parsed, raw)
        self.assertEqual(
            validated["_computedBinding"],
            assembler.domain_binding(raw, "seedRunRequest"),
        )
        altered = copy.deepcopy(request)
        altered["runPlanBinding"]["sha256"] = "0" * 64
        altered_raw = assembler.canonical_json_bytes(altered)
        with self.assertRaises(assembler.AssemblyError):
            assembler.validate_run_request(altered, altered_raw)

    def test_descriptor_projection_has_exact_static_surface(self) -> None:
        replay = {
            "serverRecomputedScalarMetadata": {"fixture": 1},
            "serverRecomputedGateReport": {"fixture": 2},
            "continuousNodelessProofReceipt": {"fixture": 3},
            "continuousPeakProofReceipt": {"fixture": 4},
            "numericalOriginSeriesDefectReceipt": {"fixture": 5},
            "observedArrayInventory": [],
        }
        descriptor = assembler._build_descriptor(replay)
        self.assertEqual(descriptor["arrayCount"], 32)
        self.assertEqual(descriptor["float64ElementCount"], 810288)
        self.assertEqual(descriptor["arrayByteLength"], 6482304)
        self.assertEqual(descriptor["levelOrder"], ["L0", "L1", "L2", "AUDIT"])
        raw = assembler.canonical_json_bytes(descriptor)
        self.assertEqual(
            assembler.parse_exact_canonical_json(raw, 16 * 1024 * 1024, "descriptor"),
            descriptor,
        )

    def test_runtime_source_has_no_execution_or_network_imports(self) -> None:
        source = pathlib.Path(assembler.__file__).read_text(encoding="utf-8")
        for forbidden in (
            "import socket",
            "from socket",
            "import subprocess",
            "from subprocess",
            "os.system(",
            "os.popen(",
        ):
            self.assertNotIn(forbidden, source)


if __name__ == "__main__":
    unittest.main()
