#include "mini_boson_star_primary_c08_h2_p8m_term_radius_attribution_v1.hpp"

#include <flint/fmpz.h>

#include <algorithm>
#include <array>
#include <limits>
#include <utility>

namespace nhm2::g2h_e_s5::primary_c08_h2_p8m_term_radius_attribution_v1 {
namespace {

namespace ledger = primary_c08_convolution_ledger_v1;

constexpr slong kPrecisionBits = 512;

struct BallVector {
    explicit BallVector(std::size_t count) : values(count) {
        for (auto &value : values) { arb_init(&value); arb_zero(&value); }
    }
    ~BallVector() { for (auto &value : values) arb_clear(&value); }
    BallVector(const BallVector &) = delete;
    BallVector &operator=(const BallVector &) = delete;
    arb_ptr at(std::size_t index) { return values.data() + index; }
    arb_srcptr at(std::size_t index) const { return values.data() + index; }
    std::vector<arb_struct> values;
};

void multiply_binomial(arb_ptr output, arb_srcptr input,
                       unsigned n, unsigned k) {
    fmpz_t binomial;
    fmpz_init(binomial);
    fmpz_bin_uiui(binomial, static_cast<ulong>(n), static_cast<ulong>(k));
    arb_mul_fmpz(output, input, binomial, kPrecisionBits);
    fmpz_clear(binomial);
}

bool finite(arb_srcptr value) {
    return value != nullptr && arb_is_finite(value);
}

bool all_finite(const BallVector &values) {
    for (const auto &value : values.values)
        if (!arb_is_finite(&value)) return false;
    return true;
}

unsigned maximum_order(const ledger::LedgerView &view,
                       const std::vector<std::size_t> &ordinals) {
    unsigned result = 0U;
    for (const std::size_t ordinal : ordinals)
        result = std::max(result, view.models[ordinal].order);
    return result;
}

bool translated_source_hull(const ledger::LedgerView &view,
                            const std::vector<std::size_t> &ordinals,
                            std::size_t jet, BallVector &hull) {
    if (ordinals.empty()) return false;
    const unsigned max_order = static_cast<unsigned>(hull.values.size() - 1U);
    bool first = true;
    arb_t power, scaled, term, next, negative_center;
    arb_init(power); arb_init(scaled); arb_init(term); arb_init(next);
    arb_init(negative_center);
    for (const std::size_t ordinal : ordinals) {
        const ledger::ModelView &model = view.models[ordinal];
        BallVector translated(static_cast<std::size_t>(max_order) + 1U);
        arb_neg(negative_center, model.expansion_center);
        for (unsigned local_degree = 0U; local_degree <= model.order;
             ++local_degree) {
            arb_srcptr coefficient = model.coefficients
                + static_cast<std::size_t>(local_degree) * ledger::kJetCount
                + jet;
            for (unsigned global_degree = 0U;
                 global_degree <= local_degree; ++global_degree) {
                arb_pow_ui(power, negative_center,
                           static_cast<ulong>(local_degree - global_degree),
                           kPrecisionBits);
                multiply_binomial(scaled, coefficient, local_degree,
                                  global_degree);
                arb_mul(term, scaled, power, kPrecisionBits);
                arb_add(next, translated.at(global_degree), term,
                        kPrecisionBits);
                arb_set(translated.at(global_degree), next);
            }
        }
        if (!all_finite(translated)) {
            arb_clear(negative_center); arb_clear(next); arb_clear(term);
            arb_clear(scaled); arb_clear(power);
            return false;
        }
        for (unsigned degree = 0U; degree <= max_order; ++degree) {
            if (first) arb_set(hull.at(degree), translated.at(degree));
            else arb_union(hull.at(degree), hull.at(degree),
                           translated.at(degree), kPrecisionBits);
        }
        first = false;
    }
    arb_clear(negative_center); arb_clear(next); arb_clear(term);
    arb_clear(scaled); arb_clear(power);
    return all_finite(hull);
}

bool nonnegative_exact(arb_srcptr value) {
    return finite(value) && arb_is_exact(value) && !arb_is_negative(value);
}

bool exact_upper_in_place(arb_ptr value) {
    arb_t absolute;
    arf_t upper;
    arb_init(absolute); arf_init(upper);
    arb_abs(absolute, value);
    arb_get_ubound_arf(upper, absolute, kPrecisionBits);
    arb_set_arf(value, upper);
    const bool ok = nonnegative_exact(value);
    arf_clear(upper); arb_clear(absolute);
    return ok;
}

bool radius_delta(arb_ptr output, arb_srcptr after, arb_srcptr before) {
    arb_sub(output, after, before, ARF_PREC_EXACT);
    return nonnegative_exact(output);
}

void allocate_capped(arb_ptr allocation, arb_ptr remaining,
                     arb_srcptr requested) {
    if (arb_gt(requested, remaining)) arb_set(allocation, remaining);
    else arb_set(allocation, requested);
    arb_sub(remaining, remaining, allocation, ARF_PREC_EXACT);
}

void add_exact(arb_ptr target, arb_srcptr value) {
    arb_add(target, target, value, ARF_PREC_EXACT);
}

void reset(Attribution &attribution) {
    for (DegreeRadiusAttribution *entry : attribution.by_global_t_degree)
        delete entry;
    attribution.by_global_t_degree.clear();
    arb_zero(attribution.f_coefficient_total);
    arb_zero(attribution.gprime_coefficient_total);
    arb_zero(attribution.prepared_moment_total);
    arb_zero(attribution.product_rounding_total);
    arb_zero(attribution.translation_weight_total);
    arb_zero(attribution.absolute_accumulation_total);
    arb_zero(attribution.reconstructed_integrated_radius);
    arb_zero(attribution.observed_integrated_radius);
    attribution.target_degree = 0U;
    attribution.terms_observed = 0U;
    attribution.exact_radius_reconstruction = false;
    attribution.exact_observed_integrated_match = false;
    attribution.origin_channels_complete = false;
    attribution.observation_only = true;
    attribution.evaluated = false;
}

}  // namespace

DegreeRadiusAttribution::DegreeRadiusAttribution() {
    arb_init(f_coefficient); arb_init(gprime_coefficient);
    arb_init(prepared_moment); arb_init(product_rounding);
    arb_init(translation_weight); arb_init(absolute_accumulation);
    arb_zero(f_coefficient); arb_zero(gprime_coefficient);
    arb_zero(prepared_moment); arb_zero(product_rounding);
    arb_zero(translation_weight); arb_zero(absolute_accumulation);
}

DegreeRadiusAttribution::~DegreeRadiusAttribution() {
    arb_clear(absolute_accumulation); arb_clear(translation_weight);
    arb_clear(product_rounding); arb_clear(prepared_moment);
    arb_clear(gprime_coefficient); arb_clear(f_coefficient);
}

Attribution::Attribution() {
    arb_init(f_coefficient_total); arb_init(gprime_coefficient_total);
    arb_init(prepared_moment_total); arb_init(product_rounding_total);
    arb_init(translation_weight_total); arb_init(absolute_accumulation_total);
    arb_init(reconstructed_integrated_radius);
    arb_init(observed_integrated_radius);
    reset(*this);
}

Attribution::~Attribution() {
    for (DegreeRadiusAttribution *entry : by_global_t_degree) delete entry;
    arb_clear(observed_integrated_radius);
    arb_clear(reconstructed_integrated_radius);
    arb_clear(absolute_accumulation_total);
    arb_clear(translation_weight_total); arb_clear(product_rounding_total);
    arb_clear(prepared_moment_total); arb_clear(gprime_coefficient_total);
    arb_clear(f_coefficient_total);
}

bool evaluate_prepared_observed(
    const bivariate::Input &input,
    const bivariate::PreparedMoments &prepared,
    unsigned target_degree,
    bivariate::Output *output,
    bivariate::Result *result,
    bivariate::CoefficientAttribution *predecessor_attribution,
    Attribution *attribution) {
    if (output == nullptr || result == nullptr
        || predecessor_attribution == nullptr || attribution == nullptr)
        return false;
    reset(*attribution);
    attribution->target_degree = target_degree;

    // The predecessor remains the sole producer of scientific output.
    if (!bivariate::evaluate_prepared_attributed(
            input, prepared, target_degree, output, result,
            predecessor_attribution)) return false;

    ledger::Input f_input{input.f_ledger, input.target_left,
        input.target_right, input.u_left, input.u_right};
    ledger::Input g_input{input.gprime_ledger, input.target_left,
        input.target_right, input.u_left, input.u_right};
    ledger::Output f_coverage, g_coverage;
    ledger::Result f_result{}, g_result{};
    if (!ledger::evaluate(f_input, &f_coverage, &f_result)
        || !ledger::evaluate(g_input, &g_coverage, &g_result)) return false;
    const auto &f_ordinals = f_coverage.direct_intersecting_ordinals;
    const auto &g_ordinals = g_coverage.reflected_intersecting_ordinals;
    const unsigned max_f = maximum_order(input.f_ledger, f_ordinals);
    const unsigned max_g = maximum_order(input.gprime_ledger, g_ordinals);
    if (!prepared.ready || prepared.maximum_f_order != max_f
        || prepared.maximum_g_order != max_g
        || target_degree > input.target_order) return false;

    BallVector f_hull(static_cast<std::size_t>(max_f) + 1U);
    BallVector g_hull(static_cast<std::size_t>(max_g) + 1U);
    if (!translated_source_hull(input.f_ledger, f_ordinals, input.f_jet,
                                f_hull)
        || !translated_source_hull(input.gprime_ledger, g_ordinals,
                                   input.gprime_jet, g_hull)) return false;

    const unsigned maximum_degree = max_f + max_g + 1U;
    attribution->by_global_t_degree.resize(
        static_cast<std::size_t>(maximum_degree) + 1U, nullptr);
    for (unsigned degree = target_degree; degree <= maximum_degree; ++degree)
        attribution->by_global_t_degree[degree] =
            new DegreeRadiusAttribution();
    BallVector global_t(static_cast<std::size_t>(maximum_degree) + 1U);

    arb_t mid_f, mid_g, mid_m, product, term, next;
    arb_t rad_f, rad_g, rad_m, abs_f, abs_g, abs_m;
    arb_t f_origin, g_origin, moment_origin, term_radius, residual;
    arb_t requested_f, requested_g, requested_m;
    arb_init(mid_f); arb_init(mid_g); arb_init(mid_m); arb_init(product);
    arb_init(term); arb_init(next); arb_init(rad_f); arb_init(rad_g);
    arb_init(rad_m); arb_init(abs_f); arb_init(abs_g); arb_init(abs_m);
    arb_init(f_origin); arb_init(g_origin); arb_init(moment_origin);
    arb_init(term_radius); arb_init(residual); arb_init(requested_f);
    arb_init(requested_g); arb_init(requested_m);
    bool ok = true;
    for (unsigned a = 0U; a <= max_f && ok; ++a) {
        for (unsigned b = 0U; b <= max_g; ++b) {
            arb_srcptr moment = prepared.moment(a, b);
            if (!finite(moment)) { ok = false; break; }
            arb_mul(product, f_hull.at(a), g_hull.at(b), kPrecisionBits);
            arb_mul(term, product, moment, kPrecisionBits);
            const unsigned degree = a + b + 1U;
            arb_add(next, global_t.at(degree), term, kPrecisionBits);
            arb_set(global_t.at(degree), next);
            if (degree < target_degree) continue;
            arb_get_mid_arb(mid_f, f_hull.at(a));
            arb_get_mid_arb(mid_g, g_hull.at(b));
            arb_get_mid_arb(mid_m, moment);
            arb_get_rad_arb(rad_f, f_hull.at(a));
            arb_get_rad_arb(rad_g, g_hull.at(b));
            arb_get_rad_arb(rad_m, moment);
            arb_abs(abs_f, mid_f); arb_abs(abs_g, mid_g);
            arb_abs(abs_m, mid_m);
            arb_mul(requested_f, rad_f, abs_g, kPrecisionBits);
            arb_mul(requested_f, requested_f, abs_m, kPrecisionBits);
            arb_mul(requested_g, rad_g, abs_f, kPrecisionBits);
            arb_mul(requested_g, requested_g, abs_m, kPrecisionBits);
            arb_mul(requested_m, rad_m, abs_f, kPrecisionBits);
            arb_mul(requested_m, requested_m, abs_g, kPrecisionBits);
            if (!exact_upper_in_place(requested_f)
                || !exact_upper_in_place(requested_g)
                || !exact_upper_in_place(requested_m)) {
                ok = false; break;
            }
            arb_get_rad_arb(term_radius, term);
            if (!exact_upper_in_place(term_radius)) { ok = false; break; }
            arb_set(residual, term_radius);
            arb_zero(f_origin); arb_zero(g_origin); arb_zero(moment_origin);
            std::array<std::pair<arb_srcptr, arb_ptr>, 3U> requests = {{
                {requested_f, f_origin}, {requested_g, g_origin},
                {requested_m, moment_origin}}};
            std::sort(requests.begin(), requests.end(),
                [](const auto &left, const auto &right) {
                    return arb_gt(left.first, right.first) != 0;
                });
            for (const auto &request : requests)
                allocate_capped(request.second, residual, request.first);
            if (arb_is_negative(residual)
                || !exact_upper_in_place(residual)) { ok = false; break; }

            DegreeRadiusAttribution &entry =
                *attribution->by_global_t_degree[degree];
            add_exact(entry.f_coefficient, f_origin);
            add_exact(entry.gprime_coefficient, g_origin);
            add_exact(entry.prepared_moment, moment_origin);
            add_exact(entry.product_rounding, residual);
            ++entry.terms;
            ++attribution->terms_observed;
        }
    }
    arb_clear(requested_m); arb_clear(requested_g); arb_clear(requested_f);
    arb_clear(residual); arb_clear(term_radius);
    arb_clear(moment_origin); arb_clear(g_origin); arb_clear(f_origin);
    arb_clear(abs_m); arb_clear(abs_g); arb_clear(abs_f); arb_clear(rad_m);
    arb_clear(rad_g); arb_clear(rad_f); arb_clear(next); arb_clear(term);
    arb_clear(product); arb_clear(mid_m); arb_clear(mid_g); arb_clear(mid_f);
    if (!ok || !all_finite(global_t)) return false;

    arb_t center, center_power, scaled, contribution, centered, accumulated;
    arb_t radius, before_radius, contribution_radius, staged_radius;
    arb_t weight_abs, weighted, translation_base, accumulation_delta;
    arb_init(center); arb_init(center_power); arb_init(scaled);
    arb_init(contribution); arb_init(centered); arb_init(accumulated);
    arb_init(radius); arb_init(before_radius); arb_init(contribution_radius);
    arb_init(staged_radius); arb_init(weight_abs); arb_init(weighted);
    arb_init(translation_base); arb_init(accumulation_delta);
    arb_add(center, input.target_left, input.target_right, kPrecisionBits);
    arb_mul_2exp_si(center, center, -1L);
    arb_zero(centered);

    for (unsigned degree = target_degree; degree <= maximum_degree && ok;
         ++degree) {
        DegreeRadiusAttribution &entry =
            *attribution->by_global_t_degree[degree];
        arb_pow_ui(center_power, center,
                   static_cast<ulong>(degree - target_degree),
                   kPrecisionBits);
        multiply_binomial(scaled, global_t.at(degree), degree, target_degree);
        arb_mul(contribution, scaled, center_power, kPrecisionBits);
        arb_get_rad_arb(contribution_radius, contribution);

        arb_set(weight_abs, center_power);
        arb_abs(weight_abs, weight_abs);
        fmpz_t binomial;
        fmpz_init(binomial);
        fmpz_bin_uiui(binomial, static_cast<ulong>(degree),
                      static_cast<ulong>(target_degree));
        arb_mul_fmpz(weight_abs, weight_abs, binomial, kPrecisionBits);
        fmpz_clear(binomial);

        arb_mul(entry.f_coefficient, entry.f_coefficient, weight_abs,
                kPrecisionBits);
        arb_mul(entry.gprime_coefficient, entry.gprime_coefficient,
                weight_abs, kPrecisionBits);
        arb_mul(entry.prepared_moment, entry.prepared_moment, weight_abs,
                kPrecisionBits);
        arb_mul(entry.product_rounding, entry.product_rounding, weight_abs,
                kPrecisionBits);

        arb_zero(staged_radius);
        add_exact(staged_radius, entry.f_coefficient);
        add_exact(staged_radius, entry.gprime_coefficient);
        add_exact(staged_radius, entry.prepared_moment);
        add_exact(staged_radius, entry.product_rounding);
        arb_get_rad_arb(radius, global_t.at(degree));
        arb_mul(weighted, radius, weight_abs, kPrecisionBits);
        if (!radius_delta(accumulation_delta, weighted, staged_radius)) {
            arb_zero(accumulation_delta);
        }
        add_exact(entry.absolute_accumulation, accumulation_delta);
        if (!radius_delta(translation_base, contribution_radius, weighted)) {
            arb_zero(translation_base);
        }
        add_exact(entry.translation_weight, translation_base);

        arb_get_rad_arb(before_radius, centered);
        arb_add(accumulated, centered, contribution, kPrecisionBits);
        arb_set(centered, accumulated);
        arb_get_rad_arb(radius, centered);
        arb_add(staged_radius, before_radius, contribution_radius,
                kPrecisionBits);
        if (!radius_delta(accumulation_delta, radius, staged_radius)) {
            arb_zero(accumulation_delta);
        }
        add_exact(entry.absolute_accumulation, accumulation_delta);

        add_exact(attribution->f_coefficient_total, entry.f_coefficient);
        add_exact(attribution->gprime_coefficient_total,
                  entry.gprime_coefficient);
        add_exact(attribution->prepared_moment_total, entry.prepared_moment);
        add_exact(attribution->product_rounding_total, entry.product_rounding);
        add_exact(attribution->translation_weight_total,
                  entry.translation_weight);
        add_exact(attribution->absolute_accumulation_total,
                  entry.absolute_accumulation);
    }
    if (ok) {
        arb_get_rad_arb(attribution->observed_integrated_radius, centered);
        arb_zero(attribution->reconstructed_integrated_radius);
        add_exact(attribution->reconstructed_integrated_radius,
                  attribution->f_coefficient_total);
        add_exact(attribution->reconstructed_integrated_radius,
                  attribution->gprime_coefficient_total);
        add_exact(attribution->reconstructed_integrated_radius,
                  attribution->prepared_moment_total);
        add_exact(attribution->reconstructed_integrated_radius,
                  attribution->product_rounding_total);
        add_exact(attribution->reconstructed_integrated_radius,
                  attribution->translation_weight_total);
        add_exact(attribution->reconstructed_integrated_radius,
                  attribution->absolute_accumulation_total);
        attribution->exact_radius_reconstruction = arb_equal(
            attribution->reconstructed_integrated_radius,
            attribution->observed_integrated_radius);
        attribution->exact_observed_integrated_match = arb_equal(
            centered, predecessor_attribution->integrated_centered_component);
        attribution->origin_channels_complete =
            finite(attribution->f_coefficient_total)
            && finite(attribution->gprime_coefficient_total)
            && finite(attribution->prepared_moment_total)
            && finite(attribution->product_rounding_total)
            && finite(attribution->translation_weight_total)
            && finite(attribution->absolute_accumulation_total)
            && !arb_is_negative(attribution->f_coefficient_total)
            && !arb_is_negative(attribution->gprime_coefficient_total)
            && !arb_is_negative(attribution->prepared_moment_total)
            && !arb_is_negative(attribution->product_rounding_total)
            && !arb_is_negative(attribution->translation_weight_total)
            && !arb_is_negative(attribution->absolute_accumulation_total);
        attribution->evaluated = attribution->exact_observed_integrated_match
            && attribution->origin_channels_complete;
        ok = attribution->evaluated;
    }
    arb_clear(accumulation_delta); arb_clear(translation_base);
    arb_clear(weighted); arb_clear(weight_abs); arb_clear(staged_radius);
    arb_clear(contribution_radius); arb_clear(before_radius); arb_clear(radius);
    arb_clear(accumulated); arb_clear(centered); arb_clear(contribution);
    arb_clear(scaled); arb_clear(center_power); arb_clear(center);
    return ok;
}

}  // namespace nhm2::g2h_e_s5::primary_c08_h2_p8m_term_radius_attribution_v1
