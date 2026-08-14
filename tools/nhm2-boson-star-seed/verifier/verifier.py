"""Top-level independent verifier orchestration; presently fail-closed."""

from __future__ import annotations

import hashlib
import os
import stat
import sys
from dataclasses import dataclass

from .contract import (
    BROKER_RUNTIME_EVIDENCE_PATH,
    NUMERIC_MATERIALIZATION_POLICY_CANONICAL_PLAIN_SHA256,
    NUMERIC_MATERIALIZATION_POLICY_CANONICAL_SIZE_BYTES,
    NUMERIC_MATERIALIZATION_POLICY_PATH,
    POSTPROJECTION_EVIDENCE_ROOT,
    POSTPROJECTION_POLICY_CANONICAL_PLAIN_SHA256,
    POSTPROJECTION_POLICY_CANONICAL_SIZE_BYTES,
    POSTPROJECTION_POLICY_PATH,
    REPLAY_BUNDLE_PATH,
    RUN_REQUEST_PATH,
    STAGING_ROOT,
    VERIFIER_RUNTIME_CHANNEL_MAXIMUM_BYTES,
)
from .errors import Blocker, block
from .manifest import RunRequest, read_run_request
from .mpfr_backend import MpfrBackend
from .operators import PreliminaryGateReplay, replay_preliminary_gates
from .proof_kernel import ProofReplayAttempt, attempt_required_proof_replays
from .secure_arrays import ArrayPayload, read_exact_array_inventory


@dataclass(frozen=True, slots=True)
class VerifierDiagnosticState:
    run_request: RunRequest
    arrays: tuple[ArrayPayload, ...]
    preliminary_gates: PreliminaryGateReplay | None
    proof_attempt: ProofReplayAttempt | None
    blockers: tuple[Blocker, ...]
    replay_bundle_created: bool = False
    artifact_accepted: bool = False
    physical_claim_allowed: bool = False


@dataclass(frozen=True, slots=True)
class V3VerifierIngressObservation:
    """Static, non-authoritative bytes observed before the missing interpreter.

    This deliberately does not call the P stage or claim that the broker
    channel's nested bindings are valid.  It proves only exact invocation,
    pinned policy bytes, a schema-valid common run request, and a bounded
    stable read of the opaque channel file.
    """

    run_request: RunRequest
    numeric_policy_plain_sha256: str
    postprojection_policy_plain_sha256: str
    broker_channel_plain_sha256: str
    broker_channel_byte_length: int
    typed_interpreter_applied: bool = False
    candidate_p_attempted: bool = False
    replay_bundle_created: bool = False
    prelaunch_context_accepted: bool = False
    runtime_conformance_established: bool = False
    artifact_accepted: bool = False
    physical_claim_allowed: bool = False

    def __post_init__(self) -> None:
        if (
            type(self.run_request) is not RunRequest
            or type(self.numeric_policy_plain_sha256) is not str
            or self.numeric_policy_plain_sha256
            != NUMERIC_MATERIALIZATION_POLICY_CANONICAL_PLAIN_SHA256
            or type(self.postprojection_policy_plain_sha256) is not str
            or self.postprojection_policy_plain_sha256
            != POSTPROJECTION_POLICY_CANONICAL_PLAIN_SHA256
            or type(self.broker_channel_plain_sha256) is not str
            or len(self.broker_channel_plain_sha256) != 64
            or type(self.broker_channel_byte_length) is not int
            or not 1 <= self.broker_channel_byte_length <= VERIFIER_RUNTIME_CHANNEL_MAXIMUM_BYTES
            or self.typed_interpreter_applied is not False
            or self.candidate_p_attempted is not False
            or self.replay_bundle_created is not False
            or self.prelaunch_context_accepted is not False
            or self.runtime_conformance_established is not False
            or self.artifact_accepted is not False
            or self.physical_claim_allowed is not False
        ):
            block(
                "v3_ingress",
                "exact_non_authoritative_v3_ingress_observation_required",
                "static_bytes_only",
            )


