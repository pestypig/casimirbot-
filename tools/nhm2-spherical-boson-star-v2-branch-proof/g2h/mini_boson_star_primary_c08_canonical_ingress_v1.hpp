#pragma once

#include <cstddef>
#include <string>
#include <string_view>

namespace nhm2::g2h_e_s5::primary_c08_canonical_ingress_v1 {

enum class FailureCode {
    none,
    raw_input_resource,
    bom_or_invalid_utf8,
    json_lexical_or_trailing,
    structural_resource,
    duplicate_key,
    contract_key,
    number_semantics,
    raw_identity,
    canonical_output_resource,
    canonical_identity,
};

struct Metrics {
    std::size_t raw_input_bytes = 0;
    std::size_t canonical_output_bytes = 0;
    std::size_t maximum_depth = 0;
    std::size_t total_value_nodes = 0;
    std::size_t maximum_members_in_one_object = 0;
    std::size_t maximum_elements_in_one_array = 0;
    std::size_t maximum_decoded_string_utf8_bytes = 0;
    std::size_t maximum_decoded_object_key_utf8_bytes = 0;
    std::size_t cumulative_decoded_string_utf8_bytes = 0;
    std::size_t maximum_number_lexeme_bytes = 0;
};

struct Result {
    bool accepted = false;
    FailureCode failure = FailureCode::none;
    Metrics metrics{};
    std::string raw_sha256{};
    std::string canonical_sha256{};
    std::size_t canonical_bytes = 0;
    std::size_t candidate_evaluations = 0;
    std::size_t positive_parameter_samples = 0;
    bool candidate_root_created = false;
    bool authority_promoted = false;
};

// Candidate-neutral primitive. It parses only the supplied synthetic/definition
// bytes and never performs file I/O, state-coefficient access or scientific work.
bool canonicalize_fixture(
    std::string_view raw,
    std::string *canonical,
    FailureCode *failure,
    Metrics *metrics);

// C08-002 exact ingress for the acknowledged Borel contract only.
bool validate_exact_borel_contract(std::string_view raw, Result *result);

// Direct boundary primitive for the cumulative decoded-string counter, whose
// raw-input ceiling makes its exact upper boundary unreachable via one JSON file.
bool fixture_cumulative_string_counter(std::size_t current, std::size_t addition);

const char *failure_name(FailureCode failure);

}  // namespace nhm2::g2h_e_s5::primary_c08_canonical_ingress_v1
