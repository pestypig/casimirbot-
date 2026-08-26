#include "mini_boson_star_primary_c08_tail_split_chronology_v1.hpp"

#include <algorithm>

namespace nhm2::g2h_e_s5::primary_c08_tail_split_chronology_v1 {
namespace {

bool valid_digest(DigestView digest) {
    return digest.size == kDigestBytes && digest.bytes != nullptr;
}

bool equal_digest(DigestView left, DigestView right) {
    return valid_digest(left) && valid_digest(right)
        && std::equal(left.bytes, left.bytes + kDigestBytes, right.bytes);
}

void copy_digest(std::array<std::uint8_t, kDigestBytes> &target,
                 DigestView source) {
    std::copy(source.bytes, source.bytes + kDigestBytes, target.begin());
}

void reset(Output &output) {
    output = Output{};
}

void fail(Result *result, FailureDetail detail, std::size_t validated,
          std::size_t rejected) {
    *result = Result{};
    result->detail = detail;
    result->attempts_validated = validated;
    result->rejected_witnesses_recorded = rejected;
    result->fixed_onset_schedule = true;
    result->early_tail_before_finite = true;
    result->append_only_prefix_reuse = true;
}

RejectionReason first_missing_early(const AttemptView &attempt) {
    if (!attempt.parameter_margins_verified)
        return RejectionReason::parameter_margin;
    if (!attempt.lyapunov_constructed)
        return RejectionReason::lyapunov_construction;
    if (!attempt.compact_box_lmi_verified)
        return RejectionReason::compact_box_lmi;
    if (!attempt.k1_verified) return RejectionReason::k1_selector;
    if (!attempt.k2_verified) return RejectionReason::k2_selector;
    return RejectionReason::none;
}

RejectionReason first_missing_late(const AttemptView &attempt) {
    if (!attempt.scalar_onset_constants_verified)
        return RejectionReason::scalar_onset_constants;
    if (!attempt.weighted_edge_history_verified)
        return RejectionReason::weighted_edge_history;
    if (!attempt.realized_scalar_witness_verified)
        return RejectionReason::realized_scalar_witness;
    if (!attempt.metric_forcing_witness_verified)
        return RejectionReason::metric_forcing_witness;
    if (!attempt.record_inventory_complete)
        return RejectionReason::record_inventory;
    return RejectionReason::none;
}

bool no_late_phase(const AttemptView &attempt) {
    return !attempt.finite_continuation_requested
        && !attempt.finite_continuation_succeeded
        && !attempt.scalar_onset_constants_verified
        && !attempt.weighted_edge_history_verified
        && !attempt.realized_scalar_witness_verified
        && !attempt.metric_forcing_witness_verified
        && !attempt.record_inventory_complete;
}

bool late_phase_ordered(const AttemptView &attempt) {
    if (attempt.weighted_edge_history_verified
        && !attempt.scalar_onset_constants_verified) return false;
    if (attempt.realized_scalar_witness_verified
        && !attempt.weighted_edge_history_verified) return false;
    if (attempt.metric_forcing_witness_verified
        && !attempt.realized_scalar_witness_verified) return false;
    if (attempt.record_inventory_complete
        && !attempt.metric_forcing_witness_verified) return false;
    return true;
}

}  // namespace

bool evaluate(const Input &input, Output *output, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (output == nullptr) {
        fail(result, FailureDetail::missing_output, 0U, 0U);
        return false;
    }
    reset(*output);
    if (input.attempt_count > kTailSplitAttemptCount
        || (input.attempt_count > 0U && input.attempts == nullptr)) {
        fail(result, FailureDetail::attempt_resource_or_pointer, 0U, 0U);
        return false;
    }

    std::size_t validated = 0U;
    std::size_t rejected = 0U;
    for (std::size_t index = 0U; index < input.attempt_count; ++index) {
        const AttemptView &attempt = input.attempts[index];
        if (attempt.ordinal != index || attempt.t0 != kTailWitnessOnsets[index]
            || attempt.laplace_split_t != 2U * attempt.t0) {
            fail(result, FailureDetail::onset_or_ordinal_chronology,
                 validated, rejected);
            reset(*output);
            return false;
        }
        if (!valid_digest(attempt.ledger_digest_before)
            || !valid_digest(attempt.reused_prefix_digest)
            || !valid_digest(attempt.ledger_digest_after)
            || attempt.ledger_models_before > kMaximumLedgerModels
            || attempt.ledger_models_after > kMaximumLedgerModels
            || attempt.ledger_models_after < attempt.ledger_models_before) {
            fail(result, FailureDetail::ledger_append_only_violation,
                 validated, rejected);
            reset(*output);
            return false;
        }
        if (index > 0U) {
            const AttemptView &previous = input.attempts[index - 1U];
            if (attempt.ledger_models_before != previous.ledger_models_after
                || !equal_digest(attempt.ledger_digest_before,
                                 previous.ledger_digest_after)) {
                fail(result, FailureDetail::ledger_append_only_violation,
                     validated, rejected);
                reset(*output);
                return false;
            }
        }

        const RejectionReason missing_early = first_missing_early(attempt);
        if (missing_early != RejectionReason::none) {
            if (!no_late_phase(attempt)
                || attempt.disposition
                    != AttemptDisposition::rejected_tail_or_growth_witness
                || attempt.rejection_reason != missing_early
                || attempt.finite_failure != FiniteFailureCode::none
                || attempt.ledger_models_after != attempt.ledger_models_before
                || !equal_digest(attempt.ledger_digest_before,
                                 attempt.ledger_digest_after)
                || !equal_digest(attempt.ledger_digest_before,
                                 attempt.reused_prefix_digest)) {
                fail(result, FailureDetail::phase_or_reason_chronology,
                     validated, rejected);
                reset(*output);
                return false;
            }
            output->ordered_rejection_reasons.push_back(missing_early);
            ++validated;
            ++rejected;
            continue;
        }

        if (!attempt.finite_continuation_requested
            || !equal_digest(attempt.ledger_digest_before,
                             attempt.reused_prefix_digest)) {
            fail(result, FailureDetail::phase_or_reason_chronology,
                 validated, rejected);
            reset(*output);
            return false;
        }
        if (attempt.disposition == AttemptDisposition::finite_terminal_failure) {
            if (attempt.finite_continuation_succeeded
                || attempt.finite_failure == FiniteFailureCode::none
                || attempt.rejection_reason != RejectionReason::none
                || attempt.scalar_onset_constants_verified
                || attempt.weighted_edge_history_verified
                || attempt.realized_scalar_witness_verified
                || attempt.metric_forcing_witness_verified
                || attempt.record_inventory_complete) {
                fail(result, FailureDetail::phase_or_reason_chronology,
                     validated, rejected);
                reset(*output);
                return false;
            }
            if (index + 1U != input.attempt_count) {
                fail(result, FailureDetail::attempts_after_terminal_decision,
                     validated, rejected);
                reset(*output);
                return false;
            }
            ++validated;
            output->outcome = Outcome::finite_terminal_failure;
            output->terminal_attempt_ordinal = index;
            output->propagated_finite_failure = attempt.finite_failure;
            output->final_ledger_models = attempt.ledger_models_after;
            copy_digest(output->final_ledger_digest,
                        attempt.ledger_digest_after);
            result->accepted = true;
            result->detail = FailureDetail::none;
            result->attempts_validated = validated;
            result->rejected_witnesses_recorded = rejected;
            result->fixed_onset_schedule = true;
            result->early_tail_before_finite = true;
            result->append_only_prefix_reuse = true;
            result->finite_failure_terminal = true;
            return true;
        }
        if (!attempt.finite_continuation_succeeded
            || attempt.finite_failure != FiniteFailureCode::none
            || !late_phase_ordered(attempt)) {
            fail(result, FailureDetail::phase_or_reason_chronology,
                 validated, rejected);
            reset(*output);
            return false;
        }

        const RejectionReason missing_late = first_missing_late(attempt);
        if (missing_late != RejectionReason::none) {
            if (attempt.disposition
                    != AttemptDisposition::rejected_tail_or_growth_witness
                || attempt.rejection_reason != missing_late) {
                fail(result, FailureDetail::phase_or_reason_chronology,
                     validated, rejected);
                reset(*output);
                return false;
            }
            output->ordered_rejection_reasons.push_back(missing_late);
            ++validated;
            ++rejected;
            continue;
        }

        if (attempt.disposition != AttemptDisposition::complete_pass
            || attempt.rejection_reason != RejectionReason::none) {
            fail(result, FailureDetail::phase_or_reason_chronology,
                 validated, rejected);
            reset(*output);
            return false;
        }
        if (index + 1U != input.attempt_count) {
            fail(result, FailureDetail::attempts_after_terminal_decision,
                 validated, rejected);
            reset(*output);
            return false;
        }
        ++validated;
        output->outcome = Outcome::selected;
        output->selected_t0 = attempt.t0;
        output->selected_t = attempt.laplace_split_t;
        output->terminal_attempt_ordinal = index;
        output->final_ledger_models = attempt.ledger_models_after;
        copy_digest(output->final_ledger_digest, attempt.ledger_digest_after);
        result->accepted = true;
        result->detail = FailureDetail::none;
        result->attempts_validated = validated;
        result->rejected_witnesses_recorded = rejected;
        result->fixed_onset_schedule = true;
        result->early_tail_before_finite = true;
        result->append_only_prefix_reuse = true;
        result->first_passing_witness_selected = true;
        return true;
    }

    output->outcome = input.attempt_count == kTailSplitAttemptCount
        ? Outcome::tail_split_exhaustion : Outcome::incomplete_attempt_ledger;
    if (input.attempt_count > 0U) {
        const AttemptView &last = input.attempts[input.attempt_count - 1U];
        output->terminal_attempt_ordinal = input.attempt_count - 1U;
        output->final_ledger_models = last.ledger_models_after;
        copy_digest(output->final_ledger_digest, last.ledger_digest_after);
    }
    result->accepted = true;
    result->detail = FailureDetail::none;
    result->attempts_validated = validated;
    result->rejected_witnesses_recorded = rejected;
    result->fixed_onset_schedule = true;
    result->early_tail_before_finite = true;
    result->append_only_prefix_reuse = true;
    result->exhaustion_retuned = false;
    return true;
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::missing_output: return "C08-011A_MISSING_OUTPUT";
    case FailureDetail::attempt_resource_or_pointer:
        return "C08-011A_ATTEMPT_RESOURCE_OR_POINTER";
    case FailureDetail::onset_or_ordinal_chronology:
        return "C08-011A_ONSET_OR_ORDINAL_CHRONOLOGY";
    case FailureDetail::phase_or_reason_chronology:
        return "C08-011A_PHASE_OR_REASON_CHRONOLOGY";
    case FailureDetail::ledger_append_only_violation:
        return "C08-011A_LEDGER_APPEND_ONLY_VIOLATION";
    case FailureDetail::attempts_after_terminal_decision:
        return "C08-011A_ATTEMPTS_AFTER_TERMINAL_DECISION";
    }
    return "C08-011A_UNKNOWN";
}

