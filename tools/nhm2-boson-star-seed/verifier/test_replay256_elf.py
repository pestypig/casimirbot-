"""Synthetic hostile-fixture tests for the bytes-only replay256 ELF parser."""

from __future__ import annotations

import ast
from dataclasses import FrozenInstanceError, dataclass, fields, replace
import hashlib
from pathlib import Path
import struct
import sys
import unittest


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import replay256_elf as elf  # noqa: E402
from replay256_elf import (  # noqa: E402
    ElfInspectionExpectation,
    MAX_DYNAMIC_ENTRIES,
    MAX_DYNSYM_ENTRIES,
    MAX_ELF_IMAGE_BYTES,
    MAX_NEEDED_DEPENDENCIES,
    MAX_PROGRAM_HEADERS,
    MAX_SECTION_HEADERS,
    MAX_STRING_TABLE_BYTES,
    MAX_SYMBOL_NAME_BYTES,
    MAX_VERSION_MARKER_BYTES,
    Replay256ElfError,
    STATIC_ELF_SECURITY_PROFILE,
    VERIFIER_REQUIRED_GMP_DYNSYMBOLS,
    VERIFIER_REQUIRED_MPFR_DYNSYMBOLS,
    inspect_replay256_elf,
)
from replay256_runtime import (  # noqa: E402
    REQUIRED_GMP_SYMBOLS,
    REQUIRED_MPFR_SYMBOLS,
)


_ELF_HEADER = struct.Struct("<16sHHIQQQIHHHHHH")
_PROGRAM_HEADER = struct.Struct("<IIQQQQQQ")
_SECTION_HEADER = struct.Struct("<IIQQQQIIQQ")
_DYNAMIC_ENTRY = struct.Struct("<qQ")
_DYNAMIC_SYMBOL = struct.Struct("<IBBHQQ")
_BASE_ADDRESS = 0x400000
_MPFR_MARKER = b"MPFR_VERSION=4.2.1"
_GMP_MARKER = b"GMP_VERSION=6.3.0"


def _align(value: int, alignment: int) -> int:
    return (value + alignment - 1) & ~(alignment - 1)


@dataclass(frozen=True)
class _Fixture:
    raw: bytes
    program_offset: int
    section_offset: int
    dynamic_offset: int
    dynamic_entry_count: int
    dynamic_tag_offsets: dict[int, tuple[int, ...]]
    dynstr_offset: int
    dynstr_size: int
    dynsym_offset: int
    dynsym_section_header_offset: int
    versym_section_header_offset: int
    verdef_section_header_offset: int
    text_section_header_offset: int
    rodata_section_header_offset: int


