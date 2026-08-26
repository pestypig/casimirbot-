#pragma once

#include <arb.h>

#include <cstddef>

namespace nhm2::g2h_e_s5::primary_flat_carrier_v1 {

constexpr long precision_bits = 512;
constexpr std::size_t derivative_order = 12U;
constexpr std::size_t parameter_derivative_pairs = 6U;
constexpr std::size_t mixed_derivative_inventory =
    (derivative_order + 1U) * parameter_derivative_pairs;

// Fixed j-major order. Within each j the (u,v) order is
// (0,0),(0,1),(0,2),(1,0),(1,1),(2,0).
std::size_t mixed_index(unsigned u, unsigned v, unsigned j);

// Evaluate all d_q^j d_a^u d_b^v C for u+v<=2 and 0<=j<=12. P_j is
// constructed in exact integer multivariate polynomial arithmetic and
// differentiated symbolically before directed Arb substitution.
bool evaluate_mixed_derivatives(arb_ptr derivatives, const arb_t a,
    const arb_t b, const arb_t q);

// Produce conservative finite scalar upper bounds for the same 78 entries on
// a compact parameter box A x B and q in [0,1/255]. The bound uses exact P_j
// monomials, inf(A), sup(B), |log(q)|^v <= q^(-v), and the exact maximizer of
// exp(-inf(A)*x)*x^h on x>=255. It is intentionally conservative.
bool evaluate_mixed_envelopes(arb_ptr upper_bounds, const arb_t a_box,
    const arb_t b_box);

// For each of the six (u,v) parameter pairs, assemble
// B_theta_12 <= sum_j S(12,j)*B_(u,v,j)/510^j and the frozen weighted
// coefficient bound B_(u,v,0)+556*B_theta_12.
bool assemble_coefficient_norm_bounds(arb_ptr b_theta_12,
    arb_ptr weighted_norm, arb_srcptr mixed_envelopes);

// Evaluate d_q^j[exp(-a/q) q^(-b)] for 0 <= j <= 12. The exact q=0
// endpoint is inserted as thirteen exact zeros; no division or logarithm is
// evaluated there. This is a pointwise inventory, not a supremum or remainder
// bound.
bool evaluate_q_derivatives(arb_ptr derivatives, const arb_t a, const arb_t b,
    const arb_t q);

std::size_t fixture_count();
std::size_t fixtures_passed();
unsigned fixture_mask();
bool run_flat_carrier_fixture_suite();

} // namespace nhm2::g2h_e_s5::primary_flat_carrier_v1