const char *outcome_name(Outcome outcome) {
    switch (outcome) {
    case Outcome::incomplete_attempt_ledger: return "INCOMPLETE_ATTEMPT_LEDGER";
    case Outcome::selected: return "SELECTED";
    case Outcome::finite_terminal_failure: return "FINITE_TERMINAL_FAILURE";
    case Outcome::tail_split_exhaustion:
        return "C08-011_TAIL_SPLIT_EXHAUSTION";
    }
    return "C08-011A_UNKNOWN_OUTCOME";
}

const char *rejection_reason_name(RejectionReason reason) {
    switch (reason) {
    case RejectionReason::none: return "NONE";
    case RejectionReason::parameter_margin: return "PARAMETER_MARGIN";
    case RejectionReason::lyapunov_construction:
        return "LYAPUNOV_CONSTRUCTION";
    case RejectionReason::compact_box_lmi: return "COMPACT_BOX_LMI";
    case RejectionReason::k1_selector: return "K1_SELECTOR";
    case RejectionReason::k2_selector: return "K2_SELECTOR";
    case RejectionReason::scalar_onset_constants:
        return "SCALAR_ONSET_CONSTANTS";
    case RejectionReason::weighted_edge_history:
        return "WEIGHTED_EDGE_HISTORY";
    case RejectionReason::realized_scalar_witness:
        return "REALIZED_SCALAR_WITNESS";
    case RejectionReason::metric_forcing_witness:
        return "METRIC_FORCING_WITNESS";
    case RejectionReason::record_inventory: return "RECORD_INVENTORY";
    }
    return "UNKNOWN_REJECTION_REASON";
}

