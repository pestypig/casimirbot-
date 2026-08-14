from __future__ import annotations

import ctypes
import hashlib
import inspect
from pathlib import Path
import runpy
import struct
import sys
import unittest
from unittest.mock import patch


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import binary64_environment as environment  # noqa: E402
from binary64_environment import (  # noqa: E402
    Binary64EnvironmentError,
    LINUX_GLIBC_X86_64_FENV_SIZE_BYTES,
    LINUX_MXCSR_CONTROL_MASK,
    LINUX_MXCSR_REQUIRED_CONTROL,
    LINUX_X87_CONTROL_MASK,
    LINUX_X87_REQUIRED_CONTROL,
    WINDOWS_CONTROL_MASK,
    nearest_binary64_environment,
    observed_binary64_native_mode,
)
from deterministic_dense_lu import solve_deterministic_dense_lu  # noqa: E402
from deterministic_newton import _solve_newton_map  # noqa: E402
from radial_collocation_interior import RadialCollocationState  # noqa: E402
from radial_compactified_system import (  # noqa: E402
    evaluate_spherical_radial_compactified_system,
)
from radial_lobatto_grid import generate_compactified_lobatto_grid  # noqa: E402
from radial_origin_series import derive_spherical_radial_origin_series_x4  # noqa: E402
from radial_residual import RadialJet, evaluate_spherical_radial_residual  # noqa: E402
from radial_residual_jacobian import (  # noqa: E402
    evaluate_spherical_radial_residual_jacobian,
)
from radial_tail_asymptotics import derive_spherical_radial_leading_tail  # noqa: E402


def _native_setter():
    if sys.platform == "win32":
        function = ctypes.CDLL("msvcrt")._controlfp_s
        function.argtypes = [
            ctypes.POINTER(ctypes.c_uint),
            ctypes.c_uint,
            ctypes.c_uint,
        ]
        function.restype = ctypes.c_int

        def set_mode(mode: int) -> None:
            observed = ctypes.c_uint()
            if function(ctypes.byref(observed), mode, WINDOWS_CONTROL_MASK) != 0:
                raise RuntimeError("test_controlfp_write_failed")

        hostile = (
            0x00000100,
            0x00000200,
            0x00000300,
            0x01000000,
            0x02000000,
            0x03000000,
            0x01000300,
            0x02000200,
            0x03000100,
        )
        return set_mode, hostile
    libc = ctypes.CDLL(None)
    function = libc.fesetround
    function.argtypes = [ctypes.c_int]
    function.restype = ctypes.c_int

    def set_mode(mode: int) -> None:
        if function(mode) != 0:
            raise RuntimeError("test_fesetround_failed")

    # Frozen execution target is Linux x86_64: FE_DOWNWARD, FE_UPWARD,
    # FE_TOWARDZERO are 0x400, 0x800, and 0xc00 respectively.
    hostile = (0x00000400, 0x00000800, 0x00000C00)
    return set_mode, hostile


