#pragma once

#include <arb.h>
#include <flint/fmpq.h>

#include <cstddef>

namespace nhm2::g2h_e_s4::primary_stability {

inline constexpr long stability_cells = 256;
inline constexpr long riccati_degree = 12;
inline constexpr long midpoint_steps_per_cell = 32;
inline constexpr long newton_sweeps = 16;
inline constexpr long jump_repairs = 1;
inline constexpr long trial_degree = 16;
inline constexpr long inverse_iterations = 64;
inline constexpr long lower_exponent = -96;

bool verify_positive_riccati_residual(const arb_t c11, const arb_t c12,
    const arb_t c21, const arb_t c22);
bool repair_diagonal_jump(fmpq_t offset, const fmpq_t observed_jump);
bool strict_stability_predicates(const arb_t lower, const arb_t upper,
    const arb_t essential_threshold);

std::size_t fixture_count();
std::size_t fixtures_passed();
bool run_stability_fixture_suite();

} // namespace nhm2::g2h_e_s4::primary_stability
