#include "mini_boson_star_primary_c08_positive_panel_v1.hpp"

#include <arb.h>
#include <flint/fmpq.h>

#include <cstdint>
#include <iostream>
#include <string>
#include <vector>

namespace panel = nhm2::g2h_e_s5::primary_c08_positive_panel_v1;
namespace origin = nhm2::g2h_e_s5::primary_c08_origin_series_v1;
namespace margins = nhm2::g2h_e_s5::primary_c08_margins_v1;
namespace identity = nhm2::g2h_e_s5::primary_c08_identity_v1;

namespace {

constexpr char kGrowthHash[] = "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737";
constexpr char kJetHash[] = "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc";
constexpr char kGridHash[] = "cd98fb110a6d0d94cd69d1134e8f5233444ea34f7894bc14333075d0dfa5013c";
constexpr char kAbiHash[] = "6fbf6cdbb80e6da390c84f6d87f13f37f2b81b2226bf937cbcfd2c8aff3911ca";
constexpr std::size_t kParameterCount = 3U;
constexpr std::size_t first_index(std::size_t a) { return 1U + a; }
constexpr std::size_t second_index(std::size_t a, std::size_t b) {
    return 4U + kParameterCount * a + b;
}

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
    arb_set_fmpq(value, q, 512); fmpq_clear(q);
}

bool equal_rational(arb_srcptr value, long numerator, long denominator) {
    Ball expected;
    rational(expected.value, numerator, denominator);
    return arb_equal(value, expected.value) != 0;
}

identity::InputIdentity make_identity(identity::Chart chart, std::uint32_t cell,
                                      long nodes, Storage &storage) {
    return {kGrowthHash, kJetHash, kGridHash, kAbiHash, chart, cell, nodes,
            storage.values.size(), storage.values.data()};
}

bool neutral(const panel::Result &result) {
    return result.state_coefficients_read == 0U
        && result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created && !result.scientific_handler_linked
        && !result.authority_promoted;
}

bool rejected(panel::Input input, panel::FailureDetail detail) {
    panel::Output output;
    panel::Result result{};
    return !panel::evaluate(input, &output, &result)
        && !result.accepted && result.detail == detail && neutral(result);
}

bool all_finite(const panel::Output &output) {
    if (!arb_is_finite(output.left_endpoint)
        || !arb_is_finite(output.panel_width)
        || !arb_is_finite(output.right_endpoint)
        || !arb_is_finite(output.t_panel)
        || !arb_is_finite(output.t_plus_two_kappa_panel)
        || !arb_is_finite(output.scalar_p2_panel)) return false;
    for (unsigned order = 0; order <= output.generated_order; ++order)
        for (std::size_t state = 0; state < panel::kStateCount; ++state)
            for (std::size_t jet = 0; jet < panel::kJetCount; ++jet)
                if (!arb_is_finite(output.at(order, state, jet))) return false;
    for (const auto &polynomial : output.equation_polynomials)
        for (const auto &degree : polynomial)
            for (const auto &component : degree)
                if (!arb_is_finite(&component)) return false;
    return true;
}

bool ordered_hessian_symmetry(const panel::Output &output) {
    for (unsigned order = 0; order <= output.generated_order; ++order) {
        for (std::size_t state = 0; state < panel::kStateCount; ++state) {
            for (std::size_t a = 0; a < kParameterCount; ++a) {
                for (std::size_t b = a + 1U; b < kParameterCount; ++b) {
                    if (!arb_overlaps(output.at(order, state, second_index(a, b)),
                                      output.at(order, state, second_index(b, a))))
                        return false;
                }
            }
        }
    }
    return true;
}

