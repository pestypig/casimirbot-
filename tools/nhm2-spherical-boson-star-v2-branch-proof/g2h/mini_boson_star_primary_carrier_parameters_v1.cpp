#include "mini_boson_star_primary_carrier_parameters_v1.hpp"

#include <flint/fmpq.h>

#include <array>
#include <limits>

namespace nhm2::g2h_e_s5::primary_carrier_parameters_v1 {
namespace {

bool finite(const arb_t value) { return arb_is_finite(value) != 0; }

bool valid_layout(std::size_t dimension) {
    return dimension != 0U
        && dimension <= std::numeric_limits<std::size_t>::max() / dimension;
}

bool valid_carrier_layout(std::size_t dimension) {
    return valid_layout(dimension)
        && dimension * dimension
            <= std::numeric_limits<std::size_t>::max() / carrier_instance_count;
}

std::size_t hessian_index(std::size_t row, std::size_t column,
    std::size_t dimension) {
    return row * dimension + column;
}

void set_rational(arb_t value, long numerator, long denominator) {
    fmpq_t rational;
    fmpq_init(rational);
    fmpq_set_si(rational, numerator, denominator);
    arb_set_fmpq(value, rational, precision_bits);
    fmpq_clear(rational);
}

bool all_finite(arb_srcptr values, std::size_t count) {
    if (values == nullptr) return false;
    for (std::size_t index = 0; index < count; ++index) {
        if (!finite(values + index)) return false;
    }
    return true;
}

void zero(arb_ptr values, std::size_t count) {
    for (std::size_t index = 0; index < count; ++index) arb_zero(values + index);
}

template <std::size_t Count>
void init_values(std::array<arb_struct, Count> &values) {
    for (auto &value : values) arb_init(&value);
}

template <std::size_t Count>
void clear_values(std::array<arb_struct, Count> &values) {
    for (auto &value : values) arb_clear(&value);
}

bool contains_zero(const arb_t value) { return arb_contains_zero(value) != 0; }

bool positive_fixture() {
    constexpr std::size_t dimension = 4U;
    constexpr std::size_t omega_index = 2U;
    constexpr std::size_t mass_index = 3U;
    std::array<arb_struct, dimension> k_gradient, b_gradient;
    std::array<arb_struct, dimension * dimension> k_hessian, b_hessian;
    std::array<arb_struct, carrier_instance_count> a_values, b_values;
    std::array<arb_struct, carrier_instance_count * dimension> a_gradients, b_gradients;
    std::array<arb_struct, carrier_instance_count * dimension * dimension> a_hessians, b_hessians;
    init_values(k_gradient); init_values(b_gradient); init_values(k_hessian); init_values(b_hessian);
    init_values(a_values); init_values(b_values); init_values(a_gradients); init_values(b_gradients);
    init_values(a_hessians); init_values(b_hessians);
    arb_t omega, mass, kappa, beta, temporary, identity, omega_squared;
    arb_init(omega); arb_init(mass); arb_init(kappa); arb_init(beta);
    arb_init(temporary); arb_init(identity); arb_init(omega_squared);
    set_rational(omega, 3, 4); set_rational(mass, 1, 2);
    bool pass = evaluate_positive_parameter_jets(kappa, beta,
        k_gradient.data(), k_hessian.data(), b_gradient.data(), b_hessian.data(),
        dimension, omega_index, mass_index, omega, mass);

    // kappa*kappa_omega + omega = 0 and kappa^3*kappa_omegaomega + 1 = 0.
    arb_mul(identity, kappa, &k_gradient[omega_index], precision_bits);
    arb_add(identity, identity, omega, precision_bits);
    pass = pass && contains_zero(identity);
    arb_pow_ui(temporary, kappa, 3UL, precision_bits);
    arb_mul(identity, temporary,
        &k_hessian[hessian_index(omega_index, omega_index, dimension)], precision_bits);
    arb_add_ui(identity, identity, 1UL, precision_bits);
    pass = pass && contains_zero(identity);

    // kappa*beta_M = 2*omega^2-1.
    arb_mul(identity, kappa, &b_gradient[mass_index], precision_bits);
    arb_mul(omega_squared, omega, omega, precision_bits);
    arb_mul_2exp_si(temporary, omega_squared, 1);
    arb_sub_ui(temporary, temporary, 1UL, precision_bits);
    arb_sub(identity, identity, temporary, precision_bits);
    pass = pass && contains_zero(identity);
    for (std::size_t index = 0; index < dimension; ++index) {
        if (index != omega_index) pass = pass && arb_is_zero(&k_gradient[index]);
    }
    pass = pass && assemble_carrier_parameter_jets(a_values.data(), b_values.data(),
        a_gradients.data(), a_hessians.data(), b_gradients.data(), b_hessians.data(),
        dimension, kappa, beta, k_gradient.data(), k_hessian.data(),
        b_gradient.data(), b_hessian.data());
    arb_mul_2exp_si(identity, &a_values[0], 1);
    arb_sub(identity, &a_values[1], identity, precision_bits);
    pass = pass && contains_zero(identity);
    arb_mul_2exp_si(identity, &b_values[0], 1);
    arb_add_ui(identity, identity, 2UL, precision_bits);
    arb_sub(identity, &b_values[1], identity, precision_bits);
    pass = pass && contains_zero(identity);
    arb_mul_2exp_si(identity, &b_values[0], 1);
    arb_add_ui(identity, identity, 1UL, precision_bits);
    arb_sub(identity, &b_values[2], identity, precision_bits);
    pass = pass && contains_zero(identity);

    arb_clear(omega_squared); arb_clear(identity); arb_clear(temporary);
    arb_clear(beta); arb_clear(kappa); arb_clear(mass); arb_clear(omega);
    clear_values(b_hessians); clear_values(a_hessians); clear_values(b_gradients);
    clear_values(a_gradients); clear_values(b_values); clear_values(a_values);
    clear_values(b_hessian); clear_values(k_hessian); clear_values(b_gradient); clear_values(k_gradient);
    return pass;
}

bool vacuum_fixture() {
    constexpr std::size_t dimension = 3U;
    constexpr std::size_t nbar_index = 1U;
    std::array<arb_struct, dimension> m_gradient, k_gradient, b_gradient;
    std::array<arb_struct, dimension * dimension> m_hessian, k_hessian, b_hessian;
    init_values(m_gradient); init_values(k_gradient); init_values(b_gradient);
    init_values(m_hessian); init_values(k_hessian); init_values(b_hessian);
    zero(m_gradient.data(), m_gradient.size()); zero(m_hessian.data(), m_hessian.size());
    set_rational(&m_gradient[0], 1, 8);
    set_rational(&m_hessian[hessian_index(0U, 0U, dimension)], 1, 7);
    arb_t eta, nbar, mbar, kappa, beta, identity, temporary;
    arb_init(eta); arb_init(nbar); arb_init(mbar); arb_init(kappa); arb_init(beta);
    arb_init(identity); arb_init(temporary);
    arb_zero(eta); set_rational(nbar, -1, 2); set_rational(mbar, 1, 4);
    bool pass = evaluate_vacuum_parameter_jets(kappa, beta,
        k_gradient.data(), k_hessian.data(), b_gradient.data(), b_hessian.data(),
        dimension, nbar_index, eta, nbar, mbar, m_gradient.data(), m_hessian.data());
    // kappa_bar^2=-2*Nbar and kappa_bar*kappa_Nbar=-1.
    arb_mul(identity, kappa, kappa, precision_bits);
    arb_mul_2exp_si(temporary, nbar, 1);
    arb_add(identity, identity, temporary, precision_bits);
    pass = pass && contains_zero(identity);
    arb_mul(identity, kappa, &k_gradient[nbar_index], precision_bits);
    arb_add_ui(identity, identity, 1UL, precision_bits);
    pass = pass && contains_zero(identity);
    // beta is linear in Mbar, so a supplied Mbar Hessian must enter as beta_M*Mbar_ij.
    arb_mul(identity, &m_hessian[hessian_index(0U, 0U, dimension)], kappa, precision_bits);
    arb_sub(identity, &b_hessian[hessian_index(0U, 0U, dimension)], identity, precision_bits);
    pass = pass && contains_zero(identity);
    pass = pass && arb_equal(&b_hessian[hessian_index(0U, 1U, dimension)],
        &b_hessian[hessian_index(1U, 0U, dimension)]);

    arb_clear(temporary); arb_clear(identity); arb_clear(beta); arb_clear(kappa);
    arb_clear(mbar); arb_clear(nbar); arb_clear(eta);
    clear_values(b_hessian); clear_values(k_hessian); clear_values(b_gradient);
    clear_values(k_gradient); clear_values(m_hessian); clear_values(m_gradient);
    return pass;
}

bool rejection_fixture() {
    constexpr std::size_t dimension = 2U;
    std::array<arb_struct, dimension> gradient, gradient2;
    std::array<arb_struct, dimension * dimension> hessian, hessian2;
    init_values(gradient); init_values(gradient2); init_values(hessian); init_values(hessian2);
    zero(gradient.data(), gradient.size()); zero(hessian.data(), hessian.size());
    arb_t omega, mass, kappa, beta, eta, nbar, mbar;
    arb_init(omega); arb_init(mass); arb_init(kappa); arb_init(beta);
    arb_init(eta); arb_init(nbar); arb_init(mbar);
    arb_one(omega); arb_zero(mass); arb_zero(eta); arb_zero(nbar); arb_one(mbar);
    bool pass = !evaluate_positive_parameter_jets(kappa, beta,
        gradient.data(), hessian.data(), gradient2.data(), hessian2.data(),
        dimension, 0U, 1U, omega, mass);
    pass = pass && !evaluate_vacuum_parameter_jets(kappa, beta,
        gradient.data(), hessian.data(), gradient2.data(), hessian2.data(),
        dimension, 0U, eta, nbar, mbar, gradient.data(), hessian.data());
    arb_indeterminate(mbar);
    set_rational(nbar, -1, 2);
    pass = pass && !evaluate_vacuum_parameter_jets(kappa, beta,
        gradient.data(), hessian.data(), gradient2.data(), hessian2.data(),
        dimension, 0U, eta, nbar, mbar, gradient.data(), hessian.data());
    pass = pass && !evaluate_positive_parameter_jets(kappa, beta,
        gradient.data(), hessian.data(), gradient2.data(), hessian2.data(),
        0U, 0U, 0U, omega, mass);
    arb_clear(mbar); arb_clear(nbar); arb_clear(eta); arb_clear(beta);
    arb_clear(kappa); arb_clear(mass); arb_clear(omega);
    clear_values(hessian2); clear_values(hessian); clear_values(gradient2); clear_values(gradient);
    return pass;
}

std::array<bool, 3> fixture_results() {
    return {positive_fixture(), vacuum_fixture(), rejection_fixture()};
}

} // namespace

bool evaluate_positive_parameter_values(arb_t kappa, arb_t beta,
    const arb_t omega, const arb_t mass) {
    if (!finite(omega) || !finite(mass) || !arb_is_positive(omega)) return false;
    arb_t one, omega_squared, temporary;
    arb_init(one); arb_init(omega_squared); arb_init(temporary); arb_one(one);
    bool pass = arb_lt(omega, one) != 0;
    if (pass) {
        arb_mul(omega_squared, omega, omega, precision_bits);
        arb_sub(temporary, one, omega_squared, precision_bits);
        pass = arb_is_positive(temporary) != 0;
    }
    if (pass) {
        arb_sqrt(kappa, temporary, precision_bits);
        arb_mul_2exp_si(temporary, omega_squared, 1);
        arb_sub_ui(temporary, temporary, 1UL, precision_bits);
        arb_mul(temporary, temporary, mass, precision_bits);
        arb_div(beta, temporary, kappa, precision_bits);
        arb_sub_ui(beta, beta, 1UL, precision_bits);
        pass = finite(kappa) && arb_is_positive(kappa) && finite(beta);
    }
    arb_clear(temporary); arb_clear(omega_squared); arb_clear(one);
    return pass;
}

bool evaluate_positive_parameter_jets(arb_t kappa, arb_t beta,
    arb_ptr kappa_gradient, arb_ptr kappa_hessian,
    arb_ptr beta_gradient, arb_ptr beta_hessian,
    std::size_t state_dimension, std::size_t omega_index,
    std::size_t mass_index, const arb_t omega, const arb_t mass) {
    if (!valid_layout(state_dimension) || omega_index >= state_dimension
        || mass_index >= state_dimension || omega_index == mass_index
        || kappa_gradient == nullptr || kappa_hessian == nullptr
        || beta_gradient == nullptr || beta_hessian == nullptr
        || !finite(omega) || !finite(mass) || !arb_is_positive(omega)) return false;
    arb_t omega_squared, kappa_cubed, kappa_fifth, numerator, temporary;
    arb_init(omega_squared); arb_init(kappa_cubed);
    arb_init(kappa_fifth); arb_init(numerator); arb_init(temporary);
    bool pass = evaluate_positive_parameter_values(kappa, beta, omega, mass);
    if (pass) {
        arb_mul(omega_squared, omega, omega, precision_bits);
        arb_pow_ui(kappa_cubed, kappa, 3UL, precision_bits);
        arb_pow_ui(kappa_fifth, kappa, 5UL, precision_bits);
        arb_mul_2exp_si(numerator, omega_squared, 1);
        arb_sub_ui(numerator, numerator, 1UL, precision_bits);
        zero(kappa_gradient, state_dimension); zero(beta_gradient, state_dimension);
        zero(kappa_hessian, state_dimension * state_dimension);
        zero(beta_hessian, state_dimension * state_dimension);

        arb_div(kappa_gradient + omega_index, omega, kappa, precision_bits);
        arb_neg(kappa_gradient + omega_index, kappa_gradient + omega_index);
        arb_inv(kappa_hessian + hessian_index(omega_index, omega_index, state_dimension),
            kappa_cubed, precision_bits);
        arb_neg(kappa_hessian + hessian_index(omega_index, omega_index, state_dimension),
            kappa_hessian + hessian_index(omega_index, omega_index, state_dimension));

        arb_div(beta_gradient + mass_index, numerator, kappa, precision_bits);
        arb_mul_2exp_si(temporary, omega_squared, 1);
        arb_sub_ui(temporary, temporary, 3UL, precision_bits);
        arb_neg(temporary, temporary); // 3-2*omega^2
        arb_mul(temporary, temporary, omega, precision_bits);
        arb_mul(temporary, temporary, mass, precision_bits);
        arb_div(beta_gradient + omega_index, temporary, kappa_cubed, precision_bits);
        arb_mul_ui(temporary, mass, 3UL, precision_bits);
        arb_div(beta_hessian + hessian_index(omega_index, omega_index, state_dimension),
            temporary, kappa_fifth, precision_bits);
        arb_mul_2exp_si(temporary, omega_squared, 1);
        arb_sub_ui(temporary, temporary, 3UL, precision_bits);
        arb_neg(temporary, temporary);
        arb_mul(temporary, temporary, omega, precision_bits);
        arb_div(temporary, temporary, kappa_cubed, precision_bits);
        arb_set(beta_hessian + hessian_index(omega_index, mass_index, state_dimension), temporary);
        arb_set(beta_hessian + hessian_index(mass_index, omega_index, state_dimension), temporary);
        pass = finite(kappa) && finite(beta)
            && all_finite(kappa_gradient, state_dimension)
            && all_finite(beta_gradient, state_dimension)
            && all_finite(kappa_hessian, state_dimension * state_dimension)
            && all_finite(beta_hessian, state_dimension * state_dimension);
    }
    arb_clear(temporary); arb_clear(numerator); arb_clear(kappa_fifth);
    arb_clear(kappa_cubed); arb_clear(omega_squared);
    return pass;
}

bool evaluate_vacuum_parameter_jets(arb_t kappa_bar, arb_t beta_bar,
    arb_ptr kappa_gradient, arb_ptr kappa_hessian,
    arb_ptr beta_gradient, arb_ptr beta_hessian,
    std::size_t state_dimension, std::size_t nbar_index,
    const arb_t eta, const arb_t nbar, const arb_t mbar_infinity,
    arb_srcptr mbar_gradient, arb_srcptr mbar_hessian) {
    const std::size_t square = valid_carrier_layout(state_dimension)
        ? state_dimension * state_dimension : 0U;
    if (square == 0U || nbar_index >= state_dimension
        || kappa_gradient == nullptr || kappa_hessian == nullptr
        || beta_gradient == nullptr || beta_hessian == nullptr
        || !finite(eta) || !arb_is_nonnegative(eta) || !finite(nbar)
        || !arb_is_negative(nbar) || !finite(mbar_infinity)
        || !all_finite(mbar_gradient, state_dimension)
        || !all_finite(mbar_hessian, square)) return false;
    arb_t kappa_cubed, kappa_fifth, t, one_minus, beta_n, beta_m;
    arb_t beta_nn, beta_nm, temporary, temporary2;
    arb_init(kappa_cubed); arb_init(kappa_fifth); arb_init(t); arb_init(one_minus);
    arb_init(beta_n); arb_init(beta_m); arb_init(beta_nn); arb_init(beta_nm);
    arb_init(temporary); arb_init(temporary2);
    arb_mul_2exp_si(temporary, nbar, 1); arb_neg(temporary, temporary);
    bool pass = arb_is_positive(temporary) != 0;
    if (pass) {
        arb_sqrt(kappa_bar, temporary, precision_bits);
        arb_pow_ui(kappa_cubed, kappa_bar, 3UL, precision_bits);
        arb_pow_ui(kappa_fifth, kappa_bar, 5UL, precision_bits);
        arb_mul(t, eta, nbar, precision_bits); arb_mul_2exp_si(t, t, 2);
        arb_add_ui(t, t, 1UL, precision_bits);
        arb_mul(temporary, mbar_infinity, t, precision_bits);
        arb_div(beta_bar, temporary, kappa_bar, precision_bits);
        arb_sub_ui(beta_bar, beta_bar, 1UL, precision_bits);
        arb_mul(one_minus, eta, nbar, precision_bits);
        arb_mul_2exp_si(one_minus, one_minus, 2);
        arb_neg(one_minus, one_minus); arb_add_ui(one_minus, one_minus, 1UL, precision_bits);
        arb_mul(temporary, mbar_infinity, one_minus, precision_bits);
        arb_div(beta_n, temporary, kappa_cubed, precision_bits);
        arb_div(beta_m, t, kappa_bar, precision_bits);
        arb_mul(temporary, eta, nbar, precision_bits); arb_mul_2exp_si(temporary, temporary, 2);
        arb_neg(temporary, temporary); arb_add_ui(temporary, temporary, 3UL, precision_bits);
        arb_mul(temporary, temporary, mbar_infinity, precision_bits);
        arb_div(beta_nn, temporary, kappa_fifth, precision_bits);
        arb_div(beta_nm, one_minus, kappa_cubed, precision_bits);

        zero(kappa_gradient, state_dimension); zero(beta_gradient, state_dimension);
        zero(kappa_hessian, square); zero(beta_hessian, square);
        arb_inv(kappa_gradient + nbar_index, kappa_bar, precision_bits);
        arb_neg(kappa_gradient + nbar_index, kappa_gradient + nbar_index);
        arb_inv(kappa_hessian + hessian_index(nbar_index, nbar_index, state_dimension),
            kappa_cubed, precision_bits);
        arb_neg(kappa_hessian + hessian_index(nbar_index, nbar_index, state_dimension),
            kappa_hessian + hessian_index(nbar_index, nbar_index, state_dimension));
        for (std::size_t i = 0; i < state_dimension; ++i) {
            arb_mul(beta_gradient + i, beta_m, mbar_gradient + i, precision_bits);
            if (i == nbar_index) arb_add(beta_gradient + i, beta_gradient + i, beta_n, precision_bits);
            for (std::size_t j = 0; j < state_dimension; ++j) {
                const std::size_t index = hessian_index(i, j, state_dimension);
                arb_mul(beta_hessian + index, beta_m, mbar_hessian + index, precision_bits);
                if (i == nbar_index && j == nbar_index) {
                    arb_add(beta_hessian + index, beta_hessian + index, beta_nn, precision_bits);
                }
                if (i == nbar_index) {
                    arb_mul(temporary, beta_nm, mbar_gradient + j, precision_bits);
                    arb_add(beta_hessian + index, beta_hessian + index, temporary, precision_bits);
                }
                if (j == nbar_index) {
                    arb_mul(temporary2, beta_nm, mbar_gradient + i, precision_bits);
                    arb_add(beta_hessian + index, beta_hessian + index, temporary2, precision_bits);
                }
            }
        }
        pass = finite(kappa_bar) && finite(beta_bar)
            && all_finite(kappa_gradient, state_dimension)
            && all_finite(beta_gradient, state_dimension)
            && all_finite(kappa_hessian, square)
            && all_finite(beta_hessian, square);
    }
    arb_clear(temporary2); arb_clear(temporary); arb_clear(beta_nm); arb_clear(beta_nn);
    arb_clear(beta_m); arb_clear(beta_n); arb_clear(one_minus); arb_clear(t);
    arb_clear(kappa_fifth); arb_clear(kappa_cubed);
    return pass;
}

bool assemble_carrier_parameter_jets(arb_ptr a_values, arb_ptr b_values,
    arb_ptr a_gradients, arb_ptr a_hessians,
    arb_ptr b_gradients, arb_ptr b_hessians,
    std::size_t state_dimension, const arb_t kappa, const arb_t beta,
    arb_srcptr kappa_gradient, arb_srcptr kappa_hessian,
    arb_srcptr beta_gradient, arb_srcptr beta_hessian) {
    const std::size_t square = valid_carrier_layout(state_dimension)
        ? state_dimension * state_dimension : 0U;
    if (square == 0U || a_values == nullptr || b_values == nullptr
        || a_gradients == nullptr || a_hessians == nullptr
        || b_gradients == nullptr || b_hessians == nullptr
        || !finite(kappa) || !arb_is_positive(kappa) || !finite(beta)
        || !all_finite(kappa_gradient, state_dimension)
        || !all_finite(beta_gradient, state_dimension)
        || !all_finite(kappa_hessian, square)
        || !all_finite(beta_hessian, square)) return false;
    constexpr std::array<unsigned long, carrier_instance_count> scales = {1UL, 2UL, 2UL};
    constexpr std::array<unsigned long, carrier_instance_count> offsets = {0UL, 2UL, 1UL};
    for (std::size_t instance = 0; instance < carrier_instance_count; ++instance) {
        arb_mul_ui(a_values + instance, kappa, scales[instance], precision_bits);
        arb_mul_ui(b_values + instance, beta, scales[instance], precision_bits);
        arb_add_ui(b_values + instance, b_values + instance, offsets[instance], precision_bits);
        for (std::size_t i = 0; i < state_dimension; ++i) {
            const std::size_t gradient = instance * state_dimension + i;
            arb_mul_ui(a_gradients + gradient, kappa_gradient + i, scales[instance], precision_bits);
            arb_mul_ui(b_gradients + gradient, beta_gradient + i, scales[instance], precision_bits);
        }
        for (std::size_t index = 0; index < square; ++index) {
            const std::size_t hessian = instance * square + index;
            arb_mul_ui(a_hessians + hessian, kappa_hessian + index, scales[instance], precision_bits);
            arb_mul_ui(b_hessians + hessian, beta_hessian + index, scales[instance], precision_bits);
        }
    }
    return all_finite(a_values, carrier_instance_count)
        && all_finite(b_values, carrier_instance_count)
        && all_finite(a_gradients, carrier_instance_count * state_dimension)
        && all_finite(b_gradients, carrier_instance_count * state_dimension)
        && all_finite(a_hessians, carrier_instance_count * square)
        && all_finite(b_hessians, carrier_instance_count * square);
}

std::size_t fixture_count() { return 3U; }
unsigned fixture_mask() {
    const auto results = fixture_results();
    unsigned mask = 0U;
    for (std::size_t index = 0; index < results.size(); ++index) {
        if (results[index]) mask |= 1U << index;
    }
    return mask;
}
std::size_t fixtures_passed() {
    const auto results = fixture_results();
    std::size_t passed = 0U;
    for (const bool result : results) passed += result ? 1U : 0U;
    return passed;
}
bool run_carrier_parameter_fixture_suite() {
    return fixtures_passed() == fixture_count();
}

} // namespace nhm2::g2h_e_s5::primary_carrier_parameters_v1
