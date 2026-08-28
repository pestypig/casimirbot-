#include "mini_boson_star_primary_c08_convolution_jet_v1.hpp"
#if defined(NHM2_H2_PARALLEL_SELECTOR_V3)
#include "mini_boson_star_primary_c08_convolution_selector_v1.hpp"
#endif
#include "mini_boson_star_primary_c08_identity_v1.hpp"
#include "mini_boson_star_primary_c08_margins_v1.hpp"
#include "mini_boson_star_primary_c08_scalar_ledger_provider_v1.hpp"

#include <arb.h>
#include <flint/fmpq.h>

#include <chrono>
#include <cstddef>
#include <cstdlib>
#include <iostream>
#include <limits>
#include <string>
#include <vector>

namespace jet = nhm2::g2h_e_s5::primary_c08_convolution_jet_v1;
#if defined(NHM2_H2_PARALLEL_SELECTOR_V3)
namespace selector =
    nhm2::g2h_e_s5::primary_c08_convolution_selector_v1;
#endif
namespace ledger = nhm2::g2h_e_s5::primary_c08_convolution_ledger_v1;
namespace identity = nhm2::g2h_e_s5::primary_c08_identity_v1;
namespace margins = nhm2::g2h_e_s5::primary_c08_margins_v1;
namespace scalar =
    nhm2::g2h_e_s5::primary_c08_scalar_ledger_provider_v1;
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
constexpr unsigned kMaximumExponent = 16U;
constexpr std::size_t kWorstCasePanels = 131071U;
constexpr std::size_t kWorstCaseElementaryConvolutions =
    kWorstCasePanels * jet::kElementaryConvolutions;

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
    arb_set_fmpq(value, q, scalar::kPrecisionBits);
    fmpq_clear(q);
}

identity::InputIdentity make_identity(Storage &storage) {
    return {kGrowthHash, kJetHash, kGridHash, kAbiHash,
            identity::Chart::positive, 1U, 64L,
            storage.values.size(), storage.values.data()};
}

scalar::Input make_scalar_input(identity::InputIdentity &input_identity,
                                Ball &h0, Ball &kappa, Ball &mass,
                                Ball &eta) {
    margins::Input margin_input{&input_identity, true, h0.value, kappa.value,
                                mass.value, eta.value};
    return {{{margin_input}}, {10U, 20U, 30U, 40U}};
}

const history::TaggedLedgerView *find_ledger(
    const history::LedgerSetView &set, std::uint32_t wanted) {
    for (std::size_t index = 0U; index < set.ledger_count; ++index) {
        if (set.ledgers[index].identity == wanted) return set.ledgers + index;
    }
    return nullptr;
}

bool parse_exponent(const char *text, unsigned *value) {
    if (text == nullptr || value == nullptr || *text == '\0') return false;
    char *end = nullptr;
    const unsigned long parsed = std::strtoul(text, &end, 10);
    if (end == text || *end != '\0' || parsed > kMaximumExponent) return false;
    *value = static_cast<unsigned>(parsed);
    return true;
}

#if defined(NHM2_H2_PARALLEL_SELECTOR_V3)
bool parse_threads(const char *text, std::size_t *value) {
    if (text == nullptr || value == nullptr || *text == '\0') return false;
    char *end = nullptr;
    const unsigned long parsed = std::strtoul(text, &end, 10);
    if (end == text || *end != '\0' || parsed == 0UL
        || parsed > selector::kMaximumParallelThreads) return false;
    *value = static_cast<std::size_t>(parsed);
    return true;
}

bool same_selector_output(const selector::Output &left,
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
        for (std::size_t component = 0U; component < jet::kJetCount;
             ++component) {
            if (!arb_equal(left.coefficient(degree, component),
                           right.coefficient(degree, component))
                || !arb_equal(left.coefficient_margin(degree, component),
                              right.coefficient_margin(degree, component)))
                return false;
        }
    }
    for (std::size_t component = 0U; component < jet::kJetCount;
         ++component) {
        if (!arb_equal(left.remainder(component), right.remainder(component))
            || !arb_equal(left.remainder_margin(component),
                          right.remainder_margin(component))) return false;
    }
    return true;
}

bool same_selector_result(const selector::Result &left,
                          const selector::Result &right) {
    return left.accepted == right.accepted && left.detail == right.detail
        && left.refinement_candidates_visited
            == right.refinement_candidates_visited
        && left.subpanels_accumulated == right.subpanels_accumulated
        && left.jet_predecessor_calls == right.jet_predecessor_calls
        && left.elementary_convolutions == right.elementary_convolutions
        && left.numerical_width_checks == right.numerical_width_checks
        && left.fixed_candidate_schedule == right.fixed_candidate_schedule
        && left.increasing_subpanel_order == right.increasing_subpanel_order
        && left.first_passing_candidate_selected
            == right.first_passing_candidate_selected
        && left.boundary_applied_once == right.boundary_applied_once
        && left.exhaustion_retuned == right.exhaustion_retuned
        && left.signed_remainder_cancellation_used
            == right.signed_remainder_cancellation_used
        && left.midpoint_selection_used == right.midpoint_selection_used
        && left.point_sampling_used == right.point_sampling_used
        && left.state_coefficients_read == right.state_coefficients_read
        && left.candidate_evaluations == right.candidate_evaluations
        && left.positive_parameter_samples == right.positive_parameter_samples
        && left.candidate_root_created == right.candidate_root_created
        && left.scientific_handler_linked == right.scientific_handler_linked
        && left.authority_promoted == right.authority_promoted;
}
#endif

