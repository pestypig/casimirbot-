#include "mini_boson_star_primary_c08_picard_v1.hpp"

#include <array>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_picard_v1 {
namespace {

namespace panel = primary_c08_positive_panel_v1;
namespace defect = primary_c08_panel_defect_v1;
constexpr slong kPrecisionBits = 512;
constexpr std::size_t kParameterCount = 3U;
constexpr std::array<unsigned, kOrderCandidateCount> kOrders = {
    24U, 32U, 48U, 64U, 96U, 128U, 192U};
constexpr std::size_t first_index(std::size_t a) { return 1U + a; }
constexpr std::size_t second_index(std::size_t a, std::size_t b) {
    return 4U + kParameterCount * a + b;
}

struct Jet {
    Jet() { for (auto &value : values) arb_init(&value); }
    ~Jet() { for (auto &value : values) arb_clear(&value); }
    Jet(const Jet &) = delete;
    Jet &operator=(const Jet &) = delete;
    arb_struct values[kJetCount];
};

using Polynomial = std::vector<Jet *>;

void jet_zero(Jet &value) {
    for (auto &component : value.values) arb_zero(&component);
}

void jet_set(Jet &target, const Jet &source) {
    for (std::size_t i = 0; i < kJetCount; ++i)
        arb_set(target.values + i, source.values + i);
}

void jet_load(Jet &target, const panel::Output &source, std::size_t degree,
              std::size_t state) {
    for (std::size_t jet = 0; jet < kJetCount; ++jet)
        arb_set(target.values + jet, source.at(degree, state, jet));
}

void jet_load_equation(Jet &target, const panel::Output &source,
                       std::size_t polynomial, std::size_t degree) {
    for (std::size_t jet = 0; jet < kJetCount; ++jet)
        arb_set(target.values + jet,
                source.equation_polynomials[polynomial][degree] + jet);
}

void jet_add(Jet &target, const Jet &left, const Jet &right) {
    for (std::size_t i = 0; i < kJetCount; ++i)
        arb_add(target.values + i, left.values + i, right.values + i,
                kPrecisionBits);
}

void jet_sub(Jet &target, const Jet &left, const Jet &right) {
    for (std::size_t i = 0; i < kJetCount; ++i)
        arb_sub(target.values + i, left.values + i, right.values + i,
                kPrecisionBits);
}

void jet_neg(Jet &target, const Jet &source) {
    for (std::size_t i = 0; i < kJetCount; ++i)
        arb_neg(target.values + i, source.values + i);
}

void jet_mul(Jet &target, const Jet &left, const Jet &right) {
    Jet product, term, sum;
    arb_mul(product.values, left.values, right.values, kPrecisionBits);
    for (std::size_t a = 0; a < kParameterCount; ++a) {
        arb_mul(product.values + first_index(a), left.values + first_index(a),
                right.values, kPrecisionBits);
        arb_mul(term.values, left.values, right.values + first_index(a),
                kPrecisionBits);
        arb_add(product.values + first_index(a),
                product.values + first_index(a), term.values, kPrecisionBits);
    }
    for (std::size_t a = 0; a < kParameterCount; ++a) {
        for (std::size_t b = 0; b < kParameterCount; ++b) {
            const std::size_t index = second_index(a, b);
            arb_mul(product.values + index, left.values + index, right.values,
                    kPrecisionBits);
            arb_mul(term.values, left.values + first_index(a),
                    right.values + first_index(b), kPrecisionBits);
            arb_add(sum.values, product.values + index, term.values,
                    kPrecisionBits);
            arb_mul(term.values, left.values + first_index(b),
                    right.values + first_index(a), kPrecisionBits);
            arb_add(sum.values, sum.values, term.values, kPrecisionBits);
            arb_mul(term.values, left.values, right.values + index,
                    kPrecisionBits);
            arb_add(product.values + index, sum.values, term.values,
                    kPrecisionBits);
        }
    }
    jet_set(target, product);
}

bool jet_reciprocal(Jet &target, const Jet &source) {
    if (arb_contains_zero(source.values)) return false;
    Jet inverse, square, cube, term, sum;
    arb_inv(inverse.values, source.values, kPrecisionBits);
    arb_mul(square.values, inverse.values, inverse.values, kPrecisionBits);
    arb_mul(cube.values, square.values, inverse.values, kPrecisionBits);
    for (std::size_t a = 0; a < kParameterCount; ++a) {
        arb_mul(inverse.values + first_index(a), source.values + first_index(a),
                square.values, kPrecisionBits);
        arb_neg(inverse.values + first_index(a),
                inverse.values + first_index(a));
    }
    for (std::size_t a = 0; a < kParameterCount; ++a) {
        for (std::size_t b = 0; b < kParameterCount; ++b) {
            const std::size_t index = second_index(a, b);
            arb_mul(term.values, source.values + first_index(a),
                    source.values + first_index(b), kPrecisionBits);
            arb_mul(term.values, term.values, cube.values, kPrecisionBits);
            arb_mul_2exp_si(term.values, term.values, 1L);
            arb_mul(sum.values, source.values + index, square.values,
                    kPrecisionBits);
            arb_sub(inverse.values + index, term.values, sum.values,
                    kPrecisionBits);
        }
    }
    jet_set(target, inverse);
    return true;
}

bool jet_div(Jet &target, const Jet &numerator, const Jet &denominator) {
    Jet inverse;
    if (!jet_reciprocal(inverse, denominator)) return false;
    jet_mul(target, numerator, inverse);
    return true;
}

bool finite_jet(const Jet &value) {
    for (const auto &component : value.values)
        if (!arb_is_finite(&component)) return false;
    return true;
}

Polynomial pointers(std::vector<Jet> &storage) {
    Polynomial result;
    result.reserve(storage.size());
    for (auto &value : storage) result.push_back(&value);
    return result;
}

void polynomial_range(Jet &range, const Polynomial &polynomial,
                      arb_srcptr xi_panel) {
    jet_zero(range);
    Jet product, sum;
    for (std::size_t offset = polynomial.size(); offset > 0U; --offset) {
        for (std::size_t jet = 0; jet < kJetCount; ++jet)
            arb_mul(product.values + jet, range.values + jet, xi_panel,
                    kPrecisionBits);
        jet_add(sum, product, *polynomial[offset - 1U]);
        jet_set(range, sum);
    }
}

bool set_exact_upper(arb_ptr target, arb_srcptr value) {
    if (!arb_is_finite(value)) return false;
    arb_t absolute;
    arf_t upper;
    arb_init(absolute); arf_init(upper);
    arb_abs(absolute, value);
    arb_get_ubound_arf(upper, absolute, kPrecisionBits);
    arb_set_arf(target, upper);
    const bool pass = arb_is_finite(target) && !arb_is_negative(target);
    arf_clear(upper); arb_clear(absolute);
    return pass;
}

void symmetric_ball(arb_ptr target, arb_srcptr radius) {
    arb_t negative;
    arb_init(negative); arb_neg(negative, radius);
    arb_union(target, negative, radius, kPrecisionBits);
    arb_clear(negative);
}

void reset(Output &output) {
    arb_zero(output.left_endpoint); arb_zero(output.panel_width);
    arb_zero(output.right_endpoint); arb_zero(output.common_remainder_radius);
    for (auto &value : output.remainder_boxes) arb_zero(&value);
    for (auto &value : output.strict_containment_margins) arb_zero(&value);
    output.accepted_order = 0U; output.accepted_panel_halvings = 0U;
    output.accepted_inflation_exponent = 0U;
    output.exact_zero_remainder = false;
}

void fail(Result *result, FailureDetail detail, std::size_t order_attempts,
          std::size_t halving_attempts, std::size_t inflation_attempts) {
    *result = Result{};
    result->detail = detail;
    result->order_attempts = order_attempts;
    result->panel_halving_attempts = halving_attempts;
    result->inflation_attempts = inflation_attempts;
}

bool numerical_width_pass(const panel::Output &panel_output,
                          arb_srcptr common_radius,
                          const std::array<Jet, kStateCount> &state_ranges,
                          std::size_t *checks) {
    arb_t error, term, power, coefficient_radius, scale, threshold, one;
    arb_init(error); arb_init(term); arb_init(power); arb_init(coefficient_radius);
    arb_init(scale); arb_init(threshold); arb_init(one); arb_one(one);
    bool pass = true;
    for (std::size_t state = 0; state < kStateCount && pass; ++state) {
        for (std::size_t jet = 0; jet < kJetCount && pass; ++jet) {
            arb_set(error, common_radius); arb_one(power);
            for (unsigned degree = 0U; degree <= panel_output.generated_order;
                 ++degree) {
                arb_get_rad_arb(coefficient_radius,
                    panel_output.at(degree, state, jet));
                arb_mul(term, coefficient_radius, power, kPrecisionBits);
                arb_add(error, error, term, kPrecisionBits);
                arb_mul(power, power, panel_output.panel_width, kPrecisionBits);
            }
            if (!set_exact_upper(scale, state_ranges[state].values + jet)) {
                pass = false; break;
            }
            if (arb_lt(scale, one)) arb_one(scale);
            arb_mul_2exp_si(threshold, scale, -180L);
            ++*checks;
            pass = arb_is_finite(error) && arb_le(error, threshold);
        }
    }
    arb_clear(one); arb_clear(threshold); arb_clear(scale);
    arb_clear(coefficient_radius); arb_clear(power); arb_clear(term);
    arb_clear(error);
    return pass;
}

bool try_inflation(const panel::Output &panel_output,
                   const defect::Output &defect_output,
                   unsigned inflation_exponent, Output &output,
                   std::size_t *strict_checks, std::size_t *width_checks) {
    arb_t dmax, radius, xi_panel, image_upper, image_bound, margin;
    arb_init(dmax); arb_init(radius); arb_init(xi_panel); arb_init(image_upper);
    arb_init(image_bound); arb_init(margin); arb_zero(dmax);
    for (std::size_t state = 0; state < kStateCount; ++state)
        for (std::size_t jet = 0; jet < kJetCount; ++jet)
            if (arb_lt(dmax, defect_output.magnitude(state, jet)))
                arb_set(dmax, defect_output.magnitude(state, jet));
    arb_mul(radius, dmax, panel_output.panel_width, kPrecisionBits);
    arb_mul_2exp_si(radius, radius, static_cast<slong>(inflation_exponent));
    if (!arb_is_finite(radius) || !arb_is_positive(radius)) {
        arb_clear(margin); arb_clear(image_bound); arb_clear(image_upper);
        arb_clear(xi_panel); arb_clear(radius); arb_clear(dmax); return false;
    }
    arb_zero(xi_panel);
    arb_union(xi_panel, xi_panel, panel_output.panel_width, kPrecisionBits);

    std::array<std::vector<Jet>, kStateCount> state_storage = {
        std::vector<Jet>(panel_output.generated_order + 1U),
        std::vector<Jet>(panel_output.generated_order + 1U),
        std::vector<Jet>(panel_output.generated_order + 1U),
        std::vector<Jet>(panel_output.generated_order + 1U)};
    std::array<Polynomial, kStateCount> state_polynomials = {
        pointers(state_storage[0]), pointers(state_storage[1]),
        pointers(state_storage[2]), pointers(state_storage[3])};
    std::array<Jet, kStateCount> state_ranges;
    Jet remainder, sum;
    for (std::size_t state = 0; state < kStateCount; ++state) {
        for (unsigned degree = 0U; degree <= panel_output.generated_order;
             ++degree)
            jet_load(*state_polynomials[state][degree], panel_output, degree, state);
        polynomial_range(state_ranges[state], state_polynomials[state], xi_panel);
        for (std::size_t jet = 0; jet < kJetCount; ++jet)
            symmetric_ball(remainder.values + jet, radius);
        jet_add(sum, state_ranges[state], remainder);
        jet_set(state_ranges[state], sum);
    }

    std::array<std::vector<Jet>, panel::kEquationPolynomialCount> equation_storage = {
        std::vector<Jet>(3U), std::vector<Jet>(3U), std::vector<Jet>(3U),
        std::vector<Jet>(3U), std::vector<Jet>(3U)};
    std::array<Polynomial, panel::kEquationPolynomialCount> equation = {
        pointers(equation_storage[0]), pointers(equation_storage[1]),
        pointers(equation_storage[2]), pointers(equation_storage[3]),
        pointers(equation_storage[4])};
    std::array<Jet, panel::kEquationPolynomialCount> equation_ranges;
    for (std::size_t p = 0; p < equation.size(); ++p) {
        for (std::size_t degree = 0; degree < 3U; ++degree)
            jet_load_equation(*equation[p][degree], panel_output, p, degree);
        polynomial_range(equation_ranges[p], equation[p], xi_panel);
    }
    if (!arb_is_positive(equation_ranges[0].values)) {
        arb_clear(margin); arb_clear(image_bound); arb_clear(image_upper);
        arb_clear(xi_panel); arb_clear(radius); arb_clear(dmax); return false;
    }

    // Evaluate the correction image as -d + (F(p+E)-F(p)).  Re-evaluating
    // F(p)-p' from independent interval ranges would discard the exact Taylor
    // correlation already certified by C08-008 and can inflate a tiny defect
    // by many orders of magnitude.  The universal scalar Borel vector field
    // is linear in B,V,J1,J2, so its state increment is obtained exactly from
    // the common E box and the complete parameter-jet coefficient ranges.
    std::array<Jet, kStateCount> correction;
    Jet common_box;
    for (std::size_t jet = 0; jet < kJetCount; ++jet)
        symmetric_ball(common_box.values + jet, radius);
    jet_set(correction[static_cast<std::size_t>(panel::State::B)], common_box);
    jet_set(correction[static_cast<std::size_t>(panel::State::J1)], common_box);
    jet_set(correction[static_cast<std::size_t>(panel::State::J2)], common_box);
    Jet numerator, product, next, negative, solved;
    jet_zero(numerator);
    for (std::size_t source = 0; source < kStateCount; ++source) {
        jet_mul(product, equation_ranges[source + 1U], common_box);
        jet_add(next, numerator, product); jet_set(numerator, next);
    }
    jet_neg(negative, numerator);
    if (!jet_div(solved, negative, equation_ranges[0])) {
        arb_clear(margin); arb_clear(image_bound); arb_clear(image_upper);
        arb_clear(xi_panel); arb_clear(radius); arb_clear(dmax); return false;
    }
    jet_set(correction[static_cast<std::size_t>(panel::State::V)], solved);

    bool strict = true;
    std::array<Jet, kStateCount> defect_box, integrand;
    for (std::size_t state = 0; state < kStateCount && strict; ++state) {
        for (std::size_t jet = 0; jet < kJetCount; ++jet)
            symmetric_ball(defect_box[state].values + jet,
                           defect_output.magnitude(state, jet));
        jet_sub(integrand[state], correction[state], defect_box[state]);
        if (!finite_jet(integrand[state])) { strict = false; break; }
        for (std::size_t jet = 0; jet < kJetCount; ++jet) {
            if (!set_exact_upper(image_upper, integrand[state].values + jet)) {
                strict = false; break;
            }
            arb_mul(image_bound, image_upper, panel_output.panel_width,
                    kPrecisionBits);
            ++*strict_checks;
            if (!arb_lt(image_bound, radius)) { strict = false; break; }
            arb_sub(margin, radius, image_bound, kPrecisionBits);
            arb_set(output.margin(state, jet), margin);
            symmetric_ball(output.remainder(state, jet), radius);
        }
    }
    if (strict)
        strict = numerical_width_pass(panel_output, radius, state_ranges,
                                      width_checks);
    if (strict) arb_set(output.common_remainder_radius, radius);
    arb_clear(margin); arb_clear(image_bound); arb_clear(image_upper);
    arb_clear(xi_panel); arb_clear(radius); arb_clear(dmax);
    return strict;
}

}  // namespace

