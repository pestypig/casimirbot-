#pragma once

#include "mini_boson_star_primary_c08_analytic_factor_model_v1.hpp"
#include "mini_boson_star_primary_c08_finite_history_v1.hpp"

#include <array>
#include <cstddef>
#include <cstdint>
#include <memory>

namespace nhm2::g2h_e_s5::primary_c08_analytic_factor_ledgers_v1 {

namespace analytic = primary_c08_analytic_parameter_jets_v1;
namespace factor = primary_c08_analytic_factor_model_v1;
namespace finite = primary_c08_finite_history_v1;
namespace ledger = primary_c08_convolution_ledger_v1;

inline constexpr std::size_t kScalarStateCount = 4U;
inline constexpr std::size_t kFactorCount = factor::kFactorCount;

enum class FailureDetail : std::uint8_t {
    none = 0,
    input_or_output,
    scalar_inventory_or_prefix,
    parameter_identity_or_prefix,
    analytic_factor_model,
    ledger_validation,
    fixed_resource,
    terminal_failure_already_recorded,
};

struct Input {
    finite::LedgerSetView scalar_ledgers;
    std::array<std::uint32_t, kScalarStateCount>
        scalar_ledger_identities{};  // B,V,J1,J2
    std::array<std::uint32_t, kFactorCount>
        factor_ledger_identities{};  // F,E1,E2
    analytic::Input parameters;
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    std::size_t source_models_before = 0U;
    std::size_t source_models_after = 0U;
    std::size_t factor_models_before = 0U;
    std::size_t factor_models_after = 0U;
    std::size_t model_triples_appended = 0U;
    std::size_t source_prefix_digests_checked = 0U;
    std::size_t analytic_model_calls = 0U;
    std::size_t coefficient_jets_written = 0U;
    std::size_t remainder_jets_written = 0U;
    bool exact_factor_identities = false;
    bool stable_prior_publication = false;
    bool first_failure_terminal = false;
    bool retry_or_retune_used = false;
    bool midpoint_selection_used = false;
    bool point_sampling_used = false;
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
    friend ledger::LedgerView published(const Context &, factor::Factor);
};

bool initialize(const Input &input, Context *context, Result *result);
bool extend(const Input &input, Context *context, Result *result);
ledger::LedgerView published(const Context &context, factor::Factor selected);
const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_analytic_factor_ledgers_v1
