from __future__ import annotations

import ast
from dataclasses import FrozenInstanceError, replace
import hashlib
import inspect
import os
from pathlib import Path
import struct
import subprocess
import sys
from types import ModuleType, SimpleNamespace
import unittest
from unittest.mock import patch

import gmpy2


HERE = Path(__file__).resolve().parent
REPOSITORY_ROOT = HERE.parents[2]
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import core_level_orchestrator as orchestrator


def _bits(value: float) -> str:
    return struct.pack("<d", value).hex()


def _positive_zero(value: float) -> float:
    return 0.0 if value == 0.0 else value


def _state_for_grid(
    grid: orchestrator._FrozenSpectralPayload,
    level_index: int,
) -> tuple[float, ...]:
    amplitude = 1.0 + 0.125 * float(level_index)
    u = tuple(
        _positive_zero(amplitude * (1.0 - rho)) for rho in grid.rho
    )
    potential = tuple(
        _positive_zero(-0.25 * (1.0 - rho)) for rho in grid.rho
    )
    return (*u, *potential, -0.5)


class SyntheticBackend:
    """Scripted non-mathematical producer results for lifecycle tests."""

    def __init__(
        self,
        grids: dict[str, object],
        *,
        fail_newton_level: str | None = None,
        fail_projection_level: str | None = None,
        bad_transfer_shape: bool = False,
    ) -> None:
        self.grids = grids
        self.fail_newton_level = fail_newton_level
        self.fail_projection_level = fail_projection_level
        self.bad_transfer_shape = bad_transfer_shape
        self.calls: list[str] = []
        self.active_level: str | None = None
        self.solver_results: dict[str, SimpleNamespace] = {}
        self.join_result: SimpleNamespace | None = None
        self.core_result: SimpleNamespace | None = None
        self.continuation_token: object | None = None
        self._continuation_consumed = False
        self.owner_core_quadrature_module = orchestrator._core_quadrature

    def generate_spectral(self, level_id: str, node_count: int) -> object:
        self.calls.append(f"generate_spectral:{level_id}")
        if self.active_level is not None:
            raise AssertionError("two_operator_sets_live")
        if node_count != dict(orchestrator.LEVEL_NODE_COUNTS)[level_id]:
            raise AssertionError("node_count")
        self.active_level = level_id
        return self.grids[level_id]

    def release_operator(self, level_id: str) -> bool:
        self.calls.append(f"release_operator:{level_id}")
        if self.active_level != level_id:
            raise AssertionError("release_order")
        self.active_level = None
        return True

    def initialize_l0(
        self, grid: orchestrator._FrozenSpectralPayload
    ) -> SimpleNamespace:
        self.calls.append("initialize_l0")
        if self.active_level != "L0":
            raise AssertionError("initializer_lifetime")
        state = _state_for_grid(grid, 0)
        result = SimpleNamespace(
            node_count=64,
            kg=1.0,
            u=state[:64],
            V=state[64:128],
            nu=state[-1],
            z=state,
            primary_numerics_policy_sha256=(
                orchestrator.PRIMARY_NUMERICS_POLICY_SHA256
            ),
            primary_numerics_policy_canonical_size_bytes=(
                orchestrator.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
            ),
            spectral_source_sha256=orchestrator.DEPENDENCY_SOURCE_BINDINGS[
                "spectral"
            ][0],
            spectral_source_size_bytes=orchestrator.DEPENDENCY_SOURCE_BINDINGS[
                "spectral"
            ][1],
            spectral_instance_sha256=grid.payload_sha256,
            calculation_implemented=True,
            fixed_l0_graph_implemented=True,
            initializer_vector_computed=True,
        )
        for name in orchestrator._INITIALIZER_FALSE_FIELDS:
            setattr(result, name, False)
        return result

    def solve_core(
        self,
        level_id: str,
        grid: orchestrator._FrozenSpectralPayload,
        initial_state: tuple[float, ...],
    ) -> SimpleNamespace:
        self.calls.append(f"solve_core:{level_id}")
        if self.active_level != level_id:
            raise AssertionError("solver_lifetime")
        node_count = dict(orchestrator.LEVEL_NODE_COUNTS)[level_id]
        unknown_count = 2 * node_count + 1
        if type(initial_state) is not tuple or len(initial_state) != unknown_count:
            raise AssertionError("initial_state")
        projected = _state_for_grid(grid, orchestrator.LEVEL_ORDER.index(level_id))
        raw = list(projected)
        raw[node_count - 1] = 2.0**-45
        raw[2 * node_count - 1] = -(2.0**-46)
        newton_failed = self.fail_newton_level == level_id
        projection_failed = self.fail_projection_level == level_id
        residual_value = 2.0**-39 if projection_failed else 0.0
        residual = tuple(residual_value for _ in range(unknown_count))
        result = SimpleNamespace(
            node_count=node_count,
            unknown_count=unknown_count,
            raw_accepted_state=None if newton_failed else tuple(raw),
            projected_state=None if newton_failed else projected,
            projected_residual=None if newton_failed else residual,
            newton_terminated=not newton_failed,
            projection_gate_passed=not newton_failed and not projection_failed,
            failure_code="synthetic_newton_failure" if newton_failed else None,
            projection_residual_linf=(
                None if newton_failed else residual_value
            ),
            primary_numerics_policy_sha256=(
                orchestrator.PRIMARY_NUMERICS_POLICY_SHA256
            ),
            primary_numerics_policy_canonical_size_bytes=(
                orchestrator.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
            ),
            binary64_environment_source_sha256=(
                orchestrator.DEPENDENCY_SOURCE_BINDINGS["binary64_environment"][0]
            ),
            binary64_environment_source_size_bytes=(
                orchestrator.DEPENDENCY_SOURCE_BINDINGS["binary64_environment"][1]
            ),
            dense_lu_source_sha256=orchestrator.DEPENDENCY_SOURCE_BINDINGS[
                "dense_lu"
            ][0],
            dense_lu_source_size_bytes=orchestrator.DEPENDENCY_SOURCE_BINDINGS[
                "dense_lu"
            ][1],
            core_operator_source_sha256=orchestrator.DEPENDENCY_SOURCE_BINDINGS[
                "core_operator"
            ][0],
            core_operator_source_size_bytes=orchestrator.DEPENDENCY_SOURCE_BINDINGS[
                "core_operator"
            ][1],
            core_operator_dependency_sealed=True,
        )
        for name in orchestrator._NEWTON_TRUE_FIELDS:
            setattr(result, name, True)
        for name in orchestrator._NEWTON_FALSE_FIELDS:
            setattr(result, name, False)
        self.solver_results[level_id] = result
        return result

    def transfer_level(
        self,
        *,
        source_level: str,
        archived_source_rho: tuple[float, ...],
        projected_source_state: tuple[float, ...],
        target_spectral: orchestrator._FrozenSpectralPayload,
    ) -> SimpleNamespace:
        expected_target = {"L0": "L1", "L1": "L2"}.get(source_level)
        if self.active_level != expected_target:
            raise AssertionError("transfer_target_lifetime")
        target_level = expected_target
        if target_level is None:
            raise AssertionError("transfer_pair")
        self.calls.append(f"transfer_level:{source_level}->{target_level}")
        source_count = dict(orchestrator.LEVEL_NODE_COUNTS)[source_level]
        target_count = dict(orchestrator.LEVEL_NODE_COUNTS)[target_level]
        if (
            type(archived_source_rho) is not tuple
            or len(archived_source_rho) != source_count
            or type(projected_source_state) is not tuple
            or len(projected_source_state) != 2 * source_count + 1
        ):
            raise AssertionError("transfer_source_roles")
        state = _state_for_grid(
            target_spectral, orchestrator.LEVEL_ORDER.index(target_level)
        )
        state = (*state[:-1], projected_source_state[-1])
        result = SimpleNamespace(
            source_level=source_level,
            target_level=target_level,
            source_node_count=source_count,
            target_node_count=target_count,
            state=list(state) if self.bad_transfer_shape else state,
            u=state[:target_count],
            potential=state[target_count : 2 * target_count],
            nu=state[-1],
            primary_numerics_policy_sha256=(
                orchestrator.PRIMARY_NUMERICS_POLICY_SHA256
            ),
            primary_numerics_policy_canonical_size_bytes=(
                orchestrator.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
            ),
            spectral_source_sha256=orchestrator.DEPENDENCY_SOURCE_BINDINGS[
                "spectral"
            ][0],
            spectral_source_size_bytes=orchestrator.DEPENDENCY_SOURCE_BINDINGS[
                "spectral"
            ][1],
            source_rho_payload_sha256=orchestrator._hash_f64(
                orchestrator.TRANSFER_RHO_HASH_DOMAIN,
                archived_source_rho,
            ),
            target_spectral_payload_sha256=target_spectral.payload_sha256,
            mpfr_precision_bits=256,
            mpfr_rounding_mode="MPFR_RNDN",
            mpfr_emin=-1_000_000,
            mpfr_emax=1_000_000,
            field_transfer_order=("u", "V", "nu_bits"),
            calculation_implemented=True,
        )
        for name in orchestrator._TRANSFER_FALSE_FIELDS:
            setattr(result, name, False)
        return result

    def extract_join(
        self,
        grid: orchestrator._FrozenSpectralPayload,
        projected_state: tuple[float, ...],
    ) -> SimpleNamespace:
        self.calls.append("extract_join:L2")
        if self.active_level != "L2" or len(projected_state) != 257:
            raise AssertionError("join_lifetime")
        barriers = (0.125, -0.03125, -0.25, 0.0625)
        result = SimpleNamespace(
            node_count=128,
            join_x=32,
            join_rho_exact="32/33",
            U=barriers[0],
            U1=barriers[1],
            V=barriers[2],
            V1=barriers[3],
            barrier_values=barriers,
            barrier_order=("U", "U1", "V", "V1"),
            primary_numerics_policy_sha256=(
                orchestrator.PRIMARY_NUMERICS_POLICY_SHA256
            ),
            primary_numerics_policy_canonical_size_bytes=(
                orchestrator.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
            ),
            spectral_source_sha256=orchestrator.DEPENDENCY_SOURCE_BINDINGS[
                "spectral"
            ][0],
            spectral_source_size_bytes=orchestrator.DEPENDENCY_SOURCE_BINDINGS[
                "spectral"
            ][1],
            spectral_payload_sha256=grid.payload_sha256,
            calculation_implemented=True,
        )
        for name in orchestrator._JOIN_FALSE_FIELDS:
            setattr(result, name, False)
        self.join_result = result
        return result

    def integrate_core(
        self,
        grid: orchestrator._FrozenSpectralPayload,
        projected_u: tuple[float, ...],
    ) -> SimpleNamespace:
        self.calls.append("integrate_core:L2")
        if self.active_level != "L2" or len(projected_u) != 128:
            raise AssertionError("quadrature_lifetime")
        q = orchestrator._core_quadrature
        core64 = 1.25
        result = SimpleNamespace(
            node_count=128,
            core_cell_count=256,
            fixture_point_count=256,
            domain=(0, 32),
            core64=core64,
            core64_bits=_bits(core64),
            cells_completed=256,
            mapped_points_completed=65_536,
            node_integrands_completed=65_536,
            exact_node_shortcuts=0,
            projected_rho_f64le_sha256=orchestrator._hash_f64(
                q.PROJECTED_RHO_HASH_DOMAIN, grid.rho
            ),
            projected_u_f64le_sha256=orchestrator._hash_f64(
                q.PROJECTED_U_HASH_DOMAIN, projected_u
            ),
            primary_numerics_policy_sha256=(
                orchestrator.PRIMARY_NUMERICS_POLICY_SHA256
            ),
            primary_numerics_policy_canonical_size_bytes=(
                orchestrator.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
            ),
            spectral_source_sha256=orchestrator.DEPENDENCY_SOURCE_BINDINGS[
                "spectral"
            ][0],
            spectral_source_size_bytes=orchestrator.DEPENDENCY_SOURCE_BINDINGS[
                "spectral"
            ][1],
            spectral_payload_sha256=grid.payload_sha256,
            fixture_manifest_sha256=q.GL256_MANIFEST_SHA256,
            fixture_manifest_size_bytes=q.GL256_MANIFEST_SIZE_BYTES,
            fixture_records_sha256=q.GL256_RECORDS_SHA256,
            fixture_records_size_bytes=q.GL256_RECORDS_SIZE_BYTES,
            fixture_generator_sha256=q.GL256_GENERATOR_SHA256,
            fixture_generator_size_bytes=q.GL256_GENERATOR_SIZE_BYTES,
            fixture_independent_test_sha256=q.GL256_INDEPENDENT_TEST_SHA256,
            fixture_independent_test_size_bytes=q.GL256_INDEPENDENT_TEST_SIZE_BYTES,
            mpfr_precision_bits=256,
            mpfr_rounding_mode="MPFR_RNDN",
            mpfr_emin=-1_000_000,
            mpfr_emax=1_000_000,
            observed_gmpy2_version=gmpy2.version(),
            observed_mpfr_version=gmpy2.mpfr_version(),
            calculation_implemented=True,
            complete_core_graph_evaluated=True,
            one_final_get_d_observed=True,
        )
        for name in orchestrator._CORE_FALSE_FIELDS:
            setattr(result, name, False)
        self.core_result = result
        return result

    def consume_core_continuation(self, result: object) -> object:
        self.calls.append("consume_core_continuation:L2")
        if self._continuation_consumed or result is not self.core_result:
            raise AssertionError("continuation_identity_or_count")
        self._continuation_consumed = True
        template = gmpy2.get_context().copy()
        template.precision = 256
        template.round = gmpy2.RoundToNearest
        with gmpy2.context(template):
            core_sum = gmpy2.mpfr("1.25", 256)
        bindings = tuple(
            (name, getattr(result, name))
            for name in orchestrator._core_quadrature._CORE_CONTINUATION_BINDING_FIELD_NAMES
        )
        token = orchestrator._core_quadrature._CoreIntegralContinuationToken(
            result=result,
            core_sum=core_sum,
            core64=result.core64,
            bindings=bindings,
        )
        self.continuation_token = token
        return token


class CoreLevelOrchestratorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.grids = {
            level_id: orchestrator._spectral.generate_lobatto_spectral_primitive(
                node_count
            )
            for level_id, node_count in orchestrator.LEVEL_NODE_COUNTS
        }

    def tearDown(self) -> None:
        pending = orchestrator._pending_core_level_continuation
        if pending is not None:
            orchestrator._consume_core_level_continuation(pending.result)

    def test_exact_dependency_pins_private_execution_and_rebinding(self) -> None:
        orchestrator._verify_dependency_bindings()
        expected = {
            "spectral": (
                "e9b2509b0c4a5d417250b3d145a648404cde440f12961d2faec1bc14758b78f7",
                19_045,
            ),
            "core_initializer": (
                "1edb2e612603cec67118390d11f875a07e3fb1640f63d319b23bf725b016f235",
                36_770,
            ),
            "core_operator": (
                "b5333cb145ed42e443ac6e122ae77cd4ae4c05e8053cf305c91fdc3572dd6189",
                32_114,
            ),
            "dense_lu": (
                "44d38215a8ebe64a03b12b314211ccbe35001e3f963a6f6974631f9c1f07df0e",
                25_345,
            ),
            "core_newton": (
                "723100d07abdbb1524a2ea8fc1e649b0e5ecd709f69d51ed15b7ddcdc4096e55",
                57_195,
            ),
            "level_transfer": (
                "2901f959a9aa5c80cb1ccac59de7b1ac32765fdd4ff0b7b5ed38029488aa60f9",
                36_239,
            ),
            "join_extraction": (
                "d2b86dffeaa9e56aabed044f688d89c6b282600b435aa8b3491ce51ca07d7d6b",
                26_780,
            ),
            "core_quadrature": (
                "78d56665839c0c50c7ee3a013595ac5b30baf67ea9194e062a930554eeb302e1",
                47_738,
            ),
            "binary64_environment": (
                "8d452abdfa6d9b3e0cf92aa7d8682202b588f1fe8b0fe0772c6d003d2d12f1a4",
                14_980,
            ),
        }
        self.assertEqual(dict(orchestrator.DEPENDENCY_SOURCE_BINDINGS), expected)
        for role, (expected_hash, expected_size) in expected.items():
            filename = next(
                filename
                for current_role, filename, _sha, _size in orchestrator._DEPENDENCY_SPECS
                if current_role == role
            )
            raw = (HERE / filename).read_bytes()
            self.assertEqual(
                (hashlib.sha256(raw).hexdigest(), len(raw)),
                (expected_hash, expected_size),
            )
            self.assertTrue(
                orchestrator._BOUND_MODULES[role].__name__.startswith(
                    "_nhm2_seed_core_levels_"
                )
            )
            self.assertFalse(any(orchestrator._BOUND_MODULES[role].AUTHORITY_LOCKS.values()))

        transfer_parameters = tuple(
            inspect.signature(
                orchestrator._level_transfer.transfer_accepted_level_state
            ).parameters.values()
        )
        self.assertEqual(
            tuple(parameter.name for parameter in transfer_parameters),
            (
                "source_level",
                "archived_source_rho",
                "projected_source_state",
                "target_spectral",
            ),
        )
        self.assertTrue(
            all(
                parameter.kind is inspect.Parameter.KEYWORD_ONLY
                for parameter in transfer_parameters
            )
        )
        transfer_result_type = (
            orchestrator._level_transfer.FrozenAcceptedLevelTransfer
        )
        transfer_result_fields = tuple(transfer_result_type.__dataclass_fields__)
        self.assertIn("source_rho_payload_sha256", transfer_result_fields)
        self.assertNotIn("source_spectral_payload_sha256", transfer_result_fields)
        self.assertEqual(
            orchestrator._level_transfer.SOURCE_RHO_HASH_DOMAIN,
            orchestrator.TRANSFER_RHO_HASH_DOMAIN,
        )

        snapshot = orchestrator._snapshot_spectral_payload(self.grids["L0"], "L0")
        consumers = (
            orchestrator._core_initializer,
            orchestrator._core_operator,
            orchestrator._core_newton,
            orchestrator._level_transfer,
            orchestrator._join_extraction,
            orchestrator._core_quadrature,
        )
        rebound = tuple(
            orchestrator._rebind_spectral_payload(module, snapshot)
            for module in consumers
        )
        self.assertEqual(len({id(value) for value in rebound}), len(rebound))
        self.assertTrue(all(value is not self.grids["L0"] for value in rebound))
        self.assertTrue(all(value.rho == snapshot.rho for value in rebound))
        with self.assertRaises(FrozenInstanceError):
            rebound[0].node_count = 1
        lookalike = SimpleNamespace(
            **{
                name: getattr(self.grids["L0"], name)
                for name in orchestrator._SPECTRAL_FIELD_NAMES
            }
        )
        with self.assertRaises(CoreLevelOrchestratorError) as raised:
            orchestrator._snapshot_spectral_payload(lookalike, "L0")
        self.assertEqual(raised.exception.code, "core_level_spectral_type_invalid")

        quadrature_sha, quadrature_size = expected["core_quadrature"]
        separate_quadrature = orchestrator._execute_private_module(
            role="tail_initializer_composition_probe",
            filename="core_quadrature.py",
            sha256=quadrature_sha,
            size=quadrature_size,
        )
        self.assertIsNot(separate_quadrature, orchestrator._core_quadrature)
        self.assertIsNot(
            separate_quadrature.FrozenProjectedL2CoreIntegral,
            orchestrator._core_quadrature.FrozenProjectedL2CoreIntegral,
        )
        self.assertIsNone(separate_quadrature._pending_core_integral_continuation)
        self.assertIsNone(
            orchestrator._core_quadrature._pending_core_integral_continuation
        )

    def test_exact_path_preloaded_modules_are_ignored(self) -> None:
        module_path = HERE / "core_level_orchestrator.py"
        program = f"""
import importlib.util
import pathlib
import sys
import types

path = pathlib.Path({str(module_path)!r})
specs = {orchestrator._DEPENDENCY_SPECS!r}
fakes = {{}}
private_fakes = {{}}
for role, filename, sha256, size in specs:
    fake = types.ModuleType(role)
    fake.__file__ = str(path.with_name(filename))
    fake.AUTHORITY_LOCKS = {{"candidateAuthority": True}}
    sys.modules[role] = fake
    fakes[role] = fake
    private_name = f"_nhm2_seed_core_levels_{{role}}_{{sha256[:16]}}"
    private_fake = types.ModuleType(private_name)
    private_fake.__file__ = str(path.with_name(filename))
    sys.modules[private_name] = private_fake
    private_fakes[private_name] = private_fake
target = importlib.util.spec_from_file_location("hostile_core_level_orchestrator", path)
module = importlib.util.module_from_spec(target)
sys.modules[target.name] = module
target.loader.exec_module(module)
ok = all(
    module._BOUND_MODULES[role] is not fakes[role]
    and sys.modules[role] is fakes[role]
    and sys.modules[f"_nhm2_seed_core_levels_{{role}}_{{sha256[:16]}}"]
        is private_fakes[f"_nhm2_seed_core_levels_{{role}}_{{sha256[:16]}}"]
    and pathlib.Path(module._BOUND_MODULES[role].__file__).resolve()
        == path.with_name(filename).resolve()
    for role, filename, sha256, size in specs
)
print(int(ok))
"""
        environment = os.environ.copy()
        environment["PYTHONDWRITEBYTECODE"] = "1"
        completed = subprocess.run(
            [sys.executable, "-B", "-W", "error", "-c", program],
            cwd=REPOSITORY_ROOT,
            env=environment,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=60,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout.strip(), "1")

    def test_repaired_transfer_uses_archived_rho_and_only_live_target(self) -> None:
        source_snapshot = orchestrator._snapshot_spectral_payload(
            self.grids["L0"], "L0"
        )
        target_snapshot = orchestrator._snapshot_spectral_payload(
            self.grids["L1"], "L1"
        )
        archived_source_rho = tuple(component for component in source_snapshot.rho)
        projected_source_state = _state_for_grid(source_snapshot, 0)
        target_spectral = orchestrator._rebind_spectral_payload(
            orchestrator._level_transfer, target_snapshot
        )
        source_snapshot = None

        observed_roles: list[str] = []
        original_snapshot = orchestrator._level_transfer._snapshot_spectral_primitive

        def record_target_snapshot(value: object, role: str) -> object:
            observed_roles.append(role)
            return original_snapshot(value, role)

        with patch.object(
            orchestrator._level_transfer,
            "_snapshot_spectral_primitive",
            side_effect=record_target_snapshot,
        ):
            result = orchestrator._level_transfer.transfer_accepted_level_state(
                source_level="L0",
                archived_source_rho=archived_source_rho,
                projected_source_state=projected_source_state,
                target_spectral=target_spectral,
            )
        self.assertEqual(observed_roles, ["target"])
        self.assertEqual((result.source_level, result.target_level), ("L0", "L1"))
        self.assertEqual((result.source_node_count, result.target_node_count), (64, 96))
        self.assertEqual(
            result.source_rho_payload_sha256,
            orchestrator._level_transfer.SOURCE_RHO_PAYLOAD_GOLDEN_HASHES[64],
        )
        self.assertEqual(
            result.target_spectral_payload_sha256,
            target_snapshot.payload_sha256,
        )
        self.assertFalse(hasattr(result, "source_spectral_payload_sha256"))

    def test_public_adapter_reports_pre_numeric_typed_blocker(self) -> None:
        numeric_calls = (
            (orchestrator._spectral, "generate_lobatto_spectral_primitive"),
            (orchestrator._core_initializer, "materialize_fixed_l0_initializer"),
            (orchestrator._core_newton, "solve_primary_core_newton"),
            (orchestrator._level_transfer, "_interpolate_field"),
            (orchestrator._join_extraction, "extract_l2_join_barriers"),
            (orchestrator._core_quadrature, "materialize_projected_l2_core_integral"),
        )
        patchers = [
            patch.object(module, name, side_effect=AssertionError("numeric_read"))
            for module, name in numeric_calls
        ]
        for patcher in patchers:
            patcher.start()
        try:
            with self.assertRaises(CoreLevelOrchestratorError) as raised:
                orchestrator.orchestrate_primary_core_levels()
        finally:
            for patcher in reversed(patchers):
                patcher.stop()
        self.assertEqual(
            raised.exception.code,
            "core_level_fixed_native_arena_abi_unavailable",
        )
        self.assertEqual(
            raised.exception.detail,
            "resource_preflight_before_candidate_numeric_read",
        )
        self.assertFalse(orchestrator.PRODUCTION_RUNTIME_AVAILABLE)
        runtime_blocker = orchestrator.PRODUCTION_RUNTIME_BLOCKER
        self.assertTrue(
            runtime_blocker.before_candidate_numeric_read
        )
        self.assertEqual(
            (
                runtime_blocker.required_native_mpfr_element_count,
                runtime_blocker.required_binary64_element_count,
                runtime_blocker.required_permutation_element_count,
            ),
            (65_536, 262_144, 257),
        )
        self.assertFalse(
            runtime_blocker.current_producer_abi_exposes_fixed_native_arenas
        )
        self.assertIn(
            "fixed_native_mpfr_binary64_and_permutation_arenas_not_exposed",
            runtime_blocker.reasons,
        )
        self.assertIn(
            "producer_calls_do_not_share_policy_native_arenas_or_fixed_indices",
            runtime_blocker.reasons,
        )
        self.assertIn(
            "same_core_quadrature_module_instance_not_shared_with_tail_initializer",
            runtime_blocker.reasons,
        )
        self.assertFalse(
            orchestrator.PRODUCTION_CONTINUATION_COMPOSITION_AVAILABLE
        )
        self.assertEqual(
            orchestrator.CONTINUATION_COMPOSITION_BLOCKER.code,
            "core_level_continuation_shared_instance_injection_unavailable",
        )
        composition_blocker = orchestrator.CONTINUATION_COMPOSITION_BLOCKER
        self.assertTrue(
            composition_blocker.same_authenticated_module_instance_required
        )
        self.assertFalse(
            composition_blocker.core_integral_recomputation_allowed
        )

    def test_synthetic_lifecycle_is_deterministic_immutable_and_once_only(self) -> None:
        backend = SyntheticBackend(self.grids)
        result = orchestrator._orchestrate_synthetic_core_levels(backend)
        self.assertEqual(tuple(backend.calls), orchestrator.BACKEND_CALL_ORDER)
        self.assertEqual(result.stage_order, orchestrator.STAGE_ORDER)
        self.assertEqual(
            tuple(len(receipt.projected_state) for receipt in result.level_archives),
            (129, 193, 257),
        )
        self.assertEqual(len(result.l2_rho_source_support), 128)
        self.assertEqual(
            result.production_runtime_blocker,
            orchestrator.PRODUCTION_RUNTIME_BLOCKER,
        )
        self.assertFalse(result.production_runtime_available)
        self.assertTrue(result.one_live_operator_chronology_implemented)
        self.assertTrue(
            all(
                receipt.target_only_operator_abi_observed
                and receipt.archived_source_rho_cleared_before_solve
                for receipt in result.level_transfers
            )
        )
        self.assertEqual(
            tuple(
                receipt.archived_source_rho_f64le_sha256
                for receipt in result.level_transfers
            ),
            (
                orchestrator._level_transfer.SOURCE_RHO_PAYLOAD_GOLDEN_HASHES[64],
                orchestrator._level_transfer.SOURCE_RHO_PAYLOAD_GOLDEN_HASHES[96],
            ),
        )
        self.assertEqual(
            result.continuation_composition_blocker,
            orchestrator.CONTINUATION_COMPOSITION_BLOCKER,
        )
        self.assertFalse(result.production_continuation_composition_available)
        self.assertTrue(
            result.same_authenticated_core_quadrature_instance_required
        )
        self.assertTrue(
            all(receipt.projection_gate_passed for receipt in result.level_archives)
        )
        self.assertTrue(
            all(receipt.archive_copy_distinct for receipt in result.level_archives)
        )
        self.assertFalse(any(orchestrator.AUTHORITY_LOCKS.values()))
        for field_name in (
            "primary_numerics_semantic_authority",
            "implementation_closure_complete",
            "runtime_closure_complete",
            "source_manifest_bound",
            "toolchain_manifest_bound",
            "executable_bound",
            "runtime_manifest_bound",
            "scientific_preseal_present",
            "solve_performed",
            "execution_authorized",
            "execution_observed",
            "candidate_execution_authorized",
            "candidate_executed",
            "candidate_output_materialized",
            "output_present",
            "output_accepted",
            "replay_authority",
            "independent_agreement",
            "directed_proof_authority",
            "semiclassical_stress_noise_lamp",
            "semiclassical_constraint_algebra_lamp",
            "diagnostic_pass_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
        ):
            self.assertIs(getattr(result, field_name), False)

        frozen_l2 = result.level_archives[2].projected_state
        backend.solver_results["L2"].projected_state = tuple(
            9.0 for _ in range(257)
        )
        backend.join_result.barrier_values = (9.0, 9.0, 9.0, 9.0)
        self.assertEqual(result.level_archives[2].projected_state, frozen_l2)
        self.assertEqual(
            result.join_receipt.barrier_values,
            (0.125, -0.03125, -0.25, 0.0625),
        )
        with self.assertRaises(FrozenInstanceError):
            result.level_archives[0].level_id = "changed"

        pending_backend = SyntheticBackend(self.grids)
        with self.assertRaises(CoreLevelOrchestratorError) as raised:
            orchestrator._orchestrate_synthetic_core_levels(pending_backend)
        self.assertEqual(raised.exception.code, "core_level_continuation_pending")
        self.assertEqual(pending_backend.calls, [])

        lookalike = replace(result)
        with self.assertRaises(CoreLevelOrchestratorError) as raised:
            orchestrator._consume_core_level_continuation(lookalike)
        self.assertEqual(
            raised.exception.code, "core_level_continuation_identity_mismatch"
        )
        token = orchestrator._consume_core_level_continuation(result)
        self.assertIs(token.result, result)
        self.assertIs(
            token.owner_core_quadrature_module,
            orchestrator._core_quadrature,
        )
        self.assertIs(token.join_result, backend.join_result)
        self.assertIs(token.core_integral_result, backend.core_result)
        self.assertIs(token.core_quadrature_token, backend.continuation_token)
        self.assertIs(token.core_quadrature_token.result, backend.core_result)
        self.assertEqual(token.core_quadrature_token.core_sum.precision, 256)
        self.assertEqual(_bits(token.core64), result.core_integral_receipt.core64_bits)
        self.assertIs(token.projected_l2_archive, result.level_archives[2].projected_state)
        with self.assertRaises(CoreLevelOrchestratorError) as raised:
            orchestrator._consume_core_level_continuation(result)
        self.assertEqual(raised.exception.code, "core_level_continuation_unavailable")

        second_backend = SyntheticBackend(self.grids)
        second = orchestrator._orchestrate_synthetic_core_levels(second_backend)
        self.assertEqual(result, second)
        self.assertEqual(tuple(second_backend.calls), orchestrator.BACKEND_CALL_ORDER)
        orchestrator._consume_core_level_continuation(second)

    def test_first_failure_stops_without_retry_retune_or_later_stage(self) -> None:
        backend = SyntheticBackend(self.grids, fail_newton_level="L1")
        with self.assertRaises(CoreLevelOrchestratorError) as raised:
            orchestrator._orchestrate_synthetic_core_levels(backend)
        self.assertEqual(
            raised.exception.code,
            "core_level_L1_newton_or_lu_failed_without_retry",
        )
        self.assertEqual(backend.calls.count("solve_core:L1"), 1)
        self.assertNotIn("generate_spectral:L2", backend.calls)
        self.assertNotIn("extract_join:L2", backend.calls)
        self.assertNotIn("integrate_core:L2", backend.calls)
        self.assertEqual(backend.calls[-1], "release_operator:L1")
        self.assertIsNone(backend.active_level)
        self.assertIsNone(orchestrator._pending_core_level_continuation)

    def test_continuation_owner_identity_fallback_and_adversarial_rejection(
        self,
    ) -> None:
        fallback = SyntheticBackend(self.grids)
        del fallback.owner_core_quadrature_module
        result = orchestrator._orchestrate_synthetic_core_levels(fallback)
        token = orchestrator._consume_core_level_continuation(result)
        self.assertIs(
            token.owner_core_quadrature_module,
            orchestrator._core_quadrature,
        )
        self.assertIs(token.join_result, fallback.join_result)
        self.assertIs(token.core_integral_result, fallback.core_result)
        self.assertIs(token.core_quadrature_token, fallback.continuation_token)

        foreign_owner = SyntheticBackend(self.grids)
        foreign_owner.owner_core_quadrature_module = ModuleType(
            "foreign_core_quadrature_owner"
        )
        with self.assertRaises(CoreLevelOrchestratorError) as rejected_owner:
            orchestrator._orchestrate_synthetic_core_levels(foreign_owner)
        self.assertEqual(
            rejected_owner.exception.code,
            "core_level_core_continuation_owner_binding_invalid",
        )
        self.assertIsNone(foreign_owner.active_level)
        self.assertIsNone(orchestrator._pending_core_level_continuation)

        class LookalikeTokenBackend(SyntheticBackend):
            def consume_core_continuation(self, dependency_result: object) -> object:
                exact = super().consume_core_continuation(dependency_result)
                return SimpleNamespace(
                    result=exact.result,
                    core_sum=exact.core_sum,
                    core64=exact.core64,
                    bindings=exact.bindings,
                )

        unowned_lookalike = LookalikeTokenBackend(self.grids)
        del unowned_lookalike.owner_core_quadrature_module
        with self.assertRaises(CoreLevelOrchestratorError) as rejected_fallback:
            orchestrator._orchestrate_synthetic_core_levels(unowned_lookalike)
        self.assertEqual(
            rejected_fallback.exception.code,
            "core_level_core_quadrature_owner_unavailable",
        )
        self.assertIsNone(unowned_lookalike.active_level)
        self.assertIsNone(orchestrator._pending_core_level_continuation)

    def test_projection_and_mutable_shape_rejections_fail_closed(self) -> None:
        projection_backend = SyntheticBackend(
            self.grids, fail_projection_level="L0"
        )
        with self.assertRaises(CoreLevelOrchestratorError) as raised:
            orchestrator._orchestrate_synthetic_core_levels(projection_backend)
        self.assertEqual(
            raised.exception.code,
            "core_level_L0_projection_failed_without_retry",
        )
        self.assertEqual(projection_backend.calls.count("solve_core:L0"), 1)
        self.assertNotIn("generate_spectral:L1", projection_backend.calls)
        self.assertEqual(projection_backend.calls[-1], "release_operator:L0")
        self.assertIsNone(projection_backend.active_level)

        shape_backend = SyntheticBackend(self.grids, bad_transfer_shape=True)
        with self.assertRaises(CoreLevelOrchestratorError) as raised:
            orchestrator._orchestrate_synthetic_core_levels(shape_backend)
        self.assertEqual(raised.exception.code, "core_level_tuple_shape_invalid")
        self.assertIn("L1.transfer.state", raised.exception.detail)
        self.assertEqual(shape_backend.calls.count("transfer_level:L0->L1"), 1)
        self.assertNotIn("solve_core:L1", shape_backend.calls)
        self.assertEqual(shape_backend.calls[-1], "release_operator:L1")
        self.assertIsNone(shape_backend.active_level)

    def test_static_fail_closed_contract_and_no_retry_loop(self) -> None:
        source_path = HERE / "core_level_orchestrator.py"
        source = source_path.read_text(encoding="utf-8")
        tree = ast.parse(source)
        self.assertNotIn("import spectral", source)
        self.assertNotIn("from spectral", source)
        self.assertNotIn("lever_tensor", source)
        self.assertNotIn("tile_tensor", source)
        self.assertFalse(any(isinstance(node, ast.While) for node in ast.walk(tree)))
        public = next(
            node
            for node in tree.body
            if isinstance(node, ast.FunctionDef)
            and node.name == "orchestrate_primary_core_levels"
        )
        calls = [
            node.func.id
            for node in ast.walk(public)
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name)
        ]
        self.assertIn("_verify_dependency_bindings", calls)
        self.assertIn("CoreLevelOrchestratorError", calls)
        self.assertNotIn("_orchestrate_synthetic_core_levels", calls)
        self.assertIn("PRODUCTION_RUNTIME_AVAILABLE: Final[bool] = False", source)
        self.assertIn(
            "2901f959a9aa5c80cb1ccac59de7b1ac32765fdd4ff0b7b5ed38029488aa60f9",
            source,
        )
        self.assertIn("core_level_fixed_native_arena_abi_unavailable", source)
        self.assertNotIn(
            "level_transfer_requires_simultaneous_complete_source_and_target_"
            "spectral_primitives",
            source,
        )
        self.assertIn("retry_allowed: bool = False", source)
        self.assertIn("retune_allowed: bool = False", source)
        self.assertIn("physical_authority: bool = False", source)
        self.assertIn(
            "same_authenticated_core_quadrature_instance_required: bool = True",
            source,
        )
        self.assertIn("core_integral_recomputation_allowed: bool = False", source)
        graph = next(
            node
            for node in tree.body
            if isinstance(node, ast.FunctionDef)
            and node.name == "_orchestrate_synthetic_core_levels_graph"
        )
        transfer_calls = [
            node
            for node in ast.walk(graph)
            if isinstance(node, ast.Call)
            and isinstance(node.func, ast.Name)
            and node.func.id == "_backend_call"
            and len(node.args) >= 2
            and isinstance(node.args[1], ast.Constant)
            and node.args[1].value == "transfer_level"
        ]
        self.assertEqual(len(transfer_calls), 2)
        for call in transfer_calls:
            self.assertEqual(
                tuple(keyword.arg for keyword in call.keywords),
                (
                    "source_level",
                    "archived_source_rho",
                    "projected_source_state",
                    "target_spectral",
                ),
            )


CoreLevelOrchestratorError = orchestrator.CoreLevelOrchestratorError


if __name__ == "__main__":
    unittest.main()
