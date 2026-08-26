#include "mini_boson_star_primary_c08_finite_history_v1.hpp"

#include <arb.h>

#include <array>
#include <cstddef>
#include <cstdint>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

namespace finite_history =
    nhm2::g2h_e_s5::primary_c08_finite_history_v1;
namespace ledger = finite_history::ledger;
namespace tail = finite_history::tail;
namespace chronology = finite_history::chronology;

namespace {

struct Checkbook {
    std::size_t passed = 0U;
    std::size_t total = 0U;
    void check(bool condition, const char *name) {
        ++total;
        if (condition) ++passed;
        else std::cerr << "FAIL " << name << '\n';
    }
};

struct OwnedModel {
    arb_t left;
    arb_t right;
    arb_t center;
    std::vector<arb_struct> coefficients;
    std::array<arb_struct, finite_history::kJetCount> remainders;
    ledger::ModelView view;

    OwnedModel(std::size_t ordinal, ledger::ModelKind kind, unsigned order,
               unsigned left_value, unsigned right_value,
               unsigned state_scale)
        : coefficients((static_cast<std::size_t>(order) + 1U)
                       * finite_history::kJetCount) {
        arb_init(left); arb_init(right); arb_init(center);
        arb_set_ui(left, left_value); arb_set_ui(right, right_value);
        arb_set(center, left);
        for (auto &coefficient : coefficients) arb_init(&coefficient);
        for (auto &remainder : remainders) {
            arb_init(&remainder);
            arb_zero(&remainder);
        }
        for (std::size_t jet = 0U; jet < finite_history::kJetCount; ++jet) {
            arb_set_ui(coefficients.data() + jet,
                       static_cast<unsigned long>(16U * state_scale + jet));
            arb_div_ui(coefficients.data() + jet,
                       coefficients.data() + jet, 16U,
                       finite_history::kPrecisionBits);
        }
        view = {ordinal, kind, left, right, center, order,
                coefficients.size(), coefficients.data(), remainders.size(),
                remainders.data()};
    }

    ~OwnedModel() {
        for (auto &remainder : remainders) arb_clear(&remainder);
        for (auto &coefficient : coefficients) arb_clear(&coefficient);
        arb_clear(center); arb_clear(right); arb_clear(left);
    }

    OwnedModel(const OwnedModel &) = delete;
    OwnedModel &operator=(const OwnedModel &) = delete;
};

struct OwnedLedger {
    std::uint32_t identity = 0U;
    std::vector<std::unique_ptr<OwnedModel>> owned;
    std::vector<ledger::ModelView> views;

    OwnedLedger(std::uint32_t id, unsigned state_scale, bool extended)
        : identity(id) {
        owned.emplace_back(std::make_unique<OwnedModel>(
            0U, ledger::ModelKind::origin, 32U, 0U, 1U, state_scale));
        owned.emplace_back(std::make_unique<OwnedModel>(
            1U, ledger::ModelKind::positive_panel, 24U, 1U, 2U,
            state_scale));
        if (extended)
            owned.emplace_back(std::make_unique<OwnedModel>(
                2U, ledger::ModelKind::positive_panel, 24U, 2U, 4U,
                state_scale));
        refresh();
    }

    void refresh() {
        views.clear();
        for (const auto &model : owned) views.push_back(model->view);
    }

    finite_history::TaggedLedgerView tagged() const {
        return {identity, {views.size(), views.data()}};
    }
};

struct Scenario {
    std::array<std::unique_ptr<OwnedLedger>, 4U> before_ledgers;
    std::array<std::unique_ptr<OwnedLedger>, 4U> after_ledgers;
    std::array<finite_history::TaggedLedgerView, 4U> before_tags;
    std::array<finite_history::TaggedLedgerView, 4U> after_tags;
    finite_history::FiniteContinuationResponse response;
    std::size_t calls = 0U;
    bool provider_return = true;

    Scenario() {
        constexpr std::array<std::uint32_t, 4U> ids = {10U, 20U, 30U, 40U};
        for (std::size_t state = 0U; state < ids.size(); ++state) {
            before_ledgers[state] = std::make_unique<OwnedLedger>(
                ids[state], static_cast<unsigned>(state + 1U), false);
            after_ledgers[state] = std::make_unique<OwnedLedger>(
                ids[state], static_cast<unsigned>(state + 1U), true);
            before_tags[state] = before_ledgers[state]->tagged();
            after_tags[state] = after_ledgers[state]->tagged();
        }
        refresh_response();
    }

