#include "mini_boson_star_primary_c08_origin_models_v1.hpp"

#include "mini_boson_star_primary_c08_identity_v1.hpp"
#include "mini_boson_star_primary_c08_margins_v1.hpp"

#include <arb.h>
#include <flint/fmpq.h>

#include <array>
#include <cstddef>
#include <iostream>
#include <vector>

namespace models = nhm2::g2h_e_s5::primary_c08_origin_models_v1;
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
    arb_set_fmpq(value, q, models::kPrecisionBits);
    fmpq_clear(q);
}

identity::InputIdentity make_identity(Storage &storage) {
    return {kGrowthHash, kJetHash, kGridHash, kAbiHash,
            identity::Chart::positive, 1U, 64L,
            storage.values.size(), storage.values.data()};
}

bool neutral(const models::Result &result) {
    return result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created
        && !result.scientific_handler_linked
        && !result.authority_promoted;
}

}  // namespace

int main() {
    std::vector<bool> checks;
    Storage storage(514U);
    auto input_identity = make_identity(storage);
    Ball h0, kappa, mass, eta, zero, one, half;
    arb_one(h0.value); rational(kappa.value, 1L, 2L);
    rational(mass.value, 1L, 4L); arb_indeterminate(eta.value);
    arb_zero(zero.value); arb_one(one.value); rational(half.value, 1L, 2L);
    margins::Input margin_input{&input_identity, true, h0.value, kappa.value,
                                mass.value, eta.value};
    models::origin::Input input{{margin_input}};

    models::Output output;
    models::Result result{};
    const bool accepted = models::evaluate(input, &output, &result);
    checks.push_back(accepted && result.accepted
                     && result.detail == models::FailureDetail::none);
    if (!accepted) {
        std::cout << "{\"schema\":\"nhm2.g2h_e_s5.c08_origin_models_fixture.v1\""
                  << ",\"status\":\"FAIL\",\"checks_passed\":0"
                  << ",\"checks_total\":1,\"failure_detail\":\""
                  << models::failure_detail_name(result.detail) << "\"}\n";
        return 1;
    }
    checks.push_back(result.selected_origin_order == 128U
                     && output.model(models::State::B).order == 128U
                     && output.model(models::State::V).order == 128U
                     && output.model(models::State::J1).order == 128U
                     && output.model(models::State::J2).order == 128U);
    checks.push_back(result.recurrence_coefficients_replayed == 129U * 13U
                     && result.model_remainder_balls == 52U
                     && result.endpoint_containment_checks == 52U
                     && result.derivative_and_integral_normalization_exact
                     && result.known_truncated_terms_moved_to_remainder);
    bool geometry = true, storage_shape = true, finite = true;
    for (std::size_t state = 0U; state < models::kStateCount; ++state) {
        const auto &model = output.models[state];
        geometry = geometry && arb_is_zero(model.left_endpoint)
            && arb_is_zero(model.expansion_center)
            && arb_equal(model.right_endpoint, output.origin_enclosure.t0);
        storage_shape = storage_shape
            && model.coefficients.size()
                == (static_cast<std::size_t>(model.order) + 1U) * 13U
            && model.remainders.size() == 13U;
        for (const auto &value : model.coefficients)
            finite = finite && arb_is_finite(&value);
        for (const auto &value : model.remainders)
            finite = finite && arb_is_finite(&value)
                && arb_contains_zero(&value);
    }
    checks.push_back(geometry && storage_shape && finite);

    const auto &b = output.model(models::State::B);
    const auto &j1 = output.model(models::State::J1);
    const auto &j2 = output.model(models::State::J2);
    checks.push_back(arb_equal(b.coefficient(0U, 0U), h0.value)
                     && arb_is_one(b.coefficient(0U, 1U)));
    checks.push_back(arb_is_zero(j1.coefficient(0U, 0U))
                     && arb_equal(j1.coefficient(1U, 0U), h0.value));
    checks.push_back(arb_is_zero(j2.coefficient(0U, 0U))
                     && arb_is_zero(j2.coefficient(1U, 0U))
                     && arb_equal(j2.coefficient(2U, 0U), half.value));

    bool ledgers_pass = true;
    for (std::size_t state = 0U; state < models::kStateCount; ++state) {
        auto view = output.models[state].view(0U);
        models::ledger::Output ledger_output;
        models::ledger::Result ledger_result{};
        models::ledger::Input ledger_input{{1U, &view}, zero.value,
            output.origin_enclosure.t0, zero.value, one.value};
        ledgers_pass = ledgers_pass
            && models::ledger::evaluate(ledger_input, &ledger_output,
                                         &ledger_result)
            && ledger_result.accepted && ledger_result.models_validated == 1U;
    }
    checks.push_back(ledgers_pass);
    checks.push_back(neutral(result) && !result.midpoint_acceptance_used
                     && !result.signed_remainder_cancellation_used);

    auto blocked = input;
    blocked.gevrey.margins.predecessor_c08_003_passed = false;
    models::Result blocked_result{};
    checks.push_back(!models::evaluate(blocked, &output, &blocked_result)
                     && !blocked_result.accepted);
    models::Result null_output_result{};
    checks.push_back(!models::evaluate(input, nullptr, &null_output_result));
    checks.push_back(!models::evaluate(input, &output, nullptr));

    models::Output replay;
    models::Result replay_result{};
    checks.push_back(models::evaluate(input, &replay, &replay_result)
                     && replay_result.accepted
                     && replay_result.model_coefficient_balls
                        == result.model_coefficient_balls
                     && arb_equal(replay.model(models::State::B).coefficient(128U, 0U),
                                  b.coefficient(128U, 0U))
                     && arb_equal(replay.model(models::State::J2).remainder(12U),
                                  j2.remainder(12U))
                     && neutral(replay_result));

    std::size_t passed = 0U;
    for (const bool check : checks) passed += check ? 1U : 0U;
    std::cout << "{\"schema\":\"nhm2.g2h_e_s5.c08_origin_models_fixture.v1\""
              << ",\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL") << "\""
              << ",\"checks_passed\":" << passed
              << ",\"checks_total\":" << checks.size()
              << ",\"selected_order\":" << result.selected_origin_order
              << ",\"model_coefficients\":" << result.model_coefficient_balls
              << ",\"model_remainders\":" << result.model_remainder_balls
              << ",\"endpoint_checks\":" << result.endpoint_containment_checks
              << ",\"candidate_evaluations\":0,\"positive_parameter_samples\":0"
              << ",\"candidate_roots_created\":false"
              << ",\"scientific_handler_linked\":false"
              << ",\"authority_promoted\":false}\n";
    return passed == checks.size() ? 0 : 1;
}
