from __future__ import annotations

import ast
from dataclasses import FrozenInstanceError, replace
from decimal import Decimal, localcontext
from fractions import Fraction
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import stat
import struct
import sys
import unittest


HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "nhm2_spherical_v2_primary_si_adapter_under_test",
    HERE / "si_normalization_primary_adapter.py",
)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)
RUNTIME = MODULE._RUNTIME


_PI_DECIMAL = (
    "3.141592653589793238462643383279502884197169399375105820974944592307816406286"
    "208998628034825342117067982148086513282306647093844609550582231725359408128"
)


def _pow2(exponent: int) -> Fraction:
    return Fraction(1 << exponent, 1) if exponent >= 0 else Fraction(1, 1 << -exponent)


def _floor_log2(value: Fraction) -> int:
    assert value > 0
    candidate = value.numerator.bit_length() - value.denominator.bit_length()
    if value < _pow2(candidate):
        candidate -= 1
    return candidate


def _round_binary(value: Fraction, mode: int) -> tuple[Fraction, int]:
    assert value > 0
    exponent = _floor_log2(value) - (RUNTIME.PRECISION_BITS - 1)
    scaled = value / _pow2(exponent)
    lower = scaled.numerator // scaled.denominator
    remainder = scaled.numerator % scaled.denominator
    if remainder == 0:
        integer = lower
    elif mode == RUNTIME.RNDD:
        integer = lower
    elif mode == RUNTIME.RNDU:
        integer = lower + 1
    else:
        doubled = remainder * 2
        integer = lower + (
            1
            if doubled > scaled.denominator
            or (doubled == scaled.denominator and lower & 1)
            else 0
        )
    rounded = integer * _pow2(exponent)
    sign = (rounded > value) - (rounded < value)
    return rounded, sign


def _decimal_fraction(text: str) -> Fraction:
    return Fraction(Decimal(text))


def _sqrt_fraction(value: Fraction) -> Fraction:
    with localcontext() as context:
        context.prec = 190
        result = (Decimal(value.numerator) / Decimal(value.denominator)).sqrt()
    return Fraction(result)


