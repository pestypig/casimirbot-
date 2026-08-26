#include "mini_boson_star_primary_c08_successor_panel_v1.hpp"

#include <arb.h>
#include <flint/fmpq.h>

#include <array>
#include <cstddef>
#include <cstdint>
#include <iostream>
#include <vector>

namespace successor =
    nhm2::g2h_e_s5::primary_c08_successor_panel_v1;
namespace panel = successor::panel;
namespace picard = successor::picard;
namespace origin = successor::origin;
namespace margins = nhm2::g2h_e_s5::primary_c08_margins_v1;
namespace identity = nhm2::g2h_e_s5::primary_c08_identity_v1;

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

struct StateBoxes {
    std::array<arb_struct, successor::kLeftStateBoxCount> values;
    StateBoxes() { for (auto &value : values) arb_init(&value); }
    ~StateBoxes() { for (auto &value : values) arb_clear(&value); }
    arb_ptr at(std::size_t state, std::size_t jet) {
        return values.data() + state * successor::kJetCount + jet;
    }
};

void rational(arb_t value, long numerator, long denominator) {
    fmpq_t q;
    fmpq_init(q);
    fmpq_set_si(q, numerator, denominator);
    arb_set_fmpq(value, q, successor::kPrecisionBits);
    fmpq_clear(q);
}

identity::InputIdentity make_identity(Storage &storage) {
    return {kGrowthHash, kJetHash, kGridHash, kAbiHash,
            identity::Chart::positive, 1U, 64L,
            storage.values.size(), storage.values.data()};
}

void endpoint_boxes(StateBoxes &boxes, const panel::Output &polynomial,
                    const picard::Output &enclosure) {
    arb_t value, term;
    arb_init(value); arb_init(term);
    for (std::size_t state = 0U; state < successor::kStateCount; ++state) {
        for (std::size_t jet = 0U; jet < successor::kJetCount; ++jet) {
            arb_zero(value);
            for (std::size_t offset = polynomial.generated_order + 1U;
                 offset > 0U; --offset) {
                arb_mul(term, value, polynomial.panel_width,
                        successor::kPrecisionBits);
                arb_add(value, term,
                        polynomial.at(offset - 1U, state, jet),
                        successor::kPrecisionBits);
            }
            arb_add(boxes.at(state, jet), value,
                    enclosure.remainder(state, jet),
                    successor::kPrecisionBits);
        }
    }
    arb_clear(term); arb_clear(value);
}

bool all_finite(const successor::Output &output) {
    for (unsigned degree = 0U; degree <= output.polynomial.generated_order;
         ++degree)
        for (std::size_t state = 0U; state < successor::kStateCount; ++state)
            for (std::size_t jet = 0U; jet < successor::kJetCount; ++jet)
                if (!arb_is_finite(output.polynomial.at(degree, state, jet)))
                    return false;
    for (std::size_t state = 0U; state < successor::kStateCount; ++state)
        for (std::size_t jet = 0U; jet < successor::kJetCount; ++jet)
            if (!arb_is_finite(output.enclosure.remainder(state, jet)))
                return false;
    return true;
}

bool neutral(const successor::Result &result) {
    return result.candidate_evaluations == 0U
        && result.positive_parameter_samples == 0U
        && !result.candidate_root_created
        && !result.scientific_handler_linked
        && !result.authority_promoted;
}

}  // namespace

