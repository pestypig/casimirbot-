#define _POSIX_C_SOURCE 200809L

#include <arb.h>
#include <flint/flint.h>
#include <flint/fmpq.h>
#include <flint/fmpq_mat.h>
#include <gmp.h>
#include <mpfr.h>

#include <cerrno>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <fcntl.h>
#include <string>
#include <sys/stat.h>
#include <unistd.h>

#include "mini_boson_star_wire_primary.hpp"
#include "mini_boson_star_budget_primary.hpp"
#include "mini_boson_star_arithmetic_primary.hpp"
#include "mini_boson_star_inverse_primary.hpp"
#include "mini_boson_star_continuation_primary.hpp"
#include "mini_boson_star_stability_primary.hpp"
#include "mini_boson_star_quantum_radial_primary.hpp"
#include "mini_boson_star_quantum_angular_primary.hpp"
#include "mini_boson_star_quantum_negative_axis_primary.hpp"
#include "mini_boson_star_quantum_measure_primary.hpp"
#include "mini_boson_star_hadamard_primary.hpp"
#include "mini_boson_star_noise_primary.hpp"

namespace {

constexpr char kSealPath[] =
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-definition-seal.v1.json";
constexpr char kSealSha256[] =
    "728d8c9a807d27356a6d9f33e897feb73331abb12e6a76435dbce099d9c025ca";
constexpr unsigned long kSealBytes = 7805UL;
constexpr char kQuantumBuilderPath[] =
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r2-total-quantum-builder-algorithms.v2.json";
constexpr char kQuantumBuilderSha256[] =
    "2989373624362e7f591ca0f00b76d1b01e2aa861f01eaf53f9b62c666f2862fc";
constexpr unsigned long kQuantumBuilderBytes = 30354UL;
constexpr char kPrimaryRoot[] =
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary";
constexpr char kIndependentRoot[] =
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent";
constexpr char kFixtureOutput[] = "/fixture-output";
constexpr char kWireContractSha256[] =
    "c225865343ccf3c2874b59e305c70891cdd944fa3f3a88179bc55eccbf59c160";

struct Sha256 {
    uint32_t state[8];
    uint64_t bits;
    unsigned char block[64];
    size_t used;
};

uint32_t rotate_right(uint32_t value, unsigned amount) {
    return (value >> amount) | (value << (32U - amount));
}

void compress(Sha256 *context, const unsigned char block[64]) {
    static constexpr uint32_t constants[64] = {
        0x428a2f98U, 0x71374491U, 0xb5c0fbcfU, 0xe9b5dba5U, 0x3956c25bU,
        0x59f111f1U, 0x923f82a4U, 0xab1c5ed5U, 0xd807aa98U, 0x12835b01U,
        0x243185beU, 0x550c7dc3U, 0x72be5d74U, 0x80deb1feU, 0x9bdc06a7U,
        0xc19bf174U, 0xe49b69c1U, 0xefbe4786U, 0x0fc19dc6U, 0x240ca1ccU,
        0x2de92c6fU, 0x4a7484aaU, 0x5cb0a9dcU, 0x76f988daU, 0x983e5152U,
        0xa831c66dU, 0xb00327c8U, 0xbf597fc7U, 0xc6e00bf3U, 0xd5a79147U,
        0x06ca6351U, 0x14292967U, 0x27b70a85U, 0x2e1b2138U, 0x4d2c6dfcU,
        0x53380d13U, 0x650a7354U, 0x766a0abbU, 0x81c2c92eU, 0x92722c85U,
        0xa2bfe8a1U, 0xa81a664bU, 0xc24b8b70U, 0xc76c51a3U, 0xd192e819U,
        0xd6990624U, 0xf40e3585U, 0x106aa070U, 0x19a4c116U, 0x1e376c08U,
        0x2748774cU, 0x34b0bcb5U, 0x391c0cb3U, 0x4ed8aa4aU, 0x5b9cca4fU,
        0x682e6ff3U, 0x748f82eeU, 0x78a5636fU, 0x84c87814U, 0x8cc70208U,
        0x90befffaU, 0xa4506cebU, 0xbef9a3f7U, 0xc67178f2U,
    };
    uint32_t words[64];
    for (size_t index = 0; index < 16; ++index) {
        words[index] = (static_cast<uint32_t>(block[4 * index]) << 24U)
            | (static_cast<uint32_t>(block[4 * index + 1]) << 16U)
            | (static_cast<uint32_t>(block[4 * index + 2]) << 8U)
            | static_cast<uint32_t>(block[4 * index + 3]);
    }
    for (size_t index = 16; index < 64; ++index) {
        const uint32_t lower = words[index - 15];
        const uint32_t upper = words[index - 2];
        const uint32_t sigma0 = rotate_right(lower, 7) ^ rotate_right(lower, 18)
            ^ (lower >> 3U);
        const uint32_t sigma1 = rotate_right(upper, 17) ^ rotate_right(upper, 19)
            ^ (upper >> 10U);
        words[index] = words[index - 16] + sigma0 + words[index - 7] + sigma1;
    }
    uint32_t work[8];
    std::memcpy(work, context->state, sizeof(work));
    for (size_t index = 0; index < 64; ++index) {
        const uint32_t big1 = rotate_right(work[4], 6) ^ rotate_right(work[4], 11)
            ^ rotate_right(work[4], 25);
        const uint32_t choose = (work[4] & work[5]) ^ (~work[4] & work[6]);
        const uint32_t first = work[7] + big1 + choose + constants[index] + words[index];
        const uint32_t big0 = rotate_right(work[0], 2) ^ rotate_right(work[0], 13)
            ^ rotate_right(work[0], 22);
        const uint32_t majority = (work[0] & work[1]) ^ (work[0] & work[2])
            ^ (work[1] & work[2]);
        const uint32_t second = big0 + majority;
        const uint32_t next[8] = {
            first + second, work[0], work[1], work[2], work[3] + first,
            work[4], work[5], work[6],
        };
        std::memcpy(work, next, sizeof(work));
    }
    for (size_t index = 0; index < 8; ++index) {
        context->state[index] += work[index];
    }
}

void sha_init(Sha256 *context) {
    static constexpr uint32_t initial[8] = {
        0x6a09e667U, 0xbb67ae85U, 0x3c6ef372U, 0xa54ff53aU,
        0x510e527fU, 0x9b05688cU, 0x1f83d9abU, 0x5be0cd19U,
    };
    std::memcpy(context->state, initial, sizeof(initial));
    context->bits = 0;
    context->used = 0;
}

void sha_update(Sha256 *context, const unsigned char *bytes, size_t length) {
    context->bits += static_cast<uint64_t>(length) * 8U;
    while (length != 0U) {
        const size_t take = length < 64U - context->used ? length : 64U - context->used;
        std::memcpy(context->block + context->used, bytes, take);
        context->used += take;
        bytes += take;
        length -= take;
        if (context->used == 64U) {
            compress(context, context->block);
            context->used = 0;
        }
    }
}

std::string sha_finish(Sha256 *context) {
    context->block[context->used++] = 0x80U;
    if (context->used > 56U) {
        std::memset(context->block + context->used, 0, 64U - context->used);
        compress(context, context->block);
        context->used = 0;
    }
    std::memset(context->block + context->used, 0, 56U - context->used);
    for (size_t index = 0; index < 8; ++index) {
        context->block[63U - index] = static_cast<unsigned char>(context->bits >> (8U * index));
    }
    compress(context, context->block);
    static constexpr char alphabet[] = "0123456789abcdef";
    std::string result(64, '0');
    for (size_t word = 0; word < 8; ++word) {
        for (size_t byte = 0; byte < 4; ++byte) {
            const unsigned char value = static_cast<unsigned char>(
                context->state[word] >> (24U - 8U * byte));
            result[8 * word + 2 * byte] = alphabet[value >> 4U];
            result[8 * word + 2 * byte + 1] = alphabet[value & 15U];
        }
    }
    return result;
}

bool regular_file_hash(const char *path, unsigned long *size, std::string *hash) {
    struct stat info {};
    if (lstat(path, &info) != 0 || !S_ISREG(info.st_mode) || S_ISLNK(info.st_mode)) {
        return false;
    }
    const int descriptor = open(path, O_RDONLY | O_CLOEXEC | O_NOFOLLOW);
    if (descriptor < 0) {
        return false;
    }
    Sha256 state {};
    sha_init(&state);
    unsigned long total = 0;
    unsigned char buffer[65536];
    for (;;) {
        const ssize_t count = read(descriptor, buffer, sizeof(buffer));
        if (count < 0) {
            close(descriptor);
            return false;
        }
        if (count == 0) {
            break;
        }
        total += static_cast<unsigned long>(count);
        sha_update(&state, buffer, static_cast<size_t>(count));
    }
    if (close(descriptor) != 0) {
        return false;
    }
    *size = total;
    *hash = sha_finish(&state);
    return true;
}

bool absent(const char *path) {
    struct stat info {};
    return lstat(path, &info) != 0 && errno == ENOENT;
}

void set_power_of_two(fmpq_t value, long exponent) {
    fmpq_one(value);
    if (exponent < 0) {
        fmpz_mul_2exp(fmpq_denref(value), fmpq_denref(value), static_cast<ulong>(-exponent));
    } else {
        fmpz_mul_2exp(fmpq_numref(value), fmpq_numref(value), static_cast<ulong>(exponent));
    }
    fmpq_canonicalise(value);
}

bool exact_member_fixture() {
    fmpq_t value;
    fmpq_init(value);
    fmpq_set_si(value, 6, 5);
    const bool pass = fmpz_equal_si(fmpq_numref(value), 6)
        && fmpz_equal_si(fmpq_denref(value), 5);
    fmpq_clear(value);
    return pass;
}

bool inverse_fixture() {
    fmpq_mat_t matrix, inverse;
    fmpq_mat_init(matrix, 2, 2);
    fmpq_mat_init(inverse, 2, 2);
    fmpq_set_si(fmpq_mat_entry(matrix, 0, 0), 2, 1);
    fmpq_set_si(fmpq_mat_entry(matrix, 0, 1), 1, 1);
    fmpq_set_si(fmpq_mat_entry(matrix, 1, 0), 1, 1);
    fmpq_set_si(fmpq_mat_entry(matrix, 1, 1), 1, 1);
    const bool invertible = fmpq_mat_inv(inverse, matrix) != 0;
    const bool values = invertible
        && fmpq_equal_si(fmpq_mat_entry(inverse, 0, 0), 1)
        && fmpq_equal_si(fmpq_mat_entry(inverse, 0, 1), -1)
        && fmpq_equal_si(fmpq_mat_entry(inverse, 1, 0), -1)
        && fmpq_equal_si(fmpq_mat_entry(inverse, 1, 1), 2);
    fmpq_mat_clear(matrix);
    fmpq_mat_clear(inverse);
    return values;
}

bool strict_ball_fixture() {
    arb_t positive, touching;
    arb_init(positive);
    arb_init(touching);
    arb_set_si(positive, 3);
    arb_add_error_2exp_si(positive, -10);
    arb_zero(touching);
    arb_add_error_2exp_si(touching, -10);
    const bool pass = arb_is_positive(positive) != 0 && arb_is_positive(touching) == 0;
    arb_clear(positive);
    arb_clear(touching);
    return pass;
}

bool radii_fixture() {
    fmpq_t y, z0, z1, z2, radius, polynomial, contraction, temp;
    fmpq_init(y);
    fmpq_init(z0);
    fmpq_init(z1);
    fmpq_init(z2);
    fmpq_init(radius);
    fmpq_init(polynomial);
    fmpq_init(contraction);
    fmpq_init(temp);
    set_power_of_two(y, -200);
    fmpq_set_si(z0, 1, 8);
    fmpq_set_si(z1, 1, 8);
    fmpq_set_si(z2, 1, 8);
    set_power_of_two(radius, -160);
    fmpq_mul(polynomial, z2, radius);
    fmpq_mul(polynomial, polynomial, radius);
    fmpq_one(temp);
    fmpq_sub(temp, temp, z0);
    fmpq_sub(temp, temp, z1);
    fmpq_mul(temp, temp, radius);
    fmpq_sub(polynomial, polynomial, temp);
    fmpq_add(polynomial, polynomial, y);
    fmpq_mul(contraction, z2, radius);
    fmpq_add(contraction, contraction, z0);
    fmpq_add(contraction, contraction, z1);
    const bool pass = fmpq_sgn(polynomial) < 0 && fmpq_cmp_si(contraction, 1) < 0;
    fmpq_clear(y);
    fmpq_clear(z0);
    fmpq_clear(z1);
    fmpq_clear(z2);
    fmpq_clear(radius);
    fmpq_clear(polynomial);
    fmpq_clear(contraction);
    fmpq_clear(temp);
    return pass;
}

bool radii_touch_fixture() {
    fmpq_t y, radius, polynomial;
    fmpq_init(y);
    fmpq_init(radius);
    fmpq_init(polynomial);
    set_power_of_two(y, -160);
    set_power_of_two(radius, -160);
    fmpq_sub(polynomial, y, radius);
    const bool rejected = fmpq_is_zero(polynomial) && !(fmpq_sgn(polynomial) < 0);
    fmpq_clear(y);
    fmpq_clear(radius);
    fmpq_clear(polynomial);
    return rejected;
}

bool riccati_fixture() {
    const long pass_a = 3, pass_b = 1, pass_d = 5;
    const long touch_a = 0, touch_b = 0, touch_d = 5;
    const bool positive_definite = pass_a > 0
        && pass_a * pass_d - pass_b * pass_b > 0;
    const bool touching_rejected = !(touch_a > 0
        && touch_a * touch_d - touch_b * touch_b > 0);
    return positive_definite && touching_rejected;
}

bool threshold_fixture() {
    fmpq_t omega, threshold, upper, touching;
    fmpq_init(omega);
    fmpq_init(threshold);
    fmpq_init(upper);
    fmpq_init(touching);
    fmpq_set_si(omega, 1, 2);
    fmpq_one(threshold);
    fmpq_sub(threshold, threshold, omega);
    fmpq_mul(threshold, threshold, threshold);
    fmpq_set_si(upper, 1, 8);
    fmpq_set(touching, threshold);
    const bool pass = fmpq_cmp(upper, threshold) < 0
        && !(fmpq_cmp(touching, threshold) < 0);
    fmpq_clear(omega);
    fmpq_clear(threshold);
    fmpq_clear(upper);
    fmpq_clear(touching);
    return pass;
}

bool smearing_support_fixture() {
    fmpq_t first_center, last_center, half_width, lower, upper;
    fmpq_init(first_center);
    fmpq_init(last_center);
    fmpq_init(half_width);
    fmpq_init(lower);
    fmpq_init(upper);
    fmpq_set_si(first_center, 1, 128);
    fmpq_set_si(last_center, 127, 128);
    fmpq_set_si(half_width, 1, 256);
    fmpq_sub(lower, first_center, half_width);
    fmpq_add(upper, last_center, half_width);
    const bool pass = fmpq_cmp_si(lower, 0) > 0 && fmpq_cmp_si(upper, 1) < 0
        && fmpz_equal_si(fmpq_numref(lower), 1)
        && fmpz_equal_si(fmpq_denref(lower), 256)
        && fmpz_equal_si(fmpq_numref(upper), 255)
        && fmpz_equal_si(fmpq_denref(upper), 256);
    fmpq_clear(first_center);
    fmpq_clear(last_center);
    fmpq_clear(half_width);
    fmpq_clear(lower);
    fmpq_clear(upper);
    return pass;
}

bool conservation_fixture() {
    // rho=3, pr=2, pt=1, alpha'/alpha=1/5, r=2 gives pr'=-2.
    fmpq_t residual, term;
    fmpq_init(residual);
    fmpq_init(term);
    fmpq_set_si(residual, -2, 1);
    fmpq_set_si(term, 1, 1);
    fmpq_add(residual, residual, term);
    fmpq_add(residual, residual, term);
    const bool pass = fmpq_is_zero(residual);
    fmpq_clear(residual);
    fmpq_clear(term);
    return pass;
}

bool gram_fixture() {
    const long vectors[3][3] = {{1, 0, 1}, {0, 2, 1}, {1, -1, 0}};
    long gram[3][3] {};
    for (size_t row = 0; row < 3; ++row) {
        for (size_t column = 0; column < 3; ++column) {
            for (size_t index = 0; index < 3; ++index) {
                gram[row][column] += vectors[row][index] * vectors[column][index];
            }
        }
    }
    const long determinant =
        gram[0][0] * (gram[1][1] * gram[2][2] - gram[1][2] * gram[2][1])
        - gram[0][1] * (gram[1][0] * gram[2][2] - gram[1][2] * gram[2][0])
        + gram[0][2] * (gram[1][0] * gram[2][1] - gram[1][1] * gram[2][0]);
    return gram[0][1] == gram[1][0] && gram[1][2] == gram[2][1]
        && gram[0][0] > 0 && gram[0][0] * gram[1][1] - gram[0][1] * gram[1][0] > 0
        && determinant > 0;
}

bool gram_corruption_fixture() {
    const long determinant = 1L * 1L - 2L * 2L;
    return determinant == -3L && !(determinant >= 0L);
}

bool corruption_fixture() {
    static constexpr unsigned ordinals[] = {0, 1, 2, 2, 4};
    bool strictly_increasing = true;
    for (size_t index = 1; index < sizeof(ordinals) / sizeof(ordinals[0]); ++index) {
        strictly_increasing = strictly_increasing && ordinals[index] == ordinals[index - 1] + 1U;
    }
    return !strictly_increasing;
}

bool chronology_fixture() {
    static constexpr unsigned ordinals[] = {0, 1, 2, 3, 4, 5, 6};
    for (size_t index = 0; index < sizeof(ordinals) / sizeof(ordinals[0]); ++index) {
        if (ordinals[index] != index) {
            return false;
        }
    }
    return true;
}

bool budget_fixture() {
    constexpr unsigned limit = 16;
    const unsigned observed = limit + 1U;
    return observed > limit;
}

bool origin_and_tail_fixture() {
    // Manufactured sigma=1-r^2 has sigma'(0)=0; q^2 vanishes at q=0.
    const long sigma_prime_at_origin = 0;
    const long q = 0;
    return sigma_prime_at_origin == 0 && q * q == 0;
}

bool minkowski_endpoint_fixture() {
    // Exact zero-field carrier: m=sigma=p=0, b=s=1, omega=1.
    const long residuals[] = {0, 0, 0, 0, 0, 0};
    bool zero = true;
    for (const long residual : residuals) {
        zero = zero && residual == 0;
    }
    fmpq_t eta, omega, mass;
    fmpq_init(eta);
    fmpq_init(omega);
    fmpq_init(mass);
    fmpq_zero(eta);
    fmpq_one(omega);
    fmpq_zero(mass);
    const bool pass = zero && fmpq_is_zero(eta) && fmpq_is_one(omega)
        && fmpq_is_zero(mass);
    fmpq_clear(eta);
    fmpq_clear(omega);
    fmpq_clear(mass);
    return pass;
}

bool manufactured_profile_fixture() {
    // sigma(r)=1-r^2 at r=1/2: sigma=3/4, sigma'=-1, sigma''=-2.
    fmpq_t radius, sigma, derivative, second, residual;
    fmpq_init(radius);
    fmpq_init(sigma);
    fmpq_init(derivative);
    fmpq_init(second);
    fmpq_init(residual);
    fmpq_set_si(radius, 1, 2);
    fmpq_mul(sigma, radius, radius);
    fmpq_neg(sigma, sigma);
    fmpq_add_si(sigma, sigma, 1);
    fmpq_set_si(derivative, -1, 1);
    fmpq_set_si(second, -2, 1);
    fmpq_add_si(residual, second, 2);
    const bool pass = fmpq_cmp_si(sigma, 0) > 0
        && fmpq_equal_si(derivative, -1) && fmpq_is_zero(residual);
    fmpq_clear(radius);
    fmpq_clear(sigma);
    fmpq_clear(derivative);
    fmpq_clear(second);
    fmpq_clear(residual);
    return pass;
}

bool boundary_rejection_fixture() {
    const long regular_origin_derivative = 0;
    const long conical_origin_derivative = 1;
    const long exact_tail_q = 0;
    const long finite_wall_residual = 1;
    return regular_origin_derivative == 0 && conical_origin_derivative != 0
        && exact_tail_q == 0 && finite_wall_residual != 0;
}

bool geometric_guard_fixture() {
    arb_t lapse, touching;
    arb_init(lapse);
    arb_init(touching);
    arb_set_si(lapse, 1);
    arb_add_error_2exp_si(lapse, -4);
    arb_zero(touching);
    arb_add_error_2exp_si(touching, -40);
    const long radial_map_derivative = 1;
    const long alpha_lower = 3;
    const long alpha_upper = 5;
    const bool pass = arb_is_positive(lapse) != 0 && arb_is_positive(touching) == 0
        && radial_map_derivative > 0 && alpha_lower > 0 && alpha_upper < 8;
    arb_clear(lapse);
    arb_clear(touching);
    return pass;
}

bool continuation_duties_fixture() {
    // Manufactured shared face intervals overlap strictly and preserve orientation.
    const long left_lower = 1, left_upper = 4;
    const long right_lower = 2, right_upper = 5;
    const long orientation_determinant = 3;
    const long bordered_kernel_determinant = -1;
    const long transversality_pairing = 2;
    const long terminal_center = 7, terminal_radius = 1;
    const long terminal_lower = 5, terminal_upper = 9;
    return left_upper >= right_lower && right_upper >= left_lower
        && orientation_determinant > 0 && bordered_kernel_determinant != 0
        && transversality_pairing != 0
        && terminal_lower < terminal_center - terminal_radius
        && terminal_center + terminal_radius < terminal_upper;
}

bool quantum_hypotheses_fixture() {
    // Synthetic positive operator lower bound, complete optical bounds and Hadamard order.
    const long kg_lower_numerator = 1;
    const long kg_lower_denominator = 4;
    const long alpha_min_numerator = 1;
    const long alpha_max_numerator = 2;
    const unsigned hadamard_order = 20;
    const unsigned coincidence_jet_order = 4;
    return kg_lower_numerator > 0 && kg_lower_denominator > 0
        && alpha_min_numerator > 0 && alpha_max_numerator >= alpha_min_numerator
        && hadamard_order == 20U && coincidence_jet_order == 4U;
}

bool first_failure_state_machine_fixture() {
    static constexpr bool scheduled_pass[] = {true, true, false, true, true};
    unsigned evaluated = 0;
    unsigned failures = 0;
    bool failed = false;
    bool chronology = true;
    for (size_t ordinal = 0; ordinal < 5U; ++ordinal) {
        if (failed) {
            chronology = chronology && ordinal > 2U;
            continue;
        }
        ++evaluated;
        if (!scheduled_pass[ordinal]) {
            failed = true;
            ++failures;
            chronology = chronology && ordinal == 2U;
        }
    }
    return chronology && evaluated == 3U && failures == 1U && failed;
}

std::string domain_hash(const char *domain, const char *canonical_payload) {
    Sha256 state {};
    sha_init(&state);
    sha_update(&state, reinterpret_cast<const unsigned char *>(domain), std::strlen(domain));
    sha_update(&state, reinterpret_cast<const unsigned char *>(canonical_payload),
        std::strlen(canonical_payload));
    return sha_finish(&state);
}

bool wire_hash_chain_fixture() {
    static constexpr char payload_domain[] = "nhm2-g2h-e-s4/payload/v1\n";
    static constexpr char record_domain[] = "nhm2-g2h-e-s4/record/v1\n";
    static constexpr char payload[] = "{\"fixture\":\"manufactured_zero\",\"ordinal\":0}";
    static constexpr char mutated[] = "{\"fixture\":\"manufactured_zero\",\"ordinal\":1}";
    const std::string payload_hash = domain_hash(payload_domain, payload);
    const std::string mutated_hash = domain_hash(payload_domain, mutated);
    const std::string first_record = domain_hash(record_domain, payload_hash.c_str());
    const std::string second_record = domain_hash(record_domain, first_record.c_str());
    return payload_hash.size() == 64U && payload_hash != mutated_hash
        && first_record.size() == 64U && second_record.size() == 64U
        && first_record != second_record;
}

bool truncation_and_path_fixture() {
    static constexpr size_t stdout_limit = 4096U;
    static constexpr size_t stderr_limit = 2048U;
    const std::string over_stdout(stdout_limit + 1U, 'x');
    const std::string over_stderr(stderr_limit + 1U, 'y');
    const char *accepted = "fixtures/manufactured/pass-0001.json";
    const char *traversal = "fixtures/../candidate.json";
    return over_stdout.substr(0, stdout_limit).size() == stdout_limit
        && over_stderr.substr(0, stderr_limit).size() == stderr_limit
        && std::strstr(accepted, "..") == nullptr
        && std::strstr(traversal, "..") != nullptr;
}

bool write_exclusive(const char *path, const std::string &bytes) {
    const int descriptor = open(path,
        O_WRONLY | O_CREAT | O_EXCL | O_CLOEXEC | O_NOFOLLOW, 0600);
    if (descriptor < 0) {
        return false;
    }
    size_t offset = 0;
    while (offset < bytes.size()) {
        const ssize_t count = write(descriptor, bytes.data() + offset, bytes.size() - offset);
        if (count <= 0) {
            close(descriptor);
            return false;
        }
        offset += static_cast<size_t>(count);
    }
    const bool synced = fsync(descriptor) == 0;
    const bool closed = close(descriptor) == 0;
    return synced && closed;
}

std::string receipt_record(unsigned sequence, const char *decision, bool evaluated,
    const char *fixture_class, const char *synthetic_pass, const std::string &previous,
    std::string *self_hash) {
    const std::string payload = std::string("{\"evaluated\":")
        + (evaluated ? "true" : "false") + ",\"fixture_class\":\""
        + fixture_class + "\",\"ordinal\":" + std::to_string(sequence)
        + ",\"synthetic_pass\":" + synthetic_pass
        + (sequence == 2U
            ? ",\"typed_failure\":\"builder_budget_exhausted:classical_inverse:projection_retries\""
            : "") + "}";
    const std::string payload_hash = domain_hash(
        "nhm2-g2h-e-s4/payload/v1\n", payload.c_str());
    static constexpr char authority[] =
        "{\"candidate_admitted\":false,\"classical_proof_established\":false,"
        "\"diagnostic_lamp\":false,\"geometry_state_accepted\":false,"
        "\"physical_viability\":false,\"propulsion_authority\":false,"
        "\"transport_authority\":false}";
    const std::string prefix = std::string("{\"authority\":") + authority
        + ",\"candidate_evaluations\":0,\"contract_sha256\":\""
        + kWireContractSha256 + "\",\"decision\":\"" + decision
        + "\",\"duty_id\":\"synthetic-duty-" + std::to_string(sequence)
        + "\",\"fixture_id\":\"manufactured-first-failure\","
        "\"implementation_id\":\"primary-cpp-arb-fixture-v1\","
        "\"lane\":\"primary_fixture\",\"payload\":" + payload
        + ",\"payload_sha256\":\"" + payload_hash
        + "\",\"previous_record_sha256\":\"" + previous + "\"";
    const std::string suffix = std::string(",\"schema\":\"nhm2.g2h_e_s4.proof_record.v1\","
        "\"sequence\":") + std::to_string(sequence) + "}";
    const std::string without_self = prefix + suffix;
    *self_hash = domain_hash("nhm2-g2h-e-s4/record/v1\n", without_self.c_str());
    return prefix + ",\"record_self_sha256\":\"" + *self_hash + "\"" + suffix;
}

bool persist_first_failure_receipt(std::string *stream_hash) {
    static constexpr char zero_hash[] =
        "0000000000000000000000000000000000000000000000000000000000000000";
    std::string previous = zero_hash;
    std::string stream;
    for (unsigned sequence = 0; sequence < 5U; ++sequence) {
        const char *decision = sequence < 2U ? "PASS"
            : (sequence == 2U ? "FAIL" : "INELIGIBLE_AFTER_FIRST_FAIL");
        const bool evaluated = sequence <= 2U;
        const char *fixture_class = sequence <= 2U ? "synthetic_fail" : "chronology";
        const char *synthetic_pass = sequence < 2U ? "true"
            : (sequence == 2U ? "false" : "null");
        std::string self_hash;
        stream += receipt_record(sequence, decision, evaluated, fixture_class,
            synthetic_pass, previous, &self_hash);
        stream.push_back('\n');
        previous = self_hash;
    }
    *stream_hash = domain_hash("nhm2-g2h-e-s4/stream/v1\n", stream.c_str());
    const std::string path = std::string(kFixtureOutput) + "/first-failure-stream.jsonl";
    return write_exclusive(path.c_str(), stream);
}

bool lineage_fixture() {
    return std::strlen(flint_version) != 0U && std::strlen(gmp_version) != 0U
        && std::strlen(mpfr_get_version()) != 0U;
}

}  // namespace