bool initial_and_derivative_compatibility(
    const panel::Output &output, const origin::Output &origin_output) {
    const std::size_t states[panel::kStateCount] = {
        static_cast<std::size_t>(origin::TailKind::B),
        static_cast<std::size_t>(origin::TailKind::V),
        static_cast<std::size_t>(origin::TailKind::J1),
        static_cast<std::size_t>(origin::TailKind::J2),
    };
    for (std::size_t state = 0; state < panel::kStateCount; ++state)
        for (std::size_t jet = 0; jet < panel::kJetCount; ++jet)
            if (!arb_equal(output.at(0U, state, jet),
                           origin_output.enclosed_values[jet] + states[state]))
                return false;
    for (std::size_t jet = 0; jet < panel::kJetCount; ++jet) {
        if (!arb_overlaps(output.at(1U, static_cast<std::size_t>(panel::State::B), jet),
                          output.at(0U, static_cast<std::size_t>(panel::State::V), jet)))
            return false;
        if (!arb_overlaps(output.at(1U, static_cast<std::size_t>(panel::State::J1), jet),
                          output.at(0U, static_cast<std::size_t>(panel::State::B), jet)))
            return false;
        if (!arb_overlaps(output.at(1U, static_cast<std::size_t>(panel::State::J2), jet),
                          output.at(0U, static_cast<std::size_t>(panel::State::J1), jet)))
            return false;
        if (!arb_overlaps(output.at(1U, static_cast<std::size_t>(panel::State::V), jet),
                          origin_output.enclosed_values[jet]
                              + static_cast<std::size_t>(origin::TailKind::B_second)))
            return false;
    }
    return true;
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
    panel::Input positive{{{positive_margins}}, target.value, 24U, 0U};
    panel::Output positive_output;
    panel::Result positive_result{};
    const bool positive_accepted =
        panel::evaluate(positive, &positive_output, &positive_result);
    checks.push_back(positive_accepted
        && positive_result.accepted
        && positive_result.detail == panel::FailureDetail::none
        && neutral(positive_result));
    checks.push_back(positive_output.generated_order == 24U
        && positive_result.requested_order == 24U
        && positive_output.panel_halvings == 0U
        && positive_result.panel_halvings == 0U);
    checks.push_back(equal_rational(positive_output.left_endpoint, 1L, 512L)
        && equal_rational(positive_output.panel_width, 1L, 2048L)
        && equal_rational(positive_output.right_endpoint, 5L, 2048L));
    checks.push_back(arb_is_positive(positive_output.t_panel)
        && arb_is_positive(positive_output.t_plus_two_kappa_panel)
        && arb_is_positive(positive_output.scalar_p2_panel)
        && positive_result.strict_denominator_margins == 4U);
    checks.push_back(positive_result.equation_polynomial_balls == 195U
        && positive_result.taylor_coefficient_balls == 1300U
        && positive_result.origin_derivative_compatibility_checks == 13U
        && positive_result.ordered_mixed_orientations == 600U);
    checks.push_back(positive_result.exact_power_series_algebra_used
        && positive_result.directed_denominator_bounds_used
        && !positive_result.midpoint_acceptance_used);
    checks.push_back(all_finite(positive_output)
        && ordered_hessian_symmetry(positive_output));

    const std::size_t p2 = static_cast<std::size_t>(
        panel::EquationPolynomial::P2);
    checks.push_back(equal_rational(positive_output.equation_polynomials[p2][0],
                                    513L, 262144L)
        && equal_rational(positive_output.equation_polynomials[p2][1],
                          257L, 256L)
        && equal_rational(positive_output.equation_polynomials[p2][2], 1L, 1L));
    checks.push_back(equal_rational(
        positive_output.equation_polynomials[p2][0] + first_index(1U),
        1L, 256L)
        && equal_rational(
            positive_output.equation_polynomials[p2][1] + first_index(1U),
            2L, 1L)
        && arb_is_zero(
            positive_output.equation_polynomials[p2][2] + first_index(1U)));
    origin::Output positive_origin_output;
    origin::Result positive_origin_result{};
    const bool positive_origin_accepted = origin::evaluate(
        positive.origin, &positive_origin_output, &positive_origin_result);
    checks.push_back(positive_origin_accepted
        && initial_and_derivative_compatibility(positive_output,
                                                positive_origin_output));

    auto half_panel = positive;
    half_panel.panel_halvings = 1U;
    panel::Output half_output;
    panel::Result half_result{};
    checks.push_back(panel::evaluate(half_panel, &half_output, &half_result)
        && equal_rational(half_output.panel_width, 1L, 4096L)
        && equal_rational(half_output.right_endpoint, 9L, 4096L)
        && half_result.panel_halvings == 1U && neutral(half_result));

    Ball mbar;
    rational(mbar.value, 1L, 2L); rational(eta.value, 1L, 2L);
    margins::Input vacuum_margins{&vacuum_identity, true, h0.value,
                                  kappa.value, mbar.value, eta.value};
    panel::Input vacuum{{{vacuum_margins}}, target.value, 24U, 0U};
    panel::Output vacuum_output;
    panel::Result vacuum_result{};
    checks.push_back(panel::evaluate(vacuum, &vacuum_output, &vacuum_result)
        && vacuum_result.accepted && all_finite(vacuum_output)
        && ordered_hessian_symmetry(vacuum_output) && neutral(vacuum_result));

    auto cap_order = positive;
    cap_order.requested_order = 192U;
    panel::Output cap_output;
    panel::Result cap_result{};
    checks.push_back(panel::evaluate(cap_order, &cap_output, &cap_result)
        && cap_output.generated_order == 192U
        && cap_result.taylor_coefficient_balls == 10036U
        && all_finite(cap_output) && neutral(cap_result));

    auto blocked = positive;
    blocked.origin.gevrey.margins.predecessor_c08_003_passed = false;
    checks.push_back(rejected(blocked, panel::FailureDetail::predecessor_not_passed));
    auto missing_identity = positive;
    missing_identity.origin.gevrey.margins.identity = nullptr;
    checks.push_back(rejected(missing_identity,
                              panel::FailureDetail::predecessor_not_passed));
    panel::Result missing_output_result{};
    checks.push_back(!panel::evaluate(positive, nullptr, &missing_output_result)
        && missing_output_result.detail == panel::FailureDetail::missing_output
        && neutral(missing_output_result));
    checks.push_back(!panel::evaluate(positive, &positive_output, nullptr));

    auto invalid_order = positive;
    invalid_order.requested_order = 25U;
    checks.push_back(rejected(invalid_order,
                              panel::FailureDetail::order_not_in_frozen_schedule));
    auto exhausted_halving = positive;
    exhausted_halving.panel_halvings = 33U;
    checks.push_back(rejected(exhausted_halving,
                              panel::FailureDetail::panel_halving_exhaustion));
    Ball early_target;
    rational(early_target.value, 1L, 1024L);
    auto invalid_target = positive;
    invalid_target.target_endpoint = early_target.value;
    checks.push_back(rejected(invalid_target,
                              panel::FailureDetail::target_endpoint_invalid));
    Ball nonexact_target;
    arb_set_ui(nonexact_target.value, 2UL);
    arb_add_error_2exp_si(nonexact_target.value, -240L);
    auto nonexact = positive;
    nonexact.target_endpoint = nonexact_target.value;
    checks.push_back(rejected(nonexact,
                              panel::FailureDetail::target_endpoint_invalid));
    Ball nonfinite;
    arb_indeterminate(nonfinite.value);
    auto corrupt = positive;
    corrupt.origin.gevrey.margins.theta2 = nonfinite.value;
    checks.push_back(rejected(corrupt, panel::FailureDetail::predecessor_not_passed));
    checks.push_back(std::string(panel::failure_detail_name(
        panel::FailureDetail::positive_panel_denominator_or_coefficient))
        == "C08-007_POSITIVE_PANEL_DENOMINATOR_OR_COEFFICIENT");
    checks.push_back(panel::kMaximumPanelOrder == 192U
        && panel::kMaximumPanelHalvings == 32U
        && panel::kOrderCandidateCount == 7U
        && panel::kStateCount == 4U && panel::kJetCount == 13U);

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
        "\"schema\":\"nhm2.g2h_e_s5.primary_c08_positive_panel_fixture.v1\","
        "\"scientific_handler_linked\":false,\"state_coefficients_read\":0,"
        "\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL")
        << "\"}\n";
    return passed == checks.size() ? 0 : 1;
}
