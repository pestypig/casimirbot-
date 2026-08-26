#include "mini_boson_star_primary_c08_tail_lyapunov_v1.hpp"

#include <arb_mat.h>
#include <flint/fmpz.h>

#include <algorithm>
#include <array>
#include <map>
#include <utility>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_tail_lyapunov_v1 {
namespace {

constexpr std::size_t kPolynomialVariableCount = 4U;
using Exponents = std::array<unsigned int, kPolynomialVariableCount>;

class Rational {
  public:
    Rational() { fmpq_init(value_); }
    explicit Rational(const fmpq *value) {
        fmpq_init(value_);
        fmpq_set(value_, value);
    }
    Rational(const Rational &other) {
        fmpq_init(value_);
        fmpq_set(value_, other.value_);
    }
    Rational(Rational &&other) noexcept {
        fmpq_init(value_);
        fmpq_swap(value_, other.value_);
    }
    ~Rational() { fmpq_clear(value_); }
    Rational &operator=(const Rational &other) {
        if (this != &other) fmpq_set(value_, other.value_);
        return *this;
    }
    Rational &operator=(Rational &&other) noexcept {
        if (this != &other) fmpq_swap(value_, other.value_);
        return *this;
    }
    fmpq *get() { return value_; }
    const fmpq *get() const { return value_; }

