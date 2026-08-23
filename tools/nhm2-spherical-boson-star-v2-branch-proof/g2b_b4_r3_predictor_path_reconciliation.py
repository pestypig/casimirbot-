"""Persist the authority-neutral B4-R3 predictor/path reconciliation binding.

Program gate: G2B — replacement classical proof attempt
Workstream: authenticated classical branch closure
Capability or component: lowest-stage predictor and payload-path semantics
Current maturity: preregistered diagnosis after immutable B4-R2 failure
Target maturity: independently audited authority-neutral successor binding
Required frozen inputs: branch policy, evaluator, continuation/Newton and B4-R2
Required evidence: exact identity predictor, origin words, path/hash closure, receipt
Stop/fail criteria: first binding, formula, interface, path, word or runtime mismatch
Explicit non-goals: payload rewrite, grid, solve, continuation, retry or authority
Downstream gate unlocked: separately sealed fresh-output four-grid successor
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
TEST_PATH: Final[Path] = Path(__file__).with_name("test_g2b_b4_r3_predictor_path_reconciliation.py")
CHECKPOINT_PATH: Final[Path] = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r3-execution-checkpoint.md"
ARTIFACT_PARENT: Final[Path] = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2"
INITIALIZER_ROOT: Final[Path] = ARTIFACT_PARENT / "g2b-b4-r1-initializer-scalar-abi-v1"
OUTPUT_ROOT: Final[Path] = ARTIFACT_PARENT / "g2b-b4-r3-initializer-predictor-binding-v1"
PACKET_SHA256: Final[str] = "5cca41bfec505738de377dcb25b3f56fb9db44015707ed48340899c20f9fbe10"
PACKET_SIZE_BYTES: Final[int] = 5_402
IMAGE_ID: Final[str] = "sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1"
IMAGE_ID_ENV: Final[str] = "NHM2_G2B_IMAGE_ID"
TOKEN_ENV: Final[str] = "NHM2_G2B_B4_R3_EXECUTION_TOKEN"
RECEIPT_DOMAIN: Final[bytes] = b"nhm2-spherical-boson-star-v2/g2b-b4-r3-predictor-path-reconciliation/v1\n"
RUNTIME_DOMAIN: Final[bytes] = b"nhm2-spherical-boson-star-v2/g2b-linux-runtime/v1\n"
R2_TERMINAL_DOMAIN: Final[bytes] = b"nhm2-spherical-boson-star-v2/g2b-b4-terminal-receipt/v1\n"

STATIC_BINDINGS: Final[tuple[tuple[str, str, int, str], ...]] = (
    ("parent_decision", "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r3-initializer-predictor-and-path-reconciliation.md", 5_402, PACKET_SHA256),
    ("branch_selection_policy", "shared/contracts/nhm2-spherical-boson-star-v2-branch-selection-numerics.v1.ts", 44_912, "d20e6eeef3d185ff938aa27cc83af87a201d76f986c63d77e0dbe72cf8600c82"),
    ("initializer_evaluator", "shared/contracts/nhm2-spherical-boson-star-v2-initializer-evaluator.v1.ts", 60_627, "05d0c327090a30065a453941ad4612f518818dd88f230864d4ef257c9e8a2be4"),
    ("radial_primary_numerics", "shared/contracts/nhm2-spherical-boson-star-v2-radial-primary-numerics.v1.ts", 34_965, "dfec69750d345893a02483e1a13eb65c928966f0635e43ee559e0ed630634f10"),
    ("continuation_interface", "tools/nhm2-spherical-boson-star-branch/radial_continuation.py", 12_316, "f244aa09926860ffc16099748f36928ed81cc1802abfa97bb63787d330398760"),
    ("newton_interface", "tools/nhm2-spherical-boson-star-branch/deterministic_newton.py", 13_891, "60ad54e4376e43aa8c496e38fa9a495cab4d0a5001ca2515692a684889516618"),
    ("immutable_b4_spine", "tools/nhm2-spherical-boson-star-v2-branch-proof/g2b_b4_integrated_four_grid_runner.py", 39_362, "f7045b47d61f7eb875c5ce8d9f3c60bbc424bf7c15690bb153029961adedf77f"),
    ("b4_r2_result", "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r2-result-record.md", 3_904, "3ecadb378f0e96db0c41f4e4a0380764257ad0e42066ca62cefd2d84784c4da7"),
    ("b4_r2_preexecution", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r2-four-grid-v1/preexecution-binding.json", 7_262, "3d850a6f63cc22088920b18f013c5b9adbc7c094f28b94a4414e25653d1f9ed5"),
    ("b4_r2_terminal", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r2-four-grid-v1/terminal-receipt.json", 1_161, "16d9f8e2914076ed31e00b37df8b4fd135c81b36a45b9f4f092612c85420d474"),
    ("b4_r1_receipt", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r1-initializer-scalar-abi-v1/receipt.json", 7_212, "fb7b5a8e344289756f5c622994bb6d53e01187236322eac6c0559319e4c06590"),
    ("linux_runtime_manifest", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b3-linux-runtime-v1/runtime-manifest.json", 2_220, "98cb6d63f94e3faf038621465f2417373b579b99e68d8f29473c9c3b79ee14c0"),
)

PAYLOAD_BINDINGS: Final[tuple[tuple[str, int, str], ...]] = (
    ("scalars.f64le", 72, "47f2858a2332d5fd079eae07c6301b745e91d0219155528deb7158a79e1bd21a"),
    ("coefficients/core_L2_u.f64le", 1_024, "0a943efd5b010baaa899bc323f4c1490bf2c2c7359e3b5328995b48739e983fb"),
    ("coefficients/core_L2_V.f64le", 1_024, "ff766c6893e58d9f3f130bf1806bdef2e0ef284f676d426e297e149fa76d544c"),
    ("coefficients/tail_H.f64le", 256, "5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1"),
    ("coefficients/tail_Q.f64le", 256, "5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1"),
    ("initializer/core_L2_join_barrier.f64le", 32, "23f5fe0948668e598b5f1c469c7b987bc3fc08f94a122419b470202a406677b9"),
)

AUTHORITY_NAMES: Final[tuple[str, ...]] = (
    "candidateAdmission", "vacuumContinuationAuthority", "noFoldAuthority",
    "positivityAuthority", "boundaryProofAuthority", "jointGeometryStateAuthority",
    "execution68FileAuthority", "proofAuthority", "executionAuthority",
    "replayAuthority", "pairAgreementAuthority", "diagnosticLampAuthority",
    "theoryGraphAuthority", "physicalAuthority", "physicalViability",
    "propulsionAuthority", "transportAuthority",
)


class G2BB4R3Error(RuntimeError):
    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> NoReturn:
    raise G2BB4R3Error(code, detail)


def _sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=True, allow_nan=False, sort_keys=True, separators=(",", ":")).encode("ascii")


def _verify(path: Path, size: int, digest: str, label: str) -> bytes:
    try:
        metadata = path.lstat()
        raw = path.read_bytes()
    except OSError as error:
        _fail("g2b_b4_r3_input_read_failed", f"{label}:{type(error).__name__}")
    if not stat.S_ISREG(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode) or len(raw) != size or _sha(raw) != digest:
        _fail("g2b_b4_r3_input_binding_drift", label)
    return raw


def _self_hash(unsigned: dict[str, object], domain: bytes, length: bool = True) -> str:
    raw = _canonical(unsigned)
    return _sha(domain + (struct.pack("<Q", len(raw)) if length else b"") + raw)


def _word(value: float) -> str:
    return struct.pack(">d", value).hex()


def _context(precision: int = 256):
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
    return gmpy2.context(template)


def _chebyshev_at_minus_one(raw: bytes) -> object:
    coefficients = struct.unpack(f"<{len(raw) // 8}d", raw)
    total = gmpy2.mpfr(0)
    for ordinal, coefficient in enumerate(coefficients):
        term = gmpy2.mpfr(coefficient)
        total = total + (term if ordinal % 2 == 0 else -term)
    return total


def derive_origin_words(precision: int = 256) -> dict[str, str]:
    scalars = struct.unpack("<9d", (INITIALIZER_ROOT / "scalars.f64le").read_bytes())
    u_raw = (INITIALIZER_ROOT / "coefficients/core_L2_u.f64le").read_bytes()
    v_raw = (INITIALIZER_ROOT / "coefficients/core_L2_V.f64le").read_bytes()
    with _context(precision):
        lam = gmpy2.mpfr(1) / gmpy2.mpfr(32)
        lam2 = lam * lam
        base_u = _chebyshev_at_minus_one(u_raw)
        base_v = _chebyshev_at_minus_one(v_raw)
        varphi = float(lam2 * base_u)
        F0 = float(lam2 * base_v)
        values = {
            "baseU": _word(float(base_u)),
            "baseV": _word(float(base_v)),
            "F0": _word(F0),
            "F1": _word(-F0),
            "varphi": _word(varphi),
            "w": _word(scalars[8]),
            "firstTargetAmplitude": _word(2.0 ** -16),
            "terminalTargetAmplitude": _word(2.0 ** -10),
        }
        context = gmpy2.get_context()
        if context.invalid or context.divzero or context.overflow or context.underflow or context.erange:
            _fail("g2b_b4_r3_mpfr_exception_flag")
    return values


def _verify_semantics(policy: str, continuation: str, newton: str, b4: str) -> None:
    required_policy = (
        "materialize_same_frozen_initializer_evaluator_output_at_lambda_2^-5",
        "use_that_output_as_caller_initializer_for_A_2^-16",
        "run_complete_frozen_amplitude_schedule_through_A_2^-10",
        "alternateInitializerFallbackAllowed: false",
        'scalar: "varphi=lambda^2*u"',
    )
    if any(literal not in policy for literal in required_policy):
        _fail("g2b_b4_r3_policy_semantics_missing")
    required_continuation = (
        "frozen_grid, predictor = _validate_caller_shape(",
        "initial_state=predictor",
        "origin_amplitude=origin_amplitude",
        "predictor = newton.state",
    )
    if any(literal not in continuation for literal in required_continuation):
        _fail("g2b_b4_r3_continuation_semantics_missing")
    if "initial_state.varphi[0]" in newton or "initial_state.varphi[0]" in continuation:
        _fail("g2b_b4_r3_hidden_predictor_target_equality")
    if "state.varphi[0]) != struct.pack(\">d\", 2.0**-16)" not in b4:
        _fail("g2b_b4_r3_failed_assertion_not_located")


def _verify_runtime(runtime_raw: bytes) -> dict[str, object]:
    runtime = json.loads(runtime_raw)
    if type(runtime) is not dict or _canonical(runtime) != runtime_raw:
        _fail("g2b_b4_r3_runtime_noncanonical")
    unsigned = dict(runtime)
    observed = unsigned.pop("manifestSha256", None)
    if observed != "f8770ea5e438e5f56388fe69457f0031c1e145fd44cf627ad4b07582bac718f6" or observed != _self_hash(unsigned, RUNTIME_DOMAIN, False):
        _fail("g2b_b4_r3_runtime_self_hash_invalid")
    if os.environ.get(IMAGE_ID_ENV) != IMAGE_ID or os.environ.get(TOKEN_ENV) != PACKET_SHA256:
        _fail("g2b_b4_r3_execution_environment_invalid")
    if sys.platform != "linux" or platform.machine() != "x86_64" or platform.libc_ver() != ("glibc", "2.36"):
        _fail("g2b_b4_r3_live_platform_mismatch")
    if platform.python_version() != "3.12.11" or gmpy2.version() != "2.2.1" or gmpy2.mpfr_version() != "MPFR 4.2.1":
        _fail("g2b_b4_r3_live_toolchain_mismatch")
    return runtime


def _verify_checkpoint() -> dict[str, object]:
    raw = CHECKPOINT_PATH.read_bytes()
    text = raw.decode("utf-8")
    source_raw = Path(__file__).read_bytes()
    test_raw = TEST_PATH.read_bytes()
    required = (
        f"| reconciliation producer | {len(source_raw):,} | `{_sha(source_raw)}` |",
        f"| preexecution tests | {len(test_raw):,} | `{_sha(test_raw)}` |",
        PACKET_SHA256,
        IMAGE_ID,
        f"NHM2_G2B_IMAGE_ID={IMAGE_ID}",
        f"NHM2_G2B_B4_R3_EXECUTION_TOKEN={PACKET_SHA256}",
        "docker run --rm --network none",
        "The command may run once.",
    )
    if any(literal not in text for literal in required):
        _fail("g2b_b4_r3_checkpoint_binding_invalid")
    return {"role": "execution_checkpoint", "path": CHECKPOINT_PATH.relative_to(ROOT).as_posix(), "sizeBytes": len(raw), "rawSha256": _sha(raw)}


def _write_exclusive(path: Path, raw: bytes) -> None:
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_BINARY", 0)
    try:
        descriptor = os.open(path, flags, 0o600)
        written = 0
        while written < len(raw):
            count = os.write(descriptor, raw[written:])
            if count <= 0:
                _fail("g2b_b4_r3_short_write")
            written += count
        os.fsync(descriptor)
        os.close(descriptor)
    except G2BB4R3Error:
        raise
    except OSError as error:
        _fail("g2b_b4_r3_write_failed", type(error).__name__)


def execute_once() -> str:
    observed: list[dict[str, object]] = []
    source_raw: dict[str, bytes] = {}
    for role, relative, size, digest in STATIC_BINDINGS:
        raw = _verify(ROOT / relative, size, digest, role)
        source_raw[role] = raw
        observed.append({"role": role, "path": relative, "sizeBytes": size, "rawSha256": digest})
    observed.append(_verify_checkpoint())
    runtime = _verify_runtime(source_raw["linux_runtime_manifest"])
    _verify_semantics(
        source_raw["branch_selection_policy"].decode("utf-8"),
        source_raw["continuation_interface"].decode("utf-8"),
        source_raw["newton_interface"].decode("utf-8"),
        source_raw["immutable_b4_spine"].decode("utf-8"),
    )
    r2 = json.loads(source_raw["b4_r2_terminal"])
    unsigned_r2 = dict(r2)
    r2_hash = unsigned_r2.pop("receiptSha256", None)
    if r2_hash != "cafa0a8d0bc63ec3c8c166ef63e7be9cc52be278c79a0c112ed69763ab8a42f0" or r2_hash != _self_hash(unsigned_r2, R2_TERMINAL_DOMAIN):
        _fail("g2b_b4_r3_r2_terminal_self_hash_invalid")
    if r2.get("firstFailure", {}).get("code") != "g2b_b4_initializer_origin_amplitude_mismatch" or r2.get("attemptedLevelCount") != 0:
        _fail("g2b_b4_r3_r2_terminal_semantics_invalid")
    payloads: list[dict[str, object]] = []
    for ordinal, (relative, size, digest) in enumerate(PAYLOAD_BINDINGS):
        actual = INITIALIZER_ROOT / relative
        raw = _verify(actual, size, digest, f"payload:{ordinal}")
        emitted = actual.relative_to(ROOT).as_posix()
        if _verify(ROOT / emitted, size, digest, f"emitted:{ordinal}") != raw:
            _fail("g2b_b4_r3_emitted_path_readback_mismatch", str(ordinal))
        payloads.append({"ordinal": ordinal, "path": emitted, "sizeBytes": size, "rawSha256": digest})
    words = derive_origin_words()
    if words["baseU"] != "3ff0000000000000" or words["varphi"] != "3f50000000000000" or words["firstTargetAmplitude"] != "3ef0000000000000" or words["terminalTargetAmplitude"] != "3f50000000000000":
        _fail("g2b_b4_r3_origin_word_mismatch")
    if OUTPUT_ROOT.exists() or OUTPUT_ROOT.is_symlink():
        _fail("g2b_b4_r3_output_collision")
    OUTPUT_ROOT.mkdir(mode=0o700)
    unsigned: dict[str, object] = {
        "artifactId": "nhm2.spherical_boson_star_v2.g2b_b4_r3_predictor_path_reconciliation",
        "authorityLocks": {name: False for name in AUTHORITY_NAMES},
        "b4R2TerminalReceiptSha256": r2_hash,
        "decision": "IDENTITY_PREDICTOR_AND_ACTUAL_ROOT_PATHS_UNIQUELY_SUPPORTED",
        "firstTargetOriginEqualityRequiredBeforeNewton": False,
        "fourGridExecutionAuthorized": False,
        "gridGenerated": False,
        "initializerPayloadTransformation": "IDENTITY_NO_BYTE_CHANGES",
        "newtonExecuted": False,
        "noRetune": True,
        "originWords": words,
        "orderedPayloadBindings": payloads,
        "packetRawSha256": PACKET_SHA256,
        "pathEmissionFormula": "(INITIALIZER_ROOT.relative_to(ROOT)/payload_relative_path).as_posix()",
        "predictorPassedToContinuationUnchanged": True,
        "runtimeImageId": IMAGE_ID,
        "runtimeManifestSha256": runtime["manifestSha256"],
        "sourceBindings": observed,
        "status": "PASS",
        "successorPacketPreparationUnlocked": True,
    }
    receipt_hash = _self_hash(unsigned, RECEIPT_DOMAIN)
    full = dict(unsigned)
    full["receiptSha256"] = receipt_hash
    raw = _canonical(full)
    _write_exclusive(OUTPUT_ROOT / "receipt.json", raw)
    readback = _verify(OUTPUT_ROOT / "receipt.json", len(raw), _sha(raw), "receipt_readback")
    parsed = json.loads(readback)
    parsed_unsigned = dict(parsed)
    observed_hash = parsed_unsigned.pop("receiptSha256", None)
    if _canonical(parsed) != readback or observed_hash != receipt_hash or observed_hash != _self_hash(parsed_unsigned, RECEIPT_DOMAIN):
        _fail("g2b_b4_r3_receipt_readback_invalid")
    return receipt_hash


def _main(arguments: list[str]) -> int:
    if arguments != ["--execute-once"]:
        _fail("g2b_b4_r3_exact_command_required")
    print(execute_once())
    return 0


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))


__all__ = ["G2BB4R3Error", "derive_origin_words", "execute_once"]