_RUNTIME_CHANNEL_BLOCKERS = (
    Blocker(
        phase="run_request",
        code="cross_field_instance_replay_unavailable",
        detail="bound manifest ledger separation receipt and OCI instance bytes are not delivered for recursive cross-field replay",
    ),
    Blocker(
        phase="runtime_evidence",
        code="broker_runtime_binding_channel_absent",
        detail="absoluteDeadlineBinding and verifierInputLedgerBinding are not delivered by the frozen argv environment or input inventory",
    ),
    Blocker(
        phase="runtime_evidence",
        code="closed_replay_bundle_schema_interpreter_absent",
        detail="the sealed run plan still binds runtimeTypedInterpreterBinding=null",
    ),
)


def _file_identity(metadata: os.stat_result) -> tuple[int, ...]:
    return (
        metadata.st_dev,
        metadata.st_ino,
        metadata.st_mode,
        metadata.st_nlink,
        metadata.st_size,
        metadata.st_mtime_ns,
        metadata.st_ctime_ns,
    )


def _preopen_file_identity(metadata: os.stat_result) -> tuple[int, ...]:
    """Windows test compatibility; production Linux retains the full tuple."""

    if os.name != "nt":
        return _file_identity(metadata)
    return (
        metadata.st_dev,
        metadata.st_ino,
        metadata.st_mode,
        metadata.st_nlink,
        metadata.st_size,
        metadata.st_mtime_ns,
    )


def _read_stable_exact_file(
    path: str,
    *,
    maximum_bytes: int,
    expected_size: int | None,
    expected_plain_sha256: str | None,
    label: str,
) -> bytes:
    """Read one ordinary file with a cap-plus-one and identity closure."""

    if (
        type(path) is not str
        or not os.path.isabs(path)
        or type(maximum_bytes) is not int
        or maximum_bytes <= 0
        or (expected_size is not None and type(expected_size) is not int)
        or (
            expected_plain_sha256 is not None
            and (
                type(expected_plain_sha256) is not str
                or len(expected_plain_sha256) != 64
            )
        )
        or type(label) is not str
        or not label
    ):
        block("v3_ingress", "exact_file_read_profile_required", label)
    try:
        before = os.lstat(path)
    except OSError as error:
        block("v3_ingress", "input_lstat_failed", f"{label}:errno={error.errno}")
    if (
        not stat.S_ISREG(before.st_mode)
        or stat.S_ISLNK(before.st_mode)
        or before.st_nlink != 1
    ):
        block("v3_ingress", "ordinary_single_link_file_required", label)
    if before.st_size < 1 or before.st_size > maximum_bytes:
        block(
            "v3_ingress",
            "file_size_cap_exceeded",
            f"{label}:{before.st_size}:{maximum_bytes}",
        )
    if expected_size is not None and before.st_size != expected_size:
        block(
            "v3_ingress",
            "literal_policy_size_mismatch",
            f"{label}:{before.st_size}:{expected_size}",
        )

    flags = os.O_RDONLY | getattr(os, "O_CLOEXEC", 0) | getattr(os, "O_NOFOLLOW", 0)
    try:
        descriptor = os.open(path, flags)
    except OSError as error:
        block("v3_ingress", "input_open_failed", f"{label}:errno={error.errno}")
    try:
        opened = os.fstat(descriptor)
        if _preopen_file_identity(opened) != _preopen_file_identity(before):
            block("v3_ingress", "input_lstat_open_identity_changed", label)
        chunks: list[bytes] = []
        remaining = before.st_size
        while remaining:
            try:
                chunk = os.read(descriptor, min(65_536, remaining))
            except OSError as error:
                block("v3_ingress", "input_read_failed", f"{label}:errno={error.errno}")
            if not chunk:
                block("v3_ingress", "input_short_read", label)
            chunks.append(chunk)
            remaining -= len(chunk)
        try:
            sentinel = os.read(descriptor, 1)
        except OSError as error:
            block("v3_ingress", "input_sentinel_read_failed", f"{label}:errno={error.errno}")
        if sentinel != b"":
            block("v3_ingress", "input_grew_during_read", label)
        after = os.fstat(descriptor)
        if _file_identity(after) != _file_identity(opened):
            block("v3_ingress", "input_stat_read_stat_changed", label)
    finally:
        os.close(descriptor)
    try:
        final = os.lstat(path)
    except OSError as error:
        block("v3_ingress", "input_final_lstat_failed", f"{label}:errno={error.errno}")
    if _preopen_file_identity(final) != _preopen_file_identity(opened):
        block("v3_ingress", "input_path_identity_changed", label)
    raw = b"".join(chunks)
    if len(raw) != before.st_size:
        block("v3_ingress", "input_exact_size_read_failed", label)
    digest = hashlib.sha256(raw).hexdigest()
    if expected_plain_sha256 is not None and digest != expected_plain_sha256:
        block("v3_ingress", "literal_policy_sha256_mismatch", label)
    return raw


