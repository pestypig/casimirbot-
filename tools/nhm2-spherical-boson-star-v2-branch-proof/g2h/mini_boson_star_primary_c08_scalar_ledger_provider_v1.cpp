#include "mini_boson_star_primary_c08_scalar_ledger_provider_v1.hpp"

#include <algorithm>
#include <array>
#include <memory>
#include <set>
#include <utility>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_scalar_ledger_provider_v1 {
namespace {

namespace ledger = primary_c08_convolution_ledger_v1;

void fail(Result *result, FailureDetail detail,
          chronology::FiniteFailureCode finite_failure) {
    *result = Result{};
    result->detail = detail;
    result->finite_failure = finite_failure;
    result->first_failure_terminal =
        finite_failure != chronology::FiniteFailureCode::none;
}

bool exact_finite(arb_srcptr value) {
    return value != nullptr && arb_is_finite(value) && arb_is_exact(value);
}

struct OwnedModel {
    ledger::ModelKind kind = ledger::ModelKind::origin;
    arb_t left_endpoint;
    arb_t right_endpoint;
    arb_t expansion_center;
    unsigned order = 0U;
    std::vector<arb_struct> coefficients;
    std::vector<arb_struct> remainders;

    OwnedModel() {
        arb_init(left_endpoint); arb_init(right_endpoint);
        arb_init(expansion_center);
    }
    ~OwnedModel() {
        for (auto &value : remainders) arb_clear(&value);
        for (auto &value : coefficients) arb_clear(&value);
        arb_clear(expansion_center); arb_clear(right_endpoint);
        arb_clear(left_endpoint);
    }
    OwnedModel(const OwnedModel &) = delete;
    OwnedModel &operator=(const OwnedModel &) = delete;

    void allocate(unsigned selected_order) {
        order = selected_order;
        coefficients.resize((static_cast<std::size_t>(order) + 1U)
                            * kJetCount);
        remainders.resize(kJetCount);
        for (auto &value : coefficients) arb_init(&value);
        for (auto &value : remainders) arb_init(&value);
    }

    ledger::ModelView view(std::size_t ordinal) const {
        return {ordinal, kind, left_endpoint, right_endpoint, expansion_center,
                order, coefficients.size(), coefficients.data(),
                remainders.size(), remainders.data()};
    }
};

std::unique_ptr<OwnedModel> copy_origin_model(
    const origin_models::Model &source) {
    auto target = std::make_unique<OwnedModel>();
    target->kind = ledger::ModelKind::origin;
    target->allocate(source.order);
    arb_set(target->left_endpoint, source.left_endpoint);
    arb_set(target->right_endpoint, source.right_endpoint);
    arb_set(target->expansion_center, source.expansion_center);
    for (std::size_t i = 0U; i < target->coefficients.size(); ++i)
        arb_set(target->coefficients.data() + i, source.coefficients.data() + i);
    for (std::size_t i = 0U; i < kJetCount; ++i)
        arb_set(target->remainders.data() + i, source.remainders.data() + i);
    return target;
}

std::unique_ptr<OwnedModel> copy_successor_model(
    const successor::Output &source, std::size_t state) {
    auto target = std::make_unique<OwnedModel>();
    target->kind = ledger::ModelKind::positive_panel;
    target->allocate(source.polynomial.generated_order);
    arb_set(target->left_endpoint, source.polynomial.left_endpoint);
    arb_set(target->right_endpoint, source.polynomial.right_endpoint);
    arb_set(target->expansion_center, source.polynomial.left_endpoint);
    for (unsigned degree = 0U; degree <= target->order; ++degree)
        for (std::size_t jet = 0U; jet < kJetCount; ++jet)
            arb_set(target->coefficients.data()
                        + static_cast<std::size_t>(degree) * kJetCount + jet,
                    source.polynomial.at(degree, state, jet));
    for (std::size_t jet = 0U; jet < kJetCount; ++jet)
        arb_set(target->remainders.data() + jet,
                source.enclosure.remainder(state, jet));
    return target;
}

bool endpoint_boxes(arb_ptr boxes, const successor::Output &source) {
    arb_t value, term;
    arb_init(value); arb_init(term);
    bool pass = true;
    for (std::size_t state = 0U; pass && state < kStateCount; ++state)
        for (std::size_t jet = 0U; pass && jet < kJetCount; ++jet) {
            arb_zero(value);
            for (std::size_t offset = source.polynomial.generated_order + 1U;
                 offset > 0U; --offset) {
                arb_mul(term, value, source.polynomial.panel_width,
                        kPrecisionBits);
                arb_add(value, term, source.polynomial.at(
                            offset - 1U, state, jet), kPrecisionBits);
            }
            arb_add(boxes + state * kJetCount + jet, value,
                    source.enclosure.remainder(state, jet), kPrecisionBits);
            pass = arb_is_finite(boxes + state * kJetCount + jet);
        }
    arb_clear(term); arb_clear(value);
    return pass;
}

struct Publication {
    std::array<std::vector<ledger::ModelView>, kStateCount> views;
    std::array<finite::TaggedLedgerView, kStateCount> tags{};

