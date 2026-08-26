#include "mini_boson_star_primary_c08_picard_v1.hpp"

#include <arb.h>
#include <flint/fmpq.h>

#include <cstdint>
#include <iostream>
#include <string>
#include <vector>

namespace picard = nhm2::g2h_e_s5::primary_c08_picard_v1;
namespace margins = nhm2::g2h_e_s5::primary_c08_margins_v1;
namespace identity = nhm2::g2h_e_s5::primary_c08_identity_v1;

namespace {
constexpr char kGrowthHash[] = "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737";
constexpr char kJetHash[] = "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc";
constexpr char kGridHash[] = "cd98fb110a6d0d94cd69d1134e8f5233444ea34f7894bc14333075d0dfa5013c";
constexpr char kAbiHash[] = "6fbf6cdbb80e6da390c84f6d87f13f37f2b81b2226bf937cbcfd2c8aff3911ca";

struct Ball { Ball() { arb_init(value); } ~Ball() { arb_clear(value); } arb_t value; };
struct Storage {
    explicit Storage(std::size_t count) : values(count) {
        for (auto &value : values) { arb_init(&value); arb_indeterminate(&value); }
    }
    ~Storage() { for (auto &value : values) arb_clear(&value); }
    std::vector<arb_struct> values;
};
void rational(arb_t value, long numerator, long denominator) {
    fmpq_t q; fmpq_init(q); fmpq_set_si(q, numerator, denominator);
    arb_set_fmpq(value, q, 512); fmpq_clear(q);
}
identity::InputIdentity make_identity(identity::Chart chart, std::uint32_t cell,
                                      long nodes, Storage &storage) {
    return {kGrowthHash, kJetHash, kGridHash, kAbiHash, chart, cell, nodes,
            storage.values.size(), storage.values.data()};
}
bool neutral(const picard::Result &result) {
    return result.state_coefficients_read == 0U
        && result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created && !result.scientific_handler_linked
        && !result.authority_promoted;
}
bool strict_output(const picard::Output &output) {
    if (!arb_is_positive(output.common_remainder_radius)) return false;
    for (std::size_t state = 0; state < picard::kStateCount; ++state)
        for (std::size_t jet = 0; jet < picard::kJetCount; ++jet)
            if (!arb_is_finite(output.remainder(state, jet))
                || !arb_is_positive(output.margin(state, jet))) return false;
    return true;
}
bool rejected(picard::Input input, picard::FailureDetail detail) {
    picard::Output output; picard::Result result{};
    return !picard::evaluate(input, &output, &result)
        && result.detail == detail && neutral(result);
}
}  // namespace

