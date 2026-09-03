#pragma once

#include "mini_boson_star_primary_c08_convolution_selector_v1.hpp"
#include "mini_boson_star_primary_c08_finite_history_v1.hpp"
#include "mini_boson_star_primary_c08_h2_p8p_observer_progress_v1.hpp"

#include <arb.h>

#include <array>
#include <cstddef>
#include <cstdint>
#include <memory>
#include <string>

namespace nhm2::g2h_e_s5::primary_c08_h2_ledger_v1 {

namespace finite = primary_c08_finite_history_v1;
namespace selector = primary_c08_convolution_selector_v1;
namespace ledger = primary_c08_convolution_ledger_v1;
namespace p8p = primary_c08_h2_p8p_observer_progress_v1;
namespace p8n = primary_c08_h2_p8n_selector_term_radius_binding_v1;

inline constexpr slong kPrecisionBits = 512;
inline constexpr std::size_t kJetCount = 13U;
inline constexpr std::size_t kScalarStateCount = 4U;
inline constexpr std::size_t kSelectorThreadCount = 16U;

enum class FailureDetail : std::uint8_t {
    none = 0,
    input_or_output,
    scalar_inventory_or_prefix,
    c08_010_selector,
    centered_to_left_translation,
    ledger_validation,
    fixed_resource,
    terminal_failure_already_recorded,
};

struct Input {
    finite::LedgerSetView scalar_ledgers;
    std::array<std::uint32_t, kScalarStateCount>
        scalar_ledger_identities{};  // B,V,J1,J2
    std::uint32_t h2_ledger_identity = 0U;
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    std::size_t source_models_before = 0U;
    std::size_t source_models_after = 0U;
    std::size_t h2_models_before = 0U;
    std::size_t h2_models_after = 0U;
    std::size_t models_appended = 0U;
    std::size_t selector_calls = 0U;
    std::size_t selector_thread_count = 0U;
    std::size_t selector_u_panels_total = 0U;
    std::size_t selector_refinement_candidates_visited = 0U;
    std::size_t selector_subpanels_accumulated = 0U;
    std::size_t selector_jet_predecessor_calls = 0U;
    std::size_t selector_elementary_convolutions = 0U;
    std::size_t selector_numerical_width_checks = 0U;
    std::size_t translated_coefficient_terms = 0U;
    std::size_t source_prefix_digests_checked = 0U;
    bool exact_h2_orientation = false;
    bool boundary_applied_once_per_selector = false;
    bool centered_to_left_exact_binomial = false;
    bool stable_prior_publication = false;
    bool first_failure_terminal = false;
    bool retry_or_retune_used = false;
    bool signed_remainder_cancellation_used = false;
    bool midpoint_selection_used = false;
    bool point_sampling_used = false;
    bool h2_c08_010_passed = false;
    std::size_t candidate_evaluations = 0U;
    std::size_t positive_parameter_samples = 0U;
    bool candidate_root_created = false;
    bool scientific_handler_linked = false;
    bool authority_promoted = false;
};

inline constexpr std::size_t kMaximumDiagnosticStringBytes = 256U;
inline constexpr std::size_t kMaximumDiagnosticRecordBytes = 65536U;

// P8B retains only the selector executed most recently in the current parent
// call. On failure this is the terminal selector, so the record is bounded by
// the frozen 17-candidate schedule regardless of ledger length.
struct ParentDiagnostics {
    bool present = false;
    std::size_t source_ordinal = 0U;
    std::size_t selector_call_ordinal = 0U;
    bool selector_passed = false;
    selector::FailureDetail selector_detail = selector::FailureDetail::none;
    selector::WidthDiagnostics width;
    bool observation_only = true;
    bool parent_decision_unchanged = true;
    bool persistence_bounded = true;
};

class Context {
  public:
    struct Impl;
    Context();
    ~Context();
    Context(const Context &) = delete;
    Context &operator=(const Context &) = delete;

