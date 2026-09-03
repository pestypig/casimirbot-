#include "mini_boson_star_primary_c08_h2_ledger_v1.hpp"

#include "mini_boson_star_sha256_v1.hpp"

#include <flint/flint.h>
#include <flint/fmpz.h>

#include <array>
#include <memory>
#include <set>
#include <string>
#include <utility>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_h2_ledger_v1 {
namespace {

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

    arb_ptr coefficient(unsigned degree, std::size_t jet) {
        return coefficients.data()
            + static_cast<std::size_t>(degree) * kJetCount + jet;
    }

    ledger::ModelView view(std::size_t ordinal) const {
        return {ordinal, kind, left_endpoint, right_endpoint, expansion_center,
                order, coefficients.size(), coefficients.data(),
                remainders.size(), remainders.data()};
    }
};

struct Publication {
    std::vector<ledger::ModelView> views;
    explicit Publication(
        const std::vector<std::unique_ptr<OwnedModel>> &models) {
        views.reserve(models.size());
        for (std::size_t ordinal = 0U; ordinal < models.size(); ++ordinal)
            views.push_back(models[ordinal]->view(ordinal));
    }
    ledger::LedgerView view() const { return {views.size(), views.data()}; }
};

bool append_arb(std::string &bytes, arb_srcptr value) {
    if (value == nullptr || !arb_is_finite(value)) return false;
    char *dump = arb_dump_str(value);
    if (dump == nullptr) return false;
    bytes.append(dump);
    bytes.push_back('\n');
    flint_free(dump);
    return true;
}

bool model_digest(const ledger::ModelView &model, std::string *digest) {
    if (digest == nullptr || model.coefficients == nullptr
        || model.remainders == nullptr)
        return false;
    std::string bytes = "nhm2-g2h-e-s5/c08-h2-source-model/v1\n";
    bytes += std::to_string(model.ordinal) + "\n";
    bytes += std::to_string(static_cast<unsigned>(model.kind)) + "\n";
    bytes += std::to_string(model.order) + "\n";
    bytes += std::to_string(model.coefficient_count) + "\n";
    bytes += std::to_string(model.remainder_count) + "\n";
    if (!append_arb(bytes, model.left_endpoint)
        || !append_arb(bytes, model.right_endpoint)
        || !append_arb(bytes, model.expansion_center))
        return false;
    for (std::size_t i = 0U; i < model.coefficient_count; ++i)
        if (!append_arb(bytes, model.coefficients + i)) return false;
    for (std::size_t i = 0U; i < model.remainder_count; ++i)
        if (!append_arb(bytes, model.remainders + i)) return false;
    *digest = sha256_v1::text(bytes);
    return true;
}

const finite::TaggedLedgerView *find_tag(const Input &input,
                                         std::uint32_t identity) {
    if (input.scalar_ledgers.ledgers == nullptr) return nullptr;
    for (std::size_t i = 0U; i < input.scalar_ledgers.ledger_count; ++i)
        if (input.scalar_ledgers.ledgers[i].identity == identity)
            return input.scalar_ledgers.ledgers + i;
    return nullptr;
}

bool same_geometry(const ledger::ModelView &left,
                   const ledger::ModelView &right) {
    return left.ordinal == right.ordinal && left.kind == right.kind
        && left.order == right.order
        && arb_equal(left.left_endpoint, right.left_endpoint)
        && arb_equal(left.right_endpoint, right.right_endpoint)
        && arb_equal(left.expansion_center, right.expansion_center);
}

bool valid_scalar_ledger(const ledger::LedgerView &view) {
    if (view.models == nullptr || view.model_count == 0U) return false;
    ledger::Output output;
    ledger::Result result{};
    arb_t zero, one;
    arb_init(zero); arb_init(one); arb_zero(zero); arb_one(one);
    const ledger::Input input{view, view.models[0].left_endpoint,
                              view.models[view.model_count - 1U].right_endpoint,
                              zero, one};
    const bool accepted = ledger::evaluate(input, &output, &result)
        && result.accepted && result.models_validated == view.model_count;
    arb_clear(one); arb_clear(zero);
    return accepted;
}

