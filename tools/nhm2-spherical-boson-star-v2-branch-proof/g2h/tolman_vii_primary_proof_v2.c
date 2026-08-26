#define _POSIX_C_SOURCE 200809L

#include <errno.h>
#include <fcntl.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

#include "tolman_vii_primary_surface_gate.c"

#define CONTRACT_SHA256 "30de966d41d6342e8a047ee655a33e02f68d32a6ba49efcb39b0bbd7981c343d"
#define CONTRACT_BYTES 15569UL
#define TOKEN_SHA256 "d54ee55da5967062bfbc080bcfb3d962b07ed69b08e4316b3973aa5b24d2ff4b"
#define PRIMARY_ROOT "artifacts/research/nhm2/g2h/tolman-vii-primary-v2"
#define EXHAUSTED_PRIMARY_ROOT "artifacts/research/nhm2/g2h/tolman-vii-primary-v1"
#define INDEPENDENT_ROOT "artifacts/research/nhm2/g2h/tolman-vii-independent-v1"
#define ZERO_HASH "0000000000000000000000000000000000000000000000000000000000000000"

typedef struct {
    uint32_t state[8];
    uint64_t bit_count;
    unsigned char block[64];
    size_t used;
} primary_sha256;

typedef struct {
    const char *name;
    unsigned long bytes;
    const char *sha256;
} frozen_source;

static const frozen_source FROZEN_SOURCES[] = {
    {"tolman_vii_exact.pdf", 684526UL,
     "a36fe51c5e54b306260f7950a831c527cced0892e24fbc8bd54dce39093f3438"},
    {"tolman_vii_independent.pdf", 119321UL,
     "81389455a1d94d1b46bc5f16e242f8f1f873a2aa551c41fc4aa34bc7f9aa51ac"},
    {"static_hadamard.pdf", 621871UL,
     "d65a9f9f82212aeabc1ae99e41315ebea2595d4c2676deeac89e9c188294aea6"},
    {"hadamard_rset.pdf", 448374UL,
     "676f41aac1dcff7f622ac147936e58e5e2ff60939a9688043d1657b92db29977"},
    {"noise_kernel.pdf", 283952UL,
     "38f2698b3f1dbefb3eda28d8aa24520818a021fb3f648376c56247c62bf2e820"},
    {"renormalized_fluctuations.pdf", 452153UL,
     "8642014b6bc46c5965fed0a7de217fd9ad0ffc3786418e684d3b05bba495df3e"},
    {"radial_stability.pdf", 968364UL,
     "be355176953fa63691948105a7e2e4f0ef3ed63d13adb34265b02c6c76cd509a"},
};

static const char *DUTY_IDS[] = {
    "G2G-C01", "G2G-C02", "G2G-C03", "G2G-C04", "G2G-C05", "G2G-C06",
    "G2G-C07", "G2G-C08", "G2G-C09", "G2G-C10", "G2G-C11", "G2G-C12",
    "G2G-Q01", "G2G-Q02", "G2G-Q03", "G2G-Q04", "G2G-Q05", "G2G-Q06",
};

static const char *DUTY_ALGORITHMS[] = {
    "byte ingress and exact member identity",
    "dual exact fmpq mass and metric derivation",
    "Arb automatic-differentiation isotropy residual and surface conditions",
    "Arb Einstein and TOV identity residuals on fixed cells",
    "even origin Taylor model with exact remainder order",
    "fixed 256-cell Arb positivity and monotonicity enclosure",
    "exact fmpq polynomial minimum and horizon margin",
    "fixed-cell sound-speed quotient with analytic endpoint limits",
    "fixed-cell dominant weak and strong energy-condition enclosures",
    "fixed-cell adiabatic-index lower enclosure",
    "interval Sturm sequence and continuum Rayleigh remainder lower bound",
    "exact Darmois forms and fixed q-series asymptotic cells",
    "surface-germ regularity global-hyperbolicity and completeness assumptions",
    "Friedrichs quadratic-form lower bound and essential self-adjointness inventory",
    "static-ground-state theorem assumptions and microlocal spectrum inventory",
    "same-state same-scale zero-ambiguity identity binding",
    "Hadamard conservation and smeared positive-type interval witnesses",
    "immutable cross-lane mode RSET and smeared-noise agreement ABI",
};

