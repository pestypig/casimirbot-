#pragma once

#include <arb.h>

#include <cstddef>

namespace nhm2::g2h_e_s4::primary_quantum_angular {

inline constexpr long ell_terms = 256;
inline constexpr long subtraction_order = 20;
inline constexpr long hurwitz_zeta_calls_per_channel = 21;
inline constexpr long majorant_iterations = 8;
inline constexpr long projection_passes = 1;

bool strict_component_width(const arb_t width);
std::size_t fixture_count();
std::size_t fixtures_passed();
bool run_quantum_angular_fixture_suite();

} // namespace nhm2::g2h_e_s4::primary_quantum_angular
