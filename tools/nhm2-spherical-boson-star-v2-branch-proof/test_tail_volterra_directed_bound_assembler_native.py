"""Focused build/run checks for the native directed-bound canary.

Program gate: G2 — classical branch proof and terminal state
Workstream: exact proof-definition implementation
Capability or component: native MPFR256 model/source/endpoint quotient canary
Current maturity: calculation-only canary; no proof or candidate authority
Target maturity: audited native source-envelope and Volterra bound assembler
Required frozen inputs: degree 32, chi=17/16, order 512, MPFR 4.2.2
Required evidence: clean x64 build, outward enclosure, deterministic locks
Stop/fail criteria: compiler/runtime drift, containment miss, or promotion
Explicit non-goals: proof execution, candidate execution, radii, or lamps
Downstream gate unlocked: complete radial-cover assembly and comparison
"""

from __future__ import annotations

import ctypes
import _ctypes
from fractions import Fraction
import importlib.util
import json
import math
from pathlib import Path
import platform
import subprocess
import sys
import tempfile
import unittest

import gmpy2
import sympy


HERE = Path(__file__).resolve().parent
SOURCE = HERE / "tail_volterra_directed_bound_assembler_native.cpp"
ENDPOINT_SOURCE = HERE / "tail_endpoint_sparse_algebra.py"
VSWHERE = Path(
    r"C:\Program Files (x86)\Microsoft Visual Studio\Installer\vswhere.exe"
)


def _load_endpoint_source() -> object:
    specification = importlib.util.spec_from_file_location(
        "_nhm2_native_tail_endpoint_oracle", ENDPOINT_SOURCE
    )
    if specification is None or specification.loader is None:
        raise AssertionError("endpoint_oracle_import_spec_unavailable")
    module = importlib.util.module_from_spec(specification)
    sys.modules[specification.name] = module
    specification.loader.exec_module(module)
    return module


ENDPOINT = _load_endpoint_source()
ENDPOINT_RECEIPT = ENDPOINT._test_only_generate(ENDPOINT._TEST_MARKER)


def _visual_studio_root() -> Path:
    if not VSWHERE.is_file():
        raise unittest.SkipTest("SKIP_NATIVE_MSVC_VSWHERE_ABSENT")
    result = subprocess.run(
        [
            str(VSWHERE),
            "-latest",
            "-products",
            "*",
            "-requires",
            "Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
            "-property",
            "installationPath",
        ],
        check=True,
        capture_output=True,
        text=True,
        timeout=30,
    )
    root_text = result.stdout.strip()
    if not root_text:
        raise unittest.SkipTest("SKIP_NATIVE_MSVC_X64_TOOLCHAIN_ABSENT")
    root = Path(root_text)
    if not root.is_absolute():
        raise AssertionError("visual_studio_root_not_absolute")
    return root


def _compile_native(destination: Path) -> None:
    root = _visual_studio_root()
    developer_shell = root / "Common7" / "Tools" / "VsDevCmd.bat"
    if not developer_shell.is_file():
        raise unittest.SkipTest("SKIP_NATIVE_MSVC_DEVELOPER_SHELL_ABSENT")
    build_script = destination.parent / "build-native-canary.cmd"
    build_script.write_text(
        "@echo off\n"
        f'call "{developer_shell}" -arch=amd64 -host_arch=amd64 >nul\n'
        "if errorlevel 1 exit /b %errorlevel%\n"
        f'cl /nologo /std:c++20 /EHsc /O2 /W4 /WX /LD '
        f'/Fe:"{destination}" '
        f'"{SOURCE}"\n',
        encoding="utf-8",
    )
    result = subprocess.run(
        ["cmd.exe", "/d", "/c", str(build_script)],
        cwd=destination.parent,
        capture_output=True,
        text=True,
        timeout=120,
    )
    if result.returncode != 0:
        raise AssertionError(
            "native_compile_failed:"
            f"{result.returncode}:{result.stdout[-2000:]}:{result.stderr[-2000:]}"
        )


