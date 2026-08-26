#include "mini_boson_star_primary_c08_analytic_parameter_jets_v1.hpp"

#include <array>

namespace nhm2::g2h_e_s5::primary_c08_analytic_parameter_jets_v1 {
namespace {

using Jet = std::array<arb_struct, kJetCount>;

bool finite(arb_srcptr value) {
    return value != nullptr && arb_is_finite(value);
}

void zero(Jet &values) {
    for (auto &value : values) arb_zero(&value);
}

bool all_finite(const Jet &values) {
    for (const auto &value : values)
        if (!arb_is_finite(&value)) return false;
    return true;
}

void multiply(const Jet &left, const Jet &right, Jet &product) {
    arb_t first, second, third;
    arb_init(first); arb_init(second); arb_init(third);
    arb_mul(&product[value_jet()], &left[value_jet()],
            &right[value_jet()], kPrecisionBits);
    for (std::size_t a = 0U; a < kParameterCount; ++a) {
        arb_mul(first, &left[first_jet(a)],
                &right[value_jet()], kPrecisionBits);
        arb_mul(second, &left[value_jet()],
                &right[first_jet(a)], kPrecisionBits);
        arb_add(&product[first_jet(a)], first, second, kPrecisionBits);
        for (std::size_t b = 0U; b < kParameterCount; ++b) {
            arb_mul(first, &left[second_jet(a, b)],
                    &right[value_jet()], kPrecisionBits);
            arb_mul(second, &left[first_jet(a)],
                    &right[first_jet(b)], kPrecisionBits);
            arb_add(first, first, second, kPrecisionBits);
            arb_mul(second, &left[first_jet(b)],
                    &right[first_jet(a)], kPrecisionBits);
            arb_add(first, first, second, kPrecisionBits);
            arb_mul(third, &left[value_jet()],
                    &right[second_jet(a, b)], kPrecisionBits);
            arb_add(&product[second_jet(a, b)], first, third,
                    kPrecisionBits);
        }
    }
    arb_clear(third); arb_clear(second); arb_clear(first);
}

bool reciprocal(const Jet &value, Jet &inverse) {
    if (!arb_is_positive(&value[value_jet()])) return false;
    zero(inverse);
    arb_inv(&inverse[value_jet()], &value[value_jet()],
            kPrecisionBits);
    arb_t numerator, term;
    arb_init(numerator); arb_init(term);
    for (std::size_t a = 0U; a < kParameterCount; ++a) {
        arb_mul(numerator, &value[first_jet(a)],
                &inverse[value_jet()], kPrecisionBits);
        arb_div(&inverse[first_jet(a)], numerator,
                &value[value_jet()], kPrecisionBits);
        arb_neg(&inverse[first_jet(a)], &inverse[first_jet(a)]);
    }
    for (std::size_t a = 0U; a < kParameterCount; ++a) {
        for (std::size_t b = 0U; b < kParameterCount; ++b) {
            arb_mul(numerator, &value[second_jet(a, b)],
                    &inverse[value_jet()], kPrecisionBits);
            arb_mul(term, &value[first_jet(a)],
                    &inverse[first_jet(b)], kPrecisionBits);
            arb_add(numerator, numerator, term, kPrecisionBits);
            arb_mul(term, &value[first_jet(b)],
                    &inverse[first_jet(a)], kPrecisionBits);
            arb_add(numerator, numerator, term, kPrecisionBits);
            arb_div(&inverse[second_jet(a, b)], numerator,
                    &value[value_jet()], kPrecisionBits);
            arb_neg(&inverse[second_jet(a, b)],
                    &inverse[second_jet(a, b)]);
        }
    }
    arb_clear(term); arb_clear(numerator);
    return all_finite(inverse);
}

bool unit_identity(const Jet &value) {
    if (!arb_contains_si(&value[value_jet()], 1)) return false;
    for (std::size_t index = 1U; index < kJetCount; ++index)
        if (!arb_contains_zero(&value[index])) return false;
    return true;
}

}  // namespace

Output::Output() {
    for (auto &value : kappa) arb_init(&value);
    for (auto &value : mu) arb_init(&value);
    for (auto &value : beta_plus_one) arb_init(&value);
    zero(kappa); zero(mu); zero(beta_plus_one);
}

Output::~Output() {
    for (auto &value : beta_plus_one) arb_clear(&value);
    for (auto &value : mu) arb_clear(&value);
    for (auto &value : kappa) arb_clear(&value);
}

bool evaluate(const Input &input, Output *output, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (output == nullptr
        || (input.chart != Chart::positive && input.chart != Chart::vacuum)
        || !finite(input.kappa) || !finite(input.theta2)) {
        result->detail = FailureDetail::input_or_output;
        return false;
    }
    zero(output->kappa); zero(output->mu); zero(output->beta_plus_one);
    if (!arb_is_positive(input.kappa) || !arb_is_nonnegative(input.theta2)
        || (input.chart == Chart::vacuum
            && (!finite(input.eta) || !arb_is_nonnegative(input.eta)))) {
        result->detail = FailureDetail::strict_parameter_margin;
        return false;
    }

    arb_set(&output->kappa[value_jet()], input.kappa);
    arb_one(&output->kappa[first_jet(1U)]);
    if (input.chart == Chart::positive) {
        arb_set(&output->mu[value_jet()], input.theta2);
        arb_one(&output->mu[first_jet(2U)]);
    } else {
        arb_mul(&output->mu[value_jet()], input.eta, input.theta2,
                kPrecisionBits);
        arb_set(&output->mu[first_jet(2U)], input.eta);
    }

    Jet inverse_kappa, identity, factor;
    for (auto &value : inverse_kappa) arb_init(&value);
    for (auto &value : identity) arb_init(&value);
    for (auto &value : factor) arb_init(&value);
    zero(inverse_kappa); zero(identity); zero(factor);
    bool pass = reciprocal(output->kappa, inverse_kappa);
    if (pass) {
        multiply(output->kappa, inverse_kappa, identity);
        pass = unit_identity(identity);
    }
    if (pass) {
        for (std::size_t index = 0U; index < kJetCount; ++index) {
            arb_mul_2exp_si(&factor[index], &output->kappa[index], 1);
            arb_sub(&factor[index], &inverse_kappa[index], &factor[index],
                    kPrecisionBits);
        }
        multiply(output->mu, factor, output->beta_plus_one);
        pass = all_finite(output->kappa) && all_finite(output->mu)
            && all_finite(output->beta_plus_one);
    }
    for (auto &value : factor) arb_clear(&value);
    for (auto &value : identity) arb_clear(&value);
    for (auto &value : inverse_kappa) arb_clear(&value);
    if (!pass) {
        result->detail = FailureDetail::reciprocal_or_jet_algebra;
        zero(output->kappa); zero(output->mu); zero(output->beta_plus_one);
        return false;
    }
    result->accepted = true;
    result->detail = FailureDetail::none;
    result->jet_components_written = 3U * kJetCount;
    result->ordered_second_components_written = 3U * 9U;
    result->exact_internal_theta_order = true;
    result->eta_fixed_during_vacuum_differentiation =
        input.chart == Chart::vacuum;
    result->reciprocal_identity_verified = true;
    result->both_mixed_orientations_retained = true;
    return true;
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::input_or_output: return "C08_ANALYTIC_JETS_INPUT_OR_OUTPUT";
    case FailureDetail::strict_parameter_margin: return "C08_ANALYTIC_JETS_STRICT_PARAMETER_MARGIN";
    case FailureDetail::reciprocal_or_jet_algebra: return "C08_ANALYTIC_JETS_RECIPROCAL_OR_ALGEBRA";
    case FailureDetail::nonfinite_output: return "C08_ANALYTIC_JETS_NONFINITE_OUTPUT";
    }
    return "C08_ANALYTIC_JETS_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_analytic_parameter_jets_v1
