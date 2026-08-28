#include "mini_boson_star_primary_c08_convolution_jet_v1.hpp"
#include "mini_boson_star_primary_c08_convolution_selector_v1.hpp"
#include "mini_boson_star_primary_c08_identity_v1.hpp"
#include "mini_boson_star_primary_c08_margins_v1.hpp"
#include "mini_boson_star_primary_c08_scalar_ledger_provider_v1.hpp"
#include "mini_boson_star_sha256_v1.hpp"

#include <arb.h>
#include <flint/flint.h>
#include <flint/fmpq.h>

#include <array>
#include <chrono>
#include <cstddef>
#include <cstdlib>
#include <iostream>
#include <string>
#include <vector>

namespace jet = nhm2::g2h_e_s5::primary_c08_convolution_jet_v1;
namespace selector =
    nhm2::g2h_e_s5::primary_c08_convolution_selector_v1;
namespace ledger = nhm2::g2h_e_s5::primary_c08_convolution_ledger_v1;
namespace identity = nhm2::g2h_e_s5::primary_c08_identity_v1;
namespace margins = nhm2::g2h_e_s5::primary_c08_margins_v1;
namespace scalar =
    nhm2::g2h_e_s5::primary_c08_scalar_ledger_provider_v1;
namespace history = nhm2::g2h_e_s5::primary_c08_finite_history_v1;
namespace sha256 = nhm2::g2h_e_s5::sha256_v1;

