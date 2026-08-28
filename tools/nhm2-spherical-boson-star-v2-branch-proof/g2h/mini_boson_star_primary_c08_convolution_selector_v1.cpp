#include "mini_boson_star_primary_c08_convolution_selector_v1.hpp"

#include <flint/flint.h>

#include <algorithm>
#include <memory>
#include <thread>

namespace nhm2::g2h_e_s5::primary_c08_convolution_selector_v1 {
namespace {

constexpr slong kPrecisionBits = 512;
constexpr unsigned kCoefficientCapacity =
    primary_c08_convolution_bivariate_v1::kMaximumRetainedXiDegree + 1U;

enum class AccumulationStatus : std::uint8_t {
    accepted = 0,
    predecessor_failure,
    nonfinite_or_geometry_failure,
    parallel_resource_failure,
};

struct ParallelPanel {
    ledger::Output f_coverage;
    ledger::Output g_coverage;
    jet::Output output;
    jet::Result result{};
    AccumulationStatus status = AccumulationStatus::parallel_resource_failure;
    bool jet_attempted = false;
};

bool finite(arb_srcptr value) {
    return value != nullptr && arb_is_finite(value);
}

void reset(Output &output) {
    arb_zero(output.target_left);
    arb_zero(output.target_right);
    arb_zero(output.target_center);
    arb_zero(output.target_half_width);
    for (auto &value : output.retained_xi_coefficients) arb_zero(&value);
    for (auto &value : output.uniform_remainder_bounds) arb_zero(&value);
    for (auto &value : output.coefficient_width_margins) arb_zero(&value);
    for (auto &value : output.remainder_width_margins) arb_zero(&value);
    output.direct_coverage_offsets.clear();
    output.direct_coverage_ordinals.clear();
    output.reflected_coverage_offsets.clear();
    output.reflected_coverage_ordinals.clear();
    output.retained_order = 0U;
    output.selected_u_panels = 0U;
}

void fail(Result *result, FailureDetail detail,
          std::size_t refinement_candidates_visited,
          std::size_t subpanels_accumulated,
          std::size_t jet_predecessor_calls,
          std::size_t elementary_convolutions,
          std::size_t numerical_width_checks) {
    *result = Result{};
    result->detail = detail;
    result->refinement_candidates_visited = refinement_candidates_visited;
    result->subpanels_accumulated = subpanels_accumulated;
    result->jet_predecessor_calls = jet_predecessor_calls;
    result->elementary_convolutions = elementary_convolutions;
    result->numerical_width_checks = numerical_width_checks;
    result->fixed_candidate_schedule = true;
    result->increasing_subpanel_order = true;
    result->boundary_applied_once = subpanels_accumulated > 0U;
}

bool upper_magnitude(arb_ptr output, arb_srcptr value) {
    if (!finite(value)) return false;
    arb_t absolute;
    arf_t upper;
    arb_init(absolute);
    arf_init(upper);
    arb_abs(absolute, value);
    arb_get_ubound_arf(upper, absolute, kPrecisionBits);
    arb_set_arf(output, upper);
    const bool accepted = arb_is_finite(output) && arb_is_exact(output)
        && !arb_is_negative(output);
    arf_clear(upper);
    arb_clear(absolute);
    return accepted;
}

bool width_margin(arb_ptr margin, arb_srcptr value) {
    arb_t radius, magnitude, scale, threshold, one;
    arb_init(radius);
    arb_init(magnitude);
    arb_init(scale);
    arb_init(threshold);
    arb_init(one);
    arb_one(one);
    arb_get_rad_arb(radius, value);
    bool accepted = upper_magnitude(magnitude, value);
    if (accepted) {
        arb_set(scale, magnitude);
        if (arb_lt(scale, one)) arb_one(scale);
        arb_mul_2exp_si(threshold, scale, kNumericalWidthExponent);
        arb_sub(margin, threshold, radius, kPrecisionBits);
        accepted = arb_is_finite(margin) && arb_le(radius, threshold);
    }
    arb_clear(one);
    arb_clear(threshold);
    arb_clear(scale);
    arb_clear(magnitude);
    arb_clear(radius);
    return accepted;
}

bool copy_output(const Output &source, Output &destination) {
    reset(destination);
    arb_set(destination.target_left, source.target_left);
    arb_set(destination.target_right, source.target_right);
    arb_set(destination.target_center, source.target_center);
    arb_set(destination.target_half_width, source.target_half_width);
    destination.retained_order = source.retained_order;
    destination.selected_u_panels = source.selected_u_panels;
    for (unsigned degree = 0U; degree <= source.retained_order; ++degree) {
        for (std::size_t jet_index = 0U; jet_index < jet::kJetCount;
             ++jet_index) {
            arb_set(destination.coefficient(degree, jet_index),
                    source.coefficient(degree, jet_index));
            arb_set(destination.coefficient_margin(degree, jet_index),
                    source.coefficient_margin(degree, jet_index));
        }
    }
    for (std::size_t jet_index = 0U; jet_index < jet::kJetCount;
         ++jet_index) {
        arb_set(destination.remainder(jet_index),
                source.remainder(jet_index));
        arb_set(destination.remainder_margin(jet_index),
                source.remainder_margin(jet_index));
    }
    destination.direct_coverage_offsets = source.direct_coverage_offsets;
    destination.direct_coverage_ordinals = source.direct_coverage_ordinals;
    destination.reflected_coverage_offsets = source.reflected_coverage_offsets;
    destination.reflected_coverage_ordinals =
        source.reflected_coverage_ordinals;
    return true;
}

bool width_rule(Output &output, std::size_t *checks) {
    bool accepted = true;
    for (unsigned degree = 0U; degree <= output.retained_order; ++degree) {
        for (std::size_t jet_index = 0U; jet_index < jet::kJetCount;
             ++jet_index) {
            ++*checks;
            if (!width_margin(output.coefficient_margin(degree, jet_index),
                              output.coefficient(degree, jet_index))) {
                accepted = false;
            }
        }
    }
    for (std::size_t jet_index = 0U; jet_index < jet::kJetCount;
         ++jet_index) {
        ++*checks;
        if (!width_margin(output.remainder_margin(jet_index),
                          output.remainder(jet_index))) {
            accepted = false;
        }
    }
    return accepted;
}

AccumulationStatus accumulate_candidate(const Input &input,
                                        std::size_t panel_count,
                                        Output &candidate, Result &counters) {
    reset(candidate);
    candidate.selected_u_panels = panel_count;
    arb_set(candidate.target_left, input.target_left);
    arb_set(candidate.target_right, input.target_right);
    candidate.direct_coverage_offsets.push_back(0U);
    candidate.reflected_coverage_offsets.push_back(0U);

    std::array<arb_struct, jet::kJetCount> zero_boundary{};
    for (auto &value : zero_boundary) {
        arb_init(&value);
        arb_zero(&value);
    }
    arb_t u_left, u_right, next;
    arb_init(u_left);
    arb_init(u_right);
    arb_init(next);
    const unsigned exponent = static_cast<unsigned>(
        std::distance(kUPanelCandidates.begin(),
                      std::find(kUPanelCandidates.begin(),
                                kUPanelCandidates.end(), panel_count)));
    bool accepted = exponent < kUPanelCandidateCount;
    bool predecessor_failure = !accepted;
    for (std::size_t ordinal = 0U; accepted && ordinal < panel_count;
         ++ordinal) {
        arb_set_ui(u_left, static_cast<ulong>(ordinal));
        arb_mul_2exp_si(u_left, u_left, -static_cast<slong>(exponent));
        arb_set_ui(u_right, static_cast<ulong>(ordinal + 1U));
        arb_mul_2exp_si(u_right, u_right, -static_cast<slong>(exponent));

        ledger::Output f_coverage;
        ledger::Output g_coverage;
        ledger::Result f_result{};
        ledger::Result g_result{};
        const ledger::Input f_input{input.f_ledger, input.target_left,
                                     input.target_right, u_left, u_right};
        const ledger::Input g_input{input.gprime_ledger, input.target_left,
                                     input.target_right, u_left, u_right};
        accepted = ledger::evaluate(f_input, &f_coverage, &f_result)
            && ledger::evaluate(g_input, &g_coverage, &g_result);
        if (!accepted) { predecessor_failure = true; break; }
        candidate.direct_coverage_ordinals.insert(
            candidate.direct_coverage_ordinals.end(),
            f_coverage.direct_intersecting_ordinals.begin(),
            f_coverage.direct_intersecting_ordinals.end());
        candidate.direct_coverage_offsets.push_back(
            candidate.direct_coverage_ordinals.size());
        candidate.reflected_coverage_ordinals.insert(
            candidate.reflected_coverage_ordinals.end(),
            g_coverage.reflected_intersecting_ordinals.begin(),
            g_coverage.reflected_intersecting_ordinals.end());
        candidate.reflected_coverage_offsets.push_back(
            candidate.reflected_coverage_ordinals.size());

        const arb_srcptr boundary = ordinal == 0U
            ? input.g_at_zero_jets : zero_boundary.data();
        const jet::Input jet_input{input.f_ledger, input.gprime_ledger,
            input.target_left, input.target_right, input.target_order,
            u_left, u_right, jet::kJetCount, boundary};
        jet::Output panel;
        jet::Result panel_result{};
        ++counters.jet_predecessor_calls;
        accepted = jet::evaluate(jet_input, &panel, &panel_result);
        if (!accepted) { predecessor_failure = true; break; }
        counters.elementary_convolutions +=
            panel_result.elementary_convolutions;
        if (ordinal == 0U) {
            candidate.retained_order = panel.retained_order;
            arb_set(candidate.target_center, panel.target_center);
            arb_set(candidate.target_half_width, panel.target_half_width);
        } else if (candidate.retained_order != panel.retained_order
                   || !arb_equal(candidate.target_center,
                                 panel.target_center)
                   || !arb_equal(candidate.target_half_width,
                                 panel.target_half_width)) {
            accepted = false;
            break;
        }
        for (unsigned degree = 0U; degree <= candidate.retained_order;
             ++degree) {
            for (std::size_t jet_index = 0U; jet_index < jet::kJetCount;
                 ++jet_index) {
                arb_add(next, candidate.coefficient(degree, jet_index),
                        panel.coefficient(degree, jet_index), kPrecisionBits);
                arb_set(candidate.coefficient(degree, jet_index), next);
            }
        }
        for (std::size_t jet_index = 0U; jet_index < jet::kJetCount;
             ++jet_index) {
            arb_add(next, candidate.remainder(jet_index),
                    panel.remainder(jet_index), kPrecisionBits);
            arb_set(candidate.remainder(jet_index), next);
        }
        ++counters.subpanels_accumulated;
    }

    if (accepted) {
        for (std::size_t jet_index = 0U; jet_index < jet::kJetCount;
             ++jet_index) {
            accepted = finite(candidate.remainder(jet_index))
                && !arb_is_negative(candidate.remainder(jet_index));
            for (unsigned degree = 0U;
                 accepted && degree <= candidate.retained_order; ++degree) {
                accepted = finite(candidate.coefficient(degree, jet_index));
            }
        }
    }
    arb_clear(next);
    arb_clear(u_right);
    arb_clear(u_left);
    for (auto &value : zero_boundary) arb_clear(&value);
    if (accepted) return AccumulationStatus::accepted;
    return predecessor_failure ? AccumulationStatus::predecessor_failure
                               : AccumulationStatus::nonfinite_or_geometry_failure;
}

void evaluate_parallel_panel(const Input &input, unsigned exponent,
                             std::size_t ordinal, ParallelPanel &panel,
                             bool worker_thread) noexcept {
    try {
        {
            arb_t u_left, u_right;
            arb_init(u_left);
            arb_init(u_right);
            arb_set_ui(u_left, static_cast<ulong>(ordinal));
            arb_mul_2exp_si(u_left, u_left, -static_cast<slong>(exponent));
            arb_set_ui(u_right, static_cast<ulong>(ordinal + 1U));
            arb_mul_2exp_si(u_right, u_right, -static_cast<slong>(exponent));

            const ledger::Input f_input{input.f_ledger, input.target_left,
                input.target_right, u_left, u_right};
            const ledger::Input g_input{input.gprime_ledger,
                input.target_left, input.target_right, u_left, u_right};
            ledger::Result f_result{};
            ledger::Result g_result{};
            bool accepted = ledger::evaluate(f_input, &panel.f_coverage,
                                              &f_result)
                && ledger::evaluate(g_input, &panel.g_coverage, &g_result);
            if (!accepted) {
                panel.status = AccumulationStatus::predecessor_failure;
            } else {
                std::array<arb_struct, jet::kJetCount> zero_boundary{};
                for (auto &value : zero_boundary) {
                    arb_init(&value);
                    arb_zero(&value);
                }
                const arb_srcptr boundary = ordinal == 0U
                    ? input.g_at_zero_jets : zero_boundary.data();
                const jet::Input jet_input{input.f_ledger,
                    input.gprime_ledger, input.target_left,
                    input.target_right, input.target_order, u_left, u_right,
                    jet::kJetCount, boundary};
                panel.jet_attempted = true;
                accepted = jet::evaluate_prepared(jet_input, &panel.output,
                                                   &panel.result);
                panel.status = accepted
                    ? AccumulationStatus::accepted
                    : AccumulationStatus::predecessor_failure;
                for (auto &value : zero_boundary) arb_clear(&value);
            }
            arb_clear(u_right);
            arb_clear(u_left);
        }
    } catch (...) {
        panel.status = AccumulationStatus::parallel_resource_failure;
    }
    // FLINT documents its Arb caches as thread-local in a thread-safe build
    // and requires worker-thread cleanup after local Arb temporaries die.
    if (worker_thread) flint_cleanup();
}

AccumulationStatus accumulate_candidate_parallel(
    const Input &input, std::size_t panel_count, std::size_t thread_count,
    Output &candidate, Result &counters) {
    reset(candidate);
    candidate.selected_u_panels = panel_count;
    arb_set(candidate.target_left, input.target_left);
    arb_set(candidate.target_right, input.target_right);
    candidate.direct_coverage_offsets.push_back(0U);
    candidate.reflected_coverage_offsets.push_back(0U);

    const auto found = std::find(kUPanelCandidates.begin(),
                                 kUPanelCandidates.end(), panel_count);
    if (found == kUPanelCandidates.end())
        return AccumulationStatus::predecessor_failure;
    const unsigned exponent = static_cast<unsigned>(
        std::distance(kUPanelCandidates.begin(), found));
    arb_t next;
    arb_init(next);
    AccumulationStatus status = AccumulationStatus::accepted;

    for (std::size_t batch_begin = 0U;
         batch_begin < panel_count && status == AccumulationStatus::accepted;
         batch_begin += thread_count) {
        const std::size_t batch_size =
            std::min(thread_count, panel_count - batch_begin);
        std::vector<std::unique_ptr<ParallelPanel>> panels;
        panels.reserve(batch_size);
        for (std::size_t offset = 0U; offset < batch_size; ++offset)
            panels.push_back(std::make_unique<ParallelPanel>());

        if (thread_count == 1U) {
            evaluate_parallel_panel(input, exponent, batch_begin, *panels[0],
                                    false);
        } else {
            std::vector<std::thread> workers;
            workers.reserve(batch_size);
            bool launch_failed = false;
            try {
                for (std::size_t offset = 0U; offset < batch_size; ++offset) {
                    workers.emplace_back([&, offset] {
                        evaluate_parallel_panel(input, exponent,
                            batch_begin + offset, *panels[offset], true);
                    });
                }
            } catch (...) {
                launch_failed = true;
            }
            for (auto &worker : workers)
                if (worker.joinable()) worker.join();
            if (launch_failed) {
                status = AccumulationStatus::parallel_resource_failure;
                break;
            }
        }

        for (std::size_t offset = 0U;
             offset < batch_size && status == AccumulationStatus::accepted;
             ++offset) {
            const std::size_t ordinal = batch_begin + offset;
            ParallelPanel &panel = *panels[offset];
            if (panel.jet_attempted) ++counters.jet_predecessor_calls;
            if (panel.status != AccumulationStatus::accepted) {
                status = panel.status;
                break;
            }
            counters.elementary_convolutions +=
                panel.result.elementary_convolutions;
            candidate.direct_coverage_ordinals.insert(
                candidate.direct_coverage_ordinals.end(),
                panel.f_coverage.direct_intersecting_ordinals.begin(),
                panel.f_coverage.direct_intersecting_ordinals.end());
            candidate.direct_coverage_offsets.push_back(
                candidate.direct_coverage_ordinals.size());
            candidate.reflected_coverage_ordinals.insert(
                candidate.reflected_coverage_ordinals.end(),
                panel.g_coverage.reflected_intersecting_ordinals.begin(),
                panel.g_coverage.reflected_intersecting_ordinals.end());
            candidate.reflected_coverage_offsets.push_back(
                candidate.reflected_coverage_ordinals.size());

            if (ordinal == 0U) {
                candidate.retained_order = panel.output.retained_order;
                arb_set(candidate.target_center, panel.output.target_center);
                arb_set(candidate.target_half_width,
                        panel.output.target_half_width);
            } else if (candidate.retained_order != panel.output.retained_order
                       || !arb_equal(candidate.target_center,
                                     panel.output.target_center)
                       || !arb_equal(candidate.target_half_width,
                                     panel.output.target_half_width)) {
                status = AccumulationStatus::nonfinite_or_geometry_failure;
                break;
            }
            for (unsigned degree = 0U; degree <= candidate.retained_order;
                 ++degree) {
                for (std::size_t jet_index = 0U;
                     jet_index < jet::kJetCount; ++jet_index) {
                    arb_add(next, candidate.coefficient(degree, jet_index),
                            panel.output.coefficient(degree, jet_index),
                            kPrecisionBits);
                    arb_set(candidate.coefficient(degree, jet_index), next);
                }
            }
            for (std::size_t jet_index = 0U; jet_index < jet::kJetCount;
                 ++jet_index) {
                arb_add(next, candidate.remainder(jet_index),
                        panel.output.remainder(jet_index), kPrecisionBits);
                arb_set(candidate.remainder(jet_index), next);
            }
            ++counters.subpanels_accumulated;
        }
    }

    if (status == AccumulationStatus::accepted) {
        for (std::size_t jet_index = 0U;
             jet_index < jet::kJetCount && status == AccumulationStatus::accepted;
             ++jet_index) {
            if (!finite(candidate.remainder(jet_index))
                || arb_is_negative(candidate.remainder(jet_index))) {
                status = AccumulationStatus::nonfinite_or_geometry_failure;
            }
            for (unsigned degree = 0U;
                 degree <= candidate.retained_order
                     && status == AccumulationStatus::accepted;
                 ++degree) {
                if (!finite(candidate.coefficient(degree, jet_index)))
                    status = AccumulationStatus::nonfinite_or_geometry_failure;
            }
        }
    }
    arb_clear(next);
    return status;
}

}  // namespace

Output::Output()
    : retained_xi_coefficients(
          static_cast<std::size_t>(kCoefficientCapacity) * jet::kJetCount),
      uniform_remainder_bounds(jet::kJetCount),
      coefficient_width_margins(
          static_cast<std::size_t>(kCoefficientCapacity) * jet::kJetCount),
      remainder_width_margins(jet::kJetCount) {
    arb_init(target_left);
    arb_init(target_right);
    arb_init(target_center);
    arb_init(target_half_width);
    for (auto &value : retained_xi_coefficients) arb_init(&value);
    for (auto &value : uniform_remainder_bounds) arb_init(&value);
    for (auto &value : coefficient_width_margins) arb_init(&value);
    for (auto &value : remainder_width_margins) arb_init(&value);
    reset(*this);
}

Output::~Output() {
    for (auto &value : remainder_width_margins) arb_clear(&value);
    for (auto &value : coefficient_width_margins) arb_clear(&value);
    for (auto &value : uniform_remainder_bounds) arb_clear(&value);
    for (auto &value : retained_xi_coefficients) arb_clear(&value);
    arb_clear(target_half_width);
    arb_clear(target_center);
    arb_clear(target_right);
    arb_clear(target_left);
}

arb_ptr Output::coefficient(unsigned degree, std::size_t jet_index) {
    return retained_xi_coefficients.data()
        + static_cast<std::size_t>(degree) * jet::kJetCount + jet_index;
}

arb_srcptr Output::coefficient(unsigned degree,
                               std::size_t jet_index) const {
    return retained_xi_coefficients.data()
        + static_cast<std::size_t>(degree) * jet::kJetCount + jet_index;
}

arb_ptr Output::remainder(std::size_t jet_index) {
    return uniform_remainder_bounds.data() + jet_index;
}

arb_srcptr Output::remainder(std::size_t jet_index) const {
    return uniform_remainder_bounds.data() + jet_index;
}

arb_ptr Output::coefficient_margin(unsigned degree, std::size_t jet_index) {
    return coefficient_width_margins.data()
        + static_cast<std::size_t>(degree) * jet::kJetCount + jet_index;
}

arb_srcptr Output::coefficient_margin(unsigned degree,
                                      std::size_t jet_index) const {
    return coefficient_width_margins.data()
        + static_cast<std::size_t>(degree) * jet::kJetCount + jet_index;
}

arb_ptr Output::remainder_margin(std::size_t jet_index) {
    return remainder_width_margins.data() + jet_index;
}

arb_srcptr Output::remainder_margin(std::size_t jet_index) const {
    return remainder_width_margins.data() + jet_index;
}

PolicyDecision replay_width_decisions(
    const std::array<bool, kUPanelCandidateCount> &passes,
    std::size_t evaluated_count) {
    PolicyDecision decision{};
    decision.candidates_visited =
        std::min(evaluated_count, kUPanelCandidateCount);
    for (std::size_t index = 0U; index < decision.candidates_visited;
         ++index) {
        if (passes[index]) {
            decision.selected = true;
            decision.selected_u_panels = kUPanelCandidates[index];
            decision.candidates_visited = index + 1U;
            return decision;
        }
    }
    decision.exhausted = evaluated_count == kUPanelCandidateCount;
    return decision;
}

bool evaluate(const Input &input, Output *output, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (output == nullptr) {
        fail(result, FailureDetail::missing_output, 0U, 0U, 0U, 0U, 0U);
        return false;
    }
    reset(*output);
    if (!finite(input.target_left) || !finite(input.target_right)
        || input.g_at_zero_count != jet::kJetCount
        || input.g_at_zero_jets == nullptr) {
        fail(result, FailureDetail::invalid_input_or_predecessor,
             0U, 0U, 0U, 0U, 0U);
        return false;
    }
    for (std::size_t jet_index = 0U; jet_index < jet::kJetCount;
         ++jet_index) {
        if (!finite(input.g_at_zero_jets + jet_index)) {
            fail(result, FailureDetail::invalid_input_or_predecessor,
                 0U, 0U, 0U, 0U, 0U);
            return false;
        }
    }

    std::array<bool, kUPanelCandidateCount> width_passes{};
    for (std::size_t candidate_index = 0U;
         candidate_index < kUPanelCandidateCount; ++candidate_index) {
        ++result->refinement_candidates_visited;
        Output candidate;
        const AccumulationStatus accumulation = accumulate_candidate(
            input, kUPanelCandidates[candidate_index], candidate, *result);
        if (accumulation != AccumulationStatus::accepted) {
            const FailureDetail detail =
                accumulation == AccumulationStatus::predecessor_failure
                    ? FailureDetail::invalid_input_or_predecessor
                    : FailureDetail::nonfinite_accumulation;
            fail(result, detail,
                 result->refinement_candidates_visited,
                 result->subpanels_accumulated,
                 result->jet_predecessor_calls,
                 result->elementary_convolutions,
                 result->numerical_width_checks);
            reset(*output);
            return false;
        }
        width_passes[candidate_index] =
            width_rule(candidate, &result->numerical_width_checks);
        const PolicyDecision decision = replay_width_decisions(
            width_passes, result->refinement_candidates_visited);
        if (decision.selected) {
            copy_output(candidate, *output);
            result->accepted = true;
            result->detail = FailureDetail::none;
            result->fixed_candidate_schedule = true;
            result->increasing_subpanel_order = true;
            result->first_passing_candidate_selected = true;
            result->boundary_applied_once = true;
            result->exhaustion_retuned = false;
            result->signed_remainder_cancellation_used = false;
            result->midpoint_selection_used = false;
            result->point_sampling_used = false;
            return true;
        }
    }
    const PolicyDecision exhaustion = replay_width_decisions(
        width_passes, kUPanelCandidateCount);
    fail(result,
         FailureDetail::volterra_convolution_or_u_refinement_exhaustion,
         kUPanelCandidateCount, result->subpanels_accumulated,
         result->jet_predecessor_calls, result->elementary_convolutions,
         result->numerical_width_checks);
    result->fixed_candidate_schedule = true;
    result->increasing_subpanel_order = true;
    result->boundary_applied_once = true;
    result->exhaustion_retuned = false;
    reset(*output);
    return !exhaustion.exhausted;
}

bool evaluate_prepared_parallel(const Input &input, std::size_t thread_count,
                                Output *output, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (output == nullptr) {
        fail(result, FailureDetail::missing_output, 0U, 0U, 0U, 0U, 0U);
        return false;
    }
    reset(*output);
    if (thread_count == 0U || thread_count > kMaximumParallelThreads) {
        fail(result, FailureDetail::parallel_resource, 0U, 0U, 0U, 0U, 0U);
        return false;
    }
    if (!finite(input.target_left) || !finite(input.target_right)
        || input.g_at_zero_count != jet::kJetCount
        || input.g_at_zero_jets == nullptr) {
        fail(result, FailureDetail::invalid_input_or_predecessor,
             0U, 0U, 0U, 0U, 0U);
        return false;
    }
    for (std::size_t jet_index = 0U; jet_index < jet::kJetCount;
         ++jet_index) {
        if (!finite(input.g_at_zero_jets + jet_index)) {
            fail(result, FailureDetail::invalid_input_or_predecessor,
                 0U, 0U, 0U, 0U, 0U);
            return false;
        }
    }

    // Prevent nested FLINT parallelism; H2-P3 owns only the explicit outer
    // subpanel workers and retains the operation order inside each panel.
    flint_set_num_threads(1);
    std::array<bool, kUPanelCandidateCount> width_passes{};
    for (std::size_t candidate_index = 0U;
         candidate_index < kUPanelCandidateCount; ++candidate_index) {
        ++result->refinement_candidates_visited;
        Output candidate;
        const AccumulationStatus accumulation =
            accumulate_candidate_parallel(input,
                kUPanelCandidates[candidate_index], thread_count, candidate,
                *result);
        if (accumulation != AccumulationStatus::accepted) {
            FailureDetail detail = FailureDetail::nonfinite_accumulation;
            if (accumulation == AccumulationStatus::predecessor_failure)
                detail = FailureDetail::invalid_input_or_predecessor;
            else if (accumulation
                     == AccumulationStatus::parallel_resource_failure)
                detail = FailureDetail::parallel_resource;
            fail(result, detail,
                 result->refinement_candidates_visited,
                 result->subpanels_accumulated,
                 result->jet_predecessor_calls,
                 result->elementary_convolutions,
                 result->numerical_width_checks);
            reset(*output);
            return false;
        }
        width_passes[candidate_index] =
            width_rule(candidate, &result->numerical_width_checks);
        const PolicyDecision decision = replay_width_decisions(
            width_passes, result->refinement_candidates_visited);
        if (decision.selected) {
            copy_output(candidate, *output);
            result->accepted = true;
            result->detail = FailureDetail::none;
            result->fixed_candidate_schedule = true;
            result->increasing_subpanel_order = true;
            result->first_passing_candidate_selected = true;
            result->boundary_applied_once = true;
            result->exhaustion_retuned = false;
            result->signed_remainder_cancellation_used = false;
            result->midpoint_selection_used = false;
            result->point_sampling_used = false;
            return true;
        }
    }
    const PolicyDecision exhaustion = replay_width_decisions(
        width_passes, kUPanelCandidateCount);
    fail(result,
         FailureDetail::volterra_convolution_or_u_refinement_exhaustion,
         kUPanelCandidateCount, result->subpanels_accumulated,
         result->jet_predecessor_calls, result->elementary_convolutions,
         result->numerical_width_checks);
    result->fixed_candidate_schedule = true;
    result->increasing_subpanel_order = true;
    result->boundary_applied_once = true;
    result->exhaustion_retuned = false;
    reset(*output);
    return !exhaustion.exhausted;
}

bool evaluate_prepared_candidate(const Input &input, std::size_t panel_count,
                                 std::size_t thread_count, Output *output,
                                 Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (output == nullptr) {
        fail(result, FailureDetail::missing_output, 0U, 0U, 0U, 0U, 0U);
        return false;
    }
    reset(*output);
    if (thread_count == 0U || thread_count > kMaximumParallelThreads
        || std::find(kUPanelCandidates.begin(), kUPanelCandidates.end(),
                     panel_count) == kUPanelCandidates.end()) {
        fail(result, FailureDetail::parallel_resource, 0U, 0U, 0U, 0U, 0U);
        return false;
    }
    if (!finite(input.target_left) || !finite(input.target_right)
        || input.g_at_zero_count != jet::kJetCount
        || input.g_at_zero_jets == nullptr) {
        fail(result, FailureDetail::invalid_input_or_predecessor,
             0U, 0U, 0U, 0U, 0U);
        return false;
    }
    for (std::size_t jet_index = 0U; jet_index < jet::kJetCount;
         ++jet_index) {
        if (!finite(input.g_at_zero_jets + jet_index)) {
            fail(result, FailureDetail::invalid_input_or_predecessor,
                 0U, 0U, 0U, 0U, 0U);
            return false;
        }
    }
    flint_set_num_threads(1);
    result->refinement_candidates_visited = 1U;
    const AccumulationStatus accumulation = accumulate_candidate_parallel(
        input, panel_count, thread_count, *output, *result);
    if (accumulation != AccumulationStatus::accepted) {
        FailureDetail detail = FailureDetail::nonfinite_accumulation;
        if (accumulation == AccumulationStatus::predecessor_failure)
            detail = FailureDetail::invalid_input_or_predecessor;
        else if (accumulation
                 == AccumulationStatus::parallel_resource_failure)
            detail = FailureDetail::parallel_resource;
        fail(result, detail, 1U, result->subpanels_accumulated,
             result->jet_predecessor_calls, result->elementary_convolutions,
             0U);
        reset(*output);
        return false;
    }
    result->accepted = true;
    result->detail = FailureDetail::none;
    result->fixed_candidate_schedule = true;
    result->increasing_subpanel_order = true;
    result->boundary_applied_once = true;
    result->exhaustion_retuned = false;
    result->signed_remainder_cancellation_used = false;
    result->midpoint_selection_used = false;
    result->point_sampling_used = false;
    return true;
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::missing_output: return "C08-010D_MISSING_OUTPUT";
    case FailureDetail::invalid_input_or_predecessor:
        return "C08-010D_INVALID_INPUT_OR_PREDECESSOR";
    case FailureDetail::nonfinite_accumulation:
        return "C08-010D_NONFINITE_ACCUMULATION";
    case FailureDetail::volterra_convolution_or_u_refinement_exhaustion:
        return "C08-010_VOLTERRA_CONVOLUTION_OR_U_REFINEMENT_EXHAUSTION";
    case FailureDetail::parallel_resource:
        return "C08-010D_PARALLEL_RESOURCE";
    }
    return "C08-010D_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_convolution_selector_v1
