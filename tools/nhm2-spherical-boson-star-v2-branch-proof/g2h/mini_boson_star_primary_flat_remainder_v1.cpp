#include "mini_boson_star_primary_flat_remainder_v1.hpp"

#include <array>
#include <limits>
#include <vector>

namespace nhm2::g2h_e_s5::primary_flat_remainder_v1 {
namespace {

constexpr std::size_t value_jet = 0U;
constexpr std::size_t first_jet(std::size_t a) { return 1U + a; }
constexpr std::size_t second_jet(std::size_t a, std::size_t b) {
    return 1U + parameter_dimension + a * parameter_dimension + b;
}

bool finite(const arb_t value) { return arb_is_finite(value) != 0; }
bool finite_nonnegative(const arb_t value) {
    return finite(value) && arb_is_nonnegative(value) != 0;
}

bool absolute_upper(arb_t result, const arb_t value) {
    if (!finite(value)) return false;
    arb_t absolute;
    arf_t endpoint;
    arb_init(absolute); arf_init(endpoint);
    arb_abs(absolute, value);
    arb_get_ubound_arf(endpoint, absolute, precision_bits);
    const bool pass = arf_is_finite(endpoint) != 0 && arf_sgn(endpoint) >= 0;
    if (pass) arb_set_arf(result, endpoint);
    arf_clear(endpoint); arb_clear(absolute);
    return pass;
}

bool upper_nonnegative(arb_t result, const arb_t value) {
    if (!finite(value)) return false;
    arf_t endpoint;
    arf_init(endpoint);
    arb_get_ubound_arf(endpoint, value, precision_bits);
    const bool pass = arf_is_finite(endpoint) != 0 && arf_sgn(endpoint) >= 0;
    if (pass) arb_set_arf(result, endpoint);
    arf_clear(endpoint);
    return pass;
}

std::size_t coefficient_index(std::size_t component, std::size_t jet,
    std::size_t coefficient, std::size_t count) {
    return (component * parameter_jet_count + jet) * count + coefficient;
}
std::size_t tail_index(std::size_t component, std::size_t jet) {
    return component * parameter_jet_count + jet;
}
std::size_t gradient_index(std::size_t parameter, std::size_t state,
    std::size_t dimension) {
    return parameter * dimension + state;
}
std::size_t hessian_index(std::size_t parameter, std::size_t row,
    std::size_t column, std::size_t dimension) {
    return parameter * dimension * dimension + row * dimension + column;
}

void init_vector(std::vector<arb_struct> &values) {
    for (auto &value : values) arb_init(&value);
}
void clear_vector(std::vector<arb_struct> &values) {
    for (auto &value : values) arb_clear(&value);
}

bool valid_layout(const Input &input, const Output &output) {
    if (input.coefficient_count == 0U || input.state_dimension == 0U
        || input.full_parameter_jet_coefficients == nullptr
        || input.formal_parameter_jet_coefficients == nullptr
        || input.full_parameter_jet_tails == nullptr
        || input.formal_parameter_jet_tails == nullptr
        || input.theta_gradients == nullptr || input.theta_hessians == nullptr
        || input.inverse_y_majorant == nullptr
        || input.inverse_z1_majorant == nullptr
        || input.inverse_z2_majorant == nullptr
        || output.flat_remainder_state_norms == nullptr
        || output.full_state_gradient_norms == nullptr
        || output.full_state_hessian_norms == nullptr
        || output.y_contribution == nullptr || output.z1_contribution == nullptr
        || output.z2_contribution == nullptr) return false;
    return input.state_dimension
        <= std::numeric_limits<std::size_t>::max() / input.state_dimension;
}

bool coefficient_jet_norms(std::vector<arb_struct> &norms,
    const Input &input) {
    arb_t difference, magnitude, weight, contribution, tail;
    arb_init(difference); arb_init(magnitude); arb_init(weight);
    arb_init(contribution); arb_init(tail);
    bool pass = true;
    for (std::size_t component = 0; pass && component < residual_component_count;
         ++component) {
        for (std::size_t jet = 0; pass && jet < parameter_jet_count; ++jet) {
            arb_zero(&norms[tail_index(component, jet)]);
            for (std::size_t k = 0; pass && k < input.coefficient_count; ++k) {
                const std::size_t index = coefficient_index(component, jet, k,
                    input.coefficient_count);
                if (!finite(input.full_parameter_jet_coefficients + index)
                    || !finite(input.formal_parameter_jet_coefficients + index)) {
                    pass = false; break;
                }
                arb_sub(difference, input.full_parameter_jet_coefficients + index,
                    input.formal_parameter_jet_coefficients + index, precision_bits);
                pass = absolute_upper(magnitude, difference);
                if (!pass) break;
                arb_set_ui(weight, k + 1U);
                arb_pow_ui(weight, weight, 8UL, precision_bits);
                arb_mul(contribution, magnitude, weight, precision_bits);
                arb_add(&norms[tail_index(component, jet)],
                    &norms[tail_index(component, jet)], contribution, precision_bits);
            }
            const std::size_t index = tail_index(component, jet);
            if (!pass || !finite_nonnegative(input.full_parameter_jet_tails + index)
                || !finite_nonnegative(input.formal_parameter_jet_tails + index)) {
                pass = false; break;
            }
            arb_add(tail, input.full_parameter_jet_tails + index,
                input.formal_parameter_jet_tails + index, precision_bits);
            arb_add(&norms[index], &norms[index], tail, precision_bits);
            pass = upper_nonnegative(&norms[index], &norms[index]);
        }
    }
    arb_clear(tail); arb_clear(contribution); arb_clear(weight);
    arb_clear(magnitude); arb_clear(difference);
    return pass;
}

bool compose_state_norms(const std::vector<arb_struct> &parameter_norms,
    const Input &input, const Output &output) {
    arb_t difference, expression, magnitude, weight, term, entry;
    arb_t theta_abs, left, right, product, tail;
    arb_init(difference); arb_init(expression); arb_init(magnitude); arb_init(weight);
    arb_init(term); arb_init(entry); arb_init(theta_abs); arb_init(left);
    arb_init(right); arb_init(product); arb_init(tail);
    bool pass = true;
    for (std::size_t component = 0; pass && component < residual_component_count;
         ++component) {
        arb_set(output.flat_remainder_state_norms + component,
            &parameter_norms[tail_index(component, value_jet)]);
        arb_zero(output.full_state_gradient_norms + component);
        for (std::size_t i = 0; pass && i < input.state_dimension; ++i) {
            arb_zero(entry);
            // Compose each finite full-state coefficient before projection.
            for (std::size_t k = 0; pass && k < input.coefficient_count; ++k) {
                arb_zero(expression);
                for (std::size_t a = 0; pass && a < parameter_dimension; ++a) {
                    const std::size_t index = coefficient_index(component,
                        first_jet(a), k, input.coefficient_count);
                    if (!finite(input.theta_gradients
                            + gradient_index(a, i, input.state_dimension))) {
                        pass = false; break;
                    }
                    arb_sub(difference, input.full_parameter_jet_coefficients + index,
                        input.formal_parameter_jet_coefficients + index, precision_bits);
                    arb_mul(term, difference, input.theta_gradients
                        + gradient_index(a, i, input.state_dimension), precision_bits);
                    arb_add(expression, expression, term, precision_bits);
                }
                if (!pass || !absolute_upper(magnitude, expression)) {
                    pass = false; break;
                }
                arb_set_ui(weight, k + 1U);
                arb_pow_ui(weight, weight, 8UL, precision_bits);
                arb_mul(term, magnitude, weight, precision_bits);
                arb_add(entry, entry, term, precision_bits);
            }
            // Infinite tails remain separate, so no unavailable cancellation is used.
            for (std::size_t a = 0; pass && a < parameter_dimension; ++a) {
                const std::size_t index = tail_index(component, first_jet(a));
                pass = absolute_upper(theta_abs, input.theta_gradients
                    + gradient_index(a, i, input.state_dimension));
                if (!pass) break;
                arb_add(tail, input.full_parameter_jet_tails + index,
                    input.formal_parameter_jet_tails + index, precision_bits);
                arb_mul(term, tail, theta_abs, precision_bits);
                arb_add(entry, entry, term, precision_bits);
            }
            if (pass) {
                arb_add(output.full_state_gradient_norms + component,
                    output.full_state_gradient_norms + component, entry, precision_bits);
            }
        }
        pass = pass && upper_nonnegative(output.full_state_gradient_norms + component,
            output.full_state_gradient_norms + component);
        arb_zero(output.full_state_hessian_norms + component);
        for (std::size_t i = 0; pass && i < input.state_dimension; ++i) {
            for (std::size_t j = 0; pass && j < input.state_dimension; ++j) {
                arb_zero(entry);
                for (std::size_t k = 0; pass && k < input.coefficient_count; ++k) {
                    arb_zero(expression);
                    for (std::size_t a = 0; pass && a < parameter_dimension; ++a) {
                        if (!finite(input.theta_hessians
                                + hessian_index(a, i, j, input.state_dimension))) {
                            pass = false; break;
                        }
                        std::size_t index = coefficient_index(component,
                            first_jet(a), k, input.coefficient_count);
                        arb_sub(difference, input.full_parameter_jet_coefficients + index,
                            input.formal_parameter_jet_coefficients + index, precision_bits);
                        arb_mul(term, difference, input.theta_hessians
                            + hessian_index(a, i, j, input.state_dimension), precision_bits);
                        arb_add(expression, expression, term, precision_bits);
                        for (std::size_t b = 0; pass && b < parameter_dimension; ++b) {
                            if (!finite(input.theta_gradients
                                    + gradient_index(a, i, input.state_dimension))
                                || !finite(input.theta_gradients
                                    + gradient_index(b, j, input.state_dimension))) {
                                pass = false; break;
                            }
                            index = coefficient_index(component, second_jet(a, b), k,
                                input.coefficient_count);
                            arb_sub(difference,
                                input.full_parameter_jet_coefficients + index,
                                input.formal_parameter_jet_coefficients + index,
                                precision_bits);
                            arb_mul(product, input.theta_gradients
                                + gradient_index(a, i, input.state_dimension),
                                input.theta_gradients
                                + gradient_index(b, j, input.state_dimension),
                                precision_bits);
                            arb_mul(term, difference, product, precision_bits);
                            arb_add(expression, expression, term, precision_bits);
                        }
                    }
                    if (!pass || !absolute_upper(magnitude, expression)) {
                        pass = false; break;
                    }
                    arb_set_ui(weight, k + 1U);
                    arb_pow_ui(weight, weight, 8UL, precision_bits);
                    arb_mul(term, magnitude, weight, precision_bits);
                    arb_add(entry, entry, term, precision_bits);
                }
                for (std::size_t a = 0; pass && a < parameter_dimension; ++a) {
                    const std::size_t first_index = tail_index(component, first_jet(a));
                    pass = absolute_upper(theta_abs, input.theta_hessians
                        + hessian_index(a, i, j, input.state_dimension));
                    if (!pass) break;
                    arb_add(tail, input.full_parameter_jet_tails + first_index,
                        input.formal_parameter_jet_tails + first_index, precision_bits);
                    arb_mul(term, tail, theta_abs, precision_bits);
                    arb_add(entry, entry, term, precision_bits);
                    for (std::size_t b = 0; pass && b < parameter_dimension; ++b) {
                        pass = absolute_upper(left, input.theta_gradients
                            + gradient_index(a, i, input.state_dimension))
                            && absolute_upper(right, input.theta_gradients
                                + gradient_index(b, j, input.state_dimension));
                        if (!pass) break;
                        const std::size_t second_index = tail_index(component,
                            second_jet(a, b));
                        arb_add(tail, input.full_parameter_jet_tails + second_index,
                            input.formal_parameter_jet_tails + second_index, precision_bits);
                        arb_mul(product, left, right, precision_bits);
                        arb_mul(term, tail, product, precision_bits);
                        arb_add(entry, entry, term, precision_bits);
                    }
                }
                if (pass) {
                    arb_add(output.full_state_hessian_norms + component,
                        output.full_state_hessian_norms + component, entry,
                        precision_bits);
                }
            }
        }
        pass = pass && upper_nonnegative(output.full_state_hessian_norms + component,
            output.full_state_hessian_norms + component);
    }
    arb_clear(tail); arb_clear(product); arb_clear(right); arb_clear(left);
    arb_clear(theta_abs); arb_clear(entry); arb_clear(term); arb_clear(weight);
    arb_clear(magnitude); arb_clear(expression); arb_clear(difference);
    return pass;
}

bool maximum(arb_t result, arb_srcptr values, std::size_t count) {
    if (values == nullptr || count == 0U) return false;
    arb_zero(result);
    arf_t candidate, current;
    arf_init(candidate); arf_init(current);
    bool pass = true;
    for (std::size_t index = 0; pass && index < count; ++index) {
        if (!finite_nonnegative(values + index)) { pass = false; break; }
        arb_get_ubound_arf(candidate, values + index, precision_bits);
        arb_get_ubound_arf(current, result, precision_bits);
        if (arf_cmp(candidate, current) > 0) arb_set_arf(result, candidate);
    }
    arf_clear(current); arf_clear(candidate);
    return pass;
}

bool apply_majorant(arb_t result, arb_srcptr component_bounds,
    const arb_t majorant) {
    if (!finite_nonnegative(majorant)) return false;
    arb_t largest;
    arb_init(largest);
    const bool pass = maximum(largest, component_bounds, residual_component_count);
    if (pass) arb_mul(result, largest, majorant, precision_bits);
    const bool final_pass = pass && upper_nonnegative(result, result);
    arb_clear(largest);
    return final_pass;
}

struct FixtureStorage {
    std::size_t n = 2U;
    std::size_t d = 2U;
    std::vector<arb_struct> full, formal, full_tail, formal_tail, gradient, hessian;
    std::array<arb_struct, residual_component_count> state{}, first{}, second{};
    arb_t ay, az1, az2, y, z1, z2;
    FixtureStorage()
        : full(residual_component_count * parameter_jet_count * n),
          formal(residual_component_count * parameter_jet_count * n),
          full_tail(residual_component_count * parameter_jet_count),
          formal_tail(residual_component_count * parameter_jet_count),
          gradient(parameter_dimension * d), hessian(parameter_dimension * d * d) {
        init_vector(full); init_vector(formal); init_vector(full_tail);
        init_vector(formal_tail); init_vector(gradient); init_vector(hessian);
        for (auto &v : state) arb_init(&v);
        for (auto &v : first) arb_init(&v);
        for (auto &v : second) arb_init(&v);
        arb_init(ay); arb_init(az1); arb_init(az2); arb_init(y); arb_init(z1); arb_init(z2);
        for (auto &v : full) arb_zero(&v);
        for (auto &v : formal) arb_zero(&v);
        for (auto &v : full_tail) arb_zero(&v);
        for (auto &v : formal_tail) arb_zero(&v);
        for (auto &v : gradient) arb_zero(&v);
        for (auto &v : hessian) arb_zero(&v);
        arb_one(ay); arb_one(az1); arb_one(az2);
    }
    ~FixtureStorage() {
        arb_clear(z2); arb_clear(z1); arb_clear(y); arb_clear(az2); arb_clear(az1); arb_clear(ay);
        for (auto &v : second) arb_clear(&v);
        for (auto &v : first) arb_clear(&v);
        for (auto &v : state) arb_clear(&v);
        clear_vector(hessian); clear_vector(gradient); clear_vector(formal_tail);
        clear_vector(full_tail); clear_vector(formal); clear_vector(full);
    }
    Input input() const {
        return {n, d, full.data(), formal.data(), full_tail.data(), formal_tail.data(),
            gradient.data(), hessian.data(), ay, az1, az2};
    }
    Output output() {
        return {state.data(), first.data(), second.data(), y, z1, z2};
    }
};

bool exact_zero(const arb_t value) { return arb_is_zero(value) != 0; }
bool contains_rational(const arb_t value, long numerator, long denominator) {
    fmpq_t rational; fmpq_init(rational); fmpq_set_si(rational, numerator, denominator);
    const bool pass = arb_contains_fmpq(value, rational) != 0;
    fmpq_clear(rational); return pass;
}
bool at_least_rational(const arb_t value, long numerator, long denominator) {
    fmpq_t rational; fmpq_init(rational); fmpq_set_si(rational, numerator, denominator);
    arb_t boundary; arb_init(boundary); arb_set_fmpq(boundary, rational, precision_bits);
    const bool pass = arb_ge(value, boundary) != 0;
    arb_clear(boundary); fmpq_clear(rational); return pass;
}
void set_rational(arb_t value, long numerator, long denominator) {
    fmpq_t rational; fmpq_init(rational); fmpq_set_si(rational, numerator, denominator);
    arb_set_fmpq(value, rational, precision_bits); fmpq_clear(rational);
}

std::array<bool, 12> fixture_results() {
    std::array<bool, 12> checks{};
    {
        FixtureStorage f;
        const auto code = assemble(f.input(), f.output());
        checks[0] = code == FailureCode::none && exact_zero(f.y)
            && exact_zero(f.z1) && exact_zero(f.z2);
    }
    {
        FixtureStorage f;
        set_rational(&f.full[coefficient_index(0U, value_jet, 0U, f.n)], 1, 1);
        set_rational(&f.formal[coefficient_index(0U, value_jet, 0U, f.n)], 1, 2);
        const auto code = assemble(f.input(), f.output());
        checks[1] = code == FailureCode::none && contains_rational(f.y, 1, 2);
    }
    {
        FixtureStorage f;
        set_rational(&f.full_tail[tail_index(0U, value_jet)], 1, 8);
        set_rational(&f.formal_tail[tail_index(0U, value_jet)], 1, 8);
        const auto code = assemble(f.input(), f.output());
        checks[2] = code == FailureCode::none && contains_rational(f.y, 1, 4);
    }
    {
        FixtureStorage f;
        // Both ordered mixed orientations must survive composition.
        set_rational(&f.full[coefficient_index(0U, second_jet(0U, 1U), 0U, f.n)], 1, 3);
        set_rational(&f.full[coefficient_index(0U, second_jet(1U, 0U), 0U, f.n)], 1, 5);
        arb_one(&f.gradient[gradient_index(0U, 0U, f.d)]);
        arb_one(&f.gradient[gradient_index(1U, 0U, f.d)]);
        const auto code = assemble(f.input(), f.output());
        checks[3] = code == FailureCode::none && at_least_rational(f.z2, 8, 15);
    }
    {
        FixtureStorage f; auto input = f.input(); input.full_parameter_jet_coefficients = nullptr;
        checks[4] = assemble(input, f.output()) == FailureCode::input_identity_or_state_length;
    }
    {
        FixtureStorage f; arb_neg(&f.full_tail[0], f.ay);
        checks[5] = assemble(f.input(), f.output())
            == FailureCode::truncated_weighted_coefficient_tail;
    }
    {
        FixtureStorage f; auto input = f.input(); input.coefficient_count = maximum_coefficient_count + 1U;
        checks[6] = assemble(input, f.output())
            == FailureCode::truncated_weighted_coefficient_tail;
    }
    {
        FixtureStorage f; arb_indeterminate(&f.gradient[0]);
        checks[7] = assemble(f.input(), f.output()) == FailureCode::full_state_jet_composition;
    }
    {
        FixtureStorage f; arb_neg(f.ay, f.ay);
        checks[8] = assemble(f.input(), f.output()) == FailureCode::f_flat_y_assembly;
    }
    {
        FixtureStorage f; arb_indeterminate(f.az1);
        checks[9] = assemble(f.input(), f.output()) == FailureCode::f_flat_z1_assembly;
    }
    {
        FixtureStorage f; arb_neg(f.az2, f.az2);
        checks[10] = assemble(f.input(), f.output()) == FailureCode::f_flat_z2_assembly;
    }
    {
        FixtureStorage f; arb_neg(&f.full_tail[0], f.ay); arb_neg(f.ay, f.ay);
        checks[11] = assemble(f.input(), f.output())
            == FailureCode::truncated_weighted_coefficient_tail;
    }
    return checks;
}

} // namespace

FailureCode assemble(const Input &input, const Output &output) {
    if (!valid_layout(input, output) || input.state_dimension > maximum_state_dimension) {
        return FailureCode::input_identity_or_state_length;
    }
    if (input.coefficient_count > maximum_coefficient_count) {
        return FailureCode::truncated_weighted_coefficient_tail;
    }
    std::vector<arb_struct> parameter_norms(residual_component_count * parameter_jet_count);
    init_vector(parameter_norms);
    if (!coefficient_jet_norms(parameter_norms, input)) {
        clear_vector(parameter_norms);
        return FailureCode::truncated_weighted_coefficient_tail;
    }
    if (!compose_state_norms(parameter_norms, input, output)) {
        clear_vector(parameter_norms);
        return FailureCode::full_state_jet_composition;
    }
    clear_vector(parameter_norms);
    if (!apply_majorant(output.y_contribution, output.flat_remainder_state_norms,
        input.inverse_y_majorant)) return FailureCode::f_flat_y_assembly;
    if (!apply_majorant(output.z1_contribution, output.full_state_gradient_norms,
        input.inverse_z1_majorant)) return FailureCode::f_flat_z1_assembly;
    if (!apply_majorant(output.z2_contribution, output.full_state_hessian_norms,
        input.inverse_z2_majorant)) return FailureCode::f_flat_z2_assembly;
    return FailureCode::none;
}

const char *failure_code_name(FailureCode code) {
    switch (code) {
    case FailureCode::none: return "NONE";
    case FailureCode::input_identity_or_state_length: return "C08-001_INPUT_IDENTITY_OR_STATE_LENGTH";
    case FailureCode::truncated_weighted_coefficient_tail: return "C08-016_TRUNCATED_WEIGHTED_COEFFICIENT_TAIL";
    case FailureCode::full_state_jet_composition: return "C08-017_FULL_STATE_JET_COMPOSITION";
    case FailureCode::f_flat_y_assembly: return "C08-018_F_FLAT_Y_ASSEMBLY";
    case FailureCode::f_flat_z1_assembly: return "C08-019_F_FLAT_Z1_ASSEMBLY";
    case FailureCode::f_flat_z2_assembly: return "C08-020_F_FLAT_Z2_ASSEMBLY";
    }
    return "UNKNOWN";
}

std::size_t fixture_count() { return 12U; }
std::size_t fixtures_passed() {
    const auto checks = fixture_results();
    std::size_t passed = 0U;
    for (bool check : checks) passed += check ? 1U : 0U;
    return passed;
}
std::uint32_t fixture_mask() {
    const auto checks = fixture_results();
    std::uint32_t mask = 0U;
    for (std::size_t i = 0; i < checks.size(); ++i) if (checks[i]) mask |= 1U << i;
    return mask;
}
bool run_fixture_suite() { return fixtures_passed() == fixture_count(); }

} // namespace nhm2::g2h_e_s5::primary_flat_remainder_v1
