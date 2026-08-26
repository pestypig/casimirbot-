#include "mini_boson_star_primary_c08_endpoint_v1.hpp"

#include <arb.h>

#include <cstdint>
#include <iostream>
#include <string>
#include <vector>

namespace endpoint = nhm2::g2h_e_s5::primary_c08_endpoint_v1;
namespace identity = nhm2::g2h_e_s5::primary_c08_identity_v1;

namespace {

constexpr char kGrowthHash[] = "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737";
constexpr char kJetHash[] = "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc";
constexpr char kGridHash[] = "cd98fb110a6d0d94cd69d1134e8f5233444ea34f7894bc14333075d0dfa5013c";
constexpr char kAbiHash[] = "6fbf6cdbb80e6da390c84f6d87f13f37f2b81b2226bf937cbcfd2c8aff3911ca";

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

struct Ball {
    Ball() { arb_init(value); }
    ~Ball() { arb_clear(value); }
    arb_t value;
};

identity::InputIdentity make_identity(identity::Chart chart, std::uint32_t cell,
                                      long nodes, Storage &storage) {
    return {kGrowthHash, kJetHash, kGridHash, kAbiHash, chart, cell, nodes,
            storage.values.size(), storage.values.data()};
}

void set_endpoint_block(Storage &storage, long nodes, long numerator, long denominator) {
    for (long index = 6L * nodes; index < 7L * nodes; ++index) {
        arb_set_si(&storage.values[static_cast<std::size_t>(index)], numerator);
        arb_div_si(&storage.values[static_cast<std::size_t>(index)],
                   &storage.values[static_cast<std::size_t>(index)], denominator, 512);
    }
}

bool accepted(endpoint::Input input, arb_t h0, endpoint::Result *result) {
    return endpoint::evaluate(input, h0, result) && result->accepted
        && result->detail == endpoint::FailureDetail::none;
}

bool rejected(endpoint::Input input, endpoint::FailureDetail expected) {
    Ball h0;
    endpoint::Result result{};
    return !endpoint::evaluate(input, h0.value, &result)
        && !result.accepted && result.detail == expected
        && result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created && !result.scientific_handler_linked
        && !result.authority_promoted;
}

}  // namespace

