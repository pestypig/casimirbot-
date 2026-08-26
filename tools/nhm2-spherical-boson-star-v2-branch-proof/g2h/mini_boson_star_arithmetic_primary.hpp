#pragma once

#include <arb.h>
#include <flint/fmpz.h>

#include <cstddef>

namespace nhm2::g2h_e_s4::primary_arithmetic {

constexpr long precision_bits = 512;
constexpr long projection_exponent = -448;

void add(arb_t result, const arb_t left, const arb_t right);
void subtract(arb_t result, const arb_t left, const arb_t right);
void multiply(arb_t result, const arb_t left, const arb_t right);
bool divide(arb_t result, const arb_t numerator, const arb_t denominator);
bool project_midpoint_2m448(const arb_t input, fmpz_t lattice_n, arb_t error_ball);

std::size_t fixture_count();
std::size_t fixtures_passed();
bool run_arithmetic_fixture_suite();

} // namespace nhm2::g2h_e_s4::primary_arithmetic
