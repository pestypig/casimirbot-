"""Focused microfixtures for the sealed v3 raw-input readers."""

from __future__ import annotations

import ast
from dataclasses import FrozenInstanceError
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

_PRODUCER_MODULES_BEFORE_IMPORT = frozenset(
    name for name in sys.modules if name == "producer" or name.startswith("producer.")
)

import v3_inputs  # noqa: E402
from v3_inputs import (  # noqa: E402
    LINUX_OPENAT2_SECURITY_PROFILE,
    N32_INVENTORY,
    N32_TOTAL_BYTE_LENGTH,
    N32InputSpec,
    NONLINUX_TEST_COMPATIBILITY_SECURITY_PROFILE,
    R6_INVENTORY,
    R6_TOTAL_BYTE_LENGTH,
    R6InputSpec,
    V3InputError,
    r6_domain_sha256,
    read_n32_inputs,
    read_r6_inputs,
)


N32_PATHS = (
    "arrays/L0/00-rho_nodes.f64le",
    "arrays/L0/01-theta_nodes.f64le",
    "arrays/L0/02-base_scalar_u0.f64le",
    "arrays/L0/03-base_potential_V0.f64le",
    "arrays/L0/04-target_scalar_u_A.f64le",
    "arrays/L0/05-target_potential_V_A.f64le",
    "arrays/L0/06-multipole_scalar_odd.f64le",
    "arrays/L0/07-multipole_potential_even.f64le",
    "arrays/L1/00-rho_nodes.f64le",
    "arrays/L1/01-theta_nodes.f64le",
    "arrays/L1/02-base_scalar_u0.f64le",
    "arrays/L1/03-base_potential_V0.f64le",
    "arrays/L1/04-target_scalar_u_A.f64le",
    "arrays/L1/05-target_potential_V_A.f64le",
    "arrays/L1/06-multipole_scalar_odd.f64le",
    "arrays/L1/07-multipole_potential_even.f64le",
    "arrays/L2/00-rho_nodes.f64le",
    "arrays/L2/01-theta_nodes.f64le",
    "arrays/L2/02-base_scalar_u0.f64le",
    "arrays/L2/03-base_potential_V0.f64le",
    "arrays/L2/04-target_scalar_u_A.f64le",
    "arrays/L2/05-target_potential_V_A.f64le",
    "arrays/L2/06-multipole_scalar_odd.f64le",
    "arrays/L2/07-multipole_potential_even.f64le",
    "arrays/AUDIT/00-rho_nodes.f64le",
    "arrays/AUDIT/01-theta_nodes.f64le",
    "arrays/AUDIT/02-base_scalar_u0.f64le",
    "arrays/AUDIT/03-base_potential_V0.f64le",
    "arrays/AUDIT/04-target_scalar_u_A.f64le",
    "arrays/AUDIT/05-target_potential_V_A.f64le",
    "arrays/AUDIT/06-multipole_scalar_odd.f64le",
    "arrays/AUDIT/07-multipole_potential_even.f64le",
)
N32_SIZES = (
    512,
    256,
    16_384,
    16_384,
    114_688,
    114_688,
    8_192,
    8_192,
    768,
    384,
    36_864,
    36_864,
    258_048,
    258_048,
    18_432,
    18_432,
    1_024,
    512,
    65_536,
    65_536,
    458_752,
    458_752,
    32_768,
    32_768,
    2_048,
    1_024,
    262_144,
    262_144,
    1_835_008,
    1_835_008,
    131_072,
    131_072,
)
R6_PATHS = (
    "L0/00-raw-scalar-u.f64le",
    "L0/01-raw-potential-v.f64le",
    "L1/00-raw-scalar-u.f64le",
    "L1/01-raw-potential-v.f64le",
    "L2/00-raw-scalar-u.f64le",
    "L2/01-raw-potential-v.f64le",
)
R6_SIZES = (16_384, 16_384, 36_864, 36_864, 65_536, 65_536)


def _path(root: Path, relative_path: str) -> Path:
    return root / Path(*relative_path.split("/"))