bool valid_inventory(
    const Input &input,
    std::array<const finite::TaggedLedgerView *, kScalarStateCount> *scalar) {
    if (scalar == nullptr) return false;
    if (input.scalar_ledgers.ledger_count != kScalarStateCount
        || input.scalar_ledgers.ledgers == nullptr)
        return false;
    std::set<std::uint32_t> identities;
    for (const auto identity : input.scalar_ledger_identities)
        if (!identities.insert(identity).second) return false;
    if (identities.count(input.h2_ledger_identity) != 0U) return false;
    std::set<std::uint32_t> supplied;
    std::size_t common_model_count = 0U;
    for (std::size_t i = 0U; i < input.scalar_ledgers.ledger_count; ++i) {
        const auto &tagged = input.scalar_ledgers.ledgers[i];
        if (!supplied.insert(tagged.identity).second
            || identities.count(tagged.identity) == 0U
            || tagged.ledger.models == nullptr
            || tagged.ledger.model_count == 0U)
            return false;
        if (i == 0U) common_model_count = tagged.ledger.model_count;
        else if (tagged.ledger.model_count != common_model_count) return false;
    }
    if (supplied != identities) return false;
    for (std::size_t state = 0U; state < kScalarStateCount; ++state) {
        (*scalar)[state] = find_tag(input, input.scalar_ledger_identities[state]);
        if ((*scalar)[state] == nullptr
            || !valid_scalar_ledger((*scalar)[state]->ledger))
            return false;
    }
    for (std::size_t ordinal = 0U; ordinal < common_model_count; ++ordinal) {
        const auto &reference = (*scalar)[0]->ledger.models[ordinal];
        for (std::size_t state = 1U; state < kScalarStateCount; ++state)
            if (!same_geometry(reference,
                               (*scalar)[state]->ledger.models[ordinal]))
                return false;
    }
    return true;
}

bool validate_with_pending(
    const std::vector<std::unique_ptr<OwnedModel>> &accepted,
    const OwnedModel &pending) {
    std::vector<ledger::ModelView> views;
    views.reserve(accepted.size() + 1U);
    for (std::size_t ordinal = 0U; ordinal < accepted.size(); ++ordinal)
        views.push_back(accepted[ordinal]->view(ordinal));
    views.push_back(pending.view(accepted.size()));
    const ledger::LedgerView ledger_view{views.size(), views.data()};
    ledger::Output ledger_output;
    ledger::Result ledger_result{};
    arb_t zero, one;
    arb_init(zero); arb_init(one); arb_zero(zero); arb_one(one);
    const ledger::Input ledger_input{ledger_view, views.front().left_endpoint,
                                      views.back().right_endpoint, zero, one};
    const bool valid = ledger::evaluate(ledger_input, &ledger_output,
                                         &ledger_result);
    arb_clear(one); arb_clear(zero);
    return valid;
}

bool translate_to_left(const selector::Output &source, std::size_t ordinal,
                       std::unique_ptr<OwnedModel> *translated,
                       std::size_t *terms) {
    if (translated == nullptr || terms == nullptr
        || !arb_is_exact(source.target_left)
        || !arb_is_exact(source.target_right)
        || !arb_is_exact(source.target_center)
        || !arb_lt(source.target_left, source.target_right))
        return false;
    auto model = std::make_unique<OwnedModel>();
    model->kind = ordinal == 0U ? ledger::ModelKind::origin
                                : ledger::ModelKind::positive_panel;
    model->allocate(source.retained_order);
    arb_set(model->left_endpoint, source.target_left);
    arb_set(model->right_endpoint, source.target_right);
    arb_set(model->expansion_center, source.target_left);

    arb_t delta, power, scaled, contribution, accumulated;
    arb_init(delta); arb_init(power); arb_init(scaled);
    arb_init(contribution); arb_init(accumulated);
    arb_sub(delta, source.target_left, source.target_center, kPrecisionBits);
    fmpz_t binomial;
    fmpz_init(binomial);
    bool pass = arb_is_exact(delta);
    *terms = 0U;
    for (unsigned left_degree = 0U;
         pass && left_degree <= source.retained_order; ++left_degree) {
        for (std::size_t jet = 0U; pass && jet < kJetCount; ++jet) {
            arb_zero(accumulated);
            for (unsigned centered_degree = left_degree;
                 centered_degree <= source.retained_order;
                 ++centered_degree) {
                fmpz_bin_uiui(binomial, centered_degree, left_degree);
                arb_mul_fmpz(scaled,
                             source.coefficient(centered_degree, jet),
                             binomial, kPrecisionBits);
                arb_pow_ui(power, delta, centered_degree - left_degree,
                           kPrecisionBits);
                arb_mul(contribution, scaled, power, kPrecisionBits);
                arb_add(accumulated, accumulated, contribution,
                        kPrecisionBits);
                ++*terms;
            }
            arb_set(model->coefficient(left_degree, jet), accumulated);
            pass = arb_is_finite(model->coefficient(left_degree, jet));
        }
    }
    for (std::size_t jet = 0U; pass && jet < kJetCount; ++jet) {
        arb_zero(model->remainders.data() + jet);
        arb_add_error(model->remainders.data() + jet,
                      source.remainder(jet));
        pass = arb_is_finite(model->remainders.data() + jet)
            && arb_contains_zero(model->remainders.data() + jet);
    }
    fmpz_clear(binomial);
    arb_clear(accumulated); arb_clear(contribution); arb_clear(scaled);
    arb_clear(power); arb_clear(delta);
    if (!pass) return false;
    *translated = std::move(model);
    return true;
}

}  // namespace

