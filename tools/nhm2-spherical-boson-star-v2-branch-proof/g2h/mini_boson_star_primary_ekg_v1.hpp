#pragma once

#include <arb.h>

#include <cstddef>

namespace nhm2::g2h_e_s5::primary_ekg_v1 {

constexpr long precision_bits = 512;

struct BulkInput {
    arb_t r;
    arb_t b;
    arb_t s;
    arb_t sigma;
    arb_t sigma_prime;
    arb_t b_prime;
    arb_t s_prime;
    arb_t sigma_second;
    arb_t omega;
};

struct BulkOutput {
    arb_t rho;
    arb_t radial_pressure;
    arb_t tangential_pressure;
    arb_t b_residual;
    arb_t s_residual;
    arb_t sigma_residual;
};

void init(BulkInput &input);
void clear(BulkInput &input);
void init(BulkOutput &output);
void clear(BulkOutput &output);

// Evaluates the frozen lambda=0 equations on one r>0 interval ball. Origin
// regularization and global-domain enclosure are separate constructors.
bool evaluate_bulk(BulkOutput &output, const BulkInput &input);

std::size_t fixture_count();
std::size_t fixtures_passed();
bool run_ekg_fixture_suite();

} // namespace nhm2::g2h_e_s5::primary_ekg_v1
