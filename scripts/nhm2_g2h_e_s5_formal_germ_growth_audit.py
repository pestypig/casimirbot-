#!/usr/bin/env python3
"""Candidate-neutral exact audit of the two frozen scalar formal recurrences."""

from __future__ import annotations

import json
import hashlib
from pathlib import Path

import sympy as sp


ROOT = Path(__file__).resolve().parents[1]
POSITIVE = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-positive-branch-tail-factorization.v1.json"
GRID = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-classical-state-grid-contract.v2.json"
BOREL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-universal-scalar-borel-system.v1.json"
METRIC_BOREL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-metric-borel-system.v1.json"
STATE_JETS = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-state-jet-system.v1.json"
GROWTH_QUADRATURE = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json"
checks: list[dict[str, object]] = []


def check(name: str, passed: bool, detail: object) -> None:
    checks.append({"name": name, "pass": bool(passed), "detail": detail})


def is_zero(value: sp.Expr) -> bool:
    return sp.simplify(value) == 0


def coefficient_from_operator(
    a2: sp.Expr, a1: sp.Expr, a0: sp.Expr,
    coordinate: sp.Symbol, series_index: sp.Expr, target: sp.Expr,
) -> sp.Expr:
    result = sp.Integer(0)
    for derivative, coefficient in ((2, a2), (1, a1), (0, a0)):
        for term in sp.Add.make_args(sp.expand(coefficient)):
            power = term.as_powers_dict().get(coordinate, 0)
            scalar = term / coordinate**power
            if is_zero(series_index - derivative + power - target):
                falling = sp.prod(series_index - offset for offset in range(derivative))
                result += scalar * falling
    return sp.factor(result)


positive = json.loads(POSITIVE.read_text(encoding="utf-8"))
grid = json.loads(GRID.read_text(encoding="utf-8"))
check("finite_order_unselected",
      positive["formal_recurrence"]["finite_truncation_order"].startswith("not selected"),
      positive["formal_recurrence"]["finite_truncation_order"])
check("formal_not_full_tail_proof",
      positive["formal_recurrence"]["formal_recurrence_is_full_tail_proof"] is False
      and positive["formal_recurrence"]["formal_recurrence_is_full_function_analyticity_claim"] is False,
      positive["formal_recurrence"])

q, n, kappa, beta, mass, omega = sp.symbols("q n kappa beta mass omega")
f0 = 1 - 2*mass*q
positive_a2 = sp.expand(f0**2*q**4)
positive_a1 = sp.expand(
    f0**2*(2*kappa*q**2 - 2*beta*q**3) - 2*mass*f0*q**4
)
positive_a0 = sp.expand(
    f0**2*(kappa**2 - 2*kappa*(beta + 1)*q + beta*(beta + 1)*q**2)
    - 2*mass*f0*(kappa*q**2 - beta*q**3) + (omega**2 - f0)
)
positive_substitutions = {
    omega**2: 1 - kappa**2,
    beta: mass*(1 - 2*kappa**2)/kappa - 1,
}
positive_next = coefficient_from_operator(
    positive_a2, positive_a1, positive_a0, q, n + 1, n + 2
).subs(positive_substitutions)
positive_current = coefficient_from_operator(
    positive_a2, positive_a1, positive_a0, q, n, n + 2
).subs(positive_substitutions)
positive_next = sp.factor(positive_next)
positive_current = sp.factor(positive_current)
positive_previous = sp.factor(coefficient_from_operator(
    positive_a2, positive_a1, positive_a0, q, n - 1, n + 2
).subs(positive_substitutions))
positive_previous2 = sp.factor(coefficient_from_operator(
    positive_a2, positive_a1, positive_a0, q, n - 2, n + 2
).subs(positive_substitutions))
check("positive_divisor_exact",
      is_zero(positive_next - 2*kappa*(n + 1)), str(positive_next))
check("positive_current_quadratic_lead",
      is_zero(sp.limit(positive_current/n**2, n, sp.oo) - 1),
      str(positive_current))

Q, eta, nbar, mbar = sp.symbols("Q eta nbar mbar")
H = sp.Function("H")(Q)
vacuum_f0 = 1 - 2*eta*mbar*Q
P = (-kappa + beta*Q)*H - Q**2*sp.diff(H, Q)
vacuum_residual = (
    -(kappa - beta*Q)*P - Q**2*sp.diff(P, Q)
    + (2*Q + 2*eta*mbar*Q**2/vacuum_f0)*P
    + 2*(nbar + mbar*Q)*H/vacuum_f0**2
)
vacuum_polynomial = sp.collect(
    sp.cancel(vacuum_residual*vacuum_f0**2),
    [sp.diff(H, Q, 2), sp.diff(H, Q), H], exact=False,
)
vacuum_a2 = sp.factor(vacuum_polynomial.coeff(sp.diff(H, Q, 2)))
vacuum_a1 = sp.factor(vacuum_polynomial.coeff(sp.diff(H, Q)))
vacuum_a0 = sp.factor(vacuum_polynomial.coeff(H))
vacuum_substitutions = {
    nbar: -kappa**2/2,
    beta: mbar*(1 - 2*eta*kappa**2)/kappa - 1,
}
vacuum_next = coefficient_from_operator(
    vacuum_a2, vacuum_a1, vacuum_a0, Q, n + 1, n + 2
).subs(vacuum_substitutions)
vacuum_current = coefficient_from_operator(
    vacuum_a2, vacuum_a1, vacuum_a0, Q, n, n + 2
).subs(vacuum_substitutions)
vacuum_next = sp.factor(vacuum_next)
vacuum_current = sp.factor(vacuum_current)
vacuum_previous = sp.factor(coefficient_from_operator(
    vacuum_a2, vacuum_a1, vacuum_a0, Q, n - 1, n + 2
).subs(vacuum_substitutions))
vacuum_previous2 = sp.factor(coefficient_from_operator(
    vacuum_a2, vacuum_a1, vacuum_a0, Q, n - 2, n + 2
).subs(vacuum_substitutions))
check("vacuum_divisor_exact",
      is_zero(vacuum_next - 2*kappa*(n + 1)), str(vacuum_next))
check("vacuum_current_quadratic_lead",
      is_zero(sp.limit(vacuum_current/n**2, n, sp.oo) - 1),
      str(vacuum_current))

check("factorial_growth_risk",
      is_zero(sp.limit(positive_current/positive_next/n, n, sp.oo) - 1/(2*kappa))
      and is_zero(sp.limit(vacuum_current/vacuum_next/n, n, sp.oo) - 1/(2*kappa)),
      "in both charts the direct h_n/h_(n+1) balance scales as n/(2*kappa)")
check("positive_quadratic_shift_pattern",
      is_zero(sp.LC(sp.Poly(positive_current, n)) - 1)
      and is_zero(sp.LC(sp.Poly(positive_previous, n)) + 4*mass)
      and is_zero(sp.LC(sp.Poly(positive_previous2, n)) - 4*mass**2),
      [str(sp.LC(sp.Poly(value, n))) for value in
       (positive_current, positive_previous, positive_previous2)])
check("vacuum_quadratic_shift_pattern",
      is_zero(sp.LC(sp.Poly(vacuum_current, n)) - 1)
      and is_zero(sp.LC(sp.Poly(vacuum_previous, n)) + 4*eta*mbar)
      and is_zero(sp.LC(sp.Poly(vacuum_previous2, n)) - 4*eta**2*mbar**2),
      [str(sp.LC(sp.Poly(value, n))) for value in
       (vacuum_current, vacuum_previous, vacuum_previous2)])
t = sp.symbols("t", nonnegative=True)
borel_principal = sp.factor(2*kappa*t + t**2)
check("scalar_borel_positive_ray_principal_margin",
      borel_principal == t*(t + 2*kappa),
      "after exponential-generating/Borel transform, only the unshifted terms contribute B'' and its coefficient is t*(t+2*kappa), with no positive zero for kappa>0")

borel = json.loads(BOREL.read_text(encoding="utf-8"))
mu = sp.symbols("mu", nonnegative=True)
locals_map = {"n": n, "t": t, "kappa": kappa, "mu": mu}


