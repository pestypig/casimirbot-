#include "mini_boson_star_primary_c08_tail_split_chronology_v1.hpp"

#include <array>
#include <cstdint>
#include <iostream>
#include <string>
#include <vector>

namespace chronology =
    nhm2::g2h_e_s5::primary_c08_tail_split_chronology_v1;

namespace {

struct Scenario {
    std::array<chronology::AttemptView, chronology::kTailSplitAttemptCount>
        attempts{};
    std::array<std::array<std::uint8_t, chronology::kDigestBytes>,
               chronology::kTailSplitAttemptCount> before{};
    std::array<std::array<std::uint8_t, chronology::kDigestBytes>,
               chronology::kTailSplitAttemptCount> reused{};
    std::array<std::array<std::uint8_t, chronology::kDigestBytes>,
               chronology::kTailSplitAttemptCount> after{};

    Scenario() {
        for (std::size_t index = 0U;
             index < chronology::kTailSplitAttemptCount; ++index) {
            attempts[index].ledger_digest_before =
                {chronology::kDigestBytes, before[index].data()};
            attempts[index].reused_prefix_digest =
                {chronology::kDigestBytes, reused[index].data()};
            attempts[index].ledger_digest_after =
                {chronology::kDigestBytes, after[index].data()};
        }
    }
};

void fill_digest(std::array<std::uint8_t, chronology::kDigestBytes> &digest,
                 std::uint8_t value) {
    digest.fill(value);
}

void initialize_attempt(Scenario &scenario, std::size_t index,
                        std::size_t before_count, std::size_t after_count,
                        std::uint8_t before_byte, std::uint8_t after_byte) {
    chronology::AttemptView &attempt = scenario.attempts[index];
    attempt = chronology::AttemptView{};
    fill_digest(scenario.before[index], before_byte);
    fill_digest(scenario.reused[index], before_byte);
    fill_digest(scenario.after[index], after_byte);
    attempt.ordinal = index;
    attempt.t0 = chronology::kTailWitnessOnsets[index];
    attempt.laplace_split_t = 2U * attempt.t0;
    attempt.ledger_models_before = before_count;
    attempt.ledger_models_after = after_count;
    attempt.ledger_digest_before =
        {chronology::kDigestBytes, scenario.before[index].data()};
    attempt.reused_prefix_digest =
        {chronology::kDigestBytes, scenario.reused[index].data()};
    attempt.ledger_digest_after =
        {chronology::kDigestBytes, scenario.after[index].data()};
}

void set_early_complete(chronology::AttemptView &attempt) {
    attempt.parameter_margins_verified = true;
    attempt.lyapunov_constructed = true;
    attempt.compact_box_lmi_verified = true;
    attempt.k1_verified = true;
    attempt.k2_verified = true;
}

void set_early_rejection(chronology::AttemptView &attempt,
                         chronology::RejectionReason reason) {
    if (reason != chronology::RejectionReason::parameter_margin)
        attempt.parameter_margins_verified = true;
    if (reason != chronology::RejectionReason::lyapunov_construction
        && attempt.parameter_margins_verified) attempt.lyapunov_constructed = true;
    if (reason != chronology::RejectionReason::compact_box_lmi
        && attempt.lyapunov_constructed) attempt.compact_box_lmi_verified = true;
    if (reason != chronology::RejectionReason::k1_selector
        && attempt.compact_box_lmi_verified) attempt.k1_verified = true;
    if (reason != chronology::RejectionReason::k2_selector
        && attempt.k1_verified) attempt.k2_verified = true;
    attempt.rejection_reason = reason;
    attempt.disposition =
        chronology::AttemptDisposition::rejected_tail_or_growth_witness;
}

void set_complete_pass(chronology::AttemptView &attempt) {
    set_early_complete(attempt);
    attempt.finite_continuation_requested = true;
    attempt.finite_continuation_succeeded = true;
    attempt.scalar_onset_constants_verified = true;
    attempt.weighted_edge_history_verified = true;
    attempt.realized_scalar_witness_verified = true;
    attempt.metric_forcing_witness_verified = true;
    attempt.record_inventory_complete = true;
    attempt.disposition = chronology::AttemptDisposition::complete_pass;
}

void set_post_finite_rejection(chronology::AttemptView &attempt,
                               chronology::RejectionReason reason) {
    set_early_complete(attempt);
    attempt.finite_continuation_requested = true;
    attempt.finite_continuation_succeeded = true;
    if (reason != chronology::RejectionReason::scalar_onset_constants)
        attempt.scalar_onset_constants_verified = true;
    if (reason != chronology::RejectionReason::weighted_edge_history
        && attempt.scalar_onset_constants_verified)
        attempt.weighted_edge_history_verified = true;
    if (reason != chronology::RejectionReason::realized_scalar_witness
        && attempt.weighted_edge_history_verified)
        attempt.realized_scalar_witness_verified = true;
    if (reason != chronology::RejectionReason::metric_forcing_witness
        && attempt.realized_scalar_witness_verified)
        attempt.metric_forcing_witness_verified = true;
    if (reason != chronology::RejectionReason::record_inventory
        && attempt.metric_forcing_witness_verified)
        attempt.record_inventory_complete = true;
    attempt.rejection_reason = reason;
    attempt.disposition =
        chronology::AttemptDisposition::rejected_tail_or_growth_witness;
}

void set_terminal(chronology::AttemptView &attempt,
                  chronology::FiniteFailureCode failure) {
    set_early_complete(attempt);
    attempt.finite_continuation_requested = true;
    attempt.finite_failure = failure;
    attempt.disposition =
        chronology::AttemptDisposition::finite_terminal_failure;
}

bool neutral(const chronology::Result &result) {
    return result.state_coefficients_read == 0U
        && result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created && !result.scientific_handler_linked
        && !result.authority_promoted;
}

bool rejected(const chronology::Input &input,
              chronology::FailureDetail detail) {
    chronology::Output output;
    chronology::Result result{};
    return !chronology::evaluate(input, &output, &result)
        && result.detail == detail
        && output.outcome == chronology::Outcome::incomplete_attempt_ledger
        && neutral(result);
}

bool same_output(const chronology::Output &left,
                 const chronology::Output &right) {
    return left.outcome == right.outcome
        && left.selected_t0 == right.selected_t0
        && left.selected_t == right.selected_t
        && left.terminal_attempt_ordinal == right.terminal_attempt_ordinal
        && left.final_ledger_models == right.final_ledger_models
        && left.final_ledger_digest == right.final_ledger_digest
        && left.ordered_rejection_reasons == right.ordered_rejection_reasons
        && left.propagated_finite_failure == right.propagated_finite_failure;
}

}  // namespace

