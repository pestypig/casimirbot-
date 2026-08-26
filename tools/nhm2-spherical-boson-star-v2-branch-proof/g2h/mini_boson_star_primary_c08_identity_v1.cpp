#include "mini_boson_star_primary_c08_identity_v1.hpp"

#include "mini_boson_star_primary_grid_v1.hpp"

#include <array>
#include <vector>

namespace nhm2::g2h_e_s5::primary_c08_identity_v1 {
namespace {

constexpr std::string_view kGrowthContractHash =
    "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737";
constexpr std::string_view kStateJetHash =
    "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc";
constexpr std::string_view kStateGridHash =
    "cd98fb110a6d0d94cd69d1134e8f5233444ea34f7894bc14333075d0dfa5013c";
constexpr std::string_view kCheckpointAbiHash =
    "6fbf6cdbb80e6da390c84f6d87f13f37f2b81b2226bf937cbcfd2c8aff3911ca";

bool hashes_match(const InputIdentity &input) {
    return input.growth_contract_raw_sha256 == kGrowthContractHash
        && input.state_jet_raw_sha256 == kStateJetHash
        && input.state_grid_raw_sha256 == kStateGridHash
        && input.checkpoint_abi_raw_sha256 == kCheckpointAbiHash;
}

bool chart_cell_pair(Chart chart, std::uint32_t ordinal) {
    if (chart == Chart::vacuum) return ordinal == 0U;
    if (chart == Chart::positive) return ordinal >= 1U && ordinal <= 1023U;
    return false;
}

long expected_state_length(Chart chart, long node_count) {
    if (chart == Chart::vacuum) {
        return nhm2::g2h_e_s5::primary_grid_v1::vacuum_state_length(node_count);
    }
    if (chart == Chart::positive) {
        return nhm2::g2h_e_s5::primary_grid_v1::positive_state_length(node_count);
    }
    return -1L;
}

struct Storage {
    explicit Storage(std::size_t count) : values(count) {
        for (auto &value : values) {
            arb_init(&value);
            // An indeterminate coefficient proves structural admission does
            // not inspect or evaluate supplied state values.
            arb_indeterminate(&value);
        }
    }
    ~Storage() {
        for (auto &value : values) arb_clear(&value);
    }
    std::vector<arb_struct> values;
};

InputIdentity good_identity(Chart chart, std::uint32_t ordinal, long node_count,
    std::size_t state_length, arb_srcptr state_storage) {
    return {
        kGrowthContractHash,
        kStateJetHash,
        kStateGridHash,
        kCheckpointAbiHash,
        chart,
        ordinal,
        node_count,
        state_length,
        state_storage,
    };
}

std::array<bool, 10> fixture_results() {
    Storage positive64(514U);
    Storage vacuum256(2049U);
    std::array<bool, 10> checks{};
    checks[0] = validate(good_identity(Chart::positive, 1U, 64L,
        positive64.values.size(), positive64.values.data()));
    checks[1] = validate(good_identity(Chart::positive, 1023U, 64L,
        positive64.values.size(), positive64.values.data()));
    checks[2] = validate(good_identity(Chart::vacuum, 0U, 256L,
        vacuum256.values.size(), vacuum256.values.data()));

    auto invalid = good_identity(Chart::vacuum, 1U, 256L,
        vacuum256.values.size(), vacuum256.values.data());
    checks[3] = !validate(invalid);
    invalid = good_identity(Chart::positive, 0U, 64L,
        positive64.values.size(), positive64.values.data());
    checks[4] = !validate(invalid);
    invalid = good_identity(static_cast<Chart>(2U), 1U, 64L,
        positive64.values.size(), positive64.values.data());
    checks[5] = !validate(invalid);
    invalid = good_identity(Chart::positive, 1U, 65L,
        positive64.values.size(), positive64.values.data());
    checks[6] = !validate(invalid);
    invalid = good_identity(Chart::positive, 1U, 64L,
        positive64.values.size() - 1U, positive64.values.data());
    checks[7] = !validate(invalid);
    invalid = good_identity(Chart::positive, 1U, 64L,
        positive64.values.size(), nullptr);
    checks[8] = !validate(invalid);
    invalid = good_identity(Chart::positive, 1U, 64L,
        positive64.values.size(), positive64.values.data());
    invalid.growth_contract_raw_sha256 =
        "0dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737";
    checks[9] = !validate(invalid);
    return checks;
}

} // namespace

bool validate(const InputIdentity &input) {
    if (!hashes_match(input) || input.state_storage == nullptr
        || !nhm2::g2h_e_s5::primary_grid_v1::frozen_node_count(input.grid_node_count)
        || !chart_cell_pair(input.chart, input.continuation_cell_ordinal)) {
        return false;
    }
    const long expected = expected_state_length(input.chart, input.grid_node_count);
    return expected > 0L && input.state_length == static_cast<std::size_t>(expected);
}

std::size_t fixture_count() { return 10U; }

std::size_t fixtures_passed() {
    const auto checks = fixture_results();
    std::size_t passed = 0U;
    for (const bool value : checks) passed += value ? 1U : 0U;
    return passed;
}

std::uint32_t fixture_mask() {
    const auto checks = fixture_results();
    std::uint32_t mask = 0U;
    for (std::size_t index = 0; index < checks.size(); ++index) {
        if (checks[index]) mask |= 1U << index;
    }
    return mask;
}

bool run_fixture_suite() { return fixtures_passed() == fixture_count(); }

} // namespace nhm2::g2h_e_s5::primary_c08_identity_v1