struct Context::Impl {
    std::array<std::uint32_t, kScalarStateCount> scalar_ids{};
    std::uint32_t h2_id = 0U;
    std::vector<std::unique_ptr<OwnedModel>> models;
    std::vector<std::unique_ptr<Publication>> publications;
    std::array<std::vector<std::string>, kScalarStateCount>
        scalar_source_digests;
    std::array<arb_struct, kJetCount> b_at_zero;
    bool initialized = false;
    bool terminal_failure = false;
    FailureDetail terminal_detail = FailureDetail::none;

    Impl() { for (auto &value : b_at_zero) arb_init(&value); }
    ~Impl() { for (auto &value : b_at_zero) arb_clear(&value); }
    void publish() {
        publications.push_back(std::make_unique<Publication>(models));
    }
};

Context::Context() : impl_(std::make_unique<Impl>()) {}
Context::~Context() = default;

namespace {

bool extend_impl(const Input &input, Context::Impl &impl, Result *result,
                 bool initializing, ParentDiagnostics *diagnostics) {
    if (diagnostics != nullptr) *diagnostics = ParentDiagnostics{};
    std::array<const finite::TaggedLedgerView *, kScalarStateCount> scalar{};
    if (!valid_inventory(input, &scalar)
        || (!initializing && (input.scalar_ledger_identities != impl.scalar_ids
                              || input.h2_ledger_identity != impl.h2_id))) {
        *result = Result{};
        result->detail = FailureDetail::scalar_inventory_or_prefix;
        return false;
    }
    const auto *b = scalar[0];
    const auto *v = scalar[1];
    if (impl.terminal_failure) {
        *result = Result{};
        result->detail = FailureDetail::terminal_failure_already_recorded;
        result->first_failure_terminal = true;
        result->h2_models_before = impl.models.size();
        result->h2_models_after = impl.models.size();
        return false;
    }
    if (b->ledger.model_count < impl.models.size()) {
        *result = Result{};
        result->detail = FailureDetail::scalar_inventory_or_prefix;
        return false;
    }
    for (std::size_t ordinal = 0U; ordinal < impl.models.size(); ++ordinal) {
        for (std::size_t state = 0U; state < kScalarStateCount; ++state) {
            std::string digest;
            if (!model_digest(scalar[state]->ledger.models[ordinal], &digest)
                || digest != impl.scalar_source_digests[state][ordinal]) {
                *result = Result{};
                result->detail = FailureDetail::scalar_inventory_or_prefix;
                return false;
            }
            ++result->source_prefix_digests_checked;
        }
    }

    const std::size_t before = impl.models.size();
    result->source_models_before = before;
    result->h2_models_before = before;
    for (std::size_t ordinal = before; ordinal < b->ledger.model_count;
         ++ordinal) {
        if (ordinal >= ledger::kMaximumLedgerModels) {
            impl.terminal_failure = true;
            impl.terminal_detail = FailureDetail::fixed_resource;
            impl.publish();
            *result = Result{};
            result->detail = impl.terminal_detail;
            result->first_failure_terminal = true;
            result->h2_models_before = before;
            result->h2_models_after = impl.models.size();
            return false;
        }
        const ledger::ModelView &target = b->ledger.models[ordinal];
        const ledger::LedgerView b_prefix{ordinal + 1U, b->ledger.models};
        const ledger::LedgerView v_prefix{ordinal + 1U, v->ledger.models};
        selector::Input selector_input{b_prefix, v_prefix,
            target.left_endpoint, target.right_endpoint, target.order,
            kJetCount, impl.b_at_zero.data()};
        selector::Output selector_output;
        selector::Result selector_result{};
        ++result->selector_calls;
        result->selector_thread_count = kSelectorThreadCount;
        selector::WidthDiagnostics selector_diagnostics;
        const bool selector_passed = diagnostics == nullptr
            ? selector::evaluate_prepared_parallel(
                selector_input, kSelectorThreadCount, &selector_output,
                &selector_result)
            : selector::evaluate_prepared_parallel_diagnostic(
                selector_input, kSelectorThreadCount, &selector_output,
                &selector_result, &selector_diagnostics);
        if (diagnostics != nullptr) {
            diagnostics->present = true;
            diagnostics->source_ordinal = ordinal;
            diagnostics->selector_call_ordinal = result->selector_calls;
            diagnostics->selector_passed = selector_passed;
            diagnostics->selector_detail = selector_result.detail;
            diagnostics->width = std::move(selector_diagnostics);
        }
        result->selector_refinement_candidates_visited +=
            selector_result.refinement_candidates_visited;
        result->selector_subpanels_accumulated +=
            selector_result.subpanels_accumulated;
        result->selector_jet_predecessor_calls +=
            selector_result.jet_predecessor_calls;
        result->selector_elementary_convolutions +=
            selector_result.elementary_convolutions;
        result->selector_numerical_width_checks +=
            selector_result.numerical_width_checks;
        if (!selector_passed) {
            impl.terminal_failure = true;
            impl.terminal_detail = FailureDetail::c08_010_selector;
            impl.publish();
            result->detail = impl.terminal_detail;
            result->first_failure_terminal = true;
            result->h2_models_after = impl.models.size();
            return false;
        }
        result->selector_u_panels_total += selector_output.selected_u_panels;
        std::unique_ptr<OwnedModel> translated;
        std::size_t terms = 0U;
        if (!translate_to_left(selector_output, ordinal, &translated, &terms)) {
            impl.terminal_failure = true;
            impl.terminal_detail = FailureDetail::centered_to_left_translation;
            impl.publish();
            result->detail = impl.terminal_detail;
            result->first_failure_terminal = true;
            result->h2_models_after = impl.models.size();
            return false;
        }
        std::array<std::string, kScalarStateCount> source_digests;
        for (std::size_t state = 0U; state < kScalarStateCount; ++state) {
            if (!model_digest(scalar[state]->ledger.models[ordinal],
                              &source_digests[state])) {
                impl.terminal_failure = true;
                impl.terminal_detail = FailureDetail::scalar_inventory_or_prefix;
                impl.publish();
                result->detail = impl.terminal_detail;
                result->first_failure_terminal = true;
                result->h2_models_after = impl.models.size();
                return false;
            }
        }
        if (!validate_with_pending(impl.models, *translated)) {
            impl.terminal_failure = true;
            impl.terminal_detail = FailureDetail::ledger_validation;
            impl.publish();
            result->detail = impl.terminal_detail;
            result->first_failure_terminal = true;
            result->h2_models_after = impl.models.size();
            return false;
        }
        impl.models.push_back(std::move(translated));
        for (std::size_t state = 0U; state < kScalarStateCount; ++state)
            impl.scalar_source_digests[state].push_back(
                std::move(source_digests[state]));
        result->translated_coefficient_terms += terms;
        ++result->models_appended;
    }
    impl.publish();
    result->accepted = true;
    result->detail = FailureDetail::none;
    result->source_models_after = b->ledger.model_count;
    result->h2_models_after = impl.models.size();
    result->exact_h2_orientation = true;
    result->boundary_applied_once_per_selector = true;
    result->centered_to_left_exact_binomial = true;
    result->stable_prior_publication = true;
    result->retry_or_retune_used = false;
    result->signed_remainder_cancellation_used = false;
    result->midpoint_selection_used = false;
    result->point_sampling_used = false;
    result->h2_c08_010_passed = true;
    return true;
}

}  // namespace

