#pragma once

#include <cstddef>

namespace nhm2::g2h_e_s5::primary_dispatch_v1 {

constexpr std::size_t duty_count = 21U;
constexpr std::size_t primary_handler_count = 19U;

enum class Decision {
    pass,
    fail,
    ineligible_after_first_fail,
    deferred_independent,
};

struct HandlerResult {
    bool pass;
    const char *failure;
};

using Handler = HandlerResult (*)(void *context);

struct DutyResult {
    const char *duty;
    Decision decision;
    const char *failure;
};

const char *decision_name(Decision decision);

// Handler order is C01..C14,Q01..Q05. C15 and Q06 are never dispatched by
// the primary scheduler and are emitted as deferred-independent only if no
// earlier scientific failure occurred.
bool run_dispatch(DutyResult *results, std::size_t result_capacity,
    const Handler *handlers, std::size_t handler_capacity, void *context,
    std::size_t *handlers_called, std::size_t *first_failure_ordinal);

std::size_t fixture_count();
std::size_t fixtures_passed();
bool run_dispatch_fixture_suite();

} // namespace nhm2::g2h_e_s5::primary_dispatch_v1
