"""Focused tests for the producer-only RN256 runtime manifest observer."""

from __future__ import annotations

import ast
from dataclasses import FrozenInstanceError, replace
import hashlib
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import rn256_runtime  # noqa: E402
from rn256_runtime import (  # noqa: E402
    NONLINUX_TEST_COMPATIBILITY_DISPOSITION,
    REQUIRED_GMP_SYMBOLS,
    REQUIRED_MPFR_SYMBOLS,
    REQUIRED_NAMED_GET_D_BARRIERS,
    RUNTIME_SOURCE_MANIFEST,
    RuntimeLibraryExpectation,
    RuntimeManifestObservationError,
    RuntimeManifestRequest,
    observe_runtime_manifest_candidate,
    validate_runtime_source_manifest,
)


MPFR_BYTES = b"producer-mpfr-runtime-candidate\x00" * 19
GMP_BYTES = b"producer-gmp-runtime-candidate\xff" * 17


def _expectation(
    component: str,
    path: Path,
    *,
    data: bytes | None = None,
) -> RuntimeLibraryExpectation:
    raw = path.read_bytes() if data is None else data
    return RuntimeLibraryExpectation(
        component=component,
        absolute_path=str(path),
        ordinary_file_size=len(raw),
        plain_sha256=hashlib.sha256(raw).hexdigest(),
        soname="libmpfr.so.6" if component == "mpfr" else "libgmp.so.10",
        version="4.2.2" if component == "mpfr" else "6.3.0",
        abi="x86_64-linux-gnu-lp64",
    )


def _files(root: Path) -> tuple[Path, Path]:
    mpfr = root / "libmpfr.so.6"
    gmp = root / "libgmp.so.10"
    mpfr.write_bytes(MPFR_BYTES)
    gmp.write_bytes(GMP_BYTES)
    return mpfr, gmp


def _request(mpfr: Path, gmp: Path) -> RuntimeManifestRequest:
    return RuntimeManifestRequest(
        mpfr=_expectation("mpfr", mpfr),
        gmp=_expectation("gmp", gmp),
    )


def _observe(request: RuntimeManifestRequest):
    return observe_runtime_manifest_candidate(
        request,
        test_only_allow_nonlinux_compatibility=True,
    )


