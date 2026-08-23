"""Execute the frozen G2B-B4 four-grid diagnostic exactly once.

Program gate: G2B — replacement classical proof attempt
Workstream: authenticated classical branch closure
Capability or component: integrated N=64/96/128/256 branch execution
Current maturity: preregistered authority-neutral one-shot runner
Target maturity: exact first-failure evidence or authenticated four-grid PASS
Required frozen inputs: B4 packet, B1-R2 payloads, B3 runtime, policy and sources
Required evidence: independent initializers, ordered solves, states and receipts
Stop/fail criteria: first binding, runtime, math, persistence or chronology failure
Explicit non-goals: proof/candidate/replay/lamp/physical/propulsion authority
Downstream gate unlocked: vacuum-continuation implementation after bounded PASS
"""

from __future__ import annotations

from dataclasses import asdict, is_dataclass
import ctypes
import hashlib
import importlib.util
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
PACKET_PATH: Final[Path] = ROOT / "docs" / "research" / (
    "nhm2-spherical-boson-star-v2-g2b-b4-integrated-four-grid-execution.md"
)
PACKET_SHA256: Final[str] = (
    "2da6aeb214e67183cb65b9c5bee2b5f29d9dd6f2dd352b92510d444332ea1df7"
)
PACKET_SIZE_BYTES: Final[int] = 4_867
CHECKPOINT_PATH: Final[Path] = ROOT / "docs" / "research" / (
    "nhm2-spherical-boson-star-v2-g2b-b4-execution-checkpoint.md"
)
TEST_PATH: Final[Path] = Path(__file__).with_name(
    "test_g2b_b4_integrated_four_grid_runner.py"
)
OUTPUT_ROOT: Final[Path] = (
    ROOT / "artifacts" / "nhm2-spherical-boson-star-v2-g2" / "g2b-b4-four-grid-v1"
)
INITIALIZER_ROOT: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-b1-r1-initializer-v1"
)
PERSISTENCE_RECEIPT_PATH: Final[Path] = INITIALIZER_ROOT / "persistence-receipt.json"
RUNTIME_MANIFEST_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-b3-linux-runtime-v1"
    / "runtime-manifest.json"
)
CROSS_GRID_PATH: Final[Path] = Path(__file__).with_name(
    "radial_cross_grid_convergence.py"
)
BRANCH_SOURCE_ROOT: Final[Path] = (
    ROOT / "tools" / "nhm2-spherical-boson-star-branch"
)

IMAGE_ID: Final[str] = (
    "sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1"
)
LEVEL_NODE_COUNTS: Final[tuple[int, ...]] = (64, 96, 128, 256)
LEVEL_IDS: Final[tuple[str, ...]] = ("L0", "L1", "L2", "L3")
AMPLITUDE_SCHEDULE: Final[tuple[float, ...]] = tuple(
    2.0**exponent for exponent in range(-16, -9)
)
EXECUTION_TOKEN_ENV: Final[str] = "NHM2_G2B_B4_EXECUTION_TOKEN"
IMAGE_ID_ENV: Final[str] = "NHM2_G2B_IMAGE_ID"
TERMINAL_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2b-b4-terminal-receipt/v1\n"
)
PREEXECUTION_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2b-b4-preexecution-binding/v1\n"
)

STATIC_BINDINGS: Final[tuple[tuple[str, str, int, str], ...]] = (
    (
        "packet",
        "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-integrated-four-grid-execution.md",
        PACKET_SIZE_BYTES,
        PACKET_SHA256,
    ),
    (
        "branch_selection_policy",
        "shared/contracts/nhm2-spherical-boson-star-v2-branch-selection-numerics.v1.ts",
        44_912,
        "d20e6eeef3d185ff938aa27cc83af87a201d76f986c63d77e0dbe72cf8600c82",
    ),
    (
        "radial_source_ledger",
        "shared/contracts/nhm2-spherical-boson-star-v2-radial-primary-numerics.v1.ts",
        34_965,
        "dfec69750d345893a02483e1a13eb65c928966f0635e43ee559e0ed630634f10",
    ),
    (
        "initializer_evaluator_definition",
        "shared/contracts/nhm2-spherical-boson-star-v2-initializer-evaluator.v1.ts",
        60_627,
        "05d0c327090a30065a453941ad4612f518818dd88f230864d4ef257c9e8a2be4",
    ),
    (
        "initializer_persistence_receipt",
        "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b1-r1-initializer-v1/persistence-receipt.json",
        2_092,
        "b4d585e834782e173e1a3d96118eb5756c728f509739ac5e126b72c895399424",
    ),
    (
        "linux_runtime_manifest",
        "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b3-linux-runtime-v1/runtime-manifest.json",
        2_220,
        "98cb6d63f94e3faf038621465f2417373b579b99e68d8f29473c9c3b79ee14c0",
    ),
    (
        "cross_grid_evaluator",
        "tools/nhm2-spherical-boson-star-v2-branch-proof/radial_cross_grid_convergence.py",
        51_746,
        "dba7650a90a2f6b56ff95e63917e92e5e15465628cf7c5bdbff5ba97526b724f",
    ),
)

