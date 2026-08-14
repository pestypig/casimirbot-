from __future__ import annotations

import ast
import ctypes
import itertools
from pathlib import Path
import platform
import runpy
import sys
import threading
import unittest
from unittest.mock import patch


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import binary64_environment as environment  # noqa: E402
from binary64_environment import (  # noqa: E402
    AUTHORITY_LOCKS,
    Binary64EnvironmentError,
    LINUX_GLIBC_X86_64_FENV_SIZE_BYTES,
    LINUX_MXCSR_CONTROL_MASK,
    LINUX_MXCSR_REQUIRED_CONTROL,
    LINUX_X87_CONTROL_MASK,
    LINUX_X87_REQUIRED_CONTROL,
    WINDOWS_CONTROLFP_MASK,
    WINDOWS_REQUIRED_CONTROLFP,
    WINDOWS_REQUIRED_FENV_CONTROL,
    WINDOWS_REQUIRED_FENV_STATUS,
    WINDOWS_UCRT_FENV_SIZE_BYTES,
    nearest_binary64_environment,
    observed_binary64_environment,
)


def _install_native_hostile(control: int, status: int = 0) -> None:
    if sys.platform == "win32":
        native = ctypes.CDLL("ucrtbase")
        function = native._controlfp_s
        function.argtypes = [
            ctypes.POINTER(ctypes.c_uint),
            ctypes.c_uint,
            ctypes.c_uint,
        ]
        function.restype = ctypes.c_int
        observed = ctypes.c_uint()
        if function(
            ctypes.byref(observed),
            control,
            WINDOWS_CONTROLFP_MASK,
        ) != 0:
            raise RuntimeError("test_windows_controlfp_write_failed")
        return

    snapshot = environment._capture_native_environment()
    snapshot.x87_control = (
        int(snapshot.x87_control) & ~LINUX_X87_CONTROL_MASK
    ) | (control & LINUX_X87_CONTROL_MASK)
    snapshot.x87_status = (
        int(snapshot.x87_status) & ~0x003F
    ) | (status & 0x003F)
    snapshot.mxcsr = (
        int(snapshot.mxcsr) & ~(LINUX_MXCSR_CONTROL_MASK | 0x003F)
    ) | (control & LINUX_MXCSR_CONTROL_MASK) | (status & 0x003F)
    environment._restore_native_environment(snapshot)


