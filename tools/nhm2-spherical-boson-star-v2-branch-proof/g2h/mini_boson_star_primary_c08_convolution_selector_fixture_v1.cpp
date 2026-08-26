#include "mini_boson_star_primary_c08_convolution_selector_v1.hpp"

#include <arb.h>

#include <array>
#include <cstdint>
#include <iostream>
#include <string>
#include <vector>

namespace selector =
    nhm2::g2h_e_s5::primary_c08_convolution_selector_v1;
namespace jet = nhm2::g2h_e_s5::primary_c08_convolution_jet_v1;
namespace ledger = nhm2::g2h_e_s5::primary_c08_convolution_ledger_v1;

namespace {

struct Ball {
    Ball() { arb_init(value); arb_zero(value); }
    ~Ball() { arb_clear(value); }
    arb_t value;
};

struct Storage {
    explicit Storage(std::size_t count) : values(count) {
        for (auto &value : values) { arb_init(&value); arb_zero(&value); }
    }
    ~Storage() { for (auto &value : values) arb_clear(&value); }
    std::vector<arb_struct> values;
};

void fill_constant_model(Storage &coefficients, Storage &remainders,
                         bool f_operand) {
    for (std::size_t component = 0U; component < jet::kJetCount; ++component) {
        const unsigned factor = static_cast<unsigned>(component)
            + (f_operand ? 1U : 2U);
        arb_set_ui(coefficients.values.data() + component,
                   static_cast<ulong>(f_operand ? factor : 2U * factor));
        arb_zero(remainders.values.data() + component);
    }
}

bool exact_integer(arb_srcptr value, unsigned integer) {
    Ball expected;
    arb_set_ui(expected.value, static_cast<ulong>(integer));
    return arb_equal(value, expected.value);
}

unsigned pair_scale(std::size_t f_index, std::size_t g_index) {
    return static_cast<unsigned>((f_index + 1U) * (g_index + 2U));
}

bool neutral(const selector::Result &result) {
    return result.state_coefficients_read == 0U
        && result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created && !result.scientific_handler_linked
        && !result.authority_promoted;
}

bool rejected(const selector::Input &input,
              selector::FailureDetail detail) {
    selector::Output output;
    selector::Result result{};
    return !selector::evaluate(input, &output, &result)
        && result.detail == detail && output.selected_u_panels == 0U
        && neutral(result);
}

bool same_output(const selector::Output &left,
                 const selector::Output &right) {
    if (left.retained_order != right.retained_order
        || left.selected_u_panels != right.selected_u_panels
        || !arb_equal(left.target_left, right.target_left)
        || !arb_equal(left.target_right, right.target_right)
        || !arb_equal(left.target_center, right.target_center)
        || !arb_equal(left.target_half_width, right.target_half_width)
        || left.direct_coverage_offsets != right.direct_coverage_offsets
        || left.direct_coverage_ordinals != right.direct_coverage_ordinals
        || left.reflected_coverage_offsets != right.reflected_coverage_offsets
        || left.reflected_coverage_ordinals
            != right.reflected_coverage_ordinals) return false;
    for (unsigned degree = 0U; degree <= left.retained_order; ++degree) {
        for (std::size_t component = 0U; component < jet::kJetCount;
             ++component) {
            if (!arb_equal(left.coefficient(degree, component),
                           right.coefficient(degree, component))
                || !arb_equal(left.coefficient_margin(degree, component),
                              right.coefficient_margin(degree, component)))
                return false;
        }
    }
    for (std::size_t component = 0U; component < jet::kJetCount;
         ++component) {
        if (!arb_equal(left.remainder(component), right.remainder(component))
            || !arb_equal(left.remainder_margin(component),
                          right.remainder_margin(component))) return false;
    }
    return true;
}

}  // namespace