def _invoke_canary(library_path: Path) -> dict[str, object]:
    # Importing gmpy2 above is deliberate: production code may only attach to
    # an already-loaded, separately pinned MPFR module and accepts no DSO path.
    library = ctypes.WinDLL(str(library_path))
    handle = library._handle
    context = gmpy2.get_context()
    original = (
        context.emin,
        context.emax,
        context.underflow,
        context.overflow,
        context.inexact,
        context.invalid,
        context.erange,
        context.divzero,
    )
    context.inexact = True
    context.erange = True
    expected = (
        context.emin,
        context.emax,
        context.underflow,
        context.overflow,
        context.inexact,
        context.invalid,
        context.erange,
        context.divzero,
    )
    try:
        canary = library.nhm2_tail_native_canary
        canary.argtypes = (ctypes.POINTER(ctypes.c_char), ctypes.c_size_t)
        canary.restype = ctypes.c_int
        output = ctypes.create_string_buffer(8192)
        return_code = canary(output, len(output))
        if return_code != 0:
            raise AssertionError(
                f"native_canary_failed:{return_code}:{output.value!r}"
            )
        decoded = json.loads(output.value.decode("ascii"))
        if type(decoded) is not dict:
            raise AssertionError("native_canary_root_not_object")
        observed = (
            context.emin,
            context.emax,
            context.underflow,
            context.overflow,
            context.inexact,
            context.invalid,
            context.erange,
            context.divzero,
        )
        if observed != expected:
            raise AssertionError(
                f"native_canary_context_not_restored:{expected!r}:{observed!r}"
            )
        return decoded
    finally:
        (
            context.emin,
            context.emax,
            context.underflow,
            context.overflow,
            context.inexact,
            context.invalid,
            context.erange,
            context.divzero,
        ) = original
        del library
        _ctypes.FreeLibrary(handle)


