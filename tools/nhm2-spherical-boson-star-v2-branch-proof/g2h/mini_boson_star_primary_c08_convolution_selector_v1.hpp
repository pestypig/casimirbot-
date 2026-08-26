#pragma once

#include "mini_boson_star_primary_c08_convolution_jet_v1.hpp"

#include <arb.h>

#include <array>
#include <cstddef>
#include <cstdint>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_convolution_selector_v1 {

namespace jet = primary_c08_convolution_jet_v1;
namespace ledger = primary_c08_convolution_ledger_v1;

inline constexpr std::size_t kUPanelCandidateCount = 17U;
inline constexpr std::array<std::size_t, kUPanelCandidateCount>
    kUPanelCandidates = {1U, 2U, 4U, 8U, 16U, 32U, 64U, 128U, 256U,
                         512U, 1024U, 2048U, 4096U, 8192U, 16384U, 32768U,
                         65536U};
inline constexpr long kNumericalWidthExponent = -180L;

struct Input {
    ledger::LedgerView f_ledger;
    ledger::LedgerView gprime_ledger;
    arb_srcptr target_left = nullptr;
    arb_srcptr target_right = nullptr;
    unsigned target_order = 0U;
    std::size_t g_at_zero_count = 0U;
    arb_srcptr g_at_zero_jets = nullptr;
};

enum class FailureDetail : std::uint8_t {
    none = 0,
    missing_output,
    invalid_input_or_predecessor,
    nonfinite_accumulation,
    volterra_convolution_or_u_refinement_exhaustion,
};

struct Output {
    arb_t target_left;
    arb_t target_right;
    arb_t target_center;
    arb_t target_half_width;
    std::vector<arb_struct> retained_xi_coefficients;
    std::vector<arb_struct> uniform_remainder_bounds;
    std::vector<arb_struct> coefficient_width_margins;
    std::vector<arb_struct> remainder_width_margins;
    std::vector<std::size_t> direct_coverage_offsets;
    std::vector<std::size_t> direct_coverage_ordinals;
    std::vector<std::size_t> reflected_coverage_offsets;
    std::vector<std::size_t> reflected_coverage_ordinals;
    unsigned retained_order = 0U;
    std::size_t selected_u_panels = 0U;

    Output();
    ~Output();
    Output(const Output &) = delete;
    Output &operator=(const Output &) = delete;

    arb_ptr coefficient(unsigned degree, std::size_t jet_index);
    arb_srcptr coefficient(unsigned degree, std::size_t jet_index) const;
    arb_ptr remainder(std::size_t jet_index);
    arb_srcptr remainder(std::size_t jet_index) const;
    arb_ptr coefficient_margin(unsigned degree, std::size_t jet_index);
    arb_srcptr coefficient_margin(unsigned degree,
                                  std::size_t jet_index) const;
    arb_ptr remainder_margin(std::size_t jet_index);
    arb_srcptr remainder_margin(std::size_t jet_index) const;
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    std::size_t refinement_candidates_visited = 0U;
    std::size_t subpanels_accumulated = 0U;
    std::size_t jet_predecessor_calls = 0U;
    std::size_t elementary_convolutions = 0U;
    std::size_t numerical_width_checks = 0U;
    bool fixed_candidate_schedule = false;
    bool increasing_subpanel_order = false;
    bool first_passing_candidate_selected = false;
    bool boundary_applied_once = false;
    bool exhaustion_retuned = false;
    bool signed_remainder_cancellation_used = false;
    bool midpoint_selection_used = false;
    bool point_sampling_used = false;
    std::size_t state_coefficients_read = 0U;
    std::size_t candidate_evaluations = 0U;
    std::size_t positive_parameter_samples = 0U;
    bool candidate_root_created = false;
    bool scientific_handler_linked = false;
    bool authority_promoted = false;
};

struct PolicyDecision {
    bool selected = false;
    bool exhausted = false;
    std::size_t selected_u_panels = 0U;
    std::size_t candidates_visited = 0U;
};

// Pure replay of the frozen first-passing schedule. This admits no scientific
// inputs and exists so exhaustion and partial-chronology behavior can be
// fixture-tested without fabricating a second scientific tolerance or cap.
PolicyDecision replay_width_decisions(
    const std::array<bool, kUPanelCandidateCount> &passes,
    std::size_t evaluated_count);

// Candidate-neutral C08-010d selector. It visits the frozen dyadic schedule,
// accumulates exact subpanels in ordinal order, applies F(t)G(0) exactly once,
// and publishes only the first complete output satisfying the fixed width
// rule. It performs no file I/O, selected-member ingress or handler dispatch.
bool evaluate(const Input &input, Output *output, Result *result);

const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_convolution_selector_v1
