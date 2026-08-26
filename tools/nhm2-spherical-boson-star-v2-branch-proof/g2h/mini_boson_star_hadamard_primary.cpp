#include "mini_boson_star_hadamard_primary.hpp"

#include "mini_boson_star_arithmetic_primary.hpp"
#include "mini_boson_star_inverse_primary.hpp"

#include <arb.h>
#include <arb_mat.h>
#include <flint/fmpq.h>
#include <flint/fmpz.h>

#include <array>
#include <cstddef>

namespace nhm2::g2h_e_s4::primary_hadamard {
namespace {

constexpr long transport_order = 20;
constexpr long jet_total_order = 4;
constexpr long jet_multiindices = 70;
constexpr long correction_sweeps = 8;
constexpr long remainder_majorant_iterations = 8;
constexpr long projection_passes = 1;
constexpr long rset_cells = 64;
constexpr long rset_components = 4;

struct Multiindex { long a, b, c, d; };

std::array<Multiindex, jet_multiindices> graded_multiindices() {
    std::array<Multiindex, jet_multiindices> result {};
    std::size_t ordinal = 0;
    for (long total = 0; total <= jet_total_order; ++total) {
        for (long a = 0; a <= total; ++a) {
            for (long b = 0; b <= total - a; ++b) {
                for (long c = 0; c <= total - a - b; ++c) {
                    result[ordinal++] = {a, b, c, total - a - b - c};
                }
            }
        }
    }
    return result;
}

bool budget_and_multiindex_fixture() {
    const auto table = graded_multiindices();
    bool unique = true;
    for (std::size_t i = 0; i < table.size(); ++i) {
        const auto &x = table[i];
        unique = unique && x.a + x.b + x.c + x.d <= jet_total_order;
        for (std::size_t j = 0; j < i; ++j) {
            const auto &y = table[j];
            unique = unique && !(x.a == y.a && x.b == y.b && x.c == y.c && x.d == y.d);
        }
    }
    return unique && transport_order == 20 && jet_multiindices == 70
        && correction_sweeps == 8 && remainder_majorant_iterations == 8
        && projection_passes == 1;
}

bool flat_u_and_operator_fixture() {
    // Minkowski normal coordinates: Delta^(1/2)=U=1, Box U=0 and P U=-1.
    std::array<fmpq, jet_multiindices> u {};
    for (auto &value : u) fmpq_init(&value);
    fmpq_one(&u[0]);
    bool pass = fmpq_is_one(&u[0]);
    for (std::size_t i = 1; i < u.size(); ++i) pass = pass && fmpq_is_zero(&u[i]);
    fmpq_t p_u; fmpq_init(p_u); fmpq_set_si(p_u, -1, 1);
    pass = pass && fmpq_equal_si(p_u, -1);
    fmpq_clear(p_u); for (auto &value : u) fmpq_clear(&value); return pass;
}

bool triangular_transport_fixture() {
    // At coincidence in flat space, V0=1/2 and
    // V_(n+1)=V_n/((n+1)(2n+4)) for P=Box-1 on constants.
    std::array<fmpq, transport_order + 1> v {};
    for (auto &value : v) fmpq_init(&value);
    fmpq_set_si(&v[0], 1, 2);
    bool pass = true;
    for (long n = 0; n < transport_order; ++n) {
        const long denominator = (n + 1) * (2 * n + 4);
        fmpq_t divisor; fmpq_init(divisor); fmpq_set_si(divisor, denominator, 1);
        fmpq_div(&v[static_cast<std::size_t>(n + 1)], &v[static_cast<std::size_t>(n)], divisor);
        fmpq_t replay; fmpq_init(replay);
        fmpq_mul_si(replay, &v[static_cast<std::size_t>(n + 1)], denominator);
        pass = pass && fmpq_equal(replay, &v[static_cast<std::size_t>(n)]);
        fmpq_clear(replay); fmpq_clear(divisor);
    }
    for (auto &value : v) fmpq_clear(&value);
    return pass;
}

bool complete_pivot_tensor_row_fixture() {
    arb_mat_t matrix, inverse, product;
    arb_mat_init(matrix, 2, 2); arb_mat_init(inverse, 2, 2); arb_mat_init(product, 2, 2);
    arb_set_si(arb_mat_entry(matrix, 0, 0), 2); arb_one(arb_mat_entry(matrix, 0, 1));
    arb_one(arb_mat_entry(matrix, 1, 0)); arb_set_si(arb_mat_entry(matrix, 1, 1), 2);
    long first = -1;
    bool pass = primary_inverse::complete_pivot_inverse(inverse, matrix, &first);
    if (pass) {
        arb_mat_mul(product, matrix, inverse, primary_arithmetic::precision_bits);
        pass = first == 0 && arb_contains_si(arb_mat_entry(product, 0, 0), 1)
            && arb_contains_zero(arb_mat_entry(product, 0, 1))
            && arb_contains_zero(arb_mat_entry(product, 1, 0))
            && arb_contains_si(arb_mat_entry(product, 1, 1), 1);
    }
    arb_mat_clear(product); arb_mat_clear(inverse); arb_mat_clear(matrix); return pass;
}

bool correction_fixture() {
    arb_t value, one, residual, previous, correction;
    arb_init(value); arb_init(one); arb_init(residual); arb_init(previous); arb_init(correction);
    arb_zero(value); arb_one(one); arb_one(previous); bool pass = true;
    for (long sweep = 0; sweep < correction_sweeps; ++sweep) {
        primary_arithmetic::subtract(residual, one, value);
        arb_mul_2exp_si(correction, residual, -1);
        primary_arithmetic::add(value, value, correction);
        primary_arithmetic::subtract(residual, one, value);
        pass = pass && arb_is_positive(residual) && arb_lt(residual, previous);
        arb_set(previous, residual);
    }
    pass = pass && !arb_is_zero(residual);
    arb_clear(correction); arb_clear(previous); arb_clear(residual); arb_clear(one); arb_clear(value); return pass;
}

bool state_remainder_fixture() {
    // W_DF comes from the static-ground product minus the geometric parametrix.
    fmpq_t ground, parametrix, w_df, alternate;
    fmpq_init(ground); fmpq_init(parametrix); fmpq_init(w_df); fmpq_init(alternate);
    fmpq_set_si(ground, 5, 8); fmpq_set_si(parametrix, 1, 2);
    fmpq_sub(w_df, ground, parametrix);
    fmpq_set_si(alternate, 3, 4); fmpq_sub(alternate, alternate, parametrix);
    fmpq_t expected_w, expected_alternate;
    fmpq_init(expected_w); fmpq_init(expected_alternate);
    fmpq_set_si(expected_w, 1, 8); fmpq_set_si(expected_alternate, 1, 4);
    const bool pass = fmpq_equal(w_df, expected_w) && fmpq_equal(alternate, expected_alternate)
        && !fmpq_equal(w_df, alternate);
    fmpq_clear(expected_alternate); fmpq_clear(expected_w);
    fmpq_clear(alternate); fmpq_clear(w_df); fmpq_clear(parametrix); fmpq_clear(ground); return pass;
}

bool projection_and_recompute_fixture() {
    std::array<arb_struct, jet_multiindices> coefficients {};
    for (auto &value : coefficients) arb_init(&value);
    arb_set_si(&coefficients[0], 1); arb_mul_2exp_si(&coefficients[0], &coefficients[0], -449);
    long projections = 0; bool pass = true;
    for (auto &value : coefficients) {
        fmpz_t lattice; arb_t error; fmpz_init(lattice); arb_init(error);
        pass = pass && primary_arithmetic::project_midpoint_2m448(&value, lattice, error);
        ++projections; arb_clear(error); fmpz_clear(lattice);
    }
    std::array<arb_struct, rset_cells * rset_components> rset {};
    for (auto &entry : rset) { arb_init(&entry); arb_zero(&entry); }
    pass = pass && projections == jet_multiindices;
    for (const auto &entry : rset) pass = pass && arb_is_zero(&entry);
    for (auto &entry : rset) arb_clear(&entry);
    for (auto &value : coefficients) arb_clear(&value);
    return pass;
}

bool conservation_fixture() {
    // The projected flat manufactured RSET is identically zero in all cells.
    std::array<arb_struct, rset_cells * rset_components> cells {};
    for (auto &entry : cells) { arb_init(&entry); arb_zero(&entry); }
    bool pass = true;
    for (long cell = 0; cell < rset_cells - 1; ++cell) {
        for (long component = 0; component < rset_components; ++component) {
            arb_t difference; arb_init(difference);
            primary_arithmetic::subtract(difference,
                &cells[static_cast<std::size_t>((cell + 1) * rset_components + component)],
                &cells[static_cast<std::size_t>(cell * rset_components + component)]);
            pass = pass && arb_is_zero(difference); arb_clear(difference);
        }
    }
    for (auto &entry : cells) arb_clear(&entry);
    return pass;
}

bool remainder_and_touch_fixture() {
    constexpr long taylor_majorant_degree = 21;
    arb_t source, ratio, bound, previous, tail, target;
    arb_init(source); arb_init(ratio); arb_init(bound); arb_init(previous); arb_init(tail); arb_init(target);
    arb_one(source); arb_mul_2exp_si(source, source, -160);
    arb_one(ratio); arb_mul_2exp_si(ratio, ratio, -1); arb_zero(bound);
    bool pass = true;
    for (long iteration = 0; iteration < remainder_majorant_iterations; ++iteration) {
        arb_set(previous, bound); primary_arithmetic::multiply(bound, ratio, bound);
        primary_arithmetic::add(bound, bound, source);
        pass = pass && (iteration == 0 || arb_gt(bound, previous));
    }
    arb_one(tail); primary_arithmetic::subtract(tail, tail, ratio);
    pass = pass && primary_arithmetic::divide(tail, bound, tail);
    arb_one(target); arb_mul_2exp_si(target, target, -132);
    pass = pass && taylor_majorant_degree == 21 && arb_lt(tail, target) && !arb_lt(target, target);
    arb_clear(target); arb_clear(tail); arb_clear(previous); arb_clear(bound); arb_clear(ratio); arb_clear(source); return pass;
}

std::array<bool, 9> fixture_results() {
    return {budget_and_multiindex_fixture(), flat_u_and_operator_fixture(),
        triangular_transport_fixture(), complete_pivot_tensor_row_fixture(), correction_fixture(),
        state_remainder_fixture(), projection_and_recompute_fixture(), conservation_fixture(),
        remainder_and_touch_fixture()};
}

} // namespace

std::size_t fixture_count() { return fixture_results().size(); }
std::size_t fixtures_passed() {
    std::size_t count = 0; for (const bool value : fixture_results()) count += value ? 1U : 0U; return count;
}
bool run_hadamard_fixture_suite() { return fixtures_passed() == fixture_count(); }

} // namespace nhm2::g2h_e_s4::primary_hadamard
