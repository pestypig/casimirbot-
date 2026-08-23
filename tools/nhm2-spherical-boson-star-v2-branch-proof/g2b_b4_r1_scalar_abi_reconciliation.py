"""Persist the authority-neutral G2B-B4-R1 scalar-ABI successor.

Program gate: G2B — replacement classical proof attempt
Workstream: authenticated classical branch closure
Capability or component: initializer scalar-role reconciliation
Current maturity: preregistered versioned parent repair
Target maturity: independently audited authority-neutral successor binding
Required frozen inputs: immutable M5/B1/B4 evidence and frozen scalar definitions
Required evidence: exact provenance, MPFR256 words, exclusive persistence and receipt
Stop/fail criteria: first binding, runtime, semantic, word, collision or readback error
Explicit non-goals: grid solve, retune, admission, replay, lamp or physical authority
Downstream gate unlocked: separately sealed fresh-output four-grid successor packet
"""

from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path
import platform
import stat
import struct
import sys
from typing import Final, NoReturn

import gmpy2


ROOT: Final[Path] = Path(__file__).resolve().parents[2]
TOOLS: Final[Path] = ROOT / "tools" / "nhm2-spherical-boson-star-v2-branch-proof"
TEST_PATH: Final[Path] = TOOLS / "test_g2b_b4_r1_scalar_abi_reconciliation.py"
CHECKPOINT_PATH: Final[Path] = ROOT / "docs" / "research" / "nhm2-spherical-boson-star-v2-g2b-b4-r1-execution-checkpoint.md"
INPUT_ROOT: Final[Path] = ROOT / "artifacts" / "nhm2-spherical-boson-star-v2-g2" / "g2b-b1-r1-initializer-v1"
OUTPUT_PARENT: Final[Path] = ROOT / "artifacts" / "nhm2-spherical-boson-star-v2-g2"
OUTPUT_ROOT: Final[Path] = OUTPUT_PARENT / "g2b-b4-r1-initializer-scalar-abi-v1"
RUNTIME_MANIFEST: Final[Path] = OUTPUT_PARENT / "g2b-b3-linux-runtime-v1" / "runtime-manifest.json"
IMAGE_ID: Final[str] = "sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1"
IMAGE_ID_ENV: Final[str] = "NHM2_G2B_IMAGE_ID"
EXECUTION_TOKEN_ENV: Final[str] = "NHM2_G2B_B4_R1_EXECUTION_TOKEN"
PACKET_SHA256: Final[str] = "4410fbf790bbea053106849c3a984f66b89d8968310ff967e7468a3572a702ec"
PACKET_SIZE_BYTES: Final[int] = 5_497
RECEIPT_DOMAIN: Final[bytes] = b"nhm2-spherical-boson-star-v2/g2b-b4-r1-scalar-abi-reconciliation/v1\n"
RUNTIME_DOMAIN: Final[bytes] = b"nhm2-spherical-boson-star-v2/g2b-linux-runtime/v1\n"
B4_TERMINAL_DOMAIN: Final[bytes] = b"nhm2-spherical-boson-star-v2/g2b-b4-terminal-receipt/v1\n"
B1_PERSISTENCE_DOMAIN: Final[bytes] = b"nhm2-spherical-boson-star-v2/g2b-b1-r2-initializer-persistence/v1\n"