    void refresh_response() {
        for (std::size_t state = 0U; state < after_tags.size(); ++state) {
            before_ledgers[state]->refresh();
            after_ledgers[state]->refresh();
            before_tags[state] = before_ledgers[state]->tagged();
            after_tags[state] = after_ledgers[state]->tagged();
        }
        response.accepted_after = {after_tags.size(), after_tags.data()};
        response.c08_006_passed = true;
        response.c08_007_passed = true;
        response.c08_008_passed = true;
        response.c08_009_passed = true;
        response.c08_010_passed = true;
        response.failure = chronology::FiniteFailureCode::none;
    }

    finite_history::LedgerSetView before_view() const {
        return {before_tags.size(), before_tags.data()};
    }
};

bool provider(const finite_history::FiniteContinuationRequest &request,
              finite_history::FiniteContinuationResponse *response,
              void *context) {
    auto *scenario = static_cast<Scenario *>(context);
    ++scenario->calls;
    if (response == nullptr || request.t0 != 2U || request.terminal_t != 4U)
        return false;
    *response = scenario->response;
    return scenario->provider_return;
}

struct TailWitness {
    tail::Output output;
    tail::Result result;
    TailWitness() {
        fmpq_mat_one(output.p_lyap);
        result.accepted = true;
        result.detail = tail::FailureDetail::none;
    }
};

struct Sigmas {
    arb_t zero;
    arb_t quarter;
    arb_t touching;
    Sigmas() {
        arb_init(zero); arb_init(quarter); arb_init(touching);
        arb_zero(zero);
        arb_set_ui(quarter, 1U);
        arb_div_ui(quarter, quarter, 4U, finite_history::kPrecisionBits);
        arb_zero(touching);
        mag_one(arb_radref(touching));
    }
    ~Sigmas() { arb_clear(touching); arb_clear(quarter); arb_clear(zero); }
};

finite_history::Input make_input(
    Scenario &scenario, TailWitness &witness,
    const std::array<finite_history::HistoryRequest, 2U> &histories) {
    finite_history::Input input{};
    input.t0 = 2U;
    input.terminal_t = 4U;
    input.tail_witness_t0 = 2U;
    input.tail_witness = &witness.output;
    input.tail_result = &witness.result;
    input.accepted_before = scenario.before_view();
    input.continuation_provider = provider;
    input.continuation_context = &scenario;
    input.scalar_state_ledger_identities = {10U, 20U, 30U, 40U};
    input.history_request_count = histories.size();
    input.history_requests = histories.data();
    return input;
}

bool same_digest(const std::array<std::uint8_t, finite_history::kDigestBytes> &a,
                 const std::array<std::uint8_t, finite_history::kDigestBytes> &b) {
    return a == b;
}

}  // namespace

