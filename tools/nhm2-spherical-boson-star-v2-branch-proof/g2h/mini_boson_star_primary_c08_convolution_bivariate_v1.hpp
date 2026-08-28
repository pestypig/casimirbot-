#pragma once

#include "mini_boson_star_primary_c08_convolution_ledger_v1.hpp"

#include <arb.h>

#include <cstddef>
#include <cstdint>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_convolution_bivariate_v1 {

namespace ledger = primary_c08_convolution_ledger_v1;

inline constexpr std::size_t kJetCount = ledger::kJetCount;
inline constexpr unsigned kMaximumRetainedXiDegree = 192U;
inline constexpr unsigned kMaximumSourceOrder = 256U;

struct Input {
    ledger::LedgerView f_ledger;
    ledger::LedgerView gprime_ledger;
    arb_srcptr target_left = nullptr;
    arb_srcptr target_right = nullptr;
    unsigned target_order = 0U;
    arb_srcptr u_left = nullptr;
    arb_srcptr u_right = nullptr;
    std::size_t f_jet = 0U;
    std::size_t gprime_jet = 0U;
    arb_srcptr g_at_zero = nullptr;
};

enum class FailureDetail : std::uint8_t {
    none = 0,
    missing_output,
    invalid_component_order_or_boundary,
    f_ledger_or_coverage,
    gprime_ledger_or_coverage,
    target_not_current_panel,
    nonfinite_algebra,
};

struct Output {
    arb_t target_center;
    arb_t target_half_width;
    arb_t discarded_xi_tail_bound;
    arb_t f_source_hull_radius_bound;
    arb_t gprime_source_hull_radius_bound;
    std::vector<arb_struct> retained_xi_coefficients;
    unsigned retained_order = 0U;

    Output();
    ~Output();
    Output(const Output &) = delete;
    Output &operator=(const Output &) = delete;

    arb_ptr coefficient(unsigned degree);
    arb_srcptr coefficient(unsigned degree) const;
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    std::size_t direct_models_composed = 0U;
    std::size_t reflected_models_composed = 0U;
    std::size_t local_to_global_terms = 0U;
    std::size_t beta_moments_evaluated = 0U;
    std::size_t factorized_product_terms = 0U;
    std::size_t centered_translation_terms = 0U;
    bool exact_factorized_bivariate_elimination = false;
    bool exact_dyadic_u_integration = false;
    bool boundary_term_retained = false;
    bool discarded_xi_tail_retained = false;
    bool midpoint_selection_used = false;
    bool point_sampling_used = false;
    std::size_t state_coefficients_read = 0U;
    std::size_t candidate_evaluations = 0U;
    std::size_t positive_parameter_samples = 0U;
    bool candidate_root_created = false;
    bool scientific_handler_linked = false;
    bool authority_promoted = false;
};

// Additive H2-P2 cache. The stored values are produced by the unchanged v1
// endpoint-power and finite-binomial moment loops. They are immutable after a
// successful prepare_moments call and are bound to one exact subpanel.
struct PreparedMoments {
    arb_t u_left;
    arb_t u_right;
    std::vector<arb_struct> values;
    unsigned maximum_f_order = 0U;
    unsigned maximum_g_order = 0U;
    bool ready = false;

    PreparedMoments();
    ~PreparedMoments();
    PreparedMoments(const PreparedMoments &) = delete;
    PreparedMoments &operator=(const PreparedMoments &) = delete;

    arb_srcptr moment(unsigned a, unsigned b) const;
};

bool prepare_moments(arb_srcptr u_left, arb_srcptr u_right,
                     unsigned maximum_f_order, unsigned maximum_g_order,
                     PreparedMoments *prepared);

// Candidate-neutral C08-010b kernel. It composes and hulls every model selected
// by C08-010a, eliminates the exact factorized bivariate monomials by directed
// dyadic beta moments, multiplies by the full t Jacobian, adds F(t)*G(0), and
// moves every centered-xi degree above rC to a positive magnitude bound. Input
// model remainders and 13-jet product assembly remain C08-010c duties.
bool evaluate(const Input &input, Output *output, Result *result);

// H2-P2 successor entrypoint. All non-moment operations and logical counters
// remain those of evaluate(); prepared values merely replace identical repeated
// beta_moment constructions.
bool evaluate_prepared(const Input &input, const PreparedMoments &prepared,
                       Output *output, Result *result);

const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_convolution_bivariate_v1