bool initialize(const Input &input, Context *context, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (context == nullptr || context->impl_->initialized) {
        result->detail = FailureDetail::input_or_output;
        return false;
    }
    std::array<const finite::TaggedLedgerView *, kScalarStateCount> scalar{};
    if (!valid_inventory(input, &scalar)) {
        result->detail = FailureDetail::scalar_inventory_or_prefix;
        return false;
    }
    const auto *b = scalar[0];
    auto &impl = *context->impl_;
    impl.scalar_ids = input.scalar_ledger_identities;
    impl.h2_id = input.h2_ledger_identity;
    const ledger::ModelView &origin_b = b->ledger.models[0];
    if (origin_b.kind != ledger::ModelKind::origin
        || origin_b.order > ledger::kMaximumOriginOrder
        || origin_b.coefficient_count < kJetCount) {
        result->detail = FailureDetail::scalar_inventory_or_prefix;
        return false;
    }
    for (std::size_t jet = 0U; jet < kJetCount; ++jet)
        arb_set(impl.b_at_zero.data() + jet, origin_b.coefficients + jet);
    if (!extend_impl(input, impl, result, true, nullptr)) return false;
    impl.initialized = true;
    return true;
}

bool extend(const Input &input, Context *context, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (context == nullptr || !context->impl_->initialized) {
        result->detail = FailureDetail::input_or_output;
        return false;
    }
    return extend_impl(input, *context->impl_, result, false, nullptr);
}

