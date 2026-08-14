from __future__ import annotations

import ast
from pathlib import Path
import sys
import unittest


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import canonical_json
import forbidden_roles


def parse(raw: bytes) -> canonical_json.CanonicalJsonDocument:
    return canonical_json.parse_canonical_json_bytes(raw, "descriptor")


class ForbiddenRoleTests(unittest.TestCase):
    def test_accepts_unrelated_text_and_does_not_scan_non_role_values(self) -> None:
        document = parse(
            b'{"description":"historical lever discussion","path":"science/input.json"}'
        )
        result = forbidden_roles.scan_document_for_forbidden_roles(document)
        self.assertTrue(result.accepted)
        self.assertEqual(result.visited_nodes, document.node_count)

    def test_rejects_exact_tokens_identifier_segments_and_nfkc_confusables(self) -> None:
        cases = (
            (b'{"declaredLeverTensor":false}', "/declaredLeverTensor"),
            (b'{"safe":{"tile-role":false}}', "/safe/tile-role"),
            (b'{"path":"inputs/lever/data"}', "/path"),
            (b'{"role":"warp_control_tensor"}', "/role"),
            ('{"role":"\uff4c\uff45\uff56\uff45\uff52"}'.encode("utf-8"), "/role"),
            (b'{"name":["safe","tile_tensor"]}', "/name/1"),
        )
        for raw, pointer in cases:
            with self.subTest(raw=raw):
                with self.assertRaises(forbidden_roles.ForbiddenRoleError) as caught:
                    forbidden_roles.scan_document_for_forbidden_roles(parse(raw))
                self.assertEqual(caught.exception.code, "forbidden_lever_or_tile_role")
                self.assertEqual(caught.exception.pointer, pointer)

    def test_role_key_matching_is_literal_and_arrays_inherit_role_bearing(self) -> None:
        forbidden_roles.scan_document_for_forbidden_roles(
            parse(b'{"Path":"lever","description":["tile"]}')
        )
        with self.assertRaises(forbidden_roles.ForbiddenRoleError) as caught:
            forbidden_roles.scan_document_for_forbidden_roles(
                parse(b'{"path":["safe",["lever"]]}')
            )
        self.assertEqual(caught.exception.pointer, "/path/1/0")

    def test_rejects_spoofed_document_and_node_count(self) -> None:
        document = parse(b'{"path":"safe"}')
        with self.assertRaises(TypeError):
            forbidden_roles.scan_document_for_forbidden_roles(object())  # type: ignore[arg-type]
        spoofed = object.__new__(canonical_json.CanonicalJsonDocument)
        object.__setattr__(spoofed, "document_class", document.document_class)
        object.__setattr__(spoofed, "raw_bytes", document.raw_bytes)
        object.__setattr__(spoofed, "plain_sha256", document.plain_sha256)
        object.__setattr__(spoofed, "root", document.root)
        object.__setattr__(spoofed, "node_count", 99)
        object.__setattr__(spoofed, "token_count", document.token_count)
        with self.assertRaisesRegex(TypeError, "node_count_invalid"):
            forbidden_roles.scan_document_for_forbidden_roles(spoofed)

        unordered_root = object.__new__(canonical_json.FrozenJsonObject)
        object.__setattr__(unordered_root, "items", (("z", 0), ("a", 0)))
        object.__setattr__(spoofed, "root", unordered_root)
        object.__setattr__(spoofed, "node_count", 3)
        with self.assertRaisesRegex(TypeError, "object_inventory_invalid"):
            forbidden_roles.scan_document_for_forbidden_roles(spoofed)

    def test_source_imports_only_the_independent_parser_and_stdlib(self) -> None:
        source_path = HERE / "forbidden_roles.py"
        source = source_path.read_text(encoding="utf-8")
        tree = ast.parse(source)
        imports: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imports.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imports.add(node.module.split(".")[0])
        self.assertEqual(
            imports,
            {"__future__", "canonical_json", "dataclasses", "re", "types", "typing", "unicodedata"},
        )
        for forbidden in ("producer", "numpy", "typescript", "subprocess", "importlib"):
            self.assertNotIn(forbidden, source.lower())
        self.assertFalse(any(forbidden_roles.AUTHORITY_LOCKS.values()))


if __name__ == "__main__":
    unittest.main()
