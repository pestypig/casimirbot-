#include "mini_boson_star_primary_c08_h2_ledger_v1.hpp"
#include "mini_boson_star_primary_c08_scalar_ledger_provider_v1.hpp"

#include "mini_boson_star_primary_c08_identity_v1.hpp"
#include "mini_boson_star_primary_c08_margins_v1.hpp"

#include <arb.h>
#include <flint/flint.h>
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
namespace p8n =
    nhm2::g2h_e_s5::primary_c08_h2_p8n_selector_term_radius_binding_v1;
namespace p8p =
    nhm2::g2h_e_s5::primary_c08_h2_p8p_observer_progress_v1;
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
constexpr std::size_t kPanelCount = 1024U;
constexpr std::size_t kThreadCount = 32U;
constexpr std::size_t kProgressInterval = 16U;
constexpr unsigned kTargetDegree = 3U;
constexpr std::size_t kTargetJet = jet::second_jet(1U, 2U);

struct ProgressReceipt {
    std::size_t callback_invocations = 0U;
    std::size_t receipts_emitted = 0U;
    std::size_t last_completed = 0U;
    std::uint64_t last_timestamp = 0U;
    bool chronology_ok = true;
};

void progress(const p8p::ProgressEvent &event, void *context) noexcept {
    auto *receipt = static_cast<ProgressReceipt *>(context);
    if (receipt == nullptr) return;
    ++receipt->callback_invocations;
    receipt->chronology_ok = receipt->chronology_ok
        && event.phase == p8p::Phase::observer
        && event.completed_panels == receipt->callback_invocations
        && event.total_panels == kPanelCount
        && event.monotonic_nanoseconds >= receipt->last_timestamp;
    receipt->last_completed = event.completed_panels;
    receipt->last_timestamp = event.monotonic_nanoseconds;
    if (event.completed_panels != event.total_panels
        && event.completed_panels % kProgressInterval != 0U) return;
    ++receipt->receipts_emitted;
    std::cerr
        << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_p8p_progress.v1\","
        << "\"phase\":\"observer\","
        << "\"completed_panels\":" << event.completed_panels << ','
        << "\"total_panels\":" << event.total_panels << ','
        << "\"monotonic_nanoseconds\":"
        << event.monotonic_nanoseconds << "}\n" << std::flush;
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

std::string decimal_ball(arb_srcptr value) {
    char *raw = arb_get_str(value, 80, 0U);
    if (raw == nullptr) return {};
    std::string rendered(raw);
    flint_free(raw);
    return rendered;
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
        << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_p8p_turnaround_calibration.v1\","
        << "\"status\":\"FAIL\",\"phase\":\"" << phase << "\","
        << "\"panel_count\":1024,\"thread_count\":32,"
        << "\"candidate_evaluations\":0,"
        << "\"positive_parameter_samples\":0,"
        << "\"candidate_roots_created\":false,"
        << "\"scientific_handler_linked\":false,"
        << "\"authority_promoted\":false}\n";
    return 1;
}

void emit_degree_terms(const p8n::Observation &observation) {
    std::cout << '[';
    for (std::size_t degree = 0U;
         degree < observation.by_global_t_degree.size(); ++degree) {
        if (degree != 0U) std::cout << ',';
        const p8n::DegreeAggregate *entry =
            observation.by_global_t_degree[degree];
        std::cout << (entry == nullptr ? 0U : entry->terms);
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
    selector::CoefficientDecompositionObservation predecessor;
    p8n::Observation observation;
    p8p::TimingObservation timing;
    ProgressReceipt progress_receipt;
    const bool evaluated =
        h2::diagnose_next_selector_candidate_term_radius_observed(
            h2_extension_input, &h2_context, kPanelCount, kThreadCount,
            kTargetDegree, kTargetJet, &output, &result, &predecessor,
            &observation, progress, &progress_receipt, &timing);
    const auto after = h2::published(h2_context);
    const bool parent_unchanged = before.model_count == after.model_count
        && before.models == after.models;
    const bool receipt_complete = progress_receipt.chronology_ok
        && progress_receipt.callback_invocations == kPanelCount
        && progress_receipt.last_completed == kPanelCount
        && progress_receipt.receipts_emitted
            == kPanelCount / kProgressInterval;
    if (!evaluated || !observation.evaluated || !timing.evaluated
        || !predecessor.evaluated || !parent_unchanged || !receipt_complete)
        return fail("turnaround_calibration");

    std::cout
        << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_p8p_turnaround_calibration.v1\","
        << "\"status\":\"PASS\",\"phase\":\"complete\","
        << "\"panel_count\":" << observation.panel_count << ','
        << "\"thread_count\":" << kThreadCount << ','
        << "\"target_degree\":" << observation.target_degree << ','
        << "\"target_jet\":" << observation.target_jet << ','
        << "\"precision_bits\":512,"
        << "\"selector_nanoseconds\":" << timing.selector_nanoseconds << ','
        << "\"observer_nanoseconds\":" << timing.observer_nanoseconds << ','
        << "\"total_nanoseconds\":" << timing.total_nanoseconds << ','
        << "\"callback_invocations\":"
        << progress_receipt.callback_invocations << ','
        << "\"progress_receipts_emitted\":"
        << progress_receipt.receipts_emitted << ','
        << "\"progress_interval\":" << kProgressInterval << ','
        << "\"monotone_progress\":"
        << (progress_receipt.chronology_ok ? "true" : "false")
        << ",\"degree_bucket_capacity\":"
        << observation.by_global_t_degree.size()
        << ",\"populated_degrees\":" << observation.populated_degrees
        << ",\"panels_observed\":" << observation.panels_observed
        << ",\"terms_observed\":" << observation.terms_observed
        << ",\"boundary_terms_observed\":"
        << observation.boundary_terms_observed
        << ",\"p8i_counts_equal\":"
        << (observation.p8i_counts_equal ? "true" : "false")
        << ",\"p8i_aggregate_equal\":"
        << (observation.p8i_aggregate_equal ? "true" : "false")
        << ",\"six_origin_totals\":[\""
        << decimal_ball(observation.f_coefficient_total) << "\",\""
        << decimal_ball(observation.gprime_coefficient_total) << "\",\""
        << decimal_ball(observation.prepared_moment_total) << "\",\""
        << decimal_ball(observation.product_rounding_total) << "\",\""
        << decimal_ball(observation.translation_weight_total) << "\",\""
        << decimal_ball(observation.absolute_accumulation_total) << "\"],"
        << "\"degree_terms\":";
    emit_degree_terms(observation);
    std::cout
        << ",\"parent_unchanged\":"
        << (parent_unchanged ? "true" : "false")
        << ",\"candidate_evaluations\":0,"
        << "\"positive_parameter_samples\":0,"
        << "\"candidate_roots_created\":false,"
        << "\"scientific_handler_linked\":false,"
        << "\"authority_promoted\":false}\n";
    return 0;
}
