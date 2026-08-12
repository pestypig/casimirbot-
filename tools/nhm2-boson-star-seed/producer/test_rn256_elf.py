"""Synthetic hostile-fixture tests for the static RN256 ELF inspector."""

from __future__ import annotations

import ast
from dataclasses import FrozenInstanceError, dataclass, replace
import hashlib
from pathlib import Path
import struct
import sys
import unittest


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import rn256_elf  # noqa: E402
from rn256_elf import (  # noqa: E402
    MAX_DYNAMIC_ENTRIES,
    MAX_DYNSYMBOLS,
    MAX_ELF_BYTES,
    MAX_NEEDED_ENTRIES,
    MAX_PROGRAM_HEADERS,
    MAX_SECTION_HEADERS,
    MAX_STRING_TABLE_BYTES,
    PRODUCER_GMP_REQUIRED_DYNSYMBOLS,
    PRODUCER_MPFR_REQUIRED_DYNSYMBOLS,
    StaticElfExpectation,
    StaticElfInspectionError,
    frozen_required_dynsymbols,
    inspect_static_elf,
)


MPFR_SONAME = "libmpfr.so.6"
GMP_SONAME = "libgmp.so.10"
MPFR_MARKER = b"MPFR 4.2.2"
GMP_MARKER = b"GMP 6.3.0"


@dataclass(frozen=True, slots=True)
class BuiltElf:
    raw: bytes
    dynamic_offset: int
    dynamic_entry_count: int
    dynsym_offset: int
    symbol_entry_offsets: dict[str, tuple[int, ...]]
    section_offset: int
    section_indices: dict[str, int]


def _align(buffer: bytearray, alignment: int) -> None:
    remainder = len(buffer) % alignment
    if remainder:
        buffer.extend(b"\x00" * (alignment - remainder))


def _string_table(strings: tuple[str, ...]) -> tuple[bytes, dict[str, int]]:
    table = bytearray(b"\x00")
    offsets: dict[str, int] = {"": 0}
    for value in strings:
        if value in offsets:
            continue
        offsets[value] = len(table)
        table.extend(value.encode("ascii"))
        table.append(0)
    return bytes(table), offsets


