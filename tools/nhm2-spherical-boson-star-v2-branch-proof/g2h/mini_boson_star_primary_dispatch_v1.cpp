#include "mini_boson_star_primary_dispatch_v1.hpp"

#include <array>
#include <cstring>
#include <limits>

namespace nhm2::g2h_e_s5::primary_dispatch_v1 {
namespace {

constexpr std::array<const char *, duty_count> kDuties = {
    "R2-C01","R2-C02","R2-C03","R2-C04","R2-C05","R2-C06","R2-C07",
    "R2-C08","R2-C09","R2-C10","R2-C11","R2-C12","R2-C13","R2-C14",
    "R2-C15","R2-Q01","R2-Q02","R2-Q03","R2-Q04","R2-Q05","R2-Q06",
};

bool safe_failure(const char *value) {
    if (value == nullptr) return false;
    const std::size_t length = std::strlen(value);
    if (length == 0U || length > 96U) return false;
    for (std::size_t index = 0; index < length; ++index) {
        const char c = value[index];
        if (!((c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_')) return false;
    }
    return true;
}

bool deferred_ordinal(std::size_t ordinal) { return ordinal == 14U || ordinal == 20U; }

struct FixtureContext {
    std::size_t calls;
    std::size_t fail_at;
    bool invalid;
};

HandlerResult fixture_handler(void *opaque) {
    auto *context = static_cast<FixtureContext *>(opaque);
    const std::size_t ordinal = context->calls++;
    if (context->invalid && ordinal == context->fail_at) return {true, "NOT_NONE"};
    if (ordinal == context->fail_at) return {false, "SYNTHETIC_DUTY_FAILURE"};
    return {true, "NONE"};
}

std::array<Handler, primary_handler_count> fixture_handlers() {
    std::array<Handler, primary_handler_count> handlers{};
    handlers.fill(&fixture_handler);
    return handlers;
}

bool all_pass_fixture() {
    auto handlers = fixture_handlers();
    std::array<DutyResult, duty_count> results{};
    FixtureContext context{0U, std::numeric_limits<std::size_t>::max(), false};
    std::size_t called = 0U, failure = 0U;
    if (!run_dispatch(results.data(), results.size(), handlers.data(), handlers.size(),
        &context, &called, &failure)) return false;
    if (called != primary_handler_count || context.calls != primary_handler_count
        || failure != duty_count) return false;
    for (std::size_t ordinal = 0; ordinal < duty_count; ++ordinal) {
        const Decision expected = deferred_ordinal(ordinal) ? Decision::deferred_independent : Decision::pass;
        if (results[ordinal].decision != expected || std::strcmp(results[ordinal].duty, kDuties[ordinal]) != 0) return false;
    }
    return true;
}

bool first_failure_fixture() {
    auto handlers = fixture_handlers();
    std::array<DutyResult, duty_count> results{};
    FixtureContext context{0U, 2U, false};
    std::size_t called = 0U, failure = 0U;
    if (!run_dispatch(results.data(), results.size(), handlers.data(), handlers.size(),
        &context, &called, &failure)) return false;
    if (called != 3U || context.calls != 3U || failure != 2U
        || results[2].decision != Decision::fail) return false;
    for (std::size_t ordinal = 3U; ordinal < duty_count; ++ordinal) {
        if (results[ordinal].decision != Decision::ineligible_after_first_fail) return false;
    }
    return true;
}

bool missing_handler_fixture() {
    auto handlers = fixture_handlers();
    handlers[4] = nullptr;
    std::array<DutyResult, duty_count> results{};
    FixtureContext context{0U, std::numeric_limits<std::size_t>::max(), false};
    std::size_t called = 0U, failure = 0U;
    return run_dispatch(results.data(), results.size(), handlers.data(), handlers.size(),
        &context, &called, &failure) && called == 4U && context.calls == 4U
        && failure == 4U && results[4].decision == Decision::fail
        && std::strcmp(results[4].failure, "HANDLER_ABSENT") == 0
        && results[5].decision == Decision::ineligible_after_first_fail;
}

bool invalid_handler_fixture() {
    auto handlers = fixture_handlers();
    std::array<DutyResult, duty_count> results{};
    FixtureContext context{0U, 1U, true};
    std::size_t called = 0U, failure = 0U;
    return run_dispatch(results.data(), results.size(), handlers.data(), handlers.size(),
        &context, &called, &failure) && called == 2U && failure == 1U
        && results[1].decision == Decision::fail
        && std::strcmp(results[1].failure, "INVALID_HANDLER_RESULT") == 0;
}

bool shape_rejection_fixture() {
    auto handlers = fixture_handlers();
    std::array<DutyResult, duty_count> results{};
    FixtureContext context{0U, std::numeric_limits<std::size_t>::max(), false};
    std::size_t called = 0U, failure = 0U;
    return !run_dispatch(nullptr, results.size(), handlers.data(), handlers.size(), &context, &called, &failure)
        && !run_dispatch(results.data(), results.size() - 1U, handlers.data(), handlers.size(), &context, &called, &failure)
        && !run_dispatch(results.data(), results.size(), nullptr, handlers.size(), &context, &called, &failure)
        && !run_dispatch(results.data(), results.size(), handlers.data(), handlers.size() - 1U, &context, &called, &failure)
        && !run_dispatch(results.data(), results.size(), handlers.data(), handlers.size(), &context, nullptr, &failure)
        && !run_dispatch(results.data(), results.size(), handlers.data(), handlers.size(), &context, &called, nullptr);
}

std::array<bool, 5> fixture_results() {
    return {all_pass_fixture(), first_failure_fixture(), missing_handler_fixture(),
        invalid_handler_fixture(), shape_rejection_fixture()};
}

} // namespace

const char *decision_name(Decision decision) {
    switch (decision) {
        case Decision::pass: return "PASS";
        case Decision::fail: return "FAIL";
        case Decision::ineligible_after_first_fail: return "INELIGIBLE_AFTER_FIRST_FAIL";
        case Decision::deferred_independent: return "DEFERRED_INDEPENDENT";
    }
    return "INVALID";
}

bool run_dispatch(DutyResult *results, std::size_t result_capacity,
    const Handler *handlers, std::size_t handler_capacity, void *context,
    std::size_t *handlers_called, std::size_t *first_failure_ordinal) {
    if (results == nullptr || result_capacity != duty_count || handlers == nullptr
        || handler_capacity != primary_handler_count || handlers_called == nullptr
        || first_failure_ordinal == nullptr) return false;
    *handlers_called = 0U;
    *first_failure_ordinal = duty_count;
    bool failed = false;
    std::size_t handler_ordinal = 0U;
    for (std::size_t ordinal = 0U; ordinal < duty_count; ++ordinal) {
        results[ordinal].duty = kDuties[ordinal];
        if (failed) {
            results[ordinal].decision = Decision::ineligible_after_first_fail;
            results[ordinal].failure = "PRIOR_FIRST_FAILURE";
            continue;
        }
        if (deferred_ordinal(ordinal)) {
            results[ordinal].decision = Decision::deferred_independent;
            results[ordinal].failure = "INDEPENDENT_LANE_REQUIRED";
            continue;
        }
        const Handler handler = handlers[handler_ordinal++];
        if (handler == nullptr) {
            results[ordinal].decision = Decision::fail;
            results[ordinal].failure = "HANDLER_ABSENT";
            *first_failure_ordinal = ordinal;
            failed = true;
            continue;
        }
        const HandlerResult result = handler(context);
        ++*handlers_called;
        if (!safe_failure(result.failure) || (result.pass && std::strcmp(result.failure, "NONE") != 0)
            || (!result.pass && std::strcmp(result.failure, "NONE") == 0)) {
            results[ordinal].decision = Decision::fail;
            results[ordinal].failure = "INVALID_HANDLER_RESULT";
            *first_failure_ordinal = ordinal;
            failed = true;
        } else if (!result.pass) {
            results[ordinal].decision = Decision::fail;
            results[ordinal].failure = result.failure;
            *first_failure_ordinal = ordinal;
            failed = true;
        } else {
            results[ordinal].decision = Decision::pass;
            results[ordinal].failure = "NONE";
        }
    }
    return handler_ordinal <= primary_handler_count;
}

std::size_t fixture_count() { return 5U; }
std::size_t fixtures_passed() {
    const auto checks = fixture_results();
    std::size_t passed = 0U;
    for (const bool value : checks) passed += value ? 1U : 0U;
    return passed;
}
bool run_dispatch_fixture_suite() { return fixtures_passed() == fixture_count(); }

} // namespace nhm2::g2h_e_s5::primary_dispatch_v1
