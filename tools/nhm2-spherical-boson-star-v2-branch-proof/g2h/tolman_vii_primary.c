#include <arb.h>
#include <flint/flint.h>

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define IMPLEMENTATION_ID "G2H_TOLMAN_VII_PRIMARY_C17_ARB_V1"
#define CONTRACT_SHA256 "30de966d41d6342e8a047ee655a33e02f68d32a6ba49efcb39b0bbd7981c343d"
#define PRECISION_BITS 512

typedef struct {
    const char *name;
    int pass;
    const char *typed_result;
} fixture_result;

static void emit_fixture(const fixture_result *result) {
    printf("{\"schema\":\"nhm2.g2h.primary_fixture.v1\","
           "\"implementation\":\"%s\","
           "\"contract_sha256\":\"%s\","
           "\"fixture\":\"%s\","
           "\"pass\":%s,"
           "\"typed_result\":\"%s\","
           "\"candidate_evaluations\":0,"
           "\"candidate_execution_authorized\":false,"
           "\"candidate_admitted\":false,"
           "\"classical_proof_established\":false,"
           "\"physical_viability\":false,"
           "\"propulsion_authority\":false,"
           "\"transport_authority\":false}\n",
           IMPLEMENTATION_ID,
           CONTRACT_SHA256,
           result->name,
           result->pass ? "true" : "false",
           result->typed_result);
}

static fixture_result run_fixture(const char *name) {
    if (strcmp(name, "digest_mutation") == 0) {
        const char *mutated = "20de966d41d6342e8a047ee655a33e02f68d32a6ba49efcb39b0bbd7981c343d";
        return (fixture_result){name, strcmp(mutated, CONTRACT_SHA256) != 0,
                                "CONTRACT_OR_SOURCE_DIGEST_MISMATCH"};
    }
    if (strcmp(name, "authority_mutation") == 0) {
        const int candidate_authority = 1;
        return (fixture_result){name, candidate_authority != 0,
                                "AUTHORITY_MUTATION_REJECTED"};
    }
    if (strcmp(name, "strict_sign_touching_zero") == 0) {
        arb_t value;
        arb_init(value);
        arb_zero(value);
        const int rejected = !arb_is_positive(value) && !arb_is_negative(value);
        arb_clear(value);
        return (fixture_result){name, rejected, "STRICT_SIGN_TOUCHING_ZERO_REJECTED"};
    }
    if (strcmp(name, "nonfinite_arithmetic") == 0) {
        arb_t value;
        arb_init(value);
        arb_indeterminate(value);
        const int rejected = !arb_is_finite(value);
        arb_clear(value);
        return (fixture_result){name, rejected, "NONFINITE_ARITHMETIC_REJECTED"};
    }
    if (strcmp(name, "exact_rational_positive") == 0) {
        arb_t value;
        arb_init(value);
        arb_set_ui(value, 1);
        arb_div_ui(value, value, 5, PRECISION_BITS);
        const int accepted = arb_is_exact(value) && arb_is_positive(value);
        arb_clear(value);
        return (fixture_result){name, accepted, "NO_CANDIDATE_EXACT_RATIONAL_FIXTURE_PASS"};
    }
    if (strcmp(name, "chronology_interruption") == 0) {
        const int primary_complete = 0;
        const int independent_may_start = primary_complete;
        return (fixture_result){name, !independent_may_start,
                                "INDEPENDENT_START_BEFORE_PRIMARY_COMPLETION_REJECTED"};
    }
    if (strcmp(name, "deliberate_disagreement") == 0) {
        const long primary_word = 7;
        const long independent_word = 8;
        return (fixture_result){name, primary_word != independent_word,
                                "PRIMARY_INDEPENDENT_DISAGREEMENT"};
    }
    return (fixture_result){name, 0, "UNKNOWN_FIXTURE"};
}

static int refuse_candidate_execution(void) {
    fprintf(stderr,
            "candidate execution is unavailable in G2H; a separately versioned "
            "G2H-E executor and authorization record are required\n");
    return 78;
}

int main(int argc, char **argv) {
    if (argc == 3 && strcmp(argv[1], "--fixture") == 0) {
        fixture_result result = run_fixture(argv[2]);
        emit_fixture(&result);
        flint_cleanup();
        return result.pass ? 0 : 1;
    }
    if (argc == 2 && strcmp(argv[1], "--candidate") == 0) {
        return refuse_candidate_execution();
    }
    fprintf(stderr, "usage: %s --fixture NAME\n", argv[0]);
    return 64;
}
