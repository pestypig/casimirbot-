#include "mini_boson_star_primary_c08_p_ledgers_v1.hpp"
#include "mini_boson_star_primary_c08_scalar_ledger_provider_v1.hpp"

#include "mini_boson_star_primary_c08_identity_v1.hpp"
#include "mini_boson_star_primary_c08_margins_v1.hpp"

#include <flint/fmpq.h>

#include <array>
#include <cstddef>
#include <iostream>
#include <vector>

namespace p = nhm2::g2h_e_s5::primary_c08_p_ledgers_v1;
namespace scalar = nhm2::g2h_e_s5::primary_c08_scalar_ledger_provider_v1;
namespace identity = nhm2::g2h_e_s5::primary_c08_identity_v1;
namespace margins = nhm2::g2h_e_s5::primary_c08_margins_v1;

namespace {

constexpr char kGrowthHash[] =
    "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737";
constexpr char kJetHash[] =
    "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc";
constexpr char kGridHash[] =
    "cd98fb110a6d0d94cd69d1134e8f5233444ea34f7894bc14333075d0dfa5013c";
constexpr char kAbiHash[] =
    "6fbf6cdbb80e6da390c84f6d87f13f37f2b81b2226bf937cbcfd2c8aff3911ca";

struct Ball {
    Ball() { arb_init(value); }
    ~Ball() { arb_clear(value); }
    arb_t value;
};

struct Storage {
    explicit Storage(std::size_t count) : values(count) {
        for (auto &value : values) {
            arb_init(&value); arb_indeterminate(&value);
        }
    }
    ~Storage() { for (auto &value : values) arb_clear(&value); }
    std::vector<arb_struct> values;
};

void rational(arb_t value, long numerator, long denominator) {
    fmpq_t q;
    fmpq_init(q); fmpq_set_si(q, numerator, denominator);
    arb_set_fmpq(value, q, p::kPrecisionBits); fmpq_clear(q);
}

identity::InputIdentity make_identity(Storage &storage) {
    return {kGrowthHash, kJetHash, kGridHash, kAbiHash,
            identity::Chart::positive, 1U, 64L,
            storage.values.size(), storage.values.data()};
}

scalar::Input make_scalar_input(identity::InputIdentity &input_identity,
                                Ball &h0, Ball &kappa, Ball &mass, Ball &eta) {
    margins::Input margin_input{&input_identity, true, h0.value, kappa.value,
                                mass.value, eta.value};
    return {{{margin_input}}, {10U, 20U, 30U, 40U}};
}

p::Input make_p_input(const scalar::Context &context, Ball &kappa,
                      Ball &mass) {
    return {scalar::published(context), {10U, 20U, 30U, 40U}, 50U, 60U,
            {p::analytic::Chart::positive, kappa.value, mass.value, nullptr}};
}

bool neutral(const p::Result &result) {
    return result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created
        && !result.scientific_handler_linked
        && !result.authority_promoted;
}

bool same_model(const p::ledger::ModelView &a,
                const p::ledger::ModelView &b) {
    if (a.kind != b.kind || a.order != b.order
        || a.coefficient_count != b.coefficient_count
        || a.remainder_count != b.remainder_count
        || !arb_equal(a.left_endpoint, b.left_endpoint)
        || !arb_equal(a.right_endpoint, b.right_endpoint)
        || !arb_equal(a.expansion_center, b.expansion_center))
        return false;
    for (std::size_t i = 0U; i < a.coefficient_count; ++i)
        if (!arb_equal(a.coefficients + i, b.coefficients + i)) return false;
    for (std::size_t i = 0U; i < a.remainder_count; ++i)
        if (!arb_equal(a.remainders + i, b.remainders + i)) return false;
    return true;
}

bool valid_ledger(p::ledger::LedgerView view, arb_srcptr right) {
    p::ledger::Output output;
    p::ledger::Result result{};
    Ball zero, one;
    arb_zero(zero.value); arb_one(one.value);
    const p::ledger::Input input{view, zero.value, right, zero.value, one.value};
    return p::ledger::evaluate(input, &output, &result)
        && result.accepted && result.models_validated == view.model_count;
}

}  // namespace