def _build_elf(
    component: str,
    *,
    soname: str | None = None,
    needed: tuple[str, ...] | None = None,
    version_tokens: tuple[bytes, ...] | None = None,
    symbol_entries: tuple[tuple[str, bool, int, int], ...] | None = None,
    extra_dynstr_strings: tuple[str, ...] = (),
    duplicate_soname_tag: bool = False,
    terminate_dynamic: bool = True,
    writable_rodata: bool = False,
    versym_mode: str | None = None,
    extra_load_delta: int | None = None,
    extra_load_scope: str = "all",
) -> BuiltElf:
    if component == "mpfr":
        required = frozen_required_dynsymbols("mpfr")
        soname = MPFR_SONAME if soname is None else soname
        needed = (
            ("libc.so.6", GMP_SONAME, "libm.so.6")
            if needed is None
            else needed
        )
        version_tokens = (MPFR_MARKER,) if version_tokens is None else version_tokens
    else:
        required = frozen_required_dynsymbols("gmp")
        soname = GMP_SONAME if soname is None else soname
        needed = ("libc.so.6",) if needed is None else needed
        version_tokens = (GMP_MARKER,) if version_tokens is None else version_tokens
    if symbol_entries is None:
        symbol_entries = tuple((symbol, True, 1, 0) for symbol in required)

    section_names = (
        ".shstrtab",
        ".dynstr",
        ".dynsym",
        ".dynamic",
        *((".gnu.version",) if versym_mode is not None else ()),
        *((".gnu.version_d",) if versym_mode == "defined2" else ()),
        ".rodata",
        ".text",
        ".data",
    )
    section_indices = {name: index + 1 for index, name in enumerate(section_names)}
    shstr, shstr_offsets = _string_table(section_names)
    dynstr_values = needed + (soname,) + tuple(
        entry[0] for entry in symbol_entries
    ) + extra_dynstr_strings + (
        ("RN256_1.0",) if versym_mode == "defined2" else ()
    )
    dynstr, dynstr_offsets = _string_table(dynstr_values)

    program_count = 3 if extra_load_delta is not None else 2
    buffer = bytearray(b"\x00" * (64 + program_count * 56))
    shstr_offset = len(buffer)
    buffer.extend(shstr)
    dynstr_offset = len(buffer)
    buffer.extend(dynstr)
    _align(buffer, 8)
    dynsym_offset = len(buffer)
    dynsym = bytearray(b"\x00" * 24)
    relative_symbol_offsets: dict[str, list[int]] = {}
    for name, defined, binding, visibility in symbol_entries:
        relative_symbol_offsets.setdefault(name, []).append(len(dynsym))
        symbol_type = 1 if name == "__gmp_version" else 2
        dynsym.extend(
            struct.pack(
                "<IBBHQQ",
                dynstr_offsets[name],
                (binding << 4) | symbol_type,
                visibility,
                0,
                0,
                0,
            )
        )
    buffer.extend(dynsym)
    _align(buffer, 8)
    dynamic_offset = len(buffer)
    versym = b""
    if versym_mode is not None:
        values = [0] + [1] * len(symbol_entries)
        if versym_mode == "hidden":
            values[1] = 0x8001
        elif versym_mode == "local":
            values[1] = 0
        elif versym_mode in ("defined2", "unresolved2"):
            values[1:] = [2] * len(symbol_entries)
        elif versym_mode != "global":
            raise ValueError("unknown synthetic versym mode")
        versym = b"".join(struct.pack("<H", value) for value in values)
    verdef = b""
    if versym_mode == "defined2":
        version_name = "RN256_1.0"
        if version_name not in dynstr_offsets:
            raise AssertionError("synthetic version name missing from dynstr")
        verdef = struct.pack(
            "<HHHHIII",
            1,
            0,
            2,
            1,
            0,
            20,
            0,
        ) + struct.pack("<II", dynstr_offsets[version_name], 0)
    dynamic_entry_count = (
        len(needed)
        + 5
        + int(duplicate_soname_tag)
        + int(bool(versym))
        + 2 * int(bool(verdef))
        + int(terminate_dynamic)
    )
    dynamic_size = dynamic_entry_count * 16
    versym_offset = (
        (dynamic_offset + dynamic_size + 1) & ~1 if versym else 0
    )
    verdef_offset = (
        (versym_offset + len(versym) + 3) & ~3 if verdef else 0
    )
    dynamic_entries: list[tuple[int, int]] = [
        *( (1, dynstr_offsets[name]) for name in needed ),
        (5, dynstr_offset),
        (10, len(dynstr)),
        (6, dynsym_offset),
        (11, 24),
        (14, dynstr_offsets[soname]),
    ]
    if duplicate_soname_tag:
        dynamic_entries.append((14, dynstr_offsets[soname]))
    if versym:
        dynamic_entries.append((0x6FFFFFF0, versym_offset))
    if verdef:
        dynamic_entries.extend(
            (
                (0x6FFFFFFC, verdef_offset),
                (0x6FFFFFFD, 1),
            )
        )
    if terminate_dynamic:
        dynamic_entries.append((0, 0))
    if len(dynamic_entries) != dynamic_entry_count:
        raise AssertionError("synthetic dynamic entry count drift")
    dynamic = b"".join(struct.pack("<qQ", *entry) for entry in dynamic_entries)
    buffer.extend(dynamic)
    if versym:
        _align(buffer, 2)
        if len(buffer) != versym_offset:
            raise AssertionError("synthetic versym offset drift")
        buffer.extend(versym)
    if verdef:
        _align(buffer, 4)
        if len(buffer) != verdef_offset:
            raise AssertionError("synthetic verdef offset drift")
        buffer.extend(verdef)
    rodata_offset = len(buffer)
    rodata = b"\x00".join(version_tokens) + b"\x00"
    buffer.extend(rodata)
    _align(buffer, 16)
    text_offset = len(buffer)
    text = b"\xc3"
    buffer.extend(text)
    _align(buffer, 8)
    data_offset = len(buffer)
    data = b"\x00" * 8
    buffer.extend(data)

    patch_symbol_offsets = {
        name: list(offsets) for name, offsets in relative_symbol_offsets.items()
    }
    for name, defined, binding, visibility in symbol_entries:
        symbol_type = 1 if name == "__gmp_version" else 2
        defining_index = (
            section_indices[".data"]
            if symbol_type == 1
            else section_indices[".text"]
        )
        value = data_offset if symbol_type == 1 else text_offset
        size = len(data) if symbol_type == 1 else len(text)
        relative_offset = patch_symbol_offsets[name].pop(0)
        struct.pack_into(
            "<IBBHQQ",
            buffer,
            dynsym_offset + relative_offset,
            dynstr_offsets[name],
            (binding << 4) | symbol_type,
            visibility,
            defining_index if defined else 0,
            value if defined else 0,
            size if defined else 0,
        )
    _align(buffer, 8)
    section_offset = len(buffer)

    sections = [
        (0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
        (
            shstr_offsets[".shstrtab"],
            3,
            0,
            shstr_offset,
            shstr_offset,
            len(shstr),
            0,
            0,
            1,
            0,
        ),
        (
            shstr_offsets[".dynstr"],
            3,
            2,
            dynstr_offset,
            dynstr_offset,
            len(dynstr),
            0,
            0,
            1,
            0,
        ),
        (
            shstr_offsets[".dynsym"],
            11,
            2,
            dynsym_offset,
            dynsym_offset,
            len(dynsym),
            section_indices[".dynstr"],
            1,
            8,
            24,
        ),
        (
            shstr_offsets[".dynamic"],
            6,
            3,
            dynamic_offset,
            dynamic_offset,
            len(dynamic),
            section_indices[".dynstr"],
            0,
            8,
            16,
        ),
    ]
    if versym_mode is not None:
        sections.append(
            (
                shstr_offsets[".gnu.version"],
                0x6FFFFFFF,
                2,
                versym_offset,
                versym_offset,
                len(versym),
                section_indices[".dynsym"],
                0,
                2,
                2,
            )
        )
    if versym_mode == "defined2":
        sections.append(
            (
                shstr_offsets[".gnu.version_d"],
                0x6FFFFFFD,
                2,
                verdef_offset,
                verdef_offset,
                len(verdef),
                section_indices[".dynstr"],
                1,
                4,
                0,
            )
        )
    sections.extend(
        [
        (
            shstr_offsets[".rodata"],
            1,
            3 if writable_rodata else 2,
            rodata_offset,
            rodata_offset,
            len(rodata),
            0,
            0,
            1,
            0,
        ),
        (
            shstr_offsets[".text"],
            1,
            6,
            text_offset,
            text_offset,
            len(text),
            0,
            0,
            16,
            0,
        ),
        (
            shstr_offsets[".data"],
            1,
            3,
            data_offset,
            data_offset,
            len(data),
            0,
            0,
            8,
            0,
        ),
        ]
    )
    for section in sections:
        buffer.extend(struct.pack("<IIQQQQIIQQ", *section))

    total_size = len(buffer)
    ident = b"\x7fELF" + bytes((2, 1, 1, 0, 0)) + b"\x00" * 7
    header = ident + struct.pack(
        "<HHIQQQIHHHHHH",
        3,
        62,
        1,
        0,
        64,
        section_offset,
        0,
        64,
        56,
        program_count,
        64,
        len(sections),
        1,
    )
    program_header_entries = [
            struct.pack("<IIQQQQQQ", 1, 7, 0, 0, 0, total_size, total_size, 4096),
            struct.pack(
                "<IIQQQQQQ",
                2,
                6,
                dynamic_offset,
                dynamic_offset,
                dynamic_offset,
                len(dynamic),
                len(dynamic),
                8,
            ),
    ]
    if extra_load_delta is not None:
        if extra_load_scope == "all":
            extra_offset = 0
            extra_size = total_size
            extra_virtual_address = extra_load_delta
            extra_alignment = 4096
        elif extra_load_scope == "marker":
            extra_offset = rodata_offset
            extra_size = len(rodata)
            extra_virtual_address = rodata_offset + extra_load_delta
            extra_alignment = 1
        else:
            raise ValueError("unknown synthetic extra LOAD scope")
        program_header_entries.append(
            struct.pack(
                "<IIQQQQQQ",
                1,
                5,
                extra_offset,
                extra_virtual_address,
                extra_virtual_address,
                extra_size,
                extra_size,
                extra_alignment,
            )
        )
    program_headers = b"".join(program_header_entries)
    buffer[:64] = header
    buffer[64 : 64 + len(program_headers)] = program_headers
    symbol_offsets = {
        name: tuple(dynsym_offset + relative for relative in relatives)
        for name, relatives in relative_symbol_offsets.items()
    }
    return BuiltElf(
        raw=bytes(buffer),
        dynamic_offset=dynamic_offset,
        dynamic_entry_count=len(dynamic_entries),
        dynsym_offset=dynsym_offset,
        symbol_entry_offsets=symbol_offsets,
        section_offset=section_offset,
        section_indices=section_indices,
    )


def _expectation(
    raw: bytes,
    component: str,
    *,
    soname: str | None = None,
    marker: bytes | None = None,
    expected_gmp_soname: str | None = None,
) -> StaticElfExpectation:
    if component == "mpfr":
        soname = MPFR_SONAME if soname is None else soname
        marker = MPFR_MARKER if marker is None else marker
        if expected_gmp_soname is None:
            expected_gmp_soname = GMP_SONAME
    else:
        soname = GMP_SONAME if soname is None else soname
        marker = GMP_MARKER if marker is None else marker
        expected_gmp_soname = None
    return StaticElfExpectation(
        component=component,
        expected_byte_length=len(raw),
        expected_plain_sha256=hashlib.sha256(raw).hexdigest(),
        expected_soname=soname,
        expected_version_marker=marker,
        expected_gmp_soname=expected_gmp_soname,
        required_dynsymbols=frozen_required_dynsymbols(component),
    )


def _mutate(raw: bytes, offset: int, replacement: bytes) -> bytes:
    result = bytearray(raw)
    result[offset : offset + len(replacement)] = replacement
    return bytes(result)


def _assert_code(
    testcase: unittest.TestCase,
    raw: object,
    expectation: StaticElfExpectation,
    code: str,
) -> None:
    with testcase.assertRaises(StaticElfInspectionError) as caught:
        inspect_static_elf(raw, expectation)  # type: ignore[arg-type]
    testcase.assertEqual(caught.exception.code, code)


class StaticElfSuccessTests(unittest.TestCase):
    def test_additive_state_extraction_and_sign_symbols_are_frozen(self) -> None:
        self.assertIn("mpfr_get_z_2exp", PRODUCER_MPFR_REQUIRED_DYNSYMBOLS)
        self.assertIn("__gmpz_neg", PRODUCER_GMP_REQUIRED_DYNSYMBOLS)

    def test_mpfr_static_evidence_retains_other_needed_entries(self) -> None:
        fixture = _build_elf("mpfr")
        evidence = inspect_static_elf(
            fixture.raw,
            _expectation(fixture.raw, "mpfr"),
        )
        self.assertEqual(
            evidence.needed_sonames,
            ("libc.so.6", GMP_SONAME, "libm.so.6"),
        )
        self.assertEqual(evidence.gmp_family_dependencies, (GMP_SONAME,))
        self.assertEqual(
            evidence.defined_required_dynsymbols,
            frozen_required_dynsymbols("mpfr"),
        )
        self.assertEqual(evidence.plain_sha256, hashlib.sha256(fixture.raw).hexdigest())
        self.assertTrue(evidence.static_structure_validated)
        self.assertTrue(evidence.static_metadata_evidence_only)
        false_fields = (
            "host_file_access_attempted",
            "loader_attempted",
            "runtime_mapping_established",
            "runtime_symbol_resolution_attempted",
            "runtime_configuration_attempted",
            "canary_attempted",
            "conformance_attempted",
            "serialization_executed",
            "arithmetic_executed",
            "runtime_conformance_authority",
            "execution_authority",
            "admission_authority",
            "scientific_authority",
            "physical_viability_established",
            "propulsion_capability_established",
            "transport_capability_established",
        )
        for field in false_fields:
            self.assertIs(getattr(evidence, field), False, field)
        with self.assertRaises(FrozenInstanceError):
            evidence.loader_attempted = True  # type: ignore[misc]

    def test_gmp_static_evidence_has_no_gmp_dependency_requirement(self) -> None:
        fixture = _build_elf("gmp", needed=("libc.so.6", "ld-linux-x86-64.so.2"))
        evidence = inspect_static_elf(fixture.raw, _expectation(fixture.raw, "gmp"))
        self.assertEqual(evidence.soname, GMP_SONAME)
        self.assertEqual(evidence.gmp_family_dependencies, ())
        self.assertEqual(
            evidence.defined_required_dynsymbols,
            frozen_required_dynsymbols("gmp"),
        )

        self_dependent = _build_elf(
            "gmp",
            needed=(GMP_SONAME, "libc.so.6"),
        )
        _assert_code(
            self,
            self_dependent.raw,
            _expectation(self_dependent.raw, "gmp"),
            "gmp_self_family_dependency_forbidden",
        )

    def test_mpfr_component_soname_uses_exact_family_grammar(self) -> None:
        fixture = _build_elf("mpfr", soname="libevil.so")
        _assert_code(
            self,
            fixture.raw,
            _expectation(fixture.raw, "mpfr", soname="libevil.so"),
            "invalid_expected_soname",
        )


class StaticElfHeaderAndBoundTests(unittest.TestCase):
    def test_exact_elf_identity_is_enforced(self) -> None:
        fixture = _build_elf("gmp")
        cases = (
            (0, b"BAD!", "elf_magic_mismatch"),
            (4, b"\x01", "elf_class_not_64"),
            (5, b"\x02", "elf_not_little_endian"),
            (16, struct.pack("<H", 2), "elf_object_type_not_et_dyn"),
            (18, struct.pack("<H", 183), "elf_machine_not_x86_64"),
        )
        for offset, replacement_bytes, code in cases:
            with self.subTest(code=code):
                raw = _mutate(fixture.raw, offset, replacement_bytes)
                _assert_code(self, raw, _expectation(raw, "gmp"), code)

    def test_header_table_ranges_and_caps_fail_before_iteration(self) -> None:
        fixture = _build_elf("gmp")
        raw = _mutate(fixture.raw, 56, struct.pack("<H", MAX_PROGRAM_HEADERS + 1))
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "program_header_count_cap_exceeded",
        )
        raw = _mutate(fixture.raw, 60, struct.pack("<H", MAX_SECTION_HEADERS + 1))
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "section_header_count_cap_exceeded",
        )
        raw = _mutate(fixture.raw, 40, struct.pack("<Q", len(fixture.raw) - 8))
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "section_header_table_out_of_bounds",
        )
        expectation = replace(
            _expectation(fixture.raw, "gmp"),
            expected_byte_length=MAX_ELF_BYTES + 1,
        )
        _assert_code(self, fixture.raw, expectation, "invalid_expected_byte_length")

    def test_program_and_section_mapping_inconsistencies_are_rejected(self) -> None:
        fixture = _build_elf("gmp")
        raw = _mutate(
            fixture.raw,
            64 + 56 + 8,
            struct.pack("<Q", fixture.dynamic_offset + 8),
        )
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "dynamic_segment_section_mismatch",
        )
        dynsym_index = fixture.section_indices[".dynsym"]
        dynsym_header = fixture.section_offset + dynsym_index * 64
        raw = _mutate(fixture.raw, dynsym_header + 40, struct.pack("<I", 1))
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "dynamic_symbol_string_link_mismatch",
        )
        raw = _mutate(fixture.raw, dynsym_header + 24, struct.pack("<Q", len(fixture.raw)))
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "section_file_range_out_of_bounds",
        )

        # Keep the address in the LOAD range but break its file/address delta.
        raw = _mutate(
            fixture.raw,
            dynsym_header + 16,
            struct.pack("<Q", fixture.dynsym_offset + 1),
        )
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "required_alloc_section_mapping_ambiguous",
        )

        raw = _mutate(
            fixture.raw,
            dynsym_header + 16,
            struct.pack("<Q", (1 << 64) - 1),
        )
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "section_virtual_range_overflow",
        )

    def test_all_declared_caps_are_positive_and_bounded(self) -> None:
        self.assertGreater(MAX_ELF_BYTES, 64)
        self.assertLessEqual(MAX_ELF_BYTES, 64 * 1024 * 1024)
        self.assertGreater(MAX_PROGRAM_HEADERS, 0)
        self.assertGreater(MAX_SECTION_HEADERS, 0)
        self.assertGreater(MAX_DYNAMIC_ENTRIES, 0)
        self.assertGreater(MAX_DYNSYMBOLS, 0)
        self.assertGreater(MAX_NEEDED_ENTRIES, 0)
        self.assertGreater(MAX_STRING_TABLE_BYTES, 0)

    def test_conflicting_or_ambiguous_load_mappings_are_rejected(self) -> None:
        conflicting = _build_elf("gmp", extra_load_delta=4096)
        _assert_code(
            self,
            conflicting.raw,
            _expectation(conflicting.raw, "gmp"),
            "conflicting_overlapping_load_mappings",
        )
        duplicate = _build_elf("gmp", extra_load_delta=0)
        _assert_code(
            self,
            duplicate.raw,
            _expectation(duplicate.raw, "gmp"),
            "required_alloc_section_mapping_ambiguous",
        )


