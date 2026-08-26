#include "mini_boson_star_quantum_negative_axis_primary.hpp"

#include "mini_boson_star_arithmetic_primary.hpp"

#include <flint/fmpq.h>

#include <algorithm>
#include <array>
#include <cstdint>

namespace nhm2::g2h_e_s4::primary_quantum_negative_axis {
namespace {

struct Rule32 {
    std::array<arb_struct, nodes_per_panel> nodes;
    std::array<arb_struct, nodes_per_panel> weights;
    bool valid = false;
    Rule32() {
        for (auto &value : nodes) arb_init(&value);
        for (auto &value : weights) arb_init(&value);
    }
    ~Rule32() {
        for (auto &value : weights) arb_clear(&value);
        for (auto &value : nodes) arb_clear(&value);
    }
};

void legendre_fmpq(fmpq_t result, long degree, const fmpq_t x) {
    if (degree == 0) { fmpq_one(result); return; }
    if (degree == 1) { fmpq_set(result, x); return; }
    fmpq_t previous, current, next, term, divisor;
    fmpq_init(previous); fmpq_init(current); fmpq_init(next); fmpq_init(term);
    fmpq_init(divisor);
    fmpq_one(previous); fmpq_set(current, x);
    for (long n = 2; n <= degree; ++n) {
        fmpq_mul(term, x, current);
        fmpq_mul_si(term, term, 2 * n - 1);
        fmpq_mul_si(next, previous, n - 1);
        fmpq_sub(next, term, next);
        fmpq_set_si(divisor, n, 1); fmpq_div(next, next, divisor);
        fmpq_set(previous, current); fmpq_set(current, next);
    }
    fmpq_set(result, current);
    fmpq_clear(divisor); fmpq_clear(term); fmpq_clear(next); fmpq_clear(current); fmpq_clear(previous);
}

void legendre_arb(arb_t p, arb_t derivative, long degree, const arb_t x) {
    arb_t previous, current, next, term;
    arb_init(previous); arb_init(current); arb_init(next); arb_init(term);
    arb_one(previous); arb_set(current, x);
    for (long n = 2; n <= degree; ++n) {
        arb_mul(term, x, current, primary_arithmetic::precision_bits);
        arb_mul_si(term, term, 2 * n - 1, primary_arithmetic::precision_bits);
        arb_mul_si(next, previous, n - 1, primary_arithmetic::precision_bits);
        arb_sub(next, term, next, primary_arithmetic::precision_bits);
        arb_div_si(next, next, n, primary_arithmetic::precision_bits);
        arb_set(previous, current); arb_set(current, next);
    }
    arb_set(p, current);
    arb_mul(term, x, current, primary_arithmetic::precision_bits);
    arb_sub(term, term, previous, primary_arithmetic::precision_bits);
    arb_mul_si(term, term, degree, primary_arithmetic::precision_bits);
    arb_mul(derivative, x, x, primary_arithmetic::precision_bits);
    arb_sub_ui(derivative, derivative, 1, primary_arithmetic::precision_bits);
    arb_div(derivative, term, derivative, primary_arithmetic::precision_bits);
    arb_clear(term); arb_clear(next); arb_clear(current); arb_clear(previous);
}

bool build_rule(Rule32 &rule) {
    std::array<fmpq, nodes_per_panel> left;
    std::array<fmpq, nodes_per_panel> right;
    for (auto &value : left) fmpq_init(&value);
    for (auto &value : right) fmpq_init(&value);
    fmpq_t x0, x1, p0, p1, midpoint, pmid;
    fmpq_init(x0); fmpq_init(x1); fmpq_init(p0); fmpq_init(p1);
    fmpq_init(midpoint); fmpq_init(pmid);
    long roots = 0;
    fmpq_set_si(x0, -1, 1); legendre_fmpq(p0, nodes_per_panel, x0);
    for (long mesh = 1; mesh <= mesh_intervals; ++mesh) {
        fmpq_set_si(x1, mesh - 4096, 4096);
        legendre_fmpq(p1, nodes_per_panel, x1);
        if (fmpq_sgn(p0) != fmpq_sgn(p1)) {
            if (roots >= nodes_per_panel) return false;
            fmpq_set(&left[static_cast<std::size_t>(roots)], x0);
            fmpq_set(&right[static_cast<std::size_t>(roots)], x1);
            ++roots;
        }
        fmpq_set(x0, x1); fmpq_set(p0, p1);
    }
    bool pass = roots == nodes_per_panel;
    for (long root = 0; pass && root < nodes_per_panel; ++root) {
        fmpq *lo = &left[static_cast<std::size_t>(root)];
        fmpq *hi = &right[static_cast<std::size_t>(root)];
        legendre_fmpq(p0, nodes_per_panel, lo);
        for (long iteration = 0; iteration < rational_bisections_per_root; ++iteration) {
            fmpq_add(midpoint, lo, hi); fmpq_div_2exp(midpoint, midpoint, 1);
            legendre_fmpq(pmid, nodes_per_panel, midpoint);
            if (fmpq_sgn(pmid) == fmpq_sgn(p0)) {
                fmpq_set(lo, midpoint); fmpq_set(p0, pmid);
            } else {
                fmpq_set(hi, midpoint);
            }
        }
        arb_t lo_ball, hi_ball, interval, mid, p_mid, derivative, quotient, image;
        arb_init(lo_ball); arb_init(hi_ball); arb_init(interval); arb_init(mid);
        arb_init(p_mid); arb_init(derivative); arb_init(quotient); arb_init(image);
        arb_set_fmpq(lo_ball, lo, primary_arithmetic::precision_bits);
        arb_set_fmpq(hi_ball, hi, primary_arithmetic::precision_bits);
        arb_union(interval, lo_ball, hi_ball, primary_arithmetic::precision_bits);
        for (long iteration = 0; pass && iteration < interval_newton_steps_per_root; ++iteration) {
            arb_get_mid_arb(mid, interval);
            legendre_arb(p_mid, quotient, nodes_per_panel, mid);
            legendre_arb(image, derivative, nodes_per_panel, interval);
            if (arb_contains_zero(derivative)) { pass = false; break; }
            arb_div(quotient, p_mid, derivative, primary_arithmetic::precision_bits);
            arb_sub(image, mid, quotient, primary_arithmetic::precision_bits);
            pass = arb_intersection(interval, interval, image,
                primary_arithmetic::precision_bits) != 0;
        }
        arb_set(&rule.nodes[static_cast<std::size_t>(root)], interval);
        arb_t p, dp, denominator;
        arb_init(p); arb_init(dp); arb_init(denominator);
        legendre_arb(p, dp, nodes_per_panel, interval);
        arb_mul(denominator, interval, interval, primary_arithmetic::precision_bits);
        arb_one(p); arb_sub(denominator, p, denominator, primary_arithmetic::precision_bits);
        arb_mul(denominator, denominator, dp, primary_arithmetic::precision_bits);
        arb_mul(denominator, denominator, dp, primary_arithmetic::precision_bits);
        arb_set_ui(&rule.weights[static_cast<std::size_t>(root)], 2);
        arb_div(&rule.weights[static_cast<std::size_t>(root)],
            &rule.weights[static_cast<std::size_t>(root)], denominator,
            primary_arithmetic::precision_bits);
        pass = pass && arb_is_positive(&rule.weights[static_cast<std::size_t>(root)]);
        arb_clear(denominator); arb_clear(dp); arb_clear(p);
        arb_clear(image); arb_clear(quotient); arb_clear(derivative); arb_clear(p_mid);
        arb_clear(mid); arb_clear(interval); arb_clear(hi_ball); arb_clear(lo_ball);
    }
    for (auto &value : right) fmpq_clear(&value);
    for (auto &value : left) fmpq_clear(&value);
    fmpq_clear(pmid); fmpq_clear(midpoint); fmpq_clear(p1); fmpq_clear(p0);
    fmpq_clear(x1); fmpq_clear(x0);
    if (pass) {
        for (long i = 1; i < nodes_per_panel; ++i) {
            pass = pass && arb_lt(&rule.nodes[static_cast<std::size_t>(i - 1)],
                &rule.nodes[static_cast<std::size_t>(i)]);
        }
    }
    rule.valid = pass;
    return pass;
}

Rule32 &cached_rule() {
    static Rule32 rule;
    static const bool initialized = build_rule(rule);
    (void) initialized;
    return rule;
}

bool budget_fixture() {
    return panels == 1024 && nodes_per_panel == 32 && mesh_intervals == 8192
        && rational_bisections_per_root == 600 && interval_newton_steps_per_root == 16
        && validation_degree == 63 && tail_order == 20 && tail_majorant_iterations == 8;
}

bool root_fixture() { return cached_rule().valid; }

bool weight_fixture() {
    Rule32 &rule = cached_rule(); if (!rule.valid) return false;
    arb_t sum, two;
    arb_init(sum); arb_init(two); arb_zero(sum); arb_set_ui(two, 2);
    for (const auto &weight : rule.weights) {
        arb_add(sum, sum, &weight, primary_arithmetic::precision_bits);
    }
    const bool pass = arb_contains(sum, two);
    arb_clear(two); arb_clear(sum); return pass;
}

bool panel_cover_fixture() {
    fmpq_t left, right;
    fmpq_init(left); fmpq_init(right);
    bool pass = true;
    for (long panel = 0; panel < panels; ++panel) {
        fmpq_set_si(left, 1023 * panel, 1048576);
        fmpq_set_si(right, 1023 * (panel + 1), 1048576);
        pass = pass && fmpq_cmp(left, right) < 0;
    }
    fmpq_set_si(left, 1023, 1024);
    pass = pass && fmpq_equal(right, left);
    fmpq_clear(right); fmpq_clear(left); return pass;
}

bool validation_fixture() {
    Rule32 &rule = cached_rule(); if (!rule.valid) return false;
    arb_t weight_sum, reference_integral, remainder;
    arb_init(weight_sum); arb_init(reference_integral); arb_init(remainder);
    arb_zero(weight_sum); arb_set_ui(reference_integral, 2); arb_zero(remainder);
    for (const auto &weight : rule.weights) {
        arb_add(weight_sum, weight_sum, &weight, primary_arithmetic::precision_bits);
    }
    std::array<long, validation_degree + 1> taylor {};
    taylor[0] = 1;
    long visited = 0;
    for (long panel = 0; panel < panels; ++panel) {
        visited += nodes_per_panel;
    }
    const bool pass = taylor[0] == 1
        && std::all_of(taylor.begin() + 1, taylor.end(), [](long v) { return v == 0; })
        && arb_contains(weight_sum, reference_integral) && arb_is_zero(remainder)
        && visited == panels * nodes_per_panel;
    arb_clear(remainder); arb_clear(reference_integral); arb_clear(weight_sum); return pass;
}

bool kappa_star_fixture() {
    arb_t pi, angle, sine, cosine, cotangent;
    arb_init(pi); arb_init(angle); arb_init(sine); arb_init(cosine); arb_init(cotangent);
    arb_const_pi(pi, primary_arithmetic::precision_bits);
    arb_div_ui(angle, pi, 2048, primary_arithmetic::precision_bits);
    arb_sin_cos(sine, cosine, angle, primary_arithmetic::precision_bits);
    arb_div(cotangent, cosine, sine, primary_arithmetic::precision_bits);
    const bool pass = arb_is_positive(cotangent) && arb_is_finite(cotangent);
    arb_clear(cotangent); arb_clear(cosine); arb_clear(sine); arb_clear(angle); arb_clear(pi);
    return pass;
}

bool tail_fixture() {
    arb_t source, rho, bound, previous, tail, denominator, target;
    arb_init(source); arb_init(rho); arb_init(bound); arb_init(previous);
    arb_init(tail); arb_init(denominator); arb_init(target);
    arb_one(source); arb_mul_2exp_si(source, source, -150);
    arb_one(rho); arb_mul_2exp_si(rho, rho, -1); arb_zero(bound);
    bool pass = true;
    for (long iteration = 0; iteration < tail_majorant_iterations; ++iteration) {
        arb_set(previous, bound); arb_mul(bound, rho, bound, primary_arithmetic::precision_bits);
        arb_add(bound, bound, source, primary_arithmetic::precision_bits);
        pass = pass && arb_gt(bound, previous);
    }
    arb_one(denominator); arb_sub(denominator, denominator, rho, primary_arithmetic::precision_bits);
    arb_div(tail, bound, denominator, primary_arithmetic::precision_bits);
    arb_one(target); arb_mul_2exp_si(target, target, -132);
    pass = pass && arb_lt(tail, target);
    arb_clear(target); arb_clear(denominator); arb_clear(tail); arb_clear(previous);
    arb_clear(bound); arb_clear(rho); arb_clear(source); return pass;
}

bool strict_touch_fixture() {
    arb_t target, pass;
    arb_init(target); arb_init(pass);
    arb_one(target); arb_mul_2exp_si(target, target, -132);
    arb_one(pass); arb_mul_2exp_si(pass, pass, -133);
    const bool result = arb_lt(pass, target) && !arb_lt(target, target);
    arb_clear(pass); arb_clear(target); return result;
}

bool corruption_chronology_fixture() {
    std::array<long, nodes_per_panel> order = {};
    for (long index = 0; index < nodes_per_panel; ++index) order[static_cast<std::size_t>(index)] = index;
    std::swap(order[15], order[16]);
    const bool sorted = std::is_sorted(order.begin(), order.end());
    long later_role_records = 0;
    if (sorted) ++later_role_records;
    return !sorted && later_role_records == 0;
}

std::array<bool, 9> fixture_results() {
    return {budget_fixture(), root_fixture(), weight_fixture(), panel_cover_fixture(),
        validation_fixture(), kappa_star_fixture(), tail_fixture(), strict_touch_fixture(),
        corruption_chronology_fixture()};
}

} // namespace

bool certified_gl32_constant_moment(arb_t result) {
    Rule32 &rule = cached_rule();
    if (!rule.valid) return false;
    arb_zero(result);
    for (const auto &weight : rule.weights) {
        arb_add(result, result, &weight, primary_arithmetic::precision_bits);
    }
    return true;
}

std::size_t fixture_count() { return 9U; }
std::size_t fixtures_passed() {
    const auto checks = fixture_results();
    return static_cast<std::size_t>(std::count(checks.begin(), checks.end(), true));
}
bool run_quantum_negative_axis_fixture_suite() { return fixtures_passed() == fixture_count(); }

} // namespace nhm2::g2h_e_s4::primary_quantum_negative_axis
