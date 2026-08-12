"""Top-level independent verifier orchestration; presently fail-closed."""

from __future__ import annotations

import os
import sys
from dataclasses import dataclass

from .contract import REPLAY_BUNDLE_PATH, RUN_REQUEST_PATH, STAGING_ROOT
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
