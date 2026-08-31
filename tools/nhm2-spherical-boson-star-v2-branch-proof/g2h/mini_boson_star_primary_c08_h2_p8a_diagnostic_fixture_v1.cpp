#include "mini_boson_star_primary_c08_convolution_selector_v1.hpp"

#include <arb.h>

#include <iostream>
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

void fill_constant_model(Storage &coefficients, bool f_operand) {
    for (std::size_t component = 0U; component < jet::kJetCount; ++component) {
        const unsigned factor = static_cast<unsigned>(component)
            + (f_operand ? 1U : 2U);
        arb_set_ui(coefficients.values.data() + component,
                   static_cast<ulong>(f_operand ? factor : 2U * factor));
    }
}

bool same_result(const selector::Result &left,
                 const selector::Result &right) {
    return left.accepted == right.accepted && left.detail == right.detail
        && left.refinement_candidates_visited
            == right.refinement_candidates_visited
        && left.subpanels_accumulated == right.subpanels_accumulated
        && left.jet_predecessor_calls == right.jet_predecessor_calls
        && left.elementary_convolutions == right.elementary_convolutions
        && left.numerical_width_checks == right.numerical_width_checks
        && left.fixed_candidate_schedule == right.fixed_candidate_schedule
        && left.increasing_subpanel_order == right.increasing_subpanel_order
        && left.first_passing_candidate_selected
            == right.first_passing_candidate_selected
        && left.boundary_applied_once == right.boundary_applied_once
        && left.exhaustion_retuned == right.exhaustion_retuned
        && left.signed_remainder_cancellation_used
            == right.signed_remainder_cancellation_used
        && left.midpoint_selection_used == right.midpoint_selection_used
        && left.point_sampling_used == right.point_sampling_used
        && left.state_coefficients_read == right.state_coefficients_read
        && left.candidate_evaluations == right.candidate_evaluations
        && left.positive_parameter_samples == right.positive_parameter_samples
        && left.candidate_root_created == right.candidate_root_created
        && left.scientific_handler_linked == right.scientific_handler_linked
        && left.authority_promoted == right.authority_promoted;
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
        for (std::size_t index = 0U; index < jet::kJetCount; ++index) {
            if (!arb_equal(left.coefficient(degree, index),
                           right.coefficient(degree, index))
                || !arb_equal(left.coefficient_margin(degree, index),
                              right.coefficient_margin(degree, index)))
                return false;
        }
    }
    for (std::size_t index = 0U; index < jet::kJetCount; ++index) {
        if (!arb_equal(left.remainder(index), right.remainder(index))
            || !arb_equal(left.remainder_margin(index),
                          right.remainder_margin(index))) return false;
    }
    return true;
}

void make_width_fixture(selector::Output &output) {
    output.retained_order = 0U;
    output.selected_u_panels = 1U;
    for (std::size_t index = 0U; index < jet::kJetCount; ++index) {
        arb_zero(output.coefficient(0U, index));
        arb_zero(output.remainder(index));
    }
}

bool same_observation(const selector::WidthObservation &left,
                      const selector::WidthObservation &right) {
    return left.evaluated == right.evaluated && left.passed == right.passed
        && left.candidate_index == right.candidate_index
        && left.panel_count == right.panel_count
        && left.width_checks == right.width_checks
        && left.first_failed_kind == right.first_failed_kind
        && left.first_failed_degree == right.first_failed_degree
        && left.first_failed_jet == right.first_failed_jet
        && left.first_failed_radius == right.first_failed_radius
        && left.first_failed_threshold == right.first_failed_threshold
        && left.first_failed_ratio == right.first_failed_ratio
        && left.worst_kind == right.worst_kind
        && left.worst_degree == right.worst_degree
        && left.worst_jet == right.worst_jet
        && left.worst_radius == right.worst_radius
        && left.worst_threshold == right.worst_threshold
        && left.worst_ratio == right.worst_ratio
        && left.worst_ratio_exceeds_one == right.worst_ratio_exceeds_one;
}

}  // namespace

