#define main p8e_decomposition_regression_main
#include "mini_boson_star_primary_c08_h2_p8e_decomposition_fixture_v1.cpp"
#undef main

#include "mini_boson_star_primary_c08_h2_p8p_observer_progress_v1.hpp"

#include <array>
#include <type_traits>

namespace p8p =
    nhm2::g2h_e_s5::primary_c08_h2_p8p_observer_progress_v1;
namespace p8n =
    nhm2::g2h_e_s5::primary_c08_h2_p8n_selector_term_radius_binding_v1;

namespace {

struct Recorder {
    std::array<p8p::ProgressEvent, 4U> events{};
    std::size_t count = 0U;
};

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
        || left.observation_only != right.observation_only
        || left.selector_output_unchanged
            != right.selector_output_unchanged
        || left.selector_result_unchanged
            != right.selector_result_unchanged
        || left.threshold_unchanged != right.threshold_unchanged
        || left.reduction_order_unchanged != right.reduction_order_unchanged
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

void record_progress(const p8p::ProgressEvent &event,
                     void *context) noexcept {
    auto *recorder = static_cast<Recorder *>(context);
    if (recorder != nullptr && recorder->count < recorder->events.size())
        recorder->events[recorder->count++] = event;
}

bool same_p8i(
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
        && left.final_reconstruction_equal
            == right.final_reconstruction_equal
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
        && left.maximum_elementary_slot == right.maximum_elementary_slot
        && left.slot3_attribution_evaluated
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
            == right.slot3_boundary_component_radius_sum
        && left.observation_only == right.observation_only
        && left.threshold_unchanged == right.threshold_unchanged
        && left.reduction_order_unchanged == right.reduction_order_unchanged;
}

bool chronological(const Recorder &recorder, std::size_t total) {
    if (recorder.count != total) return false;
    std::uint64_t prior = 0U;
    for (std::size_t index = 0U; index < recorder.count; ++index) {
        const p8p::ProgressEvent &event = recorder.events[index];
        if (event.phase != p8p::Phase::observer
            || event.completed_panels != index + 1U
            || event.total_panels != total
            || (index != 0U && event.monotonic_nanoseconds < prior))
            return false;
        prior = event.monotonic_nanoseconds;
    }
    return true;
}

}  // namespace

