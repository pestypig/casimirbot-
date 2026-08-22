"""One-shot runner for the authorized corrected-primary N=64 v3 attempt."""

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
    "nhm2_spherical_boson_star_v2_frozen_core_successor_attempt/v3"
)
RECEIPT_ARTIFACT_ID: Final[str] = (
    "nhm2.spherical_boson_star_v2_frozen_core_successor_first_result"
)
RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/frozen-core-successor-first-result/v3\n"
)
V2_RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/frozen-core-successor-first-result/v2\n"
)

PRIMARY_SHA256: Final[str] = (
    "5aec1001d02a12cfc9216e7f3f9e5d5533653ef36983e0de81888c44fbea47d5"
)
PRIMARY_SIZE_BYTES: Final[int] = 32_517
PRIMARY_SPEC_SHA256: Final[str] = (
    "145eded6aa2373d815940723a3a48fe1691361565c71f3e5c1c378c3982b997d"
)
PRIMARY_SPEC_SIZE_BYTES: Final[int] = 11_744
RUNNER_SPEC_SHA256: Final[str] = (
    "af357b21059a6c133aba23be3a0b469807af62027b7175551b3bcf1a650b3aaa"
)
RUNNER_SPEC_SIZE_BYTES: Final[int] = 8_386
PROPOSAL_SHA256: Final[str] = (
    "04edae6ed2d594053e0763e5a2f72d1df206b66531d21734ceb66f59641f455e"
)
PROPOSAL_SIZE_BYTES: Final[int] = 5_569

V2_RECEIPT_SHA256: Final[str] = (
    "73029d86455ceebd5617388a3fb6b62f6ceabe12d5c177ec00ad39fd3d6834f2"
)
V2_RECEIPT_RAW_SHA256: Final[str] = (
    "e3eef69b7e5929ecb23448a8214a167520ab3d4a96c3e19bb9641147a5a8bb0d"
)
V2_RECEIPT_SIZE_BYTES: Final[int] = 11_380
V2_PRIMARY_SHA256: Final[str] = (
    "1204c9fe4983fd589cc6915d5579bc6e55fd7de05f6e4a4d0c86cd93c88e2bb2"
)
V2_PRIMARY_SIZE_BYTES: Final[int] = 30_594
V2_PRIMARY_SPEC_SHA256: Final[str] = (
    "3a53e1b41c8fb739088b5c2663d2020acce8708e131c0e55788365f368217fdf"
)
V2_PRIMARY_SPEC_SIZE_BYTES: Final[int] = 8_733
V2_REPLAY_SHA256: Final[str] = (
    "0f366262608d9f593260a70ce0444af6ca23edaec6029c1e0d35d78ac48483bd"
)
V2_REPLAY_SIZE_BYTES: Final[int] = 23_895
V2_REPLAY_SPEC_SHA256: Final[str] = (
    "f7ccf857fa883a190a2a3d7a14f51c2ef473f5e121030a606f954f289c53a7cf"
)
V2_REPLAY_SPEC_SIZE_BYTES: Final[int] = 5_874
V2_RUNNER_SHA256: Final[str] = (
    "f81a5c7012abe4c213290eb5de6e0492d536c97c6ff76bc2575473277f4e40da"
)
V2_RUNNER_SIZE_BYTES: Final[int] = 10_982
V2_RUNNER_SPEC_SHA256: Final[str] = (
    "b8ddb2dc867ffe1c4e211f1a90fafa0969ac94f30a179a80af36135e9d3b509a"
)
V2_RUNNER_SPEC_SIZE_BYTES: Final[int] = 5_151
REPLAY_COMPARISON_SHA256: Final[str] = (
    "f766cef182304361e6cb80d9a184a47e56db44c06470ba3984fc60b64c0f6151"
)

_HERE: Final[Path] = Path(__file__).resolve().parent
_REPOSITORY: Final[Path] = _HERE.parents[1]
_DOCS: Final[Path] = _REPOSITORY / "docs" / "research"
_PRIMARY: Final[Path] = _HERE / "core_newton_mpfr_v3.py"
_PRIMARY_SPEC: Final[Path] = _HERE / "test_core_newton_mpfr_v3.py"
_RUNNER_SPEC: Final[Path] = _HERE / "test_run_frozen_n64_successor_v3_attempt.py"
_PROPOSAL: Final[Path] = (
    _DOCS / "nhm2-spherical-boson-star-v2-core-successor-v3-proposal.md"
)
_V2_RECEIPT: Final[Path] = _DOCS / (
    "nhm2-spherical-boson-star-v2-core-successor-first-result-"
    f"{V2_RECEIPT_SHA256}.json"
)
_V2_PRIMARY: Final[Path] = _HERE / "core_newton_mpfr_v2.py"
_V2_PRIMARY_SPEC: Final[Path] = _HERE / "test_core_newton_mpfr_v2.py"
_V2_REPLAY: Final[Path] = _HERE / "core_newton_mpfr_v2_replay.py"
_V2_REPLAY_SPEC: Final[Path] = _HERE / "test_core_newton_mpfr_v2_replay.py"
_V2_RUNNER: Final[Path] = _HERE / "run_frozen_n64_successor_attempt.py"
_V2_RUNNER_SPEC: Final[Path] = _HERE / "test_run_frozen_n64_successor_attempt.py"


