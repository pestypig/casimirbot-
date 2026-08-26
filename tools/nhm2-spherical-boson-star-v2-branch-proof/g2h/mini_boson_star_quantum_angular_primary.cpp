#include "mini_boson_star_quantum_angular_primary.hpp"

#include "mini_boson_star_arithmetic_primary.hpp"

#include <flint/fmpz.h>

#include <algorithm>
#include <array>
#include <cstdint>

namespace nhm2::g2h_e_s4::primary_quantum_angular {
namespace {

enum class ThresholdClass { below, atom, above, undecided };

ThresholdClass classify_threshold(const arb_t lambda) {
    arb_t one;
    arb_init(one); arb_one(one);
    ThresholdClass result = ThresholdClass::undecided;
    if (arb_lt(lambda, one)) result = ThresholdClass::below;
    else if (arb_gt(lambda, one)) result = ThresholdClass::above;
    else if (arb_equal(lambda, one)) result = ThresholdClass::atom;
    arb_clear(one);
    return result;
}

bool budget_and_packing_fixture() {
    constexpr std::uint64_t channels = 4;
    constexpr std::uint64_t derivative_multiindices = 70;
    constexpr std::uint64_t coefficients = subtraction_order + 1;
    constexpr std::uint64_t radial_cells = 256;
    constexpr std::uint64_t polynomial_coefficients = 25;
    constexpr std::uint64_t packed = channels * derivative_multiindices * coefficients
        * radial_cells * polynomial_coefficients;
    return ell_terms == 256 && subtraction_order == 20
        && hurwitz_zeta_calls_per_channel == 21 && majorant_iterations == 8
        && projection_passes == 1 && packed == 37632000ULL;
}

bool drach_recurrence_fixture() {
    // Manufactured constant Liouville problem V-z=nu^2.  With
    // R=nu^-1 sum_j a_j nu^-2j, the exact Drach identity reduces to
    // 4 A(t)^2=1.  Ascending coefficient solution selects a_0=+1/2.
    std::array<arb_struct, subtraction_order + 1> coefficient;
    for (auto &value : coefficient) arb_init(&value);
    arb_set_ui(&coefficient[0], 1); arb_mul_2exp_si(&coefficient[0], &coefficient[0], -1);
    bool pass = arb_is_positive(&coefficient[0]);
    for (long order = 1; pass && order <= subtraction_order; ++order) {
        arb_t known, denominator;
        arb_init(known); arb_init(denominator); arb_zero(known);
        for (long left = 1; left < order; ++left) {
            arb_addmul(known, &coefficient[static_cast<std::size_t>(left)],
                &coefficient[static_cast<std::size_t>(order - left)],
                primary_arithmetic::precision_bits);
        }
        arb_mul_2exp_si(denominator, &coefficient[0], 1);
        arb_neg(known, known);
        arb_div(&coefficient[static_cast<std::size_t>(order)], known, denominator,
            primary_arithmetic::precision_bits);
        pass = arb_is_zero(&coefficient[static_cast<std::size_t>(order)]);
        arb_clear(denominator); arb_clear(known);
    }
    // Substitute every solved coefficient back into 4 A^2-1 through order 20.
    for (long order = 0; pass && order <= subtraction_order; ++order) {
        arb_t residual;
        arb_init(residual); arb_zero(residual);
        for (long left = 0; left <= order; ++left) {
            arb_addmul(residual, &coefficient[static_cast<std::size_t>(left)],
                &coefficient[static_cast<std::size_t>(order - left)],
                primary_arithmetic::precision_bits);
        }
        arb_mul_2exp_si(residual, residual, 2);
        if (order == 0) arb_sub_ui(residual, residual, 1,
            primary_arithmetic::precision_bits);
        pass = arb_is_zero(residual);
        arb_clear(residual);
    }
    for (auto &value : coefficient) arb_clear(&value);
    return pass;
}

bool finite_sum_order_fixture() {
    std::uint64_t degeneracy_total = 0;
    long previous = -1;
    for (long ell = 0; ell < ell_terms; ++ell) {
        if (ell != previous + 1) return false;
        for (long m_ordinal = 0; m_ordinal < 2 * ell + 1; ++m_ordinal) {
            ++degeneracy_total;
        }
        previous = ell;
    }
    return previous == 255 && degeneracy_total == 65536ULL;
}

bool hurwitz_tail_fixture() {
    arb_t q, s, zeta, previous;
    arb_init(q); arb_init(s); arb_init(zeta); arb_init(previous);
    arb_set_ui(q, 511); arb_mul_2exp_si(q, q, -1);
    bool pass = true;
    long calls = 0;
    for (long j = 0; j <= subtraction_order; ++j) {
        arb_set_si(s, 2 * j + 2);
        arb_hurwitz_zeta(zeta, s, q, primary_arithmetic::precision_bits);
        pass = pass && arb_is_positive(zeta) && arb_is_finite(zeta);
        if (j > 0) pass = pass && arb_lt(zeta, previous);
        arb_set(previous, zeta);
        ++calls;
    }
    arb_clear(previous); arb_clear(zeta); arb_clear(s); arb_clear(q);
    return pass && calls == hurwitz_zeta_calls_per_channel;
}

bool majorant_fixture() {
    arb_t source, rho, bound, previous, tail, one_minus_rho;
    arb_init(source); arb_init(rho); arb_init(bound); arb_init(previous);
    arb_init(tail); arb_init(one_minus_rho);
    arb_one(source); arb_mul_2exp_si(source, source, -150);
    arb_one(rho); arb_mul_2exp_si(rho, rho, -1);
    arb_zero(bound);
    bool pass = true;
    for (long iteration = 0; iteration < majorant_iterations; ++iteration) {
        arb_set(previous, bound);
        arb_mul(bound, rho, bound, primary_arithmetic::precision_bits);
        arb_add(bound, bound, source, primary_arithmetic::precision_bits);
        pass = pass && arb_gt(bound, previous);
    }
    arb_one(one_minus_rho);
    arb_sub(one_minus_rho, one_minus_rho, rho, primary_arithmetic::precision_bits);
    arb_div(tail, bound, one_minus_rho, primary_arithmetic::precision_bits);
    pass = pass && strict_component_width(tail);
    arb_clear(one_minus_rho); arb_clear(tail); arb_clear(previous);
    arb_clear(bound); arb_clear(rho); arb_clear(source);
    return pass;
}

bool threshold_fixture() {
    arb_t below, atom, above, undecided;
    arb_init(below); arb_init(atom); arb_init(above); arb_init(undecided);
    arb_set_ui(below, 3); arb_mul_2exp_si(below, below, -2);
    arb_one(atom);
    arb_set_ui(above, 5); arb_mul_2exp_si(above, above, -2);
    arb_one(undecided); arb_add_error_2exp_si(undecided, 0);
    const bool pass = classify_threshold(below) == ThresholdClass::below
        && classify_threshold(atom) == ThresholdClass::atom
        && classify_threshold(above) == ThresholdClass::above
        && classify_threshold(undecided) == ThresholdClass::undecided;
    arb_clear(undecided); arb_clear(above); arb_clear(atom); arb_clear(below);
    return pass;
}

bool projection_once_fixture() {
    long projections = 0;
    for (long coefficient = 0; coefficient <= subtraction_order; ++coefficient) {
        fmpz_t lattice;
        arb_t value, error;
        fmpz_init(lattice); arb_init(value); arb_init(error);
        arb_set_si(value, coefficient == 0 ? 1 : 0);
        if (!primary_arithmetic::project_midpoint_2m448(value, lattice, error)
            || !arb_is_zero(error)) {
            arb_clear(error); arb_clear(value); fmpz_clear(lattice); return false;
        }
        ++projections;
        arb_clear(error); arb_clear(value); fmpz_clear(lattice);
    }
    return projection_passes == 1 && projections == subtraction_order + 1;
}

bool strict_touch_fixture() {
    arb_t pass, touch;
    arb_init(pass); arb_init(touch);
    arb_one(pass); arb_mul_2exp_si(pass, pass, -133);
    arb_one(touch); arb_mul_2exp_si(touch, touch, -132);
    const bool result = strict_component_width(pass) && !strict_component_width(touch);
    arb_clear(touch); arb_clear(pass);
    return result;
}

bool chronology_fixture() {
    // A last-iteration majorant touch fails before projection or any later role.
    arb_t touch;
    arb_init(touch); arb_one(touch); arb_mul_2exp_si(touch, touch, -132);
    long projection_count = 0;
    const bool tail_accepted = strict_component_width(touch);
    if (tail_accepted) ++projection_count;
    arb_clear(touch);
    return !tail_accepted && projection_count == 0;
}

std::array<bool, 9> fixture_results() {
    return {budget_and_packing_fixture(), drach_recurrence_fixture(),
        finite_sum_order_fixture(), hurwitz_tail_fixture(), majorant_fixture(),
        threshold_fixture(), projection_once_fixture(), strict_touch_fixture(),
        chronology_fixture()};
}

} // namespace

bool strict_component_width(const arb_t width) {
    arb_t target;
    arb_init(target); arb_one(target); arb_mul_2exp_si(target, target, -132);
    const bool pass = arb_is_nonnegative(width) && arb_lt(width, target);
    arb_clear(target);
    return pass;
}

std::size_t fixture_count() { return 9U; }
std::size_t fixtures_passed() {
    const auto checks = fixture_results();
    return static_cast<std::size_t>(std::count(checks.begin(), checks.end(), true));
}
bool run_quantum_angular_fixture_suite() { return fixtures_passed() == fixture_count(); }

} // namespace nhm2::g2h_e_s4::primary_quantum_angular
