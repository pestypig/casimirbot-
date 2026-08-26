#include "mini_boson_star_primary_c08_canonical_ingress_v1.hpp"

#include <cstdint>
#include <fstream>
#include <iostream>
#include <iterator>
#include <limits>
#include <string>
#include <string_view>
#include <vector>

namespace c08 = nhm2::g2h_e_s5::primary_c08_canonical_ingress_v1;

namespace {

std::string read_binary(const char *path) {
    std::ifstream stream(path, std::ios::binary);
    return std::string(std::istreambuf_iterator<char>(stream), std::istreambuf_iterator<char>());
}

bool generic_ok(std::string_view raw, std::string_view expected) {
    std::string canonical;
    c08::FailureCode failure = c08::FailureCode::none;
    c08::Metrics metrics{};
    return c08::canonicalize_fixture(raw, &canonical, &failure, &metrics)
        && failure == c08::FailureCode::none && canonical == expected;
}

bool generic_accepts(std::string_view raw) {
    std::string canonical;
    c08::FailureCode failure = c08::FailureCode::none;
    c08::Metrics metrics{};
    return c08::canonicalize_fixture(raw, &canonical, &failure, &metrics)
        && failure == c08::FailureCode::none;
}

bool generic_fails(std::string_view raw, c08::FailureCode expected) {
    std::string canonical;
    c08::FailureCode failure = c08::FailureCode::none;
    c08::Metrics metrics{};
    return !c08::canonicalize_fixture(raw, &canonical, &failure, &metrics)
        && failure == expected;
}

std::string nested_arrays(std::size_t count) {
    return std::string(count, '[') + "0" + std::string(count, ']');
}

std::string array_of(std::size_t count, std::string_view value = "null") {
    std::string result = "[";
    for (std::size_t index = 0; index < count; ++index) {
        if (index != 0U) result.push_back(',');
        result.append(value);
    }
    result.push_back(']');
    return result;
}

std::string object_of(std::size_t count) {
    std::string result = "{";
    for (std::size_t index = 0; index < count; ++index) {
        if (index != 0U) result.push_back(',');
        result += "\"k" + std::to_string(index) + "\":null";
    }
    result.push_back('}');
    return result;
}

std::string node_boundary(std::size_t last_array_size) {
    std::string result = "[";
    for (std::size_t index = 0; index < 16U; ++index) {
        if (index != 0U) result.push_back(',');
        result += array_of(index < 15U ? 64U : last_array_size);
    }
    result.push_back(']');
    return result;
}

}  // namespace

