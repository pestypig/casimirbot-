#include "mini_boson_star_primary_c08_analytic_factor_derivative_ledgers_v1.hpp"

#include "mini_boson_star_sha256_v1.hpp"

#include <flint/flint.h>

#include <set>
#include <string>
#include <utility>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_analytic_factor_derivative_ledgers_v1 {
namespace {

struct Publication {
    std::vector<ledger::ModelView> views;
    Publication(const std::vector<std::unique_ptr<derivative::Output>> &models,
                derivative::Derivative selected) {
        views.reserve(models.size());
        for (const auto &model : models) views.push_back(model->view(selected));
    }
    ledger::LedgerView view() const { return {views.size(), views.data()}; }
};

bool finite(arb_srcptr value) { return value != nullptr && arb_is_finite(value); }

bool append_arb(std::string &bytes, arb_srcptr value) {
    if (!finite(value)) return false;
    char *dump = arb_dump_str(value);
    if (dump == nullptr) return false;
    bytes.append(dump); bytes.push_back('\n'); flint_free(dump); return true;
}

bool model_digest(const ledger::ModelView &model, std::string *digest) {
    if (digest == nullptr || model.coefficients == nullptr
        || model.remainders == nullptr) return false;
    std::string bytes = "nhm2-g2h-e-s5/c08-analytic-derivative-source/v1\n";
    bytes += std::to_string(model.ordinal) + "\n";
    bytes += std::to_string(static_cast<unsigned>(model.kind)) + "\n";
    bytes += std::to_string(model.order) + "\n";
    bytes += std::to_string(model.coefficient_count) + "\n";
    bytes += std::to_string(model.remainder_count) + "\n";
    if (!append_arb(bytes, model.left_endpoint)
        || !append_arb(bytes, model.right_endpoint)
        || !append_arb(bytes, model.expansion_center)) return false;
    for (std::size_t i = 0U; i < model.coefficient_count; ++i)
        if (!append_arb(bytes, model.coefficients + i)) return false;
    for (std::size_t i = 0U; i < model.remainder_count; ++i)
        if (!append_arb(bytes, model.remainders + i)) return false;
    *digest = sha256_v1::text(bytes); return true;
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
    ledger::Output output; ledger::Result result{};
    arb_t zero, one; arb_init(zero); arb_init(one); arb_zero(zero); arb_one(one);
    const ledger::Input input{view, view.models[0].left_endpoint,
        view.models[view.model_count - 1U].right_endpoint, zero, one};
    const bool accepted = ledger::evaluate(input, &output, &result)
        && result.accepted && result.models_validated == view.model_count;
    arb_clear(one); arb_clear(zero); return accepted;
}

bool valid_inventory(const Input &input) {
    std::set<std::uint32_t> source_ids, derivative_ids;
    for (auto id : input.source_identities)
        if (!source_ids.insert(id).second) return false;
    for (auto id : input.derivative_identities)
        if (!derivative_ids.insert(id).second || source_ids.count(id)) return false;
    const std::size_t count = input.source_ledgers[0].model_count;
    if (count == 0U) return false;
    for (const auto &view : input.source_ledgers)
        if (view.model_count != count || !valid_ledger(view)) return false;
    for (std::size_t ordinal = 0U; ordinal < count; ++ordinal)
        for (std::size_t source = 1U; source < kSourceCount; ++source)
            if (!same_geometry(input.source_ledgers[0].models[ordinal],
                               input.source_ledgers[source].models[ordinal]))
                return false;
    return true;
}

bool validate_with_pending(
    const std::vector<std::unique_ptr<derivative::Output>> &accepted,
    const derivative::Output &pending, derivative::Derivative selected) {
    std::vector<ledger::ModelView> views; views.reserve(accepted.size() + 1U);
    for (const auto &model : accepted) views.push_back(model->view(selected));
    views.push_back(pending.view(selected));
    return valid_ledger({views.size(), views.data()});
}

}  // namespace

