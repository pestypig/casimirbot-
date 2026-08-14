from __future__ import annotations

import ast
from hashlib import sha256
import json
from pathlib import Path
import struct
import sys
import unittest


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import canonical_json
import descriptor
import hash_graph


PAYLOADS = (
    ("scalars.f64le", "primary_scalar_operands", 9, 72),
    ("coefficients/core_L2_u.f64le", "primary_L2_scalar_Chebyshev_coefficients", 128, 1024),
    ("coefficients/core_L2_V.f64le", "primary_L2_potential_Chebyshev_coefficients", 128, 1024),
    ("coefficients/tail_H.f64le", "primary_tail_H_Chebyshev_coefficients", 32, 256),
    ("coefficients/tail_Q.f64le", "primary_tail_Q_Chebyshev_coefficients", 32, 256),
)


def raw_binding(path: str, media_type: str = "application/json") -> dict[str, object]:
    return {"mediaType": media_type, "path": path, "sha256": sha256(path.encode()).hexdigest(), "sizeBytes": 1}


def file_stat(path: str) -> dict[str, object]:
    return {
        "changeTimeNanoseconds": "1",
        "device": "2",
        "inode": "3",
        "modeOctal": "0600",
        "modifyTimeNanoseconds": "4",
        "sha256": sha256(path.encode()).hexdigest(),
        "sizeBytes": 1,
    }


def fixture() -> dict[str, object]:
    ordered = []
    for path, role, count, size in PAYLOADS:
        raw_hash = sha256(("raw:" + path).encode()).hexdigest()
        payload = hash_graph.PayloadHashInput(path, size, raw_hash)
        ordered.append({
            "elementCount": count,
            "elementType": "IEEE754_binary64_little_endian",
            "path": path,
            "payloadSha256": hash_graph.payload_binding_sha256(payload),
            "rawSha256": raw_hash,
            "semanticRole": role,
            "sizeBytes": size,
        })
    policies = {}
    for role, expected in descriptor._EXPECTED_POLICIES.items():
        policies[role] = {
            "artifactId": expected[0], "canonicalSizeBytes": expected[1],
            "policyVersion": expected[2], "sha256": expected[3], "sha256Domain": expected[4],
        }
    return {
        "attemptOrdinal": 1,
        "authorityFalse": True,
        "candidateId": descriptor.SOURCE_CANDIDATE_ID,
        "orderedPayloadBindings": ordered,
        "policyBindings": policies,
        "provenance": {
            "commandArgv": ["/opt/nhm2/producer", "--once"],
            "commit40": "1" * 40,
            "dirtyTreeDigestSha256": "2" * 64,
            "executableBinding": raw_binding("bin/producer", "application/octet-stream"),
            "freshnessObservations": [
                {
                    "path": path,
                    "postread": file_stat(path),
                    "preopen": file_stat(path),
                    "stable": True,
                }
                for path in sorted(
                    (
                        "bin/producer",
                        "preseal.json",
                        "runtime.json",
                        "source.json",
                        "toolchain.json",
                    ),
                    key=lambda item: item.encode("utf-8"),
                )
            ],
            "outputRootIdentitySha256": "3" * 64,
            "preexecutionPresealBinding": raw_binding("preseal.json"),
            "runtimeManifestBinding": raw_binding("runtime.json"),
            "sourceManifestBinding": raw_binding("source.json"),
            "timing": {
                "monotonicElapsedNanoseconds": "5", "monotonicEndNanoseconds": "15",
                "monotonicStartNanoseconds": "10", "wallEndUtc": "2026-08-13T20:00:01.000000000Z",
                "wallStartUtc": "2026-08-13T20:00:00.000000000Z",
            },
            "toolchainManifestBinding": raw_binding("toolchain.json"),
        },
        "schemaVersion": descriptor.DESCRIPTOR_SCHEMA_VERSION,
    }


def parse(value: dict[str, object]) -> canonical_json.CanonicalJsonDocument:
    raw = json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode()
    return canonical_json.parse_canonical_json_bytes(raw, "descriptor")


