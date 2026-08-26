#include "mini_boson_star_primary_c08_positive_panel_v1.hpp"

#include <arf.h>

#include <array>

namespace nhm2::g2h_e_s5::primary_c08_positive_panel_v1 {
namespace {

constexpr slong kPrecisionBits = 512;
constexpr std::size_t kParameterCount = 3U;
constexpr std::size_t kMixedOrientationCount = 6U;
constexpr std::array<unsigned, kOrderCandidateCount> kOrders = {
    24U, 32U, 48U, 64U, 96U, 128U, 192U,
};
constexpr std::size_t value_index = 0U;
constexpr std::size_t first_index(std::size_t a) { return 1U + a; }
constexpr std::size_t second_index(std::size_t a, std::size_t b) {
    return 4U + kParameterCount * a + b;
}

struct Jet {
    arb_struct values[kJetCount];
    Jet() { for (auto &value : values) arb_init(&value); }
    ~Jet() { for (auto &value : values) arb_clear(&value); }
    Jet(const Jet &) = delete;
    Jet &operator=(const Jet &) = delete;
};

struct Polynomial {
    Jet coefficients[kEquationPolynomialDegree + 1U];
};

void jet_zero(Jet &value) {
    for (auto &component : value.values) arb_zero(&component);
}

void jet_set(Jet &target, const Jet &source) {
    for (std::size_t i = 0; i < kJetCount; ++i)
        arb_set(target.values + i, source.values + i);
}

void jet_set_scalar(Jet &target, arb_srcptr value) {
    jet_zero(target);
    arb_set(target.values + value_index, value);
}

void jet_set_ui(Jet &target, unsigned long value) {
    jet_zero(target);
    arb_set_ui(target.values + value_index, value);
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

void jet_scale_si(Jet &target, const Jet &source, long scale) {
    for (std::size_t i = 0; i < kJetCount; ++i)
        arb_mul_si(target.values + i, source.values + i, scale,
                   kPrecisionBits);
}

void jet_div_ui(Jet &target, const Jet &source, unsigned long divisor) {
    for (std::size_t i = 0; i < kJetCount; ++i)
        arb_div_ui(target.values + i, source.values + i, divisor,
                   kPrecisionBits);
}

void jet_mul(Jet &target, const Jet &left, const Jet &right) {
    Jet product;
    arb_mul(product.values + value_index, left.values + value_index,
            right.values + value_index, kPrecisionBits);
    arb_t temporary;
    arb_init(temporary);
    for (std::size_t a = 0; a < kParameterCount; ++a) {
        arb_mul(product.values + first_index(a), left.values + first_index(a),
                right.values + value_index, kPrecisionBits);
        arb_mul(temporary, left.values + value_index,
                right.values + first_index(a), kPrecisionBits);
        arb_add(product.values + first_index(a), product.values + first_index(a),
                temporary, kPrecisionBits);
    }
    for (std::size_t a = 0; a < kParameterCount; ++a) {
        for (std::size_t b = 0; b < kParameterCount; ++b) {
            const std::size_t index = second_index(a, b);
            arb_mul(product.values + index, left.values + index,
                    right.values + value_index, kPrecisionBits);
            arb_mul(temporary, left.values + first_index(a),
                    right.values + first_index(b), kPrecisionBits);
            arb_add(product.values + index, product.values + index, temporary,
                    kPrecisionBits);
            arb_mul(temporary, left.values + first_index(b),
                    right.values + first_index(a), kPrecisionBits);
            arb_add(product.values + index, product.values + index, temporary,
                    kPrecisionBits);
            arb_mul(temporary, left.values + value_index,
                    right.values + index, kPrecisionBits);
            arb_add(product.values + index, product.values + index, temporary,
                    kPrecisionBits);
        }
    }
    arb_clear(temporary);
    jet_set(target, product);
}

bool jet_reciprocal(Jet &target, const Jet &source) {
    if (!arb_is_finite(source.values + value_index)
        || arb_contains_zero(source.values + value_index)) return false;
    arb_inv(target.values + value_index, source.values + value_index,
            kPrecisionBits);
    arb_t sum, temporary;
    arb_init(sum); arb_init(temporary);
    for (std::size_t a = 0; a < kParameterCount; ++a) {
        arb_mul(sum, source.values + first_index(a),
                target.values + value_index, kPrecisionBits);
        arb_neg(sum, sum);
        arb_div(target.values + first_index(a), sum,
                source.values + value_index, kPrecisionBits);
    }
    for (std::size_t a = 0; a < kParameterCount; ++a) {
        for (std::size_t b = 0; b < kParameterCount; ++b) {
            const std::size_t index = second_index(a, b);
            arb_mul(sum, source.values + index, target.values + value_index,
                    kPrecisionBits);
            arb_mul(temporary, source.values + first_index(a),
                    target.values + first_index(b), kPrecisionBits);
            arb_add(sum, sum, temporary, kPrecisionBits);
            arb_mul(temporary, source.values + first_index(b),
                    target.values + first_index(a), kPrecisionBits);
            arb_add(sum, sum, temporary, kPrecisionBits);
            arb_neg(sum, sum);
            arb_div(target.values + index, sum,
                    source.values + value_index, kPrecisionBits);
        }
    }
    arb_clear(temporary); arb_clear(sum);
    return true;
}

bool jet_div(Jet &target, const Jet &numerator, const Jet &denominator) {
    Jet reciprocal;
    return jet_reciprocal(reciprocal, denominator)
        && (jet_mul(target, numerator, reciprocal), true);
}

bool finite_jet(const Jet &value) {
    for (const auto &component : value.values)
        if (!arb_is_finite(&component)) return false;
    return true;
}

void polynomial_zero(Polynomial &value) {
    for (auto &coefficient : value.coefficients) jet_zero(coefficient);
}

void polynomial_set(Polynomial &target, const Polynomial &source) {
    for (std::size_t i = 0; i <= kEquationPolynomialDegree; ++i)
        jet_set(target.coefficients[i], source.coefficients[i]);
}

void polynomial_constant(Polynomial &target, const Jet &value) {
    polynomial_zero(target);
    jet_set(target.coefficients[0], value);
}

void polynomial_add(Polynomial &target, const Polynomial &left,
                    const Polynomial &right) {
    Polynomial sum;
    for (std::size_t i = 0; i <= kEquationPolynomialDegree; ++i)
        jet_add(sum.coefficients[i], left.coefficients[i], right.coefficients[i]);
    polynomial_set(target, sum);
}

void polynomial_scale_si(Polynomial &target, const Polynomial &source,
                         long scale) {
    Polynomial product;
    for (std::size_t i = 0; i <= kEquationPolynomialDegree; ++i)
        jet_scale_si(product.coefficients[i], source.coefficients[i], scale);
    polynomial_set(target, product);
}

void polynomial_mul(Polynomial &target, const Polynomial &left,
                    const Polynomial &right) {
    Polynomial product;
    polynomial_zero(product);
    Jet term, sum;
    for (std::size_t i = 0; i <= kEquationPolynomialDegree; ++i) {
        for (std::size_t j = 0; i + j <= kEquationPolynomialDegree; ++j) {
            jet_mul(term, left.coefficients[i], right.coefficients[j]);
            jet_add(sum, product.coefficients[i + j], term);
            jet_set(product.coefficients[i + j], sum);
        }
    }
    polynomial_set(target, product);
}

void polynomial_mul_jet(Polynomial &target, const Polynomial &source,
                        const Jet &factor) {
    Polynomial product;
    for (std::size_t i = 0; i <= kEquationPolynomialDegree; ++i)
        jet_mul(product.coefficients[i], source.coefficients[i], factor);
    polynomial_set(target, product);
}

bool polynomial_div_jet(Polynomial &target, const Polynomial &source,
                        const Jet &denominator) {
    Jet reciprocal;
    if (!jet_reciprocal(reciprocal, denominator)) return false;
    polynomial_mul_jet(target, source, reciprocal);
    return true;
}

bool order_allowed(unsigned order) {
    for (const unsigned candidate : kOrders)
        if (order == candidate) return true;
    return false;
}

void reset(Output &output) {
    arb_zero(output.left_endpoint); arb_zero(output.panel_width);
    arb_zero(output.right_endpoint); arb_zero(output.t_panel);
    arb_zero(output.t_plus_two_kappa_panel); arb_zero(output.scalar_p2_panel);
    for (auto &coefficient : output.coefficients) arb_zero(&coefficient);
    for (auto &polynomial : output.equation_polynomials)
        for (auto &degree : polynomial)
            for (auto &component : degree) arb_zero(&component);
    output.generated_order = 0U;
    output.panel_halvings = 0U;
}

void fail(Result *result, FailureDetail detail) {
    *result = Result{};
    result->detail = detail;
}

bool finite(arb_srcptr value) {
    return value != nullptr && arb_is_finite(value) != 0;
}

FailureDetail choose_panel(
    const Input &input,
    const primary_c08_origin_series_v1::Output &origin,
    const primary_c08_margins_v1::Output &margins, Output &output) {
    if (!finite(input.target_endpoint) || !arb_is_exact(input.target_endpoint)
        || !arb_is_positive(input.target_endpoint)
        || !arb_is_exact(origin.t0)
        || !arb_lt(origin.t0, input.target_endpoint))
        return FailureDetail::target_endpoint_invalid;

    arb_t candidate_t, candidate_kappa, candidate_target, temporary;
    arb_init(candidate_t); arb_init(candidate_kappa); arb_init(candidate_target);
    arb_init(temporary);
    arb_set(output.left_endpoint, origin.t0);
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

void set_parameter_jets(const Input &input,
                        const primary_c08_margins_v1::Output &margins,
                        Jet &kappa, Jet &mu) {
    jet_set_scalar(kappa, input.origin.gevrey.margins.kappa);
    arb_one(kappa.values + first_index(1U));
    jet_set_scalar(mu, margins.mu);
    if (input.origin.gevrey.margins.identity->chart
        == primary_c08_identity_v1::Chart::positive) {
        arb_one(mu.values + first_index(2U));
    } else {
        arb_set(mu.values + first_index(2U),
                input.origin.gevrey.margins.eta);
    }
}

bool build_equation_polynomials(const Input &input, const Output &output,
                                const primary_c08_margins_v1::Output &margins,
                                Polynomial (&polynomials)[kEquationPolynomialCount]) {
    Jet one, kappa, mu, k2, k3, k4, mu2, factor, term, constant;
    jet_set_ui(one, 1UL);
    set_parameter_jets(input, margins, kappa, mu);
    jet_mul(k2, kappa, kappa); jet_mul(k3, k2, kappa);
    jet_mul(k4, k2, k2); jet_mul(mu2, mu, mu);

    Polynomial t, t2, right, sum, temporary;
    polynomial_zero(t);
    jet_set_scalar(t.coefficients[0], output.left_endpoint);
    jet_set_ui(t.coefficients[1], 1UL);
    polynomial_mul(t2, t, t);

    // P2=t*(t+2*kappa).
    jet_scale_si(constant, kappa, 2L);
    polynomial_constant(temporary, constant);
    polynomial_add(right, t, temporary);
    polynomial_mul(polynomials[0], t, right);

    // P1=-2*(2*mu*kappa^2*t+2*mu*kappa*t^2+mu*t-kappa^2-kappa*t)/kappa.
    jet_mul(factor, mu, k2); jet_scale_si(factor, factor, 2L);
    polynomial_mul_jet(sum, t, factor);
    jet_mul(factor, mu, kappa); jet_scale_si(factor, factor, 2L);
    polynomial_mul_jet(temporary, t2, factor); polynomial_add(sum, sum, temporary);
    polynomial_mul_jet(temporary, t, mu); polynomial_add(sum, sum, temporary);
    jet_neg(constant, k2); polynomial_constant(temporary, constant);
    polynomial_add(sum, sum, temporary);
    jet_neg(constant, kappa); polynomial_mul_jet(temporary, t, constant);
    polynomial_add(sum, sum, temporary); polynomial_scale_si(sum, sum, -2L);
    if (!polynomial_div_jet(polynomials[1], sum, kappa)) return false;

    // P0=mu*(c0+c1*t+c2*t^2)/kappa^2.
    jet_mul(constant, mu, k4); jet_scale_si(constant, constant, -8L);
    jet_mul(term, mu, k2); jet_scale_si(term, term, 4L);
    jet_add(constant, constant, term); jet_add(constant, constant, mu);
    jet_sub(constant, constant, kappa); polynomial_constant(sum, constant);
    jet_mul(factor, mu, k3); jet_scale_si(factor, factor, -8L);
    jet_mul(term, mu, kappa); jet_scale_si(term, term, 8L);
    jet_add(factor, factor, term); jet_scale_si(term, k2, -2L);
    jet_add(factor, factor, term); polynomial_mul_jet(temporary, t, factor);
    polynomial_add(sum, sum, temporary);
    jet_mul(factor, mu, k2); jet_scale_si(factor, factor, 4L);
    polynomial_mul_jet(temporary, t2, factor); polynomial_add(sum, sum, temporary);
    polynomial_mul_jet(sum, sum, mu);
    if (!polynomial_div_jet(polynomials[2], sum, k2)) return false;

    // PJ1=2*mu^2*(2*kappa*t+1)*(4*mu*kappa^2-2*mu-kappa)/kappa^2.
    jet_mul(factor, mu, k2); jet_scale_si(factor, factor, 4L);
    jet_scale_si(term, mu, 2L); jet_sub(factor, factor, term);
    jet_sub(factor, factor, kappa); jet_mul(factor, factor, mu2);
    jet_scale_si(factor, factor, 2L);
    Jet reciprocal_k2;
    if (!jet_reciprocal(reciprocal_k2, k2)) return false;
    jet_mul(factor, factor, reciprocal_k2);
    polynomial_constant(sum, one);
    jet_scale_si(constant, kappa, 2L);
    polynomial_mul_jet(temporary, t, constant); polynomial_add(sum, sum, temporary);
    polynomial_mul_jet(polynomials[3], sum, factor);

    // PJ2=4*mu^2*(2*mu*kappa^2-mu-kappa)^2/kappa^2.
    jet_mul(factor, mu, k2); jet_scale_si(factor, factor, 2L);
    jet_sub(factor, factor, mu); jet_sub(factor, factor, kappa);
    jet_mul(factor, factor, factor); jet_mul(factor, factor, mu2);
    jet_scale_si(factor, factor, 4L); jet_mul(factor, factor, reciprocal_k2);
    polynomial_constant(polynomials[4], factor);

    for (const auto &polynomial : polynomials)
        for (const auto &coefficient : polynomial.coefficients)
            if (!finite_jet(coefficient)) return false;
    return true;
}

void store_equation_polynomials(Output &output,
                                Polynomial (&polynomials)[kEquationPolynomialCount]) {
    for (std::size_t p = 0; p < kEquationPolynomialCount; ++p)
        for (std::size_t degree = 0; degree <= kEquationPolynomialDegree; ++degree)
            for (std::size_t jet = 0; jet < kJetCount; ++jet)
                arb_set(output.equation_polynomials[p][degree] + jet,
                        polynomials[p].coefficients[degree].values + jet);
}

void load_coefficient(Jet &target, const Output &output, std::size_t order,
                      State state) {
    for (std::size_t jet = 0; jet < kJetCount; ++jet)
        arb_set(target.values + jet,
                output.at(order, static_cast<std::size_t>(state), jet));
}

void store_coefficient(Output &output, std::size_t order, State state,
                       const Jet &source) {
    for (std::size_t jet = 0; jet < kJetCount; ++jet)
        arb_set(output.at(order, static_cast<std::size_t>(state), jet),
                source.values + jet);
}

bool generate_coefficients(
    Output &output,
    const primary_c08_origin_series_v1::Output &origin,
    Polynomial (&polynomials)[kEquationPolynomialCount], unsigned order) {
    const std::array<std::size_t, kStateCount> origin_kinds = {
        static_cast<std::size_t>(primary_c08_origin_series_v1::TailKind::B),
        static_cast<std::size_t>(primary_c08_origin_series_v1::TailKind::V),
        static_cast<std::size_t>(primary_c08_origin_series_v1::TailKind::J1),
        static_cast<std::size_t>(primary_c08_origin_series_v1::TailKind::J2),
    };
    for (std::size_t state = 0; state < kStateCount; ++state)
        for (std::size_t jet = 0; jet < kJetCount; ++jet)
            arb_set(output.at(0U, state, jet),
                    origin.enclosed_values[jet] + origin_kinds[state]);

    Jet numerator, term, source, correction, rhs, denominator;
    Jet b, v, j1, next;
    for (unsigned n = 0U; n < order; ++n) {
        jet_zero(numerator);
        const std::array<State, 4U> states = {
            State::V, State::B, State::J1, State::J2,
        };
        const std::array<std::size_t, 4U> polynomial_indices = {1U, 2U, 3U, 4U};
        for (std::size_t operand = 0; operand < states.size(); ++operand) {
            for (std::size_t degree = 0;
                 degree <= kEquationPolynomialDegree && degree <= n; ++degree) {
                load_coefficient(source, output, n - degree, states[operand]);
                jet_mul(term, polynomials[polynomial_indices[operand]]
                                  .coefficients[degree], source);
                jet_add(next, numerator, term); jet_set(numerator, next);
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
            jet_add(next, correction, term); jet_set(correction, next);
        }
        jet_neg(rhs, numerator); jet_sub(rhs, rhs, correction);
        jet_scale_si(denominator, polynomials[0].coefficients[0],
                     static_cast<long>(n + 1U));
        if (!jet_div(next, rhs, denominator) || !finite_jet(next)) return false;
        store_coefficient(output, n + 1U, State::V, next);

        load_coefficient(v, output, n, State::V); jet_div_ui(next, v, n + 1U);
        store_coefficient(output, n + 1U, State::B, next);
        load_coefficient(b, output, n, State::B); jet_div_ui(next, b, n + 1U);
        store_coefficient(output, n + 1U, State::J1, next);
        load_coefficient(j1, output, n, State::J1); jet_div_ui(next, j1, n + 1U);
        store_coefficient(output, n + 1U, State::J2, next);
    }
    for (unsigned n = 0U; n <= order; ++n)
        for (std::size_t state = 0; state < kStateCount; ++state) {
            load_coefficient(source, output, n, static_cast<State>(state));
            if (!finite_jet(source)) return false;
        }
    return true;
}

bool origin_derivative_compatible(
    const Output &output,
    const primary_c08_origin_series_v1::Output &origin) {
    for (std::size_t jet = 0; jet < kJetCount; ++jet) {
        if (!arb_overlaps(output.at(1U, static_cast<std::size_t>(State::V), jet),
                          origin.enclosed_values[jet]
                              + static_cast<std::size_t>(
                                  primary_c08_origin_series_v1::TailKind::B_second)))
            return false;
    }
    return true;
}

}  // namespace

Output::Output()
    : coefficients((kMaximumPanelOrder + 1U) * kStateCount * kJetCount) {
    arb_init(left_endpoint); arb_init(panel_width); arb_init(right_endpoint);
    arb_init(t_panel); arb_init(t_plus_two_kappa_panel); arb_init(scalar_p2_panel);
    for (auto &coefficient : coefficients) arb_init(&coefficient);
    for (auto &polynomial : equation_polynomials)
        for (auto &degree : polynomial)
            for (auto &component : degree) arb_init(&component);
}

Output::~Output() {
    for (auto &polynomial : equation_polynomials)
        for (auto &degree : polynomial)
            for (auto &component : degree) arb_clear(&component);
    for (auto &coefficient : coefficients) arb_clear(&coefficient);
    arb_clear(scalar_p2_panel); arb_clear(t_plus_two_kappa_panel);
    arb_clear(t_panel); arb_clear(right_endpoint); arb_clear(panel_width);
    arb_clear(left_endpoint);
}

arb_ptr Output::at(std::size_t order, std::size_t state, std::size_t jet) {
    return coefficients.data() + (order * kStateCount + state) * kJetCount + jet;
}

arb_srcptr Output::at(std::size_t order, std::size_t state,
                      std::size_t jet) const {
    return coefficients.data() + (order * kStateCount + state) * kJetCount + jet;
}

bool evaluate(const Input &input, Output *output, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    primary_c08_origin_series_v1::Output origin_output;
    primary_c08_origin_series_v1::Result origin_result{};
    if (!primary_c08_origin_series_v1::evaluate(input.origin, &origin_output,
                                                 &origin_result)) {
        fail(result, FailureDetail::predecessor_not_passed);
        return false;
    }
    if (output == nullptr) {
        fail(result, FailureDetail::missing_output);
        return false;
    }
    reset(*output);
    if (!order_allowed(input.requested_order)) {
        fail(result, FailureDetail::order_not_in_frozen_schedule);
        return false;
    }
    if (input.panel_halvings > kMaximumPanelHalvings) {
        fail(result, FailureDetail::panel_halving_exhaustion);
        return false;
    }
    primary_c08_margins_v1::Output margins_output;
    primary_c08_margins_v1::Result margins_result{};
    if (!primary_c08_margins_v1::evaluate(input.origin.gevrey.margins,
                                           &margins_output, &margins_result)) {
        fail(result, FailureDetail::predecessor_not_passed);
        return false;
    }
    const FailureDetail panel_detail =
        choose_panel(input, origin_output, margins_output, *output);
    if (panel_detail != FailureDetail::none) {
        fail(result, panel_detail);
        return false;
    }
    Polynomial polynomials[kEquationPolynomialCount];
    if (!build_equation_polynomials(input, *output, margins_output, polynomials)) {
        fail(result, FailureDetail::positive_panel_denominator_or_coefficient);
        return false;
    }
    store_equation_polynomials(*output, polynomials);
    if (!generate_coefficients(*output, origin_output, polynomials,
                               input.requested_order)
        || !origin_derivative_compatible(*output, origin_output)) {
        fail(result, FailureDetail::positive_panel_denominator_or_coefficient);
        return false;
    }

    output->generated_order = input.requested_order;
    output->panel_halvings = input.panel_halvings;
    result->accepted = true;
    result->requested_order = input.requested_order;
    result->panel_halvings = input.panel_halvings;
    result->strict_denominator_margins = 4U;
    result->equation_polynomial_balls = kEquationPolynomialCount
        * (kEquationPolynomialDegree + 1U) * kJetCount;
    result->taylor_coefficient_balls = (input.requested_order + 1U)
        * kStateCount * kJetCount;
    result->origin_derivative_compatibility_checks = kJetCount;
    result->ordered_mixed_orientations = (input.requested_order + 1U)
        * kStateCount * kMixedOrientationCount;
    result->exact_power_series_algebra_used = true;
    result->directed_denominator_bounds_used = true;
    result->midpoint_acceptance_used = false;
    return true;
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::predecessor_not_passed:
        return "C08-007_PREDECESSOR_NOT_PASSED";
    case FailureDetail::missing_output: return "C08-007_MISSING_OUTPUT";
    case FailureDetail::target_endpoint_invalid:
        return "C08-007_TARGET_ENDPOINT_INVALID";
    case FailureDetail::order_not_in_frozen_schedule:
        return "C08-007_ORDER_NOT_IN_FROZEN_SCHEDULE";
    case FailureDetail::panel_halving_exhaustion:
        return "C08-007_PANEL_HALVING_EXHAUSTION";
    case FailureDetail::positive_panel_denominator_or_coefficient:
        return "C08-007_POSITIVE_PANEL_DENOMINATOR_OR_COEFFICIENT";
    }
    return "C08-007_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_positive_panel_v1
