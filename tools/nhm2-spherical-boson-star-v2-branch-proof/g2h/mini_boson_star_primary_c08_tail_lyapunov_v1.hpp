#pragma once

#include <arb.h>
#include <flint/fmpq.h>
#include <flint/fmpq_mat.h>
#include <flint/fmpz.h>

#include <array>
#include <cstddef>
#include <cstdint>

namespace nhm2::g2h_e_s5::primary_c08_tail_lyapunov_v1 {

inline constexpr slong kPrecisionBits = 512;
inline constexpr slong kDyadicDenominatorBits = 256;
inline constexpr std::size_t kStateDimension = 4U;
inline constexpr std::size_t kParameterDimension = 3U;
inline constexpr std::size_t kKSelectorMaximumExponent = 1024U;

enum class Chart : std::uint8_t {
    positive = 0,
    vacuum = 1,
};

struct RationalBox {
    const fmpq *lower = nullptr;
    const fmpq *upper = nullptr;
};

struct Input {
    std::size_t t0 = 0U;
    bool predecessor_c08_004_passed = false;
    Chart chart = Chart::positive;
    RationalBox h0;
    RationalBox kappa;
    RationalBox theta2;
    // A fixed exact coefficient in the vacuum chart. Ignored in the positive
    // chart, where mu=theta2.
    const fmpq *eta = nullptr;
    // The already-derived fixed sigma0 for the complete parameter box.
    const fmpq *sigma0 = nullptr;
};

enum class FailureDetail : std::uint8_t {
    none = 0,
    predecessor_not_passed,
    missing_output_or_input,
    invalid_onset,
    invalid_chart_or_parameter_box,
    nonpositive_denominator_margin,
    parameter_margin_not_strict,
    sigma0_tier_mismatch,
    lyapunov_solve_failed,
    dyadic_rounding_tie,
    lyapunov_not_symmetric,
    lyapunov_not_positive_definite,
    inverse_or_component_bound_failed,
    compact_box_lmi_failed,
    k1_selector_exhausted,
    k2_selector_exhausted,
};

struct Output {
    fmpq_mat_t p_lyap;
    fmpq_mat_t p_inverse;
    arb_t ep;
    arb_t cleared_denominator;
    std::array<fmpq, kStateDimension> p_ldl_pivots;
    std::array<arb_struct, kStateDimension> lmi_ldl_pivots;
    std::array<arb_struct, kParameterDimension * kStateDimension>
        k1_ldl_pivots;
    std::array<arb_struct,
               kParameterDimension * kParameterDimension * kStateDimension>
        k2_ldl_pivots;
    fmpz_t k1;
    fmpz_t k2;
    std::size_t k1_exponent = 0U;
    std::size_t k2_exponent = 0U;

    Output();
    ~Output();
    Output(const Output &) = delete;
    Output &operator=(const Output &) = delete;
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    std::size_t compact_variables = 0U;
    std::size_t lmi_matrices_verified = 0U;
    std::size_t first_derivative_matrices_verified = 0U;
    std::size_t ordered_second_derivative_matrices_verified = 0U;
    std::size_t k1_candidates_tested = 0U;
    std::size_t k2_candidates_tested = 0U;
    bool fixed_variable_order_u_h0_kappa_theta2 = false;
    bool subdivision_used = false;
    bool point_sampling_used = false;
    bool exact_inverse_verified = false;
    bool dyadic_denominator_bound = false;
    std::size_t state_coefficients_read = 0U;
    std::size_t candidate_evaluations = 0U;
    std::size_t positive_parameter_samples = 0U;
    bool candidate_root_created = false;
    bool scientific_handler_linked = false;
    bool authority_promoted = false;
};

// Candidate-neutral C08-011b producer. It operates only on caller-supplied
// exact manufactured/future parameter boxes. It never reads the frozen member,
// finite continuation ledger, filesystem, authorization, or output roots.
bool evaluate(const Input &input, Output *output, Result *result);

const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_tail_lyapunov_v1
