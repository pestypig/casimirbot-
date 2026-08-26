#include "mini_boson_star_primary_c08_convolution_jet_v1.hpp"

#include <arb.h>

#include <cstdint>
#include <iostream>
#include <string>
#include <vector>

namespace jet = nhm2::g2h_e_s5::primary_c08_convolution_jet_v1;
namespace ledger = nhm2::g2h_e_s5::primary_c08_convolution_ledger_v1;

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

bool exact_integer(arb_srcptr value, unsigned integer) {
    Ball expected;
    arb_set_ui(expected.value, static_cast<ulong>(integer));
    return arb_equal(value, expected.value);
}

void fill_constant_model(Storage &coefficients, Storage &remainders,
                         bool f_operand) {
    for (std::size_t component = 0U; component < jet::kJetCount; ++component) {
        const unsigned factor = static_cast<unsigned>(component)
            + (f_operand ? 1U : 2U);
        arb_set_ui(coefficients.values.data() + component,
                   static_cast<ulong>(f_operand ? factor : 2U * factor));
        arb_zero(remainders.values.data() + component);
        arb_add_error_2exp_si(remainders.values.data() + component,
                              f_operand ? -10L : -11L);
    }
}

bool neutral(const jet::Result &result) {
    return result.state_coefficients_read == 0U
        && result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created && !result.scientific_handler_linked
        && !result.authority_promoted;
}

bool rejected(const jet::Input &input, jet::FailureDetail detail) {
    jet::Output output;
    jet::Result result{};
    return !jet::evaluate(input, &output, &result)
        && result.detail == detail && neutral(result);
}

unsigned pair_scale(std::size_t f_index, std::size_t g_index) {
    return static_cast<unsigned>((f_index + 1U) * (g_index + 2U));
}

}  // namespace

