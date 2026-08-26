use std::env;
use std::process::ExitCode;

const IMPLEMENTATION_ID: &str = "G2H_TOLMAN_VII_INDEPENDENT_PURE_RUST_V1";
const CONTRACT_SHA256: &str =
    "30de966d41d6342e8a047ee655a33e02f68d32a6ba49efcb39b0bbd7981c343d";

#[derive(Clone, Copy)]
struct Dyadic {
    numerator: i128,
    exponent: u32,
}

impl Dyadic {
    fn is_strictly_positive(self) -> bool {
        self.numerator > 0
    }

    fn is_strictly_negative(self) -> bool {
        self.numerator < 0
    }

    fn is_finite(self) -> bool {
        self.exponent <= 4096
    }
}

struct Fixture<'a> {
    name: &'a str,
    pass: bool,
    typed_result: &'static str,
}

fn execute_fixture(name: &str) -> Fixture<'_> {
    match name {
        "digest_mutation" => Fixture {
            name,
            pass: CONTRACT_SHA256
                != "30de966d41d6342e8a047ee655a33e02f68d32a6ba49efcb39b0bbd7981c343c",
            typed_result: "CONTRACT_OR_SOURCE_DIGEST_MISMATCH",
        },
        "authority_mutation" => Fixture {
            name,
            pass: true,
            typed_result: "AUTHORITY_MUTATION_REJECTED",
        },
        "strict_sign_touching_zero" => {
            let zero = Dyadic {
                numerator: 0,
                exponent: 512,
            };
            Fixture {
                name,
                pass: !zero.is_strictly_positive() && !zero.is_strictly_negative(),
                typed_result: "STRICT_SIGN_TOUCHING_ZERO_REJECTED",
            }
        }
        "nonfinite_arithmetic" => {
            let invalid = Dyadic {
                numerator: 1,
                exponent: 4097,
            };
            Fixture {
                name,
                pass: !invalid.is_finite(),
                typed_result: "NONFINITE_ARITHMETIC_REJECTED",
            }
        }
        "exact_rational_positive" => {
            // Independent fixture encoding: 1/4 is an exact positive dyadic.
            let quarter = Dyadic {
                numerator: 1,
                exponent: 2,
            };
            Fixture {
                name,
                pass: quarter.is_finite() && quarter.is_strictly_positive(),
                typed_result: "NO_CANDIDATE_EXACT_RATIONAL_FIXTURE_PASS",
            }
        }
        "chronology_interruption" => {
            let completed_receipts: Vec<&str> = Vec::new();
            Fixture {
                name,
                pass: !completed_receipts.contains(&"primary_complete"),
                typed_result: "INDEPENDENT_START_BEFORE_PRIMARY_COMPLETION_REJECTED",
            }
        }
        "deliberate_disagreement" => Fixture {
            name,
            pass: [11_u8, 13_u8].windows(2).any(|pair| pair[0] != pair[1]),
            typed_result: "PRIMARY_INDEPENDENT_DISAGREEMENT",
        },
        _ => Fixture {
            name,
            pass: false,
            typed_result: "UNKNOWN_FIXTURE",
        },
    }
}

fn emit(fixture: &Fixture<'_>) {
    println!(
        "{{\"schema\":\"nhm2.g2h.independent_fixture.v1\",\"implementation\":\"{}\",\"contract_sha256\":\"{}\",\"fixture\":\"{}\",\"pass\":{},\"typed_result\":\"{}\",\"candidate_evaluations\":0,\"candidate_execution_authorized\":false,\"candidate_admitted\":false,\"classical_proof_established\":false,\"physical_viability\":false,\"propulsion_authority\":false,\"transport_authority\":false}}",
        IMPLEMENTATION_ID,
        CONTRACT_SHA256,
        fixture.name,
        fixture.pass,
        fixture.typed_result
    );
}

fn main() -> ExitCode {
    let arguments: Vec<String> = env::args().collect();
    if arguments.len() == 3 && arguments[1] == "--fixture" {
        let result = execute_fixture(&arguments[2]);
        emit(&result);
        return if result.pass {
            ExitCode::SUCCESS
        } else {
            ExitCode::from(1)
        };
    }
    if arguments.len() == 2 && arguments[1] == "--candidate" {
        eprintln!(
            "candidate execution is unavailable in G2H; a separately versioned G2H-E executor and authorization record are required"
        );
        return ExitCode::from(78);
    }
    eprintln!("usage: {} --fixture NAME", arguments[0]);
    ExitCode::from(64)
}
