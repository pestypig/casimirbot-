#pragma once

#include "mini_boson_star_primary_c08_positive_panel_v1.hpp"

#include <arb.h>

#include <cstddef>
#include <cstdint>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_panel_defect_v1 {

inline constexpr std::size_t kJetCount =
    primary_c08_positive_panel_v1::kJetCount;
inline constexpr std::size_t kStateCount =
    primary_c08_positive_panel_v1::kStateCount;
inline constexpr unsigned kMaximumPanelOrder =
    primary_c08_positive_panel_v1::kMaximumPanelOrder;
inline constexpr unsigned kMaximumDefectDegree = kMaximumPanelOrder + 2U;

enum class FailureDetail : std::uint8_t {
    none = 0,
    predecessor_not_passed,
    missing_output,
    defect_coefficient_nonfinite,
    low_order_defect_does_not_contain_zero,
    full_panel_defect_nonfinite,
    exact_zero_replay_failed,
};

struct Input {
    primary_c08_positive_panel_v1::Input panel;
};

struct Output {
    // Degree-major, then B,V,J1,J2, then the frozen 13-jet order.
    std::vector<arb_struct> cleared_defect_coefficients;
    // B,V,J1,J2, then the frozen 13-jet order. Each entry is an exact
    // nonnegative directed upper bound for the full-panel defect magnitude.
    std::vector<arb_struct> defect_magnitude_upper;
    unsigned generated_order = 0U;
    unsigned maximum_defect_degree = 0U;
    bool all_exact_zero = false;

    Output();
    ~Output();
    Output(const Output &) = delete;
    Output &operator=(const Output &) = delete;

    arb_ptr coefficient(std::size_t degree, std::size_t state,
                        std::size_t jet = 0U);
    arb_srcptr coefficient(std::size_t degree, std::size_t state,
                           std::size_t jet = 0U) const;
    arb_ptr magnitude(std::size_t state, std::size_t jet = 0U);
    arb_srcptr magnitude(std::size_t state, std::size_t jet = 0U) const;
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    unsigned requested_order = 0U;
    unsigned panel_halvings = 0U;
    std::size_t low_order_zero_containment_checks = 0U;
    std::size_t complete_defect_coefficient_balls = 0U;
    std::size_t full_panel_magnitude_bounds = 0U;
    bool denominator_guards_replayed = false;
    bool exact_zero_branch_exercised = false;
    bool exact_zero_replay_passed = false;
    bool complete_interval_range_used = false;
    bool signed_cancellation_used = false;
    bool panel_accepted = false;
    bool picard_inclusion_performed = false;
    bool midpoint_acceptance_used = false;
    std::size_t state_coefficients_read = 0U;
    std::size_t candidate_evaluations = 0U;
    std::size_t positive_parameter_samples = 0U;
    bool candidate_root_created = false;
    bool scientific_handler_linked = false;
    bool authority_promoted = false;
};

// Candidate-neutral C08-008 defect producer. It replays C08-007, constructs
// the complete cleared residual and full-panel magnitude bounds, and exercises
// the exact-zero replay branch with an internal manufactured identity. It does
// not perform Picard inclusion, choose/accept a panel, sample selected data, or
// perform file I/O.
bool evaluate(const Input &input, Output *output, Result *result);

const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_panel_defect_v1