class SuccessorV3AttemptRunnerError(RuntimeError):
    def __init__(self, code: str, detail: str) -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


def _canonical(value: object) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")


def _verified_bytes(path: Path, size: int, digest: str, label: str) -> bytes:
    try:
        payload = path.read_bytes()
    except OSError as error:
        raise SuccessorV3AttemptRunnerError(
            f"{label}_unavailable", type(error).__name__
        ) from error
    if len(payload) != size or hashlib.sha256(payload).hexdigest() != digest:
        raise SuccessorV3AttemptRunnerError(f"{label}_binding_mismatch", "raw")
    return payload


def _load_verified_primary() -> ModuleType:
    payload = _verified_bytes(
        _PRIMARY, PRIMARY_SIZE_BYTES, PRIMARY_SHA256, "primary_v3"
    )
    module_name = "_nhm2_frozen_core_successor_primary_v3_5aec1001"
    spec = importlib.util.spec_from_loader(
        module_name, loader=None, origin=str(_PRIMARY)
    )
    if spec is None:
        raise SuccessorV3AttemptRunnerError("primary_v3_module_spec_failed", "none")
    module = importlib.util.module_from_spec(spec)
    module.__file__ = str(_PRIMARY)
    module.__package__ = ""
    previous = sys.modules.get(module_name)
    sys.modules[module_name] = module
    try:
        code = compile(payload, str(_PRIMARY), "exec", dont_inherit=True, optimize=0)
        exec(code, module.__dict__)
    except Exception as error:
        raise SuccessorV3AttemptRunnerError(
            "primary_v3_module_load_failed", type(error).__name__
        ) from error
    finally:
        if previous is None:
            del sys.modules[module_name]
        else:
            sys.modules[module_name] = previous
    return module


def _verify_v2_receipt() -> tuple[dict[str, object], dict[str, object]]:
    raw = _verified_bytes(
        _V2_RECEIPT,
        V2_RECEIPT_SIZE_BYTES,
        V2_RECEIPT_RAW_SHA256,
        "v2_receipt",
    )
    try:
        full = json.loads(raw)
    except Exception as error:
        raise SuccessorV3AttemptRunnerError(
            "v2_receipt_json_invalid", type(error).__name__
        ) from error
    if type(full) is not dict or full.get("receiptSha256") != V2_RECEIPT_SHA256:
        raise SuccessorV3AttemptRunnerError("v2_receipt_shape_invalid", "root")
    unsigned = dict(full)
    unsigned.pop("receiptSha256")
    payload = _canonical(unsigned)
    observed = hashlib.sha256(
        V2_RECEIPT_DOMAIN + len(payload).to_bytes(8, "little") + payload
    ).hexdigest()
    if observed != V2_RECEIPT_SHA256:
        raise SuccessorV3AttemptRunnerError("v2_receipt_self_hash_mismatch", observed)
    if (
        unsigned.get("decision") != "FAIL"
        or unsigned.get("decisionReason")
        != "source_disjoint_terminal_result_disagreement"
        or unsigned.get("retryAllowed") is not False
        or unsigned.get("retuneAllowed") is not False
    ):
        raise SuccessorV3AttemptRunnerError("v2_receipt_decision_invalid", "root")
    replay = unsigned.get("replayObservation")
    if type(replay) is not dict or replay.get("executionStatus") != "RETURNED":
        raise SuccessorV3AttemptRunnerError("v2_replay_observation_invalid", "envelope")
    replay_result = replay.get("result")
    if (
        type(replay_result) is not dict
        or replay_result.get("status") != "GO"
        or replay_result.get("numerical_go") is not True
        or replay_result.get("comparison_sha256") != REPLAY_COMPARISON_SHA256
        or type(replay_result.get("comparison_wire")) is not str
    ):
        raise SuccessorV3AttemptRunnerError("v2_replay_observation_invalid", "result")
    locks = unsigned.get("authorityLocks")
    if (
        type(locks) is not dict
        or not locks
        or any(value is not False for value in locks.values())
    ):
        raise SuccessorV3AttemptRunnerError("v2_authority_lock_invalid", "root")
    return full, replay


