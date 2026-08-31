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

bool neutral(const h2::Result &result) {
    return result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created
        && !result.scientific_handler_linked
        && !result.authority_promoted;
}

bool same_result(const h2::Result &left, const h2::Result &right) {
    return left.accepted == right.accepted && left.detail == right.detail
        && left.source_models_before == right.source_models_before
        && left.source_models_after == right.source_models_after
        && left.h2_models_before == right.h2_models_before
        && left.h2_models_after == right.h2_models_after
        && left.models_appended == right.models_appended
        && left.selector_calls == right.selector_calls
        && left.selector_thread_count == right.selector_thread_count
        && left.selector_u_panels_total == right.selector_u_panels_total
        && left.selector_refinement_candidates_visited
            == right.selector_refinement_candidates_visited
        && left.selector_subpanels_accumulated
            == right.selector_subpanels_accumulated
        && left.selector_jet_predecessor_calls
            == right.selector_jet_predecessor_calls
        && left.selector_elementary_convolutions
            == right.selector_elementary_convolutions
        && left.selector_numerical_width_checks
            == right.selector_numerical_width_checks
        && left.translated_coefficient_terms
            == right.translated_coefficient_terms
        && left.source_prefix_digests_checked
            == right.source_prefix_digests_checked
        && left.exact_h2_orientation == right.exact_h2_orientation
        && left.boundary_applied_once_per_selector
            == right.boundary_applied_once_per_selector
        && left.centered_to_left_exact_binomial
            == right.centered_to_left_exact_binomial
        && left.stable_prior_publication == right.stable_prior_publication
        && left.first_failure_terminal == right.first_failure_terminal
        && left.retry_or_retune_used == right.retry_or_retune_used
        && left.signed_remainder_cancellation_used
            == right.signed_remainder_cancellation_used
        && left.midpoint_selection_used == right.midpoint_selection_used
        && left.point_sampling_used == right.point_sampling_used
        && left.h2_c08_010_passed == right.h2_c08_010_passed
        && left.candidate_evaluations == right.candidate_evaluations
        && left.positive_parameter_samples == right.positive_parameter_samples
        && left.candidate_root_created == right.candidate_root_created
        && left.scientific_handler_linked == right.scientific_handler_linked
        && left.authority_promoted == right.authority_promoted;
}

bool same_model(const h2::ledger::ModelView &left,
                const h2::ledger::ModelView &right) {
    if (left.ordinal != right.ordinal || left.kind != right.kind
        || left.order != right.order
        || left.coefficient_count != right.coefficient_count
        || left.remainder_count != right.remainder_count
        || !arb_equal(left.left_endpoint, right.left_endpoint)
        || !arb_equal(left.right_endpoint, right.right_endpoint)
        || !arb_equal(left.expansion_center, right.expansion_center))
        return false;
    for (std::size_t index = 0U; index < left.coefficient_count; ++index)
        if (!arb_equal(left.coefficients + index,
                       right.coefficients + index)) return false;
    for (std::size_t index = 0U; index < left.remainder_count; ++index)
        if (!arb_equal(left.remainders + index,
                       right.remainders + index)) return false;
    return true;
}

}  // namespace

