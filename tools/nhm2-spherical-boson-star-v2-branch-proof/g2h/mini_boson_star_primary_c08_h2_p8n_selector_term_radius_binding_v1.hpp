#pragma once

#include "mini_boson_star_primary_c08_convolution_selector_v1.hpp"
#include "mini_boson_star_primary_c08_h2_p8m_term_radius_attribution_v1.hpp"

#include <arb.h>

#include <cstddef>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_h2_p8n_selector_term_radius_binding_v1 {

namespace p8m = primary_c08_h2_p8m_term_radius_attribution_v1;
namespace selector = primary_c08_convolution_selector_v1;

inline constexpr unsigned kMaximumGlobalTDegree =
    2U * p8m::bivariate::kMaximumSourceOrder + 1U;
inline constexpr std::size_t kMaximumDegreeBuckets =
    static_cast<std::size_t>(kMaximumGlobalTDegree) + 1U;

struct DegreeAggregate {
    arb_t f_coefficient;
    arb_t gprime_coefficient;
    arb_t prepared_moment;
    arb_t product_rounding;
    arb_t translation_weight;
    arb_t absolute_accumulation;
    std::size_t terms = 0U;

    DegreeAggregate();
    ~DegreeAggregate();
    DegreeAggregate(const DegreeAggregate &) = delete;
    DegreeAggregate &operator=(const DegreeAggregate &) = delete;
};

struct Observation {
    std::vector<DegreeAggregate *> by_global_t_degree;
    arb_t f_coefficient_total;
    arb_t gprime_coefficient_total;
    arb_t prepared_moment_total;
    arb_t product_rounding_total;
    arb_t translation_weight_total;
    arb_t absolute_accumulation_total;
    std::size_t panel_count = 0U;
    unsigned target_degree = 0U;
    std::size_t target_jet = 0U;
    std::size_t panels_observed = 0U;
    std::size_t terms_observed = 0U;
    std::size_t boundary_terms_observed = 0U;
    std::size_t populated_degrees = 0U;
    bool all_panel_integrated_matches = false;
    bool p8i_counts_equal = false;
    bool p8i_aggregate_equal = false;
    bool origin_channels_complete = false;
    bool bounded_degree_inventory = false;
    bool observation_only = true;
    bool selector_output_unchanged = true;
    bool selector_result_unchanged = true;
    bool threshold_unchanged = true;
    bool reduction_order_unchanged = true;
    bool evaluated = false;

    Observation();
    ~Observation();
    Observation(const Observation &) = delete;
    Observation &operator=(const Observation &) = delete;
};

// P8N leaves P8I as the sole selector Output/Result producer. After P8I
// succeeds, this sidecar replays only slot 3 over the same public panel
// geometry, accumulates the bounded P8M degree/origin fields in serial panel
// order, and requires exact agreement with P8I's existing aggregate receipt.
bool evaluate_prepared_candidate_observed(
    const selector::Input &input, std::size_t panel_count,
    std::size_t thread_count, unsigned target_degree,
    std::size_t target_jet, selector::Output *output,
    selector::Result *result,
    selector::CoefficientDecompositionObservation *predecessor_observation,
    Observation *observation);

}  // namespace nhm2::g2h_e_s5::primary_c08_h2_p8n_selector_term_radius_binding_v1