int main() {
    std::vector<bool> checks;
    Ball zero, one, two, three;
    arb_zero(zero.value);
    arb_one(one.value);
    arb_set_ui(two.value, 2UL);
    arb_set_ui(three.value, 3UL);

    Storage f0((32U + 1U) * ledger::kJetCount);
    Storage f1((24U + 1U) * ledger::kJetCount);
    Storage f2((24U + 1U) * ledger::kJetCount);
    Storage g0((32U + 1U) * ledger::kJetCount);
    Storage g1((24U + 1U) * ledger::kJetCount);
    Storage g2((24U + 1U) * ledger::kJetCount);
    Storage fr0(jet::kJetCount), fr1(jet::kJetCount), fr2(jet::kJetCount);
    Storage gr0(jet::kJetCount), gr1(jet::kJetCount), gr2(jet::kJetCount);
    fill_constant_model(f0, fr0, true);
    fill_constant_model(f1, fr1, true);
    fill_constant_model(f2, fr2, true);
    fill_constant_model(g0, gr0, false);
    fill_constant_model(g1, gr1, false);
    fill_constant_model(g2, gr2, false);

    std::vector<ledger::ModelView> f_models = {
        {0U, ledger::ModelKind::origin, zero.value, one.value, zero.value, 32U,
         f0.values.size(), f0.values.data(), fr0.values.size(), fr0.values.data()},
        {1U, ledger::ModelKind::positive_panel, one.value, two.value, one.value,
         24U, f1.values.size(), f1.values.data(), fr1.values.size(), fr1.values.data()},
        {2U, ledger::ModelKind::positive_panel, two.value, three.value, two.value,
         24U, f2.values.size(), f2.values.data(), fr2.values.size(), fr2.values.data()},
    };
    std::vector<ledger::ModelView> g_models = {
        {0U, ledger::ModelKind::origin, zero.value, one.value, zero.value, 32U,
         g0.values.size(), g0.values.data(), gr0.values.size(), gr0.values.data()},
        {1U, ledger::ModelKind::positive_panel, one.value, two.value, one.value,
         24U, g1.values.size(), g1.values.data(), gr1.values.size(), gr1.values.data()},
        {2U, ledger::ModelKind::positive_panel, two.value, three.value, two.value,
         24U, g2.values.size(), g2.values.data(), gr2.values.size(), gr2.values.data()},
    };
    Storage boundary(jet::kJetCount);
    for (std::size_t component = 0U; component < jet::kJetCount; ++component) {
        arb_set_ui(boundary.values.data() + component,
                   static_cast<ulong>(3U * (component + 2U)));
    }

    const selector::Input input{{f_models.size(), f_models.data()},
        {g_models.size(), g_models.data()}, two.value, three.value, 24U,
        boundary.values.size(), boundary.values.data()};
    selector::Output output;
    selector::Result result{};
    const bool accepted = selector::evaluate(input, &output, &result);
    checks.push_back(accepted && result.accepted
        && result.detail == selector::FailureDetail::none && neutral(result));
    checks.push_back(output.selected_u_panels == 1U
        && output.retained_order == 24U
        && arb_equal(output.target_left, two.value)
        && arb_equal(output.target_right, three.value));
    checks.push_back(exact_integer(output.coefficient(0U, jet::value_jet()),
                                   8U * pair_scale(0U, 0U))
        && exact_integer(output.coefficient(1U, jet::value_jet()),
                         2U * pair_scale(0U, 0U)));

    bool first_exact = true;
    for (std::size_t a = 0U; a < jet::kParameterCount; ++a) {
        const std::size_t index = jet::first_jet(a);
        const unsigned scale = pair_scale(index, 0U) + pair_scale(0U, index);
        first_exact = first_exact
            && exact_integer(output.coefficient(0U, index), 8U * scale)
            && exact_integer(output.coefficient(1U, index), 2U * scale);
    }
    checks.push_back(first_exact);

    bool second_exact = true;
    for (std::size_t a = 0U; a < jet::kParameterCount; ++a) {
        for (std::size_t b = 0U; b < jet::kParameterCount; ++b) {
            const std::size_t destination = jet::second_jet(a, b);
            const unsigned scale = pair_scale(destination, 0U)
                + pair_scale(jet::first_jet(a), jet::first_jet(b))
                + pair_scale(jet::first_jet(b), jet::first_jet(a))
                + pair_scale(0U, destination);
            second_exact = second_exact
                && exact_integer(output.coefficient(0U, destination),
                                 8U * scale)
                && exact_integer(output.coefficient(1U, destination),
                                 2U * scale);
        }
    }
    checks.push_back(second_exact);

    bool high_zero = true;
    bool remainder_zero = true;
    bool margins_nonnegative = true;
    for (std::size_t component = 0U; component < jet::kJetCount; ++component) {
        remainder_zero = remainder_zero && arb_is_zero(output.remainder(component));
        margins_nonnegative = margins_nonnegative
            && arb_is_nonnegative(output.remainder_margin(component));
        for (unsigned degree = 0U; degree <= output.retained_order; ++degree) {
            if (degree >= 2U) high_zero = high_zero
                && arb_is_zero(output.coefficient(degree, component));
            margins_nonnegative = margins_nonnegative
                && arb_is_nonnegative(output.coefficient_margin(degree, component));
        }
    }
    checks.push_back(high_zero && remainder_zero && margins_nonnegative);
    checks.push_back(result.refinement_candidates_visited == 1U
        && result.subpanels_accumulated == 1U
        && result.jet_predecessor_calls == 1U
        && result.elementary_convolutions == jet::kElementaryConvolutions
        && result.numerical_width_checks == 338U);
    checks.push_back(result.fixed_candidate_schedule
        && result.increasing_subpanel_order
        && result.first_passing_candidate_selected
        && result.boundary_applied_once && !result.exhaustion_retuned
        && !result.signed_remainder_cancellation_used
        && !result.midpoint_selection_used && !result.point_sampling_used);
    checks.push_back(output.direct_coverage_offsets
            == std::vector<std::size_t>({0U, 3U})
        && output.direct_coverage_ordinals
            == std::vector<std::size_t>({0U, 1U, 2U})
        && output.reflected_coverage_offsets
            == std::vector<std::size_t>({0U, 3U})
        && output.reflected_coverage_ordinals
            == std::vector<std::size_t>({0U, 1U, 2U}));

    checks.push_back(selector::kUPanelCandidates.front() == 1U
        && selector::kUPanelCandidates.back() == 65536U
        && selector::kUPanelCandidateCount == 17U
        && selector::kNumericalWidthExponent == -180L);
    bool doubled = true;
    for (std::size_t index = 1U;
         index < selector::kUPanelCandidateCount; ++index) {
        doubled = doubled && selector::kUPanelCandidates[index]
            == 2U * selector::kUPanelCandidates[index - 1U];
    }
    checks.push_back(doubled);

    std::array<bool, selector::kUPanelCandidateCount> policy{};
    policy[3U] = true;
    const auto first_pass = selector::replay_width_decisions(policy, 17U);
    checks.push_back(first_pass.selected && !first_pass.exhausted
        && first_pass.selected_u_panels == 8U
        && first_pass.candidates_visited == 4U);
    policy.fill(false);
    const auto exhausted = selector::replay_width_decisions(policy, 17U);
    checks.push_back(!exhausted.selected && exhausted.exhausted
        && exhausted.selected_u_panels == 0U
        && exhausted.candidates_visited == 17U);
    const auto partial = selector::replay_width_decisions(policy, 16U);
    checks.push_back(!partial.selected && !partial.exhausted
        && partial.candidates_visited == 16U);

    selector::Output replay;
    selector::Result replay_result{};
    checks.push_back(selector::evaluate(input, &replay, &replay_result)
        && same_output(output, replay) && neutral(replay_result));

    auto short_boundary = input;
    short_boundary.g_at_zero_count = 12U;
    checks.push_back(rejected(short_boundary,
        selector::FailureDetail::invalid_input_or_predecessor));
    auto null_boundary = input;
    null_boundary.g_at_zero_jets = nullptr;
    checks.push_back(rejected(null_boundary,
        selector::FailureDetail::invalid_input_or_predecessor));
    arb_indeterminate(boundary.values.data() + 12U);
    checks.push_back(rejected(input,
        selector::FailureDetail::invalid_input_or_predecessor));
    arb_set_ui(boundary.values.data() + 12U, 42UL);
    f_models[2U].left_endpoint = one.value;
    checks.push_back(rejected(input,
        selector::FailureDetail::invalid_input_or_predecessor));
    f_models[2U].left_endpoint = two.value;
    auto bad_order = input;
    bad_order.target_order = 25U;
    checks.push_back(rejected(bad_order,
        selector::FailureDetail::invalid_input_or_predecessor));

    selector::Result missing_output{};
    checks.push_back(!selector::evaluate(input, nullptr, &missing_output)
        && missing_output.detail == selector::FailureDetail::missing_output
        && neutral(missing_output));
    checks.push_back(!selector::evaluate(input, &output, nullptr));
    checks.push_back(std::string(selector::failure_detail_name(
        selector::FailureDetail::volterra_convolution_or_u_refinement_exhaustion))
        == "C08-010_VOLTERRA_CONVOLUTION_OR_U_REFINEMENT_EXHAUSTION");

    std::size_t passed = 0U;
    std::uint64_t mask = 0U;
    for (std::size_t index = 0U; index < checks.size(); ++index) {
        if (checks[index]) {
            ++passed;
            mask |= std::uint64_t{1} << index;
        }
    }
    std::cout << "{\"authority_promoted\":false,\"boundary_applied_once\":"
        << (result.boundary_applied_once ? "true" : "false")
        << ",\"candidate_evaluations\":0,\"candidate_roots_created\":false,"
        "\"checks_passed\":" << passed << ",\"checks_total\":"
        << checks.size() << ",\"elementary_convolutions\":"
        << result.elementary_convolutions << ",\"fixture_mask\":" << mask
        << ",\"numerical_width_checks\":" << result.numerical_width_checks
        << ",\"positive_parameter_samples\":0,\"schema\":"
        "\"nhm2.g2h_e_s5.primary_c08_convolution_selector_fixture.v1\","
        "\"scientific_handler_linked\":false,\"selected_u_panels\":"
        << output.selected_u_panels << ",\"state_coefficients_read\":0,"
        "\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL")
        << "\"}\n";
    return passed == checks.size() ? 0 : 1;
}