  private:
    std::unique_ptr<Impl> impl_;
    friend bool initialize(const Input &, Context *, Result *);
    friend bool extend(const Input &, Context *, Result *);
    friend bool initialize_diagnostic(const Input &, Context *, Result *,
                                      ParentDiagnostics *);
    friend bool extend_diagnostic(const Input &, Context *, Result *,
                                  ParentDiagnostics *);
    friend bool diagnose_next_selector_candidate(
        const Input &, const Context *, std::size_t, std::size_t, unsigned,
        std::size_t, selector::Output *, selector::Result *,
        selector::CoefficientDecompositionObservation *);
    friend bool diagnose_next_selector_candidate_observable(
        const Input &, const Context *, std::size_t, std::size_t, unsigned,
        std::size_t, selector::Output *, selector::Result *,
        selector::CoefficientDecompositionObservation *,
        selector::CandidateProgressObserver, void *);
    friend bool diagnose_next_selector_candidate_term_radius_observed(
        const Input &, const Context *, std::size_t, std::size_t, unsigned,
        std::size_t, selector::Output *, selector::Result *,
        selector::CoefficientDecompositionObservation *, p8n::Observation *,
        p8p::ProgressCallback, void *, p8p::TimingObservation *);
    friend ledger::LedgerView published(const Context &);
};

// Produces the acknowledged H2 = B diamond B orientation only, using B as F,
// V as Gprime and the complete B(0) 13-jet boundary inventory. Initialization
// requires the exact coherent B,V,J1,J2 scalar-ledger inventory, validates the
// complete four-ledger geometry, and realizes H2 through the entire supplied
// immutable scalar prefix.
bool initialize(const Input &input, Context *context, Result *result);

// Appends only source ordinals not present at initialization. Every previously
// admitted B/V/J1/J2 source model is checked against its stored canonical
// digest;
// a new H2 model is validated before commit, and the first C08-010,
// translation or validation failure is terminal and cannot be retried.
bool extend(const Input &input, Context *context, Result *result);

// P8B observation-enabled parent entrypoints. They use the same parent and
// selector decisions, retain only the most recent/terminal selector record,
// and never consult diagnostics when accepting or rejecting H2 models.
bool initialize_diagnostic(const Input &input, Context *context,
                           Result *result, ParentDiagnostics *diagnostics);
bool extend_diagnostic(const Input &input, Context *context, Result *result,
                       ParentDiagnostics *diagnostics);

// H2-P8F read-only binding for one named next-ordinal selector candidate.
// It authenticates the admitted prefix and constructs the ordinary selector
// input, but performs no selection, translation, publication or parent-state
// mutation.
bool diagnose_next_selector_candidate(
    const Input &input, const Context *context, std::size_t panel_count,
    std::size_t thread_count, unsigned target_degree, std::size_t target_jet,
    selector::Output *output, selector::Result *result,
    selector::CoefficientDecompositionObservation *observation);

// P8F-C1 adds a write-only monotone progress channel while preserving the
// authenticated prefix, selector input and read-only parent-state boundary.
bool diagnose_next_selector_candidate_observable(
    const Input &input, const Context *context, std::size_t panel_count,
    std::size_t thread_count, unsigned target_degree, std::size_t target_jet,
    selector::Output *output, selector::Result *result,
    selector::CoefficientDecompositionObservation *observation,
    selector::CandidateProgressObserver progress, void *progress_context);

// P8P receipt-only binding. It constructs the same authenticated read-only
// next-ordinal selector input and delegates all arithmetic to the versioned
// P8P wrapper around immutable P8N.
bool diagnose_next_selector_candidate_term_radius_observed(
    const Input &input, const Context *context, std::size_t panel_count,
    std::size_t thread_count, unsigned target_degree, std::size_t target_jet,
    selector::Output *output, selector::Result *result,
    selector::CoefficientDecompositionObservation *predecessor_observation,
    p8n::Observation *observation, p8p::ProgressCallback progress,
    void *progress_context, p8p::TimingObservation *timing);

// Deterministic bounded JSON representation for future executor persistence.
// This function performs no file I/O and rejects incomplete or over-cap data.
bool serialize_diagnostics(const ParentDiagnostics &diagnostics,
                           std::string *canonical);

ledger::LedgerView published(const Context &context);
const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_h2_ledger_v1
