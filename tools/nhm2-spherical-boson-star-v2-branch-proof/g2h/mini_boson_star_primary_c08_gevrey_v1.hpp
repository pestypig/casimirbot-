#pragma once

#include "mini_boson_star_primary_c08_margins_v1.hpp"

#include <arb.h>

#include <cstddef>
#include <cstdint>

namespace nhm2::g2h_e_s5::primary_c08_gevrey_v1 {

inline constexpr std::size_t kJetCount = 13U;
inline constexpr std::size_t kMatrixEntries = kJetCount * kJetCount;
inline constexpr std::size_t kLagCount = 3U;
inline constexpr unsigned kMaximumRateExponent = 1024U;

enum class FailureDetail : std::uint8_t {
    none = 0,
    predecessor_not_passed,
    missing_output,
    lifted_coefficient_or_denominator_nonfinite,
    gevrey_majorant_nonfinite_or_negative,
    rate_exhaustion,
    base_jet_nonfinite,
    base_constant_invalid,
};

struct Input {
    primary_c08_margins_v1::Input margins;
};

struct Output {
    // Recurrence lag first, then row-major 13x13. Each entry of L_s(n) is
    // (a2*n^2+a1*n+a0)/(n+1).
    arb_struct a2[kLagCount][kMatrixEntries];
    arb_struct a1[kLagCount][kMatrixEntries];
    arb_struct a0[kLagCount][kMatrixEntries];
    arb_struct gevrey_majorants[kLagCount];
    arb_struct base_norms[3];
    arb_t selected_rate;
    arb_t base_constant;
    unsigned selected_exponent = 0U;

    Output();
    ~Output();
    Output(const Output &) = delete;
    Output &operator=(const Output &) = delete;
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    std::size_t directed_coefficient_balls = 0U;
    std::size_t majorant_rows_checked = 0U;
    std::size_t base_jet_components_checked = 0U;
    std::size_t rate_attempts = 0U;
    unsigned selected_exponent = 0U;
    bool directed_upper_bounds_used = false;
    bool midpoint_acceptance_used = false;
    std::size_t state_coefficients_read = 0U;
    std::size_t candidate_evaluations = 0U;
    std::size_t positive_parameter_samples = 0U;
    bool candidate_root_created = false;
    bool scientific_handler_linked = false;
    bool authority_promoted = false;
};

// C08-005 candidate-neutral Gevrey-majorant/rate gate. It internally replays
// C08-004, consumes only supplied manufactured/future parameter balls, and
// performs no state-vector read, parameter sampling, file I/O, or candidate
// evaluation.
bool evaluate(const Input &input, Output *output, Result *result);

const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_gevrey_v1