bool initialize_diagnostic(const Input &input, Context *context,
                           Result *result, ParentDiagnostics *diagnostics) {
    if (result == nullptr) return false;
    *result = Result{};
    if (diagnostics == nullptr || context == nullptr
        || context->impl_->initialized) {
        result->detail = FailureDetail::input_or_output;
        return false;
    }
    *diagnostics = ParentDiagnostics{};
    std::array<const finite::TaggedLedgerView *, kScalarStateCount> scalar{};
    if (!valid_inventory(input, &scalar)) {
        result->detail = FailureDetail::scalar_inventory_or_prefix;
        return false;
    }
    const auto *b = scalar[0];
    auto &impl = *context->impl_;
    impl.scalar_ids = input.scalar_ledger_identities;
    impl.h2_id = input.h2_ledger_identity;
    const ledger::ModelView &origin_b = b->ledger.models[0];
    if (origin_b.kind != ledger::ModelKind::origin
        || origin_b.order > ledger::kMaximumOriginOrder
        || origin_b.coefficient_count < kJetCount) {
        result->detail = FailureDetail::scalar_inventory_or_prefix;
        return false;
    }
    for (std::size_t jet = 0U; jet < kJetCount; ++jet)
        arb_set(impl.b_at_zero.data() + jet, origin_b.coefficients + jet);
    if (!extend_impl(input, impl, result, true, diagnostics)) return false;
    impl.initialized = true;
    return true;
}

bool extend_diagnostic(const Input &input, Context *context, Result *result,
                       ParentDiagnostics *diagnostics) {
    if (result == nullptr) return false;
    *result = Result{};
    if (diagnostics == nullptr || context == nullptr
        || !context->impl_->initialized) {
        result->detail = FailureDetail::input_or_output;
        return false;
    }
    return extend_impl(input, *context->impl_, result, false, diagnostics);
}

bool diagnose_next_selector_candidate(
    const Input &input, const Context *context, std::size_t panel_count,
    std::size_t thread_count, unsigned target_degree, std::size_t target_jet,
    selector::Output *output, selector::Result *result,
    selector::CoefficientDecompositionObservation *observation) {
    if (result == nullptr) return false;
    *result = selector::Result{};
    if (context == nullptr || output == nullptr || observation == nullptr
        || !context->impl_->initialized || context->impl_->terminal_failure) {
        return false;
    }
    const auto &impl = *context->impl_;
    std::array<const finite::TaggedLedgerView *, kScalarStateCount> scalar{};
    if (!valid_inventory(input, &scalar)
        || input.scalar_ledger_identities != impl.scalar_ids
        || input.h2_ledger_identity != impl.h2_id) return false;
    const auto *b = scalar[0];
    const auto *v = scalar[1];
    if (b->ledger.model_count != impl.models.size() + 1U) return false;
    for (std::size_t state = 1U; state < kScalarStateCount; ++state) {
        if (scalar[state]->ledger.model_count != b->ledger.model_count)
            return false;
    }
    for (std::size_t ordinal = 0U; ordinal < impl.models.size(); ++ordinal) {
        for (std::size_t state = 0U; state < kScalarStateCount; ++state) {
            std::string digest;
            if (!model_digest(scalar[state]->ledger.models[ordinal], &digest)
                || digest != impl.scalar_source_digests[state][ordinal]) {
                return false;
            }
        }
    }
    const std::size_t ordinal = impl.models.size();
    const ledger::ModelView &target = b->ledger.models[ordinal];
    const ledger::LedgerView b_prefix{ordinal + 1U, b->ledger.models};
    const ledger::LedgerView v_prefix{ordinal + 1U, v->ledger.models};
    const selector::Input selector_input{b_prefix, v_prefix,
        target.left_endpoint, target.right_endpoint, target.order,
        kJetCount, impl.b_at_zero.data()};
    return selector::evaluate_prepared_candidate_decomposition(
        selector_input, panel_count, thread_count, target_degree, target_jet,
        output, result, observation);
}