def validate_exact_invocation_paths(
    input_manifest: str,
    staging_root: str,
    replay_bundle: str,
) -> None:
    expected = (RUN_REQUEST_PATH, STAGING_ROOT, REPLAY_BUNDLE_PATH)
    actual = (input_manifest, staging_root, replay_bundle)
    if actual != expected:
        block("invocation", "frozen_absolute_path_mismatch", repr(actual))
    if sys.platform != "linux" or os.uname().machine != "x86_64":
        block("invocation", "external_linux_x86_64_worker_required", sys.platform)
    try:
        os.lstat(replay_bundle)
    except FileNotFoundError:
        pass
    except OSError as error:
        block("invocation", "replay_output_prestate_unreadable", f"errno={error.errno}")
    else:
        block("invocation", "replay_bundle_path_must_not_exist", replay_bundle)


def validate_exact_v3_invocation_paths(
    input_manifest: str,
    numeric_materialization_policy: str,
    postprojection_policy: str,
    staging_root: str,
    postprojection_evidence_root: str,
    replay_bundle: str,
    broker_runtime_evidence: str,
) -> None:
    expected = (
        RUN_REQUEST_PATH,
        NUMERIC_MATERIALIZATION_POLICY_PATH,
        POSTPROJECTION_POLICY_PATH,
        STAGING_ROOT,
        POSTPROJECTION_EVIDENCE_ROOT,
        REPLAY_BUNDLE_PATH,
        BROKER_RUNTIME_EVIDENCE_PATH,
    )
    actual = (
        input_manifest,
        numeric_materialization_policy,
        postprojection_policy,
        staging_root,
        postprojection_evidence_root,
        replay_bundle,
        broker_runtime_evidence,
    )
    if any(type(value) is not str for value in actual) or actual != expected:
        block("invocation", "frozen_v3_absolute_path_mismatch", repr(actual))
    if sys.platform != "linux" or os.uname().machine != "x86_64":
        block("invocation", "external_linux_x86_64_worker_required", sys.platform)
    try:
        os.lstat(replay_bundle)
    except FileNotFoundError:
        pass
    except OSError as error:
        block("invocation", "replay_output_prestate_unreadable", f"errno={error.errno}")
    else:
        block("invocation", "replay_bundle_path_must_not_exist", replay_bundle)


