#include "mini_boson_star_primary_c08_analytic_model_product_v1.hpp"

#include <flint/fmpq.h>

#include <array>
#include <cstddef>
#include <iostream>
#include <vector>

namespace product =
    nhm2::g2h_e_s5::primary_c08_analytic_model_product_v1;

namespace {

struct Ball {
    Ball() { arb_init(value); }
    ~Ball() { arb_clear(value); }
    arb_t value;
};

struct Storage {
    Storage(unsigned order)
        : coefficients((static_cast<std::size_t>(order) + 1U)
                       * product::kJetCount),
          remainders(product::kJetCount) {
        for (auto &value : coefficients) { arb_init(&value); arb_zero(&value); }
        for (auto &value : remainders) { arb_init(&value); arb_zero(&value); }
        arb_init(left); arb_init(right); arb_init(center);
        arb_zero(left); arb_one(right); arb_zero(center);
    }
    ~Storage() {
        arb_clear(center); arb_clear(right); arb_clear(left);
        for (auto &value : remainders) arb_clear(&value);
        for (auto &value : coefficients) arb_clear(&value);
    }
    std::vector<arb_struct> coefficients;
    std::vector<arb_struct> remainders;
    arb_t left, right, center;
};

void rational(arb_t value, long numerator, long denominator = 1L) {
    fmpq_t q;
    fmpq_init(q); fmpq_set_si(q, numerator, denominator);
    arb_set_fmpq(value, q, product::kPrecisionBits);
    fmpq_clear(q);
}

bool contains(arb_srcptr value, long numerator, long denominator = 1L) {
    Ball expected; rational(expected.value, numerator, denominator);
    return arb_contains(value, expected.value);
}

product::ledger::ModelView view(Storage &storage, unsigned order) {
    return {0U, product::ledger::ModelKind::origin,
            storage.left, storage.right, storage.center, order,
            storage.coefficients.size(), storage.coefficients.data(),
            storage.remainders.size(), storage.remainders.data()};
}

bool neutral(const product::Result &result) {
    return result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created
        && !result.scientific_handler_linked
        && !result.authority_promoted;
}

}  // namespace

int main() {
    std::vector<bool> checks;
    Storage source(1U);
    rational(source.coefficients.data()
        + product::analytic::value_jet(), 3L);
    rational(source.coefficients.data() + product::kJetCount
        + product::analytic::value_jet(), 4L);
    std::array<arb_struct, product::kJetCount> constant, linear;
    for (auto &value : constant) { arb_init(&value); arb_zero(&value); }
    for (auto &value : linear) { arb_init(&value); arb_zero(&value); }
    rational(&constant[product::analytic::value_jet()], 2L);
    rational(&linear[product::analytic::value_jet()], 1L);
    rational(&constant[product::analytic::first_jet(1U)], 1L);

    product::Output output;
    product::Result result{};
    const product::Input input{view(source, 1U), constant.data(),
                               linear.data(), constant.size()};
    checks.push_back(product::evaluate(input, &output, &result)
                     && result.accepted && result.exact_degree_one_factor
                     && result.complete_ordered_13_jet_inventory
                     && result.both_mixed_orientations_retained
                     && result.ordered_second_outputs == 9U && neutral(result));
    checks.push_back(contains(output.coefficient(0U,
                                                product::analytic::value_jet()), 6L)
                     && contains(output.coefficient(1U,
                                                product::analytic::value_jet()), 11L));
    checks.push_back(contains(output.remainder(product::analytic::value_jet()), 4L)
                     && contains(output.remainder(product::analytic::value_jet()), -4L));
    checks.push_back(contains(output.coefficient(0U,
                                     product::analytic::first_jet(1U)), 3L)
                     && contains(output.coefficient(1U,
                                     product::analytic::first_jet(1U)), 4L));
    checks.push_back(arb_is_zero(output.coefficient(0U,
                                      product::analytic::second_jet(1U, 2U)))
                     && arb_is_zero(output.coefficient(0U,
                                      product::analytic::second_jet(2U, 1U))));

    Ball source_error;
    rational(source_error.value, 1L, 8L);
    arb_add_error(source.remainders.data()
                  + product::analytic::value_jet(), source_error.value);
    product::Output remainder_output;
    product::Result remainder_result{};
    checks.push_back(product::evaluate(input, &remainder_output,
                                        &remainder_result)
                     && remainder_result.source_remainder_terms > 0U
                     && remainder_result.discarded_degree_terms > 0U
                     && arb_contains_zero(remainder_output.remainder(
                                            product::analytic::value_jet())));

    arb_indeterminate(&constant[0]);
    product::Output rejected;
    product::Result rejected_result{};
    checks.push_back(!product::evaluate(input, &rejected, &rejected_result)
                     && rejected_result.detail
                        == product::FailureDetail::analytic_factor);
    checks.push_back(!product::evaluate(input, &output, &rejected_result)
                     && output.coefficients.empty()
                     && output.remainders.empty() && output.order == 0U);
    arb_zero(&constant[0]);
    auto malformed = input;
    malformed.factor_jet_count = product::kJetCount - 1U;
    checks.push_back(!product::evaluate(malformed, &rejected, &rejected_result)
                     && !product::evaluate(input, nullptr, &rejected_result)
                     && !product::evaluate(input, &rejected, nullptr));

    for (auto &value : linear) arb_clear(&value);
    for (auto &value : constant) arb_clear(&value);
    std::size_t passed = 0U;
    for (const bool check : checks) passed += check ? 1U : 0U;
    std::cout << "{\"schema\":\"nhm2.g2h_e_s5.c08_analytic_model_product_fixture.v1\""
              << ",\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL") << "\""
              << ",\"checks_passed\":" << passed
              << ",\"checks_total\":" << checks.size()
              << ",\"ordered_second_outputs\":9"
              << ",\"candidate_evaluations\":0"
              << ",\"positive_parameter_samples\":0"
              << ",\"candidate_roots_created\":false"
              << ",\"scientific_handler_linked\":false"
              << ",\"authority_promoted\":false}\n";
    return passed == checks.size() ? 0 : 1;
}
