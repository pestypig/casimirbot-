"""One-shot content-addressed runner for the authorized N=64 v2 attempt."""

from __future__ import annotations

from dataclasses import asdict, is_dataclass
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys
from types import ModuleType
from typing import Final


RUNNER_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_v2_frozen_core_successor_attempt/v2"
)
RECEIPT_ARTIFACT_ID: Final[str] = (
    "nhm2.spherical_boson_star_v2_frozen_core_successor_first_result"
)
RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/frozen-core-successor-first-result/v2\n"
)

PRIMARY_SHA256: Final[str] = (
    "1204c9fe4983fd589cc6915d5579bc6e55fd7de05f6e4a4d0c86cd93c88e2bb2"
)
PRIMARY_SIZE_BYTES: Final[int] = 30_594
REPLAY_SHA256: Final[str] = (
    "0f366262608d9f593260a70ce0444af6ca23edaec6029c1e0d35d78ac48483bd"
)
REPLAY_SIZE_BYTES: Final[int] = 23_895
PRIMARY_SPEC_SHA256: Final[str] = (
    "3a53e1b41c8fb739088b5c2663d2020acce8708e131c0e55788365f368217fdf"
)
PRIMARY_SPEC_SIZE_BYTES: Final[int] = 8_733
REPLAY_SPEC_SHA256: Final[str] = (
    "f7ccf857fa883a190a2a3d7a14f51c2ef473f5e121030a606f954f289c53a7cf"
)
REPLAY_SPEC_SIZE_BYTES: Final[int] = 5_874
RUNNER_SPEC_SHA256: Final[str] = (
    "b8ddb2dc867ffe1c4e211f1a90fafa0969ac94f30a179a80af36135e9d3b509a"
)
RUNNER_SPEC_SIZE_BYTES: Final[int] = 5_151
PROPOSAL_SHA256: Final[str] = (
    "07495f17b37bfe4942794b14e90cb201d636caca0356fe66df57d112c8e43da1"
)
PROPOSAL_SIZE_BYTES: Final[int] = 12_872

_HERE: Final[Path] = Path(__file__).resolve().parent
_REPOSITORY: Final[Path] = _HERE.parents[1]
_DOCS: Final[Path] = _REPOSITORY / "docs" / "research"
_PRIMARY: Final[Path] = _HERE / "core_newton_mpfr_v2.py"
_REPLAY: Final[Path] = _HERE / "core_newton_mpfr_v2_replay.py"
_PRIMARY_SPEC: Final[Path] = _HERE / "test_core_newton_mpfr_v2.py"
_REPLAY_SPEC: Final[Path] = _HERE / "test_core_newton_mpfr_v2_replay.py"
_RUNNER_SPEC: Final[Path] = _HERE / "test_run_frozen_n64_successor_attempt.py"
_PROPOSAL: Final[Path] = (
    _DOCS / "nhm2-spherical-boson-star-v2-equilibrated-mpfr-core-successor-proposal.md"
)


class SuccessorAttemptRunnerError(RuntimeError):
    def __init__(self, code: str, detail: str) -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


def _verified_bytes(path: Path, size: int, digest: str, label: str) -> bytes:
    try:
        payload = path.read_bytes()
    except OSError as error:
        raise SuccessorAttemptRunnerError(
            f"{label}_unavailable", type(error).__name__
        ) from error
    if len(payload) != size or hashlib.sha256(payload).hexdigest() != digest:
        raise SuccessorAttemptRunnerError(f"{label}_binding_mismatch", "raw")
    return payload