def observe_v3_static_ingress(
    input_manifest: str,
    numeric_materialization_policy: str,
    postprojection_policy: str,
    staging_root: str,
    postprojection_evidence_root: str,
    replay_bundle: str,
    broker_runtime_evidence: str,
) -> V3VerifierIngressObservation:
    """Observe only the v3 bytes that precede typed channel interpretation."""

    validate_exact_v3_invocation_paths(
        input_manifest,
        numeric_materialization_policy,
        postprojection_policy,
        staging_root,
        postprojection_evidence_root,
        replay_bundle,
        broker_runtime_evidence,
    )
    request = read_run_request(input_manifest)
    numeric_bytes = _read_stable_exact_file(
        numeric_materialization_policy,
        maximum_bytes=NUMERIC_MATERIALIZATION_POLICY_CANONICAL_SIZE_BYTES,
        expected_size=NUMERIC_MATERIALIZATION_POLICY_CANONICAL_SIZE_BYTES,
        expected_plain_sha256=(
            NUMERIC_MATERIALIZATION_POLICY_CANONICAL_PLAIN_SHA256
        ),
        label="numeric_materialization_policy",
    )
    postprojection_bytes = _read_stable_exact_file(
        postprojection_policy,
        maximum_bytes=POSTPROJECTION_POLICY_CANONICAL_SIZE_BYTES,
        expected_size=POSTPROJECTION_POLICY_CANONICAL_SIZE_BYTES,
        expected_plain_sha256=POSTPROJECTION_POLICY_CANONICAL_PLAIN_SHA256,
        label="postprojection_policy",
    )
    channel_bytes = _read_stable_exact_file(
        broker_runtime_evidence,
        maximum_bytes=VERIFIER_RUNTIME_CHANNEL_MAXIMUM_BYTES,
        expected_size=None,
        expected_plain_sha256=None,
        label="verifier_runtime_channel",
    )
    return V3VerifierIngressObservation(
        run_request=request,
        numeric_policy_plain_sha256=hashlib.sha256(numeric_bytes).hexdigest(),
        postprojection_policy_plain_sha256=hashlib.sha256(
            postprojection_bytes
        ).hexdigest(),
        broker_channel_plain_sha256=hashlib.sha256(channel_bytes).hexdigest(),
        broker_channel_byte_length=len(channel_bytes),
    )


def run_maximum_coherent_subset(
    input_manifest: str,
    staging_root: str,
    replay_bundle: str,
) -> VerifierDiagnosticState:
    """Execute only when the caller explicitly asks for diagnostic replay.

    This function reaches the independently implemented array/operator gates,
    but always returns a blocked state and never writes the replay bundle.
    The production bootstrap below fails earlier on the missing trusted broker
    evidence channel so operational work is not wasted.
    """

    validate_exact_invocation_paths(input_manifest, staging_root, replay_bundle)
    request = read_run_request(input_manifest)
    payloads = read_exact_array_inventory(staging_root)
    backend = MpfrBackend.load_frozen()
    preliminary = replay_preliminary_gates(payloads, backend)
    proof_attempt = attempt_required_proof_replays(backend, request, payloads)
    blockers = (
        *_RUNTIME_CHANNEL_BLOCKERS,
        *preliminary.blockers,
        *proof_attempt.blockers,
    )
    if preliminary.any_completed_gate_failed:
        blockers = (
            Blocker(
                phase="preliminary_gates",
                code="completed_gate_failed",
                detail="one or more independently replayed preliminary metrics exceeded its frozen rail",
            ),
            *blockers,
        )
    return VerifierDiagnosticState(
        run_request=request,
        arrays=payloads,
        preliminary_gates=preliminary,
        proof_attempt=proof_attempt,
        blockers=blockers,
    )


def run_fail_closed_verifier(
    input_manifest: str,
    staging_root: str,
    replay_bundle: str,
) -> None:
    validate_exact_invocation_paths(input_manifest, staging_root, replay_bundle)
    _ = read_run_request(input_manifest)
    first = _RUNTIME_CHANNEL_BLOCKERS[0]
    block(first.phase, first.code, first.detail)


def run_fail_closed_v3_verifier(
    input_manifest: str,
    numeric_materialization_policy: str,
    postprojection_policy: str,
    staging_root: str,
    postprojection_evidence_root: str,
    replay_bundle: str,
    broker_runtime_evidence: str,
) -> None:
    """Stop before P until the sealed v3 channel interpreter is implemented."""

    _ = observe_v3_static_ingress(
        input_manifest,
        numeric_materialization_policy,
        postprojection_policy,
        staging_root,
        postprojection_evidence_root,
        replay_bundle,
        broker_runtime_evidence,
    )
    block(
        "runtime_evidence",
        "v3_runtime_channel_typed_interpreter_absent",
        (
            "the opaque stable broker-channel bytes were observed but the "
            "sealed typed interpreter and recursive cross-binding validator "
            "are not implemented; candidate P was not attempted"
        ),
    )
