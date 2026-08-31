#include "mini_boson_star_primary_c08_h2_ledger_v1.hpp"
#include "mini_boson_star_primary_c08_scalar_ledger_provider_v1.hpp"

#include "mini_boson_star_primary_c08_identity_v1.hpp"
#include "mini_boson_star_primary_c08_margins_v1.hpp"

#include <arb.h>
#include <flint/fmpq.h>

#include <iostream>
#include <vector>

namespace h2 = nhm2::g2h_e_s5::primary_c08_h2_ledger_v1;
namespace scalar =
    nhm2::g2h_e_s5::primary_c08_scalar_ledger_provider_v1;
namespace selector =
    nhm2::g2h_e_s5::primary_c08_convolution_selector_v1;
namespace jet = nhm2::g2h_e_s5::primary_c08_convolution_jet_v1;
namespace ledger = nhm2::g2h_e_s5::primary_c08_convolution_ledger_v1;
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

bool same_result(const selector::Result &left,
                 const selector::Result &right) {
    return left.accepted == right.accepted && left.detail == right.detail
        && left.refinement_candidates_visited
            == right.refinement_candidates_visited
        && left.subpanels_accumulated == right.subpanels_accumulated
        && left.jet_predecessor_calls == right.jet_predecessor_calls
        && left.elementary_convolutions == right.elementary_convolutions
        && left.numerical_width_checks == right.numerical_width_checks
        && left.candidate_evaluations == right.candidate_evaluations
        && left.positive_parameter_samples == right.positive_parameter_samples
        && left.candidate_root_created == right.candidate_root_created
        && left.scientific_handler_linked == right.scientific_handler_linked
        && left.authority_promoted == right.authority_promoted;
}

bool same_output(const selector::Output &left,
                 const selector::Output &right) {
    if (left.retained_order != right.retained_order
        || left.selected_u_panels != right.selected_u_panels
        || !arb_equal(left.target_left, right.target_left)
        || !arb_equal(left.target_right, right.target_right)
        || !arb_equal(left.target_center, right.target_center)
        || !arb_equal(left.target_half_width, right.target_half_width)
        || left.direct_coverage_offsets != right.direct_coverage_offsets
        || left.direct_coverage_ordinals != right.direct_coverage_ordinals
        || left.reflected_coverage_offsets != right.reflected_coverage_offsets
        || left.reflected_coverage_ordinals
            != right.reflected_coverage_ordinals) return false;
    for (unsigned degree = 0U; degree <= left.retained_order; ++degree) {
        for (std::size_t index = 0U; index < jet::kJetCount; ++index) {
            if (!arb_equal(left.coefficient(degree, index),
                           right.coefficient(degree, index))) return false;
        }
    }
    for (std::size_t index = 0U; index < jet::kJetCount; ++index) {
        if (!arb_equal(left.remainder(index), right.remainder(index)))
            return false;
    }
    return true;
}

bool same_observation(
    const selector::CoefficientDecompositionObservation &left,
    const selector::CoefficientDecompositionObservation &right) {
    return left.evaluated == right.evaluated
        && left.panel_count == right.panel_count
        && left.target_degree == right.target_degree
        && left.target_jet == right.target_jet
        && left.elementary_terms_observed == right.elementary_terms_observed
        && left.all_panel_reconstructions_equal
            == right.all_panel_reconstructions_equal
        && left.final_reconstruction_equal == right.final_reconstruction_equal
        && left.final_radius == right.final_radius
        && left.final_threshold == right.final_threshold
        && left.final_ratio == right.final_ratio
        && left.slot_radius_sums == right.slot_radius_sums
        && left.slot_upper_magnitude_sums
            == right.slot_upper_magnitude_sums
        && left.boundary_panel_radius == right.boundary_panel_radius
        && left.nonboundary_panel_radius_sum
            == right.nonboundary_panel_radius_sum
        && left.total_elementary_radius_sum
            == right.total_elementary_radius_sum
        && left.final_to_elementary_radius_ratio
            == right.final_to_elementary_radius_ratio
        && left.maximum_elementary_radius
            == right.maximum_elementary_radius
        && left.maximum_elementary_panel_ordinal
            == right.maximum_elementary_panel_ordinal
        && left.maximum_elementary_slot == right.maximum_elementary_slot;
}

bool same_ledger(const ledger::LedgerView &left,
                 const ledger::LedgerView &right) {
    if (left.model_count != right.model_count
        || left.models != right.models) return false;
    for (std::size_t ordinal = 0U; ordinal < left.model_count; ++ordinal) {
        const auto &a = left.models[ordinal];
        const auto &b = right.models[ordinal];
        if (a.ordinal != b.ordinal || a.kind != b.kind || a.order != b.order
            || a.coefficient_count != b.coefficient_count
            || a.remainder_count != b.remainder_count
            || !arb_equal(a.left_endpoint, b.left_endpoint)
            || !arb_equal(a.right_endpoint, b.right_endpoint)
            || !arb_equal(a.expansion_center, b.expansion_center)) return false;
        for (std::size_t index = 0U; index < a.coefficient_count; ++index) {
            if (!arb_equal(a.coefficients + index, b.coefficients + index))
                return false;
        }
        for (std::size_t index = 0U; index < a.remainder_count; ++index) {
            if (!arb_equal(a.remainders + index, b.remainders + index))
                return false;
        }
    }
    return true;
}

}  // namespace

