"""Focused tests for the producer static-runtime manifest bridge."""

from __future__ import annotations

import ast
from dataclasses import FrozenInstanceError, replace
import hashlib
from pathlib import Path
import sys
import unittest
from unittest import mock


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import rn256_elf  # noqa: E402
import rn256_static_manifest as bridge  # noqa: E402
from rn256_runtime import (  # noqa: E402
    MANIFEST_SCHEMA_VERSION,
    ObservedRuntimeManifestCandidate,
    RUNTIME_SOURCE_MANIFEST,
    RuntimeBinaryObservation,
    RuntimePlatformObservation,
)
from test_rn256_elf import (  # noqa: E402
    GMP_MARKER,
    GMP_SONAME,
    MPFR_MARKER,
    MPFR_SONAME,
    _build_elf,
)


class _AlwaysEqual:
    def __eq__(self, _other: object) -> bool:
        return True


def _fixtures():
    return _build_elf("mpfr"), _build_elf("gmp")


def _binary(component: str, raw: bytes) -> RuntimeBinaryObservation:
    mpfr = component == "mpfr"
    return RuntimeBinaryObservation(
        component=component,
        exact_absolute_path=(
            "/opt/nhm2-producer/toolchain/lib/libmpfr.so.6"
            if mpfr
            else "/opt/nhm2-producer/toolchain/lib/libgmp.so.10"
        ),
        ordinary_file_size=len(raw),
        plain_sha256=hashlib.sha256(raw).hexdigest(),
        expected_soname=MPFR_SONAME if mpfr else GMP_SONAME,
        expected_version="4.2.2" if mpfr else "6.3.0",
        expected_abi="x86_64-linux-gnu-lp64",
        device=71,
        inode=101 if mpfr else 102,
        link_count=1,
        stat_read_stat_stable=True,
        final_reopen_identity_stable=True,
        final_reopen_digest_stable=True,
        soname_observed=None,
        version_observed=None,
        abi_observed=None,
    )


def _candidate(mpfr_raw: bytes, gmp_raw: bytes) -> ObservedRuntimeManifestCandidate:
    return ObservedRuntimeManifestCandidate(
        schema_version=MANIFEST_SCHEMA_VERSION,
        platform=RuntimePlatformObservation(
            sys_platform="linux",
            os_name="posix",
            machine="x86_64",
            byteorder="little",
            pointer_bits=64,
            c_long_bits=64,
            c_int_bits=32,
            production_guard_satisfied=True,
            disposition=(
                "linux_x86_64_lp64_little_endian_production_observation"
            ),
        ),
        source_manifest=RUNTIME_SOURCE_MANIFEST,
        mpfr=_binary("mpfr", mpfr_raw),
        gmp=_binary("gmp", gmp_raw),
        binary_byte_and_identity_observation_complete=True,
        soname_observation_complete=False,
        version_observation_complete=False,
        abi_observation_complete=False,
        metadata_conformance_established=False,
        manifest_candidate_only=True,
        load_attempted=False,
        load_succeeded=False,
        symbol_resolution_attempted=False,
        symbol_inventory_satisfied=False,
        configure_attempted=False,
        configure_succeeded=False,
        canary_attempted=False,
        canary_succeeded=False,
        conformance_attempted=False,
        conformance_succeeded=False,
        runtime_conformance_authority=False,
        execution_authority=False,
        scientific_authority=False,
        physical_viability_established=False,
        propulsion_capability_established=False,
        transport_capability_established=False,
    )


def _build(
    candidate: ObservedRuntimeManifestCandidate,
    mpfr_raw: bytes,
    gmp_raw: bytes,
):
    return bridge.build_static_runtime_manifest_candidate(
        candidate,
        mpfr_raw=mpfr_raw,
        gmp_raw=gmp_raw,
    )


def _assert_code(
    testcase: unittest.TestCase,
    code: str,
    callback,
    *,
    component: str | None = None,
    detail: str | None = None,
) -> None:
    with testcase.assertRaises(bridge.StaticRuntimeManifestBridgeError) as caught:
        callback()
    testcase.assertEqual(caught.exception.code, code)
    testcase.assertEqual(caught.exception.component, component)
    testcase.assertEqual(caught.exception.detail, detail)