bool diagnose_next_selector_candidate_observable(
    const Input &input, const Context *context, std::size_t panel_count,
    std::size_t thread_count, unsigned target_degree, std::size_t target_jet,
    selector::Output *output, selector::Result *result,
    selector::CoefficientDecompositionObservation *observation,
    selector::CandidateProgressObserver progress, void *progress_context) {
    if (result == nullptr) return false;
    *result = selector::Result{};
    if (context == nullptr || output == nullptr || observation == nullptr
        || progress == nullptr || !context->impl_->initialized
        || context->impl_->terminal_failure) {
        return false;
    }
    const auto &impl = *context->impl_;
    std::array<const finite::TaggedLedgerView *, kScalarStateCount> scalar{};
    if (!valid_inventory(input, &scalar)
        || input.scalar_ledger_identities != impl.scalar_ids
        || input.h2_ledger_identity != impl.h2_id) return false;
    const auto *b = scalar[0];
    const auto *v = scalar[1];
    if (b->ledger.model_count != impl.models.size() + 1U) return false;
    for (std::size_t state = 1U; state < kScalarStateCount; ++state) {
        if (scalar[state]->ledger.model_count != b->ledger.model_count)
            return false;
    }
    for (std::size_t ordinal = 0U; ordinal < impl.models.size(); ++ordinal) {
        for (std::size_t state = 0U; state < kScalarStateCount; ++state) {
            std::string digest;
            if (!model_digest(scalar[state]->ledger.models[ordinal], &digest)
                || digest != impl.scalar_source_digests[state][ordinal]) {
                return false;
            }
        }
    }
    const std::size_t ordinal = impl.models.size();
    const ledger::ModelView &target = b->ledger.models[ordinal];
    const ledger::LedgerView b_prefix{ordinal + 1U, b->ledger.models};
    const ledger::LedgerView v_prefix{ordinal + 1U, v->ledger.models};
    const selector::Input selector_input{b_prefix, v_prefix,
        target.left_endpoint, target.right_endpoint, target.order,
        kJetCount, impl.b_at_zero.data()};
    return selector::evaluate_prepared_candidate_decomposition_observable(
        selector_input, panel_count, thread_count, target_degree, target_jet,
        output, result, observation, progress, progress_context);
}

bool diagnose_next_selector_candidate_term_radius_observed(
    const Input &input, const Context *context, std::size_t panel_count,
    std::size_t thread_count, unsigned target_degree, std::size_t target_jet,
    selector::Output *output, selector::Result *result,
    selector::CoefficientDecompositionObservation *predecessor_observation,
    p8n::Observation *observation, p8p::ProgressCallback progress,
    void *progress_context, p8p::TimingObservation *timing) {
    if (result == nullptr) return false;
    *result = selector::Result{};
    if (context == nullptr || output == nullptr
        || predecessor_observation == nullptr || observation == nullptr
        || timing == nullptr || !context->impl_->initialized
        || context->impl_->terminal_failure) return false;
    const auto &impl = *context->impl_;
    std::array<const finite::TaggedLedgerView *, kScalarStateCount> scalar{};
    if (!valid_inventory(input, &scalar)
        || input.scalar_ledger_identities != impl.scalar_ids
        || input.h2_ledger_identity != impl.h2_id) return false;
    const auto *b = scalar[0];
    const auto *v = scalar[1];
    if (b->ledger.model_count != impl.models.size() + 1U) return false;
    for (std::size_t state = 1U; state < kScalarStateCount; ++state) {
        if (scalar[state]->ledger.model_count != b->ledger.model_count)
            return false;
    }
    for (std::size_t ordinal = 0U; ordinal < impl.models.size(); ++ordinal) {
        for (std::size_t state = 0U; state < kScalarStateCount; ++state) {
            std::string digest;
            if (!model_digest(scalar[state]->ledger.models[ordinal], &digest)
                || digest != impl.scalar_source_digests[state][ordinal])
                return false;
        }
    }
    const std::size_t ordinal = impl.models.size();
    const ledger::ModelView &target = b->ledger.models[ordinal];
    const ledger::LedgerView b_prefix{ordinal + 1U, b->ledger.models};
    const ledger::LedgerView v_prefix{ordinal + 1U, v->ledger.models};
    const selector::Input selector_input{b_prefix, v_prefix,
        target.left_endpoint, target.right_endpoint, target.order,
        kJetCount, impl.b_at_zero.data()};
    return p8p::evaluate_prepared_candidate_observed(
        selector_input, panel_count, thread_count, target_degree, target_jet,
        output, result, predecessor_observation, observation, progress,
        progress_context, timing);
}

