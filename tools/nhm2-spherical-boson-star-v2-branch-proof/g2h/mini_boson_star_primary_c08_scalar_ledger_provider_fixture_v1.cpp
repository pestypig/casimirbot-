#include "mini_boson_star_primary_c08_scalar_ledger_provider_v1.hpp"

#include "mini_boson_star_primary_c08_identity_v1.hpp"
#include "mini_boson_star_primary_c08_margins_v1.hpp"

#include <arb.h>
#include <flint/fmpq.h>

#include <array>
#include <cstddef>
#include <iostream>
#include <vector>

namespace provider =
    nhm2::g2h_e_s5::primary_c08_scalar_ledger_provider_v1;
namespace identity = nhm2::g2h_e_s5::primary_c08_identity_v1;
namespace margins = nhm2::g2h_e_s5::primary_c08_margins_v1;
namespace ledger = nhm2::g2h_e_s5::primary_c08_convolution_ledger_v1;

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
    arb_set_fmpq(value, q, provider::kPrecisionBits);
    fmpq_clear(q);
}

identity::InputIdentity make_identity(Storage &storage) {
    return {kGrowthHash, kJetHash, kGridHash, kAbiHash,
            identity::Chart::positive, 1U, 64L,
            storage.values.size(), storage.values.data()};
}

provider::Input make_input(identity::InputIdentity &input_identity,
                           Ball &h0, Ball &kappa, Ball &mass, Ball &eta) {
    margins::Input margin_input{&input_identity, true, h0.value, kappa.value,
                                mass.value, eta.value};
    return {{{margin_input}}, {10U, 20U, 30U, 40U}};
}

bool neutral(const provider::Result &result) {
    return result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created
        && !result.scientific_handler_linked
        && !result.authority_promoted;
}

bool same_prefix(const provider::finite::LedgerSetView &before,
                 const provider::finite::LedgerSetView &after) {
    if (before.ledger_count != after.ledger_count) return false;
    for (std::size_t state = 0U; state < before.ledger_count; ++state) {
        if (before.ledgers[state].identity != after.ledgers[state].identity
            || before.ledgers[state].ledger.model_count != 1U
            || after.ledgers[state].ledger.model_count < 1U)
            return false;
        const auto &a = before.ledgers[state].ledger.models[0];
        const auto &b = after.ledgers[state].ledger.models[0];
        if (a.order != b.order || a.coefficient_count != b.coefficient_count
            || a.remainder_count != b.remainder_count
            || !arb_equal(a.left_endpoint, b.left_endpoint)
            || !arb_equal(a.right_endpoint, b.right_endpoint))
            return false;
        for (std::size_t i = 0U; i < a.coefficient_count; ++i)
            if (!arb_equal(a.coefficients + i, b.coefficients + i)) return false;
        for (std::size_t i = 0U; i < a.remainder_count; ++i)
            if (!arb_equal(a.remainders + i, b.remainders + i)) return false;
    }
    return true;
}

}  // namespace

