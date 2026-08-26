#pragma once

#include "mini_boson_star_primary_c08_analytic_factor_model_v1.hpp"
#include "mini_boson_star_primary_c08_analytic_model_product_v1.hpp"

#include <array>
#include <cstddef>
#include <cstdint>
#include <memory>

namespace nhm2::g2h_e_s5::primary_c08_analytic_factor_derivative_model_v1 {

namespace analytic = primary_c08_analytic_parameter_jets_v1;
namespace factor = primary_c08_analytic_factor_model_v1;
namespace ledger = primary_c08_convolution_ledger_v1;
namespace product = primary_c08_analytic_model_product_v1;

inline constexpr slong kPrecisionBits = 512;
inline constexpr std::size_t kJetCount = analytic::kJetCount;
inline constexpr std::size_t kDerivativeCount = 3U;

enum class Derivative : std::uint8_t { Fprime = 0, E1prime = 1, E2prime = 2 };

enum class FailureDetail : std::uint8_t {
    none = 0,
    input_or_output,
    source_geometry,
    parameter_jet,
    derivative_algebra,
    output_model,
};

struct Input {
    ledger::ModelView f;
    ledger::ModelView e1;
    ledger::ModelView e2;
    const analytic::Output *parameters = nullptr;
};

struct Output {
    std::size_t ordinal = 0U;
    ledger::ModelKind kind = ledger::ModelKind::origin;
    std::array<std::unique_ptr<product::Output>, kDerivativeCount> models;

    Output();
    ~Output();
    Output(const Output &) = delete;
    Output &operator=(const Output &) = delete;

    ledger::ModelView view(Derivative selected) const;
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    std::size_t derivative_models_written = 0U;
    std::size_t coefficient_jets_written = 0U;
    std::size_t remainder_jets_written = 0U;
    std::size_t ordered_second_outputs = 0U;
    bool exact_fprime_formula = false;
    bool exact_e1prime_formula = false;
    bool exact_e2prime_formula = false;
    bool complete_ordered_13_jet_inventory = false;
    bool both_mixed_orientations_retained = false;
    bool retry_or_retune_used = false;
    bool midpoint_selection_used = false;
    bool point_sampling_used = false;
    std::size_t candidate_evaluations = 0U;
    std::size_t positive_parameter_samples = 0U;
    bool candidate_root_created = false;
    bool scientific_handler_linked = false;
    bool authority_promoted = false;
};

// Realizes exactly F'=-2*mu, E1'=2*mu*E1, and
// E2'=4*mu*(1+mu*t)*E1 on one already-audited F/E1/E2 panel geometry.
// Coordinate differentiation never differentiates a source remainder.
bool evaluate(const Input &input, Output *output, Result *result);

const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_analytic_factor_derivative_model_v1
