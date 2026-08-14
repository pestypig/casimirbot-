"""Focused algebra tests for the independent postprojection replay."""

from __future__ import annotations

import ast
from dataclasses import dataclass
from decimal import Context, Decimal, ROUND_HALF_EVEN, localcontext
import hashlib
import math
from pathlib import Path
import struct
import unittest

from verifier.errors import VerificationBlocked
from verifier.postprojection import (
    PostprojectionLevelReplay,
    PostprojectionMathReplay,
    _Work,
    _analytic_z,
    _basis,
    _clear_matrix,
    _dct_a1,
    _f64_bytes,
    _gram_and_cholesky,
    _project_rows,
    _reconstruct,
    _validate_observations,
)
from verifier.v3_inputs import (
    N32_INVENTORY,
    R6_INVENTORY,
    N32Observation,
    R6Observation,
    r6_domain_sha256,
)


@dataclass(slots=True)
class _DecimalValue:
    value: Decimal


class _DecimalArithmetic:
    """High-precision independent fixture arithmetic, never run authority."""

    _PI = Decimal(
        "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679"
    )

    def __init__(self) -> None:
        self.context = Context(prec=100, rounding=ROUND_HALF_EVEN)
        self.live: dict[int, _DecimalValue] = {}
        self.closed = False

    def _require(self, value: _DecimalValue) -> None:
        if self.closed or type(value) is not _DecimalValue or self.live.get(id(value)) is not value:
            raise AssertionError("foreign or cleared decimal fixture value")

    def new(self) -> _DecimalValue:
        if self.closed:
            raise AssertionError("closed decimal arithmetic")
        value = _DecimalValue(Decimal(0))
        self.live[id(value)] = value
        return value

    def clear(self, value: _DecimalValue) -> None:
        self._require(value)
        del self.live[id(value)]

    def set_int(self, destination: _DecimalValue, value: int) -> None:
        self._require(destination)
        destination.value = self.context.create_decimal(value)

    def set_f64(self, destination: _DecimalValue, value: float) -> None:
        self._require(destination)
        if type(value) is not float or not math.isfinite(value):
            raise AssertionError("finite float required")
        destination.value = self.context.create_decimal(Decimal.from_float(value))

    def set_rational(
        self, destination: _DecimalValue, numerator: int, denominator: int
    ) -> None:
        self._require(destination)
        destination.value = self.context.divide(
            self.context.create_decimal(numerator),
            self.context.create_decimal(denominator),
        )

    def copy(self, destination: _DecimalValue, source: _DecimalValue) -> None:
        self._require(destination)
        self._require(source)
        destination.value = self.context.create_decimal(source.value)

    def add(self, destination: _DecimalValue, left: _DecimalValue, right: _DecimalValue) -> None:
        self._require(destination)
        self._require(left)
        self._require(right)
        destination.value = self.context.add(left.value, right.value)

    def subtract(
        self, destination: _DecimalValue, left: _DecimalValue, right: _DecimalValue
    ) -> None:
        self._require(destination)
        self._require(left)
        self._require(right)
        destination.value = self.context.subtract(left.value, right.value)

    def multiply(
        self, destination: _DecimalValue, left: _DecimalValue, right: _DecimalValue
    ) -> None:
        self._require(destination)
        self._require(left)
        self._require(right)
        destination.value = self.context.multiply(left.value, right.value)

    def divide(
        self,
        destination: _DecimalValue,
        numerator: _DecimalValue,
        denominator: _DecimalValue,
    ) -> None:
        self._require(destination)
        self._require(numerator)
        self._require(denominator)
        destination.value = self.context.divide(numerator.value, denominator.value)

    def square_root(self, destination: _DecimalValue, source: _DecimalValue) -> None:
        self._require(destination)
        self._require(source)
        destination.value = self.context.sqrt(source.value)

    def cosine(self, destination: _DecimalValue, source: _DecimalValue) -> None:
        self._require(destination)
        self._require(source)
        with localcontext(self.context) as context:
            x = +source.value
            two_pi = +(self._PI * 2)
            while x > self._PI:
                x -= two_pi
            while x < -self._PI:
                x += two_pi
            term = Decimal(1)
            total = Decimal(1)
            x2 = x * x
            for order in range(1, 240):
                term *= -x2 / Decimal((2 * order - 1) * (2 * order))
                total += term
                if abs(term) < Decimal("1e-110"):
                    break
            else:
                raise AssertionError("decimal cosine did not converge")
            destination.value = +total

    def constant_pi(self, destination: _DecimalValue) -> None:
        self._require(destination)
        destination.value = self.context.create_decimal(self._PI)

    def clear_flags(self) -> None:
        if self.closed:
            raise AssertionError("closed decimal arithmetic")

    def compare_zero(self, value: _DecimalValue) -> int:
        self._require(value)
        return -1 if value.value < 0 else 1 if value.value > 0 else 0

    def get_f64(self, value: _DecimalValue) -> float:
        self._require(value)
        result = float(value.value)
        if not math.isfinite(result):
            raise AssertionError("nonfinite fixture output")
        return 0.0 if result == 0.0 else result

    def close(self) -> None:
        if self.live:
            raise AssertionError(f"fixture arithmetic leaked {len(self.live)} values")
        self.closed = True