class Binary64EnvironmentTests(unittest.TestCase):
    def test_literal_abi_controls_close_masks_rounding_and_gradual_underflow(self) -> None:
        self.assertEqual(ctypes.sizeof(environment._WindowsUcrtFenv), 8)
        self.assertEqual(WINDOWS_UCRT_FENV_SIZE_BYTES, 8)
        self.assertEqual(
            (WINDOWS_REQUIRED_FENV_CONTROL, WINDOWS_REQUIRED_FENV_STATUS),
            (0x3F00003F, 0),
        )
        self.assertEqual(
            WINDOWS_REQUIRED_CONTROLFP & WINDOWS_CONTROLFP_MASK,
            0x0008001F,
        )
        self.assertEqual(ctypes.sizeof(environment._LinuxGlibcX86_64Fenv), 32)
        self.assertEqual(LINUX_GLIBC_X86_64_FENV_SIZE_BYTES, 32)
        self.assertEqual(environment._LinuxGlibcX86_64Fenv.x87_control.offset, 0)
        self.assertEqual(environment._LinuxGlibcX86_64Fenv.x87_status.offset, 4)
        self.assertEqual(environment._LinuxGlibcX86_64Fenv.mxcsr.offset, 28)
        self.assertEqual(
            LINUX_X87_REQUIRED_CONTROL & LINUX_X87_CONTROL_MASK,
            0x033F,
        )
        self.assertEqual(
            LINUX_MXCSR_REQUIRED_CONTROL & LINUX_MXCSR_CONTROL_MASK,
            0x1F80,
        )
        self.assertEqual(
            LINUX_MXCSR_REQUIRED_CONTROL & ((1 << 6) | (1 << 15)),
            0,
        )
        self.assertEqual(LINUX_MXCSR_REQUIRED_CONTROL & (0x3F << 7), 0x3F << 7)
        self.assertTrue(all(value is False for value in AUTHORITY_LOCKS.values()))

    def test_native_hostile_controls_are_ignored_and_exactly_restored(self) -> None:
        original = environment._capture_native_environment()
        try:
            if sys.platform == "win32":
                rounding = (0x00000000, 0x00000100, 0x00000200, 0x00000300)
                denormals = (0x00000000, 0x01000000, 0x02000000, 0x03000000)
                masks = (0x0008001F, 0x00080017)
                controls = tuple(
                    round_mode | denormal_mode | exception_mask
                    for round_mode, denormal_mode, exception_mask in itertools.product(
                        rounding,
                        denormals,
                        masks,
                    )
                )
            else:
                controls = (
                    0x073F | 0x3F80 | (1 << 6) | (1 << 15),
                    0x0B3F | 0x5F80 | (1 << 6),
                    0x0F3F | 0x7F80 | (1 << 15),
                )

            for control in controls:
                with self.subTest(control=hex(control)):
                    _install_native_hostile(control)
                    hostile = observed_binary64_environment()
                    with nearest_binary64_environment():
                        established = environment._capture_native_environment()
                        if sys.platform == "win32":
                            self.assertEqual(
                                environment._windows_raw_projection(established),
                                (WINDOWS_REQUIRED_FENV_CONTROL, 0),
                            )
                            self.assertEqual(
                                environment._read_controlfp() & WINDOWS_CONTROLFP_MASK,
                                WINDOWS_REQUIRED_CONTROLFP,
                            )
                        else:
                            self.assertEqual(
                                int(established.x87_control) & LINUX_X87_CONTROL_MASK,
                                LINUX_X87_REQUIRED_CONTROL,
                            )
                            self.assertEqual(
                                int(established.mxcsr) & LINUX_MXCSR_CONTROL_MASK,
                                LINUX_MXCSR_REQUIRED_CONTROL,
                            )
                            self.assertEqual(int(established.x87_status) & 0x003F, 0)
                            self.assertEqual(int(established.mxcsr) & 0x003F, 0)
                        smallest = float.fromhex("0x0.0000000000001p-1022")
                        self.assertEqual(smallest * 1.0, smallest)
                    self.assertEqual(observed_binary64_environment(), hostile)
        finally:
            environment._restore_native_environment(original)

    def test_nested_exception_and_thread_boundaries_restore_their_callers(self) -> None:
        outer_before = observed_binary64_environment()
        with nearest_binary64_environment():
            required = observed_binary64_environment()
            with nearest_binary64_environment():
                self.assertEqual(observed_binary64_environment(), required)
            self.assertEqual(observed_binary64_environment(), required)
        self.assertEqual(observed_binary64_environment(), outer_before)

        original = environment._capture_native_environment()
        try:
            hostile_control = (
                0x03000300 | 0x0008001F
                if sys.platform == "win32"
                else 0x0F3F | 0x7F80 | (1 << 15)
            )
            _install_native_hostile(hostile_control)
            hostile = observed_binary64_environment()
            with self.assertRaisesRegex(LookupError, "synthetic_body_failure"):
                with nearest_binary64_environment():
                    raise LookupError("synthetic_body_failure")
            self.assertEqual(observed_binary64_environment(), hostile)

            worker: list[tuple[tuple[int, ...], tuple[int, ...]]] = []

            def run_worker() -> None:
                before = observed_binary64_environment()
                with nearest_binary64_environment():
                    self.assertTrue(environment._required_controls_are_established())
                worker.append((before, observed_binary64_environment()))

            thread = threading.Thread(target=run_worker)
            thread.start()
            thread.join(timeout=10)
            self.assertFalse(thread.is_alive())
            self.assertEqual(worker, [(worker[0][0], worker[0][0])])
            self.assertEqual(observed_binary64_environment(), hostile)
        finally:
            environment._restore_native_environment(original)

    def test_restore_failure_supersedes_setup_or_body_failure(self) -> None:
        snapshot = object()

        with (
            patch.object(environment, "_capture_native_environment", return_value=snapshot),
            patch.object(
                environment,
                "_establish_required_environment",
                side_effect=LookupError("setup"),
            ),
            patch.object(
                environment,
                "_restore_native_environment",
                side_effect=OSError("restore"),
            ),
        ):
            with self.assertRaises(Binary64EnvironmentError) as raised:
                with nearest_binary64_environment():
                    self.fail("setup failure must not enter body")
            self.assertEqual(
                raised.exception.code,
                "binary64_restore_failed_after_setup_failure",
            )

        with (
            patch.object(environment, "_capture_native_environment", return_value=snapshot),
            patch.object(environment, "_establish_required_environment"),
            patch.object(environment, "_required_controls_are_established", return_value=True),
            patch.object(
                environment,
                "_restore_native_environment",
                side_effect=OSError("restore"),
            ),
        ):
            with self.assertRaises(Binary64EnvironmentError) as raised:
                with nearest_binary64_environment():
                    raise LookupError("body")
            self.assertEqual(
                raised.exception.code,
                "binary64_restore_failed_after_body_failure",
            )

    def test_mocked_glibc_path_uses_default_fenv_and_defined_restore_projection(self) -> None:
        fields = tuple(name for name, *_ in environment._LinuxGlibcX86_64Fenv._fields_)
        state = {
            "x87_control": 0x0F3F,
            "reserved_0": 0x1234,
            "x87_status": 0x0021,
            "reserved_1": 0x5678,
            "x87_tag": 0xA5A5A5A5,
            "instruction_pointer": 0x11223344,
            "code_selector_opcode": 0x81234567,
            "data_pointer": 0x55667788,
            "data_selector_reserved": 0x76544321,
            "mxcsr": 0x0000FFFF,
        }
        original = dict(state)

        class FakeFunction:
            def __init__(self, implementation):
                self.implementation = implementation
                self.argtypes = None
                self.restype = None

            def __call__(self, *args):
                return self.implementation(*args)

        def get_environment(pointer) -> int:
            target = pointer._obj
            for field in fields:
                setattr(target, field, state[field])
            return 0

        default_pointer = ctypes.c_void_p(-1).value

        def set_environment(pointer) -> int:
            if isinstance(pointer, ctypes.c_void_p) and pointer.value == default_pointer:
                state["x87_control"] = (
                    state["x87_control"] & ~LINUX_X87_CONTROL_MASK
                ) | LINUX_X87_REQUIRED_CONTROL
                state["x87_status"] &= ~0x003F
                state["instruction_pointer"] = 0
                state["code_selector_opcode"] &= 0xF8000000
                state["data_pointer"] = 0
                state["data_selector_reserved"] &= 0xFFFF0000
                state["mxcsr"] = (
                    state["mxcsr"] & ~(LINUX_MXCSR_CONTROL_MASK | 0x003F)
                ) | LINUX_MXCSR_REQUIRED_CONTROL
                return 0
            source = pointer._obj
            state["x87_control"] = (
                state["x87_control"] & ~LINUX_X87_CONTROL_MASK
            ) | (source.x87_control & LINUX_X87_CONTROL_MASK)
            state["x87_status"] = (
                state["x87_status"] & ~0x003F
            ) | (source.x87_status & 0x003F)
            state["instruction_pointer"] = source.instruction_pointer
            state["code_selector_opcode"] = (
                state["code_selector_opcode"] & 0xF8000000
            ) | (source.code_selector_opcode & 0x07FFFFFF)
            state["data_pointer"] = source.data_pointer
            state["data_selector_reserved"] = (
                state["data_selector_reserved"] & 0xFFFF0000
            ) | (source.data_selector_reserved & 0x0000FFFF)
            state["mxcsr"] = source.mxcsr
            return 0

        fake = type("FakeGlibc", (), {})()
        fake.gnu_get_libc_version = FakeFunction(lambda: b"2.39")
        fake.fegetenv = FakeFunction(get_environment)
        fake.fesetenv = FakeFunction(set_environment)
        fake.fegetround = FakeFunction(lambda: state["x87_control"] & 0x0C00)

        with (
            patch.object(sys, "platform", "linux"),
            patch.object(platform, "machine", return_value="x86_64"),
            patch.object(ctypes, "CDLL", return_value=fake),
        ):
            namespace = runpy.run_path(
                str(HERE / "binary64_environment.py"),
                run_name="producer_binary64_environment_mocked_glibc",
            )

        self.assertEqual(namespace["OBSERVED_GLIBC_VERSION"], "2.39")
        with namespace["nearest_binary64_environment"]():
            self.assertEqual(
                state["x87_control"] & LINUX_X87_CONTROL_MASK,
                LINUX_X87_REQUIRED_CONTROL,
            )
            self.assertEqual(
                state["mxcsr"] & LINUX_MXCSR_CONTROL_MASK,
                LINUX_MXCSR_REQUIRED_CONTROL,
            )
            state["x87_status"] |= 0x0020
            state["mxcsr"] |= 0x0020
        self.assertEqual(state, original)

    def test_mocked_windows_path_uses_ucrt_full_fenv_and_raw_restore(self) -> None:
        state = {"control": 0xE0000F20, "status": 0x01000001}
        original = dict(state)

        class FakeFunction:
            def __init__(self, implementation):
                self.implementation = implementation
                self.argtypes = None
                self.restype = None

            def __call__(self, *args):
                return self.implementation(*args)

        def get_environment(pointer) -> int:
            pointer._obj.control = state["control"]
            pointer._obj.status = state["status"]
            return 0

        def set_environment(pointer) -> int:
            state["control"] = int(pointer._obj.control)
            state["status"] = int(pointer._obj.status)
            return 0

        def controlfp(pointer, _new, _mask) -> int:
            pointer._obj.value = (
                WINDOWS_REQUIRED_CONTROLFP
                if state["control"] == WINDOWS_REQUIRED_FENV_CONTROL
                else 0x03080300
            )
            return 0

        fake = type("FakeUcrt", (), {})()
        fake.fegetenv = FakeFunction(get_environment)
        fake.fesetenv = FakeFunction(set_environment)
        fake._controlfp_s = FakeFunction(controlfp)

        with (
            patch.object(sys, "platform", "win32"),
            patch.object(platform, "machine", return_value="AMD64"),
            patch.object(ctypes, "CDLL", return_value=fake),
        ):
            namespace = runpy.run_path(
                str(HERE / "binary64_environment.py"),
                run_name="producer_binary64_environment_mocked_windows",
            )

        self.assertEqual(
            namespace["BINARY64_RUNTIME_FAMILY"],
            "windows_amd64_ucrt_full_fenv",
        )
        with namespace["nearest_binary64_environment"]():
            self.assertEqual(
                state,
                {
                    "control": WINDOWS_REQUIRED_FENV_CONTROL,
                    "status": WINDOWS_REQUIRED_FENV_STATUS,
                },
            )
            state["status"] = 0x01000001
        self.assertEqual(state, original)

    def test_source_is_disjoint_and_platform_admission_is_fail_closed(self) -> None:
        source = (HERE / "binary64_environment.py").read_text(encoding="utf-8")
        tree = ast.parse(source)
        imported = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imported.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module is not None:
                imported.add(node.module.split(".")[0])
        self.assertFalse(
            imported
            & {
                "numpy",
                "scipy",
                "decimal",
                "tools",
                "radial_lobatto_grid",
                "binary64_environment_branch",
            }
        )
        self.assertNotIn("nhm2-spherical-boson-star-branch", source)
        self.assertIn('if sys.platform == "win32":', source)
        self.assertIn('elif sys.platform == "linux":', source)
        self.assertIn('ctypes.CDLL("ucrtbase")', source)
        self.assertIn("gnu_get_libc_version", source)
        self.assertIn("ctypes.c_void_p(-1)", source)


if __name__ == "__main__":
    unittest.main()
