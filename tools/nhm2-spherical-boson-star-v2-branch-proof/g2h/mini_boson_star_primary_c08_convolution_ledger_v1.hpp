#pragma once

#include <arb.h>

#include <cstddef>
#include <cstdint>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_convolution_ledger_v1 {

inline constexpr std::size_t kJetCount = 13U;
inline constexpr std::size_t kMaximumPositivePanels = 65536U;
inline constexpr std::size_t kMaximumLedgerModels =
    kMaximumPositivePanels + 1U;
inline constexpr unsigned kMaximumPositiveOrder = 192U;
inline constexpr unsigned kMaximumOriginOrder = 256U;

enum class ModelKind : std::uint8_t { origin = 0, positive_panel = 1 };

struct ModelView {
    std::size_t ordinal = 0U;
    ModelKind kind = ModelKind::origin;
    arb_srcptr left_endpoint = nullptr;
    arb_srcptr right_endpoint = nullptr;
    arb_srcptr expansion_center = nullptr;
    unsigned order = 0U;
    std::size_t coefficient_count = 0U;
    arb_srcptr coefficients = nullptr;
    std::size_t remainder_count = 0U;
    arb_srcptr remainders = nullptr;
};

struct LedgerView {
    std::size_t model_count = 0U;
    const ModelView *models = nullptr;
};

struct Input {
    LedgerView ledger;
    arb_srcptr target_left = nullptr;
    arb_srcptr target_right = nullptr;
    arb_srcptr u_left = nullptr;
    arb_srcptr u_right = nullptr;
};

enum class FailureDetail : std::uint8_t {
    none = 0,
    missing_output,
    invalid_target_or_u_rectangle,
    ledger_resource_or_pointer,
    ledger_chronology_or_geometry,
    ledger_order_or_storage,
    nonfinite_model,
    mapped_interval_uncovered,
};

struct Output {
    arb_t direct_mapped_interval;
    arb_t reflected_mapped_interval;
    std::vector<std::size_t> direct_intersecting_ordinals;
    std::vector<std::size_t> reflected_intersecting_ordinals;
    bool direct_shared_face_retained = false;
    bool reflected_shared_face_retained = false;

    Output();
    ~Output();
    Output(const Output &) = delete;
    Output &operator=(const Output &) = delete;
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    std::size_t models_validated = 0U;
    std::size_t coefficient_balls_validated = 0U;
    std::size_t remainder_balls_validated = 0U;
    std::size_t closed_intersection_checks = 0U;
    bool exact_shared_faces_required = false;
    bool every_intersecting_model_enumerated = false;
    bool midpoint_selection_used = false;
    std::size_t state_coefficients_read = 0U;
    std::size_t candidate_evaluations = 0U;
    std::size_t positive_parameter_samples = 0U;
    bool candidate_root_created = false;
    bool scientific_handler_linked = false;
    bool authority_promoted = false;
};

// Candidate-neutral C08-010a prerequisite. Validates one append-only source
// ledger and enumerates every closed-domain model intersected by t*u and
// t*(1-u) over the complete target/u rectangle. It performs no source-model
// translation, hulling, convolution, selected-state ingress or file I/O.
bool evaluate(const Input &input, Output *output, Result *result);

const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_convolution_ledger_v1
