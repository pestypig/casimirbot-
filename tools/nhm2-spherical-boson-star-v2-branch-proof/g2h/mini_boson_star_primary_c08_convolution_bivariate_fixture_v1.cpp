#include "mini_boson_star_primary_c08_convolution_bivariate_v1.hpp"

#include <arb.h>
#include <flint/fmpq.h>

#include <cstdint>
#include <iostream>
#include <string>
#include <vector>

namespace bivariate =
    nhm2::g2h_e_s5::primary_c08_convolution_bivariate_v1;
namespace ledger =
    nhm2::g2h_e_s5::primary_c08_convolution_ledger_v1;

namespace {

struct Ball {
    Ball() { arb_init(value); arb_zero(value); }
    ~Ball() { arb_clear(value); }
    arb_t value;
};

struct Storage {
    explicit Storage(std::size_t count) : values(count) {
        for (auto &value : values) { arb_init(&value); arb_zero(&value); }
    }
    ~Storage() { for (auto &value : values) arb_clear(&value); }
    std::vector<arb_struct> values;
};

void rational(arb_t value, long numerator, long denominator) {
    fmpq_t q;
    fmpq_init(q); fmpq_set_si(q, numerator, denominator);
    arb_set_fmpq(value, q, 512); fmpq_clear(q);
}

void set_coefficient(Storage &storage, unsigned degree, std::size_t jet,
                     long numerator, long denominator = 1L) {
    rational(storage.values.data()
                 + static_cast<std::size_t>(degree) * ledger::kJetCount + jet,
             numerator, denominator);
}

bool exact_rational(arb_srcptr value, long numerator, long denominator) {
    Ball expected;
    rational(expected.value, numerator, denominator);
    return arb_equal(value, expected.value);
}

bool neutral(const bivariate::Result &result) {
    return result.state_coefficients_read == 0U
        && result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created && !result.scientific_handler_linked
        && !result.authority_promoted;
}

bool rejected(const bivariate::Input &input,
              bivariate::FailureDetail detail) {
    bivariate::Output output;
    bivariate::Result result{};
    return !bivariate::evaluate(input, &output, &result)
        && result.detail == detail && neutral(result);
}

}  // namespace

