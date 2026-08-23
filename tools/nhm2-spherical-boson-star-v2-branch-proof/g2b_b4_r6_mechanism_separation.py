"""Run the sealed B4-R6 no-solve mechanism-separation benchmark once.

Program gate: G2B — replacement classical proof attempt
Workstream: authenticated classical branch closure
Capability or component: coordinate/scaling/precision/discretization benchmark
Current maturity: preregistered authority-neutral benchmark
Target maturity: independently audited unique-family or explicit stop decision
Required frozen inputs: B4-R4 state, B4-R5 receipt, evaluator/Jacobian and MPFR
Required evidence: four coordinates, equilibration, MPFR reassembly and spectrum
Stop/fail criteria: first binding, reconstruction, factor, MPFR or audit mismatch
Explicit non-goals: Newton/continuation/candidate solve, update, retry or retune
Downstream gate unlocked: at most one separately sealed proposal after uniqueness
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
BRANCH_ROOT: Final[Path] = ROOT / "tools/nhm2-spherical-boson-star-branch"
PACKET: Final[Path] = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r6-mechanism-separation-benchmark.md"
CHECKPOINT: Final[Path] = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r6-execution-checkpoint.md"
TEST_PATH: Final[Path] = Path(__file__).with_name("test_g2b_b4_r6_mechanism_separation.py")
PACKET_SIZE: Final[int] = 7_297
PACKET_SHA256: Final[str] = "8c9880df19fa22b659e658f3229bca67f732958d02c40e90a58741316aad477b"
STATE_PATH: Final[Path] = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r4-four-grid-v1/level-64/stage-00-state.f64le"
R5_PATH: Final[Path] = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r5-terminal-newton-diagnosis-v1/receipt.json"
OUTPUT_ROOT: Final[Path] = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r6-mechanism-separation-v1"
OUTPUT_PATH: Final[Path] = OUTPUT_ROOT / "receipt.json"
IMAGE_ID: Final[str] = "sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1"
IMAGE_ENV: Final[str] = "NHM2_G2B_IMAGE_ID"
TOKEN_ENV: Final[str] = "NHM2_G2B_B4_R6_EXECUTION_TOKEN"
RECEIPT_DOMAIN: Final[bytes] = b"nhm2-spherical-boson-star-v2/g2b-b4-r6-mechanism-separation/v1\n"
R5_RECEIPT_DOMAIN: Final[bytes] = b"nhm2-spherical-boson-star-v2/g2b-b4-r5-terminal-newton-diagnosis/v1\n"
TARGET_AMPLITUDE: Final[float] = 2.0**-16

FROZEN_BINDINGS: Final[tuple[tuple[str, str, int, str], ...]] = (
    ("packet", "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r6-mechanism-separation-benchmark.md", PACKET_SIZE, PACKET_SHA256),
    ("b4_r4_terminal_state", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r4-four-grid-v1/level-64/stage-00-state.f64le", 1_544, "972b05243ee51e7fa9c19a525e050f7302001c68a5187428ccff43a7aebf5d9c"),
    ("b4_r5_receipt", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r5-terminal-newton-diagnosis-v1/receipt.json", 20_509, "645073d238da325db5e727825fcdf4705a08d5e7ae6951be5616d9cc6826fb52"),
    ("binary64_environment", "tools/nhm2-spherical-boson-star-branch/binary64_environment.py", 12_642, "ec973351fa34efd1c76b3358e6b87da91688a06a648e5299d0aa800767e11a47"),
    ("lobatto_grid", "tools/nhm2-spherical-boson-star-branch/radial_lobatto_grid.py", 6_704, "ea424885abed4788d989cd228b7c4dd7b8907909bd4a0931b2e009d021d4d385"),
    ("compactified_system", "tools/nhm2-spherical-boson-star-branch/radial_compactified_system.py", 15_202, "dafe134453b5a2a328fbe9088b4e85593e9ea4ee231923fec4024d2f67ebb905"),
    ("collocation_state", "tools/nhm2-spherical-boson-star-branch/radial_collocation_interior.py", 8_898, "253aee132897b6b11fa57df1b0864d9a821cc6dbce8b870dba3ab0e4f610290a"),
    ("radial_residual", "tools/nhm2-spherical-boson-star-branch/radial_residual.py", 10_222, "c22249155373344069772bfe2b4807385de6d7edc4454242d855b6f8611cd205"),
    ("radial_residual_jacobian", "tools/nhm2-spherical-boson-star-branch/radial_residual_jacobian.py", 5_583, "5464f2010e051cf2487fbdd9f6879b355d7e7ede47e6bd3ea245916781a1119e"),
)

AUTHORITY_LOCKS: Final[dict[str, bool]] = {
    "candidateAdmission": False, "vacuumContinuationAuthority": False,
    "proofAuthority": False, "executionAuthority": False,
    "execution68FileAuthority": False, "replayAuthority": False,
    "pairAgreementAuthority": False, "diagnosticLampAuthority": False,
    "theoryGraphAuthority": False, "jointGeometryStateAuthority": False,
    "physicalAuthority": False, "physicalViability": False,
    "propulsionAuthority": False, "transportAuthority": False,
}


class BenchmarkError(RuntimeError):
    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> NoReturn:
    raise BenchmarkError(code, detail)


def _sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _word(value: float) -> str:
    return struct.pack(">d", value).hex()


def _canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=True, allow_nan=False, sort_keys=True, separators=(",", ":")).encode("ascii")


def _self_hash(value: dict[str, object]) -> str:
    raw = _canonical(value)
    return _sha(RECEIPT_DOMAIN + struct.pack("<Q", len(raw)) + raw)


def _verify(path: Path, size: int, digest: str, role: str) -> bytes:
    try:
        metadata = path.lstat()
        raw = path.read_bytes()
    except OSError as error:
        _fail("g2b_b4_r6_input_read_failed", f"{role}:{type(error).__name__}")
    if not stat.S_ISREG(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode) or len(raw) != size or _sha(raw) != digest:
        _fail("g2b_b4_r6_input_binding_drift", role)
    return raw


def _json(raw: bytes, role: str) -> dict[str, object]:
    try:
        value = json.loads(raw)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        _fail("g2b_b4_r6_json_invalid", f"{role}:{type(error).__name__}")
    if type(value) is not dict or _canonical(value) != raw:
        _fail("g2b_b4_r6_json_noncanonical", role)
    return value


def _checkpoint_binding() -> dict[str, object]:
    try:
        raw = CHECKPOINT.read_bytes()
        text = raw.decode("utf-8")
        source = Path(__file__).read_bytes()
        tests = TEST_PATH.read_bytes()
    except (OSError, UnicodeDecodeError) as error:
        _fail("g2b_b4_r6_checkpoint_read_failed", type(error).__name__)
    required = (
        f"| benchmark producer | {len(source):,} | `{_sha(source)}` |",
        f"| preexecution tests | {len(tests):,} | `{_sha(tests)}` |",
        PACKET_SHA256, IMAGE_ID, f"-e {TOKEN_ENV}={PACKET_SHA256}",
        f"-e {IMAGE_ENV}={IMAGE_ID}", "docker run --rm --network none",
        "The benchmark command may run once.",
    )
    if any(item not in text for item in required):
        _fail("g2b_b4_r6_checkpoint_invalid")
    return {"role": "execution_checkpoint", "path": CHECKPOINT.relative_to(ROOT).as_posix(), "sizeBytes": len(raw), "rawSha256": _sha(raw)}


def _closure() -> tuple[list[dict[str, object]], bytes, dict[str, object]]:
    bindings: list[dict[str, object]] = []
    state_raw = b""
    r5: dict[str, object] = {}
    for role, relative, size, digest in FROZEN_BINDINGS:
        raw = _verify(ROOT / relative, size, digest, role)
        bindings.append({"role": role, "path": relative, "sizeBytes": size, "rawSha256": digest})
        if role == "b4_r4_terminal_state":
            state_raw = raw
        elif role == "b4_r5_receipt":
            r5 = _json(raw, role)
    unsigned_r5 = dict(r5)
    observed_r5_hash = unsigned_r5.pop("receiptSha256", None)
    if (
        observed_r5_hash != "0cfb59144cf29beb0da94852ee872455a56017cbe3fc690fd6cb24cd401ea406"
        or observed_r5_hash != _sha(
            R5_RECEIPT_DOMAIN
            + struct.pack("<Q", len(_canonical(unsigned_r5)))
            + _canonical(unsigned_r5)
        )
        or r5.get("decision") != "NO_UNIQUE_SUCCESSOR_JUSTIFIED"
    ):
        _fail("g2b_b4_r6_parent_semantics_invalid")
    if r5.get("b4R4Retried") is not False or r5.get("noRetune") is not True or not all(value is False for value in r5.get("authorityLocks", {}).values()):
        _fail("g2b_b4_r6_parent_authority_invalid")
    bindings.append(_checkpoint_binding())
    return bindings, state_raw, r5


def _factor(matrix: tuple[tuple[float, ...], ...]) -> dict[str, object]:
    order = len(matrix)
    lu = [list(row) for row in matrix]
    original_max = max(abs(value) for row in matrix for value in row)
    matrix_linf = max(math.fsum(abs(value) for value in row) for row in matrix)
    for step in range(order):
        pivot_row = max(range(step, order), key=lambda row: (abs(lu[row][step]), -row))
        if lu[pivot_row][step] == 0.0:
            _fail("g2b_b4_r6_zero_pivot", str(step))
        if pivot_row != step:
            lu[step], lu[pivot_row] = lu[pivot_row], lu[step]
        pivot = lu[step][step]
        for row in range(step + 1, order):
            multiplier = lu[row][step] / pivot
            lu[row][step] = multiplier
            for column in range(step + 1, order):
                lu[row][column] -= multiplier * lu[step][column]
    diagonal = tuple(abs(lu[index][index]) for index in range(order))
    u_max = max(abs(lu[row][column]) for row in range(order) for column in range(row, order))
    if original_max == 0.0 or min(diagonal) == 0.0:
        _fail("g2b_b4_r6_singular_factor")
    diagnostics = (matrix_linf, original_max, u_max / original_max, max(diagonal) / min(diagonal))
    if not all(math.isfinite(value) for value in diagnostics):
        _fail("g2b_b4_r6_nonfinite_factor")
    return {
        "matrixInfinityNormBinary64Word": _word(matrix_linf),
        "matrixMaximumBinary64Word": _word(original_max),
        "pivotGrowthBinary64Word": _word(u_max / original_max),
        "uDiagonalSpreadBinary64Word": _word(max(diagonal) / min(diagonal)),
    }


def _coordinate_matrix(matrix: tuple[tuple[float, ...], ...], derivative: float) -> tuple[tuple[float, ...], ...]:
    return tuple(tuple(value * derivative if column == 192 else value for column, value in enumerate(row)) for row in matrix)


def _power_two_scale(maximum: float) -> float:
    if maximum == 0.0:
        return 1.0
    _fraction, exponent = math.frexp(maximum)
    return math.ldexp(1.0, -exponent)


def _equilibrate(matrix: tuple[tuple[float, ...], ...]) -> tuple[tuple[tuple[float, ...], ...], tuple[float, ...], tuple[float, ...]]:
    row_scales = tuple(_power_two_scale(max(abs(value) for value in row)) for row in matrix)
    row_scaled = tuple(tuple(row_scales[row] * value for value in matrix[row]) for row in range(len(matrix)))
    column_scales = tuple(_power_two_scale(max(abs(row_scaled[row][column]) for row in range(len(matrix)))) for column in range(len(matrix)))
    output = tuple(tuple(row_scaled[row][column] * column_scales[column] for column in range(len(matrix))) for row in range(len(matrix)))
    return output, row_scales, column_scales


def _mp(value: float | int) -> gmpy2.mpfr:
    return gmpy2.mpfr(value)


def _mp_sum(terms: list[gmpy2.mpfr]) -> gmpy2.mpfr:
    result = _mp(0)
    for term in terms:
        result += term
    return result


def _mp_dot(left: tuple[float, ...], right: tuple[float, ...]) -> gmpy2.mpfr:
    result = _mp(0)
    for a, b in zip(left, right, strict=True):
        result += _mp(a) * _mp(b)
    return result


def _mp_point(x, jets, w):
    F0, F1, phi = jets
    a, ap, app = F0
    b, bp, bpp = F1
    p, pp, ppp = phi
    inv = _mp(1) / x
    e0 = gmpy2.exp(-_mp(2) * a)
    e1 = gmpy2.exp(-_mp(2) * b)
    gt = e1 * _mp_sum([_mp(2) * bpp, bp * bp, _mp(4) * inv * bp])
    gx = e1 * _mp_sum([_mp(2) * ap * bp, bp * bp, _mp(2) * inv * (ap + bp)])
    gth = e1 * _mp_sum([ap * ap, app, bpp, inv * (ap + bp)])
    tg = e0 * w * w * p * p
    rg = e1 * pp * pp
    p2 = p * p
    et = _mp_sum([gt, tg, rg, p2])
    ex = _mp_sum([gx, -tg, -rg, p2])
    eth = _mp_sum([gth, -tg, rg, p2])
    radial_box = ppp + (ap + bp + _mp(2) * inv) * pp
    kg = _mp_sum([e1 * radial_box, e0 * w * w * p, -p])
    rows = (
        (-_mp(2)*tg,_mp(0),_mp(0),-_mp(2)*gt-_mp(2)*rg,e1*(_mp(2)*bp+_mp(4)*inv),_mp(2)*e1,_mp(2)*e0*w*w*p+_mp(2)*p,_mp(2)*e1*pp,_mp(0),_mp(2)*e0*w*p*p),
        (_mp(2)*tg,e1*(_mp(2)*ap+inv),e1,-_mp(2)*gth-_mp(2)*rg,e1*inv,e1,-_mp(2)*e0*w*w*p+_mp(2)*p,_mp(2)*e1*pp,_mp(0),-_mp(2)*e0*w*p*p),
        (-_mp(2)*e0*w*w*p,e1*pp,_mp(0),-_mp(2)*e1*radial_box,e1*pp,_mp(0),e0*w*w-_mp(1),e1*(ap+bp+_mp(2)*inv),e1,_mp(2)*e0*w*p),
        (_mp(2)*tg,e1*(_mp(2)*bp+_mp(2)*inv),_mp(0),-_mp(2)*gx+_mp(2)*rg,e1*(_mp(2)*ap+_mp(2)*bp+_mp(2)*inv),_mp(0),-_mp(2)*e0*w*w*p+_mp(2)*p,-_mp(2)*e1*pp,_mp(0),-_mp(2)*e0*w*p*p),
    )
    return (et, eth, kg), ex, rows


def _mpfr_assembly(grid, state):
    count = 64
    fields = (state.F0, state.F1, state.varphi)
    residual_blocks = [[], [], []]
    jacobian_blocks = [[], [], []]
    unused = []
    for node in range(1, 63):
        rho = _mp(grid.rho[node])
        one_minus = _mp(1) - rho
        x = rho / one_minus
        first_scale = one_minus * one_minus
        second_scale = first_scale * first_scale
        mixed_scale = -_mp(2) * one_minus * first_scale
        first = tuple(first_scale * _mp(value) for value in grid.first_rho[node])
        second = tuple(second_scale * _mp(a) + mixed_scale * _mp(b) for a, b in zip(grid.second_rho[node], grid.first_rho[node], strict=True))
        jets = []
        for field in fields:
            dx = _mp_sum([first[column] * _mp(field[column]) for column in range(count)])
            dxx = _mp_sum([second[column] * _mp(field[column]) for column in range(count)])
            jets.append((_mp(field[node]), dx, dxx))
        solved, constraint, local_rows = _mp_point(x, tuple(jets), _mp(state.w))
        for equation in range(3):
            residual_blocks[equation].append(solved[equation])
            global_row = [_mp(0) for _ in range(193)]
            local = local_rows[equation]
            for field_index in range(3):
                offset = field_index * count
                base = field_index * 3
                for column in range(count):
                    value = local[base + 1] * first[column] + local[base + 2] * second[column]
                    if column == node:
                        value += local[base]
                    global_row[offset + column] = value
            global_row[-1] = local[-1]
            jacobian_blocks[equation].append(tuple(global_row))
        unused.append(constraint)
    residual = []
    jacobian = []
    for field_index, field in enumerate(fields):
        offset = field_index * count
        residual.append(_mp_dot(grid.first_rho[0], field))
        origin = [_mp(0) for _ in range(193)]
        for column in range(count):
            origin[offset + column] = _mp(grid.first_rho[0][column])
        jacobian.append(tuple(origin))
        residual.extend(residual_blocks[field_index])
        jacobian.extend(jacobian_blocks[field_index])
        residual.append(_mp(field[-1]))
        infinity = [_mp(0) for _ in range(193)]
        infinity[offset + 63] = _mp(1)
        jacobian.append(tuple(infinity))
    residual.append(_mp(state.varphi[0]) - _mp(TARGET_AMPLITUDE))
    amplitude = [_mp(0) for _ in range(193)]
    amplitude[128] = _mp(1)
    jacobian.append(tuple(amplitude))
    return tuple(residual), tuple(jacobian), tuple(unused)


def _mismatch(primary: tuple[float, ...], replay: tuple[gmpy2.mpfr, ...], kind: str) -> dict[str, object]:
    items = []
    stream = []
    maximum = _mp(0)
    for ordinal, (left, right_mp) in enumerate(zip(primary, replay, strict=True)):
        rounded = float(right_mp)
        stream.append(rounded)
        difference = abs(right_mp - _mp(left))
        maximum = max(maximum, difference)
        if _word(left) != _word(rounded):
            item = {"ordinal": ordinal, "primaryWord": _word(left), "mpfrRoundedWord": _word(rounded), "absoluteDifferenceBinary64Word": _word(float(difference))}
            if kind == "jacobian":
                item["row"], item["column"] = divmod(ordinal, 193)
            items.append((difference, ordinal, item))
    items.sort(key=lambda value: (-value[0], value[1]))
    return {"mismatchCount": len(items), "maximumAbsoluteDifferenceBinary64Word": _word(float(maximum)), "first16Mismatches": [item for _diff, _ord, item in items[:16]], "roundedWordStreamSha256": _sha(struct.pack(f"<{len(stream)}d", *stream))}


def _chebyshev(state) -> dict[str, object]:
    n = 64
    pi = gmpy2.const_pi()
    coefficients = []
    for mode in range(n):
        total = _mp(state.varphi[0]) / _mp(2)
        for node in range(1, n - 1):
            total += _mp(state.varphi[node]) * gmpy2.cos(pi * _mp(mode * node) / _mp(n - 1))
        total += _mp(state.varphi[-1]) * (_mp(-1) if mode % 2 else _mp(1)) / _mp(2)
        coefficient = _mp(2) * total / _mp(n - 1)
        if mode % 2:
            coefficient = -coefficient
        if mode in (0, n - 1):
            coefficient /= _mp(2)
        coefficients.append(coefficient)
    rounded = tuple(float(value) for value in coefficients)
    total_norm = gmpy2.sqrt(_mp_sum([value * value for value in coefficients]))
    tail = coefficients[32:]
    tail_norm = gmpy2.sqrt(_mp_sum([value * value for value in tail]))
    even_norm = gmpy2.sqrt(_mp_sum([coefficients[k] * coefficients[k] for k in range(32,64) if k % 2 == 0]))
    odd_norm = gmpy2.sqrt(_mp_sum([coefficients[k] * coefficients[k] for k in range(32,64) if k % 2 == 1]))
    largest = max(range(32,64), key=lambda k: (abs(coefficients[k]), -k))
    ratio = even_norm / odd_norm if odd_norm != 0 else gmpy2.mpfr("inf")
    return {"coefficientWordStreamSha256": _sha(struct.pack("<64d", *rounded)), "totalL2Binary64Word": _word(float(total_norm)), "highTailL2Binary64Word": _word(float(tail_norm)), "highTailToTotalBinary64Word": _word(float(tail_norm / total_norm)), "evenHighTailL2Binary64Word": _word(float(even_norm)), "oddHighTailL2Binary64Word": _word(float(odd_norm)), "evenOddHighTailRatioBinary64Word": _word(float(ratio)), "largestTailMode": largest, "largestTailCoefficientBinary64Word": _word(rounded[largest])}


def _decision(triggers: dict[str, bool]) -> tuple[list[str], str]:
    families = []
    if triggers["COORDINATE_SEPARATION"]: families.append("COORDINATE")
    if triggers["SCALING_SEPARATION"]: families.append("SCALING")
    if triggers["PRECISION_SEPARATION"]: families.append("PRECISION")
    if triggers["SPECTRAL_SEPARATION"] or triggers["FIRST_NODE_SEPARATION"]: families.append("DISCRETIZATION")
    if len(families) > 1: return families, "MULTIPLE_MECHANISMS_SEPARATED_NO_UNIQUE_SUCCESSOR"
    mapping = {"COORDINATE": "COORDINATE_SUCCESSOR_PROPOSAL_SUPPORTED", "SCALING": "EQUILIBRATED_SUCCESSOR_PROPOSAL_SUPPORTED", "PRECISION": "MPFR_SUCCESSOR_PROPOSAL_SUPPORTED", "DISCRETIZATION": "DISCRETIZATION_SUCCESSOR_PROPOSAL_SUPPORTED"}
    return families, mapping[families[0]] if families else "NO_MECHANISM_SEPARATED_STOP_FOR_REVIEW"


def _run_benchmark() -> dict[str, object]:
    bindings, state_raw, r5 = _closure()
    if str(BRANCH_ROOT) not in sys.path:
        sys.path.insert(0, str(BRANCH_ROOT))
    from binary64_environment import nearest_binary64
    from radial_collocation_interior import RadialCollocationState
    from radial_compactified_system import evaluate_spherical_radial_compactified_system
    from radial_lobatto_grid import generate_compactified_lobatto_grid

    @nearest_binary64
    def calculate():
        values = struct.unpack("<193d", state_raw)
        state = RadialCollocationState(F0=values[:64], F1=values[64:128], varphi=values[128:192], w=values[192])
        grid = generate_compactified_lobatto_grid(64).differentiation
        primary = evaluate_spherical_radial_compactified_system(grid=grid, state=state, origin_amplitude=TARGET_AMPLITUDE)
        if _word(max(abs(value) for value in primary.solved_residual)) != r5["endpoint"]["solvedResidualLinfBinary64Word"]:
            _fail("g2b_b4_r6_endpoint_replay_mismatch")
        gap = 1.0 - state.w
        derivatives = (("DIRECT_W", 1.0), ("GAP_Q", -1.0), ("LOG_GAP_S", -gap), ("NU", 1.0 / state.w))
        coordinate = []
        unscaled_spreads = {}
        equilibrated_spreads = {}
        for identifier, derivative in derivatives:
            transformed = _coordinate_matrix(primary.jacobian, derivative)
            raw_factor = _factor(transformed)
            equilibrated, row_scales, column_scales = _equilibrate(transformed)
            eq_factor = _factor(equilibrated)
            unscaled_spreads[identifier] = struct.unpack(">d", bytes.fromhex(raw_factor["uDiagonalSpreadBinary64Word"]))[0]
            equilibrated_spreads[identifier] = struct.unpack(">d", bytes.fromhex(eq_factor["uDiagonalSpreadBinary64Word"]))[0]
            coordinate.append({"coordinateId": identifier, "dwDzBinary64Word": _word(derivative), "unscaled": raw_factor, "equilibrated": eq_factor, "rowScaleMinimumBinary64Word": _word(min(row_scales)), "rowScaleMaximumBinary64Word": _word(max(row_scales)), "columnScaleMinimumBinary64Word": _word(min(column_scales)), "columnScaleMaximumBinary64Word": _word(max(column_scales)), "frequencyColumnMaximumBinary64Word": _word(max(abs(row[192]) for row in transformed))})
        candidates = [identifier for identifier in ("GAP_Q", "LOG_GAP_S", "NU") if unscaled_spreads[identifier] <= unscaled_spreads["DIRECT_W"] * 2.0**-10]
        coordinate_trigger = False
        if len(candidates) == 1:
            winner = candidates[0]
            coordinate_trigger = all(unscaled_spreads[other] >= 4.0 * unscaled_spreads[winner] for other in ("GAP_Q", "LOG_GAP_S", "NU") if other != winner)
        direct_eq_growth = struct.unpack(">d", bytes.fromhex(next(item for item in coordinate if item["coordinateId"] == "DIRECT_W")["equilibrated"]["pivotGrowthBinary64Word"]))[0]
        scaling_trigger = equilibrated_spreads["DIRECT_W"] <= unscaled_spreads["DIRECT_W"] * 2.0**-10 and direct_eq_growth < 2.0**20 and not coordinate_trigger

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
        with gmpy2.context(template):
            mp_residual, mp_jacobian, mp_unused = _mpfr_assembly(grid, state)
            residual_comparison = _mismatch(primary.solved_residual, mp_residual, "residual")
            primary_flat = tuple(value for row in primary.jacobian for value in row)
            mp_flat = tuple(value for row in mp_jacobian for value in row)
            jacobian_comparison = _mismatch(primary_flat, mp_flat, "jacobian")
            spectrum = _chebyshev(state)
        residual_difference = struct.unpack(">d", bytes.fromhex(residual_comparison["maximumAbsoluteDifferenceBinary64Word"]))[0]
        jacobian_difference = struct.unpack(">d", bytes.fromhex(jacobian_comparison["maximumAbsoluteDifferenceBinary64Word"]))[0]
        matrix_max = max(abs(value) for value in primary_flat)
        precision_trigger = residual_difference >= 2.0**-40 or jacobian_difference / matrix_max >= 2.0**-40
        high_ratio = struct.unpack(">d", bytes.fromhex(spectrum["highTailToTotalBinary64Word"]))[0]
        parity_ratio = struct.unpack(">d", bytes.fromhex(spectrum["evenOddHighTailRatioBinary64Word"]))[0]
        spectral_trigger = high_ratio >= 2.0**-10 and (parity_ratio < 2.0**-4 or parity_ratio > 2.0**4)
        unused_abs = sorted(abs(value) for value in primary.unused_constraint)
        median = (unused_abs[30] + unused_abs[31]) / 2.0
        first_ratio = abs(primary.unused_constraint[0]) / median
        first_trigger = first_ratio >= 2.0**4
        triggers = {"COORDINATE_SEPARATION": coordinate_trigger, "SCALING_SEPARATION": scaling_trigger, "PRECISION_SEPARATION": precision_trigger, "SPECTRAL_SEPARATION": spectral_trigger, "FIRST_NODE_SEPARATION": first_trigger}
        families, decision = _decision(triggers)
        return {"sourceAndInputBindings": bindings, "parentB4R5ReceiptSha256": r5["receiptSha256"], "coordinateDiagnostics": coordinate, "mpfr256Comparison": {"residual": residual_comparison, "jacobian": jacobian_comparison, "unusedConstraintRoundedWordStreamSha256": _sha(struct.pack("<62d", *(float(value) for value in mp_unused)))}, "spectralDiagnostics": spectrum, "firstInteriorConstraint": {"node1AbsoluteBinary64Word": _word(abs(primary.unused_constraint[0])), "medianAbsoluteBinary64Word": _word(median), "node1ToMedianBinary64Word": _word(first_ratio)}, "mechanismTriggers": triggers, "activeMechanismFamilies": families, "decision": decision}
    return calculate()


def execute_once() -> dict[str, object]:
    if os.environ.get(TOKEN_ENV) != PACKET_SHA256 or os.environ.get(IMAGE_ENV) != IMAGE_ID:
        _fail("g2b_b4_r6_execution_identity_invalid")
    if os.environ.get("PYTHONHASHSEED") != "0" or os.environ.get("PYTHONDONTWRITEBYTECODE") != "1": _fail("g2b_b4_r6_python_environment_invalid")
    if sys.platform != "linux" or platform.machine() != "x86_64" or platform.libc_ver() != ("glibc", "2.36"): _fail("g2b_b4_r6_runtime_invalid")
    if Path.cwd().resolve() != ROOT.resolve() or OUTPUT_ROOT.exists() or OUTPUT_ROOT.is_symlink(): _fail("g2b_b4_r6_output_boundary_invalid")
    result = _run_benchmark()
    unsigned = {"artifactId":"nhm2.spherical_boson_star_v2.g2b_b4_r6_mechanism_separation","contractVersion":"nhm2_spherical_boson_star_v2_g2b_b4_r6_mechanism_separation/v1","status":"PASS","packetSha256":PACKET_SHA256,"runtimeImageId":IMAGE_ID,**result,"candidateSolveInvoked":False,"newtonInvoked":False,"continuationInvoked":False,"armijoTrialEvaluated":False,"stateUpdateComputedOrPersisted":False,"b4R4Retried":False,"noRetune":True,"candidateAdmission":False,"vacuumWorkUnlocked":False,"authorityLocks":dict(AUTHORITY_LOCKS)}
    receipt = dict(unsigned); receipt["receiptSha256"] = _self_hash(unsigned); raw = _canonical(receipt)
    try:
        OUTPUT_ROOT.mkdir(mode=0o700); descriptor=os.open(OUTPUT_PATH,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        with os.fdopen(descriptor,"wb") as handle: handle.write(raw); handle.flush(); os.fsync(handle.fileno())
    except OSError as error: _fail("g2b_b4_r6_persistence_failed",type(error).__name__)
    if OUTPUT_PATH.read_bytes()!=raw or _json(raw,"generated")!=receipt: _fail("g2b_b4_r6_readback_failed")
    return receipt


def _main(arguments:list[str])->int:
    if arguments: _fail("g2b_b4_r6_exact_command_required")
    try: receipt=execute_once()
    except BenchmarkError as error: print(_canonical({"status":"BLOCKED","code":error.code,"detail":error.detail}).decode("ascii")); return 2
    print(_canonical(receipt).decode("ascii")); return 0


if __name__=="__main__": raise SystemExit(_main(sys.argv[1:]))