int main() {
    std::vector<bool> checks;
    Storage storage(514U);
    auto input_identity = make_identity(storage);
    Ball h0, kappa, mass, eta, target, zero, expected;
    arb_one(h0.value); rational(kappa.value, 1L, 2L);
    rational(mass.value, 1L, 4L); arb_indeterminate(eta.value);
    arb_zero(zero.value);
    auto scalar_input = make_scalar_input(input_identity, h0, kappa, mass, eta);
    scalar::Context scalar_context;
    scalar::Result scalar_initial{};
    checks.push_back(scalar::initialize(scalar_input, &scalar_context,
                                        &scalar_initial));

    auto p_input = make_p_input(scalar_context, kappa, mass);
    p::Context context;
    p::Result initial{};
    checks.push_back(p::initialize(p_input, &context, &initial)
                     && initial.accepted && initial.model_pairs_appended == 1U
                     && initial.exact_p_identity && initial.exact_pprime_identity
                     && initial.analytic_product_calls == 4U && neutral(initial));
    const auto p_before = p::published_p(context);
    const auto pprime_before = p::published_pprime(context);
    rational(expected.value, -1L, 2L);
    checks.push_back(p_before.model_count == 1U
                     && pprime_before.model_count == 1U
                     && p_before.models[0].kind == p::ledger::ModelKind::origin
                     && arb_contains(p_before.models[0].coefficients,
                                     expected.value));
    checks.push_back(arb_overlaps(
        p_before.models[0].coefficients + p::kJetCount,
        pprime_before.models[0].coefficients));

    arb_mul_ui(target.value, scalar::right_endpoint(scalar_context), 129U,
               p::kPrecisionBits);
    arb_div_ui(target.value, target.value, 128U, p::kPrecisionBits);
    scalar::Result scalar_extension{};
    checks.push_back(scalar::extend_to(&scalar_context, target.value,
                                       &scalar_extension)
                     && scalar_extension.panels_appended == 1U);
    auto p_after_input = make_p_input(scalar_context, kappa, mass);
    p::Result extension{};
    checks.push_back(p::extend(p_after_input, &context, &extension)
                     && extension.accepted
                     && extension.model_pairs_appended == 1U
                     && extension.source_prefix_digests_checked == 4U
                     && extension.analytic_product_calls == 4U
                     && neutral(extension));
    const auto p_after = p::published_p(context);
    const auto pprime_after = p::published_pprime(context);
    checks.push_back(p_after.model_count == 2U
                     && pprime_after.model_count == 2U
                     && same_model(p_before.models[0], p_after.models[0])
                     && same_model(pprime_before.models[0],
                                   pprime_after.models[0])
                     && arb_overlaps(p_after.models[1].coefficients
                                         + p::kJetCount,
                                     pprime_after.models[1].coefficients));
    checks.push_back(valid_ledger(p_after, target.value)
                     && valid_ledger(pprime_after, target.value));

    p::Result no_op{};
    checks.push_back(p::extend(p_after_input, &context, &no_op)
                     && no_op.accepted && no_op.model_pairs_appended == 0U
                     && no_op.source_prefix_digests_checked == 8U);

    arb_ptr mutable_j2 = const_cast<arb_ptr>(
        p_after_input.scalar_ledgers.ledgers[3].ledger.models[0].coefficients);
    arb_t saved;
    arb_init(saved); arb_set(saved, mutable_j2);
    arb_add_ui(mutable_j2, mutable_j2, 1U, p::kPrecisionBits);
    p::Result prefix_result{};
    checks.push_back(!p::extend(p_after_input, &context, &prefix_result)
                     && prefix_result.detail
                        == p::FailureDetail::scalar_inventory_or_prefix
                     && p::published_p(context).model_count == 2U);
    arb_set(mutable_j2, saved); arb_clear(saved);

    auto changed_parameter_input = p_after_input;
    Ball changed_kappa;
    rational(changed_kappa.value, 3L, 4L);
    changed_parameter_input.parameters.kappa = changed_kappa.value;
    p::Result parameter_result{};
    checks.push_back(!p::extend(changed_parameter_input, &context,
                                &parameter_result)
                     && parameter_result.detail
                        == p::FailureDetail::parameter_identity_or_prefix
                     && p::published_p(context).model_count == 2U);

    auto duplicate_output_input = p_input;
    duplicate_output_input.pprime_ledger_identity =
        duplicate_output_input.p_ledger_identity;
    p::Context duplicate_context;
    p::Result duplicate_result{};
    checks.push_back(!p::initialize(duplicate_output_input,
                                    &duplicate_context, &duplicate_result));
    auto duplicate_scalar_input = p_input;
    duplicate_scalar_input.scalar_ledger_identities = {10U, 10U, 30U, 40U};
    p::Context duplicate_scalar_context;
    checks.push_back(!p::initialize(duplicate_scalar_input,
                                    &duplicate_scalar_context,
                                    &duplicate_result));
    checks.push_back(!p::initialize(p_input, nullptr, &duplicate_result)
                     && !p::initialize(p_input, &duplicate_context, nullptr));

    std::size_t passed = 0U;
    for (const bool check : checks) passed += check ? 1U : 0U;
    std::cout << "{\"schema\":\"nhm2.g2h_e_s5.c08_p_ledgers_fixture.v1\""
              << ",\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL") << "\""
              << ",\"checks_passed\":" << passed
              << ",\"checks_total\":" << checks.size()
              << ",\"p_models\":" << p_after.model_count
              << ",\"pprime_models\":" << pprime_after.model_count
              << ",\"candidate_evaluations\":0"
              << ",\"positive_parameter_samples\":0"
              << ",\"candidate_roots_created\":false"
              << ",\"scientific_handler_linked\":false"
              << ",\"authority_promoted\":false}\n";
    return passed == checks.size() ? 0 : 1;
}