int main() {
    std::vector<bool> checks;
    const std::string borel = read_binary("/fixture/borel-contract.v1.json");
    c08::Result exact{};
    checks.push_back(c08::validate_exact_borel_contract(borel, &exact));
    checks.push_back(exact.accepted
        && exact.raw_sha256 == "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737"
        && exact.canonical_sha256 == "665b6d9ddd9d2108274652414ec9d6a0a2fb43f86f28ab3ab64db70003c7f520"
        && exact.canonical_bytes == 49780U);
    checks.push_back(exact.metrics.raw_input_bytes == 54972U
        && exact.metrics.canonical_output_bytes == 49780U
        && exact.metrics.maximum_depth == 4U
        && exact.metrics.total_value_nodes == 746U
        && exact.metrics.maximum_members_in_one_object == 25U
        && exact.metrics.maximum_elements_in_one_array == 23U
        && exact.metrics.maximum_decoded_string_utf8_bytes == 436U
        && exact.metrics.maximum_decoded_object_key_utf8_bytes == 51U);
    checks.push_back(exact.candidate_evaluations == 0U
        && exact.positive_parameter_samples == 0U
        && !exact.candidate_root_created && !exact.authority_promoted);

    std::string mutation = borel;
    const std::size_t schema = mutation.find("schema");
    if (schema != std::string::npos) mutation[schema] = 't';
    c08::Result mutated{};
    checks.push_back(!c08::validate_exact_borel_contract(mutation, &mutated)
        && mutated.failure == c08::FailureCode::raw_identity);

    const std::string raw_limit = "{}" + std::string(65534U, ' ');
    checks.push_back(generic_ok(raw_limit, "{}"));
    checks.push_back(generic_fails(raw_limit + " ", c08::FailureCode::raw_input_resource));
    checks.push_back(generic_fails(std::string("\xef\xbb\xbf{}", 5),
        c08::FailureCode::bom_or_invalid_utf8));
    checks.push_back(generic_fails(std::string("\"") + static_cast<char>(0xffU) + "\"",
        c08::FailureCode::bom_or_invalid_utf8));
    checks.push_back(generic_fails("{}{}", c08::FailureCode::json_lexical_or_trailing));
    checks.push_back(generic_fails("\"\\x\"", c08::FailureCode::json_lexical_or_trailing));
    checks.push_back(generic_fails("\"\\ud800\"", c08::FailureCode::json_lexical_or_trailing));
    checks.push_back(generic_fails("\"\\udc00\"", c08::FailureCode::json_lexical_or_trailing));
    checks.push_back(generic_ok("{\"rocket\":\"\\ud83d\\ude80\"}",
        std::string("{\"rocket\":\"") + "\xf0\x9f\x9a\x80" + "\"}"));
    checks.push_back(generic_fails("{\"a\":1,\"a\":2}", c08::FailureCode::duplicate_key));
    checks.push_back(generic_fails("{\"a\":1,\"\\u0061\":2}", c08::FailureCode::duplicate_key));
    checks.push_back(generic_fails("{\"\\u00e9\":1}", c08::FailureCode::contract_key));
    checks.push_back(generic_fails("{\"\":1}", c08::FailureCode::contract_key));
    checks.push_back(generic_ok(nested_arrays(8U), nested_arrays(8U)));
    checks.push_back(generic_fails(nested_arrays(9U), c08::FailureCode::structural_resource));
    checks.push_back(generic_ok(node_boundary(47U), node_boundary(47U)));
    checks.push_back(generic_fails(node_boundary(48U), c08::FailureCode::structural_resource));
    checks.push_back(generic_accepts(object_of(64U)));
    checks.push_back(generic_fails(object_of(65U), c08::FailureCode::structural_resource));
    checks.push_back(generic_ok(array_of(64U), array_of(64U)));
    checks.push_back(generic_fails(array_of(65U), c08::FailureCode::structural_resource));
    checks.push_back(generic_ok("\"" + std::string(1024U, 'a') + "\"",
        "\"" + std::string(1024U, 'a') + "\""));
    checks.push_back(generic_fails("\"" + std::string(1025U, 'a') + "\"",
        c08::FailureCode::structural_resource));
    checks.push_back(generic_ok("{\"" + std::string(128U, 'a') + "\":0}",
        "{\"" + std::string(128U, 'a') + "\":0}"));
    checks.push_back(generic_fails("{\"" + std::string(129U, 'a') + "\":0}",
        c08::FailureCode::structural_resource));
    checks.push_back(c08::fixture_cumulative_string_counter(65535U, 1U)
        && !c08::fixture_cumulative_string_counter(65535U, 2U)
        && !c08::fixture_cumulative_string_counter(
            std::numeric_limits<std::size_t>::max(), 1U));
    checks.push_back(generic_fails(std::string(64U, '9'), c08::FailureCode::number_semantics));
    checks.push_back(generic_fails(std::string(65U, '9'), c08::FailureCode::structural_resource));
    checks.push_back(generic_fails("9007199254740992", c08::FailureCode::number_semantics));
    checks.push_back(generic_fails("1e400", c08::FailureCode::number_semantics));
    checks.push_back(generic_ok("[1e-400,-1e-400]", "[0,0]"));
    checks.push_back(generic_ok("{\"b\":\"\\/\\u000f\",\"a\":-0}",
        "{\"a\":0,\"b\":\"/\\u000f\"}"));
    checks.push_back(generic_ok("[1e-7,1e-6,1e20,1e21,-0,333333333.33333329]",
        "[1e-7,0.000001,100000000000000000000,1e+21,0,333333333.3333333]"));
    checks.push_back(!c08::canonicalize_fixture("{}", nullptr, nullptr, nullptr));
    checks.push_back(std::string(c08::failure_name(c08::FailureCode::canonical_identity))
        == "C08-002_CANONICAL_IDENTITY");

    std::size_t passed = 0;
    std::uint64_t mask = 0;
    for (std::size_t index = 0; index < checks.size(); ++index) {
        if (checks[index]) {
            ++passed;
            if (index < 64U) mask |= (std::uint64_t{1} << index);
        }
    }
    std::cout << "{\"authority_promoted\":false,\"candidate_evaluations\":0,"
        "\"candidate_roots_created\":false,\"checks_passed\":" << passed
        << ",\"checks_total\":" << checks.size() << ",\"fixture_mask\":" << mask
        << ",\"positive_parameter_samples\":0,"
        "\"schema\":\"nhm2.g2h_e_s5.primary_c08_canonical_ingress_fixture.v1\","
        "\"scientific_handler_linked\":false,\"status\":\""
        << (passed == checks.size() ? "PASS" : "FAIL") << "\"}\n";
    return passed == checks.size() ? 0 : 1;
}
