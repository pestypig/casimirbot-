#include "mini_boson_star_primary_c08_h2_ledger_v1.hpp"
#include "mini_boson_star_primary_c08_scalar_ledger_provider_v1.hpp"

#include "mini_boson_star_primary_c08_identity_v1.hpp"
#include "mini_boson_star_primary_c08_margins_v1.hpp"

#include <arb.h>
#include <flint/fmpq.h>

#include <cstddef>
#include <array>
#include <iostream>
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

bool same_model(const h2::ledger::ModelView &a,
                const h2::ledger::ModelView &b) {
    if (a.kind != b.kind || a.order != b.order
        || a.coefficient_count != b.coefficient_count
        || a.remainder_count != b.remainder_count
        || !arb_equal(a.left_endpoint, b.left_endpoint)
        || !arb_equal(a.right_endpoint, b.right_endpoint)
        || !arb_equal(a.expansion_center, b.expansion_center))
        return false;
    for (std::size_t i = 0U; i < a.coefficient_count; ++i)
        if (!arb_equal(a.coefficients + i, b.coefficients + i)) return false;
    for (std::size_t i = 0U; i < a.remainder_count; ++i)
        if (!arb_equal(a.remainders + i, b.remainders + i)) return false;
    return true;
}

int emit_early_failure(const std::vector<bool> &checks, const char *phase,
                       const h2::Result *result = nullptr) {
    std::size_t passed = 0U;
    for (const bool check : checks) passed += check ? 1U : 0U;
    std::cout << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_ledger_fixture.v1\""
              << ",\"status\":\"FAIL\",\"phase\":\"" << phase << "\""
              << ",\"checks_passed\":" << passed
              << ",\"checks_total\":" << checks.size();
    if (result != nullptr) {
        std::cout << ",\"detail\":\""
                  << h2::failure_detail_name(result->detail) << "\""
                  << ",\"selector_calls\":" << result->selector_calls
                  << ",\"selector_candidates\":"
                  << result->selector_refinement_candidates_visited
                  << ",\"selector_subpanels\":"
                  << result->selector_subpanels_accumulated
                  << ",\"selector_jet_calls\":"
                  << result->selector_jet_predecessor_calls
                  << ",\"selector_elementary_convolutions\":"
                  << result->selector_elementary_convolutions
                  << ",\"selector_width_checks\":"
                  << result->selector_numerical_width_checks;
    }
    std::cout << ",\"candidate_evaluations\":0"
              << ",\"positive_parameter_samples\":0"
              << ",\"candidate_roots_created\":false"
              << ",\"scientific_handler_linked\":false"
              << ",\"authority_promoted\":false}\n";
    return 1;
}

}  // namespace

