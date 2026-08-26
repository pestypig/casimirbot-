#include "mini_boson_star_continuation_primary.hpp"

#include "mini_boson_star_arithmetic_primary.hpp"

#include <flint/fmpz.h>

#include <array>

namespace nhm2::g2h_e_s4::primary_continuation {
namespace {

bool advance_cell_ordinal(long *expected, const long observed) {
    if (expected == nullptr || observed != *expected || observed < 0
        || observed >= cell_count) { return false; }
    ++*expected;
    return true;
}

bool predictor_fixture() {
    arb_ptr left = _arb_vec_init(2), tangent = _arb_vec_init(2);
    arb_ptr acceleration = _arb_vec_init(2), output = _arb_vec_init(2);
    arb_set_si(left + 0, 1); arb_set_si(left + 1, -2);
    arb_set_si(tangent + 0, 3); arb_set_si(tangent + 1, 4);
    arb_set_si(acceleration + 0, 2); arb_set_si(acceleration + 1, -2);
    arb_t h; arb_init(h); arb_set_si(h, 1); arb_mul_2exp_si(h, h, -2);
    const bool pass = second_order_predictor(output, left, tangent, acceleration, 2, h);
    arb_mul_2exp_si(output + 0, output + 0, 4);
    arb_mul_2exp_si(output + 1, output + 1, 4);
    const bool scaled = arb_contains_si(output + 0, 29) && arb_contains_si(output + 1, -17);
    arb_clear(h); _arb_vec_clear(output, 2); _arb_vec_clear(acceleration, 2);
    _arb_vec_clear(tangent, 2); _arb_vec_clear(left, 2);
    return pass && scaled;
}

void bounds_for_selected_index(arb_t y, const long index) {
    if (index == 0) { arb_zero(y); return; }
    arb_set_ui(y, 3UL);
    arb_mul_2exp_si(y, y, first_radius_exponent + index - 2);
}

bool radius_fixture() {
    arb_t y, z0, z1, z2, margin;
    arb_init(y); arb_init(z0); arb_init(z1); arb_init(z2); arb_init(margin);
    arb_zero(z0); arb_zero(z1); arb_zero(z2); arb_one(margin);
    bounds_for_selected_index(y, 17);
    long selected = -1, evaluated = 0;
    const bool pass = select_least_radius(&selected, &evaluated, y, z0, z1, z2, margin)
        && selected == 17 && evaluated == radii_per_cell;
    arb_clear(margin); arb_clear(z2); arb_clear(z1); arb_clear(z0); arb_clear(y);
    return pass;
}

bool strict_boundary_fixture() {
    arb_t distance, left, right;
    arb_init(distance); arb_init(left); arb_init(right);
    arb_zero(distance); arb_set_ui(left, 1UL); arb_set_ui(right, 1UL);
    arb_mul_2exp_si(right, right, -1);
    bool pass = strict_ball_containment(distance, left, right);
    arb_set_ui(distance, 1UL); arb_mul_2exp_si(distance, distance, -1);
    pass = pass && !strict_ball_containment(distance, left, right);
    arb_clear(right); arb_clear(left); arb_clear(distance);
    return pass;
}

bool invalid_bound_fixture() {
    arb_t y, z0, z1, z2, margin;
    arb_init(y); arb_init(z0); arb_init(z1); arb_init(z2); arb_init(margin);
    arb_zero(y); arb_zero(z0); arb_zero(z1); arb_zero(z2); arb_one(margin);
    arb_neg(y, margin);
    long selected = -1, evaluated = 0;
    const bool pass = !select_least_radius(&selected, &evaluated, y, z0, z1, z2, margin);
    arb_clear(margin); arb_clear(z2); arb_clear(z1); arb_clear(z0); arb_clear(y);
    return pass;
}

bool manufactured_chain_fixture() {
    arb_ptr left = _arb_vec_init(1), tangent = _arb_vec_init(1);
    arb_ptr acceleration = _arb_vec_init(1), right = _arb_vec_init(1);
    arb_one(tangent); arb_zero(acceleration);
    arb_t h, y, z0, z1, z2, margin, previous_radius, radius, distance;
    arb_init(h); arb_init(y); arb_init(z0); arb_init(z1); arb_init(z2);
    arb_init(margin); arb_init(previous_radius); arb_init(radius); arb_init(distance);
    arb_set_ui(h, 1UL); arb_mul_2exp_si(h, h, -10);
    arb_zero(z0); arb_zero(z1); arb_zero(z2); arb_one(margin);
    long expected_ordinal = 0, inverse_builds = 0, radii_evaluated = 0;
    bool pass = true;
    for (long cell = 0; pass && cell < cell_count; ++cell) {
        pass = advance_cell_ordinal(&expected_ordinal, cell);
        arb_set_si(left, cell); arb_mul_2exp_si(left, left, -10);
        pass = pass && second_order_predictor(right, left, tangent, acceleration, 1, h);
        const long desired = (cell % 2 == 0) ? 71 : 72;
        bounds_for_selected_index(y, desired);
        long selected = -1, evaluated = 0;
        ++inverse_builds;
        pass = pass && select_least_radius(&selected, &evaluated, y, z0, z1, z2, margin)
            && selected == desired && evaluated == radii_per_cell;
        radii_evaluated += evaluated;
        arb_one(radius); arb_mul_2exp_si(radius, radius, first_radius_exponent + selected);
        if (cell != 0) {
            arb_zero(distance);
            pass = pass && strict_ball_containment(distance, previous_radius, radius);
        }
        arb_set(previous_radius, radius);
    }
    pass = pass && expected_ordinal == cell_count && inverse_builds == cell_count
        && radii_evaluated == cell_count * radii_per_cell
        && arb_contains_si(right, 1);
    arb_clear(distance); arb_clear(radius); arb_clear(previous_radius); arb_clear(margin);
    arb_clear(z2); arb_clear(z1); arb_clear(z0); arb_clear(y); arb_clear(h);
    _arb_vec_clear(right, 1); _arb_vec_clear(acceleration, 1);
    _arb_vec_clear(tangent, 1); _arb_vec_clear(left, 1);
    return pass;
}

bool chronology_fixture() {
    long expected = 0;
    return !advance_cell_ordinal(&expected, 1) && expected == 0
        && advance_cell_ordinal(&expected, 0) && expected == 1
        && !advance_cell_ordinal(&expected, 0) && expected == 1;
}

bool coefficient_majorant_fixture() {
    arb_poly_t left, right;
    arb_poly_init(left); arb_poly_init(right);
    arb_poly_set_coeff_si(left, 0, 1); arb_poly_set_coeff_si(left, 1, 2);
    arb_poly_set_coeff_si(right, 0, 3); arb_poly_set_coeff_si(right, 1, 4);
    arb_t envelope, majorant;
    arb_init(envelope); arb_init(majorant); arb_set_ui(envelope, 5UL);
    const bool pass = chebyshev_convolution_majorant(majorant, left, right, envelope)
        && arb_contains_si(majorant, 55056) && arb_is_exact(majorant);
    arb_clear(majorant); arb_clear(envelope); arb_poly_clear(right); arb_poly_clear(left);
    return pass;
}

bool coefficient_failure_fixture() {
    arb_poly_t left, right;
    arb_poly_init(left); arb_poly_init(right); arb_poly_one(left); arb_poly_one(right);
    arb_t envelope, output; arb_init(envelope); arb_init(output);
    arb_set_si(envelope, -1);
    const bool pass = !chebyshev_convolution_majorant(output, left, right, envelope);
    arb_clear(output); arb_clear(envelope); arb_poly_clear(right); arb_poly_clear(left);
    return pass;
}

bool coefficient_range_fixture() {
    fmpz_t weight; fmpz_init(weight);
    fmpz_ui_pow_ui(weight, 513UL, coefficient_weight_power);
    const bool pass = fmpz_bits(weight) > 64;
    fmpz_clear(weight);
    return pass;
}

std::array<bool, 10> fixture_results() {
    return {
        cell_count == 1024 && radii_per_cell == 73
            && first_radius_exponent == -192 && last_radius_exponent == -120,
        predictor_fixture(), radius_fixture(), strict_boundary_fixture(),
        invalid_bound_fixture(), manufactured_chain_fixture(), chronology_fixture(),
        coefficient_majorant_fixture(), coefficient_failure_fixture(),
        coefficient_range_fixture(),
    };
}

} // namespace

bool second_order_predictor(arb_ptr output, arb_srcptr left, arb_srcptr tangent,
    arb_srcptr acceleration, const long dimension, const arb_t h) {
    if (dimension <= 0 || !arb_is_finite(h)) { return false; }
    arb_t h_squared_half, term;
    arb_init(h_squared_half); arb_init(term);
    nhm2::g2h_e_s4::primary_arithmetic::multiply(h_squared_half, h, h);
    arb_mul_2exp_si(h_squared_half, h_squared_half, -1);
    for (long index = 0; index < dimension; ++index) {
        nhm2::g2h_e_s4::primary_arithmetic::multiply(term, h, tangent + index);
        nhm2::g2h_e_s4::primary_arithmetic::add(output + index, left + index, term);
        nhm2::g2h_e_s4::primary_arithmetic::multiply(term, h_squared_half, acceleration + index);
        nhm2::g2h_e_s4::primary_arithmetic::add(output + index, output + index, term);
    }
    arb_clear(term); arb_clear(h_squared_half);
    return true;
}

bool select_least_radius(long *selected, long *evaluated, const arb_t y,
    const arb_t z0, const arb_t z1, const arb_t z2,
    const arb_t domain_margin) {
    if (selected == nullptr || evaluated == nullptr || !arb_is_nonnegative(y)
        || !arb_is_nonnegative(z0) || !arb_is_nonnegative(z1)
        || !arb_is_nonnegative(z2) || !arb_is_positive(domain_margin)) { return false; }
    *selected = -1; *evaluated = 0;
    arb_t radius, polynomial, contraction, temp, one, domain_test;
    arb_init(radius); arb_init(polynomial); arb_init(contraction); arb_init(temp);
    arb_init(one); arb_init(domain_test); arb_one(one);
    for (long index = 0; index < radii_per_cell; ++index) {
        arb_one(radius); arb_mul_2exp_si(radius, radius, first_radius_exponent + index);
        nhm2::g2h_e_s4::primary_arithmetic::multiply(polynomial, z2, radius);
        nhm2::g2h_e_s4::primary_arithmetic::multiply(polynomial, polynomial, radius);
        arb_sub(temp, one, z0, nhm2::g2h_e_s4::primary_arithmetic::precision_bits);
        arb_sub(temp, temp, z1, nhm2::g2h_e_s4::primary_arithmetic::precision_bits);
        nhm2::g2h_e_s4::primary_arithmetic::multiply(temp, temp, radius);
        arb_sub(polynomial, polynomial, temp, nhm2::g2h_e_s4::primary_arithmetic::precision_bits);
        nhm2::g2h_e_s4::primary_arithmetic::add(polynomial, polynomial, y);
        nhm2::g2h_e_s4::primary_arithmetic::multiply(contraction, z2, radius);
        nhm2::g2h_e_s4::primary_arithmetic::add(contraction, contraction, z0);
        nhm2::g2h_e_s4::primary_arithmetic::add(contraction, contraction, z1);
        arb_sub(contraction, contraction, one, nhm2::g2h_e_s4::primary_arithmetic::precision_bits);
        arb_sub(domain_test, radius, domain_margin,
            nhm2::g2h_e_s4::primary_arithmetic::precision_bits);
        ++*evaluated;
        if (*selected < 0 && arb_is_negative(polynomial)
            && arb_is_negative(contraction) && arb_is_negative(domain_test)) {
            *selected = index;
        }
    }
    arb_clear(domain_test); arb_clear(one); arb_clear(temp); arb_clear(contraction);
    arb_clear(polynomial); arb_clear(radius);
    return *selected >= 0;
}

bool strict_ball_containment(const arb_t center_distance,
    const arb_t left_radius, const arb_t right_radius) {
    if (!arb_is_nonnegative(center_distance) || !arb_is_positive(left_radius)
        || !arb_is_positive(right_radius)) { return false; }
    arb_t comparison; arb_init(comparison);
    nhm2::g2h_e_s4::primary_arithmetic::add(comparison, center_distance, right_radius);
    arb_sub(comparison, comparison, left_radius,
        nhm2::g2h_e_s4::primary_arithmetic::precision_bits);
    bool pass = arb_is_negative(comparison) != 0;
    if (!pass) {
        nhm2::g2h_e_s4::primary_arithmetic::add(comparison, center_distance, left_radius);
        arb_sub(comparison, comparison, right_radius,
            nhm2::g2h_e_s4::primary_arithmetic::precision_bits);
        pass = arb_is_negative(comparison) != 0;
    }
    arb_clear(comparison);
    return pass;
}

bool chebyshev_convolution_majorant(arb_t output, const arb_poly_t left,
    const arb_poly_t right, const arb_t flat_carrier_envelope) {
    if (!arb_is_nonnegative(flat_carrier_envelope)
        || arb_poly_length(left) == 0 || arb_poly_length(right) == 0) { return false; }
    arb_poly_t product; arb_poly_init(product);
    arb_poly_mul(product, left, right,
        nhm2::g2h_e_s4::primary_arithmetic::precision_bits);
    arb_zero(output);
    arb_t absolute, weighted; arb_init(absolute); arb_init(weighted);
    fmpz_t weight; fmpz_init(weight);
    for (long degree = 0; degree < arb_poly_length(product); ++degree) {
        arb_abs(absolute, arb_poly_get_coeff_ptr(product, degree));
        fmpz_ui_pow_ui(weight, static_cast<unsigned long>(degree + 1),
            coefficient_weight_power);
        arb_mul_fmpz(weighted, absolute, weight,
            nhm2::g2h_e_s4::primary_arithmetic::precision_bits);
        nhm2::g2h_e_s4::primary_arithmetic::add(output, output, weighted);
    }
    nhm2::g2h_e_s4::primary_arithmetic::add(output, output, flat_carrier_envelope);
    fmpz_clear(weight); arb_clear(weighted); arb_clear(absolute); arb_poly_clear(product);
    return arb_is_finite(output) != 0;
}

std::size_t fixture_count() { return 10U; }

std::size_t fixtures_passed() {
    const auto checks = fixture_results();
    std::size_t passed = 0;
    for (const bool value : checks) { passed += value ? 1U : 0U; }
    return passed;
}

bool run_continuation_fixture_suite() { return fixtures_passed() == fixture_count(); }

} // namespace nhm2::g2h_e_s4::primary_continuation