static uint32_t primary_rotate(uint32_t value, unsigned amount) {
    return (value >> amount) | (value << (32U - amount));
}

static void primary_sha256_compress(primary_sha256 *context, const unsigned char block[64]) {
    static const uint32_t constants[64] = {
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
        words[index] = ((uint32_t)block[index * 4] << 24)
            | ((uint32_t)block[index * 4 + 1] << 16)
            | ((uint32_t)block[index * 4 + 2] << 8)
            | (uint32_t)block[index * 4 + 3];
    }
    for (size_t index = 16; index < 64; ++index) {
        const uint32_t a = words[index - 15];
        const uint32_t b = words[index - 2];
        const uint32_t small0 = primary_rotate(a, 7) ^ primary_rotate(a, 18) ^ (a >> 3);
        const uint32_t small1 = primary_rotate(b, 17) ^ primary_rotate(b, 19) ^ (b >> 10);
        words[index] = words[index - 16] + small0 + words[index - 7] + small1;
    }
    uint32_t a = context->state[0];
    uint32_t b = context->state[1];
    uint32_t c = context->state[2];
    uint32_t d = context->state[3];
    uint32_t e = context->state[4];
    uint32_t f = context->state[5];
    uint32_t g = context->state[6];
    uint32_t h = context->state[7];
    for (size_t index = 0; index < 64; ++index) {
        const uint32_t large1 = primary_rotate(e, 6) ^ primary_rotate(e, 11)
            ^ primary_rotate(e, 25);
        const uint32_t choose = (e & f) ^ ((~e) & g);
        const uint32_t temporary1 = h + large1 + choose + constants[index] + words[index];
        const uint32_t large0 = primary_rotate(a, 2) ^ primary_rotate(a, 13)
            ^ primary_rotate(a, 22);
        const uint32_t majority = (a & b) ^ (a & c) ^ (b & c);
        const uint32_t temporary2 = large0 + majority;
        h = g;
        g = f;
        f = e;
        e = d + temporary1;
        d = c;
        c = b;
        b = a;
        a = temporary1 + temporary2;
    }
    context->state[0] += a;
    context->state[1] += b;
    context->state[2] += c;
    context->state[3] += d;
    context->state[4] += e;
    context->state[5] += f;
    context->state[6] += g;
    context->state[7] += h;
}

static void primary_sha256_init(primary_sha256 *context) {
    const uint32_t initial[8] = {
        0x6a09e667U, 0xbb67ae85U, 0x3c6ef372U, 0xa54ff53aU,
        0x510e527fU, 0x9b05688cU, 0x1f83d9abU, 0x5be0cd19U,
    };
    memcpy(context->state, initial, sizeof(initial));
    context->bit_count = 0;
    context->used = 0;
}

static void primary_sha256_update(primary_sha256 *context, const unsigned char *data,
                                  size_t length) {
    context->bit_count += (uint64_t)length * 8U;
    while (length > 0) {
        const size_t available = 64U - context->used;
        const size_t take = length < available ? length : available;
        memcpy(context->block + context->used, data, take);
        context->used += take;
        data += take;
        length -= take;
        if (context->used == 64U) {
            primary_sha256_compress(context, context->block);
            context->used = 0;
        }
    }
}

static void primary_sha256_final(primary_sha256 *context, unsigned char digest[32]) {
    context->block[context->used++] = 0x80U;
    if (context->used > 56U) {
        memset(context->block + context->used, 0, 64U - context->used);
        primary_sha256_compress(context, context->block);
        context->used = 0;
    }
    memset(context->block + context->used, 0, 56U - context->used);
    for (size_t index = 0; index < 8; ++index) {
        context->block[63U - index] = (unsigned char)(context->bit_count >> (index * 8U));
    }
    primary_sha256_compress(context, context->block);
    for (size_t index = 0; index < 8; ++index) {
        digest[index * 4] = (unsigned char)(context->state[index] >> 24);
        digest[index * 4 + 1] = (unsigned char)(context->state[index] >> 16);
        digest[index * 4 + 2] = (unsigned char)(context->state[index] >> 8);
        digest[index * 4 + 3] = (unsigned char)context->state[index];
    }
}