namespace {

constexpr char kSchema[] =
    "nhm2.g2h_e_s5.c08_h2_p5a_width_calibration.v1";
constexpr char kGrowthHash[] =
    "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737";
constexpr char kJetHash[] =
    "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc";
constexpr char kGridHash[] =
    "cd98fb110a6d0d94cd69d1134e8f5233444ea34f7894bc14333075d0dfa5013c";
constexpr char kAbiHash[] =
    "6fbf6cdbb80e6da390c84f6d87f13f37f2b81b2226bf937cbcfd2c8aff3911ca";
constexpr std::size_t kPanelCount = 1024U;
constexpr std::array<std::size_t, 4U> kAllowedThreads = {1U, 4U, 8U, 16U};

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

bool parse_threads(const char *text, std::size_t *value) {
    if (text == nullptr || value == nullptr || *text == '\0') return false;
    char *end = nullptr;
    const unsigned long parsed = std::strtoul(text, &end, 10);
    if (end == text || *end != '\0') return false;
    for (const auto allowed : kAllowedThreads) {
        if (parsed == allowed) {
            *value = allowed;
            return true;
        }
    }
    return false;
}

void append_scalar(std::string &bytes, const char *name,
                   std::size_t value) {
    bytes += name;
    bytes.push_back('=');
    bytes += std::to_string(value);
    bytes.push_back('\n');
}

void append_bool(std::string &bytes, const char *name, bool value) {
    append_scalar(bytes, name, value ? 1U : 0U);
}

bool append_arb(std::string &bytes, const char *name, arb_srcptr value) {
    if (value == nullptr || !arb_is_finite(value)) return false;
    char *dump = arb_dump_str(value);
    if (dump == nullptr) return false;
    bytes += name;
    bytes.push_back('=');
    bytes += dump;
    bytes.push_back('\n');
    flint_free(dump);
    return true;
}

void append_vector(std::string &bytes, const char *name,
                   const std::vector<std::size_t> &values) {
    append_scalar(bytes, name, values.size());
    for (const auto value : values) append_scalar(bytes, "item", value);
}

bool semantic_digest(const selector::Output &output,
                     const selector::Result &result,
                     std::string *digest) {
    if (digest == nullptr) return false;
    std::string bytes = "nhm2-g2h-e-s5/c08-h2-p5a-semantics/v1\n";
    append_scalar(bytes, "panel_count", kPanelCount);
    append_scalar(bytes, "retained_order", output.retained_order);
    append_scalar(bytes, "selected_u_panels", output.selected_u_panels);
    if (!append_arb(bytes, "target_left", output.target_left)
        || !append_arb(bytes, "target_right", output.target_right)
        || !append_arb(bytes, "target_center", output.target_center)
        || !append_arb(bytes, "target_half_width", output.target_half_width))
        return false;
    append_vector(bytes, "direct_coverage_offsets",
                  output.direct_coverage_offsets);
    append_vector(bytes, "direct_coverage_ordinals",
                  output.direct_coverage_ordinals);
    append_vector(bytes, "reflected_coverage_offsets",
                  output.reflected_coverage_offsets);
    append_vector(bytes, "reflected_coverage_ordinals",
                  output.reflected_coverage_ordinals);
    for (unsigned degree = 0U; degree <= output.retained_order; ++degree) {
        for (std::size_t component = 0U; component < jet::kJetCount;
             ++component) {
            if (!append_arb(bytes, "coefficient",
                            output.coefficient(degree, component))
                || !append_arb(bytes, "coefficient_margin",
                               output.coefficient_margin(degree, component)))
                return false;
        }
    }
    for (std::size_t component = 0U; component < jet::kJetCount;
         ++component) {
        if (!append_arb(bytes, "remainder", output.remainder(component))
            || !append_arb(bytes, "remainder_margin",
                           output.remainder_margin(component)))
            return false;
    }
    append_bool(bytes, "accepted", result.accepted);
    append_scalar(bytes, "detail", static_cast<std::size_t>(result.detail));
    append_scalar(bytes, "refinement_candidates_visited",
                  result.refinement_candidates_visited);
    append_scalar(bytes, "subpanels_accumulated",
                  result.subpanels_accumulated);
    append_scalar(bytes, "jet_predecessor_calls",
                  result.jet_predecessor_calls);
    append_scalar(bytes, "elementary_convolutions",
                  result.elementary_convolutions);
    append_scalar(bytes, "numerical_width_checks",
                  result.numerical_width_checks);
    append_bool(bytes, "fixed_candidate_schedule",
                result.fixed_candidate_schedule);
    append_bool(bytes, "increasing_subpanel_order",
                result.increasing_subpanel_order);
    append_bool(bytes, "first_passing_candidate_selected",
                result.first_passing_candidate_selected);
    append_bool(bytes, "boundary_applied_once", result.boundary_applied_once);
    append_bool(bytes, "exhaustion_retuned", result.exhaustion_retuned);
    append_bool(bytes, "signed_remainder_cancellation_used",
                result.signed_remainder_cancellation_used);
    append_bool(bytes, "midpoint_selection_used",
                result.midpoint_selection_used);
    append_bool(bytes, "point_sampling_used", result.point_sampling_used);
    append_scalar(bytes, "state_coefficients_read",
                  result.state_coefficients_read);
    append_scalar(bytes, "candidate_evaluations",
                  result.candidate_evaluations);
    append_scalar(bytes, "positive_parameter_samples",
                  result.positive_parameter_samples);
    append_bool(bytes, "candidate_root_created",
                result.candidate_root_created);
    append_bool(bytes, "scientific_handler_linked",
                result.scientific_handler_linked);
    append_bool(bytes, "authority_promoted", result.authority_promoted);
    *digest = sha256::text(bytes);
    return true;
}

void emit_description() {
    std::cout
        << "{\"schema\":\"" << kSchema << "\""
        << ",\"status\":\"DESCRIPTION\""
        << ",\"precision_bits\":" << scalar::kPrecisionBits
        << ",\"order\":128,\"jet_count\":" << jet::kJetCount
        << ",\"elementary_convolutions_per_subpanel\":"
        << jet::kElementaryConvolutions
        << ",\"u_panels\":" << kPanelCount
        << ",\"allowed_threads\":[1,4,8,16]"
        << ",\"candidate_calls_per_process\":1"
        << ",\"smaller_widths_evaluated\":false"
        << ",\"serial_oracle_in_process\":false"
        << ",\"candidate_evaluations\":0"
        << ",\"positive_parameter_samples\":0"
        << ",\"candidate_roots_created\":false"
        << ",\"scientific_handler_linked\":false"
        << ",\"authority_promoted\":false}\n";
}

int emit_failure(const char *phase, std::size_t threads) {
    std::cout
        << "{\"schema\":\"" << kSchema << "\""
        << ",\"status\":\"FAIL\",\"phase\":\"" << phase << "\""
        << ",\"u_panels\":" << kPanelCount
        << ",\"threads\":" << threads
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
    if (argc != 3 || std::string(argv[1]) != "--threads")
        return emit_failure("arguments", 0U);
    std::size_t thread_count = 0U;
    if (!parse_threads(argv[2], &thread_count))
        return emit_failure("arguments", 0U);

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
    if (!scalar::initialize(scalar_input, &scalar_context, &scalar_result))
        return emit_failure("scalar_initialize", thread_count);
    const auto ledgers = scalar::published(scalar_context);
    const auto *b = find_ledger(ledgers, 10U);
    const auto *v = find_ledger(ledgers, 20U);
    if (b == nullptr || v == nullptr || b->ledger.model_count != 1U
        || v->ledger.model_count != 1U)
        return emit_failure("scalar_inventory", thread_count);
    const auto &target = b->ledger.models[0];
    if (target.order != 128U
        || target.coefficient_count < jet::kJetCount)
        return emit_failure("origin_order_or_boundary", thread_count);

    const selector::Input selector_input{
        b->ledger, v->ledger, target.left_endpoint, target.right_endpoint,
        target.order, jet::kJetCount, target.coefficients};
    selector::Output output;
    selector::Result result{};
    using Clock = std::chrono::steady_clock;
    const auto start = Clock::now();
    const bool accepted = selector::evaluate_prepared_candidate(
        selector_input, kPanelCount, thread_count, &output, &result);
    const auto end = Clock::now();
    if (!accepted) return emit_failure("candidate", thread_count);
    std::string digest;
    if (!semantic_digest(output, result, &digest))
        return emit_failure("semantic_digest", thread_count);
    const auto milliseconds = std::chrono::duration_cast<
        std::chrono::milliseconds>(end - start).count();
    std::cout
        << "{\"schema\":\"" << kSchema << "\""
        << ",\"status\":\"CALIBRATION_COMPLETE\""
        << ",\"u_panels\":" << kPanelCount
        << ",\"threads\":" << thread_count
        << ",\"milliseconds\":" << milliseconds
        << ",\"semantic_sha256\":\"" << digest << "\""
        << ",\"subpanels_accumulated\":"
        << result.subpanels_accumulated
        << ",\"elementary_convolutions\":"
        << result.elementary_convolutions
        << ",\"candidate_evaluations\":"
        << result.candidate_evaluations
        << ",\"positive_parameter_samples\":"
        << result.positive_parameter_samples
        << ",\"candidate_root_created\":"
        << (result.candidate_root_created ? "true" : "false")
        << ",\"scientific_handler_linked\":"
        << (result.scientific_handler_linked ? "true" : "false")
        << ",\"authority_promoted\":"
        << (result.authority_promoted ? "true" : "false")
        << "}\n";
    return 0;
}