class DescriptorTests(unittest.TestCase):
    def test_validates_source_descriptor_and_recomputes_all_closed_hashes(self) -> None:
        document = parse(fixture())
        result = descriptor.validate_source_descriptor(document)
        self.assertEqual(result.source_candidate_id, descriptor.SOURCE_CANDIDATE_ID)
        self.assertEqual(result.descriptor_sha256, hash_graph.descriptor_sha256(document.raw_bytes))
        self.assertEqual(result.source_input_binding_sha256, hash_graph.input_binding_sha256(result.descriptor_sha256, result.payloads))
        self.assertTrue(result.provenance_structurally_valid)
        self.assertFalse(result.provenance_authoritative)
        self.assertFalse(result.v2_candidate_binding_present)

    def test_rejects_policy_candidate_payload_hash_shape_and_forbidden_roles(self) -> None:
        mutations = (
            (lambda x: x.__setitem__("candidateId", "nhm2.v2"), "source_candidate_id_mismatch"),
            (lambda x: x["policyBindings"]["semanticSeed"].__setitem__("sha256", "0" * 64), "policy_binding_mismatch"),
            (lambda x: x["orderedPayloadBindings"][0].__setitem__("sizeBytes", 8), "numeric_payload_hash_or_shape_mismatch"),
            (lambda x: x["orderedPayloadBindings"][0].__setitem__("payloadSha256", "0" * 64), "numeric_payload_hash_or_shape_mismatch"),
            (lambda x: x["provenance"]["executableBinding"].__setitem__("path", "declared_lever_tensor"), "forbidden_lever_or_tile_role"),
        )
        for mutate, code in mutations:
            value = fixture()
            mutate(value)
            with self.subTest(code=code):
                with self.assertRaises(Exception) as caught:
                    descriptor.validate_source_descriptor(parse(value))
                self.assertIn(code, str(caught.exception))

    def test_rejects_bad_timing_and_wrong_document_profile(self) -> None:
        value = fixture()
        value["provenance"]["timing"]["monotonicElapsedNanoseconds"] = "6"
        with self.assertRaisesRegex(descriptor.DescriptorError, "command_or_timing_mismatch"):
            descriptor.validate_source_descriptor(parse(value))
        document = parse(fixture())
        object.__setattr__(document, "document_class", "manifest")
        with self.assertRaises(descriptor.DescriptorError):
            descriptor.validate_source_descriptor(document)

    def test_rejects_forged_canonical_document_fields(self) -> None:
        mutations = (
            ("raw_bytes", b"{}"),
            ("plain_sha256", "0" * 64),
            ("root", canonical_json.FrozenJsonObject(())),
            ("node_count", 0),
            ("token_count", 0),
        )
        for field, replacement in mutations:
            document = parse(fixture())
            object.__setattr__(document, field, replacement)
            with self.subTest(field=field):
                with self.assertRaisesRegex(
                    descriptor.DescriptorError, "descriptor_document_binding_mismatch"
                ):
                    descriptor.validate_source_descriptor(document)

    def test_rejects_impossible_rfc3339_utc_timestamps(self) -> None:
        replacements = (
            "2026-13-13T20:00:00.000000000Z",
            "2026-02-30T20:00:00.000000000Z",
            "2026-08-13T24:00:00.000000000Z",
            "2026-08-13T20:60:00.000000000Z",
            "2026-08-13T20:00:60.000000000Z",
            "2026-08-13T20:00:61.000000000Z",
        )
        for replacement in replacements:
            value = fixture()
            value["provenance"]["timing"]["wallStartUtc"] = replacement
            with self.subTest(replacement=replacement):
                with self.assertRaisesRegex(
                    descriptor.DescriptorError, "json_schema_mismatch"
                ):
                    descriptor.validate_source_descriptor(parse(value))

    def test_rejects_unstable_or_unsorted_freshness_observations(self) -> None:
        value = fixture()
        value["provenance"]["freshnessObservations"][0]["postread"]["inode"] = "4"
        with self.assertRaisesRegex(descriptor.DescriptorError, "freshness_mismatch"):
            descriptor.validate_source_descriptor(parse(value))

        value = fixture()
        second = {
            "path": "INPUT/A",
            "postread": file_stat("INPUT/A"),
            "preopen": file_stat("INPUT/A"),
            "stable": True,
        }
        value["provenance"]["freshnessObservations"].append(second)
        value["provenance"]["freshnessObservations"].sort(key=lambda item: item["path"].encode())
        with self.assertRaisesRegex(descriptor.DescriptorError, "freshness_mismatch"):
            descriptor.validate_source_descriptor(parse(value))

        value = fixture()
        observation = next(
            item
            for item in value["provenance"]["freshnessObservations"]
            if item["path"] == "source.json"
        )
        observation["preopen"]["sha256"] = "0" * 64
        observation["postread"]["sha256"] = "0" * 64
        observation["preopen"]["sizeBytes"] = 2
        observation["postread"]["sizeBytes"] = 2
        with self.assertRaisesRegex(descriptor.DescriptorError, "freshness_mismatch"):
            descriptor.validate_source_descriptor(parse(value))

    def test_rejects_syntactically_valid_unregistered_or_wrong_role_media(self) -> None:
        cases = (
            ("sourceManifestBinding", "x/y"),
            ("sourceManifestBinding", "application/octet-stream"),
            ("executableBinding", "application/json"),
        )
        for binding, media_type in cases:
            value = fixture()
            value["provenance"][binding]["mediaType"] = media_type
            with self.subTest(binding=binding, media_type=media_type):
                with self.assertRaisesRegex(
                    descriptor.DescriptorError, "json_schema_mismatch"
                ):
                    descriptor.validate_source_descriptor(parse(value))

    def test_rejects_noncanonical_paths_and_media_types(self) -> None:
        cases = (
            ("sourceManifestBinding", "path", "../source.json"),
            ("sourceManifestBinding", "path", "/source.json"),
            ("sourceManifestBinding", "path", "source\\manifest.json"),
            ("sourceManifestBinding", "path", "source//manifest.json"),
            ("sourceManifestBinding", "path", "source/e\u0301.json"),
            ("sourceManifestBinding", "mediaType", "not a media type"),
        )
        for binding, field, replacement in cases:
            value = fixture()
            value["provenance"][binding][field] = replacement
            with self.subTest(replacement=replacement):
                with self.assertRaisesRegex(descriptor.DescriptorError, "json_schema_mismatch"):
                    descriptor.validate_source_descriptor(parse(value))

        value = fixture()
        value["provenance"]["freshnessObservations"] = list(
            reversed(value["provenance"]["freshnessObservations"])
        )
        with self.assertRaisesRegex(descriptor.DescriptorError, "freshness_mismatch"):
            descriptor.validate_source_descriptor(parse(value))

    def test_result_and_locks_are_immutable_and_authority_false(self) -> None:
        result = descriptor.validate_source_descriptor(parse(fixture()))
        with self.assertRaises((AttributeError, TypeError)):
            result.source_candidate_id = "changed"  # type: ignore[misc]
        with self.assertRaises(TypeError):
            descriptor.AUTHORITY_LOCKS["executionAuthorized"] = True  # type: ignore[index]
        self.assertFalse(any(descriptor.AUTHORITY_LOCKS.values()))

    def test_source_is_independent_and_contains_no_v2_identity_mapping(self) -> None:
        source_path = HERE / "descriptor.py"
        source = source_path.read_text(encoding="utf-8")
        tree = ast.parse(source)
        imports: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imports.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imports.add(node.module.split(".")[0])
        self.assertEqual(imports, {"__future__", "canonical_json", "dataclasses", "datetime", "forbidden_roles", "hash_graph", "re", "types", "typing", "unicodedata"})
        for forbidden in ("producer", "numpy", "typescript", "semiclassical_v2.spherical"):
            self.assertNotIn(forbidden, source.lower())


if __name__ == "__main__":
    unittest.main()