class _FakeApi:
    def __init__(self) -> None:
        self.emin = -2_000_000
        self.emax = 2_000_000
        self.rounding = RUNTIME.RNDU
        self.flags_value = 5
        self.saved = (self.emin, self.emax, self.rounding, self.flags_value)
        self.next_ordinal = 0
        self.events: list[str] = []
        self.fail_operation: str | None = None
        self.force_nonfinite = False
        self.inject_get_d_inexact_flag = False

    def get_emin(self) -> int:
        return self.emin

    def get_emax(self) -> int:
        return self.emax

    def set_emin(self, value: int) -> int:
        self.emin = value
        return 0

    def set_emax(self, value: int) -> int:
        self.emax = value
        return 0

    def get_rounding(self) -> int:
        return self.rounding

    def set_rounding(self, value: int) -> None:
        self.rounding = value

    def clear_flags(self) -> None:
        self.flags_value = 0

    def flags_save(self) -> int:
        return self.flags_value

    def flags_restore(self, value: int) -> None:
        self.flags_value = value

    def flags(self) -> tuple[bool, bool, bool, bool, bool, bool]:
        return tuple(bool(self.flags_value & (1 << index)) for index in range(6))

    def run_canary(self):
        self.flags_value = 0
        return RUNTIME.CanaryObservation(
            precision_bits=RUNTIME.PRECISION_BITS,
            lower_ternary=-1,
            upper_ternary=1,
            lower_binary64_bits="3fd5555555555555",
            upper_binary64_bits="3fd5555555555556",
            strict_interval_observed=True,
            inexact_flag_observed=True,
            forbidden_flags_clear=True,
            reverse_cleanup_complete=True,
        )

    def free_cache(self) -> None:
        self.events.append("free_cache")

    def _event(self, name: str) -> None:
        self.events.append(name)
        if self.fail_operation == name:
            raise RuntimeError(name)

    def _new(self, kind: str):
        self.next_ordinal += 1
        return {
            "kind": kind,
            "ordinal": self.next_ordinal,
            "value": Fraction(0, 1) if kind == "mpfr" else 0,
            "cleared": False,
        }

    def lease_new_mpfr(self):
        self._event("allocate_mpfr256")
        return self._new("mpfr")

    def lease_new_mpz(self):
        self._event("allocate_mpz")
        return self._new("mpz")

    def lease_clear_mpfr(self, value) -> None:
        self._event(f"clear_mpfr_{value['ordinal']}")
        if value["cleared"]:
            raise RuntimeError("double_clear")
        value["cleared"] = True

    def lease_clear_mpz(self, value) -> None:
        self._event(f"clear_mpz_{value['ordinal']}")
        if value["cleared"]:
            raise RuntimeError("double_clear")
        value["cleared"] = True

    def lease_mpfr_storage_identity(self, value) -> tuple[int, int]:
        ordinal = value["ordinal"]
        return 10_000 + ordinal, 20_000 + ordinal

    def lease_mpz_set_ui(self, destination, value: int) -> None:
        self._event("mpz_set_ui")
        destination["value"] = value

    def lease_mpz_set_si(self, destination, value: int) -> None:
        self._event("mpz_set_si")
        destination["value"] = value

    def lease_mpz_set_decimal(self, destination, value: str) -> int:
        self._event("mpz_set_decimal")
        destination["value"] = int(value)
        return 0

    def lease_mpz_decimal(self, source) -> str:
        self._event("mpz_decimal")
        return str(source["value"])

    def _write(self, name: str, destination, exact: Fraction, mode: int) -> int:
        self._event(name)
        rounded, sign = _round_binary(exact, mode)
        destination["value"] = rounded
        if sign != 0:
            self.flags_value |= 1 << 4
        return -17 if sign < 0 else 23 if sign > 0 else 0

    def lease_mpfr_set_ui(self, destination, value: int, mode: int) -> int:
        return self._write("mpfr_set_ui", destination, Fraction(value), mode)

    def lease_mpfr_set_si(self, destination, value: int, mode: int) -> int:
        return self._write("mpfr_set_si", destination, Fraction(value), mode)

    def lease_mpfr_set_decimal(self, destination, value: str, mode: int) -> int:
        self._write("mpfr_set_decimal", destination, _decimal_fraction(value), mode)
        return 0

    def lease_mpfr_set_z(self, destination, source, mode: int) -> int:
        return self._write("mpfr_set_z", destination, Fraction(source["value"]), mode)

    def lease_mpfr_set(self, destination, source, mode: int) -> int:
        return self._write("mpfr_set", destination, source["value"], mode)

    def lease_mpfr_mul_2si(self, destination, source, exponent2: int, mode: int) -> int:
        return self._write(
            "mpfr_mul_2si", destination, source["value"] * _pow2(exponent2), mode
        )

    def lease_mpfr_add(self, destination, left, right, mode: int) -> int:
        return self._write("mpfr_add", destination, left["value"] + right["value"], mode)

    def lease_mpfr_sub(self, destination, left, right, mode: int) -> int:
        return self._write("mpfr_sub", destination, left["value"] - right["value"], mode)

    def lease_mpfr_mul(self, destination, left, right, mode: int) -> int:
        return self._write("mpfr_mul", destination, left["value"] * right["value"], mode)

    def lease_mpfr_div(self, destination, left, right, mode: int) -> int:
        return self._write("mpfr_div", destination, left["value"] / right["value"], mode)

    def lease_mpfr_sqrt(self, destination, source, mode: int) -> int:
        return self._write("mpfr_sqrt", destination, _sqrt_fraction(source["value"]), mode)

    def lease_mpfr_const_pi(self, destination, mode: int) -> int:
        return self._write(
            "mpfr_const_pi", destination, _decimal_fraction(_PI_DECIMAL), mode
        )

    def lease_mpfr_compare(self, left, right) -> int:
        self._event("mpfr_compare")
        return (left["value"] > right["value"]) - (left["value"] < right["value"])

    def lease_mpfr_compare_ui(self, left, right: int) -> int:
        self._event("mpfr_compare_ui")
        return (left["value"] > right) - (left["value"] < right)

    def lease_mpfr_compare_z(self, left, right) -> int:
        self._event("mpfr_compare_z")
        return (left["value"] > right["value"]) - (left["value"] < right["value"])

    def lease_mpfr_equal(self, left, right) -> bool:
        self._event("mpfr_equal")
        return left["value"] == right["value"]

    def lease_mpfr_get_z_2exp(self, destination, source) -> int:
        self._event("mpfr_get_z_2exp")
        value: Fraction = source["value"]
        denominator = value.denominator
        if denominator & (denominator - 1):
            raise RuntimeError("not_dyadic")
        destination["value"] = value.numerator
        return -(denominator.bit_length() - 1)

    def lease_mpfr_get_d(self, source, _mode: int) -> float:
        self._event("mpfr_get_d")
        result = float(source["value"])
        if self.inject_get_d_inexact_flag:
            self.flags_value |= 1 << 4
        return result

    def lease_mpfr_number(self, _source) -> bool:
        self._event("mpfr_number")
        return not self.force_nonfinite

    def lease_mpfr_precision(self, _source) -> int:
        self._event("mpfr_precision")
        return RUNTIME.PRECISION_BITS


