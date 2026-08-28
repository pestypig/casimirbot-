#pragma once

#include "mini_boson_star_primary_c08_h2_ledger_v1.hpp"

#include <array>
#include <cstddef>
#include <cstdint>
#include <memory>

namespace nhm2::g2h_e_s5::primary_c08_p2_ledger_v1 {

namespace h2 = primary_c08_h2_ledger_v1;
namespace finite = primary_c08_finite_history_v1;
namespace ledger = primary_c08_convolution_ledger_v1;

inline constexpr std::size_t kDependencyCount = 4U;

enum class FailureDetail : std::uint8_t {
    none = 0,
    input_or_output,
    dependency_inventory_or_prefix,
    c08_010_selector,
    centered_to_left_translation,
    ledger_validation,
    fixed_resource,
    terminal_failure_already_recorded,
};

struct Input {
    finite::LedgerSetView dependency_ledgers;
    std::array<std::uint32_t, kDependencyCount>
        dependency_ledger_identities{};  // P,Pprime,B,V
    std::uint32_t p2_ledger_identity = 0U;
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    std::size_t source_models_before = 0U;
    std::size_t source_models_after = 0U;
    std::size_t p2_models_before = 0U;
    std::size_t p2_models_after = 0U;
    std::size_t models_appended = 0U;
    std::size_t selector_calls = 0U;
    std::size_t selector_thread_count = 0U;
    std::size_t selector_refinement_candidates_visited = 0U;
    std::size_t selector_subpanels_accumulated = 0U;
    std::size_t source_prefix_digests_checked = 0U;
    bool exact_p2_orientation = false;
    bool boundary_applied_once_per_selector = false;
    bool centered_to_left_exact_binomial = false;
    bool stable_prior_publication = false;
    bool first_failure_terminal = false;
    bool retry_or_retune_used = false;
    bool signed_remainder_cancellation_used = false;
    bool midpoint_selection_used = false;
    bool point_sampling_used = false;
    bool p2_c08_010_passed = false;
    std::size_t candidate_evaluations = 0U;
    std::size_t positive_parameter_samples = 0U;
    bool candidate_root_created = false;
    bool scientific_handler_linked = false;
    bool authority_promoted = false;
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
    friend ledger::LedgerView published(const Context &);
};

// Realizes the acknowledged P2=P diamond P orientation by applying the same
// selector-backed self-convolution engine used for H2 to the ordered dependency
// inventory P,Pprime,B,V. B and V are lineage-bound and prefix-locked even
// though only P and Pprime are convolution operands.
bool initialize(const Input &input, Context *context, Result *result);
bool extend(const Input &input, Context *context, Result *result);

ledger::LedgerView published(const Context &context);
const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_p2_ledger_v1