int main() {
    std::vector<bool> checks;

    selector::Output passing;
    make_width_fixture(passing);
    selector::WidthObservation passing_observation;
    std::size_t passing_checks = 0U;
    const bool width_passed = selector::inspect_width_candidate(
        passing, 0U, &passing_observation, &passing_checks);
    checks.push_back(width_passed && passing_observation.evaluated
                     && passing_observation.passed);
    checks.push_back(passing_checks == 26U
                     && passing_observation.width_checks == 26U
                     && passing_observation.panel_count == 1U);
    checks.push_back(
        passing_observation.first_failed_kind == selector::WidthTermKind::none
        && passing_observation.worst_kind
            == selector::WidthTermKind::coefficient
        && !passing_observation.worst_radius.empty()
        && !passing_observation.worst_threshold.empty()
        && !passing_observation.worst_ratio.empty());

    selector::Output coefficient_failure;
    make_width_fixture(coefficient_failure);
    arb_add_error_2exp_si(coefficient_failure.coefficient(0U, 0U), -100L);
    selector::WidthObservation coefficient_observation;
    std::size_t coefficient_checks = 0U;
    const bool coefficient_passed = selector::inspect_width_candidate(
        coefficient_failure, 3U, &coefficient_observation,
        &coefficient_checks);
    checks.push_back(!coefficient_passed && coefficient_checks == 26U);
    checks.push_back(coefficient_observation.first_failed_kind
                         == selector::WidthTermKind::coefficient
                     && coefficient_observation.first_failed_degree == 0U
                     && coefficient_observation.first_failed_jet == 0U
                     && coefficient_observation.panel_count == 8U);
    checks.push_back(!coefficient_observation.first_failed_radius.empty()
                     && !coefficient_observation.first_failed_threshold.empty()
                     && !coefficient_observation.first_failed_ratio.empty()
                     && coefficient_observation.worst_ratio_exceeds_one);

    selector::Output remainder_failure;
    make_width_fixture(remainder_failure);
    arb_add_error_2exp_si(remainder_failure.remainder(3U), -100L);
    selector::WidthObservation remainder_observation;
    std::size_t remainder_checks = 0U;
    const bool remainder_passed = selector::inspect_width_candidate(
        remainder_failure, 4U, &remainder_observation, &remainder_checks);
    checks.push_back(!remainder_passed && remainder_checks == 26U);
    checks.push_back(remainder_observation.first_failed_kind
                         == selector::WidthTermKind::remainder
                     && remainder_observation.first_failed_jet == 3U
                     && remainder_observation.panel_count == 16U);

    selector::Output repeated_failure;
    make_width_fixture(repeated_failure);
    arb_add_error_2exp_si(repeated_failure.remainder(3U), -100L);
    selector::WidthObservation repeated_observation;
    std::size_t repeated_checks = 0U;
    const bool repeated_passed = selector::inspect_width_candidate(
        repeated_failure, 4U, &repeated_observation, &repeated_checks);
    checks.push_back(!repeated_passed
                     && same_observation(remainder_observation,
                                         repeated_observation));
    selector::WidthObservation invalid_observation;
    std::size_t invalid_checks = 0U;
    checks.push_back(!selector::inspect_width_candidate(
        repeated_failure, selector::kUPanelCandidateCount,
        &invalid_observation, &invalid_checks) && invalid_checks == 0U);

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
    fill_constant_model(f0, true); fill_constant_model(f1, true);
    fill_constant_model(f2, true); fill_constant_model(g0, false);
    fill_constant_model(g1, false); fill_constant_model(g2, false);
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
    for (std::size_t index = 0U; index < jet::kJetCount; ++index)
        arb_set_ui(boundary.values.data() + index,
                   static_cast<ulong>(3U * (index + 2U)));
    const selector::Input input{{f_models.size(), f_models.data()},
        {g_models.size(), g_models.data()}, two.value, three.value, 24U,
        boundary.values.size(), boundary.values.data()};
    selector::Output ordinary_output;
    selector::Output diagnostic_output;
    selector::Result ordinary_result{};
    selector::Result diagnostic_result{};
    selector::WidthDiagnostics diagnostics;
    const bool ordinary = selector::evaluate_prepared_parallel(
        input, 2U, &ordinary_output, &ordinary_result);
    const bool diagnostic = selector::evaluate_prepared_parallel_diagnostic(
        input, 2U, &diagnostic_output, &diagnostic_result, &diagnostics);
    checks.push_back(ordinary && diagnostic);
    checks.push_back(same_result(ordinary_result, diagnostic_result));
    checks.push_back(same_output(ordinary_output, diagnostic_output));
    checks.push_back(diagnostics.observations == 1U
                     && diagnostics.candidates[0U].passed
                     && diagnostics.candidates[0U].panel_count == 1U
                     && !diagnostics.all_observed_candidates_failed);
    checks.push_back(diagnostics.observation_only
                     && diagnostics.fixed_candidate_schedule
                     && diagnostics.thresholds_unchanged
                     && diagnostics.reduction_order_unchanged);
    checks.push_back(ordinary_result.candidate_evaluations == 0U
                     && diagnostic_result.candidate_evaluations == 0U
                     && ordinary_result.positive_parameter_samples == 0U
                     && diagnostic_result.positive_parameter_samples == 0U
                     && !ordinary_result.candidate_root_created
                     && !diagnostic_result.candidate_root_created);
    checks.push_back(!ordinary_result.scientific_handler_linked
                     && !diagnostic_result.scientific_handler_linked
                     && !ordinary_result.authority_promoted
                     && !diagnostic_result.authority_promoted);

    std::size_t passed = 0U;
    for (bool check : checks) if (check) ++passed;
    std::cout << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_p8a_diagnostic_fixture.v1\","
              << "\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL")
              << "\",\"checks_passed\":" << passed
              << ",\"checks_total\":" << checks.size()
              << ",\"ordinary_diagnostic_equal\":"
              << (same_result(ordinary_result, diagnostic_result)
                  && same_output(ordinary_output, diagnostic_output)
                  ? "true" : "false")
              << ",\"candidate_evaluations\":0,"
              << "\"positive_parameter_samples\":0,"
              << "\"candidate_roots_created\":false,"
              << "\"scientific_handler_linked\":false,"
              << "\"authority_promoted\":false}\n";
    return passed == checks.size() ? 0 : 1;
}