STATIC_BINDINGS: Final[tuple[tuple[str, str, int, str], ...]] = (
    ("parent_decision", "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r1-scalar-abi-reconciliation.md", 5_497, PACKET_SHA256),
    ("newtonian_seed_definition", "shared/contracts/nhm2-spherical-boson-star-newtonian-seed.v1.ts", 34_700, "79629d45a4d49bcad2bffe0bbde9622ec31e1a3718ec78408767d568dd241304"),
    ("newtonian_operation_policy", "shared/contracts/nhm2-spherical-boson-star-newtonian-seed-operation-policy.v1.ts", 47_951, "ce14853e5c39aae3d46bc6d766a5e643d026441bf370e27bb56b4cabf9d47ade"),
    ("newtonian_primary_numerics", "shared/contracts/nhm2-spherical-boson-star-newtonian-seed-primary-numerics.v1.ts", 103_911, "f74627f96fef606852fe7c6fc772e45ca9bc5a454802a0986c2c204a4f65a2b0"),
    ("initializer_evaluator", "shared/contracts/nhm2-spherical-boson-star-v2-initializer-evaluator.v1.ts", 60_627, "05d0c327090a30065a453941ad4612f518818dd88f230864d4ef257c9e8a2be4"),
    ("branch_selection_policy", "shared/contracts/nhm2-spherical-boson-star-v2-branch-selection-numerics.v1.ts", 44_912, "d20e6eeef3d185ff938aa27cc83af87a201d76f986c63d77e0dbe72cf8600c82"),
    ("b1_parent_packet", "docs/research/nhm2-spherical-boson-star-v2-g2b-b1-entry-binding-and-initializer-closure.md", 6_573, "f76682d88435f3a6256f402bccb9ffca27afe28dce1ccb810a08609cf97e8291"),
    ("b1_materializer", "tools/nhm2-spherical-boson-star-v2-branch-proof/g2b_m5_r1_initializer_materializer.py", 25_304, "09c191ff5be53ce3829e97f9ce13659544d5856dbcaf470402157e786c72f724"),
    ("b1_r1_materializer", "tools/nhm2-spherical-boson-star-v2-branch-proof/g2b_m5_r1_initializer_materializer_r1.py", 14_481, "b96124285781c00a9f884fb162591c5f7bc6817081e6ddd74e2e41cab5ca3e1e"),
    ("m5_source", "tools/nhm2-spherical-boson-star-v2-branch-proof/newtonian_lambda_zero_g2b_m5_tail_power_api_repair.py", 16_568, "e9f9ee203d92262b77b77ae23323e420ebe459e62b52ac91943976a22ee70e4f"),
    ("m5_receipt", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-m5-tail-power-api-repair-v1.json", 309_486, "0996c9178bd25b71ce1ee26d2cc03b76bff71013ba5a4ff1e0d13179d2430cdf"),
    ("m5_r1_receipt", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-m5-r1-independent-admission-v1.json", 12_888, "41b1fcd261f17b722197ccfd3bcc2e116c1941194c63c52712a28d7f5cd80d83"),
    ("b1_persistence_receipt", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b1-r1-initializer-v1/persistence-receipt.json", 2_092, "b4d585e834782e173e1a3d96118eb5756c728f509739ac5e126b72c895399424"),
    ("b4_terminal_receipt", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-four-grid-v1/terminal-receipt.json", 2_222, "871dd86266e77b85ce55552e319ea39f29736ee6a4b4260bc51dc4527b95f9eb"),
    ("b4_result_record", "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-result-record.md", 3_999, "95145c90598d66556e23b63532a22f9dedad73d6b3851babf708687baa4dbff5"),
    ("linux_runtime_manifest", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b3-linux-runtime-v1/runtime-manifest.json", 2_220, "98cb6d63f94e3faf038621465f2417373b579b99e68d8f29473c9c3b79ee14c0"),
)

INPUT_PAYLOADS: Final[tuple[tuple[str, int, str], ...]] = (
    ("scalars.f64le", 72, "da88f738edbcc722b83a1c780fff4c32316f7e6145445b883ef28e31d2793fc1"),
    ("coefficients/core_L2_u.f64le", 1_024, "0a943efd5b010baaa899bc323f4c1490bf2c2c7359e3b5328995b48739e983fb"),
    ("coefficients/core_L2_V.f64le", 1_024, "ff766c6893e58d9f3f130bf1806bdef2e0ef284f676d426e297e149fa76d544c"),
    ("coefficients/tail_H.f64le", 256, "5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1"),
    ("coefficients/tail_Q.f64le", 256, "5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1"),
    ("initializer/core_L2_join_barrier.f64le", 32, "23f5fe0948668e598b5f1c469c7b987bc3fc08f94a122419b470202a406677b9"),
)
EXPECTED_WORDS: Final[tuple[str, ...]] = (
    "bfe626bcc563863f", "bff577dc22559451", "4039ea32f7793312",
    "40007f765a3009fd", "3ff2d379a0d0a3e0", "3fe815d49929ae09",
    "3fa0000000000000", "bf4626bcc563863f", "3feffa75d60dd448",
)
EXPECTED_SCALAR_SHA256: Final[str] = "47f2858a2332d5fd079eae07c6301b745e91d0219155528deb7158a79e1bd21a"
AUTHORITY_NAMES: Final[tuple[str, ...]] = (
    "candidateAdmission", "jointGeometryStateAuthority", "execution68FileAuthority",
    "proofAuthority", "executionAuthority", "replayAuthority", "pairAgreementAuthority",
    "diagnosticLampAuthority", "theoryGraphAuthority", "physicalAuthority",
    "physicalViability", "propulsionAuthority", "transportAuthority",
)


class G2BB4R1Error(RuntimeError):
    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> NoReturn:
    raise G2BB4R1Error(code, detail)


def _sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=True, allow_nan=False, sort_keys=True, separators=(",", ":")).encode("ascii")


def _verify(path: Path, size: int, digest: str, label: str) -> bytes:
    try:
        metadata = path.lstat()
        raw = path.read_bytes()
    except OSError as error:
        _fail("g2b_b4_r1_input_read_failed", f"{label}:{type(error).__name__}")
    if not stat.S_ISREG(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode):
        _fail("g2b_b4_r1_input_not_ordinary_file", label)
    if len(raw) != size or _sha256(raw) != digest:
        _fail("g2b_b4_r1_input_binding_drift", label)
    return raw


def _validated_json(raw: bytes, label: str) -> dict[str, object]:
    try:
        value = json.loads(raw)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        _fail("g2b_b4_r1_json_invalid", f"{label}:{type(error).__name__}")
    if type(value) is not dict or _canonical(value) != raw:
        _fail("g2b_b4_r1_json_noncanonical", label)
    return value


def _self_hash(unsigned: dict[str, object], domain: bytes, length_delimited: bool = True) -> str:
    raw = _canonical(unsigned)
    return _sha256(domain + (struct.pack("<Q", len(raw)) if length_delimited else b"") + raw)


def _verify_parent_receipts() -> None:
    b1 = _validated_json((INPUT_ROOT / "persistence-receipt.json").read_bytes(), "b1")
    b1_unsigned = dict(b1)
    b1_hash = b1_unsigned.pop("receiptSha256", None)
    if b1_hash != "207922166d28f02c44da29a115f439d6e4185d8f48681c8416e0d53bd1ccdf5c" or b1_hash != _self_hash(b1_unsigned, B1_PERSISTENCE_DOMAIN):
        _fail("g2b_b4_r1_b1_receipt_self_hash_invalid")
    if b1.get("status") != "PASS" or b1.get("noCandidateSolve") is not True or not all(value is False for value in b1.get("authorityLocks", {}).values()):
        _fail("g2b_b4_r1_b1_receipt_semantics_invalid")
    terminal_path = OUTPUT_PARENT / "g2b-b4-four-grid-v1" / "terminal-receipt.json"
    terminal = _validated_json(terminal_path.read_bytes(), "b4_terminal")
    terminal_unsigned = dict(terminal)
    terminal_hash = terminal_unsigned.pop("receiptSha256", None)
    if terminal_hash != "b5c47be2bef48e1e9b6a55667a8d83f712bcd552e2b0fcb5939dfc24f5065b0b" or terminal_hash != _self_hash(terminal_unsigned, B4_TERMINAL_DOMAIN):
        _fail("g2b_b4_r1_b4_terminal_self_hash_invalid")
    failure = terminal.get("firstFailure")
    if (terminal.get("status") != "FAIL" or terminal.get("attemptedLevelCount") != 0 or terminal.get("levelReceipts") != [] or type(failure) is not dict or failure.get("code") != "g2b_b4_initializer_scalar_recomputation_mismatch" or not all(value is False for value in terminal.get("authorityLocks", {}).values())):
        _fail("g2b_b4_r1_b4_terminal_semantics_invalid")


def _verify_checkpoint() -> dict[str, object]:
    raw = CHECKPOINT_PATH.read_bytes()
    source_raw = Path(__file__).read_bytes()
    test_raw = TEST_PATH.read_bytes()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as error:
        _fail("g2b_b4_r1_checkpoint_encoding_invalid", type(error).__name__)
    required = (
        f"| successor producer | {len(source_raw):,} | `{_sha256(source_raw)}` |",
        f"| preexecution tests | {len(test_raw):,} | `{_sha256(test_raw)}` |",
        PACKET_SHA256,
        IMAGE_ID,
        f"NHM2_G2B_IMAGE_ID={IMAGE_ID}",
        f"NHM2_G2B_B4_R1_EXECUTION_TOKEN={PACKET_SHA256}",
        "docker run --rm --network none",
        "The command may run once.",
    )
    if any(item not in text for item in required):
        _fail("g2b_b4_r1_checkpoint_binding_invalid")
    return {"role": "execution_checkpoint", "path": CHECKPOINT_PATH.relative_to(ROOT).as_posix(), "sizeBytes": len(raw), "rawSha256": _sha256(raw)}


def _verify_runtime() -> dict[str, object]:
    runtime = _validated_json(RUNTIME_MANIFEST.read_bytes(), "runtime")
    unsigned = dict(runtime)
    observed_hash = unsigned.pop("manifestSha256", None)
    if observed_hash != "f8770ea5e438e5f56388fe69457f0031c1e145fd44cf627ad4b07582bac718f6" or observed_hash != _self_hash(unsigned, RUNTIME_DOMAIN, False):
        _fail("g2b_b4_r1_runtime_manifest_self_hash_invalid")
    if os.environ.get(IMAGE_ID_ENV) != IMAGE_ID or os.environ.get(EXECUTION_TOKEN_ENV) != PACKET_SHA256:
        _fail("g2b_b4_r1_execution_environment_binding_invalid")
    if sys.platform != "linux" or platform.machine() != "x86_64" or platform.libc_ver() != ("glibc", "2.36") or struct.calcsize("P") != 8:
        _fail("g2b_b4_r1_live_platform_mismatch")
    if platform.python_version() != "3.12.11" or gmpy2.version() != "2.2.1" or gmpy2.mp_version() != "GMP 6.3.0" or gmpy2.mpfr_version() != "MPFR 4.2.1" or gmpy2.mpc_version() != "MPC 1.3.1":
        _fail("g2b_b4_r1_live_toolchain_mismatch")
    executable = Path(sys.executable).resolve(strict=True)
    python_binding = runtime.get("python")
    if type(python_binding) is not dict:
        _fail("g2b_b4_r1_runtime_python_binding_invalid")
    executable_raw = executable.read_bytes()
    if str(executable) != python_binding.get("resolvedExecutable") or len(executable_raw) != python_binding.get("sizeBytes") or _sha256(executable_raw) != python_binding.get("rawSha256"):
        _fail("g2b_b4_r1_live_python_executable_mismatch")
    for ordinal, binding in enumerate(runtime.get("loadedObjects", [])):
        if type(binding) is not dict:
            _fail("g2b_b4_r1_runtime_object_binding_invalid", str(ordinal))
        _verify(Path(str(binding["path"])), int(binding["sizeBytes"]), str(binding["rawSha256"]), f"runtime_object:{ordinal}")
    return runtime


def _mpfr_context(precision: int = 256):
    template = gmpy2.get_context().copy()
    template.precision = precision
    template.round = gmpy2.RoundToNearest
    template.emin = -1_073_741_823
    template.emax = 1_073_741_823
    template.subnormalize = False
    template.trap_underflow = template.trap_overflow = template.trap_inexact = False
    template.trap_invalid = template.trap_erange = template.trap_divzero = False
    template.underflow = template.overflow = template.inexact = False
    template.invalid = template.erange = template.divzero = False
    template.allow_complex = template.rational_division = template.allow_release_gil = False
    return gmpy2.context(template)


def _word(value: float) -> str:
    return struct.pack(">d", value).hex()


def derive_corrected_scalars(old_scalars: bytes, join: bytes, precision: int = 256) -> tuple[bytes, tuple[str, ...], dict[str, str]]:
    if len(old_scalars) != 72 or len(join) != 32:
        _fail("g2b_b4_r1_payload_length_invalid")
    old = struct.unpack("<9d", old_scalars)
    U, U1, V, V1 = struct.unpack("<4d", join)
    if any(not math.isfinite(value) for value in (*old, U, U1, V, V1)):
        _fail("g2b_b4_r1_nonfinite_input")
    with _mpfr_context(precision):
        nu0 = gmpy2.mpfr(old[0])
        Vc = gmpy2.mpfr(old[1])
        C64 = float(gmpy2.mpfr(V1) * gmpy2.mpfr(1024))
        C = gmpy2.mpfr(C64)
        kappa = gmpy2.sqrt(gmpy2.mpfr(-2) * nu0)
        sigma = (C / kappa) - gmpy2.mpfr(1)
        N0 = (gmpy2.mpfr(4) * gmpy2.const_pi()) * C
        lam = gmpy2.mpfr(1) / gmpy2.mpfr(32)
        nu_star = (lam * lam) * nu0
        w_seed = gmpy2.sqrt(gmpy2.mpfr(1) + gmpy2.mpfr(2) * nu_star)
        values = tuple(float(value) for value in (nu0, Vc, N0, C, kappa, sigma, lam, nu_star, w_seed))
        context = gmpy2.get_context()
        if context.invalid or context.divzero or context.overflow or context.underflow or context.erange:
            _fail("g2b_b4_r1_mpfr_exception_flag")
    words = tuple(_word(value) for value in values)
    raw = struct.pack("<9d", *values)
    diagnostics = {
        "legacyAmplitudeWord": _word(old[3]),
        "correctedCWord": _word(C64),
        "joinResidualWord": _word(V + C64 / 32.0),
        "joinUWord": _word(U),
        "joinU1Word": _word(U1),
    }
    return raw, words, diagnostics


def _ordinary_directory(path: Path, label: str) -> None:
    try:
        metadata = path.lstat()
    except OSError as error:
        _fail("g2b_b4_r1_directory_observation_failed", f"{label}:{type(error).__name__}")
    if not stat.S_ISDIR(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode):
        _fail("g2b_b4_r1_directory_not_ordinary", label)


def _write_exclusive(path: Path, raw: bytes) -> None:
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | (getattr(os, "O_BINARY", 0))
    try:
        descriptor = os.open(path, flags, 0o600)
        view = memoryview(raw)
        written = 0
        while written < len(view):
            count = os.write(descriptor, view[written:])
            if count <= 0:
                _fail("g2b_b4_r1_short_write", path.name)
            written += count
        os.fsync(descriptor)
        os.close(descriptor)
    except G2BB4R1Error:
        raise
    except OSError as error:
        _fail("g2b_b4_r1_exclusive_write_failed", f"{path.name}:{type(error).__name__}")


def execute_once() -> str:
    static_observed: list[dict[str, object]] = []
    for role, relative, size, digest in STATIC_BINDINGS:
        raw = _verify(ROOT / Path(relative), size, digest, role)
        static_observed.append({"role": role, "path": relative, "sizeBytes": len(raw), "rawSha256": _sha256(raw)})
    static_observed.append(_verify_checkpoint())
    _verify_parent_receipts()
    runtime = _verify_runtime()
    _ordinary_directory(OUTPUT_PARENT, "output_parent")
    if OUTPUT_ROOT.exists() or OUTPUT_ROOT.is_symlink():
        _fail("g2b_b4_r1_output_collision")
    inputs: list[bytes] = []
    input_observed: list[dict[str, object]] = []
    for ordinal, (relative, size, digest) in enumerate(INPUT_PAYLOADS):
        raw = _verify(INPUT_ROOT / Path(relative), size, digest, f"payload:{ordinal}")
        inputs.append(raw)
        input_observed.append({"ordinal": ordinal, "path": relative, "sizeBytes": size, "rawSha256": digest})
    corrected, words, diagnostics = derive_corrected_scalars(inputs[0], inputs[5])
    if words != EXPECTED_WORDS or len(corrected) != 72 or _sha256(corrected) != EXPECTED_SCALAR_SHA256:
        _fail("g2b_b4_r1_corrected_scalar_expectation_mismatch")
    if diagnostics["legacyAmplitudeWord"] != "400f088c787f495b" or diagnostics["joinResidualWord"] != "bc70000000000000":
        _fail("g2b_b4_r1_role_diagnostic_mismatch")
    outputs = [corrected, *inputs[1:]]
    try:
        OUTPUT_ROOT.mkdir()
        (OUTPUT_ROOT / "coefficients").mkdir()
        (OUTPUT_ROOT / "initializer").mkdir()
    except OSError as error:
        _fail("g2b_b4_r1_directory_creation_failed", type(error).__name__)
    output_observed: list[dict[str, object]] = []
    for ordinal, ((relative, size, old_digest), raw) in enumerate(zip(INPUT_PAYLOADS, outputs, strict=True)):
        expected_digest = EXPECTED_SCALAR_SHA256 if ordinal == 0 else old_digest
        if len(raw) != size or _sha256(raw) != expected_digest:
            _fail("g2b_b4_r1_output_prewrite_mismatch", str(ordinal))
        path = OUTPUT_ROOT / Path(relative)
        _write_exclusive(path, raw)
        readback = _verify(path, size, expected_digest, f"output:{ordinal}")
        output_observed.append({"ordinal": ordinal, "path": relative, "sizeBytes": len(readback), "rawSha256": _sha256(readback)})
    unsigned: dict[str, object] = {
        "artifactId": "nhm2.spherical_boson_star_v2.g2b_b4_r1_scalar_abi_reconciliation",
        "authorityLocks": {name: False for name in AUTHORITY_NAMES},
        "b1PersistenceReceiptSha256": "207922166d28f02c44da29a115f439d6e4185d8f48681c8416e0d53bd1ccdf5c",
        "b4TerminalReceiptSha256": "b5c47be2bef48e1e9b6a55667a8d83f712bcd552e2b0fcb5939dfc24f5065b0b",
        "correctedScalarWords": list(words),
        "decision": "SCALAR_ABI_ROLE_CONFLICT_RESOLVED_AND_SUCCESSOR_PERSISTED",
        "diagnostics": diagnostics,
        "fourGridExecutionAuthorized": False,
        "inputPayloadBindings": input_observed,
        "noCandidateSolve": True,
        "noGridSolve": True,
        "noRetune": True,
        "outputPayloadBindings": output_observed,
        "packetRawSha256": PACKET_SHA256,
        "readbackComplete": True,
        "runtimeImageId": IMAGE_ID,
        "runtimeManifestSha256": runtime["manifestSha256"],
        "sourceAndEvidenceBindings": static_observed,
        "status": "PASS",
        "successorPacketPreparationUnlocked": True,
        "totalPayloadSizeBytes": sum(len(raw) for raw in outputs),
    }
    receipt_hash = _self_hash(unsigned, RECEIPT_DOMAIN)
    full = dict(unsigned)
    full["receiptSha256"] = receipt_hash
    receipt_raw = _canonical(full)
    _write_exclusive(OUTPUT_ROOT / "receipt.json", receipt_raw)
    observed_receipt = _validated_json((OUTPUT_ROOT / "receipt.json").read_bytes(), "receipt_readback")
    observed_unsigned = dict(observed_receipt)
    observed_hash = observed_unsigned.pop("receiptSha256", None)
    if observed_hash != receipt_hash or observed_hash != _self_hash(observed_unsigned, RECEIPT_DOMAIN):
        _fail("g2b_b4_r1_receipt_readback_invalid")
    return receipt_hash


def _main(arguments: list[str]) -> int:
    if arguments != ["--execute-once"]:
        _fail("g2b_b4_r1_exact_command_required")
    print(execute_once())
    return 0


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))


__all__ = ["EXPECTED_SCALAR_SHA256", "EXPECTED_WORDS", "G2BB4R1Error", "derive_corrected_scalars", "execute_once"]
