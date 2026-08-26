#pragma once

#include <arb.h>

#include <cstddef>

namespace nhm2::g2h_e_s5::primary_grid_v1 {

constexpr long precision_bits = 512;

bool frozen_node_count(long node_count);
long positive_state_length(long node_count);
long vacuum_state_length(long node_count);

struct PatchNode {
    arb_t core_even_coordinate;
    arb_t core_radius;
    arb_t tail_inverse_radius;
};

void init(PatchNode &node);
void clear(PatchNode &node);

// j=0 is core interface/tail infinity; j=N-1 is core origin/tail interface.
bool construct_patch_node(PatchNode &node, long node_count, long ordinal);

// Converts physical-order DCT-I nodal values into the frozen canonical
// Chebyshev coefficients c_0..c_(N-1). Input and output may not alias.
bool canonical_dct_i(arb_ptr coefficients, arb_srcptr nodal_values, long node_count);

bool positive_state_index(long *index, long node_count, long component, long coefficient);
bool positive_scalar_index(long *index, long node_count, long scalar_ordinal);
bool vacuum_state_index(long *index, long node_count, long component, long coefficient);
bool vacuum_scalar_index(long *index, long node_count);

std::size_t fixture_count();
std::size_t fixtures_passed();
bool run_grid_fixture_suite();

} // namespace nhm2::g2h_e_s5::primary_grid_v1