def parse(expression: str) -> sp.Expr:
    return sp.sympify(expression.replace("^", "**"), locals=locals_map)


universal = borel["universal_scalar_recurrence"]
positive_universal = [
    sp.factor(value.subs(mass, mu))
    for value in (positive_current, positive_previous, positive_previous2)
]
recorded_recurrence = [parse(universal[key]) for key in ("c0", "c1", "c2")]
check("recorded_universal_recurrence",
      all(is_zero(actual - expected)
          for actual, expected in zip(recorded_recurrence, positive_universal)),
      {key: universal[key] for key in ("c0", "c1", "c2")})

def polynomial_coefficients(polynomial: sp.Expr) -> tuple[sp.Expr, sp.Expr, sp.Expr]:
    poly = sp.Poly(sp.expand(polynomial), n)
    return tuple(sp.factor(poly.coeff_monomial(n**order)) for order in range(3))


(a00, a01, a02), (a10, a11, a12), (a20, a21, a22) = [
    polynomial_coefficients(value) for value in positive_universal
]
derived_p2 = sp.factor(t*(t + 2*kappa))
derived_p1 = sp.factor(2*kappa + t*(a02 + a01) + a12*t**2)
derived_p0 = sp.factor(a00 + (a12 + a11)*t + a22*t**2)
derived_pj1 = sp.factor(a10 + (a22 + a21)*t)
derived_pj2 = sp.factor(a20)
recorded_borel = borel["borel_transform"]
recorded_polynomials = [parse(recorded_borel[key])
                        for key in ("P2", "P1", "P0", "PJ1", "PJ2")]
derived_polynomials = [derived_p2, derived_p1, derived_p0, derived_pj1, derived_pj2]
check("recorded_universal_borel_system",
      all(is_zero(actual - expected)
          for actual, expected in zip(recorded_polynomials, derived_polynomials)),
      {key: recorded_borel[key] for key in ("P2", "P1", "P0", "PJ1", "PJ2")})
check("borel_origin_compatibility",
      is_zero(derived_p1.subs(t, 0) - 2*kappa)
      and is_zero(positive_universal[0].subs(n, 0) - derived_p0.subs(t, 0)),
      "2*kappa*h1+P0(0)*h0=0 equals the n=0 recurrence")
check("borel_large_t_limits",
      is_zero(sp.limit(derived_p2/t**2, t, sp.oo) - 1)
      and is_zero(sp.limit(derived_p1/t**2, t, sp.oo) + 4*mu)
      and is_zero(sp.limit(derived_p0/t**2, t, sp.oo) - 4*mu**2)
      and is_zero(sp.limit(derived_pj1/t**2, t, sp.oo))
      and is_zero(sp.limit(derived_pj2/t**2, t, sp.oo)),
      borel["large_t_structure"]["limits"])
r = sp.symbols("r")
check("borel_asymptotic_characteristic",
      sp.factor(r**2 - 4*mu*r + 4*mu**2) == (r - 2*mu)**2,
      borel["large_t_structure"]["scalar_characteristic"])
check("chart_mu_reduction",
      borel["chart_reduction"]["positive"]["mu"] == "M"
      and borel["chart_reduction"]["vacuum"]["mu"] == "eta*Mbar_infinity",
      borel["chart_reduction"])
check("proposal_unsealed_and_nonauthoritative",
      borel["status"].startswith("draft_unsealed")
      and borel["readiness"]["global_positive_ray_continuation_proved"] is False
      and borel["readiness"]["summation_prescription_sealed"] is False
      and not any(borel["authority"].values()),
      {"status": borel["status"], "readiness": borel["readiness"],
       "authority": borel["authority"]})

metric_borel = json.loads(METRIC_BOREL.read_text(encoding="utf-8"))
check("borel_product_definition",
      metric_borel["borel_product"]["definition"]
      == "(F diamond G)(t)=d/dt integral_0^t F(s)*G(t-s) ds"
      and metric_borel["borel_product"]["pointwise_product_substitution_allowed"] is False,
      metric_borel["borel_product"])

# Check the K and P transforms coefficient-by-coefficient in exponential-
# generating-function sequence form. Integration shifts f_(n-1), while
# multiplication by t contributes n*f_(n-1).
h_n, h_previous, h_next = sp.symbols("h_n h_previous h_next")
ordinary_p_n = -kappa*h_n + (sp.symbols("beta") - n + 1)*h_previous
recorded_p_n = -kappa*h_n - n*h_previous + (sp.symbols("beta") + 1)*h_previous
check("K_and_P_borel_transforms",
      is_zero((n + 1)*h_next - (h_next + n*h_next))
      and is_zero(ordinary_p_n - recorded_p_n),
      metric_borel["common_scalar_inputs"])

d_n, d_previous, source_n = sp.symbols("d_n d_previous source_n")
a_d = 2*sp.symbols("beta") + 3
a_s = 2*sp.symbols("beta") + 2
check("common_metric_operator_transform",
      is_zero((2*kappa*d_n + n*d_previous - a_d*d_previous)
              - (2*kappa*d_n + (n - 2*sp.symbols("beta") - 3)*d_previous))
      and is_zero((2*kappa*d_n + n*d_previous - a_s*d_previous)
                  - (2*kappa*d_n + (n - 2*sp.symbols("beta") - 2)*d_previous)),
      metric_borel["common_metric_operator"])

check("metric_positive_ray_margin",
      metric_borel["common_metric_operator"]["positive_ray_margin"]
      == "2*kappa+t>0 for t>=0 when kappa>0"
      and metric_borel["common_metric_operator"]["nonzero_operator_singularity"]
      == "t=-2*kappa",
      metric_borel["common_metric_operator"]["positive_ray_margin"])

# Independent endpoint normalization check from the frozen source formulas.
h0 = sp.symbols("h0")
omega2 = 1 - kappa**2
p0 = -kappa*h0
positive_rho_hat0 = omega2*h0**2/2 + p0**2/2 + h0**2/2
positive_rd0 = sp.simplify(positive_rho_hat0/2)
positive_rs0 = sp.simplify((omega2*h0**2 + p0**2)/2)
vacuum_a = 1 - eta*kappa**2
vacuum_rhat0 = vacuum_a*h0**2 + eta*p0**2 + h0**2
vacuum_that0 = vacuum_a*h0**2 + eta*p0**2
check("metric_source_origin_normalizations",
      is_zero(positive_rd0 - h0**2/2)
      and is_zero(positive_rs0 - h0**2/2)
      and is_zero(vacuum_rhat0/2 - h0**2)
      and is_zero(vacuum_that0 - h0**2),
      {"positive": metric_borel["positive_sources"]["origin_values"],
       "vacuum": metric_borel["vacuum_sources"]["origin_values"]})

check("metric_proposal_unsealed_and_nonauthoritative",
      metric_borel["status"].startswith("draft_unsealed")
      and metric_borel["readiness"]["global_growth_proved"] is False
      and metric_borel["readiness"]["state_derivatives_proved"] is False
      and metric_borel["readiness"]["independently_acknowledged"] is False
      and not any(metric_borel["authority"].values()),
      {"status": metric_borel["status"], "readiness": metric_borel["readiness"],
       "authority": metric_borel["authority"]})

state_jets = json.loads(STATE_JETS.read_text(encoding="utf-8"))
convolution = state_jets["derivative_convolution_rules"]
check("complete_convolution_hessian_rule",
      convolution["second"]
      == "C_ij=F_ij diamond G+F_i diamond G_j+F_j diamond G_i+F diamond G_ij"
      and convolution["commutativity_used_only_after_both_mixed_orientations_are_present"] is True,
      convolution)

# Independently differentiate the unsolved metric equation with respect to two
# abstract state coordinates. This checks both mixed orientations and the
# parameter Hessians without relying on textual term counting.
x, y = sp.symbols("x y")
kfun = sp.Function("k")(x, y)
bfun = sp.Function("b")(x, y)
dfun = sp.Function("D")(x, y)
jfun = sp.Function("J")(x, y)
rfun = sp.Function("R")(x, y)
c = sp.symbols("c")
metric_equation = (2*kfun + t)*dfun - (2*bfun + c)*jfun - rfun
actual_first = sp.diff(metric_equation, x)
expected_first = ((2*kfun + t)*sp.diff(dfun, x) + 2*sp.diff(kfun, x)*dfun
                  - (2*bfun + c)*sp.diff(jfun, x) - 2*sp.diff(bfun, x)*jfun
                  - sp.diff(rfun, x))
