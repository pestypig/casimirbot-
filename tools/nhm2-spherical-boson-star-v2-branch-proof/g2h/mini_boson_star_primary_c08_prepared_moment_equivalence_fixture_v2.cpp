#include "mini_boson_star_primary_c08_convolution_jet_v1.hpp"

#include <arb.h>

#include <cstdint>
#include <iostream>
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

bool same_result(const jet::Result &left, const jet::Result &right) {
    return left.accepted == right.accepted
        && left.detail == right.detail
        && left.elementary_convolutions == right.elementary_convolutions
        && left.base_terms == right.base_terms
        && left.first_terms == right.first_terms
        && left.ordered_second_terms == right.ordered_second_terms
        && left.mixed_orientation_terms == right.mixed_orientation_terms
        && left.positive_remainder_cross_terms
            == right.positive_remainder_cross_terms
        && left.discarded_polynomial_terms == right.discarded_polynomial_terms
        && left.affine_composition_terms == right.affine_composition_terms
        && left.source_hull_terms == right.source_hull_terms
        && left.complete_ordered_13_jet_inventory
            == right.complete_ordered_13_jet_inventory
        && left.both_mixed_orientations_retained
            == right.both_mixed_orientations_retained
        && left.signed_remainder_cancellation_used
            == right.signed_remainder_cancellation_used
        && left.midpoint_selection_used == right.midpoint_selection_used
        && left.point_sampling_used == right.point_sampling_used
        && left.state_coefficients_read == right.state_coefficients_read
        && left.candidate_evaluations == right.candidate_evaluations
        && left.positive_parameter_samples == right.positive_parameter_samples
        && left.candidate_root_created == right.candidate_root_created
        && left.scientific_handler_linked == right.scientific_handler_linked
        && left.authority_promoted == right.authority_promoted;
}

bool same_output(const jet::Output &left, const jet::Output &right) {
    if (left.retained_order != right.retained_order
        || !arb_equal(left.target_center, right.target_center)
        || !arb_equal(left.target_half_width, right.target_half_width)
        || left.retained_xi_coefficients.size()
            != right.retained_xi_coefficients.size()
        || left.uniform_remainder_bounds.size()
            != right.uniform_remainder_bounds.size()) {
        return false;
    }
    for (std::size_t index = 0U;
         index < left.retained_xi_coefficients.size(); ++index) {
        if (!arb_equal(left.retained_xi_coefficients.data() + index,
                       right.retained_xi_coefficients.data() + index)) {
            return false;
        }
    }
    for (std::size_t index = 0U;
         index < left.uniform_remainder_bounds.size(); ++index) {
        if (!arb_equal(left.uniform_remainder_bounds.data() + index,
                       right.uniform_remainder_bounds.data() + index)) {
            return false;
        }
    }
    return true;
}

bool neutral(const jet::Result &result) {
    return result.state_coefficients_read == 0U
        && result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created && !result.scientific_handler_linked
        && !result.authority_promoted;
}

bool equivalent(const jet::Input &input) {
    jet::Output oracle_output;
    jet::Output prepared_output;
    jet::Result oracle_result{};
    jet::Result prepared_result{};
    const bool oracle_accepted = jet::evaluate(
        input, &oracle_output, &oracle_result);
    const bool prepared_accepted = jet::evaluate_prepared(
        input, &prepared_output, &prepared_result);
    return oracle_accepted == prepared_accepted
        && same_result(oracle_result, prepared_result)
        && same_output(oracle_output, prepared_output)
        && neutral(oracle_result) && neutral(prepared_result);
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
    checks.push_back(equivalent(input));

    auto short_inventory = input;
    short_inventory.g_at_zero_count = jet::kJetCount - 1U;
    checks.push_back(equivalent(short_inventory));
    auto null_inventory = input;
    null_inventory.g_at_zero_jets = nullptr;
    checks.push_back(equivalent(null_inventory));
    arb_indeterminate(boundary.values.data() + 12U);
    checks.push_back(equivalent(input));
    arb_set_ui(boundary.values.data() + 12U, 42UL);
    auto bad_order = input;
    bad_order.target_order = 25U;
    checks.push_back(equivalent(bad_order));
    f_models[2U].left_endpoint = one.value;
    checks.push_back(equivalent(input));
    f_models[2U].left_endpoint = two.value;

    jet::Result oracle_missing{};
    jet::Result prepared_missing{};
    checks.push_back(!jet::evaluate(input, nullptr, &oracle_missing)
        && !jet::evaluate_prepared(input, nullptr, &prepared_missing)
        && same_result(oracle_missing, prepared_missing)
        && neutral(oracle_missing) && neutral(prepared_missing));
    jet::Output null_result_output;
    checks.push_back(!jet::evaluate(input, &null_result_output, nullptr)
        && !jet::evaluate_prepared(input, &null_result_output, nullptr));

    std::size_t passed = 0U;
    std::uint64_t mask = 0U;
    for (std::size_t index = 0U; index < checks.size(); ++index) {
        if (checks[index]) { ++passed; mask |= std::uint64_t{1} << index; }
    }
    std::cout
        << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_prepared_moment_equivalence.v2\""
        << ",\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL")
        << "\",\"checks_passed\":" << passed
        << ",\"checks_total\":" << checks.size()
        << ",\"fixture_mask\":" << mask
        << ",\"arb_equal_all_outputs\":"
        << (checks.front() ? "true" : "false")
        << ",\"candidate_evaluations\":0"
        << ",\"positive_parameter_samples\":0"
        << ",\"candidate_roots_created\":false"
        << ",\"scientific_handler_linked\":false"
        << ",\"authority_promoted\":false}\n";
    return passed == checks.size() ? 0 : 1;
}
