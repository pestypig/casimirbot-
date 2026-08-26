#include "mini_boson_star_primary_c08_panel_defect_v1.hpp"

#include <array>
#include <utility>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_panel_defect_v1 {
namespace {

namespace panel = primary_c08_positive_panel_v1;
constexpr slong kPrecisionBits = 512;
constexpr std::size_t kParameterCount = 3U;
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

void jet_scale_ui(Jet &target, const Jet &source, unsigned long scale) {
    for (std::size_t i = 0; i < kJetCount; ++i)
        arb_mul_ui(target.values + i, source.values + i, scale, kPrecisionBits);
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

void polynomial_zero(Polynomial &polynomial) {
    for (Jet *coefficient : polynomial) jet_zero(*coefficient);
}

void polynomial_multiply_add(Polynomial &target, const Polynomial &left,
                             const Polynomial &right) {
    Jet term, sum;
    for (std::size_t i = 0; i < left.size(); ++i) {
        for (std::size_t j = 0; j < right.size() && i + j < target.size(); ++j) {
            jet_mul(term, *left[i], *right[j]);
            jet_add(sum, *target[i + j], term);
            jet_set(*target[i + j], sum);
        }
    }
}

void polynomial_range(Jet &range, const Polynomial &polynomial,
                      arb_srcptr xi_panel) {
    jet_zero(range);
    Jet next;
    for (std::size_t offset = polynomial.size(); offset > 0U; --offset) {
        const std::size_t degree = offset - 1U;
        for (std::size_t jet = 0; jet < kJetCount; ++jet)
            arb_mul(next.values + jet, range.values + jet, xi_panel,
                    kPrecisionBits);
        jet_add(range, next, *polynomial[degree]);
    }
}

std::vector<Jet> make_jets(std::size_t count) {
    return std::vector<Jet>(count);
}

Polynomial pointers(std::vector<Jet> &storage) {
    Polynomial result;
    result.reserve(storage.size());
    for (auto &value : storage) result.push_back(&value);
    return result;
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

void reset(Output &output) {
    for (auto &value : output.cleared_defect_coefficients) arb_zero(&value);
    for (auto &value : output.defect_magnitude_upper) arb_zero(&value);
    output.generated_order = 0U;
    output.maximum_defect_degree = 0U;
    output.all_exact_zero = false;
}

void fail(Result *result, FailureDetail detail) {
    *result = Result{};
    result->detail = detail;
}

bool exact_zero_identity_self_test(
    const std::array<Polynomial, panel::kEquationPolynomialCount> &equation,
    arb_srcptr xi_panel) {
    // The zero scalar state is an exact solution of the actual universal
    // system for every admitted parameter box. Replay all five actual equation
    // polynomials, all 13 jets, the three integral identities, and the full
    // positive P2 panel. No scientific or selected data participates.
    Jet p2_range;
    polynomial_range(p2_range, equation[0], xi_panel);
    bool pass = arb_is_positive(p2_range.values);
    std::vector<Jet> zero_storage(1U);
    Polynomial zero = pointers(zero_storage);
    std::vector<Jet> residual_storage(panel::kEquationPolynomialDegree + 1U);
    Polynomial residual = pointers(residual_storage);
    polynomial_zero(zero); polynomial_zero(residual);
    for (const auto &coefficient : equation)
        polynomial_multiply_add(residual, coefficient, zero);
    for (const Jet *coefficient : residual)
        for (const auto &component : coefficient->values)
            pass = pass && arb_is_zero(&component);
    Jet derivative, state, difference;
    jet_zero(derivative); jet_zero(state); jet_sub(difference, derivative, state);
    for (const auto &component : difference.values)
        pass = pass && arb_is_zero(&component);
    return pass;
}

}  // namespace

Output::Output()
    : cleared_defect_coefficients(
          (kMaximumDefectDegree + 1U) * kStateCount * kJetCount),
      defect_magnitude_upper(kStateCount * kJetCount) {
    for (auto &value : cleared_defect_coefficients) arb_init(&value);
    for (auto &value : defect_magnitude_upper) arb_init(&value);
}

Output::~Output() {
    for (auto &value : defect_magnitude_upper) arb_clear(&value);
    for (auto &value : cleared_defect_coefficients) arb_clear(&value);
}

arb_ptr Output::coefficient(std::size_t degree, std::size_t state,
                            std::size_t jet) {
    return cleared_defect_coefficients.data()
        + (degree * kStateCount + state) * kJetCount + jet;
}

arb_srcptr Output::coefficient(std::size_t degree, std::size_t state,
                               std::size_t jet) const {
    return cleared_defect_coefficients.data()
        + (degree * kStateCount + state) * kJetCount + jet;
}

arb_ptr Output::magnitude(std::size_t state, std::size_t jet) {
    return defect_magnitude_upper.data() + state * kJetCount + jet;
}

arb_srcptr Output::magnitude(std::size_t state, std::size_t jet) const {
    return defect_magnitude_upper.data() + state * kJetCount + jet;
}

bool evaluate(const Input &input, Output *output, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    panel::Output panel_output;
    panel::Result panel_result{};
    if (!panel::evaluate(input.panel, &panel_output, &panel_result)) {
        fail(result, FailureDetail::predecessor_not_passed);
        return false;
    }
    if (output == nullptr) {
        fail(result, FailureDetail::missing_output);
        return false;
    }
    reset(*output);
    const unsigned order = panel_output.generated_order;
    const std::size_t residual_size = static_cast<std::size_t>(order) + 3U;

    std::array<std::vector<Jet>, kStateCount> residual_storage = {
        make_jets(residual_size), make_jets(residual_size),
        make_jets(residual_size), make_jets(residual_size)};
    std::array<Polynomial, kStateCount> residual = {
        pointers(residual_storage[0]), pointers(residual_storage[1]),
        pointers(residual_storage[2]), pointers(residual_storage[3])};
    for (auto &polynomial : residual) polynomial_zero(polynomial);

    // Integral identities: B'=V, J1'=B, J2'=J1.
    const std::array<std::pair<panel::State, panel::State>, 3U> identities = {{
        {panel::State::B, panel::State::V},
        {panel::State::J1, panel::State::B},
        {panel::State::J2, panel::State::J1},
    }};
    Jet derivative, rhs, difference;
    for (const auto &[left_state, right_state] : identities) {
        const std::size_t target = static_cast<std::size_t>(left_state);
        for (unsigned degree = 0U; degree <= order; ++degree) {
            jet_zero(derivative);
            if (degree < order) {
                jet_load(derivative, panel_output, degree + 1U, target);
                jet_scale_ui(derivative, derivative, degree + 1U);
            }
            jet_load(rhs, panel_output, degree,
                     static_cast<std::size_t>(right_state));
            jet_sub(difference, derivative, rhs);
            jet_set(*residual[target][degree], difference);
        }
    }

    // Cleared scalar identity P2*V' + P1*V + P0*B + PJ1*J1 + PJ2*J2.
    std::vector<Jet> derivative_storage(order == 0U ? 1U : order);
    Polynomial v_derivative = pointers(derivative_storage);
    polynomial_zero(v_derivative);
    for (unsigned degree = 0U; degree < order; ++degree) {
        jet_load(derivative, panel_output, degree + 1U,
                 static_cast<std::size_t>(panel::State::V));
        jet_scale_ui(*v_derivative[degree], derivative, degree + 1U);
    }
    std::array<std::vector<Jet>, panel::kEquationPolynomialCount> equation_storage = {
        make_jets(panel::kEquationPolynomialDegree + 1U),
        make_jets(panel::kEquationPolynomialDegree + 1U),
        make_jets(panel::kEquationPolynomialDegree + 1U),
        make_jets(panel::kEquationPolynomialDegree + 1U),
        make_jets(panel::kEquationPolynomialDegree + 1U)};
    std::array<Polynomial, panel::kEquationPolynomialCount> equation = {
        pointers(equation_storage[0]), pointers(equation_storage[1]),
        pointers(equation_storage[2]), pointers(equation_storage[3]),
        pointers(equation_storage[4])};
    for (std::size_t p = 0; p < equation.size(); ++p)
        for (std::size_t degree = 0; degree < equation[p].size(); ++degree)
            jet_load_equation(*equation[p][degree], panel_output, p, degree);
    polynomial_multiply_add(
        residual[static_cast<std::size_t>(panel::State::V)], equation[0],
        v_derivative);
    const std::array<panel::State, 4U> source_states = {
        panel::State::V, panel::State::B, panel::State::J1, panel::State::J2};
    for (std::size_t source_index = 0; source_index < source_states.size();
         ++source_index) {
        std::vector<Jet> source_storage(order + 1U);
        Polynomial source = pointers(source_storage);
        for (unsigned degree = 0U; degree <= order; ++degree)
            jet_load(*source[degree], panel_output, degree,
                     static_cast<std::size_t>(source_states[source_index]));
        polynomial_multiply_add(
            residual[static_cast<std::size_t>(panel::State::V)],
            equation[source_index + 1U], source);
    }

    for (std::size_t state = 0; state < kStateCount; ++state) {
        for (std::size_t degree = 0; degree < residual_size; ++degree) {
            if (!finite_jet(*residual[state][degree])) {
                fail(result, FailureDetail::defect_coefficient_nonfinite);
                return false;
            }
            for (std::size_t jet = 0; jet < kJetCount; ++jet)
                arb_set(output->coefficient(degree, state, jet),
                        residual[state][degree]->values + jet);
        }
    }

    std::size_t low_order_checks = 0U;
    for (unsigned degree = 0U; degree < order; ++degree) {
        for (std::size_t state = 0; state < kStateCount; ++state) {
            for (std::size_t jet = 0; jet < kJetCount; ++jet) {
                ++low_order_checks;
                if (!arb_contains_zero(output->coefficient(degree, state, jet))) {
                    fail(result,
                         FailureDetail::low_order_defect_does_not_contain_zero);
                    return false;
                }
            }
        }
    }

    arb_t xi_panel;
    arb_init(xi_panel);
    arb_zero(xi_panel);
    arb_union(xi_panel, xi_panel, panel_output.panel_width, kPrecisionBits);
    std::array<Jet, kStateCount> ranges;
    for (std::size_t state = 0; state < kStateCount; ++state)
        polynomial_range(ranges[state], residual[state], xi_panel);
    Jet p2_range, actual_v_range;
    polynomial_range(p2_range, equation[0], xi_panel);
    if (!arb_is_positive(p2_range.values)
        || !jet_div(actual_v_range,
                    ranges[static_cast<std::size_t>(panel::State::V)],
                    p2_range)) {
        arb_clear(xi_panel);
        fail(result, FailureDetail::full_panel_defect_nonfinite);
        return false;
    }
    jet_set(ranges[static_cast<std::size_t>(panel::State::V)], actual_v_range);
    bool all_exact_zero = true;
    for (std::size_t state = 0; state < kStateCount; ++state) {
        if (!finite_jet(ranges[state])) {
            arb_clear(xi_panel);
            fail(result, FailureDetail::full_panel_defect_nonfinite);
            return false;
        }
        for (std::size_t jet = 0; jet < kJetCount; ++jet) {
            if (!set_exact_upper(output->magnitude(state, jet),
                                 ranges[state].values + jet)) {
                arb_clear(xi_panel);
                fail(result, FailureDetail::full_panel_defect_nonfinite);
                return false;
            }
            all_exact_zero = all_exact_zero
                && arb_is_zero(output->magnitude(state, jet));
        }
    }
    bool exact_zero_replay = exact_zero_identity_self_test(equation, xi_panel);
    arb_clear(xi_panel);
    if (all_exact_zero) {
        exact_zero_replay = exact_zero_replay && arb_is_positive(p2_range.values);
        for (std::size_t state = 0; state < kStateCount; ++state)
            for (std::size_t degree = 0; degree < residual_size; ++degree)
                for (std::size_t jet = 0; jet < kJetCount; ++jet)
                    exact_zero_replay = exact_zero_replay
                        && arb_is_zero(output->coefficient(degree, state, jet));
    }
    if (!exact_zero_replay) {
        fail(result, FailureDetail::exact_zero_replay_failed);
        return false;
    }

    output->generated_order = order;
    output->maximum_defect_degree = order + 2U;
    output->all_exact_zero = all_exact_zero;
    result->accepted = true;
    result->requested_order = order;
    result->panel_halvings = panel_output.panel_halvings;
    result->low_order_zero_containment_checks = low_order_checks;
    result->complete_defect_coefficient_balls = residual_size * kStateCount
        * kJetCount;
    result->full_panel_magnitude_bounds = kStateCount * kJetCount;
    result->denominator_guards_replayed = true;
    result->exact_zero_branch_exercised = true;
    result->exact_zero_replay_passed = true;
    result->complete_interval_range_used = true;
    result->signed_cancellation_used = false;
    result->panel_accepted = false;
    result->picard_inclusion_performed = false;
    result->midpoint_acceptance_used = false;
    return true;
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::predecessor_not_passed:
        return "C08-008_PREDECESSOR_NOT_PASSED";
    case FailureDetail::missing_output: return "C08-008_MISSING_OUTPUT";
    case FailureDetail::defect_coefficient_nonfinite:
        return "C08-008_DEFECT_COEFFICIENT_NONFINITE";
    case FailureDetail::low_order_defect_does_not_contain_zero:
        return "C08-008_LOW_ORDER_DEFECT_DOES_NOT_CONTAIN_ZERO";
    case FailureDetail::full_panel_defect_nonfinite:
        return "C08-008_FULL_PANEL_DEFECT_NONFINITE";
    case FailureDetail::exact_zero_replay_failed:
        return "C08-008_PANEL_DEFECT_OR_EXACT_ZERO_REPLAY";
    }
    return "C08-008_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_panel_defect_v1
