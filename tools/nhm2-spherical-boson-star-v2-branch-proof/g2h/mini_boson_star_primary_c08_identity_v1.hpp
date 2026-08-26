#pragma once

#include <arb.h>

#include <cstddef>
#include <cstdint>
#include <string_view>

namespace nhm2::g2h_e_s5::primary_c08_identity_v1 {

enum class Chart : std::uint8_t {
    vacuum = 0,
    positive = 1,
};

struct InputIdentity {
    std::string_view growth_contract_raw_sha256;
    std::string_view state_jet_raw_sha256;
    std::string_view state_grid_raw_sha256;
    std::string_view checkpoint_abi_raw_sha256;
    Chart chart;
    std::uint32_t continuation_cell_ordinal;
    long grid_node_count;
    std::size_t state_length;
    arb_srcptr state_storage;
};

// C08-001 structural admission only. It validates frozen identities, the
// chart/cell pairing, grid cardinality, state length, and non-null storage. It
// deliberately reads no state coefficient and performs no scientific work.
bool validate(const InputIdentity &input);

std::size_t fixture_count();
std::size_t fixtures_passed();
std::uint32_t fixture_mask();
bool run_fixture_suite();

} // namespace nhm2::g2h_e_s5::primary_c08_identity_v1
