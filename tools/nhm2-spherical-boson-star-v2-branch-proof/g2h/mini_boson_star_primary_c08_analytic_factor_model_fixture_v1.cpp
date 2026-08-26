#include "mini_boson_star_primary_c08_analytic_factor_model_v1.hpp"

#include <flint/fmpq.h>

#include <cstddef>
#include <iostream>
#include <vector>

namespace factor =
    nhm2::g2h_e_s5::primary_c08_analytic_factor_model_v1;
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
    arb_set_fmpq(value, q, factor::kPrecisionBits); fmpq_clear(q);
}

bool equal_rational(arb_srcptr value, long numerator, long denominator) {
    Ball expected; rational(expected.value, numerator, denominator);
    return arb_equal(value, expected.value);
}

bool neutral(const factor::Result &result) {
    return result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created
        && !result.scientific_handler_linked
        && !result.authority_promoted;
}

bool symmetric_remainders(const factor::Output &output) {
    for (std::size_t index = 0U; index < factor::kFactorCount; ++index) {
        for (std::size_t jet = 0U; jet < factor::kJetCount; ++jet) {
            const auto selected = static_cast<factor::Factor>(index);
            if (!arb_is_finite(output.remainder(selected, jet))
                || !arb_contains_zero(output.remainder(selected, jet)))
                return false;
        }
    }
    return true;
}

}  // namespace

int main() {
    std::vector<bool> checks;
    Ball kappa, mu, left, right;
    rational(kappa.value, 1L, 2L); rational(mu.value, 1L, 4L);
    arb_zero(left.value); rational(right.value, 1L, 256L);
    analytic::Input parameter_input{analytic::Chart::positive,
                                    kappa.value, mu.value, nullptr};
    analytic::Output parameters;
    analytic::Result parameter_result{};
    checks.push_back(analytic::evaluate(parameter_input, &parameters,
                                         &parameter_result));

    factor::Input input{0U, factor::ledger::ModelKind::origin,
                        left.value, right.value, 32U, &parameters};
    factor::Output output;
    factor::Result result{};
    checks.push_back(factor::evaluate(input, &output, &result)
                     && result.accepted && result.exact_f_formula
                     && result.exact_e1_formula && result.exact_e2_formula
                     && result.directed_panel_remainders && neutral(result));
    checks.push_back(equal_rational(output.coefficient(factor::Factor::F,
                                                       0U, 0U), 1L, 1L)
                     && equal_rational(output.coefficient(factor::Factor::F,
                                                          1U, 0U), -1L, 2L)
                     && equal_rational(output.coefficient(factor::Factor::E1,
                                                          0U, 0U), 1L, 1L)
                     && equal_rational(output.coefficient(factor::Factor::E1,
                                                          1U, 0U), 1L, 2L)
                     && equal_rational(output.coefficient(factor::Factor::E2,
                                                          0U, 0U), 1L, 1L)
                     && equal_rational(output.coefficient(factor::Factor::E2,
                                                          1U, 0U), 1L, 1L));
    const std::size_t mu_first = analytic::first_jet(2U);
    checks.push_back(equal_rational(output.coefficient(factor::Factor::F,
                                                       1U, mu_first), -2L, 1L)
                     && equal_rational(output.coefficient(factor::Factor::E1,
                                                          1U, mu_first), 2L, 1L)
                     && equal_rational(output.coefficient(factor::Factor::E2,
                                                          1U, mu_first), 4L, 1L));
    checks.push_back(symmetric_remainders(output)
                     && arb_is_zero(output.remainder(factor::Factor::F, 0U))
                     && result.remainder_jets_written == 2U * factor::kJetCount);
    checks.push_back(arb_equal(
                         output.coefficient(factor::Factor::E2, 3U,
                                            analytic::second_jet(1U, 2U)),
                         output.coefficient(factor::Factor::E2, 3U,
                                            analytic::second_jet(2U, 1U)))
                     && result.both_mixed_orientations_retained);

    Ball positive_left, positive_right;
    rational(positive_left.value, 1L, 256L);
    rational(positive_right.value, 3L, 512L);
    factor::Input positive_input{1U,
        factor::ledger::ModelKind::positive_panel,
        positive_left.value, positive_right.value, 24U, &parameters};
    factor::Output positive_output;
    factor::Result positive_result{};
    checks.push_back(factor::evaluate(positive_input, &positive_output,
                                      &positive_result)
                     && positive_result.accepted
                     && positive_output.view(factor::Factor::E1).order == 24U
                     && arb_equal(positive_output.expansion_center,
                                  positive_left.value)
                     && symmetric_remainders(positive_output)
                     && neutral(positive_result));

    auto bad_order = input; bad_order.order = 31U;
    factor::Result rejected{};
    checks.push_back(!factor::evaluate(bad_order, &output, &rejected)
                     && rejected.detail
                        == factor::FailureDetail::geometry_or_order
                     && output.coefficients[0].empty());
    auto bad_chronology = positive_input; bad_chronology.ordinal = 0U;
    checks.push_back(!factor::evaluate(bad_chronology, &output, &rejected)
                     && output.coefficients[0].empty());
    checks.push_back(!factor::evaluate(input, nullptr, &rejected)
                     && rejected.detail
                        == factor::FailureDetail::input_or_output);
    checks.push_back(!factor::evaluate(input, &output, nullptr));

    std::size_t passed = 0U;
    for (const bool check : checks) passed += check ? 1U : 0U;
    std::cout << "{\"schema\":\"nhm2.g2h_e_s5.c08_analytic_factor_model_fixture.v1\""
              << ",\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL") << "\""
              << ",\"checks_passed\":" << passed
              << ",\"checks_total\":" << checks.size()
              << ",\"origin_order\":32,\"positive_order\":24"
              << ",\"candidate_evaluations\":0"
              << ",\"positive_parameter_samples\":0"
              << ",\"candidate_roots_created\":false"
              << ",\"scientific_handler_linked\":false"
              << ",\"authority_promoted\":false}\n";
    return passed == checks.size() ? 0 : 1;
}
