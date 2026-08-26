#include "mini_boson_star_primary_origin_v1.hpp"

#include <flint/fmpq.h>

#include <array>

namespace nhm2::g2h_e_s5::primary_origin_v1 {
namespace {

void set_rational(arb_t value, long numerator, long denominator) {
    fmpq_t rational;
    fmpq_init(rational);
    fmpq_set_si(rational, numerator, denominator);
    arb_set_fmpq(value, rational, precision_bits);
    fmpq_clear(rational);
}

bool finite_input(const arb_t value) {
    return arb_is_finite(value) != 0;
}

bool residuals_contain_zero(const PositiveOriginOutput &output, const arb_t s0,
    const arb_t sigma0, const arb_t omega) {
    arb_t residual, temporary, omega_squared, s_squared, sigma_squared;
    arb_init(residual); arb_init(temporary); arb_init(omega_squared);
    arb_init(s_squared); arb_init(sigma_squared);
    arb_mul(omega_squared, omega, omega, precision_bits);
    arb_mul(s_squared, s0, s0, precision_bits);
    arb_mul(sigma_squared, sigma0, sigma0, precision_bits);

    arb_mul_si(residual, output.b_u0, 6, precision_bits);
    arb_mul_si(temporary, output.rho0, 65025, precision_bits);
    arb_sub(residual, residual, temporary, precision_bits);
    bool pass = arb_contains_zero(residual) != 0;

    arb_add(temporary, output.rho0, output.radial_pressure0, precision_bits);
    arb_mul(temporary, temporary, s0, precision_bits);
    arb_mul_si(temporary, temporary, 65025, precision_bits);
    arb_mul_si(residual, output.s_u0, 4, precision_bits);
    arb_add(residual, residual, temporary, precision_bits);
    pass = pass && arb_contains_zero(residual) != 0;

    arb_mul_si(residual, output.sigma_u0, 2, precision_bits);
    arb_sub(residual, residual, output.pi_sigma0, precision_bits);
    pass = pass && arb_contains_zero(residual) != 0;

    arb_mul(temporary, s_squared, omega_squared, precision_bits);
    arb_sub_ui(temporary, temporary, 1UL, precision_bits);
    arb_mul(temporary, temporary, sigma0, precision_bits);
    arb_mul_si(residual, output.pi_sigma0, 3, precision_bits);
    arb_add(residual, residual, temporary, precision_bits);
    pass = pass && arb_contains_zero(residual) != 0;

    arb_clear(sigma_squared); arb_clear(s_squared); arb_clear(omega_squared);
    arb_clear(temporary); arb_clear(residual);
    return pass;
}

bool origin_case(long sigma_numerator, long sigma_denominator,
    long omega_numerator, long omega_denominator, bool require_nonzero) {
    arb_t s0, sigma0, omega;
    arb_init(s0); arb_init(sigma0); arb_init(omega);
    arb_one(s0);
    set_rational(sigma0, sigma_numerator, sigma_denominator);
    set_rational(omega, omega_numerator, omega_denominator);
    PositiveOriginOutput output;
    init(output);
    bool pass = construct_positive_origin(output, s0, sigma0, omega)
        && residuals_contain_zero(output, s0, sigma0, omega);
    if (require_nonzero) pass = pass && !arb_contains_zero(output.rho0);
    else pass = pass && arb_is_zero(output.rho0) && arb_is_zero(output.b_u0)
        && arb_is_zero(output.s_u0) && arb_is_zero(output.pi_sigma0)
        && arb_is_zero(output.sigma_u0);
    clear(output);
    arb_clear(omega); arb_clear(sigma0); arb_clear(s0);
    return pass;
}

bool rejects_nonfinite() {
    arb_t s0, sigma0, omega;
    arb_init(s0); arb_init(sigma0); arb_init(omega);
    arb_one(s0); arb_zero(sigma0); arb_indeterminate(omega);
    PositiveOriginOutput output;
    init(output);
    const bool pass = !construct_positive_origin(output, s0, sigma0, omega);
    clear(output);
    arb_clear(omega); arb_clear(sigma0); arb_clear(s0);
    return pass;
}

std::array<bool, 3> fixture_results() {
    return {
        origin_case(0, 1, 1, 1, false),
        origin_case(1, 8, 3, 4, true),
        rejects_nonfinite(),
    };
}

} // namespace

void init(PositiveOriginOutput &output) {
    arb_init(output.rho0); arb_init(output.radial_pressure0);
    arb_init(output.b_u0); arb_init(output.s_u0);
    arb_init(output.pi_sigma0); arb_init(output.sigma_u0);
}

void clear(PositiveOriginOutput &output) {
    arb_clear(output.sigma_u0); arb_clear(output.pi_sigma0);
    arb_clear(output.s_u0); arb_clear(output.b_u0);
    arb_clear(output.radial_pressure0); arb_clear(output.rho0);
}

bool construct_positive_origin(PositiveOriginOutput &output, const arb_t s0,
    const arb_t sigma0, const arb_t omega) {
    if (!finite_input(s0) || !finite_input(sigma0) || !finite_input(omega)) return false;
    arb_t s_squared, omega_squared, sigma_squared, kinetic, temporary;
    arb_init(s_squared); arb_init(omega_squared); arb_init(sigma_squared);
    arb_init(kinetic); arb_init(temporary);
    arb_mul(s_squared, s0, s0, precision_bits);
    arb_mul(omega_squared, omega, omega, precision_bits);
    arb_mul(sigma_squared, sigma0, sigma0, precision_bits);
    arb_mul(kinetic, s_squared, omega_squared, precision_bits);
    arb_mul(kinetic, kinetic, sigma_squared, precision_bits);

    arb_add(output.rho0, kinetic, sigma_squared, precision_bits);
    arb_mul_2exp_si(output.rho0, output.rho0, -1);
    arb_sub(output.radial_pressure0, kinetic, sigma_squared, precision_bits);
    arb_mul_2exp_si(output.radial_pressure0, output.radial_pressure0, -1);

    arb_mul_si(output.b_u0, output.rho0, 65025, precision_bits);
    arb_div_ui(output.b_u0, output.b_u0, 6UL, precision_bits);
    arb_add(temporary, output.rho0, output.radial_pressure0, precision_bits);
    arb_mul(temporary, temporary, s0, precision_bits);
    arb_mul_si(output.s_u0, temporary, -65025, precision_bits);
    arb_div_ui(output.s_u0, output.s_u0, 4UL, precision_bits);

    arb_mul(temporary, s_squared, omega_squared, precision_bits);
    arb_sub_ui(temporary, temporary, 1UL, precision_bits);
    arb_mul(temporary, temporary, sigma0, precision_bits);
    arb_neg(temporary, temporary);
    arb_div_ui(output.pi_sigma0, temporary, 3UL, precision_bits);
    arb_mul_2exp_si(output.sigma_u0, output.pi_sigma0, -1);

    const bool pass = finite_input(output.rho0) && finite_input(output.radial_pressure0)
        && finite_input(output.b_u0) && finite_input(output.s_u0)
        && finite_input(output.pi_sigma0) && finite_input(output.sigma_u0);
    arb_clear(temporary); arb_clear(kinetic); arb_clear(sigma_squared);
    arb_clear(omega_squared); arb_clear(s_squared);
    return pass;
}

std::size_t fixture_count() { return 3U; }

std::size_t fixtures_passed() {
    const auto checks = fixture_results();
    std::size_t passed = 0U;
    for (const bool value : checks) passed += value ? 1U : 0U;
    return passed;
}

bool run_origin_fixture_suite() { return fixtures_passed() == fixture_count(); }

} // namespace nhm2::g2h_e_s5::primary_origin_v1
