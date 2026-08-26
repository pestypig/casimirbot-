#![forbid(unsafe_code)]

#[derive(Clone, Copy)]
struct Spec {
    role: &'static str,
    counter: &'static str,
    limit: u32,
}

const SPECS: [Spec; 32] = [
    Spec { role: "classical_inverse", counter: "maximum_dimension", limit: 2050 },
    Spec { role: "classical_inverse", counter: "QR_factorizations", limit: 1 },
    Spec { role: "classical_inverse", counter: "triangular_solves", limit: 2050 },
    Spec { role: "classical_inverse", counter: "projection_retries", limit: 0 },
    Spec { role: "classical_inverse", counter: "maximum_modular_primes_per_determinant", limit: 32768 },
    Spec { role: "classical_inverse", counter: "determinants", limit: 2 },
    Spec { role: "continuation", counter: "cells", limit: 1024 },
    Spec { role: "continuation", counter: "inverse_builds_per_cell", limit: 1 },
    Spec { role: "continuation", counter: "radii_per_cell", limit: 73 },
    Spec { role: "continuation", counter: "adaptive_subdivisions", limit: 0 },
    Spec { role: "continuation", counter: "alternate_predictors", limit: 0 },
    Spec { role: "stability", counter: "cells", limit: 256 },
    Spec { role: "stability", counter: "K_degree", limit: 14 },
    Spec { role: "stability", counter: "Gauss_Legendre_steps_per_cell", limit: 40 },
    Spec { role: "stability", counter: "Newton_Krylov_sweeps", limit: 20 },
    Spec { role: "stability", counter: "Krylov_vectors_per_sweep", limit: 96 },
    Spec { role: "stability", counter: "jump_offset_ordinals", limit: 65537 },
    Spec { role: "stability", counter: "trial_degree", limit: 18 },
    Spec { role: "stability", counter: "Lanczos_steps", limit: 80 },
    Spec { role: "stability", counter: "L_exponent_magnitude", limit: 96 },
    Spec { role: "quantum", counter: "ell_max_inclusive", limit: 287 },
    Spec { role: "quantum", counter: "Hadamard_WKB_order", limit: 22 },
    Spec { role: "quantum", counter: "radial_degree", limit: 28 },
    Spec { role: "quantum", counter: "Taylor_steps_per_cell", limit: 48 },
    Spec { role: "quantum", counter: "kappa_panels", limit: 1536 },
    Spec { role: "quantum", counter: "kappa_nodes_per_panel", limit: 24 },
    Spec { role: "quantum", counter: "energy_panels", limit: 2304 },
    Spec { role: "quantum", counter: "energy_nodes_per_panel", limit: 24 },
    Spec { role: "quantum", counter: "limiting_absorption_levels", limit: 9 },
    Spec { role: "quantum", counter: "adaptive_panels", limit: 0 },
    Spec { role: "quantum", counter: "target_total_width_exponent_magnitude", limit: 120 },
    Spec { role: "quantum", counter: "per_tail_target_exponent_magnitude", limit: 132 },
];

enum State {
    Open { remaining: u32 },
    Failed { typed: String, ineligible: u32 },
}

fn step(spec: Spec, state: State) -> (State, bool) {
    match state {
        State::Open { remaining } => {
            if remaining > 0 {
                (State::Open { remaining: remaining - 1 }, true)
            } else {
                (
                    State::Failed {
                        typed: format!("builder_budget_exhausted:{}:{}", spec.role, spec.counter),
                        ineligible: 0,
                    },
                    false,
                )
            }
        }
        State::Failed { typed, ineligible } => (
            State::Failed { typed, ineligible: ineligible + 1 }, false
        ),
    }
}

pub fn counter_count() -> usize { SPECS.len() }

pub fn run_budget_fixture_suite() -> bool {
    let mut pass = counter_count() == 32;
    for spec in SPECS {
        let mut state = State::Open { remaining: spec.limit };
        for _ in 0..spec.limit {
            let (next, admitted) = step(spec, state);
            pass &= admitted;
            state = next;
        }
        let (next, admitted) = step(spec, state);
        pass &= !admitted;
        let (terminal, admitted_again) = step(spec, next);
        pass &= !admitted_again;
        match terminal {
            State::Failed { typed, ineligible } => {
                pass &= typed == format!("builder_budget_exhausted:{}:{}", spec.role, spec.counter);
                pass &= ineligible == 1;
            }
            State::Open { .. } => pass = false,
        }
    }
    pass
}
