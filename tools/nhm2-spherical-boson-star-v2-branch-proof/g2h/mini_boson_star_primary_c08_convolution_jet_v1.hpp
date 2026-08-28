#pragma once

#include "mini_boson_star_primary_c08_convolution_bivariate_v1.hpp"

#include <arb.h>

#include <cstddef>
#include <cstdint>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_convolution_jet_v1 {

namespace bivariate = primary_c08_convolution_bivariate_v1;
namespace ledger = primary_c08_convolution_ledger_v1;

inline constexpr std::size_t kParameterCount = 3U;
inline constexpr std::size_t kJetCount = 13U;
inline constexpr std::size_t kElementaryConvolutions = 43U;

constexpr std::size_t value_jet() { return 0U; }
constexpr std::size_t first_jet(std::size_t a) { return 1U + a; }
constexpr std::size_t second_jet(std::size_t a, std::size_t b) {
    return 4U + a * kParameterCount + b;
}

struct Input {
    ledger::LedgerView f_ledger;
    ledger::LedgerView gprime_ledger;
    arb_srcptr target_left = nullptr;
    arb_srcptr target_right = nullptr;
    unsigned target_order = 0U;
    arb_srcptr u_left = nullptr;
    arb_srcptr u_right = nullptr;
    std::size_t g_at_zero_count = 0U;
    arb_srcptr g_at_zero_jets = nullptr;
};

enum class FailureDetail : std::uint8_t {
    none = 0,
    missing_output,
    invalid_jet_inventory,
    bivariate_predecessor,
    nonfinite_remainder_or_assembly,
};

struct Output {
    arb_t target_center;
    arb_t target_half_width;
    std::vector<arb_struct> retained_xi_coefficients;
    std::vector<arb_struct> uniform_remainder_bounds;
    unsigned retained_order = 0U;

    Output();
    ~Output();
    Output(const Output &) = delete;
    Output &operator=(const Output &) = delete;

    arb_ptr coefficient(unsigned degree, std::size_t jet);
    arb_srcptr coefficient(unsigned degree, std::size_t jet) const;
    arb_ptr remainder(std::size_t jet);
    arb_srcptr remainder(std::size_t jet) const;
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    std::size_t elementary_convolutions = 0U;
    std::size_t base_terms = 0U;
    std::size_t first_terms = 0U;
    std::size_t ordered_second_terms = 0U;
    std::size_t mixed_orientation_terms = 0U;
    std::size_t positive_remainder_cross_terms = 0U;
    std::size_t discarded_polynomial_terms = 0U;
    std::size_t affine_composition_terms = 0U;
    std::size_t source_hull_terms = 0U;
    bool complete_ordered_13_jet_inventory = false;
    bool both_mixed_orientations_retained = false;
    bool signed_remainder_cancellation_used = false;
    bool midpoint_selection_used = false;
    bool point_sampling_used = false;
    std::size_t state_coefficients_read = 0U;
    std::size_t candidate_evaluations = 0U;
    std::size_t positive_parameter_samples = 0U;
    bool candidate_root_created = false;
    bool scientific_handler_linked = false;
    bool authority_promoted = false;
};

// Candidate-neutral C08-010c kernel. For each exact base/first/ordered-second
// derivative-convolution term it invokes C08-010b, then adds only outward
// nonnegative analytic, source-hull, affine-radius and discarded-polynomial
// bounds. Both ordered mixed Hessian orientations are evaluated explicitly.
bool evaluate(const Input &input, Output *output, Result *result);

// Additive H2-P2 path: prepares the unchanged beta moments once per subpanel
// and reuses them across the frozen 43 elementary convolutions.
bool evaluate_prepared(const Input &input, Output *output, Result *result);

const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_convolution_jet_v1
