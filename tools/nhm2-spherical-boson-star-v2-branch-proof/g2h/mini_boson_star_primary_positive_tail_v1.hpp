#pragma once

#include <arb.h>

#include <cstddef>

namespace nhm2::g2h_e_s5::primary_positive_tail_v1 {

constexpr long precision_bits = 512;

struct TailInput {
    arb_t q;
    arb_t omega;
    arb_t mass;
    arb_t D;
    arb_t D_q;
    arb_t S;
    arb_t S_q;
    arb_t H;
    arb_t H_q;
    arb_t K;
    arb_t K_q;
};

struct TailOutput {
    arb_t kappa;
    arb_t beta;
    arb_t A;
    arb_t W;
    arb_t Z;
    arb_t m;
    arb_t f;
    arb_t b;
    arb_t s;
    arb_t sigma;
    arb_t p_over_A;
    arb_t p;
    arb_t rho_hat;
    arb_t radial_pressure_hat;
    arb_t mass_residual;
    arb_t lapse_residual;
    arb_t H_definition_residual;
    arb_t KG_residual;
};

struct EndpointOutput {
    arb_t kappa;
    arb_t beta;
    arb_t D0;
    arb_t S0;
};

void init(TailInput &input);
void clear(TailInput &input);
void init(TailOutput &output);
void clear(TailOutput &output);
void init(EndpointOutput &output);
void clear(EndpointOutput &output);

// Positive-kappa tail only, with q strictly inside (0,1/255].
bool evaluate_tail(TailOutput &output, const TailInput &input, unsigned *failure_stage = nullptr);

// Exact q=0 recurrence. No flat carrier is evaluated by division at q=0.
bool evaluate_endpoint(EndpointOutput &output, const arb_t omega,
    const arb_t mass, const arb_t H0);

std::size_t fixture_count();
std::size_t fixtures_passed();
unsigned fixture_mask();
unsigned zero_field_check_mask();
unsigned zero_field_failure_stage();
bool run_positive_tail_fixture_suite();

} // namespace nhm2::g2h_e_s5::primary_positive_tail_v1