class StaticElfMetadataTests(unittest.TestCase):
    def test_soname_mismatch_and_duplicate_tag_are_typed(self) -> None:
        fixture = _build_elf("gmp")
        _assert_code(
            self,
            fixture.raw,
            _expectation(fixture.raw, "gmp", soname="libgmp.so.11"),
            "elf_soname_mismatch",
        )
        duplicate = _build_elf("gmp", duplicate_soname_tag=True)
        _assert_code(
            self,
            duplicate.raw,
            _expectation(duplicate.raw, "gmp"),
            "dynamic_soname_tag_mismatch",
        )

    def test_mpfr_requires_exactly_one_exact_gmp_family_dependency(self) -> None:
        cases = (
            (
                ("libc.so.6",),
                "mpfr_gmp_family_dependency_count_mismatch",
            ),
            (
                ("libc.so.6", "libgmp.so.11"),
                "mpfr_gmp_dependency_soname_mismatch",
            ),
            (
                (GMP_SONAME, "libgmpxx.so.4"),
                "unrecognized_gmp_dependency_alias",
            ),
            (
                (GMP_SONAME, "libgmp.so.11"),
                "mpfr_gmp_family_dependency_count_mismatch",
            ),
            (
                (GMP_SONAME, "libgmpmalicious.so"),
                "unrecognized_gmp_dependency_alias",
            ),
            (
                (GMP_SONAME, "libgmp.so.10evil"),
                "unrecognized_gmp_dependency_alias",
            ),
            (
                (GMP_SONAME, "LIBGMP.so.10"),
                "unrecognized_gmp_dependency_alias",
            ),
        )
        for needed, code in cases:
            with self.subTest(needed=needed):
                fixture = _build_elf("mpfr", needed=needed)
                _assert_code(
                    self,
                    fixture.raw,
                    _expectation(fixture.raw, "mpfr"),
                    code,
                )

        unversioned = _build_elf("mpfr", needed=("libc.so.6", "libgmp.so"))
        evidence = inspect_static_elf(
            unversioned.raw,
            _expectation(
                unversioned.raw,
                "mpfr",
                expected_gmp_soname="libgmp.so",
            ),
        )
        self.assertEqual(evidence.gmp_family_dependencies, ("libgmp.so",))

        invalid_expectation = replace(
            _expectation(unversioned.raw, "mpfr"),
            expected_gmp_soname="libgmp.so.10.2",
        )
        _assert_code(
            self,
            unversioned.raw,
            invalid_expectation,
            "invalid_expected_gmp_soname",
        )

    def test_version_marker_must_be_one_exact_readonly_rodata_string(self) -> None:
        missing = _build_elf("gmp", version_tokens=(b"GMP 6.2.1",))
        _assert_code(
            self,
            missing.raw,
            _expectation(missing.raw, "gmp"),
            "expected_version_marker_missing",
        )
        ambiguous = _build_elf("gmp", version_tokens=(GMP_MARKER, GMP_MARKER))
        _assert_code(
            self,
            ambiguous.raw,
            _expectation(ambiguous.raw, "gmp"),
            "expected_version_marker_ambiguous",
        )
        substring = _build_elf("gmp", version_tokens=(b"prefix GMP 6.3.0 suffix",))
        _assert_code(
            self,
            substring.raw,
            _expectation(substring.raw, "gmp"),
            "expected_version_marker_missing",
        )
        writable = _build_elf("gmp", writable_rodata=True)
        _assert_code(
            self,
            writable.raw,
            _expectation(writable.raw, "gmp"),
            "expected_version_marker_missing",
        )

        executable = _build_elf("gmp")
        rodata_header = (
            executable.section_offset
            + executable.section_indices[".rodata"] * 64
        )
        raw = _mutate(executable.raw, rodata_header + 8, struct.pack("<Q", 6))
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "expected_version_marker_missing",
        )

        nonterminated = _build_elf("gmp")
        rodata_header = (
            nonterminated.section_offset
            + nonterminated.section_indices[".rodata"] * 64
        )
        rodata_offset = struct.unpack_from(
            "<Q", nonterminated.raw, rodata_header + 24
        )[0]
        raw = _mutate(
            nonterminated.raw,
            int(rodata_offset) + len(GMP_MARKER),
            b"X",
        )
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "expected_version_marker_missing",
        )

        multiply_mapped = _build_elf(
            "gmp",
            extra_load_delta=0,
            extra_load_scope="marker",
        )
        _assert_code(
            self,
            multiply_mapped.raw,
            _expectation(multiply_mapped.raw, "gmp"),
            "version_marker_section_mapping_ambiguous",
        )

    def test_dynamic_table_requires_null_and_exact_linked_table_tags(self) -> None:
        no_null = _build_elf("gmp", terminate_dynamic=False)
        _assert_code(
            self,
            no_null.raw,
            _expectation(no_null.raw, "gmp"),
            "dynamic_null_terminator_missing",
        )
        fixture = _build_elf("gmp")
        # DT_STRTAB is after every DT_NEEDED entry. GMP has one NEEDED entry.
        strtab_value = fixture.dynamic_offset + 16 + 8
        raw = _mutate(fixture.raw, strtab_value, struct.pack("<Q", 1))
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "dynamic_strtab_address_mismatch",
        )