    Publication(
        const std::array<std::vector<std::unique_ptr<OwnedModel>>, kStateCount>
            &models,
        const std::array<std::uint32_t, kStateCount> &identities) {
        for (std::size_t state = 0U; state < kStateCount; ++state) {
            views[state].reserve(models[state].size());
            for (std::size_t ordinal = 0U; ordinal < models[state].size();
                 ++ordinal)
                views[state].push_back(models[state][ordinal]->view(ordinal));
            tags[state] = {identities[state],
                           {views[state].size(), views[state].data()}};
        }
    }

    finite::LedgerSetView view() const {
        return {tags.size(), tags.data()};
    }
};

FailureDetail map_successor_failure(successor::FailureDetail detail,
                                    chronology::FiniteFailureCode *code) {
    switch (detail) {
    case successor::FailureDetail::none:
        *code = chronology::FiniteFailureCode::none;
        return FailureDetail::none;
    case successor::FailureDetail::predecessor_or_input:
    case successor::FailureDetail::left_state_nonfinite:
        *code = chronology::FiniteFailureCode::c08_006_origin_series_order_exhaustion;
        return FailureDetail::c08_006_origin;
    case successor::FailureDetail::positive_panel_denominator_or_coefficient:
        *code = chronology::FiniteFailureCode::c08_007_positive_panel_denominator_or_coefficient;
        return FailureDetail::c08_007_positive_panel;
    case successor::FailureDetail::panel_defect_or_exact_zero_replay:
        *code = chronology::FiniteFailureCode::c08_008_panel_defect_or_exact_zero_replay;
        return FailureDetail::c08_008_panel_defect;
    case successor::FailureDetail::picard_inflation_or_width_exhaustion:
        *code = chronology::FiniteFailureCode::c08_009_picard_inflation_or_width_exhaustion;
        return FailureDetail::c08_009_picard;
    }
    *code = chronology::FiniteFailureCode::fixed_resource_failure_at_originating_producer;
    return FailureDetail::fixed_resource;
}

}  // namespace

struct Context::Impl {
    Input input{};
    std::array<std::vector<std::unique_ptr<OwnedModel>>, kStateCount> models;
    std::array<arb_struct, kStateCount * kJetCount> left_boxes;
    arb_t current_right;
    std::vector<std::unique_ptr<Publication>> publications;
    bool initialized = false;
    bool terminal_failure = false;
    FailureDetail terminal_detail = FailureDetail::none;
    chronology::FiniteFailureCode terminal_code =
        chronology::FiniteFailureCode::none;

    Impl() {
        for (auto &box : left_boxes) arb_init(&box);
        arb_init(current_right); arb_zero(current_right);
    }
    ~Impl() {
        arb_clear(current_right);
        for (auto &box : left_boxes) arb_clear(&box);
    }

    void publish() {
        publications.push_back(std::make_unique<Publication>(
            models, input.scalar_ledger_identities));
    }
};