  private:
    fmpq_t value_;
};

struct Polynomial {
    std::map<Exponents, Rational> terms;
};

using PolynomialMatrix =
    std::array<std::array<Polynomial, kStateDimension>, kStateDimension>;

bool is_zero(const Rational &value) {
    return fmpq_is_zero(value.get()) != 0;
}

void add_term(Polynomial &target, const Exponents &exponents,
              const fmpq *coefficient) {
    if (fmpq_is_zero(coefficient)) return;
    auto found = target.terms.find(exponents);
    if (found == target.terms.end()) {
        target.terms.emplace(exponents, Rational(coefficient));
        return;
    }
    fmpq_add(found->second.get(), found->second.get(), coefficient);
    if (is_zero(found->second)) target.terms.erase(found);
}

Polynomial constant(const fmpq *value) {
    Polynomial result;
    add_term(result, Exponents{}, value);
    return result;
}

Polynomial signed_integer(slong value) {
    fmpq_t q;
    fmpq_init(q);
    fmpq_set_si(q, value, 1UL);
    Polynomial result = constant(q);
    fmpq_clear(q);
    return result;
}

Polynomial variable(std::size_t ordinal) {
    Polynomial result;
    fmpq_t one;
    fmpq_init(one);
    fmpq_one(one);
    Exponents exponents{};
    exponents[ordinal] = 1U;
    add_term(result, exponents, one);
    fmpq_clear(one);
    return result;
}

Polynomial add(const Polynomial &left, const Polynomial &right) {
    Polynomial result = left;
    for (const auto &[exponents, coefficient] : right.terms)
        add_term(result, exponents, coefficient.get());
    return result;
}

Polynomial negate(const Polynomial &value) {
    Polynomial result;
    fmpq_t coefficient;
    fmpq_init(coefficient);
    for (const auto &[exponents, source] : value.terms) {
        fmpq_neg(coefficient, source.get());
        add_term(result, exponents, coefficient);
    }
    fmpq_clear(coefficient);
    return result;
}

Polynomial subtract(const Polynomial &left, const Polynomial &right) {
    return add(left, negate(right));
}

Polynomial multiply(const Polynomial &left, const Polynomial &right) {
    Polynomial result;
    fmpq_t product;
    fmpq_init(product);
    for (const auto &[left_exponents, left_coefficient] : left.terms) {
        for (const auto &[right_exponents, right_coefficient] : right.terms) {
            Exponents exponents{};
            for (std::size_t index = 0U; index < kPolynomialVariableCount;
                 ++index) {
                exponents[index] = left_exponents[index]
                    + right_exponents[index];
            }
            fmpq_mul(product, left_coefficient.get(), right_coefficient.get());
            add_term(result, exponents, product);
        }
    }
    fmpq_clear(product);
    return result;
}

Polynomial scale(const Polynomial &value, const fmpq *factor) {
    return multiply(value, constant(factor));
}

Polynomial power(Polynomial base, unsigned int exponent) {
    Polynomial result = signed_integer(1);
    while (exponent > 0U) {
        if ((exponent & 1U) != 0U) result = multiply(result, base);
        exponent >>= 1U;
        if (exponent > 0U) base = multiply(base, base);
    }
    return result;
}

Polynomial derivative(const Polynomial &value, std::size_t variable_ordinal) {
    Polynomial result;
    fmpq_t coefficient;
    fmpq_init(coefficient);
    for (const auto &[source_exponents, source_coefficient] : value.terms) {
        const unsigned int exponent = source_exponents[variable_ordinal];
        if (exponent == 0U) continue;
        Exponents exponents = source_exponents;
        --exponents[variable_ordinal];
        fmpq_mul_ui(coefficient, source_coefficient.get(), exponent);
        add_term(result, exponents, coefficient);
    }
    fmpq_clear(coefficient);
    return result;
}

void exact_interval(arb_t target, const fmpq *lower, const fmpq *upper) {
    arb_t left, right;
    arb_init(left);
    arb_init(right);
    arb_set_fmpq(left, lower, kPrecisionBits);
    arb_set_fmpq(right, upper, kPrecisionBits);
    arb_union(target, left, right, kPrecisionBits);
    arb_clear(right);
    arb_clear(left);
}

void evaluate_horner_recursive(arb_t target, const Polynomial &polynomial,
                               const std::array<arb_struct,
                                                kPolynomialVariableCount> &boxes,
                               std::size_t variable_ordinal) {
    if (polynomial.terms.empty()) {
        arb_zero(target);
        return;
    }
    if (variable_ordinal == kPolynomialVariableCount) {
        const auto found = polynomial.terms.find(Exponents{});
        if (found == polynomial.terms.end()) arb_zero(target);
        else arb_set_fmpq(target, found->second.get(), kPrecisionBits);
        return;
    }

    std::map<unsigned int, Polynomial> grouped;
    unsigned int maximum_exponent = 0U;
    for (const auto &[source_exponents, coefficient] : polynomial.terms) {
        const unsigned int exponent = source_exponents[variable_ordinal];
        Exponents reduced = source_exponents;
        reduced[variable_ordinal] = 0U;
        add_term(grouped[exponent], reduced, coefficient.get());
        maximum_exponent = std::max(maximum_exponent, exponent);
    }

    arb_t coefficient;
    arb_init(coefficient);
    evaluate_horner_recursive(target, grouped[maximum_exponent], boxes,
                              variable_ordinal + 1U);
    for (unsigned int exponent = maximum_exponent; exponent > 0U; --exponent) {
        arb_mul(target, target, boxes.data() + variable_ordinal,
                kPrecisionBits);
        const auto found = grouped.find(exponent - 1U);
        if (found != grouped.end()) {
            evaluate_horner_recursive(coefficient, found->second, boxes,
                                      variable_ordinal + 1U);
            arb_add(target, target, coefficient, kPrecisionBits);
        }
    }
    arb_clear(coefficient);
}

void evaluate_matrix(arb_mat_t target, const PolynomialMatrix &source,
                     const std::array<arb_struct,
                                      kPolynomialVariableCount> &boxes) {
    for (slong row = 0; row < static_cast<slong>(kStateDimension); ++row) {
        for (slong column = 0; column < static_cast<slong>(kStateDimension);
             ++column) {
            evaluate_horner_recursive(arb_mat_entry(target, row, column),
                                      source[row][column], boxes, 0U);
        }
    }
}

bool exact_ldl_positive(fmpq_mat_t matrix,
                        std::array<fmpq, kStateDimension> &pivots) {
    fmpq_mat_t lower;
    fmpq_mat_init(lower, kStateDimension, kStateDimension);
    fmpq_mat_zero(lower);
    fmpq_t value, term;
    fmpq_init(value);
    fmpq_init(term);
    bool pass = true;
    for (slong row = 0; row < static_cast<slong>(kStateDimension) && pass;
         ++row) {
        fmpq_one(fmpq_mat_entry(lower, row, row));
        fmpq_set(value, fmpq_mat_entry(matrix, row, row));
        for (slong k = 0; k < row; ++k) {
            fmpq_mul(term, fmpq_mat_entry(lower, row, k),
                     fmpq_mat_entry(lower, row, k));
            fmpq_mul(term, term, pivots.data() + k);
            fmpq_sub(value, value, term);
        }
        fmpq_set(pivots.data() + row, value);
        if (fmpq_sgn(value) <= 0) {
            pass = false;
            break;
        }
        for (slong next = row + 1;
             next < static_cast<slong>(kStateDimension); ++next) {
            fmpq_set(value, fmpq_mat_entry(matrix, next, row));
            for (slong k = 0; k < row; ++k) {
                fmpq_mul(term, fmpq_mat_entry(lower, next, k),
                         fmpq_mat_entry(lower, row, k));
                fmpq_mul(term, term, pivots.data() + k);
                fmpq_sub(value, value, term);
            }
            fmpq_div(fmpq_mat_entry(lower, next, row), value,
                     pivots.data() + row);
        }
    }
    fmpq_clear(term);
    fmpq_clear(value);
    fmpq_mat_clear(lower);
    return pass;
}

bool interval_ldl_positive(const arb_mat_t matrix,
                           std::array<arb_struct, kStateDimension> &pivots) {
    arb_mat_t lower;
    arb_mat_init(lower, kStateDimension, kStateDimension);
    arb_mat_zero(lower);
    arb_t value, term;
    arb_init(value);
    arb_init(term);
    bool pass = true;
    for (slong row = 0; row < static_cast<slong>(kStateDimension) && pass;
         ++row) {
        arb_one(arb_mat_entry(lower, row, row));
        arb_set(value, arb_mat_entry(matrix, row, row));
        for (slong k = 0; k < row; ++k) {
            arb_mul(term, arb_mat_entry(lower, row, k),
                    arb_mat_entry(lower, row, k), kPrecisionBits);
            arb_mul(term, term, pivots.data() + k, kPrecisionBits);
            arb_sub(value, value, term, kPrecisionBits);
        }
        arb_set(pivots.data() + row, value);
        if (!arb_is_positive(value)) {
            pass = false;
            break;
        }
        for (slong next = row + 1;
             next < static_cast<slong>(kStateDimension); ++next) {
            arb_set(value, arb_mat_entry(matrix, next, row));
            for (slong k = 0; k < row; ++k) {
                arb_mul(term, arb_mat_entry(lower, next, k),
                        arb_mat_entry(lower, row, k), kPrecisionBits);
                arb_mul(term, term, pivots.data() + k, kPrecisionBits);
                arb_sub(value, value, term, kPrecisionBits);
            }
            arb_div(arb_mat_entry(lower, next, row), value,
                    pivots.data() + row, kPrecisionBits);
        }
    }
    arb_clear(term);
    arb_clear(value);
    arb_mat_clear(lower);
    return pass;
}

bool allowed_t0(std::size_t t0) {
    constexpr std::array<std::size_t, 13U> onsets = {
        1U, 2U, 4U, 8U, 16U, 32U, 64U,
        128U, 256U, 512U, 1024U, 2048U, 4096U,
    };
    return std::find(onsets.begin(), onsets.end(), t0) != onsets.end();
}

bool valid_box(const RationalBox &box) {
    return box.lower != nullptr && box.upper != nullptr
        && fmpq_cmp(box.lower, box.upper) <= 0;
}

void midpoint(fmpq_t target, const RationalBox &box) {
    fmpq_add(target, box.lower, box.upper);
    fmpq_div_2exp(target, target, 1U);
}

bool solve_lyapunov(fmpq_mat_t solution, const fmpq *mu,
                    const fmpq *sigma0) {
    fmpq_mat_t shifted, system, rhs, vector_solution;
    fmpq_mat_init(shifted, kStateDimension, kStateDimension);
    fmpq_mat_init(system, kStateDimension * kStateDimension,
                  kStateDimension * kStateDimension);
    fmpq_mat_init(rhs, kStateDimension * kStateDimension, 1);
    fmpq_mat_init(vector_solution, kStateDimension * kStateDimension, 1);
    fmpq_mat_zero(shifted);
    fmpq_mat_zero(system);
    fmpq_mat_zero(rhs);

    fmpq_one(fmpq_mat_entry(shifted, 0, 1));
    fmpq_t temporary;
    fmpq_init(temporary);
    fmpq_mul(temporary, mu, mu);
    fmpq_mul_si(temporary, temporary, -4);
    fmpq_set(fmpq_mat_entry(shifted, 1, 0), temporary);
    fmpq_mul_si(temporary, mu, 4);
    fmpq_set(fmpq_mat_entry(shifted, 1, 1), temporary);
    fmpq_one(fmpq_mat_entry(shifted, 2, 0));
    fmpq_one(fmpq_mat_entry(shifted, 3, 2));
    for (slong index = 0; index < static_cast<slong>(kStateDimension); ++index)
        fmpq_sub(fmpq_mat_entry(shifted, index, index),
                 fmpq_mat_entry(shifted, index, index), sigma0);

    for (slong row = 0; row < static_cast<slong>(kStateDimension); ++row) {
        for (slong column = 0; column < static_cast<slong>(kStateDimension);
             ++column) {
            const slong equation = row * kStateDimension + column;
            if (row == column)
                fmpq_set_si(fmpq_mat_entry(rhs, equation, 0), -1, 1UL);
            for (slong k = 0; k < static_cast<slong>(kStateDimension); ++k) {
                const slong first_unknown = k * kStateDimension + column;
                fmpq_add(fmpq_mat_entry(system, equation, first_unknown),
                         fmpq_mat_entry(system, equation, first_unknown),
                         fmpq_mat_entry(shifted, k, row));
                const slong second_unknown = row * kStateDimension + k;
                fmpq_add(fmpq_mat_entry(system, equation, second_unknown),
                         fmpq_mat_entry(system, equation, second_unknown),
                         fmpq_mat_entry(shifted, k, column));
            }
        }
    }
    const bool solved =
        fmpq_mat_solve_fraction_free(vector_solution, system, rhs) != 0;
    if (solved) {
        for (slong row = 0; row < static_cast<slong>(kStateDimension); ++row)
            for (slong column = 0;
                 column < static_cast<slong>(kStateDimension); ++column)
                fmpq_set(fmpq_mat_entry(solution, row, column),
                         fmpq_mat_entry(vector_solution,
                                        row * kStateDimension + column, 0));
    }
    fmpq_clear(temporary);
    fmpq_mat_clear(vector_solution);
    fmpq_mat_clear(rhs);
    fmpq_mat_clear(system);
    fmpq_mat_clear(shifted);
    return solved;
}

bool round_dyadic(fmpq_t target, const fmpq *source) {
    fmpz_t scaled, quotient, remainder, denominator, twice_remainder;
    fmpz_init(scaled);
    fmpz_init(quotient);
    fmpz_init(remainder);
    fmpz_init(denominator);
    fmpz_init(twice_remainder);
    fmpz_mul_2exp(scaled, fmpq_numref(source), kDyadicDenominatorBits);
    fmpz_set(denominator, fmpq_denref(source));
    fmpz_fdiv_qr(quotient, remainder, scaled, denominator);
    fmpz_mul_2exp(twice_remainder, remainder, 1U);
    const int comparison = fmpz_cmp(twice_remainder, denominator);
    const bool tie = comparison == 0;
    if (comparison > 0) fmpz_add_ui(quotient, quotient, 1UL);
    if (!tie) {
        fmpz_one(denominator);
        fmpz_mul_2exp(denominator, denominator, kDyadicDenominatorBits);
        fmpq_set_fmpz_frac(target, quotient, denominator);
        fmpq_canonicalise(target);
    }
    fmpz_clear(twice_remainder);
    fmpz_clear(denominator);
    fmpz_clear(remainder);
    fmpz_clear(quotient);
    fmpz_clear(scaled);
    return !tie;
}

bool symmetric(const fmpq_mat_t matrix) {
    for (slong row = 0; row < static_cast<slong>(kStateDimension); ++row)
        for (slong column = row + 1;
             column < static_cast<slong>(kStateDimension); ++column)
            if (!fmpq_equal(fmpq_mat_entry(matrix, row, column),
                            fmpq_mat_entry(matrix, column, row))) return false;
    return true;
}

bool exact_inverse_and_ep(Output &output) {
    if (!fmpq_mat_inv(output.p_inverse, output.p_lyap)) return false;
    fmpq_mat_t product, identity;
    fmpq_mat_init(product, kStateDimension, kStateDimension);
    fmpq_mat_init(identity, kStateDimension, kStateDimension);
    fmpq_mat_one(identity);
    fmpq_mat_mul(product, output.p_lyap, output.p_inverse);
    bool pass = fmpq_mat_equal(product, identity) != 0;
    arb_t diagonal_root;
    arb_init(diagonal_root);
    arb_zero(output.ep);
    for (slong index = 0; index < static_cast<slong>(kStateDimension) && pass;
         ++index) {
        const fmpq *diagonal = fmpq_mat_entry(output.p_inverse, index, index);
        if (fmpq_sgn(diagonal) <= 0) {
            pass = false;
            break;
        }
        arb_set_fmpq(diagonal_root, diagonal, kPrecisionBits);
        arb_sqrt(diagonal_root, diagonal_root, kPrecisionBits);
        if (index == 0) arb_set(output.ep, diagonal_root);
        else arb_max(output.ep, output.ep, diagonal_root, kPrecisionBits);
    }
    pass = pass && arb_is_finite(output.ep) && arb_is_positive(output.ep);
    arb_clear(diagonal_root);
    fmpq_mat_clear(identity);
    fmpq_mat_clear(product);
    return pass;
}

PolynomialMatrix zero_matrix() { return PolynomialMatrix{}; }

PolynomialMatrix gram_polynomial(const PolynomialMatrix &q,
                                 const fmpq_mat_t p) {
    PolynomialMatrix result = zero_matrix();
    for (std::size_t row = 0U; row < kStateDimension; ++row) {
        for (std::size_t column = 0U; column < kStateDimension; ++column) {
            for (std::size_t left = 0U; left < kStateDimension; ++left) {
                for (std::size_t right = 0U; right < kStateDimension; ++right) {
                    Polynomial term = multiply(q[left][row], q[right][column]);
                    term = scale(term, fmpq_mat_entry(p, left, right));
                    result[row][column] = add(result[row][column], term);
                }
            }
        }
    }
    return result;
}

PolynomialMatrix operator_candidate(const Polynomial &denominator_power,
                                    const PolynomialMatrix &gram,
                                    const fmpq_mat_t p,
                                    std::size_t exponent) {
    fmpq_t k_squared;
    fmpq_init(k_squared);
    fmpq_one(k_squared);
    fmpq_mul_2exp(k_squared, k_squared, 2U * exponent);
    PolynomialMatrix result = zero_matrix();
    for (std::size_t row = 0U; row < kStateDimension; ++row) {
        for (std::size_t column = 0U; column < kStateDimension; ++column) {
            Polynomial leading = scale(denominator_power,
                                       fmpq_mat_entry(p, row, column));
            leading = scale(leading, k_squared);
            result[row][column] = subtract(leading, gram[row][column]);
        }
    }
    fmpq_clear(k_squared);
    return result;
}

bool selector_passes(const Polynomial &denominator_power,
                     const std::vector<PolynomialMatrix> &grams,
                     const fmpq_mat_t p,
                     const std::array<arb_struct,
                                      kPolynomialVariableCount> &boxes,
                     std::size_t exponent,
                     arb_struct *stored_pivots,
                     std::size_t stored_pivot_count) {
    if (stored_pivots == nullptr
        || stored_pivot_count != grams.size() * kStateDimension) return false;
    arb_mat_t enclosure;
    arb_mat_init(enclosure, kStateDimension, kStateDimension);
    bool pass = true;
    std::size_t matrix_ordinal = 0U;
    for (const PolynomialMatrix &gram : grams) {
        const PolynomialMatrix candidate =
            operator_candidate(denominator_power, gram, p, exponent);
        evaluate_matrix(enclosure, candidate, boxes);
        std::array<arb_struct, kStateDimension> pivots;
        for (auto &pivot : pivots) arb_init(&pivot);
        const bool matrix_pass = interval_ldl_positive(enclosure, pivots);
        for (std::size_t index = 0U; index < kStateDimension; ++index)
            arb_set(stored_pivots + matrix_ordinal * kStateDimension + index,
                    pivots.data() + index);
        for (auto &pivot : pivots) arb_clear(&pivot);
        if (!matrix_pass) {
            pass = false;
            break;
        }
        ++matrix_ordinal;
    }
    arb_mat_clear(enclosure);
    return pass;
}

void reset(Output &output) {
    fmpq_mat_zero(output.p_lyap);
    fmpq_mat_zero(output.p_inverse);
    arb_zero(output.ep);
    arb_zero(output.cleared_denominator);
    for (auto &pivot : output.p_ldl_pivots) fmpq_zero(&pivot);
    for (auto &pivot : output.lmi_ldl_pivots) arb_zero(&pivot);
    for (auto &pivot : output.k1_ldl_pivots) arb_zero(&pivot);
    for (auto &pivot : output.k2_ldl_pivots) arb_zero(&pivot);
    output.k1_exponent = 0U;
    output.k2_exponent = 0U;
    fmpz_zero(output.k1);
    fmpz_zero(output.k2);
}

void fail(Result *result, FailureDetail detail) {
    *result = Result{};
    result->detail = detail;
}

}  // namespace

