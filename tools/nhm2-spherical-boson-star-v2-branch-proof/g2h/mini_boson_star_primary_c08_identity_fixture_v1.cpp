#include "mini_boson_star_primary_c08_identity_v1.hpp"

#include <cstdio>

int main() {
    namespace identity = nhm2::g2h_e_s5::primary_c08_identity_v1;
    const std::size_t passed = identity::fixtures_passed();
    const std::size_t total = identity::fixture_count();
    std::printf("{\"authority_promoted\":false,\"candidate_evaluations\":0,"
        "\"candidate_roots_created\":false,\"checks_passed\":%zu,"
        "\"checks_total\":%zu,\"fixture_mask\":%u,"
        "\"positive_parameter_samples\":0,"
        "\"schema\":\"nhm2.g2h_e_s5.primary_c08_identity_fixture.v1\","
        "\"scientific_handler_linked\":false,\"state_coefficients_read\":0,"
        "\"status\":\"%s\"}\n",
        passed, total, identity::fixture_mask(), passed == total ? "PASS" : "FAIL");
    return passed == total ? 0 : 1;
}