def _pattern(index: int, length: int) -> bytes:
    block = bytes(((index * 41 + offset * 17) % 256 for offset in range(251)))
    repetitions, remainder = divmod(length, len(block))
    return block * repetitions + block[:remainder]


def _materialize(
    parent: Path,
    name: str,
    inventory: tuple[N32InputSpec, ...] | tuple[R6InputSpec, ...],
) -> Path:
    root = parent / name
    root.mkdir()
    for index, item in enumerate(inventory):
        destination = _path(root, item.relative_path)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(_pattern(index, item.byte_length))
    return root


def _plain_hashes(
    root: Path,
    inventory: tuple[N32InputSpec, ...] | tuple[R6InputSpec, ...],
) -> dict[str, str]:
    return {
        item.relative_path: hashlib.sha256(
            _path(root, item.relative_path).read_bytes()
        ).hexdigest()
        for item in inventory
    }


def _read_n32_for_current_host(
    root: Path,
    expected_plain_sha256: dict[str, str] | None = None,
) -> tuple[v3_inputs.N32Observation, ...]:
    return read_n32_inputs(
        root,
        expected_plain_sha256,
        test_only_allow_nonlinux_compatibility=not (
            sys.platform == "linux" and os.name == "posix"
        ),
    )


def _read_r6_for_current_host(
    root: Path,
    expected_plain_sha256: dict[str, str] | None = None,
) -> tuple[v3_inputs.R6Observation, ...]:
    return read_r6_inputs(
        root,
        expected_plain_sha256,
        test_only_allow_nonlinux_compatibility=not (
            sys.platform == "linux" and os.name == "posix"
        ),
    )


def _stat_proxy(metadata: os.stat_result, **changes: int) -> SimpleNamespace:
    fields = {
        "st_dev": metadata.st_dev,
        "st_ino": metadata.st_ino,
        "st_mode": metadata.st_mode,
        "st_nlink": metadata.st_nlink,
        "st_size": metadata.st_size,
        "st_mtime_ns": metadata.st_mtime_ns,
        "st_ctime_ns": metadata.st_ctime_ns,
    }
    fields.update(changes)
    return SimpleNamespace(**fields)


class _FakeScandir:
    def __init__(self, names: tuple[str, ...]) -> None:
        self._entries = tuple(
            SimpleNamespace(name=name, is_symlink=lambda: False) for name in names
        )

    def __enter__(self) -> object:
        return iter(self._entries)

    def __exit__(self, *unused: object) -> None:
        return None


