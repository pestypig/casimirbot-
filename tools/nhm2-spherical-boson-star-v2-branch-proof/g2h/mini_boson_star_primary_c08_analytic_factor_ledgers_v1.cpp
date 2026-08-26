#include "mini_boson_star_primary_c08_analytic_factor_ledgers_v1.hpp"

#include "mini_boson_star_sha256_v1.hpp"

#include <flint/flint.h>

#include <array>
#include <memory>
#include <set>
#include <string>
#include <utility>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_analytic_factor_ledgers_v1 {
namespace {

struct Publication {
    std::vector<ledger::ModelView> views;
    Publication(const std::vector<std::unique_ptr<factor::Output>> &models,
                factor::Factor selected) {
        views.reserve(models.size());
        for (const auto &model : models) views.push_back(model->view(selected));
    }
    ledger::LedgerView view() const { return {views.size(), views.data()}; }
};

bool finite(arb_srcptr value) {
    return value != nullptr && arb_is_finite(value);
}

bool append_arb(std::string &bytes, arb_srcptr value) {
    if (!finite(value)) return false;
    char *dump = arb_dump_str(value);
    if (dump == nullptr) return false;
    bytes.append(dump); bytes.push_back('\n'); flint_free(dump);
    return true;
}

bool model_digest(const ledger::ModelView &model, std::string *digest) {
    if (digest == nullptr || model.coefficients == nullptr
        || model.remainders == nullptr)
        return false;
    std::string bytes = "nhm2-g2h-e-s5/c08-analytic-factor-source/v1\n";
    bytes += std::to_string(model.ordinal) + "\n";
    bytes += std::to_string(static_cast<unsigned>(model.kind)) + "\n";
    bytes += std::to_string(model.order) + "\n";
    bytes += std::to_string(model.coefficient_count) + "\n";
    bytes += std::to_string(model.remainder_count) + "\n";
    if (!append_arb(bytes, model.left_endpoint)
        || !append_arb(bytes, model.right_endpoint)
        || !append_arb(bytes, model.expansion_center)) return false;
    for (std::size_t index = 0U; index < model.coefficient_count; ++index)
        if (!append_arb(bytes, model.coefficients + index)) return false;
    for (std::size_t index = 0U; index < model.remainder_count; ++index)
        if (!append_arb(bytes, model.remainders + index)) return false;
    *digest = sha256_v1::text(bytes);
    return true;
}

const finite::TaggedLedgerView *find_tag(const Input &input,
                                         std::uint32_t identity) {
    if (input.scalar_ledgers.ledgers == nullptr) return nullptr;
    for (std::size_t index = 0U;
         index < input.scalar_ledgers.ledger_count; ++index)
        if (input.scalar_ledgers.ledgers[index].identity == identity)
            return input.scalar_ledgers.ledgers + index;
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

bool valid_ledger(const ledger::LedgerView &view) {
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
    if (scalar == nullptr || input.scalar_ledgers.ledgers == nullptr
        || input.scalar_ledgers.ledger_count != kScalarStateCount)
        return false;
    std::set<std::uint32_t> scalar_ids;
    for (const auto identity : input.scalar_ledger_identities)
        if (!scalar_ids.insert(identity).second) return false;
    std::set<std::uint32_t> factor_ids;
    for (const auto identity : input.factor_ledger_identities)
        if (!factor_ids.insert(identity).second
            || scalar_ids.count(identity) != 0U) return false;
    std::set<std::uint32_t> supplied;
    std::size_t model_count = 0U;
    for (std::size_t index = 0U; index < kScalarStateCount; ++index) {
        const auto &tagged = input.scalar_ledgers.ledgers[index];
        if (!supplied.insert(tagged.identity).second
            || scalar_ids.count(tagged.identity) == 0U
            || tagged.ledger.models == nullptr
            || tagged.ledger.model_count == 0U) return false;
        if (index == 0U) model_count = tagged.ledger.model_count;
        else if (tagged.ledger.model_count != model_count) return false;
    }
    if (supplied != scalar_ids) return false;
    for (std::size_t state = 0U; state < kScalarStateCount; ++state) {
        (*scalar)[state] = find_tag(input, input.scalar_ledger_identities[state]);
        if ((*scalar)[state] == nullptr
            || !valid_ledger((*scalar)[state]->ledger)) return false;
    }
    for (std::size_t ordinal = 0U; ordinal < model_count; ++ordinal) {
        const auto &reference = (*scalar)[0]->ledger.models[ordinal];
        for (std::size_t state = 1U; state < kScalarStateCount; ++state)
            if (!same_geometry(reference,
                               (*scalar)[state]->ledger.models[ordinal]))
                return false;
    }
    return true;
}

bool validate_with_pending(
    const std::vector<std::unique_ptr<factor::Output>> &accepted,
    const factor::Output &pending, factor::Factor selected) {
    std::vector<ledger::ModelView> views;
    views.reserve(accepted.size() + 1U);
    for (const auto &model : accepted) views.push_back(model->view(selected));
    views.push_back(pending.view(selected));
    ledger::Output output;
    ledger::Result result{};
    arb_t zero, one;
    arb_init(zero); arb_init(one); arb_zero(zero); arb_one(one);
    const ledger::Input input{{views.size(), views.data()},
                              views.front().left_endpoint,
                              views.back().right_endpoint, zero, one};
    const bool valid = ledger::evaluate(input, &output, &result)
        && result.accepted && result.models_validated == views.size();
    arb_clear(one); arb_clear(zero);
    return valid;
}

}  // namespace

struct Context::Impl {
    std::array<std::uint32_t, kScalarStateCount> scalar_ids{};
    std::array<std::uint32_t, kFactorCount> factor_ids{};
    analytic::Chart chart = analytic::Chart::positive;
    arb_t kappa, theta2, eta;
    bool eta_present = false;
    analytic::Output parameters;
    std::vector<std::unique_ptr<factor::Output>> models;
    std::array<std::vector<std::unique_ptr<Publication>>, kFactorCount>
        publications;
    std::array<std::vector<std::string>, kScalarStateCount> source_digests;
    bool initialized = false;
    bool terminal_failure = false;
    FailureDetail terminal_detail = FailureDetail::none;