static void primary_hex(const unsigned char digest[32], char output[65]) {
    static const char alphabet[] = "0123456789abcdef";
    for (size_t index = 0; index < 32; ++index) {
        output[index * 2] = alphabet[digest[index] >> 4];
        output[index * 2 + 1] = alphabet[digest[index] & 15U];
    }
    output[64] = '\0';
}

static int primary_hash_bytes(const unsigned char *data, size_t length, char output[65]) {
    primary_sha256 context;
    unsigned char digest[32];
    primary_sha256_init(&context);
    primary_sha256_update(&context, data, length);
    primary_sha256_final(&context, digest);
    primary_hex(digest, output);
    return 1;
}

static int primary_hash_descriptor(int descriptor, char output[65],
                                   unsigned long *byte_count) {
    primary_sha256 context;
    primary_sha256_init(&context);
    unsigned char buffer[65536];
    unsigned long total = 0;
    for (;;) {
        const ssize_t received = read(descriptor, buffer, sizeof(buffer));
        if (received < 0) {
            (void)close(descriptor);
            return 0;
        }
        if (received == 0) {
            break;
        }
        total += (unsigned long)received;
        primary_sha256_update(&context, buffer, (size_t)received);
    }
    if (close(descriptor) != 0) {
        return 0;
    }
    unsigned char digest[32];
    primary_sha256_final(&context, digest);
    primary_hex(digest, output);
    *byte_count = total;
    return 1;
}

static int primary_hash_file(const char *path, char output[65], unsigned long *byte_count) {
    const int descriptor = open(path, O_RDONLY | O_CLOEXEC | O_NOFOLLOW);
    if (descriptor < 0) {
        return 0;
    }
    return primary_hash_descriptor(descriptor, output, byte_count);
}

static int primary_hash_self_executable(char output[65], unsigned long *byte_count) {
    const int descriptor = open("/proc/self/exe", O_RDONLY | O_CLOEXEC);
    if (descriptor < 0) {
        return 0;
    }
    struct stat information;
    if (fstat(descriptor, &information) != 0 || !S_ISREG(information.st_mode)
        || information.st_size <= 0) {
        (void)close(descriptor);
        return 0;
    }
    return primary_hash_descriptor(descriptor, output, byte_count);
}

static int primary_constant_equal(const char *left, const char *right) {
    if (strlen(left) != strlen(right)) {
        return 0;
    }
    unsigned char difference = 0;
    for (size_t index = 0; left[index] != '\0'; ++index) {
        difference |= (unsigned char)left[index] ^ (unsigned char)right[index];
    }
    return difference == 0;
}

static int primary_is_safe_path(const char *path) {
    return path != NULL && path[0] != '\0' && path[0] != '/'
        && strstr(path, "..") == NULL && strchr(path, '\\') == NULL
        && strlen(path) < 512U;
}

static int primary_file_is_absent(const char *path) {
    struct stat information;
    return lstat(path, &information) != 0 && errno == ENOENT;
}

static int primary_verify_inputs(const char *contract, const char *source_directory) {
    char digest[65];
    unsigned long bytes = 0;
    if (!primary_hash_file(contract, digest, &bytes) || bytes != CONTRACT_BYTES
        || !primary_constant_equal(digest, CONTRACT_SHA256)) {
        return 0;
    }
    for (size_t index = 0; index < sizeof(FROZEN_SOURCES) / sizeof(FROZEN_SOURCES[0]);
         ++index) {
        char path[1024];
        if (snprintf(path, sizeof(path), "%s/%s", source_directory,
                     FROZEN_SOURCES[index].name) < 0) {
            return 0;
        }
        if (!primary_hash_file(path, digest, &bytes)
            || bytes != FROZEN_SOURCES[index].bytes
            || !primary_constant_equal(digest, FROZEN_SOURCES[index].sha256)) {
            return 0;
        }
    }
    return 1;
}

