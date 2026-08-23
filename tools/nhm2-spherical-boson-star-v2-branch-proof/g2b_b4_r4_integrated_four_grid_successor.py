"""Execute the audited two-delta B4-R4 successor exactly once.

Program gate: G2B — replacement classical proof attempt
Workstream: authenticated classical branch closure
Capability or component: fresh-output four-grid successor execution
Current maturity: preregistered additive wrapper over immutable B4
Target maturity: authenticated first failure or bounded four-grid PASS
Required frozen inputs: B4-R1 payloads, B4-R3 decision, immutable B4 and runtime
Required evidence: transitive bindings, exact delta, exclusive output and audit
Stop/fail criteria: first prerequisite, grid, solve, pair or persistence failure
Explicit non-goals: payload/solver/grid/threshold changes, retry, retune or authority
Downstream gate unlocked: vacuum packet preparation only after exact PASS
"""

from __future__ import annotations

import hashlib
import importlib.util
import inspect
import json
from pathlib import Path
import stat
import struct
import sys
from typing import Final, NoReturn


ROOT: Final[Path] = Path(__file__).resolve().parents[2]
TOOLS: Final[Path] = Path(__file__).resolve().parent
IMMUTABLE_RUNNER: Final[Path] = TOOLS / "g2b_b4_integrated_four_grid_runner.py"
TEST_PATH: Final[Path] = TOOLS / "test_g2b_b4_r4_integrated_four_grid_successor.py"
PACKET_PATH: Final[Path] = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r4-integrated-four-grid-successor.md"
CHECKPOINT_PATH: Final[Path] = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r4-execution-checkpoint.md"
PACKET_SIZE_BYTES: Final[int] = 4_380
PACKET_SHA256: Final[str] = "cc4f81c0fb37bb84d35adb7bc84e3e9322d0f4b10186e0bb734d5d5afeba5acc"
IMMUTABLE_RUNNER_SIZE: Final[int] = 39_362
IMMUTABLE_RUNNER_SHA256: Final[str] = "f7045b47d61f7eb875c5ce8d9f3c60bbc424bf7c15690bb153029961adedf77f"
ARTIFACT_PARENT: Final[Path] = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2"
INITIALIZER_ROOT: Final[Path] = ARTIFACT_PARENT / "g2b-b4-r1-initializer-scalar-abi-v1"
SUCCESSOR_RECEIPT: Final[Path] = INITIALIZER_ROOT / "receipt.json"
R3_RECEIPT: Final[Path] = ARTIFACT_PARENT / "g2b-b4-r3-initializer-predictor-binding-v1/receipt.json"
LEGACY_RECEIPT: Final[Path] = ARTIFACT_PARENT / "g2b-b1-r1-initializer-v1/persistence-receipt.json"
OUTPUT_ROOT: Final[Path] = ARTIFACT_PARENT / "g2b-b4-r4-four-grid-v1"
SUCCESSOR_DOMAIN: Final[bytes] = b"nhm2-spherical-boson-star-v2/g2b-b4-r1-scalar-abi-reconciliation/v1\n"
R3_DOMAIN: Final[bytes] = b"nhm2-spherical-boson-star-v2/g2b-b4-r3-predictor-path-reconciliation/v1\n"
SUCCESSOR_RECEIPT_SELF_HASH: Final[str] = "15c73b1e1ad1583dddf85f2276f661b3016704b113d02a26a995a49863d7e682"
SUCCESSOR_RECEIPT_RAW_HASH: Final[str] = "fb7b5a8e344289756f5c622994bb6d53e01187236322eac6c0559319e4c06590"
R3_RECEIPT_SELF_HASH: Final[str] = "c067e2109f1aeba8bb3f1329d3ddf3c6db8663e1c35c4e35d443d86a896738d3"
R3_RECEIPT_RAW_HASH: Final[str] = "e5f22ce8fd9814d55395d1ea585c650a412520ccccaa1c51be072d2f68dcfd5b"
EXECUTION_TOKEN_ENV: Final[str] = "NHM2_G2B_B4_R4_EXECUTION_TOKEN"

PAYLOAD_BINDINGS: Final[tuple[tuple[str, int, str], ...]] = (
    ("scalars.f64le", 72, "47f2858a2332d5fd079eae07c6301b745e91d0219155528deb7158a79e1bd21a"),
    ("coefficients/core_L2_u.f64le", 1_024, "0a943efd5b010baaa899bc323f4c1490bf2c2c7359e3b5328995b48739e983fb"),
    ("coefficients/core_L2_V.f64le", 1_024, "ff766c6893e58d9f3f130bf1806bdef2e0ef284f676d426e297e149fa76d544c"),
    ("coefficients/tail_H.f64le", 256, "5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1"),
    ("coefficients/tail_Q.f64le", 256, "5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1"),
    ("initializer/core_L2_join_barrier.f64le", 32, "23f5fe0948668e598b5f1c469c7b987bc3fc08f94a122419b470202a406677b9"),
)

