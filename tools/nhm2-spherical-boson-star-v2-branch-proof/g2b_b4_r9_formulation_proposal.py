"""Authority-neutral B4-R9 numerical formulation proposal primitives.

No function in this module imports a candidate runner, materializes a candidate
state, solves a Newton correction, or writes an artifact.  The routines freeze
and validate the two new numerical primitives that a later B4-R10 executor may
bind: power-of-two linear-system equilibration and the B4-R8 interpolatory
prefix operator.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math
from pathlib import Path
import stat
from typing import Final, NoReturn, Sequence

import gmpy2


PROPOSAL_VERSION: Final[str] = "nhm2_spherical_boson_star_v2_g2b_b4_r9_formulation/v1"
PREFIX_OPERATOR_VERSION: Final[str] = "shifted_chebyshev_mpfr512_householder_qr_prefix/v1"
EQUILIBRATION_VERSION: Final[str] = "binary64_power_two_row_then_column_equilibration/v1"
LEVEL_NODE_COUNTS: Final[tuple[int, ...]] = (64, 96, 128, 256)
AMPLITUDE_EXPONENTS: Final[tuple[int, ...]] = (-16, -15, -14, -13, -12, -11, -10)
FUTURE_OUTPUT_ROOT_RELATIVE: Final[str] = (
    "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r10-four-grid-v1"
)

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


@dataclass(frozen=True, slots=True)
class FrozenBinding:
    role: str
    relative_path: str
    size_bytes: int
    sha256: str


FROZEN_BINDINGS: Final[tuple[FrozenBinding, ...]] = (
    FrozenBinding("branch_selection_policy", "shared/contracts/nhm2-spherical-boson-star-v2-branch-selection-numerics.v1.ts", 44_912, "d20e6eeef3d185ff938aa27cc83af87a201d76f986c63d77e0dbe72cf8600c82"),
    FrozenBinding("radial_primary_numerics", "shared/contracts/nhm2-spherical-boson-star-v2-radial-primary-numerics.v1.ts", 34_965, "dfec69750d345893a02483e1a13eb65c928966f0635e43ee559e0ed630634f10"),
    FrozenBinding("initializer_evaluator", "shared/contracts/nhm2-spherical-boson-star-v2-initializer-evaluator.v1.ts", 60_627, "05d0c327090a30065a453941ad4612f518818dd88f230864d4ef257c9e8a2be4"),
    FrozenBinding("r8_definition", "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r8-continuum-constraint-propagation.md", 7_995, "96b68fd6be27a80d8486fc05b19100bf3cc34f324aa11878e2a0cea7b73faf1c"),
    FrozenBinding("r8_result", "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r8-result-record.md", 4_025, "2e601951c1eb99973c434beb6adc06939bc6b69568c9515d41737c1b37ef691a"),
    FrozenBinding("r8_norm_source", "tools/nhm2-spherical-boson-star-v2-branch-proof/g2b_b4_r8_constraint_propagation_definition.py", 2_687, "6831534c32d9d850e3fb867d55e0d75c276ee327911ff6b2edf71e44f9d70842"),
    FrozenBinding("r4_successor", "tools/nhm2-spherical-boson-star-v2-branch-proof/g2b_b4_r4_integrated_four_grid_successor.py", 13_018, "e60ecb4ddfaa1caf7a3b811554975ce5b9c53482e10f25bc9c901ac37d609027"),
    FrozenBinding("r3_predictor_receipt", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r3-initializer-predictor-binding-v1/receipt.json", 5_971, "e5f22ce8fd9814d55395d1ea585c650a412520ccccaa1c51be072d2f68dcfd5b"),
    FrozenBinding("initializer_receipt", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r1-initializer-scalar-abi-v1/receipt.json", 7_212, "fb7b5a8e344289756f5c622994bb6d53e01187236322eac6c0559319e4c06590"),
    FrozenBinding("initializer_scalars", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r1-initializer-scalar-abi-v1/scalars.f64le", 72, "47f2858a2332d5fd079eae07c6301b745e91d0219155528deb7158a79e1bd21a"),
    FrozenBinding("initializer_core_u", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r1-initializer-scalar-abi-v1/coefficients/core_L2_u.f64le", 1_024, "0a943efd5b010baaa899bc323f4c1490bf2c2c7359e3b5328995b48739e983fb"),
    FrozenBinding("initializer_core_v", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r1-initializer-scalar-abi-v1/coefficients/core_L2_V.f64le", 1_024, "ff766c6893e58d9f3f130bf1806bdef2e0ef284f676d426e297e149fa76d544c"),
    FrozenBinding("initializer_tail_h", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r1-initializer-scalar-abi-v1/coefficients/tail_H.f64le", 256, "5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1"),
    FrozenBinding("initializer_tail_q", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r1-initializer-scalar-abi-v1/coefficients/tail_Q.f64le", 256, "5341e6b2646979a70e57653007a1f310169421ec9bdd9f1a5648f75ade005af1"),
    FrozenBinding("initializer_join_barrier", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r1-initializer-scalar-abi-v1/initializer/core_L2_join_barrier.f64le", 32, "23f5fe0948668e598b5f1c469c7b987bc3fc08f94a122419b470202a406677b9"),
    FrozenBinding("newton", "tools/nhm2-spherical-boson-star-branch/deterministic_newton.py", 13_891, "60ad54e4376e43aa8c496e38fa9a495cab4d0a5001ca2515692a684889516618"),
    FrozenBinding("dense_lu", "tools/nhm2-spherical-boson-star-branch/deterministic_dense_lu.py", 8_033, "70b63cdf3517d0ae5f81217ca31d6d1d2a7450b76569e7693c3b8e9e59572ce2"),
    FrozenBinding("compactified_system", "tools/nhm2-spherical-boson-star-branch/radial_compactified_system.py", 15_202, "dafe134453b5a2a328fbe9088b4e85593e9ea4ee231923fec4024d2f67ebb905"),
    FrozenBinding("residual", "tools/nhm2-spherical-boson-star-branch/radial_residual.py", 10_222, "c22249155373344069772bfe2b4807385de6d7edc4454242d855b6f8611cd205"),
    FrozenBinding("residual_jacobian", "tools/nhm2-spherical-boson-star-branch/radial_residual_jacobian.py", 5_583, "5464f2010e051cf2487fbdd9f6879b355d7e7ede47e6bd3ea245916781a1119e"),
    FrozenBinding("lobatto_grid", "tools/nhm2-spherical-boson-star-branch/radial_lobatto_grid.py", 6_704, "ea424885abed4788d989cd228b7c4dd7b8907909bd4a0931b2e009d021d4d385"),
    FrozenBinding("field_cross_grid", "tools/nhm2-spherical-boson-star-v2-branch-proof/radial_cross_grid_convergence.py", 51_746, "dba7650a90a2f6b56ff95e63917e92e5e15465628cf7c5bdbff5ba97526b724f"),
    FrozenBinding("linux_runtime", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b3-linux-runtime-v1/runtime-manifest.json", 2_220, "98cb6d63f94e3faf038621465f2417373b579b99e68d8f29473c9c3b79ee14c0"),
    FrozenBinding("r4_terminal", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r4-four-grid-v1/terminal-receipt.json", 2_739, "4a76e65331e6b6244fe9fbf9437552a4f450423eb1d57ee0b8e42d6452de9204"),
    FrozenBinding("r5_receipt", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r5-terminal-newton-diagnosis-v1/receipt.json", 20_509, "645073d238da325db5e727825fcdf4705a08d5e7ae6951be5616d9cc6826fb52"),
    FrozenBinding("r6_receipt", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r6-mechanism-separation-v1/receipt.json", 12_503, "e7f0580ab0e8a52b5bf8fe69691f00f821a0004ea5dd49b623a1e498bce203b2"),
    FrozenBinding("r7_receipt", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r7-causal-interaction-review-v1/receipt.json", 7_325, "6164f02d0fd6a91606692e9a451f8bc26d3a38fe6b8ae1afff36463606d506ea"),
)


class ProposalInvariantError(RuntimeError):
    pass


def _fail(code: str) -> NoReturn:
    raise ProposalInvariantError(code)


def verify_frozen_bindings(repository_root: Path) -> tuple[FrozenBinding, ...]:
    """Reopen only preregistered files; never parse candidate numerical data."""

    root = repository_root.resolve(strict=True)
    for binding in FROZEN_BINDINGS:
        path = root.joinpath(*binding.relative_path.split("/"))
        metadata = path.lstat()
        raw = path.read_bytes()
        if (
            not stat.S_ISREG(metadata.st_mode)
            or stat.S_ISLNK(metadata.st_mode)
            or len(raw) != binding.size_bytes
            or hashlib.sha256(raw).hexdigest() != binding.sha256
        ):
            _fail(f"frozen_binding_mismatch:{binding.role}")
    return FROZEN_BINDINGS


@dataclass(frozen=True, slots=True)
class EquilibratedSystem:
    matrix: tuple[tuple[float, ...], ...]
    rhs: tuple[float, ...]
    row_scales: tuple[float, ...]
    column_scales: tuple[float, ...]


def _finite_square(matrix: Sequence[Sequence[float]], rhs: Sequence[float]) -> tuple[tuple[tuple[float, ...], ...], tuple[float, ...]]:
    order = len(matrix)
    if order < 1 or len(rhs) != order:
        raise ValueError("equilibration_shape_invalid")
    rows: list[tuple[float, ...]] = []
    for row in matrix:
        if len(row) != order:
            raise ValueError("equilibration_shape_invalid")
        values = tuple(float(value) for value in row)
        if any(not math.isfinite(value) for value in values):
            raise ValueError("equilibration_nonfinite_matrix")
        rows.append(values)
    frozen_rhs = tuple(float(value) for value in rhs)
    if any(not math.isfinite(value) for value in frozen_rhs):
        raise ValueError("equilibration_nonfinite_rhs")
    return tuple(rows), frozen_rhs


def _power_two_scale(maximum: float) -> float:
    if maximum == 0.0:
        return 1.0
    _mantissa, exponent = math.frexp(maximum)
    return math.ldexp(1.0, -exponent)


def equilibrate_linear_system(matrix: Sequence[Sequence[float]], rhs: Sequence[float]) -> EquilibratedSystem:
    """Apply the frozen row pass, then column pass, using exact powers of two."""

    rows, frozen_rhs = _finite_square(matrix, rhs)
    order = len(rows)
    row_scales = tuple(_power_two_scale(max(abs(value) for value in row)) for row in rows)
    row_matrix = tuple(
        tuple(row_scales[i] * rows[i][j] for j in range(order))
        for i in range(order)
    )
    row_rhs = tuple(row_scales[i] * frozen_rhs[i] for i in range(order))
    column_scales = tuple(
        _power_two_scale(max(abs(row_matrix[i][j]) for i in range(order)))
        for j in range(order)
    )
    output = tuple(
        tuple(row_matrix[i][j] * column_scales[j] for j in range(order))
        for i in range(order)
    )
    return EquilibratedSystem(output, row_rhs, row_scales, column_scales)


def recover_unscaled_direction(scaled_direction: Sequence[float], column_scales: Sequence[float]) -> tuple[float, ...]:
    if len(scaled_direction) != len(column_scales) or not scaled_direction:
        raise ValueError("direction_scale_shape_invalid")
    output = tuple(float(value) * float(scale) for value, scale in zip(scaled_direction, column_scales, strict=True))
    if any(not math.isfinite(value) for value in output):
        raise ValueError("direction_scale_nonfinite")
    return output


def _mpfr512_context():
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
    total = gmpy2.mpfr(0)
    for value in values:
        total += value
    return total


def interpolatory_prefix_mpfr512(nodes: Sequence[float], values: Sequence[float]) -> tuple[float, ...]:
    """Integrate the unique nodal interpolant using shifted-Chebyshev QR.

    Inputs are exact binary64 words lifted to MPFR512.  Householder operations,
    back substitution, analytic Chebyshev antiderivatives, and the final RNDN
    conversion all have fixed ascending-index chronology.
    """

    if len(nodes) != len(values) or len(nodes) < 2:
        raise ValueError("prefix_shape_invalid")
    rho = tuple(float(value) for value in nodes)
    source = tuple(float(value) for value in values)
    if (
        rho[0] != 0.0
        or rho[-1] != 1.0
        or any(not math.isfinite(value) for value in rho + source)
        or any(not rho[index] > rho[index - 1] for index in range(1, len(rho)))
    ):
        raise ValueError("prefix_input_invalid")

    count = len(rho)
    with _mpfr512_context():
        zero, one, two, four = (gmpy2.mpfr(value) for value in (0, 1, 2, 4))
        matrix: list[list[object]] = []
        for node in rho:
            t = two * gmpy2.mpfr(node) - one
            row = [one]
            if count > 1:
                row.append(t)
            for degree in range(2, count):
                row.append(two * t * row[-1] - row[-2])
            matrix.append(row)
        right = [gmpy2.mpfr(value) for value in source]

        for column in range(count):
            vector = [matrix[row][column] for row in range(column, count)]
            norm = gmpy2.sqrt(_mp_sum([value * value for value in vector]))
            if norm == zero:
                _fail("prefix_rank_deficient")
            vector[0] += norm if vector[0] >= zero else -norm
            norm_square = _mp_sum([value * value for value in vector])
            if norm_square == zero:
                _fail("prefix_householder_zero")
            for target_column in range(column, count):
                dot = _mp_sum(
                    [vector[offset] * matrix[column + offset][target_column] for offset in range(len(vector))]
                )
                factor = two * dot / norm_square
                for offset, value in enumerate(vector):
                    matrix[column + offset][target_column] -= factor * value
            dot_right = _mp_sum([vector[offset] * right[column + offset] for offset in range(len(vector))])
            factor_right = two * dot_right / norm_square
            for offset, value in enumerate(vector):
                right[column + offset] -= factor_right * value

        coefficients = [zero for _ in range(count)]
        for row in range(count - 1, -1, -1):
            diagonal = matrix[row][row]
            if diagonal == zero:
                _fail("prefix_back_substitution_singular")
            tail = _mp_sum([matrix[row][column] * coefficients[column] for column in range(row + 1, count)])
            coefficients[row] = (right[row] - tail) / diagonal

        output: list[float] = []
        for node in rho:
            r = gmpy2.mpfr(node)
            t = two * r - one
            chebyshev = [one]
            if count + 1 > 1:
                chebyshev.append(t)
            for degree in range(2, count + 1):
                chebyshev.append(two * t * chebyshev[-1] - chebyshev[-2])
            integrated = [r]
            if count > 1:
                integrated.append((t * t - one) / four)
            for degree in range(2, count):
                upper = chebyshev[degree + 1] / gmpy2.mpfr(degree + 1)
                lower = chebyshev[degree - 1] / gmpy2.mpfr(degree - 1)
                endpoint = (
                    gmpy2.mpfr(-1 if (degree + 1) % 2 else 1) / gmpy2.mpfr(degree + 1)
                    - gmpy2.mpfr(-1 if (degree - 1) % 2 else 1) / gmpy2.mpfr(degree - 1)
                )
                integrated.append((upper - lower - endpoint) / four)
            value = _mp_sum([coefficient * basis for coefficient, basis in zip(coefficients, integrated, strict=True)])
            rounded = float(value)
            if not math.isfinite(rounded):
                _fail("prefix_output_nonfinite")
            output.append(0.0 if rounded == 0.0 else rounded)
    return tuple(output)


def contracts_without_threshold(errors: Sequence[float]) -> bool:
    """Require adjacent errors to decrease strictly, allowing only zero plateau."""

    frozen = tuple(float(value) for value in errors)
    if len(frozen) < 2 or any(not math.isfinite(value) or value < 0.0 for value in frozen):
        raise ValueError("contraction_error_invalid")
    return all(
        later < earlier or (earlier == 0.0 and later == 0.0)
        for earlier, later in zip(frozen, frozen[1:])
    )


def proposal_manifest() -> dict[str, object]:
    return {
        "proposalVersion": PROPOSAL_VERSION,
        "continuumRows": ["Et_t", "Etheta_theta", "KGbar"],
        "unusedConstraint": "Ex_x",
        "frequencyCoordinate": "direct_binary64_w_with_strict_0_lt_w_lt_1",
        "linearIntervention": EQUILIBRATION_VERSION,
        "prefixOperator": PREFIX_OPERATOR_VERSION,
        "constraintProfiles": ["q", "delta"],
        "constraintNorms": ["linf", "clenshaw_curtis_l2"],
        "analyticEndpointValues": {"qOrigin": 0.0, "qInfinity": 0.0, "sourceOrigin": 0.0, "sourceInfinity": 0.0},
        "constraintAcceptance": "strict_adjacent_contraction_or_exact_zero_plateau_for_level_norms_and_pair_errors",
        "levelNodeCounts": list(LEVEL_NODE_COUNTS),
        "amplitudeExponents": list(AMPLITUDE_EXPONENTS),
        "coarseGridPredictorAllowed": False,
        "retryAllowed": False,
        "retuneAllowed": False,
        "candidateExecutionAuthorized": False,
        "futureExclusiveOutputRoot": FUTURE_OUTPUT_ROOT_RELATIVE,
        "authorityLocks": dict(AUTHORITY_LOCKS),
    }


__all__ = [
    "AUTHORITY_LOCKS",
    "EQUILIBRATION_VERSION",
    "FROZEN_BINDINGS",
    "FUTURE_OUTPUT_ROOT_RELATIVE",
    "PREFIX_OPERATOR_VERSION",
    "PROPOSAL_VERSION",
    "ProposalInvariantError",
    "contracts_without_threshold",
    "equilibrate_linear_system",
    "interpolatory_prefix_mpfr512",
    "proposal_manifest",
    "recover_unscaled_direction",
    "verify_frozen_bindings",
]