def _packed_sha256() -> str:
    grid_result = generate_compactified_lobatto_grid(8)
    grid = grid_result.differentiation
    lu = solve_deterministic_dense_lu(
        matrix=(
            (4.0, 1.0, 0.5, 0.25),
            (1.0, 5.0, 1.0, 0.5),
            (0.5, 1.0, 6.0, 1.0),
            (0.25, 0.5, 1.0, 7.0),
        ),
        rhs=(1.0, 2.0, 3.0, 4.0),
    )
    jets = (
        RadialJet(value=0.03125, dx=-0.015625, dxx=0.0078125),
        RadialJet(value=-0.015625, dx=0.0078125, dxx=-0.00390625),
        RadialJet(value=2.0**-10, dx=-2.0**-12, dxx=2.0**-14),
    )
    residual = evaluate_spherical_radial_residual(
        x=2.0,
        F0=jets[0],
        F1=jets[1],
        varphi=jets[2],
        w=0.875,
    )
    jacobian = evaluate_spherical_radial_residual_jacobian(
        x=2.0,
        F0=jets[0],
        F1=jets[1],
        varphi=jets[2],
        w=0.875,
    )
    state = RadialCollocationState(
        F0=(0.03125,) * 7 + (0.0,),
        F1=(-0.015625,) * 7 + (0.0,),
        varphi=(2.0**-10,) * 7 + (0.0,),
        w=0.875,
    )
    system = evaluate_spherical_radial_compactified_system(grid=grid, state=state)
    origin = derive_spherical_radial_origin_series_x4(
        F0_at_origin=0.03125,
        F1_at_origin=-0.015625,
        varphi_at_origin=2.0**-10,
        w=0.875,
    )
    tail = derive_spherical_radial_leading_tail(
        w=0.875,
        adm_mass_coefficient=0.125,
        scalar_principal_amplitude=2.0**-10,
    )

    def evaluator(values: tuple[float, ...]):
        return (values[0] * values[0] - 2.0,), ((2.0 * values[0],),)

    newton = _solve_newton_map(
        initial=(1.0,),
        evaluator=evaluator,
        domain=lambda values: len(values) == 1 and values[0] > 0.0,
    )
    numbers: list[float] = [*grid.rho]
    for matrix in (grid.first_rho, grid.second_rho):
        for row in matrix:
            numbers.extend(row)
    numbers.extend(lu.solution)
    numbers.extend(residual.solved)
    numbers.extend(residual.unused_constraints)
    for row in jacobian.rows:
        numbers.extend(row)
    numbers.extend(system.solved_residual)
    for row in system.jacobian:
        numbers.extend(row)
    numbers.extend(
        (
            origin.F0.x0,
            origin.F0.x2,
            origin.F0.x4,
            origin.F1.x0,
            origin.F1.x2,
            origin.F1.x4,
            origin.varphi.x0,
            origin.varphi.x2,
            origin.varphi.x4,
            tail.kappa,
            tail.F0_x_minus_1,
            tail.F1_x_minus_1,
            tail.F1_x_minus_2,
            tail.scalar_power_sigma,
            *newton.values,
            newton.residual_linf,
            newton.scaled_step_linf or 0.0,
        )
    )
    return hashlib.sha256(b"".join(struct.pack("<d", value) for value in numbers)).hexdigest()