Output::Output() {
    fmpq_mat_init(p_lyap, kStateDimension, kStateDimension);
    fmpq_mat_init(p_inverse, kStateDimension, kStateDimension);
    arb_init(ep);
    arb_init(cleared_denominator);
    for (auto &pivot : p_ldl_pivots) fmpq_init(&pivot);
    for (auto &pivot : lmi_ldl_pivots) arb_init(&pivot);
    for (auto &pivot : k1_ldl_pivots) arb_init(&pivot);
    for (auto &pivot : k2_ldl_pivots) arb_init(&pivot);
    fmpz_init(k1);
    fmpz_init(k2);
    reset(*this);
}

Output::~Output() {
    fmpz_clear(k2);
    fmpz_clear(k1);
    for (auto &pivot : k2_ldl_pivots) arb_clear(&pivot);
    for (auto &pivot : k1_ldl_pivots) arb_clear(&pivot);
    for (auto &pivot : lmi_ldl_pivots) arb_clear(&pivot);
    for (auto &pivot : p_ldl_pivots) fmpq_clear(&pivot);
    arb_clear(cleared_denominator);
    arb_clear(ep);
    fmpq_mat_clear(p_inverse);
    fmpq_mat_clear(p_lyap);
}

bool evaluate(const Input &input, Output *output, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (!input.predecessor_c08_004_passed) {
        fail(result, FailureDetail::predecessor_not_passed);
        return false;
    }
    if (output == nullptr || input.sigma0 == nullptr) {
        fail(result, FailureDetail::missing_output_or_input);
        return false;
    }
    reset(*output);
    if (!allowed_t0(input.t0)) {
        fail(result, FailureDetail::invalid_onset);
        return false;
    }
    if ((input.chart != Chart::positive && input.chart != Chart::vacuum)
        || !valid_box(input.h0) || !valid_box(input.kappa)
        || !valid_box(input.theta2)
        || (input.chart == Chart::vacuum && input.eta == nullptr)) {
        fail(result, FailureDetail::invalid_chart_or_parameter_box);
        return false;
    }
    if (fmpq_sgn(input.kappa.lower) <= 0 || fmpq_sgn(input.sigma0) <= 0
        || (input.chart == Chart::vacuum && fmpq_sgn(input.eta) < 0)) {
        fail(result, FailureDetail::nonpositive_denominator_margin);
        return false;
    }
    if (fmpq_sgn(input.h0.lower) <= 0 || fmpq_sgn(input.theta2.lower) < 0) {
        fail(result, FailureDetail::parameter_margin_not_strict);
        return false;
    }

    fmpq_t mu_upper, expected_sigma0, gap, temporary;
    fmpq_init(mu_upper);
    fmpq_init(expected_sigma0);
    fmpq_init(gap);
    fmpq_init(temporary);
    if (input.chart == Chart::positive)
        fmpq_set(mu_upper, input.theta2.upper);
    else
        fmpq_mul(mu_upper, input.eta, input.theta2.upper);
    fmpq_set_ui(gap, 255UL, 1UL);
    fmpq_mul_si(temporary, mu_upper, 2);
    fmpq_sub(gap, gap, temporary);
    if (fmpq_sgn(gap) <= 0) {
        fmpq_clear(temporary);
        fmpq_clear(gap);
        fmpq_clear(expected_sigma0);
        fmpq_clear(mu_upper);
        fail(result, FailureDetail::parameter_margin_not_strict);
        return false;
    }
    fmpq_mul_si(expected_sigma0, mu_upper, 2);
    fmpq_set_ui(temporary, 8UL, 1UL);
    fmpq_div(gap, gap, temporary);
    fmpq_add(expected_sigma0, expected_sigma0, gap);
    const bool sigma_matches = fmpq_equal(expected_sigma0, input.sigma0) != 0;
    fmpq_clear(gap);
    fmpq_clear(temporary);
    fmpq_clear(expected_sigma0);
    fmpq_clear(mu_upper);
    if (!sigma_matches) {
        fail(result, FailureDetail::sigma0_tier_mismatch);
        return false;
    }

    fmpq_t theta_mid, mu_mid;
    fmpq_init(theta_mid);
    fmpq_init(mu_mid);
    midpoint(theta_mid, input.theta2);
    if (input.chart == Chart::positive) fmpq_set(mu_mid, theta_mid);
    else fmpq_mul(mu_mid, input.eta, theta_mid);

    fmpq_mat_t unrounded;
    fmpq_mat_init(unrounded, kStateDimension, kStateDimension);
    if (!solve_lyapunov(unrounded, mu_mid, input.sigma0)) {
        fmpq_mat_clear(unrounded);
        fmpq_clear(mu_mid);
        fmpq_clear(theta_mid);
        fail(result, FailureDetail::lyapunov_solve_failed);
        return false;
    }
    bool rounded = true;
    for (slong row = 0; row < static_cast<slong>(kStateDimension) && rounded;
         ++row) {
        for (slong column = 0;
             column < static_cast<slong>(kStateDimension); ++column) {
            if (!round_dyadic(fmpq_mat_entry(output->p_lyap, row, column),
                              fmpq_mat_entry(unrounded, row, column))) {
                rounded = false;
                break;
            }
        }
    }
    fmpq_mat_clear(unrounded);
    fmpq_clear(mu_mid);
    fmpq_clear(theta_mid);
    if (!rounded) {
        fail(result, FailureDetail::dyadic_rounding_tie);
        return false;
    }
    if (!symmetric(output->p_lyap)) {
        fail(result, FailureDetail::lyapunov_not_symmetric);
        return false;
    }
    if (!exact_ldl_positive(output->p_lyap, output->p_ldl_pivots)) {
        fail(result, FailureDetail::lyapunov_not_positive_definite);
        return false;
    }
    if (!exact_inverse_and_ep(*output)) {
        fail(result, FailureDetail::inverse_or_component_bound_failed);
        return false;
    }

    const Polynomial u = variable(0U);
    const Polynomial h0 = variable(1U);
    const Polynomial kappa = variable(2U);
    const Polynomial theta2 = variable(3U);
    (void)h0;
    Polynomial mu = theta2;
    if (input.chart == Chart::vacuum) mu = scale(theta2, input.eta);
    const Polynomial one = signed_integer(1);
    const Polynomial two = signed_integer(2);
    const Polynomial four = signed_integer(4);
    const Polynomial eight = signed_integer(8);
    const Polynomial k2 = power(kappa, 2U);
    const Polynomial k3 = power(kappa, 3U);
    const Polynomial k4 = power(kappa, 4U);
    const Polynomial mu2 = power(mu, 2U);
    const Polynomial u2 = power(u, 2U);
    const Polynomial denominator = multiply(k2,
        add(one, multiply(two, multiply(kappa, u))));

    Polynomial q0u2 = add(
        add(negate(multiply(eight, multiply(mu, multiply(k4, u2)))),
            negate(multiply(eight, multiply(mu, multiply(k3, u))))),
        add(multiply(four, multiply(mu, k2)),
            add(multiply(four, multiply(mu, multiply(k2, u2))),
                add(multiply(eight, multiply(mu, multiply(kappa, u))),
                    add(multiply(mu, u2),
                        add(negate(multiply(two, multiply(k2, u))),
                            negate(multiply(kappa, u2))))))));
    const Polynomial r0 = negate(multiply(mu, q0u2));

    const Polynomial q1u2 = add(
        multiply(two, multiply(mu, multiply(k2, u))),
        add(multiply(two, multiply(mu, kappa)),
            add(multiply(mu, u),
                add(negate(multiply(k2, u2)),
                    negate(multiply(kappa, u))))));
    const Polynomial r1 = multiply(two, multiply(kappa, q1u2));

    const Polynomial c1 = add(
        add(multiply(four, multiply(mu, k2)), negate(multiply(two, mu))),
        negate(kappa));
    const Polynomial r2 = negate(multiply(two,
        multiply(mu2, multiply(c1,
            add(multiply(two, multiply(kappa, u)), u2)))));

    const Polynomial c2 = add(
        add(multiply(two, multiply(mu, k2)), negate(mu)), negate(kappa));
    const Polynomial r3 = negate(multiply(four,
        multiply(mu2, multiply(power(c2, 2U), u2))));
    const std::array<Polynomial, kStateDimension> row_numerators = {
        r0, r1, r2, r3,
    };

    PolynomialMatrix denominator_times_a = zero_matrix();
    denominator_times_a[0][1] = denominator;
    for (std::size_t column = 0U; column < kStateDimension; ++column)
        denominator_times_a[1][column] = row_numerators[column];
    denominator_times_a[2][0] = denominator;
    denominator_times_a[3][2] = denominator;

    PolynomialMatrix negative_lmi = zero_matrix();
    for (std::size_t row = 0U; row < kStateDimension; ++row) {
        for (std::size_t column = 0U; column < kStateDimension; ++column) {
            Polynomial entry;
            for (std::size_t k = 0U; k < kStateDimension; ++k) {
                entry = add(entry, scale(denominator_times_a[k][row],
                                         fmpq_mat_entry(output->p_lyap, k,
                                                        column)));
                entry = add(entry, scale(denominator_times_a[k][column],
                                         fmpq_mat_entry(output->p_lyap, row,
                                                        k)));
            }
            fmpq_t factor;
            fmpq_init(factor);
            fmpq_mul_si(factor, input.sigma0, -2);
            Polynomial correction = scale(denominator,
                fmpq_mat_entry(output->p_lyap, row, column));
            correction = scale(correction, factor);
            entry = add(entry, correction);
            fmpq_clear(factor);
            negative_lmi[row][column] = negate(entry);
        }
    }

    std::array<arb_struct, kPolynomialVariableCount> boxes;
    for (auto &box : boxes) arb_init(&box);
    fmpq_t zero, inverse_t0;
    fmpq_init(zero);
    fmpq_init(inverse_t0);
    fmpq_zero(zero);
    fmpq_set_ui(inverse_t0, 1UL, input.t0);
    exact_interval(boxes.data() + 0, zero, inverse_t0);
    exact_interval(boxes.data() + 1, input.h0.lower, input.h0.upper);
    exact_interval(boxes.data() + 2, input.kappa.lower, input.kappa.upper);
    exact_interval(boxes.data() + 3, input.theta2.lower, input.theta2.upper);
    fmpq_clear(inverse_t0);
    fmpq_clear(zero);

    evaluate_horner_recursive(output->cleared_denominator, denominator,
                              boxes, 0U);
    if (!arb_is_positive(output->cleared_denominator)) {
        for (auto &box : boxes) arb_clear(&box);
        fail(result, FailureDetail::nonpositive_denominator_margin);
        return false;
    }

    arb_mat_t enclosure;
    arb_mat_init(enclosure, kStateDimension, kStateDimension);
    evaluate_matrix(enclosure, negative_lmi, boxes);
    if (!interval_ldl_positive(enclosure, output->lmi_ldl_pivots)) {
        arb_mat_clear(enclosure);
        for (auto &box : boxes) arb_clear(&box);
        fail(result, FailureDetail::compact_box_lmi_failed);
        return false;
    }
    arb_mat_clear(enclosure);

    constexpr std::array<std::size_t, kParameterDimension> parameter_variables =
        {1U, 2U, 3U};
    std::vector<PolynomialMatrix> first_grams;
    std::vector<PolynomialMatrix> second_grams;
    for (const std::size_t first_variable : parameter_variables) {
        PolynomialMatrix first_numerator = zero_matrix();
        for (std::size_t column = 0U; column < kStateDimension; ++column) {
            const Polynomial numerator = subtract(
                multiply(derivative(row_numerators[column], first_variable),
                         denominator),
                multiply(row_numerators[column],
                         derivative(denominator, first_variable)));
            first_numerator[1][column] = numerator;
        }
        first_grams.push_back(gram_polynomial(first_numerator,
                                              output->p_lyap));

        for (const std::size_t second_variable : parameter_variables) {
            PolynomialMatrix second_numerator = zero_matrix();
            for (std::size_t column = 0U; column < kStateDimension; ++column) {
                const Polynomial qa = first_numerator[1][column];
                const Polynomial qa_derivative =
                    derivative(qa, second_variable);
                second_numerator[1][column] = subtract(
                    multiply(qa_derivative, denominator),
                    multiply(two, multiply(qa,
                        derivative(denominator, second_variable))));
            }
            second_grams.push_back(gram_polynomial(second_numerator,
                                                   output->p_lyap));
        }
    }

    const Polynomial d4 = power(denominator, 4U);
    const Polynomial d6 = power(denominator, 6U);
    bool k1_found = false;
    for (std::size_t exponent = 0U; exponent <= kKSelectorMaximumExponent;
         ++exponent) {
        ++result->k1_candidates_tested;
        if (selector_passes(d4, first_grams, output->p_lyap, boxes, exponent,
                            output->k1_ldl_pivots.data(),
                            output->k1_ldl_pivots.size())) {
            output->k1_exponent = exponent;
            fmpz_one(output->k1);
            fmpz_mul_2exp(output->k1, output->k1, exponent);
            k1_found = true;
            break;
        }
    }
    if (!k1_found) {
        for (auto &box : boxes) arb_clear(&box);
        fail(result, FailureDetail::k1_selector_exhausted);
        return false;
    }
    bool k2_found = false;
    for (std::size_t exponent = 0U; exponent <= kKSelectorMaximumExponent;
         ++exponent) {
        ++result->k2_candidates_tested;
        if (selector_passes(d6, second_grams, output->p_lyap, boxes, exponent,
                            output->k2_ldl_pivots.data(),
                            output->k2_ldl_pivots.size())) {
            output->k2_exponent = exponent;
            fmpz_one(output->k2);
            fmpz_mul_2exp(output->k2, output->k2, exponent);
            k2_found = true;
            break;
        }
    }
    for (auto &box : boxes) arb_clear(&box);
    if (!k2_found) {
        fail(result, FailureDetail::k2_selector_exhausted);
        return false;
    }

    result->accepted = true;
    result->detail = FailureDetail::none;
    result->compact_variables = kPolynomialVariableCount;
    result->lmi_matrices_verified = 1U;
    result->first_derivative_matrices_verified = kParameterDimension;
    result->ordered_second_derivative_matrices_verified =
        kParameterDimension * kParameterDimension;
    result->fixed_variable_order_u_h0_kappa_theta2 = true;
    result->subdivision_used = false;
    result->point_sampling_used = false;
    result->exact_inverse_verified = true;
    result->dyadic_denominator_bound = true;
    return true;
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::predecessor_not_passed:
        return "C08-011B_PREDECESSOR_NOT_PASSED";
    case FailureDetail::missing_output_or_input:
        return "C08-011B_MISSING_OUTPUT_OR_INPUT";
    case FailureDetail::invalid_onset: return "C08-011B_INVALID_ONSET";
    case FailureDetail::invalid_chart_or_parameter_box:
        return "C08-011B_INVALID_CHART_OR_PARAMETER_BOX";
    case FailureDetail::nonpositive_denominator_margin:
        return "C08-011B_NONPOSITIVE_DENOMINATOR_MARGIN";
    case FailureDetail::parameter_margin_not_strict:
        return "C08-011B_PARAMETER_MARGIN_NOT_STRICT";
    case FailureDetail::sigma0_tier_mismatch:
        return "C08-011B_SIGMA0_TIER_MISMATCH";
    case FailureDetail::lyapunov_solve_failed:
        return "C08-011B_LYAPUNOV_SOLVE_FAILED";
    case FailureDetail::dyadic_rounding_tie:
        return "C08-011B_DYADIC_ROUNDING_TIE";
    case FailureDetail::lyapunov_not_symmetric:
        return "C08-011B_LYAPUNOV_NOT_SYMMETRIC";
    case FailureDetail::lyapunov_not_positive_definite:
        return "C08-011B_LYAPUNOV_NOT_POSITIVE_DEFINITE";
    case FailureDetail::inverse_or_component_bound_failed:
        return "C08-011B_INVERSE_OR_COMPONENT_BOUND_FAILED";
    case FailureDetail::compact_box_lmi_failed:
        return "C08-011B_COMPACT_BOX_LMI_FAILED";
    case FailureDetail::k1_selector_exhausted:
        return "C08-011B_K1_SELECTOR_EXHAUSTED";
    case FailureDetail::k2_selector_exhausted:
        return "C08-011B_K2_SELECTOR_EXHAUSTED";
    }
    return "C08-011B_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_tail_lyapunov_v1
