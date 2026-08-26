#include "mini_boson_star_primary_c08_convolution_ledger_v1.hpp"

#include <arb.h>
#include <flint/fmpq.h>

#include <cstdint>
#include <iostream>
#include <string>
#include <vector>

namespace ledger =
    nhm2::g2h_e_s5::primary_c08_convolution_ledger_v1;

namespace {

struct Ball {
    Ball() { arb_init(value); }
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

bool neutral(const ledger::Result &result) {
    return result.state_coefficients_read == 0U
        && result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created && !result.scientific_handler_linked
        && !result.authority_promoted;
}

bool ordinals(const std::vector<std::size_t> &actual,
              std::initializer_list<std::size_t> expected) {
    return actual == std::vector<std::size_t>(expected);
}

bool rejected(const ledger::Input &input, ledger::FailureDetail detail) {
    ledger::Output output;
    ledger::Result result{};
    return !ledger::evaluate(input, &output, &result)
        && result.detail == detail && neutral(result);
}

}  // namespace

int main() {
    std::vector<bool> checks;
    Ball zero, one, two, three, four, one_quarter, one_half;
    arb_zero(zero.value); arb_one(one.value); arb_set_ui(two.value, 2UL);
    arb_set_ui(three.value, 3UL); arb_set_ui(four.value, 4UL);
    rational(one_quarter.value, 1L, 4L); rational(one_half.value, 1L, 2L);

    Storage origin_coefficients((32U + 1U) * ledger::kJetCount);
    Storage panel1_coefficients((24U + 1U) * ledger::kJetCount);
    Storage panel2_coefficients((24U + 1U) * ledger::kJetCount);
    Storage origin_remainders(ledger::kJetCount);
    Storage panel1_remainders(ledger::kJetCount);
    Storage panel2_remainders(ledger::kJetCount);
    std::vector<ledger::ModelView> models = {
        {0U, ledger::ModelKind::origin, zero.value, one.value, zero.value, 32U,
         origin_coefficients.values.size(), origin_coefficients.values.data(),
         origin_remainders.values.size(), origin_remainders.values.data()},
        {1U, ledger::ModelKind::positive_panel, one.value, two.value, one.value,
         24U, panel1_coefficients.values.size(), panel1_coefficients.values.data(),
         panel1_remainders.values.size(), panel1_remainders.values.data()},
        {2U, ledger::ModelKind::positive_panel, two.value, three.value, two.value,
         24U, panel2_coefficients.values.size(), panel2_coefficients.values.data(),
         panel2_remainders.values.size(), panel2_remainders.values.data()},
    };
    ledger::Input input{{models.size(), models.data()}, two.value, three.value,
                        one_quarter.value, one_half.value};
    ledger::Output output;
    ledger::Result result{};
    const bool accepted = ledger::evaluate(input, &output, &result);
    checks.push_back(accepted && result.accepted
        && result.detail == ledger::FailureDetail::none && neutral(result));
    checks.push_back(result.models_validated == 3U
        && result.coefficient_balls_validated == 1079U
        && result.remainder_balls_validated == 39U
        && result.closed_intersection_checks == 6U);
    checks.push_back(ordinals(output.direct_intersecting_ordinals, {0U, 1U})
        && ordinals(output.reflected_intersecting_ordinals, {0U, 1U, 2U}));
    checks.push_back(output.direct_shared_face_retained
        && output.reflected_shared_face_retained
        && result.exact_shared_faces_required
        && result.every_intersecting_model_enumerated
        && !result.midpoint_selection_used);

    auto endpoint_rectangle = input;
    endpoint_rectangle.u_left = zero.value;
    endpoint_rectangle.u_right = one.value;
    ledger::Output endpoint_output;
    ledger::Result endpoint_result{};
    checks.push_back(ledger::evaluate(endpoint_rectangle, &endpoint_output,
        &endpoint_result)
        && ordinals(endpoint_output.direct_intersecting_ordinals, {0U, 1U, 2U})
        && ordinals(endpoint_output.reflected_intersecting_ordinals,
                    {0U, 1U, 2U})
        && neutral(endpoint_result));

    Storage origin_only_coefficients((32U + 1U) * ledger::kJetCount);
    Storage origin_only_remainders(ledger::kJetCount);
    std::vector<ledger::ModelView> origin_only_models = {
        {0U, ledger::ModelKind::origin, zero.value, three.value, zero.value, 32U,
         origin_only_coefficients.values.size(),
         origin_only_coefficients.values.data(), origin_only_remainders.values.size(),
         origin_only_remainders.values.data()},
    };
    ledger::Input origin_only{{1U, origin_only_models.data()}, two.value,
                              three.value, one_quarter.value, one_half.value};
    ledger::Output origin_only_output;
    ledger::Result origin_only_result{};
    checks.push_back(ledger::evaluate(origin_only, &origin_only_output,
        &origin_only_result)
        && ordinals(origin_only_output.direct_intersecting_ordinals, {0U})
        && ordinals(origin_only_output.reflected_intersecting_ordinals, {0U})
        && !origin_only_output.direct_shared_face_retained
        && neutral(origin_only_result));

    auto chronology_models = models;
    chronology_models[1].ordinal = 2U;
    auto chronology = input; chronology.ledger.models = chronology_models.data();
    checks.push_back(rejected(chronology,
        ledger::FailureDetail::ledger_chronology_or_geometry));

    Ball gap_left; rational(gap_left.value, 9L, 8L);
    auto gap_models = models; gap_models[1].left_endpoint = gap_left.value;
    gap_models[1].expansion_center = gap_left.value;
    auto gap = input; gap.ledger.models = gap_models.data();
    checks.push_back(rejected(gap,
        ledger::FailureDetail::ledger_chronology_or_geometry));

    auto center_models = models;
    center_models[2].expansion_center = one.value;
    auto wrong_center = input; wrong_center.ledger.models = center_models.data();
    checks.push_back(rejected(wrong_center,
        ledger::FailureDetail::ledger_chronology_or_geometry));

    auto wrong_order_models = models; wrong_order_models[1].order = 25U;
    auto wrong_order = input; wrong_order.ledger.models = wrong_order_models.data();
    checks.push_back(rejected(wrong_order,
        ledger::FailureDetail::ledger_order_or_storage));

    arb_indeterminate(&panel1_coefficients.values[0]);
    checks.push_back(rejected(input, ledger::FailureDetail::nonfinite_model));
    arb_zero(&panel1_coefficients.values[0]);

    arb_one(&panel1_remainders.values[0]);
    checks.push_back(rejected(input, ledger::FailureDetail::nonfinite_model));
    arb_zero(&panel1_remainders.values[0]);

    auto uncovered = input; uncovered.target_right = four.value;
    checks.push_back(rejected(uncovered,
        ledger::FailureDetail::mapped_interval_uncovered));

    Ball uncertain_u; arb_set(uncertain_u.value, one_half.value);
    arb_add_error_2exp_si(uncertain_u.value, -240L);
    auto nonexact_u = input; nonexact_u.u_right = uncertain_u.value;
    checks.push_back(rejected(nonexact_u,
        ledger::FailureDetail::invalid_target_or_u_rectangle));

    auto missing = input; missing.ledger.models = nullptr;
    checks.push_back(rejected(missing,
        ledger::FailureDetail::ledger_resource_or_pointer));
    auto over_cap = input;
    over_cap.ledger.model_count = ledger::kMaximumLedgerModels + 1U;
    checks.push_back(rejected(over_cap,
        ledger::FailureDetail::ledger_resource_or_pointer));

    ledger::Result missing_output_result{};
    checks.push_back(!ledger::evaluate(input, nullptr, &missing_output_result)
        && missing_output_result.detail == ledger::FailureDetail::missing_output
        && neutral(missing_output_result));
    checks.push_back(!ledger::evaluate(input, &output, nullptr));
    checks.push_back(ledger::kJetCount == 13U
        && ledger::kMaximumPositivePanels == 65536U
        && ledger::kMaximumLedgerModels == 65537U
        && ledger::kMaximumPositiveOrder == 192U
        && ledger::kMaximumOriginOrder == 256U);
    checks.push_back(std::string(ledger::failure_detail_name(
        ledger::FailureDetail::mapped_interval_uncovered))
        == "C08-010A_MAPPED_INTERVAL_UNCOVERED");

    std::size_t passed = 0U;
    std::uint64_t mask = 0U;
    for (std::size_t index = 0U; index < checks.size(); ++index)
        if (checks[index]) { ++passed; mask |= std::uint64_t{1} << index; }
    std::cout << "{\"authority_promoted\":false,\"candidate_evaluations\":0,"
        "\"candidate_roots_created\":false,\"checks_passed\":" << passed
        << ",\"checks_total\":" << checks.size()
        << ",\"closed_intersection_checks\":"
        << result.closed_intersection_checks
        << ",\"direct_models\":" << output.direct_intersecting_ordinals.size()
        << ",\"every_intersecting_model_enumerated\":"
        << (result.every_intersecting_model_enumerated ? "true" : "false")
        << ",\"fixture_mask\":" << mask
        << ",\"midpoint_selection_used\":false,\"models_validated\":"
        << result.models_validated << ",\"positive_parameter_samples\":0,"
        "\"reflected_models\":"
        << output.reflected_intersecting_ordinals.size()
        << ",\"schema\":\"nhm2.g2h_e_s5.primary_c08_convolution_ledger_fixture.v1\","
        "\"scientific_handler_linked\":false,\"state_coefficients_read\":0,"
        "\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL")
        << "\"}\n";
    return passed == checks.size() ? 0 : 1;
}