class StaticRuntimeManifestSuccessTests(unittest.TestCase):
    def test_exact_bytes_emit_only_frozen_static_non_authoritative_candidate(self) -> None:
        mpfr, gmp = _fixtures()
        result = _build(_candidate(mpfr.raw, gmp.raw), mpfr.raw, gmp.raw)

        self.assertEqual(
            result.schema_version,
            bridge.STATIC_RUNTIME_MANIFEST_SCHEMA_VERSION,
        )
        self.assertEqual(result.mpfr.soname, MPFR_SONAME)
        self.assertEqual(result.gmp.soname, GMP_SONAME)
        self.assertEqual(result.mpfr.version_marker, MPFR_MARKER)
        self.assertEqual(result.gmp.version_marker, GMP_MARKER)
        self.assertEqual(result.mpfr.gmp_family_dependencies, (GMP_SONAME,))
        self.assertEqual(result.gmp.gmp_family_dependencies, ())
        self.assertEqual(
            result.mpfr.defined_required_dynsymbols,
            rn256_elf.frozen_required_dynsymbols("mpfr"),
        )
        self.assertEqual(
            result.gmp.defined_required_dynsymbols,
            rn256_elf.frozen_required_dynsymbols("gmp"),
        )
        for name in (
            "binary_observation_revalidated",
            "static_elf_evidence_recomputed",
            "static_observation_crosscheck_complete",
            "static_metadata_evidence_only",
        ):
            self.assertIs(getattr(result, name), True, name)
        for name in (
            "observation_provenance_authority",
            "raw_byte_provenance_authority",
            "loader_attempted",
            "loader_succeeded",
            "runtime_mapping_established",
            "symbol_resolution_attempted",
            "symbol_resolution_succeeded",
            "runtime_configuration_attempted",
            "runtime_configuration_succeeded",
            "canary_attempted",
            "canary_succeeded",
            "conformance_attempted",
            "conformance_succeeded",
            "arithmetic_executed",
            "serialization_executed",
            "runtime_binding_established",
            "metadata_conformance_established",
            "runtime_conformance_authority",
            "execution_authority",
            "admission_authority",
            "scientific_authority",
            "physical_viability_established",
            "propulsion_capability_established",
            "transport_capability_established",
        ):
            self.assertIs(getattr(result, name), False, name)
        with self.assertRaises(FrozenInstanceError):
            result.execution_authority = True  # type: ignore[misc]
        with self.assertRaises(FrozenInstanceError):
            result.mpfr.soname = "libmpfr.so.7"  # type: ignore[misc]

    def test_both_static_inspections_receive_exact_bytes_and_cross_bound_expectations(self) -> None:
        mpfr, gmp = _fixtures()
        candidate = _candidate(mpfr.raw, gmp.raw)
        with mock.patch.object(
            bridge,
            "inspect_static_elf",
            wraps=rn256_elf.inspect_static_elf,
        ) as inspector:
            _build(candidate, mpfr.raw, gmp.raw)

        self.assertEqual(inspector.call_count, 2)
        first_raw, first_expectation = inspector.call_args_list[0].args
        second_raw, second_expectation = inspector.call_args_list[1].args
        self.assertIs(first_raw, gmp.raw)
        self.assertIs(second_raw, mpfr.raw)
        self.assertEqual(first_expectation.component, "gmp")
        self.assertIsNone(first_expectation.expected_gmp_soname)
        self.assertEqual(second_expectation.component, "mpfr")
        self.assertEqual(second_expectation.expected_gmp_soname, GMP_SONAME)
        self.assertEqual(second_expectation.expected_version_marker, MPFR_MARKER)
        self.assertEqual(
            second_expectation.required_dynsymbols,
            rn256_elf.frozen_required_dynsymbols("mpfr"),
        )


class RuntimeObservationRevalidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.mpfr, self.gmp = _fixtures()
        self.candidate = _candidate(self.mpfr.raw, self.gmp.raw)

    def call(self, candidate=None, mpfr_raw=None, gmp_raw=None):
        return _build(
            self.candidate if candidate is None else candidate,
            self.mpfr.raw if mpfr_raw is None else mpfr_raw,
            self.gmp.raw if gmp_raw is None else gmp_raw,
        )

    def test_every_runtime_candidate_status_flag_is_revalidated(self) -> None:
        for name in bridge._RUNTIME_TRUE_FLAGS:
            with self.subTest(name=name):
                changed = replace(self.candidate, **{name: False})
                _assert_code(
                    self,
                    "runtime_observation_flag_mismatch",
                    lambda changed=changed: self.call(changed),
                    detail=name,
                )
        for name in bridge._RUNTIME_FALSE_FLAGS:
            with self.subTest(name=name):
                changed = replace(self.candidate, **{name: True})
                _assert_code(
                    self,
                    "runtime_observation_flag_mismatch",
                    lambda changed=changed: self.call(changed),
                    detail=name,
                )

    def test_schema_platform_source_and_binary_identity_are_revalidated(self) -> None:
        _assert_code(
            self,
            "runtime_observation_schema_mismatch",
            lambda: self.call(replace(self.candidate, schema_version="wrong")),
        )
        wrong_platform = replace(self.candidate.platform, c_long_bits=32)
        _assert_code(
            self,
            "platform_observation_profile_mismatch",
            lambda: self.call(replace(self.candidate, platform=wrong_platform)),
        )
        missing_group = replace(
            RUNTIME_SOURCE_MANIFEST,
            mpfr_groups=RUNTIME_SOURCE_MANIFEST.mpfr_groups[:-1],
        )
        _assert_code(
            self,
            "runtime_source_manifest_revalidation_failed",
            lambda: self.call(replace(self.candidate, source_manifest=missing_group)),
            detail="source_manifest_missing_symbols",
        )
        same_identity = replace(
            self.candidate.gmp,
            device=self.candidate.mpfr.device,
            inode=self.candidate.mpfr.inode,
        )
        _assert_code(
            self,
            "runtime_library_identities_not_distinct",
            lambda: self.call(replace(self.candidate, gmp=same_identity)),
        )

    def test_every_binary_stability_and_absent_metadata_field_is_revalidated(self) -> None:
        for name in (
            "stat_read_stat_stable",
            "final_reopen_identity_stable",
            "final_reopen_digest_stable",
        ):
            with self.subTest(name=name):
                changed = replace(self.candidate.mpfr, **{name: False})
                _assert_code(
                    self,
                    "binary_observation_stability_mismatch",
                    lambda changed=changed: self.call(
                        replace(self.candidate, mpfr=changed)
                    ),
                    component="mpfr",
                    detail=name,
                )
        for name in ("soname_observed", "version_observed", "abi_observed"):
            with self.subTest(name=name):
                changed = replace(self.candidate.mpfr, **{name: "forged"})
                _assert_code(
                    self,
                    "runtime_metadata_observation_must_be_absent",
                    lambda changed=changed: self.call(
                        replace(self.candidate, mpfr=changed)
                    ),
                    component="mpfr",
                    detail=name,
                )

    def test_binary_metadata_path_size_digest_and_abi_are_revalidated(self) -> None:
        cases = (
            (
                replace(self.candidate.mpfr, exact_absolute_path="relative.so"),
                "runtime_observation_path_invalid",
            ),
            (
                replace(
                    self.candidate.mpfr,
                    exact_absolute_path="/opt/nhm2/libmpfr.so.6\nforged",
                ),
                "runtime_observation_path_invalid",
            ),
            (
                replace(self.candidate.mpfr, ordinary_file_size=True),
                "binary_observation_size_invalid",
            ),
            (
                replace(self.candidate.mpfr, plain_sha256="A" * 64),
                "binary_observation_digest_invalid",
            ),
            (
                replace(self.candidate.mpfr, expected_soname="dir/libmpfr.so.6"),
                "binary_observation_soname_invalid",
            ),
            (
                replace(self.candidate.mpfr, expected_soname="libevil.so"),
                "binary_observation_soname_invalid",
            ),
            (
                replace(self.candidate.mpfr, expected_version=""),
                "binary_observation_version_invalid",
            ),
            (
                replace(self.candidate.mpfr, expected_abi="invented-abi"),
                "binary_observation_abi_mismatch",
            ),
            (
                replace(self.candidate.mpfr, link_count=2),
                "binary_observation_link_count_mismatch",
            ),
        )
        for changed, code in cases:
            with self.subTest(code=code):
                _assert_code(
                    self,
                    code,
                    lambda changed=changed: self.call(
                        replace(self.candidate, mpfr=changed)
                    ),
                    component="mpfr",
                )

    def test_explicit_raw_inputs_require_exact_bytes_size_and_digest(self) -> None:
        _assert_code(
            self,
            "exact_immutable_library_bytes_required",
            lambda: self.call(gmp_raw=bytearray(self.gmp.raw)),
            component="gmp",
        )
        _assert_code(
            self,
            "library_byte_length_observation_mismatch",
            lambda: self.call(mpfr_raw=self.mpfr.raw[:-1]),
            component="mpfr",
        )
        mutated = bytes((self.mpfr.raw[0] ^ 1,)) + self.mpfr.raw[1:]
        _assert_code(
            self,
            "library_digest_observation_mismatch",
            lambda: self.call(mpfr_raw=mutated),
            component="mpfr",
        )


class StaticEvidenceRevalidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.mpfr, self.gmp = _fixtures()
        self.candidate = _candidate(self.mpfr.raw, self.gmp.raw)

    def build_with_transform(self, transform):
        real_inspector = rn256_elf.inspect_static_elf

        def inspected(raw, expectation):
            evidence = real_inspector(raw, expectation)
            return transform(evidence)

        with mock.patch.object(bridge, "inspect_static_elf", side_effect=inspected):
            return _build(self.candidate, self.mpfr.raw, self.gmp.raw)

    def test_every_static_evidence_status_flag_is_revalidated(self) -> None:
        for name in bridge._STATIC_TRUE_FLAGS:
            with self.subTest(name=name):
                _assert_code(
                    self,
                    "static_elf_evidence_flag_mismatch",
                    lambda name=name: self.build_with_transform(
                        lambda evidence: (
                            replace(evidence, **{name: False})
                            if evidence.component == "gmp"
                            else evidence
                        )
                    ),
                    component="gmp",
                    detail=name,
                )
        for name in bridge._STATIC_FALSE_FLAGS:
            with self.subTest(name=name):
                _assert_code(
                    self,
                    "static_elf_evidence_flag_mismatch",
                    lambda name=name: self.build_with_transform(
                        lambda evidence: (
                            replace(evidence, **{name: True})
                            if evidence.component == "gmp"
                            else evidence
                        )
                    ),
                    component="gmp",
                    detail=name,
                )

    def test_constructible_evidence_cannot_forge_symbols_or_dependency_identity(self) -> None:
        _assert_code(
            self,
            "static_elf_evidence_crosscheck_mismatch",
            lambda: self.build_with_transform(
                lambda evidence: (
                    replace(
                        evidence,
                        defined_required_dynsymbols=(
                            evidence.defined_required_dynsymbols[:-1]
                        ),
                    )
                    if evidence.component == "gmp"
                    else evidence
                )
            ),
            component="gmp",
            detail="defined_required_dynsymbols",
        )
        _assert_code(
            self,
            "static_elf_evidence_crosscheck_mismatch",
            lambda: self.build_with_transform(
                lambda evidence: (
                    replace(
                        evidence,
                        defined_required_dynsymbols=(
                            _AlwaysEqual(),
                            *evidence.defined_required_dynsymbols[1:],
                        ),
                    )
                    if evidence.component == "gmp"
                    else evidence
                )
            ),
            component="gmp",
            detail="defined_required_dynsymbols",
        )
        _assert_code(
            self,
            "static_gmp_dependency_evidence_mismatch",
            lambda: self.build_with_transform(
                lambda evidence: (
                    replace(
                        evidence,
                        gmp_family_dependencies=(_AlwaysEqual(),),
                    )
                    if evidence.component == "mpfr"
                    else evidence
                )
            ),
            component="mpfr",
        )
        _assert_code(
            self,
            "static_gmp_dependency_crosscheck_mismatch",
            lambda: self.build_with_transform(
                lambda evidence: (
                    replace(
                        evidence,
                        needed_sonames=evidence.needed_sonames + ("libgmp.so.11",),
                    )
                    if evidence.component == "mpfr"
                    else evidence
                )
            ),
            component="mpfr",
        )

    def test_inspector_failure_is_wrapped_with_component_and_stable_code(self) -> None:
        with mock.patch.object(
            bridge,
            "inspect_static_elf",
            side_effect=rn256_elf.StaticElfInspectionError("synthetic_failure"),
        ):
            _assert_code(
                self,
                "static_elf_inspection_failed",
                lambda: _build(self.candidate, self.mpfr.raw, self.gmp.raw),
                component="gmp",
                detail="synthetic_failure",
            )

    def test_bridge_source_has_no_loader_host_io_or_verifier_dependency(self) -> None:
        source = Path(bridge.__file__).read_text(encoding="utf-8")
        tree = ast.parse(source)
        imported_roots: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imported_roots.update(alias.name.split(".", 1)[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imported_roots.add(node.module.split(".", 1)[0])
        self.assertNotIn("ctypes", imported_roots)
        self.assertNotIn("os", imported_roots)
        self.assertNotIn("subprocess", imported_roots)
        self.assertNotIn("verifier", source.lower())
        self.assertNotIn("replay256", source)
        self.assertNotIn("CDLL", source)
        self.assertNotIn("open(", source)


if __name__ == "__main__":
    unittest.main()
