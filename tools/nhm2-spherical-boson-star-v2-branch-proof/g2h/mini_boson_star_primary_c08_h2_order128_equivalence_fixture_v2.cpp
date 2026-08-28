#include "mini_boson_star_primary_c08_convolution_jet_v1.hpp"
#include "mini_boson_star_primary_c08_identity_v1.hpp"
#include "mini_boson_star_primary_c08_margins_v1.hpp"
#include "mini_boson_star_primary_c08_scalar_ledger_provider_v1.hpp"

#include <arb.h>
#include <flint/fmpq.h>

#include <chrono>
#include <cstddef>
#include <iostream>
#include <vector>

namespace jet = nhm2::g2h_e_s5::primary_c08_convolution_jet_v1;
namespace identity = nhm2::g2h_e_s5::primary_c08_identity_v1;
namespace margins = nhm2::g2h_e_s5::primary_c08_margins_v1;
namespace scalar = nhm2::g2h_e_s5::primary_c08_scalar_ledger_provider_v1;
namespace history = nhm2::g2h_e_s5::primary_c08_finite_history_v1;

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
    ~Storage() { for (auto &value : values) arb_clear(&value); }
    std::vector<arb_struct> values;
};

void rational(arb_t value, long numerator, long denominator) {
    fmpq_t q;
    fmpq_init(q);
    fmpq_set_si(q, numerator, denominator);
    arb_set_fmpq(value, q, scalar::kPrecisionBits);
    fmpq_clear(q);
}

const history::TaggedLedgerView *find_ledger(
    const history::LedgerSetView &set, std::uint32_t wanted) {
    for (std::size_t index = 0U; index < set.ledger_count; ++index) {
        if (set.ledgers[index].identity == wanted) return set.ledgers + index;
    }
    return nullptr;
}

bool same_result(const jet::Result &left, const jet::Result &right) {
    return left.accepted == right.accepted && left.detail == right.detail
        && left.elementary_convolutions == right.elementary_convolutions
        && left.base_terms == right.base_terms
        && left.first_terms == right.first_terms
        && left.ordered_second_terms == right.ordered_second_terms
        && left.mixed_orientation_terms == right.mixed_orientation_terms
        && left.positive_remainder_cross_terms == right.positive_remainder_cross_terms
        && left.discarded_polynomial_terms == right.discarded_polynomial_terms
        && left.affine_composition_terms == right.affine_composition_terms
        && left.source_hull_terms == right.source_hull_terms
        && left.complete_ordered_13_jet_inventory == right.complete_ordered_13_jet_inventory
        && left.both_mixed_orientations_retained == right.both_mixed_orientations_retained
        && left.signed_remainder_cancellation_used == right.signed_remainder_cancellation_used
        && left.midpoint_selection_used == right.midpoint_selection_used
        && left.point_sampling_used == right.point_sampling_used
        && left.state_coefficients_read == right.state_coefficients_read
        && left.candidate_evaluations == right.candidate_evaluations
        && left.positive_parameter_samples == right.positive_parameter_samples
        && left.candidate_root_created == right.candidate_root_created
        && left.scientific_handler_linked == right.scientific_handler_linked
        && left.authority_promoted == right.authority_promoted;
}

bool same_output(const jet::Output &left, const jet::Output &right) {
    if (left.retained_order != right.retained_order
        || !arb_equal(left.target_center, right.target_center)
        || !arb_equal(left.target_half_width, right.target_half_width)
        || left.retained_xi_coefficients.size() != right.retained_xi_coefficients.size()
        || left.uniform_remainder_bounds.size() != right.uniform_remainder_bounds.size()) {
        return false;
    }
    for (std::size_t index = 0U; index < left.retained_xi_coefficients.size(); ++index)
        if (!arb_equal(left.retained_xi_coefficients.data() + index,
                       right.retained_xi_coefficients.data() + index)) return false;
    for (std::size_t index = 0U; index < left.uniform_remainder_bounds.size(); ++index)
        if (!arb_equal(left.uniform_remainder_bounds.data() + index,
                       right.uniform_remainder_bounds.data() + index)) return false;
    return true;
}

bool neutral(const jet::Result &result) {
    return result.state_coefficients_read == 0U
        && result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created && !result.scientific_handler_linked
        && !result.authority_promoted;
}

}  // namespace

int main() {
    Storage storage(514U);
    identity::InputIdentity input_identity{kGrowthHash, kJetHash, kGridHash,
        kAbiHash, identity::Chart::positive, 1U, 64L, storage.values.size(),
        storage.values.data()};
    Ball h0, kappa, mass, eta;
    arb_one(h0.value); rational(kappa.value, 1L, 2L);
    rational(mass.value, 1L, 4L); arb_indeterminate(eta.value);
    margins::Input margin_input{&input_identity, true, h0.value, kappa.value,
                                mass.value, eta.value};
    scalar::Input scalar_input{{{margin_input}}, {10U, 20U, 30U, 40U}};
    scalar::Context scalar_context;
    scalar::Result scalar_result{};
    if (!scalar::initialize(scalar_input, &scalar_context, &scalar_result)) return 2;
    const auto ledgers = scalar::published(scalar_context);
    const auto *b = find_ledger(ledgers, 10U);
    const auto *v = find_ledger(ledgers, 20U);
    if (b == nullptr || v == nullptr || b->ledger.model_count != 1U
        || v->ledger.model_count != 1U) return 3;
    const auto &target = b->ledger.models[0];
    Ball u_left, u_right;
    arb_zero(u_left.value); arb_one(u_right.value);
    jet::Input input{b->ledger, v->ledger, target.left_endpoint,
        target.right_endpoint, target.order, u_left.value, u_right.value,
        jet::kJetCount, target.coefficients};

    using Clock = std::chrono::steady_clock;
    jet::Output oracle_output;
    jet::Result oracle_result{};
    const auto oracle_start = Clock::now();
    const bool oracle_accepted = jet::evaluate(input, &oracle_output, &oracle_result);
    const auto oracle_end = Clock::now();
    jet::Output prepared_output;
    jet::Result prepared_result{};
    const auto prepared_start = Clock::now();
    const bool prepared_accepted = jet::evaluate_prepared(
        input, &prepared_output, &prepared_result);
    const auto prepared_end = Clock::now();
    const auto oracle_ms = std::chrono::duration_cast<std::chrono::milliseconds>(
        oracle_end - oracle_start).count();
    const auto prepared_ms = std::chrono::duration_cast<std::chrono::milliseconds>(
        prepared_end - prepared_start).count();

    const bool equivalent = oracle_accepted && prepared_accepted
        && same_result(oracle_result, prepared_result)
        && same_output(oracle_output, prepared_output)
        && neutral(oracle_result) && neutral(prepared_result)
        && oracle_result.elementary_convolutions == jet::kElementaryConvolutions;
    std::cout
        << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_order128_equivalence.v2\""
        << ",\"status\":\"" << (equivalent ? "PASS" : "FAIL") << "\""
        << ",\"arb_equal_all_outputs\":" << (equivalent ? "true" : "false")
        << ",\"results_equal\":" << (same_result(oracle_result, prepared_result) ? "true" : "false")
        << ",\"oracle_milliseconds\":" << oracle_ms
        << ",\"prepared_milliseconds\":" << prepared_ms
        << ",\"elementary_convolutions\":" << prepared_result.elementary_convolutions
        << ",\"candidate_evaluations\":0,\"positive_parameter_samples\":0"
        << ",\"candidate_roots_created\":false,\"scientific_handler_linked\":false"
        << ",\"authority_promoted\":false}\n";
    return equivalent ? 0 : 1;
}
