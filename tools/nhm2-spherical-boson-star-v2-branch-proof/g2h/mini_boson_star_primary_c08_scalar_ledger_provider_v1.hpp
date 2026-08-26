#pragma once

#include "mini_boson_star_primary_c08_finite_history_v1.hpp"
#include "mini_boson_star_primary_c08_origin_models_v1.hpp"
#include "mini_boson_star_primary_c08_successor_panel_v1.hpp"

#include <arb.h>

#include <array>
#include <cstddef>
#include <cstdint>
#include <memory>

namespace nhm2::g2h_e_s5::primary_c08_scalar_ledger_provider_v1 {

namespace finite = primary_c08_finite_history_v1;
namespace origin_models = primary_c08_origin_models_v1;
namespace successor = primary_c08_successor_panel_v1;
namespace chronology = primary_c08_tail_split_chronology_v1;

inline constexpr slong kPrecisionBits = 512;
inline constexpr std::size_t kStateCount = 4U;
inline constexpr std::size_t kJetCount = 13U;

enum class FailureDetail : std::uint8_t {
    none = 0,
    input_or_output,
    c08_006_origin,
    c08_007_positive_panel,
    c08_008_panel_defect,
    c08_009_picard,
    fixed_resource,
    publication_or_endpoint,
    terminal_failure_already_recorded,
};

struct Input {
    origin_models::origin::Input origin;
    std::array<std::uint32_t, kStateCount> scalar_ledger_identities{};
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    chronology::FiniteFailureCode finite_failure =
        chronology::FiniteFailureCode::none;
    std::size_t models_before_per_ledger = 0U;
    std::size_t models_after_per_ledger = 0U;
    std::size_t panels_appended = 0U;
    std::size_t endpoint_boxes_produced = 0U;
    bool c08_006_passed = false;
    bool c08_007_passed = false;
    bool c08_008_passed = false;
    bool c08_009_passed = false;
    bool c08_010_passed = false;
    bool append_only = false;
    bool stable_prior_publication = false;
    bool first_failure_terminal = false;
    bool retry_or_retune_used = false;
    bool signed_remainder_cancellation_used = false;
    bool midpoint_acceptance_used = false;
    std::size_t state_coefficients_read = 0U;
    std::size_t candidate_evaluations = 0U;
    std::size_t positive_parameter_samples = 0U;
    bool candidate_root_created = false;
    bool scientific_handler_linked = false;
    bool authority_promoted = false;
};

class Context {
  public:
    Context();
    ~Context();
    Context(const Context &) = delete;
    Context &operator=(const Context &) = delete;

  private:
    struct Impl;
    std::unique_ptr<Impl> impl_;
    friend bool initialize(const Input &, Context *, Result *);
    friend bool extend_to(Context *, arb_srcptr, Result *);
    friend finite::LedgerSetView published(const Context &);
    friend arb_srcptr right_endpoint(const Context &);
};

// Builds only the four canonical C08-006 origin ledgers. The Input and every
// pointed-to parameter ball must outlive Context because successor panels
// replay the unchanged origin/parameter definition.
bool initialize(const Input &input, Context *context, Result *result);

// Monotonically appends C08-007..009 successor models through an exact target.
// Accepted model objects and prior publication views are never mutated. The
// first finite failure is terminal in this context. C08-010 remains explicitly
// false; this function is not yet a valid C08-011c1 callback.
bool extend_to(Context *context, arb_srcptr target, Result *result);

finite::LedgerSetView published(const Context &context);
arb_srcptr right_endpoint(const Context &context);
const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_scalar_ledger_provider_v1
