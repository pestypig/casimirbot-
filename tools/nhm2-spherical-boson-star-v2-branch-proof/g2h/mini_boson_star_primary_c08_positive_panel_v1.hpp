#pragma once

#include "mini_boson_star_primary_c08_origin_series_v1.hpp"

#include <arb.h>

#include <cstddef>
#include <cstdint>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_positive_panel_v1 {

inline constexpr std::size_t kJetCount =
    primary_c08_origin_series_v1::kJetCount;
inline constexpr std::size_t kStateCount = 4U;
inline constexpr std::size_t kEquationPolynomialCount = 5U;
inline constexpr std::size_t kEquationPolynomialDegree = 2U;
inline constexpr std::size_t kOrderCandidateCount = 7U;
inline constexpr unsigned kMaximumPanelOrder = 192U;
inline constexpr unsigned kMaximumPanelHalvings = 32U;

enum class State : std::uint8_t { B = 0, V = 1, J1 = 2, J2 = 3 };
enum class EquationPolynomial : std::uint8_t {
    P2 = 0, P1 = 1, P0 = 2, PJ1 = 3, PJ2 = 4,
};

enum class FailureDetail : std::uint8_t {
    none = 0,
    predecessor_not_passed,
    missing_output,
    target_endpoint_invalid,
    order_not_in_frozen_schedule,
    panel_halving_exhaustion,
    positive_panel_denominator_or_coefficient,
};

struct Input {
    primary_c08_origin_series_v1::Input origin;
    arb_srcptr target_endpoint = nullptr;
    unsigned requested_order = 0U;
    unsigned panel_halvings = 0U;
};

struct Output {
    arb_t left_endpoint;
    arb_t panel_width;
    arb_t right_endpoint;
    arb_t t_panel;
    arb_t t_plus_two_kappa_panel;
    arb_t scalar_p2_panel;
    // Coefficient-major, then B,V,J1,J2, then the frozen 13-jet order.
    std::vector<arb_struct> coefficients;
    // P2,P1,P0,PJ1,PJ2; xi degree 0..2; frozen 13-jet order.
    arb_struct equation_polynomials[kEquationPolynomialCount]
                                   [kEquationPolynomialDegree + 1U]
                                   [kJetCount];
    unsigned generated_order = 0U;
    unsigned panel_halvings = 0U;

    Output();
    ~Output();
    Output(const Output &) = delete;
    Output &operator=(const Output &) = delete;

    arb_ptr at(std::size_t order, std::size_t state, std::size_t jet = 0U);
    arb_srcptr at(std::size_t order, std::size_t state,
                  std::size_t jet = 0U) const;
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    unsigned requested_order = 0U;
    unsigned panel_halvings = 0U;
    std::size_t strict_denominator_margins = 0U;
    std::size_t equation_polynomial_balls = 0U;
    std::size_t taylor_coefficient_balls = 0U;
    std::size_t origin_derivative_compatibility_checks = 0U;
    std::size_t ordered_mixed_orientations = 0U;
    bool exact_power_series_algebra_used = false;
    bool directed_denominator_bounds_used = false;
    bool midpoint_acceptance_used = false;
    std::size_t state_coefficients_read = 0U;
    std::size_t candidate_evaluations = 0U;
    std::size_t positive_parameter_samples = 0U;
    bool candidate_root_created = false;
    bool scientific_handler_linked = false;
    bool authority_promoted = false;
};

// Candidate-neutral C08-007 panel coefficient producer. It replays C08-006,
// accepts only a manufactured/future exact dyadic target and one fixed order,
// and performs no selected-state read, sampling, file I/O, or evaluation.
bool evaluate(const Input &input, Output *output, Result *result);

const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_positive_panel_v1
