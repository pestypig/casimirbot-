#pragma once

#include <arb.h>

#include <array>
#include <cstddef>
#include <cstdint>

namespace nhm2::g2h_e_s5::primary_c08_analytic_parameter_jets_v1 {

inline constexpr slong kPrecisionBits = 512;
inline constexpr std::size_t kParameterCount = 3U;
inline constexpr std::size_t kJetCount = 13U;
constexpr std::size_t value_jet() { return 0U; }
constexpr std::size_t first_jet(std::size_t a) { return 1U + a; }
constexpr std::size_t second_jet(std::size_t a, std::size_t b) {
    return 4U + a * kParameterCount + b;
}

enum class Chart : std::uint8_t { positive = 0, vacuum = 1 };

enum class FailureDetail : std::uint8_t {
    none = 0,
    input_or_output,
    strict_parameter_margin,
    reciprocal_or_jet_algebra,
    nonfinite_output,
};

struct Input {
    Chart chart = Chart::positive;
    arb_srcptr kappa = nullptr;
    // Positive chart: theta2=mu. Vacuum chart: theta2=Mbar_infinity.
    arb_srcptr theta2 = nullptr;
    // Vacuum chart only; eta is fixed under internal theta differentiation.
    arb_srcptr eta = nullptr;
};

struct Output {
    std::array<arb_struct, kJetCount> kappa;
    std::array<arb_struct, kJetCount> mu;
    std::array<arb_struct, kJetCount> beta_plus_one;

    Output();
    ~Output();
    Output(const Output &) = delete;
    Output &operator=(const Output &) = delete;
};

struct Result {
    bool accepted = false;
    FailureDetail detail = FailureDetail::none;
    std::size_t jet_components_written = 0U;
    std::size_t ordered_second_components_written = 0U;
    bool exact_internal_theta_order = false;
    bool eta_fixed_during_vacuum_differentiation = false;
    bool reciprocal_identity_verified = false;
    bool both_mixed_orientations_retained = false;
    bool retry_or_retune_used = false;
    bool point_sampling_used = false;
    std::size_t candidate_evaluations = 0U;
    std::size_t positive_parameter_samples = 0U;
    bool candidate_root_created = false;
    bool scientific_handler_linked = false;
    bool authority_promoted = false;
};

// Candidate-neutral realization of the acknowledged internal parameter tuple
// theta=(h0,kappa,mu) on the positive chart and
// theta=(h0,kappa,Mbar_infinity), eta fixed, on the vacuum chart. It produces
// the exact ordered jets of kappa, mu, and
// beta+1=mu*(1-2*kappa^2)/kappa=mu*(1/kappa-2*kappa).
bool evaluate(const Input &input, Output *output, Result *result);

const char *failure_detail_name(FailureDetail detail);

}  // namespace nhm2::g2h_e_s5::primary_c08_analytic_parameter_jets_v1