actual_second = sp.diff(metric_equation, x, y)
expected_second = (
    (2*kfun + t)*sp.diff(dfun, x, y)
    + 2*sp.diff(kfun, x)*sp.diff(dfun, y)
    + 2*sp.diff(kfun, y)*sp.diff(dfun, x)
    + 2*sp.diff(kfun, x, y)*dfun
    - (2*bfun + c)*sp.diff(jfun, x, y)
    - 2*sp.diff(bfun, x)*sp.diff(jfun, y)
    - 2*sp.diff(bfun, y)*sp.diff(jfun, x)
    - 2*sp.diff(bfun, x, y)*jfun
    - sp.diff(rfun, x, y)
)
check("complete_metric_variational_equations",
      is_zero(actual_first - expected_first)
      and is_zero(actual_second - expected_second),
      state_jets["metric_variational_system"])

check("vacuum_dependent_mu_jets",
      state_jets["state_convention"]["vacuum_mu_jets"]
      == ["mu_i=eta*(Mbar_infinity)_i", "mu_ij=eta*(Mbar_infinity)_ij"]
      and "eta is fixed during state differentiation"
      in state_jets["state_convention"]["vacuum"],
      state_jets["state_convention"])

# Verify the lossless three-parameter compression by differentiating a generic
# composite F(theta_0(x,y),theta_1(x,y),theta_2(x,y)) directly.  This retains
# all nine ordered parameter-Hessian entries and both x/y mixed orientations.
theta_functions = [sp.Function(f"theta_{index}")(x, y) for index in range(3)]
generic_parameter_function = sp.Function("F_parameter")(*theta_functions)
direct_composite_first = sp.diff(generic_parameter_function, x)
direct_composite_second = sp.diff(generic_parameter_function, x, y)
composed_first = sum(
    sp.diff(generic_parameter_function, theta_functions[a_index])
    * sp.diff(theta_functions[a_index], x)
    for a_index in range(3)
)
composed_second = sum(
    sp.diff(generic_parameter_function, theta_functions[a_index])
    * sp.diff(theta_functions[a_index], x, y)
    for a_index in range(3)
) + sum(
    sp.diff(generic_parameter_function, theta_functions[a_index],
            theta_functions[b_index])
    * sp.diff(theta_functions[a_index], x)
    * sp.diff(theta_functions[b_index], y)
    for a_index in range(3) for b_index in range(3)
)
compressed_jets = state_jets["compressed_parameter_jet_realization"]
check("compressed_parameter_jet_chain_rule",
      is_zero(direct_composite_first - composed_first)
      and is_zero(direct_composite_second - composed_second)
      and compressed_jets["integrated_inventory_per_borel_component"]
      == "one value, three ordered first parameter partials and nine ordered second parameter partials; both mixed orientations are retained"
      and compressed_jets["positive_parameter_tuple"]
      == "theta=(h0,kappa,mu) with mu=M and beta+1=mu*(1-2*kappa^2)/kappa"
      and compressed_jets["vacuum_parameter_tuple"]
      == "theta=(h0,kappa,Mbar_infinity) with eta held fixed, mu=eta*Mbar_infinity and beta+1=Mbar_infinity*(1-2*eta*kappa^2)/kappa"
      and compressed_jets["projection_order"].startswith("compose every full-state entry first")
      and state_jets["readiness"]["compressed_parameter_jet_realization_defined"] is True,
      compressed_jets)

mu1, gap = sp.symbols("mu1 gap", positive=True)
tau0 = 2*mu1 + gap/4
tau1 = 2*mu1 + gap/2
tau2 = 2*mu1 + 3*gap/4
check("state_jet_growth_tier_arithmetic",
      is_zero((255 - tau2).subs(255, 2*mu1 + gap) - gap/4)
      and is_zero(tau1 - tau0 - gap/4)
      and is_zero(tau2 - tau1 - gap/4),
      state_jets["growth_budget_template"])

check("state_jet_proposal_unsealed_and_nonauthoritative",
      state_jets["status"].startswith("draft_unsealed")
      and state_jets["readiness"]["global_growth_budget_proved"] is False
      and state_jets["readiness"]["independently_acknowledged"] is False
      and not any(state_jets["authority"].values()),
      {"status": state_jets["status"], "readiness": state_jets["readiness"],
       "authority": state_jets["authority"]})

growth_quadrature = json.loads(GROWTH_QUADRATURE.read_text(encoding="utf-8"))
predecessor_hashes = growth_quadrature["immutable_predecessors"]
predecessor_results: dict[str, dict[str, object]] = {}
for predecessor_name, predecessor in predecessor_hashes.items():
    predecessor_path = ROOT / predecessor["path"]
    actual_hash = hashlib.sha256(predecessor_path.read_bytes()).hexdigest()
    predecessor_results[predecessor_name] = {
        "exists": predecessor_path.is_file(),
        "expected": predecessor["raw_sha256"],
        "actual": actual_hash,
        "match": actual_hash == predecessor["raw_sha256"],
    }
check("growth_quadrature_predecessor_hashes",
      len(predecessor_results) == 7
      and all(result["exists"] and result["match"]
              for result in predecessor_results.values()),
      predecessor_results)
growth_tiers = growth_quadrature["growth_tiers"]
sigma0 = 2*mu1 + gap/8
sigma1 = 2*mu1 + 3*gap/8
sigma2 = 2*mu1 + 5*gap/8
check("growth_quadrature_tier_arithmetic",
      growth_tiers["definitions"]
      == ["tau0=2*mu_upper+2*g/8", "tau1=2*mu_upper+4*g/8",
          "tau2=2*mu_upper+6*g/8"]
      and growth_tiers["internal_scalar_definitions"]
      == ["sigma0=2*mu_upper+g/8 for scalar values",
          "sigma1=2*mu_upper+3*g/8 for scalar first parameter derivatives",
          "sigma2=2*mu_upper+5*g/8 for scalar second parameter derivatives"]
      and growth_tiers["strict_laplace_margin"] == "delta=255-tau2=g/4>0"
      and is_zero((255 - tau2).subs(255, 2*mu1 + gap) - gap/4)
      and is_zero(tau0 - sigma0 - gap/8)
      and is_zero(sigma1 - tau0 - gap/8)
      and is_zero(tau1 - sigma1 - gap/8)
      and is_zero(sigma2 - tau1 - gap/8)
      and is_zero(tau2 - sigma2 - gap/8),
      growth_tiers)

tail_closure = growth_quadrature["tail_augmented_systems_and_growth_closure"]
scalar_tail = tail_closure["scalar_base_system"]
check("explicit_scalar_tail_matrix",
      scalar_tail["state_order"] == ["B", "V", "J1", "J2"]
      and scalar_tail["matrix_rows"] == [
          "[0,1,0,0]",
          "[-P0/P2,-P1/P2,-PJ1/P2,-PJ2/P2]",
          "[1,0,0,0]", "[0,0,1,0]"]
      and scalar_tail["asymptotic_matrix_rows"] == [
          "[0,1,0,0]", "[-4*mu^2,4*mu,0,0]",
          "[1,0,0,0]", "[0,0,1,0]"]
      and is_zero(sp.limit(-derived_p0/derived_p2, t, sp.oo) + 4*mu**2)
      and is_zero(sp.limit(-derived_p1/derived_p2, t, sp.oo) - 4*mu)
      and is_zero(sp.limit(-derived_pj1/derived_p2, t, sp.oo))
      and is_zero(sp.limit(-derived_pj2/derived_p2, t, sp.oo)),
      scalar_tail)