def _file_identity(inode: int, *, links: int):
    return RUNTIME.FileIdentity(
        device=17,
        inode=inode,
        mode=stat.S_IFREG | 0o444,
        link_count=links,
        size_bytes=1,
        mtime_ns=101,
        ctime_ns=102,
    )


def _source_binding(component: str, digest: str, inode: int):
    soname = RUNTIME.EXPECTED_GMP_SONAME if component == "gmp" else RUNTIME.EXPECTED_MPFR_SONAME
    needed = ("libc.so.6",) if component == "gmp" else (RUNTIME.EXPECTED_GMP_SONAME, "libm.so.6")
    return RUNTIME.SourceLibraryBinding(
        component=component,
        canonical_path=f"/opt/nhm2/{soname}",
        identity=_file_identity(inode, links=1),
        sha256_first_pass=digest,
        sha256_second_pass=digest,
        sha256_after_load=digest,
        elf=RUNTIME.ElfIdentity(
            elf_class="ELF64",
            byte_order="little_endian",
            object_type="ET_DYN",
            machine="EM_X86_64",
            soname=soname,
            needed=needed,
        ),
        nofollow_segment_traversal=True,
        single_link_regular_file=True,
        source_inode_loaded_directly=False,
    )


def _loaded_binding(component: str, digest: str, inode: int, descriptor: int):
    name = f"nhm2-spherical-v2-{component}-sealed-v1"
    path = f"/proc/self/fd/{descriptor}"
    return RUNTIME.LoadedLibraryBinding(
        component=component,
        sealed_memfd_name=name,
        identity=_file_identity(inode, links=0),
        sha256=digest,
        seal_mask=15,
        required_seal_mask=15,
        seals_exact=True,
        loader_procfd_path=path,
        loader_link_map_name=path,
        dladdr_name=path,
        maps_path=f"/memfd:{name} (deleted)",
        representative_symbol="__gmpz_init" if component == "gmp" else "mpfr_get_version",
        maps_device_inode_exact=True,
        link_map_dladdr_exact=True,
        source_inode_loaded_directly=False,
    )


def _abi():
    return RUNTIME.AbiObservation(
        platform_system="Linux",
        machine="x86_64",
        byte_order="little_endian",
        pointer_bits=64,
        c_long_bits=64,
        c_int_bits=32,
        c_ulong_bits=64,
        mpfr_struct_size_bytes=32,
        mpfr_struct_offsets=(0, 8, 16, 24),
        mpz_struct_size_bytes=16,
        mpz_struct_offsets=(0, 4, 8),
        gmp_limb_bits=64,
        mpfr_tls_enabled=True,
        abi_exact=True,
    )


def _evidence(api: _FakeApi):
    return RUNTIME._ProviderEvidence(
        provider_kind="synthetic_test_only",
        native_provider_mechanics_observed=False,
        namespace_id=23,
        source_libraries=(
            _source_binding("gmp", "a" * 64, 101),
            _source_binding("mpfr", "b" * 64, 102),
        ),
        loaded_libraries=(
            _loaded_binding("gmp", "a" * 64, 201, 51),
            _loaded_binding("mpfr", "b" * 64, 202, 52),
        ),
        mpfr_version=RUNTIME.EXPECTED_MPFR_VERSION,
        gmp_version=RUNTIME.EXPECTED_GMP_VERSION,
        resolved_mpfr_symbols=RUNTIME.REQUIRED_MPFR_SYMBOLS,
        resolved_gmp_symbols=RUNTIME.REQUIRED_GMP_SYMBOLS,
        abi=_abi(),
        required_gmp_dependency_inventory_exact=True,
        api=api,
    )


class _FakeSession:
    def __init__(self, evidence, cleanup_codes: tuple[str, ...] = ()) -> None:
        self.evidence = evidence
        self.cleanup_codes = cleanup_codes
        self.closed = 0

    def close(self) -> tuple[str, ...]:
        self.closed += 1
        return self.cleanup_codes


