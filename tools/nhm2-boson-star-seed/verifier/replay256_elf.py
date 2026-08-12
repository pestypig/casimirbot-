"""Bounded, bytes-only ELF inspection for replay256 MPFR/GMP candidates.

The inspector performs no filesystem access and exposes no loader or arithmetic
surface.  A successful result establishes only static properties of the exact
immutable bytes supplied by the caller.  Runtime loading, configuration,
serialization behavior, canaries, conformance, and every authority remain
explicitly unavailable and false.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import re
import struct
from typing import Final


STATIC_ELF_SECURITY_PROFILE: Final[str] = (
    "bounded_static_elf64_little_endian_x86_64_bytes_only"
)

MAX_ELF_IMAGE_BYTES: Final[int] = 64 * 1024 * 1024
MAX_PROGRAM_HEADERS: Final[int] = 128
MAX_SECTION_HEADERS: Final[int] = 512
MAX_DYNAMIC_ENTRIES: Final[int] = 4096
MAX_STRING_TABLE_BYTES: Final[int] = 4 * 1024 * 1024
MAX_DYNSYM_ENTRIES: Final[int] = 65_536
MAX_NEEDED_DEPENDENCIES: Final[int] = 128
MAX_SYMBOL_NAME_BYTES: Final[int] = 1024
MAX_VERSION_MARKER_BYTES: Final[int] = 256

VERIFIER_REQUIRED_MPFR_DYNSYMBOLS: Final[tuple[str, ...]] = (
    "mpfr_init2",
    "mpfr_clear",
    "mpfr_set",
    "mpfr_set_zero",
    "mpfr_set_z",
    "mpfr_set_z_2exp",
    "mpfr_get_z_2exp",
    "mpfr_set_q",
    "mpfr_set_d",
    "mpfr_set_si",
    "mpfr_set_ui",
    "mpfr_add",
    "mpfr_sub",
    "mpfr_mul",
    "mpfr_div",
    "mpfr_neg",
    "mpfr_abs",
    "mpfr_sqrt",
    "mpfr_cos",
    "mpfr_log",
    "mpfr_exp",
    "mpfr_const_pi",
    "mpfr_cmp",
    "mpfr_cmp_si",
    "mpfr_cmp_ui",
    "mpfr_zero_p",
    "mpfr_number_p",
    "mpfr_set_emin",
    "mpfr_set_emax",
    "mpfr_get_emin",
    "mpfr_get_emax",
    "mpfr_clear_flags",
    "mpfr_underflow_p",
    "mpfr_overflow_p",
    "mpfr_nanflag_p",
    "mpfr_inexflag_p",
    "mpfr_erangeflag_p",
    "mpfr_divby0_p",
    "mpfr_get_version",
    "mpfr_get_patches",
    "mpfr_buildopt_tls_p",
    "mpfr_get_d",
)

VERIFIER_REQUIRED_GMP_DYNSYMBOLS: Final[tuple[str, ...]] = (
    "__gmpz_init",
    "__gmpz_clear",
    "__gmpz_set_str",
    "__gmpz_set_si",
    "__gmpz_set_ui",
    "__gmpz_neg",
    "__gmpq_init",
    "__gmpq_clear",
    "__gmpq_set_str",
    "__gmpq_set_num",
    "__gmpq_set_den",
    "__gmpq_canonicalize",
    "__gmp_version",
)

_SHA256_RE: Final[re.Pattern[str]] = re.compile(r"^[0-9a-f]{64}$")
_MPFR_NEEDED_RE: Final[re.Pattern[str]] = re.compile(
    r"^libmpfr\.so(?:\.[0-9]+)?$"
)
_GMP_NEEDED_RE: Final[re.Pattern[str]] = re.compile(
    r"^libgmp\.so(?:\.[0-9]+)?$"
)
_ASCII_NAME_RE: Final[re.Pattern[str]] = re.compile(r"^[!-~]+$")
_MAX_U64: Final[int] = (1 << 64) - 1

_ELF_HEADER = struct.Struct("<16sHHIQQQIHHHHHH")
_PROGRAM_HEADER = struct.Struct("<IIQQQQQQ")
_SECTION_HEADER = struct.Struct("<IIQQQQIIQQ")
_DYNAMIC_ENTRY = struct.Struct("<qQ")
_DYNAMIC_SYMBOL = struct.Struct("<IBBHQQ")

_ELF_MAGIC = b"\x7fELF"
_ELFCLASS64 = 2
_ELFDATA2LSB = 1
_EV_CURRENT = 1
_ET_DYN = 3
_EM_X86_64 = 62
_PT_LOAD = 1
_PT_DYNAMIC = 2
_PF_X = 0x1
_PF_W = 0x2
_PF_R = 0x4
_SHT_PROGBITS = 1
_SHT_STRTAB = 3
_SHT_DYNAMIC = 6
_SHT_NOBITS = 8
_SHT_DYNSYM = 11
_SHT_GNU_VERDEF = 0x6FFFFFFD
_SHT_GNU_VERSYM = 0x6FFFFFFF
_SHF_WRITE = 0x1
_SHF_ALLOC = 0x2
_SHF_EXECINSTR = 0x4
_SHN_UNDEF = 0
_SHN_LORESERVE = 0xFF00
_SHN_XINDEX = 0xFFFF
_STB_GLOBAL = 1
_STB_WEAK = 2
_STT_OBJECT = 1
_STT_FUNC = 2
_STV_DEFAULT = 0
_VERSYM_HIDDEN = 0x8000
_VERSYM_INDEX_MASK = 0x7FFF
_VER_NDX_LOCAL = 0
_VER_NDX_GLOBAL = 1
_VER_DEF_CURRENT = 1
_DT_NULL = 0
_DT_NEEDED = 1
_DT_STRTAB = 5
_DT_SYMTAB = 6
_DT_STRSZ = 10
_DT_SYMENT = 11
_DT_SONAME = 14
_DT_VERSYM = 0x6FFFFFF0
_DT_VERDEF = 0x6FFFFFFC
_DT_VERDEFNUM = 0x6FFFFFFD


class Replay256ElfError(RuntimeError):
    """Deterministic rejection of an untrusted static ELF image."""

    def __init__(self, code: str, detail: str = "") -> None:
        self.code = code
        self.detail = detail
        message = code
        if detail:
            message += f":{detail}"
        super().__init__(message)


@dataclass(frozen=True, slots=True)
class ElfInspectionExpectation:
    library_id: str
    byte_length: int
    plain_sha256: str
    expected_soname: str
    expected_version_marker: bytes
    expected_gmp_soname: str | None


@dataclass(frozen=True, slots=True)
class StaticElfObservation:
    library_id: str
    byte_length: int
    plain_sha256: str
    raw_bytes: bytes
    security_profile: str
    observed_abi: str
    observed_soname: str
    needed_dependencies: tuple[str, ...]
    other_needed_dependencies: tuple[str, ...]
    gmp_family_needed_dependencies: tuple[str, ...]
    observed_version_marker: bytes
    version_marker_section_index: int
    required_dynsymbols: tuple[str, ...]
    defined_required_dynsymbols: tuple[str, ...]
    expected_soname: str
    expected_version_marker: bytes
    expected_gmp_soname: str | None
    plain_sha256_match_established: bool
    elf_identity_match_established: bool
    bounded_table_validation_established: bool
    soname_match_established: bool
    gmp_dependency_rule_applicable: bool
    gmp_dependency_rule_satisfied: bool
    version_marker_match_established: bool
    required_dynsymbols_defined_established: bool
    gnu_versym_present: bool
    required_dynsymbols_default_version_visible_established: bool
    static_metadata_observation_complete: bool
    loader_available: bool
    runtime_available: bool
    canary_available: bool
    canary_executed: bool
    canary_passed: bool
    conformance_available: bool
    conformance_executed: bool
    conformance_passed: bool
    serialization_barrier_available: bool
    serialization_barrier_executed: bool
    serialization_barrier_passed: bool
    policy_arithmetic_available: bool
    runtime_authority: bool
    runtime_conformance_authority: bool
    serialization_authority: bool
    policy_arithmetic_authority: bool
    scientific_authority: bool
    proof_authority: bool
    gate_authority: bool
    admission_authority: bool
    registration_authority: bool


@dataclass(frozen=True, slots=True)
class _ElfHeader:
    program_offset: int
    section_offset: int
    program_entry_size: int
    program_count: int
    section_entry_size: int
    section_count: int
    section_name_index: int


@dataclass(frozen=True, slots=True)
class _ProgramHeader:
    type: int
    flags: int
    offset: int
    virtual_address: int
    file_size: int
    memory_size: int
    alignment: int


@dataclass(frozen=True, slots=True)
class _SectionHeader:
    name_offset: int
    type: int
    flags: int
    address: int
    offset: int
    size: int
    link: int
    info: int
    alignment: int
    entry_size: int


@dataclass(frozen=True, slots=True)
class _DynamicSymbolRecord:
    index: int
    name: bytes
    binding: int
    symbol_type: int
    visibility: int
    section_index: int
    value: int
    size: int


def _fail(code: str, detail: str = "") -> None:
    raise Replay256ElfError(code, detail)


def _checked_range(
    image_size: int,
    offset: int,
    size: int,
    code: str,
) -> tuple[int, int]:
    if offset < 0 or size < 0 or offset > image_size or size > image_size - offset:
        _fail(code, f"offset={offset}:size={size}:image={image_size}")
    return offset, offset + size


def _checked_u64_extent(start: int, size: int, code: str) -> None:
    if start < 0 or size < 0 or start > _MAX_U64 or size > _MAX_U64 - start:
        _fail(code, f"start={start}:size={size}")


def _is_power_of_two(value: int) -> bool:
    return value > 0 and value & (value - 1) == 0


def _validated_ascii_name(value: object, code: str) -> str:
    if (
        type(value) is not str
        or not value
        or len(value) > MAX_SYMBOL_NAME_BYTES
        or _ASCII_NAME_RE.fullmatch(value) is None
        or "/" in value
        or "\\" in value
    ):
        _fail(code)
    return value


def _validated_expectation(
    expectation: ElfInspectionExpectation,
) -> ElfInspectionExpectation:
    if type(expectation) is not ElfInspectionExpectation:
        _fail("elf_inspection_expectation_required")
    if type(expectation.library_id) is not str or expectation.library_id not in (
        "mpfr",
        "gmp",
    ):
        _fail("invalid_library_id")
    if (
        type(expectation.byte_length) is not int
        or expectation.byte_length <= 0
        or expectation.byte_length > MAX_ELF_IMAGE_BYTES
    ):
        _fail("invalid_expected_byte_length")
    if type(expectation.plain_sha256) is not str or _SHA256_RE.fullmatch(
        expectation.plain_sha256
    ) is None:
        _fail("invalid_expected_plain_sha256")
    soname = _validated_ascii_name(expectation.expected_soname, "invalid_expected_soname")
    if expectation.library_id == "mpfr" and _MPFR_NEEDED_RE.fullmatch(soname) is None:
        _fail("invalid_expected_soname")
    if expectation.library_id == "gmp" and _GMP_NEEDED_RE.fullmatch(soname) is None:
        _fail("invalid_expected_soname")
    marker = expectation.expected_version_marker
    if (
        type(marker) is not bytes
        or not marker
        or len(marker) > MAX_VERSION_MARKER_BYTES
        or any(byte < 0x21 or byte > 0x7E for byte in marker)
    ):
        _fail("invalid_expected_version_marker")
    if expectation.library_id == "mpfr":
        gmp_soname = _validated_ascii_name(
            expectation.expected_gmp_soname,
            "invalid_expected_gmp_soname",
        )
        if _GMP_NEEDED_RE.fullmatch(gmp_soname) is None:
            _fail("invalid_expected_gmp_soname")
    else:
        if expectation.expected_gmp_soname is not None:
            _fail("unexpected_expected_gmp_soname")
        gmp_soname = None
    return ElfInspectionExpectation(
        library_id=expectation.library_id,
        byte_length=expectation.byte_length,
        plain_sha256=expectation.plain_sha256,
        expected_soname=soname,
        expected_version_marker=marker,
        expected_gmp_soname=gmp_soname,
    )


def _parse_elf_header(raw: bytes) -> _ElfHeader:
    if len(raw) < _ELF_HEADER.size:
        _fail("elf_header_truncated")
    (
        ident,
        elf_type,
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
    ) = _ELF_HEADER.unpack_from(raw, 0)
    if ident[:4] != _ELF_MAGIC:
        _fail("invalid_elf_magic")
    if ident[4] != _ELFCLASS64:
        _fail("elf64_required")
    if ident[5] != _ELFDATA2LSB:
        _fail("little_endian_elf_required")
    if ident[6] != _EV_CURRENT or version != _EV_CURRENT:
        _fail("current_elf_version_required")
    if elf_type != _ET_DYN:
        _fail("et_dyn_required")
    if machine != _EM_X86_64:
        _fail("x86_64_elf_required")
    if flags != 0:
        _fail("x86_64_elf_flags_must_be_zero")
    if header_size != _ELF_HEADER.size:
        _fail("elf_header_size_mismatch")
    if program_count <= 0 or program_count > MAX_PROGRAM_HEADERS:
        _fail("program_header_count_out_of_bounds")
    if program_entry_size != _PROGRAM_HEADER.size:
        _fail("program_header_entry_size_mismatch")
    if section_count <= 0 or section_count > MAX_SECTION_HEADERS:
        _fail("section_header_count_out_of_bounds")
    if section_entry_size != _SECTION_HEADER.size:
        _fail("section_header_entry_size_mismatch")
    if section_name_index == _SHN_XINDEX or section_name_index >= section_count:
        _fail("section_name_table_index_invalid")
    if program_offset < header_size or program_offset % 8 != 0:
        _fail("program_header_offset_invalid")
    if section_offset < header_size or section_offset % 8 != 0:
        _fail("section_header_offset_invalid")
    program_range = _checked_range(
        len(raw),
        program_offset,
        program_count * program_entry_size,
        "program_header_table_bounds_invalid",
    )
    section_range = _checked_range(
        len(raw),
        section_offset,
        section_count * section_entry_size,
        "section_header_table_bounds_invalid",
    )
    if _ranges_overlap(
        program_range[0],
        program_range[1] - program_range[0],
        section_range[0],
        section_range[1] - section_range[0],
    ):
        _fail("elf_header_tables_overlap")
    return _ElfHeader(
        program_offset=program_offset,
        section_offset=section_offset,
        program_entry_size=program_entry_size,
        program_count=program_count,
        section_entry_size=section_entry_size,
        section_count=section_count,
        section_name_index=section_name_index,
    )


def _parse_program_headers(raw: bytes, header: _ElfHeader) -> tuple[_ProgramHeader, ...]:
    items: list[_ProgramHeader] = []
    for index in range(header.program_count):
        offset = header.program_offset + index * header.program_entry_size
        (
            program_type,
            flags,
            file_offset,
            virtual_address,
            _physical_address,
            file_size,
            memory_size,
            alignment,
        ) = _PROGRAM_HEADER.unpack_from(raw, offset)
        _checked_range(
            len(raw),
            file_offset,
            file_size,
            "program_segment_bounds_invalid",
        )
        if memory_size < file_size:
            _fail("program_segment_memory_smaller_than_file", f"index={index}")
        _checked_u64_extent(
            virtual_address,
            memory_size,
            "program_segment_virtual_range_overflow",
        )
        if alignment not in (0, 1) and not _is_power_of_two(alignment):
            _fail("program_segment_alignment_invalid", f"index={index}")
        if alignment > 1 and (virtual_address - file_offset) % alignment != 0:
            _fail("program_segment_congruence_invalid", f"index={index}")
        items.append(
            _ProgramHeader(
                type=program_type,
                flags=flags,
                offset=file_offset,
                virtual_address=virtual_address,
                file_size=file_size,
                memory_size=memory_size,
                alignment=alignment,
            )
        )
    if sum(item.type == _PT_LOAD for item in items) == 0:
        _fail("load_segment_required")
    if sum(item.type == _PT_DYNAMIC for item in items) != 1:
        _fail("exactly_one_dynamic_segment_required")
    return tuple(items)


def _ranges_overlap(left_start: int, left_size: int, right_start: int, right_size: int) -> bool:
    return (
        left_size > 0
        and right_size > 0
        and left_start < right_start + right_size
        and right_start < left_start + left_size
    )


def _validate_load_mapping_conflicts(programs: tuple[_ProgramHeader, ...]) -> None:
    loads = tuple(item for item in programs if item.type == _PT_LOAD)
    for left_index, left in enumerate(loads):
        left_delta = left.virtual_address - left.offset
        for right in loads[left_index + 1 :]:
            right_delta = right.virtual_address - right.offset
            if left_delta == right_delta:
                continue
            if _ranges_overlap(
                left.offset,
                left.file_size,
                right.offset,
                right.file_size,
            ) or _ranges_overlap(
                left.virtual_address,
                left.memory_size,
                right.virtual_address,
                right.memory_size,
            ):
                _fail("conflicting_overlapping_load_mappings")


def _parse_section_headers(raw: bytes, header: _ElfHeader) -> tuple[_SectionHeader, ...]:
    items: list[_SectionHeader] = []
    program_range = (
        header.program_offset,
        header.program_count * header.program_entry_size,
    )
    section_range = (
        header.section_offset,
        header.section_count * header.section_entry_size,
    )
    occupied: list[tuple[int, int, int]] = []
    for index in range(header.section_count):
        offset = header.section_offset + index * header.section_entry_size
        values = _SECTION_HEADER.unpack_from(raw, offset)
        item = _SectionHeader(
            name_offset=values[0],
            type=values[1],
            flags=values[2],
            address=values[3],
            offset=values[4],
            size=values[5],
            link=values[6],
            info=values[7],
            alignment=values[8],
            entry_size=values[9],
        )
        if item.type != _SHT_NOBITS and item.size:
            body_range = _checked_range(
                len(raw),
                item.offset,
                item.size,
                "section_bounds_invalid",
            )
            if item.alignment > 1 and item.offset % item.alignment:
                _fail("section_offset_alignment_invalid", f"index={index}")
            if item.offset < _ELF_HEADER.size:
                _fail("section_body_overlaps_elf_header", f"index={index}")
            if _ranges_overlap(
                item.offset,
                item.size,
                program_range[0],
                program_range[1],
            ) or _ranges_overlap(
                item.offset,
                item.size,
                section_range[0],
                section_range[1],
            ):
                _fail("section_body_overlaps_header_table", f"index={index}")
            for prior_offset, prior_size, prior_index in occupied:
                if _ranges_overlap(
                    item.offset,
                    item.size,
                    prior_offset,
                    prior_size,
                ):
                    _fail(
                        "section_file_ranges_overlap",
                        f"left={prior_index}:right={index}",
                    )
            occupied.append((body_range[0], body_range[1] - body_range[0], index))
        _checked_u64_extent(item.address, item.size, "section_virtual_range_overflow")
        if item.alignment not in (0, 1) and not _is_power_of_two(item.alignment):
            _fail("section_alignment_invalid", f"index={index}")
        if item.type == _SHT_STRTAB and item.size > MAX_STRING_TABLE_BYTES:
            _fail("string_table_size_cap_exceeded", f"index={index}")
        items.append(item)
    if any(_SECTION_HEADER.unpack_from(raw, header.section_offset)):
        _fail("null_section_header_must_be_zero")
    return tuple(items)


def _cstring_bytes(
    table: bytes,
    offset: int,
    *,
    code: str,
    allow_empty: bool,
    max_length: int,
) -> bytes:
    if offset < 0 or offset >= len(table):
        _fail(code, f"offset={offset}:table={len(table)}")
    terminator = table.find(b"\x00", offset)
    if terminator < 0:
        _fail(code, "unterminated")
    value = table[offset:terminator]
    if len(value) > max_length or (not allow_empty and not value):
        _fail(code, f"length={len(value)}")
    return value


def _ascii_dynamic_name(table: bytes, offset: int, code: str) -> str:
    encoded = _cstring_bytes(
        table,
        offset,
        code=code,
        allow_empty=False,
        max_length=MAX_SYMBOL_NAME_BYTES,
    )
    try:
        value = encoded.decode("ascii")
    except UnicodeDecodeError as error:
        raise Replay256ElfError(code, "non_ascii") from error
    if _ASCII_NAME_RE.fullmatch(value) is None or "/" in value or "\\" in value:
        _fail(code, value)
    return value


def _validate_section_names(
    raw: bytes,
    header: _ElfHeader,
    sections: tuple[_SectionHeader, ...],
) -> None:
    string_section = sections[header.section_name_index]
    if string_section.type != _SHT_STRTAB:
        _fail("section_name_table_type_invalid")
    table = raw[string_section.offset : string_section.offset + string_section.size]
    if not table or table[0] != 0 or table[-1] != 0:
        _fail("section_name_table_termination_invalid")
    for index, section in enumerate(sections):
        _cstring_bytes(
            table,
            section.name_offset,
            code="section_name_offset_invalid",
            allow_empty=index == 0,
            max_length=MAX_SYMBOL_NAME_BYTES,
        )


def _map_virtual_address(
    programs: tuple[_ProgramHeader, ...],
    address: int,
    size: int,
) -> int:
    matches: list[int] = []
    for segment in programs:
        if segment.type != _PT_LOAD:
            continue
        if (
            address >= segment.virtual_address
            and size <= segment.file_size
            and address - segment.virtual_address <= segment.file_size - size
        ):
            matches.append(segment.offset + address - segment.virtual_address)
    if len(matches) != 1:
        _fail("virtual_address_mapping_not_unique", f"address={address}:size={size}")
    return matches[0]


def _validate_alloc_section_mappings(
    programs: tuple[_ProgramHeader, ...],
    sections: tuple[_SectionHeader, ...],
) -> None:
    for index, section in enumerate(sections):
        if section.flags & _SHF_ALLOC and section.type != _SHT_NOBITS and section.size:
            mapped = _map_virtual_address(programs, section.address, section.size)
            if mapped != section.offset:
                _fail("allocated_section_mapping_mismatch", f"index={index}")


def _dynamic_entries(
    raw: bytes,
    programs: tuple[_ProgramHeader, ...],
    sections: tuple[_SectionHeader, ...],
) -> tuple[tuple[int, int], ...]:
    segment = next(item for item in programs if item.type == _PT_DYNAMIC)
    dynamic_sections = tuple(item for item in sections if item.type == _SHT_DYNAMIC)
    if len(dynamic_sections) != 1:
        _fail("exactly_one_dynamic_section_required")
    section = dynamic_sections[0]
    if (
        section.offset != segment.offset
        or section.size != segment.file_size
        or section.address != segment.virtual_address
        or section.entry_size != _DYNAMIC_ENTRY.size
        or section.size % _DYNAMIC_ENTRY.size != 0
        or not section.flags & _SHF_ALLOC
    ):
        _fail("dynamic_segment_section_mismatch")
    if _map_virtual_address(programs, section.address, section.size) != section.offset:
        _fail("dynamic_section_mapping_mismatch")
    dynamic_loads = tuple(
        item
        for item in programs
        if item.type == _PT_LOAD
        and section.address >= item.virtual_address
        and section.size <= item.file_size
        and section.address - item.virtual_address <= item.file_size - section.size
    )
    if len(dynamic_loads) != 1 or not dynamic_loads[0].flags & _PF_R:
        _fail("dynamic_section_load_not_readable")
    count = section.size // _DYNAMIC_ENTRY.size
    if count <= 0 or count > MAX_DYNAMIC_ENTRIES:
        _fail("dynamic_entry_count_out_of_bounds")
    entries = tuple(
        _DYNAMIC_ENTRY.unpack_from(raw, section.offset + index * _DYNAMIC_ENTRY.size)
        for index in range(count)
    )
    null_indices = tuple(index for index, (tag, _value) in enumerate(entries) if tag == _DT_NULL)
    if not null_indices:
        _fail("dynamic_null_terminator_missing")
    first_null = null_indices[0]
    if any(tag != _DT_NULL or value != 0 for tag, value in entries[first_null:]):
        _fail("dynamic_entries_after_null_forbidden")
    return entries[:first_null]


def _one_dynamic_value(entries: tuple[tuple[int, int], ...], tag: int) -> int:
    values = tuple(value for observed_tag, value in entries if observed_tag == tag)
    if not values:
        _fail("required_dynamic_tag_missing", f"tag={tag}")
    if len(values) != 1:
        _fail("required_dynamic_tag_ambiguous", f"tag={tag}:count={len(values)}")
    return values[0]


def _optional_dynamic_value(
    entries: tuple[tuple[int, int], ...], tag: int, code: str
) -> int | None:
    values = tuple(value for observed_tag, value in entries if observed_tag == tag)
    if len(values) > 1:
        _fail(code, f"tag={tag}:count={len(values)}")
    return values[0] if values else None


def _locate_dynamic_tables(
    raw: bytes,
    programs: tuple[_ProgramHeader, ...],
    sections: tuple[_SectionHeader, ...],
    entries: tuple[tuple[int, int], ...],
) -> tuple[bytes, _SectionHeader, int]:
    dynsym_sections = tuple(item for item in sections if item.type == _SHT_DYNSYM)
    if len(dynsym_sections) != 1:
        _fail("exactly_one_dynsym_section_required")
    dynsym = dynsym_sections[0]
    if dynsym.entry_size != _DYNAMIC_SYMBOL.size or dynsym.size % dynsym.entry_size != 0:
        _fail("dynsym_entry_size_invalid")
    if dynsym.link <= 0 or dynsym.link >= len(sections):
        _fail("dynsym_string_table_link_invalid")
    dynstr_section = sections[dynsym.link]
    if dynstr_section.type != _SHT_STRTAB:
        _fail("dynsym_string_table_type_invalid")
    if not dynstr_section.size or dynstr_section.size > MAX_STRING_TABLE_BYTES:
        _fail("dynstr_size_out_of_bounds")
    dynamic_sections = tuple(item for item in sections if item.type == _SHT_DYNAMIC)
    dynamic = dynamic_sections[0]
    if dynamic.link != dynsym.link:
        _fail("dynamic_dynstr_link_mismatch")
    strtab_address = _one_dynamic_value(entries, _DT_STRTAB)
    strtab_size = _one_dynamic_value(entries, _DT_STRSZ)
    symtab_address = _one_dynamic_value(entries, _DT_SYMTAB)
    syment = _one_dynamic_value(entries, _DT_SYMENT)
    if syment != _DYNAMIC_SYMBOL.size:
        _fail("dynamic_syment_mismatch")
    if strtab_size != dynstr_section.size:
        _fail("dynamic_strsz_section_mismatch")
    if _map_virtual_address(programs, strtab_address, strtab_size) != dynstr_section.offset:
        _fail("dynamic_strtab_mapping_mismatch")
    if _map_virtual_address(programs, symtab_address, dynsym.size) != dynsym.offset:
        _fail("dynamic_symtab_mapping_mismatch")
    dynstr = raw[dynstr_section.offset : dynstr_section.offset + dynstr_section.size]
    if not dynstr or dynstr[0] != 0 or dynstr[-1] != 0:
        _fail("dynstr_termination_invalid")
    return dynstr, dynsym, _one_dynamic_value(entries, _DT_SONAME)


def _parse_dependencies(
    entries: tuple[tuple[int, int], ...],
    dynstr: bytes,
) -> tuple[str, ...]:
    offsets = tuple(value for tag, value in entries if tag == _DT_NEEDED)
    if len(offsets) > MAX_NEEDED_DEPENDENCIES:
        _fail("needed_dependency_count_cap_exceeded")
    dependencies = tuple(
        _ascii_dynamic_name(dynstr, offset, "needed_string_invalid")
        for offset in offsets
    )
    if len(dependencies) != len(set(dependencies)):
        _fail("duplicate_needed_dependency")
    return dependencies


def _parse_dynamic_symbols(
    raw: bytes,
    dynsym: _SectionHeader,
    dynstr: bytes,
    section_count: int,
) -> tuple[_DynamicSymbolRecord, ...]:
    count = dynsym.size // _DYNAMIC_SYMBOL.size
    if count <= 0 or count > MAX_DYNSYM_ENTRIES:
        _fail("dynsym_entry_count_out_of_bounds")
    records: list[_DynamicSymbolRecord] = []
    for index in range(count):
        (
            name_offset,
            info,
            other,
            section_index,
            value,
            size,
        ) = _DYNAMIC_SYMBOL.unpack_from(raw, dynsym.offset + index * dynsym.entry_size)
        name = _cstring_bytes(
            dynstr,
            name_offset,
            code="dynsymbol_name_offset_invalid",
            allow_empty=index == 0,
            max_length=MAX_SYMBOL_NAME_BYTES,
        )
        if other & ~0x3:
            _fail("dynsymbol_visibility_bits_invalid", f"index={index}")
        if section_index == _SHN_XINDEX:
            _fail("extended_dynsymbol_section_index_forbidden", f"index={index}")
        if section_index >= section_count and section_index < _SHN_LORESERVE:
            _fail("dynsymbol_section_index_invalid", f"index={index}")
        records.append(
            _DynamicSymbolRecord(
                index=index,
                name=name,
                binding=info >> 4,
                symbol_type=info & 0xF,
                visibility=other & 0x3,
                section_index=section_index,
                value=value,
                size=size,
            )
        )
    first = records[0]
    if (
        first.name
        or first.binding != 0
        or first.symbol_type != 0
        or first.visibility != 0
        or first.section_index != _SHN_UNDEF
        or first.value != 0
        or first.size != 0
    ):
        _fail("null_dynsymbol_invalid")
    return tuple(records)


def _parse_gnu_verdef(
    raw: bytes,
    programs: tuple[_ProgramHeader, ...],
    sections: tuple[_SectionHeader, ...],
    entries: tuple[tuple[int, int], ...],
    dynstr: bytes,
    dynstr_index: int,
) -> frozenset[int]:
    candidates = tuple(section for section in sections if section.type == _SHT_GNU_VERDEF)
    dynamic_address = _optional_dynamic_value(
        entries, _DT_VERDEF, "dynamic_verdef_tag_ambiguous"
    )
    dynamic_count = _optional_dynamic_value(
        entries, _DT_VERDEFNUM, "dynamic_verdefnum_tag_ambiguous"
    )
    if not candidates:
        if dynamic_address is not None or dynamic_count is not None:
            _fail("dynamic_verdef_tags_without_section")
        return frozenset()
    if len(candidates) != 1:
        _fail("multiple_gnu_verdef_sections_forbidden")
    section = candidates[0]
    if (
        section.link != dynstr_index
        or not section.flags & _SHF_ALLOC
        or section.flags & (_SHF_WRITE | _SHF_EXECINSTR)
        or not section.size
        or section.size > MAX_STRING_TABLE_BYTES
    ):
        _fail("gnu_verdef_shape_or_link_invalid")
    if _map_virtual_address(programs, section.address, section.size) != section.offset:
        _fail("gnu_verdef_mapping_mismatch")
    if dynamic_address is None or dynamic_count is None:
        _fail("dynamic_verdef_tags_missing")
    if dynamic_address != section.address:
        _fail("dynamic_verdef_address_mismatch")
    if dynamic_count != section.info or dynamic_count <= 0 or dynamic_count > MAX_DYNSYM_ENTRIES:
        _fail("dynamic_verdef_count_mismatch")

    data = raw[section.offset : section.offset + section.size]
    cursor = 0
    definitions: set[int] = set()
    while True:
        _checked_range(len(data), cursor, 20, "gnu_verdef_entry_bounds_invalid")
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
            version != _VER_DEF_CURRENT
            or version_index < 2
            or version_index > _VERSYM_INDEX_MASK
            or auxiliary_count <= 0
            or version_index in definitions
        ):
            _fail("gnu_verdef_entry_invalid")
        auxiliary_cursor = cursor + auxiliary_offset
        furthest = cursor + 20
        for auxiliary_index in range(auxiliary_count):
            _checked_range(
                len(data), auxiliary_cursor, 8, "gnu_verdef_aux_bounds_invalid"
            )
            name_offset, auxiliary_next = struct.unpack_from("<II", data, auxiliary_cursor)
            _ascii_dynamic_name(dynstr, name_offset, "gnu_verdef_name_invalid")
            furthest = max(furthest, auxiliary_cursor + 8)
            if auxiliary_index + 1 < auxiliary_count:
                if auxiliary_next < 8:
                    _fail("gnu_verdef_aux_chain_invalid")
                auxiliary_cursor += auxiliary_next
            elif auxiliary_next != 0:
                _fail("gnu_verdef_aux_chain_invalid")
        definitions.add(version_index)
        if len(definitions) > MAX_DYNSYM_ENTRIES:
            _fail("gnu_verdef_count_out_of_bounds")
        if next_offset == 0:
            if any(data[furthest:]):
                _fail("gnu_verdef_trailing_bytes_nonzero")
            break
        if next_offset < 20 or next_offset % 4 or cursor + next_offset < furthest:
            _fail("gnu_verdef_chain_invalid")
        cursor += next_offset
        if cursor >= len(data):
            _fail("gnu_verdef_chain_invalid")
    if len(definitions) != dynamic_count:
        _fail("gnu_verdef_count_mismatch")
    return frozenset(definitions)


def _parse_gnu_versym(
    raw: bytes,
    programs: tuple[_ProgramHeader, ...],
    sections: tuple[_SectionHeader, ...],
    entries: tuple[tuple[int, int], ...],
    dynstr: bytes,
    dynsym: _SectionHeader,
    symbol_count: int,
) -> tuple[tuple[int, ...] | None, frozenset[int]]:
    definitions = _parse_gnu_verdef(
        raw,
        programs,
        sections,
        entries,
        dynstr,
        dynsym.link,
    )
    candidates = tuple(
        (index, section)
        for index, section in enumerate(sections)
        if section.type == _SHT_GNU_VERSYM
    )
    dynamic_address = _optional_dynamic_value(
        entries, _DT_VERSYM, "dynamic_versym_tag_ambiguous"
    )
    if len(candidates) > 1:
        _fail("multiple_gnu_versym_sections_forbidden")
    if not candidates:
        if dynamic_address is not None:
            _fail("dynamic_versym_tag_without_section")
        if definitions:
            _fail("gnu_verdef_without_versym")
        return None, definitions
    dynsym_index = next(
        index for index, section in enumerate(sections) if section is dynsym
    )
    _index, section = candidates[0]
    if (
        section.link != dynsym_index
        or section.entry_size != 2
        or section.size != symbol_count * 2
        or not section.flags & _SHF_ALLOC
        or section.flags & (_SHF_WRITE | _SHF_EXECINSTR)
    ):
        _fail("gnu_versym_shape_or_link_invalid")
    if _map_virtual_address(programs, section.address, section.size) != section.offset:
        _fail("gnu_versym_mapping_mismatch")
    if dynamic_address is None:
        _fail("dynamic_versym_tag_missing")
    if dynamic_address != section.address:
        _fail("dynamic_versym_address_mismatch")
    values = tuple(
        struct.unpack_from("<H", raw, section.offset + index * 2)[0]
        for index in range(symbol_count)
    )
    if not values or values[0] != _VER_NDX_LOCAL:
        _fail("gnu_versym_null_entry_invalid")
    return values, definitions


def _validate_required_symbols(
    records: tuple[_DynamicSymbolRecord, ...],
    required: tuple[str, ...],
    programs: tuple[_ProgramHeader, ...],
    sections: tuple[_SectionHeader, ...],
    versym: tuple[int, ...] | None,
    version_definitions: frozenset[int],
) -> tuple[str, ...]:
    defined: list[str] = []
    for name in required:
        encoded = name.encode("ascii")
        matches = tuple(item for item in records if item.name == encoded)
        if not matches:
            _fail("required_dynsymbol_missing", name)
        if len(matches) != 1:
            _fail("required_dynsymbol_ambiguous", f"{name}:count={len(matches)}")
        item = matches[0]
        if item.section_index == _SHN_UNDEF:
            _fail("required_dynsymbol_undefined", name)
        if item.binding not in (_STB_GLOBAL, _STB_WEAK) or item.visibility != _STV_DEFAULT:
            _fail("required_dynsymbol_not_exported", name)
        version_state = _VER_NDX_GLOBAL if versym is None else versym[item.index]
        version_index = version_state & _VERSYM_INDEX_MASK
        if version_index == _VER_NDX_LOCAL:
            _fail("required_dynsymbol_version_local", name)
        if version_state & _VERSYM_HIDDEN:
            _fail("required_dynsymbol_version_hidden", name)
        if version_index != _VER_NDX_GLOBAL and version_index not in version_definitions:
            _fail("required_dynsymbol_version_definition_unestablished", name)
        if item.section_index <= 0 or item.section_index >= len(sections):
            _fail("required_dynsymbol_not_real_section", name)
        section = sections[item.section_index]
        expected_type = _STT_OBJECT if name == "__gmp_version" else _STT_FUNC
        if item.symbol_type != expected_type:
            _fail("required_dynsymbol_type_mismatch", name)
        if section.type != _SHT_PROGBITS or not section.flags & _SHF_ALLOC:
            _fail("required_dynsymbol_section_flags_invalid", name)
        if expected_type == _STT_FUNC:
            if not section.flags & _SHF_EXECINSTR or section.flags & _SHF_WRITE:
                _fail("required_dynsymbol_section_flags_invalid", name)
        elif section.flags & _SHF_EXECINSTR:
            _fail("required_dynsymbol_section_flags_invalid", name)
        if (
            item.size <= 0
            or item.value < section.address
            or item.value - section.address > section.size
            or item.size > section.size - (item.value - section.address)
        ):
            _fail("required_dynsymbol_range_invalid", name)
        _checked_u64_extent(
            item.value,
            item.size,
            "required_dynsymbol_virtual_range_overflow",
        )
        containing_loads = tuple(
            segment
            for segment in programs
            if segment.type == _PT_LOAD
            and item.value >= segment.virtual_address
            and item.size <= segment.memory_size
            and item.value - segment.virtual_address <= segment.memory_size - item.size
        )
        if len(containing_loads) != 1:
            _fail("required_dynsymbol_load_mapping_not_unique", name)
        containing_load = containing_loads[0]
        if expected_type == _STT_FUNC and (
            containing_load.flags & (_PF_R | _PF_X) != (_PF_R | _PF_X)
        ):
            _fail("required_function_load_not_read_executable", name)
        if expected_type == _STT_OBJECT and not containing_load.flags & _PF_R:
            _fail("required_object_load_not_readable", name)
        defined.append(name)
    return tuple(defined)


def _find_version_marker_section(
    raw: bytes,
    sections: tuple[_SectionHeader, ...],
    marker: bytes,
) -> int:
    if raw.count(marker) != 1:
        _fail("expected_version_marker_ambiguous" if marker in raw else "expected_version_marker_missing")
    needle = b"\x00" + marker + b"\x00"
    matches: list[int] = []
    for index, section in enumerate(sections):
        if (
            section.type != _SHT_PROGBITS
            or not section.flags & _SHF_ALLOC
            or section.flags & (_SHF_WRITE | _SHF_EXECINSTR)
            or section.size < len(needle)
        ):
            continue
        content = raw[section.offset : section.offset + section.size]
        start = 0
        while True:
            offset = content.find(needle, start)
            if offset < 0:
                break
            matches.append(index)
            start = offset + 1
    if not matches:
        _fail("expected_version_marker_missing")
    if len(matches) != 1:
        _fail("expected_version_marker_ambiguous", f"count={len(matches)}")
    return matches[0]


def inspect_replay256_elf(
    raw_bytes: bytes,
    expectation: ElfInspectionExpectation,
) -> StaticElfObservation:
    """Inspect one exact immutable ELF image without touching the host runtime."""

    if type(raw_bytes) is not bytes:
        _fail("immutable_exact_bytes_required")
    if not raw_bytes or len(raw_bytes) > MAX_ELF_IMAGE_BYTES:
        _fail("elf_image_size_out_of_bounds")
    expected = _validated_expectation(expectation)
    if len(raw_bytes) != expected.byte_length:
        _fail(
            "exact_byte_length_mismatch",
            f"expected={expected.byte_length}:observed={len(raw_bytes)}",
        )
    digest = hashlib.sha256(raw_bytes).hexdigest()
    if digest != expected.plain_sha256:
        _fail("plain_sha256_mismatch")

    header = _parse_elf_header(raw_bytes)
    programs = _parse_program_headers(raw_bytes, header)
    _validate_load_mapping_conflicts(programs)
    sections = _parse_section_headers(raw_bytes, header)
    _validate_section_names(raw_bytes, header, sections)
    _validate_alloc_section_mappings(programs, sections)
    dynamic_entries = _dynamic_entries(raw_bytes, programs, sections)
    dynstr, dynsym, soname_offset = _locate_dynamic_tables(
        raw_bytes,
        programs,
        sections,
        dynamic_entries,
    )
    soname = _ascii_dynamic_name(dynstr, soname_offset, "soname_string_invalid")
    if soname != expected.expected_soname:
        _fail("soname_mismatch", f"expected={expected.expected_soname}:observed={soname}")
    dependencies = _parse_dependencies(dynamic_entries, dynstr)
    unrecognized_gmp_aliases = tuple(
        name
        for name in dependencies
        if name.casefold().startswith("libgmp")
        and _GMP_NEEDED_RE.fullmatch(name) is None
    )
    if unrecognized_gmp_aliases:
        _fail("unrecognized_gmp_dependency_alias", unrecognized_gmp_aliases[0])
    gmp_family = tuple(name for name in dependencies if _GMP_NEEDED_RE.fullmatch(name))
    if expected.library_id == "mpfr":
        if len(gmp_family) != 1:
            _fail("gmp_needed_dependency_count_mismatch", f"count={len(gmp_family)}")
        if gmp_family[0] != expected.expected_gmp_soname:
            _fail(
                "gmp_needed_soname_mismatch",
                f"expected={expected.expected_gmp_soname}:observed={gmp_family[0]}",
            )
    elif gmp_family:
        _fail("gmp_self_family_dependency_forbidden", gmp_family[0])

    version_marker_section_index = _find_version_marker_section(
        raw_bytes,
        sections,
        expected.expected_version_marker,
    )

    records = _parse_dynamic_symbols(
        raw_bytes,
        dynsym,
        dynstr,
        header.section_count,
    )
    versym, version_definitions = _parse_gnu_versym(
        raw_bytes,
        programs,
        sections,
        dynamic_entries,
        dynstr,
        dynsym,
        len(records),
    )
    required = (
        VERIFIER_REQUIRED_MPFR_DYNSYMBOLS
        if expected.library_id == "mpfr"
        else VERIFIER_REQUIRED_GMP_DYNSYMBOLS
    )
    defined = _validate_required_symbols(
        records,
        required,
        programs,
        sections,
        versym,
        version_definitions,
    )
    other_dependencies = tuple(name for name in dependencies if name not in gmp_family)
    return StaticElfObservation(
        library_id=expected.library_id,
        byte_length=len(raw_bytes),
        plain_sha256=digest,
        raw_bytes=raw_bytes,
        security_profile=STATIC_ELF_SECURITY_PROFILE,
        observed_abi="ELF64-little-endian-x86_64-ET_DYN",
        observed_soname=soname,
        needed_dependencies=dependencies,
        other_needed_dependencies=other_dependencies,
        gmp_family_needed_dependencies=gmp_family,
        observed_version_marker=expected.expected_version_marker,
        version_marker_section_index=version_marker_section_index,
        required_dynsymbols=required,
        defined_required_dynsymbols=defined,
        expected_soname=expected.expected_soname,
        expected_version_marker=expected.expected_version_marker,
        expected_gmp_soname=expected.expected_gmp_soname,
        plain_sha256_match_established=True,
        elf_identity_match_established=True,
        bounded_table_validation_established=True,
        soname_match_established=True,
        gmp_dependency_rule_applicable=expected.library_id == "mpfr",
        gmp_dependency_rule_satisfied=expected.library_id == "mpfr",
        version_marker_match_established=True,
        required_dynsymbols_defined_established=True,
        gnu_versym_present=versym is not None,
        required_dynsymbols_default_version_visible_established=True,
        static_metadata_observation_complete=True,
        loader_available=False,
        runtime_available=False,
        canary_available=False,
        canary_executed=False,
        canary_passed=False,
        conformance_available=False,
        conformance_executed=False,
        conformance_passed=False,
        serialization_barrier_available=False,
        serialization_barrier_executed=False,
        serialization_barrier_passed=False,
        policy_arithmetic_available=False,
        runtime_authority=False,
        runtime_conformance_authority=False,
        serialization_authority=False,
        policy_arithmetic_authority=False,
        scientific_authority=False,
        proof_authority=False,
        gate_authority=False,
        admission_authority=False,
        registration_authority=False,
    )


__all__ = [
    "ElfInspectionExpectation",
    "MAX_DYNAMIC_ENTRIES",
    "MAX_DYNSYM_ENTRIES",
    "MAX_ELF_IMAGE_BYTES",
    "MAX_NEEDED_DEPENDENCIES",
    "MAX_PROGRAM_HEADERS",
    "MAX_SECTION_HEADERS",
    "MAX_STRING_TABLE_BYTES",
    "MAX_SYMBOL_NAME_BYTES",
    "MAX_VERSION_MARKER_BYTES",
    "Replay256ElfError",
    "STATIC_ELF_SECURITY_PROFILE",
    "StaticElfObservation",
    "VERIFIER_REQUIRED_GMP_DYNSYMBOLS",
    "VERIFIER_REQUIRED_MPFR_DYNSYMBOLS",
    "inspect_replay256_elf",
]