class FrozenInventoryTests(unittest.TestCase):
    def test_exact_separate_orders_counts_sizes_and_totals(self) -> None:
        self.assertEqual(tuple(item.relative_path for item in N32_INVENTORY), N32_PATHS)
        self.assertEqual(tuple(item.byte_length for item in N32_INVENTORY), N32_SIZES)
        self.assertEqual(len(N32_INVENTORY), 32)
        self.assertEqual(N32_TOTAL_BYTE_LENGTH, 6_482_304)
        self.assertEqual(sum(N32_SIZES), 6_482_304)
        self.assertTrue(all(isinstance(item, N32InputSpec) for item in N32_INVENTORY))
        self.assertTrue(
            all(item.canonical_absolute_path.startswith("/run/staging/") for item in N32_INVENTORY)
        )

        self.assertEqual(tuple(item.relative_path for item in R6_INVENTORY), R6_PATHS)
        self.assertEqual(tuple(item.byte_length for item in R6_INVENTORY), R6_SIZES)
        self.assertEqual(len(R6_INVENTORY), 6)
        self.assertEqual(R6_TOTAL_BYTE_LENGTH, 237_568)
        self.assertEqual(sum(R6_SIZES), 237_568)
        self.assertTrue(all(isinstance(item, R6InputSpec) for item in R6_INVENTORY))
        self.assertTrue(
            all(
                item.canonical_absolute_path.startswith("/run/postprojection-evidence/")
                for item in R6_INVENTORY
            )
        )
        self.assertFalse(hasattr(v3_inputs, "COMBINED_INPUT_INVENTORY"))

    def test_source_has_no_float_decode_or_producer_import(self) -> None:
        source = Path(v3_inputs.__file__).read_text(encoding="utf-8")
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
            imported_roots.isdisjoint({"array", "math", "numpy", "producer", "struct"})
        )
        self.assertEqual(float_calls, 0)
        producer_modules_after = frozenset(
            name
            for name in sys.modules
            if name == "producer" or name.startswith("producer.")
        )
        self.assertEqual(producer_modules_after, _PRODUCER_MODULES_BEFORE_IMPORT)
        self.assertIn("os.O_PATH", source)
        self.assertIn("os.O_NONBLOCK", source)
        self.assertIn('f"/proc/self/fd/{probe_descriptor}"', source)

    def test_repeated_fd_scans_rewind_shared_directory_offset(self) -> None:
        state = {"rewound": False}

        def fake_lseek(descriptor: int, offset: int, whence: int) -> int:
            self.assertEqual((descriptor, offset, whence), (73, 0, os.SEEK_SET))
            state["rewound"] = True
            return 0

        def fake_scandir(descriptor: int) -> _FakeScandir:
            self.assertEqual(descriptor, 73)
            names = ("alpha", "beta") if state["rewound"] else ()
            state["rewound"] = False
            return _FakeScandir(names)

        with mock.patch.object(v3_inputs.os, "lseek", side_effect=fake_lseek) as seek:
            with mock.patch.object(v3_inputs.os, "scandir", side_effect=fake_scandir):
                v3_inputs._scan_fd_exact(73, ("alpha", "beta"), "/mock/root")
                v3_inputs._scan_fd_exact(73, ("alpha", "beta"), "/mock/root")
        self.assertEqual(seek.call_count, 2)

    def test_openat2_syscall_number_is_guarded_to_linux_x86_64_abi(self) -> None:
        with mock.patch.object(v3_inputs.sys, "platform", "linux"):
            with mock.patch.object(v3_inputs.os, "name", "posix"):
                with mock.patch.object(
                    v3_inputs.os,
                    "uname",
                    create=True,
                    return_value=SimpleNamespace(machine="aarch64"),
                ):
                    with mock.patch.object(v3_inputs.ctypes, "CDLL") as libc:
                        with self.assertRaises(V3InputError) as captured:
                            v3_inputs._open_beneath(
                                11,
                                "L0/00-raw-scalar-u.f64le",
                                directory=False,
                            )
        self.assertEqual(captured.exception.code, "linux_x86_64_abi_required")
        libc.assert_not_called()


