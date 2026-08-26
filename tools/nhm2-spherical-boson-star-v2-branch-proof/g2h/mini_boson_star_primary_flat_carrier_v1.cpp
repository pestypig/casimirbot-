#include "mini_boson_star_primary_flat_carrier_v1.hpp"

#include <flint/fmpq.h>
#include <flint/fmpz_mpoly.h>

#include <array>
#include <climits>

namespace nhm2::g2h_e_s5::primary_flat_carrier_v1 {
namespace {

constexpr std::array<unsigned, parameter_derivative_pairs> kPairU = {0U, 0U, 0U, 1U, 1U, 2U};
constexpr std::array<unsigned, parameter_derivative_pairs> kPairV = {0U, 1U, 2U, 0U, 1U, 0U};

bool finite(const arb_t value) { return arb_is_finite(value) != 0; }

void set_rational(arb_t value, long numerator, long denominator) {
    fmpq_t rational;
    fmpq_init(rational);
    fmpq_set_si(rational, numerator, denominator);
    arb_set_fmpq(value, rational, precision_bits);
    fmpq_clear(rational);
}

bool q_in_frozen_domain(const arb_t q) {
    if (!finite(q)) return false;
    if (arb_is_zero(q)) return true;
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

template <std::size_t Count>
void init_values(std::array<arb_struct, Count> &values) {
    for (auto &value : values) arb_init(&value);
}

template <std::size_t Count>
void clear_values(std::array<arb_struct, Count> &values) {
    for (auto &value : values) arb_clear(&value);
}

unsigned binomial(unsigned n, unsigned k) {
    if (k > n) return 0U;
    return n == 2U && k == 1U ? 2U : 1U;
}

unsigned long stirling_second_kind_12(unsigned k) {
    std::array<unsigned long, derivative_order + 1U> row{};
    row[0] = 1UL;
    for (unsigned n = 1U; n <= derivative_order; ++n) {
        for (unsigned index = n; index > 0U; --index) {
            row[index] = index * row[index] + row[index-1U];
        }
        row[0] = 0UL;
    }
    return k <= derivative_order ? row[k] : 0UL;
}

bool evaluate_exact_polynomial(arb_t result, const fmpz_mpoly_t polynomial,
    const fmpz_mpoly_ctx_t context, const arb_t a, const arb_t b, const arb_t q) {
    const arb_struct *variables[] = {a, b, q};
    fmpz_t coefficient;
    fmpz_init(coefficient);
    arb_t term, power;
    arb_init(term); arb_init(power);
    ulong exponents[3] = {0UL, 0UL, 0UL};
    arb_zero(result);
    bool pass = true;
    const slong length = fmpz_mpoly_length(polynomial, context);
    for (slong index = 0; pass && index < length; ++index) {
        pass = fmpz_mpoly_term_exp_fits_ui(polynomial, index, context) != 0;
        if (!pass) break;
        fmpz_mpoly_get_term_coeff_fmpz(coefficient, polynomial, index, context);
        fmpz_mpoly_get_term_exp_ui(exponents, polynomial, index, context);
        arb_set_fmpz(term, coefficient);
        for (std::size_t variable = 0; variable < 3U; ++variable) {
            if (exponents[variable] == 0UL) continue;
            arb_pow_ui(power, variables[variable], exponents[variable], precision_bits);
            arb_mul(term, term, power, precision_bits);
        }
        arb_add(result, result, term, precision_bits);
        pass = finite(result);
    }
    arb_clear(power); arb_clear(term); fmpz_clear(coefficient);
    return pass;
}

void carrier_parameter_derivative(arb_t result, const arb_t carrier,
    const arb_t inverse_q, const arb_t logarithm, unsigned u, unsigned v) {
    arb_t factor;
    arb_init(factor);
    arb_set(result, carrier);
    if (u != 0U) {
        arb_pow_ui(factor, inverse_q, u, precision_bits);
        arb_mul(result, result, factor, precision_bits);
    }
    if (v != 0U) {
        arb_pow_ui(factor, logarithm, v, precision_bits);
        arb_mul(result, result, factor, precision_bits);
    }
    if ((u + v) % 2U != 0U) arb_neg(result, result);
    arb_clear(factor);
}

void differentiate_parameter_polynomial(fmpz_mpoly_t result,
    const fmpz_mpoly_t polynomial, unsigned u, unsigned v,
    fmpz_mpoly_t scratch, const fmpz_mpoly_ctx_t context) {
    fmpz_mpoly_set(result, polynomial, context);
    for (unsigned order = 0; order < u; ++order) {
        fmpz_mpoly_derivative(scratch, result, 0, context);
        fmpz_mpoly_swap(result, scratch, context);
    }
    for (unsigned order = 0; order < v; ++order) {
        fmpz_mpoly_derivative(scratch, result, 1, context);
        fmpz_mpoly_swap(result, scratch, context);
    }
}

bool exact_absolute_upper(arb_t upper, const arb_t value) {
    arb_t absolute;
    arb_init(absolute);
    arf_t endpoint;
    arf_init(endpoint);
    arb_abs(absolute, value);
    arb_get_ubound_arf(endpoint, absolute, precision_bits);
    const bool pass = arf_is_finite(endpoint) != 0 && arf_sgn(endpoint) >= 0;
    if (pass) arb_set_arf(upper, endpoint);
    arf_clear(endpoint); arb_clear(absolute);
    return pass;
}

bool exact_lower(arb_t lower, const arb_t value) {
    arf_t endpoint;
    arf_init(endpoint);
    arb_get_lbound_arf(endpoint, value, precision_bits);
    const bool pass = arf_is_finite(endpoint) != 0;
    if (pass) arb_set_arf(lower, endpoint);
    arf_clear(endpoint);
    return pass;
}

bool exact_upper(arb_t upper, const arb_t value) {
    arf_t endpoint;
    arf_init(endpoint);
    arb_get_ubound_arf(endpoint, value, precision_bits);
    const bool pass = arf_is_finite(endpoint) != 0;
    if (pass) arb_set_arf(upper, endpoint);
    arf_clear(endpoint);
    return pass;
}

bool exp_power_supremum(arb_t upper, const arb_t a_lower, const arb_t h) {
    // sup_{x>=255} exp(-a_lower*x)*x^h. For h>0 the unrestricted
    // stationary point is h/a_lower; taking max with x=255 is valid whether
    // that stationary point lies inside the half-line or not.
    arb_t boundary, boundary_value, stationary, stationary_value, temporary;
    arb_init(boundary); arb_init(boundary_value); arb_init(stationary);
    arb_init(stationary_value); arb_init(temporary);
    arb_set_ui(boundary, 255UL);
    arb_mul(temporary, a_lower, boundary, precision_bits);
    arb_neg(temporary, temporary);
    arb_exp(boundary_value, temporary, precision_bits);
    arb_pow(temporary, boundary, h, precision_bits);
    arb_mul(boundary_value, boundary_value, temporary, precision_bits);

    arb_set(stationary_value, boundary_value);
    if (arb_is_positive(h)) {
        arb_div(stationary, h, a_lower, precision_bits);
        arb_pow(stationary_value, stationary, h, precision_bits);
        arb_neg(temporary, h);
        arb_exp(temporary, temporary, precision_bits);
        arb_mul(stationary_value, stationary_value, temporary, precision_bits);
        arb_max(stationary_value, stationary_value, boundary_value, precision_bits);
    }
    const bool pass = exact_upper(upper, stationary_value)
        && finite(upper) && arb_is_nonnegative(upper);
    arb_clear(temporary); arb_clear(stationary_value); arb_clear(stationary);
    arb_clear(boundary_value); arb_clear(boundary);
    return pass;
}

bool polynomial_envelope(arb_t upper, const fmpz_mpoly_t polynomial,
    const fmpz_mpoly_ctx_t context, const arb_t a_lower,
    const arb_t a_absolute_upper, const arb_t b_upper,
    const arb_t b_absolute_upper, unsigned j, unsigned carrier_a_order,
    unsigned carrier_b_order) {
    fmpz_t coefficient;
    fmpz_init(coefficient);
    ulong exponents[3] = {0UL, 0UL, 0UL};
    arb_t term, factor, h, supremum;
    arb_init(term); arb_init(factor); arb_init(h); arb_init(supremum);
    arb_zero(upper);
    bool pass = true;
    const slong length = fmpz_mpoly_length(polynomial, context);
    for (slong index = 0; pass && index < length; ++index) {
        pass = fmpz_mpoly_term_exp_fits_ui(polynomial, index, context) != 0;
        if (!pass) break;
        fmpz_mpoly_get_term_coeff_fmpz(coefficient, polynomial, index, context);
        fmpz_mpoly_get_term_exp_ui(exponents, polynomial, index, context);
        if (exponents[2] > static_cast<ulong>(LONG_MAX)) { pass = false; break; }
        arb_set_fmpz(term, coefficient);
        arb_abs(term, term);
        if (exponents[0] != 0UL) {
            arb_pow_ui(factor, a_absolute_upper, exponents[0], precision_bits);
            arb_mul(term, term, factor, precision_bits);
        }
        if (exponents[1] != 0UL) {
            arb_pow_ui(factor, b_absolute_upper, exponents[1], precision_bits);
            arb_mul(term, term, factor, precision_bits);
        }
        const slong shift = static_cast<slong>(2U*j + carrier_a_order + carrier_b_order)
            - static_cast<slong>(exponents[2]);
        arb_add_si(h, b_upper, shift, precision_bits);
        pass = exp_power_supremum(supremum, a_lower, h);
        if (!pass) break;
        arb_mul(term, term, supremum, precision_bits);
        arb_add(upper, upper, term, precision_bits);
        pass = finite(upper) && arb_is_nonnegative(upper);
    }
    if (pass) pass = exact_upper(upper, upper) && arb_is_nonnegative(upper);
    arb_clear(supremum); arb_clear(h); arb_clear(factor); arb_clear(term);
    fmpz_clear(coefficient);
    return pass;
}

bool inventory_fixture() {
    std::array<bool, mixed_derivative_inventory> seen{};
    std::size_t count = 0U;
    for (unsigned j = 0; j <= derivative_order; ++j) {
        for (std::size_t pair = 0; pair < parameter_derivative_pairs; ++pair) {
            const std::size_t index = mixed_index(kPairU[pair], kPairV[pair], j);
            if (index >= seen.size() || seen[index]) return false;
            seen[index] = true;
            ++count;
        }
    }
    return count == mixed_derivative_inventory
        && mixed_index(3U, 0U, 0U) == mixed_derivative_inventory
        && mixed_index(0U, 0U, 13U) == mixed_derivative_inventory;
}

bool endpoint_fixture() {
    arb_t a, b, q;
    arb_init(a); arb_init(b); arb_init(q);
    arb_one(a); arb_zero(b); arb_zero(q);
    std::array<arb_struct, mixed_derivative_inventory> values;
    init_values(values);
    bool pass = evaluate_mixed_derivatives(values.data(), a, b, q);
    for (const auto &value : values) pass = pass && arb_is_zero(&value) != 0;
    clear_values(values);
    arb_clear(q); arb_clear(b); arb_clear(a);
    return pass;
}

bool manufactured_identity_fixture() {
    arb_t a, b, q, carrier, exponent, logarithm, inverse_q, q_squared, q_fourth;
    arb_t direct, direct_one, direct_two, temporary;
    arb_init(a); arb_init(b); arb_init(q); arb_init(carrier); arb_init(exponent);
    arb_init(logarithm); arb_init(inverse_q); arb_init(q_squared); arb_init(q_fourth);
    arb_init(direct); arb_init(direct_one); arb_init(direct_two); arb_init(temporary);
    set_rational(a, 2, 1); arb_zero(b); set_rational(q, 1, 255);
    std::array<arb_struct, mixed_derivative_inventory> values;
    init_values(values);
    bool pass = evaluate_mixed_derivatives(values.data(), a, b, q);

    arb_div(exponent, a, q, precision_bits);
    arb_neg(exponent, exponent);
    arb_exp(carrier, exponent, precision_bits);
    arb_log(logarithm, q, precision_bits);
    arb_inv(inverse_q, q, precision_bits);
    arb_mul(q_squared, q, q, precision_bits);
    arb_mul(q_fourth, q_squared, q_squared, precision_bits);
    arb_mul(direct_one, carrier, a, precision_bits);
    arb_div(direct_one, direct_one, q_squared, precision_bits);
    arb_mul(direct_two, a, a, precision_bits);
    arb_mul(temporary, a, q, precision_bits);
    arb_mul_2exp_si(temporary, temporary, 1);
    arb_sub(direct_two, direct_two, temporary, precision_bits);
    arb_mul(direct_two, direct_two, carrier, precision_bits);
    arb_div(direct_two, direct_two, q_fourth, precision_bits);
    pass = pass && arb_overlaps(&values[mixed_index(0U, 0U, 0U)], carrier) != 0
        && arb_overlaps(&values[mixed_index(0U, 0U, 1U)], direct_one) != 0
        && arb_overlaps(&values[mixed_index(0U, 0U, 2U)], direct_two) != 0;

    for (std::size_t pair = 0; pass && pair < parameter_derivative_pairs; ++pair) {
        carrier_parameter_derivative(direct, carrier, inverse_q, logarithm,
            kPairU[pair], kPairV[pair]);
        pass = arb_overlaps(&values[mixed_index(kPairU[pair], kPairV[pair], 0U)], direct) != 0;
    }
    // Independent j=1 parameter identities:
    // d_a(d_q C)=-(d_q C)/q+C/q^2 and
    // d_b(d_q C)=-log(q)*(d_q C)-C/q for b=0.
    arb_mul(direct, direct_one, inverse_q, precision_bits);
    arb_neg(direct, direct);
    arb_mul(temporary, carrier, inverse_q, precision_bits);
    arb_mul(temporary, temporary, inverse_q, precision_bits);
    arb_add(direct, direct, temporary, precision_bits);
    pass = pass && arb_overlaps(&values[mixed_index(1U, 0U, 1U)], direct) != 0;
    arb_mul(direct, logarithm, direct_one, precision_bits);
    arb_neg(direct, direct);
    arb_mul(temporary, carrier, inverse_q, precision_bits);
    arb_sub(direct, direct, temporary, precision_bits);
    pass = pass && arb_overlaps(&values[mixed_index(0U, 1U, 1U)], direct) != 0;

    clear_values(values);
    arb_clear(temporary); arb_clear(direct_two); arb_clear(direct_one); arb_clear(direct);
    arb_clear(q_fourth); arb_clear(q_squared); arb_clear(inverse_q); arb_clear(logarithm);
    arb_clear(exponent); arb_clear(carrier); arb_clear(q); arb_clear(b); arb_clear(a);
    return pass;
}

bool order_twelve_fixture() {
    arb_t a, b, q;
    arb_init(a); arb_init(b); arb_init(q);
    set_rational(a, 3, 2); set_rational(b, -1, 3); set_rational(q, 1, 510);
    std::array<arb_struct, mixed_derivative_inventory> values;
    init_values(values);
    bool pass = evaluate_mixed_derivatives(values.data(), a, b, q);
    for (const auto &value : values) pass = pass && finite(&value);
    clear_values(values);
    arb_clear(q); arb_clear(b); arb_clear(a);
    return pass;
}

bool envelope_containment_fixture() {
    arf_t lower, upper;
    arf_init(lower); arf_init(upper);
    arb_t a_box, b_box, a, b, q, absolute;
    arb_init(a_box); arb_init(b_box); arb_init(a); arb_init(b); arb_init(q); arb_init(absolute);
    arf_set_si(lower, 1); arf_set_si(upper, 2);
    arb_set_interval_arf(a_box, lower, upper, precision_bits);
    arf_set_si(lower, -1); arf_set_si(upper, 1);
    arb_set_interval_arf(b_box, lower, upper, precision_bits);
    std::array<arb_struct, mixed_derivative_inventory> envelopes;
    std::array<arb_struct, mixed_derivative_inventory> values;
    init_values(envelopes); init_values(values);
    bool pass = evaluate_mixed_envelopes(envelopes.data(), a_box, b_box);
    set_rational(a, 3, 2); arb_zero(b); set_rational(q, 1, 510);
    pass = pass && evaluate_mixed_derivatives(values.data(), a, b, q);
    for (std::size_t index = 0; pass && index < mixed_derivative_inventory; ++index) {
        arb_abs(absolute, &values[index]);
        pass = finite(&envelopes[index]) && arb_is_nonnegative(&envelopes[index])
            && arb_le(absolute, &envelopes[index]) != 0;
    }
    clear_values(values); clear_values(envelopes);
    arb_clear(absolute); arb_clear(q); arb_clear(b); arb_clear(a);
    arb_clear(b_box); arb_clear(a_box); arf_clear(upper); arf_clear(lower);
    return pass;
}

bool envelope_rejection_fixture() {
    arf_t lower, upper;
    arf_init(lower); arf_init(upper);
    arb_t a_box, b_box;
    arb_init(a_box); arb_init(b_box);
    std::array<arb_struct, mixed_derivative_inventory> envelopes;
    init_values(envelopes);
    arf_zero(lower); arf_one(upper);
    arb_set_interval_arf(a_box, lower, upper, precision_bits);
    arb_zero(b_box);
    bool pass = !evaluate_mixed_envelopes(envelopes.data(), a_box, b_box);
    arb_one(a_box); arb_indeterminate(b_box);
    pass = pass && !evaluate_mixed_envelopes(envelopes.data(), a_box, b_box);
    clear_values(envelopes); arb_clear(b_box); arb_clear(a_box);
    arf_clear(upper); arf_clear(lower);
    return pass;
}

bool coefficient_norm_fixture() {
    arb_t a_box, b_box;
    arb_init(a_box); arb_init(b_box);
    set_rational(a_box, 3, 2); set_rational(b_box, -1, 3);
    std::array<arb_struct, mixed_derivative_inventory> envelopes;
    std::array<arb_struct, parameter_derivative_pairs> b_theta;
    std::array<arb_struct, parameter_derivative_pairs> weighted;
    init_values(envelopes); init_values(b_theta); init_values(weighted);
    bool pass = evaluate_mixed_envelopes(envelopes.data(), a_box, b_box)
        && assemble_coefficient_norm_bounds(b_theta.data(), weighted.data(), envelopes.data());
    for (std::size_t pair = 0; pass && pair < parameter_derivative_pairs; ++pair) {
        pass = finite(&b_theta[pair]) && arb_is_nonnegative(&b_theta[pair])
            && finite(&weighted[pair]) && arb_is_nonnegative(&weighted[pair])
            && arb_le(&envelopes[mixed_index(kPairU[pair], kPairV[pair], 0U)],
                &weighted[pair]) != 0;
    }
    clear_values(weighted); clear_values(b_theta); clear_values(envelopes);
    arb_clear(b_box); arb_clear(a_box);
    return pass;
}

bool coefficient_norm_rejection_fixture() {
    std::array<arb_struct, mixed_derivative_inventory> envelopes;
    std::array<arb_struct, parameter_derivative_pairs> b_theta;
    std::array<arb_struct, parameter_derivative_pairs> weighted;
    init_values(envelopes); init_values(b_theta); init_values(weighted);
    for (auto &value : envelopes) arb_zero(&value);
    arb_indeterminate(&envelopes[17]);
    bool pass = !assemble_coefficient_norm_bounds(b_theta.data(), weighted.data(), envelopes.data());
    arb_zero(&envelopes[17]); arb_set_si(&envelopes[9], -1);
    pass = pass && !assemble_coefficient_norm_bounds(b_theta.data(), weighted.data(), envelopes.data());
    clear_values(weighted); clear_values(b_theta); clear_values(envelopes);
    return pass;
}

bool rejection_fixture() {
    arb_t a, b, q;
    arb_init(a); arb_init(b); arb_init(q);
    std::array<arb_struct, mixed_derivative_inventory> values;
    init_values(values);
    arb_zero(a); arb_zero(b); arb_zero(q);
    bool pass = !evaluate_mixed_derivatives(values.data(), a, b, q);
    arb_one(a); arb_indeterminate(b);
    pass = pass && !evaluate_mixed_derivatives(values.data(), a, b, q);
    arb_zero(b); set_rational(q, -1, 510);
    pass = pass && !evaluate_mixed_derivatives(values.data(), a, b, q);
    set_rational(q, 1, 254);
    pass = pass && !evaluate_mixed_derivatives(values.data(), a, b, q);
    arb_zero(q); arb_add_error_2exp_si(q, -500);
    pass = pass && !evaluate_mixed_derivatives(values.data(), a, b, q);
    clear_values(values);
    arb_clear(q); arb_clear(b); arb_clear(a);
    return pass;
}

std::array<bool, 9> fixture_results() {
    return {inventory_fixture(), endpoint_fixture(), manufactured_identity_fixture(),
        order_twelve_fixture(), envelope_containment_fixture(),
        envelope_rejection_fixture(), coefficient_norm_fixture(),
        coefficient_norm_rejection_fixture(), rejection_fixture()};
}

} // namespace

std::size_t mixed_index(unsigned u, unsigned v, unsigned j) {
    if (j > derivative_order || u + v > 2U) return mixed_derivative_inventory;
    for (std::size_t pair = 0; pair < parameter_derivative_pairs; ++pair) {
        if (kPairU[pair] == u && kPairV[pair] == v) {
            return static_cast<std::size_t>(j) * parameter_derivative_pairs + pair;
        }
    }
    return mixed_derivative_inventory;
}

bool evaluate_mixed_derivatives(arb_ptr derivatives, const arb_t a,
    const arb_t b, const arb_t q) {
    if (derivatives == nullptr || !finite(a) || !arb_is_positive(a) || !finite(b)
        || !q_in_frozen_domain(q)) return false;
    if (arb_is_zero(q)) {
        for (std::size_t index = 0; index < mixed_derivative_inventory; ++index) {
            arb_zero(derivatives + index);
        }
        return true;
    }

    arb_t logarithm, exponent, carrier, inverse_q, inverse_q_squared, inverse_power;
    arb_t term;
    arb_init(logarithm); arb_init(exponent); arb_init(carrier); arb_init(inverse_q);
    arb_init(inverse_q_squared); arb_init(inverse_power); arb_init(term);
    std::array<arb_struct, parameter_derivative_pairs> carrier_derivatives;
    std::array<arb_struct, parameter_derivative_pairs> polynomial_derivatives;
    init_values(carrier_derivatives); init_values(polynomial_derivatives);

    arb_log(logarithm, q, precision_bits);
    arb_mul(exponent, b, logarithm, precision_bits);
    arb_div(carrier, a, q, precision_bits);
    arb_add(exponent, exponent, carrier, precision_bits);
    arb_neg(exponent, exponent);
    arb_exp(carrier, exponent, precision_bits);
    arb_inv(inverse_q, q, precision_bits);
    arb_mul(inverse_q_squared, inverse_q, inverse_q, precision_bits);
    arb_one(inverse_power);
    for (std::size_t pair = 0; pair < parameter_derivative_pairs; ++pair) {
        carrier_parameter_derivative(&carrier_derivatives[pair], carrier, inverse_q,
            logarithm, kPairU[pair], kPairV[pair]);
    }

    fmpz_mpoly_ctx_t context;
    fmpz_mpoly_ctx_init(context, 3, ORD_LEX);
    fmpz_mpoly_t current, next, a_generator, b_generator, q_generator, factor;
    fmpz_mpoly_t temporary, polynomial_q_derivative, parameter_derivative, scratch;
    fmpz_mpoly_init(current, context); fmpz_mpoly_init(next, context);
    fmpz_mpoly_init(a_generator, context); fmpz_mpoly_init(b_generator, context);
    fmpz_mpoly_init(q_generator, context); fmpz_mpoly_init(factor, context);
    fmpz_mpoly_init(temporary, context); fmpz_mpoly_init(polynomial_q_derivative, context);
    fmpz_mpoly_init(parameter_derivative, context); fmpz_mpoly_init(scratch, context);
    fmpz_mpoly_one(current, context);
    fmpz_mpoly_gen(a_generator, 0, context);
    fmpz_mpoly_gen(b_generator, 1, context);
    fmpz_mpoly_gen(q_generator, 2, context);

    bool pass = finite(carrier) && finite(inverse_q_squared);
    for (unsigned j = 0; pass && j <= derivative_order; ++j) {
        for (std::size_t pair = 0; pass && pair < parameter_derivative_pairs; ++pair) {
            differentiate_parameter_polynomial(parameter_derivative, current,
                kPairU[pair], kPairV[pair], scratch, context);
            pass = evaluate_exact_polynomial(&polynomial_derivatives[pair],
                parameter_derivative, context, a, b, q);
        }
        for (std::size_t pair = 0; pass && pair < parameter_derivative_pairs; ++pair) {
            const unsigned u = kPairU[pair];
            const unsigned v = kPairV[pair];
            arb_zero(derivatives + mixed_index(u, v, j));
            for (unsigned r = 0; r <= u; ++r) {
                for (unsigned s = 0; s <= v; ++s) {
                    const std::size_t carrier_index = mixed_index(r, s, 0U);
                    const std::size_t polynomial_index = mixed_index(u-r, v-s, 0U);
                    arb_mul(term, &carrier_derivatives[carrier_index],
                        &polynomial_derivatives[polynomial_index], precision_bits);
                    arb_mul_ui(term, term, binomial(u, r) * binomial(v, s), precision_bits);
                    arb_add(derivatives + mixed_index(u, v, j),
                        derivatives + mixed_index(u, v, j), term, precision_bits);
                }
            }
            arb_mul(derivatives + mixed_index(u, v, j),
                derivatives + mixed_index(u, v, j), inverse_power, precision_bits);
            pass = finite(derivatives + mixed_index(u, v, j));
        }
        if (j == derivative_order) break;

        // Exact integer recurrence P_(j+1)=(a-(b+2j)q)P_j+q^2*d_q(P_j).
        fmpz_mpoly_mul(temporary, b_generator, q_generator, context);
        fmpz_mpoly_sub(factor, a_generator, temporary, context);
        if (j != 0U) {
            fmpz_mpoly_scalar_mul_ui(temporary, q_generator, 2UL * j, context);
            fmpz_mpoly_sub(factor, factor, temporary, context);
        }
        fmpz_mpoly_mul(next, factor, current, context);
        fmpz_mpoly_derivative(polynomial_q_derivative, current, 2, context);
        fmpz_mpoly_mul(temporary, polynomial_q_derivative, q_generator, context);
        fmpz_mpoly_mul(temporary, temporary, q_generator, context);
        fmpz_mpoly_add(next, next, temporary, context);
        fmpz_mpoly_swap(current, next, context);
        arb_mul(inverse_power, inverse_power, inverse_q_squared, precision_bits);
    }

    fmpz_mpoly_clear(scratch, context); fmpz_mpoly_clear(parameter_derivative, context);
    fmpz_mpoly_clear(polynomial_q_derivative, context); fmpz_mpoly_clear(temporary, context);
    fmpz_mpoly_clear(factor, context); fmpz_mpoly_clear(q_generator, context);
    fmpz_mpoly_clear(b_generator, context); fmpz_mpoly_clear(a_generator, context);
    fmpz_mpoly_clear(next, context); fmpz_mpoly_clear(current, context);
    fmpz_mpoly_ctx_clear(context);
    clear_values(polynomial_derivatives); clear_values(carrier_derivatives);
    arb_clear(term); arb_clear(inverse_power); arb_clear(inverse_q_squared);
    arb_clear(inverse_q); arb_clear(carrier); arb_clear(exponent); arb_clear(logarithm);
    return pass;
}

bool evaluate_mixed_envelopes(arb_ptr upper_bounds, const arb_t a_box,
    const arb_t b_box) {
    if (upper_bounds == nullptr || !finite(a_box) || !arb_is_positive(a_box)
        || !finite(b_box)) return false;
    arb_t a_lower, a_absolute_upper, b_upper, b_absolute_upper, contribution;
    arb_init(a_lower); arb_init(a_absolute_upper); arb_init(b_upper);
    arb_init(b_absolute_upper); arb_init(contribution);
    bool pass = exact_lower(a_lower, a_box) && arb_is_positive(a_lower)
        && exact_absolute_upper(a_absolute_upper, a_box)
        && exact_upper(b_upper, b_box)
        && exact_absolute_upper(b_absolute_upper, b_box);

    fmpz_mpoly_ctx_t context;
    fmpz_mpoly_ctx_init(context, 3, ORD_LEX);
    fmpz_mpoly_t current, next, a_generator, b_generator, q_generator, factor;
    fmpz_mpoly_t temporary, polynomial_q_derivative, parameter_derivative, scratch;
    fmpz_mpoly_init(current, context); fmpz_mpoly_init(next, context);
    fmpz_mpoly_init(a_generator, context); fmpz_mpoly_init(b_generator, context);
    fmpz_mpoly_init(q_generator, context); fmpz_mpoly_init(factor, context);
    fmpz_mpoly_init(temporary, context); fmpz_mpoly_init(polynomial_q_derivative, context);
    fmpz_mpoly_init(parameter_derivative, context); fmpz_mpoly_init(scratch, context);
    fmpz_mpoly_one(current, context);
    fmpz_mpoly_gen(a_generator, 0, context);
    fmpz_mpoly_gen(b_generator, 1, context);
    fmpz_mpoly_gen(q_generator, 2, context);

    for (unsigned j = 0; pass && j <= derivative_order; ++j) {
        for (std::size_t pair = 0; pass && pair < parameter_derivative_pairs; ++pair) {
            const unsigned u = kPairU[pair];
            const unsigned v = kPairV[pair];
            arb_zero(upper_bounds + mixed_index(u, v, j));
            for (unsigned r = 0; pass && r <= u; ++r) {
                for (unsigned s = 0; pass && s <= v; ++s) {
                    differentiate_parameter_polynomial(parameter_derivative, current,
                        u-r, v-s, scratch, context);
                    pass = polynomial_envelope(contribution, parameter_derivative,
                        context, a_lower, a_absolute_upper, b_upper,
                        b_absolute_upper, j, r, s);
                    if (!pass) break;
                    arb_mul_ui(contribution, contribution,
                        binomial(u, r) * binomial(v, s), precision_bits);
                    arb_add(upper_bounds + mixed_index(u, v, j),
                        upper_bounds + mixed_index(u, v, j), contribution,
                        precision_bits);
                }
            }
            if (pass) {
                pass = exact_upper(upper_bounds + mixed_index(u, v, j),
                    upper_bounds + mixed_index(u, v, j))
                    && finite(upper_bounds + mixed_index(u, v, j))
                    && arb_is_nonnegative(upper_bounds + mixed_index(u, v, j));
            }
        }
        if (!pass || j == derivative_order) break;

        fmpz_mpoly_mul(temporary, b_generator, q_generator, context);
        fmpz_mpoly_sub(factor, a_generator, temporary, context);
        if (j != 0U) {
            fmpz_mpoly_scalar_mul_ui(temporary, q_generator, 2UL * j, context);
            fmpz_mpoly_sub(factor, factor, temporary, context);
        }
        fmpz_mpoly_mul(next, factor, current, context);
        fmpz_mpoly_derivative(polynomial_q_derivative, current, 2, context);
        fmpz_mpoly_mul(temporary, polynomial_q_derivative, q_generator, context);
        fmpz_mpoly_mul(temporary, temporary, q_generator, context);
        fmpz_mpoly_add(next, next, temporary, context);
        fmpz_mpoly_swap(current, next, context);
    }

    fmpz_mpoly_clear(scratch, context); fmpz_mpoly_clear(parameter_derivative, context);
    fmpz_mpoly_clear(polynomial_q_derivative, context); fmpz_mpoly_clear(temporary, context);
    fmpz_mpoly_clear(factor, context); fmpz_mpoly_clear(q_generator, context);
    fmpz_mpoly_clear(b_generator, context); fmpz_mpoly_clear(a_generator, context);
    fmpz_mpoly_clear(next, context); fmpz_mpoly_clear(current, context);
    fmpz_mpoly_ctx_clear(context);
    arb_clear(contribution); arb_clear(b_absolute_upper); arb_clear(b_upper);
    arb_clear(a_absolute_upper); arb_clear(a_lower);
    return pass;
}

bool assemble_coefficient_norm_bounds(arb_ptr b_theta_12,
    arb_ptr weighted_norm, arb_srcptr mixed_envelopes) {
    if (b_theta_12 == nullptr || weighted_norm == nullptr
        || mixed_envelopes == nullptr) return false;
    for (std::size_t index = 0; index < mixed_derivative_inventory; ++index) {
        if (!finite(mixed_envelopes + index)
            || !arb_is_nonnegative(mixed_envelopes + index)) return false;
    }
    fmpz_t numerator, denominator;
    fmpz_init(numerator); fmpz_init(denominator);
    fmpq_t rational;
    fmpq_init(rational);
    arb_t coefficient, term;
    arb_init(coefficient); arb_init(term);
    bool pass = true;
    for (std::size_t pair = 0; pass && pair < parameter_derivative_pairs; ++pair) {
        arb_zero(b_theta_12 + pair);
        fmpz_one(denominator);
        for (unsigned j = 1U; j <= derivative_order; ++j) {
            fmpz_mul_ui(denominator, denominator, 510UL);
            fmpz_set_ui(numerator, stirling_second_kind_12(j));
            fmpq_set_fmpz_frac(rational, numerator, denominator);
            arb_set_fmpq(coefficient, rational, precision_bits);
            arb_mul(term, mixed_envelopes + mixed_index(kPairU[pair], kPairV[pair], j),
                coefficient, precision_bits);
            arb_add(b_theta_12 + pair, b_theta_12 + pair, term, precision_bits);
        }
        pass = exact_upper(b_theta_12 + pair, b_theta_12 + pair)
            && finite(b_theta_12 + pair) && arb_is_nonnegative(b_theta_12 + pair);
        if (!pass) break;
        arb_mul_ui(weighted_norm + pair, b_theta_12 + pair, 556UL, precision_bits);
        arb_add(weighted_norm + pair, weighted_norm + pair,
            mixed_envelopes + mixed_index(kPairU[pair], kPairV[pair], 0U),
            precision_bits);
        pass = exact_upper(weighted_norm + pair, weighted_norm + pair)
            && finite(weighted_norm + pair) && arb_is_nonnegative(weighted_norm + pair);
    }
    arb_clear(term); arb_clear(coefficient); fmpq_clear(rational);
    fmpz_clear(denominator); fmpz_clear(numerator);
    return pass;
}

bool evaluate_q_derivatives(arb_ptr derivatives, const arb_t a, const arb_t b,
    const arb_t q) {
    if (derivatives == nullptr) return false;
    std::array<arb_struct, mixed_derivative_inventory> mixed;
    init_values(mixed);
    const bool pass = evaluate_mixed_derivatives(mixed.data(), a, b, q);
    if (pass) {
        for (unsigned j = 0; j <= derivative_order; ++j) {
            arb_set(derivatives + j, &mixed[mixed_index(0U, 0U, j)]);
        }
    }
    clear_values(mixed);
    return pass;
}

std::size_t fixture_count() { return 9U; }
unsigned fixture_mask() {
    const auto checks = fixture_results();
    unsigned mask = 0U;
    for (std::size_t index = 0; index < checks.size(); ++index) {
        if (checks[index]) mask |= 1U << index;
    }
    return mask;
}
std::size_t fixtures_passed() {
    const auto checks = fixture_results();
    std::size_t passed = 0U;
    for (const bool value : checks) passed += value ? 1U : 0U;
    return passed;
}
bool run_flat_carrier_fixture_suite() { return fixtures_passed() == fixture_count(); }

} // namespace nhm2::g2h_e_s5::primary_flat_carrier_v1
