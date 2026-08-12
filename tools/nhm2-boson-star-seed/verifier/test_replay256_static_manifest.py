"""Focused hostile-input tests for the verifier static-manifest bridge."""

from __future__ import annotations

import ast
from dataclasses import FrozenInstanceError, fields, replace
import hashlib
from pathlib import Path
import stat
import sys
import unittest
from unittest import mock


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import replay256_static_manifest as bridge  # noqa: E402
from replay256_elf import (  # noqa: E402
    ElfInspectionExpectation,
    VERIFIER_REQUIRED_GMP_DYNSYMBOLS,
    VERIFIER_REQUIRED_MPFR_DYNSYMBOLS,
    inspect_replay256_elf,
)
from replay256_runtime import (  # noqa: E402
    LINUX_SECURITY_PROFILE,
    REPLAY256_NAMED_GET_D_BARRIERS,
    REQUIRED_GMP_SYMBOLS,
    REQUIRED_MPFR_SYMBOLS,
    Replay256RuntimeManifestCandidate,
    RuntimeLibraryObservation,
)
from replay256_static_manifest import (  # noqa: E402
    REPLAY256_EXPECTED_RUNTIME_ABI,
    REPLAY256_OBSERVED_STATIC_ABI,
    STATIC_RUNTIME_MANIFEST_SECURITY_PROFILE,
    Replay256StaticManifestError,
    build_replay256_static_runtime_manifest,
)
from test_replay256_elf import _build_elf  # noqa: E402


class _AlwaysEqual:
    def __eq__(self, _other: object) -> bool:
        return True


def _observation(
    library_id: str,
    raw_bytes: bytes,
    *,
    device_id: int,
    inode: int,
) -> RuntimeLibraryObservation:
    if library_id == "mpfr":
        path = "/frozen/toolchain/libmpfr.so.6"
        soname = "libmpfr.so.6"
        version = "4.2.1"
    else:
        path = "/frozen/toolchain/libgmp.so.10"
        soname = "libgmp.so.10"
        version = "6.3.0"
    mode = stat.S_IFREG | 0o444
    return RuntimeLibraryObservation(
        library_id=library_id,
        absolute_path=path,
        byte_length=len(raw_bytes),
        plain_sha256=hashlib.sha256(raw_bytes).hexdigest(),
        expected_soname=soname,
        expected_version=version,
        expected_abi=REPLAY256_EXPECTED_RUNTIME_ABI,
        device_id=device_id,
        inode=inode,
        mode=mode,
        mode_file_type=stat.S_IFREG,
        link_count=1,
        mtime_nanoseconds=100 + inode,
        ctime_nanoseconds=200 + inode,
        raw_bytes=raw_bytes,
        security_profile=LINUX_SECURITY_PROFILE,
        production_security_profile_established=True,
        exact_size_match_established=True,
        plain_sha256_match_established=True,
        identity_stability_established=True,
        fresh_reopen_match_established=True,
        soname_observed=False,
        soname_match_established=False,
        version_observed=False,
        version_match_established=False,
        abi_observed=False,
        abi_match_established=False,
    )


def _candidate(
    mpfr_raw_bytes: bytes,
    gmp_raw_bytes: bytes,
) -> Replay256RuntimeManifestCandidate:
    return Replay256RuntimeManifestCandidate(
        mpfr=_observation("mpfr", mpfr_raw_bytes, device_id=11, inode=101),
        gmp=_observation("gmp", gmp_raw_bytes, device_id=11, inode=102),
        security_profile=LINUX_SECURITY_PROFILE,
        required_mpfr_symbols=REQUIRED_MPFR_SYMBOLS,
        required_gmp_symbols=REQUIRED_GMP_SYMBOLS,
        named_get_d_barriers=REPLAY256_NAMED_GET_D_BARRIERS,
        byte_identity_observation_complete=True,
        pair_concurrent_immutability_established=False,
        soname_observation_complete=False,
        version_observation_complete=False,
        abi_observation_complete=False,
        required_symbols_observed=False,
        runtime_loader_available=False,
        symbol_resolution_available=False,
        runtime_configuration_available=False,
        canary_available=False,
        conformance_available=False,
        serialization_barrier_available=False,
        policy_arithmetic_available=False,
        dynamic_loading_attempted=False,
        symbol_resolution_attempted=False,
        runtime_configuration_attempted=False,
        canary_executed=False,
        conformance_executed=False,
        runtime_authority=False,
        runtime_conformance_authority=False,
        toolchain_binding_authority=False,
        policy_arithmetic_authority=False,
        scientific_authority=False,
        proof_authority=False,
        gate_authority=False,
        admission_authority=False,
        registration_authority=False,
    )


