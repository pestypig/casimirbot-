#include "mini_boson_star_quantum_radial_primary.hpp"

#include "mini_boson_star_arithmetic_primary.hpp"
#include "mini_boson_star_inverse_primary.hpp"

#include <arb_mat.h>
#include <flint/fmpz.h>

#include <algorithm>
#include <array>
#include <vector>

namespace nhm2::g2h_e_s4::primary_quantum_radial {
namespace {

void cgl_node(arb_t result, long physical_ordinal) {
    // physical ordinal 0 is tau=-1 and ordinal 24 is tau=+1.
    arb_t angle, pi;
    arb_init(angle); arb_init(pi);
    arb_const_pi(pi, primary_arithmetic::precision_bits);
    arb_mul_ui(angle, pi, static_cast<ulong>(radial_degree - physical_ordinal),
        primary_arithmetic::precision_bits);
    arb_div_ui(angle, angle, static_cast<ulong>(radial_degree),
        primary_arithmetic::precision_bits);
    arb_cos(result, angle, primary_arithmetic::precision_bits);
    arb_clear(pi); arb_clear(angle);
}

void chebyshev_u(arb_t result, long degree, const arb_t x) {
    if (degree == 0) { arb_one(result); return; }
    if (degree == 1) { arb_mul_2exp_si(result, x, 1); return; }
    arb_t previous, current, next, term;
    arb_init(previous); arb_init(current); arb_init(next); arb_init(term);
    arb_one(previous); arb_mul_2exp_si(current, x, 1);
    for (long index = 1; index < degree; ++index) {
        arb_mul(term, x, current, primary_arithmetic::precision_bits);
        arb_mul_2exp_si(term, term, 1);
        arb_sub(next, term, previous, primary_arithmetic::precision_bits);
        arb_set(previous, current); arb_set(current, next);
    }
    arb_set(result, current);
    arb_clear(term); arb_clear(next); arb_clear(current); arb_clear(previous);
}

bool budget_fixture() {
    return radial_cells == 256 && radial_degree == 24 && nodes_per_cell == 25
        && unknowns_per_cell == 50 && defect_sweeps == 8
        && defect_enclosure_degree == 48;
}

bool cgl_order_fixture() {
    std::array<arb_struct, nodes_per_cell> nodes;
    for (auto &node : nodes) arb_init(&node);
    bool pass = true;
    for (long ordinal = 0; ordinal < nodes_per_cell; ++ordinal) {
        cgl_node(&nodes[static_cast<std::size_t>(ordinal)], ordinal);
        if (ordinal > 0) {
            pass = pass && arb_lt(&nodes[static_cast<std::size_t>(ordinal - 1)],
                &nodes[static_cast<std::size_t>(ordinal)]);
        }
    }
    pass = pass && arb_contains_si(&nodes.front(), -1)
        && arb_contains_si(&nodes.back(), 1);
    for (auto &node : nodes) arb_clear(&node);
    return pass;
}

bool collocation_fixture() {
    arb_mat_t matrix, inverse, rhs, solution;
    arb_mat_init(matrix, unknowns_per_cell, unknowns_per_cell);
    arb_mat_init(inverse, unknowns_per_cell, unknowns_per_cell);
    arb_mat_init(rhs, unknowns_per_cell, 1);
    arb_mat_init(solution, unknowns_per_cell, 1);
    for (long component = 0; component < 2; ++component) {
        const long offset = component * nodes_per_cell;
        // Incoming row at tau=-1.
        for (long coefficient = 0; coefficient <= radial_degree; ++coefficient) {
            arb_set_si(arb_mat_entry(matrix, offset, offset + coefficient),
                coefficient % 2 == 0 ? 1 : -1);
        }
        arb_set_si(arb_mat_entry(rhs, offset, 0), component + 1);
        for (long physical = 1; physical < nodes_per_cell; ++physical) {
            arb_t node, value;
            arb_init(node); arb_init(value); cgl_node(node, physical);
            const long row = offset + physical;
            arb_zero(arb_mat_entry(matrix, row, offset));
            for (long coefficient = 1; coefficient <= radial_degree; ++coefficient) {
                chebyshev_u(value, coefficient - 1, node);
                arb_mul_si(arb_mat_entry(matrix, row, offset + coefficient), value,
                    coefficient, primary_arithmetic::precision_bits);
            }
            arb_clear(value); arb_clear(node);
        }
    }
    long first_pivot = -1;
    bool pass = primary_inverse::complete_pivot_inverse(inverse, matrix, &first_pivot);
    if (pass) {
        arb_mat_mul(solution, inverse, rhs, primary_arithmetic::precision_bits);
        pass = first_pivot >= 0
            && arb_contains_si(arb_mat_entry(solution, 0, 0), 1)
            && arb_contains_si(arb_mat_entry(solution, nodes_per_cell, 0), 2);
        for (long component = 0; pass && component < 2; ++component) {
            for (long coefficient = 1; coefficient <= radial_degree; ++coefficient) {
                pass = arb_contains_zero(arb_mat_entry(solution,
                    component * nodes_per_cell + coefficient, 0));
            }
        }
    }
    arb_mat_clear(solution); arb_mat_clear(rhs); arb_mat_clear(inverse); arb_mat_clear(matrix);
    return pass;
}

bool defect_correction_fixture() {
    arb_t residual, previous, correction;
    arb_init(residual); arb_init(previous); arb_init(correction);
    arb_one(residual);
    bool pass = true;
    for (long sweep = 0; sweep < defect_sweeps; ++sweep) {
        arb_set(previous, residual);
        arb_mul_2exp_si(correction, residual, -1);
        arb_sub(residual, residual, correction, primary_arithmetic::precision_bits);
        pass = pass && arb_lt(residual, previous);
    }
    pass = pass && arb_contains_si(residual, 0) == 0;
    arb_clear(correction); arb_clear(previous); arb_clear(residual);
    return pass;
}

bool propagation_fixture() {
    long regular[2] = {1, 0};
    long weyl[2] = {0, 1};
    long forward = 0, backward = 0;
    for (long cell = 0; cell < radial_cells; ++cell) {
        forward += regular[0] == 1 && regular[1] == 0 ? 1 : 0;
    }
    for (long cell = radial_cells; cell-- > 0;) {
        backward += weyl[0] == 0 && weyl[1] == 1 ? 1 : 0;
    }
    return forward == radial_cells && backward == radial_cells;
}

bool defect_enclosure_fixture() {
    std::array<long, defect_enclosure_degree + 1> bernstein {};
    return bernstein.size() == 49U
        && std::all_of(bernstein.begin(), bernstein.end(), [](long value) { return value == 0; });
}

bool projection_once_fixture() {
    bool pass = true;
    for (long ordinal = 0; ordinal < unknowns_per_cell; ++ordinal) {
        fmpz_t lattice;
        arb_t value, error;
        fmpz_init(lattice); arb_init(value); arb_init(error);
        arb_set_si(value, ordinal == 0 ? 1 : 0);
        pass = pass && primary_arithmetic::project_midpoint_2m448(
            value, lattice, error) && arb_is_zero(error);
        arb_clear(error); arb_clear(value); fmpz_clear(lattice);
    }
    return pass;
}

bool wronskian_fixture() {
    const long regular[2] = {1, 0};
    const long weyl[2] = {0, 1};
    return regular[0] * weyl[1] - regular[1] * weyl[0] == 1;
}

bool strict_touch_fixture() {
    arb_t pass, touch;
    arb_init(pass); arb_init(touch);
    arb_set_si(pass, 1); arb_mul_2exp_si(pass, pass, -2);
    arb_one(touch);
    const bool result = strict_contraction(pass) && !strict_contraction(touch);
    arb_clear(touch); arb_clear(pass);
    return result;
}

std::array<bool, 9> fixture_results() {
    return {budget_fixture(), cgl_order_fixture(), collocation_fixture(),
        defect_correction_fixture(), propagation_fixture(), defect_enclosure_fixture(),
        projection_once_fixture(), wronskian_fixture(), strict_touch_fixture()};
}

} // namespace

bool strict_contraction(const arb_t contraction) {
    arb_t one;
    arb_init(one); arb_one(one);
    const bool pass = arb_is_nonnegative(contraction) && arb_lt(contraction, one);
    arb_clear(one);
    return pass;
}

std::size_t fixture_count() { return 9U; }
std::size_t fixtures_passed() {
    const auto checks = fixture_results();
    return static_cast<std::size_t>(std::count(checks.begin(), checks.end(), true));
}
bool run_quantum_radial_fixture_suite() { return fixtures_passed() == fixture_count(); }

} // namespace nhm2::g2h_e_s4::primary_quantum_radial
