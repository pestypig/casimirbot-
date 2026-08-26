#include "mini_boson_star_arithmetic_primary.hpp"

#include <arb.h>
#include <flint/fmpq.h>
#include <flint/fmpz.h>

#include <array>

namespace nhm2::g2h_e_s4::primary_arithmetic {
namespace {

void set_dyadic(fmpq_t value, const fmpz_t numerator, const ulong denominator_bits) {
    fmpz_set(fmpq_numref(value), numerator);
    fmpz_one(fmpq_denref(value));
    fmpz_mul_2exp(fmpq_denref(value), fmpq_denref(value), denominator_bits);
    fmpq_canonicalise(value);
}

void set_small_dyadic(fmpq_t value, const slong numerator, const ulong denominator_bits) {
    fmpz_t integer;
    fmpz_init(integer);
    fmpz_set_si(integer, numerator);
    set_dyadic(value, integer, denominator_bits);
    fmpz_clear(integer);
}

} // namespace

void add(arb_t result, const arb_t left, const arb_t right) {
    arb_add(result, left, right, precision_bits);
}

void subtract(arb_t result, const arb_t left, const arb_t right) {
    arb_sub(result, left, right, precision_bits);
}

void multiply(arb_t result, const arb_t left, const arb_t right) {
    arb_mul(result, left, right, precision_bits);
}

bool divide(arb_t result, const arb_t numerator, const arb_t denominator) {
    if (arb_contains_zero(denominator)) {
        return false;
    }
    arb_div(result, numerator, denominator, precision_bits);
    return arb_is_finite(result) != 0;
}

bool project_midpoint_2m448(const arb_t input, fmpz_t lattice_n, arb_t error_ball) {
    if (!arb_is_finite(input)) {
        return false;
    }

    fmpq_t midpoint;
    fmpq_init(midpoint);
    arf_get_fmpq(midpoint, arb_midref(input));

    fmpz_t scaled_numerator, quotient, remainder, twice_remainder;
    fmpz_init(scaled_numerator);
    fmpz_init(quotient);
    fmpz_init(remainder);
    fmpz_init(twice_remainder);
    fmpz_mul_2exp(scaled_numerator, fmpq_numref(midpoint), 448UL);
    fmpz_fdiv_qr(quotient, remainder, scaled_numerator, fmpq_denref(midpoint));
    fmpz_mul_2exp(twice_remainder, remainder, 1UL);
    const int half_comparison = fmpz_cmp(twice_remainder, fmpq_denref(midpoint));
    if (half_comparison > 0 || (half_comparison == 0 && fmpz_is_odd(quotient))) {
        fmpz_add_ui(quotient, quotient, 1UL);
    }
    fmpz_set(lattice_n, quotient);

    fmpq_t projected;
    fmpq_init(projected);
    set_dyadic(projected, lattice_n, 448UL);
    arb_t exact_projected;
    arb_init(exact_projected);
    arb_set_fmpq(exact_projected, projected, precision_bits);
    arb_sub(error_ball, exact_projected, input, precision_bits);

    arb_clear(exact_projected);
    fmpq_clear(projected);
    fmpz_clear(twice_remainder);
    fmpz_clear(remainder);
    fmpz_clear(quotient);
    fmpz_clear(scaled_numerator);
    fmpq_clear(midpoint);
    return true;
}

namespace {

bool arithmetic_operations_fixture() {
    fmpq_t one_third, one_seventh, expected;
    fmpq_init(one_third);
    fmpq_init(one_seventh);
    fmpq_init(expected);
    fmpq_set_si(one_third, 1, 3);
    fmpq_set_si(one_seventh, 1, 7);
    arb_t left, right, result;
    arb_init(left);
    arb_init(right);
    arb_init(result);
    arb_set_fmpq(left, one_third, precision_bits);
    arb_set_fmpq(right, one_seventh, precision_bits);

    add(result, left, right);
    fmpq_set_si(expected, 10, 21);
    bool pass = arb_contains_fmpq(result, expected) != 0;
    subtract(result, left, right);
    fmpq_set_si(expected, 4, 21);
    pass = pass && arb_contains_fmpq(result, expected) != 0;
    multiply(result, left, right);
    fmpq_set_si(expected, 1, 21);
    pass = pass && arb_contains_fmpq(result, expected) != 0;
    pass = pass && divide(result, left, right);
    fmpq_set_si(expected, 7, 3);
    pass = pass && arb_contains_fmpq(result, expected) != 0;

    arb_clear(result);
    arb_clear(right);
    arb_clear(left);
    fmpq_clear(expected);
    fmpq_clear(one_seventh);
    fmpq_clear(one_third);
    return pass;
}

bool zero_divisor_fixture() {
    arb_t numerator, divisor;
    arb_init(numerator);
    arb_init(divisor);
    arb_one(numerator);
    arb_zero(divisor);
    arb_add_error_2exp_si(divisor, -20);
    const bool rejected = !divide(numerator, numerator, divisor);
    arb_clear(divisor);
    arb_clear(numerator);
    return rejected;
}

bool projection_case(const slong midpoint_numerator, const ulong midpoint_denominator_bits,
    const slong expected_n) {
    fmpq_t midpoint;
    fmpq_init(midpoint);
    set_small_dyadic(midpoint, midpoint_numerator, midpoint_denominator_bits);
    arb_t input, error;
    arb_init(input);
    arb_init(error);
    arb_set_fmpq(input, midpoint, precision_bits);
    fmpz_t lattice_n;
    fmpz_init(lattice_n);
    const bool pass = project_midpoint_2m448(input, lattice_n, error)
        && fmpz_equal_si(lattice_n, expected_n) && arb_is_exact(error);
    fmpz_clear(lattice_n);
    arb_clear(error);
    arb_clear(input);
    fmpq_clear(midpoint);
    return pass;
}

bool tie_projection_fixture() {
    return projection_case(5, 449UL, 2)
        && projection_case(7, 449UL, 4)
        && projection_case(-5, 449UL, -2)
        && projection_case(-7, 449UL, -4);
}

bool near_projection_fixture() {
    return projection_case(9, 450UL, 2)
        && projection_case(11, 450UL, 3)
        && projection_case(-9, 450UL, -2)
        && projection_case(-11, 450UL, -3);
}

bool directed_error_fixture() {
    fmpq_t midpoint, lower_error, upper_error;
    fmpq_init(midpoint);
    fmpq_init(lower_error);
    fmpq_init(upper_error);
    set_small_dyadic(midpoint, 5, 449UL);
    set_small_dyadic(lower_error, -1, 449UL);
    set_small_dyadic(upper_error, -1, 449UL);
    fmpq_t radius;
    fmpq_init(radius);
    set_small_dyadic(radius, 1, 500UL);
    fmpq_sub(lower_error, lower_error, radius);
    fmpq_add(upper_error, upper_error, radius);

    arb_t input, error;
    arb_init(input);
    arb_init(error);
    arb_set_fmpq(input, midpoint, precision_bits);
    arb_add_error_2exp_si(input, -500);
    fmpz_t lattice_n;
    fmpz_init(lattice_n);
    const bool pass = project_midpoint_2m448(input, lattice_n, error)
        && fmpz_equal_si(lattice_n, 2)
        && arb_contains_fmpq(error, lower_error) != 0
        && arb_contains_fmpq(error, upper_error) != 0;

    fmpz_clear(lattice_n);
    arb_clear(error);
    arb_clear(input);
    fmpq_clear(radius);
    fmpq_clear(upper_error);
    fmpq_clear(lower_error);
    fmpq_clear(midpoint);
    return pass;
}

bool nonfinite_projection_fixture() {
    arb_t input, error;
    arb_init(input);
    arb_init(error);
    arb_indeterminate(input);
    fmpz_t lattice_n;
    fmpz_init(lattice_n);
    const bool rejected = !project_midpoint_2m448(input, lattice_n, error);
    fmpz_clear(lattice_n);
    arb_clear(error);
    arb_clear(input);
    return rejected;
}

std::array<bool, 6> fixture_results() {
    return {
        precision_bits == 512 && projection_exponent == -448,
        arithmetic_operations_fixture(),
        zero_divisor_fixture(),
        tie_projection_fixture(),
        near_projection_fixture() && directed_error_fixture(),
        nonfinite_projection_fixture(),
    };
}

} // namespace

std::size_t fixture_count() {
    return 6U;
}

std::size_t fixtures_passed() {
    const auto checks = fixture_results();
    std::size_t passed = 0;
    for (const bool value : checks) {
        passed += value ? 1U : 0U;
    }
    return passed;
}

bool run_arithmetic_fixture_suite() {
    return fixtures_passed() == fixture_count();
}

} // namespace nhm2::g2h_e_s4::primary_arithmetic
