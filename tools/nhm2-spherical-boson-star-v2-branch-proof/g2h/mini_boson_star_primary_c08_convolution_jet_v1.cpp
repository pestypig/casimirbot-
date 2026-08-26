#include "mini_boson_star_primary_c08_convolution_jet_v1.hpp"

#include <algorithm>

namespace nhm2::g2h_e_s5::primary_c08_convolution_jet_v1 {
namespace {

constexpr slong kPrecisionBits = 512;
constexpr unsigned kCoefficientCapacity =
    bivariate::kMaximumRetainedXiDegree + 1U;

bool finite(arb_srcptr value) {
    return value != nullptr && arb_is_finite(value);
}

void fail(Result *result, FailureDetail detail) {
    *result = Result{};
    result->detail = detail;
}

void reset(Output &output) {
    arb_zero(output.target_center); arb_zero(output.target_half_width);
    for (auto &value : output.retained_xi_coefficients) arb_zero(&value);
    for (auto &value : output.uniform_remainder_bounds) arb_zero(&value);
    output.retained_order = 0U;
}

bool set_exact_upper(arb_ptr target, arb_srcptr value) {
    if (!finite(value)) return false;
    arb_t absolute;
    arf_t upper;
    arb_init(absolute); arf_init(upper);
    arb_abs(absolute, value);
    arb_get_ubound_arf(upper, absolute, kPrecisionBits);
    arb_set_arf(target, upper);
    const bool accepted = arb_is_finite(target) && arb_is_exact(target)
        && !arb_is_negative(target);
    arf_clear(upper); arb_clear(absolute);
    return accepted;
}

bool add_positive(arb_ptr accumulator, arb_srcptr value) {
    if (!finite(value) || arb_is_negative(value)) return false;
    arb_t next;
    arb_init(next); arb_add(next, accumulator, value, kPrecisionBits);
    arb_set(accumulator, next);
    const bool accepted = arb_is_finite(accumulator)
        && !arb_is_negative(accumulator);
    arb_clear(next);
    return accepted;
}

bool selected_model_bounds(const ledger::LedgerView &ledger_view,
                           const std::vector<std::size_t> &ordinals,
                           std::size_t jet, arb_ptr polynomial_magnitude,
                           arb_ptr remainder_magnitude) {
    arb_zero(polynomial_magnitude); arb_zero(remainder_magnitude);
    arb_t width, power, magnitude, term, sum, next, upper;
    arb_init(width); arb_init(power); arb_init(magnitude); arb_init(term);
    arb_init(sum); arb_init(next); arb_init(upper);
    bool accepted = !ordinals.empty();
    for (const std::size_t ordinal : ordinals) {
        const ledger::ModelView &model = ledger_view.models[ordinal];
        arb_sub(width, model.right_endpoint, model.left_endpoint,
                kPrecisionBits);
        arb_one(power); arb_zero(sum);
        for (unsigned degree = 0U; degree <= model.order; ++degree) {
            arb_abs(magnitude, model.coefficients
                + static_cast<std::size_t>(degree) * kJetCount + jet);
            arb_mul(term, magnitude, power, kPrecisionBits);
            arb_add(next, sum, term, kPrecisionBits); arb_set(sum, next);
            arb_mul(next, power, width, kPrecisionBits); arb_set(power, next);
        }
        if (!set_exact_upper(upper, sum)) { accepted = false; break; }
        if (arb_lt(polynomial_magnitude, upper))
            arb_set(polynomial_magnitude, upper);
        if (!set_exact_upper(upper, model.remainders + jet)) {
            accepted = false; break;
        }
        if (arb_lt(remainder_magnitude, upper))
            arb_set(remainder_magnitude, upper);
    }
    arb_clear(upper); arb_clear(next); arb_clear(sum); arb_clear(term);
    arb_clear(magnitude); arb_clear(power); arb_clear(width);
    return accepted && arb_is_finite(polynomial_magnitude)
        && arb_is_finite(remainder_magnitude);
}

bool affine_radius_bound(arb_ptr output, const bivariate::Output &elementary) {
    arb_t radius, power, term, sum, next;
    arb_init(radius); arb_init(power); arb_init(term); arb_init(sum);
    arb_init(next); arb_one(power); arb_zero(sum);
    for (unsigned degree = 0U; degree <= elementary.retained_order; ++degree) {
        arb_get_rad_arb(radius, elementary.coefficient(degree));
        arb_mul(term, radius, power, kPrecisionBits);
        arb_add(next, sum, term, kPrecisionBits); arb_set(sum, next);
        arb_mul(next, power, elementary.target_half_width, kPrecisionBits);
        arb_set(power, next);
    }
    const bool accepted = set_exact_upper(output, sum);
    arb_clear(next); arb_clear(sum); arb_clear(term); arb_clear(power);
    arb_clear(radius);
    return accepted;
}

bool elementary_remainder(
    arb_ptr output, const Input &input, std::size_t f_jet,
    std::size_t g_jet, const bivariate::Output &elementary,
    const std::vector<std::size_t> &f_ordinals,
    const std::vector<std::size_t> &g_ordinals) {
    arb_t pf, pg, rf, rg, effective_rf, effective_rg, product1, product2,
        product3, cross, next, u_width, scale, integrated, affine, boundary,
        boundary_value, current_rf, total;
    arb_init(pf); arb_init(pg); arb_init(rf); arb_init(rg);
    arb_init(effective_rf); arb_init(effective_rg); arb_init(product1);
    arb_init(product2); arb_init(product3); arb_init(cross); arb_init(next);
    arb_init(u_width); arb_init(scale); arb_init(integrated); arb_init(affine);
    arb_init(boundary); arb_init(boundary_value); arb_init(current_rf);
    arb_init(total); arb_zero(total);

    bool accepted = selected_model_bounds(input.f_ledger, f_ordinals, f_jet,
                                           pf, rf)
        && selected_model_bounds(input.gprime_ledger, g_ordinals, g_jet,
                                 pg, rg);
    if (accepted) {
        arb_add(effective_rf, rf, elementary.f_source_hull_radius_bound,
                kPrecisionBits);
        arb_add(effective_rg, rg, elementary.gprime_source_hull_radius_bound,
                kPrecisionBits);
        // Complete positive cross-term formula; no subtraction is present.
        arb_mul(product1, pf, effective_rg, kPrecisionBits);
        arb_mul(product2, pg, effective_rf, kPrecisionBits);
        arb_mul(product3, effective_rf, effective_rg, kPrecisionBits);
        arb_add(next, product1, product2, kPrecisionBits);
        arb_add(cross, next, product3, kPrecisionBits);
        arb_sub(u_width, input.u_right, input.u_left, kPrecisionBits);
        arb_mul(scale, input.target_right, u_width, kPrecisionBits);
        arb_mul(integrated, scale, cross, kPrecisionBits);
        accepted = affine_radius_bound(affine, elementary)
            && set_exact_upper(current_rf,
                input.f_ledger.models[input.f_ledger.model_count - 1U]
                    .remainders + f_jet)
            && set_exact_upper(boundary_value,
                               input.g_at_zero_jets + g_jet);
    }
    if (accepted) {
        arb_add(next, current_rf, elementary.f_source_hull_radius_bound,
                kPrecisionBits);
        arb_mul(boundary, next, boundary_value, kPrecisionBits);
        accepted = add_positive(total, integrated)
            && add_positive(total, elementary.discarded_xi_tail_bound)
            && add_positive(total, affine)
            && add_positive(total, boundary)
            && set_exact_upper(output, total);
    }

    arb_clear(total); arb_clear(current_rf); arb_clear(boundary_value);
    arb_clear(boundary); arb_clear(affine); arb_clear(integrated);
    arb_clear(scale); arb_clear(u_width); arb_clear(next); arb_clear(cross);
    arb_clear(product3); arb_clear(product2); arb_clear(product1);
    arb_clear(effective_rg); arb_clear(effective_rf); arb_clear(rg);
    arb_clear(rf); arb_clear(pg); arb_clear(pf);
    return accepted;
}

bool add_elementary(const Input &input, std::size_t f_jet,
                    std::size_t g_jet, std::size_t destination_jet,
                    const std::vector<std::size_t> &f_ordinals,
                    const std::vector<std::size_t> &g_ordinals,
                    Output &output, Result &result) {
    bivariate::Input predecessor{input.f_ledger, input.gprime_ledger,
        input.target_left, input.target_right, input.target_order,
        input.u_left, input.u_right, f_jet, g_jet,
        input.g_at_zero_jets + g_jet};
    bivariate::Output elementary;
    bivariate::Result predecessor_result{};
    if (!bivariate::evaluate(predecessor, &elementary, &predecessor_result))
        return false;
    if (result.elementary_convolutions == 0U) {
        output.retained_order = elementary.retained_order;
        arb_set(output.target_center, elementary.target_center);
        arb_set(output.target_half_width, elementary.target_half_width);
    } else if (output.retained_order != elementary.retained_order
               || !arb_equal(output.target_center, elementary.target_center)
               || !arb_equal(output.target_half_width,
                             elementary.target_half_width)) {
        return false;
    }

    arb_t next, remainder;
    arb_init(next); arb_init(remainder);
    for (unsigned degree = 0U; degree <= output.retained_order; ++degree) {
        arb_add(next, output.coefficient(degree, destination_jet),
                elementary.coefficient(degree), kPrecisionBits);
        arb_set(output.coefficient(degree, destination_jet), next);
    }
    bool accepted = elementary_remainder(remainder, input, f_jet, g_jet,
                                         elementary, f_ordinals, g_ordinals);
    if (accepted) {
        arb_add(next, output.remainder(destination_jet), remainder,
                kPrecisionBits);
        arb_set(output.remainder(destination_jet), next);
        accepted = arb_is_finite(output.remainder(destination_jet))
            && !arb_is_negative(output.remainder(destination_jet));
    }
    arb_clear(remainder); arb_clear(next);
    if (!accepted) return false;
    ++result.elementary_convolutions;
    result.positive_remainder_cross_terms += 3U;
    ++result.discarded_polynomial_terms;
    ++result.affine_composition_terms;
    result.source_hull_terms += 2U;
    return true;
}

}  // namespace

Output::Output()
    : retained_xi_coefficients(
          static_cast<std::size_t>(kCoefficientCapacity) * kJetCount),
      uniform_remainder_bounds(kJetCount) {
    arb_init(target_center); arb_init(target_half_width);
    for (auto &value : retained_xi_coefficients) arb_init(&value);
    for (auto &value : uniform_remainder_bounds) arb_init(&value);
    reset(*this);
}

Output::~Output() {
    for (auto &value : uniform_remainder_bounds) arb_clear(&value);
    for (auto &value : retained_xi_coefficients) arb_clear(&value);
    arb_clear(target_half_width); arb_clear(target_center);
}

arb_ptr Output::coefficient(unsigned degree, std::size_t jet) {
    return retained_xi_coefficients.data()
        + static_cast<std::size_t>(degree) * kJetCount + jet;
}

arb_srcptr Output::coefficient(unsigned degree, std::size_t jet) const {
    return retained_xi_coefficients.data()
        + static_cast<std::size_t>(degree) * kJetCount + jet;
}

arb_ptr Output::remainder(std::size_t jet) {
    return uniform_remainder_bounds.data() + jet;
}

arb_srcptr Output::remainder(std::size_t jet) const {
    return uniform_remainder_bounds.data() + jet;
}

bool evaluate(const Input &input, Output *output, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (output == nullptr) {
        fail(result, FailureDetail::missing_output);
        return false;
    }
    reset(*output);
    if (input.g_at_zero_count != kJetCount
        || input.g_at_zero_jets == nullptr) {
        fail(result, FailureDetail::invalid_jet_inventory);
        return false;
    }
    for (std::size_t jet = 0U; jet < kJetCount; ++jet) {
        if (!finite(input.g_at_zero_jets + jet)) {
            fail(result, FailureDetail::invalid_jet_inventory);
            return false;
        }
    }

    ledger::Input coverage_input_f{input.f_ledger, input.target_left,
        input.target_right, input.u_left, input.u_right};
    ledger::Output coverage_f;
    ledger::Result coverage_result_f{};
    ledger::Input coverage_input_g{input.gprime_ledger, input.target_left,
        input.target_right, input.u_left, input.u_right};
    ledger::Output coverage_g;
    ledger::Result coverage_result_g{};
    if (!ledger::evaluate(coverage_input_f, &coverage_f, &coverage_result_f)
        || !ledger::evaluate(coverage_input_g, &coverage_g,
                             &coverage_result_g)) {
        fail(result, FailureDetail::bivariate_predecessor);
        return false;
    }
    const auto &f_ordinals = coverage_f.direct_intersecting_ordinals;
    const auto &g_ordinals = coverage_g.reflected_intersecting_ordinals;

    if (!add_elementary(input, value_jet(), value_jet(), value_jet(),
                        f_ordinals, g_ordinals, *output, *result)) {
        fail(result, FailureDetail::bivariate_predecessor);
        return false;
    }
    result->base_terms = 1U;
    for (std::size_t a = 0U; a < kParameterCount; ++a) {
        const std::size_t first = first_jet(a);
        if (!add_elementary(input, first, value_jet(), first,
                            f_ordinals, g_ordinals, *output, *result)
            || !add_elementary(input, value_jet(), first, first,
                               f_ordinals, g_ordinals, *output, *result)) {
            fail(result, FailureDetail::nonfinite_remainder_or_assembly);
            return false;
        }
        result->first_terms += 2U;
    }
    for (std::size_t a = 0U; a < kParameterCount; ++a) {
        for (std::size_t b = 0U; b < kParameterCount; ++b) {
            const std::size_t destination = second_jet(a, b);
            if (!add_elementary(input, destination, value_jet(), destination,
                                f_ordinals, g_ordinals, *output, *result)
                || !add_elementary(input, first_jet(a), first_jet(b),
                                   destination, f_ordinals, g_ordinals,
                                   *output, *result)
                || !add_elementary(input, first_jet(b), first_jet(a),
                                   destination, f_ordinals, g_ordinals,
                                   *output, *result)
                || !add_elementary(input, value_jet(), destination,
                                   destination, f_ordinals, g_ordinals,
                                   *output, *result)) {
                fail(result, FailureDetail::nonfinite_remainder_or_assembly);
                return false;
            }
            result->ordered_second_terms += 4U;
            result->mixed_orientation_terms += 2U;
        }
    }
    if (result->elementary_convolutions != kElementaryConvolutions) {
        fail(result, FailureDetail::nonfinite_remainder_or_assembly);
        return false;
    }
    for (std::size_t jet = 0U; jet < kJetCount; ++jet) {
        if (!arb_is_finite(output->remainder(jet))
            || arb_is_negative(output->remainder(jet))) {
            fail(result, FailureDetail::nonfinite_remainder_or_assembly);
            return false;
        }
        for (unsigned degree = 0U; degree <= output->retained_order; ++degree)
            if (!arb_is_finite(output->coefficient(degree, jet))) {
                fail(result, FailureDetail::nonfinite_remainder_or_assembly);
                return false;
            }
    }

    result->accepted = true;
    result->detail = FailureDetail::none;
    result->complete_ordered_13_jet_inventory = true;
    result->both_mixed_orientations_retained = true;
    result->signed_remainder_cancellation_used = false;
    result->midpoint_selection_used = false;
    result->point_sampling_used = false;
    return true;
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::missing_output: return "C08-010C_MISSING_OUTPUT";
    case FailureDetail::invalid_jet_inventory:
        return "C08-010C_INVALID_JET_INVENTORY";
    case FailureDetail::bivariate_predecessor:
        return "C08-010C_BIVARIATE_PREDECESSOR";
    case FailureDetail::nonfinite_remainder_or_assembly:
        return "C08-010C_NONFINITE_REMAINDER_OR_ASSEMBLY";
    }
    return "C08-010C_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_convolution_jet_v1
