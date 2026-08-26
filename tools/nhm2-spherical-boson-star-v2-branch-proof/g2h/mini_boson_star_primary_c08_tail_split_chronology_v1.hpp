#pragma once

#include "mini_boson_star_primary_c08_convolution_ledger_v1.hpp"

#include <array>
#include <cstddef>
#include <cstdint>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_tail_split_chronology_v1 {

inline constexpr std::size_t kTailSplitAttemptCount = 13U;
inline constexpr std::array<std::size_t, kTailSplitAttemptCount>
    kTailWitnessOnsets = {1U, 2U, 4U, 8U, 16U, 32U, 64U,
                          128U, 256U, 512U, 1024U, 2048U, 4096U};
inline constexpr std::size_t kDigestBytes = 32U;
inline constexpr std::size_t kMaximumLedgerModels =
    primary_c08_convolution_ledger_v1::kMaximumLedgerModels;

enum class RejectionReason : std::uint8_t {
    none = 0,
    parameter_margin,
    lyapunov_construction,
    compact_box_lmi,
    k1_selector,
    k2_selector,
    scalar_onset_constants,
    weighted_edge_history,
    realized_scalar_witness,
    metric_forcing_witness,
    record_inventory,
};

enum class FiniteFailureCode : std::uint8_t {
    none = 0,
    c08_006_origin_series_order_exhaustion,
    c08_007_positive_panel_denominator_or_coefficient,
    c08_008_panel_defect_or_exact_zero_replay,
    c08_009_picard_inflation_or_width_exhaustion,
    c08_010_volterra_convolution_or_u_refinement_exhaustion,
    fixed_resource_failure_at_originating_producer,
};

enum class AttemptDisposition : std::uint8_t {
    rejected_tail_or_growth_witness = 0,
    finite_terminal_failure,
    complete_pass,
};

struct DigestView {
    std::size_t size = 0U;
    const std::uint8_t *bytes = nullptr;
};

struct AttemptView {
    std::size_t ordinal = 0U;
    std::size_t t0 = 0U;
    std::size_t laplace_split_t = 0U;
    bool parameter_margins_verified = false;
    bool lyapunov_constructed = false;
    bool compact_box_lmi_verified = false;
    bool k1_verified = false;
    bool k2_verified = false;
    bool finite_continuation_requested = false;
    bool finite_continuation_succeeded = false;
    bool scalar_onset_constants_verified = false;
    bool weighted_edge_history_verified = false;
    bool realized_scalar_witness_verified = false;
    bool metric_forcing_witness_verified = false;
    bool record_inventory_complete = false;
    std::size_t ledger_models_before = 0U;
    std::size_t ledger_models_after = 0U;
    DigestView ledger_digest_before;
    DigestView reused_prefix_digest;
    DigestView ledger_digest_after;
    RejectionReason rejection_reason = RejectionReason::none;
    FiniteFailureCode finite_failure = FiniteFailureCode::none;
    AttemptDisposition disposition =
        AttemptDisposition::rejected_tail_or_growth_witness;
};

struct Input {
    std::size_t attempt_count = 0U;
    const AttemptView *attempts = nullptr;
};

enum class FailureDetail : std::uint8_t {
    none = 0,
    missing_output,
    attempt_resource_or_pointer,
    onset_or_ordinal_chronology,
    phase_or_reason_chronology,
    ledger_append_only_violation,
    attempts_after_terminal_decision,
};

enum class Outcome : std::uint8_t {
    incomplete_attempt_ledger = 0,
    selected,
    finite_terminal_failure,
    tail_split_exhaustion,
};

struct Output {
    Outcome outcome = Outcome::incomplete_attempt_ledger;
    std::size_t selected_t0 = 0U;
    std::size_t selected_t = 0U;
    std::size_t terminal_attempt_ordinal = 0U;
    std::size_t final_ledger_models = 0U;
    std::array<std::uint8_t, kDigestBytes> final_ledger_digest{};
    std::vector<RejectionReason> ordered_rejection_reasons;
    FiniteFailureCode propagated_finite_failure = FiniteFailureCode::none;
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    std::size_t attempts_validated = 0U;
    std::size_t rejected_witnesses_recorded = 0U;
    bool fixed_onset_schedule = false;
    bool early_tail_before_finite = false;
    bool append_only_prefix_reuse = false;
    bool first_passing_witness_selected = false;
    bool finite_failure_terminal = false;
    bool exhaustion_retuned = false;
    std::size_t state_coefficients_read = 0U;
    std::size_t candidate_evaluations = 0U;
    std::size_t positive_parameter_samples = 0U;
    bool candidate_root_created = false;
    bool scientific_handler_linked = false;
    bool authority_promoted = false;
};

// Candidate-neutral C08-011a controller. It validates already typed predicate
// observations and append-only ledger identities. It constructs no P/LMI,
// finite panel, growth witness or selected-member value.
bool evaluate(const Input &input, Output *output, Result *result);

const char *failure_detail_name(FailureDetail detail);
const char *outcome_name(Outcome outcome);
const char *rejection_reason_name(RejectionReason reason);
const char *finite_failure_name(FiniteFailureCode code);

}  // namespace nhm2::g2h_e_s5::primary_c08_tail_split_chronology_v1