int main() {
    std::vector<bool> checks;
    Ball zero, one, two, three;
    arb_zero(zero.value); arb_one(one.value); arb_set_ui(two.value, 2UL);
    arb_set_ui(three.value, 3UL);

    Storage f0((32U + 1U) * ledger::kJetCount);
    Storage f1((24U + 1U) * ledger::kJetCount);
    Storage f2((24U + 1U) * ledger::kJetCount);
    Storage g0((32U + 1U) * ledger::kJetCount);
    Storage g1((24U + 1U) * ledger::kJetCount);
    Storage g2((24U + 1U) * ledger::kJetCount);
    Storage fr0(jet::kJetCount), fr1(jet::kJetCount), fr2(jet::kJetCount);
    Storage gr0(jet::kJetCount), gr1(jet::kJetCount), gr2(jet::kJetCount);
    fill_constant_model(f0, fr0, true); fill_constant_model(f1, fr1, true);
    fill_constant_model(f2, fr2, true); fill_constant_model(g0, gr0, false);
    fill_constant_model(g1, gr1, false); fill_constant_model(g2, gr2, false);

    std::vector<ledger::ModelView> f_models = {
        {0U, ledger::ModelKind::origin, zero.value, one.value, zero.value, 32U,
         f0.values.size(), f0.values.data(), fr0.values.size(), fr0.values.data()},
        {1U, ledger::ModelKind::positive_panel, one.value, two.value, one.value,
         24U, f1.values.size(), f1.values.data(), fr1.values.size(), fr1.values.data()},
        {2U, ledger::ModelKind::positive_panel, two.value, three.value, two.value,
         24U, f2.values.size(), f2.values.data(), fr2.values.size(), fr2.values.data()},
    };
    std::vector<ledger::ModelView> g_models = {
        {0U, ledger::ModelKind::origin, zero.value, one.value, zero.value, 32U,
         g0.values.size(), g0.values.data(), gr0.values.size(), gr0.values.data()},
        {1U, ledger::ModelKind::positive_panel, one.value, two.value, one.value,
         24U, g1.values.size(), g1.values.data(), gr1.values.size(), gr1.values.data()},
        {2U, ledger::ModelKind::positive_panel, two.value, three.value, two.value,
         24U, g2.values.size(), g2.values.data(), gr2.values.size(), gr2.values.data()},
    };
    Storage boundary(jet::kJetCount);
    for (std::size_t component = 0U; component < jet::kJetCount; ++component)
        arb_set_ui(boundary.values.data() + component,
                   static_cast<ulong>(3U * (component + 2U)));

    jet::Input input{{f_models.size(), f_models.data()},
        {g_models.size(), g_models.data()}, two.value, three.value, 24U,
        zero.value, one.value, boundary.values.size(), boundary.values.data()};
    jet::Output output;
    jet::Result result{};
    const bool accepted = jet::evaluate(input, &output, &result);
    checks.push_back(accepted && result.accepted
        && result.detail == jet::FailureDetail::none && neutral(result));
    checks.push_back(output.retained_order == 24U
        && exact_integer(output.coefficient(0U, jet::value_jet()),
                         8U * pair_scale(0U, 0U))
        && exact_integer(output.coefficient(1U, jet::value_jet()),
                         2U * pair_scale(0U, 0U)));

    bool first_exact = true;
    for (std::size_t a = 0U; a < jet::kParameterCount; ++a) {
        const std::size_t index = jet::first_jet(a);
        const unsigned scale = pair_scale(index, 0U) + pair_scale(0U, index);
        first_exact = first_exact
            && exact_integer(output.coefficient(0U, index), 8U * scale)
            && exact_integer(output.coefficient(1U, index), 2U * scale);
    }
    checks.push_back(first_exact);

    bool second_exact = true;
    for (std::size_t a = 0U; a < jet::kParameterCount; ++a) {
        for (std::size_t b = 0U; b < jet::kParameterCount; ++b) {
            const std::size_t destination = jet::second_jet(a, b);
            const unsigned scale = pair_scale(destination, 0U)
                + pair_scale(jet::first_jet(a), jet::first_jet(b))
                + pair_scale(jet::first_jet(b), jet::first_jet(a))
                + pair_scale(0U, destination);
            second_exact = second_exact
                && exact_integer(output.coefficient(0U, destination), 8U * scale)
                && exact_integer(output.coefficient(1U, destination), 2U * scale);
        }
    }
    checks.push_back(second_exact);
    bool high_zero = true, remainder_positive = true;
    for (std::size_t component = 0U; component < jet::kJetCount; ++component) {
        remainder_positive = remainder_positive
            && arb_is_positive(output.remainder(component));
        for (unsigned degree = 2U; degree <= output.retained_order; ++degree)
            high_zero = high_zero
                && arb_is_zero(output.coefficient(degree, component));
    }
    checks.push_back(high_zero && remainder_positive);
    checks.push_back(result.elementary_convolutions == 43U
        && result.base_terms == 1U && result.first_terms == 6U
        && result.ordered_second_terms == 36U
        && result.mixed_orientation_terms == 18U);
    checks.push_back(result.positive_remainder_cross_terms == 129U
        && result.discarded_polynomial_terms == 43U
        && result.affine_composition_terms == 43U
        && result.source_hull_terms == 86U);
    checks.push_back(result.complete_ordered_13_jet_inventory
        && result.both_mixed_orientations_retained
        && !result.signed_remainder_cancellation_used
        && !result.midpoint_selection_used && !result.point_sampling_used);

    auto short_inventory = input; short_inventory.g_at_zero_count = 12U;
    checks.push_back(rejected(short_inventory,
        jet::FailureDetail::invalid_jet_inventory));
    auto null_inventory = input; null_inventory.g_at_zero_jets = nullptr;
    checks.push_back(rejected(null_inventory,
        jet::FailureDetail::invalid_jet_inventory));
    arb_indeterminate(boundary.values.data() + 12U);
    checks.push_back(rejected(input, jet::FailureDetail::invalid_jet_inventory));
    arb_set_ui(boundary.values.data() + 12U, 42UL);
    auto bad_order = input; bad_order.target_order = 25U;
    checks.push_back(rejected(bad_order,
        jet::FailureDetail::bivariate_predecessor));
    f_models[2U].left_endpoint = one.value;
    checks.push_back(rejected(input,
        jet::FailureDetail::bivariate_predecessor));
    f_models[2U].left_endpoint = two.value;

    jet::Result missing_output{};
    checks.push_back(!jet::evaluate(input, nullptr, &missing_output)
        && missing_output.detail == jet::FailureDetail::missing_output
        && neutral(missing_output));
    checks.push_back(!jet::evaluate(input, &output, nullptr));
    checks.push_back(jet::value_jet() == 0U && jet::first_jet(0U) == 1U
        && jet::first_jet(2U) == 3U && jet::second_jet(0U, 0U) == 4U
        && jet::second_jet(2U, 2U) == 12U
        && jet::kElementaryConvolutions == 43U);
    checks.push_back(std::string(jet::failure_detail_name(
        jet::FailureDetail::nonfinite_remainder_or_assembly))
        == "C08-010C_NONFINITE_REMAINDER_OR_ASSEMBLY");

    std::size_t passed = 0U;
    std::uint64_t mask = 0U;
    for (std::size_t index = 0U; index < checks.size(); ++index)
        if (checks[index]) { ++passed; mask |= std::uint64_t{1} << index; }
    std::cout << "{\"authority_promoted\":false,\"candidate_evaluations\":0,"
        "\"candidate_roots_created\":false,\"checks_passed\":" << passed
        << ",\"checks_total\":" << checks.size()
        << ",\"complete_ordered_13_jet_inventory\":"
        << (result.complete_ordered_13_jet_inventory ? "true" : "false")
        << ",\"elementary_convolutions\":" << result.elementary_convolutions
        << ",\"fixture_mask\":" << mask
        << ",\"mixed_orientation_terms\":" << result.mixed_orientation_terms
        << ",\"positive_parameter_samples\":0,\"positive_remainder_cross_terms\":"
        << result.positive_remainder_cross_terms
        << ",\"retained_order\":" << output.retained_order
        << ",\"schema\":\"nhm2.g2h_e_s5.primary_c08_convolution_jet_fixture.v1\","
        "\"scientific_handler_linked\":false,\"signed_remainder_cancellation_used\":false,"
        "\"state_coefficients_read\":0,\"status\":\""
        << (passed == checks.size() ? "PASS" : "FAIL") << "\"}\n";
    return passed == checks.size() ? 0 : 1;
}
