#pragma once

#include <arb.h>

#include <cstddef>
#include <cstdint>

namespace nhm2::g2h_e_s5::primary_flat_remainder_v1 {

constexpr long precision_bits = 512;
constexpr std::size_t residual_component_count = 4U;
constexpr std::size_t parameter_dimension = 3U;
constexpr std::size_t parameter_jet_count = 13U;
constexpr std::size_t maximum_coefficient_count = 256U;
constexpr std::size_t maximum_state_dimension = 8U * maximum_coefficient_count + 2U;

// C08 failure ordinals are deliberately retained here so an A5 handler can
// preserve the frozen first-failure chronology without translating errors.
enum class FailureCode : std::uint16_t {
    none = 0,
    input_identity_or_state_length = 1,
    truncated_weighted_coefficient_tail = 16,
    full_state_jet_composition = 17,
    f_flat_y_assembly = 18,
    f_flat_z1_assembly = 19,
    f_flat_z2_assembly = 20,
};

struct Input {
    std::size_t coefficient_count;
    std::size_t state_dimension;

    // Layout: component-major, then the frozen 13-entry parameter-jet order,
    // then increasing Chebyshev coefficient ordinal.
    arb_srcptr full_parameter_jet_coefficients;
    arb_srcptr formal_parameter_jet_coefficients;

    // Separate infinite l1_8 tails in component-major, jet-minor order. The
    // two tails are retained independently and added without cancellation.
    arb_srcptr full_parameter_jet_tails;
    arb_srcptr formal_parameter_jet_tails;

    // theta=(h0,kappa,theta2). Gradient layout is theta-major. Hessian layout
    // is theta-major and row-major inside each state_dimension square.
    arb_srcptr theta_gradients;
    arb_srcptr theta_hessians;

    // Authenticated nonnegative operator majorants supplied by the frozen
    // approximate-inverse record. The flat producer never assumes A=I.
    const arb_struct *inverse_y_majorant;
    const arb_struct *inverse_z1_majorant;
    const arb_struct *inverse_z2_majorant;
};

struct Output {
    // Four component-wise l1_8 norm balls, followed by component-wise full
    // state Jacobian and Hessian operator bounds.
    arb_ptr flat_remainder_state_norms;
    arb_ptr full_state_gradient_norms;
    arb_ptr full_state_hessian_norms;
    arb_struct *y_contribution;
    arb_struct *z1_contribution;
    arb_struct *z2_contribution;
};

FailureCode assemble(const Input &input, const Output &output);
const char *failure_code_name(FailureCode code);

std::size_t fixture_count();
std::size_t fixtures_passed();
std::uint32_t fixture_mask();
bool run_fixture_suite();

} // namespace nhm2::g2h_e_s5::primary_flat_remainder_v1