int main() {
    static_assert(std::is_same_v<p8p::ProgressCallback,
        void (*)(const p8p::ProgressEvent &, void *) noexcept>);
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

    selector::Output baseline_output, null_output, callback_output;
    selector::Result baseline_result{}, null_result{}, callback_result{};
    selector::CoefficientDecompositionObservation baseline_p8i, null_p8i,
        callback_p8i;
    p8n::Observation baseline_p8n, null_p8n, callback_p8n;
    p8p::TimingObservation null_timing, callback_timing;
    Recorder recorder;

    const bool baseline = p8n::evaluate_prepared_candidate_observed(
        input, 2U, 2U, 3U, target_jet, &baseline_output, &baseline_result,
        &baseline_p8i, &baseline_p8n);
    const bool null_run = p8p::evaluate_prepared_candidate_observed(
        input, 2U, 2U, 3U, target_jet, &null_output, &null_result,
        &null_p8i, &null_p8n, nullptr, nullptr, &null_timing);
    const bool callback_run = p8p::evaluate_prepared_candidate_observed(
        input, 2U, 2U, 3U, target_jet, &callback_output, &callback_result,
        &callback_p8i, &callback_p8n, record_progress, &recorder,
        &callback_timing);

    checks.push_back(baseline && null_run && callback_run);
    checks.push_back(same_output(baseline_output, null_output)
                     && same_output(null_output, callback_output));
    checks.push_back(same_result(baseline_result, null_result)
                     && same_result(null_result, callback_result));
    checks.push_back(same_p8i(baseline_p8i, null_p8i)
                     && same_p8i(null_p8i, callback_p8i));
    checks.push_back(same_p8n(baseline_p8n, null_p8n)
                     && same_p8n(null_p8n, callback_p8n));
    checks.push_back(callback_p8n.by_global_t_degree.size()
                         == p8n::kMaximumDegreeBuckets
                     && callback_p8n.by_global_t_degree.size() == 514U
                     && callback_p8n.populated_degrees == 63U);
    const arb_srcptr baseline_totals[] = {baseline_p8n.f_coefficient_total,
        baseline_p8n.gprime_coefficient_total,
        baseline_p8n.prepared_moment_total,
        baseline_p8n.product_rounding_total,
        baseline_p8n.translation_weight_total,
        baseline_p8n.absolute_accumulation_total};
    const arb_srcptr callback_totals[] = {callback_p8n.f_coefficient_total,
        callback_p8n.gprime_coefficient_total,
        callback_p8n.prepared_moment_total,
        callback_p8n.product_rounding_total,
        callback_p8n.translation_weight_total,
        callback_p8n.absolute_accumulation_total};
    bool six_totals_equal = true;
    for (std::size_t index = 0U; index < 6U; ++index)
        six_totals_equal = six_totals_equal
            && arb_equal(baseline_totals[index], callback_totals[index]);
    checks.push_back(six_totals_equal);
    checks.push_back(chronological(recorder, 2U));
    checks.push_back(!null_timing.callback_enabled
                     && null_timing.events_emitted == 0U
                     && null_timing.selector_completed
                     && null_timing.observer_completed
                     && null_timing.evaluated);
    checks.push_back(callback_timing.callback_enabled
                     && callback_timing.events_emitted == 2U
                     && callback_timing.last_completed_panels == 2U
                     && callback_timing.selector_completed
                     && callback_timing.observer_completed
                     && callback_timing.monotone_progress
                     && callback_timing.bounded_progress
                     && callback_timing.callback_observation_only
                     && callback_timing.evaluated);
    checks.push_back(callback_timing.total_nanoseconds
                         >= callback_timing.selector_nanoseconds
                     && callback_timing.total_nanoseconds
                         >= callback_timing.observer_nanoseconds
                     && callback_timing.last_event_nanoseconds
                         >= callback_timing.first_event_nanoseconds);

    selector::Output invalid_null_output, invalid_callback_output;
    selector::Result invalid_null_result{}, invalid_callback_result{};
    selector::CoefficientDecompositionObservation invalid_null_p8i,
        invalid_callback_p8i;
    p8n::Observation invalid_null_p8n, invalid_callback_p8n;
    p8p::TimingObservation invalid_null_timing, invalid_callback_timing;
    Recorder invalid_recorder;
    const bool invalid_null = p8p::evaluate_prepared_candidate_observed(
        input, 2U, 2U, 2U, target_jet, &invalid_null_output,
        &invalid_null_result, &invalid_null_p8i, &invalid_null_p8n,
        nullptr, nullptr, &invalid_null_timing);
    const bool invalid_callback = p8p::evaluate_prepared_candidate_observed(
        input, 2U, 2U, 2U, target_jet, &invalid_callback_output,
        &invalid_callback_result, &invalid_callback_p8i,
        &invalid_callback_p8n, record_progress, &invalid_recorder,
        &invalid_callback_timing);
    checks.push_back(!invalid_null && !invalid_callback
                     && invalid_recorder.count == 0U
                     && !invalid_null_timing.selector_completed
                     && !invalid_callback_timing.selector_completed
                     && invalid_null_p8n.panels_observed == 0U
                     && invalid_callback_p8n.panels_observed == 0U);
    checks.push_back(callback_p8n.panels_observed == 2U
                     && callback_p8n.terms_observed == 2172U
                     && callback_p8n.boundary_terms_observed == 44U
                     && callback_p8n.p8i_counts_equal
                     && callback_p8n.p8i_aggregate_equal);
    checks.push_back(baseline_result.candidate_evaluations == 0U
                     && null_result.candidate_evaluations == 0U
                     && callback_result.candidate_evaluations == 0U
                     && baseline_result.positive_parameter_samples == 0U
                     && null_result.positive_parameter_samples == 0U
                     && callback_result.positive_parameter_samples == 0U);
    checks.push_back(!callback_result.candidate_root_created
                     && !callback_result.scientific_handler_linked
                     && !callback_result.authority_promoted
                     && callback_p8n.observation_only
                     && callback_p8n.threshold_unchanged
                     && callback_p8n.reduction_order_unchanged);

    std::size_t passed = 0U;
    for (const bool check : checks) if (check) ++passed;
    std::cout
        << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_p8p_observer_progress_fixture.v1\","
        << "\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL")
        << "\",\"checks_passed\":" << passed
        << ",\"checks_total\":" << checks.size()
        << ",\"panel_count\":2,\"target_degree\":3,"
        << "\"target_jet\":" << target_jet
        << ",\"degree_bucket_capacity\":514,"
        << "\"populated_degrees\":" << callback_p8n.populated_degrees
        << ",\"terms_observed\":" << callback_p8n.terms_observed
        << ",\"boundary_terms_observed\":"
        << callback_p8n.boundary_terms_observed
        << ",\"progress_events\":" << recorder.count
        << ",\"baseline_null_callback_equal\":"
        << (same_p8n(baseline_p8n, null_p8n) ? "true" : "false")
        << ",\"null_recording_callback_equal\":"
        << (same_p8n(null_p8n, callback_p8n) ? "true" : "false")
        << ",\"p8i_equal\":"
        << (same_p8i(baseline_p8i, callback_p8i) ? "true" : "false")
        << ",\"six_totals_equal\":"
        << (six_totals_equal ? "true" : "false")
        << ",\"chronology_equal\":"
        << (chronological(recorder, 2U) ? "true" : "false")
        << ",\"representative_input_evaluated\":false,"
        << "\"calibration_executed\":false,"
        << "\"candidate_evaluations\":0,"
        << "\"positive_parameter_samples\":0,"
        << "\"candidate_roots_created\":false,"
        << "\"scientific_handler_linked\":false,"
        << "\"authority_promoted\":false}\n";
    return passed == checks.size() ? 0 : 1;
}
