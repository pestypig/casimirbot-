#pragma once

#include "mini_boson_star_primary_c08_convolution_jet_v1.hpp"

#include <arb.h>

#include <array>
#include <cstddef>
#include <cstdint>
#include <string>
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
inline constexpr std::size_t kMaximumParallelThreads = 64U;

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
    parallel_resource,
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

enum class WidthTermKind : std::uint8_t {
    none = 0,
    coefficient,
    remainder,
};

// H2-P8A additive observation record. Decimal strings are emitted only after
// the frozen width decision has been computed. They have no role in selection.
struct WidthObservation {
    bool evaluated = false;
    bool passed = false;
    std::size_t candidate_index = 0U;
    std::size_t panel_count = 0U;
    std::size_t width_checks = 0U;
    WidthTermKind first_failed_kind = WidthTermKind::none;
    unsigned first_failed_degree = 0U;
    std::size_t first_failed_jet = 0U;
    std::string first_failed_radius;
    std::string first_failed_threshold;
    std::string first_failed_ratio;
    WidthTermKind worst_kind = WidthTermKind::none;
    unsigned worst_degree = 0U;
    std::size_t worst_jet = 0U;
    std::string worst_radius;
    std::string worst_threshold;
    std::string worst_ratio;
    bool worst_ratio_exceeds_one = false;
};

struct WidthDiagnostics {
    std::array<WidthObservation, kUPanelCandidateCount> candidates{};
    std::size_t observations = 0U;
    bool observation_only = true;
    bool fixed_candidate_schedule = true;
    bool thresholds_unchanged = true;
    bool reduction_order_unchanged = true;
    bool all_observed_candidates_failed = false;
};

// H2-P8E bounded observation record for one degree/ordered-second-jet
// coefficient. Only four aggregate slots and scalar extrema are retained;
// there is no per-panel history.
struct CoefficientDecompositionObservation {
    bool evaluated = false;
    std::size_t panel_count = 0U;
    unsigned target_degree = 0U;
    std::size_t target_jet = 0U;
    std::size_t terms_per_panel = 0U;
    std::size_t elementary_terms_observed = 0U;
    bool all_panel_reconstructions_equal = false;
    bool final_reconstruction_equal = false;
    std::string final_radius;
    std::string final_threshold;
    std::string final_ratio;
    std::array<std::string, jet::kSecondJetTermCount> slot_radius_sums{};
    std::array<std::string, jet::kSecondJetTermCount>
        slot_upper_magnitude_sums{};
    std::string boundary_panel_radius;
    std::string nonboundary_panel_radius_sum;
    std::string total_elementary_radius_sum;
    std::string final_to_elementary_radius_ratio;
    std::string maximum_elementary_radius;
    std::size_t maximum_elementary_panel_ordinal = 0U;
    std::size_t maximum_elementary_slot = 0U;
    bool slot3_attribution_evaluated = false;
    std::size_t slot3_integrated_terms_observed = 0U;
    std::size_t slot3_boundary_terms_observed = 0U;
    bool all_slot3_reconstructions_equal = false;
    std::string slot3_f_source_hull_radius_sum;
    std::string slot3_gprime_source_hull_radius_sum;
    std::string slot3_direct_integrated_radius_sum;
    std::string slot3_boundary_radius_sum;
    std::string slot3_integrated_component_radius_sum;
    std::string slot3_boundary_component_radius_sum;
    bool observation_only = true;
    bool threshold_unchanged = true;
    bool reduction_order_unchanged = true;
};

// Candidate-neutral observability hook. It is invoked only after a complete
// batch has been reduced in the frozen serial ordinal order. The return value
// cannot affect numerical control flow or acceptance.
using CandidateProgressObserver = void (*)(std::size_t completed_panels,
                                           std::size_t total_panels,
                                           void *context);

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

// Additive H2-P3 path. Refinement candidates remain sequential. Independent
// subpanels are evaluated in bounded batches, stored by ordinal, and reduced
// serially in the original order using the H2-P2 prepared-moment kernel.
bool evaluate_prepared_parallel(const Input &input, std::size_t thread_count,
                                Output *output, Result *result);

// H2-P8A observation-enabled overload. The selector decision and Result/Output
// values are identical to evaluate_prepared_parallel; diagnostics are a
// write-only side channel and are never consulted by the selection policy.
bool evaluate_prepared_parallel_diagnostic(
    const Input &input, std::size_t thread_count, Output *output,
    Result *result, WidthDiagnostics *diagnostics);

// Candidate-neutral manufactured-fixture surface for the frozen width rule.
// It applies the same margin computation to an already accumulated Output and
// records the discarded observation values without selecting a candidate.
bool inspect_width_candidate(Output &output, std::size_t candidate_index,
                             WidthObservation *observation,
                             std::size_t *checks);

// Candidate-neutral H2-P3 fixture/calibration surface. This evaluates exactly
// one named dyadic refinement candidate and performs no width selection.
bool evaluate_prepared_candidate(const Input &input, std::size_t panel_count,
                                 std::size_t thread_count, Output *output,
                                 Result *result);

// Candidate-neutral H2-P8E surface. It evaluates one already permitted dyadic
// candidate and attributes one coefficient to the four frozen second-jet
// product-rule terms without performing selector acceptance or publication.
bool evaluate_prepared_candidate_decomposition(
    const Input &input, std::size_t panel_count, std::size_t thread_count,
    unsigned target_degree, std::size_t target_jet, Output *output,
    Result *result, CoefficientDecompositionObservation *observation);

// P8F-C1 cloud-observable overload. Numerical inputs, reduction ordering and
// returned scientific values are identical to the observation-only surface
// above; the callback receives monotone completed-panel counters only.
bool evaluate_prepared_candidate_decomposition_observable(
    const Input &input, std::size_t panel_count, std::size_t thread_count,
    unsigned target_degree, std::size_t target_jet, Output *output,
    Result *result, CoefficientDecompositionObservation *observation,
    CandidateProgressObserver progress, void *progress_context);

const char *failure_detail_name(FailureDetail detail);
const char *width_term_kind_name(WidthTermKind kind);

}  // namespace nhm2::g2h_e_s5::primary_c08_convolution_selector_v1
