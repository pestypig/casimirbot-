"""Lightweight deterministic source checks; this never runs a production solve."""

from __future__ import annotations

import hashlib
from pathlib import Path
import sys

import numpy as np


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from contract import (  # noqa: E402
    AUTHORITATIVE_BINDINGS,
    GRID_LEVELS,
    NU_BASE,
    OUTPUT_BYTE_LENGTH,
    OUTPUT_ELEMENT_COUNT,
    OUTPUT_INVENTORY,
    OUTPUT_RELATIVE_PATHS,
    GridLevel,
)
from solver import (  # noqa: E402
    SpectralSolution,
    _pack,
    _postproject_fields,
    _prolong_guess,
    _unpack,
    raw_residual,
    residual_fields,
)
from spectral import (  # noqa: E402
    MAPPED_NODE_F64LE_SHA256,
    MAPPED_NODE_MPFR256_FIXTURE_PROVENANCE,
    canonical_f64,
    differentiation_matrix,
    interpolation_matrix,
    mapped_nodes,
    nonlinear_products,
    odd_legendre_quotient_table,
    project_nodal_to_parity,
    reconstruct,
    resample_parity_multipoles,
)


def _raw_f64le_sha256(values: np.ndarray) -> str:
    array = np.asarray(values, dtype="<f8", order="C")
    assert array.flags.c_contiguous
    return hashlib.sha256(array.tobytes(order="C")).hexdigest()


def _mapped_node_fixture_checks() -> None:
    provenance = MAPPED_NODE_MPFR256_FIXTURE_PROVENANCE
    assert provenance["gmpy2Version"] == "2.3.1"
    assert provenance["gmpy2WheelSha256"] == (
        "4e1496e1a40c87dccb13163bebb265fdb7d0579726f197d59a93b94441e4e509"
    )
    assert provenance["mpfrVersion"] == "4.2.2"
    assert provenance["gmpVersion"] == "6.3.0"
    assert provenance["cpythonVersion"] == "3.13.7"
    assert provenance["precisionBits"] == 256
    assert provenance["runtimeDependency"] == "none_fixture_generation_only"
    assert "exact_mapped_theta_MPFR_value" in provenance["analyticZOperationOrder"]
    assert "before theta binary64 serialization" in provenance["analyticZOperationOrder"]

    expected_keys = {
        *(('rho', count) for count in (64, 96, 128, 256)),
        *(('theta', count) for count in (32, 48, 64, 128)),
        *(('z', count) for count in (32, 48, 64, 128)),
    }
    assert set(MAPPED_NODE_F64LE_SHA256) == expected_keys

    for level in GRID_LEVELS:
        rho, _ = mapped_nodes(level.radial_count)
        theta, z = mapped_nodes(level.angular_count, angular=True)
        assert z is not None
        assert rho.shape == (level.radial_count,)
        assert theta.shape == (level.angular_count,)
        assert z.shape == (level.angular_count,)
        assert _raw_f64le_sha256(rho) == MAPPED_NODE_F64LE_SHA256[
            ("rho", level.radial_count)
        ]
        assert _raw_f64le_sha256(theta) == MAPPED_NODE_F64LE_SHA256[
            ("theta", level.angular_count)
        ]
        assert _raw_f64le_sha256(z) == MAPPED_NODE_F64LE_SHA256[
            ("z", level.angular_count)
        ]
        assert rho[0] == 0.0 and not np.signbit(rho[0])
        assert theta[0] == 0.0 and not np.signbit(theta[0])
        assert z[-1] == 0.0 and not np.signbit(z[-1])
        assert rho[-1] == 1.0
        assert z[0] == 1.0
        assert np.all(np.diff(rho) > 0.0)
        assert np.all(np.diff(theta) > 0.0)
        assert np.all(np.diff(z) < 0.0)


