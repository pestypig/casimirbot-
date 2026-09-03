#include "mini_boson_star_primary_c08_h2_p8p_observer_progress_v1.hpp"

#include <flint/flint.h>

#include <algorithm>
#include <chrono>
#include <string>

namespace nhm2::g2h_e_s5::primary_c08_h2_p8p_observer_progress_v1 {
namespace {

namespace p8m = primary_c08_h2_p8m_term_radius_attribution_v1;
namespace bivariate = p8m::bivariate;
namespace jet = primary_c08_convolution_jet_v1;
namespace ledger = primary_c08_convolution_ledger_v1;

constexpr slong kPrecisionBits = 512;

std::uint64_t now_nanoseconds() {
    const auto value = std::chrono::duration_cast<std::chrono::nanoseconds>(
        std::chrono::steady_clock::now().time_since_epoch()).count();
    return value < 0 ? 0U : static_cast<std::uint64_t>(value);
}

std::uint64_t elapsed(std::uint64_t begin, std::uint64_t end) {
    return end >= begin ? end - begin : 0U;
}

bool finite_nonnegative(arb_srcptr value) {
    return value != nullptr && arb_is_finite(value) && !arb_is_negative(value);
}

void add(arb_ptr destination, arb_srcptr source) {
    arb_t next;
    arb_init(next);
    arb_add(next, destination, source, kPrecisionBits);
    arb_set(destination, next);
    arb_clear(next);
}

std::string decimal_ball(arb_srcptr value) {
    char *raw = arb_get_str(value, 80, 0U);
    if (raw == nullptr) return {};
    std::string rendered(raw);
    flint_free(raw);
    return rendered;
}

unsigned maximum_order(const ledger::LedgerView &view,
                       const std::vector<std::size_t> &ordinals) {
    unsigned maximum = 0U;
    for (const std::size_t ordinal : ordinals)
        maximum = std::max(maximum, view.models[ordinal].order);
    return maximum;
}

void reset(p8n::Observation &observation) {
    for (p8n::DegreeAggregate *entry : observation.by_global_t_degree)
        delete entry;
    observation.by_global_t_degree.assign(p8n::kMaximumDegreeBuckets, nullptr);
    arb_zero(observation.f_coefficient_total);
    arb_zero(observation.gprime_coefficient_total);
    arb_zero(observation.prepared_moment_total);
    arb_zero(observation.product_rounding_total);
    arb_zero(observation.translation_weight_total);
    arb_zero(observation.absolute_accumulation_total);
    observation.panel_count = 0U;
    observation.target_degree = 0U;
    observation.target_jet = 0U;
    observation.panels_observed = 0U;
    observation.terms_observed = 0U;
    observation.boundary_terms_observed = 0U;
    observation.populated_degrees = 0U;
    observation.all_panel_integrated_matches = true;
    observation.p8i_counts_equal = false;
    observation.p8i_aggregate_equal = false;
    observation.origin_channels_complete = false;
    observation.bounded_degree_inventory = true;
    observation.observation_only = true;
    observation.selector_output_unchanged = true;
    observation.selector_result_unchanged = true;
    observation.threshold_unchanged = true;
    observation.reduction_order_unchanged = true;
    observation.evaluated = false;
}

void reset(TimingObservation &timing, bool callback_enabled) {
    timing = TimingObservation{};
    timing.callback_enabled = callback_enabled;
}

void finish_timing(TimingObservation &timing, std::uint64_t total_begin) {
    timing.total_nanoseconds = elapsed(total_begin, now_nanoseconds());
    timing.bounded_progress = timing.events_emitted <= timing.last_completed_panels;
    timing.evaluated = timing.selector_completed && timing.observer_completed
        && timing.monotone_progress && timing.bounded_progress
        && timing.callback_observation_only;
}

}  // namespace

bool evaluate_prepared_candidate_observed(
    const selector::Input &input, std::size_t panel_count,
    std::size_t thread_count, unsigned target_degree,
    std::size_t target_jet, selector::Output *output,
    selector::Result *result,
    selector::CoefficientDecompositionObservation *predecessor_observation,
    p8n::Observation *observation, ProgressCallback callback,
    void *callback_context, TimingObservation *timing) {
    if (output == nullptr || result == nullptr
        || predecessor_observation == nullptr || observation == nullptr
        || timing == nullptr) return false;
    reset(*observation);
    reset(*timing, callback != nullptr);
    const std::uint64_t total_begin = now_nanoseconds();
    observation->panel_count = panel_count;
    observation->target_degree = target_degree;
    observation->target_jet = target_jet;
    if (target_degree != 3U || target_jet != jet::second_jet(1U, 2U)
        || thread_count == 0U
        || thread_count > selector::kMaximumParallelThreads) {
        finish_timing(*timing, total_begin);
        return false;
    }

    // Identical P8I producer call and arguments; progress is not visible here.
    const std::uint64_t selector_begin = now_nanoseconds();
    const bool selector_ok = selector::evaluate_prepared_candidate_decomposition(
        input, panel_count, thread_count, target_degree, target_jet,
        output, result, predecessor_observation);
    timing->selector_nanoseconds = elapsed(selector_begin, now_nanoseconds());
    timing->selector_completed = selector_ok;
    if (!selector_ok) {
        finish_timing(*timing, total_begin);
        return false;
    }

    const auto candidate = std::find(selector::kUPanelCandidates.begin(),
                                     selector::kUPanelCandidates.end(),
                                     panel_count);
    if (candidate == selector::kUPanelCandidates.end()) {
        finish_timing(*timing, total_begin);
        return false;
    }
    const unsigned exponent = static_cast<unsigned>(
        std::distance(selector::kUPanelCandidates.begin(), candidate));

    arb_t p8h_f_hull, p8h_g_hull, p8h_direct, p8h_boundary;
    arb_t p8h_integrated_component, p8h_boundary_component;
    arb_init(p8h_f_hull); arb_zero(p8h_f_hull);
    arb_init(p8h_g_hull); arb_zero(p8h_g_hull);
    arb_init(p8h_direct); arb_zero(p8h_direct);
    arb_init(p8h_boundary); arb_zero(p8h_boundary);
    arb_init(p8h_integrated_component); arb_zero(p8h_integrated_component);
    arb_init(p8h_boundary_component); arb_zero(p8h_boundary_component);

    const std::uint64_t observer_begin = now_nanoseconds();
    bool ok = true;
    for (std::size_t ordinal = 0U; ordinal < panel_count && ok; ++ordinal) {
        arb_t u_left, u_right, zero_boundary, radius;
        arb_init(u_left); arb_init(u_right); arb_init(zero_boundary);
        arb_init(radius); arb_zero(zero_boundary);
        arb_set_ui(u_left, static_cast<ulong>(ordinal));
        arb_mul_2exp_si(u_left, u_left, -static_cast<slong>(exponent));
        arb_set_ui(u_right, static_cast<ulong>(ordinal + 1U));
        arb_mul_2exp_si(u_right, u_right, -static_cast<slong>(exponent));

        ledger::Input f_input{input.f_ledger, input.target_left,
            input.target_right, u_left, u_right};
        ledger::Input g_input{input.gprime_ledger, input.target_left,
            input.target_right, u_left, u_right};
        ledger::Output f_coverage, g_coverage;
        ledger::Result f_result{}, g_result{};
        ok = ledger::evaluate(f_input, &f_coverage, &f_result)
            && ledger::evaluate(g_input, &g_coverage, &g_result);
        if (ok) {
            const unsigned max_f = maximum_order(
                input.f_ledger, f_coverage.direct_intersecting_ordinals);
            const unsigned max_g = maximum_order(
                input.gprime_ledger,
                g_coverage.reflected_intersecting_ordinals);
            bivariate::PreparedMoments prepared;
            ok = bivariate::prepare_moments(u_left, u_right, max_f, max_g,
                                             &prepared);
            if (ok) {
                arb_srcptr boundary = ordinal == 0U
                    ? input.g_at_zero_jets + target_jet : zero_boundary;
                bivariate::Input slot3_input{input.f_ledger,
                    input.gprime_ledger, input.target_left,
                    input.target_right, input.target_order, u_left, u_right,
                    jet::value_jet(), target_jet, boundary};
                bivariate::Output panel_output;
                bivariate::Result panel_result{};
                bivariate::CoefficientAttribution predecessor;
                p8m::Attribution panel_attribution;
                ok = p8m::evaluate_prepared_observed(
                    slot3_input, prepared, target_degree, &panel_output,
                    &panel_result, &predecessor, &panel_attribution);
                if (ok) {
                    observation->all_panel_integrated_matches =
                        observation->all_panel_integrated_matches
                        && panel_attribution.exact_observed_integrated_match
                        && predecessor.final_reconstruction_equal
                        && arb_equal(predecessor.reconstructed_coefficient,
                                     panel_output.coefficient(target_degree));
                    add(p8h_f_hull,
                        predecessor.f_source_hull_radius_bound);
                    add(p8h_g_hull,
                        predecessor.gprime_source_hull_radius_bound);
                    add(p8h_direct, predecessor.direct_integrated_radius_sum);
                    add(p8h_boundary, predecessor.boundary_radius_sum);
                    arb_get_rad_arb(
                        radius, predecessor.integrated_centered_component);
                    add(p8h_integrated_component, radius);
                    arb_get_rad_arb(
                        radius, predecessor.boundary_centered_component);
                    add(p8h_boundary_component, radius);
                    observation->terms_observed +=
                        panel_attribution.terms_observed;
                    observation->boundary_terms_observed +=
                        predecessor.boundary_terms_observed;

                    if (panel_attribution.by_global_t_degree.size()
                        > p8n::kMaximumDegreeBuckets) ok = false;
                    for (std::size_t degree = 0U;
                         ok && degree
                             < panel_attribution.by_global_t_degree.size();
                         ++degree) {
                        const p8m::DegreeRadiusAttribution *source =
                            panel_attribution.by_global_t_degree[degree];
                        if (source == nullptr) continue;
                        p8n::DegreeAggregate *&destination =
                            observation->by_global_t_degree[degree];
                        if (destination == nullptr) {
                            destination = new p8n::DegreeAggregate();
                            ++observation->populated_degrees;
                        }
                        add(destination->f_coefficient,
                            source->f_coefficient);
                        add(destination->gprime_coefficient,
                            source->gprime_coefficient);
                        add(destination->prepared_moment,
                            source->prepared_moment);
                        add(destination->product_rounding,
                            source->product_rounding);
                        add(destination->translation_weight,
                            source->translation_weight);
                        add(destination->absolute_accumulation,
                            source->absolute_accumulation);
                        destination->terms += source->terms;
                    }
                    if (ok) {
                        ++observation->panels_observed;
                        if (callback != nullptr) {
                            std::uint64_t stamp = now_nanoseconds();
                            if (stamp < timing->last_event_nanoseconds) {
                                timing->monotone_progress = false;
                                stamp = timing->last_event_nanoseconds;
                            }
                            if (timing->events_emitted == 0U)
                                timing->first_event_nanoseconds = stamp;
                            timing->last_event_nanoseconds = stamp;
                            timing->last_completed_panels =
                                observation->panels_observed;
                            ++timing->events_emitted;
                            const ProgressEvent event{Phase::observer,
                                observation->panels_observed, panel_count,
                                stamp};
                            callback(event, callback_context);
                        }
                    }
                }
            }
        }
        arb_clear(radius); arb_clear(zero_boundary);
        arb_clear(u_right); arb_clear(u_left);
    }
    timing->observer_nanoseconds = elapsed(observer_begin, now_nanoseconds());

    if (ok) {
        for (p8n::DegreeAggregate *entry :
             observation->by_global_t_degree) {
            if (entry == nullptr) continue;
            add(observation->f_coefficient_total, entry->f_coefficient);
            add(observation->gprime_coefficient_total,
                entry->gprime_coefficient);
            add(observation->prepared_moment_total, entry->prepared_moment);
            add(observation->product_rounding_total, entry->product_rounding);
            add(observation->translation_weight_total,
                entry->translation_weight);
            add(observation->absolute_accumulation_total,
                entry->absolute_accumulation);
        }
        observation->p8i_counts_equal =
            predecessor_observation->slot3_integrated_terms_observed
                == observation->terms_observed
            && predecessor_observation->slot3_boundary_terms_observed
                == observation->boundary_terms_observed;
        observation->p8i_aggregate_equal =
            predecessor_observation->slot3_f_source_hull_radius_sum
                == decimal_ball(p8h_f_hull)
            && predecessor_observation->slot3_gprime_source_hull_radius_sum
                == decimal_ball(p8h_g_hull)
            && predecessor_observation->slot3_direct_integrated_radius_sum
                == decimal_ball(p8h_direct)
            && predecessor_observation->slot3_boundary_radius_sum
                == decimal_ball(p8h_boundary)
            && predecessor_observation->slot3_integrated_component_radius_sum
                == decimal_ball(p8h_integrated_component)
            && predecessor_observation->slot3_boundary_component_radius_sum
                == decimal_ball(p8h_boundary_component);
        observation->origin_channels_complete =
            finite_nonnegative(observation->f_coefficient_total)
            && finite_nonnegative(observation->gprime_coefficient_total)
            && finite_nonnegative(observation->prepared_moment_total)
            && finite_nonnegative(observation->product_rounding_total)
            && finite_nonnegative(observation->translation_weight_total)
            && finite_nonnegative(observation->absolute_accumulation_total);
        observation->bounded_degree_inventory =
            observation->by_global_t_degree.size()
                == p8n::kMaximumDegreeBuckets
            && observation->populated_degrees
                <= p8n::kMaximumDegreeBuckets;
        observation->evaluated =
            observation->panels_observed == panel_count
            && observation->all_panel_integrated_matches
            && observation->p8i_counts_equal
            && observation->p8i_aggregate_equal
            && observation->origin_channels_complete
            && observation->bounded_degree_inventory;
        ok = observation->evaluated;
    }
    timing->observer_completed = ok;
    if (callback == nullptr) {
        timing->last_completed_panels = observation->panels_observed;
    } else {
        timing->bounded_progress = timing->events_emitted == panel_count
            && timing->last_completed_panels == panel_count;
    }
    finish_timing(*timing, total_begin);
    timing->evaluated = timing->evaluated && ok;

    arb_clear(p8h_boundary_component); arb_clear(p8h_integrated_component);
    arb_clear(p8h_boundary); arb_clear(p8h_direct);
    arb_clear(p8h_g_hull); arb_clear(p8h_f_hull);
    return ok;
}

}  // namespace nhm2::g2h_e_s5::primary_c08_h2_p8p_observer_progress_v1
