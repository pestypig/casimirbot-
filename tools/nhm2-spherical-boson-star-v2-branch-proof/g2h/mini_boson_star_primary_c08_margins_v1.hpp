#pragma once

#include "mini_boson_star_primary_c08_identity_v1.hpp"

#include <arb.h>

#include <cstddef>
#include <cstdint>

namespace nhm2::g2h_e_s5::primary_c08_margins_v1 {

enum class FailureDetail : std::uint8_t {
    none = 0,
    predecessor_not_passed,
    missing_input_or_output,
    invalid_chart,
    h0_nonfinite_or_nonpositive,
    kappa_nonfinite_or_nonpositive,
    theta2_nonfinite,
    eta_missing_nonfinite_or_negative,
    mu_nonfinite_or_negative,
    mu_upper_nonfinite,
    formal_metric_or_laplace_gap_nonpositive,
    beta_nonfinite,
    derived_tier_or_denominator_nonpositive,
};

struct Input {
    const primary_c08_identity_v1::InputIdentity *identity = nullptr;
    bool predecessor_c08_003_passed = false;
    arb_srcptr h0 = nullptr;
    arb_srcptr kappa = nullptr;
    // Positive chart: theta2=M. Vacuum chart: theta2=Mbar_infinity.
    arb_srcptr theta2 = nullptr;
    // Required only on the vacuum chart; held fixed under state derivatives.
    arb_srcptr eta = nullptr;
};

struct Output {
    arb_t mu;
    arb_t mu_upper;
    arb_t beta;
    arb_t two_kappa;
    arb_t g;
    arb_t sigma0;
    arb_t sigma1;
    arb_t sigma2;
    arb_t tau0;
    arb_t tau1;
    arb_t tau2;
    arb_t delta;
    arb_t formal_metric_margin;
    arb_struct internal_gaps[5];
    arb_struct carrier_a[3];
    arb_struct carrier_b[3];

    Output();
    ~Output();
    Output(const Output &) = delete;
    Output &operator=(const Output &) = delete;
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    std::size_t directed_parameter_boxes = 0;
    std::size_t strict_denominator_margins = 0;
    std::size_t strict_growth_margins = 0;
    bool mu_upper_used = false;
    bool midpoint_acceptance_used = false;
    std::size_t state_coefficients_read = 0;
    std::size_t candidate_evaluations = 0;
    std::size_t positive_parameter_samples = 0;
    bool candidate_root_created = false;
    bool scientific_handler_linked = false;
    bool authority_promoted = false;
};

// C08-004 candidate-neutral directed parameter and denominator-margin gate.
// It consumes only supplied manufactured/future parameter balls; it performs
// no state-vector read, parameter sampling, file I/O, or candidate evaluation.
bool evaluate(const Input &input, Output *output, Result *result);

const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_margins_v1