class _FakeProvider:
    def __init__(self, session: _FakeSession) -> None:
        self.session = session
        self.open_calls = 0

    def open_runtime(self, _request):
        self.open_calls += 1
        return self.session


def _request():
    return RUNTIME._RuntimeConformanceRequest(
        gmp=RUNTIME._RuntimeLibraryExpectation(
            component="gmp",
            absolute_path="/opt/nhm2/libgmp.so.10",
            size_bytes=1,
            sha256="a" * 64,
        ),
        mpfr=RUNTIME._RuntimeLibraryExpectation(
            component="mpfr",
            absolute_path="/opt/nhm2/libmpfr.so.6",
            size_bytes=1,
            sha256="b" * 64,
        ),
    )


def _synthetic(
    codata: object,
    *,
    api: _FakeApi | None = None,
    cleanup_codes: tuple[str, ...] = (),
):
    api = api or _FakeApi()
    session = _FakeSession(_evidence(api), cleanup_codes)
    provider = _FakeProvider(session)
    receipt = MODULE._test_only_materialize_primary_si_normalization(
        codata,
        _request(),
        provider,
        MODULE._TEST_ONLY_MARKER,
    )
    return receipt, api, session, provider


class PrimarySiNormalizationAdapterTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.codata = (HERE.parents[1] / "configs" / "constants" / "codata-2022.v1.json").read_bytes()

    def setUp(self) -> None:
        RUNTIME._CONTEXT_POISONED = False
        RUNTIME._CONTEXT_POISON_REASONS = ()

    def tearDown(self) -> None:
        for _reference, state, _generation in tuple(RUNTIME._LEASE_STATES.values()):
            if state.active:
                try:
                    RUNTIME._finalize_lease_state(
                        state, RUNTIME.RuntimeConformanceError("test_teardown")
                    )
                except BaseException:
                    pass
        RUNTIME._CONTEXT_POISONED = False
        RUNTIME._CONTEXT_POISON_REASONS = ()

    def test_exact_pins_and_private_authenticated_runtime(self) -> None:
        self.assertEqual(MODULE.RUNTIME_SOURCE_RAW_SHA256, "deb4b7519929db338b3586ecbb217c8cac6f4a6b0daf2a86654a9696e3c403ac")
        self.assertEqual(MODULE.RUNTIME_SOURCE_RAW_SIZE_BYTES, 165_492)
        self.assertEqual(MODULE.SI_V2_SEMANTIC_SHA256, "6af028d078ecc4cc9076eb45476fd87ac448503170e88fccf0ada3a98d06cafb")
        self.assertEqual(MODULE.SI_V2_CANONICAL_SIZE_BYTES, 15_246)
        self.assertEqual(MODULE.SI_V2_SOURCE_RAW_SHA256, "6d5d539b5c93409b6a0afefe0afdf9c32aa27f98fb1d133efb8c6d19e66a86cc")
        self.assertEqual(MODULE.SI_V2_SOURCE_RAW_SIZE_BYTES, 26_854)
        self.assertEqual(MODULE.SI_V1_SEMANTIC_SHA256, "16224114ce7bc790d1e5ceeaf8f75e31e5c37412856c5bea8b99284301bf3c24")
        self.assertEqual(MODULE.SI_V1_CANONICAL_SIZE_BYTES, 23_822)
        self.assertEqual(MODULE.CODATA_RAW_SHA256, "5a7e10ed709577c224cf45f78199dd143a7f9cf10d6f8fe8c018e168454b7a61")
        self.assertEqual(MODULE.CODATA_RAW_SIZE_BYTES, 6_180)
        runtime_path = HERE / "mpfr256_runtime_conformance.py"
        self.assertEqual(hashlib.sha256(runtime_path.read_bytes()).hexdigest(), MODULE.RUNTIME_SOURCE_RAW_SHA256)
        self.assertEqual(runtime_path.stat().st_size, MODULE.RUNTIME_SOURCE_RAW_SIZE_BYTES)
        v2_path = (
            HERE.parents[1]
            / "shared"
            / "contracts"
            / "nhm2-spherical-boson-star-v2-si-output-normalization.v2.ts"
        )
        self.assertEqual(
            hashlib.sha256(v2_path.read_bytes()).hexdigest(),
            MODULE.SI_V2_SOURCE_RAW_SHA256,
        )
        self.assertEqual(v2_path.stat().st_size, MODULE.SI_V2_SOURCE_RAW_SIZE_BYTES)
        codata_path = HERE.parents[1] / "configs" / "constants" / "codata-2022.v1.json"
        self.assertEqual(
            hashlib.sha256(codata_path.read_bytes()).hexdigest(),
            MODULE.CODATA_RAW_SHA256,
        )

    def test_public_path_fails_before_caller_codata_traversal(self) -> None:
        class Trap:
            hits = 0

            def __getattribute__(self, name):
                type(self).hits += 1
                raise AssertionError(name)

        with self.assertRaises(RUNTIME.RuntimeConformanceError) as caught:
            MODULE.materialize_primary_si_normalization(Trap())
        self.assertIn(caught.exception.code, {"linux_x86_64_runtime_required", "trusted_runtime_manifest_not_installed"})
        self.assertEqual(Trap.hits, 0)

    def test_private_marker_is_required_before_synthetic_acquisition(self) -> None:
        api = _FakeApi()
        session = _FakeSession(_evidence(api))
        provider = _FakeProvider(session)
        with self.assertRaisesRegex(MODULE.PrimarySiNormalizationError, "synthetic_test_marker_invalid"):
            MODULE._test_only_materialize_primary_si_normalization(
                self.codata, _request(), provider, object()
            )
        self.assertEqual(provider.open_calls, 0)

    def test_synthetic_graph_golden_trace_and_authority_locks(self) -> None:
        receipt, api, session, provider = _synthetic(self.codata)
        self.assertEqual(provider.open_calls, 1)
        self.assertEqual(session.closed, 1)
        self.assertTrue(receipt.calculation_only)
        self.assertTrue(receipt.synthetic_test_provider)
        self.assertFalse(receipt.production_native_runtime_observed)
        self.assertEqual(receipt.rounded_operation_count, 139)
        self.assertEqual(receipt.terminal_get_d_count, 4)
        self.assertEqual(len(receipt.semantic_trace), 139)
        self.assertEqual(len(MODULE._EXPECTED_ROUNDED_TRACE[:107]), 107)
        self.assertEqual(len(MODULE._EXPECTED_ROUNDED_TRACE[107:135]), 28)
        self.assertEqual(
            tuple(item[1] for item in MODULE._EXPECTED_ROUNDED_TRACE[135:]),
            ("mpfr_get_d",) * 4,
        )
        self.assertEqual(
            tuple(item[2] for item in MODULE._EXPECTED_ROUNDED_TRACE[135:]),
            ("RNDN",) * 4,
        )
        self.assertEqual(
            len({item[0] for item in MODULE._EXPECTED_ROUNDED_TRACE}), 139
        )
        raw_runtime = json.loads(receipt.runtime_receipt_snapshot_text)
        raw_rounded = tuple(
            item
            for item in raw_runtime["operation_trace"]
            if item["rounding"] is not None
        )
        self.assertEqual(
            tuple(tuple(item["source_ordinals"]) for item in raw_rounded),
            MODULE._EXPECTED_ROUNDED_SOURCE_ORDINALS,
        )
        self.assertEqual(
            tuple(item["ternary_result"] for item in raw_rounded[135:]),
            (None,) * 4,
        )
        self.assertEqual(
            tuple(item["inexact_flag"] for item in raw_rounded[135:]),
            (False,) * 4,
        )
        self.assertEqual(
            tuple(item.ternary_sign for item in receipt.semantic_trace[135:]),
            (-1, 1, 1, -1),
        )
        self.assertEqual(
            MODULE._semantic_result_golden_sha256(receipt.semantic_trace),
            "4b3143ac7c3a4ae0c2d0c5f08437d499aae73f5af5d63d7a3dd8fab1ee95946b",
        )
        self.assertEqual(
            MODULE._directed_endpoint_golden_sha256(receipt.scales),
            "911e0b2fb17a181314fb80ed763b7961b9333f2c8e2c6bc9eec51e0ebea85b27",
        )
        self.assertEqual(tuple(item.ordinal for item in receipt.semantic_trace), tuple(range(139)))
        self.assertEqual(tuple(item.label for item in receipt.semantic_trace), tuple(item[0] for item in MODULE._EXPECTED_ROUNDED_TRACE))
        self.assertEqual(tuple(item.primitive for item in receipt.semantic_trace), tuple(item[1] for item in MODULE._EXPECTED_ROUNDED_TRACE))
        self.assertTrue(all(item.ternary_sign in {-1, 0, 1} for item in receipt.semantic_trace))
        self.assertEqual(receipt.semantic_trace[5].ternary_sign, -1)
        self.assertEqual(receipt.semantic_trace[6].ternary_sign, 1)
        self.assertEqual(tuple(item.scale_id for item in receipt.scales), MODULE.SCALE_IDS)
        self.assertEqual(
            {item.scale_id: item.binary64_bits for item in receipt.central_scales},
            {
                "mu_E_central": "407741b3ca65dd49",
                "mu_L_central": "45c303e3734e84e7",
                "stress_scale_central_closed": "547384e1ead3be5c",
                "noise_scale_central": "68f7cfe829cf73d8",
            },
        )
        self.assertTrue(receipt.runtime_lifecycle_complete)
        self.assertEqual(MODULE._runtime_snapshot_digest(receipt.runtime_receipt_snapshot_text), receipt.runtime_receipt_snapshot_sha256)
        self.assertIn(MODULE._SYNTHETIC_BLOCKER, receipt.implementation_blockers)
        for field in (
            "server_authenticated",
            "primary_receipt_persisted",
            "pair_comparison_ready",
            "pair_comparison_observed",
            "independent_agreement",
            "candidate_ready",
            "execution_ready",
            "execution_authority",
            "replay_ready",
            "replay_authority",
            "publication_ready",
            "publication_authority",
            "scientific_preseal_authority",
            "scientific_authority",
            "diagnostic_pass",
            "semiclassical_stress_noise_lamp",
            "semiclassical_constraint_algebra_lamp",
            "theory_graph_promotion",
            "physical_viability",
            "propulsion",
            "transport",
        ):
            self.assertIs(getattr(receipt, field), False)
        self.assertLess(api.events.index("free_cache"), len(api.events))

    def test_raw_get_d_inexact_flag_is_rejected_after_cleanup(self) -> None:
        api = _FakeApi()
        api.inject_get_d_inexact_flag = True
        session = _FakeSession(_evidence(api))
        provider = _FakeProvider(session)
        before = len(MODULE._RECEIPTS)
        with self.assertRaisesRegex(
            MODULE.PrimarySiNormalizationError,
            "semantic_get_d_raw_inexact_flag",
        ):
            MODULE._test_only_materialize_primary_si_normalization(
                self.codata,
                _request(),
                provider,
                MODULE._TEST_ONLY_MARKER,
            )
        self.assertEqual(session.closed, 1)
        self.assertEqual(len(MODULE._RECEIPTS), before)

    def test_same_primitive_wrong_operand_order_is_rejected(self) -> None:
        original = MODULE._Arithmetic._new_binary

        def swap_commutative_operands(
            arithmetic, label, primitive, rounding, left, right
        ):
            if label == "07_twoPi.lower":
                return original(
                    arithmetic, label, primitive, rounding, right, left
                )
            return original(arithmetic, label, primitive, rounding, left, right)

        MODULE._Arithmetic._new_binary = swap_commutative_operands
        before = len(MODULE._RECEIPTS)
        try:
            with self.assertRaisesRegex(
                MODULE.PrimarySiNormalizationError,
                "semantic_runtime_source_topology_mismatch",
            ):
                _synthetic(self.codata)
        finally:
            MODULE._Arithmetic._new_binary = original
        self.assertEqual(len(MODULE._RECEIPTS), before)

    def test_post_close_decisions_use_only_owned_validated_snapshot(self) -> None:
        lease_type = RUNTIME._Mpfr256RuntimeLease
        original = lease_type.validated_receipt_snapshot
        mutated_runtime_receipts = []

        def snapshot_then_mutate(lease):
            snapshot_pair = original(lease)
            mutable_receipt = lease.receipt
            object.__setattr__(mutable_receipt, "synthetic_test_provider", False)
            object.__setattr__(mutable_receipt, "lifecycle_complete", False)
            object.__setattr__(mutable_receipt, "observed_rounded_operation_count", 0)
            object.__setattr__(mutable_receipt, "operation_trace", ())
            mutated_runtime_receipts.append(mutable_receipt)
            return snapshot_pair

        lease_type.validated_receipt_snapshot = snapshot_then_mutate
        try:
            receipt, _api, _session, _provider = _synthetic(self.codata)
        finally:
            lease_type.validated_receipt_snapshot = original

        self.assertEqual(len(mutated_runtime_receipts), 1)
        self.assertTrue(receipt.synthetic_test_provider)
        self.assertFalse(receipt.production_native_runtime_observed)
        self.assertTrue(receipt.runtime_lifecycle_complete)
        self.assertEqual(receipt.rounded_operation_count, 139)
        self.assertEqual(len(receipt.semantic_trace), 139)
        with self.assertRaisesRegex(
            RUNTIME.RuntimeConformanceError, "runtime_lease_receipt_integrity_invalid"
        ):
            RUNTIME._validated_lease_receipt_snapshot(mutated_runtime_receipts[0])

        parsed = json.loads(receipt.runtime_receipt_snapshot_text)
        parsed["untrusted_extra_fact"] = True
        forged_text = json.dumps(
            parsed, ensure_ascii=True, separators=(",", ":"), sort_keys=False
        )
        with self.assertRaisesRegex(ValueError, "schema invalid"):
            MODULE._parse_runtime_snapshot(
                forged_text, MODULE._runtime_snapshot_digest(forged_text)
            )

    def test_bad_codata_closes_without_receipt_or_retune(self) -> None:
        api = _FakeApi()
        session = _FakeSession(_evidence(api))
        provider = _FakeProvider(session)
        before = len(MODULE._RECEIPTS)
        with self.assertRaisesRegex(MODULE.PrimarySiNormalizationError, "codata_raw_size_mismatch"):
            MODULE._test_only_materialize_primary_si_normalization(
                self.codata[:-1], _request(), provider, MODULE._TEST_ONLY_MARKER
            )
        self.assertEqual(provider.open_calls, 1)
        self.assertEqual(session.closed, 1)
        self.assertEqual(len(MODULE._RECEIPTS), before)

    def test_operation_and_cleanup_failures_emit_no_adapter_receipt(self) -> None:
        api = _FakeApi()
        api.fail_operation = "mpfr_sqrt"
        session = _FakeSession(_evidence(api))
        provider = _FakeProvider(session)
        before = len(MODULE._RECEIPTS)
        with self.assertRaises(RUNTIME.RuntimeConformanceError):
            MODULE._test_only_materialize_primary_si_normalization(
                self.codata, _request(), provider, MODULE._TEST_ONLY_MARKER
            )
        self.assertEqual(session.closed, 1)
        self.assertEqual(len(MODULE._RECEIPTS), before)

        RUNTIME._CONTEXT_POISONED = False
        RUNTIME._CONTEXT_POISON_REASONS = ()
        api2 = _FakeApi()
        session2 = _FakeSession(_evidence(api2), ("synthetic_cleanup_failure",))
        provider2 = _FakeProvider(session2)
        with self.assertRaisesRegex(RUNTIME.RuntimeConformanceError, "runtime_lease_cleanup_failed"):
            MODULE._test_only_materialize_primary_si_normalization(
                self.codata, _request(), provider2, MODULE._TEST_ONLY_MARKER
            )
        self.assertEqual(session2.closed, 1)
        self.assertEqual(len(MODULE._RECEIPTS), before)

    def test_receipt_freeze_origin_and_mutation_detection(self) -> None:
        receipt, _api, _session, _provider = _synthetic(self.codata)
        snapshot = MODULE.require_authentic_primary_si_normalization_receipt(receipt)
        self.assertIs(type(snapshot), tuple)
        self.assertEqual(len(snapshot), 2)
        self.assertTrue(all(type(item) is str for item in snapshot))
        self.assertEqual(
            snapshot,
            MODULE.validated_primary_si_normalization_receipt_snapshot(receipt),
        )
        snapshot_raw = snapshot[0].encode("ascii")
        self.assertEqual(
            snapshot[1],
            hashlib.sha256(
                b"nhm2-spherical-boson-star-v2/primary-si-receipt-snapshot/v2\n"
                + struct.pack("<Q", len(snapshot_raw))
                + snapshot_raw
            ).hexdigest(),
        )
        snapshot_projection = json.loads(snapshot[0])
        self.assertEqual(len(snapshot_projection["semantic_trace"]), 139)
        self.assertEqual(len(snapshot_projection["scales"]), 13)
        self.assertEqual(len(snapshot_projection["central_scales"]), 4)
        self.assertEqual(
            len(snapshot_projection["implementation_blockers"]),
            len(MODULE._COMMON_BLOCKERS) + 1,
        )
        self.assertTrue(
            all(
                len(item["forbidden_flags_in_frozen_order"]) == 5
                for item in snapshot_projection["semantic_trace"]
            )
        )
        with self.assertRaises(TypeError):
            snapshot[0] = "mutated"
        with self.assertRaises(FrozenInstanceError):
            receipt.execution_authority = True
        with self.assertRaisesRegex(ValueError, "authority lock"):
            replace(receipt, execution_authority=True)
        forged = replace(receipt)
        with self.assertRaisesRegex(MODULE.PrimarySiNormalizationError, "not_authentic"):
            MODULE.require_authentic_primary_si_normalization_receipt(forged)
        object.__setattr__(receipt, "execution_authority", True)
        with self.assertRaisesRegex(MODULE.PrimarySiNormalizationError, "not_authentic"):
            MODULE.require_authentic_primary_si_normalization_receipt(receipt)

    def test_receipt_admission_is_bounded_against_hostile_mutation(self) -> None:
        receipt, _api, _session, _provider = _synthetic(self.codata)
        object.__setattr__(
            receipt,
            "runtime_receipt_snapshot_text",
            "x" * (MODULE._RECEIPT_PROJECTION_MAX_RUNTIME_SNAPSHOT_BYTES + 1),
        )
        with self.assertRaisesRegex(
            MODULE.PrimarySiNormalizationError, "not_authentic"
        ):
            MODULE.require_authentic_primary_si_normalization_receipt(receipt)

        receipt, _api, _session, _provider = _synthetic(self.codata)
        object.__setattr__(receipt, "central_scales", ())
        with self.assertRaisesRegex(
            MODULE.PrimarySiNormalizationError, "not_authentic"
        ):
            MODULE.require_authentic_primary_si_normalization_receipt(receipt)

        receipt, _api, _session, _provider = _synthetic(self.codata)
        object.__setattr__(receipt, "adapter_source_observed_size_bytes", 1 << 4_096)
        with self.assertRaisesRegex(
            MODULE.PrimarySiNormalizationError, "not_authentic"
        ):
            MODULE.require_authentic_primary_si_normalization_receipt(receipt)

        deeply_nested: object = ()
        for _ in range(10_000):
            deeply_nested = (deeply_nested,)
        receipt, _api, _session, _provider = _synthetic(self.codata)
        hostile_trace = list(receipt.semantic_trace)
        hostile_trace[0] = deeply_nested
        object.__setattr__(receipt, "semantic_trace", tuple(hostile_trace))
        with self.assertRaisesRegex(
            MODULE.PrimarySiNormalizationError, "not_authentic"
        ):
            MODULE.require_authentic_primary_si_normalization_receipt(receipt)

        receipt, _api, _session, _provider = _synthetic(self.codata)
        object.__setattr__(
            receipt.semantic_trace[0],
            "canonical_result_dyadic",
            deeply_nested,
        )
        with self.assertRaisesRegex(
            MODULE.PrimarySiNormalizationError, "not_authentic"
        ):
            MODULE.require_authentic_primary_si_normalization_receipt(receipt)

    def test_static_surface_has_no_legacy_backend_or_authority_route(self) -> None:
        source = (HERE / "si_normalization_primary_adapter.py").read_text(encoding="utf-8")
        tree = ast.parse(source)
        imports = {
            alias.name
            for node in ast.walk(tree)
            if isinstance(node, ast.Import)
            for alias in node.names
        }
        imports.update(
            node.module
            for node in ast.walk(tree)
            if isinstance(node, ast.ImportFrom) and node.module is not None
        )
        self.assertNotIn("gmpy2", imports)
        self.assertNotIn("ctypes", imports)
        self.assertNotIn("si_normalization", imports)
        self.assertNotIn("mpmath", imports)
        self.assertNotIn("numpy", imports)
        self.assertNotIn("lease.receipt", source)
        for forbidden in (
            "CDLL",
            "declared_lever",
            "output_root",
            "candidate_freeze",
            "casimir:verify",
            "materialize_paired_element",
        ):
            self.assertNotIn(forbidden, source)
        public = next(
            node
            for node in tree.body
            if isinstance(node, ast.FunctionDef)
            and node.name == "materialize_primary_si_normalization"
        )
        self.assertEqual([argument.arg for argument in public.args.args], ["codata_raw_bytes"])
        self.assertEqual(public.args.kwonlyargs, [])


if __name__ == "__main__":
    unittest.main()
