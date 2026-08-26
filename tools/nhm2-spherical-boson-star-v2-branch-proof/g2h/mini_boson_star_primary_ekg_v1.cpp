#include "mini_boson_star_primary_ekg_v1.hpp"

#include <flint/fmpq.h>

#include <array>

namespace nhm2::g2h_e_s5::primary_ekg_v1 {
namespace {

bool finite(const arb_t value) { return arb_is_finite(value) != 0; }

void set_rational(arb_t value, long numerator, long denominator) {
    fmpq_t rational;
    fmpq_init(rational);
    fmpq_set_si(rational, numerator, denominator);
    arb_set_fmpq(value, rational, precision_bits);
    fmpq_clear(rational);
}

bool contains_rational(const arb_t value, long numerator, long denominator) {
    fmpq_t rational;
    fmpq_init(rational);
    fmpq_set_si(rational, numerator, denominator);
    const bool pass = arb_contains_fmpq(value, rational) != 0;
    fmpq_clear(rational);
    return pass;
}

bool all_residuals_zero(const BulkOutput &output) {
    return arb_contains_zero(output.b_residual) != 0
        && arb_contains_zero(output.s_residual) != 0
        && arb_contains_zero(output.sigma_residual) != 0;
}

bool minkowski_fixture() {
    BulkInput input; BulkOutput output;
    init(input); init(output);
    arb_set_si(input.r, 2); arb_one(input.b); arb_one(input.s); arb_one(input.omega);
    const bool pass = evaluate_bulk(output, input) && all_residuals_zero(output)
        && arb_is_zero(output.rho) && arb_is_zero(output.radial_pressure)
        && arb_is_zero(output.tangential_pressure);
    clear(output); clear(input);
    return pass;
}

bool rational_closed_residual_fixture() {
    BulkInput input; BulkOutput output;
    init(input); init(output);
    arb_set_si(input.r, 2); arb_one(input.b); arb_one(input.s);
    set_rational(input.sigma, 1, 2); set_rational(input.sigma_prime, 1, 4);
    set_rational(input.b_prime, 29, 128); set_rational(input.s_prime, -13, 64);
    set_rational(input.sigma_second, 1, 32); set_rational(input.omega, 3, 4);
    const bool pass = evaluate_bulk(output, input) && all_residuals_zero(output)
        && contains_rational(output.rho, 29, 128)
        && contains_rational(output.radial_pressure, -3, 128)
        && contains_rational(output.tangential_pressure, -11, 128);
    clear(output); clear(input);
    return pass;
}

bool denominator_rejection_fixture() {
    BulkInput input; BulkOutput output;
    init(input); init(output);
    arb_one(input.r); arb_one(input.b); arb_one(input.s); arb_one(input.omega);
    arb_zero(input.b); arb_add_error_2exp_si(input.b, -20);
    bool pass = !evaluate_bulk(output, input);
    arb_one(input.b); arb_zero(input.s);
    pass = pass && !evaluate_bulk(output, input);
    arb_one(input.s); arb_zero(input.r);
    pass = pass && !evaluate_bulk(output, input);
    arb_one(input.r); arb_indeterminate(input.omega);
    pass = pass && !evaluate_bulk(output, input);
    clear(output); clear(input);
    return pass;
}

std::array<bool, 3> fixture_results() {
    return {minkowski_fixture(), rational_closed_residual_fixture(), denominator_rejection_fixture()};
}

} // namespace

void init(BulkInput &input) {
    arb_init(input.r); arb_init(input.b); arb_init(input.s); arb_init(input.sigma);
    arb_init(input.sigma_prime); arb_init(input.b_prime); arb_init(input.s_prime);
    arb_init(input.sigma_second); arb_init(input.omega);
}

void clear(BulkInput &input) {
    arb_clear(input.omega); arb_clear(input.sigma_second); arb_clear(input.s_prime);
    arb_clear(input.b_prime); arb_clear(input.sigma_prime); arb_clear(input.sigma);
    arb_clear(input.s); arb_clear(input.b); arb_clear(input.r);
}

void init(BulkOutput &output) {
    arb_init(output.rho); arb_init(output.radial_pressure); arb_init(output.tangential_pressure);
    arb_init(output.b_residual); arb_init(output.s_residual); arb_init(output.sigma_residual);
}

void clear(BulkOutput &output) {
    arb_clear(output.sigma_residual); arb_clear(output.s_residual); arb_clear(output.b_residual);
    arb_clear(output.tangential_pressure); arb_clear(output.radial_pressure); arb_clear(output.rho);
}

bool evaluate_bulk(BulkOutput &output, const BulkInput &input) {
    const arb_struct *values[] = {input.r, input.b, input.s, input.sigma, input.sigma_prime,
        input.b_prime, input.s_prime, input.sigma_second, input.omega};
    for (const arb_struct *value : values) if (!finite(value)) return false;
    if (arb_contains_zero(input.r) || arb_contains_zero(input.b) || arb_contains_zero(input.s)) return false;

    arb_t b2, b3, s2, omega2, sigma2, sigma_prime2, temporal, gradient;
    arb_t temporary, coefficient, potential;
    arb_init(b2); arb_init(b3); arb_init(s2); arb_init(omega2); arb_init(sigma2);
    arb_init(sigma_prime2); arb_init(temporal); arb_init(gradient);
    arb_init(temporary); arb_init(coefficient); arb_init(potential);
    arb_mul(b2, input.b, input.b, precision_bits);
    arb_mul(b3, b2, input.b, precision_bits);
    arb_mul(s2, input.s, input.s, precision_bits);
    arb_mul(omega2, input.omega, input.omega, precision_bits);
    arb_mul(sigma2, input.sigma, input.sigma, precision_bits);
    arb_mul(sigma_prime2, input.sigma_prime, input.sigma_prime, precision_bits);
    arb_mul(temporal, b2, s2, precision_bits);
    arb_mul(temporal, temporal, omega2, precision_bits);
    arb_mul(temporal, temporal, sigma2, precision_bits);
    arb_mul_2exp_si(temporal, temporal, -1);
    arb_div(gradient, sigma_prime2, b2, precision_bits);
    arb_mul_2exp_si(gradient, gradient, -1);

    arb_mul_2exp_si(temporary, sigma2, -1);
    arb_add(output.rho, temporal, gradient, precision_bits);
    arb_add(output.rho, output.rho, temporary, precision_bits);
    arb_add(output.radial_pressure, temporal, gradient, precision_bits);
    arb_sub(output.radial_pressure, output.radial_pressure, temporary, precision_bits);
    arb_sub(output.tangential_pressure, temporal, gradient, precision_bits);
    arb_sub(output.tangential_pressure, output.tangential_pressure, temporary, precision_bits);

    // b'-(b-b^3)/(2r)-b^3*r*rho/2
    arb_sub(temporary, input.b, b3, precision_bits);
    arb_div(temporary, temporary, input.r, precision_bits);
    arb_mul_2exp_si(temporary, temporary, -1);
    arb_sub(output.b_residual, input.b_prime, temporary, precision_bits);
    arb_mul(temporary, b3, input.r, precision_bits);
    arb_mul(temporary, temporary, output.rho, precision_bits);
    arb_mul_2exp_si(temporary, temporary, -1);
    arb_sub(output.b_residual, output.b_residual, temporary, precision_bits);

    // s'+s*b^2*r*(rho+p_r)/2
    arb_add(temporary, output.rho, output.radial_pressure, precision_bits);
    arb_mul(temporary, temporary, input.s, precision_bits);
    arb_mul(temporary, temporary, b2, precision_bits);
    arb_mul(temporary, temporary, input.r, precision_bits);
    arb_mul_2exp_si(temporary, temporary, -1);
    arb_add(output.s_residual, input.s_prime, temporary, precision_bits);

    // sigma''+(2/r-2b'/b-s'/s)sigma'+b^2(b^2*s^2*omega^2-1)sigma
    arb_set_si(coefficient, 2);
    arb_div(coefficient, coefficient, input.r, precision_bits);
    arb_div(temporary, input.b_prime, input.b, precision_bits);
    arb_mul_2exp_si(temporary, temporary, 1);
    arb_sub(coefficient, coefficient, temporary, precision_bits);
    arb_div(temporary, input.s_prime, input.s, precision_bits);
    arb_sub(coefficient, coefficient, temporary, precision_bits);
    arb_mul(coefficient, coefficient, input.sigma_prime, precision_bits);
    arb_mul(potential, b2, s2, precision_bits);
    arb_mul(potential, potential, omega2, precision_bits);
    arb_sub_ui(potential, potential, 1UL, precision_bits);
    arb_mul(potential, potential, b2, precision_bits);
    arb_mul(potential, potential, input.sigma, precision_bits);
    arb_add(output.sigma_residual, input.sigma_second, coefficient, precision_bits);
    arb_add(output.sigma_residual, output.sigma_residual, potential, precision_bits);

    const arb_struct *outputs[] = {output.rho, output.radial_pressure, output.tangential_pressure,
        output.b_residual, output.s_residual, output.sigma_residual};
    bool pass = true;
    for (const arb_struct *value : outputs) pass = pass && finite(value);
    arb_clear(potential); arb_clear(coefficient); arb_clear(temporary); arb_clear(gradient);
    arb_clear(temporal); arb_clear(sigma_prime2); arb_clear(sigma2); arb_clear(omega2);
    arb_clear(s2); arb_clear(b3); arb_clear(b2);
    return pass;
}

std::size_t fixture_count() { return 3U; }
std::size_t fixtures_passed() {
    const auto checks = fixture_results();
    std::size_t passed = 0U;
    for (const bool value : checks) passed += value ? 1U : 0U;
    return passed;
}
bool run_ekg_fixture_suite() { return fixtures_passed() == fixture_count(); }

} // namespace nhm2::g2h_e_s5::primary_ekg_v1