class _AlwaysEqual:
    def __init__(self) -> None:
        self.comparisons = 0

    def __eq__(self, _other: object) -> bool:
        self.comparisons += 1
        return True


def _bits(value: float) -> str:
    return struct.pack(">d", value).hex()


def _nonmatching_level(
    level_id: str, radial_node_count: int, angular_node_count: int
) -> PostprojectionLevelReplay:
    mode_count = angular_node_count // 2
    multipoles = bytes(8 * radial_node_count * mode_count)
    base = bytes(8 * radial_node_count * angular_node_count)
    return PostprojectionLevelReplay(
        level_id=level_id,
        radial_node_count=radial_node_count,
        angular_node_count=angular_node_count,
        mode_count=mode_count,
        provisional_a1_bits="0000000000000000",
        final_a1_bits="3ff0000000000000",
        phase_sign=1,
        computed_scalar_multipole_bytes=multipoles,
        computed_potential_multipole_bytes=multipoles,
        computed_scalar_base_bytes=base,
        computed_potential_base_bytes=base,
        scalar_multipole_match=False,
        potential_multipole_match=False,
        scalar_base_match=False,
        potential_base_match=False,
        all_symbolic_masks_positive_zero=True,
        all_matches=False,
    )


class PostprojectionKernelTests(unittest.TestCase):
    def _fixture(self) -> tuple[_DecimalArithmetic, _Work[_DecimalValue]]:
        arithmetic = _DecimalArithmetic()
        return arithmetic, _Work(arithmetic)

    def _close_basis_fixture(
        self,
        arithmetic: _DecimalArithmetic,
        work: _Work[_DecimalValue],
        basis: list[list[_DecimalValue]],
        gram: list[list[_DecimalValue]],
        factor: list[list[_DecimalValue]],
    ) -> None:
        _clear_matrix(arithmetic, factor)
        _clear_matrix(arithmetic, gram)
        _clear_matrix(arithmetic, basis)
        work.close()
        arithmetic.close()

    def test_consistent_odd_identity_weight_projection_fixture(self) -> None:
        arithmetic, work = self._fixture()
        z = [1.0, 0.5, 0.0]
        basis = _basis(work, z, 2, odd=True)
        self.assertEqual(arithmetic.get_f64(basis[1][1]), -7.0 / 16.0)
        gram, factor = _gram_and_cholesky(work, basis)
        coefficients = _project_rows(
            work,
            basis,
            factor,
            (0.25, 23.0 / 64.0, 0.0),
            radial_count=1,
        )
        self.assertEqual(tuple(_bits(value) for value in coefficients), (
            "3fe0000000000000",
            "bfd0000000000000",
        ))
        self._close_basis_fixture(arithmetic, work, basis, gram, factor)

    def test_identity_weight_discriminator_and_reconstruction_fixture(self) -> None:
        arithmetic, work = self._fixture()
        z = [1.0, 0.5, 0.0]
        basis = _basis(work, z, 2, odd=False)
        gram, factor = _gram_and_cholesky(work, basis)
        coefficients = _project_rows(
            work,
            basis,
            factor,
            (1.0, 0.0, 0.0),
            radial_count=1,
        )
        self.assertEqual(tuple(_bits(value) for value in coefficients), (
            "3fcf2df2df2df2df",
            "3fe6f96f96f96f97",
        ))
        reconstruction = _reconstruct(
            work,
            z,
            (*coefficients, *coefficients),
            radial_count=2,
            mode_count=2,
            scalar=False,
        )
        self.assertEqual(tuple(_bits(value) for value in reconstruction[:3]), (
            "3feec4ec4ec4ec4f",
            "3fc3b13b13b13b14",
            "bfbd89d89d89d89e",
        ))
        self.assertEqual(reconstruction[3:], [0.0, 0.0, 0.0])
        self._close_basis_fixture(arithmetic, work, basis, gram, factor)

    def test_phase_dct_fixture_selects_and_rechecks_positive_phase(self) -> None:
        arithmetic, work = self._fixture()
        pi = arithmetic.new()
        arithmetic.constant_pi(pi)
        provisional = _dct_a1(work, pi, (0.0, -0.5, 0.0), 3, 1)
        try:
            self.assertEqual(arithmetic.compare_zero(provisional), -1)
            self.assertEqual(_bits(arithmetic.get_f64(provisional)), "c000000000000000")
        finally:
            arithmetic.clear(provisional)
        final = _dct_a1(work, pi, (0.0, 0.5, 0.0), 3, 1)
        try:
            self.assertEqual(arithmetic.compare_zero(final), 1)
            self.assertEqual(_bits(arithmetic.get_f64(final)), "4000000000000000")
        finally:
            arithmetic.clear(final)
        arithmetic.clear(pi)
        work.close()
        arithmetic.close()

    def test_unpinned_analytic_z_shape_fails_closed(self) -> None:
        arithmetic, work = self._fixture()
        pi = arithmetic.new()
        arithmetic.constant_pi(pi)
        with self.assertRaisesRegex(
            VerificationBlocked, "frozen_analytic_z_pin_required"
        ):
            _analytic_z(work, pi, 2)
        arithmetic.clear(pi)
        work.close()
        arithmetic.close()

    def test_result_surface_keeps_every_authority_lock_false(self) -> None:
        levels = (
            _nonmatching_level("L0", 64, 32),
            _nonmatching_level("L1", 96, 48),
            _nonmatching_level("L2", 128, 64),
        )
        result = PostprojectionMathReplay(levels=levels, all_levels_match=False)
        self.assertTrue(result.verifier_calculation_implemented)
        for field in (
            "runtime_conformance_established",
            "observation_provenance_established",
            "same_attempt_established",
            "authoritative_registration_allowed",
            "seed_admission_granted",
            "artifact_admission_granted",
            "physical_claim_allowed",
        ):
            self.assertIs(getattr(result, field), False)
        with self.assertRaisesRegex(
            VerificationBlocked, "exact_non_authoritative_result_shape_required"
        ):
            PostprojectionMathReplay(
                levels=levels,
                all_levels_match=False,
                physical_claim_allowed=True,
            )
        with self.assertRaisesRegex(
            VerificationBlocked, "exact_non_authoritative_result_shape_required"
        ):
            PostprojectionMathReplay(levels=levels, all_levels_match=True)

    def test_level_result_rejects_noncanonical_or_incoherent_leaves(self) -> None:
        multipoles = bytes(64 * 16 * 8)
        base = bytes(64 * 32 * 8)
        common = dict(
            level_id="L0",
            radial_node_count=64,
            angular_node_count=32,
            mode_count=16,
            provisional_a1_bits="0000000000000000",
            final_a1_bits="3ff0000000000000",
            phase_sign=1,
            computed_scalar_multipole_bytes=multipoles,
            computed_potential_multipole_bytes=multipoles,
            computed_scalar_base_bytes=base,
            computed_potential_base_bytes=base,
            scalar_multipole_match=False,
            potential_multipole_match=False,
            scalar_base_match=False,
            potential_base_match=False,
            all_symbolic_masks_positive_zero=True,
            all_matches=False,
        )
        for mutation, issue in (
            ({"final_a1_bits": "7ff8000000000000"}, "exact_level_replay_shape_required"),
            ({"phase_sign": True}, "exact_level_replay_shape_required"),
            ({"all_matches": True}, "level_replay_conjunction_mismatch"),
            (
                {
                    "computed_scalar_multipole_bytes": (
                        b"\x00\x00\x00\x00\x00\x00\x00\x80"
                        + multipoles[8:]
                    )
                },
                "canonical_finite_result_payload_required",
            ),
        ):
            with self.subTest(issue=issue), self.assertRaisesRegex(
                VerificationBlocked, issue
            ):
                PostprojectionLevelReplay(**(common | mutation))

    def test_verifier_projection_has_no_producer_or_numeric_stack_import(self) -> None:
        for filename in ("postprojection.py", "rndn256.py"):
            source = Path(__file__).with_name(filename).read_text(encoding="utf-8")
            imported: set[str] = set()
            for node in ast.walk(ast.parse(source, filename=filename)):
                if isinstance(node, ast.Import):
                    imported.update(alias.name for alias in node.names)
                elif isinstance(node, ast.ImportFrom) and node.module is not None:
                    imported.add(node.module)
            self.assertFalse(
                any(
                    name == "producer"
                    or name.startswith("producer.")
                    or name == "numpy"
                    or name.startswith("numpy.")
                    or name == "scipy"
                    or name.startswith("scipy.")
                    for name in imported
                ),
                imported,
            )

    def test_observation_boundary_requires_exact_tuples_and_inventory(self) -> None:
        with self.assertRaisesRegex(
            VerificationBlocked, "exact_observation_tuples_required"
        ):
            _validate_observations([], [])
        with self.assertRaisesRegex(
            VerificationBlocked, "exact_n32_inventory_required"
        ):
            _validate_observations((), ())

    def test_observation_fields_require_exact_immutable_scalar_types(self) -> None:
        n32: list[N32Observation] = []
        for spec in N32_INVENTORY:
            raw = bytes(spec.byte_length)
            n32.append(
                N32Observation(
                    inventory_index=spec.inventory_index,
                    path=spec.canonical_absolute_path,
                    relative_path=spec.relative_path,
                    byte_length=spec.byte_length,
                    plain_sha256=hashlib.sha256(raw).hexdigest(),
                    device_id=1,
                    inode=spec.inventory_index + 1,
                    mode=0,
                    mode_file_type=0,
                    link_count=1,
                    mtime_nanoseconds=1,
                    ctime_nanoseconds=1,
                    raw_bytes=raw,
                    security_profile="test_only",
                )
            )
        r6: list[R6Observation] = []
        for spec in R6_INVENTORY:
            raw = bytes(spec.byte_length)
            r6.append(
                R6Observation(
                    evidence_index=spec.evidence_index,
                    path=spec.canonical_absolute_path,
                    relative_path=spec.relative_path,
                    byte_length=spec.byte_length,
                    plain_sha256=hashlib.sha256(raw).hexdigest(),
                    domain_sha256=r6_domain_sha256(spec, raw),
                    device_id=1,
                    inode=spec.evidence_index + 100,
                    mode=0,
                    mode_file_type=0,
                    link_count=1,
                    mtime_nanoseconds=1,
                    ctime_nanoseconds=1,
                    raw_bytes=raw,
                    security_profile="test_only",
                )
            )

        hostile = _AlwaysEqual()
        n32[0] = N32Observation(
            inventory_index=hostile,  # type: ignore[arg-type]
            path=n32[0].path,
            relative_path=n32[0].relative_path,
            byte_length=n32[0].byte_length,
            plain_sha256=n32[0].plain_sha256,
            device_id=n32[0].device_id,
            inode=n32[0].inode,
            mode=n32[0].mode,
            mode_file_type=n32[0].mode_file_type,
            link_count=n32[0].link_count,
            mtime_nanoseconds=n32[0].mtime_nanoseconds,
            ctime_nanoseconds=n32[0].ctime_nanoseconds,
            raw_bytes=n32[0].raw_bytes,
            security_profile=n32[0].security_profile,
        )
        with self.assertRaisesRegex(
            VerificationBlocked, "exact_n32_observation_field_types_required"
        ):
            _validate_observations(tuple(n32), tuple(r6))
        self.assertEqual(hostile.comparisons, 0)

        n32[0] = N32Observation(
            inventory_index=0,
            path=N32_INVENTORY[0].canonical_absolute_path,
            relative_path=N32_INVENTORY[0].relative_path,
            byte_length=N32_INVENTORY[0].byte_length,
            plain_sha256=hashlib.sha256(bytes(N32_INVENTORY[0].byte_length)).hexdigest(),
            device_id=1,
            inode=1,
            mode=0,
            mode_file_type=0,
            link_count=1,
            mtime_nanoseconds=1,
            ctime_nanoseconds=1,
            raw_bytes=bytes(N32_INVENTORY[0].byte_length),
            security_profile="test_only",
        )
        hostile = _AlwaysEqual()
        r6[0] = R6Observation(
            evidence_index=hostile,  # type: ignore[arg-type]
            path=r6[0].path,
            relative_path=r6[0].relative_path,
            byte_length=r6[0].byte_length,
            plain_sha256=r6[0].plain_sha256,
            domain_sha256=r6[0].domain_sha256,
            device_id=r6[0].device_id,
            inode=r6[0].inode,
            mode=r6[0].mode,
            mode_file_type=r6[0].mode_file_type,
            link_count=r6[0].link_count,
            mtime_nanoseconds=r6[0].mtime_nanoseconds,
            ctime_nanoseconds=r6[0].ctime_nanoseconds,
            raw_bytes=r6[0].raw_bytes,
            security_profile=r6[0].security_profile,
        )
        with self.assertRaisesRegex(
            VerificationBlocked, "exact_r6_observation_field_types_required"
        ):
            _validate_observations(tuple(n32), tuple(r6))
        self.assertEqual(hostile.comparisons, 0)


if __name__ == "__main__":
    unittest.main()
