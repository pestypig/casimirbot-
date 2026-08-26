#pragma once

#include "mini_boson_star_primary_c08_analytic_parameter_jets_v1.hpp"
#include "mini_boson_star_primary_c08_convolution_ledger_v1.hpp"

#include <arb.h>

#include <cstddef>
#include <cstdint>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_analytic_model_product_v1 {

namespace analytic = primary_c08_analytic_parameter_jets_v1;
namespace ledger = primary_c08_convolution_ledger_v1;

inline constexpr slong kPrecisionBits = 512;
inline constexpr std::size_t kJetCount = analytic::kJetCount;

enum class FailureDetail : std::uint8_t {
    none = 0,
    input_or_output,
    source_model,
    analytic_factor,
    nonfinite_assembly,
};

struct Input {
    ledger::ModelView source;
    // factor(xi)=factor_constant+xi*factor_linear in all 13 ordered jets.
    arb_srcptr factor_constant = nullptr;
    arb_srcptr factor_linear = nullptr;
    std::size_t factor_jet_count = 0U;
};

struct Output {
    arb_t left_endpoint;
    arb_t right_endpoint;
    arb_t expansion_center;
    unsigned order = 0U;
    std::vector<arb_struct> coefficients;
    std::vector<arb_struct> remainders;

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
    std::size_t coefficient_product_terms = 0U;
    std::size_t source_remainder_terms = 0U;
    std::size_t discarded_degree_terms = 0U;
    std::size_t ordered_second_outputs = 0U;
    bool exact_degree_one_factor = false;
    bool complete_ordered_13_jet_inventory = false;
    bool both_mixed_orientations_retained = false;
    bool signed_remainder_cancellation_used = false;
    bool midpoint_selection_used = false;
    bool point_sampling_used = false;
    std::size_t candidate_evaluations = 0U;
    std::size_t positive_parameter_samples = 0U;
    bool candidate_root_created = false;
    bool scientific_handler_linked = false;
    bool authority_promoted = false;
};

// Multiplies one immutable left-centered scalar model by one exact degree-one
// analytic factor. Coefficients through the source order are retained. The
// degree-(r+1) term and every source-remainder product are added outward and
// without signed cancellation to the corresponding ordered-jet remainder.
bool evaluate(const Input &input, Output *output, Result *result);

const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_analytic_model_product_v1