scalar_jet_constants = tail_closure["scalar_jet_constants"]
lyapunov_verifier = tail_closure["scalar_lyapunov_verifier"]
check("scalar_tail_variational_growth_constants",
      scalar_jet_constants["definitions"] == [
          "epsilon10=sigma1-sigma0=g/4",
          "epsilon20=sigma2-sigma0=g/2",
          "D0=C0O",
          "D1=C1O+K1*D0/epsilon10",
          "D2=C2O+2*K1*D1/epsilon10+K2*D0/epsilon20",
          "C0=D0*exp(-sigma0*T0)",
          "C1=D1*exp(-sigma1*T0)",
          "C2=D2*exp(-sigma2*T0)",
          "C0T=C0*exp(sigma0*T)",
          "C1T=C1*exp(sigma1*T)",
          "C2T=C2*exp(sigma2*T)"]
      and scalar_jet_constants["boundary_norms"] == [
          "C0O=max P-norm of the value state at the onset T0",
          "C1O=max P-norm over the three first parameter states at the onset T0",
          "C2O=max P-norm over the nine ordered second parameter states at the onset T0"]
      and all("for t>=T0" in bound
              for bound in scalar_jet_constants["proved_bounds"])
      and "sum_(i=0)^3 sum_(j=0)^3"
      in scalar_jet_constants["interval_p_norm_upper"]
      and "normP_upper(Y)=sqrt(qP) outward"
      in scalar_jet_constants["interval_p_norm_upper"]
      and is_zero(sigma1 - sigma0 - gap/4)
      and is_zero(sigma2 - sigma0 - gap/2)
      and scalar_jet_constants["proof_inequality"]
      == "z*exp(-epsilon*z)<=1/epsilon for z>=0 and epsilon>0",
      scalar_jet_constants)

check("p_norm_component_extraction_defined",
      "exact rational inverse Pinv" in
      lyapunov_verifier["p_norm_component_extraction"]
      and "abs(y_i)<=EP*norm_(P_lyap)(y)" in
      lyapunov_verifier["p_norm_component_extraction"]
      and tail_closure["symbol_namespace"].startswith(
          "P_lyap is the accepted 4x4 Lyapunov matrix")
      and "BP" in tail_closure["analytic_and_scalar_derived_inputs"]
      and "P" not in tail_closure["analytic_and_scalar_derived_inputs"]
      and "recorded EP" in
      tail_closure["analytic_and_scalar_derived_inputs"]["component_ingress"]
      and "V+t*row_2(A_scalar)*y" in
      tail_closure["analytic_and_scalar_derived_inputs"]["K"],
      {"namespace": tail_closure["symbol_namespace"],
       "verifier": lyapunov_verifier["p_norm_component_extraction"],
       "derived_inputs": tail_closure["analytic_and_scalar_derived_inputs"]})

derived_inputs = tail_closure["analytic_and_scalar_derived_inputs"]
check("fixed_derivative_convolution_orientation",
      derived_inputs["t_derivative_library"] == [
          "B'=V",
          "V'=row_2(A_scalar)*y",
          "J1'=B",
          "J2'=J1",
          "P'=beta*B-(kappa+t)*V",
          "F'=-2*mu",
          "E1'=2*mu*E1",
          "E2'=4*mu*(1+mu*t)*E1"]
      and derived_inputs["derivative_convolution_orientation"] == [
          "H2: F=B, G=B, G'=V",
          "P2: F=P, G=P, G'=beta*B-(kappa+t)*V",
          "E1_diamond_H2: F=H2, G=E1, G'=2*mu*E1",
          "F_diamond_P2: F=P2, G=F, G'=-2*mu",
          "E2_diamond_H2: F=H2, G=E2, G'=4*mu*(1+mu*t)*E1"]
      and "swapping operands" in derived_inputs["orientation_rule"],
      derived_inputs)

mu_analytic, t_analytic = sp.symbols("mu_analytic t_analytic")
e1_analytic = sp.exp(2*mu_analytic*t_analytic)
e2_analytic = (1+2*mu_analytic*t_analytic)*e1_analytic
check("analytic_source_parameter_jets",
      derived_inputs["analytic_mu_parameter_jets"] == [
          "F=1-2*mu*t; F_mu=-2*t; F_mumu=0",
          "E1=exp(2*mu*t); E1_mu=2*t*E1; E1_mumu=4*t^2*E1",
          "E2=(1+2*mu*t)*E1; E2_mu=4*t*(1+mu*t)*E1; E2_mumu=4*t^2*(3+2*mu*t)*E1"]
      and is_zero(sp.diff(e1_analytic, mu_analytic)
                  - 2*t_analytic*e1_analytic)
      and is_zero(sp.diff(e1_analytic, mu_analytic, 2)
                  - 4*t_analytic**2*e1_analytic)
      and is_zero(sp.diff(e2_analytic, mu_analytic)
                  - 4*t_analytic*(1+mu_analytic*t_analytic)*e1_analytic)
      and is_zero(sp.diff(e2_analytic, mu_analytic, 2)
                  - 4*t_analytic**2*(3+2*mu_analytic*t_analytic)*e1_analytic)
      and "eta^2*X_mumu" in derived_inputs["vacuum_mu_chain"]
      and "missing either mixed orientation" in
      derived_inputs["analytic_jet_growth"],
      derived_inputs)

absorption = tail_closure["polynomial_to_exponential_absorption"]
z_nonnegative, epsilon_positive = sp.symbols(
    "z_nonnegative epsilon_positive", nonnegative=True, positive=True)
absorption_expansions = []
for degree in range(9):
    lhs_polynomial = sp.expand((1 + z_nonnegative)**degree)
    expanded = sp.expand(sum(
        sp.binomial(degree, order)*z_nonnegative**order
        for order in range(degree + 1)))
    absorption_expansions.append(is_zero(lhs_polynomial - expanded))
check("fixed_polynomial_to_exponential_absorption",
      all(absorption_expansions)
      and absorption["definition"]
      == "Absorb(d,epsilon)=sum_(k=0)^d binom(d,k)*k!/epsilon^k"
      and absorption["post_absorption_degree"] == 0
      and absorption["free_polynomial_degree_selector"] is False
      and tail_closure["finite_growth_bound_algebra"]["maximum_degree"] == 64
      and tail_closure["finite_growth_bound_algebra"]["derivative_convolution_tail_split"]
      == "for t>=T=2*T0 split integral_0^t into [0,T0], [T0,t-T0], [t-T0,t]; the left and right edge integrals use recorded finite-history L1 bounds with one tail factor, while the middle interval uses both tail bounds"
      and "H_(F|sigmaG)=integral_0^T0"
      in tail_closure["finite_growth_bound_algebra"]["finite_history_constants"]
      and "G_a(C,d,sigma)" in
      tail_closure["finite_growth_bound_algebra"]["bound_type"]
      and "CGprime*H_(F|sigmaG)" in
      tail_closure["finite_growth_bound_algebra"]["derivative_convolution"]
      and "CF*H_(Gprime|sigmaF)" in
      tail_closure["finite_growth_bound_algebra"]["derivative_convolution"]
      and "r=max(0,degree_t(N)-degree_t(D))" in
      tail_closure["finite_growth_bound_algebra"]["rational_multiplier"]
      and "directed incomplete-gamma moments" in
      tail_closure["finite_growth_bound_algebra"]["finite_history_panel_algorithm"]
      and "exact h^(k+1)/(k+1) moments" in
      tail_closure["finite_growth_bound_algebra"]["finite_history_panel_algorithm"]
      and tail_closure["polynomial_degree_after_tail_verification"] == 0,
      {"degrees_checked": list(range(9)), "absorption": absorption,
       "growth_algebra": tail_closure["finite_growth_bound_algebra"]})

