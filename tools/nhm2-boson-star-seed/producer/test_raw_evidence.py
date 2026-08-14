"""Focused tests for the raw preprojection evidence writer."""

from __future__ import annotations

import os
from pathlib import Path
import stat
import sys
import tempfile
import unittest
from unittest import mock

import numpy as np


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import raw_evidence  # noqa: E402
from raw_evidence import (  # noqa: E402
    FrozenRawLevelEvidence,
    RAW_EVIDENCE_INVENTORY,
    RAW_EVIDENCE_RELATIVE_PATHS,
    RAW_EVIDENCE_TOTAL_BYTE_LENGTH,
    RAW_EVIDENCE_TOTAL_ELEMENT_COUNT,
    freeze_raw_level_evidence,
    prepare_and_write_raw_evidence,
    prepare_frozen_raw_evidence,
    prepare_raw_evidence,
    write_raw_evidence_exclusive,
)


LEVEL_SHAPES = {
    "L0": (64, 32),
    "L1": (96, 48),
    "L2": (128, 64),
}

_LINUX_PRODUCTION_PLATFORM = os.name == "posix" and sys.platform.startswith("linux")


def _write_for_focused_test(
    root: Path,
    payloads: tuple[tuple[str, bytes], ...] | list[tuple[str, bytes]],
) -> None:
    write_raw_evidence_exclusive(
        root,
        payloads,
        test_only_allow_nonlinux_compatibility=not _LINUX_PRODUCTION_PLATFORM,
    )


def _valid_level_arrays() -> dict[str, tuple[np.ndarray, np.ndarray]]:
    result: dict[str, tuple[np.ndarray, np.ndarray]] = {}
    for level_index, (level_id, shape) in enumerate(LEVEL_SHAPES.items()):
        count = shape[0] * shape[1]
        scalar = (
            np.arange(count, dtype=np.float64).reshape(shape) + level_index
        ) / 1024.0
        potential = -(
            np.arange(count, dtype=np.float64).reshape(shape) + level_index + 1
        ) / 2048.0
        result[level_id] = (scalar, potential)
    return result


def _precreated_root(parent: Path) -> Path:
    root = parent / "postprojection-evidence"
    root.mkdir()
    for level_id in LEVEL_SHAPES:
        (root / level_id).mkdir()
    return root


def _all_leaf_entries(root: Path) -> tuple[str, ...]:
    return tuple(
        sorted(
            path.relative_to(root).as_posix()
            for level_id in LEVEL_SHAPES
            for path in (root / level_id).iterdir()
        )
    )