class RawInputReadTests(unittest.TestCase):
    def test_nonlinux_default_rejection_explicit_opt_in_and_marker(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = _materialize(Path(temporary), "postprojection", R6_INVENTORY)
            with mock.patch.object(v3_inputs.sys, "platform", "test-nonlinux"):
                with self.assertRaises(V3InputError) as captured:
                    read_r6_inputs(root)
                self.assertEqual(
                    captured.exception.code,
                    "nonlinux_compatibility_requires_explicit_test_opt_in",
                )

                with self.assertRaises(V3InputError) as truthy_captured:
                    read_r6_inputs(
                        root,
                        test_only_allow_nonlinux_compatibility=1,  # type: ignore[arg-type]
                    )
                self.assertEqual(
                    truthy_captured.exception.code,
                    "invalid_nonlinux_test_compatibility_opt_in",
                )

                observations = read_r6_inputs(
                    root,
                    test_only_allow_nonlinux_compatibility=True,
                )

            self.assertEqual(len(observations), 6)
            self.assertEqual(
                {item.security_profile for item in observations},
                {NONLINUX_TEST_COMPATIBILITY_SECURITY_PROFILE},
            )
            self.assertIn("non_authoritative", observations[0].security_profile)
            with self.assertRaises(FrozenInstanceError):
                observations[0].security_profile = (  # type: ignore[misc]
                    LINUX_OPENAT2_SECURITY_PROFILE
                )

    def test_exact_bytes_metadata_and_hash_domains_are_retained(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            parent = Path(temporary)
            n32_root = _materialize(parent, "staging", N32_INVENTORY)
            r6_root = _materialize(parent, "postprojection", R6_INVENTORY)

            n32 = _read_n32_for_current_host(
                n32_root, _plain_hashes(n32_root, N32_INVENTORY)
            )
            r6 = _read_r6_for_current_host(
                r6_root, _plain_hashes(r6_root, R6_INVENTORY)
            )

            expected_security_profile = (
                LINUX_OPENAT2_SECURITY_PROFILE
                if sys.platform == "linux" and os.name == "posix"
                else NONLINUX_TEST_COMPATIBILITY_SECURITY_PROFILE
            )

            self.assertEqual(tuple(item.relative_path for item in n32), N32_PATHS)
            self.assertEqual(tuple(item.relative_path for item in r6), R6_PATHS)
            for index, item in enumerate(n32):
                self.assertIs(type(item.raw_bytes), bytes)
                self.assertEqual(item.raw_bytes, _pattern(index, item.byte_length))
                self.assertEqual(item.plain_sha256, hashlib.sha256(item.raw_bytes).hexdigest())
                self.assertEqual(item.mode_file_type, stat.S_IFREG)
                self.assertEqual(item.link_count, 1)
                self.assertEqual(item.security_profile, expected_security_profile)
            for index, (spec, item) in enumerate(zip(R6_INVENTORY, r6, strict=True)):
                self.assertIs(type(item.raw_bytes), bytes)
                self.assertEqual(item.raw_bytes, _pattern(index, item.byte_length))
                self.assertEqual(item.plain_sha256, hashlib.sha256(item.raw_bytes).hexdigest())
                self.assertEqual(item.domain_sha256, r6_domain_sha256(spec, item.raw_bytes))
                self.assertNotEqual(item.domain_sha256, item.plain_sha256)
                self.assertEqual(item.mode_file_type, stat.S_IFREG)
                self.assertEqual(item.link_count, 1)
                self.assertEqual(item.security_profile, expected_security_profile)
            with self.assertRaises(TypeError):
                r6[0].raw_bytes[0] = 1  # type: ignore[index]
            with self.assertRaises(FrozenInstanceError):
                r6[0].plain_sha256 = "0" * 64  # type: ignore[misc]

    def test_bad_expected_plain_hash_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = _materialize(Path(temporary), "postprojection", R6_INVENTORY)
            expected = _plain_hashes(root, R6_INVENTORY)
            expected[R6_PATHS[0]] = "0" * 64
            with self.assertRaises(V3InputError) as captured:
                _read_r6_for_current_host(root, expected)
            self.assertEqual(captured.exception.code, "plain_sha256_mismatch")

    def test_extra_and_missing_entries_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = _materialize(Path(temporary), "postprojection", R6_INVENTORY)
            (root / "extra.bin").write_bytes(b"extra")
            with self.assertRaises(V3InputError) as captured:
                _read_r6_for_current_host(root)
            self.assertEqual(captured.exception.code, "closed_inventory_mismatch")

        with tempfile.TemporaryDirectory() as temporary:
            root = _materialize(Path(temporary), "postprojection", R6_INVENTORY)
            _path(root, R6_PATHS[-1]).unlink()
            with self.assertRaises(V3InputError) as captured:
                _read_r6_for_current_host(root)
            self.assertEqual(captured.exception.code, "closed_inventory_mismatch")

    def test_symlink_and_hardlink_are_rejected_when_host_permits(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            parent = Path(temporary)
            root = _materialize(parent, "postprojection", R6_INVENTORY)
            target = _path(root, R6_PATHS[0])
            outside = parent / "outside.bin"
            outside.write_bytes(target.read_bytes())
            target.unlink()
            try:
                target.symlink_to(outside)
            except OSError:
                target.write_bytes(_pattern(0, R6_INVENTORY[0].byte_length))
                real_lstat = os.lstat

                def mocked_root_symlink(path: object) -> object:
                    metadata = real_lstat(path)
                    if Path(path) == root:
                        return _stat_proxy(
                            metadata,
                            st_mode=stat.S_IFLNK | stat.S_IMODE(metadata.st_mode),
                        )
                    return metadata

                with mock.patch.object(v3_inputs.os, "lstat", side_effect=mocked_root_symlink):
                    with self.assertRaises(V3InputError) as captured:
                        _read_r6_for_current_host(root)
            else:
                with self.assertRaises(V3InputError) as captured:
                    _read_r6_for_current_host(root)
            self.assertIn(
                captured.exception.code,
                {"ordinary_directory_required", "symlink_forbidden"},
            )

        with tempfile.TemporaryDirectory() as temporary:
            root = _materialize(Path(temporary), "postprojection", R6_INVENTORY)
            first = _path(root, R6_PATHS[0])
            second = _path(root, R6_PATHS[1])
            second.unlink()
            hardlink_created = True
            try:
                os.link(first, second)
            except OSError:
                hardlink_created = False
                second.write_bytes(_pattern(1, R6_INVENTORY[1].byte_length))
            if hardlink_created:
                with self.assertRaises(V3InputError) as captured:
                    _read_r6_for_current_host(root)
                self.assertEqual(captured.exception.code, "single_link_required")

    def test_short_growth_and_stat_race_are_rejected_via_microfixtures(self) -> None:
        real_read = os.read
        with tempfile.TemporaryDirectory() as temporary:
            root = _materialize(Path(temporary), "postprojection", R6_INVENTORY)
            injected = False

            def short_read(descriptor: int, size: int) -> bytes:
                nonlocal injected
                if not injected and size > 1:
                    injected = True
                    return b""
                return real_read(descriptor, size)

            with mock.patch.object(v3_inputs.os, "read", side_effect=short_read):
                with self.assertRaises(V3InputError) as captured:
                    _read_r6_for_current_host(root)
            self.assertEqual(captured.exception.code, "short_read")

        with tempfile.TemporaryDirectory() as temporary:
            root = _materialize(Path(temporary), "postprojection", R6_INVENTORY)
            injected = False

            def growing_read(descriptor: int, size: int) -> bytes:
                nonlocal injected
                if size == 1 and not injected:
                    injected = True
                    return b"x"
                return real_read(descriptor, size)

            with mock.patch.object(v3_inputs.os, "read", side_effect=growing_read):
                with self.assertRaises(V3InputError) as captured:
                    _read_r6_for_current_host(root)
            self.assertEqual(captured.exception.code, "file_grew_or_trailing_bytes")

        real_fstat = os.fstat
        with tempfile.TemporaryDirectory() as temporary:
            root = _materialize(Path(temporary), "postprojection", R6_INVENTORY)
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

            with mock.patch.object(v3_inputs.os, "fstat", side_effect=racing_fstat):
                with self.assertRaises(V3InputError) as captured:
                    _read_r6_for_current_host(root)
            self.assertEqual(captured.exception.code, "file_stat_read_stat_changed")

    def test_absolute_root_exact_size_and_xdev_guards(self) -> None:
        with self.assertRaises(V3InputError) as captured:
            _read_r6_for_current_host(Path("relative-root"))
        self.assertEqual(captured.exception.code, "absolute_root_required")

        with tempfile.TemporaryDirectory() as temporary:
            root = _materialize(Path(temporary), "postprojection", R6_INVENTORY)
            _path(root, R6_PATHS[0]).write_bytes(b"short")
            with self.assertRaises(V3InputError) as captured:
                _read_r6_for_current_host(root)
            self.assertEqual(captured.exception.code, "exact_size_required")

        with tempfile.TemporaryDirectory() as temporary:
            root = _materialize(Path(temporary), "postprojection", R6_INVENTORY)
            first = _path(root, R6_PATHS[0])
            metadata = os.lstat(first)
            wrong_device = _stat_proxy(metadata, st_dev=metadata.st_dev + 1)
            with self.assertRaises(V3InputError) as captured:
                v3_inputs._validate_file_metadata(
                    wrong_device,
                    R6_INVENTORY[0].byte_length,
                    metadata.st_dev,
                    os.fspath(first),
                )
            self.assertEqual(captured.exception.code, "xdev_forbidden")


if __name__ == "__main__":
    unittest.main()