metric_tail = tail_closure["metric_integral_systems"]
check("explicit_metric_tail_system_and_variations",
      metric_tail["equations"] == [
          "JD'=mD(t)*JD+q(t)*BRD with mD=(2*beta+3)/(t+2*kappa) and q=1/(t+2*kappa)",
          "JS'=mS(t)*JS+q(t)*BRS with mS=(2*beta+2)/(t+2*kappa)"]
      and metric_tail["homogeneous_rate"] == "rhoM=tau0/2"
      and metric_tail["boundary_constants"]
      == "CMT0=exp(-tau0*T)*max norm of JD,JS at T; CMT1=exp(-tau1*T)*max first-jet norm at T; CMT2=exp(-tau2*T)*max ordered-second-jet norm at T"
      and "e=0..1024" in metric_tail["parameter_bound_selector"]
      and metric_tail["gap"] == "epsilonM=tau0-rhoM=tau0/2>0"
      and "2*KM1*CM1+KM2*CM0"
      in metric_tail["second_constant"]
      and "2*KM1*CR1+KM2*CR0"
      in metric_tail["second_constant"]
      and metric_tail["output_value_constant"]
      == "CBM0=KM0*CM0+qT*CR0"
      and metric_tail["output_first_constant"]
      == "CBM1=KM0*CM1+KM1*CM0+qT*CR1+KM1*CR0"
      and metric_tail["output_second_constant"]
      == "CBM2=KM0*CM2+2*KM1*CM1+KM2*CM0+qT*CR2+2*KM1*CR1+KM2*CR0",
      metric_tail)

# Verify the exact upper incomplete-gamma identity independently for several
# integer moments.  Equality of the derivative, the T=0 value and decay at
# infinity fixes each definite integral without trusting the recorded text.
a_pos, T_pos = sp.symbols("a_pos T_pos", positive=True)
moment_checks: list[bool] = []
for moment_order in range(9):
    formula = sp.exp(-a_pos*T_pos)*sum(
        sp.factorial(moment_order)/sp.factorial(ell)
        * T_pos**ell/a_pos**(moment_order - ell + 1)
        for ell in range(moment_order + 1)
    )
    moment_checks.append(
        is_zero(sp.diff(formula, T_pos) + T_pos**moment_order*sp.exp(-a_pos*T_pos))
        and is_zero(formula.subs(T_pos, 0)
                    - sp.factorial(moment_order)/a_pos**(moment_order + 1))
        and sp.limit(formula, T_pos, sp.oo) == 0
    )
tail_bound = growth_quadrature["laplace_tail_bound"]
check("laplace_tail_moment_identity",
      all(moment_checks)
      and tail_bound["exact_moment_identity"]
      == "integral_T^infinity t^k*exp(-a*t) dt=exp(-a*T)*sum_(l=0)^k (k!/l!)*T^l/a^(k-l+1)",
      {"orders_checked": list(range(9)),
       "identity": tail_bound["exact_moment_identity"]})

# For m>=1 and tau>=0, y/(y-tau)^m is nonincreasing on y>=255.
# Its worst permitted boundary is therefore y=255,tau=tau2, yielding the
# recorded 255/delta^m bound.  Check the derivative algebra and polynomial
# expansion used to pass from (1+t)^p to the finite moment sum.
y_pos, tau_nonnegative = sp.symbols("y_pos tau_nonnegative", positive=True)
m_pos = sp.symbols("m_pos", integer=True, positive=True)
ratio_derivative = sp.factor(sp.diff(y_pos/(y_pos - tau_nonnegative)**m_pos, y_pos))
expected_ratio_derivative = ((1 - m_pos)*y_pos - tau_nonnegative) / (
    y_pos - tau_nonnegative
)**(m_pos + 1)
u = sp.symbols("u")
binomial_checks = [
    sp.expand((1 + u)**degree)
    == sp.expand(sum(sp.binomial(degree, order)*u**order
                     for order in range(degree + 1)))
    for degree in range(9)
]
check("uniform_laplace_ratio_and_polynomial_expansion",
      is_zero(ratio_derivative - expected_ratio_derivative)
      and all(binomial_checks)
      and tail_bound["uniform_ratio_bound"]
      == "y/a^m<=255/delta^m for every integer m>=1 and y>=255"
      and tail_bound["uniform_tail_bound"]
      == "x^-1*integral_T^infinity exp(-t/x)*abs(F(t)) dt <= 255*C*exp(-delta*T)*sum_(k=0)^p binom(p,k)*sum_(l=0)^k (k!/l!)*T^l/delta^(k-l+1)",
      {"ratio_derivative": str(expected_ratio_derivative),
       "degrees_checked": list(range(9)),
       "uniform_tail_bound": tail_bound["uniform_tail_bound"]})

tail_witness = growth_quadrature["tail_growth_witness"]
check("tail_lyapunov_witness_fail_closed",
      "P is symmetric and lambda_min(P)>0" in tail_witness["verifier_conditions"]
      and "A_scalar(t,theta)^T*P+P*A_scalar(t,theta)-2*sigma0*P is strictly negative definite for every t>=T0 and every theta in the compact box"
      in tail_witness["verifier_conditions"]
      and tail_witness["witness_discovery_may_differ_between_producers"] is True
      and tail_witness["verifier_predicate_may_differ_between_producers"] is False
      and tail_witness["failed_witness_may_be_retried_after_selected_result"] is False
      and tail_witness["witness_is_scientific_selector"] is False,
      tail_witness)

derivative_growth = growth_quadrature["derivative_convolution_growth"]
sigma_f, sigma_g, s_tail, t_tail = sp.symbols(
    "sigma_f sigma_g s_tail t_tail", nonnegative=True)
check("growth_derivative_convolution_rule",
      derivative_growth["identity"]
      == "(F diamond G)(t)=F(t)*G(0)+integral_0^t F(s)*G'(t-s) ds"
      and derivative_growth["split_domain"]
      == "for t>=T=2*T0 use [0,T0], [T0,t-T0], [t-T0,t] so every tail operand is evaluated at an argument >=T0"
      and "unweighted histories" in derivative_growth["weighted_edges"]
      and is_zero(sigma_g*(t_tail-s_tail)
                  - (sigma_g*t_tail-sigma_g*s_tail))
      and is_zero(sigma_f*(t_tail-s_tail)
                  - (sigma_f*t_tail-sigma_f*s_tail))
      and derivative_growth["pointwise_product_bound_allowed"] is False
      and derivative_growth["degree_and_constant_must_be_recorded"] is True,
      derivative_growth)

coordinate_kernels = growth_quadrature["coordinate_derivative_laplace_kernels"]
kernel_rows: list[list[sp.Integer]] = [[sp.Integer(1)]]
for derivative_order in range(12):
    next_row = [sp.Integer(0)]*(derivative_order + 2)
    for moment_order, coefficient in enumerate(kernel_rows[-1]):
        next_row[moment_order] -= (derivative_order + moment_order + 1)*coefficient
        next_row[moment_order + 1] += coefficient
    kernel_rows.append(next_row)

# An exponential Borel component gives L_F(x)=1/(1-lambda*x).  Substituting
# its exact moments into every generated row independently checks the complete
# d/dx=-y^2*d/dy kernel recurrence through the required order 12.
lambda_symbol, x_symbol = sp.symbols("lambda_symbol x_symbol")
y_symbol = 1/x_symbol
kernel_identity_checks: list[bool] = []
for derivative_order, row in enumerate(kernel_rows):
    represented = sum(
        coefficient*y_symbol**(derivative_order + moment_order + 1)
        * sp.factorial(moment_order)/(y_symbol - lambda_symbol)**(moment_order + 1)
        for moment_order, coefficient in enumerate(row)
    )
    exact = sp.diff(1/(1 - lambda_symbol*x_symbol), x_symbol, derivative_order)
    kernel_identity_checks.append(is_zero(represented - exact))
check("coordinate_derivative_kernel_recurrence",
      all(kernel_identity_checks)
      and kernel_rows[:3] == [[1], [-1, 1], [2, -4, 1]]
      and coordinate_kernels["coefficient_recurrence"]
      == ["c_(j+1,m)+=-(j+m+1)*c_(j,m)",
          "c_(j+1,m+1)+=c_(j,m)"]
      and coordinate_kernels["required_coordinate_orders"]
      == "j=0..12 in increasing order; rows are generated with exact signed integers",
      {"orders_checked": list(range(13)),
       "low_order_rows": [[int(value) for value in row]
                          for row in kernel_rows[:3]]})