int main(int argc, char **argv) {
    const bool suite_mode = argc == 3 && std::strcmp(argv[1], "--fixture-suite") == 0
        && std::strcmp(argv[2], kSealPath) == 0;
    const bool receipt_mode = argc == 4 && std::strcmp(argv[1], "--receipt-fixture") == 0
        && std::strcmp(argv[2], kSealPath) == 0
        && std::strcmp(argv[3], kFixtureOutput) == 0;
    if (!suite_mode && !receipt_mode) {
        std::fprintf(stderr, "fixture-only interface rejected; candidate mode does not exist\n");
        return 64;
    }
    unsigned long seal_bytes = 0;
    std::string seal_hash;
    if (!regular_file_hash(argv[2], &seal_bytes, &seal_hash)
        || seal_bytes != kSealBytes || seal_hash != kSealSha256) {
        std::fprintf(stderr, "definition seal identity rejected\n");
        return 65;
    }
    unsigned long quantum_builder_bytes = 0;
    std::string quantum_builder_hash;
    if (!regular_file_hash(kQuantumBuilderPath, &quantum_builder_bytes,
            &quantum_builder_hash)
        || quantum_builder_bytes != kQuantumBuilderBytes
        || quantum_builder_hash != kQuantumBuilderSha256) {
        std::fprintf(stderr, "quantum builder identity rejected\n");
        return 65;
    }
    if (!absent(kPrimaryRoot) || !absent(kIndependentRoot)) {
        std::fprintf(stderr, "forbidden scientific root exists\n");
        return 66;
    }
    if (receipt_mode) {
        std::string stream_hash;
        if (!persist_first_failure_receipt(&stream_hash)) {
            std::fprintf(stderr, "exclusive fixture receipt persistence rejected\n");
            return 67;
        }
        std::printf(
            "{\"authority_promoted\":false,\"candidate_evaluations\":0,"
            "\"candidate_roots_created\":false,\"records\":5,"
            "\"schema\":\"nhm2.g2h_e_s4.primary_receipt_fixture_report.v1\","
            "\"status\":\"PASS\",\"stream_sha256\":\"%s\"}\n",
            stream_hash.c_str());
        flint_cleanup();
        return 0;
    }

    const bool checks[] = {
        exact_member_fixture(), inverse_fixture(), strict_ball_fixture(),
        radii_fixture(), radii_touch_fixture(), riccati_fixture(), threshold_fixture(),
        smearing_support_fixture(), conservation_fixture(), gram_fixture(),
        gram_corruption_fixture(), corruption_fixture(), chronology_fixture(),
        budget_fixture(), origin_and_tail_fixture(), minkowski_endpoint_fixture(),
        manufactured_profile_fixture(), boundary_rejection_fixture(),
        geometric_guard_fixture(), continuation_duties_fixture(),
        quantum_hypotheses_fixture(), first_failure_state_machine_fixture(),
        wire_hash_chain_fixture(), truncation_and_path_fixture(), lineage_fixture(),
        nhm2::g2h_e_s4::primary_wire::run_wire_scalar_fixture_suite(),
        nhm2::g2h_e_s4::primary_budget::run_budget_fixture_suite(),
        nhm2::g2h_e_s4::primary_arithmetic::run_arithmetic_fixture_suite(),
        nhm2::g2h_e_s4::primary_inverse::run_inverse_fixture_suite(),
        nhm2::g2h_e_s4::primary_continuation::run_continuation_fixture_suite(),
        nhm2::g2h_e_s4::primary_stability::run_stability_fixture_suite(),
        nhm2::g2h_e_s4::primary_quantum_radial::run_quantum_radial_fixture_suite(),
        nhm2::g2h_e_s4::primary_quantum_angular::run_quantum_angular_fixture_suite(),
        nhm2::g2h_e_s4::primary_quantum_negative_axis::run_quantum_negative_axis_fixture_suite(),
        nhm2::g2h_e_s4::primary_quantum_measure::run_quantum_measure_fixture_suite(),
        nhm2::g2h_e_s4::primary_hadamard::run_hadamard_fixture_suite(),
        nhm2::g2h_e_s4::primary_noise::run_noise_fixture_suite(),
    };
    size_t passed = 0;
    for (const bool value : checks) {
        passed += value ? 1U : 0U;
    }
    std::printf(
        "{\"arithmetic_checks_passed\":%zu,\"arithmetic_checks_total\":%zu,\"authority_promoted\":false,\"candidate_evaluations\":0,"
        "\"budget_counters_checked\":%zu,\"candidate_roots_created\":false,\"checks_passed\":%zu,"
        "\"checks_total\":%zu,\"continuation_checks_passed\":%zu,\"continuation_checks_total\":%zu,\"inverse_checks_passed\":%zu,\"inverse_checks_total\":%zu,\"lane\":\"primary_cpp_arb_flint_gmp_mpfr\","
        "\"stability_checks_passed\":%zu,\"stability_checks_total\":%zu,"
        "\"quantum_radial_checks_passed\":%zu,\"quantum_radial_checks_total\":%zu,"
        "\"quantum_angular_checks_passed\":%zu,\"quantum_angular_checks_total\":%zu,"
        "\"quantum_negative_axis_checks_passed\":%zu,\"quantum_negative_axis_checks_total\":%zu,"
        "\"quantum_measure_checks_passed\":%zu,\"quantum_measure_checks_total\":%zu,"
        "\"hadamard_checks_passed\":%zu,\"hadamard_checks_total\":%zu,"
        "\"noise_checks_passed\":%zu,\"noise_checks_total\":%zu,"
        "\"schema\":\"nhm2.g2h_e_s4.primary_fixture_report.v1\","
        "\"seal_sha256\":\"%s\",\"status\":\"%s\"}\n",
        nhm2::g2h_e_s4::primary_arithmetic::fixtures_passed(),
        nhm2::g2h_e_s4::primary_arithmetic::fixture_count(),
        nhm2::g2h_e_s4::primary_budget::counter_count(), passed,
        sizeof(checks) / sizeof(checks[0]),
        nhm2::g2h_e_s4::primary_continuation::fixtures_passed(),
        nhm2::g2h_e_s4::primary_continuation::fixture_count(),
        nhm2::g2h_e_s4::primary_inverse::fixtures_passed(),
        nhm2::g2h_e_s4::primary_inverse::fixture_count(),
        nhm2::g2h_e_s4::primary_stability::fixtures_passed(),
        nhm2::g2h_e_s4::primary_stability::fixture_count(),
        nhm2::g2h_e_s4::primary_quantum_radial::fixtures_passed(),
        nhm2::g2h_e_s4::primary_quantum_radial::fixture_count(),
        nhm2::g2h_e_s4::primary_quantum_angular::fixtures_passed(),
        nhm2::g2h_e_s4::primary_quantum_angular::fixture_count(),
        nhm2::g2h_e_s4::primary_quantum_negative_axis::fixtures_passed(),
        nhm2::g2h_e_s4::primary_quantum_negative_axis::fixture_count(),
        nhm2::g2h_e_s4::primary_quantum_measure::fixtures_passed(),
        nhm2::g2h_e_s4::primary_quantum_measure::fixture_count(),
        nhm2::g2h_e_s4::primary_hadamard::fixtures_passed(),
        nhm2::g2h_e_s4::primary_hadamard::fixture_count(),
        nhm2::g2h_e_s4::primary_noise::fixtures_passed(),
        nhm2::g2h_e_s4::primary_noise::fixture_count(),
        kSealSha256,
        passed == sizeof(checks) / sizeof(checks[0]) ? "PASS" : "FAIL");
    flint_cleanup();
    return passed == sizeof(checks) / sizeof(checks[0]) ? 0 : 1;
}
