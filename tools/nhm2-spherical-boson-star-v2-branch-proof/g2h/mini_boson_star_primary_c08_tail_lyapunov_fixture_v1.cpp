#include "mini_boson_star_primary_c08_tail_lyapunov_v1.hpp"

#include <iostream>
#include <vector>

namespace tail = nhm2::g2h_e_s5::primary_c08_tail_lyapunov_v1;

namespace {

struct Parameters {
    fmpq_t h0_lo, h0_hi, kappa_lo, kappa_hi, theta_lo, theta_hi, eta, sigma0;

    Parameters() {
        fmpq_init(h0_lo); fmpq_init(h0_hi);
        fmpq_init(kappa_lo); fmpq_init(kappa_hi);
        fmpq_init(theta_lo); fmpq_init(theta_hi);
        fmpq_init(eta); fmpq_init(sigma0);
        fmpq_set_si(h0_lo, 1, 4UL); fmpq_set_si(h0_hi, 1, 4UL);
        fmpq_set_si(kappa_lo, 1, 2UL); fmpq_set_si(kappa_hi, 1, 2UL);
        fmpq_set_si(theta_lo, 1, 10UL); fmpq_set_si(theta_hi, 1, 10UL);
        fmpq_set_si(eta, 1, 2UL);
        // 2*(1/10)+(255-2/10)/8 = 641/20.
        fmpq_set_si(sigma0, 641, 20UL);
    }

    ~Parameters() {
        fmpq_clear(sigma0); fmpq_clear(eta);
        fmpq_clear(theta_hi); fmpq_clear(theta_lo);
        fmpq_clear(kappa_hi); fmpq_clear(kappa_lo);
        fmpq_clear(h0_hi); fmpq_clear(h0_lo);
    }

    tail::Input positive(std::size_t t0 = 4096U) const {
        return {t0, true, tail::Chart::positive,
                {h0_lo, h0_hi}, {kappa_lo, kappa_hi},
                {theta_lo, theta_hi}, eta, sigma0};
    }
};

bool neutral(const tail::Result &result) {
    return result.state_coefficients_read == 0U
        && result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created && !result.scientific_handler_linked
        && !result.authority_promoted;
}

bool rejected(const tail::Input &input, tail::FailureDetail expected) {
    tail::Output output;
    tail::Result result{};
    return !tail::evaluate(input, &output, &result)
        && result.detail == expected && neutral(result);
}

bool dyadic_entries(const fmpq_mat_t matrix) {
    fmpz_t denominator, power;
    fmpz_init(denominator);
    fmpz_init(power);
    fmpz_one(power);
    fmpz_mul_2exp(power, power, tail::kDyadicDenominatorBits);
    bool pass = true;
    for (slong row = 0; row < 4 && pass; ++row) {
        for (slong column = 0; column < 4; ++column) {
            fmpz_set(denominator, fmpq_denref(fmpq_mat_entry(matrix, row, column)));
            if (!fmpz_divisible(power, denominator)) {
                pass = false;
                break;
            }
        }
    }
    fmpz_clear(power);
    fmpz_clear(denominator);
    return pass;
}

bool symmetric(const fmpq_mat_t matrix) {
    for (slong row = 0; row < 4; ++row)
        for (slong column = row + 1; column < 4; ++column)
            if (!fmpq_equal(fmpq_mat_entry(matrix, row, column),
                            fmpq_mat_entry(matrix, column, row))) return false;
    return true;
}

}  // namespace

