#pragma once

#include <arb.h>

#include <cstddef>

namespace nhm2::g2h_e_s5::primary_origin_v1 {

constexpr long precision_bits = 512;

struct PositiveOriginOutput {
    arb_t rho0;
    arb_t radial_pressure0;
    arb_t b_u0;
    arb_t s_u0;
    arb_t pi_sigma0;
    arb_t sigma_u0;
};

void init(PositiveOriginOutput &output);
void clear(PositiveOriginOutput &output);

// Constructs only the first regular origin coefficients for u=(r/255)^2.
// It is not a local-existence enclosure and does not solve a selected member.
bool construct_positive_origin(PositiveOriginOutput &output, const arb_t s0,
    const arb_t sigma0, const arb_t omega);

std::size_t fixture_count();
std::size_t fixtures_passed();
bool run_origin_fixture_suite();

} // namespace nhm2::g2h_e_s5::primary_origin_v1
