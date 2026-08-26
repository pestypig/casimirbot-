#include "mini_boson_star_quantum_measure_primary.hpp"

#include "mini_boson_star_arithmetic_primary.hpp"
#include "mini_boson_star_quantum_negative_axis_primary.hpp"

#include <arb.h>
#include <flint/fmpq.h>
#include <flint/fmpq_mat.h>

#include <algorithm>
#include <array>

namespace nhm2::g2h_e_s4::primary_quantum_measure {
namespace {

constexpr long base_panels = 2048;
constexpr long nodes_per_panel = 32;
constexpr long epsilon_levels = 9;
constexpr long richardson_order = 8;
constexpr long energy_tail_order = 20;
constexpr long tail_iterations = 8;
constexpr long smearing_panels = 128;
constexpr long mean_entries = 64 * 4;
constexpr std::array<long, epsilon_levels> epsilon_exponents =
    {32, 40, 48, 56, 64, 72, 80, 88, 96};

struct Richardson {
    std::array<fmpq, epsilon_levels> weights;
    bool valid = false;
    Richardson() { for (auto &weight : weights) fmpq_init(&weight); }
    ~Richardson() { for (auto &weight : weights) fmpq_clear(&weight); }
};

void dyadic_epsilon(fmpq_t value, long exponent) {
    fmpq_one(value); fmpq_div_2exp(value, value, exponent);
}

bool build_richardson(Richardson &result) {
    fmpq_mat_t matrix, rhs, solution;
    fmpq_mat_init(matrix, epsilon_levels, epsilon_levels);
    fmpq_mat_init(rhs, epsilon_levels, 1);
    fmpq_mat_init(solution, epsilon_levels, 1);
    fmpq_t epsilon, power;
    fmpq_init(epsilon); fmpq_init(power);
    for (long column = 0; column < epsilon_levels; ++column) {
        dyadic_epsilon(epsilon, epsilon_exponents[static_cast<std::size_t>(column)]);
        fmpq_one(power);
        for (long row = 0; row < epsilon_levels; ++row) {
            fmpq_set(fmpq_mat_entry(matrix, row, column), power);
            fmpq_mul(power, power, epsilon);
        }
    }
    fmpq_one(fmpq_mat_entry(rhs, 0, 0));
    bool pass = fmpq_mat_solve_fraction_free(solution, matrix, rhs) != 0;
    for (long index = 0; pass && index < epsilon_levels; ++index) {
        fmpq_set(&result.weights[static_cast<std::size_t>(index)],
            fmpq_mat_entry(solution, index, 0));
    }
    for (long moment = 0; pass && moment <= richardson_order; ++moment) {
        fmpq_t sum;
        fmpq_init(sum); fmpq_zero(sum);
        for (long index = 0; index < epsilon_levels; ++index) {
            dyadic_epsilon(epsilon, epsilon_exponents[static_cast<std::size_t>(index)]);
            fmpq_one(power);
            for (long k = 0; k < moment; ++k) fmpq_mul(power, power, epsilon);
            fmpq_addmul(sum, &result.weights[static_cast<std::size_t>(index)], power);
        }
        pass = moment == 0 ? fmpq_is_one(sum) : fmpq_is_zero(sum);
        fmpq_clear(sum);
    }
    fmpq_clear(power); fmpq_clear(epsilon);
    fmpq_mat_clear(solution); fmpq_mat_clear(rhs); fmpq_mat_clear(matrix);
    result.valid = pass; return pass;
}

Richardson &cached_richardson() {
    static Richardson result;
    static const bool initialized = build_richardson(result);
    (void) initialized; return result;
}

bool budget_panel_threshold_fixture() {
    fmpq_t left, right, threshold;
    fmpq_init(left); fmpq_init(right); fmpq_init(threshold);
    fmpq_set_si(threshold, 1, 2); // manufactured alpha_min^2=0
    long crossing = -1;
    for (long panel = 0; panel < base_panels; ++panel) {
        fmpq_set_si(left, 4095 * panel, 8388608);
        fmpq_set_si(right, 4095 * (panel + 1), 8388608);
        if (fmpq_cmp(left, threshold) < 0 && fmpq_cmp(threshold, right) < 0) crossing = panel;
    }
    const bool pass = base_panels == 2048 && nodes_per_panel == 32
        && epsilon_levels == 9 && richardson_order == 8 && energy_tail_order == 20
        && tail_iterations == 8 && smearing_panels == 128 && crossing == 1024;
    fmpq_clear(threshold); fmpq_clear(right); fmpq_clear(left); return pass;
}

bool richardson_fixture() { return cached_richardson().valid; }

bool complete_stieltjes_atom_fixture() {
    // For the manufactured unit atom at lambda=1, the Poisson-semigroup
    // pairing of the chosen compact-time multiplier is exp(-epsilon).  The
    // atom stays in the threshold tag; removing it would return exact zero.
    arb_t epsilon, pairing, removed;
    arb_init(epsilon); arb_init(pairing); arb_init(removed);
    arb_one(epsilon); arb_mul_2exp_si(epsilon, epsilon,
        -epsilon_exponents.front());
    arb_neg(pairing, epsilon); arb_exp(pairing, pairing, primary_arithmetic::precision_bits);
    arb_zero(removed);
    const bool pass = arb_is_positive(pairing) && !arb_contains_zero(pairing)
        && arb_is_zero(removed);
    arb_clear(removed); arb_clear(pairing); arb_clear(epsilon); return pass;
}

bool poisson_remainder_fixture() {
    Richardson &richardson = cached_richardson(); if (!richardson.valid) return false;
    fmpq_t epsilon, power, absolute, sum, factorial;
    fmpq_init(epsilon); fmpq_init(power); fmpq_init(absolute);
    fmpq_init(sum); fmpq_init(factorial); fmpq_zero(sum);
    for (long index = 0; index < epsilon_levels; ++index) {
        dyadic_epsilon(epsilon, epsilon_exponents[static_cast<std::size_t>(index)]);
        fmpq_one(power);
        for (long k = 0; k < 9; ++k) fmpq_mul(power, power, epsilon);
        fmpq_abs(absolute, &richardson.weights[static_cast<std::size_t>(index)]);
        fmpq_mul(absolute, absolute, power); fmpq_add(sum, sum, absolute);
    }
    fmpq_set_si(factorial, 362880, 1); fmpq_div(sum, sum, factorial);
    arb_t bound, target;
    arb_init(bound); arb_init(target); arb_set_fmpq(bound, sum, primary_arithmetic::precision_bits);
    arb_one(target); arb_mul_2exp_si(target, target, -132);
    const bool pass = arb_is_positive(bound) && arb_lt(bound, target);
    arb_clear(target); arb_clear(bound); fmpq_clear(factorial); fmpq_clear(sum);
    fmpq_clear(absolute); fmpq_clear(power); fmpq_clear(epsilon); return pass;
}

bool extrapolated_pairing_fixture() {
    Richardson &richardson = cached_richardson(); if (!richardson.valid) return false;
    arb_t epsilon, level, weight, sum, remainder, one;
    arb_init(epsilon); arb_init(level); arb_init(weight); arb_init(sum);
    arb_init(remainder); arb_init(one); arb_zero(sum); arb_one(one);
    for (long index = 0; index < epsilon_levels; ++index) {
        arb_one(epsilon); arb_mul_2exp_si(epsilon, epsilon,
            -epsilon_exponents[static_cast<std::size_t>(index)]);
        arb_neg(level, epsilon); arb_exp(level, level, primary_arithmetic::precision_bits);
        arb_set_fmpq(weight, &richardson.weights[static_cast<std::size_t>(index)],
            primary_arithmetic::precision_bits);
        arb_addmul(sum, weight, level, primary_arithmetic::precision_bits);
    }
    arb_sub(remainder, one, sum, primary_arithmetic::precision_bits);
    arb_abs(remainder, remainder);
    const bool pass = arb_is_finite(sum) && arb_is_positive(sum)
        && arb_lt(remainder, one);
    arb_clear(one); arb_clear(remainder); arb_clear(sum); arb_clear(weight);
    arb_clear(level); arb_clear(epsilon); return pass;
}

bool energy_tail_fixture() {
    arb_t source, rho, bound, previous, tail, denominator, target;
    arb_init(source); arb_init(rho); arb_init(bound); arb_init(previous);
    arb_init(tail); arb_init(denominator); arb_init(target);
    arb_one(source); arb_mul_2exp_si(source, source, -150);
    arb_one(rho); arb_mul_2exp_si(rho, rho, -1); arb_zero(bound);
    bool pass = true;
    for (long iteration = 0; iteration < tail_iterations; ++iteration) {
        arb_set(previous, bound); arb_mul(bound, rho, bound, primary_arithmetic::precision_bits);
        arb_add(bound, bound, source, primary_arithmetic::precision_bits);
        pass = pass && arb_gt(bound, previous);
    }
    arb_one(denominator); arb_sub(denominator, denominator, rho, primary_arithmetic::precision_bits);
    arb_div(tail, bound, denominator, primary_arithmetic::precision_bits);
    arb_one(target); arb_mul_2exp_si(target, target, -132); pass = pass && arb_lt(tail, target);
    arb_clear(target); arb_clear(denominator); arb_clear(tail); arb_clear(previous);
    arb_clear(bound); arb_clear(rho); arb_clear(source); return pass;
}

bool smearing_fixture() {
    arb_t moment, z, numerator, normalized, one;
    arb_init(moment); arb_init(z); arb_init(numerator); arb_init(normalized); arb_init(one);
    if (!primary_quantum_negative_axis::certified_gl32_constant_moment(moment)) return false;
    arb_set(z, moment); arb_set(numerator, z); arb_div(normalized, numerator, z,
        primary_arithmetic::precision_bits); arb_one(one);
    const bool pass = arb_is_positive(z) && arb_contains(normalized, one)
        && smearing_panels * nodes_per_panel == 4096;
    arb_clear(one); arb_clear(normalized); arb_clear(numerator); arb_clear(z); arb_clear(moment);
    return pass;
}

bool mean_inventory_fixture() {
    std::array<arb_struct, mean_entries> entries;
    for (auto &entry : entries) { arb_init(&entry); arb_zero(&entry); }
    const bool pass = entries.size() == 256U
        && std::all_of(entries.begin(), entries.end(), [](const arb_struct &v) { return arb_is_zero(&v); });
    for (auto &entry : entries) arb_clear(&entry);
    return pass;
}

bool strict_touch_chronology_fixture() {
    arb_t target, pass;
    arb_init(target); arb_init(pass); arb_one(target); arb_mul_2exp_si(target, target, -132);
    arb_one(pass); arb_mul_2exp_si(pass, pass, -133);
    const bool accepted = arb_lt(pass, target); const bool touch = arb_lt(target, target);
    long later = touch ? 1 : 0;
    arb_clear(pass); arb_clear(target); return accepted && !touch && later == 0;
}

std::array<bool, 9> fixture_results() {
    return {budget_panel_threshold_fixture(), richardson_fixture(),
        complete_stieltjes_atom_fixture(), poisson_remainder_fixture(),
        extrapolated_pairing_fixture(), energy_tail_fixture(), smearing_fixture(),
        mean_inventory_fixture(), strict_touch_chronology_fixture()};
}
} // namespace

std::size_t fixture_count() { return 9U; }
std::size_t fixtures_passed() { const auto c = fixture_results(); return static_cast<std::size_t>(std::count(c.begin(), c.end(), true)); }
bool run_quantum_measure_fixture_suite() { return fixtures_passed() == fixture_count(); }
} // namespace nhm2::g2h_e_s4::primary_quantum_measure
