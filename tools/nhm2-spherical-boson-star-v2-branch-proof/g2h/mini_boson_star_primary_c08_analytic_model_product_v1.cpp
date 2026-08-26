#include "mini_boson_star_primary_c08_analytic_model_product_v1.hpp"

#include <array>
#include <utility>

namespace nhm2::g2h_e_s5::primary_c08_analytic_model_product_v1 {
namespace {

struct JetTerm {
    std::size_t factor;
    std::size_t source;
};

bool finite(arb_srcptr value) {
    return value != nullptr && arb_is_finite(value);
}

bool upper_magnitude(arb_t output, arb_srcptr value) {
    if (!finite(value)) return false;
    arb_t absolute;
    arf_t upper;
    arb_init(absolute); arf_init(upper);
    arb_abs(absolute, value);
    arb_get_ubound_arf(upper, absolute, kPrecisionBits);
    arb_set_arf(output, upper);
    arf_clear(upper); arb_clear(absolute);
    return arb_is_finite(output) && arb_is_nonnegative(output);
}

std::size_t terms_for(std::size_t output, std::array<JetTerm, 4U> *terms) {
    if (output == analytic::value_jet()) {
        (*terms)[0] = {analytic::value_jet(), analytic::value_jet()};
        return 1U;
    }
    if (output < 4U) {
        const std::size_t a = output - 1U;
        (*terms)[0] = {analytic::first_jet(a), analytic::value_jet()};
        (*terms)[1] = {analytic::value_jet(), analytic::first_jet(a)};
        return 2U;
    }
    const std::size_t offset = output - 4U;
    const std::size_t a = offset / analytic::kParameterCount;
    const std::size_t b = offset % analytic::kParameterCount;
    (*terms)[0] = {analytic::second_jet(a, b), analytic::value_jet()};
    (*terms)[1] = {analytic::first_jet(a), analytic::first_jet(b)};
    (*terms)[2] = {analytic::first_jet(b), analytic::first_jet(a)};
    (*terms)[3] = {analytic::value_jet(), analytic::second_jet(a, b)};
    return 4U;
}

bool valid_source(const ledger::ModelView &source) {
    const unsigned maximum_order = source.kind == ledger::ModelKind::origin
        ? ledger::kMaximumOriginOrder
        : source.kind == ledger::ModelKind::positive_panel
            ? ledger::kMaximumPositiveOrder : 0U;
    if (source.coefficients == nullptr || source.remainders == nullptr
        || maximum_order == 0U || source.order > maximum_order
        || source.coefficient_count
            != (static_cast<std::size_t>(source.order) + 1U) * kJetCount
        || source.remainder_count != kJetCount
        || !finite(source.left_endpoint) || !finite(source.right_endpoint)
        || !finite(source.expansion_center)
        || !arb_lt(source.left_endpoint, source.right_endpoint)
        || !arb_equal(source.left_endpoint, source.expansion_center))
        return false;
    for (std::size_t index = 0U; index < source.coefficient_count; ++index)
        if (!finite(source.coefficients + index)) return false;
    for (std::size_t jet = 0U; jet < kJetCount; ++jet)
        if (!finite(source.remainders + jet)
            || !arb_contains_zero(source.remainders + jet))
            return false;
    return true;
}

void clear_values(std::vector<arb_struct> &values) {
    for (auto &value : values) arb_clear(&value);
    values.clear();
}

void allocate(Output &output, unsigned order) {
    clear_values(output.remainders); clear_values(output.coefficients);
    output.order = order;
    output.coefficients.resize((static_cast<std::size_t>(order) + 1U)
                               * kJetCount);
    output.remainders.resize(kJetCount);
    for (auto &value : output.coefficients) { arb_init(&value); arb_zero(&value); }
    for (auto &value : output.remainders) { arb_init(&value); arb_zero(&value); }
}

void reset(Output &output) {
    clear_values(output.remainders); clear_values(output.coefficients);
    output.order = 0U;
    arb_zero(output.left_endpoint); arb_zero(output.right_endpoint);
    arb_zero(output.expansion_center);
}

}  // namespace

Output::Output() {
    arb_init(left_endpoint); arb_init(right_endpoint);
    arb_init(expansion_center);
}

Output::~Output() {
    clear_values(remainders); clear_values(coefficients);
    arb_clear(expansion_center); arb_clear(right_endpoint);
    arb_clear(left_endpoint);
}

arb_ptr Output::coefficient(unsigned degree, std::size_t jet) {
    return coefficients.data() + static_cast<std::size_t>(degree) * kJetCount
        + jet;
}
arb_srcptr Output::coefficient(unsigned degree, std::size_t jet) const {
    return coefficients.data() + static_cast<std::size_t>(degree) * kJetCount
        + jet;
}
arb_ptr Output::remainder(std::size_t jet) { return remainders.data() + jet; }
arb_srcptr Output::remainder(std::size_t jet) const {
    return remainders.data() + jet;
}

bool evaluate(const Input &input, Output *output, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (output != nullptr) reset(*output);
    if (output == nullptr || input.factor_constant == nullptr
        || input.factor_linear == nullptr
        || input.factor_jet_count != kJetCount) {
        result->detail = FailureDetail::input_or_output;
        return false;
    }
    if (!valid_source(input.source)) {
        result->detail = FailureDetail::source_model;
        return false;
    }
    for (std::size_t jet = 0U; jet < kJetCount; ++jet)
        if (!finite(input.factor_constant + jet)
            || !finite(input.factor_linear + jet)) {
            result->detail = FailureDetail::analytic_factor;
            return false;
        }

    allocate(*output, input.source.order);
    arb_set(output->left_endpoint, input.source.left_endpoint);
    arb_set(output->right_endpoint, input.source.right_endpoint);
    arb_set(output->expansion_center, input.source.expansion_center);
    arb_t width, term, next, factor_sup, factor_mag, source_mag;
    arb_t discarded_power, remainder_bound;
    arb_init(width); arb_init(term); arb_init(next); arb_init(factor_sup);
    arb_init(factor_mag); arb_init(source_mag); arb_init(discarded_power);
    arb_init(remainder_bound);
    arb_sub(width, input.source.right_endpoint, input.source.left_endpoint,
            kPrecisionBits);
    bool pass = arb_is_positive(width);

    for (std::size_t output_jet = 0U;
         pass && output_jet < kJetCount; ++output_jet) {
        std::array<JetTerm, 4U> terms{};
        const std::size_t term_count = terms_for(output_jet, &terms);
        for (unsigned degree = 0U; degree <= input.source.order; ++degree) {
            arb_zero(output->coefficient(degree, output_jet));
            for (std::size_t index = 0U; index < term_count; ++index) {
                const auto [factor, source] = terms[index];
                arb_mul(term, input.factor_constant + factor,
                        input.source.coefficients
                            + static_cast<std::size_t>(degree) * kJetCount
                            + source,
                        kPrecisionBits);
                arb_add(next, output->coefficient(degree, output_jet), term,
                        kPrecisionBits);
                arb_set(output->coefficient(degree, output_jet), next);
                ++result->coefficient_product_terms;
                if (degree != 0U) {
                    arb_mul(term, input.factor_linear + factor,
                            input.source.coefficients
                                + static_cast<std::size_t>(degree - 1U)
                                    * kJetCount + source,
                            kPrecisionBits);
                    arb_add(next, output->coefficient(degree, output_jet), term,
                            kPrecisionBits);
                    arb_set(output->coefficient(degree, output_jet), next);
                    ++result->coefficient_product_terms;
                }
            }
            pass = finite(output->coefficient(degree, output_jet));
        }

        arb_zero(remainder_bound);
        for (std::size_t index = 0U; pass && index < term_count; ++index) {
            const auto [factor, source] = terms[index];
            pass = upper_magnitude(factor_sup,
                                   input.factor_constant + factor)
                && upper_magnitude(factor_mag,
                                   input.factor_linear + factor)
                && upper_magnitude(source_mag,
                                   input.source.remainders + source);
            if (!pass) break;
            arb_mul(term, factor_mag, width, kPrecisionBits);
            arb_add(factor_sup, factor_sup, term, kPrecisionBits);
            arb_mul(term, factor_sup, source_mag, kPrecisionBits);
            arb_add(remainder_bound, remainder_bound, term, kPrecisionBits);
            ++result->source_remainder_terms;

            pass = upper_magnitude(factor_mag,
                                   input.factor_linear + factor)
                && upper_magnitude(source_mag,
                    input.source.coefficients
                        + static_cast<std::size_t>(input.source.order)
                            * kJetCount + source);
            if (!pass) break;
            arb_pow_ui(discarded_power, width, input.source.order + 1U,
                       kPrecisionBits);
            arb_mul(term, factor_mag, source_mag, kPrecisionBits);
            arb_mul(term, term, discarded_power, kPrecisionBits);
            arb_add(remainder_bound, remainder_bound, term, kPrecisionBits);
            ++result->discarded_degree_terms;
        }
        arb_zero(output->remainder(output_jet));
        if (pass) arb_add_error(output->remainder(output_jet), remainder_bound);
        pass = pass && finite(output->remainder(output_jet))
            && arb_contains_zero(output->remainder(output_jet));
    }
    arb_clear(remainder_bound); arb_clear(discarded_power);
    arb_clear(source_mag); arb_clear(factor_mag); arb_clear(factor_sup);
    arb_clear(next); arb_clear(term); arb_clear(width);
    if (!pass) {
        result->detail = FailureDetail::nonfinite_assembly;
        reset(*output);
        return false;
    }
    result->accepted = true;
    result->detail = FailureDetail::none;
    result->ordered_second_outputs = 9U;
    result->exact_degree_one_factor = true;
    result->complete_ordered_13_jet_inventory = true;
    result->both_mixed_orientations_retained = true;
    return true;
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::input_or_output: return "C08_ANALYTIC_PRODUCT_INPUT_OR_OUTPUT";
    case FailureDetail::source_model: return "C08_ANALYTIC_PRODUCT_SOURCE_MODEL";
    case FailureDetail::analytic_factor: return "C08_ANALYTIC_PRODUCT_FACTOR";
    case FailureDetail::nonfinite_assembly: return "C08_ANALYTIC_PRODUCT_NONFINITE_ASSEMBLY";
    }
    return "C08_ANALYTIC_PRODUCT_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_analytic_model_product_v1
