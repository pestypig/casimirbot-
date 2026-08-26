#include "mini_boson_star_primary_c08_convolution_bivariate_v1.hpp"

#include <flint/fmpz.h>

#include <algorithm>
#include <array>
#include <limits>
#include <utility>

namespace nhm2::g2h_e_s5::primary_c08_convolution_bivariate_v1 {
namespace {

constexpr slong kPrecisionBits = 512;
constexpr std::array<unsigned, 7U> kTargetOrders = {
    24U, 32U, 48U, 64U, 96U, 128U, 192U};

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

bool contains_target_order(unsigned order) {
    return std::find(kTargetOrders.begin(), kTargetOrders.end(), order)
        != kTargetOrders.end();
}

bool finite(arb_srcptr value) {
    return value != nullptr && arb_is_finite(value);
}

bool exact_finite(arb_srcptr value) {
    return finite(value) && arb_is_exact(value);
}

void fail(Result *result, FailureDetail detail) {
    *result = Result{};
    result->detail = detail;
}

void reset(Output &output) {
    arb_zero(output.target_center);
    arb_zero(output.target_half_width);
    arb_zero(output.discarded_xi_tail_bound);
    arb_zero(output.f_source_hull_radius_bound);
    arb_zero(output.gprime_source_hull_radius_bound);
    for (auto &coefficient : output.retained_xi_coefficients)
        arb_zero(&coefficient);
    output.retained_order = 0U;
}

bool all_finite(const BallVector &values) {
    for (const auto &value : values.values)
        if (!arb_is_finite(&value)) return false;
    return true;
}

void multiply_binomial(arb_ptr output, arb_srcptr input,
                       unsigned n, unsigned k) {
    fmpz_t binomial;
    fmpz_init(binomial);
    fmpz_bin_uiui(binomial, static_cast<ulong>(n), static_cast<ulong>(k));
    arb_mul_fmpz(output, input, binomial, kPrecisionBits);
    fmpz_clear(binomial);
}

bool set_exact_upper(arb_ptr target, arb_srcptr value) {
    if (!finite(value)) return false;
    arb_t absolute;
    arf_t upper;
    arb_init(absolute); arf_init(upper);
    arb_abs(absolute, value);
    arb_get_ubound_arf(upper, absolute, kPrecisionBits);
    arb_set_arf(target, upper);
    const bool accepted = arb_is_finite(target) && !arb_is_negative(target)
        && arb_is_exact(target);
    arf_clear(upper); arb_clear(absolute);
    return accepted;
}

unsigned maximum_order(const ledger::LedgerView &ledger_view,
                       const std::vector<std::size_t> &ordinals) {
    unsigned result = 0U;
    for (const std::size_t ordinal : ordinals)
        result = std::max(result, ledger_view.models[ordinal].order);
    return result;
}

unsigned minimum_order(const ledger::LedgerView &ledger_view,
                       const std::vector<std::size_t> &ordinals) {
    unsigned result = std::numeric_limits<unsigned>::max();
    for (const std::size_t ordinal : ordinals)
        result = std::min(result, ledger_view.models[ordinal].order);
    return result;
}

// Translate every selected left-centered local polynomial into global powers
// of s, then take an independent coefficient hull.  The coefficient product
// hull is conservative: every complete selected source polynomial is retained,
// while no source point or midpoint is selected.
bool translated_source_hull(const ledger::LedgerView &ledger_view,
                            const std::vector<std::size_t> &ordinals,
                            std::size_t jet, BallVector &hull,
                            std::size_t *translation_terms) {
    if (ordinals.empty()) return false;
    const unsigned max_order = static_cast<unsigned>(hull.values.size() - 1U);
    bool first = true;
    arb_t power, scaled, term, next, negative_center;
    arb_init(power); arb_init(scaled); arb_init(term); arb_init(next);
    arb_init(negative_center);
    for (const std::size_t ordinal : ordinals) {
        const ledger::ModelView &model = ledger_view.models[ordinal];
        BallVector translated(static_cast<std::size_t>(max_order) + 1U);
        arb_neg(negative_center, model.expansion_center);
        for (unsigned local_degree = 0U; local_degree <= model.order;
             ++local_degree) {
            arb_srcptr coefficient = model.coefficients
                + static_cast<std::size_t>(local_degree) * kJetCount + jet;
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
                ++*translation_terms;
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

bool source_hull_radius(arb_ptr output, const BallVector &hull,
                        arb_srcptr target_right) {
    arb_t radius, power, term, sum, next;
    arb_init(radius); arb_init(power); arb_init(term); arb_init(sum);
    arb_init(next); arb_one(power); arb_zero(sum);
    for (std::size_t degree = 0U; degree < hull.values.size(); ++degree) {
        arb_get_rad_arb(radius, hull.at(degree));
        arb_mul(term, radius, power, kPrecisionBits);
        arb_add(next, sum, term, kPrecisionBits);
        arb_set(sum, next);
        arb_mul(next, power, target_right, kPrecisionBits);
        arb_set(power, next);
    }
    const bool accepted = set_exact_upper(output, sum);
    arb_clear(next); arb_clear(sum); arb_clear(term); arb_clear(power);
    arb_clear(radius);
    return accepted;
}

// Directed exact-dyadic moment of u^a (1-u)^b.  The finite binomial identity
// eliminates the factorized bivariate monomial without quadrature sampling.
bool beta_moment(arb_ptr output, unsigned a, unsigned b,
                 const BallVector &left_powers,
                 const BallVector &right_powers) {
    arb_t difference, scaled, quotient, next;
    arb_init(difference); arb_init(scaled); arb_init(quotient); arb_init(next);
    arb_zero(output);
    for (unsigned j = 0U; j <= b; ++j) {
        const unsigned exponent = a + j + 1U;
        arb_sub(difference, right_powers.at(exponent),
                left_powers.at(exponent), kPrecisionBits);
        multiply_binomial(scaled, difference, b, j);
        arb_div_ui(quotient, scaled, static_cast<ulong>(exponent),
                   kPrecisionBits);
        if ((j & 1U) == 0U)
            arb_add(next, output, quotient, kPrecisionBits);
        else
            arb_sub(next, output, quotient, kPrecisionBits);
        arb_set(output, next);
    }
    const bool accepted = arb_is_finite(output);
    arb_clear(next); arb_clear(quotient); arb_clear(scaled);
    arb_clear(difference);
    return accepted;
}

void fill_powers(BallVector &powers, arb_srcptr base) {
    arb_one(powers.at(0U));
    for (std::size_t exponent = 1U; exponent < powers.values.size(); ++exponent)
        arb_mul(powers.at(exponent), powers.at(exponent - 1U), base,
                kPrecisionBits);
}

bool exact_same_panel(const ledger::LedgerView &ledger_view,
                      arb_srcptr left, arb_srcptr right) {
    if (ledger_view.model_count == 0U || ledger_view.models == nullptr)
        return false;
    const ledger::ModelView &last =
        ledger_view.models[ledger_view.model_count - 1U];
    return arb_equal(last.left_endpoint, left)
        && arb_equal(last.right_endpoint, right);
}

}  // namespace

Output::Output()
    : retained_xi_coefficients(kMaximumRetainedXiDegree + 1U) {
    arb_init(target_center); arb_init(target_half_width);
    arb_init(discarded_xi_tail_bound);
    arb_init(f_source_hull_radius_bound);
    arb_init(gprime_source_hull_radius_bound);
    for (auto &coefficient : retained_xi_coefficients)
        arb_init(&coefficient);
    reset(*this);
}

Output::~Output() {
    for (auto &coefficient : retained_xi_coefficients)
        arb_clear(&coefficient);
    arb_clear(gprime_source_hull_radius_bound);
    arb_clear(f_source_hull_radius_bound);
    arb_clear(discarded_xi_tail_bound);
    arb_clear(target_half_width); arb_clear(target_center);
}

arb_ptr Output::coefficient(unsigned degree) {
    return retained_xi_coefficients.data() + degree;
}

arb_srcptr Output::coefficient(unsigned degree) const {
    return retained_xi_coefficients.data() + degree;
}

bool evaluate(const Input &input, Output *output, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (output == nullptr) {
        fail(result, FailureDetail::missing_output);
        return false;
    }
    reset(*output);
    if (!exact_finite(input.target_left) || !exact_finite(input.target_right)
        || !exact_finite(input.u_left) || !exact_finite(input.u_right)
        || !finite(input.g_at_zero) || input.f_jet >= kJetCount
        || input.gprime_jet >= kJetCount
        || !contains_target_order(input.target_order)) {
        fail(result, FailureDetail::invalid_component_order_or_boundary);
        return false;
    }

    ledger::Input f_coverage_input{input.f_ledger, input.target_left,
        input.target_right, input.u_left, input.u_right};
    ledger::Output f_coverage;
    ledger::Result f_coverage_result{};
    if (!ledger::evaluate(f_coverage_input, &f_coverage,
                          &f_coverage_result)) {
        fail(result, FailureDetail::f_ledger_or_coverage);
        return false;
    }
    ledger::Input g_coverage_input{input.gprime_ledger, input.target_left,
        input.target_right, input.u_left, input.u_right};
    ledger::Output g_coverage;
    ledger::Result g_coverage_result{};
    if (!ledger::evaluate(g_coverage_input, &g_coverage,
                          &g_coverage_result)) {
        fail(result, FailureDetail::gprime_ledger_or_coverage);
        return false;
    }
    if (!exact_same_panel(input.f_ledger, input.target_left,
                          input.target_right)
        || !exact_same_panel(input.gprime_ledger, input.target_left,
                             input.target_right)) {
        fail(result, FailureDetail::target_not_current_panel);
        return false;
    }

    const auto &f_ordinals = f_coverage.direct_intersecting_ordinals;
    const auto &g_ordinals = g_coverage.reflected_intersecting_ordinals;
    const unsigned max_f_order = maximum_order(input.f_ledger, f_ordinals);
    const unsigned max_g_order = maximum_order(input.gprime_ledger, g_ordinals);
    if (max_f_order > kMaximumSourceOrder
        || max_g_order > kMaximumSourceOrder) {
        fail(result, FailureDetail::invalid_component_order_or_boundary);
        return false;
    }
    BallVector f_hull(static_cast<std::size_t>(max_f_order) + 1U);
    BallVector g_hull(static_cast<std::size_t>(max_g_order) + 1U);
    if (!translated_source_hull(input.f_ledger, f_ordinals, input.f_jet,
                                f_hull, &result->local_to_global_terms)
        || !translated_source_hull(input.gprime_ledger, g_ordinals,
                                   input.gprime_jet, g_hull,
                                   &result->local_to_global_terms)
        || !source_hull_radius(output->f_source_hull_radius_bound, f_hull,
                               input.target_right)
        || !source_hull_radius(output->gprime_source_hull_radius_bound, g_hull,
                               input.target_right)) {
        fail(result, FailureDetail::nonfinite_algebra);
        return false;
    }

    const unsigned maximum_u_power = max_f_order + max_g_order + 1U;
    BallVector left_powers(static_cast<std::size_t>(maximum_u_power) + 1U);
    BallVector right_powers(static_cast<std::size_t>(maximum_u_power) + 1U);
    fill_powers(left_powers, input.u_left);
    fill_powers(right_powers, input.u_right);
    BallVector global_t(static_cast<std::size_t>(maximum_u_power) + 1U);
    arb_t moment, product, term, next;
    arb_init(moment); arb_init(product); arb_init(term); arb_init(next);
    bool algebra_ok = true;
    for (unsigned a = 0U; a <= max_f_order && algebra_ok; ++a) {
        for (unsigned b = 0U; b <= max_g_order; ++b) {
            if (!beta_moment(moment, a, b, left_powers, right_powers)) {
                algebra_ok = false; break;
            }
            ++result->beta_moments_evaluated;
            arb_mul(product, f_hull.at(a), g_hull.at(b), kPrecisionBits);
            arb_mul(term, product, moment, kPrecisionBits);
            const unsigned t_degree = a + b + 1U;  // Full t Jacobian.
            arb_add(next, global_t.at(t_degree), term, kPrecisionBits);
            arb_set(global_t.at(t_degree), next);
            ++result->factorized_product_terms;
        }
    }
    arb_clear(next); arb_clear(term); arb_clear(product); arb_clear(moment);
    if (!algebra_ok || !all_finite(global_t)) {
        fail(result, FailureDetail::nonfinite_algebra);
        return false;
    }

    arb_add(output->target_center, input.target_left, input.target_right,
            kPrecisionBits);
    arb_mul_2exp_si(output->target_center, output->target_center, -1L);
    arb_sub(output->target_half_width, input.target_right, input.target_left,
            kPrecisionBits);
    arb_mul_2exp_si(output->target_half_width, output->target_half_width, -1L);

    BallVector centered(global_t.values.size());
    arb_t center_power, scaled, contribution, accumulated;
    arb_init(center_power); arb_init(scaled); arb_init(contribution);
    arb_init(accumulated);
    for (unsigned global_degree = 0U;
         global_degree < global_t.values.size(); ++global_degree) {
        for (unsigned xi_degree = 0U; xi_degree <= global_degree;
             ++xi_degree) {
            arb_pow_ui(center_power, output->target_center,
                       static_cast<ulong>(global_degree - xi_degree),
                       kPrecisionBits);
            multiply_binomial(scaled, global_t.at(global_degree),
                              global_degree, xi_degree);
            arb_mul(contribution, scaled, center_power, kPrecisionBits);
            arb_add(accumulated, centered.at(xi_degree), contribution,
                    kPrecisionBits);
            arb_set(centered.at(xi_degree), accumulated);
            ++result->centered_translation_terms;
        }
    }

    // F(t)G(0) uses the current left-centered F panel, translated exactly to
    // xi=t-t_center by t-target_left=half_width+xi.
    const ledger::ModelView &current_f =
        input.f_ledger.models[input.f_ledger.model_count - 1U];
    for (unsigned local_degree = 0U; local_degree <= current_f.order;
         ++local_degree) {
        arb_srcptr coefficient = current_f.coefficients
            + static_cast<std::size_t>(local_degree) * kJetCount + input.f_jet;
        for (unsigned xi_degree = 0U; xi_degree <= local_degree;
             ++xi_degree) {
            arb_pow_ui(center_power, output->target_half_width,
                       static_cast<ulong>(local_degree - xi_degree),
                       kPrecisionBits);
            multiply_binomial(scaled, coefficient, local_degree, xi_degree);
            arb_mul(contribution, scaled, center_power, kPrecisionBits);
            arb_mul(contribution, contribution, input.g_at_zero,
                    kPrecisionBits);
            arb_add(accumulated, centered.at(xi_degree), contribution,
                    kPrecisionBits);
            arb_set(centered.at(xi_degree), accumulated);
            ++result->centered_translation_terms;
        }
    }
    arb_clear(accumulated); arb_clear(contribution); arb_clear(scaled);
    arb_clear(center_power);
    if (!all_finite(centered)) {
        fail(result, FailureDetail::nonfinite_algebra);
        return false;
    }

    const unsigned retained_order = std::min({
        input.target_order,
        minimum_order(input.f_ledger, f_ordinals),
        minimum_order(input.gprime_ledger, g_ordinals)});
    if (retained_order > kMaximumRetainedXiDegree) {
        fail(result, FailureDetail::invalid_component_order_or_boundary);
        return false;
    }
    output->retained_order = retained_order;
    for (unsigned degree = 0U; degree <= retained_order; ++degree)
        arb_set(output->coefficient(degree), centered.at(degree));

    arb_t magnitude, power, tail_term, tail_sum, tail_next;
    arb_init(magnitude); arb_init(power); arb_init(tail_term);
    arb_init(tail_sum); arb_init(tail_next); arb_zero(tail_sum);
    arb_pow_ui(power, output->target_half_width,
               static_cast<ulong>(retained_order + 1U), kPrecisionBits);
    for (std::size_t degree = retained_order + 1U;
         degree < centered.values.size(); ++degree) {
        arb_abs(magnitude, centered.at(degree));
        arb_mul(tail_term, magnitude, power, kPrecisionBits);
        arb_add(tail_next, tail_sum, tail_term, kPrecisionBits);
        arb_set(tail_sum, tail_next);
        arb_mul(tail_next, power, output->target_half_width, kPrecisionBits);
        arb_set(power, tail_next);
    }
    const bool tail_ok = set_exact_upper(output->discarded_xi_tail_bound,
                                         tail_sum);
    arb_clear(tail_next); arb_clear(tail_sum); arb_clear(tail_term);
    arb_clear(power); arb_clear(magnitude);
    if (!tail_ok) {
        fail(result, FailureDetail::nonfinite_algebra);
        return false;
    }

    result->accepted = true;
    result->detail = FailureDetail::none;
    result->direct_models_composed = f_ordinals.size();
    result->reflected_models_composed = g_ordinals.size();
    result->exact_factorized_bivariate_elimination = true;
    result->exact_dyadic_u_integration = true;
    result->boundary_term_retained = true;
    result->discarded_xi_tail_retained = true;
    result->midpoint_selection_used = false;
    result->point_sampling_used = false;
    return true;
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::missing_output: return "C08-010B_MISSING_OUTPUT";
    case FailureDetail::invalid_component_order_or_boundary:
        return "C08-010B_INVALID_COMPONENT_ORDER_OR_BOUNDARY";
    case FailureDetail::f_ledger_or_coverage:
        return "C08-010B_F_LEDGER_OR_COVERAGE";
    case FailureDetail::gprime_ledger_or_coverage:
        return "C08-010B_GPRIME_LEDGER_OR_COVERAGE";
    case FailureDetail::target_not_current_panel:
        return "C08-010B_TARGET_NOT_CURRENT_PANEL";
    case FailureDetail::nonfinite_algebra:
        return "C08-010B_NONFINITE_ALGEBRA";
    }
    return "C08-010B_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_convolution_bivariate_v1
