"""Finite quintic/mode-count representation diagnosis for G2B-M1-R3."""

from __future__ import annotations

import bisect
from fractions import Fraction
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
    / "nhm2-spherical-boson-star-v2-g2b-m1-r3-representation-diagnosis.md"
)
PACKET_SHA256: Final[str] = (
    "5bb03e7e908fe635878a5169f5021b95aaecf0c470ea9cca36f6743caec4b915"
)
PACKET_SIZE_BYTES: Final[int] = 3_099
R2_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-m1-r2-mpfr256-global-center-v1.json"
)
R2_SHA256: Final[str] = (
    "891b91fd6615bd19de5e7a87b0fa7f060025719f680ad43558c2e2c95f4f2c14"
)
R2_SIZE_BYTES: Final[int] = 784_964
R2_SELF_SHA256: Final[str] = (
    "7ce7b119143af8cc66c46b5a2a489e35d9ba11e374b3591a69c12aa255a637b4"
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
    / "g2b-m1-r3-representation-diagnosis-v1.json"
)
RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2b-m1-r3-representation-diagnosis/v1\n"
)
POINT_X: Final[Fraction] = Fraction(1, 128)
MARGIN: Final[Fraction] = Fraction(1, 4 * 10**10)
MODE_COUNTS: Final[tuple[int, ...]] = (128, 256, 512)
NODE_LIMIT: Final[float] = 2.0**-40
JOIN_LIMIT: Final[float] = 2.0**-28


class G2BM1R3Error(RuntimeError):
    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> NoReturn:
    raise G2BM1R3Error(code, detail)


def _sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _read(path: Path, size: int, digest: str, label: str) -> bytes:
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


def _load_runner():
    _read(RUNNER_PATH, RUNNER_SIZE_BYTES, RUNNER_SHA256, "runner")
    spec = importlib.util.spec_from_file_location("g2b_m1_r3_runner", RUNNER_PATH)
    if spec is None or spec.loader is None:
        _fail("runner_spec_unavailable")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def _load_center():
    value = json.loads(_read(R2_PATH, R2_SIZE_BYTES, R2_SHA256, "r2"))
    if (
        type(value) is not dict
        or value.get("receiptSha256") != R2_SELF_SHA256
        or value.get("decision") != "GLOBAL_CENTER_SUCCESSOR_FAILED"
        or type(value.get("center")) is not dict
    ):
        _fail("r2_schema_invalid")
    return value["center"]


def _quintic_coefficients(y0, m0, s0, y1, m1, s1, width):
    a0 = y0
    a1 = width * m0
    a2 = width * width * s0 / 2
    remainder_value = y1 - a0 - a1 - a2
    remainder_first = width * m1 - a1 - 2 * a2
    remainder_second = width * width * s1 - 2 * a2
    a3 = 10 * remainder_value - 4 * remainder_first + remainder_second / 2
    a4 = -15 * remainder_value + 7 * remainder_first - remainder_second
    a5 = 6 * remainder_value - 3 * remainder_first + remainder_second / 2
    return a0, a1, a2, a3, a4, a5


def _quintic_jet(coefficients, coordinate, width):
    value = sum(
        coefficient * coordinate**index
        for index, coefficient in enumerate(coefficients)
    )
    first = sum(
        index * coefficients[index] * coordinate ** (index - 1)
        for index in range(1, 6)
    ) / width
    second = sum(
        index * (index - 1) * coefficients[index] * coordinate ** (index - 2)
        for index in range(2, 6)
    ) / (width * width)
    return value, first, second


def _endpoint_seconds(x, u, p, potential, q, nu):
    return 2 * (potential - nu) * u - 2 * p / x, u * u - 2 * q / x


def _decode_center(center, decoder):
    mesh = tuple(decoder(word) for word in center["meshF64Hex"])
    rows = tuple(
        tuple(decoder(word) for word in row)
        for row in center["stateRowsF64Hex"]
    )
    vc = decoder(center["parameters"]["VcF64Hex"])
    nu = decoder(center["parameters"]["nuF64Hex"])
    mass = decoder(center["summaryF64Hex"]["mass"])
    kappa = decoder(center["summaryF64Hex"]["kappa"])
    sigma = decoder(center["summaryF64Hex"]["sigma"])
    return mesh, rows, vc, nu, mass, kappa, sigma