Context::Context() : impl_(std::make_unique<Impl>()) {}
Context::~Context() = default;

bool initialize(const Input &input, Context *context, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (context == nullptr || context->impl_->initialized) {
        fail(result, FailureDetail::input_or_output,
             chronology::FiniteFailureCode::none);
        return false;
    }
    std::set<std::uint32_t> identities;
    for (const auto identity : input.scalar_ledger_identities)
        if (!identities.insert(identity).second) {
            fail(result, FailureDetail::input_or_output,
                 chronology::FiniteFailureCode::none);
            return false;
        }
    origin_models::Output origin_output;
    origin_models::Result origin_result{};
    if (!origin_models::evaluate(input.origin, &origin_output, &origin_result)) {
        fail(result, FailureDetail::c08_006_origin,
             chronology::FiniteFailureCode::c08_006_origin_series_order_exhaustion);
        return false;
    }
    auto &impl = *context->impl_;
    impl.input = input;
    const std::array<origin_models::origin::TailKind, kStateCount> kinds = {
        origin_models::origin::TailKind::B,
        origin_models::origin::TailKind::V,
        origin_models::origin::TailKind::J1,
        origin_models::origin::TailKind::J2,
    };
    for (std::size_t state = 0U; state < kStateCount; ++state) {
        impl.models[state].push_back(copy_origin_model(
            origin_output.models[state]));
        for (std::size_t jet = 0U; jet < kJetCount; ++jet)
            arb_set(impl.left_boxes.data() + state * kJetCount + jet,
                    origin_output.origin_enclosure.enclosed_values[jet]
                        + static_cast<std::size_t>(kinds[state]));
    }
    arb_set(impl.current_right, origin_output.origin_enclosure.t0);
    impl.publish();
    impl.initialized = true;
    result->accepted = true;
    result->models_after_per_ledger = 1U;
    result->endpoint_boxes_produced = kStateCount * kJetCount;
    result->c08_006_passed = true;
    result->c08_010_passed = false;
    result->append_only = true;
    result->stable_prior_publication = true;
    return true;
}