@unittest.skipUnless(
    platform.system() == "Windows" and platform.machine().endswith("64"),
    "SKIP_NATIVE_WINDOWS_X64_HOST_REQUIRED",
)
class NativeTailVolterraDirectedBoundAssemblerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls._temporary = tempfile.TemporaryDirectory(
            prefix="nhm2-tail-native-test-"
        )
        cls.addClassCleanup(cls._temporary.cleanup)
        cls.library_path = Path(cls._temporary.name) / "tail_native.dll"
        _compile_native(cls.library_path)
        cls.receipt = _invoke_canary(cls.library_path)

    def test_canary_has_exact_calculation_only_shape(self) -> None:
        self.assertEqual(
            set(self.receipt),
            {
                "status",
                "analyticOrder",
                "parameterDegree",
                "exp",
                "reciprocal",
                "log",
                "sqrt",
                "phi1",
                "q0",
                "expJetFirst",
                "expJetSecond",
                "phi1JetFirst",
                "phi1JetSecond",
                "log1pOverX",
                "log1pOverXFirst",
                "log1pOverXSecond",
                "log1mOverX",
                "log1mOverXFirst",
                "log1mOverXSecond",
                "chartS",
                "chartK",
                "chartW2",
                "chartSigma",
                "chartD",
                "chartB",
                "chartZ",
                "chartH",
                "chartV1",
                "chartHy",
                "chartV1y",
                "chartMetricD",
                "chartHLambda",
                "chartHLambda2",
                "chartKNu",
                "chartKNu2",
                "physicalRh",
                "physicalRv",
                "physicalScalar",
                "physicalRhLambda",
                "physicalRvLambda",
                "physicalScalarLambda",
                "physicalScalarLambda2",
                "parameterSourceChartCanaryImplemented",
                "alpha",
                "cG1",
                "cG2",
                "cK0",
                "rh",
                "rhD1",
                "rhD2",
                "rv",
                "rvD1",
                "rvD2",
                "scalar",
                "scalarD1",
                "scalarD2",
                "endpointQuotientSemanticSha256",
                "endpointQuotientTerms",
                "endpointQuotientAtOne",
                "endpointQuotientCap",
                "scalarJetSemanticSha256",
                "scalarJetTerms",
                "scalarJetValue",
                "scalarJetDerivative",
                "radialCoverOrdinals",
                "regularCellsVisited",
                "regularRhAbsUpper",
                "regularRvAbsUpper",
                "regularScalarAbsUpper",
                "radialCoverTraversalImplemented",
                "derivativeCellsVisited",
                "derivativeValueAbsUpper",
                "tailFirstAbsUpper",
                "tailSecondAbsUpper",
                "parameterFirstAbsUpper",
                "parameterSecondAbsUpper",
                "mixedSecondAbsUpper",
                "regularDerivativeCoverImplemented",
                "parameterCoordinateRelationsFrozen",
                "radialCoverImplemented",
                "elapsedMicroseconds",
                "proofAuthority",
                "candidateExecuted",
                "physicalAuthority",
            },
        )
        self.assertEqual(self.receipt["status"], "calculation_only")
        self.assertEqual(self.receipt["analyticOrder"], 512)
        self.assertEqual(self.receipt["parameterDegree"], 32)
        self.assertEqual(self.receipt["endpointQuotientTerms"], 3053)
        self.assertEqual(self.receipt["scalarJetTerms"], 516)
        self.assertEqual(self.receipt["radialCoverOrdinals"], 256)
        self.assertEqual(self.receipt["regularCellsVisited"], 255)
        self.assertIs(self.receipt["radialCoverTraversalImplemented"], True)
        self.assertEqual(self.receipt["derivativeCellsVisited"], 255)
        self.assertIs(self.receipt["regularDerivativeCoverImplemented"], True)
        self.assertIs(self.receipt["parameterCoordinateRelationsFrozen"], False)
        self.assertIs(
            self.receipt["parameterSourceChartCanaryImplemented"], True
        )
        self.assertIs(self.receipt["radialCoverImplemented"], False)
        self.assertGreaterEqual(self.receipt["elapsedMicroseconds"], 0)

    def test_frozen_endpoint_quotient_encloses_exact_bridge_value(self) -> None:
        self.assertEqual(
            self.receipt["endpointQuotientSemanticSha256"],
            "c19b4795d314597d72d18ab8ad6e8dbfe55d16f58f31472402fff548417022a7",
        )
        exact = gmpy2.mpq(
            -32650554830712757580473075714079072748308696079347,
            30509363508750000000000000000000000000000000000,
        )
        lower, upper = self.receipt["endpointQuotientAtOne"]
        self.assertLessEqual(gmpy2.mpfr(lower), exact)
        self.assertGreaterEqual(gmpy2.mpfr(upper), exact)
        cap_lower, cap_upper = self.receipt["endpointQuotientCap"]
        self.assertLessEqual(cap_lower, lower)
        self.assertGreaterEqual(cap_upper, upper)

    def test_frozen_scalar_jet_encloses_exact_bridge_value_and_derivative(
        self,
    ) -> None:
        self.assertEqual(
            self.receipt["scalarJetSemanticSha256"],
            "858e83405870b2a6bb170b42f9b85817f7cfd9413e6206faba1fbbd1ae27826d",
        )
        expected = {
            "scalarJetValue": gmpy2.mpq(
                4769926764907806239493080221927270848804001,
                4885402955709066964579123200000000000000000,
            ),
            "scalarJetDerivative": gmpy2.mpq(
                -14313667355664726994820335312119665800799,
                9541802647869271415193600000000000000000,
            ),
        }
        for key, exact in expected.items():
            lower, upper = self.receipt[key]
            self.assertLessEqual(gmpy2.mpfr(lower), exact, key)
            self.assertGreaterEqual(gmpy2.mpfr(upper), exact, key)

    def test_all_regular_cells_enclose_independent_midpoint_sources(self) -> None:
        with gmpy2.context(gmpy2.get_context(), precision=256):
            s_value = gmpy2.mpq(1, 10)
            nu = gmpy2.mpq(1, 20)
            h_s = gmpy2.mpq(1, 5)
            v1_s = gmpy2.mpq(1, 6)
            h_s_y = gmpy2.mpq(1, 20)
            f_value = gmpy2.mpq(1, 4)
            f_y = gmpy2.mpq(1, 30)
            sigma = gmpy2.mpq(1, 8)
            maxima = {"rh": gmpy2.mpfr(0), "rv": gmpy2.mpfr(0), "scalar": gmpy2.mpfr(0)}
            for cell in range(1, 256):
                eta = gmpy2.mpq(2 * cell + 1, 512)
                y_inverse = eta / 64
                b_value = -gmpy2.mpq(1, 2) + sigma * y_inverse
                w2 = 1 + 2 * s_value * nu
                u_combination = f_y + b_value * f_value
                common_positive = (
                    gmpy2.exp(2 * s_value * (2 * v1_s - h_s))
                    * w2
                    * f_value**2
                )
                common_mass = gmpy2.exp(2 * s_value * v1_s) * f_value**2
                rv = -(
                    common_positive
                    + s_value * u_combination**2
                    + common_mass
                ) / 2
                rh = (
                    common_positive
                    - s_value * u_combination**2
                    - common_mass
                )
                h_minus_v1 = h_s - v1_s
                e0 = gmpy2.exp(-2 * s_value * h_minus_v1)
                q0 = gmpy2.expm1(-2 * s_value * h_minus_v1) / s_value
                v_scalar = gmpy2.exp(2 * s_value * v1_s) * (
                    q0 + 2 * nu * e0
                )
                a_scalar = 2 * y_inverse + s_value * h_s_y
                p_tilde = (2 * sigma + 2) * y_inverse + s_value * h_s_y
                q_tilde = (
                    -sigma * y_inverse**2
                    + b_value**2
                    + a_scalar * b_value
                    + v_scalar
                )
                scalar = -p_tilde * f_y - q_tilde * f_value
                maxima["rh"] = max(maxima["rh"], abs(rh))
                maxima["rv"] = max(maxima["rv"], abs(rv))
                maxima["scalar"] = max(maxima["scalar"], abs(scalar))
            for label, receipt_key in (
                ("rh", "regularRhAbsUpper"),
                ("rv", "regularRvAbsUpper"),
                ("scalar", "regularScalarAbsUpper"),
            ):
                bound = self.receipt[receipt_key]
                self.assertTrue(math.isfinite(bound))
                self.assertGreater(bound, 0)
                self.assertGreaterEqual(gmpy2.mpfr(bound), maxima[label])

    def test_derivative_cover_aggregates_are_finite_and_nontrivial(self) -> None:
        for key in (
            "derivativeValueAbsUpper",
            "tailFirstAbsUpper",
            "tailSecondAbsUpper",
            "parameterFirstAbsUpper",
            "parameterSecondAbsUpper",
            "mixedSecondAbsUpper",
        ):
            value = self.receipt[key]
            self.assertIs(type(value), float)
            self.assertTrue(math.isfinite(value), key)
            self.assertGreater(value, 0, key)

    def test_canary_outwardly_encloses_all_analytic_fixtures(self) -> None:
        with gmpy2.context(gmpy2.get_context(), precision=256):
            point = gmpy2.mpfr("0.11")
            s_value = gmpy2.mpfr("0.11")
            v_value = gmpy2.mpfr("0.205")
            expected = {
                "exp": gmpy2.exp(point),
                "reciprocal": 1 / point,
                "log": gmpy2.log(point),
                "sqrt": gmpy2.sqrt(point),
                "phi1": gmpy2.expm1(point) / point,
                "q0": gmpy2.expm1(-2 * s_value * v_value) / s_value,
            }
            for label, exact in expected.items():
                enclosure = self.receipt[label]
                self.assertIs(type(enclosure), list)
                self.assertEqual(len(enclosure), 2)
                lower, upper = enclosure
                self.assertIs(type(lower), float)
                self.assertIs(type(upper), float)
                self.assertLessEqual(gmpy2.mpfr(lower), exact, label)
                self.assertGreaterEqual(gmpy2.mpfr(upper), exact, label)
                reference = float(exact)
                self.assertLessEqual(
                    upper - lower,
                    16 * math.ulp(reference),
                    label,
                )

    def test_seven_coordinate_second_order_jet_chain_rule(self) -> None:
        with gmpy2.context(gmpy2.get_context(), precision=256):
            point = gmpy2.mpfr("0.11")
            exponential = gmpy2.exp(point)
            phi1_first = (exponential * (point - 1) + 1) / (point**2)
            phi1_second = (
                exponential * (point**2 - 2 * point + 2) - 2
            ) / (point**3)
            expected = {
                "expJetFirst": exponential,
                "expJetSecond": exponential,
                "phi1JetFirst": phi1_first,
                "phi1JetSecond": phi1_second,
            }
            for label, exact in expected.items():
                lower, upper = self.receipt[label]
                self.assertLessEqual(gmpy2.mpfr(lower), exact, label)
                self.assertGreaterEqual(gmpy2.mpfr(upper), exact, label)

    def test_removable_logarithmic_primitives_and_derivatives(self) -> None:
        x = sympy.symbols("x", real=True)
        expressions = {
            "log1pOverX": sympy.log(1 + x) / x,
            "log1mOverX": sympy.log(1 - x) / x,
        }
        point = sympy.Rational(11, 100)
        with gmpy2.context(gmpy2.get_context(), precision=256):
            for label, expression in expressions.items():
                for order, suffix in ((0, ""), (1, "First"), (2, "Second")):
                    exact_text = str(
                        sympy.N(sympy.diff(expression, x, order).subs(x, point), 100)
                    )
                    exact = gmpy2.mpfr(exact_text)
                    lower, upper = self.receipt[label + suffix]
                    self.assertLessEqual(gmpy2.mpfr(lower), exact, label + suffix)
                    self.assertGreaterEqual(gmpy2.mpfr(upper), exact, label + suffix)

    def test_physical_parameter_source_chart_matches_exact_symbolic_oracle(
        self,
    ) -> None:
        lam, nu, m_value, c_value = sympy.symbols("lam nu m c", real=True)
        eta = sympy.Rational(1, 2)
        y_inverse = eta / 64
        s_value = lam**2
        k_value = sympy.sqrt(-2 * nu)
        w2 = 1 + 2 * s_value * nu
        sigma = m_value * (1 + 4 * s_value * nu) / k_value - 1
        d_value = c_value * sympy.exp(-64 * k_value) * 64**sigma
        a_value = m_value * y_inverse / 2
        r_value = s_value * a_value
        v1_s = 2 * sympy.log(1 + r_value) / s_value
        h_s = sympy.log(1 - r_value**2) / s_value
        v1_s_y = -2 * a_value * y_inverse / (1 + r_value)
        h_s_y = (
            2 * s_value * a_value**2 * y_inverse / (1 - r_value**2)
        )
        b_value = -k_value + sigma * y_inverse
        z_value = y_inverse / k_value
        log_b = -64 * k_value * (1 / eta - 1) - sigma * sympy.log(eta)
        flat_b = sympy.exp(log_b)
        metric_d = (d_value * flat_b) ** 2
        substitutions = {
            lam: sympy.Rational(3, 4),
            nu: sympy.Rational(-8, 25),
            m_value: sympy.Rational(4, 3),
            c_value: sympy.Rational(1),
        }
        expected = {
            "chartS": s_value,
            "chartK": k_value,
            "chartW2": w2,
            "chartSigma": sigma,
            "chartD": d_value,
            "chartB": flat_b,
            "chartZ": z_value,
            "chartH": h_s,
            "chartV1": v1_s,
            "chartHy": h_s_y,
            "chartV1y": v1_s_y,
            "chartMetricD": metric_d,
            "chartHLambda": sympy.diff(h_s, lam),
            "chartHLambda2": sympy.diff(h_s, lam, 2),
            "chartKNu": sympy.diff(k_value, nu),
            "chartKNu2": sympy.diff(k_value, nu, 2),
        }
        with gmpy2.context(gmpy2.get_context(), precision=256):
            for key, expression in expected.items():
                exact = gmpy2.mpfr(str(sympy.N(expression.subs(substitutions), 100)))
                lower, upper = self.receipt[key]
                self.assertLessEqual(gmpy2.mpfr(lower), exact, key)
                self.assertGreaterEqual(gmpy2.mpfr(upper), exact, key)

    def test_physical_source_dag_uses_frozen_scalar_jet(self) -> None:
        s_value = Fraction(9, 16)
        m_value = Fraction(4, 3)
        k_value = Fraction(4, 5)
        z_value = Fraction(5, 512)
        coefficients: list[Fraction] = []
        for polynomial in ENDPOINT_RECEIPT.scalar_coefficients:
            coefficient = Fraction()
            for s_exp, m_exp, k_exp, numerator, denominator in polynomial:
                coefficient += (
                    Fraction(int(numerator), int(denominator))
                    * s_value ** int(s_exp)
                    * m_value ** int(m_exp)
                    * k_value ** int(k_exp)
                )
            coefficients.append(coefficient)
        p8 = sum(
            coefficient * z_value**ordinal
            for ordinal, coefficient in enumerate(coefficients)
        )
        p8_z = sum(
            ordinal * coefficient * z_value ** (ordinal - 1)
            for ordinal, coefficient in enumerate(coefficients)
            if ordinal >= 1
        )
        p8_zz = sum(
            ordinal
            * (ordinal - 1)
            * coefficient
            * z_value ** (ordinal - 2)
            for ordinal, coefficient in enumerate(coefficients)
            if ordinal >= 2
        )
        p8_y = -k_value * z_value**2 * p8_z
        p8_yy = k_value**2 * (
            z_value**4 * p8_zz + 2 * z_value**3 * p8_z
        )
        finite_residual = p8_yy - 2 * k_value * p8_y
        with gmpy2.context(gmpy2.get_context(), precision=256):
            s_mp = gmpy2.mpq(s_value.numerator, s_value.denominator)
            nu = gmpy2.mpq(-8, 25)
            m_mp = gmpy2.mpq(m_value.numerator, m_value.denominator)
            k_mp = gmpy2.mpq(k_value.numerator, k_value.denominator)
            y_inverse = gmpy2.mpq(1, 128)
            a_value = m_mp * y_inverse / 2
            r_value = s_mp * a_value
            h_s = gmpy2.log(1 - r_value**2) / s_mp
            v1_s = 2 * gmpy2.log(1 + r_value) / s_mp
            h_s_y = 2 * s_mp * a_value**2 * y_inverse / (1 - r_value**2)
            v1_s_y = -2 * a_value * y_inverse / (1 + r_value)
            sigma = m_mp * (1 + 4 * s_mp * nu) / k_mp - 1
            b_value = -k_mp + sigma * y_inverse
            p8_mp = gmpy2.mpq(p8.numerator, p8.denominator)
            p8_y_mp = gmpy2.mpq(p8_y.numerator, p8_y.denominator)
            residual_mp = gmpy2.mpq(
                finite_residual.numerator, finite_residual.denominator
            )
            w2 = 1 + 2 * s_mp * nu
            u_combination = p8_y_mp + b_value * p8_mp
            common_positive = (
                gmpy2.exp(2 * s_mp * (2 * v1_s - h_s))
                * w2
                * p8_mp**2
            )
            common_mass = gmpy2.exp(2 * s_mp * v1_s) * p8_mp**2
            rv = -(
                common_positive
                + s_mp * u_combination**2
                + common_mass
            ) / 2
            rh = (
                common_positive
                - s_mp * u_combination**2
                - common_mass
            )
            h_minus_v1 = h_s - v1_s
            e0 = gmpy2.exp(-2 * s_mp * h_minus_v1)
            q0 = gmpy2.expm1(-2 * s_mp * h_minus_v1) / s_mp
            a_scalar = 2 * y_inverse + s_mp * h_s_y
            v_scalar = gmpy2.exp(2 * s_mp * v1_s) * (q0 + 2 * nu * e0)
            p_tilde = (2 * sigma + 2) * y_inverse + s_mp * h_s_y
            q_tilde = (
                -sigma * y_inverse**2
                + b_value**2
                + a_scalar * b_value
                + v_scalar
            )
            scalar = -p_tilde * p8_y_mp - q_tilde * p8_mp - residual_mp
            for key, exact in (
                ("physicalRh", rh),
                ("physicalRv", rv),
                ("physicalScalar", scalar),
            ):
                lower, upper = self.receipt[key]
                self.assertLessEqual(gmpy2.mpfr(lower), exact, key)
                self.assertGreaterEqual(gmpy2.mpfr(upper), exact, key)
            for key in (
                "physicalRhLambda",
                "physicalRvLambda",
                "physicalScalarLambda",
                "physicalScalarLambda2",
            ):
                lower, upper = self.receipt[key]
                self.assertTrue(math.isfinite(lower), key)
                self.assertTrue(math.isfinite(upper), key)
                self.assertLessEqual(lower, upper, key)

    def test_closed_kernel_constants_enclose_exact_rationals(self) -> None:
        alpha = Fraction(127, 128)
        ai = 1 / alpha
        ai2 = ai * ai
        ai3 = ai2 * ai
        ki = Fraction(2)
        ki2 = ki * ki
        c10 = ai2 + ai3 / 32
        c11 = (ai + ai2 / 64) * ki / 2
        c12 = (1 + ai / 64 + ai2 / 4096) * ki2 / 4
        c21 = (ai + ai2 / 32 + ai3 / 2048) * ki / 2
        c22 = (
            1 + ai / 32 + ai2 / 1024 + ai3 / 65536
        ) * ki2 / 4
        expected = {
            "alpha": alpha,
            "cG1": max(c10, c11, c12),
            "cG2": max(c10, c21, c22),
            "cK0": ki2 / 16,
        }
        for label, exact in expected.items():
            lower, upper = self.receipt[label]
            exact_ratio = gmpy2.mpq(exact.numerator, exact.denominator)
            self.assertLessEqual(gmpy2.mpfr(lower), exact_ratio, label)
            self.assertGreaterEqual(gmpy2.mpfr(upper), exact_ratio, label)

    def test_factored_source_dag_matches_exact_symbolic_oracle(self) -> None:
        x = sympy.symbols("x", real=True)
        s = sympy.Rational(1, 10)
        nu = sympy.Rational(1, 20)
        d = sympy.Rational(1, 100)
        b = sympy.Rational(-1, 2)
        h_s = sympy.Rational(1, 5)
        v1_s = sympy.Rational(1, 6)
        h_s_y = sympy.Rational(1, 20)
        v1_s_y = sympy.Rational(1, 25)
        f_value = sympy.Rational(1, 4)
        f_y = sympy.Rational(1, 30)
        y_inverse = sympy.Rational(1, 64)
        sigma = sympy.Rational(1, 8)
        h = h_s + d * x
        v1 = v1_s
        hy = h_s_y - d * x
        v1y = v1_s_y
        w2 = 1 + 2 * s * nu
        u_combination = f_y + b * f_value
        mixed = sympy.exp(2 * s * (2 * v1 - h)) * w2 * f_value**2
        mass = sympy.exp(2 * s * v1) * f_value**2
        rv = -sympy.Rational(1, 2) * (
            mixed + s * u_combination**2 + mass
        )
        difference = -x
        rh = (
            -s
            * (
                2 * (h_s_y - v1_s_y) * difference
                + d * difference**2
            )
            + mixed
            - s * u_combination**2
            - mass
        )
        h_minus_v1 = h - v1
        e0 = sympy.exp(-2 * s * h_minus_v1)
        a_scalar = 2 * y_inverse + s * hy
        q0 = (sympy.exp(-2 * s * h_minus_v1) - 1) / s
        v_scalar = sympy.exp(2 * s * v1) * (q0 + 2 * nu * e0)
        p_tilde = (2 * sigma + 2) * y_inverse + s * hy
        q_tilde = (
            -sigma * y_inverse**2 + b**2 + a_scalar * b + v_scalar
        )
        scalar = -p_tilde * f_y - q_tilde * f_value
        expected_expressions = {
            "rh": rh,
            "rv": rv,
            "scalar": scalar,
        }
        at = sympy.Rational(1, 10)
        with gmpy2.context(gmpy2.get_context(), precision=256):
            for label, expression in expected_expressions.items():
                for derivative_order, suffix in ((0, ""), (1, "D1"), (2, "D2")):
                    differentiated = sympy.diff(expression, x, derivative_order)
                    exact_text = str(sympy.N(differentiated.subs(x, at), 100))
                    exact = gmpy2.mpfr(exact_text)
                    lower, upper = self.receipt[label + suffix]
                    self.assertLessEqual(gmpy2.mpfr(lower), exact, label + suffix)
                    self.assertGreaterEqual(gmpy2.mpfr(upper), exact, label + suffix)

    def test_every_authority_surface_remains_false(self) -> None:
        self.assertIs(self.receipt["proofAuthority"], False)
        self.assertIs(self.receipt["candidateExecuted"], False)
        self.assertIs(self.receipt["physicalAuthority"], False)

    def test_source_has_no_loader_path_or_candidate_surface(self) -> None:
        text = SOURCE.read_text(encoding="utf-8")
        self.assertIn('GetModuleHandleW(L"libmpfr-6.dll")', text)
        for forbidden in (
            "LoadLibrary",
            "CreateProcess",
            "ShellExecute",
            "candidateId",
            "proofAuthority\":true",
            "physicalAuthority\":true",
        ):
            self.assertNotIn(forbidden, text)


if __name__ == "__main__":
    unittest.main()
