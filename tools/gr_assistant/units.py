from __future__ import annotations

from typing import Dict

import pint
import sympy as sp

from .schemas import CheckResult

_ureg = pint.UnitRegistry()


def _unit_for_symbol(symbol: sp.Symbol, symbol_units: Dict[str, str]) -> pint.Unit:
    name = symbol.name
    if name not in symbol_units:
        raise KeyError(f"missing unit for symbol '{name}'")
    return _ureg.parse_expression(symbol_units[name]).units


def _unit_of_expr(expr: sp.Expr, symbol_units: Dict[str, str]) -> pint.Unit:
    if expr.is_Number:
        return _ureg.dimensionless
    if expr.is_Symbol:
        return _unit_for_symbol(expr, symbol_units)
    if expr.is_Add:
        units = [_unit_of_expr(arg, symbol_units) for arg in expr.args]
        base = units[0]
        for unit in units[1:]:
            if _ureg.get_dimensionality(unit) != _ureg.get_dimensionality(base):
                raise ValueError("unit mismatch in sum")
        return base
    if expr.is_Mul:
        unit = _ureg.dimensionless
        for arg in expr.args:
            unit = unit * _unit_of_expr(arg, symbol_units)
        return unit
    if expr.is_Pow:
        base, exponent = expr.args
        if not exponent.is_number:
            raise ValueError("non-numeric exponent in unit expression")
        return _unit_of_expr(base, symbol_units) ** float(exponent)
    if expr.is_Function:
        arg = expr.args[0] if expr.args else None
        if arg is not None:
            arg_unit = _unit_of_expr(arg, symbol_units)
            if _ureg.get_dimensionality(arg_unit) != _ureg.dimensionless:
                raise ValueError("function expects dimensionless argument")
        return _ureg.dimensionless
    raise ValueError("unsupported expression for unit check")


def check_units(expression: str, symbol_units: Dict[str, str], unit_system: str) -> CheckResult:
    if unit_system.lower().startswith("geom"):
        return CheckResult(
            check_name="unit_check",
            passed=True,
            notes="geometrized units assumed; no dimension check applied",
        )
    try:
        expr = sp.sympify(expression)
        _unit_of_expr(expr, symbol_units)
        return CheckResult(check_name="unit_check", passed=True)
    except KeyError as exc:
        return CheckResult(check_name="unit_check", passed=False, notes=str(exc))
    except Exception as exc:
        return CheckResult(check_name="unit_check", passed=False, notes=str(exc))
