#pragma once

#include "mini_boson_star_primary_c08_picard_v1.hpp"

#include <arb.h>

#include <cstddef>
#include <cstdint>

namespace nhm2::g2h_e_s5::primary_c08_successor_panel_v1 {

namespace origin = primary_c08_origin_series_v1;
namespace panel = primary_c08_positive_panel_v1;
namespace picard = primary_c08_picard_v1;

inline constexpr slong kPrecisionBits = 512;
inline constexpr std::size_t kStateCount = panel::kStateCount;
inline constexpr std::size_t kJetCount = panel::kJetCount;
inline constexpr std::size_t kLeftStateBoxCount = kStateCount * kJetCount;

struct Input {
    // The unchanged C08-006 input supplies only the already-audited parameter
    // and chart jets. Its origin state is not reused as the successor p_0.
    origin::Input parameter_origin;
    arb_srcptr left_endpoint = nullptr;
    std::size_t left_state_box_count = 0U;
    arb_srcptr left_state_boxes = nullptr;  // state-major, then 13-jet order
    arb_srcptr target_endpoint = nullptr;
};

enum class FailureDetail : std::uint8_t {
    none = 0,
    predecessor_or_input,
    left_state_nonfinite,
    positive_panel_denominator_or_coefficient,
    panel_defect_or_exact_zero_replay,
    picard_inflation_or_width_exhaustion,
};

struct Output {
    panel::Output polynomial;
    picard::Output enclosure;
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    unsigned accepted_order = 0U;
    unsigned accepted_panel_halvings = 0U;
    unsigned accepted_inflation_exponent = 0U;
    std::size_t order_attempts = 0U;
    std::size_t panel_halving_attempts = 0U;
    std::size_t inflation_attempts = 0U;
    std::size_t left_state_boxes_admitted = 0U;
    std::size_t left_state_boxes_replayed = 0U;
    bool arbitrary_left_endpoint_used = false;
    bool first_passing_order_used = false;
    bool first_passing_inflation_used = false;
    bool exact_power_series_algebra_used = false;
    bool complete_interval_picard_used = false;
    bool signed_cancellation_used = false;
    bool midpoint_acceptance_used = false;
    std::size_t state_coefficients_read = 0U;
    std::size_t candidate_evaluations = 0U;
    std::size_t positive_parameter_samples = 0U;
    bool candidate_root_created = false;
    bool scientific_handler_linked = false;
    bool authority_promoted = false;
};

// Candidate-neutral C08-011c2 single successor-panel producer. It applies the
// acknowledged C08-007..009 equations and fixed order/halving/inflation
// chronology at an arbitrary exact accepted left endpoint, using all 52
// caller-supplied value/first/ordered-second left-state boxes as p_0. It does
// not append or hash a ledger, evaluate the frozen member, perform file I/O,
// dispatch a handler, or promote authority.
bool evaluate(const Input &input, Output *output, Result *result);

const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_successor_panel_v1