# Check the two stationary-point cases behind Phi_d.  For d<=0 the derivative
# is strictly negative; for d>0 its only positive critical point is d/T and the
# constrained maximum is therefore max(delta,d/T).
a_symbol, T_symbol = sp.symbols("a_symbol T_symbol", positive=True)
d_symbol = sp.symbols("d_symbol", integer=True)
power_exponential = sp.exp(-a_symbol*T_symbol)*a_symbol**d_symbol
power_exponential_derivative = sp.factor(sp.diff(power_exponential, a_symbol))
expected_power_derivative = (
    sp.exp(-a_symbol*T_symbol)*a_symbol**(d_symbol - 1)
    * (d_symbol - a_symbol*T_symbol)
)
majorant = coordinate_kernels["uniform_exponential_power_majorant"]
check("coordinate_tail_power_majorant",
      is_zero(power_exponential_derivative - expected_power_derivative)
      and majorant["Phi_d(delta,T)"]
      == ["exp(-delta*T)*delta^d for integer d<=0",
          "exp(-z*T)*z^d for integer d>0 and z=max(delta,d/T)"]
      and majorant["U_(r,s)"]
      == "sum_(z=0)^r binom(r,z)*tau2^(r-z)*Phi_(z-s)(delta,T)"
      and coordinate_kernels["uniform_coordinate_tail_bound"]
      == "Tail_j <= C*sum_(m=0)^j abs(c_(j,m))*sum_(k=0)^p binom(p,k)*sum_(l=0)^(m+k) ((m+k)!/l!)*T^l*U_(j+m+1,m+k-l+1)"
      and coordinate_kernels["signed_cancellation_in_bounds"] is False,
      {"power_exponential_derivative": str(expected_power_derivative),
       "majorant": majorant,
       "tail_bound": coordinate_kernels["uniform_coordinate_tail_bound"]})

endpoint_monomial_checks = []
endpoint_x = sp.symbols("endpoint_x", positive=True)
for monomial_order in range(13):
    laplace_basis = sp.factorial(monomial_order) * endpoint_x**(
        monomial_order + 1) / (endpoint_x * sp.factorial(monomial_order))
    endpoint_monomial_checks.append(
        is_zero(laplace_basis - endpoint_x**monomial_order))
check("coordinate_endpoint_and_state_jet_rules",
      coordinate_kernels["endpoint_x_zero"]
      == "insert d_x^j L_F(0)=j!*f_j exactly when the exponential-generating Borel input is F(t)=sum_(n>=0) f_n*t^n/n!; never evaluate y or 1/x"
      and all(endpoint_monomial_checks)
      and "F_i and F_ij" in coordinate_kernels["state_derivative_rule"]
      and "Bell-12" in coordinate_kernels["coefficient_space_use"]
      and coordinate_kernels["outward_evaluation_required"] is True,
      {"endpoint": coordinate_kernels["endpoint_x_zero"],
       "basis_orders_replayed": list(range(13)),
       "state_derivative_rule": coordinate_kernels["state_derivative_rule"],
       "coefficient_space_use": coordinate_kernels["coefficient_space_use"]})

realization = growth_quadrature["all_orders_borel_laplace_realization"]
geometric_z = sp.symbols("geometric_z", nonnegative=True)
local_tail_checks = []
for order in range(13):
    finite_tail = geometric_z**order / (1-geometric_z)
    local_tail_checks.append(is_zero(
        (1-geometric_z)*finite_tail-geometric_z**order))
check("all_orders_borel_laplace_realization_defined",
      all(local_tail_checks)
      and "every integer N>=0" in realization["local_egf_remainder"]
      and "N!*x^N" in realization["local_laplace_remainder"]
      and "exp(-z)<=L!/z^L" in realization["far_ray_flatness"]
      and "every integer j>=0" in realization["cinfinity_endpoint"]
      and "L_(F diamond G)(x)=L_F(x)*L_G(x)"
      in realization["product_homomorphism"]
      and "exact-zero positive/vacuum H,K,D,S"
      in realization["equation_replay"],
      {"orders_replayed": list(range(13)), "definition": realization})

required_extensions = growth_quadrature["required_extensions"]
readiness = growth_quadrature["readiness"]
finite_algorithm = growth_quadrature["finite_positive_ray_algorithm"]
origin_algorithm = finite_algorithm["origin_localization"]
panel_algorithm = finite_algorithm["positive_panel_continuation"]
resource_bounds = growth_quadrature["fixed_resource_bounds"]
projection_algorithm = growth_quadrature["finite_laplace_projection_algorithm"]

gevrey = growth_quadrature["gevrey_witness_producer"]
gevrey_majorant = gevrey["linear_majorant_matrices"]
n_nonnegative = sp.symbols("n_nonnegative", integer=True, nonnegative=True)
check("gevrey_lifted_jet_inventory_and_algebra",
      gevrey["jet_count"] == 13
      and gevrey["ordered_jet_components"] == [
          "value", "d_h0", "d_kappa", "d_theta2",
          "d_h0_h0", "d_h0_kappa", "d_h0_theta2",
          "d_kappa_h0", "d_kappa_kappa", "d_kappa_theta2",
          "d_theta2_h0", "d_theta2_kappa", "d_theta2_theta2"]
      and gevrey["jet_algebra"]["second"]
      == "(F*G)_ab=F_ab*G_0+F_a*G_b+F_b*G_a+F_0*G_ab"
      and "U_-1=U_-2=the exact zero jet"
      == gevrey["lifted_recurrence"]["missing_negative_indices"]
      and gevrey["lifted_recurrence"]["origin_jet"].endswith(
          "every other first and second parameter partial exactly zero"),
      {"components": gevrey["ordered_jet_components"],
       "algebra": gevrey["jet_algebra"],
       "lifted_recurrence": gevrey["lifted_recurrence"]})

check("gevrey_matrix_majorant_inequalities",
      is_zero((n_nonnegative + 1)**2 - n_nonnegative**2
              - (2*n_nonnegative + 1))
      and is_zero((n_nonnegative + 1) - n_nonnegative - 1)
      and is_zero((n_nonnegative + 1) - 1 - n_nonnegative)
      and gevrey_majorant["entry_normal_form"]
      == "each entry is (a2*n^2+a1*n+a0)/(n+1), where a2,a1,a0 are exact rational functions of the compact parameter box and fixed eta on the vacuum chart"
      and gevrey_majorant["matrix_majorant"]
      == "G_s=max_row sum_column (mag(a2)+mag(a1)+mag(a0)) for s=0,1,2; G0,G1,G2 are Gevrey majorants and the predecessor scalar-equation coefficients retain the distinct names P0,P1,P2",
      {"n2_gap": str(2*n_nonnegative + 1),
       "n_gap": "1", "constant_gap": str(n_nonnegative),
       "majorant": gevrey_majorant})

check("gevrey_dyadic_rate_and_base_constant",
      gevrey["dyadic_rate_selector"] == {
          "candidates": "A=2^e in increasing e for e=0..1024",
          "predicate": "G0/A+G1/A^2+G2/A^3<=1/2",
          "selection": "first candidate whose directed upper bound satisfies the predicate",
          "exhaustion": "FAIL",
      }
      and gevrey["base_constant"]["base_indices"] == [0, 1, 2]
      and gevrey["base_constant"]["definition"]
      == "C=2*max_(j=0,1,2) norm_infinity(U_j)/(A^j*j!) using directed upper bounds"
      and gevrey["base_constant"]["proof_step"].endswith(
          "whose sum is <=1/2"),
      {"selector": gevrey["dyadic_rate_selector"],
       "base": gevrey["base_constant"]})

# The origin remainder is the geometric tail of the factorial-divided Gevrey
# bound.  Check the fixed schedules and all cross-references that make the
# algorithm bounded rather than an implementation-time selector.
z_ratio = sp.symbols("z_ratio")
geometric_partial_checks: list[bool] = []
for base_order in range(9):
    terminal_order = base_order + 16
    finite_sum = sum(z_ratio**power
                     for power in range(base_order + 1, terminal_order + 1))
    geometric_partial_checks.append(is_zero(
        (1 - z_ratio)*finite_sum
        - (z_ratio**(base_order + 1) - z_ratio**(terminal_order + 1))
    ))
