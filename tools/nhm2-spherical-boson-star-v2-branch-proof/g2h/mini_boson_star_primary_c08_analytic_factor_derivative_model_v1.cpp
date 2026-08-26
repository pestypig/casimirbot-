#include "mini_boson_star_primary_c08_analytic_factor_derivative_model_v1.hpp"

#include <array>

namespace nhm2::g2h_e_s5::primary_c08_analytic_factor_derivative_model_v1 {
namespace {

struct Jet {
    std::array<arb_struct, kJetCount> values;
    Jet() { for (auto &value : values) { arb_init(&value); arb_zero(&value); } }
    ~Jet() { for (auto &value : values) arb_clear(&value); }
    arb_ptr data() { return values.data(); }
    arb_ptr at(std::size_t index) { return values.data() + index; }
    arb_srcptr at(std::size_t index) const { return values.data() + index; }
};

bool finite(arb_srcptr value) {
    return value != nullptr && arb_is_finite(value);
}

bool valid_shape(const ledger::ModelView &model) {
    const unsigned maximum_order = model.kind == ledger::ModelKind::origin
        ? ledger::kMaximumOriginOrder
        : model.kind == ledger::ModelKind::positive_panel
            ? ledger::kMaximumPositiveOrder : 0U;
    if (model.coefficients == nullptr || model.remainders == nullptr
        || maximum_order == 0U || model.order > maximum_order
        || model.coefficient_count
            != (static_cast<std::size_t>(model.order) + 1U) * kJetCount
        || model.remainder_count != kJetCount
        || !finite(model.left_endpoint) || !finite(model.right_endpoint)
        || !finite(model.expansion_center)
        || !arb_lt(model.left_endpoint, model.right_endpoint)
        || !arb_equal(model.left_endpoint, model.expansion_center)) return false;
    for (std::size_t index = 0U; index < model.coefficient_count; ++index)
        if (!finite(model.coefficients + index)) return false;
    for (std::size_t jet = 0U; jet < kJetCount; ++jet)
        if (!finite(model.remainders + jet)
            || !arb_contains_zero(model.remainders + jet)) return false;
    return true;
}

bool same_geometry(const ledger::ModelView &left,
                   const ledger::ModelView &right) {
    return left.ordinal == right.ordinal && left.kind == right.kind
        && left.order == right.order
        && arb_equal(left.left_endpoint, right.left_endpoint)
        && arb_equal(left.right_endpoint, right.right_endpoint)
        && arb_equal(left.expansion_center, right.expansion_center);
}

void jet_mul(Jet &output, const Jet &left, const Jet &right) {
    arb_mul(output.at(analytic::value_jet()),
            left.at(analytic::value_jet()), right.at(analytic::value_jet()),
            kPrecisionBits);
    arb_t term, next;
    arb_init(term); arb_init(next);
    for (std::size_t a = 0U; a < analytic::kParameterCount; ++a) {
        arb_mul(output.at(analytic::first_jet(a)),
                left.at(analytic::first_jet(a)),
                right.at(analytic::value_jet()), kPrecisionBits);
        arb_mul(term, left.at(analytic::value_jet()),
                right.at(analytic::first_jet(a)), kPrecisionBits);
        arb_add(next, output.at(analytic::first_jet(a)), term, kPrecisionBits);
        arb_set(output.at(analytic::first_jet(a)), next);
        for (std::size_t b = 0U; b < analytic::kParameterCount; ++b) {
            arb_mul(output.at(analytic::second_jet(a, b)),
                    left.at(analytic::second_jet(a, b)),
                    right.at(analytic::value_jet()), kPrecisionBits);
            arb_mul(term, left.at(analytic::first_jet(a)),
                    right.at(analytic::first_jet(b)), kPrecisionBits);
            arb_add(next, output.at(analytic::second_jet(a, b)), term,
                    kPrecisionBits);
            arb_set(output.at(analytic::second_jet(a, b)), next);
            arb_mul(term, left.at(analytic::first_jet(b)),
                    right.at(analytic::first_jet(a)), kPrecisionBits);
            arb_add(next, output.at(analytic::second_jet(a, b)), term,
                    kPrecisionBits);
            arb_set(output.at(analytic::second_jet(a, b)), next);
            arb_mul(term, left.at(analytic::value_jet()),
                    right.at(analytic::second_jet(a, b)), kPrecisionBits);
            arb_add(next, output.at(analytic::second_jet(a, b)), term,
                    kPrecisionBits);
            arb_set(output.at(analytic::second_jet(a, b)), next);
        }
    }
    arb_clear(next); arb_clear(term);
}

bool set_constant_model(const ledger::ModelView &source, const Jet &constant,
                        product::Output *output) {
    if (output == nullptr) return false;
    output->order = source.order;
    arb_set(output->left_endpoint, source.left_endpoint);
    arb_set(output->right_endpoint, source.right_endpoint);
    arb_set(output->expansion_center, source.expansion_center);
    output->coefficients.resize(
        (static_cast<std::size_t>(source.order) + 1U) * kJetCount);
    output->remainders.resize(kJetCount);
    for (auto &value : output->coefficients) { arb_init(&value); arb_zero(&value); }
    for (auto &value : output->remainders) { arb_init(&value); arb_zero(&value); }
    for (std::size_t jet = 0U; jet < kJetCount; ++jet)
        arb_set(output->coefficient(0U, jet), constant.at(jet));
    return true;
}

void reset(Output &output) {
    for (auto &model : output.models) model.reset();
    output.ordinal = 0U;
    output.kind = ledger::ModelKind::origin;
}

}  // namespace

Output::Output() = default;
Output::~Output() = default;

ledger::ModelView Output::view(Derivative selected) const {
    const std::size_t index = static_cast<std::size_t>(selected);
    if (index >= kDerivativeCount || !models[index]) return {};
    const auto &model = *models[index];
    return {ordinal, kind, model.left_endpoint, model.right_endpoint,
            model.expansion_center, model.order, model.coefficients.size(),
            model.coefficients.data(), model.remainders.size(),
            model.remainders.data()};
}

bool evaluate(const Input &input, Output *output, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (output != nullptr) reset(*output);
    if (output == nullptr || input.parameters == nullptr) {
        result->detail = FailureDetail::input_or_output;
        return false;
    }
    if (!valid_shape(input.f) || !valid_shape(input.e1)
        || !valid_shape(input.e2) || !same_geometry(input.f, input.e1)
        || !same_geometry(input.f, input.e2)) {
        result->detail = FailureDetail::source_geometry;
        return false;
    }
    Jet mu, mu_squared, fprime, e1_constant, e1_linear;
    Jet e2_constant, e2_linear;
    for (std::size_t jet = 0U; jet < kJetCount; ++jet) {
        if (!finite(input.parameters->mu.data() + jet)) {
            result->detail = FailureDetail::parameter_jet;
            return false;
        }
        arb_set(mu.at(jet), input.parameters->mu.data() + jet);
        arb_mul_si(fprime.at(jet), mu.at(jet), -2L, kPrecisionBits);
        arb_mul_ui(e1_constant.at(jet), mu.at(jet), 2U, kPrecisionBits);
    }
    jet_mul(mu_squared, mu, mu);
    for (std::size_t jet = 0U; jet < kJetCount; ++jet)
        arb_mul_ui(e2_linear.at(jet), mu_squared.at(jet), 4U,
                   kPrecisionBits);
    for (std::size_t jet = 0U; jet < kJetCount; ++jet) {
        arb_mul_ui(e2_constant.at(jet), mu.at(jet), 4U, kPrecisionBits);
        arb_t term; arb_init(term);
        arb_mul(term, e2_linear.at(jet), input.f.left_endpoint,
                kPrecisionBits);
        arb_add(e2_constant.at(jet), e2_constant.at(jet), term,
                kPrecisionBits);
        arb_clear(term);
    }

    output->ordinal = input.f.ordinal;
    output->kind = input.f.kind;
    for (auto &model : output->models) model = std::make_unique<product::Output>();
    if (!set_constant_model(input.f, fprime, output->models[0].get())) {
        result->detail = FailureDetail::derivative_algebra;
        reset(*output); return false;
    }
    product::Result e1_result{}, e2_result{};
    const product::Input e1_input{input.e1, e1_constant.data(),
                                  e1_linear.data(), kJetCount};
    const product::Input e2_input{input.e1, e2_constant.data(),
                                  e2_linear.data(), kJetCount};
    if (!product::evaluate(e1_input, output->models[1].get(), &e1_result)
        || !product::evaluate(e2_input, output->models[2].get(), &e2_result)) {
        result->detail = FailureDetail::output_model;
        reset(*output); return false;
    }
    result->accepted = true;
    result->detail = FailureDetail::none;
    result->derivative_models_written = kDerivativeCount;
    result->coefficient_jets_written =
        (static_cast<std::size_t>(input.f.order) + 1U) * kJetCount
        + output->models[1]->coefficients.size()
        + output->models[2]->coefficients.size();
    result->remainder_jets_written = kDerivativeCount * kJetCount;
    result->ordered_second_outputs = 9U * kDerivativeCount;
    result->exact_fprime_formula = true;
    result->exact_e1prime_formula = true;
    result->exact_e2prime_formula = true;
    result->complete_ordered_13_jet_inventory = true;
    result->both_mixed_orientations_retained = true;
    return true;
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::input_or_output: return "C08_ANALYTIC_DERIVATIVE_INPUT_OR_OUTPUT";
    case FailureDetail::source_geometry: return "C08_ANALYTIC_DERIVATIVE_SOURCE_GEOMETRY";
    case FailureDetail::parameter_jet: return "C08_ANALYTIC_DERIVATIVE_PARAMETER_JET";
    case FailureDetail::derivative_algebra: return "C08_ANALYTIC_DERIVATIVE_ALGEBRA";
    case FailureDetail::output_model: return "C08_ANALYTIC_DERIVATIVE_OUTPUT_MODEL";
    }
    return "C08_ANALYTIC_DERIVATIVE_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_analytic_factor_derivative_model_v1
