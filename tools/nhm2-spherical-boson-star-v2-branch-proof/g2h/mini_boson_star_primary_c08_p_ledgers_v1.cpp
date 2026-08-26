#include "mini_boson_star_primary_c08_p_ledgers_v1.hpp"

#include "mini_boson_star_sha256_v1.hpp"

#include <flint/flint.h>

#include <array>
#include <memory>
#include <set>
#include <string>
#include <utility>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_p_ledgers_v1 {
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
    arb_ptr coefficient(unsigned degree, std::size_t jet_index) {
        return coefficients.data()
            + static_cast<std::size_t>(degree) * kJetCount + jet_index;
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

bool finite(arb_srcptr value) {
    return value != nullptr && arb_is_finite(value);
}

bool upper_magnitude(arb_t output, arb_srcptr value) {
    if (!finite(value)) return false;
    arb_t absolute;
    arf_t upper;
    arb_init(absolute); arf_init(upper); arb_abs(absolute, value);
    arb_get_ubound_arf(upper, absolute, kPrecisionBits);
    arb_set_arf(output, upper);
    arf_clear(upper); arb_clear(absolute);
    return arb_is_finite(output) && arb_is_nonnegative(output);
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
    std::string bytes = "nhm2-g2h-e-s5/c08-p-source-model/v1\n";
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
    if (scalar == nullptr
        || input.scalar_ledgers.ledger_count != kScalarStateCount
        || input.scalar_ledgers.ledgers == nullptr
        || input.p_ledger_identity == input.pprime_ledger_identity)
        return false;
    std::set<std::uint32_t> expected;
    for (const auto identity : input.scalar_ledger_identities)
        if (!expected.insert(identity).second) return false;
    if (expected.count(input.p_ledger_identity) != 0U
        || expected.count(input.pprime_ledger_identity) != 0U)
        return false;
    std::set<std::uint32_t> supplied;
    std::size_t model_count = 0U;
    for (std::size_t index = 0U; index < kScalarStateCount; ++index) {
        const auto &tagged = input.scalar_ledgers.ledgers[index];
        if (!supplied.insert(tagged.identity).second
            || expected.count(tagged.identity) == 0U
            || tagged.ledger.models == nullptr
            || tagged.ledger.model_count == 0U)
            return false;
        if (index == 0U) model_count = tagged.ledger.model_count;
        else if (tagged.ledger.model_count != model_count) return false;
    }
    if (supplied != expected) return false;
    for (std::size_t state = 0U; state < kScalarStateCount; ++state) {
        (*scalar)[state] = find_tag(input, input.scalar_ledger_identities[state]);
        if ((*scalar)[state] == nullptr
            || !valid_scalar_ledger((*scalar)[state]->ledger))
            return false;
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
    const std::vector<std::unique_ptr<OwnedModel>> &accepted,
    const OwnedModel &pending) {
    std::vector<ledger::ModelView> views;
    views.reserve(accepted.size() + 1U);
    for (std::size_t ordinal = 0U; ordinal < accepted.size(); ++ordinal)
        views.push_back(accepted[ordinal]->view(ordinal));
    views.push_back(pending.view(accepted.size()));
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

bool combine(const product::Output &left, int left_sign,
             const product::Output &right, int right_sign,
             ledger::ModelKind kind, std::unique_ptr<OwnedModel> *combined) {
    if (combined == nullptr || left_sign == 0 || right_sign == 0
        || left.order != right.order
        || !arb_equal(left.left_endpoint, right.left_endpoint)
        || !arb_equal(left.right_endpoint, right.right_endpoint)
        || !arb_equal(left.expansion_center, right.expansion_center))
        return false;
    auto model = std::make_unique<OwnedModel>();
    model->kind = kind; model->allocate(left.order);
    arb_set(model->left_endpoint, left.left_endpoint);
    arb_set(model->right_endpoint, left.right_endpoint);
    arb_set(model->expansion_center, left.expansion_center);
    arb_t left_term, right_term, left_mag, right_mag, bound;
    arb_init(left_term); arb_init(right_term); arb_init(left_mag);
    arb_init(right_mag); arb_init(bound);
    bool pass = true;
    for (unsigned degree = 0U; pass && degree <= left.order; ++degree) {
        for (std::size_t jet_index = 0U; jet_index < kJetCount; ++jet_index) {
            arb_set(left_term, left.coefficient(degree, jet_index));
            arb_set(right_term, right.coefficient(degree, jet_index));
            if (left_sign < 0) arb_neg(left_term, left_term);
            if (right_sign < 0) arb_neg(right_term, right_term);
            arb_add(model->coefficient(degree, jet_index), left_term,
                    right_term, kPrecisionBits);
            pass = finite(model->coefficient(degree, jet_index));
            if (!pass) break;
        }
    }
    for (std::size_t jet_index = 0U; pass && jet_index < kJetCount;
         ++jet_index) {
        pass = upper_magnitude(left_mag, left.remainder(jet_index))
            && upper_magnitude(right_mag, right.remainder(jet_index));
        if (!pass) break;
        arb_add(bound, left_mag, right_mag, kPrecisionBits);
        arb_zero(model->remainders.data() + jet_index);
        arb_add_error(model->remainders.data() + jet_index, bound);
        pass = finite(model->remainders.data() + jet_index)
            && arb_contains_zero(model->remainders.data() + jet_index);
    }
    arb_clear(bound); arb_clear(right_mag); arb_clear(left_mag);
    arb_clear(right_term); arb_clear(left_term);
    if (!pass) return false;
    *combined = std::move(model);
    return true;
}

}  // namespace

struct Context::Impl {
    std::array<std::uint32_t, kScalarStateCount> scalar_ids{};
    std::uint32_t p_id = 0U;
    std::uint32_t pprime_id = 0U;
    analytic::Chart chart = analytic::Chart::positive;
    arb_t kappa, theta2, eta;
    bool eta_present = false;
    analytic::Output parameter_jets;
    std::vector<std::unique_ptr<OwnedModel>> p_models;
    std::vector<std::unique_ptr<OwnedModel>> pprime_models;
    std::vector<std::unique_ptr<Publication>> p_publications;
    std::vector<std::unique_ptr<Publication>> pprime_publications;
    std::array<std::vector<std::string>, kScalarStateCount>
        scalar_source_digests;
    bool initialized = false;
    bool terminal_failure = false;
    FailureDetail terminal_detail = FailureDetail::none;

    Impl() { arb_init(kappa); arb_init(theta2); arb_init(eta); }
    ~Impl() { arb_clear(eta); arb_clear(theta2); arb_clear(kappa); }
    void publish() {
        p_publications.push_back(std::make_unique<Publication>(p_models));
        pprime_publications.push_back(
            std::make_unique<Publication>(pprime_models));
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

void accumulate_product(const product::Result &source, Result *result) {
    ++result->analytic_product_calls;
    result->coefficient_product_terms += source.coefficient_product_terms;
    result->source_remainder_terms += source.source_remainder_terms;
    result->discarded_degree_terms += source.discarded_degree_terms;
}

bool build_pair(const std::array<const finite::TaggedLedgerView *,
                                 kScalarStateCount> &scalar,
                std::size_t ordinal, const analytic::Output &parameters,
                std::unique_ptr<OwnedModel> *p,
                std::unique_ptr<OwnedModel> *pprime, Result *result) {
    const auto &b = scalar[0]->ledger.models[ordinal];
    const auto &v = scalar[1]->ledger.models[ordinal];
    const auto &j1 = scalar[2]->ledger.models[ordinal];
    std::array<arb_struct, kJetCount> q_constant, q_linear;
    std::array<arb_struct, kJetCount> beta1_constant, beta_constant, zero;
    for (auto &value : q_constant) arb_init(&value);
    for (auto &value : q_linear) arb_init(&value);
    for (auto &value : beta1_constant) arb_init(&value);
    for (auto &value : beta_constant) arb_init(&value);
    for (auto &value : zero) arb_init(&value);
    for (std::size_t jet_index = 0U; jet_index < kJetCount; ++jet_index) {
        arb_set(&q_constant[jet_index], &parameters.kappa[jet_index]);
        arb_zero(&q_linear[jet_index]);
        arb_set(&beta1_constant[jet_index],
                &parameters.beta_plus_one[jet_index]);
        arb_set(&beta_constant[jet_index],
                &parameters.beta_plus_one[jet_index]);
        arb_zero(&zero[jet_index]);
    }
    arb_add(&q_constant[analytic::value_jet()],
            &q_constant[analytic::value_jet()], b.left_endpoint,
            kPrecisionBits);
    arb_one(&q_linear[analytic::value_jet()]);
    arb_sub_ui(&beta_constant[analytic::value_jet()],
               &beta_constant[analytic::value_jet()], 1U, kPrecisionBits);

    product::Output q_b, beta1_j1, beta_b, q_v;
    product::Result q_b_result{}, beta1_j1_result{}, beta_b_result{},
        q_v_result{};
    const product::Input q_b_input{b, q_constant.data(), q_linear.data(),
                                    kJetCount};
    const product::Input beta1_j1_input{j1, beta1_constant.data(), zero.data(),
                                        kJetCount};
    const product::Input beta_b_input{b, beta_constant.data(), zero.data(),
                                      kJetCount};
    const product::Input q_v_input{v, q_constant.data(), q_linear.data(),
                                   kJetCount};
    bool pass = product::evaluate(q_b_input, &q_b, &q_b_result);
    accumulate_product(q_b_result, result);
    if (pass) {
        pass = product::evaluate(beta1_j1_input, &beta1_j1,
                                 &beta1_j1_result);
        accumulate_product(beta1_j1_result, result);
    }
    if (pass) {
        pass = product::evaluate(beta_b_input, &beta_b, &beta_b_result);
        accumulate_product(beta_b_result, result);
    }
    if (pass) {
        pass = product::evaluate(q_v_input, &q_v, &q_v_result);
        accumulate_product(q_v_result, result);
    }
    if (pass) {
        pass = combine(q_b, -1, beta1_j1, 1, b.kind, p)
            && combine(beta_b, 1, q_v, -1, b.kind, pprime);
    }
    for (auto &value : zero) arb_clear(&value);
    for (auto &value : beta_constant) arb_clear(&value);
    for (auto &value : beta1_constant) arb_clear(&value);
    for (auto &value : q_linear) arb_clear(&value);
    for (auto &value : q_constant) arb_clear(&value);
    return pass;
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
            || input.p_ledger_identity != impl.p_id
            || input.pprime_ledger_identity != impl.pprime_id
            || !same_parameters(input, impl))) {
        *result = Result{};
        result->detail = FailureDetail::parameter_identity_or_prefix;
        return false;
    }
    if (impl.terminal_failure) {
        *result = Result{};
        result->detail = FailureDetail::terminal_failure_already_recorded;
        result->first_failure_terminal = true;
        result->p_models_before = impl.p_models.size();
        result->p_models_after = impl.p_models.size();
        result->pprime_models_after = impl.pprime_models.size();
        return false;
    }
    if (scalar[0]->ledger.model_count < impl.p_models.size()
        || impl.p_models.size() != impl.pprime_models.size()) {
        *result = Result{};
        result->detail = FailureDetail::scalar_inventory_or_prefix;
        return false;
    }
    for (std::size_t ordinal = 0U; ordinal < impl.p_models.size(); ++ordinal) {
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

    const std::size_t before = impl.p_models.size();
    result->source_models_before = before;
    result->p_models_before = before;
    for (std::size_t ordinal = before;
         ordinal < scalar[0]->ledger.model_count; ++ordinal) {
        if (ordinal >= ledger::kMaximumLedgerModels) {
            impl.terminal_failure = true;
            impl.terminal_detail = FailureDetail::fixed_resource;
            impl.publish();
            result->detail = impl.terminal_detail;
            result->first_failure_terminal = true;
            result->p_models_after = impl.p_models.size();
            result->pprime_models_after = impl.pprime_models.size();
            return false;
        }
        std::unique_ptr<OwnedModel> p, pprime;
        if (!build_pair(scalar, ordinal, impl.parameter_jets, &p, &pprime,
                        result)) {
            impl.terminal_failure = true;
            impl.terminal_detail = FailureDetail::analytic_model_product;
            impl.publish();
            result->detail = impl.terminal_detail;
            result->first_failure_terminal = true;
            result->p_models_after = impl.p_models.size();
            result->pprime_models_after = impl.pprime_models.size();
            return false;
        }
        if (!validate_with_pending(impl.p_models, *p)
            || !validate_with_pending(impl.pprime_models, *pprime)) {
            impl.terminal_failure = true;
            impl.terminal_detail = FailureDetail::ledger_validation;
            impl.publish();
            result->detail = impl.terminal_detail;
            result->first_failure_terminal = true;
            result->p_models_after = impl.p_models.size();
            result->pprime_models_after = impl.pprime_models.size();
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
        impl.p_models.push_back(std::move(p));
        impl.pprime_models.push_back(std::move(pprime));
        for (std::size_t state = 0U; state < kScalarStateCount; ++state)
            impl.scalar_source_digests[state].push_back(
                std::move(digests[state]));
        ++result->model_pairs_appended;
    }
    impl.publish();
    result->accepted = true;
    result->detail = FailureDetail::none;
    result->source_models_after = scalar[0]->ledger.model_count;
    result->p_models_after = impl.p_models.size();
    result->pprime_models_after = impl.pprime_models.size();
    result->exact_p_identity = true;
    result->exact_pprime_identity = true;
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
    if (!analytic::evaluate(input.parameters, &impl.parameter_jets,
                            &parameter_result)) {
        result->detail = FailureDetail::parameter_identity_or_prefix;
        return false;
    }
    impl.scalar_ids = input.scalar_ledger_identities;
    impl.p_id = input.p_ledger_identity;
    impl.pprime_id = input.pprime_ledger_identity;
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

ledger::LedgerView published_p(const Context &context) {
    if (!context.impl_->initialized || context.impl_->p_publications.empty())
        return {};
    return context.impl_->p_publications.back()->view();
}

ledger::LedgerView published_pprime(const Context &context) {
    if (!context.impl_->initialized
        || context.impl_->pprime_publications.empty())
        return {};
    return context.impl_->pprime_publications.back()->view();
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::input_or_output: return "C08_P_INPUT_OR_OUTPUT";
    case FailureDetail::scalar_inventory_or_prefix: return "C08_P_SCALAR_INVENTORY_OR_PREFIX";
    case FailureDetail::parameter_identity_or_prefix: return "C08_P_PARAMETER_IDENTITY_OR_PREFIX";
    case FailureDetail::analytic_model_product: return "C08_P_ANALYTIC_MODEL_PRODUCT";
    case FailureDetail::ledger_validation: return "C08_P_LEDGER_VALIDATION";
    case FailureDetail::fixed_resource: return "C08_P_FIXED_RESOURCE";
    case FailureDetail::terminal_failure_already_recorded: return "C08_P_TERMINAL_FAILURE_ALREADY_RECORDED";
    }
    return "C08_P_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_p_ledgers_v1