int main() {
    std::vector<bool> checks;
    Storage storage(514U);
    auto input_identity = make_identity(storage);
    Ball h0, kappa, mass, eta, first_target, successor_target;
    arb_one(h0.value);
    rational(kappa.value, 1L, 2L);
    rational(mass.value, 1L, 4L);
    arb_indeterminate(eta.value);
    rational(first_target.value, 1L, 64L);
    rational(successor_target.value, 1L, 32L);
    margins::Input margin_input{&input_identity, true, h0.value, kappa.value,
                                mass.value, eta.value};
    successor::origin::Input parameter_origin{{margin_input}};

    origin::Output origin_output;
    origin::Result origin_result{};
    const bool origin_accepted = origin::evaluate(parameter_origin,
                                                   &origin_output,
                                                   &origin_result);
    StateBoxes origin_boxes;
    const std::array<origin::TailKind, successor::kStateCount> origin_kinds = {
        origin::TailKind::B, origin::TailKind::V,
        origin::TailKind::J1, origin::TailKind::J2};
    for (std::size_t state = 0U; state < successor::kStateCount; ++state)
        for (std::size_t jet = 0U; jet < successor::kJetCount; ++jet)
            arb_set(origin_boxes.at(state, jet),
                    origin_output.enclosed_values[jet]
                        + static_cast<std::size_t>(origin_kinds[state]));
    successor::Input first_input{parameter_origin, origin_output.t0,
                                 origin_boxes.values.size(),
                                 origin_boxes.values.data(),
                                 first_target.value};
    successor::Output first_output;
    successor::Result first_result{};
    const bool first_accepted = successor::evaluate(first_input, &first_output,
                                                     &first_result);
    checks.push_back(origin_accepted && first_accepted
                     && origin_result.accepted && first_result.accepted);

    StateBoxes left_boxes;
    endpoint_boxes(left_boxes, first_output.polynomial,
                   first_output.enclosure);
    successor::Input second_input{parameter_origin,
                                  first_output.polynomial.right_endpoint,
                                  left_boxes.values.size(),
                                  left_boxes.values.data(),
                                  successor_target.value};
    successor::Output second_output;
    successor::Result second_result{};
    const bool second_accepted = successor::evaluate(
        second_input, &second_output, &second_result);
    checks.push_back(second_accepted && second_result.accepted
                     && second_result.detail == successor::FailureDetail::none);
    checks.push_back(!arb_equal(first_output.polynomial.right_endpoint,
                                first_output.polynomial.left_endpoint)
                     && arb_equal(second_output.polynomial.left_endpoint,
                                  first_output.polynomial.right_endpoint)
                     && arb_lt(second_output.polynomial.left_endpoint,
                               second_output.polynomial.right_endpoint));
    checks.push_back(second_result.left_state_boxes_admitted == 52U
                     && second_result.left_state_boxes_replayed == 52U
                     && second_result.arbitrary_left_endpoint_used);
    bool p0_equal = true;
    for (std::size_t state = 0U; state < successor::kStateCount; ++state)
        for (std::size_t jet = 0U; jet < successor::kJetCount; ++jet)
            p0_equal = p0_equal
                && arb_equal(second_output.polynomial.at(0U, state, jet),
                             left_boxes.at(state, jet));
    checks.push_back(p0_equal);
    checks.push_back(second_result.first_passing_order_used
                     && second_result.first_passing_inflation_used
                     && second_result.exact_power_series_algebra_used
                     && second_result.complete_interval_picard_used
                     && !second_result.midpoint_acceptance_used
                     && !second_result.signed_cancellation_used);
    // Halvings 0..4 exhaust all seven fixed orders; halving 5 accepts the
    // first fixed order. This directly guards continue-on-failure chronology.
    checks.push_back(second_result.accepted_order == 24U
                     && second_result.accepted_panel_halvings == 5U
                     && second_result.order_attempts == 36U
                     && second_result.panel_halving_attempts == 6U
                     && second_result.inflation_attempts > 0U);
    checks.push_back(second_output.polynomial.generated_order
                         == second_result.accepted_order
                     && second_output.enclosure.accepted_order
                         == second_result.accepted_order
                     && second_output.enclosure.accepted_panel_halvings
                         == second_result.accepted_panel_halvings
                     && all_finite(second_output));
    checks.push_back(neutral(second_result));

    StateBoxes third_left;
    endpoint_boxes(third_left, second_output.polynomial,
                   second_output.enclosure);
    successor::Input third_input{parameter_origin,
                                 second_output.polynomial.right_endpoint,
                                 third_left.values.size(),
                                 third_left.values.data(),
                                 successor_target.value};
    successor::Output third_output;
    successor::Result third_result{};
    checks.push_back(successor::evaluate(third_input, &third_output,
                                         &third_result)
                     && third_result.accepted
                     && arb_equal(third_output.polynomial.left_endpoint,
                                  second_output.polynomial.right_endpoint)
                     && neutral(third_result));

    auto wrong_count = second_input;
    wrong_count.left_state_box_count = 51U;
    successor::Result wrong_count_result{};
    checks.push_back(!successor::evaluate(wrong_count, &second_output,
                                          &wrong_count_result)
                     && !wrong_count_result.accepted);

    auto nonfinite = second_input;
    arb_indeterminate(left_boxes.at(0U, 0U));
    successor::Result nonfinite_result{};
    checks.push_back(!successor::evaluate(nonfinite, &second_output,
                                          &nonfinite_result)
                     && nonfinite_result.detail
                            == successor::FailureDetail::left_state_nonfinite);
    endpoint_boxes(left_boxes, first_output.polynomial,
                   first_output.enclosure);

    auto invalid_left = second_input;
    invalid_left.left_endpoint = successor_target.value;
    successor::Result invalid_left_result{};
    checks.push_back(!successor::evaluate(invalid_left, &second_output,
                                          &invalid_left_result));

    auto blocked_predecessor = second_input;
    blocked_predecessor.parameter_origin.gevrey.margins
        .predecessor_c08_003_passed = false;
    successor::Result blocked_predecessor_result{};
    checks.push_back(!successor::evaluate(blocked_predecessor, &second_output,
                                          &blocked_predecessor_result)
                     && blocked_predecessor_result.detail
                            == successor::FailureDetail::predecessor_or_input);

    successor::Result null_output_result{};
    checks.push_back(!successor::evaluate(second_input, nullptr,
                                          &null_output_result));
    checks.push_back(!successor::evaluate(second_input, &second_output,
                                          nullptr));

    successor::Output deterministic_a;
    successor::Output deterministic_b;
    successor::Result deterministic_result_a{};
    successor::Result deterministic_result_b{};
    const bool deterministic_accept_a = successor::evaluate(
        second_input, &deterministic_a, &deterministic_result_a);
    const bool deterministic_accept_b = successor::evaluate(
        second_input, &deterministic_b, &deterministic_result_b);
    checks.push_back(deterministic_accept_a && deterministic_accept_b
                     && arb_equal(deterministic_a.polynomial.right_endpoint,
                                  deterministic_b.polynomial.right_endpoint)
                     && arb_equal(deterministic_a.polynomial.at(24U, 0U, 0U),
                                  deterministic_b.polynomial.at(24U, 0U, 0U))
                     && arb_equal(deterministic_a.enclosure.remainder(0U, 0U),
                                  deterministic_b.enclosure.remainder(0U, 0U)));

    std::size_t passed = 0U;
    for (const bool check : checks) passed += check ? 1U : 0U;
    std::cout << "{\"schema\":\"nhm2.g2h_e_s5.c08_successor_panel_fixture.v1\""
              << ",\"status\":\""
              << (passed == checks.size() ? "PASS" : "FAIL") << "\""
              << ",\"checks_passed\":" << passed
              << ",\"checks_total\":" << checks.size()
              << ",\"accepted_order\":" << deterministic_result_a.accepted_order
              << ",\"accepted_halvings\":"
              << deterministic_result_a.accepted_panel_halvings
              << ",\"accepted_inflation\":"
              << deterministic_result_a.accepted_inflation_exponent
              << ",\"left_state_boxes\":"
              << deterministic_result_a.left_state_boxes_replayed
              << ",\"candidate_evaluations\":0"
              << ",\"positive_parameter_samples\":0"
              << ",\"candidate_roots_created\":false"
              << ",\"scientific_handler_linked\":false"
              << ",\"authority_promoted\":false}\n";
    return passed == checks.size() ? 0 : 1;
}
