from __future__ import annotations

import ast
import importlib.util
from hashlib import sha256
from pathlib import Path
import sys
import unittest


MODULE_PATH = Path(__file__).with_name("canonical_json.py")
SPEC = importlib.util.spec_from_file_location("spherical_seed_canonical_json", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
canonical = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = canonical
SPEC.loader.exec_module(canonical)


GOLDEN_INTERVAL = (
    b'[{"direction":"RNDD","exponent2":-3,"mantissaLowercaseHex":"3",'
    b'"precisionBits":256,"sign":"minus"},{"direction":"RNDU",'
    b'"exponent2":-2,"mantissaLowercaseHex":"5","precisionBits":256,'
    b'"sign":"plus"}]'
)


class BytesSubclass(bytes):
    pass


class CanonicalJsonTests(unittest.TestCase):
    def test_accepts_the_frozen_interval_golden_and_freezes_it(self) -> None:
        document = canonical.parse_canonical_json_bytes(
            GOLDEN_INTERVAL, "proof_record"
        )
        self.assertEqual(
            document.plain_sha256,
            "f3a2e0aa81cd9c1df70f4164f6d7306b522e50b75b7cc977ca92e66604c12e45",
        )
        self.assertIsInstance(document.root, canonical.FrozenJsonArray)
        self.assertEqual(len(document.root), 2)
        self.assertEqual(document.document_class, "proof_record")
        self.assertEqual(document.node_count, 13)
        self.assertGreater(document.token_count, 0)
        lower = document.root.at(0)
        self.assertIsInstance(lower, canonical.FrozenJsonObject)
        self.assertEqual(lower.get("direction"), "RNDD")
        with self.assertRaises(canonical.CanonicalJsonError):
            lower.get("unknown")

    def test_rejects_noncanonical_but_decodable_encodings(self) -> None:
        candidates = (
            b' {"a":1}',
            b'{"a":1}\n',
            b'{"b":2,"a":1}',
            b'{"a":"\\u0061"}',
            b'{"a":"\\/"}',
        )
        for candidate in candidates:
            with self.subTest(candidate=candidate):
                with self.assertRaises(canonical.CanonicalJsonError) as caught:
                    canonical.parse_canonical_json_bytes(candidate, "descriptor")
                self.assertEqual(caught.exception.code, "json_not_rfc8785_canonical")

    def test_rejects_duplicate_keys_after_escape_decoding(self) -> None:
        with self.assertRaises(canonical.CanonicalJsonError) as caught:
            canonical.parse_canonical_json_bytes(
                b'{"a":1,"\\u0061":2}', "descriptor"
            )
        self.assertEqual(caught.exception.code, "json_duplicate_key")

    def test_rejects_forbidden_number_forms_and_ranges(self) -> None:
        cases = (
            (b"-0", "json_negative_zero_forbidden"),
            (b"1.0", "json_noninteger_number_forbidden"),
            (b"1e0", "json_noninteger_number_forbidden"),
            (b"NaN", "json_nonfinite_number_forbidden"),
            (b"9007199254740992", "json_safe_integer_range_exceeded"),
            (b"1" * 5_000, "json_safe_integer_range_exceeded"),
        )
        for raw, code in cases:
            with self.subTest(raw=raw):
                with self.assertRaises(canonical.CanonicalJsonError) as caught:
                    canonical.parse_canonical_json_bytes(raw, "descriptor")
                self.assertEqual(caught.exception.code, code)

    def test_uses_utf16_key_order_required_by_rfc8785(self) -> None:
        # U+1F600 sorts before U+E000 by UTF-16 code unit, although its scalar
        # value is numerically larger.
        raw = '{"😀":1,"\ue000":2}'.encode("utf-8")
        document = canonical.parse_canonical_json_bytes(raw, "descriptor")
        self.assertEqual(document.root.keys(), ("😀", "\ue000"))
        with self.assertRaises(canonical.CanonicalJsonError):
            canonical.parse_canonical_json_bytes(
                '{"\ue000":2,"😀":1}'.encode("utf-8"), "descriptor"
            )

    def test_enforces_type_size_depth_shape_and_string_limits(self) -> None:
        with self.assertRaises(canonical.CanonicalJsonError):
            canonical.parse_canonical_json_bytes(BytesSubclass(b"{}"), "descriptor")
        with self.assertRaises(canonical.CanonicalJsonError):
            canonical.parse_canonical_json_bytes(b"", "descriptor")
        with self.assertRaises(canonical.CanonicalJsonError):
            canonical.parse_canonical_json_bytes(
                b"[" * 33 + b"0" + b"]" * 33, "descriptor"
            )
        with self.assertRaises(canonical.CanonicalJsonError) as caught:
            canonical.parse_canonical_json_bytes(
                b"[" * 500 + b"0" + b"]" * 500, "descriptor"
            )
        self.assertEqual(caught.exception.code, "json_depth_limit_exceeded")
        too_many_properties = (
            "{" + ",".join(f'\"k{i:03d}\":0' for i in range(257)) + "}"
        ).encode("ascii")
        with self.assertRaises(canonical.CanonicalJsonError) as caught:
            canonical.parse_canonical_json_bytes(too_many_properties, "descriptor")
        self.assertEqual(caught.exception.code, "json_object_property_limit_exceeded")
        oversized_string = (b'"' + b"a" * 65_537 + b'"')
        with self.assertRaises(canonical.CanonicalJsonError) as caught:
            canonical.parse_canonical_json_bytes(oversized_string, "descriptor")
        self.assertEqual(caught.exception.code, "json_string_utf8_limit_exceeded")

    def test_rejects_invalid_utf8_bom_nul_and_unpaired_surrogate(self) -> None:
        cases = (
            b"\xff",
            b"\xef\xbb\xbf{}",
            b'"\\u0000"',
            b'"\\ud800"',
            b'{"\\ud800":1}',
            b'{"\\udc00":1}',
            b'{"x\\ud800":1}',
        )
        for raw in cases:
            with self.subTest(raw=raw):
                with self.assertRaises(canonical.CanonicalJsonError):
                    canonical.parse_canonical_json_bytes(raw, "descriptor")

    def test_plain_hash_and_authority_locks_are_exact(self) -> None:
        raw = b'{"a":[true,false,null,3],"b":"x"}'
        document = canonical.parse_canonical_json_bytes(raw, "descriptor")
        self.assertEqual(document.plain_sha256, sha256(raw).hexdigest())
        self.assertEqual(
            dict(canonical.AUTHORITY_LOCKS),
            {
                "implementationClosureComplete": False,
                "runtimeClosureComplete": False,
                "executionAuthorized": False,
                "executionObserved": False,
                "proofRecordsAccepted": False,
                "seedAccepted": False,
                "replayAuthority": False,
                "independentAgreement": False,
                "semiclassicalStressNoiseLamp": False,
                "semiclassicalConstraintAlgebraLamp": False,
                "physicalViability": False,
                "propulsion": False,
                "transport": False,
            },
        )
        with self.assertRaises(TypeError):
            canonical.AUTHORITY_LOCKS["executionAuthorized"] = True

    def test_source_is_independent_of_producer_and_typescript_runtime(self) -> None:
        source = MODULE_PATH.read_text(encoding="utf-8")
        tree = ast.parse(source)
        allowed = {"__future__", "dataclasses", "hashlib", "json", "types", "typing"}
        imports: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imports.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom):
                self.assertIsNotNone(node.module)
                imports.add(node.module.split(".")[0])
            elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
                self.assertNotIn(node.func.id, {"eval", "exec", "__import__"})
        self.assertEqual(imports, allowed)
        self.assertNotIn("importlib", source)
        self.assertNotIn("subprocess", source)

    def test_document_profiles_apply_the_frozen_byte_caps(self) -> None:
        self.assertEqual(
            dict(canonical.DOCUMENT_BYTE_CAPS),
            {
                "descriptor": 1_048_576,
                "manifest": 8_388_608,
                "preseal": 8_388_608,
                "summary": 1_048_576,
                "failure_receipt": 262_144,
                "proof_record": 65_536,
            },
        )
        raw = b'"' + b"a" * 65_536 + b'"'
        canonical.parse_canonical_json_bytes(raw, "manifest")
        with self.assertRaises(canonical.CanonicalJsonError) as caught:
            canonical.parse_canonical_json_bytes(raw, "proof_record")
        self.assertEqual(caught.exception.code, "json_document_size_invalid")
        with self.assertRaises(canonical.CanonicalJsonError) as caught:
            canonical.parse_canonical_json_bytes(b"{}", "unknown")
        self.assertEqual(caught.exception.code, "json_document_class_invalid")
        with self.assertRaises(TypeError):
            canonical.parse_canonical_json_bytes(b"{}")  # type: ignore[call-arg]

    def test_node_cap_counts_values_and_containers_but_not_punctuation(self) -> None:
        triples = [b"[0,0,0]"] * 8_191
        at_limit = b"[" + b",".join((*triples, b"[0,0]")) + b"]"
        document = canonical.parse_canonical_json_bytes(at_limit, "manifest")
        self.assertEqual(document.node_count, 32_768)

        over_limit = b"[" + b",".join((*triples, b"[0,0,0]")) + b"]"
        with self.assertRaises(canonical.CanonicalJsonError) as caught:
            canonical.parse_canonical_json_bytes(over_limit, "manifest")
        self.assertEqual(caught.exception.code, "json_node_limit_exceeded")


if __name__ == "__main__":
    unittest.main()
