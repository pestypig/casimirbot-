#define _POSIX_C_SOURCE 200809L

#include <cerrno>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <fcntl.h>
#include <set>
#include <string>
#include <sys/stat.h>
#include <unistd.h>
#include <vector>

#include "mini_boson_star_sha256_v1.hpp"
#include "mini_boson_star_primary_ingress_v1.hpp"
#include "mini_boson_star_primary_dispatch_v1.hpp"
#include "mini_boson_star_primary_ekg_v1.hpp"
#include "mini_boson_star_primary_grid_v1.hpp"
#include "mini_boson_star_primary_origin_v1.hpp"
#include "mini_boson_star_primary_positive_tail_v1.hpp"
#include "mini_boson_star_primary_flat_carrier_v1.hpp"
#include "mini_boson_star_primary_carrier_parameters_v1.hpp"
#include "mini_boson_star_primary_record_v1.hpp"

extern char **environ;

namespace {
using nhm2::g2h_e_s5::sha256_v1::Context;
using nhm2::g2h_e_s5::sha256_v1::finish;
using nhm2::g2h_e_s5::sha256_v1::init;
using nhm2::g2h_e_s5::sha256_v1::text;
using nhm2::g2h_e_s5::sha256_v1::update;

constexpr char kAbiPath[] = "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-checkpoint-abi.v1.json";
constexpr char kAbiHash[] = "6fbf6cdbb80e6da390c84f6d87f13f37f2b81b2226bf937cbcfd2c8aff3911ca";
constexpr char kContractPath[] = "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s3-r2-mini-boson-star-contract.v1.json";
constexpr char kContractHash[] = "041c406c4113c6915bf02db36c1fadd2ad685278ce9d2ce445da5176a90ed12a";
constexpr char kSealPath[] = "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-definition-seal.v1.json";
constexpr char kSealHash[] = "728d8c9a807d27356a6d9f33e897feb73331abb12e6a76435dbce099d9c025ca";
constexpr char kBuilderPath[] = "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r2-total-quantum-builder-algorithms.v2.json";
constexpr char kBuilderHash[] = "2989373624362e7f591ca0f00b76d1b01e2aa861f01eaf53f9b62c666f2862fc";
constexpr char kBindingPath[] = "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-primary-build-binding.v1.json";
constexpr char kProposalPath[] = "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-primary-execution-proposal.v1.json";
constexpr char kAuthorizationPath[] = "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt";
constexpr char kPrimaryRoot[] = "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary";
constexpr char kIndependentRoot[] = "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent";
constexpr const char *kLedgers[] = {
    "artifacts/nhm2/g2h-e-s5/executions/primary-v1-invocation.json",
    "artifacts/nhm2/g2h-e-s5/executions/primary-v1.stdout.log",
    "artifacts/nhm2/g2h-e-s5/executions/primary-v1.stderr.log",
    "artifacts/nhm2/g2h-e-s5/executions/primary-v1-result.json",
};

bool absent(const char *path) {
    struct stat info{};
    return lstat(path, &info) != 0 && errno == ENOENT;
}

bool file_hash(const char *path, std::string &hash) {
    struct stat before{};
    if (lstat(path, &before) != 0 || !S_ISREG(before.st_mode) || S_ISLNK(before.st_mode)) return false;
    const int fd = open(path, O_RDONLY | O_CLOEXEC | O_NOFOLLOW);
    if (fd < 0) return false;
    Context context; init(context);
    unsigned char buffer[65536];
    for (;;) {
        const ssize_t count = read(fd, buffer, sizeof(buffer));
        if (count < 0) { close(fd); return false; }
        if (count == 0) break;
        update(context, buffer, static_cast<std::size_t>(count));
    }
    struct stat after{};
    const bool stable = fstat(fd, &after) == 0 && before.st_dev == after.st_dev
        && before.st_ino == after.st_ino && before.st_size == after.st_size
        && before.st_mtim.tv_sec == after.st_mtim.tv_sec && before.st_mtim.tv_nsec == after.st_mtim.tv_nsec;
    if (close(fd) != 0 || !stable) return false;
    hash = finish(context); return true;
}

bool read_regular_bounded(const char *path, std::size_t maximum, std::string &value) {
    struct stat info{};
    if (lstat(path, &info) != 0 || !S_ISREG(info.st_mode) || S_ISLNK(info.st_mode)
        || info.st_size < 0 || static_cast<std::size_t>(info.st_size) > maximum) return false;
    const int fd = open(path, O_RDONLY | O_CLOEXEC | O_NOFOLLOW);
    if (fd < 0) return false;
    value.assign(static_cast<std::size_t>(info.st_size), '\0');
    std::size_t offset = 0;
    while (offset < value.size()) {
        const ssize_t count = read(fd, value.data()+offset, value.size()-offset);
        if (count <= 0) { close(fd); return false; }
        offset += static_cast<std::size_t>(count);
    }
    struct stat after{};
    const bool stable = fstat(fd, &after) == 0 && info.st_dev == after.st_dev
        && info.st_ino == after.st_ino && info.st_size == after.st_size
        && info.st_mtim.tv_sec == after.st_mtim.tv_sec && info.st_mtim.tv_nsec == after.st_mtim.tv_nsec;
    return close(fd) == 0 && stable;
}

bool self_hash(std::string &hash) {
    const int fd = open("/proc/self/exe", O_RDONLY | O_CLOEXEC);
    if (fd < 0) return false;
    struct stat info{};
    if (fstat(fd, &info) != 0 || !S_ISREG(info.st_mode)) { close(fd); return false; }
    Context context; init(context); unsigned char buffer[65536];
    for (;;) {
        const ssize_t count = read(fd, buffer, sizeof(buffer));
        if (count < 0) { close(fd); return false; }
        if (count == 0) break;
        update(context, buffer, static_cast<std::size_t>(count));
    }
    if (close(fd) != 0) return false;
    hash = finish(context); return true;
}

bool exact_hash(const char *path, const char *expected) {
    std::string actual; return file_hash(path, actual) && actual == expected;
}

bool roots_and_ledgers_absent() {
    if (!absent(kPrimaryRoot) || !absent(kIndependentRoot) || !absent(kAuthorizationPath)) return false;
    for (const char *path : kLedgers) if (!absent(path)) return false;
    return true;
}

bool hostname_value(const std::string &value) {
    if (value.size() != 12U) return false;
    for (char c : value) if (!((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f'))) return false;
    return true;
}

bool environment_ok(bool execution, std::string *execution_token = nullptr) {
    const std::set<std::string> fixed = {
        "PATH=/usr/local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        "HOME=/root", "LC_ALL=C", "LANG=C", "TZ=UTC", "OMP_NUM_THREADS=1",
        "OPENBLAS_NUM_THREADS=1", "MKL_NUM_THREADS=1",
        "GPG_KEY=7169605F62C751356D054A26A821E680E5FA6305",
        "PYTHON_VERSION=3.12.11",
        "PYTHON_SHA256=c30bb24b7f1e9a19b11b55a546434f74e739bb4c271a3e3a80ff4380d49f7adb",
    };
    std::set<std::string> seen;
    bool hostname = false, token = false;
    for (char **entry = environ; *entry != nullptr; ++entry) {
        const std::string value(*entry);
        if (value.rfind("HOSTNAME=", 0) == 0) hostname = hostname_value(value.substr(9));
        else if (value.rfind("NHM2_EXECUTION_TOKEN=", 0) == 0) {
            const std::string candidate = value.substr(21);
            token = candidate.size() == 64U;
            for (char c : candidate) token = token && ((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f'));
            if (token && execution_token != nullptr) *execution_token = candidate;
        }
        else if (fixed.count(value) != 0U) seen.insert(value);
        else return false;
    }
    return hostname && seen == fixed && token == execution;
}

bool auth_shape(const std::string &value) {
    if (value.size() > 4096U || value.empty() || value.back() != '\n') return false;
    const char *keys[] = {"schema=", "decision=", "lane=", "proposal_sha256=", "token_sha256=",
        "checkpoint_abi_sha256=", "build_binding_sha256=", "image_id=", "executable_sha256=", "output_root="};
    std::size_t offset = 0;
    for (const char *key : keys) {
        const auto end = value.find('\n', offset);
        if (end == std::string::npos || value.compare(offset, std::strlen(key), key) != 0) return false;
        offset = end + 1U;
    }
    return offset == value.size();
}

bool authorization_ok(const std::string &value, const std::string &proposal_hash,
    const std::string &binding_hash, const std::string &executable_hash,
    const std::string &token) {
    if (!auth_shape(value)) return false;
    const std::vector<std::string> expected = {
        "schema=nhm2.g2h_e_s5.primary_execution_authorization.v1",
        "decision=AUTHORIZED",
        "lane=primary",
        "proposal_sha256=" + proposal_hash,
        "token_sha256=" + text(token),
        "checkpoint_abi_sha256=" + std::string(kAbiHash),
        "build_binding_sha256=" + binding_hash,
        "<host-checkpoint-verifies-image-id>",
        "executable_sha256=" + executable_hash,
        "output_root=" + std::string(kPrimaryRoot),
    };
    std::size_t offset = 0;
    for (std::size_t index = 0; index < expected.size(); ++index) {
        const auto end = value.find('\n', offset);
        if (end == std::string::npos) return false;
        const std::string actual = value.substr(offset, end-offset);
        if (index == 7U) {
            if (actual.rfind("image_id=sha256:", 0) != 0 || actual.size() != 80U) return false;
            for (std::size_t i = 16U; i < actual.size(); ++i) {
                const char c = actual[i];
                if (!((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f'))) return false;
            }
        } else if (actual != expected[index]) return false;
        offset = end + 1U;
    }
    return offset == value.size();
}

bool self_tests() {
    const std::string good =
        "schema=x\ndecision=AUTHORIZED\nlane=primary\nproposal_sha256=p\ntoken_sha256=t\n"
        "checkpoint_abi_sha256=a\nbuild_binding_sha256=b\nimage_id=i\nexecutable_sha256=e\noutput_root=o\n";
    const std::string duplicate = good + "output_root=o\n";
    const std::string token(64U, '1');
    const std::string proposal(64U, '2');
    const std::string binding(64U, '3');
    const std::string executable_expected(64U, '4');
    const std::string authorization =
        "schema=nhm2.g2h_e_s5.primary_execution_authorization.v1\n"
        "decision=AUTHORIZED\nlane=primary\nproposal_sha256=" + proposal
        + "\ntoken_sha256=" + text(token)
        + "\ncheckpoint_abi_sha256=" + std::string(kAbiHash)
        + "\nbuild_binding_sha256=" + binding
        + "\nimage_id=sha256:" + std::string(64U, '5')
        + "\nexecutable_sha256=" + executable_expected
        + "\noutput_root=" + std::string(kPrimaryRoot) + "\n";
    std::string executable;
    return text("") == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        && self_hash(executable) && executable.size() == 64U
        && auth_shape(good) && !auth_shape(duplicate)
        && authorization_ok(authorization, proposal, binding, executable_expected, token)
        && !authorization_ok(authorization + "x", proposal, binding, executable_expected, token)
        && exact_hash(kAbiPath, kAbiHash) && roots_and_ledgers_absent()
        && environment_ok(false);
}

bool execution_argv(int argc, char **argv) {
    return argc == 16 && std::strcmp(argv[1], "--execute-once") == 0
        && std::strcmp(argv[2], "--contract") == 0 && std::strcmp(argv[3], kContractPath) == 0
        && std::strcmp(argv[4], "--definition-seal") == 0 && std::strcmp(argv[5], kSealPath) == 0
        && std::strcmp(argv[6], "--quantum-builder") == 0 && std::strcmp(argv[7], kBuilderPath) == 0
        && std::strcmp(argv[8], "--binding") == 0 && std::strcmp(argv[9], kBindingPath) == 0
        && std::strcmp(argv[10], "--proposal") == 0 && std::strcmp(argv[11], kProposalPath) == 0
        && std::strcmp(argv[12], "--authorization") == 0 && std::strcmp(argv[13], kAuthorizationPath) == 0
        && std::strcmp(argv[14], "--output-root") == 0 && std::strcmp(argv[15], kPrimaryRoot) == 0;
}
} // namespace

int main(int argc, char **argv) {
    if (argc == 3 && std::strcmp(argv[1], "--preflight-self-test") == 0 && std::strcmp(argv[2], kAbiPath) == 0) {
        const bool guard_pass = self_tests();
        const bool record_pass = nhm2::g2h_e_s5::primary_record_v1::run_record_fixture_suite();
        const bool ingress_pass = nhm2::g2h_e_s5::primary_ingress_v1::run_ingress_fixture_suite();
        const bool dispatch_pass = nhm2::g2h_e_s5::primary_dispatch_v1::run_dispatch_fixture_suite();
        const bool ekg_pass = nhm2::g2h_e_s5::primary_ekg_v1::run_ekg_fixture_suite();
        const bool grid_pass = nhm2::g2h_e_s5::primary_grid_v1::run_grid_fixture_suite();
        const bool origin_pass = nhm2::g2h_e_s5::primary_origin_v1::run_origin_fixture_suite();
        const bool tail_pass = nhm2::g2h_e_s5::primary_positive_tail_v1::run_positive_tail_fixture_suite();
        const bool flat_pass = nhm2::g2h_e_s5::primary_flat_carrier_v1::run_flat_carrier_fixture_suite();
        const bool parameter_pass = nhm2::g2h_e_s5::primary_carrier_parameters_v1::run_carrier_parameter_fixture_suite();
        const int passed = (guard_pass ? 1 : 0) + (record_pass ? 1 : 0)
            + (ingress_pass ? 1 : 0) + (dispatch_pass ? 1 : 0)
            + (ekg_pass ? 1 : 0) + (grid_pass ? 1 : 0) + (origin_pass ? 1 : 0);
        const int total_passed = passed + (tail_pass ? 1 : 0) + (flat_pass ? 1 : 0)
            + (parameter_pass ? 1 : 0);
        const bool pass = total_passed == 10;
        std::printf("{\"authorization_created\":false,\"authority_promoted\":false,\"candidate_evaluations\":0,\"candidate_roots_created\":false,\"carrier_parameter_check_mask\":%u,\"carrier_parameter_checks_passed\":%zu,\"carrier_parameter_checks_total\":%zu,\"carrier_parameter_full_state_chain_rules_linked\":true,\"checks_passed\":%d,\"checks_total\":10,\"dispatch_checks_passed\":%zu,\"dispatch_checks_total\":%zu,\"dispatch_controller_linked\":true,\"ekg_checks_passed\":%zu,\"ekg_checks_total\":%zu,\"flat_carrier_bell12_norms_linked\":true,\"flat_carrier_check_mask\":%u,\"flat_carrier_checks_passed\":%zu,\"flat_carrier_checks_total\":%zu,\"flat_carrier_compact_box_envelopes_linked\":true,\"flat_carrier_mixed_derivative_inventory\":%zu,\"flat_carrier_parameter_norm_inventory\":6,\"grid_checks_passed\":%zu,\"grid_checks_total\":%zu,\"ingress_checks_passed\":%zu,\"ingress_checks_total\":%zu,\"origin_checks_passed\":%zu,\"origin_checks_total\":%zu,\"positive_parameter_samples\":0,\"positive_tail_check_mask\":%u,\"positive_tail_checks_passed\":%zu,\"positive_tail_checks_total\":%zu,\"positive_tail_zero_field_failure_stage\":%u,\"positive_tail_zero_field_mask\":%u,\"record_checks_passed\":%zu,\"record_checks_total\":%zu,\"record_writer_linked\":true,\"schema\":\"nhm2.g2h_e_s5.primary_preflight_guard_report.v1\",\"scientific_handlers_linked\":false,\"status\":\"%s\"}\n", nhm2::g2h_e_s5::primary_carrier_parameters_v1::fixture_mask(), nhm2::g2h_e_s5::primary_carrier_parameters_v1::fixtures_passed(), nhm2::g2h_e_s5::primary_carrier_parameters_v1::fixture_count(), total_passed, nhm2::g2h_e_s5::primary_dispatch_v1::fixtures_passed(), nhm2::g2h_e_s5::primary_dispatch_v1::fixture_count(), nhm2::g2h_e_s5::primary_ekg_v1::fixtures_passed(), nhm2::g2h_e_s5::primary_ekg_v1::fixture_count(), nhm2::g2h_e_s5::primary_flat_carrier_v1::fixture_mask(), nhm2::g2h_e_s5::primary_flat_carrier_v1::fixtures_passed(), nhm2::g2h_e_s5::primary_flat_carrier_v1::fixture_count(), nhm2::g2h_e_s5::primary_flat_carrier_v1::mixed_derivative_inventory, nhm2::g2h_e_s5::primary_grid_v1::fixtures_passed(), nhm2::g2h_e_s5::primary_grid_v1::fixture_count(), nhm2::g2h_e_s5::primary_ingress_v1::fixtures_passed(), nhm2::g2h_e_s5::primary_ingress_v1::fixture_count(), nhm2::g2h_e_s5::primary_origin_v1::fixtures_passed(), nhm2::g2h_e_s5::primary_origin_v1::fixture_count(), nhm2::g2h_e_s5::primary_positive_tail_v1::fixture_mask(), nhm2::g2h_e_s5::primary_positive_tail_v1::fixtures_passed(), nhm2::g2h_e_s5::primary_positive_tail_v1::fixture_count(), nhm2::g2h_e_s5::primary_positive_tail_v1::zero_field_failure_stage(), nhm2::g2h_e_s5::primary_positive_tail_v1::zero_field_check_mask(), nhm2::g2h_e_s5::primary_record_v1::fixtures_passed(), nhm2::g2h_e_s5::primary_record_v1::fixture_count(), pass ? "PASS" : "FAIL");
        return pass ? 0 : 65;
    }
    if (!execution_argv(argc, argv)) { std::fprintf(stderr, "interface_or_argument_rejected\n"); return 64; }
    if (!exact_hash(kAbiPath, kAbiHash) || !exact_hash(kContractPath, kContractHash)
        || !exact_hash(kSealPath, kSealHash) || !exact_hash(kBuilderPath, kBuilderHash)) {
        std::fprintf(stderr, "identity_or_regular_file_rejected\n"); return 65;
    }
    std::string binding_hash, proposal_hash, executable_hash, authorization, token;
    if (!file_hash(kBindingPath, binding_hash) || !file_hash(kProposalPath, proposal_hash)
        || !self_hash(executable_hash)) {
        std::fprintf(stderr, "identity_or_regular_file_rejected\n"); return 65;
    }
    if (!environment_ok(true, &token) || !read_regular_bounded(kAuthorizationPath, 4096U, authorization)
        || !authorization_ok(authorization, proposal_hash, binding_hash, executable_hash, token)) {
        std::fprintf(stderr, "environment_or_authorization_rejected\n"); return 66;
    }
    if (!roots_and_ledgers_absent()) { std::fprintf(stderr, "root_or_ledger_chronology_rejected\n"); return 67; }
    std::fprintf(stderr, "scientific_dispatch_not_linked_preflight_only\n");
    return 69;
}