RADIAL_SOURCE_BINDINGS: Final[tuple[tuple[str, str, int, str], ...]] = (
    ("binary64_environment_boundary", "binary64_environment.py", 12_642, "ec973351fa34efd1c76b3358e6b87da91688a06a648e5299d0aa800767e11a47"),
    ("pointwise_radial_residual", "radial_residual.py", 10_222, "c22249155373344069772bfe2b4807385de6d7edc4454242d855b6f8611cd205"),
    ("analytic_local_residual_jacobian", "radial_residual_jacobian.py", 5_583, "5464f2010e051cf2487fbdd9f6879b355d7e7ede47e6bd3ea245916781a1119e"),
    ("interior_collocation_assembly", "radial_collocation_interior.py", 8_898, "253aee132897b6b11fa57df1b0864d9a821cc6dbce8b870dba3ab0e4f610290a"),
    ("finite_origin_series_x4", "radial_origin_series.py", 4_738, "ea76613c9cb5d3ad882d96786f98f85ee170f67e486672d97bc3add444a0d25d"),
    ("leading_tail_asymptotics", "radial_tail_asymptotics.py", 3_554, "b635e5d6f24d05f0c88b29dfa99a156c34968990f4948048a78bd98f2690b1b9"),
    ("mpfr256_compactified_lobatto_grid", "radial_lobatto_grid.py", 6_704, "ea424885abed4788d989cd228b7c4dd7b8907909bd4a0931b2e009d021d4d385"),
    ("compactified_square_bvp_assembly", "radial_compactified_system.py", 15_202, "dafe134453b5a2a328fbe9088b4e85593e9ea4ee231923fec4024d2f67ebb905"),
    ("deterministic_dense_lu", "deterministic_dense_lu.py", 8_033, "70b63cdf3517d0ae5f81217ca31d6d1d2a7450b76569e7693c3b8e9e59572ce2"),
    ("deterministic_newton_armijo", "deterministic_newton.py", 13_891, "60ad54e4376e43aa8c496e38fa9a495cab4d0a5001ca2515692a684889516618"),
    ("finite_amplitude_continuation", "radial_continuation.py", 12_316, "f244aa09926860ffc16099748f36928ed81cc1802abfa97bb63787d330398760"),
)

PAYLOAD_BINDINGS: Final[tuple[tuple[str, int, str], ...]] = (
    ("scalars.f64le", 72, "da88f738edbcc722b83a1c780fff4c32316f7e6145445b883ef28e31d2793fc1"),
    ("coefficients/core_L2_u.f64le", 1_024, "0a943efd5b010baaa899bc323f4c1490bf2c2c7359e3b5328995b48739e983fb"),
    ("coefficients/core_L2_V.f64le", 1_024, "ff766c6893e58d9f3f130bf1806bdef2e0ef284f676d426e297e149fa76d544c"),
    ("coefficients/tail_H.f64le", 256, "5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1"),
    ("coefficients/tail_Q.f64le", 256, "5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1"),
    ("initializer/core_L2_join_barrier.f64le", 32, "23f5fe0948668e598b5f1c469c7b987bc3fc08f94a122419b470202a406677b9"),
)

AUTHORITY_LOCKS: Final[dict[str, bool]] = {
    "candidateAdmission": False,
    "jointGeometryStateAuthority": False,
    "execution68FileAuthority": False,
    "proofAuthority": False,
    "executionAuthority": False,
    "replayAuthority": False,
    "pairAgreementAuthority": False,
    "diagnosticLampAuthority": False,
    "theoryGraphAuthority": False,
    "physicalAuthority": False,
    "physicalViability": False,
    "propulsionAuthority": False,
    "transportAuthority": False,
}


class G2BB4Error(RuntimeError):
    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> NoReturn:
    raise G2BB4Error(code, detail)


