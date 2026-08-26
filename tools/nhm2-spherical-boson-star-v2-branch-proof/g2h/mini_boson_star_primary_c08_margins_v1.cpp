#include "mini_boson_star_primary_c08_margins_v1.hpp"

#include <arf.h>

#include <array>

namespace nhm2::g2h_e_s5::primary_c08_margins_v1 {
namespace {

constexpr slong kPrecisionBits = 512;
constexpr std::size_t kCarrierCount = 3U;

template <std::size_t Count>
void initialize(arb_struct (&values)[Count]) {
    for (auto &value : values) arb_init(&value);
}

template <std::size_t Count>
void clear(arb_struct (&values)[Count]) {
    for (auto &value : values) arb_clear(&value);
}

template <std::size_t Count>
void zero(arb_struct (&values)[Count]) {
    for (auto &value : values) arb_zero(&value);
}

void reset(Output *output) {
    arb_zero(output->mu);
    arb_zero(output->mu_upper);
    arb_zero(output->beta);
    arb_zero(output->two_kappa);
    arb_zero(output->g);
    arb_zero(output->sigma0);
    arb_zero(output->sigma1);
    arb_zero(output->sigma2);
    arb_zero(output->tau0);
    arb_zero(output->tau1);
    arb_zero(output->tau2);
    arb_zero(output->delta);
    arb_zero(output->formal_metric_margin);
    zero(output->internal_gaps);
    zero(output->carrier_a);
    zero(output->carrier_b);
}

bool finite(arb_srcptr value) {
    return value != nullptr && arb_is_finite(value) != 0;
}

void fail(Result *result, FailureDetail detail) {
    *result = Result{};
    result->detail = detail;
}

bool every_positive(const Output &output) {
    if (!arb_is_positive(output.two_kappa)
        || !arb_is_positive(output.g)
        || !arb_is_positive(output.delta)
        || !arb_is_positive(output.formal_metric_margin)) {
        return false;
    }
    for (const auto &gap : output.internal_gaps) {
        if (!arb_is_positive(&gap)) return false;
    }
    for (const auto &a : output.carrier_a) {
        if (!arb_is_positive(&a)) return false;
    }
    return true;
}

bool every_finite(const Output &output) {
    const std::array<arb_srcptr, 13> scalars = {
        output.mu, output.mu_upper, output.beta, output.two_kappa, output.g,
        output.sigma0, output.sigma1, output.sigma2, output.tau0,
        output.tau1, output.tau2, output.delta, output.formal_metric_margin,
    };
    for (const auto value : scalars) if (!arb_is_finite(value)) return false;
    for (const auto &gap : output.internal_gaps) if (!arb_is_finite(&gap)) return false;
    for (const auto &a : output.carrier_a) if (!arb_is_finite(&a)) return false;
    for (const auto &b : output.carrier_b) if (!arb_is_finite(&b)) return false;
    return true;
}

void add_scaled_gap(arb_t target, const arb_t two_mu_upper,
                    const arb_t gap_over_eight, unsigned long scale) {
    arb_mul_ui(target, gap_over_eight, scale, kPrecisionBits);
    arb_add(target, target, two_mu_upper, kPrecisionBits);
}

}  // namespace

Output::Output() {
    arb_init(mu); arb_init(mu_upper); arb_init(beta); arb_init(two_kappa);
    arb_init(g); arb_init(sigma0); arb_init(sigma1); arb_init(sigma2);
    arb_init(tau0); arb_init(tau1); arb_init(tau2); arb_init(delta);
    arb_init(formal_metric_margin);
    initialize(internal_gaps); initialize(carrier_a); initialize(carrier_b);
    reset(this);
}

Output::~Output() {
    clear(carrier_b); clear(carrier_a); clear(internal_gaps);
    arb_clear(formal_metric_margin); arb_clear(delta); arb_clear(tau2);
    arb_clear(tau1); arb_clear(tau0); arb_clear(sigma2); arb_clear(sigma1);
    arb_clear(sigma0); arb_clear(g); arb_clear(two_kappa); arb_clear(beta);
    arb_clear(mu_upper); arb_clear(mu);
}

bool evaluate(const Input &input, Output *output, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (!input.predecessor_c08_003_passed) {
        fail(result, FailureDetail::predecessor_not_passed);
        return false;
    }
    if (output == nullptr || input.identity == nullptr) {
        fail(result, FailureDetail::missing_input_or_output);
        return false;
    }
    reset(output);
    using primary_c08_identity_v1::Chart;
    if (input.identity->chart != Chart::positive
        && input.identity->chart != Chart::vacuum) {
        fail(result, FailureDetail::invalid_chart);
        return false;
    }
    if (!finite(input.h0) || !arb_is_positive(input.h0)) {
        fail(result, FailureDetail::h0_nonfinite_or_nonpositive);
        return false;
    }
    if (!finite(input.kappa) || !arb_is_positive(input.kappa)) {
        fail(result, FailureDetail::kappa_nonfinite_or_nonpositive);
        return false;
    }
    if (!finite(input.theta2)) {
        fail(result, FailureDetail::theta2_nonfinite);
        return false;
    }

    arb_t beta_plus_one, kappa_squared, one_minus, two_mu_upper;
    arb_t gap_over_eight, direct_delta, temporary;
    arb_init(beta_plus_one); arb_init(kappa_squared); arb_init(one_minus);
    arb_init(two_mu_upper); arb_init(gap_over_eight); arb_init(direct_delta);
    arb_init(temporary);

    arb_mul(kappa_squared, input.kappa, input.kappa, kPrecisionBits);
    if (input.identity->chart == Chart::positive) {
        arb_set(output->mu, input.theta2);
        arb_mul_2exp_si(one_minus, kappa_squared, 1);
        arb_neg(one_minus, one_minus);
        arb_add_ui(one_minus, one_minus, 1UL, kPrecisionBits);
        arb_mul(beta_plus_one, input.theta2, one_minus, kPrecisionBits);
    } else {
        if (!finite(input.eta) || !arb_is_nonnegative(input.eta)) {
            arb_clear(temporary); arb_clear(direct_delta); arb_clear(gap_over_eight);
            arb_clear(two_mu_upper); arb_clear(one_minus); arb_clear(kappa_squared);
            arb_clear(beta_plus_one);
            fail(result, FailureDetail::eta_missing_nonfinite_or_negative);
            return false;
        }
        arb_mul(output->mu, input.eta, input.theta2, kPrecisionBits);
        arb_mul(one_minus, input.eta, kappa_squared, kPrecisionBits);
        arb_mul_2exp_si(one_minus, one_minus, 1);
        arb_neg(one_minus, one_minus);
        arb_add_ui(one_minus, one_minus, 1UL, kPrecisionBits);
        arb_mul(beta_plus_one, input.theta2, one_minus, kPrecisionBits);
    }
    if (!arb_is_finite(output->mu) || !arb_is_nonnegative(output->mu)) {
        arb_clear(temporary); arb_clear(direct_delta); arb_clear(gap_over_eight);
        arb_clear(two_mu_upper); arb_clear(one_minus); arb_clear(kappa_squared);
        arb_clear(beta_plus_one);
        fail(result, FailureDetail::mu_nonfinite_or_negative);
        return false;
    }

    arf_t upper;
    arf_init(upper);
    arb_get_ubound_arf(upper, output->mu, kPrecisionBits);
    arb_set_arf(output->mu_upper, upper);
    arf_clear(upper);
    if (!arb_is_finite(output->mu_upper)) {
        arb_clear(temporary); arb_clear(direct_delta); arb_clear(gap_over_eight);
        arb_clear(two_mu_upper); arb_clear(one_minus); arb_clear(kappa_squared);
        arb_clear(beta_plus_one);
        fail(result, FailureDetail::mu_upper_nonfinite);
        return false;
    }

    arb_mul_2exp_si(two_mu_upper, output->mu_upper, 1);
    arb_set_ui(output->g, 255UL);
    arb_sub(output->g, output->g, two_mu_upper, kPrecisionBits);
    if (!arb_is_positive(output->g)) {
        arb_clear(temporary); arb_clear(direct_delta); arb_clear(gap_over_eight);
        arb_clear(two_mu_upper); arb_clear(one_minus); arb_clear(kappa_squared);
        arb_clear(beta_plus_one);
        fail(result, FailureDetail::formal_metric_or_laplace_gap_nonpositive);
        return false;
    }

    arb_div(beta_plus_one, beta_plus_one, input.kappa, kPrecisionBits);
    arb_sub_ui(output->beta, beta_plus_one, 1UL, kPrecisionBits);
    if (!arb_is_finite(output->beta)) {
        arb_clear(temporary); arb_clear(direct_delta); arb_clear(gap_over_eight);
        arb_clear(two_mu_upper); arb_clear(one_minus); arb_clear(kappa_squared);
        arb_clear(beta_plus_one);
        fail(result, FailureDetail::beta_nonfinite);
        return false;
    }

    arb_mul_2exp_si(output->two_kappa, input.kappa, 1);
    arb_mul_2exp_si(gap_over_eight, output->g, -3);
    add_scaled_gap(output->sigma0, two_mu_upper, gap_over_eight, 1UL);
    add_scaled_gap(output->sigma1, two_mu_upper, gap_over_eight, 3UL);
    add_scaled_gap(output->sigma2, two_mu_upper, gap_over_eight, 5UL);
    add_scaled_gap(output->tau0, two_mu_upper, gap_over_eight, 2UL);
    add_scaled_gap(output->tau1, two_mu_upper, gap_over_eight, 4UL);
    add_scaled_gap(output->tau2, two_mu_upper, gap_over_eight, 6UL);
    arb_set_ui(direct_delta, 255UL);
    arb_sub(direct_delta, direct_delta, output->tau2, kPrecisionBits);
    arb_mul_2exp_si(output->delta, output->g, -2);
    arb_div_ui(output->formal_metric_margin, output->g, 255UL, kPrecisionBits);

    arb_sub(output->internal_gaps + 0, output->tau0, output->sigma0, kPrecisionBits);
    arb_sub(output->internal_gaps + 1, output->sigma1, output->tau0, kPrecisionBits);
    arb_sub(output->internal_gaps + 2, output->tau1, output->sigma1, kPrecisionBits);
    arb_sub(output->internal_gaps + 3, output->sigma2, output->tau1, kPrecisionBits);
    arb_sub(output->internal_gaps + 4, output->tau2, output->sigma2, kPrecisionBits);

    constexpr std::array<unsigned long, kCarrierCount> scales = {1UL, 2UL, 2UL};
    constexpr std::array<unsigned long, kCarrierCount> offsets = {0UL, 2UL, 1UL};
    for (std::size_t index = 0; index < kCarrierCount; ++index) {
        arb_mul_ui(output->carrier_a + index, input.kappa, scales[index], kPrecisionBits);
        arb_mul_ui(output->carrier_b + index, output->beta, scales[index], kPrecisionBits);
        arb_add_ui(output->carrier_b + index, output->carrier_b + index,
                   offsets[index], kPrecisionBits);
    }

    const bool pass = arb_equal(direct_delta, output->delta)
        && every_finite(*output) && every_positive(*output)
        && arb_is_nonnegative(output->mu)
        && arb_is_nonnegative(output->mu_upper);
    arb_clear(temporary); arb_clear(direct_delta); arb_clear(gap_over_eight);
    arb_clear(two_mu_upper); arb_clear(one_minus); arb_clear(kappa_squared);
    arb_clear(beta_plus_one);
    if (!pass) {
        fail(result, FailureDetail::derived_tier_or_denominator_nonpositive);
        return false;
    }

    result->accepted = true;
    result->directed_parameter_boxes = 3U;
    result->strict_denominator_margins = 4U;
    result->strict_growth_margins = 8U;
    result->mu_upper_used = true;
    result->midpoint_acceptance_used = false;
    return true;
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::predecessor_not_passed: return "C08-004_PREDECESSOR_NOT_PASSED";
    case FailureDetail::missing_input_or_output: return "C08-004_MISSING_INPUT_OR_OUTPUT";
    case FailureDetail::invalid_chart: return "C08-004_INVALID_CHART";
    case FailureDetail::h0_nonfinite_or_nonpositive: return "C08-004_H0_NONFINITE_OR_NONPOSITIVE";
    case FailureDetail::kappa_nonfinite_or_nonpositive: return "C08-004_KAPPA_NONFINITE_OR_NONPOSITIVE";
    case FailureDetail::theta2_nonfinite: return "C08-004_THETA2_NONFINITE";
    case FailureDetail::eta_missing_nonfinite_or_negative: return "C08-004_ETA_MISSING_NONFINITE_OR_NEGATIVE";
    case FailureDetail::mu_nonfinite_or_negative: return "C08-004_MU_NONFINITE_OR_NEGATIVE";
    case FailureDetail::mu_upper_nonfinite: return "C08-004_MU_UPPER_NONFINITE";
    case FailureDetail::formal_metric_or_laplace_gap_nonpositive: return "C08-004_FORMAL_METRIC_OR_LAPLACE_GAP_NONPOSITIVE";
    case FailureDetail::beta_nonfinite: return "C08-004_BETA_NONFINITE";
    case FailureDetail::derived_tier_or_denominator_nonpositive: return "C08-004_DERIVED_TIER_OR_DENOMINATOR_NONPOSITIVE";
    }
    return "C08-004_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_margins_v1