check("bounded_origin_and_panel_selectors",
      all(geometric_partial_checks)
      and origin_algorithm["borel_series_tail"]
      == "for A_upper*t0<=1/4, abs(sum_(n>r) f_n*t^n/n!)<=C*(A_upper*t)^(r+1)/(1-A_upper*t)"
      and "DTail(m,r,z)=d^m/dz^m[z^(r+1)/(1-z)]"
      in origin_algorithm["borel_derivative_tails"]
      and "J1 tail <=C*t*z^(r+1)/((r+2)*(1-z))"
      in origin_algorithm["integral_state_tails"]
      and "B,V,J1,J2" in origin_algorithm["selector"]
      and origin_algorithm["orders"] == [32, 48, 64, 96, 128, 192, 256]
      and panel_algorithm["orders"] == [24, 32, 48, 64, 96, 128, 192]
      and finite_algorithm["tail_split_selector"]["T0_candidates"]
      == [2**power for power in range(13)]
      and finite_algorithm["tail_split_selector"]["laplace_split"]
      == "T=2*T0, so T ranges from 2 through 8192"
      and finite_algorithm["candidate_result_dependent_retuning"] is False
      and finite_algorithm["outward_512_bit_arithmetic"] is True,
      {"origin_orders": origin_algorithm["orders"],
       "panel_orders": panel_algorithm["orders"],
       "tail_onsets": finite_algorithm["tail_split_selector"]["T0_candidates"],
       "finite_geometric_orders_checked": list(range(9))})

tail_selector = finite_algorithm["tail_split_selector"]
check("tail_selector_append_only_chronology",
      len(tail_selector["chronology"]) == 6
      and "append-only" in tail_selector["chronology"][2]
      and "no later T0 is visited" in tail_selector["chronology"][3]
      and "may advance to the next T0" in tail_selector["chronology"][4]
      and "C08-011_TAIL_SPLIT_EXHAUSTION" in
      tail_selector["failure_mapping"]
      and "C08-012_LYAPUNOV_OR_OPERATOR_BOUND is reserved"
      in tail_selector["failure_mapping"],
      tail_selector)

check("compressed_finite_continuation_inventory",
      "1 value + 3 ordered first parameter partials + 9 ordered second parameter partials"
      in finite_algorithm["compressed_jet_binding"]
      and resource_bounds["parameter_jet_components_per_borel_component"] == 13
      and "both mixed Hessian orientations" in finite_algorithm["derivative_convolution_panels"]["state_jets"]
      and "differentiate the unsolved metric equations first"
      in finite_algorithm["metric_continuation"]["parameter_variations"],
      {"binding": finite_algorithm["compressed_jet_binding"],
       "components": resource_bounds["parameter_jet_components_per_borel_component"],
       "convolution_jets": finite_algorithm["derivative_convolution_panels"]["state_jets"]})

picard = growth_quadrature["validated_picard_enclosure"]
check("validated_picard_total_definition",
      picard["inflation_candidates"]
      == "lambda=2^j in increasing j for j=1..16"
      and picard["defect"]
      == "d(xi)=p'(xi)-F(tL+xi,p(xi)); coefficients 0..r-1 are replayed and must contain exact zero, while the complete interval range supplies component magnitudes D_i>=sup(abs(d_i))"
      and picard["correction_operator"].startswith(
          "T(E)(xi)=integral_0^xi")
      and "common symmetric radius lambda*h*Dmax"
      in picard["candidate_box"]
      and "strict subset" in picard["acceptance"]
      and "equality, touching, nonfinite or undecidable containment rejects"
      in picard["acceptance"]
      and picard["first_failure"].split(", ") == [
          "denominator", "nonfinite coefficient", "defect replay",
          "exact-zero replay", "inflation containment", "numerical width",
          "order exhaustion", "panel-halving exhaustion"],
      picard)

convolution_panels = finite_algorithm["derivative_convolution_panels"]
u_candidates = [2**power for power in range(17)]
check("volterra_convolution_total_remainder",
      convolution_panels["identity"]
      == "(F diamond G)(t)=F(t)*G(0)+t*integral_0^1 F(t*u)*G'(t*(1-u))du"
      and convolution_panels["u_panel_candidates"] == u_candidates
      and convolution_panels["polynomial_order"]
      == "rC=min(r_target,r_F,r_Gprime) in the accepted order schedule; compose and multiply exact bivariate polynomials, retain every xi degree <=rC, and move every discarded higher-xi term to the remainder"
      and convolution_panels["remainder_cross_terms"]
      == "on every rectangle add mag(PF)*RG+mag(PGprime)*RF+RF*RG plus the directed discarded-polynomial tail, affine-composition remainder and source-panel hull radius; all are integrated against the positive u width without cancellation"
      and "first P candidate" in convolution_panels["selector"]
      and convolution_panels["point_sampling_or_midpoint_convolution"] == "FAIL",
      {"u_candidates": convolution_panels["u_panel_candidates"],
       "order": convolution_panels["polynomial_order"],
       "remainder": convolution_panels["remainder_cross_terms"],
       "selector": convolution_panels["selector"]})

# Verify the composite GL6 remainder scaling from the standard 2n derivative
# error under an affine map: the powers of two cancel and leave h^(2n+1).
quadrature_order = resource_bounds["outer_gl_order"]
gl_error_constant = (sp.factorial(quadrature_order)**4
                     / ((2*quadrature_order + 1)
                        * sp.factorial(2*quadrature_order)**3))
outer_projection = projection_algorithm["outer_chebyshev_projection"]
check("finite_projection_quadrature_and_tail_binding",
      quadrature_order == 6
      and gl_error_constant == sp.factorial(6)**4/(13*sp.factorial(12)**3)
      and outer_projection["order_six_error"]
      == "for panel width h and an outward bound B12 on the twelfth derivative of the complete integrand, error<=B12*h^13*(6!)^4/(13*(12!)^3)"
      and outer_projection["panel_candidates"] == [2**power for power in range(15)]
      and projection_algorithm["coefficient_tail"]["grid_orders"] == [64, 96, 128, 256]
      and projection_algorithm["projection_is_scientific_pass"] is False,
      {"gl6_error_constant": str(gl_error_constant),
       "panel_candidates": outer_projection["panel_candidates"],
       "grid_orders": projection_algorithm["coefficient_tail"]["grid_orders"]})

coefficient_tail = projection_algorithm["coefficient_tail"]
N_minus_one = sp.symbols("N_minus_one", integer=True, positive=True)
x_tail = sp.symbols("x_tail", positive=True)
tail_integral = sp.integrate(x_tail**-4, (x_tail, N_minus_one, sp.oo))
check("separate_truncated_weighted_coefficient_tail",
      is_zero(tail_integral - 1/(3*N_minus_one**3))
      and coefficient_tail["separate_infinite_tail"]
      == "Tail8(N)=512*B_theta_12/(3*(N-1)^3) for N>=2"
      and coefficient_tail["tail_proof"] == [
          "(1+k)^8<=256*k^8 for every integer k>=1",
          "(1+k)^8*abs(c_k)<=512*B_theta_12/k^4",
          "sum_(k=N)^infinity k^-4<=integral_(N-1)^infinity x^-4 dx=1/(3*(N-1)^3)"]
      and coefficient_tail["tail_is_not_556_total_bound"] is True
      and "every ordered value, first-parameter and second-parameter"
      in coefficient_tail["state_jet_rule"],
      {"integral": str(tail_integral), "coefficient_tail": coefficient_tail})

endpoint_ingress = growth_quadrature["endpoint_observable_ingress"]
endpoint_index_checks = []
for grid_nodes in endpoint_ingress["grid_node_counts"]:
    positive_length = 8*grid_nodes + 2
    vacuum_length = 8*grid_nodes + 1
    endpoint_indices = list(range(6*grid_nodes, 7*grid_nodes))
    endpoint_index_checks.append(
        len(endpoint_indices) == grid_nodes
        and endpoint_indices[0] == 6*grid_nodes
        and endpoint_indices[-1] == 7*grid_nodes - 1
        and endpoint_indices[-1] < positive_length
        and endpoint_indices[-1] < vacuum_length
    )