bool extend_to(Context *context, arb_srcptr target, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (context == nullptr || !context->impl_->initialized
        || !exact_finite(target) || !arb_is_positive(target)) {
        fail(result, FailureDetail::input_or_output,
             chronology::FiniteFailureCode::none);
        return false;
    }
    auto &impl = *context->impl_;
    if (impl.terminal_failure) {
        fail(result, FailureDetail::terminal_failure_already_recorded,
             impl.terminal_code);
        result->models_before_per_ledger = impl.models[0].size();
        result->models_after_per_ledger = impl.models[0].size();
        result->first_failure_terminal = true;
        return false;
    }
    const std::size_t before = impl.models[0].size();
    if (arb_le(target, impl.current_right)) {
        result->accepted = true;
        result->models_before_per_ledger = before;
        result->models_after_per_ledger = before;
        result->c08_006_passed = true;
        result->c08_007_passed = true;
        result->c08_008_passed = true;
        result->c08_009_passed = true;
        result->c08_010_passed = false;
        result->append_only = true;
        result->stable_prior_publication = true;
        return true;
    }

    std::size_t appended = 0U;
    while (arb_lt(impl.current_right, target)) {
        if (impl.models[0].size() >= ledger::kMaximumLedgerModels) {
            impl.terminal_failure = true;
            impl.terminal_detail = FailureDetail::fixed_resource;
            impl.terminal_code = chronology::FiniteFailureCode::fixed_resource_failure_at_originating_producer;
            impl.publish();
            fail(result, impl.terminal_detail, impl.terminal_code);
            result->models_before_per_ledger = before;
            result->models_after_per_ledger = impl.models[0].size();
            result->panels_appended = appended;
            return false;
        }
        successor::Input successor_input{
            impl.input.origin, impl.current_right, impl.left_boxes.size(),
            impl.left_boxes.data(), target};
        successor::Output successor_output;
        successor::Result successor_result{};
        if (!successor::evaluate(successor_input, &successor_output,
                                 &successor_result)) {
            impl.terminal_failure = true;
            impl.terminal_detail = map_successor_failure(
                successor_result.detail, &impl.terminal_code);
            impl.publish();
            fail(result, impl.terminal_detail, impl.terminal_code);
            result->models_before_per_ledger = before;
            result->models_after_per_ledger = impl.models[0].size();
            result->panels_appended = appended;
            return false;
        }
        std::array<std::unique_ptr<OwnedModel>, kStateCount> pending;
        for (std::size_t state = 0U; state < kStateCount; ++state)
            pending[state] = copy_successor_model(successor_output, state);
        std::array<arb_struct, kStateCount * kJetCount> next_boxes;
        for (auto &box : next_boxes) arb_init(&box);
        const bool endpoint_ok = endpoint_boxes(next_boxes.data(),
                                                successor_output);
        if (!endpoint_ok) {
            for (auto &box : next_boxes) arb_clear(&box);
            impl.terminal_failure = true;
            impl.terminal_detail = FailureDetail::publication_or_endpoint;
            impl.terminal_code = chronology::FiniteFailureCode::fixed_resource_failure_at_originating_producer;
            impl.publish();
            fail(result, impl.terminal_detail, impl.terminal_code);
            result->models_before_per_ledger = before;
            result->models_after_per_ledger = impl.models[0].size();
            result->panels_appended = appended;
            return false;
        }
        for (std::size_t state = 0U; state < kStateCount; ++state)
            impl.models[state].push_back(std::move(pending[state]));
        for (std::size_t index = 0U; index < next_boxes.size(); ++index) {
            arb_set(impl.left_boxes.data() + index, next_boxes.data() + index);
            arb_clear(next_boxes.data() + index);
        }
        arb_set(impl.current_right,
                successor_output.polynomial.right_endpoint);
        ++appended;
    }
    impl.publish();
    result->accepted = true;
    result->models_before_per_ledger = before;
    result->models_after_per_ledger = impl.models[0].size();
    result->panels_appended = appended;
    result->endpoint_boxes_produced = appended * kStateCount * kJetCount;
    result->c08_006_passed = true;
    result->c08_007_passed = true;
    result->c08_008_passed = true;
    result->c08_009_passed = true;
    result->c08_010_passed = false;
    result->append_only = true;
    result->stable_prior_publication = true;
    result->retry_or_retune_used = false;
    result->signed_remainder_cancellation_used = false;
    result->midpoint_acceptance_used = false;
    return true;
}

finite::LedgerSetView published(const Context &context) {
    if (!context.impl_->initialized || context.impl_->publications.empty())
        return {};
    return context.impl_->publications.back()->view();
}

arb_srcptr right_endpoint(const Context &context) {
    return context.impl_->initialized ? context.impl_->current_right : nullptr;
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::input_or_output: return "C08_SCALAR_PROVIDER_INPUT_OR_OUTPUT";
    case FailureDetail::c08_006_origin: return "C08-006_ORIGIN_SERIES_ORDER_EXHAUSTION";
    case FailureDetail::c08_007_positive_panel: return "C08-007_POSITIVE_PANEL_DENOMINATOR_OR_COEFFICIENT";
    case FailureDetail::c08_008_panel_defect: return "C08-008_PANEL_DEFECT_OR_EXACT_ZERO_REPLAY";
    case FailureDetail::c08_009_picard: return "C08-009_PICARD_INFLATION_OR_WIDTH_EXHAUSTION";
    case FailureDetail::fixed_resource: return "C08_SCALAR_PROVIDER_FIXED_RESOURCE";
    case FailureDetail::publication_or_endpoint: return "C08_SCALAR_PROVIDER_PUBLICATION_OR_ENDPOINT";
    case FailureDetail::terminal_failure_already_recorded: return "C08_SCALAR_PROVIDER_TERMINAL_FAILURE_ALREADY_RECORDED";
    }
    return "C08_SCALAR_PROVIDER_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_scalar_ledger_provider_v1
