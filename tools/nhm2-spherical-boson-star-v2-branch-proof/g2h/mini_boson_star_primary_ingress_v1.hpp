#pragma once

#include <cstddef>
#include <cstdint>
#include <string_view>

namespace nhm2::g2h_e_s5::primary_ingress_v1 {

struct ManifestRecord {
    std::string_view path;
    std::string_view sha256;
    std::uint64_t bytes;
    std::string_view role;
};

struct ManifestView {
    const ManifestRecord *records;
    std::size_t count;
};

// Candidate-neutral structural validation only. This does not open any input,
// admit a selected candidate, or authorize scientific dispatch.
bool validate_manifest(ManifestView manifest, std::uint64_t maximum_total_bytes);

// Verifies every record beneath an already trusted directory descriptor using
// component-wise O_NOFOLLOW traversal, stable regular-file descriptors, exact
// byte counts, and SHA-256. The caller retains ownership of root_fd.
bool verify_manifest_files_at(int root_fd, ManifestView manifest,
    std::uint64_t maximum_total_bytes);

std::size_t fixture_count();
std::size_t fixtures_passed();
bool run_ingress_fixture_suite();

} // namespace nhm2::g2h_e_s5::primary_ingress_v1