REMOVED_ASSERTION: Final[str] = '''    if struct.pack(">d", state.varphi[0]) != struct.pack(">d", 2.0**-16):
        _fail("g2b_b4_initializer_origin_amplitude_mismatch")
'''


class G2BB4R4Error(RuntimeError):
    pass


def _fail(code: str, detail: str = "") -> NoReturn:
    raise G2BB4R4Error(f"{code}:{detail}" if detail else code)


def _sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=True, allow_nan=False, sort_keys=True, separators=(",", ":")).encode("ascii")


def _self_hash(value: dict[str, object], domain: bytes) -> str:
    raw = _canonical(value)
    return _sha(domain + struct.pack("<Q", len(raw)) + raw)


def _verify_file(path: Path, size: int, digest: str, label: str) -> bytes:
    try:
        metadata = path.lstat()
        raw = path.read_bytes()
    except OSError as error:
        _fail("g2b_b4_r4_binding_read_failed", f"{label}:{type(error).__name__}")
    if not stat.S_ISREG(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode) or len(raw) != size or _sha(raw) != digest:
        _fail("g2b_b4_r4_binding_drift", label)
    return raw


def _validated_receipt(path: Path, size: int, raw_hash: str, self_hash: str, domain: bytes, label: str) -> dict[str, object]:
    raw = _verify_file(path, size, raw_hash, label)
    try:
        receipt = json.loads(raw)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        _fail("g2b_b4_r4_receipt_invalid", f"{label}:{type(error).__name__}")
    if type(receipt) is not dict or _canonical(receipt) != raw:
        _fail("g2b_b4_r4_receipt_noncanonical", label)
    unsigned = dict(receipt)
    observed = unsigned.pop("receiptSha256", None)
    if observed != self_hash or observed != _self_hash(unsigned, domain):
        _fail("g2b_b4_r4_receipt_self_hash_invalid", label)
    return receipt


def _load_immutable_runner():
    _verify_file(IMMUTABLE_RUNNER, IMMUTABLE_RUNNER_SIZE, IMMUTABLE_RUNNER_SHA256, "immutable_b4_runner")
    spec = importlib.util.spec_from_file_location("g2b_b4_r4_immutable_spine", IMMUTABLE_RUNNER)
    if spec is None or spec.loader is None:
        _fail("g2b_b4_r4_immutable_runner_spec_unavailable")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


B4 = _load_immutable_runner()
ORIGINAL_RECEIPT_RUNTIME_CHECK = B4._verify_receipts_and_runtime
CONFIGURED = False


def _verify_prerequisite_receipts() -> tuple[dict[str, object], dict[str, object]]:
    successor = _validated_receipt(
        SUCCESSOR_RECEIPT, 7_212, SUCCESSOR_RECEIPT_RAW_HASH,
        SUCCESSOR_RECEIPT_SELF_HASH, SUCCESSOR_DOMAIN, "b4_r1_receipt",
    )
    if (
        successor.get("status") != "PASS"
        or successor.get("decision") != "SCALAR_ABI_ROLE_CONFLICT_RESOLVED_AND_SUCCESSOR_PERSISTED"
        or successor.get("readbackComplete") is not True
        or successor.get("noGridSolve") is not True
        or successor.get("noRetune") is not True
        or successor.get("fourGridExecutionAuthorized") is not False
        or successor.get("successorPacketPreparationUnlocked") is not True
        or successor.get("totalPayloadSizeBytes") != 2_664
        or not all(value is False for value in successor.get("authorityLocks", {}).values())
    ):
        _fail("g2b_b4_r4_successor_receipt_semantics_invalid")

    r3 = _validated_receipt(R3_RECEIPT, 5_971, R3_RECEIPT_RAW_HASH, R3_RECEIPT_SELF_HASH, R3_DOMAIN, "b4_r3_receipt")
    if (
        r3.get("status") != "PASS"
        or r3.get("decision") != "IDENTITY_PREDICTOR_AND_ACTUAL_ROOT_PATHS_UNIQUELY_SUPPORTED"
        or r3.get("initializerPayloadTransformation") != "IDENTITY_NO_BYTE_CHANGES"
        or r3.get("firstTargetOriginEqualityRequiredBeforeNewton") is not False
        or r3.get("predictorPassedToContinuationUnchanged") is not True
        or r3.get("pathEmissionFormula") != "(INITIALIZER_ROOT.relative_to(ROOT)/payload_relative_path).as_posix()"
        or r3.get("originWords", {}).get("varphi") != "3f50000000000000"
        or r3.get("originWords", {}).get("firstTargetAmplitude") != "3ef0000000000000"
        or r3.get("gridGenerated") is not False
        or r3.get("newtonExecuted") is not False
        or r3.get("fourGridExecutionAuthorized") is not False
        or r3.get("noRetune") is not True
        or r3.get("successorPacketPreparationUnlocked") is not True
        or not all(value is False for value in r3.get("authorityLocks", {}).values())
    ):
        _fail("g2b_b4_r4_r3_receipt_semantics_invalid")

    expected_inventory = {path: (size, digest) for path, size, digest in PAYLOAD_BINDINGS}
    observed_inventory = {
        path.relative_to(INITIALIZER_ROOT).as_posix(): (len(path.read_bytes()), _sha(path.read_bytes()))
        for path in INITIALIZER_ROOT.rglob("*") if path.is_file() and path.name != "receipt.json"
    }
    if observed_inventory != expected_inventory:
        _fail("g2b_b4_r4_successor_inventory_invalid")
    return successor, r3


