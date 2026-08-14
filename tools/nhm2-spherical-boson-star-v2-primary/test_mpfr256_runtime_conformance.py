from __future__ import annotations

import ast
import copy
from contextlib import ExitStack
from dataclasses import FrozenInstanceError, fields, replace
import gc
import hashlib
import importlib.util
import inspect
import math
from pathlib import Path
import pickle
import stat
import struct
import sys
import threading
import unittest
from unittest import mock


HERE = Path(__file__).resolve().parent
SOURCE_PATH = HERE / "mpfr256_runtime_conformance.py"
SPEC = importlib.util.spec_from_file_location(
    "nhm2_spherical_v2_mpfr256_runtime_conformance", SOURCE_PATH
)
assert SPEC is not None and SPEC.loader is not None
runtime = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = runtime
SPEC.loader.exec_module(runtime)


class _Trap:
    def __init__(self) -> None:
        object.__setattr__(self, "accessed", [])

    def __getattribute__(self, name: str):
        if name in {"accessed", "__dict__", "__class__"}:
            return object.__getattribute__(self, name)
        object.__getattribute__(self, "accessed").append(name)
        raise AssertionError(f"caller object traversed:{name}")


class _FakeApi:
    def __init__(self) -> None:
        self.emin = -2_000_000
        self.emax = 2_000_000
        self.rounding = runtime.RNDU
        self.flags_value = 5
        self.saved = (self.emin, self.emax, self.rounding, self.flags_value)
        self.fail_snapshot = False
        self.fail_configure_emin = False
        self.fail_canary: BaseException | None = None
        self.restore_emax_failures = 0
        self.restore_emin_failures = 0
        self.restore_rounding_failures = 0
        self.restore_flags_failures = 0
        self.restore_flags_noop = False
        self.free_cache_calls = 0
        self.lease_events: list[str] = []
        self.lease_next_ordinal = 0
        self.fail_lease_clear_ordinals: set[int] = set()
        self.flag_on_lease_operation: str | None = None
        self.flags_on_lease_operations: set[str] = set()
        self.raise_on_lease_operation: str | None = None
        self.lease_ternary_results: dict[str, int] = {}
        self.forced_storage_identity: tuple[int, int] | None = None
        self.forced_lease_precision: int | None = None

    def get_emin(self) -> int:
        if self.fail_snapshot and self.emin == self.saved[0]:
            raise RuntimeError("snapshot")
        return self.emin

    def get_emax(self) -> int:
        return self.emax

    def set_emin(self, value: int) -> int:
        if value == runtime.CONFIGURED_EMIN and self.fail_configure_emin:
            return 1
        if value == self.saved[0] and self.restore_emin_failures > 0:
            self.restore_emin_failures -= 1
            return 1
        if value == self.saved[0]:
            self.lease_events.append("restore_emin")
        self.emin = value
        return 0

    def set_emax(self, value: int) -> int:
        if value == self.saved[1] and self.restore_emax_failures > 0:
            self.restore_emax_failures -= 1
            return 1
        if value == self.saved[1]:
            self.lease_events.append("restore_emax")
        self.emax = value
        return 0

    def get_rounding(self) -> int:
        return self.rounding

    def set_rounding(self, value: int) -> None:
        if value == self.saved[2] and self.restore_rounding_failures > 0:
            self.restore_rounding_failures -= 1
            raise RuntimeError("restore_rounding")
        if value == self.saved[2]:
            self.lease_events.append("restore_rounding")
        self.rounding = value

    def clear_flags(self) -> None:
        self.flags_value = 0

    def flags_save(self) -> int:
        return self.flags_value

    def flags_restore(self, value: int) -> None:
        if self.restore_flags_failures > 0:
            self.restore_flags_failures -= 1
            raise RuntimeError("restore_flags")
        if not self.restore_flags_noop:
            self.lease_events.append("restore_flags")
            self.flags_value = value

    def flags(self) -> tuple[bool, bool, bool, bool, bool, bool]:
        return tuple(bool(self.flags_value & (1 << index)) for index in range(6))

    def run_canary(self):
        if self.fail_canary is not None:
            raise self.fail_canary
        self.flags_value = 0
        return runtime.CanaryObservation(
            precision_bits=runtime.PRECISION_BITS,
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
        self.free_cache_calls += 1
        self.lease_events.append("free_cache")

    def _new_lease_value(self, kind: str):
        self.lease_next_ordinal += 1
        return {
            "kind": kind,
            "ordinal": self.lease_next_ordinal,
            "value": 0,
            "cleared": False,
        }

    def _lease_operation(self, name: str) -> None:
        self.lease_events.append(name)
        if self.raise_on_lease_operation == name:
            raise RuntimeError(name)
        if self.flag_on_lease_operation == name:
            self.flags_value = 1
        if name in self.flags_on_lease_operations:
            self.flags_value = 1 << 4

    def lease_new_mpfr(self):
        self._lease_operation("allocate_mpfr256")
        return self._new_lease_value("mpfr")

    def lease_new_mpz(self):
        self._lease_operation("allocate_mpz")
        return self._new_lease_value("mpz")

    def _clear_lease_value(self, value, kind: str) -> None:
        self.lease_events.append(f"clear_{kind}_{value['ordinal']}")
        if value["ordinal"] in self.fail_lease_clear_ordinals:
            raise RuntimeError("clear")
        if value["cleared"]:
            raise RuntimeError("double_clear")
        value["cleared"] = True

    def lease_clear_mpfr(self, value) -> None:
        self._clear_lease_value(value, "mpfr")

    def lease_clear_mpz(self, value) -> None:
        self._clear_lease_value(value, "mpz")

    def lease_mpfr_storage_identity(self, value) -> tuple[int, int]:
        if self.forced_storage_identity is not None:
            return self.forced_storage_identity
        ordinal = value["ordinal"]
        return 10_000 + ordinal, 20_000 + ordinal

    def lease_mpz_set_ui(self, destination, value: int) -> None:
        self._lease_operation("mpz_set_ui")
        destination["value"] = value

    def lease_mpz_set_si(self, destination, value: int) -> None:
        self._lease_operation("mpz_set_si")
        destination["value"] = value

    def lease_mpz_set_decimal(self, destination, value: str) -> int:
        self._lease_operation("mpz_set_decimal")
        destination["value"] = int(value)
        return 0

    def lease_mpz_decimal(self, value) -> str:
        self._lease_operation("mpz_decimal")
        return str(value["value"])

    def _set_mpfr(self, name: str, destination, value) -> int:
        self._lease_operation(name)
        destination["value"] = float(value)
        return self.lease_ternary_results.get(name, 0)

    def lease_mpfr_set_ui(self, destination, value: int, _rounding: int) -> int:
        return self._set_mpfr("mpfr_set_ui", destination, value)

    def lease_mpfr_set_si(self, destination, value: int, _rounding: int) -> int:
        return self._set_mpfr("mpfr_set_si", destination, value)

    def lease_mpfr_set_decimal(
        self, destination, value: str, _rounding: int
    ) -> int:
        return self._set_mpfr("mpfr_set_decimal", destination, value)

    def lease_mpfr_set_z(self, destination, source, _rounding: int) -> int:
        return self._set_mpfr("mpfr_set_z", destination, source["value"])

    def lease_mpfr_set(self, destination, source, _rounding: int) -> int:
        return self._set_mpfr("mpfr_set", destination, source["value"])

    def lease_mpfr_mul_2si(
        self, destination, source, exponent2: int, _rounding: int
    ) -> int:
        return self._set_mpfr(
            "mpfr_mul_2si", destination, source["value"] * (2.0**exponent2)
        )

    def _binary(self, name: str, destination, left, right) -> int:
        operations = {
            "mpfr_add": lambda: left["value"] + right["value"],
            "mpfr_sub": lambda: left["value"] - right["value"],
            "mpfr_mul": lambda: left["value"] * right["value"],
            "mpfr_div": lambda: left["value"] / right["value"],
        }
        return self._set_mpfr(name, destination, operations[name]())

    def lease_mpfr_add(self, destination, left, right, _rounding: int) -> int:
        return self._binary("mpfr_add", destination, left, right)

    def lease_mpfr_sub(self, destination, left, right, _rounding: int) -> int:
        return self._binary("mpfr_sub", destination, left, right)

    def lease_mpfr_mul(self, destination, left, right, _rounding: int) -> int:
        return self._binary("mpfr_mul", destination, left, right)

    def lease_mpfr_div(self, destination, left, right, _rounding: int) -> int:
        return self._binary("mpfr_div", destination, left, right)

    def lease_mpfr_sqrt(self, destination, source, _rounding: int) -> int:
        return self._set_mpfr("mpfr_sqrt", destination, math.sqrt(source["value"]))

    def lease_mpfr_const_pi(self, destination, _rounding: int) -> int:
        return self._set_mpfr("mpfr_const_pi", destination, math.pi)

    def lease_mpfr_compare(self, left, right) -> int:
        self._lease_operation("mpfr_compare")
        return (left["value"] > right["value"]) - (
            left["value"] < right["value"]
        )

    def lease_mpfr_compare_ui(self, left, right: int) -> int:
        self._lease_operation("mpfr_compare_ui")
        return (left["value"] > right) - (left["value"] < right)

    def lease_mpfr_compare_z(self, left, right) -> int:
        self._lease_operation("mpfr_compare_z")
        return (left["value"] > right["value"]) - (
            left["value"] < right["value"]
        )

    def lease_mpfr_equal(self, left, right) -> bool:
        self._lease_operation("mpfr_equal")
        return left["value"] == right["value"]

    def lease_mpfr_get_z_2exp(self, destination, source) -> int:
        self._lease_operation("mpfr_get_z_2exp")
        mantissa, exponent = math.frexp(source["value"])
        destination["value"] = int(mantissa * (1 << runtime.PRECISION_BITS))
        return exponent - runtime.PRECISION_BITS

    def lease_mpfr_get_d(self, source, _rounding: int) -> float:
        self._lease_operation("mpfr_get_d")
        return float(source["value"])

    def lease_mpfr_number(self, source) -> bool:
        self._lease_operation("mpfr_number")
        return math.isfinite(source["value"])

    def lease_mpfr_precision(self, _source) -> int:
        self._lease_operation("mpfr_precision")
        return (
            runtime.PRECISION_BITS
            if self.forced_lease_precision is None
            else self.forced_lease_precision
        )


def _file_identity(
    *, inode: int, size_bytes: int, link_count: int
):
    return runtime.FileIdentity(
        device=17,
        inode=inode,
        mode=stat.S_IFREG | 0o444,
        link_count=link_count,
        size_bytes=size_bytes,
        mtime_ns=101,
        ctime_ns=102,
    )


def _source_binding(component: str, digest: str, inode: int):
    soname = (
        runtime.EXPECTED_GMP_SONAME
        if component == "gmp"
        else runtime.EXPECTED_MPFR_SONAME
    )
    needed = (
        ("libc.so.6",)
        if component == "gmp"
        else (runtime.EXPECTED_GMP_SONAME, "libm.so.6")
    )
    return runtime.SourceLibraryBinding(
        component=component,
        canonical_path=f"/opt/nhm2 runtime/{soname}",
        identity=_file_identity(inode=inode, size_bytes=1, link_count=1),
        sha256_first_pass=digest,
        sha256_second_pass=digest,
        sha256_after_load=digest,
        elf=runtime.ElfIdentity(
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
    return runtime.LoadedLibraryBinding(
        component=component,
        sealed_memfd_name=name,
        identity=_file_identity(inode=inode, size_bytes=1, link_count=0),
        sha256=digest,
        seal_mask=15,
        required_seal_mask=15,
        seals_exact=True,
        loader_procfd_path=f"/proc/self/fd/{descriptor}",
        loader_link_map_name=f"/proc/self/fd/{descriptor}",
        dladdr_name=f"/proc/self/fd/{descriptor}",
        maps_path=f"/memfd:{name} (deleted)",
        representative_symbol=(
            "__gmpz_init" if component == "gmp" else "mpfr_get_version"
        ),
        maps_device_inode_exact=True,
        link_map_dladdr_exact=True,
        source_inode_loaded_directly=False,
    )


def _abi(*, exact: bool = True):
    return runtime.AbiObservation(
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
        abi_exact=exact,
    )


def _evidence(api: _FakeApi, **overrides):
    values = {
        "provider_kind": "synthetic_test_only",
        "native_provider_mechanics_observed": False,
        "namespace_id": 23,
        "source_libraries": (
            _source_binding("gmp", "a" * 64, 101),
            _source_binding("mpfr", "b" * 64, 102),
        ),
        "loaded_libraries": (
            _loaded_binding("gmp", "a" * 64, 201, 51),
            _loaded_binding("mpfr", "b" * 64, 202, 52),
        ),
        "mpfr_version": runtime.EXPECTED_MPFR_VERSION,
        "gmp_version": runtime.EXPECTED_GMP_VERSION,
        "resolved_mpfr_symbols": runtime.REQUIRED_MPFR_SYMBOLS,
        "resolved_gmp_symbols": runtime.REQUIRED_GMP_SYMBOLS,
        "abi": _abi(),
        "required_gmp_dependency_inventory_exact": True,
        "api": api,
    }
    values.update(overrides)
    return runtime._ProviderEvidence(**values)


class _FakeSession:
    def __init__(
        self,
        evidence,
        cleanup_codes: tuple[str, ...] = (),
        events: list[str] | None = None,
    ) -> None:
        self.evidence = evidence
        self.cleanup_codes = cleanup_codes
        self.closed = 0
        self.events = events

    def close(self) -> tuple[str, ...]:
        self.closed += 1
        if self.events is not None:
            self.events.append("session_close")
        return self.cleanup_codes


class _FakeProvider:
    def __init__(self, session: _FakeSession | None = None) -> None:
        self.session = session
        self.error: BaseException | None = None
        self.open_calls = 0

    def open_runtime(self, _request):
        self.open_calls += 1
        if self.error is not None:
            raise self.error
        assert self.session is not None
        return self.session


class _ProviderSource:
    def __init__(self, expectation, identity, events: list[str]) -> None:
        self.component = expectation.component
        self.expectation = expectation
        self.identity = identity
        self.fd = 101 if self.component == "gmp" else 102
        self.first_hash = expectation.sha256
        self.second_hash = expectation.sha256
        self.after_load_hash = ""
        self.elf = _source_binding(
            self.component, expectation.sha256, identity.inode
        ).elf
        self.events = events

    def binding(self):
        return runtime.SourceLibraryBinding(
            component=self.component,
            canonical_path=self.expectation.absolute_path,
            identity=self.identity,
            sha256_first_pass=self.first_hash,
            sha256_second_pass=self.second_hash,
            sha256_after_load=self.after_load_hash,
            elf=self.elf,
            nofollow_segment_traversal=True,
            single_link_regular_file=True,
            source_inode_loaded_directly=False,
        )

    def close(self) -> tuple[str, ...]:
        self.events.append(f"close_source_{self.component}")
        return ()


class _ProviderSealed:
    def __init__(self, component: str, digest: str, inode: int, events: list[str]):
        self.component = component
        self.fd = 201 if component == "gmp" else 202
        self.name = f"nhm2-spherical-v2-{component}-sealed-v1"
        self.identity = _file_identity(
            inode=inode, size_bytes=1, link_count=0
        )
        self.sha256 = digest
        self.seal_mask = 15
        self.required_seal_mask = 15
        self.events = events

    @property
    def procfd_path(self) -> str:
        return f"/proc/self/fd/{self.fd}"

    @property
    def maps_path(self) -> str:
        return f"/memfd:{self.name} (deleted)"

    def close(self) -> tuple[str, ...]:
        self.events.append(f"close_sealed_{self.component}")
        return ()


class _ProviderLoader:
    LM_ID_NEWLM = -1

    def __init__(self, events: list[str]) -> None:
        self.events = events
        self.symbol_calls: list[tuple[int, str, str]] = []
        self.gmp_path = "/proc/self/fd/201"
        self.mpfr_path = "/proc/self/fd/202"

    def open(self, namespace: int, path: str, component: str) -> int:
        self.events.append(f"open_{component}_{namespace}")
        return 301 if component == "gmp" else 302

    def namespace_id(self, _handle: int, _component: str) -> int:
        return 47

    def link_map_names(self, _handle: int) -> tuple[str, ...]:
        return (self.gmp_path, self.mpfr_path, "/lib/x86_64-linux-gnu/libc.so.6")

    def symbol(self, handle: int, name: str, component: str) -> int:
        self.symbol_calls.append((handle, name, component))
        if name in runtime.REQUIRED_GMP_SYMBOLS:
            return 9_001
        return 9_002

    def dladdr(self, _address: int, _component: str):
        return type("DlInfo", (), {"dli_fname": self.gmp_path.encode("ascii")})()

    def close(self, _handle: int, component: str) -> None:
        self.events.append(f"dlclose_{component}")
        return None


class _ProviderNativeApi:
    def __init__(self, _mpfr, _gmp) -> None:
        self.mpfr_value = runtime.EXPECTED_MPFR_VERSION
        self.gmp_value = runtime.EXPECTED_GMP_VERSION

    def mpfr_version(self) -> str:
        return self.mpfr_value

    def gmp_version(self) -> str:
        return self.gmp_value

    def gmp_limb_bits(self) -> int:
        return 64

    def tls_enabled(self) -> bool:
        return True


class _CapturedNativeSession:
    def __init__(self, *arguments) -> None:
        self.arguments = arguments
        self.evidence = arguments[0]


def _request():
    return runtime._RuntimeConformanceRequest(
        gmp=runtime._RuntimeLibraryExpectation(
            component="gmp",
            absolute_path="/opt/nhm2 runtime/libgmp.so.10",
            size_bytes=1,
            sha256="a" * 64,
        ),
        mpfr=runtime._RuntimeLibraryExpectation(
            component="mpfr",
            absolute_path="/opt/nhm2 runtime/libmpfr.so.6",
            size_bytes=1,
            sha256="b" * 64,
        ),
    )


def _trusted_manifest():
    request = _request()
    draft = runtime._TrustedRuntimeManifestV1(
        artifact_id=(
            "nhm2.spherical_boson_star_v2.mpfr256_trusted_runtime_manifest"
        ),
        contract_version=(
            "nhm2_spherical_boson_star_v2_mpfr256_trusted_runtime_manifest/v1"
        ),
        platform_system="Linux",
        machine="x86_64",
        byte_order="little_endian",
        pointer_bits=64,
        c_long_bits=64,
        c_int_bits=32,
        c_ulong_bits=64,
        mpfr_version=runtime.EXPECTED_MPFR_VERSION,
        gmp_version=runtime.EXPECTED_GMP_VERSION,
        mpfr_soname=runtime.EXPECTED_MPFR_SONAME,
        gmp_soname=runtime.EXPECTED_GMP_SONAME,
        required_mpfr_symbols=runtime.REQUIRED_MPFR_SYMBOLS,
        required_gmp_symbols=runtime.REQUIRED_GMP_SYMBOLS,
        gmp=request.gmp,
        mpfr=request.mpfr,
        non_caller_controlled_literal=True,
        external_installer_allowed=False,
        canonical_size_bytes=0,
        manifest_sha256="0" * 64,
    )
    unsigned = runtime._manifest_unsigned_bytes(draft)
    domain = b"nhm2-spherical-boson-star-v2/trusted-runtime-manifest/v1\n"
    digest = hashlib.sha256(
        domain + struct.pack("<Q", len(unsigned)) + unsigned
    ).hexdigest()
    return replace(
        draft,
        canonical_size_bytes=len(unsigned),
        manifest_sha256=digest,
    )


def _run(api: _FakeApi, **evidence_overrides):
    session = _FakeSession(_evidence(api, **evidence_overrides))
    receipt = runtime._test_only_observe_with_provider(
        _request(), _FakeProvider(session), runtime._TEST_ONLY_MARKER
    )
    return receipt, session


def _acquire(api: _FakeApi, cleanup_codes: tuple[str, ...] = ()):
    session = _FakeSession(_evidence(api), cleanup_codes, api.lease_events)
    lease = runtime._test_only_acquire_runtime_lease(
        _request(), _FakeProvider(session), runtime._TEST_ONLY_MARKER
    )
    return lease, session


class RuntimeConformanceTests(unittest.TestCase):
    def setUp(self) -> None:
        runtime._CONTEXT_POISONED = False
        runtime._CONTEXT_POISON_REASONS = ()

    def tearDown(self) -> None:
        for _reference, state, _generation in tuple(runtime._LEASE_STATES.values()):
            if state.active:
                try:
                    runtime._finalize_lease_state(
                        state, RuntimeError("test_teardown")
                    )
                except BaseException:
                    pass
        runtime._LEASE_STATES.clear()
        runtime._CONTEXT_POISONED = False
        runtime._CONTEXT_POISON_REASONS = ()

    def test_off_linux_gate_precedes_every_caller_object_traversal(self) -> None:
        trap = _Trap()
        for entry in (
            runtime.acquire_mpfr256_runtime_lease,
            runtime.observe_mpfr256_runtime_conformance,
        ):
            with self.subTest(entry=entry.__name__):
                with mock.patch.object(
                    runtime, "_host_is_linux_x86_64", return_value=False
                ):
                    with self.assertRaises(
                        runtime.RuntimeConformanceError
                    ) as caught:
                        entry()
                self.assertEqual(
                    caught.exception.code, "linux_x86_64_runtime_required"
                )
        self.assertEqual(trap.accessed, [])

        for entry in (
            runtime.acquire_mpfr256_runtime_lease,
            runtime.observe_mpfr256_runtime_conformance,
        ):
            with self.assertRaises(TypeError):
                entry(trap)
            with self.assertRaises(TypeError):
                entry(trap, trap)
            with self.assertRaises(TypeError):
                entry(request=trap)
        self.assertEqual(trap.accessed, [])

    def test_public_entry_has_no_provider_or_authority_injection(self) -> None:
        for entry in (
            runtime.acquire_mpfr256_runtime_lease,
            runtime.observe_mpfr256_runtime_conformance,
        ):
            signature = inspect.signature(entry)
            self.assertEqual(tuple(signature.parameters), ())
        self.assertEqual(
            tuple(runtime.__all__),
            (
                "RuntimeConformanceError",
                "acquire_mpfr256_runtime_lease",
                "observe_mpfr256_runtime_conformance",
            ),
        )

    def test_public_entry_fails_before_filesystem_or_native_loader_traversal(
        self,
    ) -> None:
        with ExitStack() as stack:
            stack.enter_context(
                mock.patch.object(runtime, "_host_is_linux_x86_64", return_value=True)
            )
            opened = stack.enter_context(mock.patch.object(runtime, "_open_source"))
            copied = stack.enter_context(mock.patch.object(runtime, "_copy_and_seal"))
            loader = stack.enter_context(mock.patch.object(runtime, "_DynamicLoader"))
            for entry in (
                runtime.acquire_mpfr256_runtime_lease,
                runtime.observe_mpfr256_runtime_conformance,
            ):
                with self.subTest(entry=entry.__name__):
                    with self.assertRaises(
                        runtime.RuntimeConformanceError
                    ) as caught:
                        entry()
                    self.assertEqual(
                        caught.exception.code,
                        "trusted_runtime_manifest_not_installed",
                    )
        opened.assert_not_called()
        copied.assert_not_called()
        loader.assert_not_called()

    def test_trusted_manifest_schema_is_self_bound_but_not_installed(self) -> None:
        self.assertIsNone(runtime._TRUSTED_RUNTIME_MANIFEST_LITERAL)
        manifest = _trusted_manifest()
        self.assertIs(runtime._require_trusted_manifest(manifest), manifest)
        self.assertFalse(manifest.external_installer_allowed)
        self.assertTrue(manifest.non_caller_controlled_literal)
        with self.assertRaises(FrozenInstanceError):
            manifest.external_installer_allowed = True
        hostile = (
            {"external_installer_allowed": True},
            {"non_caller_controlled_literal": False},
            {"manifest_sha256": "f" * 64},
            {"canonical_size_bytes": manifest.canonical_size_bytes + 1},
            {"required_mpfr_symbols": runtime.REQUIRED_MPFR_SYMBOLS[:-1]},
            {"gmp": replace(manifest.gmp, absolute_path="/tmp/untrusted.so")},
        )
        for changes in hostile:
            with self.subTest(changes=tuple(changes)):
                with self.assertRaises(runtime.RuntimeConformanceError):
                    runtime._require_trusted_manifest(
                        replace(manifest, **changes)
                    )

    def test_live_lease_is_opaque_and_owns_arithmetic_until_clean_close(self) -> None:
        api = _FakeApi()
        lease, session = _acquire(api)
        self.assertFalse(hasattr(lease, "__dict__"))
        for forbidden in ("session", "api", "native", "address", "provider"):
            self.assertFalse(hasattr(lease, forbidden), forbidden)
        with self.assertRaises(TypeError):
            copy.copy(lease)
        with self.assertRaises(TypeError):
            pickle.dumps(lease)

        with lease as active:
            integer = active.allocate_mpz()
            left = active.allocate_mpfr256()
            right = active.allocate_mpfr256()
            result = active.allocate_mpfr256()
            for handle in (integer, left, right, result):
                self.assertFalse(hasattr(handle, "__dict__"))
                self.assertFalse(hasattr(handle, "native"))
                with self.assertRaises(TypeError):
                    copy.copy(handle)
            active.mpz_set_decimal(integer, "2")
            self.assertEqual(active.mpz_decimal(integer), "2")
            self.assertEqual(active.mpfr_set_z(left, integer, runtime.RNDN), 0)
            self.assertEqual(active.mpfr_set_ui(right, 3, runtime.RNDU), 0)
            self.assertEqual(
                active.mpfr_add(result, left, right, runtime.RNDD), 0
            )
            self.assertIsNone(
                active.mpfr_set_decimal(result, "+5.0e+0", runtime.RNDN)
            )
            self.assertEqual(active.mpfr_get_d(result, runtime.RNDN), 5.0)
            self.assertTrue(active.mpfr_number(result))
            self.assertEqual(active.mpfr_precision(result), runtime.PRECISION_BITS)
            self.assertEqual(active.mpfr_compare(left, right), -1)
            self.assertEqual(active.mpfr_compare_ui(result, 5), 0)
            self.assertEqual(active.mpfr_compare_z(left, integer), 0)
            self.assertFalse(active.mpfr_equal(left, right))
            self.assertEqual(
                (api.emin, api.emax, api.rounding),
                (
                    runtime.CONFIGURED_EMIN,
                    runtime.CONFIGURED_EMAX,
                    runtime.RNDN,
                ),
            )

        receipt = lease.receipt
        self.assertIs(receipt, lease.close())
        self.assertEqual(session.closed, 1)
        self.assertTrue(receipt.operations_issued_through_this_live_lease)
        self.assertTrue(receipt.safe_finite_number_predicate_exposed)
        self.assertTrue(
            receipt.precision_256_verified_for_every_allocated_mpfr_object
        )
        self.assertTrue(
            receipt.storage_nonalias_verified_for_every_allocated_mpfr_object
        )
        self.assertFalse(receipt.semantic_si_operation_labels_bound)
        self.assertIn(
            "semantic_si_operation_labels_bound_by_future_adapter_not_runtime_lease",
            receipt.implementation_blockers,
        )
        self.assertEqual(receipt.expected_directed_rounded_operation_count, 107)
        self.assertEqual(receipt.expected_central_rndn_operation_count, 28)
        self.assertEqual(receipt.expected_terminal_get_d_count, 4)
        self.assertEqual(receipt.expected_total_rounded_operation_count, 139)
        self.assertEqual(receipt.observed_rounded_operation_count, 5)
        self.assertEqual(receipt.observed_terminal_get_d_count, 1)
        self.assertEqual(receipt.mpfr_object_count, 3)
        self.assertEqual(receipt.mpz_object_count, 1)
        self.assertTrue(receipt.reverse_object_clear_complete)
        self.assertTrue(receipt.context_restored_exact)
        self.assertTrue(receipt.flags_restored_exact)
        self.assertTrue(receipt.runtime_unloaded_and_fds_closed)
        self.assertTrue(receipt.lifecycle_complete)
        self.assertTrue(receipt.synthetic_test_provider)
        self.assertFalse(receipt.trusted_manifest_installed)
        self.assertIsNone(receipt.trusted_manifest_sha256)
        self.assertIsNone(receipt.trusted_manifest_size_bytes)
        self.assertFalse(receipt.real_linux_glibc_integration_observed)
        self.assertFalse(receipt.runtime_conformance_authority)
        for field in (
            "candidate_ready",
            "execution_ready",
            "execution_authority",
            "replay_ready",
            "replay_authority",
            "publication_ready",
            "publication_authority",
            "scientific_preseal_authority",
            "scientific_authority",
            "independent_agreement",
            "diagnostic_pass",
            "semiclassical_stress_noise_lamp",
            "semiclassical_constraint_algebra_lamp",
            "theory_graph_promotion",
            "physical_viability",
            "propulsion",
            "transport",
        ):
            self.assertIs(getattr(receipt, field), False, field)
        self.assertEqual(
            receipt.operation_trace_sha256,
            runtime._operation_trace_sha256(receipt.operation_trace),
        )
        self.assertEqual(
            [
                event
                for event in api.lease_events
                if event.startswith("clear_")
            ],
            ["clear_mpfr_4", "clear_mpfr_3", "clear_mpfr_2", "clear_mpz_1"],
        )
        last_object_clear = max(
            index
            for index, event in enumerate(api.lease_events)
            if event.startswith("clear_")
        )
        self.assertLess(last_object_clear, api.lease_events.index("free_cache"))
        self.assertLess(
            api.lease_events.index("free_cache"),
            api.lease_events.index("restore_emax"),
        )
        self.assertLess(
            api.lease_events.index("restore_flags"),
            api.lease_events.index("session_close"),
        )
        self.assertEqual(
            (api.emin, api.emax, api.rounding, api.flags_value), api.saved
        )

    def test_zero_consumer_test_lease_closes_without_operation_claim(self) -> None:
        lease, session = _acquire(_FakeApi())
        receipt = lease.close()
        self.assertEqual(session.closed, 1)
        self.assertFalse(receipt.operations_issued_through_this_live_lease)
        self.assertEqual(receipt.operation_trace, ())
        self.assertEqual(receipt.mpfr_object_count, 0)
        self.assertEqual(receipt.mpz_object_count, 0)

    def test_139_rounded_operation_coordinates_are_derived_not_claimed(self) -> None:
        lease, _session = _acquire(_FakeApi())
        value = lease.allocate_mpfr256()
        for integer in range(135):
            lease.mpfr_set_ui(value, integer, runtime.RNDN)
        for _index in range(4):
            lease.mpfr_get_d(value, runtime.RNDN)
        self.assertTrue(lease.mpfr_number(value))
        self.assertEqual(lease.mpfr_precision(value), runtime.PRECISION_BITS)
        receipt = lease.close()
        self.assertEqual(
            receipt.observed_rounded_operation_count,
            receipt.expected_total_rounded_operation_count,
        )
        self.assertEqual(
            receipt.observed_terminal_get_d_count,
            receipt.expected_terminal_get_d_count,
        )
        self.assertFalse(receipt.semantic_si_operation_labels_bound)
        self.assertIn(
            "semantic_si_operation_labels_bound_by_future_adapter_not_runtime_lease",
            receipt.implementation_blockers,
        )

    def test_live_acquisition_failure_restores_and_closes_without_token(self) -> None:
        api = _FakeApi()
        api.fail_configure_emin = True
        session = _FakeSession(_evidence(api), events=api.lease_events)
        provider = _FakeProvider(session)
        with self.assertRaises(runtime.RuntimeConformanceError) as caught:
            runtime._test_only_acquire_runtime_lease(
                _request(), provider, runtime._TEST_ONLY_MARKER
            )
        self.assertEqual(caught.exception.code, "runtime_context_set_emin_failed")
        self.assertEqual(session.closed, 1)
        self.assertEqual(
            (api.emin, api.emax, api.rounding, api.flags_value), api.saved
        )
        self.assertEqual(runtime._LEASE_STATES, {})
        self.assertTrue(runtime._RUNTIME_LOCK.acquire(blocking=False))
        runtime._RUNTIME_LOCK.release()

        api = _FakeApi()
        api.fail_canary = RuntimeError("canary")
        session = _FakeSession(_evidence(api), events=api.lease_events)
        with self.assertRaises(runtime.RuntimeConformanceError) as caught:
            runtime._test_only_acquire_runtime_lease(
                _request(),
                _FakeProvider(session),
                runtime._TEST_ONLY_MARKER,
            )
        self.assertEqual(caught.exception.code, "runtime_lease_acquisition_failed")
        self.assertEqual(caught.exception.detail, "RuntimeError")
        self.assertEqual(session.closed, 1)
        self.assertEqual(
            (api.emin, api.emax, api.rounding, api.flags_value), api.saved
        )

    def test_live_lease_is_exclusive_and_abandonment_best_effort_closes(self) -> None:
        api = _FakeApi()
        lease, session = _acquire(api)
        provider = _FakeProvider(_FakeSession(_evidence(_FakeApi())))
        with self.assertRaises(runtime.RuntimeConformanceError) as caught:
            runtime._test_only_acquire_runtime_lease(
                _request(), provider, runtime._TEST_ONLY_MARKER
            )
        self.assertEqual(
            caught.exception.code, "exclusive_mpfr_context_lease_unavailable"
        )
        self.assertEqual(provider.open_calls, 0)
        lease.allocate_mpfr256()
        token_id = id(lease)
        del lease
        gc.collect()
        self.assertNotIn(token_id, runtime._LEASE_STATES)
        self.assertEqual(session.closed, 1)
        self.assertEqual(
            (api.emin, api.emax, api.rounding, api.flags_value), api.saved
        )
        self.assertFalse(runtime._CONTEXT_POISONED)
        self.assertTrue(runtime._RUNTIME_LOCK.acquire(blocking=False))
        runtime._RUNTIME_LOCK.release()

    def test_lease_generation_ownership_and_nonalias_are_enforced(self) -> None:
        first, _first_session = _acquire(_FakeApi())
        stale = first.allocate_mpfr256()
        first_generation = first.close().generation

        second, _second_session = _acquire(_FakeApi())
        current = second.allocate_mpfr256()
        other = second.allocate_mpfr256()
        with self.assertRaises(runtime.RuntimeConformanceError) as caught:
            second.mpfr_number(stale)
        self.assertEqual(caught.exception.code, "runtime_lease_object_identity_invalid")
        with self.assertRaises(runtime.RuntimeConformanceError) as caught:
            second.mpfr_set(current, current, runtime.RNDN)
        self.assertEqual(
            caught.exception.code,
            "runtime_lease_destination_source_alias_forbidden",
        )
        second.mpfr_set_ui(current, 1, runtime.RNDN)
        second.mpfr_set(other, current, runtime.RNDN)
        second_receipt = second.close()
        self.assertGreater(second_receipt.generation, first_generation)
        with self.assertRaises(runtime.RuntimeConformanceError):
            runtime._OwnedMpfr256()

    def test_lease_is_bound_to_acquiring_thread(self) -> None:
        lease, _session = _acquire(_FakeApi())
        value = lease.allocate_mpfr256()
        errors: list[BaseException] = []

        def use_from_foreign_thread() -> None:
            try:
                lease.mpfr_number(value)
            except BaseException as error:
                errors.append(error)

        worker = threading.Thread(target=use_from_foreign_thread)
        worker.start()
        worker.join(timeout=5)
        self.assertFalse(worker.is_alive())
        self.assertEqual(len(errors), 1)
        self.assertIsInstance(errors[0], runtime.RuntimeConformanceError)
        self.assertEqual(
            errors[0].code, "runtime_lease_owner_thread_mismatch"
        )
        self.assertFalse(runtime._CONTEXT_POISONED)
        lease.close()

        api = _FakeApi()
        lease, session = _acquire(api)
        holder = [lease]
        token_id = id(lease)
        del lease

        def abandon_from_foreign_thread() -> None:
            token = holder.pop()
            del token
            gc.collect()

        worker = threading.Thread(target=abandon_from_foreign_thread)
        worker.start()
        worker.join(timeout=5)
        self.assertFalse(worker.is_alive())
        self.assertNotIn(token_id, runtime._LEASE_STATES)
        self.assertEqual(session.closed, 1)
        self.assertTrue(runtime._CONTEXT_POISONED)
        self.assertIn(
            "runtime_lease_owner_thread_lost",
            runtime._CONTEXT_POISON_REASONS,
        )

    def test_native_storage_identity_nonalias_and_drift_fail_closed(self) -> None:
        api = _FakeApi()
        api.forced_lease_precision = 255
        lease, _session = _acquire(api)
        with self.assertRaises(runtime.RuntimeConformanceError) as precision:
            lease.allocate_mpfr256()
        self.assertEqual(
            precision.exception.code, "runtime_lease_mpfr_precision_invalid"
        )
        with self.assertRaises(runtime.RuntimeConformanceError):
            lease.close()

        for forced_identity in (
            (10_001, 99_002),
            (99_001, 20_001),
            (10_001, 20_001),
        ):
            with self.subTest(forced_identity=forced_identity):
                api = _FakeApi()
                lease, _session = _acquire(api)
                lease.allocate_mpfr256()
                api.forced_storage_identity = forced_identity
                with self.assertRaises(
                    runtime.RuntimeConformanceError
                ) as caught:
                    lease.allocate_mpfr256()
                self.assertEqual(
                    caught.exception.code,
                    "runtime_lease_mpfr_storage_nonalias_not_established",
                )
                api.forced_storage_identity = None
                with self.assertRaises(runtime.RuntimeConformanceError):
                    lease.close()

        api = _FakeApi()
        lease, _session = _acquire(api)
        value = lease.allocate_mpfr256()
        api.forced_storage_identity = (99_001, 20_001)
        with self.assertRaises(runtime.RuntimeConformanceError) as struct_drift:
            lease.mpfr_number(value)
        self.assertEqual(
            struct_drift.exception.code, "runtime_lease_storage_identity_drift"
        )
        api.forced_storage_identity = None
        with self.assertRaises(runtime.RuntimeConformanceError) as failed_lease:
            lease.close()
        self.assertEqual(
            failed_lease.exception.code, "runtime_lease_storage_identity_drift"
        )
        self.assertFalse(runtime._CONTEXT_POISONED)

        api = _FakeApi()
        lease, _session = _acquire(api)
        lease.allocate_mpfr256()
        api.forced_storage_identity = (10_001, 99_002)
        with self.assertRaises(runtime.RuntimeConformanceError) as cleanup:
            lease.close()
        self.assertEqual(cleanup.exception.code, "runtime_lease_cleanup_failed")
        self.assertTrue(runtime._CONTEXT_POISONED)

    def test_lease_scalar_ingress_is_exact_and_bounded(self) -> None:
        lease, _session = _acquire(_FakeApi())
        integer = lease.allocate_mpz()
        left = lease.allocate_mpfr256()
        right = lease.allocate_mpfr256()
        invalid_calls = (
            lambda: lease.mpz_set_ui(integer, True),
            lambda: lease.mpz_set_si(integer, 1 << 63),
            lambda: lease.mpz_set_decimal(integer, "+1"),
            lambda: lease.mpz_set_decimal(
                integer, "1" * (runtime.MAX_INTEGER_DECIMAL_BYTES + 1)
            ),
            lambda: lease.mpfr_set_decimal(left, "nan", runtime.RNDN),
            lambda: lease.mpfr_set_decimal(left, "1E2", runtime.RNDN),
            lambda: lease.mpfr_set_decimal(left, "-1", runtime.RNDN),
            lambda: lease.mpfr_set_decimal(left, "1.", runtime.RNDN),
            lambda: lease.mpfr_set_decimal(
                left, "1e1000001", runtime.RNDN
            ),
            lambda: lease.mpfr_set_ui(left, 1, 1),
            lambda: lease.mpfr_mul_2si(
                right,
                left,
                runtime.MAX_ABS_BINARY_EXPONENT + 1,
                runtime.RNDN,
            ),
            lambda: lease._binary(
                "free_cache", right, left, left, runtime.RNDN
            ),
        )
        for call in invalid_calls:
            with self.subTest(call=call):
                with self.assertRaises(runtime.RuntimeConformanceError):
                    call()
        lease.close()

    def test_consumer_exception_is_preserved_when_cleanup_is_clean(self) -> None:
        lease, session = _acquire(_FakeApi())
        sentinel = ValueError("consumer")
        caught: BaseException | None = None
        try:
            with lease as active:
                active.allocate_mpfr256()
                raise sentinel
        except BaseException as error:
            caught = error
        self.assertIs(caught, sentinel)
        self.assertEqual(session.closed, 1)
        self.assertFalse(runtime._CONTEXT_POISONED)
        with self.assertRaises(runtime.RuntimeConformanceError) as unavailable:
            _ = lease.receipt
        self.assertEqual(
            unavailable.exception.code, "runtime_lease_receipt_unavailable"
        )

    def test_cleanup_failure_supersedes_consumer_and_poison_is_sticky(self) -> None:
        api = _FakeApi()
        api.fail_lease_clear_ordinals.add(1)
        lease, session = _acquire(api)
        provider = _FakeProvider(_FakeSession(_evidence(_FakeApi())))
        with self.assertRaises(runtime.RuntimeConformanceError) as caught:
            with lease as active:
                active.allocate_mpfr256()
                raise ValueError("consumer")
        self.assertEqual(caught.exception.code, "runtime_lease_cleanup_failed")
        self.assertEqual(caught.exception.detail, "ValueError")
        self.assertEqual(session.closed, 1)
        self.assertTrue(runtime._CONTEXT_POISONED)
        failed_state = runtime._resolve_lease(lease, require_active=False)
        self.assertIsNone(failed_state.api)
        self.assertIsNone(failed_state.session)
        self.assertIsNone(failed_state.evidence.api)
        with self.assertRaises(runtime.RuntimeConformanceError) as poisoned:
            runtime._test_only_acquire_runtime_lease(
                _request(), provider, runtime._TEST_ONLY_MARKER
            )
        self.assertEqual(poisoned.exception.code, "runtime_context_poisoned")
        self.assertEqual(provider.open_calls, 0)

    def test_forbidden_operation_flag_rejects_without_receipt(self) -> None:
        api = _FakeApi()
        api.flag_on_lease_operation = "mpfr_set_ui"
        lease, session = _acquire(api)
        with self.assertRaises(runtime.RuntimeConformanceError) as caught:
            with lease as active:
                value = active.allocate_mpfr256()
                active.mpfr_set_ui(value, 1, runtime.RNDN)
        self.assertEqual(
            caught.exception.code, "runtime_lease_operation_forbidden_flag_set"
        )
        self.assertEqual(session.closed, 1)
        self.assertFalse(runtime._CONTEXT_POISONED)
        with self.assertRaises(runtime.RuntimeConformanceError):
            _ = lease.receipt

    def test_arbitrary_mpfr_ternary_magnitudes_normalize_to_sign(self) -> None:
        api = _FakeApi()
        api.lease_ternary_results.update(
            {
                "mpfr_set_ui": 2,
                "mpfr_add": -(1 << 200),
                "mpfr_const_pi": 1 << 255,
            }
        )
        api.flags_on_lease_operations.update(api.lease_ternary_results)
        lease, _session = _acquire(api)
        left = lease.allocate_mpfr256()
        right = lease.allocate_mpfr256()
        result = lease.allocate_mpfr256()
        pi_value = lease.allocate_mpfr256()
        self.assertEqual(lease.mpfr_set_ui(left, 1, runtime.RNDN), 1)
        self.assertEqual(lease.mpfr_set_si(right, 2, runtime.RNDN), 0)
        self.assertEqual(
            lease.mpfr_add(result, left, right, runtime.RNDD), -1
        )
        self.assertEqual(lease.mpfr_const_pi(pi_value, runtime.RNDU), 1)
        receipt = lease.close()
        rounded = {
            item.operation: item
            for item in receipt.operation_trace
            if item.operation in api.lease_ternary_results
        }
        self.assertEqual(rounded["mpfr_set_ui"].ternary_result, 1)
        self.assertEqual(rounded["mpfr_add"].ternary_result, -1)
        self.assertEqual(rounded["mpfr_const_pi"].ternary_result, 1)
        self.assertTrue(
            all(item.inexact_flag for item in rounded.values())
        )
        canonical, _fingerprint = lease.validated_receipt_snapshot()
        self.assertIn('"ternary_result":-1', canonical)
        self.assertNotIn(str(-(1 << 200)), canonical)

    def test_ternary_sign_and_inexact_flag_mismatch_is_rejected(self) -> None:
        cases = (
            (2, False),
            (-(1 << 220), False),
            (0, True),
        )
        for raw_ternary, inexact_flag in cases:
            with self.subTest(raw_ternary=raw_ternary, flag=inexact_flag):
                api = _FakeApi()
                api.lease_ternary_results["mpfr_set_ui"] = raw_ternary
                if inexact_flag:
                    api.flags_on_lease_operations.add("mpfr_set_ui")
                lease, _session = _acquire(api)
                with self.assertRaises(runtime.RuntimeConformanceError) as caught:
                    with lease as active:
                        value = active.allocate_mpfr256()
                        active.mpfr_set_ui(value, 1, runtime.RNDN)
                self.assertEqual(
                    caught.exception.code,
                    "runtime_lease_ternary_inexact_flag_mismatch",
                )

    def test_mpfr_set_str_status_is_not_treated_as_ternary(self) -> None:
        api = _FakeApi()
        api.lease_ternary_results["mpfr_set_decimal"] = -1
        lease, _session = _acquire(api)
        with self.assertRaises(runtime.RuntimeConformanceError) as caught:
            with lease as active:
                value = active.allocate_mpfr256()
                active.mpfr_set_decimal(value, "1.0", runtime.RNDN)
        self.assertEqual(
            caught.exception.code,
            "runtime_lease_mpfr_decimal_parse_failed",
        )

    def test_post_close_receipt_snapshot_is_immutable_and_revalidated(self) -> None:
        lease, _session = _acquire(_FakeApi())
        value = lease.allocate_mpfr256()
        lease.mpfr_set_ui(value, 1, runtime.RNDN)
        receipt = lease.close()
        canonical, fingerprint = lease.validated_receipt_snapshot()
        payload = canonical.encode("ascii")
        domain = (
            b"nhm2-spherical-boson-star-v2/"
            b"runtime-lease-receipt-snapshot/v2\n"
        )
        self.assertEqual(
            fingerprint,
            hashlib.sha256(
                domain + struct.pack("<Q", len(payload)) + payload
            ).hexdigest(),
        )
        self.assertIn('"execution_authority":false', canonical)
        self.assertIn(
            "post_close_binding_requires_validated_immutable_receipt_snapshot",
            canonical,
        )

        object.__setattr__(receipt, "execution_authority", True)
        self.assertIn('"execution_authority":false', canonical)
        for readback in (lambda: lease.receipt, lease.validated_receipt_snapshot):
            with self.subTest(readback=readback):
                with self.assertRaises(
                    runtime.RuntimeConformanceError
                ) as caught:
                    readback()
                self.assertEqual(
                    caught.exception.code,
                    "runtime_lease_receipt_integrity_invalid",
                )

    def test_nested_receipt_mutation_and_unminted_clone_are_rejected(self) -> None:
        lease, _session = _acquire(_FakeApi())
        receipt = lease.close()
        object.__setattr__(receipt.canary, "precision_bits", 1)
        with self.assertRaises(runtime.RuntimeConformanceError) as nested:
            lease.validated_receipt_snapshot()
        self.assertEqual(
            nested.exception.code, "runtime_lease_receipt_integrity_invalid"
        )

        clean_lease, _clean_session = _acquire(_FakeApi())
        clean_receipt = clean_lease.close()
        clone = replace(clean_receipt)
        with self.assertRaises(runtime.RuntimeConformanceError) as unminted:
            runtime._validated_lease_receipt_snapshot(clone)
        self.assertEqual(
            unminted.exception.code, "runtime_lease_receipt_not_minted"
        )

    def test_closed_lease_state_retains_no_runtime_api(self) -> None:
        api = _FakeApi()
        lease, _session = _acquire(api)
        lease.close()
        state = runtime._resolve_lease(lease, require_active=False)
        self.assertIsNone(state.api)
        self.assertIsNone(state.session)
        self.assertIsNone(state.evidence.api)
        self.assertIsNot(state.evidence, _session.evidence)

    def test_lease_receipt_cannot_be_promoted_or_rewritten(self) -> None:
        lease, _session = _acquire(_FakeApi())
        value = lease.allocate_mpfr256()
        lease.mpfr_set_ui(value, 1, runtime.RNDN)
        receipt = lease.close()
        hostile = (
            {"execution_authority": True},
            {"scientific_authority": True},
            {"trusted_manifest_installed": True},
            {"trusted_manifest_sha256": "a" * 64},
            {"real_linux_glibc_integration_observed": True},
            {"semantic_si_operation_labels_bound": True},
            {"safe_finite_number_predicate_exposed": False},
            {"expected_total_rounded_operation_count": 138},
            {"observed_terminal_get_d_count": 1},
            {"synthetic_test_provider": False},
            {"lifecycle_complete": False},
            {"operation_trace": ()},
            {"operation_trace_sha256": "0" * 64},
        )
        for changes in hostile:
            with self.subTest(changes=tuple(changes)):
                with self.assertRaises(ValueError):
                    replace(receipt, **changes)

    def test_positive_synthetic_provider_is_permanently_nonproduction(self) -> None:
        api = _FakeApi()
        receipt, session = _run(api)
        self.assertEqual(session.closed, 1)
        self.assertTrue(receipt.calculation_only)
        self.assertTrue(receipt.runtime_conformance_diagnostic_only)
        self.assertTrue(receipt.synthetic_test_provider)
        self.assertFalse(receipt.production_runtime_conformance_observed)
        self.assertFalse(receipt.linux_native_runtime_diagnostic_observed)
        self.assertFalse(receipt.source_inode_loaded_directly)
        self.assertFalse(receipt.exact_source_bytes_copied_to_sealed_memfds)
        self.assertFalse(
            receipt.exact_sealed_loaded_required_symbol_identity_observed
        )
        self.assertFalse(receipt.fresh_loader_namespace)
        self.assertFalse(receipt.gmp_loaded_before_mpfr)
        self.assertFalse(
            receipt.mpfr_required_gmp_symbol_inventory_resolved_from_exact_sealed_copy
        )
        self.assertFalse(receipt.consumer_arithmetic_bound_to_conformed_runtime)
        self.assertFalse(receipt.transitive_runtime_closure_bound)
        self.assertFalse(receipt.trusted_runtime_manifest_installed)
        self.assertIsNone(receipt.trusted_runtime_manifest_binding)
        self.assertFalse(receipt.real_linux_glibc_integration_observed)
        self.assertEqual(receipt.provider_kind, "synthetic_test_only")
        self.assertIn(
            "synthetic_test_provider_not_production_conformance",
            receipt.implementation_blockers,
        )
        self.assertEqual(
            (api.emin, api.emax, api.rounding, api.flags_value), api.saved
        )
        self.assertTrue(receipt.context.context_restored_exact)
        self.assertTrue(receipt.context.flags_restored_exact)

    def test_every_authority_readiness_and_lamp_is_false(self) -> None:
        receipt, _session = _run(_FakeApi())
        for field in (
            "runtime_conformance_authority",
            "candidate_ready",
            "execution_ready",
            "execution_authority",
            "replay_ready",
            "replay_authority",
            "publication_ready",
            "publication_authority",
            "scientific_preseal_authority",
            "scientific_authority",
            "independent_agreement",
            "diagnostic_pass",
            "semiclassical_stress_noise_lamp",
            "semiclassical_constraint_algebra_lamp",
            "theory_graph_promotion",
            "physical_viability",
            "propulsion",
            "transport",
        ):
            self.assertIs(getattr(receipt, field), False, field)
        self.assertIn(
            "server_authenticated_runtime_loader_observer_absent",
            receipt.implementation_blockers,
        )
        self.assertIn(
            "consumer_arithmetic_not_bound_to_conformed_runtime",
            receipt.implementation_blockers,
        )
        self.assertIn(
            "transitive_runtime_closure_unbound",
            receipt.implementation_blockers,
        )
        self.assertIn(
            "trusted_runtime_manifest_not_installed",
            receipt.implementation_blockers,
        )
        self.assertIn(
            "real_linux_glibc_integration_not_observed",
            receipt.implementation_blockers,
        )

    def test_receipt_and_nested_evidence_are_frozen(self) -> None:
        receipt, _session = _run(_FakeApi())
        with self.assertRaises(FrozenInstanceError):
            receipt.execution_authority = True
        with self.assertRaises(FrozenInstanceError):
            receipt.context.saved_flags = 0
        with self.assertRaises(TypeError):
            receipt.source_libraries[0] = receipt.source_libraries[0]

    def test_receipt_replace_cannot_promote_authority_or_manifest_state(self) -> None:
        receipt, _session = _run(_FakeApi())
        hostile = (
            {"execution_authority": True},
            {"scientific_authority": True},
            {"production_runtime_conformance_observed": True},
            {"trusted_runtime_manifest_installed": True},
            {"trusted_runtime_manifest_binding": object()},
            {"calculation_only": False},
            {"provider_kind": "linux_native"},
            {"artifact_id": "retuned"},
            {"required_gmp_symbols": runtime.REQUIRED_GMP_SYMBOLS[:-1]},
        )
        for changes in hostile:
            with self.subTest(changes=tuple(changes)):
                with self.assertRaises(ValueError):
                    replace(receipt, **changes)
        values = {item.name: getattr(receipt, item.name) for item in fields(receipt)}
        values["execution_authority"] = True
        with self.assertRaises(ValueError):
            runtime._RuntimeConformanceReceipt(**values)

    def test_test_marker_is_required_and_never_public(self) -> None:
        provider = _FakeProvider(_FakeSession(_evidence(_FakeApi())))
        for entry in (
            runtime._test_only_observe_with_provider,
            runtime._test_only_acquire_runtime_lease,
        ):
            with self.subTest(entry=entry.__name__):
                with self.assertRaises(runtime.RuntimeConformanceError) as caught:
                    entry(_request(), provider, object())
                self.assertEqual(
                    caught.exception.code,
                    "synthetic_test_provider_marker_invalid",
                )
        self.assertEqual(provider.open_calls, 0)

    def test_synthetic_provider_cannot_self_label_native(self) -> None:
        api = _FakeApi()
        session = _FakeSession(
            _evidence(
                api,
                provider_kind="linux_x86_64_sealed_memfd_dlmopen_diagnostic/v1",
                native_provider_mechanics_observed=True,
            )
        )
        with self.assertRaises(runtime.RuntimeConformanceError) as caught:
            runtime._test_only_observe_with_provider(
                _request(), _FakeProvider(session), runtime._TEST_ONLY_MARKER
            )
        self.assertEqual(
            caught.exception.code,
            "synthetic_provider_cannot_claim_native_evidence",
        )
        self.assertEqual(session.closed, 1)

    def test_request_is_exact_and_paths_are_bounded_safe_segments(self) -> None:
        runtime._require_request(_request())
        valid = (
            "/opt/runtime with spaces/lib+gmp@v1\\data.so",
            "/a:b/c",
        )
        for value in valid:
            self.assertTrue(runtime._path_segments(value))
        invalid = (
            "/",
            "relative/lib.so",
            "//srv/lib.so",
            "/srv/lib.so/",
            "/./lib.so",
            "/../lib.so",
            "/srv/./lib.so",
            "/srv/../lib.so",
            "/srv//lib.so",
            "/srv/\x00lib.so",
            "/srv/\x1flib.so",
            "/srv/é.so",
        )
        for value in invalid:
            with self.subTest(value=repr(value)):
                with self.assertRaises(runtime.RuntimeConformanceError) as caught:
                    runtime._path_segments(value)
                self.assertEqual(caught.exception.code, "runtime_library_path_invalid")

    def test_proc_maps_parser_rejects_every_malformed_nonempty_line(self) -> None:
        valid = b"1000-2000 r-xp 00000000 00:01 42 /memfd:gmp (deleted)\n"
        with mock.patch.object(
            runtime.os,
            "makedev",
            side_effect=lambda major, minor: (major << 8) | minor,
            create=True,
        ):
            parsed = runtime._parse_map_entries(valid)
            self.assertEqual(len(parsed), 1)
            self.assertEqual(parsed[0][3:], (42, "/memfd:gmp (deleted)"))
            non_ascii_path = (
                b"2000-3000 r--p 00000000 00:01 43 /tmp/host-\xff.so\n"
            )
            self.assertEqual(len(runtime._parse_map_entries(non_ascii_path)), 1)
            for raw in (
                b"malformed\n",
                valid + b"still malformed\n",
                b"1000-2000 r-xp not-hex 00:01 42 /tmp/a\n",
            ):
                with self.subTest(raw=raw):
                    with self.assertRaises(
                        runtime.RuntimeConformanceError
                    ) as caught:
                        runtime._parse_map_entries(raw)
                    self.assertEqual(
                        caught.exception.code,
                        "runtime_loader_maps_line_invalid",
                    )

    def test_helper_local_fd_cleanup_failures_are_typed_and_poison(self) -> None:
        with ExitStack() as stack:
            for name, value in (
                ("O_CLOEXEC", 1),
                ("O_DIRECTORY", 2),
                ("O_NOFOLLOW", 4),
                ("O_PATH", 8),
            ):
                stack.enter_context(
                    mock.patch.object(runtime.os, name, value, create=True)
                )
            stack.enter_context(mock.patch.object(runtime.os, "open", return_value=70))
            stack.enter_context(
                mock.patch.object(runtime.os, "stat", side_effect=OSError(2, "missing"))
            )
            stack.enter_context(
                mock.patch.object(runtime.os, "close", side_effect=OSError(5, "close"))
            )
            with self.assertRaises(runtime.RuntimeConformanceError) as source_error:
                runtime._open_source(_request().gmp)
        self.assertEqual(
            source_error.exception.code,
            "runtime_source_acquisition_cleanup_failed",
        )
        self.assertIn(
            "gmp_directory_fd_close_failed",
            source_error.exception.cleanup_codes,
        )
        self.assertTrue(runtime._CONTEXT_POISONED)

        runtime._CONTEXT_POISONED = False
        runtime._CONTEXT_POISON_REASONS = ()
        source = _ProviderSource(
            _request().gmp,
            _file_identity(inode=101, size_bytes=1, link_count=1),
            [],
        )
        fake_fcntl = type(
            "Fcntl",
            (),
            {
                "F_ADD_SEALS": 1,
                "F_GET_SEALS": 2,
                "F_SEAL_WRITE": 1,
                "F_SEAL_GROW": 2,
                "F_SEAL_SHRINK": 4,
                "F_SEAL_SEAL": 8,
            },
        )()
        with ExitStack() as stack:
            stack.enter_context(
                mock.patch.object(
                    runtime.os, "memfd_create", return_value=71, create=True
                )
            )
            stack.enter_context(
                mock.patch.object(runtime.os, "MFD_ALLOW_SEALING", 1, create=True)
            )
            stack.enter_context(
                mock.patch.object(runtime.os, "MFD_CLOEXEC", 2, create=True)
            )
            stack.enter_context(
                mock.patch.object(
                    runtime.importlib,
                    "import_module",
                    return_value=fake_fcntl,
                )
            )
            stack.enter_context(
                mock.patch.object(runtime.os, "fstat", side_effect=OSError(5, "stat"))
            )
            stack.enter_context(
                mock.patch.object(runtime.os, "close", side_effect=OSError(5, "close"))
            )
            with self.assertRaises(runtime.RuntimeConformanceError) as sealed_error:
                runtime._copy_and_seal(source)
        self.assertEqual(
            sealed_error.exception.code,
            "runtime_sealed_copy_cleanup_failed",
        )
        self.assertIn(
            "gmp_sealed_fd_close_failed",
            sealed_error.exception.cleanup_codes,
        )
        self.assertTrue(runtime._CONTEXT_POISONED)

    def test_proc_maps_fd_cleanup_failure_is_typed_and_poison(self) -> None:
        with ExitStack() as stack:
            stack.enter_context(
                mock.patch.object(runtime.os, "O_CLOEXEC", 1, create=True)
            )
            stack.enter_context(mock.patch.object(runtime.os, "open", return_value=72))
            stack.enter_context(mock.patch.object(runtime.os, "read", return_value=b""))
            stack.enter_context(
                mock.patch.object(runtime.os, "close", side_effect=OSError(5, "close"))
            )
            with self.assertRaises(runtime.RuntimeConformanceError) as caught:
                runtime._map_entries()
        self.assertEqual(caught.exception.code, "runtime_loader_maps_cleanup_failed")
        self.assertIn(
            "runtime_loader_maps_fd_close_failed",
            caught.exception.cleanup_codes,
        )
        self.assertTrue(runtime._CONTEXT_POISONED)

    def test_source_identity_rejects_symlink_hardlink_and_stat_drift(self) -> None:
        base = _file_identity(inode=1, size_bytes=8, link_count=1)
        with self.assertRaises(runtime.RuntimeConformanceError) as symlink:
            runtime._validate_source_identity(
                "gmp", base, base, symlink_observed=True
            )
        self.assertEqual(symlink.exception.code, "runtime_library_symlink_forbidden")
        hardlinked = replace(base, link_count=2)
        with self.assertRaises(runtime.RuntimeConformanceError) as hardlink:
            runtime._validate_source_identity(
                "gmp", hardlinked, hardlinked, symlink_observed=False
            )
        self.assertEqual(
            hardlink.exception.code, "runtime_library_single_link_required"
        )
        with self.assertRaises(runtime.RuntimeConformanceError) as drift:
            runtime._validate_source_identity(
                "gmp", base, replace(base, mtime_ns=999), symlink_observed=False
            )
        self.assertEqual(drift.exception.code, "runtime_library_stat_drift")

    def test_loaded_identity_or_seal_mismatch_is_rejected(self) -> None:
        api = _FakeApi()
        loaded = list(_evidence(api).loaded_libraries)
        loaded[0] = replace(loaded[0], maps_device_inode_exact=False)
        for mutation, expected in (
            (tuple(loaded), "runtime_loaded_binding_inventory_invalid"),
            (
                (
                    replace(
                        _evidence(api).loaded_libraries[0], seals_exact=False
                    ),
                    _evidence(api).loaded_libraries[1],
                ),
                "runtime_loaded_binding_inventory_invalid",
            ),
        ):
            with self.subTest(expected=expected):
                session = _FakeSession(_evidence(api, loaded_libraries=mutation))
                with self.assertRaises(runtime.RuntimeConformanceError) as caught:
                    runtime._test_only_observe_with_provider(
                        _request(),
                        _FakeProvider(session),
                        runtime._TEST_ONLY_MARKER,
                    )
                self.assertEqual(caught.exception.code, expected)

    def test_every_required_gmp_dependency_symbol_is_cross_resolved(self) -> None:
        events: list[str] = []
        sealed = _ProviderSealed("gmp", "a" * 64, 201, events)
        loader = _ProviderLoader(events)
        gmp_addresses = {name: 9_001 for name in runtime.REQUIRED_GMP_SYMBOLS}
        with mock.patch.object(
            runtime,
            "_map_for_address",
            return_value=(
                sealed.identity.device,
                sealed.identity.inode,
                sealed.maps_path,
            ),
        ):
            runtime._verify_mpfr_required_gmp_dependency_inventory(
                loader,
                302,
                sealed,
                gmp_addresses,
            )
        self.assertEqual(
            tuple(name for _handle, name, _component in loader.symbol_calls),
            runtime.REQUIRED_GMP_SYMBOLS,
        )

        last = runtime.REQUIRED_GMP_SYMBOLS[-1]
        original_symbol = loader.symbol

        def mismatched(handle: int, name: str, component: str) -> int:
            if name == last and component == "mpfr_required_gmp_dependency":
                return 9_999
            return original_symbol(handle, name, component)

        loader.symbol = mismatched
        with mock.patch.object(
            runtime,
            "_map_for_address",
            return_value=(
                sealed.identity.device,
                sealed.identity.inode,
                sealed.maps_path,
            ),
        ):
            with self.assertRaises(runtime.RuntimeConformanceError) as caught:
                runtime._verify_mpfr_required_gmp_dependency_inventory(
                    loader,
                    302,
                    sealed,
                    gmp_addresses,
                )
        self.assertEqual(
            caught.exception.code,
            "runtime_loader_mpfr_gmp_dependency_identity_mismatch",
        )
        self.assertEqual(caught.exception.detail, last)

    def test_source_hash_drift_is_rejected_before_canary(self) -> None:
        api = _FakeApi()
        sources = list(_evidence(api).source_libraries)
        sources[1] = replace(sources[1], sha256_after_load="c" * 64)
        session = _FakeSession(_evidence(api, source_libraries=tuple(sources)))
        with self.assertRaises(runtime.RuntimeConformanceError) as caught:
            runtime._test_only_observe_with_provider(
                _request(), _FakeProvider(session), runtime._TEST_ONLY_MARKER
            )
        self.assertEqual(
            caught.exception.code,
            "runtime_source_binding_inventory_invalid",
        )
        self.assertEqual((api.emin, api.emax, api.rounding, api.flags_value), api.saved)

    def test_missing_symbol_version_abi_and_dependency_fail_closed(self) -> None:
        cases = (
            (
                {"resolved_mpfr_symbols": runtime.REQUIRED_MPFR_SYMBOLS[:-1]},
                "runtime_mpfr_symbol_inventory_mismatch",
            ),
            (
                {"resolved_gmp_symbols": runtime.REQUIRED_GMP_SYMBOLS[:-1]},
                "runtime_gmp_symbol_inventory_mismatch",
            ),
            ({"mpfr_version": "4.2.1"}, "runtime_mpfr_version_mismatch"),
            ({"gmp_version": "6.2.1"}, "runtime_gmp_version_mismatch"),
            ({"abi": _abi(exact=False)}, "runtime_native_abi_mismatch"),
            (
                {"required_gmp_dependency_inventory_exact": False},
                "runtime_loader_mpfr_gmp_dependency_identity_mismatch",
            ),
        )
        for overrides, code in cases:
            with self.subTest(code=code):
                api = _FakeApi()
                session = _FakeSession(_evidence(api, **overrides))
                with self.assertRaises(runtime.RuntimeConformanceError) as caught:
                    runtime._test_only_observe_with_provider(
                        _request(),
                        _FakeProvider(session),
                        runtime._TEST_ONLY_MARKER,
                    )
                self.assertEqual(caught.exception.code, code)
                self.assertEqual(session.closed, 1)

    def test_snapshot_and_configuration_failures_do_not_leak_context(self) -> None:
        snapshot_api = _FakeApi()
        snapshot_api.fail_snapshot = True
        session = _FakeSession(_evidence(snapshot_api))
        with self.assertRaises(runtime.RuntimeConformanceError) as snapshot:
            runtime._test_only_observe_with_provider(
                _request(), _FakeProvider(session), runtime._TEST_ONLY_MARKER
            )
        self.assertEqual(snapshot.exception.code, "runtime_context_snapshot_failed")
        self.assertEqual(session.closed, 1)

        configure_api = _FakeApi()
        configure_api.fail_configure_emin = True
        session = _FakeSession(_evidence(configure_api))
        with self.assertRaises(runtime.RuntimeConformanceError) as configure:
            runtime._test_only_observe_with_provider(
                _request(), _FakeProvider(session), runtime._TEST_ONLY_MARKER
            )
        self.assertEqual(configure.exception.code, "runtime_context_set_emin_failed")
        self.assertEqual(
            (
                configure_api.emin,
                configure_api.emax,
                configure_api.rounding,
                configure_api.flags_value,
            ),
            configure_api.saved,
        )

    def test_canary_failure_restores_context_and_returns_no_receipt(self) -> None:
        api = _FakeApi()
        api.fail_canary = runtime.RuntimeConformanceError("canary_injected")
        session = _FakeSession(_evidence(api))
        with self.assertRaises(runtime.RuntimeConformanceError) as caught:
            runtime._test_only_observe_with_provider(
                _request(), _FakeProvider(session), runtime._TEST_ONLY_MARKER
            )
        self.assertEqual(caught.exception.code, "canary_injected")
        self.assertEqual((api.emin, api.emax, api.rounding, api.flags_value), api.saved)
        self.assertEqual(session.closed, 1)
        self.assertFalse(runtime._CONTEXT_POISONED)

    def test_non_canary_observation_returns_no_receipt(self) -> None:
        api = _FakeApi()
        api.run_canary = lambda: None
        session = _FakeSession(_evidence(api))
        with self.assertRaises(runtime.RuntimeConformanceError) as caught:
            runtime._test_only_observe_with_provider(
                _request(), _FakeProvider(session), runtime._TEST_ONLY_MARKER
            )
        self.assertEqual(
            caught.exception.code,
            "runtime_canary_observation_type_invalid",
        )
        self.assertEqual((api.emin, api.emax, api.rounding, api.flags_value), api.saved)
        self.assertEqual(session.closed, 1)

    def test_canary_cleanup_failure_poisoning_is_sticky(self) -> None:
        api = _FakeApi()
        api.fail_canary = runtime.RuntimeConformanceError(
            "runtime_canary_cleanup_failed", cleanup_codes=("mpfr_clear_failed",)
        )
        session = _FakeSession(_evidence(api))
        with self.assertRaises(runtime.RuntimeConformanceError) as caught:
            runtime._test_only_observe_with_provider(
                _request(), _FakeProvider(session), runtime._TEST_ONLY_MARKER
            )
        self.assertEqual(caught.exception.code, "runtime_canary_cleanup_failed")
        self.assertTrue(runtime._CONTEXT_POISONED)
        next_provider = _FakeProvider(_FakeSession(_evidence(_FakeApi())))
        with self.assertRaises(runtime.RuntimeConformanceError) as poisoned:
            runtime._test_only_observe_with_provider(
                _request(), next_provider, runtime._TEST_ONLY_MARKER
            )
        self.assertEqual(poisoned.exception.code, "runtime_context_poisoned")
        self.assertEqual(next_provider.open_calls, 0)

    def test_recovered_restore_failure_rejects_run_without_poisoning(self) -> None:
        api = _FakeApi()
        api.restore_emax_failures = 1
        session = _FakeSession(_evidence(api))
        with self.assertRaises(runtime.RuntimeConformanceError) as caught:
            runtime._test_only_observe_with_provider(
                _request(), _FakeProvider(session), runtime._TEST_ONLY_MARKER
            )
        self.assertEqual(
            caught.exception.code,
            "runtime_context_restore_recovered_after_failure",
        )
        self.assertEqual((api.emin, api.emax, api.rounding, api.flags_value), api.saved)
        self.assertFalse(runtime._CONTEXT_POISONED)

    def test_persistent_range_restore_failure_poisoning_supersedes_canary(self) -> None:
        api = _FakeApi()
        api.restore_emax_failures = 2
        api.fail_canary = runtime.RuntimeConformanceError("canary_injected")
        session = _FakeSession(_evidence(api))
        with self.assertRaises(runtime.RuntimeConformanceError) as caught:
            runtime._test_only_observe_with_provider(
                _request(), _FakeProvider(session), runtime._TEST_ONLY_MARKER
            )
        self.assertEqual(caught.exception.code, "runtime_context_restore_failed")
        self.assertIn("range_unverified", caught.exception.cleanup_codes)
        self.assertTrue(runtime._CONTEXT_POISONED)

    def test_persistent_flag_restore_failure_poisoning(self) -> None:
        api = _FakeApi()
        api.restore_flags_noop = True
        session = _FakeSession(_evidence(api))
        with self.assertRaises(runtime.RuntimeConformanceError) as caught:
            runtime._test_only_observe_with_provider(
                _request(), _FakeProvider(session), runtime._TEST_ONLY_MARKER
            )
        self.assertEqual(caught.exception.code, "runtime_context_restore_failed")
        self.assertIn("flags_unverified", caught.exception.cleanup_codes)
        self.assertTrue(runtime._CONTEXT_POISONED)

    def test_session_cleanup_failure_poisoning_supersedes_primary(self) -> None:
        api = _FakeApi()
        api.fail_canary = runtime.RuntimeConformanceError("canary_injected")
        session = _FakeSession(
            _evidence(api), cleanup_codes=("mpfr_dlclose_status_failed",)
        )
        with self.assertRaises(runtime.RuntimeConformanceError) as caught:
            runtime._test_only_observe_with_provider(
                _request(), _FakeProvider(session), runtime._TEST_ONLY_MARKER
            )
        self.assertEqual(caught.exception.code, "runtime_session_cleanup_failed")
        self.assertEqual(caught.exception.detail, "canary_injected")
        self.assertTrue(runtime._CONTEXT_POISONED)

    def test_exclusive_lease_is_nonblocking_and_nonreentrant(self) -> None:
        acquired = runtime._RUNTIME_LOCK.acquire(blocking=False)
        self.assertTrue(acquired)
        try:
            provider = _FakeProvider(_FakeSession(_evidence(_FakeApi())))
            with self.assertRaises(runtime.RuntimeConformanceError) as caught:
                runtime._test_only_observe_with_provider(
                    _request(), provider, runtime._TEST_ONLY_MARKER
                )
            self.assertEqual(
                caught.exception.code,
                "exclusive_mpfr_context_lease_unavailable",
            )
            self.assertEqual(provider.open_calls, 0)
        finally:
            runtime._RUNTIME_LOCK.release()

    def test_provider_open_failure_does_not_mint_or_poison(self) -> None:
        provider = _FakeProvider()
        provider.error = runtime.RuntimeConformanceError(
            "runtime_library_symlink_forbidden"
        )
        with self.assertRaises(runtime.RuntimeConformanceError) as caught:
            runtime._test_only_observe_with_provider(
                _request(), provider, runtime._TEST_ONLY_MARKER
            )
        self.assertEqual(caught.exception.code, "runtime_library_symlink_forbidden")
        self.assertFalse(runtime._CONTEXT_POISONED)

    def test_linux_provider_loads_gmp_then_mpfr_in_same_namespace(self) -> None:
        request = _request()
        events: list[str] = []
        gmp_source = _ProviderSource(
            request.gmp,
            _file_identity(inode=101, size_bytes=1, link_count=1),
            events,
        )
        mpfr_source = _ProviderSource(
            request.mpfr,
            _file_identity(inode=102, size_bytes=1, link_count=1),
            events,
        )
        gmp_sealed = _ProviderSealed("gmp", "a" * 64, 201, events)
        mpfr_sealed = _ProviderSealed("mpfr", "b" * 64, 202, events)
        loader = _ProviderLoader(events)
        gmp_addresses = {name: 9_001 for name in runtime.REQUIRED_GMP_SYMBOLS}
        mpfr_addresses = {name: 9_002 for name in runtime.REQUIRED_MPFR_SYMBOLS}
        native_api = _ProviderNativeApi(mpfr_addresses, gmp_addresses)
        with ExitStack() as stack:
            stack.enter_context(
                mock.patch.object(
                    runtime,
                    "_open_source",
                    side_effect=[gmp_source, mpfr_source],
                )
            )
            stack.enter_context(
                mock.patch.object(
                    runtime,
                    "_copy_and_seal",
                    side_effect=[gmp_sealed, mpfr_sealed],
                )
            )
            stack.enter_context(
                mock.patch.object(runtime, "_DynamicLoader", return_value=loader)
            )
            loaded = stack.enter_context(
                mock.patch.object(
                    runtime,
                    "_loaded_binding",
                    side_effect=[
                        (_loaded_binding("gmp", "a" * 64, 201, 201), 7_001),
                        (_loaded_binding("mpfr", "b" * 64, 202, 202), 7_002),
                    ],
                )
            )
            owners = stack.enter_context(
                mock.patch.object(
                    runtime,
                    "_verify_every_symbol_owner",
                    side_effect=[gmp_addresses, mpfr_addresses],
                )
            )
            stack.enter_context(
                mock.patch.object(
                    runtime, "_NativeMpfrApi", return_value=native_api
                )
            )
            stack.enter_context(
                mock.patch.object(runtime, "_observe_native_abi", return_value=_abi())
            )
            stack.enter_context(
                mock.patch.object(
                    runtime,
                    "_map_for_address",
                    return_value=(
                        gmp_sealed.identity.device,
                        gmp_sealed.identity.inode,
                        gmp_sealed.maps_path,
                    ),
                )
            )
            stack.enter_context(
                mock.patch.object(runtime.os, "fstat", side_effect=lambda fd: {
                    101: gmp_source.identity,
                    102: mpfr_source.identity,
                }[fd])
            )
            stack.enter_context(
                mock.patch.object(runtime, "_identity", side_effect=lambda value: value)
            )
            stack.enter_context(
                mock.patch.object(
                    runtime,
                    "_hash_fd",
                    side_effect=lambda _fd, _size, component: (
                        "a" * 64 if component == "gmp" else "b" * 64
                    ),
                )
            )
            session_factory = stack.enter_context(
                mock.patch.object(
                    runtime,
                    "_NativeProviderSession",
                    side_effect=_CapturedNativeSession,
                )
            )
            session = runtime._LinuxNativeProvider().open_runtime(request)
        self.assertIsInstance(session, _CapturedNativeSession)
        self.assertEqual(events, ["open_gmp_-1", "open_mpfr_47"])
        self.assertEqual(loaded.call_count, 2)
        self.assertEqual(
            owners.call_args_list[0].args[3], runtime.REQUIRED_GMP_SYMBOLS
        )
        self.assertEqual(
            owners.call_args_list[1].args[3], runtime.REQUIRED_MPFR_SYMBOLS
        )
        self.assertEqual(session.evidence.namespace_id, 47)
        self.assertTrue(session.evidence.required_gmp_dependency_inventory_exact)
        self.assertEqual(
            tuple(
                name
                for handle, name, component in loader.symbol_calls
                if handle == 302
                and component == "mpfr_required_gmp_dependency"
            ),
            runtime.REQUIRED_GMP_SYMBOLS,
        )
        self.assertEqual(
            session.evidence.resolved_gmp_symbols,
            runtime.REQUIRED_GMP_SYMBOLS,
        )
        self.assertEqual(
            session.evidence.resolved_mpfr_symbols, runtime.REQUIRED_MPFR_SYMBOLS
        )
        self.assertEqual(session_factory.call_count, 1)

    def test_linux_provider_failure_stages_cleanup_reverse_and_scan_maps(self) -> None:
        stages = (
            "after_gmp_load",
            "after_gmp_symbols",
            "after_mpfr_load",
            "after_mpfr_symbols",
            "after_version",
            "after_postload_hash",
        )
        for stage in stages:
            with self.subTest(stage=stage):
                request = _request()
                events: list[str] = []
                gmp_source = _ProviderSource(
                    request.gmp,
                    _file_identity(inode=101, size_bytes=1, link_count=1),
                    events,
                )
                mpfr_source = _ProviderSource(
                    request.mpfr,
                    _file_identity(inode=102, size_bytes=1, link_count=1),
                    events,
                )
                gmp_sealed = _ProviderSealed("gmp", "a" * 64, 201, events)
                mpfr_sealed = _ProviderSealed("mpfr", "b" * 64, 202, events)
                loader = _ProviderLoader(events)
                gmp_addresses = {
                    name: 9_001 for name in runtime.REQUIRED_GMP_SYMBOLS
                }
                mpfr_addresses = {
                    name: 9_002 for name in runtime.REQUIRED_MPFR_SYMBOLS
                }
                native_api = _ProviderNativeApi(mpfr_addresses, gmp_addresses)
                if stage == "after_version":
                    native_api.mpfr_value = "4.2.1"
                gmp_loaded = (
                    _loaded_binding("gmp", "a" * 64, 201, 201),
                    7_001,
                )
                mpfr_loaded = (
                    _loaded_binding("mpfr", "b" * 64, 202, 202),
                    7_002,
                )
                injected = runtime.RuntimeConformanceError(f"injected_{stage}")
                if stage == "after_gmp_load":
                    loaded_effect = [injected]
                    owner_effect = [gmp_addresses, mpfr_addresses]
                elif stage == "after_mpfr_load":
                    loaded_effect = [gmp_loaded, injected]
                    owner_effect = [gmp_addresses, mpfr_addresses]
                else:
                    loaded_effect = [gmp_loaded, mpfr_loaded]
                    owner_effect = [gmp_addresses, mpfr_addresses]
                if stage == "after_gmp_symbols":
                    owner_effect = [injected]
                elif stage == "after_mpfr_symbols":
                    owner_effect = [gmp_addresses, injected]

                def map_absent(identity) -> bool:
                    component = "gmp" if identity.inode == 201 else "mpfr"
                    events.append(f"scan_map_{component}")
                    return False

                with ExitStack() as stack:
                    stack.enter_context(
                        mock.patch.object(
                            runtime,
                            "_open_source",
                            side_effect=[gmp_source, mpfr_source],
                        )
                    )
                    stack.enter_context(
                        mock.patch.object(
                            runtime,
                            "_copy_and_seal",
                            side_effect=[gmp_sealed, mpfr_sealed],
                        )
                    )
                    stack.enter_context(
                        mock.patch.object(
                            runtime, "_DynamicLoader", return_value=loader
                        )
                    )
                    stack.enter_context(
                        mock.patch.object(
                            runtime, "_loaded_binding", side_effect=loaded_effect
                        )
                    )
                    stack.enter_context(
                        mock.patch.object(
                            runtime,
                            "_verify_every_symbol_owner",
                            side_effect=owner_effect,
                        )
                    )
                    stack.enter_context(
                        mock.patch.object(
                            runtime, "_NativeMpfrApi", return_value=native_api
                        )
                    )
                    stack.enter_context(
                        mock.patch.object(
                            runtime, "_observe_native_abi", return_value=_abi()
                        )
                    )
                    stack.enter_context(
                        mock.patch.object(
                            runtime,
                            "_map_for_address",
                            return_value=(
                                gmp_sealed.identity.device,
                                gmp_sealed.identity.inode,
                                gmp_sealed.maps_path,
                            ),
                        )
                    )
                    stack.enter_context(
                        mock.patch.object(
                            runtime.os,
                            "fstat",
                            side_effect=lambda fd: {
                                101: gmp_source.identity,
                                102: mpfr_source.identity,
                            }[fd],
                        )
                    )
                    stack.enter_context(
                        mock.patch.object(
                            runtime, "_identity", side_effect=lambda value: value
                        )
                    )

                    def hash_result(_fd, _size, component):
                        if stage == "after_postload_hash" and component == "mpfr":
                            return "c" * 64
                        return "a" * 64 if component == "gmp" else "b" * 64

                    stack.enter_context(
                        mock.patch.object(
                            runtime, "_hash_fd", side_effect=hash_result
                        )
                    )
                    stack.enter_context(
                        mock.patch.object(
                            runtime,
                            "_mapped_identity_present",
                            side_effect=map_absent,
                        )
                    )
                    with self.assertRaises(runtime.RuntimeConformanceError) as caught:
                        runtime._LinuxNativeProvider().open_runtime(request)
                expected_code = {
                    "after_version": "runtime_mpfr_version_mismatch",
                    "after_postload_hash": "runtime_library_postload_hash_mismatch",
                }.get(stage, f"injected_{stage}")
                self.assertEqual(caught.exception.code, expected_code)
                handles = 1 if stage in {"after_gmp_load", "after_gmp_symbols"} else 2
                expected_prefix = (
                    ["open_gmp_-1"]
                    if handles == 1
                    else ["open_gmp_-1", "open_mpfr_47"]
                )
                expected_cleanup = (
                    (["dlclose_mpfr"] if handles == 2 else [])
                    + ["dlclose_gmp"]
                    + ["scan_map_gmp", "scan_map_mpfr"]
                    + [
                        "close_sealed_mpfr",
                        "close_sealed_gmp",
                        "close_source_mpfr",
                        "close_source_gmp",
                    ]
                )
                self.assertEqual(events, expected_prefix + expected_cleanup)
                self.assertFalse(runtime._CONTEXT_POISONED)

    def test_native_session_scrubs_runtime_api_after_clean_close(self) -> None:
        request = _request()
        events: list[str] = []
        gmp_source = _ProviderSource(
            request.gmp,
            _file_identity(inode=101, size_bytes=1, link_count=1),
            events,
        )
        mpfr_source = _ProviderSource(
            request.mpfr,
            _file_identity(inode=102, size_bytes=1, link_count=1),
            events,
        )
        gmp_sealed = _ProviderSealed("gmp", "a" * 64, 201, events)
        mpfr_sealed = _ProviderSealed("mpfr", "b" * 64, 202, events)
        api = _FakeApi()
        evidence = _evidence(
            api,
            provider_kind="linux_x86_64_sealed_memfd_dlmopen_diagnostic/v1",
            native_provider_mechanics_observed=True,
        )
        session = runtime._NativeProviderSession(
            evidence,
            _ProviderLoader(events),
            302,
            301,
            (gmp_source, mpfr_source),
            (gmp_sealed, mpfr_sealed),
        )
        identities = {
            gmp_source.fd: gmp_source.identity,
            mpfr_source.fd: mpfr_source.identity,
            gmp_sealed.fd: gmp_sealed.identity,
            mpfr_sealed.fd: mpfr_sealed.identity,
        }
        digests = {
            "gmp": "a" * 64,
            "mpfr": "b" * 64,
            "gmp_sealed": "a" * 64,
            "mpfr_sealed": "b" * 64,
        }
        fcntl_module = type(
            "FcntlStub",
            (),
            {
                "F_GET_SEALS": 1,
                "fcntl": staticmethod(lambda _fd, _command: 15),
            },
        )()
        with ExitStack() as stack:
            stack.enter_context(
                mock.patch.object(
                    runtime.os,
                    "fstat",
                    side_effect=lambda fd: identities[fd],
                )
            )
            stack.enter_context(
                mock.patch.object(
                    runtime, "_identity", side_effect=lambda value: value
                )
            )
            stack.enter_context(
                mock.patch.object(
                    runtime,
                    "_hash_fd",
                    side_effect=lambda _fd, _size, component: digests[component],
                )
            )
            stack.enter_context(
                mock.patch.object(
                    runtime.importlib,
                    "import_module",
                    return_value=fcntl_module,
                )
            )
            stack.enter_context(
                mock.patch.object(
                    runtime,
                    "_mapped_identity_present",
                    return_value=False,
                )
            )
            self.assertEqual(session.close(), ())
        self.assertIsNone(session.evidence.api)
        self.assertIsNot(session.evidence, evidence)

    def test_canary_cleanup_plus_recovered_restore_still_poisons(self) -> None:
        api = _FakeApi()
        api.fail_canary = runtime.RuntimeConformanceError(
            "runtime_canary_cleanup_failed", cleanup_codes=("mpfr_clear_failed",)
        )
        api.restore_emax_failures = 1
        session = _FakeSession(_evidence(api))
        with self.assertRaises(runtime.RuntimeConformanceError) as caught:
            runtime._test_only_observe_with_provider(
                _request(), _FakeProvider(session), runtime._TEST_ONLY_MARKER
            )
        self.assertEqual(
            caught.exception.code,
            "runtime_context_restore_recovered_after_failure",
        )
        self.assertTrue(runtime._CONTEXT_POISONED)

    def test_free_cache_failure_restores_then_poisons(self) -> None:
        api = _FakeApi()

        def fail_free_cache() -> None:
            raise RuntimeError("cache")

        api.free_cache = fail_free_cache
        session = _FakeSession(_evidence(api))
        with self.assertRaises(runtime.RuntimeConformanceError) as caught:
            runtime._test_only_observe_with_provider(
                _request(), _FakeProvider(session), runtime._TEST_ONLY_MARKER
            )
        self.assertEqual(caught.exception.code, "runtime_mpfr_cache_cleanup_failed")
        self.assertEqual((api.emin, api.emax, api.rounding, api.flags_value), api.saved)
        self.assertTrue(runtime._CONTEXT_POISONED)

    def test_source_guards_enforce_direct_native_diagnostic_boundary(self) -> None:
        source = SOURCE_PATH.read_text(encoding="utf-8")
        tree = ast.parse(source)
        for forbidden in (
            "import gmpy2",
            "from gmpy2",
            "import numpy",
            "import subprocess",
            "os.system",
            "WeakSet",
            "WeakKeyDictionary",
            "candidate_id",
            "output_root",
            "execution_command",
        ):
            self.assertNotIn(forbidden, source)
        self.assertIn("os.memfd_create", source)
        self.assertIn("F_SEAL_WRITE", source)
        self.assertIn("F_SEAL_GROW", source)
        self.assertIn("F_SEAL_SHRINK", source)
        self.assertIn("F_SEAL_SEAL", source)
        self.assertIn("dlmopen", source)
        self.assertIn("dlinfo", source)
        self.assertIn("dladdr", source)
        self.assertIn("/proc/self/maps", source)
        self.assertIn("source_inode_loaded_directly=False", source)
        self.assertNotIn("def _test_only_reset_poison", source)
        self.assertIn('"mpfr_cmp_z"', source)
        self.assertIn('"trusted_runtime_manifest_not_installed"', source)
        self.assertIn("_TRUSTED_RUNTIME_MANIFEST_LITERAL", source)
        self.assertRegex(
            source,
            r"_TRUSTED_RUNTIME_MANIFEST_LITERAL: Final\[[\s\S]*?\] = None",
        )
        self.assertNotIn("class RuntimeConformanceRequest", source)
        self.assertNotIn("class RuntimeLibraryExpectation", source)
        self.assertNotIn("class RuntimeConformanceReceipt", source)
        self.assertNotIn("RuntimeConformanceRequest", runtime.__all__)
        self.assertNotIn("RuntimeLibraryExpectation", runtime.__all__)
        self.assertNotIn("RuntimeConformanceReceipt", runtime.__all__)
        self.assertNotIn("_RuntimeLeaseReceipt", runtime.__all__)
        self.assertNotIn("_Mpfr256RuntimeLease", runtime.__all__)
        self.assertEqual(
            runtime._Mpfr256RuntimeLease.__slots__, ("__weakref__",)
        )
        self.assertEqual(runtime._OwnedMpfr256.__slots__, ("__weakref__",))
        self.assertEqual(runtime._OwnedMpz.__slots__, ("__weakref__",))
        self.assertEqual(
            runtime.CONTRACT_VERSION,
            "nhm2_spherical_boson_star_v2_mpfr256_runtime_conformance/v2",
        )
        expected_operations = (
            "allocate_mpfr256",
            "allocate_mpz",
            "mpz_set_ui",
            "mpz_set_si",
            "mpz_set_decimal",
            "mpz_decimal",
            "mpfr_set_ui",
            "mpfr_set_si",
            "mpfr_set_decimal",
            "mpfr_set_z",
            "mpfr_set",
            "mpfr_mul_2si",
            "mpfr_add",
            "mpfr_sub",
            "mpfr_mul",
            "mpfr_div",
            "mpfr_sqrt",
            "mpfr_const_pi",
            "mpfr_compare",
            "mpfr_compare_ui",
            "mpfr_compare_z",
            "mpfr_equal",
            "mpfr_get_z_2exp",
            "mpfr_get_d",
            "mpfr_number",
            "mpfr_precision",
        )
        self.assertEqual(runtime.SI_LEASE_OPERATION_INVENTORY, expected_operations)
        self.assertEqual(
            tuple(
                inspect.signature(runtime._Mpfr256RuntimeLease.mpfr_number)
                .parameters
            ),
            ("self", "source"),
        )
        self.assertEqual(
            tuple(
                inspect.signature(runtime._Mpfr256RuntimeLease.mpfr_precision)
                .parameters
            ),
            ("self", "source"),
        )
        self.assertEqual(
            tuple(
                inspect.signature(
                    runtime._Mpfr256RuntimeLease.validated_receipt_snapshot
                ).parameters
            ),
            ("self",),
        )
        for operation in expected_operations:
            method = getattr(runtime._Mpfr256RuntimeLease, operation)
            parameters = tuple(inspect.signature(method).parameters)
            self.assertFalse(
                {"path", "sha256", "provider", "callback", "address"}
                & set(parameters),
                operation,
            )
        public = {
            node.name: node
            for node in tree.body
            if isinstance(node, ast.FunctionDef)
            and node.name
            in {
                "acquire_mpfr256_runtime_lease",
                "observe_mpfr256_runtime_conformance",
            }
        }
        self.assertEqual(
            set(public),
            {
                "acquire_mpfr256_runtime_lease",
                "observe_mpfr256_runtime_conformance",
            },
        )
        for node in public.values():
            self.assertEqual(tuple(argument.arg for argument in node.args.args), ())
            body = ast.unparse(node)
            self.assertNotIn("_open_source", body)
            self.assertNotIn("_copy_and_seal", body)
        acquire_body = ast.unparse(
            public["acquire_mpfr256_runtime_lease"]
        )
        self.assertIn("_TRUSTED_RUNTIME_MANIFEST_LITERAL", acquire_body)
        self.assertLess(
            acquire_body.index("trusted_runtime_manifest_not_installed"),
            acquire_body.index("_LinuxNativeProvider"),
        )
        observe_body = ast.unparse(
            public["observe_mpfr256_runtime_conformance"]
        )
        self.assertNotIn("_require_request", observe_body)
        self.assertNotIn("_LinuxNativeProvider", observe_body)

    def test_source_and_spec_are_utf8_lf_without_tabs_or_trailing_space(self) -> None:
        for path in (SOURCE_PATH, Path(__file__).resolve()):
            raw = path.read_bytes()
            self.assertNotIn(b"\r", raw, path.name)
            self.assertNotIn(b"\t", raw, path.name)
            text = raw.decode("utf-8", "strict")
            self.assertTrue(text.endswith("\n"), path.name)
            self.assertTrue(
                all(line == line.rstrip(" ") for line in text.splitlines()),
                path.name,
            )
            ast.parse(text)


if __name__ == "__main__":
    unittest.main()
