#pragma once

#include <arb.h>
#include <arb_poly.h>

#include <cstddef>

namespace nhm2::g2h_e_s4::primary_continuation {

inline constexpr long cell_count = 1024;
inline constexpr long radii_per_cell = 73;
inline constexpr long first_radius_exponent = -192;
inline constexpr long last_radius_exponent = -120;
inline constexpr long coefficient_weight_power = 8;

bool second_order_predictor(arb_ptr output, arb_srcptr left, arb_srcptr tangent,
    arb_srcptr acceleration, long dimension, const arb_t h);
bool select_least_radius(long *selected, long *evaluated, const arb_t y,
    const arb_t z0, const arb_t z1, const arb_t z2,
    const arb_t domain_margin);
bool strict_ball_containment(const arb_t center_distance,
    const arb_t left_radius, const arb_t right_radius);
bool chebyshev_convolution_majorant(arb_t output, const arb_poly_t left,
    const arb_poly_t right, const arb_t flat_carrier_envelope);

std::size_t fixture_count();
std::size_t fixtures_passed();
bool run_continuation_fixture_suite();

} // namespace nhm2::g2h_e_s4::primary_continuation
