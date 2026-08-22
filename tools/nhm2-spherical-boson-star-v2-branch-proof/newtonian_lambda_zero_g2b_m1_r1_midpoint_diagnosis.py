"""One-shot analytic midpoint-screen consistency diagnosis for G2B-M1-R1."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import struct
import sys
from typing import Final, NoReturn


ROOT: Final[Path] = Path(__file__).resolve().parents[2]
PACKET_PATH: Final[Path] = (
    ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2b-m1-r1-midpoint-screen-review.md"
)
PACKET_SHA256: Final[str] = (
    "1efba1b06582be9f4883b50ae9ecb33a2303db7f26c5e08c5459bed2e4153112"
)
PACKET_SIZE_BYTES: Final[int] = 2_648
FAILED_RECEIPT_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-m1-mpfr256-global-center-v1.json"
)
FAILED_RECEIPT_SHA256: Final[str] = (
    "660993d0219629e8c296981fb17c0b09081c9c820ff0cd03937034ced468a582"
)
FAILED_RECEIPT_SIZE_BYTES: Final[int] = 2_882
FAILED_RECEIPT_SELF_SHA256: Final[str] = (
    "e2b1080103f2fe3b9d35e6c5f00bc4bf243b3d48409d649dbe3581c1191f105b"
)
FAILED_RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2b-m1-mpfr256-global-center/v1\n"
)
RUNNER_PATH: Final[Path] = Path(__file__).with_name(
    "newtonian_lambda_zero_g2b_m1_one_shot.py"
)
RUNNER_SHA256: Final[str] = (
    "550f35b86c62c634e84a5a693e4394f42e403f25cc890dcbb45d93b30322a2b7"
)
RUNNER_SIZE_BYTES: Final[int] = 20_818
OUTPUT_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-m1-r1-midpoint-screen-diagnosis-v1.json"
)
RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2b-m1-r1-midpoint-screen-diagnosis/v1\n"
)
LIMIT: Final[float] = 1.0e-10


class G2BM1R1DiagnosisError(RuntimeError):
    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> NoReturn:
    raise G2BM1R1DiagnosisError(code, detail)


def _sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _read_bound(path: Path, size: int, digest: str, label: str) -> bytes:
    raw = path.read_bytes()
    if len(raw) != size or _sha256(raw) != digest:
        _fail(f"{label}_binding_mismatch")
    return raw


def _canonical(value: object) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=True,
        allow_nan=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("ascii")


def _load_failed_receipt() -> dict[str, object]:
    raw = _read_bound(
        FAILED_RECEIPT_PATH,
        FAILED_RECEIPT_SIZE_BYTES,
        FAILED_RECEIPT_SHA256,
        "failed_receipt",
    )
    value = json.loads(raw)
    if (
        type(value) is not dict
        or value.get("receiptSha256") != FAILED_RECEIPT_SELF_SHA256
    ):
        _fail("failed_receipt_schema_invalid")
    unsigned = dict(value)
    del unsigned["receiptSha256"]
    unsigned_raw = _canonical(unsigned)
    observed = _sha256(
        FAILED_RECEIPT_DOMAIN + struct.pack("<Q", len(unsigned_raw)) + unsigned_raw
    )
    if observed != FAILED_RECEIPT_SELF_SHA256:
        _fail("failed_receipt_self_hash_invalid")
    if (
        value.get("decision") != "CALCULATION_FAIL"
        or value.get("firstFailure", {}).get("code")
        != "g2b_m1_midpoint_replay_failed"
    ):
        _fail("failed_receipt_decision_invalid")
    return value


def _load_runner():
    _read_bound(RUNNER_PATH, RUNNER_SIZE_BYTES, RUNNER_SHA256, "runner")
    specification = importlib.util.spec_from_file_location(
        "g2b_m1_r1_runner", RUNNER_PATH
    )
    if specification is None or specification.loader is None:
        _fail("runner_specification_unavailable")
    module = importlib.util.module_from_spec(specification)
    sys.modules[specification.name] = module
    specification.loader.exec_module(module)
    return module


def _polynomial(degree: int, x: float) -> tuple[float, float, float]:
    if degree == 0:
        return 1.0, 0.0, 0.0
    if degree == 1:
        return x, 1.0, 0.0
    if degree == 2:
        return x * x, 2 * x, 2.0
    if degree == 3:
        return x * x * x, 3 * x * x, 6 * x
    _fail("polynomial_degree_invalid")


def _diagnose() -> dict[str, object]:
    _read_bound(PACKET_PATH, PACKET_SIZE_BYTES, PACKET_SHA256, "packet")
    _load_failed_receipt()
    runner = _load_runner()
    engine = runner._load_engine()
    mesh = engine._output_mesh_binary64()
    records = []
    first_failure = None
    any_failure = False
    for degree in range(4):
        maxima = [0.0, 0.0, 0.0]
        maximum_ordinals = [0, 0, 0]
        for ordinal in range(len(mesh) - 1):
            left = mesh[ordinal]
            right = mesh[ordinal + 1]
            midpoint = (left + right) / 2
            y0, m0, _s0 = _polynomial(degree, left)
            y1, m1, _s1 = _polynomial(degree, right)
            observed = runner._float_hermite_jet(
                midpoint, left, right, y0, y1, m0, m1
            )
            expected = _polynomial(degree, midpoint)
            for derivative in range(3):
                error = abs(observed[derivative] - expected[derivative])
                if error > maxima[derivative]:
                    maxima[derivative] = error
                    maximum_ordinals[derivative] = ordinal
                if error > LIMIT and first_failure is None:
                    first_failure = {
                        "degree": degree,
                        "derivativeOrdinal": derivative,
                        "errorF64Hex": struct.pack(">d", error).hex(),
                        "intervalOrdinal": ordinal,
                        "widthF64Hex": struct.pack(">d", right - left).hex(),
                    }
                    any_failure = True
        records.append(
            {
                "degree": degree,
                "maximumErrorF64Hex": [
                    struct.pack(">d", value).hex() for value in maxima
                ],
                "maximumErrorIntervalOrdinals": maximum_ordinals,
            }
        )
    return {
        "analyticCorpus": records,
        "authorityLocks": {
            "candidateAuthority": False,
            "proofAuthority": False,
            "executionAuthority": False,
            "diagnosticLampAuthority": False,
            "physicalAuthority": False,
            "propulsionAuthority": False,
            "transportAuthority": False,
        },
        "decision": (
            "REPAIR_GLOBAL_BINARY64_MIDPOINT_SCREEN"
            if any_failure
            else "NO_REPAIR_M1_NUMERICAL_CONSTRUCTION_FAILED"
        ),
        "failedReceiptSha256": FAILED_RECEIPT_SELF_SHA256,
        "firstFailure": first_failure,
        "limitF64Hex": struct.pack(">d", LIMIT).hex(),
        "meshNodeCount": len(mesh),
        "noCandidateStateRead": True,
        "noCandidateSolve": True,
        "noRetune": True,
        "packetRawSha256": PACKET_SHA256,
    }


def execute_once() -> str:
    if OUTPUT_PATH.exists():
        _fail("diagnosis_output_collision")
    unsigned = _diagnose()
    raw = _canonical(unsigned)
    full = dict(unsigned)
    full["receiptSha256"] = _sha256(
        RECEIPT_DOMAIN + struct.pack("<Q", len(raw)) + raw
    )
    descriptor = os.open(
        OUTPUT_PATH,
        os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_BINARY", 0),
        0o600,
    )
    with os.fdopen(descriptor, "wb", closefd=True) as handle:
        handle.write(_canonical(full))
        handle.flush()
        os.fsync(handle.fileno())
    return full["receiptSha256"]


def _main(arguments: list[str]) -> int:
    if arguments != ["--execute-once"]:
        _fail("diagnosis_exact_command_required")
    sys.stdout.write(execute_once() + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))
