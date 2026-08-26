#pragma once

#include <arb.h>

#include <cstddef>

namespace nhm2::g2h_e_s4::primary_quantum_negative_axis {

inline constexpr long panels = 1024;
inline constexpr long nodes_per_panel = 32;
inline constexpr long mesh_intervals = 8192;
inline constexpr long rational_bisections_per_root = 600;
inline constexpr long interval_newton_steps_per_root = 16;
inline constexpr long validation_degree = 63;
inline constexpr long tail_order = 20;
inline constexpr long tail_majorant_iterations = 8;

bool certified_gl32_constant_moment(arb_t result);
std::size_t fixture_count();
std::size_t fixtures_passed();
bool run_quantum_negative_axis_fixture_suite();

} // namespace nhm2::g2h_e_s4::primary_quantum_negative_axis
