#include "mini_boson_star_primary_c08_endpoint_v1.hpp"

#include "mini_boson_star_primary_grid_v1.hpp"

namespace nhm2::g2h_e_s5::primary_c08_endpoint_v1 {
namespace {

constexpr slong kPrecisionBits = 512;

void fail(Result *result, FailureDetail detail) {
    if (result != nullptr) {
        *result = Result{};
        result->detail = detail;
    }
}

bool shape(const primary_c08_identity_v1::InputIdentity &identity,
           std::size_t *begin, std::size_t *end) {
    using primary_c08_identity_v1::Chart;
    if (identity.state_storage == nullptr
        || !primary_grid_v1::frozen_node_count(identity.grid_node_count)) {
        return false;
    }
    const long expected = identity.chart == Chart::positive
        ? primary_grid_v1::positive_state_length(identity.grid_node_count)
        : identity.chart == Chart::vacuum
            ? primary_grid_v1::vacuum_state_length(identity.grid_node_count)
            : -1L;
    if (expected <= 0L
        || identity.state_length != static_cast<std::size_t>(expected)) {
        return false;
    }
    *begin = static_cast<std::size_t>(6L * identity.grid_node_count);
    *end = static_cast<std::size_t>(7L * identity.grid_node_count);
    return *begin < *end && *end <= identity.state_length;
}

}  // namespace

bool evaluate(const Input &input, arb_t h0, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (h0 == nullptr) {
        fail(result, FailureDetail::missing_output);
        return false;
    }
    if (!input.predecessor_c08_001_passed) {
        fail(result, FailureDetail::predecessor_not_passed);
        return false;
    }
    if (input.identity == nullptr) {
        fail(result, FailureDetail::invalid_shape_or_storage);
        return false;
    }
    std::size_t begin = 0;
    std::size_t end = 0;
    if (!shape(*input.identity, &begin, &end)) {
        fail(result, FailureDetail::invalid_shape_or_storage);
        return false;
    }
    if (input.endpoint_tail_image == nullptr) {
        fail(result, FailureDetail::tail_image_nonfinite);
        return false;
    }
    if (input.order8_tail_norm == nullptr) {
        fail(result, FailureDetail::tail_norm_invalid);
        return false;
    }
    if (!arb_is_finite(input.endpoint_tail_image)) {
        fail(result, FailureDetail::tail_image_nonfinite);
        return false;
    }
    if (!arb_is_finite(input.order8_tail_norm)
        || !arb_is_nonnegative(input.order8_tail_norm)) {
        fail(result, FailureDetail::tail_norm_invalid);
        return false;
    }

    arb_t tail_radius;
    arb_init(tail_radius);
    arb_set_interval_mag(tail_radius, arb_radref(input.endpoint_tail_image),
                         arb_radref(input.endpoint_tail_image), kPrecisionBits);
    const bool radius_allowed = arb_le(tail_radius, input.order8_tail_norm) != 0;
    arb_clear(tail_radius);
    if (!radius_allowed) {
        fail(result, FailureDetail::tail_radius_exceeds_norm);
        return false;
    }

    arb_zero(h0);
    for (std::size_t index = begin; index < end; ++index) {
        if (!arb_is_finite(input.identity->state_storage + index)) {
            fail(result, FailureDetail::endpoint_coefficient_nonfinite);
            return false;
        }
        arb_add(h0, h0, input.identity->state_storage + index, kPrecisionBits);
        ++result->finite_coefficients_read;
    }
    arb_add(h0, h0, input.endpoint_tail_image, kPrecisionBits);
    if (!arb_is_finite(h0) || !arb_is_positive(h0)) {
        fail(result, FailureDetail::endpoint_nonfinite_or_nonpositive);
        return false;
    }

    result->accepted = true;
    result->finite_support_begin = begin;
    result->finite_support_end = end;
    result->finite_gradient_ones = end - begin;
    result->finite_hessian_exact_zero = true;
    result->infinite_tail_operator_norm = 1U;
    result->internal_theta_h0_first_derivative_exact_one = true;
    result->internal_theta_h0_second_derivatives_exact_zero = true;
    return true;
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::predecessor_not_passed: return "C08-003_PREDECESSOR_NOT_PASSED";
    case FailureDetail::invalid_shape_or_storage: return "C08-003_INVALID_SHAPE_OR_STORAGE";
    case FailureDetail::missing_output: return "C08-003_MISSING_OUTPUT";
    case FailureDetail::tail_image_nonfinite: return "C08-003_TAIL_IMAGE_NONFINITE";
    case FailureDetail::tail_norm_invalid: return "C08-003_TAIL_NORM_INVALID";
    case FailureDetail::tail_radius_exceeds_norm: return "C08-003_TAIL_RADIUS_EXCEEDS_NORM";
    case FailureDetail::endpoint_coefficient_nonfinite: return "C08-003_ENDPOINT_COEFFICIENT_NONFINITE";
    case FailureDetail::endpoint_nonfinite_or_nonpositive: return "C08-003_ENDPOINT_NONFINITE_OR_NONPOSITIVE";
    }
    return "C08-003_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_endpoint_v1