int main() {
    std::vector<bool> checks;

    Storage positive64(514U);
    set_endpoint_block(positive64, 64L, 1L, 128L);
    auto positive_identity = make_identity(identity::Chart::positive, 1U, 64L, positive64);
    Ball tail;
    arb_set_si(tail.value, 1L);
    arb_div_si(tail.value, tail.value, 4L, 512);
    arb_add_error_2exp_si(tail.value, -10L);
    Ball tail_norm;
    arb_one(tail_norm.value);
    arb_mul_2exp_si(tail_norm.value, tail_norm.value, -10L);
    Ball h0;
    endpoint::Result result{};
    endpoint::Input input{&positive_identity, identity::validate(positive_identity),
                          tail.value, tail_norm.value};
    checks.push_back(accepted(input, h0.value, &result));
    Ball expected;
    arb_set_si(expected.value, 3L);
    arb_div_si(expected.value, expected.value, 4L, 512);
    checks.push_back(arb_contains(h0.value, expected.value) != 0);
    checks.push_back(result.finite_support_begin == 384U
        && result.finite_support_end == 448U
        && result.finite_coefficients_read == 64U
        && result.finite_gradient_ones == 64U);
    checks.push_back(result.finite_hessian_exact_zero
        && result.infinite_tail_operator_norm == 1U
        && result.internal_theta_h0_first_derivative_exact_one
        && result.internal_theta_h0_second_derivatives_exact_zero);
    checks.push_back(result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created && !result.scientific_handler_linked
        && !result.authority_promoted);

    Storage vacuum256(2049U);
    set_endpoint_block(vacuum256, 256L, 1L, 512L);
    auto vacuum_identity = make_identity(identity::Chart::vacuum, 0U, 256L, vacuum256);
    Ball zero_tail;
    arb_zero(zero_tail.value);
    Ball zero_norm;
    arb_zero(zero_norm.value);
    endpoint::Result vacuum_result{};
    endpoint::Input vacuum_input{&vacuum_identity, identity::validate(vacuum_identity),
                                 zero_tail.value, zero_norm.value};
    checks.push_back(accepted(vacuum_input, h0.value, &vacuum_result));
    arb_set_si(expected.value, 1L);
    arb_div_si(expected.value, expected.value, 2L, 512);
    checks.push_back(arb_equal(h0.value, expected.value) != 0
        && vacuum_result.finite_support_begin == 1536U
        && vacuum_result.finite_support_end == 1792U
        && vacuum_result.finite_coefficients_read == 256U);

    auto blocked = input;
    blocked.predecessor_c08_001_passed = false;
    checks.push_back(rejected(blocked, endpoint::FailureDetail::predecessor_not_passed));
    auto null_identity = input;
    null_identity.identity = nullptr;
    checks.push_back(rejected(null_identity, endpoint::FailureDetail::invalid_shape_or_storage));
    auto wrong_length_identity = positive_identity;
    wrong_length_identity.state_length -= 1U;
    auto wrong_length = input;
    wrong_length.identity = &wrong_length_identity;
    checks.push_back(rejected(wrong_length, endpoint::FailureDetail::invalid_shape_or_storage));
    auto wrong_grid_identity = positive_identity;
    wrong_grid_identity.grid_node_count = 65L;
    auto wrong_grid = input;
    wrong_grid.identity = &wrong_grid_identity;
    checks.push_back(rejected(wrong_grid, endpoint::FailureDetail::invalid_shape_or_storage));
    auto wrong_chart_identity = positive_identity;
    wrong_chart_identity.chart = static_cast<identity::Chart>(2U);
    auto wrong_chart = input;
    wrong_chart.identity = &wrong_chart_identity;
    checks.push_back(rejected(wrong_chart, endpoint::FailureDetail::invalid_shape_or_storage));
    auto null_storage_identity = positive_identity;
    null_storage_identity.state_storage = nullptr;
    auto null_storage = input;
    null_storage.identity = &null_storage_identity;
    checks.push_back(rejected(null_storage, endpoint::FailureDetail::invalid_shape_or_storage));
    auto missing_tail = input;
    missing_tail.endpoint_tail_image = nullptr;
    checks.push_back(rejected(missing_tail, endpoint::FailureDetail::tail_image_nonfinite));
    Ball indeterminate;
    arb_indeterminate(indeterminate.value);
    auto nonfinite_tail = input;
    nonfinite_tail.endpoint_tail_image = indeterminate.value;
    checks.push_back(rejected(nonfinite_tail, endpoint::FailureDetail::tail_image_nonfinite));
    auto missing_norm = input;
    missing_norm.order8_tail_norm = nullptr;
    checks.push_back(rejected(missing_norm, endpoint::FailureDetail::tail_norm_invalid));
    auto nonfinite_norm = input;
    nonfinite_norm.order8_tail_norm = indeterminate.value;
    checks.push_back(rejected(nonfinite_norm, endpoint::FailureDetail::tail_norm_invalid));
    Ball negative_norm;
    arb_set_si(negative_norm.value, -1L);
    auto bad_norm = input;
    bad_norm.order8_tail_norm = negative_norm.value;
    checks.push_back(rejected(bad_norm, endpoint::FailureDetail::tail_norm_invalid));
    Ball small_norm;
    arb_one(small_norm.value);
    arb_mul_2exp_si(small_norm.value, small_norm.value, -11L);
    auto wide_tail = input;
    wide_tail.order8_tail_norm = small_norm.value;
    checks.push_back(rejected(wide_tail, endpoint::FailureDetail::tail_radius_exceeds_norm));

    arb_indeterminate(&positive64.values[384U]);
    checks.push_back(rejected(input, endpoint::FailureDetail::endpoint_coefficient_nonfinite));
    arb_set_si(&positive64.values[384U], 1L);
    arb_div_si(&positive64.values[384U], &positive64.values[384U], 128L, 512);

    Storage touching(514U);
    set_endpoint_block(touching, 64L, 0L, 1L);
    auto touching_identity = make_identity(identity::Chart::positive, 1U, 64L, touching);
    endpoint::Input touching_input{&touching_identity, true, zero_tail.value, zero_norm.value};
    checks.push_back(rejected(touching_input,
        endpoint::FailureDetail::endpoint_nonfinite_or_nonpositive));
    set_endpoint_block(touching, 64L, -1L, 64L);
    checks.push_back(rejected(touching_input,
        endpoint::FailureDetail::endpoint_nonfinite_or_nonpositive));

    checks.push_back(!endpoint::evaluate(input, h0.value, nullptr));
    endpoint::Result missing_output_result{};
    checks.push_back(!endpoint::evaluate(input, nullptr, &missing_output_result)
        && missing_output_result.detail == endpoint::FailureDetail::missing_output);
    checks.push_back(std::string(endpoint::failure_detail_name(
        endpoint::FailureDetail::tail_radius_exceeds_norm))
        == "C08-003_TAIL_RADIUS_EXCEEDS_NORM");

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
        << ",\"maximum_endpoint_coefficients_read\":256,"
        "\"positive_parameter_samples\":0,"
        "\"schema\":\"nhm2.g2h_e_s5.primary_c08_endpoint_fixture.v1\","
        "\"scientific_handler_linked\":false,\"status\":\""
        << (passed == checks.size() ? "PASS" : "FAIL") << "\"}\n";
    return passed == checks.size() ? 0 : 1;
}
