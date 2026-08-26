#include "mini_boson_star_primary_c08_origin_series_v1.hpp"

#include <arb.h>
#include <flint/fmpq.h>

#include <cstdint>
#include <iostream>
#include <string>
#include <vector>

namespace origin = nhm2::g2h_e_s5::primary_c08_origin_series_v1;
namespace gevrey = nhm2::g2h_e_s5::primary_c08_gevrey_v1;
namespace margins = nhm2::g2h_e_s5::primary_c08_margins_v1;
namespace identity = nhm2::g2h_e_s5::primary_c08_identity_v1;

namespace {

constexpr char kGrowthHash[] = "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737";
constexpr char kJetHash[] = "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc";
constexpr char kGridHash[] = "cd98fb110a6d0d94cd69d1134e8f5233444ea34f7894bc14333075d0dfa5013c";
constexpr char kAbiHash[] = "6fbf6cdbb80e6da390c84f6d87f13f37f2b81b2226bf937cbcfd2c8aff3911ca";

struct Ball {
    Ball() { arb_init(value); }
    ~Ball() { arb_clear(value); }
    arb_t value;
};

struct Storage {
    explicit Storage(std::size_t count) : values(count) {
        for (auto &value : values) {
            arb_init(&value); arb_indeterminate(&value);
        }
    }
    ~Storage() { for (auto &value : values) arb_clear(&value); }
    std::vector<arb_struct> values;
};

void rational(arb_t value, long numerator, long denominator) {
    fmpq_t q;
    fmpq_init(q); fmpq_set_si(q, numerator, denominator);
    arb_set_fmpq(value, q, 512); fmpq_clear(q);
}

bool equal_rational(arb_srcptr value, long numerator, long denominator) {
    Ball expected;
    rational(expected.value, numerator, denominator);
    return arb_equal(value, expected.value) != 0;
}

identity::InputIdentity make_identity(identity::Chart chart, std::uint32_t cell,
                                      long nodes, Storage &storage) {
    return {kGrowthHash, kJetHash, kGridHash, kAbiHash, chart, cell, nodes,
            storage.values.size(), storage.values.data()};
}

bool neutral(const origin::Result &result) {
    return result.state_coefficients_read == 0U
        && result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created && !result.scientific_handler_linked
        && !result.authority_promoted;
}

bool rejected(origin::Input input, origin::FailureDetail detail) {
    origin::Output output;
    origin::Result result{};
    return !origin::evaluate(input, &output, &result)
        && !result.accepted && result.detail == detail && neutral(result);
}

bool all_finite(const origin::Output &output) {
    if (!arb_is_finite(output.t0) || !arb_is_finite(output.geometric_ratio))
        return false;
    for (std::size_t jet = 0; jet < origin::kJetCount; ++jet) {
        for (std::size_t kind = 0; kind < origin::kTailKindCount; ++kind) {
            if (!arb_is_finite(output.partial_values[jet] + kind)
                || !arb_is_finite(output.tail_bounds[jet] + kind)
                || !arb_is_finite(output.enclosed_values[jet] + kind))
                return false;
        }
    }
    return true;
}

bool all_widths_pass(const origin::Output &output) {
    Ball radius, magnitude, scale, tolerance;
    for (std::size_t jet = 0; jet < origin::kJetCount; ++jet) {
        for (std::size_t kind = 0; kind < origin::kTailKindCount; ++kind) {
            arb_get_rad_arb(radius.value, output.enclosed_values[jet] + kind);
            arb_abs(magnitude.value, output.enclosed_values[jet] + kind);
            arb_one(scale.value);
            if (arb_gt(magnitude.value, scale.value))
                arb_set(scale.value, magnitude.value);
            arb_mul_2exp_si(tolerance.value, scale.value, -180L);
            if (!arb_le(radius.value, tolerance.value)) return false;
        }
    }
    return true;
}

bool reference_b_tail(arb_srcptr value) {
    Ball expected, difference, tolerance;
    arb_one(expected.value);
    arb_mul_2exp_si(expected.value, expected.value, -255L);
    arb_div_ui(expected.value, expected.value, 3UL, 512);
    arb_sub(difference.value, value, expected.value, 512);
    arb_abs(difference.value, difference.value);
    arb_one(tolerance.value);
    arb_mul_2exp_si(tolerance.value, tolerance.value, -700L);
    return arb_lt(difference.value, tolerance.value) != 0;
}

bool scalar_ode_value_compatibility(const origin::Output &output,
                                    arb_srcptr kappa, arb_srcptr mu) {
    Ball k2, k3, k4, mu2, t2, p2, p1, p0, pj1, pj2;
    Ball term, term2, numerator, rhs;
    arb_mul(k2.value, kappa, kappa, 512);
    arb_mul(k3.value, k2.value, kappa, 512);
    arb_mul(k4.value, k2.value, k2.value, 512);
    arb_mul(mu2.value, mu, mu, 512);
    arb_mul(t2.value, output.t0, output.t0, 512);
    arb_mul_ui(term.value, kappa, 2UL, 512);
    arb_add(term.value, term.value, output.t0, 512);
    arb_mul(p2.value, output.t0, term.value, 512);

    arb_mul(term.value, mu, k2.value, 512);
    arb_mul(term.value, term.value, output.t0, 512);
    arb_mul_ui(numerator.value, term.value, 2UL, 512);
    arb_mul(term.value, mu, kappa, 512);
    arb_mul(term.value, term.value, t2.value, 512);
    arb_mul_ui(term.value, term.value, 2UL, 512);
    arb_add(numerator.value, numerator.value, term.value, 512);
    arb_mul(term.value, mu, output.t0, 512);
    arb_add(numerator.value, numerator.value, term.value, 512);
    arb_sub(numerator.value, numerator.value, k2.value, 512);
    arb_mul(term.value, kappa, output.t0, 512);
    arb_sub(numerator.value, numerator.value, term.value, 512);
    arb_mul_si(numerator.value, numerator.value, -2L, 512);
    arb_div(p1.value, numerator.value, kappa, 512);

    arb_mul(term.value, mu, k4.value, 512);
    arb_mul_si(numerator.value, term.value, -8L, 512);
    arb_mul(term.value, mu, k3.value, 512);
    arb_mul(term.value, term.value, output.t0, 512);
    arb_mul_si(term.value, term.value, -8L, 512);
    arb_add(numerator.value, numerator.value, term.value, 512);
    arb_mul(term.value, mu, k2.value, 512);
    arb_mul(term.value, term.value, t2.value, 512);
    arb_mul_ui(term.value, term.value, 4UL, 512);
    arb_add(numerator.value, numerator.value, term.value, 512);
    arb_mul(term.value, mu, k2.value, 512);
    arb_mul_ui(term.value, term.value, 4UL, 512);
    arb_add(numerator.value, numerator.value, term.value, 512);
    arb_mul(term.value, mu, kappa, 512);
    arb_mul(term.value, term.value, output.t0, 512);
    arb_mul_ui(term.value, term.value, 8UL, 512);
    arb_add(numerator.value, numerator.value, term.value, 512);
    arb_add(numerator.value, numerator.value, mu, 512);
    arb_mul(term.value, k2.value, output.t0, 512);
    arb_mul_ui(term.value, term.value, 2UL, 512);
    arb_sub(numerator.value, numerator.value, term.value, 512);
    arb_sub(numerator.value, numerator.value, kappa, 512);
    arb_mul(numerator.value, numerator.value, mu, 512);
    arb_div(p0.value, numerator.value, k2.value, 512);

    arb_mul_ui(term.value, kappa, 2UL, 512);
    arb_mul(term.value, term.value, output.t0, 512);
    arb_add_ui(term.value, term.value, 1UL, 512);
    arb_mul(term2.value, mu, k2.value, 512);
    arb_mul_ui(term2.value, term2.value, 4UL, 512);
    arb_mul_si(numerator.value, mu, -2L, 512);
    arb_add(term2.value, term2.value, numerator.value, 512);
    arb_sub(term2.value, term2.value, kappa, 512);
    arb_mul(pj1.value, mu2.value, term.value, 512);
    arb_mul(pj1.value, pj1.value, term2.value, 512);
    arb_mul_ui(pj1.value, pj1.value, 2UL, 512);
    arb_div(pj1.value, pj1.value, k2.value, 512);
    arb_mul(term.value, mu, k2.value, 512);
    arb_mul_ui(term.value, term.value, 2UL, 512);
    arb_sub(term.value, term.value, mu, 512);
    arb_sub(term.value, term.value, kappa, 512);
    arb_mul(pj2.value, term.value, term.value, 512);
    arb_mul(pj2.value, pj2.value, mu2.value, 512);
    arb_mul_ui(pj2.value, pj2.value, 4UL, 512);
    arb_div(pj2.value, pj2.value, k2.value, 512);

    arb_mul(numerator.value, p1.value,
            output.enclosed_values[0] + static_cast<std::size_t>(origin::TailKind::V), 512);
    arb_mul(term.value, p0.value,
            output.enclosed_values[0] + static_cast<std::size_t>(origin::TailKind::B), 512);
    arb_add(numerator.value, numerator.value, term.value, 512);
    arb_mul(term.value, pj1.value,
            output.enclosed_values[0] + static_cast<std::size_t>(origin::TailKind::J1), 512);
    arb_add(numerator.value, numerator.value, term.value, 512);
    arb_mul(term.value, pj2.value,
            output.enclosed_values[0] + static_cast<std::size_t>(origin::TailKind::J2), 512);
    arb_add(numerator.value, numerator.value, term.value, 512);
    arb_neg(numerator.value, numerator.value);
    arb_div(rhs.value, numerator.value, p2.value, 512);
    return arb_overlaps(rhs.value, output.enclosed_values[0]
        + static_cast<std::size_t>(origin::TailKind::B_second)) != 0;
}

}  // namespace