def _successor_receipt_and_runtime() -> tuple[dict[str, object], dict[str, object]]:
    successor, _r3 = _verify_prerequisite_receipts()
    saved = B4.PERSISTENCE_RECEIPT_PATH
    try:
        B4.PERSISTENCE_RECEIPT_PATH = LEGACY_RECEIPT
        _legacy, runtime = ORIGINAL_RECEIPT_RUNTIME_CHECK()
    finally:
        B4.PERSISTENCE_RECEIPT_PATH = saved
    return successor, runtime


def _actual_root_static_closure() -> list[dict[str, object]]:
    observed: list[dict[str, object]] = []
    for role, relative, size, digest in B4.STATIC_BINDINGS:
        raw = B4._verify(ROOT / Path(relative), size, digest, role)
        observed.append({"role": role, "path": relative, "sizeBytes": len(raw), "rawSha256": _sha(raw)})
    for ordinal, (role, relative, size, digest) in enumerate(B4.RADIAL_SOURCE_BINDINGS):
        raw = B4._verify(B4.BRANCH_SOURCE_ROOT / relative, size, digest, f"radial:{ordinal}:{role}")
        observed.append({"role": role, "path": f"tools/nhm2-spherical-boson-star-branch/{relative}", "sizeBytes": len(raw), "rawSha256": _sha(raw)})
    for ordinal, (relative, size, digest) in enumerate(PAYLOAD_BINDINGS):
        path = INITIALIZER_ROOT / Path(relative)
        emitted = path.relative_to(ROOT).as_posix()
        raw = B4._verify(ROOT / Path(emitted), size, digest, f"payload:{ordinal}")
        observed.append({"role": f"initializer_payload_{ordinal}", "path": emitted, "sizeBytes": len(raw), "rawSha256": _sha(raw)})
    observed.append(B4._verify_checkpoint())
    return observed


def _install_exact_predictor_delta() -> None:
    source = inspect.getsource(B4.materialize_lowest_stage_state)
    if source.count(REMOVED_ASSERTION) != 1:
        _fail("g2b_b4_r4_parent_assertion_identity_invalid")
    patched = source.replace(REMOVED_ASSERTION, "")
    if "g2b_b4_initializer_origin_amplitude_mismatch" in patched or "2.0**-16" in patched:
        _fail("g2b_b4_r4_predictor_delta_invalid")
    exec(compile(patched, str(Path(__file__).resolve()), "exec"), B4.__dict__)


def configure() -> None:
    global CONFIGURED
    if CONFIGURED:
        return
    old_static = B4.STATIC_BINDINGS
    kept = tuple(binding for binding in old_static if binding[0] not in {"packet", "initializer_persistence_receipt"})
    B4.STATIC_BINDINGS = (
        ("packet", PACKET_PATH.relative_to(ROOT).as_posix(), PACKET_SIZE_BYTES, PACKET_SHA256),
        ("initializer_persistence_receipt", SUCCESSOR_RECEIPT.relative_to(ROOT).as_posix(), 7_212, SUCCESSOR_RECEIPT_RAW_HASH),
        ("predictor_path_reconciliation_receipt", R3_RECEIPT.relative_to(ROOT).as_posix(), 5_971, R3_RECEIPT_RAW_HASH),
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
    B4._verify_static_closure = _actual_root_static_closure
    _install_exact_predictor_delta()
    CONFIGURED = True


def execute_once() -> dict[str, object]:
    configure()
    return B4.execute_once()


def _main(arguments: list[str]) -> int:
    if arguments:
        _fail("g2b_b4_r4_exact_command_required")
    try:
        receipt = execute_once()
    except B4.G2BB4Error as error:
        print(_canonical({"status": "FAIL", "code": error.code, "detail": error.detail}).decode("ascii"))
        return 2
    print(_canonical(receipt).decode("ascii"))
    return 0 if receipt["status"] == "PASS" else 3


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))


__all__ = ["B4", "G2BB4R4Error", "PAYLOAD_BINDINGS", "configure", "execute_once"]
