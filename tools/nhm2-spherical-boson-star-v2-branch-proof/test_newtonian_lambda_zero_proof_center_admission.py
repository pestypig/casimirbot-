"""Focused tests for independent lambda-zero proof-center admission.

Program gate: G2 — classical branch proof and terminal state
Workstream: lambda-zero limiting-ground-state proof closure
Capability or component: independent proof-center byte admission
Current maturity: frozen replay implementation; output not materialized
Target maturity: audited implementation before one exclusive receipt write
Required frozen inputs: exact global-center and projection artifacts
Required evidence: hash, codec, replay, hostile, and authority checks
Stop/fail criteria: first binding, reconstruction, or static-boundary failure
Explicit non-goals: directed proof, candidate, lamp, or authority
Downstream gate unlocked: one fixed admission receipt materialization
"""

from __future__ import annotations

from fractions import Fraction
import hashlib
import importlib.util
import inspect
import json
import math
from pathlib import Path
import struct
import tempfile
import unittest
from unittest import mock


HERE = Path(__file__).resolve().parent
SOURCE = HERE / "newtonian_lambda_zero_proof_center_admission.py"


def _load() -> object:
    spec = importlib.util.spec_from_file_location(
        "_nhm2_lambda_zero_proof_center_admission_test", SOURCE
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


M = _load()


class ProofCenterAdmissionTests(unittest.TestCase):
    def test_public_surface_is_zero_argument_and_authority_neutral(self) -> None:
        self.assertEqual(
            M.__all__,
            [
                "ADMISSION_VERSION",
                "AUTHORITY_LOCKS",
                "ProofCenterAdmissionError",
                "materialize_proof_center_admission",
            ],
        )
        self.assertEqual(
            tuple(
                inspect.signature(
                    M.materialize_proof_center_admission
                ).parameters
            ),
            (),
        )
        self.assertFalse(any(M.AUTHORITY_LOCKS.values()))

    def test_all_frozen_raw_bindings_match(self) -> None:
        for path, size, expected in (
            (
                M.GLOBAL_CENTER_PATH,
                M.GLOBAL_CENTER_SIZE_BYTES,
                M.GLOBAL_CENTER_RAW_SHA256,
            ),
            (
                M.PROJECTION_ROOT / "receipt.json",
                M.PROJECTION_RECEIPT_SIZE_BYTES,
                M.PROJECTION_RECEIPT_RAW_SHA256,
            ),
            (
                M.PROJECTION_SOURCE_PATH,
                M.PROJECTION_SOURCE_SIZE_BYTES,
                M.PROJECTION_SOURCE_RAW_SHA256,
            ),
            (M.PROPOSAL_PATH, M.PROPOSAL_SIZE_BYTES, M.PROPOSAL_RAW_SHA256),
        ):
            raw = path.read_bytes()
            self.assertEqual(len(raw), size)
            self.assertEqual(hashlib.sha256(raw).hexdigest(), expected)

    def test_both_input_receipt_self_hashes_recompute(self) -> None:
        for path, expected, domain in (
            (
                M.GLOBAL_CENTER_PATH,
                M.GLOBAL_CENTER_RECEIPT_SHA256,
                M.GLOBAL_CENTER_RECEIPT_DOMAIN,
            ),
            (
                M.PROJECTION_ROOT / "receipt.json",
                M.PROJECTION_RECEIPT_SHA256,
                M.PROJECTION_RECEIPT_DOMAIN,
            ),
        ):
            raw = path.read_bytes()
            value = json.loads(raw)
            self.assertEqual(value.pop("receiptSha256"), expected)
            self.assertEqual(M._length_delimited_hash(domain, value), expected)

    def test_payload_inventory_hashes_and_positive_zero_tail(self) -> None:
        observed = []
        for ordinal, (role, size, expected) in enumerate(M.PAYLOAD_ORDER):
            raw = (M.PROJECTION_ROOT / role).read_bytes()
            observed.append((ordinal, role, len(raw), hashlib.sha256(raw).hexdigest()))
            self.assertEqual(len(raw), size)
            self.assertEqual(hashlib.sha256(raw).hexdigest(), expected)
        self.assertEqual(len(observed), 5)
        for role in (
            "coefficients/tail_H.f64le",
            "coefficients/tail_Q.f64le",
        ):
            self.assertEqual((M.PROJECTION_ROOT / role).read_bytes(), bytes(256))

    def test_origin_recurrence_satisfies_exact_rows(self) -> None:
        vc = -1.25
        nu = -0.625
        nu_exact = Fraction.from_float(nu)
        a, b = M._origin_coefficients(vc, nu)
        for shell in range(M.ORIGIN_MAXIMUM_INDEX):
            denominator = (2 * shell + 2) * (2 * shell + 3)
            ba = sum(b[k] * a[shell - k] for k in range(shell + 1))
            aa = sum(a[k] * a[shell - k] for k in range(shell + 1))
            self.assertEqual(
                a[shell + 1],
                2 * (ba - nu_exact * a[shell]) / denominator,
            )
            self.assertEqual(b[shell + 1], aa / denominator)

    def test_direct_hermite_reproduces_linear_and_cubic_data(self) -> None:
        mesh = (0.0, 1.0)
        linear = (2.0, 5.0)
        linear_prime = (3.0, 3.0)
        self.assertEqual(M._hermite(mesh, linear, linear_prime, 0.25), 2.75)
        cubic = (0.0, 1.0)
        cubic_prime = (0.0, 3.0)
        self.assertAlmostEqual(
            M._hermite(mesh, cubic, cubic_prime, 0.375), 0.375**3
        )

    def test_real_fixed_bytes_independently_reconstruct_within_screens(self) -> None:
        global_value, projection, payloads = M._load_inputs()
        diagnostics = M._replay(global_value, projection, payloads)
        endpoint = struct.unpack(
            ">d", bytes.fromhex(diagnostics["endpointErrorF64Hex"])
        )[0]
        join = struct.unpack(
            ">d", bytes.fromhex(diagnostics["joinErrorF64Hex"])
        )[0]
        node = struct.unpack(
            ">d", bytes.fromhex(diagnostics["nodeErrorF64Hex"])
        )[0]
        self.assertLessEqual(endpoint, M.ENDPOINT_RECONSTRUCTION_LIMIT)
        self.assertLessEqual(join, M.JOIN_RECONSTRUCTION_LIMIT)
        self.assertLessEqual(node, M.NODE_RECONSTRUCTION_LIMIT)

    def test_f64_decoder_rejects_negative_zero_and_nonfinite(self) -> None:
        for raw in (
            bytes.fromhex("0000000000000080"),
            struct.pack("<d", math.inf),
            struct.pack("<d", math.nan),
        ):
            with self.subTest(raw=raw.hex()):
                with self.assertRaises(M.ProofCenterAdmissionError):
                    M._decode_le_f64_payload(raw, 1, "hostile")

    def test_collision_is_terminal_before_input_replay(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "existing.json"
            output.write_bytes(b"occupied")
            with mock.patch.object(M, "OUTPUT_PATH", output):
                with self.assertRaises(M.ProofCenterAdmissionError) as caught:
                    M.materialize_proof_center_admission()
            self.assertEqual(caught.exception.code, "admission_output_collision")

    def test_static_independence_and_exact_materialized_output(self) -> None:
        source = SOURCE.read_text(encoding="utf-8")
        self.assertNotIn("import numpy", source)
        self.assertNotIn("import scipy", source)
        self.assertNotIn("proof_center_projection import", source)
        self.assertNotIn('"proofComplete": True', source)
        self.assertNotIn('"physicalAuthority": True', source)
        output = M.OUTPUT_PATH.read_bytes()
        self.assertEqual(len(output), 2_158)
        self.assertEqual(
            hashlib.sha256(output).hexdigest(),
            "ff07124e88673fee04f9ca7e3e7c4b6545a1ee37fb70bda43a140e56bf582645",
        )


if __name__ == "__main__":
    unittest.main()
