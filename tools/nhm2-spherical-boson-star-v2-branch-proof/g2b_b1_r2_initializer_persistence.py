"""Exclusively persist the frozen G2B-B1-R1 initializer result.

Program gate: G2B — replacement classical proof attempt
Workstream: authenticated classical branch closure
Capability or component: B1-R2 exact-byte persistence and readback
Current maturity: preregistered one-shot persistence implementation
Target maturity: content-addressed authority-neutral initializer instance
Required frozen inputs: B1-R2 packet, B1-R1 source/result and expected hashes
Required evidence: exclusive files, fsync, readback and self-hashed receipt
Stop/fail criteria: first input, path, collision, reproduction, write or readback error
Explicit non-goals: candidate solve, replay independence, retune or authority
Downstream gate unlocked: integrated four-grid execution packet
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path
import stat
import struct
import sys
from typing import Final, NoReturn


ROOT: Final[Path] = Path(__file__).resolve().parents[2]
PACKET_PATH: Final[Path] = (
    ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2b-b1-r2-initializer-persistence.md"
)
PACKET_SHA256: Final[str] = (
    "456389e91a2a488b1065aa6ab825bdf94f5918c70f545f58d874d0ffac85ca11"
)
PACKET_SIZE_BYTES: Final[int] = 3_434
R1_SOURCE_PATH: Final[Path] = Path(__file__).with_name(
    "g2b_m5_r1_initializer_materializer_r1.py"
)
R1_SOURCE_SHA256: Final[str] = (
    "b96124285781c00a9f884fb162591c5f7bc6817081e6ddd74e2e41cab5ca3e1e"
)
R1_SOURCE_SIZE_BYTES: Final[int] = 14_481
R1_RESULT_PATH: Final[Path] = (
    ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2b-b1-r1-result-record.md"
)
R1_RESULT_SHA256: Final[str] = (
    "ead2c8f0a02a009a0657fe45a716aeb1ebbd49e35a5e14fb92eb7d4c8b7fd97c"
)
R1_RESULT_SIZE_BYTES: Final[int] = 3_076
OUTPUT_PARENT: Final[Path] = (
    ROOT / "artifacts" / "nhm2-spherical-boson-star-v2-g2"
)
OUTPUT_ROOT: Final[Path] = OUTPUT_PARENT / "g2b-b1-r1-initializer-v1"
MATERIALIZATION_RECEIPT_SELF_SHA256: Final[str] = (
    "5d8d66da56daf03d530cd9e3ddcb618549b39a883ebca0c16140fd471451781a"
)
EXPECTED_PAYLOADS: Final[tuple[tuple[str, str, int], ...]] = (
    (
        "scalars.f64le",
        "da88f738edbcc722b83a1c780fff4c32316f7e6145445b883ef28e31d2793fc1",
        72,
    ),
    (
        "coefficients/core_L2_u.f64le",
        "0a943efd5b010baaa899bc323f4c1490bf2c2c7359e3b5328995b48739e983fb",
        1_024,
    ),
    (
        "coefficients/core_L2_V.f64le",
        "ff766c6893e58d9f3f130bf1806bdef2e0ef284f676d426e297e149fa76d544c",
        1_024,
    ),
    (
        "coefficients/tail_H.f64le",
        "5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1",
        256,
    ),
    (
        "coefficients/tail_Q.f64le",
        "5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1",
        256,
    ),
    (
        "initializer/core_L2_join_barrier.f64le",
        "23f5fe0948668e598b5f1c469c7b987bc3fc08f94a122419b470202a406677b9",
        32,
    ),
)
RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2b-b1-r2-initializer-persistence/v1\n"
)
AUTHORITY_NAMES: Final[tuple[str, ...]] = (
    "candidateAuthority",
    "proofAuthority",
    "executionAuthority",
    "replayAuthority",
    "pairAgreementAuthority",
    "diagnosticLampAuthority",
    "theoryGraphAuthority",
    "physicalAuthority",
    "propulsionAuthority",
    "transportAuthority",
)


class G2BB1R2PersistenceError(RuntimeError):
    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> NoReturn:
    raise G2BB1R2PersistenceError(code, detail)


def _sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _canonical(value: object) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=True,
        allow_nan=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("ascii")


def _verify(path: Path, size: int, digest: str, label: str) -> bytes:
    try:
        raw = path.read_bytes()
    except OSError as error:
        _fail("g2b_b1_r2_input_read_failed", f"{label}:{type(error).__name__}")
    if len(raw) != size or _sha256(raw) != digest:
        _fail("g2b_b1_r2_input_binding_drift", label)
    return raw


def _load_r1():
    _verify(R1_SOURCE_PATH, R1_SOURCE_SIZE_BYTES, R1_SOURCE_SHA256, "r1_source")
    spec = importlib.util.spec_from_file_location("g2b_b1_r2_frozen_r1", R1_SOURCE_PATH)
    if spec is None or spec.loader is None:
        _fail("g2b_b1_r2_r1_source_spec_unavailable")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def _ordinary_directory(path: Path, label: str) -> None:
    try:
        metadata = path.lstat()
    except OSError as error:
        _fail("g2b_b1_r2_directory_observation_failed", f"{label}:{type(error).__name__}")
    if not stat.S_ISDIR(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode):
        _fail("g2b_b1_r2_directory_not_ordinary", label)


def _assert_output_boundary() -> None:
    _ordinary_directory(OUTPUT_PARENT, "output_parent")
    expected_parent = OUTPUT_PARENT.resolve(strict=True)
    artifact_root = (ROOT / "artifacts").resolve(strict=True)
    if expected_parent.parent != artifact_root:
        _fail("g2b_b1_r2_output_parent_escape")
    if OUTPUT_ROOT.exists() or OUTPUT_ROOT.is_symlink():
        _fail("g2b_b1_r2_output_collision")


def _write_exclusive(path: Path, raw: bytes) -> None:
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    if hasattr(os, "O_BINARY"):
        flags |= os.O_BINARY
    try:
        descriptor = os.open(path, flags, 0o600)
    except OSError as error:
        _fail("g2b_b1_r2_exclusive_open_failed", f"{path.name}:{type(error).__name__}")
    failure: Exception | None = None
    try:
        view = memoryview(raw)
        written = 0
        while written < len(view):
            count = os.write(descriptor, view[written:])
            if count <= 0:
                _fail("g2b_b1_r2_short_write", path.name)
            written += count
        os.fsync(descriptor)
    except Exception as error:
        failure = error
    try:
        os.close(descriptor)
    except OSError as error:
        if failure is None:
            failure = error
    if failure is not None:
        if isinstance(failure, G2BB1R2PersistenceError):
            raise failure
        _fail("g2b_b1_r2_write_or_close_failed", f"{path.name}:{type(failure).__name__}")


def _receipt_self_hash(unsigned: dict[str, object]) -> str:
    raw = _canonical(unsigned)
    return _sha256(RECEIPT_DOMAIN + struct.pack("<Q", len(raw)) + raw)


def execute_once() -> str:
    _verify(PACKET_PATH, PACKET_SIZE_BYTES, PACKET_SHA256, "packet")
    _verify(R1_RESULT_PATH, R1_RESULT_SIZE_BYTES, R1_RESULT_SHA256, "r1_result")
    _assert_output_boundary()
    r1 = _load_r1()
    materialization = r1.materialize_initializer_from_m5_r1_r1()
    if (
        materialization.status != "PASS"
        or materialization.total_size_bytes != 2_664
        or materialization.receipt_sha256 != MATERIALIZATION_RECEIPT_SELF_SHA256
        or len(materialization.payloads) != len(EXPECTED_PAYLOADS)
    ):
        _fail("g2b_b1_r2_materialization_result_mismatch")
    for ordinal, (payload, expected) in enumerate(
        zip(materialization.payloads, EXPECTED_PAYLOADS, strict=True)
    ):
        path, digest, size = expected
        if (
            payload.ordinal != ordinal
            or payload.path != path
            or payload.raw_sha256 != digest
            or payload.size_bytes != size
            or len(payload.raw) != size
            or _sha256(payload.raw) != digest
        ):
            _fail("g2b_b1_r2_payload_reproduction_mismatch", str(ordinal))
    try:
        OUTPUT_ROOT.mkdir()
        (OUTPUT_ROOT / "coefficients").mkdir()
        (OUTPUT_ROOT / "initializer").mkdir()
    except OSError as error:
        _fail("g2b_b1_r2_directory_creation_failed", type(error).__name__)
    for payload in materialization.payloads:
        _write_exclusive(OUTPUT_ROOT / Path(payload.path), payload.raw)
    materialization_path = OUTPUT_ROOT / "receipt.json"
    _write_exclusive(materialization_path, materialization.receipt_canonical_json)
    observed: list[dict[str, object]] = []
    for ordinal, (path, digest, size) in enumerate(EXPECTED_PAYLOADS):
        raw = _verify(OUTPUT_ROOT / Path(path), size, digest, f"payload:{ordinal}")
        observed.append(
            {
                "ordinal": ordinal,
                "path": path,
                "rawSha256": _sha256(raw),
                "sizeBytes": len(raw),
            }
        )
    materialization_raw = materialization_path.read_bytes()
    if materialization_raw != materialization.receipt_canonical_json:
        _fail("g2b_b1_r2_materialization_receipt_readback_mismatch")
    try:
        parsed = json.loads(materialization_raw)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        _fail("g2b_b1_r2_materialization_receipt_parse_failed", type(error).__name__)
    if (
        type(parsed) is not dict
        or _canonical(parsed) != materialization_raw
        or parsed.get("receiptSha256") != MATERIALIZATION_RECEIPT_SELF_SHA256
    ):
        _fail("g2b_b1_r2_materialization_receipt_invalid")
    unsigned: dict[str, object] = {
        "artifactId": "nhm2.spherical_boson_star_v2.g2b_b1_r2_initializer_persistence",
        "authorityLocks": {name: False for name in AUTHORITY_NAMES},
        "candidateExecuted": False,
        "decision": "INITIALIZER_INSTANCE_PERSISTED_AND_REHASHED",
        "materializationReceiptRawSha256": _sha256(materialization_raw),
        "materializationReceiptSha256": MATERIALIZATION_RECEIPT_SELF_SHA256,
        "materializationReceiptSizeBytes": len(materialization_raw),
        "noCandidateSolve": True,
        "noRetune": True,
        "orderedPayloadBindings": observed,
        "packetRawSha256": PACKET_SHA256,
        "r1ResultRawSha256": R1_RESULT_SHA256,
        "r1SourceRawSha256": R1_SOURCE_SHA256,
        "readbackComplete": True,
        "runtimeDisjointIndependentReplayAuthority": False,
        "status": "PASS",
        "totalPayloadSizeBytes": 2_664,
    }
    receipt_sha256 = _receipt_self_hash(unsigned)
    full = dict(unsigned)
    full["receiptSha256"] = receipt_sha256
    _write_exclusive(OUTPUT_ROOT / "persistence-receipt.json", _canonical(full))
    return receipt_sha256


def _main(arguments: list[str]) -> int:
    if arguments != ["--execute-once"]:
        _fail("g2b_b1_r2_exact_command_required")
    print(execute_once())
    return 0


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))


__all__ = ["G2BB1R2PersistenceError", "execute_once"]