int main() {
    std::vector<bool> checks;
    Storage positive_storage(514U), vacuum_storage(2049U);
    auto positive_identity = make_identity(identity::Chart::positive, 1U, 64L,
                                           positive_storage);
    auto vacuum_identity = make_identity(identity::Chart::vacuum, 0U, 256L,
                                         vacuum_storage);
    Ball h0, kappa, mass, eta, target;
    arb_one(h0.value); rational(kappa.value, 1L, 2L);
    rational(mass.value, 1L, 4L); arb_indeterminate(eta.value);
    arb_set_ui(target.value, 2UL);
    margins::Input positive_margins{&positive_identity, true, h0.value,
                                    kappa.value, mass.value, eta.value};
    picard::Input positive{{{positive_margins}}, target.value};
    picard::Output positive_output; picard::Result positive_result{};
    const bool positive_ok = picard::evaluate(positive, &positive_output,
                                               &positive_result);
    checks.push_back(positive_ok && positive_result.accepted
        && positive_result.detail == picard::FailureDetail::none
        && neutral(positive_result));
    checks.push_back(positive_output.accepted_order >= 24U
        && positive_output.accepted_order <= 192U
        && positive_output.accepted_panel_halvings <= 32U
        && positive_output.accepted_inflation_exponent >= 1U
        && positive_output.accepted_inflation_exponent <= 16U);
    checks.push_back(positive_result.first_passing_order_used
        && positive_result.first_passing_inflation_used
        && positive_result.complete_parameter_box_used
        && positive_result.component_weights_all_one);
    checks.push_back(positive_result.picard_inclusion_performed
        && positive_result.panel_accepted
        && !positive_result.signed_cancellation_used
        && !positive_result.midpoint_acceptance_used);
    checks.push_back(positive_result.strict_component_checks >= 52U
        && positive_result.numerical_width_checks == 52U
        && strict_output(positive_output));

    Ball mbar; rational(mbar.value, 1L, 2L); rational(eta.value, 1L, 2L);
    margins::Input vacuum_margins{&vacuum_identity, true, h0.value,
                                  kappa.value, mbar.value, eta.value};
    picard::Input vacuum{{{vacuum_margins}}, target.value};
    picard::Output vacuum_output; picard::Result vacuum_result{};
    checks.push_back(picard::evaluate(vacuum, &vacuum_output, &vacuum_result)
        && strict_output(vacuum_output) && neutral(vacuum_result));

    auto blocked = positive;
    blocked.origin.gevrey.margins.predecessor_c08_003_passed = false;
    checks.push_back(rejected(blocked,
                              picard::FailureDetail::predecessor_not_passed));
    auto missing_identity = positive;
    missing_identity.origin.gevrey.margins.identity = nullptr;
    checks.push_back(rejected(missing_identity,
                              picard::FailureDetail::predecessor_not_passed));
    Ball early; rational(early.value, 1L, 1024L);
    auto invalid_target = positive; invalid_target.target_endpoint = early.value;
    checks.push_back(rejected(invalid_target,
                              picard::FailureDetail::predecessor_not_passed));
    picard::Result missing_output_result{};
    checks.push_back(!picard::evaluate(positive, nullptr, &missing_output_result)
        && missing_output_result.detail == picard::FailureDetail::missing_output
        && neutral(missing_output_result));
    checks.push_back(!picard::evaluate(positive, &positive_output, nullptr));
    checks.push_back(std::string(picard::failure_detail_name(
        picard::FailureDetail::picard_inflation_or_width_exhaustion))
        == "C08-009_PICARD_INFLATION_OR_WIDTH_EXHAUSTION");
    checks.push_back(picard::kOrderCandidateCount == 7U
        && picard::kMaximumPanelOrder == 192U
        && picard::kMaximumPanelHalvings == 32U
        && picard::kMaximumInflationExponent == 16U
        && picard::kStateCount == 4U && picard::kJetCount == 13U);

    std::size_t passed = 0U; std::uint64_t mask = 0U;
    for (std::size_t index = 0; index < checks.size(); ++index)
        if (checks[index]) { ++passed; mask |= std::uint64_t{1} << index; }
    std::cout << "{\"accepted_inflation_exponent\":"
        << positive_output.accepted_inflation_exponent
        << ",\"accepted_order\":" << positive_output.accepted_order
        << ",\"accepted_panel_halvings\":"
        << positive_output.accepted_panel_halvings
        << ",\"complete_parameter_box_used\":"
        << (positive_result.complete_parameter_box_used ? "true" : "false")
        << ",\"component_weights_all_one\":"
        << (positive_result.component_weights_all_one ? "true" : "false")
        << ",\"detail\":\""
        << picard::failure_detail_name(positive_result.detail)
        << "\",\"strict_component_checks\":"
        << positive_result.strict_component_checks
        << ",\"numerical_width_checks\":"
        << positive_result.numerical_width_checks
        << ",\"authority_promoted\":false,\"candidate_evaluations\":0,"
        "\"candidate_roots_created\":false,\"checks_passed\":" << passed
        << ",\"checks_total\":" << checks.size() << ",\"fixture_mask\":" << mask
        << ",\"midpoint_acceptance_used\":false,"
        "\"panel_accepted\":"
        << (positive_result.panel_accepted ? "true" : "false")
        << ",\"picard_inclusion_performed\":"
        << (positive_result.picard_inclusion_performed ? "true" : "false")
        << ","
        "\"positive_parameter_samples\":0,"
        "\"schema\":\"nhm2.g2h_e_s5.primary_c08_picard_fixture.v1\","
        "\"scientific_handler_linked\":false,\"state_coefficients_read\":0,"
        "\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL")
        << "\"}\n";
    return passed == checks.size() ? 0 : 1;
}