int main() {
    std::vector<bool> checks;
    Storage storage(514U);
    auto input_identity = make_identity(storage);
    Ball h0, kappa, mass, eta, target, terminal_target, zero, one;
    arb_one(h0.value); rational(kappa.value, 1L, 2L);
    rational(mass.value, 1L, 4L); arb_indeterminate(eta.value);
    arb_zero(zero.value); arb_one(one.value);
    auto scalar_input = make_scalar_input(input_identity, h0, kappa, mass, eta);

    scalar::Context scalar_context;
    scalar::Result scalar_initial{};
    const bool scalar_initialized = scalar::initialize(
        scalar_input, &scalar_context, &scalar_initial);
    checks.push_back(scalar_initialized);
    if (!scalar_initialized) return emit_early_failure(checks, "scalar_initialize");
    auto h2_initial_input = make_h2_input(scalar_context);
    h2::Context h2_context;
    h2::Result h2_initial{};
    const bool h2_initialized = h2::initialize(
        h2_initial_input, &h2_context, &h2_initial);
    checks.push_back(h2_initialized && h2_initial.accepted
                     && h2_initial.models_appended == 1U
                     && h2_initial.selector_thread_count
                        == h2::kSelectorThreadCount
                     && h2_initial.h2_c08_010_passed
                     && h2_initial.exact_h2_orientation
                     && h2_initial.centered_to_left_exact_binomial
                     && neutral(h2_initial));
    if (!h2_initialized)
        return emit_early_failure(checks, "h2_initialize", &h2_initial);
    const auto h2_before = h2::published(h2_context);
    checks.push_back(h2_before.model_count == 1U
                     && h2_before.models[0].kind == h2::ledger::ModelKind::origin
                     && h2_before.models[0].order == 128U
                     && arb_is_zero(h2_before.models[0].left_endpoint)
                     && arb_is_zero(h2_before.models[0].expansion_center)
                     && arb_contains(h2_before.models[0].coefficients,
                                     one.value));

    arb_mul_ui(target.value, scalar::right_endpoint(scalar_context), 129U,
               h2::kPrecisionBits);
    arb_div_ui(target.value, target.value, 128U, h2::kPrecisionBits);
    scalar::Result scalar_extension{};
    const bool scalar_extended = scalar::extend_to(
        &scalar_context, target.value, &scalar_extension);
    checks.push_back(scalar_extended
                     && scalar_extension.panels_appended == 1U);
    if (!scalar_extended) return emit_early_failure(checks, "scalar_extend");
    auto h2_after_input = make_h2_input(scalar_context);
    h2::Result h2_extension{};
    const bool h2_extended = h2::extend(
        h2_after_input, &h2_context, &h2_extension);
    checks.push_back(h2_extended && h2_extension.accepted
                     && h2_extension.models_appended == 1U
                     && h2_extension.selector_thread_count
                        == h2::kSelectorThreadCount
                     && h2_extension.source_prefix_digests_checked == 4U
                     && h2_extension.h2_c08_010_passed
                     && neutral(h2_extension));
    if (!h2_extended)
        return emit_early_failure(checks, "h2_extend", &h2_extension);
    const auto h2_after = h2::published(h2_context);
    checks.push_back(h2_after.model_count == 2U
                     && h2_before.model_count == 1U
                     && same_model(h2_before.models[0], h2_after.models[0])
                     && h2_after.models[1].kind
                        == h2::ledger::ModelKind::positive_panel
                     && arb_equal(h2_after.models[0].right_endpoint,
                                  h2_after.models[1].left_endpoint)
                     && arb_equal(h2_after.models[1].expansion_center,
                                  h2_after.models[1].left_endpoint));
    h2::ledger::Output ledger_output;
    h2::ledger::Result ledger_result{};
    h2::ledger::Input ledger_input{h2_after, zero.value, target.value,
                                    zero.value, one.value};
    checks.push_back(h2::ledger::evaluate(ledger_input, &ledger_output,
                                          &ledger_result)
                     && ledger_result.accepted
                     && ledger_result.models_validated == 2U);

    h2::Result no_op_result{};
    checks.push_back(h2::extend(h2_after_input, &h2_context, &no_op_result)
                     && no_op_result.accepted
                     && no_op_result.models_appended == 0U
                     && no_op_result.source_prefix_digests_checked == 8U);

    // Existing-source mutation must fail prefix admission without changing H2.
    arb_t saved_prefix;
    arb_init(saved_prefix);
    arb_ptr mutable_prefix = const_cast<arb_ptr>(
        h2_after_input.scalar_ledgers.ledgers[0].ledger.models[0].coefficients);
    arb_set(saved_prefix, mutable_prefix);
    arb_add_ui(mutable_prefix, mutable_prefix, 1U, h2::kPrecisionBits);
    h2::Result prefix_result{};
    checks.push_back(!h2::extend(h2_after_input, &h2_context, &prefix_result)
                     && prefix_result.detail
                        == h2::FailureDetail::scalar_inventory_or_prefix
                     && h2::published(h2_context).model_count == 2U);
    arb_set(mutable_prefix, saved_prefix);
    arb_clear(saved_prefix);

    // Every supplied scalar source, including the two not used as H2
    // convolution operands, is part of the coherent immutable prefix.
    arb_ptr mutable_j1_prefix = const_cast<arb_ptr>(
        h2_after_input.scalar_ledgers.ledgers[2].ledger.models[0].coefficients);
    arb_init(saved_prefix); arb_set(saved_prefix, mutable_j1_prefix);
    arb_add_ui(mutable_j1_prefix, mutable_j1_prefix, 1U,
               h2::kPrecisionBits);
    h2::Result j1_prefix_result{};
    checks.push_back(!h2::extend(h2_after_input, &h2_context,
                                 &j1_prefix_result)
                     && j1_prefix_result.detail
                        == h2::FailureDetail::scalar_inventory_or_prefix
                     && h2::published(h2_context).model_count == 2U);
    arb_set(mutable_j1_prefix, saved_prefix); arb_clear(saved_prefix);

    // Full-ledger validation rejects a malformed non-operand J2 source before
    // selector work or H2 publication.
    arb_ptr mutable_j2_remainder = const_cast<arb_ptr>(
        h2_initial_input.scalar_ledgers.ledgers[3].ledger.models[0].remainders);
    arb_t saved_j2_remainder;
    arb_init(saved_j2_remainder);
    arb_set(saved_j2_remainder, mutable_j2_remainder);
    arb_indeterminate(mutable_j2_remainder);
    h2::Context malformed_j2_context;
    h2::Result malformed_j2_result{};
    checks.push_back(!h2::initialize(h2_initial_input, &malformed_j2_context,
                                     &malformed_j2_result)
                     && malformed_j2_result.detail
                        == h2::FailureDetail::scalar_inventory_or_prefix);
    arb_set(mutable_j2_remainder, saved_j2_remainder);
    arb_clear(saved_j2_remainder);

    h2::Context duplicate_context;
    auto duplicate_input = h2_initial_input;
    duplicate_input.scalar_ledger_identities = {10U, 10U, 30U, 40U};
    h2::Result duplicate_result{};
    checks.push_back(!h2::initialize(duplicate_input, &duplicate_context,
                                     &duplicate_result));
    std::array<h2::finite::TaggedLedgerView, h2::kScalarStateCount>
        duplicate_tags{};
    for (std::size_t i = 0U; i < duplicate_tags.size(); ++i)
        duplicate_tags[i] = h2_initial_input.scalar_ledgers.ledgers[i];
    duplicate_tags[3].identity = duplicate_tags[2].identity;
    auto duplicate_tag_input = h2_initial_input;
    duplicate_tag_input.scalar_ledgers = {duplicate_tags.size(),
                                          duplicate_tags.data()};
    h2::Context duplicate_tag_context;
    h2::Result duplicate_tag_result{};
    checks.push_back(!h2::initialize(duplicate_tag_input,
                                     &duplicate_tag_context,
                                     &duplicate_tag_result)
                     && duplicate_tag_result.detail
                        == h2::FailureDetail::scalar_inventory_or_prefix);
    h2::Result null_context_result{};
    checks.push_back(!h2::initialize(h2_initial_input, nullptr,
                                     &null_context_result));
    checks.push_back(!h2::initialize(h2_initial_input, &duplicate_context,
                                     nullptr));

    // Add one further manufactured scalar panel without extending H2. A
    // nonfinite V remainder on that new ordinal reaches C08-010, becomes
    // terminal on the already admitted H2 prefix, and cannot be retried after
    // the manufactured source is restored. This avoids recomputing the exact
    // same order-128 origin convolution solely for the corruption fixture.
    arb_mul_ui(terminal_target.value, target.value, 129U,
               h2::kPrecisionBits);
    arb_div_ui(terminal_target.value, terminal_target.value, 128U,
               h2::kPrecisionBits);
    scalar::Result terminal_scalar_extension{};
    checks.push_back(scalar::extend_to(&scalar_context, terminal_target.value,
                                       &terminal_scalar_extension)
                     && terminal_scalar_extension.panels_appended == 1U);
    auto h2_terminal_input = make_h2_input(scalar_context);
    arb_ptr mutable_new_remainder = const_cast<arb_ptr>(
        h2_terminal_input.scalar_ledgers.ledgers[1].ledger.models[2].remainders);
    arb_t saved_remainder;
    arb_init(saved_remainder); arb_set(saved_remainder, mutable_new_remainder);
    arb_indeterminate(mutable_new_remainder);
    h2::Result terminal_result{};
    checks.push_back(!h2::extend(h2_terminal_input, &h2_context,
                                 &terminal_result)
                     && terminal_result.detail
                        == h2::FailureDetail::c08_010_selector
                     && terminal_result.first_failure_terminal);
    arb_set(mutable_new_remainder, saved_remainder); arb_clear(saved_remainder);
    h2::Result terminal_replay{};
    checks.push_back(!h2::extend(h2_terminal_input, &h2_context,
                                 &terminal_replay)
                     && terminal_replay.detail
                        == h2::FailureDetail::terminal_failure_already_recorded
                     && terminal_replay.first_failure_terminal);
    const auto terminal_published = h2::published(h2_context);
    checks.push_back(terminal_published.model_count == h2_after.model_count
                     && same_model(terminal_published.models[0],
                                   h2_after.models[0])
                     && same_model(terminal_published.models[1],
                                   h2_after.models[1])
                     && terminal_result.selector_calls == 1U
                     && neutral(terminal_result));

    std::size_t passed = 0U;
    for (const bool check : checks) passed += check ? 1U : 0U;
    std::cout << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_ledger_fixture.v1\""
              << ",\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL") << "\""
              << ",\"checks_passed\":" << passed
              << ",\"checks_total\":" << checks.size()
              << ",\"h2_models\":" << h2_after.model_count
              << ",\"origin_order\":" << h2_after.models[0].order
              << ",\"positive_order\":" << h2_after.models[1].order
              << ",\"origin_u_panels\":" << h2_initial.selector_u_panels_total
              << ",\"positive_u_panels\":" << h2_extension.selector_u_panels_total
              << ",\"origin_selector_candidates\":"
              << h2_initial.selector_refinement_candidates_visited
              << ",\"origin_selector_subpanels\":"
              << h2_initial.selector_subpanels_accumulated
              << ",\"positive_selector_candidates\":"
              << h2_extension.selector_refinement_candidates_visited
              << ",\"positive_selector_subpanels\":"
              << h2_extension.selector_subpanels_accumulated
              << ",\"h2_c08_010_passed\":"
              << (passed == checks.size() ? "true" : "false")
              << ",\"candidate_evaluations\":0,\"positive_parameter_samples\":0"
              << ",\"candidate_roots_created\":false"
              << ",\"scientific_handler_linked\":false"
              << ",\"authority_promoted\":false}\n";
    return passed == checks.size() ? 0 : 1;
}
