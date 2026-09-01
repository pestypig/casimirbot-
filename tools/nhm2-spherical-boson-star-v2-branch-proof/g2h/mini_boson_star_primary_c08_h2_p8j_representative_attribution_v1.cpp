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
namespace scalar =
    nhm2::g2h_e_s5::primary_c08_scalar_ledger_provider_v1;
namespace selector =
    nhm2::g2h_e_s5::primary_c08_convolution_selector_v1;
namespace jet = nhm2::g2h_e_s5::primary_c08_convolution_jet_v1;
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
constexpr std::size_t kPanelCount = 65536U;
constexpr std::size_t kThreadCount = 32U;
constexpr std::size_t kProgressInterval = 1024U;
constexpr unsigned kTargetDegree = 3U;
constexpr std::size_t kTargetJet = jet::second_jet(1U, 2U);

void progress(std::size_t completed, std::size_t total, void *) {
    if (completed != total && completed % kProgressInterval != 0U) return;
    std::cerr
        << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_p8j_progress.v1\","
        << "\"completed_panels\":" << completed << ','
        << "\"total_panels\":" << total << "}\n" << std::flush;
}

struct Ball {
    Ball() { arb_init(value); }
    ~Ball() { arb_clear(value); }
    arb_t value;
};

struct Storage {
    explicit Storage(std::size_t count) : values(count) {
        for (auto &value : values) {
            arb_init(&value); arb_indeterminate(&value);
        }
    }
    ~Storage() { for (auto &value : values) arb_clear(&value); }
    std::vector<arb_struct> values;
};

void rational(arb_t value, long numerator, long denominator) {
    fmpq_t q;
    fmpq_init(q); fmpq_set_si(q, numerator, denominator);
    arb_set_fmpq(value, q, h2::kPrecisionBits); fmpq_clear(q);
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

int fail(const char *phase) {
    std::cout
        << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_p8j_representative_attribution.v1\","
        << "\"status\":\"FAIL\",\"phase\":\"" << phase << "\","
        << "\"candidate_evaluations\":0,"
        << "\"positive_parameter_samples\":0,"
        << "\"candidate_roots_created\":false,"
        << "\"scientific_handler_linked\":false,"
        << "\"authority_promoted\":false}\n";
    return 1;
}

void emit_string_array(
    const std::array<std::string, jet::kSecondJetTermCount> &values) {
    std::cout << '[';
    for (std::size_t slot = 0U; slot < values.size(); ++slot) {
        if (slot != 0U) std::cout << ',';
        std::cout << '"' << values[slot] << '"';
    }
    std::cout << ']';
}

}  // namespace

