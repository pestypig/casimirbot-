from __future__ import annotations

import ast
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import unittest


HERE = Path(__file__).resolve().parent
RUNNER_PATH = HERE / "run_frozen_n64_successor_attempt.py"


def _load_runner():
    spec = importlib.util.spec_from_file_location(
        "_nhm2_successor_attempt_runner_test_target", RUNNER_PATH
    )
    if spec is None or spec.loader is None:
        raise AssertionError("runner spec unavailable")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


RUNNER = _load_runner()


def _returned(status: str, failure: str | None, wire: str | None, digest: str | None):
    return {
        "executionStatus": "RETURNED",
        "errorCode": None,
        "errorDetail": None,
        "result": {
            "status": status,
            "failure_code": failure,
            "comparison_wire": wire,
            "comparison_sha256": digest,
        },
    }


class SuccessorAttemptRunnerTests(unittest.TestCase):
    def test_frozen_source_and_spec_bindings_match(self) -> None:
        bindings = (
            (
                HERE / "core_newton_mpfr_v2.py",
                RUNNER.PRIMARY_SIZE_BYTES,
                RUNNER.PRIMARY_SHA256,
            ),
            (
                HERE / "test_core_newton_mpfr_v2.py",
                RUNNER.PRIMARY_SPEC_SIZE_BYTES,
                RUNNER.PRIMARY_SPEC_SHA256,
            ),
            (
                HERE / "core_newton_mpfr_v2_replay.py",
                RUNNER.REPLAY_SIZE_BYTES,
                RUNNER.REPLAY_SHA256,
            ),
            (
                HERE / "test_core_newton_mpfr_v2_replay.py",
                RUNNER.REPLAY_SPEC_SIZE_BYTES,
                RUNNER.REPLAY_SPEC_SHA256,
            ),
            (
                HERE / "test_run_frozen_n64_successor_attempt.py",
                RUNNER.RUNNER_SPEC_SIZE_BYTES,
                RUNNER.RUNNER_SPEC_SHA256,
            ),
        )
        for path, size, digest in bindings:
            payload = path.read_bytes()
            self.assertEqual(len(payload), size, path.name)
            self.assertEqual(hashlib.sha256(payload).hexdigest(), digest, path.name)

    def test_exact_go_requires_both_go_and_exact_wire_hash_agreement(self) -> None:
        primary = _returned("GO", None, "wire", "a" * 64)
        replay = _returned("GO", None, "wire", "a" * 64)
        self.assertEqual(
            RUNNER._decision(primary, replay),
            ("GO", True, "both_raw_gates_and_exact_comparison_passed"),
        )
        replay["result"]["comparison_sha256"] = "b" * 64
        self.assertEqual(
            RUNNER._decision(primary, replay),
            ("FAIL", False, "projected_comparison_disagreement"),
        )

    def test_matching_first_failure_is_fail_not_blocked(self) -> None:
        primary = _returned("FAIL", "armijo", None, None)
        replay = _returned("FAIL", "armijo", None, None)
        self.assertEqual(
            RUNNER._decision(primary, replay),
            ("FAIL", True, "source_disjoint_matching_first_failure"),
        )

    def test_runtime_or_implementation_error_is_blocked(self) -> None:
        error = {
            "executionStatus": "ERROR",
            "errorCode": "synthetic",
            "errorDetail": "synthetic",
            "result": None,
        }
        self.assertEqual(
            RUNNER._decision(error, error),
            ("BLOCKED", False, "implementation_or_runtime_execution_error"),
        )

    def test_receipt_seal_is_domain_and_length_separated(self) -> None:
        primary = _returned("FAIL", "armijo", None, None)
        replay = _returned("FAIL", "armijo", None, None)
        unsigned = RUNNER._receipt_unsigned(primary, replay)
        receipt, digest = RUNNER._seal(unsigned)
        payload = RUNNER._canonical(unsigned)
        independent = hashlib.sha256(
            RUNNER.RECEIPT_DOMAIN
            + len(payload).to_bytes(8, "little")
            + payload
        ).hexdigest()
        self.assertEqual(digest, independent)
        self.assertEqual(receipt["receiptSha256"], digest)
        self.assertFalse(receipt["numericalGo"])
        self.assertFalse(any(receipt["authorityLocks"].values()))

    def test_static_runner_has_one_execution_call_per_implementation(self) -> None:
        source = RUNNER_PATH.read_text(encoding="utf-8")
        tree = ast.parse(source)
        calls = [
            node
            for node in ast.walk(tree)
            if isinstance(node, ast.Call)
            and isinstance(node.func, ast.Name)
            and node.func.id == "_safe_execution"
        ]
        self.assertEqual(len(calls), 2)
        self.assertNotIn("subprocess", source)
        self.assertNotIn("retry", source.lower().replace("retryallowed", ""))

    def test_canonical_receipt_round_trip_is_stable(self) -> None:
        value = {"z": [1, 2], "a": False}
        wire = RUNNER._canonical(value)
        self.assertEqual(RUNNER._canonical(json.loads(wire)), wire)


if __name__ == "__main__":
    unittest.main()
