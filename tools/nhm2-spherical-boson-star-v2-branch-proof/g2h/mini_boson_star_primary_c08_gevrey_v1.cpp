#include "mini_boson_star_primary_c08_gevrey_v1.hpp"

#include <arf.h>

#include <array>

namespace nhm2::g2h_e_s5::primary_c08_gevrey_v1 {
namespace {

constexpr slong kPrecisionBits = 512;
constexpr std::size_t kParameterCount = 3U;
constexpr std::size_t value_index = 0U;
constexpr std::size_t first_index(std::size_t a) { return 1U + a; }
constexpr std::size_t second_index(std::size_t a, std::size_t b) {
    return 4U + kParameterCount * a + b;
}
constexpr std::size_t matrix_index(std::size_t row, std::size_t column) {
    return row * kJetCount + column;
}

struct Jet {
    arb_struct values[kJetCount];
    Jet() { for (auto &value : values) arb_init(&value); }
    ~Jet() { for (auto &value : values) arb_clear(&value); }
    Jet(const Jet &) = delete;
    Jet &operator=(const Jet &) = delete;
};

void jet_zero(Jet &value) {
    for (auto &component : value.values) arb_zero(&component);
}

void jet_set(Jet &target, const Jet &source) {
    for (std::size_t i = 0; i < kJetCount; ++i) {
        arb_set(target.values + i, source.values + i);
    }
}

void jet_set_scalar(Jet &target, arb_srcptr value) {
    jet_zero(target);
    arb_set(target.values + value_index, value);
}

void jet_set_ui(Jet &target, unsigned long value) {
    jet_zero(target);
    arb_set_ui(target.values + value_index, value);
}

void jet_add(Jet &target, const Jet &left, const Jet &right) {
    for (std::size_t i = 0; i < kJetCount; ++i) {
        arb_add(target.values + i, left.values + i, right.values + i,
                kPrecisionBits);
    }
}

void jet_sub(Jet &target, const Jet &left, const Jet &right) {
    for (std::size_t i = 0; i < kJetCount; ++i) {
        arb_sub(target.values + i, left.values + i, right.values + i,
                kPrecisionBits);
    }
}

void jet_neg(Jet &target, const Jet &source) {
    for (std::size_t i = 0; i < kJetCount; ++i) {
        arb_neg(target.values + i, source.values + i);
    }
}

void jet_scale_si(Jet &target, const Jet &source, long scale) {
    for (std::size_t i = 0; i < kJetCount; ++i) {
        arb_mul_si(target.values + i, source.values + i, scale, kPrecisionBits);
    }
}

void jet_mul(Jet &target, const Jet &left, const Jet &right) {
    // Build through a separate jet so formula assembly remains alias-safe.
    Jet product;
    arb_mul(product.values + value_index, left.values + value_index,
            right.values + value_index, kPrecisionBits);
    arb_t temporary;
    arb_init(temporary);
    for (std::size_t a = 0; a < kParameterCount; ++a) {
        arb_mul(product.values + first_index(a), left.values + first_index(a),
                right.values + value_index, kPrecisionBits);
        arb_mul(temporary, left.values + value_index,
                right.values + first_index(a), kPrecisionBits);
        arb_add(product.values + first_index(a), product.values + first_index(a),
                temporary, kPrecisionBits);
    }
    for (std::size_t a = 0; a < kParameterCount; ++a) {
        for (std::size_t b = 0; b < kParameterCount; ++b) {
            const std::size_t index = second_index(a, b);
            arb_mul(product.values + index, left.values + index,
                    right.values + value_index, kPrecisionBits);
            arb_mul(temporary, left.values + first_index(a),
                    right.values + first_index(b), kPrecisionBits);
            arb_add(product.values + index, product.values + index, temporary,
                    kPrecisionBits);
            arb_mul(temporary, left.values + first_index(b),
                    right.values + first_index(a), kPrecisionBits);
            arb_add(product.values + index, product.values + index, temporary,
                    kPrecisionBits);
            arb_mul(temporary, left.values + value_index,
                    right.values + index, kPrecisionBits);
            arb_add(product.values + index, product.values + index, temporary,
                    kPrecisionBits);
        }
    }
    arb_clear(temporary);
    jet_set(target, product);
}

bool jet_reciprocal(Jet &target, const Jet &source) {
    if (!arb_is_finite(source.values + value_index)
        || arb_contains_zero(source.values + value_index)) return false;
    arb_inv(target.values + value_index, source.values + value_index,
            kPrecisionBits);
    arb_t sum, temporary;
    arb_init(sum); arb_init(temporary);
    for (std::size_t a = 0; a < kParameterCount; ++a) {
        arb_mul(sum, source.values + first_index(a),
                target.values + value_index, kPrecisionBits);
        arb_neg(sum, sum);
        arb_div(target.values + first_index(a), sum,
                source.values + value_index, kPrecisionBits);
    }
    for (std::size_t a = 0; a < kParameterCount; ++a) {
        for (std::size_t b = 0; b < kParameterCount; ++b) {
            const std::size_t index = second_index(a, b);
            arb_mul(sum, source.values + index, target.values + value_index,
                    kPrecisionBits);
            arb_mul(temporary, source.values + first_index(a),
                    target.values + first_index(b), kPrecisionBits);
            arb_add(sum, sum, temporary, kPrecisionBits);
            arb_mul(temporary, source.values + first_index(b),
                    target.values + first_index(a), kPrecisionBits);
            arb_add(sum, sum, temporary, kPrecisionBits);
            arb_neg(sum, sum);
            arb_div(target.values + index, sum,
                    source.values + value_index, kPrecisionBits);
        }
    }
    arb_clear(temporary); arb_clear(sum);
    return true;
}

bool jet_div(Jet &target, const Jet &numerator, const Jet &denominator) {
    Jet reciprocal;
    return jet_reciprocal(reciprocal, denominator)
        && (jet_mul(target, numerator, reciprocal), true);
}

bool finite_jet(const Jet &value) {
    for (const auto &component : value.values) {
        if (!arb_is_finite(&component)) return false;
    }
    return true;
}

void set_parameter_jets(const Input &input,
                        const primary_c08_margins_v1::Output &margins,
                        Jet &h0, Jet &kappa, Jet &mu) {
    jet_set_scalar(h0, input.margins.h0);
    arb_one(h0.values + first_index(0U));
    jet_set_scalar(kappa, input.margins.kappa);
    arb_one(kappa.values + first_index(1U));
    jet_set_scalar(mu, margins.mu);
    if (input.margins.identity->chart
        == primary_c08_identity_v1::Chart::positive) {
        arb_one(mu.values + first_index(2U));
    } else {
        arb_set(mu.values + first_index(2U), input.margins.eta);
    }
}

bool build_scalar_polynomials(const Jet &kappa, const Jet &mu,
                              Jet (&polynomial)[kLagCount][3]) {
    Jet one, k2, k4, mu2, term, term2, numerator, denominator;
    jet_set_ui(one, 1UL);
    jet_mul(k2, kappa, kappa);
    jet_mul(k4, k2, k2);
    jet_mul(mu2, mu, mu);

    // c0: n^2 + (1-4*mu*kappa-2*mu/kappa)*n + c0_const.
    jet_set(polynomial[0][0], one);
    jet_mul(term, mu, kappa); jet_scale_si(term, term, 4L);
    if (!jet_div(term2, mu, kappa)) return false;
    jet_scale_si(term2, term2, 2L);
    jet_sub(numerator, one, term); jet_sub(polynomial[0][1], numerator, term2);
    jet_mul(term, mu, k4); jet_scale_si(term, term, 8L);
    jet_mul(term2, mu, k2); jet_scale_si(term2, term2, 4L);
    jet_sub(numerator, term, term2);
    jet_sub(numerator, numerator, mu);
    jet_add(numerator, numerator, kappa);
    jet_mul(numerator, numerator, mu); jet_neg(numerator, numerator);
    if (!jet_div(polynomial[0][2], numerator, k2)) return false;

    // c1.
    jet_scale_si(polynomial[1][0], mu, -4L);
    jet_mul(term, mu, k2); jet_scale_si(term, term, 4L);
    jet_scale_si(term2, mu, 4L); jet_sub(numerator, term, term2);
    jet_sub(numerator, numerator, kappa);
    jet_mul(numerator, numerator, mu); jet_scale_si(numerator, numerator, -2L);
    if (!jet_div(polynomial[1][1], numerator, kappa)) return false;
    jet_mul(term, mu, k2); jet_scale_si(term, term, 4L);
    jet_scale_si(term2, mu, 2L); jet_sub(numerator, term, term2);
    jet_sub(numerator, numerator, kappa);
    jet_mul(numerator, numerator, mu2); jet_scale_si(numerator, numerator, 2L);
    if (!jet_div(polynomial[1][2], numerator, k2)) return false;

    // c2.
    jet_scale_si(polynomial[2][0], mu2, 4L);
    jet_mul(term, mu, k2); jet_scale_si(term, term, 2L);
    jet_sub(numerator, term, mu); jet_sub(numerator, numerator, kappa);
    jet_mul(term2, numerator, mu2); jet_scale_si(term2, term2, 8L);
    if (!jet_div(polynomial[2][1], term2, kappa)) return false;
    jet_mul(term, numerator, numerator); jet_mul(term, term, mu2);
    jet_scale_si(term, term, 4L);
    if (!jet_div(polynomial[2][2], term, k2)) return false;

    for (const auto &lag : polynomial) {
        for (const auto &coefficient : lag) {
            if (!finite_jet(coefficient)) return false;
        }
    }
    return true;
}

void fill_multiplication_matrix(arb_struct *matrix, const Jet &factor) {
    for (std::size_t i = 0; i < kMatrixEntries; ++i) arb_zero(matrix + i);
    arb_set(matrix + matrix_index(value_index, value_index),
            factor.values + value_index);
    for (std::size_t a = 0; a < kParameterCount; ++a) {
        arb_set(matrix + matrix_index(first_index(a), value_index),
                factor.values + first_index(a));
        arb_set(matrix + matrix_index(first_index(a), first_index(a)),
                factor.values + value_index);
    }
    for (std::size_t a = 0; a < kParameterCount; ++a) {
        for (std::size_t b = 0; b < kParameterCount; ++b) {
            const std::size_t row = second_index(a, b);
            arb_set(matrix + matrix_index(row, value_index),
                    factor.values + row);
            arb_add(matrix + matrix_index(row, first_index(b)),
                    matrix + matrix_index(row, first_index(b)),
                    factor.values + first_index(a), kPrecisionBits);
            arb_add(matrix + matrix_index(row, first_index(a)),
                    matrix + matrix_index(row, first_index(a)),
                    factor.values + first_index(b), kPrecisionBits);
            arb_add(matrix + matrix_index(row, row),
                    matrix + matrix_index(row, row),
                    factor.values + value_index, kPrecisionBits);
        }
    }
}

bool upper_magnitude(arb_t target, arb_srcptr value) {
    if (!arb_is_finite(value)) return false;
    arb_t absolute;
    arf_t upper;
    arb_init(absolute); arf_init(upper);
    arb_abs(absolute, value);
    arb_get_ubound_arf(upper, absolute, kPrecisionBits);
    arb_set_arf(target, upper);
    arf_clear(upper); arb_clear(absolute);
    return arb_is_finite(target) && arb_is_nonnegative(target);
}

bool build_matrices_and_majorants(Output &output, const Jet &kappa,
                                  Jet (&polynomial)[kLagCount][3]) {
    Jet two_kappa, reciprocal, negative_reciprocal, factor;
    jet_scale_si(two_kappa, kappa, 2L);
    if (!jet_reciprocal(reciprocal, two_kappa)) return false;
    jet_neg(negative_reciprocal, reciprocal);
    for (std::size_t lag = 0; lag < kLagCount; ++lag) {
        jet_mul(factor, negative_reciprocal, polynomial[lag][0]);
        fill_multiplication_matrix(output.a2[lag], factor);
        jet_mul(factor, negative_reciprocal, polynomial[lag][1]);
        fill_multiplication_matrix(output.a1[lag], factor);
        jet_mul(factor, negative_reciprocal, polynomial[lag][2]);
        fill_multiplication_matrix(output.a0[lag], factor);
    }

    arb_t row_sum, magnitude;
    arb_init(row_sum); arb_init(magnitude);
    bool pass = true;
    for (std::size_t lag = 0; pass && lag < kLagCount; ++lag) {
        arb_zero(output.gevrey_majorants + lag);
        for (std::size_t row = 0; pass && row < kJetCount; ++row) {
            arb_zero(row_sum);
            for (std::size_t column = 0; pass && column < kJetCount; ++column) {
                const std::size_t index = matrix_index(row, column);
                const std::array<arb_srcptr, 3> coefficients = {
                    output.a2[lag] + index, output.a1[lag] + index,
                    output.a0[lag] + index,
                };
                for (const auto coefficient : coefficients) {
                    pass = pass && upper_magnitude(magnitude, coefficient);
                    if (pass) arb_add(row_sum, row_sum, magnitude, kPrecisionBits);
                }
            }
            if (pass && arb_gt(row_sum, output.gevrey_majorants + lag)) {
                arb_set(output.gevrey_majorants + lag, row_sum);
            }
        }
        pass = pass && arb_is_finite(output.gevrey_majorants + lag)
            && arb_is_nonnegative(output.gevrey_majorants + lag);
    }
    arb_clear(magnitude); arb_clear(row_sum);
    return pass;
}

bool select_rate(Output &output, Result &result) {
    arb_t inverse_a, power, sum, term, half;
    arb_init(inverse_a); arb_init(power); arb_init(sum); arb_init(term);
    arb_init(half); arb_one(half); arb_mul_2exp_si(half, half, -1);
    bool selected = false;
    for (unsigned exponent = 0U; exponent <= kMaximumRateExponent; ++exponent) {
        ++result.rate_attempts;
        arb_one(output.selected_rate);
        arb_mul_2exp_si(output.selected_rate, output.selected_rate,
                       static_cast<slong>(exponent));
        arb_inv(inverse_a, output.selected_rate, kPrecisionBits);
        arb_one(power); arb_zero(sum);
        for (std::size_t lag = 0; lag < kLagCount; ++lag) {
            arb_mul(power, power, inverse_a, kPrecisionBits);
            arb_mul(term, output.gevrey_majorants + lag, power, kPrecisionBits);
            arb_add(sum, sum, term, kPrecisionBits);
        }
        if (arb_le(sum, half)) {
            output.selected_exponent = exponent;
            result.selected_exponent = exponent;
            selected = true;
            break;
        }
    }
    arb_clear(half); arb_clear(term); arb_clear(sum); arb_clear(power);
    arb_clear(inverse_a);
    return selected;
}

bool apply_lag(arb_struct *target, const arb_struct *a2,
               const arb_struct *a1, const arb_struct *a0,
               unsigned n, const Jet &source) {
    arb_t coefficient, term;
    arb_init(coefficient); arb_init(term);
    for (std::size_t row = 0; row < kJetCount; ++row) {
        arb_zero(target + row);
        for (std::size_t column = 0; column < kJetCount; ++column) {
            const std::size_t index = matrix_index(row, column);
            arb_mul_ui(coefficient, a2 + index,
                       static_cast<unsigned long>(n) * n, kPrecisionBits);
            arb_mul_ui(term, a1 + index, n, kPrecisionBits);
            arb_add(coefficient, coefficient, term, kPrecisionBits);
            arb_add(coefficient, coefficient, a0 + index, kPrecisionBits);
            arb_mul(term, coefficient, source.values + column, kPrecisionBits);
            arb_add(target + row, target + row, term, kPrecisionBits);
        }
        arb_div_ui(target + row, target + row, n + 1U, kPrecisionBits);
    }
    arb_clear(term); arb_clear(coefficient);
    return true;
}

bool compute_base(Output &output, const Jet &h0) {
    Jet states[3];
    jet_set(states[0], h0);
    arb_struct lag_value[kJetCount];
    for (auto &value : lag_value) arb_init(&value);
    for (unsigned n = 0U; n < 2U; ++n) {
        jet_zero(states[n + 1U]);
        for (std::size_t lag = 0; lag < kLagCount; ++lag) {
            if (static_cast<int>(n) - static_cast<int>(lag) < 0) continue;
            const Jet &previous = states[n - lag];
            apply_lag(lag_value, output.a2[lag], output.a1[lag],
                      output.a0[lag], n, previous);
            for (std::size_t component = 0; component < kJetCount; ++component) {
                arb_add(states[n + 1U].values + component,
                        states[n + 1U].values + component,
                        lag_value + component, kPrecisionBits);
            }
        }
    }

    bool pass = true;
    arb_t magnitude, scaled, maximum, denominator;
    arb_init(magnitude); arb_init(scaled); arb_init(maximum);
    arb_init(denominator); arb_zero(maximum);
    for (std::size_t base = 0; pass && base < 3U; ++base) {
        arb_zero(output.base_norms + base);
        for (std::size_t component = 0; pass && component < kJetCount;
             ++component) {
            pass = upper_magnitude(magnitude, states[base].values + component);
            if (pass && arb_gt(magnitude, output.base_norms + base)) {
                arb_set(output.base_norms + base, magnitude);
            }
        }
        arb_one(denominator);
        if (base > 0U) arb_pow_ui(denominator, output.selected_rate, base,
                                 kPrecisionBits);
        if (base == 2U) arb_mul_2exp_si(denominator, denominator, 1);
        arb_div(scaled, output.base_norms + base, denominator, kPrecisionBits);
        if (arb_gt(scaled, maximum)) arb_set(maximum, scaled);
    }
    if (pass) {
        arb_mul_2exp_si(output.base_constant, maximum, 1);
        pass = arb_is_finite(output.base_constant)
            && arb_is_positive(output.base_constant);
    }
    arb_clear(denominator); arb_clear(maximum); arb_clear(scaled);
    arb_clear(magnitude);
    for (auto &value : lag_value) arb_clear(&value);
    return pass;
}

void reset(Output &output) {
    for (std::size_t lag = 0; lag < kLagCount; ++lag) {
        for (std::size_t i = 0; i < kMatrixEntries; ++i) {
            arb_zero(output.a2[lag] + i); arb_zero(output.a1[lag] + i);
            arb_zero(output.a0[lag] + i);
        }
        arb_zero(output.gevrey_majorants + lag);
    }
    for (auto &norm : output.base_norms) arb_zero(&norm);
    arb_zero(output.selected_rate); arb_zero(output.base_constant);
    output.selected_exponent = 0U;
}

void fail(Result *result, FailureDetail detail) {
    *result = Result{};
    result->detail = detail;
}

}  // namespace

Output::Output() {
    for (std::size_t lag = 0; lag < kLagCount; ++lag) {
        for (std::size_t i = 0; i < kMatrixEntries; ++i) {
            arb_init(a2[lag] + i); arb_init(a1[lag] + i); arb_init(a0[lag] + i);
        }
        arb_init(gevrey_majorants + lag);
    }
    for (auto &norm : base_norms) arb_init(&norm);
    arb_init(selected_rate); arb_init(base_constant);
    reset(*this);
}

Output::~Output() {
    arb_clear(base_constant); arb_clear(selected_rate);
    for (auto &norm : base_norms) arb_clear(&norm);
    for (std::size_t lag = 0; lag < kLagCount; ++lag) {
        arb_clear(gevrey_majorants + lag);
        for (std::size_t i = 0; i < kMatrixEntries; ++i) {
            arb_clear(a0[lag] + i); arb_clear(a1[lag] + i); arb_clear(a2[lag] + i);
        }
    }
}

bool evaluate(const Input &input, Output *output, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    primary_c08_margins_v1::Output margin_output;
    primary_c08_margins_v1::Result margin_result{};
    if (!primary_c08_margins_v1::evaluate(input.margins, &margin_output,
                                          &margin_result)) {
        fail(result, FailureDetail::predecessor_not_passed);
        return false;
    }
    if (output == nullptr) {
        fail(result, FailureDetail::missing_output);
        return false;
    }
    reset(*output);

    Jet h0, kappa, mu;
    set_parameter_jets(input, margin_output, h0, kappa, mu);
    Jet polynomial[kLagCount][3];
    if (!build_scalar_polynomials(kappa, mu, polynomial)
        || !build_matrices_and_majorants(*output, kappa, polynomial)) {
        fail(result, FailureDetail::lifted_coefficient_or_denominator_nonfinite);
        return false;
    }
    for (const auto &majorant : output->gevrey_majorants) {
        if (!arb_is_finite(&majorant) || !arb_is_nonnegative(&majorant)) {
            fail(result, FailureDetail::gevrey_majorant_nonfinite_or_negative);
            return false;
        }
    }
    if (!select_rate(*output, *result)) {
        const std::size_t attempts = result->rate_attempts;
        fail(result, FailureDetail::rate_exhaustion);
        result->rate_attempts = attempts;
        return false;
    }
    if (!finite_jet(h0)) {
        fail(result, FailureDetail::base_jet_nonfinite);
        return false;
    }
    if (!compute_base(*output, h0)) {
        fail(result, FailureDetail::base_constant_invalid);
        return false;
    }

    result->accepted = true;
    result->directed_coefficient_balls = kLagCount * 3U * kMatrixEntries;
    result->majorant_rows_checked = kLagCount * kJetCount;
    result->base_jet_components_checked = 3U * kJetCount;
    result->selected_exponent = output->selected_exponent;
    result->directed_upper_bounds_used = true;
    result->midpoint_acceptance_used = false;
    return true;
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::predecessor_not_passed: return "C08-005_PREDECESSOR_NOT_PASSED";
    case FailureDetail::missing_output: return "C08-005_MISSING_OUTPUT";
    case FailureDetail::lifted_coefficient_or_denominator_nonfinite:
        return "C08-005_LIFTED_COEFFICIENT_OR_DENOMINATOR_NONFINITE";
    case FailureDetail::gevrey_majorant_nonfinite_or_negative:
        return "C08-005_GEVREY_MAJORANT_NONFINITE_OR_NEGATIVE";
    case FailureDetail::rate_exhaustion: return "C08-005_GEVREY_MAJORANT_OR_RATE_EXHAUSTION";
    case FailureDetail::base_jet_nonfinite: return "C08-005_BASE_JET_NONFINITE";
    case FailureDetail::base_constant_invalid: return "C08-005_BASE_CONSTANT_INVALID";
    }
    return "C08-005_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_gevrey_v1
