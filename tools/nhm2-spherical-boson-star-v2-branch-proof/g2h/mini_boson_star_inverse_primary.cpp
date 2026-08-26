#include "mini_boson_star_inverse_primary.hpp"

#include "mini_boson_star_arithmetic_primary.hpp"

#include <arf.h>
#include <flint/fmpz_mat.h>

#include <array>
#include <vector>

namespace nhm2::g2h_e_s4::primary_inverse {
namespace {

bool valid_square_dimensions(const arb_mat_t matrix, const arb_mat_t output) {
    const slong dimension = arb_mat_nrows(matrix);
    return dimension > 0 && dimension <= maximum_dimension
        && arb_mat_ncols(matrix) == dimension
        && arb_mat_nrows(output) == dimension && arb_mat_ncols(output) == dimension;
}

void swap_columns(arb_mat_t matrix, const slong left, const slong right) {
    if (left == right) { return; }
    for (slong row = 0; row < arb_mat_nrows(matrix); ++row) {
        arb_swap(arb_mat_entry(matrix, row, left), arb_mat_entry(matrix, row, right));
    }
}

bool best_pivot(const arb_mat_t lu, const slong start, slong *row, slong *column) {
    arf_t best, candidate;
    arf_init(best);
    arf_init(candidate);
    arf_zero(best);
    bool found = false;
    for (slong i = start; i < arb_mat_nrows(lu); ++i) {
        for (slong j = start; j < arb_mat_ncols(lu); ++j) {
            arb_get_abs_lbound_arf(candidate, arb_mat_entry(lu, i, j),
                primary_arithmetic::precision_bits);
            if (arf_sgn(candidate) > 0 && (!found || arf_cmp(candidate, best) > 0)) {
                arf_set(best, candidate);
                *row = i;
                *column = j;
                found = true;
            }
        }
    }
    arf_clear(candidate);
    arf_clear(best);
    return found;
}

bool factor_complete_pivot(arb_mat_t lu, std::vector<slong> *row_permutation,
    std::vector<slong> *column_permutation, long *first_pivot_original_ordinal) {
    const slong dimension = arb_mat_nrows(lu);
    row_permutation->resize(static_cast<std::size_t>(dimension));
    column_permutation->resize(static_cast<std::size_t>(dimension));
    for (slong index = 0; index < dimension; ++index) {
        (*row_permutation)[static_cast<std::size_t>(index)] = index;
        (*column_permutation)[static_cast<std::size_t>(index)] = index;
    }
    arb_t product;
    arb_init(product);
    for (slong k = 0; k < dimension; ++k) {
        slong pivot_row = -1, pivot_column = -1;
        if (!best_pivot(lu, k, &pivot_row, &pivot_column)) {
            arb_clear(product);
            return false;
        }
        if (k == 0 && first_pivot_original_ordinal != nullptr) {
            *first_pivot_original_ordinal =
                (*row_permutation)[static_cast<std::size_t>(pivot_row)] * dimension
                + (*column_permutation)[static_cast<std::size_t>(pivot_column)];
        }
        arb_mat_swap_rows(lu, nullptr, k, pivot_row);
        std::swap((*row_permutation)[static_cast<std::size_t>(k)],
            (*row_permutation)[static_cast<std::size_t>(pivot_row)]);
        swap_columns(lu, k, pivot_column);
        std::swap((*column_permutation)[static_cast<std::size_t>(k)],
            (*column_permutation)[static_cast<std::size_t>(pivot_column)]);
        if (arb_contains_zero(arb_mat_entry(lu, k, k))) {
            arb_clear(product);
            return false;
        }
        for (slong i = k + 1; i < dimension; ++i) {
            if (!primary_arithmetic::divide(arb_mat_entry(lu, i, k),
                    arb_mat_entry(lu, i, k), arb_mat_entry(lu, k, k))) {
                arb_clear(product);
                return false;
            }
            for (slong j = k + 1; j < dimension; ++j) {
                primary_arithmetic::multiply(product, arb_mat_entry(lu, i, k),
                    arb_mat_entry(lu, k, j));
                primary_arithmetic::subtract(arb_mat_entry(lu, i, j),
                    arb_mat_entry(lu, i, j), product);
            }
        }
    }
    arb_clear(product);
    return true;
}

bool solve_column(arb_mat_t inverse, const arb_mat_t lu,
    const std::vector<slong> &row_permutation,
    const std::vector<slong> &column_permutation, const slong original_column) {
    const slong dimension = arb_mat_nrows(lu);
    std::vector<arb_struct> forward(static_cast<std::size_t>(dimension));
    std::vector<arb_struct> backward(static_cast<std::size_t>(dimension));
    for (slong i = 0; i < dimension; ++i) {
        arb_init(&forward[static_cast<std::size_t>(i)]);
        arb_init(&backward[static_cast<std::size_t>(i)]);
    }
    arb_t term, sum;
    arb_init(term);
    arb_init(sum);
    bool pass = true;
    for (slong i = 0; i < dimension; ++i) {
        arb_set_si(sum, row_permutation[static_cast<std::size_t>(i)] == original_column ? 1 : 0);
        for (slong j = 0; j < i; ++j) {
            primary_arithmetic::multiply(term, arb_mat_entry(lu, i, j),
                &forward[static_cast<std::size_t>(j)]);
            primary_arithmetic::subtract(sum, sum, term);
        }
        arb_set(&forward[static_cast<std::size_t>(i)], sum);
    }
    for (slong i = dimension; i-- > 0;) {
        arb_set(sum, &forward[static_cast<std::size_t>(i)]);
        for (slong j = i + 1; j < dimension; ++j) {
            primary_arithmetic::multiply(term, arb_mat_entry(lu, i, j),
                &backward[static_cast<std::size_t>(j)]);
            primary_arithmetic::subtract(sum, sum, term);
        }
        pass = pass && primary_arithmetic::divide(
            &backward[static_cast<std::size_t>(i)], sum, arb_mat_entry(lu, i, i));
        if (!pass) { break; }
    }
    if (pass) {
        for (slong i = 0; i < dimension; ++i) {
            arb_set(arb_mat_entry(inverse,
                column_permutation[static_cast<std::size_t>(i)], original_column),
                &backward[static_cast<std::size_t>(i)]);
        }
    }
    arb_clear(sum);
    arb_clear(term);
    for (slong i = 0; i < dimension; ++i) {
        arb_clear(&backward[static_cast<std::size_t>(i)]);
        arb_clear(&forward[static_cast<std::size_t>(i)]);
    }
    return pass;
}

bool dyadic_integer_matrix(fmpz_mat_t integer_matrix, const fmpq_mat_t dyadic) {
    const slong dimension = fmpq_mat_nrows(dyadic);
    fmpz_t lattice_denominator, quotient, remainder;
    fmpz_init(lattice_denominator);
    fmpz_init(quotient);
    fmpz_init(remainder);
    fmpz_one(lattice_denominator);
    fmpz_mul_2exp(lattice_denominator, lattice_denominator, 448UL);
    bool pass = true;
    for (slong row = 0; row < dimension && pass; ++row) {
        for (slong column = 0; column < dimension; ++column) {
            const fmpq *entry = fmpq_mat_entry(dyadic, row, column);
            fmpz_fdiv_qr(quotient, remainder, lattice_denominator, fmpq_denref(entry));
            if (!fmpz_is_zero(remainder)) { pass = false; break; }
            fmpz_mul(fmpz_mat_entry(integer_matrix, row, column),
                fmpq_numref(entry), quotient);
        }
    }
    fmpz_clear(remainder);
    fmpz_clear(quotient);
    fmpz_clear(lattice_denominator);
    return pass;
}

bool bareiss_integer(fmpz_t determinant, fmpz_mat_t matrix) {
    const slong dimension = fmpz_mat_nrows(matrix);
    if (dimension == 1) {
        fmpz_set(determinant, fmpz_mat_entry(matrix, 0, 0));
        return true;
    }
    fmpz_t previous, numerator, left, right;
    fmpz_init(previous); fmpz_one(previous);
    fmpz_init(numerator); fmpz_init(left); fmpz_init(right);
    int sign = 1;
    bool pass = true;
    for (slong k = 0; k < dimension - 1; ++k) {
        slong pivot_row = k;
        while (pivot_row < dimension && fmpz_is_zero(fmpz_mat_entry(matrix, pivot_row, k))) {
            ++pivot_row;
        }
        if (pivot_row == dimension) {
            fmpz_zero(determinant);
            pass = true;
            goto cleanup;
        }
        if (pivot_row != k) {
            fmpz_mat_swap_rows(matrix, nullptr, pivot_row, k);
            sign = -sign;
        }
        for (slong i = k + 1; i < dimension; ++i) {
            for (slong j = k + 1; j < dimension; ++j) {
                fmpz_mul(left, fmpz_mat_entry(matrix, k, k), fmpz_mat_entry(matrix, i, j));
                fmpz_mul(right, fmpz_mat_entry(matrix, i, k), fmpz_mat_entry(matrix, k, j));
                fmpz_sub(numerator, left, right);
                if (!fmpz_divisible(numerator, previous)) { pass = false; goto cleanup; }
                fmpz_divexact(fmpz_mat_entry(matrix, i, j), numerator, previous);
            }
        }
        fmpz_set(previous, fmpz_mat_entry(matrix, k, k));
    }
    fmpz_set(determinant, fmpz_mat_entry(matrix, dimension - 1, dimension - 1));
    if (sign < 0) { fmpz_neg(determinant, determinant); }
cleanup:
    fmpz_clear(right); fmpz_clear(left); fmpz_clear(numerator); fmpz_clear(previous);
    return pass;
}

bool matrix_contains_si(const arb_mat_t matrix, const slong row, const slong column,
    const slong value) {
    return arb_contains_si(arb_mat_entry(matrix, row, column), value) != 0;
}

bool inverse_and_projection_fixture() {
    arb_mat_t matrix, inverse, errors;
    arb_mat_init(matrix, 2, 2); arb_mat_init(inverse, 2, 2); arb_mat_init(errors, 2, 2);
    arb_set_si(arb_mat_entry(matrix, 0, 0), 2);
    arb_set_si(arb_mat_entry(matrix, 0, 1), 1);
    arb_set_si(arb_mat_entry(matrix, 1, 0), 1);
    arb_set_si(arb_mat_entry(matrix, 1, 1), 1);
    long first = -1;
    bool pass = complete_pivot_inverse(inverse, matrix, &first)
        && first == 0
        && matrix_contains_si(inverse, 0, 0, 1)
        && matrix_contains_si(inverse, 0, 1, -1)
        && matrix_contains_si(inverse, 1, 0, -1)
        && matrix_contains_si(inverse, 1, 1, 2);
    fmpq_mat_t projected;
    fmpq_mat_init(projected, 2, 2);
    pass = pass && project_matrix(projected, errors, inverse);
    fmpz_t determinant;
    fmpz_init(determinant);
    pass = pass && bareiss_determinant(determinant, projected) && !fmpz_is_zero(determinant);
    arb_t z0;
    arb_init(z0);
    pass = pass && finite_z0_row_sum(z0, inverse, matrix)
        && arb_contains_zero(z0) && arb_is_zero(z0);
    arb_clear(z0); fmpz_clear(determinant); fmpq_mat_clear(projected);
    arb_mat_clear(errors); arb_mat_clear(inverse); arb_mat_clear(matrix);
    return pass;
}

bool tie_pivot_fixture() {
    arb_mat_t matrix, inverse;
    arb_mat_init(matrix, 2, 2); arb_mat_init(inverse, 2, 2);
    arb_zero(arb_mat_entry(matrix, 0, 0)); arb_one(arb_mat_entry(matrix, 0, 1));
    arb_one(arb_mat_entry(matrix, 1, 0)); arb_zero(arb_mat_entry(matrix, 1, 1));
    long first = -1;
    const bool pass = complete_pivot_inverse(inverse, matrix, &first) && first == 1;
    arb_mat_clear(inverse); arb_mat_clear(matrix);
    return pass;
}

bool singular_and_zero_pivot_fixture() {
    arb_mat_t matrix, inverse;
    arb_mat_init(matrix, 2, 2); arb_mat_init(inverse, 2, 2);
    for (slong column = 0; column < 2; ++column) {
        arb_one(arb_mat_entry(matrix, 0, column));
        arb_one(arb_mat_entry(matrix, 1, column));
    }
    bool pass = !complete_pivot_inverse(inverse, matrix, nullptr);
    arb_zero(arb_mat_entry(matrix, 0, 0));
    arb_add_error_2exp_si(arb_mat_entry(matrix, 0, 0), -20);
    arb_zero(arb_mat_entry(matrix, 0, 1)); arb_zero(arb_mat_entry(matrix, 1, 0));
    arb_one(arb_mat_entry(matrix, 1, 1));
    pass = pass && !complete_pivot_inverse(inverse, matrix, nullptr);
    arb_mat_clear(inverse); arb_mat_clear(matrix);
    return pass;
}

bool singular_bareiss_fixture() {
    fmpq_mat_t matrix;
    fmpq_mat_init(matrix, 2, 2);
    for (slong row = 0; row < 2; ++row) {
        fmpq_set_si(fmpq_mat_entry(matrix, row, 0), 1, 1);
        fmpq_set_si(fmpq_mat_entry(matrix, row, 1), 1, 1);
    }
    fmpz_t determinant; fmpz_init(determinant);
    const bool pass = bareiss_determinant(determinant, matrix) && fmpz_is_zero(determinant);
    fmpz_clear(determinant); fmpq_mat_clear(matrix);
    return pass;
}

std::array<bool, 5> fixture_results() {
    return {
        maximum_dimension == 2050,
        inverse_and_projection_fixture(),
        tie_pivot_fixture(),
        singular_and_zero_pivot_fixture(),
        singular_bareiss_fixture(),
    };
}

} // namespace

bool complete_pivot_inverse(arb_mat_t inverse, const arb_mat_t matrix,
    long *first_pivot_original_ordinal) {
    if (!valid_square_dimensions(matrix, inverse)) { return false; }
    arb_mat_t lu;
    arb_mat_init(lu, arb_mat_nrows(matrix), arb_mat_ncols(matrix));
    arb_mat_set(lu, matrix);
    std::vector<slong> row_permutation, column_permutation;
    bool pass = factor_complete_pivot(lu, &row_permutation, &column_permutation,
        first_pivot_original_ordinal);
    for (slong column = 0; pass && column < arb_mat_nrows(matrix); ++column) {
        pass = solve_column(inverse, lu, row_permutation, column_permutation, column);
    }
    arb_mat_clear(lu);
    return pass;
}

bool project_matrix(fmpq_mat_t dyadic, arb_mat_t projection_errors,
    const arb_mat_t input) {
    const slong rows = arb_mat_nrows(input), columns = arb_mat_ncols(input);
    if (fmpq_mat_nrows(dyadic) != rows || fmpq_mat_ncols(dyadic) != columns
        || arb_mat_nrows(projection_errors) != rows
        || arb_mat_ncols(projection_errors) != columns) { return false; }
    fmpz_t lattice_n;
    fmpz_init(lattice_n);
    fmpz_t denominator;
    fmpz_init(denominator); fmpz_one(denominator); fmpz_mul_2exp(denominator, denominator, 448UL);
    bool pass = true;
    for (slong row = 0; row < rows && pass; ++row) {
        for (slong column = 0; column < columns; ++column) {
            pass = primary_arithmetic::project_midpoint_2m448(
                arb_mat_entry(input, row, column), lattice_n,
                arb_mat_entry(projection_errors, row, column));
            if (!pass) { break; }
            fmpz_set(fmpq_numref(fmpq_mat_entry(dyadic, row, column)), lattice_n);
            fmpz_set(fmpq_denref(fmpq_mat_entry(dyadic, row, column)), denominator);
            fmpq_canonicalise(fmpq_mat_entry(dyadic, row, column));
        }
    }
    fmpz_clear(denominator); fmpz_clear(lattice_n);
    return pass;
}

bool bareiss_determinant(fmpz_t determinant, const fmpq_mat_t dyadic) {
    const slong dimension = fmpq_mat_nrows(dyadic);
    if (dimension <= 0 || dimension > maximum_dimension
        || fmpq_mat_ncols(dyadic) != dimension) { return false; }
    fmpz_mat_t integer_matrix;
    fmpz_mat_init(integer_matrix, dimension, dimension);
    bool pass = dyadic_integer_matrix(integer_matrix, dyadic)
        && bareiss_integer(determinant, integer_matrix);
    fmpz_mat_clear(integer_matrix);
    return pass;
}

bool finite_z0_row_sum(arb_t z0, const arb_mat_t approximate_inverse,
    const arb_mat_t jacobian) {
    const slong dimension = arb_mat_nrows(jacobian);
    if (!valid_square_dimensions(jacobian, approximate_inverse)) { return false; }
    arb_mat_t product;
    arb_mat_init(product, dimension, dimension);
    arb_mat_mul(product, approximate_inverse, jacobian,
        primary_arithmetic::precision_bits);
    arb_t row_sum, absolute, difference;
    arb_init(row_sum); arb_init(absolute); arb_init(difference);
    arb_zero(z0);
    for (slong row = 0; row < dimension; ++row) {
        arb_zero(row_sum);
        for (slong column = 0; column < dimension; ++column) {
            arb_set(difference, arb_mat_entry(product, row, column));
            if (row == column) { arb_sub_ui(difference, difference, 1UL, primary_arithmetic::precision_bits); }
            arb_abs(absolute, difference);
            primary_arithmetic::add(row_sum, row_sum, absolute);
        }
        arb_union(z0, z0, row_sum, primary_arithmetic::precision_bits);
    }
    arb_clear(difference); arb_clear(absolute); arb_clear(row_sum); arb_mat_clear(product);
    return arb_is_finite(z0) != 0;
}

std::size_t fixture_count() { return 5U; }

std::size_t fixtures_passed() {
    const auto checks = fixture_results();
    std::size_t passed = 0;
    for (const bool value : checks) { passed += value ? 1U : 0U; }
    return passed;
}

bool run_inverse_fixture_suite() { return fixtures_passed() == fixture_count(); }

} // namespace nhm2::g2h_e_s4::primary_inverse
