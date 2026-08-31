#include "mini_boson_star_primary_c08_h2_ledger_v1.hpp"
#include "mini_boson_star_primary_c08_scalar_ledger_provider_v1.hpp"

#include "mini_boson_star_primary_c08_identity_v1.hpp"
#include "mini_boson_star_primary_c08_margins_v1.hpp"

#include <arb.h>
#include <flint/fmpq.h>

#include <cstddef>
#include <iostream>
#include <string>
#include <vector>

namespace h2 = nhm2::g2h_e_s5::primary_c08_h2_ledger_v1;
namespace scalar = nhm2::g2h_e_s5::primary_c08_scalar_ledger_provider_v1;
namespace identity = nhm2::g2h_e_s5::primary_c08_identity_v1;
namespace margins = nhm2::g2h_e_s5::primary_c08_margins_v1;

namespace {

constexpr char kGrowthHash[] =
    "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737";
constexpr char kJetHash[] =
    "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc";
constexpr char kGridHash[] =
    "cd98fb110a6d0d94cd69d1134e8f5233444ea34f7894bc14333075d0dfa5013c";
constexpr char kAbiHash[] =
    "6fbf6cdbb80e6da390c84f6d87f13f37f2b81b2226bf937cbcfd2c8aff3911ca";

struct Ball {
    Ball() { arb_init(value); }
    ~Ball() { arb_clear(value); }
    arb_t value;
};

struct Storage {
    explicit Storage(std::size_t count) : values(count) {
        for (auto &value : values) {
            arb_init(&value);
            arb_indeterminate(&value);
        }
    }
    ~Storage() {
        for (auto &value : values) arb_clear(&value);
    }
    std::vector<arb_struct> values;
};

void rational(arb_t value, long numerator, long denominator) {
    fmpq_t q;
    fmpq_init(q);
    fmpq_set_si(q, numerator, denominator);
    arb_set_fmpq(value, q, h2::kPrecisionBits);
    fmpq_clear(q);
}

identity::InputIdentity make_identity(Storage &storage) {
    return {kGrowthHash, kJetHash, kGridHash, kAbiHash,
            identity::Chart::positive, 1U, 64L,
            storage.values.size(), storage.values.data()};
}

scalar::Input make_scalar_input(identity::InputIdentity &input_identity,
                                Ball &h0, Ball &kappa, Ball &mass, Ball &eta) {
    margins::Input margin_input{&input_identity, true, h0.value, kappa.value,
                                mass.value, eta.value};
    return {{{margin_input}}, {10U, 20U, 30U, 40U}};
}

h2::Input make_h2_input(const scalar::Context &context) {
    return {scalar::published(context), {10U, 20U, 30U, 40U}, 50U};
}

bool neutral(const h2::Result &result) {
    return result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created
        && !result.scientific_handler_linked
        && !result.authority_promoted;
}

int emit(const char *status, const char *phase, const h2::Result *result,
         const h2::ParentDiagnostics *diagnostics, bool origin_passed,
         bool scalar_extension_passed, int exit_code) {
    std::string canonical;
    const bool diagnostic_serialized = diagnostics != nullptr
        && h2::serialize_diagnostics(*diagnostics, &canonical);
    std::cout
        << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_p8c_diagnostic_run.v1\""
        << ",\"status\":\"" << status << "\""
        << ",\"phase\":\"" << phase << "\""
        << ",\"origin_h2_passed\":" << (origin_passed ? "true" : "false")
        << ",\"scalar_extension_passed\":"
        << (scalar_extension_passed ? "true" : "false")
        << ",\"diagnostic_serialized\":"
        << (diagnostic_serialized ? "true" : "false");
    if (result != nullptr) {
        std::cout
            << ",\"detail\":\"" << h2::failure_detail_name(result->detail)
            << "\",\"selector_calls\":" << result->selector_calls
            << ",\"selector_candidates\":"
            << result->selector_refinement_candidates_visited
            << ",\"selector_subpanels\":"
            << result->selector_subpanels_accumulated
            << ",\"selector_jet_calls\":"
            << result->selector_jet_predecessor_calls
            << ",\"selector_elementary_convolutions\":"
            << result->selector_elementary_convolutions
            << ",\"selector_width_checks\":"
            << result->selector_numerical_width_checks
            << ",\"first_failure_terminal\":"
            << (result->first_failure_terminal ? "true" : "false")
            << ",\"neutral\":" << (neutral(*result) ? "true" : "false");
    }
    std::cout << ",\"diagnostic\":"
              << (diagnostic_serialized ? canonical : "null")
              << ",\"candidate_evaluations\":0"
              << ",\"positive_parameter_samples\":0"
              << ",\"candidate_roots_created\":false"
              << ",\"scientific_handler_linked\":false"
              << ",\"authority_promoted\":false}\n";
    return diagnostic_serialized || diagnostics == nullptr ? exit_code : 2;
}

}  // namespace

int main() {
    Storage storage(514U);
    auto input_identity = make_identity(storage);
    Ball h0, kappa, mass, eta, target;
    arb_one(h0.value);
    rational(kappa.value, 1L, 2L);
    rational(mass.value, 1L, 4L);
    arb_indeterminate(eta.value);
    auto scalar_input = make_scalar_input(input_identity, h0, kappa, mass, eta);

    scalar::Context scalar_context;
    scalar::Result scalar_initial{};
    if (!scalar::initialize(scalar_input, &scalar_context, &scalar_initial))
        return emit("FAIL", "scalar_initialize", nullptr, nullptr, false,
                    false, 1);

    h2::Context h2_context;
    h2::Result h2_initial{};
    h2::ParentDiagnostics diagnostics;
    const auto h2_initial_input = make_h2_input(scalar_context);
    const bool h2_initialized = h2::initialize_diagnostic(
        h2_initial_input, &h2_context, &h2_initial, &diagnostics);
    if (!h2_initialized)
        return emit("FAIL", "h2_initialize", &h2_initial, &diagnostics,
                    false, false, 1);

    arb_mul_ui(target.value, scalar::right_endpoint(scalar_context), 129U,
               h2::kPrecisionBits);
    arb_div_ui(target.value, target.value, 128U, h2::kPrecisionBits);
    scalar::Result scalar_extension{};
    const bool scalar_extended = scalar::extend_to(
        &scalar_context, target.value, &scalar_extension);
    if (!scalar_extended)
        return emit("FAIL", "scalar_extend", &h2_initial, &diagnostics,
                    true, false, 1);

    const auto h2_extension_input = make_h2_input(scalar_context);
    h2::Result h2_extension{};
    const bool h2_extended = h2::extend_diagnostic(
        h2_extension_input, &h2_context, &h2_extension, &diagnostics);
    return emit(h2_extended ? "PASS" : "FAIL", "h2_extend", &h2_extension,
                &diagnostics, true, true, h2_extended ? 0 : 1);
}