Output::Output()
    : remainder_boxes(kStateCount * kJetCount),
      strict_containment_margins(kStateCount * kJetCount) {
    arb_init(left_endpoint); arb_init(panel_width); arb_init(right_endpoint);
    arb_init(common_remainder_radius);
    for (auto &value : remainder_boxes) arb_init(&value);
    for (auto &value : strict_containment_margins) arb_init(&value);
}

Output::~Output() {
    for (auto &value : strict_containment_margins) arb_clear(&value);
    for (auto &value : remainder_boxes) arb_clear(&value);
    arb_clear(common_remainder_radius); arb_clear(right_endpoint);
    arb_clear(panel_width); arb_clear(left_endpoint);
}

arb_ptr Output::remainder(std::size_t state, std::size_t jet) {
    return remainder_boxes.data() + state * kJetCount + jet;
}
arb_srcptr Output::remainder(std::size_t state, std::size_t jet) const {
    return remainder_boxes.data() + state * kJetCount + jet;
}
arb_ptr Output::margin(std::size_t state, std::size_t jet) {
    return strict_containment_margins.data() + state * kJetCount + jet;
}
arb_srcptr Output::margin(std::size_t state, std::size_t jet) const {
    return strict_containment_margins.data() + state * kJetCount + jet;
}

bool evaluate(const Input &input, Output *output, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (output == nullptr) {
        fail(result, FailureDetail::missing_output, 0U, 0U, 0U);
        return false;
    }
    reset(*output);
    std::size_t order_attempts = 0U, halving_attempts = 0U;
    std::size_t inflation_attempts = 0U, strict_checks = 0U, width_checks = 0U;
    for (unsigned halving = 0U; halving <= kMaximumPanelHalvings; ++halving) {
        ++halving_attempts;
        for (const unsigned order : kOrders) {
            ++order_attempts;
            panel::Input panel_input{input.origin, input.target_endpoint, order,
                                     halving};
            defect::Input defect_input{panel_input};
            defect::Output defect_output;
            defect::Result defect_result{};
            if (!defect::evaluate(defect_input, &defect_output, &defect_result)) {
                fail(result, FailureDetail::predecessor_not_passed,
                     order_attempts, halving_attempts, inflation_attempts);
                return false;
            }
            panel::Output panel_output;
            panel::Result panel_result{};
            if (!panel::evaluate(panel_input, &panel_output, &panel_result)) {
                fail(result, FailureDetail::predecessor_not_passed,
                     order_attempts, halving_attempts, inflation_attempts);
                return false;
            }
            if (defect_output.all_exact_zero) {
                arb_zero(output->common_remainder_radius);
                output->exact_zero_remainder = true;
                output->accepted_order = order;
                output->accepted_panel_halvings = halving;
                output->accepted_inflation_exponent = 0U;
                arb_set(output->left_endpoint, panel_output.left_endpoint);
                arb_set(output->panel_width, panel_output.panel_width);
                arb_set(output->right_endpoint, panel_output.right_endpoint);
                result->accepted = true; result->detail = FailureDetail::none;
                result->order_attempts = order_attempts;
                result->panel_halving_attempts = halving_attempts;
                result->inflation_attempts = inflation_attempts;
                result->first_passing_order_used = true;
                result->first_passing_inflation_used = true;
                result->complete_parameter_box_used = true;
                result->component_weights_all_one = true;
                result->panel_accepted = true;
                result->picard_inclusion_performed = true;
                return true;
            }
            for (unsigned exponent = 1U;
                 exponent <= kMaximumInflationExponent; ++exponent) {
                ++inflation_attempts;
                for (auto &value : output->remainder_boxes) arb_zero(&value);
                for (auto &value : output->strict_containment_margins)
                    arb_zero(&value);
                if (try_inflation(panel_output, defect_output, exponent, *output,
                                  &strict_checks, &width_checks)) {
                    output->accepted_order = order;
                    output->accepted_panel_halvings = halving;
                    output->accepted_inflation_exponent = exponent;
                    arb_set(output->left_endpoint, panel_output.left_endpoint);
                    arb_set(output->panel_width, panel_output.panel_width);
                    arb_set(output->right_endpoint, panel_output.right_endpoint);
                    result->accepted = true; result->detail = FailureDetail::none;
                    result->order_attempts = order_attempts;
                    result->panel_halving_attempts = halving_attempts;
                    result->inflation_attempts = inflation_attempts;
                    result->strict_component_checks = strict_checks;
                    result->numerical_width_checks = width_checks;
                    result->first_passing_order_used = true;
                    result->first_passing_inflation_used = true;
                    result->complete_parameter_box_used = true;
                    result->component_weights_all_one = true;
                    result->signed_cancellation_used = false;
                    result->midpoint_acceptance_used = false;
                    result->panel_accepted = true;
                    result->picard_inclusion_performed = true;
                    return true;
                }
            }
        }
    }
    fail(result, FailureDetail::picard_inflation_or_width_exhaustion,
         order_attempts,
         halving_attempts, inflation_attempts);
    result->strict_component_checks = strict_checks;
    result->numerical_width_checks = width_checks;
    return false;
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::predecessor_not_passed:
        return "C08-009_PREDECESSOR_NOT_PASSED";
    case FailureDetail::missing_output: return "C08-009_MISSING_OUTPUT";
    case FailureDetail::picard_inflation_or_width_exhaustion:
        return "C08-009_PICARD_INFLATION_OR_WIDTH_EXHAUSTION";
    }
    return "C08-009_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_picard_v1