class RuntimeSourceManifestTests(unittest.TestCase):
    def test_source_manifest_covers_required_runtime_primitives_and_barriers(self) -> None:
        validate_runtime_source_manifest(RUNTIME_SOURCE_MANIFEST)
        required_mpfr = {
            "mpfr_set_z",
            "mpfr_set_z_2exp",
            "mpfr_get_z_2exp",
            "mpfr_set_q",
            "mpfr_add",
            "mpfr_sub",
            "mpfr_mul",
            "mpfr_div",
            "mpfr_sqrt",
            "mpfr_const_pi",
            "mpfr_cos",
            "mpfr_log",
            "mpfr_exp",
            "mpfr_set_emin",
            "mpfr_set_emax",
            "mpfr_get_emin",
            "mpfr_get_emax",
            "mpfr_clear_flags",
            "mpfr_erangeflag_p",
            "mpfr_get_d",
        }
        required_gmp = {
            "__gmpz_init",
            "__gmpz_clear",
            "__gmpz_set_str",
            "__gmpz_neg",
            "__gmpq_init",
            "__gmpq_clear",
            "__gmpq_set_str",
            "__gmpq_canonicalize",
        }
        self.assertTrue(required_mpfr.issubset(REQUIRED_MPFR_SYMBOLS))
        self.assertTrue(required_gmp.issubset(REQUIRED_GMP_SYMBOLS))
        self.assertIn("final_ordered_array_element_bits", REQUIRED_NAMED_GET_D_BARRIERS)
        self.assertIn("provisionalA1ReceiptBits", REQUIRED_NAMED_GET_D_BARRIERS)
        self.assertEqual(len(REQUIRED_MPFR_SYMBOLS), len(set(REQUIRED_MPFR_SYMBOLS)))
        self.assertEqual(len(REQUIRED_GMP_SYMBOLS), len(set(REQUIRED_GMP_SYMBOLS)))

    def test_missing_symbol_or_named_barrier_is_typed_and_fail_closed(self) -> None:
        first = RUNTIME_SOURCE_MANIFEST.mpfr_groups[0]
        missing_symbol = replace(first, symbols=first.symbols[1:])
        manifest = replace(
            RUNTIME_SOURCE_MANIFEST,
            mpfr_groups=(missing_symbol,) + RUNTIME_SOURCE_MANIFEST.mpfr_groups[1:],
        )
        with self.assertRaises(RuntimeManifestObservationError) as caught:
            validate_runtime_source_manifest(manifest)
        self.assertEqual(caught.exception.code, "source_manifest_missing_symbols")

        manifest = replace(
            RUNTIME_SOURCE_MANIFEST,
            named_get_d_barriers=RUNTIME_SOURCE_MANIFEST.named_get_d_barriers[:-1],
        )
        with self.assertRaises(RuntimeManifestObservationError) as caught:
            validate_runtime_source_manifest(manifest)
        self.assertEqual(
            caught.exception.code,
            "source_manifest_missing_named_get_d_barriers",
        )

    def test_source_is_independent_and_has_no_loader_or_search_fallback(self) -> None:
        source = Path(rn256_runtime.__file__).read_text(encoding="utf-8")
        tree = ast.parse(source)
        imported_roots: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imported_roots.update(alias.name.split(".", 1)[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imported_roots.add(node.module.split(".", 1)[0])
        self.assertNotIn("ctypes", imported_roots)
        self.assertNotIn("verifier", source.lower())
        self.assertNotIn("replay256_runtime", source)
        self.assertNotIn("find_library", source)
        self.assertNotIn("LD_LIBRARY_PATH", source)
        self.assertNotIn("DYLD_LIBRARY_PATH", source)
        self.assertNotIn("os.environ", source)
        self.assertNotIn("os.getenv", source)
        self.assertNotIn("PATH", imported_roots)
        self.assertIn("os.O_PATH", source)
        self.assertIn("os.O_NONBLOCK", source)
        self.assertIn('f"/proc/self/fd/{probe_descriptor}"', source)


class RuntimePlatformGuardTests(unittest.TestCase):
    def test_exact_linux_x86_64_lp64_little_endian_guard(self) -> None:
        self.assertEqual(rn256_runtime.MAX_LIBRARY_BYTE_LENGTH, 64 << 20)
        exact = rn256_runtime._PlatformSnapshot(
            sys_platform="linux",
            os_name="posix",
            machine="x86_64",
            byteorder="little",
            pointer_bits=64,
            c_long_bits=64,
            c_int_bits=32,
        )
        observation = rn256_runtime._platform_observation(
            exact,
            test_only_allow_nonlinux_compatibility=False,
        )
        self.assertTrue(observation.production_guard_satisfied)

        for field, value in (
            ("machine", "aarch64"),
            ("byteorder", "big"),
            ("pointer_bits", 32),
            ("c_long_bits", 32),
            ("c_int_bits", 64),
        ):
            with self.subTest(field=field, value=value):
                invalid = replace(exact, **{field: value})
                with self.assertRaises(RuntimeManifestObservationError) as caught:
                    rn256_runtime._platform_observation(
                        invalid,
                        test_only_allow_nonlinux_compatibility=True,
                    )
                self.assertEqual(caught.exception.code, "linux_abi_guard_mismatch")

    def test_public_api_fails_closed_off_linux_without_explicit_opt_in(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            mpfr, gmp = _files(Path(temporary))
            with mock.patch.object(
                rn256_runtime,
                "_platform_snapshot",
                return_value=rn256_runtime._PlatformSnapshot(
                    sys_platform="win32",
                    os_name="nt",
                    machine="AMD64",
                    byteorder="little",
                    pointer_bits=64,
                    c_long_bits=32,
                    c_int_bits=32,
                ),
            ):
                with self.assertRaises(RuntimeManifestObservationError) as caught:
                    observe_runtime_manifest_candidate(_request(mpfr, gmp))
            self.assertEqual(
                caught.exception.code,
                "nonlinux_test_compatibility_not_authorized",
            )


@unittest.skipUnless(sys.platform == "win32", "Windows test-only observer")
class WindowsCompatibilityObservationTests(unittest.TestCase):
    def test_exact_bytes_produce_immutable_non_authoritative_candidate(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            mpfr, gmp = _files(Path(temporary))
            candidate = _observe(_request(mpfr, gmp))

        self.assertEqual(
            candidate.platform.disposition,
            NONLINUX_TEST_COMPATIBILITY_DISPOSITION,
        )
        self.assertFalse(candidate.platform.production_guard_satisfied)
        self.assertEqual(candidate.mpfr.plain_sha256, hashlib.sha256(MPFR_BYTES).hexdigest())
        self.assertEqual(candidate.gmp.plain_sha256, hashlib.sha256(GMP_BYTES).hexdigest())
        self.assertIsNone(candidate.mpfr.soname_observed)
        self.assertIsNone(candidate.mpfr.version_observed)
        self.assertIsNone(candidate.mpfr.abi_observed)
        self.assertTrue(candidate.binary_byte_and_identity_observation_complete)
        self.assertTrue(candidate.manifest_candidate_only)
        false_fields = (
            "soname_observation_complete",
            "version_observation_complete",
            "abi_observation_complete",
            "metadata_conformance_established",
            "load_attempted",
            "load_succeeded",
            "symbol_resolution_attempted",
            "symbol_inventory_satisfied",
            "configure_attempted",
            "configure_succeeded",
            "canary_attempted",
            "canary_succeeded",
            "conformance_attempted",
            "conformance_succeeded",
            "runtime_conformance_authority",
            "execution_authority",
            "scientific_authority",
            "physical_viability_established",
            "propulsion_capability_established",
            "transport_capability_established",
        )
        for field in false_fields:
            self.assertIs(getattr(candidate, field), False, field)
        with self.assertRaises(FrozenInstanceError):
            candidate.load_succeeded = True  # type: ignore[misc]

    def test_wrong_size_and_plain_hash_are_typed(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            mpfr, gmp = _files(Path(temporary))
            request = _request(mpfr, gmp)
            wrong_size = replace(
                request,
                mpfr=replace(
                    request.mpfr,
                    ordinary_file_size=request.mpfr.ordinary_file_size + 1,
                ),
            )
            with self.assertRaises(RuntimeManifestObservationError) as caught:
                _observe(wrong_size)
            self.assertEqual(caught.exception.code, "library_size_mismatch")

            wrong_hash = replace(
                request,
                mpfr=replace(request.mpfr, plain_sha256="0" * 64),
            )
            with self.assertRaises(RuntimeManifestObservationError) as caught:
                _observe(wrong_hash)
            self.assertEqual(caught.exception.code, "library_plain_sha256_mismatch")

    def test_missing_file_symlink_and_hardlink_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            mpfr, gmp = _files(root)
            missing = root / "missing-libmpfr.so.6"
            request = replace(
                _request(mpfr, gmp),
                mpfr=replace(_expectation("mpfr", mpfr), absolute_path=str(missing)),
            )
            with self.assertRaises(RuntimeManifestObservationError) as caught:
                _observe(request)
            self.assertEqual(caught.exception.code, "library_path_lstat_failed")

        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            mpfr, gmp = _files(root)
            link = root / "libmpfr-link.so.6"
            try:
                link.symlink_to(mpfr)
            except OSError:
                request = _request(mpfr, gmp)
                with mock.patch.object(rn256_runtime, "_is_reparse_point", return_value=True):
                    with self.assertRaises(RuntimeManifestObservationError) as caught:
                        _observe(request)
            else:
                request = replace(
                    _request(mpfr, gmp),
                    mpfr=replace(_expectation("mpfr", mpfr), absolute_path=str(link)),
                )
                with self.assertRaises(RuntimeManifestObservationError) as caught:
                    _observe(request)
            self.assertEqual(
                caught.exception.code,
                "library_path_symlink_or_reparse_forbidden",
            )

        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            mpfr, gmp = _files(root)
            os.link(mpfr, root / "mpfr-hardlink")
            with self.assertRaises(RuntimeManifestObservationError) as caught:
                _observe(_request(mpfr, gmp))
            self.assertEqual(caught.exception.code, "library_hardlink_count_mismatch")

    def test_stat_read_stat_and_final_reopen_races_fail_closed(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            mpfr, gmp = _files(root)
            request = _request(mpfr, gmp)
            real_read = rn256_runtime._read_exact_digest
            calls = 0

            def racing_read(descriptor, expectation):
                nonlocal calls
                digest = real_read(descriptor, expectation)
                calls += 1
                if calls == 1:
                    mpfr.write_bytes(b"X" * len(MPFR_BYTES))
                    metadata = mpfr.stat()
                    os.utime(
                        mpfr,
                        ns=(metadata.st_atime_ns, metadata.st_mtime_ns + 1_000_000_000),
                    )
                return digest

            with mock.patch.object(
                rn256_runtime,
                "_read_exact_digest",
                side_effect=racing_read,
            ):
                with self.assertRaises(RuntimeManifestObservationError) as caught:
                    _observe(request)
            self.assertEqual(caught.exception.code, "library_stat_read_stat_race")

        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            mpfr, gmp = _files(root)
            request = _request(mpfr, gmp)
            real_open = rn256_runtime._open_compat_file
            calls = 0

            def racing_open(expectation):
                nonlocal calls
                calls += 1
                if calls == 2:
                    replacement = root / "replacement-libmpfr.so.6"
                    replacement.write_bytes(MPFR_BYTES)
                    os.replace(replacement, mpfr)
                return real_open(expectation)

            with mock.patch.object(
                rn256_runtime,
                "_open_compat_file",
                side_effect=racing_open,
            ):
                with self.assertRaises(RuntimeManifestObservationError) as caught:
                    _observe(request)
            self.assertIn(
                caught.exception.code,
                {
                    "library_path_open_identity_mismatch",
                    "library_final_reopen_identity_mismatch",
                },
            )

    def test_hostile_input_and_noncanonical_paths_are_rejected_without_io(self) -> None:
        class HostileString(str):
            pass

        with tempfile.TemporaryDirectory() as temporary:
            mpfr, gmp = _files(Path(temporary))
            request = _request(mpfr, gmp)
            hostile = replace(
                request,
                mpfr=replace(
                    request.mpfr,
                    absolute_path=HostileString(request.mpfr.absolute_path),
                ),
            )
            with mock.patch.object(
                rn256_runtime,
                "_observe_nonlinux_test_library",
            ) as observer:
                with self.assertRaises(RuntimeManifestObservationError) as caught:
                    _observe(hostile)
            self.assertEqual(caught.exception.code, "invalid_absolute_library_path")
            observer.assert_not_called()

            relative = replace(
                request,
                mpfr=replace(request.mpfr, absolute_path="libmpfr.so.6"),
            )
            with self.assertRaises(RuntimeManifestObservationError) as caught:
                _observe(relative)
            self.assertEqual(caught.exception.code, "invalid_absolute_library_path")

            uppercase_hash = replace(
                request,
                mpfr=replace(
                    request.mpfr,
                    plain_sha256=request.mpfr.plain_sha256.upper(),
                ),
            )
            with self.assertRaises(RuntimeManifestObservationError) as caught:
                _observe(uppercase_hash)
            self.assertEqual(caught.exception.code, "invalid_expected_plain_sha256")

            over_cap = replace(
                request,
                mpfr=replace(
                    request.mpfr,
                    ordinary_file_size=rn256_runtime.MAX_LIBRARY_BYTE_LENGTH + 1,
                ),
            )
            with mock.patch.object(
                rn256_runtime,
                "_observe_nonlinux_test_library",
            ) as observer:
                with self.assertRaises(RuntimeManifestObservationError) as caught:
                    _observe(over_cap)
            self.assertEqual(
                caught.exception.code,
                "invalid_expected_ordinary_file_size",
            )
            observer.assert_not_called()

    def test_environment_search_paths_do_not_affect_exact_path_observation(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            mpfr, gmp = _files(Path(temporary))
            with mock.patch.dict(
                os.environ,
                {
                    "PATH": str(Path(temporary) / "hostile-search"),
                    "LD_LIBRARY_PATH": str(Path(temporary) / "hostile-ld"),
                    "DYLD_LIBRARY_PATH": str(Path(temporary) / "hostile-dyld"),
                },
                clear=False,
            ):
                candidate = _observe(_request(mpfr, gmp))
            self.assertEqual(candidate.mpfr.exact_absolute_path, str(mpfr))
            self.assertEqual(candidate.gmp.exact_absolute_path, str(gmp))


if __name__ == "__main__":
    unittest.main()
