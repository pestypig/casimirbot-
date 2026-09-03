#include "mini_boson_star_primary_c08_h2_p8n_selector_term_radius_binding_v1.hpp"

#include <flint/flint.h>

#include <algorithm>

namespace nhm2::g2h_e_s5::primary_c08_h2_p8n_selector_term_radius_binding_v1 {
namespace {

namespace bivariate = p8m::bivariate;
namespace jet = primary_c08_convolution_jet_v1;
namespace ledger = primary_c08_convolution_ledger_v1;

constexpr slong kPrecisionBits = 512;

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

void reset(Observation &observation) {
    for (DegreeAggregate *entry : observation.by_global_t_degree) delete entry;
    observation.by_global_t_degree.assign(kMaximumDegreeBuckets, nullptr);
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

}  // namespace

DegreeAggregate::DegreeAggregate() {
    arb_init(f_coefficient); arb_zero(f_coefficient);
    arb_init(gprime_coefficient); arb_zero(gprime_coefficient);
    arb_init(prepared_moment); arb_zero(prepared_moment);
    arb_init(product_rounding); arb_zero(product_rounding);
    arb_init(translation_weight); arb_zero(translation_weight);
    arb_init(absolute_accumulation); arb_zero(absolute_accumulation);
}

DegreeAggregate::~DegreeAggregate() {
    arb_clear(absolute_accumulation); arb_clear(translation_weight);
    arb_clear(product_rounding); arb_clear(prepared_moment);
    arb_clear(gprime_coefficient); arb_clear(f_coefficient);
}

Observation::Observation() {
    arb_init(f_coefficient_total); arb_init(gprime_coefficient_total);
    arb_init(prepared_moment_total); arb_init(product_rounding_total);
    arb_init(translation_weight_total); arb_init(absolute_accumulation_total);
    reset(*this);
}

Observation::~Observation() {
    for (DegreeAggregate *entry : by_global_t_degree) delete entry;
    arb_clear(absolute_accumulation_total); arb_clear(translation_weight_total);
    arb_clear(product_rounding_total); arb_clear(prepared_moment_total);
    arb_clear(gprime_coefficient_total); arb_clear(f_coefficient_total);
}

bool evaluate_prepared_candidate_observed(
    const selector::Input &input, std::size_t panel_count,
    std::size_t thread_count, unsigned target_degree,
    std::size_t target_jet, selector::Output *output,
    selector::Result *result,
    selector::CoefficientDecompositionObservation *predecessor_observation,
    Observation *observation) {
    if (output == nullptr || result == nullptr
        || predecessor_observation == nullptr || observation == nullptr)
        return false;
    reset(*observation);
    observation->panel_count = panel_count;
    observation->target_degree = target_degree;
    observation->target_jet = target_jet;
    if (target_degree != 3U || target_jet != jet::second_jet(1U, 2U)
        || thread_count == 0U
        || thread_count > selector::kMaximumParallelThreads) return false;

    // The frozen P8I selector remains the sole scientific producer.
    if (!selector::evaluate_prepared_candidate_decomposition(
            input, panel_count, thread_count, target_degree, target_jet,
            output, result, predecessor_observation)) return false;

    const auto candidate = std::find(selector::kUPanelCandidates.begin(),
                                     selector::kUPanelCandidates.end(),
                                     panel_count);
    if (candidate == selector::kUPanelCandidates.end()) return false;
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
                    ++observation->panels_observed;

                    if (panel_attribution.by_global_t_degree.size()
                        > kMaximumDegreeBuckets) ok = false;
                    for (std::size_t degree = 0U;
                         ok && degree
                             < panel_attribution.by_global_t_degree.size();
                         ++degree) {
                        const p8m::DegreeRadiusAttribution *source =
                            panel_attribution.by_global_t_degree[degree];
                        if (source == nullptr) continue;
                        DegreeAggregate *&destination =
                            observation->by_global_t_degree[degree];
                        if (destination == nullptr) {
                            destination = new DegreeAggregate();
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
                }
            }
        }
        arb_clear(radius); arb_clear(zero_boundary);
        arb_clear(u_right); arb_clear(u_left);
    }

    if (ok) {
        for (DegreeAggregate *entry : observation->by_global_t_degree) {
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
            observation->by_global_t_degree.size() == kMaximumDegreeBuckets
            && observation->populated_degrees <= kMaximumDegreeBuckets;
        observation->evaluated = observation->panels_observed == panel_count
            && observation->all_panel_integrated_matches
            && observation->p8i_counts_equal
            && observation->p8i_aggregate_equal
            && observation->origin_channels_complete
            && observation->bounded_degree_inventory;
        ok = observation->evaluated;
    }
    arb_clear(p8h_boundary_component); arb_clear(p8h_integrated_component);
    arb_clear(p8h_boundary); arb_clear(p8h_direct);
    arb_clear(p8h_g_hull); arb_clear(p8h_f_hull);
    return ok;
}

}  // namespace nhm2::g2h_e_s5::primary_c08_h2_p8n_selector_term_radius_binding_v1