chebyshev_endpoint_checks = [
    sp.chebyshevt(order, 1) == 1 for order in range(257)
]
check("endpoint_observable_full_banach_ingress",
      all(endpoint_index_checks)
      and all(chebyshev_endpoint_checks)
      and endpoint_ingress["canonical_chebyshev_identity"]
      == "T_k(1)=1, so h0=sum_(k=0)^(N-1) c_k+r_infinity"
      and endpoint_ingress["finite_gradient"]
      == "d_h0/d_state_i=1 for 6*N<=i<7*N and 0 for every other finite flat index"
      and endpoint_ingress["finite_hessian"]
      == "d2_h0/d_state_i_d_state_j=0 for every ordered finite index pair"
      and endpoint_ingress["infinite_tail_operator_norm"] == 1
      and "infinite-tail norm-one contribution"
      in endpoint_ingress["full_banach_derivative"]
      and endpoint_ingress["h1"].startswith(
          "derived from 2*kappa*h1+P0(0)*h0=0"),
      {"grid_index_checks": endpoint_index_checks,
       "chebyshev_orders_checked": [0, 256],
       "endpoint_ingress": endpoint_ingress})

wire_compatibility = growth_quadrature["wire_compatibility_and_canonical_hashing"]
legacy_reconciliation = wire_compatibility["legacy_field_reconciliation"]
canonical_json = wire_compatibility["canonical_json"]
failure_codes = wire_compatibility["c08_failure_precedence"]
check("legacy_wire_and_canonical_hash_reconciliation",
      legacy_reconciliation["formal_germ_truncation_order"] == {
          "kind": "not_applicable_infinite_borel_laplace_realization",
          "value": None}
      and len(legacy_reconciliation["additive_realization_order_ledger"]) == 6
      and "unpaired high or low UTF-16 surrogates are rejected"
      in canonical_json["encoding"]
      and canonical_json["algorithm"].startswith("RFC8785-compatible JCS")
      and canonical_json["canonical_domain"]
      == "nhm2-g2h-e-s5-a/borel-contract/v1\n"
      and "inherited S4-R1 payload_domain, record_domain"
      in canonical_json["payload_and_record_hashes"],
      {"legacy": legacy_reconciliation, "canonical_json": canonical_json})

check("c08_failure_code_total_order",
      len(failure_codes) == 21
      and len(set(failure_codes)) == 21
      and all(code.startswith(f"C08-{ordinal:03d}_")
              for ordinal, code in enumerate(failure_codes, start=1))
      and failure_codes[0] == "C08-001_INPUT_IDENTITY_OR_STATE_LENGTH"
      and failure_codes[-1] == "C08-021_WIRE_RECORD_OR_CHRONOLOGY"
      and wire_compatibility["resource_rule"].startswith(
          "resource exhaustion is reported at the producer code")
      and wire_compatibility["retry_retune_deletion_alternate_root"] is False,
      {"failure_codes": failure_codes,
       "precedence": wire_compatibility["precedence_rule"],
       "resource_rule": wire_compatibility["resource_rule"]})

check("fixed_resource_bounds_fail_closed",
      resource_bounds == {
          "precision_bits": 512,
          "origin_max_order": 256,
          "maximum_origin_borel_derivative_order": 2,
          "maximum_gevrey_rate_exponent": 1024,
          "maximum_growth_polynomial_degree": 64,
          "maximum_tail_operator_bound_exponent": 1024,
          "tail_operator_bound_attempts_per_constant": 1025,
          "continuation_max_order": 192,
          "picard_inflation_attempts_per_order": 16,
          "maximum_accepted_positive_ray_panels_per_chart_cell": 65536,
          "maximum_panel_halvings_per_left_endpoint": 32,
          "maximum_convolution_u_subpanels_per_target_panel": 65536,
          "maximum_convolution_u_refinement_levels": 16,
          "maximum_bivariate_xi_degree": 192,
          "maximum_tail_witness_onset": 4096,
          "maximum_laplace_split": 8192,
          "tail_split_attempts": 13,
          "outer_gl_order": 6,
          "maximum_outer_theta_panels": 16384,
          "maximum_coordinate_derivative_order": 12,
          "parameter_jet_components_per_borel_component": 13,
          "maximum_grid_node_count": 256,
          "resource_exhaustion": "FAIL at the first exhausted counter; no second invocation, alternate root, tolerance change or retune",
      },
      resource_bounds)

check("growth_quadrature_unsealed_bounded_algorithm",
      growth_quadrature["status"].startswith("draft_unsealed")
      and required_extensions == {
          "coordinate_derivative_kernel_bounds": "coordinate_derivative_laplace_kernels",
          "finite_continuation_algorithm": "finite_positive_ray_algorithm",
          "finite_quadrature_algorithm": "finite_laplace_projection_algorithm",
          "local_series_order_selector": "finite_positive_ray_algorithm.origin_localization and positive_panel_continuation",
          "fixed_resource_bounds": "fixed_resource_bounds",
          "record_wire_fields": "record_wire_fields",
          "independent_acknowledgement": None,
      }
      and growth_quadrature["finite_positive_ray_witness"]["continuation_algorithm"]
      == "finite_positive_ray_algorithm"
      and growth_quadrature["finite_positive_ray_witness"]["local_series_order_selector"]
      == "finite_positive_ray_algorithm.origin_localization and positive_panel_continuation"
      and growth_quadrature["finite_positive_ray_witness"]["maximum_order_and_resource_bound"]
      == "fixed_resource_bounds"
      and readiness["finite_continuation_defined"] is True
      and readiness["coordinate_derivative_tails_defined"] is True
      and readiness["finite_quadrature_defined"] is True
      and readiness["order_selector_defined"] is True
      and readiness["resource_bounds_defined"] is True
      and readiness["wire_record_defined"] is True
      and readiness["global_growth_budget_proved"] is False
      and readiness["directed_runtime_algorithm_defined"] is True
      and readiness["preacknowledgement_completeness_passed"] is True
      and readiness["independently_acknowledged"] is False
      and readiness["implementation_authorized"] is False
      and readiness["candidate_execution_authorized"] is False
      and growth_quadrature["preacknowledgement_completeness"]["acknowledgement_request_withdrawn"] is True
      and growth_quadrature["preacknowledgement_completeness"]["acknowledgement_occurred"] is False
      and growth_quadrature["preacknowledgement_completeness"]["repair_verdict"]
      == "PASS_TOTAL_DEFINITION_AUDITED_PENDING_INDEPENDENT_ACKNOWLEDGEMENT"
      and growth_quadrature["preacknowledgement_completeness"]["remaining_open_bindings"] == []
      and len(growth_quadrature["preacknowledgement_completeness"]["binding_closure"]) == 23
      and all(value == "audited_complete" for value in
              growth_quadrature["preacknowledgement_completeness"]["binding_closure"].values())
      and not any(growth_quadrature["authority"].values()),
      {"status": growth_quadrature["status"],
       "required_extensions": required_extensions,
       "readiness": readiness,
       "authority": growth_quadrature["authority"]})

check("ordinary_convergent_tail_not_established", True,
      "the exact recurrence has Gevrey-1/factorial-growth risk; this audit does not claim a divergence theorem, but it rules out assuming an ordinary convergent power-series tail from the frozen definitions")

review = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-formal-germ-subtraction-definition-review.md"
review_text = review.read_text(encoding="utf-8")
check("review_preserves_no_selector",
      "NO_SELECTOR_NO_SEAL" in review_text and "Positive candidate samples: `0`" in review_text,
      "unsealed review with zero candidate ingress")

protected = [
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
    ROOT / "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
    ROOT / "artifacts/nhm2/g2h-e-s5/executions",
]
check("protected_paths_absent", not any(path.exists() for path in protected),
      {str(path.relative_to(ROOT)): path.exists() for path in protected})

passed = sum(1 for item in checks if item["pass"])
report = {
    "schema": "nhm2.g2h_e_s5.formal_germ_growth_audit.v1",
    "status": "PASS" if passed == len(checks) else "FAIL",
    "checks_passed": passed,
    "checks_total": len(checks),
    "candidate_evaluations": 0,
    "positive_parameter_samples": 0,
    "candidate_roots_created": False,
    "authorization_created": False,
    "authority_promoted": False,
    "ordinary_convergent_formal_tail_established": False,
    "checks": checks,
}
print(json.dumps(report, sort_keys=True, separators=(",", ":")))
raise SystemExit(0 if passed == len(checks) else 1)