int main() {
    Storage storage(514U);
    auto input_identity = make_identity(storage);
    Ball h0, kappa, mass, eta, target;
    arb_one(h0.value); rational(kappa.value, 1L, 2L);
    rational(mass.value, 1L, 4L); arb_indeterminate(eta.value);
    auto scalar_input = make_scalar_input(input_identity, h0, kappa, mass, eta);

    scalar::Context scalar_context;
    scalar::Result scalar_initial{};
    if (!scalar::initialize(scalar_input, &scalar_context, &scalar_initial))
        return fail("scalar_initialize");
    h2::Context h2_context;
    h2::Result h2_initial{};
    const auto h2_initial_input = make_h2_input(scalar_context);
    if (!h2::initialize(h2_initial_input, &h2_context, &h2_initial))
        return fail("h2_initialize");

    arb_mul_ui(target.value, scalar::right_endpoint(scalar_context), 129U,
               h2::kPrecisionBits);
    arb_div_ui(target.value, target.value, 128U, h2::kPrecisionBits);
    scalar::Result scalar_extension{};
    if (!scalar::extend_to(&scalar_context, target.value, &scalar_extension))
        return fail("scalar_extend");

    const auto before = h2::published(h2_context);
    const auto h2_extension_input = make_h2_input(scalar_context);
    selector::Output output;
    selector::Result result{};
    selector::CoefficientDecompositionObservation observation;
    const bool evaluated = h2::diagnose_next_selector_candidate_observable(
        h2_extension_input, &h2_context, kPanelCount, kThreadCount,
        kTargetDegree, kTargetJet, &output, &result, &observation,
        progress, nullptr);
    const auto after = h2::published(h2_context);
    const bool parent_unchanged = before.model_count == after.model_count
        && before.models == after.models;
    if (!evaluated || !observation.evaluated
        || !observation.slot3_attribution_evaluated
        || !observation.all_slot3_reconstructions_equal
        || !parent_unchanged) {
        return fail("representative_attribution");
    }

    std::cout
        << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_p8j_representative_attribution.v1\","
        << "\"status\":\"PASS\",\"phase\":\"complete\","
        << "\"panel_count\":" << observation.panel_count << ','
        << "\"thread_count\":" << kThreadCount << ','
        << "\"target_degree\":" << observation.target_degree << ','
        << "\"target_jet\":" << observation.target_jet << ','
        << "\"terms_per_panel\":" << observation.terms_per_panel << ','
        << "\"elementary_terms_observed\":"
        << observation.elementary_terms_observed << ','
        << "\"all_panel_reconstructions_equal\":"
        << (observation.all_panel_reconstructions_equal ? "true" : "false")
        << ",\"final_reconstruction_equal\":"
        << (observation.final_reconstruction_equal ? "true" : "false")
        << ",\"final_radius\":\"" << observation.final_radius << '"'
        << ",\"final_threshold\":\"" << observation.final_threshold << '"'
        << ",\"final_ratio\":\"" << observation.final_ratio << '"'
        << ",\"slot_radius_sums\":";
    emit_string_array(observation.slot_radius_sums);
    std::cout << ",\"slot_upper_magnitude_sums\":";
    emit_string_array(observation.slot_upper_magnitude_sums);
    std::cout
        << ",\"boundary_panel_radius\":\""
        << observation.boundary_panel_radius << '"'
        << ",\"nonboundary_panel_radius_sum\":\""
        << observation.nonboundary_panel_radius_sum << '"'
        << ",\"total_elementary_radius_sum\":\""
        << observation.total_elementary_radius_sum << '"'
        << ",\"final_to_elementary_radius_ratio\":\""
        << observation.final_to_elementary_radius_ratio << '"'
        << ",\"maximum_elementary_radius\":\""
        << observation.maximum_elementary_radius << '"'
        << ",\"maximum_elementary_panel_ordinal\":"
        << observation.maximum_elementary_panel_ordinal
        << ",\"maximum_elementary_slot\":"
        << observation.maximum_elementary_slot
        << ",\"slot3_integrated_terms_observed\":"
        << observation.slot3_integrated_terms_observed
        << ",\"slot3_boundary_terms_observed\":"
        << observation.slot3_boundary_terms_observed
        << ",\"all_slot3_reconstructions_equal\":"
        << (observation.all_slot3_reconstructions_equal ? "true" : "false")
        << ",\"slot3_f_source_hull_radius_sum\":\""
        << observation.slot3_f_source_hull_radius_sum << '"'
        << ",\"slot3_gprime_source_hull_radius_sum\":\""
        << observation.slot3_gprime_source_hull_radius_sum << '"'
        << ",\"slot3_direct_integrated_radius_sum\":\""
        << observation.slot3_direct_integrated_radius_sum << '"'
        << ",\"slot3_boundary_radius_sum\":\""
        << observation.slot3_boundary_radius_sum << '"'
        << ",\"slot3_integrated_component_radius_sum\":\""
        << observation.slot3_integrated_component_radius_sum << '"'
        << ",\"slot3_boundary_component_radius_sum\":\""
        << observation.slot3_boundary_component_radius_sum << '"'
        << ",\"parent_unchanged\":"
        << (parent_unchanged ? "true" : "false")
        << ",\"refinement_candidates_visited\":"
        << result.refinement_candidates_visited
        << ",\"subpanels_accumulated\":" << result.subpanels_accumulated
        << ",\"jet_predecessor_calls\":" << result.jet_predecessor_calls
        << ",\"elementary_convolutions\":"
        << result.elementary_convolutions
        << ",\"numerical_width_checks\":"
        << result.numerical_width_checks
        << ",\"candidate_evaluations\":0,"
        << "\"positive_parameter_samples\":0,"
        << "\"candidate_roots_created\":false,"
        << "\"scientific_handler_linked\":false,"
        << "\"authority_promoted\":false}\n";
    return 0;
}
