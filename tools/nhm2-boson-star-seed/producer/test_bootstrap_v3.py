"""Focused source tests for the sealed v3 producer bootstrap boundary."""

from __future__ import annotations

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

import bootstrap  # noqa: E402
import contract  # noqa: E402


class ProducerV3BootstrapTests(unittest.TestCase):
    def test_exact_argv_matches_the_sealed_v3_invocation(self) -> None:
        self.assertEqual(
            contract.EXACT_ARGV[6:],
            (
                "/opt/nhm2-producer/source/producer/bootstrap.py",
                "--input-manifest",
                "/run/input/00-seed-run-request.v1.json",
                "--numeric-materialization-policy",
                "/run/input/08-numeric-materialization-policy-v1.canonical.json",
                "--postprojection-policy",
                "/run/input/09-postprojection-policy-v1.canonical.json",
                "--output-root",
                "/run/staging",
                "--postprojection-evidence-root",
                "/run/postprojection-evidence",
            ),
        )
        self.assertEqual(bootstrap._EXPECTED_SCRIPT_ARGV, contract.EXACT_ARGV[6:])
        self.assertEqual(
            contract.NUMERIC_MATERIALIZATION_POLICY_CANONICAL_SIZE_BYTES,
            243_240,
        )
        self.assertEqual(
            contract.NUMERIC_MATERIALIZATION_POLICY_CANONICAL_PLAIN_SHA256,
            "3ab28f4e777e201a0b6dac73cf637af901d28f2b86db590d18aced5d89e75b40",
        )
        self.assertEqual(
            contract.POSTPROJECTION_POLICY_CANONICAL_SIZE_BYTES,
            220_450,
        )
        self.assertEqual(
            contract.POSTPROJECTION_POLICY_CANONICAL_PLAIN_SHA256,
            "e5cc63fe4f22831ab18bc33ec8f608ea23cbe934cf2160f5be47f9bb2680d2c1",
        )
        self.assertEqual(
            contract.AUTHORITATIVE_BINDINGS["runPlanBinding"],
            {
                "artifactId": "nhm2.prolate_boson_star_newtonian_seed_run_plan",
                "contractVersion": (
                    "nhm2_prolate_boson_star_newtonian_seed_run_plan/v3"
                ),
                "sha256Domain": (
                    "nhm2-prolate-boson-star-newtonian-seed-run-plan/v3\n"
                ),
                "sha256": (
                    "ac223c9b79b621b39d25fe9807492e030da916d8f2c6453a30b612de4ae6562c"
                ),
                "canonicalSizeBytes": 54_136,
            },
        )

    def test_exact_input_reader_rejects_size_hash_and_postread_drift(self) -> None:
        raw = b'{"sealed":"policy"}'
        digest = hashlib.sha256(raw).hexdigest()
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "policy.json"
            path.write_bytes(raw)
            self.assertEqual(
                bootstrap._read_exact_input_file(
                    str(path),
                    expected_size=len(raw),
                    expected_sha256=digest,
                    label="fixture policy",
                ),
                raw,
            )
            with self.assertRaisesRegex(RuntimeError, "byte length"):
                bootstrap._read_exact_input_file(
                    str(path),
                    expected_size=len(raw) + 1,
                    expected_sha256=digest,
                    label="fixture policy",
                )
            with self.assertRaisesRegex(RuntimeError, "SHA-256"):
                bootstrap._read_exact_input_file(
                    str(path),
                    expected_size=len(raw),
                    expected_sha256="0" * 64,
                    label="fixture policy",
                )

    def test_raw_write_scope_is_exact_order_bounded_and_fail_closed(self) -> None:
        staging = {"/run/staging/arrays/L0/00-rho_nodes.f64le"}
        scope = bootstrap._RawWriteAuditScope(staging)
        required = (
            os.O_WRONLY
            | os.O_CREAT
            | os.O_EXCL
            | getattr(os, "O_CLOEXEC", 0)
            | getattr(os, "O_NOFOLLOW", 0)
        )

        scope.guard("open", (next(iter(staging)), None, required))
        with self.assertRaises(PermissionError):
            scope.guard("open", ("00-raw-scalar-u.f64le", None, required))

        directory_metadata = {
            "L0": mock.Mock(st_dev=11, st_ino=101, st_mode=0o040700),
            "L1": mock.Mock(st_dev=11, st_ino=102, st_mode=0o040700),
            "L2": mock.Mock(st_dev=11, st_ino=103, st_mode=0o040700),
        }
        descriptor_levels = {71: "L0", 72: "L1", 73: "L2"}

        def fstat(descriptor: int) -> object:
            return directory_metadata[descriptor_levels[descriptor]]

        def lstat(path: str) -> object:
            return directory_metadata[path.rsplit("/", 1)[1]]

        scope.begin_raw_writes()
        with self.assertRaises(PermissionError):
            scope.guard("open", ("01-raw-potential-v.f64le", None, required))
        with (
            mock.patch.object(bootstrap.os, "fstat", side_effect=fstat),
            mock.patch.object(bootstrap.os, "lstat", side_effect=lstat),
        ):
            for level_id, basename in bootstrap._RAW_EVIDENCE_WRITE_ORDER:
                descriptor = next(
                    value
                    for value, level in descriptor_levels.items()
                    if level == level_id
                )
                scope.guard(
                    "open",
                    (f"/proc/self/fd/{descriptor}/{basename}", None, required),
                )
        scope.finish_raw_writes()

        with self.assertRaises(PermissionError):
            scope.guard(
                "open",
                ("/proc/self/fd/71/00-raw-scalar-u.f64le", None, required),
            )
        scope.begin_raw_writes()
        with (
            mock.patch.object(bootstrap.os, "fstat", side_effect=fstat),
            mock.patch.object(bootstrap.os, "lstat", side_effect=lstat),
        ):
            scope.guard(
                "open",
                ("/proc/self/fd/71/00-raw-scalar-u.f64le", None, required),
            )
        with self.assertRaisesRegex(RuntimeError, "opened only 1"):
            scope.finish_raw_writes()
        with self.assertRaises(PermissionError):
            scope.guard(
                "open",
                ("/proc/self/fd/71/01-raw-potential-v.f64le", None, required),
            )

    def test_raw_write_scope_rejects_wrong_level_directory_identity(self) -> None:
        scope = bootstrap._RawWriteAuditScope(set())
        required = (
            os.O_WRONLY
            | os.O_CREAT
            | os.O_EXCL
            | getattr(os, "O_CLOEXEC", 0)
            | getattr(os, "O_NOFOLLOW", 0)
        )
        scope.begin_raw_writes()
        opened = mock.Mock(st_dev=11, st_ino=999, st_mode=0o040700)
        expected = mock.Mock(st_dev=11, st_ino=101, st_mode=0o040700)
        with (
            mock.patch.object(bootstrap.os, "fstat", return_value=opened),
            mock.patch.object(bootstrap.os, "lstat", return_value=expected),
            self.assertRaisesRegex(PermissionError, "identity mismatch"),
        ):
            scope.guard(
                "open",
                ("/proc/self/fd/71/00-raw-scalar-u.f64le", None, required),
            )
        scope.abort_raw_writes()


if __name__ == "__main__":
    unittest.main()