int main() {
    std::vector<bool> checks;
    Parameters parameters;
    const tail::Input input = parameters.positive();
    tail::Output output;
    tail::Result result{};
    const bool pass = tail::evaluate(input, &output, &result);
    checks.push_back(pass && result.accepted && neutral(result));
    checks.push_back(result.fixed_variable_order_u_h0_kappa_theta2
        && !result.subdivision_used && !result.point_sampling_used
        && result.compact_variables == 4U);
    checks.push_back(result.lmi_matrices_verified == 1U
        && result.first_derivative_matrices_verified == 3U
        && result.ordered_second_derivative_matrices_verified == 9U);
    checks.push_back(result.k1_candidates_tested == output.k1_exponent + 1U
        && result.k2_candidates_tested == output.k2_exponent + 1U);
    checks.push_back(result.exact_inverse_verified
        && result.dyadic_denominator_bound && dyadic_entries(output.p_lyap));
    checks.push_back(arb_is_positive(output.ep)
        && arb_is_finite(output.ep)
        && arb_is_positive(output.cleared_denominator));
    checks.push_back(symmetric(output.p_lyap));
    bool exact_pivots_positive = true;
    bool interval_pivots_positive = true;
    for (std::size_t index = 0U; index < 4U; ++index) {
        exact_pivots_positive = exact_pivots_positive
            && fmpq_sgn(output.p_ldl_pivots.data() + index) > 0;
        interval_pivots_positive = interval_pivots_positive
            && arb_is_positive(output.lmi_ldl_pivots.data() + index);
    }
    for (const auto &pivot : output.k1_ldl_pivots)
        interval_pivots_positive = interval_pivots_positive
            && arb_is_positive(&pivot);
    for (const auto &pivot : output.k2_ldl_pivots)
        interval_pivots_positive = interval_pivots_positive
            && arb_is_positive(&pivot);
    checks.push_back(exact_pivots_positive);
    checks.push_back(interval_pivots_positive);
    checks.push_back(fmpz_cmp_ui(output.k1, 8UL) == 0
        && fmpz_cmp_ui(output.k2, 16UL) == 0);

    tail::Output repeat_output;
    tail::Result repeat_result{};
    checks.push_back(tail::evaluate(input, &repeat_output, &repeat_result)
        && fmpq_mat_equal(output.p_lyap, repeat_output.p_lyap)
        && fmpq_mat_equal(output.p_inverse, repeat_output.p_inverse)
        && output.k1_exponent == repeat_output.k1_exponent
        && output.k2_exponent == repeat_output.k2_exponent
        && arb_equal(output.ep, repeat_output.ep));

    Parameters interval_parameters;
    fmpq_set_si(interval_parameters.h0_hi, 1, 3UL);
    fmpq_set_si(interval_parameters.kappa_hi, 51, 100UL);
    fmpq_set_si(interval_parameters.theta_hi, 101, 1000UL);
    fmpq_set_si(interval_parameters.sigma0, 128207, 4000UL);
    tail::Output interval_output;
    tail::Result interval_result{};
    checks.push_back(tail::evaluate(interval_parameters.positive(),
                                    &interval_output, &interval_result)
        && interval_result.accepted && neutral(interval_result)
        && interval_result.fixed_variable_order_u_h0_kappa_theta2);

    checks.push_back(rejected(parameters.positive(3U),
                              tail::FailureDetail::invalid_onset));
    tail::Input no_predecessor = parameters.positive();
    no_predecessor.predecessor_c08_004_passed = false;
    checks.push_back(rejected(no_predecessor,
                              tail::FailureDetail::predecessor_not_passed));
    tail::Input reversed = parameters.positive();
    reversed.kappa = {parameters.kappa_hi, parameters.h0_lo};
    checks.push_back(rejected(reversed,
                              tail::FailureDetail::invalid_chart_or_parameter_box));
    tail::Input missing = parameters.positive();
    missing.sigma0 = nullptr;
    checks.push_back(rejected(missing,
                              tail::FailureDetail::missing_output_or_input));
    fmpq_zero(parameters.kappa_lo);
    fmpq_zero(parameters.kappa_hi);
    checks.push_back(rejected(parameters.positive(),
                              tail::FailureDetail::nonpositive_denominator_margin));
    fmpq_set_si(parameters.kappa_lo, 1, 2UL);
    fmpq_set_si(parameters.kappa_hi, 1, 2UL);
    fmpq_set_si(parameters.sigma0, 1, 1UL);
    checks.push_back(rejected(parameters.positive(),
                              tail::FailureDetail::sigma0_tier_mismatch));
    fmpq_set_si(parameters.sigma0, 641, 20UL);
    fmpq_zero(parameters.h0_lo);
    checks.push_back(rejected(parameters.positive(),
                              tail::FailureDetail::parameter_margin_not_strict));
    fmpq_set_si(parameters.h0_lo, 1, 4UL);

    tail::Input vacuum = parameters.positive();
    vacuum.chart = tail::Chart::vacuum;
    fmpq_set_si(parameters.sigma0, 2557, 80UL);
    tail::Output vacuum_output;
    tail::Result vacuum_result{};
    checks.push_back(tail::evaluate(vacuum, &vacuum_output, &vacuum_result)
        && vacuum_result.accepted && neutral(vacuum_result));
    vacuum.eta = nullptr;
    checks.push_back(rejected(vacuum,
                              tail::FailureDetail::invalid_chart_or_parameter_box));

    tail::Result null_output_result{};
    checks.push_back(!tail::evaluate(input, nullptr, &null_output_result)
        && null_output_result.detail
            == tail::FailureDetail::missing_output_or_input);
    checks.push_back(!tail::evaluate(input, &output, nullptr));

    std::size_t passed = 0U;
    for (const bool check : checks) if (check) ++passed;
    std::cout << "C08-011b tail Lyapunov fixture: " << passed << "/"
              << checks.size() << " PASS\n";
    std::cout << "K1 exponent=" << output.k1_exponent
              << " K2 exponent=" << output.k2_exponent << "\n";
    std::cout << "primary detail=" << tail::failure_detail_name(result.detail)
              << " vacuum detail="
              << tail::failure_detail_name(vacuum_result.detail) << "\n";
    std::cout << "{\"checks_passed\":" << passed
              << ",\"checks_total\":" << checks.size()
              << ",\"k1_exponent\":" << output.k1_exponent
              << ",\"k2_exponent\":" << output.k2_exponent
              << ",\"compact_variables\":" << result.compact_variables
              << ",\"first_derivatives\":"
              << result.first_derivative_matrices_verified
              << ",\"ordered_second_derivatives\":"
              << result.ordered_second_derivative_matrices_verified
              << ",\"fixed_variable_order\":"
              << (result.fixed_variable_order_u_h0_kappa_theta2 ? "true" : "false")
              << ",\"subdivision_used\":"
              << (result.subdivision_used ? "true" : "false")
              << ",\"point_sampling_used\":"
              << (result.point_sampling_used ? "true" : "false")
              << ",\"candidate_evaluations\":" << result.candidate_evaluations
              << ",\"positive_parameter_samples\":"
              << result.positive_parameter_samples
              << ",\"candidate_roots_created\":"
              << (result.candidate_root_created ? "true" : "false")
              << ",\"scientific_handler_linked\":"
              << (result.scientific_handler_linked ? "true" : "false")
              << ",\"authority_promoted\":"
              << (result.authority_promoted ? "true" : "false") << "}\n";
    return passed == checks.size() ? 0 : 1;
}