def _exact_quintic_residual(center, runner):
    mesh, rows, _vc, nu, _mass, _kappa, _sigma = _decode_center(
        center, runner._fraction_from_f64_hex
    )
    interval = next(
        ordinal
        for ordinal in range(len(mesh) - 1)
        if mesh[ordinal] < POINT_X < mesh[ordinal + 1]
    )
    left, right = mesh[interval], mesh[interval + 1]
    width = right - left
    seconds0 = _endpoint_seconds(
        left, *(rows[row][interval] for row in range(4)), nu
    )
    seconds1 = _endpoint_seconds(
        right, *(rows[row][interval + 1] for row in range(4)), nu
    )
    coordinate = (POINT_X - left) / width
    u_jet = _quintic_jet(
        _quintic_coefficients(
            rows[0][interval],
            rows[1][interval],
            seconds0[0],
            rows[0][interval + 1],
            rows[1][interval + 1],
            seconds1[0],
            width,
        ),
        coordinate,
        width,
    )
    v_jet = _quintic_jet(
        _quintic_coefficients(
            rows[2][interval],
            rows[3][interval],
            seconds0[1],
            rows[2][interval + 1],
            rows[3][interval + 1],
            seconds1[1],
            width,
        ),
        coordinate,
        width,
    )
    u, ux, uxx = u_jet
    potential = v_jet[0]
    residual = -Fraction(1, 2) * (uxx + 2 * ux / POINT_X)
    residual += (potential - nu) * u
    denominator = 1 + abs(uxx / 2) + abs(ux / POINT_X)
    denominator += abs(potential * u) + abs(nu * u)
    return abs(residual) / denominator


def _float_quintic_value(x, x0, x1, y0, m0, s0, y1, m1, s1):
    width = x1 - x0
    coefficients = _quintic_coefficients(y0, m0, s0, y1, m1, s1, width)
    return _quintic_jet(coefficients, (x - x0) / width, width)[0]


def _origin_coefficients(vc: float, nu: float):
    a = [Fraction(1)]
    b = [Fraction.from_float(vc)]
    nu_fraction = Fraction.from_float(nu)
    for shell in range(16):
        denominator = Fraction((2 * shell + 2) * (2 * shell + 3))
        ba = sum(b[k] * a[shell - k] for k in range(shell + 1))
        aa = sum(a[k] * a[shell - k] for k in range(shell + 1))
        a.append(2 * (ba - nu_fraction * a[shell]) / denominator)
        b.append(aa / denominator)
    return tuple(a), tuple(b)


def _series(coefficients, x):
    xf = Fraction.from_float(x)
    return float(
        sum(
            coefficient * xf ** (2 * index)
            for index, coefficient in enumerate(coefficients)
        )
    )


def _profile(center):
    decoder = lambda word: struct.unpack(">d", bytes.fromhex(word))[0]
    mesh, rows, vc, nu, mass, kappa, sigma = _decode_center(center, decoder)
    a, b = _origin_coefficients(vc, nu)
    seconds = tuple(
        _endpoint_seconds(mesh[i], *(rows[row][i] for row in range(4)), nu)
        for i in range(len(mesh))
    )

    def profile(x):
        if x < 2.0**-12:
            return _series(a, x), _series(b, x)
        if x <= 32:
            right = bisect.bisect_left(mesh, x)
            if right < len(mesh) and mesh[right] == x:
                return rows[0][right], rows[2][right]
            left = right - 1
            return (
                _float_quintic_value(
                    x,
                    mesh[left],
                    mesh[right],
                    rows[0][left],
                    rows[1][left],
                    seconds[left][0],
                    rows[0][right],
                    rows[1][right],
                    seconds[right][0],
                ),
                _float_quintic_value(
                    x,
                    mesh[left],
                    mesh[right],
                    rows[2][left],
                    rows[3][left],
                    seconds[left][1],
                    rows[2][right],
                    rows[3][right],
                    seconds[right][1],
                ),
            )
        u = rows[0][-1] * math.exp(-kappa * (x - 32)) * (x / 32) ** sigma
        return u, -mass / x

    return profile, nu, rows


def _dct(values):
    denominator = len(values) - 1
    output = []
    for mode in range(len(values)):
        terms = []
        for ordinal, value in enumerate(values):
            weight = 0.5 if ordinal in (0, denominator) else 1.0
            angle = math.pi * mode * (denominator - ordinal) / denominator
            terms.append(weight * value * math.cos(angle))
        coefficient = 2 * math.fsum(terms) / denominator
        output.append(coefficient * (0.5 if mode in (0, denominator) else 1.0))
    return tuple(0.0 if value == 0 else value for value in output)


def _evaluate(coefficients, rho):
    theta = math.acos(max(-1.0, min(1.0, 2 * rho - 1)))
    return math.fsum(
        value * math.cos(mode * theta)
        for mode, value in enumerate(coefficients)
    )


def _projected_residual(u_coefficients, v_coefficients, nu, runner):
    u_coefficients = tuple(
        Fraction.from_float(value) for value in u_coefficients
    )
    v_coefficients = tuple(
        Fraction.from_float(value) for value in v_coefficients
    )
    rho = POINT_X / (1 + POINT_X)
    coordinate = 2 * rho - 1
    first = runner._chebyshev_derivative(u_coefficients)
    second = runner._chebyshev_derivative(first)
    u = runner._chebyshev_value(u_coefficients, coordinate)
    rho_first = 2 * runner._chebyshev_value(first, coordinate)
    rho_second = 4 * runner._chebyshev_value(second, coordinate)
    one_minus = 1 - rho
    ux = one_minus**2 * rho_first
    uxx = one_minus**4 * rho_second - 2 * one_minus**3 * rho_first
    potential = runner._chebyshev_value(v_coefficients, coordinate)
    nu_fraction = Fraction.from_float(nu)
    residual = -Fraction(1, 2) * (uxx + 2 * ux / POINT_X)
    residual += (potential - nu_fraction) * u
    denominator = 1 + abs(uxx / 2) + abs(ux / POINT_X)
    denominator += abs(potential * u) + abs(nu_fraction * u)
    return abs(residual) / denominator


