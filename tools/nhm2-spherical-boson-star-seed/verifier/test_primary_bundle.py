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
import f64le_inventory
import hash_graph
import primary_bundle


def raw_binding(
    path: str, media_type: str = "application/json"
) -> dict[str, object]:
    return {
        "mediaType": media_type,
        "path": path,
        "sha256": sha256(path.encode()).hexdigest(),
        "sizeBytes": 1,
    }


def stat(path: str) -> dict[str, object]:
    return {
        "changeTimeNanoseconds": "1",
        "device": "2",
        "inode": "3",
        "modeOctal": "0600",
        "modifyTimeNanoseconds": "4",
        "sha256": sha256(path.encode()).hexdigest(),
        "sizeBytes": 1,
    }


def fixture() -> tuple[canonical_json.CanonicalJsonDocument, tuple[tuple[str, bytes], ...]]:
    payloads = tuple(
        (spec.path, struct.pack("<d", 0.0) * spec.element_count)
        for spec in f64le_inventory.PRIMARY_PAYLOAD_SPECS
    )
    bindings = []
    for spec, (_path, raw) in zip(
        f64le_inventory.PRIMARY_PAYLOAD_SPECS, payloads, strict=True
    ):
        raw_hash = sha256(raw).hexdigest()
        item = hash_graph.PayloadHashInput(spec.path, spec.size_bytes, raw_hash)
        bindings.append(
            {
                "elementCount": spec.element_count,
                "elementType": "IEEE754_binary64_little_endian",
                "path": spec.path,
                "payloadSha256": hash_graph.payload_binding_sha256(item),
                "rawSha256": raw_hash,
                "semanticRole": spec.semantic_role,
                "sizeBytes": spec.size_bytes,
            }
        )
    policies = {
        role: {
            "artifactId": values[0],
            "canonicalSizeBytes": values[1],
            "policyVersion": values[2],
            "sha256": values[3],
            "sha256Domain": values[4],
        }
        for role, values in descriptor._EXPECTED_POLICIES.items()
    }
    provenance_paths = (
        "bin/producer",
        "preseal.json",
        "runtime.json",
        "source.json",
        "toolchain.json",
    )
    value = {
        "attemptOrdinal": 1,
        "authorityFalse": True,
        "candidateId": descriptor.SOURCE_CANDIDATE_ID,
        "orderedPayloadBindings": bindings,
        "policyBindings": policies,
        "provenance": {
            "commandArgv": ["/opt/nhm2/producer", "--once"],
            "commit40": "1" * 40,
            "dirtyTreeDigestSha256": "2" * 64,
            "executableBinding": raw_binding(
                "bin/producer", "application/octet-stream"
            ),
            "freshnessObservations": [
                {
                    "path": path,
                    "postread": stat(path),
                    "preopen": stat(path),
                    "stable": True,
                }
                for path in sorted(provenance_paths, key=lambda item: item.encode())
            ],
            "outputRootIdentitySha256": "3" * 64,
            "preexecutionPresealBinding": raw_binding("preseal.json"),
            "runtimeManifestBinding": raw_binding("runtime.json"),
            "sourceManifestBinding": raw_binding("source.json"),
            "timing": {
                "monotonicElapsedNanoseconds": "5",
                "monotonicEndNanoseconds": "15",
                "monotonicStartNanoseconds": "10",
                "wallEndUtc": "2026-08-13T20:00:01.000000000Z",
                "wallStartUtc": "2026-08-13T20:00:00.000000000Z",
            },
            "toolchainManifestBinding": raw_binding("toolchain.json"),
        },
        "schemaVersion": descriptor.DESCRIPTOR_SCHEMA_VERSION,
    }
    raw_json = json.dumps(
        value, ensure_ascii=False, separators=(",", ":"), sort_keys=True
    ).encode()
    return canonical_json.parse_canonical_json_bytes(raw_json, "descriptor"), payloads


class PrimaryBundleTests(unittest.TestCase):
    def test_validates_exact_descriptor_and_bound_raw_payloads(self) -> None:
        document, payloads = fixture()
        result = primary_bundle.validate_source_primary_bundle(document, payloads)
        self.assertEqual(result.source_candidate_id, descriptor.SOURCE_CANDIDATE_ID)
        self.assertEqual(len(result.operands.payloads), 5)
        self.assertFalse(result.v2_candidate_binding_present)
        self.assertFalse(result.provenance_authoritative)
        self.assertFalse(result.proof_duties_replayed)

    def test_hash_mismatch_precedes_nonfinite_and_negative_zero(self) -> None:
        document, payloads = fixture()
        entries = list(payloads)
        bad = bytearray(entries[0][1])
        bad[:8] = struct.pack("<d", float("nan"))
        bad[8:16] = struct.pack("<d", -0.0)
        entries[0] = (entries[0][0], bytes(bad))
        with self.assertRaisesRegex(Exception, "numeric_payload_hash_or_shape_mismatch"):
            primary_bundle.validate_source_primary_bundle(document, tuple(entries))

    def test_forbidden_descriptor_fails_before_hostile_payload_inventory(self) -> None:
        document, payloads = fixture()
        raw = json.loads(document.raw_bytes)
        raw["provenance"]["sourceManifestBinding"]["path"] = "declared_lever_tensor"
        bad_document = canonical_json.parse_canonical_json_bytes(
            json.dumps(raw, separators=(",", ":"), sort_keys=True).encode(),
            "descriptor",
        )
        with self.assertRaisesRegex(Exception, "forbidden_lever_or_tile_role"):
            primary_bundle.validate_source_primary_bundle(
                bad_document, object()  # type: ignore[arg-type]
            )
        self.assertEqual(len(payloads), 5)

    def test_result_and_authority_locks_are_immutable_false(self) -> None:
        result = primary_bundle.validate_source_primary_bundle(*fixture())
        with self.assertRaises((AttributeError, TypeError)):
            result.source_candidate_id = "changed"  # type: ignore[misc]
        self.assertFalse(any(primary_bundle.AUTHORITY_LOCKS.values()))
        with self.assertRaises(TypeError):
            primary_bundle.AUTHORITY_LOCKS["executionAuthorized"] = True  # type: ignore[index]

    def test_source_is_stdlib_and_verifier_primitive_only(self) -> None:
        source = (HERE / "primary_bundle.py").read_text(encoding="utf-8")
        tree = ast.parse(source)
        imports: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imports.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imports.add(node.module.split(".")[0])
        self.assertEqual(
            imports,
            {
                "__future__",
                "canonical_json",
                "dataclasses",
                "descriptor",
                "f64le_inventory",
                "hash_graph",
                "types",
                "typing",
            },
        )
        for forbidden in ("producer", "numpy", "scipy", "typescript"):
            self.assertNotIn(forbidden, source.lower())


if __name__ == "__main__":
    unittest.main()
