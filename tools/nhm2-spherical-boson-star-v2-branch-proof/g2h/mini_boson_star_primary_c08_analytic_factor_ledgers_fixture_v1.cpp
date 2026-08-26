#include "mini_boson_star_primary_c08_analytic_factor_ledgers_v1.hpp"
#include "mini_boson_star_primary_c08_scalar_ledger_provider_v1.hpp"

#include "mini_boson_star_primary_c08_identity_v1.hpp"
#include "mini_boson_star_primary_c08_margins_v1.hpp"

#include <flint/fmpq.h>

#include <cstddef>
#include <iostream>
#include <vector>

namespace factors =
    nhm2::g2h_e_s5::primary_c08_analytic_factor_ledgers_v1;
namespace factor =
    nhm2::g2h_e_s5::primary_c08_analytic_factor_model_v1;
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
    arb_set_fmpq(value, q, factor::kPrecisionBits); fmpq_clear(q);
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

factors::Input make_input(const scalar::Context &context, Ball &kappa,
                          Ball &mass) {
    return {scalar::published(context), {10U, 20U, 30U, 40U},
            {50U, 60U, 70U},
            {factors::analytic::Chart::positive,
             kappa.value, mass.value, nullptr}};
}

bool neutral(const factors::Result &result) {
    return result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created
        && !result.scientific_handler_linked
        && !result.authority_promoted;
}

bool valid_ledger(factors::ledger::LedgerView view, arb_srcptr right) {
    factors::ledger::Output output;
    factors::ledger::Result result{};
    Ball zero, one; arb_zero(zero.value); arb_one(one.value);
    const factors::ledger::Input input{view, zero.value, right,
                                       zero.value, one.value};
    return factors::ledger::evaluate(input, &output, &result)
        && result.accepted && result.models_validated == view.model_count;
}

bool same_model(const factors::ledger::ModelView &left,
                const factors::ledger::ModelView &right) {
    if (left.kind != right.kind || left.order != right.order
        || left.coefficient_count != right.coefficient_count
        || left.remainder_count != right.remainder_count
        || !arb_equal(left.left_endpoint, right.left_endpoint)
        || !arb_equal(left.right_endpoint, right.right_endpoint)
        || !arb_equal(left.expansion_center, right.expansion_center))
        return false;
    for (std::size_t index = 0U; index < left.coefficient_count; ++index)
        if (!arb_equal(left.coefficients + index,
                       right.coefficients + index)) return false;
    for (std::size_t index = 0U; index < left.remainder_count; ++index)
        if (!arb_equal(left.remainders + index,
                       right.remainders + index)) return false;
    return true;
}

}  // namespace