int main() {
    std::vector<bool> checks;
    Storage storage(514U);
    auto input_identity = make_identity(storage);
    Ball h0, kappa, mass, eta, target;
    arb_one(h0.value); rational(kappa.value, 1L, 2L);
    rational(mass.value, 1L, 4L); arb_indeterminate(eta.value);
    auto scalar_input = make_scalar_input(input_identity, h0, kappa, mass, eta);

    scalar::Context scalar_context;
    scalar::Result scalar_initial{};
    const bool scalar_initialized = scalar::initialize(
        scalar_input, &scalar_context, &scalar_initial);
    h2::Context h2_context;
    h2::Result h2_initial{};
    const auto h2_initial_input = make_h2_input(scalar_context);
    const bool h2_initialized = scalar_initialized && h2::initialize(
        h2_initial_input, &h2_context, &h2_initial);
    checks.push_back(scalar_initialized && h2_initialized);

    arb_mul_ui(target.value, scalar::right_endpoint(scalar_context), 129U,
               h2::kPrecisionBits);
    arb_div_ui(target.value, target.value, 128U, h2::kPrecisionBits);
    scalar::Result scalar_extension{};
    const bool scalar_extended = scalar::extend_to(
        &scalar_context, target.value, &scalar_extension);
    checks.push_back(scalar_extended);

    const auto before = h2::published(h2_context);
    const auto h2_extension_input = make_h2_input(scalar_context);
    selector::Output first_output, second_output;
    selector::Result first_result{}, second_result{};
    selector::CoefficientDecompositionObservation first_observation,
        second_observation;
    const bool first = h2::diagnose_next_selector_candidate(
        h2_extension_input, &h2_context, 2U, 2U, 3U,
        jet::second_jet(1U, 2U), &first_output, &first_result,
        &first_observation);
    const auto between = h2::published(h2_context);
    const bool second = h2::diagnose_next_selector_candidate(
        h2_extension_input, &h2_context, 2U, 2U, 3U,
        jet::second_jet(1U, 2U), &second_output, &second_result,
        &second_observation);
    const auto after = h2::published(h2_context);

    checks.push_back(first && second);
    checks.push_back(same_ledger(before, between)
                     && same_ledger(before, after));
    checks.push_back(same_result(first_result, second_result));
    checks.push_back(same_output(first_output, second_output));
    checks.push_back(same_observation(first_observation,
                                      second_observation));
    checks.push_back(first_observation.evaluated
                     && first_observation.panel_count == 2U
                     && first_observation.target_degree == 3U
                     && first_observation.target_jet
                        == jet::second_jet(1U, 2U)
                     && first_observation.elementary_terms_observed == 8U
                     && first_observation.all_panel_reconstructions_equal
                     && first_observation.final_reconstruction_equal);
    checks.push_back(first_result.refinement_candidates_visited == 1U
                     && first_result.subpanels_accumulated == 2U
                     && first_result.elementary_convolutions == 86U
                     && first_result.numerical_width_checks == 0U);
    checks.push_back(first_result.candidate_evaluations == 0U
                     && second_result.candidate_evaluations == 0U
                     && first_result.positive_parameter_samples == 0U
                     && second_result.positive_parameter_samples == 0U
                     && !first_result.candidate_root_created
                     && !second_result.candidate_root_created);
    checks.push_back(!first_result.scientific_handler_linked
                     && !second_result.scientific_handler_linked
                     && !first_result.authority_promoted
                     && !second_result.authority_promoted);

    std::size_t passed = 0U;
    for (const bool check : checks) if (check) ++passed;
    std::cout
        << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_p8f_parent_decomposition_fixture.v1\","
        << "\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL")
        << "\",\"checks_passed\":" << passed
        << ",\"checks_total\":" << checks.size()
        << ",\"parent_unchanged\":"
        << (same_ledger(before, after) ? "true" : "false")
        << ",\"deterministic\":"
        << (same_result(first_result, second_result)
            && same_output(first_output, second_output)
            && same_observation(first_observation, second_observation)
                ? "true" : "false")
        << ",\"candidate_evaluations\":0,"
        << "\"positive_parameter_samples\":0,"
        << "\"candidate_roots_created\":false,"
        << "\"scientific_handler_linked\":false,"
        << "\"authority_promoted\":false}\n";
    return passed == checks.size() ? 0 : 1;
}