typedef struct {
    char decision[24];
    char lane[24];
    char token_sha256[65];
    char contract_sha256[65];
    char executable_sha256[65];
    char output_root[256];
} primary_authorization;

static int primary_copy_field(char *target, size_t target_size, const char *value) {
    const size_t length = strlen(value);
    if (length == 0 || length >= target_size) {
        return 0;
    }
    memcpy(target, value, length + 1U);
    return 1;
}

static int primary_parse_authorization(const char *path, primary_authorization *authorization) {
    int descriptor = open(path, O_RDONLY | O_CLOEXEC | O_NOFOLLOW);
    if (descriptor < 0) {
        return 0;
    }
    char data[4097];
    const ssize_t received = read(descriptor, data, sizeof(data) - 1U);
    const int more = received >= 0 ? (read(descriptor, data + sizeof(data) - 1U, 1U) != 0) : 1;
    (void)close(descriptor);
    if (received <= 0 || more || data[received - 1] != '\n') {
        return 0;
    }
    data[received] = '\0';
    memset(authorization, 0, sizeof(*authorization));
    unsigned seen = 0;
    unsigned lines = 0;
    char *save = NULL;
    for (char *line = strtok_r(data, "\n", &save); line != NULL;
         line = strtok_r(NULL, "\n", &save)) {
        ++lines;
        char *equals = strchr(line, '=');
        if (equals == NULL || strchr(equals + 1, '=') != NULL) {
            return 0;
        }
        *equals = '\0';
        const char *value = equals + 1;
        unsigned bit = 0;
        int accepted = 0;
        if (strcmp(line, "schema") == 0) {
            bit = 1U << 0;
            accepted = strcmp(value, "nhm2.g2h_execution_authorization.v1") == 0;
        } else if (strcmp(line, "decision") == 0) {
            bit = 1U << 1;
            accepted = primary_copy_field(authorization->decision,
                                          sizeof(authorization->decision), value);
        } else if (strcmp(line, "lane") == 0) {
            bit = 1U << 2;
            accepted = primary_copy_field(authorization->lane,
                                          sizeof(authorization->lane), value);
        } else if (strcmp(line, "token_sha256") == 0) {
            bit = 1U << 3;
            accepted = primary_copy_field(authorization->token_sha256,
                                          sizeof(authorization->token_sha256), value);
        } else if (strcmp(line, "contract_sha256") == 0) {
            bit = 1U << 4;
            accepted = primary_copy_field(authorization->contract_sha256,
                                          sizeof(authorization->contract_sha256), value);
        } else if (strcmp(line, "executable_sha256") == 0) {
            bit = 1U << 5;
            accepted = primary_copy_field(authorization->executable_sha256,
                                          sizeof(authorization->executable_sha256), value);
        } else if (strcmp(line, "output_root") == 0) {
            bit = 1U << 6;
            accepted = primary_copy_field(authorization->output_root,
                                          sizeof(authorization->output_root), value);
        } else {
            return 0;
        }
        if (!accepted || (seen & bit) != 0U) {
            return 0;
        }
        seen |= bit;
    }
    return lines == 7U && seen == 0x7fU;
}

static int primary_verify_authorization(const char *path, const char *token,
                                        const char *self_hash) {
    primary_authorization authorization;
    char token_hash[65];
    primary_hash_bytes((const unsigned char *)token, strlen(token), token_hash);
    return strlen(token) == 64U
        && primary_constant_equal(token_hash, TOKEN_SHA256)
        && primary_parse_authorization(path, &authorization)
        && strcmp(authorization.decision, "AUTHORIZED") == 0
        && strcmp(authorization.lane, "primary") == 0
        && primary_constant_equal(authorization.token_sha256, TOKEN_SHA256)
        && primary_constant_equal(authorization.contract_sha256, CONTRACT_SHA256)
        && primary_constant_equal(authorization.executable_sha256, self_hash)
        && strcmp(authorization.output_root, PRIMARY_ROOT) == 0;
}

