#include "mini_boson_star_primary_c08_h2_p8m_term_radius_attribution_v1.hpp"

#include <arb.h>

#include <iostream>
#include <vector>

namespace bivariate =
    nhm2::g2h_e_s5::primary_c08_convolution_bivariate_v1;
namespace p8m =
    nhm2::g2h_e_s5::primary_c08_h2_p8m_term_radius_attribution_v1;
namespace ledger =
    nhm2::g2h_e_s5::primary_c08_convolution_ledger_v1;

namespace {

struct Ball {
    Ball() { arb_init(value); arb_zero(value); }
    ~Ball() { arb_clear(value); }
    arb_t value;
};

struct Storage {
    explicit Storage(std::size_t count) : values(count) {
        for (auto &value : values) { arb_init(&value); arb_zero(&value); }
    }
    ~Storage() { for (auto &value : values) arb_clear(&value); }
    std::vector<arb_struct> values;
};

void fill(Storage &storage, std::size_t jet, unsigned multiplier,
          slong radius_exponent) {
    const std::size_t degree_count = storage.values.size() / ledger::kJetCount;
    for (std::size_t degree = 0U; degree < degree_count; ++degree) {
        arb_ptr value = storage.values.data()
            + degree * ledger::kJetCount + jet;
        arb_set_ui(value, static_cast<ulong>(
            multiplier * (static_cast<unsigned>(degree % 7U) + 1U)));
        arb_mul_2exp_si(value, value, -8L);
        arb_add_error_2exp_si(value,
            radius_exponent - static_cast<slong>(degree % 5U));
    }
}

bool same_result(const bivariate::Result &left,
                 const bivariate::Result &right) {
    return left.accepted == right.accepted && left.detail == right.detail
        && left.direct_models_composed == right.direct_models_composed
        && left.reflected_models_composed == right.reflected_models_composed
        && left.local_to_global_terms == right.local_to_global_terms
        && left.beta_moments_evaluated == right.beta_moments_evaluated
        && left.factorized_product_terms == right.factorized_product_terms
        && left.centered_translation_terms == right.centered_translation_terms
        && left.exact_factorized_bivariate_elimination
            == right.exact_factorized_bivariate_elimination
        && left.exact_dyadic_u_integration
            == right.exact_dyadic_u_integration
        && left.boundary_term_retained == right.boundary_term_retained
        && left.discarded_xi_tail_retained
            == right.discarded_xi_tail_retained
        && left.midpoint_selection_used == right.midpoint_selection_used
        && left.point_sampling_used == right.point_sampling_used
        && left.state_coefficients_read == right.state_coefficients_read
        && left.candidate_evaluations == right.candidate_evaluations
        && left.positive_parameter_samples == right.positive_parameter_samples
        && left.candidate_root_created == right.candidate_root_created
        && left.scientific_handler_linked == right.scientific_handler_linked
        && left.authority_promoted == right.authority_promoted;
}

bool same_output(const bivariate::Output &left,
                 const bivariate::Output &right) {
    if (left.retained_order != right.retained_order
        || !arb_equal(left.target_center, right.target_center)
        || !arb_equal(left.target_half_width, right.target_half_width)
        || !arb_equal(left.discarded_xi_tail_bound,
                      right.discarded_xi_tail_bound)
        || !arb_equal(left.f_source_hull_radius_bound,
                      right.f_source_hull_radius_bound)
        || !arb_equal(left.gprime_source_hull_radius_bound,
                      right.gprime_source_hull_radius_bound)) return false;
    for (unsigned degree = 0U; degree <= left.retained_order; ++degree)
        if (!arb_equal(left.coefficient(degree), right.coefficient(degree)))
            return false;
    return true;
}

bool same_attribution(const p8m::Attribution &left,
                      const p8m::Attribution &right) {
    if (left.target_degree != right.target_degree
        || left.terms_observed != right.terms_observed
        || left.exact_radius_reconstruction
            != right.exact_radius_reconstruction
        || left.exact_observed_integrated_match
            != right.exact_observed_integrated_match
        || left.origin_channels_complete != right.origin_channels_complete
        || left.evaluated != right.evaluated
        || left.by_global_t_degree.size()
            != right.by_global_t_degree.size()) return false;
    const arb_srcptr left_totals[] = {
        left.f_coefficient_total, left.gprime_coefficient_total,
        left.prepared_moment_total, left.product_rounding_total,
        left.translation_weight_total, left.absolute_accumulation_total,
        left.reconstructed_integrated_radius, left.observed_integrated_radius};
    const arb_srcptr right_totals[] = {
        right.f_coefficient_total, right.gprime_coefficient_total,
        right.prepared_moment_total, right.product_rounding_total,
        right.translation_weight_total, right.absolute_accumulation_total,
        right.reconstructed_integrated_radius, right.observed_integrated_radius};
    for (std::size_t i = 0U; i < 8U; ++i)
        if (!arb_equal(left_totals[i], right_totals[i])) return false;
    for (std::size_t degree = 0U;
         degree < left.by_global_t_degree.size(); ++degree) {
        const auto *a = left.by_global_t_degree[degree];
        const auto *b = right.by_global_t_degree[degree];
        if ((a == nullptr) != (b == nullptr)) return false;
        if (a == nullptr) continue;
        if (a->terms != b->terms
            || !arb_equal(a->f_coefficient, b->f_coefficient)
            || !arb_equal(a->gprime_coefficient, b->gprime_coefficient)
            || !arb_equal(a->prepared_moment, b->prepared_moment)
            || !arb_equal(a->product_rounding, b->product_rounding)
            || !arb_equal(a->translation_weight, b->translation_weight)
            || !arb_equal(a->absolute_accumulation,
                          b->absolute_accumulation)) return false;
    }
    return true;
}

bool nonnegative(arb_srcptr value) {
    return arb_is_finite(value) && !arb_is_negative(value);
}

}  // namespace

