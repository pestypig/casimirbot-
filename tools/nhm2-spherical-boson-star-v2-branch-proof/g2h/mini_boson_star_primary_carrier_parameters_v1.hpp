#pragma once

#include <arb.h>

#include <cstddef>

namespace nhm2::g2h_e_s5::primary_carrier_parameters_v1 {

constexpr long precision_bits = 512;
constexpr std::size_t carrier_instance_count = 3U;

bool evaluate_positive_parameter_values(arb_t kappa, arb_t beta,
    const arb_t omega, const arb_t mass);

// Positive-chart state derivatives are taken with respect to the supplied
// state coordinates. Only omega_index and mass_index are nonzero.
bool evaluate_positive_parameter_jets(arb_t kappa, arb_t beta,
    arb_ptr kappa_gradient, arb_ptr kappa_hessian,
    arb_ptr beta_gradient, arb_ptr beta_hessian,
    std::size_t state_dimension, std::size_t omega_index,
    std::size_t mass_index, const arb_t omega, const arb_t mass);

// Vacuum-chart state derivatives hold eta fixed. Mbar_infinity is a dependent
// state observable, so its complete directed gradient and Hessian are required
// and are composed into the kappa_bar/beta_bar jets. Hessians use row-major
// state_dimension-by-state_dimension order.
bool evaluate_vacuum_parameter_jets(arb_t kappa_bar, arb_t beta_bar,
    arb_ptr kappa_gradient, arb_ptr kappa_hessian,
    arb_ptr beta_gradient, arb_ptr beta_hessian,
    std::size_t state_dimension, std::size_t nbar_index,
    const arb_t eta, const arb_t nbar, const arb_t mbar_infinity,
    arb_srcptr mbar_gradient, arb_srcptr mbar_hessian);

// Assemble A/W/Z (or Abar/Wbar/Zbar) parameter jets in fixed order:
//   0: (a,b)=(kappa,beta)
//   1: (a,b)=(2*kappa,2*beta+2)
//   2: (a,b)=(2*kappa,2*beta+1)
// Output gradient blocks are instance-major and Hessian blocks are
// instance-major, row-major within each block.
bool assemble_carrier_parameter_jets(arb_ptr a_values, arb_ptr b_values,
    arb_ptr a_gradients, arb_ptr a_hessians,
    arb_ptr b_gradients, arb_ptr b_hessians,
    std::size_t state_dimension, const arb_t kappa, const arb_t beta,
    arb_srcptr kappa_gradient, arb_srcptr kappa_hessian,
    arb_srcptr beta_gradient, arb_srcptr beta_hessian);

std::size_t fixture_count();
std::size_t fixtures_passed();
unsigned fixture_mask();
bool run_carrier_parameter_fixture_suite();

} // namespace nhm2::g2h_e_s5::primary_carrier_parameters_v1