namespace {

bool append_diagnostic(std::string *output, const std::string &value) {
    if (output == nullptr
        || output->size() + value.size() > kMaximumDiagnosticRecordBytes)
        return false;
    output->append(value);
    return true;
}

bool append_json_string(std::string *output, const std::string &value) {
    if (value.size() > kMaximumDiagnosticStringBytes
        || !append_diagnostic(output, "\"")) return false;
    constexpr char hex[] = "0123456789abcdef";
    for (const unsigned char byte : value) {
        if (byte == '"' || byte == '\\') {
            std::string escaped{"\\"};
            escaped.push_back(static_cast<char>(byte));
            if (!append_diagnostic(output, escaped)) return false;
        } else if (byte < 0x20U) {
            std::string escaped = "\\u00";
            escaped.push_back(hex[(byte >> 4U) & 0x0fU]);
            escaped.push_back(hex[byte & 0x0fU]);
            if (!append_diagnostic(output, escaped)) return false;
        } else if (!append_diagnostic(
                       output, std::string(1U, static_cast<char>(byte)))) {
            return false;
        }
    }
    return append_diagnostic(output, "\"");
}

const char *boolean_text(bool value) { return value ? "true" : "false"; }

bool valid_observation(const selector::WidthObservation &observation,
                       std::size_t expected_index) {
    if (!observation.evaluated || observation.candidate_index != expected_index
        || observation.panel_count != selector::kUPanelCandidates[expected_index]
        || observation.width_checks == 0U
        || observation.worst_kind == selector::WidthTermKind::none
        || observation.worst_radius.empty()
        || observation.worst_threshold.empty()
        || observation.worst_ratio.empty()) return false;
    if (!observation.passed
        && (observation.first_failed_kind == selector::WidthTermKind::none
            || observation.first_failed_radius.empty()
            || observation.first_failed_threshold.empty()
            || observation.first_failed_ratio.empty())) return false;
    const std::array<const std::string *, 6U> strings = {
        &observation.first_failed_radius,
        &observation.first_failed_threshold,
        &observation.first_failed_ratio,
        &observation.worst_radius,
        &observation.worst_threshold,
        &observation.worst_ratio,
    };
    for (const auto *value : strings)
        if (value->size() > kMaximumDiagnosticStringBytes) return false;
    return true;
}

bool append_observation(std::string *output,
                        const selector::WidthObservation &observation) {
    return append_diagnostic(output, "{\"candidate_index\":")
        && append_diagnostic(output,
                             std::to_string(observation.candidate_index))
        && append_diagnostic(output, ",\"first_failed_degree\":")
        && append_diagnostic(output,
                             std::to_string(observation.first_failed_degree))
        && append_diagnostic(output, ",\"first_failed_jet\":")
        && append_diagnostic(output,
                             std::to_string(observation.first_failed_jet))
        && append_diagnostic(output, ",\"first_failed_kind\":")
        && append_json_string(
            output, selector::width_term_kind_name(
                        observation.first_failed_kind))
        && append_diagnostic(output, ",\"first_failed_radius\":")
        && append_json_string(output, observation.first_failed_radius)
        && append_diagnostic(output, ",\"first_failed_ratio\":")
        && append_json_string(output, observation.first_failed_ratio)
        && append_diagnostic(output, ",\"first_failed_threshold\":")
        && append_json_string(output, observation.first_failed_threshold)
        && append_diagnostic(output, ",\"panel_count\":")
        && append_diagnostic(output, std::to_string(observation.panel_count))
        && append_diagnostic(output, ",\"passed\":")
        && append_diagnostic(output, boolean_text(observation.passed))
        && append_diagnostic(output, ",\"width_checks\":")
        && append_diagnostic(output, std::to_string(observation.width_checks))
        && append_diagnostic(output, ",\"worst_degree\":")
        && append_diagnostic(output, std::to_string(observation.worst_degree))
        && append_diagnostic(output, ",\"worst_jet\":")
        && append_diagnostic(output, std::to_string(observation.worst_jet))
        && append_diagnostic(output, ",\"worst_kind\":")
        && append_json_string(
            output, selector::width_term_kind_name(observation.worst_kind))
        && append_diagnostic(output, ",\"worst_radius\":")
        && append_json_string(output, observation.worst_radius)
        && append_diagnostic(output, ",\"worst_ratio\":")
        && append_json_string(output, observation.worst_ratio)
        && append_diagnostic(output, ",\"worst_ratio_exceeds_one\":")
        && append_diagnostic(
            output, boolean_text(observation.worst_ratio_exceeds_one))
        && append_diagnostic(output, ",\"worst_threshold\":")
        && append_json_string(output, observation.worst_threshold)
        && append_diagnostic(output, "}");
}

}  // namespace

