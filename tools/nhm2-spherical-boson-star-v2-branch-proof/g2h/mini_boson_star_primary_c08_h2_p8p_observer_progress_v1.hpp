#pragma once

#include "mini_boson_star_primary_c08_h2_p8n_selector_term_radius_binding_v1.hpp"

#include <cstddef>
#include <cstdint>

namespace nhm2::g2h_e_s5::primary_c08_h2_p8p_observer_progress_v1 {

namespace p8n = primary_c08_h2_p8n_selector_term_radius_binding_v1;
namespace selector = primary_c08_convolution_selector_v1;

enum class Phase : unsigned {
    selector = 1U,
    observer = 2U,
};

struct ProgressEvent {
    Phase phase = Phase::observer;
    std::size_t completed_panels = 0U;
    std::size_t total_panels = 0U;
    std::uint64_t monotonic_nanoseconds = 0U;
};

// A noexcept, return-free callback cannot accept/reject a panel or alter the
// frozen selector/observer control flow. Context belongs to the receipt writer.
using ProgressCallback = void (*)(const ProgressEvent &, void *) noexcept;

struct TimingObservation {
    std::uint64_t selector_nanoseconds = 0U;
    std::uint64_t observer_nanoseconds = 0U;
    std::uint64_t total_nanoseconds = 0U;
    std::uint64_t first_event_nanoseconds = 0U;
    std::uint64_t last_event_nanoseconds = 0U;
    std::size_t events_emitted = 0U;
    std::size_t last_completed_panels = 0U;
    bool callback_enabled = false;
    bool selector_completed = false;
    bool observer_completed = false;
    bool monotone_progress = true;
    bool bounded_progress = true;
    bool callback_observation_only = true;
    bool evaluated = false;
};

// Versioned receipt-only replay of immutable P8N. It preserves the P8I selector
// producer and P8M/P8N arithmetic and emits one aggregate observer event only
// after a complete panel has been accepted into the fixed 514-bucket surface.
bool evaluate_prepared_candidate_observed(
    const selector::Input &input, std::size_t panel_count,
    std::size_t thread_count, unsigned target_degree,
    std::size_t target_jet, selector::Output *output,
    selector::Result *result,
    selector::CoefficientDecompositionObservation *predecessor_observation,
    p8n::Observation *observation, ProgressCallback callback,
    void *callback_context, TimingObservation *timing);

}  // namespace nhm2::g2h_e_s5::primary_c08_h2_p8p_observer_progress_v1