def _verify_all_frozen_bytes() -> tuple[dict[str, object], dict[str, object]]:
    checks = (
        (
            _PRIMARY_SPEC,
            PRIMARY_SPEC_SIZE_BYTES,
            PRIMARY_SPEC_SHA256,
            "primary_spec_v3",
        ),
        (_RUNNER_SPEC, RUNNER_SPEC_SIZE_BYTES, RUNNER_SPEC_SHA256, "runner_spec_v3"),
        (_PROPOSAL, PROPOSAL_SIZE_BYTES, PROPOSAL_SHA256, "proposal_v3"),
        (_V2_PRIMARY, V2_PRIMARY_SIZE_BYTES, V2_PRIMARY_SHA256, "primary_v2"),
        (
            _V2_PRIMARY_SPEC,
            V2_PRIMARY_SPEC_SIZE_BYTES,
            V2_PRIMARY_SPEC_SHA256,
            "primary_spec_v2",
        ),
        (_V2_REPLAY, V2_REPLAY_SIZE_BYTES, V2_REPLAY_SHA256, "replay_v2"),
        (
            _V2_REPLAY_SPEC,
            V2_REPLAY_SPEC_SIZE_BYTES,
            V2_REPLAY_SPEC_SHA256,
            "replay_spec_v2",
        ),
        (_V2_RUNNER, V2_RUNNER_SIZE_BYTES, V2_RUNNER_SHA256, "runner_v2"),
        (
            _V2_RUNNER_SPEC,
            V2_RUNNER_SPEC_SIZE_BYTES,
            V2_RUNNER_SPEC_SHA256,
            "runner_spec_v2",
        ),
    )
    for path, size, digest, label in checks:
        _verified_bytes(path, size, digest, label)
    return _verify_v2_receipt()


def _safe_primary_execution(function) -> dict[str, object]:
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
    if primary.get("executionStatus") != "RETURNED":
        return "BLOCKED", False, "corrected_primary_execution_error"
    primary_result = primary.get("result")
    replay_result = replay.get("result")
    if type(primary_result) is not dict or type(replay_result) is not dict:
        return "BLOCKED", False, "result_shape_invalid"
    if primary_result.get("status") != "GO":
        return "FAIL", False, "corrected_primary_numerical_failure"
    agreement = bool(
        primary_result.get("comparison_wire")
        and primary_result.get("comparison_wire")
        == replay_result.get("comparison_wire")
        and primary_result.get("comparison_sha256") == REPLAY_COMPARISON_SHA256
        and primary_result.get("comparison_sha256")
        == replay_result.get("comparison_sha256")
    )
    if not agreement:
        return "FAIL", False, "immutable_replay_v2_comparison_disagreement"
    return "GO", True, "corrected_primary_and_immutable_replay_v2_agree"


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
            "runnerObservedSha256": hashlib.sha256(runner_payload).hexdigest(),
            "runnerObservedSizeBytes": len(runner_payload),
            "runnerSpecSha256": RUNNER_SPEC_SHA256,
            "runnerSpecSizeBytes": RUNNER_SPEC_SIZE_BYTES,
        },
        "immutableReplayV2Binding": {
            "comparisonSha256": REPLAY_COMPARISON_SHA256,
            "receiptRawSha256": V2_RECEIPT_RAW_SHA256,
            "receiptSha256": V2_RECEIPT_SHA256,
            "receiptSizeBytes": V2_RECEIPT_SIZE_BYTES,
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
        "v2ResultRemainsFailed": True,
    }


def _seal(unsigned: dict[str, object]) -> tuple[dict[str, object], str]:
    payload = _canonical(unsigned)
    digest = hashlib.sha256(
        RECEIPT_DOMAIN + len(payload).to_bytes(8, "little") + payload
    ).hexdigest()
    full = dict(unsigned)
    full["receiptSha256"] = digest
    return full, digest


def _existing_v3_result() -> Path | None:
    pattern = "nhm2-spherical-boson-star-v2-core-successor-first-result-*.json"
    for path in sorted(_DOCS.glob(pattern)):
        try:
            value = json.loads(path.read_bytes())
        except Exception:
            continue
        if type(value) is dict and value.get("runnerVersion") == RUNNER_VERSION:
            return path
    return None


def _persist_once(receipt: dict[str, object], digest: str) -> Path:
    path = _DOCS / (
        "nhm2-spherical-boson-star-v2-core-successor-first-result-"
        f"{digest}.json"
    )
    payload = _canonical(receipt) + b"\n"
    try:
        with path.open("xb") as stream:
            stream.write(payload)
            stream.flush()
            os.fsync(stream.fileno())
    except FileExistsError as error:
        raise SuccessorV3AttemptRunnerError(
            "v3_authorization_already_consumed", path.name
        ) from error
    return path


def run_authorized_v3_attempt() -> tuple[Path, dict[str, object]]:
    """Consume the v3 authorization once and persist exactly one result."""

    existing = _existing_v3_result()
    if existing is not None:
        raise SuccessorV3AttemptRunnerError(
            "v3_authorization_already_consumed", existing.name
        )
    _, replay = _verify_all_frozen_bytes()
    primary_module = _load_verified_primary()
    primary = _safe_primary_execution(primary_module.run_frozen_n64_successor)
    receipt, digest = _seal(_receipt_unsigned(primary, replay))
    path = _persist_once(receipt, digest)
    return path, receipt


if __name__ == "__main__":
    result_path, result_receipt = run_authorized_v3_attempt()
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
