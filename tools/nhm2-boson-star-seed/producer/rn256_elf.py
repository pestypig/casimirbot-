"""Bounded static ELF evidence for the producer RN256 runtime manifest.

The public function consumes exact immutable bytes and caller-pinned metadata.
It never opens a host file, invokes a loader, maps a runtime, executes a
symbol, performs arithmetic, or serializes numerical output.  A successful
result is static metadata evidence only and grants no authority.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import re
import struct

from rn256_runtime import REQUIRED_GMP_SYMBOLS, REQUIRED_MPFR_SYMBOLS


STATIC_ELF_EVIDENCE_SCHEMA_VERSION = (
    "nhm2_prolate_boson_star_newtonian_seed_rn256_static_elf_evidence/v1"
)

MAX_ELF_BYTES = 64 * 1024 * 1024
MAX_PROGRAM_HEADERS = 256
MAX_SECTION_HEADERS = 4096
MAX_DYNAMIC_ENTRIES = 8192
MAX_STRING_TABLE_BYTES = 16 * 1024 * 1024
MAX_STRING_BYTES = 4096
MAX_DYNSYMBOLS = 262_144
MAX_NEEDED_ENTRIES = 256
MAX_VERSION_MARKER_BYTES = 256
MAX_U64 = (1 << 64) - 1

ELF_HEADER_SIZE = 64
PROGRAM_HEADER_SIZE = 56
SECTION_HEADER_SIZE = 64
DYNAMIC_ENTRY_SIZE = 16
SYMBOL_ENTRY_SIZE = 24

ET_DYN = 3
EM_X86_64 = 62
EV_CURRENT = 1
PT_LOAD = 1
PT_DYNAMIC = 2
PF_X = 0x1
PF_W = 0x2
PF_R = 0x4
SHT_NULL = 0
SHT_PROGBITS = 1
SHT_STRTAB = 3
SHT_DYNAMIC = 6
SHT_NOBITS = 8
SHT_DYNSYM = 11
SHT_GNU_VERDEF = 0x6FFFFFFD
SHT_GNU_VERSYM = 0x6FFFFFFF
SHF_WRITE = 0x1
SHF_ALLOC = 0x2
SHF_EXECINSTR = 0x4
SHN_UNDEF = 0
SHN_LORESERVE = 0xFF00
SHN_XINDEX = 0xFFFF
DT_NULL = 0
DT_NEEDED = 1
DT_STRTAB = 5
DT_SYMTAB = 6
DT_STRSZ = 10
DT_SYMENT = 11
DT_SONAME = 14
DT_VERSYM = 0x6FFFFFF0
DT_VERDEF = 0x6FFFFFFC
DT_VERDEFNUM = 0x6FFFFFFD
STT_OBJECT = 1
STT_FUNC = 2
VERSYM_HIDDEN = 0x8000
VERSYM_INDEX_MASK = 0x7FFF
VER_NDX_LOCAL = 0
VER_NDX_GLOBAL = 1
VER_DEF_CURRENT = 1

_LOWER_SHA256 = re.compile(r"[0-9a-f]{64}\Z")
_SAFE_METADATA = re.compile(r"[\x21-\x7e]+\Z")
_MPFR_SONAME = re.compile(r"libmpfr\.so(?:\.[0-9]+)?\Z")
_GMP_SONAME = re.compile(r"libgmp\.so(?:\.[0-9]+)?\Z")

# These two extraction/sign-handling symbols are frozen here additively for
# the static ELF boundary.  The earlier manifest observer remains untouched
# in this slice.
PRODUCER_MPFR_REQUIRED_DYNSYMBOLS = REQUIRED_MPFR_SYMBOLS + (
    () if "mpfr_get_z_2exp" in REQUIRED_MPFR_SYMBOLS else ("mpfr_get_z_2exp",)
)
PRODUCER_GMP_REQUIRED_DYNSYMBOLS = REQUIRED_GMP_SYMBOLS + (
    () if "__gmpz_neg" in REQUIRED_GMP_SYMBOLS else ("__gmpz_neg",)
)


class StaticElfInspectionError(RuntimeError):
    """Deterministic fail-closed static ELF inspection error."""

    def __init__(self, code: str, *, detail: str | None = None) -> None:
        if type(code) is not str or not code:
            raise TypeError("error code must be an exact nonempty string")
        self.code = code
        self.detail = detail
        super().__init__(code if detail is None else f"{code}:{detail}")


@dataclass(frozen=True, slots=True)
class StaticElfExpectation:
    component: str
    expected_byte_length: int
    expected_plain_sha256: str
    expected_soname: str
    expected_version_marker: bytes
    expected_gmp_soname: str | None
    required_dynsymbols: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class StaticElfMetadataEvidence:
    schema_version: str
    component: str
    byte_length: int
    plain_sha256: str
    elf_class: str
    byte_order: str
    machine: str
    object_type: str
    program_header_count: int
    section_header_count: int
    dynamic_entry_count: int
    dynsymbol_count: int
    soname: str
    needed_sonames: tuple[str, ...]
    gmp_family_dependencies: tuple[str, ...]
    version_marker: bytes
    defined_required_dynsymbols: tuple[str, ...]
    static_structure_validated: bool
    static_soname_match: bool
    static_dependency_match: bool
    static_version_marker_match: bool
    static_required_dynsymbols_defined: bool
    static_metadata_evidence_only: bool
    host_file_access_attempted: bool
    loader_attempted: bool
    runtime_mapping_established: bool
    runtime_symbol_resolution_attempted: bool
    runtime_configuration_attempted: bool
    canary_attempted: bool
    conformance_attempted: bool
    serialization_executed: bool
    arithmetic_executed: bool
    runtime_conformance_authority: bool
    execution_authority: bool
    admission_authority: bool
    scientific_authority: bool
    physical_viability_established: bool
    propulsion_capability_established: bool
    transport_capability_established: bool


@dataclass(frozen=True, slots=True)
class _ProgramHeader:
    index: int
    p_type: int
    flags: int
    offset: int
    virtual_address: int
    file_size: int
    memory_size: int
    alignment: int


@dataclass(frozen=True, slots=True)
class _SectionHeader:
    index: int
    name_offset: int
    section_type: int
    flags: int
    address: int
    offset: int
    size: int
    link: int
    info: int
    alignment: int
    entry_size: int


@dataclass(frozen=True, slots=True)
class _NamedSection:
    header: _SectionHeader
    name: str


def frozen_required_dynsymbols(component: str) -> tuple[str, ...]:
    if type(component) is not str:
        raise StaticElfInspectionError("invalid_component")
    if component == "mpfr":
        return PRODUCER_MPFR_REQUIRED_DYNSYMBOLS
    if component == "gmp":
        return PRODUCER_GMP_REQUIRED_DYNSYMBOLS
    raise StaticElfInspectionError("invalid_component")


def _fail(code: str, detail: str | None = None) -> None:
    raise StaticElfInspectionError(code, detail=detail)


def _checked_range(
    offset: int,
    size: int,
    total: int,
    code: str,
) -> tuple[int, int]:
    if offset < 0 or size < 0 or offset > total or size > total - offset:
        _fail(code)
    return offset, offset + size


def _overlap(left: tuple[int, int], right: tuple[int, int]) -> bool:
    return max(left[0], right[0]) < min(left[1], right[1])


def _is_power_of_two(value: int) -> bool:
    return value > 0 and value & (value - 1) == 0


def _checked_u64_extent(start: int, size: int, code: str) -> None:
    if start < 0 or size < 0 or start > MAX_U64 or size > MAX_U64 - start:
        _fail(code)


def _validate_metadata_text(value: object, code: str) -> str:
    if (
        type(value) is not str
        or not value
        or len(value) > MAX_STRING_BYTES
        or _SAFE_METADATA.fullmatch(value) is None
        or "/" in value
        or "\\" in value
    ):
        _fail(code)
    return value


def _validate_expectation(expectation: StaticElfExpectation) -> None:
    if type(expectation) is not StaticElfExpectation:
        _fail("invalid_expectation_type")
    required = frozen_required_dynsymbols(expectation.component)
    if (
        type(expectation.expected_byte_length) is not int
        or isinstance(expectation.expected_byte_length, bool)
        or expectation.expected_byte_length < ELF_HEADER_SIZE
        or expectation.expected_byte_length > MAX_ELF_BYTES
    ):
        _fail("invalid_expected_byte_length")
    if (
        type(expectation.expected_plain_sha256) is not str
        or _LOWER_SHA256.fullmatch(expectation.expected_plain_sha256) is None
    ):
        _fail("invalid_expected_plain_sha256")
    expected_soname = _validate_metadata_text(
        expectation.expected_soname,
        "invalid_expected_soname",
    )
    if expectation.component == "mpfr" and _MPFR_SONAME.fullmatch(expected_soname) is None:
        _fail("invalid_expected_soname")
    if expectation.component == "gmp" and not _is_gmp_family(expected_soname):
        _fail("invalid_expected_soname")
    marker = expectation.expected_version_marker
    if (
        type(marker) is not bytes
        or not marker
        or len(marker) > MAX_VERSION_MARKER_BYTES
        or b"\x00" in marker
        or any(byte < 0x20 or byte > 0x7E for byte in marker)
    ):
        _fail("invalid_expected_version_marker")
    if type(expectation.required_dynsymbols) is not tuple or any(
        type(symbol) is not str or not symbol
        for symbol in expectation.required_dynsymbols
    ):
        _fail("invalid_required_dynsymbol_inventory")
    if expectation.required_dynsymbols != required:
        _fail("required_dynsymbol_inventory_mismatch")
    if len(set(required)) != len(required):
        _fail("required_dynsymbol_inventory_duplicate")

    if expectation.component == "mpfr":
        gmp_soname = _validate_metadata_text(
            expectation.expected_gmp_soname,
            "invalid_expected_gmp_soname",
        )
        if not _is_gmp_family(gmp_soname):
            _fail("invalid_expected_gmp_soname")
    elif expectation.expected_gmp_soname is not None:
        _fail("unexpected_gmp_dependency_expectation")


def _is_gmp_family(soname: str) -> bool:
    return _GMP_SONAME.fullmatch(soname) is not None


def _looks_like_unrecognized_gmp_alias(soname: str) -> bool:
    return soname.casefold().startswith("libgmp") and not _is_gmp_family(soname)


def _unpack_from(
    format_string: str,
    raw: bytes,
    offset: int,
    size: int,
    code: str,
) -> tuple[object, ...]:
    _checked_range(offset, size, len(raw), code)
    try:
        return struct.unpack_from(format_string, raw, offset)
    except struct.error:
        _fail(code)


def _parse_header(
    raw: bytes,
) -> tuple[int, int, int, int, int, int, int]:
    if len(raw) < ELF_HEADER_SIZE:
        _fail("elf_header_truncated")
    ident = raw[:16]
    if ident[:4] != b"\x7fELF":
        _fail("elf_magic_mismatch")
    if ident[4] != 2:
        _fail("elf_class_not_64")
    if ident[5] != 1:
        _fail("elf_not_little_endian")
    if ident[6] != EV_CURRENT:
        _fail("elf_ident_version_mismatch")
    if ident[7] not in (0, 3) or ident[8] != 0 or ident[9:16] != b"\x00" * 7:
        _fail("elf_ident_abi_mismatch")
    unpacked = _unpack_from(
        "<HHIQQQIHHHHHH",
        raw,
        16,
        48,
        "elf_header_truncated",
    )
    (
        object_type,
        machine,
        version,
        _entry,
        program_offset,
        section_offset,
        flags,
        header_size,
        program_entry_size,
        program_count,
        section_entry_size,
        section_count,
        section_name_index,
    ) = (int(value) for value in unpacked)
    if object_type != ET_DYN:
        _fail("elf_object_type_not_et_dyn")
    if machine != EM_X86_64:
        _fail("elf_machine_not_x86_64")
    if version != EV_CURRENT or flags != 0:
        _fail("elf_header_version_or_flags_mismatch")
    if header_size != ELF_HEADER_SIZE:
        _fail("elf_header_size_mismatch")
    if program_entry_size != PROGRAM_HEADER_SIZE:
        _fail("program_header_entry_size_mismatch")
    if section_entry_size != SECTION_HEADER_SIZE:
        _fail("section_header_entry_size_mismatch")
    if program_count == 0 or program_count >= 0xFFFF:
        _fail("program_header_count_invalid")
    if program_count > MAX_PROGRAM_HEADERS:
        _fail("program_header_count_cap_exceeded")
    if section_count == 0:
        _fail("extended_or_absent_section_count_forbidden")
    if section_count > MAX_SECTION_HEADERS:
        _fail("section_header_count_cap_exceeded")
    if section_name_index == SHN_XINDEX or not 0 < section_name_index < section_count:
        _fail("section_name_table_index_invalid")
    if program_offset < ELF_HEADER_SIZE or section_offset < ELF_HEADER_SIZE:
        _fail("elf_table_overlaps_header")
    program_range = _checked_range(
        program_offset,
        program_count * PROGRAM_HEADER_SIZE,
        len(raw),
        "program_header_table_out_of_bounds",
    )
    section_range = _checked_range(
        section_offset,
        section_count * SECTION_HEADER_SIZE,
        len(raw),
        "section_header_table_out_of_bounds",
    )
    if _overlap(program_range, section_range):
        _fail("elf_header_tables_overlap")
    return (
        program_offset,
        program_count,
        section_offset,
        section_count,
        section_name_index,
        ident[7],
        ident[8],
    )


def _parse_program_headers(
    raw: bytes,
    offset: int,
    count: int,
) -> tuple[_ProgramHeader, ...]:
    result: list[_ProgramHeader] = []
    for index in range(count):
        values = _unpack_from(
            "<IIQQQQQQ",
            raw,
            offset + index * PROGRAM_HEADER_SIZE,
            PROGRAM_HEADER_SIZE,
            "program_header_out_of_bounds",
        )
        (
            p_type,
            flags,
            file_offset,
            virtual_address,
            _physical_address,
            file_size,
            memory_size,
            alignment,
        ) = (int(value) for value in values)
        if file_size > memory_size:
            _fail("program_file_size_exceeds_memory_size", str(index))
        _checked_u64_extent(
            virtual_address,
            memory_size,
            "program_virtual_range_overflow",
        )
        if file_size:
            _checked_range(
                file_offset,
                file_size,
                len(raw),
                "program_file_range_out_of_bounds",
            )
        if alignment not in (0, 1):
            if not _is_power_of_two(alignment):
                _fail("program_alignment_invalid", str(index))
            if file_offset % alignment != virtual_address % alignment:
                _fail("program_offset_address_alignment_mismatch", str(index))
        result.append(
            _ProgramHeader(
                index=index,
                p_type=p_type,
                flags=flags,
                offset=file_offset,
                virtual_address=virtual_address,
                file_size=file_size,
                memory_size=memory_size,
                alignment=alignment,
            )
        )
    if sum(header.p_type == PT_LOAD for header in result) < 1:
        _fail("load_program_header_missing")
    if sum(header.p_type == PT_DYNAMIC for header in result) != 1:
        _fail("dynamic_program_header_count_mismatch")
    return tuple(result)


def _parse_section_headers(
    raw: bytes,
    offset: int,
    count: int,
    program_range: tuple[int, int],
    section_range: tuple[int, int],
) -> tuple[_SectionHeader, ...]:
    result: list[_SectionHeader] = []
    occupied: list[tuple[int, int, int]] = []
    for index in range(count):
        values = _unpack_from(
            "<IIQQQQIIQQ",
            raw,
            offset + index * SECTION_HEADER_SIZE,
            SECTION_HEADER_SIZE,
            "section_header_out_of_bounds",
        )
        (
            name_offset,
            section_type,
            flags,
            address,
            file_offset,
            size,
            link,
            info,
            alignment,
            entry_size,
        ) = (int(value) for value in values)
        header = _SectionHeader(
            index=index,
            name_offset=name_offset,
            section_type=section_type,
            flags=flags,
            address=address,
            offset=file_offset,
            size=size,
            link=link,
            info=info,
            alignment=alignment,
            entry_size=entry_size,
        )
        if alignment not in (0, 1) and not _is_power_of_two(alignment):
            _fail("section_alignment_invalid", str(index))
        _checked_u64_extent(address, size, "section_virtual_range_overflow")
        if section_type != SHT_NOBITS and size:
            body_range = _checked_range(
                file_offset,
                size,
                len(raw),
                "section_file_range_out_of_bounds",
            )
            if alignment > 1 and file_offset % alignment:
                _fail("section_offset_alignment_mismatch", str(index))
            if body_range[0] < ELF_HEADER_SIZE:
                _fail("section_body_overlaps_elf_header", str(index))
            if _overlap(body_range, program_range) or _overlap(
                body_range, section_range
            ):
                _fail("section_body_overlaps_header_table", str(index))
            for prior_start, prior_end, prior_index in occupied:
                if _overlap(body_range, (prior_start, prior_end)):
                    _fail(
                        "section_file_ranges_overlap",
                        f"{prior_index},{index}",
                    )
            occupied.append((body_range[0], body_range[1], index))
        result.append(header)
    if any(
        value != 0
        for value in (
            result[0].name_offset,
            result[0].section_type,
            result[0].flags,
            result[0].address,
            result[0].offset,
            result[0].size,
            result[0].link,
            result[0].info,
            result[0].alignment,
            result[0].entry_size,
        )
    ):
        _fail("null_section_header_not_zero")
    return tuple(result)


def _table_bytes(
    raw: bytes,
    header: _SectionHeader,
    *,
    cap: int,
    code: str,
) -> bytes:
    if header.section_type == SHT_NOBITS or header.size > cap:
        _fail(code)
    start, end = _checked_range(header.offset, header.size, len(raw), code)
    return raw[start:end]


def _read_ascii_string(table: bytes, offset: int, code: str) -> str:
    if offset < 0 or offset >= len(table):
        _fail(code)
    end = table.find(b"\x00", offset, min(len(table), offset + MAX_STRING_BYTES + 1))
    if end < 0:
        _fail(code)
    value = table[offset:end]
    try:
        decoded = value.decode("ascii", "strict")
    except UnicodeDecodeError:
        _fail(code)
    if any(ord(character) < 0x20 or ord(character) > 0x7E for character in decoded):
        _fail(code)
    return decoded


def _name_sections(
    raw: bytes,
    sections: tuple[_SectionHeader, ...],
    name_index: int,
) -> tuple[_NamedSection, ...]:
    names_header = sections[name_index]
    if names_header.section_type != SHT_STRTAB:
        _fail("section_name_table_type_mismatch")
    names = _table_bytes(
        raw,
        names_header,
        cap=MAX_STRING_TABLE_BYTES,
        code="section_name_table_invalid",
    )
    if not names or names[0] != 0 or names[-1] != 0:
        _fail("section_name_table_invalid")
    result = tuple(
        _NamedSection(
            header=header,
            name=(
                ""
                if header.index == 0
                else _read_ascii_string(
                    names,
                    header.name_offset,
                    "section_name_invalid",
                )
            ),
        )
        for header in sections
    )
    if result[name_index].name != ".shstrtab":
        _fail("section_name_table_name_mismatch")
    return result


def _unique_section(
    sections: tuple[_NamedSection, ...],
    name: str,
    section_type: int,
) -> _NamedSection:
    matches = tuple(
        section
        for section in sections
        if section.name == name and section.header.section_type == section_type
    )
    if len(matches) != 1:
        _fail("required_section_count_mismatch", name)
    if any(section.name == name for section in sections if section not in matches):
        _fail("required_section_type_mismatch", name)
    return matches[0]


def _range_contained(
    inner_offset: int,
    inner_size: int,
    outer_offset: int,
    outer_size: int,
) -> bool:
    return (
        inner_offset >= outer_offset
        and inner_size <= outer_size
        and inner_offset - outer_offset <= outer_size - inner_size
    )


def _load_mapping_matches_section(
    load: _ProgramHeader,
    section: _NamedSection,
) -> bool:
    header = section.header
    return (
        header.section_type != SHT_NOBITS
        and _range_contained(
            header.offset,
            header.size,
            load.offset,
            load.file_size,
        )
        and _range_contained(
            header.address,
            header.size,
            load.virtual_address,
            load.memory_size,
        )
        and header.offset - load.offset
        == header.address - load.virtual_address
    )


def _unique_load_mapping(
    programs: tuple[_ProgramHeader, ...],
    section: _NamedSection,
    code: str,
) -> _ProgramHeader:
    mappings = tuple(
        load
        for load in programs
        if load.p_type == PT_LOAD and _load_mapping_matches_section(load, section)
    )
    if len(mappings) != 1:
        _fail(code, section.name)
    return mappings[0]


def _validate_load_mapping_conflicts(
    programs: tuple[_ProgramHeader, ...],
) -> None:
    loads = tuple(header for header in programs if header.p_type == PT_LOAD)
    for left_index, left in enumerate(loads):
        left_file = (left.offset, left.offset + left.file_size)
        left_memory = (
            left.virtual_address,
            left.virtual_address + left.memory_size,
        )
        left_delta = left.virtual_address - left.offset
        for right in loads[left_index + 1 :]:
            right_file = (right.offset, right.offset + right.file_size)
            right_memory = (
                right.virtual_address,
                right.virtual_address + right.memory_size,
            )
            right_delta = right.virtual_address - right.offset
            if (
                (_overlap(left_file, right_file) or _overlap(left_memory, right_memory))
                and left_delta != right_delta
            ):
                _fail(
                    "conflicting_overlapping_load_mappings",
                    f"{left.index},{right.index}",
                )


def _validate_required_section_mapping(
    programs: tuple[_ProgramHeader, ...],
    dynamic: _NamedSection,
    dynstr: _NamedSection,
    dynsym: _NamedSection,
) -> None:
    dynamic_segments = tuple(
        header for header in programs if header.p_type == PT_DYNAMIC
    )
    segment = dynamic_segments[0]
    if (
        segment.offset != dynamic.header.offset
        or segment.file_size != dynamic.header.size
        or segment.virtual_address != dynamic.header.address
    ):
        _fail("dynamic_segment_section_mismatch")
    for section in (dynamic, dynstr, dynsym):
        if not section.header.flags & SHF_ALLOC:
            _fail("required_section_not_allocated", section.name)
        _unique_load_mapping(
            programs,
            section,
            "required_alloc_section_mapping_ambiguous",
        )


def _single_dynamic_value(
    entries: tuple[tuple[int, int], ...],
    tag: int,
    code: str,
) -> int:
    values = tuple(value for observed_tag, value in entries if observed_tag == tag)
    if len(values) != 1:
        _fail(code)
    return values[0]


def _optional_dynamic_value(
    entries: tuple[tuple[int, int], ...],
    tag: int,
    code: str,
) -> int | None:
    values = tuple(value for observed_tag, value in entries if observed_tag == tag)
    if len(values) > 1:
        _fail(code)
    return values[0] if values else None


def _parse_dynamic(
    raw: bytes,
    dynamic: _NamedSection,
    dynstr: _NamedSection,
    dynsym: _NamedSection,
) -> tuple[tuple[tuple[int, int], ...], tuple[str, ...], str, bytes]:
    header = dynamic.header
    if header.entry_size != DYNAMIC_ENTRY_SIZE or header.size % DYNAMIC_ENTRY_SIZE:
        _fail("dynamic_table_entry_size_invalid")
    count = header.size // DYNAMIC_ENTRY_SIZE
    if count == 0 or count > MAX_DYNAMIC_ENTRIES:
        _fail("dynamic_entry_count_invalid")
    table = _table_bytes(
        raw,
        header,
        cap=MAX_DYNAMIC_ENTRIES * DYNAMIC_ENTRY_SIZE,
        code="dynamic_table_invalid",
    )
    entries: list[tuple[int, int]] = []
    null_seen = False
    for index in range(count):
        tag, value = struct.unpack_from("<qQ", table, index * DYNAMIC_ENTRY_SIZE)
        if null_seen:
            if tag != DT_NULL or value != 0:
                _fail("dynamic_entries_after_null_nonzero")
            continue
        entries.append((int(tag), int(value)))
        if tag == DT_NULL:
            if value != 0:
                _fail("dynamic_null_value_nonzero")
            null_seen = True
    if not null_seen:
        _fail("dynamic_null_terminator_missing")
    frozen = tuple(entries)
    string_table = _table_bytes(
        raw,
        dynstr.header,
        cap=MAX_STRING_TABLE_BYTES,
        code="dynamic_string_table_invalid",
    )
    if not string_table or string_table[0] != 0 or string_table[-1] != 0:
        _fail("dynamic_string_table_invalid")
    if _single_dynamic_value(frozen, DT_STRTAB, "dynamic_strtab_tag_mismatch") != (
        dynstr.header.address
    ):
        _fail("dynamic_strtab_address_mismatch")
    if _single_dynamic_value(frozen, DT_STRSZ, "dynamic_strsz_tag_mismatch") != len(
        string_table
    ):
        _fail("dynamic_strsz_value_mismatch")
    if _single_dynamic_value(frozen, DT_SYMTAB, "dynamic_symtab_tag_mismatch") != (
        dynsym.header.address
    ):
        _fail("dynamic_symtab_address_mismatch")
    if (
        _single_dynamic_value(frozen, DT_SYMENT, "dynamic_syment_tag_mismatch")
        != SYMBOL_ENTRY_SIZE
    ):
        _fail("dynamic_syment_value_mismatch")
    soname_offset = _single_dynamic_value(
        frozen, DT_SONAME, "dynamic_soname_tag_mismatch"
    )
    soname = _read_ascii_string(
        string_table, soname_offset, "dynamic_soname_string_invalid"
    )
    needed_offsets = tuple(value for tag, value in frozen if tag == DT_NEEDED)
    if len(needed_offsets) > MAX_NEEDED_ENTRIES:
        _fail("dynamic_needed_count_cap_exceeded")
    needed = tuple(
        _read_ascii_string(
            string_table,
            value,
            "dynamic_needed_string_invalid",
        )
        for value in needed_offsets
    )
    if any(not name or "/" in name or "\\" in name for name in (soname,) + needed):
        _fail("dynamic_library_name_invalid")
    if len(set(needed)) != len(needed):
        _fail("dynamic_needed_entries_duplicate")
    return frozen, needed, soname, string_table


def _parse_version_definitions(
    raw: bytes,
    sections: tuple[_NamedSection, ...],
    programs: tuple[_ProgramHeader, ...],
    dynstr: _NamedSection,
    string_table: bytes,
    dynamic_entries: tuple[tuple[int, int], ...],
) -> frozenset[int]:
    typed_matches = tuple(
        section
        for section in sections
        if section.header.section_type == SHT_GNU_VERDEF
    )
    named_matches = tuple(
        section for section in sections if section.name == ".gnu.version_d"
    )
    dynamic_address = _optional_dynamic_value(
        dynamic_entries,
        DT_VERDEF,
        "dynamic_verdef_tag_ambiguous",
    )
    dynamic_count = _optional_dynamic_value(
        dynamic_entries,
        DT_VERDEFNUM,
        "dynamic_verdefnum_tag_ambiguous",
    )
    if not typed_matches and not named_matches:
        if dynamic_address is not None or dynamic_count is not None:
            _fail("dynamic_verdef_tags_without_section")
        return frozenset()
    if (
        len(typed_matches) != 1
        or len(named_matches) != 1
        or typed_matches[0] is not named_matches[0]
    ):
        _fail("gnu_version_definition_section_ambiguous")
    section = typed_matches[0]
    header = section.header
    if (
        header.link != dynstr.header.index
        or not header.flags & SHF_ALLOC
        or header.flags & (SHF_WRITE | SHF_EXECINSTR)
    ):
        _fail("gnu_version_definition_section_invalid")
    if dynamic_address is None or dynamic_count is None:
        _fail("dynamic_verdef_tags_missing")
    if dynamic_address != header.address:
        _fail("dynamic_verdef_address_mismatch")
    if dynamic_count != header.info:
        _fail("dynamic_verdef_count_mismatch")
    _unique_load_mapping(
        programs,
        section,
        "gnu_version_definition_mapping_ambiguous",
    )
    data = _table_bytes(
        raw,
        header,
        cap=MAX_STRING_TABLE_BYTES,
        code="gnu_version_definition_table_invalid",
    )
    if not data:
        _fail("gnu_version_definition_table_invalid")
    cursor = 0
    seen_offsets: set[int] = set()
    definitions: set[int] = set()
    while True:
        if cursor in seen_offsets or len(seen_offsets) >= MAX_DYNSYMBOLS:
            _fail("gnu_version_definition_chain_invalid")
        seen_offsets.add(cursor)
        _checked_range(
            cursor,
            20,
            len(data),
            "gnu_version_definition_entry_out_of_bounds",
        )
        (
            version,
            _flags,
            version_index,
            auxiliary_count,
            _name_hash,
            auxiliary_offset,
            next_offset,
        ) = struct.unpack_from("<HHHHIII", data, cursor)
        if (
            version != VER_DEF_CURRENT
            or version_index < 2
            or version_index > VERSYM_INDEX_MASK
            or auxiliary_count == 0
            or version_index in definitions
        ):
            _fail("gnu_version_definition_entry_invalid")
        auxiliary_cursor = cursor + int(auxiliary_offset)
        for auxiliary_index in range(int(auxiliary_count)):
            _checked_range(
                auxiliary_cursor,
                8,
                len(data),
                "gnu_version_definition_aux_out_of_bounds",
            )
            name_offset, auxiliary_next = struct.unpack_from(
                "<II", data, auxiliary_cursor
            )
            name = _read_ascii_string(
                string_table,
                int(name_offset),
                "gnu_version_definition_name_invalid",
            )
            if not name:
                _fail("gnu_version_definition_name_invalid")
            if auxiliary_index + 1 < auxiliary_count:
                if auxiliary_next < 8:
                    _fail("gnu_version_definition_aux_chain_invalid")
                auxiliary_cursor += int(auxiliary_next)
            elif auxiliary_next != 0:
                _fail("gnu_version_definition_aux_chain_invalid")
        definitions.add(int(version_index))
        if next_offset == 0:
            if any(data[cursor + 20 + auxiliary_count * 8 :]):
                # A variable auxiliary chain may extend past the compact lower
                # bound above, so only reject nonzero bytes after the furthest
                # visited auxiliary record.
                tail_start = auxiliary_cursor + 8
                if any(data[tail_start:]):
                    _fail("gnu_version_definition_trailing_bytes_nonzero")
            break
        if next_offset < 20 or next_offset % 4:
            _fail("gnu_version_definition_chain_invalid")
        cursor += int(next_offset)
        if cursor >= len(data):
            _fail("gnu_version_definition_chain_invalid")
    if header.info != len(definitions):
        _fail("gnu_version_definition_count_mismatch")
    return frozenset(definitions)


def _parse_versym(
    raw: bytes,
    sections: tuple[_NamedSection, ...],
    programs: tuple[_ProgramHeader, ...],
    dynsym: _NamedSection,
    dynstr: _NamedSection,
    string_table: bytes,
    symbol_count: int,
    dynamic_entries: tuple[tuple[int, int], ...],
) -> tuple[tuple[int, ...] | None, frozenset[int]]:
    typed_matches = tuple(
        section
        for section in sections
        if section.header.section_type == SHT_GNU_VERSYM
    )
    named_matches = tuple(
        section for section in sections if section.name == ".gnu.version"
    )
    definitions = _parse_version_definitions(
        raw,
        sections,
        programs,
        dynstr,
        string_table,
        dynamic_entries,
    )
    dynamic_address = _optional_dynamic_value(
        dynamic_entries,
        DT_VERSYM,
        "dynamic_versym_tag_ambiguous",
    )
    if not typed_matches and not named_matches:
        if dynamic_address is not None:
            _fail("dynamic_versym_tag_without_section")
        if definitions:
            _fail("gnu_version_definitions_without_versym")
        return None, definitions
    if (
        len(typed_matches) != 1
        or len(named_matches) != 1
        or typed_matches[0] is not named_matches[0]
    ):
        _fail("gnu_versym_section_ambiguous")
    section = typed_matches[0]
    header = section.header
    if (
        header.link != dynsym.header.index
        or header.entry_size != 2
        or header.size != symbol_count * 2
        or not header.flags & SHF_ALLOC
        or header.flags & SHF_WRITE
    ):
        _fail("gnu_versym_section_invalid")
    if dynamic_address is None:
        _fail("dynamic_versym_tag_missing")
    if dynamic_address != header.address:
        _fail("dynamic_versym_address_mismatch")
    _unique_load_mapping(programs, section, "gnu_versym_mapping_ambiguous")
    data = _table_bytes(
        raw,
        header,
        cap=MAX_DYNSYMBOLS * 2,
        code="gnu_versym_table_invalid",
    )
    values = tuple(
        int(struct.unpack_from("<H", data, index * 2)[0])
        for index in range(symbol_count)
    )
    if values[0] != VER_NDX_LOCAL:
        _fail("gnu_versym_null_symbol_not_local")
    return values, definitions


def _parse_required_dynsymbols(
    raw: bytes,
    dynsym: _NamedSection,
    dynstr: _NamedSection,
    string_table: bytes,
    sections: tuple[_NamedSection, ...],
    programs: tuple[_ProgramHeader, ...],
    required: tuple[str, ...],
    dynamic_entries: tuple[tuple[int, int], ...],
) -> tuple[int, tuple[str, ...]]:
    header = dynsym.header
    if header.entry_size != SYMBOL_ENTRY_SIZE or header.size % SYMBOL_ENTRY_SIZE:
        _fail("dynamic_symbol_table_entry_size_invalid")
    count = header.size // SYMBOL_ENTRY_SIZE
    if count == 0 or count > MAX_DYNSYMBOLS:
        _fail("dynamic_symbol_count_invalid")
    table = _table_bytes(
        raw,
        header,
        cap=MAX_DYNSYMBOLS * SYMBOL_ENTRY_SIZE,
        code="dynamic_symbol_table_invalid",
    )
    if table[:SYMBOL_ENTRY_SIZE] != b"\x00" * SYMBOL_ENTRY_SIZE:
        _fail("dynamic_null_symbol_not_zero")
    versym, version_definitions = _parse_versym(
        raw,
        sections,
        programs,
        dynsym,
        dynstr,
        string_table,
        count,
        dynamic_entries,
    )
    matches: dict[str, list[tuple[int, int, int, int, int, int]]] = {
        symbol: [] for symbol in required
    }
    for index in range(1, count):
        name_offset, info, other, section_index, value, size = struct.unpack_from(
            "<IBBHQQ", table, index * SYMBOL_ENTRY_SIZE
        )
        if section_index == SHN_XINDEX:
            _fail("extended_symbol_section_index_forbidden", str(index))
        if section_index < SHN_LORESERVE and section_index >= len(sections):
            _fail("dynamic_symbol_section_index_invalid", str(index))
        name = _read_ascii_string(
            string_table,
            int(name_offset),
            "dynamic_symbol_name_invalid",
        )
        if name in matches:
            matches[name].append(
                (
                    index,
                    int(section_index),
                    int(info),
                    int(other),
                    int(value),
                    int(size),
                )
            )
    defined: list[str] = []
    for symbol in required:
        observed = matches[symbol]
        if not observed:
            _fail("required_dynsymbol_missing", symbol)
        if len(observed) != 1:
            _fail("required_dynsymbol_ambiguous", symbol)
        symbol_index, section_index, info, other, value, size = observed[0]
        if section_index == SHN_UNDEF:
            _fail("required_dynsymbol_undefined", symbol)
        binding = info >> 4
        visibility = other & 0x3
        if binding not in (1, 2) or visibility not in (0, 3):
            _fail("required_dynsymbol_not_exported", symbol)
        expected_type = STT_OBJECT if symbol == "__gmp_version" else STT_FUNC
        if info & 0xF != expected_type:
            _fail("required_dynsymbol_type_mismatch", symbol)
        if not 0 < section_index < len(sections):
            _fail("required_dynsymbol_special_section_forbidden", symbol)
        defining_section = sections[section_index]
        if (
            defining_section.header.section_type != SHT_PROGBITS
            or not defining_section.header.flags & SHF_ALLOC
        ):
            _fail("required_dynsymbol_defining_section_invalid", symbol)
        if expected_type == STT_FUNC and (
            not defining_section.header.flags & SHF_EXECINSTR
            or defining_section.header.flags & SHF_WRITE
        ):
            _fail("required_function_section_not_executable", symbol)
        if expected_type == STT_OBJECT and defining_section.header.flags & SHF_EXECINSTR:
            _fail("required_object_section_executable", symbol)
        load = _unique_load_mapping(
            programs,
            defining_section,
            "required_dynsymbol_section_mapping_ambiguous",
        )
        if expected_type == STT_FUNC and (
            load.flags & (PF_R | PF_X) != (PF_R | PF_X)
        ):
            _fail("required_function_load_not_read_executable", symbol)
        if expected_type == STT_OBJECT and not load.flags & PF_R:
            _fail("required_object_load_not_readable", symbol)
        if size <= 0:
            _fail("required_dynsymbol_size_invalid", symbol)
        _checked_u64_extent(value, size, "required_dynsymbol_value_range_overflow")
        if (
            value < defining_section.header.address
            or size > defining_section.header.size
            or value - defining_section.header.address
            > defining_section.header.size - size
        ):
            _fail("required_dynsymbol_outside_defining_section", symbol)
        if (
            value < load.virtual_address
            or size > load.memory_size
            or value - load.virtual_address > load.memory_size - size
        ):
            _fail("required_dynsymbol_outside_load_mapping", symbol)
        if versym is not None:
            version_state = versym[symbol_index]
            if version_state & VERSYM_HIDDEN:
                _fail("required_dynsymbol_version_hidden", symbol)
            version_index = version_state & VERSYM_INDEX_MASK
            if version_index == VER_NDX_LOCAL:
                _fail("required_dynsymbol_version_local", symbol)
            if (
                version_index != VER_NDX_GLOBAL
                and version_index not in version_definitions
            ):
                _fail("required_dynsymbol_version_definition_unestablished", symbol)
        defined.append(symbol)
    return count, tuple(defined)


def _validate_version_marker(
    raw: bytes,
    sections: tuple[_NamedSection, ...],
    programs: tuple[_ProgramHeader, ...],
    marker: bytes,
) -> None:
    raw_occurrences = raw.count(marker)
    if raw_occurrences > 1:
        _fail("expected_version_marker_ambiguous")
    if raw_occurrences != 1:
        _fail("expected_version_marker_missing")
    matches: list[_NamedSection] = []
    for section in sections:
        header = section.header
        if (
            header.section_type != SHT_PROGBITS
            or not section.name.startswith(".rodata")
            or not header.flags & SHF_ALLOC
            or header.flags & (SHF_WRITE | SHF_EXECINSTR)
        ):
            continue
        data = _table_bytes(
            raw,
            header,
            cap=MAX_STRING_TABLE_BYTES,
            code="version_marker_section_invalid",
        )
        cursor = 0
        while cursor < len(data):
            terminator = data.find(b"\x00", cursor)
            if terminator < 0:
                break
            if data[cursor:terminator] == marker:
                matches.append(section)
                if len(matches) > 1:
                    _fail("expected_version_marker_ambiguous")
            cursor = terminator + 1
    if len(matches) != 1:
        _fail("expected_version_marker_missing")
    _unique_load_mapping(
        programs,
        matches[0],
        "version_marker_section_mapping_ambiguous",
    )


def inspect_static_elf(
    raw: bytes,
    expectation: StaticElfExpectation,
) -> StaticElfMetadataEvidence:
    """Return bounded static metadata evidence for exact caller-supplied bytes."""

    if type(raw) is not bytes:
        _fail("exact_immutable_bytes_required")
    _validate_expectation(expectation)
    if len(raw) != expectation.expected_byte_length:
        _fail("elf_byte_length_mismatch")
    if len(raw) > MAX_ELF_BYTES:
        _fail("elf_byte_cap_exceeded")
    digest = hashlib.sha256(raw).hexdigest()
    if digest != expectation.expected_plain_sha256:
        _fail("elf_plain_sha256_mismatch")

    (
        program_offset,
        program_count,
        section_offset,
        section_count,
        section_name_index,
        _osabi,
        _abi_version,
    ) = _parse_header(raw)
    program_range = (
        program_offset,
        program_offset + program_count * PROGRAM_HEADER_SIZE,
    )
    section_range = (
        section_offset,
        section_offset + section_count * SECTION_HEADER_SIZE,
    )
    programs = _parse_program_headers(raw, program_offset, program_count)
    _validate_load_mapping_conflicts(programs)
    headers = _parse_section_headers(
        raw,
        section_offset,
        section_count,
        program_range,
        section_range,
    )
    sections = _name_sections(raw, headers, section_name_index)
    dynstr = _unique_section(sections, ".dynstr", SHT_STRTAB)
    dynsym = _unique_section(sections, ".dynsym", SHT_DYNSYM)
    dynamic = _unique_section(sections, ".dynamic", SHT_DYNAMIC)
    if dynsym.header.link != dynstr.header.index:
        _fail("dynamic_symbol_string_link_mismatch")
    if dynamic.header.link != dynstr.header.index:
        _fail("dynamic_table_string_link_mismatch")
    _validate_required_section_mapping(programs, dynamic, dynstr, dynsym)
    dynamic_entries, needed, soname, string_table = _parse_dynamic(
        raw, dynamic, dynstr, dynsym
    )
    if soname != expectation.expected_soname:
        _fail("elf_soname_mismatch")
    unrecognized_gmp_aliases = tuple(
        name for name in needed if _looks_like_unrecognized_gmp_alias(name)
    )
    if unrecognized_gmp_aliases:
        _fail("unrecognized_gmp_dependency_alias", unrecognized_gmp_aliases[0])
    gmp_family = tuple(name for name in needed if _is_gmp_family(name))
    if expectation.component == "mpfr":
        if len(gmp_family) != 1:
            _fail("mpfr_gmp_family_dependency_count_mismatch")
        if gmp_family[0] != expectation.expected_gmp_soname:
            _fail("mpfr_gmp_dependency_soname_mismatch")
    elif gmp_family:
        _fail("gmp_self_family_dependency_forbidden")
    _validate_version_marker(
        raw,
        sections,
        programs,
        expectation.expected_version_marker,
    )
    symbol_count, defined = _parse_required_dynsymbols(
        raw,
        dynsym,
        dynstr,
        string_table,
        sections,
        programs,
        expectation.required_dynsymbols,
        dynamic_entries,
    )

    return StaticElfMetadataEvidence(
        schema_version=STATIC_ELF_EVIDENCE_SCHEMA_VERSION,
        component=expectation.component,
        byte_length=len(raw),
        plain_sha256=digest,
        elf_class="ELF64",
        byte_order="little_endian",
        machine="x86_64",
        object_type="ET_DYN",
        program_header_count=program_count,
        section_header_count=section_count,
        dynamic_entry_count=len(dynamic_entries),
        dynsymbol_count=symbol_count,
        soname=soname,
        needed_sonames=needed,
        gmp_family_dependencies=gmp_family,
        version_marker=expectation.expected_version_marker,
        defined_required_dynsymbols=defined,
        static_structure_validated=True,
        static_soname_match=True,
        static_dependency_match=True,
        static_version_marker_match=True,
        static_required_dynsymbols_defined=True,
        static_metadata_evidence_only=True,
        host_file_access_attempted=False,
        loader_attempted=False,
        runtime_mapping_established=False,
        runtime_symbol_resolution_attempted=False,
        runtime_configuration_attempted=False,
        canary_attempted=False,
        conformance_attempted=False,
        serialization_executed=False,
        arithmetic_executed=False,
        runtime_conformance_authority=False,
        execution_authority=False,
        admission_authority=False,
        scientific_authority=False,
        physical_viability_established=False,
        propulsion_capability_established=False,
        transport_capability_established=False,
    )


__all__ = (
    "MAX_DYNAMIC_ENTRIES",
    "MAX_DYNSYMBOLS",
    "MAX_ELF_BYTES",
    "MAX_NEEDED_ENTRIES",
    "MAX_PROGRAM_HEADERS",
    "MAX_SECTION_HEADERS",
    "MAX_STRING_TABLE_BYTES",
    "PRODUCER_GMP_REQUIRED_DYNSYMBOLS",
    "PRODUCER_MPFR_REQUIRED_DYNSYMBOLS",
    "STATIC_ELF_EVIDENCE_SCHEMA_VERSION",
    "StaticElfExpectation",
    "StaticElfInspectionError",
    "StaticElfMetadataEvidence",
    "frozen_required_dynsymbols",
    "inspect_static_elf",
)
