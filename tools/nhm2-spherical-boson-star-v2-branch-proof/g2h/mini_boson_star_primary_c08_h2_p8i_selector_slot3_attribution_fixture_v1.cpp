#define main p8e_decomposition_regression_main
#include "mini_boson_star_primary_c08_h2_p8e_decomposition_fixture_v1.cpp"
#undef main

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

    selector::Output ordinary_output, observed_output, repeated_output;
    selector::Result ordinary_result{}, observed_result{}, repeated_result{};
    selector::CoefficientDecompositionObservation observation,
        repeated_observation;
    const std::size_t target_jet = jet::second_jet(1U, 2U);
    const bool ordinary = selector::evaluate_prepared_candidate(
        input, 2U, 2U, &ordinary_output, &ordinary_result);
    const bool observed = selector::evaluate_prepared_candidate_decomposition(
        input, 2U, 2U, 3U, target_jet, &observed_output, &observed_result,
        &observation);
    const bool repeated = selector::evaluate_prepared_candidate_decomposition(
        input, 2U, 2U, 3U, target_jet, &repeated_output, &repeated_result,
        &repeated_observation);

    const auto attribution_complete = [](const auto &value) {
        return value.slot3_attribution_evaluated
            && value.slot3_integrated_terms_observed > 0U
            && value.slot3_boundary_terms_observed > 0U
            && value.all_slot3_reconstructions_equal
            && !value.slot3_f_source_hull_radius_sum.empty()
            && !value.slot3_gprime_source_hull_radius_sum.empty()
            && !value.slot3_direct_integrated_radius_sum.empty()
            && !value.slot3_boundary_radius_sum.empty()
            && !value.slot3_integrated_component_radius_sum.empty()
            && !value.slot3_boundary_component_radius_sum.empty();
    };
    const auto attribution_equal = [](const auto &left, const auto &right) {
        return left.slot3_attribution_evaluated
                == right.slot3_attribution_evaluated
            && left.slot3_integrated_terms_observed
                == right.slot3_integrated_terms_observed
            && left.slot3_boundary_terms_observed
                == right.slot3_boundary_terms_observed
            && left.all_slot3_reconstructions_equal
                == right.all_slot3_reconstructions_equal
            && left.slot3_f_source_hull_radius_sum
                == right.slot3_f_source_hull_radius_sum
            && left.slot3_gprime_source_hull_radius_sum
                == right.slot3_gprime_source_hull_radius_sum
            && left.slot3_direct_integrated_radius_sum
                == right.slot3_direct_integrated_radius_sum
            && left.slot3_boundary_radius_sum
                == right.slot3_boundary_radius_sum
            && left.slot3_integrated_component_radius_sum
                == right.slot3_integrated_component_radius_sum
            && left.slot3_boundary_component_radius_sum
                == right.slot3_boundary_component_radius_sum;
    };

    checks.push_back(ordinary && observed && repeated);
    checks.push_back(same_result(ordinary_result, observed_result));
    checks.push_back(same_result(observed_result, repeated_result));
    checks.push_back(same_output(ordinary_output, observed_output));
    checks.push_back(same_output(observed_output, repeated_output));
    checks.push_back(complete(observation, target_jet));
    checks.push_back(attribution_complete(observation));
    checks.push_back(attribution_complete(repeated_observation));
    checks.push_back(attribution_equal(observation, repeated_observation));
    checks.push_back(observation.slot3_integrated_terms_observed == 2172U);
    checks.push_back(observation.slot3_boundary_terms_observed == 44U);
    checks.push_back(observation.observation_only
                     && observation.threshold_unchanged
                     && observation.reduction_order_unchanged);
    checks.push_back(ordinary_result.candidate_evaluations == 0U
                     && observed_result.candidate_evaluations == 0U
                     && ordinary_result.positive_parameter_samples == 0U
                     && observed_result.positive_parameter_samples == 0U);
    checks.push_back(!ordinary_result.candidate_root_created
                     && !observed_result.candidate_root_created
                     && !ordinary_result.scientific_handler_linked
                     && !observed_result.scientific_handler_linked
                     && !ordinary_result.authority_promoted
                     && !observed_result.authority_promoted);

    std::size_t passed = 0U;
    for (const bool check : checks) if (check) ++passed;
    std::cout
        << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_p8i_selector_slot3_attribution_fixture.v1\","
        << "\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL")
        << "\",\"checks_passed\":" << passed
        << ",\"checks_total\":" << checks.size()
        << ",\"panel_count\":" << observation.panel_count
        << ",\"slot3_integrated_terms\":"
        << observation.slot3_integrated_terms_observed
        << ",\"slot3_boundary_terms\":"
        << observation.slot3_boundary_terms_observed
        << ",\"ordinary_attributed_equal\":"
        << (same_output(ordinary_output, observed_output) ? "true" : "false")
        << ",\"deterministic_repeat\":"
        << (attribution_equal(observation, repeated_observation)
            ? "true" : "false")
        << ",\"candidate_evaluations\":0,"
        << "\"positive_parameter_samples\":0,"
        << "\"candidate_roots_created\":false,"
        << "\"scientific_handler_linked\":false,"
        << "\"authority_promoted\":false}\n";
    return passed == checks.size() ? 0 : 1;
}
