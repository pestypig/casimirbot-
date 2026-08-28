#include "mini_boson_star_primary_c08_p2_ledger_v1.hpp"

namespace nhm2::g2h_e_s5::primary_c08_p2_ledger_v1 {
namespace {

FailureDetail translate_detail(h2::FailureDetail detail) {
    switch (detail) {
    case h2::FailureDetail::none: return FailureDetail::none;
    case h2::FailureDetail::input_or_output:
        return FailureDetail::input_or_output;
    case h2::FailureDetail::scalar_inventory_or_prefix:
        return FailureDetail::dependency_inventory_or_prefix;
    case h2::FailureDetail::c08_010_selector:
        return FailureDetail::c08_010_selector;
    case h2::FailureDetail::centered_to_left_translation:
        return FailureDetail::centered_to_left_translation;
    case h2::FailureDetail::ledger_validation:
        return FailureDetail::ledger_validation;
    case h2::FailureDetail::fixed_resource:
        return FailureDetail::fixed_resource;
    case h2::FailureDetail::terminal_failure_already_recorded:
        return FailureDetail::terminal_failure_already_recorded;
    }
    return FailureDetail::input_or_output;
}

h2::Input adapt(const Input &input) {
    return {input.dependency_ledgers, input.dependency_ledger_identities,
            input.p2_ledger_identity};
}

void translate_result(const h2::Result &source, Result *target) {
    *target = Result{};
    target->accepted = source.accepted;
    target->detail = translate_detail(source.detail);
    target->source_models_before = source.source_models_before;
    target->source_models_after = source.source_models_after;
    target->p2_models_before = source.h2_models_before;
    target->p2_models_after = source.h2_models_after;
    target->models_appended = source.models_appended;
    target->selector_calls = source.selector_calls;
    target->selector_thread_count = source.selector_thread_count;
    target->selector_refinement_candidates_visited =
        source.selector_refinement_candidates_visited;
    target->selector_subpanels_accumulated =
        source.selector_subpanels_accumulated;
    target->source_prefix_digests_checked =
        source.source_prefix_digests_checked;
    target->exact_p2_orientation = source.exact_h2_orientation;
    target->boundary_applied_once_per_selector =
        source.boundary_applied_once_per_selector;
    target->centered_to_left_exact_binomial =
        source.centered_to_left_exact_binomial;
    target->stable_prior_publication = source.stable_prior_publication;
    target->first_failure_terminal = source.first_failure_terminal;
    target->retry_or_retune_used = source.retry_or_retune_used;
    target->signed_remainder_cancellation_used =
        source.signed_remainder_cancellation_used;
    target->midpoint_selection_used = source.midpoint_selection_used;
    target->point_sampling_used = source.point_sampling_used;
    target->p2_c08_010_passed = source.h2_c08_010_passed;
    target->candidate_evaluations = source.candidate_evaluations;
    target->positive_parameter_samples = source.positive_parameter_samples;
    target->candidate_root_created = source.candidate_root_created;
    target->scientific_handler_linked = source.scientific_handler_linked;
    target->authority_promoted = source.authority_promoted;
}

}  // namespace

struct Context::Impl {
    h2::Context engine;
};

Context::Context() : impl_(std::make_unique<Impl>()) {}
Context::~Context() = default;

bool initialize(const Input &input, Context *context, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (context == nullptr) {
        result->detail = FailureDetail::input_or_output;
        return false;
    }
    const h2::Input adapted = adapt(input);
    h2::Result engine_result{};
    const bool accepted = h2::initialize(adapted, &context->impl_->engine,
                                         &engine_result);
    translate_result(engine_result, result);
    return accepted;
}

bool extend(const Input &input, Context *context, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (context == nullptr) {
        result->detail = FailureDetail::input_or_output;
        return false;
    }
    const h2::Input adapted = adapt(input);
    h2::Result engine_result{};
    const bool accepted = h2::extend(adapted, &context->impl_->engine,
                                     &engine_result);
    translate_result(engine_result, result);
    return accepted;
}

ledger::LedgerView published(const Context &context) {
    return h2::published(context.impl_->engine);
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::input_or_output: return "C08_P2_INPUT_OR_OUTPUT";
    case FailureDetail::dependency_inventory_or_prefix:
        return "C08_P2_DEPENDENCY_INVENTORY_OR_PREFIX";
    case FailureDetail::c08_010_selector:
        return "C08-010_P2_VOLTERRA_CONVOLUTION_OR_U_REFINEMENT_EXHAUSTION";
    case FailureDetail::centered_to_left_translation:
        return "C08_P2_CENTERED_TO_LEFT_TRANSLATION";
    case FailureDetail::ledger_validation: return "C08_P2_LEDGER_VALIDATION";
    case FailureDetail::fixed_resource: return "C08_P2_FIXED_RESOURCE";
    case FailureDetail::terminal_failure_already_recorded:
        return "C08_P2_TERMINAL_FAILURE_ALREADY_RECORDED";
    }
    return "C08_P2_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_p2_ledger_v1