def _inventory_and_node_checks() -> None:
    assert NU_BASE == -0.5
    assert len(OUTPUT_INVENTORY) == 32
    assert len(set(OUTPUT_RELATIVE_PATHS)) == 32
    assert OUTPUT_ELEMENT_COUNT == 810_288
    assert OUTPUT_BYTE_LENGTH == 6_482_304
    assert tuple(item.inventory_index for item in OUTPUT_INVENTORY) == tuple(range(32))
    assert AUTHORITATIVE_BINDINGS["proofReplayProtocolBinding"]["protocolVersion"] == (
        "nhm2.prolate_boson_star_newtonian_seed.proof_replay_protocol/v1"
    )

    rho, _ = mapped_nodes(16)
    theta, z = mapped_nodes(16, angular=True)
    assert rho[0] == 0.0 and rho[-1] == 1.0
    assert theta[0] == 0.0 and z is not None and z[0] == 1.0
    assert theta[-1] == float(np.pi / 2.0) and z[-1] == 0.0
    assert np.all(np.diff(rho) > 0.0)
    assert np.all(np.diff(theta) > 0.0)
    np.testing.assert_allclose(rho + rho[::-1], 1.0, rtol=0.0, atol=2.0e-16)

    derivative = differentiation_matrix(16)
    polynomial = 1.0 - 2.0 * rho + 3.0 * rho**2 - 4.0 * rho**3
    exact = -2.0 + 6.0 * rho - 12.0 * rho**2
    np.testing.assert_allclose(derivative @ polynomial, exact, rtol=0.0, atol=2.0e-12)
    angular_derivative = differentiation_matrix(16, angular=True)
    angular_polynomial = 1.0 - 2.0 * theta + 3.0 * theta**2
    angular_exact = -2.0 + 6.0 * theta
    np.testing.assert_allclose(
        angular_derivative @ angular_polynomial,
        angular_exact,
        rtol=0.0,
        atol=3.0e-12,
    )
    interpolation = interpolation_matrix(rho, rho)
    np.testing.assert_array_equal(interpolation, np.eye(rho.size))


def _nodal_vector_and_row_map_checks() -> None:
    for level in GRID_LEVELS[:3]:
        shape = (level.radial_count, level.angular_count)
        scalar = np.zeros(shape, dtype=np.float64)
        potential = np.ones(shape, dtype=np.float64)
        vector = _pack(scalar, potential)
        assert vector.size == 2 * level.radial_count * level.angular_count
        unpacked_scalar, unpacked_potential = _unpack(vector, level)
        np.testing.assert_array_equal(unpacked_scalar, scalar)
        np.testing.assert_array_equal(unpacked_potential, potential)

    level = GridLevel("ROW_TEST", 6, 8, True)
    rho, _ = mapped_nodes(level.radial_count)
    theta, _ = mapped_nodes(level.angular_count, angular=True)
    radial = rho[:, None]
    angular = theta[None, :]
    scalar = 1.0 + 2.0 * radial + 3.0 * angular + 4.0 * radial * angular
    scalar += 5.0 * radial**2 + 6.0 * angular**2
    potential = -2.0 + 7.0 * radial - 5.0 * angular + 3.0 * radial * angular
    potential += 2.0 * radial**2 - 4.0 * angular**2

    # The boundary values are intentionally nonphysical sentinels. The check
    # verifies row selection, including corner precedence, not a solution.
    with np.errstate(divide="raise", invalid="raise", over="raise"):
        schrodinger, poisson = residual_fields(scalar, potential, level)
        packed = raw_residual(_pack(scalar, potential), level)
    assert packed.size == 2 * level.radial_count * level.angular_count
    assert np.all(np.isfinite(packed))

    d_rho = differentiation_matrix(level.radial_count)
    d_theta = differentiation_matrix(level.angular_count, angular=True)
    scalar_rho = d_rho @ scalar
    potential_rho = d_rho @ potential
    scalar_rho_rho = d_rho @ scalar_rho
    potential_rho_rho = d_rho @ potential_rho
    scalar_theta = scalar @ d_theta.T
    potential_theta = potential @ d_theta.T
    scalar_theta_theta = scalar_theta @ d_theta.T
    potential_theta_theta = potential_theta @ d_theta.T

    np.testing.assert_array_equal(schrodinger[0, :], scalar[0, :])
    np.testing.assert_array_equal(schrodinger[-1, :], scalar[-1, :])
    np.testing.assert_allclose(poisson[0, :], potential_rho[0, :], rtol=0.0, atol=0.0)
    np.testing.assert_array_equal(poisson[-1, :], potential[-1, :])
    np.testing.assert_allclose(
        schrodinger[1:-1, 0],
        scalar_theta[1:-1, 0],
        rtol=0.0,
        atol=0.0,
    )
    np.testing.assert_array_equal(schrodinger[1:-1, -1], scalar[1:-1, -1])
    np.testing.assert_allclose(
        poisson[1:-1, 0],
        potential_theta[1:-1, 0],
        rtol=0.0,
        atol=0.0,
    )
    np.testing.assert_allclose(
        poisson[1:-1, -1],
        potential_theta[1:-1, -1],
        rtol=0.0,
        atol=0.0,
    )

    # All four scalar and potential corners must retain radial, not angular,
    # rows. The distinct sentinels make an overwrite observable.
    for k in (0, level.angular_count - 1):
        assert schrodinger[0, k] == scalar[0, k]
        assert schrodinger[-1, k] == scalar[-1, k]
        assert poisson[0, k] == potential_rho[0, k]
        assert poisson[-1, k] == potential[-1, k]

    j, k = 2, 3
    x = rho[j] / (1.0 - rho[j])
    radial_factor = 1.0 - rho[j]
    cot_theta = np.cos(theta[k]) / np.sin(theta[k])

    def point_laplacian(
        first_rho: np.ndarray,
        second_rho: np.ndarray,
        first_theta: np.ndarray,
        second_theta: np.ndarray,
    ) -> float:
        radial_first = radial_factor**2 * first_rho[j, k]
        radial_second = (
            radial_factor**4 * second_rho[j, k]
            - 2.0 * radial_factor**3 * first_rho[j, k]
        )
        angular_part = second_theta[j, k] + cot_theta * first_theta[j, k]
        return radial_second + 2.0 * radial_first / x + angular_part / x**2

    scalar_laplacian = point_laplacian(
        scalar_rho,
        scalar_rho_rho,
        scalar_theta,
        scalar_theta_theta,
    )
    potential_laplacian = point_laplacian(
        potential_rho,
        potential_rho_rho,
        potential_theta,
        potential_theta_theta,
    )
    np.testing.assert_allclose(
        schrodinger[j, k],
        -0.5 * scalar_laplacian + potential[j, k] * scalar[j, k] - NU_BASE * scalar[j, k],
        rtol=0.0,
        atol=2.0e-12,
    )
    np.testing.assert_allclose(
        poisson[j, k],
        potential_laplacian - scalar[j, k] ** 2,
        rtol=0.0,
        atol=2.0e-12,
    )

    radial_rows = 2 * level.angular_count
    angular_rows = 2 * (level.radial_count - 2)
    interior_rows = (level.radial_count - 2) * (level.angular_count - 2)
    assert radial_rows + angular_rows + interior_rows == (
        level.radial_count * level.angular_count
    )