class RawEvidencePreparationTests(unittest.TestCase):
    def test_inventory_order_sizes_and_total(self) -> None:
        payloads = prepare_raw_evidence(_valid_level_arrays())
        self.assertEqual(len(RAW_EVIDENCE_INVENTORY), 6)
        self.assertEqual(
            RAW_EVIDENCE_RELATIVE_PATHS,
            (
                "L0/00-raw-scalar-u.f64le",
                "L0/01-raw-potential-v.f64le",
                "L1/00-raw-scalar-u.f64le",
                "L1/01-raw-potential-v.f64le",
                "L2/00-raw-scalar-u.f64le",
                "L2/01-raw-potential-v.f64le",
            ),
        )
        self.assertEqual(tuple(path for path, _ in payloads), RAW_EVIDENCE_RELATIVE_PATHS)
        self.assertEqual(
            tuple(len(raw) for _, raw in payloads),
            (16_384, 16_384, 36_864, 36_864, 65_536, 65_536),
        )
        self.assertEqual(RAW_EVIDENCE_TOTAL_ELEMENT_COUNT, 29_696)
        self.assertEqual(RAW_EVIDENCE_TOTAL_BYTE_LENGTH, 237_568)
        self.assertEqual(sum(len(raw) for _, raw in payloads), 237_568)

    def test_finite_bit_patterns_are_preserved_without_canonicalization(self) -> None:
        arrays = _valid_level_arrays()
        scalar = arrays["L0"][0]
        bits = scalar.view(np.uint64).reshape(-1)
        expected_bits = np.asarray(
            [
                0x0000000000000000,
                0x0000000000000001,
                0x0010000000000001,
                0x3FF0000000000001,
                0x7FEFFFFFFFFFFFFF,
            ],
            dtype=np.uint64,
        )
        bits[: expected_bits.size] = expected_bits
        before = bits[: expected_bits.size].copy()

        payloads = prepare_raw_evidence(arrays)
        raw = payloads[0][1]
        expected_raw = expected_bits.astype("<u8", copy=False).tobytes()
        self.assertEqual(raw[: len(expected_raw)], expected_raw)
        np.testing.assert_array_equal(bits[: expected_bits.size], before)

        big_endian = arrays["L1"][1].astype(">f8")
        arrays["L1"] = (arrays["L1"][0], big_endian)
        payloads = prepare_raw_evidence(arrays)
        self.assertEqual(
            payloads[3][1],
            np.asarray(big_endian, dtype="<f8", order="C").tobytes(order="C"),
        )

    def test_bad_shape_dtype_and_noncontiguous_are_rejected(self) -> None:
        cases: list[tuple[str, np.ndarray]] = [
            ("shape", np.zeros((63, 32), dtype=np.float64)),
            ("float32", np.zeros((64, 32), dtype=np.float32)),
            ("integer", np.zeros((64, 32), dtype=np.int64)),
            (
                "noncontiguous",
                np.zeros((32, 64), dtype=np.float64).T,
            ),
        ]
        for label, invalid in cases:
            with self.subTest(label=label):
                arrays = _valid_level_arrays()
                arrays["L0"] = (invalid, arrays["L0"][1])
                with self.assertRaises((TypeError, ValueError)):
                    prepare_raw_evidence(arrays)

    def test_nan_infinity_and_negative_zero_are_rejected(self) -> None:
        invalid_values = (np.nan, np.inf, -np.inf, np.float64(-0.0))
        for invalid in invalid_values:
            with self.subTest(value=repr(invalid)):
                arrays = _valid_level_arrays()
                arrays["L2"][1][0, 0] = invalid
                with self.assertRaises(ValueError):
                    prepare_raw_evidence(arrays)

    def test_ndarray_subclasses_cannot_mask_invalid_payload_bits(self) -> None:
        for invalid in (np.nan, np.float64(-0.0)):
            with self.subTest(value=repr(invalid)):
                arrays = _valid_level_arrays()
                underlying = arrays["L0"][0].copy()
                underlying[0, 0] = invalid
                masked = np.ma.MaskedArray(
                    underlying,
                    mask=np.zeros(underlying.shape, dtype=bool),
                )
                masked.mask[0, 0] = True
                arrays["L0"] = (masked, arrays["L0"][1])
                with self.assertRaises(TypeError):
                    prepare_raw_evidence(arrays)

    def test_level_capture_is_immutable_and_reassembles_without_reserialization(self) -> None:
        arrays = _valid_level_arrays()
        captured = tuple(
            freeze_raw_level_evidence(level_id, scalar, potential)
            for level_id, (scalar, potential) in arrays.items()
        )
        expected = prepare_raw_evidence(arrays)

        for scalar, potential in arrays.values():
            scalar.fill(17.0)
            potential.fill(-19.0)

        self.assertEqual(prepare_frozen_raw_evidence(captured), expected)
        self.assertTrue(
            all(
                type(level.scalar_f64le) is bytes
                and type(level.potential_f64le) is bytes
                for level in captured
            )
        )

    def test_frozen_assembly_rejects_stateful_mappings_and_wrong_order(self) -> None:
        arrays = _valid_level_arrays()
        captured = tuple(
            freeze_raw_level_evidence(level_id, scalar, potential)
            for level_id, (scalar, potential) in arrays.items()
        )
        with self.assertRaises(TypeError):
            prepare_frozen_raw_evidence(  # type: ignore[arg-type]
                {level.level_id: level for level in captured}
            )
        with self.assertRaisesRegex(ValueError, "exactly L0,L1,L2"):
            prepare_frozen_raw_evidence((captured[1], captured[0], captured[2]))

    def test_frozen_level_rejects_hostile_or_invalid_byte_leaves(self) -> None:
        arrays = _valid_level_arrays()
        captured = freeze_raw_level_evidence("L0", *arrays["L0"])
        bad = bytearray(captured.scalar_f64le)
        bad[:8] = np.uint64(0x8000000000000000).astype("<u8").tobytes()
        with self.assertRaisesRegex(ValueError, "negative zero"):
            FrozenRawLevelEvidence(
                level_id="L0",
                scalar_f64le=bytes(bad),
                potential_f64le=captured.potential_f64le,
            )
        with self.assertRaises(TypeError):
            FrozenRawLevelEvidence(
                level_id="L0",
                scalar_f64le=bytearray(captured.scalar_f64le),  # type: ignore[arg-type]
                potential_f64le=captured.potential_f64le,
            )
        with self.assertRaisesRegex(TypeError, "exact string"):
            FrozenRawLevelEvidence(
                level_id=mock.Mock(),  # type: ignore[arg-type]
                scalar_f64le=captured.scalar_f64le,
                potential_f64le=captured.potential_f64le,
            )


