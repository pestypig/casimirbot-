#include "mini_boson_star_budget_primary.hpp"

#include <cstdint>
#include <string>

namespace nhm2::g2h_e_s4::primary_budget {
namespace {

struct Spec {
    const char *role;
    const char *counter;
    uint32_t limit;
};

constexpr Spec kSpecs[] = {
    {"classical_inverse", "maximum_dimension", 2050},
    {"classical_inverse", "LU_factorizations", 1},
    {"classical_inverse", "triangular_solves", 2050},
    {"classical_inverse", "projection_retries", 0},
    {"classical_inverse", "Bareiss_determinants", 2},
    {"continuation", "cells", 1024},
    {"continuation", "inverse_builds_per_cell", 1},
    {"continuation", "radii_per_cell", 73},
    {"continuation", "adaptive_subdivisions", 0},
    {"continuation", "alternate_predictors", 0},
    {"stability", "cells", 256},
    {"stability", "K_degree", 12},
    {"stability", "implicit_midpoint_steps_per_cell", 32},
    {"stability", "Newton_sweeps", 16},
    {"stability", "jump_repairs", 1},
    {"stability", "trial_degree", 16},
    {"stability", "inverse_iterations", 64},
    {"stability", "L_exponent_magnitude", 96},
    {"quantum", "ell_max_inclusive", 255},
    {"quantum", "Hadamard_WKB_order", 20},
    {"quantum", "radial_degree", 24},
    {"quantum", "kappa_panels", 1024},
    {"quantum", "kappa_nodes_per_panel", 32},
    {"quantum", "energy_panels", 2048},
    {"quantum", "energy_nodes_per_panel", 32},
    {"quantum", "limiting_absorption_levels", 9},
    {"quantum", "adaptive_panels", 0},
    {"quantum", "target_total_width_exponent_magnitude", 120},
    {"quantum", "per_tail_target_exponent_magnitude", 132},
};

class Ledger {
public:
    explicit Ledger(const Spec &spec) : spec_(spec) {}

    bool consume() {
        if (failed_) {
            ++ineligible_calls_;
            return false;
        }
        if (used_ == spec_.limit) {
            failed_ = true;
            failure_ = std::string("builder_budget_exhausted:") + spec_.role + ":" + spec_.counter;
            return false;
        }
        ++used_;
        return true;
    }

    bool valid_terminal() const {
        const std::string expected = std::string("builder_budget_exhausted:")
            + spec_.role + ":" + spec_.counter;
        return failed_ && used_ == spec_.limit && ineligible_calls_ == 1U
            && failure_ == expected;
    }

private:
    const Spec &spec_;
    uint32_t used_ = 0;
    uint32_t ineligible_calls_ = 0;
    bool failed_ = false;
    std::string failure_;
};

}  // namespace

std::size_t counter_count() { return sizeof(kSpecs) / sizeof(kSpecs[0]); }

bool run_budget_fixture_suite() {
    bool pass = counter_count() == 29U;
    for (const Spec &spec : kSpecs) {
        Ledger ledger(spec);
        for (uint32_t count = 0; count < spec.limit; ++count) {
            pass = pass && ledger.consume();
        }
        pass = pass && !ledger.consume();
        pass = pass && !ledger.consume();
        pass = pass && ledger.valid_terminal();
    }
    return pass;
}

}  // namespace nhm2::g2h_e_s4::primary_budget