def _projection_and_resampling_checks() -> None:
    level = GridLevel("PROJECTION_TEST", 6, 8, True)
    rho, _ = mapped_nodes(level.radial_count)
    mode_count = level.angular_count // 2
    generator = np.random.default_rng(0x4E484D32)

    known_scalar = generator.normal(size=(level.radial_count, mode_count))
    known_potential = generator.normal(size=(level.radial_count, mode_count))
    known_scalar[0, :] = 0.0
    known_scalar[-1, :] = 0.0
    known_potential[-1, :] = 0.0
    scalar_nodes = resample_parity_multipoles(
        known_scalar,
        rho,
        level.angular_count,
        odd=True,
    )
    potential_nodes = resample_parity_multipoles(
        known_potential,
        rho,
        level.angular_count,
        odd=False,
    )
    recovered_scalar = project_nodal_to_parity(scalar_nodes, odd=True)
    recovered_potential = project_nodal_to_parity(potential_nodes, odd=False)
    np.testing.assert_allclose(recovered_scalar, known_scalar, rtol=0.0, atol=3.0e-13)
    np.testing.assert_allclose(recovered_potential, known_potential, rtol=0.0, atol=3.0e-13)

    raw_scalar = generator.normal(size=(level.radial_count, level.angular_count))
    raw_potential = generator.normal(size=raw_scalar.shape)
    accepted_scalar, accepted_potential, scalar_odd, potential_even = _postproject_fields(
        level,
        raw_scalar,
        raw_potential,
    )
    assert scalar_odd.shape == (level.radial_count, mode_count)
    assert potential_even.shape == (level.radial_count, mode_count)

    scalar_zero_mask = np.zeros_like(accepted_scalar, dtype=bool)
    scalar_zero_mask[0, :] = True
    scalar_zero_mask[-1, :] = True
    scalar_zero_mask[:, -1] = True
    potential_zero_mask = np.zeros_like(accepted_potential, dtype=bool)
    potential_zero_mask[-1, :] = True
    np.testing.assert_array_equal(accepted_scalar == 0.0, scalar_zero_mask)
    np.testing.assert_array_equal(accepted_potential == 0.0, potential_zero_mask)
    assert int(np.count_nonzero(scalar_zero_mask)) == (
        2 * level.angular_count + level.radial_count - 2
    )
    assert int(np.count_nonzero(potential_zero_mask)) == level.angular_count
    assert np.count_nonzero(scalar_odd == 0.0) == 2 * mode_count
    assert np.count_nonzero(potential_even == 0.0) == mode_count
    for array in (accepted_scalar, accepted_potential, scalar_odd, potential_even):
        zero = array == 0.0
        assert not np.any(np.signbit(array[zero]))

    expected_scalar = resample_parity_multipoles(
        scalar_odd,
        rho,
        level.angular_count,
        odd=True,
    )
    expected_potential = resample_parity_multipoles(
        potential_even,
        rho,
        level.angular_count,
        odd=False,
    )
    expected_scalar[0, :] = 0.0
    expected_scalar[-1, :] = 0.0
    expected_scalar[:, -1] = 0.0
    expected_potential[-1, :] = 0.0
    np.testing.assert_array_equal(accepted_scalar, expected_scalar)
    np.testing.assert_array_equal(accepted_potential, expected_potential)


