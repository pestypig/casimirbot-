from __future__ import annotations

from contextlib import ExitStack
import hashlib
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock

from verifier import verifier as runtime
from verifier.bootstrap import EXPECTED_ARGV
from verifier.contract import RUN_PLAN_BINDING
from verifier.errors import VerificationBlocked
from verifier.manifest import RunRequest


def _request() -> RunRequest:
    return RunRequest(value={}, canonical_bytes=b"{}", binding={})


class V3VerifierBootstrapTests(unittest.TestCase):
    def test_exact_argv_matches_the_sealed_v3_stage_invocation(self) -> None:
        self.assertEqual(
            EXPECTED_ARGV,
            (
                "--input-manifest",
                "/run/input/00-seed-run-request.v1.json",
                "--numeric-materialization-policy",
                "/run/input/08-numeric-materialization-policy-v1.canonical.json",
                "--postprojection-policy",
                "/run/input/09-postprojection-policy-v1.canonical.json",
                "--staging-root",
                "/run/staging",
                "--postprojection-evidence-root",
                "/run/postprojection-evidence",
                "--replay-bundle",
                "/run/replay/seed-verifier-replay-bundle.canonical.json",
                "--broker-runtime-evidence",
                "/run/broker-channel/verifier-runtime-evidence.v3.canonical.json",
            ),
        )
        self.assertEqual(
            dict(RUN_PLAN_BINDING),
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

    def test_stable_reader_enforces_cap_hash_and_postread_identity(self) -> None:
        raw = b'{"sealed":"fixture"}'
        digest = hashlib.sha256(raw).hexdigest()
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "fixture.json"
            path.write_bytes(raw)
            self.assertEqual(
                runtime._read_stable_exact_file(
                    str(path),
                    maximum_bytes=len(raw),
                    expected_size=len(raw),
                    expected_plain_sha256=digest,
                    label="fixture",
                ),
                raw,
            )
            with self.assertRaisesRegex(VerificationBlocked, "file_size_cap_exceeded"):
                runtime._read_stable_exact_file(
                    str(path),
                    maximum_bytes=len(raw) - 1,
                    expected_size=None,
                    expected_plain_sha256=None,
                    label="fixture",
                )
            with self.assertRaisesRegex(
                VerificationBlocked, "literal_policy_sha256_mismatch"
            ):
                runtime._read_stable_exact_file(
                    str(path),
                    maximum_bytes=len(raw),
                    expected_size=len(raw),
                    expected_plain_sha256="0" * 64,
                    label="fixture",
                )

    def test_static_ingress_observes_bytes_but_grants_no_context_or_p(self) -> None:
        numeric = b"numeric-policy-fixture"
        postprojection = b"postprojection-policy-fixture"
        channel = b'{"opaque":"channel-fixture"}'
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            request_path = str(root / "request.json")
            numeric_path = str(root / "numeric.json")
            post_path = str(root / "post.json")
            staging_root = str(root / "staging")
            raw_root = str(root / "raw")
            replay_path = str(root / "replay.json")
            channel_path = str(root / "channel.json")
            Path(request_path).write_bytes(b"{}")
            Path(numeric_path).write_bytes(numeric)
            Path(post_path).write_bytes(postprojection)
            Path(channel_path).write_bytes(channel)

            patches = (
                mock.patch.object(runtime, "RUN_REQUEST_PATH", request_path),
                mock.patch.object(
                    runtime, "NUMERIC_MATERIALIZATION_POLICY_PATH", numeric_path
                ),
                mock.patch.object(runtime, "POSTPROJECTION_POLICY_PATH", post_path),
                mock.patch.object(runtime, "STAGING_ROOT", staging_root),
                mock.patch.object(
                    runtime, "POSTPROJECTION_EVIDENCE_ROOT", raw_root
                ),
                mock.patch.object(runtime, "REPLAY_BUNDLE_PATH", replay_path),
                mock.patch.object(
                    runtime, "BROKER_RUNTIME_EVIDENCE_PATH", channel_path
                ),
                mock.patch.object(
                    runtime,
                    "NUMERIC_MATERIALIZATION_POLICY_CANONICAL_SIZE_BYTES",
                    len(numeric),
                ),
                mock.patch.object(
                    runtime,
                    "NUMERIC_MATERIALIZATION_POLICY_CANONICAL_PLAIN_SHA256",
                    hashlib.sha256(numeric).hexdigest(),
                ),
                mock.patch.object(
                    runtime,
                    "POSTPROJECTION_POLICY_CANONICAL_SIZE_BYTES",
                    len(postprojection),
                ),
                mock.patch.object(
                    runtime,
                    "POSTPROJECTION_POLICY_CANONICAL_PLAIN_SHA256",
                    hashlib.sha256(postprojection).hexdigest(),
                ),
                mock.patch.object(runtime, "VERIFIER_RUNTIME_CHANNEL_MAXIMUM_BYTES", 1024),
                mock.patch.object(runtime, "read_run_request", return_value=_request()),
                mock.patch.object(runtime.sys, "platform", "linux"),
                mock.patch.object(
                    runtime.os,
                    "uname",
                    create=True,
                    return_value=mock.Mock(machine="x86_64"),
                ),
            )
            with ExitStack() as stack:
                for patcher in patches:
                    stack.enter_context(patcher)
                observation = runtime.observe_v3_static_ingress(
                    request_path,
                    numeric_path,
                    post_path,
                    staging_root,
                    raw_root,
                    replay_path,
                    channel_path,
                )
                self.assertEqual(
                    observation.broker_channel_plain_sha256,
                    hashlib.sha256(channel).hexdigest(),
                )
                self.assertEqual(observation.broker_channel_byte_length, len(channel))
                self.assertFalse(observation.typed_interpreter_applied)
                self.assertFalse(observation.candidate_p_attempted)
                self.assertFalse(observation.prelaunch_context_accepted)
                self.assertFalse(observation.artifact_accepted)
                self.assertFalse(observation.physical_claim_allowed)
                with self.assertRaisesRegex(
                    VerificationBlocked,
                    "v3_runtime_channel_typed_interpreter_absent",
                ):
                    runtime.run_fail_closed_v3_verifier(
                        request_path,
                        numeric_path,
                        post_path,
                        staging_root,
                        raw_root,
                        replay_path,
                        channel_path,
                    )
            self.assertFalse(Path(replay_path).exists())

    def test_wrong_path_rejects_before_any_file_read(self) -> None:
        with (
            mock.patch.object(runtime.sys, "platform", "linux"),
            mock.patch.object(
                runtime.os,
                "uname",
                create=True,
                return_value=mock.Mock(machine="x86_64"),
            ),
            mock.patch.object(runtime, "_read_stable_exact_file") as reader,
            self.assertRaisesRegex(
                VerificationBlocked, "frozen_v3_absolute_path_mismatch"
            ),
        ):
            runtime.observe_v3_static_ingress(
                "/wrong/request",
                runtime.NUMERIC_MATERIALIZATION_POLICY_PATH,
                runtime.POSTPROJECTION_POLICY_PATH,
                runtime.STAGING_ROOT,
                runtime.POSTPROJECTION_EVIDENCE_ROOT,
                runtime.REPLAY_BUNDLE_PATH,
                runtime.BROKER_RUNTIME_EVIDENCE_PATH,
            )
        reader.assert_not_called()


if __name__ == "__main__":
    unittest.main()
