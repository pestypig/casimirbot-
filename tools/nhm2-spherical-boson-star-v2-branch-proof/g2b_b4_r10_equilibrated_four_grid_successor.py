"""Guarded B4-R10 successor implementing the frozen B4-R9 formulation.

Program gate: G2B — replacement classical proof attempt
Workstream: authenticated classical branch closure
Capability or component: equilibrated four-grid executor and constraint monitor
Current maturity: implemented preexecution surface; execution unauthorized
Target maturity: source-disjoint audited preexecution closure
Required frozen inputs: B4-R1/R3, B4-R4 through B4-R9, runtime and policy
Required evidence: exact delta, monitor wires, receipts, checkpoint and audit
Stop/fail criteria: any binding, runtime, output, numerical or chronology mismatch
Explicit non-goals: execution now, retry, retune, proof/candidate/lane/lamp authority
Downstream gate unlocked: one separately authorized R10 execution request only

Importing this module does not read an initializer, generate a grid, run Newton,
or create an output.  ``execute_once`` is the only candidate execution entrypoint;
it remains guarded by the exact checkpointed token and admitted Linux image.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import stat
import struct
import sys
from typing import Callable, Final, NoReturn, Sequence

import gmpy2


ROOT: Final[Path] = Path(__file__).resolve().parents[2]
TOOLS: Final[Path] = Path(__file__).resolve().parent
BRANCH: Final[Path] = ROOT / "tools/nhm2-spherical-boson-star-branch"
R4_PATH: Final[Path] = TOOLS / "g2b_b4_r4_integrated_four_grid_successor.py"
R9_PATH: Final[Path] = TOOLS / "g2b_b4_r9_formulation_proposal.py"
R8_PATH: Final[Path] = TOOLS / "g2b_b4_r8_constraint_propagation_definition.py"
TEST_PATH: Final[Path] = TOOLS / "test_g2b_b4_r10_equilibrated_four_grid_successor.py"
AUDIT_PATH: Final[Path] = TOOLS / "test_g2b_b4_r10_preexecution_independent_audit.py"
PACKET_PATH: Final[Path] = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r10-implementation-preexecution.md"
CHECKPOINT_PATH: Final[Path] = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r10-execution-checkpoint.md"
OUTPUT_ROOT: Final[Path] = (
    ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r10-four-grid-v1"
)
EXECUTION_TOKEN_ENV: Final[str] = "NHM2_G2B_B4_R10_EXECUTION_TOKEN"
EXECUTION_TOKEN: Final[str] = "b1c408e2c3a3dbc48ceee5da6998ced66579bce65bc324ffb6dbc98857c36d20"
IMAGE_ID_ENV: Final[str] = "NHM2_G2B_IMAGE_ID"
IMAGE_ID: Final[str] = "sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1"
LEVEL_NODE_COUNTS: Final[tuple[int, ...]] = (64, 96, 128, 256)
LEVEL_IDS: Final[tuple[str, ...]] = ("L0", "L1", "L2", "L3")
PROFILE_NAMES: Final[tuple[str, ...]] = ("q", "g", "prefix", "delta")
MONITORED_NAMES: Final[tuple[str, ...]] = ("q", "delta")
PAIR_IDS: Final[tuple[str, ...]] = ("64_to_96", "96_to_128", "128_to_256")
PREEXECUTION_DOMAIN: Final[bytes] = b"nhm2-spherical-boson-star-v2/g2b-b4-r10-preexecution/v1\n"
TERMINAL_DOMAIN: Final[bytes] = b"nhm2-spherical-boson-star-v2/g2b-b4-r10-terminal/v1\n"
AUTHORITY_LOCKS: Final[dict[str, bool]] = {
    "candidateAdmission": False,
    "vacuumConnection": False,
    "proofAuthority": False,
    "executionAuthority": False,
    "replayAuthority": False,
    "laneAuthority": False,
    "pairAgreementAuthority": False,
    "diagnosticLampAuthority": False,
    "theoryGraphAuthority": False,
    "jointGeometryStateAuthority": False,
    "physicalAuthority": False,
    "physicalViability": False,
    "propulsionAuthority": False,
    "transportAuthority": False,
}


class G2BB4R10Error(RuntimeError):
    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> NoReturn:
    raise G2BB4R10Error(code, detail)


def _load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        _fail("g2b_b4_r10_import_spec_invalid", name)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    if Path(module.__file__).resolve() != path.resolve():
        _fail("g2b_b4_r10_import_identity_invalid", name)
    return module


R9 = _load("_nhm2_g2b_b4_r10_r9", R9_PATH)
R8 = _load("_nhm2_g2b_b4_r10_r8", R8_PATH)


def _sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _canonical(value: object) -> bytes:
    return json.dumps(
        value, ensure_ascii=True, allow_nan=False, sort_keys=True, separators=(",", ":")
    ).encode("ascii")


def _float_word(value: float) -> str:
    return struct.pack(">d", value).hex()


def _positive(value: float, label: str) -> float:
    if not math.isfinite(value):
        _fail("g2b_b4_r10_nonfinite", label)
    return 0.0 if value == 0.0 else value


def _pack(values: Sequence[float]) -> bytes:
    frozen = tuple(_positive(float(value), "packed_profile") for value in values)
    return struct.pack(f"<{len(frozen)}d", *frozen)


def _binding(path: Path, raw: bytes, base: Path = OUTPUT_ROOT) -> dict[str, object]:
    return {
        "path": path.relative_to(base).as_posix(),
        "sizeBytes": len(raw),
        "rawSha256": _sha(raw),
    }


def _ordinary_binding(path: Path, role: str) -> dict[str, object]:
    metadata = path.lstat()
    raw = path.read_bytes()
    if not stat.S_ISREG(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode):
        _fail("g2b_b4_r10_binding_not_ordinary", role)
    return {
        "role": role,
        "path": path.relative_to(ROOT).as_posix(),
        "sizeBytes": len(raw),
        "rawSha256": _sha(raw),
    }


def verify_preexecution_checkpoint() -> tuple[dict[str, object], ...]:
    """Bind implementation, tests, audit, packet and exact future command."""

    files = (
        (Path(__file__).resolve(), "implementation"),
        (TEST_PATH, "focused_tests"),
        (AUDIT_PATH, "independent_audit"),
        (PACKET_PATH, "implementation_packet"),
    )
    bindings = tuple(_ordinary_binding(path, role) for path, role in files)
    raw = CHECKPOINT_PATH.read_bytes()
    metadata = CHECKPOINT_PATH.lstat()
    if not stat.S_ISREG(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode):
        _fail("g2b_b4_r10_checkpoint_not_ordinary")
    text = raw.decode("utf-8")
    for item in bindings:
        literal = f"| {item['role']} | {item['sizeBytes']:,} | `{item['rawSha256']}` |"
        if literal not in text:
            _fail("g2b_b4_r10_checkpoint_binding_invalid", str(item["role"]))
    required = (
        EXECUTION_TOKEN,
        IMAGE_ID,
        f"-e {EXECUTION_TOKEN_ENV}={EXECUTION_TOKEN}",
        f"-e {IMAGE_ID_ENV}={IMAGE_ID}",
        "docker run --rm --network none",
        "Execution is not authorized by this checkpoint.",
    )
    if any(literal not in text for literal in required):
        _fail("g2b_b4_r10_checkpoint_command_invalid")
    return (*bindings, _ordinary_binding(CHECKPOINT_PATH, "execution_checkpoint"))


def verify_preexecution_only() -> dict[str, object]:
    """Perform only read-only definition checks; never touch candidate data."""

    if OUTPUT_ROOT.exists() or OUTPUT_ROOT.is_symlink():
        _fail("g2b_b4_r10_output_root_not_absent")
    frozen = R9.verify_frozen_bindings(ROOT)
    checkpoint = verify_preexecution_checkpoint()
    return {
        "status": "PASS",
        "decision": "IMPLEMENTATION_PREEXECUTION_CLOSED_NO_EXECUTION",
        "frozenBindingCount": len(frozen),
        "checkpointBindingCount": len(checkpoint),
        "outputRootAbsent": True,
        "candidateDataRead": False,
        "gridGenerated": False,
        "newtonInvoked": False,
        "continuationInvoked": False,
        "armijoInvoked": False,
        "authorityLocks": dict(AUTHORITY_LOCKS),
    }


def _hash_f64_matrix(matrix: Sequence[Sequence[float]]) -> str:
    digest = hashlib.sha256(b"nhm2-g2b-b4-r10-matrix-f64le/v1\n")
    digest.update(struct.pack("<I", len(matrix)))
    for row in matrix:
        digest.update(_pack(row))
    return digest.hexdigest()


def _hash_f64_vector(domain: bytes, values: Sequence[float]) -> str:
    return _sha(domain + struct.pack("<I", len(values)) + _pack(values))


@dataclass(frozen=True, slots=True)
class LinearCorrectionTrace:
    update_index: int
    raw_matrix_sha256: str
    raw_rhs_sha256: str
    row_scales_sha256: str
    column_scales_sha256: str
    equilibrated_matrix_sha256: str
    equilibrated_rhs_sha256: str
    scaled_direction_sha256: str
    recovered_direction_sha256: str


NEWTON_TRACES: list[tuple[LinearCorrectionTrace, ...]] = []


def _linf(values: Sequence[float]) -> float:
    return _positive(max((abs(value) for value in values), default=0.0), "linf")


def _l2(values: Sequence[float]) -> float:
    result = 0.0
    for value in values:
        result = math.hypot(result, value)
    return _positive(result, "l2")


def make_equilibrated_newton_core(newton_module, dense_lu_module):
    """Return the exact R9 correction delta inside the unchanged Newton map."""

    @newton_module.nearest_binary64
    def solve(*, initial, evaluator, domain):
        current = tuple(float(value) for value in initial)
        if not current or any(not math.isfinite(value) for value in current) or not domain(current):
            raise ValueError("Newton initial state is outside the frozen domain")
        residual, jacobian = newton_module._evaluate(evaluator, current)
        residual_linf = _linf(residual)
        pass_count = 0
        accepted_exponents: list[int] = []
        last_scaled_step = None
        traces: list[LinearCorrectionTrace] = []

        def finish(converged, code, count):
            NEWTON_TRACES.append(tuple(traces))
            return newton_module._NewtonCoreResult(
                values=current,
                converged=converged,
                failure_code=code,
                accepted_update_count=count,
                residual_linf=residual_linf,
                scaled_step_linf=last_scaled_step,
                consecutive_pass_count=pass_count,
                accepted_alpha_exponents=tuple(accepted_exponents),
            )

        for update in range(newton_module.MAXIMUM_NEWTON_UPDATES):
            raw_rhs = tuple(0.0 if value == 0.0 else -value for value in residual)
            equilibrated = R9.equilibrate_linear_system(jacobian, raw_rhs)
            try:
                scaled = dense_lu_module.solve_deterministic_dense_lu(
                    matrix=equilibrated.matrix, rhs=equilibrated.rhs
                ).solution
                direction = R9.recover_unscaled_direction(
                    scaled, equilibrated.column_scales
                )
            except ValueError:
                return finish(False, "linear_solve_failed_without_retry", update)
            traces.append(
                LinearCorrectionTrace(
                    update_index=update,
                    raw_matrix_sha256=_hash_f64_matrix(jacobian),
                    raw_rhs_sha256=_hash_f64_vector(b"raw-rhs\n", raw_rhs),
                    row_scales_sha256=_hash_f64_vector(b"row-scales\n", equilibrated.row_scales),
                    column_scales_sha256=_hash_f64_vector(b"column-scales\n", equilibrated.column_scales),
                    equilibrated_matrix_sha256=_hash_f64_matrix(equilibrated.matrix),
                    equilibrated_rhs_sha256=_hash_f64_vector(b"equilibrated-rhs\n", equilibrated.rhs),
                    scaled_direction_sha256=_hash_f64_vector(b"scaled-direction\n", scaled),
                    recovered_direction_sha256=_hash_f64_vector(b"recovered-direction\n", direction),
                )
            )
            current_merit = _l2(residual)
            accepted = None
            for exponent in range(newton_module.MAXIMUM_BACKTRACK_EXPONENT + 1):
                alpha = 2.0**-exponent
                trial = tuple(current[index] + alpha * direction[index] for index in range(len(current)))
                if any(not math.isfinite(value) for value in trial) or not domain(trial):
                    continue
                try:
                    trial_residual, trial_jacobian = newton_module._evaluate(evaluator, trial)
                except ValueError:
                    continue
                trial_merit = _l2(trial_residual)
                scaled_step = _linf(
                    tuple(
                        abs(alpha * direction[index]) / max(1.0, abs(trial[index]))
                        for index in range(len(trial))
                    )
                )
                armijo_bound = (1.0 - newton_module.ARMIJO_C * alpha) * current_merit
                stationary = (
                    trial == current
                    and residual_linf <= newton_module.RESIDUAL_LINF_THRESHOLD
                    and scaled_step <= newton_module.SCALED_STEP_LINF_THRESHOLD
                )
                if trial_merit <= armijo_bound or stationary:
                    accepted = (trial, trial_residual, trial_jacobian, exponent, scaled_step)
                    break
            if accepted is None:
                return finish(False, "armijo_schedule_exhausted_without_retry", update)
            current, residual, jacobian, exponent, last_scaled_step = accepted
            accepted_exponents.append(exponent)
            residual_linf = _linf(residual)
            if (
                residual_linf <= newton_module.RESIDUAL_LINF_THRESHOLD
                and last_scaled_step <= newton_module.SCALED_STEP_LINF_THRESHOLD
            ):
                pass_count += 1
            else:
                pass_count = 0
            if pass_count == newton_module.CONSECUTIVE_PASS_COUNT:
                return finish(True, None, update + 1)
        return finish(
            False,
            "maximum_newton_updates_reached_without_retry",
            newton_module.MAXIMUM_NEWTON_UPDATES,
        )

    return solve


def _mpfr_context():
    context = gmpy2.get_context().copy()
    context.precision = 512
    context.round = gmpy2.RoundToNearest
    context.emin = -1_073_741_823
    context.emax = 1_073_741_823
    context.subnormalize = False
    context.trap_underflow = False
    context.trap_overflow = False
    context.trap_inexact = False
    context.trap_invalid = False
    context.trap_erange = False
    context.trap_divzero = False
    context.allow_complex = False
    context.rational_division = False
    context.allow_release_gil = False
    return gmpy2.context(context)


def _mp_sum(values: Sequence[object]):
    result = gmpy2.mpfr(0)
    for value in values:
        result += value
    return result


def _mp_dot(row: Sequence[float], values: Sequence[float]):
    return _mp_sum(
        [gmpy2.mpfr(left) * gmpy2.mpfr(right) for left, right in zip(row, values, strict=True)]
    )


def _constraint_q_g(grid, state) -> tuple[tuple[float, ...], tuple[float, ...]]:
    """Recompute R9 q and g from exact binary64 words in MPFR512."""

    count = len(grid.rho)
    if any(len(field) != count for field in (state.F0, state.F1, state.varphi)):
        raise ValueError("constraint_monitor_shape_invalid")
    q = [0.0]
    source = [0.0]
    with _mpfr_context():
        zero, one, two, four = (gmpy2.mpfr(value) for value in (0, 1, 2, 4))
        w = gmpy2.mpfr(state.w)
        w2 = w * w
        for node in range(1, count - 1):
            rho = gmpy2.mpfr(grid.rho[node])
            om = one - rho
            x = rho / om
            invx = one / x
            first_scale = om * om
            second_scale = first_scale * first_scale
            mixed_scale = -two * om * first_scale
            first = [first_scale * gmpy2.mpfr(value) for value in grid.first_rho[node]]
            second = [
                second_scale * gmpy2.mpfr(d2) + mixed_scale * gmpy2.mpfr(d1)
                for d1, d2 in zip(grid.first_rho[node], grid.second_rho[node], strict=True)
            ]
            fields = tuple(tuple(gmpy2.mpfr(value) for value in field) for field in (state.F0, state.F1, state.varphi))
            f0, f1, phi = (field[node] for field in fields)
            f0p, f1p, phip = (_mp_sum([a * b for a, b in zip(first, field, strict=True)]) for field in fields)
            f0pp, f1pp, phipp = (_mp_sum([a * b for a, b in zip(second, field, strict=True)]) for field in fields)
            em2f0 = gmpy2.exp(-two * f0)
            em2f1 = gmpy2.exp(-two * f1)
            phi2 = phi * phi
            time_gradient = em2f0 * w2 * phi2
            radial_gradient = em2f1 * phip * phip
            stress_t = -time_gradient - radial_gradient - phi2
            stress_x = time_gradient + radial_gradient - phi2
            stress_theta = time_gradient - radial_gradient - phi2
            gt = em2f1 * (two * f1pp + f1p * f1p + four * invx * f1p)
            gx = em2f1 * (two * f0p * f1p + f1p * f1p + two * invx * (f0p + f1p))
            gtheta = em2f1 * (f0p * f0p + f0pp + f1pp + invx * (f0p + f1p))
            box_phi = em2f1 * (phipp + (f0p + f1p + two * invx) * phip) + em2f0 * w2 * phi
            A = gt - stress_t
            B = gx - stress_x
            C = gtheta - stress_theta
            K = box_phi - phi
            W = x * x * gmpy2.exp(f0 + two * f1)
            charge = W * B
            S = f0p * A + two * (f1p + invx) * C - two * phip * K
            forcing = W * S / (om * om)
            q.append(0.0 if charge == zero else float(charge))
            source.append(0.0 if forcing == zero else float(forcing))
        q.append(0.0)
        source.append(0.0)
    if any(not math.isfinite(value) for value in (*q, *source)):
        _fail("g2b_b4_r10_constraint_monitor_nonfinite")
    return tuple(q), tuple(source)


def _weighted_l2_mpfr(values: Sequence[float], weights: Sequence[float]) -> float:
    if len(values) != len(weights):
        raise ValueError("constraint_norm_shape_invalid")
    with _mpfr_context():
        total = _mp_sum(
            [gmpy2.mpfr(weight) * gmpy2.mpfr(value) * gmpy2.mpfr(value)
             for value, weight in zip(values, weights, strict=True)]
        )
        result = float(gmpy2.sqrt(total))
    return _positive(result, "constraint_weighted_l2")


@dataclass(frozen=True, slots=True)
class ConstraintMonitor:
    q: tuple[float, ...]
    g: tuple[float, ...]
    prefix: tuple[float, ...]
    delta: tuple[float, ...]
    norms: dict[str, dict[str, float]]
    tail_interface_passed: bool


def evaluate_constraint_monitor(grid, state) -> ConstraintMonitor:
    if state.F0[-1] != 0.0 or state.F1[-1] != 0.0 or state.varphi[-1] != 0.0:
        _fail("g2b_b4_r10_tail_interface_failure")
    q, g = _constraint_q_g(grid, state)
    prefix = R9.interpolatory_prefix_mpfr512(grid.rho, g)
    delta: list[float] = []
    with _mpfr_context():
        for charge, integral in zip(q, prefix, strict=True):
            value = float(gmpy2.mpfr(charge) - gmpy2.mpfr(integral))
            delta.append(0.0 if value == 0.0 else value)
    weights = R8.clenshaw_curtis_weights(len(q))
    norms = {
        name: {
            "linf": _linf(profile),
            "l2": _weighted_l2_mpfr(profile, weights),
        }
        for name, profile in (("q", q), ("delta", tuple(delta)))
    }
    return ConstraintMonitor(q, g, prefix, tuple(delta), norms, True)


def _projection(coarse_rho, fine_rho, values) -> tuple[float, ...]:
    weights = tuple(
        (-1.0 if index % 2 else 1.0) * (0.5 if index in (0, len(coarse_rho) - 1) else 1.0)
        for index in range(len(coarse_rho))
    )
    output: list[float] = []
    for target in fine_rho:
        exact = next((index for index, node in enumerate(coarse_rho) if struct.pack(">d", node) == struct.pack(">d", target)), None)
        if exact is not None:
            output.append(values[exact])
            continue
        terms = tuple(weight / (target - node) for weight, node in zip(weights, coarse_rho, strict=True))
        scale = max(abs(value) for value in terms)
        scaled = tuple(value / scale for value in terms)
        output.append(_positive(math.fsum(a * b for a, b in zip(scaled, values, strict=True)) / math.fsum(scaled), "projection"))
    return tuple(output)


def evaluate_constraint_cross_grid(grids, monitors: Sequence[ConstraintMonitor]) -> dict[str, object]:
    if len(grids) != 4 or len(monitors) != 4:
        raise ValueError("constraint_cross_grid_requires_four_levels")
    level_sequences = {
        f"{name}_{norm}": [monitor.norms[name][norm] for monitor in monitors]
        for name in MONITORED_NAMES for norm in ("linf", "l2")
    }
    pair_metrics: dict[str, list[float]] = {
        f"{name}_{norm}": [] for name in MONITORED_NAMES for norm in ("linf", "l2")
    }
    pairs: list[dict[str, object]] = []
    for index, pair_id in enumerate(PAIR_IDS):
        coarse, fine = grids[index], grids[index + 1]
        metrics: dict[str, float] = {}
        for name in MONITORED_NAMES:
            projected = _projection(coarse.rho, fine.rho, getattr(monitors[index], name))
            difference = tuple(
                fine_value - coarse_value
                for fine_value, coarse_value in zip(getattr(monitors[index + 1], name), projected, strict=True)
            )
            weights = R8.clenshaw_curtis_weights(len(difference))
            metrics[f"{name}_linf"] = _linf(difference)
            metrics[f"{name}_l2"] = _weighted_l2_mpfr(difference, weights)
            pair_metrics[f"{name}_linf"].append(metrics[f"{name}_linf"])
            pair_metrics[f"{name}_l2"].append(metrics[f"{name}_l2"])
        pairs.append({"pairIndex": index, "pairId": pair_id, "metrics": metrics})
    level_contraction = {key: R9.contracts_without_threshold(values) for key, values in level_sequences.items()}
    pair_contraction = {key: R9.contracts_without_threshold(values) for key, values in pair_metrics.items()}
    passed = all(level_contraction.values()) and all(pair_contraction.values())
    return {
        "operationVersion": "nhm2_spherical_boson_star_v2_g2b_b4_r10_constraint_cross_grid/v1",
        "levelOrder": list(LEVEL_NODE_COUNTS),
        "pairOrder": list(PAIR_IDS),
        "levelSequences": level_sequences,
        "pairSequences": pair_metrics,
        "levelContraction": level_contraction,
        "pairContraction": pair_contraction,
        "pairs": pairs,
        "absoluteThresholdUsed": False,
        "passed": passed,
    }


def _self_hashed(unsigned: dict[str, object], domain: bytes) -> bytes:
    raw = _canonical(unsigned)
    value = dict(unsigned)
    value["receiptSha256"] = _sha(domain + struct.pack("<Q", len(raw)) + raw)
    return _canonical(value)


def _stage_monitor_metadata(monitor: ConstraintMonitor, bindings: dict[str, dict[str, object]]) -> dict[str, object]:
    return {
        "operationVersion": "nhm2_spherical_boson_star_v2_g2b_b4_r10_constraint_monitor/v1",
        "profileBindings": bindings,
        "normBinary64Words": {
            name: {norm: _float_word(value) for norm, value in monitor.norms[name].items()}
            for name in MONITORED_NAMES
        },
        "endpointWords": {
            name: {"origin": _float_word(getattr(monitor, name)[0]), "infinity": _float_word(getattr(monitor, name)[-1])}
            for name in PROFILE_NAMES
        },
        "tailInterfacePassed": monitor.tail_interface_passed,
        "candidateAuthority": False,
        "authorityLocks": dict(AUTHORITY_LOCKS),
    }


def _assert_execution_environment() -> None:
    if os.environ.get(EXECUTION_TOKEN_ENV) != EXECUTION_TOKEN:
        _fail("g2b_b4_r10_execution_token_invalid")
    if os.environ.get(IMAGE_ID_ENV) != IMAGE_ID:
        _fail("g2b_b4_r10_image_identity_invalid")
    if os.environ.get("PYTHONHASHSEED") != "0" or os.environ.get("PYTHONDONTWRITEBYTECODE") != "1":
        _fail("g2b_b4_r10_python_environment_not_frozen")
    if sys.platform != "linux" or Path.cwd().resolve() != ROOT.resolve():
        _fail("g2b_b4_r10_execution_environment_invalid")
    if OUTPUT_ROOT.exists() or OUTPUT_ROOT.is_symlink():
        _fail("g2b_b4_r10_output_collision")


def _load_execution_spine():
    r4 = _load("_nhm2_g2b_b4_r10_r4", R4_PATH)
    r4.configure()
    b4 = r4.B4
    b4.OUTPUT_ROOT = OUTPUT_ROOT
    b4.EXECUTION_TOKEN_ENV = EXECUTION_TOKEN_ENV
    b4.PACKET_SHA256 = EXECUTION_TOKEN
    grid, continuation, state, cross_grid = b4._load_execution_modules()
    import deterministic_dense_lu
    import deterministic_newton
    deterministic_newton._solve_newton_map = make_equilibrated_newton_core(
        deterministic_newton, deterministic_dense_lu
    )
    return r4, b4, grid, continuation, state, cross_grid


def execute_once() -> dict[str, object]:
    """Perform the sole future R10 attempt; never called by preexecution tests."""

    _assert_execution_environment()
    R9.verify_frozen_bindings(ROOT)
    checkpoint_bindings = verify_preexecution_checkpoint()
    r4, b4, grid_module, continuation_module, state_module, cross_grid_module = _load_execution_spine()
    b4._assert_output_boundary()
    source_bindings = [asdict(binding) for binding in R9.FROZEN_BINDINGS]
    persistence, runtime = r4._successor_receipt_and_runtime()
    OUTPUT_ROOT.mkdir(mode=0o700)

    pre_unsigned = {
        "artifactId": "nhm2.spherical_boson_star_v2.g2b_b4_r10_preexecution",
        "contractVersion": "nhm2_spherical_boson_star_v2_g2b_b4_r10_preexecution/v1",
        "proposalVersion": R9.PROPOSAL_VERSION,
        "executionTokenSha256": _sha(EXECUTION_TOKEN.encode("ascii")),
        "imageId": IMAGE_ID,
        "exactCommandBoundByCheckpoint": True,
        "checkpointBindings": list(checkpoint_bindings),
        "frozenDependencies": source_bindings,
        "initializerPersistenceReceiptSha256": persistence["receiptSha256"],
        "runtimeManifestSha256": runtime["manifestSha256"],
        "levelOrder": list(LEVEL_NODE_COUNTS),
        "amplitudeOrder": list(R9.AMPLITUDE_EXPONENTS),
        "outputRootWasAbsent": True,
        "coarseGridPredictorAllowed": False,
        "retryAllowed": False,
        "retuneAllowed": False,
        "authorityLocks": dict(AUTHORITY_LOCKS),
    }
    pre_raw = _self_hashed(pre_unsigned, PREEXECUTION_DOMAIN)
    b4._write_exclusive(OUTPUT_ROOT / "preexecution-binding.json", pre_raw)
    pre = json.loads(pre_raw)

    level_receipts: list[dict[str, object]] = []
    final_states = []
    target_monitors: list[ConstraintMonitor] = []
    grids = []
    first_failure = None
    field_binding = None
    constraint_binding = None
    terminal_written = False
    try:
        b4._validate_initializer_scalar_contract()
        for level_index, node_count in enumerate(LEVEL_NODE_COUNTS):
            level_dir = OUTPUT_ROOT / f"level-{node_count}"
            level_dir.mkdir(mode=0o700)
            generated = grid_module.generate_compactified_lobatto_grid(node_count)
            authenticated = cross_grid_module.authenticated_lobatto_rho_snapshot(node_count)
            if any(struct.pack(">d", a) != struct.pack(">d", b) for a, b in zip(generated.differentiation.rho, authenticated, strict=True)):
                _fail("g2b_b4_r10_grid_snapshot_mismatch", LEVEL_IDS[level_index])
            initializer = b4.materialize_lowest_stage_state(generated.differentiation.rho, state_module.RadialCollocationState)
            init_raw = b4._pack_state(initializer)
            init_binding = b4._write_exclusive(level_dir / "initializer-state.f64le", init_raw)
            trace_start = len(NEWTON_TRACES)
            result = continuation_module.continue_spherical_radial_compactified_diagnostic(
                grid=generated.differentiation, lowest_stage_initial_state=initializer
            )
            traces = NEWTON_TRACES[trace_start:]
            if len(traces) != len(result.stages):
                _fail("g2b_b4_r10_newton_trace_count_mismatch", LEVEL_IDS[level_index])
            stage_receipts = []
            last_monitor = None
            for stage, trace in zip(result.stages, traces, strict=True):
                stem = f"stage-{stage.stage_index:02d}"
                state_binding = b4._write_exclusive(level_dir / f"{stem}-state.f64le", b4._pack_state(stage.state))
                monitor = evaluate_constraint_monitor(generated.differentiation, stage.state)
                profile_raw = {}
                profile_bindings = {}
                for name in PROFILE_NAMES:
                    raw = _pack(getattr(monitor, name))
                    path = level_dir / f"{stem}-{name}.f64le"
                    profile_raw[name] = raw
                    profile_bindings[name] = _binding(path, raw)
                monitor_metadata = _stage_monitor_metadata(monitor, profile_bindings)
                monitor_path = level_dir / f"{stem}-constraint-monitor.json"
                monitor_raw = _canonical(monitor_metadata)
                monitor_binding = _binding(monitor_path, monitor_raw)
                metadata = b4._stage_metadata(stage, state_binding)
                metadata["linearCorrectionVersion"] = R9.EQUILIBRATION_VERSION
                metadata["linearCorrectionTraces"] = [asdict(item) for item in trace]
                metadata["constraintMonitorBinding"] = monitor_binding
                metadata["candidateAuthority"] = False
                metadata_binding = b4._write_exclusive(level_dir / f"{stem}.json", _canonical(metadata))
                for name in PROFILE_NAMES:
                    observed = b4._write_exclusive(level_dir / f"{stem}-{name}.f64le", profile_raw[name])
                    if observed != profile_bindings[name]:
                        _fail("g2b_b4_r10_profile_binding_mismatch", f"{stem}:{name}")
                observed_monitor = b4._write_exclusive(monitor_path, monitor_raw)
                if observed_monitor != monitor_binding:
                    _fail("g2b_b4_r10_monitor_binding_mismatch", stem)
                stage_receipts.append({"metadataBinding": metadata_binding, "constraintMonitorBinding": monitor_binding})
                last_monitor = monitor
            level_receipt = {
                "levelId": LEVEL_IDS[level_index],
                "nodeCount": node_count,
                "initializerBinding": init_binding,
                "attemptedStageCount": result.attempted_stage_count,
                "acceptedStageCount": result.accepted_stage_count,
                "completed": result.completed,
                "failureStageIndex": result.failure_stage_index,
                "failureCode": result.failure_code,
                "stageReceipts": stage_receipts,
                "sameGridOnlyPredictors": True,
                "coarseGridStateUsedAsPredictor": False,
            }
            level_binding = b4._write_exclusive(level_dir / "level-receipt.json", _canonical(level_receipt))
            level_receipts.append({**level_receipt, "levelReceiptBinding": level_binding})
            if not result.completed or result.final_accepted_state is None or last_monitor is None:
                first_failure = {
                    "code": result.failure_code or "g2b_b4_r10_level_incomplete",
                    "levelId": LEVEL_IDS[level_index],
                    "stageIndex": result.failure_stage_index,
                }
                break
            grids.append(generated.differentiation)
            target_monitors.append(last_monitor)
            final_states.append(cross_grid_module.FrozenRadialLevelState(
                rho=generated.differentiation.rho,
                F0=result.final_accepted_state.F0,
                F1=result.final_accepted_state.F1,
                varphi=result.final_accepted_state.varphi,
                w=result.final_accepted_state.w,
            ))

        decision = "STOPPED_AT_FIRST_SOLVE_FAILURE"
        status = "FAIL"
        if first_failure is None:
            field = cross_grid_module.evaluate_radial_cross_grid_convergence(
                level_64=final_states[0], level_96=final_states[1],
                level_128=final_states[2], level_256=final_states[3]
            )
            field_raw = _canonical(field)
            field_binding = b4._write_exclusive(OUTPUT_ROOT / "cross-grid-receipt.json", field_raw)
            field_binding["calculationReceiptSha256"] = field.calculation_receipt_sha256
            field_binding["passed"] = field.all_pairs_within_tolerance
            if not field.all_pairs_within_tolerance:
                first_failure = {"code": "g2b_b4_r10_field_cross_grid_failure", "pairId": field.first_failing_pair_id}
                decision = "STOPPED_AT_FIELD_CROSS_GRID_GATE"
            else:
                constraint = evaluate_constraint_cross_grid(grids, target_monitors)
                constraint_raw = _canonical(constraint)
                constraint_binding = b4._write_exclusive(OUTPUT_ROOT / "constraint-cross-grid-receipt.json", constraint_raw)
                constraint_binding["passed"] = constraint["passed"]
                if constraint["passed"]:
                    status = "PASS"
                    decision = "FOUR_GRID_FIELD_AND_SCALE_FREE_CONSTRAINT_PASS"
                else:
                    first_failure = {"code": "g2b_b4_r10_constraint_contraction_failure"}
                    decision = "STOPPED_AT_CONSTRAINT_CROSS_GRID_GATE"

        terminal_unsigned = {
            "artifactId": "nhm2.spherical_boson_star_v2.g2b_b4_r10_terminal",
            "contractVersion": "nhm2_spherical_boson_star_v2_g2b_b4_r10_terminal/v1",
            "status": status,
            "decision": decision,
            "firstFailure": first_failure,
            "attemptedLevelCount": len(level_receipts),
            "completedLevelCount": len(final_states),
            "levelReceipts": level_receipts,
            "fieldCrossGridBinding": field_binding,
            "constraintCrossGridBinding": constraint_binding,
            "candidateAdmission": False,
            "noRetry": True,
            "noRetune": True,
            "coarseGridPredictorAllowed": False,
            "nextMathematicalDutyUnlocked": status == "PASS",
            "preexecutionBindingSha256": pre["receiptSha256"],
            "authorityLocks": dict(AUTHORITY_LOCKS),
        }
        terminal_raw = _self_hashed(terminal_unsigned, TERMINAL_DOMAIN)
        b4._write_exclusive(OUTPUT_ROOT / "terminal-receipt.json", terminal_raw)
        terminal_written = True
        return json.loads(terminal_raw)
    except BaseException as error:
        if not terminal_written:
            terminal_raw = _self_hashed({
                "artifactId": "nhm2.spherical_boson_star_v2.g2b_b4_r10_terminal",
                "contractVersion": "nhm2_spherical_boson_star_v2_g2b_b4_r10_terminal/v1",
                "status": "FAIL",
                "decision": "STOPPED_AT_FIRST_EXECUTION_EXCEPTION",
                "firstFailure": {"code": getattr(error, "code", "g2b_b4_r10_unhandled_exception"), "detail": getattr(error, "detail", type(error).__name__)},
                "attemptedLevelCount": len(level_receipts),
                "completedLevelCount": len(final_states),
                "levelReceipts": level_receipts,
                "fieldCrossGridBinding": field_binding,
                "constraintCrossGridBinding": constraint_binding,
                "candidateAdmission": False,
                "noRetry": True,
                "noRetune": True,
                "coarseGridPredictorAllowed": False,
                "nextMathematicalDutyUnlocked": False,
                "preexecutionBindingSha256": pre["receiptSha256"],
                "authorityLocks": dict(AUTHORITY_LOCKS),
            }, TERMINAL_DOMAIN)
            try:
                b4._write_exclusive(OUTPUT_ROOT / "terminal-receipt.json", terminal_raw)
            except BaseException:
                pass
        raise


def _main(arguments: list[str]) -> int:
    if arguments:
        _fail("g2b_b4_r10_exact_command_required")
    try:
        result = execute_once()
    except G2BB4R10Error as error:
        print(_canonical({"status": "FAIL", "code": error.code, "detail": error.detail}).decode("ascii"))
        return 2
    print(_canonical(result).decode("ascii"))
    return 0 if result["status"] == "PASS" else 3


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))


__all__ = [
    "AUTHORITY_LOCKS", "ConstraintMonitor", "EXECUTION_TOKEN", "EXECUTION_TOKEN_ENV",
    "G2BB4R10Error", "LEVEL_NODE_COUNTS", "OUTPUT_ROOT", "evaluate_constraint_cross_grid",
    "evaluate_constraint_monitor", "execute_once", "make_equilibrated_newton_core",
    "verify_preexecution_checkpoint", "verify_preexecution_only",
]