def _load_verified(
    *, path: Path, size: int, digest: str, label: str, module_name: str
) -> ModuleType:
    payload = _verified_bytes(path, size, digest, label)
    spec = importlib.util.spec_from_loader(module_name, loader=None, origin=str(path))
    if spec is None:
        raise SuccessorAttemptRunnerError(f"{label}_module_spec_failed", "none")
    module = importlib.util.module_from_spec(spec)
    module.__file__ = str(path)
    module.__package__ = ""
    previous = sys.modules.get(module_name)
    sys.modules[module_name] = module
    try:
        code = compile(payload, str(path), "exec", dont_inherit=True, optimize=0)
        exec(code, module.__dict__)
    except Exception as error:
        raise SuccessorAttemptRunnerError(
            f"{label}_module_load_failed", type(error).__name__
        ) from error
    finally:
        if previous is None:
            del sys.modules[module_name]
        else:
            sys.modules[module_name] = previous
    return module


def _canonical(value: object) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")


def _safe_execution(function) -> dict[str, object]:
    try:
        result = function()
    except Exception as error:
        return {
            "executionStatus": "ERROR",
            "errorCode": getattr(error, "code", type(error).__name__),
            "errorDetail": getattr(error, "detail", type(error).__name__),
            "result": None,
        }
    if not is_dataclass(result):
        return {
            "executionStatus": "ERROR",
            "errorCode": "result_not_dataclass",
            "errorDetail": type(result).__name__,
            "result": None,
        }
    return {
        "executionStatus": "RETURNED",
        "errorCode": None,
        "errorDetail": None,
        "result": asdict(result),
    }


def _decision(
    primary: dict[str, object], replay: dict[str, object]
) -> tuple[str, bool, str]:
    if (
        primary["executionStatus"] != "RETURNED"
        or replay["executionStatus"] != "RETURNED"
    ):
        return "BLOCKED", False, "implementation_or_runtime_execution_error"
    primary_result = primary["result"]
    replay_result = replay["result"]
    if not isinstance(primary_result, dict) or not isinstance(replay_result, dict):
        return "BLOCKED", False, "result_shape_invalid"
    if primary_result.get("status") == "GO" and replay_result.get("status") == "GO":
        agreement = bool(
            primary_result.get("comparison_wire")
            and primary_result.get("comparison_wire")
            == replay_result.get("comparison_wire")
            and primary_result.get("comparison_sha256")
            == replay_result.get("comparison_sha256")
        )
        return (
            ("GO" if agreement else "FAIL"),
            agreement,
            (
                "both_raw_gates_and_exact_comparison_passed"
                if agreement
                else "projected_comparison_disagreement"
            ),
        )
    if (
        primary_result.get("status") == "FAIL"
        and replay_result.get("status") == "FAIL"
        and primary_result.get("failure_code") == replay_result.get("failure_code")
    ):
        return "FAIL", True, "source_disjoint_matching_first_failure"
    return "FAIL", False, "source_disjoint_terminal_result_disagreement"


def _receipt_unsigned(
    primary: dict[str, object], replay: dict[str, object]
) -> dict[str, object]:
    decision, agreement, reason = _decision(primary, replay)
    runner_payload = Path(__file__).resolve().read_bytes()
    return {
        "artifactId": RECEIPT_ARTIFACT_ID,
        "authorityLocks": {
            "candidateExecutionAuthority": False,
            "candidateAuthority": False,
            "diagnosticPassAuthority": False,
            "outputAuthority": False,
            "physicalAuthority": False,
            "propulsionAuthority": False,
            "replayAuthority": False,
            "theoryGraphAuthority": False,
            "transportAuthority": False,
        },
        "decision": decision,
        "decisionReason": reason,
        "firstResultConsumedAuthorization": True,
        "implementationBindings": {
            "primarySha256": PRIMARY_SHA256,
            "primarySizeBytes": PRIMARY_SIZE_BYTES,
            "primarySpecSha256": PRIMARY_SPEC_SHA256,
            "primarySpecSizeBytes": PRIMARY_SPEC_SIZE_BYTES,
            "proposalSha256": PROPOSAL_SHA256,
            "proposalSizeBytes": PROPOSAL_SIZE_BYTES,
            "replaySha256": REPLAY_SHA256,
            "replaySizeBytes": REPLAY_SIZE_BYTES,
            "replaySpecSha256": REPLAY_SPEC_SHA256,
            "replaySpecSizeBytes": REPLAY_SPEC_SIZE_BYTES,
            "runnerObservedSha256": hashlib.sha256(runner_payload).hexdigest(),
            "runnerObservedSizeBytes": len(runner_payload),
            "runnerSpecSha256": RUNNER_SPEC_SHA256,
            "runnerSpecSizeBytes": RUNNER_SPEC_SIZE_BYTES,
        },
        "nodeCount": 64,
        "numericalGo": decision == "GO",
        "predecessorRemainsFailed": True,
        "primaryObservation": primary,
        "replayObservation": replay,
        "retuneAllowed": False,
        "retryAllowed": False,
        "runnerVersion": RUNNER_VERSION,
        "runtimeDisjointIndependentReplay": False,
        "sharedRuntimeLineageBlocker": (
            "primary_and_replay_share_workstation_MPFR_GMP_lineage"
        ),
        "sourceDisjointAgreement": agreement,
    }


