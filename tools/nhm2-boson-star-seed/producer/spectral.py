"""Deterministic tensor-spectral primitives for the axisymmetric SP solve."""

from __future__ import annotations

from decimal import Decimal, localcontext
from functools import lru_cache
from types import MappingProxyType
from typing import Iterable

import numpy as np


_DECIMAL_PRECISION = 120


# Independent fixture provenance.  gmpy2 is a generation-time witness only;
# the producer has no runtime dependency on it, MPFR, or GMP.
MAPPED_NODE_MPFR256_FIXTURE_PROVENANCE = MappingProxyType(
    {
        "gmpy2Version": "2.3.1",
        "gmpy2WheelSha256": (
            "4e1496e1a40c87dccb13163bebb265fdb7d0579726f197d59a93b94441e4e509"
        ),
        "gmpy2Cp313PydSha256": (
            "56f2bf12ffd4ca523f403bd2b6ce13069800cc2fc4332cf5de3537a34e8c76fb"
        ),
        "gmpy2Cp313PydByteLength": 442_368,
        "mpfrVersion": "4.2.2",
        "mpfrDllSha256": (
            "95b280f52d24a1fe1e024877ee325a629c3424e12961d27f84daec73d02c4bd8"
        ),
        "mpfrDllByteLength": 904_297,
        "gmpVersion": "6.3.0",
        "gmpDllSha256": (
            "829adcf025d22e641c6816b431fbe5b226a39b390c7205192d480151646fe9c9"
        ),
        "gmpDllByteLength": 1_083_865,
        "cpythonVersion": "3.13.7",
        "precisionBits": 256,
        "roundingMode": "MPFR_RNDN_for_every_operation_and_mpfr_get_d",
        "mappedNodeOperationOrder": (
            "pi=const_pi; argument=RN(pi*index); "
            "argument=RN(argument/(count-1)); cosine=RN(cos(argument)); "
            "difference=RN(1-cosine); rho=RN(difference/2); "
            "theta=RN(RN(pi*difference)/4); then RN-even binary64"
        ),
        "analyticZOperationOrder": (
            "z=RN(cos(exact_mapped_theta_MPFR_value)) then RN-even binary64 "
            "before theta binary64 serialization; symbolic z[0]=1 and z[-1]=+0"
        ),
        "arrayEncoding": "raw_little_endian_IEEE754_binary64_C_order",
        "verifierBackendReplay": "direct_MpfrBackend_mapped_node_sequence_match",
        "runtimeDependency": "none_fixture_generation_only",
    }
)


MAPPED_NODE_F64LE_SHA256 = MappingProxyType(
    {
        ("rho", 64): "1f42876204af11c7eebab8bba8cbcd8694270e106f19479bbbd74fc47521ecab",
        ("rho", 96): "e4693c83ca71d6cba37317baa2a716b487cbd6689b003845246e9e1e235f8cd9",
        ("rho", 128): "9e170ea9a3c1a75005fa764258be838a2141564140e0434caeadc178863f24a4",
        ("rho", 256): "0de2b433de1de16840a4a63231bfe72089b4a91b6f44bbe410b3724f2a6e9e9a",
        ("theta", 32): "991643f4c2d20d7c7c8f639f42346af45bd2ac01cebb35c44eae06b5f38e5ae3",
        ("theta", 48): "e9c60c916310165f1f1719bfaef2fb7ca418e37a3a7b2d56e05878c9750e050e",
        ("theta", 64): "010b1fb4c92e8ae89c6ae217e98143e3d42f90f781de04e51ee61e8dbaaa5178",
        ("theta", 128): "0c35a610d4f1197991302eabd929da6864f5ea3a33dcf8be87401c29320aa601",
        ("z", 32): "43df86c4df06c23912e5081c50dacc95770cdb42ead94e76843b5cf1783b6152",
        ("z", 48): "59b550cace75f27d7e0d09842d2a27c705865ab449a1a3a89e54a0b4afb3d46c",
        ("z", 64): "e1a253f71ce0a71d52f062be5d20a817df5c8b2d6e86859464058d2a8ec26c28",
        ("z", 128): "c65b4e8c6c69e02c383b7eb2cf247d450e53f4bd626686da046efa54727c2773",
    }
)


@lru_cache(maxsize=1)
def decimal_pi() -> Decimal:
    """Return pi with guard digits using the Chudnovsky series."""

    with localcontext() as ctx:
        ctx.prec = _DECIMAL_PRECISION + 20
        c = Decimal(426880) * Decimal(10005).sqrt()
        m = 1
        l = 13_591_409
        x = 1
        k = 6
        series = Decimal(l)
        # Each term contributes roughly fourteen decimal digits.
        for i in range(1, 12):
            m = (m * (k**3 - 16 * k)) // (i**3)
            l += 545_140_134
            x *= -262_537_412_640_768_000
            series += Decimal(m * l) / Decimal(x)
            k += 12
        ctx.prec = _DECIMAL_PRECISION
        return +(c / series)


