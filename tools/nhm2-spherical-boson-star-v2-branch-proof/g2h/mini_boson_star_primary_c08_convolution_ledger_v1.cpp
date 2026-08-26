#include "mini_boson_star_primary_c08_convolution_ledger_v1.hpp"

#include <array>

namespace nhm2::g2h_e_s5::primary_c08_convolution_ledger_v1 {
namespace {

constexpr slong kPrecisionBits = 512;
constexpr std::array<unsigned, 7U> kOriginOrders = {
    32U, 48U, 64U, 96U, 128U, 192U, 256U};
constexpr std::array<unsigned, 7U> kPositiveOrders = {
    24U, 32U, 48U, 64U, 96U, 128U, 192U};

template <std::size_t N>
bool contains_order(const std::array<unsigned, N> &orders, unsigned order) {
    for (const unsigned candidate : orders)
        if (candidate == order) return true;
    return false;
}

bool exact_finite(arb_srcptr value) {
    return value != nullptr && arb_is_finite(value) && arb_is_exact(value);
}

void reset(Output &output) {
    arb_zero(output.direct_mapped_interval);
    arb_zero(output.reflected_mapped_interval);
    output.direct_intersecting_ordinals.clear();
    output.reflected_intersecting_ordinals.clear();
    output.direct_shared_face_retained = false;
    output.reflected_shared_face_retained = false;
}

void fail(Result *result, FailureDetail detail) {
    *result = Result{};
    result->detail = detail;
}

bool valid_rectangle(const Input &input) {
    if (!exact_finite(input.target_left) || !exact_finite(input.target_right)
        || !exact_finite(input.u_left) || !exact_finite(input.u_right))
        return false;
    arb_t zero, one;
    arb_init(zero); arb_init(one); arb_zero(zero); arb_one(one);
    const bool valid = !arb_is_negative(input.target_left)
        && arb_lt(input.target_left, input.target_right)
        && !arb_is_negative(input.u_left) && arb_lt(input.u_left, input.u_right)
        && arb_le(input.u_right, one);
    arb_clear(one); arb_clear(zero);
    return valid;
}

bool model_order_valid(const ModelView &model) {
    if (model.kind == ModelKind::origin)
        return contains_order(kOriginOrders, model.order);
    if (model.kind == ModelKind::positive_panel)
        return contains_order(kPositiveOrders, model.order);
    return false;
}

void interval_from_endpoints(arb_ptr interval, arb_srcptr left,
                             arb_srcptr right) {
    arb_union(interval, left, right, kPrecisionBits);
}

bool enumerate(const LedgerView &ledger, arb_srcptr mapped,
               std::vector<std::size_t> &ordinals, bool *shared_face,
               std::size_t *intersection_checks) {
    arb_t domain;
    arb_init(domain);
    for (std::size_t index = 0U; index < ledger.model_count; ++index) {
        const ModelView &model = ledger.models[index];
        interval_from_endpoints(domain, model.left_endpoint,
                                model.right_endpoint);
        ++*intersection_checks;
        if (arb_overlaps(domain, mapped)) ordinals.push_back(model.ordinal);
    }
    arb_clear(domain);
    if (ordinals.empty()) return false;
    for (std::size_t index = 1U; index < ordinals.size(); ++index) {
        if (ordinals[index] != ordinals[index - 1U] + 1U) return false;
        *shared_face = true;
    }
    return true;
}

}  // namespace

Output::Output() {
    arb_init(direct_mapped_interval);
    arb_init(reflected_mapped_interval);
}

Output::~Output() {
    arb_clear(reflected_mapped_interval);
    arb_clear(direct_mapped_interval);
}

bool evaluate(const Input &input, Output *output, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (output == nullptr) {
        fail(result, FailureDetail::missing_output);
        return false;
    }
    reset(*output);
    if (!valid_rectangle(input)) {
        fail(result, FailureDetail::invalid_target_or_u_rectangle);
        return false;
    }
    if (input.ledger.models == nullptr || input.ledger.model_count == 0U
        || input.ledger.model_count > kMaximumLedgerModels) {
        fail(result, FailureDetail::ledger_resource_or_pointer);
        return false;
    }

    std::size_t coefficient_balls = 0U, remainder_balls = 0U;
    arb_t zero;
    arb_init(zero); arb_zero(zero);
    for (std::size_t index = 0U; index < input.ledger.model_count; ++index) {
        const ModelView &model = input.ledger.models[index];
        const bool geometry = model.ordinal == index
            && model.kind == (index == 0U ? ModelKind::origin
                                         : ModelKind::positive_panel)
            && exact_finite(model.left_endpoint)
            && exact_finite(model.right_endpoint)
            && exact_finite(model.expansion_center)
            && arb_lt(model.left_endpoint, model.right_endpoint)
            && arb_equal(model.expansion_center, model.left_endpoint)
            && (index != 0U || arb_equal(model.left_endpoint, zero))
            && (index == 0U
                || arb_equal(model.left_endpoint,
                             input.ledger.models[index - 1U].right_endpoint));
        if (!geometry) {
            arb_clear(zero);
            fail(result, FailureDetail::ledger_chronology_or_geometry);
            return false;
        }
        const std::size_t expected_coefficients =
            (static_cast<std::size_t>(model.order) + 1U) * kJetCount;
        if (!model_order_valid(model) || model.coefficients == nullptr
            || model.remainders == nullptr
            || model.coefficient_count != expected_coefficients
            || model.remainder_count != kJetCount) {
            arb_clear(zero);
            fail(result, FailureDetail::ledger_order_or_storage);
            return false;
        }
        for (std::size_t coefficient = 0U;
             coefficient < model.coefficient_count; ++coefficient) {
            ++coefficient_balls;
            if (!arb_is_finite(model.coefficients + coefficient)) {
                arb_clear(zero);
                fail(result, FailureDetail::nonfinite_model);
                return false;
            }
        }
        for (std::size_t jet = 0U; jet < model.remainder_count; ++jet) {
            ++remainder_balls;
            if (!arb_is_finite(model.remainders + jet)
                || !arb_contains_zero(model.remainders + jet)) {
                arb_clear(zero);
                fail(result, FailureDetail::nonfinite_model);
                return false;
            }
        }
    }
    arb_clear(zero);
    const ModelView &last = input.ledger.models[input.ledger.model_count - 1U];
    if (arb_lt(last.right_endpoint, input.target_right)) {
        fail(result, FailureDetail::mapped_interval_uncovered);
        return false;
    }

    arb_t target, direct_u, reflected_left, reflected_right, reflected_u, one;
    arb_init(target); arb_init(direct_u); arb_init(reflected_left);
    arb_init(reflected_right); arb_init(reflected_u); arb_init(one); arb_one(one);
    interval_from_endpoints(target, input.target_left, input.target_right);
    interval_from_endpoints(direct_u, input.u_left, input.u_right);
    arb_sub(reflected_left, one, input.u_right, kPrecisionBits);
    arb_sub(reflected_right, one, input.u_left, kPrecisionBits);
    interval_from_endpoints(reflected_u, reflected_left, reflected_right);
    arb_mul(output->direct_mapped_interval, target, direct_u, kPrecisionBits);
    arb_mul(output->reflected_mapped_interval, target, reflected_u,
            kPrecisionBits);
    const bool direct_ok = enumerate(
        input.ledger, output->direct_mapped_interval,
        output->direct_intersecting_ordinals,
        &output->direct_shared_face_retained,
        &result->closed_intersection_checks);
    const bool reflected_ok = enumerate(
        input.ledger, output->reflected_mapped_interval,
        output->reflected_intersecting_ordinals,
        &output->reflected_shared_face_retained,
        &result->closed_intersection_checks);
    arb_clear(one); arb_clear(reflected_u); arb_clear(reflected_right);
    arb_clear(reflected_left); arb_clear(direct_u); arb_clear(target);
    if (!direct_ok || !reflected_ok) {
        fail(result, FailureDetail::mapped_interval_uncovered);
        return false;
    }

    result->accepted = true;
    result->detail = FailureDetail::none;
    result->models_validated = input.ledger.model_count;
    result->coefficient_balls_validated = coefficient_balls;
    result->remainder_balls_validated = remainder_balls;
    result->exact_shared_faces_required = true;
    result->every_intersecting_model_enumerated = true;
    result->midpoint_selection_used = false;
    return true;
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::missing_output: return "C08-010A_MISSING_OUTPUT";
    case FailureDetail::invalid_target_or_u_rectangle:
        return "C08-010A_INVALID_TARGET_OR_U_RECTANGLE";
    case FailureDetail::ledger_resource_or_pointer:
        return "C08-010A_LEDGER_RESOURCE_OR_POINTER";
    case FailureDetail::ledger_chronology_or_geometry:
        return "C08-010A_LEDGER_CHRONOLOGY_OR_GEOMETRY";
    case FailureDetail::ledger_order_or_storage:
        return "C08-010A_LEDGER_ORDER_OR_STORAGE";
    case FailureDetail::nonfinite_model: return "C08-010A_NONFINITE_MODEL";
    case FailureDetail::mapped_interval_uncovered:
        return "C08-010A_MAPPED_INTERVAL_UNCOVERED";
    }
    return "C08-010A_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_convolution_ledger_v1