class StaticElfSymbolTests(unittest.TestCase):
    def test_missing_undefined_and_mere_string_symbols_do_not_pass(self) -> None:
        required = frozen_required_dynsymbols("gmp")
        missing_name = required[-1]
        entries = tuple((symbol, True, 1, 0) for symbol in required[:-1])
        missing = _build_elf(
            "gmp",
            symbol_entries=entries,
            extra_dynstr_strings=(missing_name,),
        )
        _assert_code(
            self,
            missing.raw,
            _expectation(missing.raw, "gmp"),
            "required_dynsymbol_missing",
        )

        undefined_entries = tuple(
            (symbol, symbol != missing_name, 1, 0) for symbol in required
        )
        undefined = _build_elf("gmp", symbol_entries=undefined_entries)
        _assert_code(
            self,
            undefined.raw,
            _expectation(undefined.raw, "gmp"),
            "required_dynsymbol_undefined",
        )

    def test_duplicate_local_or_hidden_required_symbols_fail(self) -> None:
        required = frozen_required_dynsymbols("gmp")
        duplicate_name = required[0]
        duplicate_entries = tuple((symbol, True, 1, 0) for symbol in required) + (
            (duplicate_name, True, 1, 0),
        )
        duplicate = _build_elf("gmp", symbol_entries=duplicate_entries)
        _assert_code(
            self,
            duplicate.raw,
            _expectation(duplicate.raw, "gmp"),
            "required_dynsymbol_ambiguous",
        )

        local_entries = tuple(
            (symbol, True, 0 if symbol == duplicate_name else 1, 0)
            for symbol in required
        )
        local = _build_elf("gmp", symbol_entries=local_entries)
        _assert_code(
            self,
            local.raw,
            _expectation(local.raw, "gmp"),
            "required_dynsymbol_not_exported",
        )

        hidden_entries = tuple(
            (symbol, True, 1, 2 if symbol == duplicate_name else 0)
            for symbol in required
        )
        hidden = _build_elf("gmp", symbol_entries=hidden_entries)
        _assert_code(
            self,
            hidden.raw,
            _expectation(hidden.raw, "gmp"),
            "required_dynsymbol_not_exported",
        )

    def test_required_symbol_type_value_size_and_real_section_are_enforced(self) -> None:
        fixture = _build_elf("gmp")
        function_name = "__gmpz_init"
        function_offset = fixture.symbol_entry_offsets[function_name][0]
        raw = _mutate(fixture.raw, function_offset + 4, bytes(((1 << 4) | 1,)))
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "required_dynsymbol_type_mismatch",
        )

        object_offset = fixture.symbol_entry_offsets["__gmp_version"][0]
        raw = _mutate(fixture.raw, object_offset + 4, bytes(((1 << 4) | 2,)))
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "required_dynsymbol_type_mismatch",
        )

        raw = _mutate(fixture.raw, function_offset + 16, struct.pack("<Q", 0))
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "required_dynsymbol_size_invalid",
        )
        raw = _mutate(fixture.raw, function_offset + 8, struct.pack("<Q", 1 << 63))
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "required_dynsymbol_outside_defining_section",
        )
        raw = _mutate(fixture.raw, function_offset + 6, struct.pack("<H", 0xFFF1))
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "required_dynsymbol_special_section_forbidden",
        )

        text_header = fixture.section_offset + fixture.section_indices[".text"] * 64
        raw = _mutate(fixture.raw, text_header + 8, struct.pack("<Q", 2))
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "required_function_section_not_executable",
        )

        data_header = fixture.section_offset + fixture.section_indices[".data"] * 64
        raw = _mutate(fixture.raw, data_header + 8, struct.pack("<Q", 7))
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "required_object_section_executable",
        )

        nonexecutable_load = _mutate(
            fixture.raw,
            64 + 4,
            struct.pack("<I", 4),
        )
        _assert_code(
            self,
            nonexecutable_load,
            _expectation(nonexecutable_load, "gmp"),
            "required_function_load_not_read_executable",
        )

    def test_gnu_versym_default_hidden_local_and_definition_states(self) -> None:
        for mode in ("global", "defined2"):
            with self.subTest(valid_mode=mode):
                fixture = _build_elf("gmp", versym_mode=mode)
                evidence = inspect_static_elf(
                    fixture.raw,
                    _expectation(fixture.raw, "gmp"),
                )
                self.assertTrue(evidence.static_required_dynsymbols_defined)

        for mode, code in (
            ("hidden", "required_dynsymbol_version_hidden"),
            ("local", "required_dynsymbol_version_local"),
            (
                "unresolved2",
                "required_dynsymbol_version_definition_unestablished",
            ),
        ):
            with self.subTest(invalid_mode=mode):
                fixture = _build_elf("gmp", versym_mode=mode)
                _assert_code(
                    self,
                    fixture.raw,
                    _expectation(fixture.raw, "gmp"),
                    code,
                )

        wrong_type = _build_elf("gmp", versym_mode="global")
        versym_header = (
            wrong_type.section_offset
            + wrong_type.section_indices[".gnu.version"] * 64
        )
        raw = _mutate(wrong_type.raw, versym_header + 4, struct.pack("<I", 1))
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "gnu_versym_section_ambiguous",
        )

    def test_loader_dynamic_version_tags_are_authoritative(self) -> None:
        def tag_offsets(fixture: BuiltElf, tag: int) -> tuple[int, ...]:
            offsets: list[int] = []
            for index in range(fixture.dynamic_entry_count):
                offset = fixture.dynamic_offset + index * 16
                observed, _value = struct.unpack_from("<qQ", fixture.raw, offset)
                if observed == tag:
                    offsets.append(offset)
            return tuple(offsets)

        global_fixture = _build_elf("gmp", versym_mode="global")
        versym_tag = tag_offsets(global_fixture, 0x6FFFFFF0)
        self.assertEqual(len(versym_tag), 1)
        raw = _mutate(
            global_fixture.raw,
            versym_tag[0] + 8,
            struct.pack("<Q", len(global_fixture.raw) - 1),
        )
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "dynamic_versym_address_mismatch",
        )

        defined_fixture = _build_elf("gmp", versym_mode="defined2")
        verdef_tag = tag_offsets(defined_fixture, 0x6FFFFFFC)
        verdefnum_tag = tag_offsets(defined_fixture, 0x6FFFFFFD)
        self.assertEqual((len(verdef_tag), len(verdefnum_tag)), (1, 1))
        raw = _mutate(
            defined_fixture.raw,
            verdef_tag[0] + 8,
            struct.pack("<Q", len(defined_fixture.raw) - 1),
        )
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "dynamic_verdef_address_mismatch",
        )
        raw = _mutate(
            defined_fixture.raw,
            verdefnum_tag[0] + 8,
            struct.pack("<Q", 2),
        )
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "dynamic_verdef_count_mismatch",
        )

        unversioned = _build_elf("gmp")
        first_dynamic_tag = unversioned.dynamic_offset
        raw = _mutate(
            unversioned.raw,
            first_dynamic_tag,
            struct.pack("<q", 0x6FFFFFF0),
        )
        _assert_code(
            self,
            raw,
            _expectation(raw, "gmp"),
            "dynamic_versym_tag_without_section",
        )


