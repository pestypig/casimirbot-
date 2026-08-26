#pragma once

#include <arb.h>

#include <cstddef>

namespace nhm2::g2h_e_s4::primary_quantum_radial {

inline constexpr long radial_cells = 256;
inline constexpr long radial_degree = 24;
inline constexpr long nodes_per_cell = 25;
inline constexpr long unknowns_per_cell = 50;
inline constexpr long defect_sweeps = 8;
inline constexpr long defect_enclosure_degree = 48;

bool strict_contraction(const arb_t contraction);
std::size_t fixture_count();
std::size_t fixtures_passed();
bool run_quantum_radial_fixture_suite();

} // namespace nhm2::g2h_e_s4::primary_quantum_radial
