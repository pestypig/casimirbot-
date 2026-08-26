#include "mini_boson_star_primary_c08_margins_v1.hpp"

#include <arb.h>
#include <flint/fmpq.h>

#include <cstdint>
#include <iostream>
#include <string>
#include <vector>

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
        for (auto &value : values) {
            arb_init(&value);
            arb_indeterminate(&value);
        }
    }
    ~Storage() { for (auto &value : values) arb_clear(&value); }
    std::vector<arb_struct> values;
};

void rational(arb_t value, long numerator, long denominator) {
    fmpq_t q;
    fmpq_init(q);
    fmpq_set_si(q, numerator, denominator);
    arb_set_fmpq(value, q, 512);
    fmpq_clear(q);
}

identity::InputIdentity make_identity(identity::Chart chart, std::uint32_t cell,
                                      long nodes, Storage &storage) {
    return {kGrowthHash, kJetHash, kGridHash, kAbiHash, chart, cell, nodes,
            storage.values.size(), storage.values.data()};
}

bool rejected(margins::Input input, margins::FailureDetail detail) {
    margins::Output output;
    margins::Result result{};
    return !margins::evaluate(input, &output, &result)
        && !result.accepted && result.detail == detail
        && result.state_coefficients_read == 0U
        && result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created && !result.scientific_handler_linked
        && !result.authority_promoted;
}

bool equal_rational(const arb_t value, long numerator, long denominator) {
    Ball expected;
    rational(expected.value, numerator, denominator);
    return arb_equal(value, expected.value) != 0;
}

}  // namespace