def _build_elf(
    library_id: str,
    *,
    soname: str | None = None,
    soname_values: tuple[str, ...] | None = None,
    needed: tuple[str, ...] | None = None,
    marker: bytes | None = None,
    marker_copies: int = 1,
    omit_symbols: frozenset[str] = frozenset(),
    undefined_symbols: frozenset[str] = frozenset(),
    duplicate_symbols: frozenset[str] = frozenset(),
    local_symbols: frozenset[str] = frozenset(),
    hidden_symbols: frozenset[str] = frozenset(),
    wrong_type_symbols: frozenset[str] = frozenset(),
    wrong_section_symbols: frozenset[str] = frozenset(),
    out_of_range_symbols: frozenset[str] = frozenset(),
    zero_size_symbols: frozenset[str] = frozenset(),
    hidden_version_symbols: frozenset[str] = frozenset(),
    local_version_symbols: frozenset[str] = frozenset(),
    extra_dynstr_values: tuple[str, ...] = (),
    extra_rodata: bytes = b"",
    trailing_null_entries: int = 1,
) -> _Fixture:
    if library_id == "mpfr":
        required = VERIFIER_REQUIRED_MPFR_DYNSYMBOLS
        default_soname = "libmpfr.so.6"
        default_needed = ("libgmp.so.10", "libm.so.6", "libc.so.6")
        default_marker = _MPFR_MARKER
    else:
        required = VERIFIER_REQUIRED_GMP_DYNSYMBOLS
        default_soname = "libgmp.so.10"
        default_needed = ("libc.so.6",)
        default_marker = _GMP_MARKER
    selected_soname = soname or default_soname
    selected_soname_values = (
        (selected_soname,) if soname_values is None else soname_values
    )
    selected_needed = default_needed if needed is None else needed
    selected_marker = default_marker if marker is None else marker

    dynstr = bytearray(b"\x00")
    string_offsets: dict[str, int] = {"": 0}

    def add_string(value: str) -> int:
        if value in string_offsets:
            return string_offsets[value]
        encoded = value.encode("ascii")
        offset = len(dynstr)
        dynstr.extend(encoded)
        dynstr.append(0)
        string_offsets[value] = offset
        return offset

    for value in selected_soname_values:
        add_string(value)
    for value in selected_needed:
        add_string(value)
    for value in extra_dynstr_values:
        add_string(value)
    version_definition_name = "REPLAY256_1.0"
    add_string(version_definition_name)

    symbol_specs: list[tuple[str, bool, bool, bool]] = []
    for name in required:
        if name in omit_symbols:
            continue
        add_string(name)
        symbol_specs.append(
            (
                name,
                name in undefined_symbols,
                name in local_symbols,
                name in hidden_symbols,
            )
        )
        if name in duplicate_symbols:
            symbol_specs.append((name, False, False, False))

    dynsym = bytearray(_DYNAMIC_SYMBOL.size * (1 + len(symbol_specs)))
    versym = bytearray(2 * (1 + len(symbol_specs)))
    for index, (name, _undefined, _local, _hidden) in enumerate(
        symbol_specs,
        start=1,
    ):
        version_index = 2
        if name in hidden_version_symbols:
            version_index |= 0x8000
        if name in local_version_symbols:
            version_index = 0
        struct.pack_into("<H", versym, index * 2, version_index)
    verdef = (
        struct.pack(
            "<HHHHIII",
            1,
            0,
            2,
            1,
            0,
            20,
            0,
        )
        + struct.pack("<II", string_offsets[version_definition_name], 0)
    )

    shstr = (
        b"\x00.shstrtab\x00.dynstr\x00.dynsym\x00.gnu.version\x00.dynamic\x00.text\x00.rodata\x00.data.rel.ro\x00.gnu.version_d\x00"
    )
    shname = {
        name: shstr.index(name.encode("ascii"))
        for name in (
            ".shstrtab",
            ".dynstr",
            ".dynsym",
            ".gnu.version",
            ".dynamic",
            ".text",
            ".rodata",
            ".data.rel.ro",
            ".gnu.version_d",
        )
    }

    program_offset = _ELF_HEADER.size
    cursor = _align(program_offset + 2 * _PROGRAM_HEADER.size, 8)
    shstr_offset = cursor
    cursor = _align(shstr_offset + len(shstr), 8)
    dynstr_offset = cursor
    cursor = _align(dynstr_offset + len(dynstr), 8)
    dynsym_offset = cursor
    cursor = _align(dynsym_offset + len(dynsym), 8)
    versym_offset = cursor
    cursor = _align(versym_offset + len(versym), 8)
    verdef_offset = cursor
    cursor = _align(verdef_offset + len(verdef), 8)

    dynamic_tags: list[tuple[int, int]] = [
        (5, _BASE_ADDRESS + dynstr_offset),
        (10, len(dynstr)),
        (6, _BASE_ADDRESS + dynsym_offset),
        (11, _DYNAMIC_SYMBOL.size),
        (0x6FFFFFF0, _BASE_ADDRESS + versym_offset),
        (0x6FFFFFFC, _BASE_ADDRESS + verdef_offset),
        (0x6FFFFFFD, 1),
    ]
    dynamic_tags.extend((14, string_offsets[value]) for value in selected_soname_values)
    dynamic_tags.extend((1, string_offsets[value]) for value in selected_needed)
    dynamic_tags.extend((0, 0) for _ in range(trailing_null_entries))
    dynamic = b"".join(_DYNAMIC_ENTRY.pack(tag, value) for tag, value in dynamic_tags)
    dynamic_offset = cursor
    cursor = _align(dynamic_offset + len(dynamic), 16)
    text = b"\x90" * max(1, len(symbol_specs))
    text_offset = cursor
    cursor = _align(text_offset + len(text), 8)
    rodata = b"\x00" + (selected_marker + b"\x00") * marker_copies + extra_rodata
    rodata_offset = cursor
    cursor = _align(rodata_offset + len(rodata), 8)
    data_rel_ro = b"\x00"
    data_rel_ro_offset = cursor
    cursor = _align(data_rel_ro_offset + len(data_rel_ro), 8)
    section_offset = cursor
    section_count = 10
    total_size = section_offset + section_count * _SECTION_HEADER.size

    for index, (name, undefined, local, hidden) in enumerate(symbol_specs, start=1):
        object_symbol = name == "__gmp_version"
        symbol_type = 1 if object_symbol else 2
        if name in wrong_type_symbols:
            symbol_type = 2 if object_symbol else 1
        binding = 0 if local else 1
        info = binding << 4 | symbol_type
        visibility = 2 if hidden else 0
        default_section_index = 8 if object_symbol else 6
        if name in wrong_section_symbols:
            default_section_index = 6 if object_symbol else 7
        section_index = 0 if undefined else default_section_index
        if undefined:
            value = 0
        elif default_section_index == 6:
            value = _BASE_ADDRESS + text_offset + (index - 1)
        elif default_section_index == 8:
            value = _BASE_ADDRESS + data_rel_ro_offset
        else:
            value = _BASE_ADDRESS + rodata_offset
        if name in out_of_range_symbols:
            if default_section_index == 6:
                selected_size = len(text)
                selected_offset = text_offset
            elif default_section_index == 8:
                selected_size = len(data_rel_ro)
                selected_offset = data_rel_ro_offset
            else:
                selected_size = len(rodata)
                selected_offset = rodata_offset
            value = _BASE_ADDRESS + selected_offset + selected_size + 1
        size = 0 if name in zero_size_symbols else 1
        _DYNAMIC_SYMBOL.pack_into(
            dynsym,
            index * _DYNAMIC_SYMBOL.size,
            string_offsets[name],
            info,
            visibility,
            section_index,
            value,
            size,
        )

    image = bytearray(total_size)
    ident = b"\x7fELF" + bytes((2, 1, 1, 0, 0)) + b"\x00" * 7
    _ELF_HEADER.pack_into(
        image,
        0,
        ident,
        3,
        62,
        1,
        0,
        program_offset,
        section_offset,
        0,
        _ELF_HEADER.size,
        _PROGRAM_HEADER.size,
        2,
        _SECTION_HEADER.size,
        section_count,
        1,
    )
    _PROGRAM_HEADER.pack_into(
        image,
        program_offset,
        1,
        5,
        0,
        _BASE_ADDRESS,
        _BASE_ADDRESS,
        total_size,
        total_size,
        0x1000,
    )
    _PROGRAM_HEADER.pack_into(
        image,
        program_offset + _PROGRAM_HEADER.size,
        2,
        6,
        dynamic_offset,
        _BASE_ADDRESS + dynamic_offset,
        _BASE_ADDRESS + dynamic_offset,
        len(dynamic),
        len(dynamic),
        8,
    )
    image[shstr_offset : shstr_offset + len(shstr)] = shstr
    image[dynstr_offset : dynstr_offset + len(dynstr)] = dynstr
    image[dynsym_offset : dynsym_offset + len(dynsym)] = dynsym
    image[versym_offset : versym_offset + len(versym)] = versym
    image[verdef_offset : verdef_offset + len(verdef)] = verdef
    image[dynamic_offset : dynamic_offset + len(dynamic)] = dynamic
    image[text_offset : text_offset + len(text)] = text
    image[rodata_offset : rodata_offset + len(rodata)] = rodata
    image[data_rel_ro_offset : data_rel_ro_offset + len(data_rel_ro)] = data_rel_ro

    sections = (
        (0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
        (shname[".shstrtab"], 3, 0, 0, shstr_offset, len(shstr), 0, 0, 1, 0),
        (
            shname[".dynstr"],
            3,
            2,
            _BASE_ADDRESS + dynstr_offset,
            dynstr_offset,
            len(dynstr),
            0,
            0,
            1,
            0,
        ),
        (
            shname[".dynsym"],
            11,
            2,
            _BASE_ADDRESS + dynsym_offset,
            dynsym_offset,
            len(dynsym),
            2,
            1,
            8,
            _DYNAMIC_SYMBOL.size,
        ),
        (
            shname[".gnu.version"],
            0x6FFFFFFF,
            2,
            _BASE_ADDRESS + versym_offset,
            versym_offset,
            len(versym),
            3,
            0,
            2,
            2,
        ),
        (
            shname[".dynamic"],
            6,
            3,
            _BASE_ADDRESS + dynamic_offset,
            dynamic_offset,
            len(dynamic),
            2,
            0,
            8,
            _DYNAMIC_ENTRY.size,
        ),
        (
            shname[".text"],
            1,
            6,
            _BASE_ADDRESS + text_offset,
            text_offset,
            len(text),
            0,
            0,
            16,
            0,
        ),
        (
            shname[".rodata"],
            1,
            2,
            _BASE_ADDRESS + rodata_offset,
            rodata_offset,
            len(rodata),
            0,
            0,
            1,
            0,
        ),
        (
            shname[".data.rel.ro"],
            1,
            3,
            _BASE_ADDRESS + data_rel_ro_offset,
            data_rel_ro_offset,
            len(data_rel_ro),
            0,
            0,
            1,
            0,
        ),
        (
            shname[".gnu.version_d"],
            0x6FFFFFFD,
            2,
            _BASE_ADDRESS + verdef_offset,
            verdef_offset,
            len(verdef),
            2,
            1,
            4,
            0,
        ),
    )
    for index, values in enumerate(sections):
        _SECTION_HEADER.pack_into(
            image,
            section_offset + index * _SECTION_HEADER.size,
            *values,
        )

    tag_offsets: dict[int, list[int]] = {}
    for index, (tag, _value) in enumerate(dynamic_tags):
        tag_offsets.setdefault(tag, []).append(dynamic_offset + index * _DYNAMIC_ENTRY.size)
    return _Fixture(
        raw=bytes(image),
        program_offset=program_offset,
        section_offset=section_offset,
        dynamic_offset=dynamic_offset,
        dynamic_entry_count=len(dynamic_tags),
        dynamic_tag_offsets={tag: tuple(offsets) for tag, offsets in tag_offsets.items()},
        dynstr_offset=dynstr_offset,
        dynstr_size=len(dynstr),
        dynsym_offset=dynsym_offset,
        dynsym_section_header_offset=section_offset + 3 * _SECTION_HEADER.size,
        versym_section_header_offset=section_offset + 4 * _SECTION_HEADER.size,
        verdef_section_header_offset=section_offset + 9 * _SECTION_HEADER.size,
        text_section_header_offset=section_offset + 6 * _SECTION_HEADER.size,
        rodata_section_header_offset=section_offset + 7 * _SECTION_HEADER.size,
    )


def _expectation(
    fixture: _Fixture | bytes,
    library_id: str,
    *,
    soname: str | None = None,
    marker: bytes | None = None,
    gmp_soname: str | None = None,
) -> ElfInspectionExpectation:
    raw = fixture.raw if isinstance(fixture, _Fixture) else fixture
    if library_id == "mpfr":
        expected_soname = soname or "libmpfr.so.6"
        expected_marker = marker or _MPFR_MARKER
        expected_gmp = gmp_soname or "libgmp.so.10"
    else:
        expected_soname = soname or "libgmp.so.10"
        expected_marker = marker or _GMP_MARKER
        expected_gmp = None
    return ElfInspectionExpectation(
        library_id=library_id,
        byte_length=len(raw),
        plain_sha256=hashlib.sha256(raw).hexdigest(),
        expected_soname=expected_soname,
        expected_version_marker=expected_marker,
        expected_gmp_soname=expected_gmp,
    )


def _mutate(raw: bytes, offset: int, packed: bytes) -> bytes:
    changed = bytearray(raw)
    changed[offset : offset + len(packed)] = packed
    return bytes(changed)


def _assert_code(
    testcase: unittest.TestCase,
    raw: bytes,
    expectation: ElfInspectionExpectation,
    code: str,
) -> None:
    with testcase.assertRaises(Replay256ElfError) as captured:
        inspect_replay256_elf(raw, expectation)
    testcase.assertEqual(captured.exception.code, code)


class FrozenElfFoundationTests(unittest.TestCase):
    def test_source_has_no_host_io_dynamic_loader_or_producer_dependency(self) -> None:
        source = Path(elf.__file__).read_text(encoding="utf-8")
        syntax = ast.parse(source)
        imported_roots: set[str] = set()
        call_names: set[str] = set()
        for node in ast.walk(syntax):
            if isinstance(node, ast.Import):
                imported_roots.update(alias.name.split(".", 1)[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imported_roots.add(node.module.split(".", 1)[0])
            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    call_names.add(node.func.id)
                elif isinstance(node.func, ast.Attribute):
                    call_names.add(node.func.attr)
        self.assertTrue(
            imported_roots.isdisjoint(
                {
                    "ctypes",
                    "importlib",
                    "os",
                    "pathlib",
                    "producer",
                    "replay256_runtime",
                    "subprocess",
                }
            )
        )
        self.assertTrue(
            call_names.isdisjoint(
                {"CDLL", "dlopen", "find_library", "getenv", "open", "read"}
            )
        )
        self.assertNotIn("producer", source)
        self.assertNotIn("rn256_runtime", source)

    def test_complete_independent_symbol_inventories_and_explicit_caps(self) -> None:
        self.assertEqual(
            len(VERIFIER_REQUIRED_MPFR_DYNSYMBOLS),
            len(set(VERIFIER_REQUIRED_MPFR_DYNSYMBOLS)),
        )
        self.assertEqual(
            VERIFIER_REQUIRED_MPFR_DYNSYMBOLS,
            REQUIRED_MPFR_SYMBOLS,
        )
        self.assertEqual(
            VERIFIER_REQUIRED_GMP_DYNSYMBOLS,
            REQUIRED_GMP_SYMBOLS,
        )
        self.assertTrue(
            {
                "mpfr_set_zero",
                "mpfr_number_p",
                "mpfr_cmp_si",
                "mpfr_get_z_2exp",
                "mpfr_get_version",
                "mpfr_get_patches",
                "mpfr_buildopt_tls_p",
                "mpfr_get_d",
            }.issubset(VERIFIER_REQUIRED_MPFR_DYNSYMBOLS)
        )
        self.assertIn("__gmp_version", VERIFIER_REQUIRED_GMP_DYNSYMBOLS)
        self.assertIn("__gmpz_neg", VERIFIER_REQUIRED_GMP_DYNSYMBOLS)
        self.assertEqual(MAX_ELF_IMAGE_BYTES, 64 * 1024 * 1024)
        self.assertEqual(MAX_PROGRAM_HEADERS, 128)
        self.assertEqual(MAX_SECTION_HEADERS, 512)
        self.assertEqual(MAX_DYNAMIC_ENTRIES, 4096)
        self.assertEqual(MAX_STRING_TABLE_BYTES, 4 * 1024 * 1024)
        self.assertEqual(MAX_DYNSYM_ENTRIES, 65_536)
        self.assertEqual(MAX_NEEDED_DEPENDENCIES, 128)
        self.assertEqual(MAX_SYMBOL_NAME_BYTES, 1024)
        self.assertEqual(MAX_VERSION_MARKER_BYTES, 256)


class StaticElfInspectionTests(unittest.TestCase):
    def test_valid_mpfr_and_gmp_bind_exact_bytes_and_keep_all_authority_false(self) -> None:
        mpfr_fixture = _build_elf("mpfr")
        mpfr = inspect_replay256_elf(mpfr_fixture.raw, _expectation(mpfr_fixture, "mpfr"))
        self.assertIs(mpfr.raw_bytes, mpfr_fixture.raw)
        self.assertEqual(mpfr.security_profile, STATIC_ELF_SECURITY_PROFILE)
        self.assertEqual(mpfr.observed_abi, "ELF64-little-endian-x86_64-ET_DYN")
        self.assertEqual(mpfr.observed_soname, "libmpfr.so.6")
        self.assertEqual(
            mpfr.needed_dependencies,
            ("libgmp.so.10", "libm.so.6", "libc.so.6"),
        )
        self.assertEqual(mpfr.gmp_family_needed_dependencies, ("libgmp.so.10",))
        self.assertEqual(mpfr.other_needed_dependencies, ("libm.so.6", "libc.so.6"))
        self.assertEqual(mpfr.observed_version_marker, _MPFR_MARKER)
        self.assertEqual(mpfr.version_marker_section_index, 7)
        self.assertEqual(mpfr.required_dynsymbols, VERIFIER_REQUIRED_MPFR_DYNSYMBOLS)
        self.assertEqual(mpfr.defined_required_dynsymbols, mpfr.required_dynsymbols)
        self.assertTrue(mpfr.gmp_dependency_rule_applicable)
        self.assertTrue(mpfr.gmp_dependency_rule_satisfied)

        gmp_fixture = _build_elf("gmp")
        gmp = inspect_replay256_elf(gmp_fixture.raw, _expectation(gmp_fixture, "gmp"))
        self.assertEqual(gmp.observed_soname, "libgmp.so.10")
        self.assertEqual(gmp.required_dynsymbols, VERIFIER_REQUIRED_GMP_DYNSYMBOLS)
        self.assertFalse(gmp.gmp_dependency_rule_applicable)
        self.assertFalse(gmp.gmp_dependency_rule_satisfied)

        for observation in (mpfr, gmp):
            self.assertTrue(observation.plain_sha256_match_established)
            self.assertTrue(observation.elf_identity_match_established)
            self.assertTrue(observation.bounded_table_validation_established)
            self.assertTrue(observation.soname_match_established)
            self.assertTrue(observation.version_marker_match_established)
            self.assertTrue(observation.required_dynsymbols_defined_established)
            self.assertTrue(observation.gnu_versym_present)
            self.assertTrue(
                observation.required_dynsymbols_default_version_visible_established
            )
            self.assertTrue(observation.static_metadata_observation_complete)
            for field in fields(observation):
                if field.name.endswith("_authority"):
                    self.assertIs(getattr(observation, field.name), False, field.name)
                if field.name.endswith("_available"):
                    self.assertIs(getattr(observation, field.name), False, field.name)
                if field.name.endswith("_executed") or field.name.endswith("_passed"):
                    self.assertIs(getattr(observation, field.name), False, field.name)
        with self.assertRaises(FrozenInstanceError):
            mpfr.observed_soname = "changed"  # type: ignore[misc]
        with self.assertRaises(TypeError):
            mpfr.raw_bytes[0] = 0  # type: ignore[index]

    def test_input_expectation_and_hash_fail_closed(self) -> None:
        fixture = _build_elf("mpfr")
        expected = _expectation(fixture, "mpfr")
        _assert_code(
            self,
            bytearray(fixture.raw),  # type: ignore[arg-type]
            expected,
            "immutable_exact_bytes_required",
        )
        cases = (
            (replace(expected, library_id="other"), "invalid_library_id"),
            (replace(expected, byte_length=0), "invalid_expected_byte_length"),
            (replace(expected, byte_length=True), "invalid_expected_byte_length"),
            (replace(expected, plain_sha256="A" * 64), "invalid_expected_plain_sha256"),
            (replace(expected, expected_soname="dir/libmpfr.so"), "invalid_expected_soname"),
            (replace(expected, expected_version_marker=b""), "invalid_expected_version_marker"),
            (replace(expected, expected_gmp_soname="libnotgmp.so"), "invalid_expected_gmp_soname"),
        )
        for bad, code in cases:
            with self.subTest(code=code):
                _assert_code(self, fixture.raw, bad, code)
        _assert_code(
            self,
            fixture.raw,
            replace(expected, plain_sha256="0" * 64),
            "plain_sha256_mismatch",
        )

    def test_elf_identity_and_header_table_caps_are_checked_first(self) -> None:
        fixture = _build_elf("mpfr")
        cases: list[tuple[bytes, str]] = []
        cases.append((_mutate(fixture.raw, 0, b"NOPE"), "invalid_elf_magic"))
        cases.append((_mutate(fixture.raw, 4, b"\x01"), "elf64_required"))
        cases.append((_mutate(fixture.raw, 5, b"\x02"), "little_endian_elf_required"))
        cases.append((_mutate(fixture.raw, 16, struct.pack("<H", 2)), "et_dyn_required"))
        cases.append((_mutate(fixture.raw, 18, struct.pack("<H", 183)), "x86_64_elf_required"))
        cases.append(
            (
                _mutate(fixture.raw, 56, struct.pack("<H", MAX_PROGRAM_HEADERS + 1)),
                "program_header_count_out_of_bounds",
            )
        )
        cases.append(
            (
                _mutate(fixture.raw, 60, struct.pack("<H", MAX_SECTION_HEADERS + 1)),
                "section_header_count_out_of_bounds",
            )
        )
        cases.append(
            (
                _mutate(fixture.raw, 32, struct.pack("<Q", len(fixture.raw) + 8)),
                "program_header_table_bounds_invalid",
            )
        )
        cases.append(
            (
                _mutate(fixture.raw, 40, struct.pack("<Q", len(fixture.raw) + 8)),
                "section_header_table_bounds_invalid",
            )
        )
        cases.append(
            (
                _mutate(fixture.raw, 40, struct.pack("<Q", fixture.program_offset)),
                "elf_header_tables_overlap",
            )
        )
        cases.append(
            (
                _mutate(
                    fixture.raw,
                    fixture.program_offset + 16,
                    struct.pack("<Q", (1 << 64) - 1),
                ),
                "program_segment_virtual_range_overflow",
            )
        )
        for raw, code in cases:
            with self.subTest(code=code):
                _assert_code(self, raw, _expectation(raw, "mpfr"), code)

    def test_program_section_and_dynamic_tables_are_cross_checked(self) -> None:
        fixture = _build_elf("mpfr")
        no_dynamic_segment = _mutate(
            fixture.raw,
            fixture.program_offset + _PROGRAM_HEADER.size,
            struct.pack("<I", 1),
        )
        _assert_code(
            self,
            no_dynamic_segment,
            _expectation(no_dynamic_segment, "mpfr"),
            "exactly_one_dynamic_segment_required",
        )

        dynamic_section_header = fixture.section_offset + 5 * _SECTION_HEADER.size
        detached_dynamic = _mutate(
            fixture.raw,
            dynamic_section_header + 8,
            struct.pack("<Q", 1),
        )
        _assert_code(
            self,
            detached_dynamic,
            _expectation(detached_dynamic, "mpfr"),
            "dynamic_segment_section_mismatch",
        )

        overlapping_body = _mutate(
            fixture.raw,
            fixture.rodata_section_header_offset + 24,
            struct.pack("<Q", fixture.dynstr_offset),
        )
        _assert_code(
            self,
            overlapping_body,
            _expectation(overlapping_body, "mpfr"),
            "section_file_ranges_overlap",
        )

        header_overlapping_body = _mutate(
            fixture.raw,
            fixture.rodata_section_header_offset + 24,
            struct.pack("<Q", fixture.section_offset),
        )
        _assert_code(
            self,
            header_overlapping_body,
            _expectation(header_overlapping_body, "mpfr"),
            "section_body_overlaps_header_table",
        )

        virtual_overflow = _mutate(
            fixture.raw,
            fixture.rodata_section_header_offset + 16,
            struct.pack("<Q", (1 << 64) - 1),
        )
        _assert_code(
            self,
            virtual_overflow,
            _expectation(virtual_overflow, "mpfr"),
            "section_virtual_range_overflow",
        )

        bad_dynsym_entsize = _mutate(
            fixture.raw,
            fixture.dynsym_section_header_offset + 56,
            struct.pack("<Q", 16),
        )
        _assert_code(
            self,
            bad_dynsym_entsize,
            _expectation(bad_dynsym_entsize, "mpfr"),
            "dynsym_entry_size_invalid",
        )

        missing_null = _mutate(
            fixture.raw,
            fixture.dynamic_tag_offsets[0][0],
            _DYNAMIC_ENTRY.pack(0x1234, 0),
        )
        _assert_code(
            self,
            missing_null,
            _expectation(missing_null, "mpfr"),
            "dynamic_null_terminator_missing",
        )

        two_nulls = _build_elf("mpfr", trailing_null_entries=2)
        hidden_after_null = _mutate(
            two_nulls.raw,
            two_nulls.dynamic_tag_offsets[0][1],
            _DYNAMIC_ENTRY.pack(0x1234, 1),
        )
        _assert_code(
            self,
            hidden_after_null,
            _expectation(hidden_after_null, "mpfr"),
            "dynamic_entries_after_null_forbidden",
        )

        strtab_tag_offset = fixture.dynamic_tag_offsets[5][0]
        bad_mapping = _mutate(
            fixture.raw,
            strtab_tag_offset + 8,
            struct.pack("<Q", _BASE_ADDRESS + fixture.dynstr_offset + 1),
        )
        _assert_code(
            self,
            bad_mapping,
            _expectation(bad_mapping, "mpfr"),
            "dynamic_strtab_mapping_mismatch",
        )

        bad_versym_address = _mutate(
            fixture.raw,
            fixture.dynamic_tag_offsets[0x6FFFFFF0][0] + 8,
            struct.pack("<Q", _BASE_ADDRESS + len(fixture.raw) - 1),
        )
        _assert_code(
            self,
            bad_versym_address,
            _expectation(bad_versym_address, "mpfr"),
            "dynamic_versym_address_mismatch",
        )
        bad_verdef_address = _mutate(
            fixture.raw,
            fixture.dynamic_tag_offsets[0x6FFFFFFC][0] + 8,
            struct.pack("<Q", _BASE_ADDRESS + len(fixture.raw) - 1),
        )
        _assert_code(
            self,
            bad_verdef_address,
            _expectation(bad_verdef_address, "mpfr"),
            "dynamic_verdef_address_mismatch",
        )
        bad_verdef_count = _mutate(
            fixture.raw,
            fixture.dynamic_tag_offsets[0x6FFFFFFD][0] + 8,
            struct.pack("<Q", 2),
        )
        _assert_code(
            self,
            bad_verdef_count,
            _expectation(bad_verdef_count, "mpfr"),
            "dynamic_verdef_count_mismatch",
        )
        duplicate_versym_tag = _mutate(
            fixture.raw,
            fixture.dynamic_tag_offsets[1][1],
            struct.pack("<q", 0x6FFFFFF0),
        )
        _assert_code(
            self,
            duplicate_versym_tag,
            _expectation(duplicate_versym_tag, "mpfr"),
            "dynamic_versym_tag_ambiguous",
        )

    def test_soname_and_mpfr_gmp_dependency_rules_are_exact(self) -> None:
        fixture = _build_elf("mpfr")
        _assert_code(
            self,
            fixture.raw,
            _expectation(fixture, "mpfr", soname="libmpfr.so.7"),
            "soname_mismatch",
        )

        missing_soname = _build_elf("mpfr", soname_values=())
        _assert_code(
            self,
            missing_soname.raw,
            _expectation(missing_soname, "mpfr"),
            "required_dynamic_tag_missing",
        )
        duplicate_soname = _build_elf(
            "mpfr",
            soname_values=("libmpfr.so.6", "libmpfr-alt.so.6"),
        )
        _assert_code(
            self,
            duplicate_soname.raw,
            _expectation(duplicate_soname, "mpfr"),
            "required_dynamic_tag_ambiguous",
        )

        no_gmp = _build_elf("mpfr", needed=("libm.so.6", "libc.so.6"))
        _assert_code(
            self,
            no_gmp.raw,
            _expectation(no_gmp, "mpfr"),
            "gmp_needed_dependency_count_mismatch",
        )
        two_gmp = _build_elf(
            "mpfr",
            needed=("libgmp.so.10", "libgmpxx.so.4", "libc.so.6"),
        )
        _assert_code(
            self,
            two_gmp.raw,
            _expectation(two_gmp, "mpfr"),
            "unrecognized_gmp_dependency_alias",
        )
        wrong_gmp = _build_elf("mpfr", needed=("libgmp.so.9", "libc.so.6"))
        _assert_code(
            self,
            wrong_gmp.raw,
            _expectation(wrong_gmp, "mpfr"),
            "gmp_needed_soname_mismatch",
        )
        for alias in ("libgmp.so.10.2", "libgmpevil.so", "libgmpxx.so.4"):
            with self.subTest(alias=alias):
                hostile = _build_elf(
                    "mpfr",
                    needed=("libgmp.so.10", alias, "libc.so.6"),
                )
                _assert_code(
                    self,
                    hostile.raw,
                    _expectation(hostile, "mpfr"),
                    "unrecognized_gmp_dependency_alias",
                )

        hostile_gmp_identity = _build_elf("gmp", soname="libgmpevil.so")
        _assert_code(
            self,
            hostile_gmp_identity.raw,
            _expectation(
                hostile_gmp_identity,
                "gmp",
                soname="libgmpevil.so",
            ),
            "invalid_expected_soname",
        )

        hostile_mpfr_identity = _build_elf("mpfr", soname="libevil.so")
        _assert_code(
            self,
            hostile_mpfr_identity.raw,
            _expectation(hostile_mpfr_identity, "mpfr", soname="libevil.so"),
            "invalid_expected_soname",
        )

        self_dependent_gmp = _build_elf(
            "gmp",
            needed=("libgmp.so.10", "libc.so.6"),
        )
        _assert_code(
            self,
            self_dependent_gmp.raw,
            _expectation(self_dependent_gmp, "gmp"),
            "gmp_self_family_dependency_forbidden",
        )

    def test_version_marker_must_be_exactly_once(self) -> None:
        missing = _build_elf("mpfr", marker_copies=0)
        _assert_code(
            self,
            missing.raw,
            _expectation(missing, "mpfr"),
            "expected_version_marker_missing",
        )
        ambiguous = _build_elf("mpfr", marker_copies=2)
        _assert_code(
            self,
            ambiguous.raw,
            _expectation(ambiguous, "mpfr"),
            "expected_version_marker_ambiguous",
        )
        debug_only = _build_elf(
            "mpfr",
            marker_copies=0,
            extra_dynstr_values=(_MPFR_MARKER.decode("ascii"),),
        )
        self.assertIn(_MPFR_MARKER, debug_only.raw)
        _assert_code(
            self,
            debug_only.raw,
            _expectation(debug_only, "mpfr"),
            "expected_version_marker_missing",
        )
        not_delimited = _build_elf(
            "mpfr",
            marker_copies=0,
            extra_rodata=_MPFR_MARKER,
        )
        _assert_code(
            self,
            not_delimited.raw,
            _expectation(not_delimited, "mpfr"),
            "expected_version_marker_missing",
        )
        fixture = _build_elf("mpfr")
        writable_rodata = _mutate(
            fixture.raw,
            fixture.rodata_section_header_offset + 8,
            struct.pack("<Q", 3),
        )
        _assert_code(
            self,
            writable_rodata,
            _expectation(writable_rodata, "mpfr"),
            "expected_version_marker_missing",
        )
        executable_rodata = _mutate(
            fixture.raw,
            fixture.rodata_section_header_offset + 8,
            struct.pack("<Q", 6),
        )
        _assert_code(
            self,
            executable_rodata,
            _expectation(executable_rodata, "mpfr"),
            "expected_version_marker_missing",
        )
        duplicate_elsewhere = _build_elf(
            "mpfr",
            extra_dynstr_values=(_MPFR_MARKER.decode("ascii"),),
        )
        _assert_code(
            self,
            duplicate_elsewhere.raw,
            _expectation(duplicate_elsewhere, "mpfr"),
            "expected_version_marker_ambiguous",
        )

    def test_required_symbols_must_be_unique_defined_exports_not_raw_strings(self) -> None:
        target = VERIFIER_REQUIRED_MPFR_DYNSYMBOLS[0]
        mere_string = _build_elf(
            "mpfr",
            omit_symbols=frozenset((target,)),
            extra_rodata=target.encode("ascii") + b"\x00",
        )
        self.assertIn(target.encode("ascii"), mere_string.raw)
        _assert_code(
            self,
            mere_string.raw,
            _expectation(mere_string, "mpfr"),
            "required_dynsymbol_missing",
        )

        undefined = _build_elf("mpfr", undefined_symbols=frozenset((target,)))
        _assert_code(
            self,
            undefined.raw,
            _expectation(undefined, "mpfr"),
            "required_dynsymbol_undefined",
        )
        duplicate = _build_elf("mpfr", duplicate_symbols=frozenset((target,)))
        _assert_code(
            self,
            duplicate.raw,
            _expectation(duplicate, "mpfr"),
            "required_dynsymbol_ambiguous",
        )
        local = _build_elf("mpfr", local_symbols=frozenset((target,)))
        _assert_code(
            self,
            local.raw,
            _expectation(local, "mpfr"),
            "required_dynsymbol_not_exported",
        )
        hidden = _build_elf("mpfr", hidden_symbols=frozenset((target,)))
        _assert_code(
            self,
            hidden.raw,
            _expectation(hidden, "mpfr"),
            "required_dynsymbol_not_exported",
        )
        hidden_version = _build_elf(
            "mpfr",
            hidden_version_symbols=frozenset((target,)),
        )
        _assert_code(
            self,
            hidden_version.raw,
            _expectation(hidden_version, "mpfr"),
            "required_dynsymbol_version_hidden",
        )
        local_version = _build_elf(
            "mpfr",
            local_version_symbols=frozenset((target,)),
        )
        _assert_code(
            self,
            local_version.raw,
            _expectation(local_version, "mpfr"),
            "required_dynsymbol_version_local",
        )
        wrong_type = _build_elf("mpfr", wrong_type_symbols=frozenset((target,)))
        _assert_code(
            self,
            wrong_type.raw,
            _expectation(wrong_type, "mpfr"),
            "required_dynsymbol_type_mismatch",
        )
        wrong_section = _build_elf("mpfr", wrong_section_symbols=frozenset((target,)))
        _assert_code(
            self,
            wrong_section.raw,
            _expectation(wrong_section, "mpfr"),
            "required_dynsymbol_section_flags_invalid",
        )
        out_of_range = _build_elf(
            "mpfr",
            out_of_range_symbols=frozenset((target,)),
        )
        _assert_code(
            self,
            out_of_range.raw,
            _expectation(out_of_range, "mpfr"),
            "required_dynsymbol_range_invalid",
        )
        zero_size = _build_elf("mpfr", zero_size_symbols=frozenset((target,)))
        _assert_code(
            self,
            zero_size.raw,
            _expectation(zero_size, "mpfr"),
            "required_dynsymbol_range_invalid",
        )

        object_target = "__gmp_version"
        wrong_object_type = _build_elf(
            "gmp",
            wrong_type_symbols=frozenset((object_target,)),
        )
        _assert_code(
            self,
            wrong_object_type.raw,
            _expectation(wrong_object_type, "gmp"),
            "required_dynsymbol_type_mismatch",
        )
        executable_object = _build_elf(
            "gmp",
            wrong_section_symbols=frozenset((object_target,)),
        )
        _assert_code(
            self,
            executable_object.raw,
            _expectation(executable_object, "gmp"),
            "required_dynsymbol_section_flags_invalid",
        )

        writable_text = _build_elf("mpfr")
        raw = _mutate(
            writable_text.raw,
            writable_text.text_section_header_offset + 8,
            struct.pack("<Q", 7),
        )
        _assert_code(
            self,
            raw,
            _expectation(raw, "mpfr"),
            "required_dynsymbol_section_flags_invalid",
        )

        unresolved_version = _build_elf("mpfr")
        versym_offset = struct.unpack_from(
            "<Q", unresolved_version.raw, unresolved_version.versym_section_header_offset + 24
        )[0]
        raw = _mutate(unresolved_version.raw, versym_offset + 2, struct.pack("<H", 3))
        _assert_code(
            self,
            raw,
            _expectation(raw, "mpfr"),
            "required_dynsymbol_version_definition_unestablished",
        )

        nonexecutable_load = _mutate(
            unresolved_version.raw,
            unresolved_version.program_offset + 4,
            struct.pack("<I", 4),
        )
        _assert_code(
            self,
            nonexecutable_load,
            _expectation(nonexecutable_load, "mpfr"),
            "required_function_load_not_read_executable",
        )

    def test_bad_dynamic_string_and_symbol_section_references_are_rejected(self) -> None:
        fixture = _build_elf("mpfr")
        soname_tag_offset = fixture.dynamic_tag_offsets[14][0]
        bad_soname_offset = _mutate(
            fixture.raw,
            soname_tag_offset + 8,
            struct.pack("<Q", fixture.dynstr_size + 1),
        )
        _assert_code(
            self,
            bad_soname_offset,
            _expectation(bad_soname_offset, "mpfr"),
            "soname_string_invalid",
        )

        bad_dynstr_link = _mutate(
            fixture.raw,
            fixture.dynsym_section_header_offset + 40,
            struct.pack("<I", 99),
        )
        _assert_code(
            self,
            bad_dynstr_link,
            _expectation(bad_dynstr_link, "mpfr"),
            "dynsym_string_table_link_invalid",
        )

        bad_versym_link = _mutate(
            fixture.raw,
            fixture.versym_section_header_offset + 40,
            struct.pack("<I", 99),
        )
        _assert_code(
            self,
            bad_versym_link,
            _expectation(bad_versym_link, "mpfr"),
            "gnu_versym_shape_or_link_invalid",
        )


if __name__ == "__main__":
    unittest.main()
