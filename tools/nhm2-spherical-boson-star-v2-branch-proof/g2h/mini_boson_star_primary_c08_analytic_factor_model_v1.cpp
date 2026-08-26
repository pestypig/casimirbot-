#include "mini_boson_star_primary_c08_analytic_factor_model_v1.hpp"

#include <arf.h>

#include <array>

namespace nhm2::g2h_e_s5::primary_c08_analytic_factor_model_v1 {
namespace {

struct Jet {
    std::array<arb_struct, kJetCount> values;
    Jet() { for (auto &value : values) arb_init(&value); }
    ~Jet() { for (auto &value : values) arb_clear(&value); }
    Jet(const Jet &) = delete;
    Jet &operator=(const Jet &) = delete;
    arb_ptr at(std::size_t index) { return values.data() + index; }
    arb_srcptr at(std::size_t index) const { return values.data() + index; }
};

bool finite(arb_srcptr value) {
    return value != nullptr && arb_is_finite(value);
}

void jet_zero(Jet &jet) {
    for (auto &value : jet.values) arb_zero(&value);
}

void jet_one(Jet &jet) {
    jet_zero(jet); arb_one(jet.at(analytic::value_jet()));
}

void jet_set(Jet &target, const Jet &source) {
    for (std::size_t index = 0U; index < kJetCount; ++index)
        arb_set(target.at(index), source.at(index));
}

void jet_load(Jet &target,
              const std::array<arb_struct, kJetCount> &source) {
    for (std::size_t index = 0U; index < kJetCount; ++index)
        arb_set(target.at(index), source.data() + index);
}

bool jet_finite(const Jet &jet) {
    for (std::size_t index = 0U; index < kJetCount; ++index)
        if (!finite(jet.at(index))) return false;
    return true;
}

void jet_add(Jet &output, const Jet &left, const Jet &right) {
    for (std::size_t index = 0U; index < kJetCount; ++index)
        arb_add(output.at(index), left.at(index), right.at(index),
                kPrecisionBits);
}

void jet_neg(Jet &output, const Jet &source) {
    for (std::size_t index = 0U; index < kJetCount; ++index)
        arb_neg(output.at(index), source.at(index));
}

void jet_scale_arb(Jet &output, const Jet &source, arb_srcptr scalar) {
    for (std::size_t index = 0U; index < kJetCount; ++index)
        arb_mul(output.at(index), source.at(index), scalar, kPrecisionBits);
}

void jet_scale_si(Jet &output, const Jet &source, long scalar) {
    for (std::size_t index = 0U; index < kJetCount; ++index)
        arb_mul_si(output.at(index), source.at(index), scalar,
                   kPrecisionBits);
}

void jet_div_ui(Jet &output, const Jet &source, unsigned long divisor) {
    for (std::size_t index = 0U; index < kJetCount; ++index)
        arb_div_ui(output.at(index), source.at(index), divisor,
                   kPrecisionBits);
}

void jet_mul(Jet &output, const Jet &left, const Jet &right) {
    Jet temporary;
    arb_mul(temporary.at(analytic::value_jet()),
            left.at(analytic::value_jet()),
            right.at(analytic::value_jet()), kPrecisionBits);
    arb_t term;
    arb_init(term);
    for (std::size_t a = 0U; a < analytic::kParameterCount; ++a) {
        arb_mul(temporary.at(analytic::first_jet(a)),
                left.at(analytic::first_jet(a)),
                right.at(analytic::value_jet()), kPrecisionBits);
        arb_mul(term, left.at(analytic::value_jet()),
                right.at(analytic::first_jet(a)), kPrecisionBits);
        arb_add(temporary.at(analytic::first_jet(a)),
                temporary.at(analytic::first_jet(a)), term,
                kPrecisionBits);
    }
    for (std::size_t a = 0U; a < analytic::kParameterCount; ++a) {
        for (std::size_t b = 0U; b < analytic::kParameterCount; ++b) {
            const std::size_t index = analytic::second_jet(a, b);
            arb_mul(temporary.at(index), left.at(index),
                    right.at(analytic::value_jet()), kPrecisionBits);
            arb_mul(term, left.at(analytic::first_jet(a)),
                    right.at(analytic::first_jet(b)), kPrecisionBits);
            arb_add(temporary.at(index), temporary.at(index), term,
                    kPrecisionBits);
            arb_mul(term, left.at(analytic::first_jet(b)),
                    right.at(analytic::first_jet(a)), kPrecisionBits);
            arb_add(temporary.at(index), temporary.at(index), term,
                    kPrecisionBits);
            arb_mul(term, left.at(analytic::value_jet()), right.at(index),
                    kPrecisionBits);
            arb_add(temporary.at(index), temporary.at(index), term,
                    kPrecisionBits);
        }
    }
    arb_clear(term);
    jet_set(output, temporary);
}

void jet_exp(Jet &output, const Jet &source) {
    Jet temporary;
    arb_exp(temporary.at(analytic::value_jet()),
            source.at(analytic::value_jet()), kPrecisionBits);
    arb_t sum, term;
    arb_init(sum); arb_init(term);
    for (std::size_t a = 0U; a < analytic::kParameterCount; ++a)
        arb_mul(temporary.at(analytic::first_jet(a)),
                temporary.at(analytic::value_jet()),
                source.at(analytic::first_jet(a)), kPrecisionBits);
    for (std::size_t a = 0U; a < analytic::kParameterCount; ++a) {
        for (std::size_t b = 0U; b < analytic::kParameterCount; ++b) {
            arb_mul(term, source.at(analytic::first_jet(a)),
                    source.at(analytic::first_jet(b)), kPrecisionBits);
            arb_add(sum, source.at(analytic::second_jet(a, b)), term,
                    kPrecisionBits);
            arb_mul(temporary.at(analytic::second_jet(a, b)),
                    temporary.at(analytic::value_jet()), sum,
                    kPrecisionBits);
        }
    }
    arb_clear(term); arb_clear(sum);
    jet_set(output, temporary);
}

void store_jet(std::vector<arb_struct> &storage, unsigned degree,
               const Jet &jet) {
    const std::size_t offset = static_cast<std::size_t>(degree) * kJetCount;
    for (std::size_t index = 0U; index < kJetCount; ++index)
        arb_set(storage.data() + offset + index, jet.at(index));
}

bool exact_endpoint(arb_srcptr value) {
    return finite(value) && arb_is_exact(value);
}

bool admitted_order(ledger::ModelKind kind, unsigned order) {
    constexpr std::array<unsigned, 7U> origins =
        {32U, 48U, 64U, 96U, 128U, 192U, 256U};
    constexpr std::array<unsigned, 7U> positives =
        {24U, 32U, 48U, 64U, 96U, 128U, 192U};
    const auto &orders = kind == ledger::ModelKind::origin
        ? origins : positives;
    for (const unsigned candidate : orders)
        if (candidate == order) return true;
    return false;
}

bool valid_input(const Input &input) {
    if (input.parameters == nullptr || !exact_endpoint(input.left_endpoint)
        || !exact_endpoint(input.right_endpoint)
        || !arb_lt(input.left_endpoint, input.right_endpoint)
        || !admitted_order(input.kind, input.order))
        return false;
    arb_t zero;
    arb_init(zero); arb_zero(zero);
    const bool chronology =
        (input.ordinal == 0U && input.kind == ledger::ModelKind::origin
         && arb_equal(input.left_endpoint, zero))
        || (input.ordinal > 0U
            && input.kind == ledger::ModelKind::positive_panel
            && arb_is_positive(input.left_endpoint));
    arb_clear(zero);
    return chronology;
}

bool upper_magnitude(arb_t output, arb_srcptr value) {
    if (!finite(value)) return false;
    arb_t absolute;
    arf_t upper;
    arb_init(absolute); arf_init(upper); arb_abs(absolute, value);
    arb_get_ubound_arf(upper, absolute, kPrecisionBits);
    arb_set_arf(output, upper);
    arf_clear(upper); arb_clear(absolute);
    return finite(output) && arb_is_nonnegative(output);
}

void clear_storage(Output &output) {
    for (auto &factor : output.remainders) {
        for (auto &value : factor) arb_clear(&value);
        factor.clear();
    }
    for (auto &factor : output.coefficients) {
        for (auto &value : factor) arb_clear(&value);
        factor.clear();
    }
}

void reset(Output &output) {
    clear_storage(output);
    output.ordinal = 0U; output.kind = ledger::ModelKind::origin;
    output.order = 0U;
    arb_zero(output.left_endpoint); arb_zero(output.right_endpoint);
    arb_zero(output.expansion_center);
}

bool allocate(Output &output, unsigned order) {
    const std::size_t coefficient_count =
        (static_cast<std::size_t>(order) + 1U) * kJetCount;
    for (std::size_t factor = 0U; factor < kFactorCount; ++factor) {
        output.coefficients[factor].resize(coefficient_count);
        output.remainders[factor].resize(kJetCount);
        for (auto &value : output.coefficients[factor]) {
            arb_init(&value); arb_zero(&value);
        }
        for (auto &value : output.remainders[factor]) {
            arb_init(&value); arb_zero(&value);
        }
    }
    return true;
}

bool polynomial_range(arb_t output, const std::vector<arb_struct> &storage,
                      unsigned order, std::size_t jet, arb_srcptr x_interval) {
    arb_set(output, storage.data()
        + static_cast<std::size_t>(order) * kJetCount + jet);
    for (unsigned degree = order; degree-- > 0U;) {
        arb_mul(output, output, x_interval, kPrecisionBits);
        arb_add(output, output, storage.data()
            + static_cast<std::size_t>(degree) * kJetCount + jet,
            kPrecisionBits);
    }
    return finite(output);
}

}  // namespace

Output::Output() {
    arb_init(left_endpoint); arb_init(right_endpoint);
    arb_init(expansion_center);
}

Output::~Output() {
    clear_storage(*this);
    arb_clear(expansion_center); arb_clear(right_endpoint);
    arb_clear(left_endpoint);
}

arb_srcptr Output::coefficient(Factor factor, unsigned degree,
                               std::size_t jet) const {
    return coefficients[static_cast<std::size_t>(factor)].data()
        + static_cast<std::size_t>(degree) * kJetCount + jet;
}

arb_srcptr Output::remainder(Factor factor, std::size_t jet) const {
    return remainders[static_cast<std::size_t>(factor)].data() + jet;
}

ledger::ModelView Output::view(Factor factor) const {
    const std::size_t index = static_cast<std::size_t>(factor);
    return {ordinal, kind, left_endpoint, right_endpoint, expansion_center,
            order, coefficients[index].size(), coefficients[index].data(),
            remainders[index].size(), remainders[index].data()};
}

bool evaluate(const Input &input, Output *output, Result *result) {
    if (result == nullptr) return false;
    *result = Result{};
    if (output == nullptr) {
        result->detail = FailureDetail::input_or_output;
        return false;
    }
    reset(*output);
    if (!valid_input(input)) {
        result->detail = FailureDetail::geometry_or_order;
        return false;
    }
    Jet mu;
    jet_load(mu, input.parameters->mu);
    if (!jet_finite(mu)) {
        result->detail = FailureDetail::parameter_jet;
        return false;
    }
    allocate(*output, input.order);
    output->ordinal = input.ordinal; output->kind = input.kind;
    output->order = input.order;
    arb_set(output->left_endpoint, input.left_endpoint);
    arb_set(output->right_endpoint, input.right_endpoint);
    arb_set(output->expansion_center, input.left_endpoint);

    Jet z, za, one, f0, f1, e_coefficient, e_next;
    Jet l0, l1, previous_e, e2_coefficient, term;
    jet_scale_si(z, mu, 2L);
    jet_scale_arb(za, z, input.left_endpoint);
    jet_one(one);
    jet_neg(f1, z);
    jet_neg(term, za); jet_add(f0, one, term);
    store_jet(output->coefficients[static_cast<std::size_t>(Factor::F)],
              0U, f0);
    store_jet(output->coefficients[static_cast<std::size_t>(Factor::F)],
              1U, f1);
    result->exact_linear_f_coefficients = 2U * kJetCount;

    jet_exp(e_coefficient, za);
    jet_add(l0, one, za);
    jet_set(l1, z);
    jet_zero(previous_e);
    for (unsigned degree = 0U; degree <= input.order; ++degree) {
        store_jet(output->coefficients[static_cast<std::size_t>(Factor::E1)],
                  degree, e_coefficient);
        jet_mul(e2_coefficient, l0, e_coefficient);
        if (degree > 0U) {
            jet_mul(term, l1, previous_e);
            Jet sum;
            jet_add(sum, e2_coefficient, term);
            jet_set(e2_coefficient, sum);
        }
        store_jet(output->coefficients[static_cast<std::size_t>(Factor::E2)],
                  degree, e2_coefficient);
        if (degree < input.order) {
            jet_set(previous_e, e_coefficient);
            jet_mul(e_next, e_coefficient, z);
            jet_div_ui(e_coefficient, e_next, degree + 1U);
            ++result->exponential_recurrence_steps;
        }
    }

    arb_t t_interval, x_interval, width, polynomial, difference, magnitude;
    arb_init(t_interval); arb_init(x_interval); arb_init(width);
    arb_init(polynomial); arb_init(difference); arb_init(magnitude);
    arb_union(t_interval, input.left_endpoint, input.right_endpoint,
              kPrecisionBits);
    arb_sub(width, input.right_endpoint, input.left_endpoint, kPrecisionBits);
    arb_t zero;
    arb_init(zero); arb_zero(zero);
    arb_union(x_interval, zero, width, kPrecisionBits);
    Jet zt, exact_e1, exact_l, exact_e2;
    jet_scale_arb(zt, z, t_interval);
    jet_exp(exact_e1, zt);
    jet_add(exact_l, one, zt);
    jet_mul(exact_e2, exact_l, exact_e1);
    bool pass = jet_finite(exact_e1) && jet_finite(exact_e2);
    for (std::size_t jet = 0U; pass && jet < kJetCount; ++jet) {
        for (const Factor factor : {Factor::E1, Factor::E2}) {
            const auto &storage = output->coefficients[
                static_cast<std::size_t>(factor)];
            const Jet &exact = factor == Factor::E1 ? exact_e1 : exact_e2;
            pass = polynomial_range(polynomial, storage, input.order, jet,
                                    x_interval);
            if (!pass) break;
            arb_sub(difference, exact.at(jet), polynomial, kPrecisionBits);
            pass = upper_magnitude(magnitude, difference);
            if (!pass) break;
            arb_ptr remainder = output->remainders[
                static_cast<std::size_t>(factor)].data() + jet;
            arb_zero(remainder); arb_add_error(remainder, magnitude);
            pass = finite(remainder) && arb_contains_zero(remainder);
            if (!pass) break;
            ++result->remainder_jets_written;
        }
    }
    arb_clear(zero); arb_clear(magnitude); arb_clear(difference);
    arb_clear(polynomial); arb_clear(width); arb_clear(x_interval);
    arb_clear(t_interval);
    if (!pass) {
        reset(*output);
        result->detail = FailureDetail::directed_remainder;
        return false;
    }
    result->coefficient_jets_written = kFactorCount
        * (static_cast<std::size_t>(input.order) + 1U) * kJetCount;
    result->ordered_second_components_written =
        kFactorCount * analytic::kParameterCount * analytic::kParameterCount;
    result->accepted = true;
    result->exact_f_formula = true;
    result->exact_e1_formula = true;
    result->exact_e2_formula = true;
    result->directed_panel_remainders = true;
    result->both_mixed_orientations_retained = true;
    return true;
}

const char *failure_detail_name(FailureDetail detail) {
    switch (detail) {
    case FailureDetail::none: return "NONE";
    case FailureDetail::input_or_output: return "C08_ANALYTIC_FACTOR_INPUT_OR_OUTPUT";
    case FailureDetail::geometry_or_order: return "C08_ANALYTIC_FACTOR_GEOMETRY_OR_ORDER";
    case FailureDetail::parameter_jet: return "C08_ANALYTIC_FACTOR_PARAMETER_JET";
    case FailureDetail::coefficient_algebra: return "C08_ANALYTIC_FACTOR_COEFFICIENT_ALGEBRA";
    case FailureDetail::directed_remainder: return "C08_ANALYTIC_FACTOR_DIRECTED_REMAINDER";
    }
    return "C08_ANALYTIC_FACTOR_UNKNOWN";
}

}  // namespace nhm2::g2h_e_s5::primary_c08_analytic_factor_model_v1