int main() {
    std::vector<bool> checks;
    Ball zero, one, two, three, boundary;
    arb_zero(zero.value); arb_one(one.value); arb_set_ui(two.value, 2UL);
    arb_set_ui(three.value, 3UL); arb_set_ui(boundary.value, 3UL);
    arb_mul_2exp_si(boundary.value, boundary.value, -4L);
    arb_add_error_2exp_si(boundary.value, -225L);

    Storage f0((32U + 1U) * ledger::kJetCount);
    Storage f1((24U + 1U) * ledger::kJetCount);
    Storage f2((24U + 1U) * ledger::kJetCount);
    Storage g0((32U + 1U) * ledger::kJetCount);
    Storage g1((24U + 1U) * ledger::kJetCount);
    Storage g2((24U + 1U) * ledger::kJetCount);
    Storage fr0(ledger::kJetCount), fr1(ledger::kJetCount),
        fr2(ledger::kJetCount);
    Storage gr0(ledger::kJetCount), gr1(ledger::kJetCount),
        gr2(ledger::kJetCount);
    fill(f0, 0U, 1U, -222L); fill(f1, 0U, 2U, -222L);
    fill(f2, 0U, 3U, -222L);
    fill(g0, 9U, 2U, -218L); fill(g1, 9U, 3U, -218L);
    fill(g2, 9U, 4U, -218L);

    std::vector<ledger::ModelView> f_models = {
        {0U, ledger::ModelKind::origin, zero.value, one.value, zero.value, 32U,
         f0.values.size(), f0.values.data(), fr0.values.size(), fr0.values.data()},
        {1U, ledger::ModelKind::positive_panel, one.value, two.value, one.value,
         24U, f1.values.size(), f1.values.data(), fr1.values.size(), fr1.values.data()},
        {2U, ledger::ModelKind::positive_panel, two.value, three.value, two.value,
         24U, f2.values.size(), f2.values.data(), fr2.values.size(), fr2.values.data()},
    };
    std::vector<ledger::ModelView> g_models = {
        {0U, ledger::ModelKind::origin, zero.value, one.value, zero.value, 32U,
         g0.values.size(), g0.values.data(), gr0.values.size(), gr0.values.data()},
        {1U, ledger::ModelKind::positive_panel, one.value, two.value, one.value,
         24U, g1.values.size(), g1.values.data(), gr1.values.size(), gr1.values.data()},
        {2U, ledger::ModelKind::positive_panel, two.value, three.value, two.value,
         24U, g2.values.size(), g2.values.data(), gr2.values.size(), gr2.values.data()},
    };
    bivariate::Input input{{f_models.size(), f_models.data()},
        {g_models.size(), g_models.data()}, two.value, three.value, 24U,
        zero.value, one.value, 0U, 9U, boundary.value};
    bivariate::PreparedMoments prepared;
    const bool prepared_ok = bivariate::prepare_moments(
        zero.value, one.value, 32U, 32U, &prepared);

    bivariate::Output ordinary, observed, repeated;
    bivariate::Result ordinary_result{}, observed_result{}, repeated_result{};
    bivariate::CoefficientAttribution predecessor, repeated_predecessor;
    p8m::Attribution attribution, repeated_attribution;
    const bool ordinary_ok = prepared_ok && bivariate::evaluate_prepared(
        input, prepared, &ordinary, &ordinary_result);
    const bool observed_ok = prepared_ok && p8m::evaluate_prepared_observed(
        input, prepared, 3U, &observed, &observed_result, &predecessor,
        &attribution);
    const bool repeated_ok = prepared_ok && p8m::evaluate_prepared_observed(
        input, prepared, 3U, &repeated, &repeated_result,
        &repeated_predecessor, &repeated_attribution);

    checks.push_back(prepared_ok && ordinary_ok && observed_ok && repeated_ok);
    checks.push_back(same_result(ordinary_result, observed_result)
                     && same_result(observed_result, repeated_result));
    checks.push_back(same_output(ordinary, observed)
                     && same_output(observed, repeated));
    checks.push_back(same_attribution(attribution, repeated_attribution));
    checks.push_back(attribution.evaluated && attribution.observation_only
                     && attribution.target_degree == 3U
                     && attribution.exact_observed_integrated_match
                     && attribution.origin_channels_complete);
    checks.push_back(predecessor.final_reconstruction_equal
                     && arb_equal(predecessor.reconstructed_coefficient,
                                  observed.coefficient(3U)));
    checks.push_back(attribution.terms_observed == 1086U);
    checks.push_back(attribution.by_global_t_degree.size() == 66U
                     && attribution.by_global_t_degree[3U] != nullptr
                     && attribution.by_global_t_degree[65U] != nullptr);
    checks.push_back(nonnegative(attribution.f_coefficient_total)
                     && nonnegative(attribution.gprime_coefficient_total)
                     && nonnegative(attribution.prepared_moment_total)
                     && nonnegative(attribution.product_rounding_total)
                     && nonnegative(attribution.translation_weight_total)
                     && nonnegative(attribution.absolute_accumulation_total));
    checks.push_back(arb_is_positive(attribution.gprime_coefficient_total)
                     || arb_is_positive(attribution.f_coefficient_total));
    checks.push_back(ordinary_result.candidate_evaluations == 0U
                     && observed_result.candidate_evaluations == 0U
                     && ordinary_result.positive_parameter_samples == 0U
                     && observed_result.positive_parameter_samples == 0U);
    checks.push_back(!ordinary_result.candidate_root_created
                     && !observed_result.candidate_root_created
                     && !ordinary_result.scientific_handler_linked
                     && !observed_result.scientific_handler_linked
                     && !ordinary_result.authority_promoted
                     && !observed_result.authority_promoted);

    std::size_t passed = 0U;
    for (const bool check : checks) if (check) ++passed;
    std::cout
        << "{\"schema\":\"nhm2.g2h_e_s5.c08_h2_p8m_term_radius_attribution_fixture.v1\"," 
        << "\"status\":\"" << (passed == checks.size() ? "PASS" : "FAIL")
        << "\",\"checks_passed\":" << passed
        << ",\"checks_total\":" << checks.size()
        << ",\"target_degree\":3,\"global_degree_count\":63,"
        << "\"terms_observed\":" << attribution.terms_observed
        << ",\"ordinary_observed_equal\":"
        << (same_output(ordinary, observed) ? "true" : "false")
        << ",\"deterministic_repeat\":"
        << (same_attribution(attribution, repeated_attribution)
            ? "true" : "false")
        << ",\"exact_radius_reconstruction\":"
        << (attribution.exact_radius_reconstruction ? "true" : "false")
        << ",\"exact_observed_integrated_match\":"
        << (attribution.exact_observed_integrated_match ? "true" : "false")
        << ",\"origin_channels_complete\":"
        << (attribution.origin_channels_complete ? "true" : "false")
        << ",\"manufactured_coefficient_origin_positive\":"
        << ((arb_is_positive(attribution.gprime_coefficient_total)
             || arb_is_positive(attribution.f_coefficient_total))
            ? "true" : "false")
        << ",\"next_gate\":\"P8N_SELECTOR_PATH_TERM_RADIUS_BINDING\"," 
        << "\"candidate_evaluations\":0,\"positive_parameter_samples\":0,"
        << "\"candidate_roots_created\":false,"
        << "\"scientific_handler_linked\":false,"
        << "\"authority_promoted\":false}\n";
    return passed == checks.size() ? 0 : 1;
}