def _sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _canonical(value: object) -> bytes:
    if is_dataclass(value) and not isinstance(value, type):
        value = asdict(value)
    return json.dumps(
        value,
        ensure_ascii=True,
        allow_nan=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("ascii")


def _verify(path: Path, size: int, digest: str, label: str) -> bytes:
    try:
        metadata = path.lstat()
        raw = path.read_bytes()
    except OSError as error:
        _fail("g2b_b4_input_read_failed", f"{label}:{type(error).__name__}")
    if not stat.S_ISREG(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode):
        _fail("g2b_b4_input_not_ordinary_file", label)
    if len(raw) != size or _sha256(raw) != digest:
        _fail("g2b_b4_input_binding_drift", label)
    return raw


def _verify_static_closure() -> list[dict[str, object]]:
    observed: list[dict[str, object]] = []
    for role, relative, size, digest in STATIC_BINDINGS:
        raw = _verify(ROOT / Path(relative), size, digest, role)
        observed.append({"role": role, "path": relative, "sizeBytes": len(raw), "rawSha256": _sha256(raw)})
    for ordinal, (role, relative, size, digest) in enumerate(RADIAL_SOURCE_BINDINGS):
        raw = _verify(BRANCH_SOURCE_ROOT / relative, size, digest, f"radial:{ordinal}:{role}")
        observed.append({"role": role, "path": f"tools/nhm2-spherical-boson-star-branch/{relative}", "sizeBytes": len(raw), "rawSha256": _sha256(raw)})
    for ordinal, (relative, size, digest) in enumerate(PAYLOAD_BINDINGS):
        raw = _verify(INITIALIZER_ROOT / Path(relative), size, digest, f"payload:{ordinal}")
        observed.append({"role": f"initializer_payload_{ordinal}", "path": f"artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b1-r1-initializer-v1/{relative}", "sizeBytes": len(raw), "rawSha256": _sha256(raw)})
    observed.append(_verify_checkpoint())
    return observed


def _verify_checkpoint() -> dict[str, object]:
    try:
        metadata = CHECKPOINT_PATH.lstat()
        raw = CHECKPOINT_PATH.read_bytes()
        source_raw = Path(__file__).read_bytes()
        test_raw = TEST_PATH.read_bytes()
        text = raw.decode("utf-8")
    except (OSError, UnicodeDecodeError) as error:
        _fail("g2b_b4_checkpoint_read_failed", type(error).__name__)
    if not stat.S_ISREG(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode):
        _fail("g2b_b4_checkpoint_not_ordinary_file")
    required_literals = (
        f"| integrated runner | {len(source_raw):,} | `{_sha256(source_raw)}` |",
        f"| preexecution tests | {len(test_raw):,} | `{_sha256(test_raw)}` |",
        PACKET_SHA256,
        IMAGE_ID,
        f"-e {EXECUTION_TOKEN_ENV}={PACKET_SHA256}",
        f"-e {IMAGE_ID_ENV}={IMAGE_ID}",
        "docker run --rm --network none",
        "The command may run once.",
    )
    if any(literal not in text for literal in required_literals):
        _fail("g2b_b4_checkpoint_binding_invalid")
    return {
        "role": "execution_checkpoint",
        "path": CHECKPOINT_PATH.relative_to(ROOT).as_posix(),
        "sizeBytes": len(raw),
        "rawSha256": _sha256(raw),
    }


def _validated_json(raw: bytes, label: str) -> dict[str, object]:
    try:
        value = json.loads(raw)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        _fail("g2b_b4_json_invalid", f"{label}:{type(error).__name__}")
    if type(value) is not dict or _canonical(value) != raw:
        _fail("g2b_b4_json_noncanonical", label)
    return value


def _verify_receipts_and_runtime() -> tuple[dict[str, object], dict[str, object]]:
    persistence_raw = PERSISTENCE_RECEIPT_PATH.read_bytes()
    persistence = _validated_json(persistence_raw, "persistence")
    if (
        persistence.get("status") != "PASS"
        or persistence.get("decision") != "INITIALIZER_INSTANCE_PERSISTED_AND_REHASHED"
        or persistence.get("receiptSha256") != "207922166d28f02c44da29a115f439d6e4185d8f48681c8416e0d53bd1ccdf5c"
        or persistence.get("readbackComplete") is not True
        or persistence.get("noCandidateSolve") is not True
        or persistence.get("noRetune") is not True
        or persistence.get("totalPayloadSizeBytes") != 2_664
        or persistence.get("authorityLocks") != {
            "candidateAuthority": False,
            "diagnosticLampAuthority": False,
            "executionAuthority": False,
            "pairAgreementAuthority": False,
            "physicalAuthority": False,
            "proofAuthority": False,
            "propulsionAuthority": False,
            "replayAuthority": False,
            "theoryGraphAuthority": False,
            "transportAuthority": False,
        }
    ):
        _fail("g2b_b4_persistence_receipt_semantics_invalid")
    unsigned = dict(persistence)
    self_hash = unsigned.pop("receiptSha256")
    expected = _sha256(
        b"nhm2-spherical-boson-star-v2/g2b-b1-r2-initializer-persistence/v1\n"
        + struct.pack("<Q", len(_canonical(unsigned)))
        + _canonical(unsigned)
    )
    if self_hash != expected:
        _fail("g2b_b4_persistence_receipt_self_hash_invalid")

    runtime_raw = RUNTIME_MANIFEST_PATH.read_bytes()
    runtime = _validated_json(runtime_raw, "runtime")
    unsigned_runtime = dict(runtime)
    manifest_hash = unsigned_runtime.pop("manifestSha256", None)
    if manifest_hash != _sha256(
        b"nhm2-spherical-boson-star-v2/g2b-linux-runtime/v1\n"
        + _canonical(unsigned_runtime)
    ):
        _fail("g2b_b4_runtime_manifest_self_hash_invalid")
    if (
        runtime.get("platform") != "linux"
        or runtime.get("architecture") != "x86_64"
        or runtime.get("pointerBytes") != 8
        or runtime.get("libc") != {"family": "glibc", "version": "2.36"}
        or runtime.get("gmpy2") != {
            "gmpVersion": "GMP 6.3.0",
            "gmpy2Version": "2.2.1",
            "mpcVersion": "MPC 1.3.1",
            "mpfrVersion": "MPFR 4.2.1",
        }
        or runtime.get("authority") != {
            "candidateAuthority": False,
            "executionAuthority": False,
            "physicalAuthority": False,
            "proofAuthority": False,
            "propulsionAuthority": False,
            "replayAuthority": False,
            "theoryGraphAuthority": False,
            "transportAuthority": False,
        }
    ):
        _fail("g2b_b4_runtime_manifest_semantics_invalid")
    if sys.platform != "linux" or platform.machine() != "x86_64" or struct.calcsize("P") != 8:
        _fail("g2b_b4_live_runtime_platform_mismatch")
    if platform.libc_ver() != ("glibc", "2.36"):
        _fail("g2b_b4_live_runtime_libc_mismatch")
    if (
        platform.python_implementation() != "CPython"
        or platform.python_version() != "3.12.11"
        or gmpy2.version() != "2.2.1"
        or gmpy2.mp_version() != "GMP 6.3.0"
        or gmpy2.mpfr_version() != "MPFR 4.2.1"
        or gmpy2.mpc_version() != "MPC 1.3.1"
    ):
        _fail("g2b_b4_live_runtime_version_mismatch")
    python_binding = runtime.get("python")
    if type(python_binding) is not dict:
        _fail("g2b_b4_runtime_python_binding_invalid")
    executable = Path(sys.executable).resolve(strict=True)
    executable_raw = executable.read_bytes()
    if (
        str(executable) != python_binding.get("resolvedExecutable")
        or len(executable_raw) != python_binding.get("sizeBytes")
        or _sha256(executable_raw) != python_binding.get("rawSha256")
    ):
        _fail("g2b_b4_live_python_executable_mismatch")
    loaded = runtime.get("loadedObjects")
    if type(loaded) is not list or len(loaded) != 7:
        _fail("g2b_b4_runtime_loaded_object_inventory_invalid")
    for ordinal, binding in enumerate(loaded):
        if type(binding) is not dict or set(binding) != {"path", "rawSha256", "sizeBytes"}:
            _fail("g2b_b4_runtime_loaded_object_binding_invalid", str(ordinal))
        path = Path(str(binding["path"]))
        _verify(path, int(binding["sizeBytes"]), str(binding["rawSha256"]), f"runtime_object:{ordinal}")
    libc = ctypes.CDLL(None)
    for symbol in runtime["fenv"]["requiredSymbols"]:  # type: ignore[index]
        if not hasattr(libc, symbol):
            _fail("g2b_b4_live_fenv_symbol_missing", str(symbol))
    libc.fegetround.restype = ctypes.c_int
    if libc.fegetround() != 0:
        _fail("g2b_b4_live_rounding_mode_not_nearest")
    return persistence, runtime


def _decode_f64le(raw: bytes, count: int, label: str) -> tuple[float, ...]:
    if len(raw) != 8 * count:
        _fail("g2b_b4_payload_length_invalid", label)
    values = struct.unpack(f"<{count}d", raw)
    if any(not math.isfinite(value) or (value == 0.0 and math.copysign(1.0, value) < 0.0) for value in values):
        _fail("g2b_b4_payload_scalar_invalid", label)
    return tuple(0.0 if value == 0.0 else value for value in values)


def _mpfr_context():
    template = gmpy2.get_context().copy()
    template.precision = 256
    template.round = gmpy2.RoundToNearest
    template.emin = -1_073_741_823
    template.emax = 1_073_741_823
    template.subnormalize = False
    template.trap_underflow = False
    template.trap_overflow = False
    template.trap_inexact = False
    template.trap_invalid = False
    template.trap_erange = False
    template.trap_divzero = False
    template.underflow = False
    template.overflow = False
    template.inexact = False
    template.invalid = False
    template.erange = False
    template.divzero = False
    template.allow_complex = False
    template.rational_division = False
    template.allow_release_gil = False
    return gmpy2.context(template)


def _chebyshev_sum(coefficients: tuple[float, ...], t: object) -> object:
    one = gmpy2.mpfr(1)
    two = gmpy2.mpfr(2)
    previous = one
    current = t
    total = gmpy2.mpfr(coefficients[0]) * previous
    for index in range(1, len(coefficients)):
        total = total + gmpy2.mpfr(coefficients[index]) * current
        if index < len(coefficients) - 1:
            following = (two * t) * current - previous
            previous, current = current, following
    return total


def _load_initializer_payloads() -> tuple[tuple[float, ...], ...]:
    return tuple(
        _decode_f64le((INITIALIZER_ROOT / Path(relative)).read_bytes(), size // 8, relative)
        for relative, size, _digest in PAYLOAD_BINDINGS
    )


def _initializer_scalar_contract_observation() -> dict[str, object]:
    scalars = _load_initializer_payloads()[0]
    nu0, _vc, n0, c64, kappa64, sigma64, lambda64, nu_star64, w_seed64 = scalars
    with _mpfr_context():
        one = gmpy2.mpfr(1)
        two = gmpy2.mpfr(2)
        four = gmpy2.mpfr(4)
        thirty_two = gmpy2.mpfr(32)
        nu0_mp = gmpy2.mpfr(nu0)
        c_mp = gmpy2.mpfr(c64)
        kappa = gmpy2.sqrt(gmpy2.mpfr(-2) * nu0_mp)
        sigma = c_mp / kappa - one
        n0_mp = (four * gmpy2.const_pi()) * c_mp
        lambda_mp = one / thirty_two
        lambda_squared = lambda_mp * lambda_mp
        nu_star = lambda_squared * nu0_mp
        w_mp = gmpy2.sqrt(one + two * nu_star)
        derived = (float(n0_mp), float(kappa), float(sigma), float(lambda_mp), float(nu_star), float(w_mp))
        context = gmpy2.get_context()
        if context.invalid or context.divzero or context.overflow or context.underflow or context.erange:
            _fail("g2b_b4_initializer_scalar_graph_mpfr_exception_flag")
    supplied = (n0, kappa64, sigma64, lambda64, nu_star64, w_seed64)
    labels = ("N0", "kappa", "sigma", "lambda", "nu_star", "wSeed")
    comparisons = [
        {
            "field": label,
            "recomputedBinary64Word": _float_word(recomputed),
            "payloadBinary64Word": _float_word(payload),
            "bitEqual": struct.pack(">d", recomputed) == struct.pack(">d", payload),
        }
        for label, recomputed, payload in zip(labels, derived, supplied, strict=True)
    ]
    return {
        "operationGraph": "N0=RNDN(4*pi*set_d(C));kappa=RNDN(sqrt(-2*set_d(nu0)));sigma=RNDN(set_d(C)/kappa-1);lambda=RNDN(1/32);nu_star=RNDN(lambda^2*nu0);wSeed=RNDN(sqrt(1+2*nu_star))",
        "comparisons": comparisons,
        "allRequiredBitsEqual": all(item["bitEqual"] is True for item in comparisons),
        "firstMismatch": next((item["field"] for item in comparisons if item["bitEqual"] is False), None),
    }


def _validate_initializer_scalar_contract() -> dict[str, object]:
    observation = _initializer_scalar_contract_observation()
    if observation["allRequiredBitsEqual"] is not True:
        _fail("g2b_b4_initializer_scalar_recomputation_mismatch", _canonical(observation).decode("ascii"))
    return observation


def materialize_lowest_stage_state(rho: tuple[float, ...], state_type: type):
    """Materialize one grid independently from the exact persisted six payloads."""

    if type(rho) is not tuple or len(rho) not in LEVEL_NODE_COUNTS:
        _fail("g2b_b4_initializer_rho_shape_invalid")
    if (
        struct.pack(">d", rho[0]) != bytes(8)
        or struct.pack(">d", rho[-1]) != struct.pack(">d", 1.0)
        or any(type(value) is not float for value in rho)
        or any(not rho[index] > rho[index - 1] for index in range(1, len(rho)))
    ):
        _fail("g2b_b4_initializer_rho_domain_invalid")
    scalars, u_coeff, v_coeff, tail_h, tail_q, join = _load_initializer_payloads()
    nu0, _vc, n0, c64, kappa64, sigma64, lambda64, nu_star64, w_seed64 = scalars
    U64, U1_64, V64, V1_64 = join
    F0: list[float] = []
    F1: list[float] = []
    varphi: list[float] = []
    with _mpfr_context():
        one = gmpy2.mpfr(1)
        two = gmpy2.mpfr(2)
        four = gmpy2.mpfr(4)
        thirty_two = gmpy2.mpfr(32)
        radius = thirty_two
        nu0_mp = gmpy2.mpfr(nu0)
        c_mp = gmpy2.mpfr(c64)
        kappa = gmpy2.sqrt(gmpy2.mpfr(-2) * nu0_mp)
        sigma = c_mp / kappa - one
        lambda_mp = one / thirty_two
        lambda_squared = lambda_mp * lambda_mp
        nu_star = lambda_squared * nu0_mp
        w_mp = gmpy2.sqrt(one + two * nu_star)
        del four, n0, kappa64, sigma64, lambda64, nu_star64
        _validate_initializer_scalar_contract()
        H1 = gmpy2.mpfr(U64)
        kappa_r = kappa * radius
        H_y1 = ((-kappa_r + sigma) * H1) - radius * gmpy2.mpfr(U1_64)
        c_over_r = c_mp / radius
        Q1 = gmpy2.mpfr(V64) + c_over_r
        Q_y1 = (((gmpy2.mpfr(-2) * kappa_r) + two * sigma) * Q1 + c_over_r) - radius * gmpy2.mpfr(V1_64)
        for ordinal, rho64 in enumerate(rho):
            if rho64 == 1.0:
                base_u = gmpy2.mpfr(0)
                base_v = gmpy2.mpfr(0)
            else:
                rho_mp = gmpy2.mpfr(rho64)
                x_target = rho_mp / (one - rho_mp)
                x_base = lambda_mp * x_target
                comparison = gmpy2.cmp(x_base, radius)
                if comparison < 0:
                    rho_base = x_base / (one + x_base)
                    t = two * rho_base - one
                    base_u = _chebyshev_sum(u_coeff, t)
                    base_v = _chebyshev_sum(v_coeff, t)
                elif comparison == 0:
                    base_u = gmpy2.mpfr(U64)
                    base_v = gmpy2.mpfr(V64)
                else:
                    y = radius / x_base
                    t = two * y - one
                    Ah = _chebyshev_sum(tail_h, t)
                    Aq = _chebyshev_sum(tail_q, t)
                    y_minus_one = y - one
                    one_minus_y = one - y
                    one_minus_y_squared = one_minus_y * one_minus_y
                    H = H1 + H_y1 * y_minus_one + one_minus_y_squared * Ah
                    Q = Q1 + Q_y1 * y_minus_one + one_minus_y_squared * Aq
                    exponent = -(kappa * (x_base - radius)) + sigma * gmpy2.log(x_base / radius)
                    B = gmpy2.exp(exponent)
                    E = B * B
                    base_u = B * H
                    base_v = -(c_mp / x_base) + E * Q
            varphi_value = float(lambda_squared * base_u)
            F0_value = float(lambda_squared * base_v)
            F1_value = -F0_value
            for label, value in (("varphi", varphi_value), ("F0", F0_value), ("F1", F1_value)):
                if not math.isfinite(value):
                    _fail("g2b_b4_initializer_nonfinite", f"{label}:{ordinal}")
            varphi.append(0.0 if varphi_value == 0.0 else varphi_value)
            F0.append(0.0 if F0_value == 0.0 else F0_value)
            F1.append(0.0 if F1_value == 0.0 else F1_value)
        context = gmpy2.get_context()
        if context.invalid or context.divzero or context.overflow or context.underflow or context.erange:
            _fail("g2b_b4_initializer_mpfr_exception_flag")
    state = state_type(F0=tuple(F0), F1=tuple(F1), varphi=tuple(varphi), w=w_seed64)
    if struct.pack(">d", state.varphi[0]) != struct.pack(">d", 2.0**-16):
        _fail("g2b_b4_initializer_origin_amplitude_mismatch")
    if any(struct.pack(">d", values[-1]) != bytes(8) for values in (state.F0, state.F1, state.varphi)):
        _fail("g2b_b4_initializer_infinity_not_positive_zero")
    return state


def _load_execution_modules():
    branch_text = str(BRANCH_SOURCE_ROOT)
    if branch_text not in sys.path:
        sys.path.insert(0, branch_text)
    import radial_collocation_interior
    import radial_continuation
    import radial_lobatto_grid

    name = "_nhm2_g2b_b4_cross_grid"
    spec = importlib.util.spec_from_file_location(name, CROSS_GRID_PATH)
    if spec is None or spec.loader is None:
        _fail("g2b_b4_cross_grid_import_spec_invalid")
    cross_grid = importlib.util.module_from_spec(spec)
    sys.modules[name] = cross_grid
    spec.loader.exec_module(cross_grid)
    if (
        Path(radial_lobatto_grid.__file__).resolve() != (BRANCH_SOURCE_ROOT / "radial_lobatto_grid.py").resolve()
        or Path(radial_continuation.__file__).resolve() != (BRANCH_SOURCE_ROOT / "radial_continuation.py").resolve()
        or Path(radial_collocation_interior.__file__).resolve() != (BRANCH_SOURCE_ROOT / "radial_collocation_interior.py").resolve()
        or Path(cross_grid.__file__).resolve() != CROSS_GRID_PATH.resolve()
    ):
        _fail("g2b_b4_import_identity_mismatch")
    return radial_lobatto_grid, radial_continuation, radial_collocation_interior, cross_grid


def _float_word(value: float) -> str:
    return struct.pack(">d", value).hex()


def _pack_state(state: object) -> bytes:
    values = tuple(state.F0) + tuple(state.F1) + tuple(state.varphi) + (state.w,)
    if any(type(value) is not float or not math.isfinite(value) for value in values):
        _fail("g2b_b4_state_pack_invalid")
    return struct.pack(f"<{len(values)}d", *values)


def _write_exclusive(path: Path, raw: bytes) -> dict[str, object]:
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    if hasattr(os, "O_BINARY"):
        flags |= os.O_BINARY
    try:
        descriptor = os.open(path, flags, 0o600)
        view = memoryview(raw)
        offset = 0
        while offset < len(view):
            count = os.write(descriptor, view[offset:])
            if count <= 0:
                _fail("g2b_b4_short_write", path.name)
            offset += count
        os.fsync(descriptor)
        os.close(descriptor)
        observed = path.read_bytes()
    except G2BB4Error:
        raise
    except OSError as error:
        _fail("g2b_b4_write_failed", f"{path.name}:{type(error).__name__}")
    if observed != raw:
        _fail("g2b_b4_write_readback_mismatch", path.name)
    return {"path": path.relative_to(OUTPUT_ROOT).as_posix(), "sizeBytes": len(raw), "rawSha256": _sha256(raw)}


def _self_hashed_receipt(unsigned: dict[str, object], domain: bytes, field: str) -> bytes:
    raw = _canonical(unsigned)
    receipt = dict(unsigned)
    receipt[field] = _sha256(domain + struct.pack("<Q", len(raw)) + raw)
    return _canonical(receipt)


def _stage_metadata(stage: object, state_binding: dict[str, object]) -> dict[str, object]:
    return {
        "stageIndex": stage.stage_index,
        "originAmplitudeBinary64Word": _float_word(stage.origin_amplitude),
        "predictorSource": stage.predictor_source,
        "accepted": stage.accepted,
        "newtonFailureCode": stage.newton_failure_code,
        "newtonAttemptCount": stage.newton_attempt_count,
        "newtonAcceptedUpdateCount": stage.newton_accepted_update_count,
        "newtonResidualLinfBinary64Word": _float_word(stage.newton_residual_linf),
        "newtonScaledStepLinfBinary64Word": None if stage.newton_scaled_step_linf is None else _float_word(stage.newton_scaled_step_linf),
        "newtonConsecutivePassCount": stage.newton_consecutive_pass_count,
        "newtonAcceptedAlphaExponents": list(stage.newton_accepted_alpha_exponents),
        "unusedConstraintLinfBinary64Word": _float_word(stage.unused_constraint_linf),
        "wBinary64Word": _float_word(stage.w),
        "varphiNodesNonnegative": stage.varphi_nodes_nonnegative,
        "varphiFiniteNodesStrictlyPositive": stage.varphi_finite_nodes_strictly_positive,
        "varphiNodesNonincreasing": stage.varphi_nodes_nonincreasing,
        "stateBinding": state_binding,
    }


def _terminal_receipt(
    *, status: str, decision: str, first_failure: dict[str, object] | None,
    preexecution: dict[str, object], level_receipts: list[dict[str, object]],
    cross_grid_binding: dict[str, object] | None,
) -> bytes:
    unsigned: dict[str, object] = {
        "artifactId": "nhm2.spherical_boson_star_v2.g2b_b4_four_grid_terminal",
        "contractVersion": "nhm2_spherical_boson_star_v2_g2b_b4_four_grid_terminal/v1",
        "status": status,
        "decision": decision,
        "firstFailure": first_failure,
        "levelOrder": list(LEVEL_NODE_COUNTS),
        "attemptedLevelCount": len(level_receipts),
        "levelReceipts": level_receipts,
        "crossGridReceiptBinding": cross_grid_binding,
        "allFourLevelsCompleted": len(level_receipts) == 4 and all(item["completed"] is True for item in level_receipts),
        "allThreeAdjacentPairsEvaluated": cross_grid_binding is not None,
        "vacuumContinuationWorkUnlocked": status == "PASS",
        "noRetry": True,
        "noRetune": True,
        "coarseGridStateUsedAsPredictor": False,
        "authorityLocks": dict(AUTHORITY_LOCKS),
        "preexecutionBindingSha256": preexecution["receiptSha256"],
    }
    return _self_hashed_receipt(unsigned, TERMINAL_DOMAIN, "receiptSha256")


def _assert_output_boundary() -> None:
    parent = OUTPUT_ROOT.parent
    metadata = parent.lstat()
    if not stat.S_ISDIR(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode):
        _fail("g2b_b4_output_parent_invalid")
    if parent.resolve(strict=True).parent != (ROOT / "artifacts").resolve(strict=True):
        _fail("g2b_b4_output_parent_escape")
    if OUTPUT_ROOT.exists() or OUTPUT_ROOT.is_symlink():
        _fail("g2b_b4_output_collision")


def execute_once() -> dict[str, object]:
    if os.environ.get(EXECUTION_TOKEN_ENV) != PACKET_SHA256:
        _fail("g2b_b4_execution_token_invalid")
    if os.environ.get(IMAGE_ID_ENV) != IMAGE_ID:
        _fail("g2b_b4_image_identity_invalid")
    if os.environ.get("PYTHONHASHSEED") != "0" or os.environ.get("PYTHONDONTWRITEBYTECODE") != "1":
        _fail("g2b_b4_python_environment_not_frozen")
    if Path.cwd().resolve() != ROOT.resolve():
        _fail("g2b_b4_working_directory_invalid")
    _assert_output_boundary()
    source_bindings = _verify_static_closure()
    persistence, runtime = _verify_receipts_and_runtime()
    grid_module, continuation_module, state_module, cross_grid_module = _load_execution_modules()
    if continuation_module.ORIGIN_AMPLITUDE_SCHEDULE != AMPLITUDE_SCHEDULE:
        _fail("g2b_b4_amplitude_schedule_mismatch")

    try:
        OUTPUT_ROOT.mkdir(mode=0o700)
    except OSError as error:
        _fail("g2b_b4_output_root_create_failed", type(error).__name__)
    preexecution_unsigned: dict[str, object] = {
        "artifactId": "nhm2.spherical_boson_star_v2.g2b_b4_preexecution_binding",
        "contractVersion": "nhm2_spherical_boson_star_v2_g2b_b4_preexecution_binding/v1",
        "packetSha256": PACKET_SHA256,
        "imageId": IMAGE_ID,
        "initializerPersistenceReceiptSha256": persistence["receiptSha256"],
        "runtimeManifestSha256": runtime["manifestSha256"],
        "sourceAndPayloadBindings": source_bindings,
        "levelOrder": list(LEVEL_NODE_COUNTS),
        "amplitudeScheduleBinary64Words": [_float_word(value) for value in AMPLITUDE_SCHEDULE],
        "independentInitializerPerLevel": True,
        "coarseGridPredictorAllowed": False,
        "retryAllowed": False,
        "retuneAllowed": False,
        "authorityLocks": dict(AUTHORITY_LOCKS),
    }
    preexecution_raw = _self_hashed_receipt(preexecution_unsigned, PREEXECUTION_DOMAIN, "receiptSha256")
    preexecution = _validated_json(preexecution_raw, "generated_preexecution")
    _write_exclusive(OUTPUT_ROOT / "preexecution-binding.json", preexecution_raw)

    level_receipts: list[dict[str, object]] = []
    terminal_written = False
    try:
        _validate_initializer_scalar_contract()
        level_states: list[object] = []
        for level_index, node_count in enumerate(LEVEL_NODE_COUNTS):
            level_id = LEVEL_IDS[level_index]
            level_dir = OUTPUT_ROOT / f"level-{node_count}"
            level_dir.mkdir(mode=0o700)
            generated = grid_module.generate_compactified_lobatto_grid(node_count)
            rho = generated.differentiation.rho
            authenticated_rho = cross_grid_module.authenticated_lobatto_rho_snapshot(node_count)
            if len(rho) != node_count or any(struct.pack(">d", a) != struct.pack(">d", b) for a, b in zip(rho, authenticated_rho, strict=True)):
                _fail("g2b_b4_generated_grid_snapshot_mismatch", level_id)
            initializer = materialize_lowest_stage_state(rho, state_module.RadialCollocationState)
            initializer_binding = _write_exclusive(level_dir / "initializer-state.f64le", _pack_state(initializer))
            result = continuation_module.continue_spherical_radial_compactified_diagnostic(
                grid=generated.differentiation,
                lowest_stage_initial_state=initializer,
            )
            stage_receipts: list[dict[str, object]] = []
            for stage in result.stages:
                state_binding = _write_exclusive(level_dir / f"stage-{stage.stage_index:02d}-state.f64le", _pack_state(stage.state))
                metadata = _stage_metadata(stage, state_binding)
                metadata_binding = _write_exclusive(level_dir / f"stage-{stage.stage_index:02d}.json", _canonical(metadata))
                stage_receipts.append({"metadata": metadata, "metadataBinding": metadata_binding})
            level_receipt: dict[str, object] = {
                "levelId": level_id,
                "nodeCount": node_count,
                "initializerBinding": initializer_binding,
                "attemptedStageCount": result.attempted_stage_count,
                "acceptedStageCount": result.accepted_stage_count,
                "completed": result.completed,
                "failureStageIndex": result.failure_stage_index,
                "failureCode": result.failure_code,
                "stageReceipts": stage_receipts,
                "sameGridOnlyPredictors": all(
                    stage.predictor_source == ("lowest_stage_caller_initializer" if stage.stage_index == 0 else "previous_accepted_solution")
                    for stage in result.stages
                ),
                "coarseGridStateUsedAsPredictor": False,
            }
            level_binding = _write_exclusive(level_dir / "level-receipt.json", _canonical(level_receipt))
            level_receipt["levelReceiptBinding"] = level_binding
            level_receipts.append(level_receipt)
            if not result.completed or result.final_accepted_state is None:
                failure = {"code": result.failure_code or "g2b_b4_level_incomplete_without_code", "levelId": level_id, "nodeCount": node_count, "stageIndex": result.failure_stage_index}
                terminal_raw = _terminal_receipt(status="FAIL", decision="STOPPED_AT_FIRST_SOLVE_FAILURE", first_failure=failure, preexecution=preexecution, level_receipts=level_receipts, cross_grid_binding=None)
                _write_exclusive(OUTPUT_ROOT / "terminal-receipt.json", terminal_raw)
                terminal_written = True
                return _validated_json(terminal_raw, "generated_terminal")
            level_states.append(
                cross_grid_module.FrozenRadialLevelState(
                    rho=rho,
                    F0=result.final_accepted_state.F0,
                    F1=result.final_accepted_state.F1,
                    varphi=result.final_accepted_state.varphi,
                    w=result.final_accepted_state.w,
                )
            )
        cross_grid = cross_grid_module.evaluate_radial_cross_grid_convergence(
            level_64=level_states[0], level_96=level_states[1],
            level_128=level_states[2], level_256=level_states[3],
        )
        cross_grid_raw = _canonical(cross_grid)
        cross_grid_binding = _write_exclusive(OUTPUT_ROOT / "cross-grid-receipt.json", cross_grid_raw)
        cross_grid_binding["calculationReceiptSha256"] = cross_grid.calculation_receipt_sha256
        cross_grid_binding["allPairsWithinTolerance"] = cross_grid.all_pairs_within_tolerance
        if not cross_grid.all_pairs_within_tolerance:
            failure = {"code": "g2b_b4_cross_grid_tolerance_failure", "pairIndex": cross_grid.first_failing_pair_index, "pairId": cross_grid.first_failing_pair_id}
            terminal_raw = _terminal_receipt(status="FAIL", decision="STOPPED_AT_FIRST_CROSS_GRID_MATH_GATE", first_failure=failure, preexecution=preexecution, level_receipts=level_receipts, cross_grid_binding=cross_grid_binding)
        else:
            terminal_raw = _terminal_receipt(status="PASS", decision="FOUR_GRID_AND_THREE_PAIR_BOUNDED_PASS", first_failure=None, preexecution=preexecution, level_receipts=level_receipts, cross_grid_binding=cross_grid_binding)
        _write_exclusive(OUTPUT_ROOT / "terminal-receipt.json", terminal_raw)
        terminal_written = True
        return _validated_json(terminal_raw, "generated_terminal")
    except BaseException as error:
        if not terminal_written:
            failure = {
                "code": error.code if isinstance(error, G2BB4Error) else "g2b_b4_unhandled_execution_exception",
                "detail": error.detail if isinstance(error, G2BB4Error) else type(error).__name__,
                "levelIndex": len(level_receipts),
            }
            terminal_raw = _terminal_receipt(status="FAIL", decision="STOPPED_AT_FIRST_EXECUTION_EXCEPTION", first_failure=failure, preexecution=preexecution, level_receipts=level_receipts, cross_grid_binding=None)
            try:
                _write_exclusive(OUTPUT_ROOT / "terminal-receipt.json", terminal_raw)
            except BaseException:
                pass
        raise


def main() -> int:
    try:
        receipt = execute_once()
    except G2BB4Error as error:
        print(_canonical({"status": "FAIL", "code": error.code, "detail": error.detail}).decode("ascii"))
        return 2
    print(_canonical(receipt).decode("ascii"))
    return 0 if receipt["status"] == "PASS" else 3


if __name__ == "__main__":
    raise SystemExit(main())
