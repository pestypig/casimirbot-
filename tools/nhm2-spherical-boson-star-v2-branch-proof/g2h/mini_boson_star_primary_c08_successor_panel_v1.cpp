#include "mini_boson_star_primary_c08_successor_panel_v1.hpp"

// This separately versioned translation unit reuses the exact audited v1
// algebra while supplying a distinct arbitrary-left-endpoint ingress. The
// final build must compile this unit instead of separately compiling the three
// included v1 implementation units, preventing duplicate symbols.
#include "mini_boson_star_primary_c08_positive_panel_v1.cpp"

namespace nhm2::g2h_e_s5::primary_c08_positive_panel_v1 {
namespace {

struct SuccessorContext {
    arb_srcptr left_endpoint = nullptr;
    std::size_t left_state_box_count = 0U;
    arb_srcptr left_state_boxes = nullptr;
};

thread_local const SuccessorContext *g_successor_context = nullptr;
thread_local FailureDetail g_successor_panel_detail = FailureDetail::none;

FailureDetail choose_successor_panel(
    const Input &input, const SuccessorContext &context,
    const primary_c08_margins_v1::Output &margins, Output &output) {
    if (!finite(context.left_endpoint) || !arb_is_exact(context.left_endpoint)
        || !arb_is_positive(context.left_endpoint)
        || !finite(input.target_endpoint) || !arb_is_exact(input.target_endpoint)
        || !arb_lt(context.left_endpoint, input.target_endpoint))
        return FailureDetail::target_endpoint_invalid;

    arb_t candidate_t, candidate_kappa, candidate_target, temporary;
    arb_init(candidate_t); arb_init(candidate_kappa); arb_init(candidate_target);
    arb_init(temporary);
    arb_set(output.left_endpoint, context.left_endpoint);
    arb_mul_2exp_si(candidate_t, output.left_endpoint, -2L);
    arb_add(temporary, output.left_endpoint, margins.two_kappa, kPrecisionBits);
    arf_t lower;
    arf_init(lower);
    arb_get_lbound_arf(lower, temporary, kPrecisionBits);
    arb_set_arf(candidate_kappa, lower);
    arb_mul_2exp_si(candidate_kappa, candidate_kappa, -2L);
    arb_sub(candidate_target, input.target_endpoint, output.left_endpoint,
            kPrecisionBits);

    arb_set(output.panel_width, candidate_t);
    if (arb_lt(candidate_kappa, output.panel_width))
        arb_set(output.panel_width, candidate_kappa);
    if (arb_lt(candidate_target, output.panel_width))
        arb_set(output.panel_width, candidate_target);
    arb_mul_2exp_si(output.panel_width, output.panel_width,
                   -static_cast<slong>(input.panel_halvings));
    arb_add(output.right_endpoint, output.left_endpoint, output.panel_width,
            kPrecisionBits);
    bool pass = arb_is_exact(output.panel_width)
        && arb_is_positive(output.panel_width)
        && arb_is_exact(output.right_endpoint)
        && arb_le(output.right_endpoint, input.target_endpoint);
    if (pass) {
        arb_union(output.t_panel, output.left_endpoint, output.right_endpoint,
                  kPrecisionBits);
        arb_add(output.t_plus_two_kappa_panel, output.t_panel,
                margins.two_kappa, kPrecisionBits);
        arb_mul(output.scalar_p2_panel, output.t_panel,
                output.t_plus_two_kappa_panel, kPrecisionBits);
        pass = arb_is_positive(input.origin.gevrey.margins.kappa)
            && arb_is_positive(output.t_panel)
            && arb_is_positive(output.t_plus_two_kappa_panel)
            && arb_is_positive(output.scalar_p2_panel);
    }
    arf_clear(lower); arb_clear(temporary); arb_clear(candidate_target);
    arb_clear(candidate_kappa); arb_clear(candidate_t);
    return pass ? FailureDetail::none
                : FailureDetail::positive_panel_denominator_or_coefficient;
}

bool generate_successor_coefficients(
    Output &output, const SuccessorContext &context,
    Polynomial (&polynomials)[kEquationPolynomialCount], unsigned order) {
    if (context.left_state_boxes == nullptr
        || context.left_state_box_count != kStateCount * kJetCount)
        return false;
    for (std::size_t state = 0U; state < kStateCount; ++state)
        for (std::size_t jet = 0U; jet < kJetCount; ++jet) {
            arb_srcptr value = context.left_state_boxes
                + state * kJetCount + jet;
            if (!arb_is_finite(value)) return false;
            arb_set(output.at(0U, state, jet), value);
        }

    Jet numerator, term, source, correction, rhs, denominator;
    Jet b, v, j1, next;
    for (unsigned n = 0U; n < order; ++n) {
        jet_zero(numerator);
        const std::array<State, 4U> states = {
            State::V, State::B, State::J1, State::J2,
        };
        const std::array<std::size_t, 4U> polynomial_indices = {1U, 2U, 3U, 4U};
        for (std::size_t operand = 0U; operand < states.size(); ++operand) {
            for (std::size_t degree = 0U;
                 degree <= kEquationPolynomialDegree && degree <= n; ++degree) {
                load_coefficient(source, output, n - degree, states[operand]);
                jet_mul(term, polynomials[polynomial_indices[operand]]
                                  .coefficients[degree], source);
                jet_add(next, numerator, term);
                jet_set(numerator, next);
            }
        }
        jet_zero(correction);
        for (std::size_t degree = 1U;
             degree <= kEquationPolynomialDegree && degree <= n; ++degree) {
            const unsigned derivative_index = n + 1U - degree;
            if (derivative_index == 0U) continue;
            load_coefficient(source, output, derivative_index, State::V);
            jet_scale_si(source, source, static_cast<long>(derivative_index));
            jet_mul(term, polynomials[0].coefficients[degree], source);
            jet_add(next, correction, term);
            jet_set(correction, next);
        }
        jet_neg(rhs, numerator);
        jet_sub(rhs, rhs, correction);
        jet_scale_si(denominator, polynomials[0].coefficients[0],
                     static_cast<long>(n + 1U));
        if (!jet_div(next, rhs, denominator) || !finite_jet(next)) return false;
        store_coefficient(output, n + 1U, State::V, next);

        load_coefficient(v, output, n, State::V);
        jet_div_ui(next, v, n + 1U);
        store_coefficient(output, n + 1U, State::B, next);
        load_coefficient(b, output, n, State::B);
        jet_div_ui(next, b, n + 1U);
        store_coefficient(output, n + 1U, State::J1, next);
        load_coefficient(j1, output, n, State::J1);
        jet_div_ui(next, j1, n + 1U);
        store_coefficient(output, n + 1U, State::J2, next);
    }
    for (unsigned n = 0U; n <= order; ++n)
        for (std::size_t state = 0U; state < kStateCount; ++state) {
            load_coefficient(source, output, n, static_cast<State>(state));
            if (!finite_jet(source)) return false;
        }
    return true;
}

}  // namespace

bool evaluate_successor_injected(const Input &input, Output *output,
                                 Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    g_successor_panel_detail = FailureDetail::none;
    if (output == nullptr || g_successor_context == nullptr) {
        fail(result, FailureDetail::missing_output);
        g_successor_panel_detail = result->detail;
        return false;
    }
    reset(*output);
    if (!order_allowed(input.requested_order)) {
        fail(result, FailureDetail::order_not_in_frozen_schedule);
        g_successor_panel_detail = result->detail;
        return false;
    }
    if (input.panel_halvings > kMaximumPanelHalvings) {
        fail(result, FailureDetail::panel_halving_exhaustion);
        g_successor_panel_detail = result->detail;
        return false;
    }
    primary_c08_margins_v1::Output margins_output;
    primary_c08_margins_v1::Result margins_result{};
    if (!primary_c08_margins_v1::evaluate(input.origin.gevrey.margins,
                                           &margins_output, &margins_result)) {
        fail(result, FailureDetail::predecessor_not_passed);
        g_successor_panel_detail = result->detail;
        return false;
    }
    const FailureDetail panel_detail = choose_successor_panel(
        input, *g_successor_context, margins_output, *output);
    if (panel_detail != FailureDetail::none) {
        fail(result, panel_detail);
        g_successor_panel_detail = result->detail;
        return false;
    }
    Polynomial polynomials[kEquationPolynomialCount];
    if (!build_equation_polynomials(input, *output, margins_output, polynomials)) {
        fail(result, FailureDetail::positive_panel_denominator_or_coefficient);
        g_successor_panel_detail = result->detail;
        return false;
    }
    store_equation_polynomials(*output, polynomials);
    if (!generate_successor_coefficients(*output, *g_successor_context,
                                         polynomials, input.requested_order)) {
        fail(result, FailureDetail::positive_panel_denominator_or_coefficient);
        g_successor_panel_detail = result->detail;
        return false;
    }
    output->generated_order = input.requested_order;
    output->panel_halvings = input.panel_halvings;
    result->accepted = true;
    result->detail = FailureDetail::none;
    result->requested_order = input.requested_order;
    result->panel_halvings = input.panel_halvings;
    result->strict_denominator_margins = 4U;
    result->equation_polynomial_balls = kEquationPolynomialCount
        * (kEquationPolynomialDegree + 1U) * kJetCount;
    result->taylor_coefficient_balls = (input.requested_order + 1U)
        * kStateCount * kJetCount;
    result->origin_derivative_compatibility_checks = 0U;
    result->ordered_mixed_orientations = (input.requested_order + 1U)
        * kStateCount * kMixedOrientationCount;
    result->exact_power_series_algebra_used = true;
    result->directed_denominator_bounds_used = true;
    result->midpoint_acceptance_used = false;
    return true;
}

bool evaluate_successor_core(const Input &input, Output *output,
                             Result *result) {
    return evaluate_successor_injected(input, output, result);
}

}  // namespace nhm2::g2h_e_s5::primary_c08_positive_panel_v1

