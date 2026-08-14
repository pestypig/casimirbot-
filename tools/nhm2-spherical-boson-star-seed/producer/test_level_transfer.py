from __future__ import annotations

import ast
from dataclasses import FrozenInstanceError, replace
import hashlib
import json
import math
import os
from pathlib import Path
import struct
import subprocess
import sys
from types import MappingProxyType
import unittest
from unittest.mock import patch

import gmpy2


HERE = Path(__file__).resolve().parent
REPOSITORY_ROOT = HERE.parents[2]
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import level_transfer as transfer  # noqa: E402
from level_transfer import (  # noqa: E402
    ACCEPTED_TRANSFER_PAIRS,
    AUTHORITY_LOCKS,
    BARYCENTRIC_OPERATION_GRAPH,
    EXACT_NODE_MATCH_GRAPH,
    FIELD_TRANSFER_ORDER,
    LEVEL_NODE_COUNTS,
    MPFR_EMAX,
    MPFR_EMIN,
    MPFR_PRECISION_BITS,
    MPFR_ROUNDING_MODE,
    PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES,
    PRIMARY_NUMERICS_POLICY_SHA256,
    SOURCE_RHO_HASH_DOMAIN,
    SOURCE_RHO_PAYLOAD_GOLDEN_HASHES,
    SOURCE_WEIGHT_GRAPH,
    SPECTRAL_PAYLOAD_GOLDEN_HASHES,
    SPECTRAL_SOURCE_SHA256,
    SPECTRAL_SOURCE_SIZE_BYTES,
    LevelTransferError,
    transfer_accepted_level_state,
)

generate_lobatto_spectral_primitive = (
    transfer._spectral_module.generate_lobatto_spectral_primitive
)


GOLDEN_DOMAIN = (
    b"nhm2-spherical-boson-star-seed-accepted-level-transfer/golden/v1\n"
)
GOLDEN_HASHES = {
    (64, 96): "604418dce7dea59c5053442956fbb973943974ee0b9b5edfea701ae06831aae2",
    (96, 128): "5fa20ebfa31f1e69d3e7e1dba1878fcb72bf6bb483d4e0dd81771e36a4933032",
}

CONTEXT_FIELDS = (
    "precision",
    "round",
    "emin",
    "emax",
    "subnormalize",
    "trap_underflow",
    "trap_overflow",
    "trap_inexact",
    "trap_invalid",
    "trap_erange",
    "trap_divzero",
    "underflow",
    "overflow",
    "inexact",
    "invalid",
    "erange",
    "divzero",
    "allow_complex",
    "rational_division",
    "allow_release_gil",
)


def _bits(value: float) -> bytes:
    return struct.pack("<d", value)


def _negative_zero(value: float) -> bool:
    return value == 0.0 and _bits(value) == bytes.fromhex("0000000000000080")


def _state_l0() -> tuple[float, ...]:
    count = 64
    u = tuple(math.ldexp(float(index + 1), -9) for index in range(count))
    potential = tuple(
        -math.ldexp(float(count - index), -10) for index in range(count)
    )
    return (*u, *potential, -0.25)


def _golden_hash(result: object, source_state: tuple[float, ...]) -> str:
    digest = hashlib.sha256()
    digest.update(GOLDEN_DOMAIN)
    source_count = result.source_node_count  # type: ignore[attr-defined]
    target_count = result.target_node_count  # type: ignore[attr-defined]
    digest.update(source_count.to_bytes(8, "little", signed=False))
    digest.update(target_count.to_bytes(8, "little", signed=False))
    for label, values in (
        (b"source_state", source_state),
        (b"target_state", result.state),  # type: ignore[attr-defined]
    ):
        digest.update(len(label).to_bytes(8, "little", signed=False))
        digest.update(label)
        digest.update(len(values).to_bytes(8, "little", signed=False))
        digest.update(struct.pack(f"<{len(values)}d", *values))
    return digest.hexdigest()


def _context_snapshot(context: gmpy2.context) -> tuple[object, ...]:
    return tuple(getattr(context, field) for field in CONTEXT_FIELDS)


def _transfer(
    source_level: str,
    source_rho: tuple[float, ...],
    target_spectral: object,
    source_state: tuple[float, ...],
) -> object:
    return transfer_accepted_level_state(
        source_level=source_level,
        archived_source_rho=source_rho,
        projected_source_state=source_state,
        target_spectral=target_spectral,  # type: ignore[arg-type]
    )


