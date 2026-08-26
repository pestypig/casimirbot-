#include "mini_boson_star_primary_ingress_v1.hpp"
#include "mini_boson_star_sha256_v1.hpp"

#include <array>
#include <cerrno>
#include <fcntl.h>
#include <limits>
#include <set>
#include <string>
#include <sys/stat.h>
#include <unistd.h>

namespace nhm2::g2h_e_s5::primary_ingress_v1 {
namespace {

constexpr std::size_t kMaximumRecords = 256U;
constexpr std::size_t kMaximumPathBytes = 240U;
constexpr std::size_t kMaximumRoleBytes = 80U;

bool lowercase_hash(std::string_view value) {
    if (value.size() != 64U) return false;
    for (const char c : value) {
        if (!((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f'))) return false;
    }
    return true;
}

bool token(std::string_view value, std::size_t maximum) {
    if (value.empty() || value.size() > maximum) return false;
    for (const char c : value) {
        if (!((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '_' || c == '-')) return false;
    }
    return true;
}

bool relative_path(std::string_view value) {
    if (value.empty() || value.size() > kMaximumPathBytes || value.front() == '/'
        || value.back() == '/' || value.find('\\') != std::string_view::npos
        || value.find(':') != std::string_view::npos) return false;
    std::size_t offset = 0U;
    while (offset < value.size()) {
        const std::size_t slash = value.find('/', offset);
        const std::size_t end = slash == std::string_view::npos ? value.size() : slash;
        const std::string_view component = value.substr(offset, end - offset);
        if (component.empty() || component == "." || component == "..") return false;
        for (const char c : component) {
            if (!((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
                || (c >= '0' && c <= '9') || c == '_' || c == '-' || c == '.')) return false;
        }
        if (slash == std::string_view::npos) break;
        offset = slash + 1U;
    }
    return true;
}

int open_beneath(int root_fd, std::string_view path) {
    int current = dup(root_fd);
    if (current < 0) return -1;
    std::size_t offset = 0U;
    while (offset < path.size()) {
        const std::size_t slash = path.find('/', offset);
        const bool final = slash == std::string_view::npos;
        const std::size_t end = final ? path.size() : slash;
        const std::string component(path.substr(offset, end - offset));
        const int flags = O_RDONLY | O_CLOEXEC | O_NOFOLLOW | (final ? 0 : O_DIRECTORY);
        const int next = openat(current, component.c_str(), flags);
        const int saved = errno;
        close(current);
        errno = saved;
        if (next < 0) return -1;
        current = next;
        if (final) return current;
        offset = end + 1U;
    }
    close(current);
    errno = EINVAL;
    return -1;
}

bool descriptor_identity(int fd, std::uint64_t expected_bytes, std::string_view expected_hash) {
    struct stat before{};
    if (fstat(fd, &before) != 0 || !S_ISREG(before.st_mode) || before.st_size < 0
        || static_cast<std::uint64_t>(before.st_size) != expected_bytes) return false;
    nhm2::g2h_e_s5::sha256_v1::Context context;
    nhm2::g2h_e_s5::sha256_v1::init(context);
    unsigned char buffer[65536];
    std::uint64_t total = 0U;
    for (;;) {
        const ssize_t count = read(fd, buffer, sizeof(buffer));
        if (count < 0) return false;
        if (count == 0) break;
        total += static_cast<std::uint64_t>(count);
        if (total > expected_bytes) return false;
        nhm2::g2h_e_s5::sha256_v1::update(context, buffer, static_cast<std::size_t>(count));
    }
    struct stat after{};
    const bool stable = fstat(fd, &after) == 0 && before.st_dev == after.st_dev
        && before.st_ino == after.st_ino && before.st_size == after.st_size
        && before.st_mtim.tv_sec == after.st_mtim.tv_sec
        && before.st_mtim.tv_nsec == after.st_mtim.tv_nsec;
    return stable && total == expected_bytes
        && nhm2::g2h_e_s5::sha256_v1::finish(context) == expected_hash;
}

bool file_verification_fixture() {
    constexpr ManifestRecord record = {
        "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_sha256_v1.hpp",
        "99278b36da34a37e7e6a199f247f1e3d8ca91f10bff309cb19c1355dd3d199d2",
        4591U,
        "neutral_sha_source",
    };
    const int root = open(".", O_RDONLY | O_CLOEXEC | O_DIRECTORY | O_NOFOLLOW);
    if (root < 0) return false;
    const bool pass = verify_manifest_files_at(root, {&record, 1U}, 4591U);
    return close(root) == 0 && pass;
}

bool file_corruption_fixture() {
    constexpr ManifestRecord corrupt_hash = {
        "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_sha256_v1.hpp",
        "09278b36da34a37e7e6a199f247f1e3d8ca91f10bff309cb19c1355dd3d199d2",
        4591U,
        "neutral_sha_source",
    };
    constexpr ManifestRecord wrong_size = {
        "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_sha256_v1.hpp",
        "99278b36da34a37e7e6a199f247f1e3d8ca91f10bff309cb19c1355dd3d199d2",
        4590U,
        "neutral_sha_source",
    };
    constexpr ManifestRecord missing = {
        "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/missing-neutral-fixture.bin",
        "99278b36da34a37e7e6a199f247f1e3d8ca91f10bff309cb19c1355dd3d199d2",
        1U,
        "missing_source",
    };
    const int root = open(".", O_RDONLY | O_CLOEXEC | O_DIRECTORY | O_NOFOLLOW);
    if (root < 0) return false;
    const bool pass = !verify_manifest_files_at(root, {&corrupt_hash, 1U}, 4591U)
        && !verify_manifest_files_at(root, {&wrong_size, 1U}, 4591U)
        && !verify_manifest_files_at(root, {&missing, 1U}, 1U);
    return close(root) == 0 && pass;
}

std::array<bool, 7> fixture_results() {
    constexpr ManifestRecord good[] = {
        {"definitions/frozen-contract.json", "1111111111111111111111111111111111111111111111111111111111111111", 113U, "frozen_contract"},
        {"definitions/state-grid.json", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 257U, "state_grid"},
    };
    constexpr ManifestRecord duplicate[] = {
        good[0], {"definitions/frozen-contract.json", "2222222222222222222222222222222222222222222222222222222222222222", 1U, "other"},
    };
    constexpr ManifestRecord traversal[] = {
        {"definitions/../selected.json", "3333333333333333333333333333333333333333333333333333333333333333", 1U, "bad_path"},
    };
    constexpr ManifestRecord uppercase_hash[] = {
        {"definitions/x.json", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", 1U, "bad_hash"},
    };
    constexpr ManifestRecord overflow[] = {
        {"definitions/a.json", "4444444444444444444444444444444444444444444444444444444444444444", std::numeric_limits<std::uint64_t>::max(), "a"},
        {"definitions/b.json", "5555555555555555555555555555555555555555555555555555555555555555", 1U, "b"},
    };
    return {
        validate_manifest({good, 2U}, 370U),
        !validate_manifest({duplicate, 2U}, 1024U),
        !validate_manifest({traversal, 1U}, 1024U),
        !validate_manifest({uppercase_hash, 1U}, 1024U),
        !validate_manifest({overflow, 2U}, std::numeric_limits<std::uint64_t>::max()),
        file_verification_fixture(),
        file_corruption_fixture(),
    };
}

} // namespace

bool validate_manifest(ManifestView manifest, std::uint64_t maximum_total_bytes) {
    if (manifest.records == nullptr || manifest.count == 0U || manifest.count > kMaximumRecords
        || maximum_total_bytes == 0U) return false;
    std::set<std::string> paths;
    std::set<std::string> roles;
    std::uint64_t total = 0U;
    for (std::size_t index = 0; index < manifest.count; ++index) {
        const ManifestRecord &record = manifest.records[index];
        if (!relative_path(record.path) || !lowercase_hash(record.sha256)
            || !token(record.role, kMaximumRoleBytes) || record.bytes == 0U
            || !paths.insert(std::string(record.path)).second
            || !roles.insert(std::string(record.role)).second
            || record.bytes > maximum_total_bytes - total) return false;
        total += record.bytes;
    }
    return total <= maximum_total_bytes;
}

bool verify_manifest_files_at(int root_fd, ManifestView manifest,
    std::uint64_t maximum_total_bytes) {
    if (root_fd < 0 || !validate_manifest(manifest, maximum_total_bytes)) return false;
    struct stat root_info{};
    if (fstat(root_fd, &root_info) != 0 || !S_ISDIR(root_info.st_mode)) return false;
    for (std::size_t index = 0; index < manifest.count; ++index) {
        const ManifestRecord &record = manifest.records[index];
        const int fd = open_beneath(root_fd, record.path);
        if (fd < 0) return false;
        const bool pass = descriptor_identity(fd, record.bytes, record.sha256);
        const int close_result = close(fd);
        if (!pass || close_result != 0) return false;
    }
    return true;
}

std::size_t fixture_count() { return 7U; }

std::size_t fixtures_passed() {
    const auto checks = fixture_results();
    std::size_t passed = 0U;
    for (const bool value : checks) passed += value ? 1U : 0U;
    return passed;
}

bool run_ingress_fixture_suite() { return fixtures_passed() == fixture_count(); }

} // namespace nhm2::g2h_e_s5::primary_ingress_v1