#define evaluate evaluate_successor_core
#include "mini_boson_star_primary_c08_panel_defect_v1.cpp"
#undef evaluate

namespace nhm2::g2h_e_s5::primary_c08_panel_defect_v1 {

thread_local FailureDetail g_successor_defect_detail = FailureDetail::none;

bool evaluate_successor_injected(const Input &input, Output *output,
                                 Result *result) {
    g_successor_defect_detail = FailureDetail::none;
    const bool accepted = evaluate_successor_core(input, output, result);
    if (result != nullptr) g_successor_defect_detail = result->detail;
    return accepted;
}

}  // namespace nhm2::g2h_e_s5::primary_c08_panel_defect_v1

#define evaluate evaluate_successor_injected
#include "mini_boson_star_primary_c08_picard_v1.cpp"
#undef evaluate

namespace nhm2::g2h_e_s5::primary_c08_successor_panel_v1 {
namespace {

namespace raw_panel = primary_c08_positive_panel_v1;
namespace raw_picard = primary_c08_picard_v1;

void fail(Result *result, FailureDetail detail) {
    *result = Result{};
    result->detail = detail;
}

bool finite_input(const Input &input) {
    if (input.left_endpoint == nullptr || input.target_endpoint == nullptr
        || input.left_state_boxes == nullptr
        || input.left_state_box_count != kLeftStateBoxCount
        || !arb_is_finite(input.left_endpoint)
        || !arb_is_exact(input.left_endpoint)
        || !arb_is_positive(input.left_endpoint)
        || !arb_is_finite(input.target_endpoint)
        || !arb_is_exact(input.target_endpoint)
        || !arb_lt(input.left_endpoint, input.target_endpoint))
        return false;
    for (std::size_t index = 0U; index < input.left_state_box_count; ++index)
        if (!arb_is_finite(input.left_state_boxes + index)) return false;
    return true;
}

bool replay_left_state(const Input &input, const panel::Output &output,
                       std::size_t *checks) {
    for (std::size_t state = 0U; state < kStateCount; ++state)
        for (std::size_t jet = 0U; jet < kJetCount; ++jet) {
            ++*checks;
            if (!arb_equal(output.at(0U, state, jet),
                           input.left_state_boxes + state * kJetCount + jet))
                return false;
        }
    return true;
}

FailureDetail select_successor(const Input &input, Output *output,
                               Result *result) {
    raw_picard::reset(output->enclosure);
    std::size_t order_attempts = 0U, halving_attempts = 0U;
    std::size_t inflation_attempts = 0U, strict_checks = 0U;
    std::size_t width_checks = 0U;
    bool any_panel = false, any_defect = false;
    for (unsigned halving = 0U;
         halving <= raw_picard::kMaximumPanelHalvings; ++halving) {
        ++halving_attempts;
        for (const unsigned order : raw_picard::kOrders) {
            ++order_attempts;
            raw_panel::Input panel_input{input.parameter_origin,
                                         input.target_endpoint, order,
                                         halving};
            raw_panel::Output panel_output;
            raw_panel::Result panel_result{};
            if (!raw_panel::evaluate_successor_injected(
                    panel_input, &panel_output, &panel_result))
                continue;
            any_panel = true;

            primary_c08_panel_defect_v1::Input defect_input{panel_input};
            primary_c08_panel_defect_v1::Output defect_output;
            primary_c08_panel_defect_v1::Result defect_result{};
            if (!primary_c08_panel_defect_v1::evaluate_successor_injected(
                    defect_input, &defect_output, &defect_result))
                continue;
            any_defect = true;

            if (defect_output.all_exact_zero) {
                arb_zero(output->enclosure.common_remainder_radius);
                output->enclosure.exact_zero_remainder = true;
                output->enclosure.accepted_order = order;
                output->enclosure.accepted_panel_halvings = halving;
                output->enclosure.accepted_inflation_exponent = 0U;
                arb_set(output->enclosure.left_endpoint,
                        panel_output.left_endpoint);
                arb_set(output->enclosure.panel_width,
                        panel_output.panel_width);
                arb_set(output->enclosure.right_endpoint,
                        panel_output.right_endpoint);
                result->accepted_order = order;
                result->accepted_panel_halvings = halving;
                result->accepted_inflation_exponent = 0U;
                result->order_attempts = order_attempts;
                result->panel_halving_attempts = halving_attempts;
                result->inflation_attempts = inflation_attempts;
                result->first_passing_order_used = true;
                result->first_passing_inflation_used = true;
                result->complete_interval_picard_used = true;
                return FailureDetail::none;
            }
            for (unsigned exponent = 1U;
                 exponent <= raw_picard::kMaximumInflationExponent;
                 ++exponent) {
                ++inflation_attempts;
                for (auto &value : output->enclosure.remainder_boxes)
                    arb_zero(&value);
                for (auto &value : output->enclosure.strict_containment_margins)
                    arb_zero(&value);
                if (!raw_picard::try_inflation(
                        panel_output, defect_output, exponent,
                        output->enclosure, &strict_checks, &width_checks))
                    continue;
                output->enclosure.accepted_order = order;
                output->enclosure.accepted_panel_halvings = halving;
                output->enclosure.accepted_inflation_exponent = exponent;
                arb_set(output->enclosure.left_endpoint,
                        panel_output.left_endpoint);
                arb_set(output->enclosure.panel_width,
                        panel_output.panel_width);
                arb_set(output->enclosure.right_endpoint,
                        panel_output.right_endpoint);
                result->accepted_order = order;
                result->accepted_panel_halvings = halving;
                result->accepted_inflation_exponent = exponent;
                result->order_attempts = order_attempts;
                result->panel_halving_attempts = halving_attempts;
                result->inflation_attempts = inflation_attempts;
                result->first_passing_order_used = true;
                result->first_passing_inflation_used = true;
                result->complete_interval_picard_used = true;
                return FailureDetail::none;
            }
        }
    }
    result->order_attempts = order_attempts;
    result->panel_halving_attempts = halving_attempts;
    result->inflation_attempts = inflation_attempts;
    if (!any_panel)
        return FailureDetail::positive_panel_denominator_or_coefficient;
    if (!any_defect)
        return FailureDetail::panel_defect_or_exact_zero_replay;
    return FailureDetail::picard_inflation_or_width_exhaustion;
}

}  // namespace

bool evaluate(const Input &input, Output *output, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (output == nullptr) {
        fail(result, FailureDetail::predecessor_or_input);
        return false;
    }
    if (!finite_input(input)) {
        fail(result, input.left_state_boxes == nullptr
                         ? FailureDetail::predecessor_or_input
                         : FailureDetail::left_state_nonfinite);
        return false;
    }
    raw_panel::SuccessorContext context{input.left_endpoint,
                                        input.left_state_box_count,
                                        input.left_state_boxes};
    raw_panel::g_successor_context = &context;
    raw_panel::g_successor_panel_detail = raw_panel::FailureDetail::none;
    primary_c08_panel_defect_v1::g_successor_defect_detail =
        primary_c08_panel_defect_v1::FailureDetail::none;
    const FailureDetail selection_detail = select_successor(input, output,
                                                             result);
    if (selection_detail != FailureDetail::none) {
        raw_panel::g_successor_context = nullptr;
        const std::size_t order_attempts = result->order_attempts;
        const std::size_t halving_attempts = result->panel_halving_attempts;
        const std::size_t inflation_attempts = result->inflation_attempts;
        fail(result, raw_panel::g_successor_panel_detail
                         == raw_panel::FailureDetail::predecessor_not_passed
                     ? FailureDetail::predecessor_or_input
                     : selection_detail);
        result->order_attempts = order_attempts;
        result->panel_halving_attempts = halving_attempts;
        result->inflation_attempts = inflation_attempts;
        return false;
    }

    raw_panel::Input accepted_panel_input{
        input.parameter_origin, input.target_endpoint,
        result->accepted_order,
        output->enclosure.accepted_panel_halvings};
    raw_panel::Result panel_result{};
    const bool panel_replayed = raw_panel::evaluate_successor_injected(
        accepted_panel_input, &output->polynomial, &panel_result);
    raw_panel::g_successor_context = nullptr;
    std::size_t left_replays = 0U;
    if (!panel_replayed
        || !replay_left_state(input, output->polynomial, &left_replays)
        || !arb_equal(output->polynomial.left_endpoint, input.left_endpoint)
        || !arb_equal(output->polynomial.left_endpoint,
                      output->enclosure.left_endpoint)
        || !arb_equal(output->polynomial.right_endpoint,
                      output->enclosure.right_endpoint)) {
        fail(result, FailureDetail::positive_panel_denominator_or_coefficient);
        return false;
    }

    result->accepted = true;
    result->detail = FailureDetail::none;
    result->left_state_boxes_admitted = kLeftStateBoxCount;
    result->left_state_boxes_replayed = left_replays;
    result->arbitrary_left_endpoint_used = true;
    result->exact_power_series_algebra_used =
        panel_result.exact_power_series_algebra_used;
    result->signed_cancellation_used = false;
    result->midpoint_acceptance_used = false;
    return true;
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::predecessor_or_input:
        return "C08-011C2_PREDECESSOR_OR_INPUT";
    case FailureDetail::left_state_nonfinite:
        return "C08-011C2_LEFT_STATE_NONFINITE";
    case FailureDetail::positive_panel_denominator_or_coefficient:
        return "C08-007_POSITIVE_PANEL_DENOMINATOR_OR_COEFFICIENT";
    case FailureDetail::panel_defect_or_exact_zero_replay:
        return "C08-008_PANEL_DEFECT_OR_EXACT_ZERO_REPLAY";
    case FailureDetail::picard_inflation_or_width_exhaustion:
        return "C08-009_PICARD_INFLATION_OR_WIDTH_EXHAUSTION";
    }
    return "C08-011C2_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_successor_panel_v1
