#include "mini_boson_star_primary_c08_origin_series_v1.hpp"

#include <arf.h>

#include <array>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_origin_series_v1 {
namespace {

constexpr slong kPrecisionBits = 512;
constexpr slong kWidthExponent = -180;
constexpr std::array<unsigned, kOrderCandidateCount> kOrders = {
    32U, 48U, 64U, 96U, 128U, 192U, 256U,
};
constexpr std::size_t value_index = 0U;
constexpr std::size_t first_h0_index = 1U;

class CoefficientStorage {
  public:
    CoefficientStorage()
        : values_((kMaximumOriginOrder + 1U) * kJetCount) {
        for (auto &value : values_) arb_init(&value);
    }
    ~CoefficientStorage() {
        for (auto &value : values_) arb_clear(&value);
    }
    CoefficientStorage(const CoefficientStorage &) = delete;
    CoefficientStorage &operator=(const CoefficientStorage &) = delete;

    arb_ptr at(std::size_t order, std::size_t jet = 0U) {
        return values_.data() + order * kJetCount + jet;
    }
    arb_srcptr at(std::size_t order, std::size_t jet = 0U) const {
        return values_.data() + order * kJetCount + jet;
    }

  private:
    std::vector<arb_struct> values_;
};

void reset(Output &output) {
    arb_zero(output.t0);
    arb_zero(output.geometric_ratio);
    for (std::size_t jet = 0; jet < kJetCount; ++jet) {
        for (std::size_t kind = 0; kind < kTailKindCount; ++kind) {
            arb_zero(output.partial_values[jet] + kind);
            arb_zero(output.tail_bounds[jet] + kind);
            arb_zero(output.enclosed_values[jet] + kind);
        }
    }
    output.selected_order = 0U;
}

void fail(Result *result, FailureDetail detail) {
    *result = Result{};
    result->detail = detail;
}

bool finite(arb_srcptr value) {
    return value != nullptr && arb_is_finite(value) != 0;
}

bool upper_magnitude(arb_t target, arb_srcptr value) {
    if (!finite(value)) return false;
    arb_t absolute;
    arf_t upper;
    arb_init(absolute); arf_init(upper);
    arb_abs(absolute, value);
    arb_get_ubound_arf(upper, absolute, kPrecisionBits);
    arb_set_arf(target, upper);
    arf_clear(upper); arb_clear(absolute);
    return arb_is_finite(target) && arb_is_nonnegative(target);
}

bool set_rate_geometry(Output &output,
                       const primary_c08_gevrey_v1::Output &gevrey) {
    if (gevrey.selected_exponent > primary_c08_gevrey_v1::kMaximumRateExponent)
        return false;
    arb_t expected_rate, quarter;
    arb_init(expected_rate); arb_init(quarter);
    arb_one(expected_rate);
    arb_mul_2exp_si(expected_rate, expected_rate,
                   static_cast<slong>(gevrey.selected_exponent));
    bool pass = arb_equal(expected_rate, gevrey.selected_rate) != 0;
    arb_one(output.t0);
    arb_mul_2exp_si(output.t0, output.t0,
                   -static_cast<slong>(gevrey.selected_exponent) - 2L);
    arb_mul(output.geometric_ratio, gevrey.selected_rate, output.t0,
            kPrecisionBits);
    arb_one(quarter); arb_mul_2exp_si(quarter, quarter, -2L);
    pass = pass && arb_is_positive(output.t0)
        && arb_is_positive(output.geometric_ratio)
        && arb_le(output.geometric_ratio, quarter);
    arb_clear(quarter); arb_clear(expected_rate);
    return pass;
}

bool initialize_origin(CoefficientStorage &coefficients, const Input &input,
                       Result &result) {
    if (!finite(input.gevrey.margins.h0)) return false;
    for (std::size_t jet = 0; jet < kJetCount; ++jet)
        arb_zero(coefficients.at(0U, jet));
    arb_set(coefficients.at(0U, value_index), input.gevrey.margins.h0);
    arb_one(coefficients.at(0U, first_h0_index));
    result.origin_compatibility_checks = kJetCount + 2U;
    return arb_equal(coefficients.at(0U, value_index),
                     input.gevrey.margins.h0)
        && arb_is_one(coefficients.at(0U, first_h0_index));
}

bool generate_next(CoefficientStorage &coefficients, unsigned n,
                   const primary_c08_gevrey_v1::Output &gevrey) {
    arb_t polynomial, term;
    arb_init(polynomial); arb_init(term);
    for (std::size_t row = 0; row < kJetCount; ++row)
        arb_zero(coefficients.at(n + 1U, row));
    bool pass = true;
    for (std::size_t lag = 0; pass && lag < primary_c08_gevrey_v1::kLagCount;
         ++lag) {
        if (lag > n) continue;
        const arb_struct *matrices[3] = {
            gevrey.a2[lag], gevrey.a1[lag], gevrey.a0[lag],
        };
        for (std::size_t row = 0; pass && row < kJetCount; ++row) {
            for (std::size_t column = 0; pass && column < kJetCount; ++column) {
                const std::size_t index = row * kJetCount + column;
                arb_mul_ui(polynomial, matrices[0] + index,
                           static_cast<unsigned long>(n) * n, kPrecisionBits);
                arb_mul_ui(term, matrices[1] + index, n, kPrecisionBits);
                arb_add(polynomial, polynomial, term, kPrecisionBits);
                arb_add(polynomial, polynomial, matrices[2] + index,
                        kPrecisionBits);
                arb_mul(term, polynomial, coefficients.at(n - lag, column),
                        kPrecisionBits);
                arb_add(coefficients.at(n + 1U, row),
                        coefficients.at(n + 1U, row), term, kPrecisionBits);
            }
        }
    }
    for (std::size_t row = 0; pass && row < kJetCount; ++row) {
        arb_div_ui(coefficients.at(n + 1U, row),
                   coefficients.at(n + 1U, row), n + 1U, kPrecisionBits);
        pass = finite(coefficients.at(n + 1U, row));
    }
    arb_clear(term); arb_clear(polynomial);
    return pass;
}

bool form_partial_values(Output &output, const CoefficientStorage &coefficients,
                         unsigned order) {
    for (std::size_t jet = 0; jet < kJetCount; ++jet)
        for (std::size_t kind = 0; kind < kTailKindCount; ++kind)
            arb_zero(output.partial_values[jet] + kind);

    arb_t b_weight, v_weight, b2_weight, j1_weight, j2_weight, term, t0_squared;
    arb_init(b_weight); arb_init(v_weight); arb_init(b2_weight);
    arb_init(j1_weight); arb_init(j2_weight); arb_init(term);
    arb_init(t0_squared);
    arb_one(b_weight);
    arb_mul(t0_squared, output.t0, output.t0, kPrecisionBits);
    bool pass = true;
    for (unsigned n = 0U; pass && n <= order; ++n) {
        arb_mul(j1_weight, b_weight, output.t0, kPrecisionBits);
        arb_div_ui(j1_weight, j1_weight, n + 1U, kPrecisionBits);
        arb_mul(j2_weight, b_weight, t0_squared, kPrecisionBits);
        arb_div_ui(j2_weight, j2_weight,
                   static_cast<unsigned long>(n + 1U) * (n + 2U),
                   kPrecisionBits);
        if (n >= 1U) {
            arb_mul_ui(v_weight, b_weight, n, kPrecisionBits);
            arb_div(v_weight, v_weight, output.t0, kPrecisionBits);
        } else arb_zero(v_weight);
        if (n >= 2U) {
            arb_mul_ui(b2_weight, b_weight,
                       static_cast<unsigned long>(n) * (n - 1U),
                       kPrecisionBits);
            arb_div(b2_weight, b2_weight, t0_squared, kPrecisionBits);
        } else arb_zero(b2_weight);

        const arb_struct *weights[kTailKindCount] = {
            b_weight, v_weight, b2_weight, j1_weight, j2_weight,
        };
        for (std::size_t jet = 0; pass && jet < kJetCount; ++jet) {
            for (std::size_t kind = 0; pass && kind < kTailKindCount; ++kind) {
                arb_mul(term, coefficients.at(n, jet), weights[kind],
                        kPrecisionBits);
                arb_add(output.partial_values[jet] + kind,
                        output.partial_values[jet] + kind, term, kPrecisionBits);
                pass = finite(output.partial_values[jet] + kind);
            }
        }
        arb_mul(b_weight, b_weight, output.t0, kPrecisionBits);
        arb_div_ui(b_weight, b_weight, n + 1U, kPrecisionBits);
    }
    arb_clear(t0_squared); arb_clear(term); arb_clear(j2_weight);
    arb_clear(j1_weight); arb_clear(b2_weight); arb_clear(v_weight);
    arb_clear(b_weight);
    return pass;
}

bool form_tail_bounds(Output &output,
                      const primary_c08_gevrey_v1::Output &gevrey,
                      unsigned order) {
    arb_t c_upper, a_upper, z_power_r_minus_one, z_power_r, z_power_next;
    arb_t one_minus_z, denominator, term;
    arb_struct base_tails[kTailKindCount];
    arb_init(c_upper); arb_init(a_upper); arb_init(z_power_r_minus_one);
    arb_init(z_power_r); arb_init(z_power_next); arb_init(one_minus_z);
    arb_init(denominator); arb_init(term);
    for (auto &tail : base_tails) arb_init(&tail);

    bool pass = upper_magnitude(c_upper, gevrey.base_constant)
        && upper_magnitude(a_upper, gevrey.selected_rate);
    arb_one(one_minus_z);
    arb_sub(one_minus_z, one_minus_z, output.geometric_ratio, kPrecisionBits);
    pass = pass && arb_is_positive(one_minus_z);
    if (pass) {
        arb_pow_ui(z_power_r_minus_one, output.geometric_ratio, order - 1U,
                   kPrecisionBits);
        arb_mul(z_power_r, z_power_r_minus_one, output.geometric_ratio,
                kPrecisionBits);
        arb_mul(z_power_next, z_power_r, output.geometric_ratio,
                kPrecisionBits);

        // B tail: C*z^(r+1)/(1-z).
        arb_mul(base_tails + 0, c_upper, z_power_next, kPrecisionBits);
        arb_div(base_tails + 0, base_tails + 0, one_minus_z, kPrecisionBits);

        // V tail: C*A*((r+1)z^r/(1-z)+z^(r+1)/(1-z)^2).
        arb_mul_ui(base_tails + 1, z_power_r, order + 1U, kPrecisionBits);
        arb_div(base_tails + 1, base_tails + 1, one_minus_z, kPrecisionBits);
        arb_mul(denominator, one_minus_z, one_minus_z, kPrecisionBits);
        arb_div(term, z_power_next, denominator, kPrecisionBits);
        arb_add(base_tails + 1, base_tails + 1, term, kPrecisionBits);
        arb_mul(base_tails + 1, base_tails + 1, a_upper, kPrecisionBits);
        arb_mul(base_tails + 1, base_tails + 1, c_upper, kPrecisionBits);

        // B'' tail: C*A^2*D^2[z^(r+1)/(1-z)].
        arb_mul_ui(base_tails + 2, z_power_r_minus_one,
                   static_cast<unsigned long>(order) * (order + 1U),
                   kPrecisionBits);
        arb_div(base_tails + 2, base_tails + 2, one_minus_z, kPrecisionBits);
        arb_mul_ui(term, z_power_r, 2UL * (order + 1U), kPrecisionBits);
        arb_div(term, term, denominator, kPrecisionBits);
        arb_add(base_tails + 2, base_tails + 2, term, kPrecisionBits);
        arb_mul(denominator, denominator, one_minus_z, kPrecisionBits);
        arb_mul_ui(term, z_power_next, 2UL, kPrecisionBits);
        arb_div(term, term, denominator, kPrecisionBits);
        arb_add(base_tails + 2, base_tails + 2, term, kPrecisionBits);
        arb_mul(term, a_upper, a_upper, kPrecisionBits);
        arb_mul(base_tails + 2, base_tails + 2, term, kPrecisionBits);
        arb_mul(base_tails + 2, base_tails + 2, c_upper, kPrecisionBits);

        // J1 and J2 tails.
        arb_mul(base_tails + 3, c_upper, output.t0, kPrecisionBits);
        arb_mul(base_tails + 3, base_tails + 3, z_power_next,
                kPrecisionBits);
        arb_mul_ui(denominator, one_minus_z, order + 2U, kPrecisionBits);
        arb_div(base_tails + 3, base_tails + 3, denominator, kPrecisionBits);
        arb_mul(base_tails + 4, c_upper, output.t0, kPrecisionBits);
        arb_mul(base_tails + 4, base_tails + 4, output.t0, kPrecisionBits);
        arb_mul(base_tails + 4, base_tails + 4, z_power_next,
                kPrecisionBits);
        arb_mul_ui(denominator, one_minus_z,
                   static_cast<unsigned long>(order + 2U) * (order + 3U),
                   kPrecisionBits);
        arb_div(base_tails + 4, base_tails + 4, denominator, kPrecisionBits);
    }

    for (std::size_t kind = 0; pass && kind < kTailKindCount; ++kind)
        pass = finite(base_tails + kind) && arb_is_nonnegative(base_tails + kind);
    for (std::size_t jet = 0; pass && jet < kJetCount; ++jet)
        for (std::size_t kind = 0; kind < kTailKindCount; ++kind)
            arb_set(output.tail_bounds[jet] + kind, base_tails + kind);

    for (auto &tail : base_tails) arb_clear(&tail);
    arb_clear(term); arb_clear(denominator); arb_clear(one_minus_z);
    arb_clear(z_power_next); arb_clear(z_power_r); arb_clear(z_power_r_minus_one);
    arb_clear(a_upper); arb_clear(c_upper);
    return pass;
}

bool width_rule_passes(Output &output, std::size_t *checked) {
    arb_t radius, magnitude, scale, tolerance;
    arb_init(radius); arb_init(magnitude); arb_init(scale); arb_init(tolerance);
    bool pass = true;
    *checked = 0U;
    for (std::size_t jet = 0; pass && jet < kJetCount; ++jet) {
        for (std::size_t kind = 0; pass && kind < kTailKindCount; ++kind) {
            arb_set(output.enclosed_values[jet] + kind,
                    output.partial_values[jet] + kind);
            arb_add_error(output.enclosed_values[jet] + kind,
                          output.tail_bounds[jet] + kind);
            arb_get_rad_arb(radius, output.enclosed_values[jet] + kind);
            pass = upper_magnitude(magnitude,
                                   output.enclosed_values[jet] + kind);
            arb_one(scale);
            if (pass && arb_gt(magnitude, scale)) arb_set(scale, magnitude);
            arb_mul_2exp_si(tolerance, scale, kWidthExponent);
            pass = pass && arb_le(radius, tolerance);
            ++(*checked);
        }
    }
    arb_clear(tolerance); arb_clear(scale); arb_clear(magnitude); arb_clear(radius);
    return pass;
}

}  // namespace