def decimal_cos(value: Decimal) -> Decimal:
    """Cosine on [0, pi] with enough guard digits for binary64 rounding."""

    with localcontext() as ctx:
        ctx.prec = _DECIMAL_PRECISION + 16
        pi = decimal_pi()
        x = +value
        sign = Decimal(1)
        if x > pi / 2:
            x = pi - x
            sign = Decimal(-1)
        if x == 0:
            return sign
        if x == pi / 2:
            return Decimal(0)
        term = Decimal(1)
        total = Decimal(1)
        x2 = x * x
        tolerance = Decimal(10) ** Decimal(-(_DECIMAL_PRECISION + 6))
        for order in range(1, 160):
            term *= -x2 / Decimal((2 * order - 1) * (2 * order))
            total += term
            if abs(term) < tolerance:
                break
        else:  # pragma: no cover - impossible for the frozen angular range
            raise ArithmeticError("decimal cosine failed to converge")
        ctx.prec = _DECIMAL_PRECISION
        return +(sign * total)


@lru_cache(maxsize=None)
def mapped_nodes(count: int, angular: bool = False) -> tuple[np.ndarray, np.ndarray | None]:
    """Return frozen mapped Lobatto nodes and, for theta, cos(theta).

    Decimal evaluation avoids a platform-libm dependency in the serialized
    node arrays. Decimal-to-float conversion supplies RN-even binary64. For an
    angular grid, ``z`` is evaluated from the un-serialized high-precision
    mapped ``theta`` value; it is never ``cos(float(theta))``.
    """

    if count < 2:
        raise ValueError("Lobatto node count must be at least two")
    pi = decimal_pi()
    nodes: list[float] = []
    cos_theta: list[float] = []
    denominator = Decimal(count - 1)
    for index in range(count):
        if index == 0:
            cosine = Decimal(1)
        elif index == count - 1:
            cosine = Decimal(-1)
        elif 2 * index == count - 1:
            cosine = Decimal(0)
        else:
            cosine = decimal_cos(pi * Decimal(index) / denominator)
        if angular:
            theta = (pi / Decimal(4)) * (Decimal(1) - cosine)
            if index == 0:
                theta = Decimal(0)
            elif index == count - 1:
                theta = pi / Decimal(2)
            analytic_z = decimal_cos(theta)
            nodes.append(float(theta))
            cos_theta.append(float(analytic_z))
        else:
            rho = (Decimal(1) - cosine) / Decimal(2)
            if index == 0:
                rho = Decimal(0)
            elif index == count - 1:
                rho = Decimal(1)
            nodes.append(float(rho))
    node_array = canonical_f64(np.asarray(nodes, dtype=np.float64))
    if not angular:
        return node_array, None
    z_array = canonical_f64(np.asarray(cos_theta, dtype=np.float64))
    z_array[0] = 1.0
    z_array[-1] = 0.0
    return node_array, z_array


def lobatto_barycentric_weights(count: int) -> np.ndarray:
    weights = np.ones(count, dtype=np.float64)
    weights[0] = 0.5
    weights[-1] = 0.5
    weights[1::2] *= -1.0
    return weights


@lru_cache(maxsize=None)
def differentiation_matrix(count: int, angular: bool = False) -> np.ndarray:
    """Differentiate on either frozen mapped Lobatto coordinate.

    Both ``rho`` and ``theta`` are affine images of the ascending
    Chebyshev--Lobatto abscissae, so they share the exact barycentric weight
    ratios.  Building the matrix from the serialized source nodes keeps the
    derivative tied to the same binary64 coordinates used by the solve.
    """

    nodes, _ = mapped_nodes(count, angular=angular)
    weights = lobatto_barycentric_weights(count)
    difference = nodes[:, None] - nodes[None, :]
    matrix = np.zeros((count, count), dtype=np.float64)
    mask = ~np.eye(count, dtype=bool)
    ratio = weights[None, :] / weights[:, None]
    matrix[mask] = ratio[mask] / difference[mask]
    matrix[np.diag_indices(count)] = -np.sum(matrix, axis=1)
    matrix.setflags(write=False)
    return matrix


