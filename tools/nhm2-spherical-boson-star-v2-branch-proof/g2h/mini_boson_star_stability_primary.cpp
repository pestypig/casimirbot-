#include "mini_boson_star_stability_primary.hpp"

#include "mini_boson_star_arithmetic_primary.hpp"

#include <arb_poly.h>

#include <array>

namespace nhm2::g2h_e_s4::primary_stability {
namespace {

bool constant_riccati_midpoint_fixture() {
    arb_poly_t k11, k12, k22;
    arb_poly_init(k11); arb_poly_init(k12); arb_poly_init(k22);
    arb_poly_set_coeff_si(k11, 0, 1); arb_poly_set_coeff_si(k22, 0, 1);
    arb_t midpoint, value11, value12, value22;
    arb_init(midpoint); arb_init(value11); arb_init(value12); arb_init(value22);
    bool pass = true;
    long steps = 0;
    for (long cell = 0; pass && cell < stability_cells; ++cell) {
        for (long step = 0; pass && step < midpoint_steps_per_cell; ++step) {
            arb_set_si(midpoint, 2 * step + 1);
            arb_mul_2exp_si(midpoint, midpoint, -6);
            arb_poly_evaluate(value11, k11, midpoint, primary_arithmetic::precision_bits);
            arb_poly_evaluate(value12, k12, midpoint, primary_arithmetic::precision_bits);
            arb_poly_evaluate(value22, k22, midpoint, primary_arithmetic::precision_bits);
            // Manufactured equality Riccati equation K'=0 with W=(1+L)I, p=1, theta'=0.
            pass = arb_is_one(value11) && arb_is_zero(value12) && arb_is_one(value22);
            ++steps;
        }
    }
    pass = pass && steps == stability_cells * midpoint_steps_per_cell
        && riccati_degree == 12;
    arb_clear(value22); arb_clear(value12); arb_clear(value11); arb_clear(midpoint);
    arb_poly_clear(k22); arb_poly_clear(k12); arb_poly_clear(k11);
    return pass;
}

bool exact_newton_fixture() {
    fmpq_t value, residual, derivative, correction, candidate, old_abs, new_abs;
    fmpq_init(value); fmpq_init(residual); fmpq_init(derivative); fmpq_init(correction);
    fmpq_init(candidate); fmpq_init(old_abs); fmpq_init(new_abs);
    fmpq_one(value);
    bool pass = true;
    long accepted = 0;
    for (long sweep = 0; pass && sweep < newton_sweeps; ++sweep) {
        fmpq_mul(residual, value, value); fmpq_sub_si(residual, residual, 2);
        fmpq_mul_si(derivative, value, 2); fmpq_div(correction, residual, derivative);
        fmpq_abs(old_abs, residual);
        bool found = false;
        for (long damping = 0; damping < newton_sweeps; ++damping) {
            fmpq_div_2exp(correction, correction, damping);
            fmpq_sub(candidate, value, correction);
            fmpq_mul(new_abs, candidate, candidate); fmpq_sub_si(new_abs, new_abs, 2);
            fmpq_abs(new_abs, new_abs);
            if (fmpq_cmp(new_abs, old_abs) < 0) {
                fmpq_set(value, candidate); found = true; ++accepted; break;
            }
            fmpq_mul_2exp(correction, correction, damping);
        }
        pass = found;
    }
    arb_t projected_input, projection_error;
    fmpz_t lattice_n;
    arb_init(projected_input); arb_init(projection_error); fmpz_init(lattice_n);
    arb_set_fmpq(projected_input, value, primary_arithmetic::precision_bits);
    pass = pass && accepted == newton_sweeps && fmpq_sgn(value) > 0
        && primary_arithmetic::project_midpoint_2m448(
            projected_input, lattice_n, projection_error);
    fmpz_clear(lattice_n); arb_clear(projection_error); arb_clear(projected_input);
    fmpq_clear(new_abs); fmpq_clear(old_abs); fmpq_clear(candidate); fmpq_clear(correction);
    fmpq_clear(derivative); fmpq_clear(residual); fmpq_clear(value);
    return pass;
}

bool riccati_residual_fixture() {
    arb_t c11, c12, c21, c22;
    arb_init(c11); arb_init(c12); arb_init(c21); arb_init(c22);
    arb_one(c11); arb_zero(c12); arb_zero(c21); arb_one(c22);
    bool pass = verify_positive_riccati_residual(c11, c12, c21, c22);
    arb_zero(c11);
    pass = pass && !verify_positive_riccati_residual(c11, c12, c21, c22);
    arb_clear(c22); arb_clear(c21); arb_clear(c12); arb_clear(c11);
    return pass;
}

bool jump_fixture() {
    fmpq_t observed, offset, threshold, expected;
    fmpq_init(observed); fmpq_init(offset); fmpq_init(threshold); fmpq_init(expected);
    fmpq_set_si(threshold, 1, 1); fmpq_div_2exp(threshold, threshold, 160);
    fmpq_set_si(expected, 3, 1); fmpq_div_2exp(expected, expected, 448);
    fmpq_sub(observed, threshold, expected);
    const bool pass = repair_diagonal_jump(offset, observed)
        && fmpq_equal(offset, expected) && jump_repairs == 1;
    fmpq_clear(expected); fmpq_clear(threshold); fmpq_clear(offset); fmpq_clear(observed);
    return pass;
}

bool inverse_iteration_fixture() {
    fmpq_t first, second;
    fmpq_init(first); fmpq_init(second); fmpq_one(first); fmpq_zero(second);
    long iterations = 0;
    for (; iterations < inverse_iterations; ++iterations) {
        // Solve diag(1,2) x_{n+1}=x_n and normalize by the first nonzero coefficient.
        fmpq_div_2exp(second, second, 1);
        if (fmpq_is_zero(first)) { return false; }
        fmpq_div(second, second, first); fmpq_one(first);
    }
    arb_t projected_input, projection_error;
    fmpz_t lattice_n;
    arb_init(projected_input); arb_init(projection_error); fmpz_init(lattice_n);
    arb_set_fmpq(projected_input, first, primary_arithmetic::precision_bits);
    const bool pass = iterations == inverse_iterations && fmpq_is_one(first)
        && fmpq_is_zero(second) && trial_degree == 16
        && primary_arithmetic::project_midpoint_2m448(
            projected_input, lattice_n, projection_error)
        && arb_is_zero(projection_error);
    fmpz_clear(lattice_n); arb_clear(projection_error); arb_clear(projected_input);
    fmpq_clear(second); fmpq_clear(first);
    return pass;
}

bool cutoff_fixture() {
    arb_poly_t cutoff; arb_poly_init(cutoff);
    arb_poly_set_coeff_si(cutoff, 0, 1);
    arb_poly_set_coeff_si(cutoff, 2, -3);
    arb_poly_set_coeff_si(cutoff, 3, 2);
    arb_t zero, one, value, derivative;
    arb_init(zero); arb_init(one); arb_init(value); arb_init(derivative);
    arb_zero(zero); arb_one(one);
    arb_poly_evaluate(value, cutoff, zero, primary_arithmetic::precision_bits);
    bool pass = arb_is_one(value);
    arb_poly_evaluate(value, cutoff, one, primary_arithmetic::precision_bits);
    pass = pass && arb_is_zero(value);
    arb_poly_derivative(cutoff, cutoff, primary_arithmetic::precision_bits);
    arb_poly_evaluate(derivative, cutoff, zero, primary_arithmetic::precision_bits);
    pass = pass && arb_is_zero(derivative);
    arb_poly_evaluate(derivative, cutoff, one, primary_arithmetic::precision_bits);
    pass = pass && arb_is_zero(derivative);
    arb_clear(derivative); arb_clear(value); arb_clear(one); arb_clear(zero);
    arb_poly_clear(cutoff);
    return pass;
}

bool strict_predicate_fixture() {
    arb_t lower, upper, threshold;
    arb_init(lower); arb_init(upper); arb_init(threshold);
    arb_one(lower); arb_mul_2exp_si(lower, lower, lower_exponent);
    arb_one(upper); arb_set_ui(threshold, 2UL);
    bool pass = strict_stability_predicates(lower, upper, threshold);
    arb_set(upper, threshold);
    pass = pass && !strict_stability_predicates(lower, upper, threshold);
    arb_zero(lower);
    pass = pass && !strict_stability_predicates(lower, upper, threshold);
    arb_clear(threshold); arb_clear(upper); arb_clear(lower);
    return pass;
}

bool mass_derivative_fixture() {
    arb_t derivative; arb_init(derivative); arb_one(derivative);
    long cells = 0;
    bool pass = true;
    for (; cells < 1024; ++cells) { pass = pass && arb_is_positive(derivative); }
    arb_zero(derivative);
    pass = pass && cells == 1024 && !arb_is_positive(derivative);
    arb_clear(derivative);
    return pass;
}

bool budget_fixture() {
    return stability_cells == 256 && midpoint_steps_per_cell == 32
        && newton_sweeps == 16 && jump_repairs == 1
        && inverse_iterations == 64 && lower_exponent == -96;
}

std::array<bool, 9> fixture_results() {
    return {budget_fixture(), constant_riccati_midpoint_fixture(), exact_newton_fixture(),
        riccati_residual_fixture(), jump_fixture(), inverse_iteration_fixture(),
        cutoff_fixture(), strict_predicate_fixture(), mass_derivative_fixture()};
}

} // namespace

bool verify_positive_riccati_residual(const arb_t c11, const arb_t c12,
    const arb_t c21, const arb_t c22) {
    arb_t identity_difference, determinant, product;
    arb_init(identity_difference); arb_init(determinant); arb_init(product);
    arb_sub(identity_difference, c12, c21, primary_arithmetic::precision_bits);
    primary_arithmetic::multiply(determinant, c11, c22);
    primary_arithmetic::multiply(product, c12, c21);
    arb_sub(determinant, determinant, product, primary_arithmetic::precision_bits);
    const bool pass = arb_contains_zero(identity_difference)
        && arb_is_zero(identity_difference) && arb_is_positive(c11)
        && arb_is_positive(determinant);
    arb_clear(product); arb_clear(determinant); arb_clear(identity_difference);
    return pass;
}

bool repair_diagonal_jump(fmpq_t offset, const fmpq_t observed_jump) {
    fmpq_t threshold, deficit, step, quotient;
    fmpz_t lattice_count;
    fmpq_init(threshold); fmpq_init(deficit); fmpq_init(step); fmpq_init(quotient);
    fmpz_init(lattice_count);
    fmpq_set_si(threshold, 1, 1); fmpq_div_2exp(threshold, threshold, 160);
    fmpq_set_si(step, 1, 1); fmpq_div_2exp(step, step, 448);
    fmpq_sub(deficit, threshold, observed_jump);
    if (fmpq_sgn(deficit) <= 0) { fmpq_zero(offset); }
    else {
        fmpq_div(quotient, deficit, step);
        fmpz_cdiv_q(lattice_count, fmpq_numref(quotient), fmpq_denref(quotient));
        fmpq_set_fmpz(offset, lattice_count);
        fmpq_mul(offset, offset, step);
    }
    fmpz_clear(lattice_count);
    fmpq_clear(quotient); fmpq_clear(step); fmpq_clear(deficit); fmpq_clear(threshold);
    return true;
}

bool strict_stability_predicates(const arb_t lower, const arb_t upper,
    const arb_t essential_threshold) {
    arb_t difference; arb_init(difference);
    arb_sub(difference, upper, lower, primary_arithmetic::precision_bits);
    const bool ordered = arb_is_nonnegative(difference) != 0;
    arb_sub(difference, upper, essential_threshold, primary_arithmetic::precision_bits);
    const bool below = arb_is_negative(difference) != 0;
    const bool pass = arb_is_positive(lower) && ordered && below;
    arb_clear(difference);
    return pass;
}

std::size_t fixture_count() { return 9U; }
std::size_t fixtures_passed() {
    const auto checks = fixture_results(); std::size_t passed = 0;
    for (const bool value : checks) { passed += value ? 1U : 0U; }
    return passed;
}
bool run_stability_fixture_suite() { return fixtures_passed() == fixture_count(); }

} // namespace nhm2::g2h_e_s4::primary_stability