void emit_description() {
    std::cout
        << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_timing_calibration.v1\""
        << ",\"status\":\"DESCRIPTION\""
        << ",\"precision_bits\":" << scalar::kPrecisionBits
        << ",\"order\":128,\"jet_count\":" << jet::kJetCount
        << ",\"elementary_convolutions_per_subpanel\":"
        << jet::kElementaryConvolutions
        << ",\"maximum_exponent\":" << kMaximumExponent
        << ",\"maximum_u_panels\":65536"
        << ",\"worst_case_cumulative_subpanels_per_selector\":"
        << kWorstCasePanels
        << ",\"worst_case_elementary_convolutions_per_selector\":"
        << kWorstCaseElementaryConvolutions
        << ",\"candidate_evaluations\":0"
        << ",\"positive_parameter_samples\":0"
        << ",\"candidate_roots_created\":false"
        << ",\"scientific_handler_linked\":false"
        << ",\"authority_promoted\":false}\n";
}

int emit_failure(const char *phase, unsigned exponent,
                 std::size_t completed_subpanels) {
    std::cout
        << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_timing_calibration.v1\""
        << ",\"status\":\"FAIL\",\"phase\":\"" << phase << "\""
        << ",\"exponent\":" << exponent
        << ",\"completed_subpanels\":" << completed_subpanels
        << ",\"candidate_evaluations\":0"
        << ",\"positive_parameter_samples\":0"
        << ",\"candidate_roots_created\":false"
        << ",\"scientific_handler_linked\":false"
        << ",\"authority_promoted\":false}\n";
    return 1;
}

}  // namespace