def interpolation_matrix(source_nodes: np.ndarray, target_nodes: np.ndarray) -> np.ndarray:
    """Barycentric interpolation matrix in deterministic target order."""

    source = np.asarray(source_nodes, dtype=np.float64)
    target = np.asarray(target_nodes, dtype=np.float64)
    weights = lobatto_barycentric_weights(source.size)
    matrix = np.empty((target.size, source.size), dtype=np.float64)
    for row, point in enumerate(target):
        exact = np.flatnonzero(source == point)
        if exact.size:
            matrix[row] = 0.0
            matrix[row, int(exact[0])] = 1.0
            continue
        terms = weights / (point - source)
        matrix[row] = terms / np.sum(terms)
    return matrix


def radial_interpolate(coefficients: np.ndarray, target_rho: np.ndarray) -> np.ndarray:
    coefficients = np.asarray(coefficients, dtype=np.float64)
    source_rho, _ = mapped_nodes(coefficients.shape[0])
    return interpolation_matrix(source_rho, target_rho) @ coefficients


def tensor_interpolate(
    values: np.ndarray,
    target_rho: np.ndarray,
    target_theta: np.ndarray,
) -> np.ndarray:
    """Barycentrically prolong one frozen nodal field in both coordinates."""

    source = np.asarray(values, dtype=np.float64)
    if source.ndim != 2:
        raise ValueError("tensor interpolation requires one rank-two nodal field")
    source_rho, _ = mapped_nodes(source.shape[0])
    source_theta, _ = mapped_nodes(source.shape[1], angular=True)
    radial = interpolation_matrix(source_rho, np.asarray(target_rho, dtype=np.float64))
    angular = interpolation_matrix(
        source_theta,
        np.asarray(target_theta, dtype=np.float64),
    )
    return radial @ source @ angular.T


def parity_degrees(mode_count: int, odd: bool) -> np.ndarray:
    return np.arange(1 if odd else 0, 2 * mode_count + (1 if odd else 0), 2, dtype=np.int64)


def legendre_table(z: np.ndarray, degrees: Iterable[int]) -> np.ndarray:
    z_values = np.asarray(z, dtype=np.float64)
    degree_array = np.asarray(tuple(int(value) for value in degrees), dtype=np.int64)
    if degree_array.size == 0 or np.any(degree_array < 0):
        raise ValueError("invalid Legendre degree inventory")
    maximum = int(np.max(degree_array))
    all_modes = np.empty((z_values.size, maximum + 1), dtype=np.float64)
    all_modes[:, 0] = 1.0
    if maximum:
        all_modes[:, 1] = z_values
    for ell in range(1, maximum):
        all_modes[:, ell + 1] = (
            (2 * ell + 1) * z_values * all_modes[:, ell]
            - ell * all_modes[:, ell - 1]
        ) / (ell + 1)
    return all_modes[:, degree_array]


def odd_legendre_quotient_table(z: np.ndarray, mode_count: int) -> np.ndarray:
    """Evaluate P_(2q+1)(z)/z with its exact removable value at z=0."""

    z_values = np.asarray(z, dtype=np.float64)
    odd_degrees = parity_degrees(mode_count, True)
    odd_basis = legendre_table(z_values, odd_degrees)
    quotient = np.empty_like(odd_basis)
    nonzero = z_values != 0.0
    quotient[nonzero, :] = odd_basis[nonzero, :] / z_values[nonzero, None]
    if np.any(~nonzero):
        even_predecessors = legendre_table(z_values[~nonzero], odd_degrees - 1)
        quotient[~nonzero, :] = even_predecessors * odd_degrees[None, :]
    return quotient


def reconstruct(multipoles: np.ndarray, z: np.ndarray, *, odd: bool) -> np.ndarray:
    coefficients = np.asarray(multipoles, dtype=np.float64)
    basis = legendre_table(z, parity_degrees(coefficients.shape[1], odd))
    return coefficients @ basis.T


