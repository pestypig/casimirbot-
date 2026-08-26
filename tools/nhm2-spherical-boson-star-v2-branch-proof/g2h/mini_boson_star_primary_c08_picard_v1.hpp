#pragma once

#include "mini_boson_star_primary_c08_panel_defect_v1.hpp"

#include <arb.h>

#include <cstddef>
#include <cstdint>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_picard_v1 {

inline constexpr std::size_t kJetCount =
    primary_c08_panel_defect_v1::kJetCount;
inline constexpr std::size_t kStateCount =
    primary_c08_panel_defect_v1::kStateCount;
inline constexpr std::size_t kOrderCandidateCount = 7U;
inline constexpr unsigned kMaximumPanelOrder = 192U;
inline constexpr unsigned kMaximumPanelHalvings = 32U;
inline constexpr unsigned kMaximumInflationExponent = 16U;

enum class FailureDetail : std::uint8_t {
    none = 0,
    predecessor_not_passed,
    missing_output,
    picard_inflation_or_width_exhaustion,
};

struct Input {
    primary_c08_origin_series_v1::Input origin;
    arb_srcptr target_endpoint = nullptr;
};

struct Output {
    arb_t left_endpoint;
    arb_t panel_width;
    arb_t right_endpoint;
    arb_t common_remainder_radius;
    // Frozen B,V,J1,J2 then 13-jet order.
    std::vector<arb_struct> remainder_boxes;
    std::vector<arb_struct> strict_containment_margins;
    unsigned accepted_order = 0U;
    unsigned accepted_panel_halvings = 0U;
    unsigned accepted_inflation_exponent = 0U;
    bool exact_zero_remainder = false;

    Output();
    ~Output();
    Output(const Output &) = delete;
    Output &operator=(const Output &) = delete;

    arb_ptr remainder(std::size_t state, std::size_t jet = 0U);
    arb_srcptr remainder(std::size_t state, std::size_t jet = 0U) const;
    arb_ptr margin(std::size_t state, std::size_t jet = 0U);
    arb_srcptr margin(std::size_t state, std::size_t jet = 0U) const;
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    std::size_t order_attempts = 0U;
    std::size_t panel_halving_attempts = 0U;
    std::size_t inflation_attempts = 0U;
    std::size_t strict_component_checks = 0U;
    std::size_t numerical_width_checks = 0U;
    bool first_passing_order_used = false;
    bool first_passing_inflation_used = false;
    bool complete_parameter_box_used = false;
    bool component_weights_all_one = false;
    bool signed_cancellation_used = false;
    bool midpoint_acceptance_used = false;
    bool panel_accepted = false;
    bool picard_inclusion_performed = false;
    std::size_t state_coefficients_read = 0U;
    std::size_t candidate_evaluations = 0U;
    std::size_t positive_parameter_samples = 0U;
    bool candidate_root_created = false;
    bool scientific_handler_linked = false;
    bool authority_promoted = false;
};

// Candidate-neutral C08-009 selector. It visits panel halvings, fixed Taylor
// orders, and lambda=2^j inflations only in the acknowledged order, accepts the
// first strict componentwise Picard enclosure satisfying the numerical-width
// rule, and performs no selected-state ingress, sampling, or file I/O.
bool evaluate(const Input &input, Output *output, Result *result);

const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_picard_v1
