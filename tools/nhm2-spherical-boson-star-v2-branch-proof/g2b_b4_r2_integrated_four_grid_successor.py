"""Additive B4-R2 four-grid runner bound to the audited scalar-ABI successor.

Program gate: G2B — replacement classical proof attempt
Workstream: authenticated classical branch closure
Capability or component: fresh-output four-grid successor execution
Current maturity: preregistered additive wrapper over immutable B4
Target maturity: authenticated first failure or bounded four-grid PASS
Required frozen inputs: B4-R1 initializer, immutable B4 spine and admitted runtime
Required evidence: transitive bindings, exclusive output and terminal chronology
Stop/fail criteria: first prerequisite, grid, solve, pair or persistence failure
Explicit non-goals: solver/threshold/grid changes, retry, retune or authority
Downstream gate unlocked: separately sealed vacuum proof duty only after exact PASS
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
TOOLS: Final[Path] = Path(__file__).resolve().parent
IMMUTABLE_RUNNER: Final[Path] = TOOLS / "g2b_b4_integrated_four_grid_runner.py"
TEST_PATH: Final[Path] = TOOLS / "test_g2b_b4_r2_integrated_four_grid_successor.py"
PACKET_PATH: Final[Path] = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r2-integrated-four-grid-successor.md"
CHECKPOINT_PATH: Final[Path] = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r2-execution-checkpoint.md"
PACKET_SIZE_BYTES: Final[int] = 3_641
PACKET_SHA256: Final[str] = "ef8c9167bee5d5dcc265fbe0217baaf8a7d2868cfa62e7186997788868579f72"
IMMUTABLE_RUNNER_SIZE: Final[int] = 39_362
IMMUTABLE_RUNNER_SHA256: Final[str] = "f7045b47d61f7eb875c5ce8d9f3c60bbc424bf7c15690bb153029961adedf77f"
ARTIFACT_PARENT: Final[Path] = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2"
INITIALIZER_ROOT: Final[Path] = ARTIFACT_PARENT / "g2b-b4-r1-initializer-scalar-abi-v1"
SUCCESSOR_RECEIPT: Final[Path] = INITIALIZER_ROOT / "receipt.json"
LEGACY_RECEIPT: Final[Path] = ARTIFACT_PARENT / "g2b-b1-r1-initializer-v1/persistence-receipt.json"
OUTPUT_ROOT: Final[Path] = ARTIFACT_PARENT / "g2b-b4-r2-four-grid-v1"
SUCCESSOR_DOMAIN: Final[bytes] = b"nhm2-spherical-boson-star-v2/g2b-b4-r1-scalar-abi-reconciliation/v1\n"
SUCCESSOR_RECEIPT_SELF_HASH: Final[str] = "15c73b1e1ad1583dddf85f2276f661b3016704b113d02a26a995a49863d7e682"
SUCCESSOR_RECEIPT_RAW_HASH: Final[str] = "fb7b5a8e344289756f5c622994bb6d53e01187236322eac6c0559319e4c06590"
EXECUTION_TOKEN_ENV: Final[str] = "NHM2_G2B_B4_R2_EXECUTION_TOKEN"

PAYLOAD_BINDINGS: Final[tuple[tuple[str, int, str], ...]] = (
    ("scalars.f64le", 72, "47f2858a2332d5fd079eae07c6301b745e91d0219155528deb7158a79e1bd21a"),
    ("coefficients/core_L2_u.f64le", 1_024, "0a943efd5b010baaa899bc323f4c1490bf2c2c7359e3b5328995b48739e983fb"),
    ("coefficients/core_L2_V.f64le", 1_024, "ff766c6893e58d9f3f130bf1806bdef2e0ef284f676d426e297e149fa76d544c"),
    ("coefficients/tail_H.f64le", 256, "5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1"),
    ("coefficients/tail_Q.f64le", 256, "5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1"),
    ("initializer/core_L2_join_barrier.f64le", 32, "23f5fe0948668e598b5f1c469c7b987bc3fc08f94a122419b470202a406677b9"),
)


class G2BB4R2Error(RuntimeError):
    pass


def _fail(code: str, detail: str = "") -> NoReturn:
    raise G2BB4R2Error(f"{code}:{detail}" if detail else code)


def _sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=True, allow_nan=False, sort_keys=True, separators=(",", ":")).encode("ascii")


def _verify_file(path: Path, size: int, digest: str, label: str) -> bytes:
    metadata = path.lstat()
    raw = path.read_bytes()
    if not stat.S_ISREG(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode) or len(raw) != size or _sha(raw) != digest:
        _fail("g2b_b4_r2_binding_drift", label)
    return raw


def _load_immutable_runner():
    _verify_file(IMMUTABLE_RUNNER, IMMUTABLE_RUNNER_SIZE, IMMUTABLE_RUNNER_SHA256, "immutable_b4_runner")
    spec = importlib.util.spec_from_file_location("g2b_b4_r2_immutable_spine", IMMUTABLE_RUNNER)
    if spec is None or spec.loader is None:
        _fail("g2b_b4_r2_immutable_runner_spec_unavailable")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


B4 = _load_immutable_runner()
ORIGINAL_RECEIPT_RUNTIME_CHECK = B4._verify_receipts_and_runtime


def _verify_successor_receipt() -> dict[str, object]:
    raw = _verify_file(SUCCESSOR_RECEIPT, 7_212, SUCCESSOR_RECEIPT_RAW_HASH, "successor_receipt")
    try:
        receipt = json.loads(raw)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        _fail("g2b_b4_r2_successor_receipt_invalid", type(error).__name__)
    if type(receipt) is not dict or _canonical(receipt) != raw:
        _fail("g2b_b4_r2_successor_receipt_noncanonical")
    unsigned = dict(receipt)
    observed = unsigned.pop("receiptSha256", None)
    unsigned_raw = _canonical(unsigned)
    expected = _sha(SUCCESSOR_DOMAIN + struct.pack("<Q", len(unsigned_raw)) + unsigned_raw)
    if observed != SUCCESSOR_RECEIPT_SELF_HASH or observed != expected:
        _fail("g2b_b4_r2_successor_receipt_self_hash_invalid")
    if (
        receipt.get("status") != "PASS"
        or receipt.get("decision") != "SCALAR_ABI_ROLE_CONFLICT_RESOLVED_AND_SUCCESSOR_PERSISTED"
        or receipt.get("readbackComplete") is not True
        or receipt.get("noGridSolve") is not True
        or receipt.get("noCandidateSolve") is not True
        or receipt.get("noRetune") is not True
        or receipt.get("fourGridExecutionAuthorized") is not False
        or receipt.get("successorPacketPreparationUnlocked") is not True
        or receipt.get("totalPayloadSizeBytes") != 2_664
        or not all(value is False for value in receipt.get("authorityLocks", {}).values())
    ):
        _fail("g2b_b4_r2_successor_receipt_semantics_invalid")
    expected_inventory = {path: (size, digest) for path, size, digest in PAYLOAD_BINDINGS}
    observed_inventory = {
        path.relative_to(INITIALIZER_ROOT).as_posix(): (len(path.read_bytes()), _sha(path.read_bytes()))
        for path in INITIALIZER_ROOT.rglob("*") if path.is_file() and path.name != "receipt.json"
    }
    if observed_inventory != expected_inventory:
        _fail("g2b_b4_r2_successor_inventory_invalid")
    return receipt


def _successor_receipt_and_runtime() -> tuple[dict[str, object], dict[str, object]]:
    successor = _verify_successor_receipt()
    saved = B4.PERSISTENCE_RECEIPT_PATH
    try:
        B4.PERSISTENCE_RECEIPT_PATH = LEGACY_RECEIPT
        _legacy, runtime = ORIGINAL_RECEIPT_RUNTIME_CHECK()
    finally:
        B4.PERSISTENCE_RECEIPT_PATH = saved
    return successor, runtime


def configure() -> None:
    old_static = B4.STATIC_BINDINGS
    kept = tuple(binding for binding in old_static if binding[0] not in {"packet", "initializer_persistence_receipt"})
    B4.STATIC_BINDINGS = (
        ("packet", PACKET_PATH.relative_to(ROOT).as_posix(), PACKET_SIZE_BYTES, PACKET_SHA256),
        ("initializer_persistence_receipt", SUCCESSOR_RECEIPT.relative_to(ROOT).as_posix(), 7_212, SUCCESSOR_RECEIPT_RAW_HASH),
        ("immutable_b4_runner", IMMUTABLE_RUNNER.relative_to(ROOT).as_posix(), IMMUTABLE_RUNNER_SIZE, IMMUTABLE_RUNNER_SHA256),
        ("legacy_receipt_runtime_validation_dependency", LEGACY_RECEIPT.relative_to(ROOT).as_posix(), 2_092, "b4d585e834782e173e1a3d96118eb5756c728f509739ac5e126b72c895399424"),
        *kept,
    )
    B4.PACKET_PATH = PACKET_PATH
    B4.PACKET_SIZE_BYTES = PACKET_SIZE_BYTES
    B4.PACKET_SHA256 = PACKET_SHA256
    B4.CHECKPOINT_PATH = CHECKPOINT_PATH
    B4.TEST_PATH = TEST_PATH
    B4.OUTPUT_ROOT = OUTPUT_ROOT
    B4.INITIALIZER_ROOT = INITIALIZER_ROOT
    B4.PERSISTENCE_RECEIPT_PATH = SUCCESSOR_RECEIPT
    B4.PAYLOAD_BINDINGS = PAYLOAD_BINDINGS
    B4.EXECUTION_TOKEN_ENV = EXECUTION_TOKEN_ENV
    B4.__file__ = str(Path(__file__).resolve())
    B4._verify_receipts_and_runtime = _successor_receipt_and_runtime


def execute_once() -> dict[str, object]:
    configure()
    return B4.execute_once()


def _main(arguments: list[str]) -> int:
    if arguments:
        _fail("g2b_b4_r2_exact_command_required")
    try:
        receipt = execute_once()
    except B4.G2BB4Error as error:
        print(_canonical({"status": "FAIL", "code": error.code, "detail": error.detail}).decode("ascii"))
        return 2
    print(_canonical(receipt).decode("ascii"))
    return 0 if receipt["status"] == "PASS" else 3


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))


__all__ = ["B4", "G2BB4R2Error", "PAYLOAD_BINDINGS", "configure", "execute_once"]
