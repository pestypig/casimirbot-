#pragma once

#include "mini_boson_star_primary_c08_identity_v1.hpp"

#include <arb.h>

#include <cstddef>
#include <cstdint>

namespace nhm2::g2h_e_s5::primary_c08_endpoint_v1 {

enum class FailureDetail : std::uint8_t {
    none = 0,
    predecessor_not_passed,
    invalid_shape_or_storage,
    missing_output,
    tail_image_nonfinite,
    tail_norm_invalid,
    tail_radius_exceeds_norm,
    endpoint_coefficient_nonfinite,
    endpoint_nonfinite_or_nonpositive,
};

struct Input {
    const primary_c08_identity_v1::InputIdentity *identity = nullptr;
    bool predecessor_c08_001_passed = false;
    arb_srcptr endpoint_tail_image = nullptr;
    arb_srcptr order8_tail_norm = nullptr;
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    std::size_t finite_support_begin = 0;
    std::size_t finite_support_end = 0;
    std::size_t finite_coefficients_read = 0;
    std::size_t finite_gradient_ones = 0;
    bool finite_hessian_exact_zero = false;
    std::uint32_t infinite_tail_operator_norm = 0;
    bool internal_theta_h0_first_derivative_exact_one = false;
    bool internal_theta_h0_second_derivatives_exact_zero = false;
    std::size_t candidate_evaluations = 0;
    std::size_t positive_parameter_samples = 0;
    bool candidate_root_created = false;
    bool scientific_handler_linked = false;
    bool authority_promoted = false;
};

// C08-003 candidate-neutral endpoint functional. The caller must supply the
// already checked C08-001 identity and a manufactured or future terminal-ball
// tail image. During S5 fixtures this function never receives selected data.
bool evaluate(const Input &input, arb_t h0, Result *result);

const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_endpoint_v1
