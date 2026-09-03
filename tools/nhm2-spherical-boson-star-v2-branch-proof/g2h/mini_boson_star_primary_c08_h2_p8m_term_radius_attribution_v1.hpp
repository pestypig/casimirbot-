#pragma once

#include "mini_boson_star_primary_c08_convolution_bivariate_v1.hpp"

#include <arb.h>

#include <cstddef>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_h2_p8m_term_radius_attribution_v1 {

namespace bivariate = primary_c08_convolution_bivariate_v1;

struct DegreeRadiusAttribution {
    arb_t f_coefficient;
    arb_t gprime_coefficient;
    arb_t prepared_moment;
    arb_t product_rounding;
    arb_t translation_weight;
    arb_t absolute_accumulation;
    std::size_t terms = 0U;

    DegreeRadiusAttribution();
    ~DegreeRadiusAttribution();
    DegreeRadiusAttribution(const DegreeRadiusAttribution &) = delete;
    DegreeRadiusAttribution &operator=(const DegreeRadiusAttribution &) = delete;
};

struct Attribution {
    std::vector<DegreeRadiusAttribution *> by_global_t_degree;
    arb_t f_coefficient_total;
    arb_t gprime_coefficient_total;
    arb_t prepared_moment_total;
    arb_t product_rounding_total;
    arb_t translation_weight_total;
    arb_t absolute_accumulation_total;
    arb_t reconstructed_integrated_radius;
    arb_t observed_integrated_radius;
    unsigned target_degree = 0U;
    std::size_t terms_observed = 0U;
    bool exact_radius_reconstruction = false;
    bool exact_observed_integrated_match = false;
    bool origin_channels_complete = false;
    bool observation_only = true;
    bool evaluated = false;

    Attribution();
    ~Attribution();
    Attribution(const Attribution &) = delete;
    Attribution &operator=(const Attribution &) = delete;
};

// P8M is diagnostic-only. The established P8H evaluator produces output and
// result. This observer rereads the same public ledgers and prepared moments,
// emits fixed origin/degree aggregates, and is never consulted by scientific
// acceptance, schedule selection, or failure precedence.
bool evaluate_prepared_observed(
    const bivariate::Input &input,
    const bivariate::PreparedMoments &prepared,
    unsigned target_degree,
    bivariate::Output *output,
    bivariate::Result *result,
    bivariate::CoefficientAttribution *predecessor_attribution,
    Attribution *attribution);

}  // namespace nhm2::g2h_e_s5::primary_c08_h2_p8m_term_radius_attribution_v1
