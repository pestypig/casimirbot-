#pragma once

#include "mini_boson_star_primary_c08_convolution_ledger_v1.hpp"
#include "mini_boson_star_primary_c08_origin_series_v1.hpp"

#include <arb.h>

#include <array>
#include <cstddef>
#include <cstdint>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_origin_models_v1 {

namespace origin = primary_c08_origin_series_v1;
namespace ledger = primary_c08_convolution_ledger_v1;

inline constexpr slong kPrecisionBits = 512;
inline constexpr std::size_t kStateCount = 4U;
inline constexpr std::size_t kJetCount = origin::kJetCount;

enum class State : std::uint8_t { B = 0, V = 1, J1 = 2, J2 = 3 };

enum class FailureDetail : std::uint8_t {
    none = 0,
    predecessor_or_output,
    recurrence_replay,
    model_resource_or_nonfinite,
    endpoint_replay,
};

struct Model {
    arb_t left_endpoint;
    arb_t right_endpoint;
    arb_t expansion_center;
    unsigned order = 0U;
    std::vector<arb_struct> coefficients;
    std::vector<arb_struct> remainders;

    Model();
    ~Model();
    Model(const Model &) = delete;
    Model &operator=(const Model &) = delete;

    arb_ptr coefficient(unsigned degree, std::size_t jet = 0U);
    arb_srcptr coefficient(unsigned degree, std::size_t jet = 0U) const;
    arb_ptr remainder(std::size_t jet = 0U);
    arb_srcptr remainder(std::size_t jet = 0U) const;
    ledger::ModelView view(std::size_t ordinal = 0U) const;
};

struct Output {
    origin::Output origin_enclosure;
    std::array<Model, kStateCount> models;

    const Model &model(State state) const {
        return models[static_cast<std::size_t>(state)];
    }
    Model &model(State state) {
        return models[static_cast<std::size_t>(state)];
    }
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    unsigned selected_origin_order = 0U;
    std::size_t recurrence_coefficients_replayed = 0U;
    std::size_t model_coefficient_balls = 0U;
    std::size_t model_remainder_balls = 0U;
    std::size_t endpoint_containment_checks = 0U;
    bool derivative_and_integral_normalization_exact = false;
    bool known_truncated_terms_moved_to_remainder = false;
    bool signed_remainder_cancellation_used = false;
    bool midpoint_acceptance_used = false;
    std::size_t state_coefficients_read = 0U;
    std::size_t candidate_evaluations = 0U;
    std::size_t positive_parameter_samples = 0U;
    bool candidate_root_created = false;
    bool scientific_handler_linked = false;
    bool authority_promoted = false;
};

// Candidate-neutral C08-011c origin-ledger adapter. It replays the exact
// audited C08-006 recurrence and exposes B,V,J1,J2 Taylor models on [0,t0].
// Coefficients use ordinary local powers; origin derivative coefficients are
// divided by the exact factorial, and J1/J2 use their exact zero integration
// constants. It performs no selected-member ingress, file I/O or authority
// operation.
bool evaluate(const origin::Input &input, Output *output, Result *result);

const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_origin_models_v1
