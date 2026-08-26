#pragma once

#include "mini_boson_star_primary_c08_gevrey_v1.hpp"

#include <arb.h>

#include <cstddef>
#include <cstdint>

namespace nhm2::g2h_e_s5::primary_c08_origin_series_v1 {

inline constexpr std::size_t kJetCount = primary_c08_gevrey_v1::kJetCount;
inline constexpr std::size_t kTailKindCount = 5U;
inline constexpr std::size_t kOrderCandidateCount = 7U;
inline constexpr unsigned kMaximumOriginOrder = 256U;

enum class TailKind : std::uint8_t {
    B = 0,
    V = 1,
    B_second = 2,
    J1 = 3,
    J2 = 4,
};

enum class FailureDetail : std::uint8_t {
    none = 0,
    predecessor_not_passed,
    missing_output,
    rate_identity_invalid,
    origin_compatibility_invalid,
    coefficient_recurrence_nonfinite,
    t0_or_geometric_ratio_invalid,
    origin_series_order_exhaustion,
};

struct Input {
    primary_c08_gevrey_v1::Input gevrey;
};

struct Output {
    arb_t t0;
    arb_t geometric_ratio;
    // Frozen 13-jet order, then B,V,B'',J1,J2.
    arb_struct partial_values[kJetCount][kTailKindCount];
    arb_struct tail_bounds[kJetCount][kTailKindCount];
    arb_struct enclosed_values[kJetCount][kTailKindCount];
    unsigned selected_order = 0U;

    Output();
    ~Output();
    Output(const Output &) = delete;
    Output &operator=(const Output &) = delete;
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    std::size_t order_attempts = 0U;
    std::size_t recurrence_coefficients_generated = 0U;
    std::size_t tail_enclosures_checked = 0U;
    std::size_t origin_compatibility_checks = 0U;
    unsigned selected_order = 0U;
    bool first_passing_order_used = false;
    bool directed_upper_bounds_used = false;
    bool midpoint_acceptance_used = false;
    std::size_t state_coefficients_read = 0U;
    std::size_t candidate_evaluations = 0U;
    std::size_t positive_parameter_samples = 0U;
    bool candidate_root_created = false;
    bool scientific_handler_linked = false;
    bool authority_promoted = false;
};

// C08-006 candidate-neutral origin localization and order selector. It
// internally replays C08-005 and uses only manufactured/future parameter balls;
// it performs no state-vector read, sampling, file I/O, or candidate evaluation.
bool evaluate(const Input &input, Output *output, Result *result);

const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_origin_series_v1