class StaticElfHostileInputTests(unittest.TestCase):
    def test_exact_bytes_digest_and_frozen_inventory_are_required(self) -> None:
        fixture = _build_elf("gmp")
        expectation = _expectation(fixture.raw, "gmp")
        _assert_code(
            self,
            bytearray(fixture.raw),
            expectation,
            "exact_immutable_bytes_required",
        )

        class HostileBytes(bytes):
            pass

        _assert_code(
            self,
            HostileBytes(fixture.raw),
            expectation,
            "exact_immutable_bytes_required",
        )
        wrong_digest = replace(expectation, expected_plain_sha256="0" * 64)
        _assert_code(
            self,
            fixture.raw,
            wrong_digest,
            "elf_plain_sha256_mismatch",
        )
        missing_inventory = replace(
            expectation,
            required_dynsymbols=expectation.required_dynsymbols[:-1],
        )
        _assert_code(
            self,
            fixture.raw,
            missing_inventory,
            "required_dynsymbol_inventory_mismatch",
        )

    def test_hostile_metadata_subclasses_are_rejected(self) -> None:
        class HostileString(str):
            pass

        fixture = _build_elf("gmp")
        expectation = replace(
            _expectation(fixture.raw, "gmp"),
            expected_soname=HostileString(GMP_SONAME),
        )
        _assert_code(self, fixture.raw, expectation, "invalid_expected_soname")

        wrong_gmp_family = replace(
            _expectation(fixture.raw, "gmp"),
            expected_soname="libgmpmalicious.so",
        )
        _assert_code(
            self,
            fixture.raw,
            wrong_gmp_family,
            "invalid_expected_soname",
        )

    def test_source_has_no_host_io_loader_environment_or_peer_import(self) -> None:
        source = Path(rn256_elf.__file__).read_text(encoding="utf-8")
        tree = ast.parse(source)
        imported_roots: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imported_roots.update(alias.name.split(".", 1)[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imported_roots.add(node.module.split(".", 1)[0])
        self.assertNotIn("ctypes", imported_roots)
        self.assertNotIn("os", imported_roots)
        self.assertNotIn("pathlib", imported_roots)
        self.assertNotIn("subprocess", imported_roots)
        self.assertNotIn("verifier", source.lower())
        self.assertNotIn("find_library", source)
        self.assertNotIn("getenv", source)
        self.assertNotIn("environ", source)
        self.assertNotIn("open(", source)


if __name__ == "__main__":
    unittest.main()