struct Context::Impl {
    std::array<std::uint32_t, kSourceCount> source_ids{};
    std::array<std::uint32_t, kDerivativeCount> derivative_ids{};
    analytic::Chart chart = analytic::Chart::positive;
    arb_t kappa, theta2, eta;
    bool eta_present = false;
    analytic::Output parameters;
    std::vector<std::unique_ptr<derivative::Output>> models;
    std::array<std::vector<std::unique_ptr<Publication>>, kDerivativeCount> publications;
    std::array<std::vector<std::string>, kSourceCount> source_digests;
    bool initialized = false;
    bool terminal_failure = false;
    FailureDetail terminal_detail = FailureDetail::none;
    Impl(){arb_init(kappa);arb_init(theta2);arb_init(eta);}
    ~Impl(){arb_clear(eta);arb_clear(theta2);arb_clear(kappa);}
    void publish(){for(std::size_t i=0;i<kDerivativeCount;++i)publications[i].push_back(std::make_unique<Publication>(models,static_cast<derivative::Derivative>(i)));}
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
    if (!valid_inventory(input)) { result->detail=FailureDetail::source_inventory_or_prefix; return false; }
    if (!initializing && (input.source_identities!=impl.source_ids
        || input.derivative_identities!=impl.derivative_ids
        || !same_parameters(input,impl))) { result->detail=FailureDetail::parameter_identity_or_prefix; return false; }
    if (impl.terminal_failure) { result->detail=FailureDetail::terminal_failure_already_recorded; result->first_failure_terminal=true; result->derivative_models_before=impl.models.size(); result->derivative_models_after=impl.models.size(); return false; }
    if (input.source_ledgers[0].model_count < impl.models.size()) { result->detail=FailureDetail::source_inventory_or_prefix; return false; }
    for(std::size_t ordinal=0;ordinal<impl.models.size();++ordinal)
        for(std::size_t source=0;source<kSourceCount;++source){std::string digest;if(!model_digest(input.source_ledgers[source].models[ordinal],&digest)||digest!=impl.source_digests[source][ordinal]){result->detail=FailureDetail::source_inventory_or_prefix;return false;}++result->source_prefix_digests_checked;}
    const std::size_t before=impl.models.size(); result->source_models_before=before; result->derivative_models_before=before;
    for(std::size_t ordinal=before;ordinal<input.source_ledgers[0].model_count;++ordinal){
        if(ordinal>=ledger::kMaximumLedgerModels){impl.terminal_failure=true;impl.terminal_detail=FailureDetail::fixed_resource;impl.publish();result->detail=impl.terminal_detail;result->first_failure_terminal=true;result->derivative_models_after=impl.models.size();return false;}
        auto pending=std::make_unique<derivative::Output>(); derivative::Result model_result{};
        const derivative::Input model_input{input.source_ledgers[0].models[ordinal],input.source_ledgers[1].models[ordinal],input.source_ledgers[2].models[ordinal],&impl.parameters};
        ++result->derivative_model_calls;
        if(!derivative::evaluate(model_input,pending.get(),&model_result)){impl.terminal_failure=true;impl.terminal_detail=FailureDetail::derivative_model;impl.publish();result->detail=impl.terminal_detail;result->first_failure_terminal=true;result->derivative_models_after=impl.models.size();return false;}
        bool valid=true;for(std::size_t selected=0;selected<kDerivativeCount&&valid;++selected)valid=validate_with_pending(impl.models,*pending,static_cast<derivative::Derivative>(selected));
        if(!valid){impl.terminal_failure=true;impl.terminal_detail=FailureDetail::ledger_validation;impl.publish();result->detail=impl.terminal_detail;result->first_failure_terminal=true;result->derivative_models_after=impl.models.size();return false;}
        std::array<std::string,kSourceCount> digests;for(std::size_t source=0;source<kSourceCount;++source)if(!model_digest(input.source_ledgers[source].models[ordinal],&digests[source])){impl.terminal_failure=true;impl.terminal_detail=FailureDetail::source_inventory_or_prefix;result->detail=impl.terminal_detail;result->first_failure_terminal=true;return false;}
        impl.models.push_back(std::move(pending));for(std::size_t source=0;source<kSourceCount;++source)impl.source_digests[source].push_back(std::move(digests[source]));++result->model_triples_appended;
    }
    impl.publish();result->accepted=true;result->source_models_after=input.source_ledgers[0].model_count;result->derivative_models_after=impl.models.size();result->exact_derivative_identities=true;result->stable_prior_publication=true;return true;
}
}  // namespace

bool initialize(const Input &input, Context *context, Result *result){
    if (result == nullptr) return false;
    *result = Result{};
    if (context == nullptr || context->impl_->initialized) {
        result->detail = FailureDetail::input_or_output;
        return false;
    }
    if (!valid_inventory(input)) {
        result->detail = FailureDetail::source_inventory_or_prefix;
        return false;
    }
    auto &impl = *context->impl_;
    analytic::Result parameter_result{};
    if (!analytic::evaluate(input.parameters, &impl.parameters,
                            &parameter_result)) {
        result->detail = FailureDetail::parameter_identity_or_prefix;
        return false;
    }
    impl.source_ids = input.source_identities;
    impl.derivative_ids = input.derivative_identities;
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
ledger::LedgerView published(const Context &context,
                             derivative::Derivative selected) {
    const std::size_t i = static_cast<std::size_t>(selected);
    if (!context.impl_->initialized || i >= kDerivativeCount
        || context.impl_->publications[i].empty()) return {};
    return context.impl_->publications[i].back()->view();
}
const char *failure_detail_name(FailureDetail detail){switch(detail){case FailureDetail::none:return "NONE";case FailureDetail::input_or_output:return "C08_DERIVATIVE_LEDGER_INPUT_OR_OUTPUT";case FailureDetail::source_inventory_or_prefix:return "C08_DERIVATIVE_LEDGER_SOURCE_INVENTORY_OR_PREFIX";case FailureDetail::parameter_identity_or_prefix:return "C08_DERIVATIVE_LEDGER_PARAMETER_IDENTITY_OR_PREFIX";case FailureDetail::derivative_model:return "C08_DERIVATIVE_LEDGER_MODEL";case FailureDetail::ledger_validation:return "C08_DERIVATIVE_LEDGER_VALIDATION";case FailureDetail::fixed_resource:return "C08_DERIVATIVE_LEDGER_FIXED_RESOURCE";case FailureDetail::terminal_failure_already_recorded:return "C08_DERIVATIVE_LEDGER_TERMINAL_FAILURE_ALREADY_RECORDED";}return "C08_DERIVATIVE_LEDGER_UNKNOWN";}
}  // namespace nhm2::g2h_e_s5::primary_c08_analytic_factor_derivative_ledgers_v1
