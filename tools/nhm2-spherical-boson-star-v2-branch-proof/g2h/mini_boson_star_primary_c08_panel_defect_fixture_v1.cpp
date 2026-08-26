#include "mini_boson_star_primary_c08_panel_defect_v1.hpp"

#include <arb.h>
#include <flint/fmpq.h>

#include <cstdint>
#include <iostream>
#include <string>
#include <vector>

namespace defect = nhm2::g2h_e_s5::primary_c08_panel_defect_v1;
namespace panel = nhm2::g2h_e_s5::primary_c08_positive_panel_v1;
namespace margins = nhm2::g2h_e_s5::primary_c08_margins_v1;
namespace identity = nhm2::g2h_e_s5::primary_c08_identity_v1;

namespace {

constexpr char kGrowthHash[] = "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737";
constexpr char kJetHash[] = "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc";
constexpr char kGridHash[] = "cd98fb110a6d0d94cd69d1134e8f5233444ea34f7894bc14333075d0dfa5013c";
constexpr char kAbiHash[] = "6fbf6cdbb80e6da390c84f6d87f13f37f2b81b2226bf937cbcfd2c8aff3911ca";

struct Ball {
    Ball() { arb_init(value); }
    ~Ball() { arb_clear(value); }
    arb_t value;
};

struct Storage {
    explicit Storage(std::size_t count) : values(count) {
        for (auto &value : values) { arb_init(&value); arb_indeterminate(&value); }
    }
    ~Storage() { for (auto &value : values) arb_clear(&value); }
    std::vector<arb_struct> values;
};

void rational(arb_t value, long numerator, long denominator) {
    fmpq_t q;
    fmpq_init(q); fmpq_set_si(q, numerator, denominator);
    arb_set_fmpq(value, q, 512); fmpq_clear(q);
}

identity::InputIdentity make_identity(identity::Chart chart, std::uint32_t cell,
                                      long nodes, Storage &storage) {
    return {kGrowthHash, kJetHash, kGridHash, kAbiHash, chart, cell, nodes,
            storage.values.size(), storage.values.data()};
}

bool neutral(const defect::Result &result) {
    return result.state_coefficients_read == 0U
        && result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created && !result.scientific_handler_linked
        && !result.authority_promoted;
}

bool rejected(defect::Input input, defect::FailureDetail detail) {
    defect::Output output;
    defect::Result result{};
    return !defect::evaluate(input, &output, &result)
        && !result.accepted && result.detail == detail && neutral(result);
}

bool finite_nonnegative_magnitudes(const defect::Output &output) {
    for (std::size_t state = 0; state < defect::kStateCount; ++state)
        for (std::size_t jet = 0; jet < defect::kJetCount; ++jet)
            if (!arb_is_finite(output.magnitude(state, jet))
                || arb_is_negative(output.magnitude(state, jet))) return false;
    return true;
}

bool low_order_contains_zero(const defect::Output &output) {
    for (unsigned degree = 0U; degree < output.generated_order; ++degree)
        for (std::size_t state = 0; state < defect::kStateCount; ++state)
            for (std::size_t jet = 0; jet < defect::kJetCount; ++jet)
                if (!arb_contains_zero(output.coefficient(degree, state, jet)))
                    return false;
    return true;
}

bool has_nonzero_truncation_defect(const defect::Output &output) {
    for (std::size_t state = 0; state < defect::kStateCount; ++state)
        for (std::size_t jet = 0; jet < defect::kJetCount; ++jet)
            if (arb_is_positive(output.magnitude(state, jet))) return true;
    return false;
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
    defect::Input positive{{{{positive_margins}}, target.value, 24U, 0U}};
    defect::Output positive_output;
    defect::Result positive_result{};
    checks.push_back(defect::evaluate(positive, &positive_output, &positive_result)
        && positive_result.accepted
        && positive_result.detail == defect::FailureDetail::none
        && neutral(positive_result));
    checks.push_back(positive_output.generated_order == 24U
        && positive_output.maximum_defect_degree == 26U
        && positive_result.requested_order == 24U
        && positive_result.panel_halvings == 0U);
    checks.push_back(positive_result.low_order_zero_containment_checks == 1248U
        && positive_result.complete_defect_coefficient_balls == 1404U
        && positive_result.full_panel_magnitude_bounds == 52U);
    checks.push_back(low_order_contains_zero(positive_output));
    checks.push_back(finite_nonnegative_magnitudes(positive_output)
        && has_nonzero_truncation_defect(positive_output)
        && !positive_output.all_exact_zero);
    checks.push_back(positive_result.denominator_guards_replayed
        && positive_result.exact_zero_branch_exercised
        && positive_result.exact_zero_replay_passed
        && positive_result.complete_interval_range_used);
    checks.push_back(!positive_result.signed_cancellation_used
        && !positive_result.panel_accepted
        && !positive_result.picard_inclusion_performed
        && !positive_result.midpoint_acceptance_used);

    Ball mbar;
    rational(mbar.value, 1L, 2L); rational(eta.value, 1L, 2L);
    margins::Input vacuum_margins{&vacuum_identity, true, h0.value,
                                  kappa.value, mbar.value, eta.value};
    defect::Input vacuum{{{{vacuum_margins}}, target.value, 24U, 0U}};
    defect::Output vacuum_output;
    defect::Result vacuum_result{};
    checks.push_back(defect::evaluate(vacuum, &vacuum_output, &vacuum_result)
        && low_order_contains_zero(vacuum_output)
        && finite_nonnegative_magnitudes(vacuum_output)
        && neutral(vacuum_result));

    auto half = positive;
    half.panel.panel_halvings = 1U;
    defect::Output half_output;
    defect::Result half_result{};
    checks.push_back(defect::evaluate(half, &half_output, &half_result)
        && half_result.panel_halvings == 1U
        && low_order_contains_zero(half_output) && neutral(half_result));

    auto cap = positive;
    cap.panel.requested_order = 192U;
    defect::Output cap_output;
    defect::Result cap_result{};
    checks.push_back(defect::evaluate(cap, &cap_output, &cap_result)
        && cap_output.generated_order == 192U
        && cap_output.maximum_defect_degree == 194U
        && cap_result.low_order_zero_containment_checks == 9984U
        && cap_result.complete_defect_coefficient_balls == 10140U
        && low_order_contains_zero(cap_output)
        && finite_nonnegative_magnitudes(cap_output) && neutral(cap_result));

    auto blocked = positive;
    blocked.panel.origin.gevrey.margins.predecessor_c08_003_passed = false;
    checks.push_back(rejected(blocked,
                              defect::FailureDetail::predecessor_not_passed));
    auto invalid_order = positive;
    invalid_order.panel.requested_order = 25U;
    checks.push_back(rejected(invalid_order,
                              defect::FailureDetail::predecessor_not_passed));
    auto exhausted_halving = positive;
    exhausted_halving.panel.panel_halvings = 33U;
    checks.push_back(rejected(exhausted_halving,
                              defect::FailureDetail::predecessor_not_passed));
    auto missing_identity = positive;
    missing_identity.panel.origin.gevrey.margins.identity = nullptr;
    checks.push_back(rejected(missing_identity,
                              defect::FailureDetail::predecessor_not_passed));
    Ball nonfinite;
    arb_indeterminate(nonfinite.value);
    auto corrupt = positive;
    corrupt.panel.origin.gevrey.margins.theta2 = nonfinite.value;
    checks.push_back(rejected(corrupt,
                              defect::FailureDetail::predecessor_not_passed));
    defect::Result missing_output_result{};
    checks.push_back(!defect::evaluate(positive, nullptr, &missing_output_result)
        && missing_output_result.detail == defect::FailureDetail::missing_output
        && neutral(missing_output_result));
    checks.push_back(!defect::evaluate(positive, &positive_output, nullptr));
    checks.push_back(std::string(defect::failure_detail_name(
        defect::FailureDetail::exact_zero_replay_failed))
        == "C08-008_PANEL_DEFECT_OR_EXACT_ZERO_REPLAY");
    checks.push_back(defect::kMaximumPanelOrder == 192U
        && defect::kMaximumDefectDegree == 194U
        && defect::kStateCount == 4U && defect::kJetCount == 13U);

    std::size_t passed = 0U;
    std::uint64_t mask = 0U;
    for (std::size_t index = 0; index < checks.size(); ++index) {
        if (checks[index]) {
            ++passed;
            if (index < 64U) mask |= std::uint64_t{1} << index;
        }
    }
    std::cout << "{\"authority_promoted\":false,\"candidate_evaluations\":0,"
        "\"candidate_roots_created\":false,\"checks_passed\":" << passed
        << ",\"checks_total\":" << checks.size() << ",\"fixture_mask\":" << mask
        << ",\"midpoint_acceptance_used\":false,\"panel_accepted\":false,"
        "\"picard_inclusion_performed\":false,\"positive_parameter_samples\":0,"
        "\"schema\":\"nhm2.g2h_e_s5.primary_c08_panel_defect_fixture.v1\","
        "\"scientific_handler_linked\":false,\"state_coefficients_read\":0,"
        "\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL")
        << "\"}\n";
    return passed == checks.size() ? 0 : 1;
}