class RawEvidenceWriterTests(unittest.TestCase):
    def test_writer_rejects_comparison_spoofing_path_before_filesystem_use(self) -> None:
        class SpoofPath:
            def __eq__(self, _other: object) -> bool:
                return True

            def rsplit(self, _separator: str, _count: int) -> list[str]:
                raise AssertionError("hostile path method must never be invoked")

        payloads = list(prepare_raw_evidence(_valid_level_arrays()))
        payloads[0] = (SpoofPath(), payloads[0][1])  # type: ignore[list-item]
        with tempfile.TemporaryDirectory() as temporary:
            root = _precreated_root(Path(temporary))
            with self.assertRaisesRegex(TypeError, "exact string"):
                _write_for_focused_test(root, tuple(payloads))  # type: ignore[arg-type]
            self.assertEqual(_all_leaf_entries(root), ())

    @unittest.skipIf(
        _LINUX_PRODUCTION_PLATFORM,
        "Linux uses the production held-dirfd writer",
    )
    def test_nonlinux_compatibility_requires_explicit_test_opt_in(self) -> None:
        payloads = prepare_raw_evidence(_valid_level_arrays())
        with tempfile.TemporaryDirectory() as temporary:
            root = _precreated_root(Path(temporary))
            with self.assertRaisesRegex(RuntimeError, "test-only"):
                write_raw_evidence_exclusive(root, payloads)
            self.assertEqual(_all_leaf_entries(root), ())

            _write_for_focused_test(root, payloads)
            self.assertEqual(_all_leaf_entries(root), RAW_EVIDENCE_RELATIVE_PATHS)

    def test_cross_device_level_directory_is_rejected(self) -> None:
        root_metadata = mock.Mock(st_dev=11)
        level_metadata = mock.Mock(st_dev=12)
        with self.assertRaisesRegex(RuntimeError, "cross-device"):
            raw_evidence._require_same_device(
                root_metadata,
                level_metadata,
                "L0",
            )

    def test_successful_write_has_exact_paths_and_bytes(self) -> None:
        arrays = _valid_level_arrays()
        payloads = prepare_raw_evidence(arrays)
        with tempfile.TemporaryDirectory() as temporary:
            root = _precreated_root(Path(temporary))
            _write_for_focused_test(root, payloads)
            self.assertEqual(_all_leaf_entries(root), RAW_EVIDENCE_RELATIVE_PATHS)
            for relative_path, raw in payloads:
                self.assertEqual((root / relative_path).read_bytes(), raw)

    def test_existing_file_and_extra_entries_are_rejected(self) -> None:
        payloads = prepare_raw_evidence(_valid_level_arrays())
        with tempfile.TemporaryDirectory() as temporary:
            root = _precreated_root(Path(temporary))
            existing = root / RAW_EVIDENCE_RELATIVE_PATHS[0]
            existing.write_bytes(b"occupied")
            with self.assertRaises(RuntimeError):
                _write_for_focused_test(root, tuple(payloads))
            self.assertEqual(_all_leaf_entries(root), (RAW_EVIDENCE_RELATIVE_PATHS[0],))
            self.assertEqual(existing.read_bytes(), b"occupied")

        with tempfile.TemporaryDirectory() as temporary:
            root = _precreated_root(Path(temporary))
            (root / "unexpected").mkdir()
            with self.assertRaises(RuntimeError):
                _write_for_focused_test(root, payloads)
            self.assertEqual(_all_leaf_entries(root), ())

        with tempfile.TemporaryDirectory() as temporary:
            root = _precreated_root(Path(temporary))
            (root / "L1" / "unexpected.bin").write_bytes(b"extra")
            with self.assertRaises(RuntimeError):
                _write_for_focused_test(root, payloads)
            self.assertEqual(_all_leaf_entries(root), ("L1/unexpected.bin",))

    def test_symlink_root_level_or_file_is_rejected(self) -> None:
        payloads = prepare_raw_evidence(_valid_level_arrays())
        with tempfile.TemporaryDirectory() as temporary:
            parent = Path(temporary)
            real_root = _precreated_root(parent)
            root_link = parent / "root-link"
            try:
                root_link.symlink_to(real_root, target_is_directory=True)
            except OSError:
                # Windows without Developer Mode cannot create a symlink as an
                # unprivileged test process. Exercise the same lstat rejection
                # deterministically without weakening the production branch.
                symlink_metadata = mock.Mock(st_mode=stat.S_IFLNK | 0o777)
                with mock.patch.object(
                    raw_evidence.os,
                    "lstat",
                    return_value=symlink_metadata,
                ):
                    with self.assertRaises(RuntimeError):
                        _write_for_focused_test(real_root, payloads)
                self.assertEqual(_all_leaf_entries(real_root), ())
                return
            else:
                with self.assertRaises(RuntimeError):
                    _write_for_focused_test(root_link, payloads)
            self.assertEqual(_all_leaf_entries(real_root), ())

        with tempfile.TemporaryDirectory() as temporary:
            parent = Path(temporary)
            root = parent / "postprojection-evidence"
            root.mkdir()
            outside = parent / "outside"
            outside.mkdir()
            (root / "L0").symlink_to(outside, target_is_directory=True)
            (root / "L1").mkdir()
            (root / "L2").mkdir()
            with self.assertRaises(RuntimeError):
                _write_for_focused_test(root, payloads)
            self.assertEqual(tuple(outside.iterdir()), ())

        with tempfile.TemporaryDirectory() as temporary:
            parent = Path(temporary)
            root = _precreated_root(parent)
            outside = parent / "outside.bin"
            outside.write_bytes(b"outside")
            (root / "L2" / "link.bin").symlink_to(outside)
            with self.assertRaises(RuntimeError):
                _write_for_focused_test(root, payloads)
            self.assertEqual(_all_leaf_entries(root), ("L2/link.bin",))
            self.assertEqual(outside.read_bytes(), b"outside")

    def test_all_six_are_prevalidated_before_first_write(self) -> None:
        arrays = _valid_level_arrays()
        arrays["L2"][1][-1, -1] = np.float64(-0.0)
        with tempfile.TemporaryDirectory() as temporary:
            root = _precreated_root(Path(temporary))
            with self.assertRaises(ValueError):
                prepare_and_write_raw_evidence(
                    root,
                    arrays,
                    test_only_allow_nonlinux_compatibility=(
                        not _LINUX_PRODUCTION_PLATFORM
                    ),
                )
            self.assertEqual(_all_leaf_entries(root), ())

        payloads = list(prepare_raw_evidence(_valid_level_arrays()))
        payloads[-1] = (payloads[-1][0], payloads[-1][1][:-8])
        with tempfile.TemporaryDirectory() as temporary:
            root = _precreated_root(Path(temporary))
            with self.assertRaises(ValueError):
                _write_for_focused_test(root, tuple(payloads))
            self.assertEqual(_all_leaf_entries(root), ())

        for hostile_bits in (0x8000000000000000, 0x7FF8000000000000):
            with self.subTest(hostile_bits=hex(hostile_bits)):
                payloads = list(prepare_raw_evidence(_valid_level_arrays()))
                hostile = bytearray(payloads[-1][1])
                hostile[:8] = np.uint64(hostile_bits).astype("<u8").tobytes()
                payloads[-1] = (payloads[-1][0], bytes(hostile))
                with tempfile.TemporaryDirectory() as temporary:
                    root = _precreated_root(Path(temporary))
                    with self.assertRaises(ValueError):
                        _write_for_focused_test(root, tuple(payloads))
                    self.assertEqual(_all_leaf_entries(root), ())

    def test_writer_rejects_unbounded_iterables_without_iteration(self) -> None:
        reads = 0

        def unbounded() -> object:
            nonlocal reads
            while True:
                reads += 1
                yield ("untrusted", b"")

        with tempfile.TemporaryDirectory() as temporary:
            root = _precreated_root(Path(temporary))
            with self.assertRaisesRegex(TypeError, "exact tuple"):
                _write_for_focused_test(root, unbounded())  # type: ignore[arg-type]
            self.assertEqual(reads, 0)
            self.assertEqual(_all_leaf_entries(root), ())


if __name__ == "__main__":
    unittest.main()