def _hand_barycentric(
    source_nodes: tuple[float, ...],
    source_values: tuple[float, ...],
    target_node: float,
) -> float:
    template = gmpy2.get_context().copy()
    template.precision = 256
    template.round = gmpy2.RoundToNearest
    template.emin = -1_000_000
    template.emax = 1_000_000
    template.subnormalize = False
    template.trap_underflow = False
    template.trap_overflow = False
    template.trap_inexact = False
    template.trap_invalid = False
    template.trap_erange = False
    template.trap_divzero = False
    template.allow_complex = False
    template.rational_division = False
    template.allow_release_gil = False
    with gmpy2.context(template):
        rho_out = gmpy2.mpfr(target_node, 256)
        numerator = gmpy2.mpfr(0, 256)
        denominator = gmpy2.mpfr(0, 256)
        count = len(source_nodes)
        for index in range(count):
            magnitude = gmpy2.mpfr(1 if index in (0, count - 1) else 2, 256)
            weight = magnitude / gmpy2.mpfr(2, 256)
            if index % 2:
                weight = -weight
            difference = rho_out - gmpy2.mpfr(source_nodes[index], 256)
            ratio = weight / difference
            weighted = ratio * gmpy2.mpfr(source_values[index], 256)
            numerator = gmpy2.mpfr(numerator + weighted, 256)
            denominator = gmpy2.mpfr(denominator + ratio, 256)
        return float(numerator / denominator)


class AcceptedLevelTransferTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        source_l0 = generate_lobatto_spectral_primitive(64)
        target_l1 = generate_lobatto_spectral_primitive(96)
        cls.source_rho = {64: tuple(source_l0.rho), 96: tuple(target_l1.rho)}
        cls.targets = {96: target_l1}
        cls.l0_state = _state_l0()
        cls.l0_to_l1 = _transfer(
            "L0", cls.source_rho[64], target_l1, cls.l0_state
        )
        target_l2 = generate_lobatto_spectral_primitive(128)
        cls.targets[128] = target_l2
        cls.l1_to_l2 = _transfer(
            "L1", cls.source_rho[96], target_l2, cls.l0_to_l1.state
        )

    def test_exact_policy_source_rho_and_target_spectral_bindings(self) -> None:
        self.assertEqual(
            (PRIMARY_NUMERICS_POLICY_SHA256, PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES),
            (
                "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4",
                80_055,
            ),
        )
        spectral_bytes = (HERE / "spectral.py").read_bytes()
        self.assertEqual(len(spectral_bytes), SPECTRAL_SOURCE_SIZE_BYTES)
        self.assertEqual(
            hashlib.sha256(spectral_bytes).hexdigest(), SPECTRAL_SOURCE_SHA256
        )
        self.assertEqual(
            (SPECTRAL_SOURCE_SHA256, SPECTRAL_SOURCE_SIZE_BYTES),
            (
                "e9b2509b0c4a5d417250b3d145a648404cde440f12961d2faec1bc14758b78f7",
                19_045,
            ),
        )
        self.assertEqual(
            dict(SPECTRAL_PAYLOAD_GOLDEN_HASHES),
            {
                64: "83f63880c10f9aafae4d3c173cbb11fabd1baecf1a67c29c3b3f75636536a680",
                96: "33a584aeacfaa92b0fc2bf642ed6e8f5a2ab67f5692d0a37c056e510aa35b8e3",
                128: "9997d1ede86739b4716d838f287f5aaca27edba3fb52748ad0ac48a6e62f7c45",
            },
        )
        self.assertEqual(
            SOURCE_RHO_HASH_DOMAIN,
            b"nhm2-spherical-boson-star-seed/core-level/transfer-rho-f64le/v1\n",
        )
        self.assertEqual(
            dict(SOURCE_RHO_PAYLOAD_GOLDEN_HASHES),
            {
                64: "ba32f26043e32131bd12a672de28d1cb6eadf0d5d12f9ffd690ed5558f24d362",
                96: "8766de10d18a94211c450c51d7f701d0a9ed3e54e88173e22898a68168c00bdd",
            },
        )
        for result in (self.l0_to_l1, self.l1_to_l2):
            self.assertFalse(hasattr(result, "source_spectral_payload_sha256"))
            self.assertEqual(
                result.source_rho_payload_sha256,
                SOURCE_RHO_PAYLOAD_GOLDEN_HASHES[result.source_node_count],
            )
            self.assertEqual(
                result.target_spectral_payload_sha256,
                SPECTRAL_PAYLOAD_GOLDEN_HASHES[result.target_node_count],
            )

        executable = "npx.cmd" if os.name == "nt" else "npx"
        program = (
            "import {NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_"
            "SHA256 as h,NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_"
            "V1_CANONICAL_SIZE_BYTES as s} from './shared/contracts/nhm2-spherical-"
            "boson-star-newtonian-seed-primary-numerics.v1.ts';console.log(JSON.stringify({h,s}));"
        )
        completed = subprocess.run(
            [executable, "tsx", "-e", program],
            cwd=REPOSITORY_ROOT,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=30,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(
            json.loads(completed.stdout),
            {
                "h": PRIMARY_NUMERICS_POLICY_SHA256,
                "s": PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES,
            },
        )

    def test_exact_path_preloaded_spectral_module_is_ignored(self) -> None:
        module_path = HERE / "level_transfer.py"
        program = f"""
import importlib.util
import pathlib
import sys
import types

path = pathlib.Path({str(module_path)!r})
fake = types.ModuleType("spectral")
fake.__file__ = str(path.with_name("spectral.py"))
fake.FrozenLobattoSpectralPrimitive = object
fake.AUTHORITY_LOCKS = {{"candidateAuthority": True}}
sys.modules["spectral"] = fake
private_name = "_nhm2_spherical_seed_transfer_spectral_e9b2509b0c4a5d41"
sys.modules[private_name] = fake
spec = importlib.util.spec_from_file_location("hostile_level_transfer", path)
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)
private = module._spectral_module
source = private.generate_lobatto_spectral_primitive(64)
target = private.generate_lobatto_spectral_primitive(96)
state = (*((0.0,) * 64), *((1.0,) * 64), -0.5)
result = module.transfer_accepted_level_state(
    source_level="L0",
    archived_source_rho=source.rho,
    projected_source_state=state,
    target_spectral=target,
)
print(
    int(
        private is not fake
        and sys.modules["spectral"] is fake
        and sys.modules[private_name] is fake
        and pathlib.Path(private.__file__).resolve() == path.with_name("spectral.py")
        and module.FrozenLobattoSpectralPrimitive
        is private.FrozenLobattoSpectralPrimitive
        and len(result.state) == 193
        and result.source_node_count == 64
        and result.target_node_count == 96
    )
)
"""
        environment = os.environ.copy()
        environment["PYTHONDONTWRITEBYTECODE"] = "1"
        completed = subprocess.run(
            [sys.executable, "-B", "-W", "error", "-c", program],
            cwd=REPOSITORY_ROOT,
            env=environment,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=30,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout.strip(), "1")

    def test_target_snapshot_and_archived_source_survive_caller_changes(self) -> None:
        source_rho = self.source_rho[64]
        target = replace(self.targets[96])
        original_validate = transfer._validate_spectral_primitive
        changed = False

        def mutate_before_validation(
            snapshot: transfer._FrozenSpectralSnapshot,
            role: str,
        ) -> tuple[transfer._FrozenSpectralSnapshot, str]:
            nonlocal changed
            if not changed:
                changed = True
                object.__setattr__(
                    target,
                    "barycentric_weights",
                    tuple(reversed(target.barycentric_weights)),
                )
                object.__setattr__(
                    target,
                    "primary_numerics_policy_sha256",
                    "0" * 64,
                )
            return original_validate(snapshot, role)

        with patch.object(
            transfer,
            "_validate_spectral_primitive",
            side_effect=mutate_before_validation,
        ):
            observed = _transfer(
                "L0",
                source_rho,
                target,
                self.l0_state,
            )
        self.assertEqual(
            _golden_hash(observed, self.l0_state),
            GOLDEN_HASHES[(64, 96)],
        )

    def test_only_frozen_pairs_and_literal_chronology_are_exposed(self) -> None:
        self.assertEqual(dict(LEVEL_NODE_COUNTS), {"L0": 64, "L1": 96, "L2": 128})
        self.assertEqual(
            dict(ACCEPTED_TRANSFER_PAIRS),
            {(64, 96): ("L0", "L1"), (96, 128): ("L1", "L2")},
        )
        self.assertEqual(FIELD_TRANSFER_ORDER, ("u", "V", "nu_bits"))
        self.assertIn("copy_lowest_exact_match_value_bits", EXACT_NODE_MATCH_GRAPH)
        self.assertIn("source_j_increasing", SOURCE_WEIGHT_GRAPH)
        self.assertIn("field_u_then_V", BARYCENTRIC_OPERATION_GRAPH)
        self.assertIn("copy_exact_nu_bits_last", BARYCENTRIC_OPERATION_GRAPH)
        self.assertEqual(MPFR_PRECISION_BITS, 256)
        self.assertEqual(MPFR_ROUNDING_MODE, "MPFR_RNDN")
        self.assertEqual((MPFR_EMIN, MPFR_EMAX), (-1_000_000, 1_000_000))

        calls: list[str] = []
        original = transfer._interpolate_field
        original_rho_validation = transfer._validate_archived_source_rho
        original_state_validation = transfer._validate_source_state
        original_snapshot = transfer._snapshot_spectral_primitive
        numeric_read_contexts: list[tuple[object, ...]] = []
        snapshot_roles: list[str] = []

        def observed(*args: object, **kwargs: object) -> tuple[float, ...]:
            field = args[-1]
            self.assertIsInstance(field, str)
            calls.append(field)  # type: ignore[arg-type]
            return original(*args, **kwargs)  # type: ignore[arg-type]

        def observed_state_validation(*args: object, **kwargs: object) -> tuple[float, ...]:
            numeric_read_contexts.append(_context_snapshot(gmpy2.get_context()))
            return original_state_validation(*args, **kwargs)  # type: ignore[arg-type]

        def observed_rho_validation(*args: object, **kwargs: object) -> object:
            numeric_read_contexts.append(_context_snapshot(gmpy2.get_context()))
            return original_rho_validation(*args, **kwargs)

        def observed_snapshot(value: object, role: str) -> object:
            numeric_read_contexts.append(_context_snapshot(gmpy2.get_context()))
            snapshot_roles.append(role)
            return original_snapshot(value, role)

        with (
            patch.object(transfer, "_interpolate_field", side_effect=observed),
            patch.object(
                transfer,
                "_validate_archived_source_rho",
                side_effect=observed_rho_validation,
            ),
            patch.object(
                transfer,
                "_validate_source_state",
                side_effect=observed_state_validation,
            ),
            patch.object(
                transfer,
                "_snapshot_spectral_primitive",
                side_effect=observed_snapshot,
            ),
            patch.object(
                transfer._spectral_module,
                "generate_lobatto_spectral_primitive",
                side_effect=AssertionError(
                    "production transfer must not generate a source grid"
                ),
            ),
        ):
            result = _transfer(
                "L0", self.source_rho[64], self.targets[96], self.l0_state
            )
        self.assertEqual(calls, ["u", "V"])
        self.assertEqual(snapshot_roles, ["target"])
        self.assertEqual(len(numeric_read_contexts), 3)
        for snapshot in numeric_read_contexts:
            installed = dict(zip(CONTEXT_FIELDS, snapshot))
            self.assertEqual(installed["precision"], 256)
            self.assertEqual(installed["round"], gmpy2.RoundToNearest)
            self.assertEqual(
                (installed["emin"], installed["emax"]),
                (-1_000_000, 1_000_000),
            )
            self.assertTrue(
                all(
                    installed[field] is False
                    for field in CONTEXT_FIELDS
                    if field not in {"precision", "round", "emin", "emax"}
                )
            )
        self.assertEqual(_bits(result.nu), _bits(self.l0_state[-1]))

    def test_complete_output_bits_match_both_frozen_goldens(self) -> None:
        self.assertEqual(set(GOLDEN_HASHES), {(64, 96), (96, 128)})
        cases = (
            (self.l0_to_l1, self.l0_state),
            (self.l1_to_l2, self.l0_to_l1.state),
        )
        for result, source_state in cases:
            pair = (result.source_node_count, result.target_node_count)
            with self.subTest(pair=pair):
                self.assertEqual(_golden_hash(result, source_state), GOLDEN_HASHES[pair])
                self.assertEqual(
                    len(result.state), 2 * result.target_node_count + 1
                )
                self.assertEqual(result.state, (*result.u, *result.potential, result.nu))
                self.assertTrue(all(math.isfinite(value) for value in result.state))
                self.assertFalse(any(_negative_zero(value) for value in result.state))

    def test_exact_nodes_polynomials_and_one_independent_hand_value(self) -> None:
        source_rho = self.source_rho[64]
        target = self.targets[96]
        constant = tuple(1.0 for _ in range(64))
        polynomial_state = (*source_rho, *constant, -0.5)
        result = _transfer("L0", source_rho, target, polynomial_state)

        self.assertEqual(tuple(map(_bits, result.u)), tuple(map(_bits, target.rho)))
        self.assertEqual(result.potential, tuple(1.0 for _ in range(96)))
        self.assertEqual(_bits(result.nu), _bits(-0.5))
        for target_index, source_index in ((0, 0), (95, 63)):
            self.assertEqual(
                _bits(result.u[target_index]),
                _bits(source_rho[source_index]),
            )
            self.assertEqual(
                _bits(result.potential[target_index]), _bits(constant[source_index])
            )

        interior = 17
        expected = _hand_barycentric(
            source_rho,
            self.l0_state[:64],
            target.rho[interior],
        )
        self.assertEqual(_bits(self.l0_to_l1.u[interior]), _bits(expected))
        self.assertEqual(
            transfer._lowest_exact_node_match(0.5, (0.0, 0.5, 0.5, 1.0)),
            1,
        )

    def test_positive_zero_is_canonical_and_inputs_remain_bitwise_unchanged(self) -> None:
        source_rho = self.source_rho[64]
        target = self.targets[96]
        state = (*tuple(0.0 for _ in range(64)), *tuple(1.0 for _ in range(64)), -0.5)
        rho_before = struct.pack("<64d", *source_rho)
        before = struct.pack(f"<{len(state)}d", *state)
        target_rho_identity = target.rho
        target_D_identity = target.first_derivative
        result = _transfer("L0", source_rho, target, state)
        self.assertEqual(struct.pack("<64d", *source_rho), rho_before)
        self.assertEqual(struct.pack(f"<{len(state)}d", *state), before)
        self.assertIs(target.rho, target_rho_identity)
        self.assertIs(target.first_derivative, target_D_identity)
        self.assertTrue(all(_bits(value) == bytes(8) for value in result.u))
        self.assertEqual(result.potential, tuple(1.0 for _ in range(96)))

    def test_hostile_ambient_context_is_ignored_and_restored_on_success_and_failure(self) -> None:
        ambient = gmpy2.get_context()
        original_context = ambient.copy()
        baseline = _golden_hash(self.l0_to_l1, self.l0_state)
        try:
            ambient.precision = 19
            ambient.round = gmpy2.RoundDown
            ambient.emin = -20
            ambient.emax = 20
            ambient.subnormalize = True
            ambient.trap_inexact = True
            ambient.trap_underflow = True
            ambient.trap_overflow = True
            ambient.trap_invalid = True
            ambient.trap_erange = True
            ambient.trap_divzero = True
            ambient.allow_complex = True
            ambient.rational_division = True
            ambient.allow_release_gil = True
            ambient.inexact = True
            ambient.underflow = True
            ambient.overflow = True
            ambient.invalid = True
            ambient.erange = True
            ambient.divzero = True
            caller = _context_snapshot(ambient)

            observed = _transfer(
                "L0", self.source_rho[64], self.targets[96], self.l0_state
            )
            self.assertEqual(_golden_hash(observed, self.l0_state), baseline)
            self.assertEqual(_context_snapshot(ambient), caller)

            with patch.object(
                transfer,
                "_interpolate_field",
                side_effect=LevelTransferError("synthetic_transfer_failure"),
            ):
                with self.assertRaises(LevelTransferError) as raised:
                    _transfer(
                        "L0",
                        self.source_rho[64],
                        self.targets[96],
                        self.l0_state,
                    )
                self.assertEqual(raised.exception.code, "synthetic_transfer_failure")
            self.assertEqual(_context_snapshot(ambient), caller)
        finally:
            gmpy2.set_context(original_context)

    def test_hostile_shape_pair_value_authority_and_pin_inputs_fail_typed(self) -> None:
        source_rho = self.source_rho[64]
        target = self.targets[96]
        state = self.l0_state
        changed_rho = (
            source_rho[0],
            math.nextafter(source_rho[1], source_rho[2]),
            *source_rho[2:],
        )
        changed_weights = (
            target.barycentric_weights[0],
            -0.5,
            *target.barycentric_weights[2:],
        )

        class Hostile:
            def __getattribute__(self, name: str) -> object:
                raise AssertionError(f"hostile attribute access: {name}")

            def __repr__(self) -> str:
                raise AssertionError("hostile repr")

            def __eq__(self, other: object) -> bool:
                raise AssertionError("hostile equality")

        cases: tuple[tuple[object, object, object, object, str], ...] = (
            (Hostile(), source_rho, target, state, "transfer_source_level_invalid"),
            ("L2", source_rho, target, state, "transfer_source_level_invalid"),
            ("L0", object(), target, state, "transfer_source_rho_type_invalid"),
            ("L0", list(source_rho), target, state, "transfer_source_rho_type_invalid"),
            ("L0", target, target, state, "transfer_source_rho_type_invalid"),
            ("L0", source_rho[:-1], target, state, "transfer_source_rho_length_invalid"),
            ("L1", source_rho, target, state, "transfer_source_rho_length_invalid"),
            ("L0", changed_rho, target, state, "transfer_source_rho_payload_mismatch"),
            (
                "L0",
                (*source_rho[:-1], -0.0),
                target,
                state,
                "transfer_binary64_negative_zero_input",
            ),
            (
                "L0",
                (*source_rho[:-1], float("nan")),
                target,
                state,
                "transfer_binary64_nonfinite_input",
            ),
            ("L0", source_rho, object(), state, "transfer_spectral_primitive_type_invalid"),
            (
                "L0",
                source_rho,
                replace(target, node_count=Hostile()),
                state,
                "transfer_spectral_node_count_invalid",
            ),
            (
                "L0",
                source_rho,
                replace(target, primary_numerics_policy_sha256=Hostile()),
                state,
                "transfer_spectral_policy_binding_mismatch",
            ),
            (
                "L0",
                source_rho,
                replace(target, mpfr_precision_bits=True),
                state,
                "transfer_spectral_context_binding_mismatch",
            ),
            (
                "L0",
                source_rho,
                replace(target, observed_gmpy2_version=Hostile()),
                state,
                "transfer_spectral_context_binding_mismatch",
            ),
            ("L0", source_rho, self.targets[128], state, "transfer_level_pair_invalid"),
            (
                "L0",
                source_rho,
                replace(target, barycentric_weights=changed_weights),
                state,
                "transfer_spectral_payload_mismatch",
            ),
            (
                "L0",
                source_rho,
                replace(target, candidate_authority=True),
                state,
                "transfer_spectral_authority_lock_invalid",
            ),
            ("L0", source_rho, target, list(state), "transfer_source_state_type_invalid"),
            ("L0", source_rho, target, state[:-1], "transfer_source_state_length_invalid"),
            ("L0", source_rho, target, (*state[:-1], 0), "transfer_binary64_type_invalid"),
            (
                "L0",
                source_rho,
                target,
                (*state[:-1], float("nan")),
                "transfer_binary64_nonfinite_input",
            ),
            (
                "L0",
                source_rho,
                target,
                (*state[:-1], float("inf")),
                "transfer_binary64_nonfinite_input",
            ),
            (
                "L0",
                source_rho,
                target,
                (*state[:-1], -0.0),
                "transfer_binary64_negative_zero_input",
            ),
        )
        for (
            selected_level,
            selected_rho,
            selected_target,
            selected_state,
            expected_code,
        ) in cases:
            with self.subTest(expected_code=expected_code):
                with self.assertRaises(LevelTransferError) as raised:
                    transfer_accepted_level_state(
                        source_level=selected_level,  # type: ignore[arg-type]
                        archived_source_rho=selected_rho,  # type: ignore[arg-type]
                        projected_source_state=selected_state,  # type: ignore[arg-type]
                        target_spectral=selected_target,  # type: ignore[arg-type]
                    )
                self.assertEqual(raised.exception.code, expected_code)

        with self.assertRaises(TypeError):
            transfer_accepted_level_state(target, target, state)  # type: ignore[misc]
        with self.assertRaises(TypeError):
            transfer_accepted_level_state(  # type: ignore[call-arg]
                source_level="L0",
                archived_source_rho=source_rho,
                projected_source_state=state,
                target_spectral=target,
                source_spectral=target,
            )

        with patch.object(transfer, "SPECTRAL_SOURCE_SHA256", "0" * 64):
            with self.assertRaises(LevelTransferError) as raised:
                _transfer("L0", source_rho, target, state)
            self.assertEqual(
                raised.exception.code, "transfer_spectral_source_binding_mismatch"
            )
        with patch.object(transfer, "PRIMARY_NUMERICS_POLICY_SHA256", "0" * 64):
            with self.assertRaises(LevelTransferError) as raised:
                _transfer("L0", source_rho, target, state)
            self.assertEqual(
                raised.exception.code,
                "transfer_primary_numerics_policy_binding_mismatch",
            )
        wrong_payloads = MappingProxyType(
            {**dict(SPECTRAL_PAYLOAD_GOLDEN_HASHES), 96: "0" * 64}
        )
        with patch.object(transfer, "SPECTRAL_PAYLOAD_GOLDEN_HASHES", wrong_payloads):
            with self.assertRaises(LevelTransferError) as raised:
                _transfer("L0", source_rho, target, state)
            self.assertEqual(raised.exception.code, "transfer_spectral_payload_mismatch")
        wrong_rho_payloads = MappingProxyType(
            {**dict(SOURCE_RHO_PAYLOAD_GOLDEN_HASHES), 64: "0" * 64}
        )
        with patch.object(
            transfer,
            "SOURCE_RHO_PAYLOAD_GOLDEN_HASHES",
            wrong_rho_payloads,
        ):
            with self.assertRaises(LevelTransferError) as raised:
                _transfer("L0", source_rho, target, state)
            self.assertEqual(
                raised.exception.code,
                "transfer_source_rho_payload_mismatch",
            )

    def test_result_is_frozen_and_every_authority_surface_remains_false(self) -> None:
        result = self.l0_to_l1
        self.assertTrue(all(value is False for value in AUTHORITY_LOCKS.values()))
        for field in (
            "source_acceptance_verified",
            "solve_performed",
            "restart_performed",
            "alternate_interpolation_used",
            "filtering_used",
            "candidate_execution_authorized",
            "candidate_executed",
            "candidate_output_materialized",
            "output_present",
            "output_accepted",
            "seed_accepted",
            "branch_accepted",
            "replay_authority",
            "independent_agreement",
            "candidate_authority",
            "theory_graph_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
        ):
            self.assertIs(getattr(result, field), False)
        with self.assertRaises(FrozenInstanceError):
            result.candidate_executed = True  # type: ignore[misc]

    def test_source_has_no_solver_filter_retry_or_alternate_numeric_dependency(self) -> None:
        source = (HERE / "level_transfer.py").read_text(encoding="utf-8")
        tree = ast.parse(source)
        public = next(
            node
            for node in tree.body
            if isinstance(node, ast.FunctionDef)
            and node.name == "transfer_accepted_level_state"
        )
        self.assertEqual(public.args.posonlyargs, [])
        self.assertEqual(public.args.args, [])
        self.assertEqual(
            tuple(argument.arg for argument in public.args.kwonlyargs),
            (
                "source_level",
                "archived_source_rho",
                "projected_source_state",
                "target_spectral",
            ),
        )
        public_snapshot_calls = tuple(
            node
            for node in ast.walk(public)
            if isinstance(node, ast.Call)
            and isinstance(node.func, ast.Name)
            and node.func.id == "_snapshot_spectral_primitive"
        )
        self.assertEqual(len(public_snapshot_calls), 1)
        self.assertEqual(
            public_snapshot_calls[0].args[1].value,  # type: ignore[attr-defined]
            "target",
        )
        self.assertFalse(
            any(
                isinstance(node, ast.Call)
                and isinstance(node.func, ast.Attribute)
                and node.func.attr == "generate_lobatto_spectral_primitive"
                for node in ast.walk(public)
            )
        )
        imported_roots: set[str] = set()
        call_names: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imported_roots.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module is not None:
                imported_roots.add(node.module.split(".")[0])
            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    call_names.add(node.func.id)
                elif isinstance(node.func, ast.Attribute):
                    call_names.add(node.func.attr)
        self.assertFalse(imported_roots & {"decimal", "numpy", "scipy"})
        self.assertFalse(call_names & {"solve", "fma", "fsum", "sum", "sorted"})
        self.assertEqual(source.count("exec(code, module.__dict__)"), 1)
        self.assertNotIn("import spectral", source)
        self.assertNotIn("source_spectral_payload_sha256", source)
        self.assertNotIn("nhm2-spherical-boson-star-branch", source)
        self.assertNotIn("import numpy", source)
        self.assertNotIn("import scipy", source)


if __name__ == "__main__":
    unittest.main()
