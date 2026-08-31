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
    jet::CoefficientDecomposition decomposition;
    jet::Result result{};
    AccumulationStatus status = AccumulationStatus::parallel_resource_failure;
    bool jet_attempted = false;
};

struct WidthMeasurement {
    std::string radius;
    std::string threshold;
    std::string ratio;
    bool ratio_exceeds_one = false;
    arf_t ratio_upper;

    WidthMeasurement() { arf_init(ratio_upper); }
    ~WidthMeasurement() { arf_clear(ratio_upper); }
    WidthMeasurement(const WidthMeasurement &) = delete;
    WidthMeasurement &operator=(const WidthMeasurement &) = delete;
};

struct DecompositionAccumulator {
    std::array<arb_struct, jet::kSecondJetTermCount> slot_radius_sums{};
    std::array<arb_struct, jet::kSecondJetTermCount>
        slot_upper_magnitude_sums{};
    arb_t reconstructed_candidate;
    arb_t boundary_panel_radius;
    arb_t nonboundary_panel_radius_sum;
    arb_t total_elementary_radius_sum;
    arb_t maximum_elementary_radius;
    std::size_t maximum_elementary_panel_ordinal = 0U;
    std::size_t maximum_elementary_slot = 0U;
    std::size_t elementary_terms_observed = 0U;
    bool have_maximum = false;
    bool all_panel_reconstructions_equal = true;

    DecompositionAccumulator() {
        for (auto &value : slot_radius_sums) {
            arb_init(&value); arb_zero(&value);
        }
        for (auto &value : slot_upper_magnitude_sums) {
            arb_init(&value); arb_zero(&value);
        }
        arb_init(reconstructed_candidate); arb_zero(reconstructed_candidate);
        arb_init(boundary_panel_radius); arb_zero(boundary_panel_radius);
        arb_init(nonboundary_panel_radius_sum);
        arb_zero(nonboundary_panel_radius_sum);
        arb_init(total_elementary_radius_sum);
        arb_zero(total_elementary_radius_sum);
        arb_init(maximum_elementary_radius);
        arb_zero(maximum_elementary_radius);
    }

