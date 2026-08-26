#include "mini_boson_star_primary_flat_remainder_v1.hpp"

#include <cstdio>

int main() {
    namespace flat = nhm2::g2h_e_s5::primary_flat_remainder_v1;
    const std::size_t passed = flat::fixtures_passed();
    const std::size_t total = flat::fixture_count();
    std::printf("{\"authority_promoted\":false,\"candidate_evaluations\":0,"
        "\"candidate_roots_created\":false,\"checks_passed\":%zu,"
        "\"checks_total\":%zu,\"fixture_mask\":%u,"
        "\"positive_parameter_samples\":0,"
        "\"schema\":\"nhm2.g2h_e_s5.primary_flat_remainder_fixture.v1\","
        "\"scientific_handler_linked\":false,\"status\":\"%s\"}\n",
        passed, total, flat::fixture_mask(), passed == total ? "PASS" : "FAIL");
    return passed == total ? 0 : 1;
}