int main(int argc, char **argv) {
    if (argc == 2 && std::string(argv[1]) == "--describe") {
        emit_description();
        return 0;
    }
#if defined(NHM2_H2_PARALLEL_SELECTOR_V3)
    if (argc != 5 || std::string(argv[1]) != "--max-exponent"
        || std::string(argv[3]) != "--threads") {
        return emit_failure("arguments", 0U, 0U);
    }
#else
    if (argc != 3 || std::string(argv[1]) != "--max-exponent") {
        return emit_failure("arguments", 0U, 0U);
    }
#endif
    unsigned maximum_exponent = 0U;
    if (!parse_exponent(argv[2], &maximum_exponent)) {
        return emit_failure("arguments", 0U, 0U);
    }
#if defined(NHM2_H2_PARALLEL_SELECTOR_V3)
    std::size_t thread_count = 0U;
    if (!parse_threads(argv[4], &thread_count)) {
        return emit_failure("arguments", 0U, 0U);
    }
#endif

    Storage storage(514U);
    auto input_identity = make_identity(storage);
    Ball h0, kappa, mass, eta;
    arb_one(h0.value);
    rational(kappa.value, 1L, 2L);
    rational(mass.value, 1L, 4L);
    arb_indeterminate(eta.value);
    auto scalar_input = make_scalar_input(
        input_identity, h0, kappa, mass, eta);
    scalar::Context scalar_context;
    scalar::Result scalar_result{};
    if (!scalar::initialize(scalar_input, &scalar_context, &scalar_result)) {
        return emit_failure("scalar_initialize", 0U, 0U);
    }
    const auto ledgers = scalar::published(scalar_context);
    const auto *b = find_ledger(ledgers, 10U);
    const auto *v = find_ledger(ledgers, 20U);
    if (b == nullptr || v == nullptr || b->ledger.model_count != 1U
        || v->ledger.model_count != 1U) {
        return emit_failure("scalar_inventory", 0U, 0U);
    }
    const auto &target = b->ledger.models[0];
    if (target.order != 128U
        || target.coefficient_count < jet::kJetCount) {
        return emit_failure("origin_order_or_boundary", 0U, 0U);
    }

    using Clock = std::chrono::steady_clock;
    const auto calibration_start = Clock::now();
    std::size_t cumulative_subpanels = 0U;
    std::size_t cumulative_elementary = 0U;
    for (unsigned exponent = 0U; exponent <= maximum_exponent; ++exponent) {
        const std::size_t panel_count = std::size_t{1U} << exponent;
        std::size_t candidate_elementary = 0U;
#if defined(NHM2_H2_PARALLEL_SELECTOR_V3)
        selector::Input selector_input{b->ledger, v->ledger,
            target.left_endpoint, target.right_endpoint, target.order,
            jet::kJetCount, target.coefficients};
        selector::Output serial_output;
        selector::Result serial_result{};
        if (thread_count > 1U
            && !selector::evaluate_prepared_candidate(
                selector_input, panel_count, 1U, &serial_output,
                &serial_result)) {
            return emit_failure("serial_oracle", exponent,
                                cumulative_subpanels);
        }
        const auto candidate_start = Clock::now();
        selector::Output selector_output;
        selector::Result selector_result{};
        if (!selector::evaluate_prepared_candidate(
                selector_input, panel_count, thread_count, &selector_output,
                &selector_result)) {
            return emit_failure("parallel_candidate", exponent,
                                cumulative_subpanels);
        }
        if (thread_count > 1U
            && (!same_selector_output(serial_output, selector_output)
                || !same_selector_result(serial_result, selector_result))) {
            return emit_failure("parallel_equivalence", exponent,
                                cumulative_subpanels);
        }
        candidate_elementary = selector_result.elementary_convolutions;
        cumulative_subpanels += selector_result.subpanels_accumulated;
#else
        const auto candidate_start = Clock::now();
        for (std::size_t ordinal = 0U; ordinal < panel_count; ++ordinal) {
            Ball u_left, u_right;
            arb_set_ui(u_left.value, static_cast<ulong>(ordinal));
            arb_mul_2exp_si(u_left.value, u_left.value,
                           -static_cast<slong>(exponent));
            arb_set_ui(u_right.value, static_cast<ulong>(ordinal + 1U));
            arb_mul_2exp_si(u_right.value, u_right.value,
                           -static_cast<slong>(exponent));

            ledger::Output b_coverage;
            ledger::Output v_coverage;
            ledger::Result b_result{};
            ledger::Result v_result{};
            const ledger::Input b_input{b->ledger, target.left_endpoint,
                target.right_endpoint, u_left.value, u_right.value};
            const ledger::Input v_input{v->ledger, target.left_endpoint,
                target.right_endpoint, u_left.value, u_right.value};
            if (!ledger::evaluate(b_input, &b_coverage, &b_result)
                || !ledger::evaluate(v_input, &v_coverage, &v_result)) {
                return emit_failure("coverage", exponent,
                                    cumulative_subpanels);
            }

            jet::Input jet_input{b->ledger, v->ledger,
                target.left_endpoint, target.right_endpoint, target.order,
                u_left.value, u_right.value, jet::kJetCount,
                target.coefficients};
            jet::Output jet_output;
            jet::Result jet_result{};
#if defined(NHM2_H2_PREPARED_MOMENTS_V2)
            const bool jet_accepted = jet::evaluate_prepared(
                jet_input, &jet_output, &jet_result);
#else
            const bool jet_accepted = jet::evaluate(
                jet_input, &jet_output, &jet_result);
#endif
            if (!jet_accepted
                || jet_result.elementary_convolutions
                    != jet::kElementaryConvolutions) {
                return emit_failure("jet", exponent, cumulative_subpanels);
            }
            candidate_elementary += jet_result.elementary_convolutions;
            ++cumulative_subpanels;
        }
#endif
        cumulative_elementary += candidate_elementary;
        const auto candidate_end = Clock::now();
        const auto candidate_ms = std::chrono::duration_cast<
            std::chrono::milliseconds>(candidate_end - candidate_start).count();
        const auto cumulative_ms = std::chrono::duration_cast<
            std::chrono::milliseconds>(candidate_end - calibration_start).count();
        std::cout
            << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_timing_calibration.v1\""
            << ",\"status\":\"PROGRESS\",\"exponent\":" << exponent
#if defined(NHM2_H2_PARALLEL_SELECTOR_V3)
            << ",\"threads\":" << thread_count
#endif
            << ",\"u_panels\":" << panel_count
            << ",\"candidate_milliseconds\":" << candidate_ms
            << ",\"cumulative_milliseconds\":" << cumulative_ms
            << ",\"candidate_elementary_convolutions\":"
            << candidate_elementary
            << ",\"cumulative_subpanels\":" << cumulative_subpanels
            << ",\"cumulative_elementary_convolutions\":"
            << cumulative_elementary
            << ",\"candidate_evaluations\":0"
            << ",\"positive_parameter_samples\":0"
            << ",\"candidate_roots_created\":false"
            << ",\"scientific_handler_linked\":false"
            << ",\"authority_promoted\":false}" << std::endl;
    }
    std::cout
        << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_timing_calibration.v1\""
        << ",\"status\":\"CALIBRATION_COMPLETE\""
        << ",\"maximum_exponent\":" << maximum_exponent
#if defined(NHM2_H2_PARALLEL_SELECTOR_V3)
        << ",\"threads\":" << thread_count
#endif
        << ",\"cumulative_subpanels\":" << cumulative_subpanels
        << ",\"cumulative_elementary_convolutions\":"
        << cumulative_elementary
        << ",\"candidate_evaluations\":0"
        << ",\"positive_parameter_samples\":0"
        << ",\"candidate_roots_created\":false"
        << ",\"scientific_handler_linked\":false"
        << ",\"authority_promoted\":false}\n";
    return 0;
}
