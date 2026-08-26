#pragma once

#include "mini_boson_star_primary_c08_analytic_parameter_jets_v1.hpp"
#include "mini_boson_star_primary_c08_convolution_ledger_v1.hpp"

#include <arb.h>

#include <array>
#include <cstddef>
#include <cstdint>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_analytic_factor_model_v1 {

namespace analytic = primary_c08_analytic_parameter_jets_v1;
namespace ledger = primary_c08_convolution_ledger_v1;

inline constexpr slong kPrecisionBits = 512;
inline constexpr std::size_t kJetCount = analytic::kJetCount;
inline constexpr std::size_t kFactorCount = 3U;

enum class Factor : std::uint8_t { F = 0, E1 = 1, E2 = 2 };

enum class FailureDetail : std::uint8_t {
    none = 0,
    input_or_output,
    geometry_or_order,
    parameter_jet,
    coefficient_algebra,
    directed_remainder,
};

struct Input {
    std::size_t ordinal = 0U;
    ledger::ModelKind kind = ledger::ModelKind::origin;
    arb_srcptr left_endpoint = nullptr;
    arb_srcptr right_endpoint = nullptr;
    unsigned order = 0U;
    const analytic::Output *parameters = nullptr;
};

struct Output {
    std::size_t ordinal = 0U;
    ledger::ModelKind kind = ledger::ModelKind::origin;
    arb_t left_endpoint;
    arb_t right_endpoint;
    arb_t expansion_center;
    unsigned order = 0U;
    std::array<std::vector<arb_struct>, kFactorCount> coefficients;
    std::array<std::vector<arb_struct>, kFactorCount> remainders;

    Output();
    ~Output();
    Output(const Output &) = delete;
    Output &operator=(const Output &) = delete;

    arb_srcptr coefficient(Factor factor, unsigned degree,
                           std::size_t jet) const;
    arb_srcptr remainder(Factor factor, std::size_t jet) const;
    ledger::ModelView view(Factor factor) const;
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    std::size_t coefficient_jets_written = 0U;
    std::size_t remainder_jets_written = 0U;
    std::size_t exact_linear_f_coefficients = 0U;
    std::size_t exponential_recurrence_steps = 0U;
    std::size_t ordered_second_components_written = 0U;
    bool exact_f_formula = false;
    bool exact_e1_formula = false;
    bool exact_e2_formula = false;
    bool directed_panel_remainders = false;
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

// Builds left-centered Taylor models for the exact acknowledged factors
// F=1-2*mu*t, E1=exp(2*mu*t), E2=(1+2*mu*t)*exp(2*mu*t), including the full
// value/three-first/nine-ordered-second internal parameter jet inventory.
bool evaluate(const Input &input, Output *output, Result *result);

const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_analytic_factor_model_v1
