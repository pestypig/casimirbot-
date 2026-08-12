"""Focused tests for the verifier-side replay256 manifest candidate."""

from __future__ import annotations

import ast
from dataclasses import FrozenInstanceError, fields, replace
import hashlib
import os
from pathlib import Path
import stat
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest import mock


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import replay256_runtime as runtime  # noqa: E402
from replay256_runtime import (  # noqa: E402
    LINUX_SECURITY_PROFILE,
    MAX_RUNTIME_LIBRARY_BYTES,
    NUMERIC_MATERIALIZATION_GET_D_BARRIERS,
    POSTPROJECTION_GET_D_BARRIERS,
    REPLAY256_NAMED_GET_D_BARRIERS,
    REQUIRED_GMP_SYMBOLS,
    REQUIRED_MPFR_SYMBOLS,
    Replay256RuntimeError,
    RuntimeLibraryExpectation,
    WINDOWS_TEST_SECURITY_PROFILE,
    observe_replay256_runtime_candidate,
)


MPFR_BYTES = b"verifier-independent-mpfr-candidate\x00" * 7
GMP_BYTES = b"verifier-independent-gmp-candidate\xff" * 5


def _pin(path: Path, content: bytes, library_id: str) -> RuntimeLibraryExpectation:
    if library_id == "mpfr":
        soname = "libmpfr.so.6"
        version = "4.2.1"
    else:
        soname = "libgmp.so.10"
        version = "6.3.0"
    return RuntimeLibraryExpectation(
        absolute_path=os.fspath(path),
        byte_length=len(content),
        plain_sha256=hashlib.sha256(content).hexdigest(),
        expected_soname=soname,
        expected_version=version,
        expected_abi="ELF64-x86_64-LP64-little-endian",
    )


def _materialize(parent: Path) -> tuple[RuntimeLibraryExpectation, RuntimeLibraryExpectation]:
    mpfr_path = parent / "libmpfr-pinned.bin"
    gmp_path = parent / "libgmp-pinned.bin"
    mpfr_path.write_bytes(MPFR_BYTES)
    gmp_path.write_bytes(GMP_BYTES)
    return _pin(mpfr_path, MPFR_BYTES, "mpfr"), _pin(gmp_path, GMP_BYTES, "gmp")


def _observe_windows_test_compatibility(
    mpfr: RuntimeLibraryExpectation,
    gmp: RuntimeLibraryExpectation,
):
    with mock.patch.object(runtime, "_runtime_host", return_value="windows"):
        return observe_replay256_runtime_candidate(
            mpfr,
            gmp,
            test_only_allow_windows_compatibility=True,
        )


def _stat_proxy(metadata: os.stat_result, **changes: int) -> SimpleNamespace:
    values = {
        "st_dev": metadata.st_dev,
        "st_ino": metadata.st_ino,
        "st_mode": metadata.st_mode,
        "st_nlink": metadata.st_nlink,
        "st_size": metadata.st_size,
        "st_mtime_ns": metadata.st_mtime_ns,
        "st_ctime_ns": metadata.st_ctime_ns,
    }
    values.update(changes)
    return SimpleNamespace(**values)


