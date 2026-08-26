#include "mini_boson_star_primary_positive_tail_v1.hpp"
#include "mini_boson_star_primary_carrier_parameters_v1.hpp"

#include <flint/fmpq.h>

#include <array>

namespace nhm2::g2h_e_s5::primary_positive_tail_v1 {
namespace {

bool finite(const arb_t value) { return arb_is_finite(value) != 0; }

bool q_in_frozen_domain(const arb_t q) {
    if (!arb_is_positive(q)) return false;
    fmpq_t boundary;
    fmpq_init(boundary);
    fmpq_set_si(boundary, 1, 255);
    arb_t boundary_ball;
    arb_init(boundary_ball);
    arb_set_fmpq(boundary_ball, boundary, precision_bits);
    const bool ordinary = arb_le(q, boundary_ball) != 0;
    const bool exact_endpoint_insertion = arb_contains_fmpq(q, boundary) != 0
        && mag_cmp_2exp_si(arb_radref(q), -400) <= 0;
    arb_clear(boundary_ball);
    fmpq_clear(boundary);
    return ordinary || exact_endpoint_insertion;
}

void set_rational(arb_t value, long numerator, long denominator) {
    fmpq_t rational;
    fmpq_init(rational);
    fmpq_set_si(rational, numerator, denominator);
    arb_set_fmpq(value, rational, precision_bits);
    fmpq_clear(rational);
}

bool parameters(arb_t kappa, arb_t beta, const arb_t omega, const arb_t mass) {
    return primary_carrier_parameters_v1::evaluate_positive_parameter_values(
        kappa, beta, omega, mass);
}

unsigned zero_field_mask_impl() {
    TailInput input; TailOutput output;
    init(input); init(output);
    set_rational(input.q, 1, 255); set_rational(input.omega, 3, 4);
    unsigned mask = 0U;
    const bool evaluated = evaluate_tail(output, input);
    if (evaluated) mask |= 1U;
    if (evaluated && arb_contains_zero(output.mass_residual) && arb_contains_zero(output.lapse_residual)
        && arb_contains_zero(output.H_definition_residual) && arb_contains_zero(output.KG_residual)) mask |= 2U;
    if (evaluated && arb_contains_zero(output.sigma) && arb_contains_zero(output.p)) mask |= 4U;
    if (evaluated && arb_contains_si(output.f, 1)) mask |= 8U;
    if (evaluated && arb_contains_si(output.b, 1)) mask |= 16U;
    if (evaluated && arb_contains_si(output.s, 1)) mask |= 32U;
    clear(output); clear(input);
    return mask;
}

unsigned zero_field_stage_impl() {
    TailInput input; TailOutput output;
    init(input); init(output);
    set_rational(input.q, 1, 255); set_rational(input.omega, 3, 4);
    unsigned stage = 0U;
    (void)evaluate_tail(output, input, &stage);
    clear(output); clear(input);
    return stage;
}

bool zero_field_fixture() { return zero_field_mask_impl() == 63U; }

bool manufactured_finite_fixture() {
    TailInput input; TailOutput output;
    init(input); init(output);
    set_rational(input.q, 1, 510); set_rational(input.omega, 3, 4);
    set_rational(input.mass, 1, 2); set_rational(input.D, 1, 16);
    set_rational(input.D_q, -1, 32); set_rational(input.S, 1, 32);
    set_rational(input.S_q, 1, 64); set_rational(input.H, 1, 8);
    set_rational(input.H_q, -1, 16); set_rational(input.K, -1, 16);
    set_rational(input.K_q, 1, 32);
    bool pass = evaluate_tail(output, input) && arb_contains_zero(output.H_definition_residual)
        && arb_is_positive(output.kappa) && arb_is_positive(output.A)
        && arb_is_positive(output.f) && arb_is_positive(output.b) && arb_is_positive(output.s);
    const arb_struct *values[] = {output.mass_residual, output.lapse_residual, output.KG_residual,
        output.rho_hat, output.radial_pressure_hat, output.sigma, output.p};
    for (const arb_struct *value : values) pass = pass && finite(value);
    clear(output); clear(input);
    return pass;
}

bool endpoint_fixture() {
    arb_t omega, mass, H0, identity, temporary;
    arb_init(omega); arb_init(mass); arb_init(H0); arb_init(identity); arb_init(temporary);
    set_rational(omega, 3, 4); set_rational(mass, 1, 2); set_rational(H0, 1, 4);
    EndpointOutput output; init(output);
    bool pass = evaluate_endpoint(output, omega, mass, H0)
        && arb_equal(output.D0, output.S0) && arb_is_positive(output.D0);
    arb_mul(identity, output.kappa, output.kappa, precision_bits);
    arb_mul(temporary, omega, omega, precision_bits);
    arb_add(identity, identity, temporary, precision_bits);
    pass = pass && arb_contains_si(identity, 1) != 0;
    // (beta+1)*kappa=M*(2*omega^2-1)
    arb_add_ui(identity, output.beta, 1UL, precision_bits);
    arb_mul(identity, identity, output.kappa, precision_bits);
    arb_mul(temporary, omega, omega, precision_bits);
    arb_mul_2exp_si(temporary, temporary, 1);
    arb_sub_ui(temporary, temporary, 1UL, precision_bits);
    arb_mul(temporary, temporary, mass, precision_bits);
    arb_sub(identity, identity, temporary, precision_bits);
    pass = pass && arb_contains_zero(identity) != 0;
    clear(output); arb_clear(temporary); arb_clear(identity); arb_clear(H0); arb_clear(mass); arb_clear(omega);
    return pass;
}

bool rejection_fixture() {
    TailInput input; TailOutput output;
    init(input); init(output);
    set_rational(input.omega, 3, 4); arb_zero(input.q);
    bool pass = !evaluate_tail(output, input);
    set_rational(input.q, 1, 254);
    pass = pass && !evaluate_tail(output, input);
    set_rational(input.q, 1, 255); arb_one(input.omega);
    pass = pass && !evaluate_tail(output, input);
    set_rational(input.omega, 3, 4); arb_indeterminate(input.H);
    pass = pass && !evaluate_tail(output, input);
    arb_t omega, mass, H0;
    arb_init(omega); arb_init(mass); arb_init(H0); arb_one(omega); arb_one(H0);
    EndpointOutput endpoint; init(endpoint);
    pass = pass && !evaluate_endpoint(endpoint, omega, mass, H0);
    set_rational(omega, 3, 4); arb_zero(H0);
    pass = pass && !evaluate_endpoint(endpoint, omega, mass, H0);
    clear(endpoint); arb_clear(H0); arb_clear(mass); arb_clear(omega);
    clear(output); clear(input);
    return pass;
}

std::array<bool, 4> fixture_results() {
    return {zero_field_fixture(), manufactured_finite_fixture(), endpoint_fixture(), rejection_fixture()};
}

} // namespace

void init(TailInput &input) {
    arb_init(input.q); arb_init(input.omega); arb_init(input.mass); arb_init(input.D);
    arb_init(input.D_q); arb_init(input.S); arb_init(input.S_q); arb_init(input.H);
    arb_init(input.H_q); arb_init(input.K); arb_init(input.K_q);
}
void clear(TailInput &input) {
    arb_clear(input.K_q); arb_clear(input.K); arb_clear(input.H_q); arb_clear(input.H);
    arb_clear(input.S_q); arb_clear(input.S); arb_clear(input.D_q); arb_clear(input.D);
    arb_clear(input.mass); arb_clear(input.omega); arb_clear(input.q);
}
void init(TailOutput &output) {
    arb_init(output.kappa); arb_init(output.beta); arb_init(output.A); arb_init(output.W);
    arb_init(output.Z); arb_init(output.m); arb_init(output.f); arb_init(output.b);
    arb_init(output.s); arb_init(output.sigma); arb_init(output.p_over_A); arb_init(output.p);
    arb_init(output.rho_hat); arb_init(output.radial_pressure_hat);
    arb_init(output.mass_residual); arb_init(output.lapse_residual);
    arb_init(output.H_definition_residual); arb_init(output.KG_residual);
}
void clear(TailOutput &output) {
    arb_clear(output.KG_residual); arb_clear(output.H_definition_residual);
    arb_clear(output.lapse_residual); arb_clear(output.mass_residual);
    arb_clear(output.radial_pressure_hat); arb_clear(output.rho_hat); arb_clear(output.p);
    arb_clear(output.p_over_A); arb_clear(output.sigma); arb_clear(output.s); arb_clear(output.b);
    arb_clear(output.f); arb_clear(output.m); arb_clear(output.Z); arb_clear(output.W);
    arb_clear(output.A); arb_clear(output.beta); arb_clear(output.kappa);
}
void init(EndpointOutput &output) {
    arb_init(output.kappa); arb_init(output.beta); arb_init(output.D0); arb_init(output.S0);
}
void clear(EndpointOutput &output) {
    arb_clear(output.S0); arb_clear(output.D0); arb_clear(output.beta); arb_clear(output.kappa);
}

bool evaluate_tail(TailOutput &output, const TailInput &input, unsigned *failure_stage) {
    if (failure_stage != nullptr) *failure_stage = 0U;
    const arb_struct *inputs[] = {input.q, input.omega, input.mass, input.D, input.D_q,
        input.S, input.S_q, input.H, input.H_q, input.K, input.K_q};
    for (const arb_struct *value : inputs) if (!finite(value)) {
        if (failure_stage != nullptr) *failure_stage = 1U;
        return false;
    }
    const bool q_ok = q_in_frozen_domain(input.q);
    if (!q_ok) {
        if (failure_stage != nullptr) *failure_stage = 2U;
        return false;
    }
    if (!parameters(output.kappa, output.beta, input.omega, input.mass)) {
        if (failure_stage != nullptr) *failure_stage = 3U;
        return false;
    }

    arb_t exponent, logarithm, temporary, temporary2, b_squared, omega_squared;
    arb_t p_over_A_q, b_log_r, s_log_r, mass_prime_r, rho_plus_pr;
    arb_init(exponent); arb_init(logarithm); arb_init(temporary); arb_init(temporary2);
    arb_init(b_squared); arb_init(omega_squared); arb_init(p_over_A_q);
    arb_init(b_log_r); arb_init(s_log_r); arb_init(mass_prime_r); arb_init(rho_plus_pr);

    // A=exp(-kappa/q-beta*log(q)); W=A^2/q^2; Z=A^2/q.
    arb_div(exponent, output.kappa, input.q, precision_bits); arb_neg(exponent, exponent);
    arb_log(logarithm, input.q, precision_bits);
    arb_mul(temporary, output.beta, logarithm, precision_bits);
    arb_sub(exponent, exponent, temporary, precision_bits);
    arb_exp(output.A, exponent, precision_bits);
    arb_mul(temporary, output.A, output.A, precision_bits);
    arb_div(output.Z, temporary, input.q, precision_bits);
    arb_mul(temporary2, input.q, input.q, precision_bits);
    arb_div(output.W, temporary, temporary2, precision_bits);

    arb_mul(temporary, output.W, input.D, precision_bits);
    arb_sub(output.m, input.mass, temporary, precision_bits);
    arb_mul(temporary, input.q, output.m, precision_bits);
    arb_mul_2exp_si(temporary, temporary, 1); arb_one(output.f);
    arb_sub(output.f, output.f, temporary, precision_bits);
    if (!arb_is_positive(output.f)) {
        if (failure_stage != nullptr) *failure_stage = 4U;
        goto fail;
    }
    arb_inv(b_squared, output.f, precision_bits);
    arb_sqrt(output.b, b_squared, precision_bits);
    arb_mul(temporary, output.Z, input.S, precision_bits);
    arb_add_ui(output.s, temporary, 1UL, precision_bits);
    if (!arb_is_positive(output.s)) {
        if (failure_stage != nullptr) *failure_stage = 5U;
        goto fail;
    }
    arb_mul(output.sigma, output.A, input.H, precision_bits);

    arb_mul(output.p_over_A, output.beta, input.q, precision_bits);
    arb_sub(output.p_over_A, output.p_over_A, output.kappa, precision_bits);
    arb_mul(output.p_over_A, output.p_over_A, input.H, precision_bits);
    arb_mul(temporary, temporary2, input.K, precision_bits);
    arb_sub(output.p_over_A, output.p_over_A, temporary, precision_bits);
    arb_mul(output.p, output.A, output.p_over_A, precision_bits);

    arb_mul(omega_squared, input.omega, input.omega, precision_bits);
    arb_mul(temporary, b_squared, output.s, precision_bits);
    arb_mul(temporary, temporary, output.s, precision_bits);
    arb_mul(temporary, temporary, omega_squared, precision_bits);
    arb_mul(temporary, temporary, input.H, precision_bits);
    arb_mul(temporary, temporary, input.H, precision_bits);
    arb_mul_2exp_si(temporary, temporary, -1);
    arb_mul(temporary2, output.p_over_A, output.p_over_A, precision_bits);
    arb_div(temporary2, temporary2, b_squared, precision_bits);
    arb_mul_2exp_si(temporary2, temporary2, -1);
    arb_add(output.rho_hat, temporary, temporary2, precision_bits);
    arb_mul(temporary2, input.H, input.H, precision_bits);
    arb_mul_2exp_si(temporary2, temporary2, -1);
    arb_add(output.rho_hat, output.rho_hat, temporary2, precision_bits);
    arb_sub(output.radial_pressure_hat, output.rho_hat, temporary2, precision_bits);
    arb_sub(output.radial_pressure_hat, output.radial_pressure_hat, temporary2, precision_bits);
    arb_add(rho_plus_pr, output.rho_hat, output.radial_pressure_hat, precision_bits);

    arb_mul_si(temporary, output.beta, 2, precision_bits); arb_add_ui(temporary, temporary, 2UL, precision_bits);
    arb_mul(temporary, temporary, input.q, precision_bits); arb_mul_2exp_si(temporary2, output.kappa, 1);
    arb_sub(temporary, temporary2, temporary, precision_bits); arb_mul(temporary, temporary, input.D, precision_bits);
    arb_mul(temporary2, input.q, input.q, precision_bits); arb_mul(temporary2, temporary2, input.D_q, precision_bits);
    arb_add(output.mass_residual, temporary, temporary2, precision_bits);
    arb_mul_2exp_si(temporary, output.rho_hat, -1);
    arb_sub(output.mass_residual, output.mass_residual, temporary, precision_bits);

    arb_mul_si(temporary, output.beta, 2, precision_bits); arb_add_ui(temporary, temporary, 1UL, precision_bits);
    arb_mul(temporary, temporary, input.q, precision_bits); arb_mul_2exp_si(temporary2, output.kappa, 1);
    arb_sub(temporary, temporary2, temporary, precision_bits); arb_mul(temporary, temporary, input.S, precision_bits);
    arb_mul(temporary2, input.q, input.q, precision_bits); arb_mul(temporary2, temporary2, input.S_q, precision_bits);
    arb_add(output.lapse_residual, temporary, temporary2, precision_bits);
    arb_mul(temporary, output.s, b_squared, precision_bits); arb_mul(temporary, temporary, rho_plus_pr, precision_bits);
    arb_mul_2exp_si(temporary, temporary, -1);
    arb_sub(output.lapse_residual, output.lapse_residual, temporary, precision_bits);
    arb_sub(output.H_definition_residual, input.H_q, input.K, precision_bits);

    // pbar_q=beta*H+(-kappa+(beta-2)q)K-q^2*K_q.
    arb_mul(p_over_A_q, output.beta, input.H, precision_bits);
    arb_sub_ui(temporary, output.beta, 2UL, precision_bits); arb_mul(temporary, temporary, input.q, precision_bits);
    arb_sub(temporary, temporary, output.kappa, precision_bits); arb_mul(temporary, temporary, input.K, precision_bits);
    arb_add(p_over_A_q, p_over_A_q, temporary, precision_bits);
    arb_mul(temporary, input.q, input.q, precision_bits); arb_mul(temporary, temporary, input.K_q, precision_bits);
    arb_sub(p_over_A_q, p_over_A_q, temporary, precision_bits);

    // m'_r=W*rho_hat/2, then b'/b=b^2*(q*m'_r-q^2*m).
    arb_mul(mass_prime_r, output.W, output.rho_hat, precision_bits); arb_mul_2exp_si(mass_prime_r, mass_prime_r, -1);
    arb_mul(temporary, input.q, mass_prime_r, precision_bits);
    arb_mul(temporary2, input.q, input.q, precision_bits); arb_mul(temporary2, temporary2, output.m, precision_bits);
    arb_sub(temporary, temporary, temporary2, precision_bits); arb_mul(b_log_r, b_squared, temporary, precision_bits);
    arb_mul(s_log_r, b_squared, output.Z, precision_bits); arb_mul(s_log_r, s_log_r, rho_plus_pr, precision_bits);
    arb_mul_2exp_si(s_log_r, s_log_r, -1); arb_neg(s_log_r, s_log_r);

    // Stable algebraic form of the frozen KG expression.
    arb_mul(temporary, input.q, input.q, precision_bits); arb_mul(temporary, temporary, p_over_A_q, precision_bits);
    arb_neg(output.KG_residual, temporary);
    arb_mul(temporary, output.beta, input.q, precision_bits); arb_sub(temporary, output.kappa, temporary, precision_bits);
    arb_mul(temporary, temporary, output.p_over_A, precision_bits); arb_sub(output.KG_residual, output.KG_residual, temporary, precision_bits);
    arb_mul_si(temporary, b_log_r, 2, precision_bits); arb_add(temporary, temporary, s_log_r, precision_bits);
    arb_mul_2exp_si(temporary2, input.q, 1); arb_sub(temporary2, temporary2, temporary, precision_bits);
    arb_mul(temporary2, temporary2, output.p_over_A, precision_bits); arb_add(output.KG_residual, output.KG_residual, temporary2, precision_bits);
    arb_mul(temporary, b_squared, output.s, precision_bits); arb_mul(temporary, temporary, output.s, precision_bits);
    arb_mul(temporary, temporary, omega_squared, precision_bits); arb_sub_ui(temporary, temporary, 1UL, precision_bits);
    arb_mul(temporary, temporary, b_squared, precision_bits); arb_mul(temporary, temporary, input.H, precision_bits);
    arb_add(output.KG_residual, output.KG_residual, temporary, precision_bits);

    {
        const arb_struct *outputs[] = {output.kappa, output.beta, output.A, output.W, output.Z,
            output.m, output.f, output.b, output.s, output.sigma, output.p_over_A, output.p,
            output.rho_hat, output.radial_pressure_hat, output.mass_residual, output.lapse_residual,
            output.H_definition_residual, output.KG_residual};
        bool pass = true;
        for (const arb_struct *value : outputs) pass = pass && finite(value);
        arb_clear(rho_plus_pr); arb_clear(mass_prime_r); arb_clear(s_log_r); arb_clear(b_log_r);
        arb_clear(p_over_A_q); arb_clear(omega_squared); arb_clear(b_squared); arb_clear(temporary2);
        arb_clear(temporary); arb_clear(logarithm); arb_clear(exponent);
        if (!pass && failure_stage != nullptr) *failure_stage = 6U;
        return pass;
    }
fail:
    arb_clear(rho_plus_pr); arb_clear(mass_prime_r); arb_clear(s_log_r); arb_clear(b_log_r);
    arb_clear(p_over_A_q); arb_clear(omega_squared); arb_clear(b_squared); arb_clear(temporary2);
    arb_clear(temporary); arb_clear(logarithm); arb_clear(exponent);
    return false;
}

bool evaluate_endpoint(EndpointOutput &output, const arb_t omega,
    const arb_t mass, const arb_t H0) {
    if (!finite(H0) || !arb_is_positive(H0) || !parameters(output.kappa, output.beta, omega, mass)) return false;
    arb_mul(output.D0, H0, H0, precision_bits);
    arb_mul_2exp_si(output.S0, output.kappa, 2);
    if (arb_contains_zero(output.S0)) return false;
    arb_div(output.D0, output.D0, output.S0, precision_bits);
    arb_set(output.S0, output.D0);
    return finite(output.D0) && arb_is_positive(output.D0);
}

std::size_t fixture_count() { return 4U; }
unsigned fixture_mask() {
    const auto checks = fixture_results();
    unsigned mask = 0U;
    for (std::size_t index = 0; index < checks.size(); ++index) {
        if (checks[index]) mask |= 1U << index;
    }
    return mask;
}
unsigned zero_field_check_mask() { return zero_field_mask_impl(); }
unsigned zero_field_failure_stage() { return zero_field_stage_impl(); }
std::size_t fixtures_passed() {
    const auto checks = fixture_results();
    std::size_t passed = 0U;
    for (const bool value : checks) passed += value ? 1U : 0U;
    return passed;
}
bool run_positive_tail_fixture_suite() { return fixtures_passed() == fixture_count(); }

} // namespace nhm2::g2h_e_s5::primary_positive_tail_v1