static int primary_write_exclusive(const char *root, const char *name, const char *bytes,
                                   char output_hash[65]) {
    char path[1024];
    if (snprintf(path, sizeof(path), "%s/%s", root, name) < 0) {
        return 0;
    }
    const int descriptor = open(path, O_WRONLY | O_CREAT | O_EXCL | O_CLOEXEC | O_NOFOLLOW,
                                S_IRUSR | S_IWUSR);
    if (descriptor < 0) {
        return 0;
    }
    const size_t length = strlen(bytes);
    size_t written = 0;
    while (written < length) {
        const ssize_t count = write(descriptor, bytes + written, length - written);
        if (count <= 0) {
            (void)close(descriptor);
            return 0;
        }
        written += (size_t)count;
    }
    const int persisted = fsync(descriptor) == 0 && close(descriptor) == 0;
    if (!persisted) {
        return 0;
    }
    return primary_hash_bytes((const unsigned char *)bytes, length, output_hash);
}

static int primary_write_duty(const char *root, unsigned sequence, const char *duty,
                              const char *algorithm, char previous_hash[65]) {
    char name[64];
    char record[2048];
    char next_hash[65];
    if (snprintf(name, sizeof(name), "%02u-%s.json", sequence, duty) < 0) {
        return 0;
    }
    const int length = snprintf(
        record, sizeof(record),
        "{\"algorithm\":\"%s\",\"authority\":{\"candidate_admitted\":false,"
        "\"classical_proof_established\":false,\"diagnostic_lamp\":false,"
        "\"geometry_state_accepted\":false,\"physical_viability\":false,"
        "\"propulsion_authority\":false,\"transport_authority\":false},"
        "\"candidate_evaluations\":1,\"decision\":\"INELIGIBLE_AFTER_FIRST_FAIL\","
        "\"duty\":\"%s\",\"lane\":\"primary\",\"previous_record_sha256\":\"%s\","
        "\"schema\":\"nhm2.g2h.proof_duty.v1\",\"sequence\":%u,"
        "\"typed_failure\":\"GLOBAL_STATIC_STATE_FAIL\"}\n",
        algorithm, duty, previous_hash, sequence);
    if (length <= 0 || (size_t)length >= sizeof(record)
        || !primary_write_exclusive(root, name, record, next_hash)) {
        return 0;
    }
    memcpy(previous_hash, next_hash, sizeof(next_hash));
    return 1;
}

static int primary_ensure_evidence_parent(void) {
    const char *parent = "artifacts/research/nhm2/g2h";
    if (mkdir(parent, S_IRWXU) == 0) {
        return 1;
    }
    if (errno != EEXIST) {
        return 0;
    }
    struct stat information;
    return lstat(parent, &information) == 0 && S_ISDIR(information.st_mode)
        && !S_ISLNK(information.st_mode);
}

