from __future__ import annotations

import ast
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest


HERE = Path(__file__).resolve().parent
RUNNER_PATH = HERE / "run_frozen_n64_successor_v3_attempt.py"


def _load_runner():
    spec = importlib.util.spec_from_file_location(
        "_nhm2_successor_v3_attempt_runner_test_target", RUNNER_PATH
    )
    if spec is None or spec.loader is None:
        raise AssertionError("runner spec unavailable")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


RUNNER = _load_runner()


def _returned(
    status: str,
    failure: str | None,
    wire: str | None,
    digest: str | None,
):
    return {
        "executionStatus": "RETURNED",
        "errorCode": None,
        "errorDetail": None,
        "result": {
            "status": status,
            "failure_code": failure,
            "comparison_wire": wire,
            "comparison_sha256": digest,
            "numerical_go": status == "GO",
        },
    }


class SuccessorV3AttemptRunnerTests(unittest.TestCase):
    def test_every_frozen_file_binding_matches(self) -> None:
        bindings = (
            (
                HERE / "core_newton_mpfr_v3.py",
                RUNNER.PRIMARY_SIZE_BYTES,
                RUNNER.PRIMARY_SHA256,
            ),
            (
                HERE / "test_core_newton_mpfr_v3.py",
                RUNNER.PRIMARY_SPEC_SIZE_BYTES,
                RUNNER.PRIMARY_SPEC_SHA256,
            ),
            (
                HERE / "test_run_frozen_n64_successor_v3_attempt.py",
                RUNNER.RUNNER_SPEC_SIZE_BYTES,
                RUNNER.RUNNER_SPEC_SHA256,
            ),
            (
                RUNNER._PROPOSAL,
                RUNNER.PROPOSAL_SIZE_BYTES,
                RUNNER.PROPOSAL_SHA256,
            ),
            (
                HERE / "core_newton_mpfr_v2.py",
                RUNNER.V2_PRIMARY_SIZE_BYTES,
                RUNNER.V2_PRIMARY_SHA256,
            ),
            (
                HERE / "test_core_newton_mpfr_v2.py",
                RUNNER.V2_PRIMARY_SPEC_SIZE_BYTES,
                RUNNER.V2_PRIMARY_SPEC_SHA256,
            ),
            (
                HERE / "core_newton_mpfr_v2_replay.py",
                RUNNER.V2_REPLAY_SIZE_BYTES,
                RUNNER.V2_REPLAY_SHA256,
            ),
            (
                HERE / "test_core_newton_mpfr_v2_replay.py",
                RUNNER.V2_REPLAY_SPEC_SIZE_BYTES,
                RUNNER.V2_REPLAY_SPEC_SHA256,
            ),
            (
                HERE / "run_frozen_n64_successor_attempt.py",
                RUNNER.V2_RUNNER_SIZE_BYTES,
                RUNNER.V2_RUNNER_SHA256,
            ),
            (
                HERE / "test_run_frozen_n64_successor_attempt.py",
                RUNNER.V2_RUNNER_SPEC_SIZE_BYTES,
                RUNNER.V2_RUNNER_SPEC_SHA256,
            ),
            (
                RUNNER._V2_RECEIPT,
                RUNNER.V2_RECEIPT_SIZE_BYTES,
                RUNNER.V2_RECEIPT_RAW_SHA256,
            ),
        )
        for path, size, digest in bindings:
            payload = path.read_bytes()
            self.assertEqual(len(payload), size, path.name)
            self.assertEqual(hashlib.sha256(payload).hexdigest(), digest, path.name)

    def test_v2_receipt_and_immutable_replay_are_authenticated(self) -> None:
        full, replay = RUNNER._verify_v2_receipt()
        self.assertEqual(full["receiptSha256"], RUNNER.V2_RECEIPT_SHA256)
        self.assertEqual(replay["executionStatus"], "RETURNED")
        self.assertEqual(replay["result"]["status"], "GO")
        self.assertEqual(
            replay["result"]["comparison_sha256"],
            RUNNER.REPLAY_COMPARISON_SHA256,
        )

    def test_exact_go_requires_corrected_primary_and_immutable_wire(self) -> None:
        digest = RUNNER.REPLAY_COMPARISON_SHA256
        primary = _returned("GO", None, "wire", digest)
        replay = _returned("GO", None, "wire", digest)
        self.assertEqual(
            RUNNER._decision(primary, replay),
            ("GO", True, "corrected_primary_and_immutable_replay_v2_agree"),
        )
        primary["result"]["comparison_wire"] = "different"
        self.assertEqual(
            RUNNER._decision(primary, replay),
            ("FAIL", False, "immutable_replay_v2_comparison_disagreement"),
        )

    def test_corrected_primary_failure_is_terminal_not_retry(self) -> None:
        primary = _returned("FAIL", "armijo", None, None)
        replay = _returned(
            "GO", None, "wire", RUNNER.REPLAY_COMPARISON_SHA256
        )
        self.assertEqual(
            RUNNER._decision(primary, replay),
            ("FAIL", False, "corrected_primary_numerical_failure"),
        )

    def test_primary_runtime_error_is_blocked(self) -> None:
        error = {
            "executionStatus": "ERROR",
            "errorCode": "synthetic",
            "errorDetail": "synthetic",
            "result": None,
        }
        replay = _returned(
            "GO", None, "wire", RUNNER.REPLAY_COMPARISON_SHA256
        )
        self.assertEqual(
            RUNNER._decision(error, replay),
            ("BLOCKED", False, "corrected_primary_execution_error"),
        )

    def test_receipt_seal_and_authority_locks_are_exact(self) -> None:
        primary = _returned("FAIL", "armijo", None, None)
        replay = _returned(
            "GO", None, "wire", RUNNER.REPLAY_COMPARISON_SHA256
        )
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
        self.assertFalse(receipt["retryAllowed"])
        self.assertFalse(receipt["retuneAllowed"])

    def test_existing_v3_result_blocks_before_any_solver_activity(self) -> None:
        original_docs = RUNNER._DOCS
        original_verify = RUNNER._verify_all_frozen_bytes
        try:
            with tempfile.TemporaryDirectory() as directory:
                RUNNER._DOCS = Path(directory)
                existing = RUNNER._DOCS / (
                    "nhm2-spherical-boson-star-v2-core-successor-"
                    "first-result-synthetic.json"
                )
                existing.write_text(
                    json.dumps({"runnerVersion": RUNNER.RUNNER_VERSION}),
                    encoding="utf-8",
                )
                RUNNER._verify_all_frozen_bytes = lambda: (_ for _ in ()).throw(
                    AssertionError("frozen verification reached")
                )
                with self.assertRaises(RUNNER.SuccessorV3AttemptRunnerError) as caught:
                    RUNNER.run_authorized_v3_attempt()
                self.assertEqual(
                    caught.exception.code,
                    "v3_authorization_already_consumed",
                )
        finally:
            RUNNER._DOCS = original_docs
            RUNNER._verify_all_frozen_bytes = original_verify

    def test_static_runner_executes_primary_once_and_never_replay(self) -> None:
        source = RUNNER_PATH.read_text(encoding="utf-8")
        tree = ast.parse(source)
        primary_calls = [
            node
            for node in ast.walk(tree)
            if isinstance(node, ast.Call)
            and isinstance(node.func, ast.Name)
            and node.func.id == "_safe_primary_execution"
        ]
        self.assertEqual(len(primary_calls), 1)
        self.assertNotIn("replay_frozen_n64_successor", source)
        self.assertNotIn("subprocess", source)
        self.assertNotIn("socket", source)
        self.assertNotIn("requests", source)

    def test_canonical_receipt_round_trip_is_stable(self) -> None:
        value = {"z": [1, 2], "a": False}
        wire = RUNNER._canonical(value)
        self.assertEqual(RUNNER._canonical(json.loads(wire)), wire)


if __name__ == "__main__":
    unittest.main()