@lru_cache(maxsize=None)
def nodal_parity_projector(angular_count: int, odd: bool) -> np.ndarray:
    """Return the source-frozen collocation-to-Legendre projector.

    The sealed contract fixes the mapped nodal samples, parity inventories,
    and post-solve projection order but does not name a quadrature or weighting
    rule for projecting the raw collocation vector.  This producer therefore
    freezes the unique unweighted collocation least-squares map in source:
    ``(B.T B)^-1 B.T``, where ``B`` is the requested parity-Legendre basis on
    the exact frozen angular nodes.  The toolchain is separately hash-bound;
    no runtime-selected projector or tolerance is admitted.
    """

    if angular_count < 2 or angular_count % 2 != 0:
        raise ValueError("parity projection requires an even angular node count")
    _, z = mapped_nodes(angular_count, angular=True)
    assert z is not None
    basis = legendre_table(z, parity_degrees(angular_count // 2, odd))
    gram = basis.T @ basis
    projector = np.linalg.solve(gram, basis.T)
    projector = canonical_f64(projector)
    projector.setflags(write=False)
    return projector


def project_nodal_to_parity(values: np.ndarray, *, odd: bool) -> np.ndarray:
    """Project every radial nodal row to the frozen parity-mode inventory."""

    nodal = np.asarray(values, dtype=np.float64)
    if nodal.ndim != 2:
        raise ValueError("parity projection requires one rank-two nodal field")
    projector = nodal_parity_projector(nodal.shape[1], odd)
    return canonical_f64(nodal @ projector.T)


def resample_parity_multipoles(
    multipoles: np.ndarray,
    target_rho: np.ndarray,
    target_angular_count: int,
    *,
    odd: bool,
) -> np.ndarray:
    """Resample the unique radial-polynomial x parity-Legendre field."""

    coefficients = np.asarray(multipoles, dtype=np.float64)
    if coefficients.ndim != 2:
        raise ValueError("parity resampling requires rank-two multipoles")
    radial_modes = radial_interpolate(coefficients, np.asarray(target_rho, dtype=np.float64))
    _, target_z = mapped_nodes(target_angular_count, angular=True)
    assert target_z is not None
    return canonical_f64(reconstruct(radial_modes, target_z, odd=odd))


@lru_cache(maxsize=None)
def parity_quadrature(mode_count: int) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Gauss rule and exact coefficient projectors for nonlinear closure."""

    # Products V_even*u_odd*P_odd and u_odd^2*P_even reach degree < 6M.
    order = 3 * mode_count + 8
    full_z, full_w = np.polynomial.legendre.leggauss(order)
    z = 0.5 * (full_z + 1.0)
    weights = 0.5 * full_w
    odd_degrees = parity_degrees(mode_count, True)
    even_degrees = parity_degrees(mode_count, False)
    odd_basis = legendre_table(z, odd_degrees)
    even_basis = legendre_table(z, even_degrees)
    odd_projector = (weights[:, None] * odd_basis) * (2 * odd_degrees + 1)[None, :]
    even_projector = (weights[:, None] * even_basis) * (2 * even_degrees + 1)[None, :]
    return z, odd_basis, even_basis, np.stack((odd_projector.T, even_projector.T))


def nonlinear_products(
    scalar_odd: np.ndarray,
    potential_even: np.ndarray,
) -> tuple[np.ndarray, np.ndarray]:
    """Project V*u and u^2 without a forbidden Y10-only truncation."""

    scalar = np.asarray(scalar_odd, dtype=np.float64)
    potential = np.asarray(potential_even, dtype=np.float64)
    if scalar.shape != potential.shape:
        raise ValueError("scalar and potential multipole shapes differ")
    _, odd_basis, even_basis, projectors = parity_quadrature(scalar.shape[1])
    u_values = scalar @ odd_basis.T
    v_values = potential @ even_basis.T
    vu = (u_values * v_values) @ projectors[0].T
    u2 = (u_values * u_values) @ projectors[1].T
    return vu, u2


def radial_laplacian(multipoles: np.ndarray, *, odd: bool) -> np.ndarray:
    """Apply Delta_axi mode by mode on interior compact radial nodes."""

    values = np.asarray(multipoles, dtype=np.float64)
    count = values.shape[0]
    rho, _ = mapped_nodes(count)
    d_rho = differentiation_matrix(count)
    first = d_rho @ values
    second = d_rho @ first
    result = np.zeros_like(values)
    interior = slice(1, -1)
    r = rho[interior]
    one_minus = 1.0 - r
    x = r / one_minus
    degrees = parity_degrees(values.shape[1], odd).astype(np.float64)
    radial_first = one_minus[:, None] ** 2 * first[interior]
    radial_second = (
        one_minus[:, None] ** 4 * second[interior]
        - 2.0 * one_minus[:, None] ** 3 * first[interior]
    )
    result[interior] = (
        radial_second
        + 2.0 * radial_first / x[:, None]
        - degrees[None, :] * (degrees[None, :] + 1.0) * values[interior] / x[:, None] ** 2
    )
    return result


def canonical_f64(value: np.ndarray) -> np.ndarray:
    """Return finite C-contiguous native float64 with canonical positive zero."""

    result = np.array(value, dtype=np.float64, order="C", copy=True)
    if not np.all(np.isfinite(result)):
        raise FloatingPointError("nonfinite binary64 value")
    result[result == 0.0] = 0.0
    return result