def _fraction_record(value):
    return {
        "denominator": str(value.denominator),
        "numerator": str(value.numerator),
    }


def _diagnose():
    _read(PACKET_PATH, PACKET_SIZE_BYTES, PACKET_SHA256, "packet")
    runner = _load_runner()
    center = _load_center()
    center_residual = _exact_quintic_residual(center, runner)
    profile, nu, rows = _profile(center)
    records = []
    selected = None
    for ordinal, count in enumerate(MODE_COUNTS):
        rho_nodes = tuple(
            (1 - math.cos(math.pi * i / (count - 1))) / 2
            for i in range(count)
        )
        samples = tuple(
            (0.0, 0.0) if rho == 1 else profile(rho / (1 - rho))
            for rho in rho_nodes
        )
        u_coefficients = _dct(tuple(value[0] for value in samples))
        v_coefficients = _dct(tuple(value[1] for value in samples))
        node_error = max(
            max(
                abs(_evaluate(coefficients, rho) - expected)
                / (1 + abs(expected))
                for rho, expected in zip(rho_nodes, values, strict=True)
            )
            for coefficients, values in (
                (u_coefficients, tuple(value[0] for value in samples)),
                (v_coefficients, tuple(value[1] for value in samples)),
            )
        )
        join_rho = 32 / 33
        join_error = max(
            abs(_evaluate(u_coefficients, join_rho) - rows[0][-1]),
            abs(_evaluate(v_coefficients, join_rho) - rows[2][-1]),
        )
        center_v = struct.unpack(
            ">d", bytes.fromhex(center["parameters"]["VcF64Hex"])
        )[0]
        endpoint_error = max(
            abs(_evaluate(u_coefficients, 0) - 1),
            abs(_evaluate(v_coefficients, 0) - center_v),
            abs(_evaluate(u_coefficients, 1)),
            abs(_evaluate(v_coefficients, 1)),
        )
        residual = _projected_residual(u_coefficients, v_coefficients, nu, runner)
        eligible = (
            center_residual <= MARGIN
            and residual <= MARGIN
            and node_error <= NODE_LIMIT
            and join_error <= JOIN_LIMIT
            and endpoint_error <= NODE_LIMIT
        )
        if eligible and selected is None:
            selected = count
        records.append(
            {
                "eligible": eligible,
                "endpointErrorF64Hex": struct.pack(">d", endpoint_error).hex(),
                "joinErrorF64Hex": struct.pack(">d", join_error).hex(),
                "modeCount": count,
                "nodeErrorF64Hex": struct.pack(">d", node_error).hex(),
                "ordinal": ordinal,
                "projectedNormalizedResidualExact": _fraction_record(residual),
            }
        )
    if selected is not None:
        decision = "QUINTIC_MODE_SUCCESSOR_SELECTED"
    elif center_residual > MARGIN:
        decision = "QUINTIC_CENTER_REPRESENTATION_FAILED"
    else:
        decision = "BINARY64_PROJECTION_PRECISION_SUCCESSOR_REQUIRED"
    return {
        "authorityLocks": {
            name: False
            for name in (
                "candidateAuthority",
                "proofAuthority",
                "executionAuthority",
                "diagnosticLampAuthority",
                "physicalAuthority",
                "propulsionAuthority",
                "transportAuthority",
            )
        },
        "decision": decision,
        "modeRecords": records,
        "noCandidateSolve": True,
        "noRetune": True,
        "quinticCenterNormalizedResidualExact": _fraction_record(center_residual),
        "r2ReceiptSha256": R2_SELF_SHA256,
        "selectedModeCount": selected,
    }


def execute_once():
    if OUTPUT_PATH.exists():
        _fail("output_collision")
    unsigned = _diagnose()
    raw = _canonical(unsigned)
    full = dict(unsigned)
    full["receiptSha256"] = _sha256(RECEIPT_DOMAIN + struct.pack("<Q", len(raw)) + raw)
    descriptor = os.open(
        OUTPUT_PATH,
        os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_BINARY", 0),
        0o600,
    )
    with os.fdopen(descriptor, "wb", closefd=True) as handle:
        handle.write(_canonical(full)); handle.flush(); os.fsync(handle.fileno())
    return full["receiptSha256"]


def _main(arguments):
    if arguments != ["--execute-once"]:
        _fail("exact_command_required")
    sys.stdout.write(execute_once() + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))