def _valid_inputs() -> tuple[bytes, bytes, Replay256RuntimeManifestCandidate]:
    mpfr = _build_elf("mpfr").raw
    gmp = _build_elf("gmp").raw
    return mpfr, gmp, _candidate(mpfr, gmp)


def _static_observation(raw_bytes: bytes, library_id: str):
    if library_id == "mpfr":
        soname = "libmpfr.so.6"
        marker = b"MPFR_VERSION=4.2.1"
        gmp_soname = "libgmp.so.10"
    else:
        soname = "libgmp.so.10"
        marker = b"GMP_VERSION=6.3.0"
        gmp_soname = None
    return inspect_replay256_elf(
        raw_bytes,
        ElfInspectionExpectation(
            library_id=library_id,
            byte_length=len(raw_bytes),
            plain_sha256=hashlib.sha256(raw_bytes).hexdigest(),
            expected_soname=soname,
            expected_version_marker=marker,
            expected_gmp_soname=gmp_soname,
        ),
    )


def _assert_bridge_code(
    testcase: unittest.TestCase,
    candidate: Replay256RuntimeManifestCandidate,
    mpfr: object,
    gmp: object,
    code: str,
) -> None:
    with testcase.assertRaises(Replay256StaticManifestError) as captured:
        build_replay256_static_runtime_manifest(
            candidate,
            mpfr_raw_bytes=mpfr,  # type: ignore[arg-type]
            gmp_raw_bytes=gmp,  # type: ignore[arg-type]
        )
    testcase.assertEqual(captured.exception.code, code)