int main() {
    std::vector<bool> checks;
    Storage positive_storage(514U);
    Storage vacuum_storage(2049U);
    auto positive_identity = make_identity(identity::Chart::positive, 1U, 64L,
                                           positive_storage);
    auto vacuum_identity = make_identity(identity::Chart::vacuum, 0U, 256L,
                                         vacuum_storage);

    Ball h0, kappa, theta2, eta;
    arb_one(h0.value);
    rational(kappa.value, 1L, 2L);
    rational(theta2.value, 1L, 4L);
    arb_indeterminate(eta.value);  // positive chart must not inspect eta
    margins::Input positive{&positive_identity, true, h0.value, kappa.value,
                            theta2.value, eta.value};
    margins::Output positive_output;
    margins::Result positive_result{};
    checks.push_back(margins::evaluate(positive, &positive_output, &positive_result)
        && positive_result.accepted
        && positive_result.detail == margins::FailureDetail::none);
    checks.push_back(equal_rational(positive_output.mu, 1L, 4L)
        && equal_rational(positive_output.mu_upper, 1L, 4L)
        && equal_rational(positive_output.g, 509L, 2L));
    checks.push_back(equal_rational(positive_output.beta, -3L, 4L)
        && equal_rational(positive_output.two_kappa, 1L, 1L)
        && equal_rational(positive_output.formal_metric_margin, 509L, 510L));
    checks.push_back(equal_rational(positive_output.sigma0, 517L, 16L)
        && equal_rational(positive_output.tau2, 1531L, 8L)
        && equal_rational(positive_output.delta, 509L, 8L));
    bool gaps = true;
    for (const auto &gap : positive_output.internal_gaps) {
        gaps = gaps && equal_rational(&gap, 509L, 16L);
    }
    checks.push_back(gaps);
    checks.push_back(equal_rational(positive_output.carrier_a + 0, 1L, 2L)
        && equal_rational(positive_output.carrier_a + 1, 1L, 1L)
        && equal_rational(positive_output.carrier_a + 2, 1L, 1L)
        && equal_rational(positive_output.carrier_b + 0, -3L, 4L)
        && equal_rational(positive_output.carrier_b + 1, 1L, 2L)
        && equal_rational(positive_output.carrier_b + 2, -1L, 2L));
    checks.push_back(positive_result.directed_parameter_boxes == 3U
        && positive_result.strict_denominator_margins == 4U
        && positive_result.strict_growth_margins == 8U
        && positive_result.mu_upper_used
        && !positive_result.midpoint_acceptance_used
        && positive_result.state_coefficients_read == 0U);
    checks.push_back(positive_result.candidate_evaluations == 0U
        && positive_result.positive_parameter_samples == 0U
        && !positive_result.candidate_root_created
        && !positive_result.scientific_handler_linked
        && !positive_result.authority_promoted);

    rational(eta.value, 1L, 2L);
    margins::Input vacuum{&vacuum_identity, true, h0.value, kappa.value,
                          theta2.value, eta.value};
    margins::Output vacuum_output;
    margins::Result vacuum_result{};
    checks.push_back(margins::evaluate(vacuum, &vacuum_output, &vacuum_result)
        && vacuum_result.accepted);
    checks.push_back(equal_rational(vacuum_output.mu, 1L, 8L)
        && equal_rational(vacuum_output.mu_upper, 1L, 8L)
        && equal_rational(vacuum_output.g, 1019L, 4L)
        && equal_rational(vacuum_output.beta, -5L, 8L));

    auto blocked = positive;
    blocked.predecessor_c08_003_passed = false;
    checks.push_back(rejected(blocked, margins::FailureDetail::predecessor_not_passed));
    auto missing_identity = positive;
    missing_identity.identity = nullptr;
    checks.push_back(rejected(missing_identity, margins::FailureDetail::missing_input_or_output));
    margins::Result missing_output_result{};
    checks.push_back(!margins::evaluate(positive, nullptr, &missing_output_result)
        && missing_output_result.detail == margins::FailureDetail::missing_input_or_output);
    checks.push_back(!margins::evaluate(positive, &positive_output, nullptr));

    auto bad_chart_identity = positive_identity;
    bad_chart_identity.chart = static_cast<identity::Chart>(2U);
    auto bad_chart = positive;
    bad_chart.identity = &bad_chart_identity;
    checks.push_back(rejected(bad_chart, margins::FailureDetail::invalid_chart));
    Ball zero, indeterminate;
    arb_zero(zero.value);
    arb_indeterminate(indeterminate.value);
    auto bad_h0 = positive;
    bad_h0.h0 = zero.value;
    checks.push_back(rejected(bad_h0,
        margins::FailureDetail::h0_nonfinite_or_nonpositive));
    bad_h0.h0 = indeterminate.value;
    checks.push_back(rejected(bad_h0,
        margins::FailureDetail::h0_nonfinite_or_nonpositive));
    auto bad_kappa = positive;
    bad_kappa.kappa = zero.value;
    checks.push_back(rejected(bad_kappa,
        margins::FailureDetail::kappa_nonfinite_or_nonpositive));
    bad_kappa.kappa = indeterminate.value;
    checks.push_back(rejected(bad_kappa,
        margins::FailureDetail::kappa_nonfinite_or_nonpositive));
    auto bad_theta = positive;
    bad_theta.theta2 = indeterminate.value;
    checks.push_back(rejected(bad_theta, margins::FailureDetail::theta2_nonfinite));

    auto missing_eta = vacuum;
    missing_eta.eta = nullptr;
    checks.push_back(rejected(missing_eta,
        margins::FailureDetail::eta_missing_nonfinite_or_negative));
    Ball negative;
    arb_set_si(negative.value, -1L);
    auto bad_eta = vacuum;
    bad_eta.eta = negative.value;
    checks.push_back(rejected(bad_eta,
        margins::FailureDetail::eta_missing_nonfinite_or_negative));
    bad_eta.eta = indeterminate.value;
    checks.push_back(rejected(bad_eta,
        margins::FailureDetail::eta_missing_nonfinite_or_negative));
    auto negative_mu = positive;
    negative_mu.theta2 = negative.value;
    checks.push_back(rejected(negative_mu,
        margins::FailureDetail::mu_nonfinite_or_negative));

    Ball unsafe_upper;
    arb_set_si(unsafe_upper.value, 127L);
    arb_add_error_2exp_si(unsafe_upper.value, -1L);  // upper endpoint is 127.5
    auto midpoint_trap = positive;
    midpoint_trap.theta2 = unsafe_upper.value;
    checks.push_back(rejected(midpoint_trap,
        margins::FailureDetail::formal_metric_or_laplace_gap_nonpositive));
    Ball safe_upper;
    arb_set_si(safe_upper.value, 127L);
    arb_add_error_2exp_si(safe_upper.value, -2L);  // upper endpoint is 127.25
    auto near_boundary = positive;
    near_boundary.theta2 = safe_upper.value;
    margins::Output boundary_output;
    margins::Result boundary_result{};
    checks.push_back(margins::evaluate(near_boundary, &boundary_output, &boundary_result)
        && boundary_result.accepted && boundary_result.mu_upper_used
        && arb_is_positive(boundary_output.g));

    Ball touching_kappa;
    rational(touching_kappa.value, 1L, 2L);
    arb_add_error_2exp_si(touching_kappa.value, -1L);
    auto touching_denominator = positive;
    touching_denominator.kappa = touching_kappa.value;
    checks.push_back(rejected(touching_denominator,
        margins::FailureDetail::kappa_nonfinite_or_nonpositive));
    checks.push_back(std::string(margins::failure_detail_name(
        margins::FailureDetail::formal_metric_or_laplace_gap_nonpositive))
        == "C08-004_FORMAL_METRIC_OR_LAPLACE_GAP_NONPOSITIVE");

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
        << ",\"midpoint_acceptance_used\":false,\"positive_parameter_samples\":0,"
        "\"schema\":\"nhm2.g2h_e_s5.primary_c08_margins_fixture.v1\","
        "\"scientific_handler_linked\":false,\"state_coefficients_read\":0,"
        "\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL") << "\"}\n";
    return passed == checks.size() ? 0 : 1;
}
