#include "mini_boson_star_primary_c08_gevrey_v1.hpp"

#include <arb.h>
#include <flint/fmpq.h>

#include <cstdint>
#include <iostream>
#include <string>
#include <vector>

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
            arb_init(&value);
            arb_indeterminate(&value);
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

bool near_rational(arb_srcptr value, long numerator, long denominator) {
    Ball expected, difference, tolerance;
    rational(expected.value, numerator, denominator);
    arb_sub(difference.value, value, expected.value, 512);
    arb_abs(difference.value, difference.value);
    arb_one(tolerance.value);
    arb_mul_2exp_si(tolerance.value, tolerance.value, -400L);
    return arb_lt(difference.value, tolerance.value) != 0;
}

identity::InputIdentity make_identity(identity::Chart chart, std::uint32_t cell,
                                      long nodes, Storage &storage) {
    return {kGrowthHash, kJetHash, kGridHash, kAbiHash, chart, cell, nodes,
            storage.values.size(), storage.values.data()};
}

bool neutral(const gevrey::Result &result) {
    return result.state_coefficients_read == 0U
        && result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created && !result.scientific_handler_linked
        && !result.authority_promoted;
}

bool rejected(gevrey::Input input, gevrey::FailureDetail detail) {
    gevrey::Output output;
    gevrey::Result result{};
    return !gevrey::evaluate(input, &output, &result)
        && !result.accepted && result.detail == detail && neutral(result);
}

std::size_t matrix_index(std::size_t row, std::size_t column) {
    return row * gevrey::kJetCount + column;
}

bool finite_output(const gevrey::Output &output) {
    for (std::size_t lag = 0; lag < gevrey::kLagCount; ++lag) {
        if (!arb_is_finite(output.gevrey_majorants + lag)) return false;
        for (std::size_t index = 0; index < gevrey::kMatrixEntries; ++index) {
            if (!arb_is_finite(output.a2[lag] + index)
                || !arb_is_finite(output.a1[lag] + index)
                || !arb_is_finite(output.a0[lag] + index)) return false;
        }
    }
    for (const auto &norm : output.base_norms) {
        if (!arb_is_finite(&norm)) return false;
    }
    return arb_is_finite(output.selected_rate)
        && arb_is_finite(output.base_constant);
}

}  // namespace

