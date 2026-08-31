#include "mini_boson_star_primary_c08_convolution_selector_v1.hpp"

#include <arb.h>

#include <iostream>
#include <utility>
#include <vector>

namespace selector =
    nhm2::g2h_e_s5::primary_c08_convolution_selector_v1;
namespace jet = nhm2::g2h_e_s5::primary_c08_convolution_jet_v1;
namespace ledger = nhm2::g2h_e_s5::primary_c08_convolution_ledger_v1;

namespace {

struct ProgressCapture {
    std::vector<std::pair<std::size_t, std::size_t>> markers;
};

void capture_progress(std::size_t completed, std::size_t total, void *context) {
    static_cast<ProgressCapture *>(context)->markers.emplace_back(completed, total);
}

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

void fill_model(Storage &coefficients, bool f_operand) {
    for (std::size_t index = 0U; index < coefficients.values.size(); ++index) {
        const unsigned factor = static_cast<unsigned>(index % 17U) + 1U;
        arb_set_ui(coefficients.values.data() + index,
                   static_cast<ulong>(f_operand ? factor : 2U * factor));
        arb_mul_2exp_si(coefficients.values.data() + index,
                        coefficients.values.data() + index, -8L);
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
        && left.boundary_applied_once == right.boundary_applied_once
        && left.exhaustion_retuned == right.exhaustion_retuned
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

bool complete(const selector::CoefficientDecompositionObservation &value,
              std::size_t expected_jet) {
    bool slots_complete = true;
    for (std::size_t slot = 0U; slot < jet::kSecondJetTermCount; ++slot) {
        slots_complete = slots_complete
            && !value.slot_radius_sums[slot].empty()
            && !value.slot_upper_magnitude_sums[slot].empty();
    }
    return value.evaluated && value.panel_count == 2U
        && value.target_degree == 3U && value.target_jet == expected_jet
        && value.terms_per_panel == jet::kSecondJetTermCount
        && value.elementary_terms_observed
            == 2U * jet::kSecondJetTermCount
        && value.all_panel_reconstructions_equal
        && value.final_reconstruction_equal
        && !value.final_radius.empty() && !value.final_threshold.empty()
        && !value.final_ratio.empty() && slots_complete
        && !value.boundary_panel_radius.empty()
        && !value.nonboundary_panel_radius_sum.empty()
        && !value.total_elementary_radius_sum.empty()
        && !value.final_to_elementary_radius_ratio.empty()
        && !value.maximum_elementary_radius.empty()
        && value.maximum_elementary_panel_ordinal < 2U
        && value.maximum_elementary_slot < jet::kSecondJetTermCount
        && value.observation_only && value.threshold_unchanged
        && value.reduction_order_unchanged;
}

bool same_observation(
    const selector::CoefficientDecompositionObservation &left,
    const selector::CoefficientDecompositionObservation &right) {
    return left.evaluated == right.evaluated
        && left.panel_count == right.panel_count
        && left.target_degree == right.target_degree
        && left.target_jet == right.target_jet
        && left.terms_per_panel == right.terms_per_panel
        && left.elementary_terms_observed == right.elementary_terms_observed
        && left.all_panel_reconstructions_equal
            == right.all_panel_reconstructions_equal
        && left.final_reconstruction_equal == right.final_reconstruction_equal
        && left.final_radius == right.final_radius
        && left.final_threshold == right.final_threshold
        && left.final_ratio == right.final_ratio
        && left.slot_radius_sums == right.slot_radius_sums
        && left.slot_upper_magnitude_sums
            == right.slot_upper_magnitude_sums
        && left.boundary_panel_radius == right.boundary_panel_radius
        && left.nonboundary_panel_radius_sum
            == right.nonboundary_panel_radius_sum
        && left.total_elementary_radius_sum
            == right.total_elementary_radius_sum
        && left.final_to_elementary_radius_ratio
            == right.final_to_elementary_radius_ratio
        && left.maximum_elementary_radius
            == right.maximum_elementary_radius
        && left.maximum_elementary_panel_ordinal
            == right.maximum_elementary_panel_ordinal
        && left.maximum_elementary_slot == right.maximum_elementary_slot;
}

}  // namespace

int main() {
    std::vector<bool> checks;
    Ball zero, one, two, three;
    arb_zero(zero.value); arb_one(one.value);
    arb_set_ui(two.value, 2UL); arb_set_ui(three.value, 3UL);
    Storage f0((32U + 1U) * ledger::kJetCount);
    Storage f1((24U + 1U) * ledger::kJetCount);
    Storage f2((24U + 1U) * ledger::kJetCount);
    Storage g0((32U + 1U) * ledger::kJetCount);
    Storage g1((24U + 1U) * ledger::kJetCount);
    Storage g2((24U + 1U) * ledger::kJetCount);
    Storage fr0(jet::kJetCount), fr1(jet::kJetCount), fr2(jet::kJetCount);
    Storage gr0(jet::kJetCount), gr1(jet::kJetCount), gr2(jet::kJetCount);
    fill_model(f0, true); fill_model(f1, true); fill_model(f2, true);
    fill_model(g0, false); fill_model(g1, false); fill_model(g2, false);
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
    for (std::size_t index = 0U; index < jet::kJetCount; ++index) {
        arb_set_ui(boundary.values.data() + index,
                   static_cast<ulong>(index + 2U));
        arb_mul_2exp_si(boundary.values.data() + index,
                        boundary.values.data() + index, -5L);
    }
    const selector::Input input{{f_models.size(), f_models.data()},
        {g_models.size(), g_models.data()}, two.value, three.value, 24U,
        boundary.values.size(), boundary.values.data()};

    selector::Output ordinary_output, jet8_output, jet9_output,
        repeated_output, observable_output;
    selector::Result ordinary_result{}, jet8_result{}, jet9_result{},
        repeated_result{}, observable_result{};
    selector::CoefficientDecompositionObservation jet8_observation,
        jet9_observation, repeated_observation, observable_observation;
    ProgressCapture progress_capture;
    const bool ordinary = selector::evaluate_prepared_candidate(
        input, 2U, 2U, &ordinary_output, &ordinary_result);
    const bool observed8 = selector::evaluate_prepared_candidate_decomposition(
        input, 2U, 2U, 3U, jet::second_jet(1U, 1U), &jet8_output,
        &jet8_result, &jet8_observation);
    const bool observed9 = selector::evaluate_prepared_candidate_decomposition(
        input, 2U, 2U, 3U, jet::second_jet(1U, 2U), &jet9_output,
        &jet9_result, &jet9_observation);
    const bool repeated = selector::evaluate_prepared_candidate_decomposition(
        input, 2U, 2U, 3U, jet::second_jet(1U, 2U), &repeated_output,
        &repeated_result, &repeated_observation);
    const bool observable =
        selector::evaluate_prepared_candidate_decomposition_observable(
            input, 2U, 2U, 3U, jet::second_jet(1U, 2U),
            &observable_output, &observable_result, &observable_observation,
            capture_progress, &progress_capture);

    checks.push_back(ordinary && observed8 && observed9 && repeated && observable);
    checks.push_back(same_result(ordinary_result, jet8_result));
    checks.push_back(same_result(ordinary_result, jet9_result));
    checks.push_back(same_result(jet9_result, repeated_result));
    checks.push_back(same_result(repeated_result, observable_result));
    checks.push_back(same_output(ordinary_output, jet8_output));
    checks.push_back(same_output(ordinary_output, jet9_output));
    checks.push_back(same_output(jet9_output, repeated_output));
    checks.push_back(same_output(repeated_output, observable_output));
    checks.push_back(complete(jet8_observation, jet::second_jet(1U, 1U)));
    checks.push_back(complete(jet9_observation, jet::second_jet(1U, 2U)));
    checks.push_back(same_observation(jet9_observation,
                                      repeated_observation));
    checks.push_back(same_observation(repeated_observation,
                                      observable_observation));
    checks.push_back(progress_capture.markers.size() == 1U
                     && progress_capture.markers[0]
                         == std::make_pair<std::size_t, std::size_t>(2U, 2U));
    checks.push_back(ordinary_result.elementary_convolutions == 86U
                     && jet8_result.elementary_convolutions == 86U
                     && jet9_result.elementary_convolutions == 86U);
    checks.push_back(ordinary_result.candidate_evaluations == 0U
                     && jet8_result.candidate_evaluations == 0U
                     && jet9_result.candidate_evaluations == 0U
                     && ordinary_result.positive_parameter_samples == 0U
                     && jet8_result.positive_parameter_samples == 0U
                     && jet9_result.positive_parameter_samples == 0U);
    checks.push_back(!ordinary_result.candidate_root_created
                     && !jet8_result.candidate_root_created
                     && !jet9_result.candidate_root_created
                     && !ordinary_result.scientific_handler_linked
                     && !jet8_result.scientific_handler_linked
                     && !jet9_result.scientific_handler_linked
                     && !ordinary_result.authority_promoted
                     && !jet8_result.authority_promoted
                     && !jet9_result.authority_promoted);

    std::size_t passed = 0U;
    for (const bool check : checks) if (check) ++passed;
    std::cout
        << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_p8f_c1_observability_fixture.v1\","
        << "\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL")
        << "\",\"checks_passed\":" << passed
        << ",\"checks_total\":" << checks.size()
        << ",\"jet8_reconstructed\":"
        << (jet8_observation.final_reconstruction_equal ? "true" : "false")
        << ",\"jet9_reconstructed\":"
        << (jet9_observation.final_reconstruction_equal ? "true" : "false")
        << ",\"ordinary_decomposed_equal\":"
        << (same_output(ordinary_output, jet8_output)
            && same_output(ordinary_output, jet9_output) ? "true" : "false")
        << ",\"candidate_evaluations\":0,"
        << "\"positive_parameter_samples\":0,"
        << "\"candidate_roots_created\":false,"
        << "\"scientific_handler_linked\":false,"
        << "\"authority_promoted\":false}\n";
    return passed == checks.size() ? 0 : 1;
}