class Binary64EnvironmentTests(unittest.TestCase):
    def test_every_radial_entry_ignores_and_restores_hostile_rounding(self) -> None:
        baseline = _packed_sha256()
        set_mode, hostile_modes = _native_setter()
        original = observed_binary64_native_mode()
        try:
            for hostile in hostile_modes:
                with self.subTest(hostile=hex(hostile)):
                    set_mode(hostile)
                    expected_ambient = observed_binary64_native_mode()
                    self.assertNotEqual(expected_ambient, 0)
                    self.assertEqual(_packed_sha256(), baseline)
                    self.assertEqual(observed_binary64_native_mode(), expected_ambient)
        finally:
            set_mode(original)
        self.assertEqual(observed_binary64_native_mode(), original)

    def test_hostile_mode_is_restored_when_the_calculation_raises(self) -> None:
        set_mode, hostile_modes = _native_setter()
        original = observed_binary64_native_mode()
        hostile = hostile_modes[-1]
        try:
            set_mode(hostile)
            expected_ambient = observed_binary64_native_mode()
            with self.assertRaises(ValueError):
                generate_compactified_lobatto_grid(2)
            self.assertEqual(observed_binary64_native_mode(), expected_ambient)
            with self.assertRaises(ValueError):
                solve_deterministic_dense_lu(
                    matrix=((1.0,),),
                    rhs=(-0.0,),
                )
            self.assertEqual(observed_binary64_native_mode(), expected_ambient)
        finally:
            set_mode(original)
        self.assertEqual(observed_binary64_native_mode(), original)

    def test_generic_boundary_defaults_checks_and_exactly_restores_snapshot(
        self,
    ) -> None:
        snapshot = object()
        events: list[object] = []

        def capture() -> object:
            events.append("capture")
            return snapshot

        def establish() -> None:
            events.append("establish")

        required_checks = iter((True, True))

        def required() -> bool:
            events.append("required")
            return next(required_checks)

        def restore(value: object) -> None:
            events.append(("restore", value))

        with (
            patch.object(environment, "_capture_native_environment", capture),
            patch.object(environment, "_establish_required_environment", establish),
            patch.object(
                environment,
                "_required_environment_is_established",
                required,
            ),
            patch.object(environment, "_restore_native_environment", restore),
        ):
            with nearest_binary64_environment():
                events.append("body")

        self.assertEqual(
            events,
            [
                "capture",
                "establish",
                "required",
                "body",
                "required",
                ("restore", snapshot),
            ],
        )

    def test_setup_and_body_failures_never_skip_or_hide_restore_failure(self) -> None:
        snapshot = object()
        restored: list[object] = []

        def setup_failure() -> None:
            raise Binary64EnvironmentError("synthetic_setup_failure")

        with (
            patch.object(
                environment,
                "_capture_native_environment",
                return_value=snapshot,
            ),
            patch.object(
                environment,
                "_establish_required_environment",
                setup_failure,
            ),
            patch.object(
                environment,
                "_restore_native_environment",
                side_effect=lambda value: restored.append(value),
            ),
        ):
            with self.assertRaisesRegex(
                Binary64EnvironmentError,
                "synthetic_setup_failure",
            ):
                with nearest_binary64_environment():
                    self.fail("setup failure must not enter the body")
        self.assertEqual(restored, [snapshot])

        with (
            patch.object(
                environment,
                "_capture_native_environment",
                return_value=snapshot,
            ),
            patch.object(environment, "_establish_required_environment"),
            patch.object(
                environment,
                "_required_environment_is_established",
                return_value=True,
            ),
            patch.object(
                environment,
                "_restore_native_environment",
                side_effect=Binary64EnvironmentError("synthetic_restore_failure"),
            ),
        ):
            with self.assertRaisesRegex(
                Binary64EnvironmentError,
                "binary64_caller_restore_failed_after_body_error",
            ):
                with nearest_binary64_environment():
                    raise LookupError("synthetic_body_failure")

    def test_linux_glibc_x86_64_full_fenv_abi_is_literal_and_fail_closed(
        self,
    ) -> None:
        layout = environment._LinuxGlibcX86_64Fenv
        self.assertEqual(ctypes.sizeof(layout), LINUX_GLIBC_X86_64_FENV_SIZE_BYTES)
        self.assertEqual(layout.x87_control_word.offset, 0)
        self.assertEqual(layout.x87_status_word.offset, 4)
        self.assertEqual(layout.mxcsr.offset, 28)
        self.assertEqual(
            LINUX_X87_REQUIRED_CONTROL & LINUX_X87_CONTROL_MASK,
            LINUX_X87_REQUIRED_CONTROL,
        )
        self.assertEqual(
            LINUX_MXCSR_REQUIRED_CONTROL & LINUX_MXCSR_CONTROL_MASK,
            LINUX_MXCSR_REQUIRED_CONTROL,
        )
        self.assertEqual(LINUX_MXCSR_REQUIRED_CONTROL & ((1 << 6) | (1 << 15)), 0)
        self.assertEqual(LINUX_MXCSR_REQUIRED_CONTROL & (0x3F << 7), 0x3F << 7)

        source = inspect.getsource(environment)
        self.assertIn('elif sys.platform == "linux":', source)
        self.assertIn('machine not in ("x86_64", "amd64")', source)
        self.assertIn("gnu_get_libc_version", source)
        self.assertIn("_LIBC.fegetenv", source)
        self.assertIn("_LIBC.fesetenv", source)
        self.assertIn("_GLIBC_FE_DFL_ENV = ctypes.c_void_p(-1)", source)
        self.assertNotIn('sys.platform.startswith(("linux", "darwin", "freebsd"))', source)

        left = layout()
        right = layout()
        left.x87_tag_word = 1
        right.x87_tag_word = 2
        self.assertEqual(
            environment._fenv_arithmetic_state(left),
            environment._fenv_arithmetic_state(right),
        )
        right.mxcsr = 1
        self.assertNotEqual(
            environment._fenv_arithmetic_state(left),
            environment._fenv_arithmetic_state(right),
        )

    def test_mocked_linux_glibc_path_defaults_and_restores_full_fenv(self) -> None:
        fields = tuple(
            name for name, *_ in environment._LinuxGlibcX86_64Fenv._fields_
        )
        state = {
            "x87_control_word": 0x0C00,
            "glibc_reserved_1": 0x1234,
            "x87_status_word": 0x003F,
            "glibc_reserved_2": 0x5678,
            "x87_tag_word": 0xA5A5A5A5,
            "x87_instruction_pointer": 0x11223344,
            "x87_code_selector_and_opcode": 0x01234567,
            "x87_data_pointer": 0x55667788,
            "x87_data_selector_and_reserved": 0x76544321,
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

        default_pointer = (1 << (8 * ctypes.sizeof(ctypes.c_void_p))) - 1

        def set_environment(pointer) -> int:
            if isinstance(pointer, ctypes.c_void_p) and pointer.value == default_pointer:
                state["x87_control_word"] = (
                    state["x87_control_word"] & ~LINUX_X87_CONTROL_MASK
                ) | LINUX_X87_REQUIRED_CONTROL
                state["x87_status_word"] &= ~0x003F
                state["x87_instruction_pointer"] = 0
                state["x87_code_selector_and_opcode"] &= 0xF8000000
                state["x87_data_pointer"] = 0
                state["x87_data_selector_and_reserved"] &= 0xFFFF0000
                state["mxcsr"] = (
                    state["mxcsr"] & ~(LINUX_MXCSR_CONTROL_MASK | 0x003F)
                ) | LINUX_MXCSR_REQUIRED_CONTROL
                return 0
            source = pointer._obj
            state["x87_control_word"] = (
                state["x87_control_word"] & ~LINUX_X87_CONTROL_MASK
            ) | (source.x87_control_word & LINUX_X87_CONTROL_MASK)
            state["x87_status_word"] = (
                state["x87_status_word"] & ~0x003F
            ) | (source.x87_status_word & 0x003F)
            state["x87_instruction_pointer"] = source.x87_instruction_pointer
            state["x87_code_selector_and_opcode"] = (
                state["x87_code_selector_and_opcode"] & 0xF8000000
            ) | (source.x87_code_selector_and_opcode & 0x07FFFFFF)
            state["x87_data_pointer"] = source.x87_data_pointer
            state["x87_data_selector_and_reserved"] = (
                state["x87_data_selector_and_reserved"] & 0xFFFF0000
            ) | (source.x87_data_selector_and_reserved & 0x0000FFFF)
            state["mxcsr"] = source.mxcsr
            return 0

        fake_libc = type("FakeLibc", (), {})()
        fake_libc.gnu_get_libc_version = FakeFunction(lambda: b"2.39")
        fake_libc.fegetenv = FakeFunction(get_environment)
        fake_libc.fesetenv = FakeFunction(set_environment)
        fake_libc.fegetround = FakeFunction(
            lambda: state["x87_control_word"] & 0x0C00
        )

        source_path = HERE / "binary64_environment.py"
        with (
            patch.object(sys, "platform", "linux"),
            patch("platform.machine", return_value="x86_64"),
            patch.object(ctypes, "CDLL", return_value=fake_libc),
        ):
            namespace = runpy.run_path(
                str(source_path),
                run_name="binary64_environment_mocked_linux",
            )

        self.assertEqual(
            namespace["BINARY64_RUNTIME_FAMILY"],
            "linux_x86_64_glibc_full_fenv",
        )
        self.assertEqual(namespace["OBSERVED_GLIBC_VERSION"], "2.39")
        with namespace["nearest_binary64_environment"]():
            self.assertEqual(
                state["x87_control_word"] & LINUX_X87_CONTROL_MASK,
                LINUX_X87_REQUIRED_CONTROL,
            )
            self.assertEqual(state["x87_status_word"] & 0x003F, 0)
            self.assertEqual(
                state["mxcsr"] & LINUX_MXCSR_CONTROL_MASK,
                LINUX_MXCSR_REQUIRED_CONTROL,
            )
            self.assertEqual(state["mxcsr"] & 0x003F, 0)
            state["x87_status_word"] |= 0x0020
            state["mxcsr"] |= 0x0020
        self.assertEqual(state, original)


if __name__ == "__main__":
    unittest.main()