int main() {
    std::vector<bool> checks;
    Storage positive_storage(514U);
    Storage vacuum_storage(2049U);
    auto positive_identity = make_identity(identity::Chart::positive, 1U, 64L,
                                           positive_storage);
    auto vacuum_identity = make_identity(identity::Chart::vacuum, 0U, 256L,
                                         vacuum_storage);

    Ball h0, kappa, mass, eta;
    arb_one(h0.value); rational(kappa.value, 1L, 2L);
    rational(mass.value, 1L, 4L); arb_indeterminate(eta.value);
    margins::Input positive_margins{&positive_identity, true, h0.value,
                                    kappa.value, mass.value, eta.value};
    gevrey::Input positive{positive_margins};
    gevrey::Output positive_output;
    gevrey::Result positive_result{};
    checks.push_back(gevrey::evaluate(positive, &positive_output, &positive_result)
        && positive_result.accepted
        && positive_result.detail == gevrey::FailureDetail::none);
    checks.push_back(near_rational(positive_output.gevrey_majorants + 0, 311L, 8L)
        && near_rational(positive_output.gevrey_majorants + 1, 755L, 8L)
        && near_rational(positive_output.gevrey_majorants + 2, 5297L, 64L));
    checks.push_back(positive_output.selected_exponent == 7U
        && positive_result.selected_exponent == 7U
        && equal_rational(positive_output.selected_rate, 128L, 1L)
        && positive_result.rate_attempts == 8U);
    checks.push_back(near_rational(positive_output.base_norms + 0, 1L, 1L)
        && near_rational(positive_output.base_norms + 1, 12L, 1L)
        && near_rational(positive_output.base_norms + 2, 11L, 2L)
        && near_rational(positive_output.base_constant, 2L, 1L));
    checks.push_back(positive_result.directed_coefficient_balls == 1521U
        && positive_result.majorant_rows_checked == 39U
        && positive_result.base_jet_components_checked == 39U
        && positive_result.directed_upper_bounds_used
        && !positive_result.midpoint_acceptance_used);
    checks.push_back(neutral(positive_result) && finite_output(positive_output));

    const std::size_t value = 0U;
    const std::size_t d_kappa = 2U;
    const std::size_t d_kappa_kappa = 8U;
    checks.push_back(equal_rational(positive_output.a2[0]
            + matrix_index(value, value), -1L, 1L)
        && equal_rational(positive_output.a2[1]
            + matrix_index(value, value), 1L, 1L)
        && equal_rational(positive_output.a2[2]
            + matrix_index(value, value), -1L, 4L));
    checks.push_back(equal_rational(positive_output.a2[0]
            + matrix_index(d_kappa, value), 2L, 1L)
        && equal_rational(positive_output.a2[0]
            + matrix_index(d_kappa_kappa, value), -8L, 1L)
        && equal_rational(positive_output.a2[0]
            + matrix_index(d_kappa_kappa, d_kappa), 4L, 1L)
        && equal_rational(positive_output.a2[0]
            + matrix_index(d_kappa_kappa, d_kappa_kappa), -1L, 1L));
    bool mixed_orientations = true;
    for (std::size_t lag = 0; lag < gevrey::kLagCount; ++lag) {
        for (const auto *matrix : {positive_output.a2[lag], positive_output.a1[lag],
                                   positive_output.a0[lag]}) {
            mixed_orientations = mixed_orientations
                && arb_equal(matrix + matrix_index(5U, value),
                             matrix + matrix_index(7U, value));
        }
    }
    checks.push_back(mixed_orientations);

    Ball mbar;
    rational(mbar.value, 1L, 2L); rational(eta.value, 1L, 2L);
    margins::Input vacuum_margins{&vacuum_identity, true, h0.value,
                                  kappa.value, mbar.value, eta.value};
    gevrey::Input vacuum{vacuum_margins};
    gevrey::Output vacuum_output;
    gevrey::Result vacuum_result{};
    checks.push_back(gevrey::evaluate(vacuum, &vacuum_output, &vacuum_result)
        && vacuum_result.accepted && neutral(vacuum_result));
    checks.push_back(near_rational(vacuum_output.gevrey_majorants + 0, 289L, 8L)
        && near_rational(vacuum_output.gevrey_majorants + 1, 593L, 8L)
        && near_rational(vacuum_output.gevrey_majorants + 2, 2103L, 64L));
    checks.push_back(vacuum_output.selected_exponent == 7U
        && equal_rational(vacuum_output.selected_rate, 128L, 1L)
        && near_rational(vacuum_output.base_norms + 0, 1L, 1L)
        && near_rational(vacuum_output.base_norms + 1, 5L, 1L)
        && near_rational(vacuum_output.base_norms + 2, 11L, 8L)
        && near_rational(vacuum_output.base_constant, 2L, 1L));
    checks.push_back(finite_output(vacuum_output)
        && vacuum_result.directed_coefficient_balls == 1521U);

    auto blocked = positive;
    blocked.margins.predecessor_c08_003_passed = false;
    checks.push_back(rejected(blocked, gevrey::FailureDetail::predecessor_not_passed));
    auto missing_identity = positive;
    missing_identity.margins.identity = nullptr;
    checks.push_back(rejected(missing_identity,
        gevrey::FailureDetail::predecessor_not_passed));
    gevrey::Result missing_output_result{};
    checks.push_back(!gevrey::evaluate(positive, nullptr, &missing_output_result)
        && missing_output_result.detail == gevrey::FailureDetail::missing_output
        && neutral(missing_output_result));
    checks.push_back(!gevrey::evaluate(positive, &positive_output, nullptr));

    Ball zero, indeterminate, negative;
    arb_zero(zero.value); arb_indeterminate(indeterminate.value);
    arb_set_si(negative.value, -1L);
    auto touching_kappa = positive;
    touching_kappa.margins.kappa = zero.value;
    checks.push_back(rejected(touching_kappa,
        gevrey::FailureDetail::predecessor_not_passed));
    auto nonfinite_mass = positive;
    nonfinite_mass.margins.theta2 = indeterminate.value;
    checks.push_back(rejected(nonfinite_mass,
        gevrey::FailureDetail::predecessor_not_passed));
    auto bad_eta = vacuum;
    bad_eta.margins.eta = negative.value;
    checks.push_back(rejected(bad_eta,
        gevrey::FailureDetail::predecessor_not_passed));

    Ball box_kappa, box_mass;
    rational(box_kappa.value, 1L, 2L);
    arb_add_error_2exp_si(box_kappa.value, -10L);
    rational(box_mass.value, 1L, 4L);
    arb_add_error_2exp_si(box_mass.value, -10L);
    auto compact_box = positive;
    compact_box.margins.kappa = box_kappa.value;
    compact_box.margins.theta2 = box_mass.value;
    gevrey::Output box_output;
    gevrey::Result box_result{};
    checks.push_back(gevrey::evaluate(compact_box, &box_output, &box_result)
        && box_result.accepted && box_result.directed_upper_bounds_used
        && !box_result.midpoint_acceptance_used && neutral(box_result)
        && arb_is_positive(box_output.base_constant));

    Ball tiny_kappa;
    arb_one(tiny_kappa.value); arb_mul_2exp_si(tiny_kappa.value,
                                               tiny_kappa.value, -2000L);
    auto exhausted = positive;
    exhausted.margins.kappa = tiny_kappa.value;
    gevrey::Output exhausted_output;
    gevrey::Result exhausted_result{};
    checks.push_back(!gevrey::evaluate(exhausted, &exhausted_output,
                                       &exhausted_result)
        && exhausted_result.detail == gevrey::FailureDetail::rate_exhaustion
        && exhausted_result.rate_attempts == 1025U && neutral(exhausted_result));
    checks.push_back(std::string(gevrey::failure_detail_name(
        gevrey::FailureDetail::rate_exhaustion))
        == "C08-005_GEVREY_MAJORANT_OR_RATE_EXHAUSTION");
    checks.push_back(gevrey::kJetCount == 13U
        && gevrey::kMatrixEntries == 169U
        && gevrey::kMaximumRateExponent == 1024U);

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
        "\"schema\":\"nhm2.g2h_e_s5.primary_c08_gevrey_fixture.v1\","
        "\"scientific_handler_linked\":false,\"state_coefficients_read\":0,"
        "\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL")
        << "\"}\n";
    return passed == checks.size() ? 0 : 1;
}