int main() {
    std::vector<bool> checks;
    Storage positive_storage(514U), vacuum_storage(2049U);
    auto positive_identity = make_identity(identity::Chart::positive, 1U, 64L,
                                           positive_storage);
    auto vacuum_identity = make_identity(identity::Chart::vacuum, 0U, 256L,
                                         vacuum_storage);
    Ball h0, kappa, mass, eta;
    arb_one(h0.value); rational(kappa.value, 1L, 2L);
    rational(mass.value, 1L, 4L); arb_indeterminate(eta.value);
    margins::Input positive_margins{&positive_identity, true, h0.value,
                                    kappa.value, mass.value, eta.value};
    origin::Input positive{{positive_margins}};
    origin::Output positive_output;
    origin::Result positive_result{};
    checks.push_back(origin::evaluate(positive, &positive_output, &positive_result)
        && positive_result.accepted
        && positive_result.detail == origin::FailureDetail::none);
    checks.push_back(positive_output.selected_order == 128U
        && positive_result.selected_order == 128U
        && positive_result.order_attempts == 5U
        && positive_result.first_passing_order_used);
    checks.push_back(equal_rational(positive_output.t0, 1L, 512L)
        && equal_rational(positive_output.geometric_ratio, 1L, 4L));
    checks.push_back(positive_result.recurrence_coefficients_generated == 129U
        && positive_result.tail_enclosures_checked >= 65U
        && positive_result.origin_compatibility_checks == 15U);
    checks.push_back(positive_result.directed_upper_bounds_used
        && !positive_result.midpoint_acceptance_used && neutral(positive_result));
    checks.push_back(all_finite(positive_output) && all_widths_pass(positive_output));
    checks.push_back(reference_b_tail(positive_output.tail_bounds[0]
        + static_cast<std::size_t>(origin::TailKind::B)));
    checks.push_back(scalar_ode_value_compatibility(positive_output,
                                                    kappa.value, mass.value));
    bool repeated_tail_inventory = true;
    for (std::size_t jet = 1U; jet < origin::kJetCount; ++jet) {
        for (std::size_t kind = 0; kind < origin::kTailKindCount; ++kind) {
            repeated_tail_inventory = repeated_tail_inventory
                && arb_equal(positive_output.tail_bounds[0] + kind,
                             positive_output.tail_bounds[jet] + kind);
        }
    }
    checks.push_back(repeated_tail_inventory);

    Ball mbar;
    rational(mbar.value, 1L, 2L); rational(eta.value, 1L, 2L);
    margins::Input vacuum_margins{&vacuum_identity, true, h0.value,
                                  kappa.value, mbar.value, eta.value};
    origin::Input vacuum{{vacuum_margins}};
    origin::Output vacuum_output;
    origin::Result vacuum_result{};
    checks.push_back(origin::evaluate(vacuum, &vacuum_output, &vacuum_result)
        && vacuum_result.accepted && vacuum_output.selected_order == 128U
        && vacuum_result.order_attempts == 5U && neutral(vacuum_result));
    checks.push_back(equal_rational(vacuum_output.t0, 1L, 512L)
        && equal_rational(vacuum_output.geometric_ratio, 1L, 4L)
        && all_finite(vacuum_output) && all_widths_pass(vacuum_output));

    auto blocked = positive;
    blocked.gevrey.margins.predecessor_c08_003_passed = false;
    checks.push_back(rejected(blocked, origin::FailureDetail::predecessor_not_passed));
    auto missing_identity = positive;
    missing_identity.gevrey.margins.identity = nullptr;
    checks.push_back(rejected(missing_identity,
        origin::FailureDetail::predecessor_not_passed));
    origin::Result missing_output_result{};
    checks.push_back(!origin::evaluate(positive, nullptr, &missing_output_result)
        && missing_output_result.detail == origin::FailureDetail::missing_output
        && neutral(missing_output_result));
    checks.push_back(!origin::evaluate(positive, &positive_output, nullptr));

    Ball nonfinite;
    arb_indeterminate(nonfinite.value);
    auto corrupt = positive;
    corrupt.gevrey.margins.theta2 = nonfinite.value;
    checks.push_back(rejected(corrupt, origin::FailureDetail::predecessor_not_passed));

    Ball narrow_h0;
    arb_one(narrow_h0.value); arb_add_error_2exp_si(narrow_h0.value, -240L);
    auto narrow_box = positive;
    narrow_box.gevrey.margins.h0 = narrow_h0.value;
    origin::Output narrow_output;
    origin::Result narrow_result{};
    checks.push_back(origin::evaluate(narrow_box, &narrow_output, &narrow_result)
        && narrow_result.accepted && narrow_output.selected_order == 128U
        && narrow_result.directed_upper_bounds_used && neutral(narrow_result));

    Ball tiny_kappa;
    arb_one(tiny_kappa.value);
    arb_mul_2exp_si(tiny_kappa.value, tiny_kappa.value, -180L);
    auto exhausted = positive;
    exhausted.gevrey.margins.kappa = tiny_kappa.value;
    origin::Output exhausted_output;
    origin::Result exhausted_result{};
    checks.push_back(!origin::evaluate(exhausted, &exhausted_output,
                                       &exhausted_result)
        && exhausted_result.detail
            == origin::FailureDetail::origin_series_order_exhaustion
        && exhausted_result.order_attempts == 7U
        && exhausted_result.recurrence_coefficients_generated == 257U
        && neutral(exhausted_result));
    checks.push_back(std::string(origin::failure_detail_name(
        origin::FailureDetail::origin_series_order_exhaustion))
        == "C08-006_ORIGIN_SERIES_ORDER_EXHAUSTION");
    checks.push_back(origin::kOrderCandidateCount == 7U
        && origin::kMaximumOriginOrder == 256U
        && origin::kTailKindCount == 5U && origin::kJetCount == 13U);

    std::size_t passed = 0U;
    std::uint64_t mask = 0U;
    for (std::size_t index = 0; index < checks.size(); ++index) {
        if (checks[index]) {
            ++passed;
            if (index < 64U) mask |= std::uint64_t{1} << index;
        }
    }
    std::cout << "{\"authority_promoted\":false,\"candidate_evaluations\":0,"
        "\"candidate_roots_created\":false,\"checks_passed\":" << passed
        << ",\"checks_total\":" << checks.size() << ",\"fixture_mask\":" << mask
        << ",\"midpoint_acceptance_used\":false,\"positive_parameter_samples\":0,"
        "\"schema\":\"nhm2.g2h_e_s5.primary_c08_origin_series_fixture.v1\","
        "\"scientific_handler_linked\":false,\"state_coefficients_read\":0,"
        "\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL")
        << "\"}\n";
    return passed == checks.size() ? 0 : 1;
}