int main() {
    std::vector<bool> checks;
    Ball zero, one, two, three, five_halves, g_at_zero;
    arb_zero(zero.value); arb_one(one.value); arb_set_ui(two.value, 2UL);
    arb_set_ui(three.value, 3UL); rational(five_halves.value, 5L, 2L);
    arb_set_ui(g_at_zero.value, 2UL);

    Storage f_origin((32U + 1U) * ledger::kJetCount);
    Storage f_panel1((24U + 1U) * ledger::kJetCount);
    Storage f_panel2((24U + 1U) * ledger::kJetCount);
    Storage g_origin((32U + 1U) * ledger::kJetCount);
    Storage g_panel1((24U + 1U) * ledger::kJetCount);
    Storage g_panel2((24U + 1U) * ledger::kJetCount);
    Storage f_remainder0(ledger::kJetCount), f_remainder1(ledger::kJetCount),
        f_remainder2(ledger::kJetCount);
    Storage g_remainder0(ledger::kJetCount), g_remainder1(ledger::kJetCount),
        g_remainder2(ledger::kJetCount);

    // F(s)=s in every left-centered model.
    set_coefficient(f_origin, 1U, 0U, 1L);
    set_coefficient(f_panel1, 0U, 0U, 1L);
    set_coefficient(f_panel1, 1U, 0U, 1L);
    set_coefficient(f_panel2, 0U, 0U, 2L);
    set_coefficient(f_panel2, 1U, 0U, 1L);
    // G'(s)=1 in every model.
    set_coefficient(g_origin, 0U, 0U, 1L);
    set_coefficient(g_panel1, 0U, 0U, 1L);
    set_coefficient(g_panel2, 0U, 0U, 1L);

    std::vector<ledger::ModelView> f_models = {
        {0U, ledger::ModelKind::origin, zero.value, one.value, zero.value, 32U,
         f_origin.values.size(), f_origin.values.data(),
         f_remainder0.values.size(), f_remainder0.values.data()},
        {1U, ledger::ModelKind::positive_panel, one.value, two.value, one.value,
         24U, f_panel1.values.size(), f_panel1.values.data(),
         f_remainder1.values.size(), f_remainder1.values.data()},
        {2U, ledger::ModelKind::positive_panel, two.value, three.value, two.value,
         24U, f_panel2.values.size(), f_panel2.values.data(),
         f_remainder2.values.size(), f_remainder2.values.data()},
    };
    std::vector<ledger::ModelView> g_models = {
        {0U, ledger::ModelKind::origin, zero.value, one.value, zero.value, 32U,
         g_origin.values.size(), g_origin.values.data(),
         g_remainder0.values.size(), g_remainder0.values.data()},
        {1U, ledger::ModelKind::positive_panel, one.value, two.value, one.value,
         24U, g_panel1.values.size(), g_panel1.values.data(),
         g_remainder1.values.size(), g_remainder1.values.data()},
        {2U, ledger::ModelKind::positive_panel, two.value, three.value, two.value,
         24U, g_panel2.values.size(), g_panel2.values.data(),
         g_remainder2.values.size(), g_remainder2.values.data()},
    };
    bivariate::Input input{{f_models.size(), f_models.data()},
        {g_models.size(), g_models.data()}, two.value, three.value, 24U,
        zero.value, one.value, 0U, 0U, g_at_zero.value};
    bivariate::Output output;
    bivariate::Result result{};
    const bool accepted = bivariate::evaluate(input, &output, &result);

    checks.push_back(accepted && result.accepted
        && result.detail == bivariate::FailureDetail::none && neutral(result));
    checks.push_back(output.retained_order == 24U
        && exact_rational(output.target_center, 5L, 2L)
        && exact_rational(output.target_half_width, 1L, 2L));
    // F(t)G(0)+t int_0^1 F(tu)G'(t(1-u))du = 2t+t^2/2.
    checks.push_back(exact_rational(output.coefficient(0U), 65L, 8L)
        && exact_rational(output.coefficient(1U), 9L, 2L)
        && exact_rational(output.coefficient(2U), 1L, 2L));
    bool high_coefficients_zero = true;
    for (unsigned degree = 3U; degree <= output.retained_order; ++degree)
        high_coefficients_zero = high_coefficients_zero
            && arb_is_zero(output.coefficient(degree));
    checks.push_back(high_coefficients_zero
        && arb_is_zero(output.discarded_xi_tail_bound));
    checks.push_back(arb_is_zero(output.f_source_hull_radius_bound)
        && arb_is_zero(output.gprime_source_hull_radius_bound));
    checks.push_back(result.direct_models_composed == 3U
        && result.reflected_models_composed == 3U
        && result.local_to_global_terms == 2422U);
    checks.push_back(result.beta_moments_evaluated == 1089U
        && result.factorized_product_terms == 1089U
        && result.centered_translation_terms == 2536U);
    checks.push_back(result.exact_factorized_bivariate_elimination
        && result.exact_dyadic_u_integration
        && result.boundary_term_retained
        && result.discarded_xi_tail_retained
        && !result.midpoint_selection_used && !result.point_sampling_used);

    auto bad_order = input; bad_order.target_order = 25U;
    checks.push_back(rejected(bad_order,
        bivariate::FailureDetail::invalid_component_order_or_boundary));
    auto bad_jet = input; bad_jet.f_jet = ledger::kJetCount;
    checks.push_back(rejected(bad_jet,
        bivariate::FailureDetail::invalid_component_order_or_boundary));
    Ball indeterminate;
    arb_indeterminate(indeterminate.value);
    auto bad_boundary = input; bad_boundary.g_at_zero = indeterminate.value;
    checks.push_back(rejected(bad_boundary,
        bivariate::FailureDetail::invalid_component_order_or_boundary));
    Ball uncertain_u;
    arb_zero(uncertain_u.value); arb_add_error_2exp_si(uncertain_u.value, -240L);
    auto nonexact_rectangle = input; nonexact_rectangle.u_left = uncertain_u.value;
    checks.push_back(rejected(nonexact_rectangle,
        bivariate::FailureDetail::invalid_component_order_or_boundary));

    auto old_target = input; old_target.target_left = one.value;
    old_target.target_right = two.value;
    checks.push_back(rejected(old_target,
        bivariate::FailureDetail::target_not_current_panel));

    f_models[2U].left_endpoint = five_halves.value;
    checks.push_back(rejected(input,
        bivariate::FailureDetail::f_ledger_or_coverage));
    f_models[2U].left_endpoint = two.value;
    arb_indeterminate(g_panel1.values.data());
    checks.push_back(rejected(input,
        bivariate::FailureDetail::gprime_ledger_or_coverage));
    arb_one(g_panel1.values.data());

    bivariate::Result missing_output_result{};
    checks.push_back(!bivariate::evaluate(input, nullptr, &missing_output_result)
        && missing_output_result.detail
            == bivariate::FailureDetail::missing_output
        && neutral(missing_output_result));
    checks.push_back(!bivariate::evaluate(input, &output, nullptr));
    checks.push_back(std::string(bivariate::failure_detail_name(
        bivariate::FailureDetail::nonfinite_algebra))
        == "C08-010B_NONFINITE_ALGEBRA");
    checks.push_back(bivariate::kJetCount == 13U
        && bivariate::kMaximumRetainedXiDegree == 192U
        && bivariate::kMaximumSourceOrder == 256U);

    std::size_t passed = 0U;
    std::uint64_t mask = 0U;
    for (std::size_t index = 0U; index < checks.size(); ++index)
        if (checks[index]) { ++passed; mask |= std::uint64_t{1} << index; }
    std::cout << "{\"authority_promoted\":false,\"beta_moments\":"
        << result.beta_moments_evaluated
        << ",\"candidate_evaluations\":0,\"candidate_roots_created\":false,"
        "\"centered_translation_terms\":"
        << result.centered_translation_terms << ",\"checks_passed\":" << passed
        << ",\"checks_total\":" << checks.size()
        << ",\"direct_models\":" << result.direct_models_composed
        << ",\"discarded_tail_exact_zero\":"
        << (arb_is_zero(output.discarded_xi_tail_bound) ? "true" : "false")
        << ",\"exact_bivariate_elimination\":"
        << (result.exact_factorized_bivariate_elimination ? "true" : "false")
        << ",\"exact_dyadic_u_integration\":"
        << (result.exact_dyadic_u_integration ? "true" : "false")
        << ",\"factorized_product_terms\":"
        << result.factorized_product_terms << ",\"fixture_mask\":" << mask
        << ",\"local_to_global_terms\":" << result.local_to_global_terms
        << ",\"midpoint_selection_used\":false,\"point_sampling_used\":false,"
        "\"positive_parameter_samples\":0,\"reflected_models\":"
        << result.reflected_models_composed << ",\"retained_order\":"
        << output.retained_order
        << ",\"schema\":\"nhm2.g2h_e_s5.primary_c08_convolution_bivariate_fixture.v1\","
        "\"scientific_handler_linked\":false,\"state_coefficients_read\":0,"
        "\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL")
        << "\"}\n";
    return passed == checks.size() ? 0 : 1;
}