class FrozenFoundationTests(unittest.TestCase):
    def test_required_symbols_and_named_barriers_are_frozen_and_complete(self) -> None:
        self.assertIs(type(REQUIRED_MPFR_SYMBOLS), tuple)
        self.assertEqual(len(REQUIRED_MPFR_SYMBOLS), len(set(REQUIRED_MPFR_SYMBOLS)))
        self.assertTrue(
            {
                "mpfr_set_z",
                "mpfr_set_z_2exp",
                "mpfr_get_z_2exp",
                "mpfr_set_q",
                "mpfr_set_zero",
                "mpfr_add",
                "mpfr_sub",
                "mpfr_mul",
                "mpfr_div",
                "mpfr_cmp_si",
                "mpfr_number_p",
                "mpfr_sqrt",
                "mpfr_cos",
                "mpfr_log",
                "mpfr_exp",
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
            }.issubset(REQUIRED_MPFR_SYMBOLS)
        )
        self.assertIs(type(REQUIRED_GMP_SYMBOLS), tuple)
        self.assertEqual(len(REQUIRED_GMP_SYMBOLS), len(set(REQUIRED_GMP_SYMBOLS)))
        self.assertTrue(
            {
                "__gmpz_init",
                "__gmpz_clear",
                "__gmpz_set_str",
                "__gmpz_neg",
                "__gmpq_init",
                "__gmpq_clear",
                "__gmpq_set_num",
                "__gmpq_set_den",
                "__gmpq_canonicalize",
                "__gmp_version",
            }.issubset(REQUIRED_GMP_SYMBOLS)
        )
        self.assertEqual(
            NUMERIC_MATERIALIZATION_GET_D_BARRIERS,
            (
                "serialized_rho_node_bits",
                "serialized_theta_node_bits",
                "serialized_analytic_z_bits",
                "pRepresentativeBits",
                "tailScalarCoefficientBits",
                "tailPotentialCoefficientBits",
                "A0Bits",
                "perTargetLambdaBits",
                "final_ordered_array_element_bits",
            ),
        )
        self.assertEqual(
            POSTPROJECTION_GET_D_BARRIERS,
            (
                "serialized_analytic_z_bits",
                "provisionalPostprojectionCoefficientBits",
                "provisionalA1ReceiptBits",
                "finalA1ReceiptBits",
                "final_ordered_array_element_bits",
            ),
        )
        self.assertEqual(len(REPLAY256_NAMED_GET_D_BARRIERS), 12)
        self.assertEqual(
            set(REPLAY256_NAMED_GET_D_BARRIERS),
            set(NUMERIC_MATERIALIZATION_GET_D_BARRIERS)
            | set(POSTPROJECTION_GET_D_BARRIERS),
        )

    def test_source_is_independent_and_has_no_dynamic_runtime_surface(self) -> None:
        source = Path(runtime.__file__).read_text(encoding="utf-8")
        syntax = ast.parse(source)
        imported_roots: set[str] = set()
        float_calls = 0
        for node in ast.walk(syntax):
            if isinstance(node, ast.Import):
                imported_roots.update(alias.name.split(".", 1)[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imported_roots.add(node.module.split(".", 1)[0])
            elif (
                isinstance(node, ast.Call)
                and isinstance(node.func, ast.Name)
                and node.func.id == "float"
            ):
                float_calls += 1
        self.assertTrue(
            imported_roots.isdisjoint(
                {
                    "ctypes",
                    "importlib",
                    "mpfr_backend",
                    "producer",
                    "subprocess",
                }
            )
        )
        self.assertEqual(float_calls, 0)
        for forbidden in (
            "CDLL",
            "dlopen",
            "find_library",
            "getenv",
            "os.environ",
            "rn256_runtime",
        ):
            self.assertNotIn(forbidden, source)
        self.assertNotIn("producer", source)
        linux_reader_source = source[
            source.index("def _read_linux_snapshot(") : source.index(
                "def _read_windows_test_snapshot("
            )
        ]
        self.assertIn("os.O_PATH | os.O_CLOEXEC | os.O_NOFOLLOW", linux_reader_source)
        self.assertIn('f"/proc/self/fd/{probe_descriptor}"', linux_reader_source)
        self.assertIn("os.O_RDONLY | os.O_CLOEXEC | os.O_NONBLOCK", linux_reader_source)

    def test_linux_guard_rejects_arch_lp64_and_endian_before_io(self) -> None:
        dummy = RuntimeLibraryExpectation("relative", 1, "0" * 64, "s", "v", "a")

        scenarios = (
            ("aarch64", 8, 8, 4, "little"),
            ("x86_64", 4, 8, 4, "little"),
            ("x86_64", 8, 4, 4, "little"),
            ("x86_64", 8, 8, 8, "little"),
            ("x86_64", 8, 8, 4, "big"),
        )
        real_calcsize = runtime.struct.calcsize
        for machine, pointer_size, long_size, int_size, byteorder in scenarios:
            with self.subTest(
                machine=machine,
                pointer_size=pointer_size,
                long_size=long_size,
                int_size=int_size,
                byteorder=byteorder,
            ):
                def fake_calcsize(code: str) -> int:
                    if code == "P":
                        return pointer_size
                    if code == "l":
                        return long_size
                    if code == "i":
                        return int_size
                    return real_calcsize(code)

                with mock.patch.object(runtime, "_runtime_host", return_value="linux"):
                    with mock.patch.object(
                        runtime.os,
                        "uname",
                        create=True,
                        return_value=SimpleNamespace(machine=machine),
                    ):
                        with mock.patch.object(
                            runtime.struct,
                            "calcsize",
                            side_effect=fake_calcsize,
                        ):
                            with mock.patch.object(runtime.sys, "byteorder", byteorder):
                                with mock.patch.object(runtime.os, "open") as opened:
                                    with self.assertRaises(Replay256RuntimeError) as captured:
                                        observe_replay256_runtime_candidate(dummy, dummy)
                self.assertEqual(
                    captured.exception.code,
                    "linux_x86_64_lp64_little_endian_required",
                )
                opened.assert_not_called()

        raw_bytes = b"abc"
        expectation = RuntimeLibraryExpectation(
            absolute_path="/pinned/libmpfr.so",
            byte_length=len(raw_bytes),
            plain_sha256=hashlib.sha256(raw_bytes).hexdigest(),
            expected_soname="libmpfr.so.6",
            expected_version="4.2.1",
            expected_abi="ELF64-x86_64-LP64-little-endian",
        )
        metadata = SimpleNamespace(
            st_dev=1,
            st_ino=2,
            st_mode=stat.S_IFREG | 0o444,
            st_nlink=1,
            st_size=len(raw_bytes),
            st_mtime_ns=3,
            st_ctime_ns=4,
        )
        open_calls: list[tuple[object, int, object]] = []

        def safe_open(path: object, flags: int, **kwargs: object) -> int:
            open_calls.append((path, flags, kwargs.get("dir_fd")))
            return 72 if len(open_calls) == 1 else 73

        flag_values = {
            "O_PATH": 0x200000,
            "O_CLOEXEC": 0x80000,
            "O_NOFOLLOW": 0x20000,
            "O_NONBLOCK": 0x800,
        }
        with mock.patch.object(
            runtime,
            "_open_linux_parent",
            return_value=([], 71, "libmpfr.so"),
        ):
            with mock.patch.object(runtime.os, "stat", return_value=metadata):
                with mock.patch.object(runtime.os, "open", side_effect=safe_open):
                    with mock.patch.object(runtime.os, "fstat", return_value=metadata):
                        with mock.patch.object(runtime.os, "close") as close:
                            with mock.patch.object(
                                runtime,
                                "_read_exact",
                                return_value=raw_bytes,
                            ):
                                with mock.patch.object(
                                    runtime.os, "O_PATH", flag_values["O_PATH"], create=True
                                ):
                                    with mock.patch.object(
                                        runtime.os,
                                        "O_CLOEXEC",
                                        flag_values["O_CLOEXEC"],
                                        create=True,
                                    ):
                                        with mock.patch.object(
                                            runtime.os,
                                            "O_NOFOLLOW",
                                            flag_values["O_NOFOLLOW"],
                                            create=True,
                                        ):
                                            with mock.patch.object(
                                                runtime.os,
                                                "O_NONBLOCK",
                                                flag_values["O_NONBLOCK"],
                                                create=True,
                                            ):
                                                snapshot = runtime._read_linux_snapshot(
                                                    expectation,
                                                    verify_digest=True,
                                                )

        self.assertEqual(snapshot.raw_bytes, raw_bytes)
        self.assertEqual(open_calls[0][0], "libmpfr.so")
        self.assertEqual(open_calls[0][2], 71)
        self.assertEqual(
            open_calls[0][1]
            & (flag_values["O_PATH"] | flag_values["O_NOFOLLOW"]),
            flag_values["O_PATH"] | flag_values["O_NOFOLLOW"],
        )
        self.assertEqual(open_calls[1][0], "/proc/self/fd/72")
        self.assertIsNone(open_calls[1][2])
        self.assertEqual(
            open_calls[1][1] & flag_values["O_NONBLOCK"],
            flag_values["O_NONBLOCK"],
        )
        self.assertEqual([call.args[0] for call in close.call_args_list], [73, 72])

        with mock.patch.object(runtime.os, "O_CLOEXEC", 0x80000, create=True):
            with mock.patch.object(runtime.os, "O_DIRECTORY", 0x10000, create=True):
                with mock.patch.object(runtime.os, "O_NOFOLLOW", 0x20000, create=True):
                    with mock.patch.object(runtime.os, "open", return_value=81):
                        with mock.patch.object(
                            runtime.os,
                            "fstat",
                            side_effect=OSError(5, "root fstat failure"),
                        ):
                            with mock.patch.object(runtime.os, "close") as root_close:
                                with self.assertRaises(OSError):
                                    runtime._open_linux_parent("/pinned/libmpfr.so")
        root_close.assert_called_once_with(81)


class CandidateObservationTests(unittest.TestCase):
    def test_nonlinux_default_rejects_and_opt_in_requires_exact_true(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            mpfr, gmp = _materialize(Path(temporary))
            with mock.patch.object(runtime, "_runtime_host", return_value="windows"):
                with self.assertRaises(Replay256RuntimeError) as captured:
                    observe_replay256_runtime_candidate(mpfr, gmp)
                self.assertEqual(
                    captured.exception.code,
                    "nonlinux_compatibility_requires_explicit_test_opt_in",
                )

                with self.assertRaises(Replay256RuntimeError) as truthy_captured:
                    observe_replay256_runtime_candidate(
                        mpfr,
                        gmp,
                        test_only_allow_windows_compatibility=1,  # type: ignore[arg-type]
                    )
                self.assertEqual(
                    truthy_captured.exception.code,
                    "invalid_windows_test_compatibility_opt_in",
                )

                with mock.patch.object(runtime, "_runtime_host", return_value="unsupported"):
                    with self.assertRaises(Replay256RuntimeError) as unsupported_captured:
                        observe_replay256_runtime_candidate(
                            mpfr,
                            gmp,
                            test_only_allow_windows_compatibility=True,
                        )
                self.assertEqual(
                    unsupported_captured.exception.code,
                    "windows_test_compatibility_only",
                )

                candidate = observe_replay256_runtime_candidate(
                    mpfr,
                    gmp,
                    test_only_allow_windows_compatibility=True,
                )
            self.assertEqual(candidate.security_profile, WINDOWS_TEST_SECURITY_PROFILE)

    def test_exact_bytes_metadata_reopen_and_truthful_flags(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            mpfr, gmp = _materialize(Path(temporary))
            with mock.patch.object(
                runtime,
                "_read_windows_test_snapshot",
                wraps=runtime._read_windows_test_snapshot,
            ) as reads:
                candidate = _observe_windows_test_compatibility(mpfr, gmp)

            self.assertEqual(reads.call_count, 4)
            self.assertEqual(candidate.mpfr.raw_bytes, MPFR_BYTES)
            self.assertEqual(candidate.gmp.raw_bytes, GMP_BYTES)
            self.assertEqual(candidate.mpfr.plain_sha256, mpfr.plain_sha256)
            self.assertEqual(candidate.gmp.plain_sha256, gmp.plain_sha256)
            self.assertEqual(candidate.mpfr.mode_file_type, stat.S_IFREG)
            self.assertEqual(candidate.gmp.mode_file_type, stat.S_IFREG)
            self.assertEqual(candidate.mpfr.link_count, 1)
            self.assertEqual(candidate.gmp.link_count, 1)
            self.assertEqual(candidate.mpfr.expected_soname, mpfr.expected_soname)
            self.assertEqual(candidate.mpfr.expected_version, mpfr.expected_version)
            self.assertEqual(candidate.mpfr.expected_abi, mpfr.expected_abi)
            self.assertFalse(candidate.mpfr.production_security_profile_established)
            self.assertTrue(candidate.mpfr.exact_size_match_established)
            self.assertTrue(candidate.mpfr.plain_sha256_match_established)
            self.assertTrue(candidate.mpfr.identity_stability_established)
            self.assertTrue(candidate.mpfr.fresh_reopen_match_established)
            self.assertFalse(candidate.mpfr.soname_observed)
            self.assertFalse(candidate.mpfr.soname_match_established)
            self.assertFalse(candidate.mpfr.version_observed)
            self.assertFalse(candidate.mpfr.version_match_established)
            self.assertFalse(candidate.mpfr.abi_observed)
            self.assertFalse(candidate.mpfr.abi_match_established)

            self.assertTrue(candidate.byte_identity_observation_complete)
            self.assertFalse(candidate.pair_concurrent_immutability_established)
            self.assertFalse(candidate.soname_observation_complete)
            self.assertFalse(candidate.version_observation_complete)
            self.assertFalse(candidate.abi_observation_complete)
            self.assertFalse(candidate.required_symbols_observed)
            self.assertFalse(candidate.runtime_loader_available)
            self.assertFalse(candidate.symbol_resolution_available)
            self.assertFalse(candidate.runtime_configuration_available)
            self.assertFalse(candidate.canary_available)
            self.assertFalse(candidate.conformance_available)
            self.assertFalse(candidate.serialization_barrier_available)
            self.assertFalse(candidate.policy_arithmetic_available)
            self.assertFalse(candidate.dynamic_loading_attempted)
            self.assertFalse(candidate.symbol_resolution_attempted)
            self.assertFalse(candidate.runtime_configuration_attempted)
            self.assertFalse(candidate.canary_executed)
            self.assertFalse(candidate.conformance_executed)
            for field in fields(candidate):
                if field.name.endswith("_authority"):
                    self.assertIs(getattr(candidate, field.name), False, field.name)

            with self.assertRaises(FrozenInstanceError):
                candidate.security_profile = LINUX_SECURITY_PROFILE  # type: ignore[misc]
            with self.assertRaises(FrozenInstanceError):
                candidate.mpfr.soname_observed = True  # type: ignore[misc]
            with self.assertRaises(FrozenInstanceError):
                candidate.mpfr.security_profile = LINUX_SECURITY_PROFILE  # type: ignore[misc]
            with self.assertRaises(TypeError):
                candidate.mpfr.raw_bytes[0] = 0  # type: ignore[index]

    def test_invalid_expectations_and_alias_path_are_rejected_before_reads(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            mpfr, gmp = _materialize(Path(temporary))
            self.assertEqual(MAX_RUNTIME_LIBRARY_BYTES, 64 * 1024 * 1024)
            exact_cap = runtime._validated_expectation(
                replace(mpfr, byte_length=MAX_RUNTIME_LIBRARY_BYTES),
                "mpfr",
                "windows",
            )
            self.assertEqual(exact_cap.byte_length, MAX_RUNTIME_LIBRARY_BYTES)
            cases = (
                (replace(mpfr, absolute_path="relative"), gmp, "absolute_library_path_required"),
                (replace(mpfr, byte_length=0), gmp, "invalid_expected_size"),
                (replace(mpfr, byte_length=True), gmp, "invalid_expected_size"),
                (
                    replace(mpfr, byte_length=MAX_RUNTIME_LIBRARY_BYTES + 1),
                    gmp,
                    "invalid_expected_size",
                ),
                (replace(mpfr, plain_sha256="A" * 64), gmp, "invalid_plain_sha256"),
                (replace(mpfr, expected_soname="dir/libmpfr.so"), gmp, "invalid_expected_soname"),
                (replace(mpfr, expected_version=""), gmp, "invalid_expected_version"),
                (replace(mpfr, expected_abi=" leading"), gmp, "invalid_expected_abi"),
                (
                    mpfr,
                    replace(gmp, absolute_path=mpfr.absolute_path),
                    "library_paths_must_differ",
                ),
            )
            for bad_mpfr, bad_gmp, expected_code in cases:
                with self.subTest(code=expected_code):
                    with mock.patch.object(
                        runtime,
                        "_read_windows_test_snapshot",
                    ) as read:
                        with mock.patch.object(
                            runtime,
                            "_runtime_host",
                            return_value="windows",
                        ):
                            with self.assertRaises(Replay256RuntimeError) as captured:
                                observe_replay256_runtime_candidate(
                                    bad_mpfr,
                                    bad_gmp,
                                    test_only_allow_windows_compatibility=True,
                                )
                    self.assertEqual(captured.exception.code, expected_code)
                    read.assert_not_called()

    def test_wrong_size_and_hash_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            mpfr, gmp = _materialize(Path(temporary))
            with self.assertRaises(Replay256RuntimeError) as size_captured:
                _observe_windows_test_compatibility(
                    replace(mpfr, byte_length=mpfr.byte_length + 1),
                    gmp,
                )
            self.assertEqual(size_captured.exception.code, "exact_size_required")

            with self.assertRaises(Replay256RuntimeError) as hash_captured:
                _observe_windows_test_compatibility(
                    replace(mpfr, plain_sha256="0" * 64),
                    gmp,
                )
            self.assertEqual(hash_captured.exception.code, "plain_sha256_mismatch")

    def test_symlink_and_hardlink_are_rejected_when_host_permits(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            parent = Path(temporary)
            mpfr, gmp = _materialize(parent)
            mpfr_path = Path(mpfr.absolute_path)
            target = parent / "outside.bin"
            target.write_bytes(MPFR_BYTES)
            mpfr_path.unlink()
            try:
                mpfr_path.symlink_to(target)
            except OSError:
                symlink_created = False
            else:
                symlink_created = True
            if symlink_created:
                with self.assertRaises(Replay256RuntimeError) as captured:
                    _observe_windows_test_compatibility(mpfr, gmp)
                self.assertEqual(captured.exception.code, "regular_file_required")

        with tempfile.TemporaryDirectory() as temporary:
            parent = Path(temporary)
            mpfr, gmp = _materialize(parent)
            alias = parent / "mpfr-hardlink.bin"
            try:
                os.link(mpfr.absolute_path, alias)
            except OSError:
                hardlink_created = False
            else:
                hardlink_created = True
            if hardlink_created:
                with self.assertRaises(Replay256RuntimeError) as captured:
                    _observe_windows_test_compatibility(mpfr, gmp)
                self.assertEqual(captured.exception.code, "single_link_required")

    def test_short_growth_stat_and_reopen_races_are_rejected(self) -> None:
        real_read = os.read
        with tempfile.TemporaryDirectory() as temporary:
            mpfr, gmp = _materialize(Path(temporary))

            def short_read(descriptor: int, size: int) -> bytes:
                return b""

            with mock.patch.object(runtime.os, "read", side_effect=short_read):
                with self.assertRaises(Replay256RuntimeError) as captured:
                    _observe_windows_test_compatibility(mpfr, gmp)
            self.assertEqual(captured.exception.code, "short_read")

        with tempfile.TemporaryDirectory() as temporary:
            mpfr, gmp = _materialize(Path(temporary))
            injected = False

            def growing_read(descriptor: int, size: int) -> bytes:
                nonlocal injected
                if size == 1 and not injected:
                    injected = True
                    return b"x"
                return real_read(descriptor, size)

            with mock.patch.object(runtime.os, "read", side_effect=growing_read):
                with self.assertRaises(Replay256RuntimeError) as captured:
                    _observe_windows_test_compatibility(mpfr, gmp)
            self.assertEqual(captured.exception.code, "file_grew_or_trailing_bytes")

        real_fstat = os.fstat
        with tempfile.TemporaryDirectory() as temporary:
            mpfr, gmp = _materialize(Path(temporary))
            regular_counts: dict[int, int] = {}

            def racing_fstat(descriptor: int) -> object:
                metadata = real_fstat(descriptor)
                if stat.S_ISREG(metadata.st_mode):
                    regular_counts[descriptor] = regular_counts.get(descriptor, 0) + 1
                    if regular_counts[descriptor] == 2:
                        return _stat_proxy(
                            metadata,
                            st_ctime_ns=metadata.st_ctime_ns + 1,
                        )
                return metadata

            with mock.patch.object(runtime.os, "fstat", side_effect=racing_fstat):
                with self.assertRaises(Replay256RuntimeError) as captured:
                    _observe_windows_test_compatibility(mpfr, gmp)
            self.assertEqual(captured.exception.code, "library_stat_read_stat_changed")

        with tempfile.TemporaryDirectory() as temporary:
            mpfr, gmp = _materialize(Path(temporary))
            real_snapshot = runtime._read_windows_test_snapshot
            call_count = 0

            def changed_reopen(*args: object, **kwargs: object):
                nonlocal call_count
                call_count += 1
                snapshot = real_snapshot(*args, **kwargs)
                if call_count == 3:
                    return replace(snapshot, inode=snapshot.inode + 1)
                return snapshot

            with mock.patch.object(
                runtime,
                "_read_windows_test_snapshot",
                side_effect=changed_reopen,
            ):
                with self.assertRaises(Replay256RuntimeError) as captured:
                    _observe_windows_test_compatibility(mpfr, gmp)
            self.assertEqual(captured.exception.code, "library_reopen_identity_changed")


if __name__ == "__main__":
    unittest.main()