class StaticManifestFoundationTests(unittest.TestCase):
    def test_source_is_verifier_only_bytes_only_and_has_no_runtime_surface(self) -> None:
        source = Path(bridge.__file__).read_text(encoding="utf-8")
        syntax = ast.parse(source)
        imported_roots: set[str] = set()
        called_names: set[str] = set()
        for node in ast.walk(syntax):
            if isinstance(node, ast.Import):
                imported_roots.update(alias.name.split(".", 1)[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imported_roots.add(node.module.split(".", 1)[0])
            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    called_names.add(node.func.id)
                elif isinstance(node.func, ast.Attribute):
                    called_names.add(node.func.attr)
        self.assertTrue(
            imported_roots.isdisjoint(
                {"ctypes", "importlib", "os", "producer", "subprocess"}
            )
        )
        self.assertTrue(
            called_names.isdisjoint(
                {"CDLL", "dlopen", "find_library", "getenv", "open", "read"}
            )
        )
        self.assertNotIn("rn256", source)
        self.assertNotIn("producer", source)

    def test_valid_pair_is_frozen_cross_bound_and_non_authoritative(self) -> None:
        mpfr, gmp, candidate = _valid_inputs()
        result = build_replay256_static_runtime_manifest(
            candidate,
            mpfr_raw_bytes=mpfr,
            gmp_raw_bytes=gmp,
        )
        self.assertIs(result.runtime_candidate, candidate)
        self.assertEqual(
            result.security_profile,
            STATIC_RUNTIME_MANIFEST_SECURITY_PROFILE,
        )
        self.assertEqual(result.runtime_security_profile, LINUX_SECURITY_PROFILE)
        self.assertEqual(result.expected_runtime_abi, REPLAY256_EXPECTED_RUNTIME_ABI)
        self.assertEqual(result.mpfr_static.observed_abi, REPLAY256_OBSERVED_STATIC_ABI)
        self.assertEqual(result.mpfr_static.raw_bytes, mpfr)
        self.assertEqual(result.gmp_static.raw_bytes, gmp)
        self.assertEqual(
            result.mpfr_static.gmp_family_needed_dependencies,
            (candidate.gmp.expected_soname,),
        )
        self.assertEqual(
            result.required_mpfr_symbols,
            VERIFIER_REQUIRED_MPFR_DYNSYMBOLS,
        )
        self.assertEqual(
            result.required_gmp_symbols,
            VERIFIER_REQUIRED_GMP_DYNSYMBOLS,
        )
        for name in (
            "byte_identity_cross_binding_established",
            "static_metadata_cross_binding_established",
            "mpfr_gmp_dependency_cross_binding_established",
            "required_symbol_inventory_cross_binding_established",
            "static_manifest_candidate_complete",
        ):
            self.assertIs(getattr(result, name), True, name)
        for field in fields(result):
            if field.name.endswith(
                ("_available", "_attempted", "_executed", "_passed", "_authority")
            ):
                self.assertIs(getattr(result, field.name), False, field.name)
        with self.assertRaises(FrozenInstanceError):
            result.security_profile = "changed"  # type: ignore[misc]
        with self.assertRaises(FrozenInstanceError):
            result.mpfr_static = result.gmp_static  # type: ignore[misc]


class RuntimeCandidateRevalidationTests(unittest.TestCase):
    def test_exact_candidate_type_explicit_bytes_and_pair_identity_are_required(self) -> None:
        mpfr, gmp, candidate = _valid_inputs()
        _assert_bridge_code(
            self,
            object(),  # type: ignore[arg-type]
            mpfr,
            gmp,
            "replay256_runtime_manifest_candidate_required",
        )
        _assert_bridge_code(
            self,
            candidate,
            bytearray(mpfr),
            gmp,
            "explicit_immutable_bytes_required",
        )
        _assert_bridge_code(
            self,
            candidate,
            mpfr + b"x",
            gmp,
            "runtime_byte_length_cross_binding_mismatch",
        )
        same_path = replace(
            candidate,
            gmp=replace(candidate.gmp, absolute_path=candidate.mpfr.absolute_path),
        )
        _assert_bridge_code(
            self,
            same_path,
            mpfr,
            gmp,
            "runtime_library_path_alias_forbidden",
        )
        same_inode = replace(
            candidate,
            gmp=replace(
                candidate.gmp,
                device_id=candidate.mpfr.device_id,
                inode=candidate.mpfr.inode,
            ),
        )
        _assert_bridge_code(
            self,
            same_inode,
            mpfr,
            gmp,
            "runtime_library_inode_alias_forbidden",
        )

    def test_every_runtime_candidate_flag_is_revalidated(self) -> None:
        mpfr, gmp, candidate = _valid_inputs()
        boolean_fields = tuple(
            field.name
            for field in fields(candidate)
            if type(getattr(candidate, field.name)) is bool
        )
        self.assertEqual(len(boolean_fields), 27)
        for field_name in boolean_fields:
            with self.subTest(field=field_name):
                bad = replace(
                    candidate,
                    **{field_name: not getattr(candidate, field_name)},
                )
                _assert_bridge_code(
                    self,
                    bad,
                    mpfr,
                    gmp,
                    "runtime_candidate_flag_mismatch",
                )

    def test_every_runtime_library_flag_is_revalidated(self) -> None:
        mpfr, gmp, candidate = _valid_inputs()
        boolean_fields = tuple(
            field.name
            for field in fields(candidate.mpfr)
            if type(getattr(candidate.mpfr, field.name)) is bool
        )
        self.assertEqual(len(boolean_fields), 11)
        for field_name in boolean_fields:
            with self.subTest(field=field_name):
                changed = replace(
                    candidate.mpfr,
                    **{field_name: not getattr(candidate.mpfr, field_name)},
                )
                bad = replace(candidate, mpfr=changed)
                _assert_bridge_code(
                    self,
                    bad,
                    mpfr,
                    gmp,
                    "runtime_library_flag_mismatch",
                )

    def test_runtime_candidate_inventories_and_library_fields_fail_closed(self) -> None:
        mpfr, gmp, candidate = _valid_inputs()
        candidate_cases = (
            (
                replace(candidate, security_profile="unknown"),
                "unsupported_runtime_security_profile",
            ),
            (
                replace(candidate, security_profile=_AlwaysEqual()),
                "unsupported_runtime_security_profile",
            ),
            (
                replace(candidate, mpfr=object()),
                "runtime_library_observation_required",
            ),
            (
                replace(candidate, required_mpfr_symbols=REQUIRED_MPFR_SYMBOLS[:-1]),
                "runtime_required_mpfr_symbols_mismatch",
            ),
            (
                replace(candidate, required_gmp_symbols=REQUIRED_GMP_SYMBOLS[:-1]),
                "runtime_required_gmp_symbols_mismatch",
            ),
            (
                replace(
                    candidate,
                    required_mpfr_symbols=(
                        _AlwaysEqual(),
                        *REQUIRED_MPFR_SYMBOLS[1:],
                    ),
                ),
                "runtime_required_mpfr_symbols_mismatch",
            ),
            (
                replace(
                    candidate,
                    required_gmp_symbols=(
                        _AlwaysEqual(),
                        *REQUIRED_GMP_SYMBOLS[1:],
                    ),
                ),
                "runtime_required_gmp_symbols_mismatch",
            ),
            (
                replace(
                    candidate,
                    named_get_d_barriers=REPLAY256_NAMED_GET_D_BARRIERS[:-1],
                ),
                "runtime_named_get_d_barriers_mismatch",
            ),
            (
                replace(
                    candidate,
                    named_get_d_barriers=(
                        _AlwaysEqual(),
                        *REPLAY256_NAMED_GET_D_BARRIERS[1:],
                    ),
                ),
                "runtime_named_get_d_barriers_mismatch",
            ),
        )
        for bad, code in candidate_cases:
            with self.subTest(code=code):
                _assert_bridge_code(self, bad, mpfr, gmp, code)

        library_cases = (
            (replace(candidate.mpfr, library_id="gmp"), "runtime_library_id_mismatch"),
            (
                replace(candidate.mpfr, library_id=_AlwaysEqual()),
                "runtime_library_id_mismatch",
            ),
            (replace(candidate.mpfr, absolute_path="relative"), "invalid_runtime_absolute_path"),
            (replace(candidate.mpfr, byte_length=True), "invalid_runtime_byte_length"),
            (replace(candidate.mpfr, plain_sha256="A" * 64), "invalid_runtime_plain_sha256"),
            (
                replace(candidate.mpfr, expected_soname="libgmp.so.10"),
                "invalid_runtime_expected_soname",
            ),
            (
                replace(candidate.mpfr, expected_version="version"),
                "invalid_runtime_expected_version",
            ),
            (replace(candidate.mpfr, expected_abi="ELF64"), "runtime_expected_abi_mismatch"),
            (
                replace(candidate.mpfr, expected_abi=_AlwaysEqual()),
                "runtime_expected_abi_mismatch",
            ),
            (replace(candidate.mpfr, device_id=True), "invalid_runtime_device_id"),
            (replace(candidate.mpfr, inode=0), "invalid_runtime_inode"),
            (replace(candidate.mpfr, mode=True), "invalid_runtime_mode"),
            (
                replace(candidate.mpfr, mode_file_type=stat.S_IFDIR),
                "runtime_regular_file_identity_required",
            ),
            (
                replace(candidate.mpfr, link_count=2),
                "runtime_single_link_identity_required",
            ),
            (
                replace(candidate.mpfr, mtime_nanoseconds=True),
                "invalid_runtime_mtime_nanoseconds",
            ),
            (
                replace(candidate.mpfr, ctime_nanoseconds=-1),
                "invalid_runtime_ctime_nanoseconds",
            ),
            (
                replace(candidate.mpfr, raw_bytes=bytearray(mpfr)),
                "retained_immutable_bytes_required",
            ),
            (
                replace(candidate.mpfr, security_profile="other"),
                "runtime_library_security_profile_mismatch",
            ),
            (
                replace(candidate.mpfr, security_profile=_AlwaysEqual()),
                "runtime_library_security_profile_mismatch",
            ),
        )
        for changed, code in library_cases:
            with self.subTest(code=code):
                _assert_bridge_code(
                    self,
                    replace(candidate, mpfr=changed),
                    mpfr,
                    gmp,
                    code,
                )


class StaticObservationRevalidationTests(unittest.TestCase):
    def _assert_tampered_mpfr_rejected(
        self,
        tampered: object,
        expected_code: str,
    ) -> None:
        mpfr, gmp, candidate = _valid_inputs()
        normal_gmp = _static_observation(gmp, "gmp")

        def fake_inspect(raw: bytes, expectation: ElfInspectionExpectation):
            if expectation.library_id == "mpfr":
                return tampered
            return normal_gmp

        with mock.patch.object(bridge, "inspect_replay256_elf", side_effect=fake_inspect):
            _assert_bridge_code(
                self,
                candidate,
                mpfr,
                gmp,
                expected_code,
            )

    def test_every_static_observation_boolean_is_revalidated(self) -> None:
        mpfr, _gmp, _candidate_value = _valid_inputs()
        normal = _static_observation(mpfr, "mpfr")
        boolean_fields = tuple(
            field.name
            for field in fields(normal)
            if type(getattr(normal, field.name)) is bool
            and field.name != "gnu_versym_present"
        )
        self.assertEqual(len(boolean_fields), 31)
        for field_name in boolean_fields:
            with self.subTest(field=field_name):
                tampered = replace(
                    normal,
                    **{field_name: not getattr(normal, field_name)},
                )
                self._assert_tampered_mpfr_rejected(
                    tampered,
                    "static_observation_flag_mismatch",
                )
        self._assert_tampered_mpfr_rejected(
            replace(normal, gnu_versym_present=1),  # type: ignore[arg-type]
            "static_gnu_versym_presence_invalid",
        )

    def test_every_static_observation_data_field_is_revalidated(self) -> None:
        mpfr, _gmp, _candidate_value = _valid_inputs()
        normal = _static_observation(mpfr, "mpfr")
        cases = (
            (replace(normal, library_id="gmp"), "static_observation_field_mismatch"),
            (
                replace(normal, byte_length=normal.byte_length + 1),
                "static_observation_field_mismatch",
            ),
            (replace(normal, plain_sha256="0" * 64), "static_observation_field_mismatch"),
            (
                replace(normal, raw_bytes=normal.raw_bytes + b"x"),
                "static_observation_field_mismatch",
            ),
            (replace(normal, security_profile="other"), "static_observation_field_mismatch"),
            (replace(normal, observed_abi="other"), "static_observation_field_mismatch"),
            (replace(normal, observed_soname="libmpfr.so.7"), "static_observation_field_mismatch"),
            (
                replace(normal, needed_dependencies=normal.needed_dependencies[:-1]),
                "static_dependency_partition_mismatch",
            ),
            (
                replace(normal, other_needed_dependencies=()),
                "static_dependency_partition_mismatch",
            ),
            (
                replace(normal, gmp_family_needed_dependencies=()),
                "static_dependency_partition_mismatch",
            ),
            (
                replace(
                    normal,
                    needed_dependencies=normal.needed_dependencies
                    + ("libgmpevil.so",),
                    other_needed_dependencies=normal.other_needed_dependencies
                    + ("libgmpevil.so",),
                ),
                "static_gmp_dependency_alias_invalid",
            ),
            (
                replace(normal, observed_version_marker=b"other"),
                "static_observation_field_mismatch",
            ),
            (
                replace(normal, version_marker_section_index=0),
                "static_version_marker_section_index_invalid",
            ),
            (
                replace(normal, required_dynsymbols=normal.required_dynsymbols[:-1]),
                "static_required_dynsymbols_mismatch",
            ),
            (
                replace(
                    normal,
                    required_dynsymbols=(
                        _AlwaysEqual(),
                        *normal.required_dynsymbols[1:],
                    ),
                ),
                "static_required_dynsymbols_mismatch",
            ),
            (
                replace(
                    normal,
                    defined_required_dynsymbols=(
                        _AlwaysEqual(),
                        *normal.defined_required_dynsymbols[1:],
                    ),
                ),
                "static_defined_required_dynsymbols_mismatch",
            ),
            (
                replace(
                    normal,
                    defined_required_dynsymbols=(
                        normal.defined_required_dynsymbols[:-1]
                    ),
                ),
                "static_defined_required_dynsymbols_mismatch",
            ),
            (replace(normal, expected_soname="libmpfr.so.7"), "static_observation_field_mismatch"),
            (
                replace(normal, expected_version_marker=b"other"),
                "static_observation_field_mismatch",
            ),
            (
                replace(normal, expected_gmp_soname="libgmp.so.11"),
                "static_observation_field_mismatch",
            ),
        )
        for tampered, code in cases:
            with self.subTest(code=code):
                self._assert_tampered_mpfr_rejected(tampered, code)

    def test_inspector_rejection_is_wrapped_without_granting_authority(self) -> None:
        mpfr = b"not-an-elf-image"
        gmp = _build_elf("gmp").raw
        candidate = _candidate(mpfr, gmp)
        with self.assertRaises(Replay256StaticManifestError) as captured:
            build_replay256_static_runtime_manifest(
                candidate,
                mpfr_raw_bytes=mpfr,
                gmp_raw_bytes=gmp,
            )
        self.assertEqual(captured.exception.code, "static_elf_inspection_rejected")
        self.assertEqual(captured.exception.path, "mpfr")
        self.assertEqual(captured.exception.detail, "elf_header_truncated")


if __name__ == "__main__":
    unittest.main()