    ~DecompositionAccumulator() {
        arb_clear(maximum_elementary_radius);
        arb_clear(total_elementary_radius_sum);
        arb_clear(nonboundary_panel_radius_sum);
        arb_clear(boundary_panel_radius);
        arb_clear(reconstructed_candidate);
        for (auto &value : slot_upper_magnitude_sums) arb_clear(&value);
        for (auto &value : slot_radius_sums) arb_clear(&value);
    }
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

std::string decimal_ball(arb_srcptr value) {
    char *raw = arb_get_str(value, 80, 0U);
    if (raw == nullptr) return {};
    std::string rendered(raw);
    flint_free(raw);
    return rendered;
}

bool width_margin(arb_ptr margin, arb_srcptr value,
                  WidthMeasurement *measurement) {
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
        if (measurement != nullptr) {
            arb_t ratio;
            arb_init(ratio);
            arb_div(ratio, radius, threshold, kPrecisionBits);
            measurement->radius = decimal_ball(radius);
            measurement->threshold = decimal_ball(threshold);
            measurement->ratio = decimal_ball(ratio);
            arb_get_ubound_arf(measurement->ratio_upper, ratio,
                               kPrecisionBits);
            measurement->ratio_exceeds_one = arb_gt(ratio, one);
            arb_clear(ratio);
        }
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

void store_location(WidthObservation &observation, bool first_failure,
                    WidthTermKind kind, unsigned degree,
                    std::size_t jet_index,
                    const WidthMeasurement &measurement) {
    if (first_failure) {
        observation.first_failed_kind = kind;
        observation.first_failed_degree = degree;
        observation.first_failed_jet = jet_index;
        observation.first_failed_radius = measurement.radius;
        observation.first_failed_threshold = measurement.threshold;
        observation.first_failed_ratio = measurement.ratio;
        return;
    }
    observation.worst_kind = kind;
    observation.worst_degree = degree;
    observation.worst_jet = jet_index;
    observation.worst_radius = measurement.radius;
    observation.worst_threshold = measurement.threshold;
    observation.worst_ratio = measurement.ratio;
    observation.worst_ratio_exceeds_one = measurement.ratio_exceeds_one;
}

bool width_rule(Output &output, std::size_t *checks,
                WidthObservation *observation) {
    bool accepted = true;
    bool have_worst = false;
    arf_t worst_upper;
    arf_init(worst_upper);
    const std::size_t checks_before = *checks;
    if (observation != nullptr) *observation = WidthObservation{};
    for (unsigned degree = 0U; degree <= output.retained_order; ++degree) {
        for (std::size_t jet_index = 0U; jet_index < jet::kJetCount;
             ++jet_index) {
            ++*checks;
            WidthMeasurement measurement;
            if (!width_margin(output.coefficient_margin(degree, jet_index),
                              output.coefficient(degree, jet_index),
                              observation == nullptr ? nullptr : &measurement)) {
                if (observation != nullptr
                    && observation->first_failed_kind == WidthTermKind::none) {
                    store_location(*observation, true,
                                   WidthTermKind::coefficient, degree,
                                   jet_index, measurement);
                }
                accepted = false;
            }
            if (observation != nullptr
                && (!have_worst
                    || arf_cmp(measurement.ratio_upper, worst_upper) > 0)) {
                arf_set(worst_upper, measurement.ratio_upper);
                have_worst = true;
                store_location(*observation, false,
                               WidthTermKind::coefficient, degree,
                               jet_index, measurement);
            }
        }
    }
    for (std::size_t jet_index = 0U; jet_index < jet::kJetCount;
         ++jet_index) {
        ++*checks;
        WidthMeasurement measurement;
        if (!width_margin(output.remainder_margin(jet_index),
                          output.remainder(jet_index),
                          observation == nullptr ? nullptr : &measurement)) {
            if (observation != nullptr
                && observation->first_failed_kind == WidthTermKind::none) {
                store_location(*observation, true, WidthTermKind::remainder,
                               0U, jet_index, measurement);
            }
            accepted = false;
        }
        if (observation != nullptr
            && (!have_worst
                || arf_cmp(measurement.ratio_upper, worst_upper) > 0)) {
            arf_set(worst_upper, measurement.ratio_upper);
            have_worst = true;
            store_location(*observation, false, WidthTermKind::remainder,
                           0U, jet_index, measurement);
        }
    }
    if (observation != nullptr) {
        observation->evaluated = true;
        observation->passed = accepted;
        observation->width_checks = *checks - checks_before;
    }
    arf_clear(worst_upper);
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
                             bool worker_thread, bool decompose,
                             unsigned target_degree,
                             std::size_t target_jet) noexcept {
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
                accepted = decompose
                    ? jet::evaluate_prepared_decomposed(
                        jet_input, target_degree, target_jet, &panel.output,
                        &panel.result, &panel.decomposition)
                    : jet::evaluate_prepared(jet_input, &panel.output,
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
    Output &candidate, Result &counters,
    CoefficientDecompositionObservation *observation,
    unsigned target_degree, std::size_t target_jet,
    CandidateProgressObserver progress = nullptr,
    void *progress_context = nullptr) {
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
    arb_t reconstructed_panel, radius, magnitude, margin, final_radius,
        final_to_elementary_ratio;
    arb_init(reconstructed_panel); arb_init(radius); arb_init(magnitude);
    arb_init(margin); arb_init(final_radius);
    arb_init(final_to_elementary_ratio);
    DecompositionAccumulator decomposition;
    const bool decompose = observation != nullptr;
    if (observation != nullptr) {
        *observation = CoefficientDecompositionObservation{};
        observation->panel_count = panel_count;
        observation->target_degree = target_degree;
        observation->target_jet = target_jet;
        observation->terms_per_panel = jet::kSecondJetTermCount;
    }
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
                                    false, decompose, target_degree,
                                    target_jet);
        } else {
            std::vector<std::thread> workers;
            workers.reserve(batch_size);
            bool launch_failed = false;
            try {
                for (std::size_t offset = 0U; offset < batch_size; ++offset) {
                    workers.emplace_back([&, offset] {
                        evaluate_parallel_panel(input, exponent,
                            batch_begin + offset, *panels[offset], true,
                            decompose, target_degree, target_jet);
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

            if (decompose) {
                if (panel.decomposition.terms_recorded
                        != jet::kSecondJetTermCount
                    || panel.decomposition.target_degree != target_degree
                    || panel.decomposition.target_jet != target_jet
                    || target_degree > panel.output.retained_order) {
                    status = AccumulationStatus::nonfinite_or_geometry_failure;
                    break;
                }
                arb_zero(reconstructed_panel);
                for (std::size_t slot = 0U;
                     slot < jet::kSecondJetTermCount; ++slot) {
                    arb_add(next, reconstructed_panel,
                            panel.decomposition.term(slot), kPrecisionBits);
                    arb_set(reconstructed_panel, next);

                    arb_get_rad_arb(radius,
                                    panel.decomposition.term(slot));
                    arb_add(next,
                            decomposition.slot_radius_sums.data() + slot,
                            radius, kPrecisionBits);
                    arb_set(decomposition.slot_radius_sums.data() + slot,
                            next);
                    arb_add(next, decomposition.total_elementary_radius_sum,
                            radius, kPrecisionBits);
                    arb_set(decomposition.total_elementary_radius_sum, next);
                    if (!decomposition.have_maximum
                        || arb_lt(decomposition.maximum_elementary_radius,
                                  radius)) {
                        arb_set(decomposition.maximum_elementary_radius,
                                radius);
                        decomposition.maximum_elementary_panel_ordinal =
                            ordinal;
                        decomposition.maximum_elementary_slot = slot;
                        decomposition.have_maximum = true;
                    }
                    if (!upper_magnitude(
                            magnitude, panel.decomposition.term(slot))) {
                        status = AccumulationStatus::nonfinite_or_geometry_failure;
                        break;
                    }
                    arb_add(next,
                            decomposition.slot_upper_magnitude_sums.data()
                                + slot,
                            magnitude, kPrecisionBits);
                    arb_set(
                        decomposition.slot_upper_magnitude_sums.data() + slot,
                        next);
                    ++decomposition.elementary_terms_observed;
                }
                if (status != AccumulationStatus::accepted) break;
                if (!arb_equal(reconstructed_panel,
                               panel.output.coefficient(target_degree,
                                                        target_jet))) {
                    decomposition.all_panel_reconstructions_equal = false;
                }
                arb_add(next, decomposition.reconstructed_candidate,
                        reconstructed_panel, kPrecisionBits);
                arb_set(decomposition.reconstructed_candidate, next);
                arb_get_rad_arb(
                    radius,
                    panel.output.coefficient(target_degree, target_jet));
                arb_ptr panel_radius_accumulator = ordinal == 0U
                    ? decomposition.boundary_panel_radius
                    : decomposition.nonboundary_panel_radius_sum;
                arb_add(next, panel_radius_accumulator, radius,
                        kPrecisionBits);
                arb_set(panel_radius_accumulator, next);
            }
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
        if (status == AccumulationStatus::accepted && progress != nullptr)
            progress(counters.subpanels_accumulated, panel_count,
                     progress_context);
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
    if (status == AccumulationStatus::accepted && observation != nullptr) {
        WidthMeasurement measurement;
        if (!width_margin(margin,
                          candidate.coefficient(target_degree, target_jet),
                          &measurement)) {
            // A failed width predicate is expected diagnostic data. Only an
            // incomplete measurement is an instrumentation failure.
            if (measurement.radius.empty() || measurement.threshold.empty()
                || measurement.ratio.empty()) {
                status = AccumulationStatus::nonfinite_or_geometry_failure;
            }
        }
        if (status == AccumulationStatus::accepted) {
            observation->evaluated = true;
            observation->elementary_terms_observed =
                decomposition.elementary_terms_observed;
            observation->all_panel_reconstructions_equal =
                decomposition.all_panel_reconstructions_equal;
            observation->final_reconstruction_equal = arb_equal(
                decomposition.reconstructed_candidate,
                candidate.coefficient(target_degree, target_jet));
            observation->final_radius = measurement.radius;
            observation->final_threshold = measurement.threshold;
            observation->final_ratio = measurement.ratio;
            for (std::size_t slot = 0U;
                 slot < jet::kSecondJetTermCount; ++slot) {
                observation->slot_radius_sums[slot] = decimal_ball(
                    decomposition.slot_radius_sums.data() + slot);
                observation->slot_upper_magnitude_sums[slot] = decimal_ball(
                    decomposition.slot_upper_magnitude_sums.data() + slot);
            }
            observation->boundary_panel_radius =
                decimal_ball(decomposition.boundary_panel_radius);
            observation->nonboundary_panel_radius_sum =
                decimal_ball(decomposition.nonboundary_panel_radius_sum);
            observation->total_elementary_radius_sum =
                decimal_ball(decomposition.total_elementary_radius_sum);
            arb_get_rad_arb(
                final_radius,
                candidate.coefficient(target_degree, target_jet));
            if (arb_is_zero(decomposition.total_elementary_radius_sum)) {
                arb_zero(final_to_elementary_ratio);
            } else {
                arb_div(final_to_elementary_ratio, final_radius,
                        decomposition.total_elementary_radius_sum,
                        kPrecisionBits);
            }
            observation->final_to_elementary_radius_ratio =
                decimal_ball(final_to_elementary_ratio);
            observation->maximum_elementary_radius =
                decimal_ball(decomposition.maximum_elementary_radius);
            observation->maximum_elementary_panel_ordinal =
                decomposition.maximum_elementary_panel_ordinal;
            observation->maximum_elementary_slot =
                decomposition.maximum_elementary_slot;
        }
    }
    arb_clear(final_to_elementary_ratio);
    arb_clear(final_radius); arb_clear(margin); arb_clear(magnitude);
    arb_clear(radius); arb_clear(reconstructed_panel);
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
            width_rule(candidate, &result->numerical_width_checks, nullptr);
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

bool evaluate_prepared_parallel_impl(const Input &input,
                                     std::size_t thread_count,
                                     Output *output, Result *result,
                                     WidthDiagnostics *diagnostics) {
    if (result == nullptr) return false;
    *result = Result{};
    if (diagnostics != nullptr) *diagnostics = WidthDiagnostics{};
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
                *result, nullptr, 0U, 0U);
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
        WidthObservation *observation = diagnostics == nullptr
            ? nullptr : &diagnostics->candidates[candidate_index];
        width_passes[candidate_index] = width_rule(
            candidate, &result->numerical_width_checks, observation);
        if (observation != nullptr) {
            observation->candidate_index = candidate_index;
            observation->panel_count = kUPanelCandidates[candidate_index];
            diagnostics->observations = candidate_index + 1U;
        }
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
            if (diagnostics != nullptr)
                diagnostics->all_observed_candidates_failed = false;
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
    if (diagnostics != nullptr)
        diagnostics->all_observed_candidates_failed = true;
    reset(*output);
    return !exhaustion.exhausted;
}

bool evaluate_prepared_parallel(const Input &input, std::size_t thread_count,
                                Output *output, Result *result) {
    return evaluate_prepared_parallel_impl(input, thread_count, output, result,
                                           nullptr);
}

bool evaluate_prepared_parallel_diagnostic(
    const Input &input, std::size_t thread_count, Output *output,
    Result *result, WidthDiagnostics *diagnostics) {
    if (diagnostics == nullptr) return false;
    return evaluate_prepared_parallel_impl(input, thread_count, output, result,
                                           diagnostics);
}

bool inspect_width_candidate(Output &output, std::size_t candidate_index,
                             WidthObservation *observation,
                             std::size_t *checks) {
    if (observation == nullptr || checks == nullptr
        || candidate_index >= kUPanelCandidateCount) return false;
    const bool passed = width_rule(output, checks, observation);
    observation->candidate_index = candidate_index;
    observation->panel_count = kUPanelCandidates[candidate_index];
    return passed;
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
        input, panel_count, thread_count, *output, *result, nullptr, 0U, 0U);
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

bool evaluate_prepared_candidate_decomposition(
    const Input &input, std::size_t panel_count, std::size_t thread_count,
    unsigned target_degree, std::size_t target_jet, Output *output,
    Result *result, CoefficientDecompositionObservation *observation) {
    if (result == nullptr) return false;
    *result = Result{};
    if (output == nullptr || observation == nullptr) {
        fail(result, FailureDetail::missing_output, 0U, 0U, 0U, 0U, 0U);
        return false;
    }
    reset(*output);
    *observation = CoefficientDecompositionObservation{};
    if (thread_count == 0U || thread_count > kMaximumParallelThreads
        || std::find(kUPanelCandidates.begin(), kUPanelCandidates.end(),
                     panel_count) == kUPanelCandidates.end()
        || target_jet < jet::second_jet(0U, 0U)
        || target_jet > jet::second_jet(jet::kParameterCount - 1U,
                                        jet::kParameterCount - 1U)) {
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
        input, panel_count, thread_count, *output, *result, observation,
        target_degree, target_jet);
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

bool evaluate_prepared_candidate_decomposition_observable(
    const Input &input, std::size_t panel_count, std::size_t thread_count,
    unsigned target_degree, std::size_t target_jet, Output *output,
    Result *result, CoefficientDecompositionObservation *observation,
    CandidateProgressObserver progress, void *progress_context) {
    if (result == nullptr) return false;
    *result = Result{};
    if (output == nullptr || observation == nullptr || progress == nullptr) {
        fail(result, FailureDetail::missing_output, 0U, 0U, 0U, 0U, 0U);
        return false;
    }
    reset(*output);
    *observation = CoefficientDecompositionObservation{};
    if (thread_count == 0U || thread_count > kMaximumParallelThreads
        || std::find(kUPanelCandidates.begin(), kUPanelCandidates.end(),
                     panel_count) == kUPanelCandidates.end()
        || target_jet < jet::second_jet(0U, 0U)
        || target_jet > jet::second_jet(jet::kParameterCount - 1U,
                                        jet::kParameterCount - 1U)) {
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
        input, panel_count, thread_count, *output, *result, observation,
        target_degree, target_jet, progress, progress_context);
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

const char *width_term_kind_name(WidthTermKind kind) {
    switch (kind) {
    case WidthTermKind::none: return "NONE";
    case WidthTermKind::coefficient: return "COEFFICIENT";
    case WidthTermKind::remainder: return "REMAINDER";
    }
    return "UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_convolution_selector_v1