int main() {
    std::vector<bool> checks;
    Storage storage(514U);
    auto input_identity = make_identity(storage);
    Ball h0, kappa, mass, eta, target, zero, one, negative;
    arb_one(h0.value); rational(kappa.value, 1L, 2L);
    rational(mass.value, 1L, 4L); arb_indeterminate(eta.value);
    arb_zero(zero.value); arb_one(one.value); arb_set_si(negative.value, -1L);
    auto input = make_input(input_identity, h0, kappa, mass, eta);

    provider::Context context;
    provider::Result initial_result{};
    checks.push_back(provider::initialize(input, &context, &initial_result)
                     && initial_result.accepted
                     && initial_result.c08_006_passed
                     && !initial_result.c08_010_passed
                     && neutral(initial_result));
    const auto before = provider::published(context);
    checks.push_back(before.ledger_count == 4U
                     && before.ledgers[0].ledger.model_count == 1U
                     && before.ledgers[3].ledger.model_count == 1U);

    // Three nominal tL/128 successor widths; the last panel is clipped exactly
    // to this target if the preceding directed widths grow slightly.
    arb_mul_ui(target.value, provider::right_endpoint(context), 131U,
               provider::kPrecisionBits);
    arb_div_ui(target.value, target.value, 128U, provider::kPrecisionBits);
    provider::Result extension_result{};
    const bool extended = provider::extend_to(&context, target.value,
                                               &extension_result);
    const auto after = provider::published(context);
    checks.push_back(extended && extension_result.accepted
                     && extension_result.panels_appended >= 2U
                     && extension_result.models_before_per_ledger == 1U
                     && extension_result.models_after_per_ledger
                        == 1U + extension_result.panels_appended);
    checks.push_back(extension_result.c08_006_passed
                     && extension_result.c08_007_passed
                     && extension_result.c08_008_passed
                     && extension_result.c08_009_passed
                     && !extension_result.c08_010_passed);
    checks.push_back(extension_result.append_only
                     && extension_result.stable_prior_publication
                     && !extension_result.retry_or_retune_used
                     && !extension_result.signed_remainder_cancellation_used
                     && !extension_result.midpoint_acceptance_used
                     && neutral(extension_result));
    checks.push_back(same_prefix(before, after)
                     && before.ledgers[0].ledger.model_count == 1U);
    checks.push_back(arb_equal(provider::right_endpoint(context), target.value));

    bool ledgers_pass = true;
    for (std::size_t state = 0U; state < after.ledger_count; ++state) {
        ledger::Output ledger_output;
        ledger::Result ledger_result{};
        ledger::Input ledger_input{after.ledgers[state].ledger, zero.value,
            target.value, zero.value, one.value};
        ledgers_pass = ledgers_pass
            && ledger::evaluate(ledger_input, &ledger_output, &ledger_result)
            && ledger_result.accepted
            && ledger_result.models_validated
                == extension_result.models_after_per_ledger;
    }
    checks.push_back(ledgers_pass);

    provider::Result no_op_result{};
    checks.push_back(provider::extend_to(&context, target.value, &no_op_result)
                     && no_op_result.accepted
                     && no_op_result.panels_appended == 0U
                     && no_op_result.models_before_per_ledger
                        == no_op_result.models_after_per_ledger
                     && !no_op_result.c08_010_passed);
    provider::Result invalid_target_result{};
    checks.push_back(!provider::extend_to(&context, negative.value,
                                          &invalid_target_result)
                     && invalid_target_result.finite_failure
                        == provider::chronology::FiniteFailureCode::none);

    provider::Context duplicate_context;
    auto duplicate_input = input;
    duplicate_input.scalar_ledger_identities = {10U, 10U, 30U, 40U};
    provider::Result duplicate_result{};
    checks.push_back(!provider::initialize(duplicate_input, &duplicate_context,
                                           &duplicate_result));
    provider::Result null_context_result{};
    checks.push_back(!provider::initialize(input, nullptr, &null_context_result));
    checks.push_back(!provider::initialize(input, &duplicate_context, nullptr));

    provider::Context terminal_context;
    provider::Result terminal_initial{};
    checks.push_back(provider::initialize(input, &terminal_context,
                                           &terminal_initial));
    Ball saved_kappa;
    arb_set(saved_kappa.value, kappa.value);
    arb_indeterminate(kappa.value);
    Ball terminal_target;
    arb_mul_ui(terminal_target.value, provider::right_endpoint(terminal_context),
               129U, provider::kPrecisionBits);
    arb_div_ui(terminal_target.value, terminal_target.value, 128U,
               provider::kPrecisionBits);
    provider::Result terminal_result{};
    checks.push_back(!provider::extend_to(&terminal_context,
                                          terminal_target.value,
                                          &terminal_result)
                     && terminal_result.first_failure_terminal
                     && terminal_result.finite_failure
                        != provider::chronology::FiniteFailureCode::none);
    const auto terminal_count = provider::published(terminal_context)
        .ledgers[0].ledger.model_count;
    provider::Result terminal_replay{};
    checks.push_back(!provider::extend_to(&terminal_context,
                                          terminal_target.value,
                                          &terminal_replay)
                     && terminal_replay.detail
                        == provider::FailureDetail::terminal_failure_already_recorded
                     && provider::published(terminal_context)
                            .ledgers[0].ledger.model_count == terminal_count);
    arb_set(kappa.value, saved_kappa.value);

    provider::Context replay_context;
    provider::Result replay_initial{}, replay_extension{};
    const bool replay_ok = provider::initialize(input, &replay_context,
                                                 &replay_initial)
        && provider::extend_to(&replay_context, target.value,
                               &replay_extension);
    const auto replay_view = provider::published(replay_context);
    bool deterministic = replay_ok
        && replay_extension.panels_appended == extension_result.panels_appended
        && replay_view.ledger_count == after.ledger_count;
    for (std::size_t state = 0U; deterministic && state < after.ledger_count;
         ++state) {
        const auto &a = after.ledgers[state].ledger;
        const auto &b = replay_view.ledgers[state].ledger;
        deterministic = a.model_count == b.model_count;
        for (std::size_t model = 0U; deterministic && model < a.model_count;
             ++model)
            deterministic = arb_equal(a.models[model].right_endpoint,
                                      b.models[model].right_endpoint)
                && a.models[model].order == b.models[model].order
                && arb_equal(a.models[model].coefficients,
                             b.models[model].coefficients)
                && arb_equal(a.models[model].remainders,
                             b.models[model].remainders);
    }
    checks.push_back(deterministic && neutral(replay_extension));

    std::size_t passed = 0U;
    for (const bool check : checks) passed += check ? 1U : 0U;
    std::cout << "{\"schema\":\"nhm2.g2h_e_s5.c08_scalar_ledger_provider_fixture.v1\""
              << ",\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL") << "\""
              << ",\"checks_passed\":" << passed
              << ",\"checks_total\":" << checks.size()
              << ",\"panels_appended\":" << extension_result.panels_appended
              << ",\"models_per_ledger\":" << extension_result.models_after_per_ledger
              << ",\"endpoint_boxes\":" << extension_result.endpoint_boxes_produced
              << ",\"failed_checks\":[";
    bool first_failed = true;
    for (std::size_t index = 0U; index < checks.size(); ++index)
        if (!checks[index]) {
            if (!first_failed) std::cout << ',';
            std::cout << index;
            first_failed = false;
        }
    std::cout
              << "]"
              << ",\"c08_010_passed\":false"
              << ",\"candidate_evaluations\":0,\"positive_parameter_samples\":0"
              << ",\"candidate_roots_created\":false"
              << ",\"scientific_handler_linked\":false"
              << ",\"authority_promoted\":false}\n";
    return passed == checks.size() ? 0 : 1;
}