int main() {
    std::vector<bool> checks;
    Storage storage(514U);
    auto input_identity = make_identity(storage);
    Ball h0, kappa, mass, eta, target;
    arb_one(h0.value); rational(kappa.value, 1L, 2L);
    rational(mass.value, 1L, 4L); arb_indeterminate(eta.value);
    auto scalar_input = make_scalar_input(input_identity, h0, kappa, mass, eta);
    scalar::Context scalar_context;
    scalar::Result scalar_initial{};
    checks.push_back(scalar::initialize(scalar_input, &scalar_context,
                                        &scalar_initial));

    auto input = make_input(scalar_context, kappa, mass);
    factors::Context context;
    factors::Result initial{};
    checks.push_back(factors::initialize(input, &context, &initial)
                     && initial.accepted
                     && initial.model_triples_appended == 1U
                     && initial.analytic_model_calls == 1U
                     && initial.exact_factor_identities && neutral(initial));
    const auto f_before = factors::published(context, factors::factor::Factor::F);
    const auto e1_before = factors::published(context, factors::factor::Factor::E1);
    const auto e2_before = factors::published(context, factors::factor::Factor::E2);
    checks.push_back(f_before.model_count == 1U && e1_before.model_count == 1U
                     && e2_before.model_count == 1U
                     && arb_is_one(f_before.models[0].coefficients)
                     && arb_is_one(e1_before.models[0].coefficients)
                     && arb_is_one(e2_before.models[0].coefficients));

    arb_mul_ui(target.value, scalar::right_endpoint(scalar_context), 129U,
               factor::kPrecisionBits);
    arb_div_ui(target.value, target.value, 128U, factor::kPrecisionBits);
    scalar::Result scalar_extension{};
    checks.push_back(scalar::extend_to(&scalar_context, target.value,
                                       &scalar_extension)
                     && scalar_extension.panels_appended == 1U);
    auto extended_input = make_input(scalar_context, kappa, mass);
    factors::Result extension{};
    checks.push_back(factors::extend(extended_input, &context, &extension)
                     && extension.accepted
                     && extension.model_triples_appended == 1U
                     && extension.source_prefix_digests_checked == 4U
                     && neutral(extension));
    const auto f_after = factors::published(context, factors::factor::Factor::F);
    const auto e1_after = factors::published(context, factors::factor::Factor::E1);
    const auto e2_after = factors::published(context, factors::factor::Factor::E2);
    checks.push_back(f_after.model_count == 2U && e1_after.model_count == 2U
                     && e2_after.model_count == 2U
                     && same_model(f_before.models[0], f_after.models[0])
                     && same_model(e1_before.models[0], e1_after.models[0])
                     && same_model(e2_before.models[0], e2_after.models[0]));
    checks.push_back(valid_ledger(f_after, target.value)
                     && valid_ledger(e1_after, target.value)
                     && valid_ledger(e2_after, target.value));

    factors::Result no_op{};
    checks.push_back(factors::extend(extended_input, &context, &no_op)
                     && no_op.accepted && no_op.model_triples_appended == 0U
                     && no_op.source_prefix_digests_checked == 8U);
    arb_ptr mutable_j2 = const_cast<arb_ptr>(
        extended_input.scalar_ledgers.ledgers[3].ledger.models[0].coefficients);
    arb_t saved; arb_init(saved); arb_set(saved, mutable_j2);
    arb_add_ui(mutable_j2, mutable_j2, 1U, factor::kPrecisionBits);
    factors::Result prefix_result{};
    checks.push_back(!factors::extend(extended_input, &context, &prefix_result)
                     && prefix_result.detail
                        == factors::FailureDetail::scalar_inventory_or_prefix
                     && factors::published(context,
                            factors::factor::Factor::F).model_count == 2U);
    arb_set(mutable_j2, saved); arb_clear(saved);

    auto changed_parameter = extended_input;
    Ball changed_mass; rational(changed_mass.value, 1L, 3L);
    changed_parameter.parameters.theta2 = changed_mass.value;
    factors::Result parameter_result{};
    checks.push_back(!factors::extend(changed_parameter, &context,
                                      &parameter_result)
                     && parameter_result.detail
                        == factors::FailureDetail::parameter_identity_or_prefix);
    auto duplicate = input;
    duplicate.factor_ledger_identities = {50U, 50U, 70U};
    factors::Context duplicate_context;
    factors::Result duplicate_result{};
    checks.push_back(!factors::initialize(duplicate, &duplicate_context,
                                          &duplicate_result));
    auto collision = input; collision.factor_ledger_identities[0] = 10U;
    checks.push_back(!factors::initialize(collision, &duplicate_context,
                                          &duplicate_result));
    checks.push_back(!factors::initialize(input, nullptr, &duplicate_result)
                     && !factors::initialize(input, &duplicate_context, nullptr));

    std::size_t passed = 0U;
    for (const bool check : checks) passed += check ? 1U : 0U;
    std::cout << "{\"schema\":\"nhm2.g2h_e_s5.c08_analytic_factor_ledgers_fixture.v1\""
              << ",\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL") << "\""
              << ",\"checks_passed\":" << passed
              << ",\"checks_total\":" << checks.size()
              << ",\"models_per_factor\":" << f_after.model_count
              << ",\"candidate_evaluations\":0"
              << ",\"positive_parameter_samples\":0"
              << ",\"candidate_roots_created\":false"
              << ",\"scientific_handler_linked\":false"
              << ",\"authority_promoted\":false}\n";
    return passed == checks.size() ? 0 : 1;
}
