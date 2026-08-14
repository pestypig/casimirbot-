from __future__ import annotations

import ast
from hashlib import sha256
from pathlib import Path
import struct
import sys
import unittest


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import hash_graph as graph


PATHS_AND_SIZES = (
    ("scalars.f64le", 72),
    ("coefficients/core_L2_u.f64le", 1024),
    ("coefficients/core_L2_V.f64le", 1024),
    ("coefficients/tail_H.f64le", 256),
    ("coefficients/tail_Q.f64le", 256),
)


def payloads() -> tuple[graph.PayloadHashInput, ...]:
    return tuple(
        graph.PayloadHashInput(path, size, sha256(path.encode()).hexdigest())
        for path, size in PATHS_AND_SIZES
    )


class HashGraphTests(unittest.TestCase):
    def test_payload_descriptor_and_input_hashes_follow_literal_preimages(self) -> None:
        first = payloads()[0]
        path = first.path.encode()
        expected_payload = sha256(
            graph.PAYLOAD_BINDING_DOMAIN
            + struct.pack("<Q", len(path))
            + path
            + struct.pack("<Q", first.size_bytes)
            + bytes.fromhex(first.raw_sha256)
        ).hexdigest()
        self.assertEqual(graph.payload_binding_sha256(first), expected_payload)

        descriptor = b'{"authorityFalse":true}'
        expected_descriptor = sha256(
            graph.DESCRIPTOR_HASH_DOMAIN
            + struct.pack("<Q", len(descriptor))
            + descriptor
        ).hexdigest()
        self.assertEqual(graph.descriptor_sha256(descriptor), expected_descriptor)

        preimage = bytearray(graph.INPUT_BINDING_DOMAIN)
        preimage.extend(bytes.fromhex(expected_descriptor))
        for item in payloads():
            encoded = item.path.encode()
            preimage.extend(struct.pack("<Q", len(encoded)))
            preimage.extend(encoded)
            preimage.extend(struct.pack("<Q", item.size_bytes))
            preimage.extend(bytes.fromhex(item.raw_sha256))
        self.assertEqual(
            graph.input_binding_sha256(expected_descriptor, payloads()),
            sha256(preimage).hexdigest(),
        )

    def test_manifest_and_output_root_hashes_follow_literal_preimages(self) -> None:
        entries = (b'{"path":"a"}', b'{"path":"b"}')
        expected = sha256(
            graph.MANIFEST_AGGREGATE_DOMAIN
            + struct.pack("<Q", 2)
            + struct.pack("<Q", len(entries[0]))
            + entries[0]
            + struct.pack("<Q", len(entries[1]))
            + entries[1]
        ).hexdigest()
        self.assertEqual(graph.manifest_aggregate_sha256(entries), expected)
        root = "/run/nhm2-spherical/primary"
        encoded = root.encode()
        self.assertEqual(
            graph.output_root_identity_sha256(root),
            sha256(
                graph.OUTPUT_ROOT_IDENTITY_DOMAIN
                + struct.pack("<Q", len(encoded))
                + encoded
            ).hexdigest(),
        )
        # The frozen hash recipe consumes exact predeclared UTF-8 bytes. Path
        # admission is a separate successor-profile duty, so this primitive
        # must not invent a filesystem grammar or Unicode normalization rule.
        for opaque_root in ("relative", "/", "/a/", "/a//b", "/a/../b"):
            encoded_opaque = opaque_root.encode()
            self.assertEqual(
                graph.output_root_identity_sha256(opaque_root),
                sha256(
                    graph.OUTPUT_ROOT_IDENTITY_DOMAIN
                    + struct.pack("<Q", len(encoded_opaque))
                    + encoded_opaque
                ).hexdigest(),
            )

    def test_rejects_spoofed_containers_paths_hashes_sizes_and_limits(self) -> None:
        class TupleSubclass(tuple):
            pass

        valid = payloads()
        with self.assertRaisesRegex(graph.HashGraphError, "primary_payload_tuple"):
            graph.input_binding_sha256("0" * 64, TupleSubclass(valid))
        with self.assertRaisesRegex(graph.HashGraphError, "inventory"):
            graph.input_binding_sha256(
                "0" * 64,
                (graph.PayloadHashInput("wrong.f64le", 72, "0" * 64),)
                + valid[1:],
            )
        for invalid_path in (
            "../escape",
            "/absolute",
            "a\\b",
            "a//b",
            "e\u0301.f64le",
            "a/" + "b" * 256,
        ):
            with self.subTest(path=invalid_path):
                with self.assertRaises(graph.HashGraphError):
                    graph.PayloadHashInput(invalid_path, 1, "0" * 64)
        for invalid_hash in ("A" * 64, "0" * 63, "g" * 64):
            with self.assertRaises(graph.HashGraphError):
                graph.PayloadHashInput("a", 1, invalid_hash)
        for invalid_size in (True, -1, 1 << 53):
            with self.assertRaises(graph.HashGraphError):
                graph.PayloadHashInput("a", invalid_size, "0" * 64)
        with self.assertRaisesRegex(graph.HashGraphError, "manifest_entry_tuple"):
            graph.manifest_aggregate_sha256(tuple())

    def test_inputs_and_locks_are_transitively_immutable(self) -> None:
        item = payloads()[0]
        with self.assertRaises((AttributeError, TypeError)):
            item.path = "changed"  # type: ignore[misc]
        with self.assertRaises(TypeError):
            graph.AUTHORITY_LOCKS["executionAuthorized"] = True  # type: ignore[index]
        self.assertFalse(any(graph.AUTHORITY_LOCKS.values()))

    def test_source_is_stdlib_only_and_has_no_unclosed_hash_recipe(self) -> None:
        source_path = HERE / "hash_graph.py"
        tree = ast.parse(source_path.read_text(encoding="utf-8"))
        imports: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imports.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imports.add(node.module.split(".")[0])
        self.assertEqual(
            imports,
            {"__future__", "dataclasses", "hashlib", "struct", "types", "typing", "unicodedata"},
        )
        source = source_path.read_text(encoding="utf-8")
        for forbidden in (
            "command_argv_sha256",
            "static_input_aggregate_sha256",
            "dirty_tree_digest_sha256",
            "producer",
            "numpy",
            "typescript",
        ):
            self.assertNotIn(forbidden, source.lower())


if __name__ == "__main__":
    unittest.main()