    Impl() { arb_init(kappa); arb_init(theta2); arb_init(eta); }
    ~Impl() { arb_clear(eta); arb_clear(theta2); arb_clear(kappa); }
    void publish() {
        for (std::size_t selected = 0U; selected < kFactorCount; ++selected)
            publications[selected].push_back(std::make_unique<Publication>(
                models, static_cast<factor::Factor>(selected)));
    }
};

Context::Context() : impl_(std::make_unique<Impl>()) {}
Context::~Context() = default;

namespace {

bool same_parameters(const Input &input, const Context::Impl &impl) {
    const bool eta_present = input.parameters.eta != nullptr;
    return input.parameters.chart == impl.chart
        && finite(input.parameters.kappa) && finite(input.parameters.theta2)
        && arb_equal(input.parameters.kappa, impl.kappa)
        && arb_equal(input.parameters.theta2, impl.theta2)
        && eta_present == impl.eta_present
        && (!eta_present || (finite(input.parameters.eta)
                             && arb_equal(input.parameters.eta, impl.eta)));
}

bool extend_impl(const Input &input, Context::Impl &impl, Result *result,
                 bool initializing) {
    std::array<const finite::TaggedLedgerView *, kScalarStateCount> scalar{};
    if (!valid_inventory(input, &scalar)) {
        *result = Result{};
        result->detail = FailureDetail::scalar_inventory_or_prefix;
        return false;
    }
    if (!initializing
        && (input.scalar_ledger_identities != impl.scalar_ids
            || input.factor_ledger_identities != impl.factor_ids
            || !same_parameters(input, impl))) {
        *result = Result{};
        result->detail = FailureDetail::parameter_identity_or_prefix;
        return false;
    }
    if (impl.terminal_failure) {
        *result = Result{};
        result->detail = FailureDetail::terminal_failure_already_recorded;
        result->first_failure_terminal = true;
        result->factor_models_before = impl.models.size();
        result->factor_models_after = impl.models.size();
        return false;
    }
    if (scalar[0]->ledger.model_count < impl.models.size()) {
        *result = Result{};
        result->detail = FailureDetail::scalar_inventory_or_prefix;
        return false;
    }
    for (std::size_t ordinal = 0U; ordinal < impl.models.size(); ++ordinal) {
        for (std::size_t state = 0U; state < kScalarStateCount; ++state) {
            std::string digest;
            if (!model_digest(scalar[state]->ledger.models[ordinal], &digest)
                || digest != impl.source_digests[state][ordinal]) {
                *result = Result{};
                result->detail = FailureDetail::scalar_inventory_or_prefix;
                return false;
            }
            ++result->source_prefix_digests_checked;
        }
    }
    const std::size_t before = impl.models.size();
    result->source_models_before = before;
    result->factor_models_before = before;
    for (std::size_t ordinal = before;
         ordinal < scalar[0]->ledger.model_count; ++ordinal) {
        if (ordinal >= ledger::kMaximumLedgerModels) {
            impl.terminal_failure = true;
            impl.terminal_detail = FailureDetail::fixed_resource;
            impl.publish();
            result->detail = impl.terminal_detail;
            result->first_failure_terminal = true;
            result->factor_models_after = impl.models.size();
            return false;
        }
        const auto &geometry = scalar[0]->ledger.models[ordinal];
        auto pending = std::make_unique<factor::Output>();
        factor::Result model_result{};
        const factor::Input model_input{ordinal, geometry.kind,
            geometry.left_endpoint, geometry.right_endpoint, geometry.order,
            &impl.parameters};
        ++result->analytic_model_calls;
        if (!factor::evaluate(model_input, pending.get(), &model_result)) {
            impl.terminal_failure = true;
            impl.terminal_detail = FailureDetail::analytic_factor_model;
            impl.publish(); result->detail = impl.terminal_detail;
            result->first_failure_terminal = true;
            result->factor_models_after = impl.models.size();
            return false;
        }
        result->coefficient_jets_written +=
            model_result.coefficient_jets_written;
        result->remainder_jets_written += model_result.remainder_jets_written;
        bool ledgers_valid = true;
        for (std::size_t selected = 0U;
             selected < kFactorCount && ledgers_valid; ++selected)
            ledgers_valid = validate_with_pending(
                impl.models, *pending, static_cast<factor::Factor>(selected));
        if (!ledgers_valid) {
            impl.terminal_failure = true;
            impl.terminal_detail = FailureDetail::ledger_validation;
            impl.publish(); result->detail = impl.terminal_detail;
            result->first_failure_terminal = true;
            result->factor_models_after = impl.models.size();
            return false;
        }
        std::array<std::string, kScalarStateCount> digests;
        for (std::size_t state = 0U; state < kScalarStateCount; ++state) {
            if (!model_digest(scalar[state]->ledger.models[ordinal],
                              &digests[state])) {
                impl.terminal_failure = true;
                impl.terminal_detail = FailureDetail::scalar_inventory_or_prefix;
                result->detail = impl.terminal_detail;
                result->first_failure_terminal = true;
                return false;
            }
        }
        impl.models.push_back(std::move(pending));
        for (std::size_t state = 0U; state < kScalarStateCount; ++state)
            impl.source_digests[state].push_back(std::move(digests[state]));
        ++result->model_triples_appended;
    }
    impl.publish();
    result->accepted = true; result->detail = FailureDetail::none;
    result->source_models_after = scalar[0]->ledger.model_count;
    result->factor_models_after = impl.models.size();
    result->exact_factor_identities = true;
    result->stable_prior_publication = true;
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
    auto &impl = *context->impl_;
    analytic::Result parameter_result{};
    if (!analytic::evaluate(input.parameters, &impl.parameters,
                            &parameter_result)) {
        result->detail = FailureDetail::parameter_identity_or_prefix;
        return false;
    }
    impl.scalar_ids = input.scalar_ledger_identities;
    impl.factor_ids = input.factor_ledger_identities;
    impl.chart = input.parameters.chart;
    arb_set(impl.kappa, input.parameters.kappa);
    arb_set(impl.theta2, input.parameters.theta2);
    impl.eta_present = input.parameters.eta != nullptr;
    if (impl.eta_present) arb_set(impl.eta, input.parameters.eta);
    else arb_zero(impl.eta);
    if (!extend_impl(input, impl, result, true)) return false;
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
    return extend_impl(input, *context->impl_, result, false);
}

ledger::LedgerView published(const Context &context, factor::Factor selected) {
    const std::size_t index = static_cast<std::size_t>(selected);
    if (!context.impl_->initialized || index >= kFactorCount
        || context.impl_->publications[index].empty()) return {};
    return context.impl_->publications[index].back()->view();
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::input_or_output: return "C08_FACTOR_LEDGER_INPUT_OR_OUTPUT";
    case FailureDetail::scalar_inventory_or_prefix: return "C08_FACTOR_LEDGER_SCALAR_INVENTORY_OR_PREFIX";
    case FailureDetail::parameter_identity_or_prefix: return "C08_FACTOR_LEDGER_PARAMETER_IDENTITY_OR_PREFIX";
    case FailureDetail::analytic_factor_model: return "C08_FACTOR_LEDGER_MODEL";
    case FailureDetail::ledger_validation: return "C08_FACTOR_LEDGER_VALIDATION";
    case FailureDetail::fixed_resource: return "C08_FACTOR_LEDGER_FIXED_RESOURCE";
    case FailureDetail::terminal_failure_already_recorded: return "C08_FACTOR_LEDGER_TERMINAL_FAILURE_ALREADY_RECORDED";
    }
    return "C08_FACTOR_LEDGER_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_analytic_factor_ledgers_v1