const char *finite_failure_name(FiniteFailureCode code) {
    switch (code) {
    case FiniteFailureCode::none: return "NONE";
    case FiniteFailureCode::c08_006_origin_series_order_exhaustion:
        return "C08-006_ORIGIN_SERIES_ORDER_EXHAUSTION";
    case FiniteFailureCode::c08_007_positive_panel_denominator_or_coefficient:
        return "C08-007_POSITIVE_PANEL_DENOMINATOR_OR_COEFFICIENT";
    case FiniteFailureCode::c08_008_panel_defect_or_exact_zero_replay:
        return "C08-008_PANEL_DEFECT_OR_EXACT_ZERO_REPLAY";
    case FiniteFailureCode::c08_009_picard_inflation_or_width_exhaustion:
        return "C08-009_PICARD_INFLATION_OR_WIDTH_EXHAUSTION";
    case FiniteFailureCode::c08_010_volterra_convolution_or_u_refinement_exhaustion:
        return "C08-010_VOLTERRA_CONVOLUTION_OR_U_REFINEMENT_EXHAUSTION";
    case FiniteFailureCode::fixed_resource_failure_at_originating_producer:
        return "FIXED_RESOURCE_FAILURE_AT_ORIGINATING_PRODUCER";
    }
    return "UNKNOWN_FINITE_FAILURE";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_tail_split_chronology_v1