Output::Output() {
    arb_init(t0); arb_init(geometric_ratio);
    for (std::size_t jet = 0; jet < kJetCount; ++jet) {
        for (std::size_t kind = 0; kind < kTailKindCount; ++kind) {
            arb_init(partial_values[jet] + kind);
            arb_init(tail_bounds[jet] + kind);
            arb_init(enclosed_values[jet] + kind);
        }
    }
    reset(*this);
}

Output::~Output() {
    for (std::size_t jet = 0; jet < kJetCount; ++jet) {
        for (std::size_t kind = 0; kind < kTailKindCount; ++kind) {
            arb_clear(enclosed_values[jet] + kind);
            arb_clear(tail_bounds[jet] + kind);
            arb_clear(partial_values[jet] + kind);
        }
    }
    arb_clear(geometric_ratio); arb_clear(t0);
}

bool evaluate(const Input &input, Output *output, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    primary_c08_gevrey_v1::Output gevrey_output;
    primary_c08_gevrey_v1::Result gevrey_result{};
    if (!primary_c08_gevrey_v1::evaluate(input.gevrey, &gevrey_output,
                                         &gevrey_result)) {
        fail(result, FailureDetail::predecessor_not_passed);
        return false;
    }
    if (output == nullptr) {
        fail(result, FailureDetail::missing_output);
        return false;
    }
    reset(*output);
    if (!set_rate_geometry(*output, gevrey_output)) {
        fail(result, FailureDetail::rate_identity_invalid);
        return false;
    }

    CoefficientStorage coefficients;
    if (!initialize_origin(coefficients, input, *result)) {
        fail(result, FailureDetail::origin_compatibility_invalid);
        return false;
    }
    unsigned generated_through = 0U;
    std::size_t cumulative_tail_checks = 0U;
    for (const unsigned order : kOrders) {
        ++result->order_attempts;
        while (generated_through < order) {
            if (!generate_next(coefficients, generated_through, gevrey_output)) {
                const std::size_t attempts = result->order_attempts;
                const std::size_t generated = generated_through + 1U;
                fail(result, FailureDetail::coefficient_recurrence_nonfinite);
                result->order_attempts = attempts;
                result->recurrence_coefficients_generated = generated;
                return false;
            }
            ++generated_through;
        }
        if (!form_partial_values(*output, coefficients, order)
            || !form_tail_bounds(*output, gevrey_output, order)) {
            const std::size_t attempts = result->order_attempts;
            fail(result, FailureDetail::t0_or_geometric_ratio_invalid);
            result->order_attempts = attempts;
            result->recurrence_coefficients_generated = generated_through + 1U;
            return false;
        }
        std::size_t checked = 0U;
        const bool accepted = width_rule_passes(*output, &checked);
        cumulative_tail_checks += checked;
        if (accepted) {
            output->selected_order = order;
            result->accepted = true;
            result->selected_order = order;
            result->first_passing_order_used = true;
            result->directed_upper_bounds_used = true;
            result->midpoint_acceptance_used = false;
            result->recurrence_coefficients_generated = generated_through + 1U;
            result->tail_enclosures_checked = cumulative_tail_checks;
            result->origin_compatibility_checks = kJetCount + 2U;
            return true;
        }
    }
    const std::size_t attempts = result->order_attempts;
    const std::size_t origin_checks = result->origin_compatibility_checks;
    fail(result, FailureDetail::origin_series_order_exhaustion);
    result->order_attempts = attempts;
    result->recurrence_coefficients_generated = generated_through + 1U;
    result->tail_enclosures_checked = cumulative_tail_checks;
    result->origin_compatibility_checks = origin_checks;
    return false;
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::predecessor_not_passed: return "C08-006_PREDECESSOR_NOT_PASSED";
    case FailureDetail::missing_output: return "C08-006_MISSING_OUTPUT";
    case FailureDetail::rate_identity_invalid: return "C08-006_RATE_IDENTITY_INVALID";
    case FailureDetail::origin_compatibility_invalid:
        return "C08-006_ORIGIN_COMPATIBILITY_INVALID";
    case FailureDetail::coefficient_recurrence_nonfinite:
        return "C08-006_COEFFICIENT_RECURRENCE_NONFINITE";
    case FailureDetail::t0_or_geometric_ratio_invalid:
        return "C08-006_T0_OR_GEOMETRIC_RATIO_INVALID";
    case FailureDetail::origin_series_order_exhaustion:
        return "C08-006_ORIGIN_SERIES_ORDER_EXHAUSTION";
    }
    return "C08-006_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_origin_series_v1