def _two_dimensional_prolongation_check() -> None:
    source_level = GridLevel("SOURCE", 6, 8, True)
    target_level = GridLevel("TARGET", 10, 12, True)
    source_rho, _ = mapped_nodes(source_level.radial_count)
    source_theta, _ = mapped_nodes(source_level.angular_count, angular=True)
    target_rho, _ = mapped_nodes(target_level.radial_count)
    target_theta, _ = mapped_nodes(target_level.angular_count, angular=True)
    theta_max = source_theta[-1]

    scalar = (
        source_rho[:, None]
        * (1.0 - source_rho[:, None])
        * (theta_max - source_theta[None, :])
        * (1.0 + source_theta[None, :])
    )
    potential = (
        (1.0 - source_rho[:, None])
        * (1.0 + source_rho[:, None] + source_theta[None, :])
    )
    dummy_modes = np.zeros(
        (source_level.radial_count, source_level.angular_count // 2),
        dtype=np.float64,
    )
    previous = SpectralSolution(
        source_level,
        canonical_f64(scalar),
        canonical_f64(potential),
        dummy_modes,
        dummy_modes,
        0.0,
    )
    prolonged_scalar, prolonged_potential = _prolong_guess(previous, target_level)
    expected_scalar = (
        target_rho[:, None]
        * (1.0 - target_rho[:, None])
        * (theta_max - target_theta[None, :])
        * (1.0 + target_theta[None, :])
    )
    expected_potential = (
        (1.0 - target_rho[:, None])
        * (1.0 + target_rho[:, None] + target_theta[None, :])
    )
    expected_scalar[0, :] = 0.0
    expected_scalar[-1, :] = 0.0
    expected_scalar[:, -1] = 0.0
    expected_potential[-1, :] = 0.0
    np.testing.assert_allclose(prolonged_scalar, expected_scalar, rtol=0.0, atol=2.0e-14)
    np.testing.assert_allclose(prolonged_potential, expected_potential, rtol=0.0, atol=2.0e-14)


def _legacy_operator_smokes() -> None:
    # P1^2=(P0+2P2)/3 is the minimum nonlinear-mixing identity. It proves the
    # source operator cannot consistently retain only Y10/P1.
    scalar = np.zeros((2, 4), dtype=np.float64)
    potential = np.zeros_like(scalar)
    scalar[:, 0] = 1.0
    potential[:, 0] = 1.0
    vu, u_squared = nonlinear_products(scalar, potential)
    np.testing.assert_allclose(vu[:, 0], 1.0, rtol=0.0, atol=2.0e-14)
    np.testing.assert_allclose(vu[:, 1:], 0.0, rtol=0.0, atol=2.0e-14)
    np.testing.assert_allclose(u_squared[:, 0], 1.0 / 3.0, rtol=0.0, atol=2.0e-14)
    np.testing.assert_allclose(u_squared[:, 1], 2.0 / 3.0, rtol=0.0, atol=2.0e-14)
    np.testing.assert_allclose(u_squared[:, 2:], 0.0, rtol=0.0, atol=2.0e-14)

    north_z = np.asarray([1.0, 0.0])
    scalar_nodes = reconstruct(scalar, north_z, odd=True)
    potential_nodes = reconstruct(potential, north_z, odd=False)
    np.testing.assert_array_equal(scalar_nodes[:, 1], 0.0)
    np.testing.assert_array_equal(potential_nodes, 1.0)
    quotient = odd_legendre_quotient_table(np.asarray([0.0, 0.5]), 2)
    np.testing.assert_allclose(quotient[0], np.asarray([1.0, -1.5]), rtol=0.0, atol=0.0)

    zeros = canonical_f64(np.asarray([-0.0, 0.0]))
    assert not np.any(np.signbit(zeros))


def run() -> None:
    _mapped_node_fixture_checks()
    _inventory_and_node_checks()
    _nodal_vector_and_row_map_checks()
    _projection_and_resampling_checks()
    _two_dimensional_prolongation_check()
    _legacy_operator_smokes()


if __name__ == "__main__":
    run()