int main() {
    Checkbook checks;
    Sigmas sigmas;
    TailWitness witness;
    const std::array<finite_history::HistoryRequest, 2U> histories = {{
        {100U, 10U, sigmas.zero}, {200U, 20U, sigmas.quarter}}};

    Scenario baseline;
    finite_history::Input input = make_input(baseline, witness, histories);
    finite_history::Output output;
    finite_history::Result result{};
    const bool accepted = finite_history::evaluate(input, &output, &result);
    checks.check(accepted && result.accepted
                     && result.detail == finite_history::FailureDetail::none,
                 "manufactured_accept");
    checks.check(baseline.calls == 1U
                     && result.continuation_requested_after_early_tail,
                 "provider_after_early_tail");
    checks.check(same_digest(output.ledger_digest_before,
                             output.reused_prefix_digest)
                     && output.ledger_digest_after
                            != output.ledger_digest_before
                     && result.append_only_prefix_reused_byte_for_byte,
                 "append_only_digests");
    checks.check(output.ledger_models_before == 8U
                     && output.ledger_models_after == 12U
                     && result.prefix_models_compared == 8U
                     && result.terminal_models_validated == 12U,
                 "model_counts");
    checks.check(arb_contains_si(output.onset_qp.data(), 30)
                     && result.onset_boxes_produced == 52U
                     && result.p_norm_quadratic_terms == 208U,
                 "onset_p_norm");
    checks.check(arb_is_positive(output.c0o)
                     && arb_is_positive(output.c1o)
                     && arb_is_positive(output.c2o),
                 "onset_constants_positive");
    checks.check(output.panel_contributions.size() == 52U
                     && result.history_panels_integrated == 52U
                     && result.increasing_panel_chronology,
                 "panel_chronology_and_inventory");
    arb_t expected_two;
    arb_init(expected_two); arb_set_ui(expected_two, 2U);
    checks.check(arb_contains(output.history_total(0U, 0U), expected_two),
                 "zero_sigma_exact_history");
    arb_t expected_weighted, half, exponential;
    arb_init(expected_weighted); arb_init(half); arb_init(exponential);
    arb_one(half); arb_div_ui(half, half, 2U, finite_history::kPrecisionBits);
    arb_neg(half, half); arb_exp(exponential, half,
                                finite_history::kPrecisionBits);
    arb_one(expected_weighted);
    arb_sub(expected_weighted, expected_weighted, exponential,
            finite_history::kPrecisionBits);
    arb_mul_ui(expected_weighted, expected_weighted, 8U,
               finite_history::kPrecisionBits);
    checks.check(arb_overlaps(output.history_total(1U, 0U), expected_weighted)
                     && result.incomplete_gamma_moments > 0U
                     && result.exact_zero_sigma_moments > 0U,
                 "positive_sigma_incomplete_gamma_history");
    checks.check(!result.signed_remainder_cancellation_used
                     && result.candidate_evaluations == 0U
                     && result.positive_parameter_samples == 0U
                     && !result.candidate_root_created
                     && !result.scientific_handler_linked
                     && !result.authority_promoted,
                 "candidate_and_authority_inert");

    Scenario no_tail;
    TailWitness rejected_witness;
    rejected_witness.result.accepted = false;
    auto no_tail_input = make_input(no_tail, rejected_witness, histories);
    finite_history::Result no_tail_result{};
    checks.check(!finite_history::evaluate(no_tail_input, &output,
                                            &no_tail_result)
                     && no_tail.calls == 0U
                     && no_tail_result.detail
                            == finite_history::FailureDetail::early_tail_not_passed,
                 "early_tail_guard");

    Scenario mismatched_tail;
    auto mismatched_tail_input = make_input(mismatched_tail, witness, histories);
    mismatched_tail_input.tail_witness_t0 = 1U;
    finite_history::Result mismatched_tail_result{};
    checks.check(!finite_history::evaluate(mismatched_tail_input, &output,
                                            &mismatched_tail_result)
                     && mismatched_tail.calls == 0U
                     && mismatched_tail_result.detail
                            == finite_history::FailureDetail::early_tail_not_passed,
                 "tail_onset_binding_guard");

    Scenario invalid_onset;
    auto invalid_onset_input = make_input(invalid_onset, witness, histories);
    invalid_onset_input.t0 = 3U;
    invalid_onset_input.terminal_t = 6U;
    finite_history::Result invalid_onset_result{};
    checks.check(!finite_history::evaluate(invalid_onset_input, &output,
                                            &invalid_onset_result)
                     && invalid_onset.calls == 0U
                     && invalid_onset_result.detail
                            == finite_history::FailureDetail::invalid_onset_or_split,
                 "onset_guard");

    Scenario finite_failure;
    finite_failure.provider_return = false;
    finite_failure.response.failure =
        chronology::FiniteFailureCode::
            c08_009_picard_inflation_or_width_exhaustion;
    auto finite_failure_input = make_input(finite_failure, witness, histories);
    finite_history::Result finite_failure_result{};
    checks.check(!finite_history::evaluate(finite_failure_input, &output,
                                            &finite_failure_result)
                     && finite_failure_result.detail
                            == finite_history::FailureDetail::finite_producer_failure
                     && finite_failure_result.propagated_finite_failure
                            == finite_failure.response.failure,
                 "typed_finite_failure_propagated");

    Scenario untyped_failure;
    untyped_failure.provider_return = false;
    auto untyped_failure_input = make_input(untyped_failure, witness, histories);
    finite_history::Result untyped_failure_result{};
    checks.check(!finite_history::evaluate(untyped_failure_input, &output,
                                            &untyped_failure_result)
                     && untyped_failure_result.detail
                            == finite_history::FailureDetail::
                                continuation_provider_contract,
                 "untyped_provider_failure_rejected");

    Scenario prefix_mutation;
    arb_add_ui(prefix_mutation.after_ledgers[0]->owned[0]->coefficients.data(),
               prefix_mutation.after_ledgers[0]->owned[0]->coefficients.data(),
               1U, finite_history::kPrecisionBits);
    prefix_mutation.refresh_response();
    auto prefix_input = make_input(prefix_mutation, witness, histories);
    finite_history::Result prefix_result{};
    checks.check(!finite_history::evaluate(prefix_input, &output, &prefix_result)
                     && prefix_result.detail
                            == finite_history::FailureDetail::
                                append_only_prefix_violation,
                 "prefix_mutation_rejected");

    Scenario shrink;
    shrink.after_ledgers[0]->owned.resize(1U);
    shrink.refresh_response();
    auto shrink_input = make_input(shrink, witness, histories);
    finite_history::Result shrink_result{};
    checks.check(!finite_history::evaluate(shrink_input, &output, &shrink_result)
                     && shrink_result.detail
                            == finite_history::FailureDetail::
                                append_only_prefix_violation,
                 "ledger_shrink_rejected");

    Scenario uncovered;
    arb_set_ui(uncovered.after_ledgers[1]->owned.back()->right, 3U);
    uncovered.refresh_response();
    auto uncovered_input = make_input(uncovered, witness, histories);
    finite_history::Result uncovered_result{};
    checks.check(!finite_history::evaluate(uncovered_input, &output,
                                            &uncovered_result)
                     && uncovered_result.detail
                            == finite_history::FailureDetail::
                                terminal_ledger_invalid_or_uncovered,
                 "terminal_coverage_rejected");

    Scenario duplicate_state;
    auto duplicate_state_input = make_input(duplicate_state, witness, histories);
    duplicate_state_input.scalar_state_ledger_identities = {10U, 10U, 30U, 40U};
    finite_history::Result duplicate_state_result{};
    checks.check(!finite_history::evaluate(duplicate_state_input, &output,
                                            &duplicate_state_result)
                     && duplicate_state_result.detail
                            == finite_history::FailureDetail::scalar_state_inventory,
                 "duplicate_scalar_inventory_rejected");

    Scenario missing_history;
    auto missing_history_rows = histories;
    missing_history_rows[1].ledger_identity = 999U;
    auto missing_history_input = make_input(missing_history, witness,
                                            missing_history_rows);
    finite_history::Result missing_history_result{};
    checks.check(!finite_history::evaluate(missing_history_input, &output,
                                            &missing_history_result)
                     && missing_history_result.detail
                            == finite_history::FailureDetail::
                                history_inventory_or_sigma,
                 "missing_history_ledger_rejected");

    Scenario touching_sigma;
    auto touching_rows = histories;
    touching_rows[1].sigma = sigmas.touching;
    auto touching_input = make_input(touching_sigma, witness, touching_rows);
    finite_history::Result touching_result{};
    checks.check(!finite_history::evaluate(touching_input, &output,
                                            &touching_result)
                     && touching_result.detail
                            == finite_history::FailureDetail::
                                history_inventory_or_sigma,
                 "touching_sigma_rejected");

    Scenario duplicate_orientation;
    auto duplicate_rows = histories;
    duplicate_rows[1].orientation = duplicate_rows[0].orientation;
    auto duplicate_input = make_input(duplicate_orientation, witness,
                                      duplicate_rows);
    finite_history::Result duplicate_result{};
    checks.check(!finite_history::evaluate(duplicate_input, &output,
                                            &duplicate_result)
                     && duplicate_result.detail
                            == finite_history::FailureDetail::
                                history_inventory_or_sigma,
                 "duplicate_orientation_rejected");

    Scenario deterministic;
    auto deterministic_input = make_input(deterministic, witness, histories);
    finite_history::Output output_a;
    finite_history::Output output_b;
    finite_history::Result result_a{};
    finite_history::Result result_b{};
    const bool accepted_a = finite_history::evaluate(
        deterministic_input, &output_a, &result_a);
    const bool accepted_b = finite_history::evaluate(
        deterministic_input, &output_b, &result_b);
    checks.check(accepted_a && accepted_b
                     && same_digest(output_a.ledger_digest_before,
                                    output_b.ledger_digest_before)
                     && same_digest(output_a.ledger_digest_after,
                                    output_b.ledger_digest_after)
                     && arb_equal(output_a.history_total(0U, 0U),
                                  output_b.history_total(0U, 0U))
                     && arb_equal(output_a.history_total(1U, 0U),
                                  output_b.history_total(1U, 0U)),
                 "deterministic_replay");

    finite_history::Result null_output_result{};
    checks.check(!finite_history::evaluate(input, nullptr, &null_output_result)
                     && null_output_result.detail
                            == finite_history::FailureDetail::missing_output_or_input,
                 "null_output_guard");
    checks.check(!finite_history::evaluate(input, &output, nullptr),
                 "null_result_guard");

    arb_clear(exponential); arb_clear(half); arb_clear(expected_weighted);
    arb_clear(expected_two);
    std::cout << "{\"schema\":\"nhm2.g2h_e_s5.c08_finite_history_fixture.v1\""
              << ",\"status\":\""
              << (checks.passed == checks.total ? "PASS" : "FAIL") << "\""
              << ",\"checks_passed\":" << checks.passed
              << ",\"checks_total\":" << checks.total
              << ",\"ledger_models_before\":" << output_a.ledger_models_before
              << ",\"ledger_models_after\":" << output_a.ledger_models_after
              << ",\"onset_boxes\":" << result_a.onset_boxes_produced
              << ",\"history_panel_contributions\":"
              << result_a.history_panels_integrated
              << ",\"candidate_evaluations\":0"
              << ",\"positive_parameter_samples\":0"
              << ",\"candidate_roots_created\":false"
              << ",\"scientific_handler_linked\":false"
              << ",\"authority_promoted\":false}\n";
    return checks.passed == checks.total ? 0 : 1;
}
