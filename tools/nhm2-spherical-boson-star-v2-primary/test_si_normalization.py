from __future__ import annotations

from dataclasses import FrozenInstanceError, replace
import importlib.util
from pathlib import Path
import struct
import unittest
from unittest import mock


HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "nhm2_spherical_v2_primary_si_normalization", HERE / "si_normalization.py"
)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
import sys
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class SiNormalizationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.codata = (
            HERE.parents[1] / "configs" / "constants" / "codata-2022.v1.json"
        ).read_bytes()

    def test_materializes_exact_inventory_and_authority_locks(self) -> None:
        receipt = MODULE.materialize_si_normalization(self.codata)
        self.assertEqual(receipt.contract_sha256, MODULE.CONTRACT_SHA256)
        self.assertEqual(tuple(name for name, _ in receipt.scales), MODULE.SCALE_IDS)
        self.assertEqual(receipt.scale_graph_node_count, 49)
        self.assertEqual(receipt.central_graph_node_count, 27)
        self.assertTrue(receipt.central_via_mu_overlaps_closed)
        self.assertTrue(receipt.calculation_only)
        self.assertTrue(receipt.exact_mutable_destination_storage_verified)
        self.assertFalse(receipt.exact_contract_operation_trace_conformance)
        self.assertTrue(receipt.native_disk_bytes_hash_observed)
        self.assertFalse(receipt.exact_loaded_native_module_byte_identity_proved)
        self.assertFalse(receipt.native_hash_to_load_toctou_closed)
        self.assertTrue(receipt.native_exact_endpoint_subset_only)
        self.assertFalse(
            receipt.full_contract_graph_executed_through_direct_native_abi
        )
        self.assertTrue(receipt.gmpy2_numeric_graph_used)
        self.assertFalse(receipt.exclusive_mpfr_context_lease)
        self.assertFalse(receipt.caller_native_flags_restored)
        self.assertFalse(receipt.production_runtime_bound)
        self.assertFalse(receipt.source_disjoint_independent_implementation_bound)
        self.assertTrue(receipt.module_local_origin_check_only)
        self.assertFalse(receipt.server_authenticated)
        self.assertFalse(receipt.capability_authority)
        self.assertFalse(receipt.future_server_promotion_allowed)
        self.assertEqual(
            receipt.implementation_blockers,
            MODULE.CALCULATION_ONLY_IMPLEMENTATION_BLOCKERS,
        )
        self.assertEqual(receipt.native_mpfr_version, MODULE.EXPECTED_NATIVE_MPFR_VERSION)
        self.assertEqual(receipt.native_gmp_version, MODULE.EXPECTED_NATIVE_GMP_VERSION)
        self.assertEqual(
            receipt.native_mpfr_dll_sha256, MODULE.NATIVE_MPFR_DLL_SHA256
        )
        self.assertEqual(receipt.native_mpfr_dll_size_bytes, 904_297)
        self.assertEqual(receipt.native_gmp_dll_sha256, MODULE.NATIVE_GMP_DLL_SHA256)
        self.assertEqual(receipt.native_gmp_dll_size_bytes, 1_083_865)
        for field in (
            "execution_authority",
            "replay_authority",
            "diagnostic_pass",
            "stress_noise_lamp",
            "constraint_algebra_lamp",
            "physical_viability",
            "propulsion",
            "transport",
        ):
            self.assertIs(getattr(receipt, field), False)

    def test_central_binary64_bits_are_stable_and_plausible(self) -> None:
        receipt = MODULE.materialize_si_normalization(self.codata)
        central = dict(receipt.central_scales)
        self.assertEqual(
            {name: entry.binary64_bits for name, entry in central.items()},
            {
                "mu_E_central": "407741b3ca65dd49",
                "mu_L_central": "45c303e3734e84e7",
                "stress_scale_central_closed": "547384e1ead3be5c",
                "noise_scale_central": "68f7cfe829cf73d8",
            },
        )
        values = {
            name: struct.unpack(">d", bytes.fromhex(entry.binary64_bits))[0]
            for name, entry in central.items()
        }
        self.assertAlmostEqual(values["mu_E_central"], 372.1063941935614, places=11)
        self.assertGreater(values["mu_L_central"], 1.17e28)
        self.assertLess(values["mu_L_central"], 1.18e28)
        self.assertGreater(values["stress_scale_central_closed"], 6.67e98)
        self.assertLess(values["stress_scale_central_closed"], 6.68e98)
        self.assertGreater(values["noise_scale_central"], 4.44e197)
        self.assertLess(values["noise_scale_central"], 4.46e197)

    def test_admission_intervals_widen_one_sigma_intervals(self) -> None:
        receipt = MODULE.materialize_si_normalization(self.codata)
        scales = dict(receipt.scales)

        def rational(endpoint):
            magnitude = int(endpoint.mantissa_lowercase_hex, 16)
            value = magnitude * (2.0 ** endpoint.exponent2)
            return -value if endpoint.sign == "-" else value

        for prefix in ("mu_E", "mu_L", "stress_scale", "noise_scale"):
            one = scales[f"{prefix}_one_sigma"]
            wide = scales[f"{prefix}_admission_k2"]
            self.assertLessEqual(rational(wide.lower), rational(one.lower))
            self.assertGreaterEqual(rational(wide.upper), rational(one.upper))

    def test_every_trace_operation_has_exact_context_and_valid_ternary(self) -> None:
        receipt = MODULE.materialize_si_normalization(self.codata)
        self.assertGreater(len(receipt.primitive_trace), 100)
        self.assertEqual(
            tuple(entry.ordinal for entry in receipt.primitive_trace),
            tuple(range(len(receipt.primitive_trace))),
        )
        self.assertTrue(
            all(entry.rounding in {"RNDD", "RNDU", "RNDN"} for entry in receipt.primitive_trace)
        )
        self.assertTrue(
            all(
                entry.ternary_result in {-1, 0, 1}
                for entry in receipt.primitive_trace
            )
        )
        labels = tuple(entry.label for entry in receipt.primitive_trace)
        self.assertIn("02_c.lower.set_ui", labels)
        self.assertIn("02_c.upper.set_copy", labels)
        self.assertIn("01_g.lower.mul_2exp", labels)
        self.assertIn("01_g.upper.set_copy", labels)
        self.assertEqual(
            tuple(
                label
                for label in labels
                if label.startswith("receipt.central_scales.")
            ),
            (
                "receipt.central_scales.mu_E_central.get_d",
                "receipt.central_scales.mu_L_central.get_d",
                "receipt.central_scales.stress_scale_central_closed.get_d",
                "receipt.central_scales.noise_scale_central.get_d",
            ),
        )

    def test_native_exact_endpoint_chronology_and_storage_identity(self) -> None:
        receipt = MODULE.materialize_si_normalization(self.codata)
        trace = receipt.native_exact_endpoint_trace
        self.assertEqual(
            tuple(entry.label for entry in trace),
            (
                "01_g",
                "02_c",
                "05_two",
                "06_eight",
                "11_GOneSigma.factor",
                "12_GAdmissionK2.factor",
            ),
        )
        self.assertEqual(
            tuple(
                (entry.canonical_mantissa, entry.canonical_exponent2)
                for entry in trace
            ),
            (
                (1, -40),
                (149_896_229, 1),
                (1, 1),
                (1, 3),
                (1, 0),
                (1, 1),
            ),
        )
        self.assertEqual(trace[0].primitive, "exact_dyadic")
        self.assertEqual(trace[0].construction_order, MODULE._DYADIC_CONSTRUCTION_ORDER)
        self.assertEqual(trace[0].destination_count, 3)
        for entry in trace[1:]:
            self.assertEqual(entry.primitive, "exact_unsigned_integer")
            self.assertEqual(entry.construction_order, MODULE._UINT_CONSTRUCTION_ORDER)
            self.assertEqual(entry.destination_count, 2)
        for entry in trace:
            self.assertTrue(entry.destination_storage_pairwise_distinct)
            self.assertTrue(entry.limb_storage_pairwise_distinct)
            self.assertTrue(entry.lower_upper_equal)
            self.assertTrue(entry.mathematical_value_verified)
            self.assertTrue(entry.gmpy2_calculation_value_verified)
            self.assertEqual(
                entry.destination_precision_bits,
                (MODULE.PRECISION_BITS,) * entry.destination_count,
            )
            self.assertEqual(entry.ternary_results, (0,) * len(entry.ternary_results))

    def test_native_dll_identity_mismatch_fails_closed(self) -> None:
        with mock.patch.object(MODULE, "NATIVE_MPFR_DLL_SHA256", "0" * 64):
            with self.assertRaisesRegex(
                MODULE.SiNormalizationError,
                "native_mpfr_library_sha256_mismatch:libmpfr-6.dll",
            ):
                MODULE.materialize_si_normalization(self.codata)

    def test_native_projection_value_mismatch_fails_closed(self) -> None:
        kernel = MODULE._NativeExactEndpointKernel()
        wrong = MODULE.gmpy2.mpfr(3, MODULE.PRECISION_BITS)
        with self.assertRaisesRegex(
            MODULE.SiNormalizationError, "native_mpfr_uint_postcondition:test"
        ):
            kernel.uint("test", 2, wrong, wrong)
        self.assertEqual(kernel.trace, ())

    def test_native_receipt_is_deterministic_and_address_free(self) -> None:
        first = MODULE.materialize_si_normalization(self.codata)
        second = MODULE.materialize_si_normalization(self.codata)
        self.assertEqual(first, second)

    def test_repaired_byte_centered_uncertainty_counterexample(self) -> None:
        receipt = MODULE.materialize_paired_element(
            self.codata, 0.7, 0.0, scale_kind="stress"
        )
        self.assertEqual(receipt.uncertainty_binary64_bits, "53942030cdf27ba5")
        self.assertTrue(receipt.serialized_center_inside_directed_hull)
        self.assertTrue(receipt.serialized_uncertainty_encloses_both_distances)
        self.assertTrue(receipt.calculation_only)
        self.assertFalse(receipt.execution_authority)
        self.assertFalse(receipt.replay_authority)
        self.assertFalse(receipt.diagnostic_pass)

    def test_noise_pair_uses_same_byte_enclosure_postcondition(self) -> None:
        receipt = MODULE.materialize_paired_element(
            self.codata, -0.125, 0.01, scale_kind="noise"
        )
        self.assertTrue(receipt.serialized_center_inside_directed_hull)
        self.assertTrue(receipt.serialized_uncertainty_encloses_both_distances)
        self.assertGreater(receipt.absolute_uncertainty95, 0.0)

    def test_receipt_is_frozen(self) -> None:
        receipt = MODULE.materialize_si_normalization(self.codata)
        with self.assertRaises(FrozenInstanceError):
            receipt.execution_authority = True
        with self.assertRaises(TypeError):
            receipt.scales[0] = receipt.scales[0]
        with self.assertRaisesRegex(ValueError, "authority lock"):
            replace(receipt, execution_authority=True)
        with self.assertRaisesRegex(ValueError, "authority lock"):
            replace(receipt, server_authenticated=True)
        with self.assertRaisesRegex(ValueError, "blocker inventory"):
            replace(receipt, implementation_blockers=())
        self.assertIs(
            MODULE.require_authentic_si_normalization_receipt(receipt), receipt
        )
        forged = replace(receipt, contract_sha256="0" * 64)
        with self.assertRaisesRegex(
            MODULE.SiNormalizationError, "si_normalization_receipt_not_authentic"
        ):
            MODULE.require_authentic_si_normalization_receipt(forged)

        mutated = MODULE.materialize_si_normalization(self.codata)
        object.__setattr__(mutated, "contract_sha256", "0" * 64)
        with self.assertRaisesRegex(
            MODULE.SiNormalizationError, "si_normalization_receipt_not_authentic"
        ):
            MODULE.require_authentic_si_normalization_receipt(mutated)

        nested_mutated = MODULE.materialize_si_normalization(self.codata)
        object.__setattr__(
            nested_mutated.scales[0][1].lower, "direction", "RNDU"
        )
        with self.assertRaisesRegex(
            MODULE.SiNormalizationError, "si_normalization_receipt_not_authentic"
        ):
            MODULE.require_authentic_si_normalization_receipt(nested_mutated)

        pair = MODULE.materialize_paired_element(
            self.codata, 0.7, 0.0, scale_kind="stress"
        )
        self.assertFalse(pair.production_runtime_bound)
        self.assertTrue(pair.module_local_origin_check_only)
        self.assertFalse(pair.server_authenticated)
        self.assertFalse(pair.capability_authority)
        self.assertFalse(pair.future_server_promotion_allowed)
        self.assertEqual(
            pair.implementation_blockers,
            MODULE.CALCULATION_ONLY_IMPLEMENTATION_BLOCKERS,
        )
        with self.assertRaisesRegex(ValueError, "authority lock"):
            replace(pair, diagnostic_pass=True)
        self.assertIs(MODULE.require_authentic_paired_element_receipt(pair), pair)
        copied_pair = replace(pair, central_binary64_bits="0" * 16)
        with self.assertRaisesRegex(
            MODULE.SiNormalizationError, "paired_element_receipt_not_authentic"
        ):
            MODULE.require_authentic_paired_element_receipt(copied_pair)
        mutated_pair = MODULE.materialize_paired_element(
            self.codata, 0.7, 0.0, scale_kind="stress"
        )
        object.__setattr__(mutated_pair, "central_binary64_bits", "0" * 16)
        with self.assertRaisesRegex(
            MODULE.SiNormalizationError, "paired_element_receipt_not_authentic"
        ):
            MODULE.require_authentic_paired_element_receipt(mutated_pair)

        class HostileReceipt:
            def __getattribute__(self, _name):
                raise AssertionError("receipt trap")

        with self.assertRaisesRegex(
            MODULE.SiNormalizationError, "si_normalization_receipt_not_authentic"
        ):
            MODULE.require_authentic_si_normalization_receipt(HostileReceipt())

    def test_scale_kind_hostile_values_are_rejected_without_user_code(self) -> None:
        class Hostile:
            def __hash__(self):
                raise AssertionError("hash trap")

            def __eq__(self, _other):
                raise AssertionError("equality trap")

        with self.assertRaisesRegex(
            MODULE.SiNormalizationError, "paired_element_scale_kind_invalid"
        ):
            MODULE.materialize_paired_element(
                self.codata, 0.7, 0.0, scale_kind=Hostile()
            )
        with self.assertRaisesRegex(
            MODULE.SiNormalizationError, "paired_element_scale_kind_invalid"
        ):
            MODULE.materialize_paired_element(
                self.codata, 0.7, 0.0, scale_kind="x" * 1_000_000
            )

    def test_raw_codata_size_and_hash_fail_closed(self) -> None:
        with self.assertRaisesRegex(MODULE.SiNormalizationError, "codata_raw_size_mismatch"):
            MODULE.materialize_si_normalization(self.codata[:-1])
        modified = bytearray(self.codata)
        modified[0] ^= 1
        with self.assertRaisesRegex(MODULE.SiNormalizationError, "codata_raw_sha256_mismatch"):
            MODULE.materialize_si_normalization(bytes(modified))
        with self.assertRaisesRegex(MODULE.SiNormalizationError, "codata_exact_bytes_required"):
            MODULE.materialize_si_normalization(bytearray(self.codata))

    def test_source_has_no_candidate_array_or_solver_imports(self) -> None:
        source = (HERE / "si_normalization.py").read_text(encoding="utf-8")
        for forbidden in (
            "numpy",
            "scipy",
            "radial_residual",
            "content_replay",
            "declared_lever",
            "lever_tensor",
        ):
            self.assertNotIn(forbidden, source.lower())


if __name__ == "__main__":
    unittest.main()
