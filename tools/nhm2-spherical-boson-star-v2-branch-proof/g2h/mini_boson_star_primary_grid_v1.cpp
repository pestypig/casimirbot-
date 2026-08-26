#include "mini_boson_star_primary_grid_v1.hpp"

#include <flint/fmpq.h>

#include <array>
#include <vector>

namespace nhm2::g2h_e_s5::primary_grid_v1 {
namespace {

bool narrow_or_exact(const arb_t value) {
    return arb_is_exact(value) != 0 || mag_cmp_2exp_si(arb_radref(value), -400) <= 0;
}

bool strict_less(const arb_t left, const arb_t right) {
    return arb_lt(left, right) != 0;
}

void set_rational(arb_t value, long numerator, long denominator) {
    fmpq_t rational;
    fmpq_init(rational);
    fmpq_set_si(rational, numerator, denominator);
    arb_set_fmpq(value, rational, precision_bits);
    fmpq_clear(rational);
}

bool endpoint_and_order_fixture(long node_count) {
    PatchNode previous, current;
    init(previous); init(current);
    bool pass = construct_patch_node(previous, node_count, 0)
        && arb_is_one(previous.core_even_coordinate)
        && arb_equal_si(previous.core_radius, 255)
        && arb_is_zero(previous.tail_inverse_radius);
    for (long ordinal = 1; pass && ordinal < node_count; ++ordinal) {
        pass = construct_patch_node(current, node_count, ordinal)
            && strict_less(current.core_even_coordinate, previous.core_even_coordinate)
            && strict_less(current.core_radius, previous.core_radius)
            && strict_less(previous.tail_inverse_radius, current.tail_inverse_radius)
            && narrow_or_exact(current.core_even_coordinate)
            && narrow_or_exact(current.core_radius)
            && narrow_or_exact(current.tail_inverse_radius);
        arb_set(previous.core_even_coordinate, current.core_even_coordinate);
        arb_set(previous.core_radius, current.core_radius);
        arb_set(previous.tail_inverse_radius, current.tail_inverse_radius);
    }
    arb_t interface_q;
    arb_init(interface_q);
    set_rational(interface_q, 1, 255);
    pass = pass && arb_is_zero(previous.core_even_coordinate)
        && arb_is_zero(previous.core_radius)
        && arb_equal(previous.tail_inverse_radius, interface_q);
    arb_clear(interface_q);
    clear(current); clear(previous);
    return pass;
}

bool length_and_index_fixture() {
    for (const long count : {64L, 96L, 128L, 256L}) {
        if (positive_state_length(count) != 8L * count + 2L
            || vacuum_state_length(count) != 8L * count + 1L) return false;
        long index = -1;
        if (!positive_state_index(&index, count, 7, count - 1) || index != 8L * count - 1L
            || !positive_scalar_index(&index, count, 0) || index != 8L * count
            || !positive_scalar_index(&index, count, 1) || index != 8L * count + 1L
            || !vacuum_state_index(&index, count, 7, count - 1) || index != 8L * count - 1L
            || !vacuum_scalar_index(&index, count) || index != 8L * count) return false;
    }
    long index = 0;
    return positive_state_length(65) == -1 && vacuum_state_length(0) == -1
        && !positive_state_index(&index, 64, 8, 0)
        && !positive_state_index(&index, 64, 0, 64)
        && !positive_scalar_index(&index, 64, 2)
        && !vacuum_state_index(&index, 64, -1, 0)
        && !vacuum_scalar_index(nullptr, 64);
}

bool dct_constant_fixture() {
    constexpr long count = 64;
    std::vector<arb_struct> values(static_cast<std::size_t>(count));
    std::vector<arb_struct> coefficients(static_cast<std::size_t>(count));
    for (long i = 0; i < count; ++i) {
        arb_init(values.data() + i); arb_init(coefficients.data() + i);
        arb_one(values.data() + i);
    }
    bool pass = canonical_dct_i(coefficients.data(), values.data(), count)
        && arb_contains_si(coefficients.data(), 1);
    for (long i = 1; pass && i < count; ++i) pass = arb_contains_zero(coefficients.data() + i) != 0;
    for (long i = count - 1; i >= 0; --i) {
        arb_clear(coefficients.data() + i); arb_clear(values.data() + i);
    }
    return pass;
}

bool dct_t3_fixture() {
    constexpr long count = 64;
    std::vector<arb_struct> values(static_cast<std::size_t>(count));
    std::vector<arb_struct> coefficients(static_cast<std::size_t>(count));
    arb_t angle, cosine, pi;
    arb_init(angle); arb_init(cosine); arb_init(pi);
    arb_const_pi(pi, precision_bits);
    for (long j = 0; j < count; ++j) {
        arb_init(values.data() + j); arb_init(coefficients.data() + j);
        arb_mul_si(angle, pi, 3L * j, precision_bits);
        arb_div_si(angle, angle, count - 1L, precision_bits);
        arb_cos(values.data() + j, angle, precision_bits);
    }
    bool pass = canonical_dct_i(coefficients.data(), values.data(), count);
    for (long k = 0; pass && k < count; ++k) {
        pass = k == 3 ? arb_contains_si(coefficients.data() + k, 1)
                      : arb_contains_zero(coefficients.data() + k) != 0;
    }
    arb_clear(pi); arb_clear(cosine); arb_clear(angle);
    for (long i = count - 1; i >= 0; --i) {
        arb_clear(coefficients.data() + i); arb_clear(values.data() + i);
    }
    return pass;
}

bool rejection_fixture() {
    PatchNode node;
    init(node);
    arb_t value, coefficient;
    arb_init(value); arb_init(coefficient); arb_one(value);
    const bool pass = !construct_patch_node(node, 65, 0)
        && !construct_patch_node(node, 64, -1)
        && !construct_patch_node(node, 64, 64)
        && !canonical_dct_i(nullptr, value, 64)
        && !canonical_dct_i(coefficient, nullptr, 64);
    arb_clear(coefficient); arb_clear(value); clear(node);
    return pass;
}

std::array<bool, 8> fixture_results() {
    return {
        endpoint_and_order_fixture(64), endpoint_and_order_fixture(96),
        endpoint_and_order_fixture(128), endpoint_and_order_fixture(256),
        length_and_index_fixture(), dct_constant_fixture(), dct_t3_fixture(),
        rejection_fixture(),
    };
}

} // namespace

bool frozen_node_count(long node_count) {
    return node_count == 64L || node_count == 96L || node_count == 128L || node_count == 256L;
}

long positive_state_length(long node_count) { return frozen_node_count(node_count) ? 8L * node_count + 2L : -1L; }
long vacuum_state_length(long node_count) { return frozen_node_count(node_count) ? 8L * node_count + 1L : -1L; }

void init(PatchNode &node) {
    arb_init(node.core_even_coordinate); arb_init(node.core_radius);
    arb_init(node.tail_inverse_radius);
}

void clear(PatchNode &node) {
    arb_clear(node.tail_inverse_radius); arb_clear(node.core_radius);
    arb_clear(node.core_even_coordinate);
}

bool construct_patch_node(PatchNode &node, long node_count, long ordinal) {
    if (!frozen_node_count(node_count) || ordinal < 0L || ordinal >= node_count) return false;
    if (ordinal == 0L) {
        arb_one(node.core_even_coordinate); arb_set_si(node.core_radius, 255L);
        arb_zero(node.tail_inverse_radius); return true;
    }
    if (ordinal == node_count - 1L) {
        arb_zero(node.core_even_coordinate); arb_zero(node.core_radius);
        set_rational(node.tail_inverse_radius, 1L, 255L); return true;
    }
    arb_t angle, cosine, temporary, pi;
    arb_init(angle); arb_init(cosine); arb_init(temporary); arb_init(pi);
    arb_const_pi(pi, precision_bits);
    arb_mul_si(angle, pi, ordinal, precision_bits);
    arb_div_si(angle, angle, node_count - 1L, precision_bits);
    arb_cos(cosine, angle, precision_bits);
    arb_add_ui(node.core_even_coordinate, cosine, 1UL, precision_bits);
    arb_mul_2exp_si(node.core_even_coordinate, node.core_even_coordinate, -1);
    arb_sqrt(temporary, node.core_even_coordinate, precision_bits);
    arb_mul_si(node.core_radius, temporary, 255L, precision_bits);
    arb_neg(temporary, cosine);
    arb_add_ui(temporary, temporary, 1UL, precision_bits);
    arb_div_ui(node.tail_inverse_radius, temporary, 510UL, precision_bits);
    const bool pass = narrow_or_exact(node.core_even_coordinate)
        && narrow_or_exact(node.core_radius) && narrow_or_exact(node.tail_inverse_radius);
    arb_clear(pi); arb_clear(temporary); arb_clear(cosine); arb_clear(angle);
    return pass;
}

bool canonical_dct_i(arb_ptr coefficients, arb_srcptr nodal_values, long node_count) {
    if (coefficients == nullptr || nodal_values == nullptr || !frozen_node_count(node_count)
        || coefficients == nodal_values) return false;
    const long degree = node_count - 1L;
    arb_t sum, term, angle, cosine, pi;
    arb_init(sum); arb_init(term); arb_init(angle); arb_init(cosine); arb_init(pi);
    arb_const_pi(pi, precision_bits);
    for (long k = 0; k <= degree; ++k) {
        arb_set(sum, nodal_values);
        arb_mul_2exp_si(sum, sum, -1);
        for (long j = 1; j < degree; ++j) {
            arb_mul_si(angle, pi, j * k, precision_bits);
            arb_div_si(angle, angle, degree, precision_bits);
            arb_cos(cosine, angle, precision_bits);
            arb_mul(term, nodal_values + j, cosine, precision_bits);
            arb_add(sum, sum, term, precision_bits);
        }
        arb_set(term, nodal_values + degree);
        arb_mul_2exp_si(term, term, -1);
        if ((k & 1L) != 0L) arb_neg(term, term);
        arb_add(sum, sum, term, precision_bits);
        arb_mul_2exp_si(sum, sum, 1);
        arb_div_si(coefficients + k, sum, degree, precision_bits);
        if (k == 0L || k == degree) arb_mul_2exp_si(coefficients + k, coefficients + k, -1);
        if (!arb_is_finite(coefficients + k) || !narrow_or_exact(coefficients + k)) {
            arb_clear(pi); arb_clear(cosine); arb_clear(angle); arb_clear(term); arb_clear(sum);
            return false;
        }
    }
    arb_clear(pi); arb_clear(cosine); arb_clear(angle); arb_clear(term); arb_clear(sum);
    return true;
}

bool positive_state_index(long *index, long node_count, long component, long coefficient) {
    if (index == nullptr || !frozen_node_count(node_count) || component < 0L || component >= 8L
        || coefficient < 0L || coefficient >= node_count) return false;
    *index = component * node_count + coefficient; return true;
}

bool positive_scalar_index(long *index, long node_count, long scalar_ordinal) {
    if (index == nullptr || !frozen_node_count(node_count) || scalar_ordinal < 0L || scalar_ordinal >= 2L) return false;
    *index = 8L * node_count + scalar_ordinal; return true;
}

bool vacuum_state_index(long *index, long node_count, long component, long coefficient) {
    return positive_state_index(index, node_count, component, coefficient);
}

bool vacuum_scalar_index(long *index, long node_count) {
    if (index == nullptr || !frozen_node_count(node_count)) return false;
    *index = 8L * node_count; return true;
}

std::size_t fixture_count() { return 8U; }
std::size_t fixtures_passed() {
    const auto checks = fixture_results();
    std::size_t passed = 0U;
    for (const bool value : checks) passed += value ? 1U : 0U;
    return passed;
}
bool run_grid_fixture_suite() { return fixtures_passed() == fixture_count(); }

} // namespace nhm2::g2h_e_s5::primary_grid_v1
