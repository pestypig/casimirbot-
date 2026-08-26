#include "mini_boson_star_primary_c08_analytic_parameter_jets_v1.hpp"

#include <flint/fmpq.h>

#include <cstddef>
#include <iostream>
#include <vector>

namespace analytic =
    nhm2::g2h_e_s5::primary_c08_analytic_parameter_jets_v1;

namespace {

struct Ball {
    Ball() { arb_init(value); }
    ~Ball() { arb_clear(value); }
    arb_t value;
};

void rational(arb_t value, long numerator, long denominator) {
    fmpq_t q;
    fmpq_init(q); fmpq_set_si(q, numerator, denominator);
    arb_set_fmpq(value, q, analytic::kPrecisionBits);
    fmpq_clear(q);
}

bool contains(arb_srcptr value, long numerator, long denominator) {
    Ball expected;
    rational(expected.value, numerator, denominator);
    return arb_contains(value, expected.value);
}

bool neutral(const analytic::Result &result) {
    return result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created
        && !result.scientific_handler_linked
        && !result.authority_promoted;
}

}  // namespace

int main() {
    std::vector<bool> checks;
    Ball kappa, theta2, eta;
    rational(kappa.value, 1L, 2L);
    rational(theta2.value, 1L, 4L);
    arb_indeterminate(eta.value);
    analytic::Output positive;
    analytic::Result positive_result{};
    const analytic::Input positive_input{analytic::Chart::positive,
                                          kappa.value, theta2.value, nullptr};
    checks.push_back(analytic::evaluate(positive_input, &positive,
                                        &positive_result)
                     && positive_result.accepted
                     && positive_result.jet_components_written == 39U
                     && positive_result.ordered_second_components_written == 27U
                     && positive_result.reciprocal_identity_verified
                     && positive_result.both_mixed_orientations_retained
                     && neutral(positive_result));
    checks.push_back(contains(&positive.kappa[analytic::value_jet()], 1L, 2L)
                     && contains(&positive.kappa[analytic::first_jet(1U)], 1L, 1L)
                     && contains(&positive.mu[analytic::value_jet()], 1L, 4L)
                     && contains(&positive.mu[analytic::first_jet(2U)], 1L, 1L));
    checks.push_back(contains(&positive.beta_plus_one[analytic::value_jet()], 1L, 4L)
                     && contains(&positive.beta_plus_one[analytic::first_jet(1U)], -3L, 2L)
                     && contains(&positive.beta_plus_one[analytic::first_jet(2U)], 1L, 1L)
                     && contains(&positive.beta_plus_one[analytic::second_jet(1U, 1U)], 4L, 1L));
    checks.push_back(contains(&positive.beta_plus_one[analytic::second_jet(1U, 2U)], -6L, 1L)
                     && contains(&positive.beta_plus_one[analytic::second_jet(2U, 1U)], -6L, 1L)
                     && arb_is_zero(&positive.beta_plus_one[analytic::second_jet(2U, 2U)]));

    arb_one(kappa.value);
    rational(theta2.value, 1L, 4L);
    rational(eta.value, 1L, 2L);
    analytic::Output vacuum;
    analytic::Result vacuum_result{};
    const analytic::Input vacuum_input{analytic::Chart::vacuum,
                                        kappa.value, theta2.value, eta.value};
    checks.push_back(analytic::evaluate(vacuum_input, &vacuum, &vacuum_result)
                     && vacuum_result.eta_fixed_during_vacuum_differentiation
                     && neutral(vacuum_result));
    checks.push_back(contains(&vacuum.mu[analytic::value_jet()], 1L, 8L)
                     && contains(&vacuum.mu[analytic::first_jet(2U)], 1L, 2L)
                     && contains(&vacuum.beta_plus_one[analytic::value_jet()], -1L, 8L)
                     && contains(&vacuum.beta_plus_one[analytic::first_jet(2U)], -1L, 2L));

    arb_zero(kappa.value);
    analytic::Output rejected;
    analytic::Result rejected_result{};
    const analytic::Input zero_kappa{analytic::Chart::positive,
                                     kappa.value, theta2.value, nullptr};
    checks.push_back(!analytic::evaluate(zero_kappa, &rejected,
                                         &rejected_result)
                     && rejected_result.detail
                        == analytic::FailureDetail::strict_parameter_margin);
    arb_one(kappa.value); arb_neg(eta.value, eta.value);
    const analytic::Input negative_eta{analytic::Chart::vacuum,
                                       kappa.value, theta2.value, eta.value};
    checks.push_back(!analytic::evaluate(negative_eta, &rejected,
                                         &rejected_result));
    const analytic::Input invalid_chart{static_cast<analytic::Chart>(2U),
                                         kappa.value, theta2.value, nullptr};
    checks.push_back(!analytic::evaluate(invalid_chart, &rejected,
                                         &rejected_result)
                     && rejected_result.detail
                        == analytic::FailureDetail::input_or_output);
    checks.push_back(!analytic::evaluate(positive_input, nullptr,
                                         &rejected_result)
                     && !analytic::evaluate(positive_input, &rejected,
                                             nullptr));

    std::size_t passed = 0U;
    for (const bool check : checks) passed += check ? 1U : 0U;
    std::cout << "{\"schema\":\"nhm2.g2h_e_s5.c08_analytic_parameter_jets_fixture.v1\""
              << ",\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL") << "\""
              << ",\"checks_passed\":" << passed
              << ",\"checks_total\":" << checks.size()
              << ",\"jet_components\":39"
              << ",\"ordered_second_components\":27"
              << ",\"candidate_evaluations\":0"
              << ",\"positive_parameter_samples\":0"
              << ",\"candidate_roots_created\":false"
              << ",\"scientific_handler_linked\":false"
              << ",\"authority_promoted\":false}\n";
    return passed == checks.size() ? 0 : 1;
}