int main() {
    std::vector<bool> checks;

    Scenario immediate;
    initialize_attempt(immediate, 0U, 4U, 5U, 10U, 11U);
    set_complete_pass(immediate.attempts[0U]);
    chronology::Output immediate_output;
    chronology::Result immediate_result{};
    const chronology::Input immediate_input{1U, immediate.attempts.data()};
    checks.push_back(chronology::evaluate(immediate_input, &immediate_output,
                                          &immediate_result)
        && immediate_result.accepted && neutral(immediate_result)
        && immediate_output.outcome == chronology::Outcome::selected
        && immediate_output.selected_t0 == 1U
        && immediate_output.selected_t == 2U
        && immediate_output.final_ledger_models == 5U);
    checks.push_back(immediate_result.fixed_onset_schedule
        && immediate_result.early_tail_before_finite
        && immediate_result.append_only_prefix_reuse
        && immediate_result.first_passing_witness_selected
        && !immediate_result.finite_failure_terminal
        && !immediate_result.exhaustion_retuned);

    Scenario ordered;
    initialize_attempt(ordered, 0U, 4U, 4U, 20U, 20U);
    set_early_rejection(ordered.attempts[0U],
                        chronology::RejectionReason::compact_box_lmi);
    initialize_attempt(ordered, 1U, 4U, 6U, 20U, 21U);
    set_post_finite_rejection(
        ordered.attempts[1U],
        chronology::RejectionReason::weighted_edge_history);
    initialize_attempt(ordered, 2U, 6U, 9U, 21U, 22U);
    set_complete_pass(ordered.attempts[2U]);
    chronology::Output ordered_output;
    chronology::Result ordered_result{};
    const chronology::Input ordered_input{3U, ordered.attempts.data()};
    checks.push_back(chronology::evaluate(ordered_input, &ordered_output,
                                          &ordered_result)
        && ordered_output.outcome == chronology::Outcome::selected
        && ordered_output.selected_t0 == 4U && ordered_output.selected_t == 8U
        && ordered_result.attempts_validated == 3U
        && ordered_result.rejected_witnesses_recorded == 2U);
    checks.push_back(ordered_output.ordered_rejection_reasons
        == std::vector<chronology::RejectionReason>({
            chronology::RejectionReason::compact_box_lmi,
            chronology::RejectionReason::weighted_edge_history}));

    Scenario terminal;
    initialize_attempt(terminal, 0U, 7U, 8U, 30U, 31U);
    set_terminal(terminal.attempts[0U],
        chronology::FiniteFailureCode::
            c08_010_volterra_convolution_or_u_refinement_exhaustion);
    chronology::Output terminal_output;
    chronology::Result terminal_result{};
    checks.push_back(chronology::evaluate(
        {1U, terminal.attempts.data()}, &terminal_output, &terminal_result)
        && terminal_output.outcome
            == chronology::Outcome::finite_terminal_failure
        && terminal_output.propagated_finite_failure
            == chronology::FiniteFailureCode::
                c08_010_volterra_convolution_or_u_refinement_exhaustion
        && terminal_result.finite_failure_terminal
        && !terminal_result.first_passing_witness_selected);

    Scenario exhaustion;
    for (std::size_t index = 0U;
         index < chronology::kTailSplitAttemptCount; ++index) {
        initialize_attempt(exhaustion, index, 3U, 3U, 40U, 40U);
        set_early_rejection(exhaustion.attempts[index],
                            chronology::RejectionReason::k1_selector);
    }
    chronology::Output exhaustion_output;
    chronology::Result exhaustion_result{};
    checks.push_back(chronology::evaluate(
        {chronology::kTailSplitAttemptCount, exhaustion.attempts.data()},
        &exhaustion_output, &exhaustion_result)
        && exhaustion_output.outcome
            == chronology::Outcome::tail_split_exhaustion
        && exhaustion_output.ordered_rejection_reasons.size() == 13U
        && exhaustion_result.attempts_validated == 13U
        && exhaustion_result.rejected_witnesses_recorded == 13U
        && !exhaustion_result.exhaustion_retuned);
    chronology::Output partial_output;
    chronology::Result partial_result{};
    checks.push_back(chronology::evaluate(
        {12U, exhaustion.attempts.data()}, &partial_output, &partial_result)
        && partial_output.outcome
            == chronology::Outcome::incomplete_attempt_ledger
        && partial_result.attempts_validated == 12U);

    chronology::Output replay_output;
    chronology::Result replay_result{};
    checks.push_back(chronology::evaluate(ordered_input, &replay_output,
                                          &replay_result)
        && same_output(ordered_output, replay_output) && neutral(replay_result));

    const std::size_t saved_t0 = ordered.attempts[1U].t0;
    ordered.attempts[1U].t0 = 3U;
    checks.push_back(rejected(ordered_input,
        chronology::FailureDetail::onset_or_ordinal_chronology));
    ordered.attempts[1U].t0 = saved_t0;
    const std::size_t saved_t = ordered.attempts[1U].laplace_split_t;
    ordered.attempts[1U].laplace_split_t = 5U;
    checks.push_back(rejected(ordered_input,
        chronology::FailureDetail::onset_or_ordinal_chronology));
    ordered.attempts[1U].laplace_split_t = saved_t;

    const auto saved_reason = ordered.attempts[0U].rejection_reason;
    ordered.attempts[0U].rejection_reason =
        chronology::RejectionReason::k2_selector;
    checks.push_back(rejected(ordered_input,
        chronology::FailureDetail::phase_or_reason_chronology));
    ordered.attempts[0U].rejection_reason = saved_reason;
    ordered.attempts[0U].finite_continuation_requested = true;
    checks.push_back(rejected(ordered_input,
        chronology::FailureDetail::phase_or_reason_chronology));
    ordered.attempts[0U].finite_continuation_requested = false;

    ordered.reused[1U][0U] ^= 1U;
    checks.push_back(rejected(ordered_input,
        chronology::FailureDetail::phase_or_reason_chronology));
    ordered.reused[1U][0U] ^= 1U;
    const std::size_t saved_before = ordered.attempts[2U].ledger_models_before;
    ordered.attempts[2U].ledger_models_before = 5U;
    checks.push_back(rejected(ordered_input,
        chronology::FailureDetail::ledger_append_only_violation));
    ordered.attempts[2U].ledger_models_before = saved_before;
    const std::size_t saved_after = ordered.attempts[2U].ledger_models_after;
    ordered.attempts[2U].ledger_models_after = 5U;
    checks.push_back(rejected(ordered_input,
        chronology::FailureDetail::ledger_append_only_violation));
    ordered.attempts[2U].ledger_models_after = saved_after;

    const bool saved_history = ordered.attempts[1U].weighted_edge_history_verified;
    const bool saved_scalar = ordered.attempts[1U].scalar_onset_constants_verified;
    ordered.attempts[1U].scalar_onset_constants_verified = false;
    ordered.attempts[1U].weighted_edge_history_verified = true;
    checks.push_back(rejected(ordered_input,
        chronology::FailureDetail::phase_or_reason_chronology));
    ordered.attempts[1U].scalar_onset_constants_verified = saved_scalar;
    ordered.attempts[1U].weighted_edge_history_verified = saved_history;

    const bool saved_record = ordered.attempts[2U].record_inventory_complete;
    ordered.attempts[2U].record_inventory_complete = false;
    checks.push_back(rejected(ordered_input,
        chronology::FailureDetail::phase_or_reason_chronology));
    ordered.attempts[2U].record_inventory_complete = saved_record;
    checks.push_back(rejected({4U, ordered.attempts.data()},
        chronology::FailureDetail::attempts_after_terminal_decision));

    terminal.attempts[0U].finite_failure = chronology::FiniteFailureCode::none;
    checks.push_back(rejected({1U, terminal.attempts.data()},
        chronology::FailureDetail::phase_or_reason_chronology));

    chronology::Output missing_output_target;
    chronology::Result missing_output{};
    checks.push_back(!chronology::evaluate(immediate_input, nullptr,
                                           &missing_output)
        && missing_output.detail == chronology::FailureDetail::missing_output
        && neutral(missing_output));
    checks.push_back(!chronology::evaluate(immediate_input,
        &missing_output_target, nullptr));
    checks.push_back(rejected(
        {chronology::kTailSplitAttemptCount + 1U, immediate.attempts.data()},
        chronology::FailureDetail::attempt_resource_or_pointer));
    checks.push_back(rejected({1U, nullptr},
        chronology::FailureDetail::attempt_resource_or_pointer));

    checks.push_back(chronology::kTailWitnessOnsets.front() == 1U
        && chronology::kTailWitnessOnsets.back() == 4096U
        && chronology::kTailSplitAttemptCount == 13U);
    bool doubled = true;
    for (std::size_t index = 1U;
         index < chronology::kTailSplitAttemptCount; ++index) {
        doubled = doubled && chronology::kTailWitnessOnsets[index]
            == 2U * chronology::kTailWitnessOnsets[index - 1U];
    }
    checks.push_back(doubled);
    checks.push_back(std::string(chronology::outcome_name(
        chronology::Outcome::tail_split_exhaustion))
        == "C08-011_TAIL_SPLIT_EXHAUSTION"
        && std::string(chronology::finite_failure_name(
            chronology::FiniteFailureCode::
                c08_009_picard_inflation_or_width_exhaustion))
            == "C08-009_PICARD_INFLATION_OR_WIDTH_EXHAUSTION"
        && std::string(chronology::rejection_reason_name(
            chronology::RejectionReason::metric_forcing_witness))
            == "METRIC_FORCING_WITNESS");

    std::size_t passed = 0U;
    std::uint64_t mask = 0U;
    for (std::size_t index = 0U; index < checks.size(); ++index) {
        if (checks[index]) {
            ++passed;
            mask |= std::uint64_t{1} << index;
        }
    }
    std::cout << "{\"append_only_prefix_reuse\":true,"
        "\"authority_promoted\":false,\"candidate_evaluations\":0,"
        "\"candidate_roots_created\":false,\"checks_passed\":" << passed
        << ",\"checks_total\":" << checks.size()
        << ",\"early_tail_before_finite\":true,\"exhaustion_attempts\":"
        << exhaustion_result.attempts_validated << ",\"fixture_mask\":"
        << mask << ",\"positive_parameter_samples\":0,\"schema\":"
        "\"nhm2.g2h_e_s5.primary_c08_tail_split_chronology_fixture.v1\","
        "\"scientific_handler_linked\":false,\"selected_t0\":"
        << ordered_output.selected_t0 << ",\"state_coefficients_read\":0,"
        "\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL")
        << "\"}\n";
    return passed == checks.size() ? 0 : 1;
}
