#define main p8e_decomposition_regression_main
#include "mini_boson_star_primary_c08_h2_p8e_decomposition_fixture_v1.cpp"
#undef main

#include "mini_boson_star_primary_c08_h2_p8n_selector_term_radius_binding_v1.hpp"

namespace p8n =
    nhm2::g2h_e_s5::primary_c08_h2_p8n_selector_term_radius_binding_v1;

namespace {

bool nonnegative(arb_srcptr value) {
    return arb_is_finite(value) && !arb_is_negative(value);
}

bool same_p8n(const p8n::Observation &left,
              const p8n::Observation &right) {
    if (left.panel_count != right.panel_count
        || left.target_degree != right.target_degree
        || left.target_jet != right.target_jet
        || left.panels_observed != right.panels_observed
        || left.terms_observed != right.terms_observed
        || left.boundary_terms_observed != right.boundary_terms_observed
        || left.populated_degrees != right.populated_degrees
        || left.all_panel_integrated_matches
            != right.all_panel_integrated_matches
        || left.p8i_counts_equal != right.p8i_counts_equal
        || left.p8i_aggregate_equal != right.p8i_aggregate_equal
        || left.origin_channels_complete != right.origin_channels_complete
        || left.bounded_degree_inventory != right.bounded_degree_inventory
        || left.evaluated != right.evaluated
        || left.by_global_t_degree.size()
            != right.by_global_t_degree.size()) return false;
    const arb_srcptr left_totals[] = {
        left.f_coefficient_total, left.gprime_coefficient_total,
        left.prepared_moment_total, left.product_rounding_total,
        left.translation_weight_total, left.absolute_accumulation_total};
    const arb_srcptr right_totals[] = {
        right.f_coefficient_total, right.gprime_coefficient_total,
        right.prepared_moment_total, right.product_rounding_total,
        right.translation_weight_total, right.absolute_accumulation_total};
    for (std::size_t index = 0U; index < 6U; ++index)
        if (!arb_equal(left_totals[index], right_totals[index])) return false;
    for (std::size_t degree = 0U;
         degree < left.by_global_t_degree.size(); ++degree) {
        const p8n::DegreeAggregate *a = left.by_global_t_degree[degree];
        const p8n::DegreeAggregate *b = right.by_global_t_degree[degree];
        if ((a == nullptr) != (b == nullptr)) return false;
        if (a == nullptr) continue;
        if (a->terms != b->terms
            || !arb_equal(a->f_coefficient, b->f_coefficient)
            || !arb_equal(a->gprime_coefficient, b->gprime_coefficient)
            || !arb_equal(a->prepared_moment, b->prepared_moment)
            || !arb_equal(a->product_rounding, b->product_rounding)
            || !arb_equal(a->translation_weight, b->translation_weight)
            || !arb_equal(a->absolute_accumulation,
                          b->absolute_accumulation)) return false;
    }
    return true;
}

}  // namespace

int main() {
    std::vector<bool> checks;
    checks.push_back(p8e_decomposition_regression_main() == 0);

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
    const std::size_t target_jet = jet::second_jet(1U, 2U);

    selector::Output ordinary_output, observed_output, repeated_output;
    selector::Result ordinary_result{}, observed_result{}, repeated_result{};
    selector::CoefficientDecompositionObservation predecessor,
        repeated_predecessor;
    p8n::Observation observation, repeated_observation;
    const bool ordinary = selector::evaluate_prepared_candidate_decomposition(
        input, 2U, 2U, 3U, target_jet, &ordinary_output, &ordinary_result,
        &predecessor);
    const bool observed = p8n::evaluate_prepared_candidate_observed(
        input, 2U, 2U, 3U, target_jet, &observed_output, &observed_result,
        &predecessor, &observation);
    const bool repeated = p8n::evaluate_prepared_candidate_observed(
        input, 2U, 1U, 3U, target_jet, &repeated_output, &repeated_result,
        &repeated_predecessor, &repeated_observation);

    checks.push_back(ordinary && observed && repeated);
    checks.push_back(same_result(ordinary_result, observed_result)
                     && same_result(observed_result, repeated_result));
    checks.push_back(same_output(ordinary_output, observed_output)
                     && same_output(observed_output, repeated_output));
    checks.push_back(complete(predecessor, target_jet)
                     && complete(repeated_predecessor, target_jet));
    checks.push_back(observation.evaluated
                     && observation.all_panel_integrated_matches
                     && observation.p8i_counts_equal
                     && observation.p8i_aggregate_equal
                     && observation.origin_channels_complete
                     && observation.bounded_degree_inventory);
    checks.push_back(observation.panels_observed == 2U
                     && observation.terms_observed == 2172U
                     && observation.boundary_terms_observed == 44U);
    checks.push_back(observation.populated_degrees == 63U
                     && observation.by_global_t_degree.size()
                         == p8n::kMaximumDegreeBuckets
                     && observation.by_global_t_degree[3U] != nullptr
                     && observation.by_global_t_degree[65U] != nullptr
                     && observation.by_global_t_degree[66U] == nullptr);
    checks.push_back(nonnegative(observation.f_coefficient_total)
                     && nonnegative(observation.gprime_coefficient_total)
                     && nonnegative(observation.prepared_moment_total)
                     && nonnegative(observation.product_rounding_total)
                     && nonnegative(observation.translation_weight_total)
                     && nonnegative(observation.absolute_accumulation_total));
    checks.push_back(arb_is_positive(observation.f_coefficient_total)
                     || arb_is_positive(observation.gprime_coefficient_total));
    checks.push_back(same_p8n(observation, repeated_observation));
    checks.push_back(predecessor.slot3_integrated_terms_observed
                         == observation.terms_observed
                     && predecessor.slot3_boundary_terms_observed
                         == observation.boundary_terms_observed);
    checks.push_back(observation.observation_only
                     && observation.selector_output_unchanged
                     && observation.selector_result_unchanged
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
        << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_p8n_selector_term_radius_binding_fixture.v1\","
        << "\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL")
        << "\",\"checks_passed\":" << passed
        << ",\"checks_total\":" << checks.size()
        << ",\"panel_count\":" << observation.panel_count
        << ",\"target_degree\":3,\"target_jet\":" << target_jet
        << ",\"degree_bucket_capacity\":" << p8n::kMaximumDegreeBuckets
        << ",\"populated_degrees\":" << observation.populated_degrees
        << ",\"terms_observed\":" << observation.terms_observed
        << ",\"boundary_terms_observed\":"
        << observation.boundary_terms_observed
        << ",\"ordinary_observed_equal\":"
        << (same_output(ordinary_output, observed_output) ? "true" : "false")
        << ",\"thread_count_replay_equal\":"
        << (same_p8n(observation, repeated_observation) ? "true" : "false")
        << ",\"p8i_counts_equal\":"
        << (observation.p8i_counts_equal ? "true" : "false")
        << ",\"p8i_aggregate_equal\":"
        << (observation.p8i_aggregate_equal ? "true" : "false")
        << ",\"origin_channels_complete\":"
        << (observation.origin_channels_complete ? "true" : "false")
        << ",\"next_gate\":\"P8O_REPRESENTATIVE_TERM_RADIUS_DECISION_PACKET\","
        << "\"representative_input_evaluated\":false,"
        << "\"candidate_evaluations\":0,\"positive_parameter_samples\":0,"
        << "\"candidate_roots_created\":false,"
        << "\"scientific_handler_linked\":false,"
        << "\"authority_promoted\":false}\n";
    return passed == checks.size() ? 0 : 1;
}
