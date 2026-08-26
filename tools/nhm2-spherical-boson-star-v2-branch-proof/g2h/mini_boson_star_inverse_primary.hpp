#pragma once

#include <arb.h>
#include <arb_mat.h>
#include <flint/fmpq_mat.h>
#include <flint/fmpz.h>

#include <cstddef>

namespace nhm2::g2h_e_s4::primary_inverse {

constexpr long maximum_dimension = 2050;

bool complete_pivot_inverse(arb_mat_t inverse, const arb_mat_t matrix,
    long *first_pivot_original_ordinal);
bool project_matrix(fmpq_mat_t dyadic, arb_mat_t projection_errors,
    const arb_mat_t input);
bool bareiss_determinant(fmpz_t determinant, const fmpq_mat_t dyadic);
bool finite_z0_row_sum(arb_t z0, const arb_mat_t approximate_inverse,
    const arb_mat_t jacobian);

std::size_t fixture_count();
std::size_t fixtures_passed();
bool run_inverse_fixture_suite();

} // namespace nhm2::g2h_e_s4::primary_inverse