int main() {
    std::vector<bool> checks;
    Storage storage(514U);
    auto input_identity = make_identity(storage);
    Ball h0, kappa, mass, eta;
    arb_one(h0.value); rational(kappa.value, 1L, 2L);
    rational(mass.value, 1L, 4L); arb_indeterminate(eta.value);
    auto scalar_input = make_scalar_input(input_identity, h0, kappa, mass, eta);
    scalar::Context scalar_context;
    scalar::Result scalar_result{};
    checks.push_back(scalar::initialize(scalar_input, &scalar_context,
                                        &scalar_result));
    auto input = make_h2_input(scalar_context);

    h2::Context ordinary_context;
    h2::Context diagnostic_context;
    h2::Result ordinary_result{};
    h2::Result diagnostic_result{};
    h2::ParentDiagnostics diagnostics;
    const bool ordinary = h2::initialize(input, &ordinary_context,
                                          &ordinary_result);
    const bool diagnostic = h2::initialize_diagnostic(
        input, &diagnostic_context, &diagnostic_result, &diagnostics);
    checks.push_back(ordinary && diagnostic && ordinary_result.accepted
                     && diagnostic_result.accepted);
    checks.push_back(same_result(ordinary_result, diagnostic_result));
    const auto ordinary_models = h2::published(ordinary_context);
    const auto diagnostic_models = h2::published(diagnostic_context);
    checks.push_back(ordinary_models.model_count == 1U
                     && diagnostic_models.model_count == 1U
                     && same_model(ordinary_models.models[0],
                                   diagnostic_models.models[0]));
    checks.push_back(diagnostics.present && diagnostics.source_ordinal == 0U
                     && diagnostics.selector_call_ordinal == 1U
                     && diagnostics.selector_passed
                     && diagnostics.selector_detail
                        == h2::selector::FailureDetail::none);
    checks.push_back(diagnostics.width.observations == 1U
                     && diagnostics.width.candidates[0U].evaluated
                     && diagnostics.width.candidates[0U].passed
                     && diagnostics.width.candidates[0U].panel_count == 1U
                     && !diagnostics.width.all_observed_candidates_failed);
    checks.push_back(diagnostics.observation_only
                     && diagnostics.parent_decision_unchanged
                     && diagnostics.persistence_bounded
                     && diagnostics.width.fixed_candidate_schedule
                     && diagnostics.width.thresholds_unchanged
                     && diagnostics.width.reduction_order_unchanged);

    std::string canonical_a;
    std::string canonical_b;
    checks.push_back(h2::serialize_diagnostics(diagnostics, &canonical_a)
                     && h2::serialize_diagnostics(diagnostics, &canonical_b)
                     && canonical_a == canonical_b);
    checks.push_back(!canonical_a.empty()
                     && canonical_a.size()
                        <= h2::kMaximumDiagnosticRecordBytes
                     && canonical_a.front() == '{'
                     && canonical_a.back() == '}'
                     && canonical_a.find('\n') == std::string::npos);
    checks.push_back(
        canonical_a.find("nhm2.g2h_e_s5.c08_h2_p8b_parent_diagnostic.v1")
            != std::string::npos
        && canonical_a.find("\"selector_passed\":true")
            != std::string::npos
        && canonical_a.find("\"source_ordinal\":0")
            != std::string::npos);

    auto invalid = diagnostics;
    invalid.width.observations = h2::selector::kUPanelCandidateCount + 1U;
    std::string rejected;
    checks.push_back(!h2::serialize_diagnostics(invalid, &rejected)
                     && rejected.empty());
    h2::Context null_diagnostic_context;
    h2::Result null_diagnostic_result{};
    checks.push_back(!h2::initialize_diagnostic(
        input, &null_diagnostic_context, &null_diagnostic_result, nullptr)
        && null_diagnostic_result.detail == h2::FailureDetail::input_or_output);
    checks.push_back(neutral(ordinary_result) && neutral(diagnostic_result)
                     && neutral(null_diagnostic_result));

    std::size_t passed = 0U;
    for (const bool check : checks) if (check) ++passed;
    std::cout << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_p8b_parent_diagnostic_fixture.v1\","
              << "\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL")
              << "\",\"checks_passed\":" << passed
              << ",\"checks_total\":" << checks.size()
              << ",\"ordinary_diagnostic_equal\":"
              << (same_result(ordinary_result, diagnostic_result)
                  && ordinary_models.model_count == diagnostic_models.model_count
                  && ordinary_models.model_count == 1U
                  && same_model(ordinary_models.models[0],
                                diagnostic_models.models[0]) ? "true" : "false")
              << ",\"canonical_bytes\":" << canonical_a.size()
              << ",\"selector_observations\":"
              << diagnostics.width.observations
              << ",\"candidate_evaluations\":0,"
              << "\"positive_parameter_samples\":0,"
              << "\"candidate_roots_created\":false,"
              << "\"scientific_handler_linked\":false,"
              << "\"authority_promoted\":false}\n";
    return passed == checks.size() ? 0 : 1;
}