static int primary_execute(const char *contract, const char *source_directory,
                           const char *output_root, const char *authorization_path,
                           const char *token) {
    if (!primary_is_safe_path(contract) || !primary_is_safe_path(source_directory)
        || !primary_is_safe_path(authorization_path)
        || strcmp(output_root, PRIMARY_ROOT) != 0
        || !primary_file_is_absent(PRIMARY_ROOT)
        || !primary_file_is_absent(EXHAUSTED_PRIMARY_ROOT)
        || !primary_file_is_absent(INDEPENDENT_ROOT)) {
        fprintf(stderr, "exclusive-root or path preflight rejected\n");
        return 65;
    }
    char self_hash[65];
    unsigned long self_bytes = 0;
    if (!primary_hash_self_executable(self_hash, &self_bytes)
        || self_bytes == 0
        || !primary_verify_inputs(contract, source_directory)
        || !primary_verify_authorization(authorization_path, token, self_hash)) {
        fprintf(stderr, "digest, source, runtime or authorization preflight rejected\n");
        return 66;
    }
    if (!primary_ensure_evidence_parent() || mkdir(PRIMARY_ROOT, S_IRWXU) != 0) {
        fprintf(stderr, "exclusive primary root creation failed\n");
        return 67;
    }

    char previous_hash[65];
    char record[4096];
    const int preflight_length = snprintf(
        record, sizeof(record),
        "{\"candidate_evaluations\":0,\"contract_sha256\":\"%s\","
        "\"decision\":\"PASS\",\"executable_sha256\":\"%s\","
        "\"lane\":\"primary\",\"previous_record_sha256\":\"%s\","
        "\"schema\":\"nhm2.g2h.proof_preflight.v1\",\"sequence\":0,"
        "\"sources_verified\":7}\n",
        CONTRACT_SHA256, self_hash, ZERO_HASH);
    if (preflight_length <= 0 || (size_t)preflight_length >= sizeof(record)
        || !primary_write_exclusive(PRIMARY_ROOT, "00-preflight.json", record,
                                    previous_hash)) {
        return 68;
    }

    primary_surface_gate_report surface;
    if (!primary_surface_regularity_gate(&surface)) {
        return 69;
    }
    const int surface_length = snprintf(
        record, sizeof(record),
        "{\"candidate_evaluations\":1,\"coefficient\":\"%s\","
        "\"decision\":\"%s\",\"exterior_exact\":\"%s\","
        "\"first_disjoint_order\":%lu,\"interior_exact\":\"%s\","
        "\"lane\":\"primary\",\"previous_record_sha256\":\"%s\","
        "\"schema\":\"nhm2.g2h.surface_regularity.v1\",\"sequence\":1,"
        "\"typed_result\":\"%s\"}\n",
        surface.coefficient, surface.pass ? "PASS" : "FAIL", surface.exterior_exact,
        surface.first_disjoint_order, surface.interior_exact, previous_hash,
        surface.typed_result);
    if (surface_length <= 0 || (size_t)surface_length >= sizeof(record)
        || !primary_write_exclusive(PRIMARY_ROOT, "01-surface-regularity.json", record,
                                    previous_hash)) {
        return 70;
    }

    if (!surface.pass) {
        for (size_t index = 0; index < sizeof(DUTY_IDS) / sizeof(DUTY_IDS[0]); ++index) {
            if (!primary_write_duty(PRIMARY_ROOT, (unsigned)index + 2U, DUTY_IDS[index],
                                    DUTY_ALGORITHMS[index], previous_hash)) {
                return 71;
            }
        }
        const int manifest_length = snprintf(
            record, sizeof(record),
            "{\"candidate_admitted\":false,\"candidate_evaluations\":1,"
            "\"candidate_execution_authorized\":true,\"classical_proof_established\":false,"
            "\"decision\":\"FAIL\",\"diagnostic_lamp\":false,"
            "\"first_failure\":\"GLOBAL_STATIC_STATE_FAIL\","
            "\"geometry_state_accepted\":false,\"lane\":\"primary\","
            "\"physical_viability\":false,\"propulsion_authority\":false,"
            "\"schema\":\"nhm2.g2h.proof_manifest.v1\","
            "\"transport_authority\":false}\n");
        char manifest_hash[65];
        if (manifest_length <= 0 || (size_t)manifest_length >= sizeof(record)
            || !primary_write_exclusive(PRIMARY_ROOT, "proof-manifest.json", record,
                                        manifest_hash)) {
            return 72;
        }
        printf("%s\n", manifest_hash);
        flint_cleanup();
        return 1;
    }

    fprintf(stderr, "surface gate unexpectedly passed; duty engine remains fail-closed\n");
    flint_cleanup();
    return 73;
}

int main(int argc, char **argv) {
    if (argc != 12 || strcmp(argv[1], "--candidate") != 0
        || strcmp(argv[2], "--contract") != 0
        || strcmp(argv[4], "--sources") != 0
        || strcmp(argv[6], "--output-root") != 0
        || strcmp(argv[8], "--authorization") != 0
        || strcmp(argv[10], "--token") != 0) {
        fprintf(stderr,
                "candidate execution unavailable without exact guarded G2H-E command\n");
        return 64;
    }
    return primary_execute(argv[3], argv[5], argv[7], argv[9], argv[11]);
}

