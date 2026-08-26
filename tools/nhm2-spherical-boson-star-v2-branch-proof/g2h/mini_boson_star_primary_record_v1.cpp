#include "mini_boson_star_primary_record_v1.hpp"
#include "mini_boson_star_sha256_v1.hpp"

#include <array>
#include <string>
#include <vector>

namespace nhm2::g2h_e_s5::primary_record_v1 {
namespace {
struct Record {
    std::string duty;
    std::string decision;
    std::string failure;
    std::string predecessor;
    std::string self;
    unsigned candidate_evaluations;
};

constexpr std::array<const char *, 21> duties = {
    "R2-C01","R2-C02","R2-C03","R2-C04","R2-C05","R2-C06","R2-C07",
    "R2-C08","R2-C09","R2-C10","R2-C11","R2-C12","R2-C13","R2-C14",
    "R2-C15","R2-Q01","R2-Q02","R2-Q03","R2-Q04","R2-Q05","R2-Q06",
};

bool known_duty(const std::string &value) {
    for (const char *duty : duties) if (value == duty) return true;
    return false;
}

bool known_decision(const std::string &value) {
    return value == "PASS" || value == "FAIL" || value == "INELIGIBLE_AFTER_FIRST_FAIL"
        || value == "DEFERRED_INDEPENDENT";
}

bool safe_token(const std::string &value) {
    if (value.empty() || value.size() > 96U) return false;
    for (const char c : value) if (!((c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_')) return false;
    return true;
}

std::string payload(const Record &record) {
    return "{\"candidate_evaluations\":" + std::to_string(record.candidate_evaluations)
        + ",\"decision\":\"" + record.decision + "\",\"duty\":\"" + record.duty
        + "\",\"failure\":\"" + record.failure + "\",\"predecessor_sha256\":\""
        + record.predecessor + "\"}";
}

bool construct(Record &record, const std::string &duty, const std::string &decision,
    const std::string &failure, const std::string &predecessor) {
    if (!known_duty(duty) || !known_decision(decision) || !safe_token(failure)
        || (!predecessor.empty() && predecessor.size() != 64U)) return false;
    record = {duty, decision, failure, predecessor, "", 0U};
    record.self = nhm2::g2h_e_s5::sha256_v1::text("nhm2-g2h-e-s5/record/v1\n" + payload(record));
    return true;
}

bool verify(const Record &record, const std::string &expected_predecessor) {
    return record.candidate_evaluations == 0U && record.predecessor == expected_predecessor
        && record.self == nhm2::g2h_e_s5::sha256_v1::text("nhm2-g2h-e-s5/record/v1\n" + payload(record));
}

bool chain_fixture() {
    std::vector<Record> records;
    std::string predecessor;
    for (std::size_t index = 0; index < duties.size(); ++index) {
        const std::string decision = index == 0U ? "PASS" : (index == 1U ? "FAIL" : "INELIGIBLE_AFTER_FIRST_FAIL");
        const std::string failure = index == 0U ? "NONE" : (index == 1U ? "SYNTHETIC_FIRST_FAILURE" : "PRIOR_FIRST_FAILURE");
        Record record;
        if (!construct(record, duties[index], decision, failure, predecessor) || !verify(record, predecessor)) return false;
        predecessor = record.self;
        records.push_back(record);
    }
    return records.size() == duties.size() && records.front().predecessor.empty()
        && records.back().decision == "INELIGIBLE_AFTER_FIRST_FAIL";
}

bool corruption_fixture() {
    Record record;
    if (!construct(record, "R2-C01", "PASS", "NONE", "")) return false;
    record.decision = "FAIL";
    Record invalid;
    return !verify(record, "") && !construct(invalid, "R2-X99", "PASS", "NONE", "")
        && !construct(invalid, "R2-C01", "MAYBE", "NONE", "")
        && !construct(invalid, "R2-C01", "PASS", "unsafe-token", "");
}
} // namespace

std::size_t fixture_count() { return 2U; }
std::size_t fixtures_passed() { return (chain_fixture() ? 1U : 0U) + (corruption_fixture() ? 1U : 0U); }
bool run_record_fixture_suite() { return fixtures_passed() == fixture_count(); }
} // namespace nhm2::g2h_e_s5::primary_record_v1
