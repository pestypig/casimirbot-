#pragma once

#include "mini_boson_star_primary_c08_convolution_ledger_v1.hpp"
#include "mini_boson_star_primary_c08_tail_lyapunov_v1.hpp"
#include "mini_boson_star_primary_c08_tail_split_chronology_v1.hpp"

#include <arb.h>

#include <array>
#include <cstddef>
#include <cstdint>
#include <string>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_finite_history_v1 {

namespace ledger = primary_c08_convolution_ledger_v1;
namespace tail = primary_c08_tail_lyapunov_v1;
namespace chronology = primary_c08_tail_split_chronology_v1;

inline constexpr slong kPrecisionBits = 512;
inline constexpr std::size_t kStateCount = 4U;
inline constexpr std::size_t kJetCount = ledger::kJetCount;
inline constexpr std::size_t kMaximumTaggedLedgers = 256U;
inline constexpr std::size_t kMaximumHistoryRequests = 4096U;
inline constexpr std::size_t kDigestBytes = chronology::kDigestBytes;

struct TaggedLedgerView {
    std::uint32_t identity = 0U;
    ledger::LedgerView ledger;
};

struct LedgerSetView {
    std::size_t ledger_count = 0U;
    const TaggedLedgerView *ledgers = nullptr;
};

struct FiniteContinuationRequest {
    std::size_t t0 = 0U;
    std::size_t terminal_t = 0U;
    LedgerSetView accepted_before;
};

struct FiniteContinuationResponse {
    LedgerSetView accepted_after;
    bool c08_006_passed = false;
    bool c08_007_passed = false;
    bool c08_008_passed = false;
    bool c08_009_passed = false;
    bool c08_010_passed = false;
    chronology::FiniteFailureCode failure =
        chronology::FiniteFailureCode::none;
};

using FiniteContinuationProvider = bool (*)(
    const FiniteContinuationRequest &request,
    FiniteContinuationResponse *response,
    void *context);

struct HistoryRequest {
    std::uint32_t orientation = 0U;
    std::uint32_t ledger_identity = 0U;
    arb_srcptr sigma = nullptr;
};

struct Input {
    std::size_t t0 = 0U;
    std::size_t terminal_t = 0U;
    std::size_t tail_witness_t0 = 0U;
    const tail::Output *tail_witness = nullptr;
    const tail::Result *tail_result = nullptr;
    LedgerSetView accepted_before;
    FiniteContinuationProvider continuation_provider = nullptr;
    void *continuation_context = nullptr;
    std::array<std::uint32_t, kStateCount> scalar_state_ledger_identities{};
    std::size_t history_request_count = 0U;
    const HistoryRequest *history_requests = nullptr;
};

enum class FailureDetail : std::uint8_t {
    none = 0,
    missing_output_or_input,
    early_tail_not_passed,
    invalid_onset_or_split,
    ledger_set_resource_or_identity,
    continuation_provider_contract,
    finite_producer_failure,
    append_only_prefix_violation,
    terminal_ledger_invalid_or_uncovered,
    scalar_state_inventory,
    onset_evaluation_failed,
    p_norm_failed,
    history_inventory_or_sigma,
    weighted_history_moment_failed,
};

struct PanelContribution {
    std::size_t request_ordinal = 0U;
    std::uint32_t orientation = 0U;
    std::uint32_t ledger_identity = 0U;
    std::size_t model_ordinal = 0U;
    std::size_t jet_ordinal = 0U;
    arb_t left_endpoint;
    arb_t right_endpoint;
    arb_t contribution;

    PanelContribution();
    ~PanelContribution();
    PanelContribution(const PanelContribution &) = delete;
    PanelContribution &operator=(const PanelContribution &) = delete;
    PanelContribution(PanelContribution &&other) noexcept;
    PanelContribution &operator=(PanelContribution &&other) noexcept;
};

struct Output {
    std::array<std::uint8_t, kDigestBytes> ledger_digest_before{};
    std::array<std::uint8_t, kDigestBytes> reused_prefix_digest{};
    std::array<std::uint8_t, kDigestBytes> ledger_digest_after{};
    std::size_t ledger_models_before = 0U;
    std::size_t ledger_models_after = 0U;
    std::vector<arb_struct> onset_state_boxes;
    std::vector<arb_struct> onset_qp;
    std::vector<arb_struct> onset_norm_p_upper;
    arb_t c0o;
    arb_t c1o;
    arb_t c2o;
    std::vector<PanelContribution> panel_contributions;
    std::vector<arb_struct> history_totals;

    Output();
    ~Output();
    Output(const Output &) = delete;
    Output &operator=(const Output &) = delete;

    arb_ptr onset_state(std::size_t jet, std::size_t state);
    arb_srcptr onset_state(std::size_t jet, std::size_t state) const;
    arb_ptr history_total(std::size_t request, std::size_t jet);
    arb_srcptr history_total(std::size_t request, std::size_t jet) const;
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    chronology::FiniteFailureCode propagated_finite_failure =
        chronology::FiniteFailureCode::none;
    std::size_t ledgers_validated = 0U;
    std::size_t prefix_models_compared = 0U;
    std::size_t terminal_models_validated = 0U;
    std::size_t onset_models_hulled = 0U;
    std::size_t onset_boxes_produced = 0U;
    std::size_t p_norm_quadratic_terms = 0U;
    std::size_t history_panels_integrated = 0U;
    std::size_t incomplete_gamma_moments = 0U;
    std::size_t exact_zero_sigma_moments = 0U;
    bool continuation_requested_after_early_tail = false;
    bool append_only_prefix_reused_byte_for_byte = false;
    bool increasing_panel_chronology = false;
    bool signed_remainder_cancellation_used = false;
    std::size_t state_coefficients_read = 0U;
    std::size_t candidate_evaluations = 0U;
    std::size_t positive_parameter_samples = 0U;
    bool candidate_root_created = false;
    bool scientific_handler_linked = false;
    bool authority_promoted = false;
};

// Candidate-neutral C08-011c producer. The caller-supplied continuation
// provider is invoked only after an accepted C08-011b witness. The returned
// C08-006..010 ledgers are admitted only when every earlier model is reused in
// its canonical byte representation and every ledger covers T=2*T0. The
// producer then computes all 13 scalar onset P-norm boxes and each requested
// weighted finite-history panel sum. It performs no file I/O, selected-member
// ingress, handler dispatch, authorization, or output-root operation.
bool evaluate(const Input &input, Output *output, Result *result);

const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_finite_history_v1