def _seal(unsigned: dict[str, object]) -> tuple[dict[str, object], str]:
    payload = _canonical(unsigned)
    digest = hashlib.sha256(
        RECEIPT_DOMAIN + len(payload).to_bytes(8, "little") + payload
    ).hexdigest()
    full = dict(unsigned)
    full["receiptSha256"] = digest
    return full, digest


def _persist_once(receipt: dict[str, object], digest: str) -> Path:
    path = (
        _DOCS
        / f"nhm2-spherical-boson-star-v2-core-successor-first-result-{digest}.json"
    )
    payload = _canonical(receipt) + b"\n"
    try:
        with path.open("xb") as stream:
            stream.write(payload)
            stream.flush()
            os.fsync(stream.fileno())
    except FileExistsError:
        if path.read_bytes() != payload:
            raise SuccessorAttemptRunnerError(
                "first_result_existing_bytes_mismatch", digest
            )
    return path


def run_authorized_attempt() -> tuple[Path, dict[str, object]]:
    """Consume the authorization once and persist the exact first result."""

    _verified_bytes(
        _PRIMARY_SPEC,
        PRIMARY_SPEC_SIZE_BYTES,
        PRIMARY_SPEC_SHA256,
        "primary_spec",
    )
    _verified_bytes(
        _REPLAY_SPEC,
        REPLAY_SPEC_SIZE_BYTES,
        REPLAY_SPEC_SHA256,
        "replay_spec",
    )
    _verified_bytes(
        _RUNNER_SPEC,
        RUNNER_SPEC_SIZE_BYTES,
        RUNNER_SPEC_SHA256,
        "runner_spec",
    )
    _verified_bytes(_PROPOSAL, PROPOSAL_SIZE_BYTES, PROPOSAL_SHA256, "proposal")
    primary_module = _load_verified(
        path=_PRIMARY,
        size=PRIMARY_SIZE_BYTES,
        digest=PRIMARY_SHA256,
        label="primary",
        module_name="_nhm2_frozen_core_successor_primary_1204c9fe",
    )
    replay_module = _load_verified(
        path=_REPLAY,
        size=REPLAY_SIZE_BYTES,
        digest=REPLAY_SHA256,
        label="replay",
        module_name="_nhm2_frozen_core_successor_replay_0f366262",
    )
    primary = _safe_execution(primary_module.run_frozen_n64_successor)
    replay = _safe_execution(replay_module.replay_frozen_n64_successor)
    receipt, digest = _seal(_receipt_unsigned(primary, replay))
    path = _persist_once(receipt, digest)
    return path, receipt


if __name__ == "__main__":
    result_path, result_receipt = run_authorized_attempt()
    print(
        json.dumps(
            {
                "decision": result_receipt["decision"],
                "path": str(result_path),
                "receiptSha256": result_receipt["receiptSha256"],
            },
            separators=(",", ":"),
            sort_keys=True,
        )
    )
