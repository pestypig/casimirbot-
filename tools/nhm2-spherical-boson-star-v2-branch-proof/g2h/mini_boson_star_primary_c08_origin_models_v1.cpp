#include "mini_boson_star_primary_c08_origin_models_v1.hpp"

// Compile the audited implementation into this separately versioned adapter so
// its internal recurrence can be replayed without widening the frozen v1 ABI.
#include "mini_boson_star_primary_c08_origin_series_v1.cpp"

#include <algorithm>

namespace nhm2::g2h_e_s5::primary_c08_origin_models_v1 {
namespace {

void clear_values(std::vector<arb_struct> &values) {
    for (auto &value : values) arb_clear(&value);
    values.clear();
}

void initialize_values(std::vector<arb_struct> &values, std::size_t count) {
    clear_values(values);
    values.resize(count);
    for (auto &value : values) arb_init(&value);
}

void fail(Result *result, FailureDetail detail) {
    *result = Result{};
    result->detail = detail;
}

unsigned model_order(State state, unsigned selected) {
    (void)state;
    // C08-010's frozen origin ledger grammar admits only the selected origin
    // order. Natural lower/higher derivative/integral degrees are represented
    // with exact zeros or outward known-term remainders at that common order.
    return selected;
}

bool set_ordinary_coefficient(arb_t target,
                              const origin::CoefficientStorage &derivatives,
                              State state, unsigned degree, std::size_t jet,
                              unsigned selected) {
    arb_zero(target);
    unsigned source = 0U;
    bool present = false;
    switch (state) {
    case State::B:
        source = degree; present = source <= selected; break;
    case State::V:
        source = degree + 1U; present = source <= selected; break;
    case State::J1:
        if (degree >= 1U) {
            source = degree - 1U; present = source <= selected;
        }
        break;
    case State::J2:
        if (degree >= 2U) {
            source = degree - 2U; present = source <= selected;
        }
        break;
    }
    if (!present) return true;
    arb_set(target, derivatives.at(source, jet));
    arb_fac_ui(target, degree, kPrecisionBits);
    arb_inv(target, target, kPrecisionBits);
    arb_mul(target, target, derivatives.at(source, jet), kPrecisionBits);
    return arb_is_finite(target) != 0;
}

origin::TailKind tail_kind(State state) {
    switch (state) {
    case State::B: return origin::TailKind::B;
    case State::V: return origin::TailKind::V;
    case State::J1: return origin::TailKind::J1;
    case State::J2: return origin::TailKind::J2;
    }
    return origin::TailKind::B;
}

bool add_omitted_known_terms(Model &model,
                             const origin::CoefficientStorage &derivatives,
                             State state, unsigned selected, arb_srcptr t0,
                             bool *moved) {
    const unsigned full_degree = state == State::J1 ? selected + 1U
                                : state == State::J2 ? selected + 2U
                                : model.order;
    if (full_degree <= model.order) return true;
    arb_t coefficient, magnitude, power, term;
    arb_init(coefficient); arb_init(magnitude); arb_init(power); arb_init(term);
    bool pass = true;
    for (unsigned degree = model.order + 1U;
         pass && degree <= full_degree; ++degree) {
        for (std::size_t jet = 0U; pass && jet < kJetCount; ++jet) {
            pass = set_ordinary_coefficient(coefficient, derivatives, state,
                                            degree, jet, selected);
            arb_abs(magnitude, coefficient);
            arb_pow_ui(power, t0, degree, kPrecisionBits);
            arb_mul(term, magnitude, power, kPrecisionBits);
            pass = pass && arb_is_finite(term) && arb_is_nonnegative(term);
            if (pass) arb_add_error(model.remainder(jet), term);
        }
        *moved = true;
    }
    arb_clear(term); arb_clear(power); arb_clear(magnitude);
    arb_clear(coefficient);
    return pass;
}

bool add_endpoint_replay_discrepancy(
    Model &model, const origin::Output &origin_output,
    origin::TailKind kind) {
    arb_t polynomial, term, difference, magnitude;
    arb_init(polynomial); arb_init(term); arb_init(difference);
    arb_init(magnitude);
    bool pass = true;
    for (std::size_t jet = 0U; pass && jet < kJetCount; ++jet) {
        arb_zero(polynomial);
        for (std::size_t offset = model.order + 1U; offset > 0U; --offset) {
            arb_mul(term, polynomial, model.right_endpoint, kPrecisionBits);
            arb_add(polynomial, term, model.coefficient(
                        static_cast<unsigned>(offset - 1U), jet),
                    kPrecisionBits);
        }
        arb_sub(difference,
                origin_output.partial_values[jet]
                    + static_cast<std::size_t>(kind),
                polynomial, kPrecisionBits);
        pass = origin::upper_magnitude(magnitude, difference);
        if (pass) arb_add_error(model.remainder(jet), magnitude);
    }
    arb_clear(magnitude); arb_clear(difference); arb_clear(term);
    arb_clear(polynomial);
    return pass;
}

bool endpoint_contains(const Model &model, arb_srcptr expected,
                       std::size_t jet) {
    arb_t value, term;
    arb_init(value); arb_init(term);
    arb_zero(value);
    for (std::size_t offset = model.order + 1U; offset > 0U; --offset) {
        arb_mul(term, value, model.right_endpoint, kPrecisionBits);
        arb_add(value, term, model.coefficient(
                    static_cast<unsigned>(offset - 1U), jet), kPrecisionBits);
    }
    arb_add(value, value, model.remainder(jet), kPrecisionBits);
    const bool pass = arb_contains(value, expected) != 0;
    arb_clear(term); arb_clear(value);
    return pass;
}

}  // namespace

Model::Model() {
    arb_init(left_endpoint); arb_init(right_endpoint);
    arb_init(expansion_center);
}

Model::~Model() {
    clear_values(remainders); clear_values(coefficients);
    arb_clear(expansion_center); arb_clear(right_endpoint);
    arb_clear(left_endpoint);
}

arb_ptr Model::coefficient(unsigned degree, std::size_t jet) {
    return coefficients.data() + static_cast<std::size_t>(degree) * kJetCount + jet;
}

arb_srcptr Model::coefficient(unsigned degree, std::size_t jet) const {
    return coefficients.data() + static_cast<std::size_t>(degree) * kJetCount + jet;
}

arb_ptr Model::remainder(std::size_t jet) { return remainders.data() + jet; }
arb_srcptr Model::remainder(std::size_t jet) const {
    return remainders.data() + jet;
}

ledger::ModelView Model::view(std::size_t ordinal) const {
    return {ordinal, ledger::ModelKind::origin, left_endpoint, right_endpoint,
            expansion_center, order, coefficients.size(), coefficients.data(),
            remainders.size(), remainders.data()};
}

bool evaluate(const origin::Input &input, Output *output, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (output == nullptr) {
        fail(result, FailureDetail::predecessor_or_output);
        return false;
    }
    primary_c08_gevrey_v1::Output gevrey_output;
    primary_c08_gevrey_v1::Result gevrey_result{};
    if (!primary_c08_gevrey_v1::evaluate(input.gevrey, &gevrey_output,
                                         &gevrey_result)) {
        fail(result, FailureDetail::predecessor_or_output);
        return false;
    }
    origin::Result origin_result{};
    if (!origin::evaluate(input, &output->origin_enclosure, &origin_result)) {
        fail(result, FailureDetail::predecessor_or_output);
        return false;
    }
    origin::CoefficientStorage derivatives;
    origin::Result replay_result{};
    if (!origin::initialize_origin(derivatives, input, replay_result)) {
        fail(result, FailureDetail::recurrence_replay);
        return false;
    }
    for (unsigned degree = 0U;
         degree < output->origin_enclosure.selected_order; ++degree) {
        if (!origin::generate_next(derivatives, degree, gevrey_output)) {
            fail(result, FailureDetail::recurrence_replay);
            return false;
        }
    }
    const unsigned selected = output->origin_enclosure.selected_order;
    bool moved_cap_terms = false;
    std::size_t coefficient_count = 0U;
    std::size_t remainder_count = 0U;
    std::size_t endpoint_checks = 0U;
    for (std::size_t state_index = 0U; state_index < kStateCount;
         ++state_index) {
        const State state = static_cast<State>(state_index);
        Model &model = output->models[state_index];
        model.order = model_order(state, selected);
        arb_zero(model.left_endpoint);
        arb_set(model.right_endpoint, output->origin_enclosure.t0);
        arb_zero(model.expansion_center);
        initialize_values(model.coefficients,
                          (static_cast<std::size_t>(model.order) + 1U)
                              * kJetCount);
        initialize_values(model.remainders, kJetCount);
        for (unsigned degree = 0U; degree <= model.order; ++degree)
            for (std::size_t jet = 0U; jet < kJetCount; ++jet)
                if (!set_ordinary_coefficient(model.coefficient(degree, jet),
                                              derivatives, state, degree, jet,
                                              selected)) {
                    fail(result, FailureDetail::model_resource_or_nonfinite);
                    return false;
                }
        const std::size_t kind = static_cast<std::size_t>(tail_kind(state));
        for (std::size_t jet = 0U; jet < kJetCount; ++jet) {
            arb_zero(model.remainder(jet));
            arb_add_error(model.remainder(jet),
                          output->origin_enclosure.tail_bounds[jet] + kind);
            if (!arb_is_finite(model.remainder(jet))) {
                fail(result, FailureDetail::model_resource_or_nonfinite);
                return false;
            }
        }
        if (!add_omitted_known_terms(model, derivatives, state, selected,
                                     output->origin_enclosure.t0,
                                     &moved_cap_terms)) {
            fail(result, FailureDetail::model_resource_or_nonfinite);
            return false;
        }
        if (!add_endpoint_replay_discrepancy(model,
                                             output->origin_enclosure,
                                             tail_kind(state))) {
            fail(result, FailureDetail::model_resource_or_nonfinite);
            return false;
        }
        for (std::size_t jet = 0U; jet < kJetCount; ++jet) {
            if (!endpoint_contains(
                    model,
                    output->origin_enclosure.enclosed_values[jet] + kind,
                    jet)) {
                fail(result, FailureDetail::endpoint_replay);
                return false;
            }
            ++endpoint_checks;
        }
        coefficient_count += model.coefficients.size();
        remainder_count += model.remainders.size();
    }
    result->accepted = true;
    result->detail = FailureDetail::none;
    result->selected_origin_order = selected;
    result->recurrence_coefficients_replayed =
        (static_cast<std::size_t>(selected) + 1U) * kJetCount;
    result->model_coefficient_balls = coefficient_count;
    result->model_remainder_balls = remainder_count;
    result->endpoint_containment_checks = endpoint_checks;
    result->derivative_and_integral_normalization_exact = true;
    result->known_truncated_terms_moved_to_remainder = moved_cap_terms;
    result->signed_remainder_cancellation_used = false;
    result->midpoint_acceptance_used = false;
    return true;
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::predecessor_or_output:
        return "C08-011C_ORIGIN_MODEL_PREDECESSOR_OR_OUTPUT";
    case FailureDetail::recurrence_replay:
        return "C08-011C_ORIGIN_MODEL_RECURRENCE_REPLAY";
    case FailureDetail::model_resource_or_nonfinite:
        return "C08-011C_ORIGIN_MODEL_RESOURCE_OR_NONFINITE";
    case FailureDetail::endpoint_replay:
        return "C08-011C_ORIGIN_MODEL_ENDPOINT_REPLAY";
    }
    return "C08-011C_ORIGIN_MODEL_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_origin_models_v1
