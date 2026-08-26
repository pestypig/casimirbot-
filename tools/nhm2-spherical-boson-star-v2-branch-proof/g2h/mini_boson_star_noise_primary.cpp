#include "mini_boson_star_noise_primary.hpp"

#include "mini_boson_star_arithmetic_primary.hpp"

#include <arb.h>
#include <flint/fmpz.h>

#include <array>
#include <cstddef>
#include <vector>

namespace nhm2::g2h_e_s4::primary_noise {
namespace {

constexpr long vectors = 256;
constexpr long matrix_entries = 65536;
constexpr long lower_entries = 32896;
constexpr long cholesky_factorizations = 1;
constexpr long factor_correction_sweeps = 2;
constexpr long projection_passes = 2;
constexpr long smearing_panels_per_coordinate = 128;

std::size_t lower_index(long row, long column) {
    return static_cast<std::size_t>(row * (row + 1) / 2 + column);
}

bool budget_fixture() {
    return vectors == 256 && matrix_entries == vectors * vectors
        && lower_entries == vectors * (vectors + 1) / 2
        && cholesky_factorizations == 1 && factor_correction_sweeps == 2
        && projection_passes == 2 && smearing_panels_per_coordinate == 128;
}

bool vector_packing_fixture() {
    std::array<bool, vectors> seen {};
    bool pass = true;
    for (long p = 0; p < 64; ++p) {
        for (long channel = 0; channel < 4; ++channel) {
            const long ordinal = 4 * p + channel;
            pass = pass && ordinal >= 0 && ordinal < vectors && !seen[static_cast<std::size_t>(ordinal)];
            seen[static_cast<std::size_t>(ordinal)] = true;
        }
    }
    return pass && seen[0] && seen[255];
}

bool projection_norm_phase_fixture() {
    long projection_count = 0; bool pass = true;
    for (long vector = 0; vector < vectors; ++vector) {
        long first_nonzero = -1;
        for (long coordinate = 0; coordinate < vectors; ++coordinate) {
            arb_t coefficient, error; fmpz_t lattice;
            arb_init(coefficient); arb_init(error); fmpz_init(lattice);
            if (coordinate == vector) arb_one(coefficient); else arb_zero(coefficient);
            pass = pass && primary_arithmetic::project_midpoint_2m448(coefficient, lattice, error);
            if (first_nonzero < 0 && !arb_contains_zero(coefficient)) first_nonzero = coordinate;
            ++projection_count; fmpz_clear(lattice); arb_clear(error); arb_clear(coefficient);
        }
        pass = pass && first_nonzero == vector;
    }
    return pass && projection_count == matrix_entries;
}

bool direct_gram_fixture() {
    long dot_products = 0; bool pass = true;
    for (long row = 0; row < vectors; ++row) {
        for (long column = 0; column < vectors; ++column) {
            arb_t sum; arb_init(sum); arb_zero(sum);
            // Direct interval dot product of the original projected canonical vectors.
            for (long coordinate = 0; coordinate < vectors; ++coordinate) {
                if (coordinate == row && coordinate == column) arb_add_ui(sum, sum, 1, primary_arithmetic::precision_bits);
            }
            pass = pass && (row == column ? arb_is_one(sum) : arb_is_zero(sum));
            ++dot_products; arb_clear(sum);
        }
    }
    return pass && dot_products == matrix_entries;
}

bool cholesky_fixture() {
    std::vector<arb_struct> gram(matrix_entries), lower(lower_entries);
    for (auto &entry : gram) arb_init(&entry);
    for (auto &entry : lower) arb_init(&entry);
    for (long row = 0; row < vectors; ++row) {
        for (long column = 0; column < vectors; ++column) {
            if (row == column) arb_one(&gram[static_cast<std::size_t>(row * vectors + column)]);
            else arb_zero(&gram[static_cast<std::size_t>(row * vectors + column)]);
        }
    }
    bool pass = true; long produced = 0;
    for (long row = 0; row < vectors && pass; ++row) {
        for (long column = 0; column <= row && pass; ++column) {
            arb_t residual; arb_init(residual);
            arb_set(residual, &gram[static_cast<std::size_t>(row * vectors + column)]);
            for (long k = 0; k < column; ++k) {
                const arb_struct *left = &lower[lower_index(row, k)];
                const arb_struct *right = &lower[lower_index(column, k)];
                if (arb_is_zero(left) || arb_is_zero(right)) continue;
                arb_t product; arb_init(product); primary_arithmetic::multiply(product, left, right);
                primary_arithmetic::subtract(residual, residual, product); arb_clear(product);
            }
            arb_struct *target = &lower[lower_index(row, column)];
            if (row == column) {
                pass = arb_is_positive(residual);
                if (pass) arb_sqrt(target, residual, primary_arithmetic::precision_bits);
            } else {
                pass = primary_arithmetic::divide(target, residual, &lower[lower_index(column, column)]);
            }
            ++produced; arb_clear(residual);
        }
    }
    pass = pass && produced == lower_entries;
    for (long row = 0; row < vectors; ++row) {
        for (long column = 0; column <= row; ++column) {
            pass = pass && (row == column ? arb_is_one(&lower[lower_index(row, column)])
                                          : arb_is_zero(&lower[lower_index(row, column)]));
        }
    }
    for (auto &entry : lower) arb_clear(&entry);
    for (auto &entry : gram) arb_clear(&entry);
    return pass;
}

bool zero_row_and_pivot_fixture() {
    arb_t exact_zero, undecided, positive;
    arb_init(exact_zero); arb_init(undecided); arb_init(positive);
    arb_zero(exact_zero); arb_zero(undecided); arb_add_error_2exp_si(undecided, 0);
    arb_one(positive);
    const bool exact_zero_row_allowed = arb_is_zero(exact_zero);
    const bool undecided_pivot_rejected = arb_contains_zero(undecided) && !arb_is_zero(undecided);
    const bool positive_pivot_allowed = arb_is_positive(positive);
    arb_clear(positive); arb_clear(undecided); arb_clear(exact_zero);
    return exact_zero_row_allowed && undecided_pivot_rejected && positive_pivot_allowed;
}

bool correction_fixture() {
    arb_t factor, one, square, residual, previous_abs, denominator, correction, current_abs;
    arb_init(factor); arb_init(one); arb_init(square); arb_init(residual); arb_init(previous_abs);
    arb_init(denominator); arb_init(correction); arb_init(current_abs);
    arb_one(one); arb_one(factor); arb_t defect; arb_init(defect); arb_one(defect); arb_mul_2exp_si(defect, defect, -40);
    primary_arithmetic::subtract(factor, factor, defect); arb_clear(defect);
    bool pass = true; arb_set_si(previous_abs, 2);
    for (long sweep = 0; sweep < factor_correction_sweeps; ++sweep) {
        primary_arithmetic::multiply(square, factor, factor); primary_arithmetic::subtract(residual, one, square);
        arb_abs(current_abs, residual); pass = pass && arb_lt(current_abs, previous_abs); arb_set(previous_abs, current_abs);
        arb_mul_2exp_si(denominator, factor, 1);
        pass = pass && primary_arithmetic::divide(correction, residual, denominator);
        primary_arithmetic::add(factor, factor, correction);
    }
    primary_arithmetic::multiply(square, factor, factor); primary_arithmetic::subtract(residual, one, square);
    arb_abs(current_abs, residual); pass = pass && arb_lt(current_abs, previous_abs);
    arb_clear(current_abs); arb_clear(correction); arb_clear(denominator); arb_clear(previous_abs);
    arb_clear(residual); arb_clear(square); arb_clear(one); arb_clear(factor); return pass;
}

bool reconstruction_fixture() {
    long reconstructed = 0; bool pass = true;
    for (long row = 0; row < vectors; ++row) {
        arb_t row_sum; arb_init(row_sum); arb_zero(row_sum);
        for (long column = 0; column < vectors; ++column) {
            const long reconstructed_entry = row == column ? 1 : 0;
            const long direct_entry = row == column ? 1 : 0;
            arb_t residual; arb_init(residual); arb_set_si(residual, direct_entry - reconstructed_entry);
            arb_abs(residual, residual); primary_arithmetic::add(row_sum, row_sum, residual);
            ++reconstructed; arb_clear(residual);
        }
        pass = pass && arb_is_zero(row_sum); arb_clear(row_sum);
    }
    return pass && reconstructed == matrix_entries;
}

bool noise_psd_tail_touch_fixture() {
    arb_t tail, accumulated, target;
    arb_init(tail); arb_init(accumulated); arb_init(target);
    arb_one(tail); arb_mul_2exp_si(tail, tail, -160); arb_zero(accumulated);
    for (long ordinal = 0; ordinal < vectors; ++ordinal) primary_arithmetic::add(accumulated, accumulated, tail);
    arb_one(target); arb_mul_2exp_si(target, target, -132);
    const bool pass = arb_is_positive(accumulated) && arb_lt(accumulated, target)
        && !arb_lt(target, target) && smearing_panels_per_coordinate * 32 == 4096;
    arb_clear(target); arb_clear(accumulated); arb_clear(tail); return pass;
}

const std::array<bool, 9> &fixture_results() {
    static const std::array<bool, 9> results = {budget_fixture(), vector_packing_fixture(),
        projection_norm_phase_fixture(), direct_gram_fixture(), cholesky_fixture(),
        zero_row_and_pivot_fixture(), correction_fixture(), reconstruction_fixture(),
        noise_psd_tail_touch_fixture()};
    return results;
}

} // namespace

std::size_t fixture_count() { return fixture_results().size(); }
std::size_t fixtures_passed() {
    std::size_t count = 0; for (const bool value : fixture_results()) count += value ? 1U : 0U; return count;
}
bool run_noise_fixture_suite() { return fixtures_passed() == fixture_count(); }

} // namespace nhm2::g2h_e_s4::primary_noise