bool serialize_diagnostics(const ParentDiagnostics &diagnostics,
                           std::string *canonical) {
    if (canonical == nullptr || !diagnostics.present
        || !diagnostics.observation_only
        || !diagnostics.parent_decision_unchanged
        || !diagnostics.persistence_bounded
        || diagnostics.selector_call_ordinal == 0U
        || diagnostics.width.observations == 0U
        || diagnostics.width.observations > selector::kUPanelCandidateCount
        || !diagnostics.width.observation_only
        || !diagnostics.width.fixed_candidate_schedule
        || !diagnostics.width.thresholds_unchanged
        || !diagnostics.width.reduction_order_unchanged) return false;
    for (std::size_t index = 0U;
         index < diagnostics.width.observations; ++index)
        if (!valid_observation(diagnostics.width.candidates[index], index))
            return false;
    const auto &last = diagnostics.width.candidates[
        diagnostics.width.observations - 1U];
    if (diagnostics.selector_passed != last.passed
        || (diagnostics.selector_passed
            && (diagnostics.selector_detail != selector::FailureDetail::none
                || diagnostics.width.all_observed_candidates_failed))
        || (!diagnostics.selector_passed
            && diagnostics.selector_detail
                == selector::FailureDetail::volterra_convolution_or_u_refinement_exhaustion
            && !diagnostics.width.all_observed_candidates_failed)) return false;
    std::string output;
    output.reserve(16384U);
    if (!append_diagnostic(&output,
            "{\"all_observed_candidates_failed\":")
        || !append_diagnostic(
            &output,
            boolean_text(diagnostics.width.all_observed_candidates_failed))
        || !append_diagnostic(&output, ",\"fixed_candidate_schedule\":true")
        || !append_diagnostic(&output, ",\"observation_only\":true")
        || !append_diagnostic(&output, ",\"observations\":[")) return false;
    for (std::size_t index = 0U;
         index < diagnostics.width.observations; ++index) {
        if (index != 0U && !append_diagnostic(&output, ",")) return false;
        if (!append_observation(&output,
                                diagnostics.width.candidates[index]))
            return false;
    }
    if (!append_diagnostic(&output,
            "],\"parent_decision_unchanged\":true,"
            "\"persistence_bounded\":true,"
            "\"reduction_order_unchanged\":true,\"schema\":")
        || !append_json_string(
            &output, "nhm2.g2h_e_s5.c08_h2_p8b_parent_diagnostic.v1")
        || !append_diagnostic(&output, ",\"selector_call_ordinal\":")
        || !append_diagnostic(
            &output, std::to_string(diagnostics.selector_call_ordinal))
        || !append_diagnostic(&output, ",\"selector_detail\":")
        || !append_json_string(
            &output, selector::failure_detail_name(
                         diagnostics.selector_detail))
        || !append_diagnostic(&output, ",\"selector_passed\":")
        || !append_diagnostic(&output,
                              boolean_text(diagnostics.selector_passed))
        || !append_diagnostic(&output, ",\"source_ordinal\":")
        || !append_diagnostic(&output,
                              std::to_string(diagnostics.source_ordinal))
        || !append_diagnostic(&output, ",\"thresholds_unchanged\":true}"))
        return false;
    if (output.size() > kMaximumDiagnosticRecordBytes) return false;
    *canonical = std::move(output);
    return true;
}

ledger::LedgerView published(const Context &context) {
    if (!context.impl_->initialized || context.impl_->publications.empty())
        return {};
    return context.impl_->publications.back()->view();
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::input_or_output: return "C08_H2_INPUT_OR_OUTPUT";
    case FailureDetail::scalar_inventory_or_prefix: return "C08_H2_SCALAR_INVENTORY_OR_PREFIX";
    case FailureDetail::c08_010_selector: return "C08-010_VOLTERRA_CONVOLUTION_OR_U_REFINEMENT_EXHAUSTION";
    case FailureDetail::centered_to_left_translation: return "C08_H2_CENTERED_TO_LEFT_TRANSLATION";
    case FailureDetail::ledger_validation: return "C08_H2_LEDGER_VALIDATION";
    case FailureDetail::fixed_resource: return "C08_H2_FIXED_RESOURCE";
    case FailureDetail::terminal_failure_already_recorded: return "C08_H2_TERMINAL_FAILURE_ALREADY_RECORDED";
    }
    return "C08_H2_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_h2_ledger_v1
